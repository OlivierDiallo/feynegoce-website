'use strict';

const express  = require('express');
const fs       = require('fs');
const path     = require('path');
const cron     = require('node-cron');

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
   FALLBACK — serve index.html for all non-API GET routes
   ============================================================ */
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ============================================================
   STARTUP
   ============================================================ */
db.seedAdmin();

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
