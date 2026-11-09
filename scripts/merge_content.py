"""Merge data/batch1.json .. batch4.json into the final data/content.json.

Usage: python scripts/merge_content.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
BATCH_FILES = ["batch1.json", "batch2.json", "batch3.json", "batch4.json"]


def flat_physical_pages(screen):
    pp = screen.get("physicalPage")
    return pp if isinstance(pp, list) else [pp]


def main():
    merged = []
    seen_pages = set()

    for name in BATCH_FILES:
        path = DATA_DIR / name
        if not path.exists():
            raise SystemExit(f"Missing {path} — not all batches are ready yet.")
        batch = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(batch, list):
            raise SystemExit(f"{name} is not a top-level JSON array.")
        for screen in batch:
            pages = flat_physical_pages(screen)
            for p in pages:
                if p in seen_pages:
                    raise SystemExit(f"Physical page {p} appears more than once (from {name}).")
                seen_pages.add(p)
            merged.append(screen)

    merged.sort(key=lambda s: min(flat_physical_pages(s)))

    expected = set(range(1, 95)) - {51}  # 51 merged into 52's entry (or vice versa)
    missing = sorted(expected - seen_pages)
    if missing:
        print(f"WARNING: missing physical pages: {missing}")

    out_path = DATA_DIR / "content.json"
    out_path.write_text(json.dumps(merged, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(merged)} screens to {out_path}")


if __name__ == "__main__":
    main()
