Arcade.game('penalty-kick', { w: 240, h: 320, pad: 'dpad', a: 'SHOOT',
help: 'Tap or click the spot in the goal where you want to shoot (or move the target with the arrow keys and press Space). The corners are hard for the keeper — but aim too wide and you miss. Score at least 3 of 5 to reach the next round.',
init(A) {
  const GX0 = 44, GX1 = 196, GY0 = 44, GY1 = 112;
  let aim = { x: 120, y: 80 }, ball = null, kp = { x: 120, y: 92, tx: 120, ty: 92 }, lvl = 1, shots = 0, goals = 0, res = '', rt = 0, tm = 0, marks = [];
  const info = () => A.info('ROUND ' + lvl + '  GOALS ' + goals + '/' + shots);
  function shoot(x, y) { if (ball || rt > 0) return; const tx = x + A.rnd(-7, 7), ty = y + A.rnd(-7, 7), sp = Math.max(16, 78 - lvl * 9); ball = { t: 0, tx, ty }; kp.tx = Math.max(GX0 + 14, Math.min(GX1 - 14, tx + A.rnd(-1, 1) * sp)); kp.ty = Math.max(GY0 + 16, Math.min(GY1 - 12, ty + A.rnd(-1, 1) * sp * .5)); A.beep(300, .08); }
  info();
  return {
    key(k) { if (k === 'a') shoot(aim.x, aim.y); }, tap(x, y) { aim = { x, y }; shoot(x, y); },
    update(dt) { tm += dt; const k = A.keys; aim.x = Math.max(20, Math.min(220, aim.x + ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 110 * dt)); aim.y = Math.max(24, Math.min(130, aim.y + ((k.down ? 1 : 0) - (k.up ? 1 : 0)) * 110 * dt)); if (A.ptr.moved && A.ptr.y < 150) { aim.x = A.ptr.x; aim.y = A.ptr.y; }
      if (rt > 0) { rt -= dt; if (rt <= 0) { ball = null; res = ''; kp.tx = 120; kp.ty = 92; if (shots >= 5) { if (goals >= 3) { A.add(200); lvl++; shots = goals = 0; marks = []; } else { A.over(); return; } } info(); } }
      const sp = (ball ? 190 + lvl * 14 : 120) * dt, dx = kp.tx - kp.x, dy = kp.ty - kp.y, d = Math.hypot(dx, dy); if (d > sp) { kp.x += dx / d * sp; kp.y += dy / d * sp; } else { kp.x = kp.tx; kp.y = kp.ty; } if (!ball && rt <= 0) kp.tx = 120 + Math.sin(tm * 2) * 26;
      if (ball && rt <= 0) { ball.t += dt / .42; if (ball.t >= 1) { ball.t = 1; shots++; const inG = ball.tx > GX0 + 3 && ball.tx < GX1 - 3 && ball.ty > GY0 + 3 && ball.ty < GY1;
          if (!inG) { res = 'MISS!'; A.beep(160, .25, 'sawtooth'); } else if (Math.abs(ball.tx - kp.x) < 20 && Math.abs(ball.ty - kp.y) < 22) { res = 'SAVED!'; A.beep(200, .25, 'sawtooth'); } else { res = 'GOAL!'; goals++; A.add(100); A.beep(880, .3, 'triangle'); }
          marks.push(res === 'GOAL!'); rt = 1.2; info(); } } },
    draw(g) { for (let y = 0; y < 320; y += 32) { g.fillStyle = (y / 32) % 2 ? '#2f8a3a' : '#2a7c34'; g.fillRect(0, y, 240, 32); } g.fillStyle = '#e6f5e6'; g.fillRect(20, 112, 200, 2); g.fillRect(20, 112, 2, 110); g.fillRect(218, 112, 2, 110); g.fillRect(20, 220, 200, 2); g.fillRect(118, 268, 4, 4);
      g.fillStyle = '#1b3a22'; g.fillRect(GX0, GY0, GX1 - GX0, GY1 - GY0); g.fillStyle = '#4a6a52'; for (let x = GX0; x < GX1; x += 8) g.fillRect(x, GY0, 1, GY1 - GY0); for (let y = GY0; y < GY1; y += 8) g.fillRect(GX0, y, GX1 - GX0, 1);
      g.fillStyle = '#000'; g.fillRect(GX0 - 5, GY0 - 5, GX1 - GX0 + 10, 5); g.fillRect(GX0 - 5, GY0 - 5, 5, GY1 - GY0 + 5); g.fillRect(GX1, GY0 - 5, 5, GY1 - GY0 + 5); g.fillStyle = '#f2f5f8'; g.fillRect(GX0 - 4, GY0 - 4, GX1 - GX0 + 8, 3); g.fillRect(GX0 - 4, GY0 - 4, 3, GY1 - GY0 + 4); g.fillRect(GX1 + 1, GY0 - 4, 3, GY1 - GY0 + 4);
      const X = Math.round(kp.x), Y = Math.round(kp.y), lean = Math.max(-1, Math.min(1, (kp.tx - kp.x) / 20)); g.fillStyle = '#000'; g.fillRect(X - 9, Y - 21, 18, 42); g.fillStyle = '#ffd23c'; g.fillRect(X - 8, Y - 8, 16, 16); g.fillStyle = '#f0b890'; g.fillRect(X - 5, Y - 20, 10, 10); g.fillStyle = '#12101c'; g.fillRect(X - 3, Y - 16, 2, 2); g.fillRect(X + 1, Y - 16, 2, 2); g.fillRect(X - 6, Y + 8, 5, 12); g.fillRect(X + 1, Y + 8, 5, 12);
      g.fillStyle = '#000'; g.fillRect(X - 22 + lean * 4, Y - 12 - Math.abs(lean) * 6, 14, 7); g.fillRect(X + 8 + lean * 4, Y - 12 - Math.abs(lean) * 6, 14, 7); g.fillStyle = '#ffd23c'; g.fillRect(X - 20 + lean * 4, Y - 11 - Math.abs(lean) * 6, 12, 5); g.fillRect(X + 8 + lean * 4, Y - 11 - Math.abs(lean) * 6, 12, 5); g.fillStyle = '#f2f5f8'; g.fillRect(X - 22 + lean * 4, Y - 12 - Math.abs(lean) * 6, 5, 7); g.fillRect(X + 17 + lean * 4, Y - 12 - Math.abs(lean) * 6, 5, 7);
      if (!ball) { const x = Math.round(aim.x), y = Math.round(aim.y); g.fillStyle = '#e8231e'; g.fillRect(x - 7, y - 1, 5, 2); g.fillRect(x + 2, y - 1, 5, 2); g.fillRect(x - 1, y - 7, 2, 5); g.fillRect(x - 1, y + 2, 2, 5); }
      const t = ball ? ball.t : 0, bx = Math.round(120 + ((ball ? ball.tx : 120) - 120) * t), by = Math.round(270 + ((ball ? ball.ty : 270) - 270) * t), r = Math.round(7 - t * 3); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(bx - r, by + r + 2 - Math.round(t * 2), r * 2, 2); g.fillStyle = '#000'; g.fillRect(bx - r - 1, by - r - 1, r * 2 + 2, r * 2 + 2); g.fillStyle = '#fff'; g.fillRect(bx - r, by - r, r * 2, r * 2); g.fillStyle = '#12101c'; g.fillRect(bx - 1, by - 1, 3, 3);
      for (let i = 0; i < 5; i++) { g.fillStyle = '#000'; g.fillRect(89 + i * 13, 299, 10, 10); g.fillStyle = i < marks.length ? (marks[i] ? '#3fd45a' : '#e8231e') : '#59627a'; g.fillRect(90 + i * 13, 300, 8, 8); }
      if (res) { g.fillStyle = 'rgba(13,11,20,.7)'; g.fillRect(0, 160, 240, 34); A.text(g, res, 120, 167, res === 'GOAL!' ? '#ffd23c' : '#ffffff', 4, 'center'); } }
  };
} });
