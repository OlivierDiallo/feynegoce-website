'use strict';
const nodemailer = require('nodemailer');

function createTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function send({ to, subject, html }) {
  const transport = createTransport();
  if (!transport) {
    console.log(`[Mailer] (no SMTP configured) → ${to}: ${subject}`);
    return { ok: true, mock: true };
  }
  try {
    const info = await transport.sendMail({
      from: process.env.SMTP_FROM || '"Feynegoce" <noreply@feynegoce.com>',
      to, subject, html,
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Mailer]', err.message);
    return { ok: false, error: err.message };
  }
}

function shipmentUpdateHtml(shipment, message) {
  const statusLabel = shipment.status.replace(/_/g, ' ').toUpperCase();
  return `
<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#0d0d0d;padding:24px 32px;display:flex;align-items:center;">
    <span style="color:#c8963e;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Feynegoce.</span>
  </div>
  <div style="padding:32px;border:1px solid #e8e8e8;border-top:none;">
    <h2 style="color:#0d0d0d;margin:0 0 8px;">Shipment Update</h2>
    <p style="color:#888;font-size:13px;margin:0 0 24px;">${new Date().toLocaleString()}</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr><td style="padding:8px 0;color:#888;font-size:13px;">Shipment</td><td style="padding:8px 0;font-weight:600;">${shipment.title}</td></tr>
      <tr><td style="padding:8px 0;color:#888;font-size:13px;">Status</td>
          <td style="padding:8px 0;"><span style="background:#c8963e;color:#fff;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:600;">${statusLabel}</span></td></tr>
      <tr><td style="padding:8px 0;color:#888;font-size:13px;">Route</td><td style="padding:8px 0;">${shipment.originPort || '—'} → ${shipment.destinationPort || '—'}</td></tr>
    </table>
    <div style="background:#f9f9f9;border-left:3px solid #c8963e;padding:16px 20px;border-radius:0 4px 4px 0;">
      <p style="margin:0;color:#0d0d0d;">${message}</p>
    </div>
    <p style="margin-top:24px;font-size:12px;color:#bbb;">
      You are receiving this because you are a registered stakeholder of Feynegoce.
      Log in to the dashboard for full details.
    </p>
  </div>
</div>`;
}

async function notifyAll(users, shipment, message) {
  const results = [];
  for (const user of users) {
    if (!user.email) continue;
    results.push(await send({
      to:      user.email,
      subject: `[Feynegoce] ${shipment.title} — ${shipment.status.replace(/_/g, ' ')}`,
      html:    shipmentUpdateHtml(shipment, message),
    }));
  }
  return results;
}

module.exports = { send, notifyAll };
