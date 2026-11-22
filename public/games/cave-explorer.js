/* Cave Explorer v0.4 — eight dark caves: find the key, grab the treasure, reach the door. */
Arcade.game('cave-explorer', { w: 240, h: 240, pad: 'dpad',
help: 'Escape 8 dark caves! Your lamp only shows what is near. Hold an arrow key or the pad to walk (or swipe / tap the cave to keep walking, tap yourself to stop). Find the golden key, then the door. Gems, rubies and the treasure chest give points, and a quick escape gives a bonus. From cave 2 your lamp burns down: grab oil flasks. Glowing eyes in the dark are bats and slimes. Later caves add pop-up spikes and a red bat that hunts you. Hearts give a life back.',
init(A) {
  const K = Art, N = 15, T = 16, LAST = 8, ID = 'cave-explorer:';
  const DIRS = [{ x: 1, y: 0, n: 'right' }, { x: -1, y: 0, n: 'left' }, { x: 0, y: 1, n: 'down' }, { x: 0, y: -1, n: 'up' }];
  const D = { right: DIRS[0], left: DIRS[1], down: DIRS[2], up: DIRS[3] };
  const THEME = ['#6a4e38', '#4a5670', '#4e6a3c', '#62487a'];
  const NEWS = ['FIND THE KEY AND THE DOOR', 'YOUR LAMP BURNS DOWN: GRAB OIL', 'WATCH OUT FOR SPIKES', 'THE RED BAT HUNTS YOU', 'TWO SLIMES ON PATROL', 'MORE RUBIES, MORE BATS', 'NEARLY THERE', 'THE LAST CAVE!'];
  const SH = []; for (let i = 0; i <= 8; i++) SH.push('rgba(4,2,10,' + (i * .087).toFixed(3) + ')');
  const GOLD = ['#ffd23c', '#fff6c8', '#ff9a2a'], bg = K.mkc(240, 240), bq = bg.getContext('2d'), fx = K.fx();
  const ds = new Int16Array(N * N), qu = new Int16Array(N * N);
  let m, seen, pl, foes, items, spikes, key, door, start = { x: 1, y: 1 }, want = null, hold = false, hasKey;
  let lives = 3, lvl = 1, tm = 0, inv = 0, dead = 0, tr = 0, sh = 0, oil = 1, low = false, bonus = 0, gemsN = 0, gemsAll = 0, hintT = 0, grace = 0;
  let msg = '', sub = '', msgT = 0, pops = [];

  /* ---------- sprites (cached by K.spr) ---------- */
  const man = n => K.spr(ID + 'man' + n, 12, 15, q => { K.box(q, -3, 3, 2, 4 - n, '#5a4a6a'); K.box(q, 1, 3, 2, 3 + n, '#5a4a6a'); K.box(q, -4, -2, 8, 6, K.lin(q, -4, 0, 4, 0, '#8ae06a', '#3fb45a', '#1f6a2a')); K.box(q, -4, 1, 8, 1, '#7a4a1e'); K.ell(q, 0, -4, 3.4, 3, '#f0b890'); K.box(q, 0, -5, 1, 1, '#1a1222'); K.box(q, 2, -5, 1, 1, '#1a1222'); K.box(q, -4, -8, 8, 3, '#ffd23c'); K.box(q, -4, -8, 8, 1, '#fff0a0'); K.box(q, 1, -8, 3, 2, '#fff6c8'); });
  const hunter = f => K.spr(ID + 'hunt' + f, 16, 10, q => { const y = f ? -3 : 2; K.mir(q, [2, -1, 8, y, 6, 2, 4, 1, 3, 3], '#d8321e', '#9a1c14'); K.ell(q, 0, 0, 3, 3.4, '#ff6a4a'); K.box(q, -2, -5, 1, 2, '#ff6a4a'); K.box(q, 1, -5, 1, 2, '#ff6a4a'); K.box(q, -2, -1, 1, 1, '#fff6c8'); K.box(q, 1, -1, 1, 1, '#fff6c8'); });
  const doorS = o => K.spr(ID + 'door' + o, 12, 14, q => { K.rr(q, -6, -7, 12, 16, 5, '#8a94a6'); K.rr(q, -5, -6, 10, 15, 4, o ? '#120c1a' : K.lin(q, -5, 0, 5, 0, '#c08a4a', '#9a6a34', '#5a3418'));
    if (o) { K.box(q, -3, 0, 6, 7, '#ffe9a0'); K.box(q, -2, -3, 4, 3, '#ffd23c'); } else { K.box(q, -1, -6, 1, 13, '#5a3418'); K.box(q, -5, -2, 10, 1, '#5c6678'); K.box(q, -2, 0, 4, 4, '#ffd23c'); K.box(q, -1, 1, 2, 2, '#5a3a10'); } });
  const chest = () => K.spr(ID + 'chest', 12, 10, q => { K.rr(q, -6, -5, 12, 6, 3, '#c08a4a'); K.box(q, -6, -1, 12, 6, '#9a6a34'); K.box(q, -6, -1, 12, 1, '#5a3418'); K.box(q, -6, -5, 2, 10, '#ffd23c'); K.box(q, 4, -5, 2, 10, '#ffd23c'); K.box(q, -1, -2, 2, 3, '#fff6c8'); });
  const flask = () => K.spr(ID + 'oil', 8, 11, q => { K.box(q, -1, -5, 2, 3, '#c8d4e0'); K.box(q, -2, -6, 4, 1, '#9a6a34'); K.rr(q, -4, -2, 8, 7, 2, '#ffb43c'); K.box(q, -4, -2, 8, 2, '#c8d4e0'); K.box(q, -3, 0, 1, 3, '#fff6c8'); });
  const spikeS = n => K.spr(ID + 'spk' + n, 12, 10, q => { for (const x of [-4, 0, 4]) K.part(q, [x, n ? -5 : 1, x + 2, 5, x - 2, 5], K.lin(q, x - 2, 0, x + 2, 0, '#ffffff', '#aab4c2', '#4a5462')); });
  const ITEM = { gem: () => K.gem(0, '#5fe3d6', 10), ruby: () => K.gem(4, '#ff4a6a', 11), oil: flask, heart: K.heart, chest };

  /* ---------- helpers ---------- */
  const open = (x, y) => x >= 0 && y >= 0 && x < N && y < N && m[y][x] === 0;
  const lamp = () => 2.2 + 1.9 * oil;
  const info = () => A.info('CAVE ' + lvl + ' OF ' + LAST + '   GEMS ' + (gemsAll - gemsN) + ' OF ' + gemsAll);
  const say = (t, s, d) => { msg = t; sub = s || ''; msgT = d || 2.2; };
  const pop = (x, y, s) => pops.push({ x: x * T + 8, y: y * T + 2, s, t: .9 });
  const score = (n, x, y) => { A.add(n); pop(x, y, '+' + n); };
  function bfs(sx, sy) { ds.fill(99); let h = 0, t = 0; qu[t++] = sy * N + sx; ds[sy * N + sx] = 0;
    while (h < t) { const c = qu[h++], x = c % N, y = (c - x) / N; for (const d of DIRS) { const i = c + d.x + d.y * N; if (open(x + d.x, y + d.y) && ds[i] === 99) { ds[i] = ds[c] + 1; qu[t++] = i; } } } }
  function reveal() { const r = lamp(), r2 = r * r + .3; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if ((x - pl.x) ** 2 + (y - pl.y) ** 2 <= r2) seen[y][x] = 1; }

  /* ---------- level generation ---------- */
  function gen() { m = []; seen = [];
    for (let y = 0; y < N; y++) { m.push(new Array(N).fill(1)); seen.push(new Array(N).fill(0)); }
    const vis = { '0,0': 1 }, st = [[0, 0]]; m[1][1] = 0;
    while (st.length) { const c = st[st.length - 1], nb = DIRS.map(d => [c[0] + d.x, c[1] + d.y, d]).filter(n => n[0] >= 0 && n[1] >= 0 && n[0] < 7 && n[1] < 7 && !vis[n[0] + ',' + n[1]]);
      if (!nb.length) { st.pop(); continue; } const n = nb[A.ri(0, nb.length - 1)]; vis[n[0] + ',' + n[1]] = 1;
      m[1 + 2 * c[1] + n[2].y][1 + 2 * c[0] + n[2].x] = 0; m[1 + 2 * n[1]][1 + 2 * n[0]] = 0; st.push([n[0], n[1]]); }
    /* knock out extra walls so there are loops to dodge around */
    for (let i = 0; i < 11 - lvl / 2; i++) { if (Math.random() < .5) m[1 + 2 * A.ri(0, 6)][2 * A.ri(1, 6)] = 0; else m[2 * A.ri(1, 6)][1 + 2 * A.ri(0, 6)] = 0; }
    bfs(start.x, start.y); const D0 = i => ds[i.y * N + i.x];
    let pool = []; for (let y = 1; y < N; y += 2) for (let x = 1; x < N; x += 2) if (x !== start.x || y !== start.y) pool.push({ x, y, r: Math.random() });
    pool.sort((a, b) => a.r - b.r);
    const take = min => { let i = pool.findIndex(c => D0(c) >= min); if (i < 0) i = 0; return pool.length ? pool.splice(i, 1)[0] : { x: start.x, y: start.y }; };
    const best = f => { let b = 0; pool.forEach((c, i) => { if (f(c) > f(pool[b])) b = i; }); return pool.splice(b, 1)[0]; };
    door = best(c => D0(c) + c.r * 3); key = best(c => Math.min(D0(c), Math.abs(c.x - door.x) + Math.abs(c.y - door.y)) + c.r * 2); hasKey = false;
    const ends = c => DIRS.filter(d => open(c.x + d.x, c.y + d.y)).length === 1 ? D0(c) : -1;
    items = [Object.assign(best(ends), { t: 'chest' })];
    const put = (t, n, min) => { for (let i = 0; i < n; i++) items.push(Object.assign(take(min), { t })); };
    put('gem', 6, 2); if (lvl > 1) { put('ruby', lvl > 5 ? 2 : 1, 6); put('oil', 2, 4); } if (lvl > 2 && lvl % 2) put('heart', 1, 6);
    gemsAll = gemsN = items.filter(i => i.t === 'gem' || i.t === 'ruby').length;
    foes = []; const foe = (t, n, sp) => { for (let i = 0; i < n; i++) foes.push(Object.assign(take(8), { t, sp, dx: 0, dy: 0, p: 0 })); };
    foe('bat', 1 + (lvl >> 1), 2 + lvl * .15); if (lvl > 1) foe('slime', lvl > 4 ? 2 : 1, 1.5); if (lvl > 3) foe('hunt', lvl >= LAST ? 2 : 1, 2.3 + lvl * .1);
    spikes = []; const sp = []; for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) if ((x + y) % 2 && open(x, y) && ds[y * N + x] > 3) sp.push({ x, y, o: A.rnd(0, 2.6) });
    for (let i = Math.min(6, lvl - 2); i > 0 && sp.length; i--) spikes.push(sp.splice(A.ri(0, sp.length - 1), 1)[0]);
    pl = { x: start.x, y: start.y, dx: 0, dy: 0, p: 0, d: null, f: 1 }; want = null; hold = false; oil = 1; low = false; bonus = 300; pops = []; grace = 1.4;
    paint(); reveal(); info(); say('CAVE ' + lvl, NEWS[lvl - 1]); }

  /* the cave itself is painted once per level */
  function paint() { const c = THEME[(lvl - 1) % 4], wl = K.T.stone(64, 64, c), fl = K.T.stone(64, 64, K.dark(c, .52)), hi = K.lite(c, .3), lo = K.dark(c, .62), W = (x, y) => !open(x, y);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const X = x * T, Y = y * T, r = Math.random();
      if (m[y][x]) { bq.drawImage(wl, X % 64, Y % 64, T, T, X, Y, T, T);
        if (r < .1) { K.box(bq, X + 5, Y + 4, 2, 4, '#5fe3d6'); K.box(bq, X + 5, Y + 4, 1, 2, '#d8fff8'); K.box(bq, X + 8, Y + 6, 2, 3, '#3aa89e'); }
        if (!W(x, y - 1)) K.box(bq, X, Y, T, 2, hi); if (!W(x, y + 1)) { K.box(bq, X, Y + 11, T, 5, lo); K.box(bq, X, Y + 10, T, 1, K.dark(c, .8)); }
        if (!W(x - 1, y)) K.box(bq, X, Y, 1, T, hi); if (!W(x + 1, y)) K.box(bq, X + 15, Y, 1, T, lo); }
      else { bq.drawImage(fl, X % 64, Y % 64, T, T, X, Y, T, T); if (W(x, y - 1)) K.box(bq, X, Y, T, 3, 'rgba(0,0,0,.4)');
        if (r < .14) { K.box(bq, X + 4, Y + 10, 2, 1, hi); K.box(bq, X + 10, Y + 6, 1, 1, hi); }
        else if (r < .2) { K.box(bq, X + 9, Y + 9, 4, 2, '#e8504a'); K.box(bq, X + 10, Y + 8, 2, 1, '#ff8a7a'); K.box(bq, X + 10, Y + 11, 2, 2, '#f0e0c8'); } } }
    for (const s of spikes) for (const x of [-4, 0, 4]) K.box(bq, s.x * T + 7 + x, s.y * T + 11, 2, 2, '#0e0a14'); }

  /* ---------- rules ---------- */
  function hurt() { if (inv > 0 || dead > 0) return; lives--; inv = 2; sh = .3; A.beep(150, .35, 'sawtooth'); fx.spark((pl.x + pl.dx * pl.p) * T + 8, (pl.y + pl.dy * pl.p) * T + 8, ['#ff4060', '#ffffff'], 12, 70);
    if (lives <= 0) { dead = 1.1; say('OH NO!', 'THE CAVE WINS THIS TIME', 3); } }
  function clear() { const b = Math.ceil(bonus / 10) * 10, all = gemsN === 0, win = lvl >= LAST; A.add(200 + b + (all ? 100 : 0) + (win ? 500 + lives * 200 : 0)); tr = win ? 2.6 : 1.9;
    say(win ? 'YOU ESCAPED!' : 'CAVE CLEAR!', 'SPEED BONUS +' + b + (all ? '   ALL GEMS +100' : '') + (win ? '   LIVES +' + lives * 200 : ''), 9);
    fx.spark(door.x * T + 8, door.y * T + 8, GOLD, 24, 90); [660, 880, 1100].forEach((f, i) => A.beep(f, .12 + i * .08, 'triangle')); }
  /* the explorer has just stepped onto a new tile; returns true when the cave is finished */
  function arrive() { const x = pl.x, y = pl.y, at = o => o && o.x === x && o.y === y; bfs(x, y); reveal();
    if (at(key)) { key = null; hasKey = true; score(50, x, y); A.beep(900, .15, 'triangle'); fx.spark(x * T + 8, y * T + 8, GOLD, 12, 60); say('GOT THE KEY!', 'NOW FIND THE DOOR', 1.3); }
    items = items.filter(q => { if (!at(q)) return true; const X = x * T + 8, Y = y * T + 8;
      if (q.t === 'gem' || q.t === 'ruby') { gemsN--; score(q.t === 'gem' ? 20 : 50, x, y); A.beep(q.t === 'gem' ? 1100 : 1400, .06, 'triangle'); fx.spark(X, Y, q.t === 'gem' ? ['#5fe3d6', '#ffffff'] : ['#ff4a6a', '#ffffff'], 8, 50); info(); }
      else if (q.t === 'oil') { oil = 1; low = false; reveal(); pop(x, y, 'OIL'); A.beep(520, .2, 'sine', .07); fx.spark(X, Y, GOLD, 10, 50); }
      else if (q.t === 'heart') { if (lives < 5) { lives++; pop(x, y, '+1 LIFE'); } else score(100, x, y); A.beep(700, .1, 'triangle'); A.beep(1050, .2, 'triangle'); fx.spark(X, Y, ['#ff8a9a', '#ffffff'], 10, 50); }
      else { score(150, x, y); [800, 1000, 1300].forEach((f, i) => A.beep(f, .08 + i * .05, 'square', .03)); fx.spark(X, Y, GOLD, 22, 80); }
      return false; });
    if (at(door)) { if (hasKey) { clear(); return true; } if (hintT <= 0) { hintT = 2; say('LOCKED!', 'FIND THE GOLDEN KEY FIRST', 1.4); A.beep(200, .12, 'square'); } }
    return false; }
  function steerP() { if (want && open(pl.x + want.x, pl.y + want.y)) { pl.dx = want.x; pl.dy = want.y; pl.d = want; if (want.x) pl.f = want.x; }
    else if (!((pl.dx || pl.dy) && open(pl.x + pl.dx, pl.y + pl.dy) && (!hold || A.keys[pl.d.n]))) pl.dx = pl.dy = 0; }
  function steerF(e) { const ok = DIRS.filter(d => open(e.x + d.x, e.y + d.y)), fwd = ok.filter(d => !(d.x === -e.dx && d.y === -e.dy)), here = ds[e.y * N + e.x]; let d;
    if (e.t === 'slime' && (e.dx || e.dy) && open(e.x + e.dx, e.y + e.dy)) return;
    if (e.t === 'hunt' && here < 7 && Math.random() < .8) d = ok.find(o => ds[(e.y + o.y) * N + e.x + o.x] < here);
    if (!d) { const o = fwd.length && (e.dx || e.dy) ? fwd : ok; d = o[A.ri(0, o.length - 1)]; }
    if (d) { e.dx = d.x; e.dy = d.y; } }
  function move(e, sp, dt, steer, arr) { if (!e.dx && !e.dy) { steer(e); if (!e.dx && !e.dy) return; } e.p += sp * dt;
    while (e.p >= 1) { e.p -= 1; e.x += e.dx; e.y += e.dy; if (arr && arr()) { e.p = 0; e.dx = e.dy = 0; return; } steer(e); if (!e.dx && !e.dy) { e.p = 0; break; } } }
  const go = (d, h) => { want = d; hold = h; if ((pl.dx || pl.dy) && pl.dx === -d.x && pl.dy === -d.y) { pl.x += pl.dx; pl.y += pl.dy; pl.p = 1 - pl.p; pl.dx = d.x; pl.dy = d.y; pl.d = d; if (d.x) pl.f = d.x; } };

  gen();
  return {
    /* keyboard and pad: walk while held. A swipe (no key held) keeps walking until a wall. */
    key(k) { if (k === 'a') { want = null; hold = true; return; } if (D[k] && tr <= 0 && dead <= 0) go(D[k], !!A.keys[k]); },
    tap(x, y) { if (tr > 0 || dead > 0) return; const dx = x - (pl.x + pl.dx * pl.p) * T - 8, dy = y - (pl.y + pl.dy * pl.p) * T - 8;
      if (Math.hypot(dx, dy) < 11) { want = null; hold = true; } else go(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? D.right : D.left) : (dy > 0 ? D.down : D.up), false); },
    update(dt) { tm += dt; msgT -= dt; hintT -= dt; if (sh > 0) sh -= dt;
      for (const p of pops) { p.t -= dt; p.y -= dt * 14; } if (pops.length && pops[0].t <= 0) pops.shift();
      if (dead > 0) { dead -= dt; if (dead <= 0) A.over(); return; }
      if (tr > 0) { tr -= dt; if (tr <= 0) { if (lvl >= LAST) A.over(true); else { lvl++; start = { x: door.x, y: door.y }; gen(); } } return; }
      if (inv > 0) inv -= dt; if (grace > 0) grace -= dt; /* foes wait a moment at the start of a cave */
      if (!want || (hold && !A.keys[want.n])) { const d = DIRS.find(d => A.keys[d.n]); if (d) { want = d; hold = true; } else if (hold) want = null; } /* also picks up a key held through a cave change */
      const was = pl.dx || pl.dy; move(pl, 5.5, dt, steerP, arrive); if (tr > 0) return;
      if (was && !pl.dx && !pl.dy && want && !open(pl.x + want.x, pl.y + want.y)) A.beep(120, .04, 'square', .02);
      if ((pl.dx || pl.dy) && Math.random() < dt * 9) fx.puff((pl.x + pl.dx * pl.p) * T + 8, (pl.y + pl.dy * pl.p) * T + 14, '#8a7a6a', -6);
      bonus = Math.max(0, bonus - dt * 4);
      if (lvl > 1) { oil = Math.max(0, oil - dt / (50 - lvl * 3)); if (oil < .25 && !low) { low = true; say('LAMP IS LOW', 'FIND AN OIL FLASK', 1.3); A.beep(300, .2, 'square'); } }
      const px = pl.x + pl.dx * pl.p, py = pl.y + pl.dy * pl.p;
      for (const b of foes) { if (grace <= 0) move(b, b.sp, dt, steerF); const dx = b.x + b.dx * b.p - px, dy = b.y + b.dy * b.p - py; if (dx * dx + dy * dy < .4) hurt(); }
      for (const s of spikes) { const ph = (tm + s.o) % 2.6, was = s.up; s.up = ph > 2 ? 2 : ph > 1.5 ? 1 : 0;
        if (s.up === 2 && was !== 2 && seen[s.y][s.x] && Math.hypot(s.x - px, s.y - py) < lamp()) A.beep(1500, .03, 'square', .02);
        if (s.up === 2 && Math.abs(s.x - px) + Math.abs(s.y - py) < .55) hurt(); } },
    draw(g) { const px = pl.x + pl.dx * pl.p, py = pl.y + pl.dy * pl.p, f = Math.floor(tm * 8) % 2, R = lamp() + Math.sin(tm * 11) * .05, C = (o, dy) => [o.x * T + 8, o.y * T + 8 + (dy || 0)];
      K.box(g, 0, 0, 240, 240, '#000000'); g.save(); if (sh > 0) g.translate(A.ri(-2, 2), A.ri(-2, 2)); g.drawImage(bg, 0, 0);
      for (const s of spikes) if (s.up && seen[s.y][s.x]) K.put(g, spikeS(s.up - 1), ...C(s, s.up > 1 ? -1 : 2));
      if (seen[door.y][door.x]) K.put(g, doorS(hasKey ? 1 : 0), ...C(door));
      if (key && seen[key.y][key.x]) K.put(g, K.key(), ...C(key, f));
      for (const q of items) if (seen[q.y][q.x]) K.put(g, ITEM[q.t](), ...C(q, q.t === 'chest' ? 1 : Math.floor(tm * 3 + q.x) % 2));
      for (const b of foes) { const x = b.x + b.dx * b.p, y = b.y + b.dy * b.p, d = Math.hypot(x - px, y - py), X = Math.round(x * T) + 8, Y = Math.round(y * T) + 7; b.lit = d < R - .2;
        if (b.lit) K.put(g, b.t === 'bat' ? K.bat(f) : b.t === 'hunt' ? hunter(f) : K.slime('#5fd45a', Math.floor(tm * 4) % 2), X, Y + (b.t === 'slime' ? 2 : 0), b.dx < 0 ? { flip: 1 } : null); }
      if (inv <= 0 || Math.floor(tm * 14) % 2) K.put(g, man(pl.dx || pl.dy ? f : 0), px * T + 8, py * T + 7, pl.f < 0 ? { flip: 1 } : null);
      fx.draw(g);
      /* darkness: unseen tiles are black, seen ones fade with distance from the lamp (8px steps keep it crisp) */
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (!seen[y][x]) { K.box(g, x * T, y * T, T, T, '#000000'); continue; }
        for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const a = Math.min(8, Math.floor((Math.hypot(x + i * .5 - .25 - px, y + j * .5 - .25 - py) - R + 1.7) * 3.2)); if (a > 0) K.box(g, x * T + i * 8, y * T + j * 8, 8, 8, SH[a]); } }
      /* eyes glowing in the dark give a fair warning */
      for (const b of foes) if (!b.lit) { const x = b.x + b.dx * b.p, y = b.y + b.dy * b.p; if (Math.hypot(x - px, y - py) < R + 4 && Math.floor(tm * 2 + b.sp * 7) % 5) { const X = Math.round(x * T) + 6, Y = Math.round(y * T) + 6, c = b.t === 'slime' ? '#9aff6a' : b.t === 'hunt' ? '#ffb43c' : '#ff4060'; K.box(g, X, Y, 1, 1, c); K.box(g, X + 3, Y, 1, 1, c); } }
      if (hasKey && seen[door.y][door.x] && f) K.box(g, door.x * T + A.ri(3, 12), door.y * T + A.ri(2, 12), 1, 1, '#fff6c8');
      for (const p of pops) A.text(g, p.s, p.x, p.y, p.t > .3 || f ? '#fff6c8' : '#ffb43c', 1, 'center');
      g.restore();
      /* HUD along the top wall */
      K.box(g, 0, 0, 240, 15, 'rgba(8,6,16,.8)'); K.box(g, 0, 15, 240, 1, '#140e1c');
      for (let i = 0; i < lives; i++) K.put(g, K.heart(), 9 + i * 13, 8); if (hasKey) K.put(g, K.key(), 82, 8);
      if (lvl > 1) { K.put(g, flask(), 100, 7); K.box(g, 107, 4, 44, 7, '#140e1c'); K.box(g, 108, 5, 42, 5, '#3a2c40'); K.box(g, 108, 5, Math.ceil(42 * oil), 5, oil < .25 ? (f ? '#ff4060' : '#ffb43c') : '#ffb43c'); K.box(g, 108, 5, Math.ceil(42 * oil), 1, '#fff0a0'); }
      A.text(g, 'BONUS', 198, 5, '#9aa4b6', 1, 'right'); A.text(g, Math.ceil(bonus / 10) * 10, 236, 3, bonus > 0 ? '#ffd23c' : '#6a6478', 2, 'right');
      if (msgT > 0) { const w = Math.max(msg.length * 12, sub.length * 4) + 14, x = 120 - (w >> 1), y = py > 7.5 ? 44 : 150; K.box(g, x - 1, y - 1, w + 2, sub ? 40 : 29, '#ffd23c'); K.box(g, x, y, w, sub ? 38 : 27, '#140e1c'); A.text(g, msg, 120, y + 7, '#ffd23c', 3, 'center'); if (sub) A.text(g, sub, 120, y + 27, '#fff6c8', 1, 'center'); } }
  };
} });
