// lesson 8.1.2
// Random assignment — live animation.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
//
// Exact supplied chapter data:
// Earlier quiz scores: 4, 4, 8, 8.
// Self-selection: both higher scorers choose quiz cards;
// both lower scorers choose the review sheet.
// Starting gap = 8 - 4 = 4 points.
//
// Independent fair coin flips:
// Heads = quiz cards.
// Tails = review sheet.
// Four coins produce 16 equally likely outcomes.
// Each student receives cards in exactly 8 of the 16 outcomes.
// Expected number receiving cards from either score pair = 1.
// The original uneven split, T T H H, has probability 1/16.
//
// Cyan = quiz cards. Pink = review sheet.
// Earlier quiz scores remain distinct from the unobserved later quiz.
// The example coin sequence H T H T is one possible illustration,
// not an additional observed experiment or a guaranteed balanced split.
// Uses the approved engine API; browser playback has not been tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Exact chapter data and shared colours
  // ------------------------------------------------------------

  const SCORES = [4, 4, 8, 8];

  const CARDS = C.cyan;
  const SHEET = C.pink || '#ff619e';
  const EARLIER = C.amber;
  const CHANCE = C.violet;
  const GOLD = '#ffc857';

  const SELF_SELECTED = ['T', 'T', 'H', 'H'];

  // Only the first two flips are specified by the narration.
  // Complete the example with one possible pair of further flips.

  const EXAMPLE_FLIPS = ['H', 'T', 'H', 'T'];

  const OUTCOMES = Array.from(
    { length: 16 },
    (_, i) =>
      Array.from(
        { length: 4 },
        (_, j) =>
          (i & (1 << (3 - j))) === 0 ? 'H' : 'T'
      )
  );

  const CARDS_COUNTS = SCORES.map((_, j) =>
    OUTCOMES.filter(row => row[j] === 'H').length
  );

  const LOW_PAIR_COUNTS = OUTCOMES.map(row =>
    Number(row[0] === 'H') +
    Number(row[1] === 'H')
  );

  const HIGH_PAIR_COUNTS = OUTCOMES.map(row =>
    Number(row[2] === 'H') +
    Number(row[3] === 'H')
  );

  const LOW_TOTAL = LOW_PAIR_COUNTS.reduce(
    (a, b) => a + b,
    0
  );

  const HIGH_TOTAL = HIGH_PAIR_COUNTS.reduce(
    (a, b) => a + b,
    0
  );

  const UNEVEN_ROW = OUTCOMES.findIndex(row =>
    row.every((v, j) => v === SELF_SELECTED[j])
  );

  const CX = P ? 0 : -2.6;

  // Phone: pill under the title, picture in the middle, formula card at the bottom.
  const PILL = P
    ? [0, 3.7, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, -6.1, 0]
    : [4.3, -0.3, 0];

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  const activityColor = side =>
    side === 'H' ? CARDS : SHEET;

  // ------------------------------------------------------------
  // Shared visual helpers
  // ------------------------------------------------------------

  function txt(
    s, size, color, x, y,
    mono = false,
    maxw = null
  ) {
    const t = T(String(s), size, color, mono);

    if (maxw !== null && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);

    return t;
  }

  function line(
    x1, y1, x2, y2,
    color = C.muted,
    sw = 2
  ) {
    return new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: sw
    });
  }

  function dashed(
    x1, y1, x2, y2,
    color = C.muted
  ) {
    return new M.DashedLine({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color
    });
  }

  function rect(
    x, y, w, h,
    color,
    opacity = 0,
    sw = 2
  ) {
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
    color,
    fill = C.card,
    opacity = 0.95
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: Math.min(
        0.16,
        w * 0.08,
        h * 0.08
      ),
      color,
      strokeWidth: 2
    });

    r.setFill(fill, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function circle(
    x, y, radius,
    color,
    opacity = 1,
    sw = 2
  ) {
    const c = new M.Circle({
      radius,
      color,
      strokeWidth: sw
    });

    c.setFill(color, opacity);
    c.moveTo([x, y, 0]);

    return c;
  }

  function glow(
    x, y,
    color = C.cyan,
    radius = 0.12
  ) {
    const halo = new M.Dot({
      point: [x, y, 0],
      radius: radius * 2.25,
      color
    });

    halo.setFill(color, 0.17);

    const dot = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    return new M.VGroup(halo, dot);
  }

  function tag(
    s, color, x, y,
    size = 17,
    maxw = null
  ) {
    const p = pill(s, color, size);

    if (maxw !== null && p.getWidth() > maxw) {
      p.scale(maxw / p.getWidth());
    }

    p.moveTo([x, y, 0]);

    return p;
  }

  function arrow(
    x1, y1, x2, y2,
    color = C.amber,
    tip = 0.13
  ) {
    const a = Math.atan2(y2 - y1, x2 - x1);

    return new M.VGroup(
      line(x1, y1, x2, y2, color, 2.5),

      line(
        x2, y2,
        x2 - tip * Math.cos(a - Math.PI / 5),
        y2 - tip * Math.sin(a - Math.PI / 5),
        color,
        2.5
      ),

      line(
        x2, y2,
        x2 - tip * Math.cos(a + Math.PI / 5),
        y2 - tip * Math.sin(a + Math.PI / 5),
        color,
        2.5
      )
    );
  }

  function doubleArrow(
    x1, y1, x2, y2,
    color = C.amber,
    tip = 0.11
  ) {
    const a = Math.atan2(y2 - y1, x2 - x1);

    return new M.VGroup(
      line(x1, y1, x2, y2, color, 2.5),

      line(
        x2, y2,
        x2 - tip * Math.cos(a - Math.PI / 5),
        y2 - tip * Math.sin(a - Math.PI / 5),
        color,
        2.5
      ),

      line(
        x2, y2,
        x2 - tip * Math.cos(a + Math.PI / 5),
        y2 - tip * Math.sin(a + Math.PI / 5),
        color,
        2.5
      ),

      line(
        x1, y1,
        x1 + tip * Math.cos(a - Math.PI / 5),
        y1 + tip * Math.sin(a - Math.PI / 5),
        color,
        2.5
      ),

      line(
        x1, y1,
        x1 + tip * Math.cos(a + Math.PI / 5),
        y1 + tip * Math.sin(a + Math.PI / 5),
        color,
        2.5
      )
    );
  }

  // ------------------------------------------------------------
  // Top-level visibility tracking
  // ------------------------------------------------------------

  // Never wrap objects already on screen in a fresh VGroup.
  // All visual groups are assembled before they appear.

  const visible = new Set();

  function put(...objects) {
    return objects.filter(Boolean).map(o => {
      visible.add(o);
      return new M.FadeIn(o);
    });
  }

  function draw(...objects) {
    return objects.filter(Boolean).map(o => {
      visible.add(o);
      return new M.Create(o);
    });
  }

  function take(...objects) {
    const animations = [];

    for (const o of objects) {
      if (o && visible.has(o)) {
        visible.delete(o);
        animations.push(new M.FadeOut(o));
      }
    }

    return animations;
  }

  function clearPicture() {
    const animations = Array.from(visible).map(o =>
      new M.FadeOut(o)
    );

    visible.clear();

    return animations;
  }

  function lagIn(
    objects,
    lagRatio = 0.12,
    runTime = 1.4
  ) {
    objects.forEach(o => visible.add(o));

    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      { lagRatio, runTime }
    );
  }

  function replace(oldObject, newObject) {
    return [
      ...take(oldObject),
      ...put(newObject)
    ];
  }

  // ------------------------------------------------------------
  // Formula box — approved reference style
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.36 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) => {
      const indent =
        rows[i][0].length -
        rows[i][0].trimStart().length;

      return t.getWidth() + cw * indent;
    });

    const wd = Math.max(...widths) + 0.70;
    const ht = rows.length * lh + 0.40;

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
    const top = BOXP[1] + ht / 2 - 0.20 - lh / 2;

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

    const maxw = P ? FW - 1.2 : 4.0;
    const maxh = P ? 1.38 : 3.7;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
      g.moveTo(BOXP);
    }

    const animations = [new M.FadeIn(g)];

    if (boxNow) {
      animations.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return animations;
  }

  // ------------------------------------------------------------
  // Classroom icons
  // ------------------------------------------------------------

  function cardsIcon(x, y, scale = 1) {
    const w = 0.92 * scale;
    const h = 1.23 * scale;

    const back = rounded(
      x - 0.19 * scale,
      y + 0.12 * scale,
      w,
      h,
      CARDS,
      C.card,
      1
    );

    const front = rounded(
      x + 0.12 * scale,
      y - 0.05 * scale,
      w,
      h,
      CARDS,
      C.card,
      1
    );

    return new M.VGroup(
      back,
      front,

      txt(
        '?',
        36 * scale,
        CARDS,
        x + 0.12 * scale,
        y + 0.07 * scale,
        true
      ),

      line(
        x - 0.14 * scale,
        y - 0.30 * scale,
        x + 0.38 * scale,
        y - 0.30 * scale,
        CARDS,
        1.7
      )
    );
  }

  function sheetIcon(x, y, scale = 1) {
    const w = 1.05 * scale;
    const h = 1.34 * scale;

    const parts = [
      rounded(
        x, y, w, h,
        SHEET,
        C.card,
        1
      )
    ];

    for (let j = 0; j < 3; j++) {
      const ry = y + 0.38 * scale -
        j * 0.34 * scale;

      parts.push(
        circle(
          x - 0.34 * scale,
          ry,
          0.055 * scale,
          SHEET,
          1,
          1
        ),

        line(
          x - 0.20 * scale,
          ry,
          x + 0.35 * scale,
          ry,
          SHEET,
          1.8
        ),

        line(
          x - 0.20 * scale,
          ry - 0.12 * scale,
          x + 0.20 * scale,
          ry - 0.12 * scale,
          C.muted,
          1.3
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function studentDot(
    i, x, y,
    color = C.ink,
    includeScore = true,
    scale = 1
  ) {
    const parts = [
      glow(
        x,
        y,
        color,
        0.145 * scale
      ),

      txt(
        `S${i + 1}`,
        15 * scale,
        C.ink,
        x + 0.4 * scale,
        y,
        true
      )
    ];

    if (includeScore) {
      parts.push(
        txt(
          SCORES[i],
          24 * scale,
          EARLIER,
          x,
          y + 0.36 * scale,
          true
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function desk(x, y, scale = 1) {
    return new M.VGroup(
      rounded(
        x,
        y,
        1.18 * scale,
        0.25 * scale,
        C.muted,
        C.card,
        0.95
      ),

      line(
        x - 0.43 * scale,
        y - 0.12 * scale,
        x - 0.43 * scale,
        y - 0.64 * scale,
        C.muted,
        2.5
      ),

      line(
        x + 0.43 * scale,
        y - 0.12 * scale,
        x + 0.43 * scale,
        y - 0.64 * scale,
        C.muted,
        2.5
      ),

      line(
        x - 0.43 * scale,
        y - 0.43 * scale,
        x + 0.43 * scale,
        y - 0.43 * scale,
        C.muted,
        1.3
      )
    );
  }

  function coin(
    x, y,
    side = '?',
    radius = 0.29,
    color = GOLD
  ) {
    return new M.VGroup(
      circle(
        x, y,
        radius * 1.23,
        color,
        0.08,
        1
      ),

      circle(
        x, y,
        radius,
        color,
        0.20,
        2.5
      ),

      circle(
        x, y,
        radius * 0.78,
        color,
        0,
        1
      ),

      txt(
        side,
        radius >= 0.4 ? 35 : 22,
        color,
        x,
        y,
        true,
        radius * 1.30
      )
    );
  }

  function coinEdge(x, y, radius = 0.29) {
    return new M.VGroup(
      rounded(
        x,
        y,
        radius * 0.46,
        radius * 1.85,
        GOLD,
        GOLD,
        0.40
      ),

      line(
        x,
        y - radius * 0.69,
        x,
        y + radius * 0.69,
        GOLD,
        2
      )
    );
  }

  function quizPaper(x, y, scale = 1, color = EARLIER) {
    const w = 0.92 * scale;
    const h = 1.16 * scale;

    return new M.VGroup(
      rounded(
        x, y, w, h,
        color,
        C.card,
        1
      ),

      txt(
        'QUIZ',
        16 * scale,
        color,
        x,
        y + 0.32 * scale,
        false,
        w - 0.13
      ),

      ...Array.from({ length: 3 }, (_, j) =>
        line(
          x - 0.29 * scale,
          y + 0.05 * scale - j * 0.17 * scale,
          x + 0.29 * scale,
          y + 0.05 * scale - j * 0.17 * scale,
          C.muted,
          1.3
        )
      )
    );
  }

  // ------------------------------------------------------------
  // 0: the teacher wants to compare two practice activities
  // ------------------------------------------------------------

  const ACT_Y = P ? -0.85 : -0.40;
  const ACT_X = [
    CX - 1.68,
    CX + 1.68
  ];

  function activityIntro(side, x) {
    const color = activityColor(side);

    const title = side === 'H'
      ? 'QUIZ CARDS'
      : 'REVIEW SHEET';

    const firstLine = side === 'H'
      ? 'Recall an answer'
      : 'Read the question';

    const secondLine = side === 'H'
      ? 'Then check it'
      : 'And its answer';

    return new M.VGroup(
      rounded(
        x,
        ACT_Y,
        3.10,
        P ? 3.50 : 2.95,
        color
      ),

      txt(
        title,
        P ? 21 : 19,
        color,
        x,
        ACT_Y + (P ? 1.40 : 1.17),
        false,
        2.84
      ),

      side === 'H'
        ? cardsIcon(x, ACT_Y + 0.20, 1.02)
        : sheetIcon(x, ACT_Y + 0.20, 1.02),

      txt(
        firstLine,
        P ? 18 : 17,
        C.ink,
        x,
        ACT_Y - 0.86,
        false,
        2.85
      ),

      txt(
        secondLine,
        P ? 18 : 17,
        C.muted,
        x,
        ACT_Y - 1.18,
        false,
        2.85
      )
    );
  }

  const cardsIntro = activityIntro(
    'H',
    ACT_X[0]
  );

  const sheetIntro = activityIntro(
    'T',
    ACT_X[1]
  );

  const sameMaterial = tag(
    'SAME MATERIAL, TWO ACTIVITIES',
    C.green,
    CX,
    P ? -3.15 : -2.32,
    17,
    6.4
  );

  const comparisonQuestion = txt(
    'Which activity helps students learn more?',
    P ? 21 : 19,
    EARLIER,
    CX,
    P ? 1.30 : 1.35,
    false,
    6.4
  );

  await until(S(0));
  await play(
    ...put(comparisonQuestion),

    lagIn(
      [cardsIntro, sheetIntro],
      0.20,
      1.20
    ),

    ...put(sameMaterial),

    ...say('COMPARE CARDS WITH THE REVIEW SHEET'),

    ...fbox([
      ['Quiz cards', CARDS],
      ['Review sheet', SHEET],
      'Same practice material',
      'Same later quiz'
    ])
  );

  // ------------------------------------------------------------
  // 1: what if students choose their own activity?
  // ------------------------------------------------------------

  const choiceStudent = glow(
    CX,
    P ? -3.90 : -2.64,
    C.ink,
    0.12
  );

  const choiceLabel = tag(
    'STUDENTS CHOOSE?',
    EARLIER,
    CX,
    P ? -4.43 : 1.35,
    19,
    5.8
  );

  await until(S(1));
  await play(
    ...take(comparisonQuestion, sameMaterial),
    ...put(choiceStudent, choiceLabel),

    ...say('WHAT IF STUDENTS PICK THEIR OWN ACTIVITY?', EARLIER),

    ...fbox([
      ['Self-selection', EARLIER],
      'Students choose',
      'Which activity to use',
      'Could that affect the result?'
    ], EARLIER)
  );

  // ------------------------------------------------------------
  // Classroom layout
  // ------------------------------------------------------------

  const DESK_SP = P ? 1.56 : 1.63;

  const DESK_DOT_Y = P ? 0.37 : 0.45;

  const deskX = i =>
    CX + (i - 1.5) * DESK_SP;

  const GROUP_X = {
    H: CX - 1.72,
    T: CX + 1.72
  };

  const GROUP_Y = P ? -2.79 : -1.84;

  const GROUP_W = P ? 3.15 : 3.22;
  const GROUP_H = P ? 1.94 : 1.76;

  function groupFrame(side) {
    const color = activityColor(side);
    const x = GROUP_X[side];

    const title = side === 'H'
      ? 'QUIZ CARDS'
      : 'REVIEW SHEET';

    return new M.VGroup(
      rounded(
        x,
        GROUP_Y,
        GROUP_W,
        GROUP_H,
        color,
        color,
        0.045
      ),

      txt(
        title,
        P ? 19 : 17,
        color,
        x,
        GROUP_Y + GROUP_H / 2 - 0.27,
        false,
        GROUP_W - 0.20
      )
    );
  }

  function groupSlot(side, j) {
    return {
      x: GROUP_X[side] + (j - 0.5) * 1.10,
      y: GROUP_Y - 0.19
    };
  }

  function makeDesks() {
    return SCORES.map((_, i) =>
      desk(
        deskX(i),
        DESK_DOT_Y - 0.51,
        P ? 0.93 : 0.91
      )
    );
  }

  function makeStudents(includeScores = false) {
    return SCORES.map((_, i) =>
      studentDot(
        i,
        deskX(i),
        DESK_DOT_Y,
        C.ink,
        includeScores
      )
    );
  }

  let desks = makeDesks();
  let students = makeStudents(false);

  let cardFrame = null;
  let sheetFrame = null;

  // ------------------------------------------------------------
  // 2: four students at four desks
  // ------------------------------------------------------------

  const classroomTitle = tag(
    'FOUR STUDENTS',
    C.cyan,
    CX,
    P ? 1.32 : 1.35,
    19
  );

  await until(S(2));
  await play(
    ...clearPicture(),

    ...put(classroomTitle),

    lagIn(
      desks,
      0.13,
      0.95
    ),

    lagIn(
      students,
      0.13,
      0.95
    ),

    ...say('FOUR STUDENTS AT FOUR DESKS'),

    ...fbox([
      'Students 1, 2, 3, 4',
      ['One dot = one student', C.cyan]
    ])
  );

  // ------------------------------------------------------------
  // 3: reveal the earlier quiz, not today's later quiz
  // ------------------------------------------------------------

  const earlierTitle = tag(
    'EARLIER QUIZ SCORES',
    EARLIER,
    CX,
    P ? 1.34 : 1.35,
    19,
    6.2
  );

  const earlierPaper = quizPaper(
    CX,
    P ? -2.13 : -1.65,
    P ? 0.83 : 0.75,
    EARLIER
  );

  const beforeToday = txt(
    'Taken before today’s practice',
    P ? 20 : 18,
    EARLIER,
    CX,
    P ? -3.10 : -2.52,
    false,
    6.3
  );

  const unknownScores = SCORES.map((_, i) =>
    txt(
      '?',
      P ? 27 : 24,
      EARLIER,
      deskX(i),
      DESK_DOT_Y + 0.40,
      true
    )
  );

  await until(S(3));
  await play(
    ...replace(classroomTitle, earlierTitle),

    ...put(
      earlierPaper,
      beforeToday,
      ...unknownScores
    ),

    ...say('START WITH SCORES FROM AN EARLIER QUIZ', EARLIER),

    ...fbox([
      ['Earlier quiz', EARLIER],
      'Before the activities',
      'Score out of 10',
      'Not the later result'
    ], EARLIER)
  );

  // ------------------------------------------------------------
  // 4: the first two students scored four
  // ------------------------------------------------------------

  const firstPair = [0, 1].map(i =>
    studentDot(
      i,
      deskX(i),
      DESK_DOT_Y,
      C.ink,
      true
    )
  );

  const lowPairOutline = rounded(
    (deskX(0) + deskX(1)) / 2,
    DESK_DOT_Y + 0.10,
    DESK_SP + 0.76,
    1.10,
    EARLIER,
    EARLIER,
    0.035
  );

  await until(S(4));
  await play(
    ...take(
      students[0],
      students[1],
      unknownScores[0],
      unknownScores[1]
    ),

    ...put(...firstPair),

    ...draw(lowPairOutline),

    ...say('THE FIRST TWO EACH SCORED FOUR', EARLIER),

    ...fbox([
      'Earlier scores:',
      ['Student 1 = 4', EARLIER],
      ['Student 2 = 4', EARLIER]
    ], EARLIER)
  );

  students[0] = firstPair[0];
  students[1] = firstPair[1];

  // ------------------------------------------------------------
  // 5: the other two students scored eight
  // ------------------------------------------------------------

  const secondPair = [2, 3].map(i =>
    studentDot(
      i,
      deskX(i),
      DESK_DOT_Y,
      C.ink,
      true
    )
  );

  const highPairOutline = rounded(
    (deskX(2) + deskX(3)) / 2,
    DESK_DOT_Y + 0.10,
    DESK_SP + 0.76,
    1.10,
    EARLIER,
    EARLIER,
    0.035
  );

  await until(S(5));
  await play(
    ...take(
      students[2],
      students[3],
      unknownScores[2],
      unknownScores[3]
    ),

    ...put(...secondPair),

    ...draw(highPairOutline),

    ...say('THE NEXT TWO EACH SCORED EIGHT', EARLIER),

    ...fbox([
      'Earlier scores:',
      ['4, 4, 8, 8', EARLIER],
      'Two lower scorers',
      'Two higher scorers'
    ], EARLIER)
  );

  students[2] = secondPair[0];
  students[3] = secondPair[1];

  // ------------------------------------------------------------
  // 6: both higher scorers choose the cards
  // ------------------------------------------------------------

  cardFrame = groupFrame('H');
  sheetFrame = groupFrame('T');

  const chooseCardsArrows = [2, 3].map((i, j) => {
    const slot = groupSlot('H', j);

    return arrow(
      deskX(i),
      DESK_DOT_Y - 0.43,
      slot.x,
      slot.y + 0.45,
      CARDS,
      0.12
    );
  });

  const highToCards = [2, 3].map((i, j) => {
    const slot = groupSlot('H', j);

    return new M.Transform(
      students[i],
      studentDot(
        i,
        slot.x,
        slot.y,
        CARDS,
        true
      ),
      { pathArc: -0.35 }
    );
  });

  await until(S(6));
  await play(
    ...take(
      earlierPaper,
      beforeToday,
      lowPairOutline,
      highPairOutline
    ),

    ...put(cardFrame, sheetFrame),

    ...draw(...chooseCardsArrows),

    new M.LaggedStart(
      highToCards,
      { lagRatio: 0.18, runTime: 1.35 }
    ),

    ...say('BOTH EIGHT-SCORERS CHOOSE CARDS', CARDS),

    ...fbox([
      ['Cards group', CARDS],
      'Student 3: 8',
      'Student 4: 8',
      'They choose it themselves'
    ], CARDS)
  );

  // ------------------------------------------------------------
  // 7: both lower scorers choose the sheet
  // ------------------------------------------------------------

  const chooseSheetArrows = [0, 1].map((i, j) => {
    const slot = groupSlot('T', j);

    return arrow(
      deskX(i),
      DESK_DOT_Y - 0.43,
      slot.x,
      slot.y + 0.45,
      SHEET,
      0.12
    );
  });

  const lowToSheet = [0, 1].map((i, j) => {
    const slot = groupSlot('T', j);

    return new M.Transform(
      students[i],
      studentDot(
        i,
        slot.x,
        slot.y,
        SHEET,
        true
      ),
      { pathArc: 0.35 }
    );
  });

  await until(S(7));
  await play(
    ...take(...chooseCardsArrows),

    ...draw(...chooseSheetArrows),

    new M.LaggedStart(
      lowToSheet,
      { lagRatio: 0.18, runTime: 1.25 }
    ),

    ...say('BOTH FOUR-SCORERS CHOOSE THE SHEET', SHEET),

    ...fbox([
      ['Sheet group', SHEET],
      'Student 1: 4',
      'Student 2: 4',
      'They choose it themselves'
    ], SHEET)
  );

  // ------------------------------------------------------------
  // 8–11: the groups already differ before practice
  // ------------------------------------------------------------

  const COMP_Y = P ? -0.92 : -0.43;
  const COMP_H = P ? 4.22 : 3.38;

  const COMP_X = {
    H: CX - 1.69,
    T: CX + 1.69
  };

  const SCORE_BASE = P ? -2.43 : -1.66;
  const SCORE_PITCH = P ? 0.23 : 0.175;

  function startingGroup(side, indices) {
    const x = COMP_X[side];
    const color = activityColor(side);

    const title = side === 'H'
      ? 'CARDS GROUP'
      : 'SHEET GROUP';

    const parts = [
      rounded(
        x,
        COMP_Y,
        3.12,
        COMP_H,
        color,
        C.card,
        0.88
      ),

      txt(
        title,
        P ? 19 : 18,
        color,
        x,
        COMP_Y + COMP_H / 2 - 0.28,
        false,
        2.88
      )
    ];

    indices.forEach((i, j) => {
      const px = x + (j - 0.5) * 0.93;

      parts.push(
        studentDot(
          i,
          px,
          COMP_Y + (P ? 0.90 : 0.63),
          color,
          true,
          0.83
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const startCards = startingGroup(
    'H',
    [2, 3]
  );

  const startSheet = startingGroup(
    'T',
    [0, 1]
  );

  const prePractice = tag(
    'BEFORE ANY PRACTICE',
    EARLIER,
    CX,
    P ? 1.53 : 1.42,
    19,
    6.35
  );

  await until(S(8));
  await play(
    ...clearPicture(),

    ...put(
      prePractice,
      startCards,
      startSheet
    ),

    ...say('LOOK AT THE GROUPS BEFORE THEY PRACTISE', EARLIER),

    ...fbox([
      'No practice yet',
      ['Cards: 8, 8', CARDS],
      ['Sheet: 4, 4', SHEET],
      'Earlier scores only'
    ], EARLIER)
  );

  function scoreStack(
    x, value, color,
    base = SCORE_BASE,
    pitch = SCORE_PITCH,
    width = 0.90
  ) {
    return new M.VGroup(
      ...Array.from({ length: value }, (_, j) =>
        rect(
          x,
          base + (j + 0.5) * pitch,
          width,
          pitch * 0.82,
          color,
          0.78,
          1.1
        )
      )
    );
  }

  const startingStacks = [
    scoreStack(
      COMP_X.H,
      8,
      CARDS
    ),

    scoreStack(
      COMP_X.T,
      4,
      SHEET
    )
  ];

  const startMeanLabels = [
    txt(
      'Mean = 8',
      P ? 23 : 21,
      CARDS,
      COMP_X.H,
      SCORE_BASE - 0.36,
      true
    ),

    txt(
      'Mean = 4',
      P ? 23 : 21,
      SHEET,
      COMP_X.T,
      SCORE_BASE - 0.36,
      true
    )
  ];

  const pointKey = txt(
    '1 glowing block = 1 earlier quiz point',
    P ? 16 : 14,
    C.muted,
    CX,
    P ? -3.58 : -2.50,
    false,
    6.5
  );

  await until(S(9));
  await play(
    lagIn(startingStacks, 0.20, 1.20),

    ...put(
      ...startMeanLabels,
      pointKey
    ),

    ...say('CARDS START AT EIGHT; SHEET STARTS AT FOUR', EARLIER),

    ...fbox([
      ['Cards: (8+8)/2 = 8', CARDS],
      ['Sheet: (4+4)/2 = 4', SHEET],
      'These are starting means'
    ], EARLIER)
  );

  // ------------------------------------------------------------
  // 10: a four-point head start
  // ------------------------------------------------------------

  const level4 = SCORE_BASE + 4 * SCORE_PITCH;
  const level8 = SCORE_BASE + 8 * SCORE_PITCH;

  const gapGuide4 = dashed(
    COMP_X.H + 0.51,
    level4,
    COMP_X.T - 0.51,
    level4,
    EARLIER
  );

  const gapGuide8 = dashed(
    COMP_X.H + 0.51,
    level8,
    CX + 0.12,
    level8,
    EARLIER
  );

  const startingGap = doubleArrow(
    CX,
    level4,
    CX,
    level8,
    EARLIER,
    0.10
  );

  const gapLabel = tag(
    '+4',
    EARLIER,
    CX + 0.05,
    (level4 + level8) / 2,
    P ? 19 : 17,
    0.92
  );

  const headStart = tag(
    'FOUR-POINT HEAD START',
    EARLIER,
    CX,
    P ? -4.31 : 1.42,
    19,
    6.3
  );

  await until(S(10));
  await play(
    ...draw(
      gapGuide4,
      gapGuide8,
      startingGap
    ),

    ...put(gapLabel),

    ...replace(prePractice, headStart),

    ...say('EIGHT MINUS FOUR = FOUR POINTS', EARLIER),

    ...fbox([
      ['Starting gap', EARLIER],
      'Cards mean − sheet mean',
      '8 − 4',
      ['= 4 points', EARLIER]
    ], EARLIER)
  );

  // ------------------------------------------------------------
  // 11: a later difference may reflect prior skill
  // ------------------------------------------------------------

  // The later scores are deliberately unknown.
  // No extra outcome values are introduced.

  const CAUSE_Y = P ? -0.64 : -0.28;

  function timeCard(
    cx, color,
    title, content, footer
  ) {
    return new M.VGroup(
      rounded(
        cx,
        CAUSE_Y,
        2.92,
        P ? 2.80 : 2.45,
        color
      ),

      txt(
        title,
        P ? 20 : 18,
        color,
        cx,
        CAUSE_Y + 0.90,
        false,
        2.68
      ),

      txt(
        content,
        P ? 35 : 30,
        color,
        cx,
        CAUSE_Y,
        true,
        2.68
      ),

      txt(
        footer,
        P ? 16 : 15,
        C.muted,
        cx,
        CAUSE_Y - 0.88,
        false,
        2.68
      )
    );
  }

  const earlierDifference = timeCard(
    CX - 1.72,
    EARLIER,
    'EARLIER QUIZ',
    '+4 points',
    'Already present'
  );

  const laterDifference = timeCard(
    CX + 1.72,
    CHANCE,
    'LATER QUIZ',
    '?',
    'Not observed yet'
  );

  const possibleInfluence = arrow(
    CX - 0.24,
    CAUSE_Y,
    CX + 0.24,
    CAUSE_Y,
    EARLIER,
    0.10
  );

  const priorSkillNote = txt(
    'A later gap might partly reflect the starting gap.',
    P ? 19 : 17,
    EARLIER,
    CX,
    P ? -2.88 : -2.23,
    false,
    6.5
  );

  await until(S(11));
  await play(
    ...clearPicture(),

    ...put(
      earlierDifference,
      laterDifference
    ),

    ...draw(possibleInfluence),

    ...put(priorSkillNote),

    ...say('A LATER GAP COULD REFLECT THE HEAD START', EARLIER),

    ...fbox([
      'Later difference',
      'Could reflect practice',
      ['Or prior skill', EARLIER],
      'Self-selection mixes them'
    ], EARLIER)
  );

  // ------------------------------------------------------------
  // 12: let chance choose the activity
  // ------------------------------------------------------------

  const chanceCoinY = P ? 0.25 : 0.43;

  const bigCoin = coin(
    CX,
    chanceCoinY,
    '?',
    P ? 0.77 : 0.64,
    GOLD
  );

  const choiceCards = new M.VGroup(
    cardsIcon(
      CX - 1.74,
      P ? -1.92 : -1.21,
      0.82
    ),

    tag(
      'QUIZ CARDS',
      CARDS,
      CX - 1.74,
      P ? -2.91 : -2.15,
      17,
      2.85
    )
  );

  const choiceSheet = new M.VGroup(
    sheetIcon(
      CX + 1.74,
      P ? -1.92 : -1.21,
      0.82
    ),

    tag(
      'REVIEW SHEET',
      SHEET,
      CX + 1.74,
      P ? -2.91 : -2.15,
      17,
      2.85
    )
  );

  const chanceArrows = [
    arrow(
      CX - 0.36,
      chanceCoinY - 0.55,
      CX - 1.55,
      P ? -1.07 : -0.54,
      CARDS
    ),

    arrow(
      CX + 0.36,
      chanceCoinY - 0.55,
      CX + 1.55,
      P ? -1.07 : -0.54,
      SHEET
    )
  ];

  await until(S(12));
  await play(
    ...clearPicture(),

    ...put(bigCoin),

    ...draw(...chanceArrows),

    ...put(choiceCards, choiceSheet),

    ...say('WHAT IF A COIN CHOSE THE ACTIVITY?', CHANCE),

    ...fbox([
      'Instead of self-selection:',
      ['Let chance decide', CHANCE],
      'One coin per student'
    ], CHANCE)
  );

  // ------------------------------------------------------------
  // 13: one separate coin above each desk
  // ------------------------------------------------------------

  desks = makeDesks();
  students = makeStudents(true);

  const COIN_Y = P ? 1.45 : 1.40;
  const COIN_R = P ? 0.29 : 0.25;

  let coins = SCORES.map((_, i) =>
    coin(
      deskX(i),
      COIN_Y,
      '?',
      COIN_R
    )
  );

  cardFrame = groupFrame('H');
  sheetFrame = groupFrame('T');

  const coinClassroomNote = txt(
    'Earlier quiz scores stay the same.',
    P ? 18 : 16,
    EARLIER,
    CX,
    P ? -1.12 : -0.60,
    false,
    6.4
  );

  await until(S(13));
  await play(
    ...clearPicture(),

    ...put(
      ...desks,
      ...students,
      cardFrame,
      sheetFrame,
      coinClassroomNote
    ),

    lagIn(
      coins,
      0.16,
      1.20
    ),

    ...say('A SEPARATE COIN ABOVE EVERY DESK', CHANCE),

    ...fbox([
      'Student 1: own coin',
      'Student 2: own coin',
      'Student 3: own coin',
      'Student 4: own coin'
    ], CHANCE)
  );

  // ------------------------------------------------------------
  // 14: a fair coin gives each side equal chance
  // ------------------------------------------------------------

  const FAIR_Y = P ? -1.02 : -0.46;

  const fairHeads = new M.VGroup(
    coin(
      CX - 1.55,
      FAIR_Y + 0.48,
      'H',
      P ? 0.62 : 0.53,
      GOLD
    ),

    txt(
      'HEADS',
      20,
      GOLD,
      CX - 1.55,
      FAIR_Y - 0.43
    ),

    txt(
      '1/2',
      P ? 35 : 30,
      C.green,
      CX - 1.55,
      FAIR_Y - 1.00,
      true
    )
  );

  const fairTails = new M.VGroup(
    coin(
      CX + 1.55,
      FAIR_Y + 0.48,
      'T',
      P ? 0.62 : 0.53,
      GOLD
    ),

    txt(
      'TAILS',
      20,
      GOLD,
      CX + 1.55,
      FAIR_Y - 0.43
    ),

    txt(
      '1/2',
      P ? 35 : 30,
      C.green,
      CX + 1.55,
      FAIR_Y - 1.00,
      true
    )
  );

  const fairEquals = txt(
    '=',
    35,
    C.green,
    CX,
    FAIR_Y - 1.00,
    true
  );

  const fairTitle = tag(
    'TWO EQUALLY LIKELY SIDES',
    C.green,
    CX,
    P ? 1.31 : 1.36,
    19,
    6.4
  );

  await until(S(14));
  await play(
    ...clearPicture(),

    ...put(
      fairTitle,
      fairHeads,
      fairTails,
      fairEquals
    ),

    ...say('A FAIR COIN HAS TWO EQUALLY LIKELY SIDES', C.green),

    ...fbox([
      ['P(heads) = 1/2', GOLD],
      ['P(tails) = 1/2', GOLD],
      'One in two for either'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 15: flip separately, with the same rules every time
  // ------------------------------------------------------------

  desks = makeDesks();
  students = makeStudents(true);

  coins = SCORES.map((_, i) =>
    coin(
      deskX(i),
      COIN_Y,
      '?',
      COIN_R
    )
  );

  cardFrame = groupFrame('H');
  sheetFrame = groupFrame('T');

  const independentNote = tag(
    'SEPARATE FAIR FLIPS',
    CHANCE,
    CX,
    P ? -1.20 : -0.65,
    18,
    6.4
  );

  await until(S(15));
  await play(
    ...clearPicture(),

    ...put(
      ...desks,
      ...students,
      cardFrame,
      sheetFrame
    ),

    lagIn(
      coins,
      0.16,
      1.25
    ),

    ...put(independentNote),

    ...say('FLIP AGAIN FOR EACH STUDENT', CHANCE),

    ...fbox([
      'Four separate flips',
      'Same fair coin rules',
      ['Independent outcomes', CHANCE],
      'Previous score is irrelevant'
    ], CHANCE)
  );

  // ------------------------------------------------------------
  // 16–17: fix the assignment rules
  // ------------------------------------------------------------

  const RULE_Y = P ? -4.36 : -2.94;

  const headsRule = tag(
    'H → CARDS',
    CARDS,
    GROUP_X.H,
    RULE_Y,
    P ? 19 : 16,
    2.90
  );

  const tailsRule = tag(
    'T → SHEET',
    SHEET,
    GROUP_X.T,
    RULE_Y,
    P ? 19 : 16,
    2.90
  );

  await until(S(16));
  await play(
    ...put(headsRule),

    new M.Indicate(
      cardFrame,
      { color: CARDS }
    ),

    ...say('HEADS SENDS THE STUDENT TO CARDS', CARDS),

    ...fbox([
      ['Heads → quiz cards', CARDS],
      'Chance = 1/2',
      'The rule is fixed'
    ], CARDS)
  );

  await until(S(17));
  await play(
    ...put(tailsRule),

    new M.Indicate(
      sheetFrame,
      { color: SHEET }
    ),

    ...say('TAILS SENDS THE STUDENT TO THE SHEET', SHEET),

    ...fbox([
      ['Heads → cards', CARDS],
      ['Tails → sheet', SHEET],
      'Each chance = 1/2'
    ])
  );

  // ------------------------------------------------------------
  // Coin reveal and student-movement helpers
  // ------------------------------------------------------------

  function revealCoin(i, side) {
    return new M.Transform(
      coins[i],

      coin(
        deskX(i),
        COIN_Y,
        side,
        COIN_R,
        activityColor(side)
      ),

      { runTime: 0.65 }
    );
  }

  function moveStudent(
    i, side, slotIndex,
    runTime = 1.0
  ) {
    const target = groupSlot(
      side,
      slotIndex
    );

    return new M.Transform(
      students[i],

      studentDot(
        i,
        target.x,
        target.y,
        activityColor(side),
        true
      ),

      {
        pathArc: side === 'H' ? -0.30 : 0.30,
        runTime
      }
    );
  }

  // ------------------------------------------------------------
  // 18: the first coin lands heads
  // ------------------------------------------------------------

  const firstCoinFocus = circle(
    deskX(0),
    COIN_Y,
    COIN_R * 1.48,
    CARDS,
    0
  );

  await until(S(18));
  await play(
    revealCoin(0, 'H'),

    ...draw(firstCoinFocus),

    ...say('FIRST COIN: HEADS', CARDS),

    ...fbox([
      'Student 1',
      ['Earlier score = 4', EARLIER],
      ['Coin = H', CARDS]
    ], CARDS)
  );

  // ------------------------------------------------------------
  // 19: move student one to cards
  // ------------------------------------------------------------

  await until(S(19));
  await play(
    ...take(firstCoinFocus),

    moveStudent(0, 'H', 0),

    ...say('STUDENT ONE GOES TO CARDS', CARDS),

    ...fbox([
      'Student 1',
      ['Earlier score = 4', EARLIER],
      'H → cards',
      ['Coin decides', CARDS]
    ], CARDS)
  );

  // ------------------------------------------------------------
  // 20: the next coin lands tails
  // ------------------------------------------------------------

  const secondCoinFocus = circle(
    deskX(1),
    COIN_Y,
    COIN_R * 1.48,
    SHEET,
    0
  );

  await until(S(20));
  await play(
    revealCoin(1, 'T'),

    ...draw(secondCoinFocus),

    ...say('SECOND COIN: TAILS', SHEET),

    ...fbox([
      'Student 2',
      ['Earlier score = 4', EARLIER],
      ['Coin = T', SHEET]
    ], SHEET)
  );

  // ------------------------------------------------------------
  // 21: move student two to the sheet
  // ------------------------------------------------------------

  await until(S(21));
  await play(
    ...take(secondCoinFocus),

    moveStudent(1, 'T', 0),

    ...say('STUDENT TWO GOES TO THE SHEET', SHEET),

    ...fbox([
      'Student 2',
      ['Earlier score = 4', EARLIER],
      'T → sheet',
      ['Same score, different activity', SHEET]
    ], SHEET)
  );

  // ------------------------------------------------------------
  // 22: introduce the name random assignment
  // ------------------------------------------------------------

  // Complete this example with H and T for students 3 and 4.
  // This is labelled as one possible set of four flips.
  // Random assignment does not require a 2-versus-2 split.

  const exampleOutcome = tag(
    'ONE POSSIBLE RESULT: H T H T',
    CHANCE,
    CX,
    P ? -1.20 : -0.65,
    17,
    6.3
  );

  await until(S(22));
  await play(
    ...replace(
      independentNote,
      exampleOutcome
    ),

    new M.LaggedStart(
      [
        revealCoin(2, EXAMPLE_FLIPS[2]),
        revealCoin(3, EXAMPLE_FLIPS[3]),
        moveStudent(2, 'H', 1),
        moveStudent(3, 'T', 1)
      ],
      {
        lagRatio: 0.24,
        runTime: 1.85
      }
    ),

    ...say('LET CHANCE CHOOSE: RANDOM ASSIGNMENT', CHANCE),

    ...fbox([
      ['Random assignment', CHANCE],
      'Chance chooses',
      'Who gets each activity',
      'Not the student’s skill'
    ], CHANCE)
  );

  // ------------------------------------------------------------
  // 23: ask about each student's probability
  // ------------------------------------------------------------

  const individualQuestion = tag(
    'HOW OFTEN DOES EACH GET CARDS?',
    EARLIER,
    CX,
    P ? -1.20 : -0.65,
    17,
    6.35
  );

  await until(S(23));
  await play(
    ...replace(
      exampleOutcome,
      individualQuestion
    ),

    new M.LaggedStart(
      coins.map(c =>
        new M.Indicate(c, { color: GOLD })
      ),
      {
        lagRatio: 0.14,
        runTime: 1.10
      }
    ),

    ...say('HOW OFTEN DOES EACH STUDENT GET CARDS?', EARLIER),

    ...fbox([
      'Repeat the four flips',
      'Many possible outcomes',
      ['What is each chance?', EARLIER]
    ], EARLIER)
  );

  // ------------------------------------------------------------
  // 24–25: enumerate the possible sets of flips
  // ------------------------------------------------------------

  const TREE_TOP = P ? 1.10 : 1.24;
  const TREE_BOTTOM = P ? -3.98 : -1.98;

  const TREE_LEFT = CX - 2.77;
  const TREE_RIGHT = CX + 3.15;

  const TREE_WIDTH = TREE_RIGHT - TREE_LEFT;

  const levelX = depth =>
    TREE_LEFT + depth / 4 * TREE_WIDTH;

  function levelNodes(depth) {
    const count = 2 ** depth;

    if (depth === 0) {
      return [{
        x: levelX(0),
        y: (TREE_TOP + TREE_BOTTOM) / 2,
        bits: ''
      }];
    }

    return Array.from({ length: count }, (_, i) => {
      const bits = i
        .toString(2)
        .padStart(depth, '0')
        .replace(/0/g, 'H')
        .replace(/1/g, 'T');

      const y = TREE_TOP -
        i / (count - 1) *
        (TREE_TOP - TREE_BOTTOM);

      return {
        x: levelX(depth),
        y,
        bits
      };
    });
  }

  const TREE_LEVELS = Array.from(
    { length: 5 },
    (_, d) => levelNodes(d)
  );

  function treeLevel(depth) {
    const nodes = TREE_LEVELS[depth];

    const parts = [];

    if (depth > 0) {
      const parents = TREE_LEVELS[depth - 1];

      nodes.forEach((n, i) => {
        const parent =
          parents[Math.floor(i / 2)];

        const side =
          n.bits[n.bits.length - 1];

        parts.push(
          line(
            parent.x,
            parent.y,
            n.x,
            n.y,
            activityColor(side),
            depth === 4 ? 1.0 : 1.6
          )
        );
      });
    }

    nodes.forEach(n => {
      const side = n.bits[n.bits.length - 1];

      parts.push(
        glow(
          n.x,
          n.y,
          depth === 0
            ? CHANCE
            : activityColor(side),

          depth === 4
            ? (P ? 0.045 : 0.034)
            : (P ? 0.075 : 0.060)
        )
      );

      if (depth === 1) {
        parts.push(
          txt(
            n.bits,
            18,
            activityColor(side),
            n.x + 0.24,
            n.y,
            true
          )
        );
      }
    });

    return new M.VGroup(...parts);
  }

  const treeRoot = treeLevel(0);

  const treeStart = txt(
    'Start',
    16,
    CHANCE,
    TREE_LEFT,
    (TREE_TOP + TREE_BOTTOM) / 2 + 0.34
  );

  const treeLegend = new M.VGroup(
    tag(
      'H',
      CARDS,
      CX - 0.82,
      P ? -4.61 : -2.48,
      15
    ),

    tag(
      'T',
      SHEET,
      CX + 0.82,
      P ? -4.61 : -2.48,
      15
    )
  );

  await until(S(24));
  await play(
    ...clearPicture(),

    ...put(
      treeRoot,
      treeStart,
      treeLegend
    ),

    ...say('LIST EVERY WAY THE FOUR COINS CAN LAND'),

    ...fbox([
      'Four separate coins',
      'Each has two outcomes',
      ['Count every combination', CHANCE]
    ], CHANCE)
  );

  const treeLayers = [1, 2, 3, 4].map(
    depth => treeLevel(depth)
  );

  const treeCounts = [1, 2, 3, 4].map(depth =>
    new M.VGroup(
      txt(
        `${depth} coin${depth === 1 ? '' : 's'}`,
        P ? 15 : 14,
        C.muted,
        levelX(depth),
        P ? -4.35 : -2.24,
        false,
        1.37
      ),

      txt(
        2 ** depth,
        P ? 22 : 19,
        CHANCE,
        levelX(depth),
        P ? -5.06 : -2.81,
        true
      )
    )
  );

  const treeSteps = treeLayers.map((layer, i) => {
    visible.add(layer);
    visible.add(treeCounts[i]);

    return new M.LaggedStart(
      [
        new M.FadeIn(layer),
        new M.FadeIn(treeCounts[i])
      ],
      { lagRatio: 0.18 }
    );
  });

  await until(S(25));
  await play(
    new M.LaggedStart(
      treeSteps,
      {
        lagRatio: 0.58,
        runTime: 3.10
      }
    ),

    ...take(treeLegend),

    ...say('EACH NEW COIN DOUBLES THE COUNT', CHANCE),

    ...fbox([
      '1 coin  →  2 ways',
      '2 coins →  4 ways',
      '3 coins →  8 ways',
      ['4 coins → 16 ways', CHANCE]
    ], CHANCE)
  );

  // ------------------------------------------------------------
  // Table of all sixteen outcomes
  // ------------------------------------------------------------

  // The table uses a fixed, complete lexicographic ordering:
  // HHHH, HHHT, HHTH, HHTT, ..., TTTT.
  //
  // No outcomes are omitted. In particular, four students
  // can all receive cards or all receive the sheet.
  //
  // Each row has probability (1/2)^4 = 1/16.
  //
  // Columns S1 and S2 belong to the earlier-score-four pair.
  // Columns S3 and S4 belong to the earlier-score-eight pair.

  const ROW_H = P ? 0.283 : 0.205;

  const FIRST_ROW_Y = P ? 0.71 : 0.67;

  const ROW_NUMBER_X = CX - 3.00;

  const COL_X = [
    CX - 2.06,
    CX - 1.02,
    CX + 0.27,
    CX + 1.31
  ];

  const LOW_COUNT_X = CX + 2.25;
  const HIGH_COUNT_X = CX + 3.09;

  const ROW_LEFT = CX - 3.31;
  const ROW_RIGHT = CX + 3.48;

  const rowY = i =>
    FIRST_ROW_Y - i * ROW_H;

  const TABLE_BOTTOM = rowY(15) - ROW_H / 2;

  const TABLE_TOP = FIRST_ROW_Y + ROW_H / 2;

  const TABLE_CENTER_Y =
    (TABLE_TOP + TABLE_BOTTOM) / 2;

  const TABLE_HEIGHT =
    TABLE_TOP - TABLE_BOTTOM;

  const TABLE_FOOTER_Y = P ? -4.43 : -2.91;

  function tableHeader() {
    const parts = [];

    const titleY = P ? 1.53 : 1.48;
    const pairY = P ? 1.24 : 1.23;
    const headerY = P ? 0.99 : 0.96;

    parts.push(
      txt(
        'ALL 16 EQUALLY LIKELY OUTCOMES',
        P ? 19 : 17,
        CHANCE,
        CX,
        titleY,
        false,
        6.7
      ),

      txt(
        'Earlier score: 4',
        P ? 16 : 14,
        EARLIER,
        (COL_X[0] + COL_X[1]) / 2,
        pairY,
        false,
        2.20
      ),

      txt(
        'Earlier score: 8',
        P ? 16 : 14,
        EARLIER,
        (COL_X[2] + COL_X[3]) / 2,
        pairY,
        false,
        2.20
      ),

      txt(
        '#',
        14,
        C.muted,
        ROW_NUMBER_X,
        headerY,
        true
      )
    );

    COL_X.forEach((x, j) => {
      parts.push(
        txt(
          `S${j + 1}`,
          P ? 16 : 14,
          C.ink,
          x,
          headerY,
          true
        )
      );
    });

    parts.push(
      line(
        ROW_LEFT,
        TABLE_TOP + 0.03,
        ROW_RIGHT,
        TABLE_TOP + 0.03,
        C.muted,
        1.5
      ),

      dashed(
        (COL_X[1] + COL_X[2]) / 2,
        TABLE_TOP,
        (COL_X[1] + COL_X[2]) / 2,
        TABLE_BOTTOM,
        EARLIER
      ),

      dashed(
        (COL_X[3] + LOW_COUNT_X) / 2,
        TABLE_TOP,
        (COL_X[3] + LOW_COUNT_X) / 2,
        TABLE_BOTTOM,
        C.muted
      )
    );

    return new M.VGroup(...parts);
  }

  function outcomeRow(row, i) {
    const y = rowY(i);

    const parts = [
      rect(
        (ROW_LEFT + ROW_RIGHT) / 2,
        y,
        ROW_RIGHT - ROW_LEFT,
        ROW_H * 0.96,
        C.muted,
        i % 2 === 0 ? 0.075 : 0.015,
        0
      ),

      txt(
        String(i + 1).padStart(2, '0'),
        P ? 14 : 13,
        C.muted,
        ROW_NUMBER_X,
        y,
        true
      )
    ];

    row.forEach((side, j) => {
      const color = activityColor(side);

      parts.push(
        rounded(
          COL_X[j],
          y,
          P ? 0.64 : 0.62,
          ROW_H * 0.86,
          color,
          color,
          0.16
        ),

        txt(
          side,
          P ? 16 : 14,
          color,
          COL_X[j],
          y,
          true
        )
      );
    });

    return new M.VGroup(...parts);
  }

  function tableFooter(s, color = C.muted) {
    return txt(
      s,
      P ? 17 : 15,
      color,
      CX,
      TABLE_FOOTER_Y,
      false,
      6.8
    );
  }

  function makeOutcomeTable() {
    return {
      header: tableHeader(),

      rows: OUTCOMES.map(outcomeRow),

      footer: tableFooter(
        'H = cards     T = sheet     P(each row) = 1/16'
      )
    };
  }

  function tableObjects(t) {
    return [
      t.header,
      ...t.rows,
      t.footer
    ];
  }

  function columnOutline(
    j,
    color = EARLIER
  ) {
    return rect(
      COL_X[j],
      TABLE_CENTER_Y,
      0.82,
      TABLE_HEIGHT + 0.04,
      color,
      0,
      2.2
    );
  }

  function cellOutline(
    i, j,
    color = C.green
  ) {
    return rect(
      COL_X[j],
      rowY(i),
      P ? 0.72 : 0.69,
      ROW_H * 0.94,
      color,
      0,
      1.8
    );
  }

  function pairOutline(
    start,
    color = EARLIER
  ) {
    const x1 = COL_X[start];
    const x2 = COL_X[start + 1];

    return rect(
      (x1 + x2) / 2,
      TABLE_CENTER_Y,
      x2 - x1 + 0.86,
      TABLE_HEIGHT + 0.04,
      color,
      0,
      2.2
    );
  }

  function rowOutline(
    i,
    color = EARLIER
  ) {
    return rect(
      (ROW_LEFT + ROW_RIGHT) / 2,
      rowY(i),
      ROW_RIGHT - ROW_LEFT + 0.05,
      ROW_H * 1.02,
      color,
      0,
      2.7
    );
  }

  function headCells(
    columns,
    color = CARDS
  ) {
    return OUTCOMES.flatMap((row, i) =>
      columns
        .filter(j => row[j] === 'H')
        .map(j =>
          cellOutline(i, j, color)
        )
    );
  }

  function columnCount(j) {
    return txt(
      `${CARDS_COUNTS[j]} H`,
      P ? 17 : 14,
      CARDS,
      COL_X[j],
      TABLE_BOTTOM - (P ? 0.25 : 0.20),
      true,
      0.86
    );
  }

  function pairCountColumn(pair) {
    const low = pair === 'low';

    const values = low
      ? LOW_PAIR_COUNTS
      : HIGH_PAIR_COUNTS;

    const x = low
      ? LOW_COUNT_X
      : HIGH_COUNT_X;

    const parts = [
      txt(
        low ? '4s' : '8s',
        P ? 15 : 13,
        EARLIER,
        x,
        P ? 0.99 : 0.96,
        true
      )
    ];

    values.forEach((n, i) => {
      parts.push(
        txt(
          n,
          P ? 17 : 14,
          n > 0 ? CARDS : C.muted,
          x,
          rowY(i),
          true
        )
      );
    });

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // 26: display sixteen equally likely rows
  // ------------------------------------------------------------

  let table = makeOutcomeTable();

  await until(S(26));
  await play(
    ...clearPicture(),

    ...put(table.header),

    lagIn(
      table.rows,
      0.075,
      2.50
    ),

    ...put(table.footer),

    ...say('SIXTEEN ROWS, ALL EQUALLY LIKELY', CHANCE),

    ...fbox([
      'One row = four flips',
      'P(each row) = (1/2)^4',
      ['= 1/16', CHANCE],
      'All 16 rows equally likely'
    ], CHANCE)
  );

  // ------------------------------------------------------------
  // 27: follow student one down the table
  // ------------------------------------------------------------

  let firstColumnOutline = columnOutline(
    0,
    EARLIER
  );

  const firstStudentNote = tableFooter(
    'Follow S1: earlier quiz score = 4',
    EARLIER
  );

  const scanRow = rect(
    COL_X[0],
    rowY(0),
    0.79,
    ROW_H * 0.94,
    GOLD,
    0,
    2.6
  );

  await until(S(27));
  await play(
    ...draw(
      firstColumnOutline,
      scanRow
    ),

    ...replace(
      table.footer,
      firstStudentNote
    ),

    ...say('FOLLOW THE FIRST FOUR-SCORER DOWN THE ROWS', EARLIER),

    ...fbox([
      'Student 1',
      ['Earlier score = 4', EARLIER],
      'Look down column S1',
      'Count the H outcomes'
    ], EARLIER)
  );

  table.footer = firstStudentNote;

  // ------------------------------------------------------------
  // 28: student one has eight heads outcomes
  // ------------------------------------------------------------

  let firstHeads = headCells(
    [0],
    C.green
  );

  const firstCount = columnCount(0);

  const firstCountNote = tableFooter(
    'S1 receives cards in exactly 8 rows.',
    CARDS
  );

  await until(S(28));
  await play(
    ...take(scanRow),

    lagIn(
      firstHeads,
      0.08,
      1.40
    ),

    ...put(firstCount),

    ...replace(
      table.footer,
      firstCountNote
    ),

    ...say('STUDENT ONE GETS CARDS IN EIGHT ROWS', CARDS),

    ...fbox([
      'Student 1:',
      ['8 rows contain H', CARDS],
      '8 rows contain T',
      '16 rows in total'
    ], CARDS)
  );

  table.footer = firstCountNote;

  // ------------------------------------------------------------
  // 29: eight out of sixteen equals one half
  // ------------------------------------------------------------

  const fractionNote = tableFooter(
    '8 / 16 = 1 / 2 = 50%',
    C.green
  );

  await until(S(29));
  await play(
    ...replace(
      table.footer,
      fractionNote
    ),

    new M.Indicate(
      firstCount,
      { color: C.green }
    ),

    ...say('EIGHT OUT OF SIXTEEN IS ONE IN TWO', C.green),

    ...fbox([
      'P(S1 receives cards)',
      '= 8/16',
      ['= 1/2', C.green],
      '= 50%'
    ], C.green)
  );

  table.footer = fractionNote;

  // ------------------------------------------------------------
  // 30: every other student has the same probability
  // ------------------------------------------------------------

  let allHeads = headCells(
    [1, 2, 3],
    C.green
  );

  const remainingCounts = [1, 2, 3].map(
    j => columnCount(j)
  );

  const sameChanceNote = tableFooter(
    'Every column contains 8 H and 8 T.',
    C.green
  );

  await until(S(30));
  await play(
    ...take(firstColumnOutline),

    lagIn(
      allHeads,
      0.032,
      1.60
    ),

    ...put(...remainingCounts),

    ...replace(
      table.footer,
      sameChanceNote
    ),

    ...say('EVERY STUDENT HAS THE SAME CHANCE OF CARDS', C.green),

    ...fbox([
      ['S1: 8/16 = 1/2', C.green],
      ['S2: 8/16 = 1/2', C.green],
      ['S3: 8/16 = 1/2', C.green],
      ['S4: 8/16 = 1/2', C.green]
    ], C.green)
  );

  table.footer = sameChanceNote;

  // ------------------------------------------------------------
  // 31: examine the two earlier-score-four students together
  // ------------------------------------------------------------

  const lowerPairOutline = pairOutline(
    0,
    EARLIER
  );

  let lowerHeads = headCells(
    [0, 1],
    CARDS
  );

  const lowerPairNote = tableFooter(
    'Focus on S1 and S2: both started at 4.',
    EARLIER
  );

  await until(S(31));
  await play(
    ...take(
      ...firstHeads,
      ...allHeads,
      remainingCounts[1],
      remainingCounts[2]
    ),

    ...draw(lowerPairOutline),

    ...put(...lowerHeads),

    ...replace(
      table.footer,
      lowerPairNote
    ),

    ...say('WATCH THE TWO FOUR-SCORERS TOGETHER', EARLIER),

    ...fbox([
      ['Earlier-score-four pair', EARLIER],
      'Student 1',
      'Student 2',
      'Count both students'
    ], EARLIER)
  );

  table.footer = lowerPairNote;

  // ------------------------------------------------------------
  // 32: add the two students' cards counts
  // ------------------------------------------------------------

  // Count student-card assignments, not distinct rows.
  // If both receive cards in the same row, that contributes 2.
  // If neither receives cards, it contributes 0.

  const lowerCounts = pairCountColumn('low');

  const lowerTotalNote = tableFooter(
    '8 + 8 = 16 cards assignments across the rows',
    CARDS
  );

  await until(S(32));
  await play(
    ...put(lowerCounts),

    ...replace(
      table.footer,
      lowerTotalNote
    ),

    new M.Indicate(
      firstCount,
      { color: CARDS }
    ),

    new M.Indicate(
      remainingCounts[0],
      { color: CARDS }
    ),

    ...say('ADD THE CARDS COUNTS: EIGHT PLUS EIGHT', CARDS),

    ...fbox([
      'Student 1: 8',
      'Student 2: 8',
      ['8 + 8 = 16 assignments', CARDS],
      'Some rows count twice'
    ], CARDS)
  );

  table.footer = lowerTotalNote;

  // ------------------------------------------------------------
  // 33: share the sixteen assignments over sixteen rows
  // ------------------------------------------------------------

  const SHARE_Y = P ? -1.18 : -0.48;

  // Preserve the row structure of the actual table.
  // Each of these sixteen small boxes represents one row.
  // The number of cyan dots in each box is the actual
  // number of earlier-score-four students receiving cards.

  function rowCountTile(
    index,
    count,
    x, y,
    color = CARDS
  ) {
    const w = P ? 1.37 : 1.44;
    const h = P ? 0.87 : 0.61;

    const parts = [
      rounded(
        x,
        y,
        w,
        h,
        C.muted,
        C.card,
        0.85
      ),

      txt(
        String(index + 1),
        P ? 13 : 12,
        C.muted,
        x - w / 2 + 0.18,
        y + h / 2 - 0.14,
        true
      )
    ];

    if (count === 0) {
      parts.push(
        txt(
          '0',
          P ? 20 : 17,
          C.muted,
          x,
          y - 0.02,
          true
        )
      );
    } else {
      for (let j = 0; j < count; j++) {
        parts.push(
          glow(
            x + (j - (count - 1) / 2) * 0.37,
            y - 0.02,
            color,
            P ? 0.096 : 0.078
          )
        );
      }
    }

    return new M.VGroup(...parts);
  }

  const TILE_X_SP = P ? 1.53 : 1.57;
  const TILE_Y_SP = P ? 1.00 : 0.72;

  function rowTilePosition(i) {
    const col = i % 4;
    const row = Math.floor(i / 4);

    return {
      x: CX + (col - 1.5) * TILE_X_SP,
      y: SHARE_Y + (1.5 - row) * TILE_Y_SP
    };
  }

  let rowTiles = LOW_PAIR_COUNTS.map(
    (count, i) => {
      const p = rowTilePosition(i);

      return rowCountTile(
        i,
        count,
        p.x,
        p.y
      );
    }
  );

  const sharingHeading = tag(
    '16 ASSIGNMENTS ACROSS 16 ROWS',
    CARDS,
    CX,
    P ? 1.32 : 1.31,
    18,
    6.4
  );

  const sharingEquation = tag(
    '16 ÷ 16 = 1',
    C.green,
    CX,
    P ? -3.61 : -2.16,
    P ? 25 : 22
  );

  const sharingExplanation = txt(
    'Count every cards assignment, including two in one row.',
    P ? 16 : 15,
    C.muted,
    CX,
    P ? -4.33 : -2.72,
    false,
    6.5
  );

  await until(S(33));
  await play(
    ...clearPicture(),

    ...put(sharingHeading),

    lagIn(
      rowTiles,
      0.065,
      1.55
    ),

    ...put(
      sharingEquation,
      sharingExplanation
    ),

    ...say('SHARE SIXTEEN ACROSS SIXTEEN ROWS', C.green),

    ...fbox([
      'Total cards assignments = 16',
      'Number of outcomes = 16',
      ['16 ÷ 16 = 1', C.green],
      'Average count per row'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 34: expected count equals one, not exactly one every time
  // ------------------------------------------------------------

  const equalTiles = LOW_PAIR_COUNTS.map(
    (_, i) => {
      const p = rowTilePosition(i);

      return rowCountTile(
        i,
        1,
        p.x,
        p.y,
        C.green
      );
    }
  );

  const averageNotActual = txt(
    'An equal-share picture of the average, not actual outcomes.',
    P ? 16 : 15,
    C.muted,
    CX,
    P ? -4.33 : -2.72,
    false,
    6.6
  );

  const expectedOne = tag(
    'AVERAGE = ONE STUDENT',
    C.green,
    CX,
    P ? -3.61 : -2.16,
    21,
    6.3
  );

  await until(S(34));
  await play(
    new M.LaggedStart(
      rowTiles.map((tile, i) =>
        new M.Transform(
          tile,
          equalTiles[i]
        )
      ),

      {
        lagRatio: 0.045,
        runTime: 1.50
      }
    ),

    ...replace(
      sharingEquation,
      expectedOne
    ),

    ...replace(
      sharingExplanation,
      averageNotActual
    ),

    ...say('ON AVERAGE, ONE FOUR-SCORER GETS CARDS', C.green),

    ...fbox([
      ['Expected count = 1', C.green],
      'From the pair scoring 4',
      'Actual count can be 0, 1 or 2',
      'Average is not a guarantee'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 35: the earlier-score-eight pair also averages one
  // ------------------------------------------------------------

  // Use the full original table again, with both pair
  // count columns visible and their exact totals.

  table = makeOutcomeTable();

  const lowPairCountsAgain = pairCountColumn('low');
  const highPairCounts = pairCountColumn('high');

  const bothPairOutlines = [
    pairOutline(0, EARLIER),
    pairOutline(2, EARLIER)
  ];

  const bothPairNote = tableFooter(
    'Both score pairs: 16 / 16 = 1 student on average',
    C.green
  );

  const bothPairTotals = [
    txt(
      LOW_TOTAL,
      P ? 18 : 15,
      CARDS,
      LOW_COUNT_X,
      TABLE_BOTTOM - (P ? 0.25 : 0.20),
      true
    ),

    txt(
      HIGH_TOTAL,
      P ? 18 : 15,
      CARDS,
      HIGH_COUNT_X,
      TABLE_BOTTOM - (P ? 0.25 : 0.20),
      true
    )
  ];

  await until(S(35));
  await play(
    ...clearPicture(),

    ...put(
      table.header,
      ...table.rows,
      lowPairCountsAgain,
      highPairCounts
    ),

    ...draw(...bothPairOutlines),

    ...put(
      ...bothPairTotals,
      bothPairNote
    ),

    ...say('THE EIGHT-SCORER PAIR ALSO AVERAGES ONE', C.green),

    ...fbox([
      ['Earlier score 4: 16/16 = 1', EARLIER],
      ['Earlier score 8: 16/16 = 1', EARLIER],
      ['Same expected count', C.green],
      'Not fixed group sizes'
    ], C.green)
  );

  table.footer = bothPairNote;

  // ------------------------------------------------------------
  // 36: why random assignment is useful
  // ------------------------------------------------------------

  const FAIR_COMPARE_Y = P ? -0.72 : -0.40;

  function fairAssignmentPair(
    cx,
    score,
    indices
  ) {
    const w = 3.10;
    const h = P ? 3.80 : 3.02;

    const parts = [
      rounded(
        cx,
        FAIR_COMPARE_Y,
        w,
        h,
        EARLIER
      ),

      txt(
        `EARLIER SCORE: ${score}`,
        P ? 18 : 17,
        EARLIER,
        cx,
        FAIR_COMPARE_Y + h / 2 - 0.31,
        false,
        w - 0.20
      ),

      ...indices.map((i, j) =>
        studentDot(
          i,
          cx + (j - 0.5) * 0.90,
          FAIR_COMPARE_Y + 0.63,
          C.ink,
          false,
          0.95
        )
      ),

      coin(
        cx,
        FAIR_COMPARE_Y - 0.14,
        '?',
        P ? 0.31 : 0.27,
        GOLD
      ),

      arrow(
        cx - 0.15,
        FAIR_COMPARE_Y - 0.44,
        cx - 0.78,
        FAIR_COMPARE_Y - 0.89,
        CARDS,
        0.09
      ),

      arrow(
        cx + 0.15,
        FAIR_COMPARE_Y - 0.44,
        cx + 0.78,
        FAIR_COMPARE_Y - 0.89,
        SHEET,
        0.09
      ),

      txt(
        '1/2',
        P ? 22 : 19,
        CARDS,
        cx - 0.78,
        FAIR_COMPARE_Y - 1.08,
        true
      ),

      txt(
        '1/2',
        P ? 22 : 19,
        SHEET,
        cx + 0.78,
        FAIR_COMPARE_Y - 1.08,
        true
      )
    ];

    return new M.VGroup(...parts);
  }

  const fairPairCards = [
    fairAssignmentPair(
      CX - 1.68,
      4,
      [0, 1]
    ),

    fairAssignmentPair(
      CX + 1.68,
      8,
      [2, 3]
    )
  ];

  const fairLegend = new M.VGroup(
    tag(
      'CARDS',
      CARDS,
      CX - 1.54,
      P ? -3.16 : -2.35,
      17,
      2.5
    ),

    tag(
      'SHEET',
      SHEET,
      CX + 1.54,
      P ? -3.16 : -2.35,
      17,
      2.5
    )
  );

  const noSkillRule = tag(
    'PRIOR SKILL DOES NOT DECIDE THE ACTIVITY',
    C.green,
    CX,
    P ? -4.05 : 1.40,
    P ? 18 : 16,
    6.5
  );

  await until(S(36));
  await play(
    ...clearPicture(),

    ...put(
      ...fairPairCards,
      fairLegend,
      noSkillRule
    ),

    ...say('USE CHANCE, NOT PRIOR SKILL, TO ASSIGN ACTIVITIES', C.green),

    ...fbox([
      ['Random assignment', C.green],
      'Same assignment chance',
      'Whatever earlier score',
      'Avoid skill-based selection'
    ], C.green)
  );

  // ------------------------------------------------------------
  // 37: trap — the uneven assignment remains possible
  // ------------------------------------------------------------

  table = makeOutcomeTable();

  const unevenOutline = rowOutline(
    UNEVEN_ROW,
    EARLIER
  );

  const unevenCells = [0, 1, 2, 3].map(
    j =>
      cellOutline(
        UNEVEN_ROW,
        j,
        activityColor(
          OUTCOMES[UNEVEN_ROW][j]
        )
      )
  );

  const unevenNote = tableFooter(
    `Row ${UNEVEN_ROW + 1}: T T H H`,
    EARLIER
  );

  await until(S(37));
  await play(
    ...clearPicture(),

    ...put(
      table.header,
      ...table.rows
    ),

    ...draw(
      unevenOutline,
      ...unevenCells
    ),

    ...put(unevenNote),

    ...say('ONE ROW STILL GIVES BOTH HIGHER SCORERS CARDS', EARLIER),

    ...fbox([
      ['One possible row', EARLIER],
      ['S1, S2: T T', SHEET],
      ['S3, S4: H H', CARDS],
      'The original uneven split'
    ], EARLIER)
  );

  table.footer = unevenNote;

  // ------------------------------------------------------------
  // 38: exactly the same starting imbalance
  // ------------------------------------------------------------

  // Show the same assignments under two different mechanisms.
  //
  // Self-selection: the students choose according to the
  // hypothetical choices given at the start of the lesson.
  //
  // Random assignment: one possible set of fair flips
  // happens to produce those same groups.

  function unevenComparison(
    cx, cy, w, h,
    title, mechanism
  ) {
    const parts = [
      rounded(
        cx,
        cy,
        w,
        h,
        EARLIER
      ),

      txt(
        title,
        P ? 18 : 16,
        EARLIER,
        cx,
        cy + h / 2 - 0.25,
        false,
        w - 0.20
      )
    ];

    const innerW = w / 2 - 0.18;

    const gy = cy + 0.02;

    const cardX = cx - w / 4;
    const sheetX = cx + w / 4;

    const descriptions = [
      {
        side: 'H',
        x: cardX,
        label: 'CARDS',
        indices: [2, 3],
        mean: 8
      },

      {
        side: 'T',
        x: sheetX,
        label: 'SHEET',
        indices: [0, 1],
        mean: 4
      }
    ];

    descriptions.forEach(d => {
      const color = activityColor(d.side);

      parts.push(
        rounded(
          d.x,
          gy,
          innerW,
          P ? 1.38 : 1.49,
          color,
          color,
          0.045
        ),

        txt(
          d.label,
          P ? 16 : 14,
          color,
          d.x,
          gy + 0.47,
          false,
          innerW - 0.09
        )
      );

      d.indices.forEach((index, j) => {
        parts.push(
          studentDot(
            index,
            d.x + (j - 0.5) *
              (P ? 0.62 : 0.46),
            gy - 0.09,
            color,
            true,
            P ? 0.60 : 0.48
          )
        );
      });

      parts.push(
        txt(
          `Mean ${d.mean}`,
          P ? 17 : 14,
          color,
          d.x,
          gy - 0.48,
          true,
          innerW - 0.08
        )
      );
    });

    parts.push(
      txt(
        mechanism,
        P ? 16 : 14,
        C.muted,
        cx,
        cy - h / 2 + 0.43,
        false,
        w - 0.20
      ),

      txt(
        'Starting gap = 4',
        P ? 19 : 17,
        EARLIER,
        cx,
        cy - h / 2 + 0.16,
        true,
        w - 0.20
      )
    );

    return new M.VGroup(...parts);
  }

  const unevenSelfChoice = unevenComparison(
    P ? CX : CX - 1.74,
    P ? -0.11 : -0.44,
    P ? 6.15 : 3.26,
    P ? 2.72 : 3.20,
    'SELF-SELECTION',
    'Students choose'
  );

  const unevenByChance = unevenComparison(
    P ? CX : CX + 1.74,
    P ? -3.12 : -0.44,
    P ? 6.15 : 3.26,
    P ? 2.72 : 3.20,
    'RANDOM ASSIGNMENT',
    'One possible coin outcome'
  );

  const sameUnevenSplit = tag(
    'SAME GROUPS, DIFFERENT ASSIGNMENT RULE',
    EARLIER,
    CX,
    P ? 1.52 : 1.41,
    P ? 17 : 15,
    6.5
  );

  await until(S(38));
  await play(
    ...clearPicture(),

    ...put(
      sameUnevenSplit,
      unevenSelfChoice,
      unevenByChance
    ),

    ...say('THE SAME UNEVEN SPLIT CAN OCCUR BY CHANCE', EARLIER),

    ...fbox([
      ['Cards earlier mean = 8', CARDS],
      ['Sheet earlier mean = 4', SHEET],
      ['Gap = 4 points', EARLIER],
      'Even after fair assignment'
    ], EARLIER)
  );

  // ------------------------------------------------------------
  // 39: the exact probability is one in sixteen
  // ------------------------------------------------------------

  const PROB_Y = P ? -1.19 : -0.54;

  const PROB_SP_X = P ? 1.47 : 1.55;
  const PROB_SP_Y = P ? 0.92 : 0.66;

  function outcomeTile(row, i) {
    const col = i % 4;
    const r = Math.floor(i / 4);

    const x = CX + (col - 1.5) * PROB_SP_X;
    const y = PROB_Y + (1.5 - r) * PROB_SP_Y;

    const highlighted = i === UNEVEN_ROW;

    const color = highlighted
      ? EARLIER
      : C.muted;

    const parts = [
      rounded(
        x,
        y,
        PROB_SP_X - 0.10,
        PROB_SP_Y - 0.075,
        color,
        highlighted ? EARLIER : C.card,
        highlighted ? 0.15 : 0.65
      ),

      txt(
        i + 1,
        P ? 12 : 11,
        color,
        x,
        y + PROB_SP_Y * 0.23,
        true
      )
    ];

    row.forEach((side, j) => {
      parts.push(
        txt(
          side,
          P ? 17 : 15,
          activityColor(side),
          x + (j - 1.5) * 0.25,
          y - PROB_SP_Y * 0.13,
          true
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const probabilityTiles = OUTCOMES.map(outcomeTile);

  const selectedTilePosition = {
    x: CX +
      (UNEVEN_ROW % 4 - 1.5) * PROB_SP_X,

    y: PROB_Y +
      (1.5 - Math.floor(UNEVEN_ROW / 4)) *
      PROB_SP_Y
  };

  const singleOutcomeOutline = rounded(
    selectedTilePosition.x,
    selectedTilePosition.y,
    PROB_SP_X - 0.035,
    PROB_SP_Y - 0.015,
    EARLIER,
    EARLIER,
    0.025
  );

  const oneOfSixteen = tag(
    '1 / 16 = 6.25%',
    EARLIER,
    CX,
    P ? -3.66 : -2.30,
    P ? 25 : 22,
    5.8
  );

  const probabilityHeading = tag(
    'ONE PARTICULAR UNEVEN SPLIT',
    EARLIER,
    CX,
    P ? 1.32 : 1.33,
    18,
    6.4
  );

  const chanceNotZero = txt(
    'Small, but not impossible.',
    P ? 20 : 18,
    C.muted,
    CX,
    P ? -4.32 : -2.78
  );

  await until(S(39));
  await play(
    ...clearPicture(),

    ...put(probabilityHeading),

    lagIn(
      probabilityTiles,
      0.055,
      1.60
    ),

    ...draw(singleOutcomeOutline),

    ...put(
      oneOfSixteen,
      chanceNotZero
    ),

    ...say('THE ORIGINAL SPLIT HAS A ONE-IN-SIXTEEN CHANCE', EARLIER),

    ...fbox([
      'P(T T H H)',
      '= 1/2 × 1/2 × 1/2 × 1/2',
      ['= 1/16 = 6.25%', EARLIER],
      'Fair does not mean balanced'
    ], EARLIER)
  );

  // ------------------------------------------------------------
  // 40: final visual summary
  // ------------------------------------------------------------

  // Every student has the same two possible assignment
  // probabilities, regardless of earlier quiz score.
  //
  // The picture below shows opportunities for assignment,
  // not four students physically occupying both groups.
  //
  // Actual assignments are determined by separate coin flips.

  const FINAL_TOP = P ? 0.96 : 1.02;

  const FINAL_COIN_Y = P ? -0.30 : -0.12;

  const FINAL_DEST_Y = P ? -2.42 : -1.53;

  const FINAL_SP = P ? 1.56 : 1.63;

  const finalX = i =>
    CX + (i - 1.5) * FINAL_SP;

  function finalStudentColumn(i) {
    const x = finalX(i);

    const parts = [
      rounded(
        x,
        P ? -0.79 : -0.43,
        FINAL_SP - 0.13,
        P ? 3.80 : 2.96,
        C.muted,
        C.card,
        0.45
      ),

      txt(
        `Earlier: ${SCORES[i]}`,
        P ? 17 : 15,
        EARLIER,
        x,
        FINAL_TOP - 0.08,
        true,
        FINAL_SP - 0.20
      ),

      glow(
        x,
        FINAL_TOP - 0.53,
        C.ink,
        0.13
      ),

      txt(
        `S${i + 1}`,
        15,
        C.ink,
        x + 0.38,
        FINAL_TOP - 0.53,
        true
      ),

      coin(
        x,
        FINAL_COIN_Y,
        '?',
        P ? 0.27 : 0.23,
        GOLD
      ),

      arrow(
        x - 0.08,
        FINAL_COIN_Y - 0.27,
        x - 0.37,
        FINAL_DEST_Y + 0.73,
        CARDS,
        0.085
      ),

      arrow(
        x + 0.08,
        FINAL_COIN_Y - 0.27,
        x + 0.37,
        FINAL_DEST_Y + 0.73,
        SHEET,
        0.085
      ),

      rounded(
        x - 0.36,
        FINAL_DEST_Y + 0.42,
        0.59,
        P ? 0.48 : 0.36,
        CARDS,
        CARDS,
        0.10
      ),

      rounded(
        x + 0.36,
        FINAL_DEST_Y + 0.42,
        0.59,
        P ? 0.48 : 0.36,
        SHEET,
        SHEET,
        0.10
      ),

      txt(
        '1/2',
        P ? 17 : 15,
        CARDS,
        x - 0.36,
        FINAL_DEST_Y + 0.42,
        true,
        0.49
      ),

      txt(
        '1/2',
        P ? 17 : 15,
        SHEET,
        x + 0.36,
        FINAL_DEST_Y + 0.42,
        true,
        0.49
      ),

      txt(
        'H',
        14,
        CARDS,
        x - 0.36,
        FINAL_DEST_Y - 0.03,
        true
      ),

      txt(
        'T',
        14,
        SHEET,
        x + 0.36,
        FINAL_DEST_Y - 0.03,
        true
      )
    ];

    return new M.VGroup(...parts);
  }

  const finalColumns = SCORES.map(
    (_, i) => finalStudentColumn(i)
  );

  const finalActivityLegend = new M.VGroup(
    tag(
      'H = QUIZ CARDS',
      CARDS,
      CX - 1.67,
      P ? -3.24 : -2.17,
      P ? 18 : 16,
      3.05
    ),

    tag(
      'T = REVIEW SHEET',
      SHEET,
      CX + 1.67,
      P ? -3.24 : -2.17,
      P ? 18 : 16,
      3.05
    )
  );

  const finalTitle = tag(
    'SAME CHANCE FOR EVERY STUDENT',
    C.green,
    CX,
    P ? 1.51 : 1.43,
    P ? 18 : 16,
    6.45
  );

  const finalRule = tag(
    'CHANCE ASSIGNS THE ACTIVITY',
    C.green,
    CX,
    P ? -4.05 : -2.72,
    P ? 21 : 17,
    6.5
  );

  const finalCaveat = txt(
    'Equal chances do not guarantee equal groups.',
    P ? 17 : 15,
    C.muted,
    CX,
    P ? -4.74 : -3.3,
    false,
    6.6
  );

  await until(S(40));
  await play(
    ...clearPicture(),

    ...put(finalTitle),

    lagIn(
      finalColumns,
      0.15,
      1.55
    ),

    ...put(
      finalActivityLegend,
      finalRule,
      finalCaveat
    ),

    ...say('EQUAL CHANCE, WHATEVER THE SCORE', C.green),

    ...fbox([
      ['P(cards) = 1/2', CARDS],
      ['P(sheet) = 1/2', SHEET],
      'Whatever the earlier score',
      ['Equal chance, not guaranteed balance', C.green]
    ], C.green)
  );
}
