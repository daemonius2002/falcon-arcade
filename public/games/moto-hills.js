Arcade.game('moto-hills', { w: 240, h: 160, pad: 'lr', a: 'GAS',
help: 'Hold Space, up, GAS or just touch the screen to give gas. In the air, lean with left / right so you land on your wheels — landing upside down ends the ride. Pick up the red cans before the fuel runs out.',
init(A) {
  const h = x => 112 + Math.sin(x * .018) * 15 + Math.sin(x * .047 + 1) * 8 + Math.sin(x * .0071) * 14, sl = x => Math.atan2(h(x + 2) - h(x - 2), 4);
  const nd = a => Math.atan2(Math.sin(a), Math.cos(a));
  let x = 30, y = h(30), vx = 40, vy = 0, ang = 0, air = 0, fuel = 100, cans = [], nextC = 420, far = 0, still = 0, spin = 0;
  return {
    update(dt) { const gas = (A.keys.a || A.keys.up || A.ptr.down) && fuel > 0; if (gas) fuel = Math.max(0, fuel - 5.5 * dt);
      vy += 300 * dt; x += vx * dt; y += vy * dt; const gy = h(x), sa = sl(x);
      if (y >= gy - .5) { if (air > .25 && Math.abs(nd(ang - sa)) > 1.15) { A.beep(130, .4, 'sawtooth'); A.over(); return; } if (air > .25) { A.beep(260, .05); if (Math.abs(spin) > 5.5) { A.add(200); A.beep(900, .2, 'triangle'); } }
        air = 0; spin = 0; y = gy; let v = vx * Math.cos(sa) + vy * Math.sin(sa); v += ((gas ? 150 : 0) - v * .45) * dt; v = Math.max(-40, Math.min(215, v)); vx = v * Math.cos(sa); vy = v * Math.sin(sa); ang += nd(sa - ang) * Math.min(1, dt * 14); }
      else { air += dt; const r = ((A.keys.right ? 1 : 0) - (A.keys.left ? 1 : 0)) * 4.2 * dt; ang += r; spin += r; }
      while (nextC < x + 300) { cans.push({ x: nextC, got: 0 }); nextC += A.rnd(380, 560); }
      for (const c of cans) if (!c.got && Math.abs(c.x - x) < 10 && Math.abs(h(c.x) - 8 - y) < 18) { c.got = 1; fuel = Math.min(100, fuel + 38); A.add(30); A.beep(800, .1, 'triangle'); }
      cans = cans.filter(c => c.x > x - 150); const d = Math.floor(x / 20); if (d > far) { A.add(d - far); far = d; }
      still = Math.abs(vx) < 6 && fuel <= 0 ? still + dt : 0; if (still > 1.5) { A.over(); return; } A.info('FUEL ' + Math.ceil(fuel)); },
    draw(g) { const K = Art, cam = x - 70; g.drawImage(K.T.sky(240, 160, ['#ff7a4a', '#ffb060', '#ffe6a8']), 0, 0); K.put(g, K.ball(12, '#fff6c8'), 180, 34);
      for (let i = 0; i < 240; i += 2) { const a = 74 + Math.sin((i + cam * .2) * .03) * 14 + Math.sin((i + cam * .2) * .011) * 8; K.box(g, i, a, 2, 90, '#d87a50'); K.box(g, i, a, 2, 2, '#f0a070'); }
      for (let i = 0; i < 240; i += 2) { const a = 96 + Math.sin((i + cam * .45) * .045 + 2) * 10; K.box(g, i, a, 2, 70, '#a04e38'); K.box(g, i, a, 2, 2, '#c8704a'); }
      for (let i = 0; i < 240; i += 2) { const wx = Math.floor((cam + i) / 2), gy = Math.round(h(cam + i)); K.box(g, i, gy, 2, 160 - gy, '#5a3418'); K.box(g, i, gy + 3, 2, 7, '#7a4a26'); K.box(g, i, gy, 2, 3, '#3fb45a'); K.box(g, i, gy, 2, 1, '#a8f0a0'); K.box(g, i, gy + 3, 2, 1, '#1f6a2a'); if (wx * 7 % 11 === 0) K.box(g, i, gy + 12 + (wx % 5) * 5, 2, 2, '#3a2010'); if (wx * 5 % 17 === 0) K.box(g, i, gy + 18 + (wx % 4) * 6, 2, 1, '#8a623a'); if (wx % 23 === 0) K.box(g, i, gy - 2, 1, 2, '#58b96a'); }
      const can = K.spr('mhcan', 10, 12, q => { K.rr(q, -5, -4, 10, 10, 2, K.lin(q, -5, 0, 5, 0, '#ff8a7a', '#e8231e', '#7a1410')); K.box(q, 0, -6, 4, 2, '#5c6678'); K.box(q, -2, -1, 4, 4, '#ffd23c'); });
      for (const c of cans) if (!c.got) K.put(g, can, c.x - cam, h(c.x) - 9);
      K.shadow(g, x - cam, h(x) + 1, 10, 2); g.save(); g.translate(Math.round(x - cam), Math.round(y)); g.rotate(ang); const bk = K.bike(); g.drawImage(bk, -(bk.width >> 1), -bk.height + 1); g.restore();
      K.box(g, 6, 6, 68, 10, '#140e1c'); K.box(g, 7, 7, 66, 8, '#3a2030'); K.box(g, 8, 8, Math.round(64 * fuel / 100), 6, fuel > 25 ? '#ffd23c' : '#e8231e'); K.box(g, 8, 8, Math.round(64 * fuel / 100), 2, fuel > 25 ? '#fff6c8' : '#ff8a7a'); for (let i = 1; i < 4; i++) K.box(g, 7 + i * 16, 7, 1, 8, '#140e1c'); }
  };
} });
