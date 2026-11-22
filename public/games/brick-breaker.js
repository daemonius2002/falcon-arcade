Arcade.game('brick-breaker', { w: 240, h: 320, pad: 'lr',
help: 'Slide the paddle with your finger, the mouse or the arrow keys. Tap or press Space to launch the ball. Clear all 8 levels to win! Steel bricks take 2 hits, gold-framed stones never break, bomb bricks blow up their neighbours. Break bricks in a row without touching the paddle for combo points, and catch the falling capsules: W wide paddle, M multi-ball, S slow ball, F fire ball, B safety shield, + extra ball.',
init(A) {
  const K = Art, ID = 'brick-breaker-', R = 3, PY = 305, TOP = 14, COL = ['#e8231e', '#ff8a1e', '#ffd23c', '#3fd45a', '#3fa8e0', '#b06ae0'], BG = ['#2a2244', '#1e2c48', '#2e2238', '#1c3038'];
  /* o brick · s steel (2 hits) · x stone (unbreakable) · b bomb · m sliding bumper (unbreakable) */
  const LV = [['WARM UP', '|oooooooo|oooooooo|oooooooo|oooooooo'],
    ['STEEL STRIPE', 'oooooooo|.oooooo.|ssssssss|.oooooo.|..oooo..|...oo...'],
    ['BOOM BOXES', 'oo.oo.oo|obo..obo|oo.oo.oo|...bb...|oo.oo.oo|obo..obo|oo.oo.oo'],
    ['STONE GATE', 'oooooooo|oooooooo|s.s..s.s|oooooooo|xx.oo.xx|oooooooo'],
    ['THE SLIDER', '.oooooo.|oosoosoo|oboooobo||m|......|oo.ss.oo|.oooooo.'],
    ['DIAMOND', '...ss...|..soos..|.sobbos.|soooooos|.sobbos.|..soos..|...ss...'],
    ['FORTRESS', 'x.oooo.x|.osbbso.|oossssoo|oooooooo||m||xoo..oox|.oobboo.'],
    ['GRAND FINALE', 'ssssssss|soboobos|soossoos|ssbssbss||m||x.oooo.x|oooooooo|.......m']];
  const PW = { W: ['#3fa8e0', 'WIDE'], M: ['#3fd45a', 'MULTI'], S: ['#b06ae0', 'SLOW'], F: ['#ff8a1e', 'FIRE'], B: ['#1ea8a0', 'SHIELD'], L: ['#e8231e', '+1 BALL'] }, BAG = 'WWWMMMSSFFBBL';
  const F = K.fx();
  let px = 120, pw = 46, lives = 3, lvl = 1, bricks = [], left = 0, balls = [], drops = [], pops = [], stuck = true, fresh = true, wait = 0;
  let sp = 0, cap = 0, combo = 0, pity = 0, tW = 0, tS = 0, tF = 0, shield = false, sh = 0, t = 0;

  /* ---- sprites (cached by K.spr, 26x12 with outline) ---- */
  const tile = (key, fn) => K.spr(ID + key, 24, 10, fn);
  const steel = n => tile('s' + n, g => { K.box(g, -12, -5, 24, 10, K.lin(g, 0, -5, 0, 5, '#f2f5f8', '#aab4c2', '#6a7484')); K.box(g, -12, -5, 24, 1, '#ffffff'); for (const x of [-10, 9]) for (const y of [-3, 2]) K.box(g, x, y, 1, 1, '#3a4250');
    if (n) for (const [x, y, w, h] of [[-3, -5, 1, 3], [-2, -3, 3, 1], [0, -2, 1, 3], [1, 0, 3, 1], [3, 1, 1, 4], [-5, -1, 3, 1], [-6, 0, 1, 3]]) K.box(g, x, y, w, h, '#2a2030'); });
  const stone = () => tile('x', g => { K.box(g, -12, -5, 24, 10, '#c8901e'); K.box(g, -12, -5, 24, 1, '#ffd23c'); K.box(g, -10, -3, 20, 6, K.lin(g, 0, -3, 0, 3, '#6a7488', '#3a4250')); for (const x of [-7, -1, 5]) { K.box(g, x, -1, 2, 2, '#8a94a8'); K.box(g, x, -1, 1, 1, '#c8d0dc'); } });
  const bomb = () => tile('b', g => { K.box(g, -12, -5, 24, 10, K.lin(g, 0, -5, 0, 5, '#5a4a6a', '#2e2238')); K.box(g, -12, -5, 24, 1, '#8a7a9a'); K.ell(g, 0, .5, 3.6, 3.6, K.rad(g, -1, -1, .5, 4.5, '#ff8a7a', '#e8231e', '#7a1410')); K.box(g, -1, -5, 2, 2, '#ffd23c'); for (const x of [-9, 7]) { K.box(g, x, -1, 2, 2, '#ffd23c'); K.box(g, x, -1, 1, 1, '#fff6c8'); } });
  const bumper = () => tile('m', g => { K.box(g, -12, -5, 24, 10, K.lin(g, 0, -5, 0, 5, '#5fe3d6', '#1ea8a0', '#126a70')); K.box(g, -12, -5, 24, 1, '#d8fff8'); K.part(g, [-9, 0, -5, -3, -5, 3], '#ffffff'); K.part(g, [9, 0, 5, -3, 5, 3], '#ffffff'); K.box(g, -3, -1, 6, 2, '#0e4a50'); });
  const cap_ = c => K.spr(ID + 'c' + c, 16, 8, g => { K.rr(g, -8, -4, 16, 8, 4, K.lin(g, 0, -4, 0, 4, K.lite(c, .55), c, K.dark(c, .45))); K.box(g, -5, -3, 10, 1, K.lite(c, .8)); });
  const img = k => k.t === 's' ? steel(k.hp < 2 ? 1 : 0) : k.t === 'x' ? stone() : k.t === 'b' ? bomb() : k.t === 'm' ? bumper() : K.block(26, 12, COL[k.c]);
  const hard = k => k.t === 'x' || k.t === 'm';

  function build() { bricks = []; left = 0; LV[lvl - 1][1].split('|').forEach((row, r) => { for (let c = 0; c < row.length; c++) { const ty = row[c]; if (ty === '.') continue;
      bricks.push({ x: 8 + c * 28, y: 30 + r * 14, t: ty, c: r % 6, hp: ty === 's' ? 2 : 1, fl: 0, vx: ty === 'm' ? (c ? -1 : 1) * (30 + lvl * 3) : 0 }); if (ty !== 'x' && ty !== 'm') left++; } });
    sp = 138 + lvl * 9; cap = sp + 55; fresh = true; }
  function serve() { balls = [{ x: px, y: PY - 8, vx: 0, vy: 0, idle: 0, tr: [] }]; drops = []; stuck = true; wait = 3; combo = 0; A.info('LEVEL ' + lvl); }
  function launch() { if (!stuck) return; stuck = fresh = false; const a = A.rnd(-.5, .5); balls[0].vx = sp * Math.sin(a); balls[0].vy = -sp * Math.cos(a); A.beep(520, .06); }
  function pop(x, y, s, c) { pops.push({ x: Math.max(16, Math.min(224, x)), y, s, c, l: .8 }); if (pops.length > 12) pops.shift(); }
  /* keep balls from going (almost) flat so nobody waits forever */
  function steer(o) { const s = Math.hypot(o.vx, o.vy) || 1, m = s * .28; if (Math.abs(o.vy) < m) { o.vy = (o.vy < 0 ? -m : m); o.vx = (o.vx < 0 ? -1 : 1) * Math.sqrt(s * s - m * m); } }
  function power(ty, x) { A.add(50); pop(x, PY - 14, PW[ty][1], '#ffffff'); F.spark(x, PY - 4, [PW[ty][0], '#ffffff'], 12, 90); [660, 880, 1100].forEach((f, i) => A.beep(f, .06 + i * .03, 'triangle'));
    if (ty === 'W') tW = 14; else if (ty === 'S') tS = 9; else if (ty === 'F') tF = 7; else if (ty === 'B') shield = true; else if (ty === 'L') { lives = Math.min(5, lives + 1); A.info('LEVEL ' + lvl); }
    else if (!stuck) for (const o of balls.slice()) for (const d of [-.5, .5]) { if (balls.length >= 6) break; const c = Math.cos(d), s = Math.sin(d), n = { x: o.x, y: o.y, vx: o.vx * c - o.vy * s, vy: o.vx * s + o.vy * c, idle: 0, tr: [] }; steer(n); balls.push(n); } }
  function smash(k, all) { if (k.dead) return; k.fl = .12;
    if (hard(k)) { A.beep(1300, .03, 'triangle'); return; }
    k.hp -= all ? 9 : 1; if (k.hp > 0) { A.add(5); A.beep(980, .05, 'triangle'); F.spark(k.x + 13, k.y + 6, ['#f2f5f8', '#aab4c2'], 5, 60); return; }
    k.dead = true; bricks.splice(bricks.indexOf(k), 1); left--; combo++;
    const m = Math.min(5, 1 + (combo >> 2)), pts = (k.t === 's' ? 20 : k.t === 'b' ? 15 : 10) * m, c = k.t === 's' ? '#aab4c2' : k.t === 'b' ? '#e8231e' : COL[k.c];
    A.add(pts); pop(k.x + 13, k.y + 3, (m > 1 ? 'X' + m + ' ' : '') + '+' + pts, m > 1 ? '#ffd23c' : '#ffffff'); A.beep(500 + Math.min(combo, 14) * 45, .05); F.spark(k.x + 13, k.y + 6, [c, '#ffffff'], 9, 100); sp = Math.min(cap, sp + 1.2);
    if (k.t === 'b') { F.boom(k.x + 13, k.y + 6, true); sh = 5; A.beep(90, .3, 'sawtooth', .06); for (const n of bricks.slice()) if (Math.abs(n.x - k.x) < 30 && Math.abs(n.y - k.y) < 16 && !hard(n)) smash(n, true); }
    else if (left > 0 && drops.length < 3 && (++pity >= 10 || Math.random() < .13)) { pity = 0; let ty = BAG[A.ri(0, BAG.length - 1)]; if (ty === 'L' && lives >= 5) ty = 'W'; if (ty === 'B' && shield) ty = 'M'; drops.push({ x: k.x + 13, y: k.y + 6, t: ty }); } }
  /* ball vs bricks: take the brick the ball overlaps most, bounce off its nearest face */
  function bump(o) { let k = null, bx = 0, by = 0, best = 0;
    for (const q of bricks) { const ox = 13 + R - Math.abs(o.x - q.x - 13), oy = 6 + R - Math.abs(o.y - q.y - 6); if (ox > 0 && oy > 0 && ox * oy > best) { best = ox * oy; k = q; bx = ox; by = oy; } }
    if (!k) return; const dx = o.x < k.x + 13 ? -1 : 1, dy = o.y < k.y + 6 ? -1 : 1;
    if (hard(k) || !(tF > 0)) { if (bx < by && (o.vx * dx < 0 || k.vx)) { o.x += bx * dx; o.vx = Math.abs(o.vx) * dx; } else { o.y += by * dy; o.vy = Math.abs(o.vy) * dy; } steer(o); }
    if (!hard(k)) o.idle = 0; smash(k, tF > 0); }
  function lose() { lives--; tW = tS = tF = 0; sh = 4; A.beep(140, .3, 'sawtooth'); A.info('LEVEL ' + lvl); if (lives <= 0) { balls = []; A.over(); } else serve(); }
  function next() { A.add(100 * lvl); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => A.beep(f, .12, 'triangle', .05), i * 90));
    if (lvl >= LV.length) { A.add(250 * lives); balls = []; drops = []; pop(120, 150, 'ALL CLEAR!', '#ffd23c'); A.over(true); return; }
    pop(120, 150, 'LEVEL BONUS +' + 100 * lvl, '#ffd23c'); lvl++; build(); serve(); }
  build(); serve();
  return {
    key(k) { if (k === 'a') launch(); }, tap() { launch(); },
    update(dt) { t += dt; sh = Math.max(0, sh - dt * 14); tW = Math.max(0, tW - dt); tS = Math.max(0, tS - dt); tF = Math.max(0, tF - dt);
      pw += ((tW > 0 ? 70 : 46) - pw) * Math.min(1, dt * 12);
      if (A.keys.left) px -= 250 * dt; if (A.keys.right) px += 250 * dt; if (A.ptr.moved) px = A.ptr.x; px = Math.max(pw / 2 + 2, Math.min(238 - pw / 2, px));
      for (const k of bricks) { if (k.fl > 0) k.fl -= dt; if (k.vx) { k.x += k.vx * dt; if (k.x < 4) { k.x = 4; k.vx = -k.vx; } if (k.x > 210) { k.x = 210; k.vx = -k.vx; } } }
      for (const p of pops) { p.y -= 20 * dt; p.l -= dt; } if (pops.length && pops[0].l <= 0) pops.shift();
      for (const d of drops) { d.y += 62 * dt; if (d.y > PY - 7 && d.y < PY + 8 && Math.abs(d.x - px) < pw / 2 + 8) { d.y = 999; power(d.t, d.x); } } drops = drops.filter(d => d.y < 326);
      if (stuck) { const b = balls[0]; b.x = px; b.y = PY - 8; b.tr.length = 0; wait -= dt; if (wait <= 0) launch(); return; }
      const f = dt * (tS > 0 ? .66 : 1), n = Math.ceil(sp * f / 2.5), wide = pw / 2 + R;
      for (const o of balls) { o.tr.push(o.x, o.y); if (o.tr.length > 14) o.tr.splice(0, 2);
        o.idle += dt; if (o.idle > 7) { o.idle = 0; const a = A.rnd(.25, .5) * (Math.random() < .5 ? -1 : 1), c = Math.cos(a), s = Math.sin(a), vx = o.vx; o.vx = vx * c - o.vy * s; o.vy = vx * s + o.vy * c; steer(o); F.spark(o.x, o.y, ['#ffffff'], 4, 40); }
        for (let i = 0; i < n && o.y < 330; i++) { const oy = o.y; o.x += o.vx * f / n; o.y += o.vy * f / n;
          if (o.x < 2 + R) { o.x = 2 + R; o.vx = Math.abs(o.vx); A.beep(240, .02); } if (o.x > 238 - R) { o.x = 238 - R; o.vx = -Math.abs(o.vx); A.beep(240, .02); } if (o.y < TOP + R) { o.y = TOP + R; o.vy = Math.abs(o.vy); A.beep(240, .02); }
          if (o.vy > 0 && o.y >= PY - 7 && oy <= PY && Math.abs(o.x - px) < wide) { const a = Math.max(-1, Math.min(1, (o.x - px) / (pw / 2))) * 1.05; o.vx = sp * Math.sin(a); o.vy = -sp * Math.cos(a); o.y = PY - 8; o.idle = 0; combo = 0; A.beep(330, .05); F.spark(o.x, PY - 5, ['#5fe3d6', '#ffffff'], 3, 40); }
          else if (shield && o.vy > 0 && o.y >= 313) { shield = false; o.y = 312; o.vy = -Math.abs(o.vy); o.idle = 0; A.beep(700, .12, 'triangle'); F.spark(o.x, 315, ['#5fe3d6', '#ffffff'], 16, 110); }
          bump(o); if (left <= 0) break; } }
      if (left <= 0) return next();
      balls = balls.filter(o => o.y < 328); if (!balls.length) lose(); },
    draw(g) { const blink = (t * 4 & 1) === 0;
      g.save(); if (sh > .5) g.translate(Math.round(Math.sin(t * 80) * sh * .6), Math.round(Math.cos(t * 67) * sh * .6));
      K.scroll(g, K.T.brick(64, 64, BG[(lvl - 1) % 4]), 0, 0, 240, 320); g.fillStyle = 'rgba(8,4,20,.22)'; g.fillRect(0, 0, 240, 320); K.box(g, 0, 0, 2, 320, '#59627a'); K.box(g, 238, 0, 2, 320, '#59627a');
      g.fillStyle = 'rgba(0,0,0,.32)'; for (const k of bricks) g.fillRect(Math.round(k.x) + 2, k.y + 3, 26, 12);
      for (const k of bricks) { const x = Math.round(k.x); g.drawImage(img(k), x, k.y); if (k.t === 'b' && blink) K.box(g, x + 12, k.y, 2, 2, '#ffffff'); if (k.fl > 0) { g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(x + 1, k.y + 1, 24, 10); } }
      if (shield) for (let x = 2; x < 238; x += 4) K.box(g, x, 314 + ((x >> 2) + (t * 6 | 0) & 1), 3, 2, (x >> 2) & 1 ? '#5fe3d6' : '#d8fff8');
      for (const d of drops) { const x = Math.round(d.x), y = Math.round(d.y); K.put(g, cap_(PW[d.t][0]), x, y); A.text(g, d.t === 'L' ? '+' : d.t, x - 1, y - 2, '#ffffff'); }
      const w = Math.round(pw / 2) * 2; K.shadow(g, px, PY + 7, w / 2, 2); K.put(g, K.paddle(w, tF > 0 ? '#ff8a1e' : '#e8231e'), px, PY);
      for (const o of balls) { const n = o.tr.length; for (let i = 0; i < n; i += 2) { g.fillStyle = tF > 0 ? `rgba(255,${90 + i * 9},30,${(i + 4) / 22})` : `rgba(255,210,60,${i / 28})`; const s = tF > 0 ? 5 : 4; g.fillRect(Math.round(o.tr[i]) - (s >> 1), Math.round(o.tr[i + 1]) - (s >> 1), s, s); }
        K.put(g, K.ball(R, tF > 0 ? '#ffb43c' : '#f2f5f8'), o.x, o.y); }
      F.draw(g); for (const p of pops) A.text(g, p.s, p.x, p.y, p.l < .25 && blink ? '#8a94a8' : p.c, 1, 'center');
      g.restore();
      /* status strip (also the ceiling) */
      K.box(g, 0, 0, 240, TOP - 2, '#1b1e29'); K.box(g, 0, TOP - 2, 240, 1, '#8a94a8'); K.box(g, 0, TOP - 1, 240, 1, '#3a4250');
      for (let i = 0; i < lives; i++) K.put(g, K.ball(3, '#f2f5f8'), 8 + i * 9, 6); A.text(g, 'LEVEL ' + lvl, 120, 4, '#ffd23c', 1, 'center');
      const m = Math.min(5, 1 + (combo >> 2)); if (m > 1) A.text(g, 'X' + m, 150, 4, '#ff8a1e');
      let x = 236; for (const [c, v, max] of [['W', tW, 14], ['S', tS, 9], ['F', tF, 7]]) if (v > 0 && (v > 2 || blink)) { x -= 18; A.text(g, c, x, 4, PW[c][0]); K.box(g, x + 5, 5, 11, 3, '#3a4250'); K.box(g, x + 5, 5, Math.ceil(v / max * 11), 3, PW[c][0]); }
      if (stuck && lives > 0) { if (fresh) { A.text(g, 'LEVEL ' + lvl, 120, 186, '#ffd23c', 2, 'center'); A.text(g, LV[lvl - 1][0], 120, 202, '#ffffff', 1, 'center'); } else A.text(g, 'READY!', 120, 190, '#ffd23c', 2, 'center');
        if (blink) A.text(g, 'TAP OR PRESS SPACE', 120, 216, '#aab4c2', 1, 'center'); } }
  };
} });
