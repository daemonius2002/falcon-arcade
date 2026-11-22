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
    draw(g) { const K = Art, S = this.S || (this.S = { F: K.fx(), n: s.length }), now = performance.now();
      g.drawImage(K.T.grass(240, 240), 0, 0); g.fillStyle = 'rgba(0,0,0,.09)'; for (let y = 0; y < N; y++) for (let x = y % 2; x < N; x += 2) g.fillRect(x * C, y * C, C, C);
      K.box(g, 0, 0, 240, 2, '#1f5a28'); K.box(g, 0, 238, 240, 2, '#1f5a28'); K.box(g, 0, 0, 2, 240, '#1f5a28'); K.box(g, 238, 0, 2, 240, '#1f5a28');
      if (s.length > S.n) S.F.spark(s[0].x * C + 6, s[0].y * C + 6, ['#ff8a7a', '#ffffff', '#ffd23c'], 12, 80); S.n = s.length;
      K.shadow(g, ap.x * C + 7, ap.y * C + 11, 4, 2); K.put(g, K.fruit(0), ap.x * C + 6, ap.y * C + 5 + Math.sin(now / 200));
      for (let i = s.length - 1; i >= 0; i--) K.shadow(g, s[i].x * C + 8, s[i].y * C + 10, 5, 3);
      for (let i = s.length - 1; i > 0; i--) { const o = s[i], q = s[i - 1]; K.put(g, K.ball(5, i % 2 ? '#2fb44a' : '#3fd45a'), (o.x + q.x) / 2 * C + 6, (o.y + q.y) / 2 * C + 6); K.put(g, K.ball(i === s.length - 1 ? 4 : 6, i % 2 ? '#3fd45a' : '#2fb44a'), o.x * C + 6, o.y * C + 6); }
      const hx = s[0].x * C + 6, hy = s[0].y * C + 6; if (Math.floor(now / 180) % 3 === 0) K.box(g, hx + d.x * 8 - (d.x ? 1 : 0), hy + d.y * 8 - (d.y ? 1 : 0), d.x ? 3 : 1, d.y ? 3 : 1, '#e8231e');
      K.put(g, K.ball(7, '#6fe85a'), hx, hy); for (const sg of [-1, 1]) { const ex = hx + d.x * 2 - d.y * 3 * sg, ey = hy + d.y * 2 + d.x * 3 * sg; K.box(g, ex - 1, ey - 1, 3, 3, '#ffffff'); K.box(g, ex + d.x, ey + d.y, 1, 1, '#12101c'); }
      S.F.draw(g); }
  };
} });
