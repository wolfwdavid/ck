# CK dashboard — build checklist

## Step A — clear the old flipbook site
- [x] `git rm` old flipbook files (now in ck-vegan-not-vegan)
- [x] `.gitignore`: node_modules, build, .svelte-kit, logs, nested repos
- [x] Commit "Remove flipbook files now hosted in ck-vegan-not-vegan"

## Step B — scaffold
- [x] package.json / .npmrc / svelte.config.js / vite.config.ts / tsconfig.json
- [x] src/app.html, src/app.d.ts, src/routes/+layout.ts
- [x] static/.nojekyll, favicon.svg, robots.txt, images/
- [x] .github/workflows/deploy.yml (master branch, BASE_PATH=/ck)
- [x] tools/verify-build.mjs
- [x] npm install → package-lock.json

## Step C — dashboard
- [x] src/lib/projects.ts
- [x] src/lib/manifest.ts + tests
- [x] src/lib/github.ts (ETag cache, Link header, relativeTime) + tests
- [x] src/lib/csv.ts + tests
- [x] src/lib/live/{flipbook,sheet}.ts + tests
- [x] src/lib/dashboard.svelte.ts (runes store, 5-min refresh, pause when hidden)
- [x] Components: ProjectCard, GithubBlock, Flipbook/Capture/Sheet panels, QrCode, StatusPill
- [x] +layout.svelte + app.css tokens, +page.svelte
- [x] tools/dev-siblings.mjs (CORS static server for local `devLive` URLs)

## Verify
- [x] npm run check clean (0 errors, 0 warnings)
- [x] npm test green (25 tests)
- [x] npm run dev + Playwright pass at 390px and 1280px: 3 cards Live via dev-siblings, flipbook 93 screens / 11 sections, capture tag QR swap, sheet summary, QR overlay (Escape + Close), Share → clipboard toast, "Repo not found yet" for the 3 uncreated repos, GitHub 200 + 304 path against wolfwdavid/ck
- [x] BASE_PATH=/ck build → npm run verify → preview at /ck/
- [x] Commit "Add CK dashboard connecting the project repos"

## Review
- Local dev needs `npm run dev:siblings` (not `python -m http.server`): the dashboard fetches `ck.json` cross-origin, and only GitHub Pages / the Node helper send `Access-Control-Allow-Origin`.
- The two new project repos do not exist on GitHub yet; the GitHub block shows "Repo not found yet" until they are created.
- Each refresh costs up to 9 unauthenticated GitHub requests (3 per repo); unchanged responses come back 304 and do not count against the 60/hr limit.
