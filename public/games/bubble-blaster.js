Arcade.game('bubble-blaster', { w: 240, h: 320, pad: 'lr', a: 'SHOOT',
help: 'Aim with the mouse or your finger and tap to shoot (or left / right and Space). Join 3 or more bubbles of the same colour to pop them; bubbles left hanging fall too. Do not let them reach the red line.',
init(A) {
  const RH = 21, COL = ['#e8231e', '#ffd23c', '#3fd45a', '#3fa8e0', '#b06ae0'], IMG = COL.map(c => A.shape(2, c, 24)), SM = COL.map(c => A.shape(2, c, 12));
  let g0 = new Map(), par = 0, ang = -Math.PI / 2, ball = null, cur = A.ri(0, 4), nxt = A.ri(0, 4), miss = 0;
  const cols = r => (r + par) % 2 ? 9 : 10, cx = (r, c) => 12 + c * 24 + ((r + par) % 2 ? 12 : 0), cy = r => 12 + r * RH, K = (r, c) => r * 16 + c;
  const nbs = (r, c) => { const o = (r + par) % 2 ? 0 : -1; return [[r, c - 1], [r, c + 1], [r - 1, c + o], [r - 1, c + o + 1], [r + 1, c + o], [r + 1, c + o + 1]].filter(n => n[0] >= 0 && n[1] >= 0 && n[1] < cols(n[0])); };
  function addRow() { const n = new Map(); for (const [k, v] of g0) n.set(k + 16, v); g0 = n; par ^= 1; for (let c = 0; c < cols(0); c++) g0.set(K(0, c), A.ri(0, 4)); }
  const pick = () => { const s = [...new Set(g0.values())]; return s.length ? s[A.ri(0, s.length - 1)] : A.ri(0, 4); };
  function shoot() { if (ball) return; ball = { x: 120, y: 296, vx: Math.cos(ang) * 300, vy: Math.sin(ang) * 300, c: cur }; cur = nxt; nxt = pick(); A.beep(600, .04); }
  function land() { let best = -1, bd = 1e9; for (let r = 0; r < 16; r++) for (let c = 0; c < cols(r); c++) { if (g0.has(K(r, c)) || !(r === 0 || nbs(r, c).some(n => g0.has(K(n[0], n[1]))))) continue; const d = (cx(r, c) - ball.x) ** 2 + (cy(r) - ball.y) ** 2; if (d < bd) { bd = d; best = K(r, c); } }
    if (best < 0) { ball = null; return; } g0.set(best, ball.c); const grp = [best], seen = new Set(grp); for (let i = 0; i < grp.length; i++) for (const n of nbs(grp[i] >> 4, grp[i] & 15)) { const k = K(n[0], n[1]); if (!seen.has(k) && g0.get(k) === ball.c) { seen.add(k); grp.push(k); } }
    if (grp.length >= 3) { grp.forEach(k => g0.delete(k)); A.add(grp.length * 10); A.beep(880, .1, 'triangle'); const ok = new Set(), q = []; for (const k of g0.keys()) if (k >> 4 === 0) { ok.add(k); q.push(k); }
      while (q.length) { const k = q.pop(); for (const n of nbs(k >> 4, k & 15)) { const j = K(n[0], n[1]); if (g0.has(j) && !ok.has(j)) { ok.add(j); q.push(j); } } } for (const k of [...g0.keys()]) if (!ok.has(k)) { g0.delete(k); A.add(20); } }
    else if (++miss >= 5) { miss = 0; addRow(); }
    ball = null; if (!g0.size) { A.add(500); for (let i = 0; i < 5; i++) addRow(); } for (const k of g0.keys()) if (k >> 4 >= 12) { A.over(); return; } A.info('NEW ROW IN ' + (5 - miss)); }
  for (let i = 0; i < 5; i++) addRow(); A.info('NEW ROW IN 5');
  return {
    key(k) { if (k === 'a') shoot(); }, tap() { shoot(); },
    update(dt) { if (A.ptr.moved && A.ptr.y < 286) ang = Math.atan2(A.ptr.y - 296, A.ptr.x - 120); if (A.keys.left) ang -= 1.6 * dt; if (A.keys.right) ang += 1.6 * dt; ang = Math.max(-Math.PI + .2, Math.min(-.2, ang));
      if (!ball) return; for (let i = 0; i < 4 && ball; i++) { ball.x += ball.vx * dt / 4; ball.y += ball.vy * dt / 4; if (ball.x < 12) { ball.x = 12; ball.vx = Math.abs(ball.vx); } if (ball.x > 228) { ball.x = 228; ball.vx = -Math.abs(ball.vx); }
        let hit = ball.y <= 12; if (!hit) for (const k of g0.keys()) if ((cx(k >> 4, k & 15) - ball.x) ** 2 + (cy(k >> 4) - ball.y) ** 2 < 440) { hit = true; break; } if (hit) land(); } },
    draw(g) { const K = Art, S = this.S || (this.S = { F: K.fx(), n: g0.size, last: null }); K.scroll(g, K.T.panel(64, 64, '#2a2458'), 0, 0, 240, 320); K.box(g, 0, 0, 240, 2, '#59627a');
      for (let x = 0; x < 240; x += 8) K.box(g, x, 268, 4, 2, '#e8231e');
      if (g0.size < S.n - 1 && S.last) S.F.spark(S.last[0], S.last[1], ['#ffffff', '#ffd23c', '#5fe3d6'], 22, 120); S.n = g0.size; if (ball) S.last = [ball.x, ball.y];
      for (const [k, v] of g0) { const x = cx(k >> 4, k & 15), y = cy(k >> 4); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - 9, y - 7, 20, 18); K.put(g, K.ball(11, COL[v]), x, y); }
      let x = 120, y = 296, vx = Math.cos(ang) * 14, vy = Math.sin(ang) * 14; for (let i = 0; i < 12; i++) { x += vx; y += vy; if (x < 12 || x > 228) vx = -vx; if (i > 0) { K.box(g, Math.round(x) - 2, Math.round(y) - 2, 4, 4, '#140e1c'); K.box(g, Math.round(x) - 1, Math.round(y) - 1, 2, 2, '#ffffff'); } }
      K.put(g, K.spr('bbbase', 44, 20, q => { K.part(q, [-22, 10, -14, -8, 14, -8, 22, 10], K.lin(q, -22, 0, 22, 0, '#aab4c2', '#5c6678', '#2a2f3d')); K.box(q, -12, -5, 24, 2, '#f2f5f8'); }), 120, 308);
      if (ball) K.put(g, K.ball(11, COL[ball.c]), ball.x, ball.y); K.put(g, K.ball(11, COL[cur]), 120, 296); K.put(g, K.ball(6, COL[nxt]), 156, 306); S.F.draw(g); }
  };
} });
