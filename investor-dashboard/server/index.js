'use strict';
require('dotenv').config();

const express    = require('express');
const path       = require('path');
const cors       = require('cors');
const cookieParser = require('cookie-parser');

const app  = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

/* ============================================================
   MIDDLEWARE
   ============================================================ */
app.use(cors({
  origin:      IS_PROD ? process.env.FRONTEND_URL : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/* ============================================================
   API ROUTES
   ============================================================ */
app.use('/api/v1/auth',      require('./routes/auth'));
app.use('/api/v1/shipments', require('./routes/shipments'));
app.use('/api/v1/reports',   require('./routes/reports'));
app.use('/api/v1/products',  require('./routes/products'));
app.use('/api/v1/users',     require('./routes/users'));

// Audit log via users router (mounted separately for clean URL)
const { requireAdmin } = require('./middleware/auth');
const prisma = require('./lib/prisma');
app.get('/api/v1/audit-log', requireAdmin, async (req, res) => {
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
      include: { user: { select: { id:true, name:true, email:true } } },
      orderBy: { timestamp: 'desc' },
      take: 500,
    });
    const logs = rawLogs.map(l => ({
      ...l,
      oldValues: l.oldValues ? JSON.parse(l.oldValues) : null,
      newValues: l.newValues ? JSON.parse(l.newValues) : null,
    }));
    res.json({ ok: true, logs });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

/* ============================================================
   SERVE REACT APP IN PRODUCTION
   ============================================================ */
if (IS_PROD) {
  const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    }
  });
}

/* ============================================================
   DB CONNECTIVITY CHECK + STARTUP
   ============================================================ */
async function start() {
  try {
    await prisma.$connect();
    console.log('[DB] Connected successfully');
  } catch (err) {
    console.warn('[DB] Could not connect to database:', err.message);
    console.warn('[DB] Set DATABASE_URL in .env to enable full functionality.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  Investor Dashboard API → http://localhost:${PORT}\n`);
    if (!IS_PROD) {
      console.log('  React dev server    → http://localhost:5173 (run: cd client && npm run dev)');
    }
  });
}

start();
