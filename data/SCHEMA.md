# content.json screen schema

The site is an array of "screen" objects, one per flipbook page, in reading order. Common fields on every screen:

```
{
  "physicalPage": 7,          // PDF physical page number(s). Use an array [51,52] for the merged cashew duplicate.
  "printedPage": "3",         // the book's own printed page number as a string, or null if the page carries no printed number (cover, dedication, TOC, dividers)
  "section": "Layer One: The Truth",  // human-readable section name this screen belongs to, for the jump menu. Use one of: "Front Matter", "Layer One: The Truth", "Layer Two: Conceptual Conclusions", "Layer Three: Switcharoozies", "A-Z New Pantry Additions", "Vitamin B12", "Plant-Based Recipes", "Additional Resources", "Worksheet", "About the Writer", "Closing"
  "type": "essay",            // one of: cover, divider, essay, quote, photo, recipe, pantry-letter, table, link-list, worksheet, bio, closing
  "content": { ... }          // shape depends on type, see below
}
```

Reference `data/assets.json` for asset keys (`citrusTexture`, `paperTexture`, `essayCollageP7`, `authorSelfie`, `authorPerformance`). Reference `data/links.json` (keyed by physical page number as a string) for the PDF's actual embedded hyperlink URLs on that page — prefer these over any visible text URL, and use them to fill in `url` fields even where the PDF shows no visible link text (e.g. the animal-rights orgs on page 86, the food-finder apps on pages 87-90 may have no link annotation at all — if `data/links.json` has nothing for that page, set `"url": null` rather than guessing).

## `content` shape by type

- **cover**: `{ "title": string, "subtitle": string|null, "image": "citrusTexture" }`
- **divider**: `{ "title": string }` (e.g. "Layer One: The Truth")
- **essay**: `{ "heading": string|null, "paragraphs": [string], "image": assetKey|null, "pullquote": string|null, "cta": {"label": string, "url": string}|null }` — use `cta` for the Discord invite callouts (pp. 11, 18) and `mailto:` for the author email (pp. 22, 93 — put that one in the `bio` type instead for p.93).
- **quote**: `{ "text": string, "attribution": string|null }`
- **photo**: `{ "image": assetKey, "caption": string|null }`
- **recipe**: `{ "title": string, "intro": string|null, "variants": [ { "name": string|null, "ingredients": [string], "steps": [string], "tips": string|null } ] }`
- **pantry-letter**: `{ "letter": string, "item": string, "uses": [string], "shopLink": {"label": string, "url": string|null} }`
- **table**: `{ "title": string|null, "headers": [string], "rows": [[string]] }`
- **link-list**: `{ "title": string, "groups": [ { "heading": string|null, "links": [ {"label": string, "url": string|null} ] } ] }`
- **worksheet**: `{ "title": string, "prompts": [string] }` (the 8 "Your Last…" numbered prompts, verbatim)
- **bio**: `{ "heading": string|null, "paragraphs": [string], "image": assetKey, "email": string|null }`
- **closing**: `{ "text": string }`

## Rules

- Transcribe real copy from the PDF verbatim (don't paraphrase or summarize) — this is the actual book content going live on a public site.
- Keep paragraphs as an array of strings (one entry per paragraph), not one giant blob.
- The duplicate "Cashew Alternatives" pages (physical 51 and 52, byte-identical) must be merged into ONE screen object with `"physicalPage": [51, 52]`, containing both variants from that content (Silken Tofu / Macadamia Nuts) in `variants`.
- Output a single JSON file: a top-level array of screen objects, in physical-page order, covering only your assigned page range (another batch covers the rest — they get merged later).
