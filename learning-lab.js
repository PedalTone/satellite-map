const EARTH_RADIUS_KM = 6378.137;
const EARTH_MU_KM3_S2 = 398600.4418;
const EARTH_ROTATION_RAD_S = 7.2921159e-5;
const STATION = { latitude: 64.2, longitude: -152.5, minimumElevation: 10 };
const BASELINE = { altitude: 550, inclination: 53, raan: 0 };

const radians = (degrees) => degrees * Math.PI / 180;
const degrees = (angle) => angle * 180 / Math.PI;

function orbitPeriodSeconds(altitude) {
  return 2 * Math.PI * Math.sqrt((EARTH_RADIUS_KM + altitude) ** 3 / EARTH_MU_KM3_S2);
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
  const latitude = radians(STATION.latitude);
  const longitude = radians(STATION.longitude);
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
    const visible = elevationDegrees(positionAt(config, elapsed)) >= STATION.minimumElevation;
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

function formatDuration(seconds) {
  if (seconds === null) return "No repeat pass";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h ${remainder}m`;
}

function groundTrackSegments(config) {
  const duration = orbitPeriodSeconds(config.altitude) * 2;
  const points = [];
  for (let index = 0; index <= 240; index += 1) {
    const point = geodetic(positionAt(config, duration * index / 240));
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

export function initializeLearningLab(elements) {
  const controls = [elements.altitude, elements.inclination, elements.raan, elements.days];

  function render() {
    const config = {
      altitude: Number(elements.altitude.value),
      inclination: Number(elements.inclination.value),
      raan: Number(elements.raan.value),
    };
    const days = Math.max(1, Math.min(30, Number(elements.days.value) || 7));
    elements.altitudeValue.textContent = `${config.altitude} km`;
    elements.inclinationValue.textContent = `${config.inclination}°`;
    elements.raanValue.textContent = `${config.raan}°`;

    const baselineAccess = accessMetrics(BASELINE, days);
    const modifiedAccess = accessMetrics(config, days);
    const baselinePeriod = orbitPeriodSeconds(BASELINE.altitude);
    const modifiedPeriod = orbitPeriodSeconds(config.altitude);
    const baselineFootprint = coverageDiameter(BASELINE.altitude);
    const modifiedFootprint = coverageDiameter(config.altitude);

    const grid = Array.from({ length: 11 }, (_, index) => {
      const horizontal = index < 5;
      const coordinate = horizontal ? 40 + index * 60 : (index - 5) * 120;
      return horizontal
        ? `<line x1="0" y1="${coordinate}" x2="720" y2="${coordinate}" />`
        : `<line x1="${coordinate}" y1="0" x2="${coordinate}" y2="320" />`;
    }).join("");
    const stationX = ((STATION.longitude + 180) / 360) * 720;
    const stationY = ((90 - STATION.latitude) / 180) * 320;
    const paths = [
      ...groundTrackSegments(BASELINE).map((segment) => `<path class="baseline-track" d="${svgPath(segment)}" />`),
      ...groundTrackSegments(config).map((segment) => `<path class="modified-track" d="${svgPath(segment)}" />`),
    ].join("");
    elements.groundTrack.innerHTML = `<g class="track-grid">${grid}</g><line class="equator" x1="0" y1="160" x2="720" y2="160" />${paths}<circle class="learning-station" cx="${stationX}" cy="${stationY}" r="6" /><text x="${stationX + 10}" y="${stationY - 8}">Central Alaska</text>`;

    elements.metrics.replaceChildren(
      metricCard("Orbital period", formatDuration(baselinePeriod), formatDuration(modifiedPeriod)),
      metricCard("Horizon footprint", `${Math.round(baselineFootprint).toLocaleString()} km`, `${Math.round(modifiedFootprint).toLocaleString()} km`),
      metricCard(`Passes in ${days}d`, baselineAccess.passes, modifiedAccess.passes),
      metricCard("Average pass", formatDuration(baselineAccess.averagePassSeconds), formatDuration(modifiedAccess.averagePassSeconds)),
      metricCard("Average revisit", formatDuration(baselineAccess.averageRevisitSeconds), formatDuration(modifiedAccess.averageRevisitSeconds)),
      metricCard("Longest gap", formatDuration(baselineAccess.longestGapSeconds), formatDuration(modifiedAccess.longestGapSeconds)),
    );

    const changes = [];
    if (config.altitude !== BASELINE.altitude) changes.push(`Altitude changes orbit size, period, viewing footprint, and time above the elevation mask.`);
    if (config.inclination !== BASELINE.inclination) changes.push(`Inclination changes latitude reach. Central Alaska is at ${STATION.latitude}° N, so low-inclination orbits may never rise above the 10° mask.`);
    if (config.raan !== BASELINE.raan) changes.push("RAAN rotates the orbital plane around Earth. It shifts pass timing and ground-track longitude without changing orbital period.");
    if (!changes.length) changes.push("The modified orbit currently matches the baseline. Move one control and watch which outcomes change.");
    elements.explanation.replaceChildren(...changes.map((text) => Object.assign(document.createElement("p"), { textContent: text })));

    const passDifference = modifiedAccess.passes - baselineAccess.passes;
    elements.insight.textContent = passDifference === 0
      ? `At these settings, pass count is unchanged over ${days} days—but timing, duration, or ground-track placement may still differ.`
      : `This orbit produces ${Math.abs(passDifference)} ${passDifference > 0 ? "more" : "fewer"} Central Alaska passes than the baseline over ${days} days.`;
  }

  controls.forEach((control) => control.addEventListener("input", render));
  render();
}
