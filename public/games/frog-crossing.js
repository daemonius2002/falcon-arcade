/* Frog Crossing — hop over the road and the river, fill the 5 lily pads, then do it again on a harder level */
Arcade.game('frog-crossing', { w: 160, h: 208, pad: 'dpad',
help: 'Hop with the arrow keys, swipes, taps or the pad (hold to keep hopping). Dodge the traffic, ride logs and turtles over the river and fill all 5 lily pads before the time bar runs out. Hearts show your lives. Turtles that shrink are about to dive! Catch the fly and the ladybug for bonus points. Every level adds something new and gives an extra life.',
init(A) {
  const K = Art, ID = 'frog-crossing-', PI = Math.PI, SL = [8, 40, 72, 104, 136], CC = ['#e8231e', '#ffd23c', '#3fa8e0', '#f2f5f8'], TMAX = 30,
    ROT = { up: 0, right: PI / 2, down: PI, left: -PI / 2 }, NEWS = { 2: 'DIVING TURTLES!', 3: 'WATCH THE RACER!', 4: 'SNAKE ON THE PATH!', 5: 'MORE TRAFFIC!', 6: 'MORE DIVERS!' };
  /* ---- sprites (all face right, flipped for left-movers) ---- */
  const turtle = f => K.spr(ID + 'tu' + f, 16, 14, g => {
    if (f < 2) { for (const [x, y] of [[-5 + f, -5], [3 - f, -5], [-5 + f, 5], [3 - f, 5]]) K.ell(g, x, y, 2.3, 1.8, '#4fb85a'); K.ell(g, 6, 0, 2.4, 2.2, '#7fe06a'); K.box(g, 6, -2, 1, 1, '#12101c'); K.box(g, 6, 1, 1, 1, '#12101c'); }
    const r = f === 2 ? 3.4 : 5.4; K.ell(g, -1, 0, r, r - .6, K.rad(g, -2, -2, .5, 7, '#ffc878', '#d0702a', '#7a3a14'));
    if (f < 2) { K.box(g, -2, -3, 2, 2, '#8a4418'); K.box(g, -5, 0, 2, 2, '#8a4418'); K.box(g, 1, 1, 2, 2, '#8a4418'); K.box(g, -2, 3, 1, 1, '#8a4418'); } });
  const truck = c => K.spr(ID + 'tr' + c, 40, 14, g => { for (const x of [-16, -6, 10]) { K.box(g, x, -7, 6, 3, '#1a1222'); K.box(g, x, 4, 6, 3, '#1a1222'); }
    K.rr(g, -20, -6, 27, 12, 2, K.lin(g, 0, -6, 0, 6, '#ffffff', '#d6dbea', '#8a90a8')); for (let x = -15; x < 6; x += 6) K.box(g, x, -5, 1, 10, '#a8aec4');
    K.rr(g, 8, -6, 12, 12, 3, K.lin(g, 0, -6, 0, 6, K.lite(c, .4), c, K.dark(c, .4))); K.box(g, 14, -4, 3, 8, '#1b2a44'); K.box(g, 14, -4, 1, 2, '#7fc8ff'); K.box(g, 19, -5, 1, 2, '#fff6c8'); K.box(g, 19, 3, 1, 2, '#fff6c8'); });
  const snake = f => K.spr(ID + 'sn' + f, 28, 10, g => { for (let i = 0; i < 9; i++) { const x = -12 + i * 2.6, y = Math.sin(i * .9 + f * PI) * 2.2; K.ell(g, x, y, 2.4, 2.2, i % 2 ? '#ffd23c' : '#b06ae0'); }
    K.ell(g, 11, Math.sin(8.1 + f * PI) * 2, 3, 2.6, '#c88af0'); K.box(g, 11, -2 + f, 1, 1, '#12101c'); K.box(g, 13, f ? 1 : -1, 2, 1, '#e8231e'); });
  const fly = f => K.spr(ID + 'fl' + f, 10, 8, g => { K.ell(g, -3, f ? -2 : 0, 2.4, 1.6, '#d6f0ff'); K.ell(g, 3, f ? -2 : 0, 2.4, 1.6, '#d6f0ff'); K.ell(g, 0, 0, 1.8, 2.6, '#3a3050'); K.box(g, -1, -3, 1, 1, '#e8231e'); K.box(g, 1, -3, 1, 1, '#e8231e'); });
  const bugS = () => K.spr(ID + 'bug', 8, 8, g => { K.ell(g, 3, 0, 1.6, 1.8, '#1a1222'); K.ell(g, 0, 0, 3.2, 3.2, '#e8231e'); K.box(g, -3, 0, 6, 1, '#7a1410'); K.box(g, -2, -2, 1, 1, '#1a1222'); K.box(g, 1, -2, 1, 1, '#1a1222'); K.box(g, -1, 2, 1, 1, '#1a1222'); });
  /* ---- static background, painted once (the river stays transparent so the water can scroll under it) ---- */
  const BG = K.mkc(160, 208), b = BG.getContext('2d');
  b.drawImage(K.T.grass(160, 16), 0, 0); K.box(b, 0, 15, 160, 1, '#1f5a28');
  SL.forEach(sx => { K.box(b, sx - 2, 0, 20, 16, '#1b6fb0'); K.box(b, sx - 2, 0, 20, 1, '#0f4f8a'); K.box(b, sx - 3, 0, 1, 16, '#1f5a28'); K.box(b, sx + 18, 0, 1, 16, '#1f5a28'); });
  for (const r of [6, 12]) { b.drawImage(K.T.stone(160, 16, '#7a6a8a'), 0, r * 16); K.box(b, 0, r * 16, 160, 1, '#b0a0c0'); K.box(b, 0, r * 16 + 15, 160, 1, '#3a2e44'); for (let x = 0; x < 160; x += 16) K.box(b, x, r * 16 + 1, 1, 14, '#5a4a6a'); }
  b.drawImage(K.T.road(160, 80), 0, 112); for (let r = 8; r < 12; r++) for (let x = 4; x < 160; x += 20) K.box(b, x, r * 16 - 1, 10, 2, '#d6dbea'); K.box(b, 0, 112, 160, 1, '#ffd23c'); K.box(b, 0, 191, 160, 1, '#ffd23c');
  /* ---- state ---- */
  const F = K.fx(); let lanes, snk, frog, bug, flyAt = -1, flyT = 4, lives = 3, lvl = 1, home = [0, 0, 0, 0, 0], best, time, T = 0, dead = 0, clr = 0, shake = 0, note = '', noteT = 0, held = '', holdT = 0, pops = [], rings = [];
  function build() { const L = lvl, s = .85 + Math.min(L - 1, 9) * .1; lanes = [];
    const mk = (row, type, dir, sp, len, n) => { const span = Math.max(160 + len, n * (len + 28)), ph = A.rnd(0, span), o = []; for (let i = 0; i < n; i++) o.push((i * span / n + ph) % span); lanes.push({ row, type, dir, sp: sp * s, len, span, o, col: A.ri(0, 3), water: type === 'log' || type === 'turtle' }); };
    mk(1, 'log', 1, 22, L < 3 ? 64 : 48, L < 3 ? 2 : 3); if (L > 1) mk(2, 'turtle', -1, 30, 48, 3); else mk(2, 'log', -1, 28, 64, 2);
    mk(3, 'log', 1, 38, L < 2 ? 56 : 40, 3); if (L > 2) mk(4, 'turtle', -1, 24, 32, 3); else mk(4, 'log', -1, 24, 48, 3); mk(5, 'log', 1, 32, L < 4 ? 64 : 48, L < 4 ? 2 : 3);
    mk(7, 'car', -1, 36, 24, L < 2 ? 2 : 3); mk(8, 'car', 1, 28, 32, L < 5 ? 2 : 3); if (L > 2) mk(9, 'racer', -1, 70, 24, 1); else mk(9, 'car', -1, 48, 24, L < 2 ? 1 : 2);
    if (L > 1) mk(10, 'truck', 1, 30, 40, 2); else mk(10, 'car', 1, 34, 24, 2); mk(11, 'car', -1, 26, 32, L < 5 ? 2 : 3);
    snk = L > 3 ? { x: 150, dir: -1, sp: 18 * s } : null; }
  /* 0 = swimming, 1 = sinking (still safe), 2 = under water */
  const dive = (l, i) => { if (l.type !== 'turtle' || (lvl < 6 ? i % 3 : i % 3 === 1)) return 0; const u = (T + i * 2 + l.row) % 6; return u < 3.4 ? 0 : u < 4.6 ? 1 : 2; };
  const info = () => A.info('LEVEL ' + lvl), say = (s, t) => { note = s; noteT = t || 1.6; }, pop = (s, x, y, c) => pops.push({ s, x, y, t: 1, c: c || '#ffd23c' });
  function reset() { frog = { x: 72, row: 12, ox: 0, oy: 0, h: 0, rot: 0 }; best = 12; time = TMAX; bug = null;
    const ls = lanes.filter(l => l.type === 'log'); if (ls.length && Math.random() < .7) { const l = ls[A.ri(0, ls.length - 1)]; bug = { l, i: A.ri(0, l.o.length - 1), dx: A.ri(8, l.len - 8) }; } }
  function die(why) { if (dead > 0) return; lives--; dead = 1; held = ''; info(); const x = frog.x + 8, y = frog.row * 16 + 8;
    if (why === 'splash') { A.beep(260, .25, 'triangle'); A.beep(120, .3, 'sine', .06); rings.push({ x, y, t: 0 }); F.spark(x, y, ['#bfe8ff', '#ffffff', '#3fa8e0'], 16, 70); }
    else { A.beep(150, .3, 'sawtooth'); shake = .3; if (why === 'hit') F.boom(x, y); F.spark(x, y, ['#e8231e', '#ffffff', '#6fe85a'], 14, 90); if (why === 'time') say('TIME UP!', 1); } }
  function hop(k) { if (dead > 0 || clr > 0 || !(k in ROT)) return; const f = frog, x0 = f.x, r0 = f.row; f.rot = ROT[k];
    if (k === 'left') f.x = Math.max(0, f.x - 16); else if (k === 'right') f.x = Math.min(144, f.x + 16); else if (k === 'down') f.row = Math.min(12, f.row + 1);
    else if (f.row > 1) f.row--; else { /* into a lily pad bay: only if it is free and close enough, otherwise the hedge stops the frog */
      const i = SL.findIndex((sx, j) => !home[j] && Math.abs(f.x - sx) <= 11); if (i < 0) { A.beep(140, .06); f.oy = -3; f.ox = 0; f.h = 1; return; }
      const bonus = 50 + Math.floor(time) * 2; home[i] = 1; A.add(bonus); pop('+' + bonus, SL[i] + 8, 22); A.beep(700, .1, 'triangle'); A.beep(1050, .14, 'triangle'); F.spark(SL[i] + 8, 8, ['#ffd23c', '#ffffff', '#6fe85a'], 14, 60);
      if (flyAt === i) { A.add(100); pop('FLY +100', SL[i] + 8, 32, '#ffffff'); flyAt = -1; flyT = 6; }
      if (home.every(v => v)) { A.add(200); pop('+200', 80, 44, '#6fe85a'); clr = 1.6; say('LEVEL ' + lvl + ' CLEAR!', 1.6); [523, 659, 784, 1047].forEach((q, j) => setTimeout(() => A.beep(q, .14, 'square'), j * 110)); } else reset(); return; }
    if (f.row >= 6) f.x = Math.round(f.x / 16) * 16; /* back on the grid when on land */
    if (f.x === x0 && f.row === r0) return; f.ox = x0 - f.x; f.oy = (r0 - f.row) * 16; f.h = 1; A.beep(k === 'up' ? 520 : 440, .03);
    if (f.row < best) { best = f.row; A.add(10); } }
  build(); reset(); info();
  return {
    key(k) { if (k === 'a') k = 'up'; held = k; holdT = .28; hop(k); },
    tap(x, y) { const dx = x - frog.x - 8, dy = y - frog.row * 16 - 8; hop(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'); },
    update(dt) { T += dt; shake = Math.max(0, shake - dt); noteT -= dt;
      for (const l of lanes) for (let i = 0; i < l.o.length; i++) l.o[i] = ((l.o[i] + l.dir * l.sp * dt) % l.span + l.span) % l.span;
      if (snk) { snk.x += snk.dir * snk.sp * dt; if (snk.x < 14) snk.dir = 1; else if (snk.x > 146) snk.dir = -1; }
      for (const p of pops) { p.t -= dt; p.y -= 12 * dt; } pops = pops.filter(p => p.t > 0); for (const r of rings) r.t += dt; rings = rings.filter(r => r.t < .7);
      if (flyAt >= 0) { flyT -= dt; if (flyT <= 0 || home[flyAt]) { flyAt = -1; flyT = A.rnd(5, 9); } }
      else if ((flyT -= dt) <= 0) { const e = [0, 1, 2, 3, 4].filter(i => !home[i]); if (e.length) flyAt = e[A.ri(0, e.length - 1)]; flyT = 6; }
      if (clr > 0) { clr -= dt; if (clr <= 0) { lvl++; home = [0, 0, 0, 0, 0]; flyAt = -1; if (lives < 5) { lives++; say(NEWS[lvl] || 'LEVEL ' + lvl, 2.2); pop('+1 LIFE', 80, 196, '#ff8a9a'); } else say(NEWS[lvl] || 'LEVEL ' + lvl, 2.2); build(); reset(); info(); } return; }
      if (dead > 0) { dead -= dt; if (dead <= 0) { if (lives <= 0) A.over(); else reset(); } return; }
      const f = frog; f.h = Math.max(0, f.h - dt * 11);
      if (held && A.keys[held]) { if ((holdT -= dt) <= 0) { holdT = .16; hop(held); } } else held = '';
      const t0 = time; time -= dt; if (time <= 0) return die('time'); if (time < 6 && Math.floor(time) !== Math.floor(t0)) A.beep(880, .05);
      if (clr > 0) return; const cx = f.x + 8, l = lanes.find(v => v.row === f.row);
      if (snk && f.row === 6 && Math.abs(cx - snk.x) < 15) return die('hit');
      if (bug && bug.l.row === f.row && f.h <= 0 && Math.abs(bug.l.o[bug.i] - bug.l.len + bug.dx - cx) < 9) { bug = null; A.add(50); pop('+50', cx, f.row * 16, '#ff8a9a'); A.beep(990, .08, 'triangle'); F.spark(cx, f.row * 16 + 8, ['#e8231e', '#ffffff'], 8, 50); }
      if (!l) return;
      if (!l.water) { for (const o of l.o) { const x = o - l.len; if (f.x + 13 > x + 1 && f.x + 3 < x + l.len - 1) return die('hit'); } return; }
      const on = l.o.some((o, i) => { const x = o - l.len; return cx >= x - 3 && cx <= x + l.len + 3 && dive(l, i) < 2; });
      if (on) f.x = Math.max(0, Math.min(144, f.x + l.dir * l.sp * dt)); /* at the screen edge the ride slides away under the frog */ else if (f.h <= 0) die('splash'); },
    draw(g) { const sh = shake > 0; if (sh) { g.save(); g.translate(K.ri(-1, 1), K.ri(-1, 1)); }
      K.scroll(g, K.T.water(64, 64), T * 5, 0, 160, 96); g.drawImage(BG, 0, 0);
      SL.forEach((sx, i) => { K.put(g, K.lily(), sx + 8, 8); if (home[i]) K.put(g, K.frog(clr > 0 ? Math.floor(T * 8) % 2 : 0), sx + 8, 7, { rot: PI }); else if (flyAt === i && (flyT > 1.5 || Math.floor(T * 10) % 2)) K.put(g, fly(Math.floor(T * 12) % 2), sx + 8, 7 + Math.round(Math.sin(T * 6))); });
      for (const l of lanes) { const y = l.row * 16, L = l.len, fl = l.dir < 0 ? { flip: 1 } : null;
        l.o.forEach((o, i) => { const x = Math.round(o - L);
          if (l.type === 'log') { K.box(g, x + 2, y + 5, L, 10, 'rgba(8,30,70,.45)'); K.put(g, K.log(L), x + L / 2, y + 8, fl); }
          else if (l.type === 'turtle') { const d = dive(l, i); for (let j = 0; j < L / 16; j++) { const tx = x + 8 + j * 16;
            if (d === 2) { K.box(g, tx - 3 + (Math.floor(T * 4 + j) % 3), y + 7, 2, 1, '#bfe8ff'); K.box(g, tx + 2, y + 5 + (Math.floor(T * 3 + j) % 3), 1, 1, '#ffffff'); }
            else { if (!d) K.box(g, tx - 5, y + 5, 12, 9, 'rgba(8,30,70,.4)'); K.put(g, turtle(d ? 2 : Math.floor(T * 2 + j) % 2), tx, y + 8, fl); if (d) { K.box(g, tx - 7, y + 8, 2, 1, '#bfe8ff'); K.box(g, tx + 5, y + 8, 2, 1, '#bfe8ff'); } } } }
          else { K.box(g, x + 2, y + 5, L, 10, 'rgba(0,0,0,.3)');
            if (l.type === 'truck') K.put(g, truck(CC[(l.col + i) % 3]), x + L / 2, y + 8, fl);
            else { const rc = l.type === 'racer'; if (rc) for (let j = 0; j < 3; j++) K.box(g, x + L + 3 + j * 7 + Math.floor(T * 20) % 4, y + 4 + j * 4, 5, 1, '#fff6c8'); K.put(g, K.car(rc ? '#ff7a1a' : CC[(l.col + i) % 4], L), x + L / 2, y + 8, { rot: l.dir > 0 ? PI / 2 : -PI / 2 }); } } }); }
      if (bug) K.put(g, bugS(), bug.l.o[bug.i] - bug.l.len + bug.dx, bug.l.row * 16 + 8 + (Math.floor(T * 3) % 2), bug.l.dir < 0 ? { flip: 1 } : null);
      if (snk) { K.shadow(g, snk.x, 106, 11, 2); K.put(g, snake(Math.floor(T * 5) % 2), snk.x, 103, snk.dir < 0 ? { flip: 1 } : null); }
      for (const r of rings) { const q = Math.round(3 + r.t * 16); g.fillStyle = r.t < .4 ? '#ffffff' : '#bfe8ff'; g.fillRect(r.x - q, r.y - 1, 2, 2); g.fillRect(r.x + q - 2, r.y - 1, 2, 2); g.fillRect(r.x - 1, r.y - (q >> 1), 2, 1); g.fillRect(r.x - 1, r.y + (q >> 1), 2, 1); }
      const f = frog, e = f.h * f.h, fx = Math.round(f.x + f.ox * e) + 8, fy = Math.round(f.row * 16 + f.oy * e) + 8;
      if (dead <= 0 && clr <= 0) { const air = f.h > .15 && f.h < .9; K.shadow(g, fx, fy + 5, air ? 4 : 5, 2); K.put(g, K.frog(f.h > .1 ? 1 : 0), fx, fy - (air ? 2 : 0), f.rot ? { rot: f.rot } : null); }
      F.draw(g); for (const p of pops) { A.text(g, p.s, p.x + 1, p.y + 1, '#12101c', 1, 'center'); A.text(g, p.s, p.x, p.y, p.c, 1, 'center'); }
      for (let i = 0; i < lives; i++) { const x = 152 - i * 7, y = 197; K.box(g, x - 1, y, 7, 4, '#12101c'); K.box(g, x, y + 4, 5, 1, '#12101c'); K.box(g, x + 1, y + 5, 3, 1, '#12101c'); K.box(g, x, y, 2, 4, '#e8231e'); K.box(g, x + 3, y, 2, 4, '#e8231e'); K.box(g, x + 1, y + 1, 3, 4, '#e8231e'); K.box(g, x + 2, y + 5, 1, 1, '#e8231e'); K.box(g, x, y, 1, 1, '#ffb0a0'); }
      const tw = Math.round(160 * Math.max(0, time) / TMAX); K.box(g, 0, 205, 160, 3, '#12101c'); if (time > 6 || Math.floor(T * 6) % 2) K.box(g, 0, 206, tw, 2, time > 12 ? '#6fe85a' : time > 6 ? '#ffd23c' : '#e8231e');
      if (noteT > 0) { const w = note.length * 8 + 10; K.box(g, 80 - w / 2, 92, w, 20, '#12101c'); K.box(g, 80 - w / 2 + 1, 93, w - 2, 18, '#2a2440'); A.text(g, note, 80, 97, '#ffd23c', 2, 'center'); }
      if (sh) g.restore(); }
  };
} });
