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
- [ ] Batch 1: front matter + Layer One + Layer Two (pp. 1-20) — running
- [ ] Batch 2: recipes + Layer Three (pp. 21-53, merge 51-52 duplicate) — running
- [x] Batch 3: A-Z pantry (pp. 54-80) — done, data/batch3.json (schema extended: description/intro/also/note/tip/shopLinks/additionalItem — templates.js updated to match)
- [ ] Batch 4: B12 + resources + worksheet + bio + closing (pp. 81-94) — running
- [ ] merge batches into single data/content.json, validate schema

## Flipbook engine
- [x] js/templates.js (render fn per screen type)
- [x] js/app.js (swipe/keyboard/edge-tap nav, progress bar, jump menu, hash deep-link)
- [x] worksheet localStorage persistence
- [x] smoke-tested in Chrome with sample content.json: cover/divider/essay/recipe/pantry-letter/table/worksheet all render, jump menu + keyboard nav + hash routing + worksheet persistence all confirmed working, no console errors

## Styling + accessibility
- [x] generalize theme across all screen types, two typographic voices
- [x] responsive beyond phone width (clamp()-based type scale + breakpoint)
- [ ] alt text, real <a> links, focus states, contrast check — pending real content pass

## Verification
- [ ] local static server + walk all ~93 screens (webapp-testing)
- [ ] spot-check extracted text against PDF
- [ ] incremental commits per phase

## Deferred
- [ ] remote GitHub repo + Pages deploy (ask user first)
- [ ] Android/Mac app wrapper
