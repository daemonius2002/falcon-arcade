Arcade.game('number-slide', { w: 180, h: 180, pad: 'dpad', a: 'UNDO',
help: 'Swipe or use the arrow keys to slide all tiles. Two tiles with the same number merge into one twice as big, and merging several pairs in one move is a combo worth extra points. Build the GOAL tile shown at the top to level up: you get bonus points, an extra UNDO, and the smallest tiles are swept away. From level 2 a star tile sometimes appears - it doubles any number it bumps into and smashes rocks. From level 3 rocks roll in: they never merge, so break them by making a merge right next to them. Press Space (or the UNDO button, or tap the arrows at the top) to take back your last move. Can you build 2048? The game ends when nothing can move and you are out of undos.',
init(A) {
  const K = Art, F = K.fx(), OX = 10, OY = 19, P = 40, S = 38, STAR = 1, ROCK = 2;
  const COL = ['#3a4152', '#d6dbea', '#aab4c2', '#5fe3d6', '#3fa8e0', '#3f6ad0', '#b06ae0', '#e02a6a', '#e8231e', '#ff8a1e', '#ffd23c', '#3fd45a', '#ffffff', '#ffb0d0'], DARK = [1, 2, 3, 10, 11, 12, 13];
  const cx = i => OX + (i % 4) * P + 20, cy = i => OY + (i >> 2) * P + 20, goalOf = l => 16 << l, ci = v => Math.min(13, Math.log2(v));
  const UN = ['..#......', '.##......', '#######..', '.##...##.', '..#....#.', '.......#.', '......##.', '..#####..'], unOn = A.spr(UN, { '#': '#5fe3d6' }), unOff = A.spr(UN, { '#': '#3a4152' });
  let b = new Array(16).fill(null), ghosts = [], land = [], floats = [], snd = [], mt = 1, level = 1, undos = 2, snap = null, stuck = false, endT = 0,
    shake = 0, bump = null, bumpT = 0, banner = '', sub = '', banT = 0, tip = '', tipT = 0, sinceStar = 0, sinceRock = 0, starAt = 16;
  const seen = {};

  /* ---------- sprites ---------- */
  const starSpr = () => K.spr('number-slide-star', 36, 36, g => { K.rr(g, -18, -18, 36, 36, 4, K.lin(g, 0, -18, 0, 18, '#7a5ae0', '#3a2a8a')); K.box(g, -15, -16, 30, 1, '#b8a0ff');
    const p = []; for (let i = 0; i < 10; i++) { const a = i / 10 * K.TAU, q = i % 2 ? 6 : 14; p.push(Math.sin(a) * q, 1 - Math.cos(a) * q); }
    K.part(g, p, K.lin(g, -12, -12, 12, 12, '#fff6c8', '#ffd23c', '#ff8a1e')); K.box(g, -3, -5, 3, 2, '#ffffff'); }, { L: 8 });
  const rockSpr = () => K.spr('number-slide-rock', 36, 36, g => { K.org(g, 0, 0, 20, 3, 11); g.fillStyle = K.rad(g, -6, -7, 2, 30, '#b8bcc8', '#7a7f90', '#3a3d4c'); g.fill();
    for (const [x, y, w, h] of [[-3, -12, 1, 7], [-3, -6, 6, 1], [2, -6, 1, 8], [-10, 4, 7, 1], [-4, 4, 1, 6], [7, 6, 5, 1]]) K.box(g, x, y, w, h, '#2e3040');
    K.box(g, -10, -11, 5, 2, '#e4e7f0'); K.box(g, 6, -3, 3, 2, '#9a9fb0'); K.box(g, -9, 9, 3, 2, '#5a5e70'); });

  /* ---------- board logic ---------- */
  const tile = (v, k, i) => ({ v, k: k || 0, x: cx(i), y: cy(i), fx: cx(i), fy: cy(i), tx: cx(i), ty: cy(i), pop: 0, grow: 0, hide: false, nw: false });
  const line = (i, d) => [0, 1, 2, 3].map(k => d === 'left' ? i * 4 + k : d === 'right' ? i * 4 + 3 - k : d === 'up' ? k * 4 + i : (3 - k) * 4 + i);
  const adj = i => [i % 4 ? i - 1 : -1, i % 4 < 3 ? i + 1 : -1, i - 4, i + 4].filter(j => j >= 0 && j < 16);
  const big = () => b.reduce((m, t) => t && !t.k && t.v > m ? t.v : m, 0), has = k => b.some(t => t && t.k === k);
  /* what two touching tiles make: -1 nothing, 0 both vanish (star smashes rock), else the new number */
  const join = (a, c) => !a.k && !c.k ? (a.v === c.v ? a.v * 2 : -1) : a.k === STAR ? (c.k === ROCK ? 0 : c.k ? -1 : c.v * 2) : c.k === STAR ? (a.k === ROCK ? 0 : a.v * 2) : -1;
  /* work out a slide without touching the board: nb new board, mv [tile, cell] that survive, gh [tile, cell] that slide and vanish, mg merges */
  function plan(d) { const nb = new Array(16).fill(null), mv = [], gh = [], mg = []; let ch = false;
    for (let i = 0; i < 4; i++) { const ix = line(i, d), v = ix.filter(j => b[j]); let n = 0;
      for (let k = 0; k < v.length; k++) { const a = b[v[k]], c = k + 1 < v.length ? b[v[k + 1]] : null, to = ix[n], r = c ? join(a, c) : -1;
        if (r < 0) { nb[to] = a; mv.push([a, to]); if (v[k] !== to) ch = true; n++; }
        else { ch = true; gh.push([a, to], [c, to]); mg.push({ to, r }); if (r) { nb[to] = tile(r, 0, to); nb[to].nw = true; n++; } k++; } } }
    return { nb, mv, gh, mg, ch }; }
  const canMove = () => ['left', 'right', 'up', 'down'].some(d => plan(d).ch);
  const say = (id, s) => { if (!seen[id]) { seen[id] = 1; tip = s; tipT = 6; } };
  const info = () => A.info('BIGGEST ' + big());
  function spawn(first) { const e = []; b.forEach((t, i) => { if (!t) e.push(i); }); if (!e.length) return;
    const i = e[A.ri(0, e.length - 1)]; let v = Math.random() < Math.min(.3, .07 + .03 * level) ? 4 : 2, k = 0;
    if (!first && level >= 2 && sinceStar >= starAt && !has(STAR)) { k = STAR; v = 0; sinceStar = 0; starAt = A.ri(14, 22); say('star', 'STAR: DOUBLES ANY NUMBER IT BUMPS'); }
    else if (!first && level >= 3 && sinceRock >= Math.max(10, 24 - level * 2) && !has(ROCK) && e.length >= 6) { k = ROCK; v = 0; sinceRock = 0; say('rock', 'ROCK: MERGE NEXT TO IT TO BREAK IT'); }
    const t = b[i] = tile(v, k, i); t.grow = 1; t.hide = mt < 1; }
  const go = (t, to) => { t.fx = t.x; t.fy = t.y; t.tx = cx(to); t.ty = cy(to); };
  const nope = () => { A.beep(120, .08, 'sawtooth', .03); shake = .15; };

  function move(d) { if (endT) return; finish(); if (stuck) return nope();
    const p = plan(d); if (!p.ch) { bump = d; bumpT = .12; A.beep(140, .04, 'square', .02); return; }
    snap = { b: b.map(t => t && [t.v, t.k]), s: A.score, keep: 0, sS: sinceStar, sR: sinceRock };
    for (const [t, to] of p.mv) go(t, to); ghosts = p.gh.map(([t, to]) => { go(t, to); return t; });
    b = p.nb; mt = 0; land = []; sinceStar++; sinceRock++; A.beep(300, .03, 'square', .02);
    let gain = 0;
    for (const q of p.mg) { if (!q.r) { gain += 30; land.push(['rock', q.to, 30]); continue; }
      b[q.to].hide = true; gain += q.r; land.push(['merge', q.to, q.r]);
      for (const j of adj(q.to)) if (b[j] && b[j].k === ROCK) { ghosts.push(b[j]); b[j] = null; gain += 20; land.push(['rock', j, 20]); } }
    const m = p.mg.length; if (m > 1) { gain = Math.round(gain * (1 + (m - 1) * .5)); land.push(['combo', m]); }
    if (gain) A.add(gain);
    const was = level, top = big(), hadU = undos; while (top >= goalOf(level)) { level++; const bonus = 50 * (level - 1); A.add(bonus); snap.keep += bonus; undos = Math.min(3, undos + 1); }
    if (level > was) { /* reward: sweep away rocks and the two smallest tiles */
      const low = []; b.forEach((t, i) => { if (t && t.k === ROCK) low.push(i); });
      b.map((t, i) => i).filter(i => b[i] && !b[i].k && !b[i].nw && b[i].v <= 8).sort((i, j) => b[i].v - b[j].v).slice(0, 2).forEach(i => low.push(i));
      for (const i of low) { ghosts.push(b[i]); b[i] = null; land.push(['sweep', i]); }
      land.push(['level', top, undos > hadU]); if (was < 2 && level >= 2) sinceStar = starAt - 3; if (was < 3 && level >= 3) sinceRock = Math.max(10, 24 - level * 2) - 4; }
    spawn(); info();
    if (!canMove()) { if (undos > 0) stuck = true; else endT = 1.4; } }

  /* the slide has landed: show merged tiles and fire the effects */
  function finish() { if (mt >= 1) return; mt = 1; ghosts = []; let n = 0;
    b.forEach(t => { if (t) { t.x = t.tx; t.y = t.ty; t.hide = false; t.nw = false; } });
    for (const [what, i, v] of land) { const x = cx(i), y = cy(i);
      if (what === 'merge') { const c = COL[ci(v)]; b[i] && (b[i].pop = 1); F.spark(x, y, [c, '#ffffff'], 5 + ci(v) * 2, 50 + ci(v) * 6); floats.push({ x, y: y - 17, s: '+' + v, l: .7 });
        snd.push([n++ * .06, 200 * Math.pow(2, ci(v) / 5), .1, 'triangle']); if (v >= 128) shake = Math.max(shake, .18); }
      else if (what === 'rock') { F.spark(x, y, ['#b8bcc8', '#7a7f90', '#3a3d4c'], 16, 70); floats.push({ x, y: y - 17, s: '+' + v, l: .7 }); snd.push([0, 110, .15, 'sawtooth']); shake = .2; }
      else if (what === 'sweep') F.spark(x, y, ['#5fe3d6', '#ffffff'], 12, 60);
      else if (what === 'combo') floats.push({ x: 90, y: 32, s: 'COMBO X' + i, l: 1.1, c: '#5fe3d6' });
      else { const g2 = i >= 2048 && i < 4096; banner = g2 ? '2048! AMAZING!' : 'LEVEL ' + level; sub = (g2 ? 'KEEP GOING: ' : '') + 'NEXT GOAL ' + goalOf(level) + (v ? '  +1 UNDO' : ''); banT = g2 ? 3 : 1.8; shake = .25;
        [523, 659, 784, 1047].forEach((f, q) => snd.push([.1 + q * .1, f, .14, 'square'])); F.spark(90, 98, ['#ffd23c', '#5fe3d6', '#ff8a9a', '#ffffff'], 40, 130); } }
    land = [];
    if (stuck) { banner = 'NO MOVES!'; sub = 'USE UNDO TO GO BACK'; } else if (endT) { banner = 'NO MOVES!'; sub = 'GAME OVER'; banT = 9; } }

  function undo() { if (endT) return; finish(); if (!snap || !undos) return nope();
    b = snap.b.map((q, i) => { if (!q) return null; const t = tile(q[0], q[1], i); t.grow = .5; return t; });
    A.add(snap.s + snap.keep - A.score); sinceStar = snap.sS; sinceRock = snap.sR; undos--; snap = null; stuck = false; banT = 0; floats = [];
    snd.push([0, 520, .07, 'triangle'], [.07, 390, .1, 'triangle']); info(); }

  spawn(1); spawn(1); info();
  return {
    key(k) { if (k === 'a') undo(); else move(k); },
    swipe(d) { move(d); },
    tap(x, y) { if (stuck || (y < OY && x > 96)) undo(); },
    update(dt) {
      if (mt < 1) { if (mt + dt / .1 >= 1) finish(); else { mt += dt / .1; const e = 1 - (1 - mt) * (1 - mt); for (const t of ghosts) { t.x = t.fx + (t.tx - t.fx) * e; t.y = t.fy + (t.ty - t.fy) * e; }
        for (const t of b) if (t) { t.x = t.fx + (t.tx - t.fx) * e; t.y = t.fy + (t.ty - t.fy) * e; } } }
      for (const t of b) if (t && !t.hide) { if (t.pop > 0) t.pop = Math.max(0, t.pop - dt * 5); if (t.grow > 0) t.grow = Math.max(0, t.grow - dt * 7); }
      shake = Math.max(0, shake - dt); bumpT = Math.max(0, bumpT - dt); tipT = Math.max(0, tipT - dt); if (!stuck) banT = Math.max(0, banT - dt);
      for (const f of floats) { f.l -= dt; f.y -= dt * 14; } if (floats.length && floats[0].l <= 0) floats = floats.filter(f => f.l > 0);
      if (snd.length) { for (const s of snd) if ((s[0] -= dt) <= 0) A.beep(s[1], s[2], s[3], .04); snd = snd.filter(s => s[0] > 0); }
      if (endT && (endT -= dt) <= 0) { endT = 9; banT = 0; A.over(big() >= 2048); } },
    draw(g) { const now = performance.now();
      K.scroll(g, K.T.panel(64, 64, '#2a2458'), 0, 0, 180, 180);
      /* top bar: level, goal tile, undos (or a one-time tip) */
      K.box(g, 0, 0, 180, 16, '#14112a'); K.box(g, 0, 16, 180, 1, '#59627a');
      if (tipT > 0 && Math.floor(tipT * 4) % 8) A.text(g, tip, 90, 6, '#ffd23c', 1, 'center');
      else if (tipT <= 0) { const gv = goalOf(level), n = ci(gv); A.text(g, 'LV' + level, 4, 3, '#5fe3d6', 2);
        A.text(g, 'GOAL', 44, 6, '#aab4c2', 1); K.box(g, 62, 2, 36, 13, '#0a0814'); K.box(g, 63, 3, 34, 11, COL[n]); A.text(g, gv, 81, gv > 9999 ? 6 : 4, DARK.includes(n) ? '#12141c' : '#ffffff', gv > 9999 ? 1 : 2, 'center');
        A.text(g, 'UNDO', 108, 6, '#aab4c2', 1); for (let i = 0; i < 3; i++) g.drawImage(i < undos ? unOn : unOff, 128 + i * 12, 4 + (stuck && i < undos && now % 500 < 250 ? -1 : 0)); }
      K.box(g, OX - 3, OY - 2, 166, 163, '#16122e'); K.box(g, OX - 3, OY - 2, 166, 1, '#0e0c18');
      g.save(); const sh = shake > 0 ? 2 : 0, bo = bumpT > 0 ? 2 : 0;
      g.translate(Math.round(A.rnd(-sh, sh)) + (bump === 'left' ? -bo : bump === 'right' ? bo : 0), Math.round(A.rnd(-sh, sh)) + (bump === 'up' ? -bo : bump === 'down' ? bo : 0));
      for (let i = 0; i < 16; i++) { const x = cx(i) - 19, y = cy(i) - 19; K.box(g, x, y, S, S, '#231d48'); K.box(g, x, y, S, 1, '#120f26'); K.box(g, x, y + S - 1, S, 1, '#39316a'); }
      const one = t => { if (t.hide) return; const sc = t.grow > 0 ? 1 - t.grow * .7 : 1 + Math.sin(t.pop * Math.PI) * .16, z = Math.round(S * sc), x = Math.round(t.x - z / 2), y = Math.round(t.y - z / 2), n = t.k ? 0 : ci(t.v);
        if (sc === 1) K.box(g, x + 2, y + 3, S, S, 'rgba(0,0,0,.3)');
        g.drawImage(t.k === STAR ? starSpr() : t.k === ROCK ? rockSpr() : K.block(S, S, COL[n], 'r'), x, y, z, z);
        if (t.k === STAR && sc === 1) { const f = Math.floor(now / 160) % 6; if (f < 3) { K.box(g, x + 6 + f * 11, y + 6 + (f % 2) * 22, 1, 3, '#ffffff'); K.box(g, x + 5 + f * 11, y + 7 + (f % 2) * 22, 3, 1, '#ffffff'); } }
        if (t.k || sc < .85) return; const s = String(t.v), q = s.length < 3 ? 3 : s.length < 5 ? 2 : 1, dk = DARK.includes(n), tx = Math.round(t.x) + 1, ty = Math.round(t.y) - Math.floor(q * 2.5);
        A.text(g, s, tx + 1, ty + 1, dk ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.45)', q, 'center'); A.text(g, s, tx, ty, dk ? '#12141c' : '#ffffff', q, 'center'); };
      ghosts.forEach(one); for (const t of b) if (t && !t.pop) one(t); for (const t of b) if (t && t.pop) one(t);
      F.draw(g);
      for (const f of floats) { A.text(g, f.s, f.x + 1, f.y + 1, '#12141c', 1, 'center'); A.text(g, f.s, f.x, f.y, f.c || '#ffffff', 1, 'center'); }
      g.restore();
      if (banT > 0 || stuck) { K.box(g, 0, 82, 180, 34, 'rgba(12,9,28,.88)'); K.box(g, 0, 82, 180, 1, '#ffd23c'); K.box(g, 0, 115, 180, 1, '#ffd23c');
        A.text(g, banner, 91, 89, '#12141c', 2, 'center'); A.text(g, banner, 90, 88, stuck || endT ? '#ff8a9a' : '#ffd23c', 2, 'center'); A.text(g, sub, 90, 104, '#ffffff', 1, 'center'); } }
  };
} });
