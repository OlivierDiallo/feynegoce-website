'use strict';
const jwt = require('jsonwebtoken');

const SECRET  = process.env.JWT_SECRET  || 'dev-secret-change-in-production';
const EXPIRY  = process.env.JWT_EXPIRY  || '24h';
const IS_PROD = process.env.NODE_ENV === 'production';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
}

function setAuthCookie(res, token) {
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: IS_PROD ? 'strict' : 'lax',
    maxAge:   24 * 60 * 60 * 1000, // 24h
    path:     '/',
  });
}

function clearAuthCookie(res) {
  res.clearCookie('auth_token', { path: '/' });
}

function requireAuth(req, res, next) {
  const token = req.cookies?.auth_token
    || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

  if (!token) return res.status(401).json({ ok: false, error: 'Authentication required.' });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    clearAuthCookie(res);
    res.status(401).json({ ok: false, error: 'Session expired. Please log in again.' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'Admin access required.' });
    }
    next();
  });
}

module.exports = { signToken, setAuthCookie, clearAuthCookie, requireAuth, requireAdmin };
