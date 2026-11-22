Arcade.game('brick-breaker', { w: 240, h: 320, pad: 'lr',
help: 'Move the paddle with your finger, the mouse or the arrow keys. Tap or press Space to launch the ball. Break every brick — you have 3 balls.',
init(A) {
  const COL = ['#e8231e', '#ff8a1e', '#ffd23c', '#3fd45a', '#3fa8e0', '#b06ae0'], pw = 46;
  let px = 120, lives = 3, lvl = 1, bricks = [], b, stuck = true, wait = 0, sp = 0;
  function wave() { bricks = []; for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) bricks.push({ x: 8 + c * 28, y: 34 + r * 14, c: r }); }
  function serve() { b = { x: px, y: 296, vx: 0, vy: 0 }; stuck = true; wait = 1.6; A.info('BALLS ' + lives + '  LEVEL ' + lvl); }
  function launch() { if (!stuck) return; stuck = false; sp = 150 + lvl * 14; const a = A.rnd(-.6, .6); b.vx = sp * Math.sin(a); b.vy = -sp * Math.cos(a); A.beep(520, .06); }
  wave(); serve();
  return {
    key(k) { if (k === 'a') launch(); }, tap() { launch(); },
    update(dt) { if (A.keys.left) px -= 230 * dt; if (A.keys.right) px += 230 * dt; if (A.ptr.moved) px = A.ptr.x; px = Math.max(pw / 2, Math.min(240 - pw / 2, px));
      if (stuck) { b.x = px; b.y = 296; wait -= dt; if (wait <= 0) launch(); return; }
      for (let i = 0; i < 2; i++) { const oy = b.y; b.x += b.vx * dt / 2; b.y += b.vy * dt / 2;
        if (b.x < 3) { b.x = 3; b.vx = Math.abs(b.vx); } if (b.x > 237) { b.x = 237; b.vx = -Math.abs(b.vx); } if (b.y < 3) { b.y = 3; b.vy = Math.abs(b.vy); }
        if (b.vy > 0 && b.y >= 299 && oy <= 305 && Math.abs(b.x - px) < pw / 2 + 3) { const a = (b.x - px) / (pw / 2) * 1.05; b.vx = sp * Math.sin(a); b.vy = -sp * Math.cos(a); b.y = 298; A.beep(330, .05); }
        for (const k of bricks) if (b.x > k.x - 3 && b.x < k.x + 29 && b.y > k.y - 3 && b.y < k.y + 15) { bricks.splice(bricks.indexOf(k), 1); if (oy <= k.y - 3 || oy >= k.y + 15) b.vy = -b.vy; else b.vx = -b.vx; A.add(10 * lvl); A.beep(660 + k.c * 40, .05); sp = Math.min(330, sp + 1.5); break; } }
      if (b.y > 326) { lives--; A.beep(140, .3, 'sawtooth'); if (lives <= 0) { A.info('BALLS 0  LEVEL ' + lvl); A.over(); } else serve(); }
      else if (!bricks.length) { lvl++; A.add(100); wave(); serve(); } },
    draw(g) { const K = Art, S = this.S || (this.S = { F: K.fx(), tr: [] });
      K.scroll(g, K.T.brick(64, 64, '#2a2244'), 0, 0, 240, 320); g.fillStyle = 'rgba(8,4,20,.18)'; g.fillRect(0, 0, 240, 320); K.box(g, 0, 0, 240, 2, '#59627a'); K.box(g, 0, 0, 2, 320, '#59627a'); K.box(g, 238, 0, 2, 320, '#59627a');
      for (const k of K.gone(S, 'bk', bricks)) S.F.spark(k.x + 13, k.y + 6, [COL[k.c], '#ffffff'], 10, 100);
      for (const k of bricks) { g.fillStyle = 'rgba(0,0,0,.32)'; g.fillRect(k.x + 2, k.y + 3, 26, 12); g.drawImage(K.block(26, 12, COL[k.c]), k.x, k.y); }
      K.shadow(g, px, 312, pw / 2, 2); K.put(g, K.paddle(pw, '#e8231e'), px, 305);
      S.tr.push([b.x, b.y]); if (S.tr.length > 7) S.tr.shift(); S.tr.forEach((q, i) => { g.fillStyle = `rgba(255,210,60,${i / 16})`; g.fillRect(Math.round(q[0]) - 2, Math.round(q[1]) - 2, 4, 4); });
      K.put(g, K.ball(4, '#f2f5f8'), b.x, b.y); S.F.draw(g); }
  };
} });
