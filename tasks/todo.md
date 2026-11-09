# Vegan Not Vegan Guide Book → Flipbook Web App

Plan: C:\Users\Mkaru\.claude\plans\delegated-sniffing-honey.md

## Scaffold
- [x] git init
- [x] folder structure (css/js/data/assets/images)
- [x] .gitignore
- [x] base index.html + css/style.css (generalized mockup theme)

## Asset + link extraction
- [x] scripts/extract_assets.py (PyMuPDF): export photos/graphics, pull link annotations per page
- [x] rebuild B12 Amazon screenshots as clean custom cards (no raw screenshots) — raw screenshots deleted, not used

## Content extraction → data/content.json
- [x] Batch 1: front matter + Layer One + Layer Two (pp. 1-20)
- [x] Batch 2: recipes + Layer Three (pp. 21-53, merge 51-52 duplicate)
- [x] Batch 3: A-Z pantry (pp. 54-80) — schema extended: description/intro/also/note/tip/shopLinks/additionalItem, templates.js updated to match
- [x] Batch 4: B12 + resources + worksheet + bio + closing (pp. 81-94)
- [x] merge batches into single data/content.json via scripts/merge_content.py — 93 screens, no gaps/dupes

## Flipbook engine
- [x] js/templates.js (render fn per screen type)
- [x] js/app.js (swipe/keyboard/edge-tap nav, progress bar, jump menu, hash deep-link)
- [x] worksheet localStorage persistence
- [x] smoke-tested in Chrome with sample content.json: cover/divider/essay/recipe/pantry-letter/table/worksheet all render, jump menu + keyboard nav + hash routing + worksheet persistence all confirmed working, no console errors

## Styling + accessibility
- [x] generalize theme across all screen types, two typographic voices
- [x] responsive beyond phone width (clamp()-based type scale + breakpoint)
- [x] alt text (real images + SVG aria-label for the decorative line-art pages), real <a> links, :focus-visible states, high-contrast ink-on-cream palette

## Verification
- [x] local static server + walked real content: cover, TOC table, p.7 collage, p.14 line-art, recipe (Milk, 2 pages), pantry (single-item A, multi-item P with additionalItem), table (B12 nutrients, recipe-site directory), link-list (orgs, apps, Instagram/websites/cruelty-free), worksheet (incl. localStorage persistence across reload), bio, closing — all correct, no console errors
- [x] fixed real bugs found during the walk: jump-menu `hidden` attribute overridden by CSS display:flex; recipe screens spanning multiple physical pages shared one anchor hash (2nd page unreachable by direct link) — now page-suffixed; jump menu listed duplicate entries for multi-page recipes/sections — deduped; run-on titles ("Heading — long sentence") now split into heading + intro text; line-art page's description was a visible caption instead of an aria-label
- [x] spot-checked 3 pages (Milk recipe pp.23, A-pantry p.55) by rendering the PDF pages as images and comparing — verbatim match
- [x] incremental commits (scaffold+engine+partial content, then full merged content — see below)

## Deferred
- [ ] remote GitHub repo + Pages deploy (ask user first)
- [ ] Android/Mac app wrapper
