// 5.1.6 Poisson counts (live version in manim-web).
// Beat i = sentence i (0-based, 0..41). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const URG = '#fb6f4a';

  // Layout constants: laptop (14.22 x 8, safe y: -3.0..2.3), phone (8 x 14.22, safe y: -5.5..4.3)
  const CX = P ? 0 : -2.25;
  const PILL = P ? [0, 1.65, 0] : [0, 1.92, 0];
  const BOXP = P ? [0, 3.25, 0] : [4.45, -0.45, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  // Formula box helper: one box on screen at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.40 : 0.40;
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
    const maxw = P ? FW - 0.8 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.55 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.45 }));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const out = new M.FadeOut(boxNow, { runTime: 0.45 });
    boxNow = null;
    return [out];
  }

  // Small drawing helpers (every part placed with moveTo before grouping)
  function card(x, y, w, h, color, fillOp = 0.92, sw = 2) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: sw });
    r.setFill(C.card, fillOp); r.moveTo([x, y, 0]);
    return r;
  }
  function ticketCard(x, y, color = URG, w = 0.44, h = 0.30) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.07, color, strokeWidth: 1.8 });
    r.setFill(color, 0.32); r.moveTo([x, y, 0]);
    const bar = new M.Line({ start: [x - w * 0.28, y, 0], end: [x + w * 0.28, y, 0], color, strokeWidth: 2 });
    return new M.VGroup(r, bar);
  }
  function dotAt(p, color = URG, r = 0.10) {
    const halo = new M.Dot({ point: p, radius: r * 2.2, color }); halo.setFill(color, 0.22);
    const d = new M.Dot({ point: p, radius: r, color });
    return { g: new M.VGroup(halo, d), d };
  }
  function bracket(x1, x2, y, tick, color, label, labelDy) {
    const parts = [
      new M.Line({ start: [x1, y, 0], end: [x2, y, 0], color, strokeWidth: 3 }),
      new M.Line({ start: [x1, y - tick, 0], end: [x1, y + tick, 0], color, strokeWidth: 3 }),
      new M.Line({ start: [x2, y - tick, 0], end: [x2, y + tick, 0], color, strokeWidth: 3 }),
    ];
    if (label) {
      const t = T(label, P ? 17 : 18, color, true, true);
      t.moveTo([(x1 + x2) / 2, y + labelDy, 0]);
      parts.push(t);
    }
    return new M.VGroup(...parts);
  }

  // =========================================================================
  // ACT 1: COUNT BY THE HOUR & THE HOUR STRIP (Sentences 0 - 6)
  // =========================================================================

  // 0: Four hour boxes
  const hCounts = [2, 1, 3, 2];
  const hPos = P
    ? [[-1.75, -0.35], [1.75, -0.35], [-1.75, -3.05], [1.75, -3.05]]
    : [[-4.5, -0.3], [-1.5, -0.3], [1.5, -0.3], [4.5, -0.3]];
  const hW = P ? 3.05 : 2.55, hH = P ? 2.0 : 2.15;
  const hourBoxes = hPos.map(([x, y], i) => {
    const r = card(x, y, hW, hH, C.cyan, 0.9, 2);
    const lbl = T(`Hour ${i + 1}`, P ? 18 : 19, C.muted, true);
    lbl.moveTo([x, y + hH / 2 - 0.30, 0]);
    return new M.VGroup(r, lbl);
  });
  await until(S(0));
  await play(
    new M.LaggedStart(hourBoxes.map(b => new M.FadeIn(b)), { lagRatio: 0.14, runTime: 1.3 }),
    ...say('COUNT BY THE HOUR', C.cyan)
  );

  // 1: Urgent tickets inside each hour (2, 1, 3, 2 -> average 2 per hour)
  const hourTickets = [];
  const hourCountLabels = [];
  hPos.forEach(([x, y], i) => {
    const n = hCounts[i];
    for (let j = 0; j < n; j++) {
      const dx = (j - (n - 1) / 2) * 0.62;
      hourTickets.push(ticketCard(x + dx, y - 0.18, URG, 0.48, 0.34));
    }
    const ct = T(`${n} urgent`, P ? 16 : 17, URG, true, true);
    ct.moveTo([x, y - hH / 2 - 0.28, 0]);
    hourCountLabels.push(ct);
  });
  const avgNote = T('average across many weeks: 2 urgent per hour', P ? 16 : 20, C.amber, false, true);
  avgNote.moveTo([0, P ? -4.85 : -2.25, 0]);
  await until(S(1));
  await play(
    new M.LaggedStart(hourTickets.map(t => new M.FadeIn(t)), { lagRatio: 0.12, runTime: 1.4 }),
    new M.FadeIn(new M.VGroup(...hourCountLabels, avgNote), { runTime: 0.7 }),
    ...say('AVERAGE: 2 URGENT PER HOUR', URG)
  );

  // 2: Random moments, independent
  const flashOrder = [2, 5, 0, 7, 3, 1, 6, 4];
  await until(S(2));
  await play(
    new M.LaggedStart(flashOrder.map(i => new M.Flash(hourTickets[i], { color: URG })), { lagRatio: 0.14, runTime: 1.6 }),
    ...say('RANDOM MOMENTS · INDEPENDENT', C.cyan)
  );

  // 3: Manager's question — quiet hour (0 urgent)
  const qW = P ? 5.6 : 5.4, qH = P ? 2.8 : 2.45, qY = P ? -1.4 : -0.45;
  const qBox = card(0, qY, qW, qH, C.amber, 0.94, 2.5);
  const qTitle = T('1 QUIET HOUR', P ? 19 : 20, C.amber, true, true); qTitle.moveTo([0, qY + qH / 2 - 0.38, 0]);
  const qMark = T('?', P ? 54 : 52, C.amber, true, true); qMark.moveTo([0, qY - 0.05, 0]);
  const qSub = T('0 urgent tickets', P ? 19 : 20, C.muted, false); qSub.moveTo([0, qY - qH / 2 + 0.40, 0]);
  const quietGroup = new M.VGroup(qBox, qTitle, qMark, qSub);
  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(...hourBoxes, ...hourTickets, ...hourCountLabels, avgNote), { runTime: 0.55 }),
    new M.FadeIn(quietGroup, { runTime: 0.75 }),
    ...say('CHANCE OF A QUIET HOUR (0)?', C.amber)
  );

  // 4: One hour as a long strip + 2 urgent dots
  const SW = P ? 6.4 : 7.4, SH = P ? 0.54 : 0.46;
  const sx0 = CX - SW / 2, sx1 = CX + SW / 2;
  const MAIN_Y = P ? 0.30 : 0.65;
  const stripRect = new M.RoundedRectangle({ width: SW, height: SH, cornerRadius: 0.10, color: C.cyan, strokeWidth: 2.2 });
  stripRect.setFill(C.card, 0.95); stripRect.moveTo([CX, MAIN_Y, 0]);
  const t0 = T('0 min', P ? 15 : 16, C.muted, true); t0.moveTo([sx0 + 0.35, MAIN_Y - SH / 2 - 0.24, 0]);
  const t60 = T('60 min', P ? 15 : 16, C.muted, true); t60.moveTo([sx1 - 0.42, MAIN_Y - SH / 2 - 0.24, 0]);
  const tHr = T('1 hour', P ? 17 : 18, C.cyan, true, true); tHr.moveTo([CX, MAIN_Y + SH / 2 + 0.26, 0]);
  const stripGroup = new M.VGroup(stripRect, t0, t60, tHr);

  const dA = dotAt([sx0 + SW * 0.24, MAIN_Y, 0], URG, 0.11);
  const dB = dotAt([sx0 + SW * 0.76, MAIN_Y, 0], URG, 0.11);
  const initDots = [dA.g, dB.g];
  await until(S(4));
  await play(
    new M.FadeOut(quietGroup, { runTime: 0.45 }),
    new M.FadeIn(stripGroup, { runTime: 0.7 }),
    ...say('ONE HOUR = A LONG STRIP', C.cyan)
  );
  await play(
    new M.FadeIn(dA.g, { runTime: 0.4 }), new M.Flash(dA.d, { color: URG, runTime: 0.6 }),
    new M.FadeIn(dB.g, { runTime: 0.4 }), new M.Flash(dB.d, { color: URG, runTime: 0.6 })
  );

  // 5: Sample hours with 0, 1, 2, 3 dots
  const sampleSpecs = [
    { label: '0', fracs: [] },
    { label: '1', fracs: [0.58] },
    { label: '2', fracs: [0.19, 0.71] },
    { label: '3', fracs: [0.14, 0.46, 0.85] },
  ];
  const sampleW = SW - 0.75, sampleX0 = sx0 + 0.75;
  const sampleYs = P ? [-1.10, -2.05, -3.00, -3.95] : [-0.45, -1.12, -1.79, -2.46];
  const sampleH = P ? 0.36 : 0.28;
  const sampleStrips = sampleSpecs.map((sp, i) => {
    const y = sampleYs[i];
    const parts = [];
    const lb = T(sp.label, P ? 18 : 18, sp.fracs.length ? URG : C.green, true, true);
    lb.moveTo([sx0 + 0.25, y, 0]); parts.push(lb);
    const bar = new M.RoundedRectangle({ width: sampleW, height: sampleH, cornerRadius: 0.08, color: sp.fracs.length ? C.line : C.green, strokeWidth: 1.6 });
    bar.setFill(C.card, 0.9); bar.moveTo([sampleX0 + sampleW / 2, y, 0]); parts.push(bar);
    for (const f of sp.fracs) parts.push(dotAt([sampleX0 + sampleW * f, y, 0], URG, 0.085).g);
    return new M.VGroup(...parts);
  });
  await until(S(5));
  await play(
    new M.LaggedStart(sampleStrips.map(st => new M.FadeIn(st)), { lagRatio: 0.22, runTime: 1.9 }),
    ...say('0, 1, 2, 3, OR MORE DOTS', URG)
  );

  // 6: No fixed number of trials — any moment
  const anyMarks = [0.17, 0.49, 0.83].map(f => {
    const x = sx0 + SW * f;
    const dl = new M.DashedLine({ start: [x, MAIN_Y - SH / 2 - 0.45, 0], end: [x, MAIN_Y + SH / 2 + 0.15, 0], color: C.amber });
    const dt = new M.Dot({ point: [x, MAIN_Y, 0], radius: 0.08, color: C.amber });
    return new M.VGroup(dl, dt);
  });
  const anyTxt = T('a ticket can arrive at any instant', P ? 18 : 19, C.amber);
  anyTxt.moveTo([CX, MAIN_Y - (P ? 1.45 : 1.15), 0]);
  await until(S(6));
  await play(
    new M.FadeOut(new M.VGroup(...sampleStrips, ...initDots), { runTime: 0.5 }),
    new M.LaggedStart(anyMarks.map(m => new M.FadeIn(m)), { lagRatio: 0.2, runTime: 1.1 }),
    new M.FadeIn(anyTxt, { runTime: 0.6 }),
    ...say('NO FIXED NUMBER OF TRIALS', C.amber)
  );

  // =========================================================================
  // ACT 2: CUT INTO 60 MINUTES -> BINOMIAL -> LIMIT -> POISSON (Sentences 7 - 16)
  // =========================================================================

  // 7: Cut the hour into 60 minute slots
  const sliceLines60 = [];
  for (let i = 1; i < 60; i++) {
    const x = sx0 + (i / 60) * SW;
    const l = new M.Line({ start: [x, MAIN_Y - SH / 2 + 0.02, 0], end: [x, MAIN_Y + SH / 2 - 0.02, 0], color: C.cyan, strokeWidth: 1.1 });
    l.setStrokeOpacity(0.55);
    sliceLines60.push(l);
  }
  const sliceNote60 = T('60 minute-slots (60 small trials)', P ? 17 : 18, C.cyan, true);
  sliceNote60.moveTo([CX, MAIN_Y - SH / 2 - 0.62, 0]);
  await until(S(7));
  await play(
    new M.FadeOut(new M.VGroup(...anyMarks, anyTxt), { runTime: 0.4 }),
    new M.LaggedStart(sliceLines60.map(l => new M.Create(l)), { lagRatio: 0.02, runTime: 1.6 }),
    new M.FadeIn(sliceNote60, { runTime: 0.6 }),
    ...say('CUT INTO 60 MINUTES', C.cyan)
  );

  // 8: Zoomed 1-minute slot: p = 2/60 = 1/30
  const slotX = sx0 + (20.5 / 60) * SW;
  const slotHi = new M.Rectangle({ width: SW / 60 * 1.4, height: SH - 0.04, color: C.amber, strokeWidth: 2 });
  slotHi.setFill(C.amber, 0.35); slotHi.moveTo([slotX, MAIN_Y, 0]);
  const zY = P ? -2.25 : -1.50, zW = P ? 5.8 : 5.4, zH = P ? 1.85 : 1.55;
  const zCard = card(CX, zY, zW, zH, C.amber, 0.94, 2);
  const gL = new M.Line({ start: [slotX - SW / 120, MAIN_Y - SH / 2, 0], end: [CX - zW / 2 + 0.15, zY + zH / 2, 0], color: C.amber, strokeWidth: 1.4 });
  const gR = new M.Line({ start: [slotX + SW / 120, MAIN_Y - SH / 2, 0], end: [CX + zW / 2 - 0.15, zY + zH / 2, 0], color: C.amber, strokeWidth: 1.4 });
  const zTitle = T('ONE MINUTE SLOT', P ? 17 : 18, C.amber, true, true); zTitle.moveTo([CX, zY + zH / 2 - 0.36, 0]);
  const zoomFrame = new M.VGroup(slotHi, gL, gR, zCard, zTitle);
  const zoomLine1 = T('urgent chance = 2 ÷ 60 = 1/30', P ? 18 : 19, C.cyan, true);
  zoomLine1.moveTo([CX, zY - 0.22, 0]);
  await until(S(8));
  await play(
    new M.FadeIn(zoomFrame, { runTime: 0.7 }),
    new M.FadeIn(zoomLine1, { runTime: 0.7 }),
    ...fbox(['2 per hr ÷ 60 min', ['p = 1/30 per min', C.cyan]], C.cyan),
    ...say('CHANCE PER MINUTE = 1 / 30', C.cyan)
  );

  // 9: Now it is a binomial: 60 trials, p = 1/30
  await until(S(9));
  await play(
    new M.Indicate(stripRect, { color: C.amber, runTime: 1.1 }),
    ...fbox(['Binomial model', 'trials n = 60', ['chance p = 1/30', C.amber]], C.amber),
    ...say('BINOMIAL: 60 TRIALS, p = 1/30', C.amber)
  );

  // 10: No urgent ticket: (29/30)^60
  const zoomLine2 = T('quiet minute = 29/30  (× 60 times)', P ? 18 : 19, C.green, true);
  zoomLine2.moveTo([CX, zY - 0.22, 0]);
  stripRect.setFill(C.green, 0.16);
  await until(S(10));
  await play(
    new M.FadeOut(zoomLine1, { runTime: 0.35 }),
    new M.FadeIn(zoomLine2, { runTime: 0.55 }),
    ...fbox(['1 quiet min: 29/30', 'all 60 quiet:', ['(29/30)^60', C.amber]], C.amber),
    ...say('ALL 60 QUIET: (29/30)^60', C.amber)
  );

  // 11: About 13 in 100 — Row 1 of convergence table
  const cW = P ? 6.4 : 7.2, cH = P ? 0.74 : 0.58;
  const cYs = P ? [-1.35, -2.30, -3.25] : [-0.62, -1.36, -2.10];
  function convRow(y, leftTxt, midTxt, rightTxt, col) {
    const r = card(CX, y, cW, cH, col, 0.9, 1.8);
    const l = T(leftTxt, P ? 16 : 17, C.ink, true); l.moveTo([CX - cW * 0.28, y, 0]);
    const m = T(midTxt, P ? 15 : 16, C.muted, true); m.moveTo([CX + cW * 0.05, y, 0]);
    const v = T(rightTxt, P ? 18 : 19, col, true, true); v.moveTo([CX + cW * 0.34, y, 0]);
    return new M.VGroup(r, l, m, v);
  }
  const conv1 = convRow(cYs[0], '60 min', '(29/30)^60', '13.1%', C.cyan);
  await until(S(11));
  await play(
    new M.FadeOut(new M.VGroup(zoomFrame, zoomLine2), { runTime: 0.4 }),
    new M.FadeIn(conv1, { runTime: 0.65 }),
    ...fbox(['(29/30)^60 ≈ 0.1308', ['≈ 13 in 100', C.amber]], C.amber),
    ...say('ABOUT 13 IN 100', C.amber)
  );

  // 12: Cut into seconds, then smaller and smaller pieces
  const fineLines = [];
  for (let i = 0; i < 60; i++) {
    const x = sx0 + ((i + 0.5) / 60) * SW;
    const l = new M.Line({ start: [x, MAIN_Y - SH / 2 + 0.03, 0], end: [x, MAIN_Y + SH / 2 - 0.03, 0], color: C.green, strokeWidth: 0.9 });
    l.setStrokeOpacity(0.45);
    fineLines.push(l);
  }
  const conv2 = convRow(cYs[1], '3,600 sec', 'p = 1/1800', '13.53%', C.green);
  const conv3 = convRow(cYs[2], 'tiny slices', 'p → 0', '13.53%', C.green);
  await until(S(12));
  await play(
    new M.LaggedStart(fineLines.map(l => new M.FadeIn(l)), { lagRatio: 0.015, runTime: 0.9 }),
    new M.LaggedStart([new M.FadeIn(conv2), new M.FadeIn(conv3)], { lagRatio: 0.45, runTime: 1.5 }),
    ...fbox(['60 min    → 0.1308', '3,600 sec → 0.1353', ['tiny      → 0.1353', C.green]], C.green),
    ...say('SMALLER AND SMALLER PIECES', C.cyan)
  );

  // 13: Settles at a fixed number
  const settleBox = new M.RoundedRectangle({
    width: cW * 0.30, height: (cYs[1] - cYs[2]) + cH + 0.14,
    cornerRadius: 0.14, color: C.amber, strokeWidth: 3
  });
  settleBox.moveTo([CX + cW * 0.34, (cYs[1] + cYs[2]) / 2, 0]);
  await until(S(13));
  await play(
    new M.Create(settleBox, { runTime: 0.8 }),
    ...say('IT SETTLES AT ONE FIXED NUMBER', C.green)
  );

  // 14: About 13.5 in a hundred
  await until(S(14));
  await play(
    new M.Indicate(settleBox, { color: C.amber, runTime: 0.9 }),
    ...fbox(['Quiet hour (0):', ['P(0) ≈ 0.1353', C.amber], ['≈ 13.5 in 100', C.amber]], C.amber),
    ...say('ABOUT 13.5 IN 100', C.amber)
  );

  // 15: Named the Poisson distribution
  const pCardY = P ? -0.9 : -0.15;
  const pCard = card(CX, pCardY, P ? 6.4 : 7.0, P ? 2.4 : 2.1, C.green, 0.94, 2.4);
  const pName = T('POISSON DISTRIBUTION', P ? 28 : 30, C.green, true, true); pName.moveTo([CX, pCardY + 0.32, 0]);
  const pDesc = T('random arrivals in a fixed stretch of time', P ? 16 : 18, C.ink); pDesc.moveTo([CX, pCardY - 0.38, 0]);
  const poissonCard = new M.VGroup(pCard, pName, pDesc);
  await until(S(15));
  await play(
    new M.FadeOut(new M.VGroup(stripGroup, sliceNote60, ...sliceLines60, ...fineLines, conv1, conv2, conv3, settleBox), { runTime: 0.55 }),
    new M.FadeIn(poissonCard, { runTime: 0.8 }),
    ...say('THE POISSON DISTRIBUTION', C.green)
  );

  // 16: Needs only one number: mean = 2
  const rateBadge = pill('MEAN RATE = 2 PER HOUR', C.amber, P ? 18 : 20);
  rateBadge.moveTo([CX, pCardY - (P ? 2.15 : 1.75), 0]);
  await until(S(16));
  await play(
    new M.FadeIn(rateBadge, { runTime: 0.7 }),
    ...fbox(['Only 1 input needed:', ['mean = 2 per hour', C.amber]], C.amber),
    ...say('ONE NUMBER: THE MEAN RATE (2)', C.amber)
  );

  // =========================================================================
  // ACT 3: POISSON BARS, MEAN = VARIANCE & WHY (Sentences 17 - 25)
  // =========================================================================

  // 17: Bar chart axes for 1 hour (0, 1, 2, 3, 4, 5+)
  const PROBS = [0.1353, 0.2707, 0.2707, 0.1804, 0.0902, 0.0527];
  const PCTS = ['14%', '27%', '27%', '18%', '9%', '5%'];
  const KLABS = ['0', '1', '2', '3', '4', '5+'];
  const BSP = P ? 1.08 : 1.20, BW = P ? 0.72 : 0.78;
  const BAR_Y = P ? -3.65 : -2.00, BAR_H = P ? 3.35 : 2.15;
  const HSCALE = BAR_H / 0.2707;
  const barX = k => CX + (k - 2.5) * BSP;

  const baseAxis = new M.Line({ start: [barX(0) - BSP * 0.55, BAR_Y, 0], end: [barX(5) + BSP * 0.55, BAR_Y, 0], color: C.muted, strokeWidth: 2.5 });
  const xLabs = KLABS.map((s, k) => { const t = T(s, P ? 18 : 19, C.ink, true, true); t.moveTo([barX(k), BAR_Y - 0.42, 0]); return t; });
  const xTitle = T('urgent tickets in 1 hour', P ? 16 : 17, C.muted); xTitle.moveTo([CX, BAR_Y - 0.84, 0]);
  const axisGroup = new M.VGroup(baseAxis, ...xLabs, xTitle);

  const bars = PROBS.map((pr, k) => {
    const h = pr * HSCALE;
    const col = k === 0 ? C.amber : C.cyan;
    const rect = new M.Rectangle({ width: BW, height: h, color: col, strokeWidth: 2 });
    rect.setFill(col, 0.72); rect.moveTo([barX(k), BAR_Y + h / 2, 0]);
    const pct = T(PCTS[k], P ? 16 : 17, col, true, true);
    pct.moveTo([barX(k), BAR_Y + h + 0.28, 0]);
    return new M.VGroup(rect, pct);
  });

  await until(S(17));
  await play(
    new M.FadeOut(new M.VGroup(poissonCard, rateBadge), { runTime: 0.45 }),
    new M.FadeIn(axisGroup, { runTime: 0.65 }),
    ...fbox(['Poisson (mean = 2)', 'counts in 1 hour'], C.cyan),
    ...say('POISSON BARS FOR ONE HOUR', C.cyan)
  );

  // 18: Zero urgent: about 14%
  await until(S(18));
  await play(new M.FadeIn(bars[0], { runTime: 0.7 }), ...say('0 URGENT: ABOUT 14 IN 100', C.amber));

  // 19: One urgent: about 27%
  await until(S(19));
  await play(new M.FadeIn(bars[1], { runTime: 0.7 }), ...say('1 URGENT: ABOUT 27 IN 100', C.cyan));

  // 20: Two urgent: about 27%
  await until(S(20));
  await play(new M.FadeIn(bars[2], { runTime: 0.7 }), ...say('2 URGENT: ALSO ABOUT 27 IN 100', C.cyan));

  // 21: Three 18%, Four 9%, Five or more 5%
  await until(S(21));
  await play(
    new M.LaggedStart([new M.FadeIn(bars[3]), new M.FadeIn(bars[4]), new M.FadeIn(bars[5])], { lagRatio: 0.55, runTime: 3.4 }),
    ...say('3: 18%  ·  4: 9%  ·  5+: 5%', C.cyan)
  );

  // 22: Bars balance at 2 (mean rate)
  const fx = barX(2);
  const fulc = new M.VGroup(
    new M.Line({ start: [fx, BAR_Y - 0.02, 0], end: [fx - 0.18, BAR_Y - 0.24, 0], color: C.amber, strokeWidth: 3 }),
    new M.Line({ start: [fx, BAR_Y - 0.02, 0], end: [fx + 0.18, BAR_Y - 0.24, 0], color: C.amber, strokeWidth: 3 }),
    new M.Line({ start: [fx - 0.18, BAR_Y - 0.24, 0], end: [fx + 0.18, BAR_Y - 0.24, 0], color: C.amber, strokeWidth: 3 })
  );
  const meanLine = new M.DashedLine({ start: [fx, BAR_Y, 0], end: [fx, BAR_Y + BAR_H + 0.52, 0], color: C.amber });
  await until(S(22));
  await play(
    new M.Create(meanLine, { runTime: 0.6 }),
    new M.FadeIn(fulc, { runTime: 0.6 }),
    ...fbox(['Poisson (mean = 2)', ['mean = 2', C.amber]], C.amber),
    ...say('BALANCES AT MEAN = 2', C.amber)
  );

  // 23: Variance is also 2 — mean and variance are equal
  const varBrY = BAR_Y + BAR_H + (P ? 0.92 : 0.78);
  const varBr = bracket(barX(2) - 1.41 * BSP, barX(2) + 1.41 * BSP, varBrY, 0.12, C.violet, 'variance = 2', 0.28);
  await until(S(23));
  await play(
    new M.FadeIn(varBr, { runTime: 0.8 }),
    ...fbox([['mean     = 2', C.amber], ['variance = 2', C.violet], ['mean = variance', C.green]], C.green),
    ...say('MEAN AND VARIANCE ARE EQUAL', C.green)
  );

  // 24: Why? Each tiny piece is a Bernoulli trial, variance p(1 - p)
  const bStripY = P ? 0.45 : 0.75, bStripW = P ? 6.2 : 7.0, bStripH = 0.36;
  const bStrip = new M.RoundedRectangle({ width: bStripW, height: bStripH, cornerRadius: 0.07, color: C.muted, strokeWidth: 1.5 });
  bStrip.setFill(C.card, 0.9); bStrip.moveTo([CX, bStripY, 0]);
  const bTicks = [];
  for (let i = 1; i < 24; i++) {
    const x = CX - bStripW / 2 + (i / 24) * bStripW;
    const tl = new M.Line({ start: [x, bStripY - bStripH / 2, 0], end: [x, bStripY + bStripH / 2, 0], color: C.line, strokeWidth: 1.2 });
    bTicks.push(tl);
  }
  const hiX = CX - bStripW / 2 + (9.5 / 24) * bStripW;
  const hiPiece = new M.Rectangle({ width: bStripW / 24, height: bStripH, color: C.amber, strokeWidth: 2 });
  hiPiece.setFill(C.amber, 0.65); hiPiece.moveTo([hiX, bStripY, 0]);

  const bCardY = P ? -1.15 : -0.45, bCardW = P ? 6.2 : 6.6, bCardH = P ? 1.75 : 1.45;
  const bCard = card(CX, bCardY, bCardW, bCardH, C.violet, 0.94, 2);
  const bTitle = T('ONE TINY PIECE (BERNOULLI)', P ? 16 : 17, C.amber, true, true); bTitle.moveTo([CX, bCardY + bCardH / 2 - 0.32, 0]);
  const bRow1 = T('1 (chance p)   or   0 (chance 1 − p)', P ? 16 : 17, C.ink, true); bRow1.moveTo([CX, bCardY + 0.02, 0]);
  const bRow2 = T('mean = p    ·    variance = p × (1 − p)', P ? 16 : 17, C.violet, true); bRow2.moveTo([CX, bCardY - 0.42, 0]);
  const bernGroup = new M.VGroup(bStrip, ...bTicks, hiPiece, bCard, bTitle, bRow1, bRow2);

  await until(S(24));
  await play(
    new M.FadeOut(new M.VGroup(axisGroup, ...bars, fulc, meanLine, varBr), { runTime: 0.55 }),
    new M.FadeIn(bernGroup, { runTime: 0.85 }),
    ...fbox(['1 tiny piece:', ['mean = p', C.amber], ['var  = p × (1 − p)', C.violet]], C.violet),
    ...say('TINY PIECE: VAR = p × (1 − p)', C.violet)
  );

  // 25: When p is tiny, 1 - p ≈ 1, so each piece adds ≈ p to both
  const compY1 = P ? -3.05 : -1.80, compY2 = P ? -3.90 : -2.42;
  const barLen = P ? 3.8 : 4.2, barLeft = CX - 1.1;
  const mLbl = T('mean sum', P ? 16 : 16, C.amber, true); mLbl.moveTo([barLeft - 1.05, compY1, 0]);
  const mBar = new M.RoundedRectangle({ width: barLen, height: 0.34, cornerRadius: 0.08, color: C.amber, strokeWidth: 2 });
  mBar.setFill(C.amber, 0.65); mBar.moveTo([barLeft + barLen / 2, compY1, 0]);
  const mVal = T('= 2', P ? 17 : 18, C.amber, true, true); mVal.moveTo([barLeft + barLen + 0.45, compY1, 0]);

  const vLbl = T('var sum', P ? 16 : 16, C.violet, true); vLbl.moveTo([barLeft - 1.05, compY2, 0]);
  const vBar = new M.RoundedRectangle({ width: barLen * 0.99, height: 0.34, cornerRadius: 0.08, color: C.violet, strokeWidth: 2 });
  vBar.setFill(C.violet, 0.65); vBar.moveTo([barLeft + barLen * 0.99 / 2, compY2, 0]);
  const vVal = T('≈ 2', P ? 17 : 18, C.violet, true, true); vVal.moveTo([barLeft + barLen + 0.45, compY2, 0]);
  const eqBars = new M.VGroup(mLbl, mBar, mVal, vLbl, vBar, vVal);

  await until(S(25));
  await play(
    new M.FadeIn(eqBars, { runTime: 0.85 }),
    ...fbox(['tiny p ⇒ (1 − p) ≈ 1', ['var ≈ p × 1 = p', C.green], ['total var = mean', C.amber]], C.green),
    ...say('TINY p ⇒ 1 − p ≈ 1 ⇒ VAR = MEAN', C.green)
  );

  // =========================================================================
  // ACT 4: THE FORMULA & TIME SCALING (Sentences 26 - 32)
  // =========================================================================

  // 26: Fixed number e ≈ 2.718
  const eY = P ? -0.35 : 0.35;
  const eCard = card(CX, eY, P ? 5.8 : 6.2, P ? 1.7 : 1.45, C.cyan, 0.94, 2.2);
  const eVal = T('e  ≈  2.718', P ? 32 : 34, C.cyan, true, true); eVal.moveTo([CX, eY + 0.18, 0]);
  const eSub = T('a fixed number', P ? 17 : 18, C.muted); eSub.moveTo([CX, eY - 0.38, 0]);
  const eGroup = new M.VGroup(eCard, eVal, eSub);
  await until(S(26));
  await play(
    new M.FadeOut(new M.VGroup(bernGroup, eqBars), { runTime: 0.5 }),
    new M.FadeIn(eGroup, { runTime: 0.75 }),
    ...fbox(['Short version uses:', ['e ≈ 2.718', C.cyan]], C.cyan),
    ...say('FIXED NUMBER: e ≈ 2.718', C.cyan)
  );

  // 27: k factorial, 3! = 6
  const kY = P ? -2.65 : -1.55;
  const kCard = card(CX, kY, P ? 6.2 : 6.6, P ? 1.95 : 1.60, C.amber, 0.94, 2.2);
  const kDef = T('k! = k × (k−1) × ... × 1', P ? 19 : 21, C.ink, true); kDef.moveTo([CX, kY + 0.28, 0]);
  const kEx = T('3! = 3 × 2 × 1 = 6', P ? 22 : 24, C.amber, true, true); kEx.moveTo([CX, kY - 0.34, 0]);
  const kGroup = new M.VGroup(kCard, kDef, kEx);
  await until(S(27));
  await play(
    new M.FadeIn(kGroup, { runTime: 0.75 }),
    ...fbox(['e ≈ 2.718', ['3! = 3 × 2 × 1 = 6', C.amber]], C.amber),
    ...say('k! = k × ... × 1   (3! = 6)', C.amber)
  );

  // 28: Numerator: e^(-mean) × mean^k
  const fY = P ? -0.55 : 0.20;
  const fCard = card(CX, fY, P ? 6.6 : 7.2, P ? 2.15 : 1.95, C.cyan, 0.94, 2.2);
  const numTxt = T('e^(−mean) × mean^k', P ? 24 : 26, C.cyan, true, true);
  numTxt.moveTo([CX + 0.48, fY + 0.42, 0]);
  await until(S(28));
  await play(
    new M.FadeOut(new M.VGroup(eGroup, kGroup), { runTime: 0.45 }),
    new M.FadeIn(fCard, { runTime: 0.55 }),
    new M.FadeIn(numTxt, { runTime: 0.7 }),
    ...fbox(['Chance of k arrivals:', ['e^(−m) × m^k', C.cyan]], C.cyan),
    ...say('e^(−MEAN) × MEAN^k', C.cyan)
  );

  // 29: Then divide by k factorial
  const fracBar = new M.Line({ start: [CX - 1.55, fY - 0.02, 0], end: [CX + 2.55, fY - 0.02, 0], color: C.ink, strokeWidth: 2.5 });
  const pkTxt = T('P(k) =', P ? 22 : 24, C.ink, true, true); pkTxt.moveTo([CX - 2.35, fY - 0.02, 0]);
  const denTxt = T('k!', P ? 26 : 28, C.violet, true, true); denTxt.moveTo([CX + 0.48, fY - 0.48, 0]);
  const denGroup = new M.VGroup(fracBar, pkTxt, denTxt);
  await until(S(29));
  await play(
    new M.FadeIn(denGroup, { runTime: 0.65 }),
    ...fbox([['P(k) = e^(−m) × m^k ÷ k!', C.ink], ['m = mean count', C.muted]], C.violet),
    ...say('THEN DIVIDE BY k!', C.violet)
  );

  // 30: Plug in k = 0, mean = 2 -> e^(-2) ≈ 0.135
  const subY = P ? -3.05 : -1.75;
  const subCard = card(CX, subY, P ? 6.4 : 7.0, P ? 1.80 : 1.45, C.amber, 0.94, 2);
  const sub1 = T('k = 0,   mean = 2', P ? 18 : 19, C.muted, true); sub1.moveTo([CX, subY + 0.34, 0]);
  const sub2 = T('P(0) = e^(−2) ≈ 0.135', P ? 22 : 24, C.amber, true, true); sub2.moveTo([CX, subY - 0.28, 0]);
  const subGroup = new M.VGroup(subCard, sub1, sub2);
  await until(S(30));
  await play(
    new M.FadeIn(subGroup, { runTime: 0.75 }),
    ...fbox(['k = 0, mean = 2', ['P(0) = e^(−2)', C.cyan], ['     ≈ 0.135 (13.5%)', C.amber]], C.amber),
    ...say('k = 0: e^(−2) ≈ 0.135', C.amber)
  );

  // 31: Rate grows with length of time — half an hour has mean 1
  const scW = P ? 6.2 : 6.8, scX0 = CX - scW / 2;
  const scY1 = P ? 0.35 : 0.72, scY2 = P ? -0.90 : -0.25;
  const s1Rect = new M.RoundedRectangle({ width: scW, height: 0.44, cornerRadius: 0.08, color: C.cyan, strokeWidth: 2 });
  s1Rect.setFill(C.card, 0.92); s1Rect.moveTo([scX0 + scW / 2, scY1, 0]);
  const s1Lbl = T('1 hour  (mean = 2)', P ? 16 : 17, C.cyan, true); s1Lbl.moveTo([scX0 + 1.55, scY1 + 0.42, 0]);
  const s1Dots = [dotAt([scX0 + scW * 0.28, scY1, 0], URG, 0.09).g, dotAt([scX0 + scW * 0.72, scY1, 0], URG, 0.09).g];

  const s2Rect = new M.RoundedRectangle({ width: scW / 2, height: 0.44, cornerRadius: 0.08, color: C.green, strokeWidth: 2.2 });
  s2Rect.setFill(C.card, 0.92); s2Rect.moveTo([scX0 + scW / 4, scY2, 0]);
  const s2Lbl = T('½ hour  (mean = 1)', P ? 16 : 17, C.green, true, true); s2Lbl.moveTo([scX0 + 1.55, scY2 + 0.42, 0]);
  const s2Dot = dotAt([scX0 + scW * 0.28, scY2, 0], URG, 0.09).g;
  const scaleStrips = new M.VGroup(s1Rect, s1Lbl, ...s1Dots, s2Rect, s2Lbl, s2Dot);

  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(fCard, numTxt, denGroup, subGroup), { runTime: 0.45 }),
    new M.FadeIn(scaleStrips, { runTime: 0.8 }),
    ...fbox(['1 hour  → mean = 2', ['½ hour  → mean = 1', C.green]], C.green),
    ...say('HALF AN HOUR → MEAN = 1', C.green)
  );

  // 32: Quiet half hour: e^(-1) ≈ 37%
  const qBarX0 = scX0 + 1.55, qBarMax = scW - 2.35;
  const qbY1 = P ? -2.40 : -1.45, qbY2 = P ? -3.35 : -2.20;
  const w1 = qBarMax * (0.135 / 0.40), w2 = qBarMax * (0.368 / 0.40);
  const qbL1 = T('1 hr quiet', P ? 15 : 16, C.cyan, true); qbL1.moveTo([scX0 + 0.70, qbY1, 0]);
  const qbR1 = new M.RoundedRectangle({ width: w1, height: 0.40, cornerRadius: 0.08, color: C.cyan, strokeWidth: 2 });
  qbR1.setFill(C.cyan, 0.72); qbR1.moveTo([qBarX0 + w1 / 2, qbY1, 0]);
  const qbV1 = T('13.5%', P ? 16 : 17, C.cyan, true, true); qbV1.moveTo([qBarX0 + w1 + 0.58, qbY1, 0]);

  const qbL2 = T('½ hr quiet', P ? 15 : 16, C.green, true); qbL2.moveTo([scX0 + 0.70, qbY2, 0]);
  const qbR2 = new M.RoundedRectangle({ width: w2, height: 0.40, cornerRadius: 0.08, color: C.green, strokeWidth: 2 });
  qbR2.setFill(C.green, 0.78); qbR2.moveTo([qBarX0 + w2 / 2, qbY2, 0]);
  const qbV2 = T('37%', P ? 17 : 18, C.amber, true, true); qbV2.moveTo([qBarX0 + w2 + 0.52, qbY2, 0]);
  const quietComp = new M.VGroup(qbL1, qbR1, qbV1, qbL2, qbR2, qbV2);

  await until(S(32));
  await play(
    new M.FadeIn(quietComp, { runTime: 0.85 }),
    ...fbox(['Quiet ½ hour (k = 0):', ['P(0) = e^(−1) ≈ 0.368', C.green], ['≈ 37 in 100', C.amber]], C.amber),
    ...say('QUIET HALF HOUR: e^(−1) ≈ 37%', C.amber)
  );

  // =========================================================================
  // ACT 5: USES, THE TRAP & WRAP-UP (Sentences 33 - 41)
  // =========================================================================

  // 33: What is it for? Over time or space, rare & random
  const pPos = P ? [[0, -0.35], [0, -3.15]] : [[-3.15, -0.35], [3.15, -0.35]];
  const pW = P ? 6.0 : 5.4, pH = P ? 2.2 : 2.55;
  const timePanel = new M.VGroup(
    card(pPos[0][0], pPos[0][1], pW, pH, C.cyan, 0.92, 2),
    T('OVER TIME', P ? 20 : 22, C.cyan, true, true).moveTo([pPos[0][0], pPos[0][1] + pH / 2 - 0.42, 0]),
    new M.Line({ start: [pPos[0][0] - pW * 0.38, pPos[0][1] - 0.25, 0], end: [pPos[0][0] + pW * 0.38, pPos[0][1] - 0.25, 0], color: C.muted, strokeWidth: 3 }),
    dotAt([pPos[0][0] - pW * 0.24, pPos[0][1] - 0.25, 0], URG, 0.10).g,
    dotAt([pPos[0][0] + pW * 0.05, pPos[0][1] - 0.25, 0], URG, 0.10).g,
    dotAt([pPos[0][0] + pW * 0.28, pPos[0][1] - 0.25, 0], URG, 0.10).g
  );
  const spX = pPos[1][0], spY = pPos[1][1] - 0.22;
  const spaceBox = new M.Rectangle({ width: pW * 0.56, height: pH * 0.48, color: C.muted, strokeWidth: 1.8 });
  spaceBox.setFill(C.bg, 0.7); spaceBox.moveTo([spX, spY, 0]);
  const spacePanel = new M.VGroup(
    card(pPos[1][0], pPos[1][1], pW, pH, C.violet, 0.92, 2),
    T('OVER SPACE', P ? 20 : 22, C.violet, true, true).moveTo([pPos[1][0], pPos[1][1] + pH / 2 - 0.42, 0]),
    spaceBox,
    dotAt([spX - 0.85, spY + 0.22, 0], C.amber, 0.09).g,
    dotAt([spX + 0.35, spY - 0.18, 0], C.amber, 0.09).g,
    dotAt([spX + 0.95, spY + 0.28, 0], C.amber, 0.09).g
  );

  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(scaleStrips, quietComp), { runTime: 0.45 }),
    ...clearBox(),
    new M.FadeIn(timePanel, { runTime: 0.7 }),
    new M.FadeIn(spacePanel, { runTime: 0.7 }),
    ...say('RARE, RANDOM EVENTS: TIME OR SPACE', C.cyan)
  );

  // 34: Calls per hour, accidents per month, typing errors per page
  const exSpecs = [
    { title: 'CALLS / HOUR', col: C.cyan },
    { title: 'ACCIDENTS / MONTH', col: C.amber },
    { title: 'TYPOS / PAGE', col: C.violet },
  ];
  const exPos = P ? [[0, -0.15], [0, -2.05], [0, -3.95]] : [[-4.2, -0.35], [0, -0.35], [4.2, -0.35]];
  const exW = P ? 6.0 : 3.65, exH = P ? 1.45 : 2.15;
  const exCards = exSpecs.map((sp, i) => {
    const [x, y] = exPos[i];
    const r = card(x, y, exW, exH, sp.col, 0.94, 2);
    const t = T(sp.title, P ? 19 : 19, sp.col, true, true); t.moveTo([x, y + (P ? 0.24 : 0.42), 0]);
    const d1 = dotAt([x - 0.8, y - (P ? 0.32 : 0.32), 0], sp.col, 0.09).g;
    const d2 = dotAt([x + 0.1, y - (P ? 0.32 : 0.32), 0], sp.col, 0.09).g;
    const d3 = dotAt([x + 0.85, y - (P ? 0.32 : 0.32), 0], sp.col, 0.09).g;
    return new M.VGroup(r, t, d1, d2, d3);
  });
  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(timePanel, spacePanel), { runTime: 0.45 }),
    new M.LaggedStart(exCards.map(c => new M.FadeIn(c)), { lagRatio: 0.28, runTime: 1.8 }),
    ...say('CALLS · ACCIDENTS · TYPING ERRORS', C.green)
  );

  // 35: Quiet hour ≈ 1 hour in 7
  const sevCounts = [0, 2, 1, 3, 2, 1, 3];
  const sevW = P ? 0.84 : 1.45, sevH = P ? 1.65 : 1.95, sevSp = P ? 0.98 : 1.72, sevY = P ? -1.35 : -0.35;
  const sevBoxes = sevCounts.map((cnt, k) => {
    const x = (k - 3) * sevSp;
    const quiet = cnt === 0;
    const r = card(x, sevY, sevW, sevH, quiet ? C.green : C.line, 0.94, quiet ? 2.8 : 1.6);
    const parts = [r];
    const num = T(String(cnt), P ? 20 : 24, quiet ? C.green : URG, true, true);
    num.moveTo([x, sevY + (quiet ? 0.18 : 0.45), 0]); parts.push(num);
    if (quiet) {
      const ql = T('QUIET', P ? 11 : 14, C.green, true, true); ql.moveTo([x, sevY - 0.40, 0]); parts.push(ql);
    } else {
      for (let j = 0; j < cnt; j++) {
        const dx = (j - (cnt - 1) / 2) * (P ? 0.22 : 0.34);
        parts.push(new M.Dot({ point: [x + dx, sevY - 0.35, 0], radius: P ? 0.065 : 0.085, color: URG }));
      }
    }
    return new M.VGroup(...parts);
  });
  const sevNote = T('13.5%  ≈  1 quiet hour in every 7', P ? 19 : 22, C.green, true, true);
  sevNote.moveTo([0, sevY - sevH / 2 - (P ? 0.72 : 0.65), 0]);
  await until(S(35));
  await play(
    new M.FadeOut(new M.VGroup(...exCards), { runTime: 0.45 }),
    new M.LaggedStart(sevBoxes.map(b => new M.FadeIn(b)), { lagRatio: 0.10, runTime: 1.2 }),
    new M.FadeIn(sevNote, { runTime: 0.6 }),
    ...say('QUIET HOUR ≈ 1 HOUR IN 7', C.green)
  );

  // 36: Common trap — Poisson needs a steady rate
  const stY = P ? -1.4 : -0.45, stW = P ? 6.4 : 8.4;
  const stLine = new M.DashedLine({ start: [-stW / 2, stY, 0], end: [stW / 2, stY, 0], color: C.green });
  const stLbl = T('steady rate: 2 per hour, every hour', P ? 18 : 21, C.green, true);
  stLbl.moveTo([0, stY + 0.65, 0]);
  const stDots = [-0.38, -0.22, -0.05, 0.12, 0.26, 0.40].map(f => dotAt([f * stW, stY, 0], C.cyan, 0.095).g);
  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(...sevBoxes, sevNote), { runTime: 0.45 }),
    new M.Create(stLine, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(stLbl, ...stDots), { runTime: 0.7 }),
    ...say('TRAP: POISSON NEEDS A STEADY RATE', C.pink)
  );

  // 37: Monday morning rush vs quiet night
  const mnPos = P ? [[CX, -0.25], [CX, -2.95]] : [[CX - 1.95, -0.4], [CX + 1.95, -0.4]];
  const mnW = P ? 6.0 : 3.55, mnH = P ? 2.0 : 2.35;
  const monDots = [[-1.1, -0.15], [-0.45, 0.05], [0.2, -0.22], [0.85, 0.02], [-0.75, -0.58], [0.45, -0.55]].map(([dx, dy]) =>
    dotAt([mnPos[0][0] + dx * (P ? 1.3 : 0.95), mnPos[0][1] + dy, 0], URG, 0.095).g);
  const monCard = new M.VGroup(
    card(mnPos[0][0], mnPos[0][1], mnW, mnH, URG, 0.94, 2.4),
    T('MONDAY MORNING', P ? 18 : 18, URG, true, true).moveTo([mnPos[0][0], mnPos[0][1] + mnH / 2 - 0.36, 0]),
    ...monDots
  );
  const nightCard = new M.VGroup(
    card(mnPos[1][0], mnPos[1][1], mnW, mnH, C.muted, 0.94, 2),
    T('LATE NIGHT', P ? 18 : 18, C.muted, true, true).moveTo([mnPos[1][0], mnPos[1][1] + mnH / 2 - 0.36, 0]),
    T('0 urgent', P ? 20 : 20, C.muted, true).moveTo([mnPos[1][0], mnPos[1][1] - 0.20, 0])
  );
  await until(S(37));
  await play(
    new M.FadeOut(new M.VGroup(stLine, stLbl, ...stDots), { runTime: 0.45 }),
    new M.FadeIn(monCard, { runTime: 0.65 }),
    new M.FadeIn(nightCard, { runTime: 0.65 }),
    ...say('MONDAY RUSH (MANY) vs NIGHT (NONE)', URG)
  );

  // 38: Mixing hours -> variance much bigger than mean
  const MIX_PROBS = [0.40, 0.08, 0.04, 0.06, 0.10, 0.32];
  const mixScale = BAR_H / 0.40;
  const mixAxis = new M.Line({ start: [barX(0) - BSP * 0.55, BAR_Y, 0], end: [barX(5) + BSP * 0.55, BAR_Y, 0], color: C.muted, strokeWidth: 2.5 });
  const mixXLabs = KLABS.map((s, k) => { const t = T(s, P ? 18 : 19, C.ink, true, true); t.moveTo([barX(k), BAR_Y - 0.42, 0]); return t; });
  const mixBars = MIX_PROBS.map((pr, k) => {
    const h = pr * mixScale;
    const rect = new M.Rectangle({ width: BW, height: h, color: C.pink, strokeWidth: 2 });
    rect.setFill(C.pink, 0.68); rect.moveTo([barX(k), BAR_Y + h / 2, 0]);
    return rect;
  });
  const mixMean = new M.DashedLine({ start: [barX(2), BAR_Y, 0], end: [barX(2), BAR_Y + BAR_H + 0.35, 0], color: C.amber });
  const mixSpread = bracket(barX(0), barX(5), BAR_Y + BAR_H + (P ? 0.72 : 0.62), 0.14, C.pink, 'huge variance (≈ 6)', 0.28);
  const mixGroup = new M.VGroup(mixAxis, ...mixXLabs, ...mixBars, mixMean, mixSpread);

  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(monCard, nightCard), { runTime: 0.45 }),
    new M.FadeIn(mixGroup, { runTime: 0.8 }),
    ...fbox(['Mixed rush + night:', ['mean     ≈ 2', C.amber], ['variance ≈ 6  (>> 2)', C.pink]], C.pink),
    ...say('VARIANCE MUCH BIGGER THAN MEAN', C.pink)
  );

  // 39: Mean ≠ variance -> Poisson is the wrong model
  await until(S(39));
  await play(
    new M.Indicate(mixSpread, { color: C.pink, runTime: 1.0 }),
    ...fbox([['mean ≠ variance', C.pink], ['Poisson does NOT fit', C.pink]], C.pink),
    ...say('MEAN ≠ VARIANCE → WRONG MODEL', C.pink)
  );

  // 40: Next lesson — sort tickets into three kinds at once
  const k3Specs = [
    { name: 'URGENT', frac: '1 / 5', col: URG },
    { name: 'NORMAL', frac: '2 / 5', col: C.cyan },
    { name: 'LOW', frac: '2 / 5', col: C.violet },
  ];
  const k3Pos = P ? [[0, -0.15], [0, -2.05], [0, -3.95]] : [[-4.1, -0.35], [0, -0.35], [4.1, -0.35]];
  const k3W = P ? 5.6 : 3.55, k3H = P ? 1.45 : 2.15;
  const k3Cards = k3Specs.map((sp, i) => {
    const [x, y] = k3Pos[i];
    const r = card(x, y, k3W, k3H, sp.col, 0.94, 2.2);
    const t1 = T(sp.name, P ? 20 : 21, sp.col, true, true); t1.moveTo([x, y + 0.28, 0]);
    const t2 = T(sp.frac, P ? 22 : 24, C.ink, true); t2.moveTo([x, y - 0.34, 0]);
    return new M.VGroup(r, t1, t2);
  });
  await until(S(40));
  await play(
    new M.FadeOut(mixGroup, { runTime: 0.45 }),
    ...clearBox(),
    new M.LaggedStart(k3Cards.map(c => new M.FadeIn(c)), { lagRatio: 0.22, runTime: 1.2 }),
    ...say('NEXT: THREE KINDS OF TICKETS', C.violet)
  );

  // 41: One-sentence recap
  const recStripY = P ? 0.10 : 0.55, recW = P ? 6.0 : 6.6;
  const recStrip = new M.RoundedRectangle({ width: recW, height: 0.42, cornerRadius: 0.08, color: C.cyan, strokeWidth: 2 });
  recStrip.setFill(C.card, 0.92); recStrip.moveTo([CX, recStripY, 0]);
  const recDots = [0.22, 0.68].map(f => dotAt([CX - recW / 2 + recW * f, recStripY, 0], URG, 0.095).g);
  const recBarY = P ? -3.45 : -2.15, recBarH = P ? 2.4 : 1.75, recSp = P ? 0.96 : 1.05;
  const recBase = new M.Line({ start: [CX - 2.9 * recSp, recBarY, 0], end: [CX + 2.9 * recSp, recBarY, 0], color: C.muted, strokeWidth: 2 });
  const recBars = PROBS.map((pr, k) => {
    const h = (pr / 0.2707) * recBarH;
    const rect = new M.Rectangle({ width: recSp * 0.65, height: h, color: C.cyan, strokeWidth: 1.8 });
    rect.setFill(C.cyan, 0.72); rect.moveTo([CX + (k - 2.5) * recSp, recBarY + h / 2, 0]);
    return rect;
  });
  const recLabs = KLABS.map((s, k) => { const t = T(s, P ? 18 : 19, C.ink, true, true); t.moveTo([CX + (k - 2.5) * recSp, recBarY - 0.36, 0]); return t; });
  const recapGroup = new M.VGroup(recStrip, ...recDots, recBase, ...recBars, ...recLabs);

  await until(S(41));
  await play(
    new M.FadeOut(new M.VGroup(...k3Cards), { runTime: 0.45 }),
    new M.FadeIn(recapGroup, { runTime: 0.85 }),
    ...fbox([['Poisson(mean)', C.cyan], ['mean = variance', C.green], ['P(k) = e^(−m) m^k ÷ k!', C.amber]], C.cyan),
    ...say('POISSON: RANDOM ARRIVALS · ONE MEAN RATE', C.cyan)
  );
}
