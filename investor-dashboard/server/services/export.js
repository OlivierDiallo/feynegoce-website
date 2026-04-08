'use strict';
const { stringify } = require('csv-stringify/sync');
const { calcShipmentFinancials } = require('./financials');

function shipmentsToCSV(shipments) {
  const rows = shipments.map(s => {
    const f = calcShipmentFinancials(s);
    return {
      Reference:      s.reference,
      Product:        s.product?.name || '—',
      Origin:         s.origin,
      Destination:    s.destination,
      Status:         s.status,
      Currency:       s.currency,
      'Cost of Goods': f.costOfGoods.toFixed(2),
      'Total Expenses': f.expenses.toFixed(2),
      'Total Cost':   f.totalCost.toFixed(2),
      'Total Revenue': f.totalRev.toFixed(2),
      'Gross Profit': f.grossProfit.toFixed(2),
      'Margin %':     f.margin.toFixed(2),
      'Target Margin %': parseFloat(s.targetMarginPct).toFixed(2),
      ETA:            s.eta ? new Date(s.eta).toISOString().split('T')[0] : '',
      Created:        s.createdAt.toISOString().split('T')[0],
    };
  });
  return stringify(rows, { header: true });
}

function transactionsToCSV(shipments) {
  const rows = [];
  for (const s of shipments) {
    rows.push({
      Date:        s.createdAt.toISOString().split('T')[0],
      Reference:   s.reference,
      Type:        'Cost of Goods',
      Category:    'goods',
      Description: s.product?.name || '—',
      Amount:      `-${parseFloat(s.costOfGoods).toFixed(2)}`,
      Currency:    s.currency,
    });
    for (const e of (s.expenses || [])) {
      rows.push({
        Date:        e.createdAt.toISOString().split('T')[0],
        Reference:   s.reference,
        Type:        'Expense',
        Category:    e.category,
        Description: e.description || '—',
        Amount:      `-${parseFloat(e.amount).toFixed(2)}`,
        Currency:    s.currency,
      });
    }
    for (const sl of (s.sales || [])) {
      rows.push({
        Date:        sl.createdAt.toISOString().split('T')[0],
        Reference:   s.reference,
        Type:        'Revenue',
        Category:    'sale',
        Description: sl.customerName,
        Amount:      `+${parseFloat(sl.sellingPrice).toFixed(2)}`,
        Currency:    s.currency,
      });
    }
  }
  return stringify(rows, { header: true });
}

function auditToCSV(logs) {
  const rows = logs.map(l => ({
    Timestamp:  l.timestamp.toISOString(),
    User:       l.user?.name || l.userId,
    Action:     l.action,
    Entity:     l.entityType,
    'Entity ID': l.entityId,
    'Old Values': l.oldValues ? JSON.stringify(l.oldValues) : '',
    'New Values': l.newValues ? JSON.stringify(l.newValues) : '',
  }));
  return stringify(rows, { header: true });
}

module.exports = { shipmentsToCSV, transactionsToCSV, auditToCSV };
