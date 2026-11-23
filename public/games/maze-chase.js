Arcade.game('maze-chase', { w: 228, h: 252, pad: 'dpad',
help: 'Steer the robot with the arrow keys, a swipe, or a tap where you want to go. Eat every dot to clear the maze - clear all 8 mazes to win! Slimes chase you: grab a blue star and bump them for 100, 200, 400, 800 points. Blinking slimes are asleep and harmless. Fruit is worth bonus points. From maze 2 an ice crystal freezes the slimes, from maze 3 purple portals zap you across the maze. Clear a maze without losing a life for a PERFECT bonus.',
init(A) {
  const K = Art, ID = 'maze-chase-', GW = 19, GH = 21, T = 12, LAST = 8, PSP = 6.2;
  const DIRS = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }], D = { right: DIRS[0], left: DIRS[1], down: DIRS[2], up: DIRS[3] };
  /* per maze: [floor, wall] */
  const THEME = [['#1c1834', '#3a48b0'], ['#10241e', '#2a8a62'], ['#22142a', '#8a3fb0'], ['#26180e', '#b8682a'], ['#0e2028', '#2a86a8'], ['#28121a', '#b83a58'], ['#181a2c', '#6a6ad8'], ['#201c0e', '#a8922a']];
  const SCOL = ['#e8231e', '#ff8a1e', '#b06ae0', '#3fd45a'], HOME = [[9, 1], [5, 1], [13, 1], [9, 5]], CORN = [[17, 1], [1, 1], [17, 19], [1, 19]];
  const PORT = [[1, 9], [17, 11]], ICE = [9, 11], F = K.fx(), bg = K.mkc(228, 252);
  /* tiles: 0 floor, 1 wall, 2 dot, 3 power star, 4 portal, 5 ice crystal */
  let grid, dots, total, pl, en, want = null, lives = 3, lvl = 1, tm = 0, scared = 0, sdur = 6, frozen = 0, combo = 0, mode = 0, modeT = 0;
  let dead = 0, rdy = 0, clr = 0, shake = 0, clean = true, fruit = null, fruitAt = [], pops = [], won = false;
  const open = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH && grid[y][x] !== 1;
  const info = () => A.info('MAZE ' + lvl + ' \u2665 ' + lives);
  const px = e => (e.x + e.dx * e.p) * T + 6, py = e => (e.y + e.dy * e.p) * T + 6;
  const pop = (x, y, s, c) => pops.push({ x: Math.max(16, Math.min(212, x)), y, s, c: c || '#ffffff', l: 1 });

  function place() { pl = { x: 9, y: 19, dx: 0, dy: 0, p: 0, f: 0 }; want = null; scared = frozen = combo = 0; mode = 0; modeT = 4; rdy = 1.5;
    const n = lvl < 2 ? 2 : lvl < 4 ? 3 : 4; en = [];
    for (let i = 0; i < n; i++) en.push({ t: i, x: HOME[i][0], y: HOME[i][1], dx: 0, dy: 0, p: 0, w: .4 + i * 1.6 }); }

  function gen() { grid = []; for (let y = 0; y < GH; y++) grid.push(new Array(GW).fill(1));
    /* random maze over 9x10 cells, then knock out extra walls and remove every dead end so there is always a way out */
    const seen = { '0,0': 1 }, st = [[0, 0]]; grid[1][1] = 2;
    while (st.length) { const c = st[st.length - 1], nb = DIRS.map(d => [c[0] + d.x, c[1] + d.y, d]).filter(n => n[0] >= 0 && n[1] >= 0 && n[0] < 9 && n[1] < 10 && !seen[n[0] + ',' + n[1]]);
      if (!nb.length) { st.pop(); continue; }
      const n = nb[A.ri(0, nb.length - 1)]; seen[n[0] + ',' + n[1]] = 1; grid[1 + 2 * c[1] + n[2].y][1 + 2 * c[0] + n[2].x] = 2; grid[1 + 2 * n[1]][1 + 2 * n[0]] = 2; st.push([n[0], n[1]]); }
    for (let i = Math.max(12, 32 - lvl * 3); i > 0; i--) { if (Math.random() < .5) grid[1 + 2 * A.ri(0, 9)][2 * A.ri(1, 8)] = 2; else grid[2 * A.ri(1, 9)][1 + 2 * A.ri(0, 8)] = 2; }
    for (let cy = 0; cy < 10; cy++) for (let cx = 0; cx < 9; cx++) { const X = 1 + 2 * cx, Y = 1 + 2 * cy; if (DIRS.filter(d => open(X + d.x, Y + d.y)).length > 1) continue;
      const c = DIRS.filter(d => grid[Y + d.y][X + d.x] === 1 && X + 2 * d.x > 0 && X + 2 * d.x < GW && Y + 2 * d.y > 0 && Y + 2 * d.y < GH), d = c[A.ri(0, c.length - 1)]; grid[Y + d.y][X + d.x] = 2; }
    for (const c of CORN) grid[c[1]][c[0]] = 3; grid[19][9] = 0;
    if (lvl > 1) grid[ICE[1]][ICE[0]] = 5; if (lvl > 2) for (const p of PORT) grid[p[1]][p[0]] = 4;
    dots = 0; for (const r of grid) for (const v of r) if (v === 2 || v === 3) dots++;
    total = dots; fruitAt = [Math.floor(total * .66), Math.floor(total * .33)]; fruit = null; clean = true; sdur = Math.max(3, 6.6 - lvl * .45); paint(); place(); }

  /* the maze is painted once per level into one reused canvas */
  function paint() { const q = bg.getContext('2d'), th = THEME[(lvl - 1) % THEME.length], c = th[1], fl = K.T.stone(64, 64, th[0]), wl = K.T.stone(64, 64, c), ol = K.dark(c, .75);
    const W = (x, y) => x < 0 || y < 0 || x >= GW || y >= GH || grid[y][x] === 1; K.scroll(q, fl, 0, 0, 228, 252);
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const X = x * T, Y = y * T;
      if (!W(x, y)) { if (W(x, y - 1)) K.box(q, X, Y, T, 3, 'rgba(0,0,10,.45)'); if (W(x - 1, y)) K.box(q, X, Y, 2, T, 'rgba(0,0,10,.3)'); continue; }
      q.drawImage(wl, X % 48, Y % 48, T, T, X, Y, T, T);
      if (!W(x, y - 1)) { K.box(q, X, Y, T, 1, ol); K.box(q, X, Y + 1, T, 2, K.lite(c, .45)); }
      if (!W(x, y + 1)) { K.box(q, X, Y + 8, T, 3, K.dark(c, .4)); K.box(q, X, Y + 11, T, 1, ol); }
      if (!W(x - 1, y)) { K.box(q, X, Y, 1, T, ol); K.box(q, X + 1, Y + 1, 1, T - 2, K.lite(c, .3)); }
      if (!W(x + 1, y)) { K.box(q, X + 11, Y, 1, T, ol); K.box(q, X + 10, Y + 1, 1, T - 2, K.dark(c, .25)); } } }

  function spawnFruit() { for (let i = 0; i < 40; i++) { const x = 1 + 2 * A.ri(0, 8), y = 1 + 2 * A.ri(0, 9);
      if (Math.abs(x - pl.x) + Math.abs(y - pl.y) > 5 && grid[y][x] < 3) { fruit = { x, y, l: 10, k: (lvl - 1) % 4 }; A.beep(990, .08, 'triangle'); F.spark(x * T + 6, y * T + 6, ['#ffffff', '#ffd23c'], 8, 40); return; } } }

  /* robot arrives on a tile: eat, zap, turn */
  function chP(e) { const v = grid[e.y][e.x], X = e.x * T + 6, Y = e.y * T + 6;
    if (v === 2) { grid[e.y][e.x] = 0; dots--; A.add(10); A.beep(dots % 2 ? 620 : 760, .03); }
    else if (v === 3) { grid[e.y][e.x] = 0; dots--; A.add(50); scared = sdur; combo = 0; A.beep(300, .2, 'triangle'); A.beep(450, .25, 'triangle'); F.spark(X, Y, ['#5fe3d6', '#ffffff'], 14, 70);
      for (const s of en) if (!s.w && (s.dx || s.dy)) { s.x += s.dx; s.y += s.dy; s.p = 1 - s.p; s.dx = -s.dx; s.dy = -s.dy; } }
    else if (v === 5) { grid[e.y][e.x] = 0; frozen = 4; A.add(50); pop(X, Y - 8, 'FREEZE!', '#9fe0ff'); A.beep(1200, .25, 'sine'); A.beep(800, .3, 'sine'); F.spark(X, Y, ['#9fe0ff', '#ffffff'], 16, 80); }
    else if (v === 4) { const o = PORT[e.x === PORT[0][0] && e.y === PORT[0][1] ? 1 : 0]; F.spark(X, Y, ['#b06ae0', '#ffffff'], 10, 60); e.x = o[0]; e.y = o[1]; F.spark(e.x * T + 6, e.y * T + 6, ['#b06ae0', '#5fe3d6'], 12, 60); A.beep(520, .08, 'sine'); A.beep(1040, .12, 'sine'); }
    if (fruit && fruit.x === e.x && fruit.y === e.y) { const n = 100 + lvl * 50; A.add(n); pop(X, Y - 8, n, '#ffd23c'); A.beep(660, .08, 'triangle'); A.beep(990, .12, 'triangle'); F.spark(X, Y, ['#ffd23c', '#ff8a1e', '#ffffff'], 12, 60); fruit = null; }
    if (fruitAt.length && dots <= fruitAt[0] && dots > 0) { fruitAt.shift(); if (!fruit) spawnFruit(); }
    if (want && open(e.x + want.x, e.y + want.y)) { e.dx = want.x; e.dy = want.y; } else if (!open(e.x + e.dx, e.y + e.dy)) e.dx = e.dy = 0; }

  /* slime arrives on a tile: each colour has its own idea of where to go.
     red hunts the robot, orange cuts it off, purple is shy up close, green just wanders */
  function chE(e) { let o = DIRS.filter(d => open(e.x + d.x, e.y + d.y) && !(d.x === -e.dx && d.y === -e.dy)); if (!o.length) o = DIRS.filter(d => open(e.x + d.x, e.y + d.y));
    let tx = pl.x, ty = pl.y, d; const far = Math.abs(e.x - pl.x) + Math.abs(e.y - pl.y), c = CORN[e.t];
    if (scared <= 0) { if (mode === 0 || (e.t === 2 && far < 6)) { tx = c[0]; ty = c[1]; } else if (e.t === 1) { tx += pl.dx * 4; ty += pl.dy * 4; } }
    if (Math.random() < (e.t === 3 ? .6 : Math.max(.08, .32 - lvl * .03))) d = o[A.ri(0, o.length - 1)];
    else { const ds = v => (e.x + v.x - tx) ** 2 + (e.y + v.y - ty) ** 2; o.sort((a, b) => ds(a) - ds(b)); d = scared > 0 ? o[o.length - 1] : o[0]; }
    e.dx = d.x; e.dy = d.y; }

  function step(e, sp, dt, ch) { if (!e.dx && !e.dy) { ch(e); if (!e.dx && !e.dy) return; }
    e.p += sp * dt; while (e.p >= 1) { e.p -= 1; e.x += e.dx; e.y += e.dy; ch(e); if (!e.dx && !e.dy) { e.p = 0; break; } } }

  function cleared() { clr = 2; let b = lvl * 100; A.add(b); pop(114, 96, 'MAZE CLEAR +' + b, '#ffd23c');
    if (clean) { A.add(250); pop(114, 110, 'PERFECT +250', '#5fe3d6'); }
    if (lvl % 3 === 0 && lvl < LAST && lives < 5) { lives++; pop(114, 124, '+1 LIFE', '#ff8a9a'); info(); }
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => A.beep(f, .14, 'triangle'), i * 110));
    for (let i = 0; i < 6; i++) F.spark(A.rnd(30, 198), A.rnd(40, 200), ['#ffd23c', '#5fe3d6', '#ff8a9a', '#ffffff'], 10, 70); }

  gen(); info();
  return {
    key(k) { const w = D[k]; if (!w) return; want = w;
      if ((pl.dx || pl.dy) && pl.dx === -w.x && pl.dy === -w.y) { pl.x += pl.dx; pl.y += pl.dy; pl.p = 1 - pl.p; pl.dx = w.x; pl.dy = w.y; } },
    tap(x, y) { const dx = x - px(pl), dy = y - py(pl); this.key(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); },
    update(dt) { tm += dt; shake -= dt; for (const p of pops) { p.l -= dt * .7; p.y -= dt * 10; } if (pops.length && pops[0].l <= 0) pops.shift();
      if (won) return;
      if (clr > 0) { clr -= dt; if (clr <= 0) { if (lvl >= LAST) { won = true; A.add(lives * 500); A.over(true); } else { lvl++; gen(); info(); } } return; }
      if (dead > 0) { dead -= dt; if (dead <= 0) { if (lives <= 0) A.over(); else place(); } return; }
      if (rdy > 0) { rdy -= dt; if (rdy <= 0) A.beep(880, .12, 'triangle'); return; }
      if (scared > 0) { scared -= dt; if (scared <= 0) combo = 0; else if (scared < 1.5 && Math.floor(scared * 6) !== Math.floor((scared + dt) * 6)) A.beep(420, .03); }
      if (frozen > 0) frozen -= dt;
      if (fruit && (fruit.l -= dt) <= 0) fruit = null;
      if ((modeT -= dt) <= 0) { mode = 1 - mode; modeT = mode ? 9 + lvl : 3.5; }
      step(pl, PSP, dt, chP); if (pl.dx || pl.dy) pl.f = pl.dx < 0 ? 1 : pl.dx > 0 ? 0 : pl.dy < 0 ? 3 : 2;
      if (dots <= 0) { cleared(); return; }
      const es = scared > 0 ? 2.6 : Math.min(5.5, 3.6 + lvl * .24);
      for (const e of en) { if (e.w > 0) { e.w = Math.max(0, e.w - dt); continue; } if (frozen > 0) continue;
        step(e, es * (e.t === 3 ? .85 : 1), dt, chE); const dx = px(e) - px(pl), dy = py(e) - py(pl);
        if (dx * dx + dy * dy < 58) {
          if (scared > 0) { const n = 100 << Math.min(3, combo++); A.add(n); pop(px(e), py(e) - 8, n, '#ffd23c'); A.beep(700 + combo * 150, .12); F.boom(px(e), py(e)); F.spark(px(e), py(e), [SCOL[e.t], '#ffffff'], 10, 70);
            e.x = HOME[e.t][0]; e.y = HOME[e.t][1]; e.dx = e.dy = e.p = 0; e.w = 3.5; }
          else { lives--; clean = false; dead = 1.3; shake = .35; A.beep(220, .15, 'sawtooth'); A.beep(150, .45, 'sawtooth'); F.boom(px(pl), py(pl)); F.spark(px(pl), py(pl), ['#5fe3d6', '#ffffff', '#ffd23c'], 18, 90); info(); return; } } } },
    draw(g) { const f = Math.floor(tm * 6) % 2, sh = shake > 0;
      if (sh) { g.save(); K.box(g, 0, 0, 228, 252, '#0d0b14'); g.translate(A.ri(-2, 2), A.ri(-2, 2)); }
      g.drawImage(bg, 0, 0);
      if (clr > 0 && Math.floor(clr * 6) % 2) K.box(g, 0, 0, 228, 252, 'rgba(255,255,255,.14)');
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const v = grid[y][x], X = x * T, Y = y * T; if (v < 2) continue;
        if (v === 2) { K.box(g, X + 4, Y + 4, 4, 4, '#5a3a10'); K.box(g, X + 5, Y + 5, 2, 2, '#ffd98a'); K.box(g, X + 5, Y + 5, 1, 1, '#ffffff'); }
        else if (v === 3) K.put(g, K.star2('#5fe3d6', f ? 12 : 10), X + 6, Y + 6);
        else if (v === 4) K.put(g, K.spr(ID + 'port' + Math.floor(tm * 8) % 4, 12, 12, q => { q.rotate(Math.floor(tm * 8) % 4 * K.TAU / 8); K.ell(q, 0, 0, 5.6, 5.6, '#5a2a8a'); K.ell(q, 0, 0, 4.4, 4.4, '#b06ae0'); K.ell(q, 0, 0, 3, 3, '#2a1040'); K.box(q, -5, -1, 3, 2, '#e0b0ff'); K.box(q, 2, -1, 3, 2, '#e0b0ff'); K.box(q, -1, -1, 2, 2, '#5fe3d6'); }), X + 6, Y + 6);
        else if (v === 5) K.put(g, K.spr(ID + 'ice', 10, 12, q => { K.part(q, [0, -6, 5, -1, 0, 6, -5, -1], K.lin(q, -5, 0, 5, 0, '#ffffff', '#9fe0ff', '#3f8ad0')); K.part(q, [0, -6, 2, -1, 0, 6, -2, -1], '#d8f4ff'); K.box(q, -3, -2, 1, 2, '#ffffff'); }), X + 6, Y + 6 + (f ? -1 : 0)); }
      if (fruit && (fruit.l > 2.5 || Math.floor(fruit.l * 6) % 2)) { K.shadow(g, fruit.x * T + 6, fruit.y * T + 11, 4, 2); K.put(g, K.fruit(fruit.k), fruit.x * T + 6, fruit.y * T + 5 + (f ? -1 : 0)); }
      for (const e of en) { const x = px(e), y = py(e), ice = frozen > 0 && !e.w && (frozen > 1 || Math.floor(frozen * 8) % 2);
        const c = ice ? '#9fe0ff' : scared > 0 && !e.w ? (scared < 1.5 && Math.floor(scared * 6) % 2 ? '#d6dbea' : '#3f6ad0') : SCOL[e.t];
        if (e.w > 0) { K.put(g, K.slime(c, 1), x, y + 1, { a: Math.floor(tm * 8) % 2 ? .35 : .65 }); if (e.w > 1) A.text(g, 'Z', x + 4, y - 9 - (f ? 1 : 0), '#d6dbea'); continue; }
        K.shadow(g, x, y + 5, 4, 2); K.put(g, K.slime(c, ice ? 0 : f), x, y); }
      if (dead <= 0 || (dead > .5 && Math.floor(dead * 12) % 2)) { const d = DIRS[pl.f], n = pl.dx || pl.dy ? f : 0, x = px(pl), y = py(pl); K.shadow(g, x, y + 5, 4, 2);
        K.put(g, K.spr(ID + 'bot' + pl.f + n, 12, 13, q => { K.box(q, -1, -7, 2, 2, '#ffd23c'); K.rr(q, -5, -5, 10, 9, 2, K.lin(q, -5, 0, 5, 0, '#c8fffa', '#5fe3d6', '#1f8a84')); K.box(q, -4, -3, 8, 4, '#12303a');
          K.box(q, -3 + d.x, -2 + (d.y > 0 ? 1 : 0), 2, d.y < 0 ? 1 : 2, '#ffffff'); K.box(q, 1 + d.x, -2 + (d.y > 0 ? 1 : 0), 2, d.y < 0 ? 1 : 2, '#ffffff'); K.box(q, -4, 2, 8, 1, '#1f8a84');
          K.box(q, n ? -4 : -3, 4, 3, 2, '#3a4152'); K.box(q, n ? 1 : 0, 4, 3, 2, '#3a4152'); }), x, y);
        if (scared > 0 && f) K.box(g, Math.round(x) - 1, Math.round(y) - 9, 2, 1, '#ffffff'); }
      F.draw(g);
      if (scared > 0) { K.box(g, 73, 248, 82, 3, '#141030'); K.box(g, 74, 249, Math.ceil(80 * scared / sdur), 1, scared < 1.5 ? '#d6dbea' : '#5fe3d6'); }
      if (frozen > 0) { K.box(g, 73, 1, 82, 3, '#141030'); K.box(g, 74, 2, Math.ceil(80 * frozen / 4), 1, '#9fe0ff'); }
      for (const p of pops) if (p.l > 0) { const s = String(p.s), w = s.length * 4 + 3; K.box(g, Math.round(p.x - w / 2), Math.round(p.y) - 2, w, 9, 'rgba(13,11,20,.75)'); A.text(g, s, p.x, p.y, p.c, 1, 'center'); }
      if (rdy > 0 && dead <= 0) { K.box(g, 60, 104, 108, 32, 'rgba(13,11,20,.85)'); K.box(g, 60, 104, 108, 1, '#5fe3d6'); K.box(g, 60, 135, 108, 1, '#5fe3d6');
        A.text(g, 'MAZE ' + lvl, 114, 109, '#ffd23c', 2, 'center'); A.text(g, rdy > .5 ? (lvl === 2 ? 'NEW: ICE CRYSTAL' : lvl === 3 ? 'NEW: PORTALS' : lvl === 4 ? 'NEW: GREEN SLIME' : lvl === LAST ? 'LAST MAZE!' : 'READY') : 'GO!', 114, 124, '#ffffff', 1, 'center'); }
      if (won) { K.box(g, 50, 108, 128, 20, 'rgba(13,11,20,.85)'); A.text(g, 'ALL MAZES CLEAR!', 114, 115, '#ffd23c', 1, 'center'); }
      if (sh) g.restore(); }
  };
} });
