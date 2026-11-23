/* 04-juice: impact kit - hit-stop (warped frame clock), directional screen shake, impact sparks,
   throttled hit flash + hit tick, and a pixel shockwave for the mega bomb. Provides FX.juice={stop,kick}.
   Wraps frame, update, layer, kill, hurt, bomb, dmg, scene, startLevel. Stores nothing (one setting: shake). */
let stopT = 0, stopS = 1, wt = 0, prevTs = -1;
let tr = 0, dX = 0, dY = 0, kicked = 0;
const stop = (sec, scale) => {
  sec = Math.min(.35, +sec || 0); scale = Math.max(.08, Math.min(1, scale == null ? .1 : +scale));
  if (sec <= 0) return;
  stopS = stopT > 0 ? Math.min(stopS, scale) : scale; stopT = Math.max(stopT, sec);
};
const kick = (a, dx, dy) => {
  a = +a || 0; if (a <= 0) return; tr = Math.min(16, Math.max(tr, a));
  const l = Math.hypot(dx || 0, dy || 0);
  if (l > 0) { dX = dx / l; dY = dy / l; } else { const q = R() * TAU; dX = Math.cos(q); dY = Math.sin(q); }
  kicked = 1;
};
FX.juice = { stop, kick };
if (FX.settings && FX.settings.register) FX.settings.register({ k: 'shake', n: 'Screen shake', opts: [['on', 'On'], ['soft', 'Soft'], ['off', 'Off']], def: 'on' });
const amp = () => { const v = FX.settings && FX.settings.get ? FX.settings.get('shake', 'on') : 'on'; return v === 'off' ? 0 : v === 'soft' ? .4 : 1; };
/* harvest core/other-module shake impulses into our own trauma value */
function harvest() {
  if (shake > 0) {
    if (shake > tr && !kicked) { const q = R() * TAU; dX = Math.cos(q); dY = Math.sin(q); }
    tr = Math.min(16, Math.max(tr, shake));
  }
  shake = 0; kicked = 0;
}

/* ---------- hit-stop: warped clock fed to the previous frame() ---------- */
const _frame = frame;
frame = function (ts) {
  if (prevTs < 0) { prevTs = ts; wt = ts; }
  const d = Math.max(0, ts - prevTs); prevTs = ts;
  stopT = Math.max(0, stopT - d / 1000);
  wt += d * (stopT > 0 ? stopS : 1);
  harvest();
  return _frame(wt);
};

/* ---------- spark sprites (3 frames x 3 colours) ---------- */
const SC = { c: ['#ffe27a', '#fff6c8', [120, 70, 0]], l: ['#5fe3d6', '#e6fffc', [10, 70, 90]], m: ['#ff8a1e', '#ffe27a', [110, 30, 10]] };
const KS = ['c', 'm', 'l'];
const sparkSp = (s, f) => sprite('juice-' + s + f, 18, 18, g => {
  const [a, b] = SC[s];
  if (f === 0) { part(g, [0, -9, 2, -2, 9, 0, 2, 2, 0, 9, -2, 2, -9, 0, -2, -2], a); g.fillStyle = b; g.fillRect(-1, -5, 2, 10); g.fillRect(-5, -1, 10, 2); g.fillStyle = '#fff'; g.fillRect(-1, -1, 2, 2); }
  else if (f === 1) { g.fillStyle = a; g.fillRect(-1, -5, 2, 10); g.fillRect(-5, -1, 10, 2); g.fillStyle = b; g.fillRect(-1, -1, 2, 2); }
  else { g.fillStyle = a; g.fillRect(-3, -3, 6, 6); g.fillStyle = b; g.fillRect(-1, -1, 2, 2); }
}, SC[s][2]);
const drawSp = (sp, x, y) => c.drawImage(sp.n, r2(x) - r2(sp.w / 2), r2(y) - r2(sp.h / 2), sp.w, sp.h);

/* ---------- impact sparks: ring buffer ---------- */
const SPK = [], NSP = 48, LIFE = .12;
for (let i = 0; i < NSP; i++) SPK.push({ x: 0, y: 0, s: 'c', t: 9 });
let spI = 0, spN = 0;
function spark(x, y, k) {
  if (spN >= 10) return; spN++;
  const o = SPK[spI]; spI = (spI + 1) % NSP;
  o.x = x; o.y = y; o.s = KS[k] || 'c'; o.t = 0;
  if (k === 1) kick(2, 0, -1);
}

/* ---------- mega bomb shockwave ---------- */
const BX = new Float32Array(60), BY = new Float32Array(60), BD = new Float32Array(60), BT = new Float32Array(60);
let wv = null, nB = 0;
const WR = 820, WD = .55;
const wRad = t => { const q = Math.min(1, t / WD); return WR * (1 - (1 - q) * (1 - q) * (1 - q)); };
const _bomb = bomb;
bomb = function () {
  const n = P && P.bombs, sx = P ? P.x : 0, sy = P ? P.y : 0;
  let m = 0; const src = eb;
  if (src && src.length) for (let i = 0; i < src.length && m < 60; i++) { const b = src[i]; BX[m] = b.x; BY[m] = b.y; m++; }
  const r = _bomb.apply(this, arguments);
  if (!(P && typeof n === 'number' && P.bombs < n)) return r;
  harvest();
  flashA = Math.min(flashA, .3); stop(.09, .1); kick(10, 0, 1);
  nB = m; for (let i = 0; i < m; i++) { BD[i] = Math.hypot(BX[i] - sx, BY[i] - sy); BT[i] = -1; }
  wv = { x: sx, y: sy, t: 0 };
  beep(120, .5, 'sawtooth', .09, 35); boom(.35);
  return r;
};
function drawWave() {
  const r = wRad(wv.t), x0 = wv.x, y0 = wv.y;
  /* 40 blocks per ring as a floor; denser as it grows so it stays a readable chunky ring */
  const ring = (rr, n, sz, col, every) => {
    if (rr <= 0) return;
    n = Math.max(n, Math.min(200, Math.floor(rr * TAU / (sz + 4))));
    for (let i = 0; i < n; i += every) {
      const a = i / n * TAU + (every > 1 ? TAU / n * .5 : 0), x = x0 + Math.cos(a) * rr - sz / 2, y = y0 + Math.sin(a) * rr - sz / 2;
      if (x < -sz || y < -sz || x > W || y > H) continue;
      px(x, y, sz, sz, col);
    }
  };
  ring(r - 26, 40, 4, '#ff8a1e', 2); ring(r - 14, 40, 6, '#ffd23c', 1); ring(r, 40, 10, '#ffffff', 1);
  for (let i = 0; i < nB; i++) { const a = BT[i]; if (a < 0) continue; const f = Math.floor((wv.t - a) / .05); if (f < 3) drawSp(sparkSp('c', f), BX[i], BY[i]); }
}

/* ---------- update: shake ownership, sparks, boss-down stop, wave clock ---------- */
const _update = update;
update = function (dt) {
  const old = pb, bs = boss;
  for (const b of old) if (b.k === 2 && b.h) b._n = b.h.length;
  spN = 0;
  const r = _update.apply(this, arguments);
  for (const b of old) {
    if (b.dead) spark(b.x, b.y, b.k);
    else if (b.k === 2 && b.h && b.h.length > (b._n || 0)) { for (let i = b._n || 0; i < b.h.length; i++) { const e = b.h[i]; spark(b.x, e ? e.y + (e.r || 0) * .5 : b.y, 2); } b._n = b.h.length; }
  }
  if (bs && !boss) stop(.28, .08);
  tr *= Math.pow(.002, dt || 0);
  harvest();
  if (tr < .3) tr = 0;
  for (const o of SPK) if (o.t < LIFE) o.t += dt || 0;
  if (wv) {
    const r0 = wRad(wv.t); wv.t += dt || 0; const r1 = wRad(wv.t);
    for (let i = 0; i < nB; i++) if (BT[i] < 0 && BD[i] > r0 - 1 && BD[i] <= r1) BT[i] = wv.t;
    if (wv.t >= WD + .16) { wv = null; beep(400, .25, 'triangle', .04, 1600); }
  }
  return r;
};

/* ---------- triggers ---------- */
const _kill = kill;
kill = function (e) { const r = _kill.apply(this, arguments); if (e && e.k === 'tank') stop(.05, .1); return r; };
const _hurt = hurt;
hurt = function () {
  const h = P ? P.hp : 0, wasDead = P ? P.dead > 0 : true;
  const r = _hurt.apply(this, arguments);
  if (P && !wasDead && P.dead > 0) stop(.18, .08); else if (P && P.hp < h) stop(.06, .1);
  return r;
};

/* ---------- flash throttle + hit tick ---------- */
let tickT = -9;
const _dmg = dmg;
dmg = function (e, d) {
  if (!e) return _dmg.apply(this, arguments);
  const h = e.hit, r = _dmg.apply(this, arguments);
  const big = e === boss || (e.r || 0) >= 28; // big sprites: rarer, shorter white flash so the art stays readable
  if (d < 20 && T - (e._lf || -9) < (big ? .3 : .11)) e.hit = Math.max(h || 0, 0); else { e._lf = T; if (big && d < 20) e.hit = Math.min(e.hit, .05); }
  if (d < 20 && (T - tickT >= .07 || T < tickT)) {
    tickT = T; const m = e._m || (e._m = (e.hp || 0) + (d || 0)) || 1;
    beep(300 + 500 * clamp(1 - (e.hp || 0) / m, 0, 1), .03, 'square', .012);
  }
  return r;
};

/* ---------- shake application: offset the world inside core's c.save() ---------- */
const _layer = layer;
layer = function (k, y) {
  if (BG && k === BG.a && state === 'play' && !paused && tr > 0) {
    const A = amp();
    if (A > 0) {
      const t = tr * A, q = Math.cos(T * 55) * t;
      let ox = dX * q + rnd(-t, t) * .35, oy = dY * q + rnd(-t, t) * .35;
      ox = r2(clamp(ox, -10, 10)); oy = r2(clamp(oy, -10, 10));
      if (ox || oy) { px(-12, -12, W + 24, H + 24, '#0d0b14'); c.translate(ox, oy); }
    }
  }
  return _layer.apply(this, arguments);
};

/* ---------- draw sparks + shockwave over the scene ---------- */
const _scene = scene;
scene = function () {
  const r = _scene.apply(this, arguments);
  for (const o of SPK) if (o.t < LIFE) drawSp(sparkSp(o.s, Math.min(2, Math.floor(o.t / LIFE * 3))), o.x, o.y);
  if (wv) drawWave();
  return r;
};

const _start = startLevel;
startLevel = function () {
  for (const o of SPK) o.t = 9;
  wv = null; nB = 0; tr = 0; shake = 0; stopT = 0; stopS = 1; kicked = 0; spN = 0;
  return _start.apply(this, arguments);
};
