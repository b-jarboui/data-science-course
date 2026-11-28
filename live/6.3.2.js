// 6.3.2 Posterior updating (live Manim lesson).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  // Shared chapter 6.3 data (exact values)
  const RATES = [10, 20, 30, 40, 50];
  const PRIOR = [10, 30, 30, 20, 10];
  const PRIOR_SH = ['0.1', '0.3', '0.3', '0.2', '0.1'];
  const BATCH = [1, 0, 0, 1, 0, 0, 0, 1, 0, 0]; // 1 = fail, 0 = pass (3 fail, 7 pass)
  const LIKE = [0.2, 0.75, 1, 0.8, 0.45];
  const LIKE_TXT = ['0.2', '0.75', '1', '0.8', '0.45'];
  const PROD = [0.02, 0.225, 0.3, 0.16, 0.045];
  const PROD_TXT = ['0.02', '0.225', '0.3', '0.16', '0.045'];
  const POST = [3, 30, 40, 21, 6];

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) and phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0.16 : -2.0;
  const SP = P ? 1.34 : 1.60;
  const BASE = P ? -4.65 : -2.35;
  const MAX_H = P ? 3.55 : 2.35;
  const MAX_PTS = 45;
  const BW_ONE = P ? 0.66 : 0.78;
  const BW_PAIR = P ? 0.44 : 0.54;
  const DX = P ? 0.26 : 0.31;
  const PILL = P ? [0, 1.55, 0] : [0, 2.02, 0];
  const BOXP = P ? [0, 3.18, 0] : [4.55, -0.55, 0];
  const BATCH_Y = P ? 0.68 : 1.28;
  const LEG_Y = P ? -0.32 : 0.66;

  const gx = k => CX + (k - 2) * SP;
  const lx = k => gx(k) - DX;
  const rx = k => gx(k) + DX;
  const ptH = pts => Math.max(0.08, (pts / MAX_PTS) * MAX_H);
  const likeH = sc => Math.max(0.08, sc * MAX_H * 0.90);
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  // Formula box: one at a time, lines = ['text' | ['text', color]]
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 19, lh = P ? 0.44 : 0.38;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.38;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.19 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.7 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.5 }));
    boxNow = g;
    return a;
  }

  // Color legend: one at a time
  let legNow = null;
  function setLegend(items) {
    const size = P ? 15 : 16, gap = 0.42, sq = 0.18;
    const built = items.map(([label, col]) => {
      const box = new M.Rectangle({ width: sq, height: sq, color: col, strokeWidth: 1.5 });
      box.setFill(col, 0.85);
      const txt = T(label, size, col, true, true);
      return { box, txt, w: sq + 0.12 + txt.getWidth() };
    });
    const totalW = built.reduce((a, b) => a + b.w, 0) + gap * (built.length - 1);
    const parts = [];
    let cur = (P ? 0 : CX) - totalW / 2;
    for (const it of built) {
      it.box.moveTo([cur + sq / 2, LEG_Y, 0]);
      it.txt.moveTo([cur + sq + 0.12 + it.txt.getWidth() / 2, LEG_Y, 0]);
      parts.push(it.box, it.txt);
      cur += it.w + gap;
    }
    const g = new M.VGroup(...parts);
    const a = [new M.FadeIn(g, { runTime: 0.6 })];
    if (legNow) a.push(new M.FadeOut(legNow, { runTime: 0.4 }));
    legNow = g;
    return a;
  }

  function makeBar(x, h, w, color, opacity = 0.85) {
    const b = new M.Rectangle({ width: w, height: h, color, strokeWidth: 2 });
    b.setFill(color, opacity);
    b.moveTo([x, BASE + h / 2, 0]);
    return b;
  }

  function valTag(x, h, text, color, size) {
    const t = T(text, size, color, true, true);
    t.moveTo([x, BASE + h + (P ? 0.22 : 0.20), 0]);
    return t;
  }

  function makeArrow(x, y0, y1, color) {
    const dir = y1 > y0 ? 1 : -1;
    const shaft = new M.Line({ start: [x, y0, 0], end: [x, y1, 0], color, strokeWidth: 3 });
    const w1 = new M.Line({ start: [x, y1, 0], end: [x - 0.11, y1 - dir * 0.14, 0], color, strokeWidth: 3 });
    const w2 = new M.Line({ start: [x, y1, 0], end: [x + 0.11, y1 - dir * 0.14, 0], color, strokeWidth: 3 });
    return new M.VGroup(shaft, w1, w2);
  }

  function makeChargerSlot(x, y) {
    const w = P ? 0.42 : 0.38, h = P ? 0.30 : 0.28;
    const body = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.06, color: C.muted, strokeWidth: 1.5 });
    body.setFill(C.card, 0.55); body.moveTo([x, y, 0]);
    const p1 = new M.Line({ start: [x - 0.08, y + h / 2, 0], end: [x - 0.08, y + h / 2 + 0.08, 0], color: C.muted, strokeWidth: 2 });
    const p2 = new M.Line({ start: [x + 0.08, y + h / 2, 0], end: [x + 0.08, y + h / 2 + 0.08, 0], color: C.muted, strokeWidth: 2 });
    return new M.VGroup(body, p1, p2);
  }

  function makeCharger(x, y, fail) {
    const w = P ? 0.42 : 0.38, h = P ? 0.30 : 0.28;
    const col = fail ? C.pink : C.green;
    const body = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.06, color: col, strokeWidth: 2 });
    body.setFill(col, 0.92); body.moveTo([x, y, 0]);
    const p1 = new M.Line({ start: [x - 0.08, y + h / 2, 0], end: [x - 0.08, y + h / 2 + 0.08, 0], color: col, strokeWidth: 2.5 });
    const p2 = new M.Line({ start: [x + 0.08, y + h / 2, 0], end: [x + 0.08, y + h / 2 + 0.08, 0], color: col, strokeWidth: 2.5 });
    const ch = T(fail ? 'F' : 'P', 15, C.bg, true, true);
    ch.moveTo([x, y - 0.01, 0]);
    return new M.VGroup(body, p1, p2, ch);
  }

  function colFrame(k, color) {
    // from just under the rate labels to well above the tallest value label
    const lo = BASE - (P ? 0.54 : 0.46), hi = BASE + MAX_H + 0.48;
    const r = new M.RoundedRectangle({ width: SP * 0.88, height: hi - lo, cornerRadius: 0.14, color, strokeWidth: 2.5 });
    r.setFill(color, 0.07);
    r.moveTo([gx(k), (lo + hi) / 2, 0]);
    return r;
  }

  // Chart frame: baseline, y guides, rate labels
  const xLeft = gx(0) - SP * 0.48, xRight = gx(4) + SP * 0.48;
  const baseline = new M.Line({ start: [xLeft, BASE, 0], end: [xRight, BASE, 0], color: C.muted, strokeWidth: 2.5 });
  const guides = [10, 20, 30, 40].map(v => {
    const y = BASE + ptH(v);
    const gl = new M.Line({ start: [xLeft, y, 0], end: [xRight, y, 0], color: C.line, strokeWidth: 1 });
    const tl = T(String(v), P ? 15 : 14, C.muted, true);
    tl.moveTo([xLeft - (P ? 0.28 : 0.30), y, 0]);
    return new M.VGroup(gl, tl);
  });
  const rateLabels = RATES.map((r, k) => {
    const t = T(`${r}%`, P ? 17 : 18, C.ink, true, true);
    t.moveTo([gx(k), BASE - (P ? 0.34 : 0.28), 0]);
    return t;
  });
  const axisCap = T('candidate failure rate', P ? 15 : 15, C.muted);
  axisCap.moveTo([CX, BASE - (P ? 0.80 : 0.64), 0]);

  // 0: prior setup — 100 points over 5 failure rates (bars shown at once)
  const priorBars = PRIOR.map((v, k) => makeBar(gx(k), ptH(v), BW_ONE, C.cyan));
  await until(S(0));
  await play(
    new M.Create(baseline, { runTime: 0.9 }),
    new M.LaggedStart(priorBars.map(b => new M.FadeIn(b)), { lagRatio: 0.25, runTime: 2.0 }),
    ...guides.map(g => new M.FadeIn(g, { runTime: 0.8 })),
    ...rateLabels.map(t => new M.FadeIn(t, { runTime: 0.8 })),
    new M.FadeIn(axisCap, { runTime: 0.8 }),
    ...say('PRIOR = 100 POINTS OVER 5 RATES', C.cyan),
    ...fbox([['Prior (before batch)', C.cyan], '100 points of belief', 'over 5 failure rates'], C.cyan)
  );

  // 1: 10% -> 10, 20% -> 30, 30% -> 30, 40% -> 20, 50% -> 10
  let priorVals = PRIOR.map((v, k) => valTag(gx(k), ptH(v), String(v), C.cyan, P ? 16 : 17));
  await until(S(1));
  await play(
    new M.LaggedStart(priorBars.map(b => new M.Indicate(b, { color: C.cyan })), { lagRatio: 0.35, runTime: 5.0 }),
    new M.LaggedStart(priorVals.map(t => new M.FadeIn(t)), { lagRatio: 0.35, runTime: 5.0 }),
    ...fbox([['Prior (100 points)', C.cyan], '10%: 10   20%: 30', '30%: 30   40%: 20', '50%: 10   (total 100)'], C.cyan)
  );

  // 2: new batch arrives, 10 parts inspected
  const bx = j => P ? (j - 4.5) * 0.70 : -5.45 + j * 0.62;
  const slots = BATCH.map((_, j) => makeChargerSlot(bx(j), BATCH_Y));
  await until(S(2));
  await play(
    new M.LaggedStart(slots.map(s => new M.FadeIn(s)), { lagRatio: 0.12, runTime: 1.5 }),
    ...say('NEW BATCH: 10 PARTS INSPECTED', C.amber)
  );

  // 3: watch them one by one: F, P, P, F, P, P, P, F, P, P
  const parts = BATCH.map((fail, j) => makeCharger(bx(j), BATCH_Y, fail));
  await until(S(3));
  await play(
    new M.LaggedStart(parts.map(p => new M.FadeIn(p)), { lagRatio: 0.65, runTime: 4.2 }),
    ...say('FAIL · PASS · PASS · FAIL · ...', C.amber)
  );

  // 4: 3 failed, 7 passed
  const batchSummary = (() => {
    if (P) {
      const a = T('3 failed', 19, C.pink, true, true);
      const d = T('·', 19, C.muted, true, true);
      const b = T('7 passed', 19, C.green, true, true);
      a.moveTo([-1.12, 0.14, 0]); d.moveTo([0, 0.14, 0]); b.moveTo([1.16, 0.14, 0]);
      return new M.VGroup(a, d, b);
    }
    const a = T('3 FAIL', 15, C.pink, true, true);
    const b = T('7 PASS', 15, C.green, true, true);
    a.moveTo([1.25, BATCH_Y + 0.14, 0]); b.moveTo([1.25, BATCH_Y - 0.14, 0]);
    return new M.VGroup(a, b);
  })();
  await until(S(4));
  await play(
    new M.FadeOut(new M.VGroup(...slots), { runTime: 0.4 }),
    new M.FadeIn(batchSummary, { runTime: 0.8 }),
    ...say('3 FAILED · 7 PASSED', C.pink),
    ...fbox([['Batch data (10 parts)', C.amber], ['3 failed', C.pink], ['7 passed', C.green]], C.amber)
  );

  // 5: how should these results change the owner's belief?
  await until(S(5));
  await play(
    new M.LaggedStart(priorBars.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.15, runTime: 1.8 }),
    ...say('HOW SHOULD BELIEF CHANGE?', C.amber)
  );

  // 6: good fit gains belief, bad fit loses belief
  const upGood = makeArrow(gx(2), BASE + ptH(30) + 0.45, BASE + ptH(30) + 0.92, C.green);
  const dnBad = makeArrow(gx(0), BASE + ptH(10) + 0.92, BASE + ptH(10) + 0.45, C.pink);
  await until(S(6));
  await play(
    new M.FadeIn(upGood, { runTime: 0.8 }),
    new M.FadeIn(dnBad, { runTime: 0.8 }),
    ...say('GOOD FIT → GAIN · POOR FIT → LOSE', C.amber),
    ...fbox([['The idea', C.amber], ['Explains well → gain', C.green], ['Explains badly → lose', C.pink]], C.amber)
  );

  // 7: for each candidate, if this were the true rate, how likely is this batch?
  await until(S(7));
  await play(
    new M.FadeOut(new M.VGroup(upGood, dnBad), { runTime: 0.5 }),
    new M.LaggedStart(rateLabels.map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.2, runTime: 2.2 }),
    ...say('IF TRUE RATE: HOW LIKELY IS THIS BATCH?', C.amber)
  );

  // 8: called the likelihood
  await until(S(8));
  await play(
    ...say('LIKELIHOOD', C.amber),
    ...fbox([['Likelihood', C.amber], 'If this rate were true,', 'how likely is 3 fail, 7 pass?'], C.amber)
  );

  // 9: take 10% — seeing 3 in 10 is surprising
  const focus = colFrame(0, C.pink);
  await until(S(9));
  await play(
    new M.FadeIn(focus, { runTime: 0.8 }),
    ...say('10%: 3 FAILURES IS SURPRISING', C.pink),
    ...fbox([['Candidate: 10%', C.pink], 'Expect ~1 fail in 10', ['Saw 3 → surprising!', C.pink]], C.pink)
  );

  // 10: take 50% — seeing only 3 is a little surprising too
  await until(S(10));
  await play(
    new M.Transform(focus, colFrame(4, C.amber), { runTime: 0.9 }),
    ...say('50%: ONLY 3 IS SURPRISING TOO', C.amber),
    ...fbox([['Candidate: 50%', C.amber], 'Expect ~5 fails in 10', ['Saw 3 → a bit surprising', C.amber]], C.amber)
  );
  focus.setFill(C.amber, 0.07); focus.setColor(C.amber);

  // 11: take 30% — 3 in 10 is exactly what we expect
  await until(S(11));
  await play(
    new M.Transform(focus, colFrame(2, C.green), { runTime: 0.9 }),
    ...say('30%: 3 IN 10 IS EXACTLY EXPECTED', C.green),
    ...fbox([['Candidate: 30%', C.green], 'Expect 3 fails in 10', ['Saw 3 → best match!', C.green]], C.green)
  );
  focus.setFill(C.green, 0.07); focus.setColor(C.green);

  // 12: exact chances are tiny, so compare them instead
  await until(S(12));
  await play(
    new M.FadeOut(focus, { runTime: 0.5 }),
    ...say('EXACT CHANCES ARE TINY → COMPARE', C.amber),
    ...fbox([['Exact batch chances', C.amber], '10%: 0.0005  20%: 0.0017', '30%: 0.0022  40%: 0.0018', '50%: 0.0010  (tiny!)'], C.amber)
  );

  // 13: likelihood score compared with best
  await until(S(13));
  await play(
    ...say('LIKELIHOOD SCORE (BEST = 1)', C.amber),
    ...fbox([['Likelihood score', C.amber], 'chance ÷ best chance', ['Best candidate gets 1', C.amber]], C.amber)
  );

  // 14: 30% gets 1
  await until(S(14));
  await play(
    new M.Indicate(rateLabels[2], { color: C.amber, runTime: 1.0 }),
    ...say('30% → SCORE 1 (BEST)', C.amber),
    ...fbox([['Likelihood scores', C.amber], ['30%: 1  (best)', C.amber]], C.amber)
  );

  // 15: 40% gets 0.8
  await until(S(15));
  await play(
    new M.Indicate(rateLabels[3], { color: C.amber, runTime: 0.9 }),
    ...say('40% → SCORE 0.8', C.amber),
    ...fbox([['Likelihood scores', C.amber], '30%: 1', ['40%: 0.8', C.amber]], C.amber)
  );

  // 16: 20% gets 0.75
  await until(S(16));
  await play(
    new M.Indicate(rateLabels[1], { color: C.amber, runTime: 0.9 }),
    ...say('20% → SCORE 0.75', C.amber),
    ...fbox([['Likelihood scores', C.amber], ['20%: 0.75', C.amber], '30%: 1     40%: 0.8'], C.amber)
  );

  // 17: 50% gets 0.45
  await until(S(17));
  await play(
    new M.Indicate(rateLabels[4], { color: C.amber, runTime: 0.9 }),
    ...say('50% → SCORE 0.45', C.amber),
    ...fbox([['Likelihood scores', C.amber], '20%: 0.75  30%: 1', '40%: 0.8   50%: 0.45'], C.amber)
  );

  // 18: 10% gets 0.2
  await until(S(18));
  await play(
    new M.Indicate(rateLabels[0], { color: C.amber, runTime: 0.9 }),
    ...say('10% → SCORE 0.2', C.amber),
    ...fbox([['Likelihood scores', C.amber], ['10%: 0.2   (lowest)', C.pink], '20%: 0.75  30%: 1', '40%: 0.8   50%: 0.45'], C.amber)
  );

  // 19: draw likelihood scores as orange bars next to blue prior bars
  const priorValsLeft = PRIOR.map((v, k) => valTag(lx(k), ptH(v), String(v), C.cyan, P ? 15 : 16));
  const likeBars = LIKE.map((v, k) => makeBar(rx(k), likeH(v), BW_PAIR, C.amber));
  const likeVals = LIKE.map((v, k) => valTag(rx(k), likeH(v), LIKE_TXT[k], C.amber, P ? 15 : 15));
  await until(S(19));
  await play(
    ...priorBars.map((b, k) => new M.Transform(b, makeBar(lx(k), ptH(PRIOR[k]), BW_PAIR, C.cyan), { runTime: 1.0 })),
    new M.FadeOut(new M.VGroup(...priorVals), { runTime: 0.4 }),
    ...priorValsLeft.map(t => new M.FadeIn(t, { runTime: 0.8 })),
    new M.LaggedStart(likeBars.map(b => new M.FadeIn(b)), { lagRatio: 0.14, runTime: 1.6 }),
    new M.LaggedStart(likeVals.map(t => new M.FadeIn(t)), { lagRatio: 0.14, runTime: 1.6 }),
    ...setLegend([['Prior', C.cyan], ['Likelihood', C.amber]]),
    ...say('BLUE = PRIOR · ORANGE = LIKELIHOOD', C.amber)
  );
  priorVals = priorValsLeft;

  // 20: combine the two: prior share × likelihood score
  await until(S(20));
  await play(
    ...say('MULTIPLY: PRIOR × LIKELIHOOD', C.violet),
    ...fbox([['Combine prior & data', C.violet], ['prior × likelihood', C.amber], 'for each candidate'], C.violet)
  );

  // 21: write prior shares as parts of 1 (0.1, 0.3, 0.3, 0.2, 0.1)
  const priorValsDec = PRIOR.map((v, k) => valTag(lx(k), ptH(v), PRIOR_SH[k], C.cyan, P ? 15 : 16));
  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(...priorVals), { runTime: 0.4 }),
    ...priorValsDec.map(t => new M.FadeIn(t, { runTime: 0.8 })),
    ...say('PRIOR AS SHARES OF 1', C.cyan),
    ...fbox([['Points → shares of 1', C.cyan], '10 pts = 0.1   30 pts = 0.3', '20 pts = 0.2   total = 1'], C.cyan)
  );
  priorVals = priorValsDec;

  // 22-26: multiply each candidate one by one
  const prodVals = [];
  for (let k = 0; k < 5; k++) {
    await until(S(22 + k));
    const pv = valTag(rx(k), ptH(PROD[k] * 100), PROD_TXT[k], C.violet, P ? 15 : 14);
    prodVals.push(pv);
    const extra = k === 0 ? setLegend([['Prior', C.cyan], ['Like', C.amber], ['Prior × Like', C.violet]])
      : k === 4 ? setLegend([['Prior', C.cyan], ['Prior × Like', C.violet]]) : [];
    await play(
      new M.Indicate(priorBars[k], { color: C.cyan, runTime: 1.0 }),
      new M.Transform(likeBars[k], makeBar(rx(k), ptH(PROD[k] * 100), BW_PAIR, C.violet), { runTime: 1.0 }),
      new M.FadeOut(likeVals[k], { runTime: 0.4 }),
      new M.FadeIn(pv, { runTime: 0.8 }),
      ...extra,
      ...say(`${RATES[k]}%: ${PRIOR_SH[k]} × ${LIKE_TXT[k]} = ${PROD_TXT[k]}`, C.violet),
      ...fbox([
        [`Candidate ${RATES[k]}%`, C.violet],
        `prior ${PRIOR_SH[k]} × like ${LIKE_TXT[k]}`,
        [`= ${PROD_TXT[k]}`, C.amber]
      ], C.violet)
    );
    likeBars[k].setFill(C.violet, 0.85);
    likeBars[k].setColor(C.violet);
  }

  // 27: they add up to only 0.75, but belief shares must add to 1
  await until(S(27));
  await play(
    new M.LaggedStart(likeBars.map(b => new M.Indicate(b, { color: C.pink })), { lagRatio: 0.12, runTime: 1.6 }),
    ...say('TOTAL = 0.75  (MUST BE 1!)', C.pink),
    ...fbox([
      ['Sum of the 5 products', C.pink],
      '0.02+0.225+0.3+0.16+0.045',
      ['= 0.75  (need 1.00!)', C.pink]
    ], C.pink)
  );

  // 28: rescale — divide each by 0.75 so total is 1 again
  await until(S(28));
  await play(
    new M.FadeOut(new M.VGroup(...prodVals), { runTime: 0.4 }),
    ...likeBars.map((b, k) => new M.Transform(b, makeBar(rx(k), ptH(POST[k]), BW_PAIR, C.violet), { runTime: 1.5 })),
    ...say('RESCALE: DIVIDE EACH BY 0.75', C.green),
    ...fbox([['Rescale to total 1', C.green], 'each number ÷ 0.75', ['new total = 1.00', C.green]], C.green)
  );

  // 29: like resizing a photo — shape stays the same, only size changes
  await until(S(29));
  await play(
    ...likeBars.map((b, k) => new M.Transform(b, makeBar(rx(k), ptH(PROD[k] * 100), BW_PAIR, C.violet), { runTime: 1.0 })),
    ...say('LIKE RESIZING A PHOTO: SAME SHAPE', C.violet),
    ...fbox([['Like resizing a photo', C.violet], 'All 5 bars scale together', 'Shape stays the same!'], C.violet)
  );
  await play(
    ...likeBars.map((b, k) => new M.Transform(b, makeBar(rx(k), ptH(POST[k]), BW_PAIR, C.violet), { runTime: 1.1 }))
  );

  // 30: after rescaling, in points out of 100: 3, 30, 40, 21, 6
  const priorValsPts = PRIOR.map((v, k) => valTag(lx(k), ptH(v), String(v), C.cyan, P ? 15 : 16));
  const postVals = POST.map((v, k) => valTag(rx(k), ptH(v), String(v), C.green, P ? 15 : 16));
  await until(S(30));
  await play(
    new M.FadeOut(new M.VGroup(...priorVals), { runTime: 0.4 }),
    ...priorValsPts.map(t => new M.FadeIn(t, { runTime: 0.7 })),
    new M.LaggedStart(postVals.map(t => new M.FadeIn(t)), { lagRatio: 0.35, runTime: 3.2 }),
    ...say('3 · 30 · 40 · 21 · 6  (TOTAL 100)', C.green),
    ...fbox([['Rescaled (out of 100)', C.green], '10%: 3    20%: 30   30%: 40', '40%: 21   50%: 6', ['Total = 100 points', C.green]], C.green)
  );
  priorVals = priorValsPts;

  // 31: draw these as green bars — new belief after seeing the batch
  const postBars = POST.map((v, k) => makeBar(rx(k), ptH(v), BW_PAIR, C.green));
  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(...likeBars), { runTime: 0.6 }),
    ...postBars.map(b => new M.FadeIn(b, { runTime: 1.0 })),
    ...setLegend([['Prior', C.cyan], ['Posterior', C.green]]),
    ...say('GREEN = NEW BELIEF AFTER DATA', C.green)
  );

  // 32: called the posterior (posterior means after)
  await until(S(32));
  await play(
    new M.LaggedStart(postBars.map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.14, runTime: 1.8 }),
    ...say('POSTERIOR = AFTER THE DATA', C.green),
    ...fbox([['Posterior', C.green], 'belief AFTER seeing data', ['("posterior" means after)', C.muted]], C.green)
  );

  // 33: compare blue and green — 30% grew from 30 to 40
  const arr30 = makeArrow(rx(2), BASE + ptH(30), BASE + ptH(40), C.green);
  const f30 = colFrame(2, C.green);
  await until(S(33));
  await play(
    new M.FadeIn(f30, { runTime: 0.7 }),
    new M.FadeIn(arr30, { runTime: 0.7 }),
    new M.Indicate(postBars[2], { color: C.green, runTime: 1.1 }),
    ...say('30%: GREW FROM 30 TO 40', C.green),
    ...fbox([['Compare prior → posterior', C.cyan], ['30%:  30 → 40  (+10)', C.green]], C.green)
  );

  // 34: 10% fell 10 -> 3; 50% fell 10 -> 6
  const f10 = colFrame(0, C.pink);
  const f50 = colFrame(4, C.pink);
  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(f30, arr30), { runTime: 0.4 }),
    new M.FadeIn(f10, { runTime: 0.7 }),
    new M.FadeIn(f50, { runTime: 0.7 }),
    new M.Indicate(postBars[0], { color: C.pink, runTime: 1.1 }),
    new M.Indicate(postBars[4], { color: C.pink, runTime: 1.1 }),
    ...say('10%: 10 → 3  ·  50%: 10 → 6', C.pink),
    ...fbox([['Compare prior → posterior', C.cyan], ['30%:  30 → 40  (+10)', C.green], ['10%:  10 → 3   (−7)', C.pink], ['50%:  10 → 6   (−4)', C.pink]], C.cyan)
  );

  // 35: data did not throw away the prior — they moved it
  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(f10, f50), { runTime: 0.4 }),
    new M.LaggedStart(postBars.map(b => new M.Indicate(b, { color: C.cyan })), { lagRatio: 0.12, runTime: 1.4 }),
    ...say('DATA MOVED BELIEF, NOT REPLACED IT', C.cyan)
  );

  // 36: short version in one line
  await until(S(36));
  await play(...say('THE SHORT VERSION', C.cyan));

  // 37: posterior = prior x likelihood, rescaled so total is 1
  await until(S(37));
  await play(
    ...say('POSTERIOR = PRIOR × LIKELIHOOD, RESCALED', C.green),
    ...fbox([
      ['posterior =', C.green],
      ['  prior × likelihood', C.amber],
      ['  rescaled to total 1', C.cyan]
    ], C.green)
  );

  // 38: everyday words
  await until(S(38));
  await play(
    ...say('START → REWARD GOOD FIT → RESHARE', C.amber),
    ...fbox([
      ['In everyday words', C.amber],
      '1. Start with prior belief',
      '2. Reward good-fit values',
      '3. Rescale to 100 points'
    ], C.amber)
  );

  // 39: Bayes' rule
  await until(S(39));
  await play(
    ...say("BAYES' RULE", C.violet),
    ...fbox([
      ["Bayes' rule", C.violet],
      ['posterior = prior × likelihood', C.green],
      ['            (rescaled to 1)', C.muted],
      ['Thomas Bayes (~300 yrs ago)', C.muted]
    ], C.violet)
  );

  // 40: what it is for — new evidence tells you how much to change your mind
  await until(S(40));
  await play(
    new M.LaggedStart(parts.map(p => new M.Indicate(p, { color: C.amber })), { lagRatio: 0.08, runTime: 1.4 }),
    ...say('NEW EVIDENCE → HOW MUCH TO UPDATE', C.cyan),
    ...fbox([
      ['What it is for', C.cyan],
      'When new evidence arrives,',
      'tells you exactly how much',
      'to change your mind'
    ], C.cyan)
  );

  // 41: tomorrow's posterior becomes the prior for the next batch
  await until(S(41));
  await play(
    new M.LaggedStart(postBars.map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.14, runTime: 1.6 }),
    ...say("POSTERIOR → TOMORROW'S PRIOR", C.green),
    ...fbox([
      ['Step-by-step learning', C.green],
      ['Prior + Batch 1 → Posterior', C.cyan],
      ['      + Batch 2 → Next...', C.green]
    ], C.green)
  );

  // 42: common trap — posterior is not the batch's share alone
  await until(S(42));
  await play(
    ...say('TRAP: NOT THE BATCH ALONE!', C.pink),
    ...fbox([
      ['Common trap', C.pink],
      'Posterior is NOT just',
      'the batch share (30%)'
    ], C.pink)
  );

  // 43: batch alone says 3/10 = 30%, posterior still keeps belief on 20% and 40%
  const f20 = colFrame(1, C.green);
  const f40 = colFrame(3, C.green);
  await until(S(43));
  await play(
    new M.FadeIn(f20, { runTime: 0.7 }),
    new M.FadeIn(f40, { runTime: 0.7 }),
    new M.Indicate(postBars[1], { color: C.green, runTime: 1.2 }),
    new M.Indicate(postBars[3], { color: C.green, runTime: 1.2 }),
    ...say('STILL BELIEF ON 20% (30) & 40% (21)', C.green),
    ...fbox([
      ['Batch alone: 3 / 10 = 30%', C.pink],
      ['Posterior still keeps:', C.green],
      '  20% → 30 points',
      '  40% → 21 points'
    ], C.amber)
  );

  // 44: 10 parts are not enough to be sure — posterior honestly shows that doubt
  await until(S(44));
  await play(
    new M.FadeOut(new M.VGroup(f20, f40), { runTime: 0.5 }),
    new M.LaggedStart(postBars.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.14, runTime: 1.8 }),
    ...say('10 PARTS → HONEST DOUBT REMAINS', C.amber)
  );

  // 45: one-sentence recap
  await until(S(45));
  await play(
    new M.LaggedStart(postBars.map(b => new M.Indicate(b, { color: C.green })), { lagRatio: 0.14, runTime: 1.6 }),
    ...say('POSTERIOR = PRIOR REWEIGHTED BY DATA', C.green),
    ...fbox([
      ['One-sentence recap', C.green],
      'Posterior = prior belief',
      'reweighted by how well each',
      'value explains the data.'
    ], C.green)
  );
}
