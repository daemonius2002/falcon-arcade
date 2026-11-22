/* Sky Defender v0.4 — waves of bombs, splitters, drones, armoured bombs, rockets, storm blimps, parachute power-ups and chain combos */
Arcade.game('sky-defender', { w: 240, h: 320, pad: 'lr', a: 'FIRE',
help: 'Protect your six towers from the falling bombs! Point with the mouse or a finger and hold to fire the cannon, or turn it with left / right and fire with Space or FIRE. Shoot every bomb to clear a wave: each tower still standing gives bonus points, and a wave with no tower lost is a PERFECT. New dangers arrive as you go: purple splitters break into small bombs (wave 3), drones fly past dropping bombs (wave 4), a big storm blimp attacks every 5th wave, steel bombs need 4 hits (wave 6) and rockets are fast (wave 7). A red arrow blinks over a tower that is in danger. Shoot the parachute crates for power-ups: rapid fire, triple shot, a shield dome or a tower repair. Quick hits in a row build a chain of up to x5 points. The game ends when every tower is gone.',
init(A) {
  const K = Art, W = 240, ID = 'sky-defender-', F = K.fx(), PI = Math.PI;
  const BX = [8, 40, 72, 144, 176, 208], TH = [26, 32, 38, 40, 34, 28], TX = 120, TY = 292, GY = 296;
  const BOMB = 0, MINI = 1, SPLIT = 2, HEAVY = 3, ROCKET = 4, DRONE = 5, BOSS = 6, CRATE = 7;
  /* per kind: hit radius, hit points, score, speed factor, trail colour */
  const KD = [[6, 1, 10, 1, '#8a94a4'], [4, 1, 5, 1.05, '#c8801e'], [8, 2, 25, .8, '#b06ae0'], [8, 4, 40, .62, '#59627a'], [5, 1, 20, 1.85, '#ffd23c'], [9, 3, 60], [30, 1, 500], [9, 1, 0]];
  const PN = ['RAPID FIRE', 'TRIPLE SHOT', 'SHIELD DOME', 'TOWER REPAIR'], PC = ['#ffd23c', '#ff8a1e', '#5fc8ff', '#58d96a'];
  const domeY = x => 258 - 18 * Math.sin(PI * x / W);
  const stars = []; for (let i = 0; i < 46; i++) stars.push([A.ri(0, 239), A.ri(0, 240), A.ri(0, 6)]);
  let ang = -PI / 2, sh = [], en = [], pops = [], queue = [], city = [1, 1, 1, 1, 1, 1];
  let cd = 0, lvl = 0, speed = 0, gap = 1, spawnT = 0, crateT = 0, clearT = 0, lost = 0, dying = 0, t = 0, kh = 0, rec = 0, shake = 0;
  let chain = 0, chainT = 0, mult = 1, banner = 0, bTxt = '', bSub = '', pw = [0, 0, 0];

  /* ---- sprites (cached by K.spr, all bombs point down) ---- */
  const sTower = i => K.spr(ID + 'tw' + i, 24, TH[i] + 8, g => { const h = TH[i], c = ['#3a5aa8', '#6a4aa8', '#2f7a8a'][i % 3], y0 = 4 - h / 2;
    K.box(g, -11, y0, 22, h, K.lin(g, -11, 0, 11, 0, K.lite(c, .3), c, K.dark(c, .5))); K.box(g, -12, y0, 24, 3, K.lite(c, .5));
    if (i % 2) { K.box(g, -5, y0 - 5, 10, 5, K.dark(c, .15)); K.box(g, 3, y0 - 8, 1, 4, '#aab4c2'); } else { K.part(g, [-8, y0, 0, y0 - 7, 8, y0], K.dark(c, .1)); K.box(g, 0, y0 - 8, 1, 3, '#e8231e'); }
    for (let y = y0 + 6; y < h / 2 - 2; y += 6) for (let x = -8; x < 8; x += 6) K.box(g, x, y, 4, 3, (x * 5 + y * 3 + i * 7) % 7 > 2 ? '#ffd98a' : '#1b2a44');
    K.box(g, -3, 4 + h / 2 - 5, 6, 5, '#141428'); });
  const sGun = () => K.spr(ID + 'gun', 20, 6, g => { K.box(g, -10, -3, 20, 6, K.lin(g, 0, -3, 0, 3, '#f2f5f8', '#aab4c2', '#4a5462')); K.box(g, 6, -3, 4, 6, '#e8231e'); K.box(g, -4, -3, 2, 6, '#59627a'); });
  const sBase = () => K.spr(ID + 'base', 30, 16, g => { K.part(g, [-15, 8, -10, -2, 10, -2, 15, 8], K.lin(g, -15, 0, 15, 0, '#c2ccd8', '#5c6678', '#2a2f3d')); K.box(g, -12, 5, 24, 1, '#ffd23c');
    K.ell(g, 0, -2, 7, 6, K.lin(g, -7, 0, 7, 0, '#ff8a7a', '#e8231e', '#7a1410')); K.box(g, -2, -4, 3, 2, '#ffd0c8'); });
  const sBomb = k => k === BOMB ? K.bomb() : K.spr(ID + 'b' + k, k === MINI ? 6 : k === ROCKET ? 8 : 14, k === MINI ? 9 : 18, g => {
    if (k === MINI) { K.part(g, [-3, -4, 3, -4, 1, -2, -1, -2], '#5c6678'); K.ell(g, 0, 1, 2.6, 3.4, K.rad(g, -1, 0, .3, 4, '#ffe08a', '#ff8a1e', '#8a3a10')); }
    else if (k === ROCKET) { K.part(g, [-4, -9, 4, -9, 2, -4, -2, -4], '#e8231e'); K.box(g, -2, -6, 4, 11, K.lin(g, -2, 0, 2, 0, '#ffffff', '#ffd23c', '#a8701e')); K.part(g, [-2, 5, 2, 5, 0, 9], '#e8231e'); K.box(g, -2, -1, 4, 2, '#1b2a44'); }
    else { const c = k === SPLIT ? '#b06ae0' : '#8a94a8'; K.part(g, [-6, -9, 6, -9, 3, -4, -3, -4], '#4a5462'); K.ell(g, 0, 2, 6.4, 7, K.rad(g, -2, -1, .5, 9, K.lite(c, .6), c, K.dark(c, .6)));
      if (k === SPLIT) for (const x of [-3, 0, 3]) K.box(g, x - 1, x ? 0 : 3, 2, 2, '#ffd23c'); else { K.box(g, -6, 0, 12, 2, '#e8231e'); for (const x of [-4, 0, 3]) K.box(g, x, 4, 1, 1, '#f2f5f8'); } } });
  const sDrone = f => K.spr(ID + 'dr' + f, 24, 12, g => { K.box(g, -9, -3, 1, 3, '#aab4c2'); K.box(g, 8, -3, 1, 3, '#aab4c2'); for (const x of [-9, 8]) K.box(g, x - (f ? 3 : 1), -5, f ? 7 : 3, 1, '#d6dbea');
    K.rr(g, -10, -1, 20, 6, 3, K.lin(g, 0, -1, 0, 5, '#7ad8c8', '#2f8a8a', '#12404a')); K.box(g, -3, 1, 6, 2, f ? '#ff6a5a' : '#e8231e'); K.box(g, -1, 5, 2, 1, '#1b2a44'); });
  const sBlimp = () => K.spr(ID + 'blimp', 64, 30, g => { K.part(g, [22, -3, 32, -11, 32, 7], '#7a1410'); K.ell(g, 0, -3, 28, 11, K.lin(g, 0, -14, 0, 8, '#ff9a8a', '#c8321e', '#5a1410'));
    for (const x of [-14, 0, 14]) K.box(g, x - 1, -13, 2, 20, '#ffd23c'); K.ell(g, -20, -5, 3, 3, '#fff6c8'); K.ell(g, -20, -5, 1.4, 1.4, '#141428');
    K.rr(g, -10, 8, 20, 7, 2, K.lin(g, 0, 8, 0, 15, '#aab4c2', '#4a5462')); for (const x of [-7, -2, 3]) K.box(g, x, 10, 3, 2, '#ffd98a'); });
  const sCrate = k => K.spr(ID + 'cr' + k, 18, 26, g => { g.beginPath(); g.arc(0, -4, 9, PI, 0); g.fillStyle = K.lin(g, -9, 0, 9, 0, '#ffffff', '#d6dbea', '#8a94a4'); g.fill(); for (const x of [-3, 3]) K.box(g, x, -13, 1, 9, PC[k]);
    K.part(g, [-9, -4, -8, -4, -4, 4, -5, 4], '#d6dbea'); K.part(g, [9, -4, 8, -4, 4, 4, 5, 4], '#d6dbea'); K.box(g, -6, 3, 12, 10, K.lin(g, -6, 0, 6, 0, K.lite(PC[k], .4), PC[k], K.dark(PC[k], .5))); K.box(g, -4, 5, 8, 6, '#141428');
    if (k === 0) for (const x of [-3, 0, 3]) K.box(g, x - 1, 6, 1, 4, PC[0]); else if (k === 1) { K.box(g, -3, 6, 1, 2, PC[1]); K.box(g, 0, 5, 1, 2, PC[1]); K.box(g, 2, 6, 1, 2, PC[1]); K.box(g, -1, 9, 2, 2, PC[1]); }
    else if (k === 2) { K.box(g, -3, 6, 6, 1, PC[2]); K.box(g, -3, 7, 1, 3, PC[2]); K.box(g, 2, 7, 1, 3, PC[2]); } else { K.box(g, -1, 6, 2, 4, PC[3]); K.box(g, -2, 7, 4, 2, PC[3]); } });

  /* ---- helpers ---- */
  const alive = () => city.reduce((a, v, i) => (v ? a.concat(i) : a), []);
  const info = () => A.info('WAVE ' + lvl);
  const say = (a, b, d) => { bTxt = a; bSub = b || ''; banner = d || 2.2; };
  const pop = (x, y, txt, c) => pops.push({ x: Math.max(14, Math.min(W - 14, x)), y, txt, c: c || '#fff6c8', l: .9 });
  const tune = (fs, ty) => fs.forEach((f, i) => A.beep(f, .09 + i * .04, ty || 'triangle', .05));
  function mk(k, x, y, ti) { const e = { k, x, y, hp: KD[k][1], r: KD[k][0], t: 0, vx: 0, vy: 0, ti: -1 };
    if (k <= ROCKET) { const l = alive(); e.ti = ti != null ? ti : l.length ? l[A.ri(0, l.length - 1)] : A.ri(0, 5); const tx = BX[e.ti] + 12 + A.rnd(-5, 5), v = speed * KD[k][3], d = Math.hypot(tx - x, 280 - y); e.vx = (tx - x) / d * v; e.vy = (280 - y) / d * v; e.sy = A.rnd(90, 150); }
    en.push(e); return e; }
  function wave() { lvl++; lost = 0; queue = []; speed = Math.min(58, 24 + lvl * 3.2); gap = Math.max(.5, 1.55 - lvl * .09); spawnT = 1.6; crateT = lvl > 1 ? A.rnd(4, 8) : 1e9;
    const boss = lvl % 5 === 0, pR = lvl >= 7 ? .12 : 0, pH = lvl >= 6 ? .12 : 0, pS = lvl >= 3 ? .18 : 0;
    if (boss) { const b = mk(BOSS, TX, -24); b.hp = b.max = 14 + lvl * 3; b.dt = 2.5; tune([196, 147, 110], 'sawtooth'); }
    else { for (let i = Math.min(34, 6 + lvl * 2); i--;) { const r = Math.random(); queue.push(r < pR ? ROCKET : r < pR + pH ? HEAVY : r < pR + pH + pS ? SPLIT : BOMB); }
      const n = queue.length; if (lvl === 3) queue[n - 3] = SPLIT; if (lvl === 6) queue[n - 3] = HEAVY; if (lvl === 7) queue[n - 3] = ROCKET;
      for (let i = lvl >= 4 ? Math.min(3, lvl - 3 >> 1 || 1) : 0; i--;) queue.splice(A.ri(0, n - 4), 0, DRONE); }
    say('WAVE ' + lvl, boss ? 'STORM BLIMP!' : ['PROTECT THE TOWERS', 'SHOOT CRATES FOR POWER-UPS', 'SPLITTERS: HIT THEM EARLY', 'DRONES DROP BOMBS', '', 'STEEL BOMBS NEED 4 HITS', 'FAST ROCKETS!'][lvl - 1] || ''); info(); }
  function score(n, x, y) { chain++; chainT = 1.8; mult = Math.min(5, 1 + (chain >> 2)); A.add(n * mult); pop(x, y, n * mult, mult > 1 ? '#ffd23c' : '#fff6c8'); }
  function power(k, x, y) { pop(x, y, PN[k], PC[k]); tune([523, 659, 784, 1047]); F.spark(x, y, [PC[k], '#ffffff'], 14, 90);
    if (k < 3) { pw[k] = k === 2 ? 9 : 8; return; } const d = city.map((v, i) => (v ? -1 : i)).filter(i => i >= 0);
    if (d.length) { const i = d[A.ri(0, d.length - 1)]; city[i] = 1; F.spark(BX[i] + 12, GY - 16, ['#58d96a', '#ffffff'], 20, 60); info(); } else { A.add(250); pop(x, y + 9, '+250'); } }
  function kill(e) { e.dead = 1; const big = e.k >= HEAVY && e.k !== ROCKET; F.boom(e.x, e.y, big); F.spark(e.x, e.y, ['#ffd23c', '#ff8a1e', '#fff6c8'], big ? 14 : 7, 90); A.beep(big ? 150 : 230, big ? .16 : .08, 'sawtooth'); shake = Math.max(shake, big ? 3 : 1);
    if (e.k === CRATE) return power(e.p, e.x, e.y);
    if (e.k === BOSS) { for (let i = 0; i < 5; i++) F.boom(e.x + A.rnd(-26, 26), e.y + A.rnd(-10, 10), 1); shake = 7; tune([392, 523, 659, 784, 1047]); const c = mk(CRATE, e.x, e.y); c.p = 3; score(100 * lvl, e.x, e.y - 8); }
    else score(KD[e.k][2], e.x, e.y); }
  function land(e) { e.dead = 1; F.boom(e.x, 284, 0); F.spark(e.x, 288, ['#ff8a1e', '#8a94a4'], 8, 60); const i = e.ti;
    if (i < 0 || !city[i] || Math.abs(BX[i] + 12 - e.x) > 15) { A.beep(140, .1, 'sawtooth', .03); return; }
    city[i] = 0; lost++; chain = 0; mult = 1; shake = 6; A.beep(90, .45, 'sawtooth', .07); F.boom(BX[i] + 12, GY - TH[i] / 2, 1); F.boom(BX[i] + 6, GY - 8, 0); F.spark(BX[i] + 12, GY - 14, ['#ff8a1e', '#ffd23c', '#59627a'], 22, 110); info();
    if (!alive().length) { dying = 1.3; say('ALL TOWERS LOST', '', 3); } }
  function fire() { cd = pw[0] > 0 ? .09 : .2; rec = 1; A.beep(pw[0] > 0 ? 900 : 760, .03, 'square', .02);
    for (const d of pw[1] > 0 ? [-.17, 0, .17] : [0]) { const a = ang + d; sh.push({ x: TX + Math.cos(a) * 19, y: TY + Math.sin(a) * 19, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320 }); } }
  wave();

  return {
    update(dt) { t += dt; cd -= dt; rec = Math.max(0, rec - dt * 9); shake = Math.max(0, shake - dt * 18); banner -= dt; for (let i = 0; i < 3; i++) pw[i] = Math.max(0, pw[i] - dt);
      if (chainT > 0 && (chainT -= dt) <= 0) { chain = 0; mult = 1; }
      for (const p of pops) { p.y -= 22 * dt; p.l -= dt; } pops = pops.filter(p => p.l > 0);
      if (dying > 0) { if (Math.random() < dt * 9) F.boom(A.rnd(10, 230), A.rnd(262, 294), Math.random() < .3); if ((dying -= dt) <= 0) A.over(); return; }
      /* aim: pointer wins while it moves or is held, keys turn with a short speed-up for fine aiming */
      if (A.ptr.moved || A.ptr.down) { const a = Math.atan2(A.ptr.y - TY, A.ptr.x - TX); ang = a > 0 ? (a > PI / 2 ? -PI : 0) : a; }
      const dir = (A.keys.right ? 1 : 0) - (A.keys.left ? 1 : 0); kh = dir ? kh + dt : 0; ang += dir * (1.2 + Math.min(1, kh * 3) * 2) * dt; ang = Math.max(-PI + .12, Math.min(-.12, ang));
      if ((A.ptr.down || A.keys.a) && cd <= 0) fire();
      /* spawning */
      if (queue.length && (spawnT -= dt) <= 0) { spawnT = gap * A.rnd(.7, 1.3); const k = queue.pop();
        if (k === DRONE) { const s = Math.random() < .5 ? 1 : -1, d = mk(DRONE, s > 0 ? -14 : W + 14, A.rnd(34, 84)); d.vx = s * (32 + lvl * 1.5); d.dt = A.rnd(.8, 1.6); }
        else { mk(k, A.rnd(12, 228), -8); if (k === ROCKET) A.beep(1500, .18, 'sine', .03); } }
      if (!clearT && (crateT -= dt) <= 0) { crateT = A.rnd(13, 19); const c = mk(CRATE, A.rnd(30, 210), -14); c.p = alive().length < 6 && Math.random() < .4 ? 3 : A.ri(0, 2); }
      for (const b of sh) { b.x += b.vx * dt; b.y += b.vy * dt; if (b.y < -5 || b.x < -5 || b.x > W + 5) b.dead = 1; }
      for (const e of en.slice()) { e.t += dt;
        if (e.k === BOSS) { e.y = Math.min(52, e.y + 30 * dt) + Math.sin(e.t * 2) * .3; e.x = TX + Math.sin(e.t * .55) * 78;
          if (e.y > 40 && (e.dt -= dt) <= 0) { e.dt = Math.max(.95, 2 - lvl * .07); const r = Math.random(); mk(lvl >= 10 && r < .2 ? ROCKET : r < .4 ? SPLIT : BOMB, e.x, e.y + 14); A.beep(300, .06, 'triangle', .03); } }
        else if (e.k === DRONE) { e.x += e.vx * dt; e.y += Math.sin(e.t * 3) * 8 * dt; if (e.x < -20 || e.x > W + 20) e.dead = 1;
          if ((e.dt -= dt) <= 0 && e.x > 16 && e.x < W - 16) { e.dt = 2.3; mk(BOMB, e.x, e.y + 6); A.beep(300, .06, 'triangle', .03); } }
        else if (e.k === CRATE) { e.y += 20 * dt; e.x += Math.cos(e.t * 1.6) * 12 * dt; if (e.y > 272) { e.dead = 1; F.puff(e.x, e.y, '#d6dbea', -12); } }
        else { e.x += e.vx * dt; e.y += e.vy * dt; if (Math.random() < dt * 16) F.puff(e.x - e.vx / speed * 6, e.y - e.r - 2, KD[e.k][4], -8);
          if (e.k === SPLIT && e.y > e.sy) { e.dead = 1; F.boom(e.x, e.y, 0); A.beep(420, .1, 'triangle', .04); const l = alive().sort(() => Math.random() - .5); for (let i = 0; i < (lvl < 5 ? 2 : 3); i++) { const m = mk(MINI, e.x + (i - 1) * 5, e.y, l[i % l.length]); m.ti = l.length ? m.ti : -1; } }
          else if (pw[2] > 0 && e.y + e.r >= domeY(e.x)) { e.dead = 1; F.boom(e.x, e.y, 0); F.spark(e.x, e.y + e.r, ['#5fc8ff', '#ffffff'], 10, 80); A.beep(660, .08, 'triangle', .04); }
          else if (e.y >= 280) land(e); }
        if (!e.dead) for (const b of sh) if (!b.dead && (e.k === BOSS ? Math.abs(b.x - e.x) < 30 && Math.abs(b.y - e.y) < 15 : (b.x - e.x) ** 2 + (b.y - e.y) ** 2 < (e.r + 3) ** 2)) { b.dead = 1;
          if (--e.hp <= 0) { kill(e); break; } F.spark(b.x, b.y, ['#fff6c8', '#aab4c2'], 5, 60); A.beep(560, .04, 'triangle', .03); } }
      en = en.filter(e => !e.dead); sh = sh.filter(b => !b.dead);
      /* wave end: bonus for each standing tower, then the next wave */
      if (clearT > 0) { if ((clearT -= dt) <= 0) { clearT = 0; wave(); } }
      else if (!dying && !queue.length && !en.some(e => e.k !== CRATE)) { clearT = 2.6; const l = alive(); l.forEach(i => pop(BX[i] + 12, GY - TH[i] - 12, '+50', '#58d96a')); A.add(l.length * 50 + (lost ? 0 : 150));
        say('WAVE ' + lvl + ' CLEAR', lost ? 'TOWER BONUS +' + l.length * 50 : 'PERFECT! +' + (l.length * 50 + 150), 2.4); tune(lost ? [523, 659, 784] : [523, 659, 784, 1047, 1319]); } },

    draw(g) { g.drawImage(K.T.sky(W, 320, ['#0a0c24', '#1c1a4a', '#4a2a6a', '#9a4a5a']), 0, 0);
      for (const q of stars) if ((t * 1.5 + q[2]) % 7 > .6) K.box(g, q[0], q[1], 1, 1, q[2] % 3 ? '#d6dbea' : '#ffffff');
      K.put(g, K.ball(9, '#f2efe6'), 196, 40); K.box(g, 190, 36, 3, 3, '#c8c4b8'); K.box(g, 199, 43, 2, 2, '#c8c4b8');
      g.save(); if (shake > .5) g.translate(A.ri(-1, 1) * Math.ceil(shake / 3), A.ri(-1, 1) * Math.ceil(shake / 3));
      for (let i = 0; i < 9; i++) { const h = 20 + (i * 37) % 30; K.box(g, i * 28 - 6, GY - h, 24, h, '#1c1640'); K.box(g, i * 28 + 2, GY - 6 - h, 8, 6, '#1c1640'); K.box(g, i * 28 + (i * 5) % 14, GY - h + 6 + (i * 3) % 8, 2, 2, '#4a3a6a'); }
      K.box(g, -2, GY, W + 4, 26, '#12141c'); K.box(g, -2, GY, W + 4, 2, '#59627a'); K.box(g, -2, GY + 2, W + 4, 1, '#2a2f3d');
      BX.forEach((x, i) => { if (city[i]) { K.put(g, sTower(i), x + 12, GY - (TH[i] + 8) / 2); return; } K.put(g, K.rock(7, i % 3, '#4a5462'), x + 13, GY - 4); K.put(g, K.rock(4, (i + 1) % 3, '#4a5462'), x + 4, GY - 2); K.box(g, x + 17, GY - 9, 2, 7, '#3a4152'); });
      /* danger arrows over towers with a bomb coming close */
      if (t * 5 % 2 < 1.2) for (const e of en) if (e.ti >= 0 && e.k <= ROCKET && city[e.ti] && e.y > 150) { const x = BX[e.ti] + 12, y = GY - TH[e.ti] - 18; K.box(g, x - 3, y, 7, 2, '#ff4a3a'); K.box(g, x - 2, y + 2, 5, 2, '#ff4a3a'); K.box(g, x - 1, y + 4, 3, 2, '#ff4a3a'); K.box(g, x, y + 6, 1, 1, '#ff4a3a'); }
      if (pw[2] > 0 && (pw[2] > 2 || t * 8 % 2 < 1)) for (let x = 1; x < W; x += 3) K.box(g, x, Math.round(domeY(x)), 2, (x + (t * 20 | 0)) % 9 < 3 ? 2 : 1, (x + (t * 20 | 0)) % 9 < 3 ? '#c8f4ff' : '#5fc8ff');
      for (const e of en) { if (e.k === BOSS) K.put(g, sBlimp(), e.x, e.y); else if (e.k === DRONE) K.put(g, sDrone(e.t * 14 & 1), e.x, e.y, e.vx < 0 ? { flip: 1 } : null);
        else if (e.k === CRATE) K.put(g, sCrate(e.p), e.x, e.y, { rot: Math.sin(e.t * 1.6) * .14 }); else K.put(g, sBomb(e.k), e.x, e.y, { rot: Math.atan2(e.vy, e.vx) - PI / 2 }); }
      for (let i = 2; i < 9; i++) K.box(g, Math.round(TX + Math.cos(ang) * (16 + i * 11)), Math.round(TY + Math.sin(ang) * (16 + i * 11)), 1, 1, i < 5 ? '#aab4e6' : '#6a6fa8');
      for (const b of sh) { const x = Math.round(b.x), y = Math.round(b.y); K.box(g, x - 2, y - 2, 5, 5, pw[1] > 0 ? '#c8501e' : '#c8801e'); K.box(g, x - 1, y - 1, 3, 3, '#fff6c8'); }
      const o = 10 - rec * 3; K.put(g, sGun(), TX + Math.cos(ang) * o, TY + Math.sin(ang) * o, { rot: ang }); K.put(g, sBase(), TX, TY);
      if (rec > .6) K.box(g, Math.round(TX + Math.cos(ang) * 22) - 2, Math.round(TY + Math.sin(ang) * 22) - 2, 5, 5, '#fff6c8');
      F.draw(g); for (const p of pops) A.text(g, p.txt, p.x, p.y, p.c, 1, 'center'); g.restore();
      /* HUD: power-up timers, chain, blimp energy, banner */
      let y = 5; for (let i = 0; i < 3; i++) if (pw[i] > 0) { A.text(g, PN[i].split(' ')[0], 4, y, PC[i]); K.box(g, 30, y, 26, 5, '#141428'); K.box(g, 31, y + 1, Math.ceil(pw[i] / (i === 2 ? 9 : 8) * 24), 3, PC[i]); y += 8; }
      if (mult > 1) A.text(g, 'CHAIN X' + mult, W - 4, 5, '#ffd23c', 1, 'right');
      for (const e of en) if (e.k === BOSS) { K.box(g, 79, 15, 82, 6, '#141428'); K.box(g, 80, 16, Math.ceil(e.hp / e.max * 80), 4, '#e8231e'); A.text(g, 'STORM BLIMP', TX, 7, '#ff8a7a', 1, 'center'); }
      if (banner > 0) { A.text(g, bTxt, TX + 1, 111, '#141428', 2, 'center'); A.text(g, bTxt, TX, 110, '#fff6c8', 2, 'center'); if (bSub) { A.text(g, bSub, TX + 1, 127, '#141428', 1, 'center'); A.text(g, bSub, TX, 126, '#ffd23c', 1, 'center'); } } }
  };
} });
