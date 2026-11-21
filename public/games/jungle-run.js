Arcade.game('jungle-run', { w: 160, h: 140, pad: 'lr', a: 'JUMP',
help: 'Run with left / right and jump with Space, up or JUMP (hold for a higher jump). Collect fruit, jump on the snails, and do not fall into the gaps.',
init(A) {
  const HERO = A.spr(['..rrrr..', '.rrrrrr.', '..ssss..', '..swsw..', '..ssss..', '.bbbbbb.', 'sbbbbbbs', 'sbbbbbbs', '..dddd..', '..d..d..', '..d..d..', '.kk..kk.'], { r: '#e8231e', s: '#f0b890', w: '#12101c', b: '#3fa8e0', d: '#5a4a6a', k: '#12101c' });
  const pl = { x: 40, y: 100, vx: 0, vy: 0, on: false, f: 1 }; let cam = 0, plats = [{ x: -40, y: 144, w: 200, g: 1 }], items = [], foes = [], gx = 190, far = 0;
  function gen() { while (gx < cam + 520) { const w = A.ri(4, 9) * 16, y = 132 + A.ri(0, 2) * 12; plats.push({ x: gx, y, w, g: 1 }); if (w > 80 && Math.random() < .6) foes.push({ x: gx + w / 2, y: y - 8, l: gx + 6, r: gx + w - 16, d: 1 });
      if (Math.random() < .6) { const px = gx + A.ri(1, 3) * 16, py = y - A.ri(38, 50); plats.push({ x: px, y: py, w: 48 }); for (let i = 0; i < 3; i++) items.push({ x: px + 8 + i * 16, y: py - 12 }); } else for (let i = 0; i < w / 32; i++) items.push({ x: gx + 12 + i * 32, y: y - 14 });
      gx += w + A.ri(24, 44); } plats = plats.filter(p => p.x + p.w > cam - 40); }
  const jump = () => { if (pl.on) { pl.vy = -225; pl.on = false; A.beep(520, .06); } };
  gen();
  return {
    key(k) { if (k === 'a' || k === 'up') jump(); }, tap() { jump(); },
    update(dt) { const dir = (A.keys.right ? 1 : 0) - (A.keys.left ? 1 : 0); if (dir) pl.f = dir; pl.x = Math.max(cam, pl.x + dir * 82 * dt);
      pl.vy += (pl.vy < 0 && !(A.keys.a || A.keys.up || A.ptr.down) ? 1100 : 560) * dt; const pb = pl.y + 12; pl.y += pl.vy * dt; pl.on = false;
      if (pl.vy >= 0) for (const p of plats) if (pl.x + 7 > p.x && pl.x + 1 < p.x + p.w && pb <= p.y + 1 && pl.y + 12 >= p.y) { pl.y = p.y - 12; pl.vy = 0; pl.on = true; }
      cam = Math.max(cam, pl.x - 50); gen();
      for (const it of items) if (!it.got && Math.abs(it.x - pl.x - 4) < 9 && Math.abs(it.y - pl.y - 6) < 11) { it.got = 1; A.add(10); A.beep(1000, .05, 'triangle'); }
      for (const f of foes) { if (f.dead) continue; f.x += f.d * 22 * dt; if (f.x < f.l || f.x > f.r) f.d *= -1; if (Math.abs(f.x + 5 - pl.x - 4) < 8 && Math.abs(f.y + 4 - pl.y - 6) < 10) { if (pl.vy > 40 && pb < f.y + 5) { f.dead = 1; pl.vy = -170; A.add(50); A.beep(300, .08); } else { A.beep(150, .3, 'sawtooth'); A.over(); return; } } }
      const d = Math.floor(pl.x / 16); if (d > far) { A.add(d - far); far = d; } if (pl.y > 200) { A.beep(150, .3, 'sawtooth'); A.over(); } },
    draw(g) { g.save(); g.translate(0, -40); ['#0f3a2a', '#145238', '#1b6a44'].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 60, 240, 60); });
      for (let i = -1; i < 7; i++) { const x = i * 44 - (cam * .3) % 44; g.fillStyle = '#0c2a1e'; g.fillRect(x + 16, 40, 8, 140); g.fillRect(x, 24, 40, 30); g.fillRect(x + 6, 14, 28, 12); }
      for (let i = -1; i < 5; i++) { const x = i * 70 - (cam * .6) % 70; g.fillStyle = '#0f4a2e'; g.fillRect(x + 20, 70, 10, 110); g.fillRect(x, 50, 50, 30); g.fillRect(x + 8, 38, 34, 14); }
      for (const p of plats) { const x = Math.round(p.x - cam); if (p.g) { g.fillStyle = '#5a3418'; g.fillRect(x, p.y, p.w, 60); g.fillStyle = '#3a2010'; for (let k = 6; k < p.w - 4; k += 14) g.fillRect(x + k, p.y + 10 + (k % 3) * 6, 4, 3); g.fillStyle = '#3fb45a'; g.fillRect(x, p.y, p.w, 5); g.fillStyle = '#8ff08a'; g.fillRect(x, p.y, p.w, 1); g.fillStyle = '#1f7a2a'; for (let k = 3; k < p.w; k += 9) g.fillRect(x + k, p.y + 5, 3, 2); }
        else { g.fillStyle = '#2a1608'; g.fillRect(x, p.y, p.w, 8); g.fillStyle = '#9a6a34'; g.fillRect(x + 1, p.y + 1, p.w - 2, 3); g.fillStyle = '#6a3e1c'; g.fillRect(x + 1, p.y + 4, p.w - 2, 3); } }
      for (const it of items) if (!it.got) { const x = Math.round(it.x - cam); g.fillStyle = '#000'; g.fillRect(x - 4, it.y - 4, 8, 8); g.fillStyle = '#ff8a1e'; g.fillRect(x - 3, it.y - 3, 6, 6); g.fillStyle = '#ffd98a'; g.fillRect(x - 3, it.y - 3, 2, 2); g.fillStyle = '#3fd45a'; g.fillRect(x, it.y - 6, 2, 3); }
      for (const f of foes) if (!f.dead) { const x = Math.round(f.x - cam), y = f.y; g.fillStyle = '#000'; g.fillRect(x - 1, y - 1, 12, 9); g.fillStyle = '#b06ae0'; g.fillRect(x, y, 10, 7); g.fillStyle = '#e0c0ff'; g.fillRect(x + 2, y + 1, 5, 2); g.fillStyle = '#ffd98a'; g.fillRect(f.d > 0 ? x + 9 : x - 2, y + 3, 3, 4); g.fillStyle = '#12101c'; g.fillRect(f.d > 0 ? x + 10 : x - 1, y + 4, 1, 1); }
      const X = Math.round(pl.x - cam), Y = Math.round(pl.y); if (pl.f < 0) { g.save(); g.translate(X + 8, Y); g.scale(-1, 1); g.drawImage(HERO, 0, 0); g.restore(); } else g.drawImage(HERO, X, Y); g.restore(); }
  };
} });
