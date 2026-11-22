/* Mini Golf — 9 holes with a par each. Every hole adds a twist: sand, ponds, bouncy bumpers, sliding gates, speed strips, warp pads. Stars on the green are bonus points. */
Arcade.game('mini-golf', { w: 240, h: 320, pad: 'dpad', a: 'PUTT',
help: 'Pull back and let go: touch or click anywhere, drag away from where you want the ball to go, then release. A longer pull is a harder hit, and the dots show the start of the roll. With keys: left / right aim, up / down power, Space putts. Play 9 holes. Fewer putts score more: beat the par for a big bonus and try for a hole in one. Roll over the stars for extra points. Sand slows the ball, a pond costs one putt, red bumpers kick the ball away, blue gates slide, arrow strips push the ball and purple warp pads carry it across. After 8 putts you move on to the next hole.',
init(A) {
  const K = Art, F = K.fx(), OL = '#140e1c', R = 3, MINP = 50, MAXP = 420, LIMIT = 8, TAU = K.TAU;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  /* b tee, h hole, w walls [x,y,w,h], s sand and wt water [cx,cy,rx,ry], bp bumpers [x,y], mv gates [x,y,w,h,slide x,slide y,speed],
     sl speed strips [x,y,w,h,dx,dy], tp warp pads [x1,y1,x2,y2], st stars [x,y] */
  const HOLES = [
    { n: 'FIRST PUTT', par: 2, b: [120, 285], h: [120, 56], s: [[58, 170, 22, 16], [184, 118, 20, 15]], st: [[120, 225], [120, 170], [120, 115]] },
    { n: 'SANDY BEND', par: 2, b: [120, 285], h: [120, 56], w: [[70, 150, 100, 10]], s: [[38, 152, 24, 18], [120, 108, 24, 13]], st: [[201, 205], [201, 150], [166, 98]] },
    { n: 'POND CORNER', par: 3, b: [40, 285], h: [200, 50], w: [[8, 170, 150, 10], [90, 100, 142, 10]], wt: [[198, 236, 22, 17], [32, 40, 16, 12]], st: [[112, 232], [195, 136], [50, 104]] },
    { n: 'BUMPER PARK', par: 2, b: [120, 288], h: [120, 44], bp: [[120, 170], [72, 112], [168, 112], [56, 226], [184, 226]], st: [[88, 170], [152, 170], [120, 84]] },
    { n: 'SLIDING GATE', par: 3, b: [120, 288], h: [120, 44], w: [[8, 160, 72, 10], [160, 160, 72, 10]], mv: [[88, 160, 24, 10, 40, 0, 1.6]], s: [[58, 96, 22, 14], [182, 96, 22, 14]], st: [[120, 218], [120, 122], [60, 56]] },
    { n: 'SPEED HILL', par: 4, b: [196, 290], h: [44, 44], w: [[80, 8, 10, 200], [150, 112, 10, 200]], sl: [[162, 150, 68, 50, 0, -1], [92, 130, 56, 50, 0, 1], [10, 114, 68, 32, 0, 1]], wt: [[120, 30, 18, 11]], st: [[196, 120], [120, 240], [44, 180]] },
    { n: 'WARP TUNNEL', par: 3, b: [40, 288], h: [196, 280], w: [[115, 8, 10, 304], [125, 170, 60, 10]], tp: [[60, 60, 180, 60]], bp: [[86, 170]], s: [[30, 122, 16, 14]], wt: [[150, 232, 16, 12]], st: [[50, 205], [180, 120], [208, 205]] },
    { n: 'MILL LANE', par: 4, b: [120, 290], h: [120, 160], w: [[80, 200, 80, 10], [80, 120, 10, 90], [150, 120, 10, 90]], mv: [[92, 94, 22, 10, 36, 0, 1.5]], wt: [[34, 54, 20, 14], [206, 54, 20, 14]], bp: [[120, 50]], st: [[40, 160], [200, 160], [120, 135]] },
    { n: 'GRAND FINAL', par: 4, b: [120, 292], h: [120, 36], w: [[8, 236, 84, 10], [148, 236, 84, 10], [66, 160, 108, 10], [8, 92, 72, 10], [160, 92, 72, 10]], mv: [[88, 92, 24, 10, 40, 0, 2.2]], bp: [[36, 200], [204, 200]], s: [[120, 130, 24, 12]], sl: [[176, 112, 54, 36, -1, 0]], st: [[36, 270], [204, 150], [120, 64]] }];
  const BORD = [[0, 0, 240, 8], [0, 312, 240, 8], [0, 0, 8, 320], [232, 0, 8, 320]], BG = this.BG || (this.BG = []), pv = { x: 0, y: 0, vx: 0, vy: 0 };
  let hi = 0, H, walls, mv, stars, b, last, ang = 0, pow = 210, hold = 0, strokes = 0, total = 0, got = 0, card = [], dr = null, t = 0;
  let wait = 0, then = null, msg = '', sub = '', intro = 0, shake = 0, rollT = 0, lock = null, lip = 0, hid = false, sunk = false, fin = 0, bonus = 0, bpHit = -1, bpT = 0, trail = 0;
  const moving = () => b.vx !== 0 || b.vy !== 0, inEll = (o, e, k) => { const x = (o.x - e[0]) / (e[2] * k), y = (o.y - e[1]) / (e[3] * k); return x * x + y * y < 1; };
  const info = () => A.info('HOLE ' + (hi + 1) + '/9 · PUTTS ' + strokes);

  /* ---- art ---- */
  const blob = (kind, e, seed) => K.spr('mini-golf-' + kind + e[2] + '_' + e[3] + '_' + seed, e[2] * 2, e[3] * 2, g => { const c = kind === 's' ? ['#d8b45a', '#ecd08a', '#f6e2a8', '#b88a3a'] : ['#1b5fa8', '#2a80c8', '#4a9ce0', '#12447a'];
    g.scale(1, e[3] / e[2]); K.org(g, 0, 0, e[2], seed, 11); g.fillStyle = c[0]; g.fill(); K.org(g, 0, 0, e[2] - 3, seed, 11); g.fillStyle = c[1]; g.fill(); K.org(g, -2, -2, e[2] * .55, seed + 2, 9); g.fillStyle = c[2]; g.fill();
    for (let i = 0; i < e[2]; i++) { const a = i * 2.4 + seed, d = (i * 7 % 10) / 10 * e[2] * .66; K.box(g, Math.cos(a) * d, Math.sin(a) * d, kind === 's' ? 1 : 3, 1, c[3]); } }, { L: 12 });
  const bumper = lit => K.spr('mini-golf-bump' + lit, 18, 18, g => { const r = lit ? 9 : 8; K.ell(g, 0, 0, r, r, lit ? '#ff8a7a' : '#e8231e'); K.ell(g, 0, 0, r - 2.5, r - 2.5, '#fff6e8'); K.ell(g, 0, 0, r - 4.5, r - 4.5, lit ? '#fff6c8' : '#ffd23c'); K.box(g, -2, -3, 2, 2, '#ffffff'); });
  const warp = () => K.spr('mini-golf-warp', 18, 18, g => { K.ell(g, 0, 0, 9, 9, '#8a4ac8'); K.ell(g, 0, 0, 7, 7, '#e0b0ff'); K.ell(g, 0, 0, 5.5, 5.5, '#4a1f7a'); K.ell(g, 0, 0, 3, 3, '#1a0c30'); });
  function wall(g, w, wd) { K.box(g, w[0] - 1, w[1] - 1, w[2] + 2, w[3] + 2, OL);
    for (let yy = 0; yy < w[3]; yy += 64) for (let xx = 0; xx < w[2]; xx += 64) { const a = Math.min(64, w[2] - xx), c = Math.min(64, w[3] - yy); g.drawImage(wd, 0, 0, a, c, w[0] + xx, w[1] + yy, a, c); }
    K.box(g, w[0], w[1], w[2], 2, '#f0c080'); K.box(g, w[0], w[1], 2, w[3], '#e0a860'); K.box(g, w[0], w[1] + w[3] - 2, w[2], 2, '#6a3c14'); K.box(g, w[0] + w[2] - 2, w[1], 2, w[3], '#6a3c14'); }
  /* everything that never moves is painted once per hole */
  function bake(H, i) { const c = K.mkc(240, 320), g = c.getContext('2d'), wd = K.T.wood(64, 64); g.imageSmoothingEnabled = false; K.scroll(g, K.T.grass(64, 64), 0, 0, 240, 320);
    g.fillStyle = 'rgba(160,255,160,.07)'; for (let y = 0; y < 320; y += 16) for (let x = (y / 16 % 2) * 16; x < 240; x += 32) g.fillRect(x, y, 16, 16);
    (H.s || []).forEach((e, j) => K.put(g, blob('s', e, i * 3 + j), e[0], e[1])); (H.wt || []).forEach((e, j) => K.put(g, blob('w', e, i * 5 + j + 1), e[0], e[1]));
    for (const s of H.sl || []) { K.box(g, s[0] - 1, s[1] - 1, s[2] + 2, s[3] + 2, OL); K.box(g, s[0], s[1], s[2], s[3], '#1f7a4a'); K.box(g, s[0], s[1], s[2], 1, '#3fa86a'); K.box(g, s[0], s[1] + s[3] - 1, s[2], 1, '#145a34'); }
    for (const w of H.w || []) K.box(g, w[0] + 3, w[1] + 4, w[2], w[3], 'rgba(0,0,0,.28)'); for (const w of BORD.concat(H.w || [])) wall(g, w, wd);
    K.box(g, H.b[0] - 7, H.b[1] - 2, 14, 5, '#1f5a28'); K.box(g, H.b[0] - 6, H.b[1] - 1, 12, 3, '#f2f5f8');
    K.put(g, K.spr('mini-golf-cup', 16, 14, q => { K.ell(q, 0, 0, 8, 7, '#1f5a28'); K.ell(q, 0, 0, 6, 5, '#0e0c18'); K.ell(q, 0, 1.5, 5, 3, '#221a30'); }, { ol: 0 }), H.h[0], H.h[1]); return c; }
  function chev(g, x, y, dx, dy, c) { for (let i = 0; i < 3; i++) { K.box(g, x - dx * i * 2 - dy * i * 2, y - dy * i * 2 + dx * i * 2, 2, 2, c); K.box(g, x - dx * i * 2 + dy * i * 2, y - dy * i * 2 - dx * i * 2, 2, 2, c); } }

  /* ---- physics ---- */
  /* push a ball out of a box and bounce it; returns how hard it hit (0 = no touch) */
  function hitRect(o, x, y, w, h) { const nx = clamp(o.x, x, x + w), ny = clamp(o.y, y, y + h), dx = o.x - nx, dy = o.y - ny, d = Math.hypot(dx, dy); if (d >= R) return 0; let ux = 0, uy = 0;
    if (d > 0) { ux = dx / d; uy = dy / d; o.x = nx + ux * R; o.y = ny + uy * R; }
    else { const l = o.x - x, r = x + w - o.x, u = o.y - y, m = Math.min(l, r, u, y + h - o.y); if (m === l) { ux = -1; o.x = x - R; } else if (m === r) { ux = 1; o.x = x + w + R; } else if (m === u) { uy = -1; o.y = y - R; } else { uy = 1; o.y = y + h + R; } }
    const dot = o.vx * ux + o.vy * uy; if (dot >= 0) return .01; o.vx = (o.vx - 2 * dot * ux) * .82; o.vy = (o.vy - 2 * dot * uy) * .82; return -dot; }
  function gates(o) { let hit = 0; for (const m of mv) { o.vx -= m.vx; o.vy -= m.vy; hit = Math.max(hit, hitRect(o, m.x, m.y, m.w, m.h)); o.vx += m.vx; o.vy += m.vy; } return hit; }
  /* one frame of rolling; real = the true ball (gates and effects), otherwise the aim preview */
  function advance(o, dt, real) { let hit = 0;
    for (let i = 0; i < 4; i++) { o.x += o.vx * dt / 4; o.y += o.vy * dt / 4; for (const w of walls) hit = Math.max(hit, hitRect(o, w[0], w[1], w[2], w[3])); if (real) hit = Math.max(hit, gates(o));
      (H.bp || []).forEach((p, j) => { const dx = o.x - p[0], dy = o.y - p[1], d = Math.hypot(dx, dy) || 1; if (d >= 8 + R) return; const ux = dx / d, uy = dy / d, dot = o.vx * ux + o.vy * uy; o.x = p[0] + ux * (8 + R); o.y = p[1] + uy * (8 + R);
        if (dot < 0) { o.vx -= 2 * dot * ux; o.vy -= 2 * dot * uy; } const sp = clamp(Math.hypot(o.vx, o.vy) + 60, 150, 440), a = Math.atan2(o.vy + uy * 40, o.vx + ux * 40); o.vx = Math.cos(a) * sp; o.vy = Math.sin(a) * sp; if (real) { bpHit = j; bpT = .2; } }); }
    let fr = 1.5, slope = false; for (const e of H.s || []) if (inEll(o, e, .85)) fr = 7;
    for (const s of H.sl || []) if (o.x > s[0] && o.x < s[0] + s[2] && o.y > s[1] && o.y < s[1] + s[3]) { o.vx += s[4] * 170 * dt; o.vy += s[5] * 170 * dt; slope = true; }
    const f = Math.max(0, 1 - fr * dt); o.vx *= f; o.vy *= f; if (!slope && Math.hypot(o.vx, o.vy) < 7) o.vx = o.vy = 0; return hit; }

  /* ---- flow ---- */
  function load() { H = HOLES[hi]; if (!BG[hi]) BG[hi] = bake(H, hi); walls = BORD.concat(H.w || []); mv = (H.mv || []).map(m => ({ x: m[0], y: m[1], w: m[2], h: m[3], vx: 0, vy: 0 })); stars = (H.st || []).map(s => ({ x: s[0], y: s[1] }));
    b = { x: H.b[0], y: H.b[1], vx: 0, vy: 0 }; last = H.b; strokes = 0; lock = null; sunk = hid = false; msg = sub = ''; intro = 2; pow = 210; rest(); }
  function rest() { b.vx = b.vy = 0; last = [b.x, b.y]; ang = Math.atan2(H.h[1] - b.y, H.h[0] - b.x); info(); if (strokes >= LIMIT) finish(false); }
  function putt() { if (moving() || wait > 0) return; b.vx = Math.cos(ang) * pow; b.vy = Math.sin(ang) * pow; strokes++; rollT = lip = intro = 0; A.beep(360 + pow * .5, .05); F.spark(b.x, b.y, ['#a8f0a0', '#58b96a'], 5, 40); info(); }
  function finish(ok) { const d = strokes - H.par; card[hi] = strokes; total += strokes; b.vx = b.vy = 0; wait = 1.8; then = next;
    if (!ok) { msg = 'OUT OF PUTTS'; sub = 'ON TO THE NEXT HOLE'; A.beep(200, .25, 'sawtooth'); return; }
    const pts = 50 + Math.max(0, 2 - d) * 50 + (strokes === 1 ? 100 : 0); A.add(pts); sunk = true; b.x = H.h[0]; b.y = H.h[1]; shake = strokes === 1 ? .3 : .12;
    msg = strokes === 1 ? 'HOLE IN ONE!' : d <= -2 ? 'SUPER PUTT!' : d === -1 ? 'UNDER PAR!' : d === 0 ? 'PAR!' : 'IN ' + strokes + ' PUTTS'; sub = '+' + pts;
    F.spark(b.x, b.y, ['#ffd23c', '#ffffff', '#3fd45a'], d < 0 ? 40 : 22, 120); [660, 880, d < 0 ? 1320 : 990].forEach((f, i) => setTimeout(() => A.beep(f, .14, 'triangle', .05), i * 110)); }
  function next() { msg = sub = ''; if (++hi < 9) return load(); hi = 8; const par = HOLES.reduce((s, h) => s + h.par, 0); bonus = total <= par ? 100 + (par - total) * 25 : 0; A.add(bonus); fin = 1; wait = 4.5; then = () => A.over(true); A.info(total + ' PUTTS · PAR ' + par); }
  function roll(dt) { dr = null; rollT += dt; const sp0 = Math.hypot(b.vx, b.vy), hit = Math.max(advance(b, dt, true), bpT === .2 ? 300 : 0);
    if (bpT === .2) { bpT = .19; A.beep(720, .07, 'triangle', .05); F.spark(b.x, b.y, ['#ffd23c', '#ff8a7a', '#ffffff'], 8, 90); shake = .1; }
    else if (hit > 30) { A.beep(170 + Math.min(260, hit * .6), .03); if (hit > 110) F.spark(b.x, b.y, ['#f0c080', '#ffffff'], 4, 50); if (hit > 260) shake = .08; }
    if ((trail += dt) > .05 && sp0 > 150) { trail = 0; F.puff(b.x, b.y, 'rgba(255,255,255,.5)'); }
    for (const e of H.s || []) if (sp0 > 60 && inEll(b, e, .85) && Math.random() < .5) F.puff(b.x, b.y, '#f6e2a8', -12);
    for (const s of stars) if (!s.got && Math.hypot(b.x - s.x, b.y - s.y) < 9) { s.got = 1; got++; A.add(25); A.beep(1040, .08, 'triangle', .05); setTimeout(() => A.beep(1560, .1, 'triangle', .05), 70); F.spark(s.x, s.y, ['#ffd23c', '#fff6c8'], 12, 70); }
    for (const p of H.tp || []) for (let i = 0; i < 2; i++) { const x = p[i * 2], y = p[i * 2 + 1], d = Math.hypot(b.x - x, b.y - y), id = x + '_' + y;
      if (lock === id) { if (d > 11) lock = null; } else if (d < 7 && !lock) { const X = p[2 - i * 2], Y = p[3 - i * 2]; F.spark(x, y, ['#e0b0ff', '#8a4ac8'], 12, 70); b.x = X; b.y = Y; lock = X + '_' + Y; F.spark(X, Y, ['#e0b0ff', '#ffffff'], 12, 70); A.beep(300, .18, 'sine', .06); setTimeout(() => A.beep(600, .16, 'sine', .06), 90); return; } }
    for (const e of H.wt || []) if (inEll(b, e, .8)) { F.spark(b.x, b.y, ['#b8e6ff', '#4a9ce0', '#ffffff'], 18, 90); A.beep(240, .2, 'sine', .07); setTimeout(() => A.beep(150, .25, 'sine', .06), 80); strokes++; b.vx = b.vy = 0; hid = true; msg = 'SPLASH!'; sub = '+1 PUTT'; info();
      wait = 1; then = () => { hid = false; msg = sub = ''; b.x = last[0]; b.y = last[1]; rest(); }; return; }
    const dx = H.h[0] - b.x, dy = H.h[1] - b.y, d = Math.hypot(dx, dy) || 1, sp = Math.hypot(b.vx, b.vy);
    if (d < 6) { if (sp < 215) return finish(true); if (!lip) { lip = 1; b.vx *= .8; b.vy *= .8; A.beep(520, .04); } } else if (d < 12 && sp < 150) { b.vx += dx / d * 260 * dt; b.vy += dy / d * 260 * dt; }
    if (rollT > 14) b.vx = b.vy = 0; if (!moving()) rest(); }
  load();
  return {
    key(k) { if (k !== 'a') return; if (fin) { if (wait > .05 && wait < 3.5) wait = .05; } else putt(); }, swipe() {},
    update(dt) { t += dt; shake = Math.max(0, shake - dt); bpT = Math.max(0, bpT - dt);
      (H.mv || []).forEach((m, i) => { const q = mv[i], s = .5 - .5 * Math.cos(t * m[6]), x = m[0] + m[4] * s, y = m[1] + m[5] * s; q.vx = dt ? (x - q.x) / dt : 0; q.vy = dt ? (y - q.y) / dt : 0; q.x = x; q.y = y; });
      if (wait > 0) { wait -= dt; if (wait <= 0) { const f = then; then = null; if (f) f(); } return; }
      intro -= dt; if (!moving()) { const k = A.keys, d = (k.right ? 1 : 0) - (k.left ? 1 : 0); hold = d ? hold + dt : 0; ang += d * (hold < .3 ? .5 : 2.2) * dt; pow = clamp(pow + ((k.up ? 1 : 0) - (k.down ? 1 : 0)) * 220 * dt, MINP, MAXP);
        if (d || k.up || k.down) intro = 0; if (A.ptr.down && !dr) { const p = A.ptrs[0]; dr = p ? { x: p.x0, y: p.y0 } : { x: A.ptr.x, y: A.ptr.y }; intro = 0; }
        if (dr) { const dx = dr.x - A.ptr.x, dy = dr.y - A.ptr.y, len = Math.hypot(dx, dy); dr.on = len > 8; if (dr.on) { ang = Math.atan2(dy, dx); pow = clamp(len * 3.6, MINP, MAXP); } if (!A.ptr.down) { const go = dr.on; dr = null; if (go) putt(); } }
        if (!moving()) gates(b); /* a sliding gate can nudge a resting ball */ }
      if (moving()) roll(dt); },
    draw(g) { const now = performance.now() / 1000, hx = H.h[0], hy = H.h[1], aim = !moving() && wait <= 0 && !fin; K.box(g, 0, 0, 240, 320, OL); g.save(); if (shake > 0) g.translate(Math.round(Math.sin(now * 90) * 2), Math.round(Math.cos(now * 70) * 2)); g.drawImage(BG[hi], 0, 0);
      for (const e of H.wt || []) for (let i = 0; i < 3; i++) { const p = (now * .5 + i / 3) % 1; K.box(g, Math.round(e[0] - e[2] * .5 + p * e[2] * .8), Math.round(e[1] + (i - 1) * e[3] * .4), 4, 1, p < .15 || p > .85 ? '#4a9ce0' : '#b8e6ff'); }
      for (const s of H.sl || []) { const o = (now * 26) % 14, n = s[4] ? s[2] : s[3]; for (let q = o + 8; q < n - 2; q += 14) { const c = '#a8f0a0'; if (s[4]) for (let y = s[1] + 9; y < s[1] + s[3] - 6; y += 22) chev(g, Math.round(s[4] > 0 ? s[0] + q : s[0] + s[2] - q), y, s[4], 0, c); else for (let x = s[0] + 10; x < s[0] + s[2] - 6; x += 22) chev(g, x, Math.round(s[5] > 0 ? s[1] + q : s[1] + s[3] - q), 0, s[5], c); } }
      for (const p of H.tp || []) for (let i = 0; i < 2; i++) { const x = p[i * 2], y = p[i * 2 + 1]; K.put(g, warp(), x, y); for (let j = 0; j < 3; j++) { const a = now * 4 + j * TAU / 3, r = 3 + (now * 3 + j) % 3; K.box(g, Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1, '#e0b0ff'); } }
      for (const s of stars) if (!s.got) { K.shadow(g, s.x, s.y + 6, 4, 1.5); K.put(g, K.star('#ffd23c'), s.x, s.y + Math.round(Math.sin(now * 4 + s.x) * 1.5)); }
      for (const m of mv) { K.box(g, Math.round(m.x) + 3, Math.round(m.y) + 4, m.w, m.h, 'rgba(0,0,0,.28)'); g.drawImage(K.block(m.w, m.h, '#3f8ae0'), Math.round(m.x), Math.round(m.y)); }
      (H.bp || []).forEach((p, j) => { K.shadow(g, p[0] + 2, p[1] + 4, 8, 6); K.put(g, bumper(j === bpHit && bpT > 0 ? 1 : 0), p[0], p[1]); });
      K.box(g, hx, hy - 24, 2, 24, OL); K.box(g, hx, hy - 24, 1, 24, '#f2f5f8'); const fw = Math.floor(now * 3.3) % 2; K.box(g, hx + 2, hy - 24, 10 - fw, 8, OL); K.box(g, hx + 2, hy - 23, 9 - fw, 6, '#e8231e'); K.box(g, hx + 2, hy - 23, 9 - fw, 2, '#ff8a7a');
      if (aim) { const c = pow > 320 ? '#ff6a5a' : pow > 190 ? '#ffd23c' : '#a8f0a0'; pv.x = b.x; pv.y = b.y; pv.vx = Math.cos(ang) * pow; pv.vy = Math.sin(ang) * pow;
        for (let i = 1; i <= 33; i++) { advance(pv, 1 / 60, false); if (i % 3 === 0) { const x = Math.round(pv.x), y = Math.round(pv.y), s = i > 24 ? 1 : 2; K.box(g, x - s, y - s, s * 2, s * 2, OL); K.box(g, x - s + 1, y - s + 1, s * 2 - 2, s * 2 - 2, c); } }
        if (dr && dr.on) { const n = Math.round(pow / 60); for (let i = 1; i <= n; i++) K.box(g, Math.round(b.x - Math.cos(ang) * i * 5) - 1, Math.round(b.y - Math.sin(ang) * i * 5) - 1, 2, 2, '#f2f5f8'); } }
      if (!hid && !sunk) { K.shadow(g, b.x + 1, b.y + 3, 3, 1.5); K.put(g, K.ball(R, '#ffffff'), b.x, b.y); } F.draw(g); g.restore();
      /* HUD on the wooden frame: hole and putts on top, power bar below */
      const hud = 'HOLE ' + (hi + 1) + '  PAR ' + H.par + '  PUTTS ' + strokes; A.text(g, hud, 11, 3, OL); A.text(g, hud, 10, 2, '#fff6c8'); for (let i = 0; i < 3; i++) { const on = stars[i] && stars[i].got; K.box(g, 205 + i * 8, 1, 6, 6, OL); K.box(g, 206 + i * 8, 2, 4, 4, on ? '#ffd23c' : '#6a3c14'); }
      const pf = (pow - MINP) / (MAXP - MINP); A.text(g, 'POWER', 11, 314, OL); A.text(g, 'POWER', 10, 313, '#fff6c8'); K.box(g, 35, 313, 196, 6, OL); K.box(g, 36, 314, 194, 4, '#3a2412'); K.box(g, 36, 314, Math.round(194 * pf), 4, pf > .73 ? '#ff6a5a' : pf > .38 ? '#ffd23c' : '#a8f0a0'); K.box(g, 36, 314, Math.round(194 * pf), 1, '#ffffff');
      const band = (y, h) => { K.box(g, 0, y, 240, h, 'rgba(13,11,20,.84)'); K.box(g, 0, y, 240, 2, '#ffd23c'); K.box(g, 0, y + h - 2, 240, 2, '#ffd23c'); }, big = (s, y, sc, c) => { A.text(g, s, 121, y + 1, OL, sc, 'center'); A.text(g, s, 120, y, c, sc, 'center'); };
      if (fin) { const par = HOLES.reduce((s, h) => s + h.par, 0); band(70, 180); big('COURSE DONE!', 82, 3, '#ffd23c'); A.text(g, 'HOLE', 14, 112, '#aab4c2'); A.text(g, 'PAR', 14, 126, '#aab4c2'); A.text(g, 'YOU', 14, 140, '#aab4c2');
        HOLES.forEach((h, i) => { const x = 50 + i * 20, s = card[i] || 0; A.text(g, i + 1, x, 112, '#aab4c2', 1, 'center'); A.text(g, h.par, x, 126, '#ffffff', 1, 'center'); A.text(g, s, x, 140, s < h.par ? '#3fd45a' : s === h.par ? '#ffd23c' : '#ff8a7a', 2, 'center'); });
        big(total + ' PUTTS - PAR ' + par, 166, 2, '#ffffff'); big('STARS ' + got + ' OF 27', 186, 2, '#ffd23c'); big(bonus ? 'PAR BONUS +' + bonus : 'BEAT PAR FOR A BONUS', 208, bonus ? 2 : 1, bonus ? '#3fd45a' : '#aab4c2'); if (bonus) big('GREAT ROUND!', 228, 2, '#5fe3d6'); }
      else if (msg) { band(138, 46); big(msg, 147, msg.length > 12 ? 2 : 3, msg === 'SPLASH!' ? '#6fc8ff' : '#ffd23c'); big(sub, 171, 1, '#ffffff'); }
      else if (intro > 0) { band(140, 40); big('HOLE ' + (hi + 1) + ' - PAR ' + H.par, 148, 1, '#ffffff'); big(H.n, 159, 2, '#ffd23c'); } }
  };
} });
