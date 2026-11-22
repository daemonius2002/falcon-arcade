Arcade.game('gem-match', { w: 168, h: 192,
help: 'Swipe a gem towards its neighbour (or tap one gem, then the one next to it) to swap them. Line up 3 or more of the same kind. You have 30 moves — chains score more.',
init(A) {
  const C = 7, RW = 8, T = 24, COLS = ['#e8231e', '#ffd23c', '#3fd45a', '#3fa8e0', '#b06ae0', '#ff8a1e'], GEM = COLS.map((c, i) => A.shape(i, c, 20));
  let b = [], sel = -1, moves = 30, st = 'idle', t = 0, chain = 0, hit = [];
  const at = (x, y) => x < 0 || y < 0 || x >= C || y >= RW ? -9 : b[y * C + x];
  for (let i = 0; i < C * RW; i++) { let v; do { v = A.ri(0, 5); } while ((i % C > 1 && b[i - 1] === v && b[i - 2] === v) || (i >= 2 * C && b[i - C] === v && b[i - 2 * C] === v)); b.push(v); }
  function find() { const m = new Set(); for (let y = 0; y < RW; y++) for (let x = 0; x < C; x++) { const v = at(x, y); if (v < 0) continue;
    if (at(x + 1, y) === v && at(x + 2, y) === v) { m.add(y * C + x); m.add(y * C + x + 1); m.add(y * C + x + 2); } if (at(x, y + 1) === v && at(x, y + 2) === v) { m.add(y * C + x); m.add(y * C + x + C); m.add(y * C + x + 2 * C); } } return [...m]; }
  const swap = (a, c) => { const q = b[a]; b[a] = b[c]; b[c] = q; };
  const nb = (i, d) => { const x = i % C + (d === 'left' ? -1 : d === 'right' ? 1 : 0), y = Math.floor(i / C) + (d === 'up' ? -1 : d === 'down' ? 1 : 0); return x < 0 || y < 0 || x >= C || y >= RW ? -1 : y * C + x; };
  function hasMove() { for (let i = 0; i < b.length; i++) for (const d of ['right', 'down']) { const j = nb(i, d); if (j < 0) continue; swap(i, j); const n = find().length; swap(i, j); if (n) return true; } return false; }
  function shuffle() { for (let k = 0; k < 60; k++) { for (let i = b.length - 1; i > 0; i--) swap(i, A.ri(0, i)); if (!find().length && hasMove()) return; } }
  const info = () => A.info('MOVES ' + moves);
  function tryS(a, c) { if (st !== 'idle' || a < 0 || c < 0) return; swap(a, c); sel = -1; if (find().length) { moves--; chain = 0; st = 'clear'; t = 0; hit = []; info(); } else { swap(a, c); A.beep(150, .1); } }
  const cellAt = (x, y) => { const cx = Math.floor(x / T), cy = Math.floor(y / T); return cx < 0 || cy < 0 || cx >= C || cy >= RW ? -1 : cy * C + cx; };
  if (!hasMove()) shuffle(); info();
  return {
    tap(x, y) { if (st !== 'idle') return; const i = cellAt(x, y); if (i < 0) return; if (sel >= 0 && ['left', 'right', 'up', 'down'].some(d => nb(sel, d) === i)) tryS(sel, i); else { sel = i; A.beep(600, .03); } },
    swipe(d, x0, y0) { const i = cellAt(x0, y0); if (i >= 0) tryS(i, nb(i, d)); },
    update(dt) { if (st === 'idle') return; t += dt;
      if (st === 'clear') { if (!hit.length) { hit = find(); if (!hit.length) { st = 'idle'; if (moves <= 0) A.over(); else if (!hasMove()) shuffle(); return; } chain++; A.add(hit.length * 10 * chain); A.beep(440 + chain * 120, .08, 'triangle'); }
        if (t > .24) { hit.forEach(i => { b[i] = -1; }); hit = []; st = 'fall'; t = 0; } }
      else if (t > .12) { for (let x = 0; x < C; x++) { const col = []; for (let y = RW - 1; y >= 0; y--) if (b[y * C + x] >= 0) col.push(b[y * C + x]); for (let y = RW - 1, k = 0; y >= 0; y--, k++) b[y * C + x] = k < col.length ? col[k] : A.ri(0, 5); } st = 'clear'; t = 0; } },
    draw(g) { const K = Art, S = this.S || (this.S = { F: K.fx(), h: 0 }), GC = ['#e8231e', '#ffd23c', '#3fd45a', '#3fa8e0', '#b06ae0', '#ff8a1e'], now = performance.now();
      K.scroll(g, K.T.panel(64, 64, '#2a2458'), 0, 0, 168, 192);
      if (hit.length && !S.h) hit.forEach(i => S.F.spark((i % C) * T + 12, Math.floor(i / C) * T + 12, [GC[b[i]] || '#ffffff', '#ffffff'], 6, 70)); S.h = hit.length;
      for (let y = 0; y < RW; y++) for (let x = 0; x < C; x++) { const i = y * C + x, X = x * T, Y = y * T; K.box(g, X + 1, Y + 1, 22, 22, 'rgba(0,0,0,.3)'); K.box(g, X + 1, Y + 22, 22, 1, 'rgba(255,255,255,.07)'); K.box(g, X + 22, Y + 1, 1, 22, 'rgba(255,255,255,.07)');
        if (hit.includes(i)) { if (Math.floor(t * 24) % 2) K.put(g, K.star2('#ffffff', 20), X + 12, Y + 12); } else if (b[i] >= 0) K.put(g, K.gem(b[i], GC[b[i]], 20), X + 12, Y + 12 + (i === sel ? Math.round(Math.sin(now / 90) * 1.5) : 0));
        if (i === sel) for (const [a, c] of [[0, 0], [18, 0], [0, 18], [18, 18]]) { K.box(g, X + a, Y + c + (c ? 4 : 0), 6, 2, '#ffffff'); K.box(g, X + a + (a ? 4 : 0), Y + c, 2, 6, '#ffffff'); } }
      S.F.draw(g); }
  };
} });
