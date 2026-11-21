Arcade.game('tank-patrol', { w: 240, h: 320, pad: 'dpad', a: 'FIRE',
help: 'Drive with the arrow keys or the buttons, shoot with Space or FIRE. Brown bricks can be shot away, grey steel cannot. Destroy all enemy tanks to reach the next level.',
init(A) {
  const T = 16, GW = 15, GH = 20, DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  let m, pl, en = [], sh = [], fx = [], lives = 3, lvl = 1, left = 0, spawnT = 1, inv = 2;
  const info = () => A.info('LIVES ' + lives + '  LEVEL ' + lvl + '  ENEMIES ' + left);
  function gen() { m = []; for (let y = 0; y < GH; y++) { m.push([]); for (let x = 0; x < GW; x++) m[y].push(y > 1 && y < GH - 2 && Math.random() < .24 ? (Math.random() < .14 ? 2 : 1) : 0); } left = 5 + lvl * 2; en = []; sh = []; pl = { x: 120, y: GH * T - 8, d: 0, cd: 0 }; inv = 2; spawnT = 1; info(); }
  const solid = (x, y) => x < 0 || y < 0 || x >= GW * T || y >= GH * T || m[Math.floor(y / T)][Math.floor(x / T)] > 0;
  const free = (t, x, y) => !solid(x - 6, y - 6) && !solid(x + 5, y - 6) && !solid(x - 6, y + 5) && !solid(x + 5, y + 5) && [pl, ...en].every(o => o === t || Math.abs(o.x - x) >= 13 || Math.abs(o.y - y) >= 13);
  function move(t, d, sp, dt) { if (t.d !== d) { t.d = d; const ox = t.x, oy = t.y; if (d % 2) t.y = Math.round(t.y / 8) * 8; else t.x = Math.round(t.x / 8) * 8; if (!free(t, t.x, t.y)) { t.x = ox; t.y = oy; } }
    const nx = t.x + DX[d] * sp * dt, ny = t.y + DY[d] * sp * dt; if (free(t, nx, ny)) { t.x = nx; t.y = ny; return true; } return false; }
  function shoot(t, own) { if (t.cd > 0) return; t.cd = own ? .45 : A.rnd(1.2, 2.4); sh.push({ x: t.x + DX[t.d] * 8, y: t.y + DY[t.d] * 8, d: t.d, own }); if (own) A.beep(700, .04); }
  const boom = (x, y, c) => { for (let i = 0; i < 10; i++) fx.push({ x, y, vx: A.rnd(-70, 70), vy: A.rnd(-70, 70), l: A.rnd(.2, .5), c }); };
  function tank(g, t, c1, c2) { const x = Math.round(t.x), y = Math.round(t.y), v = t.d % 2 === 0; g.fillStyle = '#000'; g.fillRect(x - 7, y - 7, 14, 14); g.fillStyle = '#2a2a33'; if (v) { g.fillRect(x - 6, y - 6, 3, 12); g.fillRect(x + 3, y - 6, 3, 12); } else { g.fillRect(x - 6, y - 6, 12, 3); g.fillRect(x - 6, y + 3, 12, 3); }
    g.fillStyle = c1; if (v) g.fillRect(x - 3, y - 5, 6, 10); else g.fillRect(x - 5, y - 3, 10, 6); g.fillStyle = c2; g.fillRect(x - 2, y - 2, 4, 4); g.fillRect(x - 1 + DX[t.d] * 4, y - 1 + DY[t.d] * 4, 2 + Math.abs(DX[t.d]) * 3, 2 + Math.abs(DY[t.d]) * 3); if (DX[t.d] < 0) g.fillRect(x - 8, y - 1, 5, 2); if (DY[t.d] < 0) g.fillRect(x - 1, y - 8, 2, 5); }
  gen();
  return {
    key(k) { if (k === 'a') shoot(pl, 1); },
    update(dt) { pl.cd -= dt; inv -= dt; const k = A.keys, d = k.up ? 0 : k.right ? 1 : k.down ? 2 : k.left ? 3 : -1; if (d >= 0) move(pl, d, 56, dt); if (k.a) shoot(pl, 1);
      spawnT -= dt; if (spawnT <= 0 && en.length < 3 && en.length < left) { spawnT = 2; const e = { x: [24, 120, 216][A.ri(0, 2)], y: 8, d: 2, w: 2, cd: 1, t: 1 }; m[0][Math.floor(e.x / T)] = 0; if (free(e, e.x, e.y)) en.push(e); }
      for (const e of en) { e.cd -= dt; e.t -= dt; if (!move(e, e.w, 28 + lvl * 3, dt) || e.t <= 0) { e.w = Math.random() < .4 ? 2 : A.ri(0, 3); e.t = A.rnd(.5, 2); } shoot(e, 0); }
      for (const b of sh) { b.x += DX[b.d] * 150 * dt; b.y += DY[b.d] * 150 * dt; if (b.x < 0 || b.y < 0 || b.x >= GW * T || b.y >= GH * T) { b.dead = 1; continue; }
        const gx = Math.floor(b.x / T), gy = Math.floor(b.y / T); if (m[gy][gx]) { if (m[gy][gx] === 1) { m[gy][gx] = 0; boom(gx * T + 8, gy * T + 8, '#b5522a'); } b.dead = 1; continue; }
        if (b.own) { for (const e of en) if (Math.abs(e.x - b.x) < 7 && Math.abs(e.y - b.y) < 7) { e.dead = b.dead = 1; left--; A.add(100); A.beep(160, .15, 'sawtooth'); boom(e.x, e.y, '#ffd23c'); info(); break; } }
        else if (inv <= 0 && Math.abs(pl.x - b.x) < 7 && Math.abs(pl.y - b.y) < 7) { b.dead = 1; lives--; boom(pl.x, pl.y, '#ffd23c'); A.beep(120, .4, 'sawtooth'); if (lives <= 0) { info(); A.over(); return; } pl.x = 120; pl.y = GH * T - 8; pl.d = 0; inv = 2; info(); } }
      en = en.filter(e => !e.dead); sh = sh.filter(b => !b.dead); for (const p of fx) { p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; } fx = fx.filter(p => p.l > 0);
      if (left <= 0) { lvl++; A.add(300); A.beep(880, .3, 'triangle'); gen(); } },
    draw(g) { g.fillStyle = '#1a1a14'; g.fillRect(0, 0, 240, 320); g.fillStyle = '#22221a'; for (let y = 0; y < GH; y++) for (let x = y % 2; x < GW; x += 2) g.fillRect(x * T, y * T, T, T);
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const v = m[y][x], X = x * T, Y = y * T; if (v === 1) { g.fillStyle = '#b5522a'; g.fillRect(X, Y, T, T); g.fillStyle = '#5a2610'; g.fillRect(X, Y + 7, T, 1); g.fillRect(X, Y + 15, T, 1); g.fillRect(X + 7, Y, 1, 7); g.fillRect(X + 3, Y + 8, 1, 7); g.fillRect(X + 11, Y + 8, 1, 7); g.fillStyle = '#e09a62'; g.fillRect(X, Y, T, 1); }
        else if (v === 2) { g.fillStyle = '#8a94a4'; g.fillRect(X, Y, T, T); g.fillStyle = '#d6dbea'; g.fillRect(X, Y, T, 2); g.fillRect(X, Y, 2, T); g.fillStyle = '#4a5462'; g.fillRect(X, Y + 14, T, 2); g.fillRect(X + 14, Y, 2, T); g.fillRect(X + 6, Y + 6, 4, 4); } }
      for (const e of en) tank(g, e, '#e8231e', '#ff8a7a'); if (inv <= 0 || Math.floor(inv * 10) % 2) tank(g, pl, '#3fd45a', '#c8ffb0');
      for (const b of sh) { g.fillStyle = b.own ? '#ffd23c' : '#ff7a6a'; g.fillRect(b.x - 1, b.y - 1, 3, 3); } for (const p of fx) { g.fillStyle = p.c; g.fillRect(p.x, p.y, 2, 2); } }
  };
} });
