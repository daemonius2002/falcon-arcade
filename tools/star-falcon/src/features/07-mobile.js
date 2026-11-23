/* 07-mobile: relative touch "drag" steering (one-finger lock), instant BOMB on touch with a double-spend guard,
   a play-mode thumb bar (big BOMB xN button + Pause + Sound; Arcade/Full hidden for the whole stage, pause included) and safe-area / landscape layout.
   Wraps update (drag pre-step, respawn re-anchor), bomb (0.4 s guard), draw (bar mode), startLevel (reset).
   Stores nothing itself; the 'touch' option lives in save.settings via FX.settings. Exposes FX.touch. */
if (FX.settings) FX.settings.register({ k: 'touch', n: 'Touch control', opts: [['drag', 'Drag'], ['follow', 'Follow']], def: 'drag' });
const tMode = () => { try { return FX.settings ? FX.settings.get('touch', 'drag') : 'drag'; } catch (e) { return 'drag'; } };

/* ---------- layout: safe areas, thumb bar, landscape ---------- */
try {
  const vm = document.querySelector('meta[name=viewport]');
  if (vm && !/viewport-fit/.test(vm.content)) vm.content += ',viewport-fit=cover';
} catch (e) {}
const IN_X = 'env(safe-area-inset-left,0px) - env(safe-area-inset-right,0px)';
const IN_Y = 'env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px)';
const mst = document.createElement('style');
mst.textContent = `html,body{overscroll-behavior:none}
body{padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px);-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}
#cab,#bar{width:min(calc(100vw - ${IN_X}),calc((100vh - ${IN_Y} - 72px)*2/3));width:min(calc(100vw - ${IN_X}),calc((100dvh - ${IN_Y} - 72px)*2/3))}
#bar button{touch-action:manipulation;white-space:nowrap;overflow:hidden}
#bar a{touch-action:manipulation;white-space:nowrap}
body[data-sf=play] #bar a,body[data-sf=play] #bFs{display:none}
body[data-sf=play] #bBomb{flex:3!important}
#bBomb.mob-press{box-shadow:inset 3px 3px 0 #6a1410,inset -3px -3px 0 #ff8a5a,0 0 0 2px #000}
#bBomb.mob-empty{background:#4a2a2a;color:#c9a9a0}
#bFs.mob-nofs{display:none!important}
@media (max-width:419px){#bar{gap:7px;padding-inline:6px}#bar button,#bar a{font-size:15px;padding-inline:2px}}
@media (orientation:landscape) and (max-height:520px){
 body{flex-direction:row;gap:8px}
 #cab{width:auto;height:calc(100vh - 16px);height:calc(100dvh - 16px);aspect-ratio:2/3}
 #bar{flex-direction:column;width:132px;height:calc(100vh - 16px);height:calc(100dvh - 16px);padding:8px 6px}
 #bar #bBomb{flex:3!important;order:5;white-space:normal;line-height:1.7}
}`;
document.head.appendChild(mst);
const bBomb = $('bBomb'), bFs = $('bFs'), bSnd = $('bSnd');
const noMenu = ev => ev.preventDefault();
$('cab').addEventListener('contextmenu', noMenu);
for (const b of document.querySelectorAll('#bar button')) b.addEventListener('contextmenu', noMenu);

/* ---------- canvas rect cache ---------- */
let rect = null;
const reRect = () => { try { rect = cv.getBoundingClientRect(); } catch (e) { rect = null; } };
const fitBar = () => {
  reRect();
  if (!bFs) return;
  if (!document.documentElement.requestFullscreen) bFs.classList.add('mob-nofs');
  if (!bFs.clientWidth) return;                    // hidden (play mode): re-fit when the bar shows it again
  if (bFs.textContent !== 'Full screen') bFs.textContent = 'Full screen';
  if (bFs.scrollWidth > bFs.clientWidth) bFs.textContent = 'Full';   // label from the button's real room
};
addEventListener('resize', () => { fitBar(); sm = -1; });
addEventListener('orientationchange', () => { fitBar(); setTimeout(fitBar, 250); });
document.addEventListener('fullscreenchange', fitBar);
fitBar();
try { document.fonts && document.fonts.ready.then(fitBar); } catch (e) {}
const lpos = ev => {
  if (!rect || !rect.width) reRect();
  const r = rect && rect.width ? rect : { left: 0, top: 0, width: W, height: H };
  return { x: (ev.clientX - r.left) / r.width * W, y: (ev.clientY - r.top) / r.height * H };
};

/* ---------- relative touch steering ---------- */
let tid = null, drag = false, pre = null;        // active pointer, drag mode on, target before core touched it
let fx0 = 0, fy0 = 0, sx0 = 0, sy0 = 0, lfx = 0, lfy = 0, tP = null;
const rt = { x: W / 2, y: H - 90 };
const anchor = () => {
  if (!P) return;
  sx0 = rt.x = P.x; sy0 = rt.y = P.y; fx0 = lfx; fy0 = lfy; tP = P;
};
const steer = () => {
  const nx = sx0 + (lfx - fx0) * 1.3, ny = sy0 + (lfy - fy0) * 1.3;
  rt.x = clamp(nx, 24, W - 24); rt.y = clamp(ny, 44, H - 34);
  if (rt.x !== nx) { sx0 = rt.x; fx0 = lfx; }   // re-anchor at the wall: reversing responds at once
  if (rt.y !== ny) { sy0 = rt.y; fy0 = lfy; }
  target = rt;
};
const snap = () => { pre = target; };
addEventListener('pointerdown', snap, true);     // capture: runs before core's canvas listener
addEventListener('pointermove', snap, true);
cv.addEventListener('pointerdown', ev => {
  if (ev.pointerType !== 'touch') return;
  if (tid !== null && tid !== ev.pointerId) { target = pre; return; }   // extra finger: undo core
  tid = ev.pointerId; drag = tMode() !== 'follow';
  reRect(); const p = lpos(ev); lfx = p.x; lfy = p.y;
  if (drag) { anchor(); if (P) target = rt; else target = pre; }
});
cv.addEventListener('pointermove', ev => {
  if (ev.pointerType !== 'touch' || tid === null) return;
  if (ev.pointerId !== tid) { target = pre; return; }
  if (!drag) return;
  const p = lpos(ev); lfx = p.x; lfy = p.y;
  if (tP !== P) anchor();
  steer();
});
const release = ev => {
  if (tid === null || ev.pointerId !== tid) return;
  tid = null;
  if (drag && P) target = { x: P.x, y: P.y };
  drag = false;
};
cv.addEventListener('pointerup', release);
cv.addEventListener('pointercancel', release);
addEventListener('pointerup', release);          // safety net if the canvas misses the up
addEventListener('pointercancel', release);
addEventListener('blur', () => { if (tid !== null) release({ pointerId: tid }); });

const _upd = update;
update = function (dt) {
  if (drag && tid !== null && P && P.dead <= 0 && tP === P) {
    const dx = rt.x - P.x, dy = rt.y - P.y, d = Math.hypot(dx, dy), st = 900 * dt;
    if (d > 0) { if (d <= st) { P.x = rt.x; P.y = rt.y; } else { P.x += dx / d * st; P.y += dy / d * st; } }
  }
  const r = _upd.apply(this, arguments);
  if (drag && tid !== null && P && tP !== P) { anchor(); target = rt; }   // respawned: steer from the new ship
  return r;
};

/* ---------- bomb: instant on touch, no double spend ---------- */
let lastB = -9;
const _bomb = bomb;
bomb = function () {
  if (T - lastB < .4 && T >= lastB) return;
  const n = P ? P.bombs : 0;
  const r = _bomb.apply(this, arguments);
  if (P && P.bombs < n) lastB = T;
  return r;
};
let pressT = 0;
if (bBomb) bBomb.addEventListener('pointerdown', ev => {
  ev.preventDefault(); audio(); bomb();
  bBomb.classList.add('mob-press'); clearTimeout(pressT);
  pressT = setTimeout(() => bBomb.classList.remove('mob-press'), 120);
});

const _sl = startLevel;
startLevel = function () {
  const r = _sl.apply(this, arguments);
  lastB = -9;
  if (drag && tid !== null) { anchor(); target = rt; }
  return r;
};

/* ---------- thumb bar mode ---------- */
let bm = '', bn = -1, sm = -1;
const _draw = draw;
draw = function () {
  const r = _draw.apply(this, arguments);
  // whole stage (pause + 3-2-1 countdown too) keeps the play layout: Arcade never slides under a thumb on BOMB
  const mode = state === 'play' ? 'play' : 'idle', n = mode === 'play' && P ? P.bombs : -1;
  if (mode !== bm) { bm = mode; document.body.dataset.sf = mode; fitBar(); sm = -1; }
  if (save.mute !== sm && bSnd) {                 // "Sound off" does not fit a narrow play bar: say "Muted"
    sm = save.mute; bSnd.textContent = sm ? 'Sound off' : 'Sound';
    if (sm && bSnd.clientWidth && bSnd.scrollWidth > bSnd.clientWidth) bSnd.textContent = 'Muted';
  }
  if (n !== bn && bBomb) {
    bn = n; bBomb.textContent = n < 0 ? 'BOMB' : n > 0 ? 'BOMB x' + n : 'NO BOMBS';
    bBomb.classList.toggle('mob-empty', n === 0);
  }
  return r;
};

FX.touch = { active: () => tid !== null, mode: tMode };
