import * as satellite from "https://cdn.jsdelivr.net/npm/satellite.js@7.0.1/+esm";
import tzLookup from "https://cdn.jsdelivr.net/npm/tz-lookup@6.1.25/+esm";
import { initializeLearningLab } from "./learning-lab.js?v=learning-beta-angle-2";
import { initializeGlobeView } from "./globe-view.js?v=map-3d-context-1";

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

const groundStation = {
  name: "Central Alaska",
  latitude: 64.2,
  longitude: -152.5,
  minimumElevation: 10,
};
const observerGeodetic = {
  latitude: satellite.degreesToRadians(groundStation.latitude),
  longitude: satellite.degreesToRadians(groundStation.longitude),
  height: 0,
};

for (const longitudeOffset of [-360, 0, 360]) {
  L.circleMarker([groundStation.latitude, groundStation.longitude + longitudeOffset], {
    className: "live-ground-station",
    radius: 6,
    color: "#ffffff",
    weight: 2,
    fillColor: "#73e6a2",
    fillOpacity: 1,
  }).addTo(map).bindTooltip("Central Alaska GS · 10° mask", {
    permanent: true,
    direction: "right",
    className: "station-tooltip",
    offset: [8, 0],
  });
}

const elements = {
  statusText: document.querySelector("#status-text"),
  statusDot: document.querySelector("#status-dot"),
  summaryToggle: document.querySelector("#summary-toggle"),
  satelliteSummary: document.querySelector("#satellite-summary"),
  summaryLaunchCount: document.querySelector("#summary-launch-count"),
  summaryAltitude: document.querySelector("#summary-altitude"),
  summaryInclination: document.querySelector("#summary-inclination"),
  summaryRaan: document.querySelector("#summary-raan"),
  launchBreakdown: document.querySelector("#launch-breakdown"),
  detailName: document.querySelector("#detail-name"),
  emptyDetail: document.querySelector("#empty-detail"),
  satelliteDetail: document.querySelector("#satellite-detail"),
  separationDetail: document.querySelector("#separation-detail"),
  separationLabel: document.querySelector("#separation-label"),
  separationDistance: document.querySelector("#separation-distance"),
  separationVisibility: document.querySelector("#separation-visibility"),
  altitude: document.querySelector("#detail-altitude"),
  speed: document.querySelector("#detail-speed"),
  latitude: document.querySelector("#detail-latitude"),
  longitude: document.querySelector("#detail-longitude"),
  inclination: document.querySelector("#detail-inclination"),
  raan: document.querySelector("#detail-raan"),
  launchDate: document.querySelector("#detail-launch-date"),
  dataAge: document.querySelector("#data-age"),
  refreshButton: document.querySelector("#refresh-button"),
  ephemerisEpoch: document.querySelector("#ephemeris-epoch"),
  clearSelection: document.querySelector("#clear-selection"),
  groundTrackToggle: document.querySelector("#ground-track-toggle"),
  footprintToggle: document.querySelector("#footprint-toggle"),
  footprintDiameter: document.querySelector("#footprint-diameter"),
  map: document.querySelector("#map"),
  globe: document.querySelector("#globe"),
  globeHint: document.querySelector("#globe-hint"),
  view2d: document.querySelector("#view-2d"),
  view3d: document.querySelector("#view-3d"),
  speedSelect: document.querySelector("#speed-select"),
  simulationTime: document.querySelector("#simulation-time"),
  accessList: document.querySelector("#access-list"),
  accessToggle: document.querySelector("#access-toggle"),
  scenarioButton: document.querySelector("#scenario-button"),
  learningButton: document.querySelector("#learning-button"),
  mapButton: document.querySelector('[data-tab="map"]'),
  scenarioPanel: document.querySelector("#scenario-panel"),
  scenarioClose: document.querySelector("#scenario-close"),
  analysisToolButtons: [...document.querySelectorAll("[data-analysis-tool]")],
  groundAccessAnalysis: document.querySelector("#ground-access-analysis"),
  connectivityAnalysis: document.querySelector("#connectivity-analysis"),
  accessAnalysisMapSelect: document.querySelector("#access-analysis-map-select"),
  accessAnalysisLatitude: document.querySelector("#access-analysis-latitude"),
  accessAnalysisLongitude: document.querySelector("#access-analysis-longitude"),
  accessAnalysisElevation: document.querySelector("#access-analysis-elevation"),
  accessAnalysisStationReset: document.querySelector("#access-analysis-station-reset"),
  accessAnalysisNorad: document.querySelector("#access-analysis-norad"),
  accessAnalysisStartDate: document.querySelector("#access-analysis-start-date"),
  accessAnalysisMinDuration: document.querySelector("#access-analysis-min-duration"),
  accessAnalysisMinPeakElevation: document.querySelector("#access-analysis-min-peak-elevation"),
  loadedNoradOptions: document.querySelector("#loaded-norad-options"),
  accessAnalysisRun: document.querySelector("#access-analysis-run"),
  accessAnalysisError: document.querySelector("#access-analysis-error"),
  accessAnalysisResults: document.querySelector("#access-analysis-results"),
  accessAnalysisAnswer: document.querySelector("#access-analysis-answer"),
  accessAnalysisPassCount: document.querySelector("#access-analysis-pass-count"),
  accessAnalysisTotal: document.querySelector("#access-analysis-total"),
  accessAnalysisAverage: document.querySelector("#access-analysis-average"),
  accessAnalysisLongestGap: document.querySelector("#access-analysis-longest-gap"),
  accessAnalysisPeriod: document.querySelector("#access-analysis-period"),
  accessAnalysisZuluSummary: document.querySelector("#access-analysis-zulu-summary"),
  accessAnalysisZuluWindowList: document.querySelector("#access-analysis-zulu-window-list"),
  accessAnalysisLocalSummary: document.querySelector("#access-analysis-local-summary"),
  accessAnalysisLocalWindowList: document.querySelector("#access-analysis-local-window-list"),
  scenarioRun: document.querySelector("#scenario-run"),
  scenarioAnalysisDays: document.querySelector("#scenario-analysis-days"),
  scenarioSatelliteCount: document.querySelector("#scenario-satellite-count"),
  scenarioLinkCount: document.querySelector("#scenario-link-count"),
  scenarioMinimumDistance: document.querySelector("#scenario-minimum-distance"),
  scenarioMaximumDistance: document.querySelector("#scenario-maximum-distance"),
  scenarioSamePlaneOnly: document.querySelector("#scenario-same-plane-only"),
  scenarioRaanTolerance: document.querySelector("#scenario-raan-tolerance"),
  scenarioRangeError: document.querySelector("#scenario-range-error"),
  scenarioProgress: document.querySelector("#scenario-progress"),
  scenarioProgressLabel: document.querySelector("#scenario-progress-label"),
  scenarioProgressValue: document.querySelector("#scenario-progress-value"),
  scenarioProgressBar: document.querySelector("#scenario-progress-bar"),
  scenarioResults: document.querySelector("#scenario-results"),
  scenarioAnswer: document.querySelector("#scenario-answer"),
  scenarioTotalTime: document.querySelector("#scenario-total-time"),
  scenarioPercent: document.querySelector("#scenario-percent"),
  scenarioWindowCount: document.querySelector("#scenario-window-count"),
  scenarioGroupCount: document.querySelector("#scenario-group-count"),
  scenarioPeriod: document.querySelector("#scenario-period"),
  scenarioRecommendations: document.querySelector("#scenario-recommendations"),
  scenarioDurationTiers: document.querySelector("#scenario-duration-tiers"),
  scenarioWindowSummary: document.querySelector("#scenario-window-summary"),
  scenarioWindowList: document.querySelector("#scenario-window-list"),
  scenarioMultiSummary: document.querySelector("#scenario-multi-summary"),
  scenarioMultiList: document.querySelector("#scenario-multi-list"),
  scenarioTripleSummary: document.querySelector("#scenario-triple-summary"),
  scenarioTripleList: document.querySelector("#scenario-triple-list"),
  scenarioGroupList: document.querySelector("#scenario-group-list"),
  recommendationMapBanner: document.querySelector("#recommendation-map-banner"),
  recommendationMapLabel: document.querySelector("#recommendation-map-label"),
  recommendationMapTime: document.querySelector("#recommendation-map-time"),
  recommendationMapClear: document.querySelector("#recommendation-map-clear"),
  learningPanel: document.querySelector("#learning-panel"),
  learningClose: document.querySelector("#learning-close"),
};

const learningElements = {
  lessonButtons: [...document.querySelectorAll("[data-learning-lesson]")],
  lessonLabel: document.querySelector("#learning-lesson-label"),
  title: document.querySelector("#learning-title"),
  cardIntro: document.querySelector("#learning-card-intro"),
  prediction: document.querySelector("#learning-prediction"),
  metricsTitle: document.querySelector("#learning-metrics-title"),
  altitude: document.querySelector("#learning-altitude"),
  altitudeNumber: document.querySelector("#learning-altitude-number"),
  altitudeValue: document.querySelector("#learning-altitude-value"),
  inclination: document.querySelector("#learning-inclination"),
  inclinationValue: document.querySelector("#learning-inclination-value"),
  raan: document.querySelector("#learning-raan"),
  raanValue: document.querySelector("#learning-raan-value"),
  days: document.querySelector("#learning-days"),
  daysControl: document.querySelector("#learning-days-control"),
  seasonControl: document.querySelector("#learning-season-control"),
  seasonDate: document.querySelector("#learning-season-date"),
  footprints: document.querySelector("#learning-footprints"),
  footprintsControl: document.querySelector("#learning-footprints-control"),
  periodNote: document.querySelector("#learning-period-note"),
  reset: document.querySelector("#learning-reset"),
  stationMove: document.querySelector("#learning-station-move"),
  stationLatitude: document.querySelector("#learning-station-latitude"),
  stationLongitude: document.querySelector("#learning-station-longitude"),
  stationElevation: document.querySelector("#learning-station-elevation"),
  stationReset: document.querySelector("#learning-station-reset"),
  stationControls: document.querySelector("#learning-station-controls"),
  groundTrack: document.querySelector("#learning-ground-track"),
  betaVisual: document.querySelector("#learning-beta-visual"),
  betaSeasonChart: document.querySelector("#learning-beta-season-chart"),
  sunlightBar: document.querySelector("#learning-sunlight-bar"),
  betaVisualNote: document.querySelector("#learning-beta-visual-note"),
  insight: document.querySelector("#learning-insight"),
  metrics: document.querySelector("#learning-metrics"),
  explanation: document.querySelector("#learning-explanation"),
};

let trackedSatellites = [];
let selectedIds = [];
let updateTimer;
let groundTrackTimer;
let separationLine;
let groundTracksVisible = localStorage.getItem("groundTracksVisible") !== "false";
let footprintsVisible = localStorage.getItem("footprintsVisible") === "true";
let footprintDiameterKm = Math.max(1, Math.min(20_000, Number(localStorage.getItem("footprintDiameterKm")) || 1000));
let simulationSpeed = 1;
let simulationTimeMs = Date.now();
let lastClockUpdateMs = Date.now();
let lastAccessPanelRenderMs = 0;
let visualizedRecommendationIds = [];
let visualizedRecommendationLinks = [];
let recommendationCrosslinkLayers = [];
let learningLabController;
let activeAnalysisTool = "access";
let accessAnalysisMapMode = false;
let lastAccessAnalysisResult = null;
let currentViewMode = localStorage.getItem("satelliteViewMode") === "3d" ? "3d" : "2d";
let globeController;
let accessAnalysisStation = {
  latitude: groundStation.latitude,
  longitude: groundStation.longitude,
  minimumElevation: groundStation.minimumElevation,
};
const accessAnalysisStationLayer = L.layerGroup();
const trackColors = ["#66e0ff", "#ff7a90", "#a98bff", "#73e6a2", "#ffad5c", "#f3e56b"];
const earthEquatorialRadiusKm = 6378.137;
const earthFlattening = 1 / 298.257223563;
const earthPolarRadiusKm = earthEquatorialRadiusKm * (1 - earthFlattening);
const scenarioStepMs = 2 * 60_000;

elements.groundTrackToggle.checked = groundTracksVisible;
elements.footprintToggle.checked = footprintsVisible;
elements.footprintDiameter.value = String(footprintDiameterKm);

function currentSimulationDate() {
  const nowMs = Date.now();
  simulationTimeMs += (nowMs - lastClockUpdateMs) * simulationSpeed;
  lastClockUpdateMs = nowMs;
  return new Date(simulationTimeMs);
}

function syncAccessAnalysisStationInputs() {
  elements.accessAnalysisLatitude.value = String(Number(accessAnalysisStation.latitude.toFixed(4)));
  elements.accessAnalysisLongitude.value = String(Number(accessAnalysisStation.longitude.toFixed(4)));
  elements.accessAnalysisElevation.value = String(accessAnalysisStation.minimumElevation);
}

function renderAccessAnalysisStation() {
  accessAnalysisStationLayer.clearLayers();
  for (const longitudeOffset of [-360, 0, 360]) {
    L.circleMarker([accessAnalysisStation.latitude, accessAnalysisStation.longitude + longitudeOffset], {
      className: "access-analysis-station-marker",
      radius: 7,
      color: "#ffffff",
      weight: 3,
      fillColor: "#ffcf66",
      fillOpacity: 1,
    }).addTo(accessAnalysisStationLayer).bindTooltip(
      `Analysis station · ${accessAnalysisStation.latitude.toFixed(2)}°, ${accessAnalysisStation.longitude.toFixed(2)}° · ≥${accessAnalysisStation.minimumElevation}°`,
      { permanent: true, direction: "right", className: "access-analysis-station-tooltip", offset: [9, 0] }
    );
  }
}

function invalidateAccessAnalysisResults() {
  lastAccessAnalysisResult = null;
  elements.accessAnalysisResults.hidden = true;
  elements.accessAnalysisError.hidden = true;
}

function setAccessAnalysisStation(latitude, longitude, minimumElevation = accessAnalysisStation.minimumElevation, syncInputs = false) {
  accessAnalysisStation = {
    latitude: Math.max(-90, Math.min(90, latitude)),
    longitude: ((longitude + 540) % 360) - 180,
    minimumElevation: Math.max(0, Math.min(90, minimumElevation)),
  };
  if (syncInputs) syncAccessAnalysisStationInputs();
  invalidateAccessAnalysisResults();
  renderAccessAnalysisStation();
}

function setAccessAnalysisMapMode(enabled) {
  accessAnalysisMapMode = enabled;
  elements.accessAnalysisMapSelect.classList.toggle("active", enabled);
  elements.accessAnalysisMapSelect.textContent = enabled ? "Tap a point on map" : "Select on map";
  map.getContainer().classList.toggle("access-analysis-map-mode", enabled);
}

function setAnalysisTool(tool) {
  activeAnalysisTool = tool;
  elements.groundAccessAnalysis.hidden = tool !== "access";
  elements.connectivityAnalysis.hidden = tool !== "connectivity";
  elements.analysisToolButtons.forEach((button) => {
    const selected = button.dataset.analysisTool === tool;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  if (document.body.dataset.appTab === "analysis" && tool === "access") {
    renderAccessAnalysisStation();
    if (!map.hasLayer(accessAnalysisStationLayer)) accessAnalysisStationLayer.addTo(map);
  } else {
    setAccessAnalysisMapMode(false);
    accessAnalysisStationLayer.remove();
  }
}

function showAppTab(tab) {
  elements.scenarioPanel.hidden = tab !== "analysis";
  elements.learningPanel.hidden = tab !== "learning";
  document.body.dataset.appTab = tab;
  applyViewMode();
  learningLabController?.setActive(tab === "learning");
  if (tab === "analysis" && activeAnalysisTool === "access") {
    renderAccessAnalysisStation();
    if (!map.hasLayer(accessAnalysisStationLayer)) accessAnalysisStationLayer.addTo(map);
  } else {
    setAccessAnalysisMapMode(false);
    accessAnalysisStationLayer.remove();
  }
  document.querySelectorAll(".app-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
}

function applyViewMode() {
  const showGlobe = currentViewMode === "3d" && document.body.dataset.appTab === "map";
  document.body.dataset.viewMode = showGlobe ? "3d" : "2d";
  elements.map.hidden = showGlobe;
  elements.globe.hidden = !showGlobe;
  elements.globeHint.hidden = !showGlobe;
  elements.view2d.classList.toggle("active", currentViewMode === "2d");
  elements.view3d.classList.toggle("active", currentViewMode === "3d");
  elements.view2d.setAttribute("aria-pressed", String(currentViewMode === "2d"));
  elements.view3d.setAttribute("aria-pressed", String(currentViewMode === "3d"));
  globeController?.setVisible(showGlobe);
  if (showGlobe) globeController?.update(trackedSatellites, {
    selectedIds,
    highlightedIds: visualizedRecommendationIds,
    groundTracksVisible,
  });
  else window.setTimeout(() => map.invalidateSize(), 0);
}

function setViewMode(mode) {
  currentViewMode = mode === "3d" ? "3d" : "2d";
  localStorage.setItem("satelliteViewMode", currentViewMode);
  applyViewMode();
}

function updateSimulationClock(date) {
  elements.simulationTime.dateTime = date.toISOString();
  elements.simulationTime.dataset.simulationTime = String(date.getTime());
  elements.simulationTime.textContent = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function setSimulationSpeed(speed) {
  currentSimulationDate();
  if (!elements.recommendationMapBanner.hidden && speed !== 0) clearRecommendationVisualization(false);
  simulationSpeed = speed;
  if (speed === 1) simulationTimeMs = Date.now();
  lastClockUpdateMs = Date.now();
  updatePositions();
  updateGroundTracks();
  updateAccessWindows();
}

function setStatus(message, isError = false) {
  elements.statusText.textContent = message;
  elements.statusDot.classList.toggle("error", isError);
}

function setPanelExpanded(toggle, panel, expanded, bodyClass) {
  toggle.setAttribute("aria-expanded", String(expanded));
  panel.hidden = !expanded;
  if (bodyClass) document.body.classList.toggle(bodyClass, expanded);
}

function invalidateScenarioResults() {
  elements.scenarioResults.hidden = true;
  elements.scenarioProgress.hidden = true;
  elements.scenarioRangeError.hidden = true;
  elements.scenarioRun.textContent = "Run feasibility analysis";
}

function updateScenarioLinkCount() {
  const satelliteCount = Number(elements.scenarioSatelliteCount.value);
  if (Number.isInteger(satelliteCount) && satelliteCount >= 2) {
    elements.scenarioLinkCount.textContent = `${satelliteCount} satellites · ${satelliteCount - 1} links`;
  } else {
    elements.scenarioLinkCount.textContent = "Select satellite count";
  }
  invalidateScenarioResults();
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
  const hasAccess = item.position?.groundElevation >= groundStation.minimumElevation;
  const markerColor = selected ? "#ffd166" : hasAccess ? "#73e6a2" : item.color;
  return L.divIcon({
    className: `satellite-marker${selected ? " selected" : ""}${hasAccess ? " in-access" : ""}`,
    html: `<div class="satellite-marker-inner" style="--sat-color:${markerColor}"><span class="satellite-dot"></span><span class="satellite-label">${escapeHtml(item.label)} · ${altitude}</span></div>`,
    iconSize: [180, 24],
    iconAnchor: [0, 0],
  });
}

function removeFootprintLayers(item) {
  for (const layer of item.footprintLayers ?? []) layer.remove();
  item.footprintLayers = [];
}

function updateFootprintLayers(item) {
  if (!footprintsVisible || !item.position) {
    removeFootprintLayers(item);
    return;
  }

  const centers = [-360, 0, 360].map((longitudeOffset) => [
    item.position.latitude,
    item.position.longitude + longitudeOffset,
  ]);
  const radiusMeters = footprintDiameterKm * 500;
  if (item.footprintLayers.length !== centers.length) {
    removeFootprintLayers(item);
    item.footprintLayers = centers.map((center) => L.circle(center, {
      className: "live-footprint",
      radius: radiusMeters,
      color: item.color,
      weight: 1.5,
      opacity: 0.8,
      fillColor: item.color,
      fillOpacity: 0.1,
      interactive: false,
    }).addTo(map));
    return;
  }

  item.footprintLayers.forEach((layer, index) => {
    layer.setLatLng(centers[index]);
    layer.setRadius(radiusMeters);
  });
}

function refreshFootprints() {
  for (const item of trackedSatellites) updateFootprintLayers(item);
}

function wrappedPairCoordinates(firstPosition, secondPosition) {
  let secondLongitude = secondPosition.longitude;
  const longitudeDelta = secondLongitude - firstPosition.longitude;
  if (longitudeDelta > 180) secondLongitude -= 360;
  if (longitudeDelta < -180) secondLongitude += 360;
  const primary = [
    [firstPosition.latitude, firstPosition.longitude],
    [secondPosition.latitude, secondLongitude],
  ];
  return [-360, 0, 360].map((longitudeOffset) =>
    primary.map(([latitude, longitude]) => [latitude, longitude + longitudeOffset])
  );
}

function clearRecommendationVisualization(update = true) {
  for (const layers of recommendationCrosslinkLayers) {
    layers.halo.remove();
    layers.line.remove();
  }
  recommendationCrosslinkLayers = [];
  visualizedRecommendationIds = [];
  visualizedRecommendationLinks = [];
  elements.recommendationMapBanner.hidden = true;
  if (update) updatePositions();
}

function updateRecommendationCrosslinks() {
  if (!visualizedRecommendationLinks.length) return;
  visualizedRecommendationLinks.forEach(([firstId, secondId], pairIndex) => {
    const first = trackedSatellites.find((item) => item.id === firstId);
    const second = trackedSatellites.find((item) => item.id === secondId);
    if (!first?.position || !second?.position) return;
    const coordinates = wrappedPairCoordinates(first.position, second.position);
    let layers = recommendationCrosslinkLayers[pairIndex];
    if (!layers) {
      layers = {
        halo: L.polyline(coordinates, {
          className: "recommendation-crosslink-halo",
          color: "#050505",
          weight: 7,
          opacity: 0.8,
          interactive: false,
        }).addTo(map),
        line: L.polyline(coordinates, {
          className: "recommendation-crosslink",
          color: "#66e0ff",
          weight: 3,
          opacity: 1,
          interactive: false,
        }).addTo(map),
      };
      recommendationCrosslinkLayers[pairIndex] = layers;
    } else {
      layers.halo.setLatLngs(coordinates);
      layers.line.setLatLngs(coordinates);
    }
    layers.halo.bringToFront();
    layers.line.bringToFront();
  });
}

function visualizeRecommendation(group) {
  clearRecommendationVisualization(false);
  visualizedRecommendationIds = group.indices.map((index) => trackedSatellites[index].id);
  visualizedRecommendationLinks = group.displayOpportunityLinks.map(({ first, second }) => [
    trackedSatellites[first].id,
    trackedSatellites[second].id,
  ]);
  simulationSpeed = 0;
  elements.speedSelect.value = "0";
  simulationTimeMs = group.displayOpportunityMs;
  lastClockUpdateMs = Date.now();
  showAppTab("map");
  elements.recommendationMapLabel.textContent = group.indices
    .map((index) => trackedSatellites[index].label)
    .join(" · ");
  elements.recommendationMapTime.textContent = new Date(group.displayOpportunityMs).toLocaleString();
  elements.recommendationMapTime.dateTime = new Date(group.displayOpportunityMs).toISOString();
  elements.recommendationMapBanner.hidden = false;
  updatePositions();
  updateGroundTracks();
  updateAccessWindows(new Date(group.displayOpportunityMs));
}

function returnToRealTime() {
  clearRecommendationVisualization(false);
  simulationSpeed = 1;
  elements.speedSelect.value = "1";
  simulationTimeMs = Date.now();
  lastClockUpdateMs = Date.now();
  updatePositions();
  updateGroundTracks();
  updateAccessWindows(new Date(simulationTimeMs));
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
  const start = currentSimulationDate();

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

    item.trackPoints = points;

    item.trackLayers = splitAtDateLine(points).map((segment) => {
      const layer = L.polyline(segment, {
        className: "live-ground-track",
        color: item.color,
        weight: 2,
        opacity: 0.72,
        dashArray: "5 6",
        interactive: false,
      });
      if (groundTracksVisible) layer.addTo(map);
      return layer;
    });

    if (groundTracksVisible) {
      for (const layer of item.trackLayers) layer.bringToBack();
    }
  }
}

function setGroundTrackVisibility(visible) {
  groundTracksVisible = visible;
  localStorage.setItem("groundTracksVisible", String(visible));

  for (const item of trackedSatellites) {
    for (const layer of item.trackLayers ?? []) {
      if (visible && !map.hasLayer(layer)) layer.addTo(map).bringToBack();
      if (!visible && map.hasLayer(layer)) layer.remove();
    }
  }
  globeController?.update(trackedSatellites, {
    selectedIds,
    highlightedIds: visualizedRecommendationIds,
    groundTracksVisible,
  });
}

function formatAccessTime(date, referenceDate) {
  if (!date) return "—";
  const sameDay = date.toDateString() === referenceDate.toDateString();
  return new Intl.DateTimeFormat(undefined, sameDay
    ? { hour: "numeric", minute: "2-digit" }
    : { weekday: "short", hour: "numeric", minute: "2-digit" }
  ).format(date);
}

function calculateAccessWindow(item, startDate) {
  const stepMs = 60_000;
  const steps = 12 * 60;
  let previousDate = startDate;
  let previousElevation = calculatePosition(item, previousDate)?.groundElevation ?? -90;
  let accessStart = previousElevation >= groundStation.minimumElevation ? startDate : null;

  for (let index = 1; index <= steps; index += 1) {
    const date = new Date(startDate.getTime() + index * stepMs);
    const elevation = calculatePosition(item, date)?.groundElevation ?? -90;

    if (!accessStart && previousElevation < groundStation.minimumElevation && elevation >= groundStation.minimumElevation) {
      accessStart = date;
    }
    if (accessStart && previousElevation >= groundStation.minimumElevation && elevation < groundStation.minimumElevation) {
      return { start: accessStart, end: date };
    }

    previousDate = date;
    previousElevation = elevation;
  }

  return accessStart ? { start: accessStart, end: previousDate } : null;
}

function updateAccessWindows(startDate = currentSimulationDate()) {
  for (const item of trackedSatellites) {
    item.nextAccess = calculateAccessWindow(item, startDate);
  }
  updateAccessPanel(startDate);
}

function updateAccessPanel(date) {
  const rows = [...trackedSatellites].sort((first, second) => {
    const firstActive = first.position?.groundElevation >= groundStation.minimumElevation;
    const secondActive = second.position?.groundElevation >= groundStation.minimumElevation;
    if (firstActive !== secondActive) return firstActive ? -1 : 1;
    return (first.nextAccess?.start?.getTime() ?? Infinity) - (second.nextAccess?.start?.getTime() ?? Infinity);
  }).map((item) => {
    const row = document.createElement("div");
    const name = document.createElement("strong");
    const timing = document.createElement("span");
    const active = item.position?.groundElevation >= groundStation.minimumElevation;
    row.className = `access-row${active ? " active" : ""}`;
    name.textContent = item.label;

    if (active) {
      const until = formatAccessTime(item.nextAccess?.end, date);
      timing.textContent = `NOW · ${item.position.groundElevation.toFixed(1)}° · until ${until}`;
    } else if (item.nextAccess) {
      const start = formatAccessTime(item.nextAccess.start, date);
      const end = formatAccessTime(item.nextAccess.end, date);
      timing.textContent = `${start}–${end}`;
    } else {
      timing.textContent = "No pass in 12 hr";
    }

    row.append(name, timing);
    return row;
  });

  elements.accessList.replaceChildren(...rows);
  lastAccessPanelRenderMs = Date.now();
}

function calculatePosition(item, date) {
  const result = satellite.propagate(item.satrec, date);
  if (!result?.position || !result?.velocity) return null;

  const gmst = satellite.gstime(date);
  const geodetic = satellite.eciToGeodetic(result.position, gmst);
  const velocity = result.velocity;
  const ecfPosition = satellite.eciToEcf(result.position, gmst);
  const lookAngles = satellite.ecfToLookAngles(observerGeodetic, ecfPosition);
  return {
    latitude: satellite.degreesLat(geodetic.latitude),
    longitude: satellite.degreesLong(geodetic.longitude),
    altitude: geodetic.height,
    speed: Math.hypot(velocity.x, velocity.y, velocity.z),
    groundElevation: satellite.radiansToDegrees(lookAngles.elevation),
    eci: result.position,
  };
}

function accessAnalysisObserver() {
  return {
    latitude: satellite.degreesToRadians(accessAnalysisStation.latitude),
    longitude: satellite.degreesToRadians(accessAnalysisStation.longitude),
    height: 0,
  };
}

function accessAnalysisLookAngles(item, date, observer) {
  const result = satellite.propagate(item.satrec, date);
  if (!result?.position) return null;
  const gmst = satellite.gstime(date);
  const ecfPosition = satellite.eciToEcf(result.position, gmst);
  const lookAngles = satellite.ecfToLookAngles(observer, ecfPosition);
  return {
    elevation: satellite.radiansToDegrees(lookAngles.elevation),
    azimuth: satellite.radiansToDegrees(lookAngles.azimuth),
    range: lookAngles.rangeSat,
  };
}

function refineAccessBoundary(item, observer, minimumElevation, lowerMs, upperMs) {
  let lower = lowerMs;
  let upper = upperMs;
  const lowerVisible = (accessAnalysisLookAngles(item, new Date(lower), observer)?.elevation ?? -90) >= minimumElevation;
  for (let iteration = 0; iteration < 16 && upper - lower > 1000; iteration += 1) {
    const midpoint = Math.floor((lower + upper) / 2);
    const midpointVisible = (accessAnalysisLookAngles(item, new Date(midpoint), observer)?.elevation ?? -90) >= minimumElevation;
    if (midpointVisible === lowerVisible) lower = midpoint;
    else upper = midpoint;
  }
  return Math.round((lower + upper) / 2);
}

function peakAccessGeometry(item, observer, startMs, endMs) {
  const sampleStepMs = 30_000;
  let bestTimeMs = startMs;
  let bestLook = accessAnalysisLookAngles(item, new Date(startMs), observer) ?? { elevation: -90, azimuth: 0, range: Infinity };
  for (let timeMs = startMs + sampleStepMs; timeMs <= endMs; timeMs += sampleStepMs) {
    const look = accessAnalysisLookAngles(item, new Date(timeMs), observer);
    if (look && look.elevation > bestLook.elevation) {
      bestLook = look;
      bestTimeMs = timeMs;
    }
  }
  let lower = Math.max(startMs, bestTimeMs - sampleStepMs);
  let upper = Math.min(endMs, bestTimeMs + sampleStepMs);
  for (let iteration = 0; iteration < 18; iteration += 1) {
    const first = lower + (upper - lower) / 3;
    const second = upper - (upper - lower) / 3;
    const firstElevation = accessAnalysisLookAngles(item, new Date(first), observer)?.elevation ?? -90;
    const secondElevation = accessAnalysisLookAngles(item, new Date(second), observer)?.elevation ?? -90;
    if (firstElevation < secondElevation) lower = first;
    else upper = second;
  }
  bestTimeMs = Math.round((lower + upper) / 2);
  bestLook = accessAnalysisLookAngles(item, new Date(bestTimeMs), observer) ?? bestLook;
  return { time: new Date(bestTimeMs), ...bestLook };
}

function calculateSevenDayAccess(item, startDate) {
  const observer = accessAnalysisObserver();
  const minimumElevation = accessAnalysisStation.minimumElevation;
  const stepMs = 30_000;
  const startMs = startDate.getTime();
  const endMs = startMs + 7 * 86400_000;
  const windows = [];
  let previousMs = startMs;
  let previousVisible = (accessAnalysisLookAngles(item, startDate, observer)?.elevation ?? -90) >= minimumElevation;
  let windowStartMs = previousVisible ? startMs : null;

  for (let timeMs = startMs + stepMs; timeMs <= endMs; timeMs += stepMs) {
    const visible = (accessAnalysisLookAngles(item, new Date(timeMs), observer)?.elevation ?? -90) >= minimumElevation;
    if (visible !== previousVisible) {
      const boundaryMs = refineAccessBoundary(item, observer, minimumElevation, previousMs, timeMs);
      if (visible) windowStartMs = boundaryMs;
      else if (windowStartMs !== null) {
        windows.push({ start: new Date(windowStartMs), end: new Date(boundaryMs) });
        windowStartMs = null;
      }
    }
    previousVisible = visible;
    previousMs = timeMs;
  }
  if (windowStartMs !== null) windows.push({ start: new Date(windowStartMs), end: new Date(endMs) });

  for (const window of windows) {
    window.durationMs = window.end.getTime() - window.start.getTime();
    window.peak = peakAccessGeometry(item, observer, window.start.getTime(), window.end.getTime());
  }
  return { start: startDate, end: new Date(endMs), windows };
}

function formatZuluDate(date) {
  return `${date.toISOString().slice(0, 19).replace("T", " ")} Z`;
}

function formatZuluDateParts(date) {
  const [datePart, timePart] = date.toISOString().slice(0, 19).split("T");
  return { date: datePart, time: `${timePart} Z` };
}

function formatStationLocalDateParts(date, timeZone) {
  const datePart = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  }).format(date);
  const timePart = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(date);
  return { date: datePart, time: timePart };
}

function groundStationTimeZone() {
  return tzLookup(accessAnalysisStation.latitude, accessAnalysisStation.longitude);
}

function formatLocalDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalStartDate(value) {
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return null;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function accessAnalysisFilterValues() {
  return {
    minimumDurationMs: Math.max(0, Number(elements.accessAnalysisMinDuration.value) || 0) * 60_000,
    minimumPeakElevation: Math.max(0, Math.min(90, Number(elements.accessAnalysisMinPeakElevation.value) || 0)),
  };
}

function accessTableRows(windows, formatDateParts) {
  if (!windows.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.className = "access-analysis-empty-row";
    cell.textContent = "No access windows match the current filters.";
    row.append(cell);
    return [row];
  }
  return windows.map((window) => {
    const row = document.createElement("tr");
    const start = formatDateParts(window.start);
    const end = formatDateParts(window.end);
    const values = [
      String(window.passNumber),
      start.date,
      start.time,
      `${end.time}${end.date !== start.date ? "*" : ""}`,
      formatScenarioDuration(window.durationMs),
      `${window.peak.elevation.toFixed(1)}°`,
      `${Math.round(window.peak.range).toLocaleString()} km`,
    ];
    row.append(...values.map((value) => Object.assign(document.createElement("td"), { textContent: value })));
    return row;
  });
}

function renderSevenDayAccessResult(item, result) {
  const filters = accessAnalysisFilterValues();
  const allWindows = result.windows.map((window, index) => ({ ...window, passNumber: index + 1 }));
  const windows = allWindows.filter((window) => window.durationMs >= filters.minimumDurationMs
    && window.peak.elevation >= filters.minimumPeakElevation);
  const stationTimeZone = groundStationTimeZone();
  const totalDurationMs = windows.reduce((sum, window) => sum + window.durationMs, 0);
  const averageDurationMs = windows.length ? totalDurationMs / windows.length : 0;
  const gaps = windows.slice(1).map((window, index) => window.start.getTime() - windows[index].end.getTime());
  const longestGapMs = gaps.length ? Math.max(...gaps) : null;
  elements.accessAnalysisAnswer.textContent = allWindows.length === 0
    ? `${item.label} has no access above ${accessAnalysisStation.minimumElevation}° from this ground station during the selected seven-day period.`
    : windows.length === allWindows.length
      ? `${item.label} has ${windows.length} access ${windows.length === 1 ? "window" : "windows"} above ${accessAnalysisStation.minimumElevation}° during the selected seven-day period.`
      : `Showing ${windows.length} of ${allWindows.length} access windows after applying the duration and maximum-elevation filters.`;
  elements.accessAnalysisPassCount.textContent = windows.length.toLocaleString();
  elements.accessAnalysisTotal.textContent = formatScenarioDuration(totalDurationMs);
  elements.accessAnalysisAverage.textContent = windows.length ? formatScenarioDuration(averageDurationMs) : "—";
  elements.accessAnalysisLongestGap.textContent = longestGapMs === null ? "—" : formatScenarioDuration(longestGapMs);
  elements.accessAnalysisPeriod.textContent = `${formatZuluDate(result.start)} through ${formatZuluDate(result.end)} · Ground-station zone ${stationTimeZone} · NORAD ${item.id} · Element epoch ${formatZuluDate(new Date(item.omm.EPOCH))}`;
  const countLabel = windows.length === allWindows.length
    ? windows.length.toLocaleString()
    : `${windows.length.toLocaleString()} of ${allWindows.length.toLocaleString()}`;
  elements.accessAnalysisZuluSummary.textContent = `Zulu access windows (${countLabel})`;
  elements.accessAnalysisLocalSummary.textContent = `Ground-station local windows · ${stationTimeZone} (${countLabel})`;
  elements.accessAnalysisZuluWindowList.replaceChildren(...accessTableRows(windows, formatZuluDateParts));
  elements.accessAnalysisLocalWindowList.replaceChildren(...accessTableRows(windows, (date) => formatStationLocalDateParts(date, stationTimeZone)));
  elements.accessAnalysisResults.hidden = false;
}

function applyAccessAnalysisFilters() {
  if (!lastAccessAnalysisResult) return;
  renderSevenDayAccessResult(lastAccessAnalysisResult.item, lastAccessAnalysisResult.result);
}

async function runSevenDayAccessAnalysis() {
  const noradId = elements.accessAnalysisNorad.value.trim();
  const item = trackedSatellites.find((candidate) => candidate.id === noradId);
  const startDate = parseLocalStartDate(elements.accessAnalysisStartDate.value);
  elements.accessAnalysisError.hidden = true;
  if (!/^\d+$/.test(noradId)) {
    elements.accessAnalysisError.textContent = "Enter a numeric NORAD catalog ID.";
    elements.accessAnalysisError.hidden = false;
    return;
  }
  if (!item) {
    elements.accessAnalysisError.textContent = `NORAD ${noradId} is not in the currently loaded satellite set. Add it to the satellite set and refresh the ephemeris data.`;
    elements.accessAnalysisError.hidden = false;
    return;
  }
  if (!startDate) {
    elements.accessAnalysisError.textContent = "Choose a valid start date.";
    elements.accessAnalysisError.hidden = false;
    return;
  }
  elements.accessAnalysisRun.disabled = true;
  elements.accessAnalysisRun.textContent = "Computing 7 days…";
  elements.accessAnalysisResults.hidden = true;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  try {
    const result = calculateSevenDayAccess(item, startDate);
    lastAccessAnalysisResult = { item, result };
    renderSevenDayAccessResult(item, result);
  } catch (error) {
    lastAccessAnalysisResult = null;
    console.error(error);
    elements.accessAnalysisError.textContent = "The access calculation failed for this satellite’s current elements.";
    elements.accessAnalysisError.hidden = false;
  } finally {
    elements.accessAnalysisRun.disabled = false;
    elements.accessAnalysisRun.textContent = "Compute 7-day window";
  }
}

function earthLineOfSightClearance(firstPosition, secondPosition) {
  const firstScaled = {
    x: firstPosition.x / earthEquatorialRadiusKm,
    y: firstPosition.y / earthEquatorialRadiusKm,
    z: firstPosition.z / earthPolarRadiusKm,
  };
  const secondScaled = {
    x: secondPosition.x / earthEquatorialRadiusKm,
    y: secondPosition.y / earthEquatorialRadiusKm,
    z: secondPosition.z / earthPolarRadiusKm,
  };
  const scaledDelta = {
    x: secondScaled.x - firstScaled.x,
    y: secondScaled.y - firstScaled.y,
    z: secondScaled.z - firstScaled.z,
  };
  const distanceSquared = scaledDelta.x ** 2 + scaledDelta.y ** 2 + scaledDelta.z ** 2;
  if (distanceSquared === 0) return Infinity;

  const projection = -(
    firstScaled.x * scaledDelta.x
    + firstScaled.y * scaledDelta.y
    + firstScaled.z * scaledDelta.z
  ) / distanceSquared;
  const segmentFraction = Math.max(0, Math.min(1, projection));
  const closestScaledPoint = {
    x: firstScaled.x + segmentFraction * scaledDelta.x,
    y: firstScaled.y + segmentFraction * scaledDelta.y,
    z: firstScaled.z + segmentFraction * scaledDelta.z,
  };
  return Math.hypot(
    closestScaledPoint.x,
    closestScaledPoint.y,
    closestScaledPoint.z,
  ) - 1;
}

function hasEarthLineOfSight(firstPosition, secondPosition) {
  return earthLineOfSightClearance(firstPosition, secondPosition) > 0;
}

function hasEarthClearLink(firstPosition, secondPosition, minimumDistanceKm, maximumDistanceKm) {
  const distance = Math.hypot(
    secondPosition.x - firstPosition.x,
    secondPosition.y - firstPosition.y,
    secondPosition.z - firstPosition.z
  );
  return distance > minimumDistanceKm
    && distance < maximumDistanceKm
    && hasEarthLineOfSight(firstPosition, secondPosition);
}

function raanSeparationDegrees(firstRaan, secondRaan) {
  const difference = Math.abs(firstRaan - secondRaan) % 360;
  return Math.min(difference, 360 - difference);
}

function formatScenarioDuration(durationMs) {
  const totalMinutes = Math.round(durationMs / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
}

function scenarioPositionsAt(date) {
  const gmst = satellite.gstime(date);
  return trackedSatellites.map((item) => {
    const result = satellite.propagate(item.satrec, date);
    if (!result?.position) return null;
    const ecfPosition = satellite.eciToEcf(result.position, gmst);
    const lookAngles = satellite.ecfToLookAngles(observerGeodetic, ecfPosition);
    return {
      eci: result.position,
      groundAccess: satellite.radiansToDegrees(lookAngles.elevation) >= groundStation.minimumElevation,
    };
  });
}

function qualifyingScenarioGroups(
  positions,
  requestedSatelliteCount,
  minimumDistanceKm,
  maximumDistanceKm,
  samePlaneOnly,
  raanToleranceDegrees
) {
  const satelliteCount = positions.length;
  const links = Array.from({ length: satelliteCount }, () => new Float64Array(satelliteCount));

  for (let first = 0; first < satelliteCount; first += 1) {
    if (!positions[first]) continue;
    for (let second = first + 1; second < satelliteCount; second += 1) {
      const firstRaan = Number(trackedSatellites[first].omm.RA_OF_ASC_NODE);
      const secondRaan = Number(trackedSatellites[second].omm.RA_OF_ASC_NODE);
      if (
        samePlaneOnly
        && (
          !Number.isFinite(firstRaan)
          || !Number.isFinite(secondRaan)
          || raanSeparationDegrees(firstRaan, secondRaan) > raanToleranceDegrees
        )
      ) continue;
      if (
        positions[second]
        && hasEarthClearLink(positions[first].eci, positions[second].eci, minimumDistanceKm, maximumDistanceKm)
      ) {
        const distance = Math.hypot(
          positions[first].eci.x - positions[second].eci.x,
          positions[first].eci.y - positions[second].eci.y,
          positions[first].eci.z - positions[second].eci.z
        );
        links[first][second] = distance;
        links[second][first] = distance;
      }
    }
  }

  function minimumDistanceSpanningTree(indices) {
    const connected = new Set([indices[0]]);
    const treeLinks = [];
    while (connected.size < indices.length) {
      let bestLink = null;
      for (const first of connected) {
        for (const second of indices) {
          const distance = links[first][second];
          if (connected.has(second) || !distance) continue;
          if (!bestLink || distance < bestLink.distance) bestLink = { first, second, distance };
        }
      }
      if (!bestLink) return null;
      connected.add(bestLink.second);
      treeLinks.push(bestLink);
    }
    return treeLinks;
  }

  const groups = new Map();
  const seenPartialGroups = Array.from({ length: requestedSatelliteCount + 1 }, () => new Set());

  function growConnectedGroup(indices) {
    const sortedIndices = [...indices].sort((first, second) => first - second);
    const key = sortedIndices.join(",");
    if (seenPartialGroups[sortedIndices.length].has(key)) return;
    seenPartialGroups[sortedIndices.length].add(key);

    if (sortedIndices.length === requestedSatelliteCount) {
      const groundAccessCount = sortedIndices.reduce(
        (count, index) => count + Number(positions[index].groundAccess),
        0,
      );
      if (!groundAccessCount) return;
      const treeLinks = minimumDistanceSpanningTree(sortedIndices);
      if (treeLinks?.length === requestedSatelliteCount - 1) {
        groups.set(key, { groundAccessCount, treeLinks });
      }
      return;
    }

    const candidates = new Set();
    for (const first of sortedIndices) {
      for (let second = 0; second < satelliteCount; second += 1) {
        if (links[first][second] && !sortedIndices.includes(second)) candidates.add(second);
      }
    }
    for (const candidate of [...candidates].sort((first, second) => first - second)) {
      growConnectedGroup([...sortedIndices, candidate]);
    }
  }

  for (let root = 0; root < satelliteCount; root += 1) {
    if (positions[root]?.groundAccess) growConnectedGroup([root]);
  }
  return groups;
}

function fixedScenarioGroupAt(
  indices,
  date,
  minimumDistanceKm,
  maximumDistanceKm,
  samePlaneOnly,
  raanToleranceDegrees,
) {
  const positions = scenarioPositionsAt(date);
  const availableLinks = [];
  for (let firstIndex = 0; firstIndex < indices.length; firstIndex += 1) {
    const first = indices[firstIndex];
    if (!positions[first]) return null;
    for (let secondIndex = firstIndex + 1; secondIndex < indices.length; secondIndex += 1) {
      const second = indices[secondIndex];
      if (!positions[second]) return null;
      const firstRaan = Number(trackedSatellites[first].omm.RA_OF_ASC_NODE);
      const secondRaan = Number(trackedSatellites[second].omm.RA_OF_ASC_NODE);
      if (
        samePlaneOnly
        && (
          !Number.isFinite(firstRaan)
          || !Number.isFinite(secondRaan)
          || raanSeparationDegrees(firstRaan, secondRaan) > raanToleranceDegrees
        )
      ) continue;
      if (hasEarthClearLink(positions[first].eci, positions[second].eci, minimumDistanceKm, maximumDistanceKm)) {
        availableLinks.push({
          first,
          second,
          distance: Math.hypot(
            positions[first].eci.x - positions[second].eci.x,
            positions[first].eci.y - positions[second].eci.y,
            positions[first].eci.z - positions[second].eci.z,
          ),
        });
      }
    }
  }

  const connected = new Set([indices[0]]);
  const treeLinks = [];
  while (connected.size < indices.length) {
    const bestLink = availableLinks
      .filter((link) => connected.has(link.first) !== connected.has(link.second))
      .sort((first, second) => first.distance - second.distance)[0];
    if (!bestLink) return null;
    connected.add(bestLink.first);
    connected.add(bestLink.second);
    treeLinks.push(bestLink);
  }
  return treeLinks;
}

function durationStatistics(durations) {
  if (!durations.length) return { minimum: 0, maximum: 0, average: 0, count: 0 };
  let minimum = Infinity;
  let maximum = 0;
  let total = 0;
  for (const duration of durations) {
    minimum = Math.min(minimum, duration);
    maximum = Math.max(maximum, duration);
    total += duration;
  }
  return {
    minimum,
    maximum,
    average: total / durations.length,
    count: durations.length,
  };
}

function updateActiveRuns(currentKeys, activeStarts, dateMs, completedDurations) {
  for (const key of currentKeys) {
    if (!activeStarts.has(key)) activeStarts.set(key, dateMs);
  }
  for (const [key, startMs] of activeStarts) {
    if (!currentKeys.has(key)) {
      completedDurations.push(dateMs - startMs);
      activeStarts.delete(key);
    }
  }
}

function createDurationTier(label, statistics) {
  const row = document.createElement("div");
  const heading = document.createElement("strong");
  row.className = "scenario-duration-tier";
  heading.textContent = label;
  row.append(heading);
  for (const [name, value] of [
    ["Min", statistics.minimum],
    ["Max", statistics.maximum],
    ["Average", statistics.average],
  ]) {
    const metric = document.createElement("span");
    const strong = document.createElement("strong");
    metric.append(name, strong);
    strong.textContent = formatScenarioDuration(value);
    row.append(metric);
  }
  return row;
}

function createScenarioGroupRows(groups, durationKey = "durationMs", eventKey = "eventCount") {
  return groups.map((group) => {
    const row = document.createElement("div");
    const names = document.createElement("strong");
    const metrics = document.createElement("span");
    row.className = "scenario-group-row";
    names.textContent = group.indices.map((index) => trackedSatellites[index].label).join(" · ");
    metrics.textContent = `${formatScenarioDuration(group[durationKey])} · ${group[eventKey]} window${group[eventKey] === 1 ? "" : "s"}`;
    row.append(names, metrics);
    return row;
  });
}

function robustnessComparator(first, second) {
  return second.durationMs - first.durationMs
    || second.averageEventDurationMs - first.averageEventDurationMs
    || second.minimumEventDurationMs - first.minimumEventDurationMs
    || second.maximumEventDurationMs - first.maximumEventDurationMs
    || second.twoGroundDurationMs - first.twoGroundDurationMs
    || second.coveredDayCount - first.coveredDayCount;
}

function createRecommendationCard(group, index) {
  const card = document.createElement("article");
  const rank = document.createElement("span");
  const heading = document.createElement("h4");
  const metrics = document.createElement("p");
  const durations = document.createElement("div");
  const evidence = document.createElement("div");
  const viewButton = document.createElement("button");
  card.className = `recommendation-card${index === 0 ? " primary" : ""}`;
  rank.className = "recommendation-rank";
  rank.textContent = index === 0 ? "Recommended" : `Runner-up ${index}`;
  heading.textContent = group.indices.map((satelliteIndex) => trackedSatellites[satelliteIndex].label).join(" · ");
  metrics.textContent = `${formatScenarioDuration(group.durationMs)} total connectivity across ${group.eventCount.toLocaleString()} qualifying windows · ${group.coveredDayCount}/${group.analysisDays} analysis days · ${formatScenarioDuration(group.twoGroundDurationMs)} with 2+ ground links`;
  durations.className = "recommendation-durations";
  for (const [label, duration] of [
    ["Min connectivity", group.minimumEventDurationMs],
    ["Max connectivity", group.maximumEventDurationMs],
    ["Avg connectivity", group.averageEventDurationMs],
  ]) {
    const item = document.createElement("span");
    const value = document.createElement("strong");
    item.append(label, value);
    value.textContent = formatScenarioDuration(duration);
    durations.append(item);
  }
  evidence.className = "recommendation-evidence";
  const longestOpportunity = document.createElement("p");
  longestOpportunity.textContent = `Longest continuous opportunity: ${new Date(group.longestEventStartMs).toLocaleString()} – ${new Date(group.longestEventEndMs).toLocaleString()} · ${formatScenarioDuration(group.maximumEventDurationMs)}. Map snapshot uses the midpoint.`;
  evidence.append(longestOpportunity);
  for (const link of group.displayOpportunityLinks) {
    const pair = document.createElement("span");
    const distance = link.distance.toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    pair.textContent = `${trackedSatellites[link.first].label}–${trackedSatellites[link.second].label}: ${distance} km`;
    evidence.append(pair);
  }
  viewButton.className = "recommendation-map-button";
  viewButton.type = "button";
  viewButton.textContent = "View longest opportunity on map";
  viewButton.addEventListener("click", () => visualizeRecommendation(group));
  card.append(rank, heading, metrics, viewButton, durations, evidence);
  if (index === 0) {
    const executive = document.createElement("section");
    const introduction = document.createElement("strong");
    const reasons = document.createElement("ul");
    const windowsPerDay = group.eventCount / group.analysisDays;
    const multiGroundPercent = group.durationMs
      ? Math.round((100 * group.twoGroundDurationMs) / group.durationMs)
      : 0;
    executive.className = "recommendation-executive";
    introduction.textContent = "This is recommended because of the following reasons:";
    for (const reason of [
      `It provides the most accumulated connectivity: ${formatScenarioDuration(group.durationMs)} across ${group.eventCount.toLocaleString()} qualifying windows.`,
      `It produces ${group.eventCount.toLocaleString()} distinct qualifying connectivity windows over ${group.analysisDays} days—about ${windowsPerDay.toFixed(1)} per day across the ${group.satelliteCount}-satellite group. This is not a single-satellite ground-station revisit rate.`,
      `Each qualifying connectivity window lasts ${formatScenarioDuration(group.averageEventDurationMs)} on average.`,
      `It produces at least one qualifying opportunity on ${group.coveredDayCount} of ${group.analysisDays} analysis days.`,
      `Two or more satellites have simultaneous ground access for ${formatScenarioDuration(group.twoGroundDurationMs)}, about ${multiGroundPercent}% of its connected time.`,
      `Its longest continuous qualifying opportunity lasts ${formatScenarioDuration(group.maximumEventDurationMs)}.`,
      `Every counted window connects all ${group.satelliteCount} satellites through exactly ${group.satelliteCount - 1} displayed spanning-tree links inside the selected distance range${group.samePlaneOnly ? ` and within ${group.raanToleranceDegrees}° RAAN` : ""}, with Earth-clear line of sight.`,
    ]) {
      const item = document.createElement("li");
      item.textContent = reason;
      reasons.append(item);
    }
    executive.append(introduction, reasons);
    card.insertBefore(executive, viewButton);
  }
  return card;
}

function renderScenarioResults(result) {
  const percent = (100 * result.totalDurationMs) / result.analysisDurationMs;
  elements.scenarioAnswer.textContent = result.totalDurationMs
    ? `Yes. At least one qualifying ${result.satelliteCount}-satellite network exists for approximately ${formatScenarioDuration(result.totalDurationMs)} during the next ${result.analysisDays} days.`
    : `No qualifying ${result.satelliteCount}-satellite network was found during the next ${result.analysisDays} days at this resolution.`;
  elements.scenarioTotalTime.textContent = formatScenarioDuration(result.totalDurationMs);
  elements.scenarioPercent.textContent = `${percent.toFixed(2)}%`;
  elements.scenarioWindowCount.textContent = result.windowCount.toLocaleString();
  elements.scenarioGroupCount.textContent = result.groups.length.toLocaleString();
  const planeRule = result.samePlaneOnly
    ? `Same-plane links within ${result.raanToleranceDegrees}° RAAN`
    : "Cross-plane links allowed";
  elements.scenarioPeriod.textContent = `${result.start.toLocaleString()} through ${result.end.toLocaleString()} · ${result.minimumDistanceKm.toLocaleString()}–${result.maximumDistanceKm.toLocaleString()} km link range · ${planeRule} · Current element sets · ±2-minute boundary precision`;
  elements.scenarioRecommendations.replaceChildren(
    ...result.recommendedGroups.slice(0, 3).map(createRecommendationCard)
  );
  elements.scenarioDurationTiers.replaceChildren(
    createDurationTier("1+ ground satellite", result.durationStats.one),
    createDurationTier("2+ ground satellites", result.durationStats.two),
    createDurationTier(`All ${result.satelliteCount} ground satellites`, result.durationStats.all)
  );

  elements.scenarioWindowSummary.textContent = `All opportunity windows (${result.windows.length.toLocaleString()})`;
  const windowRows = result.windows.map((window) => {
    const row = document.createElement("div");
    const timing = document.createElement("strong");
    const duration = document.createElement("span");
    row.className = "scenario-window-row";
    timing.textContent = `${window.start.toLocaleString()} – ${window.end.toLocaleString()}`;
    duration.textContent = formatScenarioDuration(window.end - window.start);
    row.append(timing, duration);
    return row;
  });
  elements.scenarioWindowList.replaceChildren(...windowRows);

  const multiGroundGroups = result.groups.filter((group) => group.twoGroundDurationMs > 0);
  const allGroundGroups = result.groups.filter((group) => group.allGroundDurationMs > 0);
  elements.scenarioMultiSummary.textContent = `Groups with 2+ satellites in ground access (${multiGroundGroups.length.toLocaleString()})`;
  elements.scenarioMultiList.replaceChildren(...createScenarioGroupRows(multiGroundGroups.slice(0, 100), "twoGroundDurationMs", "twoGroundEventCount"));
  elements.scenarioTripleSummary.textContent = `Groups with all ${result.satelliteCount} satellites in ground access (${allGroundGroups.length.toLocaleString()})`;
  elements.scenarioTripleList.replaceChildren(...createScenarioGroupRows(allGroundGroups.slice(0, 100), "allGroundDurationMs", "allGroundEventCount"));
  elements.scenarioGroupList.replaceChildren(...createScenarioGroupRows(result.groups.slice(0, 100)));
  elements.scenarioResults.hidden = false;
}

async function runScenarioAnalysis() {
  if (trackedSatellites.length < 3) return;
  const analysisDays = Number(elements.scenarioAnalysisDays.value);
  const satelliteCount = Number(elements.scenarioSatelliteCount.value);
  const minimumDistanceKm = Number(elements.scenarioMinimumDistance.value);
  const maximumDistanceKm = Number(elements.scenarioMaximumDistance.value);
  const samePlaneOnly = elements.scenarioSamePlaneOnly.checked;
  const raanToleranceDegrees = Number(elements.scenarioRaanTolerance.value);
  if (
    !Number.isInteger(analysisDays)
    || analysisDays < 1
    || analysisDays > 60
    || !Number.isInteger(satelliteCount)
    || satelliteCount < 3
    || satelliteCount > Math.min(6, trackedSatellites.length)
    || !Number.isFinite(minimumDistanceKm)
    || !Number.isFinite(maximumDistanceKm)
    || minimumDistanceKm < 0
    || maximumDistanceKm <= minimumDistanceKm
    || (samePlaneOnly && (!Number.isFinite(raanToleranceDegrees) || raanToleranceDegrees < 0 || raanToleranceDegrees > 180))
  ) {
    elements.scenarioRangeError.textContent = `Enter 1–60 whole analysis days, 3–${Math.min(6, trackedSatellites.length)} satellites, valid distance bounds, and a RAAN tolerance from 0° to 180°.`;
    elements.scenarioRangeError.hidden = false;
    return;
  }
  elements.scenarioRangeError.hidden = true;
  elements.scenarioRun.disabled = true;
  elements.scenarioAnalysisDays.disabled = true;
  elements.scenarioSatelliteCount.disabled = true;
  elements.scenarioMinimumDistance.disabled = true;
  elements.scenarioMaximumDistance.disabled = true;
  elements.scenarioSamePlaneOnly.disabled = true;
  elements.scenarioRaanTolerance.disabled = true;
  elements.scenarioRun.textContent = "Analyzing…";
  elements.scenarioProgress.hidden = false;
  elements.scenarioResults.hidden = true;

  const start = new Date();
  const analysisDurationMs = analysisDays * 24 * 60 * 60_000;
  const end = new Date(start.getTime() + analysisDurationMs);
  const stepCount = Math.ceil(analysisDurationMs / scenarioStepMs);
  const groupStats = new Map();
  let previousGroups = new Set();
  let previousTwoGroundGroups = new Set();
  let previousAllGroundGroups = new Set();
  const activeRuns = {
    one: new Map(),
    two: new Map(),
    all: new Map(),
  };
  const completedDurations = {
    one: [],
    two: [],
    all: [],
  };
  let totalDurationMs = 0;
  let windowCount = 0;
  let previouslyQualifying = false;
  let windowStart = null;
  const windows = [];

  try {
    for (let step = 0; step < stepCount; step += 1) {
      const date = new Date(start.getTime() + step * scenarioStepMs);
      const groupAccessCounts = qualifyingScenarioGroups(
        scenarioPositionsAt(date),
        satelliteCount,
        minimumDistanceKm,
        maximumDistanceKm,
        samePlaneOnly,
        raanToleranceDegrees
      );
      const currentGroups = new Set(groupAccessCounts.keys());
      const currentTwoGroundGroups = new Set(
        [...groupAccessCounts].filter(([, details]) => details.groundAccessCount >= 2).map(([key]) => key)
      );
      const currentAllGroundGroups = new Set(
        [...groupAccessCounts].filter(([, details]) => details.groundAccessCount === satelliteCount).map(([key]) => key)
      );
      const qualifying = currentGroups.size > 0;

      if (qualifying) {
        totalDurationMs += scenarioStepMs;
        if (!previouslyQualifying) {
          windowCount += 1;
          windowStart = date;
        }
      } else if (previouslyQualifying && windowStart) {
        windows.push({ start: windowStart, end: date });
        windowStart = null;
      }

      for (const key of currentGroups) {
        let stats = groupStats.get(key);
        if (!stats) {
          stats = {
            durationMs: 0,
            eventCount: 0,
            eventStartMs: null,
            lastEndMs: start.getTime(),
            maximumEventDurationMs: 0,
            minimumEventDurationMs: Infinity,
            maxGapMs: 0,
            coveredDays: new Set(),
            longestEventStartMs: date.getTime(),
            longestEventEndMs: date.getTime() + scenarioStepMs,
            minimumLinkDistance: Infinity,
            maximumLinkDistance: 0,
            twoGroundDurationMs: 0,
            twoGroundEventCount: 0,
            allGroundDurationMs: 0,
            allGroundEventCount: 0,
          };
          groupStats.set(key, stats);
        }
        stats.durationMs += scenarioStepMs;
        stats.coveredDays.add(Math.floor((date.getTime() - start.getTime()) / 86_400_000));
        if (!previousGroups.has(key)) {
          stats.eventCount += 1;
          stats.eventStartMs = date.getTime();
          stats.maxGapMs = Math.max(stats.maxGapMs, date.getTime() - stats.lastEndMs);
        }
        const groupDetails = groupAccessCounts.get(key);
        const groundAccessCount = groupDetails.groundAccessCount;
        groupDetails.treeLinks.forEach(({ distance }) => {
          if (!(distance > minimumDistanceKm && distance < maximumDistanceKm)) {
            throw new Error(`Scenario distance invariant failed for ${key}: ${distance} km`);
          }
          stats.minimumLinkDistance = Math.min(stats.minimumLinkDistance, distance);
          stats.maximumLinkDistance = Math.max(stats.maximumLinkDistance, distance);
        });
        if (groundAccessCount >= 2) {
          stats.twoGroundDurationMs += scenarioStepMs;
          if (!previousTwoGroundGroups.has(key)) stats.twoGroundEventCount += 1;
        }
        if (groundAccessCount === satelliteCount) {
          stats.allGroundDurationMs += scenarioStepMs;
          if (!previousAllGroundGroups.has(key)) stats.allGroundEventCount += 1;
        }
      }

      for (const key of previousGroups) {
        if (currentGroups.has(key)) continue;
        const stats = groupStats.get(key);
        const eventDurationMs = date.getTime() - stats.eventStartMs;
        stats.minimumEventDurationMs = Math.min(stats.minimumEventDurationMs, eventDurationMs);
        if (eventDurationMs > stats.maximumEventDurationMs) {
          stats.maximumEventDurationMs = eventDurationMs;
          stats.longestEventStartMs = stats.eventStartMs;
          stats.longestEventEndMs = date.getTime();
        }
        stats.eventStartMs = null;
        stats.lastEndMs = date.getTime();
      }

      updateActiveRuns(currentGroups, activeRuns.one, date.getTime(), completedDurations.one);
      updateActiveRuns(currentTwoGroundGroups, activeRuns.two, date.getTime(), completedDurations.two);
      updateActiveRuns(currentAllGroundGroups, activeRuns.all, date.getTime(), completedDurations.all);

      previousGroups = currentGroups;
      previousTwoGroundGroups = currentTwoGroundGroups;
      previousAllGroundGroups = currentAllGroundGroups;
      previouslyQualifying = qualifying;

      if (step % 100 === 0 || step === stepCount - 1) {
        const progress = Math.round((100 * (step + 1)) / stepCount);
        elements.scenarioProgressLabel.textContent = `Scanning day ${Math.min(analysisDays, Math.floor((step * scenarioStepMs) / 86_400_000) + 1)} of ${analysisDays}…`;
        elements.scenarioProgressValue.textContent = `${progress}%`;
        elements.scenarioProgressBar.value = progress;
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    if (windowStart) windows.push({ start: windowStart, end });
    updateActiveRuns(new Set(), activeRuns.one, end.getTime(), completedDurations.one);
    updateActiveRuns(new Set(), activeRuns.two, end.getTime(), completedDurations.two);
    updateActiveRuns(new Set(), activeRuns.all, end.getTime(), completedDurations.all);

    for (const stats of groupStats.values()) {
      if (stats.eventStartMs !== null) {
        const eventDurationMs = end.getTime() - stats.eventStartMs;
        stats.minimumEventDurationMs = Math.min(stats.minimumEventDurationMs, eventDurationMs);
        if (eventDurationMs > stats.maximumEventDurationMs) {
          stats.maximumEventDurationMs = eventDurationMs;
          stats.longestEventStartMs = stats.eventStartMs;
          stats.longestEventEndMs = end.getTime();
        }
        stats.eventStartMs = null;
        stats.lastEndMs = end.getTime();
      }
      stats.maxGapMs = Math.max(stats.maxGapMs, end.getTime() - stats.lastEndMs);
    }

    const groups = [...groupStats.entries()]
      .map(([key, stats]) => ({
        indices: key.split(",").map(Number),
        durationMs: stats.durationMs,
        eventCount: stats.eventCount,
        twoGroundDurationMs: stats.twoGroundDurationMs,
        twoGroundEventCount: stats.twoGroundEventCount,
        allGroundDurationMs: stats.allGroundDurationMs,
        allGroundEventCount: stats.allGroundEventCount,
        minimumEventDurationMs: stats.minimumEventDurationMs,
        maximumEventDurationMs: stats.maximumEventDurationMs,
        averageEventDurationMs: stats.durationMs / stats.eventCount,
        maxGapMs: stats.maxGapMs,
        coveredDayCount: stats.coveredDays.size,
        longestEventStartMs: stats.longestEventStartMs,
        longestEventEndMs: stats.longestEventEndMs,
        minimumLinkDistance: stats.minimumLinkDistance,
        maximumLinkDistance: stats.maximumLinkDistance,
        analysisDays,
        satelliteCount,
        samePlaneOnly,
        raanToleranceDegrees,
      }))
      .sort((first, second) => second.durationMs - first.durationMs);
    const recommendedGroups = [...groups].sort(robustnessComparator);
    for (const group of recommendedGroups.slice(0, 3)) {
      const midpointMs = group.longestEventStartMs
        + (group.longestEventEndMs - group.longestEventStartMs) / 2;
      group.displayOpportunityMs = midpointMs;
      group.displayOpportunityLinks = fixedScenarioGroupAt(
        group.indices,
        new Date(midpointMs),
        minimumDistanceKm,
        maximumDistanceKm,
        samePlaneOnly,
        raanToleranceDegrees,
      );
      if (!group.displayOpportunityLinks) {
        group.displayOpportunityMs = group.longestEventStartMs;
        group.displayOpportunityLinks = fixedScenarioGroupAt(
          group.indices,
          new Date(group.displayOpportunityMs),
          minimumDistanceKm,
          maximumDistanceKm,
          samePlaneOnly,
          raanToleranceDegrees,
        ) ?? [];
      }
    }
    renderScenarioResults({
      start,
      end,
      totalDurationMs,
      windowCount,
      windows,
      groups,
      recommendedGroups,
      minimumDistanceKm,
      maximumDistanceKm,
      analysisDays,
      satelliteCount,
      analysisDurationMs,
      samePlaneOnly,
      raanToleranceDegrees,
      durationStats: {
        one: durationStatistics(completedDurations.one),
        two: durationStatistics(completedDurations.two),
        all: durationStatistics(completedDurations.all),
      },
    });
  } catch (error) {
    console.error(error);
    elements.scenarioProgressLabel.textContent = "Analysis failed";
    elements.scenarioAnswer.textContent = "The analysis could not be completed. Reload the satellite data and try again.";
    elements.scenarioResults.hidden = false;
  } finally {
    elements.scenarioRun.disabled = false;
    elements.scenarioAnalysisDays.disabled = false;
    elements.scenarioSatelliteCount.disabled = false;
    elements.scenarioMinimumDistance.disabled = false;
    elements.scenarioMaximumDistance.disabled = false;
    elements.scenarioSamePlaneOnly.disabled = false;
    elements.scenarioRaanTolerance.disabled = !elements.scenarioSamePlaneOnly.checked;
    elements.scenarioRun.textContent = "Run again with current settings";
  }
}

function updatePositions() {
  const now = currentSimulationDate();
  updateSimulationClock(now);
  for (const item of trackedSatellites) {
    item.position = calculatePosition(item, now);
    if (!item.position) {
      removeFootprintLayers(item);
      item.accessLineHalo?.remove();
      item.accessLineHalo = null;
      item.accessLine?.remove();
      item.accessLine = null;
      continue;
    }

    const latLng = [item.position.latitude, item.position.longitude];
    const highlighted = selectedIds.includes(item.id) || visualizedRecommendationIds.includes(item.id);
    if (!item.marker) {
      item.marker = L.marker(latLng, {
        icon: markerIcon(item, highlighted),
        title: item.label,
        riseOnHover: true,
      }).addTo(map);
      item.marker.on("click", () => toggleSelection(item.id));
    } else {
      item.marker.setLatLng(latLng);
      item.marker.setIcon(markerIcon(item, highlighted));
    }

    updateFootprintLayers(item);

    const hasAccess = item.position.groundElevation >= groundStation.minimumElevation;
    if (hasAccess) {
      let satelliteLongitude = item.position.longitude;
      const longitudeDelta = satelliteLongitude - groundStation.longitude;
      if (longitudeDelta > 180) satelliteLongitude -= 360;
      if (longitudeDelta < -180) satelliteLongitude += 360;
      const primaryLinkCoordinates = [
        [groundStation.latitude, groundStation.longitude],
        [item.position.latitude, satelliteLongitude],
      ];
      const linkCoordinates = [-360, 0, 360].map((longitudeOffset) =>
        primaryLinkCoordinates.map(([latitude, longitude]) => [latitude, longitude + longitudeOffset])
      );

      if (!item.accessLine) {
        item.accessLineHalo = L.polyline(linkCoordinates, {
          className: "access-link-halo",
          color: "#73e6a2",
          weight: 7,
          opacity: 0.7,
          interactive: false,
        }).addTo(map);
        item.accessLine = L.polyline(linkCoordinates, {
          className: "access-link",
          color: "#050505",
          weight: 3.5,
          opacity: 1,
          interactive: false,
        }).addTo(map);
      } else {
        item.accessLineHalo.setLatLngs(linkCoordinates);
        item.accessLine.setLatLngs(linkCoordinates);
      }
      item.accessLineHalo.bringToFront();
      item.accessLine.bringToFront();
    } else {
      item.accessLineHalo?.remove();
      item.accessLineHalo = null;
      item.accessLine?.remove();
      item.accessLine = null;
    }
  }
  globeController?.update(trackedSatellites, {
    selectedIds,
    highlightedIds: visualizedRecommendationIds,
    groundTracksVisible,
  });
  updateRecommendationCrosslinks();
  if (Date.now() - lastAccessPanelRenderMs >= 1000) updateAccessPanel(now);
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

function formatLaunchDate(value) {
  if (!value) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function updateEphemerisEpochDisplay(satellites) {
  const epochs = satellites
    .map((item) => new Date(item.omm.EPOCH))
    .filter((date) => Number.isFinite(date.getTime()))
    .sort((first, second) => first - second);
  if (!epochs.length) {
    elements.ephemerisEpoch.textContent = "Element epoch unavailable";
    return;
  }
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
  elements.ephemerisEpoch.textContent = epochs[0].getTime() === epochs.at(-1).getTime()
    ? `Element epoch: ${formatter.format(epochs[0])}`
    : `Element epochs: ${formatter.format(epochs[0])} – ${formatter.format(epochs.at(-1))}`;
}

function updateSatelliteSummary() {
  const positions = trackedSatellites.map((item) => item.position).filter(Boolean);
  const altitudes = positions.map((position) => position.altitude);
  const inclinations = trackedSatellites
    .map((item) => Number(item.omm.INCLINATION))
    .filter(Number.isFinite);
  const raanValues = trackedSatellites
    .map((item) => Number(item.omm.RA_OF_ASC_NODE))
    .filter(Number.isFinite);
  const launchGroups = new Map();

  for (const item of trackedSatellites) {
    const launchDate = item.catalog?.LAUNCH_DATE || "Unknown";
    launchGroups.set(launchDate, (launchGroups.get(launchDate) || 0) + 1);
  }

  elements.summaryLaunchCount.textContent = String(launchGroups.size);
  elements.summaryAltitude.textContent = altitudes.length
    ? `${Math.round(Math.min(...altitudes))}–${Math.round(Math.max(...altitudes))} km`
    : "Unavailable";
  elements.summaryInclination.textContent = inclinations.length
    ? `${Math.min(...inclinations).toFixed(2)}–${Math.max(...inclinations).toFixed(2)}°`
    : "Unavailable";
  elements.summaryRaan.textContent = raanValues.length
    ? `${Math.min(...raanValues).toFixed(2)}–${Math.max(...raanValues).toFixed(2)}°`
    : "Unavailable";
  elements.launchBreakdown.replaceChildren(
    ...[...launchGroups.entries()]
      .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
      .map(([date, count]) => {
        const chip = document.createElement("span");
        chip.className = "launch-chip";
        chip.textContent = `${count} launched ${formatLaunchDate(date)}`;
        return chip;
      })
  );
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
  const inclination = Number(primary.omm.INCLINATION);
  elements.inclination.textContent = Number.isFinite(inclination) ? `${inclination.toFixed(2)}°` : "—";
  const raan = Number(primary.omm.RA_OF_ASC_NODE);
  elements.raan.textContent = Number.isFinite(raan) ? `${raan.toFixed(2)}°` : "—";
  elements.launchDate.textContent = primary.catalog?.LAUNCH_DATE || "Unavailable";
  elements.dataAge.textContent = `NORAD ${primary.id} · Elements ${ageDescription(primary.omm.EPOCH)}`;

  if (selected.length === 2 && selected.every((item) => item.position)) {
    const [first, second] = selected;
    const delta = {
      x: first.position.eci.x - second.position.eci.x,
      y: first.position.eci.y - second.position.eci.y,
      z: first.position.eci.z - second.position.eci.z,
    };
    const distance = Math.hypot(delta.x, delta.y, delta.z);
    const earthClear = hasEarthLineOfSight(first.position.eci, second.position.eci);
    elements.separationLabel.textContent = `${first.label} ↔ ${second.label}`;
    elements.separationDistance.textContent = `${distance.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
    elements.separationVisibility.textContent = earthClear
      ? "Earth-clear line of sight"
      : "Line of sight occluded by Earth";
    elements.separationVisibility.className = `separation-visibility ${earthClear ? "clear" : "occluded"}`;
    separationLine = L.polyline(
      wrappedPairCoordinates(first.position, second.position),
      {
        className: "live-separation-line",
        color: earthClear ? "#111111" : "#d7263d",
        weight: earthClear ? 3 : 4,
        dashArray: earthClear ? "6 7" : "3 7",
        opacity: 0.95,
      }
    ).addTo(map);
  }
}

async function loadSatellites() {
  clearInterval(updateTimer);
  clearInterval(groundTrackTimer);
  clearRecommendationVisualization(false);
  globeController?.clear();
  for (const item of trackedSatellites) {
    item.marker?.remove();
    removeFootprintLayers(item);
    item.accessLineHalo?.remove();
    item.accessLine?.remove();
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
      trackPoints: [],
      footprintLayers: [],
      accessLineHalo: null,
      accessLine: null,
      nextAccess: null,
    }));
    elements.loadedNoradOptions.replaceChildren(...trackedSatellites.map((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.label = item.label;
      return option;
    }));

    updatePositions();
    updateEphemerisEpochDisplay(trackedSatellites);
    updateSatelliteSummary();
    updateGroundTracks();
    updateAccessWindows();
    elements.scenarioRun.disabled = trackedSatellites.length < 3;
    updateTimer = setInterval(updatePositions, 250);
    groundTrackTimer = setInterval(() => {
      updateGroundTracks();
      updateAccessWindows();
    }, 10_000);
    const missingCount = payload.missing?.length ?? 0;
    const suffix = missingCount ? ` · ${missingCount} unavailable` : "";
    setStatus(`${trackedSatellites.length} satellites · updated ${new Date(payload.generatedAt).toLocaleString()}${suffix}`);
  } catch (error) {
    console.error(error);
    setStatus("Satellite data is not ready. Run the updater or GitHub Action.", true);
  }
}

elements.refreshButton.addEventListener("click", loadSatellites);
elements.scenarioButton.addEventListener("click", () => {
  showAppTab("analysis");
});
elements.scenarioClose.addEventListener("click", () => {
  showAppTab("map");
});
elements.analysisToolButtons.forEach((button) => button.addEventListener("click", () => {
  setAnalysisTool(button.dataset.analysisTool);
}));
elements.accessAnalysisMapSelect.addEventListener("click", () => {
  setAccessAnalysisMapMode(!accessAnalysisMapMode);
});
elements.accessAnalysisLatitude.addEventListener("input", () => {
  const latitude = Number(elements.accessAnalysisLatitude.value);
  if (Number.isFinite(latitude) && latitude >= -90 && latitude <= 90) {
    setAccessAnalysisStation(latitude, accessAnalysisStation.longitude);
  }
});
elements.accessAnalysisLongitude.addEventListener("input", () => {
  const longitude = Number(elements.accessAnalysisLongitude.value);
  if (Number.isFinite(longitude) && longitude >= -180 && longitude <= 180) {
    setAccessAnalysisStation(accessAnalysisStation.latitude, longitude);
  }
});
elements.accessAnalysisElevation.addEventListener("input", () => {
  const minimumElevation = Number(elements.accessAnalysisElevation.value);
  if (Number.isFinite(minimumElevation) && minimumElevation >= 0 && minimumElevation <= 90) {
    setAccessAnalysisStation(accessAnalysisStation.latitude, accessAnalysisStation.longitude, minimumElevation);
  }
});
elements.accessAnalysisStationReset.addEventListener("click", () => {
  setAccessAnalysisMapMode(false);
  setAccessAnalysisStation(groundStation.latitude, groundStation.longitude, groundStation.minimumElevation, true);
});
elements.accessAnalysisNorad.addEventListener("input", invalidateAccessAnalysisResults);
elements.accessAnalysisStartDate.addEventListener("input", invalidateAccessAnalysisResults);
elements.accessAnalysisMinDuration.addEventListener("input", applyAccessAnalysisFilters);
elements.accessAnalysisMinPeakElevation.addEventListener("input", applyAccessAnalysisFilters);
elements.accessAnalysisRun.addEventListener("click", runSevenDayAccessAnalysis);
map.on("click", (event) => {
  if (document.body.dataset.appTab !== "analysis" || activeAnalysisTool !== "access" || !accessAnalysisMapMode) return;
  setAccessAnalysisMapMode(false);
  setAccessAnalysisStation(event.latlng.lat, event.latlng.lng, accessAnalysisStation.minimumElevation, true);
});
elements.learningButton.addEventListener("click", () => showAppTab("learning"));
elements.learningClose.addEventListener("click", () => showAppTab("map"));
elements.mapButton.addEventListener("click", () => showAppTab("map"));
elements.scenarioRun.addEventListener("click", runScenarioAnalysis);
elements.scenarioAnalysisDays.addEventListener("input", invalidateScenarioResults);
elements.scenarioSatelliteCount.addEventListener("input", updateScenarioLinkCount);
elements.scenarioMinimumDistance.addEventListener("input", invalidateScenarioResults);
elements.scenarioMaximumDistance.addEventListener("input", invalidateScenarioResults);
elements.scenarioSamePlaneOnly.addEventListener("change", () => {
  elements.scenarioRaanTolerance.disabled = !elements.scenarioSamePlaneOnly.checked;
  invalidateScenarioResults();
});
elements.scenarioRaanTolerance.addEventListener("input", invalidateScenarioResults);
elements.recommendationMapClear.addEventListener("click", returnToRealTime);
elements.summaryToggle.addEventListener("click", () => {
  const expanded = elements.summaryToggle.getAttribute("aria-expanded") !== "true";
  setPanelExpanded(elements.summaryToggle, elements.satelliteSummary, expanded, "summary-expanded");
});
elements.accessToggle.addEventListener("click", () => {
  const expanded = elements.accessToggle.getAttribute("aria-expanded") !== "true";
  setPanelExpanded(elements.accessToggle, elements.accessList, expanded);
});
elements.speedSelect.addEventListener("change", (event) => {
  setSimulationSpeed(Number(event.target.value));
});
elements.view2d.addEventListener("click", () => setViewMode("2d"));
elements.view3d.addEventListener("click", () => setViewMode("3d"));
elements.groundTrackToggle.addEventListener("change", (event) => {
  setGroundTrackVisibility(event.target.checked);
});
elements.footprintToggle.addEventListener("change", (event) => {
  footprintsVisible = event.target.checked;
  localStorage.setItem("footprintsVisible", String(footprintsVisible));
  refreshFootprints();
});
elements.footprintDiameter.addEventListener("input", (event) => {
  const diameter = Number(event.target.value);
  if (!Number.isFinite(diameter) || diameter < 1 || diameter > 20_000) return;
  footprintDiameterKm = diameter;
  localStorage.setItem("footprintDiameterKm", String(footprintDiameterKm));
  refreshFootprints();
});
elements.clearSelection.addEventListener("click", () => {
  selectedIds = [];
  updatePositions();
});

globeController = initializeGlobeView(elements.globe, { onSelect: toggleSelection, groundStation });
learningLabController = initializeLearningLab(learningElements, { map, leaflet: L });
syncAccessAnalysisStationInputs();
elements.accessAnalysisStartDate.value = formatLocalDateInput(new Date());
setAnalysisTool("access");
applyViewMode();

loadSatellites();
