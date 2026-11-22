/* Bubble Blaster v0.4 — 12 levels: clear every coloured bubble before the ceiling pushes them over the line.
   Cells live in a Map keyed row*16+col; value = type (0-5 colour, 6 stone, 7 bomb) + 16 when it hides a star. */
Arcade.game('bubble-blaster', { w: 240, h: 320, pad: 'lr', a: 'SHOOT',
help: 'Aim with the mouse or drag your finger, then click or let go to shoot (or left / right and Space). Join 3 or more bubbles of one colour to pop them; anything left hanging falls for bonus points. Pop on shot after shot to grow your multiplier, and every 3 in a row earns a rainbow bubble that matches any colour. Grey stones never pop, so drop them. Touch a bomb to blast everything around it. Stars are worth +100. Swap your bubble with the next one using Down or by tapping the launcher. Shots that pop nothing use up the DROP lights: when they run out the ceiling comes down. Bubbles over the red line cost a heart. Clear all 12 levels to win!',
init(A) {
  const K = Art, ID = 'bubble-blaster', RH = 21, LX = 120, LY = 296, LINE = 268, SP = 430, STONE = 6, BOMB = 7, RAIN = 8, STAR = 16, LEVELS = 12;
  const COL = ['#e8231e', '#ffd23c', '#3fd45a', '#3fa8e0', '#b06ae0', '#ff8a1e'], BG = ['#2a2458', '#1f3a5a', '#3a2450', '#1f4040', '#40283a', '#2a3060'];
  const HINT = ['JOIN 3 OF ONE COLOUR', 'STARS ARE WORTH +100', 'STONES NEVER POP - DROP THEM', 'TOUCH A BOMB TO BLAST', '5 COLOURS NOW', 'KEEP POPPING FOR A RAINBOW', 'USE THE WALLS TO BOUNCE', 'THE CEILING DROPS FASTER', '6 COLOURS NOW', 'SWAP TO SAVE A SHOT', 'NEARLY THERE', 'LAST LEVEL!'];
  const LV = n => ({ nc: [3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6][n - 1], rows: Math.min(8, 4 + (n >> 1)), stones: n < 3 ? 0 : n + 1, bombs: n < 4 ? 0 : 1 + (n >> 2), stars: n < 2 ? 0 : Math.min(4, 1 + (n / 3 | 0)), miss: n < 3 ? 6 : n < 8 ? 5 : 4 });
  const MASK = [() => true, (r, c) => (r + c) % 4 !== 3, (r, c, n) => r < n - Math.abs(c - 4.5) / 1.5, (r, c) => c % 5 !== 2 || r < 2, (r, c, n) => r < n - 3 + Math.abs(c - 4.5) / 1.4, (r, c) => r % 3 !== 2 || c % 3 !== 1];

  /* ---- sprites (cached by Art) ---- */
  const GLYPH = [[-1, -1, 3, 3], [-3, 0, 7, 1], [0, -3, 1, 7], [-2, -2, 2, 2, 1, 1, 2, 2], [-3, -1, 2, 2, 2, -1, 2, 2], [-2, 1, 5, 1, -1, -1, 3, 1]];
  const BUB = COL.map((c, i) => K.spr(ID + 'b' + i, 22, 22, g => { K.ell(g, 0, 0, 11, 11, K.rad(g, -4, -4, 1, 17, K.lite(c, .7), c, K.dark(c, .6))); K.ell(g, -4, -5, 3, 2, '#ffffff');
    const q = GLYPH[i]; for (let j = 0; j < q.length; j += 4) K.box(g, q[j] + 1, q[j + 1] + 2, q[j + 2], q[j + 3], K.dark(c, .45)); }));
  BUB[STONE] = K.spr(ID + 'stone', 22, 22, g => { g.beginPath(); K.org(g, 0, 0, 12, 3, 9); g.fillStyle = K.rad(g, -4, -4, 1, 17, '#c8d0dc', '#7a8496', '#3a4252'); g.fill(); K.box(g, -5, 1, 4, 1, '#3a4252'); K.box(g, -2, 2, 1, 3, '#3a4252'); K.box(g, 3, -4, 3, 1, '#3a4252'); K.box(g, -5, -5, 3, 1, '#eef2f8'); });
  BUB[BOMB] = K.spr(ID + 'bomb', 22, 22, g => { K.box(g, -2, -11, 4, 4, '#aab4c2'); K.ell(g, 0, 1, 10, 10, K.rad(g, -4, -3, 1, 15, '#7a7488', '#2a2436', '#0e0a16')); K.ell(g, -4, -3, 2.4, 1.6, '#c8c0d8'); K.box(g, -3, 2, 7, 2, '#e8231e'); K.box(g, -1, 0, 3, 6, '#e8231e'); });
  BUB[RAIN] = K.spr(ID + 'rain', 22, 22, g => { [0, 5, 1, 2, 3, 4].forEach((c, i) => K.ell(g, 0, 0, 11 - i * 1.9, 11 - i * 1.9, COL[c])); K.ell(g, -4, -5, 3, 2, '#ffffff'); }, { L: 12 });
  const STARSPR = K.star('#fff6c8'), BASE = K.spr(ID + 'base', 44, 20, g => { K.part(g, [-22, 10, -14, -8, 14, -8, 22, 10], K.lin(g, -22, 0, 22, 0, '#aab4c2', '#5c6678', '#2a2f3d')); K.box(g, -12, -5, 24, 2, '#f2f5f8'); });
  const BARREL = K.spr(ID + 'barrel', 12, 44, g => { K.rr(g, -6, -22, 12, 22, 2, K.lin(g, -6, 0, 6, 0, '#e8edf4', '#8a94a8', '#3a4252')); K.box(g, -6, -22, 12, 3, '#ffd23c'); });
  const F = K.fx();

  /* ---- state ---- */
  const grid = new Map(), falls = [], pops = [], notes = [], gp = [];
  let lv = 1, L = LV(1), lives = 3, drop = 0, dropY = 0, miss = 0, streak = 0, ang = -Math.PI / 2, hold = 0, ball = null, cur = 0, nxt = 0;
  let mode = '', timer = 0, banner = 0, shake = 0, recoil = 0, t = 0, ver = 0, gAng = 9, gVer = -1, drag = false;
  const aim = (x, y) => { ang = Math.max(-Math.PI + .14, Math.min(-.14, Math.atan2(Math.min(y, LY - 4) - LY, x - LX))); };

  /* ---- grid helpers ---- */
  const cols = r => r % 2 ? 9 : 10, cx = k => 12 + (k & 15) * 24 + ((k >> 4) % 2 ? 12 : 0), cy = k => 12 + ((k >> 4) + drop) * RH, typ = k => grid.get(k) & 15;
  function nbs(k) { const r = k >> 4, c = k & 15, o = r % 2 ? 0 : -1, out = [];
    for (const [rr, cc] of [[r, c - 1], [r, c + 1], [r - 1, c + o], [r - 1, c + o + 1], [r + 1, c + o], [r + 1, c + o + 1]]) if (rr >= 0 && rr < 16 && cc >= 0 && cc < cols(rr)) out.push(rr * 16 + cc);
    return out; }
  function group(k, v) { const out = [k], seen = new Set(out); for (let i = 0; i < out.length; i++) for (const n of nbs(out[i])) if (!seen.has(n) && grid.has(n) && typ(n) === v) { seen.add(n); out.push(n); } return out; }
  function floaters() { const ok = new Set(), q = []; for (const k of grid.keys()) if (k < 16) { ok.add(k); q.push(k); }
    while (q.length) for (const n of nbs(q.pop())) if (grid.has(n) && !ok.has(n)) { ok.add(n); q.push(n); }
    return [...grid.keys()].filter(k => !ok.has(k)); }
  const colours = () => { const s = new Set(); for (const v of grid.values()) if ((v & 15) < STONE) s.add(v & 15); return [...s]; };
  const pick = () => { const s = colours(); return s.length ? s[A.ri(0, s.length - 1)] : A.ri(0, L.nc - 1); };
  const note = (s, x, y, c) => notes.push({ s, x: Math.max(24, Math.min(216, x)), y, c: c || '#ffffff', l: 1 });
  const hud = () => A.info('LEVEL ' + lv + (streak > 1 ? '  X' + Math.min(5, streak) : ''));

  function build() { L = LV(lv); grid.clear(); drop = dropY = miss = 0; ver++; const mask = MASK[(lv - 1) % MASK.length];
    for (let r = 0; r < L.rows; r++) for (let c = 0; c < cols(r); c++) if (!r || mask(r, c, L.rows)) { const k = r * 16 + c, nb = nbs(k).filter(n => grid.has(n));
      grid.set(k, nb.length && Math.random() < .4 ? grid.get(nb[A.ri(0, nb.length - 1)]) : A.ri(0, L.nc - 1)); }
    floaters().forEach(k => grid.delete(k));
    const cells = [...grid.keys()].filter(k => k >= 16).sort(() => Math.random() - .5), perRow = {}; let s = L.stones, b = L.bombs, st = L.stars;
    for (const k of cells) { const r = k >> 4;
      if (s && r >= 2 && (perRow[r] || 0) < 3) { grid.set(k, STONE); perRow[r] = (perRow[r] || 0) + 1; s--; } else if (b) { grid.set(k, BOMB); b--; } else if (st) { grid.set(k, grid.get(k) | STAR); st--; } }
    cur = pick(); nxt = pick(); banner = 2.6; hud(); }

  /* ---- removing bubbles ---- */
  function pop(k, i) { const v = grid.get(k); grid.delete(k); pops.push({ x: cx(k), y: cy(k), v, d: i * .035, i }); return v & STAR ? 1 : 0; }
  function fall(k, i) { const v = grid.get(k); grid.delete(k); falls.push({ x: cx(k), y: cy(k), vx: A.rnd(-40, 40), vy: A.rnd(-90, -20) - i * 4, v }); return v & STAR ? 1 : 0; }
  function dropLoose() { let n = 0, stars = 0; for (const k of floaters()) stars += fall(k, n++); return [n, stars]; }

  function shoot() { if (ball || mode) return; ball = { x: LX, y: LY, vx: Math.cos(ang) * SP, vy: Math.sin(ang) * SP, v: cur }; cur = nxt; nxt = pick(); recoil = 1; A.beep(620, .05); A.beep(310, .07, 'triangle'); }
  function swap() { if (mode) return; const c = cur; cur = nxt; nxt = c; A.beep(440, .04, 'triangle'); }

  function land() { const b = ball; ball = null; let best = -1, bd = 1e9;
    for (let r = 0; r < 16; r++) for (let c = 0; c < cols(r); c++) { const k = r * 16 + c; if (grid.has(k) || !(r === 0 || nbs(k).some(n => grid.has(n)))) continue;
      const d = (cx(k) - b.x) ** 2 + (cy(k) - b.y) ** 2; if (d < bd) { bd = d; best = k; } }
    if (best < 0) return;
    let v = b.v; const x = cx(best), y = cy(best);
    if (v === RAIN) { let top = 0; v = pick(); for (const c of new Set(nbs(best).filter(n => grid.has(n) && typ(n) < STONE).map(typ))) { const n = group(best, c).length; if (n > top) { top = n; v = c; } } }
    grid.set(best, v); ver++;
    const rem = new Set(), grp = group(best, v), bombs = nbs(best).filter(n => grid.has(n) && typ(n) === BOMB);
    if (grp.length >= 3) grp.forEach(k => rem.add(k));
    for (let i = 0; i < bombs.length; i++) { const k = bombs[i]; rem.add(k); F.boom(cx(k), cy(k), 1); shake = .35;
      for (const n of nbs(k)) if (grid.has(n)) { rem.add(n); if (typ(n) === BOMB && !bombs.includes(n)) bombs.push(n); } }
    if (rem.size) { streak++; let i = 0, stars = 0; for (const k of rem) stars += pop(k, i++);
      const [nf, fs] = dropLoose(), mult = Math.min(5, streak), pts = (rem.size * 10 + nf * 20) * mult + (stars + fs) * 100; A.add(pts);
      note('+' + pts, x, y - 4, '#ffd23c'); if (mult > 1) note('X' + mult, x, y + 6, '#5fe3d6'); if (stars + fs) note('STAR!', x, y - 16, '#fff6c8');
      if (bombs.length) A.beep(90, .3, 'sawtooth', .07); if (nf > 2) A.beep(240, .2, 'triangle');
      if (streak % 3 === 0) { nxt = RAIN; note('RAINBOW BUBBLE!', LX, 250, '#ff8a9a'); A.beep(990, .12, 'triangle'); A.beep(1320, .18, 'triangle'); } }
    else { streak = 0; A.beep(200, .05, 'triangle'); F.spark(x, y, ['#ffffff'], 4, 40);
      if (++miss >= L.miss) { miss = 0; drop++; ver++; shake = .3; A.beep(110, .25, 'sawtooth', .06); } }
    settle(); }

  function settle() { hud();
    if (!colours().length) { let n = 0; for (const k of [...grid.keys()]) fall(k, n++); const bonus = lv * 100; A.add(bonus + n * 20); mode = 'clear'; timer = 2;
      note('LEVEL CLEAR! +' + bonus, LX, 150, '#ffd23c'); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => A.beep(f, .14, 'square', .05), i * 110)); return; }
    let low = 0; for (const k of grid.keys()) low = Math.max(low, (k >> 4) + drop);
    if (low >= 12) { if (--lives <= 0) { shake = .5; A.over(); return; }
      /* lose a heart: the ceiling goes back up and the lowest rows burst */
      let i = 0; for (const k of [...grid.keys()]) if (k >> 4 >= 7) pop(k, i++); dropLoose(); drop = miss = streak = 0; ver++; shake = .6; note('OUCH! -1 HEART', LX, 230, '#ff8a9a'); A.beep(140, .4, 'sawtooth', .07); hud();
      if (!colours().length) return settle(); }
    const s = colours(); if (cur < STONE && !s.includes(cur)) cur = pick(); if (nxt < STONE && !s.includes(nxt)) nxt = pick(); }

  /* dotted aim line: follows wall bounces and stops where the shot will land (shorter on later levels) */
  function guide() { if (gAng === ang && gVer === ver) return; gAng = ang; gVer = ver; gp.length = 0;
    let x = LX, y = LY, vx = Math.cos(ang) * 4, vy = Math.sin(ang) * 4; const top = 12 + drop * RH, max = lv < 3 ? 200 : Math.max(26, 70 - lv * 4);
    for (let i = 1; i < max; i++) { x += vx; y += vy; if (x < 12 || x > 228) vx = -vx; if (y <= top || hits(x, y)) break; if (i > 4 && i % 4 === 0) gp.push(x, y); } }
  function hits(x, y) { for (const k of grid.keys()) if ((cx(k) - x) ** 2 + (cy(k) - y) ** 2 < 400) return true; return false; }
  const bub = (g, v, x, y, o) => { K.put(g, BUB[v & 15], x, y, o); if (v & STAR) K.put(g, STARSPR, x, y + 1, o); };

  build();
  return {
    key(k) { if (k === 'a' || k === 'up') shoot(); else if (k === 'down') swap(); },
    tap(x, y) { if (y > 284) return swap(); aim(x, y); shoot(); }, swipe(d, x0, y0) { drag = y0 <= 284; },
    update(dt) { t += dt; const p = A.ptr;
      if ((p.moved || p.down) && p.y < 284) aim(p.x, p.y);
      if (drag && !p.down) { drag = false; shoot(); } /* drag to aim, let go to shoot */
      const d = (A.keys.right ? 1 : 0) - (A.keys.left ? 1 : 0); hold = d ? hold + dt : 0; ang += d * dt * Math.min(2.2, .5 + hold * 4);
      ang = Math.max(-Math.PI + .14, Math.min(-.14, ang));
      dropY += (drop * RH - dropY) * Math.min(1, dt * 12); banner -= dt; shake = Math.max(0, shake - dt); recoil = Math.max(0, recoil - dt * 6);
      for (const f of falls) { f.vy += 700 * dt; f.x += f.vx * dt; f.y += f.vy * dt; } for (let i = falls.length - 1; i >= 0; i--) if (falls[i].y > 340) falls.splice(i, 1);
      for (let i = pops.length - 1; i >= 0; i--) { const q = pops[i]; if ((q.d -= dt) <= 0) { const c = COL[q.v & 15] || '#aab4c2'; F.spark(q.x, q.y, [c, '#ffffff', K.lite(c, .5)], 7, 80); if (q.i < 12) A.beep(520 + q.i * 55, .05, 'triangle'); pops.splice(i, 1); } }
      for (let i = notes.length - 1; i >= 0; i--) { notes[i].y -= 14 * dt; if ((notes[i].l -= dt * .7) <= 0) notes.splice(i, 1); }
      if (mode === 'clear') { if ((timer -= dt) <= 0) { if (lv >= LEVELS) { mode = 'done'; A.add(1000 + lives * 250); A.over(true); } else { mode = ''; lv++; build(); } } return; }
      if (!ball) return; const top = 12 + drop * RH;
      for (let i = 0; i < 6 && ball; i++) { ball.x += ball.vx * dt / 6; ball.y += ball.vy * dt / 6;
        if (ball.x < 12) { ball.x = 12; ball.vx = Math.abs(ball.vx); A.beep(380, .03); } if (ball.x > 228) { ball.x = 228; ball.vx = -Math.abs(ball.vx); A.beep(380, .03); }
        if (ball.y <= top || hits(ball.x, ball.y)) land(); } },
    draw(g) { K.scroll(g, K.T.panel(64, 64, BG[(lv - 1) % BG.length]), 0, 0, 240, 320); g.save();
      if (shake > 0) g.translate(Math.round(Math.sin(t * 90) * shake * 5), Math.round(Math.cos(t * 70) * shake * 4));
      const off = Math.round(dropY - drop * RH), warn = miss === L.miss - 1 && !mode, wob = warn && Math.sin(t * 28) > 0 ? 1 : 0; let low = 0;
      /* ceiling */
      for (let r = 0; r < drop; r++) for (let x = 0; x < 240; x += 24) g.drawImage(K.block(24, RH, '#59627a'), x, Math.round(dropY) - (r + 1) * RH);
      K.box(g, 0, Math.max(0, Math.round(dropY)), 240, 2, '#2a2f3d'); for (let x = 2; x < 240; x += 8) K.box(g, x, Math.round(dropY) + 2, 4, 2, '#aab4c2');
      for (const [k, v] of grid) { const x = cx(k) + wob, y = cy(k) + off; low = Math.max(low, (k >> 4) + drop); K.box(g, x - 9, y - 7, 20, 18, 'rgba(0,0,0,.25)'); bub(g, v, x, y); if ((v & 15) === BOMB && Math.sin(t * 9 + k) > 0) K.box(g, x - 1, y - 12, 2, 2, '#ffd23c'); }
      for (const q of pops) bub(g, q.v, q.x, q.y); for (const f of falls) bub(g, f.v, f.x, f.y);
      /* red line: flashes when bubbles are close */
      const hot = low >= 10 && Math.sin(t * 12) > 0; for (let x = 0; x < 240; x += 8) K.box(g, x, LINE, 4, 2, hot ? '#ffffff' : '#e8231e');
      if (!ball && !mode) { guide(); for (let i = 0; i < gp.length; i += 2) { const x = Math.round(gp[i]), y = Math.round(gp[i + 1]), end = i === gp.length - 2 && lv < 3; K.box(g, x - 2, y - 2, 4, 4, '#140e1c'); K.box(g, x - 1, y - 1, 2, 2, end ? '#ffd23c' : '#ffffff'); } }
      /* launcher */
      K.put(g, BARREL, LX - Math.cos(ang) * recoil * 4, LY - Math.sin(ang) * recoil * 4, { rot: ang + Math.PI / 2 }); K.put(g, BASE, LX, 309);
      if (ball) bub(g, ball.v, ball.x, ball.y); if (mode !== 'clear') bub(g, cur, LX, LY);
      /* HUD */
      A.text(g, 'LEVEL ' + lv, 6, 276, '#ffffff'); for (let i = 0; i < 3; i++) K.put(g, K.heart(), 12 + i * 14, 291, i < lives ? null : { a: .2 });
      A.text(g, 'DROP', 6, 303, warn && wob ? '#ff8a9a' : '#aab4c2'); for (let i = 0; i < L.miss; i++) K.box(g, 6 + i * 7, 311, 5, 5, i < L.miss - miss ? (warn ? '#ff8a9a' : '#5fe3d6') : '#140e1c');
      A.text(g, 'NEXT', 234, 276, '#aab4c2', 1, 'right'); if (nxt === RAIN) K.put(g, BUB[RAIN], 204, 296, { sc: .64 }); else K.put(g, K.ball(7, COL[nxt]), 204, 296);
      if (streak > 1) A.text(g, 'X' + Math.min(5, streak), 234, 291, '#5fe3d6', 2, 'right'); A.text(g, 'SWAP', 234, 309, '#59627a', 1, 'right');
      F.draw(g);
      for (const n of notes) { A.text(g, n.s, n.x + 1, n.y + 1, '#140e1c', 1, 'center'); A.text(g, n.s, n.x, n.y, n.l < .25 && Math.sin(t * 40) > 0 ? '#aab4c2' : n.c, 1, 'center'); }
      if (banner > 0 && !mode) { K.box(g, 0, 196, 240, 34, 'rgba(14,10,22,.82)'); K.box(g, 0, 196, 240, 1, '#ffd23c'); K.box(g, 0, 229, 240, 1, '#ffd23c');
        A.text(g, 'LEVEL ' + lv + ' OF ' + LEVELS, LX, 202, '#ffd23c', 2, 'center'); A.text(g, HINT[lv - 1], LX, 219, '#ffffff', 1, 'center'); }
      g.restore(); }
  };
} });
