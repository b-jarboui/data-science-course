// 2.1.6 Box plots: the middle half in a box.
// Beat i = sentence i (0-based, 0..47). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  // Exact Saturday library visits from chapters/2.1.md (sorted, with purpose colour)
  // borrow: cyan (7), computer: violet (5), study: amber (9), event: pink (3)
  const VISITS = [
    [5, C.cyan], [8, C.cyan], [10, C.cyan], [10, C.cyan], [12, C.cyan], [15, C.cyan], [15, C.cyan],
    [20, C.violet], [25, C.violet], [30, C.violet], [30, C.violet], [35, C.violet],
    [40, C.amber], [45, C.amber], [50, C.amber], [55, C.amber], [60, C.amber], [60, C.amber], [75, C.amber],
    [85, C.pink], [90, C.amber], [90, C.pink], [95, C.pink], [160, C.amber],
  ];
  const VALS = VISITS.map(v => v[0]);

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) & phone (8 x 14.22, y in [-5.5, 4.3])
  const PILL = P ? [0, 3.88, 0] : [0, 2.0, 0];
  const BOXP = P ? [0, -4.55, 0] : [0, -2.15, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // One formula box at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = 20, lh = P ? 0.4 : 0.38;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.7 : 9.6;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old)];
  }

  // Helper: glowing visitor dot
  function glowDot(p, color, r = 0.09) {
    const halo = new M.Dot({ point: p, radius: r * 2.1, color }); halo.setFill(color, 0.18);
    const d = new M.Dot({ point: p, radius: r, color }); d.setFill(color, 1);
    return new M.VGroup(halo, d);
  }
  // Helper: horizontal span bar |---- label ----|
  function spanBar(x1, x2, y, color, label = '', above = true) {
    const ln = new M.Line({ start: [x1, y, 0], end: [x2, y, 0], color, strokeWidth: 2.5 });
    const t1 = new M.Line({ start: [x1, y - 0.09, 0], end: [x1, y + 0.09, 0], color, strokeWidth: 2.5 });
    const t2 = new M.Line({ start: [x2, y - 0.09, 0], end: [x2, y + 0.09, 0], color, strokeWidth: 2.5 });
    const parts = [ln, t1, t2];
    if (label) {
      const lb = T(label, P ? 15 : 16, color, true);
      lb.moveTo([(x1 + x2) / 2, y + (above ? 0.24 : -0.24), 0]);
      parts.push(lb);
    }
    return new M.VGroup(...parts);
  }

  // === 0-1: Saturday library situation & question ===
  const introDots = VISITS.map(([, col], k) => {
    const c = k % 6, r = Math.floor(k / 6);
    const gx = P ? (c - 2.5) * 0.72 : -3.2 + (c - 2.5) * 0.68;
    const gy = P ? 2.1 - (r - 1.5) * 0.62 : -0.15 - (r - 1.5) * 0.56;
    return glowDot([gx, gy, 0], col, P ? 0.12 : 0.11);
  });
  const introSub = T('24 Saturday visits', P ? 19 : 18, C.muted);
  introSub.moveTo(P ? [0, 0.72, 0] : [-3.2, -1.55, 0]);
  const introArrow = new M.Arrow({
    start: P ? [0, 0.35, 0] : [-0.7, -0.15, 0],
    end: P ? [0, -0.55, 0] : [0.7, -0.15, 0],
    color: C.muted, strokeWidth: 2.5
  });
  const framePos = P ? [0, -3.15, 0] : [3.4, -0.15, 0];
  const frameW = P ? 5.8 : 4.6, frameH = P ? 2.15 : 1.9;
  const introFrame = new M.RoundedRectangle({ width: frameW, height: frameH, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2 });
  introFrame.setFill(C.card, 0.75); introFrame.moveTo(framePos);
  const introFrameTxt = T('one small picture', P ? 20 : 19, C.cyan);
  introFrameTxt.moveTo([framePos[0], framePos[1] + frameH / 2 + 0.3, 0]);

  // 0
  await until(S(0));
  await play(
    new M.LaggedStart(introDots.map(d => new M.FadeIn(d)), { lagRatio: 0.04, runTime: 1.4 }),
    new M.FadeIn(introSub), new M.Create(introArrow), new M.Create(introFrame), new M.FadeIn(introFrameTxt),
    ...say('SATURDAY LIBRARY: 24 VISITS')
  );

  // 1
  const qBand = new M.RoundedRectangle({ width: frameW * 0.36, height: 0.52, cornerRadius: 0.08, color: C.cyan, strokeWidth: 2 });
  qBand.setFill(C.cyan, 0.2); qBand.moveTo([framePos[0] - frameW * 0.12, framePos[1], 0]);
  const qBandTxt = T('typical?', P ? 17 : 16, C.cyan, true);
  qBandTxt.moveTo([framePos[0] - frameW * 0.12, framePos[1] - 0.52, 0]);
  const qOut = glowDot([framePos[0] + frameW * 0.34, framePos[1], 0], C.pink, 0.11);
  const qOutTxt = T('long?', P ? 17 : 16, C.pink, true);
  qOutTxt.moveTo([framePos[0] + frameW * 0.34, framePos[1] - 0.52, 0]);
  await until(S(1));
  await play(
    new M.FadeIn(qBand), new M.FadeIn(qBandTxt), new M.FadeIn(qOut), new M.FadeIn(qOutTxt),
    new M.Indicate(introDots[23], { color: C.pink }),
    ...say('TYPICAL VISITS?  ANY UNUSUALLY LONG?', C.amber)
  );

  // === 2-13: 24 sorted visits, median, and quartiles ===
  const chipPos = k => P
    ? [(k % 12 - 5.5) * 0.58, k < 12 ? 0.55 : -1.05, 0]
    : [(k - 11.5) * 0.54, 0.32, 0];
  const chips = VISITS.map(([v, col], k) => {
    const [x, y] = chipPos(k);
    const d = glowDot([x, y + 0.28, 0], col, P ? 0.085 : 0.08);
    const n = T(String(v), P ? 15 : 15, C.ink, true);
    n.moveTo([x, y - 0.1, 0]);
    return new M.VGroup(d, n);
  });
  const legItems = [['borrow', C.cyan], ['computer', C.violet], ['study', C.amber], ['event', C.pink]];
  const legSp = P ? 1.75 : 2.3;
  const legY = P ? -2.75 : -1.12;
  const legend = new M.VGroup(...legItems.flatMap(([name, col], i) => {
    const lx = (i - 1.5) * legSp;
    const dt = new M.Dot({ point: [lx - 0.48, legY, 0], radius: 0.07, color: col }); dt.setFill(col, 1);
    const tx = T(name, P ? 15 : 16, col); tx.moveTo([lx + 0.12, legY, 0]);
    return [dt, tx];
  }));

  // 2
  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(...introDots, introSub, introArrow, introFrame, introFrameTxt, qBand, qBandTxt, qOut, qOutTxt)),
    new M.LaggedStart(chips.map(c => new M.FadeIn(c)), { lagRatio: 0.04, runTime: 1.8 }),
    new M.FadeIn(legend),
    ...say('24 VISITS, SHORTEST TO LONGEST (MIN)')
  );

  // 3: split into two halves of 12
  const medCut = P
    ? new M.DashedLine({ start: [-3.5, -0.22, 0], end: [3.5, -0.22, 0], color: C.amber, strokeWidth: 2.5 })
    : new M.DashedLine({ start: [0, -0.22, 0], end: [0, 0.96, 0], color: C.amber, strokeWidth: 2.5 });
  const halfLabs = P
    ? new M.VGroup(
        T('lower 12', 17, C.cyan, true).moveTo([0, 1.25, 0]),
        T('upper 12', 17, C.violet, true).moveTo([0, -1.78, 0])
      )
    : new M.VGroup(
        spanBar(chipPos(0)[0] - 0.2, chipPos(11)[0] + 0.2, -0.46, C.cyan, 'lower 12', false),
        spanBar(chipPos(12)[0] - 0.2, chipPos(23)[0] + 0.2, -0.46, C.violet, 'upper 12', false)
      );
  await until(S(3));
  await play(new M.Create(medCut), new M.FadeIn(halfLabs), ...say('SPLIT INTO TWO HALVES OF 12', C.amber));

  // 4: middle two visits 35 and 40
  const ringAt = (k, col) => {
    const [x, y] = chipPos(k);
    const r = new M.RoundedRectangle({ width: 0.48, height: 0.82, cornerRadius: 0.1, color: col, strokeWidth: 2.5 });
    r.moveTo([x, y + 0.08, 0]);
    return r;
  };
  const midRings = new M.VGroup(ringAt(11, C.amber), ringAt(12, C.amber));
  await until(S(4));
  await play(
    new M.Create(midRings), new M.Indicate(chips[11], { color: C.amber }), new M.Indicate(chips[12], { color: C.amber }),
    ...fbox(['middle two = 35 and 40', ['12th and 13th visits', C.muted]], C.amber),
    ...say('AT THE SPLIT: 35 AND 40 MIN', C.amber)
  );

  // 5: halfway is 37.5
  const medBadgePos = P ? [0, -0.22, 0] : [0, 1.26, 0];
  const medBadge = pill('37.5', C.amber, 17); medBadge.moveTo(medBadgePos);
  await until(S(5));
  await play(
    new M.FadeIn(medBadge),
    ...fbox(['middle two = 35 and 40', ['(35 + 40) ÷ 2 = 37.5 min', C.amber]], C.amber),
    ...say('HALFWAY = 37.5 MINUTES', C.amber)
  );

  // 6: called the median
  const medBadge2 = pill('median = 37.5', C.amber, 17); medBadge2.moveTo(medBadgePos);
  await until(S(6));
  await play(
    new M.FadeOut(medBadge), new M.FadeIn(medBadge2),
    ...fbox([['median = 37.5 min', C.amber], ['middle mark of all 24', C.muted]], C.amber),
    ...say('MEDIAN = 37.5 MINUTES', C.amber)
  );

  // 7: split each half of 12 into groups of 6
  const q1X = (chipPos(5)[0] + chipPos(6)[0]) / 2;
  const q3X = (chipPos(17)[0] + chipPos(18)[0]) / 2;
  const q1Cut = P
    ? new M.DashedLine({ start: [q1X, 0.12, 0], end: [q1X, 1.12, 0], color: C.cyan, strokeWidth: 2.5 })
    : new M.DashedLine({ start: [q1X, -0.22, 0], end: [q1X, 0.96, 0], color: C.cyan, strokeWidth: 2.5 });
  const q3Cut = P
    ? new M.DashedLine({ start: [q3X, -1.48, 0], end: [q3X, -0.48, 0], color: C.violet, strokeWidth: 2.5 })
    : new M.DashedLine({ start: [q3X, -0.22, 0], end: [q3X, 0.96, 0], color: C.violet, strokeWidth: 2.5 });
  await until(S(7));
  await play(
    new M.FadeOut(new M.VGroup(halfLabs, midRings)),
    new M.Create(q1Cut), new M.Create(q3Cut),
    ...say('SPLIT EACH HALF OF 12 INTO 6 AND 6', C.cyan)
  );

  // 8: lower twelve middle = 15 and 15 -> 15
  const q1Rings = new M.VGroup(ringAt(5, C.cyan), ringAt(6, C.cyan));
  const q1BadgePos = P ? [q1X, 1.38, 0] : [q1X, 1.26, 0];
  const q1Badge = pill('15', C.cyan, 17); q1Badge.moveTo(q1BadgePos);
  await until(S(8));
  await play(
    new M.Create(q1Rings), new M.FadeIn(q1Badge),
    new M.Indicate(chips[5], { color: C.cyan }), new M.Indicate(chips[6], { color: C.cyan }),
    ...fbox(['lower 12 middle = 15 and 15', ['cut = 15 min', C.cyan]], C.cyan),
    ...say('LOWER HALF CUT = 15 MINUTES', C.cyan)
  );

  // 9: upper twelve middle = 60 and 75
  const q3Rings = new M.VGroup(ringAt(17, C.violet), ringAt(18, C.violet));
  await until(S(9));
  await play(
    new M.FadeOut(q1Rings), new M.Create(q3Rings),
    new M.Indicate(chips[17], { color: C.violet }), new M.Indicate(chips[18], { color: C.violet }),
    ...fbox(['upper 12 middle = 60 and 75', ['gap = 75 − 60 = 15 min', C.muted]], C.violet),
    ...say('UPPER HALF MIDDLE: 60 AND 75', C.violet)
  );

  // 10: halfway is 67.5
  const q3BadgePos = P ? [q3X, -1.82, 0] : [q3X, 1.26, 0];
  const q3Badge = pill('67.5', C.violet, 17); q3Badge.moveTo(q3BadgePos);
  await until(S(10));
  await play(
    new M.FadeIn(q3Badge),
    ...fbox(['upper 12 middle = 60 and 75', ['(60 + 75) ÷ 2 = 67.5 min', C.violet]], C.violet),
    ...say('UPPER HALF CUT = 67.5 MINUTES', C.violet)
  );

  // 11: three cuts divide into four quarters of 6
  const qGroups = P
    ? new M.VGroup(
        spanBar(chipPos(0)[0] - 0.18, chipPos(5)[0] + 0.18, 1.05, C.green, '6', true),
        spanBar(chipPos(6)[0] - 0.18, chipPos(11)[0] + 0.18, 1.05, C.green, '6', true),
        spanBar(chipPos(12)[0] - 0.18, chipPos(17)[0] + 0.18, -1.46, C.green, '6', false),
        spanBar(chipPos(18)[0] - 0.18, chipPos(23)[0] + 0.18, -1.46, C.green, '6', false)
      )
    : new M.VGroup(
        spanBar(chipPos(0)[0] - 0.18, chipPos(5)[0] + 0.18, -0.44, C.green, '6', false),
        spanBar(chipPos(6)[0] - 0.18, chipPos(11)[0] + 0.18, -0.44, C.green, '6', false),
        spanBar(chipPos(12)[0] - 0.18, chipPos(17)[0] + 0.18, -0.44, C.green, '6', false),
        spanBar(chipPos(18)[0] - 0.18, chipPos(23)[0] + 0.18, -0.44, C.green, '6', false)
      );
  await until(S(11));
  await play(new M.FadeOut(q3Rings), new M.FadeIn(qGroups), ...say('3 CUTS → 4 QUARTERS OF 6 VISITS', C.green));

  // 12: each cut is a quartile
  await until(S(12));
  await play(
    new M.Indicate(q1Cut, { color: C.green }), new M.Indicate(medCut, { color: C.green }), new M.Indicate(q3Cut, { color: C.green }),
    ...fbox([['quartile = quarter cut', C.green], ['3 cuts make 4 equal quarters', C.muted]], C.green),
    ...say('EACH CUT IS A QUARTILE', C.green)
  );

  // 13: Q1 = 15, Q2 = 37.5, Q3 = 67.5
  const q1Badge2 = pill('Q1 = 15', C.cyan, 16); q1Badge2.moveTo(q1BadgePos);
  const medBadge3 = pill('Q2 = 37.5', C.amber, 16); medBadge3.moveTo(medBadgePos);
  const q3Badge2 = pill('Q3 = 67.5', C.violet, 16); q3Badge2.moveTo(q3BadgePos);
  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(q1Badge, medBadge2, q3Badge)),
    new M.FadeIn(q1Badge2), new M.FadeIn(medBadge3), new M.FadeIn(q3Badge2),
    ...fbox([['Q1 (first)  = 15', C.cyan], ['Q2 (median) = 37.5', C.amber], ['Q3 (third)  = 67.5', C.violet]], C.cyan),
    ...say('Q1 = 15   ·   Q2 = 37.5   ·   Q3 = 67.5')
  );

  // === 14-38: Build the box plot on the 0-180 minutes axis ===
  const X0 = P ? -3.15 : -5.8, X1 = P ? 3.55 : 6.2, L0 = X1 - X0;
  const n2x = v => X0 + (v / 180) * L0;
  const BOX_Y = P ? 0.45 : 0.65, BH = P ? 1.12 : 0.8;
  const DOT_Y = P ? -1.55 : -0.55, AXIS_Y = P ? -1.9 : -0.82;

  function makeAxis(y, showUnit = true) {
    const ln = new M.Line({ start: [X0, y, 0], end: [X1, y, 0], color: C.muted, strokeWidth: 2.5 });
    const step = P ? 30 : 20;
    const parts = [];
    for (let v = 0; v <= 180; v += step) {
      const tx = n2x(v);
      parts.push(
        new M.Line({ start: [tx, y - 0.08, 0], end: [tx, y + 0.08, 0], color: C.muted, strokeWidth: 2 }),
        T(String(v), P ? 15 : 16, C.muted, true).moveTo([tx, y - 0.3, 0])
      );
    }
    if (showUnit) {
      const u = T('minutes', P ? 15 : 16, C.muted);
      u.moveTo([X1 - 0.35, y - (P ? 0.62 : 0.56), 0]);
      parts.push(u);
    }
    return { ln, ticks: new M.VGroup(...parts) };
  }

  const mainAxis = makeAxis(AXIS_Y);
  const axisDots = VISITS.map(([v, col], k) => {
    const dup = VALS.slice(0, k).filter(x => x === v).length;
    return glowDot([n2x(v), DOT_Y + dup * 0.22, 0], col, P ? 0.065 : 0.075);
  });

  // Persistent Saturday box plot elements
  const q1x = n2x(15), q2x = n2x(37.5), q3x = n2x(67.5);
  const boxRect = new M.Rectangle({ width: q3x - q1x, height: BH, color: C.cyan, strokeWidth: 3 });
  boxRect.setFill(C.cyan, 0.22); boxRect.moveTo([(q1x + q3x) / 2, BOX_Y, 0]);
  const medLine = new M.Line({ start: [q2x, BOX_Y - BH / 2, 0], end: [q2x, BOX_Y + BH / 2, 0], color: C.amber, strokeWidth: 4 });
  const q1Txt = T('15', 18, C.cyan, true); q1Txt.moveTo([q1x - (P ? 0.07 : 0), BOX_Y + BH / 2 + 0.28, 0]);
  const q2Txt = T('37.5', 18, C.amber, true); q2Txt.moveTo([q2x, BOX_Y + BH / 2 + 0.28, 0]);
  const q3Txt = T('67.5', 18, C.violet, true); q3Txt.moveTo([q3x, BOX_Y + BH / 2 + 0.28, 0]);

  // 14
  await until(S(14));
  await play(
    new M.FadeOut(new M.VGroup(...chips, legend, medCut, q1Cut, q3Cut, q1Badge2, medBadge3, q3Badge2, qGroups)),
    new M.Create(mainAxis.ln), new M.FadeIn(mainAxis.ticks),
    new M.LaggedStart(axisDots.map(d => new M.FadeIn(d)), { lagRatio: 0.02, runTime: 1.0 }),
    new M.Create(boxRect), new M.Create(medLine),
    new M.FadeIn(q1Txt), new M.FadeIn(q2Txt), new M.FadeIn(q3Txt),
    ...fbox([['Box edges: 15 and 67.5 min', C.cyan], ['Middle line: 37.5 min', C.amber]], C.cyan),
    ...say('BOX FROM Q1 (15) TO Q3 (67.5)')
  );

  // 15: middle 12 visits
  const mid12Guides = new M.VGroup(
    new M.DashedLine({ start: [q1x, DOT_Y - 0.1, 0], end: [q1x, BOX_Y - BH / 2, 0], color: C.cyan, strokeWidth: 1.8 }),
    new M.DashedLine({ start: [q3x, DOT_Y - 0.1, 0], end: [q3x, BOX_Y - BH / 2, 0], color: C.violet, strokeWidth: 1.8 }),
    T('middle 12', P ? 15 : 17, C.ink, true).moveTo([(q1x + q3x) / 2, BOX_Y + BH / 2 + 0.62, 0])
  );
  await until(S(15));
  await play(
    new M.FadeIn(mid12Guides),
    new M.LaggedStart(axisDots.slice(6, 18).map(d => new M.Indicate(d, { color: C.cyan })), { lagRatio: 0.05, runTime: 1.3 }),
    ...fbox([['box = middle 12 of 24 visits', C.cyan], ['half of all Saturday visits', C.muted]], C.cyan),
    ...say('BOX COVERS THE MIDDLE 12 VISITS')
  );

  // 16: runs from 15 on left to 67.5 on right
  const edgeMarks = new M.VGroup(
    new M.Line({ start: [q1x, BOX_Y - BH / 2, 0], end: [q1x, BOX_Y + BH / 2, 0], color: C.cyan, strokeWidth: 5 }),
    new M.Line({ start: [q3x, BOX_Y - BH / 2, 0], end: [q3x, BOX_Y + BH / 2, 0], color: C.violet, strokeWidth: 5 })
  );
  const iqrY = BOX_Y - BH / 2 - 0.24;
  const iqrSpan = spanBar(q1x, q3x, iqrY, C.amber);
  await until(S(16));
  await play(
    new M.Create(edgeMarks), new M.Create(iqrSpan),
    new M.Indicate(q1Txt, { color: C.cyan }), new M.Indicate(q3Txt, { color: C.violet }),
    ...say('FROM 15 ON THE LEFT TO 67.5 ON THE RIGHT')
  );

  // 17: subtract 15 -> 52.5 wide
  const iqrLabPos = [(q1x + q3x) / 2, iqrY - 0.25, 0];
  const iqrLabel = T('52.5 min', P ? 15 : 17, C.amber, true); iqrLabel.moveTo(iqrLabPos);
  await until(S(17));
  await play(
    new M.FadeIn(iqrLabel),
    ...fbox(['67.5 − 15 = 52.5', ['box width = 52.5 min', C.amber]], C.amber),
    ...say('BOX WIDTH = 52.5 MINUTES', C.amber)
  );

  // 18: interquartile range
  const iqrLabel2 = T('IQR = 52.5', P ? 15 : 17, C.amber, true); iqrLabel2.moveTo(iqrLabPos);
  await until(S(18));
  await play(
    new M.FadeOut(iqrLabel), new M.FadeIn(iqrLabel2),
    ...fbox([['IQR = Q3 − Q1', C.amber], ['    = 67.5 − 15 = 52.5 min', C.ink]], C.amber),
    ...say('INTERQUARTILE RANGE (IQR) = 52.5', C.amber)
  );

  // 19: whiskers stretch toward outer visits
  const whiskPreview = new M.VGroup(
    new M.DashedLine({ start: [q1x, BOX_Y, 0], end: [n2x(5), BOX_Y, 0], color: C.green, strokeWidth: 2.5 }),
    new M.DashedLine({ start: [q3x, BOX_Y, 0], end: [n2x(130), BOX_Y, 0], color: C.green, strokeWidth: 2.5 }),
    T('whiskers', P ? 16 : 17, C.green, true).moveTo([n2x(102), BOX_Y + 0.34, 0])
  );
  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(mid12Guides, edgeMarks)),
    new M.Create(whiskPreview),
    ...say('WHISKERS STRETCH TOWARD OUTER VISITS', C.green)
  );

  // 20: invisible cutoff called a fence
  const f146x = n2x(146.25);
  const fencePreview = new M.VGroup(
    new M.DashedLine({ start: [f146x, AXIS_Y, 0], end: [f146x, BOX_Y + BH / 2 + 0.35, 0], color: C.pink, strokeWidth: 2 }),
    T('fence?', P ? 16 : 17, C.pink, true).moveTo([f146x, BOX_Y + BH / 2 + 0.62, 0])
  );
  await until(S(20));
  await play(
    new M.FadeOut(whiskPreview), new M.Create(fencePreview),
    ...fbox([['fence = invisible cutoff', C.pink], ['one on each side of the box', C.muted]], C.pink),
    ...say('FENCE = CUTOFF ON EACH SIDE', C.pink)
  );

  // 21: whisker stops at last real visit inside fence
  await until(S(21));
  await play(
    new M.Indicate(axisDots[0], { color: C.green }),
    new M.Indicate(axisDots[22], { color: C.green }),
    ...say('STOPS AT LAST VISIT INSIDE FENCE', C.green)
  );

  // 22: standard rule 1.5 box widths out
  await until(S(22));
  await play(
    new M.FadeOut(fencePreview), new M.Indicate(boxRect, { color: C.amber }),
    ...fbox([['standard rule: 1.5 × IQR', C.amber], ['one and a half box widths out', C.muted]], C.amber),
    ...say('RULE: 1.5 BOX WIDTHS OUT', C.amber)
  );

  // 23: box is 52.5 wide, half is just over 26 (26.25)
  const w1 = n2x(120) - q3x, wHalf = f146x - n2x(120);
  const box1Rect = new M.Rectangle({ width: w1, height: BH * 0.62, color: C.amber, strokeWidth: 2 });
  box1Rect.setFill(C.amber, 0.2); box1Rect.moveTo([q3x + w1 / 2, BOX_Y, 0]);
  const box1Txt = T('52.5', P ? 15 : 16, C.ink, true); box1Txt.moveTo([q3x + w1 / 2, BOX_Y, 0]);
  const box1Bar = new M.VGroup(box1Rect, box1Txt);

  const boxHRect = new M.Rectangle({ width: wHalf, height: BH * 0.62, color: C.amber, strokeWidth: 2 });
  boxHRect.setFill(C.amber, 0.3); boxHRect.moveTo([n2x(120) + wHalf / 2, BOX_Y, 0]);
  const boxHTxt = T('26.25', 15, C.ink, true); boxHTxt.moveTo([n2x(120) + wHalf / 2, BOX_Y, 0]);
  const boxHalfBar = new M.VGroup(boxHRect, boxHTxt);

  await until(S(23));
  await play(
    new M.FadeIn(box1Bar), new M.FadeIn(boxHalfBar),
    ...fbox(['1 box  = 52.5 min', ['½ box  = 26.25 min', C.amber]], C.amber),
    ...say('1 BOX = 52.5   ·   HALF = 26.25', C.amber)
  );

  // 24: together nearly 79 (78.75)
  const span79 = spanBar(q3x, f146x, BOX_Y + BH / 2 + 0.14, C.amber, '78.75 (≈ 79)', true);
  await until(S(24));
  await play(
    new M.Create(span79),
    ...fbox(['52.5 + 26.25 = 78.75 min', ['nearly 79 minutes', C.amber]], C.amber),
    ...say('TOGETHER = 78.75 MIN (≈ 79)', C.amber)
  );

  // 25: add to right edge at 67.5
  const addArrow = new M.Arrow({ start: [q3x, BOX_Y - BH / 2 - 0.12, 0], end: [f146x, BOX_Y - BH / 2 - 0.12, 0], color: C.pink, strokeWidth: 2.5 });
  await until(S(25));
  await play(
    new M.Create(addArrow), new M.Indicate(q3Txt, { color: C.violet }),
    ...fbox(['upper fence = 67.5 + 78.75', ['start at right edge Q3 = 67.5', C.muted]], C.pink),
    ...say('ADD 78.75 TO RIGHT EDGE 67.5', C.pink)
  );

  // 26: upper fence lands at 146.25
  const upFenceLine = new M.DashedLine({ start: [f146x, AXIS_Y, 0], end: [f146x, BOX_Y + BH / 2 + 0.35, 0], color: C.pink, strokeWidth: 2.5 });
  const upFenceTxt = T('fence 146.25', P ? 15 : 16, C.pink, true);
  upFenceTxt.moveTo([f146x - (P ? 0.35 : 0), BOX_Y + BH / 2 + 0.62, 0]);
  await until(S(26));
  await play(
    new M.Create(upFenceLine), new M.FadeIn(upFenceTxt),
    ...fbox(['upper fence = 67.5 + 78.75', ['            = 146.25 min', C.pink]], C.pink),
    ...say('UPPER FENCE = 146.25 MINUTES', C.pink)
  );

  // 27: last visit inside is 95 -> right whisker stops there
  const x95 = n2x(95);
  const rWhiskLine = new M.Line({ start: [q3x, BOX_Y, 0], end: [x95, BOX_Y, 0], color: C.cyan, strokeWidth: 3 });
  const rWhiskCap = new M.Line({ start: [x95, BOX_Y - 0.24, 0], end: [x95, BOX_Y + 0.24, 0], color: C.cyan, strokeWidth: 3 });
  const rWhiskTxt = T('95', 18, C.green, true); rWhiskTxt.moveTo([x95, BOX_Y + 0.44, 0]);
  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(box1Bar, boxHalfBar, span79, addArrow)),
    new M.Flash(axisDots[22].submobjects[1], { color: C.green }),
    new M.Create(rWhiskLine), new M.Create(rWhiskCap), new M.FadeIn(rWhiskTxt),
    ...say('RIGHT WHISKER STOPS AT 95 MIN', C.green)
  );

  // 28: 160 sits past the fence and gets a dot
  const x160 = n2x(160);
  const outHalo = new M.Dot({ point: [x160, BOX_Y, 0], radius: 0.24, color: C.pink }); outHalo.setFill(C.pink, 0.22);
  const outDot = new M.Dot({ point: [x160, BOX_Y, 0], radius: 0.11, color: C.pink }); outDot.setFill(C.pink, 1);
  const outTxt = T('160', 18, C.pink, true); outTxt.moveTo([x160, BOX_Y + 0.42, 0]);
  await until(S(28));
  await play(
    new M.FadeIn(outHalo), new M.FadeIn(outDot), new M.FadeIn(outTxt),
    new M.Flash(outDot, { color: C.pink }), new M.Indicate(axisDots[23], { color: C.pink }),
    ...say('160 MIN IS PAST THE FENCE → DOT', C.pink)
  );

  // 29: past a fence = outlier
  const outTag = pill('OUTLIER', C.pink, 15);
  outTag.moveTo([x160 - (P ? 0.1 : 0), BOX_Y - 0.48, 0]);
  await until(S(29));
  await play(
    new M.FadeIn(outTag), new M.Indicate(outDot, { color: C.pink }),
    ...fbox([['160 > 146.25 (past fence)', C.pink], ['160 min is an outlier', C.ink]], C.pink),
    ...say('PAST A FENCE = AN OUTLIER', C.pink)
  );

  // 30: on the left, step back nearly 79 from 15
  const loArrowEnd = X0 - (P ? 0.55 : 0.85);
  const loStepArrow = new M.Arrow({ start: [q1x, BOX_Y, 0], end: [loArrowEnd, BOX_Y, 0], color: C.pink, strokeWidth: 2.5 });
  const loStepTxt = T('−78.75', P ? 15 : 16, C.pink, true);
  loStepTxt.moveTo([(q1x + loArrowEnd) / 2, BOX_Y - 0.32, 0]);
  await until(S(30));
  await play(
    new M.Create(loStepArrow), new M.FadeIn(loStepTxt),
    ...fbox(['lower fence = 15 − 78.75', ['            = −63.75 min', C.pink]], C.pink),
    ...say('LEFT: STEP BACK 78.75 FROM 15', C.pink)
  );

  // 31: lands below zero, no visit crosses lower fence
  await until(S(31));
  await play(
    new M.LaggedStart(axisDots.slice(0, 6).map(d => new M.Indicate(d, { color: C.green })), { lagRatio: 0.08, runTime: 1.0 }),
    ...fbox([['Lower fence: −63.75 min', C.pink], ['All visits are above it.', C.green]], C.green),
    ...say('BELOW ZERO → NO LOW OUTLIERS', C.green)
  );

  // 32: left whisker stops at 5 minutes
  const x5 = n2x(5);
  const lWhiskLine = new M.Line({ start: [q1x, BOX_Y, 0], end: [x5, BOX_Y, 0], color: C.cyan, strokeWidth: 3 });
  const lWhiskCap = new M.Line({ start: [x5, BOX_Y - 0.24, 0], end: [x5, BOX_Y + 0.24, 0], color: C.cyan, strokeWidth: 3 });
  const lWhiskTxt = T('5', 18, C.green, true); lWhiskTxt.moveTo([x5 - 0.08, BOX_Y - 0.46, 0]);
  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(loStepArrow, loStepTxt)),
    new M.Flash(axisDots[0].submobjects[1], { color: C.green }),
    new M.Create(lWhiskLine), new M.Create(lWhiskCap), new M.FadeIn(lWhiskTxt),
    ...say('LEFT WHISKER STOPS AT 5 MIN', C.green)
  );

  // 33: together they make a box plot
  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(upFenceLine, upFenceTxt, iqrSpan, iqrLabel2, outTag)),
    new M.Indicate(boxRect, { color: C.cyan }),
    new M.Indicate(lWhiskLine, { color: C.green }),
    new M.Indicate(rWhiskLine, { color: C.green }),
    new M.Indicate(outDot, { color: C.pink }),
    ...fbox([['box plot: 5 · 15 · 37.5 · 67.5 · 95', C.cyan], ['outlier dot: 160 min', C.pink]], C.cyan),
    ...say('BOX + WHISKERS + DOTS = BOX PLOT')
  );

  // 34: math line 1 — IQR
  await until(S(34));
  await play(
    new M.Indicate(boxRect, { color: C.amber }),
    ...fbox([['IQR = Q3 − Q1', C.amber], ['    = 67.5 − 15 = 52.5 min', C.ink]], C.amber),
    ...say('LINE 1: IQR = Q3 − Q1', C.amber)
  );

  // 35: math line 2 — fences
  await until(S(35));
  await play(
    ...fbox([
      ['IQR    = Q3 − Q1 = 52.5', C.amber],
      ['fences = Q1 − 1.5×IQR, Q3 + 1.5×IQR', C.pink],
      ['       = −63.75  &  146.25 min', C.muted]
    ], C.pink),
    ...say('LINE 2: FENCES = 1.5 × IQR PAST BOX', C.pink)
  );

  // 36: right whisker reaches farther -> longer visits more spread out
  const spreadCmp = new M.VGroup(
    spanBar(x5, q1x, BOX_Y - BH / 2 - 0.16, C.muted, '10', false),
    spanBar(q3x, x95, BOX_Y - BH / 2 - 0.16, C.amber, '27.5 min', false)
  );
  await until(S(36));
  await play(
    new M.Create(spreadCmp), new M.Indicate(rWhiskLine, { color: C.amber }),
    ...say('RIGHT WHISKER LONGER → MORE SPREAD', C.amber)
  );

  // 37: one small strip shows typical visits and standouts
  const satTag = T('Sat', P ? 16 : 18, C.cyan, true);
  satTag.moveTo([X0 - (P ? 0.35 : 0.55), BOX_Y, 0]);
  await until(S(37));
  await play(
    new M.FadeOut(new M.VGroup(...axisDots, spreadCmp)),
    ...clearBox(),
    new M.FadeIn(satTag),
    new M.Indicate(boxRect, { color: C.cyan }),
    new M.Indicate(outDot, { color: C.pink }),
    ...say('ONE STRIP: TYPICAL + STANDOUTS', C.green)
  );

  // 38: stack several side by side to compare every day of the week
  function miniStrip(label, y, [wL, q1, md, q3, wH], outs, col) {
    const h = P ? 0.44 : 0.42;
    const parts = [
      T(label, P ? 15 : 17, col, true).moveTo([X0 - (P ? 0.35 : 0.55), y, 0]),
      new M.Line({ start: [n2x(wL), y, 0], end: [n2x(q1), y, 0], color: col, strokeWidth: 2.5 }),
      new M.Line({ start: [n2x(wL), y - 0.14, 0], end: [n2x(wL), y + 0.14, 0], color: col, strokeWidth: 2.5 }),
      new M.Line({ start: [n2x(q3), y, 0], end: [n2x(wH), y, 0], color: col, strokeWidth: 2.5 }),
      new M.Line({ start: [n2x(wH), y - 0.14, 0], end: [n2x(wH), y + 0.14, 0], color: col, strokeWidth: 2.5 }),
    ];
    const b = new M.Rectangle({ width: n2x(q3) - n2x(q1), height: h, color: col, strokeWidth: 2.5 });
    b.setFill(col, 0.22); b.moveTo([(n2x(q1) + n2x(q3)) / 2, y, 0]);
    const m = new M.Line({ start: [n2x(md), y - h / 2, 0], end: [n2x(md), y + h / 2, 0], color: C.amber, strokeWidth: 3.5 });
    parts.push(b, m);
    outs.forEach(o => {
      const od = new M.Dot({ point: [n2x(o), y, 0], radius: 0.08, color: C.pink }); od.setFill(C.pink, 1);
      parts.push(od);
    });
    return new M.VGroup(...parts);
  }
  const dayDefs = P
    ? [
        ['Fri', -1.12, [10, 22, 42, 65, 105], [148], C.violet],
        ['Thu', -2.02, [8, 18, 34, 52, 88], [], C.green],
        ['Wed', -2.92, [5, 14, 28, 46, 80], [125], C.cyan],
        ['Tue', -3.82, [6, 16, 30, 50, 84], [], C.violet],
      ]
    : [
        ['Fri', -0.22, [10, 22, 42, 65, 105], [148], C.violet],
        ['Thu', -1.02, [8, 18, 34, 52, 88], [], C.green],
        ['Wed', -1.82, [5, 14, 28, 46, 80], [125], C.cyan],
      ];
  const dayStrips = dayDefs.map(d => miniStrip(...d));
  const lowAxis = makeAxis(P ? -4.55 : -2.38);
  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(mainAxis.ln, mainAxis.ticks)),
    new M.Create(lowAxis.ln), new M.FadeIn(lowAxis.ticks),
    new M.LaggedStart(dayStrips.map(d => new M.FadeIn(d)), { lagRatio: 0.18, runTime: 1.5 }),
    ...say('EXAMPLE: COMPARE DIFFERENT DAYS')
  );

  // === 39-45: Two traps ===
  // 39: watch for two traps
  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(satTag, ...dayStrips, lowAxis.ln, lowAxis.ticks)),
    ...say('WATCH FOR TWO TRAPS', C.pink)
  );

  // 40: Trap 1 — two-hump bar chart (exact 20-min bins from chapters/2.1.md)
  const H2 = [7, 5, 4, 3, 4, 0, 0, 0, 1];
  // The illustrative set in chapters/2.1.md gives the same box, whiskers and outlier.
  const H1 = [6, 7, 5, 4, 1, 0, 0, 0, 1];
  const NONZERO = [0, 1, 2, 3, 4, 8];
  const HIST_BASE = P ? -4.45 : -2.35;
  const BAR_UNIT = P ? 0.34 : 0.25;
  const binCol = idx => idx === 0 ? C.cyan : idx === 1 ? C.violet : idx === 4 ? C.pink : C.amber;
  function makeBar(idx, count, color) {
    const bw = n2x(20) - n2x(0);
    const bh = count * BAR_UNIT;
    const r = new M.Rectangle({ width: bw, height: bh, color, strokeWidth: 2 });
    r.setFill(color, 0.55);
    r.moveTo([(n2x(idx * 20) + n2x((idx + 1) * 20)) / 2, HIST_BASE + bh / 2, 0]);
    return r;
  }
  const histAxis = makeAxis(HIST_BASE);
  const visitAxis = new M.VGroup(
    new M.Line({ start: [X0, HIST_BASE, 0], end: [X0, HIST_BASE + 7.2 * BAR_UNIT, 0], color: C.muted, strokeWidth: 2 }),
    ...[2, 4, 6].flatMap(count => {
      const y = HIST_BASE + count * BAR_UNIT;
      return [
        new M.Line({ start: [X0 - 0.07, y, 0], end: [X0, y, 0], color: C.muted, strokeWidth: 2 }),
        T(String(count), 15, C.muted, true).moveTo([X0 - 0.22, y, 0]),
      ];
    }),
    T('visits', 15, C.muted).moveTo([X0 - 0.22, HIST_BASE + 8.1 * BAR_UNIT, 0]),
  );
  const histBars = NONZERO.map(idx => makeBar(idx, H2[idx], binCol(idx)));
  const humpLabs = new M.VGroup(
    T('short visits', P ? 15 : 16, C.cyan, true).moveTo([n2x(18), HIST_BASE + 7 * BAR_UNIT + 0.26, 0]),
    T('longer visits', P ? 15 : 16, C.pink, true).moveTo([n2x(94), HIST_BASE + 4 * BAR_UNIT + 0.28, 0])
  );
  await until(S(40));
  await play(
    new M.Create(histAxis.ln), new M.FadeIn(histAxis.ticks), new M.FadeIn(visitAxis),
    new M.LaggedStart(histBars.map(b => new M.FadeIn(b)), { lagRatio: 0.1, runTime: 1.3 }),
    new M.FadeIn(humpLabs),
    ...say('TRAP 1: THE HISTOGRAM HAS TWO BUMPS', C.pink)
  );

  // 41: box plot marks only key cuts, not bunching between them
  const cutGuides = new M.VGroup(...[5, 15, 37.5, 67.5, 95, 160].map(v =>
    new M.DashedLine({ start: [n2x(v), HIST_BASE, 0], end: [n2x(v), BOX_Y - BH / 2, 0], color: C.muted, strokeWidth: 1.5 })
  ));
  await until(S(41));
  await play(
    new M.Create(cutGuides),
    new M.Indicate(q1Txt, { color: C.amber }), new M.Indicate(q2Txt, { color: C.amber }), new M.Indicate(q3Txt, { color: C.amber }),
    ...say('ONLY MARKS KEY CUTS, NOT BUNCHING', C.amber)
  );

  // 42: two humps or one -> same box plot
  const sameShapeLab = pill('EXAMPLE: SAME BOX PLOT', C.pink, P ? 17 : 18);
  sameShapeLab.moveTo([n2x(115), HIST_BASE + 4.8 * BAR_UNIT, 0]);
  await until(S(42));
  await play(
    new M.FadeOut(humpLabs),
    ...NONZERO.map((idx, j) => new M.Transform(histBars[j], makeBar(idx, H1[idx], C.violet), { runTime: 1.4 })),
    new M.FadeIn(sameShapeLab),
    ...say('DIFFERENT HISTOGRAM, SAME BOX PLOT', C.pink)
  );

  // 43: Trap 2 — do not assume outlier is a mistake and throw it away
  const delRing = new M.Circle({ radius: 0.34, color: C.pink, strokeWidth: 3 });
  delRing.moveTo([x160, BOX_Y, 0]);
  const delTag = pill('MISTAKE? NO!', C.pink, 16);
  delTag.moveTo([x160 - (P ? 0.55 : 0.4), BOX_Y - 0.85, 0]);
  const delBadge = new M.VGroup(delRing, delTag);
  await until(S(43));
  await play(
    new M.FadeOut(new M.VGroup(...histBars, histAxis.ln, histAxis.ticks, visitAxis, cutGuides, sameShapeLab)),
    new M.Create(delRing), new M.FadeIn(delTag),
    new M.Indicate(outDot, { color: C.pink }),
    ...fbox([['160 minutes is unusual.', C.pink], 'Check the visit record.'], C.pink),
    ...say('TRAP 2: DO NOT DELETE AN OUTLIER', C.pink)
  );

  // 44: dot only means unusually long
  await until(S(44));
  await play(
    new M.FadeOut(delBadge),
    ...fbox([['160 min dot = unusually long', C.amber], ['not automatically a mistake', C.muted]], C.amber),
    ...say('A DOT ONLY MEANS UNUSUALLY LONG', C.amber)
  );

  // 45: checked the record -> stayed all afternoon -> keep it
  const cardPos = P ? [0, -4.05, 0] : [0, -1.45, 0];
  const cardW = P ? 6.6 : 7.6, cardH = P ? 1.85 : 1.7;
  const cardBg = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.18, color: C.green, strokeWidth: 2.5 });
  cardBg.setFill(C.card, 0.96); cardBg.moveTo(cardPos);
  const logCard = new M.VGroup(
    cardBg,
    T('LIBRARY RECORD · VISIT #24', P ? 16 : 17, C.muted, true).moveTo([cardPos[0], cardPos[1] + 0.52, 0]),
    T('Purpose: study  ·  Duration: 160 min', P ? 17 : 19, C.ink, true).moveTo([cardPos[0], cardPos[1] + 0.02, 0]),
    T('Stayed all afternoon  →  KEEP IT', P ? 17 : 19, C.green, true).moveTo([cardPos[0], cardPos[1] - 0.48, 0])
  );
  await until(S(45));
  await play(
    ...clearBox(),
    new M.FadeIn(logCard), new M.Flash(outDot, { color: C.green }),
    ...say('CHECKED RECORD: REAL VISIT → KEEP', C.green)
  );

  // === 46-47: Recap & bridge to smooth curve ===
  const r1Pos = [n2x(41), BOX_Y - (P ? 1.35 : 1.15), 0];
  const r2Pos = [P ? 0 : n2x(85), BOX_Y - (P ? 4.8 : 2.05), 0];
  const r3Pos = [n2x(P ? 142 : 148), BOX_Y - (P ? 1.35 : 1.15), 0];
  const r1 = pill('BOX = MIDDLE HALF', C.cyan, P ? 15 : 16); r1.moveTo(r1Pos);
  const r2 = pill('WHISKERS = LAST INSIDE', C.green, P ? 15 : 16); r2.moveTo(r2Pos);
  const r3 = pill('DOTS = OUTLIERS', C.pink, P ? 15 : 16); r3.moveTo(r3Pos);
  const recapTags = new M.VGroup(
    new M.Line({ start: [r1Pos[0], r1Pos[1] + 0.28, 0], end: [(q1x + q3x) / 2, BOX_Y - BH / 2, 0], color: C.cyan, strokeWidth: 2 }),
    new M.Line({ start: [r2Pos[0], r2Pos[1] + 0.28, 0], end: [(q3x + x95) / 2, BOX_Y - 0.08, 0], color: C.green, strokeWidth: 2 }),
    new M.Line({ start: [r3Pos[0], r3Pos[1] + 0.28, 0], end: [x160, BOX_Y - 0.14, 0], color: C.pink, strokeWidth: 2 }),
    r1, r2, r3
  );
  await until(S(46));
  await play(
    new M.FadeOut(logCard),
    new M.FadeIn(recapTags),
    new M.LaggedStart([
      new M.Indicate(boxRect, { color: C.cyan }),
      new M.Indicate(rWhiskLine, { color: C.green }),
      new M.Indicate(outDot, { color: C.pink })
    ], { lagRatio: 0.3, runTime: 1.8 }),
    ...say('RECAP: BOX · WHISKERS · OUTLIERS')
  );

  // 47: next, a smooth curve keeps the shape this box plot hides
  const CURVE_BASE = P ? -4.35 : -2.35;
  const CURVE_H = P ? 2.25 : 1.7;
  // Gaussian-like KDE over the exact 24 Saturday visits (bandwidth 14 min)
  const kde = x => VISITS.reduce((acc, [v]) => acc + Math.exp(-0.5 * ((x - v) / 14) ** 2), 0);
  const xs = Array.from({ length: 61 }, (_, i) => i * 3);
  const ysRaw = xs.map(kde), yMax = Math.max(...ysRaw);
  const curvePts = xs.map((x, i) => [n2x(x), CURVE_BASE + (ysRaw[i] / yMax) * CURVE_H, 0]);
  const curveSegs = [];
  for (let i = 0; i < curvePts.length - 1; i++) {
    curveSegs.push(new M.Line({ start: curvePts[i], end: curvePts[i + 1], color: C.violet, strokeWidth: 4 }));
  }
  const curveAxis = makeAxis(CURVE_BASE);
  const curveLab = T('smooth density curve', P ? 17 : 18, C.violet, true);
  curveLab.moveTo([n2x(118), CURVE_BASE + CURVE_H * 0.82, 0]);
  await until(S(47));
  await play(
    new M.FadeOut(recapTags),
    new M.Create(curveAxis.ln), new M.FadeIn(curveAxis.ticks),
    new M.LaggedStart(curveSegs.map(seg => new M.Create(seg)), { lagRatio: 0.03, runTime: 1.8 }),
    new M.FadeIn(curveLab),
    ...say('NEXT: SMOOTH CURVE KEEPS THE SHAPE', C.violet)
  );
}
