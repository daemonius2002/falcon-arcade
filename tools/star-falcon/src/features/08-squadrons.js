/* 08-squadrons: 5-ship squadrons on parametric flight paths (LOOP, S, VDIVE, PINCER) with a SQUAD! wipe bonus,
   gold-outlined Ace enemies (3x HP, 3x pay, guaranteed pickup) and the Courier bonus ship that crosses the screen.
   Wraps eSp, updEnemy, spawnWave, kill, mk, scene, update, startLevel. Stores nothing. Exposes FX.squad. */
DEF.sq = { hp: 2, r: 14, v: 5 }; // low pay per ship: the squad wipe bonus is the reward
DEF.cour = { hp: 6, r: 16, v: 40 };
const SQ_LOOP = 0, SQ_S = 1, SQ_V = 2, SQ_PIN = 3;
const ST = { squads: 0, wipes: 0, aces: 0, couriers: 0 };
let sqId = 0, sqKills = {}, aceThisWave = false, courT = 14, labels = [];

/* ---- art ---- */
const _eSp = eSp;
eSp = function (k, i, v) {
  if (k === 'sq') {
    const col = LV[i].ec;
    return sprite('sq-' + i, 44, 40, g => {
      part(g, sym([0, 18, 5, 6, 20, -10, 19, -16, 8, -11, 0, -15]), lin(g, -20, 0, 20, 0, M0, M1, M2));
      mir(g, [6, 2, 20, -10, 19, -16, 9, -11], col, dark(col, .3));
      part(g, sym([0, 14, 3, 4, 3, -12]), lin(g, -3, 0, 3, 0, lite(col, .5), col, dark(col, .5)));
      ell(g, 0, 4, 3, 4, '#2a1a3a'); g.fillStyle = '#fff'; g.fillRect(-1, 2, 2, 2);
      g.fillStyle = '#ff8a1e'; g.fillRect(-4, -18, 8, 4); g.fillStyle = '#ffe27a'; g.fillRect(-2, -18, 4, 4);
    });
  }
  if (k === 'cour') {
    const col = LV[i].ec;
    return sprite('sq-cour' + i, 56, 36, g => {
      part(g, [-8, -9, 8, -9, 4, -17, -4, -17], M1); part(g, [-8, 9, 8, 9, 4, 17, -4, 17], M2);
      g.fillStyle = DK; g.fillRect(-27, -5, 4, 10); g.fillRect(23, -5, 4, 10);
      ell(g, 0, 0, 24, 11, lin(g, 0, -11, 0, 11, '#fff6c8', '#ffd23c', '#f0a81e', '#a8601e'));
      g.fillStyle = col; g.fillRect(-5, -10, 10, 20); g.fillStyle = lite(col, .45); g.fillRect(-5, -10, 10, 3);
      g.fillStyle = '#a8601e'; for (const x of [-15, 11]) g.fillRect(x, -2, 4, 4);
      g.fillStyle = '#fff'; g.fillRect(-16, -7, 6, 2);
    });
  }
  return _eSp(k, i, v);
};
// gold outline for aces: one getImageData pass per source sprite, cached
const GOLD = new Map();
function gold(sp) {
  if (!sp || !sp.n) return sp;
  let o = GOLD.get(sp); if (o) return o;
  const k = mkc(sp.n.width, sp.n.height), g = k.getContext('2d'); g.drawImage(sp.n, 0, 0);
  try {
    const im = g.getImageData(0, 0, k.width, k.height), d = im.data;
    for (let j = 0; j < d.length; j += 4) if (d[j + 3] > 0 && d[j] === OL[0] && d[j + 1] === OL[1] && d[j + 2] === OL[2]) { d[j] = 255; d[j + 1] = 210; d[j + 2] = 60; }
    g.putImageData(im, 0, 0);
  } catch (e) {}
  o = { n: k, f: sp.f, s: sp.s, w: sp.w, h: sp.h }; GOLD.set(sp, o); GOLD.set(o, o); return o;
}
// 16 pre-rotated variants so squadron ships face their flight direction (nearest-neighbour, cached)
const ROT = new Map();
function rotSp(sp, d) {
  let a = ROT.get(sp); if (!a) { a = []; ROT.set(sp, a); }
  if (a[d]) return a[d];
  const S = Math.ceil(Math.hypot(sp.n.width, sp.n.height)) + 2, ang = d * TAU / 16;
  const r = im => { const k = mkc(S, S), g = k.getContext('2d'); g.imageSmoothingEnabled = false; g.translate(S / 2, S / 2); g.rotate(ang); g.drawImage(im, -im.width / 2, -im.height / 2); return k; };
  return a[d] = { n: r(sp.n), f: r(sp.f), s: r(sp.s), w: S * 2, h: S * 2 };
}
const FONT = { S: '111100111001111', Q: '010101101110011', U: '101101101101111', A: '010101111101101', D: '110101101101110', '!': '1110' };
const labelSp = () => sprite('sq-label', 92, 28, g => {
  let x = -42;
  for (const ch of 'SQUAD!') {
    const f = FONT[ch], w = ch === '!' ? 1 : 3;
    for (let r = 0; r < 5; r++) for (let q = 0; q < w; q++) {
      const on = ch === '!' ? r !== 3 : f[r * 3 + q] === '1';
      if (on) { g.fillStyle = r === 0 ? '#fff6c8' : r === 4 ? '#ff9a2a' : '#ffd23c'; g.fillRect(x + q * 4, -10 + r * 4, 4, 4); }
    }
    x += (w + 1) * 4;
  }
});

/* ---- flight paths (u = seconds since this member started) ---- */
function path(e, u) {
  const s = e.side;
  if (e.pat === SQ_LOOP) {
    if (u < 1.36) return [-60 + 220 * u, 120];
    const th = (u - 1.36) * 220 / 90, TT = TAU * 1.125;
    if (th < TT) return [W / 2 + 90 * Math.sin(th), 210 - 90 * Math.cos(th)];
    const a = (th - TT) * 90, ex = W / 2 + 90 * Math.sin(TT), ey = 210 - 90 * Math.cos(TT);
    return [ex + a * .7071, ey + a * .7071];
  }
  if (e.pat === SQ_S) return [W / 2 + 170 * Math.sin(u * 1.6), -40 + 150 * u];
  if (e.pat === SQ_V) return [W / 2 + s * (40 + 60 * u), -40 + 190 * u];
  // PINCER: fly in level from the side, cross the middle, then dive
  const x0 = s < 0 ? -60 : W + 60, d = -s;
  if (u < 1.6) return [x0 + d * 240 * u, 200];
  const a = u - 1.6;
  return [x0 + d * (384 + 120 * (1 - Math.exp(-2 * a))), 200 + 60 * a + 120 * a * a];
}
function spawnSquad(force) {
  let pat = (Math.floor(wave / 4) + li) % 4;  // spec says (wave+li)%4, but wave%4 is always 2 here: rotate per squad instead
  if (li === 0) pat = pat % 2 ? SQ_V : SQ_S;
  else if (pat === SQ_PIN && li < 2) pat = SQ_S;
  if (force >= 0 && force < 4) pat = force;
  const id = ++sqId; sqKills[id] = 0; ST.squads++;
  for (let i = 0; i < 5; i++) mk('sq', -60, -40, { sqd: id, pat, dl: i * .22, side: i % 2 ? 1 : -1, lead: i === 0 });
  waveT += .6;
}

/* ---- wrappers ---- */
const _mk = mk;
mk = function (k, x, y, o) {
  const e = _mk.apply(this, arguments);
  if (e && state === 'play' && wave >= 4 && !boss && !aceThisWave && ['scout', 'zig', 'shooter', 'kami', 'sq'].includes(k) &&
    R() < .10 + li * .01 && !(save.diff === 0 && li < 1)) {
    e.ace = 1; e.hp *= 3; e.v *= 3; e.sp = gold(e.sp); aceThisWave = true; ST.aces++;
  }
  return e;
};
const _sw = spawnWave;
spawnWave = function () {
  aceThisWave = false;
  const r = _sw.apply(this, arguments);
  if (wave % 4 === 2 && !boss && en.length < 12) spawnSquad();
  return r;
};
const _ue = updEnemy;
updEnemy = function (e, dt) {
  const r = _ue.apply(this, arguments);
  if (e.k === 'sq') {
    const u = e.t - e.dl;
    if (!e.sp0) e.sp0 = e.sp;
    if (u < 0) { e.x = -60; e.y = -40; }
    else {
      const p = path(e, u), q = path(e, u + .03);
      e.x = p[0]; e.y = p[1];
      const dir = (Math.round((Math.atan2(q[1] - p[1], q[0] - p[0]) - Math.PI / 2) / (TAU / 16)) % 16 + 16) % 16;
      e.sp = rotSp(e.sp0, dir);
      if (u > 7.5) e.y = H + 100;  // guarantee the exit
      if (e.lead && li >= 3 && !e.fired && u >= 1.5) { e.fired = 1; if (e.y > 0 && e.y < H - 120 && e.x > 0 && e.x < W) shoot(e.x, e.y + 10, aim(e)); }
    }
  } else if (e.k === 'cour') {
    e.x += e.dir * 150 * dt; e.y += Math.sin(e.t * 5) * 20 * dt;
    e.jt = (e.jt || 0) - dt;
    if (e.jt <= 0 && e.x > 0 && e.x < W) { e.jt = .35; beep(1320, .06, 'triangle', .03); }
  }
  return r;
};
const _kill = kill;
kill = function (e) {
  const r = _kill.apply(this, arguments);
  if (clearT > 0) return r;
  if (e.k === 'sq' && e.sqd && sqKills[e.sqd] != null && ++sqKills[e.sqd] >= 5) {
    delete sqKills[e.sqd]; ST.wipes++;
    FX.score && FX.score.add && FX.score.add(500, e.x, e.y);
    FX.score && FX.score.chainBump && FX.score.chainBump(1.5);
    pk.push({ k: 'coin', x: e.x, y: e.y, t: 0 });
    beep(660, .07); beep(990, .12);
    if (labels.length < 4) labels.push({ x: clamp(e.x, 60, W - 60), y: clamp(e.y, 60, H - 60), t: 0 });
  }
  if (e.ace) {
    const q = R();
    pk.push({ k: q < .6 ? 'coin' : q < .85 ? 'heal' : 'rapid', x: e.x, y: e.y, t: 0 });
    beep(1000, .1, 'triangle', .05, 2000);
  }
  if (e.k === 'cour') {
    for (let i = 0; i < 4; i++) pk.push({ k: 'coin', x: clamp(e.x - 40 + i * 26.7, 20, W - 20), y: e.y + (i % 2 ? 8 : -8), t: i * .3 });
    pk.push({ k: P && P.hp < P.max * .5 ? 'heal' : 'rapid', x: clamp(e.x, 20, W - 20), y: e.y + 20, t: 0 });
    beep(880, .08, 'triangle', .05, 1760);
  }
  return r;
};
const _sl = startLevel;
startLevel = function () {
  const r = _sl.apply(this, arguments);
  courT = 14; sqKills = {}; labels = []; aceThisWave = false;
  return r;
};
const _up = update;
update = function (dt) {
  const r = _up.apply(this, arguments);
  if (state !== 'play') return r;
  for (const l of labels) l.t += dt;
  if (labels.length) labels = labels.filter(l => l.t < .8);
  courT -= dt;
  if (courT <= 0 && !boss && bossWarn <= 0 && wave < waves && clearT <= 0 && !en.some(e => e.k === 'cour')) {
    const dir = R() < .5 ? 1 : -1;
    mk('cour', dir > 0 ? -50 : W + 50, rnd(70, 150), { dir });
    courT = rnd(26, 34); ST.couriers++;
  }
  return r;
};
const _sc = scene;
scene = function () {
  const r = _sc.apply(this, arguments);
  const fk = Math.floor(T * 20) % 2, bl = Math.floor(T * 6) % 2;
  for (const e of en) {
    if (e.k === 'cour') { const bx = e.x - e.dir * 30; px(e.dir > 0 ? bx - 6 - fk * 4 : bx, e.y - 2, 6 + fk * 4, 4, '#ff8a1e'); px(e.dir > 0 ? bx - 2 : bx, e.y - 2, 2, 4, '#ffe27a'); }
    if (e.ace && e.hp > 0) {
      const x = r2(e.x + (e.k === 'scout' ? 14 : 0)), y = r2(e.y - e.r - 12);  // scouts: beside the engine flame
      px(x - 4, y, 10, 6, '#1a1222'); px(x - 2, y - 2, 6, 10, '#1a1222');
      px(x - 2, y + 2, 6, 2, bl ? '#ffd23c' : '#fff6c8'); px(x, y, 2, 6, bl ? '#ffd23c' : '#fff6c8');
      if (bl) px(x, y + 2, 2, 2, '#ffffff');
    }
  }
  if (labels.length) { const L = labelSp(); for (const l of labels) put(L, l.x, l.y - l.t * 60, l.t > .6 && fk ? { a: .5 } : null); }
  return r;
};
FX.squad = { stats: ST, gold, aces: () => en.filter(e => e.ace).length, spawnSquad };
