Arcade.game('asteroid-storm', { w: 240, h: 320, pad: 'dpad', a: 'FIRE',
help: 'Left and right turn the ship, up fires the engine, Space or FIRE shoots. Big rocks split into smaller ones. The screen wraps around: fly out on one side, come back on the other.',
init(A) {
  const W = 240, H = 320, TAU = Math.PI * 2, wrap = o => { o.x = (o.x + W) % W; o.y = (o.y + H) % H; };
  let s, rocks = [], shots = [], parts = [], lives = 3, lvl = 0, cd = 0, inv = 2;
  const stars = []; for (let i = 0; i < 50; i++) stars.push([A.ri(0, W), A.ri(0, H), A.ri(0, 2)]);
  const info = () => A.info('LIVES ' + lives + '  WAVE ' + lvl), reset = () => { s = { x: 120, y: 160, vx: 0, vy: 0, a: -Math.PI / 2 }; inv = 2; };
  function mkRock(x, y, sz) { const p = []; for (let i = 0; i < 9; i++) p.push(A.rnd(.7, 1.1)); const a = A.rnd(0, TAU), v = A.rnd(18, 40) + (3 - sz) * 14 + lvl * 3; rocks.push({ x, y, sz, r: [0, 6, 11, 18][sz], vx: Math.cos(a) * v, vy: Math.sin(a) * v, p, rot: A.rnd(0, TAU), vr: A.rnd(-1, 1) }); }
  function wave() { lvl++; for (let i = 0; i < 2 + lvl; i++) { let x, y; do { x = A.rnd(0, W); y = A.rnd(0, H); } while (Math.hypot(x - s.x, y - s.y) < 80); mkRock(x, y, 3); } info(); }
  const boom = (x, y, n, c) => { for (let i = 0; i < n; i++) { const a = A.rnd(0, TAU), v = A.rnd(20, 90); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: A.rnd(.2, .6), c }); } };
  function fire() { if (cd > 0) return; cd = .22; shots.push({ x: s.x + Math.cos(s.a) * 8, y: s.y + Math.sin(s.a) * 8, vx: Math.cos(s.a) * 190 + s.vx, vy: Math.sin(s.a) * 190 + s.vy, l: 1 }); A.beep(900, .04); }
  reset(); wave();
  return {
    key(k) { if (k === 'a') fire(); },
    update(dt) { cd -= dt; inv -= dt; if (A.keys.left) s.a -= 3.6 * dt; if (A.keys.right) s.a += 3.6 * dt; if (A.keys.a) fire();
      if (A.keys.up) { s.vx += Math.cos(s.a) * 130 * dt; s.vy += Math.sin(s.a) * 130 * dt; if (Math.random() < .5) parts.push({ x: s.x - Math.cos(s.a) * 7, y: s.y - Math.sin(s.a) * 7, vx: -Math.cos(s.a) * 40, vy: -Math.sin(s.a) * 40, l: .2, c: '#ff8a1e' }); }
      s.vx *= 1 - .4 * dt; s.vy *= 1 - .4 * dt; s.x += s.vx * dt; s.y += s.vy * dt; wrap(s);
      for (const b of shots) { b.x += b.vx * dt; b.y += b.vy * dt; b.l -= dt; wrap(b); }
      for (const r of rocks.slice()) { r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.vr * dt; wrap(r);
        for (const b of shots) if (b.l > 0 && (b.x - r.x) ** 2 + (b.y - r.y) ** 2 < r.r * r.r) { b.l = 0; r.dead = 1; A.add([0, 50, 20, 10][r.sz]); A.beep(200, .08, 'sawtooth'); boom(r.x, r.y, 8, '#c4b4a0'); if (r.sz > 1) { mkRock(r.x, r.y, r.sz - 1); mkRock(r.x, r.y, r.sz - 1); } break; }
        if (!r.dead && inv <= 0 && (s.x - r.x) ** 2 + (s.y - r.y) ** 2 < (r.r + 5) ** 2) { lives--; boom(s.x, s.y, 24, '#ffd23c'); A.beep(120, .4, 'sawtooth'); info(); if (lives <= 0) { A.over(); return; } reset(); } }
      rocks = rocks.filter(r => !r.dead); shots = shots.filter(b => b.l > 0); for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; } parts = parts.filter(p => p.l > 0);
      if (!rocks.length) { A.add(100); wave(); } },
    draw(g) { g.fillStyle = '#070a1c'; g.fillRect(0, 0, W, H); for (const t of stars) { g.fillStyle = ['#56658f', '#9fb4e6', '#ffffff'][t[2]]; g.fillRect(t[0], t[1], 1, 1); }
      for (const r of rocks) { g.beginPath(); r.p.forEach((q, i) => { const a = r.rot + i / r.p.length * TAU; g.lineTo(r.x + Math.cos(a) * r.r * q, r.y + Math.sin(a) * r.r * q); }); g.closePath(); g.fillStyle = '#6a5c50'; g.fill(); g.strokeStyle = '#c4b4a0'; g.lineWidth = 1; g.stroke(); }
      g.fillStyle = '#ffd23c'; for (const b of shots) g.fillRect(b.x - 1, b.y - 1, 3, 3); for (const p of parts) { g.fillStyle = p.c; g.fillRect(p.x, p.y, 2, 2); }
      if (inv <= 0 || Math.floor(inv * 10) % 2) { g.save(); g.translate(s.x, s.y); g.rotate(s.a); g.beginPath(); g.moveTo(9, 0); g.lineTo(-6, -6); g.lineTo(-3, 0); g.lineTo(-6, 6); g.closePath(); g.fillStyle = '#f2f5f8'; g.fill(); g.strokeStyle = '#ff8a2a'; g.lineWidth = 1; g.stroke(); g.fillStyle = '#5fe3d6'; g.fillRect(-1, -1, 3, 3); g.restore(); } }
  };
} });
