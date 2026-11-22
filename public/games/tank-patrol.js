/* Tank Patrol v0.4 — 10 missions, a base to defend, 4 kinds of enemy tank, steel, water, bushes, power-ups */
Arcade.game('tank-patrol', { w: 240, h: 320, pad: 'dpad', a: 'FIRE',
help: 'Drive your green tank with the arrow keys or the buttons and shoot with Space or FIRE (you can also hold a finger or the mouse on the field: the tank drives there and fires). Destroy every enemy tank to finish a mission, there are 10. Guard your flag base at the bottom: it can take 3 hits, then it costs a life. Brown bricks can be shot away, grey steel cannot, tanks cannot cross water and bushes are only cover. Red tanks are slow, orange scouts are fast and chase you, purple heavy tanks need 3 hits and teal blasters shoot fast. A star marks where the next enemy appears. Enemy tanks sometimes drop a power-up: star = faster shots (two stars also break steel), shield, heart = extra life, snowflake = freeze the enemies, green cross = repair the base. A mission without losing a life is a PERFECT.',
init(A) {
  const K = Art, ID = 'tank-patrol-', F = K.fx(), T = 16, GW = 15, GH = 20, W = 240, H = 320, DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0], DK = ['up', 'right', 'down', 'left'];
  const BRICK = 1, STEEL = 2, BUSH = 3, WATER = 4, HQ = 5, LAST = 10, BLOCK = [0, 1, 1, 0, 1, 1];
  /* enemy kinds: colour, speed, hit points, score, reload factor, bullet speed factor */
  const KD = [['#e8231e', 24, 1, 100, 1, 1], ['#ff9a2a', 42, 1, 200, 1.25, 1], ['#9a5ae0', 17, 3, 300, 1, 1], ['#2ad0c0', 27, 2, 400, .6, 1.5]];
  const PC = ['#e8a81e', '#3f8ae0', '#e8231e', '#2ab8d0', '#3fa84a'], PN = ['RAPID FIRE', 'SHIELD', 'EXTRA LIFE', 'FREEZE', 'BASE REPAIR'];
  const NEW = { 1: 'DEFEND YOUR BASE', 2: 'NEW: FAST SCOUTS', 3: 'NEW: HEAVY TANKS', 4: 'NEW: WATER AND BUSHES', 5: 'NEW: BLASTER TANKS', 10: 'FINAL MISSION' };
  const GND = [['#4a4428', '#625a34', '#342e18'], ['#6a5230', '#84683e', '#4a361c'], ['#3a4250', '#4c5668', '#272c38'], ['#4a2c30', '#643a3a', '#301a20']];
  const SPAWN = [24, 120, 216], WALL = [[6, 18], [7, 18], [8, 18], [6, 19], [8, 19]], BC = ['#b5522a', '#d8703a', '#7a3418'], SC = ['#f2f5f8', '#9aa4b4', '#4a5462'];
  let m, pl, en = [], sh = [], pops = [], picks = [], queue = [], warn = null;
  let lives = 3, lvl = 1, power = 0, hq = 3, kills = 0, perfect = true, want = 0, t = 0;
  let spawnT = 0, inv = 0, shield = 0, freeze = 0, intro = 0, banner = 0, bTxt = '', bSub = '', shake = 0, clearT = 0, dying = 0, hqFl = 0;

  /* ---- sprites (cached by K.spr / K.tex, tanks point up) ---- */
  const sTank = (k, f) => K.spr(ID + 't' + k + f, 16, 18, g => { const c = k > 3 ? '#3fd45a' : KD[k][0], body = K.lin(g, -6, 0, 6, 0, K.lite(c, .4), c, K.dark(c, .45)), gun = K.lin(g, -2, 0, 3, 0, K.lite(c, .65), K.dark(c, .25));
    for (const s of [-8, 4]) { K.box(g, s, -7, 4, 15, '#23232c'); for (let y = -7 + f; y < 8; y += 3) K.box(g, s, y, 4, 1, '#6a7490'); }
    if (k === 1) { K.part(g, [-4, 7, -4, -3, 0, -7, 4, -3, 4, 7], body); K.ell(g, 0, 2, 3, 3, K.lite(c, .35)); K.box(g, -1, -9, 2, 9, gun); }
    else if (k === 2) { K.box(g, -6, -6, 12, 14, body); K.box(g, -4, -2, 8, 8, K.lite(c, .3)); K.box(g, -3, -9, 2, 9, gun); K.box(g, 1, -9, 2, 9, gun); for (const [x, y] of [[-5, -5], [4, -5], [-5, 6], [4, 6]]) K.box(g, x, y, 1, 1, '#f2e8ff'); }
    else { K.box(g, -5, -5, 10, 12, body); K.ell(g, 0, 2, 4, 4, K.lite(c, .3)); K.box(g, -1, -9, 3, 10, gun);
      if (k === 3) { K.box(g, -2, -9, 5, 3, '#ffd23c'); K.box(g, -5, 6, 10, 1, '#0e6a64'); } else K.box(g, -2, -9, 5, 2, K.lite(c, .5));
      if (k > 3) { K.box(g, -1, 1, 3, 3, '#ffd23c'); K.box(g, 0, 2, 1, 1, '#fff6c8'); } } });
  const sBrick = () => K.tex(ID + 'brick', 16, 16, { base: '#b5522a', blobs: [['#d8703a', .5, 3, 5, 9], ['#7a3418', .5, 3, 5, 9]], L: 8, post: q => { for (const y of [0, 8]) { K.box(q, 0, y, 16, 1, '#e09a62'); K.box(q, 0, y + 7, 16, 1, '#4a1e0c'); } K.box(q, 7, 0, 1, 8, '#4a1e0c'); K.box(q, 3, 8, 1, 8, '#4a1e0c'); K.box(q, 11, 8, 1, 8, '#4a1e0c'); } });
  const sSteel = () => K.tex(ID + 'steel', 16, 16, { base: '#9aa4b4', post: q => { q.drawImage(K.block(16, 16, '#9aa4b4'), 0, 0); for (const [a, c] of [[3, 3], [11, 3], [3, 11], [11, 11]]) { K.box(q, a, c, 2, 2, '#4a5462'); K.box(q, a, c, 1, 1, '#e6ecf4'); } } });
  const sWater = f => K.tex(ID + 'water' + f, 16, 16, { base: '#1b6fb0', post: q => { K.box(q, 0, 0, 16, 16, '#1b6fb0'); for (const [x, y] of [[1, 3], [9, 6], [4, 11], [12, 14]]) { K.box(q, (x + f * 3) % 14, y, 4, 1, '#6fb8ee'); K.box(q, (x + f * 3 + 1) % 14, y + 1, 2, 1, '#0f4f8a'); } } });
  const sBush = () => K.spr(ID + 'bush', 16, 16, g => { for (const [x, y, r] of [[-4, -4, 4.6], [4, -3, 4.6], [-3, 4, 5], [4, 4, 4.6], [0, 0, 5]]) K.ell(g, x, y, r, r, '#1f6a2a'); for (const [x, y, r] of [[-4, -5, 2.6], [4, -4, 2.6], [-3, 3, 3], [4, 3, 2.4], [0, -1, 2.6]]) K.ell(g, x, y, r, r, '#3fa84a'); for (const [x, y] of [[-5, -6], [3, -5], [-4, 2], [0, -2], [5, 2]]) K.box(g, x, y, 2, 1, '#8ae06a'); }, { ol: [14, 50, 22] });
  const sBase = () => K.spr(ID + 'hq', 16, 16, g => { K.box(g, -8, -8, 16, 16, '#3a4252'); K.box(g, -8, -8, 16, 1, '#8a94a8'); K.box(g, -8, 7, 16, 1, '#1e2430'); K.box(g, -7, 3, 14, 3, '#59627a'); K.box(g, -4, -6, 1, 10, '#f2f5f8'); K.part(g, [-3, -6, 6, -3.5, -3, -1], K.lin(g, -3, 0, 6, 0, '#8af09a', '#3fd45a', '#1f8a3a')); K.box(g, -1, -4, 2, 1, '#ffd23c'); }, { ol: 0 });
  const sPick = i => K.spr(ID + 'p' + i, 14, 14, g => { const c = PC[i], w = '#fffbe8'; K.rr(g, -7, -7, 14, 14, 3, K.lin(g, 0, -7, 0, 7, K.lite(c, .45), c, K.dark(c, .45)));
    if (i === 0) { const p = []; for (let j = 0; j < 10; j++) { const a = j / 10 * K.TAU, r = j % 2 ? 2.3 : 5.6; p.push(Math.sin(a) * r, -Math.cos(a) * r + .5); } K.part(g, p, w); }
    else if (i === 1) { K.part(g, K.sym([0, -5, 4, -4, 4, 1, 0, 5]), w); K.box(g, -1, -3, 2, 5, c); }
    else if (i === 2) { K.ell(g, -2.2, -1.6, 2.6, 2.6, w); K.ell(g, 2.2, -1.6, 2.6, 2.6, w); K.part(g, [-4.6, -.4, 4.6, -.4, 0, 5], w); }
    else if (i === 3) { K.box(g, -1, -5, 2, 10, w); K.box(g, -5, -1, 10, 2, w); for (const [x, y] of [[-4, -4], [2, -4], [-4, 2], [2, 2]]) K.box(g, x, y, 2, 2, w); }
    else { K.box(g, -2, -5, 4, 10, w); K.box(g, -5, -2, 10, 4, w); } });
  const ground = () => { const i = lvl >= LAST ? 3 : Math.floor((lvl - 1) / 3), c = GND[i]; return K.tex(ID + 'gnd' + i, 64, 64, { base: c[0], tile: 1, blobs: [[c[1], .5, 10, 10, 30], [c[2], .5, 10, 10, 30]], specks: [[c[1], 50, 2, 1], [c[2], 50, 2, 1]] }); };

  /* ---- helpers ---- */
  const left = () => queue.length + en.length + (warn ? 1 : 0);
  const info = () => A.info('MISSION ' + lvl + '  LIVES ' + lives + '  TANKS ' + left());
  const pop = (x, y, s, c) => pops.push({ x: Math.max(30, Math.min(W - 30, x)), y, s, c: c || '#fff6c8', l: 1.1 });
  const say = (a, b, d) => { bTxt = a; bSub = b; banner = d || 2.2; };
  const tune = (fs, type) => fs.forEach((f, i) => setTimeout(() => A.beep(f, .12, type || 'triangle', .05), i * 90));
  const solid = (x, y) => x < 0 || y < 0 || x >= W || y >= H || BLOCK[m[Math.floor(y / T)][Math.floor(x / T)]];
  /* a tank may always drive away from a tank it overlaps, so nobody ever gets stuck */
  const clash = (t, o, x, y) => o !== t && !o.dead && Math.abs(o.x - x) < 13 && Math.abs(o.y - y) < 13 && Math.max(Math.abs(o.x - x), Math.abs(o.y - y)) < Math.max(Math.abs(o.x - t.x), Math.abs(o.y - t.y));
  function free(t, x, y) { if (solid(x - 6, y - 6) || solid(x + 5, y - 6) || solid(x - 6, y + 5) || solid(x + 5, y + 5) || clash(t, pl, x, y)) return false; for (const o of en) if (clash(t, o, x, y)) return false; return true; }
  function move(t, d, sp, dt) { const hz = d % 2, ax = hz ? 'y' : 'x';
    if (t.d !== d) { t.d = d; const o = t[ax]; t[ax] = Math.round(o / 8) * 8; if (!free(t, t.x, t.y)) t[ax] = o; }
    const nx = t.x + DX[d] * sp * dt, ny = t.y + DY[d] * sp * dt; if (free(t, nx, ny)) { t.x = nx; t.y = ny; return true; }
    /* blocked: slide sideways into the nearest open lane (rounds corners for small hands) */
    const c0 = Math.floor(t[ax] / T) * T + 8; for (const c of [c0, c0 + (t[ax] > c0 ? T : -T)]) { const dc = c - t[ax]; if (!dc || Math.abs(dc) > 8.5 || !free(t, hz ? nx : c, hz ? c : ny)) continue;
      const v = t[ax] + Math.sign(dc) * Math.min(Math.abs(dc), sp * dt); if (free(t, hz ? t.x : v, hz ? v : t.y)) { t[ax] = v; return true; } }
    return false; }
  function shoot(t, own) { if (t.cd > 0 || t.dead) return; const k = own ? 0 : KD[t.k], x = t.x + DX[t.d] * 9, y = t.y + DY[t.d] * 9;
    t.cd = own ? (power ? .28 : .45) : A.rnd(1.7, 3.2) * k[4] * Math.max(.6, 1 - .04 * lvl);
    sh.push({ x, y, d: t.d, own, pw: own ? power : 0, sp: own ? (power ? 230 : 180) : (82 + lvl * 4) * k[5] }); F.spark(x, y, ['#fff6c8', '#ffd23c'], 3, 40);
    if (own) A.beep(power ? 820 : 700, .04); else A.beep(260, .03, 'square', .012); }
  function wall() { for (const [x, y] of WALL) { const cx = x * T + 8, cy = y * T + 8; if (m[y][x] !== BRICK && [pl, ...en].every(o => Math.abs(o.x - cx) >= 14 || Math.abs(o.y - cy) >= 14)) { m[y][x] = BRICK; F.spark(cx, cy, BC, 5, 40); } } }
  function place() { pl = { x: 72, y: 312, d: 0, cd: 0, f: 0 }; inv = 2.5; }

  /* ---- level: mirrored brick pillars on odd columns, even columns stay open lanes (only bricks or bushes) ---- */
  function gen() { m = []; for (let y = 0; y < GH; y++) m.push(new Array(GW).fill(0));
    const set = (x, y, v) => { m[y][x] = m[y][GW - 1 - x] = v; };
    for (let x = 1; x <= 7; x += 2) for (const a of [2, 10]) { const y0 = a + A.ri(0, 2), y1 = a + 6 - A.ri(0, 2); for (let y = y0; y <= y1; y++) if (Math.random() > .1) set(x, y, BRICK); }
    for (let i = A.ri(3, 5); i--;) set(A.ri(0, 3) * 2, A.ri(2, 16), BRICK);
    for (let i = 1 + Math.floor(lvl / 2); i--;) set(A.ri(0, 3) * 2 + 1, A.ri(3, 15), STEEL);
    if (lvl >= 4) { for (let i = A.ri(1, 2); i--;) { const x = A.ri(0, 3) * 2 + 1, y = A.ri(3, 13); for (let j = 0; j < 3; j++) set(x, y + j, WATER); }
      for (let i = A.ri(2, 3); i--;) { const x = A.ri(0, 6), y = A.ri(2, 15); for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) set(x + a, y + b, BUSH); } }
    for (const [x, y] of WALL) m[y][x] = BRICK; m[19][7] = HQ; }
  function start(n) { lvl = n; gen(); queue = []; const cnt = 5 + Math.floor(n * 1.5), pB = n >= 5 ? Math.min(.25, .06 * (n - 3)) : 0, pH = n >= 3 ? Math.min(.25, .07 * (n - 1)) : 0, pS = n >= 2 ? .25 : 0;
    for (let i = 0; i < cnt; i++) { const r = Math.random(); queue.push(r < pB ? 3 : r < pB + pH ? 2 : r < pB + pH + pS ? 1 : 0); }
    if (n === 2 || n === 3 || n === 5) queue[cnt - 2] = n === 5 ? 3 : n - 1; /* the new kind always shows up early */
    en = []; sh = []; picks = []; warn = null; hq = 3; perfect = true; spawnT = .6; clearT = 0; freeze = 0; intro = 1.2; place();
    say('MISSION ' + n, NEW[n] || cnt + ' ENEMY TANKS'); info(); }

  /* ---- events ---- */
  function hurt(base) { lives--; perfect = false; power = Math.max(0, power - 1); shake = .5; A.beep(120, .4, 'sawtooth'); const x = base ? 120 : pl.x, y = base ? 312 : pl.y; F.boom(x, y, 1); F.spark(x, y, ['#ffd23c', '#ff8a1e', '#f2f5f8'], 16, 110);
    if (lives <= 0) { pl.dead = 1; dying = 1.3; info(); return; }
    if (base) { hq = 3; wall(); inv = 2; pop(120, 286, 'BASE REBUILT', '#8af09a'); } else place(); info(); }
  function grab(i, x, y) { A.add(50); tune([660, 880, 1100]); pop(x, y - 10, i || power < 1 ? PN[i] : 'STEEL BUSTER', K.lite(PC[i], .5));
    if (i === 0) power = Math.min(2, power + 1); else if (i === 1) shield = 9; else if (i === 2) { if (lives < 5) lives++; else A.add(450); } else if (i === 3) freeze = 6; else { hq = 3; wall(); } info(); }
  function kill(e) { e.dead = 1; kills++; const k = KD[e.k]; A.add(k[3]); pop(e.x, e.y - 8, k[3]); shake = Math.max(shake, .18); A.beep(160, .15, 'sawtooth'); F.boom(e.x, e.y, 1); F.spark(e.x, e.y, [k[0], '#ffd23c', '#59627a'], 10, 90);
    if (kills % 4 === 2) { const c = [1, 3]; if (power < 2) c.push(0, 0); if (hq < 3 || WALL.some(([x, y]) => !m[y][x])) c.push(4, 4); if (lives < 4) c.push(2); picks.push({ x: e.x, y: e.y, i: c[A.ri(0, c.length - 1)], l: 12 }); } }
  /* a bullet is 6 wide for walls, so it chews bricks on both sides of a tile edge */
  function hitWall(b) { let hit = 0; for (const s of [-3, 3]) { const gx = Math.floor((b.x + DY[b.d] * s) / T), gy = Math.floor((b.y + DX[b.d] * s) / T), v = m[gy] && m[gy][gx];
      if (v === BRICK || (v === STEEL && b.pw > 1)) { m[gy][gx] = 0; F.spark(gx * T + 8, gy * T + 8, v === BRICK ? BC : SC, 7, 60); A.beep(v === BRICK ? 210 : 500, .05, 'square', .02); hit |= 1; }
      else if (v === STEEL) { hit |= 1; if (b.own) A.beep(1300, .03, 'square', .02); } else if (v === HQ) hit |= 2; }
    if (hit & 2 && !b.own && hq > 0) { hq--; hqFl = .4; shake = Math.max(shake, .25); A.beep(200, .2, 'sawtooth'); pop(120, 290, hq ? 'BASE HIT!' : 'BASE LOST!', '#ff8a7a'); if (!hq) hurt(1); }
    if (hit) F.spark(b.x, b.y, ['#fff6c8', '#ffd23c'], 3, 50); return hit; }
  function think(e) { const r = Math.random(), hunt = e.k === 1 && !pl.dead, tx = hunt ? pl.x : 120, ty = hunt ? pl.y : 312;
    e.w = r > .5 ? A.ri(0, 3) : Math.abs(tx - e.x) < 8 || r < .25 ? (ty > e.y ? 2 : 0) : tx > e.x ? 1 : 3; e.t = A.rnd(.6, 2.2); }

  start(1);
  return {
    key(k) { const d = DK.indexOf(k); if (d >= 0) want = d; else if (k === 'a' && intro <= 0) shoot(pl, 1); },
    tap() { if (intro <= 0) shoot(pl, 1); },
    update(dt) { t += dt; banner -= dt; hqFl -= dt; shake = Math.max(0, shake - dt); for (const p of pops) { p.y -= 14 * dt; p.l -= dt; } pops = pops.filter(p => p.l > 0);
      if (dying > 0 && (dying -= dt) <= 0) { A.over(); return; }
      if (intro > 0) { intro -= dt; return; }
      if (clearT > 0 && (clearT -= dt) <= 0) { if (lvl >= LAST) A.over(true); else start(lvl + 1); return; }
      inv -= dt; shield -= dt; freeze -= dt;
      /* player: the newest direction key wins; holding a finger on the field drives towards it and fires */
      if (!pl.dead) { pl.cd -= dt; const k = A.keys, p = A.ptr; let d = k[DK[want]] ? want : DK.findIndex(n => k[n]), fire = k.a;
        if (d < 0 && p.down) { const dx = p.x - pl.x, dy = p.y - pl.y; fire = 1; if (Math.max(Math.abs(dx), Math.abs(dy)) > 9) d = Math.abs(dx) > Math.abs(dy) * (pl.d % 2 ? .75 : 1.33) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0; }
        if (d >= 0 && move(pl, d, 58, dt)) pl.f += dt * 14; if (fire) shoot(pl, 1);
        for (const q of picks) if (Math.abs(q.x - pl.x) < 11 && Math.abs(q.y - pl.y) < 11) { q.l = 0; grab(q.i, q.x, q.y); } }
      for (const q of picks) q.l -= dt; picks = picks.filter(q => q.l > 0);
      /* enemies arrive one by one where the star blinks */
      spawnT -= dt; const maxOn = 3 + (lvl >= 4) + (lvl >= 8);
      if (!warn && spawnT <= 0 && queue.length && en.length < maxOn) { warn = { x: SPAWN[A.ri(0, 2)], t: .9, k: queue.pop() }; A.beep(520, .06, 'triangle', .02); }
      if (warn && (warn.t -= dt) <= 0) { const k = warn.k, e = { x: warn.x, y: 8, d: 2, w: 2, k, hp: KD[k][2], cd: A.rnd(.8, 1.6), t: A.rnd(.8, 2), f: 0, fl: 0 };
        if (free(e, e.x, e.y) && Math.abs(pl.x - e.x) + Math.abs(pl.y - e.y) > 14) { en.push(e); warn = null; spawnT = Math.max(1.1, 2.6 - lvl * .13); } else warn.x = SPAWN[A.ri(0, 2)]; }
      for (const e of en) { e.fl -= dt; if (freeze > 0) continue; e.cd -= dt; e.t -= dt; const sp = KD[e.k][1] * (1 + .04 * (lvl - 1));
        if (!move(e, e.w, sp, dt) || e.t <= 0) think(e); else e.f += dt * sp * .25; if (e.cd <= 0) shoot(e, 0); }
      /* bullets */
      for (const b of sh) { if (b.dead) continue; b.x += DX[b.d] * b.sp * dt; b.y += DY[b.d] * b.sp * dt;
        if (b.x < 0 || b.y < 0 || b.x >= W || b.y >= H || hitWall(b)) { b.dead = 1; continue; }
        if (b.own) { for (const o of sh) if (!o.own && !o.dead && Math.abs(o.x - b.x) < 6 && Math.abs(o.y - b.y) < 6) { o.dead = b.dead = 1; A.add(10); A.beep(900, .03); F.spark(b.x, b.y, ['#fff6c8', '#ff7a6a'], 6, 60); break; }
          if (!b.dead) for (const e of en) if (!e.dead && Math.abs(e.x - b.x) < 8 && Math.abs(e.y - b.y) < 8) { b.dead = 1; if (--e.hp <= 0) kill(e); else { e.fl = .25; A.beep(420, .06, 'square', .03); F.spark(b.x, b.y, SC, 5, 60); } break; } }
        else if (!pl.dead && Math.abs(pl.x - b.x) < 7 && Math.abs(pl.y - b.y) < 7) { b.dead = 1; if (shield > 0) { A.beep(1000, .05, 'triangle'); F.spark(b.x, b.y, ['#bfe8ff', '#5fc8ff'], 6, 70); } else if (inv <= 0) hurt(0); } }
      en = en.filter(e => !e.dead); sh = sh.filter(b => !b.dead);
      if (!clearT && !dying && !left()) { const bonus = 150 + lvl * 50 + (perfect ? 300 : 0) + (lvl >= LAST ? lives * 500 : 0); A.add(bonus); clearT = 2.2; sh = [];
        say(lvl >= LAST ? 'VICTORY!' : perfect ? 'PERFECT!' : 'MISSION CLEAR', 'BONUS +' + bonus, 2.2); tune(lvl >= LAST ? [660, 880, 990, 1320] : [660, 880, 1100]); }
      if (!clearT) info(); },
    draw(g) { const gx = Math.round(Math.sin(t * 80) * shake * 5), gy = Math.round(Math.cos(t * 67) * shake * 5), wf = Math.floor(t * 2) % 2; g.save(); g.translate(gx, gy);
      K.scroll(g, ground(), 0, 0, W, H); if (gx || gy) { K.box(g, -3, -3, 3, H + 6, '#140e1c'); K.box(g, W, -3, 3, H + 6, '#140e1c'); K.box(g, 0, -3, W, 3, '#140e1c'); K.box(g, 0, H, W, 3, '#140e1c'); }
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const v = m[y][x], X = x * T, Y = y * T; if (!v || v === BUSH) continue;
        if (v === WATER) { g.drawImage(sWater(wf), X, Y); if (m[y - 1][x] !== WATER) K.box(g, X, Y, T, 2, 'rgba(8,4,16,.4)'); continue; }
        K.box(g, X + 2, Y + 3, T, T, 'rgba(8,4,16,.3)'); if (v === HQ) { g.drawImage(sBase(), X - 1, Y - 1); for (let i = 0; i < 3; i++) K.box(g, X + 2 + i * 4, Y + 12, 3, 2, i < hq ? '#58e070' : '#5a1a1a'); if (hqFl > 0 && Math.floor(hqFl * 16) % 2) K.box(g, X, Y, T, T, 'rgba(255,255,255,.6)'); }
        else g.drawImage(v === BRICK ? sBrick() : sSteel(), X, Y); }
      for (const q of picks) if (q.l > 3 || Math.floor(q.l * 6) % 2) K.put(g, sPick(q.i), q.x, q.y + Math.round(Math.sin(t * 5 + q.x)));
      if (warn) K.put(g, K.star2(warn.k > 1 ? KD[warn.k][0] : '#fff6c8', Math.floor(t * 8) % 2 ? 14 : 10), warn.x, 8);
      const tk = (o, k) => { K.shadow(g, o.x + 1, o.y + 2, 8, 7); K.put(g, sTank(k, Math.floor(o.f) % 3), o.x, o.y, { rot: o.d * Math.PI / 2 }); };
      for (const e of en) { if (e.fl > 0 && Math.floor(e.fl * 20) % 2) continue; tk(e, e.k);
        if (freeze > 0 && (freeze > 1.5 || Math.floor(freeze * 8) % 2)) { K.box(g, Math.round(e.x) - 7, Math.round(e.y) - 7, 14, 14, 'rgba(150,215,255,.5)'); K.box(g, Math.round(e.x) - 5, Math.round(e.y) - 5, 2, 2, '#f2fbff'); K.box(g, Math.round(e.x) + 2, Math.round(e.y) + 1, 2, 2, '#f2fbff'); } }
      if (!pl.dead && (inv <= 0 || Math.floor(inv * 10) % 2)) { tk(pl, 4);
        if (shield > 0 && (shield > 2 || Math.floor(shield * 8) % 2)) { const x = Math.round(pl.x), y = Math.round(pl.y), c = Math.floor(t * 6) % 2 ? '#bfe8ff' : '#5fc8ff'; for (const [a, b, w, h] of [[-6, -11, 12, 1], [-6, 10, 12, 1], [-11, -6, 1, 12], [10, -6, 1, 12], [-9, -9, 3, 1], [6, -9, 3, 1], [-9, 8, 3, 1], [6, 8, 3, 1], [-9, -8, 1, 2], [8, -8, 1, 2], [-9, 6, 1, 2], [8, 6, 1, 2]]) K.box(g, x + a, y + b, w, h, c); } }
      for (const b of sh) { const x = Math.round(b.x), y = Math.round(b.y), v = b.d % 2 ? 0 : 1; K.box(g, x - 2 - !v, y - 2 - v, 4 + 2 * !v, 4 + 2 * v, '#1a1020'); K.box(g, x - 1 - !v, y - 1 - v, 2 + 2 * !v, 2 + 2 * v, b.own ? '#ffe45a' : '#ff6a5a'); K.box(g, x - 1, y - 1, 1, 1, '#ffffff'); }
      for (let y = 2; y < GH - 2; y++) for (let x = 0; x < GW; x++) if (m[y][x] === BUSH) K.put(g, sBush(), x * T + 8, y * T + 8);
      F.draw(g); for (const p of pops) A.text(g, p.s, p.x, p.y, p.l > .25 || Math.floor(p.l * 30) % 2 ? p.c : '#8a7a5a', 1, 'center'); g.restore();
      /* status chips and banner */
      let hx = 3; const chip = (s, c, v) => { K.box(g, hx, 311, s.length * 4 + 5, 8, 'rgba(10,8,20,.7)'); A.text(g, s, hx + 3, 312, c); if (v < 1) K.box(g, hx + 1, 318, Math.round((s.length * 4 + 3) * v), 1, c); hx += s.length * 4 + 8; };
      if (power > 0) chip(power > 1 ? 'STEEL BUSTER' : 'RAPID FIRE', '#ffd23c', 1); if (shield > 0) chip('SHIELD', '#8ad0ff', shield / 9); if (freeze > 0) chip('FREEZE', '#bff4ff', freeze / 6);
      if (banner > 0) { K.box(g, 0, 130, W, 52, 'rgba(10,8,20,.78)'); K.box(g, 0, 130, W, 1, '#ffd23c'); K.box(g, 0, 181, W, 1, '#ffd23c'); A.text(g, bTxt, 120, 139, '#ffd23c', 3, 'center'); A.text(g, bSub, 120, 163, '#f2f5f8', 2, 'center'); } }
  };
} });
