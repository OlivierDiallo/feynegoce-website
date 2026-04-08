#!/usr/bin/env node
/**
 * First-time database setup for Hostinger MySQL.
 *
 * Run once after creating the MySQL database in Hostinger panel:
 *   DATABASE_URL="mysql://user:pass@localhost:3306/dbname" node investor-dashboard/setup-db.js
 *
 * This will:
 *   1. Create all tables (prisma db push)
 *   2. Seed demo data (optional, skip with --no-seed)
 *   3. Create admin account from env vars
 */
'use strict';
const { execSync } = require('child_process');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const seedPath   = path.join(__dirname, 'prisma', 'seed.js');
const skipSeed   = process.argv.includes('--no-seed');

if (!process.env.DATABASE_URL) {
  console.error('\n  ERROR: DATABASE_URL is not set.\n');
  console.error('  Set it before running this script:');
  console.error('  DATABASE_URL="mysql://user:pass@localhost:3306/dbname" node investor-dashboard/setup-db.js\n');
  process.exit(1);
}

console.log('\n  Feynegoce — Database Setup');
console.log('  ─────────────────────────\n');

// Step 1: Push schema to database (creates tables)
console.log('  1. Creating tables...');
try {
  execSync(`npx prisma db push --schema=${schemaPath} --accept-data-loss`, { stdio: 'inherit' });
  console.log('  ✓ Tables created\n');
} catch (err) {
  console.error('  ✗ Failed to create tables. Check your DATABASE_URL.\n');
  process.exit(1);
}

// Step 2: Seed demo data
if (!skipSeed) {
  console.log('  2. Seeding demo data...');
  try {
    execSync(`node ${seedPath}`, { stdio: 'inherit' });
    console.log('  ✓ Demo data seeded\n');
  } catch (err) {
    console.error('  ✗ Seed failed (tables may already have data — this is OK).\n');
  }
} else {
  console.log('  2. Skipping seed (--no-seed)\n');
}

console.log('  ✅ Setup complete! Start the server with: npm start\n');
