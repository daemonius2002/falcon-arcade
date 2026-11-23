/* 01-settings: settings store (FX.settings), Options screen and Pause menu with a 3-2-1 resume countdown.
   Wraps draw (flash clamp, calm frozen pause picture, countdown digits), hudDom (pause edge detector),
   menu (Options button) and startLevel (reset pause state). Stores save.settings = {key: value}. */
if (!save.settings || typeof save.settings !== 'object') save.settings = {};
const DEFS = [];
const findDef = k => DEFS.find(d => d.k === k);
FX.settings = {
  register(def) { if (!def || !def.k || findDef(def.k)) return; DEFS.push(def); },
  get(k, dflt) {
    const s = save.settings || {};
    if (Object.prototype.hasOwnProperty.call(s, k)) return s[k];
    const d = findDef(k); return d && d.def !== undefined ? d.def : dflt;
  },
  set(k, v) {
    if (!save.settings) save.settings = {};
    save.settings[k] = v; store();
    const d = findDef(k); if (d && d.on) { try { d.on(v); } catch (e) {} }
  },
  open(back) { optBack = back; renderOpts(); },
  list() { return DEFS.slice(); }
};
(FX.onReset = FX.onReset || []).push(() => { save.settings = {}; });
let reduced = false;
try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
FX.settings.register({ k: 'flash', n: 'Screen flash', opts: [['full', 'Full'], ['soft', 'Soft']], def: reduced ? 'soft' : 'full' });

/* ---------- styles for the options rows ---------- */
const st = document.createElement('style');
st.textContent = `.sfo-g .it{grid-template-columns:minmax(0,1fr) auto}
.sfo-g .it>div{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.sfo-g .it button{min-width:0;min-height:40px;padding:6px 10px;font-size:15px}
.it .sfo-k,.sfo-k{font:400 11px "Press Start 2P",monospace;opacity:.75;line-height:1.9}`;
document.head.appendChild(st);

/* ---------- options screen ---------- */
let optBack = 'menu', pmOpen = false;
const esc = s => String(s).replace(/[&<>"']/g, ch => '&#' + ch.charCodeAt(0) + ';');
function renderOpts() {
  pmOpen = optBack === 'pause';
  const rows = DEFS.map(d => {
    const cur = FX.settings.get(d.k);
    return `<div class="it"><b>${esc(d.n)}</b><div>${(d.opts || []).map(o =>
      `<button data-a="set-opt" data-k="${esc(d.k)}" data-v="${esc(o[0])}" class="${String(o[0]) === String(cur) ? 'on' : ''}" aria-pressed="${String(o[0]) === String(cur)}">${esc(o[1])}</button>`).join('')}</div></div>`;
  }).join('');
  show(`<h2>OPTIONS</h2><div class="shop sfo-g">${rows || '<p class="sm">Nothing to set yet</p>'}</div><button class="big" data-a="opt-back">BACK</button>`);
}

/* ---------- pause menu ---------- */
let was = false, quitArm = 0, cd = 0, cdStep = -1; // cd: countdown start time (0 = off)
function openPause() {
  cd = 0; cdStep = -1; quitArm = 0; pmOpen = true; optBack = 'pause';
  show(`<h2>PAUSED</h2><p class="sm">Stage ${li + 1} - ${esc(lv.n)}</p>
 <button class="big" data-a="pm-resume">RESUME</button>
 <div class="row"><button data-a="play" data-i="${li}">Restart</button><button data-a="opt-pause">Options</button><button data-a="pm-quit">Menu</button></div>
 <div class="it"><span class="sfo-k">Move: drag / mouse / arrows<br>Bomb: red button or Space</span></div>`);
}
function closeAll() { paused = false; was = false; cd = 0; cdStep = -1; pmOpen = false; quitArm = 0; $('bPause').textContent = 'Pause'; }
ov.addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b || b.disabled) return;
  const a = b.dataset.a;
  if (a === 'set-opt') { const d = findDef(b.dataset.k); if (!d) return; const o = (d.opts || []).find(o => String(o[0]) === b.dataset.v); FX.settings.set(d.k, o ? o[0] : b.dataset.v); renderOpts(); }
  else if (a === 'opt-back') { if (optBack === 'pause' && state === 'play' && paused) openPause(); else { pmOpen = false; menu(); } }
  else if (a === 'opt-open') FX.settings.open('menu');
  else if (a === 'opt-pause') FX.settings.open('pause');
  else if (a === 'pm-resume') { if (state !== 'play' || !paused) { hide(); return; } hide(); pmOpen = false; cd = performance.now(); cdStep = -1; }
  else if (a === 'pm-quit') { if (quitArm) { closeAll(); menu(); } else { quitArm = 1; b.textContent = 'Sure?'; } }
});

/* ---------- countdown digits (5x7 block font) ---------- */
const DIG = {
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110']
};
function bigDigit(n) {
  const g = DIG[n]; if (!g) return;
  const S = 12, x0 = 240 - 30, y0 = 320 - 42;
  for (let pass = 0; pass < 2; pass++) for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) if (g[y][x] === '1') {
    if (pass) { px(x0 + x * S, y0 + y * S, S, S, '#ffd23c'); px(x0 + x * S, y0 + y * S, S, 2, '#fff6c8'); }
    else px(x0 + x * S + 4, y0 + y * S + 4, S, S, '#000');
  }
}

/* ---------- wrappers ---------- */
const _draw = draw;
draw = function () {
  if (FX.settings.get('flash') === 'soft') flashA = Math.min(flashA, .25);
  let r;
  if (state === 'play' && paused) {
    const s0 = shake, f0 = flashA; shake = 0; flashA = 0;
    try { r = _draw.apply(this, arguments); } finally { shake = s0; flashA = f0; }
  } else r = _draw.apply(this, arguments);
  if (cd) {
    if (state !== 'play' || !paused) { cd = 0; cdStep = -1; }
    else {
      const step = Math.floor((performance.now() - cd) / 500);
      if (step >= 3) { cd = 0; cdStep = -1; beep(990, .15); paused = false; was = false; $('bPause').textContent = 'Pause'; }
      else { if (step !== cdStep) { cdStep = step; beep(660, .08); } c.setTransform(.5, 0, 0, .5, 0, 0); bigDigit(3 - step); }
    }
  }
  return r;
};
const _hudDom = hudDom;
hudDom = function () {
  const r = _hudDom.apply(this, arguments);
  if (state === 'play') {
    if (cd && !paused) { paused = true; was = true; cd = 0; cdStep = -1; $('bPause').textContent = 'Resume'; openPause(); } // Pause pressed during countdown
    else if (paused !== was) { was = paused; if (paused) openPause(); else { pmOpen = false; cd = 0; hide(); } }
    const hb = $('hBn');
    if (paused && (cd || !ov.hidden)) hb.hidden = true;
    else if (paused && hb.hidden && hb.textContent) hb.hidden = false;
  }
  return r;
};
const _menu = menu;
menu = function () {
  const r = _menu.apply(this, arguments);
  closeAll();
  const row = ov.querySelector('.row');
  if (row && !ov.querySelector('[data-a="opt-open"]')) row.insertAdjacentHTML('afterend', `<div class="row" id="sfoRow"><button data-a="opt-open">Options</button></div>`);
  return r;
};
const _startLevel = startLevel;
startLevel = function () { const r = _startLevel.apply(this, arguments); closeAll(); return r; };

/* ---------- auto pause ---------- */
function away() { store(); if (state === 'play' && !paused) pause(); else if (state === 'play' && cd) { cd = 0; cdStep = -1; openPause(); } }
document.addEventListener('visibilitychange', () => { if (document.hidden) away(); });
addEventListener('pagehide', away);

FX.pausemenu = { isOpen: () => state === 'play' && paused && pmOpen && !ov.hidden };
