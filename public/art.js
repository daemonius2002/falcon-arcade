/* Falcon Arcade — shared pixel-art kit: shaded sprites with outlines, dithered textures, explosions */
(function () {
'use strict';
const TAU = Math.PI * 2, R = Math.random, rnd = (a, b) => a + R() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1));
function mkc(w, h) { const k = document.createElement('canvas'); k.width = Math.max(1, Math.round(w)); k.height = Math.max(1, Math.round(h)); return k; }
const hx = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const mix = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => ('0' + Math.round(v + (B[i] - v) * t).toString(16)).slice(-2)).join(''); };
const lite = (a, t) => mix(a, '#ffffff', t), dark = (a, t) => mix(a, '#000000', t), rgba = (h, a) => { const A = hx(h); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; };
function grad(q, st) { st.forEach((s, i) => q.addColorStop(st.length > 1 ? i / (st.length - 1) : 0, s)); return q; }
const lin = (g, x0, y0, x1, y1, ...st) => grad(g.createLinearGradient(x0, y0, x1, y1), st), rad = (g, x, y, r0, r1, ...st) => grad(g.createRadialGradient(x, y, r0, x, y, r1), st);
function poly(g, p) { g.beginPath(); for (let i = 0; i < p.length; i += 2) g[i ? 'lineTo' : 'moveTo'](p[i], p[i + 1]); g.closePath(); }
function sym(p) { const o = p.slice(); for (let i = p.length - 2; i >= 0; i -= 2) o.push(-p[i], p[i + 1]); return o; }
function part(g, p, f) { poly(g, p); g.fillStyle = f; g.fill(); }
function mir(g, p, f1, f2) { part(g, p, f1); part(g, p.map((v, i) => i % 2 ? v : -v), f2 || f1); }
function ell(g, x, y, rx, ry, f) { g.beginPath(); g.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, TAU); g.fillStyle = f; g.fill(); }
function box(g, x, y, w, h, f) { g.fillStyle = f; g.fillRect(x, y, w, h); }
function rr(g, x, y, w, h, r, f) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); if (f) { g.fillStyle = f; g.fill(); } }
function org(g, x, y, r, s, n) { const p = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, q = r * (.78 + .22 * Math.sin(s + i * 2.4) * Math.cos(s * 1.7 + i)); p.push(x + Math.cos(a) * q, y + Math.sin(a) * q); } const m = i => [(p[i * 2] + p[(i * 2 + 2) % p.length]) / 2, (p[i * 2 + 1] + p[(i * 2 + 3) % p.length]) / 2]; let q = m(n - 1); g.beginPath(); g.moveTo(q[0], q[1]); for (let i = 0; i < n; i++) { q = m(i); g.quadraticCurveTo(p[i * 2], p[i * 2 + 1], q[0], q[1]); } g.closePath(); }
const reg = (n, r, rot, ry) => { const p = []; for (let i = 0; i < n; i++) { const a = (rot || 0) + i / n * TAU; p.push(Math.sin(a) * r, -Math.cos(a) * (ry || r)); } return p; };
const OL = [20, 14, 28];
function pix(k, ol, L) { const g = k.getContext('2d'), w = k.width, h = k.height, im = g.getImageData(0, 0, w, h), d = im.data, n = w * h, op = new Uint8Array(n), q = v => Math.round(Math.round(v / 255 * L) / L * 255);
  for (let i = 0, j = 0; i < n; i++, j += 4) { if (d[j + 3] >= 128) { op[i] = 1; d[j] = q(d[j]); d[j + 1] = q(d[j + 1]); d[j + 2] = q(d[j + 2]); d[j + 3] = 255; } else d[j + 3] = 0; }
  if (ol) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (op[i]) continue; if ((x && op[i - 1]) || (x < w - 1 && op[i + 1]) || (y && op[i - w]) || (y < h - 1 && op[i + w])) { const j = i * 4; d[j] = ol[0]; d[j + 1] = ol[1]; d[j + 2] = ol[2]; d[j + 3] = 255; } }
  g.putImageData(im, 0, 0); return k; }
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function dith(k, L) { const g = k.getContext('2d'), w = k.width, h = k.height, im = g.getImageData(0, 0, w, h), d = im.data, st = 255 / L;
  for (let y = 0, j = 0; y < h; y++) for (let x = 0; x < w; x++, j += 4) { if (d[j + 3] < 128) { d[j + 3] = 0; continue; } const t = (BAY[(y & 3) * 4 + (x & 3)] / 16 - .47) * st * .9; for (let q = 0; q < 3; q++) d[j + q] = Math.max(0, Math.min(255, Math.round(Math.round((d[j + q] + t) / st) * st))); d[j + 3] = 255; }
  g.putImageData(im, 0, 0); return k; }
const C = {};
/* vector drawing -> crisp shaded pixel sprite with a dark outline; origin is the sprite centre */
function spr(key, w, h, fn, o) { if (C[key]) return C[key]; o = o || {}; const k = mkc(w + 2, h + 2), g = k.getContext('2d'); g.translate(1 + w / 2, 1 + h / 2); fn(g, w, h); pix(k, o.ol === 0 ? null : (o.ol || OL), o.L || 7); return (C[key] = k); }
function put(g, k, x, y, o) { x = Math.round(x); y = Math.round(y); if (!o) { g.drawImage(k, x - (k.width >> 1), y - (k.height >> 1)); return; } g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); if (o.flip) g.scale(-1, 1); if (o.sc) g.scale(o.sc, o.sc); if (o.a != null) g.globalAlpha = o.a; g.drawImage(k, -(k.width >> 1), -(k.height >> 1)); g.restore(); }
/* dithered texture: base colour + soft blobs + optional drawing, then crisp specks */
function tex(key, w, h, o) { if (C[key]) return C[key]; const k = mkc(w, h), g = k.getContext('2d'); box(g, 0, 0, w, h, o.base);
  const wrap = (x, y, r, fn) => { for (const dx of o.tile ? [-w, 0, w] : [0]) for (const dy of o.tile ? [-h, 0, h] : [0]) if (x + dx + r > 0 && x + dx - r < w && y + dy + r > 0 && y + dy - r < h) fn(x + dx, y + dy); };
  if (o.grad) box(g, 0, 0, w, h, lin(g, 0, 0, 0, h, ...o.grad));
  for (const b of o.blobs || []) for (let i = 0; i < b[2]; i++) { const x = R() * w, y = R() * h, r = rnd(b[3], b[4]); wrap(x, y, r, (X, Y) => { g.fillStyle = rad(g, X, Y, 0, r, rgba(b[0], b[1]), rgba(b[0], 0)); g.fillRect(X - r, Y - r, 2 * r, 2 * r); }); }
  if (o.draw) o.draw(g, w, h); dith(k, o.L || 10);
  for (const s of o.specks || []) for (let i = 0; i < s[1]; i++) box(g, R() * w | 0, R() * h | 0, s[2] || 1, s[3] || 1, s[0]);
  if (o.post) o.post(g, w, h); return (C[key] = k); }
function scroll(g, k, ox, oy, W, H) { const w = k.width, h = k.height; ox = ((Math.round(ox) % w) + w) % w; oy = ((Math.round(oy) % h) + h) % h; for (let y = -oy; y < H; y += h) for (let x = -ox; x < W; x += w) g.drawImage(k, x, y); }
/* crisp bevelled block (bricks, tiles, cards, platforms) */
function block(w, h, col, st) { const key = 'b' + w + '_' + h + col + (st || ''); if (C[key]) return C[key]; const k = mkc(w, h), g = k.getContext('2d');
  box(g, 0, 0, w, h, '#140e1c'); box(g, 1, 1, w - 2, h - 2, col); box(g, 1, 1, w - 2, 1, lite(col, .55)); box(g, 1, 2, 1, h - 3, lite(col, .3)); box(g, 1, h - 2, w - 2, 1, dark(col, .45)); box(g, w - 2, 1, 1, h - 2, dark(col, .28));
  if (w > 7 && h > 7) { box(g, 3, 3, w - 6, Math.max(1, (h - 6) >> 1), lite(col, .16)); box(g, 2, 2, 2, 1, '#ffffff'); if (h > 12) box(g, 3, h - 4, w - 6, 1, dark(col, .2)); }
  if (st === 'r') for (const [x, y] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) g.clearRect(x, y, 1, 1);
  return (C[key] = k); }
const ball = (r, col) => spr('ball' + r + col, 2 * r, 2 * r, g => { ell(g, 0, 0, r, r, rad(g, -r * .35, -r * .35, r * .1, r * 1.55, lite(col, .7), col, dark(col, .6))); ell(g, -r * .38, -r * .42, Math.max(.8, r * .26), Math.max(.6, r * .18), '#ffffff'); });
const GS = [g => poly(g, reg(4, 10)), g => rr(g, -8, -8, 16, 16, 3), g => { g.beginPath(); g.arc(0, 0, 9, 0, TAU); }, g => poly(g, [0, -9, 9, 7, -9, 7]), g => poly(g, reg(6, 9.5, TAU / 12)), g => { const p = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, q = i % 2 ? 4.6 : 10; p.push(Math.sin(a) * q, -Math.cos(a) * q); } poly(g, p); }];
function gem(t, col, n) { n = n || 20; return spr('gem' + t + col + n, n, n, g => { g.scale(n / 20, n / 20); GS[t](g); g.fillStyle = lin(g, -9, -9, 9, 9, lite(col, .55), col, dark(col, .5)); g.fill(); g.save(); g.scale(.55, .55); GS[t](g); g.fillStyle = lin(g, -9, -9, 9, 9, lite(col, .8), lite(col, .25)); g.fill(); g.restore(); box(g, -5, -6, 3, 2, '#ffffff'); }); }
/* little people: o = {id, skin, shirt, pants, hat:'cap'|'hair'|'helmet'|'hood'|'lamp', hatc}; f = 0 stand, 1/2 run, 3 jump. Feet are at centre + 14. */
function guy(o, f) { f = f || 0; return spr('guy' + o.id + f, 18, 28, g => { g.translate(0, 3); const lx = [0, 2, -2, 1][f], sw = [0, 1, -1, -2][f];
  const leg = (x, d, up) => { box(g, x + d, 4, 3, 5 - up, o.pants); box(g, x + d - (d < 0 ? 1 : 0), 9 - up, 4, 2, o.shoe || '#2a2030'); };
  leg(-4, -lx, f === 2 || f === 3 ? 1 : 0); leg(1, lx, f === 1 || f === 3 ? 1 : 0);
  box(g, -7, -3 + sw, 2, 5, o.skin); box(g, 5, -3 - sw, 2, 5, o.skin); box(g, -5, -4, 10, 9, lin(g, -5, 0, 5, 0, lite(o.shirt, .35), o.shirt, dark(o.shirt, .35))); box(g, -7, -4 + sw, 2, 3, o.shirt); box(g, 5, -4 - sw, 2, 3, dark(o.shirt, .2));
  if (o.belt) box(g, -5, 3, 10, 2, o.belt); if (o.badge) box(g, -1, -2, 3, 3, o.badge);
  ell(g, 0, -8, 5, 4.6, o.skin); box(g, 0, -9, 1, 2, '#1a1222'); box(g, 3, -9, 1, 2, '#1a1222');
  const h = o.hat, c = o.hatc || '#e8231e';
  if (h === 'cap' || h === 'lamp') { box(g, -5, -13, 10, 4, c); box(g, -5, -13, 10, 1, lite(c, .4)); box(g, 1, -10, 6, 1, dark(c, .3)); if (h === 'lamp') { box(g, 2, -13, 3, 3, '#fff6c8'); box(g, 3, -12, 1, 1, '#ffd23c'); } }
  else if (h === 'hair') { box(g, -5, -13, 10, 3, c); box(g, -5, -11, 2, 4, c); box(g, -4, -13, 6, 1, lite(c, .35)); }
  else if (h === 'helmet') { ell(g, 0, -9, 6, 5.4, lin(g, -6, 0, 6, 0, '#f2f5f8', '#aab4c2', '#5c6678')); box(g, 0, -9, 6, 2, '#1a1222'); box(g, -1, -17, 3, 4, c); }
  else if (h === 'hood') { ell(g, 0, -8, 6, 5.6, c); box(g, -2, -10, 7, 3, o.skin); box(g, 0, -9, 1, 2, '#1a1222'); box(g, 3, -9, 1, 2, '#1a1222'); box(g, -8, -9, 3, 1, o.band || '#e8231e'); box(g, -9, -8, 2, 1, o.band || '#e8231e'); }
  }); }
const car = (col, len) => { len = len || 24; return spr('car' + col + len, 14, len, g => { const h = len / 2; box(g, -7, -h + 3, 14, 5, '#1a1222'); box(g, -7, h - 9, 14, 5, '#1a1222'); rr(g, -6, -h, 12, len, 3, lin(g, -6, 0, 6, 0, lite(col, .45), col, dark(col, .4)));
  box(g, -4, -h + 6, 8, 4, '#1b2a44'); box(g, -4, -h + 6, 3, 1, '#7fc0f0'); box(g, -4, -h + 10, 8, Math.max(2, len - 19), lite(col, .28)); if (len > 28) box(g, -5, -h + 12, 10, len - 20, dark(col, .2)); box(g, -4, h - 8, 8, 3, '#1b2a44');
  box(g, -5, -h + 1, 2, 2, '#fff6c8'); box(g, 3, -h + 1, 2, 2, '#fff6c8'); box(g, -5, h - 2, 2, 1, '#ff4060'); box(g, 3, h - 2, 2, 1, '#ff4060'); }); };
const tank = col => spr('tank' + col, 16, 18, g => { for (const s of [-8, 4]) { box(g, s, -7, 4, 15, '#2a2a33'); for (let y = -6; y < 8; y += 3) box(g, s, y, 4, 1, '#59627a'); } box(g, -5, -5, 10, 12, lin(g, -5, 0, 5, 0, lite(col, .4), col, dark(col, .45))); ell(g, 0, 2, 4, 4, lite(col, .3)); box(g, -1, -9, 3, 9, lin(g, -1, 0, 2, 0, lite(col, .6), dark(col, .3))); box(g, -2, -9, 5, 2, lite(col, .5)); });
const boat = () => spr('boat', 14, 28, g => { part(g, sym([0, -14, 6, -5, 6, 11, 4, 14]), lin(g, -6, 0, 6, 0, '#ffffff', '#d6dbea', '#8a94a4')); part(g, sym([0, -9, 4, -3, 4, 9]), '#c89a5a'); box(g, -6, 3, 12, 3, '#e8231e'); box(g, -3, -3, 6, 5, '#1b2a44'); box(g, -3, -3, 2, 1, '#7fc0f0'); box(g, -2, 10, 4, 4, '#3a4152'); });
const kart = col => spr('kart' + col, 10, 14, g => { for (const [x, y] of [[-5, -6], [3, -6], [-5, 3], [3, 3]]) box(g, x, y, 2, 4, '#1a1222'); part(g, sym([0, -7, 2, -5, 3, 6, 0, 7]), lin(g, -3, 0, 3, 0, lite(col, .5), col, dark(col, .4))); box(g, -3, -7, 6, 1, lite(col, .3)); ell(g, 0, 1, 2.4, 2.4, '#f2f5f8'); box(g, -1, 0, 2, 1, '#1b2a44'); box(g, -4, 5, 8, 1, dark(col, .3)); }, { L: 6 });
const bike = () => spr('bike', 26, 22, g => { g.translate(0, 2); for (const x of [-8, 8]) { ell(g, x, 4, 4.6, 4.6, '#1a1222'); ell(g, x, 4, 2, 2, '#aab4c2'); } part(g, [-9, 1, -3, -3, 5, -3, 9, 1, 3, 3, -5, 3], lin(g, 0, -3, 0, 3, '#ff6a4a', '#c8231e')); box(g, 5, -6, 2, 5, '#3a4152'); box(g, 4, -7, 5, 2, '#1a1222');
  part(g, [-4, -4, -1, -10, 3, -10, 4, -4], '#3f6ad0'); box(g, 2, -8, 5, 2, '#3f6ad0'); ell(g, 1, -12, 3.4, 3.4, '#ffd23c'); box(g, 2, -13, 3, 2, '#1b2a44'); box(g, -5, -3, 4, 4, '#2a3f7a'); });
const ship = v => spr('ship' + v, 24, 24, g => { if (v === 1) g.rotate(Math.PI / 2);
  part(g, sym([3, -3, 11, 6, 11, 9, 3, 7]), lin(g, -11, 0, 11, 0, '#ffffff', '#b4bfcc', '#69758a')); mir(g, [8, 4, 11, 6, 11, 9, 8, 8], '#ff8a2a', '#ffb054'); part(g, sym([0, -12, 2, -8, 3, 0, 3, 8, 2, 11]), lin(g, -3, 0, 3, 0, '#ffffff', '#dfe6ee', '#8793a6')); ell(g, 0, -4, 1.8, 4, lin(g, 0, -8, 0, 0, '#c8fffa', '#2fc4ba', '#0e6a72')); box(g, -1, 4, 2, 6, '#ff8a2a'); });
const rock = (r, v, c) => { c = c || '#8a7a6a'; return spr('rock' + r + '_' + v + c, 2 * r + 2, 2 * r + 2, g => { org(g, 0, 0, r, 5 + v * 13, 10); g.fillStyle = rad(g, -r * .4, -r * .4, r * .1, r * 1.6, lite(c, .45), c, dark(c, .6)); g.fill(); if (r > 5) { ell(g, r * .25, r * .2, r * .24, r * .18, dark(c, .45)); ell(g, -r * .35, r * .35, r * .14, r * .1, dark(c, .45)); ell(g, -r * .1, -r * .4, r * .12, r * .08, dark(c, .3)); } }); };
const tree = (r, v) => spr('tree' + r + v, 2 * r + 2, 2 * r + 2, g => { org(g, 0, 0, r, v * 7, 9); g.fillStyle = '#1f5a28'; g.fill(); org(g, -r * .12, -r * .15, r * .78, v * 7 + 1, 9); g.fillStyle = '#2f8a3a'; g.fill(); org(g, -r * .28, -r * .32, r * .45, v * 7 + 2, 8); g.fillStyle = '#58b96a'; g.fill(); ell(g, -r * .35, -r * .4, r * .16, r * .12, '#a8f0a0'); });
const cloud = w => spr('cloud' + w, w, w * .45, g => { const h = w * .2; ell(g, 0, h * .4, w * .48, h, '#c8dcf0'); ell(g, -w * .18, 0, w * .22, h * 1.1, '#ffffff'); ell(g, w * .1, -h * .3, w * .26, h * 1.2, '#ffffff'); ell(g, w * .3, h * .2, w * .16, h * .8, '#ffffff'); }, { ol: 0 });
const coin = f => spr('coin' + f, 10, 10, g => { const w = [4.6, 3.4, 1.2, 3.4][f]; ell(g, 0, 0, w, 4.6, '#c8801e'); ell(g, 0, 0, Math.max(.6, w - 1.2), 3.4, '#ffd23c'); if (w > 2) box(g, -1, -2, 1, 4, '#fff6c8'); });
const key = () => spr('key', 12, 8, g => { ell(g, -3, 0, 3, 3, '#ffd23c'); ell(g, -3, 0, 1.2, 1.2, '#5a3a10'); box(g, -1, -1, 7, 2, '#ffd23c'); box(g, 3, 1, 1, 2, '#ffd23c'); box(g, 5, 1, 1, 2, '#ffd23c'); box(g, -1, -1, 7, 1, '#fff6c8'); });
const heart = () => spr('heart', 12, 11, g => { ell(g, -2.6, -1.5, 3, 3, '#e8231e'); ell(g, 2.6, -1.5, 3, 3, '#e8231e'); part(g, [-5.4, 0, 5.4, 0, 0, 5.5], '#e8231e'); box(g, -4, -3, 2, 1, '#ffb0a0'); });
const fruit = k => { const c = ['#e8231e', '#ff8a1e', '#b06ae0', '#ffd23c'][k]; return spr('fruit' + k, 10, 12, g => { ell(g, 0, 1, 4.4, 4.4, rad(g, -1.5, -.5, .5, 6, lite(c, .6), c, dark(c, .5))); box(g, 0, -5, 1, 3, '#5a3418'); part(g, [1, -5, 4, -6, 3, -3], '#3fd45a'); box(g, -3, -1, 1, 1, '#ffffff'); }); };
const star = c => spr('star' + c, 12, 12, g => { GS[5](g); g.transform(.6, 0, 0, .6, 0, 0); g.fillStyle = c; g.fill(); }, { L: 6 });
const star2 = (c, n) => spr('st2' + c + n, n, n, g => { g.scale(n / 21, n / 21); GS[5](g); g.fillStyle = lin(g, -8, -8, 8, 8, lite(c, .6), c, dark(c, .35)); g.fill(); box(g, -2, -4, 2, 2, '#ffffff'); });
const slime = (c, f) => spr('slime' + c + f, 12, 11, g => { const h = f ? 4 : 5; part(g, [-6, 5, -6, 1, -4, -h, 0, -h - 1, 4, -h, 6, 1, 6, 5, 4, 4, 2, 5, 0, 4, -2, 5, -4, 4], lin(g, 0, -6, 0, 5, lite(c, .5), c, dark(c, .35))); box(g, -4, -2, 3, 3, '#ffffff'); box(g, 1, -2, 3, 3, '#ffffff'); box(g, -3, -1, 2, 2, '#1a1222'); box(g, 2, -1, 2, 2, '#1a1222'); box(g, -4, -h + 1, 2, 1, '#ffffff'); });
const bat = f => spr('bat' + f, 16, 10, g => { const y = f ? -3 : 2; mir(g, [2, -1, 8, y, 6, 2, 4, 1, 3, 3], '#8a4ac8', '#6a34a0'); ell(g, 0, 0, 3, 3.4, '#b06ae0'); box(g, -2, -5, 1, 2, '#b06ae0'); box(g, 1, -5, 1, 2, '#b06ae0'); box(g, -2, -1, 1, 1, '#ff4060'); box(g, 1, -1, 1, 1, '#ff4060'); });
const snail = () => spr('snail', 14, 10, g => { part(g, [-7, 5, -7, 2, 5, 2, 7, -1, 7, 5], '#f0c890'); ell(g, -1, -1, 5, 4.6, rad(g, -2, -2, .5, 6, '#e0b0ff', '#b06ae0', '#5a2a8a')); ell(g, -1, -1, 2.2, 2, '#5a2a8a'); ell(g, -1, -1, .9, .8, '#e0b0ff'); box(g, 5, -4, 1, 3, '#f0c890'); box(g, 5, -5, 2, 2, '#1a1222'); });
const frog = f => spr('frog' + f, 14, 14, g => { const d = f ? 2 : 0; mir(g, [3, 2, 7, 3 + d, 7, 6 + d, 4, 6], '#2f8a3a'); mir(g, [3, -4, 6, -6 - d, 7, -4 - d, 4, -1], '#2f8a3a'); ell(g, 0, 0, 4.6, 5.6, rad(g, -1.5, -2, .5, 7, '#b8f08a', '#5fd04a', '#1f7a2a')); ell(g, -2.6, -4, 1.8, 1.8, '#fff6c8'); ell(g, 2.6, -4, 1.8, 1.8, '#fff6c8'); box(g, -3, -5, 1, 2, '#1a1222'); box(g, 2, -5, 1, 2, '#1a1222'); box(g, -1, 1, 3, 1, '#2f8a3a'); });
const log = len => spr('log' + len, len, 12, g => { rr(g, -len / 2, -6, len, 12, 4, lin(g, 0, -6, 0, 6, '#c08a4a', '#8a5a2a', '#4a2a10')); for (let x = -len / 2 + 7; x < len / 2 - 8; x += 11) box(g, x, (x & 2) - 1, 5, 1, '#4a2a10'); ell(g, len / 2 - 3, 0, 2.2, 4.6, '#e0b070'); ell(g, len / 2 - 3, 0, 1, 2.4, '#8a5a2a'); });
const lily = () => spr('lily', 14, 13, g => { ell(g, 0, 0, 6.6, 6, rad(g, -2, -2, .5, 8, '#8ae06a', '#3fa84a', '#1f6a2a')); part(g, [0, 0, -2, -7, 2, -7], '#1b5fa8'); ell(g, 2, 2, 1.8, 1.8, '#ffb0d0'); box(g, 2, 2, 1, 1, '#ffd23c'); }, { ol: [14, 60, 40] });
const bomb = () => spr('bomb', 10, 14, g => { part(g, [-4, -7, 4, -7, 2, -3, -2, -3], '#5c6678'); ell(g, 0, 1, 4, 5.4, rad(g, -1.5, -1, .5, 6.5, '#ff8a7a', '#e8231e', '#7a1410')); box(g, -1, 5, 2, 2, '#ffd23c'); box(g, -3, -1, 1, 2, '#ffffff'); });
const fire = f => spr('fire' + f, 12, 14, g => { const w = f ? 4.4 : 5; part(g, [0, -7, w, 0, w - 1, 5, 0, 7, -w + 1, 5, -w, 0, f ? -2 : 2, -3], lin(g, 0, -7, 0, 7, '#ffd23c', '#ff8a1e', '#e8231e')); ell(g, 0, 3, 2.4, 3, '#fff6c8'); }, { ol: [110, 20, 14] });
const door = c => spr('door' + c, 16, 24, g => { rr(g, -8, -12, 16, 28, 7, lin(g, -8, 0, 8, 0, lite(c, .3), c, dark(c, .4))); for (const x of [-3, 2]) box(g, x, -10, 1, 22, dark(c, .45)); box(g, -8, -3, 16, 2, '#5c6678'); box(g, -8, 6, 16, 2, '#5c6678'); ell(g, 4, 2, 1.4, 1.4, '#ffd23c'); });
const crate = n => spr('crate' + n, n, n, g => { const h = n / 2; box(g, -h, -h, n, n, '#9a6a34'); box(g, -h, -h, n, 2, '#d8aa6a'); box(g, -h, h - 2, n, 2, '#5a3418'); box(g, -h, -h, 2, n, '#c08a4a'); box(g, h - 2, -h, 2, n, '#5a3418'); g.strokeStyle = '#5a3418'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-h + 2, -h + 2); g.lineTo(h - 2, h - 2); g.moveTo(h - 2, -h + 2); g.lineTo(-h + 2, h - 2); g.stroke(); });
const spike = () => spr('spike', 8, 12, g => { part(g, [0, -6, 4, 6, -4, 6], lin(g, -4, 0, 4, 0, '#ffffff', '#aab4c2', '#4a5462')); });
const shur = f => spr('shur' + f, 12, 12, g => { g.rotate(f * TAU / 8); const p = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, q = i % 2 ? 2.2 : 6; p.push(Math.sin(a) * q, -Math.cos(a) * q); } part(g, p, lin(g, -6, -6, 6, 6, '#ffffff', '#aab4c2', '#5c6678')); ell(g, 0, 0, 1.2, 1.2, '#e8231e'); });
const paddle = (w, c) => spr('pad' + w + c, w, 8, g => { rr(g, -w / 2, -4, w, 8, 4, lin(g, 0, -4, 0, 4, '#ffffff', '#aab4c2', '#4a5462')); rr(g, -w / 2, -4, 9, 8, 4, lin(g, 0, -4, 0, 4, lite(c, .5), c, dark(c, .4))); rr(g, w / 2 - 9, -4, 9, 8, 4, lin(g, 0, -4, 0, 4, lite(c, .5), c, dark(c, .4))); box(g, -w / 2 + 10, -1, w - 20, 1, '#5fe3d6'); });
const disc = (r, c, knob) => spr('disc' + r + c + (knob ? 1 : 0), 2 * r, 2 * r, g => { ell(g, 0, 0, r, r, lin(g, -r, -r, r, r, lite(c, .5), c, dark(c, .5))); ell(g, 0, 0, r * .72, r * .72, dark(c, .25)); if (knob) { ell(g, 0, 0, r * .5, r * .5, lin(g, -r, -r, r, r, lite(c, .7), c)); ell(g, -r * .15, -r * .18, r * .16, r * .12, '#ffffff'); } else ell(g, 0, 0, r * .4, r * .4, lite(c, .2)); });
const building = (w, h, v) => spr('bld' + w + '_' + h + v, w, h + 6, g => { const c = ['#3a4a9a', '#4a3a8a', '#2f5a8a'][v % 3], y0 = -h / 2 + 3; box(g, -w / 2, y0, w, h, lin(g, -w / 2, 0, w / 2, 0, lite(c, .25), c, dark(c, .45))); box(g, -w / 2, y0, w, 2, lite(c, .5)); box(g, -w / 4, y0 - 4, w / 3, 4, dark(c, .2)); box(g, w / 4 - 1, y0 - 6, 1, 6, '#aab4c2');
  for (let y = y0 + 5; y < y0 + h - 4; y += 6) for (let x = -w / 2 + 3; x < w / 2 - 4; x += 5) box(g, x, y, 3, 3, (x * 7 + y * 3 + v) % 5 > 1 ? '#ffd98a' : '#1b2a44'); });
/* explosions + sparks; S = Art.fx() per game, call S.draw(g) every frame */
const EX = [[], []];
function mkEx() { for (let s = 0; s < 2; s++) for (let v = 0; v < 3; v++) { const bl = [], n = s ? 46 : 26, sc = s ? .5 : .28; for (let i = 0; i < 7; i++) { const a = R() * TAU, d = i ? rnd(6, 22) : 0; bl.push([Math.cos(a) * d, Math.sin(a) * d, rnd(10, 18), R()]); }
  EX[s][v] = []; for (let f = 0; f < 8; f++) { const t = f / 7, k = mkc(n, n), g = k.getContext('2d'); g.translate(n / 2, n / 2); g.scale(sc, sc);
    const lay = (m, col) => { if (m <= 0) return; g.fillStyle = col; for (const b of bl) { const gr = Math.min(1, .45 + t * 1.6), q = b[3] * .4 + .45, fd = t > q ? Math.max(0, 1 - (t - q) * 3.2) : 1, r = b[2] * gr * fd * m; if (r > 1.5) { g.beginPath(); g.arc(b[0] * gr, b[1] * gr, r, 0, TAU); g.fill(); } } };
    lay(1, t > .55 ? '#5a4a48' : '#d8321e'); lay(.8, t > .7 ? '#8a6a58' : '#ff8a1e'); lay(.58 * (1 - t * .5), '#ffd23c'); lay(.34 * (1 - t * 1.1), '#fff6c8'); EX[s][v][f] = pix(k, t > .55 ? [50, 36, 40] : [110, 20, 14], 6); } } }
function fx() { if (!EX[0].length) mkEx(); let p = [], e = [], last = 0; return {
  boom(x, y, big) { e.push({ x, y, f: 0, v: ri(0, 2), s: big ? 1 : 0 }); },
  spark(x, y, cols, n, sp) { for (let i = 0; i < (n || 8); i++) { const a = R() * TAU, v = rnd(.3, 1) * (sp || 80); p.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: rnd(.2, .55), c: cols[ri(0, cols.length - 1)], s: R() < .4 ? 2 : 1 }); } },
  puff(x, y, c, vy) { p.push({ x, y, vx: rnd(-6, 6), vy: vy || 0, l: rnd(.25, .5), c, s: 2 }); },
  draw(g) { const now = performance.now(), dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    for (const q of p) { q.x += q.vx * dt; q.y += q.vy * dt; q.l -= dt; box(g, Math.round(q.x), Math.round(q.y), q.s, q.s, q.c); } p = p.filter(q => q.l > 0); if (p.length > 260) p.splice(0, p.length - 260);
    for (const q of e) { const k = EX[q.s][q.v][Math.min(7, Math.floor(q.f))]; g.drawImage(k, Math.round(q.x) - (k.width >> 1), Math.round(q.y) - (k.height >> 1)); q.f += dt * 16; } e = e.filter(q => q.f < 8); } }; }
/* objects that vanished from a list since the last frame (for hit effects) */
function gone(S, k, list) { const prev = S[k] || []; S[k] = list.slice(); const now = new Set(list); return prev.filter(o => !now.has(o)); }
const shadow = (g, x, y, rx, ry) => { g.fillStyle = 'rgba(8,4,16,.32)'; g.beginPath(); g.ellipse(Math.round(x), Math.round(y), rx, ry, 0, 0, TAU); g.fill(); };
/* common textures */
const T = {
  space: (w, h) => tex('space' + w + h, w, h, { base: '#070a1c', tile: 1, blobs: [['#1c2f8a', .36, 5, 70, 150], ['#4a1f7a', .26, 4, 60, 120], ['#0e5a6a', .16, 2, 50, 90]], specks: [['#56658f', 60], ['#9fb4e6', 40], ['#ffffff', 22], ['#ffffff', 5, 2, 2]] }),
  grass: (w, h) => tex('grass' + w + h, w, h, { base: '#2f8a3a', tile: 1, blobs: [['#3fa84a', .6, 16, 16, 44], ['#1f6a2a', .5, 12, 14, 40]], specks: [['#58b96a', 90, 1, 2], ['#1f5a28', 70, 1, 2], ['#a8f0a0', 16], ['#ffd23c', 5]] }),
  water: (w, h) => tex('water' + w + h, w, h, { base: '#1b6fb0', tile: 1, blobs: [['#0f4f8a', .6, 12, 20, 50], ['#3f96d6', .5, 12, 16, 44]], specks: [['#6fb8ee', 40, 5, 1], ['#b8e6ff', 14, 3, 1]] }),
  road: (w, h) => tex('road' + w + h, w, h, { base: '#3a3a44', tile: 1, blobs: [['#2a2a33', .5, 10, 14, 40], ['#4a4a56', .4, 10, 14, 40]], specks: [['#59627a', 60], ['#22222a', 60]] }),
  dirt: (w, h) => tex('dirt' + w + h, w, h, { base: '#5a3a20', tile: 1, blobs: [['#7a5230', .55, 12, 14, 40], ['#3a2412', .5, 10, 14, 36]], specks: [['#8a623a', 60, 2, 1], ['#2a180a', 50, 2, 1]] }),
  stone: (w, h, c) => tex('stone' + w + h + (c || ''), w, h, { base: c || '#2a2f5a', tile: 1, blobs: [[lite(c || '#2a2f5a', .25), .5, 10, 14, 40], [dark(c || '#2a2f5a', .4), .5, 10, 14, 40]], specks: [[lite(c || '#2a2f5a', .35), 40], [dark(c || '#2a2f5a', .5), 40]] }),
  wood: (w, h) => tex('wood' + w + h, w, h, { base: '#b87a3a', tile: 1, blobs: [['#d89a5a', .5, 8, 20, 50], ['#8a5220', .4, 8, 20, 50]], draw: (g, W, H) => { for (let y = 0; y < H; y += 12) { box(g, 0, y, W, 1, '#7a4618'); for (let x = (y * 5) % 37; x < W; x += 37) box(g, x, y, 1, 12, '#7a4618'); } } }),
  panel: (w, h, c) => tex('panel' + w + h + (c || ''), w, h, { base: c || '#171428', tile: 1, blobs: [[lite(c || '#171428', .22), .8, 8, 30, 80], [dark(c || '#171428', .3), .5, 6, 30, 70]], draw: (g, W, H) => { g.fillStyle = 'rgba(255,255,255,.035)'; for (let y = 0; y < H; y += 16) g.fillRect(0, y, W, 1); for (let x = 0; x < W; x += 16) g.fillRect(x, 0, 1, H); } }),
  brick: (w, h, c) => tex('brick' + w + h + (c || ''), w, h, { base: c || '#3a304a', tile: 1, blobs: [[lite(c || '#3a304a', .2), .5, 10, 16, 44], [dark(c || '#3a304a', .45), .55, 10, 16, 44]], post: (g, W, H) => { for (let y = 0; y < H; y += 8) { box(g, 0, y, W, 1, dark(c || '#3a304a', .55)); box(g, 0, y + 1, W, 1, lite(c || '#3a304a', .12)); for (let x = ((y / 8) % 2) * 8; x < W; x += 16) box(g, x, y, 1, 8, dark(c || '#3a304a', .55)); } } }),
  sky: (w, h, cols) => tex('sky' + w + h + cols.join(''), w, h, { base: cols[0], grad: cols, L: 12 })
};
window.Art = { mkc, mix, lite, dark, rgba, lin, rad, poly, sym, part, mir, ell, box, rr, org, reg, pix, dith, spr, put, tex, scroll, block, ball, gem, guy, car, tank, boat, kart, bike, ship, rock, tree, cloud, coin, key, heart, fruit, star, star2, slime, bat, snail, frog, log, lily, bomb, fire, door, crate, spike, shur, paddle, disc, building, fx, gone, shadow, T, rnd, ri, TAU };
})();
