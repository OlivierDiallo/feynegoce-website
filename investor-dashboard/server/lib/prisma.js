'use strict';
const { PrismaClient } = require('@prisma/client');

// Singleton to avoid exhausting the connection pool in dev (hot reload).
// We log warn+error in production too so engine startup / connection
// problems surface in the Hostinger runtime logs instead of silently
// hanging the request.
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['warn', 'error'],
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Eagerly connect so any engine startup failure surfaces at boot, not on
// the first inbound request (which would hang behind the reverse proxy).
prisma.$connect()
  .then(() => console.log('[Prisma] $connect ok'))
  .catch((err) => console.error('[Prisma] $connect failed:', err && err.stack || err));

module.exports = prisma;
