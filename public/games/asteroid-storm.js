/* Asteroid Storm v0.4 — waves of splitting rocks, crystal power-ups, scout bots, mega rocks and score combos */
Arcade.game('asteroid-storm', { w: 240, h: 320, pad: 'dpad', a: 'FIRE',
help: 'Clear every rock to finish a wave. Left and right turn the ship, up fires the engine, down brakes, Space or FIRE shoots (hold it to keep firing). You can also hold a finger or the mouse on the screen: the ship turns that way and shoots, and if you hold it on empty space the ship flies there. Big rocks split into smaller ones and the screen wraps around. Blue crystal rocks drop power-ups: a shield bubble, a triple shot or an extra life. From wave 3 scout bots fly by and shoot slow pink bolts, and every 5th wave brings a tough mega rock. Hit rocks quickly in a row to build a combo of up to x5 points. A new ship is awarded every 10000 points.',
init(A) {
  const K = Art, W = 240, H = 320, TAU = Math.PI * 2, ID = 'asteroid-storm-', F = K.fx();
  const RAD = [0, 6, 11, 18, 27], PTS = [0, 50, 20, 10, 100], CRY = '#3f9ae0', MID = { x: W / 2, y: H / 2 };
  const wrap = o => { o.x = (o.x % W + W) % W; o.y = (o.y % H + H) % H; };
  /* squared distance on the wrap-around playfield */
  const d2 = (a, b) => { let dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y); if (dx > W / 2) dx = W - dx; if (dy > H / 2) dy = H - dy; return dx * dx + dy * dy; };
  let s, rocks = [], shots = [], bolts = [], bots = [], picks = [], pops = [];
  let lives = 3, lvl = 0, cd = 0, inv = 0, dead = 0, shield = 0, triple = 0, chain = 0, chainT = 0, mult = 1;
  let shake = 0, banner = 0, bTxt = '', bSub = '', clearT = 0, botT = 0, thrT = 0, ptT = 0, thrust = 0, nextLife = 10000, waitT = 0, bgx = 0, bgy = 0, t = 0;

  /* ---- sprites (cached by K.spr) ---- */
  const sBot = f => K.spr(ID + 'bot' + f, 18, 14, g => {
    K.box(g, 0, -7, 1, 3, '#aab4c2'); K.box(g, -1, -7, 3, 1, f ? '#ff4fd8' : '#ffd23c');
    K.ell(g, 0, -1, 5, 4, K.lin(g, 0, -5, 0, 2, '#d8fff8', '#2fc4ba', '#0e6a72'));
    K.ell(g, 0, 2, 9, 3.4, K.lin(g, 0, -1, 0, 5, '#f2f5f8', '#8a94a8', '#3a4152'));
    for (const x of [-6, -2, 2, 6]) K.box(g, x - 1, 2, 2, 1, f ? '#ff4fd8' : '#ffd23c');
    K.box(g, -1, -2, 3, 2, f ? '#ff4fd8' : '#1b2a44'); });
  const sPick = k => K.spr(ID + 'pick' + k, 13, 13, g => { const c = ['#3f9ae0', '#ff8a1e', '#e8231e'][k];
    K.ell(g, 0, 0, 6.4, 6.4, K.rad(g, -2, -2, .5, 8, K.lite(c, .55), c, K.dark(c, .55))); K.ell(g, 0, 0, 4.4, 4.4, '#141428');
    if (k === 0) { K.ell(g, 0, 0, 3, 3, '#7fd8ff'); K.ell(g, 0, 0, 1.6, 1.6, '#141428'); }
    else if (k === 1) for (const x of [-3, 0, 3]) K.box(g, x - 1, x ? -1 : -3, 2, 4, '#ffd23c');
    else { K.box(g, -3, -2, 2, 3, '#ff6a6a'); K.box(g, 1, -2, 2, 3, '#ff6a6a'); K.box(g, -2, -1, 4, 3, '#ff6a6a'); K.box(g, -1, 2, 2, 1, '#ff6a6a'); } });
  const sBubble = f => K.spr(ID + 'bub' + f, 30, 30, g => { g.lineWidth = 2; g.strokeStyle = f ? '#c8f4ff' : '#5fc8ff'; g.beginPath(); g.arc(0, 0, 13, 0, TAU); g.stroke(); K.box(g, -8, -10, 3, 2, '#ffffff'); }, { ol: 0 });
  const sLife = () => K.spr(ID + 'life', 7, 8, g => { K.part(g, K.sym([0, -4, 3.5, 4, 0, 2]), K.lin(g, -3, 0, 3, 0, '#ffffff', '#b4bfcc', '#69758a')); K.box(g, -1, 1, 2, 2, '#ff8a2a'); });
  const sBolt = f => K.ball(3, f ? '#ff4fd8' : '#ff9ae8');

  /* ---- helpers ---- */
  const info = () => A.info('WAVE ' + lvl);
  const say = (a, b, d) => { bTxt = a; bSub = b || ''; banner = d || 2; };
  const pop = (x, y, txt, c) => { const hw = String(txt).length * 3 + 2; pops.push({ x: Math.max(hw, Math.min(W - hw, x)), y: Math.max(8, Math.min(H - 8, y)), txt, c: c || '#fff6c8', l: .9 }); }; /* kept on screen */
  const score = (n, x, y) => { n *= mult; A.add(n); pop(x, y, n);
    if (A.score >= nextLife) { nextLife += 10000; if (lives < 5) { lives++; say('EXTRA SHIP!', '', 1.4); [660, 880, 1100].forEach((f, i) => A.beep(f, .1 + i * .05, 'triangle', .05)); } } };
  function mkRock(x, y, sz, kind, pv) {
    const a = A.rnd(0, TAU), v = (A.rnd(14, 30) + (3 - sz) * 12 + Math.min(lvl, 12) * 2.2) * (sz === 4 ? .5 : 1);
    rocks.push({ x, y, sz, kind: kind || 0, r: RAD[sz], hp: sz === 4 ? 5 : kind ? 2 : 1, v: A.ri(0, 2), rot: A.rnd(0, TAU), vr: A.rnd(-1, 1),
      vx: Math.cos(a) * v + (pv ? pv.vx * .3 : 0), vy: Math.sin(a) * v + (pv ? pv.vy * .3 : 0) }); }
  function edge() { let p, n = 0; do { p = Math.random() < .5 ? { x: A.rnd(0, W), y: A.rnd(-8, 8) } : { x: A.rnd(-8, 8), y: A.rnd(0, H) }; wrap(p); } while (d2(p, s) < 95 * 95 && ++n < 40); return p; }
  function wave() { lvl++; const mega = lvl % 5 === 0, n = Math.min(6, 1 + Math.ceil(lvl / 2)) - (mega ? 2 : 0);
    for (let i = 0; i < n; i++) { const p = edge(); mkRock(p.x, p.y, 3); }
    if (mega) { const p = edge(); mkRock(p.x, p.y, 4); }
    if (lvl > 1) for (let i = 0; i < (lvl > 6 ? 2 : 1); i++) { const p = edge(); mkRock(p.x, p.y, 2, 1); }
    botT = lvl > 2 ? A.rnd(5, 9) : 1e9; clearT = 0;
    say('WAVE ' + lvl, mega ? 'MEGA ROCK!' : lvl === 1 ? 'CLEAR ALL THE ROCKS' : lvl === 2 ? 'BLUE CRYSTALS DROP POWER-UPS' : lvl === 3 ? 'WATCH OUT FOR SCOUT BOTS' : ''); info(); }
  function drop(x, y) { const k = lives < 3 && Math.random() < .3 ? 2 : !shield && Math.random() < .6 ? 0 : 1; picks.push({ x, y, k, vx: A.rnd(-10, 10), vy: A.rnd(-10, 10), l: 10 }); }
  function combo() { chain++; chainT = 2.6; const m = Math.min(5, 1 + Math.floor(chain / 4)); if (m !== mult) { mult = m; A.beep(500 + m * 120, .12, 'triangle', .05); } }
  function hitRock(r) {
    if (--r.hp > 0) { F.spark(r.x, r.y, r.kind ? ['#7fd8ff', '#ffffff'] : ['#c4b4a0', '#ffd23c'], 6, 70); A.beep(320, .05, 'square'); return; }
    r.dead = 1; combo(); score(PTS[r.sz] * (r.kind ? 3 : 1), r.x, r.y); shake = Math.max(shake, r.sz > 2 ? .22 : .08);
    F.boom(r.x, r.y, r.sz > 2); F.spark(r.x, r.y, r.kind ? ['#7fd8ff', '#3f9ae0', '#ffffff'] : ['#c4b4a0', '#8a7a6a', '#ffd23c'], 6 + r.sz * 3, 90);
    A.beep(260 - r.sz * 45, .1 + r.sz * .03, 'sawtooth', .05);
    if (r.kind) drop(r.x, r.y);
    if (r.sz > 1) for (let i = 0; i < (r.sz === 4 ? 3 : 2); i++) mkRock(r.x, r.y, r.sz - 1, 0, r); }
  function fire() { if (cd > 0 || dead > 0 || shots.length > (triple > 0 ? 15 : 5)) return; cd = .2;
    for (const o of triple > 0 ? [-.22, 0, .22] : [0]) { const a = s.a + o; shots.push({ x: s.x + Math.cos(a) * 9, y: s.y + Math.sin(a) * 9, vx: Math.cos(a) * 200 + s.vx * .5, vy: Math.sin(a) * 200 + s.vy * .5, l: .85 }); }
    A.beep(triple > 0 ? 1100 : 900, .04); }
  function hurt(o) { if (inv > 0 || dead > 0) return false;
    if (shield) { shield = 0; inv = 1.2; shake = .2; F.spark(s.x, s.y, ['#7fd8ff', '#ffffff', '#5fc8ff'], 16, 110); A.beep(700, .2, 'triangle', .06); A.beep(350, .25, 'triangle', .05); pop(s.x, s.y - 12, 'SHIELD GONE', '#7fd8ff'); return true; }
    lives--; dead = 1.3; triple = 0; chain = 0; mult = 1; shake = .45; bolts = [];
    F.boom(s.x, s.y, 1); F.spark(s.x, s.y, ['#ffd23c', '#ff8a1e', '#ffffff'], 26, 120); A.beep(120, .5, 'sawtooth', .07); A.beep(60, .6, 'square', .05); return true; }
  const reset = () => { s = { x: W / 2, y: H / 2, vx: 0, vy: 0, a: -Math.PI / 2 }; inv = 2.5; };
  reset(); wave();

  return {
    key(k) { if (k === 'a') fire(); }, /* a quick tap on FIRE or Space still shoots */
    update(dt) { t += dt; cd -= dt; inv -= dt; triple -= dt; shake -= dt; banner -= dt; thrT -= dt;
      if ((chainT -= dt) <= 0 && chain) { chain = 0; mult = 1; }
      /* ---- ship ---- */
      if (dead > 0) { dead -= dt; thrust = 0;
        if (dead <= 0) { if (lives <= 0) { dead = 1e9; A.over(); return; }
          if (rocks.some(r => d2(r, MID) < (r.r + 34) ** 2) && (waitT += dt) < 2) dead = .01; /* wait for a clear spot */
          else { dead = waitT = 0; reset(); A.beep(520, .15, 'triangle'); } } }
      else {
        let turn = (A.keys.right ? 1 : 0) - (A.keys.left ? 1 : 0), shoot = A.keys.a, brake = A.keys.down; thrust = A.keys.up ? 1 : 0;
        const p = A.ptrs[0];
        /* finger / mouse held: aim and shoot that way; held on open space (not on a rock) the ship also flies there and slows down near the spot */
        if (p) { ptT += dt; const dx = p.x - s.x, dy = p.y - s.y, far = dx * dx + dy * dy > 50 * 50; let da = Math.atan2(dy, dx) - s.a; da = Math.atan2(Math.sin(da), Math.cos(da));
          if (Math.abs(da) > .06) turn = Math.sign(da) * Math.min(1.7, Math.abs(da) * 6 + .3);
          if (Math.abs(da) < .3) { shoot = 1; if (ptT > .3 && far && !rocks.some(r => d2(r, p) < (r.r + 16) ** 2)) thrust = 1; }
          if (!thrust && !far) brake = 1; } else ptT = 0;
        s.a += turn * 3.8 * dt; if (shoot) fire();
        if (thrust) { s.vx += Math.cos(s.a) * 135 * dt; s.vy += Math.sin(s.a) * 135 * dt; F.puff(s.x - Math.cos(s.a) * 9, s.y - Math.sin(s.a) * 9, Math.random() < .5 ? '#ff8a1e' : '#ffd23c', 0);
          if (thrT <= 0) { thrT = .11; A.beep(70 + A.rnd(0, 20), .09, 'sawtooth', .02); } }
        const dr = brake ? 2.6 : .45, sp = Math.hypot(s.vx, s.vy), mx = 150;
        s.vx *= 1 - dr * dt; s.vy *= 1 - dr * dt; if (sp > mx) { s.vx *= mx / sp; s.vy *= mx / sp; }
        s.x += s.vx * dt; s.y += s.vy * dt; wrap(s); }
      bgx += s.vx * dt * .08 + dt * 2; bgy += s.vy * dt * .08;
      /* ---- shots, rocks ---- */
      for (const b of shots) { b.x += b.vx * dt; b.y += b.vy * dt; b.l -= dt; wrap(b); }
      for (const r of rocks.slice()) { r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.vr * dt; wrap(r);
        for (const b of shots) if (b.l > 0 && d2(b, r) < (r.r + 1) ** 2) { b.l = 0; hitRock(r); break; }
        if (!r.dead && d2(s, r) < (r.r * .9 + 4) ** 2 && hurt(r) && r.sz < 4) { r.hp = 1; hitRock(r); } }
      rocks = rocks.filter(r => !r.dead);
      /* ---- scout bots and their bolts ---- */
      if ((botT -= dt) <= 0 && rocks.length && bots.length < (lvl > 8 ? 2 : 1)) { botT = Math.max(7, 16 - lvl) + A.rnd(0, 5); const d = Math.random() < .5 ? 1 : -1;
        bots.push({ x: d > 0 ? -10 : W + 10, y0: A.rnd(40, H - 40), y: 0, d, ph: A.rnd(0, TAU), hp: lvl > 6 ? 2 : 1, ft: A.rnd(1.6, 2.4) }); A.beep(440, .25, 'triangle', .04); A.beep(330, .3, 'triangle', .04); }
      for (const o of bots) { o.x += o.d * (26 + Math.min(lvl, 10)) * dt; o.ph += dt * 1.6; o.y = o.y0 + Math.sin(o.ph) * 22; o.ft -= dt;
        if (o.x < -14 || o.x > W + 14) o.dead = 1;
        if (o.ft <= 0 && dead <= 0 && o.x > 8 && o.x < W - 8) { o.ft = Math.max(1.5, 3 - lvl * .1); const a = Math.atan2(s.y - o.y, s.x - o.x) + A.rnd(-.18, .18), v = 55 + Math.min(lvl, 12) * 2.5;
          bolts.push({ x: o.x, y: o.y + 4, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 4 }); A.beep(240, .12, 'square', .04); }
        for (const b of shots) if (b.l > 0 && !o.dead && (b.x - o.x) ** 2 + (b.y - o.y) ** 2 < 100) { b.l = 0;
          if (--o.hp > 0) { F.spark(o.x, o.y, ['#ff4fd8', '#ffffff'], 6, 70); A.beep(380, .05); continue; }
          o.dead = 1; combo(); score(150, o.x, o.y); shake = .2; F.boom(o.x, o.y, 1); F.spark(o.x, o.y, ['#5fe3d6', '#ffd23c', '#ffffff'], 14, 100); A.beep(180, .25, 'sawtooth', .06); if (Math.random() < .4) drop(o.x, o.y); }
        if (!o.dead && (s.x - o.x) ** 2 + (s.y - o.y) ** 2 < 13 * 13) hurt(o); }
      bots = bots.filter(o => !o.dead);
      for (const b of bolts) { b.x += b.vx * dt; b.y += b.vy * dt; b.l -= dt; if (b.x < -4 || b.x > W + 4 || b.y < -4 || b.y > H + 4) b.l = 0; else if ((s.x - b.x) ** 2 + (s.y - b.y) ** 2 < 49 && hurt(b)) b.l = 0; }
      shots = shots.filter(b => b.l > 0); bolts = bolts.filter(b => b.l > 0);
      /* ---- power-ups ---- */
      for (const p of picks) { p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; wrap(p);
        if (dead <= 0 && d2(p, s) < 14 * 14) { p.l = 0; A.add(25); [520, 780, 1040].forEach((f, i) => A.beep(f, .08 + i * .04, 'triangle', .05)); F.spark(p.x, p.y, ['#ffffff', '#ffd23c'], 10, 80);
          if (p.k === 0) { shield = 1; pop(p.x, p.y, 'SHIELD', '#7fd8ff'); } else if (p.k === 1) { triple = 10; pop(p.x, p.y, 'TRIPLE SHOT', '#ffb054'); }
          else if (lives < 5) { lives++; pop(p.x, p.y, 'EXTRA SHIP', '#ff8a9a'); } else { A.add(475); pop(p.x, p.y, '+500', '#ff8a9a'); } } }
      picks = picks.filter(p => p.l > 0);
      for (const p of pops) { p.y -= 14 * dt; p.l -= dt; } pops = pops.filter(p => p.l > 0);
      /* ---- wave clear ---- */
      if (!rocks.length && dead <= 0) { if (!clearT) { clearT = 1.8; const n = lvl * 100; A.add(n); say('WAVE CLEAR', '+' + n + ' BONUS', 1.7); [523, 659, 784, 1046].forEach((f, i) => A.beep(f, .12 + i * .06, 'triangle', .05)); }
        else if ((clearT -= dt) <= 0) wave(); } },

    draw(g) { const sx = shake > 0 ? A.ri(-2, 2) : 0, sy = shake > 0 ? A.ri(-2, 2) : 0, now = t * 1000 | 0;
      K.scroll(g, K.T.space(128, 128), bgx - sx, bgy - sy, W, H); g.save(); g.translate(sx, sy);
      /* draw on the wrapped field: copies appear on the far side when something overlaps an edge */
      const put = (k, x, y, r, o) => { for (let ix = -1; ix < 2; ix++) for (let iy = -1; iy < 2; iy++) { const X = x + ix * W, Y = y + iy * H; if (X > -r && X < W + r && Y > -r && Y < H + r) K.put(g, k, X, Y, o); } };
      for (const r of rocks) put(K.rock(r.r, r.v, r.kind ? CRY : r.sz === 4 ? '#9a6a5a' : undefined), r.x, r.y, r.r + 2, { rot: Math.round(r.rot * 4) / 4 });
      for (const r of rocks) if (r.sz === 4) for (let i = 0; i < 5; i++) K.box(g, Math.round(r.x) - 12 + i * 5, Math.round(r.y) - 2, 4, 3, i < r.hp ? '#ffd23c' : '#3a2a30');
      for (const p of picks) if (p.l > 2.5 || (now >> 7) & 1) put(sPick(p.k), p.x, p.y + Math.sin(t * 5 + p.x) * 1.5, 8);
      for (const o of bots) K.put(g, sBot(o.ft < .5 && (now >> 6) & 1 ? 1 : 0), o.x, o.y);
      for (const b of bolts) K.put(g, sBolt((now >> 7) & 1), b.x, b.y);
      for (const b of shots) { const x = Math.round(b.x), y = Math.round(b.y); K.box(g, x - 2, y - 2, 5, 5, triple > 0 ? '#c8501e' : '#1e7ac8'); K.box(g, x - 1, y - 1, 3, 3, triple > 0 ? '#fff6c8' : '#d8f6ff'); }
      if (dead <= 0 && (inv <= 0 || (now >> 7) & 1)) {
        if (thrust) put(K.fire((now >> 6) & 1), s.x - Math.cos(s.a) * 12, s.y - Math.sin(s.a) * 12, 10, { rot: s.a - Math.PI / 2 });
        put(K.ship(1), s.x, s.y, 14, { rot: s.a }); if (shield) put(sBubble((now >> 8) & 1), s.x, s.y, 16); }
      F.draw(g);
      for (const p of pops) A.text(g, p.txt, p.x, p.y, p.c, 1, 'center');
      g.restore();
      /* ---- HUD ---- */
      for (let i = 0; i < lives; i++) K.put(g, sLife(), 8 + i * 9, 9);
      A.text(g, 'WAVE ' + lvl, W - 4, 5, '#c8d4f0', 1, 'right');
      if (mult > 1) { A.text(g, 'COMBO X' + mult, W / 2, 5, '#ffd23c', 1, 'center'); K.box(g, W / 2 - 16, 12, Math.round(32 * Math.max(0, chainT) / 2.6), 1, '#ffd23c'); }
      if (triple > 0) { A.text(g, 'TRIPLE', 4, H - 9, '#ffb054'); K.box(g, 30, H - 8, Math.round(triple * 4), 3, '#ff8a1e'); }
      if (shield) A.text(g, 'SHIELD', W - 4, H - 9, '#7fd8ff', 1, 'right');
      if (banner > 0 && (banner > .4 || (now >> 6) & 1)) { A.text(g, bTxt, W / 2 + 1, 111, '#140e1c', 3, 'center'); A.text(g, bTxt, W / 2, 110, '#fff6c8', 3, 'center');
        if (bSub) { A.text(g, bSub, W / 2 + 1, 133, '#140e1c', 1, 'center'); A.text(g, bSub, W / 2, 132, '#5fe3d6', 1, 'center'); } } }
  };
} });
