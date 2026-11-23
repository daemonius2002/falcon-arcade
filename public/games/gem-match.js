Arcade.game('gem-match', { w: 168, h: 192,
help: 'Swipe a gem onto its neighbour to swap them (or tap one gem, then the one next to it). Keyboard: arrows move the cursor, Space grabs a gem, then an arrow swaps it. Line up 3 or more of a kind. Each level shows what to collect at the top — finish it before your moves run out and spare moves become bonus points. Line up 4 for an arrow gem that zaps a whole line, 5 or an L shape for a burst gem (white rays) that blasts its neighbours. From level 2 smash rocks by matching next to them; later, frozen gems cannot be swapped until a match or a blast breaks the ice.',
init(A) {
  const K = Art, C = 7, RW = 7, T = 24, OY = 24, N = C * RW, ROCK = 6, F = K.fx(), DIRS = ['left', 'right', 'up', 'down'];
  const COLS = ['#e8231e', '#ffd23c', '#3fd45a', '#3fa8e0', '#b06ae0', '#ff8a1e'];
  let b = [], level = 0, moves = 0, goals = [], nc = 5, st = 'idle', t = 0, chain = 0, sel = -1, cur = -1, mv = [], kill = new Set(), make = new Map(), beams = [],
    idle = 0, hint = null, shake = 0, floats = [], fly = [], bonus = 0, tip = '', tipT = 0;

  /* ---------- board helpers ---------- */
  const cell = v => ({ v, sp: 0, ice: 0, x: 0, y: 0, vy: 0 }); /* sp: 1 row arrow, 2 column arrow, 3 burst; x/y: drawing offset while sliding */
  const val = (x, y) => x < 0 || y < 0 || x >= C || y >= RW || !b[y * C + x] ? -1 : b[y * C + x].v;
  const px = i => (i % C) * T + 12, py = i => OY + Math.floor(i / C) * T + 12;
  const nb = (i, d) => { const x = i % C + (d === 'left' ? -1 : d === 'right' ? 1 : 0), y = Math.floor(i / C) + (d === 'up' ? -1 : d === 'down' ? 1 : 0); return i < 0 || x < 0 || y < 0 || x >= C || y >= RW ? -1 : y * C + x; };
  const free = i => i >= 0 && b[i] && b[i].v < ROCK && !b[i].ice; /* can be swapped */
  const swap = (a, c) => { const q = b[a]; b[a] = b[c]; b[c] = q; };
  function slide(a, c) { swap(a, c); b[a].x = px(c) - px(a); b[a].y = py(c) - py(a); b[c].x = -b[a].x; b[c].y = -b[a].y; }
  function find() { const runs = [];
    for (let y = 0; y < RW; y++) for (let x = 0; x < C; x++) { const v = val(x, y); if (v < 0 || v >= ROCK) continue;
      for (const [dx, dy] of [[1, 0], [0, 1]]) { if (val(x - dx, y - dy) === v) continue; let n = 1; while (val(x + dx * n, y + dy * n) === v) n++;
        if (n > 2) runs.push({ h: dx, c: Array.from({ length: n }, (_, k) => (y + dy * k) * C + x + dx * k) }); } }
    return runs; }
  /* a swap that makes a match (one that helps the level goal if there is one), or null */
  function hasMove() { let any = null;
    for (let i = 0; i < N; i++) for (const d of ['right', 'down']) { const j = nb(i, d); if (!free(i) || !free(j)) continue;
      swap(i, j); const r = find(); swap(i, j); if (!r.length) continue;
      if (r.some(q => goals.some(o => o.n > 0 && o.v === b[q.c[0] === j ? i : q.c[0] === i ? j : q.c[0]].v))) return [i, j]; any = any || [i, j]; }
    return any; }
  function fill() { b = []; for (let i = 0; i < N; i++) { let v; do { v = A.ri(0, nc - 1); } while ((i % C > 1 && b[i - 1].v === v && b[i - 2].v === v) || (i >= 2 * C && b[i - C].v === v && b[i - 2 * C].v === v)); b.push(cell(v)); } }
  function shuffle() { const old = b.slice();
    for (let k = 0; k < 80; k++) { for (let i = N - 1; i > 0; i--) swap(i, A.ri(0, i)); if (!find().length && (hint = hasMove())) break; }
    if (!hint) { fill(); hint = hasMove(); if (!hint) return shuffle(); } else b.forEach((c, i) => { const o = old.indexOf(c); c.x = px(o) - px(i); c.y = py(o) - py(i); });
    st = 'mix'; say(84, 100, 'SHUFFLE!', '#ffffff', 2); A.beep(500, .12, 'triangle'); }
  const say = (x, y, s, c, sc) => floats.push({ x, y, s, c, sc: sc || 1, t: 0 });

  /* ---------- levels ---------- */
  function setup() { level++; nc = level < 3 ? 5 : 6; const a = A.ri(0, nc - 1);
    goals = [{ v: a, n: Math.min(8 + level * 2, 24) }];
    if (level > 1) goals.push(level % 2 ? { v: (a + A.ri(1, nc - 1)) % nc, n: Math.min(6 + level * 2, 22) } : { v: ROCK, n: Math.min(2 + level, 10) });
    moves = level < 2 ? 15 : Math.max(16, 23 - level); A.info('LEVEL ' + level);
    if (level === 1) return fill();
    const plain = () => { for (let k = 0; k < 200; k++) { const i = A.ri(0, N - 1); if (b[i].v < ROCK && !b[i].sp && !b[i].ice) return i; } return -1; };
    const have = f => b.filter(f).length; /* rocks and ice left over from the last level count towards the new ones */
    for (let k = (level % 2 ? Math.min(level, 7) : goals[1].n + 2) - have(c => c.v === ROCK); k-- > 0;) { const i = plain(); if (i >= 0) { b[i].v = ROCK; F.puff(px(i), py(i), '#c8c0b0'); } }
    for (let k = (level < 4 ? 0 : Math.min(level - 2, 7)) - have(c => c.ice); k-- > 0;) { const i = plain(); if (i >= 0) { b[i].ice = 1; F.spark(px(i), py(i), ['#b8e6ff', '#ffffff'], 5, 40); } }
    tip = level === 2 ? 'MATCH NEXT TO ROCKS!' : level === 3 ? 'A NEW GEM APPEARS!' : level === 4 ? 'FROZEN GEMS ARE STUCK!' : ''; tipT = 3.5; }
  function ready() { st = 'idle'; idle = 0; hint = hasMove(); if (!hint) shuffle(); }

  /* ---------- match → clear → fall loop ---------- */
  function plan() { const runs = find(); if (!runs.length) return settle();
    chain++; make = new Map(); kill = new Set(); beams = []; const cnt = {}; runs.forEach(r => r.c.forEach(i => { cnt[i] = (cnt[i] || 0) + 1; }));
    for (const r of runs) { const x = r.c.find(i => cnt[i] > 1), n = r.c.length, own = r.c.find(i => mv.includes(i));
      if (x != null) make.set(x, 3); else if (n > 3) make.set(own != null ? own : r.c[1], n > 4 ? 3 : r.h ? 1 : 2);
      for (const i of r.c) { kill.add(i); for (const d of DIRS) { const j = nb(i, d); if (j >= 0 && b[j].v === ROCK) kill.add(j); } } }
    const done = new Set(); let grew = true; /* special gems caught in the clear go off too, and can set each other off */
    while (grew) { grew = false; for (const i of [...kill]) { const c = b[i]; if (!c.sp || done.has(i)) continue; done.add(i); grew = true; const x = i % C, y = Math.floor(i / C); beams.push([c.sp, x, y]);
      for (let j = 0; j < N; j++) { const X = j % C, Y = Math.floor(j / C); if (c.sp === 1 ? Y === y : c.sp === 2 ? X === x : Math.abs(X - x) < 2 && Math.abs(Y - y) < 2) kill.add(j); } } }
    let pts = 0, sx = 0, sy = 0;
    for (const i of kill) { const c = b[i], x = px(i), y = py(i); sx += x; sy += y;
      if (c.ice) { pts += 5; F.spark(x, y, ['#b8e6ff', '#ffffff'], 6, 60); continue; }
      pts += c.v === ROCK ? 20 : 10; F.spark(x, y, c.v === ROCK ? ['#8a7a6a', '#c8c0b0'] : [COLS[c.v], '#ffffff'], 6, 70);
      const q = goals.findIndex(o => o.v === c.v && o.n > 0); if (q >= 0) { goals[q].n--; fly.push({ x, y, q, v: c.v, t: 0 }); } }
    pts *= chain; A.add(pts); say(sx / kill.size, sy / kill.size - 4, '+' + pts, '#ffffff'); if (chain > 1) say(84, 60, 'CHAIN X' + chain + '!', '#ffd23c', 2);
    A.beep(380 + chain * 110, .1, 'triangle'); if (beams.length) { shake = .3; A.beep(110, .3, 'sawtooth', .05); } else if (make.size) A.beep(990, .15, 'square', .03);
    mv = []; st = 'clear'; t = 0; }
  function apply() { for (const i of kill) { const c = b[i]; if (c.ice) c.ice = 0; else if (make.has(i)) c.sp = make.get(i); else b[i] = null; }
    const rocksLeft = (goals.find(o => o.v === ROCK) || { n: 0 }).n - b.filter(c => c && c.v === ROCK).length; /* keep a rock goal reachable */
    const want = goals.filter(o => o.n > 0 && o.v < ROCK); /* gems the level still asks for drop in a little more often */
    for (let x = 0; x < C; x++) { let gap = 0;
      for (let y = RW - 1; y >= 0; y--) { const i = y * C + x, c = b[i]; if (!c) gap++; else if (gap) { b[i + gap * C] = c; b[i] = null; c.y = -gap * T; c.vy = 0; } }
      for (let y = 0; y < gap; y++) { const c = b[y * C + x] = cell(rocksLeft > 0 && Math.random() < .3 ? ROCK : want.length && Math.random() < .15 ? want[A.ri(0, want.length - 1)].v : A.ri(0, nc - 1)); c.y = -gap * T; } }
    kill = new Set(); make = new Map(); beams = []; st = 'fall'; }
  function settle() { chain = 0; t = 0;
    if (goals.every(o => o.n <= 0)) { bonus = level * 100 + moves * 25; A.add(bonus); st = 'won'; [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => A.beep(f, .14, 'square'), i * 110)); for (let k = 0; k < 6; k++) F.spark(A.ri(20, 148), A.ri(50, 150), COLS, 10, 90); }
    else if (moves <= 0) { st = 'out'; A.beep(160, .3, 'sawtooth'); }
    else ready(); }
  function tryS(a, c) { if (st !== 'idle' || a < 0) return; sel = -1;
    if (!free(a) || !free(c)) { A.beep(150, .1); if (b[a].ice || (c >= 0 && b[c].ice)) say(px(a), py(a) - 6, 'STUCK!', '#b8e6ff'); return; }
    slide(a, c); mv = [a, c]; st = 'swap'; A.beep(520, .04); }
  const cellAt = (x, y) => { const cx = Math.floor(x / T), cy = Math.floor((y - OY) / T); return cx < 0 || cy < 0 || cx >= C || cy >= RW ? -1 : cy * C + cx; };
  setup(); ready();

  /* ---------- sprites (own keys are prefixed with the game id) ---------- */
  const arrow = h => K.spr('gem-match-arrow' + h, 14, 14, g => { if (!h) g.rotate(Math.PI / 2); K.box(g, -4, -1, 8, 2, '#ffffff'); K.part(g, [-7, 0, -3, -4, -3, 4], '#ffffff'); K.part(g, [7, 0, 3, -4, 3, 4], '#ffffff'); });
  const burst = () => K.spr('gem-match-burst', 16, 16, g => { for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; for (let r = 3; r < (k % 2 ? 6 : 8); r++) K.box(g, Math.round(Math.cos(a) * r) - 1, Math.round(Math.sin(a) * r) - 1, 2, 2, '#ffffff'); } K.box(g, -2, -2, 4, 4, '#ffe98a'); });
  const ice = () => K.spr('gem-match-ice', 22, 22, g => { g.fillStyle = '#b8e6ff'; for (let y = -11; y < 11; y++) for (let x = -11; x < 11; x++) if (Math.max(Math.abs(x + .5), Math.abs(y + .5)) > 8 ? (x + y) & 1 : (x - y + 44) % 7 === 0) g.fillRect(x, y, 1, 1); K.box(g, -11, -11, 22, 1, '#ffffff'); K.box(g, -11, -11, 1, 22, '#ffffff'); }, { ol: 0 });
  const tile = () => K.spr('gem-match-tile', 22, 22, g => { K.box(g, -11, -11, 22, 22, '#1c1840'); K.box(g, -11, 10, 22, 1, '#3a3470'); K.box(g, 10, -11, 1, 22, '#3a3470'); }, { ol: 0 });
  const icon = (v, n) => v === ROCK ? K.rock(n > 12 ? 9 : 5, 1) : K.gem(v, COLS[v], n);
  const frame = (g, i, col) => { const X = px(i) - 12, Y = py(i) - 12; for (const [a, c] of [[0, 0], [18, 0], [0, 18], [18, 18]]) { K.box(g, X + a, Y + c + (c ? 4 : 0), 6, 2, col); K.box(g, X + a + (a ? 4 : 0), Y + c, 2, 6, col); } };
  const gx = q => goals.length > 1 ? 62 + q * 42 : 80; /* where goal q sits in the top bar */

  return {
    tap(x, y) { const i = cellAt(x, y); if (st !== 'idle' || i < 0) return; cur = -1;
      if (sel >= 0 && DIRS.some(d => nb(sel, d) === i)) tryS(sel, i); else if (sel === i) sel = -1; else if (free(i)) { sel = i; A.beep(600, .03); } else tryS(i, -1); },
    swipe(d, x0, y0) { const i = cellAt(x0, y0); cur = -1; if (i >= 0) tryS(i, nb(i, d)); },
    key(k) { if (cur < 0) { cur = 24; return; } /* the cursor can move while gems fall; grabbing and swapping wait for the board */
      if (k === 'a') { if (st !== 'idle') return; if (sel >= 0) sel = -1; else if (free(cur)) { sel = cur; A.beep(600, .03); } else tryS(cur, -1); return; }
      const j = nb(cur, k); if (j < 0) return; if (sel >= 0) { if (st !== 'idle') return; tryS(sel, j); } cur = j; },
    update(dt) { t += dt; idle += dt; shake = Math.max(0, shake - dt); tipT -= dt; let moving = false; const v = (st === 'mix' ? 420 : 170) * dt;
      for (const f of floats) f.t += dt; for (const f of fly) f.t += dt * 2.2; floats = floats.filter(f => f.t < .9); fly = fly.filter(f => f.t < 1);
      for (const c of b) { if (!c) continue;
        if (c.x) { c.x -= Math.sign(c.x) * Math.min(Math.abs(c.x), v); moving = true; }
        if (c.y) { if (st === 'fall') { c.vy += 1100 * dt; c.y = Math.min(0, c.y + c.vy * dt); } else c.y -= Math.sign(c.y) * Math.min(Math.abs(c.y), v); moving = true; } }
      if (moving) return;
      if (st === 'swap') { if (find().length) { moves--; chain = 0; plan(); } else { slide(mv[0], mv[1]); st = 'back'; A.beep(150, .1); } }
      else if (st === 'back' || st === 'mix') { st = 'idle'; idle = 0; }
      else if (st === 'clear' && t > .22) apply();
      else if (st === 'fall') { A.beep(240, .03, 'triangle', .02); plan(); }
      else if (st === 'won' && t > 1.7) { setup(); ready(); }
      else if (st === 'out' && t > 1.2) A.over(); },
    draw(g) { const now = performance.now(), blink = Math.floor(now / 60) % 2, sh = shake > 0 ? Math.round(Math.sin(now / 18) * 2) : 0;
      K.scroll(g, K.T.panel(64, 64, '#2a2458'), 0, 0, 168, 192);
      g.save(); g.translate(sh, 0);
      for (let i = 0; i < N; i++) K.put(g, tile(), px(i), py(i));
      for (let i = 0; i < N; i++) { const c = b[i]; if (!c) continue; let x = px(i) + c.x, y = py(i) + c.y, sc = 0;
        if (y < OY - 14) continue;
        if (i === sel) y += Math.round(Math.sin(now / 90) * 1.5);
        if (st === 'idle' && idle > 5 && hint && hint.includes(i)) { const o = hint[i === hint[0] ? 1 : 0], w = Math.round(Math.abs(Math.sin(now / 160)) * 3); x += Math.sign(px(o) - px(i)) * w; y += Math.sign(py(o) - py(i)) * w; }
        if (kill.has(i) && !c.ice && !make.has(i)) { sc = Math.max(.15, 1 - t / .24); if (t < .07) { K.put(g, K.star2('#ffffff', 20), x, y); continue; } }
        K.put(g, icon(c.v, 20), x, y, sc ? { sc } : (c.sp || make.has(i)) && Math.floor(now / 250) % 2 ? { sc: 1.1 } : null);
        if (c.sp && !sc) K.put(g, c.sp === 3 ? burst() : arrow(c.sp === 1 ? 1 : 0), x, y);
        if (c.ice && !(kill.has(i) && blink)) K.put(g, ice(), x, y); }
      for (const [sp, x, y] of beams) { const col = blink ? '#ffffff' : '#ffe98a'; if (sp === 1) K.box(g, 0, OY + y * T + 8, 168, 8, col); else if (sp === 2) K.box(g, x * T + 8, OY, 8, 168, col); else { const X = x * T - T, Y = OY + y * T - T; K.box(g, X, Y, 72, 3, col); K.box(g, X, Y + 69, 72, 3, col); K.box(g, X, Y, 3, 72, col); K.box(g, X + 69, Y, 3, 72, col); } }
      if (st === 'idle' && sel >= 0) frame(g, sel, '#ffffff');
      if (cur >= 0) frame(g, cur, sel >= 0 ? '#ffffff' : '#ffd23c');
      F.draw(g); g.restore();
      /* top bar: level, what is left to collect, moves */
      K.box(g, 0, 0, 168, OY, '#171428'); K.box(g, 0, OY - 1, 168, 1, '#4a4290');
      A.text(g, 'LEVEL', 3, 3, '#8f8ad0'); A.text(g, level, 3, 10, '#ffffff', 2);
      A.text(g, 'MOVES', 165, 3, '#8f8ad0', 1, 'right'); A.text(g, moves, 165, 10, moves < 4 && blink && st === 'idle' ? '#ff5a4a' : '#ffffff', 2, 'right');
      goals.forEach((o, q) => { K.put(g, icon(o.v, 14), gx(q), 12); if (o.n > 0) A.text(g, o.n, gx(q) + 10, 7, '#ffffff', 2); else A.text(g, 'OK', gx(q) + 10, 7, '#3fd45a', 2); });
      for (const f of fly) { const e = f.t * f.t; K.put(g, icon(f.v, 10), f.x + (gx(f.q) - f.x) * e, f.y + (12 - f.y) * e); }
      for (const f of floats) A.text(g, f.s, f.x, f.y - f.t * 16, f.t > .7 && blink ? '#8f8ad0' : f.c, f.sc, 'center');
      const band = (a, c, s2) => { K.box(g, 0, 88, 168, 40, '#171428'); K.box(g, 0, 88, 168, 2, c); K.box(g, 0, 126, 168, 2, c); A.text(g, a, 84, s2 ? 95 : 102, c, 2, 'center'); if (s2) A.text(g, s2, 84, 113, '#ffffff', 1, 'center'); };
      if (st === 'won') band('LEVEL ' + level + ' CLEAR!', '#ffd23c', 'BONUS +' + bonus);
      else if (st === 'out') band('OUT OF MOVES!', '#ff5a4a');
      else if (tipT > 0 && tip) { K.box(g, 0, 181, 168, 11, '#171428'); A.text(g, tip, 84, 184, '#ffd23c', 1, 'center'); } }
  };
} });
