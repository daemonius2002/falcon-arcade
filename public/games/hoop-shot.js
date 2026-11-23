/* Hoop Shot — slingshot basketball: 8 rounds, each one adds a twist (heights, sliding hoop, wind, bumper). A basket gives the ball back, a miss costs one. */
Arcade.game('hoop-shot', { w: 240, h: 320, pad: 'dpad', a: 'THROW',
help: 'Pull back and let go, like a slingshot: touch or click, drag down away from the hoop, then release. The dots show where the ball will fly. With keys: left / right aim, up / down power, Space throws. Score 3 baskets to clear a round (4 in the final). There are 8 rounds: the hoop starts to slide, the wind blows and a bouncy bumper gets in the way. A basket gives your ball back, a miss costs one (misses in the warm-up round are free). Grab the star for an extra ball. Baskets in a row, clean swishes and bank shots score more.',
init(A) {
  const K = Art, F = K.fx(), BX = 120, BY = 266, G = 520, FLOOR = 277, MAXB = 9, OL = '#140e1c';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  /* rounds: hi = random heights, mv = slide speed, bob = up/down swing, wind = max push, bump = bumper, need = baskets */
  const R = [{ n: 'WARM UP' }, { n: 'HIGH AND LOW', hi: 1 }, { n: 'SLIDING HOOP', mv: 28 }, { n: 'WINDY DAY', hi: 1, wind: 70 },
    { n: 'BOUNCY BUMPER', hi: 1, bump: 1 }, { n: 'UP AND DOWN', mv: 22, bob: 20 }, { n: 'WINDY SLIDE', mv: 36, wind: 60 }, { n: 'GRAND FINAL', mv: 42, bob: 14, wind: 45, bump: 1, need: 4 }];
  let r = 0, cfg = R[0], got = 0, left = 6, streak = 0, t = 0;
  let vx0 = 60, vy0 = -440, hold = 0, ball = null, dr = null;
  let hx = 120, hy = 96, tx = 120, ty = 96, hb = 96, hv = 0, wind = 0, bmx = 60, bmv = 46, bmHit = 0, star = null;
  let wait = 0, intro = 0, pend = 0, end = 0, win = 0, msg = '', mcol = '#ffd23c', mt = 0, sh = 0, sw = 0;
  const need = () => cfg.need || 3;
  const info = () => A.info('ROUND ' + (r + 1) + ' OF ' + R.length);
  const say = (s, c) => { msg = s; mcol = c || '#ffd23c'; mt = 1; };
  function place() { tx = hx < 120 ? A.rnd(132, 188) : A.rnd(52, 108); ty = cfg.hi ? A.rnd(88, 146) : 96; if (cfg.wind) wind = (Math.random() < .5 ? -1 : 1) * A.rnd(.55, 1) * cfg.wind; }
  function setRound() { cfg = R[r]; got = 0; wind = 0; place(); hv = (cfg.mv || 0) * (tx > hx ? 1 : -1); if (cfg.mv) ty = cfg.bob ? 112 : 100;
    star = r ? { x: A.rnd(40, 200), y: A.rnd(140, 172) } : null; intro = r ? 1.7 : 1.1; info(); }
  function throwIt() { if (ball || wait > 0 || intro > 0 || end) return; ball = { x: BX, y: BY, vx: vx0, vy: vy0, sc: 0, rim: 0, bank: 0, dead: 0, up: 0, rel: 1, t: 0 }; A.beep(400, .06); }
  function done(ok) { ball = null; wait = .3;
    if (!ok) { streak = 0; if (r) left--; say(!r ? 'TRY AGAIN!' : left > 0 ? 'MISS' : 'OUT OF BALLS', '#ff8a9a'); /* misses in the warm-up round are free */ A.beep(160, .12, 'sawtooth'); if (left <= 0) { end = 1; win = 0; wait = 1.2; } info(); return; }
    if (!pend) { if (!cfg.mv) place(); return; }
    pend = 0; A.add(150 * (r + 1)); for (let i = 0; i < 3; i++) F.spark(40 + i * 80, 70, ['#ffd23c', '#5fe3d6', '#ff8a9a', '#ffffff'], 16, 120);
    [660, 880, 1100].forEach((f, i) => setTimeout(() => A.beep(f, .12, 'triangle'), i * 110));
    if (++r >= R.length) { r = R.length - 1; end = 1; win = 1; wait = 1.6; A.add(200 * left); say('CHAMPION!'); info(); return; }
    left = Math.min(MAXB, left + 1); setRound(); }
  function basket() { const b = ball; b.sc = 1; got++; streak++; sw = .35; sh = 3;
    const sx = Math.min(streak, 5), swish = !b.rim && !b.bank, pts = 100 * sx + (swish ? 50 : 0) + (b.bank ? 50 : 0);
    A.add(pts); A.beep(880, .22, 'triangle'); if (swish) setTimeout(() => A.beep(1320, .15, 'triangle'), 90);
    say((b.bank ? 'BANK SHOT! ' : swish ? 'SWISH! ' : streak > 1 ? 'NICE! ' : 'BASKET! ') + '+' + pts);
    F.spark(hx, hy + 8, ['#ffd23c', '#ffffff', '#ff8a1e'], 22 + sx * 4, 110); if (got >= need()) pend = 1; info(); }
  function step(h) { const b = ball; b.vy += G * h; b.vx += wind * h; b.x += b.vx * h; b.y += b.vy * h;
    const rel = b.y - hy, dxh = b.x - hx;
    if (rel < -6) b.up = 1; /* on the way up the ball flies in front of the hoop; it only meets rim and net once it has been above them */
    if (b.up && !b.dead && !b.sc) {
      if (b.rel > 0 && rel <= 0 && Math.abs(dxh) < 17) { b.y = hy + 1; b.vy = Math.abs(b.vy) * .5; b.rim = 1; A.beep(240, .03); } /* the net stops a ball coming from below */
      else if (b.rel < 0 && rel >= 0 && Math.abs(dxh) < 14) basket(); }
    b.rel = b.y - hy;
    if (b.up) for (let s = -1; s < 2; s += 2) hit(hx + s * 17, hy, 7, .62, 0);
    if (cfg.bump) hit(bmx, 190, 16, .9, 1);
    if (b.x < 7) { b.x = 7; b.vx = Math.abs(b.vx) * .7; wall(); } if (b.x > 233) { b.x = 233; b.vx = -Math.abs(b.vx) * .7; wall(); }
    if (star && Math.hypot(b.x - star.x, b.y - star.y) < 13) { F.spark(star.x, star.y, ['#ffd23c', '#ffffff', '#fff6c8'], 20, 90); star = null; A.add(50); A.beep(1040, .1, 'triangle'); setTimeout(() => A.beep(1560, .14, 'triangle'), 80);
      if (left < MAXB) { left++; say('EXTRA BALL!', '#5fe3d6'); } else say('STAR! +50', '#5fe3d6'); info(); } }
  function wall() { if (!ball.sc) ball.bank = 1; A.beep(200, .03); F.puff(ball.x, ball.y, '#e6ecf5'); }
  /* bounce the ball off a round thing at x,y: the rim ends (rest .62) or the bumper (lively, kicks back) */
  function hit(x, y, rad, rest, bump) { const b = ball, dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy); if (d >= rad || d <= 0) return;
    const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny; b.x = x + nx * rad; b.y = y + ny * rad;
    if (dot < 0) { b.vx = (b.vx - 2 * dot * nx) * rest; b.vy = (b.vy - 2 * dot * ny) * rest; if (bump) { b.vx += nx * 60; b.vy += ny * 60; bmHit = .2; sh = 2; if (!b.sc) b.bank = 1; A.beep(520, .08, 'triangle'); F.spark(x + nx * 9, y + ny * 9, ['#5fe3d6', '#ffffff'], 8, 70); }
      else { if (!b.sc) b.rim = 1; sh = Math.max(sh, 1); A.beep(240, .03); } } }
  setRound(); hx = tx; hb = hy = ty;
  return {
    key(k) { if (k === 'a') throwIt(); }, swipe() {},
    update(dt) { const k = A.keys, ax = (k.right ? 1 : 0) - (k.left ? 1 : 0), ay = (k.down ? 1 : 0) - (k.up ? 1 : 0);
      t += dt; mt -= dt; sh = Math.max(0, sh - dt * 12); sw -= dt; bmHit -= dt; if (intro > 0) intro -= dt;
      hold = ax || ay ? Math.min(1, hold + dt * 1.2) : 0; /* aiming speeds up while a key is held: fine taps, fast sweeps */
      vx0 = clamp(vx0 + ax * (60 + 180 * hold) * dt, -220, 220); vy0 = clamp(vy0 + ay * (70 + 200 * hold) * dt, -520, -200);
      if (cfg.mv) { hx += hv * dt; if (hx < 50) { hx = 50; hv = Math.abs(hv); } if (hx > 190) { hx = 190; hv = -Math.abs(hv); } } else hx += clamp(tx - hx, -170 * dt, 170 * dt);
      hb += clamp(ty - hb, -120 * dt, 120 * dt); hy = hb + (cfg.bob ? Math.sin(t * 1.5) * cfg.bob : 0);
      if (cfg.bump) { bmx += bmv * dt; if (bmx < 30) { bmx = 30; bmv = Math.abs(bmv); } if (bmx > 210) { bmx = 210; bmv = -Math.abs(bmv); } }
      if (wait > 0) { wait -= dt; if (wait <= 0 && end) { A.over(!!win); return; } }
      if (!ball) { if (end) { dr = null; return; }
        if (A.ptr.down && !dr) { const p = A.ptrs[0]; dr = p ? { x: p.x0, y: p.y0 } : { x: A.ptr.x, y: A.ptr.y }; } /* anchor where the finger went down, not where it is a frame later */
        if (dr) { const dx = (dr.x - A.ptr.x) * 4.2, dy = (dr.y - A.ptr.y) * 4.2; if (Math.hypot(dx, dy) > 60) { vx0 = clamp(dx, -220, 220); vy0 = clamp(dy, -520, -200); }
          if (!A.ptr.down) { const far = Math.hypot(dr.x - A.ptr.x, dr.y - A.ptr.y) > 14; dr = null; if (far) throwIt(); } }
        return; }
      dr = null; const b = ball; b.t += dt;
      for (let i = 0; i < 3 && ball; i++) step(dt / 3);
      if (streak >= 3 && !b.sc && !b.dead) F.puff(b.x, b.y, Math.random() < .5 ? '#ff8a1e' : '#ffd23c', -20);
      if (b.y >= FLOOR && b.vy > 0) { F.puff(b.x - 4, 282, '#f0c080', -14); F.puff(b.x + 4, 282, '#f0c080', -14);
        if (b.sc || b.dead) done(b.sc); else { b.y = FLOOR; b.vy *= -.42; b.vx *= .7; b.dead = 1; A.beep(130, .05); } }
      else if (b.t > 7) done(b.sc); },
    draw(g) { const X = Math.round(hx), Y = Math.round(hy), aim = !ball && wait <= 0 && !end;
      g.save(); if (sh > 0) g.translate(Math.round(Math.sin(t * 80) * sh), Math.round(Math.cos(t * 67) * sh * .6));
      /* gym: brick wall, windows, scoreboard, ceiling rail, wooden floor */
      K.scroll(g, K.T.brick(64, 64, '#3a2c66'), 0, 0, 240, 320); g.fillStyle = 'rgba(10,6,30,.25)'; g.fillRect(-4, -4, 248, 328);
      for (const x of [12, 184]) { K.box(g, x, 12, 44, 28, OL); K.box(g, x + 1, 13, 42, 26, '#1b2a55'); K.box(g, x + 1, 13, 42, 3, '#5a7ad0'); K.box(g, x + 21, 13, 2, 26, OL); K.box(g, x + 1, 25, 42, 1, OL); K.box(g, x + 30, 18, 2, 2, '#fff6c8'); K.box(g, x + 8, 30, 1, 1, '#fff6c8'); }
      K.box(g, X - 2, 5, 5, Y - 44, OL); K.box(g, X - 1, 5, 3, Y - 44, '#8a94a4');
      K.box(g, 72, 10, 96, 32, OL); K.box(g, 73, 11, 94, 30, '#171428'); K.box(g, 73, 11, 94, 1, '#59627a'); A.text(g, 'ROUND ' + (r + 1), 120, 15, '#5fe3d6', 2, 'center');
      for (let i = 0, n = need(); i < n; i++) { const x = 121 - n * 7 + i * 14; K.box(g, x, 29, 10, 8, OL); K.box(g, x + 1, 30, 8, 6, i < got ? '#ffd23c' : '#3a3550'); if (i < got) K.box(g, x + 2, 31, 3, 2, '#fff6c8'); }
      K.put(g, K.spr('hoop-shot:flags', 240, 9, q => { ['#e8231e', '#ffd23c', '#5fe3d6', '#f2f5f8'].forEach((c, i) => { for (let x = -120 + i * 20; x < 120; x += 80) K.part(q, [x + 2, -5, x + 18, -5, x + 10, 4], c); }); }, { ol: 0 }), 120, 9);
      for (let x = -4; x < 244; x += 62) g.drawImage(K.block(62, 38, '#2a4a8a'), x, 246);
      K.box(g, -4, 0, 248, 5, OL); K.box(g, -4, 0, 248, 3, '#8a94a4'); K.box(g, -4, 0, 248, 1, '#d6dbea');
      const fl = K.T.wood(64, 64); for (let x = -64; x < 300; x += 64) g.drawImage(fl, 0, 0, 64, 40, x, 286, 64, 40); K.box(g, -4, 286, 248, 2, '#f0c080'); K.box(g, -4, 284, 248, 2, OL); K.box(g, -4, 298, 248, 2, '#f2f5f8');
      K.box(g, BX - 12, 287, 24, 1, '#f2f5f8'); K.box(g, BX - 9, 289, 18, 1, '#f2f5f8');
      /* wind: streaks in the air and arrows under the scoreboard */
      if (wind) { const d = wind > 0 ? 1 : -1, n = Math.abs(wind) > 55 ? 3 : Math.abs(wind) > 38 ? 2 : 1; g.fillStyle = 'rgba(214,230,255,.5)';
        for (let i = 0; i < 7; i++) { const x = (((i * 71 + t * wind * 1.6) % 280) + 280) % 280 - 20; g.fillRect(Math.round(x), 60 + i * 29, 9 + i % 3 * 3, 1); }
        A.text(g, 'WIND', 120, 47, OL, 1, 'center'); A.text(g, 'WIND', 120, 46, '#d6e6ff', 1, 'center');
        for (let i = 0; i < n; i++) { const x = 120 + d * (16 + i * 7 + Math.floor(t * 4) % 2); for (let j = -2; j < 3; j++) K.box(g, x - d * Math.abs(j), 48 + j, 2, 1, '#5fe3d6'); } }
      /* hoop (it hangs from the rail on the pole drawn above) */
      K.box(g, X - 2, Y - 12, 5, 12, OL); K.box(g, X - 1, Y - 12, 3, 12, '#8a94a4');
      K.put(g, K.spr('hoop-shot:board', 50, 38, q => { K.box(q, -25, -19, 50, 38, '#f2f5f8'); K.box(q, -25, -19, 50, 3, '#ffffff'); K.box(q, -25, 16, 50, 3, '#aab4c2'); K.box(q, -23, -17, 46, 34, '#e6ecf5'); for (const [a, b, c, d] of [[-10, -2, 20, 2], [-10, -2, 2, 16], [8, -2, 2, 16], [-10, 12, 20, 2]]) K.box(q, a, b, c, d, '#e8231e'); }), X, Y - 30);
      if (star) K.put(g, K.star2('#ffd23c', 15), star.x, star.y + Math.round(Math.sin(t * 4) * 2));
      if (cfg.bump) { K.shadow(g, bmx + 2, 203, 8, 2); K.put(g, K.spr('hoop-shot:bump', 20, 20, q => { K.ell(q, 0, 0, 10, 10, K.rad(q, -3, -3, 1, 14, '#c8fffa', '#2fc4ba', '#0e6a72')); K.ell(q, 0, 0, 6, 6, '#f2f5f8'); K.ell(q, 0, 0, 3.4, 3.4, '#ff8a9a'); K.box(q, -6, -7, 3, 2, '#ffffff'); }), bmx, 190, bmHit > 0 ? { sc: 1.2 } : null); }
      /* aim dots (they bend with the wind) and the slingshot pull */
      if (aim) { const n = r < 2 ? 18 : r < 5 ? 14 : 11; for (let i = 1; i <= n; i++) { const q = i * .07, a = Math.round(BX + vx0 * q + wind * q * q / 2), b = Math.round(BY + vy0 * q + G * q * q / 2); K.box(g, a - 2, b - 2, 5, 5, OL); K.box(g, a - 1, b - 1, 3, 3, intro > 0 ? '#8a94a4' : i % 2 ? '#ffffff' : '#ffd23c'); }
        if (dr) K.put(g, K.ball(3, '#ffd23c'), A.ptr.x, A.ptr.y); }
      const bx = ball ? ball.x : BX - (dr ? vx0 * .03 : 0), by = ball ? ball.y : BY - (dr ? vy0 * .025 : 0), under = ball && ball.up && ball.y > hy;
      const drawBall = () => { K.shadow(g, bx, 284, clamp(8 - (FLOOR - by) / 40, 3, 7), 2);
        K.put(g, K.spr('hoop-shot:ball', 14, 14, q => { K.ell(q, 0, 0, 7, 7, K.rad(q, -2.5, -2.5, .5, 10, '#ffc890', '#ff8a1e', '#a04a0a')); K.box(q, -7, 0, 14, 1, '#5a2a08'); K.box(q, 0, -7, 1, 14, '#5a2a08'); q.strokeStyle = '#5a2a08'; q.lineWidth = 1; q.beginPath(); q.arc(-9, 0, 6, -1, 1); q.stroke(); q.beginPath(); q.arc(9, 0, 6, 2.1, 4.2); q.stroke(); }), bx, by, { rot: Math.round(bx / 9) * .8 });
        if (by < -8) { for (let j = 0; j < 4; j++) K.box(g, Math.round(bx) - j, 8 + j, 1 + j * 2, 1, '#ffd23c'); } };
      if (under && !end) drawBall();
      /* net (stretches on a basket) and rim, in front of a ball that is dropping through */
      const st = sw > 0 ? 2 : 0; g.fillStyle = '#f2f5f8';
      for (let j = 0; j < 3; j++) { const w = 15 - j * 2.5, y = Y + 3 + j * (5 + st); g.fillRect(Math.round(X - w), y + 5 + st, Math.round(w * 2) + 1, 1); for (let i = 0; i < 6; i++) g.fillRect(Math.round(X + (i - 2.5) / 2.5 * (w - ((i + j) % 2 ? 0 : 1.5))), y, 1, 5 + st); }
      K.put(g, K.spr('hoop-shot:rim', 38, 6, q => { K.rr(q, -19, -3, 38, 6, 3, K.lin(q, 0, -3, 0, 3, '#ffc070', '#ff8a1e', '#b8520a')); }), X, Y);
      if (!under && !end) drawBall();
      F.draw(g);
      /* balls left, streak, messages */
      for (let i = 0; i < left - (end ? 0 : 1); i++) K.put(g, K.ball(4, '#ff8a1e'), 10 + i * 11, 310);
      if (streak > 1) { A.text(g, 'X' + Math.min(streak, 5), 231, 305, OL, 2, 'right'); A.text(g, 'X' + Math.min(streak, 5), 230, 304, streak > 2 ? '#ff8a1e' : '#ffd23c', 2, 'right'); }
      if (intro > 0 && !end) { K.box(g, 0, 196, 240, 34, 'rgba(10,6,30,.72)'); K.box(g, 0, 196, 240, 1, '#5fe3d6'); K.box(g, 0, 229, 240, 1, '#5fe3d6'); A.text(g, 'ROUND ' + (r + 1), 120, 201, '#ffffff', 2, 'center'); A.text(g, cfg.n, 120, 216, '#ffd23c', 2, 'center'); }
      if (mt > 0) { const y = 150 - Math.round((1 - mt) * 14), s = msg.length > 9 ? 2 : 3; A.text(g, msg, 121, y + 1, OL, s, 'center'); A.text(g, msg, 120, y, mcol, s, 'center'); }
      g.restore(); }
  };
} });
