/* Space Slalom v0.4 — an 8-sector Galaxy Cup: gate streaks, perfect passes, star lines, rocks, sliding gates, comets, shields */
Arcade.game('space-slalom', { w: 240, h: 320, pad: 'lr',
help: 'Race through all 8 sectors of the Galaxy Cup! Fly between the two lights of every gate. Steer with the arrow keys or A and D, the on-screen arrows, or hold a finger or the mouse on the screen and the ship flies to it. Missing a gate, bumping a rock or getting hit by a comet costs a life. Gates in a row build a streak for more points, and flying through the bright middle of a gate is a PERFECT pass for a bonus. Follow the star lines for extra points; hearts give a life back and a blue bubble is a shield that saves you once. New things arrive as you go: rocks in sector 2, sliding purple gates in sector 3, comets (move away from the red warning!) in sector 4. Cross the checkered line to clear a sector; a flawless sector earns an extra life.',
init(A) {
  const K = Art, W = 240, H = 320, SY = 258, ID = 'space-slalom-', F = K.fx(), LAST = 8, LAT = 190;
  const NEW = ['', 'FLY THROUGH EVERY GATE', 'WATCH OUT FOR ROCKS', 'PURPLE GATES SLIDE', 'COMETS! DODGE THE WARNING', 'ROCK FIELDS AHEAD', 'FASTER AND FASTER', 'NARROW GATES', 'THE FINAL SECTOR'];
  const PCOL = ['#3f9ae0', '#e08a3f', '#b06ae0', '#3fc49a', '#e05a6a', '#d8c24a', '#5a7ae0', '#e86ac0'], GCOL = ['#ffd23c', '#3fd45a', '#e8231e', '#c08aff'];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const stars = []; for (let i = 0; i < 46; i++) stars.push([A.ri(0, W - 1), A.ri(0, H - 1), A.ri(1, 3)]);
  let x = 120, vx = 0, tx = null, shipY = SY, sp = 60, cruise = 120, gateW = 70, dist = 0, secD = 0, t = 0;
  let lvl = 0, total = 0, left = 0, clean = true, gap = 0, plan = null, dir = 1, heartOK, shieldOK, cometT = 0, puffT = 0;
  let gates = [], rocks = [], picks = [], comets = [], pops = [], res = [], line = null;
  let lives = 3, shield = 0, inv = 0, streak = 0, shake = 0, dead = 0, won = 0, banner = 0, bTxt = '', bSub = '', bNote = '';

  /* ---- sprites (cached by K.spr) ---- */
  const sShip = b => K.spr(ID + 'ship' + b, 24, 26, g => { if (b) g.scale(.72, 1);
    K.part(g, K.sym([2, -3, 11, 6, 11, 11, 3, 8]), K.lin(g, -11, 0, 11, 0, '#ff9a8a', '#e8231e', '#7a1410'));
    K.mir(g, [9, 1, 11, 1, 11, 11, 9, 10], '#ffe27a', '#c8901e');
    K.part(g, K.sym([0, -13, 3, -7, 4, 5, 2, 11]), K.lin(g, -4, 0, 4, 0, '#ffffff', '#dfe6ee', '#8793a6'));
    K.ell(g, 0, -5, 2, 3.6, K.lin(g, 0, -9, 0, -1, '#c8fffa', '#2fc4ba', '#0e6a72'));
    K.box(g, -1, 1, 2, 8, '#e8231e'); K.box(g, -3, 10, 2, 2, '#3a4152'); K.box(g, 1, 10, 2, 2, '#3a4152'); });
  const sFlame = f => K.spr(ID + 'fl' + f, 6, 10, g => K.part(g, [-3, -5, 3, -5, f ? 1 : 2, 1, 0, f ? 2 : 5, f ? -2 : -1, 1], K.lin(g, 0, -5, 0, 5, '#fff6c8', '#ffd23c', '#ff8a1e')), { ol: [110, 20, 14] });
  const sPost = (c, mv) => K.spr(ID + 'post' + c + mv, 16, 12, g => { if (mv) { K.box(g, -8, -1, 16, 3, '#59627a'); K.box(g, -8, -1, 2, 3, '#ffb054'); K.box(g, 6, -1, 2, 3, '#ffb054'); }
    K.ell(g, 0, 0, 6, 6, K.lin(g, -6, -6, 6, 6, '#f2f5f8', '#8a94a4', '#3a4152')); K.ell(g, 0, 0, 3.4, 3.4, GCOL[c]); K.box(g, -2, -2, 1, 1, '#ffffff'); });
  const sComet = () => K.spr(ID + 'comet', 12, 20, g => { K.part(g, [-4, 4, 0, -10, 4, 4], K.lin(g, 0, -10, 0, 4, '#2a4ad0', '#7fd8ff'));
    K.ell(g, 0, 5, 5, 5, K.rad(g, -1, 4, .5, 6, '#ffffff', '#9fe4ff', '#2a6ad0')); });
  const sWarn = () => K.spr(ID + 'warn', 13, 12, g => { K.part(g, [0, -6, 6.5, 6, -6.5, 6], '#e8231e'); K.box(g, -1, -2, 2, 4, '#fff6c8'); K.box(g, -1, 3, 2, 2, '#fff6c8'); });
  const sBub = () => K.spr(ID + 'bub', 13, 13, g => { K.ell(g, 0, 0, 6.4, 6.4, K.rad(g, -2, -2, .5, 8, '#c8f4ff', '#3f9ae0', '#1b3a8a')); K.ell(g, 0, 0, 3.6, 3.6, '#141428'); K.ell(g, 0, 0, 2, 2, '#7fd8ff'); });
  const sRing = f => K.spr(ID + 'ring' + f, 34, 34, g => { g.lineWidth = 2; g.strokeStyle = f ? '#c8f4ff' : '#5fc8ff'; g.beginPath(); g.arc(0, 0, 15, 0, K.TAU); g.stroke(); K.box(g, -9, -12, 3, 2, '#ffffff'); }, { ol: 0 });
  const sLine = () => K.spr(ID + 'line', 240, 8, g => { for (let i = 0; i < 60; i++) for (let j = 0; j < 2; j++) K.box(g, -120 + i * 4, -4 + j * 4, 4, 4, (i + j) % 2 ? '#f2f5f8' : '#2a2f45'); }, { ol: 0 });
  const sPlanet = i => K.spr(ID + 'pl' + i, 58, 58, g => { const c = K.mix(PCOL[i], '#070a1c', .74), d = K.dark(c, .3);
    K.ell(g, 0, 0, 28, 28, K.rad(g, -10, -10, 2, 44, K.lite(c, .35), c, K.dark(c, .75)));
    if (i % 2) { K.ell(g, 0, -9, 24, 3, d); K.ell(g, 2, 5, 25, 2.5, d); K.ell(g, 0, 15, 20, 2, d); } else { K.ell(g, -9, -6, 6, 5, d); K.ell(g, 8, 8, 8, 6, d); K.ell(g, 10, -13, 3, 2.5, d); } }, { ol: 0, L: 9 });

  /* ---- helpers ---- */
  const info = () => A.info('SECTOR ' + lvl + ' · ' + res.length + '/' + total);
  const say = (a, b, c, d) => { bTxt = a; bSub = b || ''; bNote = c || ''; banner = d || 2.4; };
  const pop = (px, py, s, c) => pops.push({ x: clamp(px, 26, W - 26), y: py, s, c: c || '#fff6c8', l: .9 });
  const tune = (fs, type) => fs.forEach((f, i) => setTimeout(() => A.beep(f, .14, type || 'triangle', .05), i * 110));
  const spacing = () => 120 + cruise * .2;
  const txt = (g, s, px, py, c, sc) => { A.text(g, s, px + 1, py + 1, '#140e1c', sc, 'center'); A.text(g, s, px, py, c, sc, 'center'); };

  function sector() { lvl++; total = left = 10 + 2 * (lvl >> 1); res = []; clean = true; cruise = 105 + 15 * lvl; gateW = Math.round(74 - 3.5 * lvl);
    gap = 150; plan = null; secD = 0; heartOK = shieldOK = true; cometT = A.rnd(2.5, 4); info(); }
  /* where the next gate goes: always reachable from the previous one, zig-zagging like a slalom course */
  function mkPlan(from) { const amp = lvl >= 3 && Math.random() < .2 + lvl * .06 ? A.rnd(12, 22) : 0;
    const r = Math.min(96, LAT * .5 * spacing() / cruise) - amp, lo = gateW / 2 + 12 + amp, hi = W - lo, step = () => from + dir * A.rnd(.4, 1) * r;
    if (Math.random() < .25) dir = -dir; let nx = step(); if (nx < lo || nx > hi) { dir = -dir; nx = step(); }
    return { x: clamp(nx, lo, hi), amp }; }
  function spawn() { const sx = spacing(), p = plan || mkPlan(x), y0 = -14; gap += sx; left--;
    gates.push({ bx: p.x, x: p.x, y: y0, w: gateW, amp: p.amp, ph: A.rnd(0, 6), st: 0 });
    if (!left) { plan = null; line = { y: y0 - sx * .8 }; return; }
    const n = plan = mkPlan(p.x), at = f => ({ x: p.x + (n.x - p.x) * f, y: y0 - sx * f }), side = Math.random() < .5 ? -1 : 1;
    /* rocks sit beside the racing line and never drift far onto it */
    const rock = (f, sd, big) => { const m = at(f), r = big ? A.ri(10, 12) : A.ri(5, 8); rocks.push({ x: clamp(m.x + sd * (r + A.rnd(17, 36)), 6, W - 6), y: m.y, vx: sd * A.rnd(-4, 11), r, v: A.ri(0, 2) }); };
    if (lvl >= 2 && Math.random() < .3 + lvl * .09) rock(.5, side, lvl >= 5 && Math.random() < .35);
    if (lvl >= 5 && Math.random() < .12 * (lvl - 3)) rock(Math.random() < .5 ? .28 : .72, -side);
    let mid = 0; if (lives < 3 && heartOK && Math.random() < .3) { mid = 1; heartOK = false; } else if (lvl >= 3 && !shield && shieldOK && Math.random() < .14) { mid = 2; shieldOK = false; }
    if (mid || Math.random() < .6) for (const f of [.3, .5, .7]) { const m = at(f); picks.push({ x: m.x, y: m.y, k: f === .5 ? mid : 0 }); } }

  function hurt(msg, hx) { streak = 0; clean = false; pop(hx, SY - 26, msg, '#ff6a5a'); if (inv > 0 || dead > 0) return;
    if (shield) { shield = 0; inv = 1.2; F.spark(x, SY, ['#7fd8ff', '#c8f4ff', '#ffffff'], 18, 110); A.beep(520, .2, 'triangle', .05); return; }
    lives--; inv = 1.8; shake = .35; sp = cruise * .4; F.boom(x, SY, 1); F.spark(x, SY, ['#ffd23c', '#ff8a1e', '#f2f5f8'], 14, 120); A.beep(120, .35, 'sawtooth', .06); info();
    if (lives <= 0) { dead = 1.3; F.boom(x - 6, SY + 4, 1); F.boom(x + 7, SY - 5, 0); } }
  function pass(q) { const off = Math.abs(x - q.x);
    if (off >= q.w / 2 - 2) { q.st = 2; res.push(0); hurt('MISS', x); if (inv > 0 && lives > 0) A.beep(160, .2, 'sawtooth', .04); info(); return; }
    const perfect = off < q.w * .16; q.st = 1; res.push(1); streak++; const n = 50 + Math.min(10, streak) * 10 + (perfect ? 50 : 0); A.add(n);
    pop(x, SY - 26, perfect ? 'PERFECT +' + n : '+' + n, perfect ? '#ffd23c' : '#8ff08a'); A.beep(560 + Math.min(10, streak) * 45, .07, 'triangle'); if (perfect) A.beep(1320, .09, 'square', .025);
    for (const s of [-1, 1]) F.spark(q.x + s * q.w / 2, SY, perfect ? ['#ffd23c', '#fff6c8'] : ['#3fd45a', '#8ff08a'], perfect ? 9 : 5, 70);
    if (streak && streak % 5 === 0) { pop(120, 120, 'STREAK ' + streak + '!', '#5fe3d6'); A.beep(990, .12, 'triangle', .04); } info(); }
  function clear() { let n = 200 * lvl, note = 'SECTOR ' + lvl + ' CLEAR +' + n; F.spark(x, SY, ['#ffd23c', '#5fe3d6', '#ff8a9a', '#ffffff'], 26, 140);
    if (clean) { n += 300; note = 'FLAWLESS! +' + n + (lives < 5 ? ' AND +1 LIFE' : ''); if (lives < 5) lives++; } A.add(n);
    if (lvl === LAST) { A.add(lives * 500); won = 2.8; say('GALAXY CUP!', 'ALL 8 SECTORS CLEAR', 'LIFE BONUS +' + lives * 500, 3); tune([523, 659, 784, 1047, 1319]); info(); return; }
    tune([523, 659, 784]); sector(); say('SECTOR ' + lvl, NEW[lvl], note); }

  sector(); say('SECTOR 1', NEW[1], 'GALAXY CUP: 8 SECTORS');
  return {
    update(dt) { t += dt; inv -= dt; shake -= dt; banner -= dt; const alive = dead <= 0 && won <= 0;
      if (dead > 0) { sp = Math.max(0, sp - 160 * dt); dead -= dt; if (dead <= 0) { A.over(); return; } }
      else if (won > 0) { shipY -= (70 + (2.8 - won) * 160) * dt; won -= dt; if (Math.random() < dt * 7) { F.spark(A.rnd(30, 210), A.rnd(40, 200), [PCOL[A.ri(0, 7)], '#ffffff', '#ffd23c'], 16, 90); A.beep(A.rnd(700, 1300), .06, 'square', .02); } if (won <= 0) { A.over(true); return; } }
      else sp += clamp(cruise - sp, -90 * dt, 90 * dt);
      /* steering: keys / pad win over the pointer; the pointer sets a spot to fly to */
      const kd = alive ? (A.keys.right ? 1 : 0) - (A.keys.left ? 1 : 0) : 0;
      if (kd) tx = null; else if (A.ptr.down || A.ptr.moved) tx = clamp(A.ptr.x, 10, W - 10);
      const want = !alive ? 0 : kd ? kd * LAT : tx != null ? clamp((tx - x) * 10, -250, 250) : 0;
      vx += clamp(want - vx, -1700 * dt, 1700 * dt); x += vx * dt; if (x < 10 || x > W - 10) { x = clamp(x, 10, W - 10); vx = 0; }
      const dy = sp * dt; dist += dy; secD += dy;
      if (alive) { gap -= dy; if (gap <= 0 && left > 0) spawn(); }
      for (const q of gates) { const py = q.y; q.y += dy; if (q.amp) q.x = q.bx + q.amp * Math.sin(q.ph + t * 1.5); if (alive && !q.st && py < SY && q.y >= SY) pass(q); }
      if (line) { const py = line.y; line.y += dy; if (alive && py < SY && line.y >= SY) clear(); }
      for (const r of rocks) { r.y += dy; r.x += r.vx * dt; if (alive && inv <= 0 && (r.x - x) ** 2 + (r.y - SY) ** 2 < (r.r + 5) ** 2) { r.y = 999; F.spark(r.x, SY, ['#8a7a6a', '#c8b8a8', '#5a4a3a'], 10, 80); hurt('OUCH', x); } }
      for (const p of picks) { p.y += dy; if (alive && (p.x - x) ** 2 + (p.y - SY) ** 2 < 144) { p.y = 999;
        if (p.k === 1) { lives++; pop(x, SY - 26, '+1 LIFE', '#ff8a9a'); tune([660, 880]); info(); } else if (p.k === 2) { shield = 1; pop(x, SY - 26, 'SHIELD', '#7fd8ff'); tune([440, 660, 880], 'square'); }
        else { A.add(20); A.beep(1180, .05, 'square', .025); F.spark(p.x, SY, ['#ffd23c', '#fff6c8'], 5, 50); } } }
      /* comets: a warning marks the column first, then the comet streaks straight down it */
      if (alive && lvl >= 4 && left > 0 && left < total - 1 && (cometT -= dt) <= 0) { cometT = A.rnd(2, 3.4) + (LAST - lvl) * .45; comets.push({ x: clamp(x + A.rnd(-8, 8), 10, W - 10), y: -24, w: 1 }); A.beep(880, .08, 'square', .03); }
      for (const c of comets) { if (c.w > 0) { c.w -= dt; if (c.w <= 0) A.beep(300, .3, 'sawtooth', .03); continue; }
        c.y += (sp + 250) * dt; F.puff(c.x + A.rnd(-2, 2), c.y - 10, Math.random() < .5 ? '#7fd8ff' : '#2a6ad0', -30);
        if (alive && inv <= 0 && (c.x - x) ** 2 + (c.y - SY) ** 2 < 121) { c.y = 999; hurt('COMET!', x); } }
      gates = gates.filter(q => q.y < H + 20); rocks = rocks.filter(r => r.y < H + 20); picks = picks.filter(p => p.y < H + 20); comets = comets.filter(c => c.y < H + 30);
      for (const p of pops) { p.y -= 26 * dt; p.l -= dt; } pops = pops.filter(p => p.l > 0);
      if (dead <= 0 && (puffT -= dt) <= 0) { puffT = .05; F.puff(x + A.rnd(-1, 1), shipY + 17, Math.random() < .5 ? '#ff8a1e' : '#ffd23c', 70 + sp * .4); } },

    draw(g) { const fr = Math.floor(t * 12), sh = shake > 0;
      if (sh) { g.save(); g.translate(A.ri(-2, 2), A.ri(-2, 2)); }
      K.scroll(g, K.T.space(128, 128), 0, -dist * .2, W, H);
      K.put(g, sPlanet(lvl - 1), lvl % 2 ? 48 : 192, -34 + secD * .13);
      for (const q of stars) { g.fillStyle = ['', '#56658f', '#9fb4e6', '#ffffff'][q[2]]; g.fillRect(q[0], Math.floor(q[1] + dist * q[2] * .22) % H, 1, q[2] + (sp > 170 ? 2 : sp > 130 ? 1 : 0)); }
      if (line) K.put(g, sLine(), 120, line.y);
      for (const q of gates) { const y = Math.round(q.y), c = q.st || (q.amp ? 3 : 0), a = q.x - q.w / 2 + 8, b = q.x + q.w / 2 - 8, pz = q.w * .16;
        for (let i = 0, bx = a; bx <= b; bx += 4, i++) { const mid = Math.abs(bx - q.x) < pz; K.box(g, Math.round(bx) - 1, y - ((i + fr) % 2), 2, 2, q.st === 1 ? '#8ff08a' : q.st ? '#ff8a7a' : mid ? '#ffffff' : '#5fe3d6'); if (mid && !q.st) K.box(g, Math.round(bx) - 1, y - 4 + ((i + fr) % 2) * 6, 2, 1, '#ffd23c'); }
        for (const s of [-1, 1]) K.put(g, sPost(c, q.amp ? 1 : 0), q.x + s * q.w / 2, y); }
      for (const p of picks) { const by = p.y + (Math.floor(t * 4 + p.x) % 2); K.put(g, p.k === 1 ? K.heart() : p.k === 2 ? sBub() : K.star2('#ffd23c', 11), p.x, by); }
      for (const r of rocks) K.put(g, K.rock(r.r, r.v), r.x, r.y, { rot: Math.round(r.y / 36 + r.v) * Math.PI / 2 });
      for (const c of comets) { if (c.w > 0) { if (fr % 4 < 3) { K.put(g, sWarn(), c.x, 12); for (let y = 24; y < SY - 20; y += 9) K.box(g, Math.round(c.x), y, 1, 4, '#e8231e'); } } else K.put(g, sComet(), c.x, c.y); }
      if (dead <= 0 && (inv <= 0 || Math.floor(inv * 10) % 2)) { K.put(g, sFlame(fr % 2), x, shipY + 17); K.put(g, sShip(Math.abs(vx) > 70 ? 1 : 0), x, shipY, vx < -70 ? { flip: 1 } : null); if (shield) K.put(g, sRing(fr % 6 < 3 ? 0 : 1), x, shipY); }
      F.draw(g);
      for (const p of pops) txt(g, p.s, p.x, p.y, p.c, 1);
      if (sh) g.restore();
      /* HUD: lives, streak, gate results of this sector */
      for (let i = 0; i < lives; i++) K.put(g, K.heart(), 9 + i * 13, 9);
      if (streak > 1) { A.text(g, 'STREAK ' + streak, W - 4, 5, '#140e1c', 1, 'right'); A.text(g, 'STREAK ' + streak, W - 5, 4, '#5fe3d6', 1, 'right'); }
      for (let i = 0, x0 = 120 - total * 3; i < total; i++) { K.box(g, x0 + i * 6, H - 9, 5, 5, '#140e1c'); K.box(g, x0 + i * 6 + 1, H - 8, 3, 3, i >= res.length ? '#3a4152' : res[i] ? '#3fd45a' : '#e8231e'); }
      if (banner > 0 && (banner > .5 || fr % 2)) { if (bNote) txt(g, bNote, 120, 92, '#ffd23c', 1); txt(g, bTxt, 120, 106, '#f2f5f8', 3); if (bSub) txt(g, bSub, 120, 130, '#5fe3d6', bSub.length > 22 ? 1 : 2); } }
  };
} });
