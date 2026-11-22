/* Kart Cup — a four-race cup on four circuits. Start last on the grid, steer past three rivals,
   grab coins for turbo, hit boost pads, dodge oil and cones. Finish last and you are out of the cup. */
(function () {
const K = Art, LAPS = 3, RW = 15, COL = ['#e8231e', '#3fa8e0', '#ffd23c', '#3fd45a'], NAME = ['YOU', 'BLUE', 'GOLD', 'MINT'], ORD = ['1ST', '2ND', '3RD', '4TH'], CUP = [10, 6, 3, 1];
const nd = a => Math.atan2(Math.sin(a), Math.cos(a));
const TR = [
  { name: 'MEADOW LOOP', wp: [[44, 44], [120, 32], [196, 44], [214, 120], [196, 196], [120, 180], [44, 196], [26, 120]] },
  { name: 'SANDY BAY', wp: [[40, 40], [120, 28], [200, 40], [214, 92], [168, 120], [208, 160], [200, 206], [120, 214], [88, 168], [50, 204], [26, 150], [30, 90]] },
  { name: 'SNOWY PASS', wp: [[34, 40], [84, 28], [124, 56], [164, 28], [208, 44], [212, 104], [160, 122], [206, 160], [196, 208], [130, 212], [112, 160], [74, 150], [70, 208], [26, 196], [30, 110]] },
  { name: 'MOON CANYON', wp: [[30, 60], [60, 28], [110, 40], [150, 26], [204, 36], [214, 84], [176, 104], [130, 84], [92, 112], [130, 148], [190, 148], [214, 184], [180, 212], [120, 198], [70, 214], [28, 190], [52, 142], [26, 100]] }];
/* own sprites (cached by K.spr) */
const pine = () => K.spr('kart-cup-pine', 16, 16, g => { K.org(g, 0, 0, 7.5, 3, 9); g.fillStyle = '#1f5a48'; g.fill(); K.org(g, -1, -1, 5.4, 4, 8); g.fillStyle = '#dfeaf8'; g.fill(); K.org(g, -2, -2, 2.6, 5, 7); g.fillStyle = '#ffffff'; g.fill(); });
const cactus = () => K.spr('kart-cup-cactus', 12, 14, g => { K.rr(g, -2, -7, 4, 14, 2, '#2f8a3a'); K.box(g, -6, -1, 4, 2, '#2f8a3a'); K.box(g, -6, -4, 2, 4, '#2f8a3a'); K.box(g, 2, 1, 4, 2, '#2f8a3a'); K.box(g, 4, -3, 2, 5, '#2f8a3a'); K.box(g, -1, -6, 1, 11, '#58b96a'); K.box(g, 0, -7, 1, 1, '#ff8a9a'); });
const crystal = v => K.spr('kart-cup-gem' + v, 10, 14, g => { const c = v ? '#5fe3d6' : '#b88aff'; K.part(g, [0, -7, 4, -2, 2, 7, -2, 7, -4, -2], K.lin(g, -4, 0, 4, 0, K.lite(c, .6), c, K.dark(c, .5))); K.box(g, -1, -4, 1, 5, '#ffffff'); });
const padS = () => K.spr('kart-cup-pad', 16, 10, g => { K.box(g, -8, -5, 16, 10, '#ff9a2a'); for (const y of [-1, 4]) K.part(g, [-6, y, 0, y - 4, 6, y, 6, y + 2, 0, y - 2, -6, y + 2], '#fff6c8'); }, { L: 6 });
const oilS = () => K.spr('kart-cup-oil', 14, 12, g => { K.org(g, 0, 0, 6.5, 2, 8); g.fillStyle = '#7a5ac8'; g.fill(); K.org(g, 0, 0, 5, 2, 8); g.fillStyle = '#140e1c'; g.fill(); K.box(g, -2, -2, 2, 1, '#ffffff'); K.box(g, 1, 1, 1, 1, '#b88aff'); }, { ol: 0 });
const coneS = () => K.spr('kart-cup-cone', 8, 8, g => { K.rr(g, -4, -4, 8, 8, 2, '#e8601e'); K.ell(g, 0, 0, 2.6, 2.6, '#ffffff'); K.ell(g, 0, 0, 1.2, 1.2, '#ff9a2a'); });
const boltS = on => K.spr('kart-cup-bolt' + on, 8, 10, g => K.part(g, [1, -5, -3, 1, 0, 1, -1, 5, 3, -1, 0, -1], on ? '#ffd23c' : '#4a4a56'));
const TH = [
  { g: () => K.T.grass(64, 64), kerb: '#e8231e', road: '#3a3a44', deco: n => K.tree(n % 3 ? 9 : 7, n % 4) },
  { g: () => K.tex('kart-cup-sand', 64, 64, { base: '#d9b46a', tile: 1, blobs: [['#f0d48a', .6, 14, 14, 40], ['#b88a48', .45, 10, 14, 36]], specks: [['#f6e2a8', 80, 2, 1], ['#a87838', 60], ['#ffffff', 10]] }), kerb: '#3fa8e0', road: '#4a4038', deco: n => n % 3 ? cactus() : K.rock(6, n % 3, '#b89a6a') },
  { g: () => K.tex('kart-cup-snow', 64, 64, { base: '#d4e2f2', tile: 1, blobs: [['#ffffff', .7, 14, 14, 40], ['#a8c0e0', .5, 10, 14, 36]], specks: [['#ffffff', 90, 2, 1], ['#9ab4d8', 50]] }), kerb: '#e8231e', road: '#3c4458', deco: n => n % 4 ? pine() : K.rock(6, n % 3, '#8a9ab8') },
  { g: () => K.T.stone(64, 64, '#3a2f5a'), kerb: '#ff9a2a', road: '#24222e', deco: n => n % 2 ? crystal(n % 4 > 1 ? 1 : 0) : K.rock(7, n % 3, '#6a5a8a') }];
/* smooth closed path through the waypoints: P[i] = [x, y, heading]; also picks the two straightest spots for boost pads */
function path(t) { if (t.P) return t.P; const W = t.wp, n = W.length, P = [];
  for (let i = 0; i < n; i++) { const p0 = W[(i + n - 1) % n], p1 = W[i], p2 = W[(i + 1) % n], p3 = W[(i + 2) % n]; for (let k = 0; k < 10; k++) { const s = k / 10, s2 = s * s, s3 = s2 * s, f = j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * s + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * s2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * s3); P.push([f(0), f(1), 0]); } }
  const N = P.length; P.forEach((p, i) => { const q = P[(i + 1) % N]; p[2] = Math.atan2(q[1] - p[1], q[0] - p[0]); });
  const curv = i => Math.abs(nd(P[(i + 5) % N][2] - P[(i + N - 5) % N][2])), far = (a, b) => Math.min((a - b + N) % N, (b - a + N) % N); t.pads = [];
  for (let m = 0; m < 2; m++) { let b = -1; for (let i = 8; i < N - 14; i++) if (!t.pads.some(q => far(q, i) < N / 3) && (b < 0 || curv(i) < curv(b))) b = i; if (b >= 0) t.pads.push(b); }
  return (t.P = P); }
const side = (p, o) => [p[0] - Math.sin(p[2]) * o, p[1] + Math.cos(p[2]) * o];
/* the whole circuit is painted once per track and kept */
function bg(ti) { const t = TR[ti], th = TH[ti], P = path(t); if (t.bg) return t.bg;
  const k = K.mkc(240, 240), q = k.getContext('2d'), ly = K.mkc(240, 240), l = ly.getContext('2d'), line = () => { l.beginPath(); P.forEach((p, i) => l[i ? 'lineTo' : 'moveTo'](p[0], p[1])); l.closePath(); };
  K.scroll(q, th.g(), 0, 0, 240, 240); l.lineJoin = l.lineCap = 'round';
  line(); l.strokeStyle = '#140e1c'; l.lineWidth = 40; l.stroke(); line(); l.strokeStyle = '#f2f5f8'; l.lineWidth = 37; l.stroke(); l.setLineDash([9, 9]); l.strokeStyle = th.kerb; l.stroke(); l.setLineDash([]); line(); l.strokeStyle = th.road; l.lineWidth = 30; l.stroke(); K.pix(ly, null, 6);
  l.globalCompositeOperation = 'source-atop'; l.globalAlpha = .4; K.scroll(l, K.T.road(64, 64), 0, 0, 240, 240); l.globalAlpha = 1; l.globalCompositeOperation = 'source-over'; q.drawImage(ly, 0, 0);
  for (let i = 0; i < P.length; i += 3) { const p = P[i]; K.box(q, Math.round(p[0]) - 1, Math.round(p[1]) - 1, 2, 2, '#8a8a98'); }
  for (const i of t.pads) K.put(q, padS(), P[i][0], P[i][1], { rot: P[i][2] + Math.PI / 2 });
  q.save(); q.translate(P[0][0], P[0][1]); q.rotate(P[0][2]); for (let i = -15; i < 15; i += 3) { K.box(q, -2, i, 2, 3, (i / 3 & 1) ? '#12101c' : '#ffffff'); K.box(q, 0, i, 2, 3, (i / 3 & 1) ? '#ffffff' : '#12101c'); } q.restore();
  for (let i = 0, n = 0; i < 500 && n < 24; i++) { const x = K.rnd(8, 232), y = K.rnd(8, 232); if (P.every(p => (p[0] - x) ** 2 + (p[1] - y) ** 2 > 27 * 27)) { n++; K.shadow(q, x + 3, y + 5, 7, 4); K.put(q, th.deco(n), x, y); } }
  return (t.bg = k); }

Arcade.game('kart-cup', { w: 240, h: 240, pad: 'lr', a: 'TURBO',
help: 'A cup of 4 races, 3 laps each. Your red kart drives by itself and starts last: steer with left / right (or hold the left or right half of the screen), down brakes. Stay on the track, the rough ground is slow. Every 3 coins give a turbo: fire it with Space, up or the TURBO button. Orange arrow pads boost you, oil spins you and cones slow you down. Finish a race last and you are out of the cup. Most cup points after 4 races wins!',
init(A) {
  const F = K.fx(), S = { race: 0, ph: 'count', t: 3.01, time: 0, clock: 0, ch: 1, coins: 0, fin: 0, shake: 0, msg: '', msgT: 0, wrong: 0, lap: 0, left: 0, out: false, pts: [0, 0, 0, 0], res: null, got: 0, bump: 0 };
  let P, N, T, karts, me, coins, haz;
  const say = (m, t) => { S.msg = m; S.msgT = t || 1.6; };
  const order = () => karts.slice().sort((a, b) => (a.done || 1e5 - a.prog) - (b.done || 1e5 - b.prog));
  const cupOrder = () => karts.slice().sort((a, b) => S.pts[b.i] - S.pts[a.i] || a.i - b.i);
  function setup(r) { T = TR[r]; P = path(T); N = P.length; S.race = r; S.ph = 'count'; S.t = 3.01; S.time = S.fin = S.wrong = S.lap = S.left = S.coins = 0; S.ch = Math.max(1, S.ch); S.res = null;
    karts = COL.map((c, i) => { const s = i ? i - 1 : 3, id = N - 3 - s * 3, o = [-7, 7, 0, 7][s], q = side(P[id], o); return { i, c, x: q[0], y: q[1], a: P[id][2], v: 0, idx: id, prog: id - N, done: 0, boost: 0, spin: -9, lane: o, max: 60 + r * 6 + i * 4 + A.rnd(-2, 2) }; }); me = karts[0];
    coins = []; for (let j = 0; j < 4; j++) { const b = Math.floor(N * (j + .5) / 4) + A.ri(-3, 3), o = [-7, 0, 7][A.ri(0, 2)]; for (let m = 0; m < 3; m++) { const q = side(P[(b + m * 2) % N], o); coins.push({ x: q[0], y: q[1], on: 1 }); } }
    haz = []; const spot = (t, o) => { for (let n = 0; n < 30; n++) { const i = A.ri(10, N - 16), q = side(P[i], o); if (T.pads.every(p => Math.abs(p - i) > 5) && haz.every(h => (h.x - q[0]) ** 2 + (h.y - q[1]) ** 2 > 400)) { haz.push({ x: q[0], y: q[1], t, on: 1 }); return; } } };
    for (let j = 0; j < (r ? r + 1 : 0); j++) spot('oil', j % 2 ? 7 : -7); for (let j = 0; j < (r - 1) * 2; j++) spot('cone', [0, -9, 9][j % 3]); }
  /* nearest path point a little ahead of the last one: gives progress and the distance from the middle of the road */
  function track(k) { let bd = 1e9, bi = k.idx; for (let j = 0; j < 14; j++) { const i = (k.idx + j) % N, d = (P[i][0] - k.x) ** 2 + (P[i][1] - k.y) ** 2; if (d < bd) { bd = d; bi = i; } } k.prog += (bi - k.idx + N) % N; k.idx = bi; return Math.sqrt(bd); }
  function turbo() { if (S.ph !== 'race' || me.done) return; if (S.ch < 1 || me.boost > 0) { A.beep(140, .06, 'square', .03); return; } S.ch--; me.boost = 1.5; S.shake = .15; [330, 494, 740].forEach((f, i) => setTimeout(() => A.beep(f, .1, 'sawtooth', .04), i * 60)); F.spark(me.x, me.y, ['#ffd23c', '#ff9a2a', '#ffffff'], 12, 70); }
  function finish() { const o = order(), pl = o.indexOf(me) + 1, bonus = [500, 300, 150, 0][pl - 1] + (pl < 4 ? Math.max(0, Math.round((45 - S.time) * 10)) : 0); o.forEach((k, i) => { S.pts[k.i] += CUP[i]; k.gain = CUP[i]; });
    S.out = pl === 4; S.res = { pl, bonus }; A.add(bonus); S.ph = 'board'; S.t = 0; A.info('RACE ' + (S.race + 1) + ': ' + ORD[pl - 1]); A.beep(pl === 1 ? 990 : pl < 4 ? 660 : 200, .3, 'triangle', .05); }
  function next() { if (S.ph !== 'board' || S.t < 1) return; if (!S.out && S.race < TR.length - 1) { setup(S.race + 1); return; }
    const rk = cupOrder().indexOf(me); S.ph = 'end'; if (!S.out) A.add([1000, 400, 150, 0][rk]); A.over(!S.out && rk === 0); }
  setup(0);
  return { st: S,
    key(k) { if (k === 'a' || k === 'up') { if (S.ph === 'board') { if (k === 'a') next(); } else turbo(); } },
    tap() { next(); },
    update(dt) { S.clock += dt; S.shake -= dt; S.msgT -= dt; S.bump -= dt;
      if (S.ph === 'count') { const c = Math.ceil(S.t); S.t -= dt; if (Math.ceil(S.t) < c) A.beep(S.t > 0 ? 440 : 880, S.t > 0 ? .12 : .4, 'square', .05); A.info(T.name); if (S.t <= 0) { S.ph = 'race'; say('GO!', .9); } return; }
      if (S.ph !== 'race') { S.t += dt; if (S.ph === 'board' && S.t > 8) next(); return; }
      S.time += dt;
      for (const k of karts) { const off = track(k), p = P[k.idx]; let mx;
        if (!k.done && k.prog >= N * LAPS) { k.done = S.time; if (k === me) { S.fin = 1.4; say('FINISH!', 2); F.spark(k.x, k.y, COL, 24, 90); } }
        k.boost -= dt; k.spin -= dt;
        if (k === me) { const pt = A.ptrs[0], st = (A.keys.right || (pt && pt.x >= 120) ? 1 : 0) - (A.keys.left || (pt && pt.x < 120) ? 1 : 0); if (k.spin <= 0) k.a += st * 3.2 * dt * Math.min(1, k.v / 40 + .3);
          mx = k.done ? 0 : k.boost > 0 ? (off > RW ? 85 : 145) : off > RW ? 42 : A.keys.down ? 20 : 96;
          if (!k.done) { S.wrong = Math.cos(k.a - p[2]) < -.3 ? S.wrong + dt : 0; if (off > RW && k.v > 25 && Math.random() < dt * 20) F.puff(k.x, k.y, S.race === 2 ? '#ffffff' : S.race === 3 ? '#8a7ab8' : S.race ? '#f0d48a' : '#7a5230'); if (k.boost > 0 && Math.random() < dt * 40) F.puff(k.x - Math.cos(k.a) * 6, k.y - Math.sin(k.a) * 6, Math.random() < .5 ? '#ff9a2a' : '#ffd23c'); }
          const lap = Math.min(LAPS - 1, Math.floor(Math.max(0, k.prog) / N)); if (lap > S.lap && !k.done) { S.lap = lap; coins.forEach(c => c.on = 1); A.beep(660, .12, 'triangle', .05); say(lap === LAPS - 1 ? 'FINAL LAP!' : 'LAP ' + (lap + 1)); } }
        else { const q = side(P[(k.idx + 5) % N], k.lane), want = Math.atan2(q[1] - k.y, q[0] - k.x), gap = k.prog - me.prog; if (k.spin <= 0) k.a += Math.max(-3 * dt, Math.min(3 * dt, nd(want - k.a)));
          mx = k.done ? 0 : k.max * (Math.abs(nd(want - k.a)) > .5 ? .75 : 1) * (k.boost > 0 ? 1.35 : 1) * (gap > 22 ? .86 : gap > 6 ? .94 : gap < -30 ? 1.06 : 1); }
        if (k.spin > 0) mx = Math.min(mx, 28);
        k.v += (mx - k.v) * Math.min(1, dt * (mx < k.v ? 3 : k.boost > 0 ? 5 : 1.4));
        k.x = Math.max(4, Math.min(236, k.x + Math.cos(k.a) * k.v * dt)); k.y = Math.max(4, Math.min(236, k.y + Math.sin(k.a) * k.v * dt));
        if (k.done) continue;
        for (const i of T.pads) if ((P[i][0] - k.x) ** 2 + (P[i][1] - k.y) ** 2 < 90 && k.boost < .3) { k.boost = .9; if (k === me) { A.beep(520, .15, 'sawtooth', .04); F.spark(k.x, k.y, ['#ff9a2a', '#fff6c8'], 8, 60); } }
        for (const h of haz) if (h.on && (h.x - k.x) ** 2 + (h.y - k.y) ** 2 < 42) {
          if (h.t === 'cone') { h.on = 0; k.v *= .5; F.spark(h.x, h.y, ['#e8601e', '#ffffff'], 10, 70); if (k === me) { S.shake = .2; A.beep(160, .12, 'square', .05); } }
          else if (k.spin < -1.2) { k.spin = .6; k.boost = 0; if (k === me) { S.shake = .25; A.beep(220, .3, 'sawtooth', .04); say('OIL!', .8); } } } }
      for (const c of coins) if (c.on && (c.x - me.x) ** 2 + (c.y - me.y) ** 2 < 70 && !me.done) { c.on = 0; A.add(10); S.got++; A.beep(1175, .07, 'square', .04); F.spark(c.x, c.y, ['#ffd23c', '#fff6c8'], 6, 50);
        if (++S.coins >= 3) { S.coins = 0; if (S.ch < 3) { S.ch++; say('TURBO READY!', 1); A.beep(1568, .12, 'square', .04); } else A.add(20); } }
      /* karts push each other apart; the one behind loses a little speed */
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const a = karts[i], b = karts[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1; if (d < 9) { const u = (9 - d) / 2 / d; a.x -= dx * u; a.y -= dy * u; b.x += dx * u; b.y += dy * u; (a.prog < b.prog ? a : b).v *= 1 - Math.min(1, dt * 2); if (!i && S.bump <= 0 && !a.done) { S.bump = .4; S.shake = .12; A.beep(110, .08, 'square', .04); F.spark((a.x + b.x) / 2, (a.y + b.y) / 2, ['#ffffff', '#ffd23c'], 4, 40); } } }
      /* everyone else is home: a short clock stops the race from dragging on */
      if (!me.done && karts.every(k => k === me || k.done)) { if (!S.left) { S.left = 12; say('HURRY UP!', 1.5); } S.left -= dt; if (S.left <= 0) { me.done = 1e4; S.fin = .01; } }
      if (S.fin > 0) { S.fin -= dt; if (S.fin <= 0) finish(); return; }
      A.info(S.left ? 'HURRY! ' + Math.ceil(S.left) : 'RACE ' + (S.race + 1) + ' LAP ' + (S.lap + 1) + '/' + LAPS); },
    draw(g) { const tx = (s, x, y, c, sc, al) => { A.text(g, s, x + (sc || 1), y + (sc || 1), '#140e1c', sc, al); A.text(g, s, x, y, c, sc, al); };
      g.save(); if (S.shake > 0) g.translate(A.ri(-1, 1), A.ri(-1, 1)); g.drawImage(bg(S.race), 0, 0);
      for (const h of haz) if (h.on) K.put(g, h.t === 'oil' ? oilS() : coneS(), h.x, h.y);
      for (const c of coins) if (c.on) K.put(g, K.coin(Math.floor(S.clock * 8 + c.x) & 3), c.x, c.y);
      for (let i = 3; i >= 0; i--) { const k = karts[i]; K.shadow(g, k.x + 1, k.y + 2, 5, 4); K.put(g, K.kart(k.c), k.x, k.y, { rot: k.a + Math.PI / 2 + (k.spin > 0 ? k.spin * 17 : 0) }); }
      F.draw(g); g.restore();
      if (S.ph === 'count' || S.wrong > .8) { const y = Math.round(me.y) - 16 + (S.clock * 4 & 1); K.box(g, Math.round(me.x) - 2, y, 5, 3, '#140e1c'); K.box(g, Math.round(me.x) - 1, y + 3, 3, 1, '#140e1c'); K.box(g, Math.round(me.x) - 1, y + 1, 3, 1, '#ffd23c'); K.box(g, Math.round(me.x), y + 2, 1, 1, '#ffd23c'); }
      if (S.ph === 'count') { K.box(g, 0, 78, 240, 14, 'rgba(20,14,28,.8)'); tx('RACE ' + (S.race + 1) + ' OF 4: ' + T.name, 120, 83, '#ffffff', 1, 'center'); tx(Math.ceil(S.t), 120, 100, '#ffd23c', 8, 'center'); return; }
      if (S.ph === 'race') { tx(ORD[order().indexOf(me)], 4, 4, '#ffd23c', 2); for (let i = 0; i < 3; i++) K.put(g, boltS(i < S.ch ? 1 : 0), 197 + i * 9, 10); for (let i = 0; i < 3; i++) K.box(g, 211 + i * 9, 19, 5, 2, i < S.coins ? '#ffd23c' : '#140e1c');
        if (S.wrong > .8 && (S.clock * 4 & 1)) tx('TURN AROUND!', 120, 110, '#ff8a9a', 2, 'center'); else if (S.msgT > 0) tx(S.msg, 120, 110, '#ffffff', S.msg.length > 9 ? 2 : 3, 'center'); return; }
      /* results board: cup table after each race */
      const fin = S.out || S.race === TR.length - 1, co = cupOrder(), rk = co.indexOf(me);
      K.box(g, 26, 44, 188, 152, '#140e1c'); K.box(g, 28, 46, 184, 148, '#2a2440'); K.box(g, 28, 46, 184, 15, '#e8231e');
      A.text(g, fin && !S.out ? 'CUP FINAL TABLE' : T.name + ' RESULT', 120, 51, '#ffffff', 1, 'center');
      tx('YOU FINISHED ' + ORD[S.res.pl - 1], 120, 68, '#ffd23c', 2, 'center'); A.text(g, 'RACE BONUS +' + S.res.bonus, 120, 84, '#5fe3d6', 1, 'center');
      co.forEach((k, i) => { const y = 98 + i * 17; if (k === me) K.box(g, 34, y - 5, 172, 15, '#4a3f6a'); A.text(g, ORD[i], 40, y, '#ffffff', 1); K.put(g, K.kart(k.c), 66, y + 2, { rot: Math.PI / 2 }); A.text(g, NAME[k.i], 80, y, k.i ? k.c : '#ffffff', 1); A.text(g, '+' + k.gain, 150, y, '#8a8a98', 1, 'right'); A.text(g, S.pts[k.i] + ' PTS', 198, y, '#ffffff', 1, 'right'); });
      A.text(g, S.out ? 'LAST PLACE: OUT OF THE CUP' : fin ? (rk ? ORD[rk] + ' IN THE CUP' : 'CUP CHAMPION!') : 'NEXT: ' + TR[S.race + 1].name, 120, 168, S.out ? '#ff8a9a' : '#ffd23c', 1, 'center');
      if (S.ph === 'board' && S.t > 1 && (S.clock * 3 & 1)) A.text(g, 'PRESS SPACE OR TAP', 120, 181, '#ffffff', 1, 'center'); }
  };
} });
})();
