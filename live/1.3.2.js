// 1.3.2 Finding an eighty-percent cutoff (live manim-web lesson, script.v5.md).
// Beat i = sentence i (0-based, 0..43). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;
  const D = [3, 4, 4, 5, 6, 6, 7];
  const CX = P ? 0 : -2.2;
  const LW = P ? 6.8 : 7.6;
  const X0 = CX - LW / 2, X1 = CX + LW / 2;
  const PILL = P ? [0, 3.85, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, -4.3, 0] : [4.45, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.38 : 0.40;
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
    const maxw = P ? FW - 1.0 : 4.35;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  // helper: small parcel icon centered at [x, y, 0]
  function makeParcelIcon(x, y, w = 0.64, h = 0.54, col = C.cyan) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.08, color: col, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo([x, y, 0]);
    const vTape = new M.Line({ start: [x, y - h / 2, 0], end: [x, y + h / 2, 0], color: col, strokeWidth: 1.5 });
    const hTape = new M.Line({ start: [x - w / 2, y, 0], end: [x + w / 2, y, 0], color: col, strokeWidth: 1.5 });
    return new M.VGroup(r, vTape, hTape);
  }

  // --- Act 1: Real situation & 80% meaning (beats 0-2) -----------------------
  const introY = P ? 0.9 : -0.35;
  const introParcels = D.map((_, k) => makeParcelIcon(X0 + (k + 0.5) * (LW / 7), introY, P ? 0.62 : 0.68, P ? 0.52 : 0.56, C.cyan));
  const cafeLab = T('café', P ? 18 : 19, C.muted); cafeLab.moveTo([X0 + 0.35, introY - 0.72, 0]);
  const doorLab = T('door', P ? 18 : 19, C.muted); doorLab.moveTo([X1 - 0.35, introY - 0.72, 0]);
  const routeArr = new M.Arrow({ start: [X0 + 0.85, introY - 0.72, 0], end: [X1 - 0.85, introY - 0.72, 0], color: C.muted, strokeWidth: 2 });
  const introRoute = new M.VGroup(cafeLab, doorLab, routeArr);

  await until(S(0));
  await play(
    new M.LaggedStart(introParcels.map(p => new M.FadeIn(p)), { lagRatio: 0.12, runTime: 1.4 }),
    new M.FadeIn(introRoute),
    ...fbox(['café posts coffee beans', ['wants a fair wait time', C.amber]], C.cyan),
    ...say('CAFÉ POSTS COFFEE BEANS', C.cyan)
  );

  const qDays = pill('? DAYS', C.amber, P ? 20 : 22); qDays.moveTo([CX - 1.35, introY + 0.95, 0]);
  const qPct = pill('≥ 80% ARRIVE', C.amber, P ? 20 : 22); qPct.moveTo([CX + 1.15, introY + 0.95, 0]);
  const qBadges = new M.VGroup(qDays, qPct);
  await until(S(1));
  await play(new M.FadeIn(qBadges), ...fbox(['question:', ['how many days until', C.amber], ['at least 80% arrive?', C.amber]], C.amber), ...say('HOW MANY DAYS FOR ≥ 80%?', C.amber));

  // Beat 2: 10 x 10 grid showing 80 out of 100
  const cellStep = P ? 0.27 : 0.25, cellSz = cellStep * 0.76;
  const gridCY = P ? 0.6 : -0.45;
  const gridCells = [];
  for (let col = 0; col < 10; col++) {
    for (let row = 0; row < 10; row++) {
      const lit = col < 8;
      const sq = new M.Rectangle({ width: cellSz, height: cellSz, color: lit ? C.amber : C.line, strokeWidth: 1.2 });
      sq.setFill(lit ? C.amber : C.card, lit ? 0.85 : 0.5);
      sq.moveTo([CX + (col - 4.5) * cellStep, gridCY + (row - 4.5) * cellStep, 0]);
      gridCells.push(sq);
    }
  }
  const gridCap = T('80 out of 100 = 80%', P ? 20 : 21, C.amber, true);
  gridCap.moveTo([CX, gridCY - 5 * cellStep - 0.38, 0]);
  const grid100 = new M.VGroup(...gridCells, gridCap);
  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(...introParcels, introRoute, qBadges)),
    new M.FadeIn(grid100),
    ...fbox([['80% = 80 of every 100', C.amber]], C.amber),
    ...say('80% = 80 OUT OF 100', C.amber)
  );

  // --- Act 2: See the data first — 7 parcels on a days line (beats 3-5) ------
  const DAYS_Y = P ? 1.2 : -0.25;
  const d2x = d => X0 + ((d - 2) / 6) * LW;
  const daysLine = new M.Line({ start: [X0, DAYS_Y, 0], end: [X1, DAYS_Y, 0], color: C.muted, strokeWidth: 3 });
  const dayTicks = [2, 3, 4, 5, 6, 7, 8].map(v => {
    const tk = new M.Line({ start: [d2x(v), DAYS_Y - 0.08, 0], end: [d2x(v), DAYS_Y + 0.08, 0], color: C.muted, strokeWidth: 2 });
    const lb = T(String(v), P ? 18 : 19, C.muted, true); lb.moveTo([d2x(v), DAYS_Y - 0.34, 0]);
    return new M.VGroup(tk, lb);
  });
  const daysUnit = T('days', P ? 16 : 17, C.muted); daysUnit.moveTo([X1 - 0.25, DAYS_Y - 0.68, 0]);
  const daysAxis = new M.VGroup(...dayTicks, daysUnit);

  await until(S(3));
  await play(
    new M.FadeOut(grid100),
    new M.Create(daysLine),
    new M.FadeIn(daysAxis),
    ...fbox(['normal week: 7 parcels', ['shortest → longest', C.cyan]], C.cyan),
    ...say('7 PARCELS · SHORTEST TO LONGEST', C.cyan)
  );

  // Beat 4: 7 glowing dots on the days line: 3, 4, 4, 5, 6, 6, 7
  const dots = [], dotCores = [], dotHalos = [];
  D.forEach((v, k) => {
    const rank = D.slice(0, k).filter(x => x === v).length;
    const isTie = D.filter(x => x === v).length > 1;
    const p = [d2x(v), DAYS_Y + 0.36 + rank * 0.48, 0];
    const halo = new M.Dot({ point: p, radius: 0.26, color: C.cyan }); halo.setFill(C.cyan, 0.18);
    const core = new M.Dot({ point: p, radius: 0.12, color: C.cyan }); core.setFill(C.cyan, 1);
    const lab = T(String(v), 18, C.cyan, true);
    lab.moveTo([p[0] + 0.32, p[1], 0]);
    dotHalos.push(halo); dotCores.push(core);
    dots.push(new M.VGroup(halo, core, lab));
  });
  await until(S(4));
  await play(
    new M.LaggedStart(dots.map(g => new M.FadeIn(g)), { lagRatio: 0.28, runTime: Math.min(4.6, E(4) - S(4) - 0.6) }),
    ...fbox(['days:', ['3, 4, 4, 5, 6, 6, 7', C.cyan]], C.cyan),
    ...say('3, 4, 4, 5, 6, 6, 7 DAYS', C.cyan)
  );

  // Beat 5: data = collected measurements
  const dataBox = new M.RoundedRectangle({
    width: d2x(7) - d2x(3) + 1.15,
    height: 1.45,
    cornerRadius: 0.15,
    color: C.cyan,
    strokeWidth: 2
  });
  dataBox.moveTo([(d2x(3) + d2x(7)) / 2, DAYS_Y + 0.62, 0]);
  await until(S(5));
  await play(new M.Create(dataBox), ...say('DATA = COLLECTED MEASUREMENTS', C.cyan));

  // --- Act 3: All 7 parcels = 100%, each ≈ 14.3% (beats 6-7) -----------------
  const BAR_Y = P ? -1.2 : -1.95, BAR_H = P ? 0.56 : 0.48;
  const SLICE_W = LW / 7;
  const barFrame = new M.RoundedRectangle({ width: LW, height: BAR_H, cornerRadius: 0.08, color: C.muted, strokeWidth: 2 });
  barFrame.setFill(C.card, 0.9); barFrame.moveTo([CX, BAR_Y, 0]);

  const pct50X = X0 + 0.5 * LW, pct80X = X0 + 0.8 * LW;
  const line50 = new M.DashedLine({ start: [pct50X, BAR_Y - BAR_H / 2 - 0.10, 0], end: [pct50X, BAR_Y + BAR_H / 2 + 0.14, 0], color: C.muted });
  const line80 = new M.DashedLine({ start: [pct80X, BAR_Y - BAR_H / 2 - 0.12, 0], end: [pct80X, BAR_Y + BAR_H / 2 + 0.24, 0], color: C.amber });
  const lbl0 = T('0%', P ? 16 : 17, C.muted, true); lbl0.moveTo([X0, BAR_Y - BAR_H / 2 - 0.34, 0]);
  const lbl50 = T('50%', P ? 16 : 17, C.muted, true); lbl50.moveTo([pct50X, BAR_Y - BAR_H / 2 - 0.34, 0]);
  const lbl80 = T('80%', P ? 17 : 18, C.amber, true); lbl80.moveTo([pct80X, BAR_Y - BAR_H / 2 - 0.34, 0]);
  const lbl100 = T('100%', P ? 16 : 17, C.muted, true); lbl100.moveTo([X1, BAR_Y - BAR_H / 2 - 0.34, 0]);
  const barTitle = T('7 parcels = 100%', P ? 17 : 18, C.cyan, true); barTitle.moveTo([X0 + barTitle.getWidth() / 2, BAR_Y + BAR_H / 2 + 0.34, 0]);
  const barTicks = new M.VGroup(line50, line80, lbl0, lbl50, lbl80, lbl100, barTitle);

  await until(S(6));
  await play(
    new M.FadeOut(dataBox),
    new M.Create(barFrame),
    new M.FadeIn(barTicks),
    ...fbox([['7 parcels = 100%', C.cyan]], C.cyan),
    ...say('ALL 7 PARCELS = 100%', C.cyan)
  );

  // Beat 7: 7 slices, each just over 14%
  const divLines = [];
  for (let k = 1; k < 7; k++) {
    const x = X0 + k * SLICE_W;
    divLines.push(new M.Line({ start: [x, BAR_Y - BAR_H / 2, 0], end: [x, BAR_Y + BAR_H / 2, 0], color: C.line, strokeWidth: 2 }));
  }
  const barDivs = new M.VGroup(...divLines);
  const shareNote = T('~14.3%', P ? 15 : 16, C.cyan, true);
  shareNote.moveTo([X0 + SLICE_W / 2, BAR_Y, 0]);
  await until(S(7));
  await play(
    new M.FadeIn(barDivs),
    new M.FadeIn(shareNote),
    ...fbox(['7 × 14% = 98%', ['1 parcel ≈ 14.3%', C.cyan]], C.cyan),
    ...say('1 PARCEL ≈ 14.3%', C.cyan)
  );

  // --- Act 4: Check each delivery time in order (beats 8-16) -----------------
  const sliceFills = [];
  for (let k = 0; k < 6; k++) {
    const col = k >= 4 ? C.green : C.cyan;
    const sr = new M.Rectangle({ width: SLICE_W - 0.05, height: BAR_H - 0.08, color: col, strokeWidth: 1 });
    sr.setFill(col, 0.72);
    sr.moveTo([X0 + (k + 0.5) * SLICE_W, BAR_Y, 0]);
    sliceFills.push(sr);
  }
  const makeSweep = day => new M.Line({
    start: [d2x(day), DAYS_Y - 0.14, 0],
    end: [d2x(day), DAYS_Y + 1.15, 0],
    color: C.amber,
    strokeWidth: 3
  });
  const tintDot = (idx, col) => {
    dotCores[idx].setColor(col); dotCores[idx].setFill(col, 1);
    dotHalos[idx].setColor(col); dotHalos[idx].setFill(col, 0.25);
  };

  await until(S(8));
  await play(
    new M.FadeOut(shareNote),
    ...fbox([['target: at least 80%', C.amber]], C.amber),
    ...say('CHECK EACH DAY IN ORDER', C.amber)
  );

  // Beat 9: Day 3 -> 1 parcel (~14%)
  const sweep = makeSweep(3);
  await until(S(9));
  tintDot(0, C.green);
  await play(
    new M.Create(sweep),
    new M.FadeIn(sliceFills[0]),
    ...fbox(['day 3: 1 of 7 parcels', ['≈ 14%  (< 80%)', C.muted]], C.cyan),
    ...say('DAY 3: 1 OF 7 (≈ 14%)', C.cyan)
  );

  // Beat 10: Day 4 -> 2 more -> 3 parcels, under half
  await until(S(10));
  tintDot(1, C.green); tintDot(2, C.green);
  await play(
    new M.Transform(sweep, makeSweep(4)),
    new M.FadeIn(sliceFills[1]),
    new M.FadeIn(sliceFills[2]),
    ...fbox(['day 4: 3 of 7 parcels', ['≈ 43%  (under half)', C.muted]], C.cyan),
    ...say('DAY 4: 3 OF 7 (UNDER HALF)', C.cyan)
  );

  // Beat 11: Day 5 -> 1 more -> 4 parcels
  await until(S(11));
  tintDot(3, C.green);
  await play(
    new M.Transform(sweep, makeSweep(5)),
    new M.FadeIn(sliceFills[3]),
    ...fbox(['day 5: 4 of 7 parcels', ['past half', C.cyan]], C.cyan),
    ...say('DAY 5: 4 OF 7 PARCELS', C.cyan)
  );

  // Beat 12: 4 shares ≈ 57%, just over half
  await until(S(12));
  await play(
    new M.Indicate(sliceFills[3], { color: C.cyan }),
    ...fbox(['day 5: 4 of 7 parcels', ['4 × ~14.3% ≈ 57%', C.cyan], 'just over half'], C.cyan),
    ...say('4 SHARES ≈ 57% (OVER HALF)', C.cyan)
  );

  // Beat 13: still below 80% target
  const gapBar = new M.Line({
    start: [X0 + 4 * SLICE_W, BAR_Y + BAR_H / 2 + 0.14, 0],
    end: [pct80X, BAR_Y + BAR_H / 2 + 0.14, 0],
    color: C.amber,
    strokeWidth: 4
  });
  await until(S(13));
  await play(
    new M.Create(gapBar),
    ...fbox(['day 5: 4 of 7 ≈ 57%', ['still below 80%', C.amber]], C.amber),
    ...say('57% < 80% TARGET', C.amber)
  );

  // Beat 14: Day 6 -> two parcels tie -> 6 of 7 parcels
  await until(S(14));
  tintDot(4, C.green); tintDot(5, C.green);
  await play(
    new M.FadeOut(gapBar),
    new M.Transform(sweep, makeSweep(6)),
    new M.FadeIn(sliceFills[4]),
    new M.FadeIn(sliceFills[5]),
    ...fbox(['day 6: 2 parcels tie', ['count both → 6 of 7', C.green]], C.green),
    ...say('DAY 6: TIE → 6 OF 7 PARCELS', C.green)
  );

  // Beat 15: two more shares -> ~86%
  await until(S(15));
  await play(
    new M.Indicate(sliceFills[5], { color: C.green }),
    ...fbox(['6 of 7 parcels', '57% + 2 × ~14.3%', ['≈ 86%  (≥ 80% ✓)', C.green]], C.green),
    ...say('6 OF 7 ≈ 86% (≥ 80% ✓)', C.green)
  );

  // Beat 16: 6 days is the first wait time reaching at least 80%
  const cutTag6 = pill('6 DAYS', C.amber, P ? 16 : 17);
  cutTag6.moveTo([d2x(6) + 0.14, DAYS_Y + 1.38, 0]);
  await until(S(16));
  await play(
    new M.FadeIn(cutTag6),
    ...fbox(['first time ≥ 80%:', ['cutoff = 6 days', C.amber]], C.amber),
    ...say('CUTOFF = 6 DAYS (≥ 80%)', C.amber)
  );

  // --- Act 5: Percentile and Quantile names (beats 17-22) --------------------
  await until(S(17));
  await play(
    ...fbox([['percentile', C.violet], 'cutoff for a percentage', 'of ordered data'], C.violet),
    ...say('PERCENTILE = % CUTOFF', C.violet)
  );

  await until(S(18));
  await play(
    new M.Indicate(cutTag6, { color: C.amber }),
    ...fbox([['80th percentile = 6 days', C.amber], '(6 of 7 ≈ 86% ≥ 80%)'], C.amber),
    ...say('80TH PERCENTILE = 6 DAYS', C.amber)
  );

  const halfBadge = pill('1/2', C.cyan, P ? 15 : 16);
  halfBadge.moveTo([pct50X, BAR_Y + BAR_H / 2 + 0.34, 0]);
  await until(S(19));
  await play(
    new M.FadeIn(halfBadge),
    ...fbox(['cutoffs can use', ['a fraction, like 1/2', C.cyan]], C.cyan),
    ...say('OR A FRACTION: HALF (1/2)', C.cyan)
  );

  const halfLine = new M.DashedLine({ start: [d2x(5), DAYS_Y - 0.14, 0], end: [d2x(5), DAYS_Y + 1.15, 0], color: C.cyan });
  const halfTag = pill('5 DAYS', C.cyan, P ? 16 : 17);
  halfTag.moveTo([d2x(5) - 0.14, DAYS_Y + 1.38, 0]);
  await until(S(20));
  await play(
    new M.Create(halfLine),
    new M.FadeIn(halfTag),
    new M.Indicate(dots[3], { color: C.cyan }),
    ...fbox(['halfway cutoff (1/2)', ['= 5 days (middle)', C.cyan]], C.cyan),
    ...say('HALFWAY CUTOFF = 5 DAYS', C.cyan)
  );

  await until(S(21));
  await play(
    ...fbox([['quantile', C.green], 'cutoff for any chosen', 'share of ordered data'], C.green),
    ...say('QUANTILE = ANY SHARE CUTOFF', C.green)
  );

  await until(S(22));
  await play(
    ...fbox([['quantile (any share)', C.green], [' ↳ percentile (uses %)', C.violet]], C.violet),
    ...say('PERCENTILE = QUANTILE WITH %', C.violet)
  );

  // --- Act 6: Shortcut — Multiply & Round Up (beats 23-36) -------------------
  const crowdDots = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 15; c++) {
      const cd = new M.Dot({
        point: [X0 + 0.25 + c * ((LW - 0.5) / 14), (P ? 0.9 : -0.45) + (r - 1.5) * 0.32, 0],
        radius: 0.06,
        color: C.cyan
      });
      cd.setFill(C.cyan, 0.75);
      crowdDots.push(cd);
    }
  }
  const crowdLab = T('hundreds of parcels...', P ? 18 : 19, C.muted);
  crowdLab.moveTo([CX, (P ? 0.9 : -0.45) - 0.95, 0]);
  const crowd = new M.VGroup(...crowdDots, crowdLab);

  await until(S(23));
  await play(
    new M.FadeOut(new M.VGroup(
      daysLine, daysAxis, ...dots,
      barFrame, barTicks, barDivs,
      sweep, ...sliceFills, cutTag6,
      halfBadge, halfLine, halfTag
    )),
    new M.FadeIn(crowd),
    ...fbox(['100s of parcels:', ['checking each day is slow', C.muted]], C.muted),
    ...say('100S OF PARCELS? TOO SLOW', C.muted)
  );

  // Helper to build the 7-box sorted row
  const ROW_Y = P ? 0.6 : -0.28;
  const CW = LW / 7, BW = CW - 0.14, BH = P ? 0.80 : 0.76;
  const bx = k => X0 + (k + 0.5) * CW;
  function buildSortedRow() {
    const boxes = [], rects = [];
    D.forEach((v, k) => {
      const r = new M.RoundedRectangle({ width: BW, height: BH, cornerRadius: 0.10, color: C.cyan, strokeWidth: 2 });
      r.setFill(C.card, 0.92); r.moveTo([bx(k), ROW_Y, 0]);
      const vt = T(String(v), P ? 24 : 26, C.cyan, true); vt.moveTo([bx(k), ROW_Y, 0]);
      const sp = T('#' + (k + 1), P ? 15 : 16, C.muted, true); sp.moveTo([bx(k), ROW_Y - BH / 2 - 0.28, 0]);
      rects.push(r);
      boxes.push(new M.VGroup(r, vt, sp));
    });
    const sh = T('shortest', P ? 15 : 16, C.muted); sh.moveTo([X0 + 0.55, ROW_Y + BH / 2 + 0.28, 0]);
    const lg = T('longest', P ? 15 : 16, C.muted); lg.moveTo([X1 - 0.50, ROW_Y + BH / 2 + 0.28, 0]);
    const cap = new M.VGroup(sh, lg);
    return { boxes, rects, cap };
  }

  const row1 = buildSortedRow();
  await until(S(24));
  await play(
    new M.FadeOut(crowd),
    new M.LaggedStart(row1.boxes.map(b => new M.FadeIn(b)), { lagRatio: 0.1, runTime: 1.4 }),
    new M.FadeIn(row1.cap),
    ...fbox(['shortcut:', ['jump straight to the spot', C.cyan]], C.cyan),
    ...say('JUMP STRAIGHT TO THE SPOT', C.cyan)
  );

  // Beat 25: 100% = 1 whole, 80% = 8 tenths = 0.8
  const WHOLE_Y = P ? -1.6 : -2.02, WHOLE_H = P ? 0.52 : 0.46;
  const wFrame = new M.RoundedRectangle({ width: LW, height: WHOLE_H, cornerRadius: 0.08, color: C.muted, strokeWidth: 2 });
  wFrame.setFill(C.card, 0.9); wFrame.moveTo([CX, WHOLE_Y, 0]);
  const tenths = [];
  for (let i = 0; i < 10; i++) {
    const lit = i < 8;
    const tRect = new M.Rectangle({ width: LW / 10 - 0.04, height: WHOLE_H - 0.08, color: lit ? C.amber : C.line, strokeWidth: 1 });
    tRect.setFill(lit ? C.amber : C.card, lit ? 0.72 : 0.4);
    tRect.moveTo([X0 + (i + 0.5) * (LW / 10), WHOLE_Y, 0]);
    tenths.push(tRect);
  }
  const w0 = T('0', P ? 16 : 17, C.muted, true); w0.moveTo([X0, WHOLE_Y - WHOLE_H / 2 - 0.30, 0]);
  const w08 = T('0.8', P ? 18 : 19, C.amber, true); w08.moveTo([X0 + 0.8 * LW, WHOLE_Y - WHOLE_H / 2 - 0.30, 0]);
  const w1 = T('1', P ? 16 : 17, C.muted, true); w1.moveTo([X1, WHOLE_Y - WHOLE_H / 2 - 0.30, 0]);
  const wholeGroup = new M.VGroup(wFrame, ...tenths, w0, w08, w1);

  await until(S(25));
  await play(
    new M.FadeIn(wholeGroup),
    ...fbox(['100% = 1 whole', ' 80% = 8 tenths', ['     = 0.8', C.amber]], C.amber),
    ...say('80% = 8 TENTHS = 0.8', C.amber)
  );

  // Beat 26: multiply 0.8 by 7 parcels
  await until(S(26));
  await play(
    new M.LaggedStart(row1.boxes.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.08, runTime: 1.4 }),
    ...fbox(['share = 0.8', 'count = 7 parcels', ['0.8 × 7 = ?', C.amber]], C.amber),
    ...say('MULTIPLY: 0.8 × 7', C.amber)
  );

  // Beat 27: 0.8 * 7 = 5.6 parcels (lands at X0 + 0.8 * LW = 5.6 boxes across!)
  const x56 = X0 + (5.6 / 7) * LW;
  const posLine = new M.DashedLine({ start: [x56, WHOLE_Y + WHOLE_H / 2, 0], end: [x56, ROW_Y - BH / 2 - 0.95, 0], color: C.amber });
  const tag56 = pill('5.6', C.amber, P ? 17 : 18); tag56.moveTo([x56, ROW_Y - BH / 2 - 0.75, 0]);
  await until(S(27));
  await play(
    new M.Create(posLine),
    new M.FadeIn(tag56),
    ...fbox(['8 × 7 = 56', ['0.8 × 7 = 5.6 parcels', C.amber]], C.amber),
    ...say('0.8 × 7 = 5.6 PARCELS', C.amber)
  );

  // Beat 28: 5 parcels fall short -> round up to parcel 6 in line
  const box6Hi = new M.RoundedRectangle({ width: BW + 0.14, height: BH + 0.14, cornerRadius: 0.12, color: C.amber, strokeWidth: 3 });
  box6Hi.moveTo([bx(5), ROW_Y, 0]);
  const roundArr = new M.Arrow({ start: [X0 + 5 * CW, ROW_Y - BH / 2 - 0.62, 0], end: [bx(5), ROW_Y - BH / 2 - 0.62, 0], color: C.amber, strokeWidth: 3 });
  await until(S(28));
  for (let k = 0; k < 5; k++) row1.rects[k].setFill(C.card, 0.35);
  await play(
    new M.Create(box6Hi),
    ...fbox(['0.8 × 7 = 5.6', '5 parcels fall short', ['round up → spot #6', C.amber]], C.amber),
    ...say('5.6 → ROUND UP TO SPOT #6', C.amber)
  );

  // Beat 29: move to that spot and read its delivery time: 6 days
  const read6 = pill('6 DAYS', C.green, P ? 17 : 18); read6.moveTo([bx(5), ROW_Y + BH / 2 + 0.62, 0]);
  await until(S(29));
  row1.rects[5].setColor(C.green);
  row1.rects[5].setFill(C.green, 0.28);
  await play(
    new M.FadeOut(tag56),
    new M.FadeIn(read6),
    ...fbox(['spot #6 in line', ['delivery time = 6 days', C.green]], C.green),
    ...say('READ SPOT #6 → 6 DAYS', C.green)
  );

  // Beat 30: spot and wait time share a number, different meanings
  const spotNote6 = T('spot #6', P ? 15 : 16, C.amber, true);
  spotNote6.moveTo([bx(5), ROW_Y - BH / 2 - 0.96, 0]);
  await until(S(30));
  await play(
    new M.FadeIn(spotNote6),
    new M.Indicate(read6, { color: C.green }),
    ...fbox([['spot #6 = place in line', C.amber], ['6 days  = wait time', C.green]], C.violet),
    ...say('PLACE #6 VS. 6 DAYS', C.violet)
  );

  // Beat 31: rounding-up rule in short
  await until(S(31));
  for (let k = 0; k < 7; k++) { row1.rects[k].setColor(C.cyan); row1.rects[k].setFill(C.card, 0.92); }
  await play(
    new M.FadeOut(new M.VGroup(wholeGroup, posLine, box6Hi, read6, spotNote6)),
    ...fbox([['Rounding-up rule', C.cyan], 'in 3 short steps:', ['multiply, round up, read', C.amber]], C.cyan),
    ...say('THE ROUNDING-UP RULE', C.cyan)
  );

  // Beat 32: sorted list, multiply share as decimal by count
  await until(S(32));
  await play(
    ...fbox(['1. Sort shortest → longest', ['2. spot = share × count', C.amber]], C.cyan),
    ...say('STEP 1: SHARE × COUNT', C.cyan)
  );

  // Beat 33: whole number -> stop at that spot
  await until(S(33));
  await play(
    ...fbox(['spot = share × count', ['whole number → stop there', C.green]], C.green),
    ...say('WHOLE NUMBER → STOP THERE', C.green)
  );

  // Beat 34: 80% of 10 parcels = 8 -> check 8th parcel
  const CW10 = LW / 10, BW10 = CW10 - 0.08, BH10 = P ? 0.68 : 0.66;
  const r10Parts = [];
  for (let k = 0; k < 10; k++) {
    const x = X0 + (k + 0.5) * CW10, is8 = k === 7;
    const r = new M.RoundedRectangle({ width: BW10, height: BH10, cornerRadius: 0.08, color: is8 ? C.green : C.cyan, strokeWidth: is8 ? 3 : 1.6 });
    r.setFill(is8 ? C.green : C.card, is8 ? 0.30 : 0.9); r.moveTo([x, ROW_Y, 0]);
    const sp = T('#' + (k + 1), 15, is8 ? C.green : C.muted, true); sp.moveTo([x, ROW_Y - BH10 / 2 - 0.26, 0]);
    r10Parts.push(r, sp);
  }
  const tag8 = pill('SPOT #8', C.green, P ? 16 : 17); tag8.moveTo([X0 + 7.5 * CW10, ROW_Y + BH10 / 2 + 0.50, 0]);
  const row10 = new M.VGroup(...r10Parts, tag8);
  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(...row1.boxes, row1.cap)),
    new M.FadeIn(row10),
    ...fbox(['10 parcels at 80%:', '0.8 × 10 = 8 (whole)', ['→ check parcel #8', C.green]], C.green),
    ...say('0.8 × 10 = 8 → SPOT #8', C.green)
  );

  // Beat 35: between whole numbers -> round up
  const row2 = buildSortedRow();
  const posTick2 = pill('5.6', C.amber, P ? 17 : 18); posTick2.moveTo([x56, ROW_Y - BH / 2 - 0.75, 0]);
  const box6Hi2 = new M.RoundedRectangle({ width: BW + 0.14, height: BH + 0.14, cornerRadius: 0.12, color: C.amber, strokeWidth: 3 });
  box6Hi2.moveTo([bx(5), ROW_Y, 0]);
  await until(S(35));
  await play(
    new M.FadeOut(row10),
    new M.FadeIn(new M.VGroup(...row2.boxes, row2.cap)),
    new M.FadeIn(posTick2),
    new M.Create(box6Hi2),
    ...fbox(['7 parcels at 80%:', '0.8 × 7 = 5.6 (between)', ['→ round up to #6', C.amber]], C.amber),
    ...say('BETWEEN → ROUND UP', C.amber)
  );

  // Beat 36: then read the measurement there
  const read6b = pill('6 DAYS', C.green, P ? 17 : 18); read6b.moveTo([bx(5), ROW_Y + BH / 2 + 0.58, 0]);
  await until(S(36));
  row2.rects[5].setColor(C.green); row2.rects[5].setFill(C.green, 0.28);
  await play(
    new M.FadeIn(read6b),
    ...fbox(['1. share × count', '2. round up if needed', ['3. read value there', C.green]], C.green),
    ...say('READ THE MEASUREMENT THERE', C.green)
  );

  // --- Act 7: What it is for & extreme delay (beats 37-39) -------------------
  const domY = P ? -1.4 : -1.85;
  const d1 = pill('WAIT TIMES', C.cyan, P ? 15 : 16); d1.moveTo([CX - (P ? 2.25 : 2.5), domY, 0]);
  const d2 = pill('TEST SCORES', C.cyan, P ? 15 : 16); d2.moveTo([CX, domY, 0]);
  const d3 = pill('DOWNLOADS', C.cyan, P ? 15 : 16); d3.moveTo([CX + (P ? 2.25 : 2.5), domY, 0]);
  const domainBadges = new M.VGroup(d1, d2, d3);

  await until(S(37));
  await play(
    new M.FadeOut(posTick2),
    new M.FadeIn(domainBadges),
    ...fbox([['Realistic promises:', C.cyan], '• wait times', '• test scores', '• download speeds'], C.cyan),
    ...say('WAIT TIMES · SCORES · SPEEDS', C.cyan)
  );

  // Beat 38: late week — last parcel takes 21 days (pink), #6 stays 6 days
  const lateRect = new M.RoundedRectangle({ width: BW, height: BH, cornerRadius: 0.10, color: C.pink, strokeWidth: 3 });
  lateRect.setFill(C.pink, 0.24); lateRect.moveTo([bx(6), ROW_Y, 0]);
  const lateVal = T('21', P ? 24 : 26, C.pink, true); lateVal.moveTo([bx(6), ROW_Y, 0]);
  const lateSp = T('#7', P ? 15 : 16, C.pink, true); lateSp.moveTo([bx(6), ROW_Y - BH / 2 - 0.28, 0]);
  const lateTag = T('late!', P ? 15 : 16, C.pink, true); lateTag.moveTo([bx(6), ROW_Y + BH / 2 + 0.28, 0]);
  const box7Late = new M.VGroup(lateRect, lateVal, lateSp, lateTag);

  await until(S(38));
  await play(
    new M.FadeOut(new M.VGroup(domainBadges, row2.boxes[6], row2.cap)),
    new M.FadeIn(box7Late),
    new M.Indicate(read6b, { color: C.green }),
    ...fbox(['last parcel: 7 → 21 days', ['spot #6 stays 6 days!', C.green]], C.pink),
    ...say('LAST = 21 → #6 STAYS 6', C.pink)
  );

  // Beat 39: captures most cases without one extreme delay taking over
  const brY = ROW_Y - BH / 2 - 0.66;
  const brLine = new M.Line({ start: [X0 + 0.08, brY, 0], end: [X0 + 6 * CW - 0.08, brY, 0], color: C.green, strokeWidth: 3 });
  const brLab = T('most parcels (6 of 7 ≈ 86%)', P ? 17 : 18, C.green, true);
  brLab.moveTo([X0 + 3 * CW, brY - 0.34, 0]);
  const mostBracket = new M.VGroup(brLine, brLab);

  await until(S(39));
  await play(
    new M.Create(brLine),
    new M.FadeIn(brLab),
    ...fbox(['80th percentile = 6 days', ['one extreme delay cannot', C.green], ['take over', C.green]], C.green),
    ...say('EXTREME DELAY CAN’T TAKE OVER', C.green)
  );

  // --- Act 8: Common trap & recap (beats 40-43) ------------------------------
  const backRect = new M.RoundedRectangle({ width: BW, height: BH, cornerRadius: 0.10, color: C.cyan, strokeWidth: 2 });
  backRect.setFill(C.card, 0.92); backRect.moveTo([bx(6), ROW_Y, 0]);
  const backVal = T('7', P ? 24 : 26, C.cyan, true); backVal.moveTo([bx(6), ROW_Y, 0]);
  const backSp = T('#7', P ? 15 : 16, C.muted, true); backSp.moveTo([bx(6), ROW_Y - BH / 2 - 0.28, 0]);
  const box7Back = new M.VGroup(backRect, backVal, backSp);

  await until(S(40));
  row2.rects[5].setColor(C.cyan); row2.rects[5].setFill(C.card, 0.92);
  await play(
    new M.FadeOut(new M.VGroup(box7Late, mostBracket, box6Hi2, read6b)),
    new M.FadeIn(box7Back),
    ...fbox([['Watch out:', C.pink], '80th percentile = 6 days', ['≠ 80% took exactly 6', C.pink]], C.pink),
    ...say('NOT “EXACTLY 6 DAYS”', C.pink)
  );

  // Beat 41: only 2 parcels took exactly 6 days
  const exactBox = new M.RoundedRectangle({ width: 2 * CW + 0.04, height: BH + 0.22, cornerRadius: 0.14, color: C.pink, strokeWidth: 3 });
  exactBox.moveTo([(bx(4) + bx(5)) / 2, ROW_Y, 0]);
  const exactLab = T('only 2 parcels = 6', P ? 17 : 18, C.pink, true);
  exactLab.moveTo([(bx(4) + bx(5)) / 2, ROW_Y + BH / 2 + 0.44, 0]);

  await until(S(41));
  for (let k = 0; k < 4; k++) row2.rects[k].setFill(C.card, 0.30);
  backRect.setFill(C.card, 0.30);
  row2.rects[4].setColor(C.pink); row2.rects[4].setFill(C.pink, 0.28);
  row2.rects[5].setColor(C.pink); row2.rects[5].setFill(C.pink, 0.28);
  await play(
    new M.Create(exactBox),
    new M.FadeIn(exactLab),
    ...fbox(['took exactly 6 days:', ['only 2 of 7 (≈ 29%)', C.pink]], C.pink),
    ...say('ONLY 2 TOOK EXACTLY 6 DAYS', C.pink)
  );

  // Beat 42: 6 parcels arrived by day 6, taking 6 days or less
  const leBox = new M.RoundedRectangle({ width: 6 * CW + 0.04, height: BH + 0.22, cornerRadius: 0.14, color: C.green, strokeWidth: 3 });
  leBox.moveTo([X0 + 3 * CW, ROW_Y, 0]);
  const leLab = T('6 parcels: 6 days or less (86%)', P ? 17 : 18, C.green, true);
  leLab.moveTo([X0 + 3 * CW, ROW_Y + BH / 2 + 0.44, 0]);

  await until(S(42));
  for (let k = 0; k < 6; k++) { row2.rects[k].setColor(C.green); row2.rects[k].setFill(C.green, 0.24); }
  backRect.setColor(C.cyan); backRect.setFill(C.card, 0.92);
  await play(
    new M.FadeOut(new M.VGroup(exactBox, exactLab)),
    new M.Create(leBox),
    new M.FadeIn(leLab),
    ...fbox(['6 days OR LESS:', ['6 of 7 parcels (≈ 86%)', C.green]], C.green),
    ...say('6 PARCELS TOOK 6 DAYS OR LESS', C.green)
  );

  // Beat 43: one-sentence recap
  const finalCut = new M.DashedLine({
    start: [X0 + 6 * CW, ROW_Y - BH / 2 - 0.55, 0],
    end: [X0 + 6 * CW, ROW_Y + BH / 2 + 0.25, 0],
    color: C.amber
  });
  await until(S(43));
  await play(
    new M.Create(finalCut),
    ...fbox([['quantile', C.green], 'cutoff for a share of', 'ordered data', ['percentile → uses %', C.amber]], C.amber),
    ...say('QUANTILE = SHARE · PERCENTILE = %', C.amber)
  );
}
