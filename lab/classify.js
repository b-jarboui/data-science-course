// Lab 2: classification. Seven models learn the same two-class data; the coloured area shows what each model would answer anywhere.
import { C, Q, h, btn, card, page, plot, heat, chart, runner, slider, chips, panel, notice, tryBox, legend, autotest, pct, rgb } from './kit.js';
import { makeData, makeAll, accuracy, selftest, KINDS } from './algo-classify.js';

const DATA = {
  spam: { name: 'Spam filter', x: ['Links in the email', 0, 12], y: ['Words in CAPITALS (%)', 0, 40], c: ['normal email', 'spam'],
    story: 'Each dot is one email. <b>Pink = spam</b>, cyan = normal. Spam usually has more links and more words in capital letters, but the two kinds overlap.',
    why: 'The border between the classes is almost a straight line. The simplest model, <b>logistic regression</b>, is enough here. The flexible models cannot do better: the mistakes that stay come from the overlap of the classes.' },
  loan: { name: 'Loan decisions', x: ['Income (thousand $)', 10, 120], y: ['Debt (thousand $)', 0, 60], c: ['paid back', 'did not pay'],
    story: 'Each dot is one past loan. Cyan = the client paid back, <b>pink = the client did not pay</b>. The border between the two is <b>curved</b>.',
    why: 'A straight line cannot follow a curved border, so <b>logistic regression</b> stays behind. Models that can bend (<b>k-NN</b>, <b>SVM</b>, <b>forest</b>, <b>network</b>) follow the curve.' },
  blood: { name: 'Blood test', x: ['Sugar level', 60, 180], y: ['Blood pressure', 80, 180], c: ['healthy', 'at risk'],
    story: 'Each dot is one patient. Cyan = healthy: both values are in the middle range. <b>Pink = at risk</b>: a value is too low or too high.',
    why: 'The healthy group is in the middle, the risk group is all around it. No straight line can separate inside from outside, so <b>logistic regression</b> fails. <b>Naive Bayes</b> works here, because it gives each class its own spread.' },
  drugs: { name: 'Two medicines', x: ['Dose of medicine A', 0, 100], y: ['Dose of medicine B', 0, 100], c: ['no effect', 'works'],
    story: 'Each dot is one patient. <b>Pink = the treatment works</b>: a high dose of A <i>or</i> a high dose of B. With both high, or both low, there is no effect (cyan).',
    why: 'Here each input alone tells you nothing. Only the <b>two inputs together</b> give the answer. <b>Logistic regression</b> and <b>naive Bayes</b> look at each input separately, so they stay near 50%. A <b>tree</b> solves it with a few cuts.' },
  fraud: { name: 'Card fraud (rare)', x: ['Amount ($)', 0, 2000], y: ['Distance from home (km)', 0, 500], c: ['normal payment', 'fraud'],
    story: 'Each dot is one card payment. <b>Pink = fraud</b>. Only about 7 payments in 100 are fraud. Most fraud is far from home with a large amount, but some fraud looks normal.',
    why: 'Fraud is rare. A model that always answers "normal" is already about 93% right and finds <b>no fraud at all</b>. So accuracy alone is a poor number here. Look at <b>fraud found</b> in each panel.' },
  churn: { name: 'Customers who leave', x: ['Months as a customer', 0, 60], y: ['Calls to support', 0, 20], c: ['stays', 'leaves'],
    story: 'Each dot is one customer. <b>Pink = the customer left</b>. The two groups overlap a lot: these two numbers do not tell the whole story.',
    why: 'The classes overlap a lot, so no model can be much better than about 75% on new data. A flexible model can still reach a high score on the training data, by learning the noise. That is <b>overfitting</b>: compare train and test.' },
};
const METHODS = [
  { id: 'logit', name: 'Logistic regression', color: C.cyan }, { id: 'knn', name: 'k nearest neighbours', color: C.amber }, { id: 'nb', name: 'Naive Bayes', color: C.green },
  { id: 'tree', name: 'Decision tree', color: C.pink }, { id: 'forest', name: 'Random forest', color: C.pink }, { id: 'svm', name: 'SVM (round kernel)', color: C.violet }, { id: 'nn', name: 'Neural network 8+8', color: C.violet },
];
const S = { kind: KINDS.includes(Q.get('data')) ? Q.get('data') : 'loan', n: +Q.get('n') || 400, noise: 1, seed: 1, k: +Q.get('k') || 7, depth: +Q.get('depth') || 4, gamma: 6 };
let data, M = {}, sc = {};
const { side, main } = page({ num: 2, title: 'Classification: where is the border?',
  intro: 'Seven models learn from the same examples. The coloured area shows the answer each model would give at every place. 70% of the points are for learning. 30% are kept hidden for the test.' });

const story = h('p', { class: 'lab-story' });
const pick = chips(KINDS.map(id => ({ id, name: DATA[id].name })), S.kind, id => { S.kind = id; S.seed = 1; newData(); });
const kN = slider({ label: 'Points', min: 200, max: 800, step: 50, value: S.n, oninput: v => { S.n = v; newData(); } });
const kNo = slider({ label: 'Noise', min: 0.5, max: 2.5, step: 0.1, value: 1, fmt: v => '×' + v.toFixed(1), oninput: v => { S.noise = v; newData(); } });
const kK = slider({ label: 'k-NN: neighbours k', min: 1, max: 41, step: 2, value: S.k, oninput: v => { S.k = v; restart(); } });
const kD = slider({ label: 'Tree: max depth', min: 1, max: 12, value: S.depth, oninput: v => { S.depth = v; restart(); } });
const kG = slider({ label: 'SVM: detail', min: 1, max: 40, value: 6, oninput: v => { S.gamma = v; restart(); } });
const leg = h('div');
side.append(card('lab-data', h('h2', {}, '1 · Choose the data'), pick.el, story, leg,
  h('div', { class: 'lab-knobs' }, kN.el, kNo.el, kK.el, kD.el, kG.el), h('div', { class: 'lab-row' }, btn('New data', () => { S.seed++; newData(); }))));
const R = runner({ step, reset: restart0, frame }); side.append(R.el);
const note = notice(); side.append(note.el);
side.append(tryBox([
  'Choose <b>Customers who leave</b>. Set k to 1. Look at train and test for k-NN. Then raise k slowly. Where is the test score best?',
  'Set <b>Tree: max depth</b> to 12 on noisy data. The tree draws small boxes around single points. Is the test score better or worse?',
  'Choose <b>Two medicines</b>. Why do two models stay near 50%? Press <b>Step</b> and watch the tree make its first cuts.',
  'Choose <b>Card fraud</b>. Which model finds the most fraud? Which model has a high accuracy but finds little?']));

const grid = h('div', { class: 'lab-grid', style: { '--cols': 4 } }); main.append(grid);
const P = {};
for (const m of METHODS) { const pl = plot({}), g = heat(46, 46); pl.draw = () => draw(m.id, pl); P[m.id] = { pl, g, ver: -1, pan: panel(m.name, m.color, pl.el) }; grid.append(P[m.id].pan.el); }
const table = h('table', { class: 'lab-table' });
grid.append(h('div', { class: 'lab-panel' }, h('div', { class: 'lab-ptitle', style: { color: C.ink } }, 'Scoreboard: right answers'), table));
const ch = chart({ aspect: 3.2, xlab: 'step', intX: true });
main.append(h('div', { class: 'lab-two' },
  card('', h('h2', {}, 'Loss while learning'), ch.el, h('p', { class: 'lab-story', html: '<b>Loss</b> = how wrong the model is on the training points (0 = perfect). Logistic regression and the network lower it step by step.' })),
  card('', h('h2', {}, 'How each model learns'), h('p', { class: 'lab-story', html: '<b>Logistic regression</b> moves one straight border. <b>k-NN</b> does not learn: it keeps all points and asks the k nearest ones. <b>Naive Bayes</b> measures the mean and spread of each class. A <b>tree</b> adds one cut at a time. A <b>forest</b> adds one tree at a time and the trees vote. The <b>SVM</b> keeps only the points near the border (white rings). The <b>network</b> bends its border a little at every step.' }))));

function newData() {
  data = makeData(S.kind, S.n, S.noise, S.seed); const d = DATA[S.kind];
  story.innerHTML = d.story + ` <span style="color:${C.dim}">(${data.train.length} points to learn, ${data.test.length} to test)</span>`;
  leg.replaceChildren(legend([['dot', C.cyan, d.c[0]], ['dot', C.pink, d.c[1]], ['ring', '#e8ecff', 'ring = test point']]));
  for (const m of METHODS) P[m.id].pl.axes = { x: { name: d.x[0], lo: d.x[1], hi: d.x[2] }, y: { name: d.y[0], lo: d.y[1], hi: d.y[2] } };
  restart();
}
function restart0() { M = makeAll(data, { k: S.k, depth: S.depth, fdepth: Math.max(S.depth, 6), gamma: S.gamma, seed: S.seed }); sc = {}; for (const m of METHODS) { P[m.id].ver = -1; score(m.id); } }
function restart() { restart0(); R.clear(); frame(); }
function score(id) { sc[id] = { tr: accuracy(M[id], data, data.train), te: accuracy(M[id], data, data.test) }; }
function step() {
  let all = true;
  for (const m of METHODS) { const a = M[m.id]; if (!a.done) { a.step(); score(m.id); } if (!a.done) all = false; }
  return all;
}
const c0 = rgb(C.cyan), c1 = rgb(C.pink);
function draw(id, pl) {
  const a = M[id], p = P[id], g = p.g, { X, y, n } = data, isTest = new Uint8Array(n); if (!a) return; for (const i of data.test) isTest[i] = 1;
  if (p.ver !== a.ver || p.xr !== pl.W) {
    for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) { const q = a.iter ? a.prob(g.gx(i, pl), g.gy(j, pl)) : 0.5, o = 4 * (j * g.w + i), t = Math.abs(q - 0.5) * 2; g.d[o] = c0[0] + (c1[0] - c0[0]) * q; g.d[o + 1] = c0[1] + (c1[1] - c0[1]) * q; g.d[o + 2] = c0[2] + (c1[2] - c0[2]) * q; g.d[o + 3] = a.iter ? 60 + 110 * t : 0; }
    g.flush(); p.ver = a.ver; p.xr = pl.W;
  }
  pl.heat(g, 0.62, true);
  const r = pl.W < 240 ? 1.6 : 2.3;
  if (id === 'svm' && a.iter) { const ctx = pl.ctx; ctx.strokeStyle = '#ffffffcc'; ctx.lineWidth = 1; ctx.beginPath(); data.train.forEach((pi, q) => { if (a.isSV(q)) { const x = pl.px(X[2 * pi]), yy = pl.py(X[2 * pi + 1]); ctx.moveTo(x + r + 2, yy); ctx.arc(x, yy, r + 2, 0, 6.2832); } }); ctx.stroke(); }
  pl.dots(X, n, i => y[i] ? C.pink : C.cyan, r, i => isTest[i]);
  if (id === 'logit' && a.iter) { const [w0, w1] = a.w, b = a.b; if (Math.abs(w1) > 1e-6) pl.path([[-1.3, -(w0 * -1.3 + b) / w1], [1.3, -(w0 * 1.3 + b) / w1]], '#ffffff', 1.6); else if (Math.abs(w0) > 1e-6) pl.path([[-b / w0, -1.3], [-b / w0, 1.3]], '#ffffff', 1.6); }
}
function frame() {
  for (const m of METHODS) {
    const a = M[m.id], s = sc[m.id], gap = s.tr.acc - s.te.acc;
    let l2 = a.iter ? `train <b>${pct(s.tr.acc)}</b> · test <b class="${gap > 0.08 ? 'bad' : ''}">${pct(s.te.acc)}</b>` : 'not started';
    if (S.kind === 'fraud' && a.iter) l2 += ` · fraud found <b class="${s.te.found < s.te.pos * 0.5 ? 'bad' : 'ok'}">${s.te.found} of ${s.te.pos}</b>`;
    P[m.id].pan.stat(a.info() + '<br>' + l2); P[m.id].pan.note(a.done ? '✓ done' : ''); P[m.id].pl.redraw();
  }
  ch.set([{ name: 'logistic regression', color: C.cyan, data: M.logit.hist }, { name: 'neural network (every 10 steps)', color: C.violet, data: M.nn.hist }], { ymin: 0, xmax: 20 });
  const rows = METHODS.map(m => { const s = sc[m.id], on = M[m.id].iter > 0; return `<tr><td style="color:${m.color}">${m.name.replace(' (round kernel)', '').replace('k nearest neighbours', 'k-NN').replace(' 8+8', '')}</td><td class="num">${on ? pct(s.tr.acc) : '–'}</td><td class="num"><b>${on ? pct(s.te.acc) : '–'}</b></td></tr><tr><td colspan="3" style="border:0;padding-top:0"><div class="lab-bar"><i style="width:${on ? s.te.acc * 100 : 0}%;background:${m.color}"></i></div></td></tr>`; });
  const html = '<tr><th>Model</th><th>Train</th><th>Test</th></tr>' + rows.join(''); if (table._h !== html) { table._h = html; table.innerHTML = html; }
  note.set(notes());
}
function notes() {
  const d = DATA[S.kind], out = [], allDone = METHODS.every(m => M[m.id].done), name = id => METHODS.find(m => m.id === id).name;
  if (!R.count) out.push(`Press <b>Play</b>. Filled dots are the ${data.train.length} points the models learn from. Rings are the ${data.test.length} test points the models never see while learning.`);
  out.push(d.why);
  if (!allDone) { if (R.count) out.push('The coloured area changes while a model learns. Strong colour = the model is sure. Pale colour = the model is not sure.'); return out; }
  const ord = METHODS.map(m => [m.id, sc[m.id].te.acc, sc[m.id].tr.acc]).sort((a, b) => b[1] - a[1]), best = ord[0], worst = ord[ord.length - 1];
  const one = 1 / data.test.length, top = ord.filter(o => o[1] >= best[1] - 1.5 * one - 1e-9);
  out.push(`<b>Result on the test points:</b> best: ${top.slice(0, 4).map(o => `<b>${name(o[0])}</b> (${pct(o[1])})`).join(', ')}${top.length > 4 ? ' and others' : ''}. Lowest: ${name(worst[0])} (${pct(worst[1])}). With ${data.test.length} test points, one point is worth ${(one * 100).toFixed(1)}%, so small differences are luck.`);
  const gaps = ord.map(o => [o[0], o[2] - o[1], o[2], o[1]]).sort((a, b) => b[1] - a[1]), g = gaps[0];
  if (g[1] > 0.07) { const fix = { knn: 'Try a larger k.', tree: 'Try a smaller depth.', forest: '', svm: 'Try less SVM detail.', nn: '' }[g[0]] || ''; out.push(`<b>Overfitting:</b> ${name(g[0])} is right on ${pct(g[2])} of its training points but only ${pct(g[3])} of the test points. It learned details of the training points that are only chance. ${fix}`); }
  else out.push(`No strong overfitting here: for every model the train and test scores are close (largest gap ${Math.round(Math.max(0, g[1]) * 100)} points).`);
  if (S.kind === 'fraud') { const f = METHODS.map(m => [m.id, sc[m.id].te.found, sc[m.id].te.alarms]).sort((a, b) => b[1] - a[1]), pos = sc.logit.te.pos; out.push(`There are ${pos} fraud cases in the test points. ${name(f[0][0])} finds ${f[0][1]} (with ${f[0][2]} false alarm${f[0][2] === 1 ? '' : 's'}), ${name(f[f.length - 1][0])} finds ${f[f.length - 1][1]}. All models have a high accuracy, because the normal payments are easy.`); }
  if (S.k === 1) out.push('With k = 1, k-NN is always 100% right on its training points: every point is its own nearest neighbour. That number says nothing about new data.');
  if (sc.logit.te.acc >= best[1] - 2.5 * one && S.kind !== 'fraud') out.push('The simplest model (one straight line) is as good as the best model here. When a simple model is enough, prefer it: it is easier to explain.');
  return out;
}

newData();
if (Q.get('autotest')) autotest('classification', async t => {
  selftest(t, true);
  for (const kind of KINDS) for (const n of [200, 800]) {
    S.kind = kind; S.n = n; pick.set(kind); kN.set(n); newData(); const g = R.runAll(3000);
    t.ok(METHODS.every(m => M[m.id].done), `${kind} n=${n}: every model finishes (${g} steps)`);
    t.ok(METHODS.every(m => sc[m.id].te.acc >= 0.3 && sc[m.id].te.acc <= 1 && sc[m.id].tr.acc >= 0.3), `${kind} n=${n}: accuracies are sensible`);
    t.ok(notes().length >= 3, `${kind} n=${n}: notice text`);
    t.log(`${kind} n=${n}: ` + METHODS.map(m => `${m.id} ${pct(sc[m.id].tr.acc)}/${pct(sc[m.id].te.acc)}`).join(' | '));
    await new Promise(r => setTimeout(r, 0));
  }
  S.kind = 'loan'; S.n = 400; pick.set('loan'); kN.set(400); newData();
}); else R.auto();
