// 19.2.9 Transformer blocks: follow fell through attention, add & norm, feed-forward, add & norm. Beat i = sentence i.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play, net } = L;
  const say = (s, c = C.cyan) => showA(s, c);
  const TC = { the: C.muted, red: '#ff7f6e', cup: C.amber, fell: C.violet };
  const TOK = ['the', 'red', 'cup', 'fell'];
  const UV = { the: [1, 0, 0, 0], red: [0, 1, 0, 0], cup: [0, 0, 1, 0], fell: [0, 0, 0, 1] };

  // chapter numbers, full precision
  const w = [0.174878, 0.174878, 0.475367, 0.174878];
  const ATT = [w[2] * 2, w[1] * 2, w[0] * 2, w[2] - 3 * w[0]];   // ≈ (0.951, 0.350, 0.350, −0.049)
  const R1 = ATT.map((v, i) => v + UV.fell[i]);                  // ≈ (0.951, 0.350, 0.350, 0.951)
  const N1 = [1, -1, -1, 1], H = [1, -1], HR = [1, 0];
  const W2 = [[1, 3, -1, -3], [0, 1, 0, 1]], FF = [1, 3, -1, -3];
  const R2 = N1.map((v, i) => v + FF[i]);                        // (2, 2, −2, −2)
  const OUT = [1, 1, -1, -1];
  const pDown = Math.exp(2) / (Math.exp(2) + Math.exp(-2));      // ≈ 0.982
  const f3 = v => Number.isInteger(v) ? (v < 0 ? '−' + (-v) : String(v)) : (v < 0 ? '−' : '') + Math.abs(v).toFixed(3);

  let cur = [];
  const keep = (...o) => { cur.push(...o.flat()); return o.flat(); };
  const swapCur = (a, b) => { const i = cur.indexOf(a); if (i >= 0) cur[i] = b; else cur.push(b); };
  const wipe = () => { const g = cur; cur = []; return g.length ? [new M.FadeOut(new M.VGroup(...g))] : []; };
  const fin = objs => objs.map(o => new M.FadeIn(o));
  const ind = (arr, color) => arr.map(o => new M.Indicate(o, { color }));
  const lag = (objs, rt = 1.2) => new M.LaggedStart(objs.map(o => new M.FadeIn(o)), { lagRatio: 0.15, runTime: rt });

  let boxNow = null;
  const BOX = P ? [0, -3.4, 0] : [0, -3.0, 0];
  function fbox(lines, color = C.cyan, at = BOX) {
    const size = 19, lh = P ? 0.42 : 0.4;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.6, ht = rows.length * lh + 0.3;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(at);
    const top = at[1] + ht / 2 - 0.15 - lh / 2;
    texts.forEach((t, i) => t.moveTo([at[0], top - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = FW - 1.0; if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }
  const boxOff = () => { const b = boxNow; boxNow = null; return b ? [new M.FadeOut(b)] : []; };

  // a vector drawn as a column (or row) of numbered circles
  function vec(vals, c, color = C.ink, o = {}) {
    const r = o.r ?? (P ? 0.38 : 0.3), g = o.g ?? (P ? 0.84 : 0.68), sz = o.sz ?? (P ? 15 : 13), n = vals.length, row = o.row;
    const at = j => row ? [c[0] + (j - (n - 1) / 2) * g, c[1], 0] : [c[0], c[1] + ((n - 1) / 2 - j) * g, 0];
    const circ = vals.map((_, j) => { const k = new M.Circle({ radius: r, color, strokeWidth: 2 }); k.setFill(C.card, 0.95); k.moveTo(at(j)); return k; });
    const txt = vals.map((v, j) => T(typeof v === 'number' ? f3(v) : v, sz, C.ink, true).moveTo(at(j)));
    return { circ, txt, at, parts: () => [...circ, ...txt],
      set(j, v, c2 = C.ink) { const t = T(typeof v === 'number' ? f3(v) : v, sz, c2, true).moveTo(at(j)); const old = txt[j]; txt[j] = t; swapCur(old, t); return [new M.FadeOut(old), new M.FadeIn(t)]; } };
  }
  const label = (s, x, y, c = C.muted, sz = P ? 15 : 17) => T(s, sz, c, true).moveTo([x, y, 0]);

  // ---- 0-4 four tokens, each with four circles
  const PITCH = P ? 1.8 : 2.3, tx = k => (k - 1.5) * PITCH;
  const tokY = P ? 1.4 : 0.9;
  const toks = TOK.map((t, k) => pill(t, TC[t], P ? 17 : 18).moveTo([tx(k), tokY, 0]));
  const rows = TOK.map((t, k) => vec(UV[t], [tx(k), tokY - 0.7, 0], TC[t], { row: true, r: P ? 0.185 : 0.19, g: P ? 0.41 : 0.46, sz: P ? 15 : 14 }));
  await until(S(0)); await play(lag(keep(toks), 1.2), ...say('READ: the red cup fell'));
  await until(S(1)); await play(...say('PREDICT THE NEXT TOKEN?', C.amber));
  await until(S(2)); await play(lag(keep(rows.flatMap(r => r.parts())), 1.6), ...say('4 TOKENS × 4 NUMBERS'));
  await until(S(3)); await play(new M.Indicate(toks[3], { color: C.violet }), ...ind(rows[3].circ, C.violet), ...say('FOLLOW fell THROUGH A BIGGER NETWORK', C.violet));
  await until(S(4)); await play(...ind(rows[3].txt, C.violet), ...say('fell = 0, 0, 0, 1', C.violet));

  // ---- 5-10 a student: collect from classmates, then think alone
  const stY = P ? -0.2 : -0.6;
  const personAt = (x, y, c) => {
    const head = new M.Circle({ radius: 0.15, color: c }); head.setFill(c, 1); head.moveTo([x, y + 0.4, 0]);
    const body = new M.Arc({ radius: 0.28, startAngle: 0, angle: Math.PI, color: c }); body.setFill(c, 1); body.moveTo([x, y + 0.05, 0]);
    return [head, body];
  };
  const mates = (P ? [[-2.6, 1.0], [-2.6, -1.4], [2.6, 1.0]] : [[-4.5, 0.6], [-4.5, -1.8], [4.5, 0.6]]).map(([x, y]) => personAt(x, y, C.muted));
  const me = personAt(0, stY, C.violet);
  const arrows = (P ? [[-2.6, 1.0], [-2.6, -1.4], [2.6, 1.0]] : [[-4.5, 0.6], [-4.5, -1.8], [4.5, 0.6]]).map(([x, y]) => new M.DashedLine({ start: [x + (x < 0 ? 0.45 : -0.45), y + 0.2, 0], end: [x < 0 ? -0.5 : 0.5, stY + 0.25, 0], color: C.cyan, strokeWidth: 3 }));
  const think = new M.Circle({ radius: 0.75, color: C.amber, strokeWidth: 3 }); think.moveTo([0, stY + 0.2, 0]);
  await until(S(5)); await play(...wipe(), ...fin(keep(mates.flat(), me)), ...say('COLLECT FROM CLASSMATES, THEN THINK ALONE'));
  await until(S(6)); await play(...ind(me, C.violet), ...say('EACH TOKEN DOES THE SAME', C.violet));
  await until(S(7)); await play(...arrows.map(a => new M.Create(a)), ...say('1. ATTENTION: COLLECT FROM OTHER TOKENS'));
  keep(arrows);
  await until(S(8)); await play(new M.Create(think), ...say('2. ANOTHER NETWORK: THINK INSIDE THE TOKEN', C.amber));
  keep(think);
  await until(S(9)); await play(new M.Indicate(think, { color: C.green }), ...say('KEEP OLD INFORMATION + FIX THE SCALE', C.green));
  await until(S(10)); await play(...say('ALL TOGETHER = A TRANSFORMER BLOCK', C.green));

  // ---- 11-17 the two heads
  const CY = P ? 0.0 : -0.2, GV = P ? 0.84 : 0.68, RV = P ? 0.38 : 0.3, LABY = CY + 1.5 * GV + RV + 0.25;
  const inX = P ? -3.1 : -5.0, jX = P ? 2.6 : 2.8;
  const hc = P ? [[-0.4, 1.1, 0], [-0.4, -1.3, 0]] : [[-1.4, 0.45, 0], [-1.4, -1.55, 0]];
  const hw = P ? 1.8 : 2.4, hh = P ? 1.5 : 1.3;
  const heads = hc.map((c, h) => {
    const N = net({ layers: [4, 2], center: c, width: hw, height: hh, r: P ? 0.19 : 0.17 });
    TOK.forEach((t, i) => N.nodes[0][i].setColor(TC[t]));
    const wts = h === 0 ? w : [w[0], w[2], w[1], w[3]];
    N.edges[0].forEach((row, i) => row.forEach(ln => { const a = Math.min(1, wts[i] * 2); ln.setColor(C.cyan); ln.setStrokeWidth(1 + 5 * a); ln.setStrokeOpacity(0.2 + 0.75 * a); }));
    return N;
  });
  const hlab = hc.map((c, h) => label('head ' + (h + 1), c[0], P ? c[1] - hh / 2 - 0.3 : c[1] + hh / 2 + 0.25, C.cyan));
  const IN = vec(UV.fell, [inX, CY, 0], C.violet, { sz: 15 });
  const inLab = label('fell', inX, LABY, C.violet);
  const feed = heads.map(N => new M.DashedLine({ start: [inX + RV + 0.05, CY, 0], end: [N.pos(0, 3)[0] - 0.2, N.pos(0, 3)[1], 0], color: C.violet, strokeWidth: 2 }));
  const J = vec(ATT, [jX, CY, 0], C.cyan);
  const jLab = label('joined', jX, LABY, C.cyan);
  const join = [0, 1, 2, 3].map(j => { const o = heads[j < 2 ? 0 : 1].pos(1, j % 2); return new M.DashedLine({ start: [o[0] + 0.2, o[1], 0], end: [jX - RV - 0.05, J.at(j)[1], 0], color: C.muted, strokeWidth: 2 }); });
  await until(S(11)); await play(...wipe(), ...fin(keep(IN.parts(), inLab)), ...say('ONE COMPLETE BLOCK FOR fell'));
  await until(S(12)); await play(...fin(keep(heads.map(N => N.group), hlab)), ...say('TWO HEADS, SIDE BY SIDE'));
  await until(S(13)); await play(...feed.map(f => new M.Create(f)), ...say('BOTH GET fell = 0, 0, 0, 1', C.violet));
  keep(feed);
  await until(S(14)); await play(new M.Indicate(heads[0].nodes[0][2], { color: C.amber }), new M.Indicate(heads[1].nodes[0][1], { color: TC.red }), ...heads.flatMap(N => N.flow(0, C.amber)), ...say('HEAD 1 → cup    HEAD 2 → red', C.amber));
  await until(S(15)); await play(...join.map(l => new M.Create(l)), ...fin(keep(J.circ, jLab)), ...say('JOIN: ONE VECTOR, 4 NUMBERS'));
  keep(join);
  await until(S(16)); await play(lag(keep(J.txt.slice(0, 3)), 1.5), ...say('0.951, 0.350, 0.350', C.cyan));
  await until(S(17)); await play(lag(keep(J.txt.slice(3)), 0.6), ...say('AND −0.049', C.cyan));

  // ---- 18-24 residual connection, add, layer norm (same layout used again at 39-42)
  const XS = P ? [-3.0, -1.0, 1.0, 3.0] : [-4.5, -1.5, 1.5, 4.5];
  function addView(a, b, sum, nrm, names, colors) {
    const V = { cols: [a, b, sum, nrm].map((v, k) => vec(v, [XS[k], CY, 0], colors[k])) };
    V.labs = names.map((s, k) => label(s, XS[k], LABY, colors[k]));
    V.ops = ['+', '=', '→'].map((s, k) => T(s, 26, C.ink, true).moveTo([(XS[k] + XS[k + 1]) / 2, CY, 0]));
    const cb = CY - 1.5 * GV - RV - 0.05, ry = cb - 0.3;
    V.res = [[[XS[0], cb], [XS[0], ry]], [[XS[0], ry], [XS[2], ry]], [[XS[2], ry], [XS[2], cb]]]
      .map(([p, q]) => new M.Line({ start: [p[0], p[1], 0], end: [q[0], q[1], 0], color: C.green, strokeWidth: 4 }));
    V.resLab = label('residual connection', (XS[0] + XS[2]) / 2, ry - 0.3, C.green);
    return V;
  }
  const V1 = addView(UV.fell, ATT, R1, N1, ['fell input', 'attention', 'sum', 'layer norm'], [C.violet, C.cyan, C.green, C.amber]);
  await until(S(18)); await play(...wipe(), ...fin(keep(V1.cols[0].parts(), V1.cols[1].parts(), V1.labs.slice(0, 2), V1.ops[0])), ...say('ALSO KEEP THE ORIGINAL VECTOR', C.violet));
  await until(S(19)); await play(new M.LaggedStart(V1.res.map(l => new M.Create(l)), { lagRatio: 0.6, runTime: 1.8 }), ...say('A CONNECTION AROUND ATTENTION', C.green));
  keep(V1.res);
  await until(S(20)); await play(...fin(keep(V1.ops[1], V1.cols[2].circ, V1.labs[2])), ...ind([...V1.cols[0].circ, ...V1.cols[1].circ], C.green), ...say('ADD MATCHING NUMBERS', C.green));
  await until(S(21)); await play(new M.FadeIn(V1.resLab), ...say('RESIDUAL CONNECTION', C.green));
  keep(V1.resLab);
  await until(S(22)); await play(lag(keep(V1.cols[2].txt), 1.4), new M.Indicate(V1.cols[2].circ[3], { color: C.amber }), ...say('ONLY NUMBER 4 CHANGES: −0.049 + 1 ≈ 0.951', C.amber));
  await until(S(23)); await play(...fin(keep(V1.ops[2], V1.cols[3].circ, V1.labs[3])), ...say('LAYER NORM: CENTER AND SPREAD', C.amber));
  await until(S(24)); await play(lag(keep(V1.cols[3].txt), 1.2), ...say('1, −1, −1, 1', C.amber));

  // ---- 25-38 feed-forward network 4 → 2 → 4
  const fc = P ? [0, 0.3, 0] : [-0.8, -0.3, 0];
  const FN = net({ layers: [4, 2, 4], center: fc, width: P ? 5.2 : 6.4, height: P ? 2.7 : 2.6, r: 0.27 });
  const wl = (ln, wv) => { if (!wv) { ln.setColor(C.line); ln.setStrokeWidth(1); return; } const a = Math.min(1, Math.abs(wv) / 3); ln.setColor(wv < 0 ? C.pink : C.cyan); ln.setStrokeWidth(2 + 5 * a); ln.setStrokeOpacity(0.5 + 0.45 * a); };
  FN.edges[0].forEach((row, i) => row.forEach((ln, j) => wl(ln, (i === 0 && j === 0) || (i === 1 && j === 1) ? 1 : 0)));
  FN.edges[1].forEach(row => row.forEach(ln => { ln.setColor(C.line); ln.setStrokeWidth(1.5); }));
  const capY = fc[1] + (P ? 1.35 : 1.3) + 0.35;
  const fcap = [['input', 0, C.amber], ['middle', 1, C.cyan], ['output', 2, C.green]].map(([s, l, c]) => label(s, FN.pos(l, 0)[0], capY, c));
  let vals = {};
  const nv = (l, i, s, col = C.ink) => { const t = T(typeof s === 'number' ? f3(s) : s, 15, col, true).moveTo(FN.pos(l, i)); const k = l + ':' + i, a = [new M.FadeIn(t)]; if (vals[k]) { a.push(new M.FadeOut(vals[k])); swapCur(vals[k], t); } else cur.push(t); vals[k] = t; return a; };
  const wlabs = W2[0].map((wv, j) => { const a = FN.pos(1, 0), b = FN.pos(2, j); return label((wv < 0 ? '−' : '') + Math.abs(wv), a[0] + (b[0] - a[0]) * 0.62, a[1] + (b[1] - a[1]) * 0.62 + 0.14, wv < 0 ? C.pink : C.cyan, 14); });
  const FBX = P ? [0, -2.7, 0] : [4.9, -0.3, 0];
  await until(S(25)); await play(...wipe(), ...fin(keep(FN.group, fcap)), ...say('NEW NETWORK: 4 → 2 → 4 (SIMPLIFIED)'));
  await play(...N1.flatMap((v, i) => nv(0, i, v, C.amber)));
  await until(S(26)); await play(...say('ONE TOKEN AT A TIME, NO OTHER TOKENS', C.amber));
  await until(S(27)); await play(...FN.flow(0, C.amber), ...say('FEED-FORWARD: INFORMATION MOVES FORWARD', C.green));
  await until(S(28)); await play(new M.Indicate(FN.edges[0][0][0], { color: C.cyan }), ...nv(1, 0, 1, C.cyan), ...fbox(['middle 1 = 1 × 1 = 1'], C.cyan, FBX));
  await until(S(29)); await play(new M.Indicate(FN.edges[0][1][1], { color: C.cyan }), ...nv(1, 1, -1, C.pink), ...fbox(['middle 1 = 1 × 1 = 1', 'middle 2 = −1 × 1 = −1'], C.cyan, FBX));
  await until(S(30)); await play(...ind([FN.nodes[1][0], FN.nodes[1][1]], C.cyan), ...say('MIDDLE: 1 AND −1'));
  await until(S(31)); await play(...fbox(['positive → stays', ['negative → 0', C.pink]], C.violet, FBX), ...say('KEEP POSITIVE, NEGATIVE BECOMES 0', C.violet));
  await until(S(32)); await play(...say('THIS RULE = ReLU (AN ACTIVATION FUNCTION)', C.violet));
  await until(S(33)); await play(...nv(1, 1, 0, C.ink), new M.Flash(FN.nodes[1][1], { color: C.violet }), ...fbox(['ReLU(1) = 1', 'ReLU(−1) = 0'], C.violet, FBX), ...say('MIDDLE NOW: 1 AND 0', C.violet));
  await until(S(34)); await play(...FN.edges[1][0].map((ln, j) => new M.Transform(ln, (() => { const c = ln.copy(); wl(c, W2[0][j]); return c; })())), ...say('4 LINES FROM MIDDLE 1'));
  await until(S(35)); await play(...fin(keep(wlabs)), ...say('WEIGHTS: 1, 3, −1, −3'));
  await until(S(36)); await play(...FF.flatMap((v, j) => nv(2, j, v, v < 0 ? C.pink : C.green)), ...fbox(['1 × 1 = 1    1 × 3 = 3', '1 × (−1) = −1    1 × (−3) = −3'], C.green, FBX));
  await until(S(37)); await play(new M.Indicate(FN.nodes[1][1], { color: C.muted }), ...fbox(['middle 2 = 0', '0 × anything = 0'], C.muted, FBX), ...say('MIDDLE 2 ADDS NOTHING', C.muted));
  await until(S(38)); await play(...ind(FN.nodes[2], C.green), ...fbox([['feed-forward output', C.green], '1, 3, −1, −3'], C.green, FBX));

  // ---- 39-42 second residual connection and layer norm
  const V2 = addView(N1, FF, R2, OUT, ['FF input', 'FF output', 'sum', 'layer norm'], [C.amber, C.green, C.cyan, C.violet]);
  await until(S(39)); await play(...wipe(), ...boxOff(), ...fin(keep(V2.cols[0].parts(), V2.cols[1].parts(), V2.labs.slice(0, 2), V2.ops[0])), ...say('ANOTHER RESIDUAL CONNECTION', C.green));
  await play(new M.LaggedStart(V2.res.map(l => new M.Create(l)), { lagRatio: 0.6, runTime: 1.4 }), new M.FadeIn(V2.resLab));
  keep(V2.res, V2.resLab);
  await until(S(40)); await play(...fin(keep(V2.ops[1], V2.cols[2].parts(), V2.labs[2])), ...say('ADD: 2, 2, −2, −2', C.cyan));
  await until(S(41)); await play(...fin(keep(V2.ops[2], V2.cols[3].circ, V2.labs[3])), ...fbox(['mean 0, standard deviation 2', '(2, 2, −2, −2) ÷ 2'], C.violet), ...say('LAYER NORM AGAIN', C.violet));
  await until(S(42)); await play(lag(keep(V2.cols[3].txt), 1.2), ...fbox([['block output for fell', C.violet], '1, 1, −1, −1'], C.violet), ...say('FINAL OUTPUT: 1, 1, −1, −1', C.violet));

  // ---- 43-45 two short formulas
  const mid = P ? [0, 0.2, 0] : [0, -0.4, 0];
  const STG = [['input', C.violet], ['attention', C.cyan], ['add + layer norm', C.green], ['feed-forward', C.amber], ['add + layer norm', C.green], ['block output', C.violet]];
  const stP = k => P ? [0, -1.55 - k * 0.72, 0] : [(k - 2.5) * 2.35, 0.95, 0];
  const stg = STG.map(([s, c], k) => pill(s, c, P ? 16 : 15).moveTo(stP(k)));
  const stA = STG.slice(1).map((_, k) => { const a = stP(k), b = stP(k + 1); return P ? new M.Line({ start: [0, a[1] - 0.2, 0], end: [0, b[1] + 0.2, 0], color: C.muted, strokeWidth: 2 }) : new M.Line({ start: [(a[0] + b[0]) / 2 - 0.12, a[1], 0], end: [(a[0] + b[0]) / 2 + 0.12, a[1], 0], color: C.muted, strokeWidth: 2 }); });
  await until(S(43)); await play(...wipe(), ...boxOff(), lag(keep(stg, stA), 1.4), ...say('THE BLOCK IN TWO FORMULAS'));
  await until(S(44)); await play(...fbox([['first result =', C.cyan], 'LayerNorm(input + attention output)'], C.cyan, mid), ...ind(stg.slice(0, 3), C.cyan));
  await until(S(45)); await play(...ind(stg.slice(2, 6), C.green), ...fbox([['first result =', C.cyan], 'LayerNorm(input + attention output)', ['block output =', C.green], 'LayerNorm(first result + feed-forward output)'], C.green, mid));

  // ---- 46-50 prediction network: down or up
  const pc = P ? [0, 0.3, 0] : [-2.4, -0.3, 0];
  const PN = net({ layers: [4, 2], center: pc, width: P ? 3.6 : 4.4, height: P ? 2.6 : 2.6, r: 0.28 });
  PN.edges[0].forEach((row, i) => row.forEach((ln, j) => wl(ln, (j === 0 && i < 2) || (j === 1 && i > 1) ? 1 : 0)));
  const pIn = OUT.map((v, i) => T(f3(v), 15, v < 0 ? C.pink : C.ink, true).moveTo(PN.pos(0, i)));
  const pNames = ['down', 'up'].map((s, j) => { const p = PN.pos(1, j); return label(s, p[0] + 0.85, p[1], C.amber, P ? 16 : 17); });
  const PBX = P ? [0, -2.7, 0] : [3.7, -0.3, 0];
  await until(S(46)); await play(...wipe(), ...boxOff(), ...fin(keep(PN.group, pIn, pNames)), ...say('PREDICTION: down OR up?', C.amber));
  await until(S(47)); await play(...PN.edges[0].slice(0, 2).map(r => new M.Indicate(r[0], { color: C.cyan })), ...fbox(['down = 1 + 1 = 2'], C.amber, PBX));
  const sD = T('2', 15, C.green, true).moveTo(PN.pos(1, 0)), sU = T('−2', 15, C.pink, true).moveTo(PN.pos(1, 1));
  await play(...fin(keep(sD)));
  await until(S(48)); await play(...fin(keep(sU)), ...fbox(['down = 1 + 1 = 2', 'up = −1 + (−1) = −2'], C.amber, PBX));
  await until(S(49)); await play(...fbox(['softmax:', [`down ≈ ${(pDown * 100).toFixed(1)}%`, C.green], [`up ≈ ${((1 - pDown) * 100).toFixed(1)}%`, C.pink]], C.amber, PBX), ...say('SOFTMAX → SHARES', C.amber));
  await until(S(50)); await play(new M.Flash(PN.nodes[1][0], { color: C.green }), new M.Indicate(pNames[0], { color: C.green }), ...say('the red cup fell down', C.green));

  // ---- 51-54 the idea
  await until(S(51)); await play(...say('COLLECT, COMBINE, PROCESS, PREDICT', C.green));
  await until(S(52)); await play(...fbox(['real models: many blocks', 'block 1 → block 2 → block 3 → …'], C.cyan, PBX), ...say('MANY BLOCKS, ONE AFTER ANOTHER'));
  await until(S(53)); await play(...ind(PN.edges[0].flat(), C.muted), ...say('NOT TRAINING: THE WEIGHTS DO NOT CHANGE', C.pink));
  await until(S(54)); await play(...fbox([['attention: between tokens', C.cyan], ['feed-forward: each token alone', C.green]], C.green, PBX), ...say('SHARE BETWEEN, PROCESS EACH ALONE', C.green));
}
