// Clustering algorithms of Lab 1. Pure maths (no page code), so Node can check them too.
// Points are a flat Float64Array X = [x0, y0, x1, y1, ...] in the square about -1..1.
import { rng } from './kit.js';

// ---------- data ----------
// Each kind returns {X, y (real group of each point, or null), n, k (number of real groups), eps (a good DBSCAN reach)}.
export const BAND = [0.3, 0.34, -0.3], DEN = [-0.3, 0.3, 0.5, 0.42];
export const KINDS = ['segments', 'bands', 'roads', 'ring', 'density', 'faulty', 'none'];
export function makeData(kind, n, spread, seed) {
  const r = rng(seed * 7919 + 17), pts = [];
  const blob = (cx, cy, sx, sy, m, lab) => { for (let i = 0; i < m; i++) pts.push([cx + r.n() * sx, cy + r.n() * sy, lab]); };
  let k = 3, eps = 0.12;
  const tn = () => { let z; do z = r.n(); while (Math.abs(z) > 2); return z; };   // bell-shaped noise without far strays
  if (kind === 'segments') {
    k = 4; const s = 0.125 * spread, m = Math.floor(n / 4);
    blob(-0.55, -0.5, s, s, m, 0); blob(0.5, -0.55, s, s, m, 1); blob(-0.4, 0.5, s, s, m, 2); blob(0.55, 0.45, s, s, n - 3 * m, 3); eps = 0.115;
  } else if (kind === 'bands') {
    k = 3; const m = Math.floor(n / 3), ca = Math.cos(0.5), sa = Math.sin(0.5);
    for (let g = 0; g < 3; g++) { const cnt = g === 2 ? n - 2 * m : m; for (let i = 0; i < cnt; i++) { const t = (g - 1) * BAND[2] + tn() * BAND[0], w = (g - 1) * BAND[1] + r.n() * 0.045 * spread; pts.push([t * ca - w * sa, t * sa + w * ca, g]); } }
    eps = 0.12;
  } else if (kind === 'roads') {
    k = 2; const m = Math.floor(n / 2), s = 0.045 * spread;
    for (let i = 0; i < m; i++) { const a = (i + r.u()) / m * Math.PI; pts.push([-0.28 + 0.62 * Math.cos(a) + tn() * s, -0.12 + 0.62 * Math.sin(a) + tn() * s, 0]); }
    for (let i = 0; i < n - m; i++) { const a = (i + r.u()) / (n - m) * Math.PI; pts.push([0.28 - 0.62 * Math.cos(a) + tn() * s, 0.18 - 0.62 * Math.sin(a) + tn() * s, 1]); }
    eps = 0.11;
  } else if (kind === 'ring') {
    k = 2; const m = Math.floor(n * 0.35);
    for (let i = 0; i < m; i++) pts.push([tn() * 0.13 * spread, tn() * 0.13 * spread, 0]);
    for (let i = 0; i < n - m; i++) { const a = (i + r.u()) / (n - m) * 2 * Math.PI, rad = 0.8 + tn() * 0.04 * spread; pts.push([rad * Math.cos(a), rad * Math.sin(a), 1]); }
    eps = 0.13;
  } else if (kind === 'density') {
    k = 3; const m = Math.floor(n * 0.6), m2 = Math.floor(n * 0.2);
    blob(DEN[0], 0, DEN[1] * spread, DEN[1] * spread, m, 0); blob(DEN[2], DEN[3], 0.05 * spread, 0.05 * spread, m2, 1); blob(DEN[2], -DEN[3], 0.06 * spread, 0.06 * spread, n - m - m2, 2);
    eps = 0.1;
  } else if (kind === 'faulty') {
    k = 4; const out = Math.round(n * 0.12), m = Math.floor((n - out) / 3), s = 0.1 * spread;
    blob(-0.5, -0.4, s, s, m, 0); blob(0.5, -0.35, s, s, m, 1); blob(0, 0.5, s, s, n - out - 2 * m, 2);
    for (let i = 0; i < out; i++) pts.push([r.range(-1.05, 1.05), r.range(-1.05, 1.05), 3]);
    eps = 0.085;
  } else { k = 0; for (let i = 0; i < n; i++) pts.push([r.range(-0.95, 0.95), r.range(-0.95, 0.95), 0]); eps = 0.1; }
  r.shuffle(pts);
  const X = new Float64Array(2 * n), y = new Int32Array(n);
  for (let i = 0; i < n; i++) { X[2 * i] = Math.max(-1.1, Math.min(1.1, pts[i][0])); X[2 * i + 1] = Math.max(-1.1, Math.min(1.1, pts[i][1])); y[i] = pts[i][2]; }
  // with fewer points the same shape is thinner, so the reach must grow (about 1/sqrt(n))
  eps *= Math.sqrt(300 / n) ** 0.7;
  return { X, y: kind === 'none' ? null : y, n, k, eps: Math.round(eps * 200) / 200, kind };
}
export function distMatrix(X, n) {
  const D = new Float32Array(n * n);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const d = Math.hypot(X[2 * i] - X[2 * j], X[2 * i + 1] - X[2 * j + 1]); D[i * n + j] = d; D[j * n + i] = d; }
  return D;
}

// ---------- k-means ----------
function seedCentres(X, n, k, r, how) {
  const c = new Float64Array(2 * k);
  if (how === 'random') { const idx = r.shuffle([...Array(n).keys()]).slice(0, k); idx.forEach((p, j) => { c[2 * j] = X[2 * p]; c[2 * j + 1] = X[2 * p + 1]; }); return c; }
  // k-means++ : first centre at random, each next centre far from the centres already chosen (chance ~ distance squared)
  const d2 = new Float64Array(n).fill(Infinity); let p = r.int(n);
  for (let j = 0; j < k; j++) {
    c[2 * j] = X[2 * p]; c[2 * j + 1] = X[2 * p + 1]; let sum = 0;
    for (let i = 0; i < n; i++) { const dx = X[2 * i] - c[2 * j], dy = X[2 * i + 1] - c[2 * j + 1]; d2[i] = Math.min(d2[i], dx * dx + dy * dy); sum += d2[i]; }
    let t = r.u() * sum; p = n - 1; for (let i = 0; i < n; i++) { t -= d2[i]; if (t <= 0) { p = i; break; } }
  }
  return c;
}
// One step = give every point to its nearest centre, then move every centre to the mean of its points.
export function kmeans(X, n, k, seed, how = 'random') {
  const r = rng(seed), S = { name: 'kmeans', k, cent: seedCentres(X, n, k, r, how), lab: new Int32Array(n).fill(-1), iter: 0, inertia: NaN, hist: [], done: false, moved: 0, trail: [] };
  S.trail.push(Float64Array.from(S.cent));
  S.step = () => {
    if (S.done) return;
    const c = S.cent; let J = 0, changed = 0;
    for (let i = 0; i < n; i++) { let b = 0, bd = Infinity; for (let j = 0; j < k; j++) { const dx = X[2 * i] - c[2 * j], dy = X[2 * i + 1] - c[2 * j + 1], d = dx * dx + dy * dy; if (d < bd) { bd = d; b = j; } } if (S.lab[i] !== b) { S.lab[i] = b; changed++; } J += bd; }
    S.inertia = J; S.hist.push(J); S.iter++; S.moved = changed;
    if (changed === 0) { S.done = true; return; }
    const sx = new Float64Array(k), sy = new Float64Array(k), cnt = new Int32Array(k);
    for (let i = 0; i < n; i++) { const j = S.lab[i]; sx[j] += X[2 * i]; sy[j] += X[2 * i + 1]; cnt[j]++; }
    for (let j = 0; j < k; j++) {
      if (cnt[j]) { c[2 * j] = sx[j] / cnt[j]; c[2 * j + 1] = sy[j] / cnt[j]; }
      else { // an empty group: put its centre on the point that is farthest from its own centre
        let far = 0, fd = -1; for (let i = 0; i < n; i++) { const q = S.lab[i], dx = X[2 * i] - c[2 * q], dy = X[2 * i + 1] - c[2 * q + 1], d = dx * dx + dy * dy; if (d > fd) { fd = d; far = i; } }
        c[2 * j] = X[2 * far]; c[2 * j + 1] = X[2 * far + 1];
      }
    }
    S.trail.push(Float64Array.from(c));
    if (S.iter >= 300) S.done = true;
  };
  return S;
}

// ---------- Gaussian mixture, fitted by EM ----------
// Each group is an ellipse-shaped cloud: mean (mx,my), covariance (a b; b d), weight w.
// One step = E (how much does each point belong to each cloud) then M (refit every cloud from its share of points).
export function gmm(X, n, k, seed) {
  const r = rng(seed), c = seedCentres(X, n, k, r, 'pp');
  let vx = 0, vy = 0, mx = 0, my = 0; for (let i = 0; i < n; i++) { mx += X[2 * i]; my += X[2 * i + 1]; } mx /= n; my /= n;
  for (let i = 0; i < n; i++) { vx += (X[2 * i] - mx) ** 2; vy += (X[2 * i + 1] - my) ** 2; }
  const v0 = (vx + vy) / (2 * n) / k;
  const S = { name: 'gmm', k, mean: c, cov: new Float64Array(3 * k), w: new Float64Array(k).fill(1 / k), resp: new Float64Array(n * k), lab: new Int32Array(n).fill(-1), iter: 0, ll: NaN, hist: [], done: false };
  for (let j = 0; j < k; j++) { S.cov[3 * j] = v0; S.cov[3 * j + 1] = 0; S.cov[3 * j + 2] = v0; }
  const REG = 1e-6;
  S.step = () => {
    if (S.done) return;
    const { mean, cov, w, resp } = S, logp = new Float64Array(k); let ll = 0;
    const ia = new Float64Array(k), ib = new Float64Array(k), id = new Float64Array(k), ln = new Float64Array(k);
    for (let j = 0; j < k; j++) { const a = cov[3 * j], b = cov[3 * j + 1], d = cov[3 * j + 2], det = a * d - b * b; ia[j] = d / det; ib[j] = -b / det; id[j] = a / det; ln[j] = Math.log(w[j]) - Math.log(2 * Math.PI) - 0.5 * Math.log(det); }
    for (let i = 0; i < n; i++) {
      let mxl = -Infinity;
      for (let j = 0; j < k; j++) { const dx = X[2 * i] - mean[2 * j], dy = X[2 * i + 1] - mean[2 * j + 1]; logp[j] = ln[j] - 0.5 * (ia[j] * dx * dx + 2 * ib[j] * dx * dy + id[j] * dy * dy); if (logp[j] > mxl) mxl = logp[j]; }
      let s = 0; for (let j = 0; j < k; j++) s += Math.exp(logp[j] - mxl);
      ll += mxl + Math.log(s);
      let b = 0; for (let j = 0; j < k; j++) { const q = Math.exp(logp[j] - mxl) / s; resp[i * k + j] = q; if (q > resp[i * k + b]) b = j; }
      S.lab[i] = b;
    }
    ll /= n; const prev = S.ll; S.ll = ll; S.hist.push(ll); S.iter++;
    if ((S.iter > 1 && ll - prev < 1e-6) || S.iter >= 300) { S.done = true; return; }
    for (let j = 0; j < k; j++) {
      let nk = 0, sx = 0, sy = 0; for (let i = 0; i < n; i++) { const q = resp[i * k + j]; nk += q; sx += q * X[2 * i]; sy += q * X[2 * i + 1]; }
      if (nk < 1e-8) continue;
      const ux = sx / nk, uy = sy / nk; let a = 0, b = 0, d = 0;
      for (let i = 0; i < n; i++) { const q = resp[i * k + j], dx = X[2 * i] - ux, dy = X[2 * i + 1] - uy; a += q * dx * dx; b += q * dx * dy; d += q * dy * dy; }
      mean[2 * j] = ux; mean[2 * j + 1] = uy; cov[3 * j] = a / nk + REG; cov[3 * j + 1] = b / nk; cov[3 * j + 2] = d / nk + REG; w[j] = nk / n;
    }
  };
  return S;
}

// ---------- DBSCAN ----------
// A point with at least minPts points inside its reach (itself included) is a "core" point. Groups grow from core to core.
// Labels: -2 not visited yet, -1 noise, 0.. group number. One step visits `batch` points.
export function dbscan(D, n, eps, minPts) {
  const S = { name: 'dbscan', lab: new Int32Array(n).fill(-2), core: new Uint8Array(n), groups: 0, visited: 0, iter: 0, done: false, noise: 0 };
  const nb = i => { const out = []; for (let j = 0, o = i * n; j < n; j++) if (D[o + j] <= eps) out.push(j); return out; };
  let cursor = 0, queue = [], head = 0, cur = -1;
  const visit = () => {
    while (head < queue.length) {
      const j = queue[head++];
      if (S.lab[j] === -1) { S.lab[j] = cur; S.noise--; return true; }        // was noise: now a border point of this group
      if (S.lab[j] !== -2) continue;
      S.lab[j] = cur; S.visited++;
      const q = nb(j); if (q.length >= minPts) { S.core[j] = 1; for (const t of q) if (S.lab[t] < 0) queue.push(t); }
      return true;
    }
    queue = []; head = 0;
    while (cursor < n && S.lab[cursor] !== -2) cursor++;
    if (cursor >= n) return false;
    const i = cursor, q = nb(i); S.visited++;
    if (q.length < minPts) { S.lab[i] = -1; S.noise++; return true; }
    cur = S.groups++; S.lab[i] = cur; S.core[i] = 1; for (const t of q) if (S.lab[t] < 0) queue.push(t);
    return true;
  };
  S.step = (batch = Math.max(4, Math.ceil(n / 40))) => { if (S.done) return; S.iter++; for (let b = 0; b < batch; b++) if (!visit()) { S.done = true; break; } };
  return S;
}

// ---------- hierarchical (bottom-up) ----------
// Start: every point is its own group. One merge joins the two closest groups. Stop at k groups.
// link 'single': distance of two groups = their two closest points. link 'ward': join the pair that adds the least spread.
export function agglo(D, n, k, link = 'single') {
  const M = new Float64Array(n * n);
  for (let i = 0; i < n * n; i++) M[i] = link === 'ward' ? D[i] * D[i] : D[i];
  const S = { name: link, lab: Int32Array.from({ length: n }, (_, i) => i), size: new Int32Array(n).fill(1), alive: new Uint8Array(n).fill(1), groups: n, iter: 0, done: n <= k, lastDist: 0, merges: [] };
  // nearest alive neighbour of every row, kept up to date (makes each merge fast)
  const nn = new Int32Array(n), nd = new Float64Array(n);
  const scan = i => { let b = -1, bd = Infinity; for (let j = 0, o = i * n; j < n; j++) if (j !== i && S.alive[j] && M[o + j] < bd) { bd = M[o + j]; b = j; } nn[i] = b; nd[i] = bd; };
  for (let i = 0; i < n; i++) scan(i);
  const merge = () => {
    let a = -1, bd = Infinity; for (let i = 0; i < n; i++) if (S.alive[i] && nd[i] < bd) { bd = nd[i]; a = i; }
    let b = nn[a]; if (S.size[b] > S.size[a]) { const t = a; a = b; b = t; }       // keep the bigger group's number
    const na = S.size[a], nb = S.size[b];
    for (let c = 0; c < n; c++) {
      if (!S.alive[c] || c === a || c === b) continue;
      const dac = M[a * n + c], dbc = M[b * n + c];
      const v = link === 'ward' ? ((na + S.size[c]) * dac + (nb + S.size[c]) * dbc - S.size[c] * bd) / (na + nb + S.size[c]) : Math.min(dac, dbc);
      M[a * n + c] = v; M[c * n + a] = v;
    }
    S.alive[b] = 0; S.size[a] = na + nb; S.groups--; S.lastDist = link === 'ward' ? Math.sqrt(bd) : bd; S.merges.push([a, b, bd]);
    for (let i = 0; i < n; i++) if (S.lab[i] === b) S.lab[i] = a;
    scan(a);
    for (let c = 0; c < n; c++) { if (!S.alive[c] || c === a) continue; if (nn[c] === a || nn[c] === b) scan(c); else if (M[c * n + a] < nd[c]) { nd[c] = M[c * n + a]; nn[c] = a; } }
  };
  S.step = (batch = Math.max(1, Math.ceil((S.groups - k) / 9))) => { if (S.done) return; S.iter++; for (let b = 0; b < batch && S.groups > k; b++) merge(); if (S.groups <= k) S.done = true; };
  return S;
}

// ---------- scores ----------
// Silhouette: for each point, (distance to nearest other group - distance inside own group) / the larger one. -1..1, higher = clearer groups.
export function silhouette(D, lab, n) {
  const ids = new Map(), cl = new Int32Array(n);
  for (let i = 0; i < n; i++) { if (lab[i] < 0) { cl[i] = -1; continue; } if (!ids.has(lab[i])) ids.set(lab[i], ids.size); cl[i] = ids.get(lab[i]); }
  const k = ids.size; if (k < 2) return NaN;
  const cnt = new Int32Array(k); for (let i = 0; i < n; i++) if (cl[i] >= 0) cnt[cl[i]]++;
  const sum = new Float64Array(k); let tot = 0, m = 0;
  for (let i = 0; i < n; i++) {
    const me = cl[i]; if (me < 0) continue; sum.fill(0);
    for (let j = 0, o = i * n; j < n; j++) if (cl[j] >= 0) sum[cl[j]] += D[o + j];
    m++;
    if (cnt[me] === 1) continue;                                      // a group of one point scores 0
    const a = sum[me] / (cnt[me] - 1); let b = Infinity; for (let c = 0; c < k; c++) if (c !== me) b = Math.min(b, sum[c] / cnt[c]);
    tot += (b - a) / Math.max(a, b);
  }
  return m ? tot / m : NaN;
}
// Adjusted Rand index: agreement of two groupings. 1 = the same groups, about 0 = no better than chance.
export function ari(a, b, n) {
  const key = (m, v) => { if (!m.has(v)) m.set(v, m.size); return m.get(v); }, ma = new Map(), mb = new Map(), tab = new Map();
  const ra = [], rb = [];
  for (let i = 0; i < n; i++) { const x = key(ma, a[i]), y = key(mb, b[i]); ra[x] = (ra[x] || 0) + 1; rb[y] = (rb[y] || 0) + 1; const t = x * 100003 + y; tab.set(t, (tab.get(t) || 0) + 1); }
  const c2 = v => v * (v - 1) / 2; let st = 0, sa = 0, sb = 0;
  for (const v of tab.values()) st += c2(v); for (const v of ra) sa += c2(v); for (const v of rb) sb += c2(v);
  const exp = sa * sb / c2(n), max = (sa + sb) / 2;
  return max === exp ? 1 : (st - exp) / (max - exp);
}
export function inertiaOf(X, lab, n) {
  const s = new Map(); for (let i = 0; i < n; i++) { let g = s.get(lab[i]); if (!g) s.set(lab[i], g = [0, 0, 0]); g[0] += X[2 * i]; g[1] += X[2 * i + 1]; g[2]++; }
  let J = 0; for (let i = 0; i < n; i++) { const g = s.get(lab[i]); J += (X[2 * i] - g[0] / g[2]) ** 2 + (X[2 * i + 1] - g[1] / g[2]) ** 2; } return J;
}

// ---------- maths checks (Node and ?autotest=1) ----------
export function selftest(t, light = false) {
  const run = S => { let g = 0; while (!S.done && g++ < 5000) S.step(); return S; };
  for (const kind of KINDS) for (const n of light ? [300] : [120, 300, 600]) for (const seed of light ? [1] : [1, 2, 3]) {
    if (n === 600 && seed > 1) continue;
    const d = makeData(kind, n, 1, seed), D = distMatrix(d.X, n), k = d.k || 3, tag = `${kind} n=${n} seed=${seed}`;
    for (const how of ['random', 'pp']) {
      const S = run(kmeans(d.X, n, k, seed, how));
      let mono = true; for (let i = 1; i < S.hist.length; i++) if (S.hist[i] > S.hist[i - 1] * (1 + 1e-12)) mono = false;
      t.ok(mono, `k-means(${how}) inertia must never rise: ${tag}`);
      t.ok(S.done && S.iter < 300, `k-means(${how}) must settle: ${tag}`);
      t.ok(Math.abs(S.inertia - inertiaOf(d.X, S.lab, n)) < 1e-9 * (1 + S.inertia), `k-means(${how}) final inertia equals spread around the group means: ${tag}`);
    }
    const G = run(gmm(d.X, n, k, seed));
    let up = true; for (let i = 1; i < G.hist.length; i++) if (G.hist[i] < G.hist[i - 1] - 1e-7) up = false;
    t.ok(up, `EM log-likelihood must never fall: ${tag} ${G.hist.slice(0, 4).map(v => v.toFixed(4))}`);
    t.ok(Math.abs(G.w.reduce((a, b) => a + b, 0) - 1) < 1e-9, `EM weights sum to 1: ${tag}`);
    // DBSCAN: check against the definition
    const B = run(dbscan(D, n, d.eps, 5));
    let okDef = true; const deg = i => { let c = 0; for (let j = 0; j < n; j++) if (D[i * n + j] <= d.eps) c++; return c; };
    for (let i = 0; i < n && okDef; i++) {
      const isCore = deg(i) >= 5; if (isCore !== !!B.core[i]) okDef = false;
      if (isCore) { if (B.lab[i] < 0) okDef = false; for (let j = 0; j < n; j++) if (D[i * n + j] <= d.eps && (B.lab[j] < 0 || (B.core[j] && B.lab[j] !== B.lab[i]))) okDef = false; }
      else if (B.lab[i] >= 0) { let near = false; for (let j = 0; j < n; j++) if (D[i * n + j] <= d.eps && B.core[j] && B.lab[j] === B.lab[i]) near = true; if (!near) okDef = false; }
      else { for (let j = 0; j < n; j++) if (D[i * n + j] <= d.eps && deg(j) >= 5) okDef = false; }
    }
    t.ok(okDef, `DBSCAN result must match the definition (core / border / noise): ${tag}`);
    // single link must equal: build the shortest tree (Kruskal) and stop at k groups
    const A = run(agglo(D, n, k, 'single')), edges = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) edges.push([D[i * n + j], i, j]);
    edges.sort((p, q) => p[0] - q[0]); const par = Int32Array.from({ length: n }, (_, i) => i), find = v => { while (par[v] !== v) v = par[v] = par[par[v]]; return v; };
    let comps = n; for (const [, i, j] of edges) { if (comps <= k) break; const a = find(i), b = find(j); if (a !== b) { par[a] = b; comps--; } }
    t.ok(Math.abs(ari(A.lab, Int32Array.from({ length: n }, (_, i) => find(i)), n) - 1) < 1e-12, `single link equals the shortest-tree answer: ${tag}`);
    const W = run(agglo(D, n, k, 'ward'));
    t.ok(new Set(W.lab).size === k && new Set(A.lab).size === k, `hierarchical ends with exactly k groups: ${tag}`);
    let wm = true; for (let i = 1; i < W.merges.length; i++) if (W.merges[i][2] < W.merges[i - 1][2] - 1e-9) wm = false;
    t.ok(wm, `Ward merge cost never falls: ${tag}`);
    if (n === 120) { // brute-force Ward on the small case: each merge must be the pair with the least increase of spread
      const lab = Int32Array.from({ length: n }, (_, i) => i); let good = true;
      const W2 = agglo(D, n, k, 'ward');
      for (let s = 0; s < 6; s++) {
        const before = Int32Array.from(W2.lab), J0 = inertiaOf(d.X, before, n); W2.step(1);
        const J1 = inertiaOf(d.X, W2.lab, n), ids = [...new Set(before)]; let best = Infinity;
        for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) { const trial = before.map(v => v === ids[b] ? ids[a] : v); best = Math.min(best, inertiaOf(d.X, trial, n) - J0); }
        if (Math.abs((J1 - J0) - best) > 1e-9) good = false;
      }
      t.ok(good, `Ward picks the merge with the least added spread (brute force): ${tag}`);
    }
    const sil = silhouette(D, S_lab(run(kmeans(d.X, n, k, seed, 'pp'))), n);
    t.ok(sil >= -1 && sil <= 1, `silhouette in -1..1: ${tag}`);
    if (d.y && seed === 1 && n === 300) {
      const sc = { kpp: ari(run(kmeans(d.X, n, k, seed, 'pp')).lab, d.y, n), gmm: ari(G.lab, d.y, n), db: ari(B.lab, d.y, n), single: ari(A.lab, d.y, n), ward: ari(W.lab, d.y, n) };
      t.log(`  match with real groups, ${kind}: ` + Object.entries(sc).map(([a, v]) => `${a} ${v.toFixed(2)}`).join('  ') + `  (dbscan groups ${B.groups}, noise ${B.noise})`);
      if (kind === 'segments') t.ok(sc.kpp > 0.9 && sc.gmm > 0.9 && sc.db > 0.85 && sc.ward > 0.9, 'round groups: k-means++, mixture, DBSCAN, Ward all find them');
      if (kind === 'bands') t.ok(sc.gmm > 0.9 && sc.kpp < 0.7, 'long bands: mixture finds them, k-means does not');
      if (kind === 'roads') t.ok(sc.db > 0.95 && sc.single > 0.95 && sc.kpp < 0.7, 'curved roads: DBSCAN and single link find them, k-means does not');
      if (kind === 'ring') t.ok(sc.db > 0.95 && sc.single > 0.95 && sc.kpp < 0.5, 'ring: DBSCAN and single link find it, k-means does not');
      if (kind === 'faulty') t.ok(sc.db > 0.8 && sc.single < 0.6, 'faulty readings: DBSCAN marks them, single link breaks');
    }
  }
  t.ok(Math.abs(ari([0, 0, 1, 1], [1, 1, 0, 0], 4) - 1) < 1e-12 && Math.abs(ari([0, 0, 1, 1], [0, 1, 0, 1], 4) + 0.5) < 1e-12, 'adjusted Rand index known values');
}
const S_lab = S => S.lab;
