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
    draw(g) { g.fillStyle = '#12141c'; g.fillRect(0, 0, 180, 224);
      for (let i = 0; i < 20; i++) { const x = 4 + (i % 4) * 44, y = 4 + Math.floor(i / 4) * 44, up = found[i] || open.includes(i); g.fillStyle = '#000'; g.fillRect(x - 1, y - 1, 42, 42);
        g.fillStyle = up ? '#f2efe6' : '#2a2f6a'; g.fillRect(x, y, 40, 40); g.fillStyle = up ? '#ffffff' : '#4a52a0'; g.fillRect(x, y, 40, 2); g.fillRect(x, y, 2, 40); g.fillStyle = up ? '#b9bfd0' : '#161a40'; g.fillRect(x, y + 38, 40, 2); g.fillRect(x + 38, y, 2, 40);
        if (up) { g.drawImage(FACE[deck[i]], x + 8, y + 8); if (found[i]) { g.fillStyle = '#3fd45a'; g.fillRect(x + 2, y + 34, 36, 3); } } else g.drawImage(BACK, x + 11, y + 11); } }
  };
} });
