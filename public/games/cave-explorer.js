Arcade.game('cave-explorer', { w: 240, h: 240, pad: 'dpad',
help: 'The cave is dark — your lamp only shows what is near. Swipe or use the arrow keys to walk. Find the golden key, then the locked door. Collect gems and stay away from the bats.',
init(A) {
  const N = 15, T = 16, DIRS = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }], D = { right: DIRS[0], left: DIRS[1], down: DIRS[2], up: DIRS[3] };
  const HERO = A.spr(['..yyyyyy..', '.yyyyyyyy.', '..ssssss..', '..skssks..', '..ssssss..', '.gggggggg.', 'sggggggggs', '.gggggggg.', '..bb..bb..', '..kk..kk..'], { y: '#ffd23c', s: '#f0b890', k: '#12101c', g: '#3fb45a', b: '#5a4a6a' });
  const BAT = [0, 1].map(f => A.spr(f ? ['..........', 'p........p', 'pp.pppp.pp', 'pppprrpppp', '.pppppppp.', '..pp..pp..'] : ['..........', '..........', '...pppp...', 'pppprrpppp', 'pp.pppp.pp', 'p...pp...p'], { p: '#b06ae0', r: '#ff4060' })), GEM = A.shape(0, '#5fe3d6', 10);
  let m, seen, pl, bats, want = null, key, door, hasKey, gems, lives = 3, lvl = 1, tm = 0, dead = 0;
  const open = (x, y) => x >= 0 && y >= 0 && x < N && y < N && m[y][x] === 0, info = () => A.info('LIVES ' + lives + '  CAVE ' + lvl + (hasKey ? '  KEY' : ''));
  function gen() { m = []; seen = []; for (let y = 0; y < N; y++) { m.push(new Array(N).fill(1)); seen.push(new Array(N).fill(0)); } const vis = { '0,0': 1 }, st = [[0, 0]], cells = []; m[1][1] = 0;
    while (st.length) { const c = st[st.length - 1], nb = DIRS.map(d => [c[0] + d.x, c[1] + d.y, d]).filter(n => n[0] >= 0 && n[1] >= 0 && n[0] < 7 && n[1] < 7 && !vis[n[0] + ',' + n[1]]); if (!nb.length) { st.pop(); continue; } const n = nb[A.ri(0, nb.length - 1)]; vis[n[0] + ',' + n[1]] = 1; m[1 + 2 * c[1] + n[2].y][1 + 2 * c[0] + n[2].x] = 0; m[1 + 2 * n[1]][1 + 2 * n[0]] = 0; st.push([n[0], n[1]]); cells.push([1 + 2 * n[0], 1 + 2 * n[1]]); }
    for (let i = 0; i < 9; i++) { if (Math.random() < .5) m[1 + 2 * A.ri(0, 6)][2 * A.ri(1, 6)] = 0; else m[2 * A.ri(1, 6)][1 + 2 * A.ri(0, 6)] = 0; }
    const far = cells.filter(c => c[0] + c[1] > 9), take = () => far.splice(A.ri(0, far.length - 1), 1)[0]; key = take(); door = take(); hasKey = false; gems = []; for (let i = 0; i < 6; i++) gems.push(take());
    bats = []; for (let i = 0; i < 1 + lvl; i++) { const c = take(); bats.push({ x: c[0], y: c[1], dx: 0, dy: 0, p: 0 }); } pl = { x: 1, y: 1, dx: 0, dy: 0, p: 0 }; want = null; info(); }
  function chP(e) { if (key && e.x === key[0] && e.y === key[1]) { key = null; hasKey = true; A.add(50); A.beep(900, .15, 'triangle'); info(); }
    gems = gems.filter(q => { if (q[0] === e.x && q[1] === e.y) { A.add(20); A.beep(1100, .05, 'triangle'); return false; } return true; });
    if (hasKey && e.x === door[0] && e.y === door[1]) { lvl++; A.add(200); A.beep(880, .3, 'triangle'); gen(); return; }
    if (want && open(e.x + want.x, e.y + want.y)) { e.dx = want.x; e.dy = want.y; } else if (!open(e.x + e.dx, e.y + e.dy)) e.dx = e.dy = 0; }
  function chB(e) { let o = DIRS.filter(d => open(e.x + d.x, e.y + d.y) && !(d.x === -e.dx && d.y === -e.dy && (e.dx || e.dy))); if (!o.length) o = DIRS.filter(d => open(e.x + d.x, e.y + d.y)); const d = o[A.ri(0, o.length - 1)]; e.dx = d.x; e.dy = d.y; }
  function step(e, sp, dt, ch) { if (!e.dx && !e.dy) { ch(e); if (!e.dx && !e.dy) return; } e.p += sp * dt; while (e.p >= 1) { e.p -= 1; e.x += e.dx; e.y += e.dy; const o = e; ch(e); if (o !== pl && e === pl) return; if (!e.dx && !e.dy) { e.p = 0; break; } } }
  gen();
  return {
    key(k) { const w = D[k]; if (!w) return; want = w; if ((pl.dx || pl.dy) && pl.dx === -w.x && pl.dy === -w.y) { pl.x += pl.dx; pl.y += pl.dy; pl.p = 1 - pl.p; pl.dx = w.x; pl.dy = w.y; } },
    update(dt) { tm += dt; if (dead > 0) { dead -= dt; if (dead <= 0) { if (lives <= 0) A.over(); else { pl = { x: 1, y: 1, dx: 0, dy: 0, p: 0 }; want = null; } } return; }
      const p0 = pl; step(pl, 5.5, dt, chP); if (pl !== p0) return;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if ((x - pl.x) ** 2 + (y - pl.y) ** 2 <= 11) seen[y][x] = 1;
      for (const b of bats) { step(b, 2.2 + lvl * .2, dt, chB); const dx = b.x + b.dx * b.p - pl.x - pl.dx * pl.p, dy = b.y + b.dy * b.p - pl.y - pl.dy * pl.p; if (dx * dx + dy * dy < .45) { lives--; dead = 1; A.beep(150, .35, 'sawtooth'); info(); return; } } },
    draw(g) { const K = Art, px = pl.x + pl.dx * pl.p, py = pl.y + pl.dy * pl.p, wl = K.T.stone(64, 64, '#6a4e38'), fl = K.T.stone(64, 64, '#3a2c20'), W = (x, y) => x < 0 || y < 0 || x >= N || y >= N || m[y][x] === 1, f = Math.floor(tm * 8) % 2;
      K.box(g, 0, 0, 240, 240, '#000000'); const dk = (x, y) => Math.max(0, Math.min(.55, (Math.hypot(x - px, y - py) - 2) * .2));
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (!seen[y][x]) continue; const X = x * T, Y = y * T; if (m[y][x]) { g.drawImage(wl, X % 64, Y % 64, T, T, X, Y, T, T); if (!W(x, y - 1)) { K.box(g, X, Y, T, 2, '#9a7a5a'); } if (!W(x, y + 1)) { K.box(g, X, Y + 11, T, 5, '#2a1c12'); K.box(g, X, Y + 10, T, 1, '#1a1008'); } if (!W(x - 1, y)) K.box(g, X, Y, 1, T, '#7a5e44'); if (!W(x + 1, y)) K.box(g, X + 15, Y, 1, T, '#2a1c12'); }
        else { g.drawImage(fl, X % 64, Y % 64, T, T, X, Y, T, T); if (W(x, y - 1)) K.box(g, X, Y, T, 3, 'rgba(0,0,0,.4)'); }
        const a = dk(x, y); if (a > 0) { g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(X, Y, T, T); } }
      const lit = (x, y) => Math.hypot(x - px, y - py) < 3.6, show = c => seen[c[1]][c[0]];
      if (show(door)) K.put(g, K.spr('cvdoor' + (hasKey ? 1 : 0), 12, 14, q => { K.rr(q, -6, -7, 12, 16, 5, hasKey ? '#3fd45a' : '#9a6a34'); K.box(q, -6, -1, 12, 1, '#5c6678'); K.box(q, 2, 1, 2, 3, '#ffd23c'); K.box(q, -4, -5, 2, 10, 'rgba(255,255,255,.25)'); }), door[0] * T + 8, door[1] * T + 8);
      if (key && show(key)) K.put(g, K.key(), key[0] * T + 8, key[1] * T + 8 + (f ? 1 : 0)); for (const q of gems) if (show(q)) K.put(g, K.gem(0, '#5fe3d6', 10), q[0] * T + 8, q[1] * T + 8);
      for (const b of bats) { const x = b.x + b.dx * b.p, y = b.y + b.dy * b.p; if (lit(x, y)) K.put(g, K.bat(f), x * T + 8, y * T + 7); }
      const mn = n => K.spr('cvman' + n, 12, 15, q => { K.box(q, -3, 3, 2, 4 - n, '#5a4a6a'); K.box(q, 1, 3, 2, 3 + n, '#5a4a6a'); K.box(q, -4, -2, 8, 6, K.lin(q, -4, 0, 4, 0, '#8ae06a', '#3fb45a', '#1f6a2a')); K.ell(q, 0, -4, 3.4, 3, '#f0b890'); K.box(q, 0, -5, 1, 1, '#1a1222'); K.box(q, 2, -5, 1, 1, '#1a1222'); K.box(q, -4, -8, 8, 3, '#ffd23c'); K.box(q, 1, -8, 3, 2, '#fff6c8'); });
      if (dead <= 0 || Math.floor(dead * 12) % 2) { g.fillStyle = 'rgba(255,220,140,.10)'; g.beginPath(); g.arc(px * T + 8, py * T + 8, 22, 0, 7); g.fill(); K.put(g, mn(pl.dx || pl.dy ? f : 0), px * T + 8, py * T + 7, pl.dx < 0 ? { flip: 1 } : null); } }
  };
} });
