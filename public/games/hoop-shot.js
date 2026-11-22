Arcade.game('hoop-shot', { w: 240, h: 320, pad: 'dpad', a: 'THROW',
help: 'Pull back and let go, like a slingshot: touch or click, drag down away from the hoop, then release. The dots show where the ball will fly. With keys: left / right aim, up / down power, Space throws. You have 10 balls; baskets in a row score more.',
init(A) {
  const BX = 120, BY = 268, G = 520;
  let vx0 = 70, vy0 = -470, ball = null, dr = null, hx = Math.random() < .5 ? 64 : 176, hv = 0, left = 10, streak = 0, made = 0, msg = '', mt = 0, wait = 0;
  const info = () => A.info('BALLS ' + left + '  BASKETS ' + made);
  function throwIt() { if (ball || wait > 0 || left <= 0) return; ball = { x: BX, y: BY, vx: vx0, vy: vy0, sc: 0 }; left--; A.beep(400, .06); info(); }
  function next(ok) { ball = null; if (!ok) streak = 0; wait = .5; if (left <= 0) wait = 1; }
  info();
  return {
    key(k) { if (k === 'a') throwIt(); }, swipe() {},
    update(dt) { const k = A.keys; vx0 = Math.max(-220, Math.min(220, vx0 + ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 120 * dt)); vy0 = Math.max(-520, Math.min(-200, vy0 + ((k.down ? 1 : 0) - (k.up ? 1 : 0)) * 160 * dt)); mt -= dt;
      if (wait > 0) { wait -= dt; if (wait <= 0 && left <= 0) { A.over(made >= 5); return; } }
      if (made >= 3) { if (!hv) hv = 30; hx += hv * dt; if (hx < 50 || hx > 190) hv = -hv; }
      if (!ball) { if (A.ptr.down && !dr) dr = { x: A.ptr.x, y: A.ptr.y }; if (dr) { const dx = (dr.x - A.ptr.x) * 4.2, dy = (dr.y - A.ptr.y) * 4.2; if (Math.hypot(dx, dy) > 60) { vx0 = Math.max(-220, Math.min(220, dx)); vy0 = Math.max(-520, Math.min(-200, dy)); } if (!A.ptr.down) { const far = Math.hypot(dr.x - A.ptr.x, dr.y - A.ptr.y) > 14; dr = null; if (far) throwIt(); } } return; }
      dr = null; for (let i = 0; i < 3; i++) { const h = dt / 3, py = ball.y; ball.vy += G * h; ball.x += ball.vx * h; ball.y += ball.vy * h;
        if (ball.vy < 0 && py > 94 && ball.y <= 94 && Math.abs(ball.x - hx) < 17) { ball.y = 95; ball.vy = Math.abs(ball.vy) * .5; A.beep(240, .03); }
        for (const rx of [hx - 17, hx + 17]) { const dx = ball.x - rx, dy = ball.y - 92, d = Math.hypot(dx, dy); if (d < 7 && d > 0) { const nx = dx / d, ny = dy / d, dot = ball.vx * nx + ball.vy * ny; if (dot < 0) { ball.vx = (ball.vx - 2 * dot * nx) * .62; ball.vy = (ball.vy - 2 * dot * ny) * .62; A.beep(240, .03); } ball.x = rx + nx * 7; ball.y = 92 + ny * 7; } }
        if (!ball.sc && ball.vy > 0 && py < 94 && ball.y >= 94 && Math.abs(ball.x - hx) < 14) { ball.sc = 1; made++; streak++; A.add(100 * streak); A.beep(880, .25, 'triangle'); msg = streak > 1 ? 'X' + streak + '!' : 'NICE!'; mt = .9; info(); }
        if (ball.x < 6) { ball.x = 6; ball.vx = Math.abs(ball.vx) * .7; } if (ball.x > 234) { ball.x = 234; ball.vx = -Math.abs(ball.vx) * .7; } }
      if (ball.y > 340) { const ok = ball.sc; next(ok); if (ok && made < 3) hx = Math.random() < .5 ? A.rnd(50, 78) : A.rnd(162, 190); } },
    draw(g) { const K = Art, S = this.S || (this.S = { F: K.fx(), m: 0 }); K.scroll(g, K.T.brick(64, 64, '#3a2c66'), 0, 0, 240, 320); g.fillStyle = 'rgba(10,6,30,.25)'; g.fillRect(0, 0, 240, 320);
      for (let x = 20; x < 240; x += 100) { K.box(g, x, 20, 44, 26, '#140e1c'); K.box(g, x + 1, 21, 42, 24, '#1b2a55'); K.box(g, x + 1, 21, 42, 3, '#5a7ad0'); K.box(g, x + 21, 21, 2, 24, '#140e1c'); }
      const fl = K.T.wood(64, 64); for (let x = 0; x < 240; x += 64) g.drawImage(fl, 0, 0, 64, 34, x, 286, 64, 34); K.box(g, 0, 286, 240, 2, '#f0c080'); K.box(g, 0, 284, 240, 2, '#140e1c'); K.box(g, 0, 300, 240, 2, '#f2f5f8');
      const X = Math.round(hx); K.box(g, X - 2, 80, 5, 12, '#140e1c'); K.box(g, X - 1, 80, 3, 12, '#8a94a4');
      K.put(g, K.spr('hsboard', 50, 38, q => { K.box(q, -25, -19, 50, 38, '#f2f5f8'); K.box(q, -25, -19, 50, 3, '#ffffff'); K.box(q, -25, 16, 50, 3, '#aab4c2'); K.box(q, -23, -17, 46, 34, '#e6ecf5'); for (const [a, b, c, d] of [[-10, -2, 20, 2], [-10, -2, 2, 16], [8, -2, 2, 16], [-10, 12, 20, 2]]) K.box(q, a, b, c, d, '#e8231e'); }), X, 62);
      g.fillStyle = '#f2f5f8'; for (let i = 0; i < 6; i++) { const a = X - 15 + i * 6; g.fillRect(a + (i < 3 ? i : 5 - i) - 1, 96, 1, 6); g.fillRect(a + (i < 3 ? i + 1 : 4 - i), 102, 1, 6); g.fillRect(a + (i < 3 ? i + 2 : 3 - i) , 108, 1, 5); } g.fillRect(X - 13, 101, 27, 1); g.fillRect(X - 11, 107, 23, 1);
      K.put(g, K.spr('hsrim', 38, 6, q => { K.rr(q, -19, -3, 38, 6, 3, K.lin(q, 0, -3, 0, 3, '#ffc070', '#ff8a1e', '#b8520a')); }), X, 92);
      if (!ball && wait <= 0 && left > 0) { for (let i = 1; i < 21; i++) { const t = i * .07, a = Math.round(BX + vx0 * t), b = Math.round(BY + vy0 * t + G * t * t / 2); K.box(g, a - 2, b - 2, 4, 4, '#140e1c'); K.box(g, a - 1, b - 1, 2, 2, i % 2 ? '#ffffff' : '#ffd23c'); } if (dr) K.put(g, K.ball(3, '#ffd23c'), A.ptr.x, A.ptr.y); }
      if (made > S.m) S.F.spark(X, 100, ['#ffd23c', '#ffffff', '#ff8a1e'], 24, 110); S.m = made;
      const bx = ball ? ball.x : BX, by = ball ? ball.y : BY; if (ball || left > 0) { if (!ball) K.shadow(g, bx, 284, 7, 2); K.put(g, K.spr('hsball', 14, 14, q => { K.ell(q, 0, 0, 7, 7, K.rad(q, -2.5, -2.5, .5, 10, '#ffc890', '#ff8a1e', '#a04a0a')); K.box(q, -7, 0, 14, 1, '#5a2a08'); K.box(q, 0, -7, 1, 14, '#5a2a08'); q.strokeStyle = '#5a2a08'; q.lineWidth = 1; q.beginPath(); q.arc(-9, 0, 6, -1, 1); q.stroke(); q.beginPath(); q.arc(9, 0, 6, 2.1, 4.2); q.stroke(); }), bx, by, { rot: Math.round(bx / 9) * .8 }); }
      S.F.draw(g); if (mt > 0) { A.text(g, msg, 122, 152, '#140e1c', 4, 'center'); A.text(g, msg, 120, 150, '#ffd23c', 4, 'center'); } }
  };
} });
