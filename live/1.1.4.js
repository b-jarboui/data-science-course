// lesson 1.1.4
// Measurement scales: four kinds of comparison.
// Live manim-web scene. Beat i = narration sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play } = L;

  const DRINK = ['coffee', 'tea', 'coffee', 'juice', 'coffee', 'tea'];
  const SIZE = ['small', 'medium', 'large', 'medium', 'medium', 'small'];
  const PRICE = [3, 4, 5, 4, 4, 3];

  const QS = [
    'SAME OR DIFFERENT?',
    'WHICH IS MORE?',
    'HOW MUCH MORE?',
    'HOW MANY TIMES AS MUCH?',
  ];

  const PILL = P ? [0, 4.0, 0] : [0, 1.85, 0];

  // Table and stage: beats 0-24.
  const TC = P ? [0, 0.35, 0] : [-3.75, -0.75, 0];
  const STG = P ? [0, -4.6, 0] : [3.45, -0.75, 0];
  const SW = P ? 7.2 : 6.0;

  // Ladder: beats 25-43.
  const LC = P ? [0, -1.3, 0] : [-3.1, -0.75, 0];
  const RW = P ? 7.2 : 6.6;
  const SIDE = P ? [0, -5.0, 0] : [3.95, -0.75, 0];
  const SIDEW = P ? FW - 1.0 : 5.2;

  const say = (s, color = C.cyan, size) =>
    showA(s, color, PILL, size);

  function fit(t, maxw) {
    if (t.getWidth() > maxw) t.scale(maxw / t.getWidth());
    return t;
  }

  // ---------- Formula / explanation box ----------
  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);

    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() + cw * (
        rows[i][0].length - rows[i][0].trimStart().length
      )
    );

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + 0.4;

    const frame = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2,
    });

    frame.setFill(C.card, 0.95);
    frame.moveTo(SIDE);

    const left = SIDE[0] - wd / 2 + 0.35;
    const top = SIDE[1] + ht / 2 - 0.2 - lh / 2;

    texts.forEach((t, i) => {
      const indent = cw * (
        rows[i][0].length - rows[i][0].trimStart().length
      );
      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0,
      ]);
    });

    const group = new M.VGroup(frame, ...texts);
    if (wd > SIDEW) group.scale(SIDEW / wd);

    const animations = [new M.FadeIn(group)];
    if (boxNow) animations.push(new M.FadeOut(boxNow));

    boxNow = group;
    return animations;
  }

  function chip(s, color = C.cyan, size = 20) {
    return pill(s, color, size);
  }

  function rect(width, height, center, color, sw = 3, opacity = 0.08) {
    const r = new M.Rectangle({
      width,
      height,
      color,
      strokeWidth: sw,
    });
    r.setFill(color, opacity);
    r.moveTo(center);
    return r;
  }

  // ---------- Chapter table ----------
  const cw = P
    ? [0.8, 2.2, 2.2, 2.0]
    : [0.7, 1.85, 1.85, 1.6];

  const rh = P ? 0.9 : 0.5;
  const TS = P ? 24 : 20;
  const TWID = cw.reduce((a, b) => a + b, 0);
  const x0 = TC[0] - TWID / 2;
  const ytop = TC[1] + 3.5 * rh;

  const cx = cw.map((_, c) =>
    x0 + cw.slice(0, c).reduce((a, b) => a + b, 0) + cw[c] / 2
  );

  const ry = r => ytop - (r + 0.5) * rh;

  const HEAD = ['#', 'Drink', 'Size', 'Price ($)'];

  const card = new M.RoundedRectangle({
    width: TWID + 0.3,
    height: 7 * rh + 0.25,
    cornerRadius: 0.16,
    color: C.muted,
    strokeWidth: 2,
  });
  card.setFill(C.card, 0.95);
  card.moveTo(TC);

  const hdrBg = new M.Rectangle({
    width: TWID,
    height: rh,
    color: C.cyan,
    strokeWidth: 0,
  });
  hdrBg.setFill(C.cyan, 0.16);
  hdrBg.moveTo([TC[0], ry(0), 0]);

  const hline = new M.Line({
    start: [TC[0] - TWID / 2, ytop - rh, 0],
    end: [TC[0] + TWID / 2, ytop - rh, 0],
    color: C.cyan,
    strokeWidth: 2,
  });

  const heads = HEAD.map((h, c) => {
    const t = fit(T(h, TS, C.cyan, true), cw[c] - 0.12);
    t.moveTo([cx[c], ry(0), 0]);
    return t;
  });

  const values = Array.from({ length: 6 }, (_, r) => {
    const row = [
      String(r + 1),
      DRINK[r],
      SIZE[r],
      String(PRICE[r]),
    ];

    return row.map((v, c) => {
      const t = fit(
        T(v, TS, c === 0 ? C.muted : C.ink, c === 0 || c === 3),
        cw[c] - 0.12
      );
      t.moveTo([cx[c], ry(r + 1), 0]);
      return t;
    });
  });

  const seps = Array.from({ length: 5 }, (_, i) => {
    const r = i + 2;
    return new M.Line({
      start: [x0, ytop - r * rh, 0],
      end: [x0 + TWID, ytop - r * rh, 0],
      color: C.muted,
      strokeWidth: 1,
    });
  });

  const table = new M.VGroup(
    card,
    hdrBg,
    hline,
    ...seps,
    ...heads,
    ...values.flat()
  );

  function colbox(c, color = C.amber) {
    return rect(
      cw[c] - 0.06,
      rh * 7 - 0.04,
      [cx[c], TC[1], 0],
      color,
      3,
      0.07
    );
  }

  function rowbox(r, color = C.amber) {
    return rect(
      TWID - 0.04,
      rh - 0.04,
      [TC[0], ry(r + 1), 0],
      color,
      3,
      0.07
    );
  }

  function cellbox(r, c, color = C.amber) {
    return rect(
      cw[c] - 0.1,
      rh - 0.08,
      [cx[c], ry(r + 1), 0],
      color,
      3,
      0.12
    );
  }

  function cellglow(r, c, color = C.amber) {
    return new M.Indicate(values[r][c], { color });
  }

  // ---------- 0: notebook, one row, one column ----------
  const rb0 = rowbox(0, C.cyan);
  const cb0 = colbox(1, C.cyan);

  await until(S(0));
  await play(
    new M.FadeIn(table),
    ...say('ONE ROW = ONE ORDER · ONE COLUMN = ONE FACT', C.cyan)
  );
  await play(new M.Create(rb0));
  await play(new M.FadeOut(rb0), new M.Create(cb0));
  await play(new M.FadeOut(cb0));

  // ---------- 1: the owner's question ----------
  // two cups, small and large, with the owner's question above them
  const cupBase = STG[1] - 0.75;
  const mkCup = (x, w, h, name) => {
    const b = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.08, color: C.amber, strokeWidth: 2.5 });
    b.setFill(C.amber, 0.16);
    b.moveTo([x, cupBase + h / 2, 0]);
    const t = T(name, 19, C.ink, true);
    t.moveTo([x, cupBase - 0.3, 0]);
    return new M.VGroup(b, t);
  };
  const twiceQ = T('twice as big?', 22, C.amber, true);
  twiceQ.moveTo([STG[0], cupBase + 1.85, 0]);
  const ownerQ = new M.VGroup(
    mkCup(STG[0] - 1.3, 0.7, 0.8, 'small'),
    mkCup(STG[0] + 1.3, 1.0, 1.4, 'large'),
    twiceQ,
  );

  await until(S(1));
  await play(
    new M.FadeIn(ownerQ),
    ...say('IS A LARGE TWICE AS BIG AS A SMALL?', C.amber)
  );

  // ---------- 2: four questions ----------
  const qMarkers = QS.map((q, k) => {
    const p = chip(`${k + 1}  ?`, C.muted, 22);
    p.moveTo([
      STG[0] + (k - 1.5) * (P ? 1.65 : 1.4),
      STG[1] + 0.35,
      0,
    ]);
    return p;
  });

  const easyHard = T('easy  →  hard', 18, C.muted);
  easyHard.moveTo([STG[0], STG[1] - 0.45, 0]);

  await until(S(2));
  await play(new M.FadeOut(ownerQ));
  await play(
    new M.LaggedStart(
      qMarkers.map(q => new M.FadeIn(q)),
      { lagRatio: 0.2, runTime: 1.2 }
    ),
    new M.FadeIn(easyHard),
    ...say('4 KINDS OF QUESTION', C.cyan)
  );

  // ---------- 3: drink column ----------
  const drinkCol = colbox(1, C.cyan);

  await until(S(3));
  await play(
    new M.FadeOut(new M.VGroup(...qMarkers, easyHard)),
    new M.Create(drinkCol),
    ...say('DRINK COLUMN', C.cyan),
    new M.LaggedStart(
      values.map(row => new M.Indicate(row[1], { color: C.cyan })),
      { lagRatio: 0.15, runTime: 1.8 }
    )
  );

  // ---------- 4: coffee and tea are different ----------
  const coffee = chip('coffee', C.cyan);
  const tea = chip('tea', C.green);
  const neq = T('≠', 44, C.amber, true);

  coffee.moveTo([STG[0] - 1.6, STG[1] + 0.65, 0]);
  neq.moveTo([STG[0], STG[1] + 0.65, 0]);
  tea.moveTo([STG[0] + 1.6, STG[1] + 0.65, 0]);

  const pair = new M.VGroup(coffee, neq, tea);

  await until(S(4));
  await play(
    new M.FadeIn(pair),
    cellglow(0, 1, C.amber),
    cellglow(1, 1, C.amber),
    ...say('COFFEE ≠ TEA: DIFFERENT', C.green)
  );

  // ---------- 5: drinks have no natural ranking ----------
  const teaGreater = chip('tea', C.green);
  const greater = T('>', 40, C.amber, true);
  const coffeeLess = chip('coffee', C.cyan);
  const question = T('?', 40, C.amber, true);

  const qx = STG[0] - 1.65;
  const qy = STG[1] - 0.75;

  teaGreater.moveTo([qx, qy, 0]);
  greater.moveTo([qx + 1.1, qy, 0]);
  coffeeLess.moveTo([qx + 2.2, qy, 0]);
  question.moveTo([qx + 3.15, qy, 0]);

  const greaterCross = new M.VGroup(
    new M.Line({
      start: [qx + 0.86, qy - 0.3, 0],
      end: [qx + 1.34, qy + 0.3, 0],
      color: C.pink,
      strokeWidth: 5,
    }),
    new M.Line({
      start: [qx + 0.86, qy + 0.3, 0],
      end: [qx + 1.34, qy - 0.3, 0],
      color: C.pink,
      strokeWidth: 5,
    })
  );

  await until(S(5));
  await play(
    new M.FadeIn(new M.VGroup(teaGreater, greater, coffeeLess, question)),
    new M.Create(greaterCross),
    ...say('DRINKS HAVE NO ORDER OF THEIR OWN', C.pink)
  );

  // ---------- 6: ranking means least to most ----------
  const rankLine = new M.Line({
    start: [STG[0] - 2.65, STG[1] - 0.15, 0],
    end: [STG[0] + 2.65, STG[1] - 0.15, 0],
    color: C.muted,
    strokeWidth: 3,
  });

  const least = T('least', 17, C.muted);
  least.moveTo([STG[0] - 2.65, STG[1] - 0.48, 0]);

  const most = T('most', 17, C.muted);
  most.moveTo([STG[0] + 2.65, STG[1] - 0.48, 0]);

  const rankChips = [
    chip('coffee'),
    chip('tea'),
    chip('juice'),
  ];

  rankChips.forEach((p, k) =>
    p.moveTo([
      STG[0] + (k - 1) * 1.8,
      STG[1] + 0.55,
      0,
    ])
  );

  const rankQuestions = rankChips.map((p, k) => {
    const t = T('?', 27, C.amber, true);
    t.moveTo([
      STG[0] + (k - 1) * 1.8,
      STG[1] + 1.05,
      0,
    ]);
    return t;
  });

  await until(S(6));
  await play(
    new M.FadeOut(pair),
    new M.FadeOut(new M.VGroup(teaGreater, greater, coffeeLess, question, greaterCross)),
    ...say('RANKING = IN ORDER, LEAST TO MOST', C.cyan)
  );
  await play(
    new M.Create(rankLine),
    new M.FadeIn(least),
    new M.FadeIn(most),
    new M.LaggedStart(
      rankChips.map(p => new M.FadeIn(p)),
      { lagRatio: 0.2, runTime: 1.2 }
    )
  );
  await play(
    new M.LaggedStart(
      rankQuestions.map(q => new M.FadeIn(q)),
      { lagRatio: 0.2, runTime: 0.6 }
    )
  );

  // ---------- 7: counting is not ranking ----------
  function countGroup(name, n, color, k) {
    const x = STG[0] + (k - 1) * 2.1;
    const base = STG[1] - 0.25;

    const dots = Array.from({ length: n }, (_, j) => {
      const d = new M.Circle({
        radius: 0.11,
        color,
        strokeWidth: 1.5,
      });
      d.setFill(color, 0.85);
      d.moveTo([x, base + j * 0.38, 0]);
      return d;
    });

    const label = T(name, 19, C.ink, true);
    label.moveTo([x, base - 0.38, 0]);

    const number = T(String(n), 22, C.amber, true);
    number.moveTo([x, base + n * 0.38 + 0.12, 0]);

    return new M.VGroup(...dots, label, number);
  }

  const counts = [
    countGroup('coffee', 3, C.cyan, 0),
    countGroup('tea', 2, C.green, 1),
    countGroup('juice', 1, C.violet, 2),
  ];

  await until(S(7));
  await play(
    new M.FadeOut(new M.VGroup(rankLine, least, most, ...rankChips, ...rankQuestions)),
    new M.LaggedStart(
      counts.map(g => new M.FadeIn(g)),
      { lagRatio: 0.3, runTime: 1.5 }
    ),
    ...say('COUNTING IS NOT RANKING', C.amber)
  );

  // ---------- 8: drink reaches only the first question ----------
  const step1 = chip('STEP 1: SAME OR DIFFERENT?', C.green, 19);
  step1.moveTo(STG);

  await until(S(8));
  await play(
    new M.FadeOut(new M.VGroup(...counts)),
    ...say('DRINKS: ONLY STEP 1', C.green)
  );
  await play(new M.FadeIn(step1));

  // ---------- 9: size column ----------
  const sizeCol = colbox(2, C.cyan);

  await until(S(9));
  await play(
    new M.FadeOut(step1),
    new M.FadeOut(drinkCol),
    new M.Create(sizeCol),
    ...say('SIZE COLUMN', C.cyan),
    new M.LaggedStart(
      values.map(row => new M.Indicate(row[2], { color: C.cyan })),
      { lagRatio: 0.15, runTime: 1.8 }
    )
  );

  // ---------- 10: sizes can be ranked ----------
  const heights = [0.7, 1.15, 1.6];
  const baseY = STG[1] - 1.1;
  const sizeNames = ['small', 'medium', 'large'];
  const sizeBars = [];
  const sizeLabels = [];

  for (let k = 0; k < 3; k++) {
    const h = heights[k];
    const bx = STG[0] + (k - 1) * 1.9;

    const b = new M.Rectangle({
      width: 1.1,
      height: h,
      color: C.cyan,
      strokeWidth: 2,
    });
    b.setFill(C.cyan, 0.35);
    b.moveTo([bx, baseY + h / 2, 0]);

    const label = T(sizeNames[k], 19, C.ink, true);
    label.moveTo([bx, baseY - 0.25, 0]);

    sizeBars.push(b);
    sizeLabels.push(label);
  }

  const sizeStage = new M.VGroup(...sizeBars, ...sizeLabels);

  await until(S(10));
  await play(
    new M.FadeIn(sizeStage),
    ...say('SIZES CAN BE RANKED', C.cyan)
  );

  // ---------- 11: step two ----------
  await until(S(11));
  await play(
    ...say('STEP 2: WHICH IS MORE?', C.green)
  );

  // ---------- 12: large is more than small ----------
  const greaterSize = T('large  >  small', 25, C.amber, true);
  greaterSize.moveTo([STG[0], baseY + 2.15, 0]);

  await until(S(12));
  await play(
    cellglow(2, 2, C.amber),
    cellglow(0, 2, C.amber),
    new M.Indicate(sizeBars[2], { color: C.amber }),
    new M.Indicate(sizeBars[0], { color: C.amber }),
    new M.FadeIn(greaterSize),
    ...say('LARGE IS MORE THAN SMALL', C.amber)
  );

  // ---------- 13: how much more? ----------
  const gapQuestion = T('HOW MUCH MORE?  ?', 22, C.pink, true);
  gapQuestion.moveTo([STG[0], baseY + 2.15, 0]);

  await until(S(13));
  await play(
    new M.FadeOut(greaterSize),
    new M.FadeIn(gapQuestion),
    ...say('THE SIZE COLUMN DOES NOT SAY', C.pink)
  );

  // ---------- 14: the two size gaps ----------
  const gap1 = new M.VGroup(
    new M.Line({
      start: [STG[0] - 1.9, baseY + heights[0], 0],
      end: [STG[0] - 1.9, baseY + heights[1], 0],
      color: C.amber,
      strokeWidth: 3,
    }),
    new M.Line({
      start: [STG[0] - 2.0, baseY + heights[0], 0],
      end: [STG[0] - 1.8, baseY + heights[0], 0],
      color: C.amber,
      strokeWidth: 3,
    }),
    new M.Line({
      start: [STG[0] - 2.0, baseY + heights[1], 0],
      end: [STG[0] - 1.8, baseY + heights[1], 0],
      color: C.amber,
      strokeWidth: 3,
    })
  );

  const gap2 = new M.VGroup(
    new M.Line({
      start: [STG[0], baseY + heights[1], 0],
      end: [STG[0], baseY + heights[2], 0],
      color: C.amber,
      strokeWidth: 3,
    }),
    new M.Line({
      start: [STG[0] - 0.1, baseY + heights[1], 0],
      end: [STG[0] + 0.1, baseY + heights[1], 0],
      color: C.amber,
      strokeWidth: 3,
    }),
    new M.Line({
      start: [STG[0] - 0.1, baseY + heights[2], 0],
      end: [STG[0] + 0.1, baseY + heights[2], 0],
      color: C.amber,
      strokeWidth: 3,
    })
  );

  const gapUnknown = T('same gap?  cannot tell', 18, C.pink, true);
  gapUnknown.moveTo([STG[0], baseY + 2.35, 0]);

  await until(S(14));
  await play(
    new M.FadeOut(gapQuestion),
    new M.Create(gap1),
    new M.Create(gap2),
    new M.FadeIn(gapUnknown),
    ...say('WE CANNOT TELL IF THE GAPS MATCH', C.pink)
  );

  // ---------- 15: not necessarily twice as big ----------
  await until(S(15));
  await play(
    ...say('IS LARGE TWICE AS BIG? WE CANNOT SAY', C.amber),
    new M.Indicate(sizeBars[2], { color: C.amber })
  );

  // ---------- 16: price column and dollar line ----------
  const priceCol = colbox(3, C.cyan);

  const LEN = SW - 0.6;
  const unit = LEN / 6;
  const lineY = STG[1] - 0.9;
  const lineX = STG[0] - LEN / 2;
  const px = v => lineX + v * unit;

  const priceLine = new M.Line({
    start: [lineX, lineY, 0],
    end: [lineX + LEN, lineY, 0],
    color: C.muted,
    strokeWidth: 3,
  });

  const ticks = [];
  const tickLabels = [];

  for (let v = 0; v <= 6; v++) {
    ticks.push(new M.Line({
      start: [px(v), lineY - 0.08, 0],
      end: [px(v), lineY + 0.08, 0],
      color: C.muted,
      strokeWidth: 2,
    }));

    const lab = T(String(v), 18, C.muted, true);
    lab.moveTo([px(v), lineY - 0.3, 0]);
    tickLabels.push(lab);
  }

  const dollarLabel = T('dollars', 16, C.muted);
  dollarLabel.moveTo([STG[0], lineY - 0.65, 0]);

  const seen = {};
  const priceDots = PRICE.map(v => {
    const j = seen[v] || 0;
    seen[v] = j + 1;

    const d = new M.Circle({
      radius: 0.11,
      color: C.cyan,
      strokeWidth: 1.5,
    });
    d.setFill(C.cyan, 0.85);
    d.moveTo([px(v), lineY + 0.34 + j * 0.32, 0]);
    return d;
  });

  const axisGroup = new M.VGroup(priceLine, ...ticks, ...tickLabels, dollarLabel);
  const dotGroup = new M.VGroup(...priceDots);

  await until(S(16));
  await play(
    new M.FadeOut(new M.VGroup(sizeStage, gap1, gap2, gapUnknown, sizeCol)),
    new M.Create(priceCol),
    ...say('PRICE COLUMN', C.cyan)
  );
  await play(
    new M.Create(priceLine),
    new M.FadeIn(new M.VGroup(...ticks, ...tickLabels, dollarLabel)),
    new M.LaggedStart(
      priceDots.map(d => new M.FadeIn(d)),
      { lagRatio: 0.25, runTime: 1.5 }
    )
  );

  // ---------- 17: price is not size ----------
  await until(S(17));
  await play(
    ...say('PRICE = WHAT IT COSTS, NOT HOW BIG', C.amber),
    new M.Indicate(heads[2], { color: C.muted }),
    new M.Indicate(heads[3], { color: C.amber })
  );

  // ---------- 18: prices can be ranked ----------
  await until(S(18));
  await play(
    new M.Indicate(priceDots[0], { color: C.amber }),
    new M.Indicate(priceDots[2], { color: C.amber }),
    ...say('RANKED: 5 DOLLARS IS MORE THAN 3', C.cyan)
  );

  // ---------- 19: how much more? ----------
  const bigGap = new M.VGroup(
    new M.Line({
      start: [px(3), lineY + 1.25, 0],
      end: [px(5), lineY + 1.25, 0],
      color: C.amber,
      strokeWidth: 3,
    }),
    new M.Line({
      start: [px(3), lineY + 1.1, 0],
      end: [px(3), lineY + 1.4, 0],
      color: C.amber,
      strokeWidth: 3,
    }),
    new M.Line({
      start: [px(5), lineY + 1.1, 0],
      end: [px(5), lineY + 1.4, 0],
      color: C.amber,
      strokeWidth: 3,
    })
  );

  const gapLabel = T('2 dollars more', 19, C.amber, true);
  gapLabel.moveTo([(px(3) + px(5)) / 2, lineY + 1.55, 0]);

  await until(S(19));
  await play(
    new M.Create(bigGap),
    new M.FadeIn(gapLabel),
    ...say('STEP 3: HOW MUCH MORE?', C.green)
  );

  // ---------- 20: equal dollar gaps ----------
  const unitGaps = Array.from({ length: 6 }, (_, k) =>
    new M.Line({
      start: [px(k), lineY + 0.15, 0],
      end: [px(k + 1), lineY + 0.15, 0],
      color: C.green,
      strokeWidth: 6,
    })
  );

  const equalLabel = T('equal one-dollar gaps', 18, C.green, true);
  equalLabel.moveTo([STG[0], lineY + 1.6, 0]);

  await until(S(20));
  await play(
    new M.FadeOut(bigGap),
    new M.FadeOut(gapLabel),
    new M.LaggedStart(
      unitGaps.map(g => new M.Create(g)),
      { lagRatio: 0.2, runTime: 1.4 }
    ),
    new M.FadeIn(equalLabel),
    ...say('EVERY DOLLAR IS THE SAME AMOUNT', C.green)
  );

  // ---------- 21: one-dollar gaps from 3 to 4 and 4 to 5 ----------
  function unitArrow(a) {
    const y = lineY + 1.25;

    return new M.VGroup(
      new M.Line({
        start: [px(a), y, 0],
        end: [px(a + 1), y, 0],
        color: C.amber,
        strokeWidth: 3,
      }),
      new M.Line({
        start: [px(a + 1) - 0.14, y + 0.1, 0],
        end: [px(a + 1), y, 0],
        color: C.amber,
        strokeWidth: 2,
      }),
      new M.Line({
        start: [px(a + 1) - 0.14, y - 0.1, 0],
        end: [px(a + 1), y, 0],
        color: C.amber,
        strokeWidth: 2,
      })
    );
  }

  const a34 = unitArrow(3);
  const a45 = unitArrow(4);

  const l34 = T('1 dollar', 16, C.amber, true);
  l34.moveTo([(px(3) + px(4)) / 2, lineY + 1.5, 0]);

  const l45 = T('1 dollar', 16, C.amber, true);
  l45.moveTo([(px(4) + px(5)) / 2, lineY + 1.8, 0]);

  await until(S(21));
  await play(
    new M.FadeOut(new M.VGroup(...unitGaps, equalLabel)),
    new M.Create(a34),
    new M.FadeIn(l34),
    ...say('3 TO 4: ONE DOLLAR · 4 TO 5: ONE DOLLAR', C.amber)
  );
  await play(
    new M.Create(a45),
    new M.FadeIn(l45)
  );

  // ---------- 22: true zero ----------
  const zeroDot = new M.Circle({
    radius: 0.17,
    color: C.green,
    strokeWidth: 3,
  });
  zeroDot.setFill(C.green, 0.2);
  zeroDot.moveTo([px(0), lineY, 0]);

  const zeroLabel = T('0 dollars = free', 19, C.green, true);
  zeroLabel.moveTo([px(0) + 0.85, lineY + 0.55, 0]);

  await until(S(22));
  await play(
    new M.FadeOut(new M.VGroup(a34, a45, l34, l45)),
    new M.FadeIn(zeroDot),
    new M.FadeIn(zeroLabel),
    ...say('TRUE ZERO: NO MONEY AT ALL', C.green)
  );

  // ---------- 23: how many times as much? ----------
  await until(S(23));
  await play(
    ...say('STEP 4: HOW MANY TIMES AS MUCH?', C.green),
    new M.Indicate(zeroLabel, { color: C.green })
  );

  // ---------- 24: six dollars is twice three dollars ----------
  const bar3 = new M.Rectangle({
    width: 3 * unit,
    height: 0.32,
    color: C.cyan,
    strokeWidth: 1,
  });
  bar3.setFill(C.cyan, 0.85);
  bar3.moveTo([lineX + 1.5 * unit, lineY + 0.95, 0]);

  const bar6a = new M.Rectangle({
    width: 3 * unit,
    height: 0.32,
    color: C.amber,
    strokeWidth: 1,
  });
  bar6a.setFill(C.amber, 0.85);
  bar6a.moveTo([lineX + 1.5 * unit, lineY + 1.5, 0]);

  const bar6b = new M.Rectangle({
    width: 3 * unit,
    height: 0.32,
    color: C.amber,
    strokeWidth: 1,
  });
  bar6b.setFill(C.amber, 0.55);
  bar6b.moveTo([lineX + 4.5 * unit, lineY + 1.5, 0]);

  // dark text on the bright bars, so the words stay readable
  const label3 = T('3 dollars', 16, C.bg, true);
  label3.moveTo([lineX + 1.5 * unit, lineY + 0.95, 0]);
  const label6bar = T('6 dollars', 16, C.bg, true);
  label6bar.moveTo([lineX + 3 * unit, lineY + 1.5, 0]);

  const label6 = T('6 = 3 + 3: twice', 16, C.amber, true);
  label6.moveTo([STG[0], lineY + 2.0, 0]);

  const imagined = T('imagined order', 15, C.muted);
  imagined.moveTo([STG[0], lineY + 2.3, 0]);

  const ratioPicture = new M.VGroup(
    bar3, bar6a, bar6b, label3, label6bar, label6, imagined
  );

  await until(S(24));
  await play(
    new M.FadeOut(zeroLabel),
    new M.FadeOut(dotGroup),
    new M.FadeIn(bar3),
    new M.FadeIn(label3),
    ...say('3 DOLLARS, THEN 3 MORE = TWICE AS MUCH', C.amber)
  );
  await play(
    new M.FadeIn(bar6a),
    new M.FadeIn(bar6b),
    new M.FadeIn(label6bar),
    new M.FadeIn(label6),
    new M.FadeIn(imagined)
  );

  // ---------- 25: the four-question ladder ----------
  const ladderH = P ? 1.1 : 0.62;
  const ladderGap = P ? 0.75 : 0.30;
  const ladderLeft = LC[0] - RW / 2;

  const rungY = Array.from(
    { length: 4 },
    (_, k) => LC[1] - 1.4 + k * (ladderH + ladderGap)
  );

  const rungRects = rungY.map(y => {
    const r = new M.RoundedRectangle({
      width: RW,
      height: ladderH,
      cornerRadius: 0.12,
      color: C.muted,
      strokeWidth: 2,
    });
    r.setFill(C.card, 0.95);
    r.moveTo([LC[0], y, 0]);
    return r;
  });

  const rails = new M.VGroup(
    new M.Line({
      start: [ladderLeft - 0.12, rungY[0] - 0.6, 0],
      end: [ladderLeft - 0.12, rungY[3] + 0.6, 0],
      color: C.muted,
      strokeWidth: 5,
    }),
    new M.Line({
      start: [ladderLeft + RW + 0.12, rungY[0] - 0.6, 0],
      end: [ladderLeft + RW + 0.12, rungY[3] + 0.6, 0],
      color: C.muted,
      strokeWidth: 5,
    })
  );

  const rungNumbers = rungY.map((y, k) => {
    const t = T(String(k + 1), 20, C.muted, true);
    t.moveTo([ladderLeft + 0.3, y, 0]);
    return t;
  });

  const rungTexts = QS.map((q, k) => {
    const t = fit(T(q, P ? 22 : 18, C.ink, true), RW * 0.65);
    t.moveTo([ladderLeft + 0.65 + t.getWidth() / 2, rungY[k], 0]);
    return t;
  });

  await until(S(25));
  await play(
    new M.FadeOut(table),
    new M.FadeOut(priceCol),
    new M.FadeOut(new M.VGroup(
      priceLine,
      ...ticks,
      ...tickLabels,
      dollarLabel,
      ...priceDots,
      bigGap,
      gapLabel,
      ...unitGaps,
      equalLabel,
      a34,
      a45,
      l34,
      l45,
      zeroDot,
      zeroLabel,
      ratioPicture
    )),
    ...say('4 QUESTIONS = 4 STEPS OF A LADDER', C.cyan)
  );
  await play(
    new M.Create(rails),
    new M.LaggedStart(
      rungRects.map(r => new M.FadeIn(r)),
      { lagRatio: 0.2, runTime: 1.3 }
    ),
    new M.FadeIn(new M.VGroup(...rungNumbers))
  );

  // ---------- 26: steps one and two ----------
  await until(S(26));
  await play(
    new M.FadeIn(rungTexts[0]),
    new M.Indicate(rungRects[0], { color: C.green }),
    ...say('STEP 1: SAME OR DIFFERENT?', C.green)
  );
  await play(
    new M.FadeIn(rungTexts[1]),
    new M.Indicate(rungRects[1], { color: C.green }),
    ...say('STEP 2: WHICH IS MORE?', C.green)
  );

  // ---------- 27: steps three and four ----------
  await until(S(27));
  await play(
    new M.FadeIn(rungTexts[2]),
    new M.Indicate(rungRects[2], { color: C.green }),
    ...say('STEP 3: HOW MUCH MORE?', C.green)
  );
  await play(
    new M.FadeIn(rungTexts[3]),
    new M.Indicate(rungRects[3], { color: C.green }),
    ...say('STEP 4: HOW MANY TIMES AS MUCH?', C.green)
  );

  // ---------- 28: a high column can answer lower questions ----------
  const tagX = ladderLeft + RW - 0.85;
  // tags sit inside the right end of their rung (never past the border)
  const tagAt = (p, y) => { p.moveTo([ladderLeft + RW - 0.2 - p.getWidth() / 2, y, 0]); return p; };

  const priceTag = tagAt(chip('PRICE', C.amber, 16), rungY[3]);

  await until(S(28));
  await play(
    new M.FadeIn(priceTag),
    ...say('PRICE REACHES STEP 4, AND THE STEPS BELOW', C.amber, 17)
  );
  await play(
    new M.Indicate(rungRects[2], { color: C.amber }),
    new M.Indicate(rungRects[1], { color: C.amber }),
    new M.Indicate(rungRects[0], { color: C.amber })
  );

  // ---------- 29: the name measurement scale ----------
  await until(S(29));
  await play(
    ...say('MEASUREMENT SCALE = HIGHEST STEP REACHED', C.cyan, 17)
  );

  // ---------- 30: drink is nominal ----------
  const drinkTag = tagAt(chip('DRINK · NOMINAL', C.violet, 16), rungY[0]);

  await until(S(30));
  await play(
    new M.FadeIn(drinkTag),
    new M.Indicate(rungRects[0], { color: C.violet }),
    ...say('NOMINAL = NAMES ONLY', C.violet)
  );

  // ---------- 31: size is ordinal ----------
  const sizeTag = tagAt(chip('SIZE · ORDINAL', C.violet, 16), rungY[1]);

  await until(S(31));
  await play(
    new M.FadeIn(sizeTag),
    new M.Indicate(rungRects[1], { color: C.violet }),
    ...say('ORDINAL = IN ORDER', C.violet)
  );

  // ---------- 32: thermometer, interval example ----------
  const thermometerX = SIDE[0] - (P ? 1.55 : 2.0);
  const thermBase = SIDE[1] - 1.0;
  const ty = deg => thermBase + 0.2 + deg / 30 * 1.6;

  const tube = new M.RoundedRectangle({
    width: 0.34,
    height: 2.2,
    cornerRadius: 0.17,
    color: C.ink,
    strokeWidth: 2,
  });
  tube.setFill(C.card, 0.4);
  tube.moveTo([thermometerX, SIDE[1] + 0.1, 0]);

  const bulb = new M.Circle({
    radius: 0.3,
    color: C.pink,
    strokeWidth: 2,
  });
  bulb.setFill(C.pink, 0.9);
  bulb.moveTo([thermometerX, thermBase + 0.05, 0]);

  const fluid = new M.Rectangle({
    width: 0.14,
    height: ty(20) - thermBase,
    color: C.pink,
    strokeWidth: 0,
  });
  fluid.setFill(C.pink, 0.9);
  fluid.moveTo([
    thermometerX,
    (ty(20) + thermBase) / 2,
    0,
  ]);

  const thermMarks = [];
  const thermLabels = [];

  for (const deg of [0, 10, 20, 30]) {
    const mark = new M.Line({
      start: [thermometerX + 0.2, ty(deg), 0],
      end: [thermometerX + 0.42, ty(deg), 0],
      color: C.muted,
      strokeWidth: 2,
    });

    const lab = T(`${deg}°`, 18, C.muted, true);
    lab.moveTo([thermometerX + 0.68, ty(deg), 0]);

    thermMarks.push(mark);
    thermLabels.push(lab);
  }

  const thermometer = new M.VGroup(
    tube,
    bulb,
    fluid,
    ...thermMarks,
    ...thermLabels
  );

  const intervalTag = tagAt(chip('THERMOMETER · INTERVAL', C.violet, 16), rungY[2]);

  await until(S(32));
  await play(
    new M.FadeIn(thermometer),
    new M.Indicate(rungRects[2], { color: C.pink }),
    new M.FadeIn(intervalTag),
    ...say('THERMOMETER IN CELSIUS: STEP 3', C.pink, 17)
  );

  // ---------- 33: equal gaps, but zero is not no heat ----------
  const gapMarks = [0, 10, 20].map(deg => {
    const y1 = ty(deg);
    const y2 = ty(deg + 10);
    const gx = thermometerX - 0.35;

    return new M.VGroup(
      new M.Line({
        start: [gx, y1, 0],
        end: [gx, y2, 0],
        color: C.green,
        strokeWidth: 3,
      }),
      new M.Line({
        start: [gx - 0.08, y1, 0],
        end: [gx + 0.08, y1, 0],
        color: C.green,
        strokeWidth: 2,
      }),
      new M.Line({
        start: [gx - 0.08, y2, 0],
        end: [gx + 0.08, y2, 0],
        color: C.green,
        strokeWidth: 2,
      })
    );
  });

  const zeroExplanation = T('0°C = water freezes', 18, C.pink, true);
  fit(zeroExplanation, SIDEW - 1.3);
  zeroExplanation.moveTo([SIDE[0] + 0.85, ty(0), 0]);

  const noHeat = T('not “no heat”', 18, C.pink, true);
  noHeat.moveTo([SIDE[0] + 0.85, ty(0) - 0.35, 0]);

  await until(S(33));
  await play(
    new M.LaggedStart(
      gapMarks.map(g => new M.FadeIn(g)),
      { lagRatio: 0.3, runTime: 1.2 }
    ),
    ...say('EQUAL GAPS, BUT ZERO IS NOT NO HEAT', C.pink, 17)
  );
  await play(
    new M.FadeIn(zeroExplanation),
    new M.FadeIn(noHeat),
    new M.Indicate(thermMarks[0], { color: C.pink })
  );

  // ---------- 34: 20 degrees is not twice 10 ----------
  const twentyNotTwice = fit(
    T('20° is not twice 10°', 20, C.amber, true),
    SIDEW
  );
  twentyNotTwice.moveTo([SIDE[0], SIDE[1] - 1.45, 0]);

  await until(S(34));
  await play(
    new M.FadeIn(twentyNotTwice),
    new M.Indicate(thermMarks[2], { color: C.amber }),
    new M.Indicate(thermMarks[1], { color: C.amber }),
    ...say('INTERVAL = A GAP, NOT A RATIO', C.violet)
  );

  // ---------- 35: price is ratio ----------
  const ratioTag = tagAt(chip('PRICE · RATIO', C.violet, 16), rungY[3]);

  await until(S(35));
  await play(
    new M.FadeOut(priceTag),
    new M.FadeIn(ratioTag),
    new M.Indicate(rungRects[3], { color: C.violet }),
    ...say('RATIO = HOW MANY TIMES', C.violet)
  );

  // ---------- 36: the trap: size typed as numbers ----------
  const sizeWordPills = ['small', 'medium', 'large'].map((s, k) => {
    const p = chip(s, C.cyan, 20);
    p.moveTo([
      SIDE[0] + (k - 1) * (P ? 2.0 : 1.55),
      SIDE[1] + 0.75,
      0,
    ]);
    return p;
  });

  const trapGroup = new M.VGroup(...sizeWordPills);

  await until(S(36));
  await play(
    new M.FadeOut(new M.VGroup(
      thermometer,
      ...gapMarks,
      zeroExplanation,
      noHeat,
      twentyNotTwice
    )),
    new M.FadeIn(trapGroup),
    ...say('TRAP: SIZES TYPED AS 1, 2, 3', C.pink)
  );

  // ---------- 37: the misleading appearance ----------
  const numberPills = ['1', '2', '3'].map((s, k) => {
    const p = chip(s, C.pink, 24);
    p.moveTo([
      SIDE[0] + (k - 1) * (P ? 2.0 : 1.55),
      SIDE[1] + 0.75,
      0,
    ]);
    return p;
  });

  const numberGroup = new M.VGroup(...numberPills);

  const fakeRatio = T('3 = 3 × 1 ?', 28, C.pink, true);
  fakeRatio.moveTo([SIDE[0], SIDE[1] - 0.25, 0]);

  await until(S(37));
  await play(
    new M.FadeOut(trapGroup),
    new M.FadeIn(numberGroup),
    new M.FadeIn(fakeRatio),
    ...say('THE COLUMN NOW LOOKS NUMERICAL', C.pink)
  );

  // ---------- 38: the numbers only mark positions ----------
  const fakeCross = new M.VGroup(
    new M.Line({
      start: [SIDE[0] - 1.1, SIDE[1] - 0.55, 0],
      end: [SIDE[0] + 1.1, SIDE[1] + 0.05, 0],
      color: C.pink,
      strokeWidth: 5,
    }),
    new M.Line({
      start: [SIDE[0] - 1.1, SIDE[1] + 0.05, 0],
      end: [SIDE[0] + 1.1, SIDE[1] - 0.55, 0],
      color: C.pink,
      strokeWidth: 5,
    })
  );

  const positionNote = fit(
    T('only positions in the order', 20, C.amber, true),
    SIDEW
  );
  positionNote.moveTo([SIDE[0], SIDE[1] - 1.05, 0]);

  await until(S(38));
  await play(
    new M.Create(fakeCross),
    new M.FadeIn(positionNote),
    ...say('THE NUMBERS ONLY MARK POSITIONS', C.amber)
  );

  // ---------- 39: writing a number does not change the scale ----------
  await until(S(39));
  await play(
    ...say('WRITING A NUMBER DOES NOT CHANGE THE SCALE', C.amber, 17),
    new M.Indicate(sizeTag, { color: C.amber })
  );

  // ---------- 40: check how high a column reaches ----------
  await until(S(40));
  await play(
    new M.FadeOut(new M.VGroup(
      numberGroup,
      fakeRatio,
      fakeCross,
      positionNote
    )),
    ...say('BEFORE YOU CALCULATE: CHECK THE HIGHEST STEP', C.green, 17)
  );
  await play(
    new M.Indicate(drinkTag, { color: C.green }),
    new M.Indicate(sizeTag, { color: C.green }),
    new M.Indicate(intervalTag, { color: C.green }),
    new M.Indicate(ratioTag, { color: C.green })
  );

  // ---------- 41: prices can be added ----------
  await until(S(41));
  await play(
    ...fbox([
      ['prices: 3 + 4 + 5 + 4 + 4 + 3', C.ink],
      ['= 23 dollars: useful', C.green],
    ], C.green),
    new M.Indicate(ratioTag, { color: C.green })
  );

  // ---------- 42: sizes cannot be added meaningfully ----------
  await until(S(42));
  await play(
    ...fbox([
      ['prices: 3 + 4 + 5 + 4 + 4 + 3', C.ink],
      ['= 23 dollars: useful', C.green],
      ['sizes: small + large', C.ink],
      ['= ?  not a size', C.pink],
    ], C.pink),
    new M.Indicate(sizeTag, { color: C.pink })
  );

  // ---------- 43: recap ----------
  await until(S(43));
  await play(
    ...say('DRINK: NOMINAL · SIZE: ORDINAL · PRICE: RATIO', C.green, 16),
    new M.LaggedStart(
      [
        new M.Indicate(drinkTag, { color: C.green }),
        new M.Indicate(sizeTag, { color: C.green }),
        new M.Indicate(ratioTag, { color: C.green }),
      ],
      { lagRatio: 0.4, runTime: 2.0 }
    )
  );
}
