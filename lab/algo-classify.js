// Classifiers of Lab 2 (pure maths). Two inputs in about -1..1, two classes (0 and 1).
// Every model has: step() (one learning step), done, prob(x, y) -> chance of class 1, info() -> short text.
import { rng } from './kit.js';
import { mlp } from './mlp.js';

export const KINDS = ['spam', 'loan', 'blood', 'drugs', 'fraud', 'churn'];
export function makeData(kind, n, noise, seed) {
  const r = rng(seed * 104729 + 3), pts = [];
  if (kind === 'spam') { for (let i = 0; i < n; i++) { const c = i % 2; pts.push([(c ? 0.36 : -0.36) + r.n() * 0.3 * noise, (c ? 0.3 : -0.3) + r.n() * 0.3 * noise, c]); } }
  else if (kind === 'loan') { for (let i = 0; i < n; i++) { const c = i % 2, a = r.range(0, Math.PI), s = 0.085 * noise; pts.push(c ? [0.3 - 0.62 * Math.cos(a) + r.n() * s, 0.22 - 0.62 * Math.sin(a) + r.n() * s, 1] : [-0.3 + 0.62 * Math.cos(a) + r.n() * s, -0.22 + 0.62 * Math.sin(a) + r.n() * s, 0]); } }
  else if (kind === 'blood') { for (let i = 0; i < n; i++) { const c = i % 2, a = r.range(0, 2 * Math.PI), rad = c ? r.range(0.62, 0.98) : Math.sqrt(r.u()) * 0.45, s = 0.07 * noise; pts.push([rad * Math.cos(a) + r.n() * s, rad * Math.sin(a) + r.n() * s, c]); } }
  else if (kind === 'drugs') { for (let i = 0; i < n; i++) { const x = r.range(-1, 1), y = r.range(-1, 1), s = 0.09 * noise; pts.push([x + r.n() * s, y + r.n() * s, x * y < 0 ? 1 : 0]); } }
  else if (kind === 'fraud') { const m = Math.max(8, Math.round(n * 0.07)); for (let i = 0; i < n - m; i++) pts.push([-0.22 + r.n() * 0.38, -0.15 + r.n() * 0.36, 0]); for (let i = 0; i < m; i++) pts.push(i % 4 === 3 ? [-0.1 + r.n() * 0.4, r.n() * 0.4, 1] : [0.62 + r.n() * 0.13 * noise, 0.6 + r.n() * 0.14 * noise, 1]); }
  else { for (let i = 0; i < n; i++) { const c = i % 2; pts.push([(c ? 0.25 : -0.25) + r.n() * 0.42 * noise, (c ? 0.2 : -0.2) + r.n() * 0.42 * noise, c]); } }
  r.shuffle(pts);
  const X = new Float64Array(2 * n), y = new Int32Array(n), cl = v => Math.max(-1.12, Math.min(1.12, v));
  for (let i = 0; i < n; i++) { X[2 * i] = cl(pts[i][0]); X[2 * i + 1] = cl(pts[i][1]); y[i] = pts[i][2]; }
  const nt = Math.round(n * 0.7), train = Int32Array.from({ length: nt }, (_, i) => i), test = Int32Array.from({ length: n - nt }, (_, i) => nt + i);   // 70% to learn, 30% kept hidden for the test
  return { X, y, n, train, test, kind };
}
const sig = z => z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));

// ---- logistic regression: one straight border, moved by gradient descent ----
export function logistic(d) {
  const { X, y, train } = d, n = train.length, S = { id: 'logit', w: [0, 0], b: 0, iter: 0, loss: Math.log(2), hist: [], done: false, ver: 0 };
  S.prob = (px, py) => sig(S.w[0] * px + S.w[1] * py + S.b);
  S.step = () => {
    if (S.done) return; let g0 = 0, g1 = 0, gb = 0, loss = 0;
    for (const i of train) { const p = S.prob(X[2 * i], X[2 * i + 1]), e = p - y[i]; g0 += e * X[2 * i]; g1 += e * X[2 * i + 1]; gb += e; loss -= y[i] ? Math.log(Math.max(p, 1e-12)) : Math.log(Math.max(1 - p, 1e-12)); }
    loss /= n; const prev = S.loss; S.loss = loss; S.hist.push(loss); S.iter++; S.ver++;
    if ((S.iter > 3 && prev - loss < 2e-5) || S.iter >= 150) { S.done = true; return; }
    const lr = 2; S.w[0] -= lr * g0 / n; S.w[1] -= lr * g1 / n; S.b -= lr * gb / n;
  };
  S.info = () => `step <b>${S.iter}</b> · loss <b>${S.loss.toFixed(3)}</b>`;
  return S;
}
// ---- k nearest neighbours: no learning, it keeps all the points and lets the k closest ones vote ----
export function knn(d, k) {
  const { X, y, train } = d, n = train.length, kk = Math.min(k, n), S = { id: 'knn', iter: 0, done: false, ver: 0 }, best = new Float64Array(kk), lab = new Int32Array(kk);
  S.prob = (px, py) => {
    let m = 0;
    for (const i of train) { const dx = X[2 * i] - px, dy = X[2 * i + 1] - py, dist = dx * dx + dy * dy; if (m < kk || dist < best[m - 1]) { let j = m < kk ? m++ : kk - 1; while (j > 0 && best[j - 1] > dist) { best[j] = best[j - 1]; lab[j] = lab[j - 1]; j--; } best[j] = dist; lab[j] = y[i]; } }
    let s = 0; for (let j = 0; j < kk; j++) s += lab[j]; return s / kk;
  };
  S.step = () => { S.iter = 1; S.done = true; S.ver++; };
  S.info = () => `no learning: keeps all <b>${n}</b> points · k = <b>${kk}</b>`;
  return S;
}
// ---- Gaussian naive Bayes: one bell curve per class and per input, inputs treated as independent ----
export function nbayes(d) {
  const { X, y, train } = d, S = { id: 'nb', iter: 0, done: false, ver: 0, m: [[0, 0], [0, 0]], v: [[0, 0], [0, 0]], prior: [0, 0] };
  S.step = () => {
    if (S.done) return; const c = [0, 0];
    for (const i of train) { c[y[i]]++; S.m[y[i]][0] += X[2 * i]; S.m[y[i]][1] += X[2 * i + 1]; }
    for (const q of [0, 1]) { S.m[q][0] /= c[q] || 1; S.m[q][1] /= c[q] || 1; }
    for (const i of train) { const q = y[i]; S.v[q][0] += (X[2 * i] - S.m[q][0]) ** 2; S.v[q][1] += (X[2 * i + 1] - S.m[q][1]) ** 2; }
    for (const q of [0, 1]) { S.v[q][0] = S.v[q][0] / (c[q] || 1) + 1e-6; S.v[q][1] = S.v[q][1] / (c[q] || 1) + 1e-6; S.prior[q] = c[q] / train.length; }
    S.iter = 1; S.done = true; S.ver++;
  };
  const lg = (q, px, py) => Math.log(S.prior[q] + 1e-300) - 0.5 * Math.log(S.v[q][0] * S.v[q][1]) - 0.5 * ((px - S.m[q][0]) ** 2 / S.v[q][0] + (py - S.m[q][1]) ** 2 / S.v[q][1]);
  S.prob = (px, py) => S.done ? sig(lg(1, px, py) - lg(0, px, py)) : 0.5;
  S.info = () => 'one pass: mean and spread of each class';
  return S;
}
// ---- decision tree ----
// best cut of the points idx on one input (feat) by Gini impurity; returns {gain, thr} (gain = drop of impurity * points)
function bestCut(X, y, idx, feat) {
  const n = idx.length, ord = Array.from(idx).sort((a, b) => X[2 * a + feat] - X[2 * b + feat]); let tot1 = 0; for (const i of ord) tot1 += y[i];
  const gini = (c1, m) => m ? 2 * (c1 / m) * (1 - c1 / m) * m : 0, base = gini(tot1, n); let best = { gain: 0, thr: 0, feat }, l1 = 0;
  for (let s = 1; s < n; s++) { l1 += y[ord[s - 1]]; const a = X[2 * ord[s - 1] + feat], b = X[2 * ord[s] + feat]; if (a === b) continue; const g = base - gini(l1, s) - gini(tot1 - l1, n - s); if (g > best.gain + 1e-12) best = { gain: g, thr: (a + b) / 2, feat }; }
  return best;
}
const leafOf = (y, idx, depth) => { let c = 0; for (const i of idx) c += y[i]; return { idx, depth, p: idx.length ? c / idx.length : 0.5, leaf: true }; };
const walk = (node, px, py) => { while (!node.leaf) node = (node.feat ? py : px) <= node.thr ? node.l : node.r; return node.p; };
function splitNode(X, y, node, cut) { const li = [], ri = []; for (const i of node.idx) (X[2 * i + cut.feat] <= cut.thr ? li : ri).push(i); node.leaf = false; node.feat = cut.feat; node.thr = cut.thr; node.l = leafOf(y, li, node.depth + 1); node.r = leafOf(y, ri, node.depth + 1); }
// One step = one new cut: the cut (over all leaves and both inputs) that cleans the most.
export function tree(d, maxDepth) {
  const { X, y, train } = d, S = { id: 'tree', iter: 0, done: false, ver: 0, leaves: 1, cuts: [] };
  S.root = leafOf(y, Array.from(train), 0); const open = [S.root];
  const cand = nd => { if (nd.cand === undefined) { const a = bestCut(X, y, nd.idx, 0), b = bestCut(X, y, nd.idx, 1); nd.cand = a.gain >= b.gain ? a : b; } return nd.cand; };
  S.step = () => {
    if (S.done) return; let bi = -1, bg = 1e-9;
    for (let q = 0; q < open.length; q++) { const nd = open[q]; if (nd.depth >= maxDepth || nd.p === 0 || nd.p === 1) continue; const c = cand(nd); if (c.gain > bg) { bg = c.gain; bi = q; } }
    if (bi < 0) { S.done = true; S.ver++; return; }
    const nd = open[bi]; splitNode(X, y, nd, nd.cand); open.splice(bi, 1, nd.l, nd.r); S.iter++; S.leaves++; S.ver++; S.cuts.push(nd);
  };
  S.prob = (px, py) => walk(S.root, px, py);
  S.info = () => `cuts <b>${S.iter}</b> · leaves <b>${S.leaves}</b>`;
  return S;
}
// ---- random forest: many trees, each on a random copy of the data, each cut on a random input; the trees vote ----
export function forest(d, maxDepth, nTrees = 40, seed = 1) {
  const { X, y, train } = d, r = rng(seed * 31 + 5), S = { id: 'forest', iter: 0, done: false, ver: 0, trees: [], nTrees };
  const grow = nd => { if (nd.depth >= maxDepth || nd.p === 0 || nd.p === 1 || nd.idx.length < 2) return; const f0 = r.int(2); let c = bestCut(X, y, nd.idx, f0); if (c.gain <= 1e-9) c = bestCut(X, y, nd.idx, 1 - f0); if (c.gain <= 1e-9) return; splitNode(X, y, nd, c); grow(nd.l); grow(nd.r); nd.idx = null; };
  S.step = () => { if (S.done) return; const boot = Array.from({ length: train.length }, () => train[r.int(train.length)]), root = leafOf(y, boot, 0); grow(root); S.trees.push(root); S.iter++; S.ver++; if (S.iter >= nTrees) S.done = true; };
  S.prob = (px, py) => { if (!S.trees.length) return 0.5; let s = 0; for (const t of S.trees) s += walk(t, px, py); return s / S.trees.length; };
  S.info = () => `trees <b>${S.iter}</b> of ${nTrees}`;
  return S;
}
// ---- support vector machine with a round (RBF) kernel ----
// Solved in its "dual" form: one weight a_i >= 0 per training point (most end at 0; the others are the support vectors).
// One step = one pass over all points, each a_i is set to its best value while the others stay fixed.
export function svm(d, gamma, Cbox = 3) {
  const { X, y, train } = d, n = train.length, K = new Float64Array(n * n), a = new Float64Array(n), fv = new Float64Array(n), s = Int8Array.from(train, i => y[i] ? 1 : -1);
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) { const p = train[i], q = train[j], v = Math.exp(-gamma * ((X[2 * p] - X[2 * q]) ** 2 + (X[2 * p + 1] - X[2 * q + 1]) ** 2)) + 1; K[i * n + j] = v; K[j * n + i] = v; }   // +1 plays the role of the constant term
  const S = { id: 'svm', iter: 0, done: false, ver: 0, a, sv: 0, dual: 0, hist: [], C: Cbox };
  S.step = () => {
    if (S.done) return; let maxd = 0;
    for (let i = 0; i < n; i++) { const na = Math.max(0, Math.min(Cbox, a[i] + (1 - s[i] * fv[i]) / K[i * n + i])), da = na - a[i]; if (da !== 0) { a[i] = na; const c = da * s[i]; for (let j = 0, o = i * n; j < n; j++) fv[j] += c * K[o + j]; if (Math.abs(da) > maxd) maxd = Math.abs(da); } }
    let dual = 0, sv = 0; for (let i = 0; i < n; i++) { dual += a[i] - 0.5 * a[i] * s[i] * fv[i]; if (a[i] > 1e-8) sv++; }
    S.dual = dual; S.hist.push(dual); S.sv = sv; S.iter++; S.ver++;
    if (maxd < 4e-3 || S.iter >= 80) S.done = true;
  };
  S.score = (px, py) => { let v = 0; for (let i = 0; i < n; i++) if (a[i] > 1e-8) { const p = train[i]; v += a[i] * s[i] * (Math.exp(-gamma * ((X[2 * p] - px) ** 2 + (X[2 * p + 1] - py) ** 2)) + 1); } return v; };
  S.prob = (px, py) => sig(2 * S.score(px, py));       // only for the colour; the decision is the sign of the score
  S.isSV = i => a[i] > 1e-8;
  S.info = () => `pass <b>${S.iter}</b> · support points <b>${S.sv}</b> of ${n}`;
  return S;
}
// ---- small neural network 2 -> 8 -> 8 -> 1 (tanh), trained with Adam on all training points ----
export function neural(d, seed = 1, per = 10, maxIter = 1500) {
  const { X, y, train } = d, N = mlp({ sizes: [2, 8, 8, 1], act: 'tanh', out: 'sigmoid', seed: seed * 13 + 1, lr: 0.02 }), S = { id: 'nn', iter: 0, done: false, ver: 0, loss: Math.log(2), hist: [], net: N };
  const one = new Float64Array(2);
  S.step = () => { if (S.done) return; let l = 0; for (let q = 0; q < per; q++) l = N.train(X, y, train, 0, train.length); S.loss = l; S.hist.push(l); S.iter += per; S.ver++; if (S.iter >= maxIter) S.done = true; };
  S.prob = (px, py) => { one[0] = px; one[1] = py; return N.fwd(one, 0)[0]; };
  S.info = () => `step <b>${S.iter}</b> · loss <b>${S.loss.toFixed(3)}</b>`;
  return S;
}
// share of right answers on the points idx; also how many of class 1 were found
export function accuracy(m, d, idx) {
  let ok = 0, pos = 0, found = 0, alarms = 0;
  for (const i of idx) { const p = m.prob(d.X[2 * i], d.X[2 * i + 1]) >= 0.5 ? 1 : 0; if (p === d.y[i]) ok++; if (d.y[i]) { pos++; if (p) found++; } else if (p) alarms++; }
  return { acc: ok / idx.length, pos, found, alarms };
}
export function makeAll(d, o = {}) { return { logit: logistic(d), knn: knn(d, o.k || 7), nb: nbayes(d), tree: tree(d, o.depth || 4), forest: forest(d, o.fdepth || 6, 40, o.seed || 1), svm: svm(d, o.gamma || 6), nn: neural(d, o.seed || 1) }; }

export function selftest(t, light = false) {
  const run = S => { let g = 0; while (!S.done && g++ < 5000) S.step(); return S; };
  for (const kind of KINDS) for (const n of light ? [400] : [200, 400, 800]) for (const seed of light ? [1] : [1, 2]) {
    const d = makeData(kind, n, 1, seed), tag = `${kind} n=${n} seed=${seed}`, M = makeAll(d, { seed });
    for (const m of Object.values(M)) run(m);
    let mono = true; for (let i = 1; i < M.logit.hist.length; i++) if (M.logit.hist[i] > M.logit.hist[i - 1] + 1e-12) mono = false;
    t.ok(mono, `logistic regression loss never rises: ${tag}`);
    let up = true; for (let i = 1; i < M.svm.hist.length; i++) if (M.svm.hist[i] < M.svm.hist[i - 1] - 1e-9) up = false;
    t.ok(up, `SVM dual objective never falls: ${tag}`);
    t.ok(M.svm.a.every(v => v >= 0 && v <= M.svm.C), `SVM weights stay in 0..C: ${tag}`);
    // SVM: at the end, points with 0 < a < C sit on the margin (score * side = 1)
    if (M.svm.iter < 80) { let worst = 0; d.train.forEach((p, i) => { const a = M.svm.a[i]; if (a > 1e-4 && a < M.svm.C - 1e-4) worst = Math.max(worst, Math.abs(1 - (d.y[p] ? 1 : -1) * M.svm.score(d.X[2 * p], d.X[2 * p + 1]))); }); t.ok(worst < 0.05, `SVM margin points sit on the margin: ${tag} (${worst.toFixed(3)})`); }
    // a tree may only get better on its training data with every cut; a full tree and 1-NN know the training data by heart
    const T = tree(d, 30); let prev = 0, tmono = true; while (!T.done) { T.step(); const a = accuracy(T, d, d.train).acc; if (a < prev - 1e-12) tmono = false; prev = a; }
    t.ok(tmono && prev === 1, `tree: training accuracy never falls and a full tree reaches 100%: ${tag} (${prev})`);
    t.ok(accuracy(run(knn(d, 1)), d, d.train).acc === 1, `1 nearest neighbour is 100% right on its own training points: ${tag}`);
    // naive Bayes against a direct count on the training data
    const c1 = d.train.reduce((s, i) => s + d.y[i], 0); t.ok(Math.abs(M.nb.prior[1] - c1 / d.train.length) < 1e-12, `naive Bayes prior = class share: ${tag}`);
    const acc = Object.fromEntries(Object.entries(M).map(([k, m]) => [k, accuracy(m, d, d.test).acc]));
    if (seed === 1 && n === 400) {
      t.log(`  test accuracy ${kind}: ` + Object.entries(acc).map(([k, v]) => `${k} ${(v * 100).toFixed(0)}`).join('  ') + `  | train: ` + Object.entries(M).map(([k, m]) => `${k} ${(accuracy(m, d, d.train).acc * 100).toFixed(0)}`).join('  '));
      if (kind === 'spam') t.ok(acc.logit > 0.85 && acc.nb > 0.85, 'straight border: logistic regression and naive Bayes are good');
      if (kind === 'loan') t.ok(acc.logit < 0.92 && acc.svm > 0.93 && acc.nn > 0.93 && acc.knn > 0.93, 'curved border: SVM, network, k-NN beat the straight line');
      if (kind === 'blood') t.ok(acc.logit < 0.7 && acc.svm > 0.93 && acc.nb > 0.9 && acc.forest > 0.9, 'circle: the straight line fails, the others work');
      if (kind === 'drugs') t.ok(acc.logit < 0.65 && acc.nb < 0.7 && acc.tree > 0.85 && acc.nn > 0.88, 'XOR: line and naive Bayes fail, tree and network work');
    }
  }
}
