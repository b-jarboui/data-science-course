// A real multi-layer neural network (pure maths, no page code). Used by labs 2, 3 and 5.
// sizes = [inputs, hidden..., outputs]; act = tanh | relu | leaky | sigmoid (hidden layers);
// out = softmax (classes, cross-entropy) | sigmoid (two classes) | linear (a number, squared error).
import { rng } from './kit.js';

export const ACTS = {
  tanh: { f: z => Math.tanh(z), d: a => 1 - a * a },
  relu: { f: z => z > 0 ? z : 0, d: a => a > 0 ? 1 : 0 },
  leaky: { f: z => z > 0 ? z : 0.05 * z, d: a => a > 0 ? 1 : 0.05 },
  sigmoid: { f: z => z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)), d: a => a * (1 - a) },
};
export function mlp(o) {
  const sizes = o.sizes, L = sizes.length - 1, r = rng(o.seed || 1), act = ACTS[o.act || 'tanh'], outT = o.out || 'softmax';
  const W = [], B = [], gW = [], gB = [], mW = [], vW = [], mB = [], vB = [], A = [new Float64Array(sizes[0])], Dl = [];
  for (let l = 0; l < L; l++) {
    const ni = sizes[l], no = sizes[l + 1];
    // starting weights: "He" size for ReLU kinds, "Xavier" size for tanh / sigmoid (the usual good practice)
    const sd = (l < L - 1 && (o.act === 'relu' || o.act === 'leaky')) ? Math.sqrt(2 / ni) : Math.sqrt(1 / ni);
    W[l] = Float64Array.from({ length: ni * no }, () => r.n() * sd); B[l] = new Float64Array(no);
    gW[l] = new Float64Array(ni * no); gB[l] = new Float64Array(no); mW[l] = new Float64Array(ni * no); vW[l] = new Float64Array(ni * no); mB[l] = new Float64Array(no); vB[l] = new Float64Array(no);
    A[l + 1] = new Float64Array(no); Dl[l] = new Float64Array(no);
  }
  const N = { sizes, L, W, B, A, gW, gB, lr: o.lr || 0.01, opt: o.opt || 'adam', t: 0, gnorm: new Float64Array(L), actName: o.act || 'tanh', outT };
  // forward pass for the sample that starts at X[off]; returns the output layer (probabilities or the number)
  N.fwd = (X, off) => {
    const a0 = A[0]; for (let i = 0; i < sizes[0]; i++) a0[i] = X[off + i];
    for (let l = 0; l < L; l++) {
      const ni = sizes[l], no = sizes[l + 1], w = W[l], b = B[l], ain = A[l], out = A[l + 1], last = l === L - 1;
      for (let j = 0, p = 0; j < no; j++) { let z = b[j]; for (let i = 0; i < ni; i++) z += w[p++] * ain[i]; out[j] = last ? z : act.f(z); }
      if (last) {
        if (outT === 'softmax') { let m = -Infinity; for (let j = 0; j < no; j++) if (out[j] > m) m = out[j]; let s = 0; for (let j = 0; j < no; j++) { out[j] = Math.exp(out[j] - m); s += out[j]; } for (let j = 0; j < no; j++) out[j] /= s; }
        else if (outT === 'sigmoid') out[0] = ACTS.sigmoid.f(out[0]);
      }
    }
    return A[L];
  };
  const lossOf = (out, y) => outT === 'softmax' ? -Math.log(Math.max(out[y], 1e-12)) : outT === 'sigmoid' ? -(y ? Math.log(Math.max(out[0], 1e-12)) : Math.log(Math.max(1 - out[0], 1e-12))) : 0.5 * (out[0] - y) ** 2;
  // gradient of the mean loss over the samples idx[start .. start+count) (backpropagation); returns the mean loss
  N.grad = (X, Y, idx, start, count) => {
    for (let l = 0; l < L; l++) { gW[l].fill(0); gB[l].fill(0); }
    let loss = 0; const nin = sizes[0];
    for (let s = 0; s < count; s++) {
      const id = idx ? idx[start + s] : start + s, out = N.fwd(X, id * nin), y = Y[id]; loss += lossOf(out, y);
      const dl = Dl[L - 1];
      if (outT === 'softmax') { for (let j = 0; j < dl.length; j++) dl[j] = out[j] - (j === y ? 1 : 0); } else dl[0] = out[0] - y;
      for (let l = L - 1; l >= 0; l--) {
        const ni = sizes[l], no = sizes[l + 1], d = Dl[l], ain = A[l], g = gW[l], gb = gB[l];
        for (let j = 0, p = 0; j < no; j++) { const dj = d[j]; gb[j] += dj; if (dj !== 0) for (let i = 0; i < ni; i++) g[p + i] += dj * ain[i]; p += ni; }
        if (l > 0) { const dp = Dl[l - 1], w = W[l]; for (let i = 0; i < ni; i++) { let v = 0; for (let j = 0; j < no; j++) v += w[j * ni + i] * d[j]; dp[i] = v * act.d(ain[i]); } }
      }
    }
    for (let l = 0; l < L; l++) { let s = 0; const g = gW[l]; for (let i = 0; i < g.length; i++) { g[i] /= count; s += Math.abs(g[i]); } for (let j = 0; j < gB[l].length; j++) gB[l][j] /= count; N.gnorm[l] = s / g.length; }
    return loss / count;
  };
  // one update of all weights from the stored gradient
  N.apply = () => {
    N.t++; const lr = N.lr, b1 = 0.9, b2 = 0.999, c1 = 1 - Math.pow(b1, N.t), c2 = 1 - Math.pow(b2, N.t);
    const upd = (w, g, m, v) => {
      if (N.opt === 'adam') for (let i = 0; i < w.length; i++) { m[i] = b1 * m[i] + (1 - b1) * g[i]; v[i] = b2 * v[i] + (1 - b2) * g[i] * g[i]; w[i] -= lr * (m[i] / c1) / (Math.sqrt(v[i] / c2) + 1e-8); }
      else if (N.opt === 'momentum') for (let i = 0; i < w.length; i++) { m[i] = 0.9 * m[i] + g[i]; w[i] -= lr * m[i]; }
      else for (let i = 0; i < w.length; i++) w[i] -= lr * g[i];
    };
    for (let l = 0; l < L; l++) { upd(W[l], gW[l], mW[l], vW[l]); upd(B[l], gB[l], mB[l], vB[l]); }
  };
  N.train = (X, Y, idx, start, count) => { const l = N.grad(X, Y, idx, start, count); N.apply(); return l; };
  // mean loss and share of right answers on n samples (idx optional)
  N.evaluate = (X, Y, n, idx) => {
    let loss = 0, ok = 0; const nin = sizes[0];
    for (let s = 0; s < n; s++) { const id = idx ? idx[s] : s, out = N.fwd(X, id * nin), y = Y[id]; loss += lossOf(out, y);
      if (outT === 'softmax') { let b = 0; for (let j = 1; j < out.length; j++) if (out[j] > out[b]) b = j; if (b === y) ok++; } else if (outT === 'sigmoid') { if ((out[0] >= 0.5 ? 1 : 0) === y) ok++; } }
    return { loss: loss / n, acc: ok / n };
  };
  N.weights = () => W.reduce((s, w, l) => s + w.length + B[l].length, 0);
  return N;
}

export function selftest(t) {
  // backpropagation must agree with the slope measured by small changes of each weight
  for (const act of ['tanh', 'relu', 'leaky', 'sigmoid']) for (const out of ['softmax', 'sigmoid', 'linear']) {
    const r = rng(5), n = 6, X = Float64Array.from({ length: n * 3 }, () => r.n()), Y = out === 'softmax' ? Int32Array.from({ length: n }, () => r.int(3)) : out === 'sigmoid' ? Int32Array.from({ length: n }, () => r.int(2)) : Float64Array.from({ length: n }, () => r.n());
    const N = mlp({ sizes: [3, 5, 4, out === 'softmax' ? 3 : 1], act, out, seed: 3 });
    N.grad(X, Y, null, 0, n); let worst = 0;
    for (let l = 0; l < N.L; l++) for (const [w, g] of [[N.W[l], N.gW[l]], [N.B[l], N.gB[l]]]) { const ga = Float64Array.from(g); for (let i = 0; i < w.length; i += 3) { const keep = w[i], e = 1e-5; w[i] = keep + e; const lp = N.evaluate(X, Y, n).loss; w[i] = keep - e; const lm = N.evaluate(X, Y, n).loss; w[i] = keep; worst = Math.max(worst, Math.abs((lp - lm) / (2 * e) - ga[i])); } }
    t.ok(worst < 1e-6, `backprop equals measured slope (${act}, ${out}): worst gap ${worst.toExponential(2)}`);
  }
  // a network must learn XOR, and plain gradient descent with a small step must lower the loss
  const X = Float64Array.from([0, 0, 0, 1, 1, 0, 1, 1]), Y = Int32Array.from([0, 1, 1, 0]);
  for (const act of ['tanh', 'relu', 'leaky', 'sigmoid']) { const N = mlp({ sizes: [2, 8, 2], act, seed: 2, lr: 0.05 }); for (let i = 0; i < 1500; i++) N.train(X, Y, null, 0, 4); t.ok(N.evaluate(X, Y, 4).acc === 1, `network learns XOR (${act})`); }
  const G = mlp({ sizes: [2, 6, 2], act: 'tanh', seed: 4, lr: 0.1, opt: 'sgd' }); let prev = Infinity, mono = true;
  for (let i = 0; i < 300; i++) { const l = G.train(X, Y, null, 0, 4); if (l > prev + 1e-12) mono = false; prev = l; }
  t.ok(mono, 'full-batch gradient descent with a small step never raises the loss');
}
