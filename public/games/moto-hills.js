Arcade.game('moto-hills', { w: 240, h: 160, pad: 'lr', a: 'GAS',
help: 'Ride through 5 lands to the checkered flag! Hold Space, up, GAS or just touch the screen to give gas. In the air, lean with left / right so you land on your wheels — a bad landing costs a helmet and you only have 3. Hit ramps fast to fly over rocks and mud, grab coins and red fuel cans, ride through the arrows for a boost, and spin a full flip for bonus points. The ride ends when the helmets or the fuel run out.',
init(A) {
  const K = Art, SL = 2800, NS = 5, END = SL * NS, CW = 400, nd = a => Math.atan2(Math.sin(a), Math.cos(a)), cl = (v, a, b) => Math.max(a, Math.min(b, v));
  /* lands: name, sky, far hills (fill, rim), near hills (fill, rim), turf, turf light, turf edge, dirt, dirt band, speck, sun */
  const TH = [['MEADOW', ['#ff7a4a', '#ffb060', '#ffe6a8'], '#d87a50', '#f0a070', '#a04e38', '#c8704a', '#3fb45a', '#a8f0a0', '#1f6a2a', '#5a3418', '#7a4a26', '#3a2010', '#fff6c8'],
    ['CANYON', ['#2f8ad8', '#7cc4f0', '#ffe9b8'], '#e09a58', '#f6c080', '#b8602c', '#d88444', '#e8b85a', '#fff0b0', '#a8742c', '#8a4a22', '#a8622e', '#5a2c12', '#fff6c8'],
    ['SNOW PEAKS', ['#4a6ac8', '#9ab8f0', '#eef4ff'], '#b8c8e8', '#ffffff', '#7a8ec8', '#d8e4ff', '#eef4ff', '#ffffff', '#9ab0d8', '#4a5680', '#5e6c9a', '#2e3658', '#ffffff'],
    ['LAVA LAND', ['#1c0a18', '#6a1420', '#ff6a1e'], '#4a1c24', '#8a2c24', '#2a1018', '#5a1c1c', '#6a5a64', '#a89aa4', '#2a2028', '#2a161c', '#4a2428', '#ff8a1e', '#ffb040'],
    ['MOON VALLEY', ['#070a1c', '#1a2460', '#4a3a8a'], '#2a2f6a', '#4a52a0', '#161a44', '#2f387a', '#2fa88a', '#9af0d0', '#145a50', '#1c2238', '#2a3454', '#0e1220', '#f2f5f8']];
  const thAt = wx => TH[cl(Math.floor(wx / SL), 0, NS - 1)];
  /* track: the hills grow with distance; every 400px cell may hold a ramp (R), a mud patch (M) and pickups */
  const R = [], M = [], items = [];
  const base = x => { const s = Math.min(1, x / 200) * Math.min(1.1, .68 + x / 28000), b = cl((x - SL) / SL, 0, 2);
    return 104 + s * (Math.sin(x * .018) * 15 + Math.sin(x * .047 + 1) * 8 + Math.sin(x * .0071) * 14) + Math.sin(x * .09) * b; };
  const bump = (r, x) => { const u = x - r.x; return u <= 0 || u >= 49 ? 0 : u < 44 ? r.H * u * u / 1936 : r.H * (49 - u) / 5; };
  const h = x => { const r = R[Math.floor(x / CW)]; return base(x) - (r ? bump(r, x) : 0); };
  const sl = (x, dir) => Math.atan2(dir < 0 ? h(x + 3) - h(x) : h(x) - h(x - 3), 3); /* slope behind the bike, so a ramp lip really launches */
  let canIn = 1;
  for (let c = 1; c * CW < END - 100; c++) { const x0 = c * CW, st = Math.floor(x0 / SL), put = (t, x, up, o) => items.push(Object.assign({ t, x, up, got: 0 }, o));
    const ramp = c > 1 && Math.random() < .34 + st * .1 ? (R[c] = { x: x0 + A.ri(120, 215), H: A.ri(10, 13) + st }) : null;
    if (--canIn <= 0) { put('can', x0 + A.ri(30, 90), 8); canIn = st < 3 ? 2 : A.ri(2, 3); } else if (Math.random() < .3 + st * .06) put('boost', x0 + A.ri(30, 80), 12);
    if (ramp) { const lip = ramp.x + 46; for (let i = 0; i < 5; i++) put('coin', lip + 16 + i * 16, 24 + Math.sin(i / 4 * Math.PI) * 14);
      if (st && Math.random() < .35 + st * .12) { if (st > 1 && Math.random() < .45) M[c] = [lip + 28, lip + 70]; else put('rock', lip + A.ri(40, 60), 5, { v: c % 3 }); } }
    else for (let i = 0, n = A.ri(3, 5), hi = Math.random() < .3 ? 26 : 9; i < n; i++) put('coin', x0 + 150 + i * 15, hi); }
  for (const it of items) it.y = h(it.x) - it.up;
  /* sprites */
  const bikeS = f => K.spr('moto-hills-bike' + f, 28, 24, g => { g.translate(0, 3);
    for (const x of [-9, 9]) { K.ell(g, x, 4, 4.8, 4.8, '#1a1222'); K.ell(g, x, 4, 2.6, 2.6, '#8793a6'); K.box(g, x - (f ? 0 : 2), 4 - (f ? 2 : 0), f ? 1 : 5, f ? 5 : 1, '#f2f5f8'); K.box(g, x - .5, 3.5, 1, 1, '#1a1222'); }
    K.part(g, [9, 4, 5, -6, 7, -6, 10.5, 3], '#aab4c2'); K.part(g, [-10, 3, -4, -2, -2, 0, -9, 4.5], '#5c6678'); K.box(g, -13, -2, 6, 2, '#aab4c2'); K.box(g, -14, -2, 2, 2, '#3a4152');
    K.part(g, [-9, -2, -6, -5, 0, -5, 3, -7, 7, -5, 4, 2, -4, 3], K.lin(g, 0, -7, 0, 3, '#ff8a6a', '#e8231e', '#8a1410')); K.box(g, -7, -6, 7, 2, '#1a1222'); K.box(g, 4, -8, 5, 2, '#1a1222'); K.box(g, 9, -5, 2, 2, '#fff6c8');
    K.part(g, [-5, -6, -3, -13, 2, -14, 4, -9, 0, -6], K.lin(g, -5, 0, 4, 0, '#6a9af0', '#2f56c0')); K.part(g, [1, -13, 7, -9, 6, -7, 0, -10], '#3f6ad0'); K.box(g, 5, -9, 2, 2, '#f0c890');
    K.part(g, [-4, -6, 1, -6, 2, 1, -1, 2], '#2a3f7a'); K.box(g, -2, 1, 5, 2, '#1a1222');
    K.ell(g, 1, -16, 3.8, 3.6, K.rad(g, 0, -17, .5, 5, '#fff6c8', '#ffd23c', '#c8801e')); K.box(g, 2, -17, 3, 2, '#1b2a44'); K.box(g, -3, -17, 3, 1, '#e8231e'); });
  const canS = () => K.spr('moto-hills-can', 10, 13, q => { K.rr(q, -5, -3, 10, 9, 2, K.lin(q, -5, 0, 5, 0, '#ff8a7a', '#e8231e', '#7a1410')); K.box(q, 0, -6, 4, 3, '#5c6678'); K.box(q, -5, -5, 4, 2, '#aab4c2'); K.box(q, -2, 0, 4, 4, '#ffd23c'); K.box(q, -1, 1, 2, 2, '#e8231e'); });
  const boostS = f => K.spr('moto-hills-bst' + f, 18, 11, q => { for (const x of [-8, -2, 4]) K.part(q, [x, -5, x + 5, 0, x, 5, x - 2, 5, x + 2, 0, x - 2, -5], f ? '#fff6c8' : '#ffd23c'); }, { ol: f ? [200, 90, 20] : [120, 50, 14] });
  const helmS = on => K.spr('moto-hills-helm' + on, 9, 8, q => { K.ell(q, 0, 0, 4.5, 4, on ? K.lin(q, 0, -4, 0, 4, '#fff6c8', '#ffd23c', '#c8801e') : '#3a3048'); K.box(q, 0, 0, 5, 3, on ? '#1b2a44' : '#241c30'); K.box(q, -4, -1, 4, 1, on ? '#e8231e' : '#241c30'); if (on) K.box(q, 3, 0, 1, 1, '#7fc0f0'); });
  const deco = [k => K.tree(5 + k % 2, k % 3),
    k => K.spr('moto-hills-cac' + k % 2, 11, 16, q => { const c = K.lin(q, -5, 0, 5, 0, '#8ae06a', '#3fa84a', '#1f6a2a'); K.rr(q, -2, -8, 4, 16, 2, c); K.rr(q, -5, -3, 3, 6, 1, c); K.box(q, -4, 1, 3, 2, '#3fa84a'); if (k % 2) { K.rr(q, 3, -5, 3, 5, 1, c); K.box(q, 1, -2, 3, 2, '#3fa84a'); } K.box(q, -1, -6, 1, 10, '#b8f08a'); }),
    k => K.spr('moto-hills-pine' + k % 2, 13, 18, q => { K.box(q, -1, 5, 2, 4, '#5a3418'); for (let i = 0; i < 3; i++) { K.part(q, [0, -9 + i * 4, 3 + i * 1.5, -3 + i * 4, -3 - i * 1.5, -3 + i * 4], k % 2 ? '#2f7a5a' : '#2a6a4a'); K.box(q, -2 - i, -5 + i * 4, 3 + i, 1, '#ffffff'); } }),
    k => K.rock(4 + k % 3, k % 3, '#5a3a40'),
    k => K.spr('moto-hills-shr' + k % 2, 12, 14, q => { K.box(q, -1, 1, 2, 6, '#2a3454'); K.ell(q, 0, -2, 5 - k % 2, 5, K.rad(q, -2, -4, .5, 8, '#5fe3d6', '#1f7a8a', '#0e3a5a')); K.box(q, -2, -4, 1, 1, '#c8fffa'); K.box(q, 2, -1, 1, 1, '#c8fffa'); })];
  let x = 30, y = h(30), vx = 40, vy = 0, ang = 0, av = 0, air = 0, spin = 0, fuel = 100, lives = 3, inv = 0, stage = 0, boost = 0, shake = 0, ban = 2.6, camY = 0, far = 0, still = 0, t = 0, dustT = 0, combo = 0, comboT = 0, wheel = 0, dead = 0, pops = [];
  const S = K.fx(), pop = (s, c, dy) => pops.push({ s, c, x, y: y - 26 - (dy || 0), l: 1.1 }), tune = (fs, type) => fs.forEach((f, i) => setTimeout(() => A.beep(f, .14, type || 'triangle', .05), i * 110));
  function crash(gy, sa) { lives--; S.boom(x, y - 8, 1); shake = .45; A.beep(120, .4, 'sawtooth', .06); air = spin = av = 0;
    if (lives <= 0) { dead = 1; A.over(); return; }
    y = gy; ang = sa; vx = 35 * Math.cos(sa); vy = 35 * Math.sin(sa); inv = 2; pop('OUCH!', '#ff8a7a'); }
  return {
    update(dt) { t += dt; ban -= dt; inv -= dt; boost -= dt; shake = Math.max(0, shake - dt); comboT -= dt; if (comboT < 0) combo = 0;
      const gas = (A.keys.a || A.keys.up || A.ptr.down) && fuel > 0, lean = (A.keys.right ? 1 : 0) - (A.keys.left ? 1 : 0), was = fuel;
      vy += 300 * dt; x += vx * dt; y += vy * dt; if (x < 14) { x = 14; vx = Math.max(0, vx); }
      const c = Math.floor(x / CW), gy = h(x), sa = sl(x, vx);
      if (y >= gy - .5) {
        if (air > .25) { const off = Math.abs(nd(ang - sa)), flips = Math.floor((Math.abs(spin) + 1.3) / 6.283);
          if (off > 1.2 && inv <= 0) { crash(gy, sa); return; }
          A.beep(240, .05); for (let i = 0; i < 5; i++) S.puff(x + A.rnd(-8, 8), gy - 1, i % 2 ? thAt(x)[7] : thAt(x)[10], -18); if (vy > 150) shake = Math.max(shake, .12);
          if (flips) { A.add(250 * flips); pop((flips > 1 ? flips + 'X ' : '') + 'FLIP! +' + 250 * flips, '#5fe3d6'); tune([660, 880, 1320]); S.spark(x, y - 8, ['#5fe3d6', '#ffffff', '#ffd23c'], 14, 90); }
          else if (air > .55 && off < .32) { const n = 10 + Math.round(air * 20); A.add(n); pop('NICE! +' + n, '#fff6c8'); A.beep(700, .08, 'triangle'); } }
        air = 0; spin = 0; y = gy; let v = vx * Math.cos(sa) + vy * Math.sin(sa); const m = M[c], mud = m && x > m[0] && x < m[1];
        v += ((gas ? (Math.abs(v) < 45 ? 340 : 190) : 0) - v * (mud ? 2.4 : .45)) * dt; v = cl(v, -40, 215 + 75 * cl(boost, 0, 1)); vx = v * Math.cos(sa); vy = v * Math.sin(sa); const pa = ang; ang += nd(sa - ang) * Math.min(1, dt * 14); if (dt > 0) av = cl(av + (nd(ang - pa) / dt * .7 - av) * Math.min(1, dt * 10), -2.2, 2.2); /* the bike keeps turning when it leaves the ground */
        if (gas) fuel = Math.max(0, fuel - (8 + stage * .8) * dt); dustT -= dt;
        if (dustT < 0 && (gas || mud) && Math.abs(v) > 20) { dustT = mud ? .03 : .07; S.puff(x - 9, gy - 1, mud ? '#6a4420' : thAt(x)[10], mud ? -40 : -10); if (mud && !(wheel & 3)) A.beep(90, .04, 'sawtooth', .02); } }
      else { air += dt; av += (lean * 15 - av * 2.3) * dt; if (!lean && air > .12) av += nd(sl(x + vx * .3, 1) - ang) * Math.max(0, 4 - stage * 1.4) * dt; /* self-levelling help, fading out land by land */
        ang += av * dt; spin += av * dt; }
      wheel += Math.abs(vx) * dt * .2; if (boost > 0) S.puff(x - 12, y - 6, t * 30 & 1 ? '#ffd23c' : '#ff8a1e', 0);
      for (const it of items) { const dx = Math.abs(it.x - x); if (it.got || dx > 14) continue;
        if (it.t === 'coin') { if (dx < 9 && Math.abs(it.y - y + 9) < 13) { it.got = 1; combo = Math.min(8, combo + 1); comboT = 1.2; A.add(10); A.beep(700 + combo * 70, .07, 'triangle'); S.spark(it.x, it.y, ['#ffd23c', '#fff6c8'], 5, 50); } }
        else if (it.t === 'can') { if (dx < 12 && y > it.y - 40) { it.got = 1; fuel = Math.min(100, fuel + 30); A.add(30); pop('FUEL!', '#ffd23c'); tune([520, 780]); S.spark(it.x, it.y, ['#e8231e', '#ffd23c'], 8, 60); } }
        else if (it.t === 'boost') { if (dx < 10 && y > it.y - 22) { it.got = 1; boost = 1.7; const b = Math.max(260, vx); vx = b; if (!air) vy = b * Math.tan(sa); pop('BOOST!', '#ff9a2a'); tune([440, 660, 990], 'square'); } }
        else if (dx < 7 && y > it.y - 3 && inv <= 0) { it.got = 1; vx *= .3; vy *= .3; fuel = Math.max(0, fuel - 8); shake = .25; pop('BUMP! -8 FUEL', '#ff8a7a'); A.beep(150, .2, 'sawtooth', .05); S.spark(it.x, it.y, ['#8a7a6a', '#c8b8a8', '#5a4a40'], 12, 90); } }
      const d = Math.floor(x / 20); if (d > far) { A.add(d - far); far = d; }
      if (x >= END) { const b = Math.round(fuel) * 3 + lives * 200; A.add(500 + b); stage = NS; ban = 9; tune([660, 880, 990, 1320]); A.over(true); return; }
      if (Math.floor(x / SL) > stage) { stage++; A.add(100 * stage); fuel = Math.min(100, fuel + 25); ban = 2.6; tune([520, 660, 880]); S.spark(x, y - 20, ['#ffd23c', '#5fe3d6', '#ff8a9a', '#ffffff'], 24, 120); }
      if (was > 25 && fuel <= 25) A.beep(330, .25, 'square', .05);
      if (fuel <= 0) { if (Math.abs(vx) < 30) still += dt; if (still > 1.6) { dead = 2; A.over(); return; } } else still = 0;
      camY += (Math.max(0, 52 - y) - camY) * Math.min(1, dt * 6); pops = pops.filter(p => (p.l -= dt) > 0);
      A.info(Math.floor(x / 10) + ' M'); },
    draw(g) { const sh = shake > 0 ? Math.round(Math.sin(t * 90) * shake * 8) : 0, cam = Math.round(x - 70), oy = Math.round(camY) + sh, edge = (Math.floor(cam / SL) + 1) * SL - cam, thL = thAt(cam), thR = thAt(cam + 239);
      g.drawImage(K.T.sky(240, 160, thL[1]), 0, 0); if (edge < 240 && thR !== thL) g.drawImage(K.T.sky(240, 160, thR[1]), edge, 0, 240 - edge, 160, edge, 0, 240 - edge, 160);
      const sun = thAt(cam + 180); if (sun === TH[4]) for (let i = 0; i < 26; i++) { const sx = i * 53 % 240; if (sx >= edge || thL === sun) K.box(g, sx, i * 29 % 70, 1, 1, (i + (t * 2 | 0)) % 5 ? '#9fb4e6' : '#ffffff'); }
      K.put(g, K.ball(12, sun[12]), 180, 34 + (oy >> 2));
      for (let i = 0; i < 240; i += 2) { const th = i < edge ? thL : thR, a = 70 + Math.sin((i + cam * .2) * .03) * 14 + Math.sin((i + cam * .2) * .011) * 8 + (oy >> 2), b = 94 + Math.sin((i + cam * .45) * .045 + 2) * 10 + (oy >> 1);
        K.box(g, i, a, 2, 160, th[2]); K.box(g, i, a, 2, 2, th[3]); K.box(g, i, b, 2, 160, th[4]); K.box(g, i, b, 2, 2, th[5]); }
      for (let k = Math.floor((cam - 20) / 90); k * 90 < cam + 260; k++) { const dx = k * 90 + (k * k * 7 + k * 13) % 50, r = R[Math.floor(dx / CW)]; if (dx < 60 || (r && dx > r.x - 6 && dx < r.x + 56)) continue; const s = deco[cl(Math.floor(dx / SL), 0, NS - 1)](Math.abs(k)); g.drawImage(s, dx - cam - (s.width >> 1), Math.round(h(dx)) + oy - s.height + 3); }
      for (let i = -(cam & 1); i < 240; i += 2) { const wx = cam + i, c = Math.floor(wx / CW), th = thAt(wx), r = R[c], m = M[c], q = wx >> 1, bh = r ? Math.round(bump(r, wx)) : 0, gy = Math.round(base(wx)) + oy, mud = m && wx >= m[0] && wx < m[1];
        K.box(g, i, gy, 2, 160 - gy, th[9]); K.box(g, i, gy + 3, 2, 7, th[10]); K.box(g, i, gy, 2, 3, mud ? '#6a4420' : th[6]); K.box(g, i, gy, 2, 1, mud ? (q + (t * 6 | 0)) % 4 ? '#8a5a2c' : '#b88a5a' : th[7]); K.box(g, i, gy + 3, 2, 1, mud ? '#3a2410' : th[8]);
        if (q * 7 % 11 === 0) K.box(g, i, gy + 12 + (q % 5) * 5, 2, 2, th[11]); if (q * 5 % 17 === 0) K.box(g, i, gy + 18 + (q % 4) * 6, 2, 1, th[10]); if (q % 23 === 0 && !mud && !bh) K.box(g, i, gy - 2, 1, 2, th[6]);
        if (bh) { K.box(g, i, gy - bh, 2, bh + 1, q % 5 ? '#b87a3a' : '#7a4618'); K.box(g, i, gy - bh, 2, 1, '#f0c080'); if (bh > 4) K.box(g, i, gy - bh + 3, 2, 1, '#8a5220'); } }
      for (let n = 1; n <= NS; n++) { const fx = n * SL - cam; if (fx < -20 || fx > 250) continue; const fy = Math.round(base(n * SL)) + oy; K.box(g, fx - 1, fy - 34, 3, 35, '#140e1c'); K.box(g, fx, fy - 33, 1, 33, '#dfe6ee'); K.box(g, fx + 2, fy - 34, 16, 11, '#140e1c');
        if (n < NS) { K.box(g, fx + 2, fy - 33, 15, 9, TH[n][6]); K.box(g, fx + 2, fy - 33, 15, 2, TH[n][7]); A.text(g, n + 1, fx + 8, fy - 31, '#140e1c'); } else for (let j = 0; j < 15; j++) K.box(g, fx + 2 + j % 5 * 3, fy - 33 + (j / 5 | 0) * 3, 3, 3, j % 2 ? '#1a1222' : '#ffffff'); }
      for (const it of items) { const ix = it.x - cam, iy = it.y + oy; if (ix < -12 || ix > 252 || (it.got && it.t !== 'boost')) continue;
        if (it.t === 'coin') K.put(g, K.coin((t * 8 + it.x) & 3), ix, iy); else if (it.t === 'can') K.put(g, canS(), ix, iy + Math.sin(t * 5 + it.x) * 1.5); else if (it.t === 'rock') K.put(g, K.rock(6, it.v), ix, iy); else K.put(g, boostS(it.got ? 0 : (t * 8 | 0) & 1), ix + (it.got ? 0 : (t * 10 | 0) % 3), iy, it.got ? { a: .4 } : null); }
      g.save(); g.translate(-cam, oy); S.draw(g); g.restore();
      if (dead !== 1 && (inv <= 0 || (t * 14 | 0) & 1)) { K.shadow(g, x - cam, h(x) + oy + 1, air ? 7 : 10, 2); g.save(); g.translate(Math.round(x - cam), Math.round(y) + oy); g.rotate(ang); const bk = bikeS(wheel & 1); g.drawImage(bk, -(bk.width >> 1), -bk.height + 2); g.restore(); }
      for (const p of pops) { const px = cl(p.x - cam, 34, 206), py = p.y + oy - (1.1 - p.l) * 16; A.text(g, p.s, px + 1, py + 1, '#140e1c', 1, 'center'); A.text(g, p.s, px, py, p.c, 1, 'center'); }
      /* HUD: fuel, helmets, progress */
      const fw = Math.round(64 * fuel / 100), low = fuel <= 25; K.put(g, canS(), 11, 11); K.box(g, 18, 6, 68, 10, '#140e1c'); K.box(g, 19, 7, 66, 8, '#3a2030'); K.box(g, 20, 8, fw, 6, low ? '#e8231e' : '#ffd23c'); K.box(g, 20, 8, fw, 2, low ? '#ff8a7a' : '#fff6c8'); for (let i = 1; i < 4; i++) K.box(g, 19 + i * 16, 7, 1, 8, '#140e1c');
      for (let i = 0; i < 3; i++) K.put(g, helmS(i < lives ? 1 : 0), 208 + i * 11, 11);
      K.box(g, 96, 9, 98, 4, '#140e1c'); for (let n = 0; n < NS; n++) K.box(g, 97 + n * 19.2, 10, 19, 2, n < stage ? TH[n][6] : '#3a3048'); K.box(g, 97, 10, Math.round(96 * cl(x / END, 0, 1)), 2, '#ffffff'); K.box(g, 96 + Math.round(96 * cl(x / END, 0, 1)), 7, 3, 8, '#140e1c'); K.box(g, 97 + Math.round(96 * cl(x / END, 0, 1)), 8, 1, 6, '#ff9a2a');
      const msg = (s, yy, c, sc) => { A.text(g, s, 121, yy + 1, '#140e1c', sc, 'center'); A.text(g, s, 120, yy, c, sc, 'center'); };
      if (stage >= NS) msg('FINISH! FUEL AND HELMET BONUS', 147, '#ffd23c', 1);
      else if (dead) msg(dead > 1 ? 'OUT OF FUEL!' : 'NO HELMETS LEFT!', 147, '#ff8a7a', 1);
      else if (ban > 0) { msg('LAND ' + (stage + 1), 32, '#ffd23c', 2); msg(TH[stage][0], 48, '#ffffff', 1); if (!stage && far < 6) msg('HOLD GAS!', 60, '#5fe3d6', 1); }
      else if (!fuel) msg('OUT OF FUEL!', 34, '#ff8a7a', 1); else if (low && (t * 3 | 0) & 1) msg('LOW FUEL', 34, '#ff8a7a', 1); }
  };
} });
