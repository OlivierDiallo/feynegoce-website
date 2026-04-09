#!/usr/bin/env node
/**
 * Runs after `npm install`.
 *
 *   1. Always: generate the Prisma client (so the app code can import it).
 *   2. On the production server only: push the schema to MySQL so the tables
 *      exist before the server boots. This is idempotent — Prisma only
 *      issues DDL when the live schema differs from schema.prisma.
 *
 * Skipped locally so a developer running `npm install` never accidentally
 * mutates a remote DB. The trigger is the combination of DATABASE_URL being
 * set AND NODE_ENV=production (which Hostinger sets automatically), or the
 * explicit FORCE_DB_PUSH=1 escape hatch for one-off bootstrap runs.
 */
'use strict';
const { execSync } = require('child_process');
const path = require('path');

const schema = path.join(__dirname, 'prisma', 'schema.prisma');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

// Step 1 — generate client (always)
try {
  run(`npx prisma generate --schema=${schema}`);
} catch (err) {
  console.error('[postinstall] prisma generate failed:', err.message);
  process.exit(1);
}

// Step 2 — push schema only on the production server
const isProdServer = process.env.NODE_ENV === 'production' && !!process.env.DATABASE_URL;
const forced = process.env.FORCE_DB_PUSH === '1';

if (!isProdServer && !forced) {
  console.log('[postinstall] Skipping prisma db push (not a production server). Set FORCE_DB_PUSH=1 to override.');
  process.exit(0);
}

console.log('[postinstall] Pushing Prisma schema to the database...');
try {
  run(`npx prisma db push --schema=${schema} --skip-generate`);
  console.log('[postinstall] Schema is in sync.');
} catch (err) {
  // Don't fail the install — let the server still start so we can read the
  // logs and diagnose. The app will surface a clearer error on the first DB
  // query if tables are still missing.
  console.error('[postinstall] prisma db push failed:', err.message);
  console.error('[postinstall] Continuing without aborting npm install.');
}
