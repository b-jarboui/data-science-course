// Lab 5: a big neural network. Four networks learn the same data side by side; one thing is different between them.
import { C, PAL, Q, h, btn, card, page, plot, heat, chart, runner, slider, select, chips, panel, notice, tryBox, legend, autotest, pct, rgb } from './kit.js';
import { makeData, learner, render, selftest, KINDS, G } from './algo-network.js';

const DATA = {
  digits: { name: 'Digit images', story: 'Each example is a small image of a hand-written digit, 12 × 12 = <b>144 numbers</b>. The network must say which digit it is (0 to 9). This is how a real image classifier starts. Green frame = right answer on a test image, pink frame = wrong.',
    why: 'An image is only a long list of numbers for the network. Nobody tells it what a "7" looks like: it finds useful patterns of pixels by itself. Look at <b>Inside the network</b>: each small picture shows what one neuron of layer 1 has learned to look at.' },
  spiral2: { name: 'Two spirals', story: 'Two classes wind around each other. Each dot has two inputs (its position). This is a famous hard test for a network.',
    why: 'The border between the spirals must turn many times. A small network does not have enough pieces to build it. Compare by <b>Network size</b> to see it.' },
  spiral3: { name: 'Three spirals', story: 'Three classes in three spiral arms. The network has three outputs, one per class, and chooses the largest.',
    why: 'Each hidden layer bends the space a little more. With several layers the network can turn three curved arms into three areas.' },
  rings: { name: 'Three rings', story: 'A centre and two rings around it: three classes, one inside the other.',
    why: 'No straight line separates rings. The network must close its border into a loop. Watch how each activation builds the loop.' },
  checker: { name: 'Checkerboard', story: 'A 3 × 3 checkerboard: the class changes every time you cross a line of the board.',
    why: 'The borders are straight with sharp corners. <b>ReLU</b> builds its border from straight pieces, so it fits corners well. <b>tanh</b> and <b>sigmoid</b> round the corners.' },
};
const ACT = { relu: 'ReLU', tanh: 'tanh', sigmoid: 'sigmoid', leaky: 'leaky ReLU' };
const MODES = [{ id: 'act', name: 'Activation' }, { id: 'size', name: 'Network size' }, { id: 'lr', name: 'Learning rate' }];
const COL = [C.cyan, C.amber, C.pink, C.green], MAXS = 500;
const S = { kind: KINDS.includes(Q.get('data')) ? Q.get('data') : 'digits', mode: ['act', 'size', 'lr'].includes(Q.get('mode')) ? Q.get('mode') : 'act', n: 1000, noise: 1, seed: 1, layers: +Q.get('layers') || 3, width: 16, act: 'relu', lr: 0.01, opt: Q.get('opt') === 'sgd' ? 'sgd' : 'adam', view: 0 };
if (S.opt === 'sgd') S.lr = 0.1;
let data, Ls = [], cfgs = [], frameNo = 0, tiles = [], drawn = null;
const { side, main } = page({ num: 5, title: 'A big neural network at work',
  intro: 'Four neural networks learn the same data at the same time. They are the same, except for one thing that you choose: the activation function, the size, or the learning rate.' });

const story = h('p', { class: 'lab-story' });
const pick = chips(KINDS.map(id => ({ id, name: DATA[id].name })), S.kind, id => { S.kind = id; S.n = id === 'digits' ? 1000 : 500; kN.set(S.n, id === 'digits' ? [300, 2000, 100] : [200, 1000, 50]); newData(); });
const pickMode = chips(MODES, S.mode, id => { S.mode = id; restart(); });
const kN = slider({ label: 'Examples', min: 300, max: 2000, step: 100, value: S.n, oninput: v => { S.n = v; newData(); } });
const kNo = slider({ label: 'Noise', min: 0.3, max: 2.5, step: 0.1, value: 1, fmt: v => '×' + v.toFixed(1), oninput: v => { S.noise = v; newData(); } });
const kL = slider({ label: 'Hidden layers', min: 1, max: 6, value: S.layers, oninput: v => { S.layers = v; restart(); } });
const kW = slider({ label: 'Neurons per layer', min: 4, max: 32, step: 4, value: S.width, oninput: v => { S.width = v; restart(); } });
const lrFmt = v => { const x = Math.pow(10, v); return x >= 0.1 ? x.toFixed(2) : x >= 0.01 ? x.toFixed(3) : x.toFixed(4); };
const kLr = slider({ label: 'Learning rate', min: -4, max: 0.5, step: 0.05, value: Math.log10(S.lr), fmt: lrFmt, oninput: v => { S.lr = Math.pow(10, v); restart(); } });
const kAct = select({ label: 'Activation', options: Object.entries(ACT).map(([id, name]) => ({ id, name })), value: S.act, onchange: v => { S.act = v; restart(); } });
const kOpt = select({ label: 'Optimizer', options: [{ id: 'adam', name: 'Adam' }, { id: 'sgd', name: 'Plain gradient descent' }, { id: 'momentum', name: 'Momentum' }], value: S.opt, onchange: v => { S.opt = v; S.lr = v === 'adam' ? 0.01 : v === 'sgd' ? 0.1 : 0.03; kLr.set(Math.log10(S.lr)); restart(); } });
const leg = h('div');
side.append(card('lab-data', h('h2', {}, '1 · Choose the data'), pick.el, story, leg,
  h('h2', { style: { marginTop: '.6rem' } }, '2 · What is different between the four?'), pickMode.el,
  h('div', { class: 'lab-knobs' }, kL.el, kW.el, kAct.el, kOpt.el, kLr.el, kN.el, kNo.el), h('div', { class: 'lab-row' }, btn('New data', () => { S.seed++; newData(); }))));
const R = runner({ step, reset: restart0, frame }); side.append(R.el);
const note = notice(); side.append(note.el);
side.append(tryBox([
  'Choose <b>Three spirals</b>, compare by <b>Activation</b>, set the optimizer to <b>Plain gradient descent</b> and use 6 hidden layers. Which network does not start to learn? Look at "signal at layer 1".',
  'Compare by <b>Network size</b> on <b>Two spirals</b>. Which is the smallest network that separates the spirals?',
  'Compare by <b>Learning rate</b>. One network learns too slowly and one breaks. Find them in the loss chart.',
  'Choose <b>Digit images</b> and draw your own digit in the box. Do the four networks agree?']));

const grid = h('div', { class: 'lab-grid', style: { '--cols': 4 } }); main.append(grid);
const P = [];
for (let q = 0; q < 4; q++) { const pl = plot({}), g = heat(34, 34); pl.draw = () => draw(q, pl); P.push({ pl, g, dirty: true, pan: panel('', COL[q], pl.el) }); grid.append(P[q].pan.el); }
const chLoss = chart({ aspect: 2.3, xlab: 'step', log: true }), chAcc = chart({ aspect: 2.3, xlab: 'step', yfmt: v => Math.round(v * 100) + '%' });
main.append(h('div', { class: 'lab-two' },
  card('', h('h2', {}, 'Loss on the test examples'), chLoss.el, h('p', { class: 'lab-story', html: '<b>Loss</b> = how wrong the network is (lower is better). One step = 4 small batches of 32 examples. When the test loss goes up again while training continues, the network is overfitting.' })),
  card('', h('h2', {}, 'Right answers on the test examples'), chAcc.el, h('p', { class: 'lab-story', html: 'The test examples are never used for learning. They show how good the network is on new data.' }))));
// inside the network
const viewPick = chips([0, 1, 2, 3].map(i => ({ id: i, name: 'Network ' + (i + 1) })), 0, id => { S.view = id; inside.redraw(); });
const inside = plot({ aspect: 2.6 }); inside.draw = drawInside;
const insideText = h('p', { class: 'lab-story' });
main.append(card('', h('h2', {}, 'Inside the network'), viewPick.el, h('div', { style: { marginTop: '.5rem' } }, inside.el), insideText));
main.lastChild.style.marginTop = '.55rem';
// draw your own digit
const pad = plot({ aspect: 1 }); pad.el.classList.add('tap'); pad.el.style.maxWidth = '13rem';
let strokes = [], cur = null; const mine = new Float64Array(G * G), padOut = h('div', { class: 'lab-stat' });
const padCard = card('', h('h2', {}, 'Draw your own digit'), h('div', { class: 'lab-two', style: { marginTop: 0, alignItems: 'start' } }, h('div', {}, pad.el, h('div', { class: 'lab-row' }, btn('Clear', () => { strokes = []; drawn = null; pad.redraw(); padRead(); }))), h('div', {}, h('p', { class: 'lab-story', style: { marginTop: 0 } }, 'Draw one digit with the mouse or a finger. Your drawing is centred and reduced to 12 × 12 pixels, then every network reads it. The networks only know digits written like their training images, so a strange drawing can fool them.'), padOut)));
padCard.style.marginTop = '.55rem'; main.append(padCard);
const padPt = e => { const r = pad.cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
pad.cv.addEventListener('pointerdown', e => { e.preventDefault(); pad.cv.setPointerCapture(e.pointerId); cur = [padPt(e)]; strokes.push(cur); pad.redraw(); });
pad.cv.addEventListener('pointermove', e => { if (!cur) return; cur.push(padPt(e)); pad.redraw(); });
const padUp = () => { if (!cur) return; if (cur.length === 1) cur.push([cur[0][0] + 0.001, cur[0][1]]); cur = null; padRead(); };
pad.cv.addEventListener('pointerup', padUp); pad.cv.addEventListener('pointercancel', padUp);
pad.draw = () => {
  const ctx = pad.ctx, W = pad.W, Hh = pad.H; ctx.strokeStyle = '#1c2647'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 1; i < G; i++) { ctx.moveTo(i / G * W, 0); ctx.lineTo(i / G * W, Hh); ctx.moveTo(0, i / G * Hh); ctx.lineTo(W, i / G * Hh); } ctx.stroke();
  if (drawn) for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const v = mine[j * G + i]; if (v > 0.02) { ctx.fillStyle = `rgba(90,215,232,${v * 0.45})`; ctx.fillRect(i / G * W, j / G * Hh, W / G + .5, Hh / G + .5); } }
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(3, W / 22); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); for (const s of strokes) s.forEach((p, i) => i ? ctx.lineTo(p[0] * W, p[1] * Hh) : ctx.moveTo(p[0] * W, p[1] * Hh)); ctx.stroke();
  if (!strokes.length) { ctx.fillStyle = '#7d89b0'; ctx.font = '600 13px "Segoe UI", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('draw here', W / 2, Hh / 2); }
};
function padRead() {
  if (!strokes.length || data.kind !== 'digits') { drawn = null; padOut.innerHTML = ''; return; }
  // centre the drawing and bring it to the size of the training digits (height 0.76 of the box)
  let x0 = 1, x1 = 0, y0 = 1, y1 = 0; for (const s of strokes) for (const p of s) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const sc = Math.min(0.76 / Math.max(y1 - y0, 0.05), 0.5 / Math.max(x1 - x0, 0.05)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  render(strokes.map(s => s.map(p => [0.5 + (p[0] - cx) * sc, 0.5 + (p[1] - cy) * sc])), 0.06, mine, 0); drawn = true; pad.redraw();
  padOut.innerHTML = Ls.map((L, q) => { const o = L.net.fwd(mine, 0); let b = 0; for (let j = 1; j < 10; j++) if (o[j] > o[b]) b = j; return `<span style="color:${COL[q]}">${label(q)}</span>: reads <b style="font-size:1.1rem">${b}</b> · sure ${pct(o[b])}`; }).join('<br>');
}

function configs() {
  const base = { layers: S.layers, width: S.width, act: S.act, lr: S.lr, opt: S.opt };
  if (S.mode === 'act') return ['relu', 'tanh', 'sigmoid', 'leaky'].map(act => ({ ...base, act }));
  if (S.mode === 'size') return [[1, 4], [2, 8], [3, 16], [4, 32]].map(([layers, width]) => ({ ...base, layers, width }));
  return (S.opt === 'adam' ? [0.0003, 0.003, 0.03, 0.3] : [0.003, 0.03, 0.3, 3]).map(lr => ({ ...base, lr }));
}
const label = q => S.mode === 'act' ? ACT[cfgs[q].act] : S.mode === 'size' ? `${cfgs[q].layers} × ${cfgs[q].width} neurons` : `rate ${cfgs[q].lr}`;
function newData() {
  data = makeData(S.kind, S.n, S.noise, S.seed); const d = DATA[S.kind];
  story.innerHTML = d.story + ` <span style="color:${C.dim}">(${data.train.length} examples to learn, ${data.test.length} to test)</span>`;
  leg.replaceChildren(S.kind === 'digits' ? '' : legend([...Array(data.k).keys()].map(c => ['dot', PAL[c], 'class ' + (c + 1)]).concat([['ring', '#e8ecff', 'ring = test']])));
  padCard.style.display = S.kind === 'digits' ? '' : 'none';
  for (const p of P) p.pl.el.style.aspectRatio = '1';
  // small pictures of the first test digits, made once
  tiles = []; if (S.kind === 'digits') for (let q = 0; q < Math.min(30, data.test.length); q++) { const id = data.test[q], t = heat(G, G); for (let i = 0; i < G * G; i++) { const v = data.X[id * data.dim + i] * 255; t.d[4 * i] = v; t.d[4 * i + 1] = v; t.d[4 * i + 2] = v; t.d[4 * i + 3] = 255; } t.flush(); tiles.push({ id, cv: t.cv }); }
  restart();
}
function restart0() {
  cfgs = configs(); Ls = cfgs.map(c => learner(data, c, S.seed)); frameNo = 0;
  kAct.el.style.opacity = S.mode === 'act' ? .4 : 1; kL.el.style.opacity = kW.el.style.opacity = S.mode === 'size' ? .4 : 1; kLr.el.style.opacity = S.mode === 'lr' ? .4 : 1;
  P.forEach((p, q) => { p.dirty = true; });
}
function restart() { restart0(); R.clear(); frame(); padRead(); }
function step() {
  for (const L of Ls) L.step(4);
  const st = Ls[0].steps;                                  // measure one network per step in turn (keeps every step short)
  Ls.forEach((L, q) => { if (!L.broke && (st % 4 === q || st >= MAXS)) L.measure(); });
  return Ls[0].steps >= MAXS || Ls.every(L => L.broke);
}
const mix = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
function draw(q, pl) {
  const L = Ls[q], N = L && L.net, ctx = pl.ctx; if (!L) return;
  if (S.kind === 'digits') {
    const cols = 6, rows = 5, tw = pl.W / cols, th = pl.H / rows, one = Math.min(tw, th) - 6; ctx.imageSmoothingEnabled = false;
    tiles.forEach((t, i) => { const x = (i % cols) * tw + (tw - one) / 2, y = Math.floor(i / cols) * th + (th - one) / 2, o = N.fwd(data.X, t.id * data.dim); let b = 0; for (let j = 1; j < 10; j++) if (o[j] > o[b]) b = j; const ok = b === data.y[t.id];
      ctx.drawImage(t.cv, x, y, one, one); ctx.strokeStyle = L.steps ? (ok ? C.green : C.pink) : '#344264'; ctx.lineWidth = ok ? 1.5 : 2.5; ctx.strokeRect(x, y, one, one);
      if (L.steps) { const fs = Math.max(9, one * 0.36); ctx.font = `700 ${fs}px Consolas, monospace`; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillStyle = '#050814cc'; ctx.fillRect(x + one - fs * 0.75, y + one - fs, fs * 0.75, fs); ctx.fillStyle = ok ? C.green : C.pink; ctx.fillText(b, x + one - 1, y + one + 1); } });
    return;
  }
  const p = P[q], g = p.g, one = new Float64Array(2);
  if (p.dirty) { for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) { one[0] = g.gx(i, pl); one[1] = g.gy(j, pl); const o = N.fwd(one, 0); let b = 0; for (let c = 1; c < data.k; c++) if (o[c] > o[b]) b = c; const col = rgb(PAL[b]), conf = (o[b] - 1 / data.k) / (1 - 1 / data.k), k = 4 * (j * g.w + i); g.d[k] = col[0]; g.d[k + 1] = col[1]; g.d[k + 2] = col[2]; g.d[k + 3] = L.steps ? 50 + 130 * conf : 0; } g.flush(); p.dirty = false; }
  pl.heat(g, 0.6, true);
  const isTest = new Uint8Array(data.n); for (const i of data.test) isTest[i] = 1;
  pl.dots(data.X, data.n, i => PAL[data.y[i]], pl.W < 240 ? 1.5 : 2.1, i => isTest[i]);
}
// what the hidden neurons react to
function drawInside(pl) {
  const L = Ls[S.view], N = L && L.net, ctx = pl.ctx; if (!L) return; const pos = rgb(C.cyan), neg = rgb(C.pink);
  const groups = []; // [{title, n, size, value(neuron, pixel)}]
  if (S.kind === 'digits') { const w = N.W[0], n = Math.min(N.sizes[1], 32); groups.push({ title: `layer 1 (${n} neurons): what each neuron has learned to look at`, n, size: G, val: (u, px) => w[u * data.dim + px] - L.w0[u * data.dim + px] }); }
  else { const gs = 18, one = new Float64Array(2), l1 = N.sizes[1], lk = N.sizes[N.L - 1], a1 = new Float64Array(l1 * gs * gs), ak = new Float64Array(lk * gs * gs);
    for (let j = 0; j < gs; j++) for (let i = 0; i < gs; i++) { one[0] = -1.15 + 2.3 * (i + .5) / gs; one[1] = 1.15 - 2.3 * (j + .5) / gs; N.fwd(one, 0); for (let u = 0; u < l1; u++) a1[u * gs * gs + j * gs + i] = N.A[1][u]; for (let u = 0; u < lk; u++) ak[u * gs * gs + j * gs + i] = N.A[N.L - 1][u]; }
    groups.push({ title: `layer 1 (${Math.min(l1, 16)} neurons): simple edges`, n: Math.min(l1, 16), size: gs, val: (u, px) => a1[u * gs * gs + px] });
    if (N.L > 2) groups.push({ title: `last hidden layer ${N.L - 1} (${Math.min(lk, 16)} neurons): shapes`, n: Math.min(lk, 16), size: gs, val: (u, px) => ak[u * gs * gs + px] }); }
  let cols = 4, tw = 0; for (let c = 4; c <= 32; c++) { const rowsN = groups.reduce((s, g) => s + Math.ceil(g.n / c), 0), w = Math.min(pl.W / c, (pl.H - 20 * groups.length) / rowsN); if (w > tw) { tw = w; cols = c; } }
  const sz = tw - 4; let y = 2; ctx.imageSmoothingEnabled = S.kind !== 'digits';
  for (const g of groups) {
    ctx.fillStyle = '#aab4d6'; ctx.font = '600 11px "Segoe UI", Arial, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(g.title, 4, y); y += 16;
    for (let u = 0; u < g.n; u++) { const t = heat(g.size, g.size); let m = 1e-9; for (let px = 0; px < g.size * g.size; px++) m = Math.max(m, Math.abs(g.val(u, px)));
      for (let px = 0; px < g.size * g.size; px++) { const v = g.val(u, px) / m, c = v >= 0 ? pos : neg, a = Math.abs(v); t.d[4 * px] = 10 + (c[0] - 10) * a; t.d[4 * px + 1] = 15 + (c[1] - 15) * a; t.d[4 * px + 2] = 31 + (c[2] - 31) * a; t.d[4 * px + 3] = 255; } t.flush();
      ctx.drawImage(t.cv, (u % cols) * tw + 2, y + Math.floor(u / cols) * tw, sz, sz); }
    y += Math.ceil(g.n / cols) * tw + 2;
  }
}
const sig = v => v === 0 ? '0' : v < 0.001 ? v.toExponential(1) : v.toFixed(4);
function frame() {
  frameNo++;
  Ls.forEach((L, q) => {
    const p = P[q], c = cfgs[q];
    const ttl = p.pan.el.querySelector('.lab-ptitle span'); if (ttl.textContent !== label(q)) ttl.textContent = label(q);
    p.pan.note(L.broke ? 'broke' : L.steps >= MAXS ? '✓ done' : '', L.broke ? C.pink : '');
    const gap = L.tr.acc - L.te.acc;
    p.pan.stat(L.broke ? `<b class="bad">The numbers exploded.</b> The learning rate is too large.<br>step ${L.steps}` :
      `train <b>${pct(L.tr.acc)}</b> · test <b class="${gap > 0.1 ? 'bad' : ''}">${pct(L.te.acc)}</b><br>loss <b>${L.te.loss.toFixed(3)}</b> · ${L.net.weights()} weights<br>signal at layer 1: <b>${L.steps ? sig(L.g1) : '–'}</b>`);
    if (!R.playing || q === frameNo % 4 || S.kind === 'digits') p.dirty = true;
    p.pl.redraw();
  });
  const ser = k => Ls.map((L, q) => ({ name: label(q), color: COL[q], xs: L.hist.step, data: L.hist[k] }));
  chLoss.set(ser('testLoss'), { xmax: 50, ymin: 0.05 }); chAcc.set(ser('testAcc'), { xmax: 50, ymin: 0, ymax: 1 });
  if (!R.playing || frameNo % 6 === 0) inside.redraw();
  const itx = S.kind === 'digits' ? `Each small picture belongs to one neuron of layer 1 of <b style="color:${COL[S.view]}">${label(S.view)}</b>. The picture shows how the neuron changed its 144 weights since the start. <b style="color:${C.cyan}">Cyan</b> pixels: ink here now pushes the neuron up more. <b style="color:${C.pink}">Pink</b> pixels: ink here pushes it down more. Before learning the pictures are empty. A picture in one flat colour is a neuron that reacts the same way to every pixel: with ReLU such a neuron has often switched off.`
    : `Each small picture shows where one neuron of <b style="color:${COL[S.view]}">${label(S.view)}</b> is active on the map (<b style="color:${C.cyan}">cyan</b> = positive, <b style="color:${C.pink}">pink</b> = negative). Neurons of layer 1 can only split the map with one straight edge. Deeper neurons combine these edges into curved shapes.`;
  if (insideText._h !== itx) { insideText._h = itx; insideText.innerHTML = itx; }
  note.set(notes());
}
function notes() {
  const d = DATA[S.kind], out = [], st = Ls[0].steps, name = q => `<b>${label(q)}</b>`;
  if (!st) out.push(`Press <b>Play</b>. Four networks start from the same random weights and see the same examples in the same order. Each one has ${cfgs.map((c, q) => Ls[q].net.weights()).filter((v, i, a) => a.indexOf(v) === i).join(' / ')} weights to learn.`);
  out.push(d.why);
  if (S.mode === 'act') out.push('<b>ReLU</b> and <b>leaky ReLU</b> pass positive numbers as they are and cut (or shrink) negative numbers. <b>tanh</b> squeezes every number between −1 and 1, <b>sigmoid</b> between 0 and 1.');
  if (S.mode === 'size') out.push('A network with more layers and neurons can build more complex borders. It also has many more weights, so it needs more examples and can overfit.');
  if (S.mode === 'lr') out.push('The learning rate is the size of each change of the weights. Too small: learning takes very long. Too large: every step jumps too far and the loss does not settle or explodes.');
  if (!st) return out;
  const alive = Ls.map((L, q) => q).filter(q => !Ls[q].broke), ord = alive.slice().sort((a, b) => Ls[b].te.acc - Ls[a].te.acc || Ls[a].te.loss - Ls[b].te.loss);
  if (ord.length) out.push(`<b>After ${st} steps</b> (${(Ls[0].seen / data.train.length).toFixed(1)} passes over the data): best on the test examples: ${name(ord[0])} with ${pct(Ls[ord[0]].te.acc)}` + (ord.length > 1 ? `. Last: ${name(ord[ord.length - 1])} with ${pct(Ls[ord[ord.length - 1]].te.acc)}.` : '.'));
  const broke = Ls.map((L, q) => q).filter(q => Ls[q].broke); if (broke.length) out.push(`${broke.map(name).join(', ')} broke: the weights grew until the numbers were too large for the computer.`);
  if (S.mode === 'act' && alive.includes(2)) { const sg = Ls[2], others = alive.filter(q => q !== 2), bestO = Math.max(...others.map(q => Ls[q].te.acc)), gO = Math.max(...others.map(q => Ls[q].g1));
    if (sg.te.acc < bestO - 0.1 && sg.g1 < gO / 5) out.push(`<b>Sigmoid is behind.</b> Its learning signal at layer 1 is ${sig(sg.g1)}, the others have up to ${sig(gO)}. The slope of the sigmoid is at most 0.25, so the signal shrinks at each of the ${cfgs[2].layers} layers on its way back. This is called the <b>vanishing gradient</b>. It is the reason why deep networks use ReLU.`);
    else if (cfgs[0].opt === 'adam') out.push('With the <b>Adam</b> optimizer all four activations learn here, because Adam enlarges small signals. Switch the optimizer to <b>Plain gradient descent</b> and add layers to see the difference between the activations.'); }
  const of = alive.map(q => [q, Ls[q].tr.acc - Ls[q].te.acc]).sort((a, b) => b[1] - a[1])[0];
  if (of && of[1] > 0.08) out.push(`<b>Overfitting:</b> ${name(of[0])} is right on ${pct(Ls[of[0]].tr.acc)} of its training examples but only ${pct(Ls[of[0]].te.acc)} of the test examples. More examples help: move <b>Examples</b> up.`);
  if (S.mode === 'size' && alive.length === 4 && Ls[0].te.acc < Ls[3].te.acc - 0.1) out.push(`The smallest network (${Ls[0].net.weights()} weights) stays at ${pct(Ls[0].te.acc)}: it is too simple for this data (underfitting). The largest has ${Ls[3].net.weights()} weights.`);
  return out;
}

kN.set(S.n, S.kind === 'digits' ? [300, 2000, 100] : [200, 1000, 50]);
if (S.kind !== 'digits') { S.n = 500; kN.set(500); }
newData();
if (Q.get('autotest')) autotest('big network', async t => {
  selftest(t, true);
  for (const kind of KINDS) for (const mode of ['act', 'size', 'lr']) {
    S.kind = kind; S.mode = mode; S.n = kind === 'digits' ? 500 : 300; pick.set(kind); pickMode.set(mode); newData(); R.runAll(kind === 'digits' ? 150 : 250); for (const L of Ls) if (!L.broke) L.measure(); frame();
    const alive = Ls.filter(L => !L.broke);
    t.ok(alive.length >= 3 && alive.every(L => Number.isFinite(L.te.loss)), `${kind} / ${mode}: networks train without error`);
    t.ok(Math.max(...alive.map(L => L.te.acc)) > (kind === 'spiral2' ? 0.6 : 0.8), `${kind} / ${mode}: the best network learns the task`);
    if (mode !== 'lr') t.ok(alive.every(L => L.hist.trainLoss[L.hist.trainLoss.length - 1] < L.hist.trainLoss[0]), `${kind} / ${mode}: training loss goes down for every network`);
    t.ok(notes().length >= 3, `${kind} / ${mode}: notice text`);
    t.log(`${kind} / ${mode}: ` + Ls.map((L, q) => `${label(q)} ${L.broke ? 'broke' : pct(L.tr.acc) + '/' + pct(L.te.acc)}`).join(' | '));
    await new Promise(r => setTimeout(r, 0));
  }
  S.kind = 'digits'; S.mode = 'act'; S.n = 1000; pick.set('digits'); pickMode.set('act'); newData();
}); else R.auto();
