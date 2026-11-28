// 10.4.2 Likelihood-ratio tests: is B's gain over A more than chance?
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;
  const RED = '#f87171';
  const MA = C.amber, MB = C.cyan, MC = C.pink;
  const PILL = [0, P ? 2.65 : 1.85, 0];
  const BOXP = P ? [0, -4.3, 0] : [4.3, -0.5, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 16 : 19);
  const fade = o => new M.FadeIn(o);
  const out = o => new M.FadeOut(o);
  const lag = (a, rt = 1.2, lr = 0.1) => new M.LaggedStart(a, { lagRatio: lr, runTime: rt });

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const size = P ? 20 : 19, lh = P ? 0.42 : 0.39;
    const texts = rows.map(([s, c]) => T(s, size, c, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.56, ht = rows.length * lh + 0.3;
    const [x, y] = BOXP;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    texts.forEach((t, i) => t.moveTo([x - wd / 2 + 0.28 + t.getWidth() / 2, y + (rows.length - 1) * lh / 2 - i * lh, 0]));
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.4;
    if (wd > maxw) { g.scale(maxw / wd); g.moveTo(BOXP); }
    const a = [fade(g)]; if (boxNow) a.push(out(boxNow));
    boxNow = g; return a;
  }
  const clearBox = () => { const a = boxNow ? [out(boxNow)] : []; boxNow = null; return a; };

  // ---------- grid of 40 appointments ----------
  const SX = P ? 0.52 : 0.45, GX = P ? 0 : -1.8, R = P ? 0.14 : 0.12;
  const ROWY = P ? [1.5, 0.6, -0.3, -1.2] : [0.95, 0.4, -0.15, -0.7];
  const dx = k => GX + (k - 4.5) * SX;
  const pos = (r, k) => [dx(k), ROWY[r], 0];
  const whites = [];
  for (let r = 0; r < 4; r++) for (let k = 0; k < 10; k++) { const d = new M.Dot({ point: pos(r, k), radius: R, color: C.ink }); d.setFill(C.ink, 0.9); whites.push(d); }
  const redDot = p => { const h = new M.Dot({ point: p, radius: R * 1.9, color: RED }); h.setFill(RED, 0.25); const d = new M.Dot({ point: p, radius: R, color: RED }); d.setFill(RED, 1); return new M.VGroup(h, d); };
  const redsOf = list => list.map(([r, k]) => redDot(pos(r, k)));
  const REAL = [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [3, 0], [3, 1], [3, 2], [3, 3], [3, 4]];
  let reds = redsOf(REAL);
  const NAMES = ['reminder, AM', 'reminder, PM', 'no reminder, AM', 'no reminder, PM'];
  const rowLabels = NAMES.map((s, r) => {
    const t = T(s, P ? 17 : 16, r < 2 ? C.cyan : C.ink);
    const maxw = P ? 4.0 : 2.6; if (t.getWidth() > maxw) t.scale(maxw / t.getWidth());
    if (P) t.moveTo([dx(0) - 0.15 + t.getWidth() / 2, ROWY[r] + 0.47, 0]);
    else t.moveTo([dx(0) - 0.35 - t.getWidth() / 2, ROWY[r], 0]);
    return t;
  });
  const half = (P ? 0.6 : 0.55) / 2, gx1 = dx(0) - 0.24, gx2 = dx(9) + 0.24;
  const box = (x1, y1, x2, y2, color) => { const b = new M.RoundedRectangle({ width: x2 - x1, height: y2 - y1, cornerRadius: 0.12, color, strokeWidth: 2.5 }); b.moveTo([(x1 + x2) / 2, (y1 + y2) / 2, 0]); return b; };
  const band = (r1, r2, color) => box(gx1, ROWY[r2] - half + 0.03, gx2, ROWY[r1] + half - 0.03, color);
  const TAGX = P ? 3.25 : dx(9) + 1.05;
  const tag = (s, color, y, size) => { const p = pill(s, color, size || 16); p.moveTo([TAGX, y, 0]); return p; };
  const midR = (ROWY[0] + ROWY[1]) / 2, midN = (ROWY[2] + ROWY[3]) / 2, midAll = (ROWY[0] + ROWY[3]) / 2;
  const gridBase = () => new M.VGroup(...whites, ...rowLabels);

  // 0-1
  await until(S(0)); await play(...say('DO THE TWO REMINDER GROUPS NEED 2 CHANCES?', C.violet));
  await until(S(1)); await play(lag(whites.map(fade), 1.4, 0.03), fade(new M.VGroup(...rowLabels)), ...say('40 APPOINTMENTS, 10 MISSED', RED));
  await play(lag(reds.map(fade), 1.0));
  // 2-6 nested models
  const bA = band(0, 3, MA), tA = tag('0.25', MA, midAll);
  await until(S(2)); await play(new M.Create(bA), fade(tA), ...say('MODEL A: ONE CHANCE TAG', MA));
  const bB = [band(0, 1, MB), band(2, 3, MB)], tB = [tag('0.1', MB, midR), tag('0.4', MB, midN)];
  await until(S(3)); await play(out(bA), out(tA), ...bB.map(b => new M.Create(b)), ...tB.map(fade), ...say('MODEL B: A TAG FOR EACH GROUP', MB));
  const tBA = [tag('0.25', MA, midR), tag('0.25', MA, midN)];
  await until(S(4)); await play(...tB.map(out), ...tBA.map(fade), ...say('SET BOTH EQUAL → A AGAIN', MA));
  await until(S(5)); await play(...say('B CAN COPY A: NESTED', C.green), ...fbox(['B with equal tags = A', ['A is nested in B', C.green]], C.green));
  const tB2 = [tag('0.1', MB, midR), tag('0.4', MB, midN)];
  await until(S(6)); await play(...tBA.map(out), ...tB2.map(fade), ...say('PARAMETER = AN ADJUSTABLE CHANCE', C.violet),
    ...fbox([['A: 1 parameter', MA], ['B: 2 parameters', MB]], C.violet));
  await until(S(7)); await play(...say('MORE TAGS FIT BETTER, EVEN BY LUCK', C.amber));
  await until(S(8)); await play(...say('HOW BIG A GAIN CAN LUCK GIVE?', C.amber));

  // 9-12 replays with fresh random outcomes
  const pick = (seedRows, nR, nN) => {
    // nR misses among reminder rows (0,1), nN among no-reminder rows (2,3), spread by a fixed pattern
    const spots = [];
    const take = (rows, n, off) => { for (let i = 0; i < n; i++) { const r = rows[i % 2]; const k = (i * 3 + off + (i >> 1)) % 10; spots.push([r, k]); } };
    take([0, 1], nR, seedRows); take([2, 3], nN, seedRows + 1);
    return spots;
  };
  const countTags = (a, b, color) => [tag(a + ' missed', color, midR, 15), tag(b + ' missed', color, midN, 15)];
  let cnt = countTags(2, 8, MB);
  const rep1 = redsOf(pick(1, 6, 4));
  await until(S(9)); await play(...reds.map(out), ...tB2.map(out), ...bB.map(out), ...clearBox(), ...say('REPLAY: FRESH RANDOM OUTCOMES', C.violet));
  await play(lag(rep1.map(fade), 0.9));
  reds = rep1;
  await until(S(10)); await play(...fbox(['every appointment:', ['miss chance = 0.25', MA]], MA), ...say('BOTH GROUPS GET A’S CHANCE', MA));
  cnt = countTags(6, 4, C.violet);
  const rep2 = redsOf(pick(4, 7, 3));
  const cnt2 = countTags(7, 3, C.violet);
  await until(S(11)); await play(lag(cnt.map(fade), 0.6), ...say('COUNTS STILL DIFFER BY LUCK', C.violet));
  await play(...reds.map(out), lag(rep2.map(fade), 0.8), ...cnt.map(out), ...cnt2.map(fade));
  reds = rep2; cnt = cnt2;
  await until(S(12)); await play(...fbox(['replay 1: 6 vs 4 → gain 0.5', 'replay 2: 7 vs 3 → gain 2.2', ['gain = A − B (deviance)', C.muted]], C.violet), ...say('FIT A AND B, MEASURE THE GAIN', C.violet));
  await until(S(13)); await play(...say('REAL GAIN vs REPLAY GAINS', C.amber));
  await until(S(14)); await play(...say('LIKELIHOOD-RATIO TEST', C.green));
  await until(S(15)); await play(...fbox(['null hypothesis:', ['equal miss chances', C.violet], ['(the reminder makes no difference)', C.muted]], C.violet), ...say('NULL HYPOTHESIS = EQUAL CHANCES', C.violet));

  // 16-19 deviance bars
  const BY = P ? [1.35, 0.65] : [0.8, 0.15];
  const BX0 = P ? -2.6 : -5.6, BLEN = P ? 5.0 : 6.0, BH = 0.38;
  const bar = (i, val, color, name) => {
    const w = val / 45 * BLEN;
    const r = new M.Rectangle({ width: w, height: BH, color, strokeWidth: 1.5 }); r.setFill(color, 0.75); r.moveTo([BX0 + w / 2, BY[i], 0]);
    const n = T(name, P ? 15 : 17, color, true); n.moveTo([BX0 - 0.3 - n.getWidth() / 2, BY[i], 0]);
    const v = T(val.toFixed(1), 18, color, true); v.moveTo([BX0 + w + 0.2 + v.getWidth() / 2, BY[i], 0]);
    return { r, n, v, g: new M.VGroup(r, n, v) };
  };
  const barA = bar(0, 45.0, MA, 'A'), barB = bar(1, 39.9, MB, 'B');
  await until(S(16)); await play(out(new M.VGroup(...whites, ...rowLabels, ...reds, ...cnt)), ...clearBox(), ...say('DEVIANCE BARS: SHORTER = CLOSER', C.green));
  await until(S(17)); await play(fade(barA.g), ...say('A: 45.0', MA));
  await until(S(18)); await play(fade(barB.g), ...say('B: 39.9', MB));
  const gx = BX0 + 39.9 / 45 * BLEN, gx2b = BX0 + BLEN;
  const gapL = new M.Line({ start: [gx, BY[1] - 0.32, 0], end: [gx2b, BY[1] - 0.32, 0], color: C.green, strokeWidth: 4 });
  const gapT = T('gain 5.1', 17, C.green, true); gapT.moveTo([(gx + gx2b) / 2, BY[1] - 0.6, 0]);
  await until(S(19)); await play(new M.Create(gapL), fade(gapT), ...fbox(['45.0 − 39.9', ['= 5.1 (the gain)', C.green]], C.green));

  // 20-22 gain axis with many replays
  const BASE = P ? -2.2 : -2.35, X0 = P ? -3.3 : -6.0, UX = P ? 0.66 : 0.7, HS = P ? 2.3 : 2.5;
  const gxp = v => X0 + v * UX;
  const axis = new M.Line({ start: [X0, BASE, 0], end: [gxp(10), BASE, 0], color: C.muted, strokeWidth: 3 });
  const aticks = [0, 2, 4, 6, 8, 10].map(v => new M.VGroup(
    new M.Line({ start: [gxp(v), BASE - 0.07, 0], end: [gxp(v), BASE + 0.07, 0], color: C.muted }),
    T(String(v), 15, C.muted, true).moveTo([gxp(v), BASE - 0.3, 0])));
  const lt = T('← smaller gain', 15, C.muted), rt = T('larger gain →', 15, C.muted);
  lt.moveTo([X0 + lt.getWidth() / 2, BASE - 0.62, 0]); rt.moveTo([gxp(10) - rt.getWidth() / 2, BASE - 0.62, 0]);
  // simulated replays (fixed seed): both groups miss chance 0.25
  let s = 7; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const ll = (m, n) => (m ? m * Math.log(m / n) : 0) + (n - m ? (n - m) * Math.log(1 - m / n) : 0);
  const gains = [];
  for (let i = 0; i < 40; i++) {
    let a = 0, b = 0; for (let j = 0; j < 20; j++) { if (rnd() < 0.25) a++; if (rnd() < 0.25) b++; }
    gains.push(2 * (ll(a, 20) + ll(b, 20) - ll(a + b, 40)));
  }
  const bins = {}; const rd = P ? 0.065 : 0.07, st = P ? 0.15 : 0.16;
  const repDots = gains.map(g => {
    const bi = Math.min(9, Math.floor(g)); const n = bins[bi] = (bins[bi] || 0) + 1;
    const col = (n - 1) % 3, row = Math.floor((n - 1) / 3);
    const d = new M.Dot({ point: [gxp(bi + 0.5) + (col - 1) * st, BASE + 0.12 + row * st, 0], radius: rd, color: C.violet }); d.setFill(C.violet, 0.9);
    return d;
  });
  const realMk = (v, label, color) => {
    const ln = new M.Line({ start: [gxp(v), BASE, 0], end: [gxp(v), BASE + (P ? 2.0 : 2.1), 0], color, strokeWidth: 3 });
    const t = T(label, 17, color, true); t.moveTo([gxp(v), BASE + (P ? 2.25 : 2.35), 0]);
    return new M.VGroup(ln, t);
  };
  const barsAll = new M.VGroup(barA.g, barB.g, gapL, gapT);
  await until(S(20)); await play(out(barsAll), ...clearBox(), new M.Create(axis), fade(new M.VGroup(...aticks, lt, rt)), ...say('SMALL GAINS LEFT, LARGE GAINS RIGHT', C.muted));
  await play(lag(repDots.map(fade), 1.4, 0.04));
  await until(S(21)); await play(...say('APPOINTMENTS ARE INDEPENDENT', C.violet));
  await until(S(22)); await play(...say('ONE OUTCOME: NO CLUE ABOUT ANOTHER', C.violet));

  // 23-25 chi-square curve, 1 degree of freedom
  const f1 = x => Math.exp(-x / 2) / Math.sqrt(2 * Math.PI * x), f2 = x => 0.5 * Math.exp(-x / 2);
  const curve = (f, x0, color) => {
    const segs = []; let prev = null;
    for (let x = x0; x <= 10.001; x += 0.1) { const p = [gxp(x), BASE + f(x) * HS, 0]; if (prev) segs.push(new M.Line({ start: prev, end: p, color, strokeWidth: 3.5 })); prev = p; }
    return new M.VGroup(...segs);
  };
  const shade = (f, a, b, color) => {
    const ls = []; for (let x = a; x <= b; x += 0.07) ls.push(new M.Line({ start: [gxp(x), BASE, 0], end: [gxp(x), BASE + f(x) * HS, 0], color, strokeWidth: 2.5 }));
    return new M.VGroup(...ls);
  };
  const cur1 = curve(f1, P ? 0.09 : 0.08, C.green);
  await until(S(23)); await play(new M.Create(cur1), ...say('CHI-SQUARE CURVE', C.green));
  await until(S(24)); await play(...fbox(['B − A = 1 extra parameter', ['→ 1 degree of freedom', C.green]], C.green));
  await until(S(25)); await play(new M.Indicate(cur1, { color: C.green }), ...say('THIS COUNT SETS THE SHAPE', C.green));
  // 26-33 shade, cut-off, p-value
  const tail1 = shade(f1, 3.84, 10, RED);
  const tailBand = new M.Line({ start: [gxp(3.84), BASE + 0.05, 0], end: [gxp(10), BASE + 0.05, 0], color: RED, strokeWidth: 9 });
  const tailLbl = T('largest 5 in 100', 16, RED); tailLbl.moveTo([gxp(7.6), BASE + 0.42, 0]);
  await until(S(26)); await play(out(new M.VGroup(...repDots)), fade(tail1), fade(tailBand), fade(tailLbl), ...say('LARGEST 5 IN 100 GAINS', RED));
  const cut1 = realMk(3.84, '3.84', RED);
  await until(S(27)); await play(fade(cut1), ...fbox(['5 in 100 line', ['at 3.84', RED]], RED));
  const our1 = realMk(5.06, 'our 5.1', C.amber);
  // nudge label of ours a little higher to avoid the cut label
  our1.submobjects[1].moveTo([gxp(5.06) + 0.35, BASE + (P ? 2.25 : 2.35) + 0.35, 0]);
  await until(S(28)); await play(fade(our1), ...say('5.1 IS BEYOND THE LINE', C.amber));
  const pv1 = shade(f1, 5.06, 10, C.amber);
  await until(S(29)); await play(fade(pv1), ...fbox(['right of 5.1:', ['about 2 in 100', C.amber]], C.amber));
  await until(S(30)); await play(...say('CHANCE OF THIS GAIN OR MORE, IF EQUAL', C.violet));
  await until(S(31)); await play(...fbox(['p-value ≈ 0.02', ['(2 in 100)', C.muted]], C.amber), ...say('P-VALUE', C.amber));
  await until(S(32)); await play(...fbox(['5.1 > 3.84', ['→ reject equal chances', RED]], RED), ...say('REJECT EQUAL CHANCES', RED));
  await until(S(33)); await play(...say('THE REMINDER GROUPS DIFFER', C.green));

  // 34-35 Model C over the grid again
  const curveStuff1 = new M.VGroup(cur1, tail1, pv1, cut1, our1, tailBand, tailLbl, axis, ...aticks, lt, rt);
  const bC = [0, 1, 2, 3].map(r => band(r, r, MC));
  const tC = ['0.1', '0.1', '0.3', '0.5'].map((v, r) => tag(v, MC, ROWY[r]));
  reds = redsOf(REAL);
  await until(S(34)); await play(out(curveStuff1), ...clearBox(), fade(gridBase()), fade(new M.VGroup(...reds)), ...say('MODEL C: MORNING / AFTERNOON TOO', MC));
  await play(...bC.map(b => new M.Create(b)), ...tC.map(fade));
  const tCB = ['0.1', '0.1', '0.4', '0.4'].map((v, r) => tag(v, MB, ROWY[r]));
  await until(S(35)); await play(...tC.map(out), ...tCB.map(fade), ...say('EQUAL TIME TAGS → B AGAIN', MB));

  // 36-40 two degrees of freedom
  const axis2 = new M.Line({ start: [X0, BASE, 0], end: [gxp(10), BASE, 0], color: C.muted, strokeWidth: 3 });
  const aticks2 = [0, 2, 4, 6, 8, 10].map(v => new M.VGroup(
    new M.Line({ start: [gxp(v), BASE - 0.07, 0], end: [gxp(v), BASE + 0.07, 0], color: C.muted }),
    T(String(v), 15, C.muted, true).moveTo([gxp(v), BASE - 0.3, 0])));
  const lt2 = T('← smaller gain', 15, C.muted), rt2 = T('larger gain →', 15, C.muted);
  lt2.moveTo([X0 + lt2.getWidth() / 2, BASE - 0.62, 0]); rt2.moveTo([gxp(10) - rt2.getWidth() / 2, BASE - 0.62, 0]);
  const cur2 = curve(f2, 0, MC);
  await until(S(36)); await play(out(new M.VGroup(...whites, ...rowLabels, ...reds, ...bC, ...tCB)), new M.Create(axis2), fade(new M.VGroup(...aticks2, lt2, rt2)), new M.Create(cur2),
    ...fbox(['C − B = 2 extra parameters', ['→ 2 degrees of freedom', MC]], MC), ...say('CURVE WITH 2 DEGREES OF FREEDOM', MC));
  await until(S(37)); await play(...fbox(['39.9 − 39.1', ['= 0.8 (the gain)', MC]], MC));
  const tail2 = shade(f2, 5.99, 10, RED), cut2 = realMk(5.99, '5.99', RED);
  await until(S(38)); await play(fade(tail2), fade(cut2), ...say('5 IN 100 LINE AT 5.99', RED));
  const pv2 = shade(f2, 0.84, 5.92, '#a0407a'), our2 = realMk(0.84, 'our 0.8', MC);
  await until(S(39)); await play(fade(pv2), fade(our2), ...fbox(['right of 0.8:', ['about 66 in 100', MC], 'p-value ≈ 0.66'], MC));
  await until(S(40)); await play(...say('TOO LITTLE EVIDENCE: KEEP B', MB));

  // 41-47 the statistic from log-likelihoods
  const curveStuff2 = new M.VGroup(cur2, tail2, pv2, cut2, our2, axis2, ...aticks2, lt2, rt2);
  const barA2 = bar(0, 45.0, MA, 'A'), barB2 = bar(1, 39.9, MB, 'B');
  await until(S(41)); await play(out(curveStuff2), ...clearBox(), fade(barA2.g), fade(barB2.g), ...say('THE LOG-LIKELIHOODS BEHIND THE BARS', C.violet));
  const llB = T('log-likelihood −19.96', P ? 15 : 16, C.bg, true), llA = T('log-likelihood −22.49', P ? 15 : 16, C.bg, true);
  llB.moveTo([BX0 + 0.15 + llB.getWidth() / 2, BY[1], 0]); llA.moveTo([BX0 + 0.15 + llA.getWidth() / 2, BY[0], 0]);
  await until(S(42)); await play(fade(llB));
  await until(S(43)); await play(fade(llA));
  await until(S(44)); await play(...fbox(['−19.96 − (−22.49)', ['= 2.53', C.green]], C.green));
  await until(S(45)); await play(...fbox(['−19.96 − (−22.49) = 2.53', ['2 × 2.53 ≈ 5.1', C.green]], C.green), ...say('DOUBLE IT: 5.1', C.green));
  await until(S(46)); await play(...fbox(['test statistic', ['= 2 × log-likelihood gain', C.green]], C.green));
  await until(S(47)); await play(...say('COMPARE THIS NUMBER WITH THE CURVE', C.green));
  // 48-50 why "ratio"
  await until(S(48)); await play(...fbox(['ratio = one number ÷ another'], C.violet), ...say('RATIO = DIVISION', C.violet));
  await until(S(49)); await play(...fbox(['likelihood B', ['÷ likelihood A', C.violet]], C.violet));
  await until(S(50)); await play(...fbox(['log(B ÷ A)', ['= log B − log A', C.green]], C.green), ...say('SUBTRACT LOGS = LOG OF RATIO', C.green));
  await until(S(51)); await play(...say('DO EXTRA SETTINGS BEAT CHANCE?', C.amber));

  // 52-54 the trap
  const CW = P ? 2.6 : 3.0, CY = P ? -1.6 : -1.9, CX1 = P ? -1.75 : -4.3, CX2 = P ? 1.75 : -0.7;
  const card = (x, s, color) => { const r = new M.RoundedRectangle({ width: CW, height: 0.8, cornerRadius: 0.14, color, strokeWidth: 2 }); r.setFill(C.card, 0.95); r.moveTo([x, CY, 0]); const t = T(s, P ? 15 : 17, color, true); t.moveTo([x, CY, 0]); return new M.VGroup(r, t); };
  const c1 = card(CX1, 'time only', C.violet), c2 = card(CX2, 'reminder only', MB);
  const neq = T('≠', 30, RED, true); neq.moveTo([(CX1 + CX2) / 2, CY, 0]);
  await until(S(52)); await play(out(new M.VGroup(llA, llB)), ...say('TRAP: NEITHER MODEL CAN COPY THE OTHER', RED));
  await until(S(53)); await play(fade(c1), fade(c2), fade(neq), ...fbox(['not nested', ['→ no likelihood-ratio test', RED]], RED));
  await until(S(54)); await play(out(new M.VGroup(c1, c2, neq)), ...fbox(['nested models only', 'statistic = deviance gain', ['compare with chi-square', C.green]], C.green), ...say('GAIN IN FIT vs GAINS BY CHANCE', C.green));
}
