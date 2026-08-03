import * as satellite from "https://cdn.jsdelivr.net/npm/satellite.js@7.0.1/+esm";

const map = L.map("map", {
  center: [18, 0],
  zoom: 2,
  minZoom: 2,
  worldCopyJump: true,
  zoomControl: false,
});

L.control.zoom({ position: "topright" }).addTo(map);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 8,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const elements = {
  statusText: document.querySelector("#status-text"),
  statusDot: document.querySelector("#status-dot"),
  detailName: document.querySelector("#detail-name"),
  emptyDetail: document.querySelector("#empty-detail"),
  satelliteDetail: document.querySelector("#satellite-detail"),
  separationDetail: document.querySelector("#separation-detail"),
  separationLabel: document.querySelector("#separation-label"),
  separationDistance: document.querySelector("#separation-distance"),
  altitude: document.querySelector("#detail-altitude"),
  speed: document.querySelector("#detail-speed"),
  latitude: document.querySelector("#detail-latitude"),
  longitude: document.querySelector("#detail-longitude"),
  dataAge: document.querySelector("#data-age"),
  refreshButton: document.querySelector("#refresh-button"),
  clearSelection: document.querySelector("#clear-selection"),
};

let trackedSatellites = [];
let selectedIds = [];
let updateTimer;
let groundTrackTimer;
let separationLine;
const trackColors = ["#66e0ff", "#ff7a90", "#a98bff", "#73e6a2", "#ffad5c", "#f3e56b"];

function setStatus(message, isError = false) {
  elements.statusText.textContent = message;
  elements.statusDot.classList.toggle("error", isError);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function markerIcon(item, selected = false) {
  const altitude = item.position ? `${Math.round(item.position.altitude)} km` : "—";
  const markerColor = selected ? "#ffd166" : item.color;
  return L.divIcon({
    className: `satellite-marker${selected ? " selected" : ""}`,
    html: `<div class="satellite-marker-inner" style="--sat-color:${markerColor}"><span class="satellite-dot"></span><span class="satellite-label">${escapeHtml(item.label)} · ${altitude}</span></div>`,
    iconSize: [180, 24],
    iconAnchor: [0, 0],
  });
}

function splitAtDateLine(points) {
  const segments = [];
  let segment = [];

  for (const point of points) {
    const previous = segment[segment.length - 1];
    if (previous && Math.abs(point[1] - previous[1]) > 180) {
      if (segment.length > 1) segments.push(segment);
      segment = [];
    }
    segment.push(point);
  }

  if (segment.length > 1) segments.push(segment);
  return segments;
}

function updateGroundTracks() {
  const start = new Date();

  for (const item of trackedSatellites) {
    for (const layer of item.trackLayers ?? []) layer.remove();
    item.trackLayers = [];

    const meanMotion = Number(item.omm.MEAN_MOTION);
    if (!Number.isFinite(meanMotion) || meanMotion <= 0) continue;

    const orbitMinutes = 1440 / meanMotion;
    const pointCount = 180;
    const points = [];

    for (let index = 0; index <= pointCount; index += 1) {
      const date = new Date(start.getTime() + (orbitMinutes * 60_000 * index) / pointCount);
      const position = calculatePosition(item, date);
      if (position) points.push([position.latitude, position.longitude]);
    }

    item.trackLayers = splitAtDateLine(points).map((segment) =>
      L.polyline(segment, {
        color: item.color,
        weight: 2,
        opacity: 0.72,
        dashArray: "5 6",
        interactive: false,
      }).addTo(map)
    );

    for (const layer of item.trackLayers) layer.bringToBack();
  }
}

function calculatePosition(item, date) {
  const result = satellite.propagate(item.satrec, date);
  if (!result?.position || !result?.velocity) return null;

  const gmst = satellite.gstime(date);
  const geodetic = satellite.eciToGeodetic(result.position, gmst);
  const velocity = result.velocity;
  return {
    latitude: satellite.degreesLat(geodetic.latitude),
    longitude: satellite.degreesLong(geodetic.longitude),
    altitude: geodetic.height,
    speed: Math.hypot(velocity.x, velocity.y, velocity.z),
    eci: result.position,
  };
}

function updatePositions() {
  const now = new Date();
  for (const item of trackedSatellites) {
    item.position = calculatePosition(item, now);
    if (!item.position) continue;

    const latLng = [item.position.latitude, item.position.longitude];
    if (!item.marker) {
      item.marker = L.marker(latLng, {
        icon: markerIcon(item),
        title: item.label,
        riseOnHover: true,
      }).addTo(map);
      item.marker.on("click", () => toggleSelection(item.id));
    } else {
      item.marker.setLatLng(latLng);
      item.marker.setIcon(markerIcon(item, selectedIds.includes(item.id)));
    }
  }
  updateDetailPanel();
}

function toggleSelection(id) {
  if (selectedIds.includes(id)) {
    selectedIds = selectedIds.filter((selectedId) => selectedId !== id);
  } else if (selectedIds.length === 2) {
    selectedIds = [selectedIds[1], id];
  } else {
    selectedIds.push(id);
  }
  updatePositions();
}

function selectedSatellites() {
  return selectedIds
    .map((id) => trackedSatellites.find((item) => item.id === id))
    .filter(Boolean);
}

function formatCoordinate(value, positive, negative) {
  return `${Math.abs(value).toFixed(2)}° ${value >= 0 ? positive : negative}`;
}

function ageDescription(epoch) {
  const ageHours = Math.max(0, (Date.now() - new Date(epoch).getTime()) / 3_600_000);
  if (ageHours < 1) return `${Math.round(ageHours * 60)} minutes old`;
  if (ageHours < 48) return `${ageHours.toFixed(1)} hours old`;
  return `${(ageHours / 24).toFixed(1)} days old`;
}

function updateDetailPanel() {
  const selected = selectedSatellites();
  elements.emptyDetail.hidden = selected.length > 0;
  elements.satelliteDetail.hidden = selected.length === 0;
  elements.separationDetail.hidden = selected.length !== 2;

  if (separationLine) {
    separationLine.remove();
    separationLine = null;
  }

  if (selected.length === 0) {
    elements.detailName.textContent = "Tap a satellite";
    elements.dataAge.textContent = "";
    return;
  }

  const primary = selected[selected.length - 1];
  const position = primary.position;
  elements.detailName.textContent = primary.label;
  elements.altitude.textContent = position ? `${position.altitude.toFixed(1)} km` : "Unavailable";
  elements.speed.textContent = position ? `${position.speed.toFixed(2)} km/s` : "Unavailable";
  elements.latitude.textContent = position ? formatCoordinate(position.latitude, "N", "S") : "—";
  elements.longitude.textContent = position ? formatCoordinate(position.longitude, "E", "W") : "—";
  elements.dataAge.textContent = `NORAD ${primary.id} · Elements ${ageDescription(primary.omm.EPOCH)}`;

  if (selected.length === 2 && selected.every((item) => item.position)) {
    const [first, second] = selected;
    const delta = {
      x: first.position.eci.x - second.position.eci.x,
      y: first.position.eci.y - second.position.eci.y,
      z: first.position.eci.z - second.position.eci.z,
    };
    const distance = Math.hypot(delta.x, delta.y, delta.z);
    elements.separationLabel.textContent = `${first.label} ↔ ${second.label}`;
    elements.separationDistance.textContent = `${distance.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
    separationLine = L.polyline([
      [first.position.latitude, first.position.longitude],
      [second.position.latitude, second.position.longitude],
    ], { color: "#ffd166", weight: 2, dashArray: "6 7", opacity: 0.8 }).addTo(map);
  }
}

async function loadSatellites() {
  clearInterval(updateTimer);
  clearInterval(groundTrackTimer);
  for (const item of trackedSatellites) {
    item.marker?.remove();
    for (const layer of item.trackLayers ?? []) layer.remove();
  }
  trackedSatellites = [];
  selectedIds = [];
  setStatus("Loading satellite data…");

  try {
    const response = await fetch(`data/satellite-data.json?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Data request returned ${response.status}`);
    const payload = await response.json();

    trackedSatellites = payload.satellites.map((entry, index) => ({
      ...entry,
      id: String(entry.noradId),
      color: trackColors[index % trackColors.length],
      satrec: satellite.json2satrec(entry.omm),
      marker: null,
      position: null,
      trackLayers: [],
    }));

    updatePositions();
    updateGroundTracks();
    updateTimer = setInterval(updatePositions, 1000);
    groundTrackTimer = setInterval(updateGroundTracks, 60_000);
    const missingCount = payload.missing?.length ?? 0;
    const suffix = missingCount ? ` · ${missingCount} unavailable` : "";
    setStatus(`${trackedSatellites.length} satellites · updated ${new Date(payload.generatedAt).toLocaleString()}${suffix}`);
  } catch (error) {
    console.error(error);
    setStatus("Satellite data is not ready. Run the updater or GitHub Action.", true);
  }
}

elements.refreshButton.addEventListener("click", loadSatellites);
elements.clearSelection.addEventListener("click", () => {
  selectedIds = [];
  updatePositions();
});

loadSatellites();
