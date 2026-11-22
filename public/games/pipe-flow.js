Arcade.game('pipe-flow', { w: 168, h: 192,
help: 'Tap a pipe to turn it. Water starts at the yellow tile — connect every single pipe to it before the time runs out. Each solved board adds time and the boards get bigger.',
init(A) {
  const D = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]], T = 24, rotm = v => ((v << 1) | (v >> 3)) & 15;
  let n = 5, lvl = 1, m, src, lit, time = 90, done = 0;
  function flood() { lit = new Array(n * n).fill(0); lit[src] = 1; const q = [src]; while (q.length) { const i = q.pop(), x = i % n, y = (i - x) / n; for (const d of D) { const X = x + d[0], Y = y + d[1], j = Y * n + X; if ((m[i] & d[2]) && X >= 0 && Y >= 0 && X < n && Y < n && (m[j] & d[3]) && !lit[j]) { lit[j] = 1; q.push(j); } } } }
  function gen() { m = new Array(n * n).fill(0); const seen = new Array(n * n).fill(0), st = [A.ri(0, n * n - 1)]; seen[st[0]] = 1;
    while (st.length) { const k = A.ri(0, st.length - 1), i = st[k], x = i % n, y = (i - x) / n, nb = D.filter(d => { const X = x + d[0], Y = y + d[1]; return X >= 0 && Y >= 0 && X < n && Y < n && !seen[Y * n + X]; });
      if (!nb.length) { st.splice(k, 1); continue; } const d = nb[A.ri(0, nb.length - 1)], j = (y + d[1]) * n + x + d[0]; m[i] |= d[2]; m[j] |= d[3]; seen[j] = 1; st.push(j); }
    src = (n >> 1) * n + (n >> 1); for (let i = 0; i < n * n; i++) { let r = A.ri(0, 3); while (r--) m[i] = rotm(m[i]); } flood(); if (lit.every(v => v)) { m[0] = rotm(m[0]); flood(); } }
  const off = () => [(168 - n * T) / 2, (192 - n * T) / 2];
  gen();
  return {
    tap(x, y) { if (done > 0) return; const o = off(), cx = Math.floor((x - o[0]) / T), cy = Math.floor((y - o[1]) / T); if (cx < 0 || cy < 0 || cx >= n || cy >= n) return; const i = cy * n + cx; m[i] = rotm(m[i]); A.beep(520, .03); flood();
      if (lit.every(v => v)) { A.add(100 * lvl + Math.ceil(time)); done = 1.1; A.beep(880, .3, 'triangle'); } },
    update(dt) { if (done > 0) { done -= dt; if (done <= 0) { lvl++; n = Math.min(7, 5 + (lvl >> 1)); time = Math.min(120, time + 25); gen(); } return; }
      time -= dt; A.info('TIME ' + Math.max(0, Math.ceil(time)) + '  BOARD ' + lvl); if (time <= 0) A.over(); },
    draw(g) { const K = Art, o = off(), ph = Math.floor(performance.now() / 160); K.scroll(g, K.T.panel(64, 64, '#263050'), 0, 0, 168, 192);
      for (let i = 0; i < n * n; i++) { const X = o[0] + (i % n) * T, Y = o[1] + Math.floor(i / n) * T, on = lit[i], c1 = on ? '#3fa8e0' : '#7a8496', c2 = on ? '#c8eeff' : '#b4bcce', c3 = on ? '#1a4f8a' : '#3a4152';
        g.drawImage(K.block(24, 24, '#2a3046'), X, Y);
        const arm = (x, y, w, h, v) => { K.box(g, X + x, Y + y, w, h, '#140e1c'); if (v) { K.box(g, X + x + 1, Y + y, w - 2, h, c1); K.box(g, X + x + 2, Y + y, 2, h, c2); K.box(g, X + x + w - 3, Y + y, 2, h, c3); if (on) K.box(g, X + x + 3, Y + y + (ph + i) % h, 1, 2, '#ffffff'); } else { K.box(g, X + x, Y + y + 1, w, h - 2, c1); K.box(g, X + x, Y + y + 2, w, 2, c2); K.box(g, X + x, Y + y + h - 3, w, 2, c3); if (on) K.box(g, X + x + (ph + i) % w, Y + y + 3, 2, 1, '#ffffff'); } };
        if (m[i] & 1) arm(8, 0, 8, 12, 1); if (m[i] & 4) arm(8, 12, 8, 12, 1); if (m[i] & 8) arm(0, 8, 12, 8, 0); if (m[i] & 2) arm(12, 8, 12, 8, 0);
        K.put(g, K.ball(i === src ? 7 : 5, i === src ? '#ffd23c' : on ? '#3fa8e0' : '#8a94a4'), X + 12, Y + 12); }
      if (done > 0) { K.box(g, 0, 82, 168, 28, 'rgba(13,11,20,.8)'); K.box(g, 0, 82, 168, 2, '#5fe3d6'); K.box(g, 0, 108, 168, 2, '#5fe3d6'); A.text(g, 'CONNECTED!', 84, 91, '#5fe3d6', 2, 'center'); } }
  };
} });
