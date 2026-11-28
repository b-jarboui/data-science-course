// Lab 4: optimizers. Four ways to walk downhill race on the same loss surface, from the same start.
import { C, Q, h, btn, card, page, plot, heat, chart, runner, slider, chips, panel, notice, tryBox, legend, autotest } from './kit.js';
import { SURF, KINDS, OPTS, H, walker, selftest } from './algo-optim.js';

const DATA = {
  bowl: { name: 'Round bowl', ax: ['weight 1', 'weight 2'],
    story: 'The simplest loss surface: a round bowl. Dark = low loss. The slope always points away from the lowest point (green cross).',
    why: 'In a round bowl every optimizer finds the bottom. Now raise the learning rate of gradient descent above <b>1.0</b>: every step jumps over the bottom and lands higher than before. The loss grows without end.' },
  valley: { name: 'Long valley', ax: ['weight 1', 'weight 2'],
    story: 'A long narrow valley: very steep from top to bottom of the picture, almost flat from left to right. Many real losses look like this.',
    why: 'The steep side forces <b>gradient descent</b> to use a small step, so it moves very slowly along the flat direction. <b>Momentum</b> keeps its speed along the valley. <b>RMSProp</b> and <b>Adam</b> give each direction its own step size.' },
  curved: { name: 'Curved valley', ax: ['weight 1', 'weight 2'],
    story: 'A valley that bends like a banana. The lowest point is far along the bend.',
    why: 'Getting into the valley is easy. Following the bend is slow, because the floor of the valley is almost flat. Watch which optimizers keep moving along the floor.' },
  saddle: { name: 'Flat ridge', ax: ['weight 1', 'weight 2'],
    story: 'Two valleys, left and right, with a flat ridge between them. The start is almost exactly on the ridge.',
    why: 'On the ridge the slope to the side is almost zero. The step of <b>gradient descent</b> is slope × learning rate, so it nearly stops there. <b>RMSProp</b> and <b>Adam</b> divide by the usual size of the slope, so they keep a normal step on flat ground.' },
  dips: { name: 'Many dips', ax: ['weight 1', 'weight 2'],
    story: 'A big bowl with many small dips. Only the middle dip is the real lowest point. Neural networks have surfaces with many dips.',
    why: 'An optimizer only feels the slope under its feet. It can stop in a dip that is not the lowest point. <b>Momentum</b> can roll through small dips because it keeps speed. Tap the map to try another start.' },
  fitraw: { name: 'Real: fit a line', ax: ['slope', 'intercept'],
    story: 'A real loss. We fit the line <b>price = slope × size + intercept</b> to 120 houses. Each point of the map is one possible line. The small picture shows the four lines right now.',
    why: 'The house size is used as it is (not scaled). Slope and intercept then depend on each other, so the valley is long and tilted. Gradient descent zigzags and is slow.' },
  fitstd: { name: 'Real: same line, scaled data', ax: ['slope', 'intercept'],
    story: 'The same 120 houses, but the size is <b>scaled</b> first (mean 0, spread 1). Same data, same best line, different map.',
    why: 'After scaling, the valley becomes a round bowl and plain gradient descent is fast. This is why we scale the data before training a model.' },
};
const OPT = { gd: { name: 'Gradient descent', color: C.cyan }, momentum: { name: 'Momentum', color: C.amber }, rmsprop: { name: 'RMSProp', color: C.pink }, adam: { name: 'Adam', color: C.green } };
const S = { kind: KINDS.includes(Q.get('data')) ? Q.get('data') : 'valley', lrA: 0.1, lrB: 0.1, beta: 0.9, noisy: false, start: null, seed: 1 };
const MAXT = 300;
let surf, Wk = {}, hm = heat(200, 200), hmKey = '';
const { side, main } = page({ num: 4, title: 'Optimizers: the race downhill',
  intro: 'Training a model means walking downhill on its loss surface. Four optimizers start at the same place and take one step at a time. Tap the map to move the start.' });

const story = h('p', { class: 'lab-story' });
const pick = chips(KINDS.map(id => ({ id, name: DATA[id].name })), S.kind, id => { S.kind = id; setSurf(true); });
const lrFmt = v => { const x = Math.pow(10, v); return x >= 1 ? x.toFixed(2) : x >= 0.1 ? x.toFixed(2) : x.toFixed(3); };
const kA = slider({ label: 'Learning rate: GD, momentum', min: -3, max: 0.3, step: 0.01, value: -1, fmt: lrFmt, oninput: v => { S.lrA = Math.pow(10, v); restart(); } });
const kB = slider({ label: 'Learning rate: RMSProp, Adam', min: -3, max: 0.3, step: 0.01, value: -1, fmt: lrFmt, oninput: v => { S.lrB = Math.pow(10, v); restart(); } });
const kBeta = slider({ label: 'Momentum: speed kept', min: 0, max: 0.99, step: 0.01, value: 0.9, fmt: v => Math.round(v * 100) + '%', oninput: v => { S.beta = v; restart(); } });
const bNoise = btn('Exact slope', () => { S.noisy = !S.noisy; bNoise.textContent = S.noisy ? 'Noisy slope (mini-batch)' : 'Exact slope'; bNoise.classList.toggle('go', S.noisy); restart(); }, 'ghost');
for (const k of [kA, kB, kBeta]) k.el.style.gridColumn = '1 / -1';
side.append(card('lab-data', h('h2', {}, '1 · Choose the surface'), pick.el, story,
  h('div', { class: 'lab-knobs' }, kA.el, kB.el, kBeta.el), h('div', { class: 'lab-row' }, bNoise, btn('Default settings', () => setSurf(true)))));
const R = runner({ step, reset: restart0, frame }); side.append(R.el);
const note = notice(); side.append(note.el);
side.append(tryBox([
  'Choose <b>Round bowl</b>. Raise the first learning rate step by step. At which value does gradient descent stop working?',
  'Choose <b>Long valley</b>. Set <b>Momentum: speed kept</b> to 0%. Momentum now moves exactly like gradient descent. Why?',
  'Choose <b>Real: fit a line</b>, then <b>Real: same line, scaled data</b>. Count the steps gradient descent needs in each case.',
  'Press <b>Exact slope</b> to switch to a noisy slope. This is what training with small batches looks like. Which optimizer stays calm?']));

const pl = plot({ aspect: 1, axes: { x: { name: '', lo: 0, hi: 1 }, y: { name: '', lo: 0, hi: 1 } } });
pl.el.classList.add('tap');
const mapPan = panel('Loss map: dark = low', C.ink, pl.el);
const ch = chart({ aspect: 1.9, xlab: 'step', intX: true }), table = h('table', { class: 'lab-table' });
const fitPl = plot({ aspect: 1.9, xr: [0.3, 2.7], yr: [0, 8], axes: { x: { name: 'Size (100 m²)', lo: 0.3, hi: 2.7 }, y: { name: 'Price (100 thousand $)', lo: 0, hi: 8 } } });
const fitCard = h('div', { class: 'lab-panel' }, h('div', { class: 'lab-ptitle', style: { color: C.ink } }, 'The four lines right now'), fitPl.el);
const right = h('div', { style: { display: 'grid', gap: '.55rem', alignContent: 'start', minWidth: 0 } },
  h('div', { class: 'lab-panel' }, h('div', { class: 'lab-ptitle', style: { color: C.ink } }, 'Loss above the lowest point (log scale)'), ch.el), h('div', { class: 'lab-panel' }, table), fitCard);
const grid = h('div', { class: 'lab-grid', style: { '--cols': 2, '--cols-s': 1 } }, mapPan.el, right); main.append(grid);

const ramp = t => { const a = [8, 12, 30], b = [38, 44, 120], c = [120, 92, 190], d = [236, 190, 150]; const m = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u, p[2] + (q[2] - p[2]) * u]; return t < 0.4 ? m(a, b, t / 0.4) : t < 0.8 ? m(b, c, (t - 0.4) / 0.4) : m(c, d, (t - 0.8) / 0.2); };
function paintMap() {
  const g = hm, v = new Float64Array(g.w * g.h); let hi = 0;
  for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) { const t = Math.sqrt(Math.max(0, surf.f(g.gx(i, pl), g.gy(j, pl)) - surf.fmin)); v[j * g.w + i] = t; if (t > hi) hi = t; }
  const N = 16;
  for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) { const q = j * g.w + i, t = v[q] / hi, band = Math.floor(t * N), edge = (i + 1 < g.w && Math.floor(v[q + 1] / hi * N) !== band) || (j + 1 < g.h && Math.floor(v[q + g.w] / hi * N) !== band);
    const col = ramp(Math.pow(t, 0.8)), o = 4 * q, k = edge ? 1.45 : 1; g.d[o] = Math.min(255, col[0] * k + (edge ? 18 : 0)); g.d[o + 1] = Math.min(255, col[1] * k + (edge ? 18 : 0)); g.d[o + 2] = Math.min(255, col[2] * k + (edge ? 22 : 0)); g.d[o + 3] = 255; }
  g.flush();
}
pl.draw = () => {
  const key = S.kind + pl.W; if (key !== hmKey) { paintMap(); hmKey = key; }
  pl.heat(hm, 1, true);
  for (const m of surf.min) pl.mark(m[0], m[1], '#86efac', 5, 'x');
  for (const k of OPTS) { const w = Wk[k]; pl.path(w.path, '#050814', 4); pl.path(w.path, OPT[k].color, 2); }
  pl.mark(S.start[0], S.start[1], '#ffffff', 6, 'o');
  for (const k of OPTS) { const w = Wk[k]; if (w.out) continue; const ctx = pl.ctx, x = pl.px(w.x), y = pl.py(w.y); ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.2832); ctx.fillStyle = OPT[k].color; ctx.fill(); ctx.strokeStyle = '#050814'; ctx.lineWidth = 1.5; ctx.stroke(); }
};
fitPl.draw = () => {
  const n = H.n, X = new Float64Array(2 * n); for (let i = 0; i < n; i++) { X[2 * i] = H.size[i]; X[2 * i + 1] = H.price[i]; }
  fitPl.dots(X, n, () => '#7d89b0', 2);
  const line = (p, q) => S.kind === 'fitstd' ? [[0.3, p * (0.3 - H.mean) / H.sd + q], [2.7, p * (2.7 - H.mean) / H.sd + q]] : [[0.3, p * 0.3 + q], [2.7, p * 2.7 + q]];
  fitPl.path(line(surf.min[0][0], surf.min[0][1]), '#ffffff', 1.4, [5, 4]);
  for (const k of OPTS) if (!Wk[k].out) fitPl.path(line(Wk[k].x, Wk[k].y), OPT[k].color, 2);
};
const tap = e => { const r = pl.cv.getBoundingClientRect(), x = pl.ux(e.clientX - r.left), y = pl.uy(e.clientY - r.top); if (x < surf.xr[0] || x > surf.xr[1] || y < surf.yr[0] || y > surf.yr[1]) return; S.start = [x, y]; restart(); };
pl.cv.addEventListener('pointerdown', tap);

function setSurf(defaults) {
  surf = SURF[S.kind]; const d = DATA[S.kind]; pl.xr = surf.xr; pl.yr = surf.yr; pl.axes = { x: { name: d.ax[0], lo: surf.xr[0], hi: surf.xr[1] }, y: { name: d.ax[1], lo: surf.yr[0], hi: surf.yr[1] } }; hmKey = '';
  if (defaults) { S.lrA = surf.lrA; S.lrB = surf.lrB; S.beta = 0.9; kA.set(Math.log10(S.lrA)); kB.set(Math.log10(S.lrB)); kBeta.set(0.9); S.start = surf.start.slice(); }
  story.innerHTML = d.story; fitCard.style.display = surf.xs ? '' : 'none'; pick.set(S.kind);
  restart();
}
function restart0() { const s = { ...surf, start: S.start }; for (const k of OPTS) Wk[k] = walker(k, s, k === 'gd' || k === 'momentum' ? S.lrA : S.lrB, { beta: S.beta, noisy: S.noisy, seed: S.seed }); }
function restart() { restart0(); R.clear(); frame(); }
const settled = w => w.out || (w.t > 12 && Math.hypot(w.x - w.path[w.t - 10][0], w.y - w.path[w.t - 10][1]) < 1e-4);
function step() { for (const k of OPTS) Wk[k].step(); const t = Wk.gd.t; return t >= MAXT || OPTS.every(k => (Wk[k].goalAt && t >= Wk[k].goalAt + 25) || settled(Wk[k])); }   // runs a little longer after the goal, to see who settles
const fl = v => !Number.isFinite(v) ? '∞' : v >= 100 ? v.toExponential(1) : v >= 0.01 ? v.toFixed(3) : v === 0 ? '0' : v.toExponential(1);
function frame() {
  pl.redraw(); if (surf.xs) fitPl.redraw();
  ch.set(OPTS.map(k => ({ name: OPT[k].name, color: OPT[k].color, data: Wk[k].hist.map(v => Math.min(1e6, v - surf.fmin) + 1e-7) })), { log: true, xmax: 20, ymin: 1e-4 });
  const html = '<tr><th>Optimizer</th><th>Loss now</th><th>Goal reached</th></tr>' + OPTS.map(k => { const w = Wk[k]; return `<tr><td style="color:${OPT[k].color}">${OPT[k].name}</td><td class="num">${fl(w.loss)}</td><td class="num">${w.out ? '<b style="color:#f472b6">flew away</b>' : w.goalAt ? `<b style="color:#86efac">step ${w.goalAt}</b>` : 'not yet'}</td></tr>`; }).join('');
  if (table._h !== html) { table._h = html; table.innerHTML = html; }
  mapPan.stat(`step <b>${Wk.gd.t}</b> · start loss <b>${fl(Wk.gd.hist[0])}</b> · lowest possible <b>${fl(surf.fmin)}</b><br>goal: only 0.1% of the start height is left · white ring = start`);
  note.set(notes());
}
function notes() {
  const d = DATA[S.kind], out = [], t = Wk.gd.t;
  if (!t) out.push('Press <b>Play</b>. All four optimizers start at the white ring. The green cross is the lowest point.');
  out.push(d.why);
  if (!t) return out;
  const reached = OPTS.filter(k => Wk[k].goalAt).sort((a, b) => Wk[a].goalAt - Wk[b].goalAt), outs = OPTS.filter(k => Wk[k].out), not = OPTS.filter(k => !Wk[k].goalAt && !Wk[k].out);
  if (reached.length) out.push(`<b>Result so far:</b> goal reached by ` + reached.map(k => `<b>${OPT[k].name}</b> (step ${Wk[k].goalAt})`).join(', ') + '.');
  if (outs.length) out.push(`<b>${outs.map(k => OPT[k].name).join(' and ')}</b> flew away: the learning rate is too large for this surface, so each step lands higher than the step before.`);
  if (R.done && not.length) {
    const stuck = not.filter(k => settled(Wk[k]));
    if (stuck.length && S.kind === 'dips') out.push(`${stuck.map(k => OPT[k].name).join(', ')} stopped in a dip with loss ${stuck.map(k => fl(Wk[k].loss)).join(', ')}. The slope there is zero, so the optimizer cannot know that a lower point exists.`);
    else if (stuck.length) out.push(`${stuck.map(k => OPT[k].name).join(', ')} stopped moving before the goal (loss ${stuck.map(k => fl(Wk[k].loss)).join(', ')}).`);
    const slow = not.filter(k => !stuck.includes(k));
    if (slow.length) out.push(`After ${t} steps ${slow.map(k => OPT[k].name).join(', ')} did not reach the goal (loss above the lowest point: ${slow.map(k => fl(Wk[k].loss - surf.fmin)).join(', ')}).` + (slow.includes('rmsprop') ? ' RMSProp keeps a step of about the learning rate, so it jumps around the lowest point and does not settle exactly.' : ''));
  }
  if (S.noisy) out.push('With a noisy slope each step is partly wrong. The paths shake. Momentum and Adam average the last slopes, so their paths are smoother. A smaller learning rate also makes the path calmer.');
  if (S.lrA !== surf.lrA || S.lrB !== surf.lrB) out.push('The same learning rate means different things: for gradient descent the step is rate × slope. For Adam the step is about the rate itself, whatever the slope.');
  return out;
}

setSurf(true);
if (Q.get('autotest')) autotest('optimizers', async t => {
  selftest(t);
  for (const kind of KINDS) for (const noisy of [false, true]) {
    S.kind = kind; S.noisy = noisy; setSurf(true); const g = R.runAll(MAXT + 5);
    t.ok(OPTS.every(k => Wk[k].hist.length === Wk[k].t + 1 && (Wk[k].out || Number.isFinite(Wk[k].loss))), `${kind}${noisy ? ' noisy' : ''}: every optimizer runs`);
    if (!noisy && kind !== 'dips') t.ok(OPTS.filter(k => Wk[k].goalAt).length >= 2, `${kind}: at least two optimizers reach the goal with the default rates`);
    if (!noisy) t.ok(OPTS.every(k => Wk[k].loss <= Wk[k].hist[0]), `${kind}: with the default rates every optimizer ends lower than the start`);
    t.ok(notes().length >= 2, `${kind}: notice text`);
    t.log(`${kind}${noisy ? ' noisy' : ''}: ${g} steps | ` + OPTS.map(k => `${k} ${Wk[k].goalAt || (Wk[k].out ? 'out' : 'no')} loss ${fl(Wk[k].loss)}`).join(' | '));
    await new Promise(r => setTimeout(r, 0));
  }
  S.kind = 'bowl'; S.noisy = false; setSurf(true); S.lrA = 1.1; restart(); R.runAll(MAXT + 5); t.ok(Wk.gd.out, 'bowl: gradient descent flies away when the learning rate is above 1');
  S.kind = 'valley'; setSurf(true);
}); else R.auto();
