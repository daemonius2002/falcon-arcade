Arcade.game('memory-cards', { w: 180, h: 224,
help: 'Tap two cards to turn them over. If they show the same picture they stay open. Find all 10 pairs in as few moves as you can.',
init(A) {
  const FACE = []; for (let i = 0; i < 10; i++) FACE.push(A.shape(i % 6, i < 6 ? '#ffd23c' : '#3f6ad0', 24)); const BACK = A.shape(0, '#4a52a0', 18);
  const deck = []; for (let i = 0; i < 20; i++) deck.push(i >> 1); for (let i = 19; i > 0; i--) { const j = A.ri(0, i), q = deck[i]; deck[i] = deck[j]; deck[j] = q; }
  const found = new Array(20).fill(false); let open = [], moves = 0, pairs = 0, t = 0; A.info('MOVES 0');
  return {
    tap(x, y) { if (t > 0) return; const c = Math.floor((x - 2) / 44), r = Math.floor((y - 2) / 44); if (c < 0 || r < 0 || c > 3 || r > 4) return; const i = r * 4 + c; if (found[i] || open.includes(i)) return; open.push(i); A.beep(600, .04);
      if (open.length === 2) { moves++; A.info('MOVES ' + moves); if (deck[open[0]] === deck[open[1]]) { found[open[0]] = found[open[1]] = true; open = []; pairs++; A.add(100); A.beep(880, .12, 'triangle'); if (pairs === 10) { A.add(Math.max(0, 500 - moves * 10)); A.over(true); } } else t = .8; } },
    update(dt) { if (t > 0) { t -= dt; if (t <= 0) open = []; } },
    draw(g) { const K = Art, IC = [K.fruit(0), K.fruit(1), K.fruit(2), K.heart(), K.key(), K.coin(0), K.star2('#ffd23c', 14), K.frog(0), K.slime('#e8231e', 0), K.bat(0)];
      K.scroll(g, K.T.stone(64, 64, '#1f5a3a'), 0, 0, 180, 224); K.box(g, 0, 0, 180, 2, '#3f9a6a'); K.box(g, 0, 222, 180, 2, '#0f2a1c');
      for (let i = 0; i < 20; i++) { const x = 4 + (i % 4) * 44, y = 4 + Math.floor(i / 4) * 44, up = found[i] || open.includes(i); K.box(g, x + 2, y + 3, 40, 40, 'rgba(0,0,0,.35)');
        if (up) { g.drawImage(K.block(40, 40, '#f2efe6', 'r'), x, y); K.box(g, x + 4, y + 4, 32, 32, '#e2dccc'); K.put(g, IC[deck[i]], x + 20, y + 20, { sc: 2 }); if (found[i]) { K.box(g, x + 3, y + 34, 34, 3, '#3fd45a'); K.box(g, x + 3, y + 34, 34, 1, '#a8f0a0'); } }
        else { g.drawImage(K.block(40, 40, '#3a44a0', 'r'), x, y); K.box(g, x + 5, y + 5, 30, 30, '#2a3488'); K.put(g, K.star2('#7a88e0', 18), x + 20, y + 20); for (const [a, c] of [[6, 6], [32, 6], [6, 32], [32, 32]]) K.box(g, x + a, y + c, 2, 2, '#7a88e0'); } } }
  };
} });
