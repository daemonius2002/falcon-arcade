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
    draw(g) { const K = Art, S = this.S || (this.S = { tr: [] }); K.scroll(g, K.T.wood(64, 64), 0, 0, 240, 320); g.fillStyle = 'rgba(20,8,0,.35)'; g.fillRect(0, 0, 240, 320);
      K.box(g, 12, 18, 224, 296, 'rgba(0,0,0,.35)'); K.box(g, 7, 11, 226, 298, '#140e1c'); const tb = K.tex('tttab', 64, 64, { base: '#1f62b0', tile: 1, blobs: [['#3f82d0', .35, 6, 16, 40]], L: 14 }); g.save(); g.beginPath(); g.rect(8, 12, 224, 296); g.clip(); K.scroll(g, tb, 0, 0, 240, 320); g.restore();
      for (const [a, b, c, d] of [[8, 12, 224, 3], [8, 305, 224, 3], [8, 12, 3, 296], [229, 12, 3, 296], [119, 12, 2, 296]]) K.box(g, a, b, c, d, '#f2f5f8');
      A.text(g, cpu, 30, 120, 'rgba(255,255,255,.3)', 6, 'center'); A.text(g, me, 30, 176, 'rgba(255,255,255,.3)', 6, 'center');
      K.box(g, 2, 162, 236, 3, 'rgba(0,0,0,.3)'); K.box(g, 1, 156, 238, 8, '#140e1c'); K.box(g, 2, 157, 236, 6, '#d6dbea'); K.box(g, 2, 157, 236, 1, '#ffffff'); for (let x = 4; x < 238; x += 3) K.box(g, x, 159, 1, 3, '#8a94a4'); K.box(g, 0, 154, 4, 12, '#5c6678'); K.box(g, 236, 154, 4, 12, '#5c6678');
      const bat = c => K.spr('ttbat' + c, 30, 14, q => { K.box(q, -3, 1, 6, 6, '#c89a5a'); K.box(q, -3, 1, 2, 6, '#e0b878'); K.rr(q, -15, -6, 30, 9, 4, K.lin(q, 0, -6, 0, 3, K.lite(c, .45), c, K.dark(c, .45))); K.box(q, -11, -4, 22, 1, K.lite(c, .6)); });
      K.shadow(g, cx + 2, 36, 14, 3); K.put(g, bat('#3f6ad0'), cx, 30, { rot: Math.PI }); K.shadow(g, px + 2, py + 6, 14, 3); K.put(g, bat('#e8231e'), px, py);
      S.tr.push([b.x, b.y]); if (S.tr.length > 6) S.tr.shift(); S.tr.forEach((q, i) => { g.fillStyle = `rgba(255,255,255,${i / 16})`; g.fillRect(Math.round(q[0]) - 1, Math.round(q[1]) - 1, 3, 3); }); K.shadow(g, b.x + 2, b.y + 4, 3, 2); K.put(g, K.ball(3, '#fff6c8'), b.x, b.y); }
  };
} });
