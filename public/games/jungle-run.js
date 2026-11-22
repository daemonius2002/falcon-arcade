Arcade.game('jungle-run', { w: 160, h: 140, pad: 'lr', a: 'JUMP',
help: 'Run through 6 jungle stages to the flag! Move with left / right, jump with Space, up, JUMP or a tap (hold for a higher jump). Collect fruit and find the gold star hidden in every stage. Jump on snails, bats and frogs to bop them - bop several in one jump for a combo. Thorns always hurt, so jump over them. Stepping logs and drifting logs cross the river, and mushrooms bounce you high. You have 3 hearts: a bump or a splash costs one. A fast run earns a BONUS at the flag.',
init(A) {
  const K = Art, ID = 'jungle-run-', LAST = 6, G0 = 104;
  const HO = { id: 'jr', skin: '#f0b890', shirt: '#3fa8e0', pants: '#5a4a6a', hat: 'cap', hatc: '#e8231e' };
  const SKY = [['#0f3a2a', '#1b6a44', '#5ab86a'], ['#14506a', '#2f9a8a', '#a8e0a0'], ['#2a5a3a', '#6a9a4a', '#e0d078'], ['#4a2a4a', '#b05a4a', '#f0b060'], ['#1a1a4a', '#4a2a6a', '#b0607a'], ['#060a24', '#0f2040', '#1f4a5a']];
  const DIM = [0, 0, 0, .1, .22, .36];
  const HINT = ['JUMP THE GAPS - BOP THE SNAILS', 'BATS! BOP THEM FROM ABOVE', 'THORNS HURT - RIDE THE LOGS', 'MUSHROOMS BOUNCE YOU HIGH', 'SUNSET SPRINT', 'LAST STAGE - REACH THE FLAG!'];
  /* own sprites (cached by K.spr) */
  const thorn = () => K.spr(ID + 'thorn', 12, 12, g => { for (const x of [-4, 4, 0]) K.part(g, [x - 3, 6, x, x ? -3 : -6, x + 3, 6], K.lin(g, 0, -6, 0, 6, '#ffffff', '#ff5a4a', '#8a1438')); K.box(g, -6, 4, 12, 2, '#5a1030'); });
  const shroom = f => K.spr(ID + 'shroom' + f, 16, 12, g => { K.box(g, -2, 0, 4, 6, '#f0e0c0'); K.box(g, 1, 0, 1, 6, '#c0a880'); K.ell(g, 0, f * 2 - 1, 7.4, 4.6 - f * 1.4, K.lin(g, 0, -6, 0, 3, '#ff8a7a', '#e8231e', '#8a1410')); K.box(g, -4, f * 2 - 3, 2, 2, '#ffffff'); K.box(g, 2, f * 2 - 2, 2, 1, '#ffffff'); });
  const frog = f => K.spr(ID + 'frog' + f, 14, 11, g => { K.box(g, f ? -7 : -5, f ? 2 : 3, 4, 2, '#1f7a2a'); K.box(g, 2, f ? 2 : 3, 3, 2, '#1f7a2a'); K.ell(g, 0, f ? 0 : 1, 6, 4, K.lin(g, 0, -4, 0, 5, '#b8f08a', '#5fd04a', '#1f7a2a')); K.ell(g, 3, f ? -3 : -2, 2.4, 2.4, '#5fd04a'); K.box(g, 3, f ? -4 : -3, 2, 2, '#ffffff'); K.box(g, 4, f ? -4 : -3, 1, 1, '#1a1222'); });
  const flag = f => K.spr(ID + 'flag' + f, 22, 44, g => { K.box(g, -8, -20, 2, 42, '#c08a4a'); K.box(g, -7, -20, 1, 42, '#6a4420'); K.ell(g, -7, -20, 2, 2, '#ffd23c'); K.part(g, [-6, -18, 9, f ? -14 : -12, -6, f ? -7 : -8], K.lin(g, -6, 0, 9, 0, '#ffd23c', '#ff8a1e')); K.box(g, -11, 19, 8, 3, '#6a4420'); });
  const HEART = A.spr(['.rr.rr.', 'rwrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], { r: '#ff4060', w: '#ffc0c8' }), NOHEART = A.spr(['.rr.rr.', 'r..r..r', 'r.....r', '.r...r.', '..r.r..', '...r...'], { r: '#5a3a4a' });
  const S = K.fx();
  let st = 1, lives = 3, stars = 0, plats, items, foes, haz, shr, pops, goal, len, cam, far, tm, clr = 0, cb = 0, intro, sh = 0, inv = 0, coy = 0, buf = 0, combo = 0, kb = 0, wasDown = false, safe, pl, shown = '';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pop = (s, x, y, c) => pops.push({ s, x, y, l: .8, c: c || '#ffd23c' });
  const tune = n => n.forEach((f, i) => setTimeout(() => A.beep(f, .12, 'triangle'), i * 90));
  const bonus = () => Math.max(0, 250 + st * 50 - Math.floor(tm) * 5);
  const hud = () => { const s = 'STAGE ' + st + '/' + LAST; if (s !== shown) A.info(shown = s); };

  /* ---- stage builder: ground pieces with one or two features each, joined by gaps, stepping logs or drifting logs ---- */
  function feat(t, x0, x1, y, extra) { const m = (x0 + x1) / 2, sp = 16 + st * 3;
    if (t === 'fruit') for (let x = x0 + 4; x < x1; x += 16) items.push({ x, y: y - 9, k: A.ri(0, 3) });
    else if (t === 'snail') { foes.push({ t: 0, x: m, y, l: x0, r: x1, d: -1, sp }); for (let i = -1; i < 2; i++) items.push({ x: m + i * 14, y: y - (i ? 26 : 32), k: 0 }); }
    else if (t === 'bat') { foes.push({ t: 1, x: m, y: y - 37, l: x0, r: x1, d: -1, sp: sp + 12, ph: A.rnd(0, 6) }); for (let x = m - 16; x <= m + 16; x += 16) items.push({ x, y: y - 9, k: 2 }); }
    else if (t === 'log') { plats.push({ x: m - 34, y: y - 32, w: 48 }); for (let i = -1; i < 2; i++) items.push({ x: m - 10 + i * 16, y: y - 41, k: !i && extra ? extra : 1 }); if (st > 1 && x1 - x0 > 60 && Math.random() < .5) foes.push({ t: 0, x: m, y, l: x0, r: x1, d: 1, sp }); }
    else if (t === 'thorn') { const n = st > 4 ? A.ri(1, 2) : 1; haz.push({ x: m, y, hw: n * 5 }); for (let i = -1; i < 2; i++) items.push({ x: m + i * 14, y: y - (i ? 28 : 36), k: 3 }); }
    else if (t === 'frog') { foes.push({ t: 2, x: m, y, l: x0, r: x1, d: -1, h: 0, vy: 0, air: 0, w: A.rnd(.2, .9) }); items.push({ x: m, y: y - 40, k: 1 }); }
    else { shr.push({ x: x0 + 10, y, t: 0 }); plats.push({ x: x0 + 46, y: y - 58, w: 40 }); if (extra) items.push({ x: x0 + 66, y: y - 68, k: extra }); else for (let i = 0; i < 3; i++) items.push({ x: x0 + 54 + i * 12, y: y - 67, k: i }); } }
  function build() { plats = [{ x: 0, y: G0, w: 176, g: 1 }]; items = []; foes = []; haz = []; shr = []; pops = [];
    const n = 8 + st * 2, starAt = A.ri(3, n - 2), heartAt = lives < 3 ? A.ri(2, n - 1) : -1;
    const pool = ['snail', 'log'].concat(st < 5 ? ['fruit'] : [], st > 1 ? ['bat', 'bat', 'log'] : [], st > 2 ? ['thorn', 'thorn'] : [], st > 3 ? ['frog', 'frog', 'shroom'] : []);
    const pick = () => pool[A.ri(0, pool.length - 1)];
    let x = 176, y = G0; feat('fruit', 70, 150, G0);
    for (let i = 1; i <= n; i++) { const ny = clamp(y + A.ri(-1, 1) * 8, 96, 112), low = Math.max(y, ny), r = Math.random(), star = i === starAt; let gap = A.ri(20, Math.min(48, 24 + st * 4));
      if (star && st < 4) { gap = 44; items.push({ x: x + 22, y: Math.min(y, ny) - 32, k: 4 }); } /* early stages: the star floats over a gap */
      else if (st > 2 && r < .24) { gap = A.ri(88, 108); plats.push({ x: x + 8, y: low, w: 36, mv: 1, l: x + 6, r: x + gap - 42, d: 1, sp: 24 + st * 3 }); items.push({ x: x + gap / 2 - 10, y: low - 26, k: 3 }, { x: x + gap / 2 + 10, y: low - 26, k: 3 }); }
      else if (st > 1 && r < .5) { const k = A.ri(1, 2), q = A.ri(22, 28); gap = (k + 1) * q + k * 28; for (let j = 0; j < k; j++) { const sx = x + q + j * (q + 28), sy = low - A.ri(0, 1) * 6; plats.push({ x: sx, y: sy, w: 28 }); items.push({ x: sx + 14, y: sy - 9, k: 0 }); } }
      x += gap; y = ny; const big = star && st > 3, w = big ? 144 : A.ri(5, 9) * 16; plats.push({ x, y, w, g: 1 });
      const hx = i === heartAt ? 5 : 0;
      if (big) feat('shroom', x + 28, x + w - 20, y, 4);
      else if (hx) feat('log', x + 28, x + w - 20, y, 5);
      else if (st > 4 && w >= 112) { for (let h = 0; h < 2; h++) { let t = pick(); if (t === 'shroom' || (h && t === 'log')) t = 'frog'; feat(t, x + (h ? w / 2 + 6 : 28), x + (h ? w - 20 : w / 2 - 6), y); } }
      else { let t = i === 1 && st === 1 ? 'snail' : pick(); if (t === 'shroom' && w < 144) t = 'frog'; if (t === 'log' && w < 96) t = 'snail'; feat(t, x + 28, x + w - 20, y); }
      x += w; }
    x += 24; plats.push({ x, y: G0, w: 240, g: 1 }); feat('fruit', x + 30, x + 120, G0); goal = x + 150; len = x + 240;
    pl = { x: 30, y: G0, vx: 0, vy: 0, on: plats[0], f: 1, boost: 0 }; safe = plats[0]; cam = 0; far = 1; tm = 0; intro = 2.4; combo = 0; inv = 0; kb = 0; hud(); }
  function lose() { lives--; sh = .3; A.beep(150, .3, 'sawtooth'); if (lives <= 0) A.over(); }
  function hurt(dx) { if (inv > 0) return; lose(); inv = 1.6; kb = .25; pl.vy = -150; pl.vx = dx * 70; pl.on = null; pl.boost = 0; S.spark(pl.x, pl.y - 10, ['#ffffff', '#ff4060'], 10, 70); }
  build();
  return {
    key(k) { if (k === 'a' || k === 'up') buf = .13; },
    update(dt) {
      if (clr > 0) { clr -= dt; if (Math.random() < .3) S.spark(goal + A.rnd(-20, 24), A.rnd(40, 90), ['#ffd23c', '#ff8a9a', '#5fe3d6'], 4, 50);
        if (clr <= 0) { if (st >= LAST) { A.add(lives * 100); A.over(true); } else { st++; build(); } } return; }
      tm += dt; intro -= dt; sh = Math.max(0, sh - dt); inv = Math.max(0, inv - dt); hud();
      for (const p of plats) if (p.mv) { const ox = p.x; p.x += p.d * p.sp * dt; if (p.x < p.l) { p.x = p.l; p.d = 1; } else if (p.x > p.r) { p.x = p.r; p.d = -1; } if (pl.on === p) pl.x += p.x - ox; }
      /* run */
      const held = A.keys.a || A.keys.up || A.ptr.down, dir = (A.keys.right ? 1 : 0) - (A.keys.left ? 1 : 0); if (A.ptr.down && !wasDown) buf = .13; wasDown = A.ptr.down;
      if (kb > 0) kb -= dt; else { pl.vx += (dir * 84 - pl.vx) * Math.min(1, dt * (pl.on ? 16 : 9)); if (dir) pl.f = dir; }
      pl.x = clamp(pl.x + pl.vx * dt, 4, len - 4);
      for (const p of plats) if (p.g && pl.y > p.y + 3 && pl.x + 4 > p.x && pl.x - 4 < p.x + p.w) { pl.x = pl.x < p.x + p.w / 2 ? p.x - 4 : p.x + p.w + 4; pl.vx = 0; } /* earth walls */
      /* jump: short buffer + a moment of grace after leaving an edge */
      coy = pl.on ? .1 : coy - dt; buf -= dt;
      if (buf > 0 && coy > 0) { pl.vy = -225; coy = buf = 0; pl.boost = 0; pl.on = null; A.beep(520, .06); S.puff(pl.x - 3, pl.y - 1, '#d8c8a0', -8); S.puff(pl.x + 3, pl.y - 1, '#d8c8a0', -8); }
      pl.vy = Math.min(340, pl.vy + (pl.vy < 0 && !held && !pl.boost ? 1100 : 560) * dt);
      const pf = pl.y, was = pl.on; pl.y += pl.vy * dt; pl.on = null;
      for (const s of shr) { s.t -= dt; if (pl.vy > 0 && Math.abs(pl.x - s.x) < 9 && pl.y >= s.y - 8 && pf <= s.y - 3) { pl.y = s.y - 8; pl.vy = -292; pl.boost = 1; s.t = .2; A.beep(300, .07); setTimeout(() => A.beep(620, .12, 'triangle'), 60); S.spark(s.x, s.y - 8, ['#ffffff', '#ff8a7a'], 6, 50); } }
      if (pl.vy >= 0) for (const p of plats) if (pl.x + 3 > p.x && pl.x - 3 < p.x + p.w && pf <= p.y + 3 && pl.y >= p.y) { pl.y = p.y; pl.vy = 0; pl.on = p; }
      if (pl.on) { pl.boost = 0; combo = 0; if (pl.on.g) safe = pl.on; if (!was) { S.puff(pl.x - 3, pl.y - 1, '#d8c8a0', -6); S.puff(pl.x + 3, pl.y - 1, '#d8c8a0', -6); } }
      cam += (clamp(pl.x - 60, 0, len - 160) - cam) * Math.min(1, dt * 10);
      /* fruit, stars, hearts */
      for (const it of items) if (!it.got && Math.abs(it.x - pl.x) < 9 && it.y > pl.y - 27 && it.y < pl.y + 4) { it.got = 1;
        if (it.k === 4) { stars++; A.add(200); pop('STAR +200', it.x, it.y - 8); tune([880, 1100, 1320, 1760]); S.spark(it.x, it.y, ['#ffd23c', '#ffffff'], 14, 90); }
        else if (it.k === 5) { if (lives < 3) lives++; else A.add(100); pop('HEART', it.x, it.y - 8, '#ff8a9a'); tune([660, 990]); }
        else { A.add(10); A.beep(1000, .05, 'triangle'); S.spark(it.x, it.y, ['#ffffff', '#ffd23c'], 3, 40); } }
      /* animals: bop from above, otherwise they bump you */
      for (const f of foes) { if (f.dead) continue;
        if (f.t === 2) { if (f.air) { f.x += f.d * 42 * dt; f.vy += 520 * dt; f.h += f.vy * dt; if (f.h >= 0) { f.h = 0; f.air = 0; f.w = .85 - st * .05; } } else if ((f.w -= dt) <= 0) { if (f.x + f.d * 26 < f.l || f.x + f.d * 26 > f.r) f.d *= -1; f.air = 1; f.vy = -150; } f.cy = f.y + f.h - 5; }
        else { f.x += f.d * f.sp * dt; if (f.x < f.l) f.d = 1; else if (f.x > f.r) f.d = -1; if (f.t) { f.ph += dt * 3; f.cy = f.y + Math.sin(f.ph) * 8; } else f.cy = f.y - 5; }
        if (Math.abs(f.x - pl.x) < 10 && pl.y > f.cy - 5 && pl.y - 20 < f.cy + 4) {
          if (pl.vy > 0 && pl.y < f.cy + 3) { f.dead = 1; combo++; const pts = 50 * Math.min(combo, 5); A.add(pts); pop((combo > 1 ? 'COMBO ' : '') + '+' + pts, f.x, f.cy - 8, combo > 1 ? '#5fe3d6' : '#ffd23c'); pl.vy = held ? -215 : -165; pl.boost = 0; sh = .08; A.beep(280 + combo * 80, .09); S.spark(f.x, f.cy, ['#ffffff', '#e0b0ff', '#5fd04a'], 10, 70); }
          else { hurt(pl.x < f.x ? -1 : 1); if (lives <= 0) return; } } }
      for (const h of haz) if (Math.abs(h.x - pl.x) < h.hw + 2 && pl.y > h.y - 9 && pl.y - 20 < h.y) { hurt(pl.x < h.x ? -1 : 1); if (lives <= 0) return; }
      const d = Math.floor(pl.x / 16); if (d > far) { A.add(d - far); far = d; }
      /* splash! back to the last solid ground */
      if (pl.y > 138) { S.spark(pl.x, 130, ['#ffffff', '#7fc0f0', '#3f8ad0'], 16, 90); lose(); if (lives <= 0) return; pl.x = safe.x + 14; pl.y = safe.y; pl.vx = pl.vy = 0; pl.on = safe; inv = 2; kb = 0; cam = clamp(pl.x - 60, 0, len - 160); }
      /* the flag */
      if (pl.x > goal - 6 && pl.on) { cb = 100 + bonus(); A.add(cb); clr = 2.4; tune([660, 880, 990, 1320]); }
    },
    draw(g) { const t = performance.now() / 1000, c = Math.round(cam), ci = st - 1;
      g.drawImage(K.T.sky(160, 140, SKY[ci]), 0, 0);
      for (let i = -1; i < 6; i++) { const x = i * 40 - Math.floor(cam * .25) % 40; K.box(g, x + 17, 30, 6, 110, '#0c2a1e'); K.put(g, K.tree(16, (i + Math.floor(cam * .25 / 40)) & 3), x + 20, 22, { a: .55 }); }
      for (let i = -1; i < 5; i++) { const x = i * 58 - Math.floor(cam * .5) % 58, v = (i + Math.floor(cam * .5 / 58)) & 3; K.box(g, x + 25, 44, 8, 100, '#3a2412'); K.box(g, x + 25, 44, 2, 100, '#5a3a20'); K.put(g, K.tree(18, v), x + 29, 34); }
      if (DIM[ci]) K.box(g, 0, 0, 160, 140, 'rgba(8,6,40,' + DIM[ci] + ')');
      if (ci > 3) for (let i = 0; i < 9; i++) if (Math.sin(t * 2 + i * 1.7) > -.2) K.box(g, Math.round((i * 53 + t * (4 + i % 3 * 3) - cam * .7) % 160 + 160) % 160, 34 + i * 37 % 56 + Math.round(Math.sin(t + i) * 3), 1, 1, '#e8ff7a');
      /* river in the gaps */
      K.box(g, 0, 128, 160, 12, '#1b5fa8'); K.box(g, 0, 128, 160, 1, '#7fc0f0'); for (let i = 0; i < 6; i++) K.box(g, ((i * 31 - c + Math.round(t * 8)) % 170 + 170) % 170 - 8, 131 + i % 3 * 3, 7, 1, '#3f8ad0');
      g.save(); g.translate(-c + (sh > 0 ? A.ri(-1, 1) : 0), sh > 0 ? A.ri(-1, 1) : 0);
      const dt = K.T.dirt(64, 64);
      for (const p of plats) { const x = Math.round(p.x); if (x - c > 170 || x + p.w - c < -10) continue;
        if (p.g) { const hh = 140 - p.y; for (let xx = 0; xx < p.w; xx += 64) g.drawImage(dt, 0, 0, Math.min(64, p.w - xx), hh, x + xx, p.y, Math.min(64, p.w - xx), hh); K.box(g, x, p.y, 1, hh, '#2a180a'); K.box(g, x + p.w - 1, p.y, 1, hh, '#2a180a'); K.box(g, x, p.y, p.w, 5, '#3fb45a'); K.box(g, x, p.y, p.w, 1, '#a8f0a0'); K.box(g, x, p.y + 5, p.w, 1, '#1f6a2a'); for (let k = 2; k < p.w - 2; k += 7) K.box(g, x + k, p.y + 5, 3, 2 + (k % 3), '#2f8a3a'); for (let k = 5; k < p.w - 4; k += 13) K.box(g, x + k, p.y - 2, 1, 2, '#58b96a'); }
        else { if (p.mv) { K.box(g, x + 2, 127, p.w - 4, 1, '#7fc0f0'); } K.put(g, K.log(p.w), x + p.w / 2, p.y + 5); } }
      for (const h of haz) for (let x = h.x - h.hw + 5; x < h.x + h.hw; x += 10) K.put(g, thorn(), x, h.y - 6);
      for (const s of shr) K.put(g, shroom(s.t > 0 ? 1 : 0), s.x, s.y - 6);
      K.put(g, flag(Math.floor(t * 4) & 1), goal + 8, G0 - 22);
      items.forEach((it, i) => { if (it.got || it.x - c < -10 || it.x - c > 170) return; const y = it.y + Math.round(Math.sin(t * 4 + i) * 1.5); K.put(g, it.k === 4 ? K.star2('#ffd23c', 13) : it.k === 5 ? K.heart() : K.fruit(it.k), it.x, y); if (it.k === 4 && Math.sin(t * 6) > 0) K.box(g, it.x + 5, y - 6, 1, 1, '#ffffff'); });
      for (const f of foes) { if (f.dead || f.x - c < -12 || f.x - c > 172) continue; const o = f.d < 0 ? { flip: 1 } : null;
        if (f.t === 1) K.put(g, K.bat(Math.floor(t * 8) & 1), f.x, f.cy == null ? f.y : f.cy); else if (f.t === 2) K.put(g, frog(f.air ? 1 : 0), f.x, f.y + f.h - 5, o); else K.put(g, K.snail(), f.x, f.y - 5, o); }
      if (inv <= 0 || Math.floor(t * 12) & 1) { const mv = Math.abs(pl.vx) > 12; K.put(g, K.guy(HO, !pl.on ? 3 : mv ? 1 + (Math.floor(pl.x / 7) & 1) : 0), pl.x, pl.y - 14, pl.f < 0 ? { flip: 1 } : null); }
      S.draw(g);
      for (const p of pops) { p.l -= 1 / 60; p.y -= .35; if (p.l > 0) { A.text(g, p.s, p.x + 1, p.y + 1, '#12101c', 1, 'center'); A.text(g, p.s, p.x, p.y, p.c, 1, 'center'); } } if (pops.length > 12) pops.splice(0, 6);
      g.restore();
      /* HUD: hearts, progress to the flag */
      for (let i = 0; i < 3; i++) g.drawImage(i < lives ? HEART : NOHEART, 3 + i * 9, 3); for (let i = 0; i < stars; i++) K.put(g, K.star2('#ffd23c', 7), 6 + i * 8, 15);
      A.text(g, 'BONUS ' + (clr > 0 ? cb - 100 : bonus()), 65, 4, '#12101c', 1, 'center'); A.text(g, 'BONUS ' + (clr > 0 ? cb - 100 : bonus()), 64, 3, '#ffd23c', 1, 'center'); K.box(g, 99, 4, 58, 4, '#12101c'); K.box(g, 100, 5, 56, 2, '#2a4a3a'); K.box(g, 100, 5, Math.round(clamp(pl.x / goal, 0, 1) * 56), 2, '#5fe3d6'); K.box(g, 155, 2, 1, 6, '#ffd23c'); K.box(g, 156, 2, 3, 3, '#ff8a1e');
      const ban = (a, b, col) => { K.box(g, 0, 40, 160, 26, 'rgba(8,4,16,.6)'); A.text(g, a, 80, 44, col, 2, 'center'); A.text(g, b, 80, 58, '#ffffff', 1, 'center'); };
      if (clr > 0) ban(st >= LAST ? 'JUNGLE CLEAR!' : 'STAGE CLEAR!', 'BONUS +' + cb, '#ffd23c'); else if (intro > 0) ban('STAGE ' + st, HINT[ci], '#5fe3d6');
    }
  };
} });
