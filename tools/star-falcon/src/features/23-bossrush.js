/* 23-bossrush: Boss Rush mode - all 8 bosses back to back against the clock (unlocked by beating stage 8).
   Wraps menu, startLevel, update, mkBoss, levelDone, gameOver, draw. Stores save.rush = {ok, best:[s,s,s]}
   (best seconds per difficulty, 0 = none). Exposes FX.rush = {on, t}. */
const brFix = () => {
  const r = save.rush;
  if (!r || typeof r !== 'object') { save.rush = { ok: 0, best: [0, 0, 0] }; return; }
  r.ok = r.ok ? 1 : 0;
  if (!Array.isArray(r.best)) r.best = [0, 0, 0];
  for (let i = 0; i < 3; i++) r.best[i] = Math.max(0, +r.best[i] || 0);
};
brFix();
const brZero = () => { save.rush = { ok: 0, best: [0, 0, 0] }; };
(FX.onReset = FX.onReset || []).push(brZero);
let brUp = save.up; /* core "Erase progress" swaps save.up for a fresh object: reset the rush too */
let on = false, t = 0, pend = 0, shown = '';
const NB = () => LV.length;
const brD = () => clamp(save.diff | 0, 0, 2);
const fmt = (s, tenths) => {
  const ds = Math.floor(s * 10 + 1e-6), m = Math.floor(ds / 600), sec = Math.floor(ds / 10) % 60;
  return m + ':' + (sec < 10 ? '0' : '') + sec + (tenths ? '.' + (ds % 10) : '');
};
FX.rush = { on: () => on, t: () => t };

/* ---- medal sprites (cached data URLs) ---- */
const MED = [['#fff6c8', '#ffd23c', '#c87a14'], ['#ffffff', '#c8d0da', '#6a7486'], ['#ffd2a0', '#d0803f', '#7a3a14']];
const MN = ['GOLD', 'SILVER', 'BRONZE'];
const brU = {};
const medalU = i => {
  if (brU[i] !== undefined) return brU[i];
  const [c0, c1, c2] = MED[i];
  try {
    brU[i] = sprite('rush-medal' + i, 44, 56, g => {
      g.fillStyle = '#c8321e'; g.fillRect(-14, -28, 10, 22); g.fillStyle = '#2a6ad0'; g.fillRect(4, -28, 10, 22);
      g.fillStyle = '#ff8a5a'; g.fillRect(-14, -28, 3, 22); g.fillStyle = '#7ab0ff'; g.fillRect(4, -28, 3, 22);
      g.fillStyle = c2; g.fillRect(-8, -10, 16, 5);
      ell(g, 0, 10, 18, 18, c2); ell(g, -1, 9, 16, 16, c1); ell(g, -3, 6, 9, 9, c0); ell(g, 0, 10, 11, 11, c1);
      g.beginPath();
      for (let j = 0; j < 10; j++) { const a = j / 10 * TAU, q = j % 2 ? 4 : 9; g.lineTo(Math.sin(a) * q, 10 - Math.cos(a) * q); }
      g.closePath(); g.fillStyle = c2; g.fill();
      g.fillStyle = '#ffffff'; g.fillRect(-10, 0, 3, 3);
    }).n.toDataURL();
  } catch (e) { brU[i] = ''; }
  return brU[i];
};

/* ---- styles + HUD timer ---- */
const css = document.createElement('style');
css.textContent = `
#rushT{position:absolute;top:7.5cqw;left:0;right:0;text-align:center;font-size:2.8cqw;color:#5fe3d6}
#rushT[hidden]{display:none}
#rushRow:disabled{opacity:.6}
#rushRow b{font:inherit;color:#5fe3d6;margin-left:8px}
.rush-res{display:flex;align-items:center;justify-content:center;gap:14px}
.rush-res img{width:72px;height:90px;flex:none;image-rendering:pixelated;animation:rush-drop .3s steps(3) both}
.rush-res>div{text-align:left}.rush-res p{margin:7px 0}.rush-res .cr{font-size:20px;color:#5fe3d6}
.rush-nb{font:400 12px "Press Start 2P",monospace;color:#ffd23c;animation:rush-blink .6s steps(2) infinite}
.rush-md{font:400 10px "Press Start 2P",monospace}
@keyframes rush-drop{0%{transform:translateY(-24px)}100%{transform:none}}
@keyframes rush-blink{50%{opacity:.35}}`;
document.head.appendChild(css);
const hudEl = $('hud');
const tEl = document.createElement('span');
tEl.id = 'rushT'; tEl.hidden = true;
if (hudEl) hudEl.appendChild(tEl);

/* ---- menu entry ---- */
const _menu = menu;
menu = function (...a) {
  on = false; pend = 0;
  if (save.up !== brUp) { brUp = save.up; brZero(); }
  brFix();
  const r = _menu.apply(this, a);
  try {
    if (!$('rushRow')) {
      const sb = ov.querySelector('button[data-a="shop"]'), row = $('sfoRow') || (sb && sb.closest('.row'));
      if (row) {
        const b = save.rush.best[brD()];
        const lab = save.rush.ok ? 'Boss Rush' + (b ? ` <b>${fmt(b, 0)}</b>` : '') : 'Boss Rush: win stage 8';
        row.insertAdjacentHTML('beforeend', `<button id='rushRow' data-a='rush' ${save.rush.ok ? '' : 'disabled'} title='All 8 bosses against the clock'>${lab}</button>`);
      }
    }
  } catch (e) {}
  return r;
};
ov.addEventListener('click', ev => {
  const b = ev.target.closest('button');
  if (!b || b.disabled || b.dataset.a !== 'rush') return;
  on = true; t = 0; startLevel(0);
});

/* ---- run ---- */
const _sl = startLevel;
startLevel = function (...a) {
  if (on && (a[0] | 0) !== 0) a[0] = 0; /* any restart (pause menu, TRY AGAIN) during a rush starts over from boss 1 */
  const r = _sl.apply(this, a);
  if (on) { waves = 1; wave = 1; waveT = 0; banner = 3; bannerTxt = 'Boss Rush\n8 bosses'; t = 0; pend = 1; shown = ''; }
  return r;
};
const _mb = mkBoss;
mkBoss = function (...a) {
  const r = _mb.apply(this, a);
  if (on && boss && boss.max > 0) boss.hp = boss.max = Math.max(1, Math.round(boss.max * .8));
  return r;
};
const _upd = update;
update = function (...a) {
  const r = _upd.apply(this, a);
  if (on && state === 'play') {
    const dt = +a[0] || 0;
    if (!(clearT > 0 && li >= NB() - 1)) t += dt; /* clock stops on the final boss kill */
    if (clearT > 0 && clearT < 1.6 && li < NB() - 1) {
      clearT = 0; flashA = Math.max(flashA, .5); setScene(li + 1);
      wave = waves = 1; bossWarn = 0;
      if (P) P.hp = Math.min(P.max, P.hp + 30);
      pk.push({ k: 'heal', x: W / 2 - 40, y: -20, t: 0 }, { k: 'bomb', x: W / 2 + 40, y: -20, t: 0 });
      banner = 1.6; bannerTxt = 'Boss ' + (li + 1) + ' / ' + NB(); pend = 1;
      beep(520, .12, 'square', .05, 780);
    }
    /* core replaces our banner with its boss warning on the next frame: put the rush count into it */
    if (pend && bossWarn > 0 && /^Warning/.test(bannerTxt)) {
      bannerTxt = (li ? 'Boss ' + (li + 1) + ' / ' + NB() : 'Boss Rush!\nBoss 1 / ' + NB()) + '\n' + lv.n;
      pend = 0;
    }
  }
  return r;
};

/* ---- results ---- */
const _ld = levelDone;
levelDone = function (...a) {
  const fin = li === NB() - 1;
  if (!on) {
    if (fin) { brFix(); save.rush.ok = 1; }
    return _ld.apply(this, a);
  }
  const unl = save.unl;
  const r = _ld.apply(this, a);
  save.unl = unl;
  if (fin) {
    try {
      brFix();
      const d = brD(), old = save.rush.best[d], tt = Math.round(t * 10) / 10, nb = !old || tt < old;
      if (nb) save.rush.best[d] = tt;
      const m = tt < 135 ? 0 : tt < 180 ? 1 : tt < 240 ? 2 : -1;
      const img = m >= 0 && medalU(m) ? `<img alt="${MN[m]} medal" src="${medalU(m)}">` : '';
      const h = ov.querySelector('h2') || ov.querySelector('h1');
      const html = `<h2>BOSS RUSH CLEAR</h2><div class='rush-res'>${img}<div><p class='cr'>${fmt(tt, 1)}</p>` +
        (m >= 0 ? `<p class='rush-md'>${MN[m]} MEDAL</p>` : '') + (nb ? `<p class='rush-nb'>NEW BEST!</p>` : '') +
        `<p class='rush-md'>${DIFF[d] || ''}</p></div></div>`;
      for (const p of ov.querySelectorAll('p')) if (/^You beat/.test(p.textContent)) p.textContent = 'All 8 bosses down in one run!';
      if (h) h.insertAdjacentHTML('afterend', html);
      else ov.insertAdjacentHTML('afterbegin', html);
    } catch (e) {}
  }
  store();
  return r;
};
const _go = gameOver;
gameOver = function (...a) {
  const r = _go.apply(this, a);
  if (on) {
    try {
      const big = ov.querySelector('button.big');
      const p = `<p>Reached boss ${li + 1} / ${NB()}</p>`;
      if (big) big.insertAdjacentHTML('beforebegin', p); else ov.insertAdjacentHTML('beforeend', p);
      for (const b of ov.querySelectorAll('button[data-a="play"]')) b.dataset.i = '0'; /* TRY AGAIN restarts the rush */
    } catch (e) {}
  }
  return r;
};

/* ---- HUD timer ---- */
const _draw = draw;
draw = function (...a) {
  const r = _draw.apply(this, a);
  const vis = on && state === 'play';
  if (tEl.hidden === vis) tEl.hidden = !vis;
  if (vis) { const s = fmt(t, 1); if (s !== shown) { shown = s; tEl.textContent = s; } }
  return r;
};
