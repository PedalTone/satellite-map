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
- Detect connected groups of at least three satellites where every satellite pair is less than 5,500 km apart.
- Calculate the continuous time windows when all satellites in each qualifying group remain mutually connected.
- Require at least one satellite in the group to have simultaneous access to the ground site during a qualifying window.
- Report each group's members, start and end times, total duration, and which satellite provides ground access.
- Compare altitude, inclination, and RAAN by launch group.
- Show constellation spread statistics over simulated time.
- Add a ground-site tool for entering a latitude and longitude.
- Calculate satellite revisit times for a specified ground site.
- Show access windows, time between visits, and maximum revisit gap.
- Allow a configurable minimum elevation angle for ground-site visibility.

## Scenario Analysis

- Define Scenario Lab as a geometric feasibility and sanity-check tool, not an operational mission-planning system.
- Present results as approximate opportunity patterns suitable for answering “is this plausible?” and comparing alternatives.
- Clearly label outputs as non-operational and avoid implying precise contact schedules or maneuver recommendations.
- Separate the application into two modes: **Live View** for current conditions and **Scenario Lab** for what-if questions.
- Let a scenario use the current satellites, a selected subset, or custom satellites from Build a Satellite.
- Let the user choose a start time, analysis duration, time step, ground sites, distance limits, and elevation masks.
- Preserve scenarios locally with a name and short description so assumptions and results can be revisited.
- Run geometry calculations over a selected time window instead of relying only on the current simulation instant.
- Support analysis horizons up to approximately one month.
- Propagate every included satellite through the analysis window and detect intervals when all scenario conditions are satisfied.
- Use a coarse time step to find candidate opportunities, then refine each boundary to produce accurate start times, end times, and durations.
- Run month-scale calculations as a background analysis with visible progress and cancellation rather than tying them to map animation.
- Record the orbital-element epoch and age used for every analysis so forecast assumptions remain traceable.
- Warn when the requested horizon extends too far beyond the available ephemeris epoch, while allowing approximate month-scale feasibility analysis to continue.
- Allow fresh ephemeris data to be loaded before rerunning a scenario, without changing the scenario's geometry rules.
- Begin with structured question templates rather than unrestricted natural-language requests.
- Add templates for mutual satellite visibility, ground access, revisit time, coverage gaps, relay feasibility, and orbital-element changes.
- Translate each question into visible assumptions and calculation rules that the user can review before running it.
- Treat an AI model as a helper for constructing scenarios and explaining results, while deterministic orbital calculations produce the answers.

## Results

- Keep the map as the spatial explanation of a result, with playback controls for moving through the analysis window.
- Add a timeline below the map showing qualifying windows, ground contacts, connectivity changes, and coverage gaps.
- Add a compact results table listing groups or events with start time, end time, duration, members, and relevant minimum or maximum values.
- Let selecting a timeline interval or table row move the map to that event and highlight the involved satellites and links.
- Show a concise answer card first, such as “possible for 8 minutes,” followed by supporting events and assumptions.
- Allow results to be filtered by minimum duration, satellite group size, ground site, or confidence in the input data.
- Add export of scenario assumptions and event results to CSV or JSON.
- Consider a comparison view for evaluating two scenarios side by side, such as different orbital elements or ground sites.
- Summarize a month of opportunities with total event count, total qualifying time, longest and shortest event, average duration, and time between events.
- Report daily and weekly opportunity rates to show whether events are evenly distributed or clustered.
- Report the maximum gap with no qualifying opportunity.
- Identify which satellites and satellite groups contribute most often to successful opportunities.
- Show a calendar or histogram view for scanning opportunity frequency across a month before opening individual events on the map.

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
- Should inter-satellite connectivity also account for Earth blocking the line of sight, rather than distance alone?
- Should ground paths show the next orbit, a fixed time window, or a selectable duration?
- Would a selected-satellite comparison table be more useful than additional map overlays?
- Which English-label map provider has acceptable licensing and mobile performance?
- For custom satellites, should altitude or orbital period be accepted as an easier alternative to semi-major axis?
- Should revisit calculations use a simple point target or an adjustable coverage radius around the ground site?
- Which three scenario templates would answer the most valuable operational or design questions first?
- Should scenario results emphasize individual events, summary statistics, or both?
- How long should the default analysis window be: one orbit, 24 hours, several days, or user-selected?
- What forecast age is acceptable before the app should warn that the ephemeris may be too stale for month-scale analysis?
- What boundary accuracy is useful for opportunity windows: one second, ten seconds, or one minute?
