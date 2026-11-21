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
    draw(g) { ['#0a0c24', '#12143a', '#1c1a4a', '#2a1f5a'].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 70, 240, 80); }); g.fillStyle = '#d6dbea'; for (const s of stars) g.fillRect(s[0], s[1], 1, 1); g.fillStyle = '#f2efe6'; g.fillRect(190, 30, 14, 14); g.fillStyle = '#12143a'; g.fillRect(186, 28, 10, 12);
      g.fillStyle = '#1b1e29'; g.fillRect(0, 296, 240, 24); g.fillStyle = '#3a4152'; g.fillRect(0, 296, 240, 2);
      BX.forEach((x, i) => { if (!city[i]) { g.fillStyle = '#2a2f3d'; g.fillRect(x + 2, 290, 20, 6); g.fillRect(x + 6, 286, 6, 4); return; } const h = 22 + (i * 7) % 16; g.fillStyle = '#000'; g.fillRect(x - 1, 295 - h, 26, h + 1); g.fillStyle = '#4a52a0'; g.fillRect(x, 296 - h, 24, h); g.fillStyle = '#7a84d0'; g.fillRect(x, 296 - h, 24, 2); g.fillStyle = '#ffd98a'; for (let yy = 300 - h; yy < 292; yy += 6) for (let xx = x + 3; xx < x + 22; xx += 6) if ((xx + yy + i) % 5) g.fillRect(xx, yy, 3, 3); });
      g.fillStyle = '#aab4c2'; for (let i = 2; i < 7; i++) g.fillRect(Math.round(TX + Math.cos(ang) * i * 3) - 2, Math.round(TY + Math.sin(ang) * i * 3) - 2, 4, 4); g.fillStyle = '#000'; g.fillRect(TX - 11, TY - 7, 22, 12); g.fillStyle = '#5c6678'; g.fillRect(TX - 10, TY - 6, 20, 10); g.fillStyle = '#e8231e'; g.fillRect(TX - 4, TY - 4, 8, 6);
      for (const e of en) { const x = Math.round(e.x), y = Math.round(e.y); g.fillStyle = '#000'; g.fillRect(x - 4, y - 5, 8, 10); g.fillStyle = '#e8231e'; g.fillRect(x - 3, y - 4, 6, 8); g.fillStyle = '#ff8a7a'; g.fillRect(x - 3, y - 4, 2, 4); g.fillStyle = '#ffd23c'; g.fillRect(x - 1, y + 3, 2, 2); }
      g.fillStyle = '#ffd23c'; for (const b of sh) g.fillRect(b.x - 1, b.y - 1, 3, 3); for (const p of fx) { g.fillStyle = p.c; g.fillRect(p.x, p.y, 2, 2); } }
  };
} });
