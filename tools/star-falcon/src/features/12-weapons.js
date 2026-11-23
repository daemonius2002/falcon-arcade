/* 12-weapons: Wing drones (new Hangar line, 3 levels) that fly beside the Falcon and fire with it, and
   Power capsules dropped by enemies: S spread, M magnet, 2 double cash, B bubble (one free hit).
   Wraps shop, startLevel, update, scene, hud, kill, hurt. Stores save.drones = {lv}. Exposes FX.weapons.give(kind). */
if (!save.drones || typeof save.drones !== 'object' || typeof save.drones.lv !== 'number') save.drones = { lv: 0 };
(FX.onReset = FX.onReset || []).push(() => { save.drones = { lv: 0 }; });
const DPR = [1500, 3000, 4500];
const dlv = () => clamp(save.drones && save.drones.lv | 0 || 0, 0, 3);

/* ---------- Hangar row ---------- */
const _shop = shop;
shop = function (back) {
  const r = _shop.apply(this, arguments);
  try {
    const box = ov.querySelector('.shop');
    if (box) {
      const l = dlv(), full = l >= 3, pr = full ? 0 : DPR[l];
      box.insertAdjacentHTML('beforeend', `<div class="it"><div><b>Wing drones</b><span>Little helpers fire with you</span><br>${[0, 1, 2].map(i => `<i class="pip ${i < l ? 'f' : ''}"></i>`).join('')}</div><button data-a="drn-buy" data-b="${back}" ${full || save.cr < pr ? 'disabled' : ''}>${full ? 'Max' : pr + ' $'}</button></div>`);
    }
  } catch (e) {}
  return r;
};
ov.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest('button');
  if (!b || b.disabled || b.dataset.a !== 'drn-buy') return;
  const l = dlv(); if (l >= 3) return;
  const pr = DPR[l]; if (save.cr < pr) return;
  save.cr -= pr; save.drones.lv = l + 1; store(); shop(b.dataset.b);
});

/* ---------- art ---------- */
const droneSp = () => sprite('wpn-drone', 28, 32, g => {
  const half = [0, -14, 3, -6, 13, 7, 13, 11, 4, 9, 0, 12];
  mir(g, half, M1, M0);                                   // lit from the left
  mir(g, [9, 3, 13, 7, 13, 11, 9, 10], '#ff8a2a', '#ffb054'); // orange tips
  g.fillStyle = M2; g.fillRect(-2, 6, 4, 6);
  ell(g, 0, -3, 2.6, 5, '#2fc4ba'); g.fillStyle = '#c8fffa'; g.fillRect(-1, -6, 1, 3);
});
const CAPC = { S: '#ff9a2a', M: '#5fe3d6', 2: '#ffd23c', B: '#f2f5f8' };
const GLY = {                                            // 1 = 2x2 px cell, rows of the letter
  S: ['111', '100', '111', '001', '111'], M: ['10001', '11011', '10101', '10001', '10001'],
  2: ['110', '001', '010', '100', '111'], B: ['110', '101', '110', '101', '110']
};
const glyph = (f, x, y, s, col) => { const g = GLY[f]; for (let r = 0; r < 5; r++) for (let q = 0; q < g[r].length; q++) if (g[r][q] === '1') col(x + q * s, y + r * s); };
const capSp = (k, b) => sprite('wpn-cap-' + k + (b ? 'b' : ''), 32, 24, g => {
  const col = b ? lite(CAPC[k], .3) : CAPC[k];
  ell(g, -7, 0, 8, 9, col); ell(g, 7, 0, 8, 9, col); g.fillStyle = col; g.fillRect(-7, -9, 14, 18);
  g.fillStyle = lite(col, .6); g.fillRect(-8, -8, 16, 2);
  g.fillStyle = dark(col, .3); g.fillRect(-8, 6, 16, 2);
  glyph(k, GLY[k][0].length > 3 ? -6 : -4, -4, 2, (x, y) => { g.fillStyle = '#1a1222'; g.fillRect(x, y, 2, 2); });
});
const bubSp = f => sprite('wpn-bub' + f, 92, 100, g => {
  g.beginPath(); g.ellipse(0, 0, 40, 44, 0, 0, TAU); g.strokeStyle = f ? '#c8fffa' : '#5fe3d6'; g.lineWidth = 4; g.stroke();
  g.fillStyle = '#ffffff'; g.fillRect(-28, -30, 6, 4); g.fillRect(-32, -24, 4, 6);
}, [14, 70, 80]);

/* ---------- runtime ---------- */
let d = [], lastP = null, caps = [], pity = 0, bub = 0, spT = 0;
const fx = { S: 0, M: 0, 2: 0 };
const DUR = { S: 10, M: 12, 2: 10 };
function rebuild() {
  lastP = P; d = [];
  const l = dlv(); if (!l || !P) return;
  const sides = l >= 2 ? [-1, 1] : [-1];
  for (const s of sides) d.push({ s, x: P.x + s * 38, y: P.y + 18, ft: .2 + (s > 0 ? .21 : 0), cd: 0, fl: 0 });
}
function reset() { caps = []; pity = 0; bub = 0; spT = 0; fx.S = fx.M = fx[2] = 0; rebuild(); }
function give(k) {
  k = String(k);
  if (k === 'B') bub = 1; else if (DUR[k]) fx[k] = DUR[k]; else return false;
  beep(700, .2, 'square', .04, 1400); beep(1400, .14, 'triangle', .04, 2100);
  return true;
}
FX.weapons = { give, active: () => ({ S: fx.S, M: fx.M, 2: fx[2], B: bub }), caps: () => caps.length };

const _sl = startLevel;
startLevel = function () { const r = _sl.apply(this, arguments); reset(); return r; };

const _kill = kill;
kill = function (e) {
  const c0 = save.cr;
  const r = _kill.apply(this, arguments);
  if (fx[2] > 0) { const dl = save.cr - c0; if (dl > 0) { save.cr += dl; earned += dl; } }
  if (clearT <= 0 && e) {
    pity++;
    if (caps.length < 2 && (R() < (e.k === 'tank' ? .25 : .05) || pity >= 30)) {
      pity = 0; const q = R() * 100, k = q < 35 ? 'S' : q < 60 ? 'M' : q < 85 ? '2' : 'B';
      caps.push({ k, x0: clamp(e.x, 30, W - 30), x: e.x, y: e.y, t: 0 });
    }
  }
  return r;
};

const _hurt = hurt;
hurt = function () {
  if (bub && P && P.inv <= 0 && P.dead <= 0) {
    bub = 0; P.inv = .8; shake = Math.max(shake, 4);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; pt.push({ x: P.x + Math.cos(a) * 34, y: P.y + Math.sin(a) * 38, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, l: .4, c: i % 2 ? '#5fe3d6' : '#c8fffa', s: 4 }); }
    beep(900, .12, 'triangle', .05, 300);
  }
  return _hurt.apply(this, arguments);
};

const _upd = update;
update = function (dt) {
  if (P !== lastP) rebuild();
  const alive = P && P.dead <= 0;
  if (alive && dlv() >= 3) for (const o of d) {
    o.cd -= dt; if (o.cd > 0) continue;
    for (const b of eb) { if (b.dead) continue; if ((b.x - o.x) ** 2 + (b.y - o.y) ** 2 < 196) {
      b.dead = 1; b.y = H + 999; o.cd = 4; o.fl = .12;
      for (let i = 0; i < 4; i++) pt.push({ x: o.x, y: o.y - 6, vx: rnd(-90, 90), vy: rnd(-90, 40), l: .25, c: '#ffffff', s: 2 });
      beep(1500, .04); break; } }
  }
  if (alive && fx.M > 0) for (const p of pk) { const dx = P.x - p.x, dy = P.y - p.y, q = Math.hypot(dx, dy); if (q > 1) { const s = Math.min(q, 420 * dt) / q; p.x += dx * s; p.y += dy * s; } }
  const r = _upd.apply(this, arguments);
  if (state !== 'play' || !P) return r;
  if (P !== lastP) rebuild();
  for (const k in fx) if (fx[k] > 0) fx[k] -= dt;
  if (P.dead <= 0) {
    for (const o of d) {
      const tx = P.x + o.s * 38, ty = P.y + 18, m = Math.min(1, dt * 9);
      o.x += (tx - o.x) * m; o.y += (ty - o.y) * m; o.fl -= dt;
      o.ft -= dt; if (o.ft <= 0) { o.ft = .42 * (P.rapid > 0 ? .55 : 1); pb.push({ x: o.x, y: o.y - 12, vx: 0, vy: -560, d: 1, k: 0 }); }
    }
    if (fx.S > 0) { spT -= dt; if (spT <= 0) { spT = .2; for (const s of [-1, 1]) pb.push({ x: P.x + s * 14, y: P.y - 14, vx: s * 240, vy: -560, d: 1, k: 0 }); } }
  }
  const al = P.dead <= 0;
  for (const p of caps) {
    p.t += dt; p.y += 70 * dt;
    if (al) {
      const dx = P.x - p.x, dy = P.y - p.y, q = Math.hypot(dx, dy);
      if (q < 90 || fx.M > 0) { const s = Math.min(q, (q < 90 ? 220 : 420) * dt) / (q || 1); p.x0 += dx * s; p.y += dy * s; }
      if (q < 28) { p.dead = 1; give(p.k); continue; }
    }
    p.x = p.x0 + Math.sin(p.t * 3) * 20 * Math.min(1, p.t);
  }
  caps = caps.filter(p => !p.dead && p.y < H + 30);
  return r;
};

const _scene = scene;
scene = function () {
  const r = _scene.apply(this, arguments);
  if (!P) return r;
  const bk = Math.floor(T * 4) % 2;
  for (const p of caps) put(capSp(p.k, bk), p.x, p.y);
  if (P.dead <= 0) {
    const sp = droneSp(), fk = Math.floor(T * 20) % 2;
    for (const o of d) {
      if (lv.gnd) put(sp, o.x + 8, o.y + 14, { img: sp.s, a: .35 });
      px(o.x - 2, o.y + 12, 4, 6 + fk * 4, '#ff8a1e'); px(o.x, o.y + 12, 2, 2 + fk * 2, '#ffe27a');
      put(sp, o.x, o.y, { fl: o.fl > 0 });
    }
    if (bub && (P.inv <= 0 || Math.floor(T * 12) % 2)) put(bubSp(Math.floor(T * 3) % 2), P.x, P.y + 2, { a: .85 });
  }
  return r;
};

const _hud = hud;
hud = function () {
  const r = _hud.apply(this, arguments);
  let y = 88;
  for (const k of ['S', 'M', '2']) {
    if (fx[k] <= 0 || y > 124) continue;
    const col = CAPC[k], q = clamp(fx[k] / DUR[k], 0, 1);
    const blink = fx[k] < 2 && Math.floor(T * 6) % 2;               // blink when running out
    px(8, y, 14, 14, '#1a1222');
    glyph(k, 15 - GLY[k][0].length, y + 2, 2, (x, yy) => px(x, yy, 2, 2, blink ? '#ffffff' : col));
    px(26, y + 4, 56, 6, '#1a1222'); px(26, y + 4, r2(56 * q), 6, col); px(26, y + 4, r2(56 * q), 2, lite(col, .55));
    y += 18;
  }
  return r;
};
