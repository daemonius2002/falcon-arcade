# Falcon Arcade v0.4.0

Pixel games platform for kids: 6 categories, 30 games, all playable in the browser on phone, tablet and PC.

- `public/` - the whole site (static HTML, CSS, JS, PNG)
- `server.js` - tiny Node server with no dependencies; serves `public/` on `$PORT` (default 3000)
- Health check: `GET /healthz` returns `ok`

Run locally: `npm start`, then open http://localhost:3000

Deploy: push this folder to a Git repository and deploy it as a Node app.
The site itself has no build step and no `npm install` packages; the start command is `npm start`.

Player name, high scores, favourites and play stats are stored in each browser (localStorage).
See `CHANGELOG.md` for what changed in each version.

## New in v0.4.0
- **Star Falcon v2.0:** 8 new bosses, Boss Rush mode, chiptune music, score chains, wing drones,
  power capsules, stage events, a mid-stage mini-boss, stage results with stars, an Options screen,
  a pause menu and touch drag steering.
- **All 29 other games reworked:** most now have levels, stages or a cup to win, plus new hazards,
  power-ups and hearts or lives; touch controls were tested at phone size.
- **Platform:** Pause button, a Continue Playing row, favourite stars and best scores on every card,
  a livelier game-over panel, a player stats panel, keyboard shortcuts, a tidier phone header
  and add-to-home-screen support.

## Tools (`tools/`)
- `tools/star-falcon/` - Star Falcon is built from `tools/star-falcon/src` (the core game plus
  24 feature modules) into the single file `public/games/star-falcon/index.html`.
  Rebuild it with `node tools/star-falcon/build.js` after changing anything in `src/`;
  do not edit the shipped HTML by hand. See `tools/star-falcon/README.md` and `CONTRACT.md`.
  The built file is committed, so deploying still needs no build.
- `tools/test-arcade.js` - browser test for the home page and every game.

## Tests
The tests need Node 18+ and Playwright with Chromium (`npm i -g playwright` and
`npx playwright install chromium`, or any setup where `require('playwright')` works).
Playwright is only needed for testing; the site and server do not use it.

```bash
# Star Falcon: build, then play all 8 stages headlessly (must print SMOKE OK)
cd tools/star-falcon && node build.js && node smoke.js

# Whole arcade: home page plus every game (must print ARCADE TEST OK)
node tools/test-arcade.js                       # all games
node tools/test-arcade.js --games snake-trail,mini-golf --port 3411 --shots /tmp/shots --secs 4
```
