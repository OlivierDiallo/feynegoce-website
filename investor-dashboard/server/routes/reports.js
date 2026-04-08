'use strict';
const express  = require('express');
const router   = express.Router();
const prisma   = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { calcShipmentFinancials, calcProjections, calcOverviewSummary } = require('../services/financials');
const { shipmentsToCSV, transactionsToCSV, auditToCSV } = require('../services/export');

const FULL_INCLUDE = {
  product: true,
  expenses: true,
  sales: true,
  splits: { include: { user: { select: { id: true, name: true, email: true } } } },
  milestones: true,
};

// GET /api/v1/reports/overview
router.get('/overview', requireAuth, async (req, res) => {
  try {
    const shipments = await prisma.shipment.findMany({ where: { deletedAt: null }, include: FULL_INCLUDE });
    const summary   = calcOverviewSummary(shipments, req.user.id);

    // Recent 5
    const recent = shipments.slice(0, 5).map(s => ({
      id: s.id, reference: s.reference, status: s.status,
      product: s.product?.name, origin: s.origin, destination: s.destination,
      eta: s.eta, ...calcShipmentFinancials(s),
    }));

    // Product performance
    const byProduct = {};
    for (const s of shipments) {
      const name = s.product?.name || 'Unknown';
      if (!byProduct[name]) byProduct[name] = { name, count: 0, totalCost: 0, totalRev: 0 };
      const f = calcShipmentFinancials(s);
      byProduct[name].count++;
      byProduct[name].totalCost += f.totalCost;
      byProduct[name].totalRev  += f.totalRev;
    }
    const productPerformance = Object.values(byProduct).map(p => ({
      ...p,
      margin: p.totalCost > 0 ? ((p.totalRev - p.totalCost) / p.totalCost) * 100 : 0,
    }));

    // Stakeholder breakdown — per-user share of total profit
    const users = await prisma.user.findMany({ select: { id: true, name: true, role: true } });
    const { totalRevenue, totalInvested: totalCostAll, overallProfit } = summary;
    const totalExpenses = totalCostAll - shipments.reduce((a, s) => a + parseFloat(s.costOfGoods), 0);

    // Aggregate each user's weighted share across all shipments
    const userShares = {};
    for (const s of shipments) {
      const f = calcShipmentFinancials(s);
      for (const sp of (s.splits || [])) {
        const uid = sp.userId;
        const pct = parseFloat(sp.splitPct);
        if (!userShares[uid]) userShares[uid] = { revenue: 0, expenses: 0, profit: 0, shipCount: 0 };
        userShares[uid].revenue  += f.totalRev     * (pct / 100);
        userShares[uid].expenses += f.totalCost    * (pct / 100);
        userShares[uid].profit   += f.grossProfit  * (pct / 100);
        userShares[uid].shipCount++;
      }
    }
    const stakeholders = users.map(u => ({
      id:       u.id,
      name:     u.name,
      role:     u.role,
      share:    Object.values(userShares[u.id] || {}).length ? null : null, // resolved below
      revenue:  userShares[u.id]?.revenue  || 0,
      expenses: userShares[u.id]?.expenses || 0,
      profit:   userShares[u.id]?.profit   || 0,
    }));
    // Resolve average split % per user across shipments they participate in
    for (const sk of stakeholders) {
      const splits = shipments.flatMap(s => s.splits || []).filter(sp => sp.userId === sk.id);
      sk.share = splits.length > 0 ? splits.reduce((a, sp) => a + parseFloat(sp.splitPct), 0) / splits.length : 0;
    }

    res.json({ ok: true, summary, recent, productPerformance, stakeholders });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/v1/reports/by-period?period=weekly|monthly|yearly
router.get('/by-period', requireAuth, async (req, res) => {
  const period = req.query.period || 'monthly';
  try {
    const shipments = await prisma.shipment.findMany({ where: { deletedAt: null }, include: FULL_INCLUDE });

    const buckets = {};
    for (const s of shipments) {
      const date = s.createdAt;
      let key;
      if (period === 'weekly') {
        const d = new Date(date); d.setHours(0,0,0,0);
        const day = d.getDay(); d.setDate(d.getDate() - day);
        key = d.toISOString().split('T')[0];
      } else if (period === 'yearly') {
        key = date.getFullYear().toString();
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      if (!buckets[key]) buckets[key] = { period: key, totalCost: 0, totalRev: 0, count: 0 };
      const f = calcShipmentFinancials(s);
      buckets[key].totalCost += f.totalCost;
      buckets[key].totalRev  += f.totalRev;
      buckets[key].count++;
    }

    const data = Object.values(buckets)
      .sort((a, b) => a.period.localeCompare(b.period))
      .map(b => ({ ...b, profit: b.totalRev - b.totalCost, margin: b.totalCost > 0 ? ((b.totalRev - b.totalCost) / b.totalCost) * 100 : 0 }));

    res.json({ ok: true, data, period });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/v1/reports/by-product
router.get('/by-product', requireAuth, async (req, res) => {
  try {
    const products  = await prisma.product.findMany();
    const shipments = await prisma.shipment.findMany({ where: { deletedAt: null }, include: FULL_INCLUDE });
    const result = products.map(p => {
      const ss = shipments.filter(s => s.productId === p.id);
      const totalCost = ss.reduce((acc, s) => acc + calcShipmentFinancials(s).totalCost, 0);
      const totalRev  = ss.reduce((acc, s) => acc + calcShipmentFinancials(s).totalRev,  0);
      return {
        id: p.id, name: p.name, description: p.description,
        shipmentCount: ss.length,
        completedCount: ss.filter(s => s.status === 'completed').length,
        totalCost, totalRev, profit: totalRev - totalCost,
        margin: totalCost > 0 ? ((totalRev - totalCost) / totalCost) * 100 : 0,
      };
    });
    res.json({ ok: true, products: result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/v1/reports/projection
router.post('/projection', requireAuth, async (req, res) => {
  const { product_id, investment_amount } = req.body;
  if (!product_id || !investment_amount) {
    return res.status(400).json({ ok: false, error: 'product_id and investment_amount are required.' });
  }
  try {
    const shipments = await prisma.shipment.findMany({
      where: { productId: product_id, status: 'completed', deletedAt: null },
      include: FULL_INCLUDE,
    });
    const result = calcProjections(shipments, parseFloat(investment_amount));
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/v1/reports/export
router.get('/export', requireAdmin, async (req, res) => {
  const { format = 'csv', type = 'shipments' } = req.query;
  try {
    let csv = '';
    const filename = `feynegoce-${type}-${new Date().toISOString().split('T')[0]}`;

    if (type === 'shipments' || type === 'financials') {
      const shipments = await prisma.shipment.findMany({ where: { deletedAt: null }, include: FULL_INCLUDE });
      csv = type === 'financials' ? transactionsToCSV(shipments) : shipmentsToCSV(shipments);
    } else if (type === 'audit') {
      const logs = await prisma.auditLog.findMany({ include: { user: { select: { name: true } } }, orderBy: { timestamp: 'desc' } });
      csv = auditToCSV(logs);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
