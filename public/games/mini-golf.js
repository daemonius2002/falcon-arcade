Arcade.game('mini-golf', { w: 240, h: 320, pad: 'dpad', a: 'PUTT',
help: 'Pull back and let go: touch or click anywhere, drag away from where you want the ball to go, then release — a longer pull is a harder hit. With keys: left / right aim, up / down power, Space putts. 9 holes; fewer strokes score more.',
init(A) {
  const HOLES = [
    { b: [120, 280], h: [120, 50], w: [] }, { b: [120, 280], h: [120, 50], w: [[60, 150, 120, 10]] }, { b: [40, 280], h: [200, 50], w: [[8, 170, 150, 10], [90, 100, 142, 10]] },
    { b: [120, 290], h: [120, 40], w: [[100, 140, 40, 40]] }, { b: [200, 290], h: [40, 40], w: [[80, 8, 10, 200], [150, 112, 10, 200]] }, { b: [120, 290], h: [120, 60], w: [[8, 200, 90, 10], [142, 200, 90, 10], [70, 120, 100, 10]] },
    { b: [30, 290], h: [210, 290], w: [[115, 80, 10, 232]] }, { b: [120, 290], h: [120, 160], w: [[80, 200, 80, 10], [80, 120, 10, 90], [150, 120, 10, 90]] }, { b: [120, 290], h: [120, 30], w: [[8, 230, 100, 10], [132, 230, 100, 10], [60, 160, 120, 10], [8, 90, 100, 10], [132, 90, 100, 10]] }];
  const BORD = [[0, 0, 240, 8], [0, 312, 240, 8], [0, 0, 8, 320], [232, 0, 8, 320]];
  let hi = 0, H, b, ang = -Math.PI / 2, pow = 150, strokes = 0, dr = null, wait = 0, msg = '';
  const info = () => A.info('HOLE ' + (hi + 1) + '/9  STROKES ' + strokes), moving = () => Math.hypot(b.vx, b.vy) > 0;
  function load() { H = HOLES[hi]; b = { x: H.b[0], y: H.b[1], vx: 0, vy: 0 }; strokes = 0; ang = Math.atan2(H.h[1] - b.y, H.h[0] - b.x); info(); }
  function putt() { if (moving() || wait > 0) return; b.vx = Math.cos(ang) * pow; b.vy = Math.sin(ang) * pow; strokes++; A.beep(500, .05); info(); }
  function done(sunk) { A.add(sunk ? [0, 100, 70, 50, 40, 30, 20, 10, 10][Math.min(8, strokes)] : 0); msg = !sunk ? 'NEXT HOLE' : strokes === 1 ? 'HOLE IN ONE!' : 'IN ' + strokes; wait = 1.3; b.vx = b.vy = 0; if (sunk) { b.x = H.h[0]; b.y = H.h[1]; A.beep(880, .3, 'triangle'); } }
  load();
  return {
    key(k) { if (k === 'a') putt(); }, swipe() {},
    update(dt) { if (wait > 0) { wait -= dt; if (wait <= 0) { msg = ''; hi++; if (hi >= 9) { hi = 8; A.over(true); return; } load(); } return; }
      const k = A.keys; ang += ((k.right ? 1 : 0) - (k.left ? 1 : 0)) * 1.8 * dt; pow = Math.max(40, Math.min(330, pow + ((k.up ? 1 : 0) - (k.down ? 1 : 0)) * 150 * dt));
      if (!moving()) { if (A.ptr.down && !dr) dr = { x: A.ptr.x, y: A.ptr.y }; if (dr) { const dx = dr.x - A.ptr.x, dy = dr.y - A.ptr.y, d = Math.hypot(dx, dy); if (d > 8) { ang = Math.atan2(dy, dx); pow = Math.max(40, Math.min(330, d * 3.4)); } if (!A.ptr.down) { dr = null; if (d > 8) putt(); } } return; }
      dr = null; for (let i = 0; i < 4; i++) { const h = dt / 4; b.x += b.vx * h; b.y += b.vy * h; for (const w of BORD.concat(H.w)) { const nx = Math.max(w[0], Math.min(w[0] + w[2], b.x)), ny = Math.max(w[1], Math.min(w[1] + w[3], b.y)), dx = b.x - nx, dy = b.y - ny, d = Math.hypot(dx, dy);
          if (d < 3) { let ux, uy; if (d > 0) { ux = dx / d; uy = dy / d; } else { ux = 0; uy = b.vy > 0 ? -1 : 1; } b.x = nx + ux * 3; b.y = ny + uy * 3; const dot = b.vx * ux + b.vy * uy; if (dot < 0) { b.vx = (b.vx - 2 * dot * ux) * .82; b.vy = (b.vy - 2 * dot * uy) * .82; A.beep(240, .02); } } } }
      const f = Math.max(0, 1 - 1.5 * dt), sp = Math.hypot(b.vx, b.vy); b.vx *= f; b.vy *= f; if (sp < 7) b.vx = b.vy = 0;
      if (Math.hypot(b.x - H.h[0], b.y - H.h[1]) < 6 && sp < 180) return done(true); if (!moving() && strokes >= 8) done(false); },
    draw(g) { const K = Art, S = this.S || (this.S = { F: K.fx(), w: 0 }), wd = K.T.wood(64, 64); K.scroll(g, K.T.grass(64, 64), 0, 0, 240, 320); g.fillStyle = 'rgba(160,255,160,.07)'; for (let y = 0; y < 320; y += 16) for (let x = (y / 16 % 2) * 16; x < 240; x += 32) g.fillRect(x, y, 16, 16);
      for (const w of H.w) K.box(g, w[0] + 3, w[1] + 4, w[2], w[3], 'rgba(0,0,0,.28)');
      for (const w of BORD.concat(H.w)) { K.box(g, w[0] - 1, w[1] - 1, w[2] + 2, w[3] + 2, '#140e1c'); for (let yy = 0; yy < w[3]; yy += 64) for (let xx = 0; xx < w[2]; xx += 64) g.drawImage(wd, 0, 0, Math.min(64, w[2] - xx), Math.min(64, w[3] - yy), w[0] + xx, w[1] + yy, Math.min(64, w[2] - xx), Math.min(64, w[3] - yy)); K.box(g, w[0], w[1], w[2], 2, '#f0c080'); K.box(g, w[0], w[1], 2, w[3], '#e0a860'); K.box(g, w[0], w[1] + w[3] - 2, w[2], 2, '#6a3c14'); K.box(g, w[0] + w[2] - 2, w[1], 2, w[3], '#6a3c14'); }
      K.box(g, H.b[0] - 6, H.b[1] - 1, 12, 3, '#f2f5f8'); const hx = H.h[0], hy = H.h[1]; g.fillStyle = '#1f5a28'; g.beginPath(); g.ellipse(hx, hy, 8, 7, 0, 0, 7); g.fill(); g.fillStyle = '#0e0c18'; g.beginPath(); g.ellipse(hx, hy, 6, 5, 0, 0, 7); g.fill();
      K.box(g, hx, hy - 24, 2, 24, '#140e1c'); K.box(g, hx, hy - 24, 1, 24, '#f2f5f8'); const fw = Math.floor(performance.now() / 300) % 2; K.box(g, hx + 2, hy - 24, 10 - fw, 8, '#140e1c'); K.box(g, hx + 2, hy - 23, 9 - fw, 6, '#e8231e'); K.box(g, hx + 2, hy - 23, 9 - fw, 2, '#ff8a7a');
      if (!moving() && wait <= 0) { const n = Math.round(pow / 28), c = pow > 230 ? '#ff6a5a' : pow > 130 ? '#ffd23c' : '#a8f0a0'; for (let i = 1; i <= n; i++) { const a = Math.round(b.x + Math.cos(ang) * i * 7), d = Math.round(b.y + Math.sin(ang) * i * 7); K.box(g, a - 2, d - 2, 4, 4, '#140e1c'); K.box(g, a - 1, d - 1, 2, 2, c); } }
      if (wait > S.w && msg !== 'NEXT HOLE') S.F.spark(hx, hy, ['#ffd23c', '#ffffff', '#3fd45a'], 24, 110); S.w = wait;
      if (!(wait > 0 && msg !== 'NEXT HOLE')) { K.shadow(g, b.x + 1, b.y + 3, 3, 1.5); K.put(g, K.ball(3, '#ffffff'), b.x, b.y); } S.F.draw(g);
      if (msg) { K.box(g, 0, 144, 240, 34, 'rgba(13,11,20,.8)'); K.box(g, 0, 144, 240, 2, '#ffd23c'); K.box(g, 0, 176, 240, 2, '#ffd23c'); A.text(g, msg, 122, 156, '#140e1c', 3, 'center'); A.text(g, msg, 120, 154, '#ffd23c', 3, 'center'); } }
  };
} });
