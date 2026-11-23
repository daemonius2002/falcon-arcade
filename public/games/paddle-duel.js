/* Paddle Duel — a five-court cup: beat each rival paddle to 5 points. Bumpers, power stars and sliding gates
   arrive court by court. A second player can grab the top paddle at any time (A/D or the top half of the screen). */
Arcade.game('paddle-duel', { w: 240, h: 320, arrowsOnly: true,
help: 'Win the cup: beat five rival paddles, each on a new court. First to five points takes the match. Move your blue paddle with a finger, the mouse or the arrow keys. Hit the ball with the edge of the paddle to steer it, long rallies score more. Later courts add bumpers, sliding gates and power stars: knock the ball through a star for a BIG paddle, to turn the rival to slow ICE or to give the ball a TURBO boost. You have three hearts, losing a match costs one. Two players: the second player touches the top half of the screen or uses A and D, the computer takes over again when they stop.',
init(A) {
  const K = Art, F = K.fx(), W = 240, PY = [18, 304], WIN = 5, ME = '#2fc4ba';
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  /* col: rival + wall colour, ai: rival speed, see: how early it reads the ball, err: its aim error, sp/max: ball speed */
  const COURTS = [
    { name: 'TRAINING HALL', tip: 'FIRST TO FIVE POINTS WINS', col: '#e8231e', floor: '#123a4a', ai: 60, see: 130, err: 24, sp: 150, max: 270 },
    { name: 'BUMPER COURT', tip: 'WATCH THE BUMPERS!', col: '#ff9a2a', floor: '#1c3460', ai: 90, see: 150, err: 19, sp: 165, max: 330, bump: 1 },
    { name: 'STAR COURT', tip: 'HIT A STAR FOR A POWER!', col: '#b05ae8', floor: '#2c2458', ai: 108, see: 175, err: 15, sp: 175, max: 350, stars: 1 },
    { name: 'SLIDING GATES', tip: 'MIND THE GATES!', col: '#3fa84a', floor: '#14403a', ai: 126, see: 205, err: 12, sp: 185, max: 370, gates: 1, stars: 1 },
    { name: 'CHAMPION CUP', tip: 'BEAT THE CHAMPION!', col: '#ffd23c', floor: '#4a2034', ai: 146, see: 240, err: 9, sp: 195, max: 390, bump: 1, gates: 1, stars: 1 }];
  const POW = { big: ['#58d868', 'BIG!'], ice: ['#7fd8ff', 'ICE!'], zoom: ['#ff9a2a', 'TURBO!'] }, PK = Object.keys(POW);
  const arrow = K.spr('paddle-duel-arrow', 12, 8, g => K.part(g, [-6, -4, 6, -4, 0, 4], '#fff6c8'));
  const cup = K.spr('paddle-duel-cup', 14, 14, g => { K.part(g, [-5, -7, 5, -7, 3, 1, -3, 1], K.lin(g, -5, 0, 5, 0, '#fff6c8', '#ffd23c', '#c8801e')); K.box(g, -7, -6, 2, 4, '#ffd23c'); K.box(g, 5, -6, 2, 4, '#ffd23c'); K.box(g, -1, 1, 2, 3, '#c8801e'); K.box(g, -4, 4, 8, 3, '#ffd23c'); });

  /* side 0 = top (rival or player two), side 1 = bottom (you) */
  const px = [120, 120], sc = [0, 0], big = [0, 0], ice = [0, 0], kick = [0, 0];
  let round = 0, hearts = 3, C = COURTS[0], phase = 'intro', tmr = 2.4, t = 0, human = 0, two = false, duo = false;
  let b = { x: 120, y: 160, vx: 0, vy: 0, d: 1, zoom: false }, sp = 0, rally = 0, aim = 0, shake = 0, sx = 0, sy = 0;
  let bumps = [], gates = [], star = null, starT = 4, trail = [], msgs = [], banner = [];
  const pw = i => big[i] > 0 ? 68 : 48;
  const say = (s, x, y, c) => msgs.push({ s, x, y, c, t: 1.1 });
  const hud = () => A.info('Court ' + Math.min(5, round + 1) + '/5' + (two ? ' · 2P' : ''));

  function startMatch() {
    C = COURTS[round]; duo = two; sc[0] = sc[1] = 0; big[0] = big[1] = ice[0] = ice[1] = 0; px[0] = px[1] = 120; star = null; starT = 4; trail = [];
    bumps = C.bump ? [{ x: 60, y: 160, f: 0 }, { x: 180, y: 160, f: 0 }] : [];
    gates = C.gates ? [{ x: 120, y: C.bump ? 100 : 118, ph: 0, f: 0 }, { x: 120, y: C.bump ? 220 : 202, ph: 2.6, f: 0 }] : [];
    b = { x: 120, y: 160, vx: 0, vy: 0, d: 1, zoom: false };
    phase = 'intro'; tmr = 2.4; banner = ['COURT ' + (round + 1) + ' OF 5', C.name, C.tip]; hud(); A.beep(520, .08, 'triangle'); }
  function serve(d) {
    b = { x: 120, y: 160, vx: 0, vy: 0, d, zoom: false }; sp = C.sp; rally = 0; trail = []; aim = A.rnd(-C.err, C.err); phase = 'serve'; tmr = 1;
    if (Math.max(sc[0], sc[1]) === WIN - 1) say('MATCH POINT!', 120, 128, '#ffd23c'); }
  function launch() { const a = A.rnd(-.45, .45); b.vx = sp * Math.sin(a); b.vy = sp * Math.cos(a) * b.d; phase = 'play'; A.beep(600, .04); }
  /* keep the ball travelling up or down the court, never sideways for long */
  function steer() { const v = Math.hypot(b.vx, b.vy) || sp, m = v * .4; if (Math.abs(b.vy) >= m) return;
    b.vy = (b.vy < 0 || (!b.vy && b.d < 0)) ? -m : m; b.vx = (b.vx < 0 ? -1 : 1) * Math.sqrt(v * v - m * m); }
  function hit(i) { sp = Math.min(C.max, sp + 16); rally++; b.zoom = false; kick[i] = .12;
    const a = cl((b.x - px[i]) / (pw(i) / 2) * .95, -1, 1), d = i ? -1 : 1; b.vx = sp * Math.sin(a); b.vy = sp * Math.cos(a) * d; b.y = PY[i] + d * 8;
    aim = A.rnd(-C.err, C.err); F.spark(b.x, b.y, ['#ffffff', i ? ME : C.col], 6, 60); A.beep((i ? 330 : 440) + Math.min(rally, 16) * 12, .05); }
  function point(i) { sc[i]++; shake = .3; F.spark(b.x, i ? 6 : 314, ['#ffffff', '#ffd23c', i ? ME : C.col], 26, 150); A.beep(i ? 780 : 240, .18, 'triangle', .06);
    if (i) { const n = duo ? 50 : 100 * (round + 1) + Math.min(rally, 20) * 5; A.add(n); say('+' + n, 120, 40, '#ffd23c'); }
    if (sc[i] < WIN) return serve(i ? 1 : -1);
    phase = 'end'; tmr = 2.8; b.vx = b.vy = 0; b.y = 160; b.x = 120; trail = []; star = null;
    /* a match a second player joined costs no heart, but only a blue win moves on to the next court */
    if (duo) banner = ['COURT ' + (round + 1) + ' OF 5', i ? 'BLUE WINS!' : 'TOP WINS!', 'GOOD GAME!'];
    else if (i) { const perfect = !sc[0], n = 300 * (round + 1) + (perfect ? 200 : 0); A.add(n); banner = [perfect ? 'PERFECT MATCH!' : 'COURT CLEAR!', 'YOU WIN!', '+' + n + ' BONUS']; [660, 880, 1100].forEach((f, k) => setTimeout(() => A.beep(f, .12, 'square', .05), k * 110)); }
    else { hearts--; banner = [C.name, hearts ? 'SO CLOSE!' : 'OUT OF HEARTS', hearts ? 'TRY AGAIN - HEARTS LEFT: ' + hearts : 'GOOD TRY!']; A.beep(160, .3, 'sawtooth', .05); } }
  function afterMatch() {
    if (!duo && !hearts) { phase = 'done'; return A.over(false); }
    if (sc[1] >= WIN) round++;
    if (round >= COURTS.length) { phase = 'done'; if (!duo) A.add(hearts * 250); return A.over(true); }
    startMatch(); }
  function power(i, k, x, y) { say(POW[k][1], x, y - 12, POW[k][0]); F.spark(x, y, ['#ffffff', POW[k][0]], 16, 110); A.beep(990, .12, 'triangle', .06); if (i && !duo) A.add(25);
    if (k === 'big') big[i] = 10; else if (k === 'ice') ice[1 - i] = 3.5; else if (!b.zoom) { b.zoom = true; b.vx *= 1.3; b.vy *= 1.3; } }
  /* where the ball will cross the top paddle line, with wall bounces (the rival ignores bumpers and gates) */
  function predict() { let x = (b.x + b.vx * (b.y - 26) / -b.vy - 4) % 464; if (x < 0) x += 464; return (x > 232 ? 464 - x : x) + 4; }
  function move(i, dir, tg, dt) { const slow = ice[i] > 0;
    if (dir) px[i] += dir * (slow ? 95 : 270) * dt; else if (tg != null) px[i] = slow ? px[i] + cl(tg - px[i], -95 * dt, 95 * dt) : tg; }
  function controls(dt) { let tg = [null, null]; const top = (A.raw.d ? 1 : 0) - (A.raw.a ? 1 : 0);
    if (A.ptr.moved && !A.ptrs.length) tg[1] = A.ptr.x;
    for (const p of A.ptrs) tg[p.y0 > 160 ? 1 : 0] = p.x; /* a finger belongs to the half it started in, so a drifting finger never grabs the rival paddle */
    if (top || tg[0] != null) { human = 8; if (!two) { two = duo = true; hud(); } } else if (human > 0 && (human -= dt) <= 0) { two = false; hud(); }
    move(1, (A.keys.right ? 1 : 0) - (A.keys.left ? 1 : 0), tg[1], dt);
    if (two) move(0, top, tg[0], dt);
    else { let x = 120, v = C.ai * (ice[0] > 0 ? .35 : 1);
      if (phase === 'play' && b.vy < 0 && b.y < C.see) x = predict() + aim; else { v *= .5; if (phase === 'play' && b.vy < 0) x = b.x; }
      px[0] += cl(x - px[0], -v * dt, v * dt); }
    for (let i = 0; i < 2; i++) px[i] = cl(px[i], pw(i) / 2, W - pw(i) / 2); }
  function stepBall(dt) { b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < 7) { b.x = 7; b.vx = Math.abs(b.vx); A.beep(260, .03); } if (b.x > 233) { b.x = 233; b.vx = -Math.abs(b.vx); A.beep(260, .03); }
    if (b.vy > 0 && b.y >= 296 && b.y <= 307 && Math.abs(b.x - px[1]) < pw(1) / 2 + 4) hit(1);
    if (b.vy < 0 && b.y <= 26 && b.y >= 15 && Math.abs(b.x - px[0]) < pw(0) / 2 + 4) hit(0);
    for (const q of bumps) { const dx = b.x - q.x, dy = b.y - q.y, d = Math.hypot(dx, dy) || 1; if (d >= 13) continue;
      const nx = dx / d, ny = dy / d, dot = b.vx * nx + b.vy * ny; b.x = q.x + nx * 13; b.y = q.y + ny * 13;
      if (dot < 0) { b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; steer(); q.f = .15; F.spark(b.x, b.y, ['#ffffff', C.col], 5, 50); A.beep(520, .05, 'triangle'); } }
    for (const q of gates) { const dx = b.x - q.x, dy = b.y - q.y, ox = 24 - Math.abs(dx), oy = 8 - Math.abs(dy); if (ox <= 0 || oy <= 0) continue;
      if (oy < ox) { b.y = q.y + (dy < 0 ? -8 : 8); b.vy = (dy < 0 ? -1 : 1) * Math.abs(b.vy); } else { b.x = q.x + (dx < 0 ? -24 : 24); b.vx = (dx < 0 ? -1 : 1) * Math.abs(b.vx); }
      steer(); q.f = .15; A.beep(380, .05, 'triangle'); }
    if (star && Math.hypot(b.x - star.x, b.y - star.y) < 12) { power(b.vy < 0 ? 1 : 0, star.k, star.x, star.y); star = null; starT = A.rnd(4, 7); } }

  startMatch();
  return {
    update(dt) { t += dt; controls(dt);
      for (let i = 0; i < 2; i++) { big[i] -= dt; ice[i] -= dt; kick[i] -= dt; }
      for (const m of msgs) { m.t -= dt; m.y -= 14 * dt; } if (msgs.length && msgs[0].t <= 0) msgs.shift();
      if (shake > 0) { shake -= dt; sx = A.ri(-2, 2); sy = A.ri(-2, 2); } else sx = sy = 0;
      if (phase === 'intro' || phase === 'end') { tmr -= dt; if (tmr <= 0) { if (phase === 'intro') serve(1); else afterMatch(); } return; }
      for (const q of gates) { q.x = 120 + 84 * Math.sin(t * .8 + q.ph); q.f -= dt; } for (const q of bumps) q.f -= dt;
      if (C.stars) { if (star) { if ((star.t -= dt) <= 0) { star = null; starT = A.rnd(3, 6); } }
        else if ((starT -= dt) <= 0) { const k = PK[A.ri(0, 2)], y = A.rnd(126, 194); star = { x: y > 140 && y < 180 && C.bump ? 120 + A.rnd(-30, 30) : A.rnd(36, 204), y, k, t: 9 }; } }
      if (phase === 'serve') { tmr -= dt; if (tmr <= 0) launch(); return; }
      trail.push(b.x, b.y); if (trail.length > 14) trail.splice(0, 2); if (b.zoom) F.puff(b.x, b.y, t * 20 % 2 < 1 ? '#ff9a2a' : '#ffd23c', 0);
      for (let i = 0; i < 3 && phase === 'play'; i++) { stepBall(dt / 3); if (b.y < -8) point(1); else if (b.y > 328) point(0); } },

    draw(g) { g.save(); g.translate(sx, sy);
      K.scroll(g, K.T.stone(64, 64, C.floor), 0, 0, W, 320);
      const wall = K.mix(C.col, '#c8fffa', .35); K.box(g, 0, 0, 3, 320, wall); K.box(g, 237, 0, 3, 320, wall); K.box(g, 0, 0, W, 3, C.col); K.box(g, 0, 317, W, 3, ME);
      for (let x = 6; x < 236; x += 16) K.box(g, x, 159, 8, 2, '#c8fffa');
      A.text(g, sc[0], 121, 91, 'rgba(0,0,0,.3)', 6, 'center'); A.text(g, sc[0], 120, 90, K.mix(C.floor, C.col, .6), 6, 'center');
      A.text(g, sc[1], 121, 201, 'rgba(0,0,0,.3)', 6, 'center'); A.text(g, sc[1], 120, 200, K.mix(C.floor, ME, .6), 6, 'center');
      if (!two) for (let i = 0; i < hearts; i++) K.put(g, K.heart(), 12 + i * 13, 148);
      for (let i = 0; i < 5; i++) K.box(g, 193 + i * 8, 145, 6, 6, i < round ? '#ffd23c' : i === round && t * 3 % 2 < 1 ? '#ffffff' : '#0d1626');
      for (const q of bumps) { K.shadow(g, q.x + 2, q.y + 8, 9, 3); K.put(g, K.disc(9, q.f > 0 ? '#ffffff' : '#b8c0d4'), q.x, q.y); K.put(g, K.disc(5, C.col, true), q.x, q.y); }
      for (const q of gates) { K.shadow(g, q.x + 2, q.y + 6, 20, 2); K.put(g, K.block(40, 8, q.f > 0 ? '#ffffff' : C.col, 'r'), q.x, q.y); }
      if (star && (star.t > 2 || t * 8 % 2 < 1)) { const c = POW[star.k][0], y = star.y + Math.round(Math.sin(t * 4) * 2); K.shadow(g, star.x, star.y + 10, 6, 2); K.put(g, K.star2(c, 15), star.x, y);
        g.fillStyle = '#ffffff'; g.fillRect(Math.round(star.x + Math.cos(t * 3) * 10), Math.round(y + Math.sin(t * 3) * 10), 1, 1); g.fillRect(Math.round(star.x - Math.cos(t * 3) * 10), Math.round(y - Math.sin(t * 3) * 10), 1, 1); }
      for (let i = 0; i < 2; i++) { const w = pw(i), y = PY[i] + (kick[i] > 0 ? (i ? 2 : -2) : 0), cold = ice[i] > 0, x = Math.round(px[i]);
        if (big[i] > 0 && (big[i] > 2 || t * 8 % 2 < 1)) K.box(g, x - w / 2 - 1, y + (i ? 6 : -8), w + 2, 2, POW.big[0]);
        K.shadow(g, x + 2, y + 5, w / 2, 2); K.put(g, K.paddle(w, cold ? '#bfefff' : i ? ME : C.col), x, y);
        for (const e of [-7, 7]) { const ex = x + e, lx = cold ? 0 : Math.round(cl((b.x - ex) / 40, -1, 1)), ly = cold ? 0 : Math.round(cl((b.y - y) / 60, -1, 1));
          K.box(g, ex - 3, y - 3, 6, 6, '#140e1c'); K.box(g, ex - 2, y - 2, 4, 4, cold ? '#7fd8ff' : '#ffffff'); K.box(g, ex - 1 + lx, y - 1 + ly, 2, 2, '#140e1c'); }
        if (cold) for (let k = -2; k <= 2; k++) K.box(g, x + k * 9, y + (i ? -6 : 5), 2, 2 + (k & 1), '#e8fbff'); }
      if (phase === 'play') { g.fillStyle = b.zoom ? '#ffd23c' : '#c8fffa'; for (let i = 0; i < trail.length; i += 2) { g.globalAlpha = (i + 2) / 32; g.fillRect(Math.round(trail[i]) - 2, Math.round(trail[i + 1]) - 2, 4, 4); } g.globalAlpha = 1; }
      if (phase === 'serve' && t * 5 % 2 < 1.3) K.put(g, arrow, 120, 160 + b.d * 14, b.d < 0 ? { rot: Math.PI } : null);
      if (phase === 'play' || phase === 'serve') { K.shadow(g, b.x + 2, b.y + 4, 4, 2); K.put(g, K.ball(4, b.zoom ? '#ff9a2a' : '#ffffff'), b.x, b.y); }
      F.draw(g);
      for (const m of msgs) { g.globalAlpha = cl(m.t * 3, 0, 1); A.text(g, m.s, m.x + 1, m.y + 1, '#140e1c', 2, 'center'); A.text(g, m.s, m.x, m.y, m.c, 2, 'center'); } g.globalAlpha = 1;
      if (phase === 'intro' || phase === 'end') { K.box(g, 14, 126, 212, 68, '#140e1c'); K.box(g, 16, 128, 208, 64, C.col); K.box(g, 18, 130, 204, 60, '#1b1e29');
        A.text(g, banner[0], 120, 137, '#5fe3d6', 1, 'center'); A.text(g, banner[1], 120, 149, '#ffffff', 2, 'center'); A.text(g, banner[2], 120, 171, '#ffd23c', 1, 'center');
        if (phase === 'end' && !duo && sc[1] >= WIN) { K.put(g, cup, 34, 160); K.put(g, cup, 206, 160); } }
      g.restore(); }
  };
} });
