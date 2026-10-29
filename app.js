const STATUS_CLASS = {
  "Unresolved": "unresolved",
  "Government released": "government",
  "Mixed evidence": "mixed",
  "Explained": "explained",
  "Pending review": "pending"
};
const STATUS_COLOR = {
  "Unresolved": "#f87171",
  "Government released": "#fbbf24",
  "Mixed evidence": "#c084fc",
  "Explained": "#34d399",
  "Pending review": "#f472b6"
};

let entries = [];
let markers = new Map();
let selectedId = null;

const map = L.map("map", { worldCopyJump: true }).setView([39, -40], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 18
}).addTo(map);

function badgeClass(status) {
  return status.split(" ")[0]; // Unresolved / Government / Mixed / Explained / Pending
}

function addMarker(entry) {
  const marker = L.circleMarker([entry.lat, entry.lng], {
    radius: 8, color: "#0b1220", weight: 1.5,
    fillColor: STATUS_COLOR[entry.status] || "#7dd3fc", fillOpacity: 0.95
  }).addTo(map);
  marker.bindPopup(`<strong>${escapeHtml(entry.title)}</strong><br>${escapeHtml(entry.location)}<br><em>${escapeHtml(entry.status)}</em>`);
  marker.on("click", () => selectEntry(entry.id, false));
  markers.set(entry.id, marker);
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderStats() {
  const total = entries.length;
  const unresolved = entries.filter(e => e.status === "Unresolved").length;
  const explained = entries.filter(e => e.status === "Explained").length;
  const gov = entries.filter(e => e.status === "Government released").length;
  const pending = entries.filter(e => e.status === "Pending review").length;
  document.getElementById("stats").innerHTML = `
    <div class="stat"><b>${total}</b><span>entries in the register</span></div>
    <div class="stat"><b>${unresolved}</b><span>unresolved</span></div>
    <div class="stat"><b>${gov}</b><span>government released</span></div>
    <div class="stat"><b>${explained}</b><span>explained by correlation</span></div>
    ${pending ? `<div class="stat"><b>${pending}</b><span>your pending reports</span></div>` : ""}`;
}

function renderRegister() {
  const q = document.getElementById("q").value.trim().toLowerCase();
  const sf = document.getElementById("statusFilter").value;
  const so = document.getElementById("sourceFilter").value;
  const list = entries
    .filter(e => !sf || e.status === sf)
    .filter(e => !so || e.source_type === so)
    .filter(e => !q || [e.title, e.location, e.shape, e.source_name, e.summary].join(" ").toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date));
  const wrap = document.getElementById("register");
  wrap.innerHTML = list.map(e => `
    <button class="card ${e.id === selectedId ? "selected" : ""}" data-id="${e.id}">
      <span class="badge ${badgeClass(e.status)}">${escapeHtml(e.status)}</span>
      <h4>${escapeHtml(e.title)}</h4>
      <p>${escapeHtml(e.summary.slice(0, 140))}${e.summary.length > 140 ? "…" : ""}</p>
      <p class="meta">${escapeHtml(e.date)} · ${escapeHtml(e.location)} · ${escapeHtml(e.shape)}</p>
    </button>`).join("");
  document.getElementById("noResults").hidden = list.length > 0;
  wrap.querySelectorAll(".card").forEach(c => c.addEventListener("click", () => selectEntry(c.dataset.id, true)));
}

function selectEntry(id, pan) {
  selectedId = id;
  const e = entries.find(x => x.id === id);
  if (!e) return;
  document.getElementById("detail").innerHTML = `
    <span class="badge ${badgeClass(e.status)}">${escapeHtml(e.status)}</span>
    <h3>${escapeHtml(e.title)}</h3>
    <p class="rowline"><strong>Date:</strong> ${escapeHtml(e.date)} · ${escapeHtml(e.duration || "")}</p>
    <p class="rowline"><strong>Location:</strong> ${escapeHtml(e.location)} (${e.lat}, ${e.lng})</p>
    <p class="rowline"><strong>Shape:</strong> ${escapeHtml(e.shape)}</p>
    <p>${escapeHtml(e.summary)}</p>
    <p class="rowline"><strong>Source:</strong> ${escapeHtml(e.source_name)} (${escapeHtml(e.source_type)})</p>
    <div class="corr"><strong>Correlation note:</strong> ${escapeHtml(e.correlation)}</div>`;
  const marker = markers.get(id);
  if (marker) {
    if (pan) map.flyTo([e.lat, e.lng], Math.max(map.getZoom(), 4));
    marker.openPopup();
  }
  renderRegister();
}

function loadLocalReports() {
  try {
    const raw = JSON.parse(localStorage.getItem("atlas-local-reports") || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}
function saveLocalReport(entry) {
  const all = loadLocalReports();
  all.push(entry);
  localStorage.setItem("atlas-local-reports", JSON.stringify(all));
}

document.getElementById("reportForm").addEventListener("submit", ev => {
  ev.preventDefault();
  const fd = new FormData(ev.target);
  const lat = parseFloat(fd.get("lat"));
  const lng = parseFloat(fd.get("lng"));
  const entry = {
    id: "local-" + Date.now(),
    title: "Reported sighting — " + (fd.get("location") || "Unknown location"),
    date: fd.get("date"),
    location: fd.get("location"),
    lat: Number.isFinite(lat) ? lat : 39.0,
    lng: Number.isFinite(lng) ? lng : -98.0,
    shape: fd.get("shape"),
    duration: "",
    summary: fd.get("summary"),
    source_name: "Public report (this browser)",
    source_type: "Multiple",
    status: "Pending review",
    correlation: "Not yet correlated. In the reviewed register, this entry would be checked against satellite tracks, aircraft activity and NOAA space weather before any label is applied."
  };
  entries.push(entry);
  addMarker(entry);
  saveLocalReport(entry);
  renderStats();
  selectEntry(entry.id, true);
  document.getElementById("formNote").textContent = "Added to your map as Pending review. Saved only in this browser.";
  ev.target.reset();
});

["q", "statusFilter", "sourceFilter"].forEach(id => {
  document.getElementById(id).addEventListener("input", renderRegister);
  document.getElementById(id).addEventListener("change", renderRegister);
});

fetch("data/sightings.json")
  .then(r => { if (!r.ok) throw new Error("sightings.json " + r.status); return r.json(); })
  .then(seed => {
    entries = [...seed, ...loadLocalReports()];
    entries.forEach(addMarker);
    renderStats();
    renderRegister();
    if (entries.length) {
      const bounds = L.latLngBounds(entries.map(e => [e.lat, e.lng]));
      map.fitBounds(bounds.pad(0.15));
    }
  })
  .catch(err => {
    document.getElementById("detail").innerHTML = `<p class="empty">The register data could not be loaded (${escapeHtml(err.message)}). If you opened this file directly, serve it over HTTP instead — for example: <code>python3 -m http.server</code></p>`;
  });
