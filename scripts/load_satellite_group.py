#!/usr/bin/env python3
import hashlib
import json
import re
import subprocess
import sys
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SATELLITE_LIST = ROOT / "satellites.txt"
OUTPUT_FILE = ROOT / "data" / "satellite-data.json"
GP_URL = "https://celestrak.org/NORAD/elements/gp.php"
SATCAT_URL = "https://celestrak.org/satcat/records.php"
MAX_SATELLITES = 100
STARLINK_SAMPLE_SIZE = 25


def fetch_records(base_url, query_key, query_value, **options):
    parameters = {query_key: query_value, "FORMAT": "JSON", **options}
    query = urllib.parse.urlencode(parameters)
    result = subprocess.run(
        [
            "curl",
            "--fail",
            "--silent",
            "--show-error",
            "--max-time",
            "90",
            "--user-agent",
            "PersonalSatelliteMap/1.0",
            f"{base_url}?{query}",
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    records = json.loads(result.stdout)
    if not isinstance(records, list):
        raise RuntimeError("CelesTrak returned an unexpected response")
    return records


def stable_sample(satellites, sample_size, seed):
    def sample_order(satellite):
        catalog_number = satellite["noradId"]
        return hashlib.sha256(f"{seed}:{catalog_number}".encode()).digest()

    return sorted(
        sorted(satellites, key=sample_order)[:sample_size],
        key=lambda satellite: int(satellite["noradId"]),
    )


def numeric_label(object_name, catalog_number):
    numbers = re.findall(r"\d+", object_name or "")
    return numbers[-1] if numbers else catalog_number


def validate_common_name(raw_value):
    value = " ".join(raw_value.strip().split())
    if len(value) < 2 or len(value) > 80:
        raise ValueError("Common name must contain 2–80 characters")
    if any(ord(character) < 32 for character in value):
        raise ValueError("Common name contains unsupported control characters")
    return value


def build_group(common_name):
    is_starlink = common_name.casefold() == "starlink"
    query_key = "GROUP" if is_starlink else "NAME"
    query_value = "STARLINK" if is_starlink else common_name
    omm_records = fetch_records(GP_URL, query_key, query_value)
    catalog_options = {"ACTIVE": "1"} if is_starlink else {}
    catalog_records = fetch_records(SATCAT_URL, query_key, query_value, **catalog_options)
    catalog_by_id = {
        str(record.get("NORAD_CAT_ID")): record
        for record in catalog_records
        if record.get("NORAD_CAT_ID") is not None
    }
    satellites = []
    used_labels = set()

    for omm in omm_records:
        catalog_number = str(omm.get("NORAD_CAT_ID", ""))
        catalog = catalog_by_id.get(catalog_number)
        if not catalog_number.isdigit() or not catalog:
            continue
        if str(catalog.get("OBJECT_TYPE", "")).upper() != "PAY":
            continue
        label = numeric_label(str(omm.get("OBJECT_NAME", "")), catalog_number)
        if label in used_labels:
            label = catalog_number
        used_labels.add(label)
        satellites.append({
            "noradId": catalog_number,
            "label": label,
            "omm": omm,
            "catalog": catalog,
        })

    if not satellites:
        raise RuntimeError(f'No active payloads with GP data matched "{common_name}"')
    if is_starlink:
        return stable_sample(satellites, STARLINK_SAMPLE_SIZE, "STARLINK")
    if len(satellites) > MAX_SATELLITES:
        raise RuntimeError(
            f'"{common_name}" matched {len(satellites)} active payloads; '
            f"refine the common name to {MAX_SATELLITES} or fewer"
        )
    return satellites


def write_outputs(common_name, satellites):
    lines = ["# One satellite per line: NORAD catalog number label"]
    lines.extend(f'{item["noradId"]} {item["label"]}' for item in satellites)
    SATELLITE_LIST.write_text("\n".join(lines) + "\n")
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "sourceQuery": common_name,
        "satellites": satellites,
        "missing": [],
    }
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(payload, indent=2) + "\n")


def main():
    if len(sys.argv) != 2:
        raise ValueError("Usage: load_satellite_group.py COMMON_NAME")
    common_name = validate_common_name(sys.argv[1])
    satellites = build_group(common_name)
    write_outputs(common_name, satellites)
    if common_name.casefold() == "starlink":
        print(
            f'Loaded a stable sample of {len(satellites)} active payloads '
            f'from the CelesTrak STARLINK group'
        )
    else:
        print(f'Loaded {len(satellites)} active payloads matching "{common_name}"')


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, subprocess.CalledProcessError, json.JSONDecodeError) as error:
        print(f"Group load failed: {error}", file=sys.stderr)
        sys.exit(1)
