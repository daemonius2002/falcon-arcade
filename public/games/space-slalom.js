Arcade.game('space-slalom', { w: 240, h: 320, pad: 'lr',
help: 'Fly between the two lights of every gate. Steer with your finger, the mouse or the arrow keys. Missing a gate or hitting a rock costs a life; several gates in a row give bonus points.',
init(A) {
  const SHIP = A.spr(['.....w.....', '....www....', '....wcw....', '...wwcww...', '...wwwww...', '.o.wwwww.o.', '.owwwwwwwo.', 'owwwwwwwwwo', 'ooww.w.wwoo', 'o...w.w...o'], { w: '#f2f5f8', c: '#5fe3d6', o: '#ff9a2a' });
  const stars = []; for (let i = 0; i < 60; i++) stars.push([A.ri(0, 240), A.ri(0, 320), A.ri(1, 3)]);
  let x = 120, sp = 120, s = 0, gates = [], rocks = [], nextG = 200, lives = 3, inv = 0, streak = 0, n = 0, msg = '', mt = 0;
  const info = () => A.info('LIVES ' + lives + '  GATES ' + n);
  info();
  return {
    update(dt) { sp = Math.min(280, sp + 3 * dt); s += sp * dt; inv -= dt; mt -= dt; if (A.keys.left) x -= 170 * dt; if (A.keys.right) x += 170 * dt; if (A.ptr.moved || A.ptr.down) x += Math.max(-230 * dt, Math.min(230 * dt, A.ptr.x - x)); x = Math.max(8, Math.min(232, x));
      nextG -= sp * dt; if (nextG <= 0) { nextG = 150; const w = Math.max(40, 66 - n); gates.push({ x: A.rnd(w / 2 + 10, 230 - w / 2), y: -10, w }); if (n > 3 && Math.random() < .5) rocks.push({ x: A.rnd(10, 230), y: -90, vx: A.rnd(-20, 20), r: A.ri(5, 8) }); }
      for (const q of gates) { const py = q.y; q.y += sp * dt; if (py < 258 && q.y >= 258) { if (Math.abs(x - q.x) < q.w / 2 - 3) { q.ok = 1; n++; streak++; A.add(50 + Math.min(10, streak) * 10); A.beep(700 + Math.min(10, streak) * 40, .07, 'triangle'); msg = streak > 1 ? 'X' + streak : ''; mt = .6; } else { q.bad = 1; streak = 0; lives--; inv = 1; A.beep(140, .3, 'sawtooth'); msg = 'MISS'; mt = .8; if (lives <= 0) { info(); A.over(); return; } } info(); } }
      for (const r of rocks) { r.y += sp * .8 * dt; r.x += r.vx * dt; if (inv <= 0 && (r.x - x) ** 2 + (r.y - 262) ** 2 < (r.r + 6) ** 2) { r.y = 999; streak = 0; lives--; inv = 1.4; A.beep(120, .35, 'sawtooth'); info(); if (lives <= 0) { A.over(); return; } } }
      gates = gates.filter(q => q.y < 340); rocks = rocks.filter(r => r.y < 340); },
    draw(g) { g.fillStyle = '#070a1c'; g.fillRect(0, 0, 240, 320); for (const t of stars) { g.fillStyle = ['', '#56658f', '#9fb4e6', '#ffffff'][t[2]]; g.fillRect(t[0], (t[1] + s * t[2] * .15) % 320, 1, t[2]); }
      for (const q of gates) { const y = Math.round(q.y), c = q.ok ? '#3fd45a' : q.bad ? '#e8231e' : '#ffd23c'; g.fillStyle = 'rgba(95,227,214,.18)'; g.fillRect(q.x - q.w / 2, y - 1, q.w, 2); for (const sx of [-1, 1]) { const X = Math.round(q.x + sx * q.w / 2); g.fillStyle = '#000'; g.fillRect(X - 5, y - 5, 10, 10); g.fillStyle = '#5c6678'; g.fillRect(X - 4, y - 4, 8, 8); g.fillStyle = c; g.fillRect(X - 2, y - 2, 4, 4); g.fillStyle = '#fff'; g.fillRect(X - 2, y - 2, 1, 1); } }
      for (const r of rocks) { const X = Math.round(r.x), Y = Math.round(r.y); g.fillStyle = '#000'; g.fillRect(X - r.r - 1, Y - r.r - 1, r.r * 2 + 2, r.r * 2 + 2); g.fillStyle = '#6a5c50'; g.fillRect(X - r.r, Y - r.r, r.r * 2, r.r * 2); g.fillStyle = '#c4b4a0'; g.fillRect(X - r.r, Y - r.r, r.r, 3); g.fillStyle = '#33291f'; g.fillRect(X + 1, Y + 1, 3, 3); }
      if (inv <= 0 || Math.floor(inv * 10) % 2) { g.drawImage(SHIP, Math.round(x) - 5, 256); g.fillStyle = '#ff8a1e'; g.fillRect(Math.round(x) - 1, 266, 2, 3 + (Math.floor(s / 6) % 2) * 3); }
      if (mt > 0 && msg) A.text(g, msg, 120, 200, msg === 'MISS' ? '#e8231e' : '#5fe3d6', 3, 'center'); }
  };
} });
