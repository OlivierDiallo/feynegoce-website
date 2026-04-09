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

// Eagerly connect on the next tick so any engine startup failure surfaces
// in the runtime log instead of hanging the first inbound request behind
// the reverse proxy. setImmediate ensures this never blocks the require.
setImmediate(() => {
  prisma.$connect()
    .then(() => console.log('[Prisma] $connect ok'))
    .catch((err) => console.error('[Prisma] $connect failed:', err && err.stack || err));
});

module.exports = prisma;
