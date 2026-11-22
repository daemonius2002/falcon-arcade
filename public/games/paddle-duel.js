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
    draw(g) { const K = Art, S = this.S || (this.S = { F: K.fx(), tr: [] }); K.scroll(g, K.T.stone(64, 64, '#123a4a'), 0, 0, 240, 320);
      K.box(g, 0, 0, 240, 3, '#5fe3d6'); K.box(g, 0, 317, 240, 3, '#5fe3d6'); K.box(g, 0, 0, 3, 320, '#5fe3d6'); K.box(g, 237, 0, 3, 320, '#5fe3d6'); for (let x = 6; x < 236; x += 16) K.box(g, x, 159, 8, 2, '#c8fffa'); K.box(g, 96, 136, 48, 1, '#2f8a9a'); K.box(g, 96, 183, 48, 1, '#2f8a9a'); K.box(g, 96, 136, 1, 48, '#2f8a9a'); K.box(g, 143, 136, 1, 48, '#2f8a9a');
      A.text(g, stp, 122, 102, 'rgba(0,0,0,.35)', 8, 'center'); A.text(g, stp, 120, 100, '#ff8a7a', 8, 'center'); A.text(g, sb, 122, 182, 'rgba(0,0,0,.35)', 8, 'center'); A.text(g, sb, 120, 180, '#5fe3d6', 8, 'center');
      K.shadow(g, tx + 2, 23, pw / 2, 2); K.put(g, K.paddle(pw, '#e8231e'), tx, 18); K.shadow(g, bx + 2, 309, pw / 2, 2); K.put(g, K.paddle(pw, '#2fc4ba'), bx, 304);
      S.tr.push([b.x, b.y]); if (S.tr.length > 7) S.tr.shift(); S.tr.forEach((q, i) => { g.fillStyle = `rgba(200,255,250,${i / 16})`; g.fillRect(Math.round(q[0]) - 2, Math.round(q[1]) - 2, 4, 4); }); K.put(g, K.ball(4, '#ffffff'), b.x, b.y); S.F.draw(g); }
  };
} });
