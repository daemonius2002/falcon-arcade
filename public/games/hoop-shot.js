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
    draw(g) { g.fillStyle = '#2a1f5a'; g.fillRect(0, 0, 240, 320); g.fillStyle = '#33266a'; for (let y = 0; y < 230; y += 16) for (let x = (y / 16 % 2) * 16; x < 240; x += 32) g.fillRect(x, y, 16, 16); g.fillStyle = '#c8803a'; g.fillRect(0, 286, 240, 34); g.fillStyle = '#e0a060'; g.fillRect(0, 286, 240, 2); g.fillStyle = '#a06428'; for (let x = 0; x < 240; x += 24) g.fillRect(x, 288, 1, 32);
      const X = Math.round(hx); g.fillStyle = '#000'; g.fillRect(X - 25, 43, 50, 38); g.fillStyle = '#f2f5f8'; g.fillRect(X - 24, 44, 48, 36); g.fillStyle = '#e8231e'; g.fillRect(X - 10, 60, 20, 2); g.fillRect(X - 10, 60, 2, 16); g.fillRect(X + 8, 60, 2, 16); g.fillStyle = '#5c6678'; g.fillRect(X - 2, 80, 4, 10);
      g.fillStyle = '#d6dbea'; for (let i = 0; i < 5; i++) { g.fillRect(X - 13 + i * 6 + (i < 2 ? i : i > 2 ? i - 4 : 0), 94, 1, 16); } g.fillRect(X - 11, 100, 22, 1); g.fillRect(X - 9, 106, 18, 1); g.fillStyle = '#000'; g.fillRect(X - 18, 89, 36, 6); g.fillStyle = '#ff8a1e'; g.fillRect(X - 17, 90, 34, 4); g.fillStyle = '#ffd98a'; g.fillRect(X - 17, 90, 34, 1);
      if (!ball && wait <= 0 && left > 0) { g.fillStyle = '#ffffff'; for (let i = 1; i < 21; i++) { const t = i * .07; g.fillRect(Math.round(BX + vx0 * t) - 1, Math.round(BY + vy0 * t + G * t * t / 2) - 1, 2, 2); } if (dr) { g.fillStyle = '#ffd23c'; g.fillRect(Math.round(A.ptr.x) - 2, Math.round(A.ptr.y) - 2, 4, 4); } }
      const bx = Math.round(ball ? ball.x : BX), by = Math.round(ball ? ball.y : BY); if (ball || left > 0) { g.fillStyle = '#000'; g.fillRect(bx - 7, by - 5, 14, 10); g.fillRect(bx - 5, by - 7, 10, 14); g.fillStyle = '#ff8a1e'; g.fillRect(bx - 6, by - 4, 12, 8); g.fillRect(bx - 4, by - 6, 8, 12); g.fillStyle = '#7a3a10'; g.fillRect(bx - 6, by, 12, 1); g.fillRect(bx, by - 6, 1, 12); g.fillStyle = '#ffc890'; g.fillRect(bx - 4, by - 4, 3, 2); }
      if (mt > 0) A.text(g, msg, 120, 150, '#ffd23c', 4, 'center'); }
  };
} });
