/* Robo Jump — bounce up through five sky zones to the Star Station (600 m) */
Arcade.game('robo-jump', { w: 180, h: 280, pad: 'lr',
help: 'The robot bounces by itself: steer it left / right with the arrow keys, the buttons, or by holding your finger on the side you want to go. It can leave one side of the screen and come back on the other. Climb 600 m through five zones to the Star Station! Blue platforms move, brown ones crumble, red springs shoot you up. Grab golden bolts for points, a green battery for a rocket ride and hearts for extra lives. Land ON a buzz-bug to squash it, but do not bump into one. You have 3 hearts: falling or bumping costs one.',
init(A) {
  const K = Art, W = 180, H = 280, BASE = 262, GOAL = 600, ZM = GOAL / 5, ST = BASE - GOAL * 10, ID = 'robo-jump:';
  /* per zone: name, sky, platform colours, gap range, chance of mover / crumbler / spring / bug */
  const ZN = [
    { n: 'MEADOW', sky: ['#1b3f7a', '#3f86d0', '#9fd0f5'], c: ['#8ae06a', '#3fb45a', '#8a5a2a'], g: [28, 44], mv: 0, br: 0, sp: .12, bug: 0 },
    { n: 'CLOUD TOPS', sky: ['#2a5fb0', '#6fb0ea', '#d8f0ff'], c: ['#ffffff', '#d6e6f6', '#8aa6c8'], g: [32, 52], mv: .25, br: .15, sp: .09, bug: 0 },
    { n: 'SUNSET WINDS', sky: ['#3a2a6a', '#c8507a', '#ffb060'], c: ['#ffd9a0', '#e8873a', '#8a3a2a'], g: [36, 58], mv: .3, br: .2, sp: .08, bug: .17 },
    { n: 'STARRY NIGHT', sky: ['#0a0e2a', '#1c2560', '#4a3a8a'], c: ['#b8a6ff', '#6a5ad0', '#2a2470'], g: [40, 64], mv: .4, br: .22, sp: .07, bug: .23 },
    { n: 'ORBIT', sky: ['#04040c', '#0a0e2a', '#1c1f4a'], c: ['#e6ecf6', '#8a94a4', '#3a4252'], g: [44, 70], mv: .45, br: .25, sp: .07, bug: .28 }];
  const fx = K.fx(), pl = { x: 90, y: BASE, vx: 0, vy: -335, look: 1 };
  let cam = 0, top = BASE, done = 0, lastT = 0, lastGap = 0, nextJet = 70, nextHeart = 140, best = 0, zone = 0, lives = 3;
  let inv = 0, jet = 0, shk = 0, t = 0, won = 0, streak = 0, streakT = 0, banner = 'CLIMB TO THE STAR STATION!', banT = 3, landT = 0, jetS = 0;
  let plats = [{ x: 0, y: BASE, w: W, t: 6, vx: 0 }], items = [], bugs = [], pops = [], notes = [];
  const stars = []; for (let i = 0; i < 46; i++) stars.push([i * 67 % 178, i * 131 % 300, i % 5 ? 1 : 2, i * 37 % 7]);
  const tune = (fs, gap) => fs.forEach((f, i) => notes.push({ at: t + i * (gap || .09), f }));
  const pop = (x, y, s, c) => pops.push({ x, y, s, c: c || '#ffffff', l: .8 });
  const wrapDx = (a, b) => ((a - b) % W + W * 1.5) % W - W / 2;

  function gen() {
    while (!done && top > cam - 70) {
      const rem = top - ST, m = (BASE - top) / 10, z = Math.min(4, m / ZM | 0), Z = ZN[z];
      if (rem <= 66) { top = ST; plats.push({ x: 0, y: ST, w: W, t: 5, vx: 0 }); done = 1; break; }
      let gap = Math.min(A.ri(Z.g[0], Z.g[1]), rem - 30); if (lastT === 2) gap = Math.min(gap, 84 - lastGap); /* a crumbler is never the only way up */
      top -= gap;
      const r = Math.random(), tp = m < 6 ? 0 : r < Z.sp ? 3 : r < Z.sp + Z.mv ? 1 : r < Z.sp + Z.mv + Z.br && lastT !== 2 && rem > 170 ? 2 : 0;
      const p = { x: A.ri(4, 144), y: top, w: 32, t: tp, z, vx: tp === 1 ? (Math.random() < .5 ? -1 : 1) * (30 + z * 7) : 0, bt: 0 };
      plats.push(p);
      if (tp !== 1 && m > nextJet) { items.push({ x: p.x + 16, y: top - 14, k: 1 }); nextJet = m + A.ri(110, 150); }
      else if (tp !== 1 && m > nextHeart && lives < 3) { items.push({ x: p.x + 16, y: top - 14, k: 2 }); nextHeart = m + 130; }
      else if (Math.random() < .3) { const bx = A.ri(20, 160), n = A.ri(1, 3); for (let i = 0; i < n; i++) items.push({ x: bx + (i - (n - 1) / 2) * 12, y: top - 26 + Math.abs(i - (n - 1) / 2) * 4, k: 0 }); }
      if (Math.random() < Z.bug && lastT !== 2 && tp !== 2 && gap > 34) bugs.push({ x: A.ri(30, 150), y: top + gap / 2, vx: (Math.random() < .5 ? -1 : 1) * (18 + z * 4), ph: Math.random() * 6 });
      lastT = tp; lastGap = gap;
    }
    const lim = cam + H + 40; plats = plats.filter(p => p.y < lim && !p.gone); items = items.filter(i => i.y < lim && !i.gone); bugs = bugs.filter(b => b.y < lim && !b.gone);
  }
  gen();

  function hurt(fall) {
    lives--; shk = .3; streak = 0; fx.spark(pl.x, pl.y - 8, ['#ff8a9a', '#e8231e', '#ffffff'], 14, 90);
    if (lives <= 0 && fall) { A.over(); return; }
    if (lives <= 0) { pl.dead = 1; pl.vy = -180; tune([300, 220, 160], .12); return; } /* last bump: tumble off the screen */
    inv = 2; tune([330, 220], .1); pop(pl.x, Math.min(pl.y, cam + H - 30) - 20, 'OUCH!', '#ff8a9a');
    if (fall) { pl.y = cam + H + 4; pl.vy = -600; jetS = .9; } else if (pl.vy < 0) pl.vy = 0;
  }

  function update(dt) {
    t += dt; inv -= dt; shk -= dt; banT -= dt; landT -= dt; streakT -= dt; jetS -= dt; if (streakT < 0) streak = 0;
    while (notes.length && notes[0].at <= t) A.beep(notes.shift().f, .1, 'square', .04);
    for (const q of pops) { q.y -= 22 * dt; q.l -= dt; } if (pops.length && pops[0].l <= 0) pops.shift();
    if (won) { won -= dt; if (Math.random() < dt * 9) fx.spark(A.rnd(20, 160), ST - A.rnd(60, 170), ['#ffd23c', '#5fe3d6', '#ff8a9a', '#ffffff'], 12, 70); if (won <= 0) A.over(true); return; }
    /* steering: keys / pad, or hold a finger (or the mouse) on the side to go to */
    let d = (A.keys.right ? 1 : 0) - (A.keys.left ? 1 : 0);
    if (!d && A.ptr.down && Math.abs(A.ptr.x - pl.x) > 6) d = A.ptr.x > pl.x ? 1 : -1;
    if (pl.dead) d = 0; if (d) pl.look = d;
    pl.vx += (d * 135 - pl.vx) * Math.min(1, dt * 12); pl.x = (pl.x + pl.vx * dt + W) % W;
    const py = pl.y;
    if (jet > 0) { jet -= dt; pl.vy = -430; if (jetS <= 0) jetS = .1; if (Math.random() < dt * 40) fx.puff(pl.x + A.rnd(-4, 4), pl.y + 4, Math.random() < .5 ? '#ffd23c' : '#ff8a1e', 90); if ((t * 10 | 0) !== ((t - dt) * 10 | 0)) A.beep(140 + Math.random() * 60, .08, 'sawtooth', .025); }
    else pl.vy = Math.min(520, pl.vy + 620 * dt);
    pl.y += pl.vy * dt;
    for (const p of plats) {
      p.bt -= dt; if (p.t === 1) { p.x += p.vx * dt; if (p.x < 2 && p.vx < 0 || p.x > 146 && p.vx > 0) p.vx *= -1; }
      if (pl.dead || pl.vy <= 0 || p.gone || py > p.y + 2 || pl.y < p.y || Math.abs(wrapDx(pl.x, p.x + p.w / 2)) > p.w / 2 + 5) continue;
      pl.y = p.y; landT = .1; p.bt = .12; fx.puff(pl.x - 5, p.y - 1, '#ffffff', -8); fx.puff(pl.x + 5, p.y - 1, '#ffffff', -8);
      if (p.t === 5) { won = 2.2; pl.vy = 0; pl.vx = 0; jet = 0; const bonus = lives * 100; A.add(bonus); pop(90, ST - 60, 'HEARTS BONUS +' + bonus, '#ffd23c'); banner = 'STAR STATION REACHED!'; banT = 3; tune([523, 659, 784, 1047, 784, 1047], .12); return; }
      if (p.t === 3) { pl.vy = -525; p.bt = .3; tune([520, 780, 1040], .05); fx.spark(pl.x, p.y, ['#ffd23c', '#ffffff'], 8, 60); }
      else { pl.vy = -335; A.beep(p.t === 6 ? 330 : 440, .05); }
      if (p.t === 2) { p.gone = 1; A.beep(200, .12, 'sawtooth', .03); fx.spark(p.x + 16, p.y + 4, ['#e0b070', '#9a6a34', '#5a3418'], 14, 60); }
    }
    for (const b of bugs) {
      b.x += b.vx * dt; if (b.x < 12 && b.vx < 0 || b.x > 168 && b.vx > 0) b.vx *= -1;
      const by = b.y + Math.sin(t * 3 + b.ph) * 3, dx = Math.abs(wrapDx(pl.x, b.x));
      if (pl.dead || dx > 13 || pl.y < by - 7 || pl.y - 18 > by + 5) continue;
      if (pl.vy > 0 && py <= by - 1) { b.gone = 1; pl.vy = -360; A.add(20); pop(b.x, by - 8, '+20', '#5fe3d6'); fx.boom(b.x, by); tune([520, 780], .06); }
      else if (jet > 0) { b.gone = 1; fx.boom(b.x, by); A.add(10); pop(b.x, by - 8, '+10', '#5fe3d6'); }
      else if (inv <= 0) { b.gone = 1; fx.boom(b.x, by); hurt(0); }
    }
    for (const i of items) {
      if (pl.dead || Math.abs(wrapDx(pl.x, i.x)) > 11 || Math.abs(pl.y - 9 - i.y) > 13) continue; i.gone = 1;
      if (i.k === 0) { streak = Math.min(8, streak + 1); streakT = 1.6; const v = 5 * Math.min(4, streak); A.add(v); pop(i.x, i.y - 6, '+' + v, '#ffd23c'); A.beep(820 + streak * 70, .07, 'triangle', .05); fx.spark(i.x, i.y, ['#ffd23c', '#fff6c8'], 6, 50); }
      else if (i.k === 1) { jet = 1.1; inv = Math.max(inv, 1.8); pop(i.x, i.y - 6, 'ROCKET!', '#8ae06a'); tune([392, 523, 659, 784], .06); }
      else { lives = Math.min(3, lives + 1); pop(i.x, i.y - 6, '+1 HEART', '#ff8a9a'); tune([659, 880], .09); }
    }
    cam = Math.max(ST - 200, Math.min(cam, pl.y - 135)); gen();
    const h = Math.min(GOAL, Math.floor((BASE - pl.y) / 10));
    if (h > best && !pl.dead) { A.add(h - best); best = h; const z = Math.min(4, best / ZM | 0); if (z > zone) { zone = z; A.add(50); banner = 'ZONE ' + (z + 1) + ': ' + ZN[z].n + '  +50'; banT = 2.4; tune([523, 659, 784], .1); } }
    A.info('ZONE ' + (zone + 1) + ' · ' + best + 'M');
    if (pl.y > cam + H + 14) { if (pl.dead) A.over(); else hurt(1); }
  }

  /* ---------- sprites (cached by K.spr) ---------- */
  const bot = (f, lk) => K.spr(ID + 'bot' + f + lk, 18, 22, q => {
    K.box(q, -1, -11, 2, 3, '#aab4c2'); K.ell(q, 0, -10.5, 1.7, 1.7, '#ffd23c');
    K.box(q, -9, -3, 2, 5, '#8a94a4'); K.box(q, 7, -3, 2, 5, '#8a94a4');
    K.rr(q, -8, -8, 16, 13, 4, K.lin(q, -8, 0, 8, 0, '#ffc070', '#ff9a2a', '#b8520a'));
    K.rr(q, -6, -6, 12, 6, 2, '#12303a'); K.box(q, -4 + lk, -5, 3, 3, '#5fe3d6'); K.box(q, 1 + lk, -5, 3, 3, '#5fe3d6'); K.box(q, -3 + lk, -5, 1, 1, '#ffffff'); K.box(q, 2 + lk, -5, 1, 1, '#ffffff');
    K.box(q, -3, 2, 6, 1, '#7a2f0a'); const ly = f ? 5 : 4, lh = f ? 6 : 3; K.box(q, -6, ly, 4, lh, '#5c6678'); K.box(q, 2, ly, 4, lh, '#5c6678'); K.box(q, -7, ly + lh - 2, 6, 2, '#3a4252'); K.box(q, 1, ly + lh - 2, 6, 2, '#3a4252'); });
  const plat = (tp, z) => K.spr(ID + 'p' + tp + (tp ? '' : z), 32, 8, q => {
    const c = tp === 1 ? ['#c8eeff', '#5fb8e8', '#1f5f9a'] : tp === 2 ? ['#e0b070', '#9a6a34', '#5a3418'] : tp === 3 ? ['#d6dbea', '#8a94a4', '#3a4252'] : ZN[z].c;
    K.rr(q, -16, -4, 32, 8, 3, c[2]); K.rr(q, -16, -4, 32, 5, 2, c[1]); K.box(q, -14, -4, 28, 1, c[0]);
    if (tp === 1) { K.part(q, [-12, 2, -9, 0, -9, 4], '#c8eeff'); K.part(q, [12, 2, 9, 0, 9, 4], '#c8eeff'); }
    if (tp === 2) { K.part(q, [-7, -4, -5, 0, -8, 4, -6, 4, -3, 0, -5, -4], '#3a2010'); K.part(q, [5, -4, 8, 0, 4, 4, 6, 4, 10, 0, 7, -4], '#3a2010'); }
    if (tp === 0 && z > 2) { K.box(q, -11, 1, 2, 1, '#ffd23c'); K.box(q, 9, 1, 2, 1, '#ffd23c'); } });
  const spring = f => K.spr(ID + 'sp' + f, 20, f ? 9 : 5, q => { const h = f ? 9 : 5, y = -h / 2; K.rr(q, -10, y, 20, 3, 1, '#e8231e'); K.box(q, -8, y, 16, 1, '#ff8a7a'); for (let i = 3; i < h; i += 2) K.box(q, i % 4 === 3 ? -5 : -4, y + i, 9, 1, '#d6dbea'); });
  const bolt = () => K.spr(ID + 'bolt', 9, 9, q => { K.part(q, [-4.5, 0, -2.2, -4, 2.2, -4, 4.5, 0, 2.2, 4, -2.2, 4], K.lin(q, -4, -4, 4, 4, '#fff6c8', '#ffd23c', '#c8801e')); K.ell(q, 0, 0, 1.5, 1.5, '#7a4a10'); });
  const batt = () => K.spr(ID + 'batt', 9, 13, q => { K.box(q, -2, -6.5, 4, 2, '#d6dbea'); K.rr(q, -4.5, -4.5, 9, 11, 2, K.lin(q, -4, 0, 4, 0, '#b8f08a', '#3fb45a', '#1f6a2a')); K.part(q, [1, -3, -3, 1, 0, 1, -1, 5, 3, 0, 0, 0], '#fff6c8'); });
  const bug = f => K.spr(ID + 'bug' + f, 20, 13, q => { const wy = f ? -5 : 0; K.mir(q, [4, -2, 10, wy - 1, 9, wy + 3, 4, 2], '#c8eeff', '#9fd0f5');
    K.ell(q, 0, 0, 6, 5, K.lin(q, 0, -5, 0, 5, '#d08af0', '#8a4ac8', '#4a2480')); K.box(q, -4, -2, 3, 3, '#ffffff'); K.box(q, 1, -2, 3, 3, '#ffffff'); K.box(q, -3, -1, 2, 2, '#12101c'); K.box(q, 1, -1, 2, 2, '#12101c');
    K.part(q, [-5, -4, -1, -2, -5, -2], '#12101c'); K.part(q, [5, -4, 1, -2, 5, -2], '#12101c'); K.part(q, [-4, 4, -2, 6.5, 0, 4, 2, 6.5, 4, 4], '#ffd23c'); });
  const deck = () => K.spr(ID + 'deck', 180, 14, q => { K.box(q, -90, -7, 180, 14, K.lin(q, 0, -7, 0, 7, '#e6ecf6', '#8a94a4', '#3a4252')); K.box(q, -90, -7, 180, 2, '#ffffff'); for (let x = -84; x < 90; x += 24) { K.box(q, x, -1, 8, 3, '#5fe3d6'); K.box(q, x + 12, 3, 2, 2, '#ffd23c'); } }, { ol: 0 });
  const dome = () => K.spr(ID + 'dome', 96, 64, q => {
    K.box(q, -1, -32, 2, 14, '#aab4c2'); K.ell(q, 0, -30, 2.5, 2.5, '#e8231e'); K.part(q, [1, -27, 12, -24, 1, -21], '#ffd23c');
    K.ell(q, 0, 32, 34, 50, K.lin(q, -34, 0, 34, 0, '#c8eeff', '#5fb8e8', '#1f5f9a')); K.ell(q, -12, 4, 6, 12, '#e6f6ff');
    K.box(q, -48, 20, 96, 12, K.lin(q, 0, 20, 0, 32, '#d6dbea', '#5c6678')); K.box(q, -40, 8, 8, 12, '#8a94a4'); K.box(q, 32, 8, 8, 12, '#8a94a4'); K.ell(q, -36, 7, 5, 3, '#ffd23c'); K.ell(q, 36, 7, 5, 3, '#ffd23c');
    K.rr(q, -7, 12, 14, 20, 5, '#12303a'); K.box(q, -5, 16, 10, 2, '#5fe3d6'); });
  const planet = () => K.spr(ID + 'planet', 40, 40, q => { K.ell(q, 0, 0, 13, 13, K.rad(q, -4, -4, 1, 16, '#ffe0a0', '#e8873a', '#7a2f4a')); K.ell(q, -3, 3, 4, 1.5, '#c8603a'); K.ell(q, 4, -4, 3, 1, '#ffd9a0'); q.strokeStyle = '#ffd9a0'; q.lineWidth = 2; q.beginPath(); q.ellipse(0, 1, 19, 4, -.3, .1, Math.PI - .1); q.stroke(); });

  function draw(g) {
    const cr = Math.round(cam), mc = (BASE - cr - 140) / 10, zf = Math.max(0, Math.min(4, mc / ZM)), z0 = zf | 0, fr = zf - z0;
    g.drawImage(K.T.sky(W, H, ZN[z0].sky), 0, 0);
    if (z0 < 4 && fr > .75) { g.globalAlpha = (fr - .75) * 4; g.drawImage(K.T.sky(W, H, ZN[z0 + 1].sky), 0, 0); g.globalAlpha = 1; }
    const sa = Math.max(0, Math.min(1, zf - 1.9)), ca = Math.max(0, Math.min(1, 3.4 - zf));
    if (sa > 0) { for (const s of stars) { g.globalAlpha = sa * (.45 + .55 * Math.abs(Math.sin(t * 1.5 + s[3]))); g.fillStyle = s[3] > 4 ? '#ffd9a0' : '#ffffff'; g.fillRect(s[0], ((s[1] - cr * .12) % 300 + 300) % 300 - 10, s[2], s[2]); }
      g.globalAlpha = sa; K.put(g, planet(), 138, 70 + (mc - 480) * .5); g.globalAlpha = 1; }
    if (ca > 0) { g.globalAlpha = ca; for (let i = 0; i < 6; i++) K.put(g, K.cloud(i % 2 ? 44 : 30), (i * 71 + t * (3 + i)) % 230 - 24, ((i * 97 - cr * .3) % 340 + 340) % 340 - 30); g.globalAlpha = 1; }
    g.save(); g.translate(shk > 0 ? A.ri(-2, 2) : 0, (shk > 0 ? A.ri(-2, 2) : 0) - cr);
    for (const p of plats) {
      if (p.y - cr < -70 || p.y - cr > H + 4) continue; const y = p.y + (p.bt > 0 && p.t !== 3 ? 1 : 0);
      if (p.t === 6) { g.drawImage(K.T.dirt(W, 40), 0, y + 4); g.drawImage(K.T.grass(W, 6), 0, y); K.box(g, 0, y, W, 1, '#8ae06a'); K.rr(g, 66, y - 2, 48, 4, 2, '#5c6678'); K.box(g, 68, y - 2, 44, 1, '#d6dbea'); }
      else if (p.t === 5) { K.put(g, dome(), 90, y - 31); g.drawImage(deck(), -1, y - 1); K.box(g, 0, y + 13, W, 1, '#12101c'); for (let i = 0; i < 5; i++) K.box(g, 14 + i * 38, y + 5, 2, 2, (t * 4 + i | 0) % 2 ? '#ffd23c' : '#e8231e'); }
      else { if (p.t === 3) K.put(g, spring(p.bt > 0 ? 1 : 0), p.x + 16, y + (p.bt > 0 ? -3 : 1)); K.put(g, plat(p.t, p.z), p.x + 16, y + (p.t === 3 ? 7 : 4)); }
    }
    for (const i of items) { const y = i.y + Math.sin(t * 4 + i.x) * 2; K.put(g, i.k === 0 ? bolt() : i.k === 1 ? batt() : K.heart(), i.x, y); if (i.k && (t * 3 + i.x | 0) % 3 === 0) K.box(g, i.x + 6, y - 7, 1, 1, '#ffffff'); }
    for (const b of bugs) K.put(g, bug((t * 14 | 0) % 2), b.x, b.y + Math.sin(t * 3 + b.ph) * 3, { flip: b.vx < 0 });
    fx.draw(g);
    if (inv <= 0 || jet > 0 || (t * 14 | 0) % 2) for (const X of [pl.x, pl.x < 12 ? pl.x + W : pl.x > W - 12 ? pl.x - W : null]) { if (X == null) continue; const Y = pl.y - 10 + (landT > 0 ? 1 : 0);
      if (jet > 0 || jetS > 0 || pl.vy < -400) { const f = (t * 16 | 0) % 2; K.put(g, K.fire(f), X - 4, Y + 15, { rot: Math.PI, sc: jet > 0 ? 1 : .7 }); K.put(g, K.fire(1 - f), X + 4, Y + 15, { rot: Math.PI, sc: jet > 0 ? 1 : .7 }); }
      K.put(g, bot(pl.vy > 40 && !won ? 1 : 0, Math.abs(pl.vx) > 20 ? pl.look : 0), X, Y, pl.dead ? { rot: t * 9 } : undefined); }
    for (const q of pops) A.text(g, q.s, Math.max(4 + q.s.length * 2, Math.min(W - 4 - q.s.length * 2, q.x)), q.y, q.c, 1, 'center');
    g.restore();
    /* HUD: hearts, climb meter, zone banner */
    for (let i = 0; i < 3; i++) K.put(g, K.heart(), 9 + i * 13, 9, i < lives ? undefined : { a: .25 });
    K.box(g, 171, 22, 4, 236, 'rgba(8,4,16,.45)'); for (let i = 1; i < 5; i++) K.box(g, 170, 258 - i * 47, 6, 1, '#d6dbea');
    const my = 258 - Math.round(best / GOAL * 236); K.box(g, 172, my, 2, 258 - my, '#5fe3d6'); K.put(g, K.star('#ffd23c'), 172, 14); K.box(g, 169, my - 1, 8, 3, '#ff9a2a'); K.box(g, 169, my - 1, 8, 1, '#ffd23c');
    if (banT > 0 && (banT > .5 || (banT * 12 | 0) % 2)) { K.box(g, 0, 52, W, 15, 'rgba(8,4,16,.6)'); A.text(g, banner, 90, 57, '#ffd23c', 1, 'center'); }
  }
  return { update, draw };
} });
