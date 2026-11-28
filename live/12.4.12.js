// lesson 12.4.12
// Conformal prediction — live, narration-synchronised lesson.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses all 55 supplied narration sentences and the fixed chapter data.
// Browser playback has not been verified here.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ============================================================
  // FIXED DATA
  // ============================================================

  // Nine separate calibration pumps.
  // None was used to train Tool A.
  // None belongs to the twelve-pump evaluation group.
  //
  // C1–C9 are visual identifiers for the calibration pumps.

  const CAL_ACTUAL = [10, 12, 14, 16, 18, 20, 22, 24, 26];
  const CAL_PRED = [10, 11, 16, 13, 19, 22, 25, 28, 32];

  const CAL = CAL_ACTUAL.map((actual, i) => ({
    id: `C${i + 1}`,
    actual,
    pred: CAL_PRED[i],
    error: Math.abs(CAL_PRED[i] - actual),
    index: i
  }));

  const SORTED = [...CAL].sort(
    (a, b) => a.error - b.error || a.index - b.index
  );

  const TARGET = 0.8;
  const N = CAL.length;

  const RANK = Math.ceil((N + 1) * TARGET);
  const Q = SORTED[RANK - 1].error;

  // The corrected conformal rank is 8.
  //
  // Original errors:
  // 0, 1, 2, 3, 1, 2, 3, 4, 6
  //
  // Sorted errors:
  // 0, 1, 1, 2, 2, 3, 3, 4, 6
  //
  // The eighth smallest calibration error is 4 hours.
  //
  // Each prediction interval has a half-width of 4 hours,
  // giving a total width of 8 hours.

  const DATA = [
    { id: 'P1',  actual: 12, a: 18, b: 14, prob: 90, failed: false },
    { id: 'P2',  actual: 8,  a: 8,  b: 10, prob: 60, failed: true  },
    { id: 'P3',  actual: 14, a: 14, b: 12, prob: 60, failed: false },
    { id: 'P4',  actual: 6,  a: 8,  b: 7,  prob: 30, failed: true  },
    { id: 'P5',  actual: 16, a: 15, b: 14, prob: 30, failed: false },
    { id: 'P6',  actual: 20, a: 22, b: 20, prob: 30, failed: false },
    { id: 'P7',  actual: 18, a: 17, b: 20, prob: 10, failed: false },
    { id: 'P8',  actual: 22, a: 22, b: 21, prob: 10, failed: false },
    { id: 'P9',  actual: 24, a: 25, b: 24, prob: 10, failed: false },
    { id: 'P10', actual: 26, a: 24, b: 25, prob: 10, failed: false },
    { id: 'P11', actual: 28, a: 28, b: 28, prob: 10, failed: false },
    { id: 'P12', actual: 30, a: 31, b: 30, prob: 10, failed: false }
  ].map(d => {
    const lower = d.a - Q;
    const upper = d.a + Q;

    return {
      ...d,
      lower,
      upper,
      error: Math.abs(d.a - d.actual),
      covered: d.actual >= lower && d.actual <= upper
    };
  });

  const COVERED = DATA.filter(d => d.covered).length;
  const COVERAGE = COVERED / DATA.length;

  // Checked evaluation intervals:
  //
  // Pump   Prediction   Interval    Actual    Covered
  // P1         18       [14, 22]      12        No
  // P2          8       [ 4, 12]       8        Yes
  // P3         14       [10, 18]      14        Yes
  // P4          8       [ 4, 12]       6        Yes
  // P5         15       [11, 19]      16        Yes
  // P6         22       [18, 26]      20        Yes
  // P7         17       [13, 21]      18        Yes
  // P8         22       [18, 26]      22        Yes
  // P9         25       [21, 29]      24        Yes
  // P10        24       [20, 28]      26        Yes
  // P11        28       [24, 32]      28        Yes
  // P12        31       [27, 35]      30        Yes
  //
  // Observed coverage = 11/12 = 91.666...%.
  //
  // The target is marginal coverage of at least 80% under
  // exchangeability, not conditional coverage for every pump.
  //
  // Ties can make the coverage guarantee conservative.

  const WHITE = '#FFFFFF';
  const BLUE = C.blue || '#58A6FF';
  const RED = C.red || '#F87171';
  const GREEN = C.green || '#4ADE80';
  const AMBER = C.amber || '#FBBF24';
  const VIOLET = C.violet || '#A78BFA';

  // ============================================================
  // RESPONSIVE LAYOUT
  // ============================================================

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.6, 0]
    : [4.3, -0.30, 0];

  const say = (s, color = C.cyan) =>
    showA(s, color, PILL);

  // ============================================================
  // BASIC DRAWING HELPERS
  // ============================================================

  function text(s, size, color, x, y, mono = false, maxw = null) {
    const t = T(s, size, color, mono);

    if (maxw !== null && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);

    return t;
  }

  function line(x1, y1, x2, y2, color = C.muted, sw = 2) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: sw
    });
  }

  function dashed(x1, y1, x2, y2, color = C.muted, sw = 1.5) {
    return new M.DashedLine({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: sw
    });
  }

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

  function rounded(
    x, y, w, h,
    color = C.muted,
    fill = C.card,
    opacity = 0.95,
    sw = 2,
    radius = 0.12
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: radius,
      color,
      strokeWidth: sw
    });

    r.setFill(fill, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function circle(x, y, radius, color, opacity = 1, sw = 2) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth: sw
    });

    c.setFill(color, opacity);
    c.moveTo([x, y, 0]);

    return c;
  }

  function arrow(x1, y1, x2, y2, color, head = 0.13) {
    const angle = Math.atan2(y2 - y1, x2 - x1);

    return new M.VGroup(
      line(x1, y1, x2, y2, color, 2.5),

      line(
        x2, y2,
        x2 + head * Math.cos(angle + Math.PI * 0.82),
        y2 + head * Math.sin(angle + Math.PI * 0.82),
        color, 2.5
      ),

      line(
        x2, y2,
        x2 + head * Math.cos(angle - Math.PI * 0.82),
        y2 + head * Math.sin(angle - Math.PI * 0.82),
        color, 2.5
      )
    );
  }

  const fadeIn = objects =>
    objects.filter(Boolean).map(o => new M.FadeIn(o));

  const fadeOut = objects =>
    objects.filter(Boolean).map(o => new M.FadeOut(o));

  const indicate = (objects, color = AMBER, runTime = 0.8) =>
    objects.filter(Boolean).map(o =>
      new M.Indicate(o, { color, runTime })
    );

  function lag(anims, runTime = 1.2, lagRatio = 0.12) {
    return new M.LaggedStart(anims, {
      lagRatio,
      runTime
    });
  }

  // Named slots keep already-visible objects independent.
  // No visible objects are wrapped in newly created VGroups.

  const slots = new Map();

  function replace(key, objects = []) {
    const old = slots.get(key) || [];

    slots.set(key, objects);

    return [
      ...fadeOut(old),
      ...fadeIn(objects)
    ];
  }

  function clear(...keys) {
    return keys.flatMap(key => replace(key, []));
  }

  function get(key) {
    return slots.get(key) || [];
  }

  // ============================================================
  // APPROVED FORMULA BOX
  // ============================================================

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.38 : 0.42;

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
      const indent =
        cw * (
          rows[i][0].length -
          rows[i][0].trimStart().length
        );

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const scale = Math.min(
      1,
      (P ? FW - 1.2 : 4.0) / wd,
      (P ? 1.95 : 2.45) / ht
    );

    if (scale < 1) g.scale(scale);

    g.moveTo(BOXP);

    const anims = boxNow
      ? [new M.FadeOut(boxNow), new M.FadeIn(g)]
      : [new M.FadeIn(g)];

    boxNow = g;

    return anims;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [new M.FadeOut(old)];
  }

  // ============================================================
  // SHARED CHAPTER ICONS
  // ============================================================

  function pumpIcon(x, y, s = 1, color = C.cyan) {
    const motor = rounded(
      x - 0.29 * s, y,
      0.60 * s, 0.40 * s,
      color, color, 0.14, 2, 0.07 * s
    );

    const fins = [-0.47, -0.35, -0.23].map(dx =>
      line(
        x + dx * s, y - 0.13 * s,
        x + dx * s, y + 0.13 * s,
        color, 1.3
      )
    );

    const housing = circle(
      x + 0.19 * s, y,
      0.27 * s, color, 0.12
    );

    const inlet = rect(
      x + 0.51 * s, y,
      0.20 * s, 0.15 * s,
      color, 0.15, 1.5
    );

    const outlet = rect(
      x + 0.19 * s, y + 0.36 * s,
      0.17 * s, 0.26 * s,
      color, 0.15, 1.5
    );

    const hub = circle(
      x + 0.19 * s, y,
      0.06 * s, color, 1, 1
    );

    const feet = [-0.29, 0.19].map(dx =>
      rect(
        x + dx * s, y - 0.26 * s,
        0.22 * s, 0.10 * s,
        color, 0.35, 1
      )
    );

    return new M.VGroup(
      motor, ...fins, housing,
      inlet, outlet, hub, ...feet
    );
  }

  function failureIcon(x, y, s = 1) {
    const d = new M.Rectangle({
      width: 0.17 * s,
      height: 0.17 * s,
      color: RED,
      strokeWidth: 1.5
    });

    d.setFill(RED, 1);
    d.rotate(Math.PI / 4);
    d.moveTo([x, y, 0]);

    return d;
  }

  function safeIcon(x, y, s = 1) {
    return circle(x, y, 0.11 * s, GREEN, 0, 2.4);
  }

  // These symbols indicate interval coverage, not failure status.
  //
  // Green check: actual value inside interval.
  // Amber cross: actual value outside interval.
  //
  // Keep the chapter's red diamond and green outlined circle
  // reserved for the ten-hour failure classification.

  function coverageCheck(x, y, s = 1) {
    return new M.VGroup(
      line(
        x - 0.10 * s, y,
        x - 0.025 * s, y - 0.09 * s,
        GREEN, 3
      ),

      line(
        x - 0.025 * s, y - 0.09 * s,
        x + 0.13 * s, y + 0.11 * s,
        GREEN, 3
      )
    );
  }

  function coverageCross(x, y, s = 1) {
    return new M.VGroup(
      line(
        x - 0.09 * s, y - 0.09 * s,
        x + 0.09 * s, y + 0.09 * s,
        AMBER, 3
      ),

      line(
        x - 0.09 * s, y + 0.09 * s,
        x + 0.09 * s, y - 0.09 * s,
        AMBER, 3
      )
    );
  }

  // ============================================================
  // NUMBER LINE AND PREDICTION INTERVAL HELPERS
  // ============================================================

  function numberLine(
    x0, x1, y,
    minValue, maxValue,
    ticks,
    unit = 'hours'
  ) {
    const map = v =>
      x0 + (v - minValue) / (maxValue - minValue) * (x1 - x0);

    const objects = [
      line(x0, y, x1, y, C.muted, 2.8),

      ...ticks.flatMap(v => [
        line(
          map(v), y - 0.065,
          map(v), y + 0.065,
          C.muted, 1.5
        ),

        text(
          String(v),
          14, WHITE,
          map(v), y - 0.24,
          true, 0.56
        )
      ]),

      text(
        unit,
        15, C.muted,
        x1 - 0.12,
        y - 0.54,
        false
      )
    ];

    return {
      map,
      group: new M.VGroup(...objects)
    };
  }

  function predictedMarker(x, y, radius = 0.085) {
    return new M.VGroup(
      circle(x, y, radius * 1.75, BLUE, 0.16, 1),
      circle(x, y, radius, BLUE, 1, 1.8)
    );
  }

  function actualMarker(x, y, radius = 0.075) {
    return new M.VGroup(
      circle(x, y, radius * 1.75, WHITE, 0.13, 1),
      circle(x, y, radius, WHITE, 1, 1.4)
    );
  }

  function intervalBand(map, lower, upper, y, h = 0.38) {
    const left = map(lower);
    const right = map(upper);

    return new M.VGroup(
      rect(
        (left + right) / 2,
        y,
        right - left,
        h,
        BLUE,
        0.23,
        1.8
      ),

      line(
        left, y - h * 0.66,
        left, y + h * 0.66,
        BLUE, 2.6
      ),

      line(
        right, y - h * 0.66,
        right, y + h * 0.66,
        BLUE, 2.6
      )
    );
  }

  function endpointLabel(map, value, y, color = BLUE) {
    return text(
      String(value),
      19, color,
      map(value), y,
      true, 0.72
    );
  }

  // ============================================================
  // 0–3: WHY A RANGE CAN BE MORE USEFUL THAN ONE NUMBER
  // ============================================================

  const introAxisY = P ? -1.42 : -1.28;

  const introAxis = numberLine(
    CX - 2.83,
    CX + 2.83,
    introAxisY,
    0, 16,
    [0, 4, 8, 12, 16]
  );

  const introPump = pumpIcon(
    CX,
    P ? 0.42 : 0.36,
    1.75
  );

  const introPrediction = text(
    '8 HOURS LEFT',
    25, BLUE,
    CX,
    P ? -0.56 : -0.50,
    true, 6.2
  );

  const introDot = predictedMarker(
    introAxis.map(8),
    introAxisY
  );

  const introQuestion = text(
    '?',
    30, AMBER,
    introAxis.map(8) + 0.68,
    introAxisY + 0.44,
    true
  );

  await until(S(0));
  await play(
    ...replace('intro', [
      introPump,
      introPrediction,
      introAxis.group,
      introDot
    ]),
    ...say('TOOL A PREDICTS EIGHT HOURS LEFT', BLUE)
  );

  await until(S(1));
  await play(
    ...replace('intro-question', [introQuestion]),
    new M.Indicate(introDot, { color: AMBER }),
    ...fbox([
      ['prediction = 8 hours', BLUE],
      'actual hours may differ'
    ], AMBER),
    ...say('PREDICTIONS ARE NOT ALWAYS EXACT', AMBER)
  );

  // This first band is an illustration of a possible range,
  // not the calibrated interval that will be derived later.

  const introBand = intervalBand(
    introAxis.map,
    6, 10,
    introAxisY,
    0.40
  );

  const introRangeLabel = text(
    'A possible range',
    18, BLUE,
    CX,
    introAxisY + 0.50,
    false
  );

  await until(S(2));
  await play(
    ...clear('intro-question'),
    ...replace('intro-band', [
      introBand,
      introRangeLabel
    ]),
    ...say('A RANGE INSTEAD OF JUST ONE NUMBER?', BLUE)
  );

  const widthArrows = new M.VGroup(
    arrow(
      introAxis.map(8),
      introAxisY + 0.87,
      introAxis.map(5),
      introAxisY + 0.87,
      AMBER
    ),

    arrow(
      introAxis.map(8),
      introAxisY + 0.87,
      introAxis.map(11),
      introAxisY + 0.87,
      AMBER
    )
  );

  await until(S(3));
  await play(
    ...replace('intro-width', [widthArrows]),
    ...fbox([
      ['how much room', AMBER],
      'should we leave on each side?'
    ], AMBER),
    ...say('HOW WIDE SHOULD THE RANGE BE?', AMBER)
  );

  // ============================================================
  // NINE CALIBRATION PUMP CARDS
  // ============================================================

  const CAL_CARD_W = 2.30;
  const CAL_CARD_H = P ? 1.50 : 1.24;

  const CAL_DX = 2.42;
  const CAL_DY = P ? 1.70 : 1.38;
  const CAL_TOP = P ? 1.03 : 0.91;

  function calPosition(i) {
    return [
      CX + (i % 3 - 1) * CAL_DX,
      CAL_TOP - Math.floor(i / 3) * CAL_DY,
      0
    ];
  }

  function calCardBase(i) {
    const [x, y] = calPosition(i);

    const frame = rounded(
      x, y,
      CAL_CARD_W, CAL_CARD_H,
      VIOLET, C.card, 0.96, 1.6, 0.11
    );

    const label = text(
      CAL[i].id,
      17, VIOLET,
      x - 0.82,
      y + CAL_CARD_H / 2 - 0.21,
      true
    );

    const icon = pumpIcon(
      x + 0.55,
      y + CAL_CARD_H / 2 - 0.27,
      0.48
    );

    const divider = line(
      x - CAL_CARD_W / 2 + 0.12,
      y + 0.05,
      x + CAL_CARD_W / 2 - 0.12,
      y + 0.05,
      C.muted, 1
    );

    return new M.VGroup(
      frame, label, icon, divider
    );
  }

  function calValues(i) {
    const d = CAL[i];
    const [x, y] = calPosition(i);

    return new M.VGroup(
      text(
        `A: ${d.pred} h`,
        18, BLUE,
        x - 0.58,
        y - 0.17,
        true, 0.95
      ),

      text(
        `Actual: ${d.actual} h`,
        17, WHITE,
        x + 0.50,
        y - 0.17,
        true, 1.15
      )
    );
  }

  const calCards = CAL.map((_, i) => calCardBase(i));
  const calLabels = CAL.map((_, i) => calValues(i));

  const calValuesShown = new Set();

  const calGroupLabel = text(
    '9 SEPARATE CALIBRATION PUMPS',
    17, VIOLET,
    CX,
    P ? -3.62 : -2.90,
    true, 6.55
  );

  const trainingNote = text(
    'Not used for training or final evaluation',
    16, GREEN,
    CX,
    P ? -4.05 : -3.30,
    false, 6.60
  );

  function revealCalValues(ids) {
    return ids.flatMap(i => {
      if (calValuesShown.has(i)) return [];

      calValuesShown.add(i);

      return [new M.FadeIn(calLabels[i])];
    });
  }

  function removeCalCards() {
    return [
      ...fadeOut(calCards),
      ...fadeOut(
        [...calValuesShown].map(i => calLabels[i])
      ),
      new M.FadeOut(calGroupLabel),
      new M.FadeOut(trainingNote)
    ];
  }

  let calHighlight = null;

  function highlightCal(i) {
    const [x, y] = calPosition(i);

    const target = rounded(
      x, y,
      CAL_CARD_W + 0.09,
      CAL_CARD_H + 0.08,
      AMBER, AMBER, 0, 2.8, 0.12
    );

    if (calHighlight) {
      return [
        new M.Transform(calHighlight, target)
      ];
    }

    calHighlight = target;

    return [new M.Create(calHighlight)];
  }

  function clearCalHighlight() {
    if (!calHighlight) return [];

    const old = calHighlight;
    calHighlight = null;

    return [new M.FadeOut(old)];
  }

  // ============================================================
  // 4–6: INTRODUCE THE SEPARATE CALIBRATION SET
  // ============================================================

  await until(S(4));
  await play(
    ...clear(
      'intro',
      'intro-band',
      'intro-width'
    ),
    ...clearBox(),
    lag(fadeIn(calCards), 1.3, 0.11),
    new M.FadeIn(calGroupLabel),
    ...say('NINE OTHER PUMPS WITH KNOWN OUTCOMES')
  );

  await until(S(5));
  await play(
    new M.FadeIn(trainingNote),
    ...fbox([
      ['separate calibration data', VIOLET],
      'not used to train Tool A',
      'not the evaluation pumps'
    ], VIOLET),
    ...say('NONE OF THESE NINE PUMPS WAS USED FOR TRAINING', GREEN)
  );

  await until(S(6));
  await play(
    lag(
      revealCalValues(CAL.map((_, i) => i)),
      1.8,
      0.10
    ),
    ...fbox([
      ['blue = Tool A prediction', BLUE],
      ['white = actual hours', WHITE]
    ]),
    ...say('EACH CARD HAS PREDICTED AND ACTUAL HOURS')
  );

  // ============================================================
  // CALIBRATION DISTANCE BARS
  //
  // Short horizontal number lines show the actual distance
  // between the predicted and recorded hours.
  //
  // All distance bars use the same physical scale:
  // one hour = 0.22 scene units.
  // ============================================================

  const ERROR_UNIT = 0.22;

  function calGap(i) {
    const d = CAL[i];
    const [x, y] = calPosition(i);

    const width = ERROR_UNIT * d.error;

    const barY = y - CAL_CARD_H / 2 + 0.19;

    const objects = [];

    if (d.error === 0) {
      objects.push(
        circle(
          x - 0.52,
          barY,
          0.043,
          VIOLET,
          1,
          1.4
        )
      );
    } else {
      objects.push(
        rect(
          x - 0.74 + width / 2,
          barY,
          width,
          0.10,
          VIOLET,
          0.85,
          1.3
        )
      );
    }

    objects.push(
      text(
        `${d.error} h`,
        P ? 17 : 15, VIOLET,
        x + 0.75,
        barY,
        true, 0.62
      )
    );

    return new M.VGroup(...objects);
  }

  const calGaps = CAL.map((_, i) => calGap(i));

  const gapsShown = new Set();

  function revealGaps(ids) {
    return ids.flatMap(i => {
      if (gapsShown.has(i)) return [];

      gapsShown.add(i);

      return [new M.FadeIn(calGaps[i])];
    });
  }

  function hideCalibrationGrid() {
    return [
      ...clearCalHighlight(),
      ...removeCalCards(),
      ...fadeOut(
        [...gapsShown].map(i => calGaps[i])
      )
    ];
  }

  // ============================================================
  // 7–8: FIRST CALIBRATION PUMP
  //
  // Predicted 10 hours.
  // Actual 10 hours.
  // Absolute error = 0.
  // ============================================================

  await until(S(7));
  await play(
    ...highlightCal(0),
    ...fbox([
      ['C1 prediction = 10 h', BLUE],
      ['C1 actual = 10 h', WHITE]
    ]),
    ...say('FIRST PUMP: TEN PREDICTED, TEN ACTUAL')
  );

  await until(S(8));
  await play(
    ...revealGaps([0]),
    ...fbox([
      '|10 − 10|',
      ['= 0 hours', VIOLET]
    ], VIOLET),
    ...say('EXACT MATCH: ZERO ERROR', GREEN)
  );

  // ============================================================
  // 9–10: SECOND CALIBRATION PUMP
  //
  // Predicted 11 hours.
  // Actual 12 hours.
  // Absolute error = 1 hour.
  // ============================================================

  await until(S(9));
  await play(
    ...highlightCal(1),
    ...fbox([
      ['C2 prediction = 11 h', BLUE],
      ['C2 actual = 12 h', WHITE]
    ]),
    ...say('SECOND PUMP: ELEVEN PREDICTED, TWELVE ACTUAL')
  );

  await until(S(10));
  await play(
    ...revealGaps([1]),
    ...fbox([
      ['distance between the numbers', VIOLET],
      '|11 − 12|',
      ['= 1 hour', VIOLET]
    ], VIOLET),
    ...say('ABSOLUTE ERROR = ONE HOUR', VIOLET)
  );

  // ============================================================
  // 11–12: THIRD CALIBRATION PUMP
  //
  // Predicted 16 hours.
  // Actual 14 hours.
  // Absolute error = 2 hours.
  // ============================================================

  await until(S(11));
  await play(
    ...highlightCal(2),
    ...fbox([
      ['C3 prediction = 16 h', BLUE],
      ['C3 actual = 14 h', WHITE]
    ]),
    ...say('THIRD PUMP: SIXTEEN PREDICTED, FOURTEEN ACTUAL')
  );

  await until(S(12));
  await play(
    ...revealGaps([2]),
    ...fbox([
      '|16 − 14|',
      ['= 2 hours', VIOLET]
    ], VIOLET),
    ...say('ABSOLUTE ERROR = TWO HOURS', VIOLET)
  );

  // ============================================================
  // 13–14: ALL NINE ABSOLUTE ERRORS
  // ============================================================

  await until(S(13));
  await play(
    ...clearCalHighlight(),
    lag(
      revealGaps([3, 4, 5, 6, 7, 8]),
      2.1, 0.15
    ),
    ...fbox([
      ['absolute error', VIOLET],
      'distance between prediction',
      'and recorded outcome'
    ], VIOLET),
    ...say('MEASURE ALL NINE DISTANCES', VIOLET)
  );

  // ============================================================
  // ERROR BAR CHART
  //
  // The height of each bar is proportional to the error.
  // Zero errors are represented by small baseline markers.
  // ============================================================

  const BAR_BASE = P ? -3.30 : -2.14;
  const BAR_UNIT = P ? 0.65 : 0.49;
  const BAR_PITCH = 0.65;
  const BAR_W = 0.42;

  const barX = position =>
    CX - 0.25 + (position - 4) * BAR_PITCH;

  function makeErrorBar(d, position) {
    const x = barX(position);

    const h = d.error * BAR_UNIT;

    const shape = d.error === 0
      ? circle(x, BAR_BASE + 0.035, 0.047, VIOLET, 1, 1.5)
      : rect(
          x,
          BAR_BASE + h / 2,
          BAR_W,
          h,
          VIOLET,
          0.70,
          1.8
        );

    const value = text(
      String(d.error),
      19, VIOLET,
      x,
      BAR_BASE + h + 0.23,
      true
    );

    const id = text(
      d.id,
      14, WHITE,
      x,
      BAR_BASE - 0.23,
      true, 0.54
    );

    return new M.VGroup(shape, value, id);
  }

  const barFloor = line(
    barX(0) - 0.34,
    BAR_BASE,
    barX(8) + 0.34,
    BAR_BASE,
    C.muted, 2
  );

  function chartScale() {
    return [0, 2, 4, 6].flatMap(v => {
      const y = BAR_BASE + v * BAR_UNIT;

      return [
        text(
          String(v),
          13, C.muted,
          barX(0) - 0.53,
          y,
          true
        ),

        line(
          barX(0) - 0.30, y,
          barX(8) + 0.30, y,
          C.muted, 0.65
        )
      ];
    });
  }

  const barsHeading = text(
    'ABSOLUTE ERRORS — HOURS',
    17, VIOLET,
    CX,
    P ? 1.48 : 1.40,
    true, 6.2
  );

  let bars = [];
  let barsDecor = [];

  function showBars(sorted = false) {
    const sequence = sorted ? SORTED : CAL;

    bars = sequence.map((d, position) =>
      makeErrorBar(d, position)
    );

    barsDecor = [
      barFloor,
      ...chartScale(),
      barsHeading
    ];

    return [
      ...fadeIn(barsDecor),
      lag(fadeIn(bars), 1.6, 0.10)
    ];
  }

  function hideBars() {
    const anims = fadeOut([
      ...bars,
      ...barsDecor
    ]);

    bars = [];
    barsDecor = [];

    return anims;
  }

  await until(S(14));
  await play(
    ...hideCalibrationGrid(),
    ...showBars(false),
    ...fbox([
      ['nine errors, in hours', VIOLET],
      '0, 1, 2, 3, 1, 2, 3, 4, 6'
    ], VIOLET),
    ...say('0, 1, 2, 3, 1, 2, 3, 4, 6 HOURS', VIOLET)
  );

  // ============================================================
  // 15–22: FROM PAST ERRORS TO A PREDICTION INTERVAL
  // ============================================================

  const demoY = P ? -0.80 : -0.70;

  const demoAxis = numberLine(
    CX - 2.85,
    CX + 2.85,
    demoY,
    0, 16,
    [0, 4, 8, 12, 16]
  );

  const demoPump = pumpIcon(
    CX,
    P ? 0.88 : 0.80,
    0.95
  );

  const demoPrediction = text(
    'Prediction: 8 hours',
    20, BLUE,
    CX,
    P ? 0.22 : 0.17,
    true
  );

  const demoPredDot = predictedMarker(
    demoAxis.map(8),
    demoY
  );

  const demoPastErrors = text(
    'Past errors help us choose the width',
    17, VIOLET,
    CX,
    P ? -3.05 : -3.00,
    false, 6.45
  );

  await until(S(15));
  await play(
    ...hideBars(),
    ...replace('interval-demo', [
      demoAxis.group,
      demoPump,
      demoPrediction,
      demoPredDot,
      demoPastErrors
    ]),
    ...fbox([
      ['use past prediction mistakes', VIOLET],
      'to decide how much space',
      'to leave around a new prediction'
    ], VIOLET),
    ...say('PAST MISTAKES HELP US CHOOSE A RANGE')
  );

  // These widths are illustrative only.
  // The calibrated value Q has not yet been selected.

  let demoBand = intervalBand(
    demoAxis.map,
    6, 10,
    demoY,
    0.43
  );

  let demoBandLabels = [];

  function symmetricArrows(map, center, halfWidth, y) {
    return new M.VGroup(
      arrow(
        map(center), y,
        map(center - halfWidth), y,
        BLUE, 0.11
      ),

      arrow(
        map(center), y,
        map(center + halfWidth), y,
        BLUE, 0.11
      )
    );
  }

  const demoSymmetry = symmetricArrows(
    demoAxis.map, 8, 2, demoY + 0.36
  );

  await until(S(16));
  await play(
    new M.FadeIn(demoBand),
    ...replace('symmetry', [demoSymmetry]),
    ...say('EXTEND EQUALLY TO BOTH SIDES', BLUE)
  );

  // Illustrative outcome at 10 hours.
  // It is not an observed calibration or evaluation result.

  const demoActual = actualMarker(
    demoAxis.map(10),
    demoY
  );

  const demoActualLabel = text(
    'Possible actual value',
    15, WHITE,
    demoAxis.map(10) + 0.43,
    demoY - 0.90,
    false, 2.65
  );

  const demoActualLeader = line(
    demoAxis.map(10),
    demoY - 0.12,
    demoAxis.map(10) + 0.30,
    demoY - 0.73,
    WHITE, 1.3
  );

  const narrowBand = intervalBand(
    demoAxis.map,
    7, 9,
    demoY,
    0.43
  );

  const narrowLabel = text(
    'Narrow interval: [7, 9]',
    19, BLUE,
    CX,
    demoY - 1.42,
    true, 6.3
  );

  const demoMiss = text(
    'Illustrative value falls outside',
    17, AMBER,
    CX,
    demoY - 1.82,
    false, 6.3
  );

  await until(S(17));
  await play(
    ...clear('symmetry'),
    new M.Transform(demoBand, narrowBand),
    ...replace('demo-outcome', [
      demoActual,
      demoActualLabel,
      demoActualLeader
    ]),
    ...replace('demo-status', [
      narrowLabel,
      demoMiss
    ]),
    ...fbox([
      ['narrower range', BLUE],
      'more precise',
      ['but may miss the actual value', AMBER]
    ], AMBER),
    ...say('A NARROW BAND CAN MISS THE ANSWER', AMBER)
  );

  const widerBand = intervalBand(
    demoAxis.map,
    5, 11,
    demoY,
    0.43
  );

  const wideLabel = text(
    'Wider interval: [5, 11]',
    19, BLUE,
    CX,
    demoY - 1.42,
    true, 6.3
  );

  const demoHit = text(
    'Illustrative value falls inside',
    17, GREEN,
    CX,
    demoY - 1.82,
    false, 6.3
  );

  await until(S(18));
  await play(
    new M.Transform(demoBand, widerBand),
    ...replace('demo-status', [
      wideLabel,
      demoHit
    ]),
    ...fbox([
      ['wider range', BLUE],
      'more room for the actual value',
      ['but less precise', AMBER]
    ]),
    ...say('A WIDER BAND GIVES THE ANSWER MORE ROOM', BLUE)
  );

  await until(S(19));
  await play(
    new M.Indicate(demoBand, { color: BLUE }),
    ...fbox([
      ['PREDICTION INTERVAL', VIOLET],
      'a range around a prediction'
    ], VIOLET),
    ...say('THIS RANGE IS A PREDICTION INTERVAL', VIOLET)
  );

  await until(S(20));
  await play(
    ...fbox([
      ['CONFORMAL PREDICTION', VIOLET],
      'use past prediction errors',
      'to build intervals with',
      'a chosen coverage level'
    ], VIOLET),
    ...say('PAST ERRORS → CONFORMAL PREDICTION INTERVALS', VIOLET)
  );

  // ============================================================
  // COVERAGE ILLUSTRATION
  //
  // A symbolic set of ten intervals.
  // Eight contain their corresponding actual value.
  //
  // This is an illustration of the definition of coverage,
  // not a measured result or a promise about every ten pumps.
  // ============================================================

  function coverageTile(i, inside, x, y, s = 1) {
    const frame = rounded(
      x, y,
      1.14 * s,
      0.85 * s,
      C.muted,
      C.card,
      0.92,
      1.4,
      0.08
    );

    const map = v =>
      x - 0.43 * s + v * 0.86 * s;

    const band = intervalBand(
      map,
      0.25, 0.70,
      y + 0.08 * s,
      0.20 * s
    );

    const pred = predictedMarker(
      map(0.475),
      y + 0.08 * s,
      0.045 * s
    );

    const actual = actualMarker(
      map(inside ? 0.51 : 0.92),
      y + 0.08 * s,
      0.039 * s
    );

    const status = inside
      ? coverageCheck(x, y - 0.25 * s, 0.64 * s)
      : coverageCross(x, y - 0.25 * s, 0.64 * s);

    return new M.VGroup(
      frame,
      band,
      pred,
      actual,
      status
    );
  }

  const coverageIllustration = Array.from(
    { length: 10 },
    (_, i) => {
      const x = CX + (i % 5 - 2) * 1.27;
      const y = (P ? 0.53 : 0.48) -
        Math.floor(i / 5) * 1.19;

      return coverageTile(
        i,
        ![3, 8].includes(i),
        x,
        y,
        1
      );
    }
  );

  const illustrationHeading = text(
    'ILLUSTRATION OF COVERAGE',
    17, WHITE,
    CX,
    P ? 1.43 : 1.33,
    true, 6.35
  );

  const coverageIllustrationCount = text(
    '8 inside out of 10 = 80%',
    26, GREEN,
    CX,
    P ? -2.06 : -1.92,
    true, 6.3
  );

  const illustrationNote = text(
    'Example only — actual groups may differ',
    14, C.muted,
    CX,
    P ? -2.58 : -2.42,
    false, 6.3
  );

  await until(S(21));
  await play(
    ...clear(
      'interval-demo',
      'demo-outcome',
      'demo-status'
    ),
    new M.FadeOut(demoBand),
    new M.FadeIn(illustrationHeading),
    lag(
      fadeIn(coverageIllustration),
      1.5, 0.10
    ),
    new M.FadeIn(illustrationNote),
    ...fbox([
      ['coverage', VIOLET],
      'share of actual outcomes',
      'inside their prediction intervals'
    ], VIOLET),
    ...say('COVERAGE = THE SHARE THAT FALL INSIDE')
  );

  await until(S(22));
  await play(
    new M.FadeIn(coverageIllustrationCount),
    ...fbox([
      ['desired coverage = 80%', GREEN],
      'at least eight in ten',
      'across comparable repetitions'
    ], GREEN),
    ...say('CHOOSE A TARGET OF AT LEAST 80% COVERAGE', GREEN)
  );

  // ============================================================
  // 23–24: SORT THE NINE CALIBRATION ERRORS
  //
  // Display original order and animate each bar to its new
  // sorted position.
  //
  // Equal errors retain their original relative order for
  // a stable visual sort; this is not a statistical assumption.
  // ============================================================

  await until(S(23));
  await play(
    ...fadeOut([
      ...coverageIllustration,
      illustrationHeading,
      coverageIllustrationCount,
      illustrationNote
    ]),
    ...showBars(false),
    ...fbox([
      ['sort the calibration errors', VIOLET],
      'smallest to largest'
    ], VIOLET),
    ...say('ARRANGE THE NINE ERRORS FROM SMALL TO LARGE', VIOLET)
  );

  const originalBars = [...bars];

  const sortedBarMoves = CAL.map((d, originalPosition) => {
    const sortedPosition = SORTED.findIndex(
      item => item.index === d.index
    );

    return new M.Transform(
      originalBars[originalPosition],
      makeErrorBar(d, sortedPosition)
    );
  });

  await until(S(24));
  await play(
    lag(sortedBarMoves, 1.8, 0.06),
    ...fbox([
      ['sorted errors', VIOLET],
      '0, 1, 1, 2, 2, 3, 3, 4, 6'
    ], VIOLET),
    ...say('0, 1, 1, 2, 2, 3, 3, 4, 6', VIOLET)
  );

  // Keep references in sorted order without creating a new
  // group from existing visible objects.

  bars = SORTED.map(d => originalBars[d.index]);

  // ============================================================
  // 25–26: THE EXTRA, UNKNOWN ERROR
  //
  // The unknown error is displayed beside the known bars.
  // Its location beside the chart does not mean it has rank 10.
  // ============================================================

  const unknownX = CX + 3.05;

  const unknownCardY = P ? -1.05 : -0.58;

  const unknownCard = new M.VGroup(
    rounded(
      unknownX,
      unknownCardY,
      0.84,
      1.20,
      AMBER,
      C.card,
      0.96,
      2.1,
      0.10
    ),

    text(
      'NEW',
      14, AMBER,
      unknownX,
      unknownCardY + 0.40,
      true, 0.70
    ),

    pumpIcon(
      unknownX,
      unknownCardY + 0.06,
      0.36
    ),

    text(
      '?',
      24, WHITE,
      unknownX,
      unknownCardY - 0.34,
      true
    )
  );

  const extraLabel = text(
    'Unknown error',
    14, AMBER,
    CX,
    BAR_BASE - (P ? 0.78 : 0.63),
    false, 5.9
  );

  await until(S(25));
  await play(
    ...replace('unknown-error', [
      unknownCard,
      extraLabel
    ]),
    ...fbox([
      ['one new pump', AMBER],
      'its prediction error',
      'is not known yet'
    ], AMBER),
    ...say('LEAVE ONE EXTRA CARD FOR THE NEXT ERROR', AMBER)
  );

  await until(S(26));
  await play(
    ...indicate([unknownCard], AMBER),
    ...fbox([
      ['9 known errors', VIOLET],
      ['+ 1 unknown error', AMBER],
      ['= 10 errors altogether', WHITE]
    ]),
    ...say('NINE KNOWN PLUS ONE UNKNOWN: TEN CARDS')
  );

  // ============================================================
  // 27–30: EXCHANGEABILITY AND THE TEN POSSIBLE RANKS
  //
  // Under exchangeability, without ties, the new error's
  // rank is uniformly distributed over 1,...,10.
  //
  // With ties, the rank argument can be expressed using
  // random tie-breaking. The ordinary inclusive interval
  // based on the eighth calibration error retains the
  // at-least-80% marginal coverage guarantee.
  //
  // Do not treat the illustrated positions as ten new
  // observed errors.
  // ============================================================

  const RANK_Y = P ? -0.78 : -0.53;
  const RANK_PITCH = 0.62;
  const RANK_W = 0.52;
  const RANK_H = P ? 1.32 : 1.12;

  const rankX = k =>
    CX + (k - 4.5) * RANK_PITCH;

  function rankTile(k, color = C.muted, filled = false) {
    const x = rankX(k);

    return new M.VGroup(
      rounded(
        x,
        RANK_Y,
        RANK_W,
        RANK_H,
        color,
        filled ? color : C.card,
        filled ? 0.23 : 0.94,
        1.8,
        0.06
      ),

      text(
        String(k + 1),
        17,
        filled ? GREEN : WHITE,
        x,
        RANK_Y - RANK_H / 2 + 0.21,
        true,
        0.44
      )
    );
  }

  const rankTiles = Array.from(
    { length: 10 },
    (_, i) => rankTile(i)
  );

  const rankHeading = text(
    'TEN POSSIBLE SORTED POSITIONS',
    18, WHITE,
    CX,
    P ? 1.25 : 1.12,
    true, 6.35
  );

  const orderLabel = text(
    'Smallest error                         Largest error',
    14, C.muted,
    CX,
    RANK_Y - RANK_H / 2 - 0.35,
    false, 6.3
  );

  const comparableIcons = Array.from(
    { length: 4 },
    (_, i) => pumpIcon(
      CX + (i - 1.5) * 1.0,
      P ? 0.43 : 0.35,
      0.55
    )
  );

  const comparableLabel = text(
    'Comparable prediction setting',
    17, GREEN,
    CX,
    P ? -2.34 : -2.04,
    false, 6.4
  );

  await until(S(27));
  await play(
    ...hideBars(),
    ...clear('unknown-error'),
    ...replace('rank-picture', [
      rankHeading,
      ...rankTiles,
      orderLabel,
      ...comparableIcons,
      comparableLabel
    ]),
    ...fbox([
      ['comparable pumps', GREEN],
      'the ordering carries',
      'no special information'
    ], GREEN),
    ...say('COMPARABLE PUMPS · NO SPECIAL ORDER INFORMATION')
  );

  const exchangeabilityTag = pill(
    'EXCHANGEABILITY',
    VIOLET,
    19
  );

  exchangeabilityTag.moveTo([
    CX,
    P ? -3.03 : -2.55,
    0
  ]);

  await until(S(28));
  await play(
    ...replace('exchangeability-name', [
      exchangeabilityTag
    ]),
    ...fbox([
      ['EXCHANGEABILITY', VIOLET],
      'calibration and new cases',
      'share the same prediction setting',
      'without informative ordering'
    ], VIOLET),
    ...say('THIS CONDITION IS CALLED EXCHANGEABILITY', VIOLET)
  );

  // Show every possible rank with equal probability 1/10.
  // The repeated question marks represent alternative
  // locations of the SAME new error, not ten unknown errors.

  const rankPossibilities = Array.from(
    { length: 10 },
    (_, i) => new M.VGroup(
      text(
        '?',
        22, AMBER,
        rankX(i),
        RANK_Y + 0.19,
        true, 0.40
      ),

      text(
        '10%',
        13, WHITE,
        rankX(i),
        RANK_Y + RANK_H / 2 + 0.23,
        true, 0.51
      )
    )
  );

  const noTiesNote = text(
    'No ties: each rank is equally likely',
    16, WHITE,
    CX,
    P ? -2.33 : -2.03,
    false, 6.35
  );

  await until(S(29));
  await play(
    new M.FadeOut(comparableLabel),
    ...fadeOut(comparableIcons),
    ...replace('possible-ranks', rankPossibilities),
    ...replace('rank-note', [noTiesNote]),
    ...fbox([
      ['without tied errors', WHITE],
      '10 possible ranks',
      ['chance of each rank = 1/10', AMBER]
    ], AMBER),
    ...say('WITHOUT TIES, EACH SORTED POSITION IS EQUALLY LIKELY')
  );

  // Highlight the first eight rank positions.
  // The ninth and tenth remain visibly outside the target set.

  const targetRankFrames = Array.from(
    { length: RANK },
    (_, i) => rounded(
      rankX(i),
      RANK_Y,
      RANK_W + 0.035,
      RANK_H + 0.04,
      GREEN,
      GREEN,
      0.10,
      2.3,
      0.06
    )
  );

  const targetSpan = new M.VGroup(
    line(
      rankX(0) - RANK_W / 2,
      RANK_Y - RANK_H / 2 - 0.65,
      rankX(7) + RANK_W / 2,
      RANK_Y - RANK_H / 2 - 0.65,
      GREEN, 2.5
    ),

    line(
      rankX(0) - RANK_W / 2,
      RANK_Y - RANK_H / 2 - 0.65,
      rankX(0) - RANK_W / 2,
      RANK_Y - RANK_H / 2 - 0.49,
      GREEN, 2.5
    ),

    line(
      rankX(7) + RANK_W / 2,
      RANK_Y - RANK_H / 2 - 0.65,
      rankX(7) + RANK_W / 2,
      RANK_Y - RANK_H / 2 - 0.49,
      GREEN, 2.5
    )
  );

  const eightOfTen = text(
    '8 / 10 = 80%',
    24, GREEN,
    (rankX(0) + rankX(7)) / 2,
    RANK_Y - RANK_H / 2 - 1.00,
    true, 4.9
  );

  await until(S(30));
  await play(
    ...clear('rank-note', 'exchangeability-name'),
    lag(
      targetRankFrames.map(o => new M.Create(o)),
      1.6, 0.11
    ),
    new M.FadeIn(targetSpan),
    new M.FadeIn(eightOfTen),
    ...fbox([
      ['target coverage = 80%', GREEN],
      '10 × 0.8 = 8',
      ['allow the first eight ranks', GREEN]
    ], GREEN),
    ...say('COVER THE FIRST EIGHT OF THE TEN POSITIONS', GREEN)
  );

  // ============================================================
  // 31–34: CHOOSE THE EIGHTH CALIBRATION ERROR
  // ============================================================

  const sortedPositions = Array.from(
    { length: N },
    (_, i) => text(
      String(i + 1),
      14, AMBER,
      barX(i),
      BAR_BASE - (P ? 0.65 : 0.61),
      true, 0.52
    )
  );

  const rankRowCaption = text(
    'Sorted position',
    14, AMBER,
    CX,
    BAR_BASE - (P ? 1.03 : 0.88),
    false, 5.5
  );

  // Remove only objects still visible from the rank scene.
  // comparableIcons and comparableLabel were removed in beat 29.

  await until(S(31));

  slots.set('rank-picture', [
    rankHeading,
    ...rankTiles,
    orderLabel
  ]);

  await play(
    ...clear(
      'rank-picture',
      'possible-ranks'
    ),
    ...fadeOut([
      ...targetRankFrames,
      targetSpan,
      eightOfTen
    ]),
    ...showBars(true),
    ...fadeIn(sortedPositions),
    new M.FadeIn(rankRowCaption),
    ...fbox([
      ['use the known calibration errors', VIOLET],
      ['choose sorted position 8', AMBER]
    ], VIOLET),
    ...say('CHOOSE THE EIGHTH SMALLEST KNOWN ERROR', VIOLET)
  );

  const countIndicators = Array.from(
    { length: RANK },
    (_, i) => circle(
      barX(i),
      BAR_BASE - (P ? 0.65 : 0.61),
      0.18,
      GREEN,
      0,
      2.0
    )
  );

  await until(S(32));
  await play(
    lag(
      countIndicators.map(o => new M.Create(o)),
      2.0,
      0.15
    ),
    ...say('COUNT: 1, 2, 3, 4, 5, 6, 7, 8', GREEN)
  );

  const selectedError = SORTED[RANK - 1];

  const selectedBarX = barX(RANK - 1);

  const selectedOutline = rounded(
    selectedBarX,
    BAR_BASE + selectedError.error * BAR_UNIT / 2,
    BAR_W + 0.18,
    selectedError.error * BAR_UNIT + 0.16,
    GREEN,
    GREEN,
    0,
    3.0,
    0.07
  );

  const fourHourTag = pill(
    '4 HOURS',
    GREEN,
    17
  );

  fourHourTag.moveTo([
    selectedBarX,
    BAR_BASE + selectedError.error * BAR_UNIT + 0.66,
    0
  ]);

  await until(S(33));
  await play(
    ...fadeOut(countIndicators.slice(0, 7)),
    new M.Create(selectedOutline),
    new M.FadeIn(fourHourTag),
    new M.Indicate(bars[RANK - 1], { color: GREEN }),
    ...fbox([
      ['eighth smallest error', AMBER],
      ['= 4 hours', GREEN]
    ], GREEN),
    ...say('THE EIGHTH BAR MEASURES FOUR HOURS', GREEN)
  );

  // Keep the selected half-width visible as a separate
  // numerical result after the calibration chart disappears.

  const allowanceY = P ? -0.60 : -0.45;

  const allowanceAxis = numberLine(
    CX - 2.80,
    CX + 2.80,
    allowanceY,
    0, 16,
    [0, 4, 8, 12, 16]
  );

  const allowanceBand = intervalBand(
    allowanceAxis.map,
    4, 12,
    allowanceY,
    0.45
  );

  const allowancePred = predictedMarker(
    allowanceAxis.map(8),
    allowanceY
  );

  const allowanceArrows = symmetricArrows(
    allowanceAxis.map,
    8,
    Q,
    allowanceY + 0.42
  );

  const allowanceLabels = [
    text(
      '−4 h',
      21, BLUE,
      allowanceAxis.map(6),
      allowanceY + 0.78,
      true
    ),

    text(
      '+4 h',
      21, BLUE,
      allowanceAxis.map(10),
      allowanceY + 0.78,
      true
    ),

    text(
      'Prediction',
      17, BLUE,
      allowanceAxis.map(8),
      allowanceY - 0.90,
      false
    )
  ];

  const allowanceCaption = text(
    'Four hours on each side',
    23, GREEN,
    CX,
    P ? -2.55 : -2.12,
    false, 6.3
  );

  await until(S(34));
  await play(
    ...hideBars(),
    ...fadeOut([
      ...sortedPositions,
      rankRowCaption,
      countIndicators[7],
      selectedOutline,
      fourHourTag
    ]),
    ...replace('allowance-picture', [
      allowanceAxis.group,
      allowanceBand,
      allowancePred,
      allowanceArrows,
      ...allowanceLabels,
      allowanceCaption
    ]),
    ...fbox([
      ['selected error = 4 hours', GREEN],
      ['lower: prediction − 4', BLUE],
      ['upper: prediction + 4', BLUE]
    ], GREEN),
    ...say('ALLOW FOUR HOURS ON EITHER SIDE', GREEN)
  );

  // ============================================================
  // EVALUATION PUMP WORKED EXAMPLES
  //
  // The calibration error Q is fixed BEFORE examining
  // outcomes from the twelve evaluation pumps.
  //
  // The same Q is used for every evaluation pump.
  // ============================================================

  const EXAMPLE_AXIS_Y = P ? -0.69 : -0.59;

  const exampleAxis = numberLine(
    CX - 2.95,
    CX + 2.95,
    EXAMPLE_AXIS_Y,
    0, 36,
    [0, 6, 12, 18, 24, 30, 36]
  );

  const EX_CARD_Y = P ? 0.98 : 1.02;

  function evaluationCard(d) {
    return new M.VGroup(
      rounded(
        CX,
        EX_CARD_Y,
        2.60,
        1.12,
        BLUE,
        C.card,
        0.96,
        2.0,
        0.12
      ),

      text(
        d.id,
        22, WHITE,
        CX - 0.73,
        EX_CARD_Y + 0.24,
        true
      ),

      pumpIcon(
        CX + 0.43,
        EX_CARD_Y,
        0.76
      ),

      text(
        'Evaluation pump',
        15, BLUE,
        CX - 0.53,
        EX_CARD_Y - 0.27,
        false, 1.35
      )
    );
  }

  function predictionForExample(d) {
    const x = exampleAxis.map(d.a);

    return [
      predictedMarker(x, EXAMPLE_AXIS_Y),

      text(
        `${d.a} h`,
        20, BLUE,
        x,
        EXAMPLE_AXIS_Y + 0.44,
        true, 1.05
      )
    ];
  }

  function exampleEndpoint(value, direction) {
    const x = exampleAxis.map(value);
    const center = direction === 'lower'
      ? exampleAxis.map(value + Q)
      : exampleAxis.map(value - Q);

    return [
      line(
        x,
        EXAMPLE_AXIS_Y - 0.20,
        x,
        EXAMPLE_AXIS_Y + 0.20,
        BLUE, 2.7
      ),

      endpointLabel(
        exampleAxis.map,
        value,
        EXAMPLE_AXIS_Y + 0.44
      ),

      arrow(
        center,
        EXAMPLE_AXIS_Y + 0.78,
        x,
        EXAMPLE_AXIS_Y + 0.78,
        BLUE,
        0.11
      ),

      text(
        direction === 'lower' ? '−4' : '+4',
        17, BLUE,
        (center + x) / 2,
        EXAMPLE_AXIS_Y + 1.02,
        true
      )
    ];
  }

  function exampleActual(d) {
    const x = exampleAxis.map(d.actual);

    const dot = actualMarker(
      x,
      EXAMPLE_AXIS_Y,
      0.082
    );

    const connector = line(
      x,
      EXAMPLE_AXIS_Y - 0.10,
      x,
      EXAMPLE_AXIS_Y - 0.78,
      WHITE, 1.5
    );

    const label = text(
      `Actual: ${d.actual} h`,
      20, WHITE,
      x,
      EXAMPLE_AXIS_Y - 1.00,
      true, 2.1
    );

    const resultY = P ? -2.86 : -2.48;

    const icon = d.covered
      ? coverageCheck(CX - 1.95, resultY, 1.4)
      : coverageCross(CX - 1.95, resultY, 1.4);

    const result = text(
      d.covered
        ? 'INSIDE THE INTERVAL'
        : 'OUTSIDE THE INTERVAL',
      21,
      d.covered ? GREEN : AMBER,
      CX + 0.31,
      resultY,
      true, 4.5
    );

    return [
      dot,
      connector,
      label,
      icon,
      result
    ];
  }

  const P2 = DATA[1];
  const P1 = DATA[0];

  // ============================================================
  // 35–40: PUMP TWO
  //
  // Prediction = 8 hours.
  // Interval = [4, 12].
  // Actual = 8 hours.
  // Covered.
  // ============================================================

  await until(S(35));
  await play(
    ...clear('allowance-picture'),
    ...replace('example-card', [
      evaluationCard(P2)
    ]),
    ...replace('example-axis', [
      exampleAxis.group
    ]),
    ...fbox([
      ['evaluation pump P2', WHITE],
      ['fixed allowance = ±4 h', GREEN]
    ]),
    ...say('RETURN TO PUMP TWO FROM THE EVALUATION GROUP')
  );

  await until(S(36));
  await play(
    ...replace(
      'example-prediction',
      predictionForExample(P2)
    ),
    ...fbox([
      ['Tool A predicts', BLUE],
      ['8 hours remaining', BLUE]
    ], BLUE),
    ...say('P2: PREDICTED HOURS = EIGHT', BLUE)
  );

  await until(S(37));
  await play(
    ...replace(
      'lower-endpoint',
      exampleEndpoint(P2.lower, 'lower')
    ),
    ...fbox([
      ['lower endpoint', BLUE],
      '8 − 4',
      ['= 4 hours', BLUE]
    ], BLUE),
    ...say('SUBTRACT FOUR: LOWER END = FOUR HOURS', BLUE)
  );

  await until(S(38));
  await play(
    ...replace(
      'upper-endpoint',
      exampleEndpoint(P2.upper, 'upper')
    ),
    ...fbox([
      ['upper endpoint', BLUE],
      '8 + 4',
      ['= 12 hours', BLUE]
    ], BLUE),
    ...say('ADD FOUR: UPPER END = TWELVE HOURS', BLUE)
  );

  const p2Band = intervalBand(
    exampleAxis.map,
    P2.lower,
    P2.upper,
    EXAMPLE_AXIS_Y,
    0.43
  );

  await until(S(39));
  await play(
    ...replace('worked-band', [p2Band]),
    ...fbox([
      ['prediction interval', VIOLET],
      '[8 − 4, 8 + 4]',
      ['= [4, 12] hours', BLUE]
    ], VIOLET),
    ...say('DRAW THE BAND FROM FOUR TO TWELVE HOURS', BLUE)
  );

  await until(S(40));
  await play(
    ...replace(
      'example-outcome',
      exampleActual(P2)
    ),
    ...fbox([
      ['actual hours = 8', WHITE],
      '4 ≤ 8 ≤ 12',
      ['actual value is inside', GREEN]
    ], GREEN),
    ...say('P2 LASTED EIGHT HOURS — INSIDE THE INTERVAL', GREEN)
  );

  // ============================================================
  // 41–43: PUMP ONE
  //
  // Prediction = 18 hours.
  // Interval = [14, 22].
  // Actual = 12 hours.
  // Not covered.
  // ============================================================

  await until(S(41));
  await play(
    ...clear(
      'lower-endpoint',
      'upper-endpoint',
      'worked-band',
      'example-outcome'
    ),
    ...replace('example-card', [
      evaluationCard(P1)
    ]),
    ...replace(
      'example-prediction',
      predictionForExample(P1)
    ),
    ...fbox([
      ['evaluation pump P1', WHITE],
      ['Tool A predicts 18 hours', BLUE],
      'same allowance: ±4 hours'
    ], BLUE),
    ...say('P1: PREDICTED HOURS = EIGHTEEN', BLUE)
  );

  const p1Band = intervalBand(
    exampleAxis.map,
    P1.lower,
    P1.upper,
    EXAMPLE_AXIS_Y,
    0.43
  );

  await until(S(42));
  await play(
    ...replace(
      'lower-endpoint',
      exampleEndpoint(P1.lower, 'lower')
    ),
    ...replace(
      'upper-endpoint',
      exampleEndpoint(P1.upper, 'upper')
    ),
    ...replace('worked-band', [p1Band]),
    ...fbox([
      ['lower = 18 − 4 = 14', BLUE],
      ['upper = 18 + 4 = 22', BLUE],
      ['interval = [14, 22]', BLUE]
    ], BLUE),
    ...say('P1 INTERVAL: FOURTEEN TO TWENTY-TWO HOURS', BLUE)
  );

  const p1MissGap = new M.VGroup(
    line(
      exampleAxis.map(P1.actual),
      EXAMPLE_AXIS_Y - 0.38,
      exampleAxis.map(P1.lower),
      EXAMPLE_AXIS_Y - 0.38,
      AMBER, 3
    ),

    text(
      '2 h outside',
      14, AMBER,
      (exampleAxis.map(P1.actual) +
       exampleAxis.map(P1.lower)) / 2,
      EXAMPLE_AXIS_Y - 0.64,
      false, 1.30
    )
  );

  await until(S(43));
  await play(
    ...replace(
      'example-outcome',
      exampleActual(P1)
    ),
    ...replace('example-miss-gap', [
      p1MissGap
    ]),
    ...fbox([
      ['actual hours = 12', WHITE],
      '12 < 14',
      ['actual value is outside', AMBER]
    ], AMBER),
    ...say('P1 LASTED TWELVE HOURS — OUTSIDE THE INTERVAL', AMBER)
  );

  // ============================================================
  // TWELVE-PUMP INTERVAL CHART
  //
  // All rows use one common linear scale from 0 to 36 hours.
  //
  // Blue translucent horizontal band:
  //   prediction interval.
  //
  // Blue central marker:
  //   Tool A prediction.
  //
  // White dot:
  //   recorded actual remaining hours.
  //
  // Check or cross:
  //   whether the actual value falls inside the interval.
  //
  // The width of every interval is exactly eight hours.
  // ============================================================

  const EVAL_X0 = CX - 1.86;
  const EVAL_X1 = CX + 2.72;

  const EVAL_TOP = P ? 1.18 : 1.15;
  const EVAL_PITCH = P ? 0.43 : 0.31;

  const EVAL_AXIS_Y =
    EVAL_TOP - 11 * EVAL_PITCH - 0.32;

  const EVAL_BAND_H = P ? 0.22 : 0.17;

  const EVAL_NAME_X = CX - 2.91;
  const EVAL_STATUS_X = CX + 3.08;

  const evalX = value =>
    EVAL_X0 + value / 36 * (EVAL_X1 - EVAL_X0);

  const evalY = i =>
    EVAL_TOP - i * EVAL_PITCH;

  function smallEvaluationCard(d, i) {
    const y = evalY(i);

    return new M.VGroup(
      rounded(
        EVAL_NAME_X,
        y,
        1.45,
        EVAL_PITCH * 0.82,
        C.muted,
        C.card,
        0.95,
        1.0,
        0.035
      ),

      text(
        d.id,
        P ? 15 : 12,
        WHITE,
        EVAL_NAME_X - 0.39,
        y,
        true, 0.48
      ),

      pumpIcon(
        EVAL_NAME_X + 0.34,
        y - 0.015,
        P ? 0.25 : 0.20
      )
    );
  }

  function evaluationRow(d, i) {
    const y = evalY(i);

    const track = line(
      EVAL_X0,
      y,
      EVAL_X1,
      y,
      C.muted,
      0.7
    );

    const band = intervalBand(
      evalX,
      d.lower,
      d.upper,
      y,
      EVAL_BAND_H
    );

    const prediction = line(
      evalX(d.a),
      y - EVAL_BAND_H * 0.70,
      evalX(d.a),
      y + EVAL_BAND_H * 0.70,
      BLUE,
      2.8
    );

    return new M.VGroup(
      track,
      smallEvaluationCard(d, i),
      band,
      prediction
    );
  }

  function evaluationActual(d, i) {
    const y = evalY(i);

    const dot = actualMarker(
      evalX(d.actual),
      y,
      P ? 0.050 : 0.043
    );

    const status = d.covered
      ? coverageCheck(
          EVAL_STATUS_X,
          y,
          P ? 0.83 : 0.67
        )
      : coverageCross(
          EVAL_STATUS_X,
          y,
          P ? 0.83 : 0.67
        );

    return new M.VGroup(
      dot,
      status
    );
  }

  function evaluationAxes() {
    const grid = [0, 6, 12, 18, 24, 30, 36].map(v =>
      line(
        evalX(v),
        EVAL_AXIS_Y,
        evalX(v),
        EVAL_TOP + 0.17,
        C.muted,
        0.6
      )
    );

    const ticks = [0, 6, 12, 18, 24, 30, 36].flatMap(v => [
      line(
        evalX(v),
        EVAL_AXIS_Y - 0.045,
        evalX(v),
        EVAL_AXIS_Y + 0.045,
        C.muted, 1.3
      ),

      text(
        String(v),
        12, WHITE,
        evalX(v),
        EVAL_AXIS_Y - 0.18,
        true, 0.49
      )
    ]);

    return [
      ...grid,

      line(
        EVAL_X0,
        EVAL_AXIS_Y,
        EVAL_X1,
        EVAL_AXIS_Y,
        C.muted, 2
      ),

      ...ticks,

      text(
        'Hours remaining',
        14, WHITE,
        (EVAL_X0 + EVAL_X1) / 2,
        EVAL_AXIS_Y - 0.43,
        false
      )
    ];
  }

  const evalHeading = text(
    '12 EVALUATION PUMPS',
    17, WHITE,
    CX,
    P ? 1.75 : 1.46,
    true, 6.4
  );

  let evalRows = [];
  let evalOutcomes = [];
  let evalDecor = [];

  function showEvaluation() {
    evalRows = DATA.map(evaluationRow);
    evalOutcomes = DATA.map(evaluationActual);

    evalDecor = [
      ...evaluationAxes(),
      evalHeading
    ];

    const reveals = [
      ...fadeIn(evalDecor),

      lag(
        evalRows.map(o => new M.FadeIn(o)),
        1.45,
        0.08
      ),

      lag(
        evalOutcomes.map(o => new M.FadeIn(o)),
        1.95,
        0.12
      )
    ];

    return reveals;
  }

  function hideEvaluation() {
    const anims = fadeOut([
      ...evalRows,
      ...evalOutcomes,
      ...evalDecor
    ]);

    evalRows = [];
    evalOutcomes = [];
    evalDecor = [];

    return anims;
  }

  // ============================================================
  // 44: DRAW ALL TWELVE INTERVALS AND REVEAL ACTUAL HOURS
  // ============================================================

  await until(S(44));
  await play(
    ...clear(
      'example-card',
      'example-axis',
      'example-prediction',
      'lower-endpoint',
      'upper-endpoint',
      'worked-band',
      'example-outcome',
      'example-miss-gap'
    ),
    ...showEvaluation(),
    ...fbox([
      ['every interval uses ±4 hours', BLUE],
      ['white dot = actual hours', WHITE],
      ['check = inside', GREEN],
      ['cross = outside', AMBER]
    ]),
    ...say('DRAW AND CHECK THE INTERVALS FOR ALL TWELVE PUMPS')
  );

  // ============================================================
  // 45: OBSERVED COVERAGE
  //
  // Eleven covered outcomes.
  // One uncovered outcome: P1.
  //
  // This observed 91.7% must not be confused with the
  // theoretical target of at least 80%.
  // ============================================================

  const missedRowOutline = rounded(
    CX - 0.08,
    evalY(0),
    6.68,
    EVAL_PITCH * 0.92,
    AMBER,
    AMBER,
    0,
    2.1,
    0.055
  );

  const observedCoverageTag = pill(
    '11 / 12 ≈ 91.7%',
    GREEN,
    22
  );

  observedCoverageTag.moveTo([
    P ? 0 : 4.3,
    P ? -4.92 : 1.00,
    0
  ]);

  const observedCoverageNote = text(
    'Observed coverage ≈ 92%',
    17, GREEN,
    P ? 0 : 4.3,
    P ? -5.30 : -1.64,
    false,
    P ? 6.3 : 4.1
  );

  await until(S(45));
  await play(
    new M.Create(missedRowOutline),
    new M.FadeIn(observedCoverageTag),
    new M.FadeIn(observedCoverageNote),

    lag(
      indicate(
        evalOutcomes.filter((_, i) => DATA[i].covered),
        GREEN,
        0.55
      ),
      2.15,
      0.09
    ),

    ...fbox([
      ['covered outcomes = 11', GREEN],
      'total outcomes = 12',
      ['11 / 12 ≈ 91.7%', GREEN],
      'observed coverage ≈ 92%'
    ], GREEN),
    ...say('ELEVEN OUT OF TWELVE: ABOUT 92% OBSERVED COVERAGE', GREEN)
  );

  // ============================================================
  // 46–49: THE TWO FORMULAS
  //
  // Visual demonstration has already established the
  // calibration rank and the symmetric interval.
  //
  // Formula 1:
  // k = ceil((n + 1) × coverage)
  //
  // Formula 2:
  // [prediction − e_(k), prediction + e_(k)]
  //
  // Here k <= n. For more extreme coverage targets that give
  // k = n + 1, the standard finite-sample construction uses
  // an infinite score cutoff rather than silently capping k.
  // This edge case is not introduced on screen.
  // ============================================================

  const FORMULA_X = CX;
  const FORMULA_Y = P ? -0.78 : -0.53;

  const FORMULA_W = 6.50;
  const FORMULA_H = P ? 4.35 : 3.65;

  const formulaFrame = rounded(
    FORMULA_X,
    FORMULA_Y,
    FORMULA_W,
    FORMULA_H,
    VIOLET,
    C.card,
    0.95,
    2,
    0.17
  );

  const formulaHeading = text(
    'TWO FORMULAS',
    22, VIOLET,
    FORMULA_X,
    FORMULA_Y + FORMULA_H / 2 - 0.29,
    true
  );

  const formulaDivider = line(
    FORMULA_X - FORMULA_W / 2 + 0.28,
    FORMULA_Y - 0.18,
    FORMULA_X + FORMULA_W / 2 - 0.28,
    FORMULA_Y - 0.18,
    C.muted,
    1.4
  );

  const formulaOneTitle = text(
    '1. FIND THE ERROR POSITION',
    17, AMBER,
    FORMULA_X,
    FORMULA_Y + 1.05,
    true, FORMULA_W - 0.40
  );

  const formulaTwoTitle = text(
    '2. BUILD THE PREDICTION INTERVAL',
    17, BLUE,
    FORMULA_X,
    FORMULA_Y - 0.50,
    true, FORMULA_W - 0.40
  );

  await until(S(46));
  await play(
    ...hideEvaluation(),
    ...fadeOut([
      missedRowOutline,
      observedCoverageTag,
      observedCoverageNote
    ]),
    ...clearBox(),
    ...replace('formula-frame', [
      formulaFrame,
      formulaHeading,
      formulaDivider,
      formulaOneTitle,
      formulaTwoTitle
    ]),
    ...say('WRITE THE METHOD AS TWO SHORT FORMULAS')
  );

  const rankExpression = text(
    '(number of past errors + 1) × coverage',
    20, WHITE,
    FORMULA_X,
    FORMULA_Y + 0.64,
    true, FORMULA_W - 0.42
  );

  const rankExample = text(
    '(9 + 1) × 0.8 = 8',
    25, AMBER,
    FORMULA_X,
    FORMULA_Y + 0.23,
    true, FORMULA_W - 0.42
  );

  await until(S(47));
  await play(
    ...replace('rank-formula', [
      rankExpression,
      rankExample
    ]),
    ...fbox([
      ['number of past errors = 9', WHITE],
      'add one → 10',
      'multiply by 0.8',
      ['10 × 0.8 = 8', AMBER]
    ], AMBER),
    ...say('ADD ONE TO THE COUNT, THEN MULTIPLY BY COVERAGE')
  );

  // Rounding illustration is separate from the fixed
  // calibration calculation.
  //
  // Example: if the intermediate result were 7.2, the
  // corrected rank would be 8, not 7.

  const roundX = P ? 0 : 4.3;
  const roundY = P ? -3.75 : -1.95;

  const roundExample = new M.VGroup(
    text(
      'Rounding example',
      15, WHITE,
      roundX,
      roundY + 0.43,
      false
    ),

    line(
      roundX - 1.35,
      roundY,
      roundX + 1.35,
      roundY,
      C.muted,
      2
    ),

    text(
      '7',
      17, WHITE,
      roundX - 1.35,
      roundY - 0.24,
      true
    ),

    text(
      '8',
      17, GREEN,
      roundX + 1.35,
      roundY - 0.24,
      true
    ),

    circle(
      roundX - 0.81,
      roundY,
      0.072,
      AMBER,
      1,
      1.7
    ),

    text(
      '7.2',
      16, AMBER,
      roundX - 0.81,
      roundY + 0.21,
      true
    ),

    arrow(
      roundX - 0.69,
      roundY + 0.12,
      roundX + 1.32,
      roundY + 0.12,
      GREEN,
      0.10
    )
  );

  const correctedRank = text(
    'k = round up[(n + 1) × coverage]',
    22, AMBER,
    FORMULA_X,
    FORMULA_Y + 0.64,
    true, FORMULA_W - 0.42
  );

  await until(S(48));
  await play(
    new M.Transform(rankExpression, correctedRank),
    ...replace('rounding-example', [
      roundExample
    ]),
    ...fbox([
      ['round UP, not to nearest', AMBER],
      'example: 7.2 → 8',
      ['here: k = 8 exactly', GREEN]
    ], AMBER),
    ...say('IF NECESSARY, ROUND UP TO THE NEXT WHOLE NUMBER', AMBER)
  );

  const intervalFormula = text(
    '[prediction − selected error, prediction + selected error]',
    20, BLUE,
    FORMULA_X,
    FORMULA_Y - 0.94,
    true, FORMULA_W - 0.45
  );

  const intervalShortFormula = text(
    '[prediction − 4, prediction + 4]',
    23, BLUE,
    FORMULA_X,
    FORMULA_Y - 1.33,
    true, FORMULA_W - 0.45
  );

  await until(S(49));
  await play(
    ...clear('rounding-example'),
    ...replace('interval-formula', [
      intervalFormula,
      intervalShortFormula
    ]),
    ...fbox([
      ['find error at position k', VIOLET],
      ['here: eighth error = 4', GREEN],
      'subtract and add that error',
      ['interval = [prediction − 4, +4]', BLUE]
    ], BLUE),
    ...say('SUBTRACT AND ADD THE SELECTED CALIBRATION ERROR', BLUE)
  );

  // ============================================================
  // 50: PRACTICAL USE
  //
  // A point prediction supplies one number.
  // A prediction interval communicates a range of plausible
  // remaining hours with a chosen coverage target.
  // ============================================================

  const useY = P ? -0.75 : -0.50;

  const useAxis = numberLine(
    CX - 2.87,
    CX + 2.87,
    useY,
    0, 16,
    [0, 4, 8, 12, 16]
  );

  const usePicture = [
    pumpIcon(CX, P ? 0.76 : 0.65, 1.10),

    text(
      'Predicted hours remaining',
      19, WHITE,
      CX,
      P ? 0.12 : 0.03,
      false
    ),

    useAxis.group,

    intervalBand(
      useAxis.map,
      4, 12,
      useY,
      0.44
    ),

    predictedMarker(
      useAxis.map(8),
      useY
    ),

    text(
      '4–12 hours',
      24, BLUE,
      CX,
      useY - 0.94,
      true
    ),

    text(
      'A useful range, not a single deadline',
      17, GREEN,
      CX,
      P ? -2.81 : -2.37,
      false, 6.3
    )
  ];

  await until(S(50));
  await play(
    ...clear(
      'formula-frame',
      'rank-formula',
      'interval-formula'
    ),
    ...replace('practical-use', usePicture),
    ...fbox([
      ['USE CONFORMAL PREDICTION', VIOLET],
      'when a range of outcomes',
      'is more useful than one number'
    ], VIOLET),
    ...say('USE A PREDICTION INTERVAL WHEN YOU NEED A RANGE', VIOLET)
  );

  // ============================================================
  // 51: THE COVERAGE GUARANTEE
  //
  // Explain the guarantee over repeated comparable predictions.
  //
  // This is a marginal finite-sample guarantee under
  // exchangeability of the calibration and new cases.
  //
  // No independence assumption beyond the required
  // exchangeability is introduced here.
  //
  // Without ties, the rank argument gives 8/10.
  // With ties, inclusive intervals retain at least that
  // coverage and may cover more.
  //
  // Do not show invented measured repetition results.
  // ============================================================

  const guaranteeY = P ? -0.60 : -0.40;

  const guaranteeW = 5.90;

  const guaranteeLeft = CX - guaranteeW / 2;

  const guaranteeTrack = rounded(
    CX,
    guaranteeY,
    guaranteeW,
    0.54,
    C.muted,
    C.card,
    0.65,
    1.7,
    0.08
  );

  const guaranteedFill = rect(
    guaranteeLeft + guaranteeW * TARGET / 2,
    guaranteeY,
    guaranteeW * TARGET,
    0.54,
    GREEN,
    0.68,
    1.4
  );

  const guaranteeBoundaryX =
    guaranteeLeft + guaranteeW * TARGET;

  const guaranteeBoundary = line(
    guaranteeBoundaryX,
    guaranteeY - 0.42,
    guaranteeBoundaryX,
    guaranteeY + 0.43,
    WHITE,
    2.8
  );

  const guaranteeScale = [
    text(
      '0%',
      15, WHITE,
      guaranteeLeft,
      guaranteeY - 0.45,
      true
    ),

    text(
      '80%',
      20, GREEN,
      guaranteeBoundaryX,
      guaranteeY - 0.45,
      true
    ),

    text(
      '100%',
      15, WHITE,
      guaranteeLeft + guaranteeW,
      guaranteeY - 0.45,
      true
    )
  ];

  const guaranteeHeading = text(
    'AT LEAST 80% COVERAGE',
    25, GREEN,
    CX,
    guaranteeY + 1.14,
    true, 6.3
  );

  const guaranteeMeaning = text(
    'Under exchangeability',
    19, WHITE,
    CX,
    guaranteeY + 0.65,
    false
  );

  const greaterCoverageArrow = arrow(
    guaranteeBoundaryX + 0.07,
    guaranteeY + 0.68,
    guaranteeLeft + guaranteeW - 0.06,
    guaranteeY + 0.68,
    GREEN,
    0.10
  );

  const tiesNote = text(
    'Tied errors can make coverage higher',
    16, GREEN,
    CX,
    guaranteeY - 1.20,
    false, 6.3
  );

  const repeatedNote = text(
    'Across repeated comparable predictions',
    17, WHITE,
    CX,
    guaranteeY - 1.75,
    false, 6.3
  );

  await until(S(51));
  await play(
    ...clear('practical-use'),
    ...replace('guarantee-picture', [
      guaranteeHeading,
      guaranteeMeaning,
      guaranteeTrack,
      guaranteedFill,
      guaranteeBoundary,
      ...guaranteeScale,
      greaterCoverageArrow,
      tiesNote,
      repeatedNote
    ]),
    ...fbox([
      ['coverage ≥ 80%', GREEN],
      'under exchangeability',
      'across repeated predictions',
      'the guarantee survives ties'
    ], GREEN),
    ...say('AT LEAST 80% COVERAGE UNDER EXCHANGEABILITY', GREEN)
  );

  // ============================================================
  // 52: NOT A GUARANTEE FOR EACH PARTICULAR PUMP
  //
  // Return to the actual uncovered P1 example.
  //
  // The method can satisfy its coverage guarantee while
  // some individual prediction intervals miss.
  // ============================================================

  const cautionY = P ? -0.75 : -0.62;

  const cautionAxis = numberLine(
    CX - 2.87,
    CX + 2.87,
    cautionY,
    0, 36,
    [0, 6, 12, 18, 24, 30, 36]
  );

  const individualCaution = [
    evaluationCard(P1),

    cautionAxis.group,

    intervalBand(
      cautionAxis.map,
      P1.lower,
      P1.upper,
      cautionY,
      0.43
    ),

    predictedMarker(
      cautionAxis.map(P1.a),
      cautionY
    ),

    actualMarker(
      cautionAxis.map(P1.actual),
      cautionY
    ),

    text(
      '18 predicted',
      17, BLUE,
      cautionAxis.map(18),
      cautionY + 0.45,
      true, 1.65
    ),

    text(
      '12 actual',
      17, WHITE,
      cautionAxis.map(12),
      cautionY - 0.94,
      true, 1.45
    ),

    text(
      '[14, 22]',
      19, BLUE,
      cautionAxis.map(18),
      cautionY - 1.40,
      true, 2.0
    ),

    coverageCross(
      CX - 2.13,
      P ? -3.07 : -2.63,
      1.15
    ),

    text(
      'This individual outcome was not covered',
      17, AMBER,
      CX + 0.12,
      P ? -3.07 : -2.63,
      false, 4.75
    )
  ];

  await until(S(52));
  await play(
    ...clear('guarantee-picture'),
    ...replace('individual-caution', individualCaution),
    ...fbox([
      ['not a promise for one pump', AMBER],
      'P1 is a real example',
      'some individual outcomes',
      'will fall outside'
    ], AMBER),
    ...say('NOT A GUARANTEE FOR EVERY PARTICULAR PUMP', AMBER)
  );

  // ============================================================
  // 53: CHANGED OPERATING CONDITIONS
  //
  // Illustrate a difference between the calibration setting
  // and a future setting.
  //
  // No new error values or real outcomes are invented.
  //
  // The original calibration error bound of four hours is
  // retained, but its coverage guarantee need not transfer
  // to substantially changed conditions.
  // ============================================================

  const SHIFT_Y = P ? -0.65 : -0.46;

  function operatingPanel(
    x,
    title,
    changed = false
  ) {
    const w = 2.92;
    const h = P ? 3.10 : 2.85;

    const color = changed ? AMBER : VIOLET;

    const frame = rounded(
      x,
      SHIFT_Y,
      w, h,
      color,
      C.card,
      0.95,
      2,
      0.14
    );

    const heading = text(
      title,
      18, color,
      x,
      SHIFT_Y + h / 2 - 0.25,
      true,
      w - 0.22
    );

    const pump = pumpIcon(
      x,
      SHIFT_Y + 0.29,
      1.05
    );

    const pressureGauge = circle(
      x - 0.53,
      SHIFT_Y - 0.62,
      0.26,
      color,
      0,
      2.1
    );

    const angle = changed
      ? Math.PI * 0.16
      : Math.PI * 0.70;

    const needle = line(
      x - 0.53,
      SHIFT_Y - 0.62,
      x - 0.53 + 0.19 * Math.cos(angle),
      SHIFT_Y - 0.62 + 0.19 * Math.sin(angle),
      color,
      2.3
    );

    const temperature = new M.VGroup(
      rounded(
        x + 0.49,
        SHIFT_Y - 0.59,
        0.18,
        0.52,
        color,
        color,
        0.10,
        1.7,
        0.07
      ),

      rect(
        x + 0.49,
        SHIFT_Y - 0.75 + (changed ? 0.14 : 0.05),
        0.08,
        changed ? 0.33 : 0.15,
        color,
        0.87,
        1
      ),

      circle(
        x + 0.49,
        SHIFT_Y - 0.86,
        0.13,
        color,
        0.70,
        1.5
      )
    );

    const footer = text(
      changed
        ? 'Different conditions'
        : 'Original conditions',
      15, color,
      x,
      SHIFT_Y - h / 2 + 0.24,
      false,
      w - 0.22
    );

    return new M.VGroup(
      frame,
      heading,
      pump,
      pressureGauge,
      needle,
      temperature,
      footer
    );
  }

  const calibrationSetting = operatingPanel(
    CX - 1.69,
    'CALIBRATION',
    false
  );

  const futureSetting = operatingPanel(
    CX + 1.69,
    'FUTURE PUMPS',
    true
  );

  const changeArrow = arrow(
    CX - 0.24,
    SHIFT_Y,
    CX + 0.24,
    SHIFT_Y,
    AMBER,
    0.10
  );

  const shiftWarning = text(
    'The old error allowance may no longer be suitable',
    17, AMBER,
    CX,
    P ? -2.75 : -2.31,
    false, 6.4
  );

  await until(S(53));
  await play(
    ...clear('individual-caution'),
    ...replace('changed-setting', [
      calibrationSetting,
      futureSetting,
      changeArrow,
      shiftWarning
    ]),
    ...fbox([
      ['changed operating conditions', AMBER],
      'exchangeability may fail',
      ['coverage guarantee may not hold', AMBER],
      'use comparable calibration cases'
    ], AMBER),
    ...say('DIFFERENT CONDITIONS CAN INVALIDATE THE GUARANTEE', AMBER)
  );

  // ============================================================
  // 54: FINAL RECAP
  //
  // Three stages:
  //
  // 1. Measure and sort separate calibration errors.
  // 2. Select the corrected rank for the desired coverage.
  // 3. Construct symmetric prediction intervals.
  //
  // Keep observed coverage distinct from target coverage.
  // ============================================================

  const RECAP_W = 6.52;

  const RECAP_Y = P
    ? [1.10, -0.85, -2.82]
    : [0.94, -0.46, -1.86];

  const RECAP_H = P ? 1.64 : 1.18;

  function recapFrame(y, color) {
    return rounded(
      CX,
      y,
      RECAP_W,
      RECAP_H,
      color,
      C.card,
      0.95,
      1.8,
      0.12
    );
  }

  // Stage 1: sorted error bars, still proportional to error.
  // Use a common miniature scale for every calibration bar.

  const recapBarsBase =
    RECAP_Y[0] - RECAP_H / 2 + 0.25;

  const recapBarX = i =>
    CX - 0.25 + (i - 4) * 0.39;

  const recapBarUnit = P ? 0.13 : 0.09;

  const recapBars = SORTED.flatMap((d, i) => {
    const h = d.error * recapBarUnit;
    const color = i === RANK - 1 ? GREEN : VIOLET;

    const shape = h === 0
      ? circle(
          recapBarX(i),
          recapBarsBase + 0.025,
          0.029,
          color,
          1,
          1
        )
      : rect(
          recapBarX(i),
          recapBarsBase + h / 2,
          0.23,
          h,
          color,
          0.76,
          1.3
        );

    return [
      shape,

      text(
        String(d.error),
        12, color,
        recapBarX(i),
        recapBarsBase - 0.14,
        true, 0.33
      )
    ];
  });

  const recapStage1 = new M.VGroup(
    recapFrame(RECAP_Y[0], VIOLET),

    text(
      '1. SORT PAST ERRORS',
      16, VIOLET,
      CX,
      RECAP_Y[0] + RECAP_H / 2 - 0.20,
      true, 6.20
    ),

    ...recapBars,

    text(
      '9 calibration pumps',
      15, WHITE,
      CX + 2.45,
      RECAP_Y[0] - 0.12,
      false, 1.30
    )
  );

  // Stage 2: select the corrected rank.

  const recapStage2 = new M.VGroup(
    recapFrame(RECAP_Y[1], GREEN),

    text(
      '2. SELECT THE CORRECTED RANK',
      16, GREEN,
      CX,
      RECAP_Y[1] + RECAP_H / 2 - 0.20,
      true, 6.20
    ),

    text(
      'Round up[(9 + 1) × 0.8] = 8',
      20, WHITE,
      CX,
      RECAP_Y[1] + 0.05,
      true, 6.10
    ),

    text(
      'Eighth error = 4 hours',
      19, GREEN,
      CX,
      RECAP_Y[1] - RECAP_H / 2 + 0.20,
      true, 6.10
    )
  );

  // Stage 3: symmetric prediction interval.

  const recapIntervalY = RECAP_Y[2] - 0.07;

  const recapIntervalMap = v =>
    CX + (v - 8) * 0.43;

  const recapStage3 = new M.VGroup(
    recapFrame(RECAP_Y[2], BLUE),

    text(
      '3. BUILD THE INTERVAL',
      16, BLUE,
      CX,
      RECAP_Y[2] + RECAP_H / 2 - 0.20,
      true, 6.20
    ),

    intervalBand(
      recapIntervalMap,
      4, 12,
      recapIntervalY,
      0.24
    ),

    predictedMarker(
      recapIntervalMap(8),
      recapIntervalY,
      0.062
    ),

    text(
      '−4 h',
      15, BLUE,
      recapIntervalMap(4) - 0.55,
      recapIntervalY,
      true, 0.95
    ),

    text(
      '+4 h',
      15, BLUE,
      recapIntervalMap(12) + 0.55,
      recapIntervalY,
      true, 0.95
    ),

    text(
      'Prediction ± 4 hours',
      17, WHITE,
      CX,
      RECAP_Y[2] - RECAP_H / 2 + 0.20,
      true, 6.10
    )
  );

  const recapPhoneNote = text(
    'Target ≥ 80% · Observed 11/12 ≈ 91.7%',
    20, GREEN,
    CX,
    -4.15,
    true, 6.60
  );

  const recapAssumption = text(
    'Coverage guarantee requires exchangeability',
    16, AMBER,
    P ? CX : 4.3,
    P ? -4.74 : -1.79,
    false,
    P ? 6.60 : 4.05
  );

  await until(S(54));
  await play(
    ...clear('changed-setting'),

    lag(
      fadeIn([
        recapStage1,
        recapStage2,
        recapStage3
      ]),
      1.95,
      0.23
    ),

    ...(P
      ? [new M.FadeIn(recapPhoneNote)]
      : []),

    new M.FadeIn(recapAssumption),

    ...fbox([
      ['CONFORMAL PREDICTION', VIOLET],
      'past errors → prediction intervals',
      ['target coverage ≥ 80%', GREEN],
      ['observed: 11/12 ≈ 91.7%', WHITE],
      'requires exchangeability'
    ], VIOLET),

    ...say(
      'PAST MISTAKES BUILD INTERVALS WITH A CHOSEN COVERAGE',
      VIOLET
    )
  );

  // Hold the final picture until the narration finishes.

  await until(E(54));
}
