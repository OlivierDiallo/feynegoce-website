'use strict';
const jwt    = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'feynegoce-jwt-secret-change-in-production';

function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

function verify(token) {
  try { return jwt.verify(token, SECRET); }
  catch { return null; }
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  const payload = verify(token);
  if (!payload) return res.status(401).json({ ok: false, error: 'Token invalid or expired' });
  req.user = payload;
  next();
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ ok: false, error: 'Admin access required' });
    next();
  });
}

module.exports = { sign, verify, requireAuth, requireAdmin };
