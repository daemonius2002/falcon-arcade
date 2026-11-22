Arcade.game('castle-climb', { w: 180, h: 280, pad: 'dpad', a: 'JUMP',
help: 'Climb the 8 towers of the castle! Walk left / right, climb ladders with up and down, and jump with Space or JUMP (or tap the tower). Jump over fireballs and spikes, but never jump into a bat. From tower 2 the door is locked: grab the key first. Coins, clean fireball jumps and a fast climb (BONUS) score extra. Hearts give a life. Take the crown at the top of tower 8 to win.',
init(A) {
  const K = Art, ID = 'castle-climb-', LAST = 8, FY = i => 264 - i * 44;
  const WALL = ['#3a3050', '#2c3a58', '#30463c', '#4a3044', '#2e4450', '#4a3a2c', '#3c2c52', '#28283c'];
  const STONE = ['#9aa4b4', '#8fa2c0', '#98b0a0', '#b49aa8', '#94aeb8', '#b8a890', '#a498c0', '#c8b070'];
  const HINT = ['REACH THE DOOR', 'FIND THE KEY - JUMP SPIKES', 'BATS: DO NOT JUMP!', 'MORE SPIKES', 'BLUE FLAMES ARE FAST', 'KEEP GOING!', 'ALMOST THERE', 'TAKE THE CROWN!'];
  const KO = { id: 'cc', skin: '#f0b890', shirt: '#3f6ad0', pants: '#8a94a4', hat: 'helmet', hatc: '#e8231e', belt: '#ffd23c' };
  /* own sprites (cached by K.spr) */
  const glow = c => K.spr(ID + 'glow' + c, 24, 24, g => K.ell(g, 0, 0, 11, 11, c), { ol: 0 });
  const ember = f => K.spr(ID + 'ember' + f, 12, 14, g => { const w = f ? 4.4 : 5; K.part(g, [0, -7, w, 0, w - 1, 5, 0, 7, -w + 1, 5, -w, 0, f ? -2 : 2, -3], K.lin(g, 0, -7, 0, 7, '#c8f4ff', '#3cb4ff', '#2a4ad8')); K.ell(g, 0, 3, 2.4, 3, '#ffffff'); }, { ol: [20, 30, 110] });
  const crown = () => K.spr(ID + 'crown', 18, 14, g => { K.part(g, [-8, 6, -8, -4, -4, 1, 0, -6, 4, 1, 8, -4, 8, 6], K.lin(g, -8, 0, 8, 0, '#fff6c8', '#ffd23c', '#c8801e')); K.box(g, -8, 3, 16, 2, '#c8801e'); K.box(g, -1, 0, 2, 2, '#e8231e'); K.box(g, -6, 1, 2, 2, '#5fe3d6'); K.box(g, 4, 1, 2, 2, '#5fe3d6'); });
  const lock = () => K.spr(ID + 'lock', 8, 9, g => { K.rr(g, -3, -4.5, 6, 6, 3, '#aab4c2'); K.box(g, -1, -3, 2, 3, '#4a3418'); K.box(g, -4, -1, 8, 5.5, '#ffd23c'); K.box(g, -4, -1, 8, 1, '#fff6c8'); K.box(g, -1, 1, 2, 2, '#4a3418'); });
  const S = K.fx();
  let lad, fire, bats, spikes, coins, keyO, heartO, door, pl, pops = [];
  let lives = 3, lvl = 1, top = 0, hasKey = 0, bonus = 0, dead = 0, intro = 0, clr = 0, sh = 0, tm = 0, jbuf = 0, nag = 0;
  const info = () => A.info('LIVES ' + lives + '  TOWER ' + lvl);
  const pop = (s, x, y, c) => pops.push({ s, x: Math.max(18, Math.min(162, x)), y, l: .9, c: c || '#ffd23c' });
  const tune = (n, type) => n.forEach((f, i) => setTimeout(() => A.beep(f, .12, type || 'triangle'), i * 90));
  const ends = f => [f ? lad[f - 1] : 20, f < 5 ? lad[f] : door]; /* where you arrive on a floor and where you leave it */
  function spot(f, gap, used) { /* a free x on floor f, away from ladders, the door and other things */
    for (let t = 0; t < 30; t++) { const x = A.ri(2, 16) * 10 + A.ri(-3, 3), e = ends(f);
      if (Math.abs(x - e[0]) >= gap && Math.abs(x - e[1]) >= gap && !used.some(u => u.f === f && Math.abs(u.x - x) < 16)) return x; }
    return -1; }
  function place(f, d) { pl = { f, x: ends(f)[0], st: 0, cp: 0, jh: 0, jv: 0, dir: 1, inv: d ? 2 : 1, over: null }; }
  function gen() { lad = []; fire = []; bats = []; spikes = []; coins = []; keyO = heartO = null; hasKey = lvl < 2 || lvl === LAST; top = 0; bonus = 300; pops = [];
    let px = 20; for (let i = 0; i < 5; i++) { let x; do { x = A.ri(2, 16) * 10; } while (Math.abs(x - px) < 40); lad.push(x); px = x; }
    door = lad[4] < 90 ? 156 : 22;
    const used = [], fl = [1, 2, 3, 4, 5].sort(() => Math.random() - .5), bf = fl.filter(f => f < 5);
    /* spikes from tower 2 (each with a coin floating above it), bats from tower 3 */
    const ns = lvl < 2 ? 0 : Math.min(lvl, 6), sf = fl.concat(lvl > 3 ? [0] : [], lvl > 5 ? fl : []);
    for (let i = 0; i < ns && i < sf.length; i++) { const f = sf[i], x = spot(f, 26, spikes); if (x > 0) { spikes.push({ f, x }); coins.push({ f, x, hi: 1 }); } }
    for (let i = 0; i < Math.min(lvl - 2, 4); i++) bats.push({ f: bf[i], /* never the top floor: it sits right under the HUD */ x: A.rnd(20, 160), d: i % 2 ? 1 : -1, sp: 44 + lvl * 4, ph: A.rnd(0, 6) });
    for (let f = lvl > 4 ? 0 : 1; f < 6; f++) { const n = f ? 1 + (lvl > 2 && f % 2 ? 1 : 0) : 1;
      for (let k = 0; k < n; k++) { const blue = lvl > 4 && k === 0 && f % 2 === lvl % 2; let x = A.rnd(30, 150); if (Math.abs(x - ends(f)[0]) < 34) x = ends(f)[0] < 90 ? 150 : 30;
        fire.push({ f, x, d: Math.random() < .5 ? -1 : 1, sp: Math.min(84, (A.rnd(34, 42) + lvl * 4) * (blue ? 1.3 : 1)), blue }); } }
    for (let f = 0; f < 6; f++) for (let k = f ? 2 : 1; k--;) { const x = spot(f, 12, coins); if (x > 0) { coins.push({ f, x }); used.push({ f, x }); } }
    if (!hasKey) { const f = A.ri(1, 4), e = ends(f), lo = Math.min(e[0], e[1]), hi = Math.max(e[0], e[1]); keyO = { f, x: lo > 180 - hi ? 12 : 168 }; } /* off the direct route */
    if (lvl % 2 && lvl > 1 && lives < 5) { const f = A.ri(2, 5), x = spot(f, 14, used.concat(spikes)); if (x > 0) heartO = { f, x }; }
    place(0); intro = 1.6; info(); }
  function hurt() { if (pl.inv > 0) return false;
    const feet = FY(pl.f) - pl.jh - pl.cp * 44, head = feet - (pl.st ? 10 : 22), hit = (x, y, rx, ry) => Math.abs(x - pl.x) < rx && feet > y - ry && head < y + ry;
    return fire.some(b => hit(b.x, FY(b.f) - 6, 8, 3)) || bats.some(b => hit(b.x, FY(b.f) - 34, 9, 4)) || spikes.some(s => hit(s.x, FY(s.f) - 3, 7, 2)); }
  function die() { lives--; dead = 1.1; sh = .3; info(); A.beep(150, .35, 'sawtooth'); A.beep(90, .5, 'square');
    const y = FY(pl.f) - pl.jh - pl.cp * 44 - 12; S.boom(pl.x, y); S.spark(pl.x, y, ['#ffd23c', '#ff8a1e', '#ffffff'], 14, 90); }
  function jump() { pl.jv = 125; pl.jh = .01; jbuf = 0; pl.over = fire.filter(b => b.f === pl.f).map(b => ({ b, s: Math.sign(b.x - pl.x) })); A.beep(520, .05); A.beep(700, .05, 'triangle'); }
  function land() { pl.jh = 0; let n = 0; for (const o of pl.over || []) if (Math.sign(o.b.x - pl.x) !== o.s) n++;
    if (n) { A.add(15 * n); pop('+' + 15 * n, pl.x, FY(pl.f) - 30, '#5fe3d6'); A.beep(900, .06, 'triangle'); } pl.over = null; S.puff(pl.x - 3, FY(pl.f) - 1, '#c8c8d8', -8); S.puff(pl.x + 3, FY(pl.f) - 1, '#c8c8d8', -8); }
  function grab(o, r) { return o && !o.got && o.f === pl.f && Math.abs(o.x - pl.x) < r && (o.hi ? pl.jh > 5 : pl.jh < 14); }
  gen();
  return {
    key(k) { if (k === 'a') jbuf = .12; },
    tap() { jbuf = .12; },
    update(dt) { tm += dt; sh -= dt; nag -= dt; for (const p of pops) { p.l -= dt; p.y -= 14 * dt; } if (pops.length && pops[0].l <= 0) pops.shift();
      if (intro > 0) { intro -= dt; jbuf = 0; return; }
      if (clr > 0) { clr -= dt; if (clr <= 0) { if (lvl === LAST) { A.add(lives * 100); A.over(true); } else { lvl++; gen(); } } return; }
      for (const b of fire) { b.x += b.d * b.sp * dt; if (b.x < 8) { b.x = 8; b.d = 1; } if (b.x > 172) { b.x = 172; b.d = -1; } }
      for (const b of bats) { b.x += b.d * b.sp * dt; if (b.x < 8) { b.x = 8; b.d = 1; } if (b.x > 172) { b.x = 172; b.d = -1; } }
      if (dead > 0) { dead -= dt; if (dead <= 0) { if (lives <= 0) A.over(); else place(pl.f, 1); } return; }
      bonus = Math.max(0, bonus - 4 * dt); pl.inv -= dt; jbuf -= dt; const k = A.keys;
      if (pl.st === 0) { const d = (k.right ? 1 : 0) - (k.left ? 1 : 0); if (d) pl.dir = d; pl.x = Math.max(6, Math.min(174, pl.x + d * 62 * dt));
        if (pl.jh > 0) { pl.jh += pl.jv * dt; pl.jv -= 380 * dt; if (pl.jh <= 0) land(); }
        if (pl.jh <= 0) { if (jbuf > 0) jump();
          else if (k.up && pl.f < 5 && Math.abs(pl.x - lad[pl.f]) < 9) { pl.st = 1; pl.cp = 0; pl.x = lad[pl.f]; }
          else if (k.down && pl.f > 0 && Math.abs(pl.x - lad[pl.f - 1]) < 9) { pl.f--; pl.st = 1; pl.cp = 1; pl.x = lad[pl.f]; } }
        if (hurt()) return die();
        for (const c of coins) if (grab(c, 8)) { c.got = 1; A.add(20); A.beep(1000, .05, 'triangle'); S.spark(c.x, FY(c.f) - (c.hi ? 24 : 10), ['#ffd23c', '#fff6c8'], 6, 50); }
        if (grab(keyO, 9)) { keyO.got = hasKey = 1; A.add(50); pop('KEY! +50', keyO.x, FY(keyO.f) - 26); tune([660, 880, 1100]); S.spark(keyO.x, FY(keyO.f) - 10, ['#ffd23c', '#ffffff'], 12, 70); }
        if (grab(heartO, 9)) { heartO.got = 1; lives++; info(); pop('+1 LIFE', heartO.x, FY(heartO.f) - 26, '#ff8a9a'); tune([520, 780, 1040]); S.spark(heartO.x, FY(heartO.f) - 10, ['#e8231e', '#ffb0a0'], 12, 70); }
        if (pl.f === 5 && pl.st === 0 && Math.abs(pl.x - door) < 8) {
          if (hasKey) { const b = Math.round(bonus / 10) * 10; A.add(100 + b); pop(lvl === LAST ? 'THE CROWN!' : 'TOWER ' + lvl + ' CLEAR', 90, 70); pop('+100  BONUS +' + b, 90, 82, '#5fe3d6'); clr = 1.4; tune([660, 880, 990, 1320]); S.spark(door, FY(5) - 14, ['#ffd23c', '#5fe3d6', '#ffffff'], 24, 90); }
          else if (nag <= 0) { nag = 1.5; pop('LOCKED! FIND THE KEY', door, FY(5) - 34, '#ff8a9a'); A.beep(200, .12, 'square'); } } }
      else { const d = (k.up ? 1 : 0) - (k.down ? 1 : 0); pl.cp += d * 2 * dt; if (d && Math.floor(pl.cp * 6) !== Math.floor((pl.cp - d * 2 * dt) * 6)) A.beep(300 + pl.cp * 120, .03, 'triangle', .02);
        if (pl.cp >= 1) { pl.f++; pl.st = 0; pl.cp = 0; if (pl.f > top) { top = pl.f; A.add(10); pop('+10', pl.x, FY(pl.f) - 30, '#ffffff'); } } else if (pl.cp <= 0) { pl.st = 0; pl.cp = 0; }
        if (hurt()) return die(); } },
    draw(g) { const f = Math.floor(tm * 8), th = lvl - 1, sx = sh > 0 ? A.ri(-2, 2) : 0, sy = sh > 0 ? A.ri(-2, 2) : 0;
      g.fillStyle = '#140e1c'; g.fillRect(0, 0, 180, 280); g.save(); g.translate(sx, sy);
      K.scroll(g, K.T.brick(64, 64, WALL[th]), 0, 0, 180, 280); g.fillStyle = 'rgba(10,6,20,.3)'; g.fillRect(0, 0, 180, 280);
      for (let i = 0; i < 6; i++) { const y = FY(i), tx = i % 2 ? 150 : 30; /* window, torch, floor, ladder */
        K.box(g, tx - 6, y - 34, 12, 16, '#140e1c'); K.box(g, tx - 5, y - 33, 10, 14, '#1b2a55'); K.box(g, tx - 5, y - 33, 10, 2, '#3a4a9a'); K.box(g, tx, y - 33, 1, 14, '#140e1c'); if ((i + lvl) % 3 === 0) K.box(g, tx - 3, y - 29, 1, 1, '#fff6c8');
        const wx = i % 2 ? 60 : 120; K.put(g, glow('#ffaa3c'), wx, y - 26, { a: .1 + (f + i) % 2 * .04, sc: 1.4 }); K.box(g, wx - 1, y - 22, 3, 6, '#5a3418'); K.put(g, K.fire((f + i) % 2), wx, y - 28, { sc: .5 });
        for (let x = 0; x < 180; x += 20) g.drawImage(K.block(20, 8, STONE[th]), x, y);
        if (i < 5) { const x = lad[i]; K.box(g, x - 7, y - 44, 3, 44, '#3a2010'); K.box(g, x + 4, y - 44, 3, 44, '#3a2010'); K.box(g, x - 6, y - 44, 1, 44, '#c08a4a'); K.box(g, x + 5, y - 44, 1, 44, '#c08a4a'); for (let r = 4; r < 44; r += 7) { K.box(g, x - 5, y - r, 10, 2, '#d8aa6a'); K.box(g, x - 5, y - r + 2, 10, 1, '#5a3418'); } } }
      const dy = FY(5);
      if (lvl === LAST) { g.drawImage(K.block(16, 10, '#8a4ac8'), door - 8, dy - 10); if (clr <= 0) { K.put(g, glow('#ffd23c'), door, dy - 18, { a: .14 + f % 2 * .05 }); K.put(g, crown(), door, dy - 18 + Math.round(Math.sin(tm * 4))); } }
      else { K.put(g, K.door('#9a6a34'), door, dy - 12); if (clr > 0) { K.box(g, door - 5, dy - 20, 10, 20, '#140e1c'); K.box(g, door - 3, dy - 16, 6, 16, '#ffd98a'); } else if (!hasKey) K.put(g, lock(), door, dy - 9); }
      for (const s of spikes) { K.put(g, K.spike(), s.x - 4, FY(s.f) - 6); K.put(g, K.spike(), s.x + 4, FY(s.f) - 6); }
      for (const c of coins) if (!c.got) K.put(g, K.coin((f + c.f) % 4), c.x, FY(c.f) - (c.hi ? 24 : 10));
      if (keyO && !keyO.got) { K.put(g, glow('#ffd23c'), keyO.x, FY(keyO.f) - 11, { a: .14 + f % 2 * .06, sc: .8 }); K.put(g, K.key(), keyO.x, FY(keyO.f) - 11 + Math.round(Math.sin(tm * 5))); }
      if (heartO && !heartO.got) K.put(g, K.heart(), heartO.x, FY(heartO.f) - 11 + Math.round(Math.sin(tm * 5)));
      for (const b of fire) { const y = FY(b.f) - 7; K.put(g, glow(b.blue ? '#3cb4ff' : '#ff8c28'), b.x, y, { a: .18 }); K.put(g, (b.blue ? ember : K.fire)(f % 2), b.x, y, b.d < 0 ? { flip: 1 } : null); if (b.blue && f % 2) S.puff(b.x - b.d * 5, y + 3, '#3cb4ff', -10); }
      for (const b of bats) K.put(g, K.bat(Math.floor(tm * 10 + b.ph) % 2), b.x, FY(b.f) - 34 + Math.round(Math.sin(tm * 6 + b.ph) * 2));
      const show = dead > 0 ? 0 : clr > 0 ? 0 : pl.inv > 0 && intro <= 0 ? Math.floor(tm * 14) % 2 : 1;
      if (show) { const fy = FY(pl.f) - pl.jh - pl.cp * 44, mv = intro <= 0 && (A.keys.left || A.keys.right); if (!pl.st) K.shadow(g, pl.x, FY(pl.f), 6 - Math.min(3, pl.jh / 6), 2);
        K.put(g, K.guy(KO, pl.st ? 1 + Math.floor(pl.cp * 8) % 2 : pl.jh > 0 ? 3 : mv ? 1 + Math.floor(pl.x / 6) % 2 : 0), pl.x, fy - 14, pl.dir < 0 ? { flip: 1 } : null); }
      S.draw(g); for (const p of pops) { A.text(g, p.s, p.x + 1, p.y + 1, '#140e1c', 1, 'center'); A.text(g, p.s, p.x, p.y, p.c, 1, 'center'); }
      g.restore();
      /* HUD: time bonus and key */
      K.box(g, 0, 0, 180, 9, '#140e1c'); A.text(g, 'BONUS ' + Math.round(bonus / 10) * 10, 3, 2, bonus > 100 ? '#5fe3d6' : '#ff8a9a');
      if (lvl > 1 && lvl < LAST) { A.text(g, hasKey ? 'KEY' : 'NO KEY', 163, 2, hasKey ? '#ffd23c' : '#8a94a4', 1, 'right'); if (hasKey) K.put(g, K.key(), 171, 4); }
      if (intro > 0) { K.box(g, 0, 112, 180, 40, '#140e1c'); K.box(g, 0, 113, 180, 1, STONE[th]); K.box(g, 0, 150, 180, 1, STONE[th]);
        A.text(g, 'TOWER ' + lvl, 90, 120, '#ffd23c', 3, 'center'); A.text(g, HINT[th], 90, 141, '#ffffff', 1, 'center'); } }
  };
} });
