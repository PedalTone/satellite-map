#!/usr/bin/env python3
import json
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from update_satellite_data import fetch_omm, fetch_satcat

ROOT = Path(__file__).resolve().parent.parent
SATELLITE_LIST = ROOT / "satellites.txt"
OUTPUT_FILE = ROOT / "data" / "satellite-data.json"
MAX_SATELLITES = 100


def parse_norad_ids(raw_value):
    value = raw_value.strip()
    if value.startswith("NORAD IDs:"):
        value = value.removeprefix("NORAD IDs:").split("\n\n", maxsplit=1)[0].strip()
    tokens = [token for token in re.split(r"[\s,]+", value) if token]
    if not tokens:
        raise ValueError("Provide at least one NORAD catalog ID")
    invalid = next((token for token in tokens if not re.fullmatch(r"\d{1,9}", token)), None)
    if invalid:
        raise ValueError(f'"{invalid}" is not a valid NORAD catalog ID')
    identifiers = list(dict.fromkeys(str(int(token)) for token in tokens))
    if len(identifiers) > MAX_SATELLITES:
        raise ValueError(f"Provide no more than {MAX_SATELLITES} unique NORAD catalog IDs")
    return identifiers


def display_label(omm, catalog_number):
    name = " ".join(str(omm.get("OBJECT_NAME", "")).split())
    return name or catalog_number


def build_satellites(identifiers):
    satellites = []
    for index, catalog_number in enumerate(identifiers):
        try:
            omm = fetch_omm(catalog_number)
        except (subprocess.CalledProcessError, RuntimeError, json.JSONDecodeError) as error:
            raise RuntimeError(f"Could not load NORAD {catalog_number}: {error}") from error
        try:
            catalog = fetch_satcat(catalog_number)
        except (subprocess.CalledProcessError, RuntimeError, json.JSONDecodeError) as error:
            catalog = None
            print(f"Catalog metadata unavailable for {catalog_number}: {error}", file=sys.stderr)
        satellites.append({
            "noradId": catalog_number,
            "label": display_label(omm, catalog_number),
            "omm": omm,
            "catalog": catalog,
        })
        print(f"Loaded NORAD {catalog_number}: {satellites[-1]['label']}")
        if index < len(identifiers) - 1:
            time.sleep(0.25)
    return satellites


def write_outputs(identifiers, satellites):
    lines = ["# One satellite per line: NORAD catalog number, label shown on the map"]
    lines.extend(f'{item["noradId"]},{item["label"].replace(",", " ")}' for item in satellites)
    SATELLITE_LIST.write_text("\n".join(lines) + "\n")
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "sourceQuery": "Custom NORAD IDs",
        "sourceNoradIds": identifiers,
        "satellites": satellites,
        "missing": [],
    }
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(payload, indent=2) + "\n")


def main():
    if len(sys.argv) != 2:
        raise ValueError("Usage: load_satellite_ids.py NORAD_IDS")
    identifiers = parse_norad_ids(sys.argv[1])
    satellites = build_satellites(identifiers)
    write_outputs(identifiers, satellites)
    print(f"Loaded {len(satellites)} custom NORAD satellite(s)")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError) as error:
        print(f"NORAD load failed: {error}", file=sys.stderr)
        sys.exit(1)
