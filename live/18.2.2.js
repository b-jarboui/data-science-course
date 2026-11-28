// 18.2.2 KL divergence: comparing the generator's chances with the studio's.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 4.1, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -4.75, 0] : [4.6, 0.6, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 19);
  const LS = P ? 17 : 15;
  const fade = o => new M.FadeIn(o, { runTime: 0.4 });
  const out = o => new M.FadeOut(o, { runTime: 0.4 });
  const mark = (o, c = C.amber) => new M.Indicate(o, { color: c, runTime: 0.6 });
  const txt = (s, size, color, x, y, mono = false) => T(s, size, color, mono).moveTo([x, y, 0]);
  const cascade = (a, rt = 0.9) => new M.LaggedStart(a, { lagRatio: 0.12, runTime: rt });

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const a = boxNow ? [out(boxNow)] : [];
    boxNow = null;
    if (!lines.length) return a;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, ink]) => T(s, P ? 20 : 19, ink, true));
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.56;
    const lh = 0.39, height = rows.length * lh + 0.26;
    const [x, y] = BOXP;
    const frame = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    frame.setFill(C.card, 0.95); frame.moveTo([x, y, 0]);
    texts.forEach((t, i) => t.moveTo([x - width / 2 + 0.28 + t.getWidth() / 2, y + (rows.length - 1) * lh / 2 - i * lh, 0]));
    boxNow = new M.VGroup(frame, ...texts);
    const maxW = P ? FW - 1.2 : 3.8;
    if (width > maxW) boxNow.scale(maxW / width);
    boxNow.moveTo(BOXP);
    a.push(fade(boxNow));
    return a;
  }

  function potLines(m, bx, by, u, color, width = 3) {
    const R = m.map((v, k) => [bx + v * u, by + 2 * k * u, 0]);
    const Lp = m.map((v, k) => [bx - v * u, by + 2 * k * u, 0]);
    const ln = (a, b) => new M.Line({ start: a, end: b, color, strokeWidth: width });
    return [ln(Lp[0], R[0]), ln(R[0], R[1]), ln(R[1], R[2]), ln(Lp[2], R[2]), ln(Lp[0], Lp[1]), ln(Lp[1], Lp[2])];
  }
  const BOWL = [1, 3, 4], VASE = [1, 3, 2];

  // ---- 0-2 the generator and the original collection
  const bigU = P ? 0.45 : 0.3, bigY = P ? -0.6 : -1.0;
  const genBowl = P ? potLines(BOWL, 0, 0.9, bigU, C.amber) : potLines(BOWL, CX - 1.7, bigY, bigU, C.amber);
  const genVase = P ? potLines(VASE, 0, -3.6, bigU, C.amber) : potLines(VASE, CX + 1.7, bigY, bigU, C.amber);
  const eq = P ? txt('=', 48, C.cyan, 0, -0.55, true) : txt('=', 40, C.cyan, CX, bigY + 2 * bigU, true);
  await until(S(0));
  await play(...genBowl.map(l => new M.Create(l)), ...genVase.map(l => new M.Create(l)), ...say('GENERATOR: MAKES BOWLS AND VASES', C.amber));

  await until(S(1));
  await play(fade(eq), ...say('GOAL: BOTH EQUALLY OFTEN'));

  const ox = k => P ? [(k % 2 ? 1.8 : -1.8), (k < 2 ? 1.2 : -2.6)] : [CX + (k - 1.5) * 1.9, bigY];
  const OU = P ? 0.32 : 0.2;
  const orig = [[1, 3, 4], [2, 3, 5], [1, 3, 2], [2, 4, 1]].map((m, k) => potLines(m, ox(k)[0], ox(k)[1], OU, C.cyan));
  const onames = ['B1 bowl', 'B2 bowl', 'V1 vase', 'V2 vase'].map((n, k) => txt(P ? n : n.slice(0, 2), P ? 18 : 15, C.muted, ox(k)[0], ox(k)[1] - (P ? 0.4 : 0.3)));
  await until(S(2));
  await play(out(new M.VGroup(...genBowl, ...genVase, eq)), ...orig.flat().map(fade), ...onames.map(fade),
    ...say('ORIGINAL: 2 BOWLS, 2 VASES'));

  // ---- 3-11 eight cards for the studio (P)
  const CW = P ? 0.92 : 0.55, CH = P ? 0.95 : 0.72, SP = P ? 1.12 : 0.68, IU = P ? 0.085 : 0.055;
  const PY = P ? 2.15 : 0.85, QY = P ? -0.35 : -0.35;
  const cx = i => P ? 0.55 + (i % 4 - 1.5) * SP : CX + (i - 3.5) * SP;
  const cy = (i, y) => P ? y + (i < 4 ? 0.55 : -0.55) : y;
  function card(i, y, kind, color) {
    const frame = new M.RoundedRectangle({ width: CW, height: CH, cornerRadius: 0.08, color, strokeWidth: 2 });
    frame.setFill(C.card, 0.95); frame.moveTo([cx(i), cy(i, y), 0]);
    const icon = potLines(kind, cx(i), cy(i, y) - 2 * IU, IU, color, 2);
    return { frame, icon, kind };
  }
  const Pc = [0, 1, 2, 3, 4, 5, 6, 7].map(i => card(i, PY, i < 4 ? BOWL : VASE, C.cyan));
  const Qc = [0, 1, 2, 3, 4, 5, 6, 7].map(i => card(i, QY, i < 6 ? BOWL : VASE, C.amber));
  const rowLab = (s, sub, y, color) => P
    ? [txt(s, 26, color, -3.15, y + 0.3, true), txt(sub, 17, color, -3.15, y - 0.3)]
    : [txt(s, 22, color, CX - 3.4, y + 0.12, true), txt(sub, 14, color, CX - 3.4, y - 0.2)];
  let pLab = rowLab('', 'studio', PY, C.cyan).slice(1), qLab = rowLab('', 'generator', QY, C.amber).slice(1);

  // the collection stays small at the bottom while the cards are explained
  const RU = P ? 0.17 : 0.12, rp = k => P ? [(k - 1.5) * 1.9, -6.55] : [CX + (k - 1.5) * 1.6, -3.0];
  const row = [[1, 3, 4], [2, 3, 5], [1, 3, 2], [2, 4, 1]].map((m, k) => potLines(m, rp(k)[0], rp(k)[1], RU, C.cyan, 2));
  const rowN = ['B1', 'B2', 'V1', 'V2'].map((n, k) => txt(n, LS, C.muted, rp(k)[0], rp(k)[1] - 0.3));
  const rowCap = txt('the collection: 2 bowls, 2 vases', LS, C.muted, P ? 0 : CX, P ? -5.6 : -2.15);
  await until(S(3));
  await play(out(new M.VGroup(...orig.flat(), ...onames)), cascade(Pc.map(c => fade(c.frame)), 1.0), ...pLab.map(fade),
    ...row.flat().map(fade), ...rowN.map(fade), fade(rowCap), ...say('8 SMALL CARDS'));

  await until(S(4));
  await play(...Pc.flatMap(c => c.icon.map(fade)), ...say('4 BOWLS  ·  4 VASES'));

  await until(S(5));
  await play(cascade(Pc.map(c => mark(c.frame, C.ink)), 1.6), ...say('MIX, THEN PICK ONE WITHOUT LOOKING'));

  await until(S(6));
  await play(cascade(Pc.slice(0, 4).map(c => mark(c.frame, C.cyan)), 1.0), ...fbox(['bowl: 4 out of 8']), ...say('BOWL: 4 OUT OF 8'));

  await until(S(7));
  await play(cascade(Pc.slice(4).map(c => mark(c.frame, C.cyan)), 1.0), ...fbox(['bowl: 4 out of 8', 'vase: 4 out of 8']), ...say('VASE: 4 OUT OF 8'));

  await until(S(8));
  await play(...say('CHANCES = PROBABILITIES'));

  // probability scale 0..1
  const SC = P ? { x: 0, y: -2.55, w: 6.0 } : { x: 4.6, y: -1.7, w: 3.0 };
  const px = v => SC.x - SC.w / 2 + v * SC.w;
  const pline = new M.Line({ start: [px(0), SC.y, 0], end: [px(1), SC.y, 0], color: C.muted, strokeWidth: 3 });
  const pt = v => new M.Line({ start: [px(v), SC.y - 0.08, 0], end: [px(v), SC.y + 0.08, 0], color: C.muted, strokeWidth: 2 });
  const p0 = new M.VGroup(pt(0), txt('0', LS, C.muted, px(0), SC.y - 0.32, true), txt('never', LS, C.pink, px(0), SC.y - (P ? 0.68 : 0.6)));
  const p1 = new M.VGroup(pt(1), txt('1', LS, C.muted, px(1), SC.y - 0.32, true), txt('always', LS, C.green, px(1), SC.y - (P ? 0.68 : 0.6)));
  const pMark = (v, s, color, up = 0.38) => new M.VGroup(new M.Dot({ point: [px(v), SC.y, 0], radius: 0.1, color }), txt(s, LS, color, px(v), SC.y + up, true));
  await until(S(9));
  await play(new M.Create(pline), fade(p0), ...say('0 = CANNOT HAPPEN', C.pink));

  await until(S(10));
  await play(fade(p1), ...say('1 = ALWAYS HAPPENS', C.green));

  const mP = pMark(0.5, '0.5', C.cyan);
  await until(S(11));
  await play(fade(mP), ...fbox(['bowl: 4/8 = 0.5', 'vase: 4/8 = 0.5']), ...say('BOTH 0.5  =  50%'));

  // ---- 12-16 the generator's cards (Q)
  await until(S(12));
  await play(out(new M.VGroup(...row.flat(), ...rowN, rowCap)), cascade(Qc.map(c => fade(c.frame)), 1.0), ...qLab.map(fade), ...say("THE GENERATOR'S PROBABILITIES", C.amber));

  await until(S(13));
  await play(...Qc.flatMap(c => c.icon.map(fade)), ...say('6 BOWLS  ·  2 VASES', C.amber));

  const mQb = pMark(0.75, '0.75', C.amber, -0.4), mQv = pMark(0.25, '0.25', C.amber, -0.4);
  // keep the lower labels clear of the 0/1 labels
  await until(S(14));
  await play(fade(mQb), cascade(Qc.slice(0, 6).map(c => mark(c.frame)), 0.9), ...fbox([['bowl: 6/8 = 0.75', C.amber]], C.amber),
    ...say('BOWL: 0.75', C.amber));

  await until(S(15));
  await play(fade(mQv), cascade(Qc.slice(6).map(c => mark(c.frame)), 0.6), ...fbox([['bowl: 6/8 = 0.75', C.amber], ['vase: 2/8 = 0.25', C.amber]], C.amber),
    ...say('VASE: 0.25', C.amber));

  await until(S(16));
  await play(cascade(Qc.slice(4, 6).map(c => mark(c.frame, C.pink)), 0.6), ...say('TOO MANY BOWLS', C.pink));

  await until(S(17));
  await play(...say('ONE NUMBER FOR THE DIFFERENCE?', C.violet));

  // ---- 18-23 weights, distributions, names
  await until(S(18));
  await play(mark(qLab[0]), ...say("LOOK FROM THE GENERATOR'S SIDE", C.amber));

  await until(S(19));
  await play(cascade(Qc.slice(0, 6).map(c => mark(c.frame)), 1.0), ...say('BOWLS MORE COMMON → COUNT MORE', C.amber));

  await until(S(20));
  await play(...say("SHARE = THE GENERATOR'S PROBABILITY"));

  await until(S(21));
  await play(...fbox([['studio:    0.5,  0.5', C.cyan], ['generator: 0.75, 0.25', C.amber]]), ...say('ALL THE PROBABILITIES = A DISTRIBUTION', C.green));

  const pL = rowLab('P', 'studio', PY, C.cyan), qL = rowLab('Q', 'generator', QY, C.amber);
  await until(S(22));
  await play(out(new M.VGroup(...pLab, ...qLab)), ...pL.map(fade), ...qL.map(fade),
    ...fbox([['P = (0.5, 0.5)', C.cyan], ['Q = (0.75, 0.25)', C.amber]]), ...say('WANTED = P   ·   GENERATOR = Q'));
  pLab = pL; qLab = qL;

  await until(S(23));
  await play(...say('KULLBACK-LEIBLER (KL) DIVERGENCE', C.violet));

  // ---- 24-29 ratios
  await until(S(24));
  await play(cascade([...Pc.slice(0, 4), ...Qc.slice(0, 6)].map(c => mark(c.frame, C.ink)), 1.2), ...say('START WITH BOWLS'));

  await until(S(25));
  await play(...fbox([['bowl: Q ÷ P', C.ink], ['    = 0.75 ÷ 0.5', C.amber]]), ...say("GENERATOR'S ÷ WANTED", C.amber));

  await until(S(26));
  await play(...fbox([['bowl: Q ÷ P', C.ink], ['    = 0.75 ÷ 0.5', C.amber], ['    = 1.5', C.amber]]), ...say('0.75 ÷ 0.5  =  1.5', C.amber));

  await until(S(27));
  await play(...say('THIS COMPARISON = A RATIO'));

  await until(S(28));
  await play(cascade(Qc.slice(0, 6).map(c => mark(c.frame)), 0.9), ...say('BOWL: 1.5 × THE WANTED PROBABILITY', C.amber));

  await until(S(29));
  await play(...fbox([['bowl: 0.75 ÷ 0.5 = 1.5', C.amber], ['vase: 0.25 ÷ 0.5 = 0.5', C.amber]]), ...say('VASE: 0.25 ÷ 0.5  =  0.5', C.amber));

  // ---- 30-37 the natural logarithm scale
  const LY = P ? -2.55 : -2.2;
  const lx = s => (P ? 0.15 : CX) + s * (P ? 2.75 : 2.3);
  const lline = new M.Line({ start: [lx(-0.88), LY, 0], end: [lx(1.12), LY, 0], color: C.muted, strokeWidth: 3 });
  const capR = txt('ratio', LS, C.muted, lx(-0.88) - 0.55, LY + 0.38);
  const capS = txt('ln', LS, C.muted, lx(-0.88) - 0.55, LY - 0.38);
  function tick(ratio, s, sText, color) {
    return new M.VGroup(new M.Line({ start: [lx(s), LY - 0.1, 0], end: [lx(s), LY + 0.1, 0], color, strokeWidth: 3 }),
      txt(ratio, LS, C.ink, lx(s), LY + 0.38, true), txt(sText, LS, color, lx(s), LY - 0.38, true));
  }
  await until(S(30));
  await play(out(new M.VGroup(pline, p0, p1, mP, mQb, mQv)), new M.Create(lline), fade(capR), fade(capS),
    ...say('TAKE THE LOGARITHM OF EACH RATIO', C.violet));

  await until(S(31));
  await play(...fbox(['multiply ratios', ['→ add logarithms', C.violet]], C.violet), ...say('MULTIPLY RATIOS = ADD LOGARITHMS', C.violet));

  const t1 = tick('1', 0, '0', C.green);
  await until(S(32));
  await play(fade(t1), ...fbox(['ln 1 = 0', ['P and Q equal', C.green]], C.green), ...say('RATIO 1  →  LOGARITHM 0', C.green));

  const posSeg = new M.Line({ start: [lx(0), LY, 0], end: [lx(1.12), LY, 0], color: C.green, strokeWidth: 5 });
  const negSeg = new M.Line({ start: [lx(-0.88), LY, 0], end: [lx(0), LY, 0], color: C.pink, strokeWidth: 5 });
  await until(S(33));
  await play(new M.Create(posSeg), new M.Create(negSeg), ...fbox([['above 1 → positive', C.green], ['below 1 → negative', C.pink]], C.violet),
    ...say('ABOVE 1: +    BELOW 1: −', C.violet));

  const t272 = tick('2.72', 1, '1', C.green);
  await until(S(34));
  await play(fade(t272), ...say('NATURAL LOG:  ln 2.72 ≈ 1', C.green));

  await until(S(35));
  await play(...fbox(['calculator:', ['ln( ratio )', C.violet]], C.violet), ...say('CALCULATOR: THE  ln  BUTTON', C.violet));

  const t15 = tick('1.5', 0.4055, '0.4055', C.amber);
  await until(S(36));
  await play(fade(t15), ...fbox([['ln 1.5 ≈ 0.4055', C.green]], C.violet), ...say('ln 1.5  ≈  0.4055', C.green));

  const t05 = tick('0.5', -0.6931, '−0.6931', C.pink);
  await until(S(37));
  await play(fade(t05), ...fbox([['ln 1.5 ≈ 0.4055', C.green], ['ln 0.5 ≈ −0.6931', C.pink]], C.violet), ...say('ln 0.5  ≈  −0.6931', C.pink));

  // ---- 38-44 weight by Q, then add
  await until(S(38));
  await play(mark(qLab[0]), ...say('SHARE OF EACH LOGARITHM = Q', C.amber));

  await until(S(39));
  await play(cascade(Qc.slice(0, 6).map(c => mark(c.frame)), 0.9), mark(t15),
    ...fbox([['bowl: 0.75 × 0.4055', C.amber]], C.amber), ...say('BOWLS: × 0.75', C.amber));

  await until(S(40));
  await play(...fbox([['bowl: 0.75 × 0.4055', C.amber], ['    ≈ 0.3041', C.green]], C.amber), ...say('≈ 0.3041', C.green));

  await until(S(41));
  await play(cascade(Qc.slice(6).map(c => mark(c.frame)), 0.6), mark(t05, C.pink),
    ...fbox([['bowl: ≈ 0.3041', C.green], ['vase: 0.25 × (−0.6931)', C.amber]], C.amber), ...say('VASES: × 0.25', C.amber));

  await until(S(42));
  await play(...fbox([['bowl: ≈ 0.3041', C.green], ['vase: ≈ −0.1733', C.pink]], C.amber), ...say('≈ −0.1733', C.pink));

  await until(S(43));
  await play(...fbox([['bowl: ≈ 0.3041', C.green], ['vase: ≈ −0.1733', C.pink], ['KL = 0.3041 − 0.1733', C.ink]], C.amber), ...say('ADD THE TWO RESULTS'));

  await until(S(44));
  await play(...fbox([['bowl: ≈ 0.3041', C.green], ['vase: ≈ −0.1733', C.pink], ['KL ≈ 0.1308', C.amber]], C.amber), ...say('KL DIVERGENCE  ≈  0.1308', C.amber));

  // ---- 45-47 the formula
  await until(S(45));
  await play(...say('EVERYTHING IN ONE FORMULA'));

  await until(S(46));
  await play(...fbox([['KL(Q‖P) =', C.ink], ['  sum of Q × ln(Q ÷ P)', C.amber]], C.cyan), ...say('KL(Q‖P)  =  SUM OF  Q × ln(Q ÷ P)'));

  await until(S(47));
  await play(...fbox([['KL(Q‖P) =', C.ink], ['  sum of Q × ln(Q ÷ P)', C.amber], ['  for bowl + vase', C.muted]], C.cyan),
    ...say('EVERY OUTCOME, THEN ADD'));

  // ---- 48-49 equal distributions give zero
  const swapTo = (c, kind) => potLines(kind, c.frame.getCenter()[0], c.frame.getCenter()[1] - 2 * IU, IU, C.amber, 2).map((l, k) => new M.Transform(c.icon[k], l, { runTime: 0.8 }));
  await until(S(48));
  await play(...swapTo(Qc[4], VASE), ...swapTo(Qc[5], VASE), ...say('NOW Q: 4 BOWLS, 4 VASES', C.amber));

  await until(S(49));
  await play(mark(t1, C.green), ...fbox([['ratios: 1 and 1', C.ink], ['ln 1 = 0, ln 1 = 0', C.green], ['KL = 0', C.green]], C.green),
    ...say('SAME PROBABILITIES  →  KL = 0', C.green));

  await until(S(50));
  await play(...swapTo(Qc[4], BOWL), ...swapTo(Qc[5], BOWL), ...say('USEFUL TO TEACH A GENERATOR', C.green));

  await until(S(51));
  await play(...fbox([['bigger KL', C.amber], ['→ bigger difference', C.amber]], C.amber), ...say('LARGER KL = LARGER DIFFERENCE', C.amber));

  // ---- 52-54 not symmetric
  await until(S(52));
  await play(mark(pLab[0], C.cyan), ...fbox([['KL(P‖Q) =', C.ink], ['  sum of P × ln(P ÷ Q)', C.cyan]], C.cyan), ...say('SWAP P AND Q → OTHER SHARES', C.violet));

  await until(S(53));
  await play(...fbox([['KL(Q‖P) ≈ 0.1308', C.amber], ['KL(P‖Q) ≈ 0.1438', C.cyan]], C.violet), ...say('0.1438  ≠  0.1308', C.violet));

  await until(S(54));
  await play(...say('KL: SHARES FROM THE FIRST DISTRIBUTION', C.green));
}
