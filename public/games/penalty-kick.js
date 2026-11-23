/* Penalty Kick — cup shoot-out: 8 rounds of 5 kicks, score 3 to go through. The keeper sways and dives where you shoot, so aim away from him. Later rounds add a bonus target, a wall, wind and a wobbly aim. */
Arcade.game('penalty-kick', { w: 240, h: 320, pad: 'dpad', a: 'SHOOT',
help: 'Win the cup! Every round is 5 kicks: score 3 to go through, miss 3 and you are out. Move the red target with the mouse or the arrow keys and shoot with a click or Space. On a touch screen, hold your finger on the goal, slide to aim and let go to shoot. The keeper sways from side to side and dives after your shot, so shoot at the side he is moving away from. Hit the post or go wide and it is a miss. Later rounds add a wall of dummies (shoot over it or around it - the dark patch in the goal is blocked), wind that bends the ball and a wobbly aim. Hit the star target for a bonus. Goals in a row score more.',
init(A) {
  const K = Art, F = K.fx(), OL = '#140e1c', GX0 = 44, GX1 = 196, GY0 = 44, GY1 = 112, HI = GY0 + 24, T = .45, NEED = 3, KICKS = 5;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  /* rounds: tg = bonus target, wall = dummies in the wall, mv = wall slides, wind = max wind, wob = aim wobbles */
  const R = [{ n: 'KICK OFF', h: 'SCORE 3 OF YOUR 5 KICKS' }, { n: 'BULLSEYE', h: 'HIT THE STAR FOR A BONUS', tg: 1 }, { n: 'QUICK HANDS', h: 'THE KEEPER IS FASTER NOW', tg: 1 },
    { n: 'THE WALL', h: 'SHOOT OVER IT OR AROUND IT', tg: 1, wall: 2 }, { n: 'WINDY DAY', h: 'THE WIND BENDS YOUR SHOT', tg: 1, wind: 2 }, { n: 'BIG WALL', h: 'AIM HIGH OR GO WIDE', tg: 1, wall: 3 },
    { n: 'SHAKY BOOTS', h: 'YOUR AIM WOBBLES - TIME IT', tg: 1, wob: 1, wind: 1 }, { n: 'CUP FINAL', h: 'EVERYTHING AT ONCE - GOOD LUCK', tg: 1, wall: 2, mv: 1, wind: 2, wob: 1 }];
  const KIT = ['#ffd23c', '#5fe3d6', '#ff8a1e', '#b06ae0'];
  let r = 0, cfg = R[0], ph = 'msg', pt = 0, then = null, msg = null, tm = 0, shots = 0, goals = 0, streak = 0, marks = [];
  let aim = { x: 120, y: 78 }, ball = null, kp = { x: 120, y: 90, tx: 120, ty: 90, rd: 0, dive: 0, ln: 0, dl: 0 }, kv = {}, wind = 0, wx = 120, tg = null;
  let sh = 0, net = 0, cheer = 0, held = 0, blockP = 0, kick = 0, wHit = 0, pop = '', popT = 0;
  const info = () => A.info('ROUND ' + (r + 1) + ' OF ' + R.length);
  const hw = () => cfg.wall * 6 + 4, wallX = t => cfg.mv ? 120 + Math.sin((t == null ? tm : t) * .8) * 24 : wx;
  const ax = () => clamp(aim.x + (cfg.wob ? Math.sin(tm * 3.1) * 9 : 0), 24, 216), ay = () => clamp(aim.y + (cfg.wob ? Math.cos(tm * 2.3) * 6 : 0), 26, 110);
  const tune = (f, i) => setTimeout(() => A.beep(f, .12, 'triangle'), i * 110);
  /* show a banner for a while, then carry on */
  function hold(a, b, c, col, secs, fn) { msg = { a, b, c, col }; ph = 'msg'; pt = secs; then = fn; }
  function setKick() { ball = null; msg = null; kp.dive = 0; kp.ty = 90; ph = 'aim';
    wind = cfg.wind ? (Math.random() < .5 ? -1 : 1) * A.ri(1, cfg.wind) : 0; wx = 120 + A.rnd(-22, 22);
    tg = cfg.tg ? { x: Math.random() < .5 ? A.rnd(GX0 + 12, GX0 + 44) : A.rnd(GX1 - 44, GX1 - 12), y: A.rnd(GY0 + 11, GY1 - 16) } : null; }
  function setRound() { cfg = R[r]; const d = r / (R.length - 1); kv = { rd: .36 - .23 * d, sp: 60 + 95 * d, amp: 14 + 28 * d, fr: 1.4 + 1.2 * d };
    shots = goals = 0; marks = []; ball = null; tg = null; wind = 0; kp.dive = 0; info(); hold('ROUND ' + (r + 1), cfg.n, cfg.h, '#ffffff', r ? 2.1 : 1.7, setKick); }
  function shoot() { if (ph !== 'aim') return; ball = { t: 0, sx: ax(), sy: ay(), sh: wind * 8, x: 120, y: 270, r: 7, st: 0, vx: 0, vy: 0, past: 0, hide: 0 };
    ph = 'fly'; kp.rd = kv.rd; kick = .3; A.beep(300, .08); for (let i = 0; i < 4; i++) F.puff(116 + i * 3, 276, '#bfe8a0', -12); }
  /* the kick is over: s = banner word, ok = goal */
  function finish(s, ok, sub) { const b = ball; b.st = 1; shots++; marks.push(ok); if (!ok) streak = 0;
    const out = shots - goals >= KICKS - NEED + 1;
    hold(s, sub || '', '', ok ? '#ffd23c' : '#ffffff', ok ? 1.4 : 1.2, () => {
      if (out) { hold('KNOCKED OUT', 'ROUND ' + (r + 1) + ' WAS TOO TOUGH', '', '#ff8a9a', 1.5, () => A.over(false)); A.beep(110, .4, 'sawtooth'); }
      else if (shots < KICKS) setKick();
      else { const pf = goals === KICKS, bonus = 150 * (r + 1) + (pf ? 300 : 0); A.add(bonus); cheer = 1.4; ball = null; tg = null; [660, 880, 1100].forEach(tune);
        for (let i = 0; i < 3; i++) F.spark(40 + i * 80, 150, ['#ffd23c', '#5fe3d6', '#ff8a9a', '#ffffff'], 18, 130);
        if (r === R.length - 1) { A.add(1000); [1320, 1100, 1320, 1760].forEach((f, i) => tune(f, i + 3)); hold('CUP WINNER!', 'YOU WON THE FALCON CUP', 'BONUS ' + (bonus + 1000), '#ffd23c', 2.6, () => A.over(true)); }
        else hold(pf ? 'PERFECT!' : 'THROUGH!', 'BONUS ' + bonus, '', '#5fe3d6', 1.5, () => { r++; setRound(); }); } }); }
  /* the keeper saves what his body or stretched arms touch: a line from boots to gloves, tilted the way he leans */
  function land() { const b = ball, x = b.x, y = b.y, ux = Math.sin(kp.ln), uy = -Math.cos(kp.ln), ks = clamp((x - kp.x) * ux + (y - kp.y + 2) * uy, -18, 22), fx = (b.sx + b.sh - 120) / T, fy = (b.sy - 270) / T;
    const inX = x > GX0 + 1 && x < GX1 - 1, post = y > GY0 - 6 && (Math.abs(x - GX0 + 2) <= 4 || Math.abs(x - GX1 - 2) <= 4), bar = y >= GY0 - 6 && y <= GY0 + 1 && x > GX0 - 7 && x < GX1 + 7;
    if (post || bar) { b.vx = bar ? fx * .3 : -fx * .5; b.vy = 150; sh = 4; A.beep(620, .07, 'square'); setTimeout(() => A.beep(410, .12, 'square'), 70); F.spark(x, y, ['#ffffff', '#d6dbea'], 10, 80); finish(bar ? 'CROSSBAR!' : 'POST!', 0, 'SO CLOSE'); }
    else if (!inX || y < GY0) { b.vx = fx * .5; b.vy = fy * .5; b.hide = 1; A.beep(160, .25, 'sawtooth'); finish(inX ? 'OVER!' : 'WIDE!', 0, 'KEEP IT IN THE GOAL'); }
    else if (Math.hypot(x - kp.x - ux * ks, y - kp.y + 2 - uy * ks) < 11) { b.vx = (x < kp.x ? -1 : 1) * A.rnd(50, 110); b.vy = A.rnd(60, 130); sh = 3; A.beep(200, .25, 'sawtooth'); for (let i = 0; i < 6; i++) F.puff(x + A.rnd(-5, 5), y + A.rnd(-5, 5), '#f2f5f8', -10); finish('SAVED!', 0, 'AIM AWAY FROM THE KEEPER'); }
    else { goals++; streak++; const m = Math.min(streak, 5), bull = tg && Math.hypot(x - tg.x, y - tg.y) < 11, pts = 100 * m + (bull ? 200 : 0); A.add(pts); b.vy = 55; net = .4; cheer = 1.2; sh = 3;
      A.beep(880, .3, 'triangle'); if (bull) { tune(1320, 1); tune(1760, 2); F.spark(tg.x, tg.y, ['#ffd23c', '#fff6c8', '#ffffff'], 26, 110); tg = null; }
      F.spark(x, y, ['#ffd23c', '#ffffff', '#3fd45a', '#e8231e'], 30, 130); pop = '+' + pts; popT = 1; finish('GOAL!', 1, bull ? 'BULLSEYE BONUS!' : m > 1 ? m + ' IN A ROW!' : ''); } }
  setRound();
  return {
    key(k) { if (k === 'a') shoot(); }, swipe() {}, tap(x, y) { if (ph === 'aim' && !blockP) { aim.x = clamp(x, 24, 216); aim.y = clamp(y, 26, 110); held = 0; shoot(); } },
    update(dt) { const k = A.keys, p = A.ptr; tm += dt; sh = Math.max(0, sh - dt * 12); net -= dt; cheer -= dt; kick -= dt; wHit -= dt; popT -= dt;
      aim.x = clamp(aim.x + ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 120 * dt, 24, 216); aim.y = clamp(aim.y + ((k.down ? 1 : 0) - (k.up ? 1 : 0)) * 120 * dt, 26, 110);
      if (p.moved || p.down) { aim.x = clamp(p.x, 24, 216); aim.y = clamp(p.y, 26, 110); }
      /* touch and mouse: press, slide to aim, let go to shoot (a press that began before aiming does not count) */
      if (ph !== 'aim') { blockP = p.down; held = 0; } else if (p.down) { if (!blockP) held = 1; } else { blockP = 0; if (held) { held = 0; shoot(); } }
      if (ph === 'msg') { pt -= dt; if (pt <= 0) { const f = then; then = null; msg = null; ph = ''; if (f) f(); if (!ph) return; } }
      /* keeper: sways while you aim, waits a moment after the kick, then dives at the ball */
      if (ph === 'aim') kp.tx = 120 + Math.sin(tm * kv.fr) * kv.amp; else if (ph === 'fly') { kp.rd -= dt; if (kp.rd <= 0 && !kp.dive) { kp.dive = 1; kp.tx = clamp(ball.sx + ball.sh, GX0 + 10, GX1 - 10); kp.dl = clamp((kp.tx - kp.x) / 40, -1, 1) * 1.2; kp.ty = clamp(ball.sy + 2, GY0 + 18, GY1 - 16); } }
      else if (!ball || pt < .35) { kp.tx = 120; kp.ty = 90; kp.dive = 0; }
      if (ph !== 'fly' || kp.dive) { const s = (kp.dive ? kv.sp : 130) * dt, dx = kp.tx - kp.x, dy = kp.ty - kp.y, d = Math.hypot(dx, dy); if (d > s) { kp.x += dx / d * s; kp.y += dy / d * s; } else { kp.x = kp.tx; kp.y = kp.ty; } }
      if (!kp.dive) kp.dl = clamp((kp.tx - kp.x) / 22, -1, 1) * .4; kp.ln += clamp(kp.dl - kp.ln, -7 * dt, 7 * dt);
      const b = ball; if (!b) return;
      if (!b.st) { b.t = Math.min(1, b.t + dt / T); const t = b.t, w = cfg.wall && !b.past && t >= .5; if (w) b.t = .5; const q = b.t;
        b.x = 120 + (b.sx - 120) * q + b.sh * q * q; b.y = 270 + (b.sy - 270) * q - Math.sin(q * Math.PI) * 14; b.r = Math.round(7 - 3 * q);
        if (w) { b.past = 1; if (Math.abs(b.x - wallX()) < hw() && b.sy > HI) { b.vx = A.rnd(-40, 40); b.vy = 120; wHit = .4; sh = 3; A.beep(140, .2, 'square'); F.spark(b.x, b.y, ['#aab4c2', '#ffffff'], 10, 70); finish('BLOCKED!', 0, 'GO OVER OR AROUND THE WALL'); } else b.t = t; }
        else if (q >= 1) land(); }
      else { b.x += b.vx * dt; b.y += b.vy * dt; const f = 1 - Math.min(1, dt * 3.5); b.vx *= f; if (b.hide) { if (b.y < 30 || b.x < 4 || b.x > 236) b.r = 0; } else if (marks[marks.length - 1]) { if (b.y > GY1 - 6) { b.y = GY1 - 6; b.vy = 0; } } else b.vy *= f; } },
    draw(g) { const b = ball, hop = cheer > 0 ? Math.floor(tm * 9) % 2 : 0;
      g.save(); if (sh > 0) g.translate(Math.round(Math.sin(tm * 80) * sh), Math.round(Math.cos(tm * 67) * sh * .6));
      /* pitch, crowd (hops after a goal), boards, lines */
      K.scroll(g, K.T.grass(64, 64), 0, 0, 240, 320); g.fillStyle = 'rgba(0,40,0,.14)'; for (let y = 0; y < 320; y += 48) g.fillRect(-4, y, 248, 24);
      K.box(g, -4, -4, 248, 36, '#2a2f3d'); g.drawImage(K.tex('penalty-kick:crowd', 240, 30, { base: '#2a2f3d', L: 8, specks: [['#e8231e', 220, 2, 2], ['#ffd23c', 200, 2, 2], ['#3fa8e0', 200, 2, 2], ['#f2f5f8', 240, 2, 2], ['#f0b890', 260, 2, 1]] }), 0, 1 - hop * 2);
      K.box(g, -4, 30, 248, 6, '#12141c'); for (let x = 0; x < 240; x += 48) { K.box(g, x + 2, 31, 44, 4, x % 96 ? '#e8231e' : '#3f6ad0'); K.box(g, x + 8, 32, 32, 2, '#f2f5f8'); }
      for (const [a, c, d, e] of [[20, 112, 200, 2], [20, 112, 2, 110], [218, 112, 2, 110], [20, 220, 200, 2], [70, 112, 100, 2]]) K.box(g, a, c, d, e, '#e6f5e6'); K.box(g, 118, 268, 4, 4, '#e6f5e6');
      /* goal: net (shakes on a goal), the patch the wall blocks, bonus target, frame */
      const ns = net > 0 ? Math.floor(tm * 30) % 2 : 0; K.box(g, GX0, GY0, GX1 - GX0, GY1 - GY0, 'rgba(8,30,14,.55)'); g.fillStyle = 'rgba(230,245,230,.4)';
      for (let x = GX0 + 4 - ns; x < GX1; x += 6) g.fillRect(x, GY0, 1, GY1 - GY0); for (let y = GY0 + 4 + ns; y < GY1; y += 6) g.fillRect(GX0, y, GX1 - GX0, 1);
      const WX = Math.round(wallX()); /* while aiming, the blocked patch shows where a sliding wall will be when the ball gets there */
      if (cfg.wall && ph !== 'msg' || cfg.wall && b) { const c = 2 * (ph === 'aim' ? wallX(tm + T / 2) : WX) - 120 - wind * 4, x0 = clamp(c - 2 * hw(), GX0, GX1), x1 = clamp(c + 2 * hw(), GX0, GX1); K.box(g, x0, HI, x1 - x0, GY1 - HI, 'rgba(10,8,24,.62)');
        g.fillStyle = 'rgba(255,138,154,.55)'; for (let x = x0 + 2; x < x1 - 2; x += 6) g.fillRect(x, HI, 3, 1); }
      if (tg) { const s = 1 + (Math.floor(tm * 4) % 2) * .12; K.put(g, K.spr('penalty-kick:tg', 22, 22, q => { K.ell(q, 0, 0, 11, 11, '#e8231e'); K.ell(q, 0, 0, 8, 8, '#f2f5f8'); K.ell(q, 0, 0, 5, 5, '#e8231e'); }), tg.x, tg.y); K.put(g, K.star2('#ffd23c', 11), tg.x, tg.y, { sc: s }); }
      for (const [a, c, d, e] of [[GX0 - 5, GY0 - 5, GX1 - GX0 + 10, 5], [GX0 - 5, GY0 - 5, 5, GY1 - GY0 + 5], [GX1, GY0 - 5, 5, GY1 - GY0 + 5]]) { K.box(g, a, c, d, e, OL); K.box(g, a + 1, c + 1, d - 2, e - 2, '#f2f5f8'); K.box(g, a + 1, c + e - 2, d - 2, 1, '#aab4c2'); }
      /* keeper: stands with arms out, stretches when he dives; a new kit every round */
      const col = KIT[r % 4], dv = kp.dive ? 1 : 0;
      const kpr = K.spr('penalty-kick:kp' + dv + col, 50, 48, q => { K.box(q, -5, 8, 4, 12, '#1b1e29'); K.box(q, 1, 8, 4, 12, '#1b1e29'); K.box(q, -6, 19, 5, 3, '#f2f5f8'); K.box(q, 1, 19, 5, 3, '#f2f5f8');
        K.rr(q, -8, -8, 16, 18, 3, K.lin(q, -8, 0, 8, 0, K.lite(col, .5), col, K.dark(col, .3))); K.box(q, -8, 6, 16, 3, '#1b1e29'); K.box(q, -2, -4, 4, 6, '#f2f5f8');
        if (dv) { K.part(q, [-8, -7, -13, -21, -8, -22, -3, -8], col); K.part(q, [8, -7, 13, -21, 8, -22, 3, -8], K.dark(col, .15)); K.rr(q, -15, -24, 8, 7, 2, '#f2f5f8'); K.rr(q, 7, -24, 8, 7, 2, '#f2f5f8'); }
        else { K.part(q, [-8, -7, -20, -12, -20, -7, -8, -1], col); K.part(q, [8, -7, 20, -12, 20, -7, 8, -1], K.dark(col, .15)); K.rr(q, -24, -14, 7, 8, 2, '#f2f5f8'); K.rr(q, 17, -14, 7, 8, 2, '#f2f5f8'); }
        K.ell(q, 0, -14, 5.4, 5.4, '#f0b890'); K.box(q, -5, -20, 10, 4, '#5a3418'); K.box(q, -3, -15, 2, 2, '#1a1222'); K.box(q, 1, -15, 2, 2, '#1a1222'); K.box(q, -2, -11, 4, 1, '#a05a3a'); });
      K.shadow(g, kp.x, GY1 + 2, 12, 3); K.put(g, kpr, kp.x, kp.y - 2, { rot: kp.ln });
      /* wall of training dummies, ball (behind the wall once it is past it), kicker */
      const drawBall = () => { const x = b ? b.x : 120, y = b ? b.y : 270, rr = b ? b.r : 7; if (!rr) return; if (!b || !b.hide) K.shadow(g, x, b && !b.st ? y + rr + 2 + Math.sin(b.t * Math.PI) * 14 : y + rr + 1, rr, 2);
        K.put(g, K.spr('penalty-kick:ball' + rr, 2 * rr, 2 * rr, q => { K.ell(q, 0, 0, rr, rr, K.rad(q, -rr * .3, -rr * .3, rr * .1, rr * 1.5, '#ffffff', '#d6dbea', '#8a94a4')); K.ell(q, 0, 0, rr * .34, rr * .34, '#1a1222'); for (const a of [.6, 2.2, 3.8, 5.4]) K.ell(q, Math.cos(a) * rr * .8, Math.sin(a) * rr * .8, rr * .22, rr * .22, '#1a1222'); }), x, y); };
      const far = b && b.past && !(wHit > 0 || msg && msg.a === 'BLOCKED!'); if (far) drawBall();
      if (cfg.wall) for (let i = 0; i < cfg.wall; i++) { const x = WX + (i - (cfg.wall - 1) / 2) * 12; K.shadow(g, x, 189, 6, 2);
        K.put(g, K.spr('penalty-kick:dummy', 12, 34, q => { K.box(q, -5, 14, 10, 3, '#59627a'); K.box(q, -1, 6, 2, 9, '#8a94a4'); K.rr(q, -5, -9, 10, 17, 3, K.lin(q, -5, 0, 5, 0, '#8ab4ff', '#3f6ad0', '#24408a')); K.ell(q, 0, -13, 4, 4, '#3f6ad0'); K.box(q, -2, -15, 2, 2, '#b8d0ff'); K.box(q, -4, -3, 8, 2, '#f2f5f8'); }), x, 172, wHit > 0 ? { rot: Math.sin(tm * 40 + i) * .25 } : null); }
      const kx = kick > 0 || b ? 109 : 100, ky = kick > 0 || b ? 283 : 291, leg = kick > 0 ? 1 : 0;
      K.shadow(g, kx, ky + 14, 8, 2); K.put(g, K.spr('penalty-kick:me' + leg, 20, 28, q => { K.box(q, -5, 5, 4, 8, '#f0b890'); K.box(q, 1, leg ? 2 : 5, 4, leg ? 6 : 8, '#f0b890'); K.box(q, -6, 11, 5, 3, '#f2f5f8'); K.box(q, leg ? 2 : 1, leg ? 0 : 11, 5, 3, '#f2f5f8'); K.box(q, -6, 1, 12, 5, '#f2f5f8');
        K.rr(q, -7, -9, 14, 11, 3, K.lin(q, -7, 0, 7, 0, '#ff6a5a', '#e8231e', '#a01410')); K.box(q, -10, -8, 3, 8, '#e8231e'); K.box(q, 7, -8, 3, 8, '#c01a16'); K.box(q, -2, -6, 4, 5, '#f2f5f8'); K.ell(q, 0, -11, 4.6, 4.2, '#5a3418'); }), kx, ky);
      if (!far) drawBall();
      /* wind: streaks across the pitch and arrows under the goal */
      if (wind && (ph === 'aim' || b)) { const d = wind > 0 ? 1 : -1, n = Math.abs(wind); g.fillStyle = 'rgba(230,245,255,.5)';
        for (let i = 0; i < 6; i++) { const x = (((i * 71 + tm * wind * 70) % 280) + 280) % 280 - 20; g.fillRect(Math.round(x), 126 + i * 24, 9 + i % 3 * 3, 1); }
        A.text(g, 'WIND', 121, 123, OL, 1, 'center'); A.text(g, 'WIND', 120, 122, '#d6e6ff', 1, 'center');
        for (let i = 0; i < n; i++) { const x = 120 + d * (16 + i * 7 + Math.floor(tm * 4) % 2); for (let j = -2; j < 3; j++) K.box(g, x - d * Math.abs(j), 124 + j, 2, 1, '#5fe3d6'); } }
      if (ph === 'aim') { const x = Math.round(ax()), y = Math.round(ay()), q = Math.floor(tm * 5) % 2; for (const [a, c, d, e] of [[-9 - q, -1, 6, 3], [4 + q, -1, 6, 3], [-1, -9 - q, 3, 6], [-1, 4 + q, 3, 6]]) { K.box(g, x + a, y + c, d, e, OL); K.box(g, x + a + 1, y + c + 1, d - 2, e - 2, '#ff4a3a'); } K.box(g, x, y, 1, 1, '#ffffff'); }
      F.draw(g);
      if (popT > 0 && b) { const y = Math.max(40, b.sy - 14 - Math.round((1 - popT) * 12)); A.text(g, pop, b.x + 1, y + 1, OL, 2, 'center'); A.text(g, pop, b.x, y, '#ffffff', 2, 'center'); }
      /* kicks of this round, goals needed, streak */
      K.box(g, 56, 296, 128, 18, 'rgba(13,11,20,.6)'); for (let i = 0; i < KICKS; i++) K.put(g, K.ball(5, i < marks.length ? (marks[i] ? '#3fd45a' : '#e8231e') : '#59627a'), 94 + i * 13, 304);
      A.text(g, 'GOALS', 60, 299, '#aab4c2', 1); A.text(g, goals + ' OF ' + NEED, 60, 306, goals >= NEED ? '#3fd45a' : '#ffffff', 1);
      if (streak > 1) A.text(g, 'X' + Math.min(streak, 5), 180, 300, streak > 2 ? '#ff8a1e' : '#ffd23c', 2, 'right');
      if (msg) { const s = msg.a.length > 9 ? 3 : 4, h = 22 + (msg.b ? 15 : 0) + (msg.c ? 10 : 0), y = 236 - (h >> 1); K.box(g, -4, y - 8, 248, h + 14, 'rgba(13,11,20,.8)'); K.box(g, -4, y - 8, 248, 2, '#ffd23c'); K.box(g, -4, y + h + 4, 248, 2, '#ffd23c');
        A.text(g, msg.a, 122, y + 2, OL, s, 'center'); A.text(g, msg.a, 120, y, msg.col, s, 'center'); if (msg.b) A.text(g, msg.b, 120, y + 25, '#5fe3d6', 2, 'center'); if (msg.c) A.text(g, msg.c, 120, y + 41, '#d6dbea', 1, 'center'); }
      g.restore(); }
  };
} });
