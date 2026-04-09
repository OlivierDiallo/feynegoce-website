#!/usr/bin/env node
/**
 * Runs after `npm install`.
 *
 *   1. Generate the Prisma client (so the app code can import it).
 *   2. Push the schema to the SQLite file so tables exist before boot.
 *
 * SQLite is the default. Both steps are idempotent — safe to run on every
 * deploy. The DATABASE_URL fallback in index.js points to
 * investor-dashboard/prisma/dev.db when the env var is unset.
 */
'use strict';
const { execSync } = require('child_process');
const path = require('path');

const schema = path.join(__dirname, 'prisma', 'schema.prisma');
// Mirror the runtime fallback so prisma CLI commands target the same file.
const dbFile = path.join(__dirname, 'prisma', 'dev.db');
process.env.DATABASE_URL = process.env.DATABASE_URL || `file:${dbFile}`;

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

try {
  run(`npx prisma generate --schema=${schema}`);
} catch (err) {
  console.error('[postinstall] prisma generate failed:', err.message);
  process.exit(1);
}

try {
  run(`npx prisma db push --schema=${schema} --skip-generate --accept-data-loss`);
  console.log('[postinstall] SQLite schema is in sync.');
} catch (err) {
  // Don't fail the install — let the server still start so we can read the
  // logs. Tables will throw a clearer error on the first query if missing.
  console.error('[postinstall] prisma db push failed:', err.message);
  console.error('[postinstall] Continuing without aborting npm install.');
}
