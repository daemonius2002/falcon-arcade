Arcade.game('memory-cards', { w: 180, h: 224,
help: 'Tap two cards to turn them over (keyboard: arrows move the frame, Space turns a card). Two of the same picture stay open. Find every pair to clear the level - there are 7 levels and the boards get bigger. Peeking at new cards is free, but a miss with a card you have already seen (yellow corner dot) costs a heart. Matches in a row are worth more and more points. From level 3 the golden eye pair shows you every card for a moment, from level 4 the golden heart pair gives a heart back, and from level 5 two cards swap places now and then - watch them closely! Clear a level without losing a heart for a PERFECT bonus. The game ends when you run out of hearts or beat level 7.',
init(A) {
  const K = Art, F = K.fx(), ID = 'memory-cards-', E = K.ell, B = K.box, P = K.part, EYE = 20, HEART = 21, MAXH = 6;
  const LV = [[4, 3], [4, 4], [4, 5], [5, 6], [5, 6], [6, 6], [6, 6]], SWAP = [0, 0, 0, 0, 4, 5, 3]; /* board size and "swap two cards every N turns" per level */
  const TIP = [['FIND ALL THE PAIRS', 'NEW CARDS ARE FREE TO PEEK'], ['A MISS WITH A CARD YOU HAVE', 'SEEN BEFORE COSTS A HEART'], ['NEW: THE GOLDEN EYE PAIR', 'SHOWS YOU EVERY CARD'], ['NEW: THE GOLDEN HEART PAIR', 'GIVES A HEART BACK'],
    ['WATCH OUT! NOW AND THEN', 'TWO CARDS SWAP PLACES'], ['THE BIG BOARD: 18 PAIRS', 'TAKE YOUR TIME'], ['LAST LEVEL!', 'THE CARDS SWAP FASTER']];
  const BG = ['#1f5a3a', '#1f4a6a', '#4a2f6a', '#6a3a2a', '#1f5a5a', '#3a3f7a', '#6a2a4a'];

  /* ---------- card pictures: drawn in a -10..10 box, made into crisp outlined sprites at the size each board needs ---------- */
  const burst = (n, r1, r2) => { const p = []; for (let i = 0; i < n * 2; i++) { const a = i / n * Math.PI, r = i % 2 ? r2 : r1; p.push(Math.sin(a) * r, -Math.cos(a) * r); } return p; };
  const ICON = [
    g => { B(g, -1, -9, 2, 4, '#7a4a1e'); E(g, 0, 2, 7.5, 7, '#e8231e'); E(g, -3, -1, 2, 2, '#ff9a8a'); E(g, 4, -7, 3, 1.6, '#3fd45a'); }, /* apple */
    g => { P(g, burst(8, 10, 6), '#ff9a2a'); E(g, 0, 0, 5.6, 5.6, '#ffd23c'); B(g, -3, -1, 1, 2, '#7a4a1e'); B(g, 2, -1, 1, 2, '#7a4a1e'); B(g, -1, 2, 2, 1, '#7a4a1e'); }, /* sun */
    g => { E(g, -1, 0, 8.5, 8.5, '#cfe0ff'); g.globalCompositeOperation = 'destination-out'; E(g, 4, -3, 7, 7, '#000'); g.globalCompositeOperation = 'source-over'; P(g, burst(4, 3.4, 1.2).map((v, i) => v + (i % 2 ? -5 : 6)), '#ffd23c'); }, /* moon */
    g => { B(g, -2, 4, 4, 6, '#7a4a1e'); P(g, [0, -5, 8.5, 5, -8.5, 5], '#2f8a3a'); P(g, [0, -10, 6.5, -1, -6.5, -1], '#3fa84a'); }, /* tree */
    g => { P(g, [4, 0, 10, -6, 10, 6], '#e8641e'); E(g, -2, 0, 7.5, 5.2, '#ff8a1e'); B(g, -1, -4, 2, 8, '#fff6c8'); E(g, -5.5, -1, 1.6, 1.6, '#ffffff'); B(g, -6, -2, 1, 1, '#1a1222'); }, /* fish */
    g => { P(g, [-2, 5, 2, 5, 0, 10], '#ff9a2a'); P(g, [-4, 0, -8, 8, -4, 6], '#e8231e'); P(g, [4, 0, 8, 8, 4, 6], '#e8231e'); P(g, [0, -10, 4, -4, 4, 6, -4, 6, -4, -4], '#e8ecf4'); P(g, [0, -10, 3.2, -5, -3.2, -5], '#e8231e'); E(g, 0, -1, 2.2, 2.2, '#3fa8e0'); }, /* rocket */
    g => { B(g, -7, -1, 14, 10, '#f0d8a0'); P(g, [0, -10, 10, -1, -10, -1], '#c8402a'); B(g, -5, 3, 4, 6, '#7a4a1e'); B(g, 1, 2, 4, 4, '#3fa8e0'); }, /* house */
    g => { B(g, -3, 0, 6, 9, '#f2e6c8'); P(g, [-9.5, 2, -8, -4, -4, -8, 0, -9, 4, -8, 8, -4, 9.5, 2], '#e8231e'); E(g, -4, -3, 1.8, 1.8, '#ffffff'); E(g, 3, -5, 1.6, 1.6, '#ffffff'); E(g, 5, -1, 1.2, 1.2, '#ffffff'); }, /* mushroom */
    g => { B(g, 0, 5, 1, 5, '#f2efe6'); P(g, [-2, 6, 2, 6, 0, 3], '#ff5aa8'); E(g, 0, -3, 6.5, 7.5, '#ff5aa8'); E(g, -2.5, -6, 1.5, 2.2, '#ffc0dc'); }, /* balloon */
    g => { for (let i = 0; i < 8; i++) E(g, Math.sin(i * .785) * 6.2, -Math.cos(i * .785) * 6.2, 3, 3, i % 2 ? '#b06ae0' : '#c88af0'); E(g, 0, 0, 3.6, 3.6, '#ffd23c'); E(g, -1, -1, 1, 1, '#fff6c8'); }, /* flower */
    g => { B(g, -1, -9, 1, 12, '#7a4a1e'); P(g, [1, -9, 8, 1, 1, 1], '#f2efe6'); P(g, [-2, -6, -2, 1, -7, 1], '#ff9a2a'); P(g, [-9, 3, 9, 3, 6, 8, -6, 8], '#3f6ad0'); }, /* boat */
    g => { P(g, [0, -10, 5.4, 1, -5.4, 1], '#3fa8e0'); E(g, 0, 3, 6.2, 6.2, '#3fa8e0'); E(g, -2.5, 3, 1.4, 2.6, '#bfe6ff'); }, /* water drop */
    g => { P(g, [-5, 0, 5, 0, 0, 10], '#d89a5a'); E(g, 0, -3, 6, 5.6, '#ff8a9a'); E(g, -2, -5, 2, 1.4, '#ffd0d8'); E(g, 0, -8.5, 1.6, 1.6, '#e8231e'); }, /* ice cream */
    g => { P(g, [0, -10, 7, -2, 0, 6, -7, -2], '#5fe3d6'); P(g, [0, -10, 7, -2, 0, -2], '#3fb8ae'); B(g, 0, 6, 1, 2, '#f2efe6'); B(g, 1, 8, 2, 2, '#ff9a2a'); B(g, -2, 8, 2, 2, '#e8231e'); }, /* kite */
    g => { E(g, 0, 4, 6, 5.8, '#f2f6ff'); E(g, 0, -4, 4.4, 4.2, '#f2f6ff'); B(g, -5, -8, 10, 1, '#1a1222'); B(g, -3, -10, 6, 2, '#1a1222'); B(g, -2, -5, 1, 1, '#1a1222'); B(g, 1, -5, 1, 1, '#1a1222'); P(g, [0, -4, 4, -3, 0, -2], '#ff8a1e'); B(g, 0, 3, 1, 1, '#1a1222'); B(g, 0, 6, 1, 1, '#1a1222'); }, /* snowman */
    g => { B(g, 0, -10, 1, 4, '#7a4a1e'); E(g, 3, -8, 3, 1.5, '#3fd45a'); for (const [x, y] of [[-4, -3], [0, -3], [4, -3], [-2, 1.5], [2, 1.5], [0, 6]]) { E(g, x, y, 3, 3, '#8a4ac8'); B(g, x - 1, y - 2, 1, 1, '#d0a8f0'); } }, /* grapes */
    g => { K.mir(g, [2, -4, 8, -10, 8, -1], '#5c6678'); E(g, 0, 1, 8.4, 7, '#5c6678'); E(g, -3.2, 0, 1.7, 2.1, '#ffd23c'); E(g, 3.2, 0, 1.7, 2.1, '#ffd23c'); B(g, -4, -1, 1, 3, '#1a1222'); B(g, 3, -1, 1, 3, '#1a1222'); P(g, [-1.4, 3, 1.4, 3, 0, 5], '#ff8a9a'); }, /* cat */
    g => { B(g, -8, -3, 16, 12, '#3fd45a'); B(g, -9, -6, 18, 4, '#58e070'); B(g, -2, -6, 3, 15, '#e8231e'); K.mir(g, [0, -6, 5, -10, 6, -6], '#e8231e'); }, /* gift */
    g => { B(g, 0, 0, 1, 8, '#7a4a1e'); B(g, -3, 8, 4, 1, '#7a4a1e'); P(g, [-10, 1, -8, -5, -4, -9, 0, -10, 4, -9, 8, -5, 10, 1], '#e8231e'); P(g, [-3.4, 1, 0, -10, 3.4, 1], '#ffd23c'); }, /* umbrella */
    g => { B(g, 0, -10, 1, 4, '#8fa0b8'); E(g, .5, -9, 1.5, 1.5, '#e8231e'); B(g, -9, -1, 2, 4, '#5c6678'); B(g, 7, -1, 2, 4, '#5c6678'); B(g, -7, -6, 14, 13, '#8fa0b8'); B(g, -5, -3, 3, 3, '#5fe3d6'); B(g, 2, -3, 3, 3, '#5fe3d6'); B(g, -3, 3, 6, 1, '#1a1222'); }, /* robot */
    g => { P(g, [-10, 0, -5, -6, 0, -7.5, 5, -6, 10, 0, 5, 6, 0, 7.5, -5, 6], '#ffffff'); E(g, 0, 0, 4.6, 4.6, '#3fa8e0'); E(g, 0, 0, 2.2, 2.2, '#1a1222'); B(g, -2, -2, 1, 1, '#ffffff'); }, /* eye (special) */
    g => { E(g, -4.2, -2.5, 5, 5, '#e8231e'); E(g, 4.2, -2.5, 5, 5, '#e8231e'); P(g, [-8.6, 0, 8.6, 0, 0, 9], '#e8231e'); E(g, -4.5, -4.5, 1.6, 1.6, '#ffb0a0'); } /* heart (special) */
  ];
  const icon = (i, n) => K.spr(ID + i + '_' + n, n, n, g => { g.scale(n / 20, n / 20); ICON[i](g); });

  let level = 0, cards = [], cols = 4, rows = 3, s = 44, cs = 40, ox = 2, oy = 22, need = 6, pairs = 0, turns = 0, hearts = 5, lost = 0, streak = 0, open = [],
    mode = 'intro', mt = 0, cur = 0, kb = false, shake = 0, hurt = 0, gain = 0, floats = [], notes = [], time = 0, bonus = 0;
  const sx = i => ox + (i % cols) * s + (s >> 1), sy = i => oy + Math.floor(i / cols) * s + (s >> 1);
  const mix = a => { for (let i = a.length - 1; i > 0; i--) { const j = A.ri(0, i), q = a[i]; a[i] = a[j]; a[j] = q; } return a; };
  const say = (c, str, col) => floats.push({ x: Math.max(30, Math.min(150, c.x)), y: c.y - cs / 2, s: str, c: col, t: 1 });
  const tune = (...f) => f.forEach((v, i) => notes.push({ t: i * .1, f: v }));
  const info = () => A.info('LV ' + (level + 1) + ' · ' + pairs + '/' + need);

  function setup() { [cols, rows] = LV[level]; need = cols * rows / 2; pairs = turns = lost = streak = 0; open = []; cur = 0;
    s = Math.min(Math.floor(176 / cols), Math.floor(200 / rows)); cs = s - (s > 35 ? 4 : 2); ox = Math.round((180 - cols * s) / 2); oy = 22 + Math.round((200 - rows * s) / 2);
    const pool = mix(Array.from({ length: 20 }, (_, i) => i)), f = []; if (level > 1) f.push(EYE); if (level > 2) f.push(HEART); while (f.length < need) f.push(pool.pop());
    /* level 1 is laid out at once (it is also the picture behind the START panel); later boards are dealt in from below */
    cards = mix(f.concat(f)).map((v, i) => ({ f: v, x: level ? 90 : sx(i), y: level ? 250 : sy(i), fl: 0, up: false, found: false, seen: false, sh: 0, pop: 0, lift: 0, d: .3 + i * .03 }));
    mode = 'intro'; mt = level ? 3 : 2.2; time = 0; info(); }

  function closeMiss() { for (const c of open) c.up = false; open = []; mode = 'play'; maybeSwap(); }
  /* two face-down cards trade places, slowly and lit up so they can be followed */
  function maybeSwap() { const n = SWAP[level]; if (!n || turns % n) return; const pick = []; cards.forEach((c, i) => { if (!c.found && !c.up) pick.push(i); }); if (pick.length < 4) return;
    mix(pick); const a = pick[0], b = pick[1], q = cards[a]; cards[a] = cards[b]; cards[b] = q; cards[a].lift = cards[b].lift = mt = 1; mode = 'swap'; A.beep(420, .12, 'sine', .05); notes.push({ t: .15, f: 560 }); }

  function resolve() { const [a, b] = open; turns++;
    if (a.f === b.f) { a.found = b.found = true; open = []; pairs++; streak++; const pts = 100 * Math.min(streak, 5); A.add(pts); a.pop = b.pop = .5; a.seen = b.seen = true; info();
      for (const c of [a, b]) F.spark(c.x, c.y, ['#ffd23c', '#fff6c8', '#3fd45a'], 10, 70); say(b, '+' + pts, '#ffd23c'); A.beep(620 + 90 * Math.min(streak, 5), .1, 'triangle', .05); notes.push({ t: .09, f: 820 + 110 * Math.min(streak, 5) });
      if (a.f === HEART && hearts < MAXH) { hearts++; gain = .8; say(a, '+1 HEART', '#ff8a9a'); }
      if (pairs === need) { bonus = 150 * (level + 1) + 50 * hearts + (lost ? 0 : 300); A.add(bonus); mode = 'clear'; mt = level === 6 ? 3.6 : 2.8; tune(660, 880, 990, 1320); if (level === 6) A.add(1000); else if (hearts < MAXH) { hearts++; gain = .8; } }
      else if (a.f === EYE) { mode = 'peek'; mt = 2; for (const c of cards) if (!c.found) c.up = true; tune(700, 900); }
      else maybeSwap(); }
    else { const cost = a.seen || b.seen; streak = 0; a.seen = b.seen = true; a.sh = b.sh = .55; mode = 'wait'; mt = 1;
      if (cost) { hearts--; lost++; hurt = .6; shake = .3; say(b, 'SEEN BEFORE! -1', '#ff8a9a'); A.beep(170, .25, 'sawtooth', .05); if (hearts <= 0) { mode = 'dead'; mt = 2.4; for (const c of cards) c.up = true; open = []; } }
      else { say(b, 'FREE PEEK', '#bfe6ff'); A.beep(300, .09, 'sine', .05); } } }

  function pick(i) { if (mode === 'intro') { if (time > .5) { mode = 'play'; mt = 0; } return; }
    if (mode === 'wait' && mt < .65) closeMiss(); if (mode !== 'play') return;
    const c = cards[i]; if (!c || c.found || c.up) return; c.up = true; open.push(c); A.beep(520 + open.length * 90, .04); if (open.length === 2) resolve(); }

  setup();
  return {
    tap(x, y) { kb = false; const c = Math.floor((x - ox) / s), r = Math.floor((y - oy) / s); if (mode === 'intro') return pick(-1); if (c < 0 || r < 0 || c >= cols || r >= rows) return; cur = r * cols + c; pick(cur); },
    key(k) { kb = true; const c = cur % cols, r = Math.floor(cur / cols);
      if (k === 'left' && c > 0) cur--; else if (k === 'right' && c < cols - 1) cur++; else if (k === 'up' && r > 0) cur -= cols; else if (k === 'down' && r < rows - 1) cur += cols; else if (k === 'a') pick(cur); },
    update(dt) { time += dt; shake = Math.max(0, shake - dt); hurt = Math.max(0, hurt - dt); gain = Math.max(0, gain - dt);
      for (const o of notes) { o.t -= dt; if (o.t <= 0) A.beep(o.f, .1, 'triangle', .05); } notes = notes.filter(o => o.t > 0);
      for (const o of floats) { o.t -= dt; o.y -= dt * 14; } floats = floats.filter(o => o.t > 0);
      cards.forEach((c, i) => { const k = Math.min(1, dt * (c.lift > 0 ? 4.5 : 12)); if (time > c.d || !level) { c.x += (sx(i) - c.x) * k; c.y += (sy(i) - c.y) * k; }
        c.fl = Math.max(0, Math.min(1, c.fl + (c.up || c.found ? dt : -dt) * 5.5)); if (c.fl > .9) c.sh = Math.max(0, c.sh - dt); c.pop = Math.max(0, c.pop - dt); c.lift = Math.max(0, c.lift - dt); });
      if (mode !== 'play' && (mt -= dt) <= 0) {
        if (mode === 'wait') closeMiss();
        else if (mode === 'peek') { for (const c of cards) c.up = false; mode = 'play'; }
        else if (mode === 'clear') { if (level === 6) return A.over(true); level++; setup(); }
        else if (mode === 'dead') return A.over(false);
        else mode = 'play'; } },
    draw(g) { const T = A.text; K.scroll(g, K.T.stone(64, 64, BG[level]), 0, 0, 180, 224); g.save(); if (shake > 0) g.translate(Math.round(Math.sin(shake * 70) * 2), 0);
      /* cards: the ones that are swapping are drawn last, on top */
      for (let pass = 0; pass < 2; pass++) for (const c of cards) { if ((c.lift > 0) !== !!pass) continue; const face = c.fl > .5, h = cs >> 1, gold = c.f >= EYE, up = c.lift > 0 ? 3 : 0;
        const x = Math.round(c.x + (c.sh > 0 && c.sh < .4 ? Math.sin(c.sh * 50) * 2 : 0)), y = Math.round(c.y) - up, ps = 1 + Math.sin(Math.min(1, c.pop / .3) * Math.PI) * .14;
        B(g, x - h + 2 + up, y - h + 3 + up * 2, cs, cs, 'rgba(0,0,0,.35)'); g.save(); g.translate(x, y); g.scale(Math.max(.07, Math.abs(Math.cos(c.fl * Math.PI))) * ps, ps);
        if (face) { g.drawImage(K.block(cs, cs, gold ? '#ffe08a' : '#f2efe6', 'r'), -h, -h); B(g, 3 - h, 3 - h, cs - 6, cs - 6, gold ? '#f6c85a' : '#e2dccc'); const ic = icon(c.f, cs - 8); g.drawImage(ic, -(ic.width >> 1), -(ic.height >> 1));
          if (c.found) { B(g, 3 - h, h - 6, cs - 6, 3, '#3fd45a'); B(g, 3 - h, h - 6, cs - 6, 1, '#a8f0a0'); } }
        else { g.drawImage(K.block(cs, cs, '#3a44a0', 'r'), -h, -h); B(g, 4 - h, 4 - h, cs - 8, cs - 8, '#2a3488'); const st = K.star2('#7a88e0', cs > 34 ? 18 : 12); g.drawImage(st, -(st.width >> 1), -(st.height >> 1));
          for (const [a, b] of [[5 - h, 5 - h], [5 - h, h - 7], [h - 7, h - 7]]) B(g, a, b, 2, 2, '#7a88e0'); B(g, h - 8, 4 - h, 4, 4, c.seen ? '#ffd23c' : '#2a3488'); if (c.seen) B(g, h - 7, 5 - h, 2, 2, '#fff6c8'); }
        g.restore(); if (c.lift > 0) { g.strokeStyle = '#ffd23c'; g.lineWidth = 1; g.strokeRect(x - h - 1.5, y - h - 1.5, cs + 3, cs + 3); } }
      if (kb && mode !== 'clear' && mode !== 'dead') { const x = sx(cur) - (s >> 1), y = sy(cur) - (s >> 1), col = time * 4 % 2 < 1 ? '#ffd23c' : '#ffffff', n = cs > 34 ? 10 : 7;
        for (const [a, b, w, h] of [[0, 0, n, 2], [0, 0, 2, n], [s - n, 0, n, 2], [s - 2, 0, 2, n], [0, s - 2, n, 2], [0, s - n, 2, n], [s - n, s - 2, n, 2], [s - 2, s - n, 2, n]]) B(g, x + a, y + b, w, h, col); }
      F.draw(g); for (const o of floats) { const w = o.s.length * 4 + 3; B(g, Math.round(o.x - w / 2), Math.round(o.y) - 2, w, 9, '#140e1c'); T(g, o.s, o.x, o.y, o.c, 1, 'center'); }
      g.restore();
      /* top bar: hearts, streak, level */
      B(g, 0, 0, 180, 19, '#140e1c'); B(g, 0, 19, 180, 1, '#4a52a0');
      for (let i = 0; i < MAXH; i++) { const on = i < hearts, fl = (i === hearts && hurt > 0 && hurt * 10 % 2 < 1) || (i === hearts - 1 && gain > 0 && gain * 10 % 2 < 1); if (on || fl) K.put(g, K.heart(), 9 + i * 13, 10 - (fl && on ? 1 : 0)); else B(g, 7 + i * 13, 9, 4, 3, '#3a2a44'); }
      T(g, 'LEVEL ' + (level + 1), 177, 3, '#ffd23c', 1, 'right'); T(g, (need - pairs) + ' TO GO', 177, 11, '#bfe6ff', 1, 'right');
      if (mode === 'peek') T(g, 'LOOK!', 106, 5, time * 6 % 2 < 1 ? '#ffd23c' : '#ffffff', 2, 'center'); else if (streak > 1) T(g, 'X' + Math.min(streak, 5), 106, 5, '#ff9a2a', 2, 'center');
      /* banners */
      const ban = (h, col) => { const y = 112 - (h >> 1); B(g, 0, y, 180, h, '#140e1c'); B(g, 0, y + 1, 180, 1, col); B(g, 0, y + h - 2, 180, 1, col); return y; };
      if (mode === 'intro') { const y = ban(44, '#ffd23c'); T(g, 'LEVEL ' + (level + 1), 90, y + 6, '#ffd23c', 2, 'center'); T(g, TIP[level][0], 90, y + 22, '#ffffff', 1, 'center'); T(g, TIP[level][1], 90, y + 31, '#ffffff', 1, 'center'); }
      else if (mode === 'clear') { const y = ban(52, '#3fd45a'); T(g, level === 6 ? 'ALL PAIRS FOUND!' : 'LEVEL CLEAR!', 90, y + 6, '#3fd45a', 2, 'center'); T(g, 'BONUS +' + bonus, 90, y + 22, '#ffd23c', 1, 'center');
        T(g, lost ? (level === 6 ? 'GREAT MEMORY!' : 'ONE MORE HEART FOR YOU') : 'PERFECT! NO HEARTS LOST: +300', 90, y + 31, '#ffffff', 1, 'center'); if (level === 6) T(g, 'CHAMPION BONUS +1000', 90, y + 40, '#ff9a2a', 1, 'center'); }
      else if (mode === 'dead' && mt < 1.6) { const y = ban(30, '#e8231e'); T(g, 'OUT OF HEARTS', 90, y + 6, '#ff8a9a', 2, 'center'); T(g, 'YOU REACHED LEVEL ' + (level + 1), 90, y + 20, '#ffffff', 1, 'center'); } }
  };
} });
