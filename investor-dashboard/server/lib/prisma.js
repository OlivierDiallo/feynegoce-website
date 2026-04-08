'use strict';
const { PrismaClient } = require('@prisma/client');

// Singleton to avoid exhausting the connection pool in dev (hot reload)
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

module.exports = prisma;
