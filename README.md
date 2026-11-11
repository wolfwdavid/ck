# CK dashboard

One page that shows the Cosmic Kitty projects side by side: whether each site is up, its latest GitHub activity, its live data, a QR code and a shared project log.

Live at https://wolfwdavid.github.io/ck/

## Projects

The list lives in `src/lib/projects.ts`. Each project is its own repo and GitHub Pages site, and publishes a `ck.json` manifest that the dashboard reads.

| Project | Repo |
| --- | --- |
| vegan-not-vegan | `wolfwdavid/ck-vegan-not-vegan` |
| contact-capture | `wolfwdavid/ck-contact-capture` |
| food-rescue | `wolfwdavid/ck-food-rescue` |

## Project log

The log panel at the top of the dashboard is backed by the issues of this repo. There is no server and no token in the page.

- **A note** is an open issue. Closing the issue removes it from the dashboard.
- **A project label** (`vegan-not-vegan`, `contact-capture`, `food-rescue`) ties a note to a project.
- **The `working-on` label** marks what is being worked on. The dashboard shows the project of the newest open note that carries it, in the log header and as a pill on that project's card.
- **Replies** are the comments on the issue. They show under the note.
- Only notes and replies from the repo owner, members and collaborators are shown.

### Posting a note

From the dashboard: pick a project, type the note, tick "Working on this" if it applies, and press Send. GitHub opens with the note filled in; submit it there, then press refresh on the dashboard.

From a terminal in this folder (needs the `gh` CLI, signed in):

```sh
npm run note -- -t "Starting the board redesign" -b "" -l food-rescue -l working-on
```

Leave out `-l working-on` for an ordinary note, and both `-l` flags for a general one.

To reply in a thread, use the note's "reply" link, or:

```sh
gh issue comment 12 -R wolfwdavid/ck -b "What is still open on food-rescue?"
```

A new note can take a minute to appear, because GitHub caches the list briefly.

### Automatic replies

`.github/workflows/reply.yml` runs `tools/reply.mjs` whenever someone with repo access opens a note or comments in a thread. The script sends the open notes and the thread to the Anthropic API and posts the answer as a comment from `github-actions[bot]`, shown on the dashboard as "CK bot".

- **Setup:** add a repository secret named `ANTHROPIC_API_KEY` under Settings → Secrets and variables → Actions. Without it the reply run fails and nothing is posted.
- **Scope:** the bot only posts comments. It cannot add labels or close notes.
- **Cost:** each reply is one API call billed to that key.
- **Turning it off:** disable the "Reply to project log" workflow on the Actions tab.

## Development

```sh
npm install
npm run dev            # the dashboard
npm run dev:siblings   # serves the project folders locally with CORS, for the cards
npm run check          # type check
npm test               # unit tests
```

Without `dev:siblings` the cards show "Down" locally; the log still works because it reads GitHub directly.

## Deploy

Pushing to `master` runs `.github/workflows/deploy.yml`, which builds with `BASE_PATH=/ck` and publishes to GitHub Pages. To check a production build locally:

```sh
BASE_PATH=/ck npm run build && npm run verify
```

## GitHub rate limit

The page calls the GitHub API without signing in, which allows 60 requests an hour per visitor. Each refresh makes up to 11 requests (three per project repo, two for the log). Unchanged responses come back as 304 and do not count.
