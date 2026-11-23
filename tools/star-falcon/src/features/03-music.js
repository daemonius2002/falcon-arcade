/* 03-music: original generated chiptunes (8 stage themes, boss, menu, hangar), jingles, Music/Effects volume.
   Wraps draw (lookahead scheduler + edge-detected state polling), startLevel/levelDone/gameOver (jingles),
   beep/boom (effects volume), explode (music duck). Exposes FX.music={play,stop,layer,key,beat}.
   Stores nothing itself; registers 'music' and 'sfx' with FX.settings when present. */
const SC = { maj: [0, 2, 4, 5, 7, 9, 11], dor: [0, 2, 3, 5, 7, 9, 10], min: [0, 2, 3, 5, 7, 8, 10], pen: [0, 2, 4, 7, 9] };
/* prog: chord degrees (one per bar). lead: chord-relative degrees ('0'..'b', '-' hold, '.' rest), [A,B], form AABA.
   bass: 'x' chord root, 'o' octave, '1'-'8' scale steps above the chord root. drum: k kick, s snare, h hat, x kick+hat. */
const SONGS = {
  s0: { bpm: 132, root: 60, sc: 'maj', prog: [0, 4, 5, 3], bass: 'x...x.x.x...x.o.', drum: 'k.h.s.h.k.h.s.hh', lead: ['7.4.7.9-8.7.4...', '4-5-7.4.2-4-0...'] },
  s1: { bpm: 138, root: 62, sc: 'dor', prog: [0, 3, 0, 6], bass: '..x...x...x.x.x.', drum: 'k.h.s.hkk.h.s.h.', lead: ['0.2.4.2.0-..4.5.', '7-6-4.2.4-2-0...'] },
  s2: { bpm: 120, root: 57, sc: 'pen', prog: [0, 3, 2, 1], bass: 'x.......x...o...', drum: 'k...h...s...h...', lead: ['4---3.2.0---2...', '5-4-3-2-3---0...'], echo: 3 },
  s3: { bpm: 126, root: 65, sc: 'maj', prog: [0, 3, 4, 0, 5, 3, 1, 4], bass: 'x..x..x.x..x..o.', drum: 'k..hs.h.k.hhs.h.', lead: ['4.2.0.2.4-4-4...', '5.4.2.4.7---4...'], swing: .33, arp: 1 },
  s4: { bpm: 128, root: 64, sc: 'dor', prog: [0, 3, 0, 6], bass: 'x.x..x.ox.x..x.o', drum: 'k.hsk.h.k.hsk.hs', lead: ['0.2.4.5.4.2.0...', '7.5.4.2.4-5-7...'] },
  s5: { bpm: 144, root: 62, sc: 'min', prog: [0, 5, 6, 0], bass: 'x.x.o.x.x.x.o.x.', drum: 'k.h.s.h.k.k.s.h.', lead: ['4.4.4.2.4-7.6.4.', '7-6-4-2-4-2-1-0-'] },
  s6: { bpm: 112, root: 59, sc: 'min', prog: [0, 5, 2, 6], bass: 'x.......x.......', drum: 'k.......s.......', lead: ['4-------2---0---', '7---6---4-------'], arp: 2 },
  s7: { bpm: 150, root: 60, sc: 'min', prog: [0, 5, 6, 4], bass: 'x...o...x...o.5.', drum: 'k..sk.s.k..sk.ss', lead: ['0.0.0-2.4---2...', '4.4.4-5.7---4.2.'] },
  boss: { bpm: 160, root: 64, sc: 'min', prog: [0, 0, 5, 6], bass: 'xoxxoxxoxoxxoxx5', drum: 'k.h.s.hkk.hks.hh', lead: ['7.7.6.7.4---2.4.', '9-7-6-4-6-4-2-1-'] },
  menu: { bpm: 96, root: 60, sc: 'pen', prog: [0, 3, 2, 1], bass: 'x.......o.......', drum: '....h.......h...', lead: ['2---3-2-0-------', '3---4-3-2---0---'], arp: 2, vol: .55 },
  shop: { bpm: 108, root: 60, sc: 'maj', prog: [0, 5, 3, 4], bass: '1.3.5.6.8.6.5.3.', drum: 'k.h.s.h.k.h.s.h.', lead: ['4.2.4.5.7-5-4...', '2.4.5.4.2-1-0...'], vol: .8 }
};
const VOLM = { 0: 0, 1: .06, 2: .12, 3: .18 }, SFXK = { 0: 0, 1: .4, 2: .7, 3: 1 };
const OPTS = [['0', 'Off'], ['1', 'Low'], ['2', 'Mid'], ['3', 'High']];
if (FX.settings && FX.settings.register) {
  FX.settings.register({ k: 'music', n: 'Music', opts: OPTS, def: '2' });
  FX.settings.register({ k: 'sfx', n: 'Effects', opts: OPTS.map(o => o.slice()), def: '3' });
}
const setv = (k, d) => { try { const v = FX.settings && FX.settings.get ? FX.settings.get(k, d) : d; return v == null ? d : String(v); } catch (e) { return d; } };
const mvol = () => save.mute ? 0 : (VOLM[setv('music', '2')] ?? .12);
const sfxk = () => SFXK[setv('sfx', '3')] ?? 1;
const mf = m => 440 * Math.pow(2, (m - 69) / 12);
const dm = (sc, d) => { const n = sc.length; return sc[((d % n) + n) % n] + 12 * Math.floor(d / n); };

/* ---------- audio graph (built lazily once ac exists) ---------- */
let built = false, lpf, pg, dg, vg, jg, PW, sg = null;
let song = null, curId = null, tr = 0, sd = .1, stepN = 0, next = 0, gap = 1, lay = 1, chord = 0, jEnd = 0, lastDuck = -9;
let tV = -1, tP = -1, prevWant = null, warned = 0;
function build() {
  if (built || !ac) return built;
  try {
    lpf = ac.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 18000; lpf.Q.value = .7;
    pg = ac.createGain(); dg = ac.createGain(); vg = ac.createGain(); jg = ac.createGain();
    vg.gain.value = tV = mvol();
    lpf.connect(pg); pg.connect(dg); dg.connect(vg); vg.connect((FX.bus && FX.bus.mus) || ac.destination); jg.connect(lpf);
    const N = 24, re = new Float32Array(N), im = new Float32Array(N); // thin 12.5% pulse
    for (let n = 1; n < N; n++) re[n] = 2 / (n * Math.PI) * Math.sin(2 * Math.PI * n * .125);
    PW = ac.createPeriodicWave(re, im);
    built = true;
  } catch (e) { built = false; }
  return built;
}
function tone(f, t, d, w, v, dst) {
  const o = ac.createOscillator(), g = ac.createGain();
  if (w === 'p') o.setPeriodicWave(PW); else o.type = w;
  o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .005); g.gain.exponentialRampToValueAtTime(.001, t + Math.max(.02, d * .9));
  o.connect(g); g.connect(dst); o.start(t); o.stop(t + d); return o;
}
function noise(t, d, type, fq, v, dst) {
  if (!noiseBuf) return;
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = noiseBuf; f.type = type; f.frequency.value = fq;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
  s.connect(f); f.connect(g); g.connect(dst); s.start(t, R() * .1, d + .01);
}
function kick(t, dst) {
  const o = tone(150, t, .1, 'triangle', .9, dst); o.frequency.exponentialRampToValueAtTime(50, t + .1);
}

/* ---------- sequencer ---------- */
const secOf = bar => 'AABA'[(bar >> 2) & 3];
function chordAt(bar) { const p = song.prog, L = p.length; return secOf(bar) === 'B' ? p[(bar + (L >> 1)) % L] : p[bar % L]; }
function leadCh(bar, i) { if (secOf(bar) === 'A' && (bar & 3) === 3 && i >= 8) return i === 8 ? '0' : i < 14 ? '-' : '.'; return song.lead[secOf(bar) === 'A' ? 0 : 1][i] || '.'; }
function playStep(s, t) {
  const S = song, sc = SC[S.sc], n = sc.length, st = s & 15, bar = (s >> 4) & 15, ch = chordAt(bar), out = sg;
  chord = ch; if (st & 1 && S.swing) t += S.swing * sd;
  const dc = S.drum[st] || '.';
  if (dc === 'k' || dc === 'x') kick(t, out);
  if (dc === 's') noise(t, .08, 'bandpass', 1500, .55, out);
  if (dc === 'h' || dc === 'x' || (lay > 1 && dc === '.')) noise(t, .03, 'highpass', 6000, .35, out);
  const bc = S.bass[st] || '.';
  if (bc !== '.') { const off = bc === 'x' || bc === 'o' ? 0 : (+bc - 1) || 0; tone(mf(S.root - 12 + dm(sc, ch + off) + (bc === 'o' ? 12 : 0) + tr), t, sd * (S.bpm >= 150 ? 1 : 1.6), 'triangle', .75, out); }
  const lc = leadCh(bar, st);
  if (lc !== '.' && lc !== '-') {
    let a = ch + parseInt(lc, 16); while (a > n + 4) a -= n;
    let h = 1; while (st + h < 16 && leadCh(bar, st + h) === '-') h++;
    const m = S.root + dm(sc, a) + tr;
    tone(mf(m), t, sd * h, 'square', .32, out);
    if (S.echo) tone(mf(m + 12), t + S.echo * sd, sd, 'square', .08, out);
  }
  const ar = S.arp || (lay > 1 ? 1 : 0);
  if (ar && st % ar === 0) {
    const sh = n === 5 ? [0, 2, 3, n] : [0, 2, 4, n], k = (st / ar) % 4;
    tone(mf(S.root + 12 + dm(sc, ch + sh[k]) + tr), t, sd * ar, 'p', .22, out);
  }
}
function schedule() {
  if (!song || !built) return;
  const now = ac.currentTime;
  if (!sg) { sg = ac.createGain(); sg.gain.value = song.vol || 1; sg.connect(lpf); gap = 1; }
  if (ac.state !== 'running' || tV <= 0) { gap = 1; return; }
  if (gap || next < now) { next = now + .05; gap = 0; }
  for (let k = 0; k < 8 && next < now + .12; k++) { playStep(stepN, next); next += sd; stepN++; }
}
function fadeOut(g, f) {
  if (!g || !ac) return;
  try { g.gain.cancelScheduledValues(ac.currentTime); g.gain.setTargetAtTime(0, ac.currentTime, Math.max(.01, f / 3)); } catch (e) {}
  setTimeout(() => { try { g.disconnect(); } catch (e) {} }, f * 1000 + 400);
}
function play(id) {
  const S = SONGS[id]; if (!S) return;
  if (curId === id && song) return;
  if (sg) fadeOut(sg, .12); sg = null;
  const fin = id === 'boss' && li === LV.length - 1;
  song = S; curId = id; tr = fin ? 2 : 0; sd = 60 / (S.bpm + (fin ? 8 : 0)) / 4; stepN = 0; gap = 1; lay = 1;
  build(); schedule();
}
function stop(f) { if (sg) fadeOut(sg, f == null ? .3 : +f || .02); sg = null; song = null; curId = null; }

/* ---------- jingles (one-shot batches on their own gain, not cut by stop()) ---------- */
let jPr = 0;
function jingle(len, fn, pr) { // pr 2 (results) may cut a running pr 1 batch (ready blips, siren); equal or lower is ignored
  if (!ac || !build() || tV <= 0 || ac.state !== 'running') return;
  pr = pr || 1;
  if (ac.currentTime < jEnd) { if (pr <= jPr) return; fadeOut(jg, .04); jg = ac.createGain(); jg.connect(lpf); }
  jEnd = ac.currentTime + len; jPr = pr; try { fn(ac.currentTime + .03); } catch (e) {}
}
const seq = (t, notes, step, w, v) => { let q = t; for (const [m, l] of notes) { if (m) tone(mf(m), q, step * l, w, v, jg); q += step * l; } return q; };
function siren() { jingle(1.15, t => { for (let i = 0; i < 5; i++) tone(i % 2 ? 523 : 392, t + i * .22, .22, 'square', .42, jg); }); }
function fanfare() {
  jingle(2.3, t => {
    const q = seq(t, [[72, 1], [76, 1], [79, 1], [84, 1]], .1, 'square', .4);
    for (const m of [72, 76, 79]) tone(mf(m), q, 1.8, 'square', .2, jg);
    tone(mf(84), q, 1.8, 'p', .25, jg); tone(mf(48), q, 1.8, 'triangle', .8, jg);
  }, 2);
}
function winTune() {
  jingle(5.2, t => {
    const s = .2;
    seq(t, [[67, 1], [72, 1], [76, 1], [79, 1], [76, 1], [79, 1], [84, 2], [81, 1], [79, 1], [76, 1], [72, 1], [74, 1], [76, 1], [79, 2],
      [77, 1], [76, 1], [74, 1], [72, 1], [74, 2], [67, 2], [72, 1], [76, 1], [79, 1], [84, 5]], s, 'square', .36);
    seq(t, [[48, 4], [53, 4], [55, 4], [48, 4], [53, 4], [55, 4], [48, 2], [55, 2], [48, 5]], s, 'triangle', .8);
    for (let i = 0; i < 24; i += 2) tone(mf([72, 76, 79, 84][(i >> 1) % 4] + 12), t + i * s + s * .5, s, 'p', .12, jg);
  }, 2);
}
function sadTune() {
  jingle(2.1, t => {
    const q = seq(t, [[67, 1], [64, 1], [60, 2]], .28, 'triangle', .9);
    seq(t, [[67, 1], [64, 1], [60, 2]], .28, 'p', .12);
    seq(q + .12, [[69, 1], [72, 3]], .28, 'square', .3); tone(mf(53), q + .12, 1.1, 'triangle', .7, jg);
  }, 2);
}
function ready() {
  jingle(2.5, t => { for (const d of [.3, .9, 1.5]) tone(880, t + d, .1, 'square', .3, jg); tone(1319, t + 2.1, .35, 'square', .32, jg); tone(659, t + 2.1, .35, 'p', .25, jg); });
}

/* ---------- state polling ---------- */
function want() {
  if (state === 'play') return boss ? 'boss' : clearT > 0 ? '-clear' : bossWarn > 0 ? '-warn' : 's' + li;
  if (!ov.hidden && ov.querySelector('.shop [data-a="buy"]')) return 'shop';
  return state === 'menu' ? 'menu' : '-' + state;
}
function tick() {
  const w = want();
  if (w !== prevWant) {
    prevWant = w;
    if (w === '-warn') { stop(.25); siren(); } else if (w === '-clear') stop(.05); else if (w[0] === '-') stop(.3); else play(w);
  }
  if (!ac || !build()) return;
  const now = ac.currentTime, v = mvol(), p = state === 'play' && paused ? 1 : 0;
  if (v !== tV) { tV = v; vg.gain.setTargetAtTime(v, now, .05); }
  if (p !== tP) { tP = p; pg.gain.setTargetAtTime(p ? .25 : 1, now, .05); lpf.frequency.setTargetAtTime(p ? 600 : 18000, now, .05); }
  if (curId === 'boss' && boss && boss.max && boss.hp / boss.max < .5 && lay < 2) lay = 2;
  schedule();
}

/* ---------- wrappers ---------- */
const _draw = draw;
draw = function () {
  const r = _draw.apply(this, arguments);
  try { tick(); } catch (e) { if (!warned) { warned = 1; console.warn('music', e); } }
  return r;
};
const _startLevel = startLevel;
startLevel = function (i) {
  const r = _startLevel.apply(this, arguments);
  play('s' + li); prevWant = 's' + li; ready();
  return r;
};
const _levelDone = levelDone;
levelDone = function () { const last = li === LV.length - 1, r = _levelDone.apply(this, arguments); stop(.05); if (last) winTune(); else fanfare(); return r; };
const _gameOver = gameOver;
gameOver = function () { const r = _gameOver.apply(this, arguments); stop(.2); sadTune(); return r; };
const _beep = beep;
beep = function (f, d, type, v, f2) {
  const k = sfxk(); if (!k) return;
  const a = Array.prototype.slice.call(arguments); a[3] = (v || .05) * k; return _beep.apply(this, a);
};
const _boom = boom;
boom = function (v) {
  const k = sfxk(); if (!k) return;
  const a = Array.prototype.slice.call(arguments); a[0] = (v || .2) * k; return _boom.apply(this, a);
};
const _explode = explode;
explode = function (x, y, n, big) {
  const r = _explode.apply(this, arguments);
  if (big && built && song) {
    const now = ac.currentTime;
    if (now - lastDuck >= .25) { lastDuck = now; try { dg.gain.cancelScheduledValues(now); dg.gain.setTargetAtTime(.45, now, .01); dg.gain.setTargetAtTime(1, now + .12, .04); } catch (e) {} }
  }
  return r;
};

FX.music = {
  play, stop, layer(n) { lay = n | 0 || 1; },
  key() { return song ? { id: curId, root: song.root + tr, scale: SC[song.sc].slice(), chord } : null; },
  beat() { return song && built && !gap ? Math.max(0, (stepN - (next - ac.currentTime) / sd) / 4) : 0; }
};
