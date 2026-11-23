/* 02-score: arcade score (separate from $), kill chain multiplier x1..x8, close-call graze bonus and pixel score popups.
   Wraps startLevel, kill, update, hurt, dmg, scene, hud, hudDom, levelDone. Provides FX.score (num() = 3x5 pixel digits,
   top-left anchored, returns width). Stores save.score = {best:[diff][stage]} (stage bests; never touches save.cr). */
const SC_TH = [0, 4, 10, 18, 28, 40, 55, 75];
const scDef = () => [0, 1, 2].map(() => LV.map(() => 0));
function scFix() {
  const s = save.score;
  if (!s || typeof s !== 'object' || !Array.isArray(s.best)) { save.score = { best: scDef() }; return; }
  for (let d = 0; d < 3; d++) {
    if (!Array.isArray(s.best[d])) s.best[d] = [];
    for (let i = 0; i < LV.length; i++) if (typeof s.best[d][i] !== 'number' || !(s.best[d][i] >= 0)) s.best[d][i] = 0;
  }
}
scFix();
(FX.onReset = FX.onReset || []).push(() => { save.score = { best: scDef() }; });

let sc = 0, chain = 0, ct = 0, shown = 0, gzCd = 0, lastM = 1;

/* ---- 3x5 bitmap font ---- */
const GLY = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001011001111',
  '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001001010010',
  '8': '111101111101111', '9': '111101111001111', '+': '000010111010000', 'x': '000101010101000',
  '$': '011110111011110', ',': '000000000010100', '-': '000000111000000', ' ': '000000000000000'
};
const GC = {};
for (const k in GLY) { const a = []; for (let i = 0; i < 15; i++) if (GLY[k][i] === '1') a.push(i % 3, (i / 3) | 0); GC[k] = a; }
const gw = ch => ch === ',' ? 2 : 3;
function numW(str, scale) { const cs = 2 * (scale || 1); let w = 0; for (const ch of String(str)) w += (gw(ch) + 1) * cs; return w ? w - cs : 0; }
function num(x, y, str, col, scale) {
  const cs = 2 * (scale || 1); str = String(str); x = r2(x); y = r2(y);
  for (let pass = 0; pass < 2; pass++) {
    const o = pass ? 0 : 2, cl = pass ? (col || '#ffffff') : '#1a1222';
    let cx = x;
    for (const ch of str) {
      const g = GC[ch] || GC[' '];
      if (ch === ',') { for (let i = 0; i < g.length; i += 2) px(cx + (g[i] - 1) * cs + o, y + g[i + 1] * cs + o, cs, cs, cl); }
      else for (let i = 0; i < g.length; i += 2) px(cx + g[i] * cs + o, y + g[i + 1] * cs + o, cs, cs, cl);
      cx += (gw(ch) + 1) * cs;
    }
  }
  return numW(str, scale);
}

/* ---- popups (fixed pool, no per-frame allocation) ---- */
const POP = Array.from({ length: 16 }, () => ({ x: 0, y: 0, str: '', v: 0, col: '#fff', l: 0, big: 0 }));
function popup(v, x, y, col, big) {
  for (const p of POP) if (p.l > 0 && p.col === col && .7 - p.l < .15 && Math.hypot(p.x - x, p.y - y) < 28) {
    p.v += v; p.str = '+' + p.v; p.l = .7; p.big = p.big || big || p.v >= 1000; return;
  }
  let q = POP[0];
  for (const p of POP) { if (p.l <= 0) { q = p; break; } if (p.l < q.l) q = p; }
  q.x = x; q.y = y; q.v = v; q.str = '+' + v; q.col = col; q.l = .7; q.big = big || v >= 1000;
}

const mult = () => { let m = 1; for (let i = 1; i < SC_TH.length; i++) if (chain >= SC_TH[i]) m = i + 1; return m; };
function add(n, x, y, col, raw) {
  const v = Math.round((+n || 0) * (raw ? 1 : mult()) / 10) * 10;
  if (!(v > 0)) return 0;
  sc += v;
  if (x !== undefined && y !== undefined) popup(v, x, y, col || '#ffe27a', 0);
  return v;
}
function bumpChain() {
  chain++; ct = 3;
  const m = mult();
  if (m > lastM) beep(440 * Math.pow(1.122, m), .08, 'square', .03);
  lastM = m;
}
const getBest = (i, d) => {
  scFix(); d = d === undefined ? save.diff : d; i = i === undefined ? li : i;
  return (save.score.best[d] && save.score.best[d][i]) || 0;
};

FX.score = {
  add, get: () => sc, mult, chainBump(sec) { ct = Math.min(3, ct + (+sec || 0)); },
  best: getBest, num, numW, chain: () => chain, result: null
};

/* ---- wrappers ---- */
const _sl = startLevel;
startLevel = function () {
  const r = _sl.apply(this, arguments);
  sc = 0; chain = 0; ct = 0; shown = 0; gzCd = 0; lastM = 1; FX.score.result = null;
  for (const p of POP) p.l = 0;
  return r;
};

const _kill = kill;
kill = function (e) {
  const r = _kill.apply(this, arguments);
  if (clearT <= 0 && e) { bumpChain(); if (e.v > 0) add(e.v * 10, e.x, e.y - (e.r || 0)); }
  return r;
};

const _dmg = dmg;
dmg = function (e) {
  const r = _dmg.apply(this, arguments);
  if (e && e === boss && chain > 0) ct = Math.max(ct, 2);
  return r;
};

const _hurt = hurt;
hurt = function () {
  const h = P ? P.hp : 0;
  const r = _hurt.apply(this, arguments);
  if (P && P.hp < h) { chain = Math.floor(chain / 2); lastM = mult(); }
  return r;
};

const _upd = update;
update = function (dt) {
  const b = boss, o = pk;
  const r = _upd.apply(this, arguments);
  if (b && !boss && b.hp <= 0) { const v = add(5000 + 2000 * li); if (v) popup(v, b.x, b.y, '#ffffff', 1); }
  if (o) for (const p of o) if (p.dead && !p.sc) { p.sc = 1; add(p.k === 'coin' ? 100 : 50, p.x, p.y); }
  if (en.length || boss) {
    ct -= dt;
    if (ct <= 0 && chain > 0) { const m = mult(); chain = m >= 2 ? SC_TH[m - 2] : 0; lastM = mult(); ct = 1.5; }
  }
  gzCd -= dt;
  if (state === 'play' && P && P.dead <= 0 && P.inv <= .5) {
    for (const q of eb) {
      if (q.gz || q.dead || !(q.r <= 12)) continue;
      if ((q.x - P.x) ** 2 + (q.y - P.y) ** 2 < 34 * 34) {
        q.gz = 1; add(50, q.x, q.y, '#5fe3d6'); FX.score.chainBump(1);
        for (let i = 0; i < 3; i++) pt.push({ x: q.x, y: q.y, vx: rnd(-90, 90), vy: rnd(-90, 30), l: .25, c: '#5fe3d6', s: 2 });
        if (gzCd <= 0) { gzCd = .08; beep(1800, .03, 'triangle', .02); }
      }
    }
  }
  for (const p of POP) if (p.l > 0) { p.l -= dt; p.y -= 40 * dt; }
  return r;
};

const _scene = scene;
scene = function () {
  const r = _scene.apply(this, arguments);
  for (const p of POP) {
    if (p.l <= 0 || (p.l < .15 && Math.floor(T * 30) % 2)) continue;
    const s = p.big ? 2 : 1, w = numW(p.str, s);
    num(clamp(p.x - w / 2, 4, W - w - 6), p.y - 5 * s, p.str, p.col, s);
  }
  return r;
};

const _hud = hud;
hud = function () {
  const r = _hud.apply(this, arguments);
  const m = mult();
  if (m > 1 || chain > 0) {
    const hot = m >= 8 && Math.floor(T * 8) % 2, col = hot ? '#ffd23c' : '#5fe3d6';
    num(8, 58, 'x' + m, m >= 8 ? col : '#ffffff', 1);
    px(34, 60, 54, 8, '#1a1222');
    const f = r2(50 * clamp(ct, 0, 3) / 3);
    if (f > 0) px(36, 62, f, 4, col);
  }
  return r;
};

let scEl = null, scTxt = null;
const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const _hd = hudDom;
hudDom = function () {
  const r = _hd.apply(this, arguments);
  if (!scEl) {
    const hd = $('hud');
    if (hd) {
      scEl = document.createElement('span'); scEl.id = 'scHud';
      scEl.style.cssText = 'position:absolute;top:2.6cqw;left:calc(50% + 5cqw);transform:translateX(-50%);font-size:3cqw;color:#fff;white-space:nowrap';
      hd.appendChild(scEl);
    }
  }
  if (shown < sc) shown = Math.min(sc, shown + Math.max(10, (sc - shown) * .2)); else if (shown > sc) shown = sc;
  const t = state === 'play' ? fmt(shown) : '';
  if (scEl && t !== scTxt) { scTxt = t; scEl.textContent = t; }
  return r;
};

const _ld = levelDone;
levelDone = function () {
  scFix();
  const rush = !!(FX.rush && FX.rush.on && FX.rush.on());
  const d = clamp(save.diff | 0, 0, 2), row = save.score.best[d], pv = rush ? sc : row[li] || 0, isNew = !rush && sc > pv;
  if (isNew) row[li] = sc;
  FX.score.result = { score: sc, best: Math.max(pv, sc), isNew, li };
  return _ld.apply(this, arguments);
};
