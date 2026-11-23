/* 09-miniboss: once per stage, halfway through the waves, a Wing Captain mini-boss (4 art variants, 4 telegraphed attack styles).
   Wraps eSp, spawnWave, updEnemy, kill, scene, update, startLevel. Shares FX.busy (polite event flag) and FX.miniboss.
   Survives core's ram-kill with a guarded fallback (if core lacks the e.heavy spare). Stores nothing. */
DEF.cap = { hp: 40, r: 30, v: 150 };
let mbDone = 0, mbCap = null;
FX.miniboss = { get cap() { return mbCap; }, get done() { return mbDone; } };

/* ---- art: 112x96, nose pointing down, stage colour hull panels ---- */
function mbArt(g, i) {
  const col = LV[i].ec, hi = lite(col, .4), lo = dark(col, .5), met = (a, b) => lin(g, a, 0, b, 0, M0, M1, M2);
  const v = i % 4;
  const engines = xs => { for (const x of xs) { g.fillStyle = DK; g.fillRect(x - 7, -46, 14, 12); g.fillStyle = '#8a94a4'; g.fillRect(x - 7, -46, 14, 3); } };
  const cockpit = (y, r) => { ell(g, 0, y, r + 3, r + 5, DK); ell(g, 0, y, r, r + 2, lin(g, 0, y - r, 0, y + r, '#c8fffa', '#2fc4ba', '#0e6a72')); g.fillStyle = '#fff'; g.fillRect(-r * .5, y - r * .6, 3, 5); };
  const gun = (x, y) => { g.fillStyle = DK; g.fillRect(x - 5, y - 4, 10, 14); g.fillStyle = '#ffe27a'; g.fillRect(x - 2, y + 6, 4, 4); };
  if (v === 0) { // wide wings
    engines([-14, 14]);
    part(g, sym([0, -38, 54, -14, 54, 2, 40, 10, 16, 14]), met(-54, 54));
    mir(g, [20, -22, 50, -10, 50, -2, 22, 4], col, lo);
    mir(g, [26, -18, 46, -9, 46, -5, 28, -6], hi, col);
    g.fillStyle = DK; for (const s of [-1, 1]) g.fillRect(s * 52 - 3, -10, 6, 18);
    part(g, sym([0, -40, 16, -30, 18, 14, 10, 34, 0, 44]), met(-18, 18));
    part(g, sym([0, -30, 10, -22, 11, 10, 0, 30]), lin(g, -11, 0, 11, 0, hi, col, lo));
    cockpit(-8, 6); gun(0, 34);
    g.fillStyle = '#ffe27a'; for (const s of [-1, 1]) g.fillRect(s * 34 - 2, 0, 4, 4);
  } else if (v === 1) { // twin hulls
    engines([-26, 26]);
    part(g, [-26, -6, 26, -6, 26, 10, -26, 10], met(-26, 26));
    g.fillStyle = lo; g.fillRect(-20, 6, 40, 4);
    for (const s of [-1, 1]) {
      const x = s * 26;
      part(g, [x - 14, -36, x + 14, -36, x + 16, 16, x + 6, 40, x - 6, 40, x - 16, 16], met(x - 16, x + 16));
      part(g, [x - 8, -30, x + 8, -30, x + 9, 14, x, 30, x - 9, 14], lin(g, x - 9, 0, x + 9, 0, hi, col, lo));
      g.fillStyle = '#ffe27a'; g.fillRect(x - 2, 0, 4, 6);
      gun(x, 32);
    }
    part(g, sym([0, -22, 12, -14, 12, 14, 0, 24]), met(-12, 12));
    cockpit(0, 6);
  } else if (v === 2) { // ring
    engines([-10, 10]);
    ell(g, 0, 2, 50, 42, met(-50, 50));
    ell(g, 0, 2, 42, 34, col);
    ell(g, 2, 6, 38, 30, lo);
    ell(g, 0, 2, 30, 22, '#14101c');
    for (let j = 0; j < 8; j++) { const a = j / 8 * TAU; g.fillStyle = j % 2 ? hi : '#ffe27a'; g.fillRect(Math.cos(a) * 46 - 3, 2 + Math.sin(a) * 38 - 3, 6, 6); }
    part(g, sym([0, -40, 12, -30, 14, 10, 8, 32, 0, 42]), met(-14, 14));
    part(g, sym([0, -30, 7, -24, 8, 8, 0, 26]), lin(g, -8, 0, 8, 0, hi, col, lo));
    for (const s of [-1, 1]) part(g, [s * 12, -2, s * 32, -6, s * 32, 6, s * 12, 8], M1);
    cockpit(-8, 5); gun(0, 34);
  } else { // arrow
    engines([-22, 0, 22]);
    part(g, sym([0, -36, 52, -36, 52, -26, 6, 44, 0, 46]), met(-52, 52));
    part(g, sym([0, -28, 40, -28, 40, -24, 4, 30, 0, 32]), lin(g, -40, 0, 40, 0, hi, col, lo));
    part(g, sym([0, -14, 20, -26, 26, -26, 2, 14, 0, 16]), lo);
    g.fillStyle = DK; for (const s of [-1, 1]) g.fillRect(s * 46 - 3, -34, 6, 14);
    g.fillStyle = '#ffe27a'; for (const s of [-1, 1]) g.fillRect(s * 30 - 2, -32, 4, 4);
    cockpit(-14, 6); gun(0, 36);
  }
}
const _mbSp = eSp;
eSp = function (k, i, v) {
  if (k === 'cap') return sprite('mb-cap-' + i, 112, 96, g => mbArt(g, i), OL);
  return _mbSp.apply(this, arguments);
};

/* ---- spawn ---- */
const _mbWave = spawnWave;
spawnWave = function () {
  const r = _mbWave.apply(this, arguments);
  const half = Math.floor(waves / 2);
  // wave===half is the slot; if a stage event holds FX.busy we retry on the next waves (never in the last one)
  if (!mbDone && wave >= half && wave < waves - 1 && !boss && !((FX.busy || 0) > T)) {
    mbDone = 1; FX.busy = T + 22;
    if (banner <= 0) { banner = 2; bannerTxt = 'Watch out!\nWing Captain'; }
    const e = mk('cap', W / 2, -70, { hp: Math.ceil(40 + 18 * li), heavy: 1, v: 150 + 50 * li });
    e.mx = e.hp; e.cd = 1.2; e.tel = 0; e.str = 0; e.esc = 3; e.st = 0; e.pat = li % 4; e.ramT = -9;
    mbCap = e;
    beep(180, .5, 'sawtooth', .06, 90);
  }
  return r;
};

/* ---- behaviour ---- */
function mbFire(e) {
  const fr = FR[save.diff], mx = e.x, my = e.y + 40;
  if (e.pat === 0) { const a = aim({ x: mx, y: my }); for (let j = -1; j <= 1; j++) shoot(mx, my, a + j * .16); e.cd = 1.8 * fr; }
  else if (e.pat === 1) { for (let j = 0; j < 8; j++) shoot(mx, my - 10, j / 7 * Math.PI, 140); e.cd = 2.6 * fr; }
  else if (e.pat === 2) { e.str = 1.2; e.sf = 0; e.cd = 2 * fr; }
  else {
    if (e.esc <= 0 && en.filter(q => q.k === 'kami').length <= 2) { mk('kami', e.x - 50, e.y + 10); mk('kami', e.x + 50, e.y + 10); e.esc = 5 * fr; }
    shoot(mx, my, aim({ x: mx, y: my })); e.cd = 1.5 * fr;
  }
  beep(520, .08, 'square', .03);
}
const _mbUpd = updEnemy;
updEnemy = function (e, dt) {
  const r = _mbUpd.apply(this, arguments);
  if (e.k !== 'cap') return r;
  if (e.t < 12 && e.hp > 0) waveT = Math.max(waveT, .6);
  if (e.t > 22) { e.y += 220 * dt; e.tel = 0; e.str = 0; return r; }
  if (e.y < 130) { e.y = Math.min(130, e.y + 90 * dt); return r; }
  e.st += dt; e.x = W / 2 + Math.sin(e.st * .9) * 150;
  e.esc -= dt;
  if (e.str > 0) { // sweeping stream
    e.str -= dt; e.sf -= dt;
    if (e.sf <= 0) { e.sf = .18; shoot(e.x, e.y + 40, Math.PI / 2 + Math.sin(T * 2) * .6); beep(700, .04, 'square', .015); }
    return r;
  }
  if (e.tel > 0) {
    const a = Math.floor(e.tel / .1); e.tel -= dt;
    if (Math.floor(e.tel / .1) !== a) e.hit = .07;
    if (e.tel <= 0) mbFire(e);
    return r;
  }
  e.cd -= dt;
  if (e.cd <= 0 && P.dead <= 0) { e.tel = .4; e.hit = .07; beep(300, .4, 'square', .035, 600); }
  return r;
};

const _mbKill = kill;
kill = function (e) {
  if (e && e.k === 'cap') e._k = 1;
  const r = _mbKill.apply(this, arguments);
  if (e && e.k === 'cap') {
    for (let j = 0; j < 5; j++) pk.push({ k: 'coin', x: e.x + rnd(-40, 40), y: e.y + rnd(-24, 24), t: 0 });
    pk.push({ k: 'heal', x: e.x, y: e.y, t: 0 });
    explode(e.x, e.y, 20, 1);
    FX.score && FX.score.add && FX.score.add(3000, e.x, e.y);
    beep(440, .4, 'triangle', .07, 990);
    if (mbCap === e) mbCap = null;
    if ((FX.busy || 0) > T + 2) FX.busy = T + 2; // free the stage events soon after the captain falls
  }
  return r;
};

/* ---- ram fallback: core kills any non-tank that touches the player; keep the captain alive (charged 20 hp per ram) ---- */
const _mbUpdate = update;
update = function (dt) {
  const e = mbCap, h = e && en.includes(e) ? e.hp : null;
  const r = _mbUpdate.apply(this, arguments);
  if (e && h !== null && !e._k && e.hp <= 0 && !en.includes(e) && state === 'play' && !boss && e.y < H + 60) {
    const fresh = T - e.ramT > .6;
    e.hp = fresh ? Math.max(1, h - 20) : h; if (fresh) e.ramT = T;
    en.push(e);
  }
  if (mbCap && !mbCap._k && !en.includes(mbCap) && mbCap.hp > 0) { mbCap = null; if ((FX.busy || 0) > T + 1) FX.busy = T + 1; } // flew away
  return r;
};

/* ---- draw: engine flames + health bar ---- */
const MB_EX = [[-14, 14], [-26, 26], [-10, 10], [-22, 0, 22]];
const _mbScene = scene;
scene = function () {
  const r = _mbScene.apply(this, arguments);
  for (const e of en) {
    if (e.k !== 'cap' || e.hp <= 0) continue;
    const fk = Math.floor(T * 20) % 2, top = e.y - 48;
    for (const x of MB_EX[li % 4]) { px(e.x + x - 4, top - 6 - fk * 4, 8, 6 + fk * 4, '#ff8a1e'); px(e.x + x - 2, top - 4 - fk * 2, 4, 4 + fk * 2, '#ffe27a'); }
    if (e.tel > 0 && Math.floor(e.tel / .1) % 2 === 0) { px(e.x - 6, e.y + 42, 12, 12, '#ffe27a'); px(e.x - 2, e.y + 46, 4, 4, '#fff'); }
    const q = clamp(e.hp / (e.mx || 1), 0, 1), by = top - 20;
    px(e.x - 30, by, 60, 8, '#1a1222'); px(e.x - 28, by + 2, 56, 4, '#3a2030');
    px(e.x - 28, by + 2, r2(56 * q), 4, '#e8231e'); px(e.x - 28, by + 2, r2(56 * q), 2, '#ff8a7a');
  }
  return r;
};

const _mbStart = startLevel;
startLevel = function () {
  const r = _mbStart.apply(this, arguments);
  mbDone = 0; mbCap = null;
  return r;
};
