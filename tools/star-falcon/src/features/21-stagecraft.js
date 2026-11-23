/* 21-stagecraft: boss stagecraft for all 8 bosses - named boss bar with charge-up, ghost chunk, gate notches and
   phase pips, phase cues, a 1.2 s death show, Stage 8 finale, fair finish (no game over after the win) and coin vacuum.
   Wraps mkBoss, updBoss, dmg, update, hud, scene, startLevel. Reads boss.name/gates/ph/dying. Stores nothing.
   The bar (with the boss name in pixel letters) stays in the y 58-78 HUD band so boss art below it stays visible.
   Only module that writes `banner` for bosses. Exposes FX.stagecraft={intro,ghost,finale}. */
const SC = { intro: 0, beeps: 0, ghost: 1, hold: 0, ph: 0, cur: null, bx: W / 2, by: 120, boomT: 0, coins: [], ring: [], fin: -1, fx: 0, name: '', nb: null, nr: null };
const scReset = () => { SC.intro = 0; SC.beeps = 0; SC.ghost = 1; SC.hold = 0; SC.ph = 0; SC.cur = null; SC.boomT = 0; SC.coins = []; SC.ring = []; SC.fin = -1; SC.fx = 0; };
FX.stagecraft = { intro: () => SC.intro, ghost: () => SC.ghost, finale: () => SC.fin };

/* ---------- boss name: 3x5 pixel letters drawn inside the bar (keeps the boss art clear) ---------- */
const SC_G = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001011001111',
  '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001001010010', '8': '111101111101111',
  '9': '111101111001111', '-': '000000111000000', '!': '010010010000010', "'": '010010000000000', '.': '000000000000010', ' ': '000000000000000'
};
const SC_GC = {};
for (const k in SC_G) { const a = []; for (let i = 0; i < 15; i++) if (SC_G[k][i] === '1') a.push(i % 3, (i / 3) | 0); SC_GC[k] = a; }
const scTxtW = s => s.length ? s.length * 8 - 2 : 0;          // 3x5 glyphs at 2 px, 2 px gap
function scText(x, y, s) {
  for (let pass = 0; pass < 2; pass++) {
    const o = pass ? 0 : 2, cl = pass ? '#ffffff' : '#1a1222';
    let cx = x;
    for (const ch of s) { const g = SC_GC[ch] || SC_GC[' ']; for (let i = 0; i < g.length; i += 2) px(cx + g[i] * 2 + o, y + g[i + 1] * 2 + o, 2, 2, cl); cx += 8; }
  }
}
const scQ = b => clamp(b.hp / (b.max || b.hp || 1), 0, 1);
const scRush = () => !!(FX.rush && FX.rush.on && FX.rush.on());
const scFinal = () => li === LV.length - 1 && !scRush();

/* ---------- spawn / intro ---------- */
const _mkBoss = mkBoss;
mkBoss = function () {
  const r = _mkBoss.apply(this, arguments);
  SC.intro = 1.2; SC.beeps = 0; SC.ghost = 1; SC.hold = 0; SC.ph = boss ? boss.ph || 0 : 0;
  return r;
};
function scSpawn() {
  SC.cur = boss; SC.ph = boss.ph || 0; SC.ghost = scQ(boss); SC.hold = 0;
  banner = 2; bannerTxt = 'Warning!\n' + (boss.name || 'Stage boss');
}

/* ---------- death show ---------- */
const _dmg = dmg;
dmg = function (e, d) {
  const r = _dmg.apply(this, arguments);
  if (e && e === boss) {
    if (!e.dying && e.hp <= 0) { e.hp = 1; e.dying = 1.2; eb = []; SC.boomT = 0; }
    else if (e.dying > 0) e.hp = Math.max(e.hp, 1);
  }
  return r;
};
const _updBoss = updBoss;
updBoss = function (b, dt) {
  const me = b && b === boss;
  if (me && !b.dying && b.hp <= 0) { b.hp = 1; b.dying = 1.2; eb = []; SC.boomT = 0; }
  if (me && b.dying > 0) b.a = b.f = b.s = b.k2 = 1e9;
  const r = _updBoss.apply(this, arguments);
  if (me && b.dying > 0) {
    b.dying -= dt; b.hit = (Math.floor(b.dying * 10) % 2) ? .05 : 0;
    SC.boomT -= dt;
    if (SC.boomT <= 0) { SC.boomT = .12; explode(clamp(b.x + rnd(-60, 60), 20, W - 20), clamp(b.y + rnd(-40, 40), 40, H - 120), 6); }
    eb = []; if (P) P.inv = Math.max(P.inv, .5);
    if (b.dying <= 0) { b.hp = 0; FX.juice && FX.juice.stop && FX.juice.stop(.12, .1); }
  }
  return r;
};
function scDied() {
  const x = SC.bx, y = clamp(SC.by, 60, H - 160);
  for (let i = 0; i < 6; i++) SC.coins.push({ t: .12 + i * .1, x: x + rnd(-70, 70), y: y + rnd(-40, 40) });
  for (let i = 0; i < 24; i++) SC.ring.push({ a: i / 24 * TAU, r: 16, l: .7, c: i % 2 ? '#ffd23c' : '#ffffff' });
  if (scFinal()) {
    SC.fin = 0; SC.fx = 0; clearT = 6; if (P) P.inv = Math.max(P.inv, 6); eb = [];
    for (let i = 0; i < 16; i++) SC.coins.push({ t: .5 + i * .16, x: rnd(40, W - 40), y: -20 });
  }
}
function scFinale(dt) {
  const t0 = SC.fin; SC.fin += dt; const t = SC.fin;
  eb = []; if (P) P.inv = Math.max(P.inv, .5);
  if (t <= 3.05) { SC.fx -= dt; if (SC.fx <= 0) { SC.fx = .1; explode(rnd(30, W - 30), 40 + clamp(t / 3, 0, 1) * (H - 120) + rnd(-20, 20), 8); } }
  for (const k of [.2, 1.6, 3]) if (t0 < k && t >= k) { flashA = Math.max(flashA, .5); beep(70, .6, 'sawtooth', .06, 40); }
  if (t0 < 3 && t >= 3) { banner = 3; bannerTxt = 'MOTHERSHIP\nDOWN!'; }
}

/* ---------- per-frame logic ---------- */
const _update = update;
update = function (dt) {
  if ((clearT > 0 || (boss && boss.dying > 0)) && P && P.dead > 0 && lives <= 0) lives = 1; // fair finish
  const r = _update.apply(this, arguments);
  if (state !== 'play') return r;
  if (SC.cur && boss !== SC.cur) { if (SC.cur.hp <= 0) scDied(); SC.cur = null; }
  if (boss && boss !== SC.cur) scSpawn();
  if (boss) {
    SC.bx = boss.x; SC.by = boss.y;
    if (SC.intro > 0) {
      SC.intro = Math.max(0, SC.intro - dt);
      const k = 1 - SC.intro / 1.2;
      while (SC.beeps < 4 && k >= SC.beeps * .25) { beep([330, 440, 554, 660][SC.beeps], .09, 'square', .035); SC.beeps++; }
      SC.ghost = scQ(boss);
    } else {
      const q = scQ(boss);
      if (q >= SC.ghost) { SC.ghost = q; SC.hold = 0; }
      else if (SC.hold < .25) SC.hold += dt;
      else SC.ghost = Math.max(q, SC.ghost - .35 * dt);
    }
    const ph = boss.ph || 0;
    if (ph > SC.ph && !(boss.dying > 0)) {
      flashA = Math.max(flashA, .35); shake = 8;
      beep(330, .1, 'triangle', .05); beep(440, .14, 'triangle', .045); beep(660, .22, 'triangle', .04, 880);
      banner = 1.2; bannerTxt = (boss.name || 'Boss') + '\nPhase ' + (ph + 1);
    }
    SC.ph = ph;
  }
  for (const q of SC.coins) { q.t -= dt; if (q.t <= 0) { q.dead = 1; pk.push({ k: 'coin', x: clamp(q.x, 20, W - 20), y: q.y, t: 0 }); } }
  if (SC.coins.length) SC.coins = SC.coins.filter(q => !q.dead);
  for (const g of SC.ring) { g.r += 300 * dt; g.l -= dt; }
  if (SC.ring.length) SC.ring = SC.ring.filter(g => g.l > 0);
  if (SC.fin >= 0 && clearT > 0) scFinale(dt);
  if (clearT > 0 && P && P.dead <= 0) { // coin vacuum (core collects within 26 px)
    for (const p of pk) { const dx = P.x - p.x, dy = P.y - p.y, d = Math.hypot(dx, dy); if (d > 1) { const s = Math.min(d, 520 * dt); p.x += dx / d * s; p.y += dy / d * s; } }
  }
  return r;
};

/* ---------- drawing ---------- */
const _scene = scene;
scene = function () {
  const r = _scene.apply(this, arguments);
  for (const g of SC.ring) { const s = g.l > .25 ? 6 : 4; px(SC.bx + Math.cos(g.a) * g.r - s / 2, SC.by + Math.sin(g.a) * g.r - s / 2, s, s, g.c); }
  return r;
};
/* bar band: world y 58-78, x 94-386 (covers core's 96..384 x 62..78 bar, clears the x-combo meter at x<=88) */
const _hud = hud;
hud = function () {
  const r = _hud.apply(this, arguments);
  if (!boss) return r;
  const q = scQ(boss), blink = Math.floor(T * 8) % 2;
  const col = q > .5 ? '#e8231e' : q > .2 ? '#ff9a2a' : blink ? '#ffffff' : '#e8231e';
  const hi = q > .5 ? '#ff8a7a' : q > .2 ? '#ffd08a' : blink ? '#ffffff' : '#ff8a7a';
  const X = 98, Y = 62, BW = 284, BH = 12;
  px(94, 58, 292, 20, '#1a1222'); px(X, Y, BW, BH, '#3a2030'); px(X, Y + BH - 2, BW, 2, '#2a1622');
  const fw = r2(BW * q), gw = r2(BW * Math.max(q, SC.ghost));
  if (gw > fw) { px(X + fw, Y, gw - fw, BH, '#ffffff'); px(X + fw, Y + BH - 2, gw - fw, 2, '#c8c0d0'); }
  if (fw > 0) { px(X, Y, fw, BH, col); px(X, Y, fw, 2, hi); px(X, Y + BH - 2, fw, 2, q > .2 || !blink ? '#a01810' : '#d8d0e0'); }
  if (SC.intro > 0) { const k = 1 - SC.intro / 1.2, cx = r2(BW * k); px(X + cx, Y, BW - cx, BH, '#3a2030'); if (cx > 0 && cx < BW) px(X - 2 + cx, Y, 2, BH, '#ffffff'); }
  const gs = Array.isArray(boss.gates) ? boss.gates : [];
  for (const g of gs) if (g > 0 && g < 1) { const x = X + r2(BW * g) - 2; px(x, 60, 2, 16, '#1a1222'); px(x + 2, Y, 2, 2, '#1a1222'); px(x - 2, Y, 2, 2, '#1a1222'); }
  if (SC.nb !== boss || SC.nr !== boss.name) { SC.nb = boss; SC.nr = boss.name; const t = String(boss.name || 'Stage boss').toUpperCase(); SC.name = scTxtW(t) > BW - 8 ? t.slice(0, (BW - 6) >> 3) : t; }
  const nm = SC.name;
  if (nm) scText(r2(X + (BW - scTxtW(nm)) / 2), Y + 1, nm);
  const n = Math.min(5, gs.length + 1), left = n - (boss.ph || 0);
  for (let i = 0; i < n; i++) {
    const x = 392 + i * 14; px(x, 62, 12, 12, '#1a1222');
    const on = i < left; px(x + 2, 64, 8, 8, on ? '#ff9a2a' : '#3a2030'); if (on) px(x + 2, 64, 8, 2, '#ffd08a');
  }
  return r;
};
const _startLevel = startLevel;
startLevel = function () { scReset(); const r = _startLevel.apply(this, arguments); scReset(); return r; };
