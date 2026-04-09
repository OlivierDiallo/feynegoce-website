'use strict';
const _path = require('path');
const _fs   = require('fs');
const { spawnSync: _spawnSync } = require('child_process');

// Surface async failures instead of crashing the worker silently. Hostinger
// runs us behind a reverse proxy that returns 503 if the Node process dies,
// so we want loud logs over a quiet exit.
process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled rejection:', reason && reason.stack || reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught exception:', err && err.stack || err);
});

// Load investor-dashboard .env if it exists, otherwise set defaults
require('dotenv').config({ path: _path.join(__dirname, 'investor-dashboard', '.env') });
if (!process.env.DATABASE_URL) {
  // SQLite by default — no remote DB credentials needed. Override via env
  // var if you ever want to point at a managed Postgres / MySQL.
  process.env.DATABASE_URL = 'file:' + _path.join(__dirname, 'investor-dashboard', 'prisma', 'dev.db');
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'feynegoce-default-jwt-secret-change-me';
}

// Ensure the Prisma client + SQLite schema are present at runtime.
// Hostinger's build→deploy pipeline has been observed to drop files written
// during postinstall AND to keep stale generated artifacts from a previous
// deploy. We always wipe + regenerate the client at boot so the engine
// binary is built against the runtime VM's glibc/OpenSSL, not the build
// VM's. The .db file we keep if present so user data isn't lost.
(function ensurePrismaReady() {
  const url = process.env.DATABASE_URL || '';
  if (!url.startsWith('file:')) return; // remote DB, leave schema management alone
  const dbPath  = url.replace(/^file:/, '');
  const schema  = _path.join(__dirname, 'investor-dashboard', 'prisma', 'schema.prisma');
  const dotPrismaDir = _path.join(__dirname, 'node_modules', '.prisma');

  try {
    _fs.mkdirSync(_path.dirname(dbPath), { recursive: true });
  } catch (err) {
    console.error('[Boot] could not create db directory', _path.dirname(dbPath), err.message);
  }

  // 1. Wipe any stale .prisma directory from a previous build. Prisma's
  // auto-detected "native" binary can mismatch the runtime VM's glibc on
  // shared hosting, which causes every query to hang silently. Forcing a
  // fresh generate ensures the engine is built against the actual runtime.
  try {
    if (_fs.existsSync(dotPrismaDir)) {
      _fs.rmSync(dotPrismaDir, { recursive: true, force: true });
      console.log('[Boot] removed stale .prisma client at', dotPrismaDir);
    }
  } catch (err) {
    console.warn('[Boot] could not remove stale .prisma dir:', err.message);
  }

  console.log('[Boot] running prisma generate');
  const gen = _spawnSync(
    'npx',
    ['prisma', 'generate', `--schema=${schema}`],
    { env: process.env, encoding: 'utf8' },
  );
  if (gen.stdout) console.log('[Boot] prisma generate stdout:', gen.stdout.trim());
  if (gen.stderr) console.log('[Boot] prisma generate stderr:', gen.stderr.trim());
  console.log('[Boot] prisma generate exit =', gen.status);

  // 2. Push the schema only when the db file is missing or empty.
  let needPush = true;
  try {
    if (_fs.existsSync(dbPath) && _fs.statSync(dbPath).size > 0) {
      console.log('[Boot] SQLite db present at', dbPath, '— skipping db push');
      needPush = false;
    }
  } catch (_) { /* fall through to db push */ }

  if (needPush) {
    console.log('[Boot] SQLite db missing/empty — running prisma db push');
    const push = _spawnSync(
      'npx',
      ['prisma', 'db', 'push', `--schema=${schema}`, '--skip-generate', '--accept-data-loss'],
      { env: process.env, encoding: 'utf8' },
    );
    if (push.stdout) console.log('[Boot] prisma db push stdout:', push.stdout.trim());
    if (push.stderr) console.log('[Boot] prisma db push stderr:', push.stderr.trim());
    if (push.status === 0) {
      console.log('[Boot] SQLite schema is in sync at', dbPath);
    } else {
      console.warn('[Boot] prisma db push exited with code', push.status);
    }
  }
})();

const express  = require('express');
const fs       = require('fs');
const path     = require('path');
const cron     = require('node-cron');

const cookieParser = require('cookie-parser');

const db              = require('./lib/db');
const { getVesselPosition } = require('./lib/tracking');
const { notifyAll }         = require('./lib/mailer');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ============================================================
   MIDDLEWARE
   ============================================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/* ============================================================
   INVESTOR DASHBOARD — React app at /dashboard
   Must be mounted BEFORE public static (public/dashboard/ exists)
   ============================================================ */
const DASH_DIST = path.join(__dirname, 'investor-dashboard', 'client', 'dist');
app.use('/dashboard', express.static(DASH_DIST));
app.get('/dashboard', (_req, res) => res.sendFile(path.join(DASH_DIST, 'index.html')));
app.get('/dashboard/*', (_req, res) => res.sendFile(path.join(DASH_DIST, 'index.html')));

app.use(express.static(path.join(__dirname, 'public')));

/* ============================================================
   API ROUTES
   ============================================================ */
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/shipments', require('./routes/shipments'));
app.use('/api/finance',   require('./routes/finance'));
app.use('/api/admin',     require('./routes/admin'));

/* ============================================================
   API — Contact form  (original)
   POST /api/contact
   ============================================================ */
app.post('/api/contact', (req, res) => {
  const { name, company, email, subject, message } = req.body;
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ ok: false, error: 'Missing required fields.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Invalid email address.' });
  }
  const entry = {
    id: Date.now(), timestamp: new Date().toISOString(),
    name: name.trim(), company: company?.trim() || '',
    email: email.trim(), subject: subject || '', message: message.trim(),
  };
  const dataDir  = path.join(__dirname, 'data');
  const dataFile = path.join(dataDir, 'contacts.json');
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    let contacts = [];
    if (fs.existsSync(dataFile)) contacts = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    contacts.push(entry);
    fs.writeFileSync(dataFile, JSON.stringify(contacts, null, 2));
  } catch (err) {
    console.error('[Contact] Save failed:', err.message);
    return res.status(500).json({ ok: false, error: 'Could not save your message.' });
  }
  console.log(`[Contact] ${entry.timestamp} — ${entry.name} <${entry.email}>`);
  res.json({ ok: true });
});

/* ============================================================
   INVESTOR DASHBOARD — API routes
   ============================================================ */
app.use('/api/v1/auth',      require('./investor-dashboard/server/routes/auth'));
app.use('/api/v1/shipments', require('./investor-dashboard/server/routes/shipments'));
app.use('/api/v1/reports',   require('./investor-dashboard/server/routes/reports'));
app.use('/api/v1/users',     require('./investor-dashboard/server/routes/users'));

// Audit log endpoint
const { requireAdmin: requireAdminV1 } = require('./investor-dashboard/server/middleware/auth');
const prismaV1 = require('./investor-dashboard/server/lib/prisma');
app.get('/api/v1/audit-log', requireAdminV1, async (req, res) => {
  const { entity_type, from, to } = req.query;
  const where = {};
  if (entity_type) where.entityType = entity_type;
  if (from || to) {
    where.timestamp = {};
    if (from) where.timestamp.gte = new Date(from);
    if (to)   where.timestamp.lte = new Date(to);
  }
  try {
    const rawLogs = await prismaV1.auditLog.findMany({
      where, include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { timestamp: 'desc' }, take: 500,
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
   FALLBACK — serve index.html for all non-API GET routes
   ============================================================ */
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ============================================================
   STARTUP
   ============================================================ */
db.seedAdmin();

// Bootstrap first admin via email invite flow.
// If the admin exists already and has a password → do nothing.
// If the admin exists but has no password (e.g. just seeded) → issue a fresh invitation.
// If the admin doesn't exist → create as passwordless and issue an invitation.
// No passwords ever live in env vars.
async function ensureDashboardAdmin() {
  // Hard timeout so a stuck Prisma engine never silently freezes the boot
  // sequence — we'd rather log a clear "timed out" line than wait forever.
  const TIMEOUT_MS = 15_000;
  const withTimeout = (promise, label) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(
      () => reject(new Error(`timed out after ${TIMEOUT_MS}ms: ${label}`)),
      TIMEOUT_MS,
    )),
  ]);

  try {
    console.log('[Dashboard] ensureDashboardAdmin: starting');
    // Hardcoded for now — Hostinger has a stale ADMIN_EMAIL env var that
    // we want to ignore until the user updates it from the panel. Once
    // updated, swap this back to (process.env.ADMIN_EMAIL || 'diallo982@gmail.com').
    const adminEmail = 'diallo982@gmail.com';
    const adminName  = process.env.ADMIN_NAME || 'Olivier Diallo';
    console.log('[Dashboard] target admin =', adminEmail);

    let user = await withTimeout(
      prismaV1.user.findUnique({ where: { email: adminEmail } }),
      'prisma.user.findUnique',
    );
    console.log('[Dashboard] findUnique result:', user ? `id=${user.id} hasPassword=${!!user.passwordHash}` : 'null');
    if (user && user.passwordHash) {
      console.log('[Dashboard] admin already activated, nothing to do');
      return;
    }

    const crypto = require('crypto');
    const rawToken  = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires   = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days for bootstrap

    user = await withTimeout(
      prismaV1.user.upsert({
        where: { email: adminEmail },
        update: {
          role: 'admin',
          name: user?.name || adminName,
          resetTokenHash:    tokenHash,
          resetTokenExpires: expires,
          resetTokenPurpose: 'invite',
        },
        create: {
          email: adminEmail,
          passwordHash: null,
          name: adminName,
          role: 'admin',
          notificationPrefs: JSON.stringify({ new_shipment: true, milestone: true, eta_update: true, new_sale: true, financial_report: true }),
          resetTokenHash:    tokenHash,
          resetTokenExpires: expires,
          resetTokenPurpose: 'invite',
        },
      }),
      'prisma.user.upsert',
    );
    console.log('[Dashboard] upsert ok, user id =', user.id);

    const baseUrl = (process.env.FRONTEND_URL || 'https://feynegoce.com').replace(/\/$/, '');
    const link    = `${baseUrl}/dashboard/setup-password/${rawToken}`;

    const { send, inviteHtml } = require('./lib/mailer');
    const result = await withTimeout(
      send({
        to:      user.email,
        subject: '[Feynegoce] Activate your investor dashboard admin account',
        html:    inviteHtml(user.name, 'Feynegoce', link),
      }),
      'mailer.send',
    );
    if (result.ok && !result.mock) {
      console.log(`[Dashboard] Admin activation email sent to ${user.email}`);
    } else {
      // If SMTP isn't configured yet, log the link so the operator can use it once.
      console.log(`[Dashboard] Admin activation link (SMTP not sent): ${link}`);
    }
  } catch (err) {
    console.warn('[Dashboard] Auto-admin skipped:', err && err.stack || err);
  }
}
ensureDashboardAdmin();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Feynegoce  →  http://localhost:${PORT}\n`);
});

/* ============================================================
   CRON — Poll vessel positions every 4 hours for in-transit shipments
   ============================================================ */
cron.schedule('0 */4 * * *', async () => {
  console.log('[Cron] Polling vessel positions...');
  const active = db.find('shipments.json', s => s.status === 'in_transit' && s.vesselImo);
  for (const shipment of active) {
    try {
      const pos = await getVesselPosition(shipment.vesselImo);
      db.update('shipments.json', shipment.id, {
        lastLat: pos.lat, lastLon: pos.lon,
        lastPort: pos.lastPort, lastTrackUpdate: new Date().toISOString(),
      });
      // Notify if port changed
      const lastEvent = db.find('events.json', e => e.shipmentId === shipment.id && e.type === 'position_update')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
      if (!lastEvent || lastEvent.location !== pos.lastPort) {
        const msg = `Vessel now near ${pos.lastPort || `${pos.lat}, ${pos.lon}`}. ETA: ${pos.eta || 'TBD'}.`;
        db.insert('events.json', {
          shipmentId: shipment.id, type: 'position_update',
          description: msg, location: pos.lastPort, timestamp: new Date().toISOString(),
        });
        const users = db.find('users.json');
        notifyAll(users, shipment, msg).catch(e => console.error('[Cron notify]', e.message));
        console.log(`[Cron] ${shipment.title} — ${msg}`);
      }
    } catch (err) {
      console.error(`[Cron] Failed for ${shipment.title}:`, err.message);
    }
  }
});
