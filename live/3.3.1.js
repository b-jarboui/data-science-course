// 3.3.1 Population and sample (live version, script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;

  const D1 = [15, 20, 25, 10, 40, 50, 30, 20, 35, 35]; // sum 280, mean 28
  const D2 = [20, 25, 30, 35, 45, 50, 15, 30, 35, 35]; // sum 320, mean 32
  const D3 = [10, 15, 20, 25, 30, 40, 20, 35, 35, 40]; // sum 270, mean 27
  const D4 = [15, 25, 30, 35, 45, 40, 20, 30, 35, 35]; // sum 310, mean 31

  const PILL = P ? [0, 2.25, 0] : [0, 1.95, 0];
  const BOXP = P ? [0, -4.75, 0] : [4.4, -0.35, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // formula box: lines = ['text' | ['text', color]]; leading spaces indent
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 24 : 21, lh = P ? 0.46 : 0.42;
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
    const maxw = P ? FW - 1.0 : 4.2;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  function makeArrow(a, b, color = C.amber, sw = 2.6, head = 0.2) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const shaft = new M.Line({ start: a, end: b, color, strokeWidth: sw });
    const h1 = new M.Line({ start: b, end: [b[0] - ux * head + px * head * 0.55, b[1] - uy * head + py * head * 0.55, 0], color, strokeWidth: sw });
    const h2 = new M.Line({ start: b, end: [b[0] - ux * head - px * head * 0.55, b[1] - uy * head - py * head * 0.55, 0], color, strokeWidth: sw });
    return new M.VGroup(shaft, h1, h2);
  }

  function makeCard(title, sub, center, w, h, color) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.18, color, strokeWidth: 2.2 });
    r.setFill(C.card, 0.95); r.moveTo(center);
    const t1 = T(title, P ? 20 : 21, color, true);
    if (t1.getWidth() > w - 0.35) t1.scaleToFitWidth(w - 0.35);
    t1.moveTo([center[0], center[1] + (sub ? 0.24 : 0), 0]);
    const parts = [r, t1];
    if (sub) {
      const t2 = T(sub, P ? 17 : 18, C.ink);
      if (t2.getWidth() > w - 0.35) t2.scaleToFitWidth(w - 0.35);
      t2.moveTo([center[0], center[1] - 0.28, 0]);
      parts.push(t2);
    }
    return new M.VGroup(...parts);
  }

  // 0-2 university, buses, and the question
  const camP = P ? [0, 0.25, 0] : [-2.5, -0.5, 0];
  const busP = P ? [0, -3.55, 0] : [2.6, -0.95, 0];

  const camBody = new M.RoundedRectangle({ width: 2.8, height: 1.45, cornerRadius: 0.08, color: C.cyan, strokeWidth: 2.2 });
  camBody.setFill(C.card, 0.95); camBody.moveTo([camP[0], camP[1] - 0.15, 0]);
  const roofL = new M.Line({ start: [camP[0] - 1.55, camP[1] + 0.58, 0], end: [camP[0], camP[1] + 1.22, 0], color: C.cyan, strokeWidth: 2.5 });
  const roofR = new M.Line({ start: [camP[0] + 1.55, camP[1] + 0.58, 0], end: [camP[0], camP[1] + 1.22, 0], color: C.cyan, strokeWidth: 2.5 });
  const roofB = new M.Line({ start: [camP[0] - 1.55, camP[1] + 0.58, 0], end: [camP[0] + 1.55, camP[1] + 0.58, 0], color: C.cyan, strokeWidth: 2.2 });
  const cols = [-0.95, -0.35, 0.35, 0.95].map(dx => {
    const c = new M.Rectangle({ width: 0.16, height: 0.9, color: C.cyan, strokeWidth: 1.5 });
    c.setFill(C.cyan, 0.22); c.moveTo([camP[0] + dx, camP[1] - 0.15, 0]); return c;
  });
  const door = new M.Rectangle({ width: 0.36, height: 0.55, color: C.amber, strokeWidth: 1.8 });
  door.setFill(C.amber, 0.25); door.moveTo([camP[0], camP[1] - 0.58, 0]);
  const camLab = T('UNIVERSITY · 1,000 STUDENTS', P ? 17 : 18, C.ink, true);
  camLab.moveTo([camP[0], camP[1] - 1.18, 0]);
  const campus = new M.VGroup(camBody, roofL, roofR, roofB, ...cols, door, camLab);

  const busBody = new M.RoundedRectangle({ width: 2.1, height: 0.92, cornerRadius: 0.14, color: C.amber, strokeWidth: 2.2 });
  busBody.setFill(C.card, 0.95); busBody.moveTo([busP[0], busP[1] + 0.1, 0]);
  const wins = [-0.62, 0, 0.62].map(dx => {
    const w = new M.RoundedRectangle({ width: 0.44, height: 0.32, cornerRadius: 0.05, color: C.cyan, strokeWidth: 1.4 });
    w.setFill(C.cyan, 0.28); w.moveTo([busP[0] + dx, busP[1] + 0.22, 0]); return w;
  });
  const wh1 = new M.Circle({ radius: 0.17, color: C.ink }); wh1.setFill(C.bg, 1); wh1.moveTo([busP[0] - 0.62, busP[1] - 0.36, 0]);
  const wh2 = new M.Circle({ radius: 0.17, color: C.ink }); wh2.setFill(C.bg, 1); wh2.moveTo([busP[0] + 0.62, busP[1] - 0.36, 0]);
  const busLab = T('BUSES', 16, C.amber, true); busLab.moveTo([busP[0], busP[1] - 0.78, 0]);
  const bus = new M.VGroup(busBody, ...wins, wh1, wh2, busLab);

  const road = new M.DashedLine({
    start: [busP[0] - 1.5, busP[1] - 0.53, 0],
    end: [busP[0] + 1.5, busP[1] - 0.53, 0],
    color: C.muted
  });
  const busArrow = P
    ? makeArrow([0, -2.85, 0], [0, -1.25, 0], C.amber, 2.8, 0.22)
    : makeArrow([1.3, -0.75, 0], [-0.85, -0.75, 0], C.amber, 2.8, 0.22);
  const qTag = pill('? MINUTES ON AVERAGE', C.amber, P ? 18 : 19);
  qTag.moveTo(P ? [0, -2.05, 0] : [0.22, 0.05, 0]);

  await until(S(0));
  await play(new M.FadeIn(campus), ...say('1,000 STUDENTS AT ONE UNIVERSITY'));

  await until(S(1));
  await play(new M.Create(road), new M.FadeIn(bus), new M.Create(busArrow), ...say('PLANNING THE CAMPUS BUSES', C.amber));

  await until(S(2));
  await play(new M.FadeIn(qTag), new M.Indicate(busArrow, { color: C.amber }), ...say('HOW LONG IS THE TRIP, ON AVERAGE?', C.amber));

  // 3 one glowing dot = one student
  const demoP = [0, P ? -1.4 : -0.5, 0];
  const demoHalo = new M.Dot({ point: demoP, radius: 0.52, color: C.cyan }); demoHalo.setFill(C.cyan, 0.2);
  const demoCore = new M.Dot({ point: demoP, radius: 0.2, color: C.cyan }); demoCore.setFill(C.cyan, 1);
  const demoLab = T('1 glowing dot = 1 student', P ? 22 : 24, C.ink);
  demoLab.moveTo([demoP[0], demoP[1] - 0.85, 0]);
  const demoDot = new M.VGroup(demoHalo, demoCore, demoLab);

  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(campus, road, bus, busArrow, qTag)),
    new M.FadeIn(demoDot),
    new M.Flash(demoCore, { color: C.cyan }),
    ...say('1 DOT = 1 STUDENT')
  );

  // 4-9 the 1,000-dot roster, census, and picking 10 students
  const COLS = P ? 25 : 40, ROWS = P ? 40 : 25;
  const DX = P ? 0.26 : 0.24, DY = P ? 0.19 : 0.145;
  const GY = P ? -2.0 : -0.55;
  const GW = (COLS - 1) * DX, GH = (ROWS - 1) * DY;
  const gx = c => -GW / 2 + c * DX;
  const gy = r => GY + GH / 2 - r * DY;

  // 10 well-spread positions across the 1,000-dot roster
  const SAMPLE_FRAC = [
    [0.12, 0.14], [0.16, 0.48], [0.12, 0.84], [0.42, 0.22], [0.46, 0.56],
    [0.42, 0.88], [0.72, 0.12], [0.84, 0.38], [0.76, 0.68], [0.88, 0.90]
  ];
  const sampleCoords = SAMPLE_FRAC.map(([rf, cf]) => [Math.round(rf * (ROWS - 1)), Math.round(cf * (COLS - 1))]);
  const sampleKey = new Map(sampleCoords.map(([r, c], idx) => [`${r},${c}`, idx]));

  const R_DOT = P ? 0.038 : 0.04;
  const bgDots = [];
  const rowLists = Array.from({ length: P ? 20 : ROWS }, () => []);
  const sampleDots = new Array(10);
  const samplePos = new Array(10);

  for (let r = 0; r < ROWS; r++) {
    const grpIdx = P ? Math.floor(r / 2) : r;
    for (let c = 0; c < COLS; c++) {
      const p = [gx(c), gy(r), 0];
      const d = new M.Dot({ point: p, radius: R_DOT, color: C.cyan });
      d.setFill(C.cyan, 0.72);
      const k = sampleKey.get(`${r},${c}`);
      if (k !== undefined) {
        sampleDots[k] = d;
        samplePos[k] = p;
      } else {
        bgDots.push(d);
        rowLists[grpIdx].push(d);
      }
    }
  }
  const bgRows = rowLists.map(arr => new M.VGroup(...arr));
  const rosterFoot = T('ROSTER: 1,000 STUDENTS', P ? 19 : 20, C.muted, true);
  rosterFoot.moveTo([0, GY - GH / 2 - (P ? 0.52 : 0.42), 0]);

  await until(S(4));
  await play(
    new M.FadeOut(demoDot),
    new M.LaggedStart([...bgRows.map(g => new M.FadeIn(g)), ...sampleDots.map(d => new M.FadeIn(d))], { lagRatio: 0.06, runTime: 2.5 }),
    new M.FadeIn(rosterFoot),
    ...say('THE ROSTER: ALL 1,000 STUDENTS')
  );

  // 5-7 census
  const censusBox = new M.RoundedRectangle({ width: GW + 0.46, height: GH + 0.38, cornerRadius: 0.16, color: C.amber, strokeWidth: 2.6 });
  censusBox.moveTo([0, GY, 0]);

  await until(S(5));
  bgDots.forEach(d => d.setFill(C.cyan, 0.95));
  sampleDots.forEach(d => d.setFill(C.cyan, 0.95));
  await play(new M.Create(censusBox), ...say('ASK ALL 1,000 STUDENTS?', C.amber));

  await until(S(6));
  await play(new M.Indicate(censusBox, { color: C.amber }), ...say('CENSUS = ASK EVERYONE', C.amber));

  await until(S(7));
  bgDots.forEach((d, idx) => {
    if (idx % 3 === 0 || idx % 7 === 0) { d.setColor(C.muted); d.setFill(C.muted, 0.16); }
  });
  await play(new M.FadeOut(censusBox), ...say('SLOW, COSTLY, MANY DO NOT ANSWER', C.pink));

  // 8-9 pick 10 students; 10 light up, 990 stay grey
  const pickRings = samplePos.map(p => {
    const c = new M.Circle({ radius: 0.22, color: C.green, strokeWidth: 2.2 });
    c.moveTo(p); return c;
  });

  await until(S(8));
  bgDots.forEach(d => { d.setColor(C.cyan); d.setFill(C.cyan, 0.52); });
  await play(
    new M.LaggedStart(pickRings.map(c => new M.Create(c)), { lagRatio: 0.1, runTime: 1.8 }),
    ...say('ASK ONLY 10 STUDENTS', C.green)
  );

  const litCores = [];
  const litDots = samplePos.map(p => {
    const h = new M.Dot({ point: p, radius: 0.24, color: C.cyan }); h.setFill(C.cyan, 0.24);
    const core = new M.Dot({ point: p, radius: 0.1, color: C.cyan }); core.setFill(C.cyan, 1);
    litCores.push(core);
    return new M.VGroup(h, core);
  });

  await until(S(9));
  bgDots.forEach(d => { d.setColor(C.muted); d.setFill(C.muted, 0.26); });
  await play(
    new M.FadeOut(new M.VGroup(...pickRings)),
    new M.LaggedStart(litDots.map(g => new M.FadeIn(g)), { lagRatio: 0.08, runTime: 1.3 }),
    ...say('10 LIT DOTS · 990 GREY', C.cyan)
  );

  // 10-15 hear the 10 trips in minutes (two per sentence)
  const badges = D1.map((val, k) => {
    const p = samplePos[k];
    const dy = p[1] > GY + GH / 2 - 0.55 ? -0.34 : 0.34;
    const bp = [p[0], p[1] + dy, 0];
    const t = T(String(val), P ? 18 : 17, C.amber, true);
    const r = new M.RoundedRectangle({ width: t.getWidth() + 0.26, height: P ? 0.38 : 0.34, cornerRadius: 0.12, color: C.amber, strokeWidth: 1.8 });
    r.setFill(C.bg, 0.94); r.moveTo(bp); t.moveTo(bp);
    return new M.VGroup(r, t);
  });

  await until(S(10));
  await play(...say('THEIR TRIPS (IN MINUTES)', C.amber));

  const hearPair = (i1, i2, rt = 1.1) => play(
    new M.LaggedStart([new M.FadeIn(badges[i1]), new M.FadeIn(badges[i2])], { lagRatio: 0.55, runTime: rt }),
    new M.LaggedStart([new M.Flash(litCores[i1], { color: C.amber }), new M.Flash(litCores[i2], { color: C.amber })], { lagRatio: 0.55, runTime: rt })
  );
  await until(S(11)); await hearPair(0, 1);
  await until(S(12)); await hearPair(2, 3);
  await until(S(13)); await hearPair(4, 5);
  await until(S(14)); await hearPair(6, 7);
  await until(S(15)); await hearPair(8, 9, 1.3);

  // 16-19 two groups: population and sample
  await until(S(16));
  await play(new M.FadeOut(new M.VGroup(...badges)), ...say('TWO GROUPS, TWO NAMES', C.violet));

  const popBox = new M.RoundedRectangle({ width: GW + 0.46, height: GH + 0.38, cornerRadius: 0.16, color: C.violet, strokeWidth: 2.5 });
  popBox.moveTo([0, GY, 0]);
  const footY = GY - GH / 2 - (P ? 0.55 : 0.44);
  const popTag = pill('POPULATION: 1,000', C.violet, P ? 16 : 17);
  popTag.moveTo([P ? -1.45 : -2.2, footY, 0]);
  const sampTag = pill('SAMPLE: 10', C.cyan, P ? 16 : 17);
  sampTag.moveTo([P ? 1.85 : 2.5, footY, 0]);

  await until(S(17));
  bgDots.forEach(d => { d.setColor(C.violet); d.setFill(C.violet, 0.34); });
  await play(new M.FadeOut(rosterFoot), new M.Create(popBox), new M.FadeIn(popTag), ...say('POPULATION = ALL 1,000 STUDENTS', C.violet));

  await until(S(18));
  bgDots.forEach(d => { d.setColor(C.muted); d.setFill(C.muted, 0.24); });
  await play(
    new M.LaggedStart(litDots.map(g => new M.Indicate(g, { color: C.amber })), { lagRatio: 0.08, runTime: 1.7 }),
    new M.FadeIn(sampTag),
    ...say('SAMPLE = THE 10 WE ASK', C.cyan)
  );

  // 19 population does not have to be people
  function makeExampleCard(kind, title, cx, cy) {
    const w = P ? 4.6 : 2.9, h = P ? 2.3 : 2.2;
    const box = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.18, color: C.violet, strokeWidth: 2 });
    box.setFill(C.card, 0.95); box.moveTo([cx, cy, 0]);
    const parts = [box];
    const iy = cy + 0.28;
    if (kind === 'people') {
      const hd = new M.Circle({ radius: 0.17, color: C.cyan }); hd.setFill(C.cyan, 0.9); hd.moveTo([cx, iy + 0.26, 0]);
      const bd = new M.Arc({ radius: 0.32, startAngle: 0, angle: Math.PI, color: C.cyan }); bd.setFill(C.cyan, 0.9); bd.moveTo([cx, iy - 0.14, 0]);
      parts.push(hd, bd);
    } else if (kind === 'buses') {
      const b = new M.RoundedRectangle({ width: 0.95, height: 0.48, cornerRadius: 0.08, color: C.amber, strokeWidth: 2 });
      b.setFill(C.amber, 0.25); b.moveTo([cx, iy + 0.06, 0]);
      const w1 = new M.Circle({ radius: 0.09, color: C.ink }); w1.setFill(C.ink, 1); w1.moveTo([cx - 0.28, iy - 0.2, 0]);
      const w2 = new M.Circle({ radius: 0.09, color: C.ink }); w2.setFill(C.ink, 1); w2.moveTo([cx + 0.28, iy - 0.2, 0]);
      parts.push(b, w1, w2);
    } else {
      const sq = new M.Rectangle({ width: 0.72, height: 0.62, color: C.green, strokeWidth: 2 });
      sq.setFill(C.green, 0.22); sq.moveTo([cx, iy + 0.02, 0]);
      const tape = new M.Line({ start: [cx, iy + 0.33, 0], end: [cx, iy - 0.29, 0], color: C.green, strokeWidth: 2 });
      const lid = new M.Line({ start: [cx - 0.36, iy + 0.14, 0], end: [cx + 0.36, iy + 0.14, 0], color: C.green, strokeWidth: 2 });
      parts.push(sq, tape, lid);
    }
    const lab = T(title, P ? 20 : 18, C.ink, true);
    if (lab.getWidth() > w - 0.25) lab.scaleToFitWidth(w - 0.25);
    lab.moveTo([cx, cy - 0.68, 0]);
    parts.push(lab);
    return new M.VGroup(...parts);
  }
  const exY = P ? [0.3, -2.3, -4.9] : [-0.5, -0.5, -0.5];
  const exX = P ? [0, 0, 0] : [-3.4, 0, 3.4];
  const popExamples = [
    makeExampleCard('people', 'STUDENTS', exX[0], exY[0]),
    makeExampleCard('buses', 'BUS RIDES', exX[1], exY[1]),
    makeExampleCard('boxes', 'PARCELS', exX[2], exY[2])
  ];

  await until(S(19));
  await play(
    new M.FadeOut(new M.VGroup(...bgRows, ...sampleDots, ...litDots, popBox, popTag, sampTag)),
    new M.LaggedStart(popExamples.map(e => new M.FadeIn(e)), { lagRatio: 0.16, runTime: 1.5 }),
    ...say('EVERYTHING YOUR QUESTION IS ABOUT', C.violet)
  );

  // 20-33 sample mean on a minutes line vs true population mean
  const L0 = P ? 6.8 : 7.8;
  const X0 = P ? -L0 / 2 : -6.3;
  const NY = P ? -1.0 : -0.85;
  const n2x = v => X0 + (v / 60) * L0;

  const numLine = new M.Line({ start: [X0, NY, 0], end: [X0 + L0, NY, 0], color: C.muted, strokeWidth: 3 });
  const ticks = [0, 10, 20, 30, 40, 50, 60].map(v => new M.VGroup(
    new M.Line({ start: [n2x(v), NY - 0.08, 0], end: [n2x(v), NY + 0.08, 0], color: C.muted }),
    T(String(v), 18, C.muted, true).moveTo([n2x(v), NY - 0.34, 0])
  ));
  const unitLab = T('minutes', 16, C.muted);
  unitLab.moveTo([X0 + L0 - 0.35, NY - 0.68, 0]);

  function makePlotDots(vals) {
    const counts = new Map();
    const tops = new Map();
    const out = [];
    vals.forEach(v => {
      const c = counts.get(v) || 0;
      counts.set(v, c + 1);
      const p = [n2x(v), NY + 0.34 + c * (P ? 0.42 : 0.36), 0];
      tops.set(v, p[1]);
      const h = new M.Dot({ point: p, radius: 0.21, color: C.cyan }); h.setFill(C.cyan, 0.2);
      const d = new M.Dot({ point: p, radius: 0.1, color: C.cyan }); d.setFill(C.cyan, 1);
      out.push(new M.VGroup(h, d));
    });
    tops.forEach((topY, v) => {
      const lab = T(String(v), P ? 18 : 16, C.cyan, true);
      const lp = [n2x(v), topY + (P ? 0.4 : 0.32), 0];
      // dark backing so the dashed true-mean line never runs through a number
      const bk = new M.Rectangle({ width: P ? 0.38 : 0.32, height: P ? 0.3 : 0.26, color: C.bg, strokeWidth: 0 });
      bk.setFill(C.bg, 1); bk.moveTo(lp);
      lab.moveTo(lp);
      out.push(new M.VGroup(bk, lab));
    });
    return out;
  }

  function makeSampMarker(val, labelText) {
    const x = n2x(val);
    const stem = new M.Line({ start: [x, NY, 0], end: [x, NY - 1.05, 0], color: C.cyan, strokeWidth: 3.5 });
    const pin = new M.Dot({ point: [x, NY, 0], radius: 0.13, color: C.cyan }); pin.setFill(C.cyan, 1);
    const badge = pill(labelText || `SAMPLE: ${val}`, C.cyan, P ? 16 : 17);
    const bx = val < 30 ? x - 0.85 : x + 0.85;
    badge.moveTo([bx, NY - 1.4, 0]);
    return { stem, pin, badge };
  }

  const plotDots1 = makePlotDots(D1);

  await until(S(20));
  await play(
    new M.FadeOut(new M.VGroup(...popExamples)),
    new M.Create(numLine),
    new M.FadeIn(new M.VGroup(...ticks, unitLab)),
    new M.LaggedStart(plotDots1.map(g => new M.FadeIn(g)), { lagRatio: 0.06, runTime: 1.4 }),
    ...say('FIND THE SAMPLE MEAN', C.cyan)
  );

  await until(S(21));
  await play(
    new M.LaggedStart(plotDots1.slice(0, 10).map(g => new M.Indicate(g, { color: C.amber })), { lagRatio: 0.08, runTime: 1.5 }),
    ...fbox([['step 1: add 10 trips', C.muted], ['sum   = 280', C.amber]], C.amber),
    ...say('STEP 1: SUM = 280 MINUTES', C.amber)
  );

  await until(S(22));
  await play(
    ...fbox(['sum   = 280', ['count = 10', C.green]], C.green),
    ...say('STEP 2: DIVIDE BY COUNT = 10', C.green)
  );

  await until(S(23));
  await play(
    ...fbox(['sum   = 280', 'count = 10', ['280 ÷ 10 = 28', C.cyan]], C.cyan),
    ...say('280 ÷ 10 = 28', C.cyan)
  );

  const sm1 = makeSampMarker(28);
  await until(S(24));
  await play(
    new M.Create(sm1.stem),
    new M.FadeIn(sm1.pin),
    new M.FadeIn(sm1.badge),
    ...fbox([['sample mean = 28 min', C.cyan], ['(from 10 students)', C.muted]], C.cyan),
    ...say('SAMPLE MEAN = 28 MINUTES', C.cyan)
  );

  // 25-29 population mean (hidden, then peek at 30)
  const trueBadgePos = [n2x(30) + (P ? 0.95 : 1.15), NY + (P ? 2.15 : 1.85), 0];
  const popQBadge = pill('POPULATION MEAN = ?', C.violet, P ? 16 : 17);
  popQBadge.moveTo([n2x(30), trueBadgePos[1], 0]);

  await until(S(25));
  await play(new M.FadeIn(popQBadge), ...say('WHAT ABOUT ALL 1,000 STUDENTS?', C.violet));

  await until(S(26));
  await play(
    new M.Indicate(popQBadge, { color: C.violet }),
    ...fbox([['sample mean = 28', C.cyan], ['pop. mean   = ?', C.violet]], C.violet),
    ...say('POPULATION MEAN = ALL 1,000', C.violet)
  );

  const hiddenBadge = pill('HIDDEN IN REAL LIFE', C.muted, P ? 16 : 17);
  hiddenBadge.moveTo([n2x(30), trueBadgePos[1], 0]);

  await until(S(27));
  await play(new M.FadeOut(popQBadge), new M.FadeIn(hiddenBadge), ...say('USUALLY HIDDEN — SO WE SAMPLE', C.muted));

  await until(S(28));
  await play(new M.Indicate(hiddenBadge, { color: C.amber }), ...say('PEEK ONCE TO JUDGE OUR METHOD', C.amber));

  const trueLine = new M.DashedLine({
    start: [n2x(30), NY, 0],
    end: [n2x(30), NY + (P ? 1.75 : 1.48), 0],
    color: C.amber
  });
  const trueBadge = pill('TRUE MEAN: 30', C.amber, P ? 16 : 17);
  trueBadge.moveTo(trueBadgePos);

  await until(S(29));
  await play(
    new M.FadeOut(hiddenBadge),
    new M.Create(trueLine),
    new M.FadeIn(trueBadge),
    ...fbox([['sample mean = 28', C.cyan], ['true mean   = 30', C.amber]], C.amber),
    ...say('TRUE POPULATION MEAN = 30 MIN', C.amber)
  );

  // 30 close, not identical (2-minute gap)
  const gapBar = new M.Line({ start: [n2x(28), NY - 0.65, 0], end: [n2x(30), NY - 0.65, 0], color: C.pink, strokeWidth: 5 });
  const gapLab = T('2 min gap', 17, C.pink, true);
  gapLab.moveTo([n2x(29) - 0.85, NY - 0.65, 0]);

  await until(S(30));
  await play(
    new M.Create(gapBar),
    new M.FadeIn(gapLab),
    new M.Indicate(sm1.badge, { color: C.cyan }),
    new M.Indicate(trueBadge, { color: C.amber }),
    ...fbox([['sample mean = 28', C.cyan], ['true mean   = 30', C.amber], ['gap = 2 minutes', C.pink]], C.pink),
    ...say('28 vs 30: CLOSE, NOT THE SAME', C.pink)
  );

  // 31-32 different samples give different sample means; true mean stays fixed
  const plotDots2 = makePlotDots(D2);
  const sm2 = makeSampMarker(32);

  await until(S(31));
  await play(
    new M.FadeOut(new M.VGroup(gapBar, gapLab, ...plotDots1, sm1.stem, sm1.pin, sm1.badge)),
    new M.FadeIn(new M.VGroup(...plotDots2, sm2.stem, sm2.pin, sm2.badge)),
    ...fbox([['new sample = 32', C.cyan], ['true mean  = 30', C.amber]], C.cyan),
    ...say('ANOTHER 10 STUDENTS → 32 MIN', C.cyan)
  );

  const plotDots3 = makePlotDots(D3);
  const sm3 = makeSampMarker(27);
  const plotDots4 = makePlotDots(D4);
  const sm4 = makeSampMarker(31);

  await until(S(32));
  await play(
    new M.FadeOut(new M.VGroup(...plotDots2, sm2.stem, sm2.pin, sm2.badge)),
    new M.FadeIn(new M.VGroup(...plotDots3, sm3.stem, sm3.pin, sm3.badge)),
    ...fbox([['true mean   = 30 (fixed)', C.amber], ['sample mean = 27', C.cyan]], C.amber),
    ...say('TRUTH IS FIXED · SAMPLE CHANGES', C.amber)
  );
  await play(
    new M.FadeOut(new M.VGroup(...plotDots3, sm3.stem, sm3.pin, sm3.badge)),
    new M.FadeIn(new M.VGroup(...plotDots4, sm4.stem, sm4.pin, sm4.badge)),
    new M.Indicate(trueBadge, { color: C.amber }),
    ...fbox([['true mean   = 30 (fixed)', C.amber], ['sample mean = 31', C.cyan]], C.amber)
  );

  // 33 estimate
  const plotDotsBack = makePlotDots(D1);
  const smBack = makeSampMarker(28, 'ESTIMATE: 28');
  const estArrow = makeArrow([n2x(28) + 0.04, NY - 0.72, 0], [n2x(30) - 0.04, NY - 0.72, 0], C.green, 3, 0.14);

  await until(S(33));
  await play(
    new M.FadeOut(new M.VGroup(...plotDots4, sm4.stem, sm4.pin, sm4.badge)),
    new M.FadeIn(new M.VGroup(...plotDotsBack, smBack.stem, smBack.pin, smBack.badge)),
    new M.Create(estArrow),
    ...fbox([['estimate = 28', C.green], ['truth    = 30', C.amber]], C.green),
    ...say('ESTIMATE = BEST GUESS FROM SAMPLE', C.green)
  );

  // 34-36 soup pot analogy
  const potC = P ? [0, -0.35, 0] : [-2.0, -0.45, 0];
  const spnC = P ? [0, -4.1, 0] : [2.35, -0.45, 0];

  function buildPot(center, stirred) {
    const pw = 3.1, ph = 2.05;
    const body = new M.RoundedRectangle({ width: pw, height: ph, cornerRadius: 0.24, color: C.muted, strokeWidth: 3 });
    body.setFill(C.card, 0.96); body.moveTo(center);
    const rim = new M.Line({ start: [center[0] - pw / 2 - 0.12, center[1] + ph / 2, 0], end: [center[0] + pw / 2 + 0.12, center[1] + ph / 2, 0], color: C.ink, strokeWidth: 3.5 });
    const hL = new M.Arc({ radius: 0.24, startAngle: Math.PI / 2, angle: Math.PI, color: C.muted, strokeWidth: 3 });
    hL.moveTo([center[0] - pw / 2 - 0.14, center[1] + 0.35, 0]);
    const hR = new M.Arc({ radius: 0.24, startAngle: -Math.PI / 2, angle: Math.PI, color: C.muted, strokeWidth: 3 });
    hR.moveTo([center[0] + pw / 2 + 0.14, center[1] + 0.35, 0]);

    const parts = [body, hL, hR];
    const dots = [];
    if (stirred) {
      const soup = new M.RoundedRectangle({ width: pw - 0.26, height: ph - 0.55, cornerRadius: 0.14, color: C.amber, strokeWidth: 0 });
      soup.setFill(C.amber, 0.22); soup.moveTo([center[0], center[1] - 0.16, 0]);
      parts.push(soup, rim);
      const colsMix = [C.amber, C.cyan, C.green];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
        const dx = (c - 2.5) * 0.44 + (r % 2 ? 0.1 : -0.1);
        const dy = (r - 1.5) * 0.32 - 0.16;
        const col = colsMix[(r * 2 + c) % 3];
        const d = new M.Dot({ point: [center[0] + dx, center[1] + dy, 0], radius: 0.065, color: col });
        d.setFill(col, 0.9);
        dots.push(d);
      }
    } else {
      const topLayer = new M.Rectangle({ width: pw - 0.26, height: 0.72, color: C.cyan, strokeWidth: 0 });
      topLayer.setFill(C.cyan, 0.12); topLayer.moveTo([center[0], center[1] + 0.24, 0]);
      const botLayer = new M.RoundedRectangle({ width: pw - 0.26, height: 0.78, cornerRadius: 0.12, color: C.pink, strokeWidth: 0 });
      botLayer.setFill(C.pink, 0.32); botLayer.moveTo([center[0], center[1] - 0.52, 0]);
      const sep = new M.DashedLine({ start: [center[0] - pw / 2 + 0.15, center[1] - 0.12, 0], end: [center[0] + pw / 2 - 0.15, center[1] - 0.12, 0], color: C.muted });
      parts.push(topLayer, botLayer, sep, rim);
      for (let c = 0; c < 5; c++) {
        const d = new M.Dot({ point: [center[0] + (c - 2) * 0.5, center[1] + 0.26, 0], radius: 0.05, color: C.cyan });
        d.setFill(C.cyan, 0.45); dots.push(d);
      }
      for (let r = 0; r < 2; r++) for (let c = 0; c < 7; c++) {
        const d = new M.Dot({ point: [center[0] + (c - 3) * 0.38, center[1] - 0.38 - r * 0.28, 0], radius: 0.08, color: r ? C.amber : C.pink });
        d.setFill(r ? C.amber : C.pink, 0.95); dots.push(d);
      }
    }
    return { pot: new M.VGroup(...parts), dots: new M.VGroup(...dots) };
  }

  function buildSpoon(center, mixed) {
    const bowl = new M.Circle({ radius: 0.42, color: C.ink, strokeWidth: 2.6 });
    bowl.setFill(mixed ? C.amber : C.cyan, mixed ? 0.28 : 0.16);
    bowl.moveTo([center[0] - 0.55, center[1], 0]);
    const handle = new M.Line({ start: [center[0] - 0.14, center[1] + 0.08, 0], end: [center[0] + 1.15, center[1] + 0.42, 0], color: C.ink, strokeWidth: 4.5 });
    const pts = mixed
      ? [[-0.14, 0.08, C.amber], [0.12, 0.06, C.cyan], [0, -0.14, C.green]]
      : [[-0.08, 0.05, C.cyan], [0.1, -0.05, C.cyan]];
    const sdots = pts.map(([dx, dy, col]) => {
      const d = new M.Dot({ point: [center[0] - 0.55 + dx, center[1] + dy, 0], radius: 0.065, color: col });
      d.setFill(col, 0.92); return d;
    });
    return new M.VGroup(bowl, handle, ...sdots);
  }

  const { pot, dots: potDots } = buildPot(potC, true);
  const spoon = buildSpoon(spnC, true);

  await until(S(34));
  await play(
    new M.FadeOut(new M.VGroup(numLine, ...ticks, unitLab, ...plotDotsBack, smBack.stem, smBack.pin, smBack.badge, trueLine, trueBadge, estArrow, ...(boxNow ? [boxNow] : []))),
    new M.FadeIn(pot),
    new M.FadeIn(potDots),
    new M.FadeIn(spoon),
    ...say('TASTE ONE SPOONFUL TO JUDGE THE POT', C.amber)
  );
  boxNow = null;

  const potLabel = pill('POT = POPULATION', C.violet, P ? 17 : 18);
  potLabel.moveTo([potC[0], potC[1] - 1.5, 0]);
  const spoonLabel = pill('SPOONFUL = SAMPLE', C.cyan, P ? 17 : 18);
  spoonLabel.moveTo([spnC[0], spnC[1] - (P ? 0.95 : 1.5), 0]);

  await until(S(35));
  await play(new M.FadeIn(potLabel), new M.FadeIn(spoonLabel), ...say('POT = POPULATION · SPOON = SAMPLE', C.violet));

  const stirArc = new M.Arc({ radius: 0.65, startAngle: 0.4, angle: Math.PI * 1.55, color: C.green, strokeWidth: 3 });
  stirArc.moveTo([potC[0], potC[1] - 0.14, 0]);

  await until(S(36));
  await play(new M.Create(stirArc), new M.Indicate(potDots, { color: C.green }), ...say('ONLY IF THE SOUP IS WELL STIRRED', C.green));

  // 37-40 the idea in one line + what sampling is for
  await until(S(37));
  await play(
    new M.FadeOut(new M.VGroup(pot, potDots, spoon, potLabel, spoonLabel, stirArc)),
    ...say('THE IDEA IN ONE LINE', C.cyan)
  );

  const cardX = P ? 0 : -2.35;
  const estCard = makeCard('SAMPLE MEAN', 'our estimate (28 min)', [cardX, P ? 0.45 : 0.55, 0], P ? 5.6 : 5.2, 1.25, C.cyan);
  const truthCard = makeCard('POPULATION MEAN', 'the truth we want (30 min)', [cardX, P ? -2.05 : -1.7, 0], P ? 5.6 : 5.2, 1.25, C.amber);
  const standArrow = makeArrow([cardX, P ? -0.25 : -0.14, 0], [cardX, P ? -1.35 : -1.0, 0], C.green, 3.2, 0.22);
  const standLab = T('stands in for', P ? 18 : 19, C.green, true);
  standLab.moveTo([cardX + (P ? 1.55 : 1.6), P ? -0.8 : -0.57, 0]);

  await until(S(38));
  await play(
    new M.FadeIn(estCard),
    new M.Create(standArrow),
    new M.FadeIn(standLab),
    new M.FadeIn(truthCard),
    ...fbox([['sample mean  (28)', C.cyan], ['  → estimates', C.green], ['pop. mean    (30)', C.amber]], C.cyan),
    ...say('ESTIMATE STANDS IN FOR THE TRUTH', C.cyan)
  );

  await until(S(39));
  await play(
    new M.Indicate(estCard, { color: C.cyan }),
    new M.Indicate(truthCard, { color: C.amber }),
    ...fbox([['in everyday words:', C.muted], ['ask a few,', C.cyan], ['learn about all', C.amber]], C.green),
    ...say('ASK A FEW, TO LEARN ABOUT ALL', C.green)
  );

  await until(S(40));
  await play(new M.Indicate(standArrow, { color: C.green }), ...say('BIG GROUP, WITHOUT ASKING ALL', C.green));

  // 41-42 common trap: chosen well vs top of an unstirred pot
  function makeChoiceBox(title, center, good) {
    const w = P ? 6.2 : 4.6, h = P ? 2.8 : 2.6;
    const col = good ? C.green : C.pink;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.18, color: col, strokeWidth: 2.2 });
    r.setFill(C.card, 0.95); r.moveTo(center);
    const parts = [r];
    const gx0 = center[0] - w / 2 + 0.5, gy0 = center[1] + h / 2 - 0.42;
    const sx = (w - 1.0) / 9, sy = (h - 1.15) / 4;
    const chosen = good
      ? new Set(['0,1', '0,7', '1,4', '1,8', '2,2', '2,6', '3,0', '3,5', '4,3', '4,9'])
      : new Set(['0,0', '0,1', '0,2', '0,3', '0,4', '1,0', '1,1', '1,2', '1,3', '1,4']);
    for (let row = 0; row < 5; row++) for (let c = 0; c < 10; c++) {
      const lit = chosen.has(`${row},${c}`);
      const d = new M.Dot({ point: [gx0 + c * sx, gy0 - row * sy, 0], radius: lit ? 0.095 : 0.045, color: lit ? col : C.muted });
      d.setFill(lit ? col : C.muted, lit ? 0.95 : 0.3);
      parts.push(d);
    }
    const lab = T(title, P ? 17 : 18, col, true);
    lab.moveTo([center[0], center[1] - h / 2 + 0.3, 0]);
    parts.push(lab);
    return new M.VGroup(...parts);
  }

  const goodBox = makeChoiceBox('CHOSEN WELL · SPREAD OUT', P ? [0, -0.1, 0] : [-2.9, -0.5, 0], true);
  const badBox = makeChoiceBox('CHOSEN POORLY · ONE CORNER', P ? [0, -3.5, 0] : [2.9, -0.5, 0], false);

  await until(S(41));
  await play(
    new M.FadeOut(new M.VGroup(estCard, standArrow, standLab, truthCard, ...(boxNow ? [boxNow] : []))),
    new M.FadeIn(goodBox),
    new M.FadeIn(badBox),
    ...say('TRAP: MUST BE CHOSEN WELL', C.pink)
  );
  boxNow = null;

  const badPotC = P ? [0, -2.2, 0] : [-1.2, -0.6, 0];
  const { pot: badPotShell, dots: badPotDots } = buildPot(badPotC, false);
  const topLab = T('TOP: WATERY', P ? 16 : 18, C.cyan, true);
  topLab.moveTo(P ? [0, badPotC[1] + 1.48, 0] : [badPotC[0] + 3.2, badPotC[1] + 0.35, 0]);
  const botLab = T('BOTTOM: RICH', P ? 16 : 18, C.pink, true);
  botLab.moveTo(P ? [0, badPotC[1] - 1.5, 0] : [badPotC[0] + 3.2, badPotC[1] - 0.55, 0]);
  const topSpoon = buildSpoon([badPotC[0] + 0.7, badPotC[1] + 0.55, 0], false);

  await until(S(42));
  await play(
    new M.FadeOut(new M.VGroup(goodBox, badBox)),
    new M.FadeIn(badPotShell),
    new M.FadeIn(badPotDots),
    new M.FadeIn(topSpoon),
    new M.FadeIn(topLab),
    new M.FadeIn(botLab),
    ...say('UNSTIRRED POT: TOP ≠ BOTTOM', C.pink)
  );

  // 43 bridge to next lessons
  const nextRight = makeCard('HOW CHOICE GOES RIGHT', 'fair, spread-out samples', P ? [0, -0.6, 0] : [-3.0, -0.5, 0], P ? 6.2 : 4.9, P ? 1.9 : 1.55, C.green);
  const nextWrong = makeCard('HOW CHOICE GOES WRONG', 'missed groups & traps', P ? [0, -3.3, 0] : [3.0, -0.5, 0], P ? 6.2 : 4.9, P ? 1.9 : 1.55, C.pink);

  await until(S(43));
  await play(
    new M.FadeOut(new M.VGroup(badPotShell, badPotDots, topSpoon, topLab, botLab)),
    new M.FadeIn(nextRight),
    new M.FadeIn(nextWrong),
    ...say('NEXT: HOW CHOICE GOES RIGHT OR WRONG', C.amber)
  );

  // 44 one-sentence recap
  const recapPop = makeCard('POPULATION', 'everyone you want to know about', P ? [0, -0.6, 0] : [-3.1, -0.5, 0], P ? 6.6 : 5.3, P ? 1.9 : 1.6, C.violet);
  const recapSamp = makeCard('SAMPLE', 'the few you actually ask', P ? [0, -3.3, 0] : [3.1, -0.5, 0], P ? 6.6 : 5.3, P ? 1.9 : 1.6, C.cyan);

  await until(S(44));
  await play(
    new M.FadeOut(new M.VGroup(nextRight, nextWrong)),
    new M.FadeIn(recapPop),
    new M.FadeIn(recapSamp),
    ...say('POPULATION = ALL · SAMPLE = THE FEW', C.green)
  );
}
