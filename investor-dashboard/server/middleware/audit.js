'use strict';
const prisma = require('../lib/prisma');

/**
 * auditLog(entityType)
 * Returns Express middleware that records create/update/delete in audit_log.
 * Attach AFTER the handler so it only fires on success.
 *
 * Usage in routes:
 *   router.post('/', requireAdmin, handler, auditLog('shipment'));
 *
 * Or call writeAudit() manually for complex multi-step operations.
 */

async function writeAudit({ userId, action, entityType, entityId, oldValues = null, newValues = null }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId, action, entityType, entityId,
        oldValues: oldValues != null ? JSON.stringify(oldValues) : null,
        newValues: newValues != null ? JSON.stringify(newValues) : null,
      },
    });
  } catch (err) {
    // Audit failures must not break the main operation
    console.error('[Audit] Write failed:', err.message);
  }
}

function auditLog(entityType) {
  return (req, res, next) => {
    // Patch res.json to intercept the response
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (body?.ok && req.user && req._auditMeta) {
        const { action, entityId, oldValues, newValues } = req._auditMeta;
        writeAudit({
          userId:     req.user.id,
          action,
          entityType,
          entityId:   entityId || body?.data?.id || 'unknown',
          oldValues,
          newValues,
        });
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { auditLog, writeAudit };
