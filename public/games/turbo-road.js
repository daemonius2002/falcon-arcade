/* Turbo Road: top-down highway racer. Drive through six stages, dodge traffic, grab coins and nitro bolts.
   "dist" is the distance driven in the current stage, "total" the whole run (both in screen pixels). */
Arcade.game('turbo-road', { w: 240, h: 320, pad: 'lr', a: 'BOOST',
help: 'Race your red car through 6 stages to the end of the road! Steer by touch, with the mouse, the arrow keys or the on-screen buttons. Overtake the other cars without bumping into them: you can crash 3 times. Grab coins for points and pass cars closely for CLOSE bonuses. Pick up lightning bolts, then press Space, Up or BOOST (or swipe up) to use one: a turbo boost that smashes through anything! Later stages bring trucks, cars changing lanes (watch their orange blinkers), slippy oil and ice, road works and a night drive. Green spanners give back a lost life.',
init(A) {
  const K = Art, PY = 262, LANES = [60, 100, 140, 180], LV = [.58, .5, .42, .34], LEN = 5200, TAU = Math.PI * 2;
  /* stages: verge ground, roadside decoration, speed range, hazard spacing, max lanes busy at once, new things, card hint */
  const ST = [
    { n: 'SUNNY MEADOW', g: 'grass', d: 'tree', v0: 150, v1: 195, gap: [100, 150], mb: 2, has: '', hint: 'OVERTAKE THE CARS' },
    { n: 'COIN VALLEY', g: 'grass', d: 'tree', v0: 160, v1: 210, gap: [90, 140], mb: 2, has: 'coin bolt turn', hint: 'GRAB COINS AND BOLTS' },
    { n: 'DESERT DASH', g: 'sand', d: 'cactus', v0: 172, v1: 225, gap: [80, 130], mb: 3, has: 'coin bolt truck oil turn fix', hint: 'TRUCKS AND OIL AHEAD' },
    { n: 'ROAD WORKS', g: 'grass', d: 'tree', v0: 182, v1: 240, gap: [76, 122], mb: 3, has: 'coin bolt truck oil turn fix cones', hint: 'WATCH OUT FOR CONES' },
    { n: 'SNOWY PASS', g: 'snow', d: 'pine', v0: 192, v1: 252, gap: [72, 116], mb: 3, has: 'coin bolt truck ice turn fix cones', hint: 'SLIPPY ICE PATCHES' },
    { n: 'NIGHT RUSH', g: 'grass', d: 'lamp', v0: 200, v1: 265, gap: [68, 110], mb: 3, has: 'coin bolt truck oil turn fix cones', hint: 'FOLLOW YOUR LIGHTS', night: 1 }];
  const CC = ['#3fa8e0', '#ffd23c', '#f2f5f8', '#b06ae0', '#3fd45a', '#ff9a2a'];

  /* ---- sprites (all cached by K.spr / K.tex) ---- */
  const player = () => K.spr('turbo-road-player', 16, 26, g => {
    for (const [x, y, h] of [[-8, -10, 6], [5, -10, 6], [-8, 3, 7], [5, 3, 7]]) K.box(g, x, y, 3, h, '#1a1222');
    K.part(g, K.sym([0, -13, 3, -13, 5, -10, 6, -4, 6, 8, 7, 10, 7, 13]), K.lin(g, -7, 0, 7, 0, '#ff8a7a', '#e8231e', '#7a1410'));
    K.box(g, -2, -13, 1, 23, '#f2f5f8'); K.box(g, 1, -13, 1, 23, '#f2f5f8');
    K.part(g, K.sym([0, -5, 4, -5, 5, 0, 4, 1]), '#1b2a44'); K.box(g, -3, -4, 2, 1, '#7fc0f0');
    K.box(g, -4, 2, 8, 4, '#c81e18'); K.box(g, -3, 6, 6, 2, '#1b2a44');
    K.box(g, -7, 10, 14, 3, '#2a2030'); K.box(g, -7, 10, 14, 1, '#69758a');
    K.box(g, -5, -13, 2, 1, '#fff6c8'); K.box(g, 3, -13, 2, 1, '#fff6c8'); });
  const truck = c => K.spr('turbo-road-truck' + c, 16, 44, g => {
    for (const y of [-17, 4, 13]) { K.box(g, -8, y, 2, 6, '#1a1222'); K.box(g, 6, y, 2, 6, '#1a1222'); }
    K.rr(g, -7, -22, 14, 13, 3, K.lin(g, -7, 0, 7, 0, K.lite(c, .45), c, K.dark(c, .4))); K.box(g, -5, -18, 10, 3, '#1b2a44'); K.box(g, -5, -18, 3, 1, '#7fc0f0');
    K.box(g, -5, -22, 2, 1, '#fff6c8'); K.box(g, 3, -22, 2, 1, '#fff6c8');
    K.box(g, -7, -8, 14, 30, K.lin(g, -7, 0, 7, 0, '#ffffff', '#c8ccd8', '#7a8094')); for (let y = -5; y < 20; y += 5) K.box(g, -6, y, 12, 1, '#a0a6b8');
    K.box(g, -7, 4, 14, 3, c); K.box(g, -6, 20, 3, 2, '#ff4060'); K.box(g, 3, 20, 3, 2, '#ff4060'); });
  const cone = () => K.spr('turbo-road-cone', 8, 10, g => { K.part(g, [0, -5, 3, 4, -3, 4], K.lin(g, -3, 0, 3, 0, '#ffc07a', '#ff8a1e', '#c8501e')); K.box(g, -2, -1, 4, 2, '#ffffff'); K.box(g, -4, 4, 8, 1, '#5a3418'); });
  const barrier = () => K.spr('turbo-road-barrier', 32, 8, g => { K.box(g, -16, -3, 32, 6, '#f2f5f8'); for (let x = -16; x < 16; x += 8) K.part(g, [x, 3, x + 4, -3, x + 8, -3, x + 4, 3], '#e8231e'); K.box(g, -16, -3, 32, 1, '#ffffff'); });
  const slick = ice => K.spr('turbo-road-slick' + ice, 26, 18, g => { g.scale(1, .64); K.org(g, 0, 0, 12, ice ? 3 : 8, 9); g.fillStyle = ice ? '#9fd6f5' : '#14101c'; g.fill(); K.org(g, -1, -1, 7, ice ? 4 : 9, 8); g.fillStyle = ice ? '#d8f2ff' : '#2a2438'; g.fill();
    K.box(g, -6, -5, 4, 2, ice ? '#ffffff' : '#6a5a8a'); K.box(g, 3, 2, 2, 2, ice ? '#ffffff' : '#3f8a8a'); }, { ol: ice ? [90, 150, 200] : [120, 110, 150] });
  const bolt = n => K.spr('turbo-road-bolt' + n, n, n, g => { const s = n / 14; g.scale(s, s); K.ell(g, 0, 0, 7, 7, K.lin(g, -7, -7, 7, 7, '#7fc0f0', '#1b6fb0', '#0e3a6a'));
    K.part(g, [2, -6, -4, 1, 0, 1, -2, 6, 4, -1, 0, -1], '#ffd23c'); K.box(g, 0, -4, 1, 1, '#fff6c8'); });
  const spanner = () => K.spr('turbo-road-fix', 14, 14, g => { K.ell(g, 0, 0, 7, 7, K.lin(g, -7, -7, 7, 7, '#8ae06a', '#2f9a3a', '#145a20')); g.rotate(.8);
    K.box(g, -1, -4, 2, 8, '#f2f5f8'); K.box(g, -3, -6, 6, 3, '#f2f5f8'); K.box(g, -1, -6, 2, 2, '#2f9a3a'); K.box(g, -3, 3, 6, 3, '#f2f5f8'); });
  const hud = k => K.spr('turbo-road-h' + k, 9, 9, g => { if (k === 'h') { K.ell(g, -2, -1, 2.4, 2.4, '#e8231e'); K.ell(g, 2, -1, 2.4, 2.4, '#e8231e'); K.part(g, [-4.4, 0, 4.4, 0, 0, 4.4], '#e8231e'); K.box(g, -3, -3, 1, 1, '#ffb0a0'); }
    else K.part(g, [1, -4.5, -3, .5, 0, .5, -1, 4.5, 3, -.5, 0, -.5], '#ffd23c'); });
  const cactus = () => K.spr('turbo-road-cactus', 12, 18, g => { const c = K.lin(g, -2, 0, 2, 0, '#8ae06a', '#3f9a3a', '#1f5a28'); K.rr(g, -2, -9, 5, 18, 2, c); K.rr(g, -6, -4, 3, 6, 1, c); K.box(g, -5, 1, 4, 2, '#3f9a3a'); K.rr(g, 4, -6, 3, 6, 1, c); K.box(g, 2, -1, 3, 2, '#3f9a3a'); K.box(g, 0, -9, 1, 1, '#ffb0d0'); });
  const pine = () => K.spr('turbo-road-pine', 18, 22, g => { K.box(g, -1, 8, 3, 3, '#5a3418'); for (const [y, w] of [[-11, 4], [-6, 6], [-1, 8]]) { K.part(g, [0, y, w, y + 9, -w, y + 9], '#1f5a3a'); K.part(g, [0, y, w * .6, y + 4, -w * .6, y + 4], '#ffffff'); } });
  const lamp = () => K.spr('turbo-road-lamp', 8, 6, g => { K.rr(g, -4, -3, 8, 6, 2, '#5c6678'); K.box(g, -3, -1, 6, 3, '#fff6c8'); });
  const ground = n => n === 'grass' ? K.T.grass(64, 64) : K.tex('turbo-road-' + n, 64, 64, n === 'sand'
    ? { base: '#dcb474', tile: 1, blobs: [['#ecc88a', .55, 12, 14, 40], ['#b88a50', .45, 10, 14, 36]], specks: [['#f6dca8', 60, 2, 1], ['#a07040', 40]] }
    : { base: '#e4eef8', tile: 1, blobs: [['#ffffff', .7, 14, 14, 40], ['#b8cce4', .5, 10, 14, 40]], specks: [['#ffffff', 60, 2, 1], ['#a0b8d6', 40]] });
  const deco = (d, i) => d === 'tree' ? K.tree(i % 3 ? 11 : 8, i % 4) : d === 'cactus' ? (i % 3 ? cactus() : K.rock(6, i % 3, '#b0784a')) : d === 'pine' ? pine() : lamp();

  /* night: one cached dithered darkness mask with a headlight cone, 480 wide so it can slide with the car */
  const nightMask = () => { if (nightMask.k) return nightMask.k; const w = 480, h = 320, k = K.mkc(w, h), g = k.getContext('2d'), im = g.createImageData(w, h), d = im.data, B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let y = 0, j = 0; y < h; y++) for (let x = 0; x < w; x++, j += 4) { const dx = x - 240, dy = PY - 8 - y; let L = 0;
      if (dy > 0 && dy < 250) { const hw = 12 + dy * .45, ax = Math.abs(dx); if (ax < hw) L = (1 - dy / 250) * (1 - (ax / hw) ** 2) * 1.6; }
      const r = Math.hypot(dx, (y - PY) * 1.3); if (r < 42) L = Math.max(L, 1 - r / 42);
      const q = Math.max(0, Math.min(3, Math.round((1 - Math.min(1, L)) * 3 + (B[(y & 3) * 4 + (x & 3)] / 16 - .5) * .9)));
      d[j] = 6; d[j + 1] = 8; d[j + 2] = 28; d[j + 3] = q * 52; }
    g.putImageData(im, 0, 0); return (nightMask.k = k); };

  /* ---- state ---- */
  let x = 100, tx = null, sp = 150, dist = 0, total = 0, far = 0, stg = 0, lives = 3, inv = 0, spin = 0, sdir = 1, boost = 0, bolts = 0, shake = 0, card = 2.8, t = 0;
  let objs = [], pops = [], tunes = [], nextHaz = 480, nextItem = 600, nextBolt = 700, nextFix = 1500, oldG = 'grass', combo = 0, comboT = 0;
  const slots = Array.from({ length: 8 }, (_, i) => ({ d: 'tree', c: -1, i }));
  const has = k => ST[stg].has.indexOf(k) >= 0;
  const tune = (notes, step, type) => notes.forEach((f, i) => tunes.push({ t: i * step, f, type: type || 'square' }));
  const pop = (s, px, py, c) => pops.push({ s, x: px, y: py, l: 1, c: c || '#ffd23c' });
  const top = o => o.y - o.h / 2, bot = o => o.y + o.h / 2;
  /* lanes with something dangerous between y0 and y1 (a car changing lanes counts in both) */
  const busy = (y0, y1) => { const s = new Set(); for (const o of objs) if (o.haz && top(o) < y1 && bot(o) > y0) { s.add(o.lane); if (o.from != null) s.add(o.from); } return s; };
  const laneTop = l => { let m = 999; for (const o of objs) if (o.haz && (o.lane === l || o.from === l)) m = Math.min(m, top(o)); return m; };
  const clearAhead = l => objs.every(o => !o.haz || (o.lane !== l && o.from !== l) || bot(o) < -60);
  const add = (k, lane, h, v, ex) => { const o = Object.assign({ k, lane, x: LANES[lane], h, v, hw: 7, haz: k !== 'coin' && k !== 'bolt' && k !== 'fix' }, ex); o.y = -h / 2 - 8; objs.push(o); return o; };

  function spawnHazard() { const S = ST[stg], b = busy(-90, 150);
    let opts = [0, 1, 2, 3].filter(l => laneTop(l) > 46); if (b.size >= S.mb) opts = opts.filter(l => b.has(l)); /* always leave a free lane */
    if (!opts.length) return; const l = opts[A.ri(0, opts.length - 1)], r = Math.random();
    if (has('cones') && r < .13 && laneTop(l) > 330) add('cones', l, 120, 0, { hw: 11 });
    else if ((has('oil') || has('ice')) && r < .25) add('slick', l, 16, 0, { hw: 9, ice: has('ice'), haz: true, slip: 1 });
    else if (has('truck') && r < .5) add('truck', l, 44, LV[l], { hw: 7, c: CC[A.ri(0, 5)] });
    else add('car', l, 24, LV[l], { hw: 6, c: CC[A.ri(0, 5)], turn: has('turn') && Math.random() < .3 ? 1 : 0, ty: A.rnd(20, 120) }); }
  function spawnItem(k) { const free = [0, 1, 2, 3].filter(l => clearAhead(l) && !busy(-140, 40).has(l)); if (!free.length) return false; const l = free[A.ri(0, free.length - 1)];
    if (k === 'coin') { const n = A.ri(3, 5); for (let i = 0; i < n; i++) add('coin', l, 10, 0).y -= i * 22; } else add(k, l, 14, 0); return true; }

  function crash(o) { lives--; inv = 2; shake = .4; sp = ST[stg].v0 * .7; spin = 0; combo = 0; S.F.boom((o.x + x) / 2, PY - 6, 1); S.F.spark(x, PY, ['#ffd23c', '#ff8a1e', '#ffffff'], 14, 90);
    A.beep(120, .4, 'sawtooth', .07); objs = objs.filter(q => !q.haz || q.y < 120 || q.k === 'slick'); pop(lives ? 'OUCH!' : 'CRASH!', x, PY - 30, '#ff6060');
    if (lives <= 0) { A.info('Stage ' + (stg + 1) + '/6'); A.over(); } }
  function nextStage() { const bonus = 100 * (stg + 1); A.add(bonus); tune([523, 659, 784, 1046], .11);
    if (stg === ST.length - 1) { const lb = Math.max(0, lives) * 150; A.add(lb); pop('FINISH! +' + (bonus + lb), 120, 150); A.info('All 6 stages done!'); A.over(true); return; }
    pop('STAGE CLEAR +' + bonus, 120, 200); oldG = ST[stg].g; stg++; dist = 0; card = 2.8; nextHaz = 540; nextItem = Math.max(nextItem, 600); nextBolt = Math.max(nextBolt, 600); nextFix = Math.max(nextFix, 600); } /* a calm road while the stage card shows */
  function useBolt() { if (bolts <= 0 || boost > 0) return; bolts--; boost = 3; shake = .15; tune([330, 440, 660, 880], .05, 'sawtooth'); pop('TURBO!', x, PY - 30, '#7fe0ff'); }
  const S = { F: K.fx() };

  return {
    key(k) { if (k === 'a' || k === 'up') useBolt(); },
    swipe(d) { if (d === 'up') useBolt(); },
    update(dt) { t += dt; const st = ST[stg];
      for (const q of tunes) if ((q.t -= dt) <= 0) A.beep(q.f, .1, q.type, .04); tunes = tunes.filter(q => q.t > 0);
      /* speed rises through each stage; a turbo boost adds 50% */
      const want = (st.v0 + (st.v1 - st.v0) * Math.min(1, dist / LEN)) * (boost > 0 ? 1.5 : 1); sp += (want - sp) * Math.min(1, dt * (boost > 0 ? 4 : 1.1));
      const step = sp * dt; dist += step; total += step; inv -= dt; boost -= dt; shake -= dt; card -= dt; comboT -= dt; if (comboT <= 0) combo = 0;
      /* steering: keys win over the pointer; the pointer sets a target the car glides to */
      if (A.ptr.down || A.ptr.moved) tx = A.ptr.x; if (A.keys.left || A.keys.right) tx = null;
      if (spin > 0) { spin -= dt; x += sdir * 65 * dt; }
      else if (A.keys.left) x -= 175 * dt; else if (A.keys.right) x += 175 * dt;
      else if (tx != null) x += Math.max(-210 * dt, Math.min(210 * dt, tx - x));
      if (x < 48 || x > 192) { if (spin > 0) sdir = x < 48 ? 1 : -1; x = Math.max(48, Math.min(192, x)); }
      /* spawning stops just before the finish line so it can be crossed in peace */
      const nearEnd = dist > LEN - 420;
      if ((nextHaz -= step) <= 0) { nextHaz = A.rnd(st.gap[0], st.gap[1]); if (!nearEnd) spawnHazard(); }
      if (has('coin') && (nextItem -= step) <= 0) nextItem = !nearEnd && spawnItem('coin') ? A.rnd(300, 460) : 60;
      if (has('bolt') && (nextBolt -= step) <= 0) nextBolt = !nearEnd && bolts < 3 && spawnItem('bolt') ? A.rnd(1100, 1700) : 120;
      if (has('fix') && (nextFix -= step) <= 0) nextFix = !nearEnd && lives < 3 && spawnItem('fix') ? A.rnd(2400, 3200) : 200;
      for (const o of objs) { o.y += sp * (1 - o.v) * dt;
        /* lane changers blink for a moment, then slide over (only into a lane with room); they pick the moment at random,
           so a car parked on a lane line is not safe from them */
        if (o.turn === 1 && o.y > o.ty) { const to = o.lane + (o.lane === 0 ? 1 : o.lane === 3 ? -1 : (Math.random() < .5 ? 1 : -1));
          const room = objs.every(q => q === o || !q.haz || (q.lane !== to && q.from !== to) || (q.v === LV[to] ? Math.abs(q.y - o.y) > (q.h + o.h) / 2 + 26 : q.k === 'slick'));
          o.turn = room ? 2 : 0; o.to = to; o.blink = .9; }
        else if (o.turn === 2 && (o.blink -= dt) <= 0) { o.turn = 3; o.from = o.lane; o.lane = o.to; o.v = LV[o.to]; }
        else if (o.turn === 3) { const gx = LANES[o.lane]; o.x += Math.sign(gx - o.x) * Math.min(Math.abs(gx - o.x), 40 * dt); if (o.x === gx) { o.turn = 0; o.from = null; } }
        /* touching the player */
        if (o.dead || Math.abs(o.x - x) > o.hw + 6 || Math.abs(o.y - PY) > o.h / 2 + 11) {
          if (o.haz && !o.slip && !o.passed && top(o) > PY + 13) { o.passed = 1; if (Math.abs(o.x - x) < o.hw + 18 && inv <= 0) { combo = Math.min(10, combo + 1); comboT = 2; const p = 5 * combo; A.add(p); pop('CLOSE +' + p, o.x, PY - 24, '#7fe0ff'); A.beep(700 + combo * 60, .06, 'triangle', .03); } }
          continue; }
        if (o.k === 'coin') { o.dead = 1; A.add(10); S.F.spark(o.x, o.y, ['#ffd23c', '#fff6c8'], 6, 50); A.beep(1320, .05, 'square', .03); tunes.push({ t: .05, f: 1760, type: 'square' }); }
        else if (o.k === 'bolt') { o.dead = 1; bolts = Math.min(3, bolts + 1); pop('BOLT!', o.x, o.y - 10, '#7fe0ff'); tune([660, 990], .06, 'triangle'); }
        else if (o.k === 'fix') { o.dead = 1; lives = Math.min(3, lives + 1); pop('EXTRA LIFE', o.x, o.y - 10, '#8ae06a'); tune([523, 784, 1046], .08, 'triangle'); }
        else if (o.slip) { if (spin <= 0 && boost <= 0 && inv <= 0) { spin = .65; sdir = x < o.x ? -1 : 1; if (x === o.x) sdir = x < 120 ? 1 : -1; A.beep(260, .3, 'triangle', .05); pop(o.ice ? 'WHOA!' : 'SLIP!', x, PY - 30, '#ffffff'); } }
        else if (boost > 0) { o.dead = 1; const p = o.k === 'cones' ? 10 : 20; A.add(p); pop('SMASH +' + p, o.x, o.y - 14); S.F.boom(o.x, o.y, 0); S.F.spark(o.x, o.y, ['#ffd23c', o.c || '#ff8a1e', '#ffffff'], 10, 100); shake = .15; A.beep(200, .15, 'square', .05); }
        else if (inv <= 0) { crash(o); return; } }
      objs = objs.filter(o => !o.dead && top(o) < 340);
      for (const p of pops) { p.l -= dt * .8; p.y -= 24 * dt; } pops = pops.filter(p => p.l > 0);
      if (boost > 0) S.F.puff(x + A.rnd(-3, 3), PY + 15, Math.random() < .5 ? '#ffd23c' : '#ff8a1e', 160);
      else if (Math.random() < dt * 8) S.F.puff(x + (Math.random() < .5 ? -4 : 4), PY + 14, '#aab4c2', 60);
      const d = Math.floor(total / 30); if (d > far) { A.add(d - far); far = d; }
      if (dist >= LEN) nextStage(); else A.info('Stage\u00a0' + (stg + 1) + '/6 · ' + Math.round(sp * .6) + '\u00a0km/h'); }, /* no-break spaces: a narrow bar wraps between the two parts */

    draw(g) { const st = ST[stg], o2 = Math.round(total), sh = shake > 0 ? 2 : 0;
      g.fillStyle = '#140e1c'; g.fillRect(0, 0, 240, 320); g.save(); if (sh) g.translate(A.ri(-sh, sh), A.ri(-sh, sh));
      /* ground: the new stage's ground starts at the line just crossed, which slides down off screen */
      K.scroll(g, ground(st.g), 0, -o2, 240, 320); const edge = PY + dist;
      if (edge < 320 && oldG !== st.g) { g.save(); g.beginPath(); g.rect(0, edge, 240, 320 - edge); g.clip(); K.scroll(g, ground(oldG), 0, -o2, 240, 320); g.restore(); }
      g.save(); g.beginPath(); g.rect(40, 0, 160, 320); g.clip(); K.scroll(g, K.T.road(64, 64), 0, -o2, 240, 320); g.restore();
      const o = o2 % 40; for (let y = -40 + o; y < 320; y += 20) { const c = (Math.floor((y - o) / 20) % 2) ? '#e8231e' : '#f2f5f8'; K.box(g, 35, y, 5, 20, c); K.box(g, 200, y, 5, 20, c); K.box(g, 34, y, 1, 20, '#140e1c'); K.box(g, 205, y, 1, 20, '#140e1c'); }
      K.box(g, 42, 0, 2, 320, '#d6dbea'); K.box(g, 196, 0, 2, 320, '#d6dbea'); for (let y = -40 + o; y < 320; y += 40) for (const lx of [80, 120, 160]) K.box(g, lx - 1, y, 2, 18, '#f2f5f8');
      /* chequered lines: the finish ahead and the one just crossed */
      for (const ly of [PY - 13 - (LEN - dist), PY - 13 + dist]) if (ly > -12 && ly < 330) for (let i = 0; i < 20; i++) for (let r = 0; r < 2; r++) K.box(g, 40 + i * 8, Math.round(ly) + r * 5, 8, 5, (i + r) % 2 ? '#140e1c' : '#f2f5f8');
      /* roadside: each slot picks the current stage's decoration when it wraps off screen */
      for (const s of slots) { const v = s.i * 83 + o2, y = (v % 420) - 50, c = Math.floor(v / 420), sx = s.i % 2 ? 222 : 18; if (c !== s.c) { s.c = c; s.d = st.d; }
        if (s.d === 'lamp') { K.box(g, s.i % 2 ? 226 : 10, y - 1, 4, 3, '#3a4152'); K.box(g, s.i % 2 ? 210 : 14, y, 16, 1, '#5c6678'); K.put(g, lamp(), s.i % 2 ? 210 : 30, y); }
        else { K.shadow(g, sx + 3, y + 6, 8, 5); K.put(g, deco(s.d, s.i), sx, y); } }
      /* things on the road surface first, then traffic on top */
      for (const q of objs) if (!q.haz || q.slip) { if (q.k === 'slick') K.put(g, slick(q.ice), q.x, q.y); else { const b = Math.sin(t * 6 + q.y * .05) > 0 ? 1 : 0; K.put(g, q.k === 'coin' ? K.coin(Math.floor(t * 8 + q.y * .1) & 3) : q.k === 'bolt' ? bolt(14) : spanner(), q.x, q.y - b); } }
      for (const q of objs) { if (!q.haz || q.slip) continue;
        if (q.k === 'cones') { K.put(g, barrier(), q.x, top(q) + 4); if (Math.floor(t * 4) % 2) K.box(g, q.x - 1, top(q), 3, 2, '#ffd23c'); for (let y = top(q) + 18; y < bot(q); y += 17) K.put(g, cone(), q.x + ((y / 17 | 0) % 2 ? -5 : 5), y); continue; }
        K.shadow(g, q.x + 2, q.y + 3, 8, q.h / 2); K.put(g, q.k === 'truck' ? truck(q.c) : K.car(q.c), q.x, q.y);
        if (q.turn >= 2 && Math.floor(t * 6) % 2) { const bx = q.x + ((q.to > (q.from != null ? q.from : q.lane) ? 1 : -1) * 6) - 1; K.box(g, bx, top(q) + 1, 3, 3, '#ff9a2a'); K.box(g, bx, bot(q) - 4, 3, 3, '#ff9a2a'); } }
      if (inv <= 0 || Math.floor(inv * 10) % 2) { K.shadow(g, x + 2, PY + 4, 8, 13); K.put(g, player(), x, PY, spin > 0 ? { rot: spin * 9 * sdir } : null); }
      S.F.draw(g);
      if (boost > 0 || sp > 235) { g.fillStyle = 'rgba(255,255,255,.3)'; for (let i = 0; i < 7; i++) g.fillRect(46 + (i * 53) % 150, (i * 97 + o2 * 2) % 320, 1, 16); }
      /* night: darkness fades in, then lights shine through it */
      if (st.night) { g.globalAlpha = Math.min(1, dist / 500); g.drawImage(nightMask(), Math.round(x) - 240, 0); g.globalAlpha = 1;
        for (const q of objs) if (q.k === 'car' || q.k === 'truck') { K.box(g, q.x - 6, bot(q) - 2, 3, 2, '#ff4060'); K.box(g, q.x + 3, bot(q) - 2, 3, 2, '#ff4060'); }
        else if (q.k === 'cones' && Math.floor(t * 4) % 2) K.box(g, q.x - 2, top(q) - 1, 5, 4, '#ffd23c');
        for (const s of slots) if (s.d === 'lamp') K.put(g, lamp(), s.i % 2 ? 210 : 30, (s.i * 83 + o2) % 420 - 50); }
      g.restore();
      /* HUD: lives, stage progress, bolts */
      K.box(g, 0, 0, 240, 13, '#140e1c'); K.box(g, 0, 13, 240, 1, '#3a4152');
      for (let i = 0; i < 3; i++) K.put(g, hud('h'), 8 + i * 11, 7, i < lives ? null : { a: .25 });
      for (let i = 0; i < 3; i++) K.put(g, hud('b'), 210 + i * 11, 7, i < bolts ? null : { a: .25 });
      const bw = 150, bx = 45, pr = Math.min(1, dist / LEN); K.box(g, bx, 5, bw, 4, '#3a4152'); for (let i = 1; i < 6; i++) K.box(g, bx + Math.round(bw * i / 6), 4, 1, 6, '#69758a');
      K.box(g, bx, 5, Math.round(bw * (stg + pr) / 6), 4, boost > 0 ? '#7fe0ff' : '#ffd23c'); K.box(g, bx + Math.round(bw * (stg + pr) / 6) - 1, 3, 3, 8, '#e8231e');
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) K.box(g, bx + bw + 1 + c * 2, 3 + r * 4, 2, 4, (r + c) % 2 ? '#140e1c' : '#f2f5f8');
      for (const p of pops) if (p.l > .3 || Math.floor(p.l * 20) % 2) { const px = Math.max(30, Math.min(210, p.x)); A.text(g, p.s, px + 1, p.y + 1, '#140e1c', 1, 'center'); A.text(g, p.s, px, p.y, p.c, 1, 'center'); }
      if (card > 0) { const y = 92; K.box(g, 30, y - 8, 180, 62, '#140e1c'); K.box(g, 31, y - 7, 178, 60, '#26304a'); K.box(g, 31, y - 7, 178, 2, '#ffd23c');
        A.text(g, 'STAGE ' + (stg + 1), 120, y, '#ffd23c', 3, 'center'); A.text(g, st.n, 120, y + 22, '#f2f5f8', 2, 'center'); if (Math.floor(card * 4) % 2 || card < 2) A.text(g, st.hint, 120, y + 39, '#7fe0ff', 1, 'center'); } }
  };
} });
