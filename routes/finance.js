'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../lib/db');
const { requireAuth, requireAdmin } = require('../lib/auth');

// GET /api/finance/overview
router.get('/overview', requireAuth, (req, res) => {
  const txs   = db.find('transactions.json');
  const users = db.find('users.json').filter(u => (u.share || 0) > 0);

  const totalRevenue  = txs.filter(t => t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netProfit     = totalRevenue - totalExpenses;

  // Per-stakeholder breakdown
  const stakeholders = users.map(u => ({
    id:       u.id,
    name:     u.name,
    role:     u.role,
    share:    u.share,
    revenue:  totalRevenue  * (u.share / 100),
    expenses: totalExpenses * (u.share / 100),
    profit:   netProfit     * (u.share / 100),
  }));

  // Monthly totals — last 12 months
  const now     = new Date();
  const monthly = [];
  for (let i = 11; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const rev = txs.filter(t => t.type === 'revenue' && t.date?.startsWith(key)).reduce((s, t) => s + t.amount, 0);
    const exp = txs.filter(t => t.type === 'expense' && t.date?.startsWith(key)).reduce((s, t) => s + t.amount, 0);
    monthly.push({ month: key, revenue: rev, expenses: exp, profit: rev - exp });
  }

  // Category breakdown
  const categories = {};
  txs.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.category || 'Other';
    categories[cat] = (categories[cat] || 0) + t.amount;
  });

  res.json({ ok: true, summary: { totalRevenue, totalExpenses, netProfit }, stakeholders, monthly, categories });
});

// GET /api/finance/transactions
router.get('/transactions', requireAuth, (req, res) => {
  const txs = db.find('transactions.json')
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ ok: true, transactions: txs });
});

// POST /api/finance/transactions  (admin)
router.post('/transactions', requireAdmin, (req, res) => {
  const { type, category, description, amount, currency, shipmentId, date } = req.body;
  if (!type || !description?.trim() || !amount || !date) {
    return res.status(400).json({ ok: false, error: 'type, description, amount, and date are required.' });
  }
  if (!['revenue', 'expense'].includes(type)) {
    return res.status(400).json({ ok: false, error: 'type must be "revenue" or "expense".' });
  }
  const tx = db.insert('transactions.json', {
    type,
    category:   category || 'Other',
    description: description.trim(),
    amount:     parseFloat(amount),
    currency:   currency || 'EUR',
    shipmentId: shipmentId ? parseInt(shipmentId) : null,
    date,
  });
  res.json({ ok: true, transaction: tx });
});

// PUT /api/finance/transactions/:id  (admin)
router.put('/transactions/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const { type, category, description, amount, currency, date } = req.body;
  const updates = {};
  if (type !== undefined)        updates.type        = type;
  if (category !== undefined)    updates.category    = category;
  if (description !== undefined) updates.description = description;
  if (amount !== undefined)      updates.amount      = parseFloat(amount);
  if (currency !== undefined)    updates.currency    = currency;
  if (date !== undefined)        updates.date        = date;

  const updated = db.update('transactions.json', id, updates);
  if (!updated) return res.status(404).json({ ok: false, error: 'Transaction not found.' });
  res.json({ ok: true, transaction: updated });
});

// DELETE /api/finance/transactions/:id  (admin)
router.delete('/transactions/:id', requireAdmin, (req, res) => {
  db.remove('transactions.json', parseInt(req.params.id));
  res.json({ ok: true });
});

module.exports = router;
