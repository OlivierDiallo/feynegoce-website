'use strict';
const express = require('express');
const router  = express.Router();
const prisma  = require('../lib/prisma');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { writeAudit } = require('../middleware/audit');

// GET /api/v1/products  — list all products (any authenticated user)
router.get('/', requireAuth, async (_req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { name: 'asc' } });
    res.json({ ok: true, products });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// POST /api/v1/products  (admin)
router.post('/', requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ ok: false, error: 'Name is required.' });
  }
  try {
    const product = await prisma.product.create({
      data: { name: name.trim(), description: description?.trim() || null },
    });
    await writeAudit({ userId: req.user.id, action: 'create', entityType: 'product', entityId: product.id, newValues: product });
    res.status(201).json({ ok: true, product });
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ ok: false, error: 'A product with that name already exists.' });
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUT /api/v1/products/:id  (admin)
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  try {
    const data = {};
    if (name?.trim())              data.name        = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    const product = await prisma.product.update({ where: { id: req.params.id }, data });
    await writeAudit({ userId: req.user.id, action: 'update', entityType: 'product', entityId: product.id, newValues: data });
    res.json({ ok: true, product });
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ ok: false, error: 'A product with that name already exists.' });
    if (err.code === 'P2025') return res.status(404).json({ ok: false, error: 'Product not found.' });
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/v1/products/:id  (admin) — refuses if shipments still reference it
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const inUse = await prisma.shipment.count({ where: { productId: req.params.id, deletedAt: null } });
    if (inUse > 0) {
      return res.status(400).json({ ok: false, error: `Cannot delete: ${inUse} shipment${inUse === 1 ? '' : 's'} still reference this product.` });
    }
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ ok: false, error: 'Product not found.' });
    await prisma.product.delete({ where: { id: req.params.id } });
    await writeAudit({ userId: req.user.id, action: 'delete', entityType: 'product', entityId: req.params.id, oldValues: product });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

module.exports = router;
