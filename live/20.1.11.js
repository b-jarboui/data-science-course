// 20.1.11 Mixed precision: learning with smaller numbers without losing small changes.
// Beat i = sentence i (0-based, 55 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;

  const CX = P ? 0 : -2.2;
  const PILL = P ? [0, 2.08, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.38, 0] : [4.35, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 17 : 18);

  // Formula box: one box at a time, never overlapping the data.
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.37 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.62, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.31, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.1;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.7 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.5 }));
    boxNow = g;
    return a;
  }
  function clearBox(runTime = 0.5) {
    if (!boxNow) return [];
    const a = [new M.FadeOut(boxNow, { runTime })];
    boxNow = null;
    return a;
  }

  // Helpers for cards, dots, bars, and tracking values placed inside L.net neurons.
  const card = (w, h, p, color = C.cyan, fill = C.card, op = 0.95) => {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: 2 });
    r.setFill(fill, op); r.moveTo(p); return r;
  };
  const rectAt = (w, h, p, color, op = 0.85) => {
    const r = new M.Rectangle({ width: w, height: h, color, strokeWidth: 1.5 });
    r.setFill(color, op); r.moveTo(p); return r;
  };
  const dotAt = (p, color, r = 0.13) => {
    const d = new M.Dot({ point: p, radius: r, color }); d.setFill(color, 1); return d;
  };
  const fadeAll = (arr, runTime = 0.55) => arr.map(m => new M.FadeOut(m, { runTime }));
  const trackVal = (N, map, l, i, s, col = C.ink) => {
    const a = N.value(l, i, s, col);
    map.set(l + ':' + i, a[0].mobject);
    return a;
  };

  // ===========================================================================
  // ACT 1 (0-2): Larger campus newsletter model needs more memory
  // ===========================================================================
  const act1 = [];
  const newsTexts = ['Library opens at nine', 'Pool closed today', 'Exams start'];
  const newsCards = newsTexts.map((txt, k) => {
    const p = P ? [-1.55, -0.4 - k * 1.15, 0] : [-4.55, 0.45 - k * 0.95, 0];
    const w = P ? 3.45 : 3.6, h = P ? 0.85 : 0.62;
    const bg = card(w, h, p, C.cyan);
    const lb = T(txt, P ? 17 : 17, C.ink); if (lb.getWidth() > w - 0.2) lb.scale((w - 0.2) / lb.getWidth()); lb.moveTo(p);
    return new M.VGroup(bg, lb);
  });
  const modP = P ? [1.95, -1.55, 0] : [0.25, -0.5, 0];
  const modSmall = card(P ? 1.85 : 2.1, P ? 1.4 : 1.55, modP, C.violet);
  const modBig = card(P ? 2.55 : 3.0, P ? 2.45 : 2.5, modP, C.violet);
  const modTitle = T('Language\nmodel', P ? 17 : 20, C.ink, false, true); modTitle.moveTo([modP[0], modP[1] + 0.15, 0]);
  const modSub = T('many numbers', P ? 16 : 16, C.violet); modSub.moveTo([modP[0], modP[1] - 0.7, 0]);
  const nArrows = newsTexts.map((_, k) => {
    const y0 = P ? -0.4 - k * 1.15 : 0.45 - k * 0.95;
    const x0 = P ? 0.25 : -2.65, x1 = modP[0] - (P ? 1.05 : 1.2);
    return new M.Arrow({ start: [x0, y0, 0], end: [x1, modP[1] + (1 - k) * 0.32, 0], color: C.muted, strokeWidth: 2 });
  });
  const modTitle2 = modTitle.copy();
  act1.push(...newsCards, ...nArrows, modBig, modTitle2, modSub);

  await until(S(0));
  await play(
    new M.LaggedStart(newsCards.map(c => new M.FadeIn(c)), { lagRatio: 0.16, runTime: 1.1 }),
    new M.LaggedStart(nArrows.map(a => new M.FadeIn(a)), { lagRatio: 0.12, runTime: 0.9 }),
    new M.FadeIn(modSmall, { runTime: 0.8 }), new M.FadeIn(modTitle, { runTime: 0.8 }),
    ...say('MORE NEWSLETTERS → BIGGER MODEL')
  );
  await play(new M.FadeOut(modSmall, { runTime: 0.6 }), new M.FadeOut(modTitle, { runTime: 0.4 }), new M.FadeIn(modBig, { runTime: 0.8 }));
  await play(new M.FadeIn(modTitle2, { runTime: 0.5 }), new M.FadeIn(modSub, { runTime: 0.6 }));

  // 1: Memory bar fills up
  const memY = P ? -4.75 : -2.35, memW = P ? 6.6 : 7.6, memH = P ? 0.7 : 0.56, memX0 = (P ? 0 : -2.1) - memW / 2;
  const memBox = card(memW, memH, [memX0 + memW / 2, memY, 0], C.muted, C.bg, 0.9);
  const memLab = T('Memory used', P ? 16 : 17, C.amber, false, true); memLab.moveTo([memX0 + 1.05, memY + 0.52, 0]);
  const memFill = rectAt(memW * 0.22, memH - 0.12, [memX0 + memW * 0.11 + 0.06, memY, 0], C.amber, 0.85);
  const memFull = rectAt(memW * 0.88, memH - 0.12, [memX0 + memW * 0.44 + 0.06, memY, 0], C.pink, 0.85);
  act1.push(memBox, memLab, memFill);

  await until(S(1));
  await play(new M.FadeIn(memBox, { runTime: 0.5 }), new M.FadeIn(memLab, { runTime: 0.5 }), new M.FadeIn(memFill, { runTime: 0.5 }),
    ...say('BIGGER MODEL = MORE MEMORY', C.amber));
  await play(new M.Transform(memFill, memFull, { runTime: 1.0 }));

  // 2: Can we use less memory?
  const memHalf = rectAt(memW * 0.44, memH - 0.12, [memX0 + memW * 0.22 + 0.06, memY, 0], C.green, 0.85);
  const halfMark = new M.DashedLine({ start: [memX0 + memW * 0.44 + 0.06, memY - 0.48, 0], end: [memX0 + memW * 0.44 + 0.06, memY + 0.48, 0], color: C.green });
  const halfTxt = T('half?', P ? 18 : 16, C.green, true, true); halfTxt.moveTo([memX0 + memW * 0.44 + 0.06, memY - 0.72, 0]);
  act1.push(halfMark, halfTxt);

  await until(S(2));
  await play(new M.Transform(memFill, memHalf, { runTime: 1.0 }), new M.Create(halfMark, { runTime: 0.7 }), new M.FadeIn(halfTxt, { runTime: 0.7 }),
    ...say('LESS MEMORY WITHOUT LOSING LEARNING?', C.violet));

  // ===========================================================================
  // ACT 2 (3-6): Neural network with L.net(...) & one weight = 1
  // ===========================================================================
  const netC = P ? [-0.05, -1.9, 0] : [CX, -0.45, 0];
  const netW = P ? 4.4 : 5.4, netH = P ? 4.0 : 3.0, netR = P ? 0.32 : 0.27;
  const N1 = net({ layers: [3, 3, 1], center: netC, width: netW, height: netH, r: netR,
    names: ['Library', 'opens', 'at'], outName: 'nine', color: C.cyan });

  await until(S(3));
  await play(...fadeAll(act1, 0.55), ...say('NEURONS IN LAYERS, JOINED BY WEIGHTS'));
  await play(
    new M.LaggedStart(N1.nodes.flat().map(n => new M.FadeIn(n)), { lagRatio: 0.08, runTime: 1.1 }),
    new M.LaggedStart(N1.edges.flat(2).map(e => new M.Create(e)), { lagRatio: 0.04, runTime: 1.3 }),
    new M.LaggedStart(N1.labels.map(l => new M.FadeIn(l)), { lagRatio: 0.1, runTime: 0.9 })
  );

  // 4: Each connecting line has a weight
  const act2Extra = [];
  const pMid0 = N1.pos(0, 0), pMid1 = N1.pos(1, 0);
  const wTag = pill('weight', C.cyan, P ? 17 : 16); wTag.moveTo([(pMid0[0] + pMid1[0]) / 2, pMid0[1] + 0.42, 0]);
  act2Extra.push(wTag);

  await until(S(4));
  await play(
    ...N1.weight(0, 0, 0, 0.75), ...N1.weight(0, 1, 0, -0.55), ...N1.weight(0, 2, 1, 0.65),
    ...N1.weight(1, 0, 0, 0.6), ...N1.weight(1, 1, 0, 0.85), ...N1.weight(1, 2, 0, -0.5),
    new M.FadeIn(wTag, { runTime: 0.7 }), ...say('EACH LINE HAS A WEIGHT')
  );

  // 5: During training, small changes to these weights
  await until(S(5));
  await play(
    ...N1.weight(0, 0, 0, 0.9), ...N1.weight(0, 1, 0, -0.35), ...N1.weight(0, 2, 1, 0.45),
    ...N1.weight(1, 0, 0, 0.8), ...N1.weight(1, 2, 0, -0.7),
    ...say('TRAINING = SMALL WEIGHT CHANGES', C.amber)
  );

  // 6: Examine one weight that starts at 1
  const eStart = N1.pos(1, 1), eEnd = N1.pos(2, 0);
  const selLine1 = new M.Line({ start: [eStart[0] + netR, eStart[1], 0.02], end: [eEnd[0] - netR, eEnd[1], 0.02], color: C.amber, strokeWidth: 6 });
  const w1Tag = pill('w = 1', C.amber, 16); w1Tag.moveTo([(eStart[0] + eEnd[0]) / 2, eStart[1] + 0.4, 0]);
  act2Extra.push(selLine1, w1Tag);

  await until(S(6));
  await play(new M.Create(selLine1, { runTime: 0.7 }), new M.FadeIn(w1Tag, { runTime: 0.7 }),
    ...fbox(['one weight', ['w = 1', C.amber]], C.amber), ...say('ONE WEIGHT: w = 1', C.amber));

  // ===========================================================================
  // ACT 3 (7-15): Bits, precision, 32-bit vs 16-bit, and two measuring rulers
  // ===========================================================================
  await until(S(7));
  await play(new M.FadeOut(N1.group, { runTime: 0.55 }), ...fadeAll(act2Extra, 0.55), ...clearBox(0.5),
    ...say('BITS = TINY STORAGE UNITS'));

  const bitY = P ? -2.0 : -0.35, bitSP = P ? 0.9 : 0.86;
  const bitBoxes = Array.from({ length: 8 }, (_, k) =>
    card(bitSP * 0.82, P ? 1.0 : 0.78, [CX + (k - 3.5) * bitSP, bitY, 0], C.cyan, C.card, 0.95));
  const bitCap = T('bits (tiny units of information)', P ? 17 : 19, C.muted); bitCap.moveTo([CX, bitY - (P ? 1.0 : 0.85), 0]);
  await play(new M.LaggedStart(bitBoxes.map(b => new M.FadeIn(b)), { lagRatio: 0.08, runTime: 1.0 }), new M.FadeIn(bitCap, { runTime: 0.7 }));

  // 8: Each bit holds 0 or 1
  const bitsVal = ['0', '1', '0', '0', '1', '0', '1', '1'];
  const bitTxts = bitsVal.map((ch, k) => {
    const t = T(ch, P ? 26 : 28, ch === '1' ? C.cyan : C.muted, true, true);
    t.moveTo([CX + (k - 3.5) * bitSP, bitY, 0]); return t;
  });
  await until(S(8));
  await play(new M.LaggedStart(bitTxts.map(t => new M.FadeIn(t)), { lagRatio: 0.07, runTime: 0.9 }), ...say('EACH BIT = 0 OR 1'));

  // 9: More bits = finer detail (32 bits vs 16 bits bars)
  const act3Bits = [];
  const bw32 = P ? 0.19 : 0.23, rowW32 = 32 * bw32;
  const xStart32 = CX - rowW32 / 2;
  const y32 = P ? -0.8 : 0.45, y16 = P ? -3.4 : -1.25;
  const row32 = Array.from({ length: 32 }, (_, k) =>
    rectAt(bw32 * 0.78, P ? 0.6 : 0.36, [xStart32 + (k + 0.5) * bw32, y32, 0], C.cyan, 0.82));
  const row16 = Array.from({ length: 16 }, (_, k) =>
    rectAt(bw32 * 0.78, P ? 0.6 : 0.36, [xStart32 + (k + 0.5) * bw32, y16, 0], C.amber, 0.82));
  const lab32 = T('32 bits', P ? 17 : 18, C.cyan, true, true); lab32.moveTo([xStart32 + 0.75, y32 + (P ? 0.6 : 0.46), 0]);
  const lab16 = T('16 bits', P ? 17 : 18, C.amber, true, true); lab16.moveTo([xStart32 + 0.75, y16 + (P ? 0.6 : 0.46), 0]);
  act3Bits.push(...row32, ...row16, lab32, lab16);

  await until(S(9));
  await play(...fadeAll([...bitBoxes, ...bitTxts, bitCap], 0.45), ...say('MORE BITS = FINER DETAIL'));
  await play(
    new M.FadeIn(lab32, { runTime: 0.5 }), new M.FadeIn(lab16, { runTime: 0.5 }),
    new M.LaggedStart(row32.map(b => new M.FadeIn(b)), { lagRatio: 0.02, runTime: 1.0 }),
    new M.LaggedStart(row16.map(b => new M.FadeIn(b)), { lagRatio: 0.03, runTime: 0.8 })
  );

  // 10: Precision
  await until(S(10));
  await play(new M.Indicate(lab32, { color: C.green, runTime: 0.9 }), new M.Indicate(lab16, { color: C.green, runTime: 0.9 }),
    ...say('PRECISION = LEVEL OF DETAIL', C.green));

  // 11: 32-bit keeps ~7 important digits
  const dig32 = T('~7 digits   (1.000123)', P ? 16 : 18, C.cyan, true);
  dig32.moveTo([xStart32 + 2.2, y32 - (P ? 0.65 : 0.48), 0]);
  act3Bits.push(dig32);

  await until(S(11));
  await play(new M.FadeIn(dig32, { runTime: 0.8 }),
    ...fbox([['32-bit format', C.cyan], '~7 important digits', 'e.g. 1.000123'], C.cyan),
    ...say('32-BIT: ~7 IMPORTANT DIGITS'));

  // 12: 16-bit keeps ~3 important digits
  const dig16 = T('~3 digits   (1.00)', P ? 16 : 18, C.amber, true);
  dig16.moveTo([xStart32 + 1.85, y16 - (P ? 0.65 : 0.48), 0]);
  act3Bits.push(dig16);

  await until(S(12));
  await play(new M.FadeIn(dig16, { runTime: 0.8 }),
    ...fbox([['32-bit: ~7 digits', C.cyan], ['16-bit: ~3 digits', C.amber]], C.amber),
    ...say('HALF PRECISION (16-BIT): ~3 DIGITS', C.amber));

  // 13: Two measuring rulers
  const act3Rul = [];
  const rW = P ? 6.4 : 7.6, rX0 = CX - rW / 2, rY1 = P ? -0.8 : 0.45, rY2 = P ? -3.5 : -1.35;
  const fineBody = rectAt(rW, P ? 0.6 : 0.44, [CX, rY1, 0], C.cyan, 0.16);
  const fineTicks = Array.from({ length: 31 }, (_, k) => {
    const x = rX0 + k * (rW / 30), tall = k % 5 === 0 ? 0.26 : 0.14;
    return new M.Line({ start: [x, rY1 + 0.22, 0], end: [x, rY1 + 0.22 - tall, 0], color: C.cyan, strokeWidth: k % 5 === 0 ? 2.5 : 1.5 });
  });
  const fineLbl = T('Fine ruler (many marks)', P ? 16 : 18, C.cyan, false, true); fineLbl.moveTo([rX0 + 1.6, rY1 + (P ? 0.65 : 0.55), 0]);

  const coarseBody = rectAt(rW, P ? 0.6 : 0.44, [CX, rY2, 0], C.amber, 0.16);
  const coarseTicks = Array.from({ length: 7 }, (_, k) => {
    const x = rX0 + k * (rW / 6);
    return new M.Line({ start: [x, rY2 + 0.22, 0], end: [x, rY2 - 0.04, 0], color: C.amber, strokeWidth: 3 });
  });
  const coarseLbl = T('Coarse ruler (fewer marks)', P ? 16 : 18, C.amber, false, true); coarseLbl.moveTo([rX0 + 1.85, rY2 + (P ? 0.65 : 0.55), 0]);
  act3Rul.push(fineBody, ...fineTicks, fineLbl, coarseBody, ...coarseTicks, coarseLbl);

  await until(S(13));
  await play(...fadeAll(act3Bits, 0.5), ...clearBox(0.5), ...say('TWO RULERS: FINE vs FEWER MARKS'));
  await play(
    new M.FadeIn(fineBody, { runTime: 0.7 }), new M.FadeIn(fineLbl, { runTime: 0.7 }),
    new M.LaggedStart(fineTicks.map(t => new M.Create(t)), { lagRatio: 0.02, runTime: 0.9 }),
    new M.FadeIn(coarseBody, { runTime: 0.7 }), new M.FadeIn(coarseLbl, { runTime: 0.7 }),
    new M.LaggedStart(coarseTicks.map(t => new M.Create(t)), { lagRatio: 0.06, runTime: 0.7 })
  );

  // 14: Coarse ruler misses tiny changes
  const tinyX = rX0 + rW / 30 * 1.4;
  const fineDot = dotAt([tinyX, rY1 - (P ? 0.5 : 0.38), 0], C.green, 0.11);
  const fineOk = T('seen ✓', P ? 17 : 16, C.green, true); fineOk.moveTo([tinyX + 0.75, rY1 - (P ? 0.5 : 0.38), 0]);
  const coarseDot = dotAt([tinyX, rY2 - (P ? 0.5 : 0.38), 0], C.pink, 0.11);
  const gapSpan = new M.Line({ start: [rX0, rY2 - (P ? 0.5 : 0.38), 0], end: [rX0 + rW / 6, rY2 - (P ? 0.5 : 0.38), 0], color: C.pink, strokeWidth: 3 });
  const coarseMiss = T('falls in gap', P ? 17 : 16, C.pink, true); coarseMiss.moveTo([rX0 + rW / 6 + 1.15, rY2 - (P ? 0.5 : 0.38), 0]);
  act3Rul.push(fineDot, fineOk, coarseDot, gapSpan, coarseMiss);

  await until(S(14));
  await play(new M.FadeIn(fineDot, { runTime: 0.6 }), new M.FadeIn(fineOk, { runTime: 0.6 }),
    new M.FadeIn(coarseDot, { runTime: 0.6 }), new M.Create(gapSpan, { runTime: 0.7 }), new M.FadeIn(coarseMiss, { runTime: 0.7 }),
    ...say('FEWER MARKS MISS TINY CHANGES', C.pink));

  // 15: Same with fewer bits
  const tag32R = pill('32-BIT', C.cyan, P ? 16 : 15); tag32R.moveTo([rX0 + rW - 0.65, rY1 + (P ? 0.65 : 0.55), 0]);
  const tag16R = pill('16-BIT', C.amber, P ? 16 : 15); tag16R.moveTo([rX0 + rW - 0.65, rY2 + (P ? 0.65 : 0.55), 0]);
  act3Rul.push(tag32R, tag16R);

  await until(S(15));
  await play(new M.FadeIn(tag32R, { runTime: 0.7 }), new M.FadeIn(tag16R, { runTime: 0.7 }),
    ...say('FEWER BITS = FEWER NUMBER MARKS', C.amber));

  // ===========================================================================
  // ACT 4 (16-20): Memory savings (1 million weights: 4 MB vs 2 MB)
  // ===========================================================================
  const act4 = [];
  const mbBase = P ? -4.5 : -2.2, mbH = P ? 0.92 : 0.62, mbW = P ? 1.85 : 2.1;
  const mbX1 = CX - (P ? 1.45 : 1.75), mbX2 = CX + (P ? 1.45 : 1.75);
  const mbFloor = new M.Line({ start: [mbX1 - mbW * 0.7, mbBase, 0], end: [mbX2 + mbW * 0.7, mbBase, 0], color: C.muted, strokeWidth: 2 });
  const blocks32 = Array.from({ length: 4 }, (_, k) => {
    const p = [mbX1, mbBase + (k + 0.5) * mbH + 0.05, 0];
    const r = rectAt(mbW, mbH - 0.1, p, C.cyan, 0.78);
    const t = T('1 MB', P ? 15 : 16, C.bg, true, true); t.moveTo(p);
    return new M.VGroup(r, t);
  });
  const blocks16 = Array.from({ length: 2 }, (_, k) => {
    const p = [mbX2, mbBase + (k + 0.5) * mbH + 0.05, 0];
    const r = rectAt(mbW, mbH - 0.1, p, C.green, 0.8);
    const t = T('1 MB', P ? 15 : 16, C.bg, true, true); t.moveTo(p);
    return new M.VGroup(r, t);
  });
  const colLab32 = T('32-bit', P ? 18 : 19, C.cyan, true, true); colLab32.moveTo([mbX1, mbBase - 0.38, 0]);
  const colLab16 = T('16-bit', P ? 18 : 19, C.green, true, true); colLab16.moveTo([mbX2, mbBase - 0.38, 0]);
  const halfMemLine = new M.DashedLine({ start: [mbX1 - mbW * 0.65, mbBase + 2 * mbH + 0.04, 0], end: [mbX2 + mbW * 0.65, mbBase + 2 * mbH + 0.04, 0], color: C.green });
  act4.push(mbFloor, ...blocks32, ...blocks16, colLab32, colLab16, halfMemLine);

  await until(S(16));
  await play(...fadeAll(act3Rul, 0.5), ...say('16-BIT = HALF THE MEMORY', C.green));
  await play(
    new M.Create(mbFloor, { runTime: 0.6 }), new M.FadeIn(colLab32, { runTime: 0.6 }), new M.FadeIn(colLab16, { runTime: 0.6 }),
    new M.LaggedStart(blocks32.map(b => new M.FadeIn(b)), { lagRatio: 0.12, runTime: 0.9 }),
    new M.LaggedStart(blocks16.map(b => new M.FadeIn(b)), { lagRatio: 0.15, runTime: 0.7 }),
    new M.Create(halfMemLine, { runTime: 0.7 })
  );

  // 17: 1 million weights -> 4 MB in 32-bit
  const top32 = pill('4 MB', C.cyan, 17); top32.moveTo([mbX1, mbBase + 4 * mbH + 0.42, 0]);
  act4.push(top32);

  await until(S(17));
  await play(new M.FadeIn(top32, { runTime: 0.7 }),
    ...fbox(['1,000,000 weights', ['32-bit: 4 MB', C.cyan]], C.cyan),
    ...say('1 MILLION WEIGHTS → 4 MB (32-BIT)'));

  // 18: What is a megabyte?
  const mbUnit = T('1 MB = memory unit', P ? 17 : 16, C.amber, true); mbUnit.moveTo([P ? 0 : mbX1, mbBase - 0.85, 0]);
  act4.push(mbUnit);

  await until(S(18));
  await play(new M.Indicate(blocks32[0], { color: C.amber, runTime: 0.9 }), new M.FadeIn(mbUnit, { runTime: 0.7 }),
    ...say('MEGABYTE (MB) = UNIT OF MEMORY', C.amber));

  // 19: Same weights -> 2 MB in 16-bit
  const top16 = pill('2 MB', C.green, 17); top16.moveTo([mbX2 + mbW / 2 + 0.62, mbBase + mbH + 0.05, 0]);
  const savedBox = card(mbW, 2 * mbH - 0.14, [mbX2, mbBase + 3 * mbH + 0.05, 0], C.green, C.green, 0.1);
  const savedTxt = T('saved', P ? 18 : 17, C.green, true, true); savedTxt.moveTo([mbX2, mbBase + 3 * mbH + 0.05, 0]);
  act4.push(top16, savedBox, savedTxt);

  await until(S(19));
  await play(new M.FadeIn(top16, { runTime: 0.6 }), new M.FadeIn(savedBox, { runTime: 0.7 }), new M.FadeIn(savedTxt, { runTime: 0.7 }),
    ...fbox(['1,000,000 weights', ['32-bit: 4 MB', C.cyan], ['16-bit: 2 MB', C.green]], C.green),
    ...say('1 MILLION WEIGHTS → 2 MB (16-BIT)', C.green));

  // 20: Big memory savings
  await until(S(20));
  await play(new M.Indicate(savedBox, { color: C.green, runTime: 0.9 }), ...say('HALF THE MEMORY SAVED', C.green));

  // ===========================================================================
  // ACT 5 (21-24): Neural network learning (forward pass, loss, backward pass)
  // ===========================================================================
  const N2 = net({ layers: [3, 3, 1], center: netC, width: netW, height: netH, r: netR,
    names: ['Library', 'opens', 'at'], outName: 'nine', color: C.cyan });
  const v2 = new Map();
  const act5Extra = [];

  await until(S(21));
  await play(...fadeAll(act4, 0.5), ...clearBox(0.5), ...say('WATCH THE NETWORK LEARN', C.amber));
  await play(new M.FadeIn(N2.group, { runTime: 0.8 }),
    ...trackVal(N2, v2, 0, 0, '0.8'), ...trackVal(N2, v2, 0, 1, '0.4'), ...trackVal(N2, v2, 0, 2, '0.6'));

  // 22: Forward pass left to right
  await until(S(22));
  await play(...N2.flow(0, C.cyan), ...say('FORWARD PASS: LEFT → RIGHT'));
  await play(
    ...trackVal(N2, v2, 1, 0, '0.6', C.cyan), ...trackVal(N2, v2, 1, 1, '0.9', C.cyan), ...trackVal(N2, v2, 1, 2, '0.3', C.cyan),
    ...N2.flow(1, C.amber)
  );
  await play(...trackVal(N2, v2, 2, 0, '0.5', C.amber));

  // 23: Loss measured -> backward pass right to left in pink
  const outP = N2.pos(2, 0);
  const lossTag = pill('loss', C.pink, P ? 17 : 16); lossTag.moveTo([outP[0], outP[1] - 0.8, 0]);
  act5Extra.push(lossTag);

  await until(S(23));
  await play(new M.FadeIn(lossTag, { runTime: 0.55 }), ...say('GRADIENTS FLOW BACKWARD (ORANGE)', C.amber));
  // Pulses traveling right-to-left: layer 2 -> layer 1
  const bp1 = [0, 1, 2].map(j => dotAt([outP[0] - netR, outP[1], 0.03], '#fb923c', 0.09));
  await play(...bp1.map((d, j) => {
    const dest = N2.pos(1, j);
    return new M.Transform(d, dotAt([dest[0] + netR, dest[1], 0.03], '#fb923c', 0.09), { runTime: 0.9 });
  }));
  // Pulses traveling right-to-left: layer 1 -> layer 0
  const bp2 = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const src = N2.pos(1, i), dst = N2.pos(0, j);
    bp2.push({ d: dotAt([src[0] - netR, src[1], 0.03], '#fb923c', 0.08), dst: [dst[0] + netR, dst[1], 0.03] });
  }
  await play(...fadeAll(bp1, 0.3), ...bp2.map(o => new M.Transform(o.d, dotAt(o.dst, '#fb923c', 0.08), { runTime: 0.9 })));
  await play(...fadeAll(bp2.map(o => o.d), 0.35));

  // 24: Need to increase selected weight by +0.0001
  const selLine2 = new M.Line({ start: [eStart[0] + netR, eStart[1], 0.02], end: [eEnd[0] - netR, eEnd[1], 0.02], color: C.amber, strokeWidth: 6 });
  const updTag = pill('w = 1  +0.0001', C.amber, P ? 17 : 16); updTag.moveTo([(eStart[0] + eEnd[0]) / 2, eStart[1] + 0.44, 0]);
  act5Extra.push(selLine2, updTag);

  await until(S(24));
  await play(new M.Create(selLine2, { runTime: 0.7 }), new M.FadeIn(updTag, { runTime: 0.7 }),
    ...fbox(['weight   w = 1', ['change = +0.0001', C.amber]], C.amber),
    ...say('NEEDED UPDATE: +0.0001', C.amber));

  // ===========================================================================
  // ACT 6 (25-38): Two number lines near 1 + Step-by-step iterations (1..10)
  // ===========================================================================
  const act6 = [];
  const nlW = P ? 6.2 : 7.0, nlX0 = CX - nlW / 2;
  const nlY16 = P ? -0.9 : 0.45, nlY32 = P ? -3.9 : -1.45;
  const val2x = v => nlX0 + ((v - 1.0) / 0.00115) * nlW;

  const line16 = new M.Line({ start: [nlX0 - 0.15, nlY16, 0], end: [nlX0 + nlW + 0.15, nlY16, 0], color: C.amber, strokeWidth: 3 });
  const line32 = new M.Line({ start: [nlX0 - 0.15, nlY32, 0], end: [nlX0 + nlW + 0.15, nlY32, 0], color: C.cyan, strokeWidth: 3 });
  const hd16 = T('16-bit', P ? 18 : 19, C.amber, true, true); hd16.moveTo([nlX0 + 0.5, nlY16 + 0.72, 0]);
  const hd32 = T('32-bit', P ? 18 : 19, C.cyan, true, true); hd32.moveTo([nlX0 + 0.5, nlY32 + 0.72, 0]);

  const ticks32 = Array.from({ length: 12 }, (_, k) => {
    const x = val2x(1.0 + k * 0.0001), maj = k === 0 || k === 10;
    return new M.Line({ start: [x, nlY32 - (maj ? 0.14 : 0.08), 0], end: [x, nlY32 + (maj ? 0.14 : 0.08), 0], color: C.cyan, strokeWidth: maj ? 3 : 1.5 });
  });
  const t32a = T('1.000', P ? 15 : 16, C.muted, true); t32a.moveTo([val2x(1.0), nlY32 - 0.36, 0]);
  const t32b = T('1.001', P ? 15 : 16, C.muted, true); t32b.moveTo([val2x(1.001), nlY32 - 0.36, 0]);

  const dot16 = dotAt([val2x(1.0), nlY16, 0.03], C.amber, 0.14);
  const dot32 = dotAt([val2x(1.0), nlY32, 0.03], C.cyan, 0.14);
  let lbl32 = T('1.0000', P ? 15 : 16, C.cyan, true, true); lbl32.moveTo([val2x(1.0), nlY32 + 0.36, 0]);
  act6.push(line16, line32, hd16, hd32, ...ticks32, t32a, t32b, dot16, dot32);

  await until(S(25));
  await play(new M.FadeOut(N2.group, { runTime: 0.5 }), ...fadeAll([...v2.values(), ...act5Extra], 0.5), ...clearBox(0.45),
    ...say('TWO NUMBER LINES NEAR 1'));
  await play(
    new M.Create(line16, { runTime: 0.7 }), new M.Create(line32, { runTime: 0.7 }),
    new M.FadeIn(hd16, { runTime: 0.6 }), new M.FadeIn(hd32, { runTime: 0.6 }),
    new M.FadeIn(new M.VGroup(...ticks32, t32a, t32b), { runTime: 0.7 }),
    new M.FadeIn(dot16, { runTime: 0.6 }), new M.FadeIn(dot32, { runTime: 0.6 }), new M.FadeIn(lbl32, { runTime: 0.6 })
  );

  // 26: On 16-bit line, neighboring marks are ~0.001 apart
  const t16a = new M.Line({ start: [val2x(1.0), nlY16 - 0.18, 0], end: [val2x(1.0), nlY16 + 0.18, 0], color: C.amber, strokeWidth: 3.5 });
  const t16b = new M.Line({ start: [val2x(1.001), nlY16 - 0.18, 0], end: [val2x(1.001), nlY16 + 0.18, 0], color: C.amber, strokeWidth: 3.5 });
  const l16a = T('1.000', P ? 15 : 16, C.amber, true); l16a.moveTo([val2x(1.0), nlY16 - 0.4, 0]);
  const l16b = T('1.001', P ? 15 : 16, C.amber, true); l16b.moveTo([val2x(1.001), nlY16 - 0.4, 0]);
  const gapLine = new M.DashedLine({ start: [val2x(1.0), nlY16 + 0.38, 0], end: [val2x(1.001), nlY16 + 0.38, 0], color: C.amber });
  const gapLbl = T('gap ≈ 0.001', P ? 15 : 16, C.amber, true); gapLbl.moveTo([(val2x(1.0) + val2x(1.001)) / 2, nlY16 + 0.66, 0]);
  act6.push(t16a, t16b, l16a, l16b, gapLine, gapLbl);

  await until(S(26));
  await play(new M.Create(t16a, { runTime: 0.5 }), new M.Create(t16b, { runTime: 0.5 }),
    new M.FadeIn(l16a, { runTime: 0.6 }), new M.FadeIn(l16b, { runTime: 0.6 }),
    new M.Create(gapLine, { runTime: 0.7 }), new M.FadeIn(gapLbl, { runTime: 0.7 }),
    ...say('16-BIT GAP ≈ 0.001', C.amber));

  // 27: Change +0.0001 is much smaller than the gap
  const tinyStep = new M.Line({ start: [val2x(1.0), nlY16 - 0.76, 0], end: [val2x(1.0001), nlY16 - 0.76, 0], color: C.pink, strokeWidth: 5 });
  const tinyLbl = T('+0.0001', P ? 17 : 16, C.pink, true, true); tinyLbl.moveTo([val2x(1.0001) + 0.55, nlY16 - 0.76, 0]);
  act6.push(tinyStep, tinyLbl);

  await until(S(27));
  await play(new M.Create(tinyStep, { runTime: 0.7 }), new M.FadeIn(tinyLbl, { runTime: 0.7 }),
    ...say('+0.0001 IS 10× SMALLER THAN THE GAP', C.pink));

  // 28: Step 1 -> 1.0001
  const newLbl32 = (s, v) => {
    const t = T(s, P ? 15 : 16, C.cyan, true, true); t.moveTo([val2x(v), nlY32 + 0.36, 0]);
    const a = [new M.FadeOut(lbl32, { runTime: 0.3 }), new M.FadeIn(t, { runTime: 0.35 })];
    lbl32 = t; return a;
  };
  await until(S(28));
  await play(
    new M.Transform(dot16, dotAt([val2x(1.0001), nlY16, 0.03], C.amber, 0.14), { runTime: 0.9 }),
    new M.Transform(dot32, dotAt([val2x(1.0001), nlY32, 0.03], C.cyan, 0.14), { runTime: 0.9 }),
    ...newLbl32('1.0001', 1.0001),
    ...fbox(['step 1', '1.0000 + 0.0001', ['= 1.0001', C.amber]], C.amber),
    ...say('STEP 1: 1 + 0.0001 = 1.0001', C.amber)
  );

  // 29: 16-bit rounds back to 1
  await until(S(29));
  await play(
    new M.Transform(dot16, dotAt([val2x(1.0), nlY16, 0.03], C.pink, 0.14), { pathArc: 1.0, runTime: 0.85 }),
    new M.Flash(dot16, { color: C.pink, runTime: 0.7 }),
    ...fbox(['step 1', ['16-bit: rounds → 1', C.pink], ['32-bit: 1.0001', C.cyan]], C.pink),
    ...say('16-BIT ROUNDS BACK TO 1', C.pink)
  );

  // 30: 32-bit keeps 1.0001
  const trail1 = dotAt([val2x(1.0001), nlY32, 0.01], C.cyan, 0.065); act6.push(trail1);
  await until(S(30));
  await play(new M.FadeIn(trail1, { runTime: 0.5 }), new M.Flash(dot32, { color: C.cyan, runTime: 0.8 }),
    ...say('32-BIT KEEPS 1.0001'));

  // 31: Step 2 -> 16-bit returns to 1 again
  await until(S(31));
  await play(new M.Transform(dot16, dotAt([val2x(1.0001), nlY16, 0.03], C.amber, 0.14), { runTime: 0.55 }),
    ...say('STEP 2: 16-BIT RETURNS TO 1', C.pink));
  await play(
    new M.Transform(dot16, dotAt([val2x(1.0), nlY16, 0.03], C.pink, 0.14), { pathArc: 1.0, runTime: 0.6 }),
    ...fbox(['step 2', ['16-bit: 1.0001 → 1', C.pink], ['32-bit: updating...', C.muted]], C.pink)
  );

  // 32: Step 2 -> 32-bit reaches 1.0002
  const trail2 = dotAt([val2x(1.0002), nlY32, 0.01], C.cyan, 0.065); act6.push(trail2);
  await until(S(32));
  await play(
    new M.Transform(dot32, dotAt([val2x(1.0002), nlY32, 0.03], C.cyan, 0.14), { runTime: 0.8 }),
    new M.FadeIn(trail2, { runTime: 0.5 }), ...newLbl32('1.0002', 1.0002),
    ...fbox(['step 2', ['16-bit: 1', C.pink], ['32-bit: 1.0002', C.cyan]], C.cyan),
    ...say('STEP 2: 32-BIT REACHES 1.0002')
  );

  // 33: Step 3 -> 16-bit still at 1
  await until(S(33));
  await play(new M.Transform(dot16, dotAt([val2x(1.0001), nlY16, 0.03], C.amber, 0.14), { runTime: 0.5 }),
    ...say('STEP 3: 16-BIT STILL AT 1', C.pink));
  await play(
    new M.Transform(dot16, dotAt([val2x(1.0), nlY16, 0.03], C.pink, 0.14), { pathArc: 1.0, runTime: 0.55 }),
    ...fbox(['step 3', ['16-bit: still 1', C.pink], ['32-bit: updating...', C.muted]], C.pink)
  );

  // 34: Step 3 -> 32-bit reaches 1.0003
  const trail3 = dotAt([val2x(1.0003), nlY32, 0.01], C.cyan, 0.065); act6.push(trail3);
  await until(S(34));
  await play(
    new M.Transform(dot32, dotAt([val2x(1.0003), nlY32, 0.03], C.cyan, 0.14), { runTime: 0.8 }),
    new M.FadeIn(trail3, { runTime: 0.5 }), ...newLbl32('1.0003', 1.0003),
    ...fbox(['step 3', ['16-bit: 1', C.pink], ['32-bit: 1.0003', C.cyan]], C.cyan),
    ...say('STEP 3: 32-BIT REACHES 1.0003')
  );

  // 35: Faster updates (steps 4..10)
  await until(S(35));
  await play(...say('STEPS 4 → 10: WATCH THEM SEPARATE', C.amber));
  for (let k = 4; k <= 10; k++) {
    const v = 1.0 + k * 0.0001, s = v.toFixed(4);
    const td = dotAt([val2x(v), nlY32, 0.01], C.cyan, 0.065); act6.push(td);
    const tNew = T(s, P ? 15 : 16, C.cyan, true, true); tNew.moveTo([val2x(v), nlY32 + 0.36, 0]);
    const oldL = lbl32; lbl32 = tNew;
    await play(
      new M.Transform(dot32, dotAt([val2x(v), nlY32, 0.03], C.cyan, 0.14), { runTime: 0.36 }),
      new M.FadeIn(td, { runTime: 0.25 }),
      new M.FadeOut(oldL, { runTime: 0.2 }), new M.FadeIn(tNew, { runTime: 0.25 }),
      ...fbox([`step ${k}`, ['16-bit: 1.0000', C.pink], [`32-bit: ${s}`, C.cyan]], C.cyan)
    );
  }
  act6.push(lbl32);

  // 36: After 10 updates, 16-bit is still 1
  const stuckTag = pill('STUCK AT 1', C.pink, P ? 17 : 16); stuckTag.moveTo([val2x(1.0) + 1.05, nlY16 + 0.02, 0]);
  act6.push(stuckTag);

  await until(S(36));
  await play(new M.FadeIn(stuckTag, { runTime: 0.6 }), new M.Flash(dot16, { color: C.pink, runTime: 0.7 }),
    ...fbox(['after 10 updates', ['16-bit: 1 (stuck)', C.pink], ['32-bit: 1.001', C.cyan]], C.pink),
    ...say('AFTER 10 UPDATES: 16-BIT = 1', C.pink));

  // 37: 32-bit reaches 1.001
  const sepLine = new M.DashedLine({ start: [val2x(1.001), nlY16 - 0.18, 0], end: [val2x(1.001), nlY32 + 0.18, 0], color: C.green });
  act6.push(sepLine);

  await until(S(37));
  await play(new M.Create(sepLine, { runTime: 0.7 }), new M.Flash(dot32, { color: C.cyan, runTime: 0.8 }),
    ...say('AFTER 10 UPDATES: 32-BIT = 1.001'));

  // 38: Every small update disappears in 16-bit
  await until(S(38));
  await play(new M.Indicate(stuckTag, { color: C.pink, runTime: 0.9 }),
    ...fbox(['direct 16-bit storage', ['10 × 0.0001 → lost', C.pink]], C.pink),
    ...say('SMALL UPDATES DISAPPEAR IN 16-BIT', C.pink));

  // ===========================================================================
  // ACT 7 (39-43): Mixed precision (32-bit main copy + 16-bit neural network)
  // ===========================================================================
  const act7 = [];
  const mcP = P ? [0, -2.0, 0] : [-5.1, -0.35, 0];
  const mcW = P ? 5.6 : 2.7, mcH = P ? 2.2 : 2.15;
  const mcCard = card(mcW, mcH, mcP, C.cyan, C.card, 0.96);
  const mcHead = T('32-bit Main Copy', P ? 17 : 17, C.cyan, true, true);
  mcHead.moveTo([mcP[0], mcP[1] + (P ? 0.55 : 0.6), 0]);
  let mcVal = T('w = 1.0000', P ? 19 : 19, C.ink, true);
  mcVal.moveTo([mcP[0], mcP[1] - (P ? 0.22 : 0.15), 0]);
  act7.push(mcCard, mcHead);

  await until(S(39));
  await play(...fadeAll(act6, 0.5), ...clearBox(0.45), ...say('KEEP MAIN WEIGHTS IN 32-BIT'));
  await play(new M.FadeIn(mcCard, { runTime: 0.7 }), new M.FadeIn(mcHead, { runTime: 0.7 }), new M.FadeIn(mcVal, { runTime: 0.7 }),
    ...fbox([['main weights: 32-bit', C.cyan]], C.cyan));

  // 40: 16-bit for the large multiplications inside the network
  const n3C = P ? [0, -5.1, 0] : [-0.45, -0.35, 0];
  const N3 = net({ layers: [2, 3, 1], center: n3C, width: P ? 4.3 : 3.7, height: P ? 1.6 : 2.5, r: 0.24, color: C.amber });
  const n3Lbl = T('16-bit multiplications', P ? 16 : 16, C.amber, true, true);
  n3Lbl.moveTo([n3C[0], n3C[1] - (P ? 1.3 : 1.7), 0]);
  const arrTo16 = P
    ? new M.Arrow({ start: [-1.15, mcP[1] - mcH / 2 - 0.05, 0], end: [-1.15, n3C[1] + (P ? 1.1 : 1.48), 0], color: C.amber, strokeWidth: 3 })
    : new M.Arrow({ start: [mcP[0] + mcW / 2 + 0.08, 0.22, 0], end: [n3C[0] - 2.0, 0.22, 0], color: C.amber, strokeWidth: 3 });
  const arr16Lbl = T('16-bit', P ? 15 : 15, C.amber, true);
  arr16Lbl.moveTo(P ? [-1.95, (mcP[1] - mcH / 2 + n3C[1] + (P ? 1.1 : 1.48)) / 2, 0] : [(mcP[0] + mcW / 2 + n3C[0] - 2.0) / 2, 0.6, 0]);
  act7.push(n3Lbl, arrTo16, arr16Lbl);

  await until(S(40));
  await play(new M.FadeIn(N3.group, { runTime: 0.8 }), new M.FadeIn(n3Lbl, { runTime: 0.6 }),
    new M.FadeIn(arrTo16, { runTime: 0.6 }), new M.FadeIn(arr16Lbl, { runTime: 0.6 }),
    ...fbox([['main weights: 32-bit', C.cyan], ['multiplies:   16-bit', C.amber]], C.amber),
    ...say('FAST MULTIPLIES IN 16-BIT', C.amber));
  await play(...N3.flow(0, C.amber));
  await play(...N3.flow(1, C.amber));

  // 41: Keep weight updates and sums in 32-bit
  const arrBack32 = P
    ? new M.Arrow({ start: [1.15, n3C[1] + (P ? 1.1 : 1.48), 0], end: [1.15, mcP[1] - mcH / 2 - 0.05, 0], color: C.green, strokeWidth: 3 })
    : new M.Arrow({ start: [n3C[0] - 2.0, -0.88, 0], end: [mcP[0] + mcW / 2 + 0.08, -0.88, 0], color: C.green, strokeWidth: 3 });
  const arr32Lbl = T('32-bit update', P ? 16 : 15, C.green, true);
  arr32Lbl.moveTo(P ? [2.35, (mcP[1] - mcH / 2 + n3C[1] + (P ? 1.1 : 1.48)) / 2, 0] : [(mcP[0] + mcW / 2 + n3C[0] - 2.15) / 2, -1.2, 0]);
  const mcValNew = T('w = 1.0001 ✓', P ? 19 : 19, C.green, true, true);
  mcValNew.moveTo([mcP[0], mcP[1] - (P ? 0.22 : 0.15), 0]);
  act7.push(arrBack32, arr32Lbl, mcValNew);

  await until(S(41));
  await play(new M.FadeIn(arrBack32, { runTime: 0.7 }), new M.FadeIn(arr32Lbl, { runTime: 0.7 }),
    new M.FadeOut(mcVal, { runTime: 0.4 }), new M.FadeIn(mcValNew, { runTime: 0.7 }),
    new M.Flash(mcValNew, { color: C.green, runTime: 0.7 }),
    ...fbox([['main weights: 32-bit', C.cyan], ['multiplies:   16-bit', C.amber], ['updates/sums: 32-bit', C.green]], C.green),
    ...say('UPDATES & SUMS IN 32-BIT', C.green));

  // 42: Mixed precision
  await until(S(42));
  await play(new M.Indicate(mcCard, { color: C.cyan, runTime: 0.9 }), new M.Indicate(n3Lbl, { color: C.amber, runTime: 0.9 }),
    ...say('MIXED PRECISION', C.green));

  // 43: Reduces memory and speeds up training
  await until(S(43));
  await play(...fbox([['MIXED PRECISION', C.green], '• less memory', '• faster training', '• small changes kept'], C.green),
    ...say('LESS MEMORY + FASTER TRAINING', C.green));

  // ===========================================================================
  // ACT 8 (44-54): Trap (tiny gradients -> 0) & Loss scaling (× 1,024 / ÷ 1,024)
  // ===========================================================================
  const act8 = [];
  const scW = P ? 6.8 : 7.4, scX0 = CX - scW / 2, scY = P ? -3.0 : -0.75;
  // Log scale positions along [scX0, scX0 + scW]: 0 on far left, 1e-8 at 20%, 6e-8 wall at 38%, 1e-5 at 78%
  const xZero = scX0 + scW * 0.04;
  const xTiny = scX0 + scW * 0.21;
  const xWall = scX0 + scW * 0.39;
  const xScaled = scX0 + scW * 0.80;

  const scLine = new M.Line({ start: [scX0, scY, 0], end: [scX0 + scW, scY, 0], color: C.muted, strokeWidth: 3 });
  const scLbl0 = T('0', P ? 17 : 17, C.pink, true, true); scLbl0.moveTo([xZero, scY - 0.58, 0]);
  const scTitle = T('Gradient size (positive numbers)', P ? 16 : 18, C.muted); scTitle.moveTo([CX, scY - 0.95, 0]);
  act8.push(scLine, scLbl0, scTitle);
  const gradRem = card(P ? 7.0 : 6.8, P ? 1.0 : 0.9, [CX, scY + 1.55, 0], C.cyan, C.card, 0.95);
  const gradRemT = T(P ? 'gradient: weight change → loss change' : 'weight change  →  loss change  =  gradient', P ? 16 : 17, C.cyan, true);
  gradRemT.moveTo([CX, scY + 1.55, 0]);

  await until(S(44));
  await play(new M.FadeOut(N3.group, { runTime: 0.5 }), ...fadeAll(act7, 0.5), ...clearBox(0.45),
    ...say('TRAP: VERY SMALL GRADIENTS', C.pink));
  await play(new M.Create(scLine, { runTime: 0.7 }), new M.FadeIn(scLbl0, { runTime: 0.6 }), new M.FadeIn(scTitle, { runTime: 0.6 }),
    new M.FadeIn(gradRem, { runTime: 0.7 }), new M.FadeIn(gradRemT, { runTime: 0.7 }));

  // 45: Reminder — what a gradient measures (shown from 44, so the frame is never empty)

  await until(S(45));
  await play(new M.Indicate(gradRem, { color: C.cyan, runTime: 0.9 }), ...say('GRADIENT = HOW WEIGHT AFFECTS LOSS'));

  // 46: 16-bit smallest positive ≈ 0.00000006
  const zoneLost = rectAt(xWall - scX0, 0.58, [(scX0 + xWall) / 2, scY, -0.01], C.pink, 0.16);
  const zoneSafe = rectAt(scX0 + scW - xWall, 0.58, [(xWall + scX0 + scW) / 2, scY, -0.01], C.green, 0.14);
  const wall = new M.DashedLine({ start: [xWall, scY - 0.7, 0], end: [xWall, scY + 1.1, 0], color: C.pink });
  const wallLbl = T('0.00000006\n(16-bit floor)', P ? 16 : 16, C.pink, true); wallLbl.moveTo([xWall, scY + 1.48, 0]);
  const safeLbl = T('16-bit can store', P ? 16 : 16, C.green, true); safeLbl.moveTo([(xWall + scX0 + scW) / 2, scY - 0.58, 0]);
  act8.push(zoneLost, zoneSafe, wall, wallLbl, safeLbl);

  await until(S(46));
  await play(new M.FadeOut(gradRem, { runTime: 0.4 }), new M.FadeOut(gradRemT, { runTime: 0.4 }),
    new M.FadeIn(zoneLost, { runTime: 0.7 }), new M.FadeIn(zoneSafe, { runTime: 0.7 }),
    new M.Create(wall, { runTime: 0.7 }), new M.FadeIn(wallLbl, { runTime: 0.7 }), new M.FadeIn(safeLbl, { runTime: 0.7 }),
    ...fbox(['16-bit smallest > 0', ['≈ 0.00000006', C.pink]], C.pink),
    ...say('16-BIT FLOOR ≈ 0.00000006', C.pink));

  // 47: Gradient of 0.00000001 becomes 0
  const gDot = dotAt([xTiny, scY, 0.03], C.amber, 0.14);
  const gStartLbl = T('0.00000001', P ? 16 : 15, C.amber, true); gStartLbl.moveTo([xTiny, scY + 0.48, 0]);
  const lostLbl = pill('→ 0 (LOST)', C.pink, P ? 17 : 16); lostLbl.moveTo([xZero + 0.85, scY - 1.5, 0]);
  act8.push(gDot, lostLbl);

  await until(S(47));
  await play(new M.FadeIn(gDot, { runTime: 0.55 }), new M.FadeIn(gStartLbl, { runTime: 0.55 }),
    ...say('0.00000001 → 0: THE WEIGHT STOPS LEARNING', C.pink));
  await play(
    new M.Transform(gDot, dotAt([xZero, scY, 0.03], C.pink, 0.14), { runTime: 0.8 }),
    new M.Flash(gDot, { color: C.pink, runTime: 0.65 }), new M.FadeIn(lostLbl, { runTime: 0.6 }),
    ...fbox(['gradient = 0.00000001', ['in 16-bit → 0 (lost!)', C.pink]], C.pink)
  );

  // 48: Multiply loss by 1,024 before calculating gradients
  const scaleBadge = pill('loss × 1,024', C.amber, 17); scaleBadge.moveTo([CX, scY + 2.15, 0]);
  act8.push(scaleBadge);

  await until(S(48));
  await play(
    new M.FadeOut(lostLbl, { runTime: 0.4 }),
    new M.Transform(gDot, dotAt([xTiny, scY, 0.03], C.amber, 0.14), { runTime: 0.7 }),
    new M.FadeIn(scaleBadge, { runTime: 0.7 }),
    ...fbox(['loss × 1,024', ['before gradients', C.amber]], C.amber),
    ...say('MULTIPLY LOSS BY 1,024', C.amber)
  );

  // 49: Gradient becomes 1,024 times larger -> ≈ 0.00001
  const gScaledLbl = T('≈ 0.00001', P ? 15 : 16, C.green, true, true); gScaledLbl.moveTo([xScaled, scY + 0.5, 0]);
  const jumpLbl = T('× 1,024', P ? 15 : 16, C.amber, true, true); jumpLbl.moveTo([(xTiny + xScaled) / 2, scY + 0.9, 0]);
  act8.push(gScaledLbl, jumpLbl, gStartLbl);

  await until(S(49));
  await play(
    new M.Transform(gDot, dotAt([xScaled, scY, 0.03], C.green, 0.15), { pathArc: -0.75, runTime: 1.25 }),
    new M.FadeIn(jumpLbl, { runTime: 0.7 }), new M.FadeIn(gScaledLbl, { runTime: 0.7 }),
    ...fbox(['0.00000001 × 1,024', ['≈ 0.00001', C.green]], C.green),
    ...say('SCALED GRADIENT ≈ 0.00001', C.green)
  );

  // 50: 16-bit can now store this larger gradient
  const safeCheck = pill('STORED IN 16-BIT ✓', C.green, P ? 17 : 16); safeCheck.moveTo([xScaled - 0.2, scY - 1.5, 0]);
  act8.push(safeCheck);

  await until(S(50));
  await play(new M.Flash(gDot, { color: C.green, runTime: 0.8 }), new M.FadeIn(safeCheck, { runTime: 0.7 }),
    ...say('SAFE INSIDE 16-BIT RANGE', C.green));

  // 51: Loss scaling
  await until(S(51));
  await play(new M.Indicate(scaleBadge, { color: C.amber, runTime: 0.8 }), ...say('LOSS SCALING', C.amber));

  // 52: Formula
  await until(S(52));
  await play(
    ...fbox([['restored gradient =', C.ink], ['  scaled gradient', C.amber], ['  ÷ loss multiplier', C.cyan]], C.cyan),
    ...say('RESTORED = SCALED ÷ MULTIPLIER')
  );

  // 53: Divide in 32-bit before updating the weight
  const unscaleY = scY - 2.25;
  const unscaleCard = card(P ? 7.0 : 6.6, 0.82, [CX, unscaleY, 0], C.cyan, C.card, 0.95);
  const unscaleTxt = T(P ? '0.00001024 ÷ 1,024 = 0.00000001' : '32-bit: 0.00001024 ÷ 1,024 = 0.00000001', P ? 16 : 16, C.cyan, true);
  unscaleTxt.moveTo([CX, unscaleY, 0]);
  act8.push(unscaleCard, unscaleTxt);

  await until(S(53));
  await play(new M.FadeIn(unscaleCard, { runTime: 0.7 }), new M.FadeIn(unscaleTxt, { runTime: 0.7 }),
    ...fbox([['in 32-bit:', C.cyan], '0.00001024 ÷ 1,024', ['= 0.00000001 (exact)', C.green]], C.green),
    ...say('DIVIDE BY 1,024 IN 32-BIT'));
  await until(S(53) + 0.5 * (E(53) - S(53)));
  await play(...fbox([['another 16-bit format:', C.violet], 'wider range,', ['often no loss scaling', C.violet]], C.violet),
    ...say('ANOTHER 16-BIT FORMAT: WIDER RANGE', C.violet));

  // 54: Final summary
  const sumItems = [
    ['16-bit math', 'Save memory & speed up', C.amber],
    ['32-bit main copy', 'Protect small weight changes', C.cyan],
    ['Loss scaling (×1,024)', 'Keep tiny gradients alive', C.green]
  ];
  const sumCards = sumItems.map(([head, desc, col], k) => {
    const p = [CX, (P ? -0.5 : 0.65) - k * (P ? 1.75 : 1.3), 0];
    const r = card(P ? 7.0 : 6.8, P ? 1.4 : 1.0, p, col, C.card, 0.96);
    const t1 = T(head, P ? 19 : 19, col, true, true); t1.moveTo([p[0], p[1] + (P ? 0.3 : 0.22), 0]);
    const t2 = T(desc, P ? 17 : 16, C.ink); t2.moveTo([p[0], p[1] - (P ? 0.3 : 0.22), 0]);
    return new M.VGroup(r, t1, t2);
  });

  await until(S(54));
  await play(...fadeAll(act8.filter(m => m !== lostLbl), 0.55), ...say('SAVE MEMORY · PROTECT SMALL CHANGES', C.green));
  await play(
    new M.LaggedStart(sumCards.map(c => new M.FadeIn(c)), { lagRatio: 0.2, runTime: 1.4 }),
    ...fbox([['MIXED PRECISION', C.green], '16-bit: big math', '32-bit: main + updates', '×1,024: tiny gradients'], C.green)
  );
}
