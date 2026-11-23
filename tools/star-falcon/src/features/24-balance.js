/* 24-balance: balance pass - difficulty table, boss HP fit to firepower, pay curve, weapon value, stage length,
   and a "second wind" helper (shield hits, extra life, pity heals) after repeated losses on a stage.
   Wraps mk, shoot, startLevel, update, kill, drop, mkBoss, fire, hurt, shop, gameOver, levelDone, menu, updEnemy,
   spawnWave, scene, hud. Stores save.balance = {f:[fails per stage x8]}. Exposes FX.balance = {pf, shield}. */
const HPM = [.85, 1, 1.25], GAP = [1.15, 1, .9], LIVES = [4, 3, 3], PAY = [1, 1, 1.3], BHP = [.8, 1, 1.35], PITY = [3, 2, 0];
const STG = [18, 22, 24, 26, 28, 30, 32, 34], WANT = [6, 10, 14, 19, 24, 28, 32, 36];
const P_GUN = [6.25, 12.5, 18.75, 25, 41.7], P_MIS = [0, 7.3, 10, 16], P_LAS = [0, 6.7, 10.7, 16.7], P_TW = [0, 2, 3.5, 5], P_DRN = [0, 4, 7, 10];
/* wave enemies (Normal/Hard) get tougher as the Falcon outguns WW[stage]; PFC/WFC cap the boss/wave HP fit per difficulty */
const WW = [6, 9, 12, 15, 18, 21, 24, 27], PFC = [2.2, 2.4, 3], WFC = [1, 2.2, 3];
const dI = () => clamp(save.diff | 0, 0, 2);
const rushOn = () => !!(FX.rush && FX.rush.on && FX.rush.on());
const helpOn = () => { try { return !FX.settings || !FX.settings.get || FX.settings.get('help', 'on') !== 'off'; } catch (e) { return true; } };
if (FX.settings && FX.settings.register) FX.settings.register({ k: 'help', n: 'Helper', opts: [['on', 'On'], ['off', 'Off']], def: 'on' });
const balFix = () => { const b = save.balance; if (!b || typeof b !== 'object' || !Array.isArray(b.f)) save.balance = { f: [0, 0, 0, 0, 0, 0, 0, 0] };
  const f = save.balance.f; for (let i = 0; i < LV.length; i++) f[i] = Math.max(0, f[i] | 0); };
balFix();
(FX.onReset = FX.onReset || []).push(() => { save.balance = { f: [0, 0, 0, 0, 0, 0, 0, 0] }; });

/* ---- one-time table tweaks ---- */
DEF.rock.v = 15;
FR[2] = .7; /* Hard: enemies and bosses fire a bit more often (core .8) */
const shopK = k => SHOP.find(s => s.k === k);
if (shopK('las')) shopK('las').p = 450;
if (shopK('arm')) { shopK('arm').p = 250; shopK('arm').d = '+25 shield, longer blink after a hit'; }
/* v2 integration: the feature modules roughly tripled income per stage (more enemies, coins, stars, boss bonus),
   so Hangar prices rise: weapon lines x3, armor x2, bomb x1.5, so the last upgrade lands around stage 7-8 */
const PMUL = { gun: 3, twin: 3, mis: 3, las: 3 };
for (const s of SHOP) s.p = s.flat ? Math.round(s.p * 1.5) : s.p * (PMUL[s.k] || 2);

/* rough player firepower (dps units) from Hangar levels, incl. Wing drones from 12-weapons */
const estPow = () => { const u = save.up, dl = save.drones && save.drones.lv | 0 || 0;
  return P_GUN[clamp(u.gun | 0, 1, 5) - 1] * .8 + P_MIS[clamp(u.mis | 0, 0, 3)] + P_LAS[clamp(u.las | 0, 0, 3)] + P_TW[clamp(u.twin | 0, 0, 3)] + P_DRN[clamp(dl, 0, 3)]; };
let wf = 1; /* wave-enemy HP fit, set per stage at startLevel (Normal/Hard only) */
let pf = 1, shieldHits = 0, healAtWarn = 0, pityN = 0, pityT = 12, bw0 = 0;
FX.balance = { pf: () => pf, shield: () => shieldHits };

/* ---- enemies: HP by difficulty, pay curve ---- */
const _mk = mk;
mk = function (...a) {
  const e = _mk.apply(this, a);
  if (e && typeof e === 'object') {
    if (typeof e.hp === 'number') e.hp = Math.ceil(e.hp * HPM[dI()] * (boss ? 1 : wf));
    if (typeof e.v === 'number') { if (e.k === 'rock') e.v += (e.vr | 0) * 5; e.v = Math.round(e.v * (1 + li * .1) / 5) * 5; }
  }
  return e;
};
const _shoot = shoot;
shoot = function (...a) {
  const arr = eb, n0 = arr.length, r = _shoot.apply(this, a);
  if (dI() === 2 && eb === arr) for (let i = n0; i < arr.length; i++) { const b = arr[i]; if (b && typeof b.vx === 'number') { b.vx *= 1.1; b.vy *= 1.1; } }
  return r;
};
const _kill = kill;
kill = function (...a) {
  const c0 = save.cr, r = _kill.apply(this, a), m = PAY[dI()];
  if (m !== 1) { const extra = Math.round((save.cr - c0) * (m - 1) / 5) * 5; if (extra > 0) { save.cr += extra; earned += extra; } }
  return r;
};
const _drop = drop;
drop = function (...a) {
  const arr = pk, n0 = arr.length, r = _drop.apply(this, a);
  if (dI() === 0 && pk === arr && pk.length === n0 && P && P.hp < P.max * .4 && R() < .06) pk.push({ k: 'heal', x: a[0], y: a[1], t: 0 });
  if (dI() === 2 && pk === arr && pk.length === n0 + 1 && pk[n0] && pk[n0].k === 'heal' && R() < .5) pk.pop(); /* Hard: half the repair drops */
  return r;
};

/* ---- stage 1 teaching shots: one lead scout per scout wave fires a slow straight shot ---- */
const _sw = spawnWave;
spawnWave = function (...a) {
  const arr = en, n0 = arr.length, r = _sw.apply(this, a);
  if (en === arr) { const sc = arr.slice(n0).filter(e => e && e.k === 'scout'); if (sc.length) sc[sc.length >> 1].lead = 1; }
  return r;
};
const _ue = updEnemy;
updEnemy = function (...a) {
  const r = _ue.apply(this, a), e = a[0];
  if (e && e.lead && !e.shot && e.hp > 0 && e.y > 130 && e.y < H - 160 && (li > 0 || wave >= 8)) { e.shot = 1; shoot(e.x, e.y + 12, Math.PI / 2, 120); }
  return r;
};

/* ---- weapons ---- */
const _fire = fire;
fire = function (...a) {
  const arr = pb, n0 = arr.length, r = _fire.apply(this, a);
  if (pb === arr) for (let i = n0; i < arr.length; i++) { const b = arr[i]; if (!b) continue;
    if (b.k === 2) b.d = 4 + 2 * save.up.las;
    else if (b.k === 0 && Math.abs(b.vx) === 170) { b.vx *= .6; b.d = save.up.twin * .8 + .4; } }
  return r;
};
const _hurt = hurt;
hurt = function (...a) {
  if (shieldHits > 0 && P && P.inv <= 0 && P.dead <= 0) { shieldHits--; P.inv = 1; beep(900, .12, 'triangle', .04, 1400); }
  const h0 = P ? P.hp : 0, r = _hurt.apply(this, a);
  if (P && P.hp < h0 && P.hp > 0 && P.dead <= 0) P.inv = Math.max(P.inv, .5 + .1 * (save.up.arm | 0));
  return r;
};

/* ---- boss HP fit ---- */
const _mb = mkBoss;
mkBoss = function (...a) {
  const r = _mb.apply(this, a);
  pf = clamp(estPow() / WANT[clamp(li, 0, 7)], 1, PFC[dI()]);
  if (boss && boss.max > 0) boss.hp = boss.max = Math.max(1, Math.round(boss.max * BHP[dI()] * pf));
  return r;
};

/* ---- stage start: lives, length, second wind ---- */
const _sl = startLevel;
startLevel = function (...a) {
  const r = _sl.apply(this, a), i = clamp(li, 0, 7), d = dI();
  balFix(); lives = LIVES[d]; pf = 1; wf = rushOn() ? 1 : clamp(estPow() / WW[i], 1, WFC[d]); shieldHits = 0; healAtWarn = 0; pityN = 0; pityT = 12; bw0 = 0;
  if (!rushOn()) { waves = STG[i]; if (wave > waves) wave = waves; }
  const t = !rushOn() && d < 2 && helpOn() ? Math.min(3, save.balance.f[i] | 0) : 0;
  if (t >= 2) { lives += 1; shieldHits = 2; }
  if (t >= 3) { shieldHits = 3; healAtWarn = 1; }
  return r;
};
const _upd = update;
update = function (...a) {
  const dt = +a[0] || 0, w0 = wave, b0 = boss, r = _upd.apply(this, a);
  if (state !== 'play') return r;
  if (wave > w0) {
    waveT = Math.max(.95, waveT * GAP[dI()]);
    let tk = 0; for (const e of en) if (e.k === 'tank' && e.hp > 0) tk++;
    if (en.length > 14 || tk >= 2) waveT += .7;
  }
  if (b0 && !boss && (b0.hp <= 0 || clearT > 0)) {
    const bonus = Math.round((pf * BHP[dI()] - 1) * (500 + 200 * li) / 50) * 50;
    if (bonus > 0) { save.cr += bonus; earned += bonus; }
  }
  if (bossWarn > 0 && bw0 <= 0 && healAtWarn) { healAtWarn = 0; pk.push({ k: 'heal', x: W / 2, y: -20, t: 0 }); }
  bw0 = bossWarn;
  pityT += dt;
  if (P && P.dead <= 0 && clearT <= 0 && helpOn() && pityN < PITY[dI()] && P.hp < P.max * .35 && pityT >= 12 && !pk.some(p => p.k === 'heal')) {
    pityN++; pityT = 0; pk.push({ k: 'heal', x: clamp(P.x, 60, W - 60), y: -20, t: 0 });
  }
  return r;
};
const _go = gameOver;
gameOver = function (...a) {
  balFix(); const i = clamp(li, 0, 7), rush = rushOn();
  if (!rush) save.balance.f[i]++;
  const r = _go.apply(this, a);
  if (!rush && save.balance.f[i] >= 2 && dI() < 2 && helpOn() && state === 'over') ov.insertAdjacentHTML('beforeend', "<p class='sm bal-help'>Help is coming next try!</p>");
  return r;
};
const _ld = levelDone;
levelDone = function (...a) { balFix(); if (!rushOn()) save.balance.f[clamp(li, 0, 7)] = 0; return _ld.apply(this, a); };

/* ---- screens ---- */
const DTXT = ['Gentle: weaker ships, extra life', 'Classic arcade', 'Tough ships, +30% $'];
const _menu = menu;
menu = function (...a) {
  const r = _menu.apply(this, a);
  const db = ov.querySelector('button[data-a="diff"]'), row = db && db.closest('.row');
  if (row && !ov.querySelector('.bal-dn')) row.insertAdjacentHTML('afterend', `<p class='sm bal-dn'>${DTXT[dI()]}</p>`);
  return r;
};
const HINT = {
  gun: l => 'Power ' + [6, 12, 19, 25, 42][l - 1] + (l < 5 ? '>' + [6, 12, 19, 25, 42][l] : ''),
  twin: l => 'Power ' + [0, 2, 4, 5][l] + (l < 3 ? '>' + [0, 2, 4, 5][l + 1] : ''),
  mis: l => 'Power ' + [0, 7, 10, 16][l] + (l < 3 ? '>' + [0, 7, 10, 16][l + 1] : ''),
  las: l => 'Power ' + [0, 7, 11, 17][l] + (l < 3 ? '>' + [0, 7, 11, 17][l + 1] : ''),
  arm: l => 'Shield ' + (100 + 25 * l) + (l < 4 ? '>' + (125 + 25 * l) : ''),
  bomb: l => 'Bombs ' + l + (l < 5 ? '>' + (l + 1) : '')
};
const _shop = shop;
shop = function (...a) {
  const r = _shop.apply(this, a);
  for (const it of ov.querySelectorAll('.it')) {
    const bt = it.querySelector('button[data-a="buy"]'), k = bt && bt.dataset.k, sp = it.querySelector('span');
    if (!k || !HINT[k] || !sp || it.querySelector('.bal-pw')) continue;
    sp.insertAdjacentHTML('afterend', `<span class="bal-pw"> · ${HINT[k](save.up[k] | 0)}</span>`);
  }
  return r;
};
const st = document.createElement('style');
st.textContent = '.it .bal-pw{color:#5fe3d6;opacity:1;white-space:nowrap}.bal-help{color:#5fe3d6;opacity:1}';
document.head.appendChild(st);

/* ---- shield ring + HUD pips ---- */
const ring = f => sprite('bal-ring' + f, 100, 104, g => {
  g.strokeStyle = '#2fc4ba'; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 2, 44, 46, 0, 0, TAU); g.stroke();
  g.strokeStyle = '#a8fff4'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 2, 44, 46, 0, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
  g.fillStyle = '#ffffff';
  for (let j = 0; j < 4; j++) { const t = (j / 4 + f / 8) * TAU; g.fillRect(Math.cos(t) * 44 - 3, 2 + Math.sin(t) * 46 - 3, 6, 6); }
}, [14, 70, 80]);
const _scene = scene;
scene = function (...a) {
  const r = _scene.apply(this, a);
  if (shieldHits > 0 && P && P.dead <= 0) put(ring(Math.floor(T * 6) % 2), P.x, P.y, { a: P.inv > 0 && Math.floor(T * 12) % 2 ? .5 : 0 });
  return r;
};
const _hud = hud;
hud = function (...a) {
  const r = _hud.apply(this, a);
  const x0 = Math.max(120, 14 + lives * 24); /* slide right if a 5th life icon would overlap */
  for (let i = 0; i < shieldHits; i++) { const x = x0 + i * 14; px(x - 2, 36, 12, 10, '#1a1222'); px(x, 38, 8, 6, '#2fc4ba'); px(x, 38, 8, 2, '#a8fff4'); }
  return r;
};
