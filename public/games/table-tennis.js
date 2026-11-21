Arcade.game('table-tennis', { w: 240, h: 320, pad: 'dpad',
help: 'Your bat follows your finger or the mouse anywhere on your half of the table (or use the arrow keys). Move the bat forward as you hit to smash the ball faster. First to 11 points wins.',
init(A) {
  const pw = 30; let px = 120, py = 285, pvy = 0, pvx = 0, cx = 120, b, me = 0, cpu = 0, wait, dir = 1;
  const info = () => A.info('CPU ' + cpu + '  :  ' + me + ' YOU');
  function serve(d) { b = { x: 120, y: 160, vx: 0, vy: 0 }; dir = d; wait = 1; info(); }
  serve(1);
  return {
    update(dt) { const ox = px, oy = py, k = A.keys; px += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 200 * dt; py += ((k.down ? 1 : 0) - (k.up ? 1 : 0)) * 160 * dt;
      const p = A.ptrs[0] || (A.ptr.moved ? A.ptr : null); if (p) { px = p.x; py = p.y - (A.ptrs.length ? 18 : 0); } px = Math.max(pw / 2, Math.min(240 - pw / 2, px)); py = Math.max(180, Math.min(306, py)); if (dt > 0) { pvx = (px - ox) / dt; pvy = (py - oy) / dt; }
      const t = b.vy < 0 ? b.x + b.vx * .12 : 120, m = (95 + (me + cpu) * 4) * dt; cx += Math.max(-m, Math.min(m, t - cx)); cx = Math.max(pw / 2, Math.min(240 - pw / 2, cx));
      if (wait > 0) { wait -= dt; if (wait <= 0) { b.vx = A.rnd(-40, 40); b.vy = 150 * dir; } return; }
      for (let i = 0; i < 3; i++) { b.x += b.vx * dt / 3; b.y += b.vy * dt / 3; if (b.x < 4) { b.x = 4; b.vx = Math.abs(b.vx); } if (b.x > 236) { b.x = 236; b.vx = -Math.abs(b.vx); }
        if (b.vy > 0 && Math.abs(b.y - py) < 7 && Math.abs(b.x - px) < pw / 2 + 4) { const s = Math.max(170, Math.min(400, Math.abs(b.vy) + 14 + Math.max(0, -pvy) * .45)); b.vy = -s; b.vx = (b.x - px) * 6 + pvx * .25; b.y = py - 7; A.beep(s > 300 ? 660 : 440, .05); }
        if (b.vy < 0 && Math.abs(b.y - 30) < 7 && Math.abs(b.x - cx) < pw / 2 + 4) { b.vy = Math.min(360, Math.abs(b.vy) + 8); b.vx = (b.x - cx) * 6 + A.rnd(-30, 30); b.y = 37; A.beep(330, .05); } }
      if (b.y < -8) { me++; A.add(50); A.beep(700, .15, 'triangle'); if (me >= 11) { info(); A.over(true); return; } serve(-1); } else if (b.y > 328) { cpu++; A.beep(200, .2, 'sawtooth'); if (cpu >= 11) { info(); A.over(false); return; } serve(1); } },
    draw(g) { g.fillStyle = '#12382a'; g.fillRect(0, 0, 240, 320); g.fillStyle = '#000'; g.fillRect(7, 11, 226, 298); g.fillStyle = '#1f5fa8'; g.fillRect(8, 12, 224, 296); g.fillStyle = '#2a6fc0'; for (let y = 12; y < 308; y += 16) for (let x = 8 + ((y - 12) / 16 % 2) * 16; x < 232; x += 32) g.fillRect(x, y, 16, 16);
      g.fillStyle = '#f2f5f8'; g.fillRect(8, 12, 224, 2); g.fillRect(8, 306, 224, 2); g.fillRect(8, 12, 2, 296); g.fillRect(230, 12, 2, 296); g.fillRect(119, 12, 2, 296); g.fillStyle = '#000'; g.fillRect(2, 157, 236, 6); g.fillStyle = '#d6dbea'; g.fillRect(2, 158, 236, 4); g.fillStyle = '#8a94a4'; for (let x = 4; x < 238; x += 4) g.fillRect(x, 159, 1, 2);
      A.text(g, cpu, 30, 120, 'rgba(255,255,255,.3)', 6, 'center'); A.text(g, me, 30, 176, 'rgba(255,255,255,.3)', 6, 'center');
      const bat = (x, y, c1, c2) => { x = Math.round(x); y = Math.round(y); g.fillStyle = '#000'; g.fillRect(x - pw / 2 - 1, y - 5, pw + 2, 10); g.fillStyle = c1; g.fillRect(x - pw / 2, y - 4, pw, 8); g.fillStyle = c2; g.fillRect(x - pw / 2, y - 4, pw, 2); g.fillStyle = '#c89a5a'; g.fillRect(x - 3, y - 2, 6, 4); }; bat(cx, 30, '#3f6ad0', '#9fb4e6'); bat(px, py, '#e8231e', '#ff8a7a');
      const x = Math.round(b.x), y = Math.round(b.y); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x - 2, y + 2, 6, 4); g.fillStyle = '#000'; g.fillRect(x - 4, y - 4, 8, 8); g.fillStyle = '#fff'; g.fillRect(x - 3, y - 3, 6, 6); g.fillStyle = '#ffd98a'; g.fillRect(x, y, 3, 3); }
  };
} });
