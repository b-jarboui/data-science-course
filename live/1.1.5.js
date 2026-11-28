// lesson 1.1.5
// Discrete and continuous values.
// Beat i starts at sentence i in the narration. Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, until, play, T, pill, showA } = L;

  const WAITS = [120, 90, 150, 60, 180, 60];
  const CX = 0;
  const PILL = P ? [0, 3.82, 0] : [0, 1.92, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const pt = (x, y) => [x, y, 0];

  const line = (x1, y1, x2, y2, color = C.muted, strokeWidth = 2) =>
    new M.Line({
      start: pt(x1, y1),
      end: pt(x2, y2),
      color,
      strokeWidth,
    });

  const textAt = (s, x, y, size = 18, color = C.ink, bold = true) => {
    const t = T(s, size, color, bold);
    t.moveTo(pt(x, y));
    return t;
  };

  const dotAt = (x, y, color, radius = 0.1) =>
    new M.Dot({ point: pt(x, y), radius, color });

  // ---------- Formula box ----------
  let boxNow = null;

  function fbox(lines, color = C.cyan, cy = P ? -2.55 : -0.62) {
    const size = P ? 20 : 21;
    const lh = P ? 0.38 : 0.4;
    const rows = lines.map(v => Array.isArray(v) ? v : [v, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));

    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (rows[i][0].length - rows[i][0].trimStart().length)
    );

    const wd = Math.max(...widths) + 0.72;
    const ht = rows.length * lh + 0.42;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2,
    });

    r.setFill(C.card, 0.95);
    r.moveTo(pt(0, cy));

    const left = -wd / 2 + 0.36;
    const top = cy + ht / 2 - 0.22 - lh / 2;

    texts.forEach((t, i) => {
      const indent =
        cw * (rows[i][0].length - rows[i][0].trimStart().length);

      t.moveTo(pt(left + indent + t.getWidth() / 2, top - i * lh));
    });

    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.0 : 5.4;

    if (wd > maxw) g.scale(maxw / wd);

    const animations = [new M.FadeIn(g)];

    if (boxNow) animations.push(new M.FadeOut(boxNow));

    boxNow = g;
    return animations;
  }

  // ---------- Café cup ----------
  function cup(x, y) {
    const body = new M.RoundedRectangle({
      width: 0.48,
      height: 0.62,
      cornerRadius: 0.08,
      color: C.cyan,
      strokeWidth: 2,
    });

    body.setFill(C.cyan, 0.2);
    body.moveTo(pt(x, y));

    const handle = new M.Arc({
      radius: 0.14,
      startAngle: -Math.PI / 2,
      angle: Math.PI,
      color: C.cyan,
      strokeWidth: 2,
    });

    handle.moveTo(pt(x + 0.31, y));

    return new M.VGroup(body, handle);
  }

  function rowBox(y, width, color) {
    const r = new M.RoundedRectangle({
      width,
      height: P ? 0.48 : 0.38,
      cornerRadius: 0.08,
      color,
      strokeWidth: 2.5,
    });

    r.moveTo(pt(0, y));
    return r;
  }

  // ==========================================================
  // 0-3: THE CAFÉ NOTEBOOK AND TWO QUESTIONS
  // ==========================================================

  const rows = [
    ['ORDER', 'DRINK', 'WAIT (S)'],
    ['1', 'coffee', '120'],
    ['2', 'tea', '90'],
    ['3', 'coffee', '150'],
    ['4', 'juice', '60'],
    ['5', 'coffee', '180'],
    ['6', 'tea', '60'],
  ];

  const colW = P ? [1.2, 2.4, 1.9] : [1.4, 2.4, 2.0];
  const rowH = P ? 0.92 : 0.48;
  const tableW = colW.reduce((a, b) => a + b, 0) + 0.34;
  const tableTop = P ? 2.9 : 1.5;
  const tableBottom = tableTop - rows.length * rowH;
  const tableMidY = (tableTop + tableBottom) / 2;
  const xLeft = -tableW / 2;

  const tableTexts = [];
  const cellRefs = [];

  const card = new M.RoundedRectangle({
    width: tableW,
    height: rows.length * rowH + 0.18,
    cornerRadius: 0.16,
    color: C.cyan,
    strokeWidth: 2,
  });

  card.setFill(C.card, 0.96);
  card.moveTo(pt(0, tableMidY));

  const headerBand = new M.Rectangle({
    width: tableW - 0.12,
    height: rowH - 0.03,
    color: C.cyan,
    strokeWidth: 0,
  });

  headerBand.setFill(C.cyan, 0.16);
  headerBand.moveTo(pt(0, tableTop - rowH / 2));

  for (let r = 0; r < rows.length; r++) {
    let x = xLeft;

    for (let c = 0; c < 3; c++) {
      const fs = P
        ? (r === 0 ? 19 : 24)
        : (r === 0 ? 18 : 21);

      const color = r === 0
        ? C.cyan
        : (c === 2 ? C.amber : C.ink);

      const t = T(rows[r][c], fs, color, r === 0 || c !== 1);

      t.moveTo(pt(x + colW[c] / 2, tableTop - (r + 0.5) * rowH));

      tableTexts.push(t);
      cellRefs.push({ r, c, t });

      x += colW[c];
    }
  }

  const tableRules = [];

  for (let r = 1; r < rows.length; r++) {
    tableRules.push(
      line(
        -tableW / 2 + 0.12,
        tableTop - r * rowH,
        tableW / 2 - 0.12,
        tableTop - r * rowH,
        C.grid,
        1
      )
    );
  }

  const table = new M.VGroup(
    card,
    headerBand,
    ...tableRules,
    ...tableTexts
  );

  const rowsBox = new M.RoundedRectangle({
    width: tableW - 0.12,
    height: 6 * rowH - 0.04,
    cornerRadius: 0.1,
    color: C.violet,
    strokeWidth: 2.5,
  });

  rowsBox.moveTo(pt(0, tableTop - rowH - 3 * rowH));

  const drinkX = xLeft + colW[0] + colW[1] / 2;
  const waitColCenter = xLeft + colW[0] + colW[1] + colW[2] / 2;

  const drinkCol = new M.RoundedRectangle({
    width: colW[1] - 0.08,
    height: 7 * rowH - 0.06,
    cornerRadius: 0.08,
    color: C.cyan,
    strokeWidth: 2.5,
  });

  drinkCol.moveTo(pt(drinkX, tableMidY));

  const waitCol = new M.RoundedRectangle({
    width: colW[2] - 0.08,
    height: 7 * rowH - 0.06,
    cornerRadius: 0.08,
    color: C.amber,
    strokeWidth: 2.5,
  });

  waitCol.moveTo(pt(waitColCenter, tableMidY));

  // 0. The notebook.
  await until(S(0));

  await play(
    new M.FadeIn(table),
    ...say("THE CAFE NOTEBOOK - 8 TO 9 O'CLOCK")
  );

  // 1. Six orders.
  await until(S(1));

  await play(
    new M.Create(rowsBox),
    ...say("6 ORDERS = 6 DRINKS", C.violet)
  );

  // 2. How many drinks?
  await until(S(2));

  await play(
    new M.FadeOut(rowsBox),
    new M.Create(drinkCol),
    ...say("HOW MANY DRINKS?", C.cyan)
  );

  // 3. How long a wait?
  await until(S(3));

  await play(
    new M.FadeOut(drinkCol),
    new M.Create(waitCol),
    ...say("HOW LONG A WAIT?", C.amber)
  );

  await play(
    new M.Indicate(waitCol, { color: C.amber }),
    ...say("TWO KINDS OF NUMBER", C.violet)
  );

  // ==========================================================
  // 4-8: DRINKS ARE COUNTED IN WHOLE STEPS
  // ==========================================================

  const cupY = P ? 2.2 : 0.85;
  const cupGap = P ? 1.05 : 1.08;

  const cups = Array.from({ length: 6 }, (_, k) =>
    cup((k - 2.5) * cupGap, cupY)
  );

  const tallyBox = new M.RoundedRectangle({
    width: 2.15,
    height: 0.92,
    cornerRadius: 0.14,
    color: C.cyan,
    strokeWidth: 2,
  });

  tallyBox.setFill(C.card, 0.95);
  tallyBox.moveTo(pt(0, P ? -0.3 : -0.45));

  const tallyLabel = textAt(
    'TALLY',
    0,
    P ? 0.4 : 0.27,
    16,
    C.muted
  );

  let num = textAt(
    '0',
    0,
    P ? -0.3 : -0.45,
    38,
    C.cyan
  );

  const trackW = P ? FW - 1.25 : 7.2;
  const trackX0 = -trackW / 2;
  const trackY = P ? -3.4 : -1.85;
  const trackX = v => trackX0 + (v / 6) * trackW;

  const track = line(
    trackX0,
    trackY,
    trackX0 + trackW,
    trackY,
    C.muted,
    3
  );

  const trackTicks = [];
  const trackNums = [];

  for (let v = 0; v <= 6; v++) {
    trackTicks.push(
      line(
        trackX(v),
        trackY - 0.08,
        trackX(v),
        trackY + 0.08,
        C.muted,
        2
      )
    );

    trackNums.push(
      textAt(String(v), trackX(v), trackY - 0.4, P ? 20 : 17, C.muted)
    );
  }

  let hop = dotAt(trackX(0), trackY + 0.22, C.cyan, 0.1);

  const wholeDots = [1, 2, 3].map(v =>
    dotAt(trackX(v), trackY + 0.22, C.cyan, 0.08)
  );

  const halfwayDot = dotAt(
    trackX(2.5),
    trackY + 0.22,
    C.amber,
    0.11
  );

  const halfwayLabel = textAt(
    '2.5',
    trackX(2.5),
    trackY + 0.62,
    19,
    C.amber
  );

  const xMid = trackX(2.5);

  const cross1 = line(
    xMid - 0.17,
    trackY + 0.04,
    xMid + 0.17,
    trackY + 0.4,
    C.pink,
    4
  );

  const cross2 = line(
    xMid - 0.17,
    trackY + 0.4,
    xMid + 0.17,
    trackY + 0.04,
    C.pink,
    4
  );

  const crossMark = textAt('×', xMid, trackY + 0.22, 52, C.pink);

  // 4. Start counting drinks.
  await until(S(4));

  await play(
    new M.FadeOut(new M.VGroup(table, waitCol)),
    new M.FadeIn(tallyBox),
    new M.FadeIn(tallyLabel),
    new M.FadeIn(num),
    new M.Create(track),
    new M.FadeIn(new M.VGroup(...trackTicks, ...trackNums)),
    ...say("DRINKS: KEEP A TALLY", C.cyan)
  );

  // 5. Count one through six, revealing each cup as it is counted.
  await until(S(5));

  const d5 = (E(5) - S(5)) / 6;

  for (let k = 0; k < 6; k++) {
    await until(S(5) + k * d5);

    const nextNum = textAt(
      String(k + 1),
      0,
      P ? -0.3 : -0.45,
      38,
      C.cyan
    );

    const nextHop = dotAt(
      trackX(k + 1),
      trackY + 0.22,
      C.cyan,
      0.1
    );

    // hop itself moves; reassigning it would leave a dot behind at each step.
    await play(
      new M.FadeIn(cups[k]),
      new M.Transform(num, nextNum),
      new M.Transform(hop, nextHop),
    );
  }

  // 6. Whole-number steps.
  await until(S(6));

  await play(
    new M.FadeIn(new M.VGroup(...wholeDots)),
    ...say("WHOLE STEPS: 1 -> 2 -> 3", C.cyan),
    new M.LaggedStart(
      wholeDots.map(d =>
        new M.Indicate(d, { color: C.cyan })
      ),
      { lagRatio: 0.25, runTime: 1.2 }
    )
  );

  // 7. Can we have 2.5 drinks?
  await until(S(7));

  await play(
    new M.FadeIn(halfwayDot),
    new M.FadeIn(halfwayLabel),
    ...say("HALFWAY? 2.5 DRINKS", C.amber)
  );

  // 8. No half cup in a count.
  await until(S(8));

  await play(
    new M.FadeIn(crossMark),
    ...say("NOTHING BETWEEN 2 AND 3", C.pink)
  );

  // ==========================================================
  // 9-16: WAITS ARE DOTS ON A CONTINUOUS LINE
  // ==========================================================

  const drinksScene = () => new M.VGroup(
    ...cups,
    tallyBox,
    tallyLabel,
    num,
    track,
    ...trackTicks,
    ...trackNums,
    hop,
    ...wholeDots,
    halfwayDot,
    halfwayLabel,
    crossMark
  );

  const axisW = P ? FW - 1.25 : 8.8;
  const axisX0 = -axisW / 2;
  const axisY = P ? -2.8 : -1.2;

  const waitX = v => axisX0 + (v / 210) * axisW;

  const waitAxis = line(
    axisX0,
    axisY,
    axisX0 + axisW,
    axisY,
    C.muted,
    3
  );

  const waitTicks = [];

  for (let v = 0; v <= 210; v += 30) {
    waitTicks.push(
      line(
        waitX(v),
        axisY - 0.09,
        waitX(v),
        axisY + 0.09,
        C.muted,
        2
      )
    );

    waitTicks.push(
      textAt(String(v), waitX(v), axisY - 0.38, P ? 16 : 16, C.muted)
    );
  }

  const waitUnit = textAt(
    'seconds',
    axisX0 + axisW - 0.45,
    axisY - 0.78,
    16,
    C.muted
  );

  const waitDots = [];

  for (let k = 0; k < WAITS.length; k++) {
    const v = WAITS[k];
    const up = WAITS.slice(0, k).filter(w => w === v).length * 0.42;

    const x = waitX(v);
    const y = axisY + 0.38 + up;

    const halo = dotAt(x, y, C.amber, 0.27);
    halo.setFill(C.amber, 0.18);

    const d = dotAt(x, y, C.amber, 0.12);
    const lab = textAt(
      String(v),
      x,
      y + 0.42,
      P ? 15 : 17,
      C.amber
    );

    waitDots.push(new M.VGroup(halo, d, lab));
  }

  // the six waits from the notebook, as chips; each lights up when its dot is placed
  const chipPos = k => P
    ? pt(((k % 3) - 1) * 2.3, k < 3 ? 1.7 : 0.6)
    : pt((k - 2.5) * 1.55, 1.05);
  const waitChipsOff = WAITS.map((v, k) => {
    const p = pill(`${v} s`, C.muted, P ? 22 : 20);
    p.moveTo(chipPos(k));
    return p;
  });
  const waitChipsOn = WAITS.map((v, k) => {
    const p = pill(`${v} s`, C.amber, P ? 22 : 20);
    p.moveTo(chipPos(k));
    return p;
  });

  // 9. Introduce the waits.
  await until(S(9));

  await play(
    new M.FadeOut(drinksScene()),
    new M.LaggedStart(waitChipsOff.map(p => new M.FadeIn(p)), { lagRatio: 0.12, runTime: 1.0 }),
    ...say("WAITS, IN SECONDS", C.amber)
  );
  await play(
    new M.Create(waitAxis),
    new M.FadeIn(new M.VGroup(...waitTicks, waitUnit))
  );

  // 10. Place waits on the line.
  await until(S(10));

  await play(
    new M.Indicate(waitAxis, { color: C.amber }),
    ...say("PLACE EACH WAIT ON THE LINE", C.amber)
  );

  // 11-16. Show the six waits from the café notebook.
  for (let k = 0; k < WAITS.length; k++) {
    await until(S(11 + k));

    const v = WAITS[k];
    const d = waitDots[k].submobjects[1];

    await play(
      new M.FadeIn(waitDots[k]),
      new M.FadeOut(waitChipsOff[k]),
      new M.FadeIn(waitChipsOn[k]),
      ...say(`ORDER ${k + 1}: ${v} SECONDS`, C.amber)
    );
  }

  // ==========================================================
  // 17-20: ZOOM BETWEEN 90 AND 91 SECONDS
  // ==========================================================

  const waitsScene = () => new M.VGroup(
    waitAxis,
    ...waitTicks,
    waitUnit,
    ...waitDots,
    ...waitChipsOn
  );

  const zoomW = P ? FW - 1.6 : 6.8;
  const zoomX0 = -zoomW / 2;
  const zoomY = P ? -3.0 : -1.7;

  const zx = v => zoomX0 + (v - 90) * zoomW;

  const zoomAxis = line(
    zoomX0,
    zoomY,
    zoomX0 + zoomW,
    zoomY,
    C.amber,
    3
  );

  const zoomTicks = [];

  [90, 90.25, 90.5, 90.75, 91].forEach(v => {
    zoomTicks.push(
      line(
        zx(v),
        zoomY - 0.1,
        zx(v),
        zoomY + 0.1,
        C.amber,
        2
      )
    );
  });

  const zoomEnds = new M.VGroup(
    textAt('90', zx(90), zoomY - 0.42, 18, C.amber),
    textAt('91', zx(91), zoomY - 0.42, 18, C.amber)
  );

  const d905 = dotAt(zx(90.5), zoomY + 0.25, C.green, 0.11);
  const l905 = textAt('90.5', zx(90.5), zoomY + 0.68, 18, C.green);

  const d9025 = dotAt(zx(90.25), zoomY + 0.25, C.green, 0.1);
  const l9025 = textAt('90.25', zx(90.25), zoomY + 0.68, 17, C.green);

  const moreBetween = [];

  for (let k = 1; k < 16; k++) {
    if (k === 4 || k === 8 || k === 12) continue;

    moreBetween.push(
      dotAt(zx(90 + k / 16), zoomY + 0.25, C.green, 0.045)
    );
  }

  const slider = dotAt(zx(90), zoomY + 0.25, C.ink, 0.09);

  // 17. Zoom in.
  await until(S(17));

  await play(
    new M.FadeOut(waitsScene()),
    new M.Create(zoomAxis),
    new M.FadeIn(new M.VGroup(...zoomTicks)),
    new M.FadeIn(zoomEnds),
    ...say("ZOOM IN: 90 TO 91 SECONDS", C.amber)
  );

  // 18. Ninety and a half seconds.
  await until(S(18));

  await play(
    new M.FadeIn(d905),
    new M.FadeIn(l905),
    ...say("90.5 SECONDS? YES", C.green)
  );

  // 19. Ninety and a quarter seconds.
  await until(S(19));

  await play(
    new M.FadeIn(d9025),
    new M.FadeIn(l9025),
    ...say("ZOOM AGAIN: 90.25 FITS TOO", C.green)
  );

  // 20. More values fit between the endpoints.
  await until(S(20));

  await play(
    new M.FadeIn(new M.VGroup(...moreBetween)),
    new M.FadeIn(slider),
    ...say("NO BREAKS: A WAIT CAN END ANYWHERE", C.amber)
  );

  await play(
    new M.Transform(
      slider,
      dotAt(zx(91), zoomY + 0.25, C.ink, 0.09)
    )
  );

  // ==========================================================
  // 21-23: STAIRCASE VERSUS RAMP
  // ==========================================================

  const stairs = [];
  const stairBase = P ? 1.2 : -1.6;
  const stairX0 = P ? -2.6 : -5.45;
  const stepW = P ? 1.04 : 0.72;
  const stepH = P ? 0.42 : 0.38;

  const stairPoints = [pt(stairX0, stairBase)];

  for (let k = 0; k < 5; k++) {
    stairPoints.push(
      pt(stairX0 + k * stepW, stairBase + (k + 1) * stepH)
    );

    stairPoints.push(
      pt(stairX0 + (k + 1) * stepW, stairBase + (k + 1) * stepH)
    );
  }

  for (let k = 1; k < stairPoints.length; k++) {
    stairs.push(
      new M.Line({
        start: stairPoints[k - 1],
        end: stairPoints[k],
        color: C.cyan,
        strokeWidth: 4,
      })
    );
  }

  const stairClimber = dotAt(
    stairX0,
    stairBase + 0.12,
    C.ink,
    0.09
  );

  const rampX0 = P ? -2.7 : 1.85;
  const rampBase = P ? -4.2 : -1.6;
  const rampW = P ? 5.4 : 3.6;
  const rampH = P ? 2.4 : 1.85;

  const rampLine = line(
    rampX0,
    rampBase,
    rampX0 + rampW,
    rampBase + rampH,
    C.amber,
    4
  );

  const rampFloor = line(
    rampX0,
    rampBase,
    rampX0 + rampW,
    rampBase,
    C.muted,
    1.5
  );

  const rampWalker = dotAt(
    rampX0 + 0.25,
    rampBase + 0.12,
    C.ink,
    0.09
  );

  const STAIR_LAB = P ? pt(0, 0.6) : pt(-3.65, -2.4);
  const RAMP_LAB = P ? pt(0, -5.0) : pt(3.65, -2.4);

  const stairLabel = pill('DRINKS', C.cyan, 17);
  stairLabel.moveTo(STAIR_LAB);

  const rampLabel = pill('WAIT', C.amber, 17);
  rampLabel.moveTo(RAMP_LAB);

  // 21. Staircase.
  await until(S(21));

  await play(
    new M.FadeOut(new M.VGroup(
      zoomAxis,
      ...zoomTicks,
      zoomEnds,
      d905,
      l905,
      d9025,
      l9025,
      ...moreBetween,
      slider
    )),
    new M.LaggedStart(
      stairs.map(s => new M.Create(s)),
      { lagRatio: 0.12, runTime: 1.3 }
    ),
    new M.FadeIn(stairClimber),
    ...say("A STAIRCASE: HEIGHT JUMPS STEP BY STEP", C.cyan)
  );

  // 22. Ramp.
  await until(S(22));

  await play(
    new M.Create(rampLine),
    new M.Create(rampFloor),
    new M.FadeIn(rampWalker),
    ...say("A RAMP: HEIGHT CAN BE ANY AMOUNT", C.amber)
  );

  // 23. Link the pictures to the café.
  await until(S(23));

  await play(
    new M.FadeIn(stairLabel),
    new M.FadeIn(rampLabel),
    ...say("DRINKS = STAIRCASE; WAIT = RAMP", C.violet)
  );

  // ==========================================================
  // 24-28: NAME THE TWO KINDS OF VALUES
  // ==========================================================

  // The staircase and ramp stay on screen while they are named (as in the video);
  // only their labels change.
  let stairTag = stairLabel;
  let rampTag = rampLabel;

  const swapTag = (old, s, color, where) => {
    const p = pill(s, color, 17);
    p.moveTo(where);
    return [p, [new M.FadeOut(old), new M.FadeIn(p)]];
  };

  // 24. A value.
  await until(S(24));

  await play(
    ...fbox([
      ['value = one number written down', C.ink],
      ['like one wait: 90 seconds', C.amber],
    ], C.violet, P ? -0.9 : 1.0),
    ...say("NOW THE NAMES", C.violet)
  );

  // 25. Discrete.
  await until(S(25));

  let swap = swapTag(stairTag, 'DISCRETE', C.cyan, STAIR_LAB);
  stairTag = swap[0];

  await play(
    new M.FadeOut(boxNow),
    ...swap[1],
    ...say("SEPARATE STEPS -> DISCRETE", C.cyan)
  );

  boxNow = null;

  // 26. Discrete means separate.
  await until(S(26));

  swap = swapTag(stairTag, 'DISCRETE = SEPARATE', C.cyan, STAIR_LAB);
  stairTag = swap[0];

  await play(
    ...swap[1],
    ...say("DISCRETE MEANS SEPARATE", C.cyan)
  );

  // 27. Continuous.
  await until(S(27));

  swap = swapTag(rampTag, 'CONTINUOUS', C.amber, RAMP_LAB);
  rampTag = swap[0];

  await play(
    ...swap[1],
    ...say("ANY AMOUNT, NO GAPS -> CONTINUOUS", C.amber)
  );

  // 28. Continuous means unbroken.
  await until(S(28));

  swap = swapTag(rampTag, 'CONTINUOUS = UNBROKEN', C.amber, RAMP_LAB);
  rampTag = swap[0];

  await play(
    ...swap[1],
    ...say("CONTINUOUS MEANS UNBROKEN", C.amber)
  );

  const shapeScene = () => new M.VGroup(
    ...stairs,
    stairClimber,
    rampLine,
    rampFloor,
    rampWalker,
    stairTag,
    rampTag
  );

  // ==========================================================
  // 29-35: THE TEST - CAN ANOTHER AMOUNT FIT BETWEEN?
  // ==========================================================

  const testDrinkY = P ? 1.35 : -0.45;
  const testWaitY = P ? -2.65 : -0.45;

  const testDrinkX0 = P ? -3.0 : -5.85;
  const testWaitX0 = P ? -3.0 : 0.55;

  const testLen = P ? FW - 1.5 : 5.3;

  const dx = v => testDrinkX0 + (v / 5) * testLen;
  const wx = v => testWaitX0 + (v - 90) * testLen;

  const drinkTestLine = line(
    testDrinkX0,
    testDrinkY,
    testDrinkX0 + testLen,
    testDrinkY,
    C.muted,
    3
  );

  const drinkTestTicks = [];

  for (let v = 0; v <= 5; v++) {
    drinkTestTicks.push(
      line(
        dx(v),
        testDrinkY - 0.08,
        dx(v),
        testDrinkY + 0.08,
        C.muted,
        2
      )
    );

    drinkTestTicks.push(
      textAt(String(v), dx(v), testDrinkY - 0.36, 16, C.muted)
    );
  }

  const drinkTitle = textAt(
    'DRINKS',
    testDrinkX0 + 0.45,
    testDrinkY + 0.55,
    18,
    C.cyan
  );

  const waitTestLine = line(
    testWaitX0,
    testWaitY,
    testWaitX0 + testLen,
    testWaitY,
    C.muted,
    3
  );

  const waitTestTicks = [];

  [90, 90.5, 91].forEach(v => {
    waitTestTicks.push(
      line(
        wx(v),
        testWaitY - 0.08,
        wx(v),
        testWaitY + 0.08,
        C.muted,
        2
      )
    );
  });

  const waitTestLabels = new M.VGroup(
    textAt('90', wx(90), testWaitY - 0.36, 16, C.muted),
    textAt('91', wx(91), testWaitY - 0.36, 16, C.muted)
  );

  const waitTitle = textAt(
    'WAIT (SECONDS)',
    testWaitX0 + 0.75,
    testWaitY + 0.55,
    18,
    C.amber
  );

  const d2 = dotAt(dx(2), testDrinkY + 0.18, C.cyan, 0.11);
  const d3 = dotAt(dx(3), testDrinkY + 0.18, C.cyan, 0.11);

  const gapLine = line(
    dx(2) + 0.12,
    testDrinkY + 0.52,
    dx(3) - 0.12,
    testDrinkY + 0.52,
    C.pink,
    3
  );

  const gapEnd1 = line(
    dx(2) + 0.12,
    testDrinkY + 0.4,
    dx(2) + 0.12,
    testDrinkY + 0.64,
    C.pink,
    2
  );

  const gapEnd2 = line(
    dx(3) - 0.12,
    testDrinkY + 0.4,
    dx(3) - 0.12,
    testDrinkY + 0.64,
    C.pink,
    2
  );

  const nothingLabel = textAt(
    'nothing fits',
    (dx(2) + dx(3)) / 2,
    testDrinkY + 0.88,
    16,
    C.pink
  );

  const w90 = dotAt(wx(90), testWaitY + 0.18, C.amber, 0.1);
  const w91 = dotAt(wx(91), testWaitY + 0.18, C.amber, 0.1);

  const betweenWaitDots = [];

  for (let k = 1; k < 12; k++) {
    betweenWaitDots.push(
      dotAt(wx(90 + k / 12), testWaitY + 0.18, C.amber, 0.07)
    );
  }

  const discreteTag = pill('DISCRETE', C.cyan, 17);
  discreteTag.moveTo(P ? pt(0, 0.45) : pt(-3.2, -1.25));

  const continuousTag = pill('CONTINUOUS', C.amber, 17);
  continuousTag.moveTo(P ? pt(0, -3.65) : pt(3.2, -1.25));

  // 29. Introduce the test.
  await until(S(29));

  await play(
    new M.FadeOut(shapeScene()),
    new M.Create(drinkTestLine),
    new M.FadeIn(new M.VGroup(...drinkTestTicks, drinkTitle)),
    new M.Create(waitTestLine),
    new M.FadeIn(new M.VGroup(
      ...waitTestTicks,
      waitTestLabels,
      waitTitle
    )),
    ...say("TEST: PICK TWO VALUES, AS CLOSE AS YOU CAN", C.violet)
  );

  boxNow = null;

  // 30. Ask the question.
  await until(S(30));

  await play(
    ...say("CAN ANOTHER AMOUNT FIT BETWEEN THEM?", C.violet)
  );

  // 31. Drinks: two and three.
  await until(S(31));

  await play(
    new M.FadeIn(d2),
    new M.FadeIn(d3),
    new M.Create(gapLine),
    new M.Create(gapEnd1),
    new M.Create(gapEnd2),
    new M.FadeIn(nothingLabel),
    ...say("DRINKS: 2 AND 3", C.cyan)
  );

  // 32. Drinks are discrete.
  await until(S(32));

  await play(
    new M.FadeIn(discreteTag),
    ...say("DRINKS ARE DISCRETE", C.cyan)
  );

  // 33. Waits: many values fit between.
  await until(S(33));

  await play(
    new M.FadeIn(w90),
    new M.FadeIn(w91),
    new M.LaggedStart(
      betweenWaitDots.map(d => new M.FadeIn(d)),
      { lagRatio: 0.05, runTime: 0.9 }
    ),
    ...say("WAITS: ANOTHER AMOUNT ALWAYS FITS", C.amber)
  );

  // 34. A wait is continuous.
  await until(S(34));

  await play(
    new M.FadeIn(continuousTag),
    ...say("A WAIT IS CONTINUOUS", C.amber)
  );

  // 35. The handy guide.
  await until(S(35));

  await play(
    ...say("COUNTING -> DISCRETE; MEASURING -> CONTINUOUS", C.violet),
    new M.Indicate(discreteTag, { color: C.cyan }),
    new M.Indicate(continuousTag, { color: C.amber })
  );

  // ==========================================================
  // 36-38: USE THE DISTINCTION TO SPOT MISTAKES
  // ==========================================================

  const testScene = () => new M.VGroup(
    drinkTestLine,
    ...drinkTestTicks,
    drinkTitle,
    waitTestLine,
    ...waitTestTicks,
    waitTestLabels,
    waitTitle,
    d2,
    d3,
    gapLine,
    gapEnd1,
    gapEnd2,
    nothingLabel,
    discreteTag,
    w90,
    w91,
    ...betweenWaitDots,
    continuousTag
  );

  const cardYBad = P ? 1.0 : -0.45;
  const cardYGood = P ? -2.35 : -0.45;
  const cardXBad = P ? 0 : -3.15;
  const cardXGood = P ? 0 : 3.15;

  const mistakeCard = (s, x, y, color) => {
    const r = new M.RoundedRectangle({
      width: P ? 4.7 : 4.9,
      height: 1.15,
      cornerRadius: 0.16,
      color,
      strokeWidth: 2.5,
    });

    r.setFill(C.card, 0.95);
    r.moveTo(pt(x, y));

    const t = textAt(s, x, y, P ? 26 : 29, C.ink);

    return new M.VGroup(r, t);
  };

  const badCard = mistakeCard(
    'orders: 6.5',
    cardXBad,
    cardYBad,
    C.violet
  );

  const goodCard = mistakeCard(
    'wait: 90.5 s',
    cardXGood,
    cardYGood,
    C.violet
  );

  const badX = [
    line(
      cardXBad + 2.7,
      cardYBad - 0.2,
      cardXBad + 3.1,
      cardYBad + 0.2,
      C.pink,
      5
    ),
    line(
      cardXBad + 2.7,
      cardYBad + 0.2,
      cardXBad + 3.1,
      cardYBad - 0.2,
      C.pink,
      5
    ),
  ];

  const badNote = textAt(
    'not a possible count',
    cardXBad,
    cardYBad - 0.95,
    16,
    C.pink
  );

  const check1 = line(
    cardXGood + 2.6,
    cardYGood,
    cardXGood + 2.85,
    cardYGood - 0.22,
    C.green,
    5
  );

  const check2 = line(
    cardXGood + 2.85,
    cardYGood - 0.22,
    cardXGood + 3.27,
    cardYGood + 0.28,
    C.green,
    5
  );

  const goodNote = textAt(
    'makes sense',
    cardXGood,
    cardYGood - 0.95,
    16,
    C.green
  );

  // 36. First use: spot mistakes.
  await until(S(36));

  await play(
    new M.FadeOut(testScene()),
    new M.FadeIn(badCard),
    new M.FadeIn(goodCard),
    ...say("USE 1: SPOT MISTAKES", C.green)
  );

  // 37. An impossible count.
  await until(S(37));

  await play(
    new M.Indicate(badCard, { color: C.pink }),
    new M.Create(badX[0]),
    new M.Create(badX[1]),
    new M.FadeIn(badNote),
    ...say("6.5 ORDERS CANNOT HAPPEN", C.pink)
  );

  // 38. A possible wait.
  await until(S(38));

  await play(
    new M.Indicate(goodCard, { color: C.green }),
    new M.Create(check1),
    new M.Create(check2),
    new M.FadeIn(goodNote),
    ...say("90.5 SECONDS MAKES SENSE", C.green)
  );

  // ==========================================================
  // 39-40: COUNTS SUIT SEPARATE WHOLE-NUMBER BARS
  // ==========================================================

  const mistakeScene = () => new M.VGroup(
    badCard,
    ...badX,
    badNote,
    goodCard,
    check1,
    check2,
    goodNote
  );

  const chartBase = P ? -3.6 : -2.15;
  const chartUnit = P ? 1.05 : 0.58;
  const chartXs = P ? [-2.0, 0, 2.0] : [-2.3, 0, 2.3];

  const chartBars = [];
  const chartLabels = [];
  const chartGrid = [];

  for (let v = 1; v <= 3; v++) {
    chartGrid.push(
      line(
        P ? -3.1 : -4.0,
        chartBase + v * chartUnit,
        P ? 3.1 : 4.0,
        chartBase + v * chartUnit,
        C.grid,
        1
      )
    );
  }

  const chartFloor = line(
    P ? -3.1 : -4.0,
    chartBase,
    P ? 3.1 : 4.0,
    chartBase,
    C.muted,
    2
  );

  const chartNames = ['coffee', 'tea', 'juice'];
  const chartValues = [3, 2, 1];

  for (let k = 0; k < 3; k++) {
    const h = chartValues[k] * chartUnit;

    const b = new M.Rectangle({
      width: P ? 0.9 : 1.05,
      height: h,
      color: C.cyan,
      strokeWidth: 2,
    });

    b.setFill(C.cyan, 0.58);
    b.moveTo(pt(chartXs[k], chartBase + h / 2));

    chartBars.push(b);

    chartLabels.push(
      textAt(
        chartNames[k],
        chartXs[k],
        chartBase - 0.35,
        P ? 18 : 17,
        C.ink
      )
    );
  }

  const chartNums = chartValues.map((v, k) =>
    textAt(String(v), chartXs[k], chartBase + v * chartUnit + 0.3, P ? 24 : 22, C.amber));
  const chartYs = [1, 2, 3].map(v =>
    textAt(String(v), P ? -3.35 : -4.3, chartBase + v * chartUnit, 18, C.muted));

  const chartTitle = textAt(
    'NUMBER OF DRINKS',
    0,
    chartBase + 3 * chartUnit + 0.35,
    16,
    C.muted
  );

  // 39. The kind of number determines the chart.
  await until(S(39));

  await play(
    new M.FadeOut(mistakeScene()),
    ...say("USE 2: THE KIND DECIDES THE CHART", C.green)
  );

  // 40. Separate bars.
  await until(S(40));

  await play(
    new M.Create(chartFloor),
    new M.FadeIn(new M.VGroup(
      ...chartGrid,
      chartTitle,
      ...chartLabels,
      ...chartYs
    )),
    new M.LaggedStart(
      [...chartBars, ...chartNums].map(b => new M.FadeIn(b)),
      { lagRatio: 0.15, runTime: 1.4 }
    ),
    ...say("COUNTS: SEPARATE BARS, WHOLE STEPS", C.cyan)
  );

  // ==========================================================
  // 41-43: THE WHOLE-SECONDS TRAP
  // ==========================================================

  const chartScene = () => new M.VGroup(
    chartFloor,
    ...chartGrid,
    chartTitle,
    ...chartLabels,
    ...chartYs,
    ...chartNums,
    ...chartBars
  );

  const chipVals = [120, 90, 150, 60, 180, 60];

  const chips = chipVals.map((v, k) => {
    const p = pill(String(v), C.amber, P ? 17 : 19);

    const x = P
      ? ((k % 3) - 1) * 2.0
      : (k - 2.5) * 1.55;

    const y = P
      ? (k < 3 ? 1.05 : -0.25)
      : 0.35;

    p.moveTo(pt(x, y));
    return p;
  });

  const chipsLabel = textAt(
    'WAIT VALUES (SECONDS)',
    0,
    P ? 1.95 : 1.05,
    16,
    C.muted
  );

  // 41. The notebook shows whole seconds.
  await until(S(41));

  await play(
    new M.FadeOut(chartScene()),
    new M.LaggedStart(
      chips.map(p => new M.FadeIn(p)),
      { lagRatio: 0.12, runTime: 1.0 }
    ),
    new M.FadeIn(chipsLabel),
    ...say("TRAP: ONLY WHOLE SECONDS", C.pink)
  );

  // 42. The clock display shows whole seconds.
  await until(S(42));

  await play(
    new M.Indicate(chips[1], { color: C.amber }),
    ...fbox([
      ['clock display', C.muted],
      ['90 seconds', C.amber],
    ], C.amber),
    ...say("THE CLOCK SHOWS WHOLE SECONDS", C.amber)
  );

  await until((S(42) + E(42)) / 2);

  await play(
    ...fbox([
      ['finer stopwatch', C.green],
      ['90.5 seconds', C.green],
    ], C.green),
    ...say("A FINER CLOCK CAN SHOW 90.5", C.green)
  );

  // 43. The wait itself is still continuous.
  await until(S(43));

  await play(
    new M.Indicate(boxNow, { color: C.green }),
    ...say("THE WAIT ITSELF IS STILL CONTINUOUS", C.amber)
  );

  // ==========================================================
  // 44: RECAP
  // ==========================================================

  const trapScene = () => new M.VGroup(
    ...chips,
    chipsLabel,
    boxNow
  );

  const recapStairs = [];
  const rBase = P ? 1.4 : -1.1;
  const rX0 = P ? -2.6 : -5.0;
  const rW = P ? 1.04 : 0.68;
  const rH = P ? 0.42 : 0.34;

  const rPts = [pt(rX0, rBase)];

  for (let k = 0; k < 5; k++) {
    rPts.push(
      pt(rX0 + k * rW, rBase + (k + 1) * rH)
    );

    rPts.push(
      pt(rX0 + (k + 1) * rW, rBase + (k + 1) * rH)
    );
  }

  for (let k = 1; k < rPts.length; k++) {
    recapStairs.push(
      new M.Line({
        start: rPts[k - 1],
        end: rPts[k],
        color: C.cyan,
        strokeWidth: 4,
      })
    );
  }

  const recapRamp = line(
    P ? -2.6 : 1.7,
    P ? -4.2 : -1.1,
    P ? 2.6 : 5.0,
    P ? -1.8 : 0.7,
    C.amber,
    4
  );

  const recapDrinks = pill(
    'DRINKS: DISCRETE',
    C.cyan,
    P ? 17 : 18
  );

  recapDrinks.moveTo(
    P ? pt(0, 0.8) : pt(-3.2, -2.0)
  );

  const recapWait = pill(
    'WAIT: CONTINUOUS',
    C.amber,
    P ? 17 : 18
  );

  recapWait.moveTo(
    P ? pt(0, -5.0) : pt(3.2, -2.0)
  );

  await until(S(44));

  await play(
    new M.FadeOut(trapScene()),
    new M.LaggedStart(
      recapStairs.map(s => new M.Create(s)),
      { lagRatio: 0.12, runTime: 1.0 }
    ),
    new M.FadeIn(recapDrinks),
    ...say("RECAP", C.violet)
  );

  await play(
    new M.Create(recapRamp),
    new M.FadeIn(recapWait)
  );
}
