Arcade.game('air-hockey', { w: 240, h: 320, arrowsOnly: true,
help: 'Falcon Cup: beat 5 rivals, each match is first to 3 goals. Push the puck into the goal at the far end with your red mallet: drag with a finger, move the mouse or use the arrow keys. Later rivals are faster and bring bumpers. Knock the puck into a star for a power-up: a BIG mallet for you or a FREEZE for your rival. Bank shots off a wall and matches without letting in a goal score a bonus. Lose a match and the cup is over. 2 players: a second finger on the top half or W A S D takes over the top mallet for a friendly first to 7.',
init(A) {
  const K = Art, F = K.fx(), PR = 7, BR = 9, L = 5, R = 235, T = 5, B = 315, GA = 74, GB = 166, RED = '#e8231e';
  const OPP = [ /* atk/def = mallet speeds, trk = how closely it shadows the puck, pre = how well shots are read, err = aiming wobble, reach = how far forward it attacks */
    { n: 'PIP', c: '#3fb95a', atk: 80, def: 40, trk: .3, pre: 0, err: 10, reach: 135, tip: 'FIRST TO 3 GOALS' },
    { n: 'DASH', c: '#3f6ad0', atk: 108, def: 54, trk: .38, pre: .12, err: 8, reach: 166, star: 1, tip: 'HIT A STAR FOR A POWER-UP' },
    { n: 'BOING', c: '#b06ae0', atk: 124, def: 64, trk: .42, pre: .2, err: 7, reach: 166, star: 1, bump: 1, tip: 'WATCH THE BUMPERS' },
    { n: 'FROSTY', c: '#2fc4ba', atk: 138, def: 74, trk: .48, pre: .28, err: 6, reach: 166, star: 1, bump: 2, tip: 'THE BUMPER SLIDES' },
    { n: 'ZED', c: '#ff8a1e', atk: 158, def: 88, trk: .55, pre: .4, err: 4, reach: 166, star: 1, bump: 3, max: 470, tip: 'THE FINAL - GOOD LUCK' }];
  const P2 = { n: 'PLAYER 2', c: '#3f6ad0', star: 1, tip: 'FIRST TO 7 GOALS' };
  const mal = y => ({ x: 120, y, ox: 120, oy: y, cx: 120, cy: y, vx: 0, vy: 0, r: 12, big: 0, ice: 0 });
  const m1 = mal(270), m2 = mal(50), p = { x: 120, y: 200, vx: 0, vy: 0 }, trail = [], pops = [], bumps = [], Q = [], MS = [m1, m2], still = { vx: 0, vy: 0 };
  let rd = 0, opp = OPP[0], N = 3, s1 = 0, s2 = 0, human = false, wait = 1.8, ban = 1.8, banA = 'ROUND 1', banB = 'VS PIP', inter = 0, endT = 0, endWin = false,
    time = 0, shake = 0, flash = 0, flashTop = true, last = 0, banks = 0, stall = 0, star = null, starT = 6, tick = 0, hov = 0, flee = 0;
  const pop = (s, x, y, c) => pops.push({ s, x: Math.max(s.length * 4 + 6, Math.min(234 - s.length * 4, x)), y, c: c || '#ffd23c', t: 1.3 }), tune = (fs, ty) => fs.forEach((f, i) => Q.push({ t: i * .09, f, ty }));
  function info() { A.info((human ? '2 PLAYERS' : 'ROUND ' + (rd + 1) + '/5') + '  ' + s2 + ':' + s1); }
  function serve(d) { p.x = 120; p.y = 160 + d * 42; p.vx = p.vy = 0; trail.length = 0; wait = .9; last = 0; banks = 0; stall = 0; info(); }
  function match(r, two) { rd = r; opp = two ? P2 : OPP[r]; N = two ? 7 : 3; s1 = s2 = 0; star = null; starT = 6; bumps.length = 0; m1.big = m1.ice = m2.big = m2.ice = 0;
    for (let i = 0; i < [0, 2, 1, 2][opp.bump || 0]; i++) bumps.push({ x: 0, y: 160, vx: 0, vy: 0, fl: 0 }); slide(0);
    banA = two ? '2 PLAYERS' : r === 4 ? 'FINAL' : 'ROUND ' + (r + 1); banB = two ? 'FRIENDLY MATCH' : 'VS ' + opp.n; ban = 2; serve(1); wait = 2; }
  function slide(dt) { const k = opp.bump, s = Math.sin(time * .9); bumps.forEach((b, i) => { const x = k === 1 ? 62 + i * 116 : k === 2 ? 120 + 72 * s : 120 + (i ? 1 : -1) * (58 + 30 * s); b.vx = dt ? (x - b.x) / dt : 0; b.x = x; b.fl -= dt; }); }
  function clamp(m, top) { for (let i = 0; i < 2; i++) { m.x = Math.max(L + m.r, Math.min(R - m.r, m.x)); m.y = top ? Math.max(T + m.r, Math.min(160 - m.r, m.y)) : Math.max(160 + m.r, Math.min(B - m.r, m.y));
    for (const b of bumps) { const dx = m.x - b.x, dy = m.y - b.y || (top ? -1 : 1), d = Math.hypot(dx, dy), rr = m.r + BR; if (d < rr) { m.x = b.x + dx / d * rr; m.y = b.y + dy / d * rr; } } } }
  function mv(m, tx, ty, max, dt, top) { m.ox = m.x; m.oy = m.y; m.r = m.big > 0 ? 17 : 12; if (m.ice > 0) max = Math.min(max, 55);
    const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy), st = max * dt; if (d > st && d > 0) { m.x += dx / d * st; m.y += dy / d * st; } else { m.x = tx; m.y = ty; } clamp(m, top);
    if (dt > 0) { m.vx += ((m.x - m.ox) / dt - m.vx) * .6; m.vy += ((m.y - m.oy) / dt - m.vy) * .6; } m.big -= dt; m.ice -= dt; }
  /* circle against the puck: push it out, bounce it, return how hard the hit was */
  function hit(o, x, y, r, e) { const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy), rr = r + PR; if (d >= rr || !d) return 0; const nx = dx / d, ny = dy / d, rv = (p.vx - o.vx) * nx + (p.vy - o.vy) * ny;
    p.x = x + nx * rr; p.y = y + ny * rr; if (rv >= 0) return 0; p.vx -= e * rv * nx; p.vy -= e * rv * ny; return -rv; }
  function wall(v) { if (v > 60) { banks++; if (tick <= 0) { A.beep(240, .03, 'square', .02); tick = .07; } if (v > 220) F.spark(p.x, p.y, ['#ffffff', '#a8c8e8'], 4, 60); } }
  /* end walls: solid, except for the goal mouth with its two round posts */
  function endWall(y, d) { if ((p.y - y) * d >= PR) return;
    if (p.x > GA && p.x < GB) { hit(still, GA, y, 0, 1.8); hit(still, GB, y, 0, 1.8); if ((p.y - y) * d < 0) p.x = Math.max(GA + PR - 1, Math.min(GB - PR + 1, p.x)); }
    else { p.y = y + d * PR; wall(-p.vy * d); p.vy = Math.abs(p.vy) * .92 * d; } }
  function ai(dt) { const o = opp, rr = m2.r + PR; flee -= dt; let tx, ty, sp = o.atk;
    if (wait <= 0 && flee <= 0 && p.y < o.reach && p.vy > -120 && p.vy < 110) { /* puck is on our side and slow enough: get above it, then strike through it */
      if (m2.y < p.y - 5 || p.y < T + rr + 14) { tx = p.x + Math.sin(time * 1.7) * o.err; ty = p.y + 6; }
      else { let sd = m2.x < p.x ? -1 : 1; if (p.x + sd * (rr + 3) < L + m2.r || p.x + sd * (rr + 3) > R - m2.r) sd = -sd; tx = p.x + sd * (rr + 3); ty = p.y - rr; } }
    else { tx = 120 + (p.x - 120) * o.trk; ty = 40; sp = o.def; /* guard the goal, better rivals work out where the shot will arrive */
      if (p.vy < -30) { let x = p.x + p.vx * (p.y - ty) / -p.vy - 12; x = ((x % 432) + 432) % 432; if (x > 216) x = 432 - x; tx += (x + 12 - tx) * o.pre; } tx = Math.max(62, Math.min(178, tx)); }
    mv(m2, tx, ty, sp, dt, true); }
  function goal(me) { shake = 5; flash = .7; flashTop = me; F.spark(120, me ? 8 : 312, ['#ffd23c', '#ffffff', me ? RED : opp.c], 34, 150);
    if (me) { s1++; let pts = human ? 100 : 100 * (rd + 1); pop('GOAL! +' + pts, 120, 60); if (banks && last === 1) { pts += 50; pop('BANK SHOT +50', 120, 76, '#5fe3d6'); } A.add(pts); tune([523, 659, 784], 'triangle'); }
    else { s2++; pop(human ? 'GOAL!' : opp.n + ' SCORES', 120, 250, '#ffffff'); tune([330, 262, 196], 'sawtooth'); }
    info(); p.x = 120; p.y = -40; p.vx = p.vy = 0; trail.length = 0;
    if (s2 >= N || (s1 >= N && (human || rd === 4))) { endWin = s1 >= N; if (endWin && !human) { A.add(500); pop('CUP WINNER +500', 120, 100); } endT = 1.1; }
    else if (s1 >= N) { inter = 2.4; wait = 9; star = null; banA = 'YOU BEAT ' + opp.n + '!'; banB = s2 ? 'NEXT RIVAL COMING UP' : 'PERFECT MATCH +200'; if (!s2) A.add(200); ban = 2.2; tune([523, 659, 784, 1047], 'square'); }
    else serve(me ? -1 : 1); }
  function power() { const me = last === 1, own = me ? m1 : m2, oth = me ? m2 : m1, big = A.rnd(0, 1) < .5; F.spark(star.x, star.y, ['#ffd23c', '#ffffff', '#5fe3d6'], 18, 110); tune([880, 1175, 1568], 'triangle');
    if (big) { own.big = 8; pop('BIG MALLET!', own.x, own.y - 22 * (me ? 1 : -1)); } else { oth.ice = 3; pop('FREEZE!', oth.x, oth.y + 22 * (me ? 1 : -1), '#8fd3ff'); }
    if (me && !human) { A.add(25); pop('+25', star.x, star.y - 12); } star = null; starT = A.rnd(7, 11); }
  info();
  return {
    update(dt) { const k = A.keys, r = A.raw; time += dt; tick -= dt; shake = Math.max(0, shake - dt * 14); flash -= dt; ban -= dt;
      for (const q of Q) { q.t -= dt; if (q.t <= 0) A.beep(q.f, .12, q.ty, .04); } for (let i = Q.length - 1; i >= 0; i--) if (Q[i].t <= 0) Q.splice(i, 1);
      for (const o of pops) { o.t -= dt; o.y -= dt * 9; } if (pops.length && pops[0].t <= 0) pops.shift();
      if (endT > 0) { endT -= dt; if (endT <= 0) A.over(endWin); return; }
      /* controls: a lone finger / the mouse drives the red mallet; a second finger in the top half (or W A S D) starts a 2-player match */
      let t1 = null, t2 = null; const ps = A.ptrs; for (const q of ps) if (!t1 || q.y > t1.y) t1 = q; if (ps.length > 1) for (const q of ps) if (q !== t1 && q.y < 160 && t1.y > 160) t2 = q;
      hov = !ps.length && A.ptr.moved ? hov + 1 : hov > 2 ? hov : 0; const off = ps.length && hov < 3 ? 16 : 0; /* fingers hide the mallet, so it sits just ahead of them; a mouse is followed exactly */
      if ((t2 || r.w || r.a || r.s || r.d) && !human) { human = true; match(0, true); }
      if (!t1 && A.ptr.moved && !ps.length) t1 = A.ptr;
      if (t1) { m1.tx = t1.x; m1.ty = t1.y - off; m1.fol = true; } else if (k.left || k.right || k.up || k.down) m1.fol = false;
      if (m1.fol) mv(m1, m1.tx, m1.ty, 1100, dt, false); else mv(m1, m1.x + ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 40, m1.y + ((k.down ? 1 : 0) - (k.up ? 1 : 0)) * 40, 300, dt, false);
      slide(dt);
      if (!human) ai(dt); else if (t2) mv(m2, t2.x, t2.y + off, 1100, dt, true); else mv(m2, m2.x + ((r.d ? 1 : 0) - (r.a ? 1 : 0)) * 40, m2.y + ((r.s ? 1 : 0) - (r.w ? 1 : 0)) * 40, 260, dt, true);
      if (inter > 0) { inter -= dt; if (inter <= 0) match(rd + 1); return; }
      if (wait > 0) { wait -= dt; return; }
      const max = opp.max || 430;
      for (let i = 1; i <= 4; i++) { p.x += p.vx * dt / 4; p.y += p.vy * dt / 4;
        for (const m of MS) { m.cx = m.ox + (m.x - m.ox) * i / 4; m.cy = m.oy + (m.y - m.oy) * i / 4; const v = hit(m, m.cx, m.cy, m.r, 1.9); if (v) { last = m === m1 ? 1 : 2; banks = 0; const w = A.rnd(-.04, .04), vx = p.vx; p.vx += p.vy * w; p.vy -= vx * w; /* a little spin, so no two shots are the same */
          if (tick <= 0) { A.beep(300 + Math.min(300, v * .6), .04); tick = .06; F.spark(p.x - (p.x - m.cx) * .4, p.y - (p.y - m.cy) * .4, ['#ffffff', '#ffd23c', m === m1 ? RED : opp.c], v > 250 ? 9 : 4, 50 + v * .2); } if (v > 330) shake = Math.max(shake, 2); } }
        for (const b of bumps) { const v = hit(b, b.x, b.y, BR, 2); if (v) { const s = Math.hypot(p.vx, p.vy) || 1, f = Math.max(1, 170 / s); p.vx *= f; p.vy *= f; b.fl = .15; banks++; A.beep(620, .06, 'triangle'); F.spark(p.x, p.y, ['#ffd23c', '#ff8a9a'], 5, 70); } }
        if (p.x < L + PR) { p.x = L + PR; wall(-p.vx); p.vx = Math.abs(p.vx) * .92; } if (p.x > R - PR) { p.x = R - PR; wall(p.vx); p.vx = -Math.abs(p.vx) * .92; }
        endWall(T, 1); endWall(B, -1); }
      const f = Math.max(0, 1 - .35 * dt), sp = Math.hypot(p.vx, p.vy); p.vx *= f; p.vy *= f; if (sp > max) { p.vx *= max / sp; p.vy *= max / sp; }
      trail.push(p.x, p.y); if (trail.length > 12) trail.splice(0, 2);
      /* a puck the computer cannot dig out of its end: it backs off and an air jet blows the puck free */
      if (!human && p.y < 160) { stall += dt; if (stall > 3.5) { stall = 0; flee = .9; p.vy = 210; p.vx = (p.x < 120 ? 1 : -1) * A.rnd(30, 120); F.spark(p.x, p.y, ['#ffffff', '#8fd3ff'], 8, 60); A.beep(520, .08, 'sine'); } } else stall = 0;
      if (opp.star) { if (star) { star.t -= dt; if (star.t <= 0) { star = null; starT = A.rnd(5, 9); } else if (last && Math.hypot(p.x - star.x, p.y - star.y) < PR + 9) power(); }
        else if ((starT -= dt) <= 0) star = { x: A.rnd(30, 210), y: A.rnd(0, 1) < .5 ? A.rnd(104, 138) : A.rnd(182, 216), t: 8 }; }
      if (p.y < 0) goal(true); else if (p.y > 320) goal(false); },
    draw(g) { const sx = shake > .5 ? A.ri(-shake, shake) : 0, sy = shake > .5 ? A.ri(-shake, shake) : 0; g.setTransform(1, 0, 0, 1, 0, 0); if (sx || sy) { K.box(g, 0, 0, 240, 320, '#140e1c'); g.translate(sx, sy); }
      g.drawImage(rink(), 0, 0);
      K.box(g, GA + 1, 0, GB - GA - 2, 3, opp.c); K.box(g, GA + 1, 0, GB - GA - 2, 1, K.lite(opp.c, .5)); /* the rival's colours on the far goal */
      if (flash > 0 && (flash * 12 & 1)) K.box(g, GA + 1, flashTop ? 0 : 316, GB - GA - 2, 4, '#ffffff');
      A.text(g, s2, 216, 132, 'rgba(18,20,28,.3)', 5, 'center'); A.text(g, s1, 216, 166, 'rgba(18,20,28,.3)', 5, 'center');
      A.text(g, opp.n, 12, 148, 'rgba(18,20,28,.4)', 1); A.text(g, human ? 'PLAYER 1' : 'YOU', 12, 168, 'rgba(18,20,28,.4)', 1);
      for (let i = 0; i < N; i++) { K.box(g, 12 + i * 5, 140, 4, 4, i < s2 ? opp.c : 'rgba(18,20,28,.22)'); K.box(g, 12 + i * 5, 177, 4, 4, i < s1 ? RED : 'rgba(18,20,28,.22)'); }
      if (star && (star.t > 2 || (star.t * 8 & 1))) { K.shadow(g, star.x + 1, star.y + 3, 7, 5); K.put(g, K.star2('#ffd23c', 17), star.x, star.y + Math.sin(time * 5) * 1.5); }
      for (const b of bumps) { K.shadow(g, b.x + 2, b.y + 3, BR, BR - 2); K.put(g, bumper(b.fl > 0 ? 1 : 0), b.x, b.y); }
      for (let i = 0; i < trail.length - 2; i += 2) { const s = i > 5 ? 3 : 2; K.box(g, Math.round(trail[i]) - 1, Math.round(trail[i + 1]) - 1, s, s, i > 5 ? '#8fa0b8' : '#b4c4d8'); }
      for (let i = 1; i >= 0; i--) { const m = MS[i], c = m === m1 ? RED : opp.c, r = m.big > 0 && (m.big > 1.5 || (m.big * 8 & 1)) ? 17 : 12; K.shadow(g, m.x + 2, m.y + 3, r, r - 2); if (m.ice > 0) K.put(g, ice(), m.x, m.y); K.put(g, K.disc(r, m.ice > 0 ? K.mix(c, '#cfeaff', .55) : c, 1), m.x, m.y); }
      if (p.y > -20) { K.shadow(g, p.x + 2, p.y + 3, PR, PR - 2); K.put(g, K.disc(PR, '#2a2f3d', 0), p.x, p.y); if (wait > 0 && ban <= 0 && (time * 6 & 1)) K.put(g, ring(), p.x, p.y); }
      F.draw(g);
      for (const o of pops) if (o.t > .25 || (o.t * 16 & 1)) { A.text(g, o.s, o.x + 1, o.y + 1, '#140e1c', 2, 'center'); A.text(g, o.s, o.x, o.y, o.c, 2, 'center'); }
      if (ban > 0) { K.box(g, 30, 132, 180, 56, '#140e1c'); K.box(g, 32, 134, 176, 52, '#262a44'); K.box(g, 32, 134, 176, 2, inter > 0 ? '#ffd23c' : opp.c);
        A.text(g, banA, 120, 142, '#ffffff', 2, 'center'); A.text(g, banB, 120, 159, inter > 0 ? '#ffd23c' : K.lite(opp.c, .45), 2, 'center'); A.text(g, inter > 0 ? 'GET READY' : opp.tip, 120, 176, '#aab4c2', 1, 'center'); } }
  };
  function rink() { return K.tex('air-hockey-rink', 240, 320, { base: '#d6e6f5', blobs: [['#ffffff', .7, 14, 30, 80], ['#a8c8e8', .5, 12, 30, 80]], L: 12, specks: [['#ffffff', 80, 3, 1], ['#b8d0e8', 60, 2, 1]], post(g) {
    g.drawImage(K.spr('air-hockey-lines', 240, 320, q => { q.translate(-120, -160); q.lineWidth = 2;
      for (const y of [T, B]) { q.beginPath(); q.arc(120, y, 52, 0, 7); q.fillStyle = '#bcd4f0'; q.fill(); q.strokeStyle = '#3f6ad0'; q.stroke(); }
      K.box(q, L, 92, 230, 2, '#3f6ad0'); K.box(q, L, 226, 230, 2, '#3f6ad0'); K.box(q, L, 159, 230, 2, RED); q.strokeStyle = RED; q.beginPath(); q.arc(120, 160, 27, 0, 7); q.stroke();
      for (const [x, y] of [[120, 160], [52, 60], [188, 60], [52, 260], [188, 260]]) K.ell(q, x, y, 3, 3, RED); }, { ol: 0, L: 16 }), -1, -1);
    for (const [a, b, c, d] of [[0, 0, 240, 5], [0, 315, 240, 5], [0, 0, 5, 320], [235, 0, 5, 320]]) { K.box(g, a, b, c, d, '#140e1c'); K.box(g, a + 1, b + 1, Math.max(1, c - 2), Math.max(1, d - 2), '#5c6678'); }
    K.box(g, 1, 1, 238, 1, '#aab4c2'); K.box(g, 1, 1, 1, 318, '#aab4c2'); K.box(g, 1, 318, 238, 1, '#3a4152'); K.box(g, 238, 1, 1, 318, '#3a4152');
    for (const y of [0, 315]) { K.box(g, GA - 3, y, GB - GA + 6, 5, '#140e1c'); K.box(g, GA + 1, y, GB - GA - 2, 5, '#1e1830'); for (const x of [GA - 2, GB - 1]) { K.box(g, x, y + 1, 3, 3, '#ffd23c'); K.box(g, x, y + 1, 1, 1, '#ffffff'); } }
    K.box(g, GA + 1, 317, GB - GA - 2, 3, RED); K.box(g, GA + 1, 317, GB - GA - 2, 1, '#ff8a7a'); } }); }
  function bumper(lit) { return K.spr('air-hockey-bump' + lit, 20, 20, g => { K.ell(g, 0, 0, 9.5, 9.5, K.lin(g, -9, -9, 9, 9, '#ffffff', '#aab4c2', '#4a5462')); K.ell(g, 0, 0, 7, 7, lit ? '#ffffff' : '#7a1410');
    K.ell(g, 0, 0, 5.6, 5.6, K.rad(g, -2, -2, .5, 8, lit ? '#ffffff' : '#ffe98a', lit ? '#ffe98a' : '#ffb01e', lit ? '#ffb01e' : '#c8601e')); K.part(g, K.reg(5, 3.2), lit ? '#ffb01e' : '#7a1410'); }); }
  function ice() { return K.spr('air-hockey-ice', 46, 46, g => { const q = []; for (let i = 0; i < 16; i++) { const a = i / 16 * K.TAU, d = i % 2 ? 15 : 21 + (i % 4); q.push(Math.sin(a) * d, -Math.cos(a) * d); } K.part(g, q, K.lin(g, -18, -18, 18, 18, '#ffffff', '#bfe6ff', '#6fb8ee')); }, { ol: [40, 90, 150] }); }
  function ring() { return K.spr('air-hockey-ring', 24, 24, g => { g.lineWidth = 2; g.strokeStyle = '#ffd23c'; g.beginPath(); g.arc(0, 0, 10.5, 0, 7); g.stroke(); }, { ol: 0 }); }
} });
