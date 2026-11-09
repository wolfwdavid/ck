"""Extract embedded images and link annotations from the source PDF.

Usage: python scripts/extract_assets.py

Writes:
  assets/images/pNNN_imgK.<ext>   (every embedded raster image, by physical page)
  data/links.json                 ({ "1": [{"rect": [...], "uri": "..."}], ... })
  data/image_manifest.json        (per-page list of exported image filenames + pixel size)
"""
import json
import sys
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / "Vegan Not Vegan Guide Book_FINALFINALFINAL.pdf"
IMAGES_DIR = ROOT / "assets" / "images"
DATA_DIR = ROOT / "data"

IMAGES_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)


def main():
    doc = fitz.open(PDF_PATH)
    links_by_page = {}
    manifest = {}

    for page_index in range(doc.page_count):
        physical_page = page_index + 1
        page = doc[page_index]

        # Link annotations (URLs embedded in the PDF, not just visible text)
        page_links = []
        for link in page.get_links():
            if link.get("uri"):
                page_links.append({"rect": list(link["from"]), "uri": link["uri"]})
        if page_links:
            links_by_page[str(physical_page)] = page_links

        # Embedded raster images
        page_images = []
        for img_i, img in enumerate(page.get_images(full=True)):
            xref = img[0]
            try:
                base = doc.extract_image(xref)
            except Exception as exc:
                print(f"page {physical_page} img {img_i}: extract failed: {exc}", file=sys.stderr)
                continue
            ext = base["ext"]
            width, height = base["width"], base["height"]
            # Skip tiny decorative/noise images (icons, gradients) under 150px on both sides
            if width < 150 and height < 150:
                continue
            filename = f"p{physical_page:03d}_img{img_i}.{ext}"
            (IMAGES_DIR / filename).write_bytes(base["image"])
            page_images.append({"file": filename, "width": width, "height": height})

        if page_images:
            manifest[str(physical_page)] = page_images

        print(f"page {physical_page}: {len(page_images)} image(s), {len(page_links)} link(s)")

    (DATA_DIR / "links.json").write_text(json.dumps(links_by_page, indent=2), encoding="utf-8")
    (DATA_DIR / "image_manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"\nTotal pages: {doc.page_count}")
    print(f"Pages with links: {len(links_by_page)}")
    print(f"Pages with exported images: {len(manifest)}")


if __name__ == "__main__":
    main()
