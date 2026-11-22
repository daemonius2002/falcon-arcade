/* Snake Trail — nine gardens: eat the apples, find the burrow, mind the rocks and ladybugs */
Arcade.game('snake-trail', { w: 240, h: 240, pad: 'dpad',
help: 'Swipe, tap beside the snake, or use the arrow keys to turn. Eat every apple in the garden, then slide into the burrow that opens. ' +
  'Quick eating builds a combo (up to x5). Stars are bonus points, purple berries shorten your tail, hearts give a life back. ' +
  'Rocks, walls, ladybugs and your own tail cost a heart - you have 3. Clear all 9 gardens to win!',
init(A) {
  const K = Art, N = 20, M = 18, C = 12, OY = 24, ID = 'snake-trail-';
  const D = { left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, up: { x: 0, y: -1 }, down: { x: 0, y: 1 } };
  /* gardens: r = rock rectangles [x, y, w, h], b = ladybugs [x, y, dx, dy]. Row 9 (the start row) stays clear. */
  const LV = [
    { r: [], b: [] },
    { r: [[4, 3, 2, 2], [14, 3, 2, 2], [4, 13, 2, 2], [14, 13, 2, 2]], b: [] },
    { r: [[6, 4, 8, 1], [6, 13, 8, 1], [2, 7, 1, 2], [17, 10, 1, 2]], b: [] },
    { r: [[9, 2, 2, 3], [9, 13, 2, 3], [3, 8, 2, 1], [15, 10, 2, 1]], b: [[2, 6, 1, 0]] },
    { r: [[5, 2, 1, 5], [5, 11, 1, 5], [14, 2, 1, 5], [14, 11, 1, 5]], b: [[17, 1, 0, 1], [2, 16, 0, -1]] },
    { r: [[5, 4, 4, 1], [11, 4, 4, 1], [5, 13, 4, 1], [11, 13, 4, 1], [5, 5, 1, 2], [14, 5, 1, 2], [5, 11, 1, 2], [14, 11, 1, 2]], b: [[1, 2, 1, 0], [18, 15, -1, 0]] },
    { r: [[3, 3, 1, 1], [7, 3, 1, 1], [12, 3, 1, 1], [16, 3, 1, 1], [5, 6, 1, 1], [10, 6, 1, 1], [14, 6, 1, 1], [5, 12, 1, 1], [9, 12, 1, 1], [14, 12, 1, 1], [3, 15, 1, 1], [7, 15, 1, 1], [12, 15, 1, 1], [16, 15, 1, 1]], b: [[0, 1, 1, 0], [19, 16, -1, 0]] },
    { r: [[0, 5, 13, 1], [7, 12, 13, 1]], b: [[1, 2, 1, 0], [18, 15, -1, 0], [16, 1, 0, 1]] },
    { r: [[9, 1, 2, 5], [9, 12, 2, 5], [2, 7, 4, 1], [14, 11, 4, 1], [3, 3, 2, 2], [15, 14, 2, 2]], b: [[7, 0, 0, 1], [12, 17, 0, -1], [0, 13, 1, 0]] }
  ];
  const HEAD = K.spr(ID + 'head', 14, 14, g => { K.ell(g, 0, 0, 7, 6.4, K.rad(g, -2, -2, 1, 10, '#b8f08a', '#5fd04a', '#1f7a2a'));
    for (const y of [-3, 3]) { K.ell(g, 2, y, 2.4, 2.2, '#ffffff'); K.box(g, 3, y - 1, 2, 2, '#12101c'); } K.box(g, 6, -2, 1, 1, '#1f5a28'); K.box(g, 6, 1, 1, 1, '#1f5a28'); });
  const BUG = [0, 1].map(f => K.spr(ID + 'bug' + f, 12, 12, g => { for (const x of [-3, 0, 3]) { K.box(g, x - (f ? 1 : 0), -6, 1, 12, '#12101c'); }
    K.ell(g, 4, 0, 2.6, 3, '#1a1222'); K.ell(g, -1, 0, 5, 4.6, K.rad(g, -2, -2, .5, 7, '#ff8a7a', '#e8231e', '#8a1410')); K.box(g, -6, 0, 9, 1, '#1a1222');
    for (const [x, y] of [[-3, -3], [0, -2], [-3, 2], [0, 3]]) K.box(g, x, y, 2, 2, '#1a1222'); K.box(g, 5, -2, 1, 1, '#ffffff'); K.box(g, 5, 1, 1, 1, '#ffffff'); }));
  const HOLE = K.spr(ID + 'hole', 16, 13, g => { K.ell(g, 0, 0, 8, 6.4, '#8a5a2a'); K.ell(g, 0, 0, 6.4, 5, '#5a3418'); K.ell(g, 0, 1, 5, 3.6, '#12101c'); K.box(g, -5, -4, 3, 1, '#c08a4a'); }, { ol: [60, 34, 14] });
  const BG = K.mkc(240, 240), F = K.fx(), rocks = new Uint8Array(N * M), START = [9, 8, 7, 6];
  let lvl = 0, lives = 3, eaten = 0, quota = 5, s = [], d = D.right, q = [], t = 0, sp = .18, tp = null, still = true, grace = 0;
  let mode = 'ready', mt = 1.4, banner = '', food = null, extra = null, hole = null, bugs = [], bt = 0, combo = 0, ct = 0, shake = 0, pops = [], last = 0;

  const same = (a, b) => a && b && a.x === b.x && a.y === b.y;
  const open = (x, y) => x >= 0 && y >= 0 && x < N && y < M && !rocks[y * N + x];
  const taken = p => s.some(o => same(o, p)) || bugs.some(b => same(b, p)) || same(food, p) || same(extra, p) || same(hole, p);
  const cx = p => p.x * C + 6, cy = p => OY + p.y * C + 6;
  const pop = (p, str, c) => pops.push({ x: cx(p), y: cy(p) - 8, s: str, c: c || '#ffffff', l: .9 });
  /* a random empty cell at least `far` steps from the head, never in a dead-end pocket or right on a ladybug track cell */
  function spot(far) { for (let i = 0; i < 400; i++) { const p = { x: A.ri(0, N - 1), y: A.ri(0, M - 1) }, relax = i > 300;
      if (!open(p.x, p.y) || taken(p)) continue; if (relax) return p;
      let n = 0; for (const k in D) if (open(p.x + D[k].x, p.y + D[k].y)) n++;
      if (n >= 3 && Math.abs(p.x - s[0].x) + Math.abs(p.y - s[0].y) >= far) return p; }
    for (let i = 0; i < N * M; i++) { const p = { x: i % N, y: i / N | 0 }; if (open(p.x, p.y) && !taken(p)) return p; } return s[s.length - 1]; }
  function respawn() { s = START.map(x => ({ x, y: 9 })); d = D.right; q = []; t = 0; tp = s[3]; still = true; grace = 0; combo = 0; ct = 0; bt = 0;
    bugs = LV[lvl].b.map(b => ({ x: b[0], y: b[1], px: b[0], py: b[1], dx: b[2], dy: b[3] }));
    const hit = p => p && s.some(o => same(o, p)); if (hit(food)) { food = null; food = spot(3); } if (hit(extra)) extra = null; if (hit(hole)) { hole = null; hole = spot(5); } }
  function paint() { const g = BG.getContext('2d'); g.drawImage(K.T.grass(240, 240), 0, 0); g.fillStyle = 'rgba(0,0,0,.09)';
    for (let y = 0; y < M; y++) for (let x = y % 2; x < N; x += 2) g.fillRect(x * C, OY + y * C, C, C);
    for (const [x, y, w, h] of [[0, OY, 240, 2], [0, 238, 240, 2], [0, OY, 2, 216], [238, OY, 2, 216]]) K.box(g, x, y, w, h, '#1f5a28');
    for (let i = 0; i < N * M; i++) if (rocks[i]) K.shadow(g, i % N * C + 7, OY + (i / N | 0) * C + 10, 6, 3);
    for (let i = 0; i < N * M; i++) if (rocks[i]) K.put(g, K.rock(6, (i * 7) % 3, '#8a8a96'), i % N * C + 6, OY + (i / N | 0) * C + 6);
    K.box(g, 0, 0, 240, OY, '#14301c'); K.box(g, 0, OY - 2, 240, 2, '#0c1c10'); K.box(g, 0, 0, 240, 1, '#2f6a3a'); }
  function setLevel(n) { lvl = n; rocks.fill(0); for (const [x, y, w, h] of LV[n].r) for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) rocks[j * N + i] = 1;
    eaten = 0; quota = 5 + n; sp = .18 - .007 * n; food = extra = hole = null; respawn(); food = spot(3); paint(); mode = 'ready'; mt = 1.5; banner = 'GARDEN ' + (n + 1); info(); }
  const info = () => A.info('GARDEN ' + (lvl + 1) + ' OF ' + LV.length + ' · LENGTH ' + s.length);

  function hurt() { lives--; shake = .4; F.boom(cx(s[0]), cy(s[0]), true); A.beep(140, .3, 'sawtooth', .06);
    if (!lives) { mode = 'done'; A.over(); return; } mode = 'hurt'; mt = 1; }
  function eat(h) { eaten++; combo = ct > 0 ? Math.min(5, combo + 1) : 1; ct = 4.5; const pts = 10 * combo; A.add(pts); pop(h, '+' + pts, combo > 1 ? '#ffd23c' : '#ffffff');
    A.beep(600 + combo * 90, .08); F.spark(cx(h), cy(h), ['#ff8a7a', '#ffffff', '#ffd23c'], 12, 80); sp = Math.max(.085, .18 - .007 * lvl - .002 * eaten);
    if (eaten >= quota) { food = null; hole = spot(5); pop(hole, 'EXIT!', '#ffd23c'); [523, 659, 784].forEach((f, i) => setTimeout(() => A.beep(f, .12, 'triangle', .05), i * 90)); return; }
    food = spot(2);
    if (!extra) { const r = Math.random(), type = lives < 3 && r < .12 ? 'heart' : s.length >= 9 && r < .4 ? 'berry' : r < .7 ? 'star' : ''; const p = type && spot(4); if (p) extra = { x: p.x, y: p.y, type, t: 8 }; } }
  function grab(h) { const e = extra; extra = null; F.spark(cx(h), cy(h), ['#ffd23c', '#ffffff', '#b06ae0'], 16, 90);
    if (e.type === 'star') { A.add(50); pop(h, '+50', '#ffd23c'); A.beep(990, .1); setTimeout(() => A.beep(1320, .12), 80); }
    else if (e.type === 'heart') { lives = Math.min(3, lives + 1); pop(h, '+1 LIFE', '#ff8a9a'); A.beep(784, .2, 'triangle', .06); }
    else { for (let i = 0; i < 4 && s.length > 3; i++) { const o = s.pop(); F.puff(cx(o), cy(o), '#3fd45a', -20); } tp = s[s.length - 1]; A.add(20); pop(h, 'SHORTER! +20', '#d8a8ff'); A.beep(440, .1, 'triangle', .06); } }
  function step() { if (q.length) d = q.shift(); const h = { x: s[0].x + d.x, y: s[0].y + d.y }, tail = s[s.length - 1];
    if (!open(h.x, h.y) || s.some((o, i) => i < s.length - 1 && same(o, h)) || bugs.some(b => same(b, h))) { /* one beat of grace to steer away before a crash counts */
      if (!grace) { grace = 1; still = true; A.beep(330, .05, 'square', .03); return; } return hurt(); }
    grace = 0; still = false; tp = tail; s.unshift(h);
    if (same(hole, h)) { mode = 'warp'; mt = 0; A.beep(523, .1, 'triangle', .05); return; }
    if (same(food, h)) eat(h); else { s.pop(); if (same(extra, h)) grab(h); } info(); }
  function bugStep() { for (const b of bugs) { b.px = b.x; b.py = b.y; const n = { x: b.x + b.dx, y: b.y + b.dy };
      if (!open(n.x, n.y) || s.some((o, i) => i && same(o, n)) || bugs.some(o => o !== b && same(o, n)) || same(food, n) || same(extra, n) || same(hole, n)) { b.dx = -b.dx; b.dy = -b.dy; continue; }
      b.x = n.x; b.y = n.y; if (same(s[0], n)) { hurt(); return; } } }
  setLevel(0);

  return {
    key(k) { const n = D[k]; if (!n || mode === 'warp' || mode === 'done') return; const l = q.length ? q[q.length - 1] : d; if (n !== l && (n.x !== -l.x || n.y !== -l.y) && q.length < 2) q.push(n); },
    tap(x, y) { const l = q.length ? q[q.length - 1] : d; this.key(l.x ? (y < cy(s[0]) ? 'up' : 'down') : (x < cx(s[0]) ? 'left' : 'right')); },
    update(dt) {
      if (mode === 'ready') { mt -= dt; if (mt <= 0) { mode = 'play'; banner = ''; } return; }
      if (mode === 'hurt') { mt -= dt; if (mt <= 0) { respawn(); mode = 'ready'; mt = 1; banner = 'READY!'; info(); } return; }
      if (mode === 'warp') { mt += dt; if (mt < .05) return; mt = 0;
        if (s.length > 1) { s.pop(); A.add(2); A.beep(500 + s.length * 12, .04, 'triangle', .03); return; }
        const bonus = 50 * (lvl + 1); A.add(bonus); F.spark(cx(hole), cy(hole), ['#ffd23c', '#ffffff', '#5fe3d6'], 24, 110);
        if (lvl === LV.length - 1) { A.add(100 * lives); mode = 'done'; s = []; A.over(true); } else { A.beep(880, .2, 'triangle', .06); setLevel(lvl + 1); } return; }
      if (mode !== 'play') return;
      if (ct > 0) ct -= dt; if (extra && (extra.t -= dt) <= 0) extra = null;
      bt += dt; const bs = .44 - .025 * lvl; if (bt >= bs) { bt -= bs; bugStep(); if (mode !== 'play') return; }
      t += dt; if (t >= sp) { t -= sp; step(); } },
    draw(g) { const now = performance.now() / 1000, dt = Math.min(.05, now - last || 0); last = now; const f = mode === 'play' && !still ? Math.min(1, t / sp) : 1;
      g.save(); if (shake > 0) { shake -= dt; g.translate(A.ri(-2, 2), A.ri(-2, 2)); }
      g.drawImage(BG, 0, 0);
      if (hole) { K.put(g, HOLE, cx(hole), cy(hole) + 1); if (mode !== 'warp' && Math.floor(now * 3) % 2) A.text(g, 'EXIT', cx(hole), cy(hole) - 14 + Math.sin(now * 5) * 1.5, '#ffd23c', 1, 'center'); if (Math.random() < .15) F.puff(cx(hole) + A.ri(-6, 6), cy(hole) - 4, '#ffd23c', -24); }
      if (food) { K.shadow(g, cx(food) + 1, cy(food) + 5, 4, 2); K.put(g, K.fruit(0), cx(food), cy(food) - 1 + Math.sin(now * 5)); }
      if (extra && (extra.t > 2 || Math.floor(now * 8) % 2)) { K.shadow(g, cx(extra) + 1, cy(extra) + 5, 4, 2); const y = cy(extra) - 1 + Math.sin(now * 6 + 1) * 1.5;
        K.put(g, extra.type === 'star' ? K.star2('#ffd23c', 11) : extra.type === 'heart' ? K.heart() : K.fruit(2), cx(extra), y); }
      /* snake: every piece glides from the cell behind it; hidden on alternate blinks while hurt */
      const n = s.length; if (n && !(mode === 'hurt' && Math.floor(now * 10) % 2)) { const X = i => { const a = i < n - 1 ? s[i + 1] : tp || s[i]; return (a.x + (s[i].x - a.x) * f) * C + 6; }, Y = i => { const a = i < n - 1 ? s[i + 1] : tp || s[i]; return OY + (a.y + (s[i].y - a.y) * f) * C + 6; };
        for (let i = n - 1; i >= 0; i--) K.shadow(g, X(i) + 2, Y(i) + 4, 5, 3);
        for (let i = n - 1; i > 0; i--) { K.put(g, K.ball(5, i % 2 ? '#2fb44a' : '#3fd45a'), (X(i) + X(i - 1)) / 2, (Y(i) + Y(i - 1)) / 2); K.put(g, K.ball(i === n - 1 ? 4 : 6, i % 2 ? '#3fd45a' : '#2fb44a'), X(i), Y(i)); if (i % 3 === 0 && i < n - 1) K.box(g, Math.round(X(i)) - 1, Math.round(Y(i)) - 1, 2, 2, '#ffd23c'); }
        if (mode !== 'warp') { const hx = Math.round(X(0)), hy = Math.round(Y(0)); if (Math.floor(now * 5) % 3 === 0) K.box(g, hx + d.x * 8 - (d.x ? 1 : 0), hy + d.y * 8 - (d.y ? 1 : 0), d.x ? 3 : 1, d.y ? 3 : 1, '#e8231e');
          K.put(g, HEAD, hx, hy, d.x < 0 ? { flip: 1 } : d.y ? { rot: d.y * Math.PI / 2 } : null); if (grace) A.text(g, '!', hx - 1, hy - 15, '#ffffff', 1); } }
      if (mode === 'warp' && hole) K.put(g, HOLE, cx(hole), cy(hole) + 1);
      const bf = mode === 'play' ? Math.min(1, bt / (.44 - .025 * lvl)) : 1;
      for (const b of bugs) { const x = (b.px + (b.x - b.px) * bf) * C + 6, y = OY + (b.py + (b.y - b.py) * bf) * C + 6; K.shadow(g, x + 1, y + 4, 5, 2); K.put(g, BUG[Math.floor(now * 6) % 2], x, y, b.dx < 0 ? { flip: 1 } : b.dy ? { rot: b.dy * Math.PI / 2 } : null); }
      F.draw(g);
      for (const p of pops) { p.l -= dt; p.y -= dt * 14; const x = Math.max(p.s.length * 2 + 2, Math.min(238 - p.s.length * 2, p.x)); A.text(g, p.s, x + 1, Math.max(OY + 2, p.y) + 1, '#12101c', 1, 'center'); A.text(g, p.s, x, Math.max(OY + 2, p.y), p.c, 1, 'center'); } if (pops.length && pops[0].l <= 0) pops.shift();
      g.restore();
      /* HUD strip: garden, apple pips, combo, hearts */
      A.text(g, 'GARDEN ' + (lvl + 1), 5, 4, '#a8f0a0'); for (let i = 0; i < quota; i++) K.box(g, 5 + i * 6, 13, 5, 5, '#12101c'), K.box(g, 6 + i * 6, 14, 3, 3, i < eaten ? '#ff5a4a' : '#2a5a34');
      if (combo > 1 && ct > 0) { A.text(g, 'COMBO X' + combo, 132, 4, '#ffd23c', 1, 'center'); K.box(g, 112, 13, 40, 4, '#12101c'); K.box(g, 113, 14, Math.round(38 * ct / 4.5), 2, '#ffd23c'); }
      for (let i = 0; i < 3; i++) K.put(g, K.heart(), 232 - i * 14, 11, i < lives ? null : { a: .22 });
      if (banner && mode === 'ready') { g.fillStyle = 'rgba(12,16,28,.72)'; g.fillRect(40, 62, 160, 38); A.text(g, banner, 120, 68, '#ffd23c', 2, 'center');
        A.text(g, banner === 'READY!' ? lives + (lives > 1 ? ' HEARTS LEFT' : ' HEART LEFT') : 'EAT ' + quota + ' APPLES', 120, 86, '#ffffff', 1, 'center'); } }
  };
} });
