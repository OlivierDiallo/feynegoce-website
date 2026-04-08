'use strict';
const https = require('https');

// Marine Traffic API key (PS01 — Vessel Latest Position)
// Set MARINE_TRAFFIC_API_KEY env var to enable live tracking
const MT_API_KEY = process.env.MARINE_TRAFFIC_API_KEY;

// Approximate coordinates for major ports (for map rendering)
const PORT_COORDS = {
  'SHANGHAI':       [31.23, 121.47],
  'NINGBO':         [29.87, 121.55],
  'GUANGZHOU':      [23.10, 113.26],
  'SHENZHEN':       [22.52, 114.06],
  'QINGDAO':        [36.07, 120.37],
  'TIANJIN':        [38.98, 117.72],
  'SINGAPORE':      [1.29, 103.85],
  'COLOMBO':        [6.93, 79.85],
  'MUMBAI':         [18.93, 72.84],
  'DUBAI':          [25.12, 55.38],
  'JEDDAH':         [21.53, 39.17],
  'SUEZ':           [29.97, 32.55],
  'PORT SAID':      [31.26, 32.31],
  'DAKAR':          [14.69, -17.44],
  'ABIDJAN':        [5.35, -4.01],
  'TEMA':           [5.62, -0.02],
  'LAGOS':          [6.45, 3.39],
  'DOUALA':         [4.04, 9.70],
  'MOMBASA':        [-4.06, 39.67],
  'DAR ES SALAAM':  [-6.81, 39.29],
  'CAPE TOWN':      [-33.92, 18.42],
  'DURBAN':         [-29.87, 31.03],
  'CASABLANCA':     [33.59, -7.62],
  'ROTTERDAM':      [51.90, 4.47],
  'HAMBURG':        [53.55, 9.99],
  'ANTWERP':        [51.23, 4.40],
  'MARSEILLE':      [43.30, 5.37],
  'BARCELONA':      [41.38, 2.18],
  'GENOA':          [44.41, 8.93],
  'LE HAVRE':       [49.49, 0.11],
};

function getPortCoords(portName) {
  if (!portName) return null;
  const upper = portName.toUpperCase();
  for (const [key, coords] of Object.entries(PORT_COORDS)) {
    if (upper.includes(key)) return coords;
  }
  return null;
}

function fetchLivePosition(imo) {
  return new Promise((resolve, reject) => {
    // Marine Traffic PS01 – Single Vessel Latest Position
    const url = `https://services.marinetraffic.com/api/exportvessel/v:8/${MT_API_KEY}/?v=8&imo=${imo}&protocol=json`;
    https.get(url, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          const v = Array.isArray(parsed) ? parsed[0] : parsed;
          if (!v || v.errors) {
            return reject(new Error(v?.errors?.[0]?.detail || 'MarineTraffic API error'));
          }
          resolve({
            imo,
            name:        v.SHIPNAME   || `Vessel ${imo}`,
            lat:         parseFloat(v.LAT)    || null,
            lon:         parseFloat(v.LON)    || null,
            speed:       parseFloat(v.SPEED)  || 0,
            course:      parseFloat(v.COURSE) || 0,
            status:      v.STATUS      || 'Unknown',
            lastPort:    v.LAST_PORT   || null,
            destination: v.DESTINATION || null,
            eta:         v.ETA         || null,
            timestamp:   v.TIMESTAMP   || new Date().toISOString(),
            isMock:      false
          });
        } catch (e) {
          reject(new Error('Failed to parse tracking response'));
        }
      });
    }).on('error', reject);
  });
}

function getMockPosition(imo) {
  // Simulate a vessel en route from Shanghai → Singapore → Cape Town → Dakar
  // cycles over 30 days so position visibly changes each day
  const cycleMs   = 30 * 24 * 3600 * 1000;
  const progress  = (Date.now() % cycleMs) / cycleMs;
  const waypoints = [
    { lat: 31.23, lon: 121.47, name: 'SHANGHAI' },
    { lat:  1.29, lon: 103.85, name: 'SINGAPORE' },
    { lat: -33.92, lon: 18.42, name: 'CAPE TOWN' },
    { lat: 14.69, lon: -17.44, name: 'DAKAR' },
  ];
  const seg     = Math.min(Math.floor(progress * 3), 2);
  const segPct  = (progress * 3) - seg;
  const from    = waypoints[seg];
  const to      = waypoints[seg + 1];
  const lat     = from.lat + (to.lat - from.lat) * segPct;
  const lon     = from.lon + (to.lon - from.lon) * segPct;
  const daysLeft = Math.round((1 - progress) * 30);

  return {
    imo,
    name:        'DEMO VESSEL — NO API KEY',
    lat:         parseFloat(lat.toFixed(4)),
    lon:         parseFloat(lon.toFixed(4)),
    speed:       14.2,
    course:      Math.round(Math.atan2(to.lon - from.lon, to.lat - from.lat) * 180 / Math.PI + 360) % 360,
    status:      'Under Way Using Engine',
    lastPort:    from.name,
    destination: 'DAKAR',
    eta:         new Date(Date.now() + daysLeft * 86400000).toISOString().split('T')[0],
    timestamp:   new Date().toISOString(),
    isMock:      true
  };
}

async function getVesselPosition(imo) {
  if (!imo) throw new Error('No IMO number provided');
  if (MT_API_KEY) return fetchLivePosition(imo);
  return getMockPosition(imo);
}

module.exports = { getVesselPosition, getPortCoords };
