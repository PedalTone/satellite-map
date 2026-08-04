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
  altitude: document.querySelector("#detail-altitude"),
  speed: document.querySelector("#detail-speed"),
  latitude: document.querySelector("#detail-latitude"),
  longitude: document.querySelector("#detail-longitude"),
  inclination: document.querySelector("#detail-inclination"),
  raan: document.querySelector("#detail-raan"),
  launchDate: document.querySelector("#detail-launch-date"),
  dataAge: document.querySelector("#data-age"),
  refreshButton: document.querySelector("#refresh-button"),
  clearSelection: document.querySelector("#clear-selection"),
  groundTrackToggle: document.querySelector("#ground-track-toggle"),
  speedSelect: document.querySelector("#speed-select"),
  simulationTime: document.querySelector("#simulation-time"),
  accessList: document.querySelector("#access-list"),
  accessToggle: document.querySelector("#access-toggle"),
  scenarioButton: document.querySelector("#scenario-button"),
  scenarioPanel: document.querySelector("#scenario-panel"),
  scenarioClose: document.querySelector("#scenario-close"),
  scenarioRun: document.querySelector("#scenario-run"),
  scenarioAnalysisDays: document.querySelector("#scenario-analysis-days"),
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
};

let trackedSatellites = [];
let selectedIds = [];
let updateTimer;
let groundTrackTimer;
let separationLine;
let groundTracksVisible = localStorage.getItem("groundTracksVisible") !== "false";
let simulationSpeed = 1;
let simulationTimeMs = Date.now();
let lastClockUpdateMs = Date.now();
let lastAccessPanelRenderMs = 0;
let visualizedRecommendationIds = [];
let recommendationCrosslinkLayers = [];
const trackColors = ["#66e0ff", "#ff7a90", "#a98bff", "#73e6a2", "#ffad5c", "#f3e56b"];
const earthRadiusKm = 6378.137;
const scenarioStepMs = 2 * 60_000;

elements.groundTrackToggle.checked = groundTracksVisible;

function currentSimulationDate() {
  const nowMs = Date.now();
  simulationTimeMs += (nowMs - lastClockUpdateMs) * simulationSpeed;
  lastClockUpdateMs = nowMs;
  return new Date(simulationTimeMs);
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
  elements.recommendationMapBanner.hidden = true;
  if (update) updatePositions();
}

function updateRecommendationCrosslinks() {
  if (visualizedRecommendationIds.length !== 3) return;
  const items = visualizedRecommendationIds
    .map((id) => trackedSatellites.find((item) => item.id === id))
    .filter((item) => item?.position);
  if (items.length !== 3) return;
  const pairs = [[0, 1], [0, 2], [1, 2]];

  pairs.forEach(([firstIndex, secondIndex], pairIndex) => {
    const coordinates = wrappedPairCoordinates(items[firstIndex].position, items[secondIndex].position);
    let layers = recommendationCrosslinkLayers[pairIndex];
    if (!layers) {
      layers = {
        halo: L.polyline(coordinates, {
          color: "#050505",
          weight: 7,
          opacity: 0.8,
          interactive: false,
        }).addTo(map),
        line: L.polyline(coordinates, {
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
  simulationSpeed = 1;
  elements.speedSelect.value = "1";
  simulationTimeMs = group.firstOpportunityMs;
  lastClockUpdateMs = Date.now();
  elements.scenarioPanel.hidden = true;
  elements.recommendationMapLabel.textContent = group.indices
    .map((index) => trackedSatellites[index].label)
    .join(" · ");
  elements.recommendationMapTime.textContent = new Date(group.firstOpportunityMs).toLocaleString();
  elements.recommendationMapTime.dateTime = new Date(group.firstOpportunityMs).toISOString();
  elements.recommendationMapBanner.hidden = false;
  updatePositions();
  updateGroundTracks();
  updateAccessWindows(new Date(group.firstOpportunityMs));
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

    item.trackLayers = splitAtDateLine(points).map((segment) => {
      const layer = L.polyline(segment, {
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

function hasEarthClearLink(firstPosition, secondPosition, minimumDistanceKm, maximumDistanceKm) {
  const delta = {
    x: secondPosition.x - firstPosition.x,
    y: secondPosition.y - firstPosition.y,
    z: secondPosition.z - firstPosition.z,
  };
  const distanceSquared = delta.x ** 2 + delta.y ** 2 + delta.z ** 2;
  if (
    distanceSquared <= minimumDistanceKm ** 2
    || distanceSquared >= maximumDistanceKm ** 2
  ) return false;

  const projection = -(
    firstPosition.x * delta.x
    + firstPosition.y * delta.y
    + firstPosition.z * delta.z
  ) / distanceSquared;
  const segmentFraction = Math.max(0, Math.min(1, projection));
  const closestPoint = {
    x: firstPosition.x + segmentFraction * delta.x,
    y: firstPosition.y + segmentFraction * delta.y,
    z: firstPosition.z + segmentFraction * delta.z,
  };
  return Math.hypot(closestPoint.x, closestPoint.y, closestPoint.z) > earthRadiusKm;
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
        links[first][second] = Math.hypot(
          positions[first].eci.x - positions[second].eci.x,
          positions[first].eci.y - positions[second].eci.y,
          positions[first].eci.z - positions[second].eci.z
        );
      }
    }
  }

  const groups = new Map();
  for (let first = 0; first < satelliteCount; first += 1) {
    for (let second = first + 1; second < satelliteCount; second += 1) {
      if (!links[first][second]) continue;
      for (let third = second + 1; third < satelliteCount; third += 1) {
        if (
          links[first][third]
          && links[second][third]
        ) {
          const groundAccessCount = Number(positions[first].groundAccess)
            + Number(positions[second].groundAccess)
            + Number(positions[third].groundAccess);
          if (groundAccessCount > 0) {
            groups.set(`${first},${second},${third}`, {
              groundAccessCount,
              pairDistances: [links[first][second], links[first][third], links[second][third]],
            });
          }
        }
      }
    }
  }
  return groups;
}

function durationStatistics(durations) {
  if (!durations.length) return { minimum: 0, maximum: 0, average: 0, count: 0 };
  return {
    minimum: Math.min(...durations),
    maximum: Math.max(...durations),
    average: durations.reduce((sum, duration) => sum + duration, 0) / durations.length,
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
  const firstOpportunity = document.createElement("p");
  firstOpportunity.textContent = `First qualifying opportunity: ${new Date(group.firstOpportunityMs).toLocaleString()}`;
  evidence.append(firstOpportunity);
  const pairIndices = [[0, 1], [0, 2], [1, 2]];
  for (let pairIndex = 0; pairIndex < pairIndices.length; pairIndex += 1) {
    const [first, second] = pairIndices[pairIndex];
    const pair = document.createElement("span");
    const minimum = group.pairMinimumDistances[pairIndex].toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    const maximum = group.pairMaximumDistances[pairIndex].toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    pair.textContent = `${trackedSatellites[group.indices[first]].label}–${trackedSatellites[group.indices[second]].label}: ${minimum}–${maximum} km`;
    evidence.append(pair);
  }
  viewButton.className = "recommendation-map-button";
  viewButton.type = "button";
  viewButton.textContent = "View first opportunity on map";
  viewButton.addEventListener("click", () => visualizeRecommendation(group));
  card.append(rank, heading, metrics, durations, evidence, viewButton);
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
      `It produces ${group.eventCount.toLocaleString()} distinct qualifying connectivity windows over ${group.analysisDays} days—about ${windowsPerDay.toFixed(1)} per day across the three-satellite group. This is not a single-satellite ground-station revisit rate.`,
      `Each qualifying connectivity window lasts ${formatScenarioDuration(group.averageEventDurationMs)} on average.`,
      `It produces at least one qualifying opportunity on ${group.coveredDayCount} of ${group.analysisDays} analysis days.`,
      `Two or more satellites have simultaneous ground access for ${formatScenarioDuration(group.twoGroundDurationMs)}, about ${multiGroundPercent}% of its connected time.`,
      `Every counted window keeps all three pair links inside the selected distance range${group.samePlaneOnly ? ` and within ${group.raanToleranceDegrees}° RAAN` : ""}, with Earth-clear line of sight.`,
    ]) {
      const item = document.createElement("li");
      item.textContent = reason;
      reasons.append(item);
    }
    executive.append(introduction, reasons);
    card.insertBefore(executive, durations);
  }
  return card;
}

function renderScenarioResults(result) {
  const percent = (100 * result.totalDurationMs) / result.analysisDurationMs;
  elements.scenarioAnswer.textContent = result.totalDurationMs
    ? `Yes. At least one qualifying three-satellite connection exists for approximately ${formatScenarioDuration(result.totalDurationMs)} during the next ${result.analysisDays} days.`
    : `No qualifying three-satellite connection was found during the next ${result.analysisDays} days at this resolution.`;
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
    createDurationTier("All 3 ground satellites", result.durationStats.three)
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
  const tripleGroundGroups = result.groups.filter((group) => group.threeGroundDurationMs > 0);
  elements.scenarioMultiSummary.textContent = `Groups with 2+ satellites in ground access (${multiGroundGroups.length.toLocaleString()})`;
  elements.scenarioMultiList.replaceChildren(...createScenarioGroupRows(multiGroundGroups, "twoGroundDurationMs", "twoGroundEventCount"));
  elements.scenarioTripleSummary.textContent = `Groups with all 3 satellites in ground access (${tripleGroundGroups.length.toLocaleString()})`;
  elements.scenarioTripleList.replaceChildren(...createScenarioGroupRows(tripleGroundGroups, "threeGroundDurationMs", "threeGroundEventCount"));
  elements.scenarioGroupList.replaceChildren(...createScenarioGroupRows(result.groups));
  elements.scenarioResults.hidden = false;
}

async function runScenarioAnalysis() {
  if (trackedSatellites.length < 3) return;
  const analysisDays = Number(elements.scenarioAnalysisDays.value);
  const minimumDistanceKm = Number(elements.scenarioMinimumDistance.value);
  const maximumDistanceKm = Number(elements.scenarioMaximumDistance.value);
  const samePlaneOnly = elements.scenarioSamePlaneOnly.checked;
  const raanToleranceDegrees = Number(elements.scenarioRaanTolerance.value);
  if (
    !Number.isInteger(analysisDays)
    || analysisDays < 1
    || analysisDays > 60
    || !Number.isFinite(minimumDistanceKm)
    || !Number.isFinite(maximumDistanceKm)
    || minimumDistanceKm < 0
    || maximumDistanceKm <= minimumDistanceKm
    || (samePlaneOnly && (!Number.isFinite(raanToleranceDegrees) || raanToleranceDegrees < 0 || raanToleranceDegrees > 180))
  ) {
    elements.scenarioRangeError.textContent = "Enter 1–60 whole analysis days, valid distance bounds, and a RAAN tolerance from 0° to 180°.";
    elements.scenarioRangeError.hidden = false;
    return;
  }
  elements.scenarioRangeError.hidden = true;
  elements.scenarioRun.disabled = true;
  elements.scenarioAnalysisDays.disabled = true;
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
  let previousThreeGroundGroups = new Set();
  const activeRuns = {
    one: new Map(),
    two: new Map(),
    three: new Map(),
  };
  const completedDurations = {
    one: [],
    two: [],
    three: [],
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
        minimumDistanceKm,
        maximumDistanceKm,
        samePlaneOnly,
        raanToleranceDegrees
      );
      const currentGroups = new Set(groupAccessCounts.keys());
      const currentTwoGroundGroups = new Set(
        [...groupAccessCounts].filter(([, details]) => details.groundAccessCount >= 2).map(([key]) => key)
      );
      const currentThreeGroundGroups = new Set(
        [...groupAccessCounts].filter(([, details]) => details.groundAccessCount === 3).map(([key]) => key)
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
            firstOpportunityMs: date.getTime(),
            pairMinimumDistances: [Infinity, Infinity, Infinity],
            pairMaximumDistances: [0, 0, 0],
            twoGroundDurationMs: 0,
            twoGroundEventCount: 0,
            threeGroundDurationMs: 0,
            threeGroundEventCount: 0,
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
        groupDetails.pairDistances.forEach((distance, pairIndex) => {
          if (!(distance > minimumDistanceKm && distance < maximumDistanceKm)) {
            throw new Error(`Scenario distance invariant failed for ${key}: ${distance} km`);
          }
          stats.pairMinimumDistances[pairIndex] = Math.min(stats.pairMinimumDistances[pairIndex], distance);
          stats.pairMaximumDistances[pairIndex] = Math.max(stats.pairMaximumDistances[pairIndex], distance);
        });
        if (groundAccessCount >= 2) {
          stats.twoGroundDurationMs += scenarioStepMs;
          if (!previousTwoGroundGroups.has(key)) stats.twoGroundEventCount += 1;
        }
        if (groundAccessCount === 3) {
          stats.threeGroundDurationMs += scenarioStepMs;
          if (!previousThreeGroundGroups.has(key)) stats.threeGroundEventCount += 1;
        }
      }

      for (const key of previousGroups) {
        if (currentGroups.has(key)) continue;
        const stats = groupStats.get(key);
        const eventDurationMs = date.getTime() - stats.eventStartMs;
        stats.minimumEventDurationMs = Math.min(stats.minimumEventDurationMs, eventDurationMs);
        stats.maximumEventDurationMs = Math.max(stats.maximumEventDurationMs, eventDurationMs);
        stats.eventStartMs = null;
        stats.lastEndMs = date.getTime();
      }

      updateActiveRuns(currentGroups, activeRuns.one, date.getTime(), completedDurations.one);
      updateActiveRuns(currentTwoGroundGroups, activeRuns.two, date.getTime(), completedDurations.two);
      updateActiveRuns(currentThreeGroundGroups, activeRuns.three, date.getTime(), completedDurations.three);

      previousGroups = currentGroups;
      previousTwoGroundGroups = currentTwoGroundGroups;
      previousThreeGroundGroups = currentThreeGroundGroups;
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
    updateActiveRuns(new Set(), activeRuns.three, end.getTime(), completedDurations.three);

    for (const stats of groupStats.values()) {
      if (stats.eventStartMs !== null) {
        const eventDurationMs = end.getTime() - stats.eventStartMs;
        stats.minimumEventDurationMs = Math.min(stats.minimumEventDurationMs, eventDurationMs);
        stats.maximumEventDurationMs = Math.max(stats.maximumEventDurationMs, eventDurationMs);
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
        threeGroundDurationMs: stats.threeGroundDurationMs,
        threeGroundEventCount: stats.threeGroundEventCount,
        minimumEventDurationMs: stats.minimumEventDurationMs,
        maximumEventDurationMs: stats.maximumEventDurationMs,
        averageEventDurationMs: stats.durationMs / stats.eventCount,
        maxGapMs: stats.maxGapMs,
        coveredDayCount: stats.coveredDays.size,
        firstOpportunityMs: stats.firstOpportunityMs,
        pairMinimumDistances: stats.pairMinimumDistances,
        pairMaximumDistances: stats.pairMaximumDistances,
        analysisDays,
        samePlaneOnly,
        raanToleranceDegrees,
      }))
      .sort((first, second) => second.durationMs - first.durationMs);
    const recommendedGroups = [...groups].sort(robustnessComparator);
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
      analysisDurationMs,
      samePlaneOnly,
      raanToleranceDegrees,
      durationStats: {
        one: durationStatistics(completedDurations.one),
        two: durationStatistics(completedDurations.two),
        three: durationStatistics(completedDurations.three),
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
    elements.separationLabel.textContent = `${first.label} ↔ ${second.label}`;
    elements.separationDistance.textContent = `${distance.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
    separationLine = L.polyline([
      [first.position.latitude, first.position.longitude],
      [second.position.latitude, second.position.longitude],
    ], { color: "#111111", weight: 3, dashArray: "6 7", opacity: 0.95 }).addTo(map);
  }
}

async function loadSatellites() {
  clearInterval(updateTimer);
  clearInterval(groundTrackTimer);
  clearRecommendationVisualization(false);
  for (const item of trackedSatellites) {
    item.marker?.remove();
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
      accessLineHalo: null,
      accessLine: null,
      nextAccess: null,
    }));

    updatePositions();
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
  elements.scenarioPanel.hidden = false;
});
elements.scenarioClose.addEventListener("click", () => {
  elements.scenarioPanel.hidden = true;
});
elements.scenarioRun.addEventListener("click", runScenarioAnalysis);
elements.scenarioAnalysisDays.addEventListener("input", invalidateScenarioResults);
elements.scenarioMinimumDistance.addEventListener("input", invalidateScenarioResults);
elements.scenarioMaximumDistance.addEventListener("input", invalidateScenarioResults);
elements.scenarioSamePlaneOnly.addEventListener("change", () => {
  elements.scenarioRaanTolerance.disabled = !elements.scenarioSamePlaneOnly.checked;
  invalidateScenarioResults();
});
elements.scenarioRaanTolerance.addEventListener("input", invalidateScenarioResults);
elements.recommendationMapClear.addEventListener("click", () => clearRecommendationVisualization());
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
elements.groundTrackToggle.addEventListener("change", (event) => {
  setGroundTrackVisibility(event.target.checked);
});
elements.clearSelection.addEventListener("click", () => {
  selectedIds = [];
  updatePositions();
});

loadSatellites();
