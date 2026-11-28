// Optimizers of Lab 4 (pure maths): four ways to walk downhill on a loss surface with two parameters (x, y).
import { rng } from './kit.js';

// ---- a real loss: fit the line  price = slope * size + intercept  to 120 houses (mean squared error / 2) ----
function houses() {
  const r = rng(77), n = 120, size = new Float64Array(n), price = new Float64Array(n);
  for (let i = 0; i < n; i++) { size[i] = r.range(0.5, 2.5); price[i] = 1 + 2 * size[i] + r.n() * 0.45; }   // size in 100 m², price in 100 thousand $
  let m = 0, v = 0; for (const s of size) m += s; m /= n; for (const s of size) v += (s - m) ** 2; const sd = Math.sqrt(v / n);
  return { n, size, price, z: size.map(s => (s - m) / sd), mean: m, sd };
}
export const H = houses();
function lineLoss(xs) {
  const n = H.n, ys = H.price; let sxx = 0, sx = 0, sxy = 0, sy = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxx += xs[i] * xs[i]; sx += xs[i]; sxy += xs[i] * ys[i]; sy += ys[i]; syy += ys[i] * ys[i]; }
  const w = (n * sxy - sx * sy) / (n * sxx - sx * sx), b = (sy - w * sx) / n;
  return { f: (p, q) => 0.5 * (p * p * sxx + 2 * p * q * sx + n * q * q - 2 * p * sxy - 2 * q * sy + syy) / n, g: (p, q) => [(p * sxx + q * sx - sxy) / n, (p * sx + q * n - sy) / n],
    // gradient from a small random batch of houses (what mini-batch training really does)
    batch: (p, q, r, m = 8) => { let gx = 0, gy = 0; for (let j = 0; j < m; j++) { const i = r.int(n), e = p * xs[i] + q - ys[i]; gx += e * xs[i]; gy += e; } return [gx / m, gy / m]; }, min: [[w, b]] };
}
const raw = lineLoss(H.size), std = lineLoss(H.z);
export const SURF = {
  bowl: { f: (x, y) => x * x + y * y, g: (x, y) => [2 * x, 2 * y], xr: [-2, 2], yr: [-2, 2], start: [-1.6, 1.4], lrA: 0.1, lrB: 0.1, min: [[0, 0]], noise: 0.6 },
  valley: { f: (x, y) => 0.02 * x * x + 2 * y * y, g: (x, y) => [0.04 * x, 4 * y], xr: [-2, 2], yr: [-2, 2], start: [-1.8, 1.0], lrA: 0.45, lrB: 0.1, min: [[0, 0]], noise: 0.5 },
  curved: { f: (x, y) => 0.2 * (1 - x) ** 2 + (y - x * x) ** 2, g: (x, y) => [-0.4 * (1 - x) - 4 * x * (y - x * x), 2 * (y - x * x)], xr: [-2, 2], yr: [-1, 3], start: [-1.5, 2.6], lrA: 0.05, lrB: 0.1, min: [[1, 1]], noise: 0.5 },
  saddle: { f: (x, y) => 0.1 * (x * x - 1) ** 2 + 2 * y * y, g: (x, y) => [0.4 * x * (x * x - 1), 4 * y], xr: [-2, 2], yr: [-2, 2], start: [0.02, 1.5], lrA: 0.1, lrB: 0.05, min: [[-1, 0], [1, 0]], noise: 0.3 },
  dips: { f: (x, y) => 0.25 * (x * x + y * y) + 0.3 * (2 - Math.cos(4 * x) - Math.cos(4 * y)), g: (x, y) => [0.5 * x + 1.2 * Math.sin(4 * x), 0.5 * y + 1.2 * Math.sin(4 * y)], xr: [-3, 3], yr: [-3, 3], start: [-2.5, 2.2], lrA: 0.1, lrB: 0.1, min: [[0, 0]], noise: 0.8 },
  fitraw: { ...raw, xr: [-1, 5], yr: [-3, 5], start: [-0.4, 4.2], lrA: 0.3, lrB: 0.1, noise: 1, xs: H.size },
  fitstd: { ...std, xr: [-2, 4], yr: [0, 8], start: [-1.4, 7.2], lrA: 0.3, lrB: 0.1, noise: 1, xs: H.z },
};
export const KINDS = Object.keys(SURF);
for (const s of Object.values(SURF)) s.fmin = Math.min(...s.min.map(m => s.f(m[0], m[1])));
export const OPTS = ['gd', 'momentum', 'rmsprop', 'adam'];

// One walker. step() = measure the slope here, then move.
export function walker(kind, S, lr, o = {}) {
  const beta = o.beta ?? 0.9, r = rng(o.seed || 1), W = { kind, x: S.start[0], y: S.start[1], t: 0, vx: 0, vy: 0, sx: 0, sy: 0, mx: 0, my: 0, path: [[S.start[0], S.start[1]]], hist: [S.f(S.start[0], S.start[1])], out: false, goalAt: 0 };
  const goal = S.fmin + 0.001 * (W.hist[0] - S.fmin);   // goal: only 0.1% of the starting height is left
  W.loss = W.hist[0];
  W.step = () => {
    if (W.out) return; W.t++;
    let [gx, gy] = o.noisy ? (S.batch ? S.batch(W.x, W.y, r) : (g => [g[0] + r.n() * S.noise, g[1] + r.n() * S.noise])(S.g(W.x, W.y))) : S.g(W.x, W.y);
    if (kind === 'gd') { W.x -= lr * gx; W.y -= lr * gy; }
    else if (kind === 'momentum') { W.vx = beta * W.vx + gx; W.vy = beta * W.vy + gy; W.x -= lr * W.vx; W.y -= lr * W.vy; }                      // speed = old speed kept + new slope
    else if (kind === 'rmsprop') { W.sx = 0.9 * W.sx + 0.1 * gx * gx; W.sy = 0.9 * W.sy + 0.1 * gy * gy; W.x -= lr * gx / (Math.sqrt(W.sx) + 1e-8); W.y -= lr * gy / (Math.sqrt(W.sy) + 1e-8); }   // divide by the usual size of the slope
    else { W.mx = 0.9 * W.mx + 0.1 * gx; W.my = 0.9 * W.my + 0.1 * gy; W.sx = 0.999 * W.sx + 0.001 * gx * gx; W.sy = 0.999 * W.sy + 0.001 * gy * gy; const c1 = 1 - 0.9 ** W.t, c2 = 1 - 0.999 ** W.t;   // Adam = momentum + RMSProp
      W.x -= lr * (W.mx / c1) / (Math.sqrt(W.sx / c2) + 1e-8); W.y -= lr * (W.my / c1) / (Math.sqrt(W.sy / c2) + 1e-8); }
    W.loss = S.f(W.x, W.y);
    if (!Number.isFinite(W.loss) || Math.abs(W.x) > 1e3 || Math.abs(W.y) > 1e3) { W.out = true; W.loss = Infinity; }
    W.path.push([W.x, W.y]); W.hist.push(W.loss);
    if (!W.goalAt && W.loss <= goal) W.goalAt = W.t;
  };
  return W;
}

export function selftest(t) {
  // every slope formula against a measured slope
  const r = rng(3);
  for (const [id, S] of Object.entries(SURF)) { let worst = 0; for (let q = 0; q < 50; q++) { const x = r.range(S.xr[0], S.xr[1]), y = r.range(S.yr[0], S.yr[1]), e = 1e-6, g = S.g(x, y); worst = Math.max(worst, Math.abs((S.f(x + e, y) - S.f(x - e, y)) / (2 * e) - g[0]), Math.abs((S.f(x, y + e) - S.f(x, y - e)) / (2 * e) - g[1])); }
    t.ok(worst < 1e-5, `slope formula matches the measured slope: ${id} (${worst.toExponential(1)})`);
    for (const m of S.min) { const g = S.g(m[0], m[1]); t.ok(Math.hypot(g[0], g[1]) < 1e-9, `slope is zero at the marked lowest point: ${id}`); } }
  // gradient descent on the bowl x²+y²: exact formula x_t = (1 - 2 lr)^t x_0; shrinks for lr < 1, explodes for lr > 1
  const B = SURF.bowl; for (const lr of [0.1, 0.45, 0.9, 1.1]) { const w = walker('gd', B, lr); for (let i = 0; i < 30; i++) w.step(); const want = (1 - 2 * lr) ** 30 * B.start[0];
    t.ok(Math.abs(w.x - want) < 1e-9 * (1 + Math.abs(want)), `gradient descent on the bowl follows (1 - 2·lr)^t, lr=${lr}`);
    let mono = true; for (let i = 1; i < w.hist.length; i++) if (w.hist[i] > w.hist[i - 1]) mono = false; t.ok(mono === lr < 1, `bowl: loss ${lr < 1 ? 'falls' : 'rises'} at every step for lr=${lr}`); }
  // Adam: the first step has length lr in each direction, whatever the slope
  const a = walker('adam', SURF.valley, 0.05); a.step(); t.ok(Math.abs(Math.abs(a.x - SURF.valley.start[0]) - 0.05) < 1e-6 && Math.abs(Math.abs(a.y - SURF.valley.start[1]) - 0.05) < 1e-6, 'Adam: first step has size lr in each direction');
  // momentum with beta = 0 is plain gradient descent
  const m0 = walker('momentum', SURF.curved, 0.03, { beta: 0 }), g0 = walker('gd', SURF.curved, 0.03); for (let i = 0; i < 50; i++) { m0.step(); g0.step(); } t.ok(Math.abs(m0.x - g0.x) < 1e-12 && Math.abs(m0.y - g0.y) < 1e-12, 'momentum with beta 0 equals gradient descent');
  // the two line-fit surfaces: lowest point = least-squares line; both describe the same line
  const wr = SURF.fitraw.min[0], ws = SURF.fitstd.min[0]; t.ok(Math.abs(wr[0] - ws[0] / H.sd) < 1e-9 && Math.abs(wr[1] - (ws[1] - ws[0] * H.mean / H.sd)) < 1e-9, 'raw and scaled line fits give the same best line');
  for (const [id, S] of Object.entries(SURF)) { const res = OPTS.map(k => { const w = walker(k, S, k === 'gd' || k === 'momentum' ? S.lrA : S.lrB); for (let i = 0; i < 400; i++) w.step(); return `${k} ${w.goalAt || (w.out ? 'out' : 'no')} (${w.loss.toFixed(4)})`; }); t.log(`  ${id}: steps to goal with default rates: ${res.join('  ')}`); }
}
