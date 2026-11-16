# make.fun lite — makefun-frontend-01

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/hamkazhaa/makefun-frontend-01-v3/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/hamkazhaa/makefun-frontend-01-v3/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

Built for the [make.fun "Build the best make.fun frontend" bounty](https://make.fun/bounty/makefun-frontend-01) ($500 in USDC).

A fast read-only frontend for make.fun's public API — no build step, no
framework, no sign-in. Static files under `app/`, served by any static HTTP
server with `app/` at its root.

## Surfaces

- `#/` — the bounty board: every live bounty with its reward, live pot,
  entry fee, time left and entries. Search, filter (Open / Closing soon /
  All) and sort (closing soonest / biggest reward / most entries).
- `#/bounty/<slug>` — a bounty's page: summary, description and rules, the
  rewards table with the live pot, dates and status, plus the top 5 entries.
- `#/bounty/<slug>/leaderboard` — the full leaderboard: rank, entrant,
  entry, judge win rate with its 90% interval, size and validity.
- `#/u/<handle>` — an account's public profile: record and entries.

## Why it is fast

- **One cache, one minute.** API answers are cached in memory for 60 s and
  revalidated with `If-None-Match`; the API's ETags are bound to the minute,
  so a revalidation inside the same minute answers 304. The footer shows
  how many requests the cache saved this session.
- **Small first load.** The shell is `index.html` + one stylesheet + five
  small ES modules, system fonts only — no framework, no webfont, no
  third-party code at all.
- **Few requests per view.** The board fetches the competition list once and
  filters/sorts it in the browser; typing in the search box re-renders the
  list without another request.

## Run it

```
node serve.ts            # app/ on http://localhost:8080
```

Hand it in (writes `out/dossier.json`):

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
