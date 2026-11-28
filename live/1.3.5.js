// 1.3.5 Sample variance: why divide by one less?
// Beat i = sentence i (0-based, 47 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const D = [3, 4, 4, 5, 6, 6, 7];
  const CX = P ? 0 : -2.35;
  const PILL = P ? [0, 3.85, 0] : [CX, 1.98, 0];
  const BOXP = P ? [0, -4.7, 0] : [4.5, -0.25, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Days axis geometry (days 2..8)
  const AXIS_Y = P ? 1.55 : -0.05;
  const X_MIN = P ? -3.15 : -5.95, X_MAX = P ? 3.15 : 1.25;
  const d2x = v => X_MIN + ((v - 2) / 6) * (X_MAX - X_MIN);
  const Y0 = AXIS_Y + (P ? 0.34 : 0.28);
  const Y1 = AXIS_Y + (P ? 0.86 : 0.72);
  const Y2 = AXIS_Y + (P ? 1.36 : 1.14);
  const dotY = k => (k === 2 || k === 5) ? Y1 : Y0;

  // Squares shelf geometry (below the days line)
  const SQ_BASE = P ? -2.65 : -2.60;
  const SU = P ? 0.50 : 0.48;
  const SQ_GAP = P ? 0.24 : 0.24;
  function sqLayout(center) {
    const sides = D.map(v => Math.abs(v - center));
    const ws = sides.map(sd => Math.max(0.40, sd * SU));
    const totalW = ws.reduce((a, b) => a + b, 0) + (D.length - 1) * SQ_GAP;
    let x = CX - totalW / 2;
    return sides.map((side, k) => {
      const cx = x + ws[k] / 2;
      x += ws[k] + SQ_GAP;
      return { cx, side, area: side * side, w: ws[k], val: D[k] };
    });
  }

  // Formula box: one at a time, lines = ['text' | ['text', color]]
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20, lh = P ? 0.38 : 0.41;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.36;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.18 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // Helper: crisp horizontal arrow built from Line segments
  function mkArrow(x1, x2, y, color) {
    const dir = x2 > x1 ? 1 : -1;
    const tip = Math.min(0.15, Math.abs(x2 - x1) * 0.35);
    const shaft = new M.Line({ start: [x1, y, 0], end: [x2, y, 0], color, strokeWidth: 3 });
    const h1 = new M.Line({ start: [x2 - dir * tip, y + tip * 0.55, 0], end: [x2, y, 0], color, strokeWidth: 3 });
    const h2 = new M.Line({ start: [x2 - dir * tip, y - tip * 0.55, 0], end: [x2, y, 0], color, strokeWidth: 3 });
    return new M.VGroup(shaft, h1, h2);
  }

  // Helper: dashed vertical center line as N independent Line segments (for smooth Transform slide)
  function mkCenterSegs(x, color) {
    const yBot = AXIS_Y - 0.10, yTop = AXIS_Y + (P ? 1.50 : 1.32);
    const n = 9, step = (yTop - yBot) / n, segs = [];
    for (let i = 0; i < n; i++) {
      const a = yBot + i * step, b = a + step * 0.58;
      segs.push(new M.Line({ start: [x, a, 0], end: [x, b, 0], color, strokeWidth: 3 }));
    }
    return segs;
  }

  // Helper: parcel square Rectangle (side >= 1) or tiny zero marker (side = 0)
  function mkSqRect(side, cx, color, opacity = 0.72) {
    const s = side > 0 ? side * SU : 0.10;
    const r = new M.Rectangle({ width: s, height: s, color, strokeWidth: side > 0 ? 2 : 1.5 });
    r.setFill(color, side > 0 ? opacity : 0.35);
    r.moveTo([cx, SQ_BASE + s / 2, 0]);
    return r;
  }

  // Helper: 1x1 inner unit grid lines for a square of integer side >= 2
  function mkSqGrid(side, cx) {
    const lines = [];
    if (side < 2) return lines;
    const xL = cx - (side * SU) / 2, yB = SQ_BASE;
    for (let i = 1; i < side; i++) {
      lines.push(new M.Line({ start: [xL + i * SU, yB, 0], end: [xL + i * SU, yB + side * SU, 0], color: C.bg, strokeWidth: 1.4 }));
      lines.push(new M.Line({ start: [xL, yB + i * SU, 0], end: [xL + side * SU, yB + i * SU, 0], color: C.bg, strokeWidth: 1.4 }));
    }
    return lines;
  }

  // Helper: build days axis + ticks group
  function buildAxis(fulcrumAt5 = false) {
    const axis = new M.Line({ start: [X_MIN - 0.2, AXIS_Y, 0], end: [X_MAX + 0.2, AXIS_Y, 0], color: C.muted, strokeWidth: 3 });
    const ticks = [];
    for (let d = 2; d <= 8; d++) {
      const x = d2x(d);
      ticks.push(new M.Line({ start: [x, AXIS_Y - 0.08, 0], end: [x, AXIS_Y + 0.08, 0], color: C.muted, strokeWidth: 2 }));
      const tl = T(String(d), P ? 17 : 18, (fulcrumAt5 && d === 5) ? C.amber : C.muted, true);
      tl.moveTo([x, AXIS_Y - ((fulcrumAt5 && d === 5) ? 0.68 : 0.30), 0]);
      ticks.push(tl);
    }
    const unit = T('days', 16, C.muted);
    unit.moveTo([X_MAX + 0.05, AXIS_Y - 0.62, 0]);
    return { axis, ticksG: new M.VGroup(...ticks, unit) };
  }

  // Helper: each parcel dot is its own VGroup(halo, dot)
  function buildParcelDots() {
    return D.map((v, k) => {
      const p = [d2x(v), dotY(k), 0];
      const halo = new M.Dot({ point: p, radius: 0.24, color: C.cyan }); halo.setFill(C.cyan, 0.18);
      const dot = new M.Dot({ point: p, radius: 0.11, color: C.cyan }); dot.setFill(C.cyan, 1);
      return { g: new M.VGroup(halo, dot), p, v };
    });
  }

  // Helper: deviation arrows & labels from center c = 5 (each parcel's arrow+label as its own VGroup)
  function buildArrowsFrom5() {
    const groups = [];
    // k=0 (val 3, gap -2) at Y2 with drop line
    const d0 = new M.Line({ start: [d2x(3), Y0 + 0.12, 0], end: [d2x(3), Y2, 0], color: C.violet, strokeWidth: 1.5 });
    const a0 = mkArrow(d2x(5), d2x(3), Y2, C.violet);
    const l0 = T('−2', 16, C.violet, true); l0.moveTo([d2x(3) - 0.36, Y2, 0]);
    groups.push(new M.VGroup(d0, a0, l0));

    // k=1 (val 4 bottom, gap -1) at Y0
    const a1 = mkArrow(d2x(5), d2x(4) + 0.13, Y0, C.violet);
    const l1 = T('−1', 15, C.violet, true); l1.moveTo([(d2x(5) + d2x(4)) / 2, Y0 + 0.18, 0]);
    groups.push(new M.VGroup(a1, l1));

    // k=2 (val 4 top, gap -1) at Y1
    const a2 = mkArrow(d2x(5), d2x(4) + 0.13, Y1, C.violet);
    const l2 = T('−1', 15, C.violet, true); l2.moveTo([(d2x(5) + d2x(4)) / 2, Y1 + 0.18, 0]);
    groups.push(new M.VGroup(a2, l2));

    // k=3 (val 5, gap 0)
    const l3 = T('0', 15, C.muted, true); l3.moveTo([d2x(5), Y0 + 0.26, 0]);
    groups.push(new M.VGroup(l3));

    // k=4 (val 6 bottom, gap +1) at Y0
    const a4 = mkArrow(d2x(5), d2x(6) - 0.13, Y0, C.green);
    const l4 = T('+1', 15, C.green, true); l4.moveTo([(d2x(5) + d2x(6)) / 2, Y0 + 0.18, 0]);
    groups.push(new M.VGroup(a4, l4));

    // k=5 (val 6 top, gap +1) at Y1
    const a5 = mkArrow(d2x(5), d2x(6) - 0.13, Y1, C.green);
    const l5 = T('+1', 15, C.green, true); l5.moveTo([(d2x(5) + d2x(6)) / 2, Y1 + 0.18, 0]);
    groups.push(new M.VGroup(a5, l5));

    // k=6 (val 7, gap +2) at Y2 with drop line
    const d6 = new M.Line({ start: [d2x(7), Y0 + 0.12, 0], end: [d2x(7), Y2, 0], color: C.green, strokeWidth: 1.5 });
    const a6 = mkArrow(d2x(5), d2x(7), Y2, C.green);
    const l6 = T('+2', 16, C.green, true); l6.moveTo([d2x(7) + 0.36, Y2, 0]);
    groups.push(new M.VGroup(d6, a6, l6));

    return groups;
  }

  // Helper: deviation arrows & labels from center c = 6 as one VGroup
  function buildArrowsFrom6() {
    const d0 = new M.Line({ start: [d2x(3), Y0 + 0.12, 0], end: [d2x(3), Y2, 0], color: C.pink, strokeWidth: 1.5 });
    const a0 = mkArrow(d2x(6), d2x(3), Y2, C.pink);
    const l0 = T('−3', 16, C.pink, true); l0.moveTo([d2x(3) - 0.36, Y2, 0]);

    const a2 = mkArrow(d2x(6), d2x(4) + 0.13, Y1, C.pink);
    const l2 = T('−2 (×2)', 15, C.pink, true); l2.moveTo([(d2x(6) + d2x(4)) / 2, Y1 + 0.19, 0]);

    const a3 = mkArrow(d2x(6), d2x(5) + 0.13, Y0, C.pink);
    const l3 = T('−1', 15, C.pink, true); l3.moveTo([(d2x(6) + d2x(5)) / 2, Y0 + 0.18, 0]);

    const a6 = mkArrow(d2x(6), d2x(7) - 0.13, Y0, C.green);
    const l6 = T('+1', 15, C.green, true); l6.moveTo([(d2x(6) + d2x(7)) / 2, Y0 + 0.18, 0]);

    return new M.VGroup(d0, a0, l0, a2, l2, a3, l3, a6, l6);
  }

  // =========================================================================
  // BEATS 0-1: All the café's parcels -> study one week (7 parcels)
  // =========================================================================
  const popBoxes = [];
  const cols = 7, rows = 4;
  const pSpX = P ? 0.86 : 0.96, pSpY = P ? 0.80 : 0.72;
  const pBaseY = P ? 0.5 : -0.45;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = CX + (c - (cols - 1) / 2) * pSpX;
      const by = pBaseY + (r - (rows - 1) / 2) * pSpY;
      const box = new M.RoundedRectangle({ width: 0.56, height: 0.44, cornerRadius: 0.08, color: C.muted, strokeWidth: 1.8 });
      box.setFill(C.card, 0.9); box.moveTo([bx, by, 0]);
      const tape = new M.Line({ start: [bx - 0.24, by + 0.03, 0], end: [bx + 0.24, by + 0.03, 0], color: C.muted, strokeWidth: 1.5 });
      popBoxes.push({ g: new M.VGroup(box, tape), r, c });
    }
  }
  const popNote = T("all the café's parcels (hundreds sent)", P ? 17 : 18, C.muted);
  popNote.moveTo([CX, pBaseY - (rows / 2) * pSpY - 0.35, 0]);

  await until(S(0));
  await play(
    new M.LaggedStart(popBoxes.map(p => new M.FadeIn(p.g)), { lagRatio: 0.04, runTime: 1.4 }),
    new M.FadeIn(popNote),
    ...fbox(['question:', ['how much do delivery', C.cyan], ['times vary?', C.cyan]], C.cyan),
    ...say('HOW MUCH DO PARCELS VARY?', C.cyan)
  );

  // Beat 1: highlight 1 row of 7 parcels as "one week"
  const weekRow = popBoxes.filter(p => p.r === 2);
  const weekFrame = new M.RoundedRectangle({
    width: cols * pSpX + 0.2, height: pSpY + 0.06, cornerRadius: 0.14, color: C.cyan, strokeWidth: 2.5
  });
  weekFrame.setFill(C.cyan, 0.08);
  weekFrame.moveTo([CX, pBaseY + (2 - (rows - 1) / 2) * pSpY, 0]);
  const weekTag = T('one week (7 parcels)', 17, C.cyan);
  weekTag.moveTo([CX, pBaseY + (rows / 2) * pSpY + 0.32, 0]);

  await until(S(1));
  await play(
    new M.Create(weekFrame),
    new M.FadeIn(weekTag),
    ...weekRow.map(p => new M.Indicate(p.g, { color: C.cyan })),
    ...fbox(['too many to check all', ['study one week: 7', C.amber]], C.amber),
    ...say('STUDY ONE WEEK: 7 PARCELS', C.amber)
  );

  // =========================================================================
  // BEATS 2-4: Seven delivery times on a days line, sample vs population
  // =========================================================================
  const { axis, ticksG } = buildAxis(false);
  const parcels = buildParcelDots();
  const parcelNums = D.map((v, k) => {
    const tie = k === 2 || k === 5;
    const t = T((k === 1 || k === 4) ? '' : (tie ? `${v}, ${v}` : String(v)), P ? 17 : 18, C.cyan, true);
    t.moveTo([d2x(v), dotY(k) + 0.34, 0]);
    return t;
  });

  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(...popBoxes.map(p => p.g), popNote, weekFrame, weekTag)),
    new M.Create(axis),
    new M.FadeIn(ticksG),
    ...fbox(['days:', ['3, 4, 4, 5, 6, 6, 7', C.cyan]], C.cyan),
    ...say('3, 4, 4, 5, 6, 6, 7 DAYS', C.cyan)
  );
  await play(
    new M.LaggedStart(parcels.map(p => new M.FadeIn(p.g)), { lagRatio: 0.22, runTime: 2.6 }),
    new M.LaggedStart(parcelNums.map(t => new M.FadeIn(t)), { lagRatio: 0.22, runTime: 2.6 })
  );

  // Beat 3: Sample outline around the 7 parcels
  const sampleBox = new M.RoundedRectangle({
    width: (d2x(7) - d2x(3)) + 0.9, height: (Y1 - Y0) + 1.12, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2
  });
  sampleBox.moveTo([d2x(5), (Y0 + Y1) / 2 + 0.22, 0]);

  await until(S(3));
  await play(new M.Create(sampleBox), ...fbox([['sample', C.cyan], 'the small group', 'you can measure'], C.cyan), ...say('SAMPLE = THE 7 WE MEASURE', C.cyan));

  // Beat 4: Population diagram below the days line (3x9 = 27 parcels, middle 7 are the sample)
  const popY = P ? -1.2 : -1.85;
  const popW = P ? 6.4 : 7.0, popH = P ? 2.2 : 1.55;
  const popOuter = new M.RoundedRectangle({ width: popW, height: popH, cornerRadius: 0.18, color: C.violet, strokeWidth: 2 });
  popOuter.setFill(C.card, 0.85); popOuter.moveTo([CX, popY, 0]);
  const popTitle = T('POPULATION: ALL CAFÉ PARCELS', P ? 16 : 17, C.violet, true);
  popTitle.moveTo([CX, popY + popH / 2 - 0.28, 0]);
  const miniDots = [];
  const stepMX = popW / 10.2, stepMY = popH / 4.6;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 9; c++) {
      const mx = CX + (c - 4) * stepMX;
      const my = popY - 0.18 + (r - 1) * stepMY;
      const isSamp = r === 1 && c >= 1 && c <= 7;
      const md = new M.Dot({ point: [mx, my, 0], radius: isSamp ? 0.09 : 0.06, color: isSamp ? C.cyan : C.muted });
      md.setFill(isSamp ? C.cyan : C.muted, isSamp ? 1 : 0.75);
      miniDots.push(md);
    }
  }
  const miniSampBox = new M.RoundedRectangle({
    width: 7 * stepMX + 0.14, height: stepMY * 0.88, cornerRadius: 0.12, color: C.cyan, strokeWidth: 1.8
  });
  miniSampBox.moveTo([CX, popY - 0.18, 0]);

  await until(S(4));
  await play(
    new M.FadeIn(popOuter), new M.FadeIn(popTitle),
    new M.LaggedStart(miniDots.map(d => new M.FadeIn(d)), { lagRatio: 0.03, runTime: 1.2 }),
    new M.Create(miniSampBox),
    ...fbox([['population', C.violet], 'all the parcels', 'the café sends'], C.violet),
    ...say('POPULATION = ALL PARCELS', C.violet)
  );

  // =========================================================================
  // BEATS 5-12: Mean = 5, deviations, squares, area = 12
  // =========================================================================
  const TAG_Y = AXIS_Y + (P ? 1.76 : 1.56);
  const centerSegs = mkCenterSegs(d2x(5), C.amber);
  const meanTag = T('mean = 5', P ? 16 : 17, C.amber, true);
  meanTag.moveTo([d2x(5), TAG_Y, 0]);

  await until(S(5));
  await play(
    new M.FadeOut(new M.VGroup(sampleBox, popOuter, popTitle, ...miniDots, miniSampBox, ...parcelNums)),
    ...centerSegs.map(seg => new M.Create(seg)),
    new M.FadeIn(meanTag),
    ...say('MEAN = 5 DAYS', C.amber)
  );

  // Beat 6: Deviation arrows from 5
  const arr5 = buildArrowsFrom5();

  await until(S(6));
  await play(
    new M.LaggedStart(arr5.map(g => new M.FadeIn(g)), { lagRatio: 0.10, runTime: 1.5 }),
    ...say('DEVIATION = GAP FROM 5', C.amber)
  );

  // Beat 7: Gaps cancel to 0 -> turn each gap into a real square
  const lay5 = sqLayout(5);
  const sqFloor = new M.Line({ start: [CX - (P ? 3.55 : 3.75), SQ_BASE, 0], end: [CX + (P ? 3.55 : 3.75), SQ_BASE, 0], color: C.muted, strokeWidth: 2 });
  const sqRects = lay5.map(s => mkSqRect(s.side, s.cx, C.cyan, 0.72));
  const sqGridsG = new M.VGroup(...lay5.flatMap(s => mkSqGrid(s.side, s.cx)));
  const sqBotLabsG = new M.VGroup(...lay5.map(s => {
    const t = T(String(s.val), 16, C.muted, true);
    t.moveTo([s.cx, SQ_BASE - 0.22, 0]);
    return t;
  }));

  await until(S(7));
  await play(
    new M.Create(sqFloor),
    new M.LaggedStart(sqRects.map(r => new M.FadeIn(r)), { lagRatio: 0.10, runTime: 1.4 }),
    new M.FadeIn(sqGridsG),
    new M.FadeIn(sqBotLabsG),
    ...fbox(['gaps: −2−1−1+0+1+1+2', ['sum of gaps = 0', C.muted], ['→ square each gap', C.cyan]], C.cyan),
    ...say('GAPS CANCEL → SQUARE THEM', C.cyan)
  );

  // Beat 8: Positive area, larger gaps stand out even more
  await until(S(8));
  await play(
    new M.Indicate(sqRects[0], { color: C.amber }),
    new M.Indicate(sqRects[6], { color: C.amber }),
    ...say('BIG GAPS STAND OUT MORE', C.amber)
  );

  // Beat 9: 2-day gap -> 2 wide x 2 tall = 4 square days
  const dimW = T('2', 17, C.amber, true);
  dimW.moveTo([lay5[0].cx, SQ_BASE + 2 * SU + 0.18, 0]);
  const dimH = T('2', 17, C.amber, true);
  dimH.moveTo([lay5[0].cx - SU - 0.22, SQ_BASE + SU, 0]);
  const area0 = T('4', 19, C.amber, true);
  area0.moveTo([lay5[0].cx, SQ_BASE + SU, 0]);
  const area6 = T('4', 19, C.amber, true);
  area6.moveTo([lay5[6].cx, SQ_BASE + SU, 0]);

  await until(S(9));
  await play(
    new M.Indicate(sqRects[0], { color: C.amber }),
    new M.FadeIn(dimW), new M.FadeIn(dimH),
    new M.FadeIn(area0), new M.FadeIn(area6),
    ...fbox(['gap = 2 days', ['2 × 2 = 4 square days', C.amber]], C.amber),
    ...say('2 WIDE × 2 TALL = 4 SQ DAYS', C.amber)
  );

  // Beat 10: Square days measure area like square meters
  const tileHi = new M.Rectangle({ width: SU * 0.92, height: SU * 0.92, color: C.amber, strokeWidth: 2.5 });
  tileHi.setFill(C.amber, 0.35);
  tileHi.moveTo([lay5[0].cx - SU / 2, SQ_BASE + SU / 2, 0]);

  await until(S(10));
  await play(
    new M.FadeIn(tileHi),
    new M.Indicate(tileHi, { color: C.amber }),
    ...say('SQUARE DAYS = AREA', C.muted)
  );

  // Beat 11: One-day gaps make squares of 1, zero makes none
  const sqTopLabsG = new M.VGroup(...lay5.map(s => {
    const t = T(String(s.area), 17, s.area > 0 ? C.cyan : C.muted, true);
    t.moveTo([s.cx, SQ_BASE + s.side * SU + 0.22, 0]);
    return t;
  }));

  await until(S(11));
  await play(
    new M.FadeOut(new M.VGroup(dimW, dimH, area0, area6, tileHi)),
    new M.FadeIn(sqTopLabsG),
    new M.LaggedStart([1, 2, 4, 5].map(k => new M.Indicate(sqRects[k], { color: C.cyan })), { lagRatio: 0.15, runTime: 1.2 }),
    new M.Indicate(sqRects[3], { color: C.amber }),
    ...fbox(['gap 2 → 4 sq days', 'gap 1 → 1 sq day', ['gap 0 → 0', C.muted]], C.cyan),
    ...say('1-DAY → 1  ·  0-DAY → 0', C.cyan)
  );

  // Beat 12: Adding all seven squares gives 12 square days
  await until(S(12));
  await play(
    new M.LaggedStart(sqRects.map(r => new M.Indicate(r, { color: C.amber })), { lagRatio: 0.16, runTime: 2.2 }),
    ...fbox(['4 + 1 + 1 + 0 + 1 + 1 + 4', ['total = 12 square days', C.amber]], C.amber),
    ...say('TOTAL = 12 SQUARE DAYS', C.amber)
  );

  // =========================================================================
  // BEATS 13-17: Last lesson (12 / 7 = 1.71) and the catch for a sample
  // =========================================================================
  await until(S(13));
  await play(
    ...fbox(['total = 12 sq days', 'count = 7 parcels', ['variance = 12 ÷ 7', C.cyan]], C.cyan),
    ...say('LAST LESSON: 12 ÷ 7', C.cyan)
  );

  await until(S(14));
  await play(
    ...fbox(['total = 12 sq days', ['12 ÷ 7 ≈ 1.71 sq days', C.amber]], C.amber),
    ...say('12 ÷ 7 ≈ 1.71 SQUARE DAYS', C.amber)
  );

  await until(S(15));
  await play(
    ...fbox(['for a SAMPLE of 7:', ['dividing by 7 has a catch', C.pink]], C.pink),
    ...say('SAMPLE CATCH: WHY NOT ÷ 7?', C.pink)
  );

  // Beat 16: Unknown true population average (placed cleanly to the right of mean = 5)
  const qTag = T('true mean = ?', P ? 16 : 17, C.pink, true);
  qTag.moveTo([d2x(7), TAG_Y, 0]);

  await until(S(16));
  await play(
    new M.FadeIn(qTag),
    ...say('TRUE MEAN IS UNKNOWN', C.pink)
  );

  // Beat 17: Measured from 5 (balance point of these 7 alone)
  await until(S(17));
  await play(
    new M.Indicate(meanTag, { color: C.amber }),
    ...centerSegs.map(seg => new M.Indicate(seg, { color: C.amber })),
    ...say('MEASURED FROM SAMPLE MEAN 5', C.amber)
  );

  // =========================================================================
  // BEATS 18-22: Imagine true mean = 6 -> slide center line -> 12 to 19!
  // =========================================================================
  const true6Tag = T('true mean = 6', P ? 16 : 17, C.pink, true);
  true6Tag.moveTo([d2x(7), TAG_Y, 0]);

  await until(S(18));
  await play(
    new M.FadeOut(qTag),
    new M.FadeIn(true6Tag),
    ...fbox(['imagine true mean = 6', ['(not 5)', C.pink]], C.pink),
    ...say('SUPPOSE TRUE MEAN = 6', C.pink)
  );

  // Beat 19: Slide center line from 5 to 6 + swap deviation arrows
  const segs6Target = mkCenterSegs(d2x(6), C.pink);
  const true6At6 = T('true mean = 6', P ? 16 : 17, C.pink, true);
  true6At6.moveTo([d2x(6), TAG_Y, 0]);
  const arr6G = buildArrowsFrom6();

  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(meanTag, true6Tag, ...arr5)),
    ...centerSegs.map((seg, i) => new M.Transform(seg, segs6Target[i])),
    new M.FadeIn(true6At6),
    new M.FadeIn(arr6G),
    ...say('SLIDE CENTER LINE: 5 → 6', C.pink)
  );

  // Beat 20: Squares morph from c=5 (total 12) to c=6 (total 19)
  const lay6 = sqLayout(6);
  const sqDec6G = new M.VGroup(
    ...lay6.flatMap(s => mkSqGrid(s.side, s.cx)),
    ...lay6.map(s => {
      const col = s.area > (s.val - 5) ** 2 ? C.pink : (s.area < (s.val - 5) ** 2 ? C.green : C.muted);
      const t = T(String(s.area), 17, col, true);
      t.moveTo([s.cx, SQ_BASE + s.side * SU + 0.22, 0]);
      return t;
    }),
    ...lay6.map(s => {
      const t = T(String(s.val), 16, C.muted, true);
      t.moveTo([s.cx, SQ_BASE - 0.22, 0]);
      return t;
    })
  );

  await until(S(20));
  await play(
    new M.FadeOut(new M.VGroup(sqGridsG, sqTopLabsG, sqBotLabsG)),
    ...lay6.map((s, k) => {
      const col = s.area > (s.val - 5) ** 2 ? C.pink : (s.area < (s.val - 5) ** 2 ? C.green : C.muted);
      return new M.Transform(sqRects[k], mkSqRect(s.side, s.cx, col, 0.72), { runTime: 1.6 });
    }),
    new M.FadeIn(sqDec6G),
    ...fbox(['from 6: 9+4+4+1+0+0+1', ['total = 19 sq days', C.pink], ['(was 12 from 5!)', C.amber]], C.pink),
    ...say('TOTAL LIFTS: 12 → 19', C.pink)
  );

  // Beat 21: Slide back to 5 to show sample mean ALWAYS gives smallest total
  const segs5Target = mkCenterSegs(d2x(5), C.amber);
  const meanTagBack = T('mean = 5', P ? 16 : 17, C.amber, true);
  meanTagBack.moveTo([d2x(5), TAG_Y, 0]);
  const backDecG = new M.VGroup(
    meanTagBack,
    ...buildArrowsFrom5(),
    ...lay5.flatMap(s => mkSqGrid(s.side, s.cx)),
    ...lay5.map(s => {
      const t = T(String(s.area), 17, s.area > 0 ? C.cyan : C.muted, true);
      t.moveTo([s.cx, SQ_BASE + s.side * SU + 0.22, 0]);
      return t;
    }),
    ...lay5.map(s => {
      const t = T(String(s.val), 16, C.muted, true);
      t.moveTo([s.cx, SQ_BASE - 0.22, 0]);
      return t;
    })
  );

  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(true6At6, arr6G, sqDec6G)),
    ...centerSegs.map((seg, i) => new M.Transform(seg, segs5Target[i], { runTime: 1.4 })),
    ...lay5.map((s, k) => new M.Transform(sqRects[k], mkSqRect(s.side, s.cx, C.cyan, 0.72), { runTime: 1.4 })),
    new M.FadeIn(backDecG),
    ...fbox(['from sample mean 5: 12', ['always the smallest total', C.amber]], C.amber),
    ...say('SAMPLE MEAN = SMALLEST TOTAL', C.amber)
  );

  // Beat 22: Sample mean rarely matches true mean -> shrinks the total
  await until(S(22));
  await play(
    ...fbox(['sample mean ≠ true mean', ['→ total of squares shrinks', C.pink]], C.pink),
    ...say('SAMPLE MEAN SHRINKS TOTAL', C.pink)
  );

  // =========================================================================
  // BEATS 23-26: Many random samples (÷7 too low on avg) & Cake (6 vs 7)
  // =========================================================================
  const MS_Y = P ? -0.3 : -1.35;
  const MS_L = CX - (P ? 3.1 : 3.5), MS_R = CX + (P ? 3.1 : 3.5);
  const v2x = v => MS_L + (v / 4) * (MS_R - MS_L);
  const msAxis = new M.Line({ start: [MS_L, MS_Y, 0], end: [MS_R, MS_Y, 0], color: C.muted, strokeWidth: 3 });
  const msTicks = [];
  for (let v = 0; v <= 4; v++) {
    msTicks.push(new M.Line({ start: [v2x(v), MS_Y - 0.08, 0], end: [v2x(v), MS_Y + 0.08, 0], color: C.muted, strokeWidth: 2 }));
    const tl = T(String(v), 17, C.muted, true); tl.moveTo([v2x(v), MS_Y - 0.30, 0]);
    msTicks.push(tl);
  }
  const msUnit = T('estimate (sq days)', 16, C.muted);
  msUnit.moveTo([CX, MS_Y - 0.65, 0]);
  const msTicksG = new M.VGroup(...msTicks, msUnit);
  const trueLine = new M.DashedLine({ start: [v2x(2), MS_Y, 0], end: [v2x(2), MS_Y + (P ? 2.4 : 2.1), 0], color: C.green });
  const trueTag = T('TRUE SPREAD = 2', P ? 16 : 17, C.green, true);
  trueTag.moveTo([v2x(2), MS_Y + (P ? 2.62 : 2.30), 0]);

  const highDot = new M.Dot({ point: [v2x(3.1), MS_Y + 0.40, 0], radius: 0.13, color: C.amber });
  highDot.setFill(C.amber, 1);
  const highLab = T('1 wide week: too high', 16, C.amber);
  highLab.moveTo([v2x(3.1) - 0.2, MS_Y + 0.78, 0]);

  await until(S(23));
  await play(
    new M.FadeOut(new M.VGroup(
      axis, ticksG, ...parcels.map(p => p.g),
      ...centerSegs, backDecG, sqFloor, ...sqRects
    )),
    new M.Create(msAxis),
    new M.FadeIn(msTicksG),
    new M.Create(trueLine),
    new M.FadeIn(trueTag),
    new M.FadeIn(highDot),
    new M.FadeIn(highLab),
    ...fbox(['1 random week:', ['can still guess too high', C.amber]], C.amber),
    ...say('ONE WEEK CAN BE TOO HIGH', C.amber)
  );

  // Beat 24: Many random samples -> ÷7 averages too low (1.71)
  const sampleVals7 = [0.7, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.1, 2.4, 3.66];
  const sampleDots7 = sampleVals7.map((v, i) => {
    const dy = 0.40 + (i % 3) * 0.34;
    const d = new M.Dot({ point: [v2x(v), MS_Y + dy, 0], radius: 0.10, color: C.pink });
    d.setFill(C.pink, 0.9);
    return d;
  });
  const avg7Line = new M.Line({ start: [v2x(1.71), MS_Y, 0], end: [v2x(1.71), MS_Y + 1.55, 0], color: C.pink, strokeWidth: 3 });
  const avg7Tag = T('avg (÷7) ≈ 1.71', P ? 16 : 17, C.pink, true);
  avg7Tag.moveTo([v2x(1.05), MS_Y + 1.80, 0]);

  await until(S(24));
  await play(
    new M.FadeOut(highLab),
    new M.LaggedStart(sampleDots7.map(d => new M.FadeIn(d)), { lagRatio: 0.06, runTime: 1.6 }),
    new M.Create(avg7Line),
    new M.FadeIn(avg7Tag),
    ...fbox(['many random samples (÷ 7)', ['average ≈ 1.71 < 2', C.pink], ['guesses too low on average', C.pink]], C.pink),
    ...say('ON AVERAGE, ÷ 7 IS TOO LOW', C.pink)
  );

  // Beat 25: Sharing a cake among 6 vs 7
  const cakeW = P ? 6.2 : 6.8, cakeH = P ? 0.85 : 0.72;
  const cakeY7 = P ? 1.45 : 0.25, cakeY6 = P ? -0.45 : -1.35;
  const slices7 = Array.from({ length: 7 }, (_, i) => {
    const w = cakeW / 7;
    const r = new M.Rectangle({ width: w - 0.04, height: cakeH, color: i === 0 ? C.pink : C.muted, strokeWidth: 2 });
    r.setFill(i === 0 ? C.pink : C.card, i === 0 ? 0.75 : 0.85);
    r.moveTo([CX - cakeW / 2 + (i + 0.5) * w, cakeY7, 0]);
    return r;
  });
  const slices6 = Array.from({ length: 6 }, (_, i) => {
    const w = cakeW / 6;
    const r = new M.Rectangle({ width: w - 0.04, height: cakeH, color: i === 0 ? C.green : C.muted, strokeWidth: 2 });
    r.setFill(i === 0 ? C.green : C.card, i === 0 ? 0.78 : 0.85);
    r.moveTo([CX - cakeW / 2 + (i + 0.5) * w, cakeY6, 0]);
    return r;
  });
  const cakeLab7 = T('÷ 7: smaller slice', 17, C.pink);
  cakeLab7.moveTo([CX, cakeY7 + cakeH / 2 + 0.26, 0]);
  const cakeLab6 = T('÷ 6: bigger slice', 17, C.green);
  cakeLab6.moveTo([CX, cakeY6 + cakeH / 2 + 0.26, 0]);
  const cakeG = new M.VGroup(...slices7, cakeLab7, ...slices6, cakeLab6);

  await until(S(25));
  await play(
    new M.FadeOut(new M.VGroup(msAxis, msTicksG, trueLine, trueTag, highDot, ...sampleDots7, avg7Line, avg7Tag)),
    new M.FadeIn(cakeG),
    ...fbox(['same total, fewer shares', ['÷ 6 lifts the estimate', C.green]], C.green),
    ...say('DIVIDE BY LESS → BIGGER', C.green)
  );

  // Beat 26: Why 6, and not 5 or 4?
  await until(S(26));
  await play(
    ...fbox(['why divide by 6?', ['why not 5 or 4?', C.amber]], C.amber),
    ...say('WHY 6, NOT 5 OR 4?', C.amber)
  );

  // =========================================================================
  // BEATS 27-36: Degrees of freedom — balance at 5, hide 7th parcel!
  // =========================================================================
  const ax2 = buildAxis(true);
  const p2 = buildParcelDots();
  const cSegs2 = mkCenterSegs(d2x(5), C.amber);
  const mTag2 = T('mean = 5 (balance)', P ? 16 : 17, C.amber, true);
  mTag2.moveTo([d2x(5), TAG_Y, 0]);
  const fx = d2x(5), fy = AXIS_Y - 0.44;
  const fulc = new M.VGroup(
    new M.Line({ start: [fx, AXIS_Y - 0.06, 0], end: [fx - 0.24, fy, 0], color: C.amber, strokeWidth: 2.5 }),
    new M.Line({ start: [fx, AXIS_Y - 0.06, 0], end: [fx + 0.24, fy, 0], color: C.amber, strokeWidth: 2.5 }),
    new M.Line({ start: [fx - 0.24, fy, 0], end: [fx + 0.24, fy, 0], color: C.amber, strokeWidth: 2.5 })
  );
  const cSegs2G = new M.VGroup(...cSegs2, mTag2, fulc);
  const a5_2 = buildArrowsFrom5();

  await until(S(27));
  await play(
    new M.FadeOut(cakeG),
    new M.Create(ax2.axis),
    new M.FadeIn(ax2.ticksG),
    ...p2.map(p => new M.FadeIn(p.g)),
    new M.FadeIn(cSegs2G),
    ...a5_2.map(g => new M.FadeIn(g)),
    ...fbox(['below 5: −2, −1, −1', 'above 5: +1, +1, +2', ['gaps balance to 0', C.amber]], C.amber),
    ...say('GAPS MUST BALANCE TO 0', C.amber)
  );

  // Beat 28: Hide the 7th parcel (index 6, value 7)
  const hideQ = T('?', 28, C.amber, true);
  hideQ.moveTo([d2x(7), Y0 + 0.04, 0]);
  const hideRing = new M.Circle({ radius: 0.28, color: C.amber });
  hideRing.setFill(C.bg, 0.6); hideRing.moveTo([d2x(7), Y0 + 0.04, 0]);

  await until(S(28));
  await play(
    new M.FadeOut(p2[6].g),
    new M.FadeOut(a5_2[6]),
    new M.FadeIn(hideRing), new M.FadeIn(hideQ),
    ...fbox(['first 6 parcels: shown', ['7th parcel: hidden (?)', C.violet]], C.violet),
    ...say('HIDE THE 7TH PARCEL', C.violet)
  );

  // Beat 29: Both 4-day parcels (-1, -1) and both 6-day parcels (+1, +1)
  await until(S(29));
  await play(
    new M.Indicate(p2[1].g, { color: C.violet }),
    new M.Indicate(p2[2].g, { color: C.violet }),
    new M.Indicate(p2[4].g, { color: C.green }),
    new M.Indicate(p2[5].g, { color: C.green }),
    ...fbox(['4, 4  →  −1, −1', '6, 6  →  +1, +1'], C.cyan),
    ...say('TWO AT −1  ·  TWO AT +1', C.cyan)
  );

  // Beat 30: They cancel out, and 5 sits on 5 with no gap
  await until(S(30));
  await play(
    new M.FadeOut(new M.VGroup(a5_2[1], a5_2[2], a5_2[4], a5_2[5])),
    new M.Indicate(p2[3].g, { color: C.amber }),
    ...fbox(['−1 − 1 + 1 + 1 = 0', ['parcel at 5 → gap = 0', C.muted]], C.muted),
    ...say('THEY CANCEL · 5 HAS GAP 0', C.muted)
  );

  // Beat 31: Only the 3-day parcel remains, two days below 5
  await until(S(31));
  await play(
    new M.Indicate(p2[0].g, { color: C.violet }),
    new M.Indicate(a5_2[0], { color: C.violet }),
    ...fbox(['only parcel 3 remains', ['gap = −2 (two below 5)', C.violet]], C.violet),
    ...say('ONLY 3 REMAINS: −2', C.violet)
  );

  // Beat 32: Pause and predict where the 7th parcel must sit
  await until(S(32));
  await play(
    new M.Indicate(hideRing, { color: C.amber }),
    new M.Indicate(hideQ, { color: C.amber }),
    ...fbox(['−2 + (?) = 0', ['where must #7 sit?', C.amber]], C.amber),
    ...say('PREDICT: WHERE IS #7?', C.amber)
  );

  // Beat 33: Reveal #7 at 7 (+2) — locked, no choice left!
  const p7Halo = new M.Dot({ point: [d2x(7), Y0, 0], radius: 0.26, color: C.pink }); p7Halo.setFill(C.pink, 0.25);
  const p7Dot = new M.Dot({ point: [d2x(7), Y0, 0], radius: 0.12, color: C.pink }); p7Dot.setFill(C.pink, 1);
  const d6New = new M.Line({ start: [d2x(7), Y0 + 0.12, 0], end: [d2x(7), Y2, 0], color: C.pink, strokeWidth: 1.8 });
  const a6New = mkArrow(d2x(5), d2x(7), Y2, C.pink);
  const l6New = T('+2 (locked)', 15, C.pink, true); l6New.moveTo([d2x(7) + 0.24 + l6New.getWidth() / 2, Y2, 0]);
  const p7ArrG = new M.VGroup(d6New, a6New, l6New);

  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(hideRing, hideQ)),
    new M.FadeIn(p7Halo), new M.FadeIn(p7Dot), new M.Flash(p7Dot, { color: C.pink }),
    new M.FadeIn(p7ArrG),
    ...fbox(['−2 + (+2) = 0', ['#7 MUST sit at 7 (locked!)', C.pink]], C.pink),
    ...say('AT 7 (+2): NO CHOICE LEFT', C.pink)
  );

  // Beat 34: Only 6 of the 7 gaps are truly free to vary
  const freeLabels = [0, 1, 2, 3, 4, 5].map(k => {
    const t = T(String(k + 1), 16, C.green, true);
    const dx = k >= 4 ? 0.28 : -0.28;
    t.moveTo([d2x(D[k]) + dx, dotY(k), 0]);
    return t;
  });
  const freeBadge = pill('6 FREE', C.green, 16);
  freeBadge.moveTo([CX - (P ? 1.4 : 1.7), AXIS_Y - 1.25, 0]);
  const lockBadge = pill('1 LOCKED', C.pink, 16);
  lockBadge.moveTo([CX + (P ? 1.4 : 1.7), AXIS_Y - 1.25, 0]);

  await until(S(34));
  await play(
    new M.LaggedStart(freeLabels.map(t => new M.FadeIn(t)), { lagRatio: 0.10, runTime: 1.1 }),
    new M.FadeIn(freeBadge), new M.FadeIn(lockBadge),
    ...say('6 FREE GAPS · 1 LOCKED', C.green)
  );

  // Beat 35: Degrees of freedom = free choices
  await until(S(35));
  await play(
    new M.Indicate(freeBadge, { color: C.green }),
    ...fbox(['degrees of freedom', ['= free choices = 6', C.green]], C.green),
    ...say('DEGREES OF FREEDOM = 6', C.green)
  );

  // Beat 36: Finding sample average locked in 1 gap: 7 - 1 = 6
  await until(S(36));
  await play(
    new M.Indicate(lockBadge, { color: C.pink }),
    ...fbox(['count = 7', 'locked by mean = 1', ['7 − 1 = 6 free choices', C.green]], C.green),
    ...say('7 − 1 = 6 FREE CHOICES', C.green)
  );

  // =========================================================================
  // BEATS 37-40: Locked gap shrinks total -> 12 holds 6 shares -> 12 / 6 = 2
  // =========================================================================
  const MID_BASE = P ? 0.5 : -0.75;
  const sqMidRects = lay5.map(s => {
    const sz = s.side > 0 ? s.side * SU : 0.10;
    const r = new M.Rectangle({ width: sz, height: sz, color: C.cyan, strokeWidth: 2 });
    r.setFill(C.cyan, s.side > 0 ? 0.72 : 0.35);
    r.moveTo([s.cx, MID_BASE + sz / 2, 0]);
    return r;
  });
  const sqMidLabs = lay5.map(s => {
    const t = T(String(s.area), 17, s.area > 0 ? C.cyan : C.muted, true);
    t.moveTo([s.cx, MID_BASE + s.side * SU + 0.22, 0]);
    return t;
  });
  const sqMidFloor = new M.Line({ start: [CX - (P ? 3.4 : 3.7), MID_BASE, 0], end: [CX + (P ? 3.4 : 3.7), MID_BASE, 0], color: C.muted, strokeWidth: 2 });
  const tot12Lab = T('total = 12 square days', 18, C.amber, true);
  tot12Lab.moveTo([CX, MID_BASE - 0.36, 0]);
  const sqMidG = new M.VGroup(...sqMidRects, ...sqMidLabs, tot12Lab);

  await until(S(37));
  await play(
    new M.FadeOut(new M.VGroup(
      ax2.axis, ax2.ticksG,
      ...p2.slice(0, 6).map(p => p.g), p7Halo, p7Dot,
      cSegs2G, a5_2[0], a5_2[3], p7ArrG,
      ...freeLabels, freeBadge, lockBadge
    )),
    new M.Create(sqMidFloor),
    new M.FadeIn(sqMidG),
    ...fbox(['locked gap shrinks total', ['by ~1 parcel of spread', C.violet]], C.violet),
    ...say('SHRUNK BY 1 PARCEL SHARE', C.violet)
  );

  // Beat 38: 12 square days split into 6 equal shares (not 7)
  const shareY = P ? -1.75 : -2.25;
  const shW = P ? 0.88 : 1.00, shGap = P ? 0.18 : 0.20;
  const shTotalW = 6 * shW + 5 * shGap;
  const shBoxes = [], shNums = [];
  for (let i = 0; i < 6; i++) {
    const sx = CX - shTotalW / 2 + i * (shW + shGap) + shW / 2;
    const b1 = new M.Rectangle({ width: shW * 0.45, height: 0.40, color: C.green, strokeWidth: 1.8 });
    b1.setFill(C.green, 0.72); b1.moveTo([sx - shW * 0.24, shareY, 0]);
    const b2 = new M.Rectangle({ width: shW * 0.45, height: 0.40, color: C.green, strokeWidth: 1.8 });
    b2.setFill(C.green, 0.72); b2.moveTo([sx + shW * 0.24, shareY, 0]);
    shBoxes.push(b1, b2);
    const n = T(String(i + 1), 15, C.muted, true);
    n.moveTo([sx, shareY - 0.38, 0]);
    shNums.push(n);
  }
  const shTitle = T('6 free choices hold the 12 square days', P ? 16 : 17, C.green);
  shTitle.moveTo([CX, shareY + (P ? 0.68 : 0.66), 0]);

  await until(S(38));
  await play(
    new M.LaggedStart(shBoxes.map(b => new M.FadeIn(b)), { lagRatio: 0.05, runTime: 1.2 }),
    ...shNums.map(n => new M.FadeIn(n)),
    new M.FadeIn(shTitle),
    ...fbox(['total = 12 sq days', ['holds 6 shares, not 7', C.green]], C.green),
    ...say('6 PARCELS OF SPREAD, NOT 7', C.green)
  );

  // Beat 39: Divide 12 by those 6 free choices
  await until(S(39));
  await play(
    new M.LaggedStart(shNums.map(n => new M.Indicate(n, { color: C.amber })), { lagRatio: 0.12, runTime: 1.2 }),
    ...fbox(['total = 12 sq days', 'free choices = 6', ['12 ÷ 6', C.green]], C.green),
    ...say('DIVIDE 12 BY 6 CHOICES', C.green)
  );

  // Beat 40: 12 / 6 = 2 square days (bigger than 1.71)
  const twoLabsG = new M.VGroup(...Array.from({ length: 6 }, (_, i) => {
    const sx = CX - shTotalW / 2 + i * (shW + shGap) + shW / 2;
    const t = T('2', 17, C.amber, true);
    t.moveTo([sx, shareY + 0.35, 0]);
    return t;
  }));

  await until(S(40));
  await play(
    new M.FadeIn(twoLabsG),
    ...fbox(['12 ÷ 6 = 2 sq days', ['bigger than 1.71 (÷ 7)', C.amber]], C.amber),
    ...say('12 ÷ 6 = 2 SQUARE DAYS', C.amber)
  );

  // =========================================================================
  // BEATS 41-43: Many random samples (÷6 fixes shortfall), name, formula
  // =========================================================================
  const C_Y = P ? -1.75 : -2.15;
  const cAxis = new M.Line({ start: [MS_L, C_Y, 0], end: [MS_R, C_Y, 0], color: C.muted, strokeWidth: 3 });
  const cTicks = [];
  for (let v = 0; v <= 4; v++) {
    cTicks.push(new M.Line({ start: [v2x(v), C_Y - 0.08, 0], end: [v2x(v), C_Y + 0.08, 0], color: C.muted, strokeWidth: 2 }));
    const tl = T(String(v), 17, C.muted, true); tl.moveTo([v2x(v), C_Y - 0.30, 0]);
    cTicks.push(tl);
  }
  const cTrue = new M.DashedLine({ start: [v2x(2), C_Y, 0], end: [v2x(2), C_Y + (P ? 3.5 : 2.9), 0], color: C.green });
  const cTrueTag = T('TRUE = 2', 17, C.green, true);
  cTrueTag.moveTo([v2x(2), C_Y + (P ? 3.72 : 3.12), 0]);
  const cTicksG = new M.VGroup(...cTicks, cTrueTag);

  const row7Y = C_Y + (P ? 2.15 : 1.85), row6Y = C_Y + (P ? 0.75 : 0.65);
  const all16 = [3.1, ...sampleVals7];
  const dots7C = all16.map((v, i) => {
    const d = new M.Dot({ point: [v2x(v), row7Y + (i % 3) * 0.24, 0], radius: 0.09, color: C.pink });
    d.setFill(C.pink, 0.85); return d;
  });
  const dots6C = all16.map((v, i) => {
    const v6 = Math.min(3.95, v * 7 / 6);
    const d = new M.Dot({ point: [v2x(v6), row6Y + (i % 3) * 0.24, 0], radius: 0.09, color: C.green });
    d.setFill(C.green, 0.9); return d;
  });
  const m7 = new M.Line({ start: [v2x(1.71), row7Y - 0.15, 0], end: [v2x(1.71), row7Y + 0.75, 0], color: C.pink, strokeWidth: 3.5 });
  const m7Lab = T('÷ 7 avg ≈ 1.71', 15, C.pink, true);
  m7Lab.moveTo([MS_L + 1.05, row7Y + 0.88, 0]);
  const row7G = new M.VGroup(...dots7C, m7, m7Lab);

  const m6 = new M.Line({ start: [v2x(2.0), row6Y - 0.15, 0], end: [v2x(2.0), row6Y + 0.75, 0], color: C.amber, strokeWidth: 3.5 });
  const m6Lab = T('÷ 6 avg ≈ 2.00', 15, C.green, true);
  m6Lab.moveTo([MS_L + 1.05, row6Y + 0.88, 0]);

  await until(S(41));
  await play(
    new M.FadeOut(new M.VGroup(sqMidFloor, sqMidG, ...shBoxes, ...shNums, shTitle, twoLabsG)),
    new M.Create(cAxis),
    new M.FadeIn(cTicksG),
    new M.Create(cTrue),
    new M.FadeIn(row7G),
    new M.LaggedStart(dots6C.map(d => new M.FadeIn(d)), { lagRatio: 0.04, runTime: 1.2 }),
    new M.Create(m6), new M.FadeIn(m6Lab),
    ...fbox(['across many samples:', '÷ 7 avg ≈ 1.71 (too low)', ['÷ 6 avg ≈ 2.00 (fair!)', C.green]], C.green),
    ...say('÷ 6 FIXES THE SHORTFALL', C.green)
  );

  // Beat 42: Name — sample variance
  await until(S(42));
  await play(
    new M.Indicate(m6Lab, { color: C.cyan }),
    ...fbox([['sample variance', C.cyan], ['= 2 square days', C.amber]], C.cyan),
    ...say('SAMPLE VARIANCE', C.cyan)
  );

  // Beat 43: The formula
  await until(S(43));
  await play(
    ...fbox([['sample variance =', C.ink], ['  sum of sq gaps ÷ (count−1)', C.amber], ['  = 12 ÷ (7 − 1) = 2', C.green]], C.amber),
    ...say('SUM OF SQUARES ÷ (COUNT−1)', C.amber)
  );

  // =========================================================================
  // BEATS 44-46: When to use, common trap, one-sentence recap
  // =========================================================================
  const cardW = P ? 6.4 : 3.85, cardH = P ? 1.85 : 2.35;
  const c1Pos = P ? [0, 1.55, 0] : [CX - 2.08, -0.45, 0];
  const c2Pos = P ? [0, -0.85, 0] : [CX + 2.08, -0.45, 0];

  function mkCard(pos, color, head, sub, rule) {
    const r = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.18, color, strokeWidth: 2.2 });
    r.setFill(C.card, 0.95); r.moveTo(pos);
    const maxW = cardW - 0.36;
    const t1 = T(head, P ? 19 : 18, color, true);
    if (t1.getWidth() > maxW) t1.scaleToFitWidth(maxW);
    t1.moveTo([pos[0], pos[1] + cardH * 0.27, 0]);
    const t2 = T(sub, 16, C.muted);
    if (t2.getWidth() > maxW) t2.scaleToFitWidth(maxW);
    t2.moveTo([pos[0], pos[1], 0]);
    const t3 = T(rule, P ? 18 : 17, C.ink, true);
    if (t3.getWidth() > maxW) t3.scaleToFitWidth(maxW);
    t3.moveTo([pos[0], pos[1] - cardH * 0.28, 0]);
    return new M.VGroup(r, t1, t2, t3);
  }

  const cardSample = mkCard(c1Pos, C.green, 'SAMPLE → POPULATION', 'estimate larger group', 'divide by count − 1 (÷ 6)');
  const cardWhole = mkCard(c2Pos, C.pink, 'ENTIRE GROUP ONLY', 'all parcels you care about', 'divide by count (÷ 7)');

  await until(S(44));
  await play(
    new M.FadeOut(new M.VGroup(cAxis, cTicksG, cTrue, row7G, ...dots6C, m6, m6Lab)),
    new M.FadeIn(cardSample),
    ...say('SAMPLE → USE ÷ (COUNT − 1)', C.green)
  );

  await until(S(45));
  await play(
    new M.FadeIn(cardWhole),
    new M.Indicate(cardWhole, { color: C.pink }),
    ...say('TRAP: ÷ 7 ONLY FOR WHOLE GROUP', C.pink)
  );

  await until(S(46));
  await play(
    new M.Indicate(cardSample, { color: C.green }),
    ...fbox([['sample variance', C.green], 'sum of squares ÷ (count − 1)', ['fair on average!', C.amber]], C.green),
    ...say('DIVIDE BY ONE LESS → FAIR', C.green)
  );
}
