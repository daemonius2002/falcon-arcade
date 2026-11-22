Arcade.game('sky-defender', { w: 240, h: 320, pad: 'lr', a: 'FIRE',
help: 'Bombs fall on your six towers. Point with the mouse or your finger and hold to fire the cannon (or turn it with left / right and fire with Space). The game ends when every tower is gone.',
init(A) {
  const BX = [8, 40, 72, 144, 176, 208], TX = 120, TY = 292;
  let ang = -Math.PI / 2, sh = [], en = [], fx = [], cd = 0, lvl = 1, spawn = 1.2, city = [1, 1, 1, 1, 1, 1], kills = 0;
  const stars = []; for (let i = 0; i < 40; i++) stars.push([A.ri(0, 240), A.ri(0, 250)]);
  const info = () => A.info('TOWERS ' + city.filter(v => v).length + '  WAVE ' + lvl), boom = (x, y, n, c) => { for (let i = 0; i < n; i++) fx.push({ x, y, vx: A.rnd(-80, 80), vy: A.rnd(-90, 30), l: A.rnd(.2, .6), c }); };
  info();
  return {
    update(dt) { cd -= dt; if (A.ptr.moved || A.ptr.down) ang = Math.atan2(A.ptr.y - TY, A.ptr.x - TX); if (A.keys.left) ang -= 2.2 * dt; if (A.keys.right) ang += 2.2 * dt; ang = Math.max(-Math.PI + .15, Math.min(-.15, ang > 0 ? (ang > Math.PI / 2 ? -Math.PI : 0) : ang));
      if ((A.ptr.down || A.keys.a) && cd <= 0) { cd = .17; sh.push({ x: TX + Math.cos(ang) * 16, y: TY + Math.sin(ang) * 16, vx: Math.cos(ang) * 270, vy: Math.sin(ang) * 270 }); A.beep(800, .03); }
      spawn -= dt; if (spawn <= 0) { spawn = Math.max(.35, 1.5 - lvl * .1) * A.rnd(.7, 1.3); const x = A.rnd(10, 230), tx = BX[A.ri(0, 5)] + 12, v = 26 + lvl * 5, d = Math.hypot(tx - x, 280); en.push({ x, y: -6, vx: (tx - x) / d * v, vy: 280 / d * v }); }
      for (const b of sh) { b.x += b.vx * dt; b.y += b.vy * dt; if (b.y < -5 || b.x < -5 || b.x > 245) b.dead = 1; }
      for (const e of en) { e.x += e.vx * dt; e.y += e.vy * dt; if (Math.random() < .3) fx.push({ x: e.x, y: e.y - 4, vx: 0, vy: -10, l: .3, c: '#8a94a4' });
        for (const b of sh) if (!b.dead && (b.x - e.x) ** 2 + (b.y - e.y) ** 2 < 64) { b.dead = e.dead = 1; A.add(10 * lvl); A.beep(220, .08, 'sawtooth'); boom(e.x, e.y, 10, '#ffd23c'); if (++kills % 12 === 0) { lvl++; info(); } break; }
        if (!e.dead && e.y >= 276) { e.dead = 1; boom(e.x, 280, 16, '#ff8a1e'); A.beep(110, .3, 'sawtooth'); let bi = -1, bd = 30; BX.forEach((x, i) => { const dd = Math.abs(x + 12 - e.x); if (city[i] && dd < bd) { bd = dd; bi = i; } }); if (bi >= 0) { city[bi] = 0; info(); if (!city.some(v => v)) { A.over(); return; } } } }
      en = en.filter(e => !e.dead); sh = sh.filter(b => !b.dead); for (const p of fx) { p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; } fx = fx.filter(p => p.l > 0); },
    draw(g) { const K = Art, S = this.S || (this.S = { F: K.fx() }); g.drawImage(K.T.sky(240, 320, ['#0a0c24', '#1c1a4a', '#4a2a6a', '#9a4a5a']), 0, 0);
      for (const q of stars) K.box(g, q[0], q[1], 1, 1, q[0] % 3 ? '#d6dbea' : '#ffffff'); K.put(g, K.ball(9, '#f2efe6'), 196, 40); K.box(g, 190, 36, 3, 3, '#c8c4b8'); K.box(g, 199, 43, 2, 2, '#c8c4b8');
      for (let i = 0; i < 9; i++) { const h = 20 + (i * 37) % 30; K.box(g, i * 28 - 6, 296 - h, 24, h, '#1c1640'); K.box(g, i * 28 + 2, 290 - h, 8, 6, '#1c1640'); }
      K.box(g, 0, 296, 240, 24, '#12141c'); K.box(g, 0, 296, 240, 2, '#59627a'); K.box(g, 0, 298, 240, 1, '#2a2f3d');
      BX.forEach((x, i) => { if (!city[i]) { K.put(g, K.rock(7, i % 3, '#4a5462'), x + 12, 292); K.put(g, K.rock(4, (i + 1) % 3, '#4a5462'), x + 4, 294); return; } const h = 22 + (i * 7) % 16; K.put(g, K.building(24, h, i), x + 12, 296 - h / 2 - 3); });
      for (const e of K.gone(S, 'en', en)) S.F.boom(e.x, e.y, 0);
      const gun = K.spr('sdgun', 18, 6, q => { K.box(q, -9, -3, 18, 6, K.lin(q, 0, -3, 0, 3, '#f2f5f8', '#aab4c2', '#4a5462')); K.box(q, 6, -3, 3, 6, '#e8231e'); }); K.put(g, gun, TX + Math.cos(ang) * 9, TY + Math.sin(ang) * 9, { rot: ang });
      K.put(g, K.spr('sdbase', 26, 14, q => { K.part(q, [-13, 7, -9, -3, 9, -3, 13, 7], K.lin(q, -13, 0, 13, 0, '#aab4c2', '#5c6678', '#2a2f3d')); K.ell(q, 0, -3, 6, 5, K.lin(q, -6, 0, 6, 0, '#ff8a7a', '#e8231e', '#7a1410')); }), TX, TY);
      for (const e of en) K.put(g, K.bomb(), e.x, e.y, { rot: Math.atan2(e.vy, e.vx) - Math.PI / 2 });
      for (const b of sh) { K.box(g, Math.round(b.x) - 2, Math.round(b.y) - 2, 5, 5, '#c8501e'); K.box(g, Math.round(b.x) - 1, Math.round(b.y) - 1, 3, 3, '#fff6c8'); } for (const p of fx) K.box(g, Math.round(p.x), Math.round(p.y), 2, 2, p.c); S.F.draw(g); }
  };
} });
