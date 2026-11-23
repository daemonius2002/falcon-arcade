/* 06-coach: first-flight coach (non-blocking hint strip on stages 1-2), readable pink/white enemy bullets,
   optional bullet rings + background dim, and a How to play screen from the main menu.
   Wraps update, scene, menu, levelDone, startLevel, hudDom and the BL.eb sprite factory.
   Stores save.coach = {done:{move,autofire,dodge,grab,bomb}}; settings 'tips' and 'rings' via FX.settings. */
if (!save.coach || typeof save.coach !== 'object') save.coach = { done: {} };
if (!save.coach.done || typeof save.coach.done !== 'object') save.coach.done = {};
(FX.onReset = FX.onReset || []).push(() => { save.coach = { done: {} }; });
const SET = FX.settings && FX.settings.register ? FX.settings : null;
if (SET) {
  SET.register({ k: 'tips', n: 'Tips', opts: [['on', 'On'], ['off', 'Off']], def: 'on' });
  SET.register({ k: 'rings', n: 'Bullet rings', opts: [['off', 'Off'], ['on', 'On']], def: 'off' });
}
const opt = (k, d) => { try { const v = SET && SET.get ? SET.get(k, d) : d; return v == null ? d : String(v); } catch (e) { return d; } };

/* ---------- DOM + CSS ---------- */
const css = document.createElement('style');
css.textContent = `#coachTip{position:absolute;left:6%;right:6%;top:22%;font:400 3cqw/1.6 "Press Start 2P",monospace;text-align:center;color:var(--ink);background:#0d0b14cc;border:.6cqw solid var(--cy);padding:2cqw}
@keyframes coachPulse{0%{outline-color:var(--cy)}100%{outline-color:transparent}}
#bBomb.coach-pulse{outline:3px solid var(--cy);outline-offset:2px;animation:coachPulse .5s steps(2,jump-none) infinite}
.coach-how{width:100%;display:grid;gap:8px}
.coach-how,.coach-ctl{font-variant-ligatures:none}
.coach-how .it{grid-template-columns:68px minmax(0,1fr);padding:4px 10px}
.coach-how .it i{display:flex;align-items:center;justify-content:center;width:68px;height:56px}
.coach-how .it img{image-rendering:pixelated;display:block}`;
document.head.appendChild(css);
const tip = document.createElement('div');
tip.id = 'coachTip'; tip.style.display = 'none';
const hudEl = $('hud'); if (hudEl) hudEl.appendChild(tip);
let tipTxt = '', tipOn = false;
let lastPT = '';
addEventListener('pointerdown', ev => { lastPT = ev.pointerType || ''; }, true);
const coarse = () => { try { return matchMedia('(pointer:coarse)').matches; } catch (e) { return false; } };

/* ---------- readable enemy bullets ---------- */
const prevEb = BL.eb;
BL.eb = function () { prevEb(); return sprite('coach-eb', 20, 20, g => { ell(g, 0, 0, 7, 7, '#ff4fa8'); ell(g, 0, 0, 4, 4, '#ffffff'); }, [20, 10, 30]); };
const ringSp = () => sprite('coach-ring', 28, 28, g => { g.beginPath(); g.arc(0, 0, 11, 0, TAU); g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.stroke(); }, 0);
const handSp = () => sprite('coach-hand', 28, 32, g => {   // white cartoon glove pointing up
  g.fillStyle = '#ffffff';
  g.fillRect(-8, -15, 8, 16);            // pointing finger
  g.fillRect(-10, -1, 20, 13);           // fist
  g.fillRect(-14, 1, 6, 7);              // thumb
  g.fillStyle = '#c8c8d8';
  g.fillRect(-2, -13, 2, 14); g.fillRect(-10, 8, 20, 4); g.fillRect(2, 1, 2, 5); g.fillRect(6, 1, 2, 5);
  g.fillStyle = '#5fe3d6'; g.fillRect(-9, 12, 18, 4);   // cuff
});
const chevSp = () => sprite('coach-chev', 24, 16, g => {
  g.fillStyle = '#5fe3d6'; part(g, [-10, -6, -4, -6, 0, -1, 4, -6, 10, -6, 0, 6], '#5fe3d6');
  g.fillStyle = '#c8fffa'; g.fillRect(-9, -6, 4, 2); g.fillRect(5, -6, 4, 2);
});

/* ---------- coach state machine ---------- */
const STEPS = ['move', 'autofire', 'dodge', 'grab', 'bomb'];
const TXT = { autofire: 'YOUR SHIP SHOOTS BY ITSELF', dodge: 'DODGE THE PINK BALLS', grab: 'GRAB THE DROPS', bomb: 'TOO MANY? PRESS BOMB!' };
let st = 0, cur = null, shown = 0, gap = 0, dist = 0, ox = 0, oy = 0, b0 = 0, pick = null;
const isDone = k => !!save.coach.done[k];
const active = () => li <= 1 && opt('tips', 'on') !== 'off' && STEPS.some(k => !isDone(k));
const bombBtn = () => $('bBomb');
const pulse = on => { const b = bombBtn(); if (b) b.classList.toggle('coach-pulse', !!on); };
function finish() { if (!cur) return; save.coach.done[cur] = 1; store(); if (cur === 'bomb') pulse(0); cur = null; pick = null; gap = .8; }
function clearCoach() { if (cur === 'bomb') pulse(0); cur = null; pick = null; gap = 0; }
function begin(k) {
  cur = k; shown = 0; dist = 0; ox = P.x; oy = P.y; b0 = P.bombs;
  if (k === 'bomb') pulse(1);
}
function trig(k) {
  if (k === 'move') return true;
  if (k === 'autofire') return en.some(e => e.y > 0);
  if (k === 'dodge') return eb.some(b => (b.x - P.x) ** 2 + (b.y - P.y) ** 2 < 260 * 260);
  if (k === 'grab') { pick = pk.find(p => p.y > 0) || null; return !!pick; }
  if (k === 'bomb') return P.bombs > 0 && (eb.length >= 6 || P.hp / P.max < .5);
  return false;
}
function tipText() {
  if (cur === 'move') return lastPT === 'touch' || coarse() ? 'DRAG TO FLY' : 'MOVE: MOUSE OR ARROWS';
  return cur ? TXT[cur] : '';
}

const _sl = startLevel;
startLevel = function () { clearCoach(); const r = _sl.apply(this, arguments); st = 0; clearCoach(); return r; };
const _ld = levelDone;
levelDone = function () { clearCoach(); return _ld.apply(this, arguments); };

const _upd = update;
update = function (dt) {
  const r = _upd.apply(this, arguments);
  try {
    dt = +dt || 0; st += dt;
    if (state !== 'play' || !P) { if (cur) clearCoach(); return r; }
    if (!active()) { if (cur) clearCoach(); return r; }
    if (cur) {
      if (banner > 0) return r;                          // hint is hidden under a banner: hold its timer
      shown += dt;
      if (cur === 'move') {
        dist += Math.hypot(P.x - ox, P.y - oy); ox = P.x; oy = P.y;
        if ((dist > 300 && shown >= 2) || shown >= 8) finish();
      } else if (cur === 'autofire') { if (shown >= 2.5) finish(); }
      else if (cur === 'dodge') { if (shown >= 3) finish(); }
      else if (cur === 'grab') { if ((pick && pick.dead) || shown >= 4) finish(); else if (pick && !pk.includes(pick)) pick = pk.find(p => p.y > 0) || pick; }
      else if (cur === 'bomb') { if (P.bombs < b0 || shown >= 6) finish(); }
    } else if (gap > 0) gap -= dt;
    else if (P.dead <= 0 && banner <= 0 && st >= 3.2) { for (const k of STEPS) if (!isDone(k) && trig(k)) { begin(k); break; } }
  } catch (e) {}
  return r;
};

const _scene = scene;
scene = function () {
  const rings = opt('rings', 'off') === 'on';
  if (rings) { c.fillStyle = 'rgba(13,11,20,.3)'; c.fillRect(-20, -20, W + 40, H + 40); }
  const r = _scene.apply(this, arguments);
  try {
    if (rings && eb.length) { const R0 = ringSp(); for (const b of eb) put(R0, b.x, b.y); }
    if (cur && banner <= 0 && P && P.dead <= 0) {
      if (cur === 'move') put(handSp(), P.x + Math.sin(T * 3) * 60, Math.min(P.y + 70, H - 26));
      else if (cur === 'grab') { const p = pick && !pick.dead && pk.includes(pick) ? pick : pk[0]; if (p) put(chevSp(), p.x, p.y - 26 + Math.round(Math.sin(T * 8) * 2) * 2); }
    }
  } catch (e) {}
  return r;
};

const _hd = hudDom;
hudDom = function () {
  const r = _hd.apply(this, arguments);
  const t = state === 'play' && !paused && banner <= 0 && cur ? tipText() : '';
  if (t !== tipTxt) { tipTxt = t; tip.textContent = t; }
  const on = !!t;
  if (on !== tipOn) { tipOn = on; tip.style.display = on ? '' : 'none'; }
  return r;
};

/* ---------- How to play ---------- */
const CTRL = 'Move: mouse, finger or arrow keys / WASD. The ship fires by itself.<br>Bomb: Space or the red button. Pause: P.';
const _menu = menu;
menu = function () {
  clearCoach();
  const r = _menu.apply(this, arguments);
  try {
    for (const p of ov.querySelectorAll('p.sm')) if (p.textContent.includes('Move:')) { p.outerHTML = `<div class='row'><button data-a='coach-how'>How to play</button></div>`; break; }
  } catch (e) {}
  return r;
};
let ICONS = null;
function icons() {
  if (ICONS) return ICONS;
  const rows = [[() => BL.coin(), '+50 $'], [() => BL.heal(), 'Repair'], [() => BL.rapid(), 'Rapid fire'], [() => BL.bomb(), 'Extra bomb'], [() => BL.eb(), 'Dodge this'], [() => eSp('kami', 0), 'Chases you']];
  ICONS = rows.map(([f, t]) => { try { const n = f().n; return { u: n.toDataURL(), w: n.width * 3, h: n.height * 3, t }; } catch (e) { return { u: '', w: 0, h: 0, t }; } });
  return ICONS;
}
function how() {
  const rows = icons().map(i => `<div class="it"><i>${i.u ? `<img alt="" src="${i.u}" width="${i.w}" height="${i.h}">` : ''}</i><b>${i.t}</b></div>`).join('');
  show(`<h2>HOW TO PLAY</h2><div class="coach-how">${rows}</div><p class="sm coach-ctl">${CTRL}</p>
 <div class="row"><button data-a="coach-reset">Show tips again</button></div><button class="big" data-a="menu">BACK</button>`);
}
ov.addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b || b.disabled) return;
  const a = b.dataset.a;
  if (a === 'coach-how') how();
  else if (a === 'coach-reset') {
    save.coach.done = {}; if (SET && SET.set && opt('tips', 'on') === 'off') SET.set('tips', 'on'); store();
    b.textContent = 'Tips are back!'; b.disabled = true;
  }
});
FX.coach = { step: () => cur, reset: () => { save.coach.done = {}; store(); } };
