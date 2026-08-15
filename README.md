# Personal Satellite Map

A mobile-friendly live map for a personal list of satellites. The site reads current OMM orbital elements from CelesTrak, propagates positions in the browser with SGP4, and deploys as a static GitHub Pages site.

## Choose a satellite set

Every visit begins with a satellite-set chooser rather than loading the owner-managed list automatically. Visitors can load the current published set or a packaged preset for space essentials, human spaceflight, Earth observation, the operational GPS constellation, or a readable 25-satellite Starlink sample. A progress bar stays visible while the selected orbital records, map positions, ground tracks, and access calculations are prepared.

Preset data lives in `data/presets/` and is rebuilt by `scripts/build_preset_data.py`. The scheduled refresh workflow updates the current published set and every preset before deployment. If a preset refresh temporarily fails, the last packaged version is preserved.

The chooser also accepts a custom list of up to 100 NORAD catalog IDs separated by spaces, commas, or new lines. Custom lists open a prefilled GitHub issue for owner authorization because CelesTrak does not allow the static site to request arbitrary records directly. The `Load satellite NORAD IDs` workflow validates the list, downloads current records, replaces the published set, deploys the map, reports the result, and closes the request.

## Edit the satellite list

Edit `satellites.txt` with one satellite per line:

```text
# NORAD catalog number, label shown on the map
25544,ISS
48274,Chinese Space Station
41866,GOES-16
```

Labels are optional. Separate the number and label with a comma, tab, or spaces. Blank lines and lines beginning with `#` are ignored.

## Load a group by common name

On the Map screen, choose **Load by common name** and enter a shared name used by CelesTrak, such as `PRAETORIAN` or `STARLINK`. The app opens a prefilled GitHub issue. Requests submitted by the repository owner run immediately. Requests from anyone else remain pending until the repository owner applies the `approved` label.

The owner-controlled `Load satellite group` workflow then:

1. Queries CelesTrak once for matching current GP/OMM records and once for matching SATCAT metadata.
2. Keeps active payloads and creates numeric display labels from their names. `STARLINK` uses CelesTrak's optimized group feed and loads a stable 25-satellite sample; other searches returning more than 100 satellites are rejected.
3. Replaces `satellites.txt` and `data/satellite-data.json`.
4. Pushes the result, deploys GitHub Pages, comments on the request, and closes it.

This GitHub bridge is required because CelesTrak does not allow the static GitHub Pages app to read its name-query response directly across origins. Use a specific name rather than a very broad constellation name.

## First-time GitHub setup

Create an empty GitHub repository, then run these commands from this folder:

```sh
git init
git add .
git commit -m "Create personal satellite map"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/YOUR-REPO.git
git push -u origin main
```

In the repository's GitHub settings, open **Pages**, set **Source** to **GitHub Actions**, and run the **Update satellite data and deploy** workflow if it has not started automatically. The deployment URL appears in the workflow summary.

## Install automatic syncing on the Mac

After the first push succeeds, run:

```sh
./scripts/install_autosync.sh
```

The installer adds a macOS LaunchAgent that watches `satellites.txt`. Each save creates a small Git commit and pushes it to `main`. Any owner push that changes `satellites.txt` triggers a fresh CelesTrak download and GitHub Pages deployment.

Review sync activity at:

```sh
tail -f ~/Library/Logs/satellite-map-sync.log
```

Remove the background watcher with:

```sh
./scripts/uninstall_autosync.sh
```

## Test locally

Fetch current satellite data:

```sh
python3 scripts/update_satellite_data.py
```

Serve the site from the project directory:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Opening `index.html` directly will not work because browsers block local `fetch` requests.

## Data behavior

- The deployed workflow refreshes orbital data after owner list changes and every six hours.
- The entry screen waits for the visitor to choose a packaged satellite set and shows staged loading progress before revealing the map.
- A main-screen common-name loader can replace the set through an owner-only GitHub request without exposing credentials in the public website.
- The webpage recalculates current positions continuously without repeatedly contacting CelesTrak.
- Simulation speeds of real time, 10×, 50×, and 100× make orbital motion easier to compare.
- A central-Alaska ground station shows current and upcoming access using a 10° minimum elevation mask.
- Summary and ground-access panels start minimized and expand on demand.
- Active access is emphasized with black satellite dots, green halos, and solid black station-link lines.
- Each satellite displays its predicted ground track for approximately the next complete orbit.
- The ground-path switch remembers its setting on each device.
- Satellite details include orbital inclination, RAAN, and the SATCAT launch date.
- The status card summarizes launch groups plus current altitude, inclination, and RAAN spreads.
- Failed downloads reuse previously generated data when available.
- Selecting two satellites displays their straight-line separation in Earth-centered inertial space.
- Two-satellite comparisons use a WGS-84 oblate Earth model to label whether Earth occludes the line of sight and color occluded map links red.
- Optional satellite coverage footprints use a user-defined ground diameter in kilometres and follow each satellite's subsatellite point.
- The Map view can switch between the existing 2D projection and a CesiumJS WGS-84 3D globe. The globe renders satellites at true altitude, projected ground paths, the Central Alaska station, live access lines, and a simulation-time-driven day/night terminator while sharing simulation time and satellite selection with the 2D map. Dedicated − / + controls provide reliable zoom when browser or trackpad pinch gestures are unavailable.
- Orbital Learning Lab includes a beta-angle lesson that connects season and orbit-plane orientation to annual beta variation, altitude-dependent eclipse thresholds, and sunlight versus Earth-shadow time per orbit.
- Analysis Lab includes a seven-day ground-access tool for any satellite in the loaded set. The user can enter a station latitude/longitude or select the station on the map, choose any start date (including a historical date) and minimum elevation, and receive rise/set times, duration, maximum elevation, peak range, and summary gap metrics. Duration and maximum-elevation filters update without rerunning propagation, and access tables are shown in both Zulu and the ground station's coordinate-derived IANA time zone.
- Scenario Lab performs a user-selected 1–60 day geometric feasibility scan for connected groups of three to six satellites with simultaneous Central Alaska access and a configurable inter-satellite distance range; the default horizon is seven days.
- Changing either distance bound invalidates the previous analysis so recommendations always correspond to the displayed settings.
- An optional same-plane filter excludes links whose satellites differ by more than a user-selected RAAN tolerance.
- Scenario results use two-minute sampling, account for Earth blocking inter-satellite links, and report union duration, opportunity windows, and totals by satellite group.
- Scenario Lab compares combination-window duration statistics for one, two, or all selected satellites having simultaneous ground access and identifies the groups reaching each tier.
- Scenario Lab recommends a fixed satellite combination using transparent priorities: total qualifying connectivity, average/minimum/maximum connectivity-window duration, time with multiple simultaneous ground links, and covered days.
- Each qualifying group is represented by a minimum spanning tree containing exactly one fewer inter-satellite link than satellites; every displayed link must satisfy the selected distance, RAAN, and WGS-84 Earth-clear constraints.
- Recommendation cards rank groups by total accumulated qualifying duration, identify each group's longest continuous opportunity, and jump the live map to the midpoint of that window for visual verification.
- Scenario map jumps pause the simulation at the selected historical/future epoch so positions, tracks, access, and crosslinks remain synchronized; **Return to real time** restores the live clock and current positions.
- CelesTrak data is for visualization and is not appropriate for safety-critical operations.

## Third-party services

- Orbital elements: [CelesTrak](https://celestrak.org/)
- Code and UI pushes deploy immediately using the checked-in satellite dataset; CelesTrak refreshes run separately every six hours or on manual request, then commit and deploy the refreshed data.
- The map displays the loaded orbital-element epoch range and links to the manual **Request / Update Ephemeris** GitHub Actions workflow.
- Map tiles: [OpenStreetMap](https://www.openstreetmap.org/)
- SGP4 propagation: [satellite.js](https://github.com/shashwatak/satellite-js)
- Map rendering: [Leaflet](https://leafletjs.com/)
