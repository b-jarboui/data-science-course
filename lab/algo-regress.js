// Regression models of Lab 3 (pure maths). One input x in -1..1, one number y to predict.
import { rng } from './kit.js';
import { mlp } from './mlp.js';

export const KINDS = ['house', 'energy', 'salary', 'visits', 'taxi', 'parcel'];
export const RULES = {
  house: { f: x => 0.68 * x - 0.22 * x * x + 0.05, s: 0.16 },
  energy: { f: x => 1.25 * x * x - 0.55 + 0.12 * x, s: 0.14 },
  salary: { f: x => 0.8 * Math.tanh(2.4 * (x + 0.35)) - 0.05, s: 0.15 },
  visits: { f: x => 0.55 * Math.sin(3.4 * x + 0.5) + 0.32 * Math.sin(7.5 * x), s: 0.13 },
  taxi: { f: x => 0.8 * x, s: 0.15 },
  parcel: { f: x => x < -0.5 ? -0.72 : x < 0 ? -0.25 : x < 0.5 ? 0.22 : 0.72, s: 0.07 },
};
export function makeData(kind, n, noise, seed) {
  const r = rng(seed * 15485863 + 11), rule = RULES[kind], x = new Float64Array(n), y = new Float64Array(n), sigma = rule.s * noise;
  for (let i = 0; i < n; i++) { x[i] = r.range(-1, 1); y[i] = rule.f(x[i]) + r.n() * sigma; }
  const nt = Math.round(n * 0.7);
  return { x, y, n, train: Int32Array.from({ length: nt }, (_, i) => i), test: Int32Array.from({ length: n - nt }, (_, i) => nt + i), f: rule.f, sigma, kind };
}
// complexity level 1..12 -> the setting of each model
export const LEVELS = 12;
export const setting = {
  poly: (lv, nT) => Math.min([1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 22][lv - 1], Math.max(1, Math.floor((nT - 1) * 0.75))),
  knn: (lv, nT) => Math.max(1, Math.min(nT, lv <= 6 ? Math.round([1, 0.5, 0.3, 0.2, 0.12, 0.08][lv - 1] * nT) : [9, 7, 5, 3, 2, 1][lv - 7])),
  tree: lv => lv,
  nn: lv => [1, 2, 3, 4, 5, 6, 8, 12, 16, 24, 32, 48][lv - 1],
};

// ---- least squares by Householder QR: solves min |A c - b| for an n x p matrix (row-major) ----
export function lstsq(A, b, n, p) {
  A = Float64Array.from(A); b = Float64Array.from(b);
  for (let k = 0; k < p; k++) {
    let norm = 0; for (let i = k; i < n; i++) norm += A[i * p + k] ** 2; norm = Math.sqrt(norm); if (norm === 0) continue;
    const alpha = A[k * p + k] > 0 ? -norm : norm, v = new Float64Array(n - k); v[0] = A[k * p + k] - alpha; for (let i = k + 1; i < n; i++) v[i - k] = A[i * p + k];
    let vv = 0; for (const t of v) vv += t * t; if (vv === 0) continue;
    for (let j = k; j < p; j++) { let d = 0; for (let i = k; i < n; i++) d += v[i - k] * A[i * p + j]; d = 2 * d / vv; for (let i = k; i < n; i++) A[i * p + j] -= d * v[i - k]; }
    let d = 0; for (let i = k; i < n; i++) d += v[i - k] * b[i]; d = 2 * d / vv; for (let i = k; i < n; i++) b[i] -= d * v[i - k];
  }
  const c = new Float64Array(p);
  for (let k = p - 1; k >= 0; k--) { let s = b[k]; for (let j = k + 1; j < p; j++) s -= A[k * p + j] * c[j]; c[k] = Math.abs(A[k * p + k]) > 1e-12 ? s / A[k * p + k] : 0; }
  return c;
}
// Chebyshev form of 1, x, x^2 ... (the same curves as ordinary powers, but safe for the computer at high degree)
const cheb = (x, d, out, o) => { out[o] = 1; if (d >= 1) out[o + 1] = x; for (let j = 2; j <= d; j++) out[o + j] = 2 * x * out[o + j - 1] - out[o + j - 2]; };
export function polyFit(d, deg) {
  const nT = d.train.length, p = deg + 1, A = new Float64Array(nT * p), b = new Float64Array(nT);
  d.train.forEach((i, q) => { cheb(d.x[i], deg, A, q * p); b[q] = d.y[i]; });
  const c = lstsq(A, b, nT, p), row = new Float64Array(p);
  return { coef: c, predict: x => { cheb(x, deg, row, 0); let s = 0; for (let j = 0; j < p; j++) s += c[j] * row[j]; return s; } };
}
// k nearest neighbours: the prediction is the mean y of the k training points with the closest x
export function knnFit(d, k) {
  const pts = Array.from(d.train, i => [d.x[i], d.y[i]]).sort((a, b) => a[0] - b[0]), n = pts.length;
  return { predict: x => {
    let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (pts[m][0] < x) lo = m + 1; else hi = m; }
    let l = lo - 1, r = lo, s = 0; for (let c = 0; c < k; c++) { if (r >= n || (l >= 0 && x - pts[l][0] <= pts[r][0] - x)) s += pts[l--][1]; else s += pts[r++][1]; }
    return s / k; } };
}
// regression tree: cut the x axis where the squared error drops the most; a leaf predicts the mean of its points
export function treeFit(d, depth) {
  const pts = Array.from(d.train, i => [d.x[i], d.y[i]]).sort((a, b) => a[0] - b[0]), cuts = [];
  const build = (lo, hi, dep) => {
    let s = 0; for (let i = lo; i < hi; i++) s += pts[i][1]; const node = { v: s / (hi - lo) };
    if (dep >= depth || hi - lo < 2) return node;
    let best = -1, bg = 1e-12, ls = 0; const base = s * s / (hi - lo);
    for (let i = lo + 1; i < hi; i++) { ls += pts[i - 1][1]; if (pts[i][0] === pts[i - 1][0]) continue; const g = ls * ls / (i - lo) + (s - ls) ** 2 / (hi - i) - base; if (g > bg) { bg = g; best = i; } }
    if (best < 0) return node;
    node.thr = (pts[best - 1][0] + pts[best][0]) / 2; cuts.push(node.thr); node.l = build(lo, best, dep + 1); node.r = build(best, hi, dep + 1); return node;
  };
  const root = build(0, pts.length, 0);
  return { leaves: cuts.length + 1, predict: x => { let nd = root; while (nd.thr !== undefined) nd = x <= nd.thr ? nd.l : nd.r; return nd.v; } };
}
// neural network 1 -> width -> 1 (tanh), trained with Adam on all training points
export function nnFit(d, width, seed = 1, steps = 0) {
  const nT = d.train.length; steps = steps || Math.round(Math.max(700, Math.min(2000, 2000 * 84 / nT)));
  const N = mlp({ sizes: [1, width, 1], act: 'tanh', out: 'linear', seed: seed * 7 + width, lr: 0.03 }), one = new Float64Array(1);
  let loss = 0; for (let s = 0; s < steps; s++) loss = N.train(d.x, d.y, d.train, 0, nT);
  return { steps, loss, predict: x => { one[0] = x; return N.fwd(one, 0)[0]; } };
}
export function fit(d, method, lv, seed = 1) {
  const nT = d.train.length, s = setting[method](lv, nT);
  const m = method === 'poly' ? polyFit(d, s) : method === 'knn' ? knnFit(d, s) : method === 'tree' ? treeFit(d, s) : nnFit(d, s, seed);
  m.setting = s; m.train = rmse(m, d, d.train); m.test = rmse(m, d, d.test); return m;
}
// typical error: root of the mean squared error
export function rmse(m, d, idx) { let s = 0; for (const i of idx) s += (m.predict(d.x[i]) - d.y[i]) ** 2; return Math.sqrt(s / idx.length); }

export function selftest(t, light = false) {
  for (const kind of KINDS) for (const n of light ? [120] : [40, 120, 400]) for (const seed of light ? [1] : [1, 2]) {
    const d = makeData(kind, n, 1, seed), tag = `${kind} n=${n} seed=${seed}`, nT = d.train.length;
    // straight line by the school formula
    let mx = 0, my = 0; for (const i of d.train) { mx += d.x[i]; my += d.y[i]; } mx /= nT; my /= nT; let sxy = 0, sxx = 0; for (const i of d.train) { sxy += (d.x[i] - mx) * (d.y[i] - my); sxx += (d.x[i] - mx) ** 2; }
    const p1 = polyFit(d, 1); t.ok(Math.abs(p1.coef[1] - sxy / sxx) < 1e-9 && Math.abs(p1.coef[0] - (my - sxy / sxx * mx)) < 1e-9, `degree 1 equals the least-squares line formula: ${tag}`);
    let prev = Infinity, mono = true, ortho = 0;
    for (let lv = 1; lv <= LEVELS; lv++) { const m = fit(d, 'poly', lv); if (m.train > prev + 1e-9) mono = false; prev = m.train;
      if (lv <= 8) { for (let j = 0; j <= Math.min(m.setting, 3); j++) { let s = 0; for (const i of d.train) s += (m.predict(d.x[i]) - d.y[i]) * Math.pow(d.x[i], j); ortho = Math.max(ortho, Math.abs(s) / nT); } } }
    t.ok(mono, `polynomial: training error never rises with the degree: ${tag}`);
    t.ok(ortho < 1e-8, `polynomial: errors are balanced against 1, x, x², x³ (normal equations): ${tag} ${ortho.toExponential(1)}`);
    prev = Infinity; mono = true; for (let lv = 1; lv <= LEVELS; lv++) { const m = fit(d, 'tree', lv); if (m.train > prev + 1e-12) mono = false; prev = m.train; }
    t.ok(mono, `tree: training error never rises with the depth: ${tag}`);
    t.ok(rmse(treeFit(d, 40), d, d.train) < 1e-12 && rmse(knnFit(d, 1), d, d.train) < 1e-12, `a full tree and 1-NN repeat their training points exactly: ${tag}`);
    const kAll = knnFit(d, nT).predict(0.3); t.ok(Math.abs(kAll - my) < 1e-12, `k-NN with k = all points gives the mean: ${tag}`);
    if (seed === 1 && n === 120) {
      const best = {}; for (const m of ['poly', 'knn', 'tree', 'nn']) { let b = [Infinity, 0]; for (let lv = 1; lv <= LEVELS; lv++) { const q = fit(d, m, lv); if (q.test < b[0]) b = [q.test, lv, q.setting]; } best[m] = b; }
      t.log(`  ${kind}: noise ${d.sigma.toFixed(3)} | best test error: ` + Object.entries(best).map(([k, b]) => `${k} ${b[0].toFixed(3)} @L${b[1]}(${b[2]})`).join('  '));
      t.ok(kind === 'parcel' || Object.values(best).every(b => b[0] < 2.2 * d.sigma && b[0] > 0.6 * d.sigma), `best test errors are near the noise level: ${kind}`);
      if (kind === 'taxi') t.ok(best.poly[1] <= 2, 'straight rule: the best polynomial is a low degree');
      const hi = fit(d, 'poly', 12); t.ok(hi.test > hi.train, `degree ${hi.setting}: test error above train error: ${kind}`);
    }
  }
  // QR solver against a system with a known answer
  const A = [1, 1, 1, 2, 1, 3, 1, 4], c = lstsq(A, [3, 5, 7, 9], 4, 2); t.ok(Math.abs(c[0] - 1) < 1e-12 && Math.abs(c[1] - 2) < 1e-12, 'least squares solver finds y = 1 + 2x');
}
