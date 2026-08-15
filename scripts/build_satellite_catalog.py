#!/usr/bin/env python3
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from load_satellite_group import GP_URL, SATCAT_URL, fetch_records, numeric_label

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIRECTORY = ROOT / "data" / "catalog"
SHARD_SIZE = 1000


def generated_at():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def build_catalog():
    omm_records = fetch_records(GP_URL, "GROUP", "ACTIVE")
    catalog_records = fetch_records(SATCAT_URL, "GROUP", "ACTIVE", ACTIVE="1")
    catalog_by_id = {
        str(record.get("NORAD_CAT_ID")): record
        for record in catalog_records
        if record.get("NORAD_CAT_ID") is not None
    }
    shards = {}
    for omm in omm_records:
        catalog_number = str(omm.get("NORAD_CAT_ID", ""))
        catalog = catalog_by_id.get(catalog_number)
        if not catalog_number.isdigit() or not catalog:
            continue
        if str(catalog.get("OBJECT_TYPE", "")).upper() != "PAY":
            continue
        satellite = {
            "noradId": catalog_number,
            "label": numeric_label(str(omm.get("OBJECT_NAME", "")), catalog_number),
            "omm": omm,
            "catalog": catalog,
        }
        shard_number = int(catalog_number) // SHARD_SIZE
        shards.setdefault(shard_number, []).append(satellite)

    if not shards:
        raise RuntimeError("CelesTrak returned no active payloads with current GP data")

    timestamp = generated_at()
    temporary_directory = OUTPUT_DIRECTORY.with_name("catalog-next")
    if temporary_directory.exists():
        shutil.rmtree(temporary_directory)
    temporary_directory.mkdir(parents=True)

    manifest_shards = []
    total_satellites = 0
    for shard_number, satellites in sorted(shards.items()):
        satellites.sort(key=lambda item: int(item["noradId"]))
        filename = f"{shard_number:03d}.json"
        payload = {"generatedAt": timestamp, "satellites": satellites}
        (temporary_directory / filename).write_text(
            json.dumps(payload, separators=(",", ":")) + "\n"
        )
        manifest_shards.append(filename)
        total_satellites += len(satellites)

    manifest = {
        "generatedAt": timestamp,
        "count": total_satellites,
        "shardSize": SHARD_SIZE,
        "shards": manifest_shards,
    }
    (temporary_directory / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n"
    )
    if OUTPUT_DIRECTORY.exists():
        shutil.rmtree(OUTPUT_DIRECTORY)
    temporary_directory.rename(OUTPUT_DIRECTORY)
    print(f"Wrote {total_satellites} active satellites across {len(shards)} catalog shards")


if __name__ == "__main__":
    try:
        build_catalog()
    except (OSError, RuntimeError, subprocess.CalledProcessError, json.JSONDecodeError) as error:
        print(f"Catalog build failed: {error}", file=sys.stderr)
        sys.exit(1)
