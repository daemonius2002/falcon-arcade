/* Boat Rush: race a speedboat down five river stages to the sea. World distance is "w" (pixels down the river). */
Arcade.game('boat-rush', { w: 240, h: 320, pad: 'lr',
help: 'Race your speedboat down five river stages to the sea! Steer with your finger, the mouse, the arrow keys or the on-screen buttons. Stay off the banks and dodge rocks, drifting logs, whirlpools (they pull you in) and islands. Collect coins and pass between the red and green buoys: every 5 in a row raises your score multiplier up to x5, and a crash resets it. Yellow arrows give a speed boost, hearts give an extra life. You start with 3 lives, and each finished stage and every life you bring to the sea earns bonus points.',
init(A) {
  const K = Art, W = 240, H = 320, BY = 250, AHEAD = 70, TAU = Math.PI * 2;
  /* stages: name, cruise speed, hazard spacing, colours [sand, sand shade, water edge, water a, water b, deep, glint, rock] */
  const ST = [
    { n: 'MEADOW', v: 95, gap: 150, c: ['#ecd9a0', '#c8b070', '#3f96d6', '#1b6fb0', '#1f76b8', '#16609c', '#7fc0f0', '#8a94a4'] },
    { n: 'PINE WOODS', v: 104, gap: 140, c: ['#d0c090', '#a09060', '#3a8ec0', '#17639c', '#1b6aa4', '#125488', '#78b8e6', '#7a8494'] },
    { n: 'RED CANYON', v: 112, gap: 130, c: ['#f0c890', '#c8905a', '#3fc0c0', '#1b8a9a', '#1f92a2', '#167686', '#9fe6e6', '#b8704a'] },
    { n: 'ICE VALLEY', v: 120, gap: 124, c: ['#ffffff', '#bcd6ec', '#7fc4ee', '#3f8ac8', '#4690cc', '#3478b4', '#e6f6ff', '#bfe0f5'] },
    { n: 'SUNNY DELTA', v: 127, gap: 118, c: ['#fff0c0', '#e0c080', '#4fc8e0', '#1f96c8', '#24a0d0', '#1880b0', '#b8f0ff', '#8a94a4'] }];
  const E = []; ST.reduce((a, t) => (E.push(a + t.v * 27), a + t.v * 27), 0); /* world distance where each stage ends */
  const T = E[4], si = w => { let i = 0; while (i < 4 && w >= E[i]) i++; return i; };
  /* river centre and half width: it winds more and gets narrower on the way down, then opens into the sea */
  const cx = w => 120 + Math.sin(w * .008) * (28 + 22 * Math.min(1, w / T)) + Math.sin(w * .021 + 1) * 10;
  const hw = w => 60 - 9 * Math.min(1, w / T) + 3 * Math.sin(w * .013) + Math.max(0, w - T) * 1.2;

  /* ---- sprites (cached by K.spr / K.tex) ---- */
  const starP = (n, r1, r2) => { const p = []; for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU, r = i % 2 ? r2 : r1; p.push(Math.sin(a) * r, -Math.cos(a) * r); } return p; };
  const boatS = l => K.spr('boat-rush-boat' + l, 20, 30, g => { g.rotate(l * .2);
    K.part(g, K.sym([0, -14, 4, -9, 6, -2, 6, 10, 4, 13]), K.lin(g, -6, 0, 6, 0, '#ffffff', '#e6ebf5', '#8a94a4'));
    K.part(g, K.sym([0, -10, 3, -5, 4, 0, 4, 9]), '#d8a868'); K.box(g, -6, 4, 12, 2, '#e8231e'); K.box(g, -6, 7, 12, 1, '#ffd23c');
    K.part(g, K.sym([0, -6, 4, -3, 4, 0]), '#1b2a44'); K.box(g, -2, -4, 2, 1, '#7fc0f0');
    K.ell(g, 0, 3, 2.4, 2.4, '#ff9a2a'); K.box(g, -1, 2, 1, 1, '#ffe0a0'); K.box(g, -2, 10, 4, 4, '#3a4152'); K.box(g, -1, 11, 2, 2, '#69758a'); });
  const boostS = () => K.spr('boat-rush-boost', 16, 14, q => { for (const y of [-6, 1]) K.part(q, [-7, y + 5, 0, y, 7, y + 5, 7, y + 8, 0, y + 3, -7, y + 8], K.lin(q, 0, y, 0, y + 8, '#fff6c8', '#ffd23c', '#c8801e')); });
  const buoyS = c => K.spr('boat-rush-buoy' + c, 8, 12, g => { K.ell(g, 0, 2, 3.6, 3.6, c); K.box(g, -3, 1, 6, 2, '#ffffff'); K.box(g, 0, -6, 1, 5, '#3a4152'); K.box(g, 1, -6, 3, 2, c); });
  const whirlS = f => K.spr('boat-rush-whirl' + f, 30, 30, g => { K.ell(g, 0, 0, 14, 14, '#2f86c6'); K.ell(g, 0, 0, 11, 11, '#125488'); g.rotate(f * Math.PI / 4); g.lineWidth = 1.8; g.strokeStyle = '#d6f0ff';
    for (let arm = 0; arm < 2; arm++) { g.rotate(Math.PI); g.beginPath(); for (let a = 0; a < 4.4; a += .3) g.lineTo(Math.cos(a) * (2.5 + a * 2.3), Math.sin(a) * (2.5 + a * 2.3)); g.stroke(); } K.ell(g, 0, 0, 2.6, 2.6, '#081c3a'); }, { ol: 0 });
  const isleS = () => K.spr('boat-rush-isle', 28, 38, g => { K.ell(g, 0, 0, 14, 19, '#b8e6ff'); K.ell(g, 0, 0, 12, 17, '#c8b070'); K.ell(g, -1, -1, 10, 15, '#ecd9a0'); K.box(g, 3, 9, 3, 2, '#c8b070'); K.box(g, -6, -11, 2, 2, '#c8b070'); });
  const pineS = snow => K.spr('boat-rush-pine' + snow, 20, 20, g => { K.part(g, starP(7, 10, 5), '#17502a'); K.part(g, starP(7, 7, 3.4), snow ? '#dfeaf5' : '#2f8a3a'); K.part(g, starP(7, 3.6, 1.6), snow ? '#ffffff' : '#58b96a'); });
  const palmS = () => K.spr('boat-rush-palm', 22, 22, g => { K.part(g, starP(6, 11, 2.6), '#1f7a2a'); g.rotate(.5); K.part(g, starP(6, 8, 2), '#4fc04a'); K.ell(g, 0, 0, 2, 2, '#8a5a2a'); });
  const cactS = () => K.spr('boat-rush-cactus', 14, 14, g => { K.box(g, -6, -1, 12, 3, '#2f8a3a'); K.ell(g, 0, 0, 3.4, 6, K.lin(g, -3, 0, 3, 0, '#8ae06a', '#3fa84a', '#1f6a2a')); K.box(g, -1, -3, 1, 2, '#ffb0d0'); });
  const gtex = i => i === 0 ? K.T.grass(64, 64) : K.tex('boat-rush-ground' + i, 64, 64, [0,
    { base: '#1f6a34', tile: 1, blobs: [['#2f8a3a', .5, 14, 14, 40], ['#12481f', .55, 12, 14, 40]], specks: [['#3fa84a', 70], ['#0e3a18', 50]] },
    { base: '#b0703a', tile: 1, blobs: [['#d0904a', .55, 12, 14, 40], ['#8a4a24', .5, 10, 14, 36]], specks: [['#e0a868', 60, 2, 1], ['#7a3c1c', 40]] },
    { base: '#dfeaf5', tile: 1, blobs: [['#ffffff', .7, 14, 14, 40], ['#b4cde6', .5, 10, 14, 40]], specks: [['#ffffff', 60, 2, 1], ['#a0bcd8', 40]] },
    { base: '#e6c888', tile: 1, blobs: [['#f6e0a8', .6, 12, 14, 40], ['#c8a060', .45, 10, 14, 36]], specks: [['#fff0c0', 60, 2, 1], ['#b08a4a', 40]] }][i]);
  const scen = (st, q) => st === 0 ? K.tree(q % 3 ? 9 : 7, q % 4) : st === 1 ? pineS(0) : st === 2 ? (q % 3 ? K.rock(q % 2 ? 7 : 5, q % 3, '#a8623a') : cactS()) : st === 3 ? (q % 4 ? pineS(1) : K.rock(6, q % 3, '#bfe0f5')) : palmS();

  /* ---- state ---- */
  const F = K.fx();
  let s = 0, x = cx(AHEAD), vx = 0, tx = x, ptrMode = false, sp = 60, boost = 0, lives = 3, inv = 0, stage = 0, streak = 0, far = 0, tm = 0;
  let obs = [], nextW = 380, last = '', heartAt = -1, shake = 0, shx = 0, shy = 0, dead = 0, won = 0, pops = [], jq = [], ban = { a: 'STAGE 1', b: ST[0].n, t: 2.4 };
  const mult = () => Math.min(5, 1 + Math.floor(streak / 5));
  const pop = (t, px, py, c) => pops.push({ t, x: Math.max(24, Math.min(W - 24, px)), y: py, l: .9, c: c || '#fff6c8' });
  const tune = (fs, gap) => fs.forEach((f, i) => jq.push([i * (gap || .11), f]));
  const chain = () => { if (++streak % 5 === 0 && streak <= 20) { pop('X' + mult() + '!', x, BY - 30, '#5fe3d6'); tune([880, 1175], .07); } }; /* every 5 coins or gates in a row: multiplier up */
  const hud = () => A.info(boost > 0 ? 'BOOST!' : 'STAGE ' + (stage + 1) + '/5');

  /* ---- course generator: one pattern per slot, always leaving a clear way through ---- */
  const put = (t, w, off, o) => obs.push(Object.assign({ t, w, off }, o));
  const coins = (w, n, f) => { for (let i = 0; i < n; i++) put('c', w + i * 22, f(i)); };
  function spawn() {
    while (nextW < s + 470 && nextW < T - 140) {
      const st = si(nextW), w = nextW, h = hw(w), side = Math.random() < .5 ? -1 : 1;
      if (E[st] - w < 150 || (st && w - E[st - 1] < 160)) { nextW += 50; continue; } /* calm water around each stage line */
      if (st && st > heartAt && w > (E[st - 1] + E[st]) / 2) { heartAt = st; put('h', w, A.rnd(-.4, .4) * h); nextW += 70; continue; }
      const bag = ['r', 'r', 'c', 'c', 'g', 'b']; if (st > 0) bag.push('l', 'l', 'R'); if (st > 1) bag.push('w', 'w', 'R'); if (st > 2) bag.push('i', 'i');
      let k; do k = bag[A.ri(0, bag.length - 1)]; while (k === last && k !== 'r'); last = k; let len = 0;
      if (k === 'r') { put('r', w, side * A.rnd(.1, 1) * (h - 14), { v: A.ri(0, 2) }); if (Math.random() < .6) coins(w - 22, 3, () => -side * h * .5); }
      else if (k === 'R') { put('r', w, side * (h - 13), { v: 0 }); put('r', w + 12, side * (h - 36), { v: 1 }); coins(w - 22, 3, () => -side * h * .5); len = 12; }
      else if (k === 'c') { const ph = A.rnd(0, 6); coins(w, 6, i => Math.sin(ph + i * .6) * h * .5); len = 110; }
      else if (k === 'g') put('g', w, A.rnd(-1, 1) * (h - 28));
      else if (k === 'b') put('b', w, A.rnd(-1, 1) * (h - 22));
      else if (k === 'l') put('l', w, 0, { ph: A.rnd(0, 6), sw: A.rnd(1.1, 1.7), amp: h - 22 });
      else if (k === 'w') { put('w', w, side * A.rnd(.2, 1) * (h - 22)); coins(w - 22, 3, () => -side * h * .55); }
      else { put('i', w, side * 8); coins(w - 33, 4, () => -side * (h + 5) / 2); len = 20; }
      nextW += len + ST[st].gap * A.rnd(.85, 1.25);
    }
    obs = obs.filter(o => o.w > s - 50 && !o.got);
  }
  const ox = o => cx(o.w) + (o.t === 'l' ? Math.sin(o.ph + tm * o.sw) * o.amp : o.off);

  function crash() {
    if (inv > 0) return; lives--; inv = 2; sp *= .5; boost = 0; streak = 0; shake = .35; vx = 0;
    F.boom(x, BY - 4, 1); F.spark(x, BY, ['#ffffff', '#b8e6ff', '#ffd23c'], 14, 90); A.beep(130, .35, 'sawtooth'); A.beep(70, .25, 'square', .05);
    if (lives <= 0) { dead = .9; F.boom(x - 6, BY + 6, 1); F.boom(x + 5, BY - 10, 0); }
  }
  function steer(dt) {
    const d = (A.keys.right ? 1 : 0) - (A.keys.left ? 1 : 0);
    if (d) ptrMode = false; else if (A.ptr.down || A.ptr.moved) { ptrMode = true; tx = A.ptr.x; }
    const want = d ? d * 175 : ptrMode ? Math.max(-190, Math.min(190, (tx - x) * 10)) : 0;
    vx += Math.max(-1100 * dt, Math.min(1100 * dt, want - vx)); x += vx * dt;
  }

  return {
    update(dt) {
      tm += dt; shake -= dt; shx = shake > 0 ? A.ri(-2, 2) : 0; shy = shake > 0 ? A.ri(-2, 2) : 0; ban.t -= dt; inv -= dt; boost -= dt;
      for (const j of jq) if ((j[0] -= dt) <= 0) A.beep(j[1], .14, 'triangle', .05); jq = jq.filter(j => j[0] > 0);
      for (const p of pops) { p.l -= dt; p.y -= 22 * dt; } pops = pops.filter(p => p.l > 0);
      if (dead > 0) { sp *= 1 - 3 * dt; s += sp * dt; if ((dead -= dt) <= 0) A.over(); return; }
      const cruise = ST[stage].v; sp += Math.max(-80 * dt, Math.min(34 * dt, cruise - sp));
      const v = sp * (boost > 0 ? 1.45 : 1); s += v * dt;
      const wb = s + AHEAD, c = cx(wb), h = hw(wb);
      if (won) { x += (c - x) * 2 * dt; vx = 0; if ((won -= dt) <= 0) A.over(true); F.puff(x - 4, BY + 14, '#e6f5ff', 50); F.puff(x + 4, BY + 14, '#b8e6ff', 50); return; }
      steer(dt); spawn();
      /* banks */
      if (Math.abs(x - c) > h - 5) { const sd = x < c ? -1 : 1; if (inv <= 0) { crash(); x = c + sd * (h - 20); } else { x = c + sd * (h - 5); vx = 0; } }
      /* things in the water */
      for (const o of obs) { const X = ox(o), dx = X - x, ax = Math.abs(dx), ay = Math.abs(o.w - wb);
        if (o.t === 'c') { if (ax < 12 && ay < 15) { o.got = 1; chain(); const n = 10 * mult(); A.add(n); pop('+' + n, X, BY - 16); F.spark(X, BY - 6, ['#ffd23c', '#fff6c8'], 5, 50); A.beep(Math.min(1500, 720 + streak * 24), .07, 'square', .03); } }
        else if (o.t === 'b') { if (ax < 14 && ay < 15) { o.got = 1; boost = 1.6; A.add(20); pop('BOOST!', X, BY - 16, '#ffd23c'); tune([520, 780, 1040], .06); } }
        else if (o.t === 'h') { if (ax < 13 && ay < 15) { o.got = 1; if (lives < 5) { lives++; pop('+1 LIFE', X, BY - 16, '#ff8a9a'); } else { A.add(100); pop('+100', X, BY - 16, '#ff8a9a'); } tune([660, 990, 1320], .08); F.spark(X, BY - 6, ['#ff8a9a', '#ffffff'], 10, 60); } }
        else if (o.t === 'g') { if (!o.done && o.w <= wb) { o.done = 1; if (ax < 15) { o.ok = 1; chain(); const n = 30 * mult(); A.add(n); pop('GATE +' + n, X, BY - 16, '#5fe3d6'); tune([784, 1047], .08); } } }
        else if (o.t === 'w') { if (ay < 40 && ax < 46) x += Math.sign(dx) * 62 * dt * (1 - ax / 46); if (ax < 9 && ay < 11) crash(); }
        else if (inv <= 0 && ax < (o.t === 'l' ? 17 : o.t === 'i' ? 16 : 9) && ay < (o.t === 'i' ? 24 : 14)) { crash(); if (o.t !== 'i') { o.got = 1; F.spark(X, BY - (o.w - wb), o.t === 'l' ? ['#c08a4a', '#8a5a2a'] : ['#c8d0dc', '#8a94a4'], 12, 70); } } }
      if (dead > 0) { hud(); return; }
      /* stage lines and the sea */
      if (wb >= E[stage]) { const bonus = 100 * (stage + 1) + 25 * lives; A.add(bonus);
        if (stage === 4) { const sea = 500 + 200 * lives; A.add(sea); won = 1.8; boost = 0; ban = { a: 'THE SEA!', b: 'BONUS +' + (bonus + sea), t: 3 }; tune([523, 659, 784, 1047, 1319, 1568], .12); }
        else { stage++; ban = { a: 'STAGE ' + (stage + 1), b: ST[stage].n, t: 2.4 }; pop('STAGE CLEAR +' + bonus, 120, 150, '#ffd23c'); tune([523, 659, 784, 1047]); } }
      const d = Math.floor(s / 30); if (d > far) { A.add(d - far); far = d; }
      /* wake */
      F.puff(x - 4, BY + 14, '#b8e6ff', 50); F.puff(x + 4, BY + 14, '#e6f5ff', 50); if (boost > 0) F.puff(x + A.rnd(-3, 3), BY + 16, '#ffd23c', 90);
      hud();
    },
    draw(g) {
      g.save(); g.translate(shx, shy);
      /* ground: this stage's texture, with the next one above the stage line */
      const s0 = si(s), yb = Math.round(H - (E[s0] - s)); K.scroll(g, gtex(s0), 0, -s, W, H);
      if (s0 < 4 && yb > 0) { g.save(); g.beginPath(); g.rect(-4, -4, W + 8, yb + 4); g.clip(); K.scroll(g, gtex(s0 + 1), 0, -s, W, H); g.restore(); }
      /* river, drawn in 4px rows */
      for (let y = 0; y < H; y += 4) { const w = s + (H - y), C = ST[si(w)].c, c = cx(w), hh = hw(w), l = Math.round(c - hh), r = Math.round(c + hh), q = Math.floor(w / 4);
        K.box(g, l - 6, y, r - l + 12, 4, '#140e1c'); K.box(g, l - 5, y, r - l + 10, 4, C[0]); K.box(g, l - 2, y, r - l + 4, 4, C[1]); K.box(g, l, y, r - l, 4, C[2]); K.box(g, l + 5, y, r - l - 10, 4, q % 8 < 4 ? C[3] : C[4]); K.box(g, l + 14, y, r - l - 28, 4, C[5]);
        if (q % 5 === 0) K.box(g, l + 8 + (q * 37) % Math.max(1, r - l - 24), y + 1, 7, 1, C[6]); }
      /* stage lines: checkered rope between two flag buoys */
      for (let i = 0; i < 5; i++) { const y = Math.round(H - (E[i] - s)); if (y < -12 || y > H + 12) continue; const c = cx(E[i]), hh = hw(E[i]), l = Math.round(c - hh) + 2, r = Math.round(c + hh) - 2;
        for (let X = l, n = 0; X < r; X += 4, n++) { K.box(g, X, y - 4, Math.min(4, r - X), 4, n % 2 ? '#140e1c' : '#ffffff'); K.box(g, X, y, Math.min(4, r - X), 4, n % 2 ? '#ffffff' : '#140e1c'); }
        K.put(g, buoyS(i === 4 ? '#ffd23c' : '#e8231e'), l - 2, y - 2); K.put(g, buoyS(i === 4 ? '#ffd23c' : '#e8231e'), r + 2, y - 2); }
      /* scenery on both banks */
      for (let q = Math.floor(s / 36) - 1; q < Math.floor(s / 36) + 11; q++) { const w = q * 36, y = H - (w - s), c = cx(w), hh = hw(w), k = scen(si(w), q);
        for (const sd of [-1, 1]) { const X = c + sd * (hh + 17 + (q * (sd < 0 ? 13 : 17)) % 24); if (X > 2 && X < W - 2 && (q + (sd < 0 ? 0 : 1)) % 3) { K.shadow(g, X + 3, y + 5, 8, 5); K.put(g, k, X, y); } } }
      /* things in the water */
      const bob = Math.round(Math.sin(tm * 6));
      for (const o of obs) { const X = Math.round(ox(o)), Y = Math.round(H - (o.w - s)); if (Y < -30 || Y > H + 30) continue;
        if (o.t === 'c') K.put(g, K.coin(Math.floor(tm * 8 + o.w / 22) & 3), X, Y);
        else if (o.t === 'b') K.put(g, boostS(), X, Y + bob);
        else if (o.t === 'h') { K.box(g, X - 7, Y + 6, 14, 2, '#b8e6ff'); K.put(g, K.heart(), X, Y + bob); }
        else if (o.t === 'w') K.put(g, whirlS(Math.floor(tm * 9) & 3), X, Y);
        else if (o.t === 'g') { if (!o.ok) for (let i = -10; i <= 10; i += 5) K.box(g, X + i - 1, Y, 2, 2, (i + 10) / 5 % 2 ? '#ffffff' : '#fff6c8'); K.put(g, buoyS('#e8231e'), X - 17, Y + (o.ok ? 0 : bob)); K.put(g, buoyS('#3fd45a'), X + 17, Y - (o.ok ? 0 : bob)); }
        else if (o.t === 'l') { K.box(g, X - 13, Y + 6, 26, 2, '#b8e6ff'); K.put(g, K.log(26), X, Y); }
        else if (o.t === 'i') { K.put(g, isleS(), X, Y); K.put(g, si(o.w) === 4 ? palmS() : pineS(1), X, Y - 4); K.put(g, K.rock(4, 1, '#8a94a4'), X + 3, Y + 11); }
        else { K.box(g, X - 9, Y + 6, 18, 2, '#b8e6ff'); K.put(g, K.rock(8, o.v, ST[si(o.w)].c[7]), X, Y); } }
      /* boat, wake and effects */
      F.draw(g);
      if (dead <= 0 && lives > 0 && (inv <= 0 || Math.floor(inv * 10) % 2)) { const bx = Math.round(x);
        if (boost > 0) { K.box(g, bx - 3, BY + 15, 2, 6 + (Math.floor(tm * 20) & 3), '#ffd23c'); K.box(g, bx + 1, BY + 15, 2, 6 + (Math.floor(tm * 20 + 2) & 3), '#ff9a2a'); }
        K.put(g, boatS(vx < -45 ? -1 : vx > 45 ? 1 : 0), bx, BY); }
      for (const p of pops) { A.text(g, p.t, p.x + 1, p.y + 1, '#140e1c', 1, 'center'); A.text(g, p.t, p.x, p.y, p.c, 1, 'center'); }
      g.restore();
      /* HUD: lives, multiplier and a map of the five stages */
      for (let i = 0; i < lives; i++) K.put(g, K.heart(), 10 + i * 13, 10);
      if (mult() > 1) { A.text(g, 'X' + mult(), 7, 21, '#140e1c', 2); A.text(g, 'X' + mult(), 6, 20, '#5fe3d6', 2); }
      K.box(g, 150, 5, 84, 7, '#140e1c'); K.box(g, 151, 6, 82, 5, '#2a3f7a'); const pr = Math.min(1, (s + AHEAD) / T); K.box(g, 151, 6, Math.round(82 * pr), 5, '#5fe3d6'); K.box(g, 151, 6, Math.round(82 * pr), 1, '#c8fffa');
      for (let i = 0; i < 4; i++) K.box(g, 151 + Math.round(82 * E[i] / T), 6, 1, 5, '#140e1c'); K.box(g, 150 + Math.round(82 * pr), 4, 3, 9, '#ffffff');
      if (ban.t > 0 && (ban.t > .5 || Math.floor(ban.t * 12) % 2)) { K.box(g, 0, 34, W, 40, 'rgba(20,14,28,.72)'); K.box(g, 0, 34, W, 1, '#ffd23c'); K.box(g, 0, 73, W, 1, '#ffd23c');
        A.text(g, ban.a, 120, 41, '#ffd23c', 3, 'center'); A.text(g, ban.b, 120, 61, '#ffffff', 2, 'center'); }
    }
  };
} });
