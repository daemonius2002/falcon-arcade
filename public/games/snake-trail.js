Arcade.game('snake-trail', { w: 240, h: 240, pad: 'dpad',
help: 'Swipe or use the arrow keys to turn. Eat apples to grow longer and faster. Do not hit the walls or your own tail.',
init(A) {
  const N = 20, C = 12, D = { left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, up: { x: 0, y: -1 }, down: { x: 0, y: 1 } };
  const APPLE = A.spr(['....g.....', '...gg.....', '.rrr.rrr..', 'rRRrrrrrr.', 'rRrrrrrrr.', 'rrrrrrrrr.', 'rrrrrrrrd.', '.rrrrrrd..', '..rrrdd...', '..........'], { r: '#e8231e', R: '#ff8a7a', d: '#9a1410', g: '#3fd45a' });
  let s = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }], d = D.right, q = [], t = 0, sp = .17;
  const food = () => { let p; do { p = { x: A.ri(0, N - 1), y: A.ri(0, N - 1) }; } while (s.some(o => o.x === p.x && o.y === p.y)); return p; };
  let ap = food();
  return {
    key(k) { const n = D[k]; if (!n) return; const l = q.length ? q[q.length - 1] : d; if ((n.x !== -l.x || n.y !== -l.y) && n !== l && q.length < 2) q.push(n); },
    update(dt) { t += dt; if (t < sp) return; t = 0; if (q.length) d = q.shift(); const h = { x: s[0].x + d.x, y: s[0].y + d.y };
      if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || s.some(o => o.x === h.x && o.y === h.y)) { A.over(); return; }
      s.unshift(h); if (h.x === ap.x && h.y === ap.y) { A.add(10); A.beep(880, .08); ap = food(); sp = Math.max(.07, sp - .003); } else s.pop(); A.info('LENGTH ' + s.length); },
    draw(g) { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { g.fillStyle = (x + y) % 2 ? '#1f4a2a' : '#245432'; g.fillRect(x * C, y * C, C, C); }
      g.drawImage(APPLE, ap.x * C + 1, ap.y * C + 1);
      for (let i = s.length - 1; i >= 0; i--) { const o = s[i], x = o.x * C, y = o.y * C; g.fillStyle = '#0c3a16'; g.fillRect(x, y, C, C); g.fillStyle = i ? (i % 2 ? '#3fd45a' : '#34bf4f') : '#8ff08a'; g.fillRect(x + 1, y + 1, 10, 10); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 2, y + 2, 4, 2);
        if (!i) { const ex = d.x ? (d.x > 0 ? 7 : 2) : 2, ey = d.y ? (d.y > 0 ? 7 : 2) : 2, bx = d.x ? 0 : 5, by = d.y ? 0 : 5; g.fillStyle = '#fff'; g.fillRect(x + ex, y + ey, 3, 3); g.fillRect(x + ex + bx, y + ey + by, 3, 3); g.fillStyle = '#12101c'; g.fillRect(x + ex + 1, y + ey + 1, 2, 2); g.fillRect(x + ex + bx + 1, y + ey + by + 1, 2, 2); } } }
  };
} });
