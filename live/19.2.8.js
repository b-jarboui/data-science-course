// 19.2.8 Layer normalization: move the center to 0, set the spread to 1. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;
  const say = (s, c = C.cyan) => showA(s, c);
  const TC = { the: C.muted, red: '#ff7f6e', cup: C.amber, fell: C.violet };
  const TOK = ['the', 'red', 'cup', 'fell'];
  const UV = { the: [1, 0, 0, 0], red: [0, 1, 0, 0], cup: [0, 0, 1, 0], fell: [0, 0, 0, 1] };

  // exact chapter numbers (full precision), shown rounded
  const w1 = [0.174878, 0.174878, 0.475367, 0.174878];
  const H1 = [w1[2] * 2, w1[1] * 2];                       // ≈ (0.951, 0.350)
  const H2 = [w1[1] * 2, w1[2] * 1 - 3 * w1[0]]; // head 2 gives red 0.475; ≈ (0.350, -0.049)
  const ATT = [...H1, ...H2];
  const SUM = ATT.map((v, i) => v + UV.fell[i]);            // ≈ (0.951, 0.350, 0.350, 0.951)
  const MEAN = SUM.reduce((a, b) => a + b, 0) / 4;          // ≈ 0.650
  const DIF = SUM.map(v => v - MEAN);                       // ≈ ±0.3005
  const VAR = DIF.reduce((a, d) => a + d * d, 0) / 4;       // ≈ 0.0903
  const SD = Math.sqrt(VAR);                                // ≈ 0.3005
  const NRM = DIF.map(d => d / SD);                         // (1, -1, -1, 1)
  const f3 = v => (v < 0 ? '−' : '') + Math.abs(v).toFixed(3);

  // ---- bookkeeping
  let cur = [];
  const keep = (...o) => { cur.push(...o.flat()); return o.flat(); };
  const swapCur = (a, b) => { const i = cur.indexOf(a); if (i >= 0) cur[i] = b; else cur.push(b); };
  const wipe = () => { const g = cur; cur = []; return g.length ? [new M.FadeOut(new M.VGroup(...g))] : []; };
  const fin = objs => objs.map(o => new M.FadeIn(o));
  const ind = (arr, color) => arr.map(o => new M.Indicate(o, { color }));
  const lag = (objs, rt = 1.2) => new M.LaggedStart(objs.map(o => new M.FadeIn(o)), { lagRatio: 0.15, runTime: rt });

  let boxNow = null;
  const BOX = P ? [0, -4.6, 0] : [0, -2.3, 0];
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

  // vertical vector: a column of numbered circles
  function col(vals, c, color = C.ink, o = {}) {
    const r = o.r ?? (P ? 0.38 : 0.36), g = o.g ?? (P ? 0.84 : 0.8), sz = o.sz ?? (P ? 15 : 14), n = vals.length;
    const at = j => [c[0], c[1] + ((n - 1) / 2 - j) * g, 0];
    const circ = vals.map((_, j) => { const k = new M.Circle({ radius: r, color, strokeWidth: 2 }); k.setFill(C.card, 0.95); k.moveTo(at(j)); return k; });
    const txt = vals.map((v, j) => T(String(v), sz, C.ink, true).moveTo(at(j)));
    return { circ, txt, at, parts: () => [...circ, ...txt],
      set(j, v, c2 = C.ink) { const t = T(String(v), sz, c2, true).moveTo(at(j)); const old = txt[j]; txt[j] = t; swapCur(old, t); return [new M.FadeOut(old), new M.FadeIn(t)]; } };
  }

  // ---- 0-3 four tokens and their numbers
  const PITCH = P ? 1.8 : 2.4, tx = k => (k - 1.5) * PITCH;
  const tokY = P ? 1.7 : 1.1;
  const toks = TOK.map((w, k) => pill(w, TC[w], P ? 17 : 18).moveTo([tx(k), tokY, 0]));
  const cols = TOK.map((w, k) => col(UV[w], [tx(k), tokY - (P ? 1.5 : 1.45), 0], TC[w], { r: 0.2, g: 0.46, sz: 14 }));
  await until(S(0)); await play(lag(keep(toks, cols.flatMap(c => c.parts())), 1.6), ...say('READ: the red cup fell'));
  await until(S(1)); await play(new M.LaggedStart(cols.flatMap(c => ind(c.txt, C.amber)), { lagRatio: 0.04, runTime: 2 }), ...say('THE NUMBERS CHANGE ON THE WAY', C.amber));
  await until(S(2)); await play(...ind(cols[3].circ, C.pink), ...say('SOME GROW BIG, SOME GET SMALL', C.pink));
  await until(S(3)); await play(...say('HOW DO WE KEEP A USEFUL SCALE?', C.violet));

  // ---- 4-11 two heads, joined output, plus the original vector
  const hw = P ? 1.5 : 1.8, hh = P ? 1.3 : 1.5;
  const hc = P ? [[-1.85, 1.25, 0], [1.85, 1.25, 0]] : [[-4.6, 0.55, 0], [-4.6, -1.75, 0]];
  const heads = hc.map((c, h) => {
    const N = net({ layers: [4, 2], center: c, width: hw, height: hh, r: P ? 0.17 : 0.18 });
    TOK.forEach((w, i) => { N.nodes[0][i].setColor(TC[w]); N.nodes[0][i].setFill(C.card, 0.95); });
    const wts = h === 0 ? [w1[0], w1[1], w1[2], w1[3]] : [w1[0], w1[2], w1[1], w1[3]];
    N.edges[0].forEach((row, i) => row.forEach(ln => { const a = Math.min(1, wts[i] * 2); ln.setColor(C.cyan); ln.setStrokeWidth(1 + 5 * a); ln.setStrokeOpacity(0.2 + 0.75 * a); }));
    return N;
  });
  const hlab = hc.map((c, h) => T('head ' + (h + 1), P ? 15 : 16, C.cyan, true).moveTo(P ? [c[0], c[1] - hh / 2 - 0.4, 0] : [c[0] - hw / 2 - 0.95, c[1], 0]));
  const cy = P ? -2.1 : -0.6;
  const X = P ? { j: -2.5, p: -1.5, o: -0.5, e: 0.5, s: 1.6 } : { j: -1.6, p: -0.5, o: 0.6, e: 1.7, s: 2.9 };
  const J = col(ATT.map(f3), [X.j, cy, 0], C.cyan);
  const O = col(UV.fell, [X.o, cy, 0], C.violet, { sz: 15 });
  const Sv = col(SUM.map(f3), [X.s, cy, 0], C.green);
  const plus = T('+', 26, C.ink, true).moveTo([X.p, cy, 0]), eq = T('=', 26, C.ink, true).moveTo([X.e, cy, 0]);
  const labY = cy + 1.5 * (P ? 0.84 : 0.8) + 0.55;
  const clab = [['heads', X.j, C.cyan], ['fell', X.o, C.violet], ['sum', X.s, C.green]].map(([s, x, c]) => T(s, P ? 15 : 15, c, true).moveTo([x, labY, 0]));
  const joinL = [0, 1, 2, 3].map(j => { const h = heads[j < 2 ? 0 : 1], o = h.pos(1, j % 2); return new M.DashedLine({ start: [o[0] + 0.2, o[1], 0], end: [X.j - 0.3, J.at(j)[1], 0], color: C.muted, strokeWidth: 2 }); });
  await until(S(4)); await play(...wipe(), ...fin(keep(heads.map(h => h.group), hlab)), ...say('TWO HEADS, NO POSITION INFORMATION'));
  await until(S(5)); await play(...heads.flatMap(h => h.flow(0, C.violet)), ...say('FOLLOW fell', C.violet));
  await until(S(6)); await play(...fin(keep(P ? [] : joinL, J.circ, clab[0])), ...(P ? hlab.map(t => new M.Indicate(t, { color: C.cyan })) : []), ...say('TOGETHER: 4 NUMBERS'));
  await until(S(7)); await play(lag(keep(J.txt), 2.4));
  await until(S(8)); await play(...fin(keep(O.circ, clab[1], plus)), ...say('ADD THE ORIGINAL VECTOR FOR fell', C.violet));
  await until(S(9)); await play(lag(keep(O.txt), 1.2), ...say('0, 0, 0, 1', C.violet));
  await until(S(10)); await play(...fin(keep(eq, Sv.circ, clab[2])), ...ind([...J.circ, ...O.circ], C.green), ...say('ADD BACK = RESIDUAL CONNECTION', C.green));
  await until(S(11)); await play(lag(keep(Sv.txt), 2.4), ...fbox([['0.951, 0.350, 0.350, −0.049', C.cyan], ['+ 0, 0, 0, 1', C.violet], ['= 0.951, 0.350, 0.350, 0.951', C.green]], C.green, P ? [0, -4.75, 0] : [5.0, -0.6, 0]));

  // ---- 12-19 dots on a number line: center, then spread
  const U = P ? 3.0 : 5.0, LY = P ? -1.4 : -0.4, xv = v => v * U;
  const line = new M.Line({ start: [xv(-1.2), LY, 0], end: [xv(1.2), LY, 0], color: C.muted, strokeWidth: 3 });
  const ticks = [-1, -0.5, 0, 0.5, 1].map(v => new M.VGroup(
    new M.Line({ start: [xv(v), LY - 0.08, 0], end: [xv(v), LY + 0.08, 0], color: C.muted }),
    T(v === 0 ? '0' : (v < 0 ? '−' : '') + Math.abs(v), P ? 17 : 16, C.muted, true).moveTo([xv(v), LY - 0.35, 0])));
  const DC = [C.cyan, C.green, C.green, C.cyan];
  const dotAt = (k, v) => {
    const y = LY + (P ? 0.45 : 0.35) + (k === 2 || k === 3 ? (P ? 0.7 : 0.55) : 0), p = [xv(v), y, 0];
    const halo = new M.Dot({ point: p, radius: P ? 0.32 : 0.26, color: DC[k] }); halo.setFill(DC[k], 0.18);
    const d = new M.Dot({ point: p, radius: P ? 0.18 : 0.12, color: DC[k] });
    const lab = T(String(k + 1), P ? 16 : 13, C.bg, true).moveTo(p);
    return [halo, d, lab];
  };
  const dparts = SUM.map((v, k) => dotAt(k, v));
  const dots = dparts.map(a => a[1]);
  const moveDots = vals => dparts.flatMap((a, k) => { const nw = dotAt(k, vals[k]); return a.map((o, m) => new M.Transform(o, nw[m], { runTime: 1.6 })); });
  await until(S(12)); await play(...wipe(), ...boxOff(), new M.Create(line), ...fin(keep(ticks)), ...say('4 NUMBERS AS DOTS ON A LINE'));
  keep(line); await play(lag(keep(dparts.flat()), 1.2));
  await until(S(13)); await play(new M.Indicate(ticks[2], { color: C.amber }), ...ind(dots, C.amber), ...say('ALL 4 ARE ABOVE 0', C.amber));
  await until(S(14)); await play(...moveDots(DIF), ...say('MOVE THE CENTER TO 0', C.cyan));
  await until(S(15)); await play(...moveDots(NRM), ...say('SPREAD THEM TO A STANDARD SIZE', C.cyan));
  await until(S(16)); await play(...ind(dots, C.green), ...say('SAME PATTERN: HIGH, LOW, LOW, HIGH', C.green));
  await until(S(17)); await play(...say('CENTER + SPREAD = NORMALIZATION', C.green));
  await until(S(18)); await play(...say('INSIDE ONE TOKEN = LAYER NORMALIZATION', C.violet));
  await until(S(19)); await play(...moveDots(SUM), ...say('NOW STEP BY STEP FOR fell'));

  // ---- 20-23 step 1: mean
  await until(S(20)); await play(...fbox([['STEP 1: mean = total ÷ count', C.amber]], C.amber), ...say('STEP 1: THE MEAN', C.amber));
  await until(S(21)); await play(...fbox([['STEP 1: mean = total ÷ count', C.amber], '(0.951 + 0.350 + 0.350 + 0.951) ÷ 4'], C.amber));
  await until(S(22)); await play(...fbox([['STEP 1: mean = total ÷ count', C.amber], '(0.951 + 0.350 + 0.350 + 0.951) ÷ 4', ['mean ≈ 0.65', C.amber]], C.amber), ...say('MEAN ≈ 0.65', C.amber));
  const mline = new M.Line({ start: [xv(MEAN), LY - 0.15, 0], end: [xv(MEAN), LY + 1.35, 0], color: C.amber, strokeWidth: 5 });
  const mlab = T('mean', 15, C.amber, true).moveTo([xv(MEAN), LY + 1.6, 0]);
  await until(S(23)); await play(new M.Create(mline), new M.FadeIn(mlab), ...say('THE CENTER', C.amber));
  keep(mline, mlab);

  // ---- 24-30 step 2: subtract the mean
  const subL = ['STEP 2: number − mean'];
  const rowsD = [0, 1, 2, 3].map(k => `${f3(SUM[k])} − 0.650 ≈ ${DIF[k] > 0 ? '+' : '−'}0.3005`);
  await until(S(24)); await play(...fbox([[subL[0], C.cyan]]), ...say('STEP 2: SUBTRACT THE MEAN'));
  const stepRows = [];
  for (let k = 0; k < 4; k++) {
    await until(S(25 + k)); stepRows.push([rowsD[k], DC[k]]);
    await play(...fbox([[subL[0], C.cyan], ...stepRows]), ...ind([dots[k]], DC[k]));
  }
  const mline0 = new M.Line({ start: [xv(0), LY - 0.15, 0], end: [xv(0), LY + 1.35, 0], color: C.amber, strokeWidth: 5 });
  const mlab0 = T('mean = 0', 15, C.amber, true).moveTo([xv(0), LY + 1.6, 0]);
  await until(S(29)); await play(...moveDots(DIF), new M.Transform(mline, mline0, { runTime: 1.6 }), new M.Transform(mlab, mlab0, { runTime: 1.6 }), ...say('CENTER NOW AT 0'));
  await until(S(30)); await play(...say('SAME SPREAD, NEW CENTER', C.muted));

  // ---- 31-37 step 3: variance and standard deviation
  await until(S(31)); await play(...fbox([['STEP 3: how wide is the spread?', C.violet]], C.violet), ...say('STEP 3: MEASURE THE SPREAD', C.violet));
  await until(S(32)); await play(...fbox([['STEP 3: how wide is the spread?', C.violet], '0.3005 × 0.3005', '(−0.3005) × (−0.3005)'], C.violet));
  await until(S(33)); await play(...fbox([['STEP 3: how wide is the spread?', C.violet], 'each square ≈ 0.0903', ['all 4 the same', C.muted]], C.violet));
  await until(S(34)); await play(...fbox([['STEP 3: how wide is the spread?', C.violet], 'each square ≈ 0.0903', '(0.0903 × 4) ÷ 4'], C.violet));
  await until(S(35)); await play(...fbox([['variance ≈ 0.0903', C.violet], ['= mean of the squares', C.muted]], C.violet), ...say('VARIANCE ≈ 0.0903', C.violet));
  await until(S(36)); await play(...fbox([['variance ≈ 0.0903', C.violet], '√0.0903 ≈ ?'], C.violet), ...say('SQUARE ROOT: BACK TO THE SAME SCALE', C.violet));
  const brace = new M.Line({ start: [xv(0), LY - 0.75, 0], end: [xv(DIF[0]), LY - 0.75, 0], color: C.violet, strokeWidth: 5 });
  const blab = T('0.3005', 15, C.violet, true).moveTo([xv(DIF[0] / 2), LY - 1.0, 0]);
  await until(S(37)); await play(new M.Create(brace), new M.FadeIn(blab), ...fbox([['variance ≈ 0.0903', C.violet], ['standard deviation ≈ 0.3005', C.violet]], C.violet), ...say('STANDARD DEVIATION ≈ 0.3005', C.violet));
  keep(brace, blab);

  // ---- 38-45 step 4: divide by the standard deviation
  await until(S(38)); await play(...fbox([['STEP 4: divide by 0.3005', C.green]], C.green), ...say('STEP 4: DIVIDE BY THE STANDARD DEVIATION', C.green));
  const divRows = [];
  for (let k = 0; k < 4; k++) {
    await until(S(39 + k));
    divRows.push([`${DIF[k] > 0 ? '+' : '−'}0.3005 ÷ 0.3005 = ${NRM[k] > 0 ? '1' : '−1'}`, DC[k]]);
    await play(...fbox([['STEP 4: divide by 0.3005', C.green], ...divRows], C.green), ...ind([dots[k]], DC[k]));
  }
  const brace1 = new M.Line({ start: [xv(0), LY - 0.75, 0], end: [xv(1), LY - 0.75, 0], color: C.violet, strokeWidth: 5 });
  const blab1 = T('1', 15, C.violet, true).moveTo([xv(0.5), LY - 1.0, 0]);
  await until(S(43)); await play(...moveDots(NRM), new M.Transform(brace, brace1, { runTime: 1.6 }), new M.Transform(blab, blab1, { runTime: 1.6 }), ...say('AWAY FROM 0 TO THEIR NEW PLACES', C.green));
  await until(S(44)); await play(...fbox([['normalized: 1, −1, −1, 1', C.green]], C.green), ...say('1, −1, −1, 1', C.green));
  await until(S(45)); await play(...fbox([['normalized: 1, −1, −1, 1', C.green], 'mean = 0   variance = 1'], C.green), new M.Indicate(mlab, { color: C.amber }));

  // ---- 46-52 the output circles of our network, the formula, real models
  const nc = P ? [0, -0.9, 0] : [0, -0.15, 0];
  const NN = net({ layers: [4, 4], center: nc, width: P ? 4.2 : 5.2, height: P ? 3.2 : 2.4, r: P ? 0.38 : 0.31 });
  NN.edges[0].flat().forEach(ln => { ln.setColor(C.cyan); ln.setStrokeOpacity(0.25); });
  const iv = SUM.map((v, j) => T(f3(v), P ? 15 : 13, C.ink, true).moveTo(NN.pos(0, j)));
  const ov = NRM.map((v, j) => T(v > 0 ? '1' : '−1', 16, C.green, true).moveTo(NN.pos(1, j)));
  const capY = nc[1] + (P ? 1.6 : 1.2) + 0.5;
  const caps = [['sum for fell', 0, C.ink], ['normalized', 1, C.green]].map(([s, l, c]) => T(s, P ? 15 : 15, c, true).moveTo([NN.pos(l, 0)[0], capY, 0]));
  await until(S(46)); await play(...wipe(), ...boxOff(), ...fin(keep(NN.group, iv, caps)), ...say('INTO THE OUTPUT CIRCLES', C.green));
  await play(...NN.flow(0, C.green), lag(keep(ov), 1.2));
  await until(S(47)); await play(...say('ONE SHORT FORMULA'));
  await until(S(48)); await play(...fbox([['normalized number =', C.green], '(number − mean) ÷ standard deviation'], C.green));
  await until(S(49)); await play(...fbox([['real models:', C.muted], '√(variance + a tiny number)'], C.muted), ...say('REAL MODELS ADD A TINY NUMBER', C.muted));
  await until(S(50)); await play(...say('NO DIVISION BY ZERO', C.muted));
  await until(S(51)); await play(...fbox([['real models can also learn', C.muted], 'how much to stretch and shift'], C.muted), ...say('THEY CAN LEARN STRETCH AND SHIFT', C.muted));
  await until(S(52)); await play(...NN.flow(0, C.cyan), ...say('A USEFUL SCALE, LAYER AFTER LAYER', C.green));
  await until(S(53)); await play(...fbox([['inside ONE token', C.green], ['not across the 4 tokens', C.pink]], C.amber), ...say('CAREFUL: ONE TOKEN AT A TIME', C.amber));
  await until(S(54)); await play(...ind(ov, C.green), ...say('LAYER NORM: CENTER AND SPREAD IN EACH TOKEN', C.green));
}
