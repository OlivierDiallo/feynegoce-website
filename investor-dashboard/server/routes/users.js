'use strict';
const express = require('express');
const bcrypt  = require('bcryptjs');
const router  = express.Router();
const prisma  = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { writeAudit } = require('../middleware/audit');

// GET /api/v1/users  (admin)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const rawUsers = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, notificationPrefs: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    const users = rawUsers.map(u => ({ ...u, notificationPrefs: typeof u.notificationPrefs === 'string' ? JSON.parse(u.notificationPrefs) : u.notificationPrefs }));
    res.json({ ok: true, users });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// POST /api/v1/users  (admin — create new user)
router.post('/', requireAdmin, async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email?.trim() || !password || !name?.trim()) {
    return res.status(400).json({ ok: false, error: 'Email, password, and name are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters.' });
  }
  if (role && !['admin', 'investor'].includes(role)) {
    return res.status(400).json({ ok: false, error: 'Role must be admin or investor.' });
  }
  try {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash: bcrypt.hashSync(password, rounds),
        name: name.trim(),
        role: role || 'investor',
        notificationPrefs: JSON.stringify({ new_shipment: true, milestone: true, eta_update: true, new_sale: true, financial_report: true }),
      },
    });
    await writeAudit({ userId: req.user.id, action: 'create', entityType: 'user', entityId: user.id, newValues: { email: user.email, name: user.name, role: user.role } });
    res.status(201).json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt } });
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ ok: false, error: 'A user with that email already exists.' });
    res.status(500).json({ ok: false, error: err.message });
  }
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

// PUT /api/v1/users/:id/reset-password  (admin — reset another user's password)
router.put('/:id/reset-password', requireAdmin, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ ok: false, error: 'New password must be at least 8 characters.' });
  }
  try {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash: bcrypt.hashSync(newPassword, rounds) },
    });
    await writeAudit({ userId: req.user.id, action: 'update', entityType: 'user', entityId: req.params.id, newValues: { passwordReset: true } });
    res.json({ ok: true });
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
