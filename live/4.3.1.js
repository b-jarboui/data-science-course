// lesson 4.3.1
// Random variables: a rule that turns each outcome into a number.
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
  const GREY = '#94A3B8';
  const BLUE = '#3B82F6';
  const GOLD = '#FBBF24';
  const PINK = C.pink || '#F472B6';
  const COL = [GREY, BLUE, BLUE, GOLD];

  // Laptop + phone layout
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.3, -0.3, 0];
  const WY = P ? -0.35 : -0.25;
  const R = P ? 1.65 : 1.45;
  const WC = [CX, WY, 0];
  const BASE = P ? -4.2 : -2.35;

  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const rad = d => d * Math.PI / 180;

  const fade = (...objects) => objects
    .flat()
    .filter(Boolean)
    .map(o => new M.FadeOut(o));

  const appear = (...objects) => objects
    .flat()
    .filter(Boolean)
    .map(o => new M.FadeIn(o));

  function txt(s, size, color, x, y, mono = false) {
    const t = T(String(s), size, color, mono);
    t.moveTo([x, y, 0]);
    return t;
  }

  function rect(w, h, x, y, color, opacity = 0.12, sw = 2) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
      color,
      strokeWidth: sw
    });
    r.setFill(color, opacity);
    r.moveTo([x, y, 0]);
    return r;
  }

  function line(a, b, color = C.muted, sw = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: sw
    });
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

  // Coordinate-based arrow: no regrouping of objects already on screen.
  function arrow(a, b, color = C.cyan, sw = 3, tip = 0.15) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.hypot(dx, dy);
    const ux = dx / d;
    const uy = dy / d;

    const back = [
      b[0] - ux * tip,
      b[1] - uy * tip,
      0
    ];

    const shaft = line(a, back, color, sw);

    const head = new M.Polygon({
      vertices: [
        b,
        [
          back[0] - uy * tip * 0.55,
          back[1] + ux * tip * 0.55,
          0
        ],
        [
          back[0] + uy * tip * 0.55,
          back[1] - ux * tip * 0.55,
          0
        ]
      ],
      color,
      strokeWidth: 1
    });

    head.setFill(color, 1);
    return new M.VGroup(shaft, head);
  }

  // Formula box, following the approved reference lesson.
  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (rows[i][0].length - rows[i][0].trimStart().length)
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
    const scale = Math.min(1, maxw / wd, maxh / ht);

    if (scale < 1) g.scale(scale);
    g.moveTo(BOXP);

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

  // Gold token with a soft outer glow and an engraved centre.
  function coin(x, y, r = 0.19) {
    const glow = circle(r * 1.45, x, y, GOLD, 0.11, 0);
    const face = circle(r, x, y, GOLD, 0.88, 2);
    const rim = circle(r * 0.73, x, y, '#FFF0B3', 0, 1);

    const mark = line(
      [x, y - r * 0.35, 0],
      [x, y + r * 0.35, 0],
      '#FFF0B3',
      2
    );

    return new M.VGroup(glow, face, rim, mark);
  }

  function coins(n, x, y, r = 0.17) {
    const gap = r * 2.65;

    if (n === 0) {
      return txt('0', 26, C.muted, x, y, true);
    }

    return new M.VGroup(
      ...Array.from({ length: n }, (_, i) =>
        coin(x + (i - (n - 1) / 2) * gap, y, r)
      )
    );
  }

  // Spinner sectors are exactly one quarter of the same circle.
  // Grey:     upper right
  // Blue one: upper left
  // Blue two: lower left
  // Gold:     lower right
  function polar(cx, cy, r, a) {
    return [
      cx + r * Math.cos(a),
      cy + r * Math.sin(a),
      0
    ];
  }

  function sector(k, cx = CX, cy = WY, r = R, color = COL[k]) {
    const start = k * Math.PI / 2;
    const end = start + Math.PI / 2;
    const points = [[cx, cy, 0]];

    for (let j = 0; j <= 32; j++) {
      points.push(
        polar(cx, cy, r, start + (end - start) * j / 32)
      );
    }

    const s = new M.Polygon({
      vertices: points,
      color: C.card,
      strokeWidth: 2
    });

    s.setFill(color, 0.87);
    return s;
  }

  function needle(a, cx = CX, cy = WY, r = R) {
    return arrow(
      polar(cx, cy, r * 0.04, a),
      polar(cx, cy, r * 0.88, a),
      C.ink,
      5,
      r * 0.18
    );
  }

  function wheelFace(cx = CX, cy = WY, r = R) {
    const slices = COL.map((_, k) => sector(k, cx, cy, r));

    const rim = circle(
      r + 0.015, cx, cy, C.ink, 0, 2.5
    );

    // dark dividing lines so the two touching blue slices stay separate
    const div = [
      line([cx - r, cy, 0], [cx + r, cy, 0], C.bg, 3),
      line([cx, cy - r, 0], [cx, cy + r, 0], C.bg, 3)
    ];

    return new M.VGroup(...slices, ...div, rim);
  }

  function hub(cx = CX, cy = WY, r = R) {
    return circle(r * 0.075, cx, cy, C.ink, 1, 1);
  }

  function miniatureWheel(cx, cy, r, angle = rad(45)) {
    return new M.VGroup(
      wheelFace(cx, cy, r),
      needle(angle, cx, cy, r),
      hub(cx, cy, r)
    );
  }

  function outcomeChip(k, x, y, w = 1.9, h = 0.63) {
    const r = rect(w, h, x, y, COL[k], 0.15);

    const d = circle(
      0.13,
      x - w / 2 + 0.24,
      y,
      COL[k],
      1,
      1
    );

    const label = txt(
      NAMES[k],
      P ? 18 : 19,
      C.ink,
      x + 0.12,
      y
    );

    return new M.VGroup(r, d, label);
  }

  // ----------------------------------------------------------
  // 0. A game booth at a school fair.
  // ----------------------------------------------------------

  const boothY = P ? -0.3 : -0.45;
  const boothW = P ? 4.4 : 4.1;
  const boothH = 2.4;

  const boothBody = rect(
    boothW,
    boothH,
    CX,
    boothY,
    C.cyan,
    0.08
  );

  const boothWindow = rect(
    boothW - 0.65,
    1.1,
    CX,
    boothY + 0.23,
    C.muted,
    0.08
  );

  const canopy = [];

  for (let k = 0; k < 8; k++) {
    const w = boothW / 8;

    const r = new M.Rectangle({
      width: w - 0.025,
      height: 0.48,
      color: k % 2 ? C.ink : C.cyan,
      strokeWidth: 1
    });

    r.setFill(k % 2 ? C.ink : C.cyan, 0.85);

    r.moveTo([
      CX - boothW / 2 + (k + 0.5) * w,
      boothY + boothH / 2,
      0
    ]);

    canopy.push(r);
  }

  const counter = rect(
    boothW + 0.18,
    0.17,
    CX,
    boothY - 0.48,
    C.cyan,
    0.85
  );

  const boothSign = txt(
    'SPINNER GAME',
    23,
    C.ink,
    CX,
    boothY - 0.85
  );

  const boothWheel = miniatureWheel(
    CX,
    boothY + 0.23,
    0.47
  );

  const booth = new M.VGroup(
    boothBody,
    boothWindow,
    ...canopy,
    counter,
    boothSign,
    boothWheel
  );

  await until(S(0));
  await play(
    new M.FadeIn(booth, { runTime: 0.8 }),
    ...say('SCHOOL FAIR')
  );

  // ----------------------------------------------------------
  // 1. A flat wheel with an arrow in the middle.
  // ----------------------------------------------------------

  const neutralWheel = circle(
    R, CX, WY, C.muted, 0.12, 3
  );

  const firstNeedle = needle(rad(45));
  const firstHub = hub();

  await until(S(1));
  await play(
    ...fade(booth),
    new M.Create(neutralWheel),
    new M.FadeIn(firstNeedle),
    new M.FadeIn(firstHub),
    ...say('THE SPINNER')
  );

  // ----------------------------------------------------------
  // 2. Four equal slices.
  // ----------------------------------------------------------

  const divisions = [
    line(
      [CX - R, WY, 0],
      [CX + R, WY, 0],
      C.muted,
      2
    ),
    line(
      [CX, WY - R, 0],
      [CX, WY + R, 0],
      C.muted,
      2
    )
  ];

  await until(S(2));
  await play(
    ...divisions.map(d => new M.Create(d)),
    ...say('4 EQUAL SLICES')
  );

  // ----------------------------------------------------------
  // 3. One grey, two blue, one gold.
  // ----------------------------------------------------------

  const face = wheelFace();
  // needle sits between slice labels so it never covers a word
  let pointer = needle(rad(15));
  const centreHub = hub();

  const sliceNames = SHORT.map((s, k) => {
    const p = polar(CX, WY, R * 0.67, rad(45 + 90 * k));

    return txt(
      s,
      P ? 16 : 15,
      '#FFFFFF',
      p[0],
      p[1]
    );
  });

  const spinner = new M.VGroup(
    face,
    ...sliceNames,
    pointer,
    centreHub
  );

  await until(S(3));
  await play(
    ...fade(neutralWheel, firstNeedle, firstHub, divisions),
    new M.FadeIn(spinner),
    ...say('GREY · BLUE · BLUE · GOLD')
  );

  // ----------------------------------------------------------
  // 4. Flick the arrow: fast, then slowing to a stop.
  // Deterministic example spin for reliable seeking and replay.
  // Stops on Blue one (135 degrees).
  // ----------------------------------------------------------

  await until(S(4));
  await play(
    new M.Rotate(pointer, {
      angle: 4 * Math.PI + rad(157),
      aboutPoint: WC,
      runTime: Math.max(1.8, E(4) - S(4) - 0.35),
      rateFunc: t => 1 - Math.pow(1 - t, 3)
    }),
    ...say('SPIN!')
  );

  // ----------------------------------------------------------
  // 5. Each slice has one chance in four.
  // ----------------------------------------------------------

  const chanceLabels = COL.map((color, k) => {
    const p = polar(CX, WY, R * 0.42, rad(45 + 90 * k));

    return txt(
      '1/4',
      P ? 20 : 18,
      C.ink,
      p[0],
      p[1],
      true
    );
  });

  await until(S(5));
  await play(
    ...appear(chanceLabels),
    ...say('EACH SLICE: 1 IN 4', C.amber),
    ...fbox([
      '4 equal slices',
      ['chance = 1/4 each', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 6. Introduce the gold token coin.
  // ----------------------------------------------------------

  const tokenY = P ? -3.3 : -2.25;

  const tokenExample = coin(CX - 0.6, tokenY, 0.28);
  const tokenLabel = txt(
    '1 token',
    21,
    GOLD,
    CX + 0.48,
    tokenY
  );

  await until(S(6));
  await play(
    ...fade(chanceLabels),
    ...clearBox(),
    new M.FadeIn(tokenExample),
    new M.FadeIn(tokenLabel),
    ...say('WIN TOKENS', GOLD)
  );

  // ----------------------------------------------------------
  // 7-9. Show the three payouts as actual coins.
  // ----------------------------------------------------------

  const px = k => CX + (k - 1) * (P ? 2.05 : 2.05);
  const py = P ? -3.35 : -2.25;

  function payoutCard(k, value, label, color) {
    const x = px(k);

    const r = rect(
      P ? 1.9 : 1.9,
      P ? 1.35 : 1.0,
      x,
      py,
      color,
      0.10
    );

    const title = txt(
      label,
      16,
      color === BLUE ? '#93C5FD' : color,
      x,
      py + (P ? 0.40 : 0.29)
    );

    const tokens = coins(
      value,
      x,
      py - 0.02,
      value === 4 ? 0.12 : 0.17
    );

    const valueLabel = txt(
      `${value} tokens`,
      16,
      C.ink,
      x,
      py - (P ? 0.47 : 0.33),
      true
    );

    return new M.VGroup(r, title, tokens, valueLabel);
  }

  const greyCard = payoutCard(0, 0, 'GREY', GREY);
  const blueCard = payoutCard(1, 2, 'EITHER BLUE', BLUE);
  const goldCard = payoutCard(2, 4, 'GOLD', GOLD);

  await until(S(7));
  await play(
    ...fade(tokenExample, tokenLabel),
    new M.FadeIn(greyCard, { runTime: 0.5 }),
    ...say('GREY → 0 TOKENS', GREY)
  );

  await until(S(8));
  await play(
    new M.FadeIn(blueCard, { runTime: 0.6 }),
    ...say('EACH BLUE → 2 TOKENS', BLUE)
  );

  await until(S(9));
  await play(
    new M.FadeIn(goldCard, { runTime: 0.5 }),
    ...say('GOLD → 4 TOKENS', GOLD)
  );

  // ----------------------------------------------------------
  // 10. The game has two rounds; focus on round one.
  // ----------------------------------------------------------

  function roundCard(x, y, name, color, variable = null) {
    const w = P ? 2.65 : 2.75;
    const h = P ? 3.2 : 2.9;

    const frame = rect(w, h, x, y, color, 0.06);

    const heading = txt(
      name,
      20,
      color,
      x,
      y + h / 2 - 0.35
    );

    const w0 = miniatureWheel(x, y + 0.15, 0.72);

    const bottom = txt(
      variable ? `${variable} = payout` : '1 spin',
      18,
      color,
      x,
      y - h / 2 + 0.35,
      !!variable
    );

    return new M.VGroup(frame, heading, w0, bottom);
  }

  const roundGap = P ? 1.5 : 1.55;
  const roundY = P ? -0.65 : -0.35;

  const round1 = roundCard(
    CX - roundGap, roundY, 'ROUND 1', C.cyan
  );

  const round2 = roundCard(
    CX + roundGap, roundY, 'ROUND 2', PINK
  );

  await until(S(10));
  await play(
    ...fade(spinner, greyCard, blueCard, goldCard),
    ...appear(round1, round2),
    ...say('2 ROUNDS · 1 SPIN EACH')
  );

  // ----------------------------------------------------------
  // 11. How many tokens will I get?
  // ----------------------------------------------------------

  const question = txt(
    '?',
    48,
    GOLD,
    CX,
    P ? -3.1 : -2.3,
    true
  );

  await until(S(11));
  await play(
    new M.Indicate(round1, { color: C.cyan }),
    new M.FadeIn(question),
    ...say('ROUND 1: HOW MANY TOKENS?', C.amber)
  );

  // ----------------------------------------------------------
  // Mapping diagram.
  //
  // Four outcome cards on the left.
  // Three distinct numerical values on the right.
  // Both blue arrows converge on the SAME value, 2.
  // ----------------------------------------------------------

  const LX = CX - (P ? 2.05 : 2.15);
  const RX = CX + (P ? 2.05 : 2.15);
  const CHIPW = P ? 2.2 : 2.15;
  const CHIPHT = P ? 0.76 : 0.58;
  const NUMW = P ? 1.55 : 1.30;
  const NUMH = P ? 0.90 : 0.72;
  const rowGap = P ? 1.35 : 0.83;
  const mapY = P ? -1.4 : -0.55;

  const oy = k => mapY + (1.5 - k) * rowGap;

  const vy = [
    oy(0),
    (oy(1) + oy(2)) / 2,
    oy(3)
  ];

  const valueIndex = [0, 1, 1, 2];

  function valueNode(v, k) {
    const x = RX;
    const y = vy[k];

    const r = rect(NUMW, NUMH, x, y, C.cyan, 0.12);

    const n = txt(
      String(v),
      P ? 33 : 29,
      C.cyan,
      x,
      y,
      true
    );

    return new M.VGroup(r, n);
  }

  function makeMap() {
    const hy = oy(0) + (P ? 0.63 : 0.49);

    const leftHead = txt(
      'OUTCOMES',
      17,
      C.muted,
      LX,
      hy
    );

    const rightHead = txt(
      'TOKENS',
      17,
      C.muted,
      RX,
      hy
    );

    const chips = NAMES.map((_, k) =>
      outcomeChip(k, LX, oy(k), CHIPW, CHIPHT)
    );

    const nodes = VALUES.map(valueNode);

    const links = NAMES.map((_, k) =>
      arrow(
        [LX + CHIPW / 2 + 0.12, oy(k), 0],
        [RX - NUMW / 2 - 0.12, vy[valueIndex[k]], 0],
        COL[k],
        3,
        0.15
      )
    );

    return {
      leftHead,
      rightHead,
      chips,
      nodes,
      links
    };
  }

  const allMap = m => [
    m.leftHead,
    m.rightHead,
    ...m.chips,
    ...m.nodes,
    ...m.links
  ];

  let map = makeMap();

  // ----------------------------------------------------------
  // 12. An outcome is one way the spin can end.
  // ----------------------------------------------------------

  // a spinner beside the list: an outcome = where the arrow stops
  const outR = P ? 1.0 : 0.95;
  const outFace = wheelFace(RX, mapY, outR);
  const outNeedle = needle(rad(15), RX, mapY, outR);
  const outHub = hub(RX, mapY, outR);
  const outWheel = new M.VGroup(outFace, outNeedle, outHub);
  const outNote = txt('where it stops', P ? 18 : 17, C.muted, RX, mapY - outR - 0.4);

  await until(S(12));
  await play(
    ...fade(round1, round2, question),
    new M.FadeIn(map.leftHead),
    new M.FadeIn(outWheel),
    new M.FadeIn(outNote),
    ...say('OUTCOME = ONE POSSIBLE RESULT')
  );
  await play(
    new M.Rotate(outNeedle, {
      angle: 2 * Math.PI + rad(150),
      aboutPoint: [RX, mapY, 0],
      runTime: 1.6,
      rateFunc: t => 1 - Math.pow(1 - t, 3)
    })
  );

  // ----------------------------------------------------------
  // 13. Four distinct outcomes.
  // ----------------------------------------------------------

  await until(S(13));
  await play(
    new M.LaggedStart(
      map.chips.map(c => new M.FadeIn(c)),
      { lagRatio: 0.2, runTime: 1.8 }
    ),
    ...say('4 POSSIBLE OUTCOMES')
  );

  // ----------------------------------------------------------
  // 14. The sample space is the full list.
  // ----------------------------------------------------------

  const sampleBox = new M.RoundedRectangle({
    width: CHIPW + 0.30,
    height: 3 * rowGap + CHIPHT + 0.32,
    cornerRadius: 0.17,
    color: C.violet,
    strokeWidth: 2
  });

  sampleBox.moveTo([LX, mapY, 0]);

  await until(S(14));
  await play(
    new M.Create(sampleBox),
    ...say('SAMPLE SPACE', C.violet),
    ...fbox([
      'sample space',
      ['all 4 possible outcomes', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 15. Prepare the numerical payout side.
  // ----------------------------------------------------------

  await until(S(15));
  await play(
    ...fade(sampleBox, outWheel, outNote),
    ...clearBox(),
    new M.FadeIn(map.rightHead),
    ...appear(map.nodes),
    ...say('MATCH EACH OUTCOME TO ITS PAYOUT')
  );

  // ----------------------------------------------------------
  // 16. Grey goes to zero.
  // ----------------------------------------------------------

  await until(S(16));
  await play(
    new M.Create(map.links[0], { runTime: 0.45 }),
    new M.Flash(map.nodes[0], {
      color: GREY,
      runTime: 0.45
    }),
    ...say('GREY → 0', GREY)
  );

  // ----------------------------------------------------------
  // 17. Blue one goes to two.
  // ----------------------------------------------------------

  await until(S(17));
  await play(
    new M.Create(map.links[1], { runTime: 0.45 }),
    new M.Flash(map.nodes[1], {
      color: BLUE,
      runTime: 0.45
    }),
    ...say('BLUE ONE → 2', BLUE)
  );

  // ----------------------------------------------------------
  // 18. Blue two goes to that same two.
  // ----------------------------------------------------------

  await until(S(18));
  await play(
    new M.Create(map.links[2], { runTime: 0.5 }),
    new M.Flash(map.nodes[1], {
      color: BLUE,
      runTime: 0.5
    }),
    ...say('BLUE TWO → 2', BLUE)
  );

  // ----------------------------------------------------------
  // 19. Gold goes to four.
  // ----------------------------------------------------------

  await until(S(19));
  await play(
    new M.Create(map.links[3], { runTime: 0.4 }),
    new M.Flash(map.nodes[2], {
      color: GOLD,
      runTime: 0.4
    }),
    ...say('GOLD → 4', GOLD)
  );

  // ----------------------------------------------------------
  // 20. Four outcomes, only three different numbers.
  // ----------------------------------------------------------

  const countY = oy(3) - (P ? 0.8 : 0.6);

  const count4 = tag(
    '4 OUTCOMES', C.violet, LX, countY, 15
  );

  const count3 = tag(
    '3 VALUES', C.cyan, RX, countY, 15
  );

  await until(S(20));
  await play(
    ...appear(count4, count3),
    ...say('4 OUTCOMES · 3 DIFFERENT NUMBERS', C.amber),
    ...fbox([
      '0, 2, 2, 4',
      ['distinct: 0, 2, 4', C.cyan]
    ])
  );

  // ----------------------------------------------------------
  // 21. Two blue outcomes share one value.
  // ----------------------------------------------------------

  const blueOutline = new M.RoundedRectangle({
    width: CHIPW + 0.28,
    height: rowGap + CHIPHT + 0.25,
    cornerRadius: 0.15,
    color: BLUE,
    strokeWidth: 2
  });

  blueOutline.moveTo([LX, mapY, 0]);

  await until(S(21));
  await play(
    new M.Create(blueOutline),
    new M.Indicate(map.links[1], { color: BLUE }),
    new M.Indicate(map.links[2], { color: BLUE }),
    new M.Indicate(map.nodes[1], { color: GOLD }),
    ...say('DIFFERENT OUTCOMES · SAME VALUE', BLUE)
  );

  // ----------------------------------------------------------
  // 22. The arrow rule is the idea.
  // ----------------------------------------------------------

  const ruleFrame = new M.RoundedRectangle({
    width: RX - LX - CHIPW / 2 - NUMW / 2 - 0.12,
    height: 3 * rowGap + 0.45,
    cornerRadius: 0.15,
    color: C.violet,
    strokeWidth: 2
  });

  const ruleLeft = LX + CHIPW / 2 + 0.06;
  const ruleRight = RX - NUMW / 2 - 0.06;

  ruleFrame.moveTo([
    (ruleLeft + ruleRight) / 2,
    mapY,
    0
  ]);

  await until(S(22));
  await play(
    ...fade(blueOutline),
    new M.Create(ruleFrame),
    ...say('THE ARROW RULE', C.violet),
    ...fbox([
      'outcome → number'
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 23. Exactly one number for each outcome.
  // ----------------------------------------------------------

  await until(S(23));
  await play(
    new M.LaggedStart(
      map.links.map(a =>
        new M.Indicate(a, { color: C.amber })
      ),
      { lagRatio: 0.25, runTime: 2.2 }
    ),
    ...say('EACH OUTCOME → EXACTLY ONE NUMBER', C.amber)
  );

  // ----------------------------------------------------------
  // 24. Name the rule: random variable.
  // ----------------------------------------------------------

  await until(S(24));
  await play(
    ...fade(ruleFrame),
    ...say('RANDOM VARIABLE', C.green),
    ...fbox([
      ['random variable', C.green],
      'outcome → number'
    ], C.green)
  );

  // ----------------------------------------------------------
  // 25. Random: unknown before the spin.
  // ----------------------------------------------------------

  await until(S(25));
  await play(
    ...say('RANDOM = RESULT NOT KNOWN YET', C.violet),
    ...fbox([
      'before the spin',
      ['payout = ?', C.violet]
    ], C.violet)
  );

  // ----------------------------------------------------------
  // 26. Variable: can take different values.
  // ----------------------------------------------------------

  await until(S(26));
  await play(
    new M.LaggedStart(
      map.nodes.map(n =>
        new M.Indicate(n, { color: C.cyan })
      ),
      { lagRatio: 0.2, runTime: 1.5 }
    ),
    ...say('VARIABLE = DIFFERENT POSSIBLE VALUES'),
    ...fbox([
      'possible values',
      ['0, 2, 4', C.cyan]
    ])
  );

  // ----------------------------------------------------------
  // 27. Capital X means the round-one payout.
  // ----------------------------------------------------------

  const xBadge = tag(
    'X',
    C.cyan,
    (LX + RX) / 2,
    P ? -4.45 : -2.35,
    24
  );

  await until(S(27));
  await play(
    ...fade(count4, count3),
    new M.FadeIn(xBadge),
    ...say('X = ROUND ONE PAYOUT'),
    ...fbox([
      ['X', C.cyan],
      'round one payout'
    ])
  );

  // ----------------------------------------------------------
  // 28. Before spinning, X has three possible values.
  // ----------------------------------------------------------

  await until(S(28));
  await play(
    new M.LaggedStart(
      map.nodes.map(n =>
        new M.Indicate(n, { color: C.amber })
      ),
      { lagRatio: 0.15, runTime: 1.6 }
    ),
    ...say('BEFORE THE SPIN: THREE POSSIBILITIES', C.amber),
    ...fbox([
      'X could be',
      ['0, 2 or 4', C.cyan]
    ])
  );

  // ----------------------------------------------------------
  // 29. After spinning, X is one number.
  // Example: the arrow stops on gold.
  // ----------------------------------------------------------

  const exampleFace = wheelFace();
  const exampleNeedle = needle(rad(45));
  const exampleHub = hub();

  const exampleSpinner = new M.VGroup(
    exampleFace,
    exampleNeedle,
    exampleHub
  );

  const fourCoins = coins(
    4,
    CX,
    P ? -3.05 : -2.2,
    0.22
  );

  const goldResult = tag(
    'X = 4',
    C.cyan,
    CX,
    P ? -3.85 : -2.7,
    21
  );

  await until(S(29));
  await play(
    ...fade(allMap(map), xBadge),
    ...clearBox(),
    new M.FadeIn(exampleSpinner, { runTime: 0.65 }),
    ...say('AFTER THE SPIN: ONE VALUE')
  );

  await play(
    new M.Rotate(exampleNeedle, {
      angle: 4 * Math.PI - Math.PI / 2,
      aboutPoint: WC,
      runTime: Math.max(1.4, E(29) - S(29) - 2.4),
      rateFunc: t => 1 - Math.pow(1 - t, 3)
    })
  );

  await play(
    new M.LaggedStart(
      fourCoins.submobjects.map(c => new M.FadeIn(c)),
      { lagRatio: 0.12, runTime: 0.7 }
    ),
    new M.FadeIn(goldResult, { runTime: 0.6 }),
    ...fbox([
      'landed on gold',
      ['X = 4 tokens', GOLD]
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 30. Why turn colours into numbers?
  // ----------------------------------------------------------

  await until(S(30));
  await play(
    ...say('WHY TURN COLOURS INTO NUMBERS?', C.amber)
  );

  // ----------------------------------------------------------
  // 31. Colours cannot be added or averaged as payouts.
  // ----------------------------------------------------------

  const calcY = P ? -0.5 : -0.4;
  const calcGap = P ? 1.95 : 1.9;

  const colourA = circle(
    0.48,
    CX - calcGap,
    calcY,
    BLUE,
    0.9,
    2
  );

  const colourB = circle(
    0.48,
    CX,
    calcY,
    GOLD,
    0.9,
    2
  );

  const plus = txt(
    '+',
    34,
    C.muted,
    CX - calcGap / 2,
    calcY,
    true
  );

  const equals = txt(
    '=',
    34,
    C.muted,
    CX + calcGap / 2,
    calcY,
    true
  );

  const unknown = txt(
    '?',
    44,
    C.amber,
    CX + calcGap,
    calcY,
    true
  );

  const colourCaption = txt(
    'No numerical payout total',
    19,
    C.muted,
    CX,
    calcY - 1.0
  );

  await until(S(31));
  await play(
    ...fade(exampleSpinner, fourCoins, goldResult),
    ...clearBox(),
    ...appear(colourA, colourB, plus, equals, unknown, colourCaption),
    ...say('COLOURS ARE NOT PAYOUT NUMBERS', C.muted)
  );

  // ----------------------------------------------------------
  // 32. Numerical payouts can be added and averaged.
  // Two example payouts, not a possible single-spin payout.
  // ----------------------------------------------------------

  const addA = coins(2, CX - calcGap, calcY, 0.17);
  const addB = new M.VGroup(
    ...Array.from({ length: 4 }, (_, i) =>
      coin(CX + (i % 2 - 0.5) * 0.38, calcY + (i < 2 ? 0.20 : -0.20), 0.14)
    )
  );

  const addC = new M.VGroup(
    ...Array.from({ length: 6 }, (_, i) =>
      coin(
        CX + calcGap + (i % 3 - 1) * 0.35,
        calcY + (i < 3 ? 0.20 : -0.20),
        0.13
      )
    )
  );

  const addLabels = [2, 4, 6].map((v, k) =>
    txt(
      String(v),
      26,
      GOLD,
      CX + (k - 1) * calcGap,
      calcY - 0.85,
      true
    )
  );

  const numericalCaption = txt(
    'Total of two example payouts',
    18,
    C.muted,
    CX,
    calcY - 1.45
  );

  await until(S(32));
  await play(
    ...fade(colourA, colourB, unknown, colourCaption),
    ...appear(addA, addB, addC, addLabels, numericalCaption),
    ...say('NUMBERS LET US CALCULATE', C.green),
    ...fbox([
      ['2 + 4 = 6', GOLD],
      'add, then average'
    ], C.green)
  );

  // ----------------------------------------------------------
  // 33. Round two has its own random variable, Y.
  // Round one is cyan; round two is pink.
  // ----------------------------------------------------------

  const roundX = roundCard(
    CX - roundGap,
    roundY,
    'ROUND 1',
    C.cyan,
    'X'
  );

  const roundYCard = roundCard(
    CX + roundGap,
    roundY,
    'ROUND 2',
    PINK,
    'Y'
  );

  await until(S(33));
  await play(
    ...fade(addA, addB, addC, addLabels, plus, equals, numericalCaption),
    ...appear(roundX, roundYCard),
    ...say('ROUND TWO GETS ITS OWN NAME', PINK),
    ...fbox([
      ['X = round 1 payout', C.cyan],
      ['Y = round 2 payout', PINK]
    ], PINK)
  );

  // ----------------------------------------------------------
  // 34. Return to the complete arrow rule.
  // ----------------------------------------------------------

  map = makeMap();

  const ruleName = tag(
    'RULE X',
    C.cyan,
    CX,
    P ? -4.55 : -2.35,
    19
  );

  await until(S(34));
  await play(
    ...fade(roundX, roundYCard),
    ...appear(map.leftHead, map.rightHead, map.chips, map.nodes),
    new M.LaggedStart(
      map.links.map(a => new M.Create(a)),
      { lagRatio: 0.15, runTime: 1.8 }
    ),
    new M.FadeIn(ruleName),
    ...say('OUTCOME → NUMBER', C.green),
    ...fbox([
      ['random variable', C.green],
      'one number per outcome'
    ], C.green)
  );

  // ----------------------------------------------------------
  // 35. Introduce the notation X(gold) = 4.
  // ----------------------------------------------------------

  await until(S(35));
  await play(
    new M.Indicate(map.chips[3], { color: GOLD }),
    new M.Indicate(map.links[3], { color: GOLD }),
    new M.Indicate(map.nodes[2], { color: GOLD }),
    ...say('WRITING THE RULE'),
    ...fbox([
      ['X(gold) = 4', GOLD]
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 36. Read the notation from outcome to value.
  // ----------------------------------------------------------

  const goldTrace = new M.RoundedRectangle({
    width: RX - LX + (CHIPW + NUMW) / 2 + 0.25,
    height: Math.max(CHIPHT, NUMH) + 0.24,
    cornerRadius: 0.13,
    color: GOLD,
    strokeWidth: 2
  });

  const traceLeft = LX - CHIPW / 2 - 0.125;
  const traceRight = RX + NUMW / 2 + 0.125;

  goldTrace.moveTo([
    (traceLeft + traceRight) / 2,
    oy(3),
    0
  ]);

  await until(S(36));
  await play(
    new M.Create(goldTrace),
    ...say('THE RULE X GIVES GOLD THE NUMBER 4', GOLD),
    ...fbox([
      ['X(gold) = 4', GOLD],
      'rule(outcome) = value'
    ], GOLD)
  );

  // ----------------------------------------------------------
  // 37. Write the same notation for the remaining outcomes.
  // ----------------------------------------------------------

  await until(S(37));
  await play(
    ...fade(goldTrace),
    new M.LaggedStart(
      [
        new M.Indicate(map.links[0], { color: GREY }),
        new M.Indicate(map.links[1], { color: BLUE }),
        new M.Indicate(map.links[2], { color: BLUE })
      ],
      { lagRatio: 0.25, runTime: 2.0 }
    ),
    ...say('THE SAME RULE FOR EVERY SLICE'),
    ...fbox([
      ['X(grey)     = 0', GREY],
      ['X(blue one) = 2', BLUE],
      ['X(blue two) = 2', BLUE],
      ['X(gold)     = 4', GOLD]
    ])
  );

  // ----------------------------------------------------------
  // 38. What is it for? Calculating with chance results.
  // ----------------------------------------------------------

  await until(S(38));
  await play(
    new M.LaggedStart(
      map.nodes.map(n =>
        new M.Indicate(n, { color: C.green })
      ),
      { lagRatio: 0.2, runTime: 1.8 }
    ),
    ...say('CHANCE RESULTS BECOME NUMBERS', C.green),
    ...fbox([
      'count',
      'add',
      ['average', C.green]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 39. Examples in data science.
  // Four small picture cards, one for each example.
  // ----------------------------------------------------------

  const exDX = P ? 1.52 : 1.57;
  const exDY = P ? 1.42 : 0.95;
  const exCY = P ? -0.75 : -0.45;
  const exW = P ? 2.8 : 2.95;
  const exH = P ? 2.45 : 1.72;

  function exampleCard(x, y, name, color, objects, result) {
    const r = rect(exW, exH, x, y, color, 0.08);

    const h = txt(
      name,
      19,
      color,
      x,
      y + exH / 2 - 0.30
    );

    const b = txt(
      result,
      18,
      C.ink,
      x,
      y - exH / 2 + 0.30,
      true
    );

    return new M.VGroup(r, h, ...objects, b);
  }

  // Dice: number of pips.
  const dx = CX - exDX;
  const dy = exCY + exDY;

  const dieBody = rect(
    0.66, 0.66, dx, dy, C.ink, 0.12
  );

  const dieDots = [
    [-0.18, 0.18],
    [0.18, 0.18],
    [-0.18, -0.18],
    [0.18, -0.18]
  ].map(([x, y]) =>
    circle(0.052, dx + x, dy + y, C.ink, 1, 1)
  );

  const diceCard = exampleCard(
    dx, dy,
    'DICE', C.cyan,
    [dieBody, ...dieDots],
    '4 pips'
  );

  // Sales: three growing bars.
  const sx = CX + exDX;
  const sy = exCY + exDY;

  const salesBars = [0.20, 0.39, 0.60].map((h, k) => {
    const b = new M.Rectangle({
      width: 0.22,
      height: h,
      color: C.green,
      strokeWidth: 1
    });

    b.setFill(C.green, 0.85);
    b.moveTo([
      sx + (k - 1) * 0.32,
      sy - 0.3 + h / 2,
      0
    ]);

    return b;
  });

  const salesCard = exampleCard(
    sx, sy,
    'SALES', C.green,
    salesBars,
    '12 sales'
  );

  // Waiting time: clock face.
  const wx = CX - exDX;
  const wy = exCY - exDY;

  const clockFace = circle(
    0.33, wx, wy, C.violet, 0.10, 2
  );

  const clockHand1 = line(
    [wx, wy, 0],
    [wx, wy + 0.22, 0],
    C.violet,
    3
  );

  const clockHand2 = line(
    [wx, wy, 0],
    [wx + 0.17, wy - 0.10, 0],
    C.violet,
    3
  );

  const waitCard = exampleCard(
    wx, wy,
    'WAITING TIME', C.violet,
    [clockFace, clockHand1, clockHand2],
    '8 minutes'
  );

  // Test score: marked paper.
  const tx = CX + exDX;
  const ty = exCY - exDY;

  const paper = rect(
    0.51, 0.66, tx, ty, C.amber, 0.10
  );

  const paperLines = [-0.16, 0, 0.16].map(y =>
    line(
      [tx - 0.15, ty + y, 0],
      [tx + 0.15, ty + y, 0],
      C.amber,
      2
    )
  );

  const testCard = exampleCard(
    tx, ty,
    'TEST SCORES', C.amber,
    [paper, ...paperLines],
    '85 points'
  );

  const examples = [
    diceCard,
    salesCard,
    waitCard,
    testCard
  ];

  await until(S(39));
  await play(
    ...fade(allMap(map), ruleName),
    ...clearBox(),
    new M.LaggedStart(
      examples.map(c => new M.FadeIn(c)),
      { lagRatio: 0.28, runTime: 3.1 }
    ),
    ...say('RANDOM VARIABLES IN DATA SCIENCE')
  );

  // ----------------------------------------------------------
  // 40. Common trap: an outcome is not the numerical value.
  // ----------------------------------------------------------

  map = makeMap();

  await until(S(40));
  await play(
    ...fade(examples),
    ...appear(allMap(map)),
    ...say('TRAP: OUTCOME ≠ VALUE', C.amber),
    ...fbox([
      ['outcome: a slice', C.violet],
      ['value: its payout', C.cyan]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 41. Blue one and blue two are distinct outcomes.
  // They converge on one numerical value.
  // ----------------------------------------------------------

  const blue1Frame = new M.RoundedRectangle({
    width: CHIPW + 0.18,
    height: CHIPHT + 0.17,
    cornerRadius: 0.13,
    color: BLUE,
    strokeWidth: 2
  });

  blue1Frame.moveTo([LX, oy(1), 0]);

  const blue2Frame = new M.RoundedRectangle({
    width: CHIPW + 0.18,
    height: CHIPHT + 0.17,
    cornerRadius: 0.13,
    color: BLUE,
    strokeWidth: 2
  });

  blue2Frame.moveTo([LX, oy(2), 0]);

  const sharedValueFrame = new M.RoundedRectangle({
    width: NUMW + 0.20,
    height: NUMH + 0.20,
    cornerRadius: 0.14,
    color: GOLD,
    strokeWidth: 2
  });

  sharedValueFrame.moveTo([RX, vy[1], 0]);

  await until(S(41));
  await play(
    new M.Create(blue1Frame),
    new M.Create(blue2Frame),
    new M.Create(sharedValueFrame),
    new M.Indicate(map.links[1], { color: BLUE }),
    new M.Indicate(map.links[2], { color: BLUE }),
    ...say('2 DIFFERENT OUTCOMES · 1 SHARED VALUE', BLUE),
    ...fbox([
      ['Blue one → 2', BLUE],
      ['Blue two → 2', BLUE]
    ], BLUE)
  );

  // ----------------------------------------------------------
  // 42. Two tokens has a chance of two in four, not one in four.
  // Show all four equal chances, highlighting the two blue ones.
  // ----------------------------------------------------------

  const stripY = P ? -4.75 : -2.35;
  const stripGap = P ? 0.95 : 0.96;

  const quarterCards = COL.map((c, k) => {
    const x = CX + (k - 1.5) * stripGap;
    const isBlue = k === 1 || k === 2;

    const r = rect(
      0.78,
      P ? 0.85 : 0.65,
      x,
      stripY,
      isBlue ? BLUE : C.muted,
      isBlue ? 0.36 : 0.06
    );

    const d = circle(
      0.11,
      x,
      stripY + 0.12,
      c,
      isBlue ? 1 : 0.45,
      1
    );

    const t = txt(
      '1/4',
      15,
      isBlue ? C.ink : C.muted,
      x,
      stripY - 0.15,
      true
    );

    return new M.VGroup(r, d, t);
  });

  const chanceBrace = new M.RoundedRectangle({
    width: stripGap + 0.96,
    height: P ? 1.04 : 0.82,
    cornerRadius: 0.12,
    color: C.amber,
    strokeWidth: 2
  });

  chanceBrace.moveTo([CX, stripY, 0]);

  await until(S(42));
  await play(
    new M.LaggedStart(
      quarterCards.map(q => new M.FadeIn(q)),
      { lagRatio: 0.10, runTime: 1.3 }
    ),
    new M.Create(chanceBrace),
    ...say('TWO BLUE SLICES OUT OF FOUR', C.amber),
    ...fbox([
      'chance of 2 tokens',
      ['1/4 + 1/4 = 2/4', C.amber]
    ], C.amber)
  );

  // ----------------------------------------------------------
  // 43. Preview the next lesson: the chance of each payout.
  // Introduce the number line and glowing probability bars.
  // ----------------------------------------------------------

  const plotW = P ? 5.5 : 6.0;
  const plotBase = P ? -3.1 : -2.05;

  const x2p = v =>
    CX - plotW / 2 + 0.65 + v / 4 * (plotW - 1.3);

  const axis = line(
    [CX - plotW / 2, plotBase, 0],
    [CX + plotW / 2, plotBase, 0],
    C.muted,
    2
  );

  const ticks = [0, 1, 2, 3, 4].map(v => {
    const x = x2p(v);

    return new M.VGroup(
      line(
        [x, plotBase - 0.07, 0],
        [x, plotBase + 0.07, 0],
        C.muted,
        2
      ),
      txt(
        String(v),
        18,
        C.muted,
        x,
        plotBase - 0.30,
        true
      )
    );
  });

  const plotUnit = txt(
    'payout X (tokens)',
    17,
    C.muted,
    CX,
    plotBase - 0.78
  );

  const probs = [0.25, 0.50, 0.25];
  const frac = ['1/4', '1/2', '1/4'];

  function probabilityBar(v, p, k) {
    const x = x2p(v);
    const h = p * (P ? 6.0 : 4.6);
    const w = P ? 0.78 : 0.72;

    const glow = new M.Rectangle({
      width: w + 0.20,
      height: h + 0.06,
      color: C.cyan,
      strokeWidth: 0
    });

    glow.setFill(C.cyan, 0.09);
    glow.moveTo([x, plotBase + h / 2, 0]);

    const b = new M.Rectangle({
      width: w,
      height: h,
      color: C.cyan,
      strokeWidth: 2
    });

    b.setFill(C.cyan, 0.73);
    b.moveTo([x, plotBase + h / 2, 0]);

    const label = txt(
      frac[k],
      22,
      C.cyan,
      x,
      plotBase + h + 0.30,
      true
    );

    return new M.VGroup(glow, b, label);
  }

  const bars = VALUES.map((v, k) =>
    probabilityBar(v, probs[k], k)
  );

  await until(S(43));
  await play(
    ...fade(
      allMap(map),
      blue1Frame,
      blue2Frame,
      sharedValueFrame,
      quarterCards,
      chanceBrace
    ),
    new M.Create(axis),
    ...appear(ticks, plotUnit),
    new M.LaggedStart(
      bars.map(b => new M.FadeIn(b)),
      { lagRatio: 0.15, runTime: 1.4 }
    ),
    ...say('NEXT: THE CHANCE OF EACH PAYOUT', C.green),
    ...fbox([
      ['0 tokens: 1/4', C.cyan],
      ['2 tokens: 1/2', C.cyan],
      ['4 tokens: 1/4', C.cyan]
    ], C.green)
  );

  // ----------------------------------------------------------
  // 44. Final definition, with the complete mapping.
  // A random variable assigns each outcome exactly one number.
  // ----------------------------------------------------------

  map = makeMap();

  const finalRule = tag(
    'X = ROUND ONE PAYOUT',
    C.cyan,
    CX,
    P ? -4.55 : -2.35,
    17
  );

  await until(S(44));
  await play(
    ...fade(axis, ticks, plotUnit, bars),
    ...appear(map.leftHead, map.rightHead, map.chips, map.nodes),
    new M.LaggedStart(
      map.links.map(a => new M.Create(a)),
      { lagRatio: 0.15, runTime: 1.7 }
    ),
    new M.FadeIn(finalRule),
    ...say('RANDOM VARIABLE: OUTCOME → NUMBER', C.green),
    ...fbox([
      ['each outcome', C.ink],
      ['exactly one number', C.green]
    ], C.green)
  );

  await until(E(44));
}
