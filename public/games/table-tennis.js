/* Table Tennis — a five-rival cup. Every match is first to 11 points and a smash winner counts double.
   Rivals get faster and learn new tricks (placed shots, smashes, curve balls); bonus stars appear from match two. */
Arcade.game('table-tennis', { w: 240, h: 320, pad: 'dpad', a: 'HIT',
help: 'Win the cup: beat five rivals, each match is first to 11 points. Your red bat follows your finger or the mouse on your half of the table, or use the arrow keys. Hit the ball with the side of the bat to aim it. SMASH: move the bat forward as you hit, or press Space (the HIT button, or tap with a second finger) just as the ball arrives. A smash the rival cannot return scores 2 points! Slide sideways as you hit to curve the ball. Later rivals place their shots, smash back and curve the ball. Knock the ball through a gold star for bonus points and a dazzled rival. You have three hearts, losing a match costs one.',
init(A) {
  const K = Art, F = K.fx(), W = 240, NET = 165, CY = 46, PW = 30, WIN = 11, RED = '#e8231e';
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  /* col: bat + shirt, tab: table colour, spd: bat speed, read: speed before the ball crosses the net, err: aim error, grit: how much a smash rattles them, aim: how well shots are placed (0-1),
     smash: smash chance, spin: curve strength, sp/max: ball speed range */
  const RIV = [
    { name: 'PIP', tip: 'A SMASH WINNER SCORES 2!', col: '#3f6ad0', hair: '#c8801e', tab: '#1f62b0', spd: 80, read: .5, err: 24, grit: 1.6, aim: 0, smash: 0, spin: 0, sp: 150, max: 285 },
    { name: 'DOTTY', tip: 'HIT A STAR FOR A BONUS!', col: '#3fa84a', hair: '#e8502a', tab: '#1c7a58', spd: 100, read: .6, err: 20, grit: 1.5, aim: .4, smash: 0, spin: 0, sp: 160, max: 305, stars: 1 },
    { name: 'BOOMER', tip: 'WATCH OUT FOR SMASHES!', col: '#ff9a2a', hair: '#2a2030', tab: '#3a4a9a', spd: 120, read: .7, err: 17, grit: 1.4, aim: .5, smash: .28, spin: 0, sp: 170, max: 325, stars: 1 },
    { name: 'TWIRL', tip: 'CURVE BALLS AHEAD!', col: '#b05ae8', hair: '#fff6c8', tab: '#5a3a8a', spd: 145, read: .8, err: 14, grit: 1.3, aim: .6, smash: .2, spin: 80, sp: 178, max: 345, stars: 1 },
    { name: 'ACE', tip: 'BEAT THE CHAMPION!', col: '#ffd23c', hair: '#7a4a20', tab: '#8a2a3a', spd: 172, read: .9, err: 12, grit: 1.15, aim: .7, smash: .35, spin: 70, sp: 186, max: 365, stars: 1 }];
  const bat = c => K.spr('table-tennis-bat' + c, 30, 16, q => { K.box(q, -3, 1, 6, 7, '#c89a5a'); K.box(q, -3, 1, 2, 7, '#e0b878'); K.box(q, -3, 6, 6, 1, '#8a5a2a');
    K.rr(q, -15, -7, 30, 10, 4, K.lin(q, 0, -7, 0, 3, K.lite(c, .45), c, K.dark(c, .45))); K.box(q, -11, -5, 22, 1, K.lite(c, .6)); });
  const head = i => K.spr('table-tennis-head' + i, 20, 18, q => { const r = RIV[i];
    K.rr(q, -10, 3, 20, 6, 3, K.lin(q, -10, 0, 10, 0, K.lite(r.col, .3), r.col, K.dark(r.col, .3))); K.ell(q, 0, -1, 6.5, 6.5, '#f0c090'); K.ell(q, 0, -5, 7, 3.6, r.hair); K.box(q, -7, -5, 2, 5, r.hair); K.box(q, 5, -5, 2, 5, r.hair);
    K.box(q, -4, -1, 2, 2, '#1a1222'); K.box(q, 2, -1, 2, 2, '#1a1222'); K.box(q, -2, 3, 4, 1, '#a04a3a');
    if (i === 1) { K.ell(q, -7, -6, 2.4, 2.4, r.hair); K.ell(q, 7, -6, 2.4, 2.4, r.hair); }
    if (i === 2) K.box(q, -7, -5, 14, 2, RED);
    if (i === 3) K.part(q, [-3, -8, 0, -9, 3, -8, 0, -4], r.col);
    if (i === 4) { K.part(q, [-6, -5, -6, -9, -3, -7, 0, -9, 3, -7, 6, -9, 6, -5], '#ffd23c'); K.box(q, -1, -7, 2, 1, RED); } });
  const tab = i => K.tex('table-tennis-tab' + i, 64, 64, { base: RIV[i].tab, tile: 1, blobs: [[K.lite(RIV[i].tab, .3), .35, 6, 16, 40]], L: 14 });
  const TR = [0, 1, 2, 3, 4, 5].map(i => [K.rgba('#ffffff', i / 14), K.rgba('#ff9a2a', i / 9), K.rgba('#7fe8ff', i / 9)]);

  let round = 0, hearts = 3, R = RIV[0], me = 0, cpu = 0, phase = 'intro', tmr = 2.4, t = 0, banner = [];
  let px = 120, py = 282, tx = null, ty = 0, pvx = 0, pvy = 0, swT = 0, kick = 0;      /* your bat */
  let cx = 120, ckick = 0, coff = 0, daze = 0, svx = 120;                               /* rival bat */
  let b = { x: 120, y: CY + 12, vx: 0, vy: 0, sp: 0, y0: CY, yb: NET, bn: true, pow: false, by: 0 }, sv = 0, rally = 0, best = 0;
  let star = null, starT = 5, trail = [], msgs = [], shake = 0, flash = 0;
  const say = (s, x, y, c) => msgs.push({ s, x: cl(x, 34, W - 34), y, c, t: 1.2 });
  const hud = () => A.info('Match ' + (round + 1) + '/5 · You ' + me + ':' + cpu);
  const fold = x => { x = (x - 4) % 464; if (x < 0) x += 464; return 4 + (x > 232 ? 464 - x : x); };   /* x after bouncing off the side walls */

  function startMatch() { R = RIV[round]; me = cpu = 0; px = cx = 120; py = 282; tx = null; star = null; starT = 5; trail = []; daze = 0; sv = 0;
    b.vx = b.vy = 0; b.x = 120; b.y = CY + 12; phase = 'intro'; tmr = 2.4; banner = ['MATCH ' + (round + 1) + ' OF 5', 'VS ' + R.name, R.tip]; hud(); A.beep(520, .08, 'triangle'); }
  function serve(who) { sv = who; phase = 'serve'; tmr = who ? 1.5 : 1; rally = 0; trail = []; svx = A.rnd(60, 180); b.vx = b.vy = b.sp = 0; b.pow = false; b.bn = true;
    if (Math.max(me, cpu) >= WIN - 1) say(me >= WIN - 1 ? 'MATCH POINT!' : 'HANG ON!', 120, NET - 30, '#ffd23c'); }
  /* send the ball off a bat: who 1 = you (ball flies up), 0 = rival */
  function fly(who, s, vx, pow, spin) { b.vy = who ? -s : s; b.vx = cl(vx, -s * .85, s * .85); b.sp = spin; b.pow = pow; b.by = who; b.y0 = b.y; b.yb = who ? NET - 62 : NET + 62; b.bn = false; }
  function launch() { phase = 'play'; A.beep(600, .04);
    if (sv) { b.x = px; b.y = py - 9; kick = .12; fly(1, R.sp, pvx * .25 + A.rnd(-25, 25), false, 0); coff = A.rnd(-R.err, R.err); }
    else { b.x = cx; b.y = CY + 9; ckick = .12; fly(0, R.sp, A.rnd(-45, 45), false, 0); } }
  function swing() { if (phase === 'serve' && sv) tmr = Math.min(tmr, .05); else if (swT <= 0) { swT = .5; A.beep(240, .03, 'triangle', .02); } }

  function myHit() { const fwd = Math.max(0, -pvy), pow = swT > .3 || fwd > 130, sp = Math.abs(pvx) > 60 ? cl(pvx * .55, -150, 150) : 0;
    const s = cl(Math.abs(b.vy) + 12 + (pow ? 85 : fwd * .2), R.sp, R.max + (pow ? 60 : 0));
    b.y = py - 8; fly(1, s, (b.x - px) * (pow ? 7 : 6) + pvx * .2, pow, sp); rally++; best = Math.max(best, rally); kick = .14;
    coff = A.rnd(-1, 1) * R.err * (pow ? R.grit : 1) * (1 + Math.abs(sp) / 150 * .7);
    F.spark(b.x, b.y, pow ? ['#ffffff', '#ffd23c', '#ff9a2a'] : ['#ffffff', '#ffb0a0'], pow ? 14 : 5, pow ? 110 : 60);
    if (pow) { shake = .12; say('SMASH!', b.x, b.y - 22, '#ff9a2a'); A.beep(760, .07); A.beep(380, .09, 'sawtooth', .03); } else A.beep(430 + Math.min(rally, 14) * 14, .05);
    if (sp && !pow) say('CURVE!', b.x, b.y - 22, '#7fe8ff'); }
  function cpuHit() { const pow = rally >= 2 && Math.random() < R.smash, s = cl(Math.abs(b.vy) + 10 + (pow ? 70 : 0), R.sp, R.max + (pow ? 40 : 0)), T = (py - CY) / s, reach = (130 + round * 15) * T;
    /* aim away from you, but never further than the arrow keys can run in time */
    const want = cl(px < 120 ? 205 : 35, px - reach, px + reach), loose = (b.x - cx) * 6 + A.rnd(-30, 30);
    b.y = CY + 8; fly(0, s, loose + ((want - b.x) / T - loose) * R.aim, pow, R.spin ? A.rnd(-1, 1) * R.spin : 0); rally++; ckick = .14;
    F.spark(b.x, b.y, pow ? ['#ffffff', R.col, '#ff5a4a'] : ['#ffffff', R.col], pow ? 12 : 5, pow ? 100 : 60);
    if (pow) { flash = .5; say('LOOK OUT!', b.x, b.y + 16, '#ff5a4a'); A.beep(300, .1, 'sawtooth', .04); } else A.beep(330, .05); }

  function point(mine) { const two = mine && b.pow, pts = two ? 2 : 1; shake = .3; trail = [];
    F.spark(b.x, mine ? 34 : 300, ['#ffffff', '#ffd23c', mine ? RED : R.col], 24, 140);
    if (mine) { me = Math.min(WIN, me + pts); const n = (40 * (round + 1) + Math.min(rally, 20) * 4) * pts; A.add(n);
      say(two ? 'POWER POINT! +' + n : rally < 2 ? 'ACE! +' + n : '+' + n, 120, NET - 46, '#ffd23c'); A.beep(700, .15, 'triangle', .05); if (two) setTimeout(() => A.beep(940, .15, 'triangle', .05), 110); }
    else { cpu++; A.beep(200, .2, 'sawtooth'); }
    hud(); if (me < WIN && cpu < WIN) return serve(mine ? 1 : 0);
    phase = 'end'; tmr = 2.8; star = null; b.vx = b.vy = 0; b.x = 120; b.y = NET; b.bn = true;
    if (mine) { const perfect = !cpu, n = 250 * (round + 1) + (perfect ? 300 : 0); A.add(n); banner = [perfect ? 'PERFECT MATCH!' : 'MATCH WON!', 'YOU BEAT ' + R.name, '+' + n + ' BONUS'];
      [660, 880, 1100].forEach((f, i) => setTimeout(() => A.beep(f, .12, 'square', .05), i * 110)); }
    else { hearts--; banner = [R.name + ' WINS ' + cpu + ' : ' + me, hearts ? 'SO CLOSE!' : 'OUT OF HEARTS', hearts ? 'TRY AGAIN - HEARTS LEFT: ' + hearts : 'GOOD TRY!']; A.beep(160, .3, 'sawtooth', .05); } }
  function afterMatch() { if (!hearts) { phase = 'done'; return A.over(false); }
    if (me >= WIN) round++;
    if (round >= RIV.length) { phase = 'done'; round = RIV.length - 1; A.add(hearts * 300 + best * 10); return A.over(true); }
    startMatch(); }
  /* ball height above the table: one bounce on the far half, like the real thing (looks only) */
  function alt() { if (b.bn && !b.vy) return 3; const d = b.by ? -1 : 1, a = (b.y - b.y0) * d, n = Math.max(1, (b.yb - b.y0) * d), u = a / n;
    return u < 1 ? 3 * (1 - u) + 36 * u * (1 - u) * Math.min(1, n / 150) : 6 * Math.abs(Math.sin((a - n) / 58 * Math.PI / 2)); }

  startMatch();
  return {
    key(k) { if (k === 'a') swing(); }, tap() { swing(); },
    update(dt) { t += dt; shake = Math.max(0, shake - dt); swT = Math.max(0, swT - dt); kick = Math.max(0, kick - dt); ckick = Math.max(0, ckick - dt); daze = Math.max(0, daze - dt); flash = Math.max(0, flash - dt);
      for (const m of msgs) { m.t -= dt; m.y -= 14 * dt; } msgs = msgs.filter(m => m.t > 0);
      /* your bat: arrow keys, or glide towards the finger / mouse */
      const k = A.keys, ox = px, oy = py, kx = (k.right ? 1 : 0) - (k.left ? 1 : 0), ky = (k.down ? 1 : 0) - (k.up ? 1 : 0), p = A.ptrs[0] || (A.ptr.moved ? A.ptr : null);
      if (p) { tx = cl(p.x, PW / 2, W - PW / 2); ty = cl(p.y - (A.ptrs.length ? 18 : 0), NET + 22, 298); }
      if (kx || ky) { tx = null; px += kx * 210 * dt; py += ky * 170 * dt; }
      else if (tx !== null) { const dx = tx - px, dy = ty - py, d = Math.hypot(dx, dy), m = 620 * dt; if (d <= m) { px = tx; py = ty; } else { px += dx / d * m; py += dy / d * m; } }
      px = cl(px, PW / 2, W - PW / 2); py = cl(py, NET + 22, 298); if (dt > 0) { pvx = (px - ox) / dt; pvy = (py - oy) / dt; }
      /* rival bat: reads the ball late (only at full speed once it crosses the net) and aims with a little error */
      let goal = 120, cs = R.spd;
      if (phase === 'serve') goal = sv ? 120 : svx;
      else if (phase === 'play' && b.vy < 0) { goal = fold(b.x + b.vx * (b.y - CY) / -b.vy) + coff; if (b.y > NET) cs *= R.read; }
      else if (phase === 'play') { goal = 120 + (b.x - 120) * .3; cs *= .5 + R.read * .5; }
      if (daze > 0) cs = 0; cx = cl(cx + cl(goal - cx, -cs * dt, cs * dt), PW / 2, W - PW / 2);
      if (phase === 'intro' || phase === 'end') { tmr -= dt; if (tmr <= 0) { if (phase === 'intro') serve(0); else afterMatch(); } return; }
      if (phase === 'serve') { tmr -= dt; b.x = sv ? px : cx; b.y = sv ? py - 9 : CY + 9; if (tmr <= 0) launch(); return; }
      if (phase !== 'play') return;
      /* bonus star on the rival's half */
      if (R.stars && !star && (starT -= dt) <= 0) star = { x: A.rnd(36, 204), y: A.rnd(78, 128), t: 9 };
      if (star && (star.t -= dt) <= 0) { star = null; starT = A.rnd(5, 9); }
      for (let i = 0; i < 3; i++) { const h = dt / 3; b.vx += b.sp * h; b.x += b.vx * h; b.y += b.vy * h;
        if (b.x < 4 || b.x > 236) { b.x = cl(b.x, 4, 236); b.vx = -b.vx; b.sp = 0; A.beep(520, .02, 'triangle', .02); }
        if (!b.bn && (b.y - b.yb) * (b.by ? -1 : 1) >= 0) { b.bn = true; b.sp *= .5; F.puff(b.x, b.y, '#ffffff'); A.beep(980, .025, 'triangle', .03); }
        if (star && b.by && Math.hypot(b.x - star.x, b.y - star.y) < 13) { const n = 60 * (round + 1); A.add(n); say('STAR! +' + n, star.x, star.y - 12, '#ffd23c'); F.spark(star.x, star.y, ['#ffd23c', '#fff6c8', '#ff9a2a'], 18, 120);
          daze = .5; b.vy *= 1.12; star = null; starT = A.rnd(6, 10); A.beep(1040, .08, 'triangle', .05); A.beep(1320, .12, 'triangle', .04); }
        if (b.vy > 0 && b.y > py - 8 && b.y < Math.max(py, oy) + 7 && Math.abs(b.x - px) < PW / 2 + 5) myHit();
        else if (b.vy < 0 && Math.abs(b.y - CY) < 7 && Math.abs(b.x - cx) < PW / 2 + 4) cpuHit(); }
      trail.push(b.x, b.y - alt()); if (trail.length > 12) trail.splice(0, 2);
      if (b.y < 6) point(true); else if (b.y > 330) point(false); },

    draw(g) { K.scroll(g, K.T.wood(64, 64), 0, 0, W, 320); g.fillStyle = 'rgba(20,8,0,.4)'; g.fillRect(0, 0, W, 320);
      const sh = shake > 0 ? Math.ceil(shake * 10) : 0, z = alt(), by = b.y - z; g.save(); if (sh) g.translate(A.ri(-sh, sh), A.ri(-sh, sh));
      /* table */
      K.box(g, 12, 36, 224, 272, 'rgba(0,0,0,.35)'); K.box(g, 7, 29, 226, 272, '#140e1c'); g.save(); g.beginPath(); g.rect(8, 30, 224, 270); g.clip(); K.scroll(g, tab(round), 0, 0, W, 320); g.restore();
      for (const q of [[8, 30, 224, 3], [8, 297, 224, 3], [8, 30, 3, 270], [229, 30, 3, 270], [119, 30, 2, 270]]) K.box(g, q[0], q[1], q[2], q[3], '#f2f5f8');
      A.text(g, cpu, 30, NET - 46, 'rgba(255,255,255,.28)', 6, 'center'); A.text(g, me, 30, NET + 18, 'rgba(255,255,255,.28)', 6, 'center');
      A.text(g, R.name, 210, NET - 22, 'rgba(255,255,255,.28)', 2, 'center'); A.text(g, 'YOU', 210, NET + 14, 'rgba(255,255,255,.28)', 2, 'center');
      if (star) { const a = star.t < 2 && Math.floor(t * 8) % 2 ? .35 : 1, r = 11 + Math.round(Math.sin(t * 6)); g.globalAlpha = a; for (let i = 0; i < 8; i++) { const an = t * 2 + i * K.TAU / 8; K.box(g, Math.round(star.x + Math.cos(an) * r), Math.round(star.y + Math.sin(an) * r), 2, 2, '#fff6c8'); } g.globalAlpha = 1; K.put(g, K.star2('#ffd23c', 15), star.x, star.y, { a }); }
      if (b.y < NET) K.shadow(g, b.x + 2 + z * .3, b.y + 3, 3, 2);
      /* net */
      K.box(g, 2, NET + 6, 236, 3, 'rgba(0,0,0,.3)'); K.box(g, 1, NET, 238, 8, '#140e1c'); K.box(g, 2, NET + 1, 236, 6, '#d6dbea'); K.box(g, 2, NET + 1, 236, 1, '#ffffff'); for (let x = 4; x < 238; x += 3) K.box(g, x, NET + 3, 1, 3, '#8a94a4'); K.box(g, 0, NET - 2, 4, 12, '#5c6678'); K.box(g, 236, NET - 2, 4, 12, '#5c6678');
      if (b.y >= NET) K.shadow(g, b.x + 2 + z * .3, b.y + 3, 3, 2);
      /* rival and bats */
      K.put(g, head(round), cx, 16 + (daze > 0 ? Math.round(Math.sin(t * 40)) : 0)); if (daze > 0) for (let i = 0; i < 3; i++) K.box(g, Math.round(cx + Math.cos(t * 9 + i * 2.1) * 10), Math.round(5 + Math.sin(t * 9 + i * 2.1) * 3), 2, 2, '#ffd23c');
      const cky = CY + (ckick > 0 ? 4 : 0), pky = py - (kick > 0 ? 4 : swT > .3 ? 6 : 0);
      K.shadow(g, cx + 2, cky + 6, 14, 3); K.put(g, bat(R.col), cx, cky, { rot: Math.PI }); K.shadow(g, px + 2, pky + 7, 14, 3); K.put(g, bat(RED), px, pky);
      if (swT > .3) { K.box(g, Math.round(px) - 12, Math.round(pky) - 12, 24, 1, '#fff6c8'); K.box(g, Math.round(px) - 8, Math.round(pky) - 15, 16, 1, 'rgba(255,246,200,.5)'); }
      /* ball */
      const tc = b.pow ? 1 : b.sp ? 2 : 0; for (let i = 0; i < trail.length; i += 2) K.box(g, Math.round(trail[i]) - 1, Math.round(trail[i + 1]) - 1, 3, 3, TR[i >> 1][tc]);
      K.put(g, K.ball(z > 5 ? 4 : 3, b.pow ? '#ffd9a0' : '#fff6c8'), b.x, by); F.draw(g);
      if (phase === 'serve' && Math.floor(t * 4) % 2) A.text(g, sv ? 'YOUR SERVE' : R.name + ' SERVES', 120, sv ? NET + 50 : NET - 58, '#fff6c8', 1, 'center');
      for (const m of msgs) { A.text(g, m.s, m.x + 1, m.y + 1, '#140e1c', 1, 'center'); A.text(g, m.s, m.x, m.y, m.c, 1, 'center'); }
      g.restore(); if (flash > 0 && Math.floor(flash * 12) % 2) { K.box(g, 0, 0, W, 2, '#ff5a4a'); K.box(g, 0, 318, W, 2, '#ff5a4a'); }
      /* hearts and cup progress */
      for (let i = 0; i < 3; i++) K.put(g, K.heart(), 10 + i * 13, 311, i < hearts ? null : { a: .22 });
      for (let i = 0; i < 5; i++) { K.box(g, 189 + i * 10, 306, 8, 9, '#140e1c'); K.box(g, 190 + i * 10, 307, 6, 7, i < round || (phase === 'done' && me >= WIN) ? '#ffd23c' : i === round ? (Math.floor(t * 3) % 2 ? '#ffffff' : RIV[i].col) : '#3a3448'); }
      if (phase === 'intro' || phase === 'end') { K.box(g, 14, 108, 212, 84, '#140e1c'); K.box(g, 16, 110, 208, 80, '#241c36'); K.box(g, 16, 110, 208, 2, phase === 'end' && me < WIN ? '#5c6678' : R.col);
        A.text(g, banner[0], 120, 120, '#aab4c2', 2, 'center'); A.text(g, banner[1], 120, 138, '#fff6c8', banner[1].length > 13 ? 2 : 3, 'center'); A.text(g, banner[2], 120, 168, '#ffd23c', banner[2].length > 25 ? 1 : 2, 'center');
        if (phase === 'intro') K.put(g, head(round), 36, 148, { sc: 2 }); } }
  };
} });
