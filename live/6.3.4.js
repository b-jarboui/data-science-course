// 6.3.4 Credible intervals (live animation in sync with narration).
// Beat i = sentence i (0-based, 0..41). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // --- Beta(a, b) exact density ---
  function lgamma(z) {
    const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
    z -= 1; let x = c[0];
    for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
  function betaPdf(x, a, b) {
    if (x <= 0 || x >= 1) return (a === 1 && x === 0) ? b : (b === 1 && x === 1) ? a : 0;
    return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - (lgamma(a) + lgamma(b) - lgamma(a + b)));
  }

  // --- layout constants (phone 8 x 14.22, laptop 14.22 x 8) ---
  const CX = P ? 0 : -2.4;
  const PW = P ? 6.8 : 7.4;
  const X0 = CX - PW / 2, X1 = CX + PW / 2;
  const BASE = P ? -3.6 : -1.25;
  const PH = P ? 4.4 : 2.35;
  const Y_SCALE = PH / 5.6;
  const PILL = P ? [0, 1.92, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.35, 0] : [4.4, -0.15, 0];
  const BAR1_Y = P ? -4.95 : -2.08;
  const BAR2_Y = P ? -5.85 : -2.68;

  const px = r => X0 + r * PW;
  const py = d => BASE + d * Y_SCALE;
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // --- single formula box helper ---
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.38 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.6 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.5 }));
    boxNow = g;
    return a;
  }

  // --- drawing helpers (build fresh groups before adding to scene) ---
  function makeAxis() {
    const parts = [new M.Line({ start: [X0, BASE, 0], end: [X1, BASE, 0], color: C.muted, strokeWidth: 3 })];
    for (const v of [0, 20, 40, 60, 80, 100]) {
      const x = px(v / 100);
      parts.push(new M.Line({ start: [x, BASE - 0.07, 0], end: [x, BASE + 0.07, 0], color: C.muted, strokeWidth: 2 }));
      const lbl = T(`${v}%`, P ? 15 : 17, C.muted, true);
      lbl.moveTo([x, BASE - 0.30, 0]);
      parts.push(lbl);
    }
    const unit = T('failure rate', P ? 15 : 16, C.muted);
    unit.moveTo([X1 - unit.getWidth() / 2, BASE - 0.60, 0]);
    parts.push(unit);
    return new M.VGroup(...parts);
  }

  function makeCurve(a, b, color, width = 3.5, glow = true, yScale = Y_SCALE, baseY = BASE, x0 = X0, pw = PW) {
    const N = 80, pts = [];
    for (let i = 0; i <= N; i++) {
      const r = i / N;
      pts.push([x0 + r * pw, baseY + betaPdf(r, a, b) * yScale, 0.004]);
    }
    const segs = [];
    if (glow) {
      for (let i = 0; i < N; i++) {
        const gl = new M.Line({ start: pts[i], end: pts[i + 1], color, strokeWidth: width * 2.3 });
        gl.setStrokeOpacity(0.20);
        segs.push(gl);
      }
    }
    for (let i = 0; i < N; i++) {
      segs.push(new M.Line({ start: pts[i], end: pts[i + 1], color, strokeWidth: width }));
    }
    return new M.VGroup(...segs);
  }

  function makeSlices(a, b, r0, r1, n, color, op, reverse = false, yScale = Y_SCALE, baseY = BASE, x0 = X0, pw = PW) {
    const dx = (r1 - r0) / n, sw = dx * pw, arr = [];
    for (let i = 0; i < n; i++) {
      const r = r0 + (i + 0.5) * dx;
      const h = betaPdf(r, a, b) * yScale;
      if (h < 0.008) continue;
      const rect = new M.Rectangle({ width: sw + 0.012, height: h, color, strokeWidth: 0 });
      rect.setStrokeOpacity(0);
      rect.setFill(color, op);
      rect.moveTo([x0 + r * pw, baseY + h / 2, -0.004]);
      arr.push(rect);
    }
    return reverse ? arr.reverse() : arr;
  }

  function makeCut(r, a, b, color, labelText, labelDy = -0.58) {
    const x = px(r), topY = Math.max(BASE + 0.45, py(betaPdf(r, a, b)) + 0.12);
    const dash = new M.DashedLine({ start: [x, BASE, 0], end: [x, topY, 0], color });
    const dot = new M.Dot({ point: [x, BASE, 0.01], radius: 0.085, color });
    dot.setFill(color, 1);
    const lbl = T(labelText, P ? 19 : 18, color, true, true);
    lbl.moveTo([x, BASE + labelDy, 0]);
    return { group: new M.VGroup(dash, dot, lbl), dot };
  }

  function makeCallout(text, labelPos, targetPos, color) {
    const t = T(text, P ? 19 : 17, color, true, true);
    t.moveTo(labelPos);
    const dir = targetPos[1] < labelPos[1] ? -1 : 1;
    const line = new M.Line({ start: [labelPos[0], labelPos[1] + dir * 0.22, 0], end: targetPos, color, strokeWidth: 2 });
    const tip = new M.Dot({ point: targetPos, radius: 0.055, color });
    tip.setFill(color, 1);
    return new M.VGroup(t, line, tip);
  }

  function makeBar(r0, r1, y, color, text) {
    const xL = px(r0), xR = px(r1);
    const seg = new M.Line({ start: [xL, y, 0], end: [xR, y, 0], color, strokeWidth: 5 });
    const capL = new M.Line({ start: [xL, y - 0.11, 0], end: [xL, y + 0.11, 0], color, strokeWidth: 2.5 });
    const capR = new M.Line({ start: [xR, y - 0.11, 0], end: [xR, y + 0.11, 0], color, strokeWidth: 2.5 });
    const dL = new M.Dot({ point: [xL, y, 0.01], radius: 0.065, color }); dL.setFill(color, 1);
    const dR = new M.Dot({ point: [xR, y, 0.01], radius: 0.065, color }); dR.setFill(color, 1);
    const lbl = T(text, P ? 18 : 17, color, true, true);
    const lx = Math.min(X1 - lbl.getWidth() / 2, xR + 0.22 + lbl.getWidth() / 2);
    if (lx - lbl.getWidth() / 2 < xR + 0.12) lbl.moveTo([Math.max(X0 + lbl.getWidth() / 2, Math.min(X1 - lbl.getWidth() / 2, (xL + xR) / 2)), y - 0.36, 0]);
    else lbl.moveTo([lx, y, 0]);
    return new M.VGroup(seg, capL, capR, dL, dR, lbl);
  }

  function makeThreshold(r, color, labelText, badgeText, badgeSide = -1) {
    const x = px(r), topY = BASE + PH * 0.88;
    const dash = new M.DashedLine({ start: [x, BASE, 0], end: [x, topY, 0], color });
    const dot = new M.Dot({ point: [x, BASE, 0.01], radius: 0.085, color }); dot.setFill(color, 1);
    const lbl = T(labelText, P ? 18 : 17, color, true, true);
    lbl.moveTo([x, topY + 0.22, 0]);
    const parts = [dash, dot, lbl];
    if (badgeText) {
      const b = pill(badgeText, color, P ? 16 : 15);
      const bx = badgeSide < 0 ? Math.max(X0 + 1.1, x - 1.15) : Math.min(X1 - 1.1, x + 1.15);
      b.moveTo([bx, BASE + PH * 0.68, 0]);
      parts.push(b);
    }
    return { group: new M.VGroup(...parts), dot };
  }

  // Exact cutoffs for Beta(5, 15) and Beta(2, 8)
  const L95 = 0.091, R95 = 0.456;
  const L90 = 0.110, R90 = 0.421;
  const L_PRIOR = 0.028, R_PRIOR = 0.482;
  const L_FLAT = 0.109, R_FLAT = 0.610;
  const L_MORE = 0.128, R_MORE = 0.402;

  // =====================================================================
  // BEAT 0: Posterior Beta(5, 15), mean 25%
  // =====================================================================
  let axis = makeAxis();
  let postCurve = makeCurve(5, 15, C.green, 3.5, true);
  const meanX = px(0.25), meanTop = py(betaPdf(0.25, 5, 15));
  const meanLine = new M.DashedLine({ start: [meanX, BASE, 0], end: [meanX, meanTop + 0.12, 0], color: C.amber });
  const meanDot = new M.Dot({ point: [meanX, BASE, 0.01], radius: 0.09, color: C.amber }); meanDot.setFill(C.amber, 1);
  const meanTag = T('mean 25%', P ? 18 : 17, C.amber, true, true); meanTag.moveTo([meanX, meanTop + 0.36, 0]);

  await until(S(0));
  await play(
    new M.Create(axis, { runTime: 0.9 }),
    new M.Create(postCurve, { runTime: 1.3 }),
    new M.FadeIn(meanLine, { runTime: 0.9 }),
    new M.FadeIn(meanDot, { runTime: 0.9 }),
    new M.FadeIn(meanTag, { runTime: 0.9 }),
    ...say('POSTERIOR: BETA(5, 15)', C.green),
    ...fbox(['posterior = Beta(5, 15)', ['mean      = 25%', C.amber]], C.green)
  );

  // =====================================================================
  // BEAT 1: "The owner asks: so is the failure rate twenty five percent?"
  // =====================================================================
  const qMark = T('?', 28, C.amber, true, true);
  qMark.moveTo([meanX + 0.95, meanTop + 0.36, 0]);
  await until(S(1));
  await play(
    new M.Flash(meanDot, { color: C.amber, runTime: 0.8 }),
    new M.Indicate(meanTag, { color: C.amber, runTime: 0.9 }),
    new M.FadeIn(qMark, { runTime: 0.6 }),
    ...say('IS THE RATE EXACTLY 25%?', C.amber)
  );

  // =====================================================================
  // BEAT 2: "Not exactly. After only ten parts, many rates are still believable."
  // =====================================================================
  const candRates = [0.14, 0.19, 0.25, 0.31, 0.37, 0.42];
  const candDots = candRates.map(r => {
    const d = new M.Dot({ point: [px(r), py(betaPdf(r, 5, 15)), 0.01], radius: 0.085, color: C.cyan });
    d.setFill(C.cyan, 0.95);
    return d;
  });
  const partIcons = [];
  for (let k = 0; k < 10; k++) {
    const fail = k < 3, col = fail ? C.pink : C.green;
    const bx = CX + (k - 4.5) * (P ? 0.44 : 0.48), by = BAR1_Y;
    const box = new M.RoundedRectangle({ width: 0.30, height: 0.22, cornerRadius: 0.05, color: col, strokeWidth: 1.5 });
    box.setFill(col, 0.72); box.moveTo([bx, by, 0]);
    partIcons.push(box);
  }
  const batchCap = T('10 parts: 3 fail, 7 pass', P ? 17 : 16, C.muted, true);
  batchCap.moveTo([CX, BAR1_Y - 0.34, 0]);
  const batchGroup = new M.VGroup(...partIcons, batchCap);

  await until(S(2));
  await play(
    new M.FadeOut(qMark, { runTime: 0.4 }),
    new M.FadeIn(batchGroup, { runTime: 0.8 }),
    new M.LaggedStart(candDots.map(d => new M.FadeIn(d)), { lagRatio: 0.14, runTime: 1.4 }),
    ...say('10 PARTS → MANY RATES BELIEVABLE', C.cyan)
  );

  // =====================================================================
  // BEAT 3: "The owner wants a range: from where, to where, is the rate probably?"
  // =====================================================================
  const rBarY = BAR1_Y;
  const rLine = new M.Line({ start: [px(0.11), rBarY, 0], end: [px(0.45), rBarY, 0], color: C.amber, strokeWidth: 4 });
  const rDotL = new M.Dot({ point: [px(0.11), rBarY, 0.01], radius: 0.08, color: C.amber }); rDotL.setFill(C.amber, 1);
  const rDotR = new M.Dot({ point: [px(0.45), rBarY, 0.01], radius: 0.08, color: C.amber }); rDotR.setFill(C.amber, 1);
  const rQL = T('?%', 19, C.amber, true, true); rQL.moveTo([px(0.11), rBarY - 0.34, 0]);
  const rQR = T('?%', 19, C.amber, true, true); rQR.moveTo([px(0.45), rBarY - 0.34, 0]);
  const rMid = T('from where to where?', P ? 17 : 16, C.amber, true);
  rMid.moveTo([px(0.28), rBarY + 0.28, 0]);
  const wantRange = new M.VGroup(rLine, rDotL, rDotR, rQL, rQR, rMid);

  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(batchGroup, meanLine, meanDot, meanTag, ...candDots), { runTime: 0.6 }),
    new M.FadeIn(wantRange, { runTime: 0.8 }),
    ...say('FROM WHERE TO WHERE?', C.amber)
  );

  // =====================================================================
  // BEAT 4: "Let's look at the green posterior hill again."
  // =====================================================================
  await until(S(4));
  await play(
    new M.FadeOut(wantRange, { runTime: 0.5 }),
    new M.Indicate(postCurve, { color: C.green, runTime: 0.9 }),
    ...say('THE GREEN POSTERIOR HILL', C.green)
  );

  // =====================================================================
  // BEAT 5: "Under the hill, the total area is one. That is all of our belief, one hundred percent."
  // =====================================================================
  const fullFill = makeSlices(5, 15, 0.01, 0.72, 60, C.green, 0.42);
  const lbl100 = T('100%', P ? 24 : 26, C.green, true, true);
  lbl100.moveTo([px(0.24), BASE + PH * 0.34, 0.01]);

  await until(S(5));
  await play(
    new M.LaggedStart(fullFill.map(r => new M.FadeIn(r)), { lagRatio: 0.025, runTime: 1.8 }),
    new M.FadeIn(lbl100, { runTime: 0.8 }),
    ...say('TOTAL AREA = 1 = 100% OF BELIEF', C.green),
    ...fbox(['under the hill', ['total area = 1  (100%)', C.green]], C.green)
  );

  // =====================================================================
  // BEAT 6: "The area above any stretch of the line is the probability that the rate lies in that stretch."
  // =====================================================================
  let baseGhost = makeSlices(5, 15, 0.01, 0.72, 50, C.green, 0.09);
  const demoFill = makeSlices(5, 15, 0.20, 0.35, 18, C.cyan, 0.56);
  const demoSeg = new M.Line({ start: [px(0.20), BASE, 0.01], end: [px(0.35), BASE, 0.01], color: C.cyan, strokeWidth: 6 });
  const demoL = new M.DashedLine({ start: [px(0.20), BASE, 0], end: [px(0.20), py(betaPdf(0.20, 5, 15)), 0], color: C.cyan });
  const demoR = new M.DashedLine({ start: [px(0.35), BASE, 0], end: [px(0.35), py(betaPdf(0.35, 5, 15)), 0], color: C.cyan });
  const demoTag = T('stretch', P ? 18 : 17, C.cyan, true, true);
  demoTag.moveTo([px(0.275), BASE - 0.62, 0]);
  const demoMarks = new M.VGroup(demoSeg, demoL, demoR, demoTag);

  await until(S(6));
  await play(
    new M.FadeOut(new M.VGroup(...fullFill, lbl100), { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(...baseGhost), { runTime: 0.5 }),
    new M.LaggedStart(demoFill.map(r => new M.FadeIn(r)), { lagRatio: 0.05, runTime: 1.1 }),
    new M.FadeIn(demoMarks, { runTime: 0.7 }),
    ...say('AREA ABOVE A STRETCH = PROBABILITY', C.cyan)
  );

  // =====================================================================
  // BEAT 7: "You met this in unit five: probability as area under a curve."
  // =====================================================================
  await until(S(7));
  await play(
    new M.Indicate(demoMarks, { color: C.cyan, runTime: 0.9 }),
    ...say('UNIT 5: PROBABILITY = AREA', C.cyan),
    ...fbox(['unit 5 rule', ['probability =', C.muted], ['area under the curve', C.cyan]], C.cyan)
  );

  // =====================================================================
  // BEAT 8: "Now we will cut off the two thin tails and keep the middle."
  // =====================================================================
  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(...demoFill, demoMarks), { runTime: 0.6 }),
    ...say('CUT TWO THIN TAILS, KEEP THE MIDDLE', C.amber),
    ...fbox(['equal-tails plan', ['left tail:   2.5%', C.pink], ['right tail:  2.5%', C.pink], ['keep middle: 95%', C.green]], C.amber)
  );

  // =====================================================================
  // BEAT 9: "Let's shade the hill from the left, until we have shaded two and a half percent of the area."
  // =====================================================================
  const tailL95 = makeSlices(5, 15, 0.01, L95, 14, C.pink, 0.78);
  const tagL95 = makeCallout('2.5%', [px(0.065), BASE + PH * 0.56, 0], [px(0.068), BASE + 0.18, 0], C.pink);

  await until(S(9));
  await play(
    new M.LaggedStart(tailL95.map(r => new M.FadeIn(r)), { lagRatio: 0.10, runTime: 1.6 }),
    new M.FadeIn(tagL95, { runTime: 0.8 }),
    ...say('SHADE FROM LEFT: 2.5% OF AREA', C.pink)
  );

  // =====================================================================
  // BEAT 10: "That stops at about nine percent on the line."
  // =====================================================================
  const cutL95 = makeCut(L95, 5, 15, C.amber, '9%', -0.64);
  await until(S(10));
  await play(
    new M.FadeIn(cutL95.group, { runTime: 0.7 }),
    new M.Flash(cutL95.dot, { color: C.amber, runTime: 0.7 }),
    ...say('STOPS AT ABOUT 9%', C.amber)
  );

  // =====================================================================
  // BEAT 11: "Now shade from the right, until we have shaded another two and a half percent."
  // =====================================================================
  const tailR95 = makeSlices(5, 15, R95, 0.72, 24, C.pink, 0.78, true);
  const tagR95 = makeCallout('2.5%', [px(0.58), BASE + PH * 0.42, 0], [px(0.51), BASE + 0.14, 0], C.pink);

  await until(S(11));
  await play(
    new M.LaggedStart(tailR95.map(r => new M.FadeIn(r)), { lagRatio: 0.06, runTime: 1.6 }),
    new M.FadeIn(tagR95, { runTime: 0.8 }),
    ...say('SHADE FROM RIGHT: 2.5% OF AREA', C.pink)
  );

  // =====================================================================
  // BEAT 12: "That stops at about forty six percent."
  // =====================================================================
  const cutR95 = makeCut(R95, 5, 15, C.amber, '46%', -0.64);
  await until(S(12));
  await play(
    new M.FadeIn(cutR95.group, { runTime: 0.7 }),
    new M.Flash(cutR95.dot, { color: C.amber, runTime: 0.7 }),
    ...say('STOPS AT ABOUT 46%', C.amber)
  );

  // =====================================================================
  // BEAT 13: "What is left in the middle? One hundred, minus two and a half, minus two and a half: ninety five percent of the area."
  // =====================================================================
  const mid95 = makeSlices(5, 15, L95, R95, 36, C.green, 0.56);
  const lbl95 = T('95%', P ? 24 : 26, C.green, true, true);
  lbl95.moveTo([px(0.24), BASE + PH * 0.34, 0.01]);

  await until(S(13));
  await play(
    new M.LaggedStart(mid95.map(r => new M.FadeIn(r)), { lagRatio: 0.03, runTime: 1.5 }),
    new M.FadeIn(lbl95, { runTime: 0.8 }),
    ...say('MIDDLE AREA = 95%', C.green),
    ...fbox(['middle area', '100% - 2.5% - 2.5%', ['= 95%', C.green]], C.green)
  );

  // =====================================================================
  // BEAT 14: "So, given our prior and our batch, there is a ninety five percent probability that the failure rate is between nine and forty six percent."
  // =====================================================================
  const bar95 = makeBar(L95, R95, BAR1_Y, C.green, '95%: 9% to 46%');
  await until(S(14));
  await play(
    new M.FadeIn(bar95, { runTime: 0.9 }),
    ...say('95% PROBABILITY: 9% TO 46%', C.green),
    ...fbox(['given prior + batch:', ['95% probability', C.green], ['rate in 9% to 46%', C.amber]], C.green)
  );

  // =====================================================================
  // BEAT 15: "This range is called a credible interval. Here, a ninety five percent credible interval."
  // =====================================================================
  await until(S(15));
  await play(
    new M.Indicate(bar95, { color: C.green, runTime: 1.0 }),
    ...say('95% CREDIBLE INTERVAL', C.green),
    ...fbox([['95% credible interval', C.green], ['9% to 46%', C.amber]], C.green)
  );

  // =====================================================================
  // BEAT 16: "Credible means believable. It is the range you believe, with ninety five percent probability."
  // =====================================================================
  await until(S(16));
  await play(
    new M.Indicate(lbl95, { color: C.amber, runTime: 0.9 }),
    ...say('CREDIBLE = BELIEVABLE (95%)', C.green)
  );

  // =====================================================================
  // BEAT 17: "Let's try a narrower one. Keep only the middle ninety percent."
  // =====================================================================
  const tailL90 = makeSlices(5, 15, 0.01, L90, 14, C.pink, 0.78);
  const tailR90 = makeSlices(5, 15, R90, 0.72, 24, C.pink, 0.78, true);
  const mid90 = makeSlices(5, 15, L90, R90, 32, C.cyan, 0.52);
  const tagL90 = makeCallout('5%', [px(0.065), BASE + PH * 0.56, 0], [px(0.08), BASE + 0.22, 0], C.pink);
  const tagR90 = makeCallout('5%', [px(0.56), BASE + PH * 0.44, 0], [px(0.47), BASE + 0.20, 0], C.pink);
  const lbl90 = T('90%', P ? 24 : 26, C.cyan, true, true);
  lbl90.moveTo([px(0.24), BASE + PH * 0.34, 0.01]);

  await until(S(17));
  await play(
    new M.FadeOut(new M.VGroup(...tailL95, ...tailR95, ...mid95, tagL95, tagR95, cutL95.group, cutR95.group, lbl95), { runTime: 0.5 }),
    new M.LaggedStart([...tailL90, ...tailR90, ...mid90].map(r => new M.FadeIn(r)), { lagRatio: 0.015, runTime: 1.2 }),
    new M.FadeIn(new M.VGroup(tagL90, tagR90, lbl90), { runTime: 0.7 }),
    ...say('NARROWER: MIDDLE 90% (5% EACH TAIL)', C.cyan)
  );

  // =====================================================================
  // BEAT 18: "It runs from about eleven to about forty two percent. Less certainty buys a shorter range."
  // =====================================================================
  const cutL90 = makeCut(L90, 5, 15, C.cyan, '11%', -0.64);
  const cutR90 = makeCut(R90, 5, 15, C.cyan, '42%', -0.64);
  const bar90 = makeBar(L90, R90, BAR2_Y, C.cyan, '90%: 11% to 42%');

  await until(S(18));
  await play(
    new M.FadeIn(new M.VGroup(cutL90.group, cutR90.group, bar90), { runTime: 0.8 }),
    ...say('LESS CERTAINTY → SHORTER RANGE', C.cyan),
    ...fbox([['95%:  9% to 46%', C.green], ['90%: 11% to 42%', C.cyan], ['shorter, less sure', C.muted]], C.cyan)
  );

  // =====================================================================
  // BEAT 19: "We can also ask one-sided questions, like: how likely is the rate below forty percent?"
  // =====================================================================
  const cut40 = makeCut(0.40, 5, 15, C.amber, '40%', -0.64);
  const belowLine = new M.Line({ start: [px(0.39), BASE + PH * 0.72, 0], end: [px(0.12), BASE + PH * 0.72, 0], color: C.amber, strokeWidth: 2.5 });
  const belowTip1 = new M.Line({ start: [px(0.12), BASE + PH * 0.72, 0], end: [px(0.155), BASE + PH * 0.72 + 0.10, 0], color: C.amber, strokeWidth: 2.5 });
  const belowTip2 = new M.Line({ start: [px(0.12), BASE + PH * 0.72, 0], end: [px(0.155), BASE + PH * 0.72 - 0.10, 0], color: C.amber, strokeWidth: 2.5 });
  const belowLbl = T('below 40%?', P ? 18 : 17, C.amber, true, true);
  belowLbl.moveTo([px(0.255), BASE + PH * 0.72 + 0.25, 0]);
  const belowArrow = new M.VGroup(belowLine, belowTip1, belowTip2, belowLbl);

  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(...tailL90, ...tailR90, ...mid90, tagL90, tagR90, lbl90, cutL90.group, cutR90.group, bar95, bar90), { runTime: 0.5 }),
    new M.FadeIn(cut40.group, { runTime: 0.7 }),
    new M.Flash(cut40.dot, { color: C.amber, runTime: 0.7 }),
    new M.FadeIn(belowArrow, { runTime: 0.7 }),
    ...say('ONE-SIDED: RATE BELOW 40%?', C.amber)
  );

  // =====================================================================
  // BEAT 20: "Shade everything left of forty. That area is about ninety three percent."
  // =====================================================================
  const left40 = makeSlices(5, 15, 0.01, 0.40, 42, C.green, 0.78);
  const lbl93 = T('93%', P ? 24 : 26, C.bg, true, true);
  lbl93.moveTo([px(0.23), BASE + PH * 0.34, 0.01]);

  await until(S(20));
  await play(
    new M.LaggedStart(left40.map(r => new M.FadeIn(r)), { lagRatio: 0.03, runTime: 1.4 }),
    new M.FadeIn(lbl93, { runTime: 0.7 }),
    ...say('AREA BELOW 40% ≈ 93%', C.green),
    ...fbox(['one-sided question', ['P(rate < 40%) ≈ 93%', C.green]], C.green)
  );

  // =====================================================================
  // BEAT 21: "Here is the short version, in words."
  // =====================================================================
  const tailL95b = makeSlices(5, 15, 0.01, L95, 12, C.pink, 0.78);
  const tailR95b = makeSlices(5, 15, R95, 0.72, 22, C.pink, 0.78);
  const mid95b = makeSlices(5, 15, L95, R95, 34, C.green, 0.54);

  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(...left40, lbl93, cut40.group, belowArrow), { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(...tailL95b, ...tailR95b, ...mid95b), { runTime: 0.7 }),
    ...say('THE SHORT VERSION, IN WORDS', C.cyan),
    ...fbox([['95% credible interval', C.cyan], ['two ends on the line', C.ink]], C.cyan)
  );

  // =====================================================================
  // BEAT 22: "A ninety five percent credible interval has two ends."
  // =====================================================================
  const cutL95b = makeCut(L95, 5, 15, C.amber, '9%', -0.64);
  const cutR95b = makeCut(R95, 5, 15, C.amber, '46%', -0.64);

  await until(S(22));
  await play(
    new M.FadeIn(new M.VGroup(cutL95b.group, cutR95b.group), { runTime: 0.7 }),
    new M.Flash(cutL95b.dot, { color: C.amber, runTime: 0.7 }),
    new M.Flash(cutR95b.dot, { color: C.amber, runTime: 0.7 }),
    ...say('TWO ENDS: 9% AND 46%', C.amber)
  );

  // =====================================================================
  // BEAT 23: "The left end has two and a half percent of the posterior area below it."
  // =====================================================================
  const tagL2 = makeCallout('2.5% below', [px(0.08), BASE + PH * 0.58, 0], [px(0.068), BASE + 0.18, 0], C.pink);
  await until(S(23));
  await play(
    new M.FadeIn(tagL2, { runTime: 0.7 }),
    new M.Indicate(cutL95b.group, { color: C.pink, runTime: 0.9 }),
    ...say('LEFT END: 2.5% AREA BELOW', C.pink),
    ...fbox([['left end (9%):', C.amber], ['  2.5% area below', C.pink]], C.pink)
  );

  // =====================================================================
  // BEAT 24: "The right end has two and a half percent of the posterior area above it."
  // =====================================================================
  const tagR2 = makeCallout('2.5% above', [px(0.60), BASE + PH * 0.44, 0], [px(0.51), BASE + 0.14, 0], C.pink);
  await until(S(24));
  await play(
    new M.FadeIn(tagR2, { runTime: 0.7 }),
    new M.Indicate(cutR95b.group, { color: C.pink, runTime: 0.9 }),
    ...say('RIGHT END: 2.5% AREA ABOVE', C.pink),
    ...fbox([['left  (9%):  2.5% below', C.pink], ['right (46%): 2.5% above', C.pink]], C.pink)
  );

  // =====================================================================
  // BEAT 25: "In everyday words: cut equal small tails off the posterior, and keep the middle. This equal-tails range is the most common choice."
  // =====================================================================
  const lbl95b = T('95%', P ? 24 : 26, C.green, true, true);
  lbl95b.moveTo([px(0.24), BASE + PH * 0.34, 0.01]);
  await until(S(25));
  await play(
    new M.FadeIn(lbl95b, { runTime: 0.7 }),
    new M.Indicate(lbl95b, { color: C.green, runTime: 0.9 }),
    ...say('CUT EQUAL TAILS, KEEP THE MIDDLE', C.green),
    ...fbox([['equal-tails interval', C.green], ['cut 2.5% left + 2.5% right', C.pink], ['keep middle 95% (9%–46%)', C.green]], C.green)
  );

  // =====================================================================
  // BEAT 26: "Why is the range so wide, from nine to forty six?"
  // =====================================================================
  const barPost = makeBar(L95, R95, BAR1_Y, C.green, '10 parts: 9% to 46%');
  await until(S(26));
  await play(
    new M.FadeOut(new M.VGroup(tagL2, tagR2, cutL95b.group, cutR95b.group, lbl95b), { runTime: 0.5 }),
    new M.FadeIn(barPost, { runTime: 0.8 }),
    new M.Indicate(barPost, { color: C.amber, runTime: 0.9 }),
    ...say('WHY SO WIDE? (9% TO 46%)', C.amber)
  );

  // =====================================================================
  // BEAT 27: "Because ten parts are few. More parts would make the hill narrower, and the interval shorter."
  // =====================================================================
  const moreCurve = makeCurve(9, 27, C.violet, 3.2, true);
  const barMore = makeBar(L_MORE, R_MORE, BAR2_Y, C.violet, 'more parts: 13%–40%');

  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(...tailL95b, ...tailR95b, ...mid95b), { runTime: 0.5 }),
    new M.Create(moreCurve, { runTime: 1.2 }),
    new M.FadeIn(barMore, { runTime: 0.8 }),
    ...say('MORE PARTS → NARROWER & SHORTER', C.violet),
    ...fbox([['10 parts:   9% to 46%', C.green], ['more parts: 13% to 40%', C.violet], ['more data shrinks width', C.muted]], C.violet)
  );

  // =====================================================================
  // BEAT 28: "Compare with the prior, before the batch. Its ninety five percent range ran from about three to forty eight percent."
  // =====================================================================
  const priorCurve = makeCurve(2, 8, C.cyan, 3.2, true);
  const barPrior = makeBar(L_PRIOR, R_PRIOR, BAR2_Y, C.cyan, 'prior: 3% to 48%');

  await until(S(28));
  await play(
    new M.FadeOut(new M.VGroup(moreCurve, barMore), { runTime: 0.5 }),
    new M.Create(priorCurve, { runTime: 1.2 }),
    new M.FadeIn(barPrior, { runTime: 0.8 }),
    ...say('PRIOR BETA(2, 8): 3% TO 48%', C.cyan),
    ...fbox([['prior Beta(2, 8):', C.cyan], ['  95%:  3% to 48%', C.cyan], ['posterior Beta(5, 15):', C.green], ['  95%:  9% to 46%', C.green]], C.cyan)
  );

  // =====================================================================
  // BEAT 29: "The batch has already tightened our belief."
  // =====================================================================
  await until(S(29));
  await play(
    new M.Indicate(barPost, { color: C.green, runTime: 0.9 }),
    ...say('THE BATCH TIGHTENED OUR BELIEF', C.green)
  );

  // =====================================================================
  // BEAT 30: "What is it for? It tells the owner both a likely range and how sure to be."
  // =====================================================================
  const mid95c = makeSlices(5, 15, L95, R95, 34, C.green, 0.48);
  await until(S(30));
  await play(
    new M.FadeOut(new M.VGroup(priorCurve, barPrior), { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(...mid95c), { runTime: 0.7 }),
    ...say('WHAT IS IT FOR? RANGE + CERTAINTY', C.amber),
    ...fbox(['for decisions:', ['likely range: 9%–46%', C.green], ['how sure:     95%', C.amber]], C.amber)
  );

  // =====================================================================
  // BEAT 31: "For example: if a customer contract needs a rate below fifty percent, the owner is already quite safe."
  // =====================================================================
  const th50 = makeThreshold(0.50, C.green, '50% limit', 'SAFE ✓', 1);
  await until(S(31));
  await play(
    new M.FadeIn(th50.group, { runTime: 0.8 }),
    new M.Flash(th50.dot, { color: C.green, runTime: 0.7 }),
    ...say('CONTRACT < 50%: QUITE SAFE ✓', C.green),
    ...fbox(['contract: rate < 50%', ['95% range: 9%–46% < 50%', C.green], ['already quite safe', C.green]], C.green)
  );

  // =====================================================================
  // BEAT 32: "But if it needs a rate below twenty percent, the owner cannot promise that yet."
  // =====================================================================
  const th20 = makeThreshold(0.20, C.pink, '20% limit', 'TOO HIGH!', 1);
  await until(S(32));
  await play(
    new M.FadeOut(th50.group, { runTime: 0.5 }),
    new M.FadeIn(th20.group, { runTime: 0.8 }),
    new M.Flash(th20.dot, { color: C.pink, runTime: 0.7 }),
    ...say('CONTRACT < 20%: CANNOT PROMISE YET', C.pink),
    ...fbox(['contract: rate < 20%', ['95% range: 9%–46%', C.amber], ['much lies above 20%', C.pink]], C.pink)
  );

  // =====================================================================
  // BEAT 33: "You may remember confidence intervals from chapter six point two. They look alike, but they say different things."
  // =====================================================================
  const pW = PW, pH1 = P ? 3.0 : 1.75, pH2 = P ? 3.4 : 1.75;
  const topY = P ? -0.05 : 0.35, botY = P ? -3.55 : -1.85;
  const ciPanel = new M.RoundedRectangle({ width: pW, height: pH1, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2 });
  ciPanel.setFill(C.card, 0.85); ciPanel.moveTo([CX, topY, 0]);
  const ciTitle = T('CONFIDENCE INTERVAL (6.2)', P ? 15 : 16, C.cyan, true, true);
  ciTitle.moveTo([CX - pW / 2 + ciTitle.getWidth() / 2 + 0.25, topY + pH1 / 2 - 0.28, 0]);

  const crPanel = new M.RoundedRectangle({ width: pW, height: pH2, cornerRadius: 0.16, color: C.green, strokeWidth: 2 });
  crPanel.setFill(C.card, 0.85); crPanel.moveTo([CX, botY, 0]);
  const crTitle = T('CREDIBLE INTERVAL (6.3)', P ? 15 : 16, C.green, true, true);
  crTitle.moveTo([CX - pW / 2 + crTitle.getWidth() / 2 + 0.25, botY + pH2 / 2 - 0.28, 0]);

  const compareFrames = new M.VGroup(ciPanel, ciTitle, crPanel, crTitle);
  // "they look alike": each panel shows one range bar from the start
  const mkLook = (y, col, txt) => {
    const xL = CX - pW * 0.22, xR = CX + pW * 0.22;
    const l = new M.Line({ start: [xL, y, 0], end: [xR, y, 0], color: col, strokeWidth: 5 });
    const d1 = new M.Dot({ point: [xL, y, 0.01], radius: 0.07, color: col }); d1.setFill(col, 1);
    const d2 = new M.Dot({ point: [xR, y, 0.01], radius: 0.07, color: col }); d2.setFill(col, 1);
    const t = T(txt, P ? 17 : 16, col, true, true); t.moveTo([CX - pW * 0.25, y - 0.36, 0]);
    return new M.VGroup(l, d1, d2, t);
  };
  const lookCI = mkLook(topY - 0.05, C.cyan, 'a range: 95% ...');
  const lookCR = mkLook(botY - 0.05, C.green, 'a range: 95% ...');

  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(axis, postCurve, ...baseGhost, ...mid95c, barPost, th20.group), { runTime: 0.6 }),
    new M.FadeIn(compareFrames, { runTime: 0.9 }),
    new M.FadeIn(lookCI, { runTime: 0.9 }),
    new M.FadeIn(lookCR, { runTime: 0.9 }),
    ...say('CONFIDENCE (6.2) VS CREDIBLE (6.3)', C.amber),
    ...fbox([['confidence (6.2)', C.cyan], ['  look alike,', C.muted], ['credible (6.3)', C.green], ['  mean different things', C.amber]], C.amber)
  );

  // =====================================================================
  // BEAT 34: "A confidence interval is a promise about the method."
  // =====================================================================
  const trueX = CX + 0.2;
  const trueLine = new M.DashedLine({ start: [trueX, topY - pH1 / 2 + 0.20, 0], end: [trueX, topY + pH1 / 2 - 0.45, 0], color: C.amber });
  const trueLbl = T('true rate', P ? 16 : 15, C.amber, true, true);
  trueLbl.moveTo([trueX + 0.92, topY + pH1 / 2 - 0.30, 0]);
  const trueMark = new M.VGroup(trueLine, trueLbl);

  await until(S(34));
  await play(
    new M.FadeIn(trueMark, { runTime: 0.7 }),
    ...say('CONFIDENCE = PROMISE ABOUT THE METHOD', C.cyan)
  );

  // =====================================================================
  // BEAT 35: "Over many repeated samples, ninety five percent of such ranges would catch the true value."
  // =====================================================================
  const sampleSpecs = [
    [-1.1, 1.0, true], [-0.5, 1.4, true], [-1.5, 0.5, true], [0.45, 2.2, false],
    [-0.8, 1.2, true], [-1.2, 0.8, true], [-0.3, 1.6, true]
  ];
  const sampleBars = sampleSpecs.map(([dxL, dxR, hit], idx) => {
    const sy = topY + pH1 / 2 - 0.62 - idx * ((pH1 - 0.82) / (sampleSpecs.length - 1));
    const col = hit ? C.cyan : C.pink;
    const xL = trueX + dxL * (P ? 0.95 : 1.05), xR = trueX + dxR * (P ? 0.95 : 1.05);
    const l = new M.Line({ start: [xL, sy, 0], end: [xR, sy, 0], color: col, strokeWidth: 3 });
    const d1 = new M.Dot({ point: [xL, sy, 0.01], radius: 0.045, color: col }); d1.setFill(col, 1);
    const d2 = new M.Dot({ point: [xR, sy, 0.01], radius: 0.045, color: col }); d2.setFill(col, 1);
    return new M.VGroup(l, d1, d2);
  });
  const missLbl = T('miss', P ? 16 : 14, C.pink, true, true);
  missLbl.moveTo([trueX + 2.2 * (P ? 0.95 : 1.05) + 0.42, topY + pH1 / 2 - 0.62 - 3 * ((pH1 - 0.82) / 6), 0]);

  await until(S(35));
  await play(
    new M.FadeOut(lookCI, { runTime: 0.4 }),
    new M.LaggedStart(sampleBars.map(b => new M.FadeIn(b)), { lagRatio: 0.14, runTime: 1.6 }),
    new M.FadeIn(missLbl, { runTime: 0.6 }),
    ...say('REPEATED SAMPLES: 95% CATCH TRUE VALUE', C.cyan),
    ...fbox([['confidence interval:', C.cyan], ['many repeated samples', C.ink], ['95% catch true value', C.cyan]], C.cyan)
  );

  // =====================================================================
  // BEAT 36: "A credible interval is about this rate, right now: ninety five percent of our belief lies inside it."
  // =====================================================================
  const miniX0 = CX - pW / 2 + 0.45, miniW = pW - 0.9, miniBase = botY - pH2 / 2 + 0.42;
  const miniScale = (pH2 - 0.95) / 4.4;
  const miniAxis = new M.Line({ start: [miniX0, miniBase, 0], end: [miniX0 + miniW, miniBase, 0], color: C.muted, strokeWidth: 2 });
  const miniCurve = makeCurve(5, 15, C.green, 2.8, false, miniScale, miniBase, miniX0, miniW);
  const miniMid = makeSlices(5, 15, L95, R95, 28, C.green, 0.55, false, miniScale, miniBase, miniX0, miniW);
  const miniLbl = T('95% of our belief right now', P ? 15 : 16, C.green, true, true);
  miniLbl.moveTo([CX + pW * 0.25, miniBase + (pH2 - 0.95) * 0.55, 0.01]);
  const miniRng = T('9% to 46%', P ? 15 : 16, C.amber, true, true);
  miniRng.moveTo([miniX0 + 0.27 * miniW, miniBase - 0.24, 0]);
  const miniCred = new M.VGroup(miniAxis, ...miniMid, miniCurve, miniLbl, miniRng);

  await until(S(36));
  await play(
    new M.FadeOut(lookCR, { runTime: 0.5 }),
    new M.FadeIn(miniCred, { runTime: 1.0 }),
    new M.Indicate(miniLbl, { color: C.green, runTime: 0.9 }),
    ...say('CREDIBLE = 95% OF BELIEF RIGHT NOW', C.green),
    ...fbox([['credible interval:', C.green], ['about THIS rate now', C.ink], ['95% of belief inside', C.green]], C.green)
  );

  // =====================================================================
  // BEAT 37: "Here is a common trap. A credible interval is only as good as the prior and the model behind it."
  // =====================================================================
  axis = makeAxis();
  postCurve = makeCurve(5, 15, C.green, 3.5, true);
  baseGhost = makeSlices(5, 15, 0.01, 0.72, 48, C.green, 0.12);
  const barShop2 = makeBar(L95, R95, BAR1_Y, C.green, 'shop prior: 9%–46%');

  await until(S(37));
  await play(
    new M.FadeOut(new M.VGroup(compareFrames, trueMark, ...sampleBars, missLbl, miniCred), { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(axis, ...baseGhost, postCurve, barShop2), { runTime: 0.9 }),
    ...say('TRAP 1: DEPENDS ON PRIOR & MODEL', C.pink),
    ...fbox([['trap 1:', C.pink], ['only as good as the', C.ink], ['prior and the model', C.amber]], C.pink)
  );

  // =====================================================================
  // BEAT 38: "Change the prior, and the interval moves. We will test that in lesson six."
  // =====================================================================
  const flatCurve = makeCurve(4, 8, C.amber, 3.2, true);
  const barFlat = makeBar(L_FLAT, R_FLAT, BAR2_Y, C.amber, 'flat prior: 11%–61%');

  await until(S(38));
  await play(
    new M.Create(flatCurve, { runTime: 1.2 }),
    new M.FadeIn(barFlat, { runTime: 0.8 }),
    ...say('CHANGE PRIOR → INTERVAL MOVES', C.amber),
    ...fbox([['shop prior: 9% to 46%', C.green], ['flat prior: 11% to 61%', C.amber], ['tested in lesson 6.3.6', C.muted]], C.amber)
  );

  // =====================================================================
  // BEAT 39: "Another trap: the interval is about the rate, not about single parts."
  // =====================================================================
  const barRateOnly = makeBar(L95, R95, BAR1_Y, C.green, 'rate: 9% to 46%');
  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(flatCurve, barFlat, barShop2), { runTime: 0.5 }),
    new M.FadeIn(barRateOnly, { runTime: 0.7 }),
    ...say('TRAP 2: ABOUT THE RATE, NOT SINGLE PARTS', C.pink),
    ...fbox([['trap 2:', C.pink], ['about long-run rate', C.green], ['NOT single batches', C.pink]], C.pink)
  );

  // =====================================================================
  // BEAT 40: "It does not say that between nine and forty six percent of tomorrow's parts will fail. Single batches can vary more."
  // =====================================================================
  const tomorrowSpecs = [
    { fails: 0, label: '0/10 (0%)', out: true },
    { fails: 3, label: '3/10 (30%)', out: false },
    { fails: 6, label: '6/10 (60%)', out: true }
  ];
  const batchGroups = tomorrowSpecs.map((sp, idx) => {
    const items = [];
    if (P) {
      const y = -3.72 - idx * 0.58;
      for (let k = 0; k < 10; k++) {
        const col = k < sp.fails ? C.pink : C.green;
        const d = new M.Dot({ point: [X0 + 0.30 + k * 0.34, y, 0], radius: 0.09, color: col });
        d.setFill(col, 0.9);
        items.push(d);
      }
      const txt = T(sp.out ? `${sp.label} outside!` : sp.label, 15, sp.out ? C.pink : C.green, true, true);
      txt.moveTo([X0 + 3.85 + txt.getWidth() / 2, y, 0]);
      items.push(txt);
    } else {
      const cxB = CX + (idx - 1) * 2.45, yB = -2.62;
      for (let k = 0; k < 10; k++) {
        const col = k < sp.fails ? C.pink : C.green;
        const r = Math.floor(k / 5), c = k % 5;
        const d = new M.Dot({ point: [cxB - 0.44 + c * 0.22, yB + 0.10 - r * 0.22, 0], radius: 0.065, color: col });
        d.setFill(col, 0.9);
        items.push(d);
      }
      const txt = T(sp.out ? `${sp.label}!` : sp.label, 15, sp.out ? C.pink : C.green, true, true);
      txt.moveTo([cxB, yB - 0.34, 0]);
      items.push(txt);
    }
    return new M.VGroup(...items);
  });

  await until(S(40));
  await play(
    new M.LaggedStart(batchGroups.map(g => new M.FadeIn(g)), { lagRatio: 0.25, runTime: 1.5 }),
    ...say('SINGLE BATCHES CAN VARY MORE', C.pink)
  );

  // =====================================================================
  // BEAT 41: "In one sentence: a credible interval keeps the middle share of the posterior, and says where the unknown value probably lies."
  // =====================================================================
  const tailLf = makeSlices(5, 15, 0.01, L95, 12, C.pink, 0.72);
  const tailRf = makeSlices(5, 15, R95, 0.72, 20, C.pink, 0.72);
  const mid95f = makeSlices(5, 15, L95, R95, 34, C.green, 0.56);
  const lbl95f = T('95%', P ? 24 : 26, C.green, true, true);
  lbl95f.moveTo([px(0.24), BASE + PH * 0.34, 0.01]);

  await until(S(41));
  await play(
    new M.FadeOut(new M.VGroup(...batchGroups), { runTime: 0.5 }),
    new M.FadeIn(new M.VGroup(...tailLf, ...tailRf, ...mid95f, lbl95f), { runTime: 1.0 }),
    new M.Indicate(lbl95f, { color: C.green, runTime: 1.0 }),
    ...say('MIDDLE SHARE OF POSTERIOR = WHERE RATE LIES', C.green),
    ...fbox([['95% credible interval', C.green], ['middle 95% of posterior', C.ink], ['9% to 46% failure rate', C.amber]], C.green)
  );
}
