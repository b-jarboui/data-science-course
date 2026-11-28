// lesson 6.2.1
// Confidence interval coverage — live narration-synchronised animation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the fixed, checked simulation results from the shared chapter data.
// Runtime verification requires the course's browser engine.

export default async function (L) {
  const { M, sc, P, FW, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  // Fixed shared chapter data.
  const D1 = [23, 25, 26, 26, 27, 28, 29, 30, 30, 31, 32, 33, 34, 34, 35, 37];

  // Training simulation: seed 64, true mean 30, standard deviation 4.
  const MEANS = [
    29.1, 29.8, 33.2, 30.6, 31.5,
    30.9, 30.3, 31.7, 28.9, 29.3,
    29.1, 29.1, 30.2, 29.9, 31.2,
    30.5, 30.4, 29.8, 30.4, 31.1
  ];

  const TRUTH = 30;
  const GOLD = C.amber;
  const MISS = C.red || '#F87171';

  // Approved responsive layout: picture on left, formula box on right
  // for laptop; formula box above picture for phone.
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.48, 0] : [4.3, -0.3, 0];

  const W = P ? FW - 1.8 : 6.6;
  const LEFT = CX - W / 2;
  const RIGHT = CX + W / 2;

  const AY = P ? -1.65 : -1.05;
  const NETY = AY + 1.0;

  const ROWTOP = P ? 1.30 : 1.12;
  const ROWPITCH = P ? 0.30 : 0.17;
  const SIMAXIS = P ? -4.78 : -2.44;

  const rowY = i => ROWTOP - i * ROWPITCH;
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const catches = (m, r) => Math.abs(m - TRUTH) <= r + 1e-9;
  const fade = xs => xs.map(x => new M.FadeOut(x));

  const realX = v => LEFT + (v - 22) / 16 * W;
  const simX = v => LEFT + (v - 26) / 10 * W;

  function txt(s, size, color, pos, mono = false) {
    const t = T(s, size, color, mono);
    t.moveTo(pos);
    return t;
  }

  function ln(x1, y1, x2, y2, color = C.muted, strokeWidth = 2) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth
    });
  }

  // Formula box, following the approved reference lesson.
  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.40 : 0.42;

    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

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
      const ind = cw *
        (rows[i][0].length - rows[i][0].trimStart().length);

      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.0;

    if (wd > maxw) g.scale(maxw / wd);

    const a = [new M.FadeIn(g)];

    if (boxNow) a.push(new M.FadeOut(boxNow));

    boxNow = g;
    return a;
  }

  // Number line with labelled ticks.
  function axis(xmap, values, y, unit = 'minutes') {
    const line = ln(
      xmap(values[0]), y,
      xmap(values[values.length - 1]), y,
      C.muted, 3
    );

    const ticks = values.map(v => new M.VGroup(
      ln(xmap(v), y - 0.07, xmap(v), y + 0.07, C.muted),
      txt(String(v), P ? 17 : 16, C.muted,
        [xmap(v), y - 0.27, 0], true)
    ));

    const label = txt(
      unit, 15, C.muted,
      [RIGHT - 0.35, y - 0.51, 0]
    );

    return new M.VGroup(line, ...ticks, label);
  }

  // Glowing data dot. All children are positioned before grouping.
  function glowDot(x, y, color = C.cyan, radius = 0.10) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 2.0,
      color
    });

    halo.setFill(color, 0.16);

    const d = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    d.setFill(color, 1);

    return new M.VGroup(halo, d);
  }

  // A horizontal interval ("net"), with caps at both endpoints.
  // A small gap at its centre keeps the sample-mean dot visible.
  function net(xmap, m, r, y, color = C.cyan, cap = 0.11, gap = 0.07) {
    const lo = xmap(m - r);
    const hi = xmap(m + r);
    const mid = xmap(m);

    return new M.VGroup(
      ln(lo, y, mid - gap, y, color, 5),
      ln(mid + gap, y, hi, y, color, 5),
      ln(lo, y - cap, lo, y + cap, color, 2),
      ln(hi, y - cap, hi, y + cap, color, 2)
    );
  }

  // The fixed truth is shown only in the training simulation.
  function truthLine(xmap, bottom, top) {
    const l = ln(xmap(TRUTH), bottom, xmap(TRUTH), top, GOLD, 3);

    const label = txt(
      'TRUE MEAN = 30',
      P ? 17 : 15,
      GOLD,
      [xmap(TRUTH), top + 0.24, 0],
      true
    );

    return new M.VGroup(l, label);
  }

  // Real delivery data: duplicate observations stack vertically.
  function deliveryDots() {
    return D1.map((v, i) => {
      const repeat = D1.slice(0, i).filter(x => x === v).length;

      return glowDot(
        realX(v),
        AY + 0.22 + repeat * 0.29,
        C.cyan,
        P ? 0.085 : 0.095
      );
    });
  }

  // Empty 20-sample simulation chart.
  function makeChart() {
    const a = axis(simX, [26, 28, 30, 32, 34, 36], SIMAXIS);

    const truth = truthLine(
      simX,
      SIMAXIS,
      ROWTOP + 0.12
    );

    const labels = new M.VGroup(
      ...[0, 1, 2, 4, 9, 14, 19].map(i =>
        txt(
          String(i + 1),
          P ? 17 : 11,
          C.muted,
          [LEFT - (P ? 0.36 : 0.30), rowY(i), 0],
          true
        )
      )
    );

    const dots = MEANS.map((m, i) =>
      glowDot(
        simX(m),
        rowY(i),
        C.cyan,
        P ? 0.065 : 0.042
      )
    );

    const dotGroup = new M.VGroup(...dots);

    return {
      axis: a,
      truth,
      labels,
      dots,
      dotGroup,
      nets: []
    };
  }

  function chartNet(i, radius, color = C.cyan) {
    return net(
      simX,
      MEANS[i],
      radius,
      rowY(i),
      color,
      P ? 0.075 : 0.047,
      P ? 0.065 : 0.045
    );
  }

  function chartParts(chart) {
    return [
      chart.axis,
      chart.truth,
      chart.labels,
      chart.dotGroup,
      ...chart.nets
    ];
  }

  // Replace one interval without regrouping objects already on screen.
  function recolorNet(chart, i, radius, color) {
    const old = chart.nets[i];
    const next = chartNet(i, radius, color);
    chart.nets[i] = next;

    return [
      new M.FadeOut(old),
      new M.FadeIn(next)
    ];
  }

  // A representative picture of 100 interval throws.
  // Ten columns, each with its own fixed gold truth line.
  // The pictogram represents rounded coverage, not raw simulation draws.
  function hundredNets(caught, radius, neutral = false) {
    const cols = 10;
    const rows = 10;

    const dx = W / cols;
    const dy = P ? 0.48 : 0.30;
    const top = P ? 1.32 : 1.13;

    const parts = [];

    for (let col = 0; col < cols; col++) {
      const x = LEFT + (col + 0.5) * dx;

      parts.push(
        ln(
          x, top - (rows - 1) * dy - 0.12,
          x, top + 0.12,
          GOLD, 1.8
        )
      );
    }

    for (let i = 0; i < 100; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = LEFT + (col + 0.5) * dx;
      const y = top - row * dy;

      // Deterministic ordering keeps the illustration stable on replay.
      const rank = (i * 37 + 11) % 100;
      const ok = rank < caught;
      const side = i % 2 === 0 ? -1 : 1;

      const half = dx * (radius === 2 ? 0.23 : 0.135);

      const offset = ok
        ? side * half * (0.15 + (i % 5) * 0.13)
        : side * half * 1.36;

      const center = x + offset;

      const color = neutral
        ? C.cyan
        : ok ? C.green : MISS;

      const cap = P ? 0.055 : 0.041;

      parts.push(new M.VGroup(
        ln(center - half, y, center + half, y, color, 3),
        ln(center - half, y - cap, center - half, y + cap, color, 1),
        ln(center + half, y - cap, center + half, y + cap, color, 1),
        new M.Dot({
          point: [center, y, 0],
          radius: P ? 0.026 : 0.021,
          color
        })
      ));
    }

    const noteY = top - (rows - 1) * dy - 0.44;

    parts.push(txt(
      '100 representative nets',
      P ? 17 : 16,
      C.muted,
      [CX, noteY, 0]
    ));

    if (!neutral) {
      parts.push(txt(
        `${caught} caught  ·  ${100 - caught} missed`,
        P ? 20 : 18,
        C.ink,
        [CX, noteY - 0.38, 0],
        true
      ));
    }

    return new M.VGroup(...parts);
  }

  // Two nets centred on the same estimate, for the width comparison.
  function comparison() {
    const x = v => LEFT + (v - 26) / 8 * W;

    const wideY = P ? 0.15 : 0.15;
    const narrowY = P ? -1.75 : -1.20;
    const baseY = P ? -3.55 : -2.20;

    const a = axis(x, [26, 28, 30, 32, 34], baseY);

    const wide = net(x, 30, 2, wideY, C.green, 0.16, 0.10);
    const narrow = net(x, 30, 1, narrowY, C.violet, 0.16, 0.10);

    const wideDot = glowDot(x(30), wideY, C.green, 0.09);
    const narrowDot = glowDot(x(30), narrowY, C.violet, 0.09);

    const wideTitle = txt(
      'WIDER NET: ±2 MINUTES',
      P ? 19 : 17,
      C.green,
      [CX, wideY + 0.48, 0]
    );

    const narrowTitle = txt(
      'NARROWER NET: ±1 MINUTE',
      P ? 19 : 17,
      C.violet,
      [CX, narrowY + 0.48, 0]
    );

    const wideStat = txt(
      '95.5% coverage',
      P ? 20 : 18,
      C.green,
      [CX, wideY - 0.48, 0],
      true
    );

    const narrowStat = txt(
      '68.3% coverage',
      P ? 20 : 18,
      C.violet,
      [CX, narrowY - 0.48, 0],
      true
    );

    return new M.VGroup(
      a,
      wide, narrow,
      wideDot, narrowDot,
      wideTitle, narrowTitle,
      wideStat, narrowStat
    );
  }

  // ---------------------------------------------------------------
  // 0: Meet Sami, a courier who drives the same route every day.
  // ---------------------------------------------------------------

  const roadY = P ? -1.75 : -0.95;

  const road = ln(
    CX - 2.65, roadY,
    CX + 2.65, roadY,
    C.muted, 5
  );

  const stops = [-2.4, 0, 2.4].map((dx, i) =>
    glowDot(
      CX + dx,
      roadY,
      i === 0 ? C.cyan : C.muted,
      0.11
    )
  );

  const head = new M.Circle({
    radius: 0.23,
    color: C.ink
  });

  head.setFill(C.ink, 1);
  head.moveTo([CX - 0.28, roadY + 1.30, 0]);

  const body = new M.Arc({
    radius: 0.43,
    startAngle: 0,
    angle: Math.PI,
    color: C.ink
  });

  body.setFill(C.ink, 1);
  body.moveTo([CX - 0.28, roadY + 0.73, 0]);

  const parcel = new M.RoundedRectangle({
    width: 0.62,
    height: 0.53,
    cornerRadius: 0.05,
    color: GOLD,
    strokeWidth: 2
  });

  parcel.setFill(GOLD, 0.28);
  parcel.moveTo([CX + 0.42, roadY + 0.81, 0]);

  const tape = ln(
    CX + 0.42, roadY + 0.55,
    CX + 0.42, roadY + 1.07,
    GOLD, 2
  );

  const name = txt(
    'Sami',
    23,
    C.ink,
    [CX, roadY + 1.80, 0]
  );

  const routeLabel = txt(
    'Same delivery route',
    18,
    C.muted,
    [CX, roadY - 0.48, 0]
  );

  const courier = new M.VGroup(head, body, parcel, tape, name);
  const route = new M.VGroup(road, ...stops, routeLabel);

  await until(S(0));
  await play(
    new M.FadeIn(courier),
    new M.FadeIn(route),
    ...say('MEET SAMI'),
    ...fbox([
      ['ONE COURIER', C.cyan],
      'One delivery route',
      'Day after day'
    ])
  );

  // ---------------------------------------------------------------
  // 1: Sixteen delivery times.
  // ---------------------------------------------------------------

  const realAxis = axis(realX, [22, 26, 30, 34, 38], AY);
  const deliveries = deliveryDots();

  await until(S(1));
  await play(
    new M.FadeOut(courier),
    new M.FadeOut(route),
    new M.FadeIn(realAxis),
    new M.LaggedStart(
      deliveries.map(d => new M.FadeIn(d)),
      { lagRatio: 0.09, runTime: 2.1 }
    ),
    ...say('16 TIMED DELIVERIES'),
    ...fbox([
      'sample size = 16',
      ['23 to 37 minutes', C.cyan]
    ])
  );

  // ---------------------------------------------------------------
  // 2: Sample mean = 30 minutes.
  // ---------------------------------------------------------------

  const estimateDot = glowDot(realX(30), NETY, C.violet, 0.13);

  const estimateLabel = txt(
    'SAMPLE MEAN: 30',
    P ? 18 : 17,
    C.violet,
    [realX(30), NETY + 0.44, 0],
    true
  );

  const estimate = new M.VGroup(estimateDot, estimateLabel);

  await until(S(2));
  await play(
    new M.FadeIn(estimate),
    ...say('MEAN = 30 MINUTES', C.violet),
    ...fbox([
      '480 ÷ 16',
      ['mean = 30 minutes', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 3–6: Parameter versus estimate.
  // The real route's true mean must remain unknown.
  // ---------------------------------------------------------------

  await until(S(3));
  await play(
    ...say('ALL DELIVERIES, PAST AND FUTURE', GOLD),
    ...fbox([
      ['TRUE MEAN = ?', GOLD],
      'All deliveries',
      'Not just our sixteen'
    ], GOLD)
  );

  await until(S(4));
  await play(
    ...say('PARAMETER = FIXED, UNKNOWN TARGET', GOLD),
    ...fbox([
      ['parameter', GOLD],
      'The true mean',
      'Fixed but unknown'
    ], GOLD)
  );

  await until(S(5));
  await play(
    new M.Indicate(estimate, { color: C.violet }),
    ...say('ESTIMATE = OUR GUESS', C.violet),
    ...fbox([
      ['estimate = 30', C.violet],
      ['parameter = ?', GOLD]
    ], C.violet)
  );

  await until(S(6));
  await play(
    new M.Indicate(estimateDot, { color: C.violet }),
    ...say('ONE GUESS IS NOT THE WHOLE STORY', C.violet),
    ...fbox([
      ['30 = best single guess', C.violet],
      'Probably not exact'
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 7–8: Replace a single estimate with a range.
  // ---------------------------------------------------------------

  const firstNet = net(
    realX, 30, 2, NETY,
    C.cyan, 0.18, 0.13
  );

  const firstLo = txt(
    '28', 18, C.cyan,
    [realX(28), NETY - 0.39, 0], true
  );

  const firstHi = txt(
    '32', 18, C.cyan,
    [realX(32), NETY - 0.39, 0], true
  );

  const firstEnds = new M.VGroup(firstLo, firstHi);

  await until(S(7));
  await play(
    ...fade(deliveries),
    new M.Create(firstNet),
    new M.FadeIn(firstEnds),
    ...say('ONE NUMBER → A RANGE'),
    ...fbox([
      'Instead of just 30...',
      ['from 28 to 32', C.cyan]
    ])
  );

  await until(S(8));
  await play(
    new M.Indicate(firstNet, { color: C.cyan }),
    ...say('THROW A NET AROUND THE ESTIMATE'),
    ...fbox([
      'Our estimate: 30',
      ['A net around it', C.cyan]
    ])
  );

  // ---------------------------------------------------------------
  // 9: A hypothetical truth inside the net.
  // This is explicitly illustrative, not a revealed real parameter.
  // ---------------------------------------------------------------

  const hypotheticalX = realX(31.2);

  const hypothetical = glowDot(
    hypotheticalX,
    NETY,
    GOLD,
    0.085
  );

  const hypotheticalLabel = txt(
    'IF TRUTH WERE HERE',
    P ? 16 : 14,
    GOLD,
    [CX, NETY + 0.88, 0]
  );

  const hypotheticalMark = new M.VGroup(
    hypothetical,
    hypotheticalLabel
  );

  await until(S(9));
  await play(
    new M.FadeIn(hypotheticalMark),
    new M.Indicate(firstNet, { color: C.green }),
    ...say('INSIDE THE NET = CAUGHT', C.green),
    ...fbox([
      'If truth is inside...',
      ['the net caught it', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 10: Name the interval.
  // ---------------------------------------------------------------

  await until(S(10));
  await play(
    new M.Indicate(firstNet, { color: C.cyan }),
    ...say('INTERVAL = A RANGE'),
    ...fbox([
      ['interval', C.cyan],
      'From one end',
      'To the other end'
    ])
  );

  // ---------------------------------------------------------------
  // 11: In real life, the truth is invisible.
  // ---------------------------------------------------------------

  await until(S(11));
  await play(
    new M.FadeOut(hypotheticalMark),
    ...say('REAL LIFE: THE TRUTH IS UNKNOWN', GOLD),
    ...fbox([
      ['True mean = ?', GOLD],
      'Caught or missed?',
      'We cannot check.'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 12: Enter the simulation.
  // ---------------------------------------------------------------

  const computerBody = new M.RoundedRectangle({
    width: 3.8,
    height: 2.2,
    cornerRadius: 0.18,
    color: C.cyan,
    strokeWidth: 2
  });

  computerBody.setFill(C.card, 0.95);
  computerBody.moveTo([CX, -0.35, 0]);

  const computerStand = ln(
    CX, -1.45,
    CX, -1.82,
    C.muted, 5
  );

  const computerFoot = ln(
    CX - 0.67, -1.82,
    CX + 0.67, -1.82,
    C.muted, 5
  );

  const computerTitle = txt(
    'SIMULATION',
    24,
    C.cyan,
    [CX, 0.30, 0],
    true
  );

  const computerDots = Array.from({ length: 16 }, (_, i) => {
    const col = i % 8;
    const row = Math.floor(i / 8);

    return glowDot(
      CX + (col - 3.5) * 0.36,
      -0.25 - row * 0.37,
      C.cyan,
      0.065
    );
  });

  const computer = new M.VGroup(
    computerBody,
    computerStand,
    computerFoot,
    computerTitle,
    ...computerDots
  );

  await until(S(12));
  await play(
    ...fade([realAxis, estimate, firstNet, firstEnds]),
    new M.FadeIn(computer),
    ...say('PRACTISE WITH A SIMULATION'),
    ...fbox([
      ['simulation', C.cyan],
      'Computer-made data',
      'Random practice samples'
    ])
  );

  // ---------------------------------------------------------------
  // 13: In a simulation we choose the truth.
  // ---------------------------------------------------------------

  let chart = makeChart();

  await until(S(13));
  await play(
    new M.FadeOut(computer),
    new M.FadeIn(chart.axis),
    ...say('WE CHOOSE THE TRUTH', GOLD),
    ...fbox([
      'Simulation settings',
      ['Choose the true mean', GOLD]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 14: Reveal the fixed gold truth line at 30.
  // ---------------------------------------------------------------

  await until(S(14));
  await play(
    new M.FadeIn(chart.truth),
    ...say('TRUE MEAN = 30 MINUTES', GOLD),
    ...fbox([
      ['true mean = 30', GOLD],
      'delivery spread = 4',
      'Both fixed by us'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 15: Draw 16 deliveries per sample, repeated 20 times.
  // ---------------------------------------------------------------

  await until(S(15));
  await play(
    new M.FadeIn(chart.labels),
    ...say('16 DELIVERIES, REPEATED 20 TIMES'),
    ...fbox([
      '16 random deliveries',
      'Find their mean',
      ['Repeat 20 times', C.cyan]
    ])
  );

  // ---------------------------------------------------------------
  // 16: Reveal the twenty fixed sample means as glowing dots.
  // ---------------------------------------------------------------

  await until(S(16));
  await play(
    new M.FadeIn(chart.dotGroup),
    ...say('20 SAMPLES → 20 DIFFERENT MEANS'),
    ...fbox([
      ['Each dot = one mean', C.cyan],
      'Same route',
      'Different samples'
    ])
  );

  // ---------------------------------------------------------------
  // 17: Throw the same ±2-minute net around every dot.
  // ---------------------------------------------------------------

  chart.nets = MEANS.map((_, i) =>
    chartNet(i, 2, C.cyan)
  );

  await until(S(17));
  await play(
    new M.LaggedStart(
      chart.nets.map(n => new M.FadeIn(n)),
      { lagRatio: 0.08, runTime: 2.5 }
    ),
    ...say('SAME RULE: MEAN ± 2 MINUTES'),
    ...fbox([
      'Start at each mean',
      ['Reach 2 minutes left', C.cyan],
      ['Reach 2 minutes right', C.cyan]
    ])
  );

  // ---------------------------------------------------------------
  // 18: Explain plus or minus.
  // ---------------------------------------------------------------

  await until(S(18));
  await play(
    new M.Indicate(chart.nets[0], { color: GOLD }),
    ...say('−2 MINUTES LEFT, +2 MINUTES RIGHT', GOLD),
    ...fbox([
      ['mean − 2', C.cyan],
      '    to',
      ['mean + 2', C.cyan]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 19: Why choose two minutes?
  // The simulation has known spread 4 and sample size 16.
  // ---------------------------------------------------------------

  const typicalBand = new M.Rectangle({
    width: simX(32) - simX(28),
    height: ROWTOP - SIMAXIS + 0.12,
    color: C.cyan,
    strokeWidth: 1
  });

  typicalBand.setFill(C.cyan, 0.055);

  typicalBand.moveTo([
    simX(30),
    (ROWTOP + SIMAXIS + 0.12) / 2,
    0
  ]);

  await until(S(19));
  await play(
    new M.FadeIn(typicalBand),
    ...say('MOST MEANS LAND WITHIN 2 MINUTES'),
    ...fbox([
      '16 deliveries per mean',
      'Typical mean error: 1',
      ['2 minutes catches most', C.cyan]
    ])
  );

  // ---------------------------------------------------------------
  // 20: Preview the next lesson.
  // ---------------------------------------------------------------

  await until(S(20));
  await play(
    new M.FadeOut(typicalBand),
    ...say('NEXT LESSON: FIND THE NET SIZE', C.muted),
    ...fbox([
      'For now: use ±2',
      'Later: find the size',
      'from real data'
    ])
  );

  // ---------------------------------------------------------------
  // 21: First mean = 29.1; interval [27.1, 31.1].
  // ---------------------------------------------------------------

  await until(S(21));
  await play(
    new M.Indicate(chart.dots[0], { color: GOLD }),
    ...recolorNet(chart, 0, 2, GOLD),
    ...say('NET 1: 27.1 TO 31.1', GOLD),
    ...fbox([
      'mean = 29.1',
      ['29.1 − 2 = 27.1', C.cyan],
      ['29.1 + 2 = 31.1', C.cyan]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 22: The first interval catches the truth.
  // ---------------------------------------------------------------

  await until(S(22));
  await play(
    ...recolorNet(chart, 0, 2, C.green),
    ...say('NET 1: CAUGHT', C.green),
    ...fbox([
      '27.1 — 30 — 31.1',
      ['30 is inside', C.green],
      ['CAUGHT', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 23: Second mean = 29.8; another catch.
  // ---------------------------------------------------------------

  await until(S(23));
  await play(
    new M.Indicate(chart.dots[1], { color: C.green }),
    ...recolorNet(chart, 1, 2, C.green),
    ...say('NET 2: CAUGHT AGAIN', C.green),
    ...fbox([
      'mean = 29.8',
      '27.8 — 31.8',
      ['CAUGHT', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 24: Third mean = 33.2; interval [31.2, 35.2].
  // ---------------------------------------------------------------

  await until(S(24));
  await play(
    new M.Indicate(chart.dots[2], { color: GOLD }),
    ...recolorNet(chart, 2, 2, GOLD),
    ...say('NET 3: 31.2 TO 35.2', GOLD),
    ...fbox([
      'mean = 33.2',
      ['33.2 − 2 = 31.2', C.cyan],
      ['33.2 + 2 = 35.2', C.cyan]
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 25: The third interval misses the truth.
  // ---------------------------------------------------------------

  await until(S(25));
  await play(
    ...recolorNet(chart, 2, 2, MISS),
    ...say('NET 3: MISSED', MISS),
    ...fbox([
      '30     31.2 — 35.2',
      ['30 is outside', MISS],
      ['MISSED', MISS]
    ], MISS)
  );

  // ---------------------------------------------------------------
  // 26: Classify all twenty intervals.
  // Exactly nineteen catch the truth and one misses.
  // ---------------------------------------------------------------

  const countWide = MEANS.filter(m => catches(m, 2)).length;

  const restOld = chart.nets.slice(3);

  const restNew = MEANS.slice(3).map((m, k) =>
    chartNet(
      k + 3,
      2,
      catches(m, 2) ? C.green : MISS
    )
  );

  chart.nets.splice(3, restNew.length, ...restNew);

  await until(S(26));
  await play(
    ...fade(restOld),
    new M.LaggedStart(
      restNew.map(n => new M.FadeIn(n)),
      { lagRatio: 0.075, runTime: 1.8 }
    ),
    ...say('19 CAUGHT  ·  1 MISSED', C.green),
    ...fbox([
      [`caught = ${countWide}`, C.green],
      [`missed = ${20 - countWide}`, MISS],
      'total  = 20'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 27: Define coverage.
  // ---------------------------------------------------------------

  await until(S(27));
  await play(
    ...say('COVERAGE = THE SHARE THAT CATCHES', C.green),
    ...fbox([
      'coverage',
      '19 ÷ 20',
      ['= 95%', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 28: Repeat the simulation 100,000 times.
  // Use the supplied checked results rather than rerolling them.
  // ---------------------------------------------------------------

  let grid = hundredNets(95, 2, true);

  await until(S(28));
  await play(
    ...fade(chartParts(chart)),
    new M.FadeIn(grid),
    ...say('REPEAT 100,000 TIMES'),
    ...fbox([
      ['100,000 samples', C.cyan],
      '16 deliveries each',
      'Same ±2-minute rule'
    ])
  );

  // ---------------------------------------------------------------
  // 29: About 95 catches in every 100.
  // ---------------------------------------------------------------

  const grid95 = hundredNets(95, 2);

  await until(S(29));
  await play(
    new M.FadeOut(grid),
    new M.FadeIn(grid95),
    ...say('ABOUT 95 IN EVERY 100 CATCH', C.green),
    ...fbox([
      '100,000 samples',
      ['Coverage ≈ 95.5%', C.green],
      'About 95 in 100'
    ], C.green)
  );

  grid = grid95;

  // ---------------------------------------------------------------
  // 30: Coverage belongs to the net-throwing rule.
  // ---------------------------------------------------------------

  await until(S(30));
  await play(
    ...say('THE RULE HAS ABOUT 95% COVERAGE', C.green),
    ...fbox([
      ['Rule: mean ± 2', C.cyan],
      ['Coverage ≈ 95%', C.green],
      'Over many samples'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 31–32: Confidence interval and confidence level.
  // ---------------------------------------------------------------

  await until(S(31));
  await play(
    ...say('CONFIDENCE INTERVAL', C.violet),
    ...fbox([
      ['confidence interval', C.violet],
      'A rule for ranges',
      'With stated coverage'
    ], C.violet)
  );

  await until(S(32));
  await play(
    ...say('CONFIDENCE LEVEL = 95%', C.green),
    ...fbox([
      'Confidence level',
      ['95%', C.green],
      'Long-run coverage'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 33: Return to exactly the same twenty samples.
  // Shrink each net from ±2 minutes to ±1 minute.
  // ---------------------------------------------------------------

  const narrowChart = makeChart();

  narrowChart.nets = MEANS.map((_, i) =>
    chartNet(i, 2, C.cyan)
  );

  await until(S(33));
  await play(
    new M.FadeOut(grid),
    new M.FadeIn(narrowChart.axis),
    new M.FadeIn(narrowChart.truth),
    new M.FadeIn(narrowChart.labels),
    new M.FadeIn(narrowChart.dotGroup),
    ...narrowChart.nets.map(n => new M.FadeIn(n)),
    ...say('WHAT IF THE NET WERE SMALLER?', C.violet),
    ...fbox([
      'Same twenty samples',
      ['Old rule: ±2', C.muted],
      ['New rule: ±1', C.violet]
    ], C.violet)
  );

  await play(
    new M.LaggedStart(
      narrowChart.nets.map((n, i) =>
        new M.Transform(n, chartNet(i, 1, C.violet))
      ),
      { lagRatio: 0.025, runTime: 1.25 }
    )
  );

  chart = narrowChart;

  // ---------------------------------------------------------------
  // 34: Fourteen catches with the smaller net.
  // ---------------------------------------------------------------

  const countNarrow = MEANS.filter(m => catches(m, 1)).length;

  const narrowOld = chart.nets.slice();

  const narrowColored = MEANS.map((m, i) =>
    chartNet(
      i,
      1,
      catches(m, 1) ? C.green : MISS
    )
  );

  chart.nets = narrowColored;

  await until(S(34));
  await play(
    ...fade(narrowOld),
    new M.LaggedStart(
      narrowColored.map(n => new M.FadeIn(n)),
      { lagRatio: 0.06, runTime: 1.7 }
    ),
    ...say('14 CAUGHT  ·  6 MISSED', C.violet),
    ...fbox([
      [`caught = ${countNarrow}`, C.green],
      [`missed = ${20 - countNarrow}`, MISS],
      ['14 ÷ 20 = 70%', C.violet]
    ], C.violet)
  );

  // ---------------------------------------------------------------
  // 35: Long-run coverage is about 68 in 100.
  // ---------------------------------------------------------------

  const grid68 = hundredNets(68, 1);

  await until(S(35));
  await play(
    ...fade(chartParts(chart)),
    new M.FadeIn(grid68),
    ...say('ABOUT 68 IN EVERY 100 CATCH', C.violet),
    ...fbox([
      'Rule: mean ± 1',
      ['Coverage ≈ 68.3%', C.violet],
      'Over 100,000 samples'
    ], C.violet)
  );

  grid = grid68;

  // ---------------------------------------------------------------
  // 36: The trade-off between coverage and precision.
  // ---------------------------------------------------------------

  const compare = comparison();

  await until(S(36));
  await play(
    new M.FadeOut(grid),
    new M.FadeIn(compare),
    ...say('WIDER NET = MORE CATCHES', GOLD),
    ...fbox([
      ['Wider: more coverage', C.green],
      ['Narrower: more precision', C.violet],
      'A trade-off'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 37: Coverage formula.
  // ---------------------------------------------------------------

  await until(S(37));
  await play(
    ...say('COVERAGE = CAUGHT ÷ ALL THROWN', C.green),
    ...fbox([
      ['coverage =', C.green],
      'nets that catch truth',
      '÷ all nets thrown'
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 38: What coverage is for.
  // ---------------------------------------------------------------

  await until(S(38));
  await play(
    ...say('COVERAGE TELLS US ABOUT THE METHOD', C.green),
    ...fbox([
      'How reliable is',
      'our rule for ranges?',
      ['Check many samples', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 39: Common trap.
  // Leave the known-truth simulation.
  // ---------------------------------------------------------------

  const trapTitle = txt(
    'ONE INTERVAL',
    P ? 30 : 28,
    C.ink,
    [CX, P ? 0.25 : -0.15, 0],
    true
  );

  const trapQuestion = txt(
    'What does 95% mean?',
    P ? 23 : 22,
    GOLD,
    [CX, P ? -0.50 : -0.85, 0]
  );

  const trapIntro = new M.VGroup(trapTitle, trapQuestion);

  await until(S(39));
  await play(
    new M.FadeOut(compare),
    new M.FadeIn(trapIntro),
    ...say('COMMON TRAP', GOLD),
    ...fbox([
      ['Be careful!', GOLD],
      'One net is not',
      'the whole method'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 40: Return to Sami's one real interval, [28, 32].
  // No gold line: the real parameter is unknown.
  // ---------------------------------------------------------------

  const finalAxis = axis(
    realX,
    [22, 26, 30, 34, 38],
    AY
  );

  const finalNet = net(
    realX,
    30,
    2,
    NETY,
    C.cyan,
    0.18,
    0.12
  );

  const finalDot = glowDot(
    realX(30),
    NETY,
    C.violet,
    0.12
  );

  const finalLabels = new M.VGroup(
    txt('28', 21, C.cyan,
      [realX(28), NETY - 0.37, 0], true),

    txt('32', 21, C.cyan,
      [realX(32), NETY - 0.37, 0], true),

    txt('30', 21, C.violet,
      [realX(30), NETY + 0.40, 0], true),

    txt('ONE REAL INTERVAL', 18, C.muted,
      [CX, NETY + 0.88, 0])
  );

  const unknownLabel = txt(
    'True mean = ?',
    P ? 23 : 21,
    GOLD,
    [CX, AY - 1.12, 0],
    true
  );

  await until(S(40));
  await play(
    new M.FadeOut(trapIntro),
    new M.FadeIn(finalAxis),
    new M.FadeIn(finalNet),
    new M.FadeIn(finalDot),
    new M.FadeIn(finalLabels),
    new M.FadeIn(unknownLabel),
    ...say('ONE REAL NET: 28 TO 32'),
    ...fbox([
      'Sami’s estimate: 30',
      ['Interval: 28 to 32', C.cyan],
      ['True mean: unknown', GOLD]
    ])
  );

  // ---------------------------------------------------------------
  // 41: The tempting but incorrect interpretation.
  // Display it explicitly as a question, not as a fact.
  // ---------------------------------------------------------------

  const wrong = pill(
    '95% CHANCE INSIDE THIS NET?',
    GOLD,
    P ? 17 : 16
  );

  wrong.moveTo([
    CX,
    P ? -3.65 : -2.65,
    0
  ]);

  await until(S(41));
  await play(
    new M.FadeIn(wrong),
    ...say('TEMPTING, BUT INCORRECT', MISS),
    ...fbox([
      '“95% chance that',
      'truth is in this net”?',
      ['Not what 95% means', MISS]
    ], MISS)
  );

  // ---------------------------------------------------------------
  // 42: Fixed truth; this interval caught it or missed it.
  // Neither outcome is observable for the real interval.
  // ---------------------------------------------------------------

  const caughtBox = new M.RoundedRectangle({
    width: P ? 2.45 : 2.35,
    height: 0.67,
    cornerRadius: 0.13,
    color: C.green,
    strokeWidth: 2
  });

  const missedBox = new M.RoundedRectangle({
    width: P ? 2.45 : 2.35,
    height: 0.67,
    cornerRadius: 0.13,
    color: MISS,
    strokeWidth: 2
  });

  caughtBox.setFill(C.card, 0.95);
  missedBox.setFill(C.card, 0.95);

  const outcomeY = P ? -3.70 : -2.60;

  caughtBox.moveTo([CX - 1.48, outcomeY, 0]);
  missedBox.moveTo([CX + 1.48, outcomeY, 0]);

  const caughtText = txt(
    'CAUGHT?',
    20,
    C.green,
    [CX - 1.48, outcomeY, 0],
    true
  );

  const missedText = txt(
    'MISSED?',
    20,
    MISS,
    [CX + 1.48, outcomeY, 0],
    true
  );

  const orText = txt(
    'or',
    16,
    C.muted,
    [CX, outcomeY, 0]
  );

  const outcomes = new M.VGroup(
    caughtBox, missedBox,
    caughtText, missedText, orText
  );

  await until(S(42));
  await play(
    new M.FadeOut(wrong),
    new M.FadeIn(outcomes),
    ...say('FIXED TRUTH: CAUGHT OR MISSED', GOLD),
    ...fbox([
      ['The truth is fixed', GOLD],
      'This net either caught',
      'it or missed it.'
    ], GOLD)
  );

  // ---------------------------------------------------------------
  // 43: The 95% belongs to the method over many samples.
  // Return to the explicitly known-truth simulation.
  // ---------------------------------------------------------------

  const methodGrid = hundredNets(95, 2);

  await until(S(43));
  await play(
    ...fade([
      finalAxis,
      finalNet,
      finalDot,
      finalLabels,
      unknownLabel,
      outcomes
    ]),
    new M.FadeIn(methodGrid),
    ...say('95% BELONGS TO THE METHOD', C.green),
    ...fbox([
      'Repeat the same rule',
      'Over many samples',
      ['About 95 in 100 catch', C.green]
    ], C.green)
  );

  // ---------------------------------------------------------------
  // 44: Next lesson — choose the net size from data.
  // ---------------------------------------------------------------

  await until(S(44));
  await play(
    ...say('NEXT: HOW WIDE SHOULD THE NET BE?', C.cyan),
    ...fbox([
      'How do we choose',
      'the margin of error?',
      ['Use the sample data', C.cyan]
    ])
  );

  // ---------------------------------------------------------------
  // 45: Final one-sentence summary.
  // Keep the picture of many nets visible until narration ends.
  // ---------------------------------------------------------------

  await until(S(45));
  await play(
    ...say('CONFIDENCE = LONG-RUN COVERAGE', C.green),
    ...fbox([
      ['Confidence interval', C.cyan],
      'A net-throwing rule',
      ['Coverage = catch rate', C.green]
    ], C.green)
  );
}
