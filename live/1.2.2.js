// lesson 1.2.2
// Relative frequency: turning counts into shares of the whole.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Layout: separate visual and formula lanes on laptop;
// vertically stacked visual and formula zones on phone.
// Checked against the supplied contact sheets and scene coordinates.
// Live engine rendering is not available here for final visual verification.

export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play } = L;

  const COUNTS = [1, 2, 3, 1, 0, 1];

  // ------------------------------------------------------------
  // Responsive layout.
  //
  // Laptop content bounds: -3.7 < y < 2.4.
  // Phone content bounds:  -6.6 < y < 4.3.
  //
  // Laptop:
  //   Pill: centered above both content lanes.
  //   Main visual: left lane, centered at x = -3.
  //   Formula: right lane, centered at x = 3.4.
  //
  // Phone:
  //   Pill: upper content zone.
  //   Main visual: central content zone.
  //   Formula: lower content zone.
  // ------------------------------------------------------------

  const CX = P ? 0 : -3.0;
  const PILL = P ? [0, 3.55, 0] : [0, 1.95, 0];
  const BOXP = P ? [0, -5.2, 0] : [3.4, -0.45, 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Fit text before positioning it.
  function fitText(s, size, color, maxWidth) {
    const t = T(s, size, color, true);
    const width = t.getWidth();

    if (width > maxWidth) {
      t.scale(maxWidth / width);
    }

    return t;
  }

  // Grouping existing objects is used only for their removal.
  function remove(...objects) {
    const parts = objects.filter(Boolean);

    return new M.FadeOut(
      parts.length === 1
        ? parts[0]
        : new M.VGroup(...parts)
    );
  }

  // Objects sharing a layout slot must not crossfade over one another.
  // Keep the handoff inside one play() and inside the existing beat.
  function handoff(...animations) {
    return new M.LaggedStart(
      animations,
      {
        lagRatio: 1,
        runTime: 1.0
      }
    );
  }

  // ------------------------------------------------------------
  // Formula box.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 18;
    const lh = P ? 0.46 : 0.43;

    const padX = 0.36;
    const padY = 0.24;

    const maxw = P ? Math.min(FW - 1.0, 6.8) : 5.3;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const indents = rows.map(([s]) =>
      cw * (s.length - s.trimStart().length)
    );

    const rawWidths = texts.map((t, i) =>
      t.getWidth() + indents[i]
    );

    const contentMax = Math.max(...rawWidths);

    const scale = Math.min(
      1,
      (maxw - 2 * padX) / Math.max(contentMax, 0.01)
    );

    if (scale < 1) {
      texts.forEach(t => t.scale(scale));
    }

    const widths = texts.map((t, i) =>
      t.getWidth() + indents[i] * scale
    );

    const wd = Math.max(...widths) + 2 * padX;
    const ht = rows.length * lh + 2 * padY;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + padX;
    const top = BOXP[1] + ht / 2 - padY - lh / 2;

    texts.forEach((t, i) => {
      t.moveTo([
        left + indents[i] * scale + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);
    const previous = boxNow;

    boxNow = g;

    if (previous) {
      return [
        handoff(
          new M.FadeOut(previous),
          new M.FadeIn(g)
        )
      ];
    }

    return [new M.FadeIn(g)];
  }

  // ------------------------------------------------------------
  // Equal customer blocks.
  // ------------------------------------------------------------

  function makeBlocks(
    n,
    chosen,
    center,
    width,
    height = 0.55,
    color = C.cyan
  ) {
    const step = width / n;

    // Extra spacing for the narrow lunch blocks allows Indicate
    // animations without neighboring blocks touching.
    const blockRatio = n > 8 ? 0.78 : 0.86;

    const blocks = [];

    for (let i = 0; i < n; i++) {
      const col = i < chosen ? color : C.muted;

      const b = new M.Rectangle({
        width: step * blockRatio,
        height,
        color: col,
        strokeWidth: 1
      });

      b.setFill(col, i < chosen ? 0.9 : 0.16);

      b.moveTo([
        center[0] + (i - (n - 1) / 2) * step,
        center[1],
        0
      ]);

      blocks.push(b);
    }

    return new M.VGroup(...blocks);
  }

  // ------------------------------------------------------------
  // Proportional share bar.
  // ------------------------------------------------------------

  function makeShareBar(
    center,
    fraction,
    label,
    color = C.cyan
  ) {
    const width = P ? 6.4 : 4.9;
    const height = P ? 0.9 : 0.48;

    const outline = new M.Rectangle({
      width,
      height,
      color: C.muted,
      strokeWidth: 2
    });

    outline.moveTo(center);

    const fillWidth = Math.max(width * fraction, 0.035);

    const fill = new M.Rectangle({
      width: fillWidth,
      height: height * 0.82,
      color,
      strokeWidth: 0
    });

    fill.setFill(color, 0.9);

    fill.moveTo([
      center[0] - width / 2 + fillWidth / 2,
      center[1],
      0
    ]);

    const caption = fitText(
      label,
      P ? 20 : 18,
      color,
      width - 0.18
    );

    caption.moveTo([
      center[0],
      center[1] + height / 2 + 0.38,
      0
    ]);

    return {
      outline,
      fill,
      caption,
      group: new M.VGroup(outline, fill, caption)
    };
  }

  // ------------------------------------------------------------
  // Eight-customer bar layout.
  // ------------------------------------------------------------

  // The introductory bar is centered because no formula is present.
  const introBarCenter = P
    ? [0, -3.0, 0]
    : [0, -0.3, 0];

  // Later bars reserve a separate formula lane.
  const barCenter = P
    ? [0, -2.0, 0]
    : [CX, -0.3, 0];

  const barWidth = P ? 6.6 : 5.1;
  const BH = P ? 1.1 : 0.55;      // block height
  const CAPY = P ? 1.05 : 0.85;   // caption offset above a bar

  let barNow = null;
  let barCaption = null;

  function replaceBar(chosen, label, color = C.cyan) {
    const next = makeBlocks(
      8,
      chosen,
      barCenter,
      barWidth,
      BH,
      color
    );

    const caption = fitText(
      label,
      P ? 18 : 20,
      color,
      barWidth
    );

    caption.moveTo([
      barCenter[0],
      barCenter[1] + CAPY,
      0
    ]);

    const previousBar = barNow;
    const previousCaption = barCaption;

    barNow = next;
    barCaption = caption;

    if (previousBar) {
      return [
        handoff(
          remove(previousBar, previousCaption),
          new M.FadeIn(next),
          new M.FadeIn(caption)
        )
      ];
    }

    return [
      new M.FadeIn(next),
      new M.FadeIn(caption)
    ];
  }

  // ------------------------------------------------------------
  // One hundred small pieces.
  // ------------------------------------------------------------

  const gridCenter = P
    ? [0, -1.7, 0]
    : [CX, -0.45, 0];

  function makeHundredGrid(chosen, center) {
    const side = P ? 0.44 : 0.27;
    const gap = P ? 0.06 : 0.045;
    const step = side + gap;

    const squares = [];

    for (let i = 0; i < 100; i++) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      const color = i < chosen ? C.cyan : C.muted;

      const b = new M.Rectangle({
        width: side,
        height: side,
        color,
        strokeWidth: 1.2
      });

      b.setFill(color, i < chosen ? 0.9 : 0.35);

      b.moveTo([
        center[0] + (col - 4.5) * step,
        center[1] + (4.5 - row) * step,
        0
      ]);

      squares.push(b);
    }

    return new M.VGroup(...squares);
  }

  // ------------------------------------------------------------
  // Calculator illustration.
  //
  // The calculator occupies the main visual lane, never the
  // formula lane. All three keypad rows fit inside its body.
  // ------------------------------------------------------------

  const calcX = CX;
  const calcY = P ? -1.6 : -0.55;

  const calcW = P ? 5.4 : 4.1;
  const calcH = P ? 4.3 : 3.45;

  const screenY = calcY + calcH * 0.32;
  const screenW = calcW - 0.55;
  const screenH = P ? 0.85 : 0.70;

  function makeCalculator() {
    const body = new M.RoundedRectangle({
      width: calcW,
      height: calcH,
      cornerRadius: 0.2,
      color: C.muted,
      strokeWidth: 2
    });

    body.setFill(C.card, 0.96);
    body.moveTo([calcX, calcY, 0]);

    const screen = new M.RoundedRectangle({
      width: screenW,
      height: screenH,
      cornerRadius: 0.1,
      color: C.cyan,
      strokeWidth: 1.5
    });

    screen.setFill(C.card, 1);
    screen.moveTo([calcX, screenY, 0]);

    const keys = [];

    const keyW = P ? 0.9 : 0.65;
    const keyH = P ? 0.5 : 0.43;
    const keyPitchX = P ? 1.1 : 0.78;
    const keyPitchY = P ? 0.78 : 0.62;

    const firstKeyY = calcY + 0.02;

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const key = new M.RoundedRectangle({
          width: keyW,
          height: keyH,
          cornerRadius: 0.07,
          color: C.muted,
          strokeWidth: 1
        });

        key.setFill(C.muted, 0.22);

        key.moveTo([
          calcX + (c - 1.5) * keyPitchX,
          firstKeyY - r * keyPitchY,
          0
        ]);

        keys.push(key);
      }
    }

    return new M.VGroup(body, screen, ...keys);
  }

  let calculator = null;
  let calcDisplay = null;

  function makeCalcDisplay(s) {
    const next = fitText(
      s,
      P ? 32 : 27,
      C.cyan,
      screenW - 0.38
    );

    next.moveTo([calcX, screenY, 0]);

    return next;
  }

  function calcText(s) {
    const next = makeCalcDisplay(s);
    const previous = calcDisplay;

    calcDisplay = next;

    if (previous) {
      return [
        handoff(
          new M.FadeOut(previous),
          new M.FadeIn(next)
        )
      ];
    }

    return [new M.FadeIn(next)];
  }

  function enterCalculator(s, ...outgoing) {
    // Use a fresh calculator after a previous calculator has
    // been removed, avoiding stale group ownership.
    calculator = makeCalculator();
    calcDisplay = makeCalcDisplay(s);

    return handoff(
      remove(...outgoing),
      new M.FadeIn(calculator),
      new M.FadeIn(calcDisplay)
    );
  }

  // ------------------------------------------------------------
  // 0-3: Introduce the café and the question.
  // ------------------------------------------------------------

  // 0. Quiet morning at the café.
  const cup = new M.VGroup(
    new M.Arc({
      radius: 0.48,
      startAngle: Math.PI,
      angle: Math.PI,
      color: C.cyan
    }),

    new M.Line({
      start: [-0.48, 0, 0],
      end: [0.48, 0, 0],
      color: C.cyan
    }),

    new M.Arc({
      radius: 0.15,
      startAngle: -Math.PI / 2,
      angle: Math.PI,
      color: C.cyan
    }).moveTo([0.62, -0.15, 0]),

    new M.Line({
      start: [-0.65, -0.58, 0],
      end: [0.65, -0.58, 0],
      color: C.muted
    })
  );

  // Separate the cup's exit from the incoming customer dots.
  cup.scale(P ? 2.4 : 1.6);
  cup.moveTo(P ? [0, -2.4, 0] : [0, 0.55, 0]);

  await until(S(0));
  await play(
    new M.Create(cup),
    ...say('CAFÉ · MORNING SHIFT')
  );

  // 1. Three customers waited three minutes.
  const threeDots = [];
  const threeY = P ? -3.4 : -0.95;

  for (let i = 0; i < 3; i++) {
    const d = new M.Dot({
      point: [(i - 1) * (P ? 1.1 : 0.75), threeY, 0],
      radius: P ? 0.32 : 0.2,
      color: C.cyan
    });

    d.setFill(C.cyan, 0.9);
    threeDots.push(d);
  }

  const threeLabel = T(
    '3 MINUTES',
    P ? 26 : 23,
    C.cyan,
    true
  );

  threeLabel.moveTo([
    0,
    threeY - (P ? 0.95 : 0.65),
    0
  ]);

  await until(S(1));
  await play(
    handoff(
      new M.FadeOut(cup),
      ...threeDots.map(d => new M.FadeIn(d)),
      new M.FadeIn(threeLabel)
    ),
    ...say('3 CUSTOMERS · 3 MINUTES')
  );

  // 2. Is that a big share?
  await until(S(2));
  await play(
    ...say('A BIG SHARE OR HARDLY ANYONE?', C.amber),

    // Do not reparent the already-visible dots.
    ...threeDots.map(d =>
      new M.Indicate(d, { color: C.amber })
    )
  );

  // 3. Introduce the frequency table.
  const tableX = 0;

  const headY = P ? 2.35 : 1.10;
  const pitch = P ? 0.92 : 0.55;

  const colGap = P ? 2.25 : 2.15;
  const tableWidth = P ? 5.25 : 4.95;

  const cell = (col, minute) => [
    tableX + (col - 0.5) * colGap,
    headY - (minute + 0.1) * pitch,
    0
  ];

  const headers = [
    fitText(
      'Wait (min)',
      P ? 17 : 19,
      C.muted,
      colGap - 0.28
    ),

    fitText(
      'Customers',
      P ? 17 : 19,
      C.muted,
      colGap - 0.28
    )
  ];

  headers[0].moveTo([
    tableX - colGap / 2,
    headY,
    0
  ]);

  headers[1].moveTo([
    tableX + colGap / 2,
    headY,
    0
  ]);

  const labels = {};
  const frequencies = {};
  const tableRules = [];

  for (let v = 1; v <= 6; v++) {
    labels[v] = T(
      String(v),
      P ? 28 : 24,
      C.cyan,
      true
    );

    labels[v].moveTo(cell(0, v));

    frequencies[v] = T(
      String(COUNTS[v - 1]),
      P ? 28 : 24,
      C.amber,
      true
    );

    frequencies[v].moveTo(cell(1, v));

    const ruleY = cell(0, v)[1] - pitch * 0.49;

    tableRules.push(
      new M.Line({
        start: [
          tableX - tableWidth / 2,
          ruleY,
          0
        ],

        end: [
          tableX + tableWidth / 2,
          ruleY,
          0
        ],

        color: C.grid,
        strokeWidth: 1.2
      })
    );
  }

  // Keep one stable group for the entire static table.
  // Frequencies remain independent until they are revealed.
  // This prevents leftover headers, labels and rules.
  const tableBase = new M.VGroup(
    ...tableRules,
    ...headers,
    ...Object.values(labels)
  );

  await until(S(3));
  await play(
    handoff(
      remove(...threeDots, threeLabel),
      new M.FadeIn(tableBase)
    ),

    ...say('MORNING WAITS · 1 TO 6 MINUTES')
  );

  // ------------------------------------------------------------
  // 4-10: Read the counts.
  // ------------------------------------------------------------

  function highlightTableRow(v) {
    const frame = new M.RoundedRectangle({
      width: tableWidth - 0.18,
      height: pitch * 0.76,
      cornerRadius: 0.1,
      color: C.amber,
      strokeWidth: 2
    });

    frame.moveTo([
      tableX,
      cell(0, v)[1],
      0
    ]);

    return frame;
  }

  let rowFocus = null;

  function revealFrequency(v) {
    const frame = highlightTableRow(v);
    const animations = [];

    if (rowFocus) {
      animations.push(new M.FadeOut(rowFocus));
    }

    animations.push(
      new M.FadeIn(frame),
      new M.FadeIn(frequencies[v])
    );

    rowFocus = frame;

    return animations;
  }

  // 4. One customer waited one minute.
  await until(S(4));
  await play(
    ...revealFrequency(1),
    ...say('1 MINUTE · 1 CUSTOMER')
  );

  // 5. Two customers waited two minutes.
  await until(S(5));
  await play(
    ...revealFrequency(2),
    ...say('2 MINUTES · 2 CUSTOMERS')
  );

  // 6. Three customers waited three minutes.
  await until(S(6));
  await play(
    ...revealFrequency(3),
    ...say('3 MINUTES · 3 CUSTOMERS')
  );

  // 7. One customer waited four minutes.
  await until(S(7));
  await play(
    ...revealFrequency(4),
    ...say('4 MINUTES · 1 CUSTOMER')
  );

  // 8. Nobody waited five minutes.
  await until(S(8));
  await play(
    ...revealFrequency(5),
    ...say('5 MINUTES · ZERO CUSTOMERS')
  );

  // 9. One customer waited six minutes.
  await until(S(9));
  await play(
    ...revealFrequency(6),
    ...say('6 MINUTES · 1 CUSTOMER')
  );

  // 10. Add the counts.
  const totalLabel = fitText(
    'TOTAL = 8 CUSTOMERS',
    P ? 20 : 21,
    C.green,
    tableWidth
  );

  totalLabel.moveTo([
    tableX,
    P ? -4.6 : -2.95,
    0
  ]);

  await until(S(10));
  await play(
    new M.FadeOut(rowFocus),
    new M.FadeIn(totalLabel),
    ...say('1 + 2 + 3 + 1 + 0 + 1 = 8', C.green)
  );

  rowFocus = null;

  // ------------------------------------------------------------
  // 11-18: A frequency is a count; relative frequency is a share.
  // ------------------------------------------------------------

  // 11. Eight equal blocks represent eight customers.
  const eightBar = makeBlocks(
    8,
    8,
    introBarCenter,
    barWidth,
    BH,
    C.cyan
  );

  const eightCaption = fitText(
    '8 CUSTOMERS · 8 EQUAL BLOCKS',
    P ? 17 : 19,
    C.cyan,
    barWidth
  );

  eightCaption.moveTo([
    introBarCenter[0],
    introBarCenter[1] + CAPY,
    0
  ]);

  const eightGroup = new M.VGroup(
    eightBar,
    eightCaption
  );

  await until(S(11));
  await play(
    handoff(
      remove(
        tableBase,
        ...Object.values(frequencies),
        totalLabel
      ),

      new M.FadeIn(eightGroup)
    ),

    ...say('ONE BLOCK = ONE CUSTOMER')
  );

  // 12. Four blocks make half the bar.
  const halfBar = makeBlocks(
    8,
    4,
    introBarCenter,
    barWidth,
    BH,
    C.cyan
  );

  // The marker sits in the widened gap between blocks 4 and 5.
  const halfLine = new M.DashedLine({
    start: [
      introBarCenter[0],
      introBarCenter[1] - (BH / 2 + 0.15),
      0
    ],

    end: [
      introBarCenter[0],
      introBarCenter[1] + (BH / 2 + 0.15),
      0
    ],

    color: C.amber,
    strokeWidth: 1.5
  });

  await until(S(12));
  await play(
    handoff(
      new M.FadeOut(eightGroup),
      new M.FadeIn(halfBar),
      new M.Create(halfLine)
    ),

    ...say('4 OF 8 BLOCKS = HALF', C.amber)
  );

  // 13. Three-minute waits take three blocks.
  const threeOfEight = makeBlocks(
    8,
    3,
    introBarCenter,
    barWidth,
    BH,
    C.cyan
  );

  await until(S(13));
  await play(
    handoff(
      remove(halfBar, halfLine),
      new M.FadeIn(threeOfEight)
    ),

    ...say('3 OF 8 · NEARLY HALF', C.cyan)
  );

  // 14. Three customers out of one hundred.
  const hundredDots = [];

  const dotCenterY = P ? -1.9 : -0.3;
  const dotPitch = P ? 0.56 : 0.27;

  for (let i = 0; i < 100; i++) {
    const row = Math.floor(i / 10);
    const col = i % 10;
    const color = i < 3 ? C.cyan : C.muted;

    const d = new M.Dot({
      point: [
        (col - 4.5) * dotPitch,
        dotCenterY + (4.5 - row) * dotPitch,
        0
      ],

      radius: P ? 0.14 : 0.075,
      color
    });

    d.setFill(color, 0.9);
    hundredDots.push(d);
  }

  const hundredGroup = new M.VGroup(...hundredDots);

  await until(S(14));
  await play(
    handoff(
      new M.FadeOut(threeOfEight),
      new M.FadeIn(hundredGroup)
    ),

    ...say('NOW IMAGINE 100 CUSTOMERS', C.amber)
  );

  // 15. The same three customers make a tiny share.
  const shareMorning = makeShareBar(
    P ? [0, -0.3, 0] : [CX, 0.50, 0],
    3 / 8,
    '3 OF 8 · OUR CAFÉ'
  );

  const shareHundred = makeShareBar(
    P ? [0, -3.2, 0] : [CX, -1.40, 0],
    3 / 100,
    '3 OF 100 · BUSY GROUP',
    C.amber
  );

  await until(S(15));
  await play(
    handoff(
      new M.FadeOut(hundredGroup),
      new M.FadeIn(shareMorning.group),
      new M.FadeIn(shareHundred.group)
    ),

    ...say('SAME COUNT · VERY DIFFERENT SHARE', C.amber)
  );

  // 16. Frequency is how many times something happens.
  await until(S(16));
  await play(
    ...say('FREQUENCY = HOW MANY TIMES', C.cyan),

    new M.Indicate(
      shareMorning.group,
      { color: C.cyan }
    )
  );

  // 17. Relative frequency is the share of the whole group.
  await until(S(17));
  await play(
    ...say(
      'RELATIVE FREQUENCY = SHARE OF THE WHOLE',
      C.green
    ),

    new M.Indicate(
      shareHundred.group,
      { color: C.green }
    )
  );

  // 18. Relative means compared to the whole.
  await until(S(18));
  await play(
    ...fbox([
      ['Relative', C.green],
      ['= compared to the whole', C.ink]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 19-31: Turn the customer counts into percentages.
  // ------------------------------------------------------------

  // 19. Introduce percentages: a whole made of one hundred equal pieces.
  const pctGrid = makeHundredGrid(100, gridCenter);
  const pctCap = fitText('THE WHOLE = 100 PIECES = 100%', P ? 18 : 18, C.amber, P ? 6.6 : 5.0);
  pctCap.moveTo(P ? [0, 1.3, 0] : [CX, -2.45, 0]);

  await until(S(19));
  await play(
    handoff(
      remove(shareMorning.group, shareHundred.group),
      new M.FadeIn(pctGrid),
      new M.FadeIn(pctCap)
    ),

    ...say('PERCENT = OUT OF 100', C.amber),

    ...fbox([
      ['8 customers', C.cyan],
      ['100 percent', C.amber]
    ], C.amber)
  );

  // 20. All eight customers fill the bar.
  await until(S(20));
  await play(
    remove(pctGrid, pctCap),
    ...replaceBar(8, '8 OF 8 = 100%', C.green),
    ...say('THE WHOLE BAR = 100%', C.green)
  );

  // 21. Four customers fill half the bar.
  await until(S(21));
  await play(
    ...replaceBar(4, '4 OF 8 = 50%', C.cyan),
    ...say('HALF OF 8 = 4 · 50%', C.amber)
  );

  // 22. Half of four is two.
  await until(S(22));
  await play(
    ...replaceBar(2, '2 OF 8 = 25%', C.cyan),

    ...fbox([
      ['Half of 50%', C.ink],
      ['= 25%', C.amber]
    ], C.amber)
  );

  // 23. One customer is half of two.
  await until(S(23));
  await play(
    ...replaceBar(1, '1 OF 8 = 12.5%', C.cyan),
    ...say('ONE CUSTOMER · HALF OF TWO', C.amber)
  );

  // 24. Halve 25 percent to get 12.5 percent.
  await until(S(24));
  await play(
    ...fbox([
      ['25% ÷ 2', C.ink],
      ['= 12.5%', C.amber]
    ], C.amber),

    ...say('HALF OF 25% = 12.5%', C.amber)
  );

  // 25. The percentage for one customer.
  await until(S(25));
  await play(
    ...replaceBar(1, 'ONE CUSTOMER = 12.5%', C.green),
    ...say('EACH CUSTOMER = 12.5%', C.green)
  );

  // 26. Three-minute wait has three customers.
  await until(S(26));
  await play(
    ...replaceBar(3, '3 CUSTOMERS = 2 + 1', C.cyan),
    ...say('3 MINUTES · THREE CUSTOMERS')
  );

  // 27. Combine 25 and 12.
  await until(S(27));
  await play(
    ...fbox([
      ['25% + 12%', C.ink],
      ['= 37%', C.amber]
    ], C.amber)
  );

  // 28. Add the remaining half percent.
  await until(S(28));
  await play(
    ...fbox([
      ['25% + 12.5%', C.ink],
      ['= 37.5%', C.green]
    ], C.green),

    ...say('THREE-MINUTE SHARE = 37.5%', C.green)
  );

  // 29. Every single-customer wait has the same share.
  await until(S(29));
  await play(
    ...replaceBar(1, 'ONE BLOCK = 12.5%', C.cyan),
    ...say('ONE CUSTOMER · 12.5 PERCENT')
  );

  // 30. Two minutes has two customers; five has zero.
  await until(S(30));
  await play(
    ...replaceBar(
      2,
      '2 MIN = 25%  ·  5 MIN = 0%',
      C.amber
    ),

    ...fbox([
      ['2 customers = 25%', C.cyan],
      ['0 customers = 0%', C.muted]
    ], C.amber)
  );

  // 31. All pieces together fill the whole bar.
  await until(S(31));
  await play(
    ...replaceBar(8, 'ALL 8 CUSTOMERS = 100%', C.green),
    ...say('ALL THE PIECES = 100%', C.green)
  );

  // ------------------------------------------------------------
  // 32-37: Introduce division as a faster method.
  // ------------------------------------------------------------

  // 32. Halving worked nicely for eight.
  await until(S(32));
  await play(
    ...say('HALVING WORKED NICELY FOR 8', C.green),

    new M.Indicate(
      barNow,
      { color: C.green }
    )
  );

  // 33. Other group sizes need division.
  await until(S(33));
  await play(
    ...fbox([
      ['8 customers', C.cyan],
      ['7 or 13 customers?', C.amber],
      ['Use division', C.green]
    ], C.green)
  );

  // 34. Explain what division asks.
  await until(S(34));
  await play(
    ...say('DIVISION ASKS: HOW MANY FULL BARS?', C.amber),

    ...fbox([
      ['Count ÷ total', C.ink],
      ['= part of the whole', C.green]
    ], C.amber)
  );

  // 35. Eight divided by eight is one.
  await until(S(35));
  await play(
    ...fbox([
      ['8 ÷ 8 = 1', C.amber],
      ['One whole bar', C.green]
    ], C.green),

    ...say('8 OF 8 = ONE WHOLE')
  );

  // 36. Two divided by eight.
  await until(S(36));
  await play(
    ...fbox([
      ['2 ÷ 8', C.ink],
      ['= ?', C.amber]
    ], C.cyan),

    ...say('HOW MUCH OF THE BAR IS TWO?')
  );

  // 37. A smaller count gives less than one whole bar.
  await until(S(37));
  await play(
    ...fbox([
      ['2 is smaller than 8', C.ink],
      ['Answer is less than 1', C.green]
    ], C.green)
  );

  // ------------------------------------------------------------
  // 38-43: Use the calculator and understand the decimal.
  // ------------------------------------------------------------

  // 38. Type the count and divide.
  await until(S(38));
  await play(
    enterCalculator(
      '2 ÷',
      barNow,
      barCaption
    ),

    ...say('CALCULATOR · TYPE 2, THEN DIVIDE', C.amber)
  );

  barNow = null;
  barCaption = null;

  // 39. Type the total and press equals.
  await until(S(39));
  await play(
    ...calcText('2 ÷ 8 ='),
    ...say('NOW TYPE THE TOTAL · 8')
  );

  // 40. Read the answer.
  await until(S(40));
  await play(
    ...calcText('0.25'),
    ...say('THE SCREEN SHOWS 0.25', C.green),

    ...fbox([
      ['2 ÷ 8', C.ink],
      ['= 0.25', C.green]
    ], C.green)
  );

  // 41. The dot is a decimal point.
  await until(S(41));
  await play(
    new M.Indicate(
      calcDisplay,
      { color: C.amber }
    ),

    ...say('THE DOT = DECIMAL POINT', C.amber)
  );

  // 42. Explain the two sides of the decimal.
  await until(S(42));
  await play(
    ...fbox([
      ['0  .  25', C.green],
      ['Full bars | Part of one bar', C.ink]
    ], C.green),

    ...say('LEFT = WHOLE BARS · RIGHT = PART')
  );

  // 43. Zero full bars.
  await until(S(43));
  await play(
    ...fbox([
      ['0 full bars', C.amber],
      ['.25 of one bar', C.green]
    ], C.green),

    ...say('ZERO MEANS NO FULL BARS')
  );

  // ------------------------------------------------------------
  // 44-47: A decimal as one hundred small pieces.
  // ------------------------------------------------------------

  let gridNow = makeHundredGrid(
    0,
    gridCenter
  );

  // 44. One bar divided into ten strips, then ten pieces each.
  await until(S(44));
  await play(
    handoff(
      remove(calculator, calcDisplay),
      new M.FadeIn(gridNow)
    ),

    new M.FadeOut(boxNow),

    ...say('10 STRIPS · 10 PIECES EACH', C.amber)
  );

  calculator = null;
  calcDisplay = null;
  boxNow = null;

  // 45. Highlight two strips and five extra pieces.
  const grid25 = makeHundredGrid(
    25,
    gridCenter
  );

  await until(S(45));
  await play(
    handoff(
      new M.FadeOut(gridNow),
      new M.FadeIn(grid25)
    ),

    ...fbox([
      ['0.25 = 25 pieces', C.green],
      ['25 out of 100', C.amber]
    ], C.green),

    ...say('TWO STRIPS + FIVE PIECES')
  );

  gridNow = grid25;

  // 46. One full bar is one hundred pieces.
  const grid100 = makeHundredGrid(
    100,
    gridCenter
  );

  await until(S(46));
  await play(
    handoff(
      new M.FadeOut(gridNow),
      new M.FadeIn(grid100)
    ),

    ...say('ONE FULL BAR = 100 PIECES', C.green)
  );

  gridNow = grid100;

  // 47. Multiplying by one hundred counts the pieces.
  await until(S(47));
  await play(
    ...fbox([
      ['Decimal share × 100', C.ink],
      ['= percentage', C.green]
    ], C.green),

    ...say('MULTIPLY BY 100 TO COUNT PIECES')
  );

  // ------------------------------------------------------------
  // 48-55: Convert decimals to percentages.
  // ------------------------------------------------------------

  // 48. Press times and type one hundred.
  await until(S(48));
  await play(
    enterCalculator(
      '0.25 × 100',
      gridNow
    ),

    ...say('CALCULATOR · TIMES 100', C.amber)
  );

  gridNow = null;

  // 49. The answer is twenty-five percent.
  await until(S(49));
  await play(
    ...calcText('25'),

    ...fbox([
      ['0.25 × 100', C.ink],
      ['= 25%', C.green]
    ], C.green),

    ...say('25 PERCENT · SAME SHARE', C.green)
  );

  // 50. Check three divided by eight.
  await until(S(50));
  await play(
    ...calcText('3 ÷ 8'),
    ...fbox([
      ['3 ÷ 8', C.ink],
      ['= ?', C.amber]
    ], C.amber),
    ...say('NOW CHECK 3 ÷ 8', C.amber)
  );

  // 51. The decimal is 0.375.
  await until(S(51));
  await play(
    ...calcText('0.375'),
    ...say('THE SCREEN SHOWS 0.375', C.cyan)
  );

  // 52. Multiply by one hundred.
  await until(S(52));
  await play(
    ...calcText('37.5'),

    ...fbox([
      ['0.375 × 100', C.ink],
      ['= 37.5%', C.green]
    ], C.green),

    ...say('37.5 PERCENT')
  );

  // 53. Decimal and percent name the same share.
  await until(S(53));
  await play(
    ...fbox([
      ['0.375', C.cyan],
      ['=', C.muted],
      ['37.5%', C.green]
    ], C.green),

    ...say('SAME SHARE · TWO WAYS TO WRITE IT')
  );

  // 54. The general relative frequency formula.
  await until(S(54));
  await play(
    ...fbox([
      ['Relative frequency', C.green],
      ['= count ÷ total', C.ink]
    ], C.green),

    ...say('COUNT DIVIDED BY TOTAL', C.green)
  );

  // 55. Convert that decimal into a percent.
  await until(S(55));
  await play(
    ...fbox([
      ['Count ÷ total', C.ink],
      ['× 100 = percent', C.amber]
    ], C.amber),

    ...say('TIMES 100 WRITES IT AS A PERCENT')
  );

  // ------------------------------------------------------------
  // 56-63: Compare morning and lunch fairly.
  // ------------------------------------------------------------

  // 56. Busy lunch has sixteen customers.
  const lunchCenter = P
    ? [0, -3.0, 0]
    : [CX, -0.3, 0];

  const lunchWidth = P ? 6.8 : 5.2;

  const lunchBar = makeBlocks(
    16,
    4,
    lunchCenter,
    lunchWidth,
    BH,
    C.amber
  );

  const lunchCaption = fitText(
    'LUNCH · 16 CUSTOMERS',
    P ? 18 : 20,
    C.amber,
    lunchWidth
  );

  lunchCaption.moveTo([
    lunchCenter[0],
    lunchCenter[1] + CAPY,
    0
  ]);

  await until(S(56));
  await play(
    handoff(
      remove(calculator, calcDisplay),
      new M.FadeIn(lunchBar),
      new M.FadeIn(lunchCaption)
    ),

    new M.FadeOut(boxNow),

    ...say('BUSY LUNCH · 16 CUSTOMERS')
  );

  calculator = null;
  calcDisplay = null;
  boxNow = null;

  // 57. Four lunch customers waited three minutes.
  await until(S(57));
  await play(
    new M.LaggedStart(
      lunchBar.submobjects.slice(0, 4).map(b =>
        new M.Indicate(b, { color: C.green })
      ),

      { lagRatio: 0.15, runTime: 1.2 }
    ),

    ...say('4 LUNCH CUSTOMERS · 3 MINUTES', C.amber)
  );

  // 58. Four looks bigger than three by count.
  await until(S(58));
  await play(
    ...fbox([
      ['Lunch count = 4', C.amber],
      ['Morning count = 3', C.cyan]
    ], C.amber),

    ...say('4 LOOKS BIGGER THAN 3')
  );

  // 59. Calculate four divided by sixteen.
  await until(S(59));
  await play(
    enterCalculator(
      '4 ÷ 16 = 0.25',
      lunchBar,
      lunchCaption
    ),

    ...say('CALCULATOR · 4 ÷ 16', C.amber)
  );

  // 60. Lunch share is twenty-five percent.
  await until(S(60));
  await play(
    ...calcText('25%'),

    ...fbox([
      ['0.25 × 100', C.ink],
      ['= 25%', C.green]
    ], C.green),

    ...say('LUNCH · 25 PERCENT', C.green)
  );

  // 61. Morning share was thirty-seven and a half percent.
  await until(S(61));
  await play(
    ...fbox([
      ['Morning · 3 of 8', C.cyan],
      ['= 37.5%', C.cyan],
      ['Lunch · 4 of 16', C.amber],
      ['= 25%', C.amber]
    ], C.cyan),

    ...say('MORNING · 37.5%   LUNCH · 25%')
  );

  // 62. Lunch has the smaller share.
  const morningCompare = makeShareBar(
    P ? [0, -0.3, 0] : [CX, 0.50, 0],
    3 / 8,
    'MORNING · 37.5%',
    C.cyan
  );

  const lunchCompare = makeShareBar(
    P ? [0, -3.2, 0] : [CX, -1.40, 0],
    4 / 16,
    'LUNCH · 25%',
    C.amber
  );

  await until(S(62));
  await play(
    handoff(
      remove(calculator, calcDisplay),
      new M.FadeIn(morningCompare.group),
      new M.FadeIn(lunchCompare.group)
    ),

    new M.FadeOut(boxNow),

    ...say('LUNCH HAS THE SMALLER SHARE', C.amber)
  );

  calculator = null;
  calcDisplay = null;
  boxNow = null;

  // 63. Relative frequency allows fair comparison.
  await until(S(63));
  await play(
    ...say('COMPARE SHARES · NOT JUST COUNTS', C.green),

    new M.Indicate(
      morningCompare.group,
      { color: C.green }
    ),

    new M.Indicate(
      lunchCompare.group,
      { color: C.green }
    )
  );

  // ------------------------------------------------------------
  // 64-69: A small-group trap and the recap.
  // ------------------------------------------------------------

  // 64. A share can hide the group size.
  await until(S(64));
  await play(
    ...say('ONE TRAP · A SHARE HIDES GROUP SIZE', C.amber),

    ...fbox([
      ['Always check the total', C.amber]
    ], C.amber)
  );

  // 65. Imagine a rainy morning with two customers.
  //
  // Separate vertical slots for:
  //   Rainy title
  //   Customer dots
  //   Six-minute label
  //   Share-bar caption
  //   Share bar
  //
  // The formula remains in its own lane.

  const rainyX = CX;
  const rainyY = P ? -1.4 : 0.45;

  const rainyTitleY = P ? -0.1 : 1.20;
  const sixY = P ? -2.3 : -0.25;

  const rainyDots = [];

  for (let i = 0; i < 2; i++) {
    const d = new M.Dot({
      point: [
        rainyX + (i - 0.5) * (P ? 1.4 : 1.0),
        rainyY,
        0
      ],

      radius: P ? 0.45 : 0.24,
      color: i === 0 ? C.cyan : C.muted
    });

    d.setFill(
      i === 0 ? C.cyan : C.muted,
      0.9
    );

    rainyDots.push(d);
  }

  const rainyTitle = fitText(
    'RAINY MORNING · 2 CUSTOMERS',
    P ? 18 : 20,
    C.cyan,
    P ? 6.2 : 5.1
  );

  rainyTitle.moveTo([
    rainyX,
    rainyTitleY,
    0
  ]);

  const rainyGroup = new M.VGroup(
    ...rainyDots,
    rainyTitle
  );

  await until(S(65));
  await play(
    handoff(
      remove(
        morningCompare.group,
        lunchCompare.group
      ),

      new M.FadeIn(rainyGroup)
    ),

    new M.FadeOut(boxNow),

    ...say('A SMALL GROUP · JUST 2 CUSTOMERS')
  );

  boxNow = null;

  // 66. One customer waited six minutes.
  const sixLabel = T(
    '6 MINUTES',
    P ? 20 : 23,
    C.cyan,
    true
  );

  sixLabel.moveTo([
    rainyX,
    sixY,
    0
  ]);

  await until(S(66));
  await play(
    new M.FadeIn(sixLabel),

    new M.Indicate(
      rainyDots[0],
      { color: C.amber }
    ),

    ...say('ONE CUSTOMER WAITED 6 MINUTES', C.amber)
  );

  // 67. One of two is fifty percent.
  const rainyShare = makeShareBar(
    P ? [0, -3.6, 0] : [CX, -1.85, 0],
    1 / 2,
    '1 OF 2 = 50%',
    C.amber
  );

  await until(S(67));
  await play(
    new M.FadeIn(rainyShare.group),

    ...fbox([
      ['1 ÷ 2', C.ink],
      ['= 50%', C.green]
    ], C.green),

    ...say('HALF THE GROUP · FROM ONE PERSON')
  );

  // 68. Always check the total.
  await until(S(68));
  await play(
    ...say('NEVER READ A SHARE ALONE', C.amber),

    ...fbox([
      ['Share = 50%', C.green],
      ['Total = 2 customers', C.ink],
      ['Always check both', C.amber]
    ], C.amber)
  );

  // 69. Recap.
  //
  // The previous formula must be faded by fbox() itself.
  // Do not schedule a second FadeOut for the same object.

  const recapBar = replaceBar(3, '3 OF 8 = 3 ÷ 8 = 37.5%', C.cyan);

  await until(S(69));
  await play(
    handoff(
      remove(rainyGroup, sixLabel, rainyShare.group),
      ...recapBar
    ),

    ...say(
      'RELATIVE FREQUENCY = COUNT ÷ TOTAL',
      C.green
    ),

    ...fbox([
      ['Count', C.cyan],
      ['÷ total', C.ink],
      ['= share of the whole group', C.green],
      ['× 100 = percent', C.amber]
    ], C.green)
  );
}
