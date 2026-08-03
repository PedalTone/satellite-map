# Satellite Map Ideas

This file is a working notebook for possible improvements. Items here are ideas, not committed requirements.

## Next

- Add a searchable, collapsible satellite list for selecting overlapping markers.
- Add a toggle to show or hide satellite labels.
- Add an option to show ground paths only for selected satellites.
- Add a button to return the simulation clock to the current time.

## Visualization

- Add a 3D globe view while retaining the existing 2D map.
- Evaluate an alternative basemap whose place labels are consistently displayed in English.
- Show orbital planes and relative plane spacing.
- Add true-scale and exaggerated-altitude modes.
- Color satellites by launch group, altitude band, or orbital plane.
- Add optional recent-history trails in addition to predicted paths.

## Analysis

- Show nearest-neighbor distance for each satellite.
- Highlight the closest satellite pair in the loaded set.
- Add configurable separation thresholds and visual alerts.
- Compare altitude, inclination, and RAAN by launch group.
- Show constellation spread statistics over simulated time.
- Add a ground-site tool for entering a latitude and longitude.
- Calculate satellite revisit times for a specified ground site.
- Show access windows, time between visits, and maximum revisit gap.
- Allow a configurable minimum elevation angle for ground-site visibility.

## Build a Satellite

- Add a custom satellite builder using the six classical orbital elements.
- Accept semi-major axis, eccentricity, inclination, RAAN, argument of perigee, and anomaly at epoch.
- Let the user specify the orbital epoch and choose mean anomaly or true anomaly.
- Validate element ranges and clearly label units.
- Display the custom satellite and its predicted ground path alongside loaded satellites.
- Allow multiple experimental satellites for comparing orbit designs.
- Make custom satellites temporary by default, with an option to save their definitions locally.

## Controls

- Add pause and resume controls for simulated time.
- Consider reverse-time playback.
- Add a custom simulation-speed input.
- Add a date-and-time picker for viewing a specific epoch.

## Data

- Show when orbital elements are stale.
- Add optional launch site and object-type metadata.
- Export current satellite positions and separations as CSV.
- Preserve named satellite groups in separate list files.

## Questions

- Should labels be visible for every satellite or only selected satellites?
- Should separation alerts use straight-line distance, surface distance, or both?
- Should ground paths show the next orbit, a fixed time window, or a selectable duration?
- Would a selected-satellite comparison table be more useful than additional map overlays?
- Which English-label map provider has acceptable licensing and mobile performance?
- For custom satellites, should altitude or orbital period be accepted as an easier alternative to semi-major axis?
- Should revisit calculations use a simple point target or an adjustable coverage radius around the ground site?
