# Star Falcon v2 — feature module contract

Star Falcon is the user's own original game: a 16-bit style vertical arcade shooter for kids
(loud, chunky, friendly; hard pixel edges, limited palette, no blur). One self-contained HTML file.

## Layout (all paths relative to `tools/star-falcon/` in the falcon-arcade repo)
- `src/core.html` — the v1.2 game (READ-ONLY for feature authors). All game code lives in ONE block scope `{ ... }`.
- `src/features/NN-slug.js` — feature modules. `build.js` wraps each file in its own `{ }` block and
  splices them, sorted by filename, at the `/*__FEATURES__*/` marker — INSIDE the game's scope, after every
  core function/variable is defined and BEFORE boot (`PLN=mkPlanet();mkEx();thumbs();menu();requestAnimationFrame(frame)`).
- `node build.js [--only a.js,b.js | --none] [--out path]` → single HTML (default: the shipped `public/games/star-falcon/index.html`).
- `node smoke.js <built.html> [--stages 0,1] [--shot x.png]` → headless playthrough of all 8 stages; must print `SMOKE OK`.
- `src/disabled.txt` — feature filenames (one per line) excluded from full builds.

## How a feature module works
Because a module runs inside the game's scope it can read and assign every core binding directly
(`P`, `en`, `eb`, `pb`, `pk`, `pt`, `boss`, `save`, `LV`, `SHOP`, `DEF`, `BL`, `li`, `lv`, `state`, `c`, `W`, `H`, `T`, ...)
and can wrap any core function by reassigning it:

```js
const _upd = update;
update = function (dt) { _upd(dt); /* my per-frame logic (only runs while playing & not paused) */ };
const _scene = scene;
scene = function () { _scene(); /* draw in world space, 480x720 logical px, use put()/px()/sprite() */ };
```

Rules:
1. Own file only. Never edit `src/core.html`, `build.js`, `smoke.js`, or another feature's file.
2. ALWAYS wrap (call the previous function); never replace a core function wholesale, never copy-paste core bodies.
   Other modules wrap the same functions — your wrapper must compose with unknown wrappers before and after it.
   Wrappers must pass through all arguments and return values.
3. Top-level `const/let` in your file are private (file is block-wrapped). Share things only via `FX.<slug> = {...}`.
   Read other features defensively: `FX.combo && FX.combo.add(…)`. Never hard-depend on another feature.
4. New persistent data: add keys under `save.<slug>` (with defaults when missing) and call `store()`. Old saves
   (no such key) must keep working. Do not rename or remove existing save keys. localStorage key stays `soimul-stelar`.
5. Pixel look: build art with `sprite(key,w,h,fn,outline)` / `pix` / `dith` (unique sprite keys, prefix with your slug),
   draw with `put()` / `px()` on even coordinates. No smooth gradients on screen, no canvas blur/shadowBlur, no emoji, no external assets.
   DOM UI uses the existing classes (`button`, `.big`, `.row`, `.it`, `.sm`, `.cr`, `h2`) and the `data-a` click delegation on `#ov`
   (add your own `ov.addEventListener('click', …)` for new `data-a` actions). Add CSS via an injected `<style>` element if needed.
6. Sound only through `beep()` / `boom()` or your own nodes on the shared `ac` AudioContext; always respect `save.mute`
   and tolerate `ac===null` (audio is created lazily on first user gesture).
7. Performance: no per-frame allocations of canvases/gradients/ImageData; cache sprites. Keep particle counts bounded.
   Game must hold 60fps on a mid phone.
8. Kid-friendly and fair: readable bullets, telegraphed attacks, no gore, no text walls. English UI strings, short.
9. Original content only — do not copy names, characters, or art from existing commercial games.
10. Never auto-pause, block, or require input inside `update()`: the smoke test drives `__sf.startLevel(i)` + `__sf.update(1/60)`
    with an invincible, max-upgrade player sweeping left-right at y=600 and requires every stage to reach `state==='clear'`
    within 30000 steps, then a mortal run to end in `over`/`clear`, with zero JS errors. Don't use `Date.now()`-based
    gameplay timing — use `dt`/`T`.
11. `window.__sf` is created after features load: `__sf.s` exposes `{state,paused,li,P,boss,en,eb,pb,pk,pt,wave,waves,lives,save,earned,T}`, `__sf.FX` is `FX`.
12. Keep each module focused and compact (roughly 40–250 lines). Start the file with a 2–4 line comment: what it does, what it wraps, what it stores.

## Testing your module
```bash
cd tools/star-falcon
node build.js --only NN-slug.js --out /tmp/sf-NN/index.html && node smoke.js /tmp/sf-NN/index.html
```
Always build to your own `--out` path (other agents build concurrently; never run a build without `--out` unless told to — that overwrites the shipped game).
Also write a short Playwright script of your own (Chromium + Playwright are preinstalled; `require('playwright')`,
`chromium.launch()` with no options) that proves your feature actually triggers, and look at a screenshot
(deviceScaleFactor 1) to check it visually.

The shipped page has an `<a href="../../index.html">Arcade</a>` back-link in the bottom `#bar`; keep it working.
