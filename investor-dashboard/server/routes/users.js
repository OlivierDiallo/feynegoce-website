'use strict';
const express = require('express');
const router  = express.Router();
const prisma  = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');

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
