'use strict';

/**
 * All financial calculations happen here — never in the frontend.
 */

function calcShipmentFinancials(shipment) {
  const costOfGoods = parseFloat(shipment.costOfGoods) || 0;
  const expenses    = (shipment.expenses || []).reduce((s, e) => s + parseFloat(e.amount), 0);
  const totalCost   = costOfGoods + expenses;
  const totalRev    = (shipment.sales || []).reduce((s, s2) => s + parseFloat(s2.sellingPrice), 0);
  const grossProfit = totalRev - totalCost;
  const margin      = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;

  const splits = (shipment.splits || []).map(split => ({
    userId:   split.userId,
    name:     split.user?.name || '—',
    splitPct: parseFloat(split.splitPct),
    payout:   grossProfit * (parseFloat(split.splitPct) / 100),
  }));

  return { costOfGoods, expenses, totalCost, totalRev, grossProfit, margin, splits };
}

function calcSaleMarginDelta(sale, shipment) {
  // Proportional cost per unit
  const costOfGoods = parseFloat(shipment.costOfGoods) || 0;
  const expenses    = (shipment.expenses || []).reduce((s, e) => s + parseFloat(e.amount), 0);
  const totalCost   = costOfGoods + expenses;
  const totalQty    = shipment.quantity || 1;
  const unitCost    = totalCost / totalQty;
  const proportionalCost = unitCost * sale.quantitySold;

  const actualMarginPct = proportionalCost > 0
    ? ((parseFloat(sale.sellingPrice) - proportionalCost) / proportionalCost) * 100
    : 0;
  const marginDelta = parseFloat(shipment.targetMarginPct) - actualMarginPct;

  return { actualMarginPct, marginDelta };
}

function calcProjections(shipments, investmentAmount) {
  const completed = shipments.filter(s => s.status === 'completed');
  if (completed.length < 3) {
    return { insufficient: true, count: completed.length };
  }

  const margins = completed.map(s => {
    const f = calcShipmentFinancials(s);
    return f.totalCost > 0 ? f.grossProfit / f.totalCost : 0;
  });

  const best    = Math.max(...margins);
  const worst   = Math.min(...margins);
  const average = margins.reduce((a, b) => a + b, 0) / margins.length;

  const inv = parseFloat(investmentAmount) || 0;
  return {
    insufficient: false,
    count:        completed.length,
    margins:      { best, worst, average },
    projections: {
      bestCase:    { return: inv * best,    total: inv + inv * best,    pct: best    * 100 },
      averageCase: { return: inv * average, total: inv + inv * average, pct: average * 100 },
      worstCase:   { return: inv * worst,   total: inv + inv * worst,   pct: worst   * 100 },
    },
  };
}

function calcOverviewSummary(shipments, currentUserId) {
  let totalInvested = 0;
  let totalRevenue  = 0;
  let myReturns     = 0;

  for (const s of shipments) {
    const f = calcShipmentFinancials(s);
    totalInvested += f.totalCost;
    totalRevenue  += f.totalRev;

    if (currentUserId) {
      const mySplit = f.splits.find(sp => sp.userId === currentUserId);
      if (mySplit) myReturns += mySplit.payout;
    }
  }

  const overallProfit = totalRevenue - totalInvested;
  const overallMargin = totalInvested > 0 ? (overallProfit / totalInvested) * 100 : 0;

  return { totalInvested, totalRevenue, overallProfit, overallMargin, myReturns };
}

module.exports = { calcShipmentFinancials, calcSaleMarginDelta, calcProjections, calcOverviewSummary };
