/* 05-shipfx: Falcon feedback, all cosmetic. Hit flash + chips + red edge frame + HP ghost bar, heal frame,
   low-HP danger (corner brackets, '!' badge, smoke, heartbeat, arrow to heal pickups), respawn beam,
   lost-life blink, engine trail / wingtip streaks / rapid-fire afterimages.
   Wraps update (event snapshot), scene, hud, startLevel. Stores nothing. Exposes FX.shipfx.danger(). */
const SFP = [], SFT = [];                       // fixed pools: chips/plus/smoke (64), exhaust/streaks (48)
for (let i = 0; i < 64; i++) SFP.push({ l: 0, ml: 1, x: 0, y: 0, vx: 0, vy: 0, k: 0 });
for (let i = 0; i < 48; i++) SFT.push({ l: 0, ml: 1, x: 0, y: 0, vx: 0, vy: 0, k: 0 });
let pi = 0, ti = 0;
const emit = (pool, k, x, y, vx, vy, l) => {
  let p;
  if (pool === SFP) { p = SFP[pi]; pi = (pi + 1) % SFP.length; } else { p = SFT[ti]; ti = (ti + 1) % SFT.length; }
  p.k = k; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.l = p.ml = l;
};
const RING = [];                                // past positions for afterimages
for (let i = 0; i < 6; i++) RING.push({ x: 0, y: 0 });
let ri0 = 0, ringT = 0, ringN = 0;
let hitT = 0, healT = 0, beamT = 0, lostT = 0, lostI = 0, ghost = 1, ghostHold = 0;
let trailT = 0, smokeT = 0, hbT = 0, hb2 = -1;
const EXSP = () => sprite('shipfx-ex', 10, 14, g => {
  g.fillStyle = '#ffd23c'; g.fillRect(-3, -7, 6, 8); g.fillRect(-3, 3, 6, 4);
  g.fillStyle = '#fff6c8'; g.fillRect(-3, -7, 2, 6);
});
const danger = () => !!(P && P.dead <= 0 && P.max > 0 && P.hp / P.max <= .35);
const soft = () => !!(FX.settings && FX.settings.get && FX.settings.get('flash', 'full') === 'soft');
function reset() {
  for (const p of SFP) p.l = 0;
  for (const p of SFT) p.l = 0;
  hitT = healT = beamT = lostT = 0; ghost = 1; ghostHold = 0; trailT = smokeT = 0; hbT = .6; hb2 = -1; ringN = 0; ringT = 0;
}
FX.shipfx = { danger };

const _sl = startLevel;
startLevel = function () { const r = _sl.apply(this, arguments); reset(); return r; };

const _upd = update;
update = function (dt) {
  const p0 = P, h0 = P ? P.hp : 0, l0 = lives;
  const r = _upd.apply(this, arguments);
  try {
    dt = +dt || 0;
    if (!P) return r;
    if (P === p0) {
      if (P.hp < h0) { // hit
        hitT = .2; ghostHold = .25;
        for (let i = 0; i < 6; i++) { const a = (i + R() * .6) / 6 * TAU, v = rnd(170, 260); emit(SFP, 0, P.x + Math.cos(a) * 16, P.y + Math.sin(a) * 16, Math.cos(a) * v, Math.sin(a) * v - 40, rnd(.25, .4)); }
      } else if (P.hp > h0) { // heal
        healT = .3;
        for (let i = 0; i < 6; i++) emit(SFP, 1, P.x + rnd(-26, 26), P.y + rnd(-10, 20), 0, -rnd(60, 110), rnd(.45, .7));
      }
    } else { // respawned (core newPlayer makes a new object)
      beamT = .4; ghost = 1; ghostHold = 0; beep(500, .25, 'triangle', .05, 1500);
    }
    if (lives < l0) { lostT = .6; lostI = Math.max(0, lives); }
    hitT = Math.max(0, hitT - dt); healT = Math.max(0, healT - dt); beamT = Math.max(0, beamT - dt); lostT = Math.max(0, lostT - dt);
    const q = clamp(P.hp / P.max, 0, 1);
    if (ghostHold > 0) ghostHold -= dt; else ghost -= .6 * dt;
    if (ghost < q) ghost = q;
    for (const pool of [SFP, SFT]) for (const p of pool) if (p.l > 0) { p.l -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.k === 0) p.vy += 400 * dt; }
    const alive = P.dead <= 0;
    if (alive) {
      trailT -= dt;
      if (trailT <= 0) {
        trailT = .03;
        for (const s of [-7, 7]) emit(SFT, 3, P.x + s, P.y + 40, 0, 120, .22);
        if (Math.abs(P.bank) > .4) for (const s of [-28, 28]) emit(SFT, 4, P.x + s, P.y + 24, 0, 120, .14);
      }
      ringT -= dt;
      if (ringT <= 0) { ringT = .03; RING[ri0].x = P.x; RING[ri0].y = P.y; ri0 = (ri0 + 1) % 6; ringN = Math.min(6, ringN + 1); }
    } else ringN = 0;
    if (danger()) {
      smokeT -= dt;
      if (smokeT <= 0) { smokeT = .06; emit(SFP, 2, P.x + rnd(-6, 6), P.y + 30, rnd(-12, 12), 90, .4); }
      if (clearT <= 0) {
        hbT -= dt;
        if (hbT <= 0) { hbT = 1.2; hb2 = .15; beep(196, .09, 'triangle', .05); }
        if (hb2 >= 0) { hb2 -= dt; if (hb2 < 0) beep(147, .12, 'triangle', .05); }
      } else hb2 = -1;
    } else { hbT = .6; hb2 = -1; }
  } catch (e) { }
  return r;
};

const TRC = ['#ffe27a', '#ff8a1e', '#c8321e'];
const _scene = scene;
scene = function () {
  try {
    for (const p of SFT) if (p.l > 0) {
      if (p.k === 3) { const a = 1 - p.l / p.ml, s = a < .5 ? 4 : 2; px(p.x - s / 2, p.y, s, s, TRC[Math.min(2, Math.floor(a * 3))]); }
      else px(p.x, p.y, 2, 6, '#ffffff');
    }
    if (P && P.dead <= 0 && P.rapid > 0 && ringN >= 6) {
      const PS = playerSp(P.bank < -.4 ? -1 : P.bank > .4 ? 1 : 0);
      for (const back of [6, 3]) { const e = RING[(ri0 - back + 12) % 6]; if (Math.abs(e.x - P.x) + Math.abs(e.y - P.y) > 6) put(PS, e.x, e.y, { img: PS.f, a: .25 }); }
    }
    if (beamT > 0 && P.dead <= 0) {
      const k = 1 - beamT / .4, off = r2(14 - 12 * k), top = r2(Math.max(0, P.y)), fk = Math.floor(T * 30) % 2;
      for (const s of [-1, 1]) { const x = r2(P.x + s * off); px(x - 2, 0, 6, top, fk ? '#5fe3d6' : '#c8fffa'); px(x, 0, 2, top, '#ffffff'); }
    }
  } catch (e) { }
  const r = _scene.apply(this, arguments);
  try {
    if (!P) return r;
    const alive = P.dead <= 0;
    if (alive && hitT > .08) put(playerSp(P.bank < -.4 ? -1 : P.bank > .4 ? 1 : 0), P.x, P.y, { fl: 1 });
    for (const p of SFP) if (p.l > 0) {
      if (p.k === 0) { const s = p.l > p.ml * .5 ? 4 : 2; px(p.x, p.y, s, s, p.l > p.ml * .6 ? '#ffffff' : '#5fe3d6'); }
      else if (p.k === 1) { const col = p.l > p.ml * .4 ? '#3fd45a' : '#1f8a3a'; px(p.x - 2, p.y - 6, 4, 12, col); px(p.x - 6, p.y - 2, 12, 4, col); px(p.x - 2, p.y - 2, 4, 4, '#d8ffd0'); }
      else if (p.l > p.ml * .45) { px(p.x - 4, p.y - 2, 8, 8, '#3a4352'); px(p.x - 2, p.y, 4, 4, '#8a94a4'); px(p.x - 2, p.y, 2, 2, '#c8d0da'); }
      else { px(p.x - 2, p.y, 6, 6, '#3a4352'); px(p.x, p.y + 2, 2, 2, '#8a94a4'); }
    }
    if (danger()) for (const p of pk) if (p.k === 'heal') {
      const y = p.y + Math.sin(p.t * 6) * 3 - 26 - 18 + (Math.floor(T * 4) % 2) * 4;
      px(p.x - 9, y - 2, 18, 4, '#0d3a18'); px(p.x - 7, y + 2, 14, 4, '#0d3a18'); px(p.x - 5, y + 6, 10, 4, '#0d3a18'); px(p.x - 3, y + 10, 6, 2, '#0d3a18');
      px(p.x - 7, y, 14, 4, '#3fd45a'); px(p.x - 5, y + 4, 10, 4, '#3fd45a'); px(p.x - 3, y + 8, 6, 2, '#a8f0a0');
    }
  } catch (e) { }
  return r;
};

const frame4 = (t, col) => { px(0, 0, W, t, col); px(0, H - t, W, t, col); px(0, 0, t, H, col); px(W - t, 0, t, H, col); };
const _hud = hud;
hud = function () {
  const r = _hud.apply(this, arguments);
  try {
    if (!P) return r;
    const q = clamp(P.hp / P.max, 0, 1);
    if (ghost < q) ghost = q;
    if (ghost > q) { const x0 = 10 + r2(164 * q), w = r2(164 * (ghost - q)); if (w > 0) { px(x0, 10, w, 14, '#ffffff'); for (let x = 30; x < 174; x += 20) px(x, 10, 2, 14, '#1a1222'); } }
    if (danger()) {
      const S = EXSP(); c.drawImage(S.n, 180, 8, S.w, S.h);
      if (Math.floor(T * 1.5) % 2) for (const [x, y, sx, sy] of [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]]) {
        px(sx > 0 ? 0 : W - 24, sy > 0 ? 0 : H - 6, 24, 6, '#e8231e');
        px(sx > 0 ? 0 : W - 6, sy > 0 ? 0 : H - 24, 6, 24, '#e8231e');
        px(sx > 0 ? 6 : W - 24, sy > 0 ? 6 : H - 8, 18, 2, '#6a1410');
        px(sx > 0 ? 6 : W - 8, sy > 0 ? 6 : H - 24, 2, 18, '#6a1410');
      }
    }
    const sf = soft() ? .5 : 1;
    if (hitT > 0) frame4((hitT > .08 ? 8 : 4) * sf, '#e8231e');
    else if (healT > 0) frame4(4 * sf, '#3fd45a');
    if (lostT > 0 && Math.floor(lostT * 10) % 2) put(lifeSp(), 20 + lostI * 24, 42, { fl: 1 });
  } catch (e) { }
  return r;
};
