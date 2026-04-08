/* ============================================================
   FEYNEGOCE DASHBOARD — app.js
   Shared logic for admin.html and investor.html
   ============================================================ */

'use strict';

// ---- Auth helpers ----
function getToken()  { return localStorage.getItem('fn_token'); }
function getRole()   { return localStorage.getItem('fn_role'); }
function getName()   { return localStorage.getItem('fn_name'); }

function logout() {
  localStorage.removeItem('fn_token');
  localStorage.removeItem('fn_role');
  localStorage.removeItem('fn_name');
  window.location.href = '/dashboard/login.html';
}

async function api(method, path, body) {
  const opts = {
    method,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch('/api' + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ---- Toast ----
function toast(msg, type = 'info') {
  const stack = document.getElementById('toastStack');
  const el    = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  stack.appendChild(el);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('show'));
  });
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

// ---- Modal helpers ----
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Close on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ---- Format helpers ----
function fmtCurrency(n, currency = 'EUR') {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function statusBadge(status) {
  const labels = {
    pending_payment: 'Pending Payment',
    paid:            'Paid',
    loading:         'Loading',
    in_transit:      'In Transit',
    arrived:         'Arrived',
    delivered:       'Delivered',
  };
  const label = labels[status] || status;
  const pulse = status === 'in_transit' ? '<span class="pulse" style="margin-right:4px"></span>' : '';
  return `<span class="badge badge-${status}">${pulse}${label}</span>`;
}

function payBadge(status) {
  const colors = { pending: '#888', partial: '#fb923c', paid: '#4ade80' };
  const labels = { pending: 'Unpaid', partial: 'Partial', paid: 'Paid' };
  return `<span style="color:${colors[status]||'#888'};font-size:.75rem;font-weight:600">${labels[status]||status}</span>`;
}

// ---- Leaflet map instance ----
let leafletMap = null;
let vesselMarker = null;

const PORT_COORDS = {
  'SHANGHAI':      [31.23, 121.47], 'NINGBO':       [29.87, 121.55],
  'GUANGZHOU':     [23.10, 113.26], 'SHENZHEN':     [22.52, 114.06],
  'SINGAPORE':     [1.29,  103.85], 'COLOMBO':      [6.93,  79.85],
  'MUMBAI':        [18.93, 72.84],  'DUBAI':        [25.12, 55.38],
  'JEDDAH':        [21.53, 39.17],  'SUEZ':         [29.97, 32.55],
  'PORT SAID':     [31.26, 32.31],  'DAKAR':        [14.69, -17.44],
  'ABIDJAN':       [5.35,  -4.01],  'TEMA':         [5.62,  -0.02],
  'LAGOS':         [6.45,  3.39],   'MOMBASA':      [-4.06, 39.67],
  'CAPE TOWN':     [-33.92, 18.42], 'DURBAN':       [-29.87, 31.03],
  'CASABLANCA':    [33.59, -7.62],  'ROTTERDAM':    [51.90, 4.47],
  'HAMBURG':       [53.55, 9.99],   'ANTWERP':      [51.23, 4.40],
  'MARSEILLE':     [43.30, 5.37],   'LE HAVRE':     [49.49, 0.11],
};

function portCoords(name) {
  if (!name) return null;
  const u = name.toUpperCase();
  for (const [k, v] of Object.entries(PORT_COORDS)) {
    if (u.includes(k)) return v;
  }
  return null;
}

function initMap() {
  if (leafletMap) { leafletMap.remove(); leafletMap = null; vesselMarker = null; }
  leafletMap = L.map('trackMap', { zoomControl: true }).setView([15, 40], 3);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(leafletMap);
}

const vesselIcon = L.divIcon({
  html: `<div style="background:#c8963e;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 6px rgba(200,150,62,.8)"></div>`,
  className: '', iconSize: [14, 14], iconAnchor: [7, 7],
});
const portIcon = L.divIcon({
  html: `<div style="background:#60a5fa;width:10px;height:10px;border-radius:50%;border:2px solid #fff"></div>`,
  className: '', iconSize: [10, 10], iconAnchor: [5, 5],
});

// ============================================================
//  SHIPMENTS
// ============================================================
let allShipments = [];

async function loadShipments() {
  try {
    const data = await api('GET', '/shipments');
    allShipments = data.shipments || [];
    renderShipments(allShipments);
    renderShipmentStats(allShipments);
  } catch (err) {
    toast(err.message, 'error');
  }
}

function renderShipmentStats(shipments) {
  const el = document.getElementById('shipmentStats');
  if (!el) return;
  const total     = shipments.length;
  const inTransit = shipments.filter(s => s.status === 'in_transit').length;
  const delivered = shipments.filter(s => s.status === 'delivered').length;
  const value     = shipments.reduce((s, x) => s + (x.totalValue || 0), 0);
  el.innerHTML = `
    <div class="stat-card">
      <div class="label">Total Shipments</div>
      <div class="value">${total}</div>
    </div>
    <div class="stat-card accent">
      <div class="label">In Transit</div>
      <div class="value">${inTransit}</div>
      ${inTransit > 0 ? '<div class="sub"><span class="pulse"></span> Live tracking active</div>' : ''}
    </div>
    <div class="stat-card positive">
      <div class="label">Delivered</div>
      <div class="value">${delivered}</div>
    </div>
    <div class="stat-card">
      <div class="label">Total Value</div>
      <div class="value">${fmtCurrency(value)}</div>
    </div>
  `;
}

function renderShipments(shipments) {
  const container = document.getElementById('shipmentsContainer');
  if (!container) return;
  if (!shipments.length) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <p>No shipments yet.${getRole() === 'admin' ? ' Create your first shipment above.' : ''}</p>
      </div>`;
    return;
  }
  const isAdmin = getRole() === 'admin';
  container.innerHTML = `<div class="shipments-grid">${shipments.map(s => shipmentCard(s, isAdmin)).join('')}</div>`;
}

function shipmentCard(s, isAdmin) {
  const eta = s.actualArrival || s.expectedArrival;
  const progress = calcProgress(s.status);
  return `
    <div class="shipment-card">
      <div class="sc-header">
        <div>
          <div class="sc-title">${esc(s.title)}</div>
          <div class="sc-supplier">${esc(s.supplier || '—')}</div>
        </div>
        ${statusBadge(s.status)}
      </div>
      <div class="sc-route">
        <span>${esc(s.originPort || '—')}</span>
        <span class="sc-route-arrow">→</span>
        <span>${esc(s.destinationPort || '—')}</span>
      </div>
      <div class="progress-bar" style="margin-bottom:14px" title="${progress}% complete">
        <div class="progress-fill" style="width:${progress}%"></div>
      </div>
      <div class="sc-meta">
        <div class="sc-meta-item">
          <div class="key">ETA</div>
          <div class="val">${fmtDate(eta)}</div>
        </div>
        <div class="sc-meta-item">
          <div class="key">Payment</div>
          <div class="val">${payBadge(s.paymentStatus)}</div>
        </div>
        <div class="sc-meta-item">
          <div class="key">Value</div>
          <div class="val">${fmtCurrency(s.totalValue)}</div>
        </div>
        <div class="sc-meta-item">
          <div class="key">Container</div>
          <div class="val" style="font-size:.75rem">${esc(s.containerNumber || '—')}</div>
        </div>
      </div>
      <div class="sc-actions">
        <button class="btn btn-ghost btn-sm" onclick="openTracking(${s.id})">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
          Track
        </button>
        ${isAdmin ? `
        <button class="btn btn-ghost btn-sm" onclick="editShipment(${s.id})">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteShipment(${s.id},'${esc(s.title)}')">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          Delete
        </button>` : ''}
      </div>
    </div>`;
}

function calcProgress(status) {
  const map = { pending_payment: 5, paid: 20, loading: 40, in_transit: 65, arrived: 90, delivered: 100 };
  return map[status] || 0;
}

// ---- Shipment modal ----
let editingShipmentId = null;

function openShipmentModal(shipment = null) {
  editingShipmentId = shipment ? shipment.id : null;
  const title = document.getElementById('shipmentModalTitle');
  const btn   = document.getElementById('smSaveBtn');
  title.textContent = shipment ? 'Edit Shipment' : 'New Shipment';
  btn.textContent   = shipment ? 'Save Changes' : 'Create Shipment';

  const fields = {
    'sm-id':        shipment?.id || '',
    'sm-title':     shipment?.title || '',
    'sm-supplier':  shipment?.supplier || '',
    'sm-value':     shipment?.totalValue || '',
    'sm-origin':    shipment?.originPort || '',
    'sm-dest':      shipment?.destinationPort || '',
    'sm-imo':       shipment?.vesselImo || '',
    'sm-container': shipment?.containerNumber || '',
    'sm-departure': shipment?.expectedDeparture || '',
    'sm-arrival':   shipment?.expectedArrival || '',
    'sm-status':    shipment?.status || 'pending_payment',
    'sm-paystatus': shipment?.paymentStatus || 'pending',
    'sm-payamount': shipment?.paymentAmount || '',
    'sm-notes':     shipment?.notes || '',
  };
  for (const [id, val] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }
  openModal('shipmentModal');
}

function editShipment(id) {
  const s = allShipments.find(x => x.id === id);
  if (s) openShipmentModal(s);
}

async function saveShipment() {
  const btn = document.getElementById('smSaveBtn');
  btn.disabled = true;
  const payload = {
    title:             document.getElementById('sm-title').value.trim(),
    supplier:          document.getElementById('sm-supplier').value.trim(),
    totalValue:        document.getElementById('sm-value').value,
    originPort:        document.getElementById('sm-origin').value.trim(),
    destinationPort:   document.getElementById('sm-dest').value.trim(),
    vesselImo:         document.getElementById('sm-imo').value.trim(),
    containerNumber:   document.getElementById('sm-container').value.trim(),
    expectedDeparture: document.getElementById('sm-departure').value,
    expectedArrival:   document.getElementById('sm-arrival').value,
    status:            document.getElementById('sm-status').value,
    paymentStatus:     document.getElementById('sm-paystatus').value,
    paymentAmount:     document.getElementById('sm-payamount').value,
    notes:             document.getElementById('sm-notes').value.trim(),
  };
  try {
    if (editingShipmentId) {
      await api('PUT', `/shipments/${editingShipmentId}`, payload);
      toast('Shipment updated', 'success');
    } else {
      await api('POST', '/shipments', payload);
      toast('Shipment created', 'success');
    }
    closeModal('shipmentModal');
    loadShipments();
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function deleteShipment(id, title) {
  if (!confirm(`Delete shipment "${title}"? This cannot be undone.`)) return;
  try {
    await api('DELETE', `/shipments/${id}`);
    toast('Shipment deleted', 'info');
    loadShipments();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ---- Tracking modal ----
async function openTracking(shipmentId) {
  const s = allShipments.find(x => x.id === shipmentId);
  document.getElementById('trackModalTitle').textContent = s ? s.title : 'Tracking';
  document.getElementById('trackInfo').innerHTML = `<div style="display:flex;align-items:center;gap:10px;color:var(--muted)"><div class="spinner"></div> Fetching position…</div>`;
  document.getElementById('trackTimeline').innerHTML = '';
  openModal('trackModal');

  // Wait for modal to render, then init map
  await new Promise(r => setTimeout(r, 120));
  initMap();

  // Draw origin → destination baseline
  const oc = s ? portCoords(s.originPort)      : null;
  const dc = s ? portCoords(s.destinationPort) : null;
  if (oc) L.marker(oc, { icon: portIcon }).addTo(leafletMap).bindPopup(`<b>Origin:</b> ${s.originPort}`);
  if (dc) L.marker(dc, { icon: portIcon }).addTo(leafletMap).bindPopup(`<b>Destination:</b> ${s.destinationPort}`);
  if (oc && dc) {
    L.polyline([oc, dc], { color: '#c8963e', weight: 2, dashArray: '6,6', opacity: .5 }).addTo(leafletMap);
    leafletMap.fitBounds([oc, dc], { padding: [50, 50] });
  }

  try {
    // Load events and position in parallel
    const [detail, track] = await Promise.all([
      api('GET', `/shipments/${shipmentId}`),
      api('GET', `/shipments/${shipmentId}/track`),
    ]);

    renderTimeline(detail.events || []);

    if (track.position) {
      renderTrackInfo(track.position, s);
      const lat = track.position.lat;
      const lon = track.position.lon;
      if (lat && lon) {
        const pos = [lat, lon];
        if (vesselMarker) vesselMarker.remove();
        vesselMarker = L.marker(pos, { icon: vesselIcon })
          .addTo(leafletMap)
          .bindPopup(`<b>${track.position.name}</b><br>Speed: ${track.position.speed} kn<br>${track.position.status}`)
          .openPopup();
        // Solid line from vessel to destination
        if (dc) L.polyline([pos, dc], { color: '#c8963e', weight: 2.5, opacity: .9 }).addTo(leafletMap);
        // Zoom to show vessel + destination
        if (dc) leafletMap.fitBounds([pos, dc], { padding: [60, 60] });
        else leafletMap.setView(pos, 4);
      }
    } else {
      document.getElementById('trackInfo').innerHTML = `
        <div style="color:var(--muted);font-size:.875rem;display:flex;align-items:center;gap:8px">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          ${track.message || 'No live tracking data. Add a vessel IMO number to enable tracking.'}
        </div>`;
    }
  } catch (err) {
    document.getElementById('trackInfo').innerHTML = `<div style="color:var(--danger)">${err.message}</div>`;
  }
}

function renderTrackInfo(pos, shipment) {
  const mockBadge = pos.isMock ? `<span style="background:rgba(251,146,60,.15);color:#fb923c;font-size:.6875rem;padding:2px 8px;border-radius:99px;font-weight:600;margin-left:8px">DEMO DATA</span>` : '';
  document.getElementById('trackInfo').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">
      <div class="stat-card" style="margin:0">
        <div class="label">Vessel</div>
        <div class="value" style="font-size:1rem">${esc(pos.name)}${mockBadge}</div>
      </div>
      <div class="stat-card" style="margin:0">
        <div class="label">Speed</div>
        <div class="value" style="font-size:1rem">${pos.speed} kn</div>
      </div>
      <div class="stat-card" style="margin:0">
        <div class="label">Last Port</div>
        <div class="value" style="font-size:1rem">${esc(pos.lastPort || '—')}</div>
      </div>
      <div class="stat-card" style="margin:0">
        <div class="label">ETA</div>
        <div class="value" style="font-size:1rem">${fmtDate(pos.eta)}</div>
      </div>
      <div class="stat-card" style="margin:0;grid-column:1/-1">
        <div class="label">Destination</div>
        <div class="value" style="font-size:1rem">${esc(pos.destination || shipment?.destinationPort || '—')}</div>
        <div class="sub">Updated: ${fmtDate(pos.timestamp)}</div>
      </div>
    </div>`;
}

function renderTimeline(events) {
  const el = document.getElementById('trackTimeline');
  if (!events.length) {
    el.innerHTML = '<p style="color:var(--muted);font-size:.875rem">No events recorded yet.</p>';
    return;
  }
  const typeIcon = {
    created:        '✦',
    status_change:  '◉',
    payment_update: '€',
    position_update:'◎',
  };
  const typeClass = {
    created:        'accent',
    status_change:  'accent',
    payment_update: 'success',
    position_update:'',
  };
  el.innerHTML = events.map(e => `
    <div class="tl-item">
      <div class="tl-dot ${typeClass[e.type] || ''}">${typeIcon[e.type] || '·'}</div>
      <div class="tl-content">
        <div class="tl-desc">${esc(e.description)}</div>
        <div class="tl-meta">${fmtDate(e.timestamp)}${e.location ? ` · ${esc(e.location)}` : ''}</div>
      </div>
    </div>`).join('');
}

// ============================================================
//  FINANCE
// ============================================================
let revenueChartInstance = null;
let currentUserShare = 0;

async function loadFinance() {
  try {
    const [overview, txData] = await Promise.all([
      api('GET', '/finance/overview'),
      api('GET', '/finance/transactions'),
    ]);
    renderFinanceStats(overview, getRole());
    renderRevenueChart(overview.monthly);
    if (getRole() === 'admin') {
      renderStakeholderBreakdown(overview.stakeholders);
      renderTransactionsAdmin(txData.transactions);
    } else {
      renderTransactionsInvestor(txData.transactions, currentUserShare);
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}

function renderFinanceStats(overview, role) {
  const el = document.getElementById('financeStats');
  if (!el) return;
  const { totalRevenue, totalExpenses, netProfit } = overview.summary;
  if (role === 'admin') {
    el.innerHTML = `
      <div class="stat-card positive"><div class="label">Total Revenue</div><div class="value">${fmtCurrency(totalRevenue)}</div></div>
      <div class="stat-card negative"><div class="label">Total Expenses</div><div class="value">${fmtCurrency(totalExpenses)}</div></div>
      <div class="stat-card ${netProfit >= 0 ? 'positive' : 'negative'}"><div class="label">Net Profit</div><div class="value">${fmtCurrency(netProfit)}</div></div>
      <div class="stat-card"><div class="label">Transactions</div><div class="value">${overview.monthly.reduce((s,m)=>s+(m.revenue>0||m.expenses>0?1:0),0)}</div></div>`;
  } else {
    const me = overview.stakeholders.find(s => s.share === currentUserShare) || overview.stakeholders[0];
    const myRev = me ? me.revenue : totalRevenue * (currentUserShare / 100);
    const myExp = me ? me.expenses : totalExpenses * (currentUserShare / 100);
    const myNet = me ? me.profit : netProfit * (currentUserShare / 100);
    el.innerHTML = `
      <div class="stat-card"><div class="label">Your Share</div><div class="value accent">${currentUserShare}%</div></div>
      <div class="stat-card positive"><div class="label">Your Revenue</div><div class="value">${fmtCurrency(myRev)}</div></div>
      <div class="stat-card negative"><div class="label">Your Expenses</div><div class="value">${fmtCurrency(myExp)}</div></div>
      <div class="stat-card ${myNet >= 0 ? 'positive' : 'negative'}"><div class="label">Your Net Profit</div><div class="value">${fmtCurrency(myNet)}</div></div>`;
  }
}

function renderRevenueChart(monthly) {
  const canvas = document.getElementById('revenueChart');
  if (!canvas) return;
  if (revenueChartInstance) { revenueChartInstance.destroy(); revenueChartInstance = null; }
  const labels   = monthly.map(m => m.month.slice(5)); // MM
  const revenues = monthly.map(m => getRole() === 'investor' ? m.revenue * (currentUserShare / 100) : m.revenue);
  const expenses = monthly.map(m => getRole() === 'investor' ? m.expenses * (currentUserShare / 100) : m.expenses);
  revenueChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Revenue',  data: revenues, backgroundColor: 'rgba(74,222,128,.6)',  borderRadius: 4 },
        { label: 'Expenses', data: expenses, backgroundColor: 'rgba(248,113,113,.6)', borderRadius: 4 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#888', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#666' }, grid: { color: 'rgba(255,255,255,.04)' } },
        y: { ticks: { color: '#666', callback: v => fmtCurrency(v) }, grid: { color: 'rgba(255,255,255,.06)' } },
      },
    },
  });
}

function renderStakeholderBreakdown(stakeholders) {
  const el = document.getElementById('stakeholderBreakdown');
  if (!el) return;
  if (!stakeholders.length) {
    el.innerHTML = '<p style="color:var(--muted);font-size:.875rem">No stakeholders configured yet.</p>';
    return;
  }
  el.innerHTML = `
    <table>
      <thead><tr><th>Stakeholder</th><th>Share</th><th style="text-align:right">Revenue</th><th style="text-align:right">Net Profit</th></tr></thead>
      <tbody>
        ${stakeholders.map(s => `
          <tr>
            <td><div style="font-weight:600">${esc(s.name)}</div><div style="font-size:.75rem;color:var(--muted)">${esc(s.role)}</div></td>
            <td>${s.share}%</td>
            <td style="text-align:right" class="amount-pos">${fmtCurrency(s.revenue)}</td>
            <td style="text-align:right" class="${s.profit >= 0 ? 'amount-pos' : 'amount-neg'}">${fmtCurrency(s.profit)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function renderTransactionsAdmin(txs) {
  const tbody = document.getElementById('txTableBody');
  if (!tbody) return;
  if (!txs.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:40px">No transactions yet. Add your first one above.</td></tr>';
    return;
  }
  tbody.innerHTML = txs.map(t => `
    <tr>
      <td style="white-space:nowrap">${fmtDateShort(t.date)}</td>
      <td>${esc(t.description)}</td>
      <td><span style="color:var(--muted);font-size:.8125rem">${esc(t.category || 'Other')}</span></td>
      <td><span class="badge badge-${t.type}">${t.type}</span></td>
      <td style="text-align:right;font-weight:600;font-variant-numeric:tabular-nums" class="${t.type === 'revenue' ? 'amount-pos' : 'amount-neg'}">
        ${t.type === 'expense' ? '-' : '+'}${fmtCurrency(t.amount, t.currency)}
      </td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn-icon" title="Edit" onclick="editTransaction(${t.id})">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon" title="Delete" onclick="deleteTransaction(${t.id})" style="color:var(--danger)">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join('');
}

function renderTransactionsInvestor(txs, share) {
  const tbody = document.getElementById('txTableBody');
  if (!tbody) return;
  if (!txs.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:40px">No transactions recorded yet.</td></tr>';
    return;
  }
  tbody.innerHTML = txs.map(t => {
    const myAmt = t.amount * (share / 100);
    return `
      <tr>
        <td style="white-space:nowrap">${fmtDateShort(t.date)}</td>
        <td>${esc(t.description)}</td>
        <td><span style="color:var(--muted);font-size:.8125rem">${esc(t.category || 'Other')}</span></td>
        <td><span class="badge badge-${t.type}">${t.type}</span></td>
        <td style="text-align:right;font-weight:600;font-variant-numeric:tabular-nums" class="${t.type === 'revenue' ? 'amount-pos' : 'amount-neg'}">
          ${t.type === 'expense' ? '-' : '+'}${fmtCurrency(myAmt, t.currency)}
          <div style="font-size:.6875rem;color:var(--muted);font-weight:400">${share}% of ${fmtCurrency(t.amount)}</div>
        </td>
      </tr>`;
  }).join('');
}

// ---- Transaction modal ----
let allTransactions = [];

function openTxModal(tx = null) {
  document.getElementById('txModalTitle').textContent = tx ? 'Edit Transaction' : 'Add Transaction';
  document.getElementById('tx-id').value      = tx?.id || '';
  document.getElementById('tx-type').value    = tx?.type || 'revenue';
  document.getElementById('tx-category').value = tx?.category || 'Other';
  document.getElementById('tx-desc').value    = tx?.description || '';
  document.getElementById('tx-amount').value  = tx?.amount || '';
  document.getElementById('tx-date').value    = tx?.date || new Date().toISOString().split('T')[0];
  openModal('txModal');
}

async function editTransaction(id) {
  try {
    const data = await api('GET', '/finance/transactions');
    const tx   = data.transactions.find(t => t.id === id);
    if (tx) openTxModal(tx);
  } catch (err) { toast(err.message, 'error'); }
}

async function saveTransaction() {
  const id = document.getElementById('tx-id').value;
  const payload = {
    type:        document.getElementById('tx-type').value,
    category:    document.getElementById('tx-category').value,
    description: document.getElementById('tx-desc').value.trim(),
    amount:      document.getElementById('tx-amount').value,
    date:        document.getElementById('tx-date').value,
  };
  try {
    if (id) {
      await api('PUT', `/finance/transactions/${id}`, payload);
      toast('Transaction updated', 'success');
    } else {
      await api('POST', '/finance/transactions', payload);
      toast('Transaction added', 'success');
    }
    closeModal('txModal');
    loadFinance();
  } catch (err) { toast(err.message, 'error'); }
}

async function deleteTransaction(id) {
  if (!confirm('Delete this transaction?')) return;
  try {
    await api('DELETE', `/finance/transactions/${id}`);
    toast('Deleted', 'info');
    loadFinance();
  } catch (err) { toast(err.message, 'error'); }
}

// ============================================================
//  USERS (admin only)
// ============================================================
let allUsers = [];

async function loadUsers() {
  try {
    const data = await api('GET', '/admin/users');
    allUsers   = data.users || [];
    renderUsersTable(allUsers);
    renderShareAllocation(allUsers);
  } catch (err) {
    toast(err.message, 'error');
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:40px">No users yet.</td></tr>';
    return;
  }
  tbody.innerHTML = users.map(u => `
    <tr>
      <td><div style="font-weight:600">${esc(u.name)}</div></td>
      <td style="color:var(--muted)">${esc(u.email)}</td>
      <td><span class="badge" style="background:rgba(200,150,62,.1);color:var(--accent)">${u.role}</span></td>
      <td><strong>${u.share || 0}%</strong></td>
      <td style="color:var(--muted)">${fmtDate(u.createdAt)}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn-icon" title="Edit" onclick="editUser(${u.id})">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon" title="Delete" onclick="deleteUser(${u.id},'${esc(u.name)}')" style="color:var(--danger)">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join('');
}

function renderShareAllocation(users) {
  const el    = document.getElementById('shareAllocation');
  const total = document.getElementById('shareTotal');
  if (!el) return;
  const sum = users.reduce((s, u) => s + (u.share || 0), 0);
  const colors = ['#c8963e', '#60a5fa', '#4ade80', '#fb923c', '#a78bfa', '#f87171'];
  el.innerHTML = users.filter(u => u.share > 0).map((u, i) => `
    <div style="display:flex;align-items:center;gap:8px;background:var(--surface2);padding:8px 14px;border-radius:6px;border:1px solid var(--border)">
      <div style="width:10px;height:10px;border-radius:50%;background:${colors[i % colors.length]}"></div>
      <span style="font-weight:600">${esc(u.name)}</span>
      <span style="color:var(--muted)">${u.share}%</span>
    </div>`).join('') || '<span style="color:var(--muted)">No shares assigned yet.</span>';
  if (total) {
    const remaining = 100 - sum;
    total.textContent = `Total allocated: ${sum}%. ${remaining > 0 ? `${remaining}% unallocated.` : remaining < 0 ? `⚠ Over-allocated by ${Math.abs(remaining)}%.` : '✓ Fully allocated.'}`;
    total.style.color = remaining < 0 ? 'var(--danger)' : remaining === 0 ? 'var(--success)' : 'var(--muted)';
  }
}

let editingUserId = null;

function openUserModal(user = null) {
  editingUserId = user ? user.id : null;
  document.getElementById('userModalTitle').textContent = user ? 'Edit User' : 'Add User';
  document.getElementById('um-id').value       = user?.id || '';
  document.getElementById('um-name').value     = user?.name || '';
  document.getElementById('um-email').value    = user?.email || '';
  document.getElementById('um-password').value = '';
  document.getElementById('um-role').value     = user?.role || 'investor';
  document.getElementById('um-share').value    = user?.share || '';
  document.getElementById('um-pw-hint').textContent = user
    ? 'Leave blank to keep existing password.'
    : 'Required for new users.';
  openModal('userModal');
}

function editUser(id) {
  const u = allUsers.find(x => x.id === id);
  if (u) openUserModal(u);
}

async function saveUser() {
  const payload = {
    name:     document.getElementById('um-name').value.trim(),
    email:    document.getElementById('um-email').value.trim(),
    password: document.getElementById('um-password').value,
    role:     document.getElementById('um-role').value,
    share:    document.getElementById('um-share').value,
  };
  if (!editingUserId && !payload.password) {
    toast('Password is required for new users.', 'error');
    return;
  }
  if (editingUserId && !payload.password) delete payload.password;
  try {
    if (editingUserId) {
      await api('PUT', `/admin/users/${editingUserId}`, payload);
      toast('User updated', 'success');
    } else {
      await api('POST', '/admin/users', payload);
      toast('User created — they can now log in', 'success');
    }
    closeModal('userModal');
    loadUsers();
  } catch (err) { toast(err.message, 'error'); }
}

async function deleteUser(id, name) {
  if (!confirm(`Delete user "${name}"?`)) return;
  try {
    await api('DELETE', `/admin/users/${id}`);
    toast('User deleted', 'info');
    loadUsers();
  } catch (err) { toast(err.message, 'error'); }
}

// ============================================================
//  TAB NAVIGATION
// ============================================================
const TAB_TITLES = {
  shipments: 'Shipments',
  finance:   'Finance',
  users:     'Investors & Users',
};
const TOP_BAR_ACTIONS = {
  shipments: () => {
    const b = document.getElementById('topBarAction');
    if (b) { b.textContent = '+ New Shipment'; b.style.display = ''; b.onclick = () => openShipmentModal(); }
  },
  finance: () => {
    const b = document.getElementById('topBarAction');
    if (b) b.style.display = 'none';
  },
  users: () => {
    const b = document.getElementById('topBarAction');
    if (b) { b.textContent = '+ Add User'; b.style.display = ''; b.onclick = () => openUserModal(); }
  },
};

function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById(`tab-${name}`);
  if (panel) panel.classList.add('active');
  document.querySelectorAll(`.nav-item[data-tab="${name}"]`).forEach(b => b.classList.add('active'));
  const title = document.getElementById('topBarTitle');
  if (title) title.textContent = TAB_TITLES[name] || name;
  if (TOP_BAR_ACTIONS[name]) TOP_BAR_ACTIONS[name]();
  // Lazy load
  if (name === 'finance') loadFinance();
  if (name === 'users')   loadUsers();
}

// ---- Security escape ----
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
//  INIT
// ============================================================
async function initDashboard(role) {
  // Auth guard
  const token = getToken();
  const storedRole = getRole();
  if (!token) { window.location.href = '/dashboard/login.html'; return; }
  if (storedRole !== role) {
    window.location.href = storedRole === 'admin' ? '/dashboard/admin.html' : '/dashboard/investor.html';
    return;
  }

  // Populate sidebar
  try {
    const me = await api('GET', '/auth/me');
    const user = me.user;
    currentUserShare = user.share || 0;
    localStorage.setItem('fn_name', user.name);
    const nameEl   = document.getElementById('sidebarName');
    const emailEl  = document.getElementById('sidebarEmail');
    const avatarEl = document.getElementById('sidebarAvatar');
    if (nameEl)   nameEl.textContent   = user.name;
    if (emailEl)  emailEl.textContent  = user.email;
    if (avatarEl) avatarEl.textContent = user.name[0].toUpperCase();
  } catch {
    logout();
    return;
  }

  // Wire up nav items
  document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Load initial tab
  loadShipments();
}
