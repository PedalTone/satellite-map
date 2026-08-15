#!/usr/bin/env python3
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from load_satellite_group import (
    GP_URL,
    SATCAT_URL,
    fetch_records,
    stable_sample,
)
from update_satellite_data import fetch_omm, fetch_satcat

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIRECTORY = ROOT / "data" / "presets"

CURATED_PRESETS = {
    "essentials": {
        "name": "Space essentials",
        "satellites": [
            ("25544", "ISS"),
            ("20580", "Hubble"),
            ("41866", "GOES-16"),
            ("49260", "Landsat 9"),
            ("40697", "Sentinel-2A"),
            ("43013", "NOAA-20"),
        ],
    },
    "human-spaceflight": {
        "name": "Human spaceflight",
        "satellites": [
            ("25544", "ISS"),
            ("48274", "Tiangong"),
        ],
    },
    "earth-observation": {
        "name": "Earth observation",
        "satellites": [
            ("39084", "Landsat 8"),
            ("49260", "Landsat 9"),
            ("40697", "Sentinel-2A"),
            ("42063", "Sentinel-2B"),
            ("25994", "Terra"),
            ("27424", "Aqua"),
            ("43013", "NOAA-20"),
        ],
    },
}


def generated_at():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def write_payload(identifier, name, satellites, source_query=None):
    payload = {
        "generatedAt": generated_at(),
        "presetName": name,
        "satellites": satellites,
        "missing": [],
    }
    if source_query:
        payload["sourceQuery"] = source_query
    OUTPUT_DIRECTORY.mkdir(parents=True, exist_ok=True)
    output_file = OUTPUT_DIRECTORY / f"{identifier}.json"
    output_file.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"Wrote {len(satellites)} satellites to {output_file.relative_to(ROOT)}")


def build_curated(identifier, definition):
    satellites = []
    missing = []
    for catalog_number, label in definition["satellites"]:
        try:
            satellites.append({
                "noradId": catalog_number,
                "label": label,
                "omm": fetch_omm(catalog_number),
                "catalog": fetch_satcat(catalog_number),
            })
        except (subprocess.CalledProcessError, RuntimeError, json.JSONDecodeError) as error:
            missing.append(f"{catalog_number}: {error}")
    if missing:
        raise RuntimeError(f"Could not build {identifier}: {'; '.join(missing)}")
    write_payload(identifier, definition["name"], satellites)


def group_label(record, prefix):
    object_name = str(record.get("OBJECT_NAME", ""))
    if prefix == "STARLINK":
        numbers = re.findall(r"\d+", object_name)
        return numbers[-1] if numbers else str(record["NORAD_CAT_ID"])
    return object_name or f"{prefix} {record['NORAD_CAT_ID']}"


def build_group(identifier, name, group_name, sample_size=None):
    omm_records = fetch_records(GP_URL, "GROUP", group_name)
    catalog_records = fetch_records(SATCAT_URL, "GROUP", group_name, ACTIVE="1")
    catalog_by_id = {
        str(record.get("NORAD_CAT_ID")): record
        for record in catalog_records
        if record.get("NORAD_CAT_ID") is not None
    }
    satellites = []
    for omm in omm_records:
        catalog_number = str(omm.get("NORAD_CAT_ID", ""))
        catalog = catalog_by_id.get(catalog_number)
        if not catalog_number.isdigit() or not catalog:
            continue
        if str(catalog.get("OBJECT_TYPE", "")).upper() != "PAY":
            continue
        satellites.append({
            "noradId": catalog_number,
            "label": group_label(omm, group_name),
            "omm": omm,
            "catalog": catalog,
        })
    if sample_size and len(satellites) > sample_size:
        satellites = stable_sample(satellites, sample_size, group_name)
    if not satellites:
        raise RuntimeError(f"No active payloads were returned for {group_name}")
    write_payload(identifier, name, satellites, group_name)


def build_or_preserve(identifier, builder, *args):
    try:
        builder(identifier, *args)
    except (OSError, RuntimeError, subprocess.CalledProcessError, json.JSONDecodeError) as error:
        output_file = OUTPUT_DIRECTORY / f"{identifier}.json"
        if not output_file.exists():
            raise
        print(f"Could not refresh {identifier}; preserving packaged data: {error}", file=sys.stderr)


def main():
    for identifier, definition in CURATED_PRESETS.items():
        build_or_preserve(identifier, build_curated, definition)
    build_or_preserve("gps", build_group, "GPS operational constellation", "GPS-OPS")
    build_or_preserve("starlink", build_group, "Starlink sample", "STARLINK", 25)


if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError, subprocess.CalledProcessError, json.JSONDecodeError) as error:
        print(f"Preset build failed: {error}", file=sys.stderr)
        sys.exit(1)
