'use strict';
const express  = require('express');
const bcrypt   = require('bcryptjs');
const router   = express.Router();
const prisma   = require('../lib/prisma');
const { signToken, setAuthCookie, clearAuthCookie, requireAuth } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

// POST /api/v1/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password are required.' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ ok: false, error: 'Invalid email or password.' });
    }
    const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    setAuthCookie(res, token);
    res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('[Auth/login]', err.message);
    res.status(500).json({ ok: false, error: 'Login failed. Please try again.' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// GET /api/v1/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, notificationPrefs: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ ok: false, error: 'User not found.' });
    if (typeof user.notificationPrefs === 'string') user.notificationPrefs = JSON.parse(user.notificationPrefs);
    res.json({ ok: true, user });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Failed to fetch profile.' });
  }
});

// PUT /api/v1/auth/password
router.put('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ ok: false, error: 'Current and new passwords are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ ok: false, error: 'New password must be at least 8 characters.' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
      return res.status(401).json({ ok: false, error: 'Current password is incorrect.' });
    }
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    await prisma.user.update({
      where: { id: req.user.id },
      data:  { passwordHash: bcrypt.hashSync(newPassword, rounds) },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Failed to update password.' });
  }
});

module.exports = router;
