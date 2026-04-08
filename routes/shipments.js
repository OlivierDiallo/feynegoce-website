'use strict';
const express  = require('express');
const router   = express.Router();
const db       = require('../lib/db');
const { requireAuth, requireAdmin } = require('../lib/auth');
const { getVesselPosition }         = require('../lib/tracking');
const { notifyAll }                 = require('../lib/mailer');

// GET /api/shipments
router.get('/', requireAuth, (_req, res) => {
  const shipments = db.find('shipments.json')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ ok: true, shipments });
});

// GET /api/shipments/:id
router.get('/:id', requireAuth, (req, res) => {
  const id       = parseInt(req.params.id);
  const shipment = db.findOne('shipments.json', s => s.id === id);
  if (!shipment) return res.status(404).json({ ok: false, error: 'Shipment not found.' });
  const events   = db.find('events.json', e => e.shipmentId === id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json({ ok: true, shipment, events });
});

// POST /api/shipments  (admin)
router.post('/', requireAdmin, (req, res) => {
  const { title, description, supplier, originPort, destinationPort,
          vesselImo, containerNumber, totalValue, status, paymentStatus, paymentAmount,
          expectedDeparture, expectedArrival, notes } = req.body;
  if (!title?.trim()) return res.status(400).json({ ok: false, error: 'Title is required.' });

  const shipment = db.insert('shipments.json', {
    title:             title.trim(),
    description:       description?.trim() || '',
    supplier:          supplier?.trim()    || '',
    originPort:        originPort?.trim()  || '',
    destinationPort:   destinationPort?.trim() || '',
    vesselImo:         vesselImo?.trim()   || '',
    containerNumber:   containerNumber?.trim() || '',
    status:            status            || 'pending_payment',
    paymentStatus:     paymentStatus     || 'pending',
    paymentAmount:     parseFloat(paymentAmount) || 0,
    totalValue:        parseFloat(totalValue) || 0,
    expectedDeparture: expectedDeparture || null,
    actualDeparture:   null,
    expectedArrival:   expectedArrival   || null,
    actualArrival:     null,
    lastLat:           null,
    lastLon:           null,
    lastPort:          null,
    lastTrackUpdate:   null,
    notes:             notes?.trim() || '',
  });

  db.insert('events.json', {
    shipmentId:  shipment.id,
    type:        'created',
    description: 'Shipment created',
    location:    null,
    timestamp:   new Date().toISOString(),
  });

  res.json({ ok: true, shipment });
});

// PUT /api/shipments/:id  (admin)
router.put('/:id', requireAdmin, async (req, res) => {
  const id       = parseInt(req.params.id);
  const existing = db.findOne('shipments.json', s => s.id === id);
  if (!existing) return res.status(404).json({ ok: false, error: 'Shipment not found.' });

  const allowed = [
    'title', 'description', 'supplier', 'originPort', 'destinationPort',
    'vesselImo', 'containerNumber', 'status', 'paymentStatus', 'paymentAmount',
    'totalValue', 'expectedDeparture', 'actualDeparture', 'expectedArrival',
    'actualArrival', 'notes',
  ];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  // Log status changes and notify users
  if (updates.status && updates.status !== existing.status) {
    const eventMsg = `Status changed to: ${updates.status.replace(/_/g, ' ')}`;
    db.insert('events.json', {
      shipmentId:  id,
      type:        'status_change',
      description: eventMsg,
      location:    null,
      timestamp:   new Date().toISOString(),
    });
    // Notify all users async (don't wait)
    const users = db.find('users.json');
    const merged = { ...existing, ...updates };
    notifyAll(users, merged, eventMsg).catch(e => console.error('[Notify]', e.message));
  }

  // If payment status changed to paid, log that too
  if (updates.paymentStatus && updates.paymentStatus !== existing.paymentStatus) {
    db.insert('events.json', {
      shipmentId:  id,
      type:        'payment_update',
      description: `Payment status: ${updates.paymentStatus}${updates.paymentAmount ? ` — €${parseFloat(updates.paymentAmount).toLocaleString()}` : ''}`,
      location:    null,
      timestamp:   new Date().toISOString(),
    });
  }

  const updated = db.update('shipments.json', id, updates);
  res.json({ ok: true, shipment: updated });
});

// DELETE /api/shipments/:id  (admin)
router.delete('/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  if (!db.findOne('shipments.json', s => s.id === id)) {
    return res.status(404).json({ ok: false, error: 'Shipment not found.' });
  }
  db.remove('shipments.json', id);
  res.json({ ok: true });
});

// GET /api/shipments/:id/track
router.get('/:id/track', requireAuth, async (req, res) => {
  const id       = parseInt(req.params.id);
  const shipment = db.findOne('shipments.json', s => s.id === id);
  if (!shipment) return res.status(404).json({ ok: false, error: 'Shipment not found.' });
  if (!shipment.vesselImo) {
    return res.json({ ok: true, position: null, message: 'No vessel IMO configured for this shipment.' });
  }
  try {
    const position = await getVesselPosition(shipment.vesselImo);
    // Persist latest coords
    db.update('shipments.json', id, {
      lastLat: position.lat, lastLon: position.lon,
      lastPort: position.lastPort, lastTrackUpdate: new Date().toISOString(),
    });
    // Log tracking event if position changed
    const last = db.find('events.json', e => e.shipmentId === id && e.type === 'position_update')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    if (!last || last.location !== position.lastPort) {
      db.insert('events.json', {
        shipmentId:  id,
        type:        'position_update',
        description: `Vessel at ${position.lat}, ${position.lon} — ${position.status}`,
        location:    position.lastPort || null,
        timestamp:   new Date().toISOString(),
      });
    }
    res.json({ ok: true, position });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
