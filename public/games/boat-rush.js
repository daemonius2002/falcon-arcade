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
    draw(g) { for (let y = 0; y < 320; y += 4) { const w = s + (320 - y), c = cx(w), h = hw(w), l = Math.round(c - h), r = Math.round(c + h), q = Math.floor(w / 4); g.fillStyle = q % 6 < 3 ? '#2f7a3a' : '#2a7034'; g.fillRect(0, y, 240, 4); g.fillStyle = '#ecd9a0'; g.fillRect(l - 4, y, r - l + 8, 4); g.fillStyle = '#1b6fb0'; g.fillRect(l, y, r - l, 4); if (q % 5 === 0) { g.fillStyle = '#4f9cd6'; g.fillRect(l + 6 + (q * 37) % Math.max(1, r - l - 20), y, 8, 1); } if (q % 9 === 0) { g.fillStyle = '#1f5a28'; g.fillRect((q * 53) % 240 < l - 14 ? (q * 53) % 240 : r + 10 + (q * 17) % 20, y, 8, 8); } }
      for (const o of obs) { const X = Math.round(cx(o.w) + o.off), Y = Math.round(320 - (o.w - s)); if (o.k) { g.fillStyle = '#ffd23c'; for (let i = 0; i < 2; i++) for (let k = 0; k < 5; k++) g.fillRect(X - 8 + k * 2 + (k > 2 ? 0 : 0), Y - 2 + i * 6 + Math.abs(k - 2) * 2 - 4, 2 + (k === 2 ? 2 : 0), 2); g.fillStyle = '#fff6c8'; g.fillRect(X - 1, Y - 6, 2, 2); }
        else { g.fillStyle = '#000'; g.fillRect(X - 8, Y - 6, 16, 12); g.fillStyle = '#6a7284'; g.fillRect(X - 7, Y - 5, 14, 10); g.fillStyle = '#a0a8ba'; g.fillRect(X - 6, Y - 5, 8, 4); g.fillStyle = '#b8e6ff'; g.fillRect(X - 9, Y + 6, 18, 1); } }
      if (inv <= 0 || Math.floor(inv * 10) % 2) { const X = Math.round(x), Y = 250; g.fillStyle = '#b8e6ff'; g.fillRect(X - 4, Y + 12, 2, 8 + (s % 8 < 4 ? 3 : 0)); g.fillRect(X + 2, Y + 12, 2, 8 + (s % 8 < 4 ? 0 : 3)); g.fillStyle = '#000'; g.fillRect(X - 6, Y - 8, 12, 22); g.fillRect(X - 4, Y - 12, 8, 4); g.fillStyle = '#f2f5f8'; g.fillRect(X - 5, Y - 7, 10, 20); g.fillRect(X - 3, Y - 11, 6, 4); g.fillStyle = '#e8231e'; g.fillRect(X - 5, Y + 2, 10, 3); g.fillStyle = '#16223a'; g.fillRect(X - 3, Y - 4, 6, 4); g.fillStyle = '#9a6a34'; g.fillRect(X - 3, Y + 7, 6, 4); } }
  };
} });
