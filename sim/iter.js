// Iteration toolkit for "Try it" sims where a model learns or a method repeats (PEDAGOGY.md, "Learning shown as iterations").
// Built on kit.js. A sim calls it from its mount function:
//
//   import { iterSim } from './iter.js';
//   export default function mount(root) {
//     return iterSim({ mount: root, title, sub,
//       knobs: [{ key, label, min, max, step, value, fmt(v), random(rng) }],   // changing a knob restarts the walk
//       init(rng, knobs) -> state,                       // the start (Reset reuses the seed, "New start" draws a new one)
//       loss(state) -> number,                           // loss at the start (iteration 0)
//       start(state, ctx) -> lines,                      // formula box before the first step
//       step(state, knobs, ctx) -> { state, loss, lines },
//       draw(state, ctx) -> [svg nodes],                 // ctx.prev + ctx.t (0..1) while the move is animated
//       setup(svg, api), extra(api) -> node (under the knobs), stop(ctx) -> { outcome, text } | null, note(ctx) -> text,
//       challenges: [{ text, check(ctx), why }], predict: { at, ask, choices: [[key, label]], judge(outcome) -> key },
//       maxIter, newLabel }).destroy;
//   }
//
// ctx = { state, iter, history (losses), states, knobs, outcome, prediction, predictionRight, narrow, F, api }.
// Lines use the kit.fbox format: 'text' or ['text', color].
import { C, h, s, btn, pill, fbox, challenges } from './kit.js';

// Small numbers in the course style: 3.36, 0.39, 0.0063, 131.
export function num(x) {
  if (!Number.isFinite(x)) return x > 0 ? 'huge' : '−huge';
  const a = Math.abs(x);
  let t;
  if (a < 1e-12) t = '0';
  else if (a >= 1e6) t = (x / 1e6).toFixed(1).replace(/\.0$/, '') + ' million';
  else if (a >= 100) t = String(Math.round(x));
  else if (a >= 1) t = String(Math.round(x * 100) / 100);
  else if (a < 1e-6) t = (x < 0 ? '-' : '') + '0.000001';
  else t = String(parseFloat(x.toPrecision(2)));
  return t.replace('-', '−');
}
export const sgn = x => (x > 0 ? '+' : '') + num(x);

// Seeded random numbers, so Reset replays the same start.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CSS = `
.it-pills { display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: .6rem; }
.it-knob { margin-top: .7rem; }
.it-knob label { display: flex; justify-content: space-between; gap: .5rem; flex-wrap: wrap; font-weight: 650; }
.it-knob label b { color: ${C.amber}; font: 700 1rem/1.4 Consolas, monospace; }
.it-knob input[type="range"], .it-speed input[type="range"] { width: 100%; height: 44px; margin: 0; accent-color: ${C.cyan}; cursor: pointer; touch-action: pan-y; }
.it-speed { margin-top: .4rem; }
.it-speed label { color: #b2bdd9; font-size: .9375rem; }
.it-ctl { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 7.5rem), 1fr)); gap: .5rem; margin-top: .8rem; }
.it-ctl .sim-btn { min-height: 52px; font-size: 1.0625rem; }
.it-ctl .sim-btn:disabled { opacity: .45; cursor: default; }
.sim .it-curve { touch-action: pan-y; }
.it-curve-head { display: flex; justify-content: space-between; align-items: center; gap: .5rem; flex-wrap: wrap; margin-bottom: .4rem; color: #b2bdd9; font-size: .9375rem; }
.it-predict { margin-top: .8rem; padding-top: .7rem; border-top: 1px solid ${C.line}; }
.it-predict .sim-row { margin-top: .5rem; }
.it-predict .sim-btn.on { border-color: ${C.amber}; color: ${C.amber}; }
.it-predict .sim-btn:disabled:not(.on) { opacity: .45; cursor: default; }
.it-predict-msg { margin-top: .45rem; color: #b2bdd9; font-size: .9375rem; }
.it-predict-msg:empty { display: none; }
`;

export function iterSim(o) {
  if (!document.getElementById('itercss')) document.head.append(h('style', { id: 'itercss' }, CSS));
  const root = o.mount;
  const narrow = (root.clientWidth || innerWidth) < 600;
  const knobs = {};
  for (const k of o.knobs || []) knobs[k.key] = k.value;
  const maxIter = o.maxIter || 300;
  let seed = 1 + Math.floor(Math.random() * 1e9);
  let state, iter, history, states, outcome, prediction, playing = false, timer = 0, anim = 0, speed = 2, lastLines = [];

  // layout: picture + controls + knobs on the left; numbers, loss curve and challenges on the right
  const svg = s('svg', { viewBox: '0 0 700 440' });
  const pills = h('div', { class: 'it-pills' });
  const note = h('div', { class: 'sim-note' });
  const box = h('div');
  const curve = s('svg', { viewBox: '0 0 360 190', class: 'it-curve', 'aria-label': 'Loss after each step' });
  const curveHead = h('div', { class: 'it-curve-head' });
  const chEl = h('div');
  const bStep = btn('Step ›', () => { pause(); stepOnce(450); }, 'go');
  const bPlay = btn('▶ Play', () => (playing ? pause() : play()));
  const bReset = btn('↺ Reset', () => reset());
  const bNew = btn(o.newLabel || '🎲 New start', () => newStart());
  const speedIn = h('input', { type: 'range', min: 1, max: 20, step: 1, value: speed, 'aria-label': 'Speed' });
  const speedLabel = h('label', {});
  speedIn.addEventListener('input', () => { speed = +speedIn.value; speedText(); });
  const speedText = () => { speedLabel.textContent = `Speed when playing: ${speed} step${speed > 1 ? 's' : ''} per second`; };
  speedText();

  const knobEls = {};
  const knobRows = (o.knobs || []).map(k => {
    const val = h('b', {});
    const input = h('input', { type: 'range', min: k.min, max: k.max, step: k.step, value: k.value, 'aria-label': k.label });
    input.addEventListener('input', () => { knobs[k.key] = +input.value; val.textContent = (k.fmt || num)(knobs[k.key]); reset(); });
    val.textContent = (k.fmt || num)(k.value);
    knobEls[k.key] = { input, val, k };
    return h('div', { class: 'it-knob' }, h('label', {}, h('span', {}, k.label), val), input);
  });

  const extraEl = h('div');   // filled by o.extra(api), e.g. preset buttons for a knob

  // prediction ("Will it settle? Choose, then press Play")
  const P = o.predict;
  const predEl = h('div', { class: 'it-predict' });
  const predMsg = h('div', { class: 'it-predict-msg' });
  const predBtns = P ? P.choices.map(([key, label]) => {
    const b = btn(label, () => { if (iter === 0 && !outcome) { prediction = key; refresh(); } }, 'ghost');
    b.dataset.key = key;
    return b;
  }) : [];
  if (P) predEl.append(h('div', { class: 'sim-ch-text', style: { fontSize: '1rem' } }, P.ask), h('div', { class: 'sim-row' }, predBtns), predMsg);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, o.title), o.sub ? h('p', { class: 'sub' }, o.sub) : '',
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, pills, svg, note,
        h('div', { class: 'it-ctl' }, bStep, bPlay, bReset, bNew),
        h('div', { class: 'it-speed' }, speedLabel, speedIn), knobRows, extraEl),
      h('div', {},
        h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' }, curveHead, curve),
        o.challenges ? h('div', { class: 'sim-card' }, chEl, P ? predEl : '') : ''))));

  const chal = o.challenges ? challenges(chEl, o.challenges) : null;
  // the kit's challenge buttons change the index; show the prediction row only on its challenge
  chEl.addEventListener('click', () => setTimeout(refresh));

  const api = {
    get state() { return state; }, get iter() { return iter; }, knobs,
    setKnob(key, v) { const e = knobEls[key]; v = Math.min(e.k.max, Math.max(e.k.min, v)); knobs[key] = v; e.input.value = v; e.val.textContent = (e.k.fmt || num)(v); },
    reset: () => reset(), redraw: () => refresh(),
  };
  const ctx = (extra = {}) => ({ state, iter, history, states, knobs, outcome, prediction, api, narrow, F: narrow ? 1.25 : 1,
    predictionRight: P && prediction && outcome ? P.judge(outcome.outcome) === prediction : null, ...extra });

  function reset() {
    pause(); cancelAnimationFrame(anim);
    state = o.init(rng(seed), knobs);
    iter = 0; history = [o.loss(state)]; states = [state]; outcome = null; prediction = null;
    lastLines = o.start ? o.start(state, ctx()) : [];
    refresh();
  }
  function newStart() {
    seed = 1 + Math.floor(Math.random() * 1e9);
    const r = rng(seed ^ 0x9e3779b9);
    for (const k of o.knobs || []) if (k.random) api.setKnob(k.key, k.random(r));
    reset();
  }

  function stepOnce(dur) {
    if (outcome) return false;
    cancelAnimationFrame(anim);
    const prev = state;
    const r = o.step(state, knobs, ctx());
    state = r.state; iter++;
    history.push(r.loss); states.push(state);
    if (states.length > 600) states.splice(1, 1);
    lastLines = r.lines || [];
    outcome = (o.stop && o.stop(ctx())) || (iter >= maxIter ? { outcome: 'unsettled', text: `Stopped after ${maxIter} steps without settling.` } : null);
    if (outcome) { playing = false; clearTimeout(timer); }
    const t0 = performance.now();
    const frame = now => {
      const t = dur > 0 ? Math.min(1, (now - t0) / dur) : 1;
      paint(ctx({ prev, t: t * t * (3 - 2 * t) }));
      if (t < 1) anim = requestAnimationFrame(frame);
    };
    refresh(true);
    anim = requestAnimationFrame(frame);
    return true;
  }

  function play() {
    if (outcome) return;
    playing = true; refresh();
    const tick = () => {
      if (!playing) return;
      const interval = 1000 / speed;
      if (!stepOnce(Math.min(450, interval * 0.7))) return;
      timer = setTimeout(tick, interval);
    };
    tick();
  }
  function pause() { playing = false; clearTimeout(timer); if (bPlay.isConnected) refresh(); }

  function paint(c) { svg.replaceChildren(...o.draw(c.state, c)); }

  function refresh(skipPicture) {
    if (state === undefined) return;
    const c = ctx();
    if (!skipPicture) paint(c);
    const L = history[history.length - 1];
    pills.replaceChildren(pill(`ITERATION ${iter}`, C.cyan), pill(`LOSS ${num(L)}`, C.amber),
      outcome ? pill(outcome.outcome === 'settled' ? '✓ SETTLED' : outcome.outcome === 'diverged' ? '✕ DIVERGED' : '■ STOPPED',
        outcome.outcome === 'settled' ? C.green : C.pink) : playing ? pill('RUNNING', C.violet) : '');
    note.textContent = outcome ? outcome.text : o.note ? o.note(c) : '';
    fbox(box, lastLines);
    bStep.disabled = !!outcome; bPlay.disabled = !!outcome;
    bPlay.textContent = playing ? '❚❚ Pause' : '▶ Play';
    drawCurve();
    if (P) {
      const show = !chal || chal.index === P.at;
      predEl.style.display = show ? '' : 'none';
      predBtns.forEach(b => { b.classList.toggle('on', b.dataset.key === prediction); b.disabled = iter > 0 || !!outcome; });
      const right = c.predictionRight;
      predMsg.textContent = !prediction ? (iter > 0 ? 'Press Reset, then choose before the first step.' : '')
        : !outcome ? 'Now press Play (or Step) and watch.'
        : right ? 'Your prediction was right.' : `Not this time: ${outcome.text} Press Reset and try another.`;
    }
    if (chal) chal.update(c);
  }

  // loss-versus-iteration curve, growing as the steps run
  function drawCurve() {
    const W = 360, H = 190, X0 = 44, X1 = W - 12, Y0 = 14, Y1 = H - 28;
    const n = history.length - 1, xmax = Math.max(10, n);
    const finite = history.filter(Number.isFinite);
    const top = niceMax(Math.max(...finite, 1e-9));
    const X = i => X0 + (X1 - X0) * i / xmax;
    const Y = v => Y1 - (Y1 - Y0) * Math.min(1, Math.max(0, v / top));
    const k = [];
    for (const g of [0, top / 2, top]) {
      k.push(s('line', { x1: X0, x2: X1, y1: Y(g), y2: Y(g), stroke: C.line }),
        s('text', { x: X0 - 6, y: Y(g) + 4, fill: C.muted, 'font-size': 12, 'text-anchor': 'end', 'font-family': 'Consolas' }, num(g)));
    }
    const ticks = xmax <= 10 ? 1 : xmax <= 50 ? 10 : xmax <= 200 ? 50 : 100;
    for (let i = 0; i <= xmax; i += ticks)
      k.push(s('text', { x: X(i), y: Y1 + 17, fill: C.muted, 'font-size': 12, 'text-anchor': 'middle', 'font-family': 'Consolas' }, i));
    k.push(s('text', { x: X1, y: H - 1, fill: C.muted, 'font-size': 11, 'text-anchor': 'end' }, 'iteration →'));
    const pts = history.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    k.push(s('polyline', { points: pts, fill: 'none', stroke: C.amber, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
    if (n <= 40) history.forEach((v, i) => k.push(s('circle', { cx: X(i), cy: Y(v), r: 3, fill: C.amber })));
    k.push(s('circle', { cx: X(n), cy: Y(history[n]), r: 6, fill: C.bg, stroke: C.amber, 'stroke-width': 3 }));
    curve.replaceChildren(...k);
    curveHead.replaceChildren(h('span', {}, 'Loss after each step'), pill(`${num(history[0])} → ${num(history[n])}`, C.amber));
  }
  const niceMax = v => { const p = 10 ** Math.floor(Math.log10(v)); for (const m of [1, 1.5, 2, 2.5, 5, 10]) if (m * p >= v) return m * p; return 10 * p; };

  if (o.setup) o.setup(svg, api);
  if (o.extra) extraEl.append(o.extra(api));
  reset();
  return { api, destroy() { playing = false; clearTimeout(timer); cancelAnimationFrame(anim); } };
}
