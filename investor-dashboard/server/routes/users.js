'use strict';
const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();
const prisma  = require('../lib/prisma');
const { send, inviteHtml } = require('../../../lib/mailer');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { writeAudit } = require('../middleware/audit');

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
function frontendUrl() {
  return (process.env.FRONTEND_URL || 'https://feynegoce.com').replace(/\/$/, '');
}

async function issueInviteToken(userId) {
  const rawToken = generateToken();
  const expires  = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours for invites
  await prisma.user.update({
    where: { id: userId },
    data: {
      resetTokenHash:    hashToken(rawToken),
      resetTokenExpires: expires,
      resetTokenPurpose: 'invite',
    },
  });
  return `${frontendUrl()}/dashboard/setup-password/${rawToken}`;
}

// GET /api/v1/users  (admin)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const rawUsers = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, notificationPrefs: true, passwordHash: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    const users = rawUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      pending: !u.passwordHash,
      notificationPrefs: typeof u.notificationPrefs === 'string' ? JSON.parse(u.notificationPrefs) : u.notificationPrefs,
    }));
    res.json({ ok: true, users });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// POST /api/v1/users  (admin — invite new user by email)
router.post('/', requireAdmin, async (req, res) => {
  const { email, name, role } = req.body;
  if (!email?.trim() || !name?.trim()) {
    return res.status(400).json({ ok: false, error: 'Email and name are required.' });
  }
  if (role && !['admin', 'investor'].includes(role)) {
    return res.status(400).json({ ok: false, error: 'Role must be admin or investor.' });
  }
  try {
    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash: null,
        name: name.trim(),
        role: role || 'investor',
        notificationPrefs: JSON.stringify({ new_shipment: true, milestone: true, eta_update: true, new_sale: true, financial_report: true }),
      },
    });
    const link = await issueInviteToken(user.id);
    const result = await send({
      to:      user.email,
      subject: '[Feynegoce] You have been invited to the Investor Dashboard',
      html:    inviteHtml(user.name, req.user.name, link),
    });
    await writeAudit({ userId: req.user.id, action: 'create', entityType: 'user', entityId: user.id, newValues: { email: user.email, name: user.name, role: user.role, invited: true } });
    res.status(201).json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt, pending: true },
      mail: result.ok ? 'sent' : 'failed',
    });
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ ok: false, error: 'A user with that email already exists.' });
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/v1/users/:id/resend-invite  (admin — re-send invite OR send fresh password reset)
router.post('/:id/resend-invite', requireAdmin, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ ok: false, error: 'User not found.' });
    const link = await issueInviteToken(user.id);
    const result = await send({
      to:      user.email,
      subject: '[Feynegoce] Your account access link',
      html:    inviteHtml(user.name, req.user.name, link),
    });
    await writeAudit({ userId: req.user.id, action: 'update', entityType: 'user', entityId: user.id, newValues: { resentInvite: true } });
    res.json({ ok: true, mail: result.ok ? 'sent' : 'failed', error: result.error });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// PUT /api/v1/users/:id  (admin — update user name/role)
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, role } = req.body;
  if (role && !['admin', 'investor'].includes(role)) {
    return res.status(400).json({ ok: false, error: 'Role must be admin or investor.' });
  }
  try {
    const data = {};
    if (name?.trim()) data.name = name.trim();
    if (role) data.role = role;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    await writeAudit({ userId: req.user.id, action: 'update', entityType: 'user', entityId: user.id, newValues: data });
    res.json({ ok: true, user });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// POST /api/v1/users/:id/send-reset  (admin — trigger password reset email for any user)
router.post('/:id/send-reset', requireAdmin, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ ok: false, error: 'User not found.' });
    const rawToken = generateToken();
    const expires  = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash:    hashToken(rawToken),
        resetTokenExpires: expires,
        resetTokenPurpose: 'reset',
      },
    });
    const link = `${frontendUrl()}/dashboard/reset-password/${rawToken}`;
    const { passwordResetHtml } = require('../../../lib/mailer');
    const result = await send({
      to:      user.email,
      subject: '[Feynegoce] Password reset request',
      html:    passwordResetHtml(user.name, link),
    });
    await writeAudit({ userId: req.user.id, action: 'update', entityType: 'user', entityId: user.id, newValues: { sentPasswordReset: true } });
    res.json({ ok: true, mail: result.ok ? 'sent' : 'failed', error: result.error });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// DELETE /api/v1/users/:id  (admin — delete user)
router.delete('/:id', requireAdmin, async (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(400).json({ ok: false, error: 'You cannot delete your own account.' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { email: true, name: true } });
    if (!user) return res.status(404).json({ ok: false, error: 'User not found.' });
    await prisma.user.delete({ where: { id: req.params.id } });
    await writeAudit({ userId: req.user.id, action: 'delete', entityType: 'user', entityId: req.params.id, oldValues: user });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// PUT /api/v1/users/:id/notifications
router.put('/:id/notifications', requireAuth, async (req, res) => {
  // Users can only update their own prefs; admin can update any
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'You can only update your own notification preferences.' });
  }
  try {
    const updated = await prisma.user.update({
      where:  { id: req.params.id },
      data:   { notificationPrefs: JSON.stringify(req.body) },
      select: { id: true, notificationPrefs: true },
    });
    const prefs = typeof updated.notificationPrefs === 'string' ? JSON.parse(updated.notificationPrefs) : updated.notificationPrefs;
    res.json({ ok: true, notificationPrefs: prefs });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// GET /api/v1/audit-log  (admin)
router.get('/audit-log', requireAdmin, async (req, res) => {
  const { entity_type, user_id, from, to } = req.query;
  const where = {};
  if (entity_type) where.entityType = entity_type;
  if (user_id)     where.userId     = user_id;
  if (from || to)  {
    where.timestamp = {};
    if (from) where.timestamp.gte = new Date(from);
    if (to)   where.timestamp.lte = new Date(to);
  }
  try {
    const rawLogs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { timestamp: 'desc' },
      take:    500,
    });
    const logs = rawLogs.map(l => ({
      ...l,
      oldValues: l.oldValues ? JSON.parse(l.oldValues) : null,
      newValues: l.newValues ? JSON.parse(l.newValues) : null,
    }));
    res.json({ ok: true, logs });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

module.exports = router;
