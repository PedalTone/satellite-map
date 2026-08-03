#!/usr/bin/env python3
import json
import subprocess
import sys
import time
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SATELLITE_LIST = ROOT / "satellites.txt"
OUTPUT_FILE = ROOT / "data" / "satellite-data.json"
CELESTRAK_URL = "https://celestrak.org/NORAD/elements/gp.php"


def read_satellite_list():
    entries = []
    seen = set()

    for line_number, raw_line in enumerate(SATELLITE_LIST.read_text().splitlines(), start=1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue

        separator = "," if "," in line else None
        parts = [part.strip() for part in line.split(separator, maxsplit=1)]
        catalog_number = parts[0]
        if not catalog_number.isdigit():
            raise ValueError(f"Line {line_number}: NORAD number must contain only digits")
        if catalog_number in seen:
            raise ValueError(f"Line {line_number}: duplicate NORAD number {catalog_number}")

        label = parts[1] if len(parts) == 2 and parts[1] else catalog_number
        entries.append({"noradId": catalog_number, "label": label})
        seen.add(catalog_number)

    if not entries:
        raise ValueError("satellites.txt does not contain any satellites")
    return entries


def fetch_omm(catalog_number):
    query = urllib.parse.urlencode({"CATNR": catalog_number, "FORMAT": "JSON"})
    result = subprocess.run(
        [
            "curl",
            "--fail",
            "--silent",
            "--show-error",
            "--max-time",
            "30",
            "--user-agent",
            "PersonalSatelliteMap/1.0",
            f"{CELESTRAK_URL}?{query}",
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    response = json.loads(result.stdout)

    if not response:
        raise RuntimeError("CelesTrak returned no orbital elements")
    return response[0]


def load_previous_data():
    try:
        payload = json.loads(OUTPUT_FILE.read_text())
        return {str(item["noradId"]): item for item in payload.get("satellites", [])}
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        return {}


def main():
    entries = read_satellite_list()
    previous_data = load_previous_data()
    satellites = []
    missing = []

    for index, entry in enumerate(entries):
        catalog_number = entry["noradId"]
        try:
            omm = fetch_omm(catalog_number)
            satellites.append({**entry, "omm": omm})
            print(f"Fetched {catalog_number}: {entry['label']}")
        except (subprocess.CalledProcessError, RuntimeError, json.JSONDecodeError) as error:
            previous = previous_data.get(catalog_number)
            if previous:
                satellites.append({**previous, "label": entry["label"]})
                print(f"Using cached data for {catalog_number}: {error}", file=sys.stderr)
            else:
                missing.append({**entry, "reason": str(error)})
                print(f"Could not fetch {catalog_number}: {error}", file=sys.stderr)

        if index < len(entries) - 1:
            time.sleep(0.25)

    if not satellites:
        raise RuntimeError("No satellite data is available; existing output was left unchanged")

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "satellites": satellites,
        "missing": missing,
    }
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"Wrote {len(satellites)} satellites to {OUTPUT_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError) as error:
        print(f"Update failed: {error}", file=sys.stderr)
        sys.exit(1)
