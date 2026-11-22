Arcade.game('turbo-road', { w: 240, h: 320, pad: 'lr',
help: 'Steer with your finger, the mouse or the arrow keys and overtake the traffic. The road gets faster and faster. You can crash 3 times.',
init(A) {
  const CC = ['#3fa8e0', '#ffd23c', '#f2f5f8', '#b06ae0', '#3fd45a'];
  let x = 140, sp = 150, dist = 0, cars = [], next = 0, lives = 3, inv = 0, far = 0;
  function car(g, cx, cy, c, me) { const X = Math.round(cx) - 8, Y = Math.round(cy) - 13; g.fillStyle = '#000'; g.fillRect(X, Y, 16, 26); g.fillRect(X - 1, Y + 3, 18, 6); g.fillRect(X - 1, Y + 17, 18, 6); g.fillStyle = c; g.fillRect(X + 1, Y + 1, 14, 24); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(X + 1, Y + 1, 3, 24); g.fillStyle = '#16223a'; g.fillRect(X + 3, Y + (me ? 6 : 15), 10, 5); g.fillRect(X + 3, Y + (me ? 17 : 4), 10, 3); g.fillStyle = me ? '#e8231e' : '#fff6c8'; g.fillRect(X + 2, Y + 23, 3, 2); g.fillRect(X + 11, Y + 23, 3, 2); }
  return {
    update(dt) { sp = Math.min(340, sp + 4 * dt); dist += sp * dt; inv -= dt; if (A.keys.left) x -= 160 * dt; if (A.keys.right) x += 160 * dt; if (A.ptr.moved || A.ptr.down) x += Math.max(-220 * dt, Math.min(220 * dt, A.ptr.x - x)); x = Math.max(50, Math.min(190, x));
      next -= sp * dt; if (next <= 0) { next = A.rnd(70, 130); cars.push({ x: 60 + A.ri(0, 3) * 40, y: -20, v: A.rnd(.35, .6), c: CC[A.ri(0, 4)] }); }
      for (const c of cars) { c.y += sp * (1 - c.v) * dt; if (inv <= 0 && Math.abs(c.x - x) < 14 && Math.abs(c.y - 262) < 24) { lives--; inv = 1.6; sp = 150; cars = cars.filter(o => o.y < 120); A.beep(130, .35, 'sawtooth'); if (lives <= 0) { A.info('LIVES 0'); A.over(); return; } break; } }
      cars = cars.filter(c => c.y < 350); const d = Math.floor(dist / 30); if (d > far) { A.add(d - far); far = d; } A.info('LIVES ' + lives + '  SPEED ' + Math.round(sp / 2) + ' KM/H'); },
    draw(g) { const K = Art, S = this.S || (this.S = { F: K.fx(), inv: 0 }); K.scroll(g, K.T.grass(64, 64), 0, -dist, 240, 320);
      g.save(); g.beginPath(); g.rect(40, 0, 160, 320); g.clip(); K.scroll(g, K.T.road(64, 64), 0, -dist, 240, 320); g.restore();
      const o = Math.round(dist) % 40; for (let y = -40 + o; y < 320; y += 20) { const c = (Math.floor((y - o) / 20) % 2) ? '#e8231e' : '#f2f5f8'; K.box(g, 35, y, 5, 20, c); K.box(g, 200, y, 5, 20, c); K.box(g, 34, y, 1, 20, '#140e1c'); K.box(g, 205, y, 1, 20, '#140e1c'); }
      K.box(g, 42, 0, 2, 320, '#d6dbea'); K.box(g, 196, 0, 2, 320, '#d6dbea'); for (let y = -40 + o; y < 320; y += 40) for (const lx of [80, 120, 160]) K.box(g, lx - 1, y, 2, 18, '#f2f5f8');
      for (let i = 0; i < 8; i++) { const y = ((i * 83 + dist) % 420) - 50; K.shadow(g, (i % 2 ? 222 : 18) + 3, y + 5, 9, 6); K.put(g, K.tree(i % 3 ? 11 : 8, i % 4), i % 2 ? 222 : 18, y); }
      if (sp > 230) { g.fillStyle = 'rgba(255,255,255,.22)'; for (let i = 0; i < 6; i++) g.fillRect(48 + (i * 53) % 150, (i * 97 + dist * 2) % 320, 1, 14); }
      for (const c of cars) { K.shadow(g, c.x + 2, c.y + 3, 8, 13); K.put(g, K.car(c.c), c.x, c.y); }
      if (inv > S.inv + .5) S.F.boom(x, 258, 1); S.inv = inv; if (inv <= 0 || Math.floor(inv * 10) % 2) { K.shadow(g, x + 2, 265, 8, 13); K.put(g, K.car('#e8231e'), x, 262); } S.F.draw(g); }
  };
} });
