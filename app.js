const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
const layer = L.featureGroup().addTo(map);
const status = document.getElementById('status');

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function loadFiles(files) {
  let total = 0, skipped = 0;
  const errors = [];
  for (const f of files) {
    try {
      const res = extractPoints(await f.text());
      skipped += res.skipped;
      for (const p of res.points) {
        const rows = Object.entries(p.props)
          .map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join('');
        L.circleMarker([p.lat, p.lng], { radius: 6, color: '#0b3d5c', fillColor: '#1fa37a', fillOpacity: 0.8 })
          .bindPopup(`<table class="popup">${rows}<tr><td><b>lat, lng</b></td><td>${p.lat}, ${p.lng}</td></tr></table>`)
          .addTo(layer);
        total++;
      }
    } catch (e) { errors.push(`${f.name}: ${e.message}`); }
  }
  if (layer.getLayers().length) map.fitBounds(layer.getBounds().pad(0.1), { maxZoom: 15 });
  status.textContent = `${total} stations plotted` + (skipped ? `, ${skipped} rows skipped (invalid coordinates)` : '') +
    (errors.length ? '. Errors: ' + errors.join('; ') : '');
}

document.getElementById('file').addEventListener('change', e => {
  loadFiles([...e.target.files]);
  e.target.value = '';
});
document.getElementById('clear').addEventListener('click', () => {
  layer.clearLayers();
  status.textContent = 'Cleared.';
});
['dragover', 'drop'].forEach(ev => document.body.addEventListener(ev, e => {
  e.preventDefault();
  if (ev === 'drop') loadFiles([...e.dataTransfer.files]);
}));
