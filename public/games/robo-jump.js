Arcade.game('robo-jump', { w: 180, h: 280, pad: 'lr',
help: 'The robot bounces by itself. Steer it left / right with the arrow keys, the buttons, or by holding your finger on the side you want to go. Brown platforms break, blue ones move, yellow springs shoot you up. Do not fall!',
init(A) {
  const BOT = A.spr(['...yy.....', '..oooooo..', '.obbbbbbo.', 'obwkbbwkbo', 'obbbbbbbbo', 'obbrrrrbbo', '.obbbbbbo.', '.oooooooo.', '.ob....bo.', '.oo....oo.'], { o: '#12101c', b: '#ff9a2a', w: '#ffffff', k: '#12101c', r: '#e8231e', y: '#ffd23c' });
  const pl = { x: 85, y: 220, vx: 0, vy: -330 }; let cam = 0, plats = [{ x: 70, y: 250, t: 0, vx: 0 }], top = 250, best = 0;
  function gen() { while (top > cam - 40) { top -= A.ri(30, Math.min(64, 40 + best / 40)); const k = Math.random(), t = best > 30 && k < .16 ? 2 : best > 15 && k < .34 ? 1 : k > .92 ? 3 : 0; plats.push({ x: A.ri(4, 144), y: top, t, vx: t === 1 ? (Math.random() < .5 ? -40 : 40) : 0 }); } plats = plats.filter(p => p.y < cam + 300 && !p.gone); }
  gen();
  return {
    update(dt) { let d = (A.keys.right ? 1 : 0) - (A.keys.left ? 1 : 0); if (!d && A.ptr.down && Math.abs(A.ptr.x - pl.x - 8) > 6) d = A.ptr.x > pl.x + 8 ? 1 : -1; pl.vx += (d * 130 - pl.vx) * Math.min(1, dt * 12); pl.x = (pl.x + pl.vx * dt + 180) % 180;
      const pb = pl.y + 10; pl.vy += 620 * dt; pl.y += pl.vy * dt;
      for (const p of plats) { if (p.t === 1) { p.x += p.vx * dt; if (p.x < 2 || p.x > 146) p.vx *= -1; }
        if (pl.vy > 0 && !p.gone && pl.x + 14 > p.x && pl.x + 2 < p.x + 32 && pb <= p.y + 2 && pl.y + 10 >= p.y) { pl.y = p.y - 10; pl.vy = p.t === 3 ? -520 : -335; A.beep(p.t === 3 ? 900 : 440, .05); if (p.t === 2) p.gone = 1; } }
      if (pl.y < cam + 120) cam = pl.y - 120; gen(); const h = Math.floor((220 - cam - 120) / 10); if (h > best) { A.add(h - best); best = h; } A.info('HEIGHT ' + best + ' M');
      if (pl.y > cam + 290) { A.beep(150, .3, 'sawtooth'); A.over(); } },
    draw(g) { ['#1b3f7a', '#2a5fa8', '#3f86d0', '#6fb0e6'].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 70, 180, 70); });
      g.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 5; i++) { const y = ((i * 97 - cam * .3) % 320 + 320) % 320 - 20, x = (i * 71) % 150; g.fillRect(x, y, 34, 8); g.fillRect(x + 6, y - 5, 20, 5); }
      for (const p of plats) { const x = Math.round(p.x), y = Math.round(p.y - cam), c = [['#3fd45a', '#a8f0a0', '#1f7a2a'], ['#3fa8e0', '#b8e6ff', '#1f5f9a'], ['#9a6a34', '#d8aa6a', '#5a3418'], ['#3fd45a', '#a8f0a0', '#1f7a2a']][p.t];
        g.fillStyle = '#000'; g.fillRect(x - 1, y - 1, 34, 8); g.fillStyle = c[0]; g.fillRect(x, y, 32, 6); g.fillStyle = c[1]; g.fillRect(x, y, 32, 2); g.fillStyle = c[2]; g.fillRect(x, y + 4, 32, 2); if (p.t === 2) { g.fillStyle = '#5a3418'; g.fillRect(x + 10, y, 1, 6); g.fillRect(x + 21, y, 1, 6); } if (p.t === 3) { g.fillStyle = '#000'; g.fillRect(x + 11, y - 6, 10, 6); g.fillStyle = '#ffd23c'; g.fillRect(x + 12, y - 5, 8, 2); g.fillStyle = '#aab4c2'; g.fillRect(x + 13, y - 3, 6, 3); } }
      const X = Math.round(pl.x), Y = Math.round(pl.y - cam); g.drawImage(BOT, X - 2, Y - 10, 20, 20); if (X > 162) g.drawImage(BOT, X - 182, Y - 10, 20, 20); if (pl.vy < -200) { g.fillStyle = '#ffd23c'; g.fillRect(X + 2, Y + 10, 3, 5); g.fillRect(X + 11, Y + 10, 3, 5); } }
  };
} });
