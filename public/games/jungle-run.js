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
    draw(g) { const K = Art, HO = { id: 'jr', skin: '#f0b890', shirt: '#3fa8e0', pants: '#5a4a6a', hat: 'cap', hatc: '#e8231e' }, t = performance.now() / 1000; g.save(); g.translate(0, -40);
      g.drawImage(K.T.sky(160, 180, ['#0f3a2a', '#1b6a44', '#5ab86a']), 0, 0);
      for (let i = -1; i < 6; i++) { const x = i * 40 - (cam * .25) % 40; K.box(g, x + 17, 70, 6, 110, '#0c2a1e'); K.put(g, K.tree(16, (i + Math.floor(cam * .25 / 40)) & 3), x + 20, 62, { a: .55 }); }
      for (let i = -1; i < 5; i++) { const x = i * 58 - (cam * .5) % 58, v = (i + Math.floor(cam * .5 / 58)) & 3; K.box(g, x + 25, 84, 8, 100, '#3a2412'); K.box(g, x + 25, 84, 2, 100, '#5a3a20'); K.put(g, K.tree(18, v), x + 29, 74); }
      const dt = K.T.dirt(64, 64);
      for (const p of plats) { const x = Math.round(p.x - cam); if (x > 170 || x + p.w < -10) continue; if (p.g) { for (let xx = 0; xx < p.w; xx += 64) g.drawImage(dt, 0, 0, Math.min(64, p.w - xx), 50, x + xx, p.y, Math.min(64, p.w - xx), 50); K.box(g, x, p.y, 1, 50, '#2a180a'); K.box(g, x + p.w - 1, p.y, 1, 50, '#2a180a'); K.box(g, x, p.y, p.w, 5, '#3fb45a'); K.box(g, x, p.y, p.w, 1, '#a8f0a0'); K.box(g, x, p.y + 5, p.w, 1, '#1f6a2a'); for (let k = 2; k < p.w - 2; k += 7) K.box(g, x + k, p.y + 5, 3, 2 + (k % 3), '#2f8a3a'); for (let k = 5; k < p.w - 4; k += 13) K.box(g, x + k, p.y - 2, 1, 2, '#58b96a'); }
        else { K.box(g, x + 2, p.y + 8, p.w, 4, 'rgba(0,0,0,.25)'); K.put(g, K.log(p.w), x + p.w / 2, p.y + 5); } }
      items.forEach((it, i) => { if (!it.got) K.put(g, K.fruit(i % 4), it.x - cam, it.y + Math.round(Math.sin(t * 4 + i) * 1.5)); });
      for (const f of foes) if (!f.dead) K.put(g, K.snail(), f.x - cam + 5, f.y + 3, f.d < 0 ? { flip: 1 } : null);
      const mv = A.keys.left || A.keys.right; K.put(g, K.guy(HO, !pl.on ? 3 : mv ? 1 + Math.floor(pl.x / 7) % 2 : 0), pl.x - cam + 4, pl.y - 2, pl.f < 0 ? { flip: 1 } : null); g.restore(); }
  };
} });
