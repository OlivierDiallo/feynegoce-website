'use strict';
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max:      5,
  message:  { ok: false, error: 'Too many login attempts. Please wait a minute and try again.' },
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator: req => req.ip,
});

module.exports = { loginLimiter };
