'use strict';
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

async function main() {
  console.log('🌱 Seeding database...');

  // USERS
  const [admin, investor1, investor2] = await Promise.all([
    prisma.user.upsert({ where: { email: 'admin@feynegoce.com' }, update: {},
      create: { email: 'admin@feynegoce.com', passwordHash: bcrypt.hashSync('admin123', ROUNDS),
        name: 'Olivier Diallo', role: 'admin',
        notificationPrefs: JSON.stringify({ new_shipment: true, milestone: true, eta_update: true, new_sale: true, financial_report: true }) } }),
    prisma.user.upsert({ where: { email: 'investor1@feynegoce.com' }, update: {},
      create: { email: 'investor1@feynegoce.com', passwordHash: bcrypt.hashSync('invest123', ROUNDS),
        name: 'Jean-Baptiste Koné', role: 'investor',
        notificationPrefs: JSON.stringify({ new_shipment: true, milestone: true, eta_update: false, new_sale: true, financial_report: true }) } }),
    prisma.user.upsert({ where: { email: 'investor2@feynegoce.com' }, update: {},
      create: { email: 'investor2@feynegoce.com', passwordHash: bcrypt.hashSync('invest123', ROUNDS),
        name: 'Marie Dubois', role: 'investor',
        notificationPrefs: JSON.stringify({ new_shipment: false, milestone: true, eta_update: false, new_sale: true, financial_report: true }) } }),
  ]);
  console.log('✓ Users created');

  // PRODUCTS
  const [tires, textiles, electronics] = await Promise.all([
    prisma.product.upsert({ where: { name: 'Tires' }, update: {},
      create: { name: 'Tires', description: 'Automotive tires — Tomket, Barum and other European brands for West African market' } }),
    prisma.product.upsert({ where: { name: 'Textiles' }, update: {},
      create: { name: 'Textiles', description: 'Fabric and garment exports from Asia and Europe' } }),
    prisma.product.upsert({ where: { name: 'Electronics' }, update: {},
      create: { name: 'Electronics', description: 'Consumer electronics and accessories' } }),
  ]);
  console.log('✓ Products created');

  // Helper to clean up existing test shipments
  await prisma.shipment.deleteMany({ where: { reference: { in: ['FYN-2024-001','FYN-2024-002','FYN-2024-003','FYN-2025-001','FYN-2025-002'] } } });

  // SHIPMENT 1 — Tires, completed, high margin
  const s1 = await prisma.shipment.create({
    data: {
      productId: tires.id, reference: 'FYN-2024-001',
      origin: 'Prague, Czech Republic', destination: 'Dakar, Senegal',
      quantity: 1200, quantityUnit: 'units',
      costOfGoods: 62400, currency: 'EUR', targetMarginPct: 22,
      eta: new Date('2024-09-15'), status: 'completed',
      trackingNumber: 'MSC-TK-29847',
      notes: 'Tomket T1 & T2 tires, container MSCU1234567. Sold to 3 distributors in Dakar.',
      expenses: { create: [
        { category: 'shipping',  description: 'Ocean freight MSC', amount: 3800 },
        { category: 'customs',   description: 'Dakar customs & duties', amount: 2200 },
        { category: 'insurance', description: 'Cargo insurance', amount: 620 },
        { category: 'handling',  description: 'Port handling & storage', amount: 480 },
        { category: 'trucking',  description: 'Final mile distribution Dakar', amount: 950 },
      ]},
      sales: { create: [
        { customerName: 'Diallo Auto Parts SARL', quantitySold: 500, sellingPrice: 28500, actualMarginPct: 24.1, marginDelta: -2.1 },
        { customerName: 'Sénégal Pneumatiques', quantitySold: 450, sellingPrice: 25200, actualMarginPct: 22.8, marginDelta: -0.8 },
        { customerName: 'West Africa Tires Co.', quantitySold: 250, sellingPrice: 13800, actualMarginPct: 21.2, marginDelta: 0.8 },
      ]},
      splits: { create: [
        { userId: admin.id, splitPct: 34 },
        { userId: investor1.id, splitPct: 33 },
        { userId: investor2.id, splitPct: 33 },
      ]},
      milestones: { create: [
        { milestoneType: 'departed',        occurredAt: new Date('2024-07-10T08:00:00'), notes: 'Departed from Hamburg port', source: 'manual' },
        { milestoneType: 'port_arrival',    occurredAt: new Date('2024-08-28T14:00:00'), notes: 'Arrived Dakar port', source: 'manual' },
        { milestoneType: 'customs_cleared', occurredAt: new Date('2024-09-04T11:30:00'), notes: 'All documents cleared', source: 'manual' },
        { milestoneType: 'loaded_truck',    occurredAt: new Date('2024-09-06T09:00:00'), notes: 'Loaded to 3 delivery trucks', source: 'manual' },
        { milestoneType: 'delivered',       occurredAt: new Date('2024-09-12T16:00:00'), notes: 'All deliveries completed', source: 'manual' },
      ]},
    },
  });

  // SHIPMENT 2 — Textiles, completed, good margin
  const s2 = await prisma.shipment.create({
    data: {
      productId: textiles.id, reference: 'FYN-2024-002',
      origin: 'Guangzhou, China', destination: 'Abidjan, Côte d\'Ivoire',
      quantity: 8500, quantityUnit: 'kg',
      costOfGoods: 38000, currency: 'EUR', targetMarginPct: 28,
      eta: new Date('2024-11-20'), status: 'completed',
      trackingNumber: 'CMA-TX-88234',
      expenses: { create: [
        { category: 'shipping',  description: 'CMA CGM ocean freight', amount: 4200 },
        { category: 'customs',   description: 'Abidjan customs clearance', amount: 1800 },
        { category: 'insurance', description: 'Cargo insurance', amount: 380 },
        { category: 'handling',  description: 'Port handling', amount: 320 },
      ]},
      sales: { create: [
        { customerName: 'Marché Cocody Textiles', quantitySold: 4000, sellingPrice: 29000, actualMarginPct: 30.2, marginDelta: -2.2 },
        { customerName: 'Abidjan Fashion Group', quantitySold: 4500, sellingPrice: 31500, actualMarginPct: 26.8, marginDelta: 1.2 },
      ]},
      splits: { create: [
        { userId: admin.id, splitPct: 40 },
        { userId: investor1.id, splitPct: 60 },
      ]},
      milestones: { create: [
        { milestoneType: 'departed',        occurredAt: new Date('2024-09-25T06:00:00'), source: 'manual' },
        { milestoneType: 'port_arrival',    occurredAt: new Date('2024-11-05T10:00:00'), source: 'manual' },
        { milestoneType: 'customs_cleared', occurredAt: new Date('2024-11-12T14:00:00'), source: 'manual' },
        { milestoneType: 'loaded_truck',    occurredAt: new Date('2024-11-14T08:00:00'), source: 'manual' },
        { milestoneType: 'delivered',       occurredAt: new Date('2024-11-18T17:00:00'), source: 'manual' },
      ]},
    },
  });

  // SHIPMENT 3 — Tires, completed, compressed margins
  const s3 = await prisma.shipment.create({
    data: {
      productId: tires.id, reference: 'FYN-2024-003',
      origin: 'Prague, Czech Republic', destination: 'Lagos, Nigeria',
      quantity: 800, quantityUnit: 'units',
      costOfGoods: 43200, currency: 'EUR', targetMarginPct: 22,
      eta: new Date('2024-12-10'), status: 'completed',
      trackingNumber: 'MSC-TK-31092',
      expenses: { create: [
        { category: 'shipping',  description: 'Ocean freight', amount: 4100 },
        { category: 'customs',   description: 'Nigeria import duties', amount: 3600 },
        { category: 'insurance', description: 'Marine insurance', amount: 540 },
        { category: 'handling',  description: 'Apapa port handling', amount: 820 },
        { category: 'trucking',  description: 'Lagos distribution', amount: 1200 },
      ]},
      sales: { create: [
        { customerName: 'Lagos Auto Centre', quantitySold: 400, sellingPrice: 22000, actualMarginPct: 14.2, marginDelta: 7.8 },
        { customerName: 'Nigerian Tire Depot', quantitySold: 400, sellingPrice: 22800, actualMarginPct: 16.5, marginDelta: 5.5 },
      ]},
      splits: { create: [
        { userId: admin.id, splitPct: 34 },
        { userId: investor1.id, splitPct: 33 },
        { userId: investor2.id, splitPct: 33 },
      ]},
      milestones: { create: [
        { milestoneType: 'departed',        occurredAt: new Date('2024-10-15T07:00:00'), source: 'manual' },
        { milestoneType: 'port_arrival',    occurredAt: new Date('2024-11-30T12:00:00'), source: 'manual' },
        { milestoneType: 'customs_cleared', occurredAt: new Date('2024-12-08T09:00:00'), notes: 'Customs delayed by 6 days due to documentation', source: 'manual' },
        { milestoneType: 'delivered',       occurredAt: new Date('2024-12-14T15:00:00'), source: 'manual' },
      ]},
    },
  });

  // SHIPMENT 4 — Electronics, in transit
  const s4 = await prisma.shipment.create({
    data: {
      productId: electronics.id, reference: 'FYN-2025-001',
      origin: 'Shenzhen, China', destination: 'Dakar, Senegal',
      quantity: 2000, quantityUnit: 'units',
      costOfGoods: 52000, currency: 'EUR', targetMarginPct: 30,
      eta: new Date('2026-05-10'), status: 'in_transit',
      trackingNumber: 'COSCO-EL-77821',
      notes: 'Mixed electronics batch: smartphones, tablets, accessories',
      expenses: { create: [
        { category: 'shipping',  description: 'COSCO ocean freight', amount: 5200 },
        { category: 'insurance', description: 'All-risk cargo insurance', amount: 780 },
      ]},
      splits: { create: [
        { userId: admin.id, splitPct: 34 },
        { userId: investor1.id, splitPct: 33 },
        { userId: investor2.id, splitPct: 33 },
      ]},
      milestones: { create: [
        { milestoneType: 'departed',     occurredAt: new Date('2026-03-20T06:00:00'), notes: 'Departed Shenzhen port', source: 'manual' },
        { milestoneType: 'port_arrival', occurredAt: new Date('2026-04-02T10:00:00'), notes: 'Transit stop Singapore', source: 'manual' },
      ]},
    },
  });

  // SHIPMENT 5 — Textiles, pending
  const s5 = await prisma.shipment.create({
    data: {
      productId: textiles.id, reference: 'FYN-2025-002',
      origin: 'Istanbul, Turkey', destination: 'Abidjan, Côte d\'Ivoire',
      quantity: 12000, quantityUnit: 'kg',
      costOfGoods: 45000, currency: 'EUR', targetMarginPct: 25,
      eta: new Date('2026-07-15'), status: 'pending',
      notes: 'High-quality Turkish cotton fabrics. Payment due before loading.',
      expenses: { create: [] },
      splits: { create: [
        { userId: admin.id, splitPct: 50 },
        { userId: investor2.id, splitPct: 50 },
      ]},
      milestones: { create: [] },
    },
  });

  console.log('✓ Shipments created (5 total)');
  console.log('\n✅ Seed complete!\n');
  console.log('Test accounts:');
  console.log('  Admin:     admin@feynegoce.com    / admin123');
  console.log('  Investor1: investor1@feynegoce.com / invest123');
  console.log('  Investor2: investor2@feynegoce.com / invest123\n');
}

main()
  .catch(err => { console.error('Seed failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
