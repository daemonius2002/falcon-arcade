Arcade.game('number-slide', { w: 180, h: 180, pad: 'dpad',
help: 'Swipe or use the arrow keys to slide all tiles. Two tiles with the same number merge into one twice as big. Try to build 2048 — the game ends when nothing can move.',
init(A) {
  const COL = ['#3a4152', '#d6dbea', '#aab4c2', '#5fe3d6', '#3fa8e0', '#3f6ad0', '#b06ae0', '#e02a6a', '#e8231e', '#ff8a1e', '#ffd23c', '#3fd45a', '#ffffff'], DARK = [1, 2, 3, 10, 11, 12];
  const b = new Array(16).fill(0);
  const add = () => { const e = []; b.forEach((v, i) => { if (!v) e.push(i); }); if (e.length) b[e[A.ri(0, e.length - 1)]] = Math.random() < .9 ? 2 : 4; };
  const line = (i, d) => [0, 1, 2, 3].map(k => d === 'left' ? i * 4 + k : d === 'right' ? i * 4 + 3 - k : d === 'up' ? k * 4 + i : (3 - k) * 4 + i);
  const canMove = () => b.some((v, i) => !v || (i % 4 < 3 && v === b[i + 1]) || (i < 12 && v === b[i + 4]));
  function move(d) { let ch = false; for (let i = 0; i < 4; i++) { const ix = line(i, d), v = ix.map(j => b[j]).filter(x => x), o = [];
      for (let k = 0; k < v.length; k++) { if (v[k] === v[k + 1]) { o.push(v[k] * 2); A.add(v[k] * 2); k++; } else o.push(v[k]); }
      ix.forEach((j, k) => { const n = o[k] || 0; if (b[j] !== n) ch = true; b[j] = n; }); }
    if (ch) { add(); A.beep(500, .04); A.info('BIGGEST ' + Math.max(...b)); if (!canMove()) A.over(Math.max(...b) >= 2048); } }
  add(); add(); A.info('BIGGEST ' + Math.max(...b));
  return {
    key(k) { if (k !== 'a') move(k); }, update() {},
    draw(g) { const K = Art; K.scroll(g, K.T.panel(64, 64, '#2a2458'), 0, 0, 180, 180); K.box(g, 0, 0, 180, 2, '#59627a'); K.box(g, 0, 178, 180, 2, '#0e0c18');
      b.forEach((v, i) => { const x = 4 + (i % 4) * 44, y = 4 + Math.floor(i / 4) * 44, n = v ? Math.min(12, Math.log2(v)) : 0; K.box(g, x, y, 40, 40, 'rgba(0,0,0,.34)'); K.box(g, x, y + 39, 40, 1, 'rgba(255,255,255,.08)'); if (!v) return;
        K.box(g, x + 2, y + 3, 40, 40, 'rgba(0,0,0,.3)'); g.drawImage(K.block(40, 40, COL[n], 'r'), x, y); const s = String(v), sc = s.length < 3 ? 3 : s.length < 5 ? 2 : 1, dk = DARK.includes(n); A.text(g, s, x + 21, y + 21 - sc * 2.5, dk ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.45)', sc, 'center'); A.text(g, s, x + 20, y + 20 - sc * 2.5, dk ? '#12141c' : '#ffffff', sc, 'center'); }); }
  };
} });
