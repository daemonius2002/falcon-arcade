Arcade.game('boat-rush', { w: 240, h: 320, pad: 'lr',
help: 'Steer the boat down the winding river with your finger, the mouse or the arrow keys. Stay off the banks and the rocks, and drive over the yellow arrows for a speed boost and extra points.',
init(A) {
  const cx = w => 120 + Math.sin(w * .011) * 44 + Math.sin(w * .027) * 16, hw = w => Math.max(34, 60 - w / 900);
  let s = 0, x = 120, sp = 90, boost = 0, lives = 3, inv = 0, obs = [], nextW = 500, far = 0;
  function spawn() { while (nextW < s + 420) { const k = Math.random() < .3; obs.push({ w: nextW, off: A.rnd(-1, 1) * (hw(nextW) - 14), k }); nextW += A.rnd(70, 140); } obs = obs.filter(o => o.w > s - 40 && !o.got); }
  return {
    update(dt) { sp = Math.min(210, sp + 2.5 * dt); boost -= dt; const v = sp * (boost > 0 ? 1.5 : 1); s += v * dt; inv -= dt; if (A.keys.left) x -= 140 * dt; if (A.keys.right) x += 140 * dt; if (A.ptr.moved || A.ptr.down) x += Math.max(-190 * dt, Math.min(190 * dt, A.ptr.x - x));
      spawn(); const w = s + 70, c = cx(w), h = hw(w); let hit = inv <= 0 && (x < c - h + 6 || x > c + h - 6);
      for (const o of obs) { const ox = cx(o.w) + o.off, oy = 320 - (o.w - s); if (Math.abs(ox - x) < (o.k ? 14 : 11) && Math.abs(oy - 250) < 14) { if (o.k) { o.got = 1; boost = 1.5; A.add(50); A.beep(900, .1, 'triangle'); } else if (inv <= 0) hit = true; } }
      if (hit) { lives--; inv = 1.6; sp = 90; boost = 0; x = c; A.beep(130, .35, 'sawtooth'); if (lives <= 0) { A.info('LIVES 0'); A.over(); return; } } x = Math.max(8, Math.min(232, x));
      const d = Math.floor(s / 30); if (d > far) { A.add(d - far); far = d; } A.info('LIVES ' + lives + (boost > 0 ? '  BOOST!' : '')); },
    draw(g) { const K = Art, S = this.S || (this.S = { F: K.fx(), inv: 0 }); K.scroll(g, K.T.grass(64, 64), 0, -s, 240, 320);
      for (let y = 0; y < 320; y += 4) { const w = s + (320 - y), c = cx(w), hh = hw(w), l = Math.round(c - hh), r = Math.round(c + hh), q = Math.floor(w / 4); K.box(g, l - 6, y, r - l + 12, 4, '#140e1c'); K.box(g, l - 5, y, r - l + 10, 4, '#ecd9a0'); K.box(g, l - 2, y, r - l + 4, 4, '#c8b070'); K.box(g, l, y, r - l, 4, '#3f96d6'); K.box(g, l + 5, y, r - l - 10, 4, q % 8 < 4 ? '#1b6fb0' : '#1f76b8'); K.box(g, l + 14, y, r - l - 28, 4, '#16609c'); if (q % 5 === 0) K.box(g, l + 8 + (q * 37) % Math.max(1, r - l - 24), y + 1, 7, 1, '#7fc0f0'); }
      for (let q = Math.floor(s / 36); q < Math.floor(s / 36) + 11; q++) { const w = q * 36, y = 320 - (w - s), c = cx(w), hh = hw(w), left = q % 2, tx = left ? c - hh - 16 - (q * 13) % 22 : c + hh + 16 + (q * 17) % 22; if (tx > 4 && tx < 236) { K.shadow(g, tx + 3, y + 5, 8, 5); K.put(g, K.tree(q % 3 ? 9 : 7, q % 4), tx, y); } }
      const bs = K.spr('brboost', 16, 14, q => { for (const y of [-6, 1]) K.part(q, [-7, y + 5, 0, y, 7, y + 5, 7, y + 8, 0, y + 3, -7, y + 8], K.lin(q, 0, y, 0, y + 8, '#fff6c8', '#ffd23c', '#c8801e')); });
      for (const o of obs) { const X = cx(o.w) + o.off, Y = 320 - (o.w - s); if (o.k) K.put(g, bs, X, Y + Math.round(Math.sin(performance.now() / 150))); else { K.box(g, Math.round(X) - 9, Math.round(Y) + 6, 18, 2, '#b8e6ff'); K.put(g, K.rock(8, Math.round(o.w) % 3, '#8a94a4'), X, Y); } }
      if (inv > S.inv + .5) S.F.boom(x, 248, 1); S.inv = inv; S.F.puff(x - 4, 264, '#b8e6ff', 50); S.F.puff(x + 4, 264, '#e6f5ff', 50); S.F.draw(g);
      if (inv <= 0 || Math.floor(inv * 10) % 2) K.put(g, K.boat(), x, 250); if (boost > 0) { K.box(g, Math.round(x) - 3, 266, 2, 8, '#ffd23c'); K.box(g, Math.round(x) + 1, 266, 2, 8, '#ffd23c'); } }
  };
} });
