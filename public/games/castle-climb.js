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
    draw(g) { const K = Art, KO = { id: 'cc', skin: '#f0b890', shirt: '#3f6ad0', pants: '#8a94a4', hat: 'helmet', hatc: '#e8231e', belt: '#ffd23c' }, f = Math.floor(tm * 8);
      K.scroll(g, K.T.brick(64, 64, '#3a3050'), 0, 0, 180, 280); g.fillStyle = 'rgba(10,6,20,.3)'; g.fillRect(0, 0, 180, 280);
      for (let i = 0; i < 6; i++) { const y = FY(i), tx = i % 2 ? 150 : 30; K.box(g, tx - 6, y - 34, 12, 16, '#140e1c'); K.box(g, tx - 5, y - 33, 10, 14, '#1b2a55'); K.box(g, tx - 5, y - 33, 10, 2, '#3a4a9a'); K.box(g, tx, y - 33, 1, 14, '#140e1c');
        const wx = i % 2 ? 60 : 120; g.fillStyle = 'rgba(255,170,60,.13)'; g.beginPath(); g.arc(wx, y - 26, 16, 0, 7); g.fill(); K.box(g, wx - 1, y - 22, 3, 6, '#5a3418'); K.put(g, K.fire((f + i) % 2), wx, y - 28, { sc: .5 });
        for (let x = 0; x < 180; x += 20) g.drawImage(K.block(20, 8, '#9aa4b4'), x, y);
        if (i < 5) { const x = lad[i]; K.box(g, x - 7, y - 44, 3, 44, '#3a2010'); K.box(g, x + 4, y - 44, 3, 44, '#3a2010'); K.box(g, x - 6, y - 44, 1, 44, '#c08a4a'); K.box(g, x + 5, y - 44, 1, 44, '#c08a4a'); for (let r = 4; r < 44; r += 7) { K.box(g, x - 5, y - r, 10, 2, '#d8aa6a'); K.box(g, x - 5, y - r + 2, 10, 1, '#5a3418'); } } }
      K.put(g, K.door('#9a6a34'), door, FY(5) - 12); for (const c of coins) if (!c.got) K.put(g, K.coin((f + c.f) % 4), c.x, FY(c.f) - 10);
      for (const b of fire) { g.fillStyle = 'rgba(255,140,40,.16)'; g.beginPath(); g.arc(b.x, FY(b.f) - 7, 11, 0, 7); g.fill(); K.put(g, K.fire(f % 2), b.x, FY(b.f) - 7, b.d < 0 ? { flip: 1 } : null); }
      if (dead <= 0 || Math.floor(dead * 12) % 2) { const fy = FY(pl.f) - pl.jh - pl.cp * 44, mv = A.keys.left || A.keys.right; K.put(g, K.guy(KO, pl.st ? 1 + Math.floor(pl.cp * 8) % 2 : pl.jh > 0 ? 3 : mv ? 1 + Math.floor(pl.x / 6) % 2 : 0), pl.x, fy - 14, pl.dir < 0 ? { flip: 1 } : null); } }
  };
} });
