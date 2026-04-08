'use strict';
const express = require('express');
const bcrypt  = require('bcryptjs');
const router  = express.Router();
const db      = require('../lib/db');
const { requireAdmin } = require('../lib/auth');

// GET /api/admin/users
router.get('/users', requireAdmin, (_req, res) => {
  const users = db.find('users.json').map(u => ({ ...u, password: undefined }));
  res.json({ ok: true, users });
});

// POST /api/admin/users
router.post('/users', requireAdmin, (req, res) => {
  const { name, email, password, role, share } = req.body;
  if (!name?.trim() || !email?.trim() || !password || !role) {
    return res.status(400).json({ ok: false, error: 'name, email, password, and role are required.' });
  }
  if (!['admin', 'investor'].includes(role)) {
    return res.status(400).json({ ok: false, error: 'role must be "admin" or "investor".' });
  }
  const exists = db.findOne('users.json', u => u.email === email.trim().toLowerCase());
  if (exists) return res.status(400).json({ ok: false, error: 'A user with that email already exists.' });

  const user = db.insert('users.json', {
    name:     name.trim(),
    email:    email.trim().toLowerCase(),
    password: bcrypt.hashSync(password, 10),
    role,
    share:    parseFloat(share) || 0,
  });
  res.json({ ok: true, user: { ...user, password: undefined } });
});

// PUT /api/admin/users/:id
router.put('/users/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email, password, role, share } = req.body;
  const updates = {};
  if (name !== undefined)  updates.name  = name.trim();
  if (email !== undefined) updates.email = email.trim().toLowerCase();
  if (password)            updates.password = bcrypt.hashSync(password, 10);
  if (role !== undefined)  updates.role  = role;
  if (share !== undefined) updates.share = parseFloat(share);

  const updated = db.update('users.json', id, updates);
  if (!updated) return res.status(404).json({ ok: false, error: 'User not found.' });
  res.json({ ok: true, user: { ...updated, password: undefined } });
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', requireAdmin, (req, res) => {
  db.remove('users.json', parseInt(req.params.id));
  res.json({ ok: true });
});

module.exports = router;
