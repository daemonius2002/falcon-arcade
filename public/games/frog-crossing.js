Arcade.game('frog-crossing', { w: 160, h: 208, pad: 'dpad',
help: 'Hop with swipes or the arrow keys. Cross the road without touching the cars, ride the logs over the river and fill all 5 lily pads.',
init(A) {
  const FROG = A.spr(['..gg....gg..', '.gwkg..gkwg.', '.gggggggggg.', '..gGGGGGGg..', 'g.gGGGGGGg.g', 'gggGGGGGGggg', '..gGGGGGGg..', '..gGGGGGGg..', '.ggGGGGGGgg.', 'gg.gggggg.gg', 'g..g....g..g', '............'], { g: '#1f7a2a', G: '#6fe85a', w: '#ffffff', k: '#12101c' });
  const SL = [8, 40, 72, 104, 136], CC = ['#e8231e', '#ffd23c', '#3fa8e0', '#f2f5f8'];
  let lanes, frog, lives = 3, lvl = 1, home = [0, 0, 0, 0, 0], best = 12, dead = 0;
  function build() { const s = 1 + (lvl - 1) * .15; lanes = [];
    const mk = (row, type, dir, sp, len, n) => { const span = Math.max(160 + len, n * (len + 28)), o = []; for (let i = 0; i < n; i++) o.push(i * span / n); lanes.push({ row, type, dir, sp: sp * s, len, span, o, col: A.ri(0, 3) }); };
    mk(1, 'log', 1, 22, 48, 3); mk(2, 'log', -1, 30, 64, 2); mk(3, 'log', 1, 38, 40, 3); mk(4, 'log', -1, 24, 48, 3); mk(5, 'log', 1, 32, 64, 2);
    mk(7, 'car', -1, 36, 24, 3); mk(8, 'car', 1, 28, 32, 2); mk(9, 'car', -1, 48, 24, 2); mk(10, 'car', 1, 34, 24, 3); mk(11, 'car', -1, 26, 32, 2); }
  const reset = () => { frog = { x: 72, row: 12 }; best = 12; }, info = () => A.info('LIVES ' + lives + '  LEVEL ' + lvl);
  function die() { if (dead > 0) return; lives--; dead = .8; A.beep(150, .3, 'sawtooth'); info(); }
  build(); reset(); info();
  return {
    key(k) { if (dead > 0) return; if (k === 'left') frog.x = Math.max(0, frog.x - 16); else if (k === 'right') frog.x = Math.min(144, frog.x + 16); else if (k === 'up') frog.row--; else if (k === 'down') frog.row = Math.min(12, frog.row + 1); else return;
      A.beep(500, .03); if (frog.row < best) { best = frog.row; A.add(10); }
      if (frog.row === 0) { const i = SL.findIndex(sx => Math.abs(frog.x - sx) < 9); if (i >= 0 && !home[i]) { home[i] = 1; A.add(50); A.beep(900, .12, 'triangle'); if (home.every(v => v)) { A.add(200); lvl++; home = [0, 0, 0, 0, 0]; build(); info(); } reset(); } else { frog.row = 1; die(); } } },
    update(dt) { for (const l of lanes) for (let i = 0; i < l.o.length; i++) l.o[i] = ((l.o[i] + l.dir * l.sp * dt) % l.span + l.span) % l.span;
      if (dead > 0) { dead -= dt; if (dead <= 0) { if (lives <= 0) A.over(); else reset(); } return; }
      const l = lanes.find(v => v.row === frog.row); if (!l) return;
      if (l.type === 'car') { for (const o of l.o) { const x = o - l.len; if (frog.x + 13 > x && frog.x + 3 < x + l.len) die(); } }
      else { const on = l.o.some(o => { const x = o - l.len; return frog.x + 8 >= x - 2 && frog.x + 8 <= x + l.len + 2; }); if (on) { frog.x += l.dir * l.sp * dt; if (frog.x < -6 || frog.x > 150) die(); } else die(); } },
    draw(g) { g.fillStyle = '#0f3a1f'; g.fillRect(0, 0, 160, 16); g.fillStyle = '#1b5fa8'; g.fillRect(0, 16, 160, 80); g.fillStyle = '#3f86d0'; for (let y = 20; y < 96; y += 8) for (let x = (y % 16) + 2; x < 160; x += 22) g.fillRect(x, y, 6, 1);
      for (const r of [6, 12]) { g.fillStyle = '#5a4a6a'; g.fillRect(0, r * 16, 160, 16); g.fillStyle = '#7a6a8a'; g.fillRect(0, r * 16, 160, 2); g.fillStyle = '#44364f'; for (let x = 6; x < 160; x += 16) g.fillRect(x, r * 16 + 7, 8, 2); }
      g.fillStyle = '#2a2a33'; g.fillRect(0, 112, 160, 80); g.fillStyle = '#6a6a78'; for (let r = 8; r < 12; r++) for (let x = 4; x < 160; x += 20) g.fillRect(x, r * 16 - 1, 10, 2);
      SL.forEach((sx, i) => { g.fillStyle = '#1b5fa8'; g.fillRect(sx - 2, 0, 20, 16); g.fillStyle = '#1f7a2a'; g.fillRect(sx + 1, 2, 14, 12); g.fillStyle = '#3fb45a'; g.fillRect(sx + 2, 3, 12, 10); g.fillStyle = '#1b5fa8'; g.fillRect(sx + 7, 2, 2, 5); if (home[i]) g.drawImage(FROG, sx + 2, 2); });
      for (const l of lanes) { const y = l.row * 16; for (const o of l.o) { const x = Math.round(o - l.len), L = l.len;
        if (l.type === 'log') { g.fillStyle = '#2a1608'; g.fillRect(x, y + 2, L, 12); g.fillStyle = '#6a3e1c'; g.fillRect(x + 1, y + 3, L - 2, 10); g.fillStyle = '#9a6a34'; g.fillRect(x + 1, y + 3, L - 2, 3); g.fillStyle = '#4a2a10'; for (let k = 8; k < L - 6; k += 12) g.fillRect(x + k, y + 8, 5, 1); g.fillStyle = '#d8aa6a'; g.fillRect(x + L - 4, y + 4, 2, 8); }
        else { g.fillStyle = '#000'; g.fillRect(x, y + 2, L, 12); g.fillRect(x + 3, y + 1, 5, 14); g.fillRect(x + L - 8, y + 1, 5, 14); g.fillStyle = CC[l.col]; g.fillRect(x + 1, y + 3, L - 2, 10); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x + 1, y + 3, L - 2, 2);
          if (L > 24) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(l.dir > 0 ? x + 2 : x + 12, y + 4, L - 14, 8); }
          g.fillStyle = '#16223a'; g.fillRect(l.dir > 0 ? x + L - 9 : x + 5, y + 4, 4, 8); g.fillStyle = '#fff6c8'; g.fillRect(l.dir > 0 ? x + L - 2 : x + 1, y + 4, 1, 2); g.fillRect(l.dir > 0 ? x + L - 2 : x + 1, y + 10, 1, 2); } } }
      const fx = Math.round(frog.x) + 2, fy = frog.row * 16 + 2; if (dead > 0) { if (Math.floor(dead * 12) % 2) { g.fillStyle = '#e8231e'; g.fillRect(fx + 1, fy + 1, 10, 10); g.fillStyle = '#fff'; g.fillRect(fx + 3, fy + 5, 6, 2); g.fillRect(fx + 5, fy + 3, 2, 6); } } else g.drawImage(FROG, fx, fy); }
  };
} });
