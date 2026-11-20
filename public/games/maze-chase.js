Arcade.game('maze-chase', { w: 228, h: 252, pad: 'dpad',
help: 'Swipe or use the arrow keys to steer the robot. Collect every dot. The slimes chase you — grab a blue star and for a few seconds you can bump them away.',
init(A) {
  const GW = 19, GH = 21, T = 12, DIRS = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }], D = { right: DIRS[0], left: DIRS[1], down: DIRS[2], up: DIRS[3] };
  const BOT = A.spr(['..oooooo..', '.obbbbbbo.', 'obwkbbwkbo', 'obwkbbwkbo', 'obbbbbbbbo', 'obboooobbo', 'obbbbbbbbo', '.obbbbbbo.', '..oo..oo..', '..oo..oo..'], { o: '#0e4a52', b: '#5fe3d6', w: '#ffffff', k: '#12101c' });
  const SM = ['...oooo...', '..occcco..', '.occcccco.', 'ocwkccwkco', 'ocwkccwkco', 'occcccccco', 'occcccccco', 'occcccccco', 'oco.oo.oco', '.o......o.'], mkS = c => A.spr(SM, { o: '#1a1222', c, w: '#ffffff', k: '#1a1222' });
  const SL = [mkS('#e8231e'), mkS('#ff8a1e'), mkS('#b06ae0')], SC = mkS('#3f6ad0'), SC2 = mkS('#d6dbea');
  let grid, dots, pl, en, want = null, lives = 3, lvl = 1, scared = 0, dead = 0, tm = 0;
  const open = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH && grid[y][x] !== 1;
  function place() { pl = { x: 9, y: 19, dx: 0, dy: 0, p: 0 }; want = null; en = [[17, 1], [1, 1], [9, 1]].map(h => ({ x: h[0], y: h[1], hx: h[0], hy: h[1], dx: 0, dy: 0, p: 0 })); }
  function gen() { grid = []; for (let y = 0; y < GH; y++) grid.push(new Array(GW).fill(1)); const seen = { '0,0': 1 }, st = [[0, 0]]; grid[1][1] = 2;
    while (st.length) { const c = st[st.length - 1], nb = DIRS.map(d => [c[0] + d.x, c[1] + d.y, d]).filter(n => n[0] >= 0 && n[1] >= 0 && n[0] < 9 && n[1] < 10 && !seen[n[0] + ',' + n[1]]);
      if (!nb.length) { st.pop(); continue; } const n = nb[A.ri(0, nb.length - 1)]; seen[n[0] + ',' + n[1]] = 1; grid[1 + 2 * c[1] + n[2].y][1 + 2 * c[0] + n[2].x] = 2; grid[1 + 2 * n[1]][1 + 2 * n[0]] = 2; st.push([n[0], n[1]]); }
    for (let i = 0; i < 30; i++) { if (Math.random() < .5) grid[1 + 2 * A.ri(0, 9)][2 * A.ri(1, 8)] = 2; else grid[2 * A.ri(1, 9)][1 + 2 * A.ri(0, 8)] = 2; }
    grid[1][1] = grid[1][17] = grid[19][1] = grid[19][17] = 3; grid[19][9] = 0; dots = 0; for (const r of grid) for (const v of r) if (v > 1) dots++; scared = 0; place(); }
  const info = () => A.info('LIVES ' + lives + '  LEVEL ' + lvl);
  function chP(e) { const v = grid[e.y][e.x]; if (v === 2) { grid[e.y][e.x] = 0; dots--; A.add(10); if (dots % 2) A.beep(700, .02); } else if (v === 3) { grid[e.y][e.x] = 0; dots--; A.add(50); scared = 6; A.beep(300, .2, 'triangle'); }
    if (want && open(e.x + want.x, e.y + want.y)) { e.dx = want.x; e.dy = want.y; } else if (!open(e.x + e.dx, e.y + e.dy)) e.dx = e.dy = 0; }
  function chE(e) { let o = DIRS.filter(d => open(e.x + d.x, e.y + d.y) && !(d.x === -e.dx && d.y === -e.dy && (e.dx || e.dy))); if (!o.length) o = DIRS.filter(d => open(e.x + d.x, e.y + d.y));
    let d; if (Math.random() < .25) d = o[A.ri(0, o.length - 1)]; else { const ds = v => (e.x + v.x - pl.x) ** 2 + (e.y + v.y - pl.y) ** 2; o.sort((a, b) => ds(a) - ds(b)); d = scared > 0 ? o[o.length - 1] : o[0]; } e.dx = d.x; e.dy = d.y; }
  function step(e, sp, dt, ch) { if (!e.dx && !e.dy) { ch(e); if (!e.dx && !e.dy) return; } e.p += sp * dt; while (e.p >= 1) { e.p -= 1; e.x += e.dx; e.y += e.dy; ch(e); if (!e.dx && !e.dy) { e.p = 0; break; } } }
  gen(); info();
  return {
    key(k) { const w = D[k]; if (!w) return; want = w; if ((pl.dx || pl.dy) && pl.dx === -w.x && pl.dy === -w.y) { pl.x += pl.dx; pl.y += pl.dy; pl.p = 1 - pl.p; pl.dx = w.x; pl.dy = w.y; } },
    update(dt) { tm += dt; if (dead > 0) { dead -= dt; if (dead <= 0) { if (lives <= 0) A.over(); else place(); } return; }
      scared -= dt; step(pl, 6.2, dt, chP); const es = scared > 0 ? 3 : 4.2 + lvl * .25;
      for (const e of en) { step(e, es, dt, chE); const dx = e.x + e.dx * e.p - pl.x - pl.dx * pl.p, dy = e.y + e.dy * e.p - pl.y - pl.dy * pl.p;
        if (dx * dx + dy * dy < .5) { if (scared > 0) { A.add(100); A.beep(900, .1); e.x = e.hx; e.y = e.hy; e.dx = e.dy = 0; e.p = 0; } else { lives--; dead = 1; A.beep(150, .4, 'sawtooth'); info(); return; } } }
      if (dots <= 0) { lvl++; A.add(200); A.beep(880, .3, 'triangle'); gen(); info(); } },
    draw(g) { g.fillStyle = '#12101c'; g.fillRect(0, 0, 228, 252);
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const v = grid[y][x], X = x * T, Y = y * T;
        if (v === 1) { g.fillStyle = '#2a2f6a'; g.fillRect(X, Y, T, T); g.fillStyle = '#4a52a0'; g.fillRect(X, Y, T, 1); g.fillRect(X, Y, 1, T); g.fillStyle = '#161a40'; g.fillRect(X, Y + 11, T, 1); g.fillRect(X + 11, Y, 1, T); }
        else if (v === 2) { g.fillStyle = '#ffd9a0'; g.fillRect(X + 5, Y + 5, 2, 2); }
        else if (v === 3 && Math.floor(tm * 5) % 2) { g.fillStyle = '#5fe3d6'; g.fillRect(X + 3, Y + 3, 6, 6); g.fillStyle = '#fff'; g.fillRect(X + 5, Y + 5, 2, 2); } }
      const at = (e, s) => g.drawImage(s, Math.round((e.x + e.dx * e.p) * T) + 1, Math.round((e.y + e.dy * e.p) * T) + 1);
      en.forEach((e, i) => at(e, scared > 0 ? (scared < 1.5 && Math.floor(tm * 8) % 2 ? SC2 : SC) : SL[i]));
      if (dead <= 0 || Math.floor(dead * 12) % 2) at(pl, BOT); }
  };
} });
