// Data of Lab 5 (pure maths): hard 2-D shapes and small images of hand-written-like digits.
import { rng } from './kit.js';
import { mlp } from './mlp.js';

export const KINDS = ['digits', 'spiral2', 'spiral3', 'rings', 'checker'];
export const G = 12;                                       // a digit image is 12 x 12 = 144 numbers (0 = dark, 1 = ink)
// pen strokes of the ten digits in a 1 x 1 box (x to the right, y down)
const oval = Array.from({ length: 17 }, (_, i) => [0.5 + 0.21 * Math.sin(i / 16 * 2 * Math.PI), 0.5 - 0.37 * Math.cos(i / 16 * 2 * Math.PI)]);
export const STROKES = [
  [oval],
  [[[.36, .3], [.53, .12], [.53, .88]]],
  [[[.28, .3], [.33, .17], [.5, .12], [.67, .18], [.7, .33], [.6, .5], [.28, .88], [.74, .88]]],
  [[[.28, .18], [.5, .12], [.68, .2], [.68, .38], [.5, .48], [.7, .6], [.7, .78], [.5, .88], [.28, .82]]],
  [[[.62, .88], [.62, .12], [.26, .62], [.76, .62]]],
  [[[.7, .12], [.32, .12], [.3, .46], [.5, .42], [.68, .52], [.7, .72], [.52, .88], [.28, .82]]],
  [[[.66, .14], [.44, .2], [.3, .45], [.3, .7], [.42, .87], [.6, .86], [.7, .7], [.62, .54], [.44, .52], [.3, .62]]],
  [[[.27, .12], [.73, .12], [.45, .88]]],
  [[[.5, .48], [.34, .38], [.34, .22], [.5, .12], [.66, .22], [.66, .38], [.5, .48], [.3, .6], [.3, .76], [.5, .88], [.7, .76], [.7, .6], [.5, .48]]],
  [[[.7, .38], [.56, .48], [.4, .46], [.3, .32], [.38, .16], [.56, .12], [.7, .24], [.7, .38], [.68, .66], [.56, .84], [.34, .86]]],
];
// draw pen strokes into a 12 x 12 image: a pixel is bright when it is close to a stroke
export function render(strokes, thick, out, off) {
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
    const px = (i + .5) / G, py = (j + .5) / G; let best = Infinity;
    for (const s of strokes) for (let q = 1; q < s.length; q++) { const ax = s[q - 1][0], ay = s[q - 1][1], bx = s[q][0], by = s[q][1], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, u = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)) : 0, d = Math.hypot(px - ax - u * dx, py - ay - u * dy); if (d < best) best = d; }
    out[off + j * G + i] = Math.max(0, Math.min(1, 1 - (best - thick) / 0.07));
  }
}
// one digit, written a little differently every time (turned, stretched, moved, shaky pen, grain)
function writeDigit(dg, r, noise, out, off) {
  const rot = r.n() * 0.13 * noise, sc = 1 + r.n() * 0.07 * noise, sx = 1 + r.n() * 0.08 * noise, sh = r.n() * 0.12 * noise, tx = r.n() * 0.04 * noise, ty = r.n() * 0.04 * noise, c = Math.cos(rot), s = Math.sin(rot);
  const strokes = STROKES[dg].map(st => st.map(([x, y]) => { let u = (x - .5) * sx + (y - .5) * sh + r.n() * 0.012 * noise, v = y - .5 + r.n() * 0.012 * noise; return [.5 + tx + sc * (u * c - v * s), .5 + ty + sc * (u * s + v * c)]; }));
  render(strokes, 0.045 + r.u() * 0.03, out, off);
  for (let q = 0; q < G * G; q++) out[off + q] = Math.max(0, Math.min(1, out[off + q] + r.n() * 0.07 * noise));
}
export function makeData(kind, n, noise, seed) {
  const r = rng(seed * 2654435 + 9), nt = Math.round(n * 0.7);
  let X, y, dim = 2, k = 2;
  if (kind === 'digits') { dim = G * G; k = 10; X = new Float64Array(n * dim); y = new Int32Array(n); for (let i = 0; i < n; i++) { y[i] = i % 10; } r.shuffle(y); for (let i = 0; i < n; i++) writeDigit(y[i], r, noise, X, i * dim); }
  else {
    const pts = [];
    if (kind === 'spiral2' || kind === 'spiral3') { k = kind === 'spiral2' ? 2 : 3; const turn = k === 2 ? 3.3 * Math.PI : 1.5 * Math.PI; for (let i = 0; i < n; i++) { const c = i % k, t = 0.12 + 0.88 * Math.sqrt(r.u()), a = c * 2 * Math.PI / k + t * turn, s = 0.028 * noise; pts.push([t * 0.98 * Math.cos(a) + r.n() * s, t * 0.98 * Math.sin(a) + r.n() * s, c]); } }
    else if (kind === 'rings') { k = 3; for (let i = 0; i < n; i++) { const c = i % 3, a = r.range(0, 2 * Math.PI), rad = c === 0 ? Math.sqrt(r.u()) * 0.24 : c === 1 ? 0.55 : 0.92, s = 0.05 * noise; pts.push([rad * Math.cos(a) + r.n() * s, rad * Math.sin(a) + r.n() * s, c]); } }
    else { for (let i = 0; i < n; i++) { const x = r.range(-1, 1), yy = r.range(-1, 1), s = 0.02 * noise; pts.push([x + r.n() * s, yy + r.n() * s, (Math.floor((x + 1) * 1.5) + Math.floor((yy + 1) * 1.5)) % 2]); } }
    r.shuffle(pts); X = new Float64Array(2 * n); y = new Int32Array(n);
    for (let i = 0; i < n; i++) { X[2 * i] = Math.max(-1.12, Math.min(1.12, pts[i][0])); X[2 * i + 1] = Math.max(-1.12, Math.min(1.12, pts[i][1])); y[i] = pts[i][2]; }
  }
  return { X, y, n, dim, k, kind, train: Int32Array.from({ length: nt }, (_, i) => i), test: Int32Array.from({ length: n - nt }, (_, i) => nt + i) };
}
// One learner = one network + its place in the data. step() trains on `per` small batches of 32 examples.
export function learner(d, cfg, seed = 1) {
  const sizes = [d.dim, ...Array(cfg.layers).fill(cfg.width), d.k], N = mlp({ sizes, act: cfg.act, out: 'softmax', seed: seed * 17 + 3, lr: cfg.lr, opt: cfg.opt });
  const order = Int32Array.from(d.train), r = rng(seed * 5 + 1), nT = order.length, B = Math.min(32, nT);
  const L = { net: N, cfg, w0: Float64Array.from(N.W[0]), steps: 0, seen: 0, pos: nT, loss: Math.log(d.k), broke: false, hist: { step: [], trainLoss: [], testLoss: [], trainAcc: [], testAcc: [] }, tr: null, te: null, g1: 0 };
  L.step = (per = 4) => {
    if (L.broke) return; let sum = 0;
    for (let b = 0; b < per; b++) { if (L.pos + B > nT) { r.shuffle(order); L.pos = 0; } sum += N.train(d.X, d.y, order, L.pos, B); L.pos += B; L.seen += B; }
    L.steps++; L.loss = 0.8 * L.loss + 0.2 * sum / per; L.g1 = N.gnorm[0];
    if (!Number.isFinite(sum)) L.broke = true;
  };
  L.measure = () => { L.tr = N.evaluate(d.X, d.y, Math.min(nT, 200), d.train); L.te = N.evaluate(d.X, d.y, Math.min(d.test.length, 300), d.test);   // scores on up to 200 training and 300 test examples if (!Number.isFinite(L.te.loss)) L.broke = true;
    const h = L.hist; h.step.push(L.steps); h.trainLoss.push(L.tr.loss); h.testLoss.push(L.te.loss); h.trainAcc.push(L.tr.acc); h.testAcc.push(L.te.acc); };
  L.measure();
  return L;
}

export function selftest(t, light = false) {
  const d = makeData('digits', 600, 1, 1); let lo = 1, hi = 0, cnt = new Array(10).fill(0); for (const v of d.X) { if (v < lo) lo = v; if (v > hi) hi = v; } for (const c of d.y) cnt[c]++;
  t.ok(lo >= 0 && hi <= 1 && cnt.every(c => c === 60), 'digit images: values in 0..1, the ten digits equally often');
  // the clean digits must be different enough from each other
  const clean = STROKES.map(s => { const o = new Float64Array(G * G); render(s, 0.06, o, 0); return o; }); let minD = Infinity; for (let a = 0; a < 10; a++) for (let b = a + 1; b < 10; b++) { let s = 0; for (let q = 0; q < G * G; q++) s += (clean[a][q] - clean[b][q]) ** 2; minD = Math.min(minD, Math.sqrt(s)); }
  t.ok(minD > 1.5, `clean digits differ from each other (closest pair distance ${minD.toFixed(2)})`);
  for (const act of light ? ['relu'] : ['relu', 'tanh', 'leaky', 'sigmoid']) { const L = learner(d, { layers: 2, width: 24, act, lr: 0.005, opt: 'adam' }); for (let i = 0; i < 300; i++) L.step(); L.measure(); t.log(`  digits, 2x24 ${act}: train ${(L.tr.acc * 100).toFixed(0)}% test ${(L.te.acc * 100).toFixed(0)}% loss ${L.te.loss.toFixed(3)}`); t.ok(L.te.acc > 0.85, `network learns the digits (${act}): test ${(L.te.acc * 100).toFixed(0)}%`); }
  for (const kind of light ? ['spiral3'] : ['spiral2', 'spiral3', 'rings', 'checker']) { const dd = makeData(kind, 500, 1, 1), L = learner(dd, { layers: 3, width: 16, act: 'tanh', lr: 0.01, opt: 'adam' }); for (let i = 0; i < 600; i++) L.step(); L.measure(); t.log(`  ${kind}, 3x16 tanh: train ${(L.tr.acc * 100).toFixed(0)}% test ${(L.te.acc * 100).toFixed(0)}%`); t.ok(L.te.acc > 0.85, `3x16 network learns ${kind}: test ${(L.te.acc * 100).toFixed(0)}%`); }
  if (!light) { // deep sigmoid network with plain gradient descent: the signal that reaches layer 1 is much smaller than with ReLU
    const dd = makeData('spiral3', 500, 1, 1), a = learner(dd, { layers: 5, width: 16, act: 'sigmoid', lr: 0.1, opt: 'sgd' }), b = learner(dd, { layers: 5, width: 16, act: 'relu', lr: 0.1, opt: 'sgd' }); a.step(); b.step();
    t.log(`  signal at layer 1 after one step, 5 layers: sigmoid ${a.g1.toExponential(2)}  relu ${b.g1.toExponential(2)}`); t.ok(a.g1 < b.g1 / 20, 'deep sigmoid network: the learning signal at layer 1 is at least 20 times smaller than with ReLU');
  }
}
