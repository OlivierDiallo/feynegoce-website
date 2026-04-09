'use strict';
const express  = require('express');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const router   = express.Router();
const prisma   = require('../lib/prisma');
const { send, passwordResetHtml } = require('../../../lib/mailer');
const { signToken, setAuthCookie, clearAuthCookie, requireAuth } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

// Token helpers
function generateToken() {
  return crypto.randomBytes(32).toString('hex'); // 64-char hex
}
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
function frontendUrl() {
  return (process.env.FRONTEND_URL || 'https://feynegoce.com').replace(/\/$/, '');
}

// POST /api/v1/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password are required.' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !user.passwordHash || !bcrypt.compareSync(password, user.passwordHash)) {
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

// POST /api/v1/auth/forgot-password
// Always returns ok:true to avoid leaking which emails exist.
router.post('/forgot-password', loginLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email?.trim()) return res.json({ ok: true });
  try {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (user) {
      const rawToken = generateToken();
      const expires  = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetTokenHash:    hashToken(rawToken),
          resetTokenExpires: expires,
          resetTokenPurpose: 'reset',
        },
      });
      const link = `${frontendUrl()}/dashboard/reset-password/${rawToken}`;
      await send({
        to:      user.email,
        subject: '[Feynegoce] Password reset request',
        html:    passwordResetHtml(user.name, link),
      });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[Auth/forgot-password]', err.message);
    res.json({ ok: true }); // never leak
  }
});

// GET /api/v1/auth/verify-token/:token  — used by reset & setup pages
router.get('/verify-token/:token', async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        resetTokenHash:    hashToken(req.params.token),
        resetTokenExpires: { gt: new Date() },
      },
      select: { id: true, email: true, name: true, resetTokenPurpose: true },
    });
    if (!user) return res.status(400).json({ ok: false, error: 'Invalid or expired link.' });
    res.json({ ok: true, email: user.email, name: user.name, purpose: user.resetTokenPurpose });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Failed to verify link.' });
  }
});

// POST /api/v1/auth/reset-password  — consume token + set new password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ ok: false, error: 'Token and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters.' });
  }
  try {
    const user = await prisma.user.findFirst({
      where: {
        resetTokenHash:    hashToken(token),
        resetTokenExpires: { gt: new Date() },
      },
    });
    if (!user) return res.status(400).json({ ok: false, error: 'Invalid or expired link.' });
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash:      bcrypt.hashSync(password, rounds),
        resetTokenHash:    null,
        resetTokenExpires: null,
        resetTokenPurpose: null,
      },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('[Auth/reset-password]', err.message);
    res.status(500).json({ ok: false, error: 'Failed to reset password.' });
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
