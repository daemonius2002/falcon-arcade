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
    draw(g) { const K = Art, S = this.S || (this.S = { F: K.fx(), inv: 0 }), t = performance.now(); K.scroll(g, K.T.space(128, 128), 0, -s * .25, 240, 320);
      for (const q of stars) { g.fillStyle = ['', '#56658f', '#9fb4e6', '#ffffff'][q[2]]; g.fillRect(q[0], (q[1] + s * q[2] * .2) % 320, 1, q[2] + (sp > 200 ? 2 : 0)); }
      for (const q of gates) { const y = Math.round(q.y), c = q.ok ? '#3fd45a' : q.bad ? '#e8231e' : '#ffd23c'; for (let x = q.x - q.w / 2 + 6; x < q.x + q.w / 2 - 6; x += 4) K.box(g, Math.round(x), y - ((Math.round(x) + Math.floor(t / 80)) % 2), 2, 2, q.ok ? '#8ff08a' : q.bad ? '#ff8a7a' : '#5fe3d6'); for (const sx of [-1, 1]) K.put(g, K.spr('ssb' + c, 12, 12, o => { K.ell(o, 0, 0, 6, 6, K.lin(o, -6, -6, 6, 6, '#f2f5f8', '#8a94a4', '#3a4152')); K.ell(o, 0, 0, 3, 3, c); K.box(o, -1, -2, 1, 1, '#ffffff'); }), q.x + sx * q.w / 2, y); }
      for (const r of rocks) K.put(g, K.rock(r.r, r.r % 3), r.x, r.y, { rot: Math.round(r.y / 40) / 2 });
      if (inv > S.inv + .5) S.F.boom(x, 258, 1); S.inv = inv;
      if (inv <= 0 || Math.floor(inv * 10) % 2) { K.put(g, K.fire(Math.floor(t / 60) % 2), x, 276, { rot: Math.PI, sc: .7 }); K.put(g, K.ship(0), x, 262); } S.F.draw(g);
      if (mt > 0 && msg) { A.text(g, msg, 122, 202, '#140e1c', 3, 'center'); A.text(g, msg, 120, 200, msg === 'MISS' ? '#ff6a5a' : '#5fe3d6', 3, 'center'); } }
  };
} });
