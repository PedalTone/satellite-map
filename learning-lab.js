const EARTH_RADIUS_KM = 6378.137;
const EARTH_MU_KM3_S2 = 398600.4418;
const EARTH_ROTATION_RAD_S = 7.2921159e-5;
const DEFAULT_STATION = { latitude: 64.2, longitude: -152.5, minimumElevation: 10 };
let currentStation = { ...DEFAULT_STATION };
const LESSONS = {
  1: {
    label: "Interactive lesson 01",
    title: "Orbit size, tilt, and plane",
    intro: "Change one input at a time and compare the modified orbit with the gray baseline.",
    prediction: "What do you expect this change to do to pass duration and revisit over the ground station?",
    metricsTitle: "Modified orbit compared with baseline",
    baseline: { altitude: 10000, inclination: 53, raan: 0 },
    days: 1,
  },
  2: {
    label: "Interactive lesson 02",
    title: "Why revisit changes",
    intro: "Follow four successive orbits and see how Earth’s rotation moves each ground track westward.",
    prediction: "Will this orbit return over the ground station on the next revolution, or will Earth rotate it away?",
    metricsTitle: "Ground-track drift and revisit",
    baseline: { altitude: 1000, inclination: 70, raan: 0 },
    days: 3,
  },
  3: {
    label: "Interactive lesson 03",
    title: "Beta angle and sunlight",
    intro: "Why can the same orbit move from deep eclipse seasons to continuous sunlight? Choose a season, then rotate the orbit plane.",
    prediction: "Before changing the date or RAAN: will a higher beta angle produce more eclipse time or less?",
    metricsTitle: "Seasonal solar illumination",
    baseline: { altitude: 550, inclination: 53, raan: 0 },
    days: 1,
    date: "2026-03-20",
  },
};

const radians = (degrees) => degrees * Math.PI / 180;
const degrees = (angle) => angle * 180 / Math.PI;

function orbitPeriodSeconds(altitude) {
  return 2 * Math.PI * Math.sqrt((EARTH_RADIUS_KM + altitude) ** 3 / EARTH_MU_KM3_S2);
}

function groundTrackShiftDegrees(altitude) {
  return degrees(EARTH_ROTATION_RAD_S * orbitPeriodSeconds(altitude));
}

function orbitsPerDay(altitude) {
  return 86400 / orbitPeriodSeconds(altitude);
}

function positionAt(config, elapsedSeconds) {
  const radius = EARTH_RADIUS_KM + config.altitude;
  const meanMotion = Math.sqrt(EARTH_MU_KM3_S2 / radius ** 3);
  const argument = meanMotion * elapsedSeconds;
  const inclination = radians(config.inclination);
  const raan = radians(config.raan);
  const orbitalX = radius * Math.cos(argument);
  const orbitalY = radius * Math.sin(argument);
  const inclinedY = orbitalY * Math.cos(inclination);
  const z = orbitalY * Math.sin(inclination);
  const eciX = orbitalX * Math.cos(raan) - inclinedY * Math.sin(raan);
  const eciY = orbitalX * Math.sin(raan) + inclinedY * Math.cos(raan);
  const earthAngle = EARTH_ROTATION_RAD_S * elapsedSeconds;
  const x = eciX * Math.cos(earthAngle) + eciY * Math.sin(earthAngle);
  const y = -eciX * Math.sin(earthAngle) + eciY * Math.cos(earthAngle);
  return { x, y, z };
}

function geodetic(position) {
  const radius = Math.hypot(position.x, position.y, position.z);
  return {
    latitude: degrees(Math.asin(position.z / radius)),
    longitude: degrees(Math.atan2(position.y, position.x)),
  };
}

function elevationDegrees(position) {
  const latitude = radians(currentStation.latitude);
  const longitude = radians(currentStation.longitude);
  const stationUnit = {
    x: Math.cos(latitude) * Math.cos(longitude),
    y: Math.cos(latitude) * Math.sin(longitude),
    z: Math.sin(latitude),
  };
  const station = {
    x: EARTH_RADIUS_KM * stationUnit.x,
    y: EARTH_RADIUS_KM * stationUnit.y,
    z: EARTH_RADIUS_KM * stationUnit.z,
  };
  const line = { x: position.x - station.x, y: position.y - station.y, z: position.z - station.z };
  const range = Math.hypot(line.x, line.y, line.z);
  return degrees(Math.asin((line.x * stationUnit.x + line.y * stationUnit.y + line.z * stationUnit.z) / range));
}

function accessMetrics(config, days) {
  const stepSeconds = 60;
  const durationSeconds = days * 86400;
  const windows = [];
  let start = null;
  for (let elapsed = 0; elapsed <= durationSeconds; elapsed += stepSeconds) {
    const visible = elevationDegrees(positionAt(config, elapsed)) >= currentStation.minimumElevation;
    if (visible && start === null) start = elapsed;
    if (!visible && start !== null) {
      windows.push({ start, end: elapsed });
      start = null;
    }
  }
  if (start !== null) windows.push({ start, end: durationSeconds });
  const durations = windows.map((window) => window.end - window.start);
  const revisits = windows.slice(1).map((window, index) => window.start - windows[index].end);
  const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  return {
    passes: windows.length,
    totalSeconds: durations.reduce((sum, value) => sum + value, 0),
    averagePassSeconds: average(durations),
    averageRevisitSeconds: average(revisits),
    longestGapSeconds: revisits.length ? Math.max(...revisits) : null,
  };
}

function coverageDiameter(altitude, minimumElevation = 0) {
  const elevation = radians(minimumElevation);
  const centralAngle = Math.acos((EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altitude)) * Math.cos(elevation)) - elevation;
  return 2 * EARTH_RADIUS_KM * centralAngle;
}

function accessReachDegrees(altitude, minimumElevation) {
  const elevation = radians(minimumElevation);
  return degrees(Math.acos((EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altitude)) * Math.cos(elevation)) - elevation);
}

function formatDuration(seconds) {
  if (seconds === null) return "No repeat pass";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h ${remainder}m`;
}

function formatMinutes(seconds) {
  return `${(seconds / 60).toFixed(1)} min`;
}

function orbitRegime(altitude) {
  if (altitude < 2000) return "LEO";
  if (altitude < 35000) return "MEO";
  return "GEO altitude";
}

function dayOfYear(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86400000);
}

function sunVector(date) {
  const daysSinceJ2000 = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000;
  const meanLongitude = radians((280.460 + 0.9856474 * daysSinceJ2000) % 360);
  const meanAnomaly = radians((357.528 + 0.9856003 * daysSinceJ2000) % 360);
  const eclipticLongitude = meanLongitude + radians(1.915) * Math.sin(meanAnomaly) + radians(0.020) * Math.sin(2 * meanAnomaly);
  const obliquity = radians(23.439 - 0.0000004 * daysSinceJ2000);
  return {
    x: Math.cos(eclipticLongitude),
    y: Math.cos(obliquity) * Math.sin(eclipticLongitude),
    z: Math.sin(obliquity) * Math.sin(eclipticLongitude),
  };
}

function orbitNormal(config) {
  const inclination = radians(config.inclination);
  const raan = radians(config.raan);
  return {
    x: Math.sin(inclination) * Math.sin(raan),
    y: -Math.sin(inclination) * Math.cos(raan),
    z: Math.cos(inclination),
  };
}

function betaAngleDegrees(config, date) {
  const sun = sunVector(date);
  const normal = orbitNormal(config);
  return degrees(Math.asin(Math.max(-1, Math.min(1, sun.x * normal.x + sun.y * normal.y + sun.z * normal.z))));
}

function eclipseGeometry(config, date) {
  const beta = betaAngleDegrees(config, date);
  const radius = EARTH_RADIUS_KM + config.altitude;
  const criticalBeta = degrees(Math.asin(EARTH_RADIUS_KM / radius));
  const periodSeconds = orbitPeriodSeconds(config.altitude);
  if (Math.abs(beta) >= criticalBeta) {
    return { beta, criticalBeta, eclipseSeconds: 0, sunlightSeconds: periodSeconds, sunlightFraction: 1 };
  }
  const eclipseHalfAngle = Math.acos(Math.sqrt(radius ** 2 - EARTH_RADIUS_KM ** 2) / (radius * Math.cos(radians(beta))));
  const eclipseFraction = eclipseHalfAngle / Math.PI;
  return {
    beta,
    criticalBeta,
    eclipseSeconds: periodSeconds * eclipseFraction,
    sunlightSeconds: periodSeconds * (1 - eclipseFraction),
    sunlightFraction: 1 - eclipseFraction,
  };
}

function seasonLabel(date) {
  return new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric" }).format(date);
}

function betaSeasonChart(config, selectedDate) {
  const year = selectedDate.getUTCFullYear();
  const samples = Array.from({ length: 365 }, (_, index) => {
    const date = new Date(Date.UTC(year, 0, index + 1, 12));
    return { beta: betaAngleDegrees(config, date), date };
  });
  const criticalBeta = eclipseGeometry(config, selectedDate).criticalBeta;
  const maxAbs = Math.min(90, Math.max(20, criticalBeta + 5, ...samples.map((sample) => Math.abs(sample.beta) + 5)));
  const x = (index) => 42 + index / 364 * 650;
  const y = (beta) => 88 - beta / maxAbs * 68;
  const path = samples.map((sample, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(sample.beta).toFixed(1)}`).join(" ");
  const selectedIndex = Math.max(0, Math.min(364, dayOfYear(selectedDate) - 1));
  const selected = samples[selectedIndex];
  const criticalY = y(Math.min(criticalBeta, maxAbs));
  const negativeCriticalY = y(-Math.min(criticalBeta, maxAbs));
  return `<rect class="beta-eclipse-band" x="42" y="${criticalY.toFixed(1)}" width="650" height="${(negativeCriticalY - criticalY).toFixed(1)}" />
    <line class="beta-axis" x1="42" y1="88" x2="692" y2="88" />
    <path class="beta-season-line" d="${path}" />
    <line class="beta-date-line" x1="${x(selectedIndex).toFixed(1)}" y1="16" x2="${x(selectedIndex).toFixed(1)}" y2="156" />
    <circle class="beta-date-point" cx="${x(selectedIndex).toFixed(1)}" cy="${y(selected.beta).toFixed(1)}" r="6" />
    <text x="8" y="25">+β</text><text x="15" y="94">0°</text><text x="8" y="158">−β</text>
    <text x="42" y="174">Jan</text><text x="352" y="174">Jul</text><text x="665" y="174">Dec</text>`;
}

function groundTrackSegments(config, duration = orbitPeriodSeconds(config.altitude) * 2) {
  const orbitCount = Math.max(1, duration / orbitPeriodSeconds(config.altitude));
  const pointCount = Math.min(12_000, Math.max(240, Math.ceil(orbitCount * (orbitCount > 100 ? 24 : 48))));
  const points = [];
  for (let index = 0; index <= pointCount; index += 1) {
    const point = geodetic(positionAt(config, duration * index / pointCount));
    points.push(point);
  }
  const segments = [[]];
  for (const point of points) {
    const segment = segments.at(-1);
    if (segment.length && Math.abs(point.longitude - segment.at(-1).longitude) > 180) segments.push([]);
    segments.at(-1).push(point);
  }
  return segments.filter((segment) => segment.length > 1);
}

function svgPath(segment) {
  return segment.map((point, index) => {
    const x = ((point.longitude + 180) / 360) * 720;
    const y = ((90 - point.latitude) / 180) * 320;
    return `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function metricCard(label, baseline, modified) {
  const card = document.createElement("div");
  card.innerHTML = `<span>${label}</span><strong>${modified}</strong><small>Baseline ${baseline}</small>`;
  return card;
}

export function initializeLearningLab(elements, { map, leaflet }) {
  const controls = [elements.inclination, elements.raan, elements.days, elements.seasonDate, elements.footprints];
  const overlayGroup = leaflet.layerGroup();
  let active = false;
  let activeLesson = 1;
  let currentConfig = { ...LESSONS[activeLesson].baseline };
  let currentDays = 1;
  let animationStartMs = Date.now();
  let animationTimer;
  let stationMoveMode = false;

  function wrappedSegments(segments) {
    return segments.flatMap((segment) => [-360, 0, 360].map((offset) =>
      segment.map((point) => [point.latitude, point.longitude + offset])
    ));
  }

  function markerIcon(label, className) {
    return leaflet.divIcon({
      className: "learning-map-marker",
      html: `<span class="learning-map-dot ${className}"></span><strong>${label}</strong>`,
      iconSize: [100, 28],
      iconAnchor: [8, 8],
    });
  }

  function orbitNumberIcon(number) {
    return leaflet.divIcon({
      className: "learning-orbit-number",
      html: `<span>${number}</span>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
  }

  let baselineMarker;
  let modifiedMarker;
  let baselineFootprint;
  let modifiedFootprint;
  let learningStationMarker;

  function stationLabel() {
    const isAlaska = Math.abs(currentStation.latitude - DEFAULT_STATION.latitude) < 0.05
      && Math.abs(currentStation.longitude - DEFAULT_STATION.longitude) < 0.05;
    return isAlaska ? "Central Alaska" : "Custom station";
  }

  function syncStationControls() {
    elements.stationLatitude.value = currentStation.latitude.toFixed(1);
    elements.stationLongitude.value = currentStation.longitude.toFixed(1);
    elements.stationElevation.value = String(currentStation.minimumElevation);
  }

  function setStation(latitude, longitude, minimumElevation = currentStation.minimumElevation) {
    currentStation = {
      latitude: Math.max(-90, Math.min(90, latitude)),
      longitude: ((longitude + 540) % 360) - 180,
      minimumElevation: Math.max(0, Math.min(90, minimumElevation)),
    };
    syncStationControls();
    render();
  }

  function setStationMoveMode(enabled) {
    stationMoveMode = enabled;
    elements.stationMove.classList.toggle("active", enabled);
    elements.stationMove.textContent = enabled ? "Tap map or drag marker" : "Move on map";
    map.getContainer().classList.toggle("learning-station-move-active", enabled);
    if (learningStationMarker?.dragging) {
      if (enabled) learningStationMarker.dragging.enable();
      else learningStationMarker.dragging.disable();
    }
  }

  function updateAnimatedPositions() {
    if (!active || !baselineMarker || !modifiedMarker) return;
    const elapsedSeconds = (Date.now() - animationStartMs) / 1000;
    const baselinePoint = geodetic(positionAt(LESSONS[activeLesson].baseline, elapsedSeconds));
    const modifiedPoint = geodetic(positionAt(currentConfig, elapsedSeconds));
    baselineMarker.setLatLng([baselinePoint.latitude, baselinePoint.longitude]);
    modifiedMarker.setLatLng([modifiedPoint.latitude, modifiedPoint.longitude]);
    baselineFootprint?.setLatLng([baselinePoint.latitude, baselinePoint.longitude]);
    modifiedFootprint?.setLatLng([modifiedPoint.latitude, modifiedPoint.longitude]);
  }

  function renderMapOverlays() {
    overlayGroup.clearLayers();
    const baseline = LESSONS[activeLesson].baseline;
    const displayDurationSeconds = activeLesson === 2
      ? Math.min(currentDays * 86400, orbitPeriodSeconds(currentConfig.altitude) * 4)
      : activeLesson === 3
        ? orbitPeriodSeconds(currentConfig.altitude)
      : currentDays * 86400;
    wrappedSegments(groundTrackSegments(currentConfig, displayDurationSeconds)).forEach((segment) => {
      leaflet.polyline(segment, { className: "learning-modified-map-track-halo", color: "#ffffff", weight: 7, opacity: 0.85, interactive: false }).addTo(overlayGroup);
      leaflet.polyline(segment, { className: "learning-modified-map-track", color: "#111827", weight: 4, opacity: 1, interactive: false }).addTo(overlayGroup);
    });
    const baselineDisplaySeconds = activeLesson === 2 || activeLesson === 3 ? orbitPeriodSeconds(baseline.altitude) : 86400;
    wrappedSegments(groundTrackSegments(baseline, baselineDisplaySeconds)).forEach((segment) => {
      leaflet.polyline(segment, { className: "learning-baseline-map-track", color: "#8fa3bf", weight: 5, opacity: 1, dashArray: "9 8", interactive: false }).addTo(overlayGroup);
    });
    if (activeLesson === 2) {
      const period = orbitPeriodSeconds(currentConfig.altitude);
      for (let orbitIndex = 0; orbitIndex < 4; orbitIndex += 1) {
        const crossing = geodetic(positionAt(currentConfig, period * orbitIndex));
        [-360, 0, 360].forEach((offset) => {
          leaflet.marker([crossing.latitude, crossing.longitude + offset], {
            icon: orbitNumberIcon(orbitIndex + 1),
            interactive: false,
            keyboard: false,
          }).addTo(overlayGroup);
        });
      }
    }
    baselineFootprint = null;
    modifiedFootprint = null;
    if (elements.footprints.checked) {
      baselineFootprint = leaflet.circle([0, 0], { className: "learning-baseline-footprint", radius: coverageDiameter(baseline.altitude) * 500, color: "#9caac0", weight: 1, dashArray: "5 6", fillOpacity: 0.025, interactive: false }).addTo(overlayGroup);
      modifiedFootprint = leaflet.circle([0, 0], { className: "learning-modified-footprint", radius: coverageDiameter(currentConfig.altitude) * 500, color: "#66e0ff", weight: 2, dashArray: "6 7", fillOpacity: 0.055, interactive: false }).addTo(overlayGroup);
    }
    learningStationMarker = null;
    if (activeLesson !== 3) {
      learningStationMarker = leaflet.marker([currentStation.latitude, currentStation.longitude], {
        draggable: stationMoveMode,
        icon: leaflet.divIcon({ className: "learning-station-marker", html: "<span></span>", iconSize: [22, 22], iconAnchor: [11, 11] }),
      }).addTo(overlayGroup).bindTooltip(`${stationLabel()} · ${currentStation.latitude.toFixed(1)}°, ${currentStation.longitude.toFixed(1)}° · ≥${currentStation.minimumElevation}°`, {
        permanent: true,
        direction: "right",
        className: "learning-station-tooltip",
        offset: [10, 0],
      });
      learningStationMarker.on("dragend", (event) => {
        const point = event.target.getLatLng();
        setStationMoveMode(false);
        setStation(point.lat, point.lng);
      });
    }
    baselineMarker = leaflet.marker([0, 0], { icon: markerIcon("Baseline", "baseline"), interactive: false }).addTo(overlayGroup);
    modifiedMarker = leaflet.marker([0, 0], { icon: markerIcon("Modified", "modified"), interactive: false }).addTo(overlayGroup);
    updateAnimatedPositions();
  }

  function render() {
    const lesson = LESSONS[activeLesson];
    const baseline = lesson.baseline;
    const config = {
      altitude: Number(elements.altitude.value),
      inclination: Number(elements.inclination.value),
      raan: Number(elements.raan.value),
    };
    currentConfig = config;
    const days = Math.max(1, Math.min(30, Number(elements.days.value) || 1));
    currentDays = days;
    elements.lessonButtons.forEach((button) => {
      const selected = Number(button.dataset.learningLesson) === activeLesson;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    document.body.dataset.learningLesson = String(activeLesson);
    elements.lessonLabel.textContent = lesson.label;
    elements.title.textContent = lesson.title;
    elements.cardIntro.textContent = lesson.intro;
    elements.prediction.textContent = lesson.prediction;
    elements.metricsTitle.textContent = lesson.metricsTitle;
    const betaLesson = activeLesson === 3;
    elements.daysControl.hidden = betaLesson;
    elements.seasonControl.hidden = !betaLesson;
    elements.footprintsControl.hidden = betaLesson;
    elements.stationControls.hidden = betaLesson;
    elements.betaVisual.hidden = !betaLesson;
    elements.altitudeValue.textContent = `${config.altitude.toLocaleString()} km · ${orbitRegime(config.altitude)}`;
    elements.altitude.setAttribute("aria-label", `Altitude ${config.altitude} km`);
    elements.inclinationValue.textContent = `${config.inclination}°`;
    elements.raanValue.textContent = `${config.raan}°`;
    elements.periodNote.textContent = activeLesson === 2
      ? `The numbered circles mark the same ascending-orbit phase on four successive revolutions. Access metrics cover ${days} ${days === 1 ? "day" : "days"}.`
      : betaLesson
        ? "Beta is the angle between the Sun direction and the orbital plane. Altitude does not directly set beta; it changes how large beta must be before Earth no longer eclipses the spacecraft."
      : `The gray baseline path shows 1 day. The modified path and both access metrics cover ${days} ${days === 1 ? "day" : "days"}${config.altitude >= 35000 ? "; near GEO, each sidereal day retraces the same ground-path shape" : ""}.`;

    const baselineAccess = accessMetrics(baseline, days);
    const modifiedAccess = accessMetrics(config, days);
    const baselinePeriod = orbitPeriodSeconds(baseline.altitude);
    const modifiedPeriod = orbitPeriodSeconds(config.altitude);
    const baselineFootprint = coverageDiameter(baseline.altitude);
    const modifiedFootprint = coverageDiameter(config.altitude);
    const modifiedLatitudeLimit = Math.min(config.inclination, 180 - config.inclination);
    const accessReach = accessReachDegrees(config.altitude, currentStation.minimumElevation);
    const visibilityLatitudeLimit = Math.min(90, modifiedLatitudeLimit + accessReach);

    const grid = Array.from({ length: 11 }, (_, index) => {
      const horizontal = index < 5;
      const coordinate = horizontal ? 40 + index * 60 : (index - 5) * 120;
      return horizontal
        ? `<line x1="0" y1="${coordinate}" x2="720" y2="${coordinate}" />`
        : `<line x1="${coordinate}" y1="0" x2="${coordinate}" y2="320" />`;
    }).join("");
    const stationX = ((currentStation.longitude + 180) / 360) * 720;
    const stationY = ((90 - currentStation.latitude) / 180) * 320;
    const paths = [
      ...groundTrackSegments(baseline).map((segment) => `<path class="baseline-track" d="${svgPath(segment)}" />`),
      ...groundTrackSegments(config, activeLesson === 2 ? modifiedPeriod * 4 : modifiedPeriod * 2).map((segment) => `<path class="modified-track" d="${svgPath(segment)}" />`),
    ].join("");
    elements.groundTrack.innerHTML = `<g class="track-grid">${grid}</g><line class="equator" x1="0" y1="160" x2="720" y2="160" />${paths}<circle class="learning-station" cx="${stationX}" cy="${stationY}" r="6" /><text x="${stationX + 10}" y="${stationY - 8}">${stationLabel()}</text>`;

    const selectedDate = new Date(`${elements.seasonDate.value || lesson.date}T12:00:00Z`);
    const baselineIllumination = eclipseGeometry(baseline, selectedDate);
    const modifiedIllumination = eclipseGeometry(config, selectedDate);
    const metricCards = activeLesson === 2
      ? [
        metricCard("Orbital period", formatMinutes(baselinePeriod), formatMinutes(modifiedPeriod)),
        metricCard("Orbits per day", orbitsPerDay(baseline.altitude).toFixed(2), orbitsPerDay(config.altitude).toFixed(2)),
        metricCard("Westward shift / orbit", `${groundTrackShiftDegrees(baseline.altitude).toFixed(1)}°`, `${groundTrackShiftDegrees(config.altitude).toFixed(1)}°`),
        metricCard(`Station passes in ${days}d`, baselineAccess.passes, modifiedAccess.passes),
        metricCard("Average revisit", formatDuration(baselineAccess.averageRevisitSeconds), formatDuration(modifiedAccess.averageRevisitSeconds)),
        metricCard("Longest gap", formatDuration(baselineAccess.longestGapSeconds), formatDuration(modifiedAccess.longestGapSeconds)),
        metricCard("Average pass", formatDuration(baselineAccess.averagePassSeconds), formatDuration(modifiedAccess.averagePassSeconds)),
      ]
      : betaLesson
        ? [
          metricCard("Beta angle", `${baselineIllumination.beta.toFixed(1)}°`, `${modifiedIllumination.beta.toFixed(1)}°`),
          metricCard("Eclipse-free above |β|", `${baselineIllumination.criticalBeta.toFixed(1)}°`, `${modifiedIllumination.criticalBeta.toFixed(1)}°`),
          metricCard("Sunlit per orbit", formatDuration(baselineIllumination.sunlightSeconds), formatDuration(modifiedIllumination.sunlightSeconds)),
          metricCard("Earth shadow per orbit", formatDuration(baselineIllumination.eclipseSeconds), formatDuration(modifiedIllumination.eclipseSeconds)),
          metricCard("Orbit in sunlight", `${(baselineIllumination.sunlightFraction * 100).toFixed(1)}%`, `${(modifiedIllumination.sunlightFraction * 100).toFixed(1)}%`),
          metricCard("Orbital period", formatMinutes(baselinePeriod), formatMinutes(modifiedPeriod)),
          metricCard("Selected season", seasonLabel(new Date(`${lesson.date}T12:00:00Z`)), seasonLabel(selectedDate)),
        ]
      : [
        metricCard("Orbital period", formatMinutes(baselinePeriod), formatMinutes(modifiedPeriod)),
        metricCard("Horizon footprint (0°)", `${Math.round(baselineFootprint).toLocaleString()} km`, `${Math.round(modifiedFootprint).toLocaleString()} km`),
        metricCard(`Passes in ${days}d`, baselineAccess.passes, modifiedAccess.passes),
        metricCard("Total access", formatDuration(baselineAccess.totalSeconds), formatDuration(modifiedAccess.totalSeconds)),
        metricCard("Average pass", formatDuration(baselineAccess.averagePassSeconds), formatDuration(modifiedAccess.averagePassSeconds)),
        metricCard("Average revisit", formatDuration(baselineAccess.averageRevisitSeconds), formatDuration(modifiedAccess.averageRevisitSeconds)),
        metricCard("Longest gap", formatDuration(baselineAccess.longestGapSeconds), formatDuration(modifiedAccess.longestGapSeconds)),
      ];
    elements.metrics.replaceChildren(...metricCards);

    if (betaLesson) {
      elements.betaSeasonChart.innerHTML = betaSeasonChart(config, selectedDate);
      const sunlightPercent = modifiedIllumination.sunlightFraction * 100;
      const eclipsePercent = 100 - sunlightPercent;
      elements.sunlightBar.innerHTML = `<span class="sunlit" style="width:${sunlightPercent}%">${sunlightPercent >= 18 ? `${sunlightPercent.toFixed(1)}% sunlit` : ""}</span><span class="eclipse" style="width:${eclipsePercent}%">${eclipsePercent >= 18 ? `${eclipsePercent.toFixed(1)}% shadow` : ""}</span>`;
      elements.betaVisualNote.textContent = modifiedIllumination.eclipseSeconds === 0
        ? `At ${seasonLabel(selectedDate)}, |β| is above the ${modifiedIllumination.criticalBeta.toFixed(1)}° eclipse-free threshold, so this circular-orbit approximation stays illuminated all orbit.`
        : `At ${seasonLabel(selectedDate)}, Earth blocks the Sun for about ${formatDuration(modifiedIllumination.eclipseSeconds)} of each ${formatMinutes(modifiedPeriod)} orbit.`;
    }

    const changes = [];
    if (betaLesson) {
      changes.push(`Beta is ${modifiedIllumination.beta.toFixed(1)}° on ${seasonLabel(selectedDate)}. Its sign tells which side of the orbit plane the Sun is on; eclipse duration depends on |beta|.`);
      changes.push(`Low |beta| places the Sun close to the orbit plane, so the spacecraft passes behind Earth and needs battery energy during eclipse. High |beta| shortens eclipse and can eliminate it, increasing continuous solar input but often creating a steadier, warmer thermal environment.`);
      changes.push(`Season and orbit-plane orientation set beta. Changing RAAN rotates the plane relative to the seasonal Sun direction. Altitude changes the critical angle from ${baselineIllumination.criticalBeta.toFixed(1)}° at the baseline to ${modifiedIllumination.criticalBeta.toFixed(1)}° here; it does not directly determine beta.`);
      changes.push("This teaching model keeps the orbital plane fixed. Real beta histories also depend on nodal precession, especially J2-driven precession and whether an orbit is Sun-synchronous.");
    } else if (activeLesson === 2) {
      const shift = groundTrackShiftDegrees(config.altitude);
      changes.push(`One orbit takes ${formatMinutes(modifiedPeriod)}. During that time Earth rotates ${shift.toFixed(1)}° east, so the next same-phase ground track appears about ${shift.toFixed(1)}° farther west.`);
      changes.push(`Altitude changes orbital period and therefore the spacing between successive numbered crossings. RAAN slides the entire pattern east or west but does not change that spacing in this two-body model.`);
      changes.push(`Revisit occurs only when a later ground track passes within the satellite’s ${currentStation.minimumElevation}° access region around the station. Inclination controls whether those tracks can reach the station’s latitude at all.`);
    } else {
      if (config.altitude !== baseline.altitude) changes.push("Altitude changes orbit size, period, viewing footprint, and time above the elevation mask.");
      if (config.inclination !== baseline.inclination) changes.push(`Inclination limits the subsatellite latitude to about ±${modifiedLatitudeLimit.toFixed(1)}°. At ${config.altitude.toLocaleString()} km, the ${currentStation.minimumElevation}° elevation mask extends visibility about ${accessReach.toFixed(1)}° beyond that ground track, giving a best-case visibility limit near ±${visibilityLatitudeLimit.toFixed(1)}° latitude. The station is at ${currentStation.latitude.toFixed(1)}°.`);
      if (config.raan !== baseline.raan) changes.push("RAAN rotates the orbital plane around Earth. It shifts pass timing and ground-track longitude without changing orbital period.");
      if (config.altitude >= 35000) changes.push("A circular orbit near 35,786 km is geosynchronous. It is geostationary only when inclination is 0° and the orbit is equatorial.");
      if (!changes.length) changes.push("The modified orbit currently matches the baseline. Move one control and watch which outcomes change.");
    }
    elements.explanation.replaceChildren(...changes.map((text) => Object.assign(document.createElement("p"), { textContent: text })));

    const passDifference = modifiedAccess.passes - baselineAccess.passes;
    if (betaLesson) {
      const betaType = Math.abs(modifiedIllumination.beta) < 15 ? "low-beta" : Math.abs(modifiedIllumination.beta) >= modifiedIllumination.criticalBeta ? "eclipse-free high-beta" : "higher-beta";
      const article = betaType.startsWith("eclipse") ? "an" : "a";
      elements.insight.textContent = `This is ${article} ${betaType} case: β = ${modifiedIllumination.beta.toFixed(1)}°. The spacecraft is sunlit for ${(modifiedIllumination.sunlightFraction * 100).toFixed(1)}% of each orbit and spends ${formatDuration(modifiedIllumination.eclipseSeconds)} in Earth’s shadow.`;
    } else if (activeLesson === 2) {
      elements.insight.textContent = modifiedAccess.passes === 0
        ? `The four ground tracks drift west, but none produces ${stationLabel()} access during the selected ${days}-day analysis period.`
        : `Successive same-phase tracks shift ${groundTrackShiftDegrees(config.altitude).toFixed(1)}° west. ${stationLabel()} receives ${modifiedAccess.passes} passes with an average revisit of ${formatDuration(modifiedAccess.averageRevisitSeconds)}.`;
    } else {
      elements.insight.textContent = modifiedAccess.passes === 0
        ? `No ${stationLabel()} access occurs for the modified orbit during this ${days}-day period. The baseline has ${baselineAccess.passes} ${baselineAccess.passes === 1 ? "pass" : "passes"}.`
        : passDifference === 0
          ? `At these settings, pass count is unchanged over ${days} days—but timing, duration, or ground-track placement may still differ.`
          : `This orbit produces ${Math.abs(passDifference)} ${passDifference > 0 ? "more" : "fewer"} ${stationLabel()} passes than the baseline over ${days} days.`;
    }
    if (active) renderMapOverlays();
  }

  elements.altitude.addEventListener("input", () => {
    elements.altitudeNumber.value = elements.altitude.value;
    render();
  });
  elements.altitudeNumber.addEventListener("input", () => {
    const altitude = Number(elements.altitudeNumber.value);
    if (!Number.isFinite(altitude) || altitude < 200 || altitude > 36000) return;
    elements.altitude.value = String(altitude);
    render();
  });
  function resetLessonControls() {
    const lesson = LESSONS[activeLesson];
    elements.altitude.value = String(lesson.baseline.altitude);
    elements.altitudeNumber.value = String(lesson.baseline.altitude);
    elements.inclination.value = String(lesson.baseline.inclination);
    elements.raan.value = String(lesson.baseline.raan);
    elements.days.value = String(lesson.days);
    if (lesson.date) elements.seasonDate.value = lesson.date;
    elements.footprints.checked = false;
  }
  elements.lessonButtons.forEach((button) => button.addEventListener("click", () => {
    activeLesson = Number(button.dataset.learningLesson);
    resetLessonControls();
    animationStartMs = Date.now();
    render();
  }));
  elements.reset.addEventListener("click", () => {
    resetLessonControls();
    render();
  });
  elements.stationMove.addEventListener("click", () => setStationMoveMode(!stationMoveMode));
  elements.stationLatitude.addEventListener("input", () => {
    const latitude = Number(elements.stationLatitude.value);
    if (Number.isFinite(latitude) && latitude >= -90 && latitude <= 90) setStation(latitude, currentStation.longitude);
  });
  elements.stationLongitude.addEventListener("input", () => {
    const longitude = Number(elements.stationLongitude.value);
    if (Number.isFinite(longitude) && longitude >= -180 && longitude <= 180) setStation(currentStation.latitude, longitude);
  });
  elements.stationElevation.addEventListener("input", () => {
    const elevation = Number(elements.stationElevation.value);
    if (Number.isFinite(elevation) && elevation >= 0 && elevation <= 90) setStation(currentStation.latitude, currentStation.longitude, elevation);
  });
  elements.stationReset.addEventListener("click", () => {
    setStationMoveMode(false);
    setStation(DEFAULT_STATION.latitude, DEFAULT_STATION.longitude, DEFAULT_STATION.minimumElevation);
  });
  map.on("click", (event) => {
    if (!active || !stationMoveMode) return;
    setStationMoveMode(false);
    setStation(event.latlng.lat, event.latlng.lng);
  });
  controls.forEach((control) => control.addEventListener("input", render));
  syncStationControls();
  render();
  return {
    setActive(nextActive) {
      if (active === nextActive) return;
      active = nextActive;
      if (active) {
        overlayGroup.addTo(map);
        animationStartMs = Date.now();
        renderMapOverlays();
        map.setView([25, -80], 2);
        animationTimer = window.setInterval(updateAnimatedPositions, 250);
      } else {
        setStationMoveMode(false);
        overlayGroup.remove();
        window.clearInterval(animationTimer);
      }
    },
  };
}
