// lesson 12.4.1
// Absolute and squared error — live, narration-synchronised lesson.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine API; browser playback has not been verified here.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // Fixed chapter data: pumps P1, P2 and P3.
  const ACTUAL = [12, 8, 14];
  const A = [18, 8, 14];
  const B = [14, 10, 12];

  const EA = A.map((v, i) => Math.abs(v - ACTUAL[i]));
  const EB = B.map((v, i) => Math.abs(v - ACTUAL[i]));

  const SA = EA.map(v => v * v);
  const SB = EB.map(v => v * v);

  const sum = a => a.reduce((s, v) => s + v, 0);

  const MAE_A = sum(EA) / ACTUAL.length;
  const MAE_B = sum(EB) / ACTUAL.length;
  const MSE_A = sum(SA) / ACTUAL.length;
  const MSE_B = sum(SB) / ACTUAL.length;

  // Fixed chapter colours.
  const WHITE = '#FFFFFF';
  const BLUE = C.blue || '#58A6FF';
  const PURPLE = C.violet;

  // Responsive laptop / phone layout.
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.05, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.3, 0] : [4.3, -0.3, 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const text = (s, size, color, x, y, mono = false) => {
    const t = T(s, size, color, mono);
    t.moveTo([x, y, 0]);
    return t;
  };

  const line = (x1, y1, x2, y2, color = C.muted, sw = 2) =>
    new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: sw
    });

  function rect(x, y, w, h, color, opacity = 0.2, sw = 2) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function roundRect(x, y, w, h, color, opacity = 0.95) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function circle(x, y, r, color, opacity = 1) {
    const c = new M.Circle({
      radius: r,
      color,
      strokeWidth: 2
    });

    c.setFill(color, opacity);
    c.moveTo([x, y, 0]);

    return c;
  }

  function lag(anims, runTime = 1.2, lagRatio = 0.12) {
    return new M.LaggedStart(anims, {
      lagRatio,
      runTime
    });
  }

  const fadeIn = objects =>
    objects.map(o => new M.FadeIn(o));

  const fadeOut = objects =>
    objects.map(o => new M.FadeOut(o));

  // Formula box, following the approved reference lesson.
  // All objects are grouped before they enter the scene.
  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 20;
    const lh = P ? 0.36 : 0.40;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (rows[i][0].length - rows[i][0].trimStart().length)
    );

    const wd = Math.max(...widths) + 0.65;
    const ht = rows.length * lh + 0.35;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.325;
    const top = BOXP[1] + ht / 2 - 0.175 - lh / 2;

    texts.forEach((t, i) => {
      const indent =
        cw * (rows[i][0].length - rows[i][0].trimStart().length);

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.1;

    if (wd > maxw) g.scale(maxw / wd);

    g.moveTo(BOXP);

    const animations = [];

    if (boxNow) {
      animations.push(new M.FadeOut(boxNow));
    }

    animations.push(new M.FadeIn(g));
    boxNow = g;

    return animations;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [new M.FadeOut(old)];
  }

  // Small water pump icon:
  // motor, pump housing, inlet, outlet, impeller and mounting feet.
  function pumpIcon(x, y, scale = 1, color = C.ink) {
    const motor = new M.RoundedRectangle({
      width: 0.62 * scale,
      height: 0.43 * scale,
      cornerRadius: 0.08 * scale,
      color,
      strokeWidth: 2
    });

    motor.setFill(color, 0.16);
    motor.moveTo([x - 0.30 * scale, y, 0]);

    const housing = circle(
      x + 0.20 * scale,
      y,
      0.29 * scale,
      color,
      0.12
    );

    const hub = circle(
      x + 0.20 * scale,
      y,
      0.075 * scale,
      color,
      1
    );

    const inlet = rect(
      x + 0.55 * scale,
      y,
      0.22 * scale,
      0.16 * scale,
      color,
      0.12,
      2
    );

    const outlet = rect(
      x + 0.20 * scale,
      y + 0.40 * scale,
      0.18 * scale,
      0.30 * scale,
      color,
      0.12,
      2
    );

    const foot1 = rect(
      x - 0.30 * scale,
      y - 0.29 * scale,
      0.22 * scale,
      0.12 * scale,
      color,
      0.3,
      1
    );

    const foot2 = rect(
      x + 0.20 * scale,
      y - 0.29 * scale,
      0.22 * scale,
      0.12 * scale,
      color,
      0.3,
      1
    );

    const fins = [-0.48, -0.36, -0.24].map(dx =>
      line(
        x + dx * scale,
        y - 0.15 * scale,
        x + dx * scale,
        y + 0.15 * scale,
        color,
        1.5
      )
    );

    return new M.VGroup(
      motor,
      ...fins,
      housing,
      inlet,
      outlet,
      hub,
      foot1,
      foot2
    );
  }

  // Numbered pump card.
  function pumpCard(i, x, y) {
    const w = P ? 1.90 : 2.00;
    const h = 2.05;

    const frame = roundRect(x, y, w, h, C.muted);

    const name = text(
      `P${i + 1}`,
      22,
      C.ink,
      x,
      y + 0.69,
      true
    );

    const icon = pumpIcon(x, y + 0.02, 0.86, C.cyan);

    const base = line(
      x - w / 2 + 0.18,
      y - 0.36,
      x + w / 2 - 0.18,
      y - 0.36,
      C.muted,
      1
    );

    const g = new M.VGroup(frame, name, icon, base);

    return {
      group: g,
      frame,
      icon,
      x,
      y
    };
  }

  function computerIcon(x, y, color) {
    const screen = roundRect(x, y + 0.1, 0.92, 0.56, color);

    const display = line(
      x - 0.28,
      y + 0.1,
      x + 0.28,
      y + 0.1,
      color,
      3
    );

    const stem = line(x, y - 0.19, x, y - 0.31, color, 3);
    const foot = line(x - 0.23, y - 0.31, x + 0.23, y - 0.31, color, 3);

    return new M.VGroup(screen, display, stem, foot);
  }

  // ------------------------------------------------------------
  // 0–6: Introduce the repair team, pumps and prediction tools.
  // ------------------------------------------------------------

  const CARD_Y = P ? -0.55 : -0.10;
  const CARD_SP = P ? 2.25 : 2.35;

  const cards = ACTUAL.map((_, i) =>
    pumpCard(i, CX + (i - 1) * CARD_SP, CARD_Y)
  );

  const toolY = P ? -3.0 : -2.15;

  const computerA = computerIcon(CX - 1.55, toolY, BLUE);
  const computerB = computerIcon(CX + 1.55, toolY, PURPLE);

  const nameA = text(
    'TOOL A',
    18,
    BLUE,
    CX - 1.55,
    toolY - 0.59,
    true
  );

  const nameB = text(
    'TOOL B',
    18,
    PURPLE,
    CX + 1.55,
    toolY - 0.59,
    true
  );

  const questionMarks = cards.map(c =>
    text('?', 26, C.amber, c.x, c.y - 0.67, true)
  );

  const actualCards = cards.map((c, i) =>
    text(
      `${ACTUAL[i]} h`,
      23,
      WHITE,
      c.x,
      c.y - 0.67,
      true
    )
  );

  await until(S(0));
  await play(
    lag(cards.map(c => new M.FadeIn(c.group)), 1.4),
    ...say('LOOKING AFTER WATER PUMPS')
  );

  await until(S(1));
  await play(
    lag(
      cards.map(c => new M.Indicate(c.frame, {
        color: C.amber
      })),
      1.6
    ),
    ...say('REPLACE BEFORE FAILURE', C.amber)
  );

  await until(S(2));
  await play(
    lag(fadeIn(questionMarks), 1.0),
    ...say('HOW MANY HOURS LEFT?', C.amber)
  );

  await until(S(3));
  await play(
    new M.FadeIn(computerA),
    new M.FadeIn(computerB),
    ...say('TWO PREDICTION TOOLS')
  );

  await until(S(4));
  await play(
    lag(
      cards.map(c => new M.Indicate(c.group, {
        color: C.cyan
      })),
      1.4
    ),
    ...say('COMPARE THE SAME 3 PUMPS')
  );

  await until(S(5));
  await play(
    new M.FadeIn(nameA),
    new M.FadeIn(nameB),
    ...say('TOOL A AND TOOL B')
  );

  await until(S(6));
  await play(
    ...say('LATER: WE LEARN THE ACTUAL HOURS', WHITE)
  );

  // ------------------------------------------------------------
  // 7–9: Reveal the three actual lifetimes.
  // ------------------------------------------------------------

  for (let i = 0; i < 3; i++) {
    await until(S(7 + i));

    await play(
      new M.FadeOut(questionMarks[i]),
      new M.FadeIn(actualCards[i]),
      new M.Indicate(cards[i].frame, {
        color: WHITE
      }),
      ...say(
        `P${i + 1}: ACTUALLY ${ACTUAL[i]} HOURS`,
        WHITE
      )
    );
  }

  // ------------------------------------------------------------
  // Number-line helpers.
  // All three lines use the same scale.
  // White filled dot = actual value.
  // Coloured ring = prediction.
  // Matching values remain visible as concentric markers.
  // ------------------------------------------------------------

  const ROW_Y = P
    ? [1.0, -1.75, -4.5]
    : [0.63, -0.78, -2.19];

  const X0 = CX - 2.44;
  const X1 = CX + 3.32;

  const n2x = v => X0 + (v / 20) * (X1 - X0);

  function numberLine(i) {
    const y = ROW_Y[i];

    const axis = line(X0, y, X1, y, C.muted, 2.5);

    const tickObjects = [];

    for (let v = 0; v <= 20; v++) {
      const major = v % 5 === 0;
      const h = major ? 0.085 : 0.035;

      tickObjects.push(
        line(
          n2x(v),
          y - h,
          n2x(v),
          y + h,
          C.muted,
          major ? 2 : 1
        )
      );

      if (major) {
        tickObjects.push(
          text(
            String(v),
            P ? 17 : 14,
            C.muted,
            n2x(v),
            y - 0.58,
            true
          )
        );
      }
    }

    const pX = CX - 3.18;

    const card = roundRect(
      pX,
      y + 0.01,
      0.87,
      0.95,
      C.muted
    );

    const name = text(
      `P${i + 1}`,
      15,
      C.ink,
      pX,
      y + 0.27,
      true
    );

    const icon = pumpIcon(
      pX,
      y - 0.09,
      0.43,
      C.cyan
    );

    const unit = text(
      'hours',
      P ? 16 : 13,
      C.muted,
      X1 - 0.22,
      y - 0.82
    );

    return new M.VGroup(
      axis,
      ...tickObjects,
      card,
      name,
      icon,
      unit
    );
  }

  function actualMark(v, y) {
    const x = n2x(v);

    const halo = new M.Dot({
      point: [x, y, 0],
      radius: 0.18,
      color: WHITE
    });

    halo.setFill(WHITE, 0.14);

    const d = new M.Dot({
      point: [x, y, 0],
      radius: 0.073,
      color: WHITE
    });

    const lab = text(
      `actual ${v}`,
      P ? 17 : 14,
      WHITE,
      x,
      y - 0.29,
      true
    );

    return new M.VGroup(halo, d, lab);
  }

  function predictedMark(v, y, color, tool) {
    const x = n2x(v);

    const ring = new M.Circle({
      radius: 0.135,
      color,
      strokeWidth: 3
    });

    ring.setFill(color, 0);
    ring.moveTo([x, y, 0]);

    const stem = line(
      x,
      y + 0.13,
      x,
      y + 0.22,
      color,
      2
    );

    const lab = text(
      `${tool}: ${v}`,
      P ? 16 : 15,
      color,
      x,
      y + 0.34,
      true
    );

    return new M.VGroup(ring, stem, lab);
  }

  // Horizontal distance bar. Width is proportional to |prediction - actual|.
  // A zero error is explicitly labelled rather than drawn as a fake bar.
  function gapBar(actual, predicted, y, color) {
    const e = Math.abs(predicted - actual);

    if (e === 0) {
      const lab = text(
        '0 h — match',
        P ? 17 : 14,
        C.green,
        n2x(actual),
        y + 0.64,
        true
      );

      return new M.VGroup(lab);
    }

    const xa = n2x(actual);
    const xp = n2x(predicted);
    const xc = (xa + xp) / 2;
    const wd = Math.abs(xp - xa);
    const by = y + 0.06;

    const bar = rect(
      xc,
      by,
      wd,
      0.12,
      color,
      0.86,
      1
    );

    const cap1 = line(
      xa,
      by - 0.10,
      xa,
      by + 0.10,
      color,
      2
    );

    const cap2 = line(
      xp,
      by - 0.10,
      xp,
      by + 0.10,
      color,
      2
    );

    const label = text(
      `${e} h`,
      P ? 17 : 16,
      color,
      xc,
      y + 0.64,
      true
    );

    return new M.VGroup(bar, cap1, cap2, label);
  }

  function makeLines() {
    return ACTUAL.map((v, i) => ({
      axis: numberLine(i),
      actual: actualMark(v, ROW_Y[i])
    }));
  }

  let lines = makeLines();

  let predA = A.map((v, i) =>
    predictedMark(v, ROW_Y[i], BLUE, 'A')
  );

  let gapsA = EA.map((_, i) =>
    gapBar(ACTUAL[i], A[i], ROW_Y[i], BLUE)
  );

  const lineObjects = () =>
    lines.flatMap(r => [r.axis, r.actual]);

  // ------------------------------------------------------------
  // 10: Actual values move onto three separate hours lines.
  // ------------------------------------------------------------

  await until(S(10));
  await play(
    ...fadeOut(cards.map(c => c.group)),
    ...fadeOut(actualCards),
    ...fadeOut([computerA, computerB, nameA, nameB]),
    lag(fadeIn(lineObjects()), 1.5, 0.10),
    ...say('ACTUAL HOURS REMAINING', WHITE)
  );

  // ------------------------------------------------------------
  // 11–12: Add Tool A predictions.
  // ------------------------------------------------------------

  await until(S(11));
  await play(
    ...say('ADD TOOL A PREDICTIONS', BLUE)
  );

  await until(S(12));
  await play(
    lag(fadeIn(predA), 1.7, 0.23),
    ...say('A: 18, 8, 14 HOURS', BLUE)
  );

  // ------------------------------------------------------------
  // 13–18: Discover absolute error through distance.
  // ------------------------------------------------------------

  await until(S(13));
  await play(
    new M.Indicate(lines[0].axis, {
      color: C.amber
    }),
    ...say('LOOK AT PUMP 1', C.amber)
  );

  await until(S(14));
  await play(
    new M.Flash(lines[0].actual.submobjects[1], {
      color: WHITE
    }),
    new M.Indicate(predA[0], {
      color: BLUE
    }),
    ...say('12 ACTUAL — 18 PREDICTED', BLUE)
  );

  await until(S(15));
  await play(
    new M.FadeIn(gapsA[0]),
    ...say('THE MISTAKE IS 6 HOURS', BLUE)
  );

  await until(S(16));
  await play(
    lag(
      [
        new M.FadeIn(gapsA[1]),
        new M.FadeIn(gapsA[2])
      ],
      1.1
    ),
    new M.Indicate(predA[1], {
      color: C.green
    }),
    new M.Indicate(predA[2], {
      color: C.green
    }),
    ...say('EXACT MATCHES: NO GAP', C.green)
  );

  await until(S(17));
  await play(
    lag(
      gapsA.map(g => new M.Indicate(g, {
        color: C.amber
      })),
      1.5
    ),
    ...say('DISTANCE FROM THE TRUTH', C.amber)
  );

  await until(S(18));
  await play(
    ...fbox([
      ['absolute error', C.cyan],
      'distance from actual',
      ['P1: 6 hours', BLUE]
    ]),
    ...say('ABSOLUTE ERROR = SIZE OF MISTAKE')
  );

  // ------------------------------------------------------------
  // 19: Direction does not matter.
  // Hypothetical six-hours-early and six-hours-late example.
  // The actual value is still 12 hours.
  // ------------------------------------------------------------

  const DIR_Y = P ? -0.45 : -0.55;

  function directionDemo() {
    const axis = line(
      n2x(0),
      DIR_Y,
      n2x(20),
      DIR_Y,
      C.muted,
      3
    );

    const ticks = [0, 5, 10, 15, 20].flatMap(v => [
      line(
        n2x(v),
        DIR_Y - 0.075,
        n2x(v),
        DIR_Y + 0.075,
        C.muted,
        2
      ),
      text(
        String(v),
        15,
        C.muted,
        n2x(v),
        DIR_Y - 0.63,
        true
      )
    ]);

    const heading = text(
      'P1 — SAME ACTUAL FAILURE TIME',
      P ? 18 : 17,
      WHITE,
      CX,
      DIR_Y + 1.42
    );

    const actual = actualMark(12, DIR_Y);

    const early = predictedMark(
      6,
      DIR_Y,
      C.amber,
      'early'
    );

    const late = predictedMark(
      18,
      DIR_Y,
      BLUE,
      'late'
    );

    const leftBar = rect(
      (n2x(6) + n2x(12)) / 2,
      DIR_Y + 0.67,
      n2x(12) - n2x(6),
      0.18,
      C.amber,
      0.82,
      1
    );

    const rightBar = rect(
      (n2x(12) + n2x(18)) / 2,
      DIR_Y + 0.67,
      n2x(18) - n2x(12),
      0.18,
      BLUE,
      0.82,
      1
    );

    const sixLeft = text(
      '6 hours',
      18,
      C.amber,
      (n2x(6) + n2x(12)) / 2,
      DIR_Y + 0.98,
      true
    );

    const sixRight = text(
      '6 hours',
      18,
      BLUE,
      (n2x(12) + n2x(18)) / 2,
      DIR_Y + 0.98,
      true
    );

    const note = text(
      'Same distance, opposite directions',
      P ? 17 : 16,
      C.ink,
      CX,
      DIR_Y - 1.21
    );

    return {
      base: new M.VGroup(axis, ...ticks, heading, actual),
      early: new M.VGroup(early, leftBar, sixLeft),
      late: new M.VGroup(late, rightBar, sixRight),
      note
    };
  }

  const direction = directionDemo();

  await until(S(19));
  await play(
    ...fadeOut(lineObjects()),
    ...fadeOut(predA),
    ...fadeOut(gapsA),
    new M.FadeIn(direction.base),
    lag(
      [
        new M.FadeIn(direction.early),
        new M.FadeIn(direction.late),
        new M.FadeIn(direction.note)
      ],
      2.0,
      0.25
    ),
    ...fbox([
      ['6 hours too early', C.amber],
      ['6 hours too late', BLUE],
      ['absolute error = 6', C.green]
    ], C.green),
    ...say('DIRECTION DOES NOT MATTER', C.amber)
  );

  // ------------------------------------------------------------
  // 20–24: Tool B, with three smaller errors.
  // ------------------------------------------------------------

  lines = makeLines();

  const predB = B.map((v, i) =>
    predictedMark(v, ROW_Y[i], PURPLE, 'B')
  );

  const gapsB = EB.map((_, i) =>
    gapBar(ACTUAL[i], B[i], ROW_Y[i], PURPLE)
  );

  await until(S(20));
  await play(
    ...fadeOut([
      direction.base,
      direction.early,
      direction.late,
      direction.note
    ]),
    ...clearBox(),
    ...fadeIn(lineObjects()),
    lag(fadeIn(predB), 1.8, 0.18),
    ...say('B: 14, 10, 12 HOURS', PURPLE)
  );

  await until(S(21));
  await play(
    new M.FadeIn(gapsB[0]),
    new M.Indicate(predB[0], {
      color: PURPLE
    }),
    ...say('P1: 2 HOURS TOO HIGH', PURPLE)
  );

  await until(S(22));
  await play(
    new M.FadeIn(gapsB[1]),
    new M.Indicate(predB[1], {
      color: PURPLE
    }),
    ...say('P2: 2 HOURS TOO HIGH', PURPLE)
  );

  await until(S(23));
  await play(
    new M.FadeIn(gapsB[2]),
    new M.Indicate(predB[2], {
      color: PURPLE
    }),
    ...say('P3: 2 HOURS TOO LOW', PURPLE)
  );

  await until(S(24));
  await play(
    lag(
      gapsB.map(g => new M.Indicate(g, {
        color: PURPLE
      })),
      1.4
    ),
    ...fbox([
      ['Tool B absolute errors', PURPLE],
      'P1    P2    P3',
      [' 2     2     2 hours', PURPLE]
    ], PURPLE),
    ...say('THREE ERRORS OF 2 HOURS', PURPLE)
  );

  // ------------------------------------------------------------
  // Comparison layout.
  // One unit block represents one hour of absolute error.
  // The same unit length is retained when making squares.
  // ------------------------------------------------------------

  const U = P ? 0.29 : 0.26;

  const COL_X = [
    CX - 1.95,
    CX + 0.22,
    CX + 2.39
  ];

  const BASE_A = P ? -0.12 : -0.15;
  const BASE_B = P ? -2.90 : -2.13;

  const TOOL_X = CX - 3.25;

  function unitBlock(x, y, color, opacity = 0.86) {
    return rect(
      x,
      y,
      U * 0.94,
      U * 0.94,
      color,
      opacity,
      1
    );
  }

  function cellPosition(pump, error, col, row, base) {
    return [
      COL_X[pump] - error * U / 2 + (col + 0.5) * U,
      base + (row + 0.5) * U,
      0
    ];
  }

  function errorRow(errors, base, color, name) {
    const blocks = [];
    const labels = [];
    const names = [];

    errors.forEach((e, i) => {
      for (let j = 0; j < e; j++) {
        const p = cellPosition(i, e, j, 0, base);

        blocks.push({
          object: unitBlock(p[0], p[1], color),
          pump: i,
          col: j,
          original: p
        });
      }

      labels.push(
        text(
          `${e} h`,
          P ? 19 : 18,
          e === 0 ? C.muted : color,
          COL_X[i],
          base - 0.24,
          true
        )
      );

      names.push(
        text(
          `P${i + 1}`,
          15,
          C.muted,
          COL_X[i],
          base - 0.58,
          true
        )
      );
    });

    const tool = text(
      name,
      P ? 17 : 16,
      color,
      TOOL_X,
      base + 0.09,
      true
    );

    const floor = line(
      COL_X[0] - 0.87,
      base - 0.025,
      COL_X[2] + 0.87,
      base - 0.025,
      C.muted,
      1.5
    );

    return {
      blocks,
      labels,
      names,
      tool,
      floor,
      base,
      color,
      errors
    };
  }

  const rowA = errorRow(EA, BASE_A, BLUE, 'A');
  const rowB = errorRow(EB, BASE_B, PURPLE, 'B');

  const rowObjects = r => [
    r.tool,
    r.floor,
    ...r.names,
    ...r.labels,
    ...r.blocks.map(b => b.object)
  ];

  const unitNote = text(
    '1 block = 1 hour of error',
    P ? 16 : 15,
    C.muted,
    CX,
    P ? -4.25 : -2.91
  );

  // ------------------------------------------------------------
  // 25: Place both tools' absolute errors together.
  // ------------------------------------------------------------

  await until(S(25));
  await play(
    ...fadeOut(lineObjects()),
    ...fadeOut(predB),
    ...fadeOut(gapsB),
    ...clearBox(),
    lag(
      [
        ...fadeIn(rowObjects(rowA)),
        ...fadeIn(rowObjects(rowB)),
        new M.FadeIn(unitNote)
      ],
      1.5,
      0.04
    ),
    ...say('WHICH TOOL MAKES SMALLER MISTAKES?', C.amber)
  );

  // ------------------------------------------------------------
  // 26–27: Add the absolute errors.
  // ------------------------------------------------------------

  await until(S(26));
  await play(
    lag(
      rowA.labels.map(l =>
        new M.Indicate(l, { color: BLUE })
      ),
      1.5,
      0.20
    ),
    ...fbox([
      ['Tool A', BLUE],
      '6 + 0 + 0',
      [`total = ${sum(EA)} hours`, BLUE]
    ], BLUE),
    ...say('ADD TOOL A ERRORS', BLUE)
  );

  await until(S(27));
  await play(
    lag(
      rowB.labels.map(l =>
        new M.Indicate(l, { color: PURPLE })
      ),
      1.5,
      0.20
    ),
    ...fbox([
      ['Tool A: 6 + 0 + 0 = 6', BLUE],
      ['Tool B: 2 + 2 + 2 = 6', PURPLE],
      ['same total: 6 hours', C.amber]
    ], C.amber),
    ...say('BOTH TOTALS ARE 6 HOURS', C.amber)
  );

  // ------------------------------------------------------------
  // 28: Share six hours equally among three pumps.
  // Physically redistribute A's six blocks.
  // B's blocks are already equally distributed.
  // ------------------------------------------------------------

  const shareLabelsA = COL_X.map(x =>
    text(
      '2 h',
      P ? 19 : 18,
      C.amber,
      x,
      BASE_A - 0.24,
      true
    )
  );

  const shareLabelsB = COL_X.map(x =>
    text(
      '2 h',
      P ? 19 : 18,
      C.amber,
      x,
      BASE_B - 0.24,
      true
    )
  );

  const shareMoves = rowA.blocks.map((b, j) => {
    const pump = Math.floor(j / 2);
    const col = j % 2;

    const p = cellPosition(pump, 2, col, 0, BASE_A);

    return new M.Transform(
      b.object,
      unitBlock(p[0], p[1], BLUE),
      { pathArc: j < 2 ? 0 : -0.65 }
    );
  });

  await until(S(28));
  await play(
    lag(shareMoves, 2.0, 0.18),
    ...fadeOut(rowA.labels),
    ...fadeOut(rowB.labels),
    ...fadeIn(shareLabelsA),
    ...fadeIn(shareLabelsB),
    ...fbox([
      ['share equally across 3 pumps', C.ink],
      '6 ÷ 3',
      ['= 2 hours per pump', C.amber]
    ], C.amber),
    ...say('SHARE EACH TOTAL EQUALLY', C.amber)
  );

  // ------------------------------------------------------------
  // 29–30: Introduce mean absolute error.
  // ------------------------------------------------------------

  await until(S(29));
  await play(
    ...fbox([
      ['mean absolute error', C.green],
      'MAE',
      ['fair share of absolute errors', C.ink]
    ], C.green),
    ...say('MEAN ABSOLUTE ERROR = MAE', C.green)
  );

  await until(S(30));
  await play(
    ...fbox([
      [`A: 6 ÷ 3 = ${MAE_A} hours`, BLUE],
      [`B: 6 ÷ 3 = ${MAE_B} hours`, PURPLE],
      ['same mean absolute error', C.green]
    ], C.green),
    lag(
      [...shareLabelsA, ...shareLabelsB].map(l =>
        new M.Indicate(l, {
          color: C.green
        })
      ),
      1.2,
      0.08
    ),
    ...say('BOTH MAEs = 2 HOURS', C.green)
  );

  // ------------------------------------------------------------
  // 31–33: Restore the original error bars.
  // Equal means do not imply equal patterns of mistakes.
  // ------------------------------------------------------------

  const returnMoves = rowA.blocks.map(b =>
    new M.Transform(
      b.object,
      unitBlock(
        b.original[0],
        b.original[1],
        BLUE
      ),
      { pathArc: 0.6 }
    )
  );

  await until(S(31));
  await play(
    lag(returnMoves, 1.05, 0.07),
    ...fadeOut(shareLabelsA),
    ...fadeOut(shareLabelsB),
    ...fadeIn(rowA.labels),
    ...fadeIn(rowB.labels),
    ...say('LOOK AT THE ORIGINAL ERRORS', C.amber)
  );

  await until(S(32));
  await play(
    lag(
      [
        ...rowA.blocks.map(b =>
          new M.Indicate(b.object, {
            color: C.amber
          })
        ),
        ...rowB.labels.map(l =>
          new M.Indicate(l, {
            color: PURPLE
          })
        )
      ],
      2.0,
      0.10
    ),
    ...fbox([
      ['A: one large mistake', BLUE],
      ['B: three smaller mistakes', PURPLE],
      ['same MAE', C.muted]
    ], C.amber),
    ...say('ONE LARGE VS THREE SMALL', C.amber)
  );

  const largeMistakeOutline = new M.RoundedRectangle({
    width: 6 * U + 0.22,
    height: 0.95,
    cornerRadius: 0.12,
    color: C.amber,
    strokeWidth: 2.5
  });

  largeMistakeOutline.setFill(C.amber, 0);

  largeMistakeOutline.moveTo([
    COL_X[0],
    BASE_A + 0.02,
    0
  ]);

  await until(S(33));
  await play(
    new M.Create(largeMistakeOutline),
    ...clearBox(),
    ...say('WHAT IF A LARGE MISTAKE COSTS MORE?', C.amber)
  );

  // ------------------------------------------------------------
  // Squaring helpers.
  // Preserve the original bars as the bottom rows of the squares.
  // Every added cell is exactly one square hour.
  // ------------------------------------------------------------

  function squareOutline(pump, error, base, color) {
    const side = error * U;

    const outline = new M.Rectangle({
      width: side,
      height: side,
      color,
      strokeWidth: 2
    });

    outline.setFill(color, 0);

    outline.moveTo([
      COL_X[pump],
      base + side / 2,
      0
    ]);

    return outline;
  }

  function squareExtraRows(pump, error, base, color) {
    const rows = [];

    for (let r = 1; r < error; r++) {
      const cells = [];

      for (let c = 0; c < error; c++) {
        const p = cellPosition(
          pump,
          error,
          c,
          r,
          base
        );

        cells.push(
          unitBlock(
            p[0],
            p[1],
            color,
            0.82
          )
        );
      }

      rows.push(new M.VGroup(...cells));
    }

    return rows;
  }

  function squareSideLabel(pump, error, base, color, axis) {
    if (axis === 'top') {
      return text(
        `${error} h`,
        15,
        color,
        COL_X[pump],
        base + error * U + 0.17,
        true
      );
    }

    return text(
      `${error} h`,
      15,
      color,
      COL_X[pump] + error * U / 2 + 0.29,
      base + error * U / 2,
      true
    );
  }

  const outlineA = squareOutline(0, 6, BASE_A, BLUE);

  const extraA = squareExtraRows(
    0,
    6,
    BASE_A,
    BLUE
  );

  const sideA = squareSideLabel(
    0,
    6,
    BASE_A,
    BLUE,
    'side'
  );

  const squareNote = text(
    '1 small square = 1 square hour',
    P ? 16 : 15,
    C.muted,
    CX,
    P ? -4.25 : -2.91
  );

  // ------------------------------------------------------------
  // 34: Introduce the picture of a squared error.
  // ------------------------------------------------------------

  await until(S(34));
  await play(
    new M.FadeOut(largeMistakeOutline),
    new M.FadeOut(unitNote),
    new M.Create(outlineA),
    ...say('MAKE EACH ERROR BAR INTO A SQUARE', C.amber)
  );

  // ------------------------------------------------------------
  // 35: A's six-hour error becomes a 6 × 6 square.
  // Build five additional rows above the original six-unit bar.
  // ------------------------------------------------------------

  await until(S(35));
  await play(
    lag(
      extraA.map(r => new M.FadeIn(r)),
      2.6,
      0.22
    ),
    new M.FadeIn(sideA),
    ...fbox([
      ['Tool A, Pump 1', BLUE],
      '6 units across',
      '6 units upwards'
    ], BLUE),
    ...say('6 UNITS ALONG EACH SIDE', BLUE)
  );

  // ------------------------------------------------------------
  // 36: Count the area.
  // ------------------------------------------------------------

  const areaA = text(
    '36',
    P ? 33 : 30,
    WHITE,
    COL_X[0],
    BASE_A + 3 * U,
    true
  );

  const areaAback = new M.RoundedRectangle({
    width: 0.90,
    height: 0.48,
    cornerRadius: 0.10,
    color: BLUE,
    strokeWidth: 1.5
  });

  areaAback.setFill(C.card, 0.92);

  areaAback.moveTo([
    COL_X[0],
    BASE_A + 3 * U,
    0
  ]);

  const countA = new M.VGroup(areaAback, areaA);

  await until(S(36));
  await play(
    new M.FadeIn(countA),
    new M.FadeIn(squareNote),
    ...fbox([
      ['6 × 6', BLUE],
      ['= 36 small squares', BLUE]
    ], BLUE),
    ...say('6 × 6 = 36', BLUE)
  );

  // ------------------------------------------------------------
  // 37: Zero errors contribute zero area.
  // ------------------------------------------------------------

  const zeroSquaresA = [1, 2].map(i =>
    text(
      '0 squares',
      16,
      C.muted,
      COL_X[i],
      BASE_A + 0.38,
      true
    )
  );

  await until(S(37));
  await play(
    ...fadeIn(zeroSquaresA),
    ...fbox([
      ['Tool A squared errors', BLUE],
      ['36 + 0 + 0', BLUE]
    ], BLUE),
    ...say('ZERO ERROR MAKES ZERO SQUARES', C.muted)
  );

  // ------------------------------------------------------------
  // 38–40: B's three two-hour errors become three 2 × 2 squares.
  // ------------------------------------------------------------

  const outlinesB = EB.map((e, i) =>
    squareOutline(i, e, BASE_B, PURPLE)
  );

  const extraB = EB.map((e, i) =>
    squareExtraRows(i, e, BASE_B, PURPLE)
  ).flat();

  const sideB = EB.map((e, i) =>
    squareSideLabel(
      i,
      e,
      BASE_B,
      PURPLE,
      'top'
    )
  );

  await until(S(38));
  await play(
    lag(
      [
        ...outlinesB.map(o => new M.Create(o)),
        ...extraB.map(g => new M.FadeIn(g)),
        ...fadeIn(sideB)
      ],
      2.8,
      0.12
    ),
    ...fbox([
      ['Tool B', PURPLE],
      '2 units across',
      '2 units upwards'
    ], PURPLE),
    ...say('THREE 2-BY-2 SQUARES', PURPLE)
  );

  const countsB = EB.map((e, i) => {
    const x = COL_X[i];
    const y = BASE_B + e * U / 2;

    const back = new M.RoundedRectangle({
      width: 0.34,
      height: 0.30,
      cornerRadius: 0.05,
      color: PURPLE,
      strokeWidth: 1
    });

    back.setFill(C.card, 0.92);
    back.moveTo([x, y, 0]);

    const t = text(
      String(e * e),
      17,
      WHITE,
      x,
      y,
      true
    );

    return new M.VGroup(back, t);
  });

  await until(S(39));
  await play(
    lag(fadeIn(countsB), 0.9, 0.16),
    ...fbox([
      ['2 × 2', PURPLE],
      ['= 4 small squares', PURPLE]
    ], PURPLE),
    ...say('EACH SQUARE CONTAINS 4', PURPLE)
  );

  await until(S(40));
  await play(
    lag(
      countsB.map(c =>
        new M.Indicate(c, {
          color: PURPLE
        })
      ),
      1.3,
      0.15
    ),
    ...fbox([
      ['Tool B', PURPLE],
      '4 + 4 + 4',
      [`= ${sum(SB)} small squares`, PURPLE]
    ], PURPLE),
    ...say('4 + 4 + 4 = 12', PURPLE)
  );

  // ------------------------------------------------------------
  // 41: Name squared error, after demonstrating the geometry.
  // ------------------------------------------------------------

  await until(S(41));
  await play(
    ...fbox([
      ['squared error', C.cyan],
      'error × error',
      ['6² = 36     2² = 4', C.amber]
    ], C.cyan),
    ...say('SQUARED ERROR = ERROR × ITSELF')
  );

  // ------------------------------------------------------------
  // 42–46: Sum and average the squared errors.
  // ------------------------------------------------------------

  await until(S(42));
  await play(
    new M.Indicate(countA, {
      color: BLUE
    }),
    ...fbox([
      ['Tool A', BLUE],
      '36 + 0 + 0',
      [`total = ${sum(SA)}`, BLUE]
    ], BLUE),
    ...say('A: TOTAL SQUARED ERROR = 36', BLUE)
  );

  await until(S(43));
  await play(
    ...fbox([
      ['Tool A', BLUE],
      '36 ÷ 3 pumps',
      [`= ${MSE_A}`, BLUE]
    ], BLUE),
    ...say('A: 36 ÷ 3 = 12', BLUE)
  );

  await until(S(44));
  await play(
    lag(
      countsB.map(c =>
        new M.Indicate(c, {
          color: PURPLE
        })
      ),
      1.2,
      0.15
    ),
    ...fbox([
      ['Tool A total: 36 + 0 + 0 = 36', BLUE],
      ['Tool B total:  4 + 4 + 4 = 12', PURPLE]
    ], PURPLE),
    ...say('B: TOTAL SQUARED ERROR = 12', PURPLE)
  );

  await until(S(45));
  await play(
    ...fbox([
      [`Tool A: 36 ÷ 3 = ${MSE_A}`, BLUE],
      [`Tool B: 12 ÷ 3 = ${MSE_B}`, PURPLE]
    ], PURPLE),
    ...say('B: 12 ÷ 3 = 4', PURPLE)
  );

  await until(S(46));
  await play(
    ...fbox([
      ['mean squared error (MSE)', C.green],
      [`A: ${MSE_A} square hours`, BLUE],
      [`B:  ${MSE_B} square hours`, PURPLE]
    ], C.green),
    ...say('MEAN SQUARED ERROR = MSE', C.green)
  );

  // ------------------------------------------------------------
  // 47–49: General formulas.
  // Keep the geometric comparison visible while introducing
  // the notation.
  // ------------------------------------------------------------

  await until(S(47));
  await play(
    ...clearBox(),
    ...say('TWO METHODS, TWO SHORT FORMULAS')
  );

  await until(S(48));
  await play(
    ...fbox([
      ['MAE = sum of absolute errors', C.ink],
      '      ÷ number of predictions',
      ['A = 2 h     B = 2 h', C.green]
    ], C.green),
    ...say('MEAN ABSOLUTE ERROR', C.green)
  );

  await until(S(49));
  await play(
    ...fbox([
      ['MAE = sum of absolute errors', C.ink],
      '      ÷ number of predictions',
      ['MSE = sum of squared errors', C.ink],
      '      ÷ number of predictions'
    ], C.cyan),
    ...say('MEAN SQUARED ERROR')
  );

  // ------------------------------------------------------------
  // Final comparison helpers.
  // Show absolute errors as length and squared errors as area,
  // in succession, using one picture at a time.
  // ------------------------------------------------------------

  function allSquareObjects() {
    return [
      ...rowObjects(rowA),
      ...rowObjects(rowB),
      outlineA,
      ...extraA,
      sideA,
      countA,
      ...zeroSquaresA,
      ...outlinesB,
      ...extraB,
      ...sideB,
      ...countsB,
      squareNote
    ];
  }

  function resultCard(x, y, title, value, unit, color) {
    const w = P ? 2.90 : 2.95;
    const h = 1.48;

    const frame = roundRect(x, y, w, h, color);

    const name = text(
      title,
      17,
      color,
      x,
      y + 0.45
    );

    const v = text(
      String(value),
      34,
      color,
      x,
      y + 0.02,
      true
    );

    const u = text(
      unit,
      15,
      C.muted,
      x,
      y - 0.46
    );

    return new M.VGroup(frame, name, v, u);
  }

  const FINAL_A_X = CX - 1.65;
  const FINAL_B_X = CX + 1.65;

  const RESULT_Y = P ? -2.85 : -2.10;
  const TOP_Y = P ? 0.32 : 0.10;

  function compactErrorBars(errors, x, y, color, tool) {
    const objects = [];

    const heading = text(
      `TOOL ${tool}`,
      19,
      color,
      x,
      y + 1.0,
      true
    );

    objects.push(heading);

    errors.forEach((e, i) => {
      const yy = y + 0.42 - i * 0.52;
      const start = x - 0.77;

      objects.push(
        text(
          `P${i + 1}`,
          P ? 15 : 13,
          C.muted,
          x - 1.12,
          yy,
          true
        )
      );

      if (e > 0) {
        for (let j = 0; j < e; j++) {
          objects.push(
            rect(
              start + (j + 0.5) * 0.22,
              yy,
              0.20,
              0.21,
              color,
              0.84,
              1
            )
          );
        }
      } else {
        objects.push(
          circle(
            start,
            yy,
            0.045,
            C.muted,
            0
          )
        );
      }

      objects.push(
        text(
          `${e} h`,
          15,
          e === 0 ? C.muted : color,
          x + 0.92,
          yy,
          true
        )
      );
    });

    return new M.VGroup(...objects);
  }

  const compactA = compactErrorBars(
    EA,
    FINAL_A_X,
    TOP_Y,
    BLUE,
    'A'
  );

  const compactB = compactErrorBars(
    EB,
    FINAL_B_X,
    TOP_Y,
    PURPLE,
    'B'
  );

  const maeCardA = resultCard(
    FINAL_A_X,
    RESULT_Y,
    'TOOL A · MAE',
    MAE_A,
    'hours',
    BLUE
  );

  const maeCardB = resultCard(
    FINAL_B_X,
    RESULT_Y,
    'TOOL B · MAE',
    MAE_B,
    'hours',
    PURPLE
  );

  // ------------------------------------------------------------
  // 50: Absolute error describes typical mistake size in hours.
  // ------------------------------------------------------------

  await until(S(50));
  await play(
    ...fadeOut(allSquareObjects()),
    new M.FadeIn(compactA),
    new M.FadeIn(compactB),
    new M.FadeIn(maeCardA),
    new M.FadeIn(maeCardB),
    ...fbox([
      ['absolute error', C.cyan],
      'typical mistake size',
      ['units: hours', C.green]
    ], C.green),
    ...say('ABSOLUTE ERROR: HOW FAR OFF?')
  );

  // ------------------------------------------------------------
  // Compact area comparison.
  // A and B use identical square-cell sizes.
  // ------------------------------------------------------------

  const Q = P ? 0.32 : 0.29;

  function compactGrid(n, x, y, color) {
    const cells = [];

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        cells.push(
          rect(
            x + (c - (n - 1) / 2) * Q,
            y + (r - (n - 1) / 2) * Q,
            Q * 0.94,
            Q * 0.94,
            color,
            0.84,
            1
          )
        );
      }
    }

    const border = new M.Rectangle({
      width: n * Q,
      height: n * Q,
      color,
      strokeWidth: 2
    });

    border.setFill(color, 0);
    border.moveTo([x, y, 0]);

    return new M.VGroup(...cells, border);
  }

  const FINAL_GRID_Y = P ? 0.12 : -0.02;

  const bigGrid = compactGrid(
    6,
    FINAL_A_X,
    FINAL_GRID_Y,
    BLUE
  );

  const bigHeader = text(
    'A: 36 SQUARES',
    17,
    BLUE,
    FINAL_A_X,
    FINAL_GRID_Y + 3 * Q + 0.28,
    true
  );

  const bigNote = text(
    'P1: 36    P2: 0    P3: 0',
    P ? 16 : 12,
    BLUE,
    FINAL_A_X,
    FINAL_GRID_Y - 3 * Q - 0.20,
    true
  );

  const smallGrids = [0, 1, 2].map(i =>
    compactGrid(
      2,
      FINAL_B_X + (i - 1) * (P ? 0.90 : 0.83),
      FINAL_GRID_Y,
      PURPLE
    )
  );

  const smallHeader = text(
    'B: 12 SQUARES',
    17,
    PURPLE,
    FINAL_B_X,
    FINAL_GRID_Y + 3 * Q + 0.28,
    true
  );

  const smallNotes = [0, 1, 2].map(i =>
    text(
      `P${i + 1}: 4`,
      P ? 15 : 13,
      PURPLE,
      FINAL_B_X + (i - 1) * (P ? 0.90 : 0.83),
      FINAL_GRID_Y - Q - 0.25,
      true
    )
  );

  const mseCardA = resultCard(
    FINAL_A_X,
    RESULT_Y,
    'TOOL A · MSE',
    MSE_A,
    'square hours',
    BLUE
  );

  const mseCardB = resultCard(
    FINAL_B_X,
    RESULT_Y,
    'TOOL B · MSE',
    MSE_B,
    'square hours',
    PURPLE
  );

  // ------------------------------------------------------------
  // 51: Squared error gives larger mistakes extra weight.
  // ------------------------------------------------------------

  await until(S(51));
  await play(
    ...fadeOut([
      compactA,
      compactB,
      maeCardA,
      maeCardB
    ]),
    new M.FadeIn(bigGrid),
    new M.FadeIn(bigHeader),
    new M.FadeIn(bigNote),
    ...fadeIn(smallGrids),
    new M.FadeIn(smallHeader),
    ...fadeIn(smallNotes),
    new M.FadeIn(mseCardA),
    new M.FadeIn(mseCardB),
    ...fbox([
      ['absolute error: 6 vs 2', C.ink],
      '3 times as large',
      ['squared: 36 vs 4', C.amber],
      ['9 times as large', C.amber]
    ], C.amber),
    ...say('LARGE MISTAKES COUNT MORE', C.amber)
  );

  // ------------------------------------------------------------
  // 52: One unusually large error can dominate the MSE.
  // Highlight the single error that contributes all of A's MSE.
  // ------------------------------------------------------------

  const dominanceOutline = new M.RoundedRectangle({
    width: 6 * Q + 0.22,
    height: 6 * Q + 0.22,
    cornerRadius: 0.12,
    color: C.amber,
    strokeWidth: 3
  });

  dominanceOutline.setFill(C.amber, 0);

  dominanceOutline.moveTo([
    FINAL_A_X,
    FINAL_GRID_Y,
    0
  ]);

  await until(S(52));
  await play(
    new M.Create(dominanceOutline),
    new M.Indicate(mseCardA, {
      color: C.amber
    }),
    ...fbox([
      ['A: 36 + 0 + 0 = 36', BLUE],
      'one large mistake',
      ['100% of A’s squared error', C.amber]
    ], C.amber),
    ...say('ONE LARGE ERROR CAN DOMINATE', C.amber)
  );

  // ------------------------------------------------------------
  // 53: Choose the measure according to the consequences.
  // ------------------------------------------------------------

  await until(S(53));
  await play(
    new M.FadeOut(dominanceOutline),
    ...fbox([
      ['MAE: typical size of mistakes', C.cyan],
      ['MSE: emphasise large mistakes', C.amber],
      'choose based on consequences'
    ], C.green),
    ...say('WHAT MATTERS IN YOUR SITUATION?', C.green)
  );

  // ------------------------------------------------------------
  // 54: Final visual recap.
  // Compare length with area and retain the exact lesson results.
  // ------------------------------------------------------------

  const recapY = P ? -0.25 : -0.40;
  const RECAP_U = P ? 0.32 : 0.29;

  function recapPanel(x, y, squared) {
    const w = P ? 3.05 : 3.20;
    const h = P ? 4.20 : 3.90;

    const color = squared ? C.amber : C.cyan;

    const panel = roundRect(x, y, w, h, color);

    const title = text(
      squared ? 'SQUARED ERROR' : 'ABSOLUTE ERROR',
      P ? 17 : 16,
      color,
      x,
      y + h / 2 - 0.36
    );

    const subtitle = text(
      squared ? 'Area' : 'Distance',
      15,
      C.muted,
      x,
      y + h / 2 - 0.72
    );

    const picture = [];

    if (squared) {
      const gy = y + 0.04;

      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          picture.push(
            rect(
              x + (c - 2.5) * RECAP_U,
              gy + (r - 2.5) * RECAP_U,
              RECAP_U * 0.93,
              RECAP_U * 0.93,
              BLUE,
              0.82,
              1
            )
          );
        }
      }

      picture.push(
        text(
          '6 × 6 = 36',
          17,
          BLUE,
          x,
          gy - 3 * RECAP_U - 0.25,
          true
        )
      );
    } else {
      const by = y + 0.10;

      for (let c = 0; c < 6; c++) {
        picture.push(
          rect(
            x + (c - 2.5) * RECAP_U,
            by,
            RECAP_U * 0.93,
            RECAP_U * 0.93,
            BLUE,
            0.82,
            1
          )
        );
      }

      picture.push(
        text(
          '6 hours',
          19,
          BLUE,
          x,
          by + 0.43,
          true
        )
      );

      picture.push(
        text(
          'Size of the gap',
          15,
          C.muted,
          x,
          by - 0.45
        )
      );
    }

    const result = text(
      squared
        ? `MSE: A = ${MSE_A}, B = ${MSE_B}`
        : `MAE: A = ${MAE_A}, B = ${MAE_B}`,
      17,
      color,
      x,
      y - h / 2 + 0.46,
      true
    );

    const units = text(
      squared ? 'square hours' : 'hours',
      P ? 15 : 13,
      C.muted,
      x,
      y - h / 2 + 0.17
    );

    return new M.VGroup(
      panel,
      title,
      subtitle,
      ...picture,
      result,
      units
    );
  }

  const recapAbs = recapPanel(
    CX - 1.68,
    recapY,
    false
  );

  const recapSq = recapPanel(
    CX + 1.68,
    recapY,
    true
  );

  await until(S(54));
  await play(
    ...fadeOut([
      bigGrid,
      bigHeader,
      bigNote,
      ...smallGrids,
      smallHeader,
      ...smallNotes,
      mseCardA,
      mseCardB
    ]),
    new M.FadeIn(recapAbs),
    new M.FadeIn(recapSq),
    ...fbox([
      ['ABSOLUTE: size of mistakes', C.cyan],
      ['SQUARED: extra weight', C.amber],
      ['for larger mistakes', C.amber]
    ], C.green),
    ...say('DISTANCE VS AREA', C.green)
  );

  // Hold the final picture until the narration finishes.
  await until(E(54));
}
