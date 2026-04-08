'use strict';
const express  = require('express');
const router   = express.Router();
const prisma   = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { writeAudit }                = require('../middleware/audit');
const { calcSaleMarginDelta }       = require('../services/financials');
const notify                        = require('../services/notifications');

const SHIPMENT_INCLUDE = {
  product:    true,
  expenses:   { orderBy: { createdAt: 'asc' } },
  sales:      { orderBy: { createdAt: 'asc' } },
  splits:     { include: { user: { select: { id: true, name: true, email: true } } } },
  milestones: { orderBy: { occurredAt: 'asc' } },
};

// GET /api/v1/shipments
router.get('/', requireAuth, async (req, res) => {
  const { product_id, status, from, to, search } = req.query;
  const where = { deletedAt: null };
  if (product_id) where.productId = product_id;
  if (status)     where.status    = status;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to)   where.createdAt.lte = new Date(to);
  }
  if (search) {
    where.OR = [
      { reference:   { contains: search } },
      { origin:      { contains: search } },
      { destination: { contains: search } },
    ];
  }
  try {
    const shipments = await prisma.shipment.findMany({
      where,
      include: SHIPMENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ ok: true, shipments });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/v1/shipments/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const shipment = await prisma.shipment.findFirst({
      where:   { id: req.params.id, deletedAt: null },
      include: SHIPMENT_INCLUDE,
    });
    if (!shipment) return res.status(404).json({ ok: false, error: 'Shipment not found.' });
    res.json({ ok: true, shipment });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/v1/shipments  (admin)
router.post('/', requireAdmin, async (req, res) => {
  const { productId, reference, origin, destination, quantity, quantityUnit,
          costOfGoods, currency, targetMarginPct, eta, status, trackingNumber, notes } = req.body;
  if (!productId || !reference?.trim() || !origin?.trim() || !destination?.trim() ||
      !quantity || !quantityUnit || !costOfGoods || !targetMarginPct) {
    return res.status(400).json({ ok: false, error: 'Missing required fields.' });
  }
  try {
    const shipment = await prisma.shipment.create({
      data: {
        productId, reference: reference.trim(), origin: origin.trim(),
        destination: destination.trim(), quantity: parseInt(quantity),
        quantityUnit, costOfGoods: parseFloat(costOfGoods),
        currency: currency || 'EUR', targetMarginPct: parseFloat(targetMarginPct),
        eta: eta ? new Date(eta) : null, status: status || 'pending',
        trackingNumber: trackingNumber?.trim() || null, notes: notes?.trim() || null,
      },
      include: SHIPMENT_INCLUDE,
    });
    await writeAudit({ userId: req.user.id, action: 'create', entityType: 'shipment', entityId: shipment.id, newValues: { reference: shipment.reference } });

    // Notify all users
    const users = await prisma.user.findMany();
    notify.shipmentCreated(users, shipment).catch(console.error);

    res.status(201).json({ ok: true, shipment });
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ ok: false, error: 'A shipment with that reference already exists.' });
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/v1/shipments/:id  (admin)
router.put('/:id', requireAdmin, async (req, res) => {
  const allowed = ['reference','origin','destination','quantity','quantityUnit','costOfGoods',
                   'currency','targetMarginPct','eta','status','trackingNumber','notes','productId'];
  const data = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) data[k] = req.body[k]; });
  if (data.quantity)       data.quantity       = parseInt(data.quantity);
  if (data.costOfGoods)    data.costOfGoods    = parseFloat(data.costOfGoods);
  if (data.targetMarginPct) data.targetMarginPct = parseFloat(data.targetMarginPct);
  if (data.eta)            data.eta = new Date(data.eta);

  try {
    const old = await prisma.shipment.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!old) return res.status(404).json({ ok: false, error: 'Shipment not found.' });
    const updated = await prisma.shipment.update({ where: { id: req.params.id }, data, include: SHIPMENT_INCLUDE });
    await writeAudit({ userId: req.user.id, action: 'update', entityType: 'shipment', entityId: req.params.id, oldValues: old, newValues: data });
    res.json({ ok: true, shipment: updated });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/v1/shipments/:id  (admin, soft delete)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const old = await prisma.shipment.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!old) return res.status(404).json({ ok: false, error: 'Shipment not found.' });
    await prisma.shipment.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    await writeAudit({ userId: req.user.id, action: 'delete', entityType: 'shipment', entityId: req.params.id, oldValues: { reference: old.reference } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---- EXPENSES ----
router.post('/:id/expenses', requireAdmin, async (req, res) => {
  const { category, description, amount } = req.body;
  if (!category || !amount) return res.status(400).json({ ok: false, error: 'category and amount are required.' });
  try {
    const expense = await prisma.shipmentExpense.create({
      data: { shipmentId: req.params.id, category, description: description?.trim() || null, amount: parseFloat(amount) },
    });
    await writeAudit({ userId: req.user.id, action: 'create', entityType: 'expense', entityId: expense.id, newValues: expense });
    res.status(201).json({ ok: true, expense });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.put('/:id/expenses/:expenseId', requireAdmin, async (req, res) => {
  const { category, description, amount } = req.body;
  try {
    const old = await prisma.shipmentExpense.findUnique({ where: { id: req.params.expenseId } });
    const expense = await prisma.shipmentExpense.update({
      where: { id: req.params.expenseId },
      data:  { category, description, amount: parseFloat(amount) },
    });
    await writeAudit({ userId: req.user.id, action: 'update', entityType: 'expense', entityId: expense.id, oldValues: old, newValues: expense });
    res.json({ ok: true, expense });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.delete('/:id/expenses/:expenseId', requireAdmin, async (req, res) => {
  try {
    const old = await prisma.shipmentExpense.findUnique({ where: { id: req.params.expenseId } });
    await prisma.shipmentExpense.delete({ where: { id: req.params.expenseId } });
    await writeAudit({ userId: req.user.id, action: 'delete', entityType: 'expense', entityId: req.params.expenseId, oldValues: old });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ---- SALES ----
router.post('/:id/sales', requireAdmin, async (req, res) => {
  const { customerName, quantitySold, sellingPrice } = req.body;
  if (!customerName || !quantitySold || !sellingPrice) {
    return res.status(400).json({ ok: false, error: 'customerName, quantitySold, and sellingPrice are required.' });
  }
  try {
    const shipment = await prisma.shipment.findFirst({ where: { id: req.params.id }, include: { expenses: true } });
    const { actualMarginPct, marginDelta } = calcSaleMarginDelta({ quantitySold: parseInt(quantitySold), sellingPrice: parseFloat(sellingPrice) }, shipment);
    const sale = await prisma.shipmentSale.create({
      data: {
        shipmentId: req.params.id, customerName: customerName.trim(),
        quantitySold: parseInt(quantitySold), sellingPrice: parseFloat(sellingPrice),
        actualMarginPct, marginDelta,
      },
    });
    await writeAudit({ userId: req.user.id, action: 'create', entityType: 'sale', entityId: sale.id, newValues: sale });

    const users = await prisma.user.findMany();
    notify.saleRecorded(users, shipment, sale).catch(console.error);

    res.status(201).json({ ok: true, sale });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.put('/:id/sales/:saleId', requireAdmin, async (req, res) => {
  const { customerName, quantitySold, sellingPrice } = req.body;
  try {
    const shipment = await prisma.shipment.findFirst({ where: { id: req.params.id }, include: { expenses: true } });
    const { actualMarginPct, marginDelta } = calcSaleMarginDelta({ quantitySold: parseInt(quantitySold), sellingPrice: parseFloat(sellingPrice) }, shipment);
    const old  = await prisma.shipmentSale.findUnique({ where: { id: req.params.saleId } });
    const sale = await prisma.shipmentSale.update({
      where: { id: req.params.saleId },
      data:  { customerName, quantitySold: parseInt(quantitySold), sellingPrice: parseFloat(sellingPrice), actualMarginPct, marginDelta },
    });
    await writeAudit({ userId: req.user.id, action: 'update', entityType: 'sale', entityId: sale.id, oldValues: old, newValues: sale });
    res.json({ ok: true, sale });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

router.delete('/:id/sales/:saleId', requireAdmin, async (req, res) => {
  try {
    const old = await prisma.shipmentSale.findUnique({ where: { id: req.params.saleId } });
    await prisma.shipmentSale.delete({ where: { id: req.params.saleId } });
    await writeAudit({ userId: req.user.id, action: 'delete', entityType: 'sale', entityId: req.params.saleId, oldValues: old });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ---- SPLITS ----
router.put('/:id/splits', requireAdmin, async (req, res) => {
  const { splits } = req.body; // [{ userId, splitPct }]
  if (!Array.isArray(splits) || !splits.length) {
    return res.status(400).json({ ok: false, error: 'splits must be a non-empty array.' });
  }
  const total = splits.reduce((s, sp) => s + parseFloat(sp.splitPct), 0);
  if (Math.abs(total - 100) > 0.01) {
    return res.status(400).json({ ok: false, error: `Split percentages must sum to 100. Got ${total.toFixed(2)}.` });
  }
  try {
    await prisma.$transaction([
      prisma.shipmentInvestorSplit.deleteMany({ where: { shipmentId: req.params.id } }),
      ...splits.map(sp => prisma.shipmentInvestorSplit.create({
        data: { shipmentId: req.params.id, userId: sp.userId, splitPct: parseFloat(sp.splitPct) },
      })),
    ]);
    await writeAudit({ userId: req.user.id, action: 'update', entityType: 'splits', entityId: req.params.id, newValues: { splits } });
    const updated = await prisma.shipmentInvestorSplit.findMany({
      where: { shipmentId: req.params.id }, include: { user: { select: { id:true, name:true, email:true } } },
    });
    res.json({ ok: true, splits: updated });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ---- MILESTONES ----
router.post('/:id/milestones', requireAdmin, async (req, res) => {
  const { milestoneType, occurredAt, notes, source } = req.body;
  if (!milestoneType || !occurredAt) {
    return res.status(400).json({ ok: false, error: 'milestoneType and occurredAt are required.' });
  }
  try {
    const milestone = await prisma.shipmentMilestone.create({
      data: {
        shipmentId:   req.params.id,
        milestoneType,
        occurredAt:   new Date(occurredAt),
        notes:        notes?.trim() || null,
        source:       source || 'manual',
      },
    });
    await writeAudit({ userId: req.user.id, action: 'create', entityType: 'milestone', entityId: milestone.id, newValues: milestone });

    const [shipment, users] = await Promise.all([
      prisma.shipment.findUnique({ where: { id: req.params.id } }),
      prisma.user.findMany(),
    ]);
    notify.milestoneReached(users, shipment, milestone).catch(console.error);

    res.status(201).json({ ok: true, milestone });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

module.exports = router;
