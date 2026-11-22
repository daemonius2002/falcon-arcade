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
    draw(g) { const K = Art, S = this.S || (this.S = { F: K.fx(), d: 0 }), t = performance.now() / 1000;
      K.scroll(g, K.T.water(64, 64), t * 5, 0, 160, 96); g.drawImage(K.T.grass(160, 16), 0, 0); K.box(g, 0, 15, 160, 1, '#1f5a28');
      SL.forEach((sx, i) => { K.box(g, sx - 2, 0, 20, 16, '#1b6fb0'); K.box(g, sx - 2, 0, 20, 1, '#0f4f8a'); K.put(g, K.lily(), sx + 8, 8); if (home[i]) K.put(g, K.frog(0), sx + 8, 7); });
      for (const r of [6, 12]) { g.drawImage(K.T.stone(160, 16, '#7a6a8a'), 0, r * 16); K.box(g, 0, r * 16, 160, 1, '#b0a0c0'); K.box(g, 0, r * 16 + 15, 160, 1, '#3a2e44'); for (let x = 0; x < 160; x += 16) K.box(g, x, r * 16 + 1, 1, 14, '#5a4a6a'); }
      g.drawImage(K.T.road(160, 80), 0, 112); for (let r = 8; r < 12; r++) for (let x = 4; x < 160; x += 20) K.box(g, x, r * 16 - 1, 10, 2, '#d6dbea'); K.box(g, 0, 112, 160, 1, '#ffd23c'); K.box(g, 0, 191, 160, 1, '#ffd23c');
      for (const l of lanes) { const y = l.row * 16; for (const o of l.o) { const x = Math.round(o - l.len), L = l.len; if (l.type === 'log') { K.box(g, x + 2, y + 5, L, 10, 'rgba(8,30,70,.45)'); K.put(g, K.log(L), x + L / 2, y + 8, l.dir < 0 ? { flip: 1 } : null); } else { K.box(g, x + 2, y + 5, L, 10, 'rgba(0,0,0,.3)'); K.put(g, K.car(CC[l.col], L), x + L / 2, y + 8, { rot: l.dir > 0 ? Math.PI / 2 : -Math.PI / 2 }); } } }
      const fx = Math.round(frog.x) + 8, fy = frog.row * 16 + 8; if (dead > 0 && !S.d) S.F.spark(fx, fy, ['#e8231e', '#ffffff', '#6fe85a'], 14, 90); S.d = dead > 0;
      if (dead <= 0) { K.shadow(g, fx, fy + 5, 5, 2); K.put(g, K.frog(Math.floor(t * 3) % 2), fx, fy); } S.F.draw(g); }
  };
} });
