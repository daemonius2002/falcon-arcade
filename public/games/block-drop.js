Arcade.game('block-drop', { w: 180, h: 216, pad: 'dpad', a: 'DROP',
help: 'Left and right move the block, up (or a tap) turns it, down makes it fall faster, Space or DROP drops it at once. Fill a whole row to clear it.',
init(A) {
  const SH = [[[-1, 0], [0, 0], [1, 0], [2, 0]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[-1, 0], [0, 0], [1, 0], [0, 1]], [[0, 0], [1, 0], [-1, 1], [0, 1]], [[-1, 0], [0, 0], [0, 1], [1, 1]], [[-1, 0], [0, 0], [1, 0], [-1, 1]], [[-1, 0], [0, 0], [1, 0], [1, 1]]];
  const COL = ['#3fd0e0', '#ffd23c', '#b06ae0', '#3fd45a', '#e8231e', '#ff8a1e', '#3f6ad0'], row = () => new Array(10).fill(-1);
  let f = [], cur = null, nx = A.ri(0, 6), t = 0, lines = 0, lvl = 1, hold = 0; for (let y = 0; y < 18; y++) f.push(row());
  const fits = (c, x, y) => c.every(p => { const X = x + p[0], Y = y + p[1]; return X >= 0 && X < 10 && Y < 18 && (Y < 0 || f[Y][X] < 0); });
  const info = () => A.info('LINES ' + lines + '  LEVEL ' + lvl);
  function spawn() { cur = { t: nx, c: SH[nx].map(p => p.slice()), x: 4, y: 0 }; nx = A.ri(0, 6); if (!fits(cur.c, cur.x, cur.y)) { cur = null; A.over(); } }
  function lock() { for (const p of cur.c) { const Y = cur.y + p[1]; if (Y >= 0) f[Y][cur.x + p[0]] = cur.t; } let n = 0;
    for (let y = 17; y >= 0; y--) if (f[y].every(v => v >= 0)) { f.splice(y, 1); f.unshift(row()); n++; y++; }
    if (n) { lines += n; A.add([0, 100, 300, 500, 800][n] * lvl); lvl = 1 + Math.floor(lines / 8); A.beep(880, .15, 'triangle'); } else A.beep(200, .04); info(); spawn(); }
  const mv = dx => { if (cur && fits(cur.c, cur.x + dx, cur.y)) cur.x += dx; };
  function rot() { if (!cur || cur.t === 1) return; const c = cur.c.map(p => [-p[1], p[0]]); for (const dx of [0, -1, 1, -2, 2]) if (fits(c, cur.x + dx, cur.y)) { cur.c = c; cur.x += dx; A.beep(600, .03); return; } }
  function down() { if (!cur) return false; if (fits(cur.c, cur.x, cur.y + 1)) { cur.y++; return true; } lock(); return false; }
  const cell = (g, x, y, c, s) => { g.fillStyle = '#000'; g.fillRect(x, y, s, s); g.fillStyle = c; g.fillRect(x + 1, y + 1, s - 2, s - 2); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x + 1, y + 1, s - 2, 2); g.fillRect(x + 1, y + 1, 2, s - 2); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x + 1, y + s - 3, s - 2, 2); g.fillRect(x + s - 3, y + 1, 2, s - 2); };
  spawn(); info();
  return {
    key(k) { hold = 0; if (k === 'left') mv(-1); else if (k === 'right') mv(1); else if (k === 'up') rot(); else if (k === 'down') { down(); t = 0; } else if (k === 'a') { while (down()); t = 0; } }, tap() { rot(); },
    update(dt) { if (!cur) return; if (A.keys.left || A.keys.right) { hold += dt; if (hold > .2) { hold -= .07; mv(A.keys.left ? -1 : 1); } }
      t += dt; const iv = A.keys.down ? .04 : Math.max(.08, .62 - lvl * .05); if (t >= iv) { t = 0; down(); } },
    draw(g) { const K = Art; K.scroll(g, K.T.brick(64, 64, '#231d3a'), 0, 0, 120, 216); g.fillStyle = 'rgba(6,4,14,.6)'; g.fillRect(0, 0, 120, 216); g.fillStyle = 'rgba(255,255,255,.045)'; for (let x = 1; x < 10; x++) g.fillRect(x * 12, 0, 1, 216); for (let y = 1; y < 18; y++) g.fillRect(0, y * 12, 120, 1);
      for (let y = 0; y < 18; y++) for (let x = 0; x < 10; x++) if (f[y][x] >= 0) g.drawImage(K.block(12, 12, COL[f[y][x]]), x * 12, y * 12);
      if (cur) { let gy = cur.y; while (fits(cur.c, cur.x, gy + 1)) gy++; g.fillStyle = 'rgba(255,255,255,.22)'; for (const p of cur.c) { const X = (cur.x + p[0]) * 12, Y = (gy + p[1]) * 12; if (Y >= 0) { g.fillRect(X, Y, 12, 1); g.fillRect(X, Y + 11, 12, 1); g.fillRect(X, Y, 1, 12); g.fillRect(X + 11, Y, 1, 12); } }
        for (const p of cur.c) if (cur.y + p[1] >= 0) g.drawImage(K.block(12, 12, COL[cur.t]), (cur.x + p[0]) * 12, (cur.y + p[1]) * 12); }
      g.drawImage(K.T.panel(60, 216, '#262a40'), 120, 0); K.box(g, 120, 0, 2, 216, '#59627a'); K.box(g, 122, 0, 1, 216, '#12141c');
      A.text(g, 'NEXT', 151, 10, '#b9bfd0', 2, 'center'); K.box(g, 127, 25, 48, 32, '#59627a'); K.box(g, 128, 26, 46, 30, '#0e0c18'); for (const p of SH[nx]) g.drawImage(K.block(10, 10, COL[nx]), 144 + p[0] * 10 - (nx ? 0 : 5), 31 + p[1] * 10 + (nx ? 0 : 5));
      A.text(g, 'LINES', 151, 74, '#b9bfd0', 2, 'center'); A.text(g, lines, 152, 91, '#000000', 3, 'center'); A.text(g, lines, 151, 90, '#ffd23c', 3, 'center'); A.text(g, 'LEVEL', 151, 122, '#b9bfd0', 2, 'center'); A.text(g, lvl, 152, 139, '#000000', 3, 'center'); A.text(g, lvl, 151, 138, '#5fe3d6', 3, 'center'); }
  };
} });
