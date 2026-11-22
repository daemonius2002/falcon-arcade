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
    draw(g) { const K = Art, S = this.S || (this.S = { F: K.fx(), r: '' }); K.scroll(g, K.T.grass(64, 64), 0, 0, 240, 320); g.fillStyle = 'rgba(0,40,0,.14)'; for (let y = 0; y < 320; y += 48) g.fillRect(0, y, 240, 24);
      g.drawImage(K.tex('pkcrowd', 240, 30, { base: '#2a2f3d', L: 8, specks: [['#e8231e', 220, 2, 2], ['#ffd23c', 200, 2, 2], ['#3fa8e0', 200, 2, 2], ['#f2f5f8', 240, 2, 2], ['#f0b890', 260, 2, 1]] }), 0, 0); K.box(g, 0, 30, 240, 6, '#12141c'); for (let x = 0; x < 240; x += 48) { K.box(g, x + 2, 31, 44, 4, x % 96 ? '#e8231e' : '#3f6ad0'); K.box(g, x + 8, 32, 32, 2, '#f2f5f8'); }
      for (const [a, b, c, d] of [[20, 112, 200, 2], [20, 112, 2, 110], [218, 112, 2, 110], [20, 220, 200, 2], [70, 112, 100, 2]]) K.box(g, a, b, c, d, '#e6f5e6'); K.box(g, 118, 268, 4, 4, '#e6f5e6');
      K.box(g, GX0, GY0, GX1 - GX0, GY1 - GY0, 'rgba(8,30,14,.55)'); g.fillStyle = 'rgba(230,245,230,.4)'; for (let x = GX0 + 4; x < GX1; x += 6) g.fillRect(x, GY0, 1, GY1 - GY0); for (let y = GY0 + 4; y < GY1; y += 6) g.fillRect(GX0, y, GX1 - GX0, 1);
      for (const [a, b, c, d] of [[GX0 - 5, GY0 - 5, GX1 - GX0 + 10, 5], [GX0 - 5, GY0 - 5, 5, GY1 - GY0 + 5], [GX1, GY0 - 5, 5, GY1 - GY0 + 5]]) { K.box(g, a, b, c, d, '#140e1c'); K.box(g, a + 1, b + 1, c - 2, d - 2, '#f2f5f8'); K.box(g, a + 1, b + d - 2, c - 2, 1, '#aab4c2'); }
      const lean = Math.max(-1, Math.min(1, (kp.tx - kp.x) / 22)), kpr = K.spr('pkkeeper', 46, 44, q => { K.box(q, -5, 8, 4, 12, '#1b1e29'); K.box(q, 1, 8, 4, 12, '#1b1e29'); K.box(q, -6, 19, 5, 3, '#f2f5f8'); K.box(q, 1, 19, 5, 3, '#f2f5f8'); K.rr(q, -8, -8, 16, 18, 3, K.lin(q, -8, 0, 8, 0, '#fff0a0', '#ffd23c', '#c8901e')); K.box(q, -8, 6, 16, 3, '#1b1e29'); K.part(q, [-8, -7, -20, -12, -20, -7, -8, -1], '#ffd23c'); K.part(q, [8, -7, 20, -12, 20, -7, 8, -1], '#e0b020'); K.rr(q, -23, -14, 6, 8, 2, '#f2f5f8'); K.rr(q, 17, -14, 6, 8, 2, '#f2f5f8'); K.ell(q, 0, -14, 5.4, 5.4, '#f0b890'); K.box(q, -5, -20, 10, 4, '#5a3418'); K.box(q, -3, -15, 2, 2, '#1a1222'); K.box(q, 1, -15, 2, 2, '#1a1222'); K.box(q, -2, -11, 4, 1, '#a05a3a'); });
      K.shadow(g, kp.x, GY1 + 2, 12, 3); K.put(g, kpr, kp.x, kp.y - 2, { rot: lean * .55 });
      if (!ball) { const x = Math.round(aim.x), y = Math.round(aim.y), q = Math.floor(performance.now() / 200) % 2; for (const [a, b, c, d] of [[-9 - q, -1, 6, 3], [4 + q, -1, 6, 3], [-1, -9 - q, 3, 6], [-1, 4 + q, 3, 6]]) { K.box(g, x + a, y + b, c, d, '#140e1c'); K.box(g, x + a + 1, y + b + 1, c - 2, d - 2, '#ff4a3a'); } }
      const t = ball ? ball.t : 0, bx = 120 + ((ball ? ball.tx : 120) - 120) * t, by = 270 + ((ball ? ball.ty : 270) - 270) * t - Math.sin(t * Math.PI) * 14, r = Math.round(7 - t * 3);
      K.shadow(g, bx, by + r + 2 + Math.sin(t * Math.PI) * 14, r, 2); K.put(g, K.spr('pkball' + r, 2 * r, 2 * r, q => { K.ell(q, 0, 0, r, r, K.rad(q, -r * .3, -r * .3, r * .1, r * 1.5, '#ffffff', '#d6dbea', '#8a94a4')); K.ell(q, 0, 0, r * .34, r * .34, '#1a1222'); for (const a of [.6, 2.2, 3.8, 5.4]) K.ell(q, Math.cos(a) * r * .8, Math.sin(a) * r * .8, r * .22, r * .22, '#1a1222'); }), bx, by);
      if (res && res !== S.r && res === 'GOAL!') S.F.spark(ball ? ball.tx : 120, ball ? ball.ty : 80, ['#ffd23c', '#ffffff', '#3fd45a', '#e8231e'], 30, 130); S.r = res; S.F.draw(g);
      for (let i = 0; i < 5; i++) K.put(g, K.ball(5, i < marks.length ? (marks[i] ? '#3fd45a' : '#e8231e') : '#59627a'), 94 + i * 13, 304);
      if (res) { K.box(g, 0, 158, 240, 38, 'rgba(13,11,20,.78)'); K.box(g, 0, 158, 240, 2, '#ffd23c'); K.box(g, 0, 194, 240, 2, '#ffd23c'); A.text(g, res, 122, 169, '#140e1c', 4, 'center'); A.text(g, res, 120, 167, res === 'GOAL!' ? '#ffd23c' : '#ffffff', 4, 'center'); } }
  };
} });
