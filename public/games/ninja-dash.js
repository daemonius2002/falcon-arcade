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
    draw(g) { g.save(); g.translate(0, -40); ['#12143a', '#2a1f5a', '#5a2a6a', '#a04a5a'].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 34, 240, 40); }); g.fillStyle = '#ffe9c0'; g.fillRect(120, 50, 18, 18); g.fillStyle = '#2a1f5a'; g.fillRect(120, 50, 3, 3); g.fillRect(135, 50, 3, 3); g.fillRect(120, 65, 3, 3); g.fillRect(135, 65, 3, 3);
      for (let i = -1; i < 6; i++) { const x = i * 56 - (dist * .2) % 56, h = 40 + ((i + Math.floor(dist * .2 / 56)) * 37 % 30); g.fillStyle = '#1b1438'; g.fillRect(x, GY - h, 40, h); g.fillRect(x + 12, GY - h - 8, 16, 8); g.fillStyle = '#ffd98a'; for (let yy = GY - h + 6; yy < GY - 6; yy += 10) g.fillRect(x + 8 + (yy % 3) * 8, yy, 3, 4); }
      g.fillStyle = '#2a2438'; g.fillRect(0, GY, 240, 32); g.fillStyle = '#59627a'; g.fillRect(0, GY, 240, 2); g.fillStyle = '#1b1830'; for (let x = -(dist % 24); x < 240; x += 24) { g.fillRect(x, GY + 2, 1, 30); g.fillRect(x + 6, GY + 12, 12, 2); }
      for (const o of obs) { const x = Math.round(o.x); if (o.k) { const r = Math.floor(t * 12) % 2; g.fillStyle = '#000'; g.fillRect(x - 1, o.y - 1, 12, 12); g.fillStyle = '#d6dbea'; if (r) { g.fillRect(x + 4, o.y, 2, 10); g.fillRect(x, o.y + 4, 10, 2); } else { for (let i = 0; i < 5; i++) { g.fillRect(x + i * 2, o.y + i * 2, 2, 2); g.fillRect(x + 8 - i * 2, o.y + i * 2, 2, 2); } } g.fillStyle = '#e8231e'; g.fillRect(x + 4, o.y + 4, 2, 2); }
        else for (let k = 0; k < o.w; k += 8) { g.fillStyle = '#000'; g.fillRect(x + k, o.y + 8, 8, 4); g.fillRect(x + k + 1, o.y + 4, 6, 4); g.fillRect(x + k + 3, o.y, 2, 4); g.fillStyle = '#d6dbea'; g.fillRect(x + k + 1, o.y + 9, 6, 3); g.fillRect(x + k + 2, o.y + 5, 4, 4); g.fillRect(x + k + 3, o.y + 1, 2, 4); } }
      for (const c of coins) { const x = Math.round(c.x); g.fillStyle = '#000'; g.fillRect(x - 4, c.y - 4, 8, 8); g.fillStyle = '#ffd23c'; g.fillRect(x - 3, c.y - 3, 6, 6); g.fillStyle = '#fff6c8'; g.fillRect(x - 3, c.y - 3, 2, 2); }
      g.drawImage(NIN[y < GY - 12 ? 1 : Math.floor(dist / 12) % 2], 40, Math.round(y)); g.fillStyle = '#e8231e'; g.fillRect(34, Math.round(y) + 2 + Math.floor(dist / 12) % 2, 6, 1); g.restore(); }
  };
} });
