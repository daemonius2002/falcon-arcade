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
    draw(g) { const K = Art, S = this.S || (this.S = { F: K.fx(), a: 0, b: 0 }); g.drawImage(K.tex('ahice', 240, 320, { base: '#d6e6f5', blobs: [['#ffffff', .7, 14, 30, 80], ['#a8c8e8', .5, 12, 30, 80]], L: 12, specks: [['#ffffff', 80, 3, 1], ['#b8d0e8', 60, 2, 1]] }), 0, 0);
      K.box(g, 4, 159, 232, 3, '#e8231e'); K.box(g, 4, 90, 232, 2, '#3f6ad0'); K.box(g, 4, 228, 232, 2, '#3f6ad0'); g.strokeStyle = '#e8231e'; g.lineWidth = 2; g.beginPath(); g.arc(120, 160, 26, 0, 7); g.stroke(); K.put(g, K.ball(3, '#e8231e'), 120, 160);
      for (const y of [4, 316]) { g.strokeStyle = '#3f6ad0'; g.beginPath(); g.arc(120, y, 40, 0, 7); g.stroke(); }
      for (const [a, b, c, d] of [[0, 0, 240, 5], [0, 315, 240, 5], [0, 0, 5, 320], [235, 0, 5, 320]]) { K.box(g, a, b, c, d, '#140e1c'); K.box(g, a + 1, b + 1, Math.max(1, c - 2), Math.max(1, d - 2), '#5c6678'); } K.box(g, 1, 1, 238, 1, '#aab4c2'); K.box(g, 1, 1, 1, 318, '#aab4c2');
      K.box(g, 84, 0, 72, 5, '#140e1c'); K.box(g, 85, 0, 70, 4, '#ffd23c'); K.box(g, 84, 315, 72, 5, '#140e1c'); K.box(g, 85, 316, 70, 4, '#ffd23c');
      A.text(g, s2, 214, 132, 'rgba(18,20,28,.3)', 5, 'center'); A.text(g, s1, 214, 166, 'rgba(18,20,28,.3)', 5, 'center');
      if (s1 > S.a) S.F.spark(120, 8, ['#ffd23c', '#ffffff', '#e8231e'], 26, 130); if (s2 > S.b) S.F.spark(120, 312, ['#ffd23c', '#ffffff', '#3f6ad0'], 26, 130); S.a = s1; S.b = s2;
      for (const [o, r, c, kn] of [[m2, R, '#3f6ad0', 1], [m1, R, '#e8231e', 1], [p, PR, '#2a2f3d', 0]]) { K.shadow(g, o.x + 2, o.y + 3, r, r - 2); K.put(g, K.disc(r, c, kn), o.x, o.y); } S.F.draw(g); }
  };
} });
