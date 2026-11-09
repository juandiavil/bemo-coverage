// Minimal RFC4180-style CSV parser with delimiter detection and lat/lng extraction.
function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '');
  const first = text.split(/\r?\n/, 1)[0];
  const delim = [',', ';', '\t'].reduce((a, b) =>
    first.split(b).length > first.split(a).length ? b : a);
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else q = false;
      } else field += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(v => v.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some(v => v.trim() !== '')) rows.push(row);
  return rows;
}

const LAT_NAMES = ['lat', 'latitude', 'latitud', 'y'];
const LNG_NAMES = ['lng', 'lon', 'long', 'longitude', 'longitud', 'x'];

function findColumn(headers, names) {
  const h = headers.map(s => s.trim().toLowerCase());
  for (const n of names) { const i = h.indexOf(n); if (i >= 0) return i; }
  return -1;
}

// Returns {points: [{lat,lng,props}], skipped}; throws if no lat/lng columns.
function extractPoints(text) {
  const rows = parseCSV(text);
  if (!rows.length) throw new Error('The file is empty');
  const headers = rows[0].map(s => s.trim());
  const li = findColumn(headers, LAT_NAMES), gi = findColumn(headers, LNG_NAMES);
  if (li < 0 || gi < 0) throw new Error('Could not find latitude/longitude columns');
  const points = [];
  let skipped = 0;
  for (const r of rows.slice(1)) {
    const lat = parseFloat((r[li] || '').replace(',', '.'));
    const lng = parseFloat((r[gi] || '').replace(',', '.'));
    if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) { skipped++; continue; }
    const props = {};
    headers.forEach((h, i) => { if (i !== li && i !== gi && h) props[h] = r[i] || ''; });
    points.push({ lat, lng, props });
  }
  return { points, skipped };
}

if (typeof module !== 'undefined') module.exports = { parseCSV, extractPoints };
