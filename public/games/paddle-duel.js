Arcade.game('paddle-duel', { w: 240, h: 320, arrowsOnly: true,
help: 'Bottom player: finger, mouse or the arrow keys. Top player: touch the top half of the screen or use A and D. Until someone plays the top paddle, the computer does. First to 7 points wins.',
init(A) {
  const pw = 48, cl = v => Math.max(pw / 2, Math.min(240 - pw / 2, v));
  let bx = 120, tx = 120, human = false, sb = 0, stp = 0, b, sp, wait;
  function serve(d) { b = { x: 120, y: 160, vx: 0, vy: 0, d }; sp = 150; wait = 1; A.info(stp + ' : ' + sb); }
  function hit(p, d) { sp = Math.min(360, sp + 12); const a = (b.x - p) / (pw / 2) * .95; b.vx = sp * Math.sin(a); b.vy = sp * Math.cos(a) * d; A.beep(d < 0 ? 440 : 330, .05); }
  function point(d) { A.beep(700, .15, 'triangle'); A.info(stp + ' : ' + sb); if (sb >= 7) A.over(true); else if (stp >= 7) A.over(false); else serve(d); }
  serve(1);
  return {
    update(dt) { if (A.keys.left) bx -= 240 * dt; if (A.keys.right) bx += 240 * dt; if (A.raw.a) { tx -= 240 * dt; human = true; } if (A.raw.d) { tx += 240 * dt; human = true; }
      for (const p of A.ptrs) { if (p.y > 160) bx = p.x; else { tx = p.x; human = true; } }
      if (A.ptr.moved && !A.ptrs.length && A.ptr.y > 160) bx = A.ptr.x;
      if (!human) { const t = b.vy < 0 ? b.x : 120, m = 115 * dt; tx += Math.max(-m, Math.min(m, t - tx)); }
      bx = cl(bx); tx = cl(tx);
      if (wait > 0) { wait -= dt; if (wait <= 0) { const a = A.rnd(-.5, .5); b.vx = sp * Math.sin(a); b.vy = sp * Math.cos(a) * b.d; } return; }
      for (let i = 0; i < 2; i++) { b.x += b.vx * dt / 2; b.y += b.vy * dt / 2;
        if (b.x < 4) { b.x = 4; b.vx = Math.abs(b.vx); } if (b.x > 236) { b.x = 236; b.vx = -Math.abs(b.vx); }
        if (b.vy > 0 && b.y >= 296 && b.y <= 305 && Math.abs(b.x - bx) < pw / 2 + 3) { b.y = 295; hit(bx, -1); }
        if (b.vy < 0 && b.y <= 24 && b.y >= 15 && Math.abs(b.x - tx) < pw / 2 + 3) { b.y = 25; hit(tx, 1); } }
      if (b.y < -8) { sb++; A.add(100); point(1); } else if (b.y > 328) { stp++; point(-1); } },
    draw(g) { g.fillStyle = '#0f3a2a'; g.fillRect(0, 0, 240, 320); g.fillStyle = '#145238'; for (let y = 0; y < 320; y += 16) for (let x = (y / 16 % 2) * 16; x < 240; x += 32) g.fillRect(x, y, 16, 16);
      g.fillStyle = '#d6f5e6'; for (let x = 4; x < 240; x += 16) g.fillRect(x, 159, 8, 2); g.fillRect(0, 0, 240, 2); g.fillRect(0, 318, 240, 2); g.fillRect(0, 0, 2, 320); g.fillRect(238, 0, 2, 320);
      A.text(g, stp, 120, 110, 'rgba(255,255,255,.22)', 8, 'center'); A.text(g, sb, 120, 176, 'rgba(255,255,255,.22)', 8, 'center');
      const pd = (x, y, c1, c2) => { x = Math.round(x - pw / 2); g.fillStyle = '#000'; g.fillRect(x - 1, y - 1, pw + 2, 9); g.fillStyle = c1; g.fillRect(x, y, pw, 7); g.fillStyle = c2; g.fillRect(x, y, pw, 2); };
      pd(tx, 14, '#e8231e', '#ff8a7a'); pd(bx, 300, '#2fc4ba', '#c8fffa');
      const x = Math.round(b.x), y = Math.round(b.y); g.fillStyle = '#000'; g.fillRect(x - 4, y - 4, 8, 8); g.fillStyle = '#fff'; g.fillRect(x - 3, y - 3, 6, 6); }
  };
} });
