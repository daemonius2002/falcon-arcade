/* Pipe Flow v0.4 — turn the pipes until water from the pump reaches every tile.
   Levels grow from 4x4 to 7x7 and add clocks, bolted pipes, coins and ice. Fewer turns = more stars. */
Arcade.game('pipe-flow', { w: 168, h: 192,
help: 'Tap a pipe to turn it (or move with the arrow keys and press Space). Water starts at the golden pump: connect every pipe so all the flowers bloom before the time runs out. Drips show where a pipe is leaking. Use few turns to earn 3 stars. Clocks give bonus time, coins give points, bolted pipes are already right, and icy pipes need one extra tap. Boards get bigger as you go!',
init(A) {
  const K = Art, W = 168, T = 24, HUD = 24, PI = Math.PI;
  const D = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]]; /* dx, dy, my bit, neighbour's bit */
  const rot = v => ((v << 1) | (v >> 3)) & 15, bits = v => (v & 1) + (v >> 1 & 1) + (v >> 2 & 1) + (v >> 3 & 1);
  const TIPS = { 1: 'TURN PIPES TO WATER EVERY TILE', 2: 'CLOCKS GIVE BONUS TIME', 3: 'BOLTED PIPES ARE ALREADY RIGHT', 4: 'GRAB THE COINS', 5: 'BIGGER BOARD!', 6: 'ICY PIPES NEED TWO TAPS', 9: 'GIANT BOARD!' };
  const S = K.fx(), floats = [];
  let lvl = 1, n, N, m, sol, lock, ice, bonus, lit, dist, an, bump, src, ox, oy;
  let time = 60, grant = 0, spent = 0, turns = 0, par = 0, wet = 0, maxD = 0, stars = 0, pts = 0;
  let phase = 'intro', pt = 0, cur = 0, showCur = false, shake = 0, tick = 0, drip = 0, lastSec = 99;

  /* ---------- sprites (cached by K.spr) ---------- */
  const COL = ['#8a94aa', '#35a2e6', '#d8f6ff'];
  const pipe = (mk, v) => K.spr('pipe-flow-p' + mk + '_' + v, 24, 24, g => { const c = COL[v], hi = K.lite(c, .65), lo = K.dark(c, .5);
    const gv = K.lin(g, -4, 0, 4, 0, c, hi, c, lo), gh = K.lin(g, 0, -4, 0, 4, c, hi, c, lo), fl = K.dark(c, .22);
    if (mk & 1) { K.box(g, -4, -12, 8, 12, gv); K.box(g, -5, -12, 10, 2, fl); K.box(g, -5, -12, 3, 2, hi); }
    if (mk & 4) { K.box(g, -4, 0, 8, 12, gv); K.box(g, -5, 10, 10, 2, fl); K.box(g, -5, 10, 3, 2, hi); }
    if (mk & 8) { K.box(g, -12, -4, 12, 8, gh); K.box(g, -12, -5, 2, 10, fl); K.box(g, -12, -5, 2, 3, hi); }
    if (mk & 2) { K.box(g, 0, -4, 12, 8, gh); K.box(g, 10, -5, 2, 10, fl); K.box(g, 10, -5, 2, 3, hi); }
    if (mk === 5) { K.box(g, -5, -2, 10, 4, fl); K.box(g, -5, -2, 3, 4, hi); }
    else if (mk === 10) { K.box(g, -2, -5, 4, 10, fl); K.box(g, -2, -5, 4, 3, hi); }
    else { K.ell(g, 0, 0, 5.6, 5.6, K.rad(g, -2, -2, .5, 8, hi, c, lo)); K.box(g, -3, -3, 2, 1, '#ffffff'); } }, { L: 10 });
  const pump = () => K.spr('pipe-flow-pump', 16, 16, g => { K.ell(g, 0, 0, 7.6, 7.6, K.rad(g, -3, -3, 1, 11, '#fff6c8', '#ffd23c', '#b06a10')); K.ell(g, 0, 0, 4.6, 4.6, '#8a5210');
    K.part(g, [0, -4, 3, 1, 0, 4, -3, 1], '#35a2e6'); K.ell(g, 0, 1, 3, 2.8, '#35a2e6'); K.box(g, -2, 0, 1, 2, '#d8f6ff'); }, { L: 10 });
  const flower = v => K.spr('pipe-flow-fl' + v, 14, 14, g => { if (!v) { K.ell(g, 0, 0, 4.2, 4.2, '#5a7a4a'); K.ell(g, -1, -1, 2, 2, '#7a9a5a'); K.box(g, -1, 1, 3, 1, '#3a5230'); return; }
    for (let i = 0; i < 4; i++) { const a = i * PI / 2; K.ell(g, Math.cos(a) * 3.8, Math.sin(a) * 3.8, 2.8, 2.8, i & 1 ? '#ff8ab0' : '#ff5a8a'); } K.ell(g, 0, 0, 2.3, 2.3, '#ffd23c'); K.box(g, -1, -1, 1, 1, '#fff6c8'); }, { L: 10 });
  const clock = () => K.spr('pipe-flow-clock', 12, 12, g => { K.ell(g, 0, 0, 5.6, 5.6, '#e8231e'); K.ell(g, 0, 0, 4.2, 4.2, '#fffbea'); K.box(g, -.5, -3, 1, 3.5, '#1a1222'); K.box(g, 0, -.5, 3, 1, '#1a1222'); }, { L: 10 });
  const iceSpr = () => K.spr('pipe-flow-ice', 24, 24, g => { for (let y = -11; y < 11; y++) for (let x = -11; x < 11; x++) if ((x + y + 60) % 3 === 0) K.box(g, x, y, 1, 1, '#bfeaff');
    K.box(g, -11, -11, 22, 1, '#ffffff'); K.box(g, -11, -11, 1, 22, '#ffffff'); K.box(g, -11, 10, 22, 1, '#6fb8ee'); K.box(g, 10, -11, 1, 22, '#6fb8ee');
    for (let i = 0; i < 6; i++) { K.box(g, -8 + i, -3 - i, 1, 1, '#ffffff'); K.box(g, -5 + i, -1 - i, 1, 1, '#ffffff'); K.box(g, 2 + i, 8 - i, 1, 1, '#ffffff'); } }, { ol: 0, L: 10 });

  /* ---------- board ---------- */
  function flood() { lit.fill(0); lit[src] = 1; dist[src] = 0; maxD = 0; const q = [src];
    for (let h = 0; h < q.length; h++) { const i = q[h], x = i % n, y = (i - x) / n;
      for (const d of D) { const X = x + d[0], Y = y + d[1], j = Y * n + X;
        if ((m[i] & d[2]) && X >= 0 && Y >= 0 && X < n && Y < n && (m[j] & d[3]) && !lit[j]) { lit[j] = 1; maxD = dist[j] = dist[i] + 1; q.push(j); } } }
    wet = q.length; }
  function gen() { n = lvl < 2 ? 4 : lvl < 5 ? 5 : lvl < 9 ? 6 : 7; N = n * n; ox = (W - n * T) / 2; oy = HUD + (W - n * T) / 2;
    const z = () => new Array(N).fill(0); m = z(); lock = z(); ice = z(); bonus = z(); lit = z(); dist = z(); an = z(); bump = z();
    /* random spanning tree = the solved board */
    const seen = z(), st = [A.ri(0, N - 1)]; seen[st[0]] = 1;
    while (st.length) { const k = A.ri(0, st.length - 1), i = st[k], x = i % n, y = (i - x) / n, nb = D.filter(d => { const X = x + d[0], Y = y + d[1]; return X >= 0 && Y >= 0 && X < n && Y < n && !seen[Y * n + X]; });
      if (!nb.length) { st.splice(k, 1); continue; } const d = nb[A.ri(0, nb.length - 1)], j = (y + d[1]) * n + x + d[0]; m[i] |= d[2]; m[j] |= d[3]; seen[j] = 1; st.push(j); }
    sol = m.slice(); src = lvl < 5 ? (n >> 1) * n + (n >> 1) : A.ri(0, N - 1);
    /* scramble: some pipes stay bolted in place (a hint), some freeze */
    const pLock = lvl < 3 ? 0 : Math.max(.08, .28 - lvl * .015), pIce = lvl < 6 ? 0 : Math.min(.2, .08 + (lvl - 6) * .02);
    for (let i = 0; i < N; i++) { if (m[i] === 15) continue; if (i !== src && Math.random() < pLock) { lock[i] = 1; continue; }
      let r = A.ri(0, 3); while (r--) m[i] = rot(m[i]); if (Math.random() < pIce) ice[i] = 1; }
    for (flood(); wet === N; flood()) { const i = A.ri(0, N - 1); if (m[i] !== 15) { lock[i] = 0; m[i] = rot(m[i]); } }
    par = 0; for (let i = 0; i < N; i++) { let v = m[i]; while (v !== sol[i]) { v = rot(v); par++; } par += ice[i]; }
    /* pickups sit on dry tiles: 1 = clock, 2 = coin */
    const dry = []; for (let i = 0; i < N; i++) if (!lit[i] && !ice[i]) dry.push(i);
    const drop = (k, c) => { while (c-- > 0 && dry.length) bonus[dry.splice(A.ri(0, dry.length - 1), 1)[0]] = k; };
    if (lvl >= 2) drop(1, n > 5 ? 2 : 1); if (lvl >= 4) drop(2, n - 4);
    grant = Math.max(30, 12 + Math.round(N * 1.1) - Math.max(0, lvl - 9) * 4); turns = 0; spent = 0; cur = src; phase = 'intro'; pt = TIPS[lvl] ? 2.2 : 1.2; }
  const cx = i => ox + (i % n) * T + 12, cy = i => oy + Math.floor(i / n) * T + 12;
  const s3 = () => par + Math.max(2, Math.round(par * .25)), s2 = () => par + Math.max(5, Math.round(par * .8));
  const starsNow = () => turns <= s3() ? 3 : turns <= s2() ? 2 : 1;
  const float = (i, s, c) => floats.push({ x: cx(i), y: cy(i) - 6, s, c, l: 1 });

  function turn(i) { if (phase === 'intro') phase = 'play'; if (phase !== 'play') return;
    if (lock[i] || m[i] === 15) { bump[i] = .25; A.beep(120, .07, 'square'); return; }
    if (ice[i]) { ice[i] = 0; turns++; shake = .12; S.spark(cx(i), cy(i), ['#ffffff', '#bfeaff', '#6fb8ee'], 14, 70); A.beep(1400, .05, 'triangle'); A.beep(900, .09, 'square', .03); return; }
    const was = lit.slice(), w0 = wet; let fresh = 0; m[i] = rot(m[i]); an[i] = 1; turns++; flood();
    for (let j = 0; j < N; j++) if (lit[j] && !was[j]) { fresh++; S.spark(cx(j), cy(j), ['#d8f6ff', '#35a2e6'], 4, 40);
      if (bonus[j] === 1) { time = Math.min(150, time + 5); float(j, '+5 SEC', '#5fe3d6'); A.beep(990, .12, 'triangle'); }
      if (bonus[j] === 2) { A.add(50); float(j, '+50', '#ffd23c'); A.beep(1320, .1, 'square', .03); }
      if (bonus[j]) { S.spark(cx(j), cy(j), ['#ffd23c', '#ffffff'], 10, 60); bonus[j] = 0; } }
    if (fresh) A.beep(500 + Math.min(fresh, 8) * 70, .07, 'triangle'); else A.beep(wet < w0 ? 240 : 400, .04);
    if (wet === N) { stars = starsNow(); pts = 60 * lvl + 40 * stars + 3 * Math.max(0, Math.ceil(grant - spent)); A.add(pts); phase = 'wave'; pt = 0; } }
  function next() { lvl++; gen(); }
  function tileAt(x, y) { const tx = Math.floor((x - ox) / T), ty = Math.floor((y - oy) / T); return tx < 0 || ty < 0 || tx >= n || ty >= n ? -1 : ty * n + tx; }
  function press(x, y) { if (phase === 'done') { if (pt > .5) next(); return; } const i = tileAt(x, y); if (i >= 0) { cur = i; turn(i); } else if (phase === 'intro') phase = 'play'; }

  gen();
  return {
    peek: () => ({ lvl, n, m, sol, lock, ice, ox, oy, phase, time, turns, par, wet }), /* read-only view for automated play tests */
    tap: press, swipe(d, x, y) { press(x, y); }, /* a sloppy, slightly dragged tap still counts */
    key(k) { if (phase === 'done') { if (k === 'a' && pt > .5) next(); return; } showCur = true; const x = cur % n, y = (cur - x) / n;
      if (k === 'a') turn(cur); else { cur = k === 'left' ? y * n + (x + n - 1) % n : k === 'right' ? y * n + (x + 1) % n : k === 'up' ? ((y + n - 1) % n) * n + x : ((y + 1) % n) * n + x; A.beep(300, .015); } },
    update(dt) { tick += dt; shake = Math.max(0, shake - dt); for (let i = 0; i < N; i++) { if (an[i] > 0) an[i] = Math.max(0, an[i] - dt * 9); if (bump[i] > 0) bump[i] -= dt; }
      for (let i = floats.length - 1; i >= 0; i--) { floats[i].l -= dt; floats[i].y -= dt * 14; if (floats[i].l <= 0) floats.splice(i, 1); }
      if (A.ptr.moved && phase !== 'done') { const i = tileAt(A.ptr.x, A.ptr.y); if (i >= 0) { cur = i; showCur = true; } }
      if (phase === 'intro') { pt -= dt; if (pt <= 0) phase = 'play'; }
      else if (phase === 'play') { time -= dt; spent += dt; const s = Math.ceil(time); if (s !== lastSec) { if (s <= 10 && s > 0 && s < lastSec) A.beep(s <= 5 ? 760 : 600, .05); lastSec = s; }
        /* open pipe ends drip, so leaks are easy to spot */
        drip -= dt; if (drip <= 0) { drip = .05; const i = A.ri(0, N - 1), x = i % n, y = (i - x) / n; if (lit[i]) for (const d of D) { const X = x + d[0], Y = y + d[1];
          if ((m[i] & d[2]) && !(X >= 0 && Y >= 0 && X < n && Y < n && (m[Y * n + X] & d[3]))) S.puff(cx(i) + d[0] * 11 - 1, cy(i) + d[1] * 11 - 1, A.ri(0, 1) ? '#7fd0ff' : '#d8f6ff', 16); } }
        if (time <= 0) { time = 0; A.beep(140, .3, 'sawtooth'); A.over(); } }
      else if (phase === 'wave') { const a = Math.floor(pt); pt += dt * 14; const b = Math.floor(pt); if (b > a && b <= maxD) A.beep(440 + b * 45, .06, 'triangle');
        if (pt > maxD + 4) { phase = 'done'; pt = 0; shake = .15; time = Math.min(150, time + grant); [660, 880, 1100].slice(0, stars).forEach((f, i) => setTimeout(() => A.beep(f, .14, 'triangle', .05), i * 110));
          for (let i = 0; i < 5; i++) S.spark(A.rnd(20, W - 20), A.rnd(60, 150), ['#ffd23c', '#5fe3d6', '#ff8ab0', '#ffffff'], 10, 70); } }
      else { pt += dt; if (pt > 2.8) next(); }
      A.info('PIPES ' + wet + '/' + N); },
    draw(g) { g.save(); if (shake > 0) g.translate(A.ri(-1, 1), A.ri(-1, 1));
      K.scroll(g, K.T.panel(64, 64, '#263050'), 0, 0, W, 192);
      K.box(g, ox - 3, oy - 3, n * T + 6, n * T + 6, '#140e1c'); K.box(g, ox - 2, oy - 2, n * T + 4, n * T + 4, '#5a6a8e'); K.box(g, ox - 1, oy - 1, n * T + 2, n * T + 2, '#140e1c');
      const wave = phase === 'wave' ? pt : phase === 'done' ? 99 : -1;
      for (let i = 0; i < N; i++) { const X = cx(i) - 12 + (bump[i] > 0 ? Math.round(Math.sin(bump[i] * 60) * 1.5) : 0), Y = cy(i) - 12;
        g.drawImage(K.block(24, 24, lock[i] ? '#5a4a3a' : lit[i] ? '#22395a' : '#2a3046'), X, Y);
        if (lock[i]) for (let b = 0; b < 4; b++) { const bx = X + (b & 1 ? 19 : 3), by = Y + (b & 2 ? 19 : 3); K.box(g, bx, by, 2, 2, '#d8b070'); K.box(g, bx + 1, by + 1, 1, 1, '#7a5a30'); } }
      for (let i = 0; i < N; i++) { const X = cx(i) + (bump[i] > 0 ? Math.round(Math.sin(bump[i] * 60) * 1.5) : 0), Y = cy(i), on = lit[i], v = on ? (wave >= dist[i] && wave < dist[i] + 2.5 ? 2 : 1) : 0, mk = m[i];
        K.put(g, pipe(mk, v), X, Y, an[i] > 0 ? { rot: -an[i] * PI / 2 } : undefined);
        if (on && an[i] <= 0) { const p = Math.floor(tick * 18 + i * 5) % 11; /* glints run outward from the hub */
          if (mk & 1) K.box(g, X - 2, Y - 1 - p, 1, 2, '#ffffff'); if (mk & 4) K.box(g, X - 2, Y + p, 1, 2, '#ffffff'); if (mk & 8) K.box(g, X - 1 - p, Y - 2, 2, 1, '#ffffff'); if (mk & 2) K.box(g, X + p, Y - 2, 2, 1, '#ffffff'); }
        if (i === src) K.put(g, pump(), X, Y);
        else if (bonus[i] === 1) K.put(g, clock(), X, Y + Math.round(Math.sin(tick * 5 + i)));
        else if (bonus[i] === 2) K.put(g, K.coin(Math.floor(tick * 7 + i) % 4), X, Y);
        else if (bits(mk) === 1) K.put(g, flower(on ? 1 : 0), X, Y);
        if (ice[i]) K.put(g, iceSpr(), X, Y); }
      if (showCur && phase !== 'done' && phase !== 'wave') { const X = cx(cur) - 12, Y = cy(cur) - 12, c = Math.floor(tick * 4) & 1 ? '#ffd23c' : '#ffffff';
        for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { K.box(g, X + a * 18, Y + b * 22, 6, 2, c); K.box(g, X + a * 22, Y + b * 18, 2, 6, c); } }
      S.draw(g); for (const f of floats) { A.text(g, f.s, f.x + 1, f.y + 1, '#140e1c', 1, 'center'); A.text(g, f.s, f.x, f.y, f.c, 1, 'center'); }
      /* HUD: level, clock bar, turns and the stars still on offer */
      K.box(g, 0, 0, W, HUD - 2, '#140e1c'); K.box(g, 0, HUD - 2, W, 1, '#5a6a8e'); const low = time <= 10 && phase === 'play', tc = time > 20 ? '#5fe3d6' : low ? (Math.floor(tick * 6) & 1 ? '#ff5a4a' : '#ffffff') : '#ffd23c';
      A.text(g, 'LV ' + lvl, 3, 3, '#ffd23c'); K.box(g, 34, 3, 102, 5, '#3a4152'); K.box(g, 35, 4, Math.round(100 * Math.min(1, time / 150)), 3, tc); A.text(g, Math.ceil(time), 165, 3, tc, 1, 'right');
      A.text(g, 'TURNS ' + turns, 3, 13, '#c8d2e6'); A.text(g, 'GOAL ' + s3(), 70, 13, '#8a94aa'); const sn = phase === 'wave' || phase === 'done' ? stars : starsNow();
      for (let i = 0; i < 3; i++) K.put(g, K.star2(i < sn ? '#ffd23c' : '#4a5266', 9), 138 + i * 11, 15);
      if (phase === 'intro') { K.box(g, 0, 92, W, 34, 'rgba(13,11,20,.86)'); K.box(g, 0, 92, W, 2, '#ffd23c'); K.box(g, 0, 124, W, 2, '#ffd23c');
        A.text(g, 'LEVEL ' + lvl, 84, TIPS[lvl] ? 98 : 104, '#ffd23c', 2, 'center'); if (TIPS[lvl]) A.text(g, TIPS[lvl], 84, 114, '#ffffff', 1, 'center'); }
      if (phase === 'done') { K.box(g, 0, 82, W, 54, 'rgba(13,11,20,.86)'); K.box(g, 0, 82, W, 2, '#5fe3d6'); K.box(g, 0, 134, W, 2, '#5fe3d6'); A.text(g, 'CONNECTED!', 84, 88, '#5fe3d6', 2, 'center');
        for (let i = 0; i < 3; i++) if (pt > i * .18) K.put(g, K.star2(i < stars ? '#ffd23c' : '#4a5266', 15), 64 + i * 20, 110);
        A.text(g, '+' + pts + ' POINTS   +' + grant + ' SEC', 84, 124, '#ffffff', 1, 'center'); }
      g.restore(); }
  };
} });
