Arcade.game('ninja-dash', { w: 160, h: 120,
help: 'The ninja runs by himself. Tap, click or press Space to jump — and once more in the air for a double jump. Jump over the spikes, stay low under the flying stars, and collect the coins.',
init(A) {
  const NIN = [0, 1].map(f => A.spr(['..kkkk..', '.kkkkkk.', '.rrrrrr.', '.kwkkwk.', '.kkkkkk.', '..kkkk..', '.kkkkkk.', 'kkkkkkkk', '.kkkkkk.', f ? '.kk..kk.' : '..kkkk..', f ? 'kk....kk' : '..k..k..', f ? 'k......k' : '..k..k..'], { k: '#f2f5f8', r: '#e8231e', w: '#12101c' }));
  const GY = 128; let y = GY - 12, vy = 0, jumps = 0, sp = 110, dist = 0, obs = [], coins = [], next = 200, t = 0, far = 0;
  const jump = () => { if (jumps < 2) { vy = jumps ? -230 : -260; jumps++; A.beep(jumps > 1 ? 760 : 560, .05); } };
  return {
    key(k) { if (k === 'a' || k === 'up') jump(); }, tap() { jump(); },
    update(dt) { t += dt; sp = Math.min(190, sp + 2.4 * dt); dist += sp * dt; vy += 720 * dt; y += vy * dt; if (y >= GY - 12) { y = GY - 12; vy = 0; jumps = 0; }
      next -= sp * dt; if (next <= 0) { const k = Math.random(); if (k < .55) { const w = A.ri(1, 3) * 8; obs.push({ x: 170, y: GY - 12, w, h: 12, k: 0 }); } else if (k < .8) obs.push({ x: 170, y: GY - 34, w: 10, h: 10, k: 1 }); else for (let i = 0; i < 4; i++) coins.push({ x: 170 + i * 14, y: GY - 30 - Math.sin(i / 3 * Math.PI) * 26 }); next = A.rnd(.75, 1.25) * (90 + sp * .55); }
      for (const o of obs) { o.x -= sp * dt * (o.k ? 1.25 : 1); if (40 + 7 > o.x && 40 + 1 < o.x + o.w && y + 12 > o.y + 2 && y < o.y + o.h - 2) { A.beep(150, .3, 'sawtooth'); A.over(); return; } }
      for (const c of coins) { c.x -= sp * dt; if (!c.got && Math.abs(c.x - 44) < 8 && Math.abs(c.y - y - 6) < 10) { c.got = 1; A.add(25); A.beep(1100, .04, 'triangle'); } }
      obs = obs.filter(o => o.x > -30); coins = coins.filter(c => c.x > -10 && !c.got); const d = Math.floor(dist / 20); if (d > far) { A.add(d - far); far = d; } A.info('SPEED ' + Math.round(sp / 11)); },
    draw(g) { const K = Art, NO = { id: 'nd', skin: '#f0b890', shirt: '#3a4152', pants: '#2a2f3d', hat: 'hood', hatc: '#3a4152', shoe: '#12101c' }, air = y < GY - 12; g.save(); g.translate(0, -40);
      g.drawImage(K.T.sky(160, 170, ['#12143a', '#3a2a6a', '#a04a6a', '#ffb070']), 0, 0); K.put(g, K.ball(10, '#ffe9c0'), 126, 62); K.box(g, 121, 58, 3, 3, '#e0c8a0'); K.box(g, 129, 65, 2, 2, '#e0c8a0');
      for (let i = -1; i < 9; i++) { const x = i * 24 - (dist * .12) % 24, h = 22 + ((i + Math.floor(dist * .12 / 24)) * 31 % 26 + 26) % 26; K.box(g, x, GY - h, 20, h, '#2a2050'); K.box(g, x, GY - h, 20, 1, '#4a3a7a'); }
      for (let i = -1; i < 6; i++) { const n = i + Math.floor(dist * .3 / 40), x = i * 40 - (dist * .3) % 40, h = 30 + (n * 37 % 30 + 30) % 30; K.put(g, K.building(26, h, (n % 3 + 3) % 3), x + 13, GY - h / 2 - 3); }
      const rf = K.T.brick(64, 64, '#3a3050'); K.scroll(g, rf, dist, 0, 160, 0); for (let x = -(Math.round(dist) % 64); x < 160; x += 64) g.drawImage(rf, 0, 0, 64, 42, x, GY, 64, 42); K.box(g, 0, GY, 160, 3, '#8a94a4'); K.box(g, 0, GY, 160, 1, '#d6dbea'); K.box(g, 0, GY + 3, 160, 1, '#140e1c');
      for (const o of obs) { const x = Math.round(o.x); if (o.k) K.put(g, K.shur(Math.floor(t * 14) % 2), x + 5, o.y + 5); else for (let k = 0; k < o.w; k += 8) K.put(g, K.spike(), x + k + 4, o.y + 6); }
      for (const c of coins) K.put(g, K.coin(Math.floor(t * 8) % 4), c.x, c.y);
      K.shadow(g, 45, GY + 1, air ? 3 : 5, 1.5); K.box(g, 30 - (air ? 2 : 0), Math.round(y) - 6 + Math.floor(dist / 10) % 2, 9, 1, '#e8231e'); K.put(g, K.guy(NO, air ? 3 : 1 + Math.floor(dist / 9) % 2), 44, y - 2); g.restore(); }
  };
} });
