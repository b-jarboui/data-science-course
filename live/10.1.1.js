// 10.1.1 Conditional means: mean rent at each size.
// Beat i = sentence i (0-based, 0..39). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  const AREAS = [40, 60, 80, 100];
  const MEANS = [800, 1000, 1200, 1400];
  const COLS = [
    [860, 770, 770],
    [1040, 1020, 940],
    [1250, 1210, 1140],
    [1470, 1380, 1350]
  ];
  const DX = [
    [0, -0.13, 0.13],
    [-0.07, 0.07, 0],
    [0, 0.11, 0],
    [0, -0.08, 0.08]
  ];

  // Layout constants: laptop y in [-3.0, 2.3], phone y in [-5.5, 4.3]
  const PX0 = P ? -2.50 : -5.40, PX1 = P ? 3.50 : 1.60;
  const PY0 = P ? -4.55 : -2.25, PY1 = P ? 1.15 : 1.15;
  const CX = (PX0 + PX1) / 2;
  const PILL = P ? [0, 2.22, 0] : [CX, 1.92, 0];
  const BOXP = P ? [0, 3.50, 0] : [4.45, -0.35, 0];

  const ax = a => PX0 + (a - 20) / 100 * (PX1 - PX0);
  const ay = r => PY0 + (r - 600) / 1000 * (PY1 - PY0);
  const pt = (a, r, dx = 0) => [ax(a) + dx, ay(r), 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, 18);
  const fmtDollar = v => '$' + v.toLocaleString('en-US');

  // Formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.37 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
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

  function makeBuilding(cx, gy, w, h, cols, rows, color) {
    const parts = [];
    const body = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.12, color, strokeWidth: 2.4 });
    body.setFill(C.card, 0.95);
    body.moveTo([cx, gy + h / 2, 0]);
    parts.push(body);
    const ww = (w * 0.68) / cols, wh = (h * 0.56) / rows;
    const gx = (w * 0.82) / cols, gyy = (h * 0.66) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const win = new M.Rectangle({ width: ww * 0.72, height: wh * 0.72, color, strokeWidth: 1 });
        win.setFill(color, 0.72);
        win.moveTo([cx + (c - (cols - 1) / 2) * gx, gy + h * 0.34 + (r + 0.5) * gyy, 0]);
        parts.push(win);
      }
    }
    const door = new M.Rectangle({ width: w * 0.22, height: h * 0.22, color: C.muted, strokeWidth: 1.5 });
    door.setFill(C.muted, 0.35);
    door.moveTo([cx, gy + h * 0.11, 0]);
    parts.push(door);
    return new M.VGroup(...parts);
  }

  function makeArrow(from, to, color = C.cyan, dashed = false, sw = 2.6) {
    const dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, hl = Math.min(0.22, len * 0.35), hw = hl * 0.55;
    const shaft = dashed
      ? new M.DashedLine({ start: from, end: to, color })
      : new M.Line({ start: from, end: to, color, strokeWidth: sw });
    const bx = to[0] - ux * hl, by = to[1] - uy * hl;
    const h1 = new M.Line({ start: to, end: [bx - uy * hw, by + ux * hw, 0], color, strokeWidth: sw });
    const h2 = new M.Line({ start: to, end: [bx + uy * hw, by - ux * hw, 0], color, strokeWidth: sw });
    return new M.VGroup(shaft, h1, h2);
  }

  function makeStar(p, color = C.amber, r = P ? 0.21 : 0.19) {
    const [x, y] = p, ri = r * 0.42;
    const pts = Array.from({ length: 10 }, (_, k) => {
      const a = Math.PI / 2 + k * Math.PI / 5, rad = k % 2 === 0 ? r : ri;
      return [x + rad * Math.cos(a), y + rad * Math.sin(a), 0];
    });
    const halo = new M.Dot({ point: [x, y, 0], radius: r * 1.9, color });
    halo.setFill(color, 0.22);
    const core = new M.Dot({ point: [x, y, 0], radius: ri * 0.95, color });
    core.setFill(color, 1);
    const edges = pts.map((q, k) => new M.Line({ start: q, end: pts[(k + 1) % 10], color, strokeWidth: 2.8 }));
    const spokes = [0, 2, 4, 6, 8].map(k => new M.Line({ start: [x, y, 0], end: pts[k], color, strokeWidth: 3.2 }));
    return { group: new M.VGroup(halo, core, ...spokes, ...edges), core };
  }

  function makeColFrame(c, color = C.cyan) {
    const vals = COLS[c], lo = Math.min(...vals), hi = Math.max(...vals);
    const h = Math.max(ay(hi) - ay(lo) + (P ? 0.72 : 0.56), P ? 1.15 : 0.88);
    const w = P ? 0.84 : 0.92;
    const f = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: 2.2 });
    f.moveTo([ax(AREAS[c]), (ay(lo) + ay(hi)) / 2, 0]);
    return f;
  }

  // 0: Imagine you are looking for an apartment to rent.
  const GY = P ? -2.30 : -1.65;
  const smallX = P ? -1.70 : -2.30, bigX = P ? 1.50 : 2.20;
  const smallApt = makeBuilding(smallX, GY, P ? 1.35 : 1.45, P ? 1.55 : 1.45, 2, 2, C.cyan);
  const smallTag = T('small place', P ? 17 : 19, C.cyan, true);
  smallTag.moveTo([smallX, GY - 0.36, 0]);
  await until(S(0));
  await play(new M.FadeIn(smallApt, { runTime: 1.0 }), new M.FadeIn(smallTag, { runTime: 1.0 }), ...say('LOOKING FOR AN APARTMENT'));

  // 1: You wonder: how much more rent should I expect for a bigger place?
  const bigApt = makeBuilding(bigX, GY, P ? 2.05 : 2.20, P ? 2.40 : 2.20, 3, 3, C.amber);
  const bigTag = T('bigger place · +$?', P ? 17 : 19, C.amber, true);
  bigTag.moveTo([bigX, GY - 0.36, 0]);
  const cmpArrow = makeArrow([smallX + (P ? 0.85 : 0.95), GY + 0.95, 0], [bigX - (P ? 1.25 : 1.35), GY + 0.95, 0], C.amber, false, 3);
  await until(S(1));
  await play(new M.FadeIn(bigApt, { runTime: 1.0 }), new M.FadeIn(bigTag, { runTime: 1.0 }), new M.FadeIn(cmpArrow, { runTime: 0.9 }), ...say('BIGGER PLACE → MORE RENT?', C.amber));

  // 2: You collect twelve apartments from one neighbourhood.
  const cardW = P ? 1.66 : 2.35, cardH = P ? 1.12 : 0.98, gapX = P ? 0.14 : 0.25, gapY = P ? 0.22 : 0.22;
  const gridY = P ? -1.35 : -0.58;
  const cards = [], cardNums = [];
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 3; r++) {
      const x = (c - 1.5) * (cardW + gapX);
      const y = gridY + (1 - r) * (cardH + gapY);
      const box = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.14, color: C.cyan, strokeWidth: 1.8 });
      box.setFill(C.card, 0.92);
      box.moveTo([x, y, 0]);
      cards.push(box);
      const tArea = T(`${AREAS[c]} m²`, P ? 15 : 18, C.cyan, true);
      tArea.moveTo([x, y + (P ? 0.20 : 0.18), 0]);
      const tRent = T(fmtDollar(COLS[c][r]), P ? 15 : 18, C.amber, true);
      tRent.moveTo([x, y - (P ? 0.20 : 0.18), 0]);
      cardNums.push(new M.VGroup(tArea, tRent));
    }
  }
  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(smallApt, smallTag, bigApt, bigTag, cmpArrow), { runTime: 0.7 }),
    new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.08, runTime: 1.5 }),
    ...say('12 APARTMENTS · 1 NEIGHBOURHOOD')
  );

  // 3: For each one, you write down two numbers: its floor area and its monthly rent.
  await until(S(3));
  await play(
    new M.LaggedStart(cardNums.map(n => new M.FadeIn(n)), { lagRatio: 0.08, runTime: 1.9 }),
    ...say('TWO NUMBERS: AREA & RENT', C.amber)
  );

  // 4: Floor area is the size of the floor, measured in square metres.
  const sq = P ? 0.84 : 0.70, fCols = 5, fRows = 3, fCY = P ? -1.35 : -0.52;
  const fParts = [];
  for (let r = 0; r < fRows; r++) {
    for (let c = 0; c < fCols; c++) {
      const hi = r === fRows - 1 && c === 0;
      const tile = new M.Rectangle({ width: sq * 0.94, height: sq * 0.94, color: hi ? C.amber : C.cyan, strokeWidth: hi ? 2.5 : 1.5 });
      tile.setFill(hi ? C.amber : C.cyan, hi ? 0.32 : 0.10);
      tile.moveTo([(c - (fCols - 1) / 2) * sq, fCY + (r - (fRows - 1) / 2) * sq, 0]);
      fParts.push(tile);
    }
  }
  const oneSq = T('1 m²', P ? 15 : 16, C.amber, true, true);
  oneSq.moveTo([-(fCols - 1) / 2 * sq, fCY + (fRows - 1) / 2 * sq, 0]);
  const floorCap = T('count the 1 m × 1 m squares on the floor', P ? 17 : 19, C.muted);
  floorCap.moveTo([0, fCY - fRows / 2 * sq - 0.45, 0]);
  fParts.push(oneSq, floorCap);
  const floorGroup = new M.VGroup(...fParts);
  await until(S(4));
  await play(
    new M.FadeOut(new M.VGroup(...cards, ...cardNums), { runTime: 0.7 }),
    new M.FadeIn(floorGroup, { runTime: 1.1 }),
    ...say('FLOOR AREA = SQUARE METRES')
  );

  // 5: Let's place each apartment as a dot. Area goes across, rent goes up.
  const xAxis = new M.Line({ start: [PX0, PY0, 0], end: [PX1, PY0, 0], color: C.muted, strokeWidth: 2.8 });
  const yAxis = new M.Line({ start: [PX0, PY0, 0], end: [PX0, PY1, 0], color: C.muted, strokeWidth: 2.8 });
  const yTicks = [600, 800, 1000, 1200, 1400, 1600].map(v => {
    const y = ay(v);
    const gl = new M.Line({ start: [PX0, y, 0], end: [PX1, y, 0], color: C.line, strokeWidth: 1 });
    const tk = new M.Line({ start: [PX0 - 0.08, y, 0], end: [PX0 + 0.06, y, 0], color: C.muted, strokeWidth: 2 });
    const lb = T(fmtDollar(v), P ? 17 : 16, C.muted, true);
    lb.moveTo([PX0 - (P ? 0.62 : 0.60), y, 0]);
    return new M.VGroup(gl, tk, lb);
  });
  const xTickLabels = [];
  const xTicks = AREAS.map(a => {
    const x = ax(a);
    const tk = new M.Line({ start: [x, PY0 - 0.08, 0], end: [x, PY0 + 0.06, 0], color: C.muted, strokeWidth: 2 });
    const lb = T(String(a), P ? 17 : 18, C.muted, true);
    lb.moveTo([x, PY0 - (P ? 0.34 : 0.28), 0]);
    xTickLabels.push(lb);
    return tk;
  });
  const xTitle = T('floor area (m²)', P ? 16 : 17, C.muted);
  xTitle.moveTo([CX, PY0 - (P ? 0.72 : 0.62), 0]);
  const yTitle = T('rent ($)', P ? 16 : 17, C.muted);
  yTitle.moveTo([PX0 + (P ? 0.25 : 0.10), PY1 + 0.28, 0]);

  const dotGroups = [], dotCores = [];
  for (let c = 0; c < 4; c++) {
    const gCol = [], cCol = [];
    for (let j = 0; j < 3; j++) {
      const p = pt(AREAS[c], COLS[c][j], DX[c][j]);
      const halo = new M.Dot({ point: p, radius: P ? 0.21 : 0.19, color: C.cyan });
      halo.setFill(C.cyan, 0.18);
      const core = new M.Dot({ point: p, radius: P ? 0.095 : 0.088, color: C.cyan });
      gCol.push(new M.VGroup(halo, core));
      cCol.push(core);
    }
    dotGroups.push(gCol);
    dotCores.push(cCol);
  }
  const allDots = dotGroups.flat();

  await until(S(5));
  await play(
    new M.FadeOut(floorGroup, { runTime: 0.6 }),
    new M.Create(xAxis, { runTime: 0.9 }),
    new M.Create(yAxis, { runTime: 0.9 }),
    new M.FadeIn(new M.VGroup(...yTicks, ...xTicks, ...xTickLabels, xTitle, yTitle), { runTime: 0.9 }),
    ...say('AREA ACROSS · RENT UP')
  );
  await play(new M.LaggedStart(allDots.map(d => new M.FadeIn(d)), { lagRatio: 0.08, runTime: 1.6 }));

  // 6: This picture is called a scatter plot: one dot for each apartment.
  await until(S(6));
  await play(
    new M.LaggedStart(allDots.map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.08, runTime: 1.9 }),
    ...say('SCATTER PLOT: 1 DOT = 1 APT')
  );

  // 7: The areas come in four sizes: forty, sixty, eighty and one hundred square metres.
  const colGuides = AREAS.map(a => new M.DashedLine({ start: [ax(a), PY0, 0], end: [ax(a), PY1, 0], color: C.line }));
  await until(S(7));
  await play(
    new M.LaggedStart(colGuides.map(g => new M.Create(g)), { lagRatio: 0.25, runTime: 1.8 }),
    new M.LaggedStart(xTickLabels.map(lb => new M.Indicate(lb, { color: C.amber })), { lagRatio: 0.28, runTime: 2.2 }),
    ...say('FOUR SIZES: 40, 60, 80, 100 m²', C.amber)
  );

  // 8: Three apartments have each size, so the dots stand in four small columns.
  const colFrames = AREAS.map((_, c) => makeColFrame(c, C.cyan));
  await until(S(8));
  await play(
    new M.LaggedStart(colFrames.map(f => new M.Create(f)), { lagRatio: 0.22, runTime: 1.8 }),
    ...say('3 PER SIZE → 4 COLUMNS')
  );

  // 9: Look at the column at forty square metres.
  const frame40 = makeColFrame(0, C.amber);
  await until(S(9));
  await play(
    new M.FadeOut(new M.VGroup(...colFrames), { runTime: 0.7 }),
    new M.Create(frame40, { runTime: 0.9 }),
    ...say('COLUMN: 40 m²', C.amber)
  );

  // 10: Its three rents are eight hundred and sixty, seven hundred and seventy, and seven hundred and seventy dollars.
  const l860 = T('$860', P ? 18 : 18, C.amber, true);
  l860.moveTo([ax(40), ay(860) + (P ? 0.62 : 0.52), 0]);
  const l770a = T('$770', P ? 17 : 17, C.amber, true);
  l770a.moveTo([ax(40) - (P ? 0.84 : 0.86), ay(770), 0]);
  const l770b = T('$770', P ? 17 : 17, C.amber, true);
  l770b.moveTo([ax(40) + (P ? 0.84 : 0.86), ay(770), 0]);
  const rentLabels40 = [l860, l770a, l770b];
  await until(S(10));
  await play(
    new M.LaggedStart([
      new M.FadeIn(l860), new M.Flash(dotCores[0][0], { color: C.amber }),
      new M.FadeIn(l770a), new M.Flash(dotCores[0][1], { color: C.amber }),
      new M.FadeIn(l770b), new M.Flash(dotCores[0][2], { color: C.amber })
    ], { lagRatio: 0.28, runTime: 2.6 }),
    ...fbox(['40 m² column', ['$860, $770, $770', C.amber]], C.amber),
    ...say('40 m²: $860, $770, $770', C.amber)
  );

  // 11: Same size, but not the same rent. Apartments differ in many small ways.
  await until(S(11));
  await play(
    new M.LaggedStart(dotGroups[0].map(d => new M.Indicate(d, { color: C.pink })), { lagRatio: 0.2, runTime: 1.5 }),
    ...say('SAME SIZE, DIFFERENT RENTS', C.pink)
  );

  // 12: So one area does not give one rent. It gives a small spread of rents.
  const sx = ax(40) + (P ? 0.54 : 0.58);
  const spreadGroup = new M.VGroup(
    new M.Line({ start: [sx, ay(770), 0], end: [sx, ay(860), 0], color: C.pink, strokeWidth: 3 }),
    new M.Line({ start: [sx - 0.08, ay(770), 0], end: [sx + 0.08, ay(770), 0], color: C.pink, strokeWidth: 2.5 }),
    new M.Line({ start: [sx - 0.08, ay(860), 0], end: [sx + 0.08, ay(860), 0], color: C.pink, strokeWidth: 2.5 })
  );
  await until(S(12));
  await play(new M.FadeIn(spreadGroup, { runTime: 0.9 }), ...say('ONE AREA → A SPREAD OF RENTS', C.pink));

  // 13: A fair question is: what is the typical rent at this size?
  await until(S(13));
  await play(new M.FadeOut(spreadGroup, { runTime: 0.7 }), ...say('TYPICAL RENT AT THIS SIZE?', C.amber));

  // 14: Let's take the mean of the column, its fair share.
  await until(S(14));
  await play(
    ...fbox(['40 m²: 860, 770, 770', ['mean = fair share', C.green]], C.green),
    ...say('MEAN = FAIR SHARE OF COLUMN', C.green)
  );

  // 15: Remember the mean: add up the values, then share the total equally.
  await until(S(15));
  await play(
    ...fbox(['mean = sum ÷ count', ['add up, then share equally', C.muted]], C.cyan),
    ...say('ADD UP, THEN SHARE EQUALLY')
  );

  // 16: The three rents add up to two thousand four hundred dollars.
  await until(S(16));
  await play(
    new M.LaggedStart(dotCores[0].map(d => new M.Flash(d, { color: C.amber })), { lagRatio: 0.2, runTime: 1.2 }),
    ...fbox(['40 m²: 860 + 770 + 770', ['sum = $2,400', C.amber]], C.amber),
    ...say('TOTAL = $2,400', C.amber)
  );

  // 17: Shared between three apartments, that is eight hundred dollars each.
  await until(S(17));
  await play(
    ...fbox(['sum   = $2,400', 'count = 3', ['$2,400 ÷ 3 = $800', C.amber]], C.amber),
    ...say('FAIR SHARE = $800 EACH', C.amber)
  );

  // 18: Mark eight hundred with a bright star on the column.
  const stars = AREAS.map((a, c) => makeStar(pt(a, MEANS[c]), C.amber));
  const starLabels = AREAS.map((a, c) => {
    const lb = T(fmtDollar(MEANS[c]), P ? 18 : 17, C.amber, true, true);
    lb.moveTo([ax(a) - (P ? 0.92 : 0.96), ay(MEANS[c]) + (P ? 0.36 : 0.32), 0]);
    return lb;
  });
  await until(S(18));
  await play(
    new M.FadeOut(new M.VGroup(frame40, ...rentLabels40), { runTime: 0.7 }),
    new M.FadeIn(stars[0].group, { runTime: 0.9 }),
    new M.FadeIn(starLabels[0], { runTime: 0.9 }),
    new M.Flash(stars[0].core, { color: C.amber, runTime: 0.9 }),
    ...say('MARK $800 WITH A STAR', C.amber)
  );

  // 19: Now do the same for the other columns.
  await until(S(19));
  await play(...say('NOW THE OTHER COLUMNS'));

  // 20: At sixty square metres, the mean rent is one thousand dollars.
  const frame60 = makeColFrame(1, C.amber);
  await until(S(20));
  await play(
    new M.Create(frame60, { runTime: 0.8 }),
    new M.FadeIn(stars[1].group, { runTime: 0.9 }),
    new M.FadeIn(starLabels[1], { runTime: 0.9 }),
    new M.Flash(stars[1].core, { color: C.amber, runTime: 0.9 }),
    ...fbox(['60 m²: 1,040 + 1,020 + 940', 'sum = $3,000  (count = 3)', ['mean = $1,000', C.amber]], C.amber),
    ...say('60 m² → MEAN $1,000', C.amber)
  );

  // 21: At eighty, it is one thousand two hundred.
  const frame80 = makeColFrame(2, C.amber);
  await until(S(21));
  await play(
    new M.FadeOut(frame60, { runTime: 0.6 }),
    new M.Create(frame80, { runTime: 0.8 }),
    new M.FadeIn(stars[2].group, { runTime: 0.9 }),
    new M.FadeIn(starLabels[2], { runTime: 0.9 }),
    new M.Flash(stars[2].core, { color: C.amber, runTime: 0.9 }),
    ...fbox(['80 m²: 1,250 + 1,210 + 1,140', 'sum = $3,600  (count = 3)', ['mean = $1,200', C.amber]], C.amber),
    ...say('80 m² → MEAN $1,200', C.amber)
  );

  // 22: At one hundred, it is one thousand four hundred.
  const frame100 = makeColFrame(3, C.amber);
  await until(S(22));
  await play(
    new M.FadeOut(frame80, { runTime: 0.6 }),
    new M.Create(frame100, { runTime: 0.8 }),
    new M.FadeIn(stars[3].group, { runTime: 0.9 }),
    new M.FadeIn(starLabels[3], { runTime: 0.9 }),
    new M.Flash(stars[3].core, { color: C.amber, runTime: 0.9 }),
    ...fbox(['100 m²: 1,470 + 1,380 + 1,350', 'sum = $4,200  (count = 3)', ['mean = $1,400', C.amber]], C.amber),
    ...say('100 m² → MEAN $1,400', C.amber)
  );

  // 23: Look at the four stars together.
  await until(S(23));
  await play(
    new M.FadeOut(frame100, { runTime: 0.6 }),
    new M.LaggedStart(stars.map(st => new M.Indicate(st.group, { color: C.amber })), { lagRatio: 0.14, runTime: 1.0 }),
    ...say('FOUR STARS TOGETHER', C.amber)
  );

  // 24: Each step of twenty square metres adds two hundred dollars.
  const stepParts = [];
  for (let c = 0; c < 3; c++) {
    const a0 = AREAS[c], a1 = AREAS[c + 1], m0 = MEANS[c], m1 = MEANS[c + 1];
    stepParts.push(
      new M.Line({ start: pt(a0, m0), end: pt(a1, m0), color: C.green, strokeWidth: 2.6 }),
      new M.Line({ start: pt(a1, m0), end: pt(a1, m1), color: C.green, strokeWidth: 2.6 })
    );
    const dxLab = T('+20', P ? 14 : 15, C.green, true);
    dxLab.moveTo([(ax(a0) + ax(a1)) / 2, ay(m0) - (P ? 0.26 : 0.22), 0]);
    const dyLab = T('+$200', P ? 14 : 15, C.green, true);
    dyLab.moveTo([ax(a1) + (P ? 0.45 : 0.48), (ay(m0) + ay(m1)) / 2 - (P ? 0.08 : 0.05), 0]);
    stepParts.push(dxLab, dyLab);
  }
  const stepsGroup = new M.VGroup(...stepParts);
  await until(S(24));
  await play(
    new M.FadeIn(stepsGroup, { runTime: 1.2 }),
    ...fbox(['every step across:', ['+20 m²  →  +$200', C.green]], C.green),
    ...say('+20 m² → +$200 EVERY STEP', C.green)
  );

  // 25: So the stars sit exactly on one straight line.
  const lineGlow = new M.Line({ start: pt(30, 700), end: pt(110, 1500), color: C.cyan, strokeWidth: 9 });
  lineGlow.setStrokeOpacity(0.22);
  const lineMain = new M.Line({ start: pt(30, 700), end: pt(110, 1500), color: C.ink, strokeWidth: 3.4 });
  await until(S(25));
  await play(
    new M.FadeOut(stepsGroup, { runTime: 0.7 }),
    new M.Create(lineGlow, { runTime: 1.2 }),
    new M.Create(lineMain, { runTime: 1.2 }),
    ...say('STARS ON ONE STRAIGHT LINE', C.ink)
  );

  // 26: A mean taken only inside one group, like the apartments of eighty square metres, is called a conditional mean.
  const condFrame80 = makeColFrame(2, C.violet);
  await until(S(26));
  await play(
    new M.Create(condFrame80, { runTime: 0.9 }),
    new M.Flash(stars[2].core, { color: C.violet, runTime: 1.0 }),
    ...fbox(['group: area = 80 m²', ['conditional mean = $1,200', C.violet]], C.violet),
    ...say('CONDITIONAL MEAN', C.violet)
  );

  // 27: Conditional means "under a condition". Here, the condition is the area.
  await until(S(27));
  await play(
    new M.Indicate(xTickLabels[2], { color: C.violet, runTime: 1.2 }),
    ...fbox(['condition: area = 80 m²', ['mean inside = $1,200', C.violet]], C.violet),
    ...say('CONDITION = THE AREA', C.violet)
  );

  // 28: Now imagine a rule. You give it an area, and it gives back the mean rent at that area.
  const lookup80 = new M.VGroup(
    makeArrow([ax(80), PY0, 0], pt(80, 1200), C.cyan, true, 2.4),
    makeArrow(pt(80, 1200), [PX0, ay(1200), 0], C.amber, true, 2.4)
  );
  await until(S(28));
  await play(
    new M.FadeOut(condFrame80, { runTime: 0.6 }),
    new M.FadeIn(lookup80, { runTime: 1.2 }),
    ...fbox(['area in → rule → mean rent', ['  80 m² → line → $1,200', C.cyan]], C.cyan),
    ...say('AREA IN → MEAN RENT OUT')
  );

  // 29: A rule that turns one number into another is called a function.
  await until(S(29));
  await play(
    ...fbox(['function = input → output', ['   area  → mean rent', C.green]], C.green),
    ...say('FUNCTION = NUMBER → NUMBER', C.green)
  );

  // 30: This particular rule is the thing we want to learn, so we call it the target function.
  await until(S(30));
  await play(
    new M.FadeOut(lookup80, { runTime: 0.7 }),
    new M.Indicate(lineMain, { color: C.amber, runTime: 1.2 }),
    ...say('TARGET FUNCTION', C.amber)
  );

  // 31: The dots scatter around it. The target sits in the middle of each column.
  await until(S(31));
  await play(
    new M.LaggedStart(allDots.map(d => new M.Indicate(d, { color: C.cyan })), { lagRatio: 0.06, runTime: 1.5 }),
    ...say('DOTS SCATTER · TARGET IN MIDDLE')
  );

  // 32: Strictly, the target belongs to all apartments in the neighbourhood. Our four stars are our best estimates of it.
  const ghostCoords = [
    [32, 760], [36, 710], [44, 890], [48, 830], [52, 970], [56, 910],
    [64, 1085], [68, 1015], [72, 1170], [76, 1110], [84, 1280], [88, 1230],
    [92, 1370], [96, 1310], [104, 1490], [108, 1410], [50, 865], [70, 1050],
    [90, 1260], [45, 795], [65, 980], [85, 1185]
  ];
  const ghostDots = ghostCoords.map(([a, r]) => {
    const d = new M.Dot({ point: pt(a, r), radius: P ? 0.07 : 0.065, color: C.muted });
    d.setFill(C.muted, 0.32);
    return d;
  });
  await until(S(32));
  await play(
    new M.LaggedStart(ghostDots.map(d => new M.FadeIn(d)), { lagRatio: 0.04, runTime: 1.4 }),
    new M.LaggedStart(stars.map(st => new M.Flash(st.core, { color: C.amber })), { lagRatio: 0.16, runTime: 1.4 }),
    ...fbox(['all apartments → true target', ['our 4 stars → estimates', C.amber]], C.amber),
    ...say('4 STARS = OUR ESTIMATES', C.amber)
  );

  // 33: In words: the mean rent at one area equals the total rent in that column,
  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(...ghostDots), { runTime: 0.7 }),
    ...fbox([['mean rent at one area', C.amber], ['= total rent in that column', C.ink]], C.cyan),
    ...say('MEAN RENT AT ONE AREA')
  );

  // 34: divided by the number of apartments in that column.
  await until(S(34));
  await play(
    ...fbox([['mean rent at one area', C.amber], ['= total rent in column', C.ink], ['÷ apartments in column', C.green]], C.green),
    ...say('TOTAL ÷ COUNT IN COLUMN', C.green)
  );

  // 35: What is it for? It answers the question: what rent should I expect, on average, for this size?
  const lookup60 = new M.VGroup(
    makeArrow([ax(60), PY0, 0], pt(60, 1000), C.green, true, 2.4),
    makeArrow(pt(60, 1000), [PX0, ay(1000), 0], C.green, true, 2.4)
  );
  await until(S(35));
  await play(
    new M.FadeIn(lookup60, { runTime: 1.1 }),
    new M.Flash(stars[1].core, { color: C.green, runTime: 1.0 }),
    ...say('EXPECTED RENT, ON AVERAGE', C.green)
  );

  // 36: Here is the trap. The line describes the mean rent, not each apartment.
  await until(S(36));
  await play(
    new M.FadeOut(lookup60, { runTime: 0.7 }),
    ...fbox([['TRAP:', C.pink], ['line = mean rent', C.ink], ['not each apartment', C.pink]], C.pink),
    ...say('TRAP: MEAN, NOT EACH APT', C.pink)
  );

  // 37: A forty square metre apartment can still cost eight hundred and sixty dollars, sixty above its star.
  const trapRing = new M.Circle({ radius: P ? 0.21 : 0.19, color: C.pink });
  trapRing.moveTo(pt(40, 860));
  const trapStick = new M.Line({ start: pt(40, 800), end: pt(40, 860), color: C.pink, strokeWidth: 3.5 });
  const trap860 = T('$860', P ? 16 : 17, C.pink, true, true);
  trap860.moveTo([ax(40), ay(860) + (P ? 0.34 : 0.28), 0]);
  const trapGap = T('+$60', P ? 15 : 16, C.pink, true, true);
  trapGap.moveTo([ax(40) + (P ? 0.45 : 0.46), (ay(800) + ay(860)) / 2, 0]);
  const trapGroup = new M.VGroup(trapStick, trapRing, trap860, trapGap);
  await until(S(37));
  await play(
    new M.FadeIn(trapGroup, { runTime: 1.0 }),
    new M.Flash(dotCores[0][0], { color: C.pink, runTime: 1.0 }),
    ...fbox(['at 40 m²: mean = $800', ['one apt = $860  (+$60)', C.pink]], C.pink),
    ...say('40 m²: $860 (+$60 ABOVE STAR)', C.pink)
  );

  // 38: In this chapter, we will draw the target function as a straight line, and learn to read it.
  await until(S(38));
  await play(
    new M.FadeOut(trapGroup, { runTime: 0.7 }),
    new M.Indicate(lineMain, { color: C.cyan, runTime: 1.2 }),
    ...say('NEXT: DRAW & READ THE LINE')
  );

  // 39: In one sentence: a conditional mean is the average rent among apartments of one size.
  await until(S(39));
  await play(
    new M.LaggedStart(stars.map(st => new M.Flash(st.core, { color: C.amber })), { lagRatio: 0.15, runTime: 1.5 }),
    ...fbox([['conditional mean =', C.amber], ['average rent at one size', C.ink]], C.amber),
    ...say('CONDITIONAL MEAN = GROUP MEAN', C.amber)
  );
}
