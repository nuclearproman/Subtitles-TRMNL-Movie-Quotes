
#!/usr/bin/env python3
"""Build quotes.json from the master movie_quotes.csv file."""

import csv
import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INPUT = ROOT / "movie_quotes.csv"
OUTPUT = ROOT / "quotes.json"
FIELDS = ["quote", "film", "character", "actor", "source"]


def main():
    with INPUT.open("r", encoding="utf-8-sig", newline="") as file:
        reader = csv.DictReader(file)

        if reader.fieldnames is None:
            raise ValueError("movie_quotes.csv is empty or has no header row.")

        missing_headers = [field for field in FIELDS if field not in reader.fieldnames]
        if missing_headers:
            raise ValueError(
                "CSV is missing required columns: " + ", ".join(missing_headers)
            )

        quotes = []
        for line_number, row in enumerate(reader, start=2):
            quote = {field: (row.get(field) or "").strip() for field in FIELDS}
            if not quote["quote"]:
                raise ValueError(f"Row {line_number} has an empty quote.")
            quotes.append(quote)

    if not quotes:
        raise ValueError("No quote rows found; refusing to overwrite quotes.json.")

    if OUTPUT.exists():
        try:
            with OUTPUT.open("r", encoding="utf-8") as file:
                data = json.load(file)

            if not isinstance(data, dict):
                raise ValueError(
                    "Existing quotes.json must contain a top-level object."
                )

        except json.JSONDecodeError as error:
            print(
                f"Warning: Existing quotes.json is malformed ({error}). "
                "Rebuilding it from the CSV."
            )
            data = {}
    else:
        data = {}

    data["generated"] = date.today().isoformat()
    data["count"] = len(quotes)
    data["quotes"] = quotes

    with OUTPUT.open("w", encoding="utf-8", newline="\n") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)
        file.write("\n")

    print(f"Updated {OUTPUT.name} with {len(quotes)} quotes.")


if __name__ == "__main__":
    main()
