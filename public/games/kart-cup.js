Arcade.game('kart-cup', { w: 240, h: 240, pad: 'lr',
help: 'Your red kart drives by itself — you only steer with left / right (down brakes). Stay on the grey track: the grass slows you down. Race 3 laps against three computer karts.',
init(A) {
  const WP = [[40, 40], [120, 28], [200, 40], [214, 92], [168, 120], [208, 160], [200, 206], [120, 214], [88, 168], [50, 204], [26, 150], [30, 90]], P = [], n = WP.length;
  for (let i = 0; i < n; i++) { const p0 = WP[(i + n - 1) % n], p1 = WP[i], p2 = WP[(i + 1) % n], p3 = WP[(i + 2) % n]; for (let k = 0; k < 10; k++) { const t = k / 10, t2 = t * t, t3 = t2 * t, f = j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3); P.push([f(0), f(1)]); } }
  const N = P.length, COL = ['#e8231e', '#3fa8e0', '#ffd23c', '#3fd45a'], nd = a => Math.atan2(Math.sin(a), Math.cos(a));
  const karts = COL.map((c, i) => { const q = P[(N - 3 - i * 4 + N) % N], q2 = P[(N - 2 - i * 4 + N) % N]; return { x: q[0] + (i % 2 ? 6 : -6), y: q[1], a: Math.atan2(q2[1] - q[1], q2[0] - q[0]), v: 0, idx: (N - 3 - i * 4 + N) % N, lap: i === 0 ? 0 : 0, c, max: 74 + i * 5 + A.rnd(-3, 3), prog: -3 - i * 4, done: 0 }; });
  const me = karts[0]; let count = 3, time = 0, fin = 0;
  function track(k) { let bd = 1e9, bi = k.idx; for (let j = 0; j < 14; j++) { const i = (k.idx + j) % N, d = (P[i][0] - k.x) ** 2 + (P[i][1] - k.y) ** 2; if (d < bd) { bd = d; bi = i; } } const adv = (bi - k.idx + N) % N; k.prog += adv; k.idx = bi; return Math.sqrt(bd); }
  const pos = () => 1 + karts.filter(k => k !== me && (k.done ? !me.done || k.done < me.done : k.prog > me.prog)).length;
  return {
    update(dt) { if (count > 0) { count -= dt; A.info(count > 0 ? 'START IN ' + Math.ceil(count) : 'GO!'); return; } time += dt;
      for (const k of karts) { const off = track(k); if (!k.done && k.prog >= N * 3) { k.done = time; if (k === me) fin = 1.2; }
        if (k === me) { const st = (A.keys.right ? 1 : 0) - (A.keys.left ? 1 : 0); k.a += st * 3.1 * dt * Math.min(1, k.v / 40 + .3); const mx = k.done ? 0 : off > 15 ? 38 : A.keys.down ? 20 : 96; k.v += (mx - k.v) * Math.min(1, dt * (mx < k.v ? 3 : 1.4)); }
        else { const t = P[(k.idx + 5) % N], want = Math.atan2(t[1] - k.y, t[0] - k.x); k.a += Math.max(-3 * dt, Math.min(3 * dt, nd(want - k.a))); const mx = k.done ? 0 : k.max * (Math.abs(nd(want - k.a)) > .5 ? .75 : 1); k.v += (mx - k.v) * Math.min(1, dt * 1.4); }
        k.x = Math.max(4, Math.min(236, k.x + Math.cos(k.a) * k.v * dt)); k.y = Math.max(4, Math.min(236, k.y + Math.sin(k.a) * k.v * dt)); }
      if (fin > 0) { fin -= dt; if (fin <= 0) { const p = pos(); A.add([1000, 600, 300, 100][p - 1] + Math.max(0, Math.round(300 - time * 3))); A.info('FINISHED: PLACE ' + p); A.over(p === 1); } return; }
      A.info('LAP ' + Math.min(3, Math.floor(Math.max(0, me.prog) / N) + 1) + '/3  PLACE ' + pos()); },
    draw(g) { const K = Art, S = this.S || (this.S = { F: K.fx() });
      if (!S.bg) { const k = K.mkc(240, 240), q = k.getContext('2d'); K.scroll(q, K.T.grass(64, 64), 0, 0, 240, 240); const ly = K.mkc(240, 240), l = ly.getContext('2d'), path = () => { l.beginPath(); P.forEach((p, i) => l[i ? 'lineTo' : 'moveTo'](p[0], p[1])); l.closePath(); }; l.lineJoin = l.lineCap = 'round';
        path(); l.strokeStyle = '#140e1c'; l.lineWidth = 40; l.stroke(); path(); l.strokeStyle = '#f2f5f8'; l.lineWidth = 37; l.stroke(); l.setLineDash([9, 9]); l.strokeStyle = '#e8231e'; l.stroke(); l.setLineDash([]); path(); l.strokeStyle = '#3a3a44'; l.lineWidth = 30; l.stroke(); K.pix(ly, null, 6);
        l.globalCompositeOperation = 'source-atop'; l.globalAlpha = .5; K.scroll(l, K.T.road(64, 64), 0, 0, 240, 240); l.globalAlpha = 1; l.globalCompositeOperation = 'source-over'; q.drawImage(ly, 0, 0);
        for (let i = 0; i < N; i += 3) { const p = P[i], n = P[(i + 1) % N], a = Math.atan2(n[1] - p[1], n[0] - p[0]); K.box(q, Math.round(p[0] + Math.cos(a))- 1, Math.round(p[1] + Math.sin(a)) - 1, 2, 2, '#8a8a98'); }
        const s0 = P[0], s1 = P[1], a = Math.atan2(s1[1] - s0[1], s1[0] - s0[0]); q.save(); q.translate(s0[0], s0[1]); q.rotate(a); for (let i = -15; i < 15; i += 3) { K.box(q, -2, i, 2, 3, (i / 3 & 1) ? '#12101c' : '#ffffff'); K.box(q, 0, i, 2, 3, (i / 3 & 1) ? '#ffffff' : '#12101c'); } q.restore();
        for (let i = 0, n = 0; i < 400 && n < 26; i++) { const x = K.rnd(8, 232), y = K.rnd(8, 232); if (P.every(p => (p[0] - x) ** 2 + (p[1] - y) ** 2 > 28 * 28)) { n++; K.shadow(q, x + 3, y + 5, 8, 5); K.put(q, K.tree(n % 3 ? 9 : 7, n % 4), x, y); } } S.bg = k; }
      g.drawImage(S.bg, 0, 0);
      for (const k of karts.slice().reverse()) { K.shadow(g, k.x + 1, k.y + 2, 5, 4); K.put(g, K.kart(k.c), k.x, k.y, { rot: k.a + Math.PI / 2 }); if (k === me) { K.box(g, Math.round(k.x) - 1, Math.round(k.y) - 13, 3, 3, '#140e1c'); K.box(g, Math.round(k.x), Math.round(k.y) - 12, 1, 1, '#ffd23c'); } }
      if (count > 0) { A.text(g, Math.ceil(count), 123, 103, '#140e1c', 8, 'center'); A.text(g, Math.ceil(count), 120, 100, '#ffd23c', 8, 'center'); } }
  };
} });
