/* Block Drop — stack falling blocks, clear lines, climb 10 levels. Star blocks earn bombs, rubble rises from level 4. */
Arcade.game('block-drop', { w: 180, h: 216, pad: 'dpad', a: 'DROP',
help: 'Left and right move the block, up (or a tap) turns it, down makes it fall faster, Space or DROP drops it at once. Press C or tap the HOLD box to save a block for later. Fill a whole row to clear it; clear rows back to back for combo points. Clear a row with a star block in it to win a bomb that blasts a hole and squashes the stack down. From level 4 grey rubble creeps up from below unless you keep clearing rows. Beat level 10 to win!',
init(A) {
  const K = Art, W = 10, H = 18, S = 12, FW = W * S, BOMB = 8, STAR = 16, TOP = 10;
  const SH = [[[-1, 0], [0, 0], [1, 0], [2, 0]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[-1, 0], [0, 0], [1, 0], [0, 1]], [[0, 0], [1, 0], [-1, 1], [0, 1]], [[-1, 0], [0, 0], [0, 1], [1, 1]], [[-1, 0], [0, 0], [1, 0], [-1, 1]], [[-1, 0], [0, 0], [1, 0], [1, 1]]];
  SH[BOMB] = [[0, 0]];
  const COL = ['#3fd0e0', '#ffd23c', '#b06ae0', '#3fd45a', '#e8231e', '#ff8a1e', '#3f6ad0'];
  const SPEED = [.7, .62, .54, .47, .4, .34, .28, .23, .19, .15];              /* seconds per row, by level */
  const BG = ['#231d3a', '#1d2f3a', '#1d3a2a', '#3a2f1d', '#3a1d2a', '#2a1d3a', '#1d263a', '#3a1d1d', '#103a3a', '#3a3410'];
  const NEWS = { 1: 'CLEAR 5 LINES', 2: 'STAR BLOCKS!', 4: 'RUBBLE RISING!', 7: 'FASTER RUBBLE!', 10: 'FINAL LEVEL!' };
  const need = l => l + 4, every = () => lvl >= 7 ? 8 : 11, row = () => new Array(W).fill(-1);

  /* own sprites (cached by K.spr) */
  const star = K.spr('block-drop-star', 8, 8, g => { const p = []; for (let i = 0; i < 10; i++) { const a = i / 10 * K.TAU, r = i % 2 ? 1.9 : 4.2; p.push(Math.sin(a) * r, -Math.cos(a) * r); } K.part(g, p, '#fff6c8'); }, { L: 5 });
  const bomb = K.spr('block-drop-bomb', 10, 10, g => { K.box(g, 0, -5, 2, 2, '#b98a4a'); K.ell(g, 0, .5, 4.2, 4.2, K.rad(g, -1.5, -1.5, .5, 6, '#aab6d8', '#4a5478', '#1c2030')); K.box(g, -2, -2, 2, 1, '#ffffff'); });
  const rubble = K.spr('block-drop-rub', 10, 10, g => { K.box(g, -5, -5, 10, 10, '#7c8296'); K.box(g, -5, -5, 10, 1, '#a9afc2'); K.box(g, -5, 4, 10, 1, '#555a6c'); K.box(g, -2, -3, 1, 3, '#4a4f60'); K.box(g, -1, 0, 2, 1, '#4a4f60'); K.box(g, 2, 1, 1, 3, '#4a4f60'); K.box(g, -4, 2, 2, 1, '#9aa0b4'); }, { L: 6 });
  const panel = K.T.panel(60, 216, '#262a40'), fx = K.fx();

  let f = [], cur = null, q = [], bag = [], held = null, canHold = true, bg = null;
  let t = 0, lt = 0, res = 0, sd = false, das = 0, ph = false, time = 0, sh = 0;
  let lines = 0, got = 0, lvl = 1, combo = 0, rub = 0, top = H, gap = A.ri(0, W - 1), clr = null, ban = null, pops = [], jing = [];
  for (let y = 0; y < H; y++) f.push(row());

  const fits = (c, x, y) => c.every(p => { const X = x + p[0], Y = y + p[1]; return X >= 0 && X < W && Y < H && (Y < 0 || f[Y][X] < 0); });
  const info = () => A.info('LINES ' + lines);   /* level is in the side panel; a longer line wraps in the header */
  const pop = (s, x, y, c) => pops.push({ s, x: Math.max(22, Math.min(FW - 22, x)), y: Math.max(12, y), c: c || '#ffffff', t: 0 });
  const tune = (...n) => n.forEach((fr, i) => jing.push({ f: fr, at: time + i * .09 }));
  const banner = () => { ban = { a: 'LEVEL ' + lvl, b: NEWS[lvl] || 'CLEAR ' + need(lvl) + ' LINES', t: 0 }; bg = K.T.brick(64, 64, BG[lvl - 1]); };

  function refill() { while (q.length < 3) { if (!bag.length) { bag = [0, 1, 2, 3, 4, 5, 6]; for (let i = 6; i > 0; i--) { const j = A.ri(0, i), v = bag[i]; bag[i] = bag[j]; bag[j] = v; } }
    q.push({ t: bag.pop(), s: lvl >= 2 && A.rnd(0, 1) < .14 ? A.ri(0, 3) : -1 }); } }
  function make(p) { cur = { t: p.t, s: p.s, c: SH[p.t].map(v => v.slice()), x: 4, y: 0 }; t = lt = res = 0; sd = false;
    if (!fits(cur.c, cur.x, cur.y)) { cur = null; A.over(); } }
  function spawn() { make(q.shift()); refill(); canHold = true; }
  function hold() { if (!cur || !canHold) return; const p = { t: cur.t, s: cur.s };
    if (held) make(held); else { make(q.shift()); refill(); } held = p; canHold = false; A.beep(440, .05, 'triangle'); }

  const touch = () => { if (lt > 0 && res < 12) { lt = 0; res++; } };   /* moving a resting block buys a little time */
  function mv(dx) { if (cur && fits(cur.c, cur.x + dx, cur.y)) { cur.x += dx; touch(); A.beep(300, .02, 'square', .02); } }
  function rot() { if (!cur || cur.t === 1 || cur.t === BOMB) return; const c = cur.c.map(p => [-p[1], p[0]]);
    for (const k of [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0]]) if (fits(c, cur.x + k[0], cur.y + k[1])) { cur.c = c; cur.x += k[0]; cur.y += k[1]; touch(); A.beep(600, .03); return; } }
  function hard() { if (!cur) return; let n = 0; while (fits(cur.c, cur.x, cur.y + 1)) { cur.y++; n++; } A.add(n * 2); sh = Math.max(sh, .08);
    for (const p of cur.c) fx.puff((cur.x + p[0]) * S + 6, (cur.y + p[1]) * S + 10, '#cfd6e6', 20); lock(); }

  function lock() { const p = cur; cur = null; if (p.t === BOMB) return blast(p.x, p.y);
    if (p.c.some(c => p.y + c[1] < 0)) return A.over();   /* landed sticking out of the top: that is a top-out too */
    p.c.forEach((c, i) => { const Y = p.y + c[1]; if (Y >= 0) f[Y][p.x + c[0]] = p.t | (i === p.s ? STAR : 0); });
    A.beep(200, .04); settle(true); }

  function blast(x, y) { let n = 0;
    for (let Y = y - 1; Y <= y + 1; Y++) for (let X = x - 1; X <= x + 1; X++) if (X >= 0 && X < W && Y >= 0 && Y < H && f[Y][X] >= 0) { f[Y][X] = -1; n++; fx.spark(X * S + 6, Y * S + 6, ['#ffd23c', '#ff8a1e', '#ffffff'], 5, 70); }
    for (let X = Math.max(0, x - 1); X <= Math.min(W - 1, x + 1); X++) { let w = H - 1;                /* the shaken columns drop down flat */
      for (let Y = H - 1; Y >= 0; Y--) if (f[Y][X] >= 0) { const v = f[Y][X]; f[Y][X] = -1; f[w--][X] = v; } }
    fx.boom(x * S + 6, y * S + 6, true); sh = .3; A.beep(90, .35, 'sawtooth', .07); A.beep(55, .4, 'square', .05);
    if (n) { A.add(n * 20 * lvl); pop('+' + n * 20 * lvl, x * S + 6, y * S - 8, '#ff9a2a'); } settle(false); }

  /* after anything lands: start a line clear, or let rubble rise, then bring the next block */
  function settle(counts) { const rows = []; for (let y = 0; y < H; y++) if (f[y].every(v => v >= 0)) rows.push(y);
    top = f.findIndex(r => r.some(v => v >= 0)); if (top < 0) top = H;
    if (!rows.length) { combo = 0; if (counts && lvl >= 4 && --rub <= 0) rise(); return spawn(); }
    const n = rows.length; let stars = 0; combo++;
    for (const y of rows) for (let x = 0; x < W; x++) { const v = f[y][x]; fx.spark(x * S + 6, y * S + 6, [v & STAR ? '#ffffff' : COL[v & 15] || '#a9afc2', '#ffffff'], 3, 60); if (v & STAR) stars++; }
    const pts = ([0, 100, 300, 500, 800][Math.min(n, 4)] + (combo - 1) * 50 + stars * 200) * lvl, y0 = rows[0] * S;
    A.add(pts); pop('+' + pts, 60, y0 - 4, '#ffd23c');
    if (n >= 4) pop('MEGA CLEAR!', 60, y0 - 16, '#5fe3d6'); else if (combo > 1) pop('COMBO X' + combo, 60, y0 - 16, '#5fe3d6');
    if (stars) { q.unshift({ t: BOMB, s: -1 }); pop('BOMB WON!', 60, y0 + 8, '#ff9a2a'); }
    sh = Math.max(sh, n >= 4 ? .3 : .1); if (n >= 4) tune(523, 659, 784, 1047, 1319); else tune.apply(null, [523, 659, 784, 1047].slice(0, n + 1).map(v => v * (1 + Math.min(combo - 1, 6) * .06)));
    clr = { rows, t: 0 }; }

  function endClear() { const n = clr.rows.length; for (const y of clr.rows) { f.splice(y, 1); f.unshift(row()); } clr = null; lines += n; got += n; top = Math.min(H, top + n);
    let up = false; while (lvl <= TOP && got >= need(lvl)) { got -= need(lvl); lvl++; up = true; }
    if (lvl > TOP) { lvl = TOP; got = need(TOP); info(); A.add(5000); return A.over(true); }
    if (up) { banner(); tune(659, 784, 988, 1319); if (lvl === 4 || lvl === 7) rub = every(); }
    info(); spawn(); }

  function rise() { rub = every(); if (f.filter(r => r.includes(7)).length >= 4) return;
    if (f[0].some(v => v >= 0)) return A.over();   /* the stack is at the very top: rubble would push blocks off, so the game ends */   /* never more than 4 rubble rows: keep it fair */
    f.shift(); const r = new Array(W).fill(7); if (A.rnd(0, 1) < .35) gap = A.ri(0, W - 1); r[gap] = -1; f.push(r);   /* the gap mostly stays in one column, so rubble can be dug out */ top = Math.max(0, top - 1);
    sh = Math.max(sh, .15); A.beep(110, .2, 'sawtooth', .05); pop('RUBBLE!', 60, 196, '#a9afc2'); }

  function cell(g, v, x, y) { if ((v & 15) === 7) g.drawImage(rubble, x, y); else { g.drawImage(K.block(S, S, COL[v & 15]), x, y); if (v & STAR) g.drawImage(star, x + 1, y + 1); } }
  function mini(g, p, cx, cy, a) { g.globalAlpha = a; if (p.t === BOMB) K.put(g, bomb, cx, cy); else { const c = SH[p.t], ox = p.t < 2 ? 4 : 0, oy = p.t ? 0 : 4;
      c.forEach((v, i) => { const x = cx - 4 + v[0] * 8 - ox, y = cy - 8 + v[1] * 8 + oy; g.drawImage(K.block(8, 8, COL[p.t]), x, y); if (i === p.s) K.box(g, x + 3, y + 3, 2, 2, '#ffffff'); }); } g.globalAlpha = 1; }
  const label = (g, s, y) => A.text(g, s, 151, y, '#b9bfd0', 2, 'center');
  const well = (g, y, h) => { K.box(g, 127, y, 48, h, '#59627a'); K.box(g, 128, y + 1, 46, h - 2, '#0e0c18'); };
  const big = (g, s, x, y, c, sc) => { A.text(g, s, x + 1, y + 1, '#000000', sc, 'center'); A.text(g, s, x, y, c, sc, 'center'); };

  refill(); banner(); spawn(); info();
  return {
    key(k) { if (!cur) return;
      if (k === 'left' || k === 'right') { das = 0; mv(k === 'left' ? -1 : 1); } else if (k === 'up') rot(); else if (k === 'a') hard();
      else if (k === 'down') { sd = true; if (fits(cur.c, cur.x, cur.y + 1)) { cur.y++; t = 0; A.add(1); } else lock(); } },
    tap(x) { if (x >= FW) hold(); else rot(); },
    update(dt) { time += dt; sh = Math.max(0, sh - dt);
      while (jing.length && jing[0].at <= time) A.beep(jing.shift().f, .12, 'triangle', .05);
      for (const p of pops) { p.t += dt; p.y -= dt * 14; } if (pops.length && pops[0].t > 1.1) pops.shift();
      if (ban && (ban.t += dt) > 2.2) ban = null;
      if (clr) { if ((clr.t += dt) >= .3) endClear(); return; }
      if (!cur) return;
      const h = !!(A.raw.c || A.raw.Shift); if (h && !ph) hold(); ph = h; if (!cur) return;
      if (!A.keys.left !== !A.keys.right) { das += dt; if (das > .18) { das -= .05; mv(A.keys.left ? -1 : 1); } } else das = 0;
      const soft = sd && A.keys.down;
      if (fits(cur.c, cur.x, cur.y + 1)) { t += dt; if (t >= (soft ? .04 : SPEED[lvl - 1])) { t = 0; cur.y++; if (soft) A.add(1); } }
      else { lt += dt; if (lt >= (soft ? .1 : .5)) lock(); } },
    draw(g) {
      K.scroll(g, bg, 0, 0, FW, 216); K.box(g, 0, 0, FW, 216, 'rgba(6,4,14,.6)');
      g.fillStyle = 'rgba(255,255,255,.045)'; for (let x = 1; x < W; x++) g.fillRect(x * S, 0, 1, 216); for (let y = 1; y < H; y++) g.fillRect(0, y * S, FW, 1);
      g.save(); if (sh > 0) g.translate(0, Math.round(Math.sin(sh * 80) * 2));
      for (let y = 0; y < H; y++) { const fl = clr && clr.rows.includes(y);
        if (fl && (clr.t * 16 | 0) % 2 === 0) K.box(g, 0, y * S, FW, S, '#ffffff'); else for (let x = 0; x < W; x++) if (f[y][x] >= 0) cell(g, f[y][x], x * S, y * S); }
      if (cur) { let gy = cur.y; while (fits(cur.c, cur.x, gy + 1)) gy++;
        g.fillStyle = 'rgba(255,255,255,.25)'; for (const p of cur.c) { const X = (cur.x + p[0]) * S, Y = (gy + p[1]) * S; if (Y >= 0) { g.fillRect(X, Y, S, 1); g.fillRect(X, Y + 11, S, 1); g.fillRect(X, Y + 1, 1, 10); g.fillRect(X + 11, Y + 1, 1, 10); } }
        if (cur.t === BOMB) { const X = cur.x * S + 6, Y = cur.y * S + 6; K.box(g, cur.x * S - S, gy * S - S, S * 3, S * 3, 'rgba(255,154,42,.13)'); K.put(g, bomb, X, Y); K.box(g, X + (time * 10 & 1), Y - 7, 2, 2, time * 10 & 1 ? '#ffffff' : '#ffd23c'); }
        else cur.c.forEach((p, i) => { if (cur.y + p[1] >= 0) cell(g, cur.t | (i === cur.s ? STAR : 0), (cur.x + p[0]) * S, (cur.y + p[1]) * S); }); }
      fx.draw(g); g.restore();
      if (top <= 4 && (time * 4 & 1)) { K.box(g, 0, 0, FW, 2, '#e8231e'); K.box(g, 0, 2, FW, 1, 'rgba(232,35,30,.35)'); }
      for (const p of pops) big(g, p.s, p.x, p.y, p.c, 1);
      if (ban) { K.box(g, 0, 74, FW, 40, 'rgba(6,4,14,.82)'); K.box(g, 0, 74, FW, 1, '#ffd23c'); K.box(g, 0, 113, FW, 1, '#ffd23c'); big(g, ban.a, 60, 80, '#ffd23c', 3); big(g, ban.b, 60, 100, '#ffffff', ban.b.length > 13 ? 1 : 2); }
      /* side panel */
      g.drawImage(panel, FW, 0); K.box(g, FW, 0, 2, 216, '#59627a'); K.box(g, FW + 2, 0, 1, 216, '#12141c');
      label(g, 'NEXT', 4); well(g, 16, 46); if (q[0]) mini(g, q[0], 151, 30, 1); if (q[1]) mini(g, q[1], 151, 50, .55);
      label(g, 'HOLD', 68); well(g, 80, 26); if (held) mini(g, held, 151, 93, canHold ? 1 : .4); else A.text(g, 'TAP OR C', 151, 91, '#59627a', 1, 'center');
      label(g, 'LEVEL', 112); big(g, lvl, 151, 124, '#5fe3d6', 3);
      label(g, 'GOAL', 146); well(g, 158, 8); K.box(g, 129, 160, Math.round(44 * Math.min(1, got / need(lvl))), 4, '#3fd45a'); A.text(g, Math.max(0, need(lvl) - got) + ' TO GO', 151, 169, '#b9bfd0', 1, 'center');
      if (lvl >= 4) { label(g, 'RUBBLE', 181); const n = every(), x0 = 151 - (n * 5 - 1) / 2 | 0; for (let i = 0; i < n; i++) K.box(g, x0 + i * 5, 195, 4, 8, i < rub ? (rub <= 2 && (time * 6 & 1) ? '#e8231e' : '#a9afc2') : '#12141c'); }
      else { label(g, 'LINES', 181); big(g, lines, 151, 195, '#ffd23c', 2); } }
  };
} });
