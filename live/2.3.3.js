// 2.3.3 Logarithmic axes (live manim-web lesson).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  const VALS = [100, 1000, 10000, 100000];
  const LABS = ['100', '1,000', '10,000', '100,000'];
  const YRS = P ? ['Yr 1', 'Yr 2', 'Yr 3', 'Yr 4'] : ['Year 1', 'Year 2', 'Year 3', 'Year 4'];

  // Layout constants: laptop (14.22 x 8, y in [-3.0, 2.3]) and phone (8 x 14.22, y in [-5.5, 4.3])
  const CX = P ? 0 : -1.95;
  const BOXP = P ? [0, 3.30, 0] : [4.45, -0.35, 0];
  let pillPos = P ? [0, 1.85, 0] : [0, 1.92, 0];
  const say = (s, c = C.cyan) => showA(s, c, pillPos, P ? 17 : 19);

  // Chart coordinates
  const AX = P ? -1.75 : -4.70;
  const AX_R = P ? 3.55 : 1.45;
  const AY0 = P ? -4.35 : -2.15;
  const AY1 = P ? 0.60 : 1.15;
  const AH = AY1 - AY0;
  const xs = P
    ? [AX + 1.15, AX + 2.35, AX + 3.55, AX + 4.75]
    : [AX + 1.15, AX + 2.55, AX + 3.95, AX + 5.35];
  const yLin = v => AY0 + (v / 100000) * AH;
  const logBase = P ? AY0 + 0.45 : AY0 + 0.30;
  const logStep = P ? 1.50 : 1.00;
  const yLog = k => logBase + k * logStep;

  // Formula box: one box on screen at a time; lines = ['text' | ['text', color]]
  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 21, lh = P ? 0.38 : 0.42;
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
    const maxw = P ? FW - 0.8 : 4.1;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  // Geometry helpers (built from Line / Dot / RoundedRectangle / Circle only)
  function upArrow(x, y1, y2, color = C.amber, sw = 2.5) {
    const tip = 0.12;
    return new M.VGroup(
      new M.Line({ start: [x, y1, 0], end: [x, y2, 0], color, strokeWidth: sw }),
      new M.Line({ start: [x - tip * 0.75, y2 - tip, 0], end: [x, y2, 0], color, strokeWidth: sw }),
      new M.Line({ start: [x + tip * 0.75, y2 - tip, 0], end: [x, y2, 0], color, strokeWidth: sw })
    );
  }

  function bracket(x, y1, y2, color, sw = 2.6) {
    const w = 0.16;
    return new M.VGroup(
      new M.Line({ start: [x - w, y1, 0], end: [x, y1, 0], color, strokeWidth: sw }),
      new M.Line({ start: [x, y1, 0], end: [x, y2, 0], color, strokeWidth: sw }),
      new M.Line({ start: [x - w, y2, 0], end: [x, y2, 0], color, strokeWidth: sw })
    );
  }

  function makeDot(pt, labelText, color = C.cyan, lx = 0, ly = 0.32) {
    const r = P ? 0.11 : 0.12;
    const halo = new M.Dot({ point: pt, radius: r * 2.3, color });
    halo.setFill(color, 0.18);
    const d = new M.Dot({ point: pt, radius: r, color });
    d.setFill(color, 1);
    // label sits up-left of the dot, clear of the dot glow and of the line (which climbs to the right)
    const lbl = T(labelText, P ? 15 : 16, color, true, true);
    if (lx === 'R') lbl.moveTo([pt[0] + r * 2.3 + 0.08 + lbl.getWidth() / 2, pt[1] - 0.04, 0]);
    else lbl.moveTo([pt[0] - r * 2.3 - 0.06 - lbl.getWidth() / 2 + lx, pt[1] + ly, 0]);
    return { g: new M.VGroup(halo, d, lbl), d, halo, lbl };
  }

  function makeBus(cx, cy) {
    const body = new M.RoundedRectangle({ width: 2.3, height: 0.92, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2.5 });
    body.setFill(C.card, 0.95); body.moveTo([cx, cy + 0.08, 0]);
    const wins = [-0.62, -0.02, 0.58].map(dx => {
      const w = new M.RoundedRectangle({ width: 0.44, height: 0.32, cornerRadius: 0.06, color: C.cyan, strokeWidth: 1.5 });
      w.setFill(C.cyan, 0.28); w.moveTo([cx + dx, cy + 0.24, 0]);
      return w;
    });
    const w1 = new M.Circle({ radius: 0.18, color: C.ink }); w1.setFill(C.bg, 1); w1.moveTo([cx - 0.65, cy - 0.38, 0]);
    const w2 = new M.Circle({ radius: 0.18, color: C.ink }); w2.setFill(C.bg, 1); w2.moveTo([cx + 0.65, cy - 0.38, 0]);
    const h1 = new M.Dot({ point: [cx - 0.65, cy - 0.38, 0], radius: 0.06, color: C.cyan });
    const h2 = new M.Dot({ point: [cx + 0.65, cy - 0.38, 0], radius: 0.06, color: C.cyan });
    const badge = new M.RoundedRectangle({ width: 1.05, height: 0.36, cornerRadius: 0.1, color: C.amber, strokeWidth: 2 });
    badge.setFill(C.card, 0.95); badge.moveTo([cx, cy - 0.14, 0]);
    const bTxt = T('ROUTE D', 15, C.amber, true, true); bTxt.moveTo([cx, cy - 0.14, 0]);
    const road = new M.Line({ start: [cx - 2.2, cy - 0.56, 0], end: [cx + 2.2, cy - 0.56, 0], color: C.muted, strokeWidth: 2 });
    return new M.VGroup(road, body, ...wins, w1, w2, h1, h2, badge, bTxt);
  }

  function makeMultTags() {
    return [0, 1, 2].map(k => {
      const mid = (yLog(k) + yLog(k + 1)) / 2;
      const arr = upArrow(AX + 0.24, yLog(k) + 0.14, yLog(k + 1) - 0.14, C.amber, 2.4);
      const t = T('×10', P ? 15 : 16, C.amber, true, true);
      t.moveTo([AX + 0.38 + t.getWidth() / 2, mid, 0]);
      return new M.VGroup(arr, t);
    });
  }

  // 0: Imagine the city opens a new bus route, called route D.
  const bus = makeBus(0, P ? 0.55 : 0.72);
  await until(S(0));
  await play(new M.FadeIn(bus), ...say('ROUTE D · NEW BUS ROUTE', C.cyan));

  // 1: You want to know: did route D grow steadily, year after year?
  const cardPos = P
    ? [[-1.75, -1.25], [1.75, -1.25], [-1.75, -3.15], [1.75, -3.15]]
    : [[-3.9, -0.95], [-1.3, -0.95], [1.3, -0.95], [3.9, -0.95]];
  const cardW = P ? 3.05 : 2.25, cardH = P ? 1.50 : 1.60;
  const cards = cardPos.map(([cx, cy], k) => {
    const r = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.16, color: C.grid, strokeWidth: 2 });
    r.setFill(C.card, 0.92); r.moveTo([cx, cy, 0]);
    const yr = T(`Year ${k + 1}`, P ? 18 : 19, C.muted, true, true);
    yr.moveTo([cx, cy + cardH / 2 - 0.32, 0]);
    return { g: new M.VGroup(r, yr), r, cx, cy };
  });
  const qMarks = cardPos.map(([cx, cy]) => {
    const q = T('?', P ? 32 : 34, C.amber, true, true);
    q.moveTo([cx, cy - 0.18, 0]);
    return q;
  });
  await until(S(1));
  await play(
    new M.LaggedStart(cards.map((c, k) => new M.FadeIn(new M.VGroup(c.g, qMarks[k]))), { lagRatio: 0.14, runTime: 1.2 }),
    ...say('DID IT GROW STEADILY?', C.amber)
  );

  // 2: Let's look at its riders per month, for its first four years.
  const ridersHead = T('riders per month', P ? 22 : 24, C.ink, false, true);
  ridersHead.moveTo([0, P ? 0.15 : 0.35, 0]);
  await until(S(2));
  await play(
    new M.FadeOut(new M.VGroup(bus, ...qMarks)),
    new M.FadeIn(ridersHead),
    ...say('RIDERS PER MONTH · 4 YEARS', C.cyan)
  );

  // 3-6: Four years of numbers (100, 1,000, 10,000, 100,000)
  const cardVals = [];
  for (let k = 0; k < 4; k++) {
    await until(S(3 + k));
    const col = k === 3 ? C.amber : C.cyan;
    cards[k].r.setColor(col);
    cards[k].r.setFill(C.card, 0.92);   // setColor fills the card solid: keep it dark so the number reads
    const [cx, cy] = cardPos[k];
    const vTxt = T(LABS[k], P ? 26 : 25, col, true, true);
    vTxt.moveTo([cx, cy - 0.18, 0]);
    cardVals.push(vTxt);
    await play(
      new M.FadeIn(vTxt, { runTime: 0.65 }),
      new M.Flash(vTxt, { color: col, flashRadius: 0.25, lineLength: 0.16, runTime: 0.6 }),
      ...say(`YEAR ${k + 1}: ${LABS[k]} RIDERS`, col)
    );
  }

  // 7: Let's place these as dots on an ordinary chart. Years go from left to right.
  pillPos = P ? [0, 1.85, 0] : [CX, 1.92, 0];
  const xAxis = new M.Line({ start: [AX, AY0, 0], end: [AX_R, AY0, 0], color: C.muted, strokeWidth: 3 });
  const xTicks = xs.map((x, k) => {
    const tk = new M.Line({ start: [x, AY0 - 0.08, 0], end: [x, AY0 + 0.08, 0], color: C.muted, strokeWidth: 2 });
    const lb = T(YRS[k], P ? 15 : 17, C.muted, true);
    lb.moveTo([x, AY0 - 0.35, 0]);
    return new M.VGroup(tk, lb);
  });
  const xTitle = T('years →', P ? 15 : 17, C.muted);
  xTitle.moveTo([(AX + AX_R) / 2, AY0 - (P ? 0.78 : 0.68), 0]);
  await until(S(7));
  await play(
    new M.FadeOut(new M.VGroup(ridersHead, ...cards.map(c => c.g), ...cardVals)),
    new M.Create(xAxis),
    new M.FadeIn(new M.VGroup(...xTicks, xTitle)),
    ...fbox([
      'Yr 1:     100',
      'Yr 2:   1,000',
      'Yr 3:  10,000',
      'Yr 4: 100,000'
    ], C.cyan),
    ...say('ORDINARY CHART · YEARS →', C.cyan)
  );

  // 8: The ruler on the side goes up. We call it the vertical axis.
  const yAxis = new M.Line({ start: [AX, AY0, 0], end: [AX, AY1, 0], color: C.ink, strokeWidth: 3 });
  const yTitle = T('riders', P ? 15 : 17, C.muted);
  yTitle.moveTo([AX - (P ? 0.25 : 0.42), AY1 + (P ? 0.38 : 0.34), 0]);
  const linTickVals = [0, 25000, 50000, 75000, 100000];
  const linTickStrs = ['0', '25,000', '50,000', '75,000', '100,000'];
  const linTicks = linTickVals.map((v, i) => {
    const y = yLin(v);
    const tk = new M.Line({ start: [AX - 0.09, y, 0], end: [AX + 0.09, y, 0], color: C.muted, strokeWidth: 2 });
    const grid = new M.Line({ start: [AX, y, -0.01], end: [AX_R, y, -0.01], color: C.grid, strokeWidth: 1 });
    grid.setStrokeOpacity(0.45);
    const lb = T(linTickStrs[i], P ? 15 : 16, C.muted, true);
    lb.moveTo([AX - 0.16 - lb.getWidth() / 2, y, 0]);
    return new M.VGroup(grid, tk, lb);
  });
  await until(S(8));
  await play(
    new M.Create(yAxis),
    new M.FadeIn(new M.VGroup(yTitle, ...linTicks)),
    ...say('VERTICAL AXIS = THE RULER', C.cyan)
  );

  // 9: On this ruler, each step up adds the same amount.
  const addSteps = [0, 1, 2, 3].map(k => {
    const y1 = yLin(linTickVals[k]) + 0.10, y2 = yLin(linTickVals[k + 1]) - 0.10;
    const arr = upArrow(AX + 0.24, y1, y2, C.amber, 2.3);
    const t = T('+25,000', P ? 15 : 16, C.amber, true, true);
    t.moveTo([AX + 0.38 + t.getWidth() / 2, (y1 + y2) / 2, 0]);
    return new M.VGroup(arr, t);
  });
  await until(S(9));
  await play(
    new M.LaggedStart(addSteps.map(s => new M.FadeIn(s)), { lagRatio: 0.18, runTime: 1.4 }),
    ...say('EACH STEP ADDS +25,000', C.amber)
  );

  // 10: The year-four dot sits near the top, at one hundred thousand.
  const linDots = VALS.map((v, k) =>
    makeDot([xs[k], yLin(v), 0], LABS[k], C.cyan, 0, k === 3 ? 0.0 : 0.36)
  );
  await until(S(10));
  await play(
    new M.FadeOut(new M.VGroup(...addSteps)),
    new M.FadeIn(linDots[3].g),
    new M.Flash(linDots[3].d, { color: C.cyan }),
    ...say('YEAR 4 AT THE TOP: 100,000', C.cyan)
  );

  // 11: The other three dots hug the floor. They almost touch the bottom.
  const linSegs = [0, 1, 2].map(k => new M.Line({
    start: [xs[k], yLin(VALS[k]), 0],
    end: [xs[k + 1], yLin(VALS[k + 1]), 0],
    color: C.cyan,
    strokeWidth: 2.5
  }));
  const floorBot = AY0 - 0.12, floorTop = yLin(10000) + 0.56;
  const floorBox = new M.RoundedRectangle({
    width: (xs[2] - xs[0]) + 0.96,
    height: floorTop - floorBot,
    cornerRadius: 0.14,
    color: C.pink,
    strokeWidth: 2.2
  });
  floorBox.moveTo([(xs[0] + xs[2]) / 2, (floorBot + floorTop) / 2, 0]);
  await until(S(11));
  await play(
    new M.LaggedStart([0, 1, 2].map(k => new M.FadeIn(linDots[k].g)), { lagRatio: 0.2, runTime: 1.1 }),
    new M.LaggedStart(linSegs.map(s => new M.Create(s)), { lagRatio: 0.15, runTime: 1.1 }),
    new M.Create(floorBox),
    ...say('YEARS 1–3 HUG THE FLOOR', C.pink)
  );

  // 12: From this picture, the first three years look like nothing happened.
  const flatNote = T('looks flat?', P ? 17 : 18, C.pink, true, true);
  flatNote.moveTo([(xs[0] + xs[2]) / 2, floorTop + 0.30, 0]);
  await until(S(12));
  await play(
    new M.Indicate(floorBox, { color: C.pink }),
    new M.FadeIn(flatNote),
    ...say('LOOKS LIKE NOTHING HAPPENED', C.pink)
  );

  // 13: But look at the numbers again. Each year, riders became ten times more.
  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(floorBox, flatNote)),
    new M.LaggedStart(linDots.map(o => new M.Indicate(o.g, { color: C.amber })), { lagRatio: 0.15, runTime: 1.3 }),
    ...fbox([
      ['Each year: 10× more', C.amber],
      '100 → 1,000 → 10,000',
      '    → 100,000'
    ], C.amber),
    ...say('EACH YEAR: 10 TIMES MORE', C.amber)
  );

  // 14: One hundred times ten is one thousand. One thousand times ten is ten thousand.
  await until(S(14));
  await play(
    new M.Indicate(linDots[0].g, { color: C.amber }),
    new M.Indicate(linDots[1].g, { color: C.amber }),
    ...fbox([['100 × 10 = 1,000', C.amber]], C.amber),
    ...say('100 × 10 = 1,000', C.amber)
  );
  await until(S(14) + 2.8);
  await play(
    new M.Indicate(linDots[1].g, { color: C.amber }),
    new M.Indicate(linDots[2].g, { color: C.amber }),
    ...fbox([
      '100 × 10 = 1,000',
      ['1,000 × 10 = 10,000', C.amber]
    ], C.amber),
    ...say('1,000 × 10 = 10,000', C.amber)
  );

  // 15: And ten thousand times ten is one hundred thousand.
  await until(S(15));
  await play(
    new M.Indicate(linDots[2].g, { color: C.amber }),
    new M.Indicate(linDots[3].g, { color: C.amber }),
    ...fbox([
      '100 × 10 = 1,000',
      '1,000 × 10 = 10,000',
      ['10,000 × 10 = 100,000', C.amber]
    ], C.amber),
    ...say('10,000 × 10 = 100,000', C.amber)
  );

  // 16: Notice a shortcut: times ten just adds one more zero to the end.
  await until(S(16));
  await play(
    ...fbox([
      ['100     (2 zeros)', C.cyan],
      ['1,000   (3 zeros)', C.cyan],
      ['10,000  (4 zeros)', C.cyan],
      ['100,000 (5 zeros)', C.amber]
    ], C.green),
    ...say('SHORTCUT: × 10 ADDS ONE ZERO', C.green)
  );

  // 17: So the growth was the same kind every year: times ten.
  await until(S(17));
  await play(
    new M.LaggedStart(linDots.map(o => new M.Indicate(o.g, { color: C.green })), { lagRatio: 0.14, runTime: 1.2 }),
    ...fbox([
      ['Same growth every year:', C.green],
      ['× 10  →  × 10  →  × 10', C.amber]
    ], C.green),
    ...say('SAME GROWTH EVERY YEAR: × 10', C.green)
  );

  // 18: Growing steadily can mean adding the same amount, or multiplying by the same number.
  await until(S(18));
  await play(
    ...fbox([
      ['Two steady growths:', C.muted],
      ['1) Adding same amount', C.cyan],
      ['2) Multiplying same ×', C.amber]
    ], C.violet),
    ...say('STEADY: ADDING OR MULTIPLYING', C.violet)
  );

  // 19: Route D multiplied by the same number. The ordinary ruler hides that.
  await until(S(19));
  await play(
    new M.Indicate(linDots[0].g, { color: C.pink }),
    new M.Indicate(linDots[1].g, { color: C.pink }),
    new M.Indicate(linDots[2].g, { color: C.pink }),
    ...fbox([
      ['Route D: × 10 each year', C.amber],
      ['Ordinary ruler: +25,000', C.pink],
      ['→ hides × 10 growth', C.pink]
    ], C.pink),
    ...say('ORDINARY RULER HIDES × 10', C.pink)
  );

  // 20: So let's change the ruler.
  await until(S(20));
  await play(
    new M.FadeOut(new M.VGroup(...linTicks, ...linSegs, ...linDots.map(o => o.g))),
    ...say('LET’S CHANGE THE RULER', C.green)
  );

  // 21: On our new ruler, each step up does not add. Each step up multiplies by ten.
  yAxis.setColor(C.green);
  const logGrids = [0, 1, 2, 3].map(k => {
    const y = yLog(k);
    const grid = new M.Line({ start: [AX, y, -0.01], end: [AX_R, y, -0.01], color: C.grid, strokeWidth: 1 });
    grid.setStrokeOpacity(0.45);
    const tk = new M.Line({ start: [AX - 0.10, y, 0], end: [AX + 0.10, y, 0], color: C.green, strokeWidth: 2.5 });
    return new M.VGroup(grid, tk);
  });
  await until(S(21));
  await play(
    new M.Indicate(yAxis, { color: C.green }),
    new M.LaggedStart(logGrids.map(g => new M.FadeIn(g)), { lagRatio: 0.14, runTime: 1.0 }),
    ...fbox([
      ['New ruler:', C.green],
      ['each step up = × 10', C.amber]
    ], C.green),
    ...say('NEW RULER: EACH STEP = × 10', C.green)
  );

  // 22-25: Build the 4 marks (100, 1,000, 10,000, 100,000) + ×10 arrows
  const logLabels = LABS.map((s, k) => {
    const t = T(s, P ? 15 : 16, C.ink, true, true);
    t.moveTo([AX - 0.18 - t.getWidth() / 2, yLog(k), 0]);
    return t;
  });
  const multTags = makeMultTags();

  // 22: The first mark is one hundred.
  await until(S(22));
  await play(
    new M.FadeIn(logLabels[0], { runTime: 0.7 }),
    new M.Flash(logLabels[0], { color: C.cyan, flashRadius: 0.2, lineLength: 0.14, runTime: 0.65 }),
    ...say('FIRST MARK: 100', C.cyan)
  );

  // 23: One step up is one thousand.
  await until(S(23));
  await play(
    new M.FadeIn(logLabels[1], { runTime: 0.7 }),
    new M.FadeIn(multTags[0], { runTime: 0.7 }),
    ...say('ONE STEP UP: 1,000 (× 10)', C.cyan)
  );

  // 24: The next step is ten thousand.
  await until(S(24));
  await play(
    new M.FadeIn(logLabels[2], { runTime: 0.7 }),
    new M.FadeIn(multTags[1], { runTime: 0.7 }),
    ...say('NEXT STEP: 10,000 (× 10)', C.cyan)
  );

  // 25: The next step is one hundred thousand.
  await until(S(25));
  await play(
    new M.FadeIn(logLabels[3], { runTime: 0.7 }),
    new M.FadeIn(multTags[2], { runTime: 0.7 }),
    ...say('NEXT STEP: 100,000 (× 10)', C.cyan)
  );

  // 26: Now let's place the four dots again.
  const logDots = LABS.map((s, k) =>
    makeDot([xs[k], yLog(k), 0], s, C.cyan, k === 0 ? 'R' : 0, 0.3)
  );
  await until(S(26));
  await play(
    new M.LaggedStart(logDots.map(o => new M.FadeIn(o.g)), { lagRatio: 0.18, runTime: 1.15 }),
    ...say('PLACE THE 4 DOTS AGAIN', C.cyan)
  );

  // 27: Each dot sits exactly one step above the one before.
  const stairs = [0, 1, 2].map(k => new M.VGroup(
    new M.DashedLine({ start: [xs[k], yLog(k), 0], end: [xs[k + 1], yLog(k), 0], color: C.amber }),
    upArrow(xs[k + 1], yLog(k), yLog(k + 1) - 0.14, C.amber, 2.5)
  ));
  await until(S(27));
  await play(
    new M.LaggedStart(stairs.map(st => new M.FadeIn(st)), { lagRatio: 0.25, runTime: 1.4 }),
    ...say('EACH DOT = 1 STEP HIGHER', C.amber)
  );

  // 28: The dots form a straight line, climbing in equal steps.
  const logLine = new M.Line({ start: [xs[0], yLog(0), 0], end: [xs[3], yLog(3), 0], color: C.green, strokeWidth: 3.5 });
  await until(S(28));
  await play(
    new M.Create(logLine, { runTime: 1.1 }),
    ...say('A STRAIGHT LINE · EQUAL STEPS', C.green)
  );

  // 29: Think of it as counting zeros. Each step up on this ruler is one more zero.
  await until(S(29));
  await play(
    new M.FadeOut(new M.VGroup(...stairs)),
    new M.LaggedStart(logLabels.map(l => new M.Indicate(l, { color: C.violet })), { lagRatio: 0.16, runTime: 1.3 }),
    ...fbox([
      ['100     → 2 zeros', C.cyan],
      ['1,000   → 3 zeros', C.cyan],
      ['10,000  → 4 zeros', C.cyan],
      ['100,000 → 5 zeros', C.amber]
    ], C.violet),
    ...say('COUNTING ZEROS: +1 ZERO / STEP', C.violet)
  );

  // 30: A ruler like this is called a logarithmic axis, or log axis for short.
  const logTitle = T('log axis', P ? 15 : 17, C.green, true, true);
  logTitle.moveTo([AX - (P ? 0.18 : 0.38), AY1 + (P ? 0.38 : 0.34), 0]);
  await until(S(30));
  await play(
    new M.FadeOut(yTitle),
    new M.FadeIn(logTitle),
    new M.Indicate(yAxis, { color: C.green }),
    ...fbox([
      ['Logarithmic axis', C.green],
      ['(log axis for short)', C.muted]
    ], C.green),
    ...say('LOGARITHMIC AXIS (LOG AXIS)', C.green)
  );

  // 31: Logarithm is a maths word for counting how many times you multiply by ten to reach a number.
  await until(S(31));
  await play(
    new M.LaggedStart(multTags.map(m => new M.Indicate(m, { color: C.violet })), { lagRatio: 0.2, runTime: 1.3 }),
    ...fbox([
      ['Logarithm =', C.violet],
      ['how many × 10 steps', C.ink],
      ['100 → 100,000: 3 steps', C.amber]
    ], C.violet),
    ...say('LOGARITHM = COUNT × 10 STEPS', C.violet)
  );

  // 32: That is all you need here.
  await until(S(32));
  await play(...say('THAT IS ALL YOU NEED', C.green));

  // 33: On a log axis, equal steps up mean equal multiplying, not equal adding.
  await until(S(33));
  await play(
    new M.Indicate(logLine, { color: C.amber }),
    ...fbox([
      ['Log axis:', C.green],
      ['equal steps = × same', C.amber],
      ['(not + same)', C.muted]
    ], C.green),
    ...say('EQUAL STEPS = EQUAL MULTIPLYING', C.amber)
  );

  // 34: Let's say the rule in one short line.
  await until(S(34));
  await play(...say('THE RULE IN ONE SHORT LINE', C.cyan));

  // 35: On this log axis, one step up equals times ten.
  await until(S(35));
  await play(
    new M.Indicate(multTags[1], { color: C.amber }),
    ...fbox([['1 step up  =  × 10', C.amber]], C.amber),
    ...say('1 STEP UP  =  × 10', C.amber)
  );

  // 36: In words: each mark is ten times the mark below it.
  await until(S(36));
  await play(
    new M.LaggedStart(logLabels.map(l => new M.Indicate(l, { color: C.cyan })), { lagRatio: 0.16, runTime: 1.2 }),
    ...fbox([
      ['1 step up  =  × 10', C.amber],
      ['each mark = 10 × below', C.ink]
    ], C.amber),
    ...say('EACH MARK = 10 × MARK BELOW', C.cyan)
  );

  // 37: On the screen, the steps read: one hundred, times ten, times ten, times ten.
  await until(S(37));
  await play(
    new M.LaggedStart([
      new M.Indicate(logLabels[0], { color: C.amber }),
      new M.Indicate(multTags[0], { color: C.amber }),
      new M.Indicate(multTags[1], { color: C.amber }),
      new M.Indicate(multTags[2], { color: C.amber })
    ], { lagRatio: 0.28, runTime: 2.0 }),
    ...fbox([
      ['100 → ×10 → ×10 → ×10', C.amber],
      ['each step multiplies ×10', C.muted]
    ], C.amber),
    ...say('100 → ×10 → ×10 → ×10', C.amber)
  );

  // 38: Some log axes use another number, like times two. The idea is the same.
  await until(S(38));
  await play(
    ...fbox([
      ['Another log axis (× 2):', C.violet],
      ['1  →  2  →  4  →  8', C.ink],
      ['   ×2    ×2    ×2', C.violet]
    ], C.violet),
    ...say('OTHER LOG AXES: e.g. × 2', C.violet)
  );

  // 39: This is what a log axis is for.
  await until(S(39));
  await play(
    ...fbox([['What a log axis is for:', C.green]], C.green),
    ...say('WHAT A LOG AXIS IS FOR', C.green)
  );

  // 40: It shows small and huge numbers on one chart, so none of them hug the floor.
  await until(S(40));
  await play(
    new M.Indicate(logDots[0].g, { color: C.amber }),
    new M.Indicate(logDots[3].g, { color: C.amber }),
    ...fbox([
      ['100 (small) & 100,000', C.cyan],
      ['both clear on one chart', C.green]
    ], C.green),
    ...say('SMALL & HUGE ON ONE CHART', C.green)
  );

  // 41: The number we multiply by each time is called the factor. Here, the factor is ten.
  await until(S(41));
  await play(
    new M.LaggedStart(multTags.map(m => new M.Indicate(m, { color: C.amber })), { lagRatio: 0.16, runTime: 1.2 }),
    ...fbox([
      ['factor = number we × by', C.amber],
      ['here: factor = 10', C.green]
    ], C.amber),
    ...say('FACTOR = 10', C.amber)
  );

  // 42: A log axis answers: is something growing by the same factor each time?
  await until(S(42));
  await play(
    ...fbox([
      ['Question it answers:', C.muted],
      ['Same factor each step?', C.cyan]
    ], C.cyan),
    ...say('SAME FACTOR EACH TIME?', C.cyan)
  );

  // 43: A straight line on a log axis means steady multiplying growth.
  await until(S(43));
  await play(
    new M.Indicate(logLine, { color: C.green }),
    ...fbox([
      ['Straight line on log axis', C.green],
      ['= steady × growth', C.amber]
    ], C.green),
    ...say('STRAIGHT LINE = STEADY × GROWTH', C.green)
  );

  // 44: Here is a common trap. On a log axis, gaps that look equal are not equal amounts.
  await until(S(44));
  await play(
    new M.FadeOut(new M.VGroup(...multTags)),
    ...fbox([
      ['COMMON TRAP', C.pink],
      ['equal-looking gaps ≠', C.ink],
      ['equal added amounts!', C.pink]
    ], C.pink),
    ...say('TRAP: EQUAL GAPS ≠ EQUAL +', C.pink)
  );

  // 45: The step from one hundred to one thousand adds nine hundred riders.
  const brLow = bracket(AX + 0.26, yLog(0), yLog(1), C.pink, 2.8);
  const lblLow = T('+900', P ? 16 : 17, C.pink, true, true);
  lblLow.moveTo([AX + 0.38 + lblLow.getWidth() / 2, (yLog(0) + yLog(1)) / 2, 0]);
  const gapLow = new M.VGroup(brLow, lblLow);
  await until(S(45));
  await play(
    new M.FadeIn(gapLow),
    ...fbox([
      ['100 → 1,000:', C.ink],
      ['  adds +900 riders', C.pink]
    ], C.pink),
    ...say('100 → 1,000 ADDS +900', C.pink)
  );

  // 46: The same-looking step from ten thousand to one hundred thousand adds ninety thousand.
  const brHigh = bracket(AX + 0.26, yLog(2), yLog(3), C.amber, 2.8);
  const lblHigh = T('+90,000', P ? 16 : 17, C.amber, true, true);
  lblHigh.moveTo([AX + 0.38 + lblHigh.getWidth() / 2, (yLog(2) + yLog(3)) / 2, 0]);
  const gapHigh = new M.VGroup(brHigh, lblHigh);
  await until(S(46));
  await play(
    new M.FadeIn(gapHigh),
    ...fbox([
      ['100 → 1,000:      +900', C.pink],
      ['10,000 → 100,000: +90,000', C.amber],
      ['same height, 100× more!', C.pink]
    ], C.pink),
    ...say('10,000 → 100,000 ADDS +90,000', C.amber)
  );

  // 47: So always check the axis labels. If they jump by times ten, read steps as multiplying.
  const lblBoxW = P ? 1.35 : 1.55;
  const lblBoxH = (yLog(3) - yLog(0)) + 0.65;
  const lblBox = new M.RoundedRectangle({
    width: lblBoxW,
    height: lblBoxH,
    cornerRadius: 0.14,
    color: C.cyan,
    strokeWidth: 2.2
  });
  lblBox.moveTo([AX - 0.16 - lblBoxW / 2, (yLog(0) + yLog(3)) / 2, 0]);
  const multTags2 = makeMultTags();
  await until(S(47));
  await play(
    new M.FadeOut(new M.VGroup(gapLow, gapHigh)),
    new M.Create(lblBox),
    new M.LaggedStart(multTags2.map(m => new M.FadeIn(m)), { lagRatio: 0.14, runTime: 1.0 }),
    ...fbox([
      ['Always check axis labels:', C.cyan],
      ['× 10 labels → read as ×', C.green]
    ], C.cyan),
    ...say('CHECK AXIS LABELS FIRST', C.cyan)
  );

  // 48: In one sentence: on a log axis, each equal step up means the number was multiplied by the same factor.
  await until(S(48));
  await play(
    new M.FadeOut(lblBox),
    new M.Indicate(logLine, { color: C.green }),
    ...fbox([
      ['Log axis:', C.green],
      ['each equal step up =', C.ink],
      ['× by the same factor', C.amber]
    ], C.green),
    ...say('EQUAL STEP UP = × SAME FACTOR', C.green)
  );
}
