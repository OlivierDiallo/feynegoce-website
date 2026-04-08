'use strict';
const express = require('express');
const bcrypt  = require('bcryptjs');
const router  = express.Router();
const db      = require('../lib/db');
const { sign, requireAuth } = require('../lib/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password are required.' });
  }
  const user = db.findOne('users.json', u => u.email === email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ ok: false, error: 'Invalid credentials.' });
  }
  const token = sign({ id: user.id, name: user.name, email: user.email, role: user.role });
  res.json({
    ok: true, token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, share: user.share }
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.findOne('users.json', u => u.id === req.user.id);
  if (!user) return res.status(404).json({ ok: false, error: 'User not found.' });
  res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, share: user.share } });
});

module.exports = router;
