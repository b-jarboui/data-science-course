// Lab 3: regression and overfitting. Four models predict a number; one knob makes all of them more complex, level by level.
import { C, Q, h, btn, card, page, plot, chart, runner, slider, chips, panel, notice, tryBox, legend, autotest } from './kit.js';
import { makeData, fit, selftest, KINDS, LEVELS } from './algo-regress.js';

const DATA = {
  house: { name: 'House prices', x: ['Size (m²)', 40, 240], y: ['Price (thousand $)', 50, 650], unit: 'thousand $',
    story: 'Each dot is one house that was sold. <b>Goal:</b> predict the price of a house from its size. Bigger houses cost more, but the price grows more slowly for very big houses.',
    why: 'The real rule is a gentle curve. A model with a little freedom is enough. More freedom only follows the chance ups and downs of single houses.' },
  energy: { name: 'Energy use', x: ['Outside temperature (°C)', -10, 40], y: ['Energy per day (kWh)', 5, 60], unit: 'kWh',
    story: 'Each dot is one day in a building. <b>Goal:</b> predict the energy use from the outside temperature. Cold days need heating, hot days need cooling.',
    why: 'The real rule has the shape of a U. A straight line (level 1) cannot make a U: it is too simple and its error is high on training <i>and</i> test points. That is <b>underfitting</b>.' },
  salary: { name: 'Salary and experience', x: ['Years of experience', 0, 30], y: ['Salary (thousand $)', 20, 140], unit: 'thousand $',
    story: 'Each dot is one employee. <b>Goal:</b> predict the salary from the years of experience. The salary rises fast at first, then it stays almost flat.',
    why: 'The real rule rises, then goes flat. Polynomials do not like flat parts: at a high degree they start to swing at the edges.' },
  visits: { name: 'Website visitors', x: ['Hour of the day', 0, 24], y: ['Visitors per hour', 0, 900], unit: 'visitors',
    story: 'Each dot is one measured hour on a website. <b>Goal:</b> predict the number of visitors from the hour. There are several peaks during the day.',
    why: 'The real rule has several waves. Simple models miss them, so here you need <b>more</b> complexity than for the other data. The best level is in the middle, not at the lowest and not at the highest.' },
  taxi: { name: 'Taxi fares', x: ['Distance (km)', 0, 30], y: ['Fare ($)', 0, 80], unit: '$',
    story: 'Each dot is one taxi trip. <b>Goal:</b> predict the fare from the distance. The fare is a fixed price per kilometre, plus some chance (traffic, waiting).',
    why: 'The real rule is a straight line. Level 1 is already the right model. Every extra level can only learn the noise.' },
  parcel: { name: 'Parcel prices', x: ['Weight (kg)', 0, 20], y: ['Price ($)', 0, 40], unit: '$',
    story: 'Each dot is one parcel. <b>Goal:</b> predict the delivery price from the weight. The price jumps at 5, 10 and 15 kg: it is a <b>staircase</b>.',
    why: 'The real rule is a staircase. A <b>tree</b> cuts the axis into pieces, so it builds the 4 stairs with only 3 cuts (depth 2). Smooth models like polynomials round off the jumps.' },
};
const METHODS = [
  { id: 'poly', name: 'Polynomial', color: C.cyan, set: s => s === 1 ? 'degree 1 (straight line)' : `degree ${s}` },
  { id: 'knn', name: 'k nearest neighbours', color: C.amber, set: (s, nT) => s === nT ? `k = ${s} (all points: the mean)` : `k = ${s}` },
  { id: 'tree', name: 'Regression tree', color: C.pink, set: s => `depth ${s}` },
  { id: 'nn', name: 'Neural network', color: C.violet, set: s => `${s} hidden neuron${s === 1 ? '' : 's'}` },
];
const S = { kind: KINDS.includes(Q.get('data')) ? Q.get('data') : 'house', n: +Q.get('n') || 120, noise: 1, seed: 1, level: 1 };
let data, fits = {}, curves = {};
const { side, main } = page({ num: 3, title: 'Regression: too simple, right, too complex',
  intro: 'Four models predict a number. The complexity level gives every model more freedom, step by step. Watch the error on the training points and on the hidden test points.' });

const story = h('p', { class: 'lab-story' });
const pick = chips(KINDS.map(id => ({ id, name: DATA[id].name })), S.kind, id => { S.kind = id; S.seed = 1; newData(); });
const kN = slider({ label: 'Points', min: 30, max: 600, step: 10, value: S.n, oninput: v => { S.n = v; newData(); } });
const kNo = slider({ label: 'Noise', min: 0.2, max: 2.5, step: 0.1, value: 1, fmt: v => '×' + v.toFixed(1), oninput: v => { S.noise = v; newData(); } });
const kL = slider({ label: 'Complexity level', min: 1, max: LEVELS, value: 1, fmt: v => v + ' of ' + LEVELS, oninput: v => { R.pause(); goto(v); frame(); } });
kL.el.style.gridColumn = '1 / -1';
side.append(card('lab-data', h('h2', {}, '1 · Choose the data'), pick.el, story,
  legend([['dot', C.cyan, 'training point'], ['ring', C.amber, 'test point (hidden)'], ['', '#9aa6c9', 'dashed: the real rule'], ['', '#ffffff', 'the model']]),
  h('div', { class: 'lab-knobs' }, kN.el, kNo.el, kL.el), h('div', { class: 'lab-row' }, btn('New data', () => { S.seed++; newData(); }))));
const R = runner({ step: () => { goto(S.level + 1); return S.level >= LEVELS; }, reset: () => { S.level = 1; kL.set(1); }, frame, unit: 'Level', from: 1 });
side.append(R.el);
const note = notice(); side.append(note.el);
side.append(tryBox([
  'Choose <b>House prices</b> with 30 points. Press Play. At which level does the polynomial start to swing wildly?',
  'Now set <b>Points</b> to 600 and play again. Is the high level still so bad? More data protects against overfitting.',
  'Choose <b>Taxi fares</b>. Which level is best for each model? Why is level 1 enough?',
  'Raise <b>Noise</b>. The dashed line in the charts (best possible error) moves up. No model can beat it.']));

const grid = h('div', { class: 'lab-grid', style: { '--cols': 2, '--cols-s': 1 } }); main.append(grid);
const P = {};
for (const m of METHODS) { const pl = plot({ aspect: 1.7, xr: [-1.06, 1.06], yr: [-1.35, 1.35] }); pl.draw = () => draw(m.id, pl); P[m.id] = { pl, pan: panel(m.name, m.color, pl.el) }; grid.append(P[m.id].pan.el); }
const chTr = chart({ aspect: 2.3, xlab: 'complexity level', intX: true }), chTe = chart({ aspect: 2.3, xlab: 'complexity level', intX: true });
const unitA = h('span'), unitB = h('span');
main.append(h('div', { class: 'lab-two' },
  card('', h('h2', {}, 'Error on the training points'), chTr.el, h('p', { class: 'lab-story' }, 'Typical error in ', unitA, '. With more freedom a model follows its training points more and more closely.')),
  card('', h('h2', { class: 'amber' }, 'Error on the test points'), chTe.el, h('p', { class: 'lab-story' }, 'Typical error in ', unitB, ' on points the model never saw. This is the number that counts. Dashed line: the noise in the data, the best possible error.'))));

const real = v => v * (DATA[S.kind].y[2] - DATA[S.kind].y[1]) / 2.7;           // error in plot units -> real units
const fmtE = v => { const r = real(v); return r >= 1e4 ? 'over 9999' : r >= 100 ? r.toFixed(0) : r >= 10 ? r.toFixed(1) : r.toFixed(2); };
function newData() {
  data = makeData(S.kind, S.n, S.noise, S.seed); fits = {}; curves = {}; const d = DATA[S.kind];
  story.innerHTML = d.story + ` <span style="color:${C.dim}">(${data.train.length} points to learn, ${data.test.length} to test)</span>`;
  unitA.textContent = unitB.textContent = d.unit;
  for (const m of METHODS) P[m.id].pl.axes = { x: { name: d.x[0], lo: d.x[1] - (d.x[2] - d.x[1]) * 0.03, hi: d.x[2] + (d.x[2] - d.x[1]) * 0.03 }, y: { name: d.y[0], lo: d.y[1], hi: d.y[2] } };
  S.level = 0; R.clear(); goto(1); frame();
}
function goto(lv) {
  lv = Math.max(1, Math.min(LEVELS, lv));
  for (let q = 1; q <= lv; q++) if (!fits[q]) { fits[q] = {}; for (const m of METHODS) fits[q][m.id] = fit(data, m.id, q, S.seed); }
  S.level = lv; kL.set(lv);
}
function draw(id, pl) {
  const m = fits[S.level] && fits[S.level][id], { x, y, n } = data, X = new Float64Array(2 * n), isTest = new Uint8Array(n); if (!m) return;
  for (let i = 0; i < n; i++) { X[2 * i] = x[i]; X[2 * i + 1] = y[i]; } for (const i of data.test) isTest[i] = 1;
  const xs = Array.from({ length: 321 }, (_, i) => -1.04 + 2.08 * i / 320);
  pl.path(xs.map(v => [v, data.f(v)]), '#9aa6c9', 1.4, [5, 4]);
  const r = pl.W < 300 ? 2 : n > 300 ? 2.2 : 2.8;
  pl.dots(X, n, i => isTest[i] ? C.amber : C.cyan, r, i => isTest[i]);
  const key = S.level + id; if (!curves[key]) curves[key] = xs.map(v => [v, Math.max(-9, Math.min(9, m.predict(Math.max(-1, Math.min(1, v)))))]);
  pl.path(curves[key], '#050814', 5); pl.path(curves[key], '#ffffff', 2.2);
}
const best = id => { let b = null; for (let q = 1; q <= LEVELS; q++) if (fits[q] && (!b || fits[q][id].test < b.test)) b = { ...fits[q][id], level: q }; return b; };
function frame() {
  const nT = data.train.length, lv = S.level, done = Object.keys(fits).length;
  for (const m of METHODS) {
    const q = fits[lv][m.id], over = q.test > 1.25 * q.train && q.test > 1.15 * best(m.id).test;
    P[m.id].pan.stat(`level <b>${lv}</b> · <b>${m.set(q.setting, nT)}</b><br>train error <b>${fmtE(q.train)}</b> · test error <b class="${over ? 'bad' : ''}">${fmtE(q.test)}</b> ${DATA[S.kind].unit}`);
    P[m.id].pan.note(over ? 'overfitting' : '', C.pink); P[m.id].pl.redraw();
  }
  const lvls = []; for (let q = 1; q <= LEVELS; q++) if (fits[q]) lvls.push(q);
  const ser = k => METHODS.map(m => ({ name: m.name, color: m.color, xs: lvls, data: lvls.map(q => real(fits[q][m.id][k])) }));
  const top = Math.max(...lvls.flatMap(q => METHODS.map(m => real(fits[q][m.id].train))), real(data.sigma)) * 2.2;
  chTr.set(ser('train'), { xmin: 1, xmax: LEVELS, ymin: 0, ymax: top, clipMax: true, marks: [{ x: lv, color: '#ffffff88' }, { y: real(data.sigma), color: C.green }] });
  chTe.set(ser('test'), { xmin: 1, xmax: LEVELS, ymin: 0, ymax: top, clipMax: true, marks: [{ x: lv, color: '#ffffff88' }, { y: real(data.sigma), color: C.green }] });
  note.set(notes(done));
}
function notes(done) {
  const d = DATA[S.kind], out = [], lv = S.level, nT = data.train.length, u = d.unit;
  if (done <= 1) out.push('Press <b>Play</b> or <b>Step</b>. Each step raises the complexity level of all four models. Level 1 is the simplest form of each model.');
  out.push(d.why);
  out.push(`The noise in this data is about <b>${fmtE(data.sigma)} ${u}</b>. That part is chance, so no model can have a smaller test error for long. A training error <i>below</i> this number means the model is learning the chance.`);
  const cur = METHODS.map(m => ({ m, q: fits[lv][m.id] })), worst = cur.slice().sort((a, b) => b.q.test / b.q.train - a.q.test / a.q.train)[0];
  if (worst.q.test > 1.5 * worst.q.train && worst.q.train < 0.9 * data.sigma) out.push(`<b>Overfitting now (level ${lv}):</b> ${worst.m.name} with ${worst.m.set(worst.q.setting, nT)} has train error ${fmtE(worst.q.train)} but test error ${fmtE(worst.q.test)} ${u}. The white curve passes close to single training dots and misses the test rings.`);
  else if (cur.every(c => c.q.train > 1.3 * data.sigma)) out.push(`<b>Underfitting now (level ${lv}):</b> all models are too simple. The errors are high on the training points and on the test points.`);
  if (done >= LEVELS) {
    const b = METHODS.map(m => ({ m, b: best(m.id) })).sort((a, c) => a.b.test - c.b.test);
    out.push(`<b>Result:</b> best test error for each model: ` + b.map(o => `${o.m.name} ${fmtE(o.b.test)} at level ${o.b.level} (${o.m.set(o.b.setting, nT)})`).join('; ') + '.');
    const last = fits[LEVELS], gone = METHODS.filter(m => last[m.id].test > 1.3 * best(m.id).test).map(m => m.name);
    out.push(gone.length ? `At level ${LEVELS} the test error is clearly worse than at the best level for: <b>${gone.join(', ')}</b>. The training error still went down. Low training error does not mean a good model.` : `Here even level ${LEVELS} is not much worse than the best level: with ${nT} training points and this noise, the models have enough data.`);
  }
  return out;
}

newData();
if (Q.get('autotest')) autotest('regression', async t => {
  selftest(t, true);
  for (const kind of KINDS) for (const n of [30, 600]) {
    S.kind = kind; S.n = n; pick.set(kind); kN.set(n); newData(); R.runAll(50);
    const all = []; for (let q = 1; q <= LEVELS; q++) for (const m of METHODS) all.push(fits[q][m.id]);
    t.ok(S.level === LEVELS && all.every(q => Number.isFinite(q.train) && Number.isFinite(q.test)), `${kind} n=${n}: every model fits at every level`);
    t.ok(METHODS.every(m => best(m.id).test < 3.5 * data.sigma), `${kind} n=${n}: best test error is near the noise level`);
    t.ok(notes(LEVELS).length >= 4, `${kind} n=${n}: notice text`);
    t.log(`${kind} n=${n} noise ${fmtE(data.sigma)}: ` + METHODS.map(m => { const b = best(m.id); return `${m.id} best ${fmtE(b.test)}@L${b.level}, L12 ${fmtE(fits[LEVELS][m.id].train)}/${fmtE(fits[LEVELS][m.id].test)}`; }).join(' | '));
    await new Promise(r => setTimeout(r, 0));
  }
  S.kind = 'house'; S.n = 120; pick.set('house'); kN.set(120); newData();
}); else R.auto();
