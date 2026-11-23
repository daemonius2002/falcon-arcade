/* 22-results: stage tally with a 3-star rank on STAGE CLEAR / YOU WIN, a progress card + tip on SHIP DOWN,
   and stars / bests / padlocks on the menu stage cards. Wraps startLevel, mk, kill, hurt, bomb, update,
   levelDone, gameOver, menu, draw. Stores save.results = {st:[8 x max stars 0..3]}. Exposes FX.results. */
const rsFix = () => {
  const r = save.results;
  if (!r || typeof r !== 'object' || !Array.isArray(r.st)) { save.results = { st: LV.map(() => 0) }; return; }
  for (let i = 0; i < LV.length; i++) r.st[i] = clamp(r.st[i] | 0, 0, 3);
};
rsFix();
const rsZero = () => { save.results = { st: LV.map(() => 0) }; };
(FX.onReset = FX.onReset || []).push(rsZero);
let rsUp = save.up; /* core "Erase progress" swaps save.up for a fresh object: reset stars too */
const rsRush = () => !!(FX.rush && FX.rush.on && FX.rush.on());
const ST = { sp: 0, k: 0, h: 0, ll: 0, bu: 0, t: 0 };
let rsT = 0, rsDone = 0, rsRows = 0, rsStars = 0;

/* ---- pixel art (cached data URLs) ---- */
const STAR = ['......h......', '.....hho.....', '.....hwo.....', '....hhooo....', 'hhhhhoooooooo', '.hhooooooood.',
  '..hoooooood..', '...ooooooo...', '...ooooodd...', '..oodd.oddd..', '..odd...ddd..', '.odd.....ddd.', '.d.........d.'];
/* hand-placed 13x13 pixel star; colours repainted 1:1 after pix() so the palette stays exact */
const rsStar = (key, pal) => {
  const sp = sprite(key, 28, 28, g => { g.fillStyle = '#ffffff'; STAR.forEach((r, y) => { for (let x = 0; x < 13; x++) if (r[x] !== '.') g.fillRect(-12 + x * 2, -12 + y * 2, 2, 2); }); });
  const g = sp.n.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0);
  STAR.forEach((r, y) => { for (let x = 0; x < 13; x++) if (pal[r[x]]) { g.fillStyle = pal[r[x]]; g.fillRect(x + 2, y + 2, 1, 1); } });
  return sp;
};
const URL_ = {};
const durl = (k, f) => { if (URL_[k] !== undefined) return URL_[k]; try { URL_[k] = f().n.toDataURL(); } catch (e) { URL_[k] = ''; } return URL_[k]; };
const goldU = () => durl('g', () => rsStar('res-star', { h: '#fff6c8', o: '#ffd23c', d: '#e08a1e', w: '#ffffff' }));
const greyU = () => durl('s', () => rsStar('res-stargr', { h: '#59627a', o: '#3a4152', d: '#2a2f3d', w: '#59627a' }));
const lockU = () => durl('l', () => sprite('res-lock', 20, 24, g => {
  g.fillStyle = '#aab4c2'; g.fillRect(-6, -10, 3, 9); g.fillRect(3, -10, 3, 9); g.fillRect(-6, -11, 12, 3);
  g.fillStyle = '#ffd23c'; g.fillRect(-9, -2, 18, 13); g.fillStyle = '#e08a1e'; g.fillRect(-9, 7, 18, 4);
  g.fillStyle = '#fff6c8'; g.fillRect(-9, -2, 18, 2); g.fillStyle = '#262c38'; g.fillRect(-1, 1, 3, 6);
}));

/* ---- styles ---- */
const css = document.createElement('style');
css.textContent = `
#resT{gap:6px;cursor:pointer;width:min(100%,360px)}
#resT .it{padding:6px 10px;font:400 11px/1.4 "Press Start 2P",monospace}
#resT .it span{font-size:inherit;opacity:1}
#resT .it b{font:inherit;color:#ffd23c;text-align:right}#resT .it i{font-style:normal;color:var(--cy);margin-left:8px}
#resT .res-h{visibility:hidden}
#resT .res-in{animation:res-pop .16s steps(2) both}
#resT h2{margin:0}
.res-stars{display:flex;gap:12px;justify-content:center;padding:4px 0}
.res-stars img{width:48px;height:48px;image-rendering:pixelated;display:block}
.res-stars img.res-on{animation:res-stamp .3s steps(3) both}
@keyframes res-stamp{0%{transform:scale(2.4)}100%{transform:scale(1)}}
@keyframes res-pop{0%{transform:translateX(-12px)}100%{transform:none}}
.res-tiny{display:flex;gap:2px;justify-content:center}
.card .res-tiny img{width:16px;height:16px;aspect-ratio:auto;box-shadow:none}
.card .res-best{font:400 8px/1.2 "Press Start 2P",monospace;color:#ffd23c}
.card .res-lock{width:20px;height:24px;aspect-ratio:auto;box-shadow:none;align-self:center}
#resStars img{width:16px;height:16px;image-rendering:pixelated;vertical-align:-1px;margin-right:8px}
.res-go{display:block;width:min(100%,360px);text-align:center;font-size:15px}
.res-bar{position:relative;height:16px;margin:8px 0;background:#12141c;box-shadow:0 0 0 2px #000,inset 2px 2px 0 #0a0b10}
.res-bar u{position:absolute;left:0;top:0;bottom:0;background:var(--cy);box-shadow:inset 0 4px 0 #b8fff6,inset 0 -4px 0 #1f8a84}
.res-bar s{position:absolute;top:0;bottom:0;width:2px;background:#12141c}
.res-bar em{position:absolute;right:-2px;top:-4px;width:12px;height:24px;background:#c8321e;box-shadow:0 0 0 2px #000,inset 2px 2px 0 #ff8a5a}
.res-go p.res-tip{color:var(--or);font-size:14px}`;
document.head.appendChild(css);

const fmt = n => Math.round(n).toLocaleString('en-US');
const mmss = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const pctOf = () => ST.sp > 0 ? clamp(Math.round(ST.k / ST.sp * 100), 0, 100) : 100;

/* ---- stats ---- */
const _sl = startLevel;
startLevel = function () {
  const r = _sl.apply(this, arguments);
  ST.sp = ST.k = ST.h = ST.ll = ST.bu = ST.t = 0;
  return r;
};
/* SHOT DOWN % counts only the stage's main targets. Bonus targets (drifting rocks of every kind, squadron
   ships, the Courier, anything spawned while a boss is up) count only when you shoot them down. */
const rsBonus = (k, o) => k === 'rock' || k === 'sq' || k === 'cour' || !!(o && (o.ch || o.shower || o.orb != null));
const _mk = mk;
mk = function (k, x, y, o) {
  const e = _mk.apply(this, arguments);
  if (e && state === 'play') e.rsC = !boss && !rsBonus(k, o) ? 1 : 2;
  if (e && e.rsC === 1) ST.sp++;
  return e;
};
const _kill = kill;
kill = function (e) {
  if (clearT <= 0 && e && e.rsC && !e.rsK) { e.rsK = 1; ST.k++; if (e.rsC === 2) ST.sp++; }
  return _kill.apply(this, arguments);
};
const _hurt = hurt;
hurt = function () {
  const h0 = P ? P.hp : 0, r = _hurt.apply(this, arguments);
  if (P && P.hp < h0) ST.h++;
  return r;
};
const _bomb = bomb;
bomb = function () {
  const b0 = P ? P.bombs : 0, r = _bomb.apply(this, arguments);
  if (P && P.bombs < b0) ST.bu++;
  return r;
};
const _upd = update;
update = function (dt) {
  const l0 = lives, r = _upd.apply(this, arguments);
  if (lives < l0) ST.ll += l0 - lives;
  ST.t += +dt || 0;
  return r;
};

/* ---- stage tally ---- */
let RES = null;
const _ld = levelDone;
levelDone = function () {
  RES = null;
  if (!rsRush()) {
    rsFix();
    const pct = pctOf(), easy = save.diff === 0, bl = P ? P.bombs | 0 : 0;
    let s = 1;
    if (pct >= 70 && ST.ll === 0) s = 2;
    if (s === 2 && pct >= 85 && ST.h <= (easy ? 4 : 2)) s = 3;
    const prev = save.results.st[li] | 0, nw = Math.max(0, s - prev);
    const bon = { b: 200 * bl, l: ST.ll === 0 ? 1000 : 0, h: ST.h === 0 ? 2000 : 0, p: pct * 20 };
    if (FX.score && FX.score.add) for (const k in bon) if (bon[k] > 0) FX.score.add(bon[k], undefined, undefined, undefined, 1);
    if (nw) { save.cr += 150 * nw; earned += 150 * nw; }
    save.results.st[li] = Math.max(prev, s);
    RES = { s, nw, pct, bl, bon, h: ST.h, ll: ST.ll, t: ST.t, li };
  }
  const r = _ld.apply(this, arguments);
  if (RES) try { tally(RES); } catch (e) {}
  return r;
};
function tally(R) {
  const bt = ov.querySelector('button.big');
  if (!bt || document.getElementById('resT')) return;
  const sr = FX.score && FX.score.result;
  const row = (a, b, c) => `<div class="it res-h res-r"><span>${a}</span><b>${b}${c ? `<i>+${fmt(c)}</i>` : ''}</b></div>`;
  let h = row('SHOT DOWN', R.pct + '%', R.bon.p) + row('HITS TAKEN', R.h, R.bon.h) + row('LIVES LOST', R.ll, R.bon.l) + row('BOMBS LEFT', R.bl, R.bon.b) + row('TIME', mmss(R.t), 0);
  if (sr && typeof sr.score === 'number') h += row('SCORE', fmt(sr.score), 0) + (sr.isNew ? '<h2 class="res-h res-r">NEW BEST!</h2>' : '');
  let st = '';
  for (let k = 0; k < 3; k++) st += `<img alt="" data-on="${k < R.s ? 1 : 0}" src="${greyU()}">`;
  h += `<div class="res-stars" title="${R.s} of 3 stars${R.nw ? ', +' + 150 * R.nw + ' $' : ''}">${st}</div>`;
  bt.insertAdjacentHTML('beforebegin', `<div class="shop" id="resT">${h}</div>`);
  const el = document.getElementById('resT');
  rsT = 0; rsDone = 0; rsRows = 0; rsStars = 0;
  el.addEventListener('click', () => { rsT = 99; rsStep(el, 1); });
}
function rsStep(el, quiet) {
  const rows = el.querySelectorAll(".res-r"), imgs = el.querySelectorAll('.res-stars img');
  while (rsRows < rows.length && rsT >= .4 * (rsRows + 1)) {
    const e = rows[rsRows]; e.classList.remove('res-h'); e.classList.add('res-in');
    if (!quiet) beep(900 + rsRows * 80, .04, 'square', .03);
    rsRows++;
  }
  const t0 = .4 * (rows.length + 1);
  while (rsStars < 3 && rsT >= t0 + .4 * rsStars) {
    const im = imgs[rsStars];
    if (im && im.dataset.on === '1') {
      im.src = goldU(); im.classList.add('res-on');
      if (!quiet) { boom(.08); beep(523 * Math.pow(1.26, rsStars), .15, 'triangle', .06); }
    }
    rsStars++;
  }
  if (rsRows >= rows.length && rsStars >= 3) rsDone = 1;
}
const _draw = draw;
draw = function () {
  const r = _draw.apply(this, arguments);
  if (state !== 'play' && !rsDone) {
    const el = document.getElementById('resT');
    if (el && el.isConnected) { rsT += 1 / 60; rsStep(el, 0); }
  }
  return r;
};

/* ---- ship down ---- */
const _go = gameOver;
gameOver = function () {
  const r = _go.apply(this, arguments);
  if (!rsRush()) try {
    const bt = ov.querySelector('button.big');
    if (bt && !ov.querySelector('.res-go')) {
      const n = waves || 1, w = clamp(wave, 0, n), atBoss = !!boss || (w >= n && bossWarn > 0);
      const q = atBoss ? 100 : Math.round(w / n * 100);
      let ticks = ''; for (let k = 1; k < 10; k++) ticks += `<s style="left:${k * 10}%"></s>`;
      const tip = ST.h >= 5 && (save.up.arm | 0) < 2 ? 'Tip: Armor in the Hangar gives more shield'
        : P && P.bombs > 0 ? 'Tip: press BOMB when the screen is full'
        : save.diff !== 0 ? 'Tip: try Easy for a calmer flight' : 'Tip: upgrade your cannon in the Hangar';
      bt.insertAdjacentHTML('beforebegin', `<div class="it res-go"><p>${atBoss ? 'You reached the stage boss!' : `You reached wave ${w} of ${n}`}</p>
        <div class="res-bar"><u style="width:${q}%"></u>${ticks}<em></em></div><p class="res-tip">${tip}</p></div>`);
    }
  } catch (e) {}
  return r;
};

/* ---- menu cards ---- */
const total = () => { rsFix(); let n = 0; for (let i = 0; i < LV.length; i++) n += save.results.st[i] | 0; return n; };
const _menu = menu;
menu = function () {
  if (save.up !== rsUp) { rsUp = save.up; rsZero(); }
  const r = _menu.apply(this, arguments);
  try {
    rsFix();
    const grid = ov.querySelector('.grid');
    if (grid && !document.getElementById('resStars')) {
      grid.insertAdjacentHTML('beforebegin', `<p class="cr" id="resStars"><img alt="" src="${goldU()}">STARS ${total()} / ${LV.length * 3}</p>`);
      grid.querySelectorAll('.card').forEach(cd => {
        const i = +cd.dataset.i;
        if (!(i >= 0)) return;
        if (i < save.unl) {
          const s = save.results.st[i] | 0;
          let h = '<span class="res-tiny">';
          for (let k = 0; k < 3; k++) h += `<img alt="" src="${k < s ? goldU() : greyU()}">`;
          h += '</span>';
          const b = FX.score && FX.score.best ? FX.score.best(i, save.diff) : 0;
          if (b > 0) h += `<span class="res-best">BEST ${fmt(b)}</span>`;
          cd.insertAdjacentHTML('beforeend', h);
        } else {
          cd.title = 'Beat stage ' + i + ' first';
          cd.insertAdjacentHTML('beforeend', `<img class="res-lock" alt="" src="${lockU()}">`);
        }
      });
    }
  } catch (e) {}
  return r;
};

FX.results = { stars: i => (save.results && save.results.st[i]) | 0, total, stats: () => Object.assign({}, ST) };
