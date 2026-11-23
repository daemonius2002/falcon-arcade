/* 11-stagepack-b: stage hazards for stages 5-8 - Desert sandstorm gusts, Lava geyser vents,
   Nebula lightning lanes, Mothership laser gates. All telegraphed, dt-based, fixed pools; paused for boss fights.
   Wraps startLevel, update, scene, bomb. Shares FX.busy (polite event flag) and exposes FX.sandstorm. Stores nothing. */
const sbFR = () => FR[save.diff], sbD = () => save.diff;
const sbFree = () => !((FX.busy || 0) > T);
const sbTake = d => { FX.busy = Math.max(FX.busy || 0, T + d); };
const sbQuiet = () => bossWarn > 0 || !!boss;
// ---- state (fixed pools) ----
let sPh = 0, sT = 0, sDir = 1, sW = 0;                       // sand: 0 calm,1 warn,2 blow,3 fade
const SS = []; for (let i = 0; i < 48; i++) SS.push({ x: 0, y: 0, l: 8, v: 500 });
const VN = []; for (let i = 0; i < 4; i++) VN.push({ on: 0, x: 0, y: 0, ph: 0, t: 0 });
let vT = 0;
let nPh = 0, nT = 0, nN = 1, nPrev = -999, nHit = 0;           // neb: 0 idle,1 telegraph,2 strike
const NX = [0, 0], NZ = new Float32Array(56);
const GT = []; for (let i = 0; i < 3; i++) GT.push({ on: 0, y: 0, gx: 0, gw: 150, t: 0, arm: 0 });
let gT = 0, gOff = 0;
FX.sandstorm = { wind: () => sDir * sW };
FX.stagepackB = { get vents() { return VN; }, get gates() { return GT; }, get bolt() { return nPh; }, get lanes() { return NX; } }; // read-only peek (tests, other modules)

function sbReset() {
  sPh = 0; sT = 13; sDir = R() < .5 ? -1 : 1; sW = 0;
  for (const s of SS) { s.x = R() * W; s.y = R() * H; s.l = ri(10, 30) * 2; s.v = rnd(420, 700); }
  for (const v of VN) v.on = 0; vT = 3;
  nPh = 0; nT = 10; nPrev = -999; nHit = 0;
  for (const g of GT) g.on = 0; gT = 3; gOff = 0;
}
const _sbStart = startLevel;
startLevel = function (...a) { const r = _sbStart.apply(this, a); sbReset(); return r; };
sbReset();

// ---- sprites (cached) ----
const sbChev = d => sprite('spb-chev' + d, 32, 20, g => {
  if (d < 0) g.scale(-1, 1);
  for (const o of [-9, 5]) part(g, [o - 5, -8, o + 1, -8, o + 9, 0, o + 1, 8, o - 5, 8, o + 3, 0], o < 0 ? '#ffb054' : '#ffe27a');
});
const sbCrater = f => sprite('spb-crater' + f, 48, 32, g => {
  ell(g, 0, 1, 23, 14, '#8a4a2a'); ell(g, 0, 0, 21, 12, '#5a2a18'); ell(g, -5, -4, 12, 5, '#a8603a');
  ell(g, 0, 2, 15, 8, '#1a0a06'); ell(g, 0, 3, 11, 5, f ? '#ff9a2f' : '#ff5a1f'); ell(g, 0, 3, 5, 2.5, f ? '#ffe08a' : '#ffb054');
});
const sbJet = f => sprite('spb-jet' + f, 40, 120, g => {
  const L = [], q = f ? 1 : -1;             // column of blobs: wide splash base, wobbling body, bubbly crown
  for (let i = 0; i < 11; i++) { const y = 52 - i * 9.6, w = i === 0 ? 19 : i > 8 ? 16 + (i - 9) * 2 : 15 + (i % 2 ? q : -q) * 1.5; L.push([(i % 3 - 1) * q, y, w, 9]); }
  for (const [x, y, w, h] of L) ell(g, x, y, w, h, '#ff5a1f');
  for (const [x, y, w, h] of L) ell(g, x, y - 1, w * .62, h * .85, '#ff9a2f');
  for (const [x, y, w, h] of L) ell(g, x - 1, y - 2, w * .28, h * .7, '#ffe08a');
  for (const s of [-1, 1]) { ell(g, s * (f ? 12 : 15), f ? -56 : -52, 3, 3, '#ff9a2f'); ell(g, s * (f ? 17 : 8), f ? -44 : -57, 2, 2, '#ffe08a'); }
});
const sbEmit = s => sprite('spb-emit' + s, 28, 28, g => {
  if (s < 0) g.scale(-1, 1);
  g.fillStyle = '#3a4352'; g.fillRect(-12, -12, 24, 24); g.fillStyle = '#8a94a4'; g.fillRect(-12, -12, 24, 4);
  g.fillStyle = '#1b1f26'; g.fillRect(-12, 6, 24, 6); g.fillStyle = '#5c6678'; g.fillRect(2, -6, 10, 12);
  g.fillStyle = '#e02a6a'; g.fillRect(6, -4, 6, 8); g.fillStyle = '#ffd0e0'; g.fillRect(8, -2, 2, 2);
});
const sbPost = l => sprite('spb-post' + l, 16, 24, g => {
  g.fillStyle = '#262c38'; g.fillRect(-6, -10, 12, 20); g.fillStyle = '#8a94a4'; g.fillRect(-6, -10, 12, 2); g.fillRect(-6, -10, 2, 20);
  g.fillStyle = l ? '#9ffff0' : '#1f6f6a'; g.fillRect(-4, -6, 8, 6); g.fillStyle = l ? '#40e0d0' : '#174f4a'; g.fillRect(-4, 2, 8, 4);
});

// ---- update ----
function sbSand(dt) {
  const q = sbQuiet();
  sT -= dt;
  if (sPh === 0) { if (sT <= 0 && !q && banner <= 0 && sbFree()) { const bl = sbD() === 0 ? 4 : 5; sbTake(1.2 + bl + .6); sPh = 1; sT = 1.2; beep(200, .25, 'triangle', .03, 120); } }
  else if (q && sPh < 3) { sPh = 3; sT = .6; }
  else if (sPh === 1) { if (sT <= 0) { sPh = 2; sT = sbD() === 0 ? 4 : 5; } }
  else if (sPh === 2) { sW = Math.min(1, sW + dt / .5); if (sT <= 0) { sPh = 3; sT = .6; } }
  if (sPh === 3) { sW = Math.max(0, sW - dt / .6); if (sT <= 0) { sW = 0; sPh = 0; sT = 13; sDir = -sDir; } }
  if (sW <= 0) return;
  const f = sDir * sW;
  if (P.dead <= 0) P.x = clamp(P.x + f * [35, 55, 70][sbD()] * dt, 24, W - 24);
  for (const b of eb) b.x += f * 80 * dt;
  for (const p of pk) p.x = clamp(p.x + f * 40 * dt, 14, W - 14);
  for (const s of SS) { s.x += sDir * s.v * dt; s.y += 50 * dt; if (s.x > W + 30) s.x -= W + 60; if (s.x < -30) s.x += W + 60; if (s.y > H) s.y -= H; }
}
function sbLava(dt) {
  const q = sbQuiet();
  vT -= dt;
  if (vT <= 0) { vT = 5.5 * sbFR(); if (!q && banner <= 0) { const v = VN.find(v => !v.on); if (v) Object.assign(v, { on: 1, x: rnd(50, W - 50), y: -40, ph: 0, t: 0 }); } }
  for (const v of VN) {
    if (!v.on) continue;
    v.y += 60 * dt; v.t -= dt;
    if (v.y > H + 60) { v.on = 0; continue; }
    if (q && v.ph) { v.ph = 0; v.t = 0; }
    if (v.ph === 0) { if (v.y > 140 && v.y < H - 20 && v.t <= 0 && !q && banner <= 0 && sbFree()) { sbTake(1.55); v.ph = 1; v.t = 1; } }
    else if (v.ph === 1) { if (v.t <= 0) { v.ph = 2; v.t = .55; boom(.1); } }
    else if (v.ph === 2) {
      if (P.dead <= 0 && Math.abs(P.x - v.x) < 26 && P.y >= v.y - 110 && P.y <= v.y + 10) hurt(15);
      for (const e of en) if (e !== boss && e.hp > 0 && Math.abs(e.x - v.x) < 26 + e.r && e.y >= v.y - 110 - e.r && e.y <= v.y + 10 + e.r) dmg(e, 40 * dt);
      if (v.t <= 0) { v.ph = 3; v.t = 2.2; }
    } else if (v.t <= 0) { v.ph = 0; v.t = 0; }
  }
}
function sbNeb(dt) {
  const q = sbQuiet();
  nT -= dt;
  if (nPh === 0) {
    if (nT <= 0 && !q && banner <= 0 && sbFree()) {
      nN = sbD() === 2 ? 2 : 1;
      for (let k = 0; k < nN; k++) {
        let x = 0, n = 0;
        do { x = r2(rnd(50, W - 50)); n++; } while (n < 30 && (Math.abs(x - nPrev) < 70 || (k && Math.abs(x - NX[0]) < 70)));
        NX[k] = x; nPrev = x;
      }
      sbTake(1.12); nPh = 1; nT = .9;
    }
  } else if (q && nPh === 1) { nPh = 0; nT = 8 * sbFR(); }
  else if (nPh === 1) {
    if (nT <= 0) {
      nPh = 2; nT = .22; nHit = 1;
      for (let k = 0; k < nN; k++) for (let i = 0; i <= 13; i++) { const o = k * 28 + i * 2; NZ[o] = r2(NX[k] + (i && i < 13 ? (i % 2 ? 1 : -1) * rnd(8, 22) : 0)); NZ[o + 1] = r2(i * H / 13); }
    }
  } else if (nPh === 2) {
    if (nHit) {
      nHit = 0; flashA = Math.max(flashA, .15); boom(.18);
      for (let k = 0; k < nN; k++) {
        const x = NX[k];
        if (P.dead <= 0 && Math.abs(P.x - x) < 31) hurt(15);
        for (const e of en) if (e !== boss && e.hp > 0 && Math.abs(e.x - x) < 22 + e.r) dmg(e, 6);
      }
    }
    if (nT <= 0) { nPh = 0; nT = 8 * sbFR(); }
  }
}
function sbShip(dt) {
  const q = sbQuiet();
  gT -= dt;
  if (gT <= 0) { gT = 9 * sbFR(); if (!q && banner <= 0 && wave < waves) { const g = GT.find(g => !g.on); if (g) Object.assign(g, { on: 1, y: -30, gx: r2(rnd(90, W - 90)), gw: [190, 150, 130][sbD()], t: 0, arm: 0 }); } }
  for (const g of GT) {
    if (!g.on) continue;
    g.y += 60 * dt;
    if (g.y > H + 40) { g.on = 0; g.arm = 0; continue; }
    if (q || T < gOff) { g.arm = 0; continue; }
    if (!g.arm) { if (g.y > 10 && g.y < H - 60 && banner <= 0 && sbFree()) { sbTake(2.3); g.arm = 1; g.t = 0; beep(240, .1, 'sawtooth', .03); } continue; }
    g.t += dt;
    if (g.t >= 3.1) { g.arm = 0; continue; }
    if (g.t >= .9 && g.t < 2.3 && P.dead <= 0 && Math.abs(P.y - g.y) < 14 && Math.abs(P.x - g.gx) > g.gw / 2 - 9) hurt(12);
  }
}
const _sbUpd = update;
update = function (...a) {
  const r = _sbUpd.apply(this, a), dt = a[0] || 0;
  if (state !== 'play' || !P) return r;
  const th = lv.th;
  if (th === 'sand') sbSand(dt); else if (th === 'lava') sbLava(dt); else if (th === 'neb') sbNeb(dt); else if (th === 'ship') sbShip(dt);
  return r;
};

const _sbBomb = bomb;
bomb = function (...a) {
  const b0 = P ? P.bombs : 0, r = _sbBomb.apply(this, a);
  if (P && P.bombs < b0) {
    for (const v of VN) if (v.on && (v.ph === 1 || v.ph === 2)) { v.ph = 3; v.t = 2.2; }
    gOff = T + 2.5; for (const g of GT) g.arm = 0;
  }
  return r;
};

// ---- draw ----
function sbBolt(o, w, col) {
  for (let i = 0; i < 13; i++) {
    const x0 = NZ[o + i * 2], y0 = NZ[o + i * 2 + 1], x1 = NZ[o + i * 2 + 2], y1 = NZ[o + i * 2 + 3];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 6));
    for (let s = 0; s < n; s++) { const t = s / n; px(x0 + (x1 - x0) * t - w / 2, y0 + (y1 - y0) * t, w, 8, col); }
  }
}
const _sbScene = scene;
scene = function (...a) {
  const th = lv.th, fk = Math.floor(T * 12) % 2;
  if (th === 'lava') for (const v of VN) if (v.on) {
    put(sbCrater(v.ph === 1 || v.ph === 2 ? fk : 0), v.x, v.y);
    if (v.ph === 1 && Math.floor(T * 10) % 2) for (let k = 0; k < 8; k++) { const q = k / 8 * TAU + T * 2; px(v.x + Math.cos(q) * 34 - 2, v.y + Math.sin(q) * 34 * .7 - 2, 4, 4, k % 2 ? '#ffe08a' : '#ff5a1f'); }
  }
  const r = _sbScene.apply(this, a);
  if (th === 'lava') for (const v of VN) if (v.on && v.ph === 2) {
    put(sbJet(Math.floor(T * 16) % 2), v.x, v.y - 52);
    for (let k = 0; k < 4; k++) px(v.x + (k - 1.5) * 12, v.y - 112 - (T * 90 + k * 11) % 22, 4, 4, k % 2 ? '#ffe08a' : '#ff9a2f');
  }
  if (th === 'neb') {
    if (nPh === 1 && Math.floor(T * 10) % 2) for (let k = 0; k < nN; k++) for (let y = (Math.floor(T * 60) % 28); y < H; y += 28) px(NX[k] - 2, y, 4, 10, '#ff8ad8');
    if (nPh === 1) for (let k = 0; k < nN; k++) { const b = Math.floor(T * 10) % 2 ? '#ff8ad8' : '#ffffff'; px(NX[k] - 10, 0, 20, 4, b); px(NX[k] - 6, 4, 12, 4, b); px(NX[k] - 2, 8, 4, 4, b); }
    if (nPh === 2) for (let k = 0; k < nN; k++) { sbBolt(k * 28, fk ? 18 : 14, '#b030e0'); sbBolt(k * 28, 8, '#ffffff'); }
  }
  if (th === 'ship') for (const g of GT) if (g.on) {
    const y = r2(g.y), l = g.gx - g.gw / 2, rr = g.gx + g.gw / 2, on = g.arm && g.t >= .9 && g.t < 2.3, wn = g.arm && g.t < .9;
    if (wn && Math.floor(T * 10) % 2) { px(20, y - 1, r2(l - 28), 2, '#ff4060'); px(rr + 8, y - 1, r2(W - 28 - rr), 2, '#ff4060'); }
    if (on) {
      const h = fk ? 10 : 8;
      for (const [x0, x1] of [[20, l - 8], [rr + 8, W - 20]]) { const L = r2(x1 - x0); px(x0, y - h / 2 - 2, L, h + 4, '#5a0a2a'); px(x0, y - h / 2, L, h, '#e02a6a'); px(x0, y - 2, L, 4, fk ? '#ffffff' : '#ffc0d8'); }
      for (const x of [l - 12, rr + 8]) px(x + (fk ? 0 : 2), y - 6, 4, 12, '#ffffff');
    }
    put(sbEmit(1), 10, y); put(sbEmit(-1), W - 10, y);
    put(sbPost(on || (wn && fk) ? 1 : 0), l, y); put(sbPost(on || (wn && fk) ? 1 : 0), rr, y);
  }
  if (th === 'sand') {
    if (sPh === 1 && Math.floor(T * 6) % 2) for (const x of [W / 2 - 64, W / 2, W / 2 + 64]) put(sbChev(sDir), x, 90);
    if (sW > 0) { c.globalAlpha = .16 * sW; c.fillStyle = '#e0a060'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    const n = Math.round(48 * sW);
    for (let i = 0; i < n; i++) {
      const s = SS[i], hx = sDir > 0 ? s.x + s.l : s.x - 6;
      px(s.x, s.y + 2, s.l, 2, '#7a3618'); px(s.x, s.y, s.l, 2, '#f0c090'); if (i % 3 === 0) px(hx, s.y, 6, 2, '#ffe0c0');
    }
  }
  return r;
};
