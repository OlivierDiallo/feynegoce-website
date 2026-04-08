'use strict';
const nodemailer = require('nodemailer');

function createTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const FROM = process.env.SMTP_FROM || '"Feynegoce Dashboard" <noreply@feynegoce.com>';

const EVENTS = {
  shipment_created:    'new_shipment',
  milestone_reached:   'milestone',
  eta_updated:         'eta_update',
  sale_recorded:       'new_sale',
  financial_available: 'financial_report',
};

function baseTemplate(title, body) {
  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#EDF2F7;font-family:Inter,Arial,sans-serif;">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
  <div style="background:#1B2A4A;padding:24px 32px;">
    <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-.02em;">Feynegoce<span style="color:#2E75B6">.</span></span>
    <span style="color:rgba(255,255,255,.5);font-size:12px;margin-left:12px;text-transform:uppercase;letter-spacing:.1em;">Investor Dashboard</span>
  </div>
  <div style="padding:32px;">
    <h2 style="color:#1B2A4A;margin:0 0 8px;font-size:18px;">${title}</h2>
    ${body}
    <hr style="border:none;border-top:1px solid #EDF2F7;margin:24px 0;"/>
    <p style="color:#aaa;font-size:12px;margin:0;">You received this because you are a registered stakeholder of Feynegoce.
      <a href="${process.env.FRONTEND_URL || '#'}/dashboard" style="color:#2E75B6;">View Dashboard</a>
    </p>
  </div>
</div>
</body></html>`;
}

async function dispatch(users, eventKey, subject, htmlBody) {
  const transport = createTransport();
  if (!transport) {
    console.log(`[Notify] No SMTP — would send "${subject}" to ${users.length} users`);
    return;
  }
  const prefKey = EVENTS[eventKey];
  const targets = users.filter(u => {
    const prefs = typeof u.notificationPrefs === 'string' ? JSON.parse(u.notificationPrefs || '{}') : (u.notificationPrefs || {});
    return prefs[prefKey] !== false;
  });
  for (const user of targets) {
    try {
      await transport.sendMail({ from: FROM, to: user.email, subject, html: htmlBody });
    } catch (err) {
      console.error(`[Notify] Failed to send to ${user.email}:`, err.message);
    }
  }
}

async function shipmentCreated(users, shipment) {
  await dispatch(users, 'shipment_created',
    `New shipment created — ${shipment.reference}`,
    baseTemplate('New Shipment Created', `
      <p style="color:#555">A new shipment has been added to the dashboard.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;color:#888;font-size:13px">Reference</td><td style="font-weight:600">${shipment.reference}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-size:13px">Route</td><td>${shipment.origin} → ${shipment.destination}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-size:13px">Status</td><td><span style="background:#fef3c7;color:#92400e;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:600;">PENDING</span></td></tr>
      </table>`));
}

async function milestoneReached(users, shipment, milestone) {
  const labels = { departed:'Departed', port_arrival:'Port Arrival', customs_cleared:'Customs Cleared', loaded_truck:'Loaded on Truck', delivered:'Delivered' };
  await dispatch(users, 'milestone_reached',
    `Shipment milestone — ${shipment.reference}: ${labels[milestone.milestoneType]}`,
    baseTemplate(`Milestone: ${labels[milestone.milestoneType]}`, `
      <p style="color:#555">Shipment <strong>${shipment.reference}</strong> has reached a new milestone.</p>
      <div style="background:#f0fdf4;border-left:3px solid #22c55e;padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0;">
        <div style="font-weight:600;color:#166534">${labels[milestone.milestoneType]}</div>
        <div style="color:#555;font-size:13px;margin-top:4px">${new Date(milestone.occurredAt).toLocaleString()}${milestone.notes ? ` — ${milestone.notes}` : ''}</div>
      </div>`));
}

async function saleRecorded(users, shipment, sale) {
  await dispatch(users, 'sale_recorded',
    `New sale recorded — ${shipment.reference}`,
    baseTemplate('New Sale Recorded', `
      <p style="color:#555">A new sale has been recorded for <strong>${shipment.reference}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;color:#888;font-size:13px">Customer</td><td style="font-weight:600">${sale.customerName}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-size:13px">Revenue</td><td style="font-weight:600;color:#16a34a">€${Number(sale.sellingPrice).toLocaleString()}</td></tr>
        <tr><td style="padding:8px 0;color:#888;font-size:13px">Margin</td><td>${Number(sale.actualMarginPct).toFixed(1)}%</td></tr>
      </table>`));
}

module.exports = { shipmentCreated, milestoneReached, saleRecorded };
