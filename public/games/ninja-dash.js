/* Ninja Dash v0.4 — rooftop runner over 8 stages: jump, double jump and slide. 3 hearts, coin streaks, a new trap every stage. */
Arcade.game('ninja-dash', { w: 160, h: 120,
help: 'The ninja runs by himself across 8 rooftop stages. JUMP with Space, Up or a tap — press again in the air for a double jump. SLIDE with Down, a swipe down or by holding the left side of the screen (in the air it makes you drop fast). Jump over spikes, crates, gaps and low stars; stay on the ground under high stars; slide under lanterns and bats. A "!" at the edge warns you where a star or bat will fly in. You have 3 hearts and every gate gives one back. Coins are worth more the longer your streak (up to x5), so try not to miss any. Reach the gold gate to win a bonus for every heart left.',
init(A) {
  const K = Art, GY = 88, PX = 44, LAST = 8, RED = '#e8231e', INK = '#140e1c';
  const TOUCH = !!(window.matchMedia && matchMedia('(pointer:coarse)').matches);
  const NIN = { id: 'ninja-dash', skin: '#f0b890', shirt: '#dfe6f2', pants: '#aab4c8', hat: 'hood', hatc: '#f2f5f8', shoe: '#3a4152', belt: RED };
  const SLIDE = K.spr('ninja-dash-slide', 24, 12, g => {
    K.box(g, 2, 1, 8, 4, NIN.pants); K.box(g, 9, 0, 3, 5, NIN.shoe); K.box(g, -6, 0, 9, 5, NIN.shirt); K.box(g, 1, 0, 2, 5, RED); K.box(g, -2, -2, 7, 2, NIN.shirt); K.box(g, 5, -2, 2, 2, NIN.skin);
    K.ell(g, -7, -1, 4.6, 4.4, NIN.hatc); K.box(g, -8, -3, 6, 3, NIN.skin); K.box(g, -6, -2, 1, 2, '#1a1222'); K.box(g, -3, -2, 1, 2, '#1a1222'); });
  const LAN = K.spr('ninja-dash-lan', 12, 16, g => {
    K.ell(g, 0, 0, 5.6, 6, K.rad(g, -1, -1, 1, 8, '#ffe9a0', '#ff8a2a', '#c8231e')); K.box(g, -3, -8, 6, 2, '#3a2a20'); K.box(g, -3, 6, 6, 2, '#3a2a20'); K.box(g, -1, -4, 2, 8, '#fff6c8'); K.box(g, -5, -1, 10, 1, '#c8231e'); });
  const gate = gold => K.spr('ninja-dash-gate' + gold, 48, 58, g => { const c = gold ? '#ffd23c' : '#d8321e', d = K.dark(c, .4);
    for (const x of [-17, 12]) { K.box(g, x, -20, 5, 49, K.lin(g, x, 0, x + 5, 0, K.lite(c, .4), c, d)); K.box(g, x - 1, 25, 7, 4, '#3a3050'); }
    K.box(g, -20, -17, 40, 4, c); K.box(g, -20, -14, 40, 1, d); K.part(g, [-24, -29, 24, -29, 21, -23, -21, -23], gold ? '#fff6c8' : '#3a2a40'); K.box(g, -22, -24, 44, 3, c); K.box(g, -2, -21, 4, 4, d); });
  const PAL = [['#12143a', '#3a2a6a', '#a04a6a', '#ffb070'], ['#0a0c2a', '#1c1c50', '#4a2a6a', '#a04a6a'], ['#060818', '#0c1030', '#16204a', '#2a3a7a'], ['#101838', '#34306a', '#b0507a', '#ffc890']];
  const SKY = PAL.map(p => K.T.sky(164, 124, p)), ROOF = K.T.brick(64, 64, '#3a3050'), MOON = K.ball(10, '#ffe9c0');
  const HINT = ['', 'JUMP THE SPIKES', 'SLIDE UNDER LANTERNS', 'LEAP OVER THE GAPS', 'BATS! SLIDE UNDER', 'DOUBLE TROUBLE', 'SLIDE - THEN JUMP!', 'STAR STORM', 'RUN TO THE GOLD GATE'];
  const FORCE = [0, 'sp', 'ln', 'gap', 'bat', 'sp2', 'lnsp', 'pair', 0], len = s => 1700 + 220 * s;
  const S = { y: GY, vy: 0, jumps: 0, air: 0, sl: 0, slq: 0, jb: 0, hp: 3, inv: 0, fell: 0, sp: 108, dist: 0, far: 0, t: 0, stage: 1, end: len(1), next: 170, force: 'sp', last: '',
    streak: 0, mult: 1, shake: 0, gate: null, ban: { t: 3, a: 'STAGE 1', b: HINT[1] }, obs: [], gaps: [], coins: [], ps: [] };

  /* ---- effects ---- */
  const puff = (x, y, c, n, v, g) => { for (let i = 0; i < n; i++) S.ps.push({ x, y, vx: A.rnd(-v, v) - 30, vy: A.rnd(-v, v * .3), g: g || 0, l: A.rnd(.2, .5), c, s: Math.random() < .4 ? 2 : 1 }); };
  const pop = (txt, x, y, c) => S.ps.push({ x, y, vx: 0, vy: -22, g: 0, l: .7, c, txt });

  /* ---- level generator: every pattern returns its length in pixels ---- */
  const ob = (k, x, y, w, h, m) => S.obs.push({ k, x, y, w, h, m: m || 1, ph: A.rnd(0, 6) });
  const fly = (k, x, y, h, m) => ob(k, PX + (x - PX) * m, y, 10, h, m); /* faster than the roof, but arrives at the same moment */
  const arc = (cx, n, up) => { for (let i = 0; i < n; i++) S.coins.push({ x: cx + (i - (n - 1) / 2) * 13, y: GY - 24 - (up || 0) - Math.sin((i + .5) / n * Math.PI) * 18 }); };
  const line = (x, n, y) => { for (let i = 0; i < n; i++) S.coins.push({ x: x + i * 13, y }); };
  const PAT = {
    sp(X, s, rich) { const n = A.ri(1, Math.min(3, 1 + (s >> 1))); ob('sp', X, GY - 12, n * 8, 12); if (rich) arc(X + n * 4, 3); return n * 8; },
    hi(X, s, rich) { fly('st', X, GY - 41, 10, 1.25); if (rich) line(X - 20, 4, GY - 8); return 30; },
    lo(X) { fly('st', X, GY - 13, 10, 1.25); return 30; },
    co(X) { if (Math.random() < .5) line(X, 5, GY - 8); else arc(X + 26, 5); return 60; },
    ln(X, s, rich) { ob('ln', X, -10, 10, GY - 4); if (rich) line(X - 8, 3, GY - 5); return 10; },
    gap(X, s, rich) { const w = 28 + 2 * s + A.ri(0, 6); S.gaps.push({ x: X, w }); if (rich) arc(X + w / 2, 3); return w; },
    bat(X) { fly('bt', X, GY - 33, 6, 1.15); return 30; },
    cr(X, s, rich) { const n = s > 5 && Math.random() < .5 ? 2 : 1; ob('cr', X, GY - 12 * n, 12, 12 * n); if (rich) arc(X + 6, 3, 10 * n); return 12; },
    sp2(X) { ob('sp', X, GY - 12, 8, 12); ob('sp', X + S.sp, GY - 12, 8, 12); arc(X + 4, 3); arc(X + S.sp + 4, 3); return S.sp + 8; },
    lnsp(X) { ob('ln', X, -10, 10, GY - 4); line(X - 8, 3, GY - 5); ob('sp', X + S.sp * .85, GY - 12, 8, 12); return S.sp * .85 + 8; },
    pair(X) { fly('st', X, GY - 41, 10, 1.25); fly('st', X + S.sp * .75, GY - 13, 10, 1.25); return S.sp * .75 + 10; }
  };
  function pattern() { const s = S.stage, o = ['sp', 'sp', 'hi', 'co'];
    if (s > 1) o.push('ln', 'ln'); if (s > 2) o.push('gap', 'gap', 'lo'); if (s > 3) o.push('bat', 'cr'); if (s > 4) o.push('sp2', 'cr'); if (s > 5) o.push('lnsp', 'gap'); if (s > 6) o.push('pair', 'bat');
    let k = S.force || o[A.ri(0, o.length - 1)]; if (!S.force && k === S.last) k = o[A.ri(0, o.length - 1)]; S.force = 0; S.last = k;
    return PAT[k](190, s, Math.random() < .6); }

  /* ---- player ---- */
  const jump = () => { S.jb = .13; };
  const slide = () => { if (S.fell) return; if (S.air) { S.vy = Math.max(S.vy, 320); S.slq = 1; } else { if (S.sl <= 0) A.beep(240, .08, 'sawtooth', .03); S.sl = .5; } };
  function hurt() { S.hp--; S.inv = 1.7; S.shake = .3; S.streak = 0; S.mult = 1; A.beep(150, .3, 'sawtooth'); puff(PX, Math.min(GY, S.y) - 10, RED, 10, 60, 200); puff(PX, Math.min(GY, S.y) - 10, '#ffffff', 6, 60, 200); if (S.hp <= 0) A.over(); }
  function clear() { const s = S.stage, x = S.gate.x; S.gate.done = 1; A.add(50 * s); pop('+' + 50 * s, PX, GY - 30, '#ffd23c'); A.beep(660, .12, 'triangle', .05); A.beep(990, .3, 'triangle', .05);
    for (let i = 0; i < 4; i++) puff(x + A.rnd(-16, 16), GY - A.rnd(8, 44), i % 2 ? '#ffd23c' : '#fff6c8', 5, 50, 120);
    if (s === LAST) { A.add(250 * S.hp); A.over(true); return; }
    S.stage++; if (S.hp < 3) { S.hp++; pop('+1 HEART', PX + 30, GY - 22, '#ff8a9a'); } S.end = S.dist + len(S.stage); S.next = 120; S.force = FORCE[S.stage]; S.ban = { t: 3, a: 'STAGE ' + S.stage, b: HINT[S.stage] }; }

  return {
    key(k) { if (k === 'a' || k === 'up') jump(); else if (k === 'down') slide(); },
    swipe(d) { if (d === 'down') slide(); },
    update(dt) { S.t += dt; const s = S.stage, left = S.end - S.dist; S.sp = 98 + 10 * s + 8 * Math.min(1, 1 - left / len(s)); const dx = S.sp * dt; S.dist += dx;
      /* touch: left part of the screen slides while held, anywhere else jumps (on press, not on release) */
      let hold = !!A.keys.down; for (const p of A.ptrs) { if (!p.nd) { p.nd = p.x < 54 ? 2 : 1; if (p.nd === 2) slide(); else jump(); } if (p.nd === 2) hold = true; }
      /* spawning: patterns, then a clear run-up to the stage gate */
      if (!S.gate && left < 200) S.gate = { x: PX + left, gold: s === LAST };
      S.next -= dx; if (S.next <= 0 && left > 340) S.next = pattern() + S.sp * Math.max(.8, 1.1 - .04 * s) * A.rnd(.9, 1.15);
      if (S.gate) { S.gate.x -= dx; if (!S.gate.done && S.gate.x <= PX) { clear(); if (s === LAST) return; } if (S.gate.x < -40) S.gate = null; }
      /* jump (buffered a moment, so pressing just before landing still works) */
      if (S.jb > 0) { S.jb -= dt; if (S.jumps < 2 && !S.fell) { const dbl = S.jumps > 0; S.vy = dbl ? -230 : -262; S.jumps++; S.jb = 0; S.sl = 0; S.slq = 0; S.air = Math.max(S.air, .11); A.beep(dbl ? 760 : 560, .05); puff(PX, S.y, dbl ? '#8fd3ff' : '#d6dbea', dbl ? 7 : 4, 30); } }
      const gap = S.gaps.some(q => PX > q.x + 2 && PX < q.x + q.w - 2);
      if (S.fell) { if (!S.gaps.some(q => q.x < PX + 20 + S.sp * .7 && q.x + q.w > PX - 12)) { S.fell = 0; S.y = -14; S.vy = 0; S.jumps = 1; S.air = .2; S.inv = Math.max(S.inv, 1); } } /* drop back in only where the roof stays solid for the whole fall */
      else { const py = S.y; S.vy += 720 * dt; S.y += S.vy * dt;
        if (S.vy >= 0 && S.y >= GY && !gap && (py <= GY || S.y < GY + 6)) { if (S.air > .05) { puff(PX, GY, '#d6dbea', 4, 26); if (S.slq) S.sl = .3; } S.y = GY; S.vy = 0; S.jumps = 0; S.air = 0; S.slq = 0; }
        else { S.air += dt; S.sl = 0; if (!S.jumps && S.air > .1) S.jumps = 1; }
        if (S.y > 150) { S.fell = 1; hurt(); if (S.hp <= 0) return; } }
      if (S.sl > 0) { S.sl -= dt; if (hold && S.sl < .1) S.sl = .1; if (Math.random() < dt * 30) puff(PX - 8, GY, '#aab4c2', 1, 14); }
      S.inv -= dt; S.shake -= dt; S.ban.t -= dt;
      const top = S.y - (S.sl > 0 ? 9 : 21);
      for (const o of S.obs) { o.x -= dx * o.m; if (o.k === 'bt') o.y = GY - 33 + Math.sin(S.t * 5 + o.ph) * 12;
        if (S.inv <= 0 && !S.fell && PX + 4 > o.x + 2 && PX - 4 < o.x + o.w - 2 && S.y > o.y + 2 && top < o.y + o.h - 2) { hurt(); if (S.hp <= 0) return; } }
      for (const c of S.coins) { c.x -= dx;
        if (!S.fell && Math.abs(c.x - PX) < 9 && c.y > top - 5 && c.y < S.y + 3) { c.got = 1; const v = 10 * S.mult; A.add(v); pop('+' + v, c.x, c.y - 6, '#ffd23c'); puff(c.x, c.y, '#ffd23c', 4, 40); A.beep(1000 + S.mult * 90, .04, 'triangle');
          S.streak++; const m = Math.min(5, 1 + (S.streak >> 2)); if (m > S.mult) { S.mult = m; pop('STREAK X' + m, 130, 36, '#5fe3d6'); A.beep(1500, .1, 'triangle'); } }
        else if (c.x < -6 && S.streak) { S.streak = 0; S.mult = 1; } }
      for (const q of S.gaps) q.x -= dx;
      for (const p of S.ps) { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; }
      S.obs = S.obs.filter(o => o.x > -30); S.coins = S.coins.filter(c => c.x > -8 && !c.got); S.gaps = S.gaps.filter(q => q.x + q.w > -10); S.ps = S.ps.filter(p => p.l > 0).slice(-140);
      const d = Math.floor(S.dist / 20); if (d > S.far) { A.add(d - S.far); S.far = d; }
      A.info('STAGE ' + S.stage + '/' + LAST); },

    draw(g) { const t = S.t, dist = S.dist, pi = (S.stage - 1) % 4, air = S.air > 0, sh = S.shake > 0;
      g.save(); if (sh) g.translate(A.ri(-1, 1), A.ri(-1, 1));
      /* sky, moon, two parallax skylines */
      g.drawImage(SKY[pi], -2, -2); if (pi === 1 || pi === 2) for (let i = 0; i < 14; i++) K.box(g, i * 47 % 160, i * 29 % 50, 1, 1, (i + Math.floor(t * 2)) % 5 ? '#d6dbea' : '#59627a');
      const mx = 143 - S.stage, my = 26 + S.stage * 2; K.put(g, MOON, mx, my); K.box(g, mx - 5, my - 4, 3, 3, '#e0c8a0'); K.box(g, mx + 3, my + 3, 2, 2, '#e0c8a0'); /* sinks a little each stage, clear of the banner */
      for (let i = -1; i < 9; i++) { const x = i * 24 - Math.floor(dist * .12) % 24, h = 22 + ((i + Math.floor(dist * .12 / 24)) * 31 % 26 + 26) % 26; K.box(g, x, GY - h, 20, h, '#2a2050'); K.box(g, x, GY - h, 20, 1, '#4a3a7a'); }
      for (let i = -1; i < 6; i++) { const n = i + Math.floor(dist * .3 / 40), x = i * 40 - Math.floor(dist * .3) % 40, h = 30 + (n * 37 % 30 + 30) % 30; K.put(g, K.building(26, h, (n % 3 + 3) % 3), x + 13, GY - h / 2 - 3); }
      if (S.gate) K.put(g, gate(S.gate.gold ? 1 : 0), S.gate.x, GY - 29);
      const ninja = () => { if (S.fell || (S.inv > 0 && Math.floor(t * 14) % 2)) return; const y = Math.round(S.y);
        if (S.sl > 0) { K.box(g, PX - 22, y - 8, 8, 1, RED); K.put(g, SLIDE, PX, y - 6); }
        else { K.box(g, PX - 14 - (air ? 2 : 0), y - 22 + (air ? 0 : Math.floor(dist / 10) % 2), 9, 1, RED); K.put(g, K.guy(NIN, air ? 3 : 1 + Math.floor(dist / 9) % 2), PX, y - 14); } };
      if (S.y > GY + 1) ninja(); /* falling into a gap: behind the roof edge */
      /* the roof, cut open where the gaps are */
      K.box(g, 0, GY, 160, 32, '#0e0a1c'); g.save(); g.beginPath(); let x0 = -4; for (const q of S.gaps) { const x = Math.round(q.x); g.rect(x0, GY, x - x0, 36); x0 = x + Math.round(q.w); } g.rect(x0, GY, 170 - x0, 36); g.clip();
      for (let x = -(Math.round(dist) % 64); x < 160; x += 64) g.drawImage(ROOF, 0, 0, 64, 32, x, GY, 64, 32); K.box(g, 0, GY, 160, 3, '#8a94a4'); K.box(g, 0, GY, 160, 1, '#d6dbea'); K.box(g, 0, GY + 3, 160, 1, INK); g.restore();
      for (const q of S.gaps) { const x = Math.round(q.x); K.box(g, x - 2, GY, 2, 32, INK); K.box(g, x + Math.round(q.w), GY, 2, 32, INK); }
      /* traps (with a "!" at the edge for anything flying in), coins */
      for (const o of S.obs) { const x = Math.round(o.x);
        if (o.k === 'sp') for (let i = 0; i < o.w; i += 8) K.put(g, K.spike(), x + i + 4, o.y + 6);
        else if (o.k === 'cr') for (let i = 0; i < o.h; i += 12) K.put(g, K.crate(12), x + 6, o.y + i + 6);
        else if (o.k === 'ln') { K.box(g, x + 4, 0, 1, GY - 30, '#3a2a20'); K.box(g, x + 5, 0, 1, GY - 30, '#8a6a4a'); K.put(g, LAN, x + 5, GY - 23); }
        else { K.put(g, o.k === 'bt' ? K.bat(Math.floor(t * 8) % 2) : K.shur(Math.floor(t * 14) % 2), x + 5, o.y + o.h / 2);
          if (x > 158 && Math.floor(t * 8) % 2) { K.box(g, 150, o.y + o.h / 2 - 5, 7, 9, RED); A.text(g, '!', 152, o.y + o.h / 2 - 3, '#ffffff'); } } }
      for (const c of S.coins) K.put(g, K.coin(Math.floor(t * 8) % 4), c.x, c.y);
      if (S.y <= GY + 1) { if (!S.fell && !S.gaps.some(q => PX > q.x && PX < q.x + q.w)) K.shadow(g, PX + 1, GY + 1, air ? 3 : 5, 1.5); ninja(); }
      for (const p of S.ps) { if (p.txt) { A.text(g, p.txt, p.x + 1, p.y + 1, INK, 1, 'center'); A.text(g, p.txt, p.x, p.y, p.c, 1, 'center'); } else K.box(g, Math.round(p.x), Math.round(p.y), p.s, p.s, p.c); }
      g.restore();
      /* HUD: hearts, stage progress, coin streak, banner, first hints */
      for (let i = 0; i < 3; i++) K.put(g, K.heart(), 9 + i * 13, 9, i < S.hp ? null : { a: .25 });
      K.box(g, 55, 5, 52, 5, INK); K.box(g, 56, 6, 50, 3, '#3a3050'); K.box(g, 56, 6, Math.round(50 * Math.max(0, Math.min(1, 1 - (S.end - dist) / len(S.stage)))), 3, S.stage === LAST ? '#ffd23c' : '#5fe3d6'); K.box(g, 105, 3, 2, 9, RED);
      if (S.mult > 1) { A.text(g, 'X' + S.mult, 155, 6, INK, 2, 'right'); A.text(g, 'X' + S.mult, 154, 5, '#5fe3d6', 2, 'right'); }
      if (S.ban.t > 0 && (S.ban.t > .5 || Math.floor(t * 12) % 2)) { A.text(g, S.ban.a, 81, 25, INK, 2, 'center'); A.text(g, S.ban.a, 80, 24, '#ffd23c', 2, 'center'); A.text(g, S.ban.b, 81, 40, INK, 1, 'center'); A.text(g, S.ban.b, 80, 39, '#ffffff', 1, 'center'); }
      if (S.stage === 1 && t < 7) { if (TOUCH) { K.box(g, 54, GY + 8, 1, 20, '#8a94a4'); A.text(g, 'HOLD: SLIDE', 27, 104, '#d6dbea', 1, 'center'); A.text(g, 'TAP: JUMP', 107, 104, '#d6dbea', 1, 'center'); } else A.text(g, 'SPACE: JUMP    DOWN: SLIDE', 80, 104, '#d6dbea', 1, 'center'); } }
  };
} });
