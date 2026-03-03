'use strict';

const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ============================================================
   MIDDLEWARE
   ============================================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

/* ============================================================
   API — Contact form
   POST /api/contact
   Body: { name, company, email, subject, message }
   ============================================================ */
app.post('/api/contact', (req, res) => {
  const { name, company, email, subject, message } = req.body;

  /* --- Server-side validation --- */
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ ok: false, error: 'Missing required fields.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Invalid email address.' });
  }

  const entry = {
    id:        Date.now(),
    timestamp: new Date().toISOString(),
    name:      name.trim(),
    company:   company?.trim() || '',
    email:     email.trim(),
    subject:   subject || '',
    message:   message.trim(),
  };

  /* --- Persist to data/contacts.json --- */
  const dataDir  = path.join(__dirname, 'data');
  const dataFile = path.join(dataDir, 'contacts.json');

  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    let contacts = [];
    if (fs.existsSync(dataFile)) {
      contacts = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    }
    contacts.push(entry);
    fs.writeFileSync(dataFile, JSON.stringify(contacts, null, 2));
  } catch (err) {
    console.error('[Contact] Save failed:', err.message);
    return res.status(500).json({ ok: false, error: 'Could not save your message. Please try again.' });
  }

  console.log(`[Contact] ${entry.timestamp} — ${entry.name} <${entry.email}>`);
  res.json({ ok: true });
});

/* ============================================================
   FALLBACK — serve index.html for unmatched GET routes
   ============================================================ */
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ============================================================
   START
   ============================================================ */
app.listen(PORT, () => {
  console.log(`\n  Feynegoce  →  http://localhost:${PORT}\n`);
});
