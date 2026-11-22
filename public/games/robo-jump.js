Arcade.game('robo-jump', { w: 180, h: 280, pad: 'lr',
help: 'The robot bounces by itself. Steer it left / right with the arrow keys, the buttons, or by holding your finger on the side you want to go. Brown platforms break, blue ones move, yellow springs shoot you up. Do not fall!',
init(A) {
  const BOT = A.spr(['...yy.....', '..oooooo..', '.obbbbbbo.', 'obwkbbwkbo', 'obbbbbbbbo', 'obbrrrrbbo', '.obbbbbbo.', '.oooooooo.', '.ob....bo.', '.oo....oo.'], { o: '#12101c', b: '#ff9a2a', w: '#ffffff', k: '#12101c', r: '#e8231e', y: '#ffd23c' });
  const pl = { x: 85, y: 220, vx: 0, vy: -330 }; let cam = 0, plats = [{ x: 70, y: 250, t: 0, vx: 0 }], top = 250, best = 0;
  function gen() { while (top > cam - 40) { top -= A.ri(30, Math.min(64, 40 + best / 40)); const k = Math.random(), t = best > 30 && k < .16 ? 2 : best > 15 && k < .34 ? 1 : k > .92 ? 3 : 0; plats.push({ x: A.ri(4, 144), y: top, t, vx: t === 1 ? (Math.random() < .5 ? -40 : 40) : 0 }); } plats = plats.filter(p => p.y < cam + 300 && !p.gone); }
  gen();
  return {
    update(dt) { let d = (A.keys.right ? 1 : 0) - (A.keys.left ? 1 : 0); if (!d && A.ptr.down && Math.abs(A.ptr.x - pl.x - 8) > 6) d = A.ptr.x > pl.x + 8 ? 1 : -1; pl.vx += (d * 130 - pl.vx) * Math.min(1, dt * 12); pl.x = (pl.x + pl.vx * dt + 180) % 180;
      const pb = pl.y + 10; pl.vy += 620 * dt; pl.y += pl.vy * dt;
      for (const p of plats) { if (p.t === 1) { p.x += p.vx * dt; if (p.x < 2 || p.x > 146) p.vx *= -1; }
        if (pl.vy > 0 && !p.gone && pl.x + 14 > p.x && pl.x + 2 < p.x + 32 && pb <= p.y + 2 && pl.y + 10 >= p.y) { pl.y = p.y - 10; pl.vy = p.t === 3 ? -520 : -335; A.beep(p.t === 3 ? 900 : 440, .05); if (p.t === 2) p.gone = 1; } }
      if (pl.y < cam + 120) cam = pl.y - 120; gen(); const h = Math.floor((220 - cam - 120) / 10); if (h > best) { A.add(h - best); best = h; } A.info('HEIGHT ' + best + ' M');
      if (pl.y > cam + 290) { A.beep(150, .3, 'sawtooth'); A.over(); } },
    draw(g) { const K = Art; g.drawImage(K.T.sky(180, 280, ['#1b3f7a', '#3f86d0', '#9fd0f5']), 0, 0);
      for (let i = 0; i < 6; i++) { const y = ((i * 97 - cam * .3) % 340 + 340) % 340 - 30, x = (i * 71) % 150 + 14; K.put(g, K.cloud(i % 2 ? 44 : 30), x, y); }
      const pt = t => K.spr('rjp' + t, 32, t === 3 ? 14 : 8, q => { const c = [['#8ae06a', '#3fb45a', '#8a5a2a'], ['#c8eeff', '#5fb8e8', '#1f5f9a'], ['#e0b070', '#9a6a34', '#5a3418'], ['#8ae06a', '#3fb45a', '#8a5a2a']][t], y = t === 3 ? -1 : -4; K.rr(q, -16, y, 32, 8, 3, c[2]); K.rr(q, -16, y, 32, 5, 2, c[1]); K.box(q, -14, y, 28, 1, c[0]); if (t === 2) { K.box(q, -6, y, 1, 8, '#3a2010'); K.box(q, 5, y, 1, 8, '#3a2010'); } if (t === 3) { K.box(q, -4, -7, 8, 2, '#ffd23c'); K.box(q, -3, -5, 6, 1, '#8a94a4'); K.box(q, -4, -4, 8, 1, '#d6dbea'); K.box(q, -3, -3, 6, 2, '#8a94a4'); } });
      for (const p of plats) { if (p.gone) continue; const y = Math.round(p.y - cam); if (y < -12 || y > 290) continue; K.put(g, pt(p.t), p.x + 16, y + (p.t === 3 ? 0 : 3)); }
      const bot = K.spr('rjbot', 18, 20, q => { K.box(q, -1, -10, 2, 3, '#aab4c2'); K.ell(q, 0, -10, 1.6, 1.6, '#ffd23c'); K.rr(q, -8, -7, 16, 13, 4, K.lin(q, -8, 0, 8, 0, '#ffc070', '#ff9a2a', '#b8520a')); K.rr(q, -6, -5, 12, 6, 2, '#12303a'); K.box(q, -4, -4, 3, 3, '#5fe3d6'); K.box(q, 1, -4, 3, 3, '#5fe3d6'); K.box(q, -4, 3, 8, 1, '#7a2f0a'); K.box(q, -7, 6, 5, 4, '#5c6678'); K.box(q, 2, 6, 5, 4, '#5c6678'); });
      const X = pl.x + 8, Y = pl.y - cam; if (pl.vy < -150) { K.put(g, K.fire(Math.floor(performance.now() / 60) % 2), X - 4, Y + 13, { sc: .6, rot: Math.PI }); K.put(g, K.fire(Math.floor(performance.now() / 70) % 2), X + 4, Y + 13, { sc: .6, rot: Math.PI }); }
      K.put(g, bot, X, Y); if (X > 170) K.put(g, bot, X - 180, Y); if (X < 10) K.put(g, bot, X + 180, Y); }
  };
} });
