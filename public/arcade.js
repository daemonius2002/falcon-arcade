/* Falcon Arcade — platform shell + tiny pixel game engine */
(function () {
'use strict';
const VER = 'v0.2';
const $ = id => document.getElementById(id);
const IC = {
  shooters: 'M5 1h2v3h1v2h2v2h1v2H8v1H4v-1H1V8h1V6h2V4h1z',
  platformers: 'M3 1h1v1h5v4H4v5H3z M1 10h10v1H1z',
  puzzle: 'M1 1h4v4H1z M6 1h4v4H6z M6 6h4v4H6z M1 6h4v4H1z M2 7h2v2H2z',
  racing: 'M2 1h1v10H2z M3 1h2v2H3z M7 1h2v2H7z M5 3h2v2H5z M9 3h1v2H9z M3 5h2v2H3z M7 5h2v2H7z',
  sports: 'M4 1h4v1h2v2h1v4h-1v2H8v1H4v-1H2V8H1V4h1V2h2z M5 5h2v2H5z',
  classics: 'M5 1h2v1h1v2H7v4h3v1h1v2H1V9h1V8h3V4H4V2h1z'
};
const CATS = [
  { id: 'shooters', name: 'Shooters', blurb: 'Dodge, aim and blast', bg: '#2a1430', fg: '#ff9a2a', games: [
    ['star-falcon', 'Star Falcon', 'Vertical space shooter, 8 stages'], ['asteroid-storm', 'Asteroid Storm', 'Spin, thrust and blast the rocks'], ['tank-patrol', 'Tank Patrol', 'Top-down tank battles'], ['sky-defender', 'Sky Defender', 'Guard the base from enemy waves'], ['bubble-blaster', 'Bubble Blaster', 'Aim and pop colour bubbles']] },
  { id: 'platformers', name: 'Platformers', blurb: 'Run, jump and explore', bg: '#12382a', fg: '#7fe08a', games: [
    ['jungle-run', 'Jungle Run', 'Run, jump and collect fruit'], ['castle-climb', 'Castle Climb', 'Climb the tower, dodge the traps'], ['robo-jump', 'Robo Jump', 'Endless jumper, ever higher'], ['cave-explorer', 'Cave Explorer', 'Find keys and open doors'], ['ninja-dash', 'Ninja Dash', 'Fast one-button runner']] },
  { id: 'puzzle', name: 'Puzzle', blurb: 'Think first, then move', bg: '#2a1f5a', fg: '#c8a8ff', games: [
    ['block-drop', 'Block Drop', 'Falling blocks, clear the lines'], ['gem-match', 'Gem Match', 'Swap and match three'], ['number-slide', 'Number Slide', 'Merge tiles up to 2048'], ['pipe-flow', 'Pipe Flow', 'Rotate pipes, connect the water'], ['memory-cards', 'Memory Cards', 'Find the matching pairs']] },
  { id: 'racing', name: 'Racing', blurb: 'Fast reflexes win', bg: '#4a2410', fg: '#ffd23c', games: [
    ['turbo-road', 'Turbo Road', 'Highway dodging, top-down'], ['moto-hills', 'Moto Hills', 'Balance over bumpy hills'], ['boat-rush', 'Boat Rush', 'River racing with boosts'], ['kart-cup', 'Kart Cup', 'Circuit races against the computer'], ['space-slalom', 'Space Slalom', 'Fly through the gates']] },
  { id: 'sports', name: 'Sports', blurb: 'Quick matches, 1 or 2 players', bg: '#0f3a5a', fg: '#8fd3ff', games: [
    ['penalty-kick', 'Penalty Kick', 'Beat the goalkeeper'], ['hoop-shot', 'Hoop Shot', 'Basketball free throws'], ['mini-golf', 'Mini Golf', '9 holes with obstacles'], ['table-tennis', 'Table Tennis', 'First to 11 points'], ['air-hockey', 'Air Hockey', 'Two players on one screen']] },
  { id: 'classics', name: 'Classics', blurb: 'The games parents grew up with', bg: '#3a1420', fg: '#ff8a9a', games: [
    ['snake-trail', 'Snake Trail', 'Eat, grow, do not bite your tail'], ['brick-breaker', 'Brick Breaker', 'Paddle, ball and a wall of bricks'], ['maze-chase', 'Maze Chase', 'Collect the dots, avoid the slimes'], ['frog-crossing', 'Frog Crossing', 'Cross the road and the river'], ['paddle-duel', 'Paddle Duel', 'Two-player paddle match']] }
];
const GAMES = {}, DEFS = {};
CATS.forEach(c => { c.games = c.games.map(g => (GAMES[g[0]] = { id: g[0], name: g[1], desc: g[2], cat: c })); });
const isReady = id => id === 'star-falcon' || !!DEFS[id];
const icon = (c, s) => `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 12 12" shape-rendering="crispEdges"><path d="${IC[c.id]}" fill="${c.fg}"/></svg>`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- storage (this browser only) ---------- */
const db = { name: 'Player 1', fav: {}, scores: {}, mute: 0 };
try { Object.assign(db, JSON.parse(localStorage.getItem('falcon-arcade')) || {}); } catch (e) {}
const save = () => { try { localStorage.setItem('falcon-arcade', JSON.stringify(db)); } catch (e) {} };

/* ---------- sound ---------- */
let ac = null;
function audio() { if (ac || db.mute) return; try { const C = window.AudioContext || window.webkitAudioContext; if (C) ac = new C(); } catch (e) { ac = null; } }
function beep(f, d, type, v) { if (!ac || db.mute) return; try { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime; o.type = type || 'square'; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(v || .04, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d); } catch (e) {} }

/* ---------- pixel helpers shared by the games ---------- */
function mkc(w, h) { const k = document.createElement('canvas'); k.width = w; k.height = h; return k; }
const hx = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const mix = (a, b, t) => { const A = hx(a), B = hx(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; };
const FONT = { '0': '75557', '1': '26227', '2': '71747', '3': '71717', '4': '55711', '5': '74717', '6': '74757', '7': '71111', '8': '75757', '9': '75717',
  A: '25755', B: '65656', C: '74447', D: '65556', E: '74647', F: '74644', G: '74557', H: '55755', I: '72227', J: '11157', K: '55655', L: '44447', M: '57755', N: '65555', O: '75557', P: '75744', Q: '75571', R: '75655', S: '74717', T: '72222', U: '55557', V: '55552', W: '55775', X: '55255', Y: '55222', Z: '71247', '-': '00700', '!': '22202', ':': '02020', '+': '02720' };
function text(g, s, x, y, col, sc, al) { s = String(s).toUpperCase(); sc = sc || 1; const w = s.length * 4 * sc - sc; if (al === 'center') x -= w / 2; else if (al === 'right') x -= w; x = Math.round(x); y = Math.round(y); g.fillStyle = col;
  for (const ch of s) { const f = FONT[ch]; if (f) for (let r = 0; r < 5; r++) { const b = +f[r]; for (let c = 0; c < 3; c++) if (b & (4 >> c)) g.fillRect(x + c * sc, y + r * sc, sc, sc); } x += 4 * sc; } }
function spr(rows, pal) { const k = mkc(rows[0].length, rows.length), g = k.getContext('2d'); rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = pal[r[x]]; if (c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); } } }); return k; }
const SHC = {};
function shape(t, col, n) { const key = t + col + n; if (SHC[key]) return SHC[key]; const k = mkc(n, n), g = k.getContext('2d'), r = n / 2 - 1, m = (n - 1) / 2;
  const ins = (x, y) => { const dx = x - m, dy = y - m, ax = Math.abs(dx), ay = Math.abs(dy); if (ax > r || ay > r) return false;
    return t === 0 ? ax + ay <= r : t === 1 ? ax <= r * .82 && ay <= r * .82 : t === 2 ? dx * dx + dy * dy <= r * r : t === 3 ? dy <= r * .8 && ax <= (dy + r) * .62 : t === 4 ? (ax <= r * .36) || (ay <= r * .36) : ay <= r * .86 && ax + ay * .55 <= r * 1.02; };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { if (!ins(x, y)) continue; const dx = x - m, dy = y - m, edge = !ins(x - 1, y) || !ins(x + 1, y) || !ins(x, y - 1) || !ins(x, y + 1);
    g.fillStyle = edge ? mix(col, '#000000', .62) : dx + dy < -r * .45 ? mix(col, '#ffffff', .5) : dx + dy > r * .55 ? mix(col, '#000000', .3) : col; g.fillRect(x, y, 1, 1); }
  return (SHC[key] = k); }

/* ---------- views ---------- */
let view, cur = '', killers = [], raf = 0;
function on(t, ev, fn, o) { t.addEventListener(ev, fn, o); killers.push(() => t.removeEventListener(ev, fn, o)); }
function stop() { cancelAnimationFrame(raf); killers.forEach(f => f()); killers = []; }
function card(g) { const ok = isReady(g.id), c = g.cat, href = g.id === 'star-falcon' ? 'games/star-falcon/index.html' : '#' + g.id;
  const th = ok ? `<img class="th" alt="" loading="lazy" src="thumbs/${g.id}.png">` : `<div class="th ph" style="background:${c.bg}">${icon(c, 72)}</div>`;
  const body = `${th}<b>${g.name}</b><span>${g.desc}</span><i class="bd${ok ? ' ok' : ''}">${ok ? 'PLAY' : 'COMING SOON'}</i>`, s = esc((g.name + ' ' + g.desc + ' ' + c.name).toLowerCase());
  return ok ? `<a class="card" href="${href}" data-s="${s}">${body}</a>` : `<div class="card off" data-s="${s}">${body}</div>`; }
function home() { stop(); cur = 'home'; document.body.classList.remove('ingame'); const favs = Object.keys(db.fav).filter(id => db.fav[id] && GAMES[id]), n = Object.keys(GAMES).filter(isReady).length;
  view.innerHTML = `<section class="hero" id="hero"><div class="hl"><span class="tag">FEATURED</span><h1>STAR FALCON</h1>
    <p>Fly the white-and-orange fighter through 8 pixel worlds, buy upgrades in the hangar and beat a boss at the end of every stage.</p>
    <div class="facts"><span>8 stages</span><span>6 upgrades</span><span>Easy · Normal · Hard</span><span>Phone + PC</span></div>
    <a class="big" href="games/star-falcon/index.html">PLAY NOW</a></div>
    <div class="hr"><img alt="Star Falcon, Earth Orbit stage" src="thumbs/sf-orbit.png"><img alt="Star Falcon, Blue Archipelago stage" src="thumbs/star-falcon.png"><img alt="Star Falcon, Lava World stage" src="thumbs/sf-lava.png"></div></section>`
    + (favs.length ? `<section class="cat" id="favourites"><div class="ch"><h2>FAVOURITES</h2><span>Your picks on this device</span></div><div class="grid">${favs.map(id => card(GAMES[id])).join('')}</div></section>` : '')
    + CATS.map(c => `<section class="cat" id="${c.id}"><div class="ch"><span class="ci" style="background:${c.bg}">${icon(c, 40)}</span><h2>${c.name.toUpperCase()}</h2><span>${c.blurb}</span></div><div class="grid">${c.games.map(card).join('')}</div></section>`).join('')
    + `<p class="empty" id="empty" hidden>No game matches your search.</p>`;
  $('foot').textContent = `Falcon Arcade ${VER} · ${n} of ${Object.keys(GAMES).length} games playable · scores and favourites are saved in this browser`; filter(); }
function filter() { if (cur !== 'home') return; const q = $('q').value.trim().toLowerCase(); let any = false;
  view.querySelectorAll('.cat').forEach(s => { let n = 0; s.querySelectorAll('.card').forEach(c => { const m = !q || c.dataset.s.includes(q); c.hidden = !m; if (m) n++; }); s.hidden = !n; if (n) any = true; });
  $('hero').hidden = !!q; $('empty').hidden = any; }
function scoresHtml(id) { const l = db.scores[id] || []; return l.length ? `<table><thead><tr><th>#</th><th>Player</th><th class="r">Score</th></tr></thead><tbody>${l.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.n)}</td><td class="r">${s.s}</td></tr>`).join('')}</tbody></table>` : '<p class="sm">No scores yet. Be the first!</p>'; }
function gameView(id) { stop(); cur = 'game'; document.body.classList.add('ingame'); const def = DEFS[id], G = GAMES[id], c = G.cat;
  view.innerHTML = `<div class="gv"><section class="stage" id="stage"><div class="stin" style="--r:${(def.w / def.h).toFixed(4)}">
      <div class="gbar"><span>SCORE <b id="gS">0</b></span><span id="gI"></span><span>BEST <b id="gB">0</b></span></div>
      <div class="bezel"><canvas id="gc"></canvas><div id="gO" class="gov"></div></div>
      <div class="pad" id="pad" hidden></div>
      <div class="btns"><button id="bRe" type="button">Restart</button><button id="bSn" type="button"></button><button id="bFs" type="button">Full screen</button><button id="bFv" type="button"></button></div>
    </div></section>
    <div class="side"><a class="chip" href="#${c.id}" style="background:${c.fg}">${c.name.toUpperCase()}</a><h1>${G.name.toUpperCase()}</h1><p class="lead">${G.desc}.</p>
      <section class="box"><h2 class="cy">HOW TO PLAY</h2><p>${def.help}</p></section>
      <section class="box"><h2 class="go">HIGH SCORES</h2><p class="sm">Saved in this browser.</p><div id="gT">${scoresHtml(id)}</div></section>
      <section><h2>MORE ${c.name.toUpperCase()}</h2><div class="grid">${c.games.filter(g => g.id !== id).map(card).join('')}</div></section>
    </div></div>`;
  $('foot').textContent = `Falcon Arcade ${VER}`; scrollTo(0, 0); run(id, def); }

/* ---------- engine ---------- */
function run(id, def) { const cv = $('gc'), g = cv.getContext('2d'), W = def.w, H = def.h, ov = $('gO'); cv.width = W; cv.height = H; cv.style.aspectRatio = W + '/' + H; g.imageSmoothingEnabled = false;
  let inst = null, st = 'ready', last = 0, paused = false, overAt = 0;
  const best = () => ((db.scores[id] || [])[0] || { s: 0 }).s;
  const A = { w: W, h: H, keys: {}, raw: {}, ptr: { x: W / 2, y: H / 2, down: false, moved: false }, ptrs: [], score: 0,
    rnd: (a, b) => a + Math.random() * (b - a), ri: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    add(n) { A.score += n; $('gS').textContent = A.score; }, info(s) { $('gI').textContent = s; }, beep, text, spr, shape, mix,
    over(win) { if (st !== 'play') return; st = 'over'; overAt = performance.now(); const nb = A.score > best();
      if (A.score > 0) { db.scores[id] = (db.scores[id] || []).concat({ n: db.name, s: A.score }).sort((a, b) => b.s - a.s).slice(0, 5); save(); $('gT').innerHTML = scoresHtml(id); $('gB').textContent = best(); }
      beep(win ? 880 : 180, .4, win ? 'triangle' : 'sawtooth', .06); panel(win ? 'YOU WIN!' : 'GAME OVER', `Score ${A.score}` + (nb && A.score > 0 ? ' — new best!' : ''), 'PLAY AGAIN'); } };
  function panel(t, p, b) { ov.innerHTML = `<h2>${t}</h2><p>${p}</p><button class="big" id="gGo" type="button">${b}</button>`; ov.hidden = false; }
  function begin() { audio(); A.score = 0; $('gS').textContent = 0; $('gI').textContent = ''; A.keys = {}; A.raw = {}; paused = false; inst = def.init(A); st = 'play'; ov.hidden = true; }
  $('gB').textContent = best(); inst = def.init(A); panel(GAMES[id].name.toUpperCase(), 'Tap START or press Space.', 'START');
  on(ov, 'click', e => { if (e.target.closest('#gGo')) begin(); });
  const KM = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', ' ': 'a', Enter: 'a' }; if (!def.arrowsOnly) Object.assign(KM, { a: 'left', d: 'right', w: 'up', s: 'down' });
  on(window, 'keydown', e => { if (e.target.tagName === 'INPUT' || e.ctrlKey || e.metaKey) return; const r = e.key.length === 1 ? e.key.toLowerCase() : e.key, k = KM[r]; A.raw[r] = true;
    if (k) { e.preventDefault(); if (st !== 'play') { if (k === 'a' && !e.repeat && performance.now() - overAt > 700) begin(); return; } if (!e.repeat) { A.keys[k] = true; if (inst.key) inst.key(k); } }
    else if (r === 'p' && st === 'play') { paused = !paused; if (paused) panel('PAUSED', 'Press P to continue.', 'RESTART'); else ov.hidden = true; } });
  on(window, 'keyup', e => { const r = e.key.length === 1 ? e.key.toLowerCase() : e.key; A.raw[r] = false; if (KM[r]) A.keys[KM[r]] = false; });
  const P = new Map(), pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }, sync = () => { A.ptrs = [...P.values()]; };
  const dirOf = (dx, dy) => Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  on(cv, 'pointerdown', e => { e.preventDefault(); const p = pos(e); P.set(e.pointerId, { x: p.x, y: p.y, x0: p.x, y0: p.y, sw: false }); Object.assign(A.ptr, p, { down: true, moved: true }); sync(); try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
  on(cv, 'pointermove', e => { const p = pos(e), q = P.get(e.pointerId); Object.assign(A.ptr, p, { moved: true }); if (!q) return; q.x = p.x; q.y = p.y; sync();
    const dx = q.x - q.x0, dy = q.y - q.y0; if (st === 'play' && !paused && Math.hypot(dx, dy) > W * .07) { const d = dirOf(dx, dy); if (inst.swipe) { if (!q.sw) inst.swipe(d, q.x0, q.y0); } else if (inst.key) { inst.key(d); q.x0 = q.x; q.y0 = q.y; } q.sw = true; } });
  const up = e => { const q = P.get(e.pointerId); if (!q) return; P.delete(e.pointerId); sync(); A.ptr.down = P.size > 0; if (st === 'play' && !paused && !q.sw && e.type === 'pointerup' && inst.tap) inst.tap(q.x, q.y); };
  on(cv, 'pointerup', up); on(cv, 'pointercancel', up);
  const pad = $('pad');
  if (def.pad && window.matchMedia && matchMedia('(pointer:coarse)').matches) { const B = (k, l, c) => `<button type="button" data-k="${k}" aria-label="${k}" class="${c || ''}">${l}</button>`;
    pad.innerHTML = (def.pad === 'lr' ? B('left', '◄', 'wide') + B('right', '►', 'wide') : `<div class="dp">${B('up', '▲', 'u')}${B('left', '◄', 'l')}${B('down', '▼', 'd')}${B('right', '►', 'rt')}</div>`) + (def.a ? B('a', def.a, 'ab') : ''); pad.hidden = false;
    on(pad, 'pointerdown', e => { const b = e.target.closest('button'); if (!b) return; e.preventDefault(); if (st !== 'play' || paused) return; const k = b.dataset.k; A.keys[k] = true; if (inst.key) inst.key(k); });
    const rel = e => { const b = e.target.closest('button'); if (b) A.keys[b.dataset.k] = false; }; on(pad, 'pointerup', rel); on(pad, 'pointercancel', rel); on(pad, 'pointerout', rel); }
  const snd = () => { $('bSn').textContent = db.mute ? 'Sound off' : 'Sound on'; }, fav = () => { $('bFv').textContent = db.fav[id] ? '★ Favourite' : '☆ Favourite'; $('bFv').classList.toggle('on', !!db.fav[id]); }; snd(); fav();
  on($('bRe'), 'click', begin); on($('bSn'), 'click', () => { db.mute = db.mute ? 0 : 1; save(); snd(); audio(); }); on($('bFv'), 'click', () => { db.fav[id] = !db.fav[id]; save(); fav(); });
  on($('bFs'), 'click', () => { try { if (document.fullscreenElement) document.exitFullscreen(); else { const p = $('stage').requestFullscreen(); if (p && p.catch) p.catch(() => {}); } } catch (e) {} });
  on(document, 'visibilitychange', () => { if (document.hidden && st === 'play' && !paused) { paused = true; panel('PAUSED', 'Press P to continue.', 'RESTART'); } });
  function loop(ts) { const dt = Math.min(.033, (ts - last) / 1000 || 0); last = ts; if (st === 'play' && !paused) inst.update(dt); inst.draw(g); A.ptr.moved = false; raf = requestAnimationFrame(loop); }
  raf = requestAnimationFrame(loop); }

/* ---------- router ---------- */
function route() { const h = location.hash.slice(1); if (DEFS[h]) return gameView(h); if (cur !== 'home') home(); const el = h && $(h); if (el && !el.hidden) el.scrollIntoView(); else scrollTo(0, 0); }
window.Arcade = { game(id, def) { DEFS[id] = def; },
  boot() { view = $('view'); $('nav').innerHTML = CATS.map(c => `<a href="#${c.id}">${c.name}</a>`).join('');
    const pb = $('pb'), dlg = $('dlg'), nm = $('nm'); pb.textContent = db.name;
    pb.addEventListener('click', () => { nm.value = db.name; if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); nm.select(); });
    $('nf').addEventListener('submit', e => { e.preventDefault(); db.name = nm.value.trim().slice(0, 14) || 'Player 1'; save(); pb.textContent = db.name; if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); });
    $('q').addEventListener('input', () => { if (cur !== 'home') { location.hash = ''; home(); } filter(); });
    addEventListener('hashchange', route); route(); } };
})();
