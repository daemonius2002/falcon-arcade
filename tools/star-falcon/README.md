# Star Falcon v2.0

A 16-bit style vertical shooter for kids, shipped as one self-contained HTML file:
`public/games/star-falcon/index.html`. Do not edit that file by hand: it is built from this folder.

## Layout
- `src/core.html`: the v1.2 game (one block scope, `/*__FEATURES__*/` marker before boot).
- `src/features/NN-slug.js`: feature modules that wrap core functions. They are spliced in filename order.
- `src/disabled.txt` (optional): feature filenames, one per line, left out of full builds.
- `build.js`: joins core and features into one HTML file.
- `smoke.js`: headless test that plays all 8 stages.
- `CONTRACT.md`: the rules every feature module follows. Read it before writing one.

## Build and test
```bash
cd tools/star-falcon
node build.js                                  # full build -> public/games/star-falcon/index.html
node smoke.js                                  # must print SMOKE OK
node build.js --only 13-boss1-orbit.js --out /tmp/sf/index.html   # one module, private output
node build.js --none --out /tmp/sf-core/index.html                # plain v1.2 core
node smoke.js /tmp/sf/index.html --stages 0,1 --shot /tmp/sf/shot.png
```
When other people are building at the same time, use `--out` with your own path.
For visual checks, use Playwright at 480x820 and 390x844 (deviceScaleFactor 1).

## Feature modules
| Module | What the player gets |
|---|---|
| 01-settings | Options screen (flash, volumes, shake, tips...), pause menu with Restart/Options/Menu and a 3-2-1 resume countdown |
| 02-score | Arcade score, kill-chain multiplier up to x8, close-call graze bonus, best score per stage |
| 03-music | Original chiptune music per stage, boss, menu and Hangar, plus jingles and Music/Effects volume |
| 04-juice | Hit-stop, directional screen shake, impact sparks and a shockwave for the Mega bomb |
| 05-shipfx | Ship feedback: hit flash, low-HP warning, respawn beam, engine trail |
| 06-coach | First-flight hints on stages 1-2, easy-to-see pink enemy bullets, optional bullet rings, How to play screen |
| 07-mobile | Drag steering on touch, instant BOMB button, play-mode thumb bar, safe-area and landscape layout |
| 08-squadrons | 5-ship squadrons on flight paths with a wipe bonus, gold Ace enemies and the Courier bonus ship |
| 09-miniboss | A Wing Captain mini-boss halfway through every stage |
| 10-stagepack-a | Stage events for 1-4: shooting stars, meteor showers, ice shard volleys, gunboats |
| 11-stagepack-b | Hazards for 5-8, all with a warning first: sandstorm gusts, lava geysers, lightning lanes, laser gates |
| 12-weapons | Wing drones (new Hangar item) and power capsules: spread, magnet, double cash, bubble shield |
| 13-boss1-orbit | Stage 1 boss Orbit Warden (2 phases) |
| 14-boss2-baron | Stage 2 boss Boulder Baron (3 phases, rock shield, drill dash) |
| 15-boss3-frost | Stage 3 boss Frost Monarch (spirals, icicle lanes, shard shell) |
| 16-boss4-tide | Stage 4 boss Tidebreaker (sea mines, dives, wave walls) |
| 17-boss5-driller | Stage 5 boss Dune Driller (sand fans, burrow and erupt, dizzy damage window) |
| 18-boss6-forge | Stage 6 boss Magma Forge (lava lobs, lava walls, eruption lanes with a SAFE lane) |
| 19-boss7-prism | Stage 7 boss The Prism (teleports, mirror decoys, rotating beams) |
| 20-boss8-overseer | Stage 8 final boss The Overseer (3 forms) |
| 21-stagecraft | Named boss bar with phase pips, phase banners, boss death show, coin vacuum, no game over after the win |
| 22-results | Stage tally with up to 3 stars, ship-down progress card, stars and bests on the menu cards |
| 23-bossrush | Boss Rush: all 8 bosses back to back against the clock (unlocked by beating stage 8) |
| 24-balance | Difficulty tuning, boss HP matched to your firepower, Hangar prices, and a "second wind" after repeated losses |

## Disabled modules
None. There is no `src/disabled.txt`, so all 24 modules ship.

## Saves
The localStorage key is still `soimul-stelar`. v1.2 saves (`cr, up, unl, diff, mute`) load unchanged.
Modules add their own `save.<slug>` keys with defaults.
