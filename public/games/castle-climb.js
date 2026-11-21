Arcade.game('castle-climb', { w: 180, h: 280, pad: 'dpad', a: 'JUMP',
help: 'Walk left / right, climb ladders with up and down, and jump over the fireballs with Space or JUMP. Reach the door at the top of the tower to go one level higher.',
init(A) {
  const KN = A.spr(['..mmmm..', '.mmmmmm.', '.mkmmkm.', '.mmmmmm.', '..ssss..', '.bbbbbb.', 'mbbyybbm', 'mbbyybbm', '..bbbb..', '..m..m..', '..m..m..', '.mm..mm.'], { m: '#aab4c2', k: '#12101c', s: '#f0b890', b: '#3f6ad0', y: '#ffd23c' });
  const FY = i => 264 - i * 44; let lad, fire, coins, door, pl, lives = 3, lvl = 1, top = 0, dead = 0, tm = 0;
  const info = () => A.info('LIVES ' + lives + '  LEVEL ' + lvl);
  function start() { pl = { f: 0, x: 20, st: 0, cp: 0, jh: 0, jv: 0, dir: 1 }; top = 0; }
  function gen() { lad = []; fire = []; coins = []; let px = 20; for (let i = 0; i < 5; i++) { let x; do { x = A.ri(2, 16) * 10; } while (Math.abs(x - px) < 40); lad.push(x); px = x; }
    door = lad[4] < 90 ? 156 : 22; for (let i = 1; i < 6; i++) { const n = 1 + (lvl > 2 && i % 2 ? 1 : 0); for (let k = 0; k < n; k++) fire.push({ f: i, x: A.rnd(30, 150), d: Math.random() < .5 ? -1 : 1, sp: A.rnd(26, 40) + lvl * 5 }); coins.push({ f: i, x: A.ri(2, 16) * 10 }); } start(); info(); }
  const hitBy = f => fire.some(b => b.f === f && Math.abs(b.x - pl.x) < 10);
  function die() { lives--; dead = 1; A.beep(150, .35, 'sawtooth'); info(); }
  gen();
  return {
    key(k) { if (k === 'a' && pl.st === 0 && pl.jh <= 0 && dead <= 0) { pl.jv = 122; pl.jh = .01; A.beep(520, .05); } },
    update(dt) { tm += dt; for (const b of fire) { b.x += b.d * b.sp * dt; if (b.x < 8) { b.x = 8; b.d = 1; } if (b.x > 172) { b.x = 172; b.d = -1; } }
      if (dead > 0) { dead -= dt; if (dead <= 0) { if (lives <= 0) A.over(); else start(); } return; }
      const k = A.keys;
      if (pl.st === 0) { const d = (k.right ? 1 : 0) - (k.left ? 1 : 0); if (d) pl.dir = d; pl.x = Math.max(6, Math.min(174, pl.x + d * 62 * dt));
        if (pl.jh > 0) { pl.jh += pl.jv * dt; pl.jv -= 430 * dt; if (pl.jh <= 0) pl.jh = 0; }
        else if (k.up && pl.f < 5 && Math.abs(pl.x - lad[pl.f]) < 8) { pl.st = 1; pl.cp = 0; pl.x = lad[pl.f]; }
        else if (k.down && pl.f > 0 && Math.abs(pl.x - lad[pl.f - 1]) < 8) { pl.f--; pl.st = 1; pl.cp = 1; pl.x = lad[pl.f]; }
        if (pl.st === 0 && pl.jh < 9 && hitBy(pl.f)) return die();
        for (const c of coins) if (!c.got && c.f === pl.f && Math.abs(c.x - pl.x) < 8) { c.got = 1; A.add(20); A.beep(1000, .05, 'triangle'); }
        if (pl.f === 5 && Math.abs(pl.x - door) < 8) { lvl++; A.add(200); A.beep(880, .3, 'triangle'); gen(); return; } }
      else { pl.cp += ((k.up ? 1 : 0) - (k.down ? 1 : 0)) * 1.7 * dt; if (pl.cp >= 1) { pl.f++; pl.st = 0; pl.cp = 0; if (pl.f > top) { top = pl.f; A.add(10); } } else if (pl.cp <= 0) { pl.st = 0; pl.cp = 0; }
        if (pl.st === 1 && ((pl.cp < .2 && hitBy(pl.f)) || (pl.cp > .8 && hitBy(pl.f + 1)))) return die(); } },
    draw(g) { g.fillStyle = '#2a2438'; g.fillRect(0, 0, 180, 280); g.fillStyle = '#231e30'; for (let y = 0; y < 280; y += 12) for (let x = (y / 12 % 2) * 12 - 12; x < 180; x += 24) { g.fillRect(x, y, 23, 1); g.fillRect(x, y, 1, 12); }
      for (let i = 0; i < 6; i++) { const y = FY(i); g.fillStyle = '#000'; g.fillRect(0, y, 180, 8); g.fillStyle = '#8a94a4'; g.fillRect(0, y, 180, 6); g.fillStyle = '#d6dbea'; g.fillRect(0, y, 180, 1); g.fillStyle = '#4a5462'; for (let x = 10; x < 180; x += 20) g.fillRect(x, y + 1, 1, 5);
        if (i < 5) { const x = lad[i]; g.fillStyle = '#6a3e1c'; g.fillRect(x - 6, y - 44, 2, 44); g.fillRect(x + 4, y - 44, 2, 44); g.fillStyle = '#c89a5a'; for (let r = 4; r < 44; r += 7) g.fillRect(x - 5, y - r, 10, 2); } }
      const dy = FY(5); g.fillStyle = '#000'; g.fillRect(door - 9, dy - 23, 18, 23); g.fillStyle = '#6a3e1c'; g.fillRect(door - 8, dy - 20, 16, 20); g.fillRect(door - 6, dy - 22, 12, 2); g.fillStyle = '#9a6a34'; g.fillRect(door - 8, dy - 20, 2, 20); g.fillStyle = '#ffd23c'; g.fillRect(door + 3, dy - 10, 2, 2);
      for (const c of coins) if (!c.got) { const y = FY(c.f) - 10; g.fillStyle = '#000'; g.fillRect(c.x - 4, y - 4, 8, 8); g.fillStyle = '#ffd23c'; g.fillRect(c.x - 3, y - 3, 6, 6); g.fillStyle = '#fff6c8'; g.fillRect(c.x - 3, y - 3, 2, 2); }
      for (const b of fire) { const x = Math.round(b.x), y = FY(b.f) - 9, f = Math.floor(tm * 10) % 2; g.fillStyle = '#7a1410'; g.fillRect(x - 5, y - 1 - f, 10, 10 + f); g.fillStyle = '#ff8a1e'; g.fillRect(x - 4, y - f, 8, 8 + f); g.fillStyle = '#ffe27a'; g.fillRect(x - 2, y + 3, 4, 4); }
      if (dead <= 0 || Math.floor(dead * 12) % 2) { const X = Math.round(pl.x) - 8, Y = Math.round(FY(pl.f) - 24 - pl.jh - pl.cp * 44); if (pl.dir < 0) { g.save(); g.translate(X + 16, Y); g.scale(-1, 1); g.drawImage(KN, 0, 0, 16, 24); g.restore(); } else g.drawImage(KN, X, Y, 16, 24); } }
  };
} });
