// 3.3.5 Cluster sampling (live manim-web lesson).
// Beat i = sentence i (0-based, 41 sentences). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;
  const HILL = '#fb923c'; // orange for Hill campus; C.cyan for City campus

  // Shared 3.3.5 data (chapters/3.3.md)
  const R1 = [15, 16, 17, 17, 18, 18, 19, 19, 20, 21]; // Room 1 (City): 15–21, mean 18
  const R2 = [19, 20, 21, 21, 22, 22, 23, 23, 24, 25]; // Room 2 (City): 19–25, mean 22
  const R3 = [43, 44, 45, 46, 47, 47, 48, 49, 50, 51]; // Room 3 (Hill): 43–51, mean 47
  const SRS = [10, 15, 20, 20, 25, 30, 35, 35, 40, 50]; // 10 from roster (3.3.1)

  // Safe layout constants: phone 8 x 14.22 (y in [-5.5, 4.3]), laptop 14.22 x 8 (y in [-3.0, 2.3])
  const CX = P ? 0 : -2.2;
  const MY = P ? -1.75 : -0.7;
  const PILL = P ? [0, 2.0, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.32, 0] : [4.6, -0.4, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // One formula box at a time
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20, lh = P ? 0.39 : 0.40;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.65, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(BOXP);
    const left = BOXP[0] - wd / 2 + 0.32, top = BOXP[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.1;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const a = [new M.FadeOut(boxNow)];
    boxNow = null;
    return a;
  }

  // Helper: make a box holding 10 dots (2 rows x 5 cols) as a single new VGroup
  function makeRoomCard(cx, cy, w, h, color, title, sub) {
    const parts = [];
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: 2 });
    r.setFill(color, 0.12); r.moveTo([cx, cy, 0]); parts.push(r);
    const dx = (w * 0.76) / 4, dy = h * 0.32;
    for (let j = 0; j < 10; j++) {
      const col = j % 5, row = Math.floor(j / 5);
      const d = new M.Dot({ point: [cx + (col - 2) * dx, cy + (0.5 - row) * dy, 0], radius: Math.min(w, h) * 0.085, color });
      d.setFill(color, 0.95); parts.push(d);
    }
    if (title) { const t = T(title, P ? 17 : 18, color, true); t.moveTo([cx, cy + h / 2 + 0.24, 0]); parts.push(t); }
    if (sub) { const t = T(sub, P ? 15 : 16, C.muted, true); t.moveTo([cx, cy - h / 2 - 0.24, 0]); parts.push(t); }
    return new M.VGroup(...parts);
  }

  // =========================================================================
  // ACT 1 (Beats 0-2): Chasing 10 scattered students across campus
  // =========================================================================
  const MW = P ? 7.0 : 8.2, MH = P ? 5.2 : 4.0;
  const campusBox = new M.RoundedRectangle({ width: MW, height: MH, cornerRadius: 0.2, color: C.line, strokeWidth: 2 });
  campusBox.setFill(C.card, 0.55); campusBox.moveTo([CX, MY, 0]);
  const bSpecs = [
    [-0.36, 0.24, C.cyan], [-0.12, 0.27, C.cyan], [0.13, 0.22, C.cyan], [0.36, 0.25, HILL],
    [-0.34, -0.24, C.cyan], [-0.10, -0.22, C.cyan], [0.14, -0.25, HILL], [0.36, -0.22, HILL]
  ];
  const bldgs = bSpecs.map(([fx, fy, col]) => {
    const r = new M.RoundedRectangle({ width: MW * 0.17, height: MH * 0.28, cornerRadius: 0.1, color: col, strokeWidth: 1.5 });
    r.setFill(col, 0.10); r.moveTo([CX + fx * MW, MY + fy * MH, 0]); return r;
  });
  const walkOrder = [
    [-0.38, 0.26, C.cyan], [0.35, -0.20, HILL], [-0.12, 0.29, C.cyan], [0.15, -0.27, HILL],
    [-0.32, -0.22, C.cyan], [0.37, 0.27, HILL], [0.11, 0.20, C.cyan], [-0.08, -0.24, C.cyan],
    [-0.33, 0.20, C.cyan], [0.16, -0.20, HILL]
  ];
  const walkPts = walkOrder.map(([fx, fy]) => [CX + fx * MW, MY + fy * MH, 0]);
  const scatterDots = walkOrder.map(([, , col], k) => {
    const d = new M.Dot({ point: walkPts[k], radius: P ? 0.12 : 0.11, color: col });
    d.setFill(col, 0.95); return d;
  });
  const campusLab = T('university campus · 10 scattered students', P ? 16 : 17, C.muted);
  campusLab.moveTo([CX, MY - MH / 2 - 0.30, 0]);

  // Beat 0
  await until(S(0));
  await play(
    new M.FadeIn(campusBox),
    new M.LaggedStart(bldgs.map(b => new M.FadeIn(b)), { lagRatio: 0.08, runTime: 0.9 }),
    new M.LaggedStart(scatterDots.map(d => new M.FadeIn(d)), { lagRatio: 0.08, runTime: 1.2 }),
    new M.FadeIn(campusLab),
    ...say('10 STUDENTS ACROSS CAMPUS')
  );

  // Beat 1
  const walkSegs = [];
  for (let k = 0; k < walkPts.length - 1; k++) {
    walkSegs.push(new M.DashedLine({ start: walkPts[k], end: walkPts[k + 1], color: C.amber, strokeWidth: 2 }));
  }
  await until(S(1));
  await play(
    new M.LaggedStart(walkSegs.map(l => new M.Create(l)), { lagRatio: 0.22, runTime: 2.3 }),
    ...say('WALKING BUILDING TO BUILDING', C.amber),
    ...fbox([['10 students', C.ink], ['10 different stops', C.pink]], C.pink)
  );

  // Beat 2
  await until(S(2));
  await play(...say('IS THERE A CHEAPER WAY?', C.amber));

  // =========================================================================
  // ACT 2 (Beats 3-11): Tutorial groups, 100-box grid, pick 3 clusters
  // =========================================================================
  const act1 = [campusBox, ...bldgs, ...scatterDots, campusLab, ...walkSegs];

  // Beat 3: University already sorts students into small groups
  const small4 = P
    ? [[-1.75, -0.7, C.cyan, 'Group 1'], [1.75, -0.7, C.cyan, 'Group 2'],
       [-1.75, -3.0, HILL, 'Group 3'], [1.75, -3.0, HILL, 'Group 4']]
    : [[CX - 2.9, MY, C.cyan, 'Group 1'], [CX - 0.97, MY, C.cyan, 'Group 2'],
       [CX + 0.97, MY, HILL, 'Group 3'], [CX + 2.9, MY, HILL, 'Group 4']];
  const smallGroups = small4.map(([x, y, col, nm]) =>
    makeRoomCard(x, y, P ? 2.7 : 1.7, P ? 1.5 : 1.5, col, nm, '10 students'));
  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(...act1)),
    ...clearBox(),
    new M.LaggedStart(smallGroups.map(g => new M.FadeIn(g)), { lagRatio: 0.14, runTime: 1.3 }),
    ...say('ALREADY IN SMALL GROUPS')
  );

  // Beat 4: One tutorial group = 10 students
  const oneGroup = makeRoomCard(CX, MY + 0.1, P ? 5.2 : 5.4, P ? 2.9 : 2.5, C.cyan, '1 tutorial group', '10 students · meets weekly');
  await until(S(4));
  await play(
    new M.FadeOut(new M.VGroup(...smallGroups)),
    new M.FadeIn(oneGroup),
    ...say('1 TUTORIAL GROUP = 10 STUDENTS'),
    ...fbox([['1 tutorial group', C.ink], ['= 10 students', C.cyan]])
  );

  // Beat 5: 100 tutorial groups = 1,000 students (10x10 grid: 60 City + 40 Hill)
  const GX = P ? 0 : CX - 0.7;
  const GY = P ? -0.75 : -0.62;
  const DX = P ? 0.64 : 0.60, DY = P ? 0.40 : 0.36;
  const BW = DX * 0.80, BH = DY * 0.78;
  const gridPos = idx => {
    const r = Math.floor(idx / 10), c = idx % 10;
    return [GX + (c - 4.5) * DX, GY + (4.5 - r) * DY, 0];
  };
  const gridBoxes = [];
  for (let idx = 0; idx < 100; idx++) {
    const col = idx < 60 ? C.cyan : HILL;
    const b = new M.Rectangle({ width: BW, height: BH, color: col, strokeWidth: 1.3 });
    b.setFill(col, 0.24);
    b.moveTo(gridPos(idx));
    gridBoxes.push(b);
  }
  const gridNote = T('100 groups (60 City · 40 Hill) = 1,000 students', P ? 17 : 19, C.muted);
  if (gridNote.getWidth() > FW - 0.6) gridNote.scale((FW - 0.6) / gridNote.getWidth());
  gridNote.moveTo([GX, GY - 5 * DY - 0.34, 0]);

  await until(S(5));
  await play(
    new M.FadeOut(oneGroup),
    new M.LaggedStart(gridBoxes.map(b => new M.FadeIn(b)), { lagRatio: 0.01, runTime: 1.6 }),
    new M.FadeIn(gridNote),
    ...say('100 GROUPS · 1,000 STUDENTS'),
    ...fbox([['100 tutorial groups', C.ink], ['× 10 students', C.cyan], ['= 1,000 students', C.amber]])
  );

  // Beat 6: Zoom callout showing 1 box = 10 dots
  const callPos = P ? [0, -4.15, 0] : [GX + 5 * DX + 1.05, GY + 0.35, 0];
  const callW = P ? 2.8 : 1.6, callH = P ? 1.45 : 1.15;
  const callCard = makeRoomCard(callPos[0], callPos[1], callW, callH, C.cyan, '1 box', '10 dots');
  const srcIdx = P ? 94 : 9;
  const sp = gridPos(srcIdx);
  const zoomL1 = new M.DashedLine({
    start: [sp[0], sp[1] + (P ? -BH / 2 : BH / 2), 0],
    end: [callPos[0] + (P ? -callW / 2 : -callW / 2), callPos[1] + (P ? callH / 2 : callH / 2), 0],
    color: C.cyan, strokeWidth: 1.5
  });
  const zoomL2 = new M.DashedLine({
    start: [sp[0] + (P ? BW / 2 : BW / 2), sp[1] - BH / 2, 0],
    end: [callPos[0] + (P ? callW / 2 : -callW / 2), callPos[1] + (P ? callH / 2 : -callH / 2), 0],
    color: C.cyan, strokeWidth: 1.5
  });
  await until(S(6));
  await play(
    new M.Create(zoomL1), new M.Create(zoomL2), new M.FadeIn(callCard),
    ...say('EACH BOX HOLDS 10 DOTS')
  );

  // Beat 7: Pick 3 boxes at random (2 City, 1 Hill -> Rooms 1, 2, 3)
  const PICKS = [12, 47, 84];
  const pickCols = [C.cyan, C.cyan, HILL];
  const pickFrames = PICKS.map((idx, k) => {
    const r = new M.Rectangle({ width: BW + 0.08, height: BH + 0.08, color: C.amber, strokeWidth: 3 });
    r.setFill(pickCols[k], 0.85);
    r.moveTo(gridPos(idx));
    return r;
  });
  await until(S(7));
  gridBoxes.forEach((b, idx) => {
    if (!PICKS.includes(idx)) { b.setFill(C.muted, 0.07); b.setColor(C.line); }
  });
  await play(
    new M.FadeOut(new M.VGroup(zoomL1, zoomL2, callCard)),
    new M.LaggedStart(pickFrames.map(r => new M.FadeIn(r)), { lagRatio: 0.2, runTime: 0.9 }),
    ...pickFrames.map(r => new M.Flash(r, { color: C.amber })),
    ...say('PICK 3 BOXES AT RANDOM', C.amber),
    ...fbox([['100 groups', C.muted], ['pick 3 at random', C.amber]], C.amber)
  );

  // Beat 8: Walk into those 3 rooms, ask every student inside
  const p0 = gridPos(PICKS[0]), p1 = gridPos(PICKS[1]), p2 = gridPos(PICKS[2]);
  const short1 = new M.Line({ start: p0, end: p1, color: C.amber, strokeWidth: 3 });
  const short2 = new M.Line({ start: p1, end: p2, color: C.amber, strokeWidth: 3 });
  const pickNums = [p0, p1, p2].map((pt, k) => {
    const t = T(String(k + 1), P ? 16 : 16, C.bg, true);
    t.moveTo(pt); return t;
  });
  await until(S(8));
  await play(
    new M.Create(short1), new M.Create(short2),
    ...pickNums.map(t => new M.FadeIn(t)),
    ...say('WALK INTO 3 ROOMS, ASK ALL', C.amber)
  );

  // Beat 9: Three rooms, thirty students. Very little walking.
  const rxs = P ? [-2.4, 0, 2.4] : [CX - 2.75, CX, CX + 2.75];
  const rW = P ? 2.15 : 2.4, rH = P ? 1.8 : 1.85, rY = P ? -1.4 : -0.6;
  const roomCards = [
    makeRoomCard(rxs[0], rY, rW, rH, C.cyan, 'Room 1', '10 students'),
    makeRoomCard(rxs[1], rY, rW, rH, C.cyan, 'Room 2', '10 students'),
    makeRoomCard(rxs[2], rY, rW, rH, HILL, 'Room 3', '10 students')
  ];
  await until(S(9));
  await play(
    new M.FadeOut(new M.VGroup(...gridBoxes, gridNote, ...pickFrames, short1, short2, ...pickNums)),
    new M.LaggedStart(roomCards.map(rc => new M.FadeIn(rc)), { lagRatio: 0.16, runTime: 1.2 }),
    ...say('3 ROOMS · 30 STUDENTS', C.green),
    ...fbox([['3 rooms × 10', C.ink], ['= 30 students', C.green], ['only 3 stops!', C.amber]], C.green)
  );

  // Beat 10: Each ready-made group is called a cluster
  const clusterTags = rxs.map((x, k) => {
    const t = T('cluster', P ? 15 : 16, k < 2 ? C.cyan : HILL, true);
    t.moveTo([x, rY - rH / 2 - 0.62, 0]); return t;
  });
  await until(S(10));
  await play(
    new M.LaggedStart(roomCards.map(rc => new M.Indicate(rc, { color: C.cyan })), { lagRatio: 0.15, runTime: 1.2 }),
    ...clusterTags.map(t => new M.FadeIn(t)),
    ...say('EACH GROUP = A CLUSTER', C.cyan)
  );

  // Beat 11: Cluster sampling definition
  await until(S(11));
  await play(
    new M.LaggedStart(roomCards.map(rc => new M.Indicate(rc, { color: C.green })), { lagRatio: 0.15, runTime: 1.4 }),
    ...say('CLUSTER SAMPLING', C.green),
    ...fbox([['CLUSTER SAMPLING', C.green], ['1. pick whole clusters', C.ink], ['2. ask everyone inside', C.ink]], C.green)
  );

  // =========================================================================
  // ACT 3 (Beats 12-19): Results room by room on 0-60 minutes line
  // =========================================================================
  // axis shows 10–52 min only (all data lies there), so the room strips are wider and easier to read
  const AX0 = P ? -2.95 : -5.25, AX1 = P ? 3.7 : 2.3, AW = AX1 - AX0;
  const ax = v => AX0 + ((v - 10) / 42) * AW;
  const AY = P ? -4.6 : -2.5;
  const RY = P ? [0.6, -0.8, -2.2] : [0.6, -0.3, -1.2];
  const DIVY = P ? -2.95 : -1.55;
  const SRSY = P ? -3.7 : -1.95;
  const LBLX = P ? -3.45 : -5.95;

  const axisLine = new M.Line({ start: [AX0, AY, 0], end: [AX1, AY, 0], color: C.muted, strokeWidth: 2.5 });
  const axisTicks = [10, 20, 30, 40, 50].map(v => new M.VGroup(
    new M.Line({ start: [ax(v), AY + 0.08, 0], end: [ax(v), RY[0] + 0.3, 0], color: C.grid, strokeWidth: 1 }),   // faint guide up to the rows
    new M.Line({ start: [ax(v), AY - 0.08, 0], end: [ax(v), AY + 0.08, 0], color: C.muted, strokeWidth: 2 }),
    T(String(v), P ? 19 : 17, C.muted, true).moveTo([ax(v), AY - (P ? 0.34 : 0.30), 0])
  ));
  const axisUnit = T('minutes', P ? 17 : 16, C.muted);
  axisUnit.moveTo([AX1 - 0.4, AY - (P ? 0.68 : 0.62), 0]);

  const tracks = RY.map(ry => new M.Line({ start: [AX0, ry - 0.14, 0], end: [AX1, ry - 0.14, 0], color: C.line, strokeWidth: 1.4 }));
  const rLabels = ['Room 1', 'Room 2', 'Room 3'].map((nm, k) => {
    const t = T(P ? `R${k + 1}` : nm, P ? 17 : 17, k < 2 ? C.cyan : HILL, true);
    t.moveTo([LBLX, RY[k], 0]); return t;
  });

  function makeDots(vals, ry, color) {
    return vals.map((v, k) => {
      const dup = vals.slice(0, k).filter(x => x === v).length;
      const d = new M.Dot({ point: [ax(v), ry + dup * (P ? 0.19 : 0.20), 0], radius: P ? 0.07 : 0.075, color });
      d.setFill(color, 0.95); return d;
    });
  }
  function makeMeanMark(meanVal, ry, color) {
    const ln = new M.Line({ start: [ax(meanVal), ry - 0.16, 0], end: [ax(meanVal), ry + 0.34, 0], color, strokeWidth: 3 });
    const lb = T(String(meanVal), P ? 19 : 18, color, true);
    lb.moveTo([ax(meanVal), ry + (P ? 0.62 : 0.56), 0]);   // above the highlight box edge
    return { ln, lb };
  }

  // Beat 12
  await until(S(12));
  await play(
    new M.FadeOut(new M.VGroup(...roomCards, ...clusterTags)),
    ...clearBox(),
    new M.Create(axisLine),
    new M.FadeIn(new M.VGroup(...axisTicks, axisUnit)),
    ...tracks.map(t => new M.FadeIn(t)),
    ...rLabels.map(t => new M.FadeIn(t)),
    ...say('RESULTS, ROOM BY ROOM')
  );

  // Beat 13: Room 1 (15 to 21, mean 18)
  const r1Dots = makeDots(R1, RY[0], C.cyan);
  const r1Mean = makeMeanMark(18, RY[0], C.cyan);
  await until(S(13));
  await play(
    new M.LaggedStart(r1Dots.map(d => new M.FadeIn(d)), { lagRatio: 0.08, runTime: 1.3 }),
    new M.Create(r1Mean.ln), new M.FadeIn(r1Mean.lb),
    ...say('ROOM 1: 15–21 · MEAN 18', C.cyan),
    ...fbox([['Room 1 (10): 15–21', C.muted], ['mean = 18 min', C.cyan]])
  );

  // Beat 14: Room 2 (19 to 25, mean 22)
  const r2Dots = makeDots(R2, RY[1], C.cyan);
  const r2Mean = makeMeanMark(22, RY[1], C.cyan);
  await until(S(14));
  await play(
    new M.LaggedStart(r2Dots.map(d => new M.FadeIn(d)), { lagRatio: 0.08, runTime: 1.3 }),
    new M.Create(r2Mean.ln), new M.FadeIn(r2Mean.lb),
    ...say('ROOM 2: 19–25 · MEAN 22', C.cyan),
    ...fbox([['Room 1 mean = 18', C.cyan], ['Room 2 mean = 22', C.cyan]])
  );

  // Beat 15: Room 3 (43 to 51, mean 47)
  const r3Dots = makeDots(R3, RY[2], HILL);
  const r3Mean = makeMeanMark(47, RY[2], HILL);
  await until(S(15));
  await play(
    new M.LaggedStart(r3Dots.map(d => new M.FadeIn(d)), { lagRatio: 0.08, runTime: 1.3 }),
    new M.Create(r3Mean.ln), new M.FadeIn(r3Mean.lb),
    ...say('ROOM 3: 43–51 · MEAN 47', HILL),
    ...fbox([['Room 1 mean = 18', C.cyan], ['Room 2 mean = 22', C.cyan], ['Room 3 mean = 47', HILL]])
  );

  // Beat 16: Equal size rooms -> average the three means
  await until(S(16));
  await play(
    new M.LaggedStart([r1Mean.lb, r2Mean.lb, r3Mean.lb].map(t => new M.Indicate(t, { color: C.amber })), { lagRatio: 0.2, runTime: 1.5 }),
    ...say('EQUAL ROOMS → AVERAGE 3 MEANS', C.amber),
    ...fbox([['10 in each room', C.muted], ['average 18, 22, 47', C.amber]], C.amber)
  );

  // Beat 17: 18 + 22 + 47 = 87
  await until(S(17));
  await play(
    ...say('18 + 22 + 47 = 87', C.amber),
    ...fbox([['18 + 22 + 47 = 87', C.amber]], C.amber)
  );

  // Beat 18: 87 ÷ 3 = 29
  await until(S(18));
  await play(
    ...say('87 ÷ 3 = 29 MINUTES', C.green),
    ...fbox([['18 + 22 + 47 = 87', C.ink], ['87 ÷ 3 = 29 min', C.green]], C.green)
  );

  // Beat 19: Estimate 29 (solid) vs Truth line 30 (dashed)
  const truthLine = new M.DashedLine({ start: [ax(30), AY, 0], end: [ax(30), RY[0] + 0.36, 0], color: C.amber, strokeWidth: 2.5 });
  const truthLab = T('truth 30', P ? 16 : 16, C.amber, true);
  truthLab.moveTo([ax(30) + (P ? 0.85 : 0.80), SRSY, 0]);
  const estLine = new M.Line({ start: [ax(29), AY, 0], end: [ax(29), RY[0] + 0.36, 0], color: C.green, strokeWidth: 3 });
  const estDot = new M.Dot({ point: [ax(29), AY, 0], radius: 0.11, color: C.green });
  estDot.setFill(C.green, 1);
  const estLab = T('est 29', P ? 16 : 16, C.green, true);
  estLab.moveTo([ax(29) - (P ? 0.72 : 0.68), SRSY, 0]);

  await until(S(19));
  await play(
    new M.Create(estLine), new M.FadeIn(estDot), new M.FadeIn(estLab),
    new M.Create(truthLine), new M.FadeIn(truthLab),
    ...say('ESTIMATE 29 · TRUTH 30', C.green),
    ...fbox([['estimate = 29 min', C.green], ['truth    = 30 min', C.amber]], C.green)
  );

  // =========================================================================
  // ACT 4 (Beats 20-26): Tight clusters & Dependence
  // =========================================================================
  const tightSpecs = [
    [15, 21, RY[0], C.violet],
    [19, 25, RY[1], C.violet],
    [43, 51, RY[2], C.violet]
  ];
  const tightBoxes = tightSpecs.map(([a, b, ry, col]) => {
    const r = new M.RoundedRectangle({ width: ax(b) - ax(a) + 0.34, height: P ? 0.64 : 0.56, cornerRadius: 0.12, color: col, strokeWidth: 2.2 });
    r.setFill(col, 0.10);
    r.moveTo([(ax(a) + ax(b)) / 2, ry + 0.08, 0]);
    return r;
  });

  // Beat 20: Look closely at the dots inside each room
  await until(S(20));
  await play(
    new M.FadeOut(new M.VGroup(estLine, estDot, estLab, truthLine, truthLab)),
    ...tightBoxes.map(b => new M.Create(b)),
    ...say('LOOK INSIDE EACH ROOM', C.violet),
    ...clearBox()
  );

  // Beat 21: Trips are very close to each other
  await until(S(21));
  await play(
    new M.LaggedStart(tightBoxes.map(b => new M.Indicate(b, { color: C.violet })), { lagRatio: 0.18, runTime: 1.5 }),
    ...say('TRIPS PACKED TIGHTLY', C.violet),
    ...fbox([['Room 1: 15–21 (6 min)', C.cyan], ['Room 2: 19–25 (6 min)', C.cyan], ['Room 3: 43–51 (8 min)', HILL]], C.violet)
  );

  // Beat 22: Same campus, same bus line
  const tagAt = (t, ry) => { t.moveTo([ax(35), ry + 0.08, 0]); return t; };   // between the 30 and 40 guides, clear of the boxes
  const tagC1 = tagAt(T('City · bus', 16, C.cyan, true), RY[0]);
  const tagC2 = tagAt(T('City · bus', 16, C.cyan, true), RY[1]);
  const tagH3 = tagAt(T('Hill · bus', 16, HILL, true), RY[2]);
  await until(S(22));
  await play(
    new M.FadeIn(tagC1), new M.FadeIn(tagC2), new M.FadeIn(tagH3),
    ...say('SAME CAMPUS · SAME BUS', C.amber),
    ...fbox([['Rooms 1–2: City', C.cyan], ['Room 3:    Hill', HILL], ['often same bus line', C.muted]], C.amber)
  );

  // Beat 23: Know one, guess the others
  const knowRing = new M.Circle({ radius: 0.13, color: C.amber, strokeWidth: 2.5 });   // small: rings one dot, not its neighbours
  knowRing.moveTo([ax(43), RY[2], 0]);
  await until(S(23));
  await play(
    new M.Create(knowRing), new M.Flash(r3Dots[0], { color: C.amber }),
    new M.LaggedStart(r3Dots.map(d => new M.Indicate(d, { color: C.amber })), { lagRatio: 0.05, runTime: 1.4 }),
    ...say('KNOW ONE → GUESS THE REST', C.violet)
  );

  // Beat 24: 10th student tells you little that is new
  const tenthRing = new M.Circle({ radius: 0.13, color: C.pink, strokeWidth: 2.5 });
  tenthRing.moveTo([ax(21), RY[0], 0]);
  await until(S(24));
  await play(
    new M.Create(tenthRing), new M.Flash(r1Dots[9], { color: C.pink }),
    ...say('10TH STUDENT = LITTLE NEW', C.pink)
  );

  // Beat 25: Dependent
  await until(S(25));
  await play(
    new M.LaggedStart(tightBoxes.map(b => new M.Indicate(b, { color: C.violet })), { lagRatio: 0.15, runTime: 1.4 }),
    ...say('DEPENDENT', C.violet),
    ...fbox([['DEPENDENT', C.violet], ['members of a group', C.ink], ['are alike', C.ink]], C.violet)
  );

  // Beat 26: One answer hints at the next
  const hintLinks = [
    new M.Line({ start: [ax(15), RY[0] - 0.18, 0], end: [ax(21), RY[0] - 0.18, 0], color: C.violet, strokeWidth: 3 }),
    new M.Line({ start: [ax(19), RY[1] - 0.18, 0], end: [ax(25), RY[1] - 0.18, 0], color: C.violet, strokeWidth: 3 }),
    new M.Line({ start: [ax(43), RY[2] - 0.18, 0], end: [ax(51), RY[2] - 0.18, 0], color: C.violet, strokeWidth: 3 })
  ];
  await until(S(26));
  await play(
    ...hintLinks.map(l => new M.Create(l)),
    ...say('ONE ANSWER HINTS AT NEXT', C.violet),
    ...fbox([['DEPENDENT', C.violet], ['1 answer → hints at', C.ink], ['next in same group', C.violet]], C.violet)
  );

  // =========================================================================
  // ACT 5 (Beats 27-30): Compare with Roster SRS & "3 pieces of news"
  // =========================================================================
  const divider = new M.DashedLine({ start: [AX0, DIVY, 0], end: [AX1, DIVY, 0], color: C.line, strokeWidth: 1.5 });
  const srsTrack = new M.Line({ start: [AX0, SRSY - 0.14, 0], end: [AX1, SRSY - 0.14, 0], color: C.line, strokeWidth: 1.4 });
  const srsLab = T(P ? 'SRS' : 'Roster', P ? 17 : 17, C.green, true);
  srsLab.moveTo([LBLX, SRSY, 0]);
  const srsDots = SRS.map((v, k) => {
    const dup = SRS.slice(0, k).filter(x => x === v).length;
    const col = v <= 30 ? C.cyan : HILL;
    const d = new M.Dot({ point: [ax(v), SRSY + dup * (P ? 0.19 : 0.20), 0], radius: P ? 0.07 : 0.075, color: col });
    d.setFill(col, 0.95); return d;
  });

  // Beat 27: Compare 10 students drawn one by one from the roster
  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(...tightBoxes, tagC1, tagC2, tagH3, knowRing, tenthRing, ...hintLinks)),
    new M.Create(divider), new M.FadeIn(srsTrack), new M.FadeIn(srsLab),
    new M.LaggedStart(srsDots.map(d => new M.FadeIn(d)), { lagRatio: 0.10, runTime: 1.6 }),
    ...say('10 FROM ROSTER: SPREAD WIDE', C.green),
    ...fbox([['3 rooms: 3 clumps', C.pink], ['10 roster: all over', C.green]], C.green)
  );

  // Beat 28: 30 students from 3 rooms != 30 separate students
  await until(S(28));
  await play(
    new M.LaggedStart([r1Mean.lb, r2Mean.lb, r3Mean.lb].map(t => new M.Indicate(t, { color: C.pink })), { lagRatio: 0.18, runTime: 1.4 }),
    ...say('30 IN 3 ROOMS ≠ 30 SEPARATE', C.pink),
    ...fbox([['30 from 3 rooms', C.pink], ['≠ 30 separate', C.amber]], C.pink)
  );

  // Beat 29: Behave more like 3 pieces of news, one per room
  const big1 = new M.Dot({ point: [ax(18), RY[0], 0], radius: 0.18, color: C.cyan }); big1.setFill(C.cyan, 0.95);
  const big2 = new M.Dot({ point: [ax(22), RY[1], 0], radius: 0.18, color: C.cyan }); big2.setFill(C.cyan, 0.95);
  const big3 = new M.Dot({ point: [ax(47), RY[2], 0], radius: 0.18, color: HILL }); big3.setFill(HILL, 0.95);
  await until(S(29));
  await play(
    new M.FadeOut(new M.VGroup(...r1Dots, ...r2Dots, ...r3Dots, r1Mean.ln, r2Mean.ln, r3Mean.ln, r1Mean.lb, r2Mean.lb, r3Mean.lb, divider, srsTrack, srsLab, ...srsDots)),
    new M.FadeIn(big1), new M.FadeIn(big2), new M.FadeIn(big3),
    new M.Flash(big1, { color: C.amber }), new M.Flash(big2, { color: C.amber }), new M.Flash(big3, { color: C.amber }),
    ...say('LIKE 3 PIECES OF NEWS', C.amber),
    ...fbox([['30 people, but only', C.muted], ['3 pieces of news', C.amber], ['18,  22,  47', C.ink]], C.amber)
  );

  // Beat 30: Luck plays a big part — 3 different rooms give very different answers
  const tLine2 = new M.DashedLine({ start: [ax(30), AY, 0], end: [ax(30), RY[0] + 0.36, 0], color: C.amber, strokeWidth: 2.5 });
  const tLab2 = T('truth 30', P ? 15 : 15, C.amber, true);
  tLab2.moveTo([ax(30) + (P ? 0.85 : 0.80), SRSY, 0]);
  const eLine2 = new M.Line({ start: [ax(29), AY, 0], end: [ax(29), RY[0] + 0.36, 0], color: C.green, strokeWidth: 3 });
  const eDot2 = new M.Dot({ point: [ax(29), AY, 0], radius: 0.11, color: C.green }); eDot2.setFill(C.green, 1);

  const mkDot = (v, ry, col) => { const d = new M.Dot({ point: [ax(v), ry, 0], radius: 0.18, color: col }); d.setFill(col, 0.95); return d; };
  const mkLine = (v, col) => new M.Line({ start: [ax(v), AY, 0], end: [ax(v), RY[0] + 0.36, 0], color: col, strokeWidth: 3 });
  const mkMark = (v, col) => { const d = new M.Dot({ point: [ax(v), AY, 0], radius: 0.11, color: col }); d.setFill(col, 1); return d; };

  await until(S(30));
  await play(
    new M.Create(tLine2), new M.FadeIn(tLab2), new M.Create(eLine2), new M.FadeIn(eDot2),
    ...say('LUCK PLAYS A BIG PART', C.pink),
    ...fbox([['Draw 1: 18, 22, 47', C.ink], ['mean = 29 min', C.green]], C.amber)
  );
  await play(
    new M.Transform(big1, mkDot(16, RY[0], C.cyan), { runTime: 1.0 }),
    new M.Transform(big2, mkDot(20, RY[1], C.cyan), { runTime: 1.0 }),
    new M.Transform(big3, mkDot(24, RY[2], C.cyan), { runTime: 1.0 }),
    new M.Transform(eLine2, mkLine(20, C.pink), { runTime: 1.0 }),
    new M.Transform(eDot2, mkMark(20, C.pink), { runTime: 1.0 }),
    ...fbox([['Draw 2: 16, 20, 24', C.cyan], ['mean = 20 (too low!)', C.pink]], C.pink)
  );
  await play(
    new M.Transform(big1, mkDot(21, RY[0], C.cyan), { runTime: 1.0 }),
    new M.Transform(big2, mkDot(45, RY[1], HILL), { runTime: 1.0 }),
    new M.Transform(big3, mkDot(48, RY[2], HILL), { runTime: 1.0 }),
    new M.Transform(eLine2, mkLine(38, C.pink), { runTime: 1.0 }),
    new M.Transform(eDot2, mkMark(38, C.pink), { runTime: 1.0 }),
    ...fbox([['Draw 3: 21, 45, 48', HILL], ['mean = 38 (too high!)', C.pink]], C.pink)
  );

  // =========================================================================
  // ACT 6 (Beats 31-40): One-line rule, uses, trap, next lesson, recap
  // =========================================================================
  // Beat 31: Here is the idea in one line
  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(axisLine, ...axisTicks, axisUnit, ...tracks, ...rLabels, big1, big2, big3, tLine2, tLab2, eLine2, eDot2)),
    ...clearBox(),
    ...say('THE IDEA IN ONE LINE')
  );

  // Beat 32: Choose groups at random, ask everyone inside
  const miniL = CX - (P ? 1.85 : 2.15), miniR = CX + (P ? 1.75 : 2.15), miniY = P ? -1.4 : -0.6;
  const mini6 = [];
  for (let i = 0; i < 6; i++) {
    const col = i % 3, row = Math.floor(i / 3), lit = i === 1 || i === 5;
    const c = lit ? (i === 1 ? C.cyan : HILL) : C.line;
    const b = new M.RoundedRectangle({ width: P ? 0.85 : 0.95, height: P ? 0.65 : 0.68, cornerRadius: 0.08, color: lit ? C.amber : C.muted, strokeWidth: lit ? 2.5 : 1.3 });
    b.setFill(c, lit ? 0.75 : 0.14);
    b.moveTo([miniL + (col - 1) * (P ? 1.02 : 1.15), miniY + (0.5 - row) * (P ? 0.88 : 0.92), 0]);
    mini6.push(b);
  }
  const arrowTxt = T('→', P ? 36 : 40, C.amber, true); arrowTxt.moveTo([CX - 0.05, miniY, 0]);
  const asked1 = makeRoomCard(miniR, miniY + (P ? 0.75 : 0.72), P ? 2.1 : 2.3, P ? 1.15 : 1.1, C.cyan, null, null);
  const asked2 = makeRoomCard(miniR, miniY - (P ? 0.75 : 0.72), P ? 2.1 : 2.3, P ? 1.15 : 1.1, HILL, null, null);

  await until(S(32));
  await play(
    ...mini6.map(b => new M.FadeIn(b)),
    new M.FadeIn(arrowTxt), new M.FadeIn(asked1), new M.FadeIn(asked2),
    ...say('PICK GROUPS → ASK ALL', C.green),
    ...fbox([['CLUSTER SAMPLE', C.green], ['pick groups at random,', C.ink], ['ask everyone inside', C.ink]], C.green)
  );

  // Beat 33: Everyday words: visit a few places, ask everybody there
  const everyday = T('visit a few places · ask everybody there', P ? 16 : 18, C.amber);
  everyday.moveTo([CX, miniY - (P ? 2.1 : 1.85), 0]);
  await until(S(33));
  await play(
    new M.Indicate(asked1, { color: C.amber }), new M.Indicate(asked2, { color: C.amber }),
    new M.FadeIn(everyday),
    ...say('FEW PLACES · ASK EVERYBODY', C.amber)
  );

  // Beat 34: Good for #1 — saves time and money
  function makeCard(cx, cy, w, h, color, head, sub) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.18, color, strokeWidth: 2 });
    r.setFill(C.card, 0.92); r.moveTo([cx, cy, 0]);
    const t1 = T(head, P ? 21 : 22, color, true); t1.moveTo([cx, cy + h * 0.18, 0]);
    const t2 = T(sub, P ? 16 : 17, C.ink); t2.moveTo([cx, cy - h * 0.20, 0]);
    return new M.VGroup(r, t1, t2);
  }
  const cW = P ? 6.8 : 7.6, cH = P ? 1.75 : 1.55;
  const use1 = makeCard(CX, P ? -0.4 : 0.2, cW, cH, C.green, '1. SAVES TIME & MONEY', 'visit fewer places when people are spread apart');
  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(...mini6, arrowTxt, asked1, asked2, everyday)),
    new M.FadeIn(use1),
    ...say('SAVES TIME AND MONEY', C.green),
    ...fbox([['GOOD FOR:', C.green], ['• saves travel & cost', C.ink]], C.green)
  );

  // Beat 35: Good for #2 — no list of people, only a list of groups
  const use2 = makeCard(CX, P ? -2.7 : -1.65, cW, cH, C.cyan, '2. LIST OF GROUPS ONLY', 'works when there is no full list of people');
  await until(S(35));
  await play(
    new M.FadeIn(use2),
    ...say('ONLY A LIST OF GROUPS', C.cyan),
    ...fbox([['GOOD FOR:', C.green], ['• saves travel & cost', C.ink], ['• list of groups only', C.cyan]], C.cyan)
  );

  // Beat 36: Common trap — counting people, forgetting groups
  const big30 = T('30', P ? 76 : 74, C.pink, true); big30.moveTo([CX - (P ? 1.55 : 1.9), MY + 0.25, 0]);
  const big30Sub = T('people', P ? 20 : 20, C.pink); big30Sub.moveTo([CX - (P ? 1.55 : 1.9), MY - 0.65, 0]);
  const fromTxt = T('from only', P ? 18 : 19, C.muted); fromTxt.moveTo([CX, MY + 0.1, 0]);
  const small3 = T('3', P ? 56 : 54, C.amber, true); small3.moveTo([CX + (P ? 1.65 : 1.9), MY + 0.25, 0]);
  const small3Sub = T('rooms', P ? 20 : 20, C.amber); small3Sub.moveTo([CX + (P ? 1.65 : 1.9), MY - 0.65, 0]);

  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(use1, use2)),
    new M.FadeIn(big30), new M.FadeIn(big30Sub), new M.FadeIn(fromTxt), new M.FadeIn(small3), new M.FadeIn(small3Sub),
    ...say('TRAP: COUNTING PEOPLE ONLY', C.pink),
    ...fbox([['COMMON TRAP', C.pink], ['counting 30 people,', C.ink], ['forgetting 3 rooms', C.pink]], C.pink)
  );

  // Beat 37: 30 from 3 rooms != 30 random students
  const boxW = P ? 2.95 : 3.4, boxH = P ? 3.2 : 2.8;
  const lx = CX - (P ? 1.9 : 2.25), rx = CX + (P ? 1.9 : 2.25), cy37 = P ? -1.5 : -0.7;
  const leftFrame = new M.RoundedRectangle({ width: boxW, height: boxH, cornerRadius: 0.16, color: C.pink, strokeWidth: 2 });
  leftFrame.setFill(C.card, 0.85); leftFrame.moveTo([lx, cy37, 0]);
  const leftHead = T('3 rooms · 30', P ? 16 : 17, C.pink, true); leftHead.moveTo([lx, cy37 + boxH / 2 + 0.26, 0]);
  const clumps = [];
  const clumpC = [[-0.25, 0.26, C.cyan], [0.22, -0.02, C.cyan], [-0.18, -0.28, HILL]];
  clumpC.forEach(([fx, fy, col]) => {
    for (let j = 0; j < 10; j++) {
      const a = (j / 10) * Math.PI * 2, rad = j < 2 ? 0.05 : 0.16;
      const d = new M.Dot({ point: [lx + fx * boxW + Math.cos(a) * rad, cy37 + fy * boxH + Math.sin(a) * rad, 0], radius: 0.055, color: col });
      d.setFill(col, 0.92); clumps.push(d);
    }
  });
  const neq = T('≠', P ? 40 : 44, C.pink, true); neq.moveTo([CX, cy37, 0]);
  const rightFrame = new M.RoundedRectangle({ width: boxW, height: boxH, cornerRadius: 0.16, color: C.green, strokeWidth: 2 });
  rightFrame.setFill(C.card, 0.85); rightFrame.moveTo([rx, cy37, 0]);
  const rightHead = T('30 random', P ? 16 : 17, C.green, true); rightHead.moveTo([rx, cy37 + boxH / 2 + 0.26, 0]);
  const spread30 = [];
  for (let j = 0; j < 30; j++) {
    const col = j % 6, row = Math.floor(j / 6);
    const jx = ((j * 37) % 11 - 5) * 0.022, jy = ((j * 53) % 11 - 5) * 0.022;
    const c = j % 5 < 3 ? C.cyan : HILL;
    const d = new M.Dot({
      point: [rx + (col - 2.5) * (boxW * 0.14) + jx, cy37 + (2 - row) * (boxH * 0.16) + jy, 0],
      radius: 0.055, color: c
    });
    d.setFill(c, 0.92); spread30.push(d);
  }
  const cmp37 = new M.VGroup(leftFrame, leftHead, ...clumps, neq, rightFrame, rightHead, ...spread30);

  await until(S(37));
  await play(
    new M.FadeOut(new M.VGroup(big30, big30Sub, fromTxt, small3, small3Sub)),
    new M.FadeIn(cmp37),
    ...say('3 ROOMS OF 10 ≠ 30 RANDOM', C.pink)
  );

  // Beat 38: Pick more rooms, not more students from the same rooms
  const moreRowY = P ? -0.4 : 0.25, sameRowY = P ? -2.75 : -1.55;
  const moreBoxes = Array.from({ length: 8 }, (_, k) => {
    const col = k < 5 ? C.cyan : HILL;
    const r = new M.RoundedRectangle({ width: P ? 0.68 : 0.78, height: P ? 0.72 : 0.72, cornerRadius: 0.08, color: C.green, strokeWidth: 2 });
    r.setFill(col, 0.55);
    r.moveTo([CX + (k - 3.5) * (P ? 0.84 : 0.95), moreRowY, 0]);
    return r;
  });
  const moreTxt = T('✓ pick more rooms', P ? 18 : 19, C.green, true);
  moreTxt.moveTo([CX, moreRowY + 0.68, 0]);
  const sameBoxes = [0, 1].map(k => {
    const r = new M.RoundedRectangle({ width: P ? 1.7 : 1.9, height: P ? 0.78 : 0.78, cornerRadius: 0.1, color: C.pink, strokeWidth: 2 });
    r.setFill(C.pink, 0.20);
    r.moveTo([CX + (k - 0.5) * (P ? 2.2 : 2.5), sameRowY, 0]);
    return r;
  });
  const sameTxt = T('✗ not more from the same rooms', P ? 16 : 18, C.pink, true);
  sameTxt.moveTo([CX, sameRowY + 0.68, 0]);

  await until(S(38));
  await play(
    new M.FadeOut(cmp37),
    new M.FadeIn(moreTxt),
    new M.LaggedStart(moreBoxes.map(b => new M.FadeIn(b)), { lagRatio: 0.08, runTime: 1.1 }),
    new M.FadeIn(sameTxt), ...sameBoxes.map(b => new M.FadeIn(b)),
    ...say('PICK MORE ROOMS TO LEARN MORE', C.green),
    ...fbox([['TO LEARN MORE:', C.green], ['✓ pick more rooms', C.green], ['✗ same rooms, more', C.pink]], C.green)
  );

  // Beat 39: Bridge to 3.3.6 — some chosen students do not answer
  const nextDots = [], qMarks = [];
  const noReply = new Set([2, 5, 7, 9]);
  for (let k = 0; k < 10; k++) {
    const col = k % 5, row = Math.floor(k / 5);
    const pt = [CX + (col - 2) * (P ? 1.25 : 1.35), MY + (0.5 - row) * (P ? 1.45 : 1.35), 0];
    const d = new M.Dot({ point: pt, radius: P ? 0.22 : 0.21, color: C.cyan });
    d.setFill(C.cyan, 0.95); nextDots.push(d);
    if (noReply.has(k)) {
      const q = T('?', P ? 26 : 26, C.pink, true);
      q.moveTo([pt[0], pt[1], 0]); qMarks.push(q);
    }
  }
  await until(S(39));
  await play(
    new M.FadeOut(new M.VGroup(...moreBoxes, moreTxt, ...sameBoxes, sameTxt)),
    new M.LaggedStart(nextDots.map(d => new M.FadeIn(d)), { lagRatio: 0.06, runTime: 0.9 }),
    ...say('NEXT: WHEN SOME DO NOT REPLY', C.violet),
    ...fbox([['NEXT LESSON (3.3.6)', C.violet], ['some chosen students', C.ink], ['do not answer', C.pink]], C.violet)
  );
  const dimAnims = [];
  nextDots.forEach((d, k) => {
    if (noReply.has(k)) {
      const g = new M.Dot({ point: [CX + (k % 5 - 2) * (P ? 1.25 : 1.35), MY + (0.5 - Math.floor(k / 5)) * (P ? 1.45 : 1.35), 0], radius: P ? 0.22 : 0.21, color: C.muted });
      g.setFill(C.muted, 0.25);
      dimAnims.push(new M.Transform(d, g, { runTime: 0.8 }));
    }
  });
  await play(...dimAnims, ...qMarks.map(q => new M.FadeIn(q)));

  // Beat 40: One-sentence recap
  const recW = P ? 6.8 : 7.6, recH = P ? 1.45 : 1.15;
  const recY = P ? [0.1, -1.65, -3.4] : [0.55, -0.75, -2.05];
  const rec1 = makeCard(CX, recY[0], recW, recH, C.green, 'CHEAP', 'visit fewer places, ask everyone there');
  const rec2 = makeCard(CX, recY[1], recW, recH, C.violet, 'ALIKE INSIDE', 'members in one group are dependent');
  const rec3 = makeCard(CX, recY[2], recW, recH, C.amber, 'LEARN LESS', 'than the head count suggests');

  await until(S(40));
  await play(
    new M.FadeOut(new M.VGroup(...nextDots, ...qMarks)),
    new M.LaggedStart([rec1, rec2, rec3].map(c => new M.FadeIn(c)), { lagRatio: 0.22, runTime: 1.5 }),
    ...say('CHEAP · ALIKE · LESS INFO', C.amber),
    ...fbox([['CLUSTER SAMPLING', C.amber], ['+ cheap, fewer stops', C.green], ['− groups are alike', C.pink], ['→ pick more rooms', C.cyan]], C.amber)
  );
}
