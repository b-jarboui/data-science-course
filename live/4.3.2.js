// lesson 4.3.2
// Probability mass function: how likely is each possible payout?
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine interface; browser playback not runtime-tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E, T, pill,
    show, showA, until, play, LINE_Y
  } = L;

  // Shared chapter data
  const NAMES = ['Grey', 'Blue one', 'Blue two', 'Gold'];
  const SHORT = ['GREY', 'BLUE 1', 'BLUE 2', 'GOLD'];
  const PAY = [0, 2, 2, 4];
  const VALUES = [0, 2, 4];
  const PROBS = [0.25, 0.50, 0.25];
  const FRACTIONS = ['1/4', '1/2', '1/4'];

  const GREY = '#94A3B8';
  const BLUE = '#3B82F6';
  const GOLD = '#FBBF24';
  const COL = [GREY, BLUE, BLUE, GOLD];

  // Laptop + phone layout, following lesson 4.3.1.
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.3, -0.3, 0];

  const WY = P ? -0.35 : -0.25;
  const R = P ? 1.65 : 1.35;

  const BASE = P ? -4.9 : -2.10;
  const PLOTW = P ? 5.9 : 6.2;
  const BARW = P ? 0.90 : 0.80;
  const QH = P ? 1.95 : 1.10;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const fade = (...objects) => objects
    .flat(Infinity)
    .filter(Boolean)
    .map(o => new M.FadeOut(o));

  const appear = (...objects) => objects
    .flat(Infinity)
    .filter(Boolean)
    .map(o => new M.FadeIn(o));

  const rad = d => d * Math.PI / 180;

  // ----------------------------------------------------------
  // Shared drawing helpers.
  // ----------------------------------------------------------

  function txt(s, size, color, x, y, mono = false) {
    const t = T(String(s), size, color, mono);
    t.moveTo([x, y, 0]);
    return t;
  }

  function line(a, b, color = C.muted, sw = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: sw
    });
  }

  function rect(w, h, x, y, color, opacity = 0.12, sw = 2) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function circle(r, x, y, color, opacity = 0, sw = 2) {
    const c = new M.Circle({
      radius: r,
      color,
      strokeWidth: sw
    });

    c.setFill(color, opacity);
    c.moveTo([x, y, 0]);

    return c;
  }

  function tag(s, color, x, y, size = 17) {
    const p = pill(s, color, size);
    p.moveTo([x, y, 0]);
    return p;
  }

  function polar(cx, cy, r, a) {
    return [
      cx + r * Math.cos(a),
      cy + r * Math.sin(a),
      0
    ];
  }

  function arrow(a, b, color = C.cyan, sw = 3, tip = 0.16) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.hypot(dx, dy);
    const ux = dx / d;
    const uy = dy / d;

    const p1 = [
      b[0] - ux * tip - uy * tip * 0.55,
      b[1] - uy * tip + ux * tip * 0.55,
      0
    ];

    const p2 = [
      b[0] - ux * tip + uy * tip * 0.55,
      b[1] - uy * tip - ux * tip * 0.55,
      0
    ];

    return new M.VGroup(
      line(a, b, color, sw),
      line(b, p1, color, sw),
      line(b, p2, color, sw)
    );
  }

  // ----------------------------------------------------------
  // Formula box, following the approved reference lesson.
  // ----------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw = T(
      '0000000000',
      size,
      C.ink,
      true
    ).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      )
    );

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.4;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.2 - lh / 2;

    texts.forEach((t, i) => {
      const ind = cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      );

      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 1.9 : 3.6;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) g.scale(scale);
    g.moveTo(BOXP);

    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const a = [new M.FadeOut(boxNow)];
    boxNow = null;

    return a;
  }

  // ----------------------------------------------------------
  // Gold token coins: same appearance as lesson 4.3.1.
  // ----------------------------------------------------------

  function coin(x, y, r = 0.16) {
    const glow = circle(
      r * 1.45,
      x, y,
      GOLD,
      0.11,
      0
    );

    const face = circle(
      r,
      x, y,
      GOLD,
      0.88,
      2
    );

    const rim = circle(
      r * 0.73,
      x, y,
      '#FFF0B3',
      0,
      1
    );

    const mark = line(
      [x, y - r * 0.35, 0],
      [x, y + r * 0.35, 0],
      '#FFF0B3',
      2
    );

    return new M.VGroup(glow, face, rim, mark);
  }

  function coins(n, x, y, r = 0.15) {
    if (n === 0) {
      return txt('0', 26, C.muted, x, y, true);
    }

    const gap = r * 2.65;

    return new M.VGroup(
      ...Array.from({ length: n }, (_, k) =>
        coin(
          x + (k - (n - 1) / 2) * gap,
          y,
          r
        )
      )
    );
  }

  // ----------------------------------------------------------
  // Spinner: four equal quarters.
  //
  // Grey:     upper right
  // Blue one: upper left
  // Blue two: lower left
  // Gold:     lower right
  // ----------------------------------------------------------

  function sector(k, cx = CX, cy = WY, r = R) {
    const start = k * Math.PI / 2;
    const end = start + Math.PI / 2;

    const points = [[cx, cy, 0]];

    for (let j = 0; j <= 32; j++) {
      points.push(
        polar(
          cx,
          cy,
          r,
          start + (end - start) * j / 32
        )
      );
    }

    const s = new M.Polygon({
      vertices: points,
      color: C.card,
      strokeWidth: 2
    });

    s.setFill(COL[k], 0.87);

    // small gap between slices so all four (two blues touch) are visible
    if (r > 0.6) {
      const mid = start + Math.PI / 4, g = 0.05;
      s.moveTo([s.getCenter()[0] + g * Math.cos(mid), s.getCenter()[1] + g * Math.sin(mid), 0]);
    }

    return s;
  }

  function needle(a, cx = CX, cy = WY, r = R) {
    return arrow(
      polar(cx, cy, r * 0.03, a),
      polar(cx, cy, r * 0.89, a),
      C.ink,
      5,
      r * 0.17
    );
  }

  const slices = COL.map((_, k) => sector(k));

  const rim = circle(
    R + 0.015,
    CX,
    WY,
    C.ink,
    0,
    2.5
  );

  const pointer = needle(rad(12));

  const hub = circle(
    R * 0.075,
    CX,
    WY,
    C.ink,
    1,
    1
  );

  // dark dividing lines so all four slices are visible (two blues touch)
  const dividers = [
    line([CX - R, WY, 0], [CX + R, WY, 0], C.bg, 4),
    line([CX, WY - R, 0], [CX, WY + R, 0], C.bg, 4)
  ];

  const spinner = new M.VGroup(
    ...slices,
    ...dividers,
    rim,
    pointer,
    hub
  );

  const sliceNames = SHORT.map((s, k) => {
    const p = polar(
      CX,
      WY,
      R * 0.66,
      rad(45 + 90 * k)
    );

    return txt(
      s,
      P ? 16 : 15,
      '#FFFFFF',
      p[0],
      p[1]
    );
  });

  // ----------------------------------------------------------
  // 0. Back to the booth with the spinner.
  // ----------------------------------------------------------

  const boothLabel = tag(
    'SCHOOL FAIR',
    C.muted,
    CX,
    P ? -2.75 : -2.05,
    17
  );

  await until(S(0));
  await play(
    new M.FadeIn(spinner, { runTime: 0.7 }),
    new M.FadeIn(boothLabel, { runTime: 0.7 }),
    ...say('BACK AT THE SPINNER BOOTH')
  );

  // ----------------------------------------------------------
  // 1. Four equal slices: grey, blue, blue and gold.
  // ----------------------------------------------------------

  await until(S(1));
  await play(
    new M.LaggedStart(
      sliceNames.map(t => new M.FadeIn(t)),
      {
        lagRatio: 0.22,
        runTime: 1.5
      }
    ),
    ...say('4 EQUAL SLICES')
  );

  // ----------------------------------------------------------
  // 2. Grey pays 0, blue pays 2, gold pays 4.
  // ----------------------------------------------------------

  const payoutY = P ? -3.45 : -2.23;
  const payoutGap = P ? 2.02 : 2.05;

  function payoutCard(k, value, label, color) {
    const x = CX + (k - 1) * payoutGap;
    const h = P ? 1.35 : 1.05;

    const r = rect(
      1.89,
      h,
      x,
      payoutY,
      color,
      0.10
    );

    const title = txt(
      label,
      16,
      color === BLUE ? '#93C5FD' : color,
      x,
      payoutY + h / 2 - 0.22
    );

    const tokens = coins(
      value,
      x,
      payoutY - 0.02,
      value === 4 ? 0.12 : 0.16
    );

    const valueLabel = txt(
      `${value} tokens`,
      15,
      C.ink,
      x,
      payoutY - h / 2 + 0.16,
      true
    );

    return new M.VGroup(
      r,
      title,
      tokens,
      valueLabel
    );
  }

  const payoutCards = [
    payoutCard(0, 0, 'GREY', GREY),
    payoutCard(1, 2, 'EITHER BLUE', BLUE),
    payoutCard(2, 4, 'GOLD', GOLD)
  ];

  await until(S(2));
  await play(
    ...fade(boothLabel),
    new M.LaggedStart(
      payoutCards.map(c => new M.FadeIn(c)),
      {
        lagRatio: 0.25,
        runTime: 2.0
      }
    ),
    ...say('COLOUR → TOKENS')
  );

  // ----------------------------------------------------------
  // 3. X is the round-one payout.
  // ----------------------------------------------------------

  await until(S(3));
  await play(
    ...say('X = ROUND ONE PAYOUT'),
    ...fbox([
      ['X', C.cyan],
      'round one payout',
      ['possible: 0, 2, 4', GOLD]
    ])
  );

  // ----------------------------------------------------------
  // 4. New question: how likely is each payout?
  // ----------------------------------------------------------

  await until(S(4));
  await play(
    new M.LaggedStart(
      payoutCards.map(c =>
        new M.Indicate(c, { color: C.amber })
      ),
      {
        lagRatio: 0.15,
        runTime: 1.5
      }
    ),
    ...say('HOW LIKELY IS EACH PAYOUT?', C.amber),
    ...fbox([
      '0 tokens: ?',
      '2 tokens: ?',
      '4 tokens: ?'
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 5. Each of the four slices has chance 1/4.
  // ----------------------------------------------------------

  const sliceChances = COL.map((_, k) => {
    const p = polar(
      CX,
      WY,
      R * 0.60,
      rad(45 + 90 * k)
    );

    return txt(
      '1/4',
      P ? 24 : 22,
      '#FFFFFF',
      p[0],
      p[1],
      true
    );
  });

  await until(S(5));
  await play(
    ...fade(sliceNames),
    new M.LaggedStart(
      sliceChances.map(t => new M.FadeIn(t)),
      {
        lagRatio: 0.14,
        runTime: 1.4
      }
    ),
    ...say('EACH SLICE: 1 IN 4', C.amber),
    ...fbox([
      '4 equal slices',
      ['1/4 chance each', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // Number line: payouts 0 through 4.
  // The possible payouts are only 0, 2 and 4.
  // ----------------------------------------------------------

  const x2p = v =>
    CX - PLOTW / 2 + 0.68 +
    v / 4 * (PLOTW - 1.36);

  function makeAxis() {
    const axis = line(
      [CX - PLOTW / 2, BASE, 0],
      [CX + PLOTW / 2, BASE, 0],
      C.muted,
      2.5
    );

    const ticks = [0, 1, 2, 3, 4].map(v => {
      const x = x2p(v);
      const possible = v % 2 === 0;

      return new M.VGroup(
        line(
          [x, BASE - 0.07, 0],
          [x, BASE + 0.07, 0],
          possible ? C.ink : C.muted,
          possible ? 2 : 1
        ),
        txt(
          String(v),
          possible ? 20 : 17,
          possible ? C.ink : C.muted,
          x,
          BASE - 0.30,
          true
        )
      );
    });

    const unit = txt(
      'payout X (tokens)',
      17,
      C.muted,
      CX,
      BASE - 0.75
    );

    return {
      axis,
      ticks,
      unit
    };
  }

  let plot = makeAxis();

  const axisParts = p => [
    p.axis,
    ...p.ticks,
    p.unit
  ];

  // A quarter-slice tile carries its own 1/4 chance.
  const CHIPW = P ? 1.40 : 1.43;
  const CHIPH = P ? 0.79 : 0.70;

  function sliceChip(k, x, y) {
    const r = rect(
      CHIPW,
      CHIPH,
      x,
      y,
      COL[k],
      0.16
    );

    const wedge = sector(k, 0, 0, 0.30);
    wedge.moveTo([x - 0.43, y - 0.12, 0]);

    const label = txt(
      SHORT[k],
      15,
      COL[k] === BLUE ? '#93C5FD' : COL[k],
      x,
      y + 0.19
    );

    const chance = txt(
      '1/4',
      19,
      C.ink,
      x + 0.16,
      y - 0.12,
      true
    );

    return new M.VGroup(
      r,
      wedge,
      label,
      chance
    );
  }

  const SOURCE_Y = P ? 0.95 : 0.90;
  const SOURCE_GAP = P ? 1.58 : 1.57;

  const sourceX = k =>
    CX + (k - 1.5) * SOURCE_GAP;

  const stackPitch = P ? 1.0 : 0.86;

  const chipSlot = (v, j) => [
    x2p(v),
    BASE + 0.60 + j * stackPitch,
    0
  ];

  const chips = COL.map((_, k) =>
    sliceChip(k, sourceX(k), SOURCE_Y)
  );

  // ----------------------------------------------------------
  // 6. Place each slice above its numerical payout.
  // ----------------------------------------------------------

  await until(S(6));
  await play(
    ...fade(
      spinner,
      sliceChances,
      payoutCards
    ),
    ...clearBox(),
    new M.Create(plot.axis),
    ...appear(plot.ticks, plot.unit),
    new M.LaggedStart(
      chips.map(c => new M.FadeIn(c)),
      {
        lagRatio: 0.12,
        runTime: 1.0
      }
    ),
    ...say('PLACE EACH SLICE ABOVE ITS PAYOUT')
  );

  // ----------------------------------------------------------
  // 7. Above zero: one grey slice.
  // ----------------------------------------------------------

  const greySlot = chipSlot(0, 0);

  await until(S(7));
  await play(
    new M.Transform(
      chips[0],
      sliceChip(0, greySlot[0], greySlot[1]),
      {
        pathArc: -0.30,
        runTime: 0.9
      }
    ),
    ...say('0 TOKENS: ONE GREY SLICE', GREY)
  );

  // ----------------------------------------------------------
  // 8. Above two: two blue slices.
  // ----------------------------------------------------------

  const blueSlot1 = chipSlot(2, 0);
  const blueSlot2 = chipSlot(2, 1);

  await until(S(8));
  await play(
    new M.LaggedStart(
      [
        new M.Transform(
          chips[1],
          sliceChip(1, blueSlot1[0], blueSlot1[1]),
          { pathArc: -0.40 }
        ),
        new M.Transform(
          chips[2],
          sliceChip(2, blueSlot2[0], blueSlot2[1]),
          { pathArc: 0.40 }
        )
      ],
      {
        lagRatio: 0.2,
        runTime: 1.4
      }
    ),
    ...say('2 TOKENS: TWO BLUE SLICES', BLUE)
  );

  // ----------------------------------------------------------
  // 9. Above four: one gold slice.
  // ----------------------------------------------------------

  const goldSlot = chipSlot(4, 0);

  await until(S(9));
  await play(
    new M.Transform(
      chips[3],
      sliceChip(3, goldSlot[0], goldSlot[1]),
      {
        pathArc: 0.30,
        runTime: 0.9
      }
    ),
    ...say('4 TOKENS: ONE GOLD SLICE', GOLD)
  );

  // ----------------------------------------------------------
  // 10. Pour the chances together, payout by payout.
  //
  // Each block is exactly one quarter of the whole chance.
  // There are four equal blocks, stacked 1, 2, 1.
  // ----------------------------------------------------------

  function quarterBlock(v, j, color) {
    const x = x2p(v);
    const y = BASE + (j + 0.5) * QH;

    const glow = new M.Rectangle({
      width: BARW + 0.20,
      height: QH + 0.02,
      color,
      strokeWidth: 0
    });

    glow.setFill(color, 0.08);
    glow.moveTo([x, y, 0]);

    const b = new M.Rectangle({
      width: BARW,
      height: QH - 0.06,
      color,
      strokeWidth: 2
    });

    b.setFill(color, 0.78);
    b.moveTo([x, y, 0]);

    const label = txt(
      '1/4',
      P ? 23 : 20,
      C.ink,
      x,
      y,
      true
    );

    return new M.VGroup(
      glow,
      b,
      label
    );
  }

  const blocks = [
    quarterBlock(0, 0, GREY),
    quarterBlock(2, 0, BLUE),
    quarterBlock(2, 1, BLUE),
    quarterBlock(4, 0, GOLD)
  ];

  await until(S(10));
  await play(
    new M.LaggedStart(
      chips.map((c, k) =>
        new M.Transform(c, blocks[k])
      ),
      {
        lagRatio: 0.18,
        runTime: 2.6
      }
    ),
    ...say('SAME PAYOUT? ADD ITS CHANCES', C.violet),
    ...fbox([
      'one slice = 1/4',
      ['pool by payout', C.violet]
    ], C.violet)
  );

  // The transformed chip objects remain the live objects.
  // Do not regroup them or replace their references.

  const pileLabels = [
    txt(
      '1/4',
      24,
      GREY,
      x2p(0),
      BASE + QH + 0.34,
      true
    ),
    txt(
      '2/4 = 1/2',
      P ? 21 : 19,
      BLUE,
      x2p(2),
      BASE + 2 * QH + 0.34,
      true
    ),
    txt(
      '1/4',
      24,
      GOLD,
      x2p(4),
      BASE + QH + 0.34,
      true
    )
  ];

  // ----------------------------------------------------------
  // 11. Zero tokens: one slice, one quarter.
  // ----------------------------------------------------------

  await until(S(11));
  await play(
    new M.Indicate(chips[0], { color: GREY }),
    new M.FadeIn(pileLabels[0]),
    ...say('ZERO: ONE SLICE', GREY),
    ...fbox([
      '0 tokens',
      ['chance = 1/4', GREY]
    ], GREY)
  );

  // ----------------------------------------------------------
  // 12. Two tokens: two slices, two quarters, one half.
  // ----------------------------------------------------------

  await until(S(12));
  await play(
    new M.LaggedStart(
      [
        new M.Indicate(chips[1], { color: BLUE }),
        new M.Indicate(chips[2], { color: BLUE })
      ],
      {
        lagRatio: 0.40,
        runTime: 2.0
      }
    ),
    new M.FadeIn(pileLabels[1]),
    ...say('TWO: ADD BOTH BLUE CHANCES', BLUE),
    ...fbox([
      '2 tokens',
      ['1/4 + 1/4 = 2/4', BLUE],
      ['2/4 = 1/2', C.amber]
    ], BLUE)
  );

  // ----------------------------------------------------------
  // 13. Four tokens: one slice, one quarter.
  // ----------------------------------------------------------

  await until(S(13));
  await play(
    new M.Indicate(chips[3], { color: GOLD }),
    new M.FadeIn(pileLabels[2]),
    ...say('FOUR: ONE SLICE', GOLD),
    ...fbox([
      '4 tokens',
      ['chance = 1/4', GOLD]
    ], GOLD)
  );

  // ----------------------------------------------------------
  // Probability bars.
  //
  // Height represents probability, not the payout itself.
  // One quarter has height QH.
  // One half has height 2 * QH.
  // ----------------------------------------------------------

  function probabilityBar(
    v,
    probability,
    label,
    color = C.cyan
  ) {
    const x = x2p(v);
    const h = probability * 4 * QH;

    const glow = new M.Rectangle({
      width: BARW + 0.22,
      height: h + 0.04,
      color,
      strokeWidth: 0
    });

    glow.setFill(color, 0.10);
    glow.moveTo([
      x,
      BASE + h / 2,
      0
    ]);

    const body = new M.Rectangle({
      width: BARW,
      height: h,
      color,
      strokeWidth: 2
    });

    body.setFill(color, 0.74);
    body.moveTo([
      x,
      BASE + h / 2,
      0
    ]);

    const lab = txt(
      label,
      P ? 24 : 22,
      color,
      x,
      BASE + h + 0.30,
      true
    );

    return {
      body: new M.VGroup(glow, body),
      label: lab,
      height: h
    };
  }

  function makeBars(
    probabilities = PROBS,
    labels = FRACTIONS,
    color = C.cyan
  ) {
    return VALUES.map((v, k) =>
      probabilityBar(
        v,
        probabilities[k],
        labels[k],
        color
      )
    );
  }

  const bodies = bars => bars.map(b => b.body);
  const labels = bars => bars.map(b => b.label);

  const barParts = bars => bars.flatMap(b => [
    b.body,
    b.label
  ]);

  let bars = makeBars();

  // ----------------------------------------------------------
  // 14. Draw each chance as a glowing bar.
  // ----------------------------------------------------------

  await until(S(14));
  await play(
    ...fade(chips, pileLabels),
    ...appear(bodies(bars)),
    ...say('HEIGHT SHOWS CHANCE'),
    ...fbox([
      'bar height',
      ['= probability', C.cyan]
    ])
  );

  // ----------------------------------------------------------
  // 15. Short, twice as tall, short.
  // ----------------------------------------------------------

  await until(S(15));
  await play(
    new M.LaggedStart(
      labels(bars).map(t => new M.FadeIn(t)),
      {
        lagRatio: 0.25,
        runTime: 1.2
      }
    ),
    new M.Indicate(bars[1].body, {
      color: C.amber,
      runTime: 1.4
    }),
    ...say('THE MIDDLE BAR IS TWICE AS TALL')
  );

  // ----------------------------------------------------------
  // 16. Add the three chances: 1/4 + 1/2 + 1/4 = 1.
  // ----------------------------------------------------------

  await until(S(16));
  await play(
    new M.LaggedStart(
      labels(bars).map(t =>
        new M.Indicate(t, { color: C.amber })
      ),
      {
        lagRatio: 0.30,
        runTime: 2.2
      }
    ),
    ...say('ADD ALL THE CHANCES', C.amber),
    ...fbox([
      '1/4 + 1/2 + 1/4',
      '= 1/4 + 2/4 + 1/4',
      ['= 1', C.green]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 17. A total probability of 1 means certain.
  // ----------------------------------------------------------

  const certain = tag(
    'TOTAL CHANCE = 1',
    C.green,
    CX,
    P ? 0.80 : 1.05,
    17
  );

  await until(S(17));
  await play(
    new M.FadeIn(certain),
    ...say('1 MEANS CERTAIN', C.green),
    ...fbox([
      'one of these payouts',
      ['must happen', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 18. Name the picture: probability mass function.
  // ----------------------------------------------------------

  await until(S(18));
  await play(
    ...fade(certain),
    ...say('PROBABILITY MASS FUNCTION', C.green),
    ...fbox([
      ['probability', C.green],
      ['mass function', C.green],
      'values + chances'
    ], C.green)
  );

  // ----------------------------------------------------------
  // 19. Probability means chance. Mass is like weight.
  // ----------------------------------------------------------

  await until(S(19));
  await play(
    ...say('PROBABILITY = CHANCE'),
    ...fbox([
      ['probability = chance', C.cyan],
      ['mass = weight', C.violet]
    ])
  );

  // ----------------------------------------------------------
  // 20. One whole unit of chance, split into four equal weights.
  // ----------------------------------------------------------

  const STRIPY = P ? 1.05 : 1.04;
  const STRIPW = P ? 4.8 : 4.6;
  const STRIPH = P ? 0.66 : 0.54;
  const SEGW = STRIPW / 4;

  const stripX = k =>
    CX - STRIPW / 2 + (k + 0.5) * SEGW;

  function chanceSegment(k) {
    const x = stripX(k);

    const r = new M.Rectangle({
      width: SEGW - 0.05,
      height: STRIPH,
      color: COL[k],
      strokeWidth: 2
    });

    r.setFill(COL[k], 0.74);
    r.moveTo([x, STRIPY, 0]);

    const t = txt(
      '1/4',
      19,
      C.ink,
      x,
      STRIPY,
      true
    );

    return new M.VGroup(r, t);
  }

  const strip = COL.map((_, k) =>
    chanceSegment(k)
  );

  const stripOutline = new M.RoundedRectangle({
    width: STRIPW + 0.13,
    height: STRIPH + 0.13,
    cornerRadius: 0.10,
    color: C.violet,
    strokeWidth: 2
  });

  stripOutline.moveTo([CX, STRIPY, 0]);

  await until(S(20));
  await play(
    new M.LaggedStart(
      strip.map(s => new M.FadeIn(s)),
      {
        lagRatio: 0.18,
        runTime: 1.4
      }
    ),
    new M.Create(stripOutline),
    ...say('ONE WHOLE UNIT OF CHANCE', C.violet),
    ...fbox([
      ['1 whole', C.violet],
      '= 4 equal quarters'
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 21. Share the chance-weight among the three payouts.
  // ----------------------------------------------------------

  const middleWeight = new M.RoundedRectangle({
    width: SEGW * 2 + 0.08,
    height: STRIPH + 0.22,
    cornerRadius: 0.10,
    color: C.amber,
    strokeWidth: 2
  });

  middleWeight.moveTo([CX, STRIPY, 0]);

  await until(S(21));
  await play(
    new M.Create(middleWeight),
    new M.LaggedStart(
      [
        new M.Indicate(bars[0].body, { color: GREY }),
        new M.Indicate(bars[1].body, { color: BLUE }),
        new M.Indicate(bars[2].body, { color: GOLD })
      ],
      {
        lagRatio: 0.22,
        runTime: 2.3
      }
    ),
    ...say('CHANCE IS SHARED AS WEIGHT', C.violet),
    ...fbox([
      '0 gets 1/4',
      ['2 gets 1/2', BLUE],
      '4 gets 1/4'
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 22. Connect to relative-frequency bars from earlier lessons.
  // ----------------------------------------------------------

  await until(S(22));
  await play(
    ...fade(strip, stripOutline, middleWeight),
    ...say('THE SAME BAR SHAPE AS RELATIVE FREQUENCY'),
    ...fbox([
      'remember:',
      ['relative frequency', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 23. Relative frequency describes what actually happened.
  //
  // Illustrative observed sample of ten spins:
  // 2 zeros, 5 twos, 3 fours.
  // These are sample counts, not the theoretical probabilities.
  // ----------------------------------------------------------

  let observed = makeBars(
    [0.20, 0.50, 0.30],
    ['2/10', '5/10', '3/10'],
    C.violet
  );

  const observedTag = tag(
    'AFTER 10 EXAMPLE SPINS',
    C.violet,
    CX,
    P ? 0.90 : 1.05,
    16
  );

  await until(S(23));
  await play(
    ...fade(barParts(bars)),
    ...appear(barParts(observed), observedTag),
    ...say('RELATIVE FREQUENCY: AFTER THE FACT', C.violet),
    ...fbox([
      'example observations',
      '2 zeros, 5 twos, 3 fours',
      ['counted after spinning', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 24. Probability describes the expected shares before a spin.
  // ----------------------------------------------------------

  bars = makeBars();

  const beforeTag = tag(
    'BEFORE ANY SPIN',
    C.cyan,
    CX,
    P ? 0.90 : 1.05,
    16
  );

  await until(S(24));
  await play(
    ...fade(barParts(observed), observedTag),
    ...appear(barParts(bars), beforeTag),
    ...say('PROBABILITY: BEFORE THE FACT'),
    ...fbox([
      'probability',
      ['expected share', C.cyan],
      'before spinning'
    ])
  );

  // ----------------------------------------------------------
  // 25. Imagine 100 spins.
  // ----------------------------------------------------------

  const hundredTag = tag(
    '100 SPINS',
    C.amber,
    CX,
    P ? 0.90 : 1.05,
    19
  );

  await until(S(25));
  await play(
    ...fade(beforeTag),
    new M.FadeIn(hundredTag, { runTime: 0.5 }),
    ...say('IMAGINE 100 SPINS', C.amber),
    ...fbox([
      ['100 spins', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 26. Expected counts: about 25, 50, 25.
  // ----------------------------------------------------------

  // counts sit inside the bars (dark text on bright fill), clear of the tags above
  const countLabels = [25, 50, 25].map((n, k) =>
    txt(
      `≈${n}`,
      P ? 24 : 22,
      C.bg,
      x2p(VALUES[k]),
      BASE + bars[k].height / 2,
      true
    )
  );

  await until(S(26));
  await play(
    new M.LaggedStart(
      countLabels.map(t => new M.FadeIn(t)),
      {
        lagRatio: 0.35,
        runTime: 2.2
      }
    ),
    ...say('ABOUT 25 · 50 · 25', GOLD),
    ...fbox([
      '100 × 1/4 = 25',
      '100 × 1/2 = 50',
      ['100 × 1/4 = 25', GOLD]
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 27. Not exactly: observed shares vary.
  //
  // Illustrative observations:
  // 100 spins:  24, 52, 24
  // 1000 spins: 249, 503, 248
  //
  // The examples illustrate long-run convergence.
  // They are not promised counts or a monotonic guarantee.
  // ----------------------------------------------------------

  observed = makeBars(
    [0.24, 0.52, 0.24],
    ['24%', '52%', '24%'],
    C.violet
  );

  const largerSample = makeBars(
    [0.249, 0.503, 0.248],
    ['24.9%', '50.3%', '24.8%'],
    C.violet
  );

  const sample100 = tag(
    'EXAMPLE: 100 SPINS',
    C.violet,
    CX,
    P ? 0.90 : 1.05,
    16
  );

  const sample1000 = tag(
    'EXAMPLE: 1000 SPINS',
    C.violet,
    CX,
    P ? 0.90 : 1.05,
    16
  );

  await until(S(27));
  await play(
    ...fade(barParts(bars), countLabels, hundredTag),
    ...appear(barParts(observed), sample100),
    ...say('NOT EXACTLY: LUCK CHANGES THE COUNTS', C.violet),
    ...fbox([
      'example: 24, 52, 24',
      'not exactly 25, 50, 25'
    ], C.violet)
  );

  await until(S(27) + 2.2);
  await play(
    ...fade(barParts(observed), sample100),
    ...appear(barParts(largerSample), sample1000),
    ...say('MORE SPINS: SHARES TEND TO THE CHANCES', C.green),
    ...fbox([
      'example: 1000 spins',
      '249, 503, 248',
      ['closer to 25%, 50%, 25%', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 28. The short version, in one line.
  // ----------------------------------------------------------

  bars = makeBars();

  await until(S(28));
  await play(
    ...fade(barParts(largerSample), sample1000),
    ...appear(barParts(bars)),
    ...say('THE SHORT VERSION'),
    ...fbox([
      'probability notation'
    ])
  );

  // ----------------------------------------------------------
  // 29. P stands for probability.
  // Write P(X = 2).
  // ----------------------------------------------------------

  await until(S(29));
  await play(
    new M.Indicate(bars[1].body, {
      color: C.amber
    }),
    ...say('P = PROBABILITY', C.amber),
    ...fbox([
      ['P(X = 2)', C.amber],
      'P means probability',
      'X means payout'
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 30. P(X = 2) = 1/2.
  // ----------------------------------------------------------

  function barOutline(k, color = C.amber) {
    const h = bars[k].height;

    const r = new M.RoundedRectangle({
      width: BARW + 0.38,
      height: h + 0.82,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2
    });

    r.moveTo([
      x2p(VALUES[k]),
      BASE + h / 2 + 0.31,
      0
    ]);

    return r;
  }

  let focus = barOutline(1, C.amber);

  await until(S(30));
  await play(
    new M.Create(focus),
    new M.Indicate(bars[1].label, {
      color: C.amber
    }),
    ...say('THE CHANCE THAT X IS TWO', C.amber),
    ...fbox([
      ['P(X = 2) = 1/2', C.amber],
      'chance of 2 tokens'
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 31. P(X = 0) = 1/4.
  // ----------------------------------------------------------

  const focus0 = barOutline(0, C.amber);

  await until(S(31));
  await play(
    new M.Transform(focus, focus0),
    new M.Indicate(bars[0].label, {
      color: C.amber
    }),
    ...say('THE CHANCE THAT X IS ZERO'),
    ...fbox([
      ['P(X = 0) = 1/4', C.cyan]
    ])
  );

  // ----------------------------------------------------------
  // 32. P(X = 4) = 1/4.
  // ----------------------------------------------------------

  const focus4 = barOutline(2, C.amber);

  await until(S(32));
  await play(
    new M.Transform(focus, focus4),
    new M.Indicate(bars[2].label, {
      color: C.amber
    }),
    ...say('THE CHANCE THAT X IS FOUR'),
    ...fbox([
      ['P(X = 4) = 1/4', C.cyan]
    ])
  );

  // ----------------------------------------------------------
  // 33. Rule one: every chance is between zero and one.
  // ----------------------------------------------------------

  const gaugeY = P ? 1.02 : 1.08;
  const gaugeW = P ? 3.8 : 3.7;

  const gx = v =>
    CX - gaugeW / 2 + v * gaugeW;

  const gauge = line(
    [gx(0), gaugeY, 0],
    [gx(1), gaugeY, 0],
    C.green,
    4
  );

  const gaugeEnds = [0, 1].map(v =>
    new M.VGroup(
      circle(
        0.065,
        gx(v),
        gaugeY,
        C.green,
        1,
        1
      ),
      txt(
        String(v),
        17,
        C.green,
        gx(v),
        gaugeY - 0.25,
        true
      )
    )
  );

  const gaugeMarks = [0.25, 0.50].map((v, k) =>
    new M.VGroup(
      circle(
        0.085,
        gx(v),
        gaugeY,
        C.cyan,
        1,
        1
      ),
      txt(
        k === 0 ? '1/4' : '1/2',
        16,
        C.cyan,
        gx(v),
        gaugeY + 0.24,
        true
      )
    )
  );

  await until(S(33));
  await play(
    ...fade(focus),
    new M.Create(gauge),
    ...appear(gaugeEnds, gaugeMarks),
    ...say('RULE 1: EVERY CHANCE IS BETWEEN 0 AND 1', C.green),
    ...fbox([
      ['0 ≤ probability ≤ 1', C.green],
      '0 = impossible',
      '1 = certain'
    ], C.green)
  );

  // ----------------------------------------------------------
  // 34. Rule two: all chances add up to exactly one.
  // ----------------------------------------------------------

  await until(S(34));
  await play(
    ...fade(gauge, gaugeEnds, gaugeMarks),
    new M.LaggedStart(
      labels(bars).map(t =>
        new M.Indicate(t, { color: C.green })
      ),
      {
        lagRatio: 0.15,
        runTime: 1.5
      }
    ),
    ...say('RULE 2: ALL CHANCES ADD UP TO 1', C.green),
    ...fbox([
      '1/4 + 1/2 + 1/4',
      ['= 1', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // Probability table.
  //
  // The same information as the bars, in a compact table.
  // ----------------------------------------------------------

  const TABLEW = P ? 5.4 : 5.5;
  const CELLW = TABLEW / 2;
  const ROWH = P ? 0.94 : 0.76;
  const HEADY = P ? 1.05 : 1.00;

  const tx = k =>
    CX + (k - 0.5) * CELLW;

  const ty = k =>
    HEADY - (k + 1) * ROWH;

  function tableCell(
    s,
    x,
    y,
    color = C.cyan,
    header = false
  ) {
    const r = new M.Rectangle({
      width: CELLW - 0.035,
      height: ROWH - 0.035,
      color,
      strokeWidth: header ? 2 : 1.5
    });

    r.setFill(
      header ? color : C.card,
      header ? 0.20 : 0.88
    );

    r.moveTo([x, y, 0]);

    const t = txt(
      s,
      header ? 18 : 25,
      header ? color : C.ink,
      x,
      y,
      !header
    );

    return new M.VGroup(r, t);
  }

  function makeTable() {
    const header = [
      tableCell(
        'PAYOUT X',
        tx(0),
        HEADY,
        C.cyan,
        true
      ),
      tableCell(
        'CHANCE',
        tx(1),
        HEADY,
        C.cyan,
        true
      )
    ];

    const rows = VALUES.map((v, k) => [
      tableCell(
        String(v),
        tx(0),
        ty(k)
      ),
      tableCell(
        FRACTIONS[k],
        tx(1),
        ty(k)
      )
    ]);

    const total = tag(
      'TOTAL CHANCE = 1',
      C.green,
      CX,
      ty(2) - ROWH * 0.85,
      17
    );

    return {
      header,
      rows,
      total
    };
  }

  const tableParts = t => [
    ...t.header,
    ...t.rows.flat(),
    t.total
  ];

  const table = makeTable();

  // ----------------------------------------------------------
  // 35. The full probability mass function in one small table.
  // ----------------------------------------------------------

  await until(S(35));
  await play(
    ...fade(axisParts(plot), barParts(bars)),
    ...appear(table.header),
    new M.LaggedStart(
      table.rows.flat().map(c => new M.FadeIn(c)),
      {
        lagRatio: 0.10,
        runTime: 1.8
      }
    ),
    new M.FadeIn(table.total),
    ...say('THE FULL PICTURE IN ONE TABLE', C.green),
    ...fbox([
      'probability mass function',
      ['each value + its chance', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 36. How likely is two or more tokens?
  // Include rows for 2 and 4, but not 0.
  // ----------------------------------------------------------

  const atLeastOutline = new M.RoundedRectangle({
    width: TABLEW + 0.15,
    height: 2 * ROWH + 0.10,
    cornerRadius: 0.12,
    color: C.amber,
    strokeWidth: 2.5
  });

  atLeastOutline.moveTo([
    CX,
    (ty(1) + ty(2)) / 2,
    0
  ]);

  await until(S(36));
  await play(
    new M.Create(atLeastOutline),
    new M.LaggedStart(
      [
        new M.Indicate(
          table.rows[1][0],
          { color: C.amber }
        ),
        new M.Indicate(
          table.rows[2][0],
          { color: C.amber }
        )
      ],
      {
        lagRatio: 0.25,
        runTime: 1.6
      }
    ),
    ...say('QUESTION: TWO OR MORE TOKENS?', C.amber),
    ...fbox([
      'X ≥ 2',
      ['include 2 and 4', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 37. Two or more: one half plus one quarter = three quarters.
  // ----------------------------------------------------------

  await until(S(37));
  await play(
    new M.LaggedStart(
      [
        new M.Indicate(
          table.rows[1][1],
          { color: C.amber }
        ),
        new M.Indicate(
          table.rows[2][1],
          { color: C.amber }
        )
      ],
      {
        lagRatio: 0.30,
        runTime: 1.8
      }
    ),
    ...say('ADD THE CHANCES FOR 2 AND 4', C.amber),
    ...fbox([
      'P(X ≥ 2)',
      '= 1/2 + 1/4',
      ['= 3/4', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 38. Common trap:
  // Three different payouts do NOT imply three equal chances.
  // ----------------------------------------------------------

  plot = makeAxis();
  bars = makeBars();

  const falseY = BASE + 4 * QH / 3;

  const falseLine = new M.DashedLine({
    start: [
      CX - PLOTW / 2 + 0.10,
      falseY,
      0
    ],
    end: [
      CX + PLOTW / 2 - 0.10,
      falseY,
      0
    ],
    color: C.amber
  });

  const falseLabel = tag(
    '1/3 EACH? NO.',
    C.amber,
    CX,
    P ? 1.02 : 1.05,
    17
  );

  const falseCross = new M.VGroup(
    line(
      [CX - 0.23, falseY - 0.23, 0],
      [CX + 0.23, falseY + 0.23, 0],
      C.amber,
      4
    ),
    line(
      [CX - 0.23, falseY + 0.23, 0],
      [CX + 0.23, falseY - 0.23, 0],
      C.amber,
      4
    )
  );

  await until(S(38));
  await play(
    ...fade(tableParts(table), atLeastOutline),
    new M.Create(plot.axis),
    ...appear(plot.ticks, plot.unit),
    ...appear(barParts(bars)),
    new M.Create(falseLine),
    new M.FadeIn(falseLabel),
    new M.FadeIn(falseCross),
    ...say('TRAP: 3 VALUES ≠ 3 EQUAL CHANCES', C.amber),
    ...fbox([
      'wrong:',
      ['1/3, 1/3, 1/3', C.amber],
      'count the slices instead'
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 39. Two tokens is twice as likely as zero.
  // Two equal blue slices contribute their chances.
  // ----------------------------------------------------------

  const compareX = x2p(2) + BARW / 2 + 0.31;

  const midDivider = new M.DashedLine({
    start: [
      x2p(2) - BARW / 2,
      BASE + QH,
      0
    ],
    end: [
      x2p(2) + BARW / 2,
      BASE + QH,
      0
    ],
    color: C.ink
  });

  const heightGuide = new M.VGroup(
    line(
      [compareX, BASE + 0.02, 0],
      [compareX, BASE + 2 * QH - 0.02, 0],
      C.amber,
      2
    ),
    line(
      [compareX - 0.08, BASE + 0.02, 0],
      [compareX + 0.08, BASE + 0.02, 0],
      C.amber,
      2
    ),
    line(
      [compareX - 0.08, BASE + 2 * QH - 0.02, 0],
      [compareX + 0.08, BASE + 2 * QH - 0.02, 0],
      C.amber,
      2
    )
  );

  const twiceLabel = txt(
    '2×',
    21,
    C.amber,
    compareX + 0.32,
    BASE + QH,
    true
  );

  const compareChips = [
    sliceChip(
      1,
      CX - 0.84,
      P ? 1.02 : 1.07
    ),
    sliceChip(
      2,
      CX + 0.84,
      P ? 1.02 : 1.07
    )
  ];

  await until(S(39));
  await play(
    ...fade(falseLine, falseLabel, falseCross),
    new M.Create(midDivider),
    new M.Create(heightGuide),
    new M.FadeIn(twiceLabel),
    ...appear(compareChips),
    new M.Indicate(
      bars[1].body,
      { color: C.amber }
    ),
    ...say('TWO TOKENS IS TWICE AS LIKELY', BLUE),
    ...fbox([
      'one grey: 1/4',
      'two blues: 2/4',
      ['1/2 = 2 × 1/4', C.amber]
    ], BLUE)
  );

  // ----------------------------------------------------------
  // 40. Preview the cumulative distribution function.
  // Next time, collect chances from left to right.
  // ----------------------------------------------------------

  const walkY = P ? 1.02 : 1.06;

  const walkArrow = arrow(
    [x2p(0) - 0.20, walkY, 0],
    [x2p(4) + 0.20, walkY, 0],
    C.green,
    3,
    0.20
  );

  const walkLabel = txt(
    'add as we go',
    17,
    C.green,
    CX,
    walkY + 0.28
  );

  await until(S(40));
  await play(
    ...fade(
      midDivider,
      heightGuide,
      twiceLabel,
      compareChips
    ),
    new M.Create(walkArrow),
    new M.FadeIn(walkLabel),
    new M.LaggedStart(
      labels(bars).map(t =>
        new M.Indicate(t, { color: C.green })
      ),
      {
        lagRatio: 0.25,
        runTime: 2.0
      }
    ),
    ...say('NEXT: ADD CHANCES FROM LEFT TO RIGHT', C.green),
    ...fbox([
      'next lesson:',
      ['running total of chances', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 41. Final definition.
  //
  // The probability mass function tells us how likely
  // each possible value of a random variable is.
  // ----------------------------------------------------------

  const finalTag = tag(
    'VALUES + THEIR CHANCES',
    C.green,
    CX,
    P ? 1.02 : 1.05,
    17
  );

  await until(S(41));
  await play(
    ...fade(walkArrow, walkLabel),
    new M.FadeIn(finalTag),
    new M.LaggedStart(
      bars.map(b =>
        new M.Indicate(
          b.label,
          { color: C.green }
        )
      ),
      {
        lagRatio: 0.25,
        runTime: 2.0
      }
    ),
    ...say('PROBABILITY MASS FUNCTION', C.green),
    ...fbox([
      'P(X = 0) = 1/4',
      'P(X = 2) = 1/2',
      'P(X = 4) = 1/4',
      ['total = 1', C.green]
    ], C.green)
  );

  await until(E(41));
}
