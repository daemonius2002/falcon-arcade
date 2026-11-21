Arcade.game('air-hockey', { w: 240, h: 320, arrowsOnly: true,
help: 'Push the puck into the goal at the far end. Bottom player: finger, mouse or the arrow keys. Top player: touch the top half or use W A S D — until someone does, the computer plays. First to 7 goals wins.',
init(A) {
  const R = 12, PR = 7; let m1 = { x: 120, y: 270, vx: 0, vy: 0 }, m2 = { x: 120, y: 50, vx: 0, vy: 0 }, p, s1 = 0, s2 = 0, human = false, wait = 0;
  const info = () => A.info(s2 + ' : ' + s1), cl = (m, top) => { m.x = Math.max(R + 4, Math.min(236 - R, m.x)); m.y = top ? Math.max(R + 4, Math.min(160 - R, m.y)) : Math.max(160 + R, Math.min(316 - R, m.y)); };
  function reset(d) { p = { x: 120, y: 160 + d * 40, vx: 0, vy: 0 }; wait = .7; info(); }
  function mv(m, tx, ty, dt, top, max) { const ox = m.x, oy = m.y; if (max) { const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy), st = max * dt; if (d > st) { m.x += dx / d * st; m.y += dy / d * st; } else { m.x = tx; m.y = ty; } } else { m.x = tx; m.y = ty; } cl(m, top); if (dt > 0) { m.vx = (m.x - ox) / dt; m.vy = (m.y - oy) / dt; } }
  function hit(m) { const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy); if (d >= R + PR || d === 0) return; const nx = dx / d, ny = dy / d, rv = (p.vx - m.vx) * nx + (p.vy - m.vy) * ny; p.x = m.x + nx * (R + PR); p.y = m.y + ny * (R + PR); if (rv < 0) { p.vx -= 1.9 * rv * nx; p.vy -= 1.9 * rv * ny; const sp = Math.hypot(p.vx, p.vy); if (sp > 430) { p.vx *= 430 / sp; p.vy *= 430 / sp; } A.beep(380, .04); } }
  reset(1);
  return {
    update(dt) { const k = A.keys, r = A.raw; let t1 = null, t2 = null; for (const q of A.ptrs) { if (q.y > 160) t1 = q; else { t2 = q; human = true; } } if (!t1 && A.ptr.moved && !A.ptrs.length && A.ptr.y > 160) t1 = A.ptr;
      if (t1) mv(m1, t1.x, t1.y - (A.ptrs.length ? 16 : 0), dt, false); else mv(m1, m1.x + ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 220 * dt, m1.y + ((k.down ? 1 : 0) - (k.up ? 1 : 0)) * 220 * dt, dt, false);
      if (r.w || r.a || r.s || r.d) human = true;
      if (t2) mv(m2, t2.x, t2.y + 16, dt, true); else if (human) mv(m2, m2.x + ((r.d ? 1 : 0) - (r.a ? 1 : 0)) * 220 * dt, m2.y + ((r.s ? 1 : 0) - (r.w ? 1 : 0)) * 220 * dt, dt, true);
      else { const att = p.y < 160 && p.y > m2.y - 4; mv(m2, att ? p.x : 120 + (p.x - 120) * .5, att ? p.y - 4 : 44, dt, true, att ? 150 : 110); }
      if (wait > 0) { wait -= dt; return; }
      for (let i = 0; i < 3; i++) { p.x += p.vx * dt / 3; p.y += p.vy * dt / 3; hit(m1); hit(m2); const goal = p.x > 84 && p.x < 156;
        if (p.x < PR + 4) { p.x = PR + 4; p.vx = Math.abs(p.vx) * .92; } if (p.x > 236 - PR) { p.x = 236 - PR; p.vx = -Math.abs(p.vx) * .92; }
        if (!goal) { if (p.y < PR + 4) { p.y = PR + 4; p.vy = Math.abs(p.vy) * .92; } if (p.y > 316 - PR) { p.y = 316 - PR; p.vy = -Math.abs(p.vy) * .92; } } }
      const f = Math.max(0, 1 - .35 * dt); p.vx *= f; p.vy *= f;
      if (p.y < -PR) { s1++; A.add(100); A.beep(800, .2, 'triangle'); if (s1 >= 7) { info(); A.over(true); return; } reset(-1); } else if (p.y > 320 + PR) { s2++; A.beep(200, .25, 'sawtooth'); if (s2 >= 7) { info(); A.over(false); return; } reset(1); } },
    draw(g) { g.fillStyle = '#d6e6f5'; g.fillRect(0, 0, 240, 320); g.fillStyle = '#c4d8ec'; for (let y = 0; y < 320; y += 16) for (let x = (y / 16 % 2) * 16; x < 240; x += 32) g.fillRect(x, y, 16, 16);
      g.fillStyle = '#e8231e'; g.fillRect(4, 159, 232, 2); g.fillRect(96, 136, 48, 2); g.fillRect(96, 182, 48, 2); g.fillRect(96, 136, 2, 48); g.fillRect(142, 136, 2, 48); g.fillStyle = '#3f6ad0'; g.fillRect(4, 90, 232, 2); g.fillRect(4, 228, 232, 2);
      g.fillStyle = '#12141c'; g.fillRect(0, 0, 240, 4); g.fillRect(0, 316, 240, 4); g.fillRect(0, 0, 4, 320); g.fillRect(236, 0, 4, 320); g.fillStyle = '#ffd23c'; g.fillRect(84, 0, 72, 4); g.fillRect(84, 316, 72, 4);
      A.text(g, s2, 214, 132, 'rgba(18,20,28,.35)', 5, 'center'); A.text(g, s1, 214, 166, 'rgba(18,20,28,.35)', 5, 'center');
      const disc = (o, r, c1, c2) => { const x = Math.round(o.x), y = Math.round(o.y); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - r + 2, y - r + 3, r * 2, r * 2); g.fillStyle = '#000'; g.fillRect(x - r, y - r + 3, r * 2, r * 2 - 6); g.fillRect(x - r + 3, y - r, r * 2 - 6, r * 2); g.fillStyle = c1; g.fillRect(x - r + 1, y - r + 4, r * 2 - 2, r * 2 - 8); g.fillRect(x - r + 4, y - r + 1, r * 2 - 8, r * 2 - 2); g.fillStyle = c2; g.fillRect(x - 3, y - 3, 6, 6); };
      disc(m2, R, '#3f6ad0', '#9fb4e6'); disc(m1, R, '#e8231e', '#ff8a7a'); disc(p, PR, '#12141c', '#59627a'); }
  };
} });
