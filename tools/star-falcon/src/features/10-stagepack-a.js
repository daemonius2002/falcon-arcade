/* 10-stagepack-a: stage identity for stages 1-4. Orbit shooting stars; Asteroid meteor showers, splitter and ore rocks;
   Ice snow and telegraphed shard volleys (own pool, never in en); Sea gunboats (turrets that cruise sideways).
   Wraps startLevel, update, scene, kill, bomb, spawnWave, updEnemy. Shares FX.busy (polite event flag). Stores nothing. */
const SA = { star: null, starT: 3, shT: 12, sh: null, trails: [], snow: [], voT: 9, vo: null, shards: [] };
FX.stagepackA = SA;
const spaTh = () => lv && lv.th;
const spaQuiet = () => !boss && bossWarn <= 0 && clearT <= 0 && state === 'play';
const DIA_Y = 62; // spec said y=14, but the HP bar / HUD covers that strip
const spaFree = () => !((FX.busy || 0) > T);

/* ---------- art ---------- */
const spaArrow = d => sprite('spa-arrow' + (d < 0 ? '-l' : ''), 20, 20, g => {
  g.scale(d < 0 ? -1 : 1, 1);
  g.fillStyle = '#ff8a1e'; g.fillRect(-4, -9, 6, 8); g.fillRect(-9, -2, 16, 2); g.fillRect(-7, 0, 12, 2); g.fillRect(-5, 2, 8, 2); g.fillRect(-3, 4, 4, 2); g.fillRect(-1, 6, 2, 2);
  g.fillStyle = '#ffd23c'; g.fillRect(-4, -9, 2, 8); g.fillRect(-9, -2, 4, 2);
  g.fillStyle = '#ff8a1e'; g.fillRect(4, -9, 2, 2); g.fillRect(6, -7, 2, 2);  // drift tick
}, [110, 30, 10]);
const spaDia = () => sprite('spa-dia', 20, 20, g => {
  part(g, [0, -9, 9, 0, 0, 9, -9, 0], '#9fd8f0'); part(g, [0, -9, 0, 9, -9, 0], '#ffffff'); g.fillStyle = '#2f7fb8'; g.fillRect(-1, -1, 4, 4);
}, [14, 34, 70]);
const spaShard = () => sprite('spa-shard', 16, 40, g => {
  part(g, [0, -19, 7, -7, 0, 19, -7, -7], '#2f7fb8');
  part(g, [0, -19, 0, 19, -7, -7], '#e6f6fc');
  part(g, [0, -19, 7, -7, 2, -3], '#7fc8ea');
  g.fillStyle = '#ffffff'; g.fillRect(-3, -12, 2, 10);
}, [14, 34, 70]);
const spaOre = vr => sprite('spa-ore' + li + vr, 64, 64, g => {
  const b = eSp('rock', li, vr).n; g.drawImage(b, -34, -34, 68, 68);
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,190,40,.42)'; g.fillRect(-34, -34, 68, 68);
  g.globalCompositeOperation = 'source-over'; const r = [15, 21, 27][vr];
  g.fillStyle = '#ffe27a'; for (const [x, y] of [[-.5, -.3], [.3, -.5], [.1, .35], [-.3, .3], [.5, .05]]) g.fillRect(r * x - 2, r * y - 2, 4, 4);
  g.fillStyle = '#fff6c8'; g.fillRect(-r * .5 - 2, -r * .3 - 2, 2, 2);
}, 0);
const spaBoat = d => sprite('spa-boat' + (d < 0 ? '-l' : ''), 52, 40, g => {
  g.scale(d < 0 ? -1 : 1, 1);
  g.fillStyle = '#ffffff'; g.fillRect(-26, -12, 4, 4); g.fillRect(-26, 8, 4, 4); g.fillRect(-24, -6, 2, 12); // wake foam
  g.fillStyle = '#bfe6f6'; g.fillRect(-26, -4, 2, 8);
  part(g, [-21, -12, 10, -12, 24, 0, 10, 12, -21, 12], '#e8eef4');       // hull
  part(g, [-21, 6, 14, 6, 10, 12, -21, 12], '#9aa8b8');                   // shaded side
  g.fillStyle = '#f0641e'; g.fillRect(-21, -12, 31, 4); g.fillRect(-21, 8, 31, 4); // orange stripes
  part(g, [10, -12, 24, 0, 10, 12, 14, 0], '#f0641e');                     // orange bow
  g.fillStyle = '#5c6678'; g.fillRect(-19, -5, 6, 10); g.fillStyle = '#ffe27a'; g.fillRect(-18, -3, 2, 2);
  ell(g, 0, 0, 10, 10, '#3a4352');                                         // turret ring
}, [26, 18, 34]);

/* ---------- level reset ---------- */
const _slA = startLevel;
startLevel = function (...a) {
  const r = _slA.apply(this, a);
  SA.star = null; SA.starT = rnd(3, 5); SA.shT = 12; SA.sh = null; SA.trails.length = 0;
  SA.voT = 9; SA.vo = null; SA.shards.length = 0; SA.snow.length = 0;
  if (spaTh() === 'ice') for (let i = 0; i < 40; i++) SA.snow.push({ x: rnd(0, W), y: rnd(0, H), vy: rnd(90, 160), s: R() < .3 ? 4 : 2, c: R() < .5 ? '#ffffff' : '#d9f0fa' });
  return r;
};

/* ---------- events ---------- */
function spaShower() {
  const n = [6, 8, 10][save.diff] || 8, dir = R() < .5 ? -1 : 1;
  const lo = dir > 0 ? -30 : 50, hi = dir > 0 ? W - 50 : W + 30;
  const lc = dir > 0 ? rnd(100, W - 170) : rnd(170, W - 100);   // lane centre at spawn height
  const segs = [[lo, lc - 55 - 26], [lc + 55 + 26, hi]].filter(s => s[1] > s[0]);
  const tot = segs.reduce((a, s) => a + s[1] - s[0], 0), cols = [];
  for (let i = 0; i < n; i++) {
    let q = (i + .5) / n * tot;
    for (const s of segs) { const L = s[1] - s[0]; if (q <= L) { cols.push(s[0] + q); break } q -= L }
  }
  for (let i = cols.length - 1; i > 0; i--) { const j = ri(0, i); [cols[i], cols[j]] = [cols[j], cols[i]] }
  SA.sh = { t: 0, dir, cols, k: 0, rt: 0 };
  FX.busy = T + 1 + n * .12 + 2;
}
function spaVolley() {
  const n = [4, 5, 7][save.diff] || 5, f = ri(0, 7), pool = [];
  for (let i = 0; i < 9; i++) if (i !== f && i !== f + 1) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) { const j = ri(0, i); [pool[i], pool[j]] = [pool[j], pool[i]] }
  const cols = pool.slice(0, n).sort((a, b) => a - b);
  if (R() < .5) cols.reverse();
  SA.vo = { t: 0, cols, b: 0, k: 0, rt: 0 };
  FX.busy = T + .8 + n * .14 + 1.5;
}
function spaShatter(s, paid) {
  s.on = 0;
  for (let i = 0; i < 5; i++) { const a = R() * TAU, v = rnd(60, 160); pt.push({ x: s.x, y: s.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: rnd(.2, .4), c: ['#ffffff', '#d9f0fa', '#9fd8f0'][i % 3], s: i % 2 ? 4 : 2 }) }
  beep(1600, .05, 'square', .02);
  if (paid) { save.cr += 5; earned += 5 }
}
function spaAddShard(x) {
  let s = SA.shards.find(q => !q.on);
  if (!s) { if (SA.shards.length >= 8) return; s = {}; SA.shards.push(s) }
  Object.assign(s, { on: 1, x, y: -30, vy: save.diff === 0 ? 270 : 330, hp: 2 });
}

const _updA = update;
update = function (...a) {
  const r = _updA.apply(this, a), dt = a[0] || 0, th = spaTh();
  if (state !== 'play') return r;
  if (th === 'orbit') {
    if (SA.star) { const s = SA.star; s.t += dt; s.x -= 380 * dt; s.y += 220 * dt; if (s.t > .6) SA.star = null }
    else if ((SA.starT -= dt) <= 0) { SA.starT = rnd(3, 5); SA.star = { x: rnd(W * .35, W + 40), y: rnd(20, 240), t: 0 } }
  }
  if (th === 'rock') {
    const sh = SA.sh;
    if (sh) {
      sh.t += dt;
      if (sh.t < 1) { const b = Math.floor(sh.t / .5); if (b >= sh.k) { sh.k = b + 1; beep(330, .08) } }
      else if (!spaQuiet()) SA.sh = null;
      else if ((sh.rt -= dt) <= 0 && sh.cols.length) {
        sh.rt = .12; const x = sh.cols.pop();
        const e = mk('rock', x, -30, { vx: sh.dir * 60, vy: rnd(190, 240), rot: rnd(-2, 2), shower: 1 });
        e.v = 5; // shower rocks come in bulk: small pay each
        if (R() < 1 / 6) { e.ore = 1; e.sp = spaOre(e.vr) }
      } else if (!sh.cols.length) SA.sh = null;
    } else if ((SA.shT -= dt) <= 0 && wave < waves && banner <= 0 && spaQuiet() && spaFree()) { SA.shT = 14 * FR[save.diff]; spaShower() }
  }
  if (th === 'ice') {
    for (const f of SA.snow) { f.y += f.vy * dt; f.x -= 40 * dt; if (f.y > H + 4) { f.y = -4; f.x = rnd(0, W + 60) } if (f.x < -4) f.x += W + 8 }
    const vo = SA.vo;
    if (vo) {
      vo.t += dt;
      if (vo.t < .8) { const b = Math.floor(vo.t / (.8 / vo.cols.length)); if (b >= vo.b && vo.b < vo.cols.length) { beep(520 + vo.b * 110, .07, 'triangle', .04); vo.b++ } }
      else if (!spaQuiet()) SA.vo = null;
      else if ((vo.rt -= dt) <= 0) { vo.rt = .14; spaAddShard(48 + vo.cols[vo.k++] * 48); if (vo.k >= vo.cols.length) SA.vo = null }
    } else if ((SA.voT -= dt) <= 0 && banner <= 0 && spaQuiet() && spaFree()) { SA.voT = 11 * FR[save.diff]; spaVolley() }
  }
  for (const s of SA.shards) {
    if (!s.on) continue;
    s.y += s.vy * dt;
    if (s.y > H + 30) { s.on = 0; continue }
    if (P && P.dead <= 0 && Math.abs(s.x - P.x) < 14 && Math.abs(s.y + 12 - P.y) < 14) { hurt(12); spaShatter(s, 0); continue }
    for (const b of pb) {
      if (b.dead || Math.abs(b.x - s.x) >= 10 || Math.abs(b.y - s.y) >= 22) continue;
      if (b.k === 2) { b.h = b.h || []; if (b.h.includes(s)) continue; b.h.push(s) } else b.dead = 1;
      s.hp -= b.d; pt.push({ x: b.x, y: b.y, vx: rnd(-40, 40), vy: rnd(-40, 40), l: .12, c: '#ffffff', s: 2 });
      if (s.hp <= 0) { spaShatter(s, 1); break }
    }
  }
  return r;
};

/* ---------- splitter / ore rocks ---------- */
const _killA = kill;
kill = function (...a) {
  const r = _killA.apply(this, a), e = a[0];
  if (e && e.k === 'rock' && spaTh() === 'rock') {
    if (e.ore) for (let i = 0; i < 3; i++) pk.push({ k: 'coin', x: e.x + (i - 1) * 16, y: e.y + rnd(-6, 6), t: i * .3 });
    if (e.vr > 0 && !e.ch && !boss && e.orb == null && clearT <= 0) for (const s of [-1, 1]) {
      const ch = mk('rock', e.x + s * 12, e.y, { vx: s * 70, vy: e.vy || 100, rot: rnd(-2, 2), ch: 1 });
      ch.vr = 0; ch.r = 15; ch.hp = 3; ch.v = 5; ch.sp = eSp('rock', li, 0);
    }
  }
  return r;
};

const _bombA = bomb;
bomb = function (...a) {
  const nb = P ? P.bombs : 0, r = _bombA.apply(this, a);
  if (P && P.bombs < nb) { for (const s of SA.shards) if (s.on) spaShatter(s, 1); SA.vo = null }
  return r;
};

/* ---------- spawns: ore tagging, gunboats ---------- */
const _swA = spawnWave;
spawnWave = function (...a) {
  const n0 = en.length, r = _swA.apply(this, a), th = spaTh();
  if (th === 'rock') for (let i = n0; i < en.length; i++) { const e = en[i]; if (e.k === 'rock' && !e.ore && R() < 1 / 6) { e.ore = 1; e.sp = spaOre(e.vr) } }
  if (th === 'sea' && wave % 3 === 1 && en.length < 12 && wave < waves - 1 && spaQuiet()) {
    const x0 = rnd(90, W - 90);
    for (const d of [-1, 1]) { const e = mk('turret', clamp(x0 + d * 70, 40, W - 40), -30 - (d > 0 ? 50 : 0)); e.gb = 1; e.dir = d; e.sp = spaBoat(d) }
  }
  return r;
};
const _ueA = updEnemy;
updEnemy = function (...a) {
  const r = _ueA.apply(this, a), e = a[0], dt = a[1] || 0;
  if (e && e.gb) {
    e.x += e.dir * 45 * dt;
    if (e.x < 40) { e.x = 40; e.dir = 1; e.sp = spaBoat(1) } else if (e.x > W - 40) { e.x = W - 40; e.dir = -1; e.sp = spaBoat(-1) }
  }
  return r;
};

/* ---------- draw ---------- */
const _scA = scene;
scene = function (...a) {
  const th = spaTh(), fk = Math.floor(T * 8) % 2;
  if (th === 'orbit' && SA.star) {
    const s = SA.star, al = s.t > .45 ? .5 : 1;
    c.globalAlpha = al;
    for (let i = 0; i < 9; i++) px(s.x + i * 2, s.y - Math.round(i * 1.16 / 2) * 2, 2, 2, i < 6 ? '#ffffff' : '#9fb4e6');
    px(s.x - 2, s.y - 2, 4, 4, '#ffffff'); c.globalAlpha = 1;
  }
  if (th === 'rock') for (const e of en) if (e.shower) {
    const v = Math.hypot(e.vx, e.vy) || 1, ux = -e.vx / v, uy = -e.vy / v;
    for (let k = 0; k < 3; k++) {
      const d = e.r * .8 + 2 + k * 8, col = ['#ffd23c', '#ff8a1e', '#c8501e'][k];
      for (let j = -1; j <= 1; j++) if (k === 0 || (k === 1 && ((j + fk) & 1) === 0) || (k === 2 && j === 0 && fk)) px(e.x + ux * d - uy * j * 4, e.y + uy * d + ux * j * 4, 4, 4, col);
    }
  }
  if (th === 'sea') for (const e of en) if (e.gb) {
    const sx = e.x - e.dir * 30, ph = Math.floor(T * 6) % 2;
    px(sx - e.dir * ph * 4, e.y - 6, 2, 2, '#ffffff'); px(sx - e.dir * (1 - ph) * 4, e.y + 4, 2, 2, '#ffffff');
  }
  const r = _scA.apply(this, a);
  if (th === 'rock' && SA.sh && SA.sh.t < 1 && Math.floor(SA.sh.t * 8) % 2 === 0) {
    const A = spaArrow(SA.sh.dir); for (const x of SA.sh.cols) put(A, clamp(x + SA.sh.dir * 36, 12, W - 12), 100);
  }
  if (th === 'ice') {
    for (const s of SA.shards) if (s.on) put(spaShard(), s.x, s.y);
    const vo = SA.vo;
    if (vo && (vo.t >= .8 || Math.floor(vo.t * 10) % 3 !== 2)) for (let i = vo.k; i < vo.b; i++) put(spaDia(), 48 + vo.cols[i] * 48, DIA_Y);
    for (const f of SA.snow) px(f.x, f.y, f.s, f.s, f.c);
  }
  return r;
};
