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
    draw(g) { const cam = x - 70; ['#ff9a5a', '#ffb870', '#ffd98a', '#ffe9b0'].forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * 30, 240, 40); }); g.fillStyle = '#fff6c8'; g.fillRect(170, 22, 20, 20);
      g.fillStyle = '#c8704a'; for (let i = 0; i < 240; i += 4) g.fillRect(i, 78 + Math.sin((i + cam * .25) * .03) * 14, 4, 90); g.fillStyle = '#9a4a34'; for (let i = 0; i < 240; i += 4) g.fillRect(i, 96 + Math.sin((i + cam * .5) * .045 + 2) * 10, 4, 70);
      for (let i = 0; i < 240; i += 2) { const gy = Math.round(h(cam + i)); g.fillStyle = '#5a3418'; g.fillRect(i, gy, 2, 160 - gy); g.fillStyle = '#3fb45a'; g.fillRect(i, gy, 2, 3); g.fillStyle = '#3a2010'; if ((Math.floor((cam + i) / 2) * 7) % 11 === 0) g.fillRect(i, gy + 8 + (Math.floor(cam + i) % 5) * 4, 2, 2); }
      for (const c of cans) if (!c.got) { const X = Math.round(c.x - cam), Y = Math.round(h(c.x)) - 12; g.fillStyle = '#000'; g.fillRect(X - 4, Y - 1, 9, 11); g.fillStyle = '#e8231e'; g.fillRect(X - 3, Y, 7, 9); g.fillStyle = '#ffd23c'; g.fillRect(X - 1, Y + 3, 3, 3); g.fillRect(X + 1, Y - 2, 2, 2); }
      g.save(); g.translate(Math.round(x - cam), Math.round(y) - 4); g.rotate(ang); const R = (a, b, w, hh, c) => { g.fillStyle = c; g.fillRect(a, b, w, hh); };
      R(-10, -2, 7, 7, '#000'); R(4, -2, 7, 7, '#000'); R(-8, 0, 3, 3, '#aab4c2'); R(6, 0, 3, 3, '#aab4c2'); R(-7, -5, 14, 4, '#e8231e'); R(-7, -5, 14, 1, '#ff8a7a'); R(3, -8, 2, 4, '#12101c'); R(-3, -11, 5, 6, '#3f6ad0'); R(-2, -15, 5, 5, '#ffd23c'); R(1, -14, 2, 2, '#12101c'); g.restore();
      g.fillStyle = '#000'; g.fillRect(7, 7, 64, 8); g.fillStyle = '#3a2030'; g.fillRect(8, 8, 62, 6); g.fillStyle = fuel > 25 ? '#ffd23c' : '#e8231e'; g.fillRect(8, 8, Math.round(62 * fuel / 100), 6); }
  };
} });
