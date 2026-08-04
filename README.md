# Personal Satellite Map

A mobile-friendly live map for a personal list of satellites. The site reads current OMM orbital elements from CelesTrak, propagates positions in the browser with SGP4, and deploys as a static GitHub Pages site.

## Edit the satellite list

Edit `satellites.txt` with one satellite per line:

```text
# NORAD catalog number, label shown on the map
25544,ISS
48274,Chinese Space Station
41866,GOES-16
```

Labels are optional. Separate the number and label with a comma, tab, or spaces. Blank lines and lines beginning with `#` are ignored.

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

The installer adds a macOS LaunchAgent that watches `satellites.txt`. Each save creates a small Git commit and pushes it to `main`. That push triggers a fresh CelesTrak download and GitHub Pages deployment.

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

- The deployed workflow refreshes orbital data after list changes and every six hours.
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
- Scenario Lab performs a 30-day geometric feasibility scan for mutually connected three-satellite groups under 5,500 km with simultaneous Central Alaska access.
- Scenario results use two-minute sampling, account for Earth blocking inter-satellite links, and report union duration, opportunity windows, and totals by satellite group.
- Scenario Lab compares combination-window duration statistics for one, two, or all three satellites having simultaneous ground access and identifies the groups reaching each tier.
- Scenario Lab recommends a fixed three-satellite combination using transparent priorities: total qualifying coverage, maximum outage gap, covered days, and time with multiple simultaneous ground links.
- CelesTrak data is for visualization and is not appropriate for safety-critical operations.

## Third-party services

- Orbital elements: [CelesTrak](https://celestrak.org/)
- Map tiles: [OpenStreetMap](https://www.openstreetmap.org/)
- SGP4 propagation: [satellite.js](https://github.com/shashwatak/satellite-js)
- Map rendering: [Leaflet](https://leafletjs.com/)
