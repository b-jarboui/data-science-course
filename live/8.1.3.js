// lesson 8.1.3
// Blocking: compare activities by assigning students within similar pairs.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied engine conventions; browser playback has not been tested.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const CARDS = C.cyan;
  const SHEET = C.pink || '#F472B6';

  const EARLIER = [4, 4, 8, 8];
  const NAMES = ['A', 'B', 'C', 'D'];

  const CX = P ? 0 : -2.6;
  const SP = P ? 1.68 : 1.72;

  const PILL = P ? [0, 3.65, 0] : [CX, 1.98, 0];
  const BOXP = P ? [0, -4.3, 0] : [4.3, -0.3, 0];

  const DESK_Y = P ? 0.55 : -0.35;
  const DOT_Y = DESK_Y + 0.6;

  const PAIR_Y = P ? [1.35, -0.65] : [0.65, -1.05];
  const PAIR_DX = P ? 1.65 : 1.75;
  const PAIR_W = P ? 6.25 : 6.35;
  const PAIR_H = P ? 1.58 : 1.38;

  const BASE = P ? -1.65 : -1.65;
  const PITCH = P ? 0.34 : 0.24;
  const BW = P ? 0.74 : 0.72;

  const PERSON_Y = BASE - 0.35;
  const PRIOR_Y = BASE - 0.83;

  const SCORE_Y = P ? 2.06 : 1.02;
  const GROUP_Y = P ? 2.78 : 1.57;

  const colx = k => CX + (k - 1.5) * SP;

  const groupX = [
    (colx(0) + colx(1)) / 2,
    (colx(2) + colx(3)) / 2
  ];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const fi = (o, runTime = 0.4) =>
    new M.FadeIn(o, { runTime });

  const fo = (o, runTime = 0.4) =>
    new M.FadeOut(o, { runTime });

  const hide = (...objects) =>
    objects.filter(Boolean).map(o => fo(o));

  function txt(s, size, color, x, y, bold = false, maxw = null) {
    const t = T(s, size, color, bold);

    if (maxw && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);

    return t;
  }

  function rect(x, y, w, h, color, opacity = 0, strokeWidth = 2) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.12,
      color,
      strokeWidth
    });

    r.setFill(color, opacity);
    r.moveTo([x, y, 0]);

    return r;
  }

  function tag(s, color, x, y, size = 17, maxw = null) {
    const t = pill(s, color, size);

    if (maxw && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);

    return t;
  }

  // Formula box: lines = ['text' | ['text', color]].
  // Leading spaces indent a line.
  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.42 : 0.40;

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

    const left = BOXP[0] - wd / 2 + 0.325;
    const top = BOXP[1] + ht / 2 - 0.2 - lh / 2;

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
    const maxw = P ? FW - 1.2 : 4.0;

    if (wd > maxw) g.scale(maxw / wd);

    const a = [fi(g)];

    if (boxNow) a.push(fo(boxNow));

    boxNow = g;

    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [fo(old)];
  }

  // ------------------------------------------------------------
  // Visual helpers.
  // ------------------------------------------------------------

  function student(k, x, y) {
    const halo = new M.Circle({
      radius: 0.25,
      color: C.ink,
      strokeWidth: 1
    });

    halo.setFill(C.ink, 0.10);
    halo.moveTo([x - 0.16, y, 0]);

    const dot = new M.Dot({
      point: [x - 0.16, y, 0],
      radius: 0.14,
      color: C.ink
    });

    const name = txt(
      NAMES[k], 17, C.ink,
      x + 0.18, y, true
    );

    return new M.VGroup(halo, dot, name);
  }

  // Amber always denotes an earlier quiz score.
  function prior(k, x, y, compact = false) {
    return txt(
      compact ? `Earlier: ${EARLIER[k]}` : String(EARLIER[k]),
      compact ? 15 : 23,
      C.amber,
      x,
      y,
      true,
      compact ? SP - 0.12 : null
    );
  }

  function desk(x, y) {
    const top = new M.RoundedRectangle({
      width: 1.28,
      height: 0.57,
      cornerRadius: 0.10,
      color: C.muted,
      strokeWidth: 2
    });

    top.setFill(C.card, 0.95);
    top.moveTo([x, y, 0]);

    const edge = new M.Line({
      start: [x - 0.52, y - 0.17, 0],
      end: [x + 0.52, y - 0.17, 0],
      color: C.muted,
      strokeWidth: 1
    });

    return new M.VGroup(top, edge);
  }

  function cards(x, y) {
    const back = rect(
      x - 0.13, y + 0.10,
      1.05, 0.68,
      CARDS, 0.12, 1.5
    );

    const front = rect(
      x + 0.08, y - 0.04,
      1.05, 0.68,
      CARDS, 0.24, 2
    );

    const q = txt(
      '?', 27, CARDS,
      x + 0.08, y - 0.04, true
    );

    return new M.VGroup(back, front, q);
  }

  function sheet(x, y) {
    const paper = rect(
      x, y,
      1.12, 0.79,
      SHEET, 0.17, 2
    );

    const lines = Array.from({ length: 3 }, (_, j) =>
      new M.Line({
        start: [x - 0.35, y + 0.20 - j * 0.20, 0],
        end: [x + 0.35, y + 0.20 - j * 0.20, 0],
        color: SHEET,
        strokeWidth: 2
      })
    );

    return new M.VGroup(paper, ...lines);
  }

  function coin(x, y, face = '?', color = C.amber) {
    const outer = new M.Circle({
      radius: 0.29,
      color,
      strokeWidth: 2
    });

    outer.setFill(color, 0.20);
    outer.moveTo([x, y, 0]);

    const inner = new M.Circle({
      radius: 0.22,
      color,
      strokeWidth: 1
    });

    inner.moveTo([x, y, 0]);

    const letter = txt(
      face, 20, color,
      x, y, true
    );

    return new M.VGroup(outer, inner, letter);
  }

  function pairBox(j, color = C.violet) {
    const outline = new M.RoundedRectangle({
      width: PAIR_W,
      height: PAIR_H,
      cornerRadius: 0.16,
      color,
      strokeWidth: 2
    });

    outline.setFill(C.card, 0.28);
    outline.moveTo([CX, PAIR_Y[j], 0]);

    const label = txt(
      `Earlier score: ${j === 0 ? 4 : 8}`,
      P ? 17 : 16,
      color,
      CX,
      PAIR_Y[j] + PAIR_H / 2 - 0.22,
      true
    );

    return new M.VGroup(outline, label);
  }

  // Every point is a separate glowing block.
  function block(p, color, ghost = false) {
    const glow = new M.Rectangle({
      width: BW + 0.09,
      height: PITCH * 0.96,
      color,
      strokeWidth: 1
    });

    glow.setFill(color, ghost ? 0.03 : 0.13);
    glow.moveTo(p);

    const core = new M.Rectangle({
      width: BW,
      height: PITCH * 0.76,
      color,
      strokeWidth: ghost ? 1 : 1.5
    });

    core.setFill(color, ghost ? 0.19 : 0.86);
    core.moveTo(p);

    return new M.VGroup(glow, core);
  }

  const slot = (k, j) => [
    colx(k),
    BASE + (j + 0.5) * PITCH,
    0
  ];

  function stack(n, k, color, ghost = false) {
    return Array.from({ length: n }, (_, j) =>
      block(slot(k, j), color, ghost)
    );
  }

  function reveal(blocks, runTime = 0.85) {
    return new M.LaggedStart(
      blocks.map(b => fi(b, 0.25)),
      {
        lagRatio: 0.10,
        runTime
      }
    );
  }

  // The first two columns belong to the sheet group.
  // The last two columns belong to the cards group.
  const colColor = k => k < 2 ? SHEET : CARDS;

  const students = NAMES.map((_, k) =>
    student(k, colx(k), DOT_Y)
  );

  const priors = NAMES.map((_, k) =>
    prior(k, colx(k), DOT_Y + 0.46)
  );

  function moveStudent(k, x, y, priorY, compact = false, runTime = 0.7) {
    return [
      new M.Transform(
        students[k],
        student(k, x, y),
        { runTime }
      ),
      new M.Transform(
        priors[k],
        prior(k, x, priorY, compact),
        { runTime }
      )
    ];
  }

  function moveToPair(k, row, side, runTime = 0.7) {
    const x = CX + side * PAIR_DX;
    const y = PAIR_Y[row] - 0.21;

    return moveStudent(
      k, x, y, y + 0.40, false, runTime
    );
  }

  // order[k] is the student occupying activity column k.
  function arrange(order, runTime = 0.85) {
    return order.flatMap((id, k) =>
      moveStudent(
        id,
        colx(k),
        PERSON_Y,
        PRIOR_Y,
        true,
        runTime
      )
    );
  }

  // ------------------------------------------------------------
  // 0-1: the problem of putting both higher scorers together.
  // ------------------------------------------------------------

  const introSheet = sheet(groupX[0], P ? 0.8 : 0.1);
  const introCards = cards(groupX[1], P ? 0.8 : 0.1);

  const introLabels = [
    txt(
      'Review sheet', 20, SHEET,
      groupX[0], P ? -0.05 : -0.75, true
    ),
    txt(
      'Quiz cards', 20, CARDS,
      groupX[1], P ? -0.05 : -0.75, true
    )
  ];

  const introDots = NAMES.map((_, k) =>
    student(k, colx(k), P ? -1.4 : -1.65)
  );

  await until(S(0));

  await play(
    fi(introSheet),
    fi(introCards),
    ...introLabels.map(t => fi(t)),
    new M.LaggedStart(
      introDots.map(d => fi(d)),
      { lagRatio: 0.12, runTime: 0.9 }
    ),
    ...say('TWO ACTIVITIES, FOUR STUDENTS')
  );

  const risk = tag(
    'BOTH HIGHER SCORERS TOGETHER?',
    C.amber,
    CX,
    P ? 2.15 : 1.1,
    18,
    6.5
  );

  await until(S(1));

  await play(
    fi(risk),
    ...say('CAN WE PREVENT AN UNEVEN START?', C.amber)
  );

  // ------------------------------------------------------------
  // 2-4: four desks with earlier quiz scores.
  // ------------------------------------------------------------

  const desks = NAMES.map((_, k) =>
    desk(colx(k), DESK_Y)
  );

  const earlierTitle = tag(
    'EARLIER QUIZ · BEFORE PRACTICE',
    C.amber,
    CX,
    P ? 2.45 : 1.30,
    17,
    6.5
  );

  await until(S(2));

  await play(
    ...hide(
      introSheet,
      introCards,
      ...introLabels,
      ...introDots,
      risk
    ),
    ...desks.map(d => fi(d)),
    ...students.map(d => fi(d)),
    fi(earlierTitle),
    ...say('START WITH THE EARLIER QUIZ', C.amber)
  );

  await until(S(3));

  await play(
    fi(priors[0]),
    fi(priors[1]),
    ...say('TWO STUDENTS STARTED AT 4', C.amber)
  );

  await until(S(4));

  await play(
    fi(priors[2]),
    fi(priors[3]),
    ...say('TWO STUDENTS STARTED AT 8', C.amber)
  );

  // ------------------------------------------------------------
  // 5-8: form two blocks of students with similar starting scores.
  // ------------------------------------------------------------

  let pairFrames = [pairBox(0), pairBox(1)];

  await until(S(5));

  await play(
    ...hide(...desks, earlierTitle),
    fi(pairFrames[0]),
    ...moveToPair(0, 0, -1),
    ...moveToPair(1, 0, 1),
    ...say('PUT THE TWO 4s INTO ONE BOX', C.violet)
  );

  await until(S(6));

  await play(
    fi(pairFrames[1]),
    ...moveToPair(2, 1, -1),
    ...moveToPair(3, 1, 1),
    ...say('PUT THE TWO 8s INTO ANOTHER BOX', C.violet)
  );

  await until(S(7));

  await play(
    new M.Indicate(pairFrames[0], {
      color: C.violet,
      runTime: 0.75
    }),
    new M.Indicate(pairFrames[1], {
      color: C.violet,
      runTime: 0.75
    }),
    ...fbox([
      ['Similar starting scores', C.violet],
      'First pair: 4 and 4',
      'Second pair: 8 and 8'
    ], C.violet),
    ...say('EACH PAIR HAS THE SAME STARTING SCORE', C.violet)
  );

  await until(S(8));

  await play(
    new M.Indicate(pairFrames[0], {
      color: C.amber,
      runTime: 0.8
    }),
    ...say('START WITH THE FIRST PAIR', C.amber)
  );

  // ------------------------------------------------------------
  // 9-12: one independent fair coin flip inside each pair.
  // Heads: first student to cards, second to sheet.
  // Tails: first student to sheet, second to cards.
  // ------------------------------------------------------------

  const coinY = row => PAIR_Y[row] - 0.17;

  const coins = [
    coin(CX, coinY(0)),
    coin(CX, coinY(1))
  ];

  await until(S(9));

  await play(
    fi(coins[0]),
    ...fbox([
      ['One fair coin per pair', C.amber],
      'Heads: 1 in 2',
      'Tails: 1 in 2'
    ], C.amber),
    ...say('ONE COIN FOR THE WHOLE PAIR', C.amber)
  );

  const ruleY = P ? 2.65 : -2.36;

  const leftRule = tag(
    'REVIEW SHEET',
    SHEET,
    CX - PAIR_DX,
    ruleY,
    16,
    2.8
  );

  const rightRule = tag(
    'QUIZ CARDS',
    CARDS,
    CX + PAIR_DX,
    ruleY,
    16,
    2.8
  );

  await until(S(10));

  await play(
    fi(leftRule),
    fi(rightRule),

    new M.Transform(
      coins[0],
      coin(CX, coinY(0), 'H'),
      { runTime: 0.55 }
    ),

    ...moveToPair(0, 0, 1),
    ...moveToPair(1, 0, -1),

    ...fbox([
      ['If heads:', C.amber],
      ['A → cards', CARDS],
      ['B → sheet', SHEET]
    ], C.amber),

    ...say('HEADS: FIRST TO CARDS, SECOND TO SHEET', C.amber)
  );

  await until(S(11));

  await play(
    new M.Transform(
      coins[0],
      coin(CX, coinY(0), 'T'),
      { runTime: 0.45 }
    ),

    ...moveToPair(0, 0, -1, 0.6),
    ...moveToPair(1, 0, 1, 0.6),

    ...fbox([
      ['If tails:', C.amber],
      ['A → sheet', SHEET],
      ['B → cards', CARDS]
    ], C.amber),

    ...say('TAILS: SWAP THEIR ACTIVITIES', C.amber)
  );

  // Illustrative realised draw:
  // First pair = tails; second pair = heads.
  // Sheet receives A and D; cards receives B and C.
  const BLOCKED = [0, 3, 1, 2];
  const SWAPPED = [1, 2, 0, 3];
  const UNBLOCKED = [0, 1, 2, 3];

  await until(S(12));

  await play(
    fi(coins[1]),

    ...fbox([
      ['Example draw', C.amber],
      'First pair: tails',
      'Flip again for second pair'
    ], C.amber),

    ...say('A SEPARATE FLIP FOR THE OTHER PAIR', C.amber)
  );

  await play(
    new M.Transform(
      coins[1],
      coin(CX, coinY(1), 'H'),
      { runTime: 0.4 }
    ),

    ...moveToPair(2, 1, 1, 0.65),
    ...moveToPair(3, 1, -1, 0.65)
  );

  // ------------------------------------------------------------
  // 13-15: the activities have comparable starting scores.
  // ------------------------------------------------------------

  function activityHeading(g, suffix = '') {
    const color = g === 0 ? SHEET : CARDS;
    const name = g === 0 ? 'SHEET' : 'CARDS';

    return tag(
      name + suffix,
      color,
      groupX[g],
      GROUP_Y,
      17,
      3.15
    );
  }

  let headings = [
    activityHeading(0),
    activityHeading(1)
  ];

  const groupOutlineY = (PERSON_Y + PRIOR_Y) / 2;

  function activityOutline(g, color = colColor(g * 2)) {
    return rect(
      groupX[g],
      groupOutlineY,
      SP * 2 - 0.18,
      1.03,
      color,
      0,
      2
    );
  }

  let groupOutlines = [
    activityOutline(0),
    activityOutline(1)
  ];

  const priorMeans = [
    tag(
      'EARLIER MEAN = 6',
      C.amber,
      groupX[0],
      P ? 0.60 : -0.2,
      16,
      3.15
    ),
    tag(
      'EARLIER MEAN = 6',
      C.amber,
      groupX[1],
      P ? 0.60 : -0.2,
      16,
      3.15
    )
  ];

  await until(S(13));

  await play(
    ...hide(...pairFrames, ...coins, leftRule, rightRule),
    ...arrange(BLOCKED),
    ...headings.map(t => fi(t)),
    ...groupOutlines.map(r => fi(r)),
    ...priorMeans.map(t => fi(t)),

    ...fbox([
      ['Balanced starting scores', C.green],
      ['Sheet: 4 and 8', SHEET],
      ['Cards: 4 and 8', CARDS],
      'Both averages = 6'
    ], C.green),

    ...say('EACH ACTIVITY GETS ONE 4 AND ONE 8', C.green)
  );

  await until(S(14));

  await play(
    ...fbox([
      ['Blocking', C.violet],
      'First: group similar students',
      'Then: assign by chance',
      'inside each group'
    ], C.violet),
    ...say('GROUP FIRST, RANDOMISE INSIDE: BLOCKING', C.violet)
  );

  // Briefly restore the original pair diagram so that a "block"
  // cannot be confused with an activity group.
  pairFrames = [pairBox(0), pairBox(1)];

  const blockTags = [
    tag(
      'BLOCK 1', C.violet,
      CX, PAIR_Y[0] - 0.2,
      16, 1.8
    ),
    tag(
      'BLOCK 2', C.violet,
      CX, PAIR_Y[1] - 0.2,
      16, 1.8
    )
  ];

  await until(S(15));

  await play(
    ...hide(...headings, ...groupOutlines, ...priorMeans),

    ...moveToPair(0, 0, -1),
    ...moveToPair(1, 0, 1),
    ...moveToPair(2, 1, 1),
    ...moveToPair(3, 1, -1),

    ...pairFrames.map(r => fi(r)),
    ...blockTags.map(t => fi(t)),

    ...fbox([
      ['A block', C.violet],
      'Students grouped by',
      'something in common:',
      ['here, their earlier score', C.amber]
    ], C.violet),

    ...say('A BLOCK IS A GROUP OF SIMILAR STUDENTS', C.violet)
  );

  // ------------------------------------------------------------
  // 16-19: introduce the imagined later quiz outcomes.
  // The sheet potential outcomes are 4 and 8.
  // Cards add 2 points in either starting-score band.
  // ------------------------------------------------------------

  headings = [
    activityHeading(0),
    activityHeading(1)
  ];

  const floor = new M.Line({
    start: [colx(0) - SP / 2, BASE, 0],
    end: [colx(3) + SP / 2, BASE, 0],
    color: C.muted,
    strokeWidth: 2
  });

  const separator = new M.DashedLine({
    start: [CX, BASE - 0.95, 0],
    end: [CX, GROUP_Y - 0.36, 0],
    color: C.muted,
    strokeWidth: 1.5
  });

  const exampleBlock = block(
    [CX, P ? 0.15 : -0.05, 0],
    C.ink
  );

  const exampleNote = txt(
    '1 glowing block = 1 later quiz point',
    P ? 19 : 18,
    C.muted,
    CX,
    P ? -0.55 : -0.62,
    false,
    6.5
  );

  await until(S(16));

  await play(
    ...hide(...pairFrames, ...blockTags),
    ...arrange(BLOCKED),
    ...headings.map(t => fi(t)),
    new M.Create(floor),
    new M.Create(separator),
    fi(exampleBlock),
    fi(exampleNote),

    ...fbox([
      ['Later quiz', C.ink],
      'Same quiz for everyone',
      'Worth 10 points',
      ['Imagined results', C.violet]
    ], C.violet),

    ...say('LATER QUIZ: EACH BLOCK IS ONE POINT', C.ink)
  );

  const ghostStacks = [
    stack(4, 0, SHEET, true),
    stack(8, 1, SHEET, true),
    stack(4, 2, SHEET, true),
    stack(8, 3, SHEET, true)
  ];

  function scoreText(k, s, color = colColor(k), size = 20) {
    return txt(
      String(s),
      size,
      color,
      colx(k),
      SCORE_Y,
      true,
      SP - 0.1
    );
  }

  let scoreLabels = [
    scoreText(0, 'If sheet: 4', SHEET, 15),
    scoreText(1, 'If sheet: 8', SHEET, 15),
    scoreText(2, 'If sheet: 4', SHEET, 15),
    scoreText(3, 'If sheet: 8', SHEET, 15)
  ];

  const potentialNote = txt(
    'Imagined scores if everyone used the sheet',
    P ? 17 : 16,
    SHEET,
    CX,
    P ? -3.12 : -2.79,
    true,
    6.4
  );

  await until(S(17));

  await play(
    ...hide(exampleBlock, exampleNote),
    reveal(ghostStacks[0]),
    reveal(ghostStacks[2]),
    fi(scoreLabels[0]),
    fi(scoreLabels[2]),
    fi(potentialNote),

    ...fbox([
      ['First starting-score pair', C.amber],
      'Both started at 4',
      ['With the sheet: 4 points', SHEET]
    ], SHEET),

    ...say('FIRST PAIR: IMAGINE 4 WITH THE SHEET', SHEET)
  );

  await until(S(18));

  await play(
    reveal(ghostStacks[1]),
    reveal(ghostStacks[3]),
    fi(scoreLabels[1]),
    fi(scoreLabels[3]),

    ...fbox([
      ['Second starting-score pair', C.amber],
      'Both started at 8',
      ['With the sheet: 8 points', SHEET]
    ], SHEET),

    ...say('SECOND PAIR: IMAGINE 8 WITH THE SHEET', SHEET)
  );

  const additions = [2, 3].map(k => {
    const n = k === 2 ? 4 : 8;

    const outline = rect(
      colx(k),
      BASE + (n + 1) * PITCH,
      BW + 0.20,
      2 * PITCH,
      C.amber,
      0.04,
      2
    );

    const plus = txt(
      '+2', 16, C.amber,
      colx(k),
      BASE + (n + 1) * PITCH,
      true
    );

    return new M.VGroup(outline, plus);
  });

  await until(S(19));

  await play(
    ...additions.map(a => fi(a)),

    ...fbox([
      ['Fixed example', C.violet],
      ['Cards add 2 points', CARDS],
      'For the first pair',
      'And for the second pair'
    ], C.amber),

    ...say('IN THIS EXAMPLE, CARDS ADD 2 FOR ANY STUDENT', C.amber)
  );

  // ------------------------------------------------------------
  // 20-23: reveal the later scores under the blocked assignment.
  // Column order: sheet 4, sheet 8, cards 6, cards 10.
  // ------------------------------------------------------------

  let stacks = [[], [], [], []];

  function replaceLabel(k, s, color = colColor(k), size = 22) {
    const next = scoreText(k, s, color, size);
    const a = [fi(next)];

    if (scoreLabels[k]) a.push(fo(scoreLabels[k]));

    scoreLabels[k] = next;

    return a;
  }

  function realise(k, n) {
    const a = [];

    // Remove the hypothetical sheet stack in this column.
    a.push(...hide(...ghostStacks[k]));
    ghostStacks[k] = [];

    stacks[k] = stack(n, k, colColor(k));

    a.push(reveal(stacks[k], 0.85));
    a.push(...replaceLabel(k, n));

    return a;
  }

  await until(S(20));

  await play(
    fo(additions[0]),
    ...realise(2, 6),

    ...fbox([
      ['First pair: cards student', CARDS],
      '4 + 2',
      ['= 6 later points', CARDS]
    ], CARDS),

    ...say('FIRST PAIR WITH CARDS: 6 POINTS', CARDS)
  );

  await until(S(21));

  await play(
    fo(additions[1]),
    ...realise(3, 10),

    ...fbox([
      ['Second pair: cards student', CARDS],
      '8 + 2',
      ['= 10 later points', CARDS]
    ], CARDS),

    ...say('SECOND PAIR WITH CARDS: 10 POINTS', CARDS)
  );

  await until(S(22));

  await play(
    ...realise(0, 4),

    ...fbox([
      ['First pair: sheet student', SHEET],
      ['4 later points', SHEET]
    ], SHEET),

    ...say('FIRST PAIR WITH THE SHEET: 4 POINTS', SHEET)
  );

  const laterNote = txt(
    'Later quiz scores · out of 10',
    P ? 18 : 17,
    C.muted,
    CX,
    P ? -3.12 : -2.79,
    true
  );

  await until(S(23));

  await play(
    ...realise(1, 8),
    fo(potentialNote),
    fi(laterNote),

    ...fbox([
      ['Later quiz results', C.ink],
      ['Cards: 6 and 10', CARDS],
      ['Sheet: 4 and 8', SHEET]
    ]),

    ...say('SECOND PAIR WITH THE SHEET: 8 POINTS', SHEET)
  );

  // ------------------------------------------------------------
  // 24-28: find each activity group's mean by equal sharing.
  // Move two blocks from each taller stack to its shorter stack.
  // ------------------------------------------------------------

  const averageFrames = [0, 1].map(g =>
    rect(
      groupX[g],
      BASE + 5 * PITCH,
      SP * 2 - 0.14,
      10 * PITCH + 0.16,
      g === 0 ? SHEET : CARDS,
      0,
      1.5
    )
  );

  await until(S(24));

  await play(
    ...averageFrames.map(r => fi(r)),

    ...fbox([
      ['Average = fair share', C.green],
      'Keep the same total',
      'Share it equally',
      'among the students'
    ], C.green),

    ...say('AVERAGE: SHARE THE GROUP TOTAL EQUALLY', C.green)
  );

  await until(S(25));

  await play(
    new M.Indicate(scoreLabels[2], {
      color: CARDS,
      runTime: 0.65
    }),
    new M.Indicate(scoreLabels[3], {
      color: CARDS,
      runTime: 0.65
    }),

    ...fbox([
      ['Cards group', CARDS],
      '6 + 10',
      ['Total = 16 points', C.amber]
    ], CARDS),

    ...say('CARDS: 6 + 10 = 16', CARDS)
  );

  function shareTwo(from, to) {
    const animations = [];

    for (let j = 0; j < 2; j++) {
      const b = stacks[from].pop();
      const target = slot(to, stacks[to].length);

      stacks[to].push(b);

      animations.push(
        new M.Transform(
          b,
          block(target, colColor(to)),
          {
            pathArc: 0.8,
            runTime: 0.75
          }
        )
      );
    }

    return new M.LaggedStart(
      animations,
      { lagRatio: 0.4, runTime: 1.35 }
    );
  }

  const meanLine = (g, n, color) =>
    new M.DashedLine({
      start: [
        colx(g * 2) - SP / 2 + 0.08,
        BASE + n * PITCH,
        0
      ],
      end: [
        colx(g * 2 + 1) + SP / 2 - 0.08,
        BASE + n * PITCH,
        0
      ],
      color,
      strokeWidth: 2
    });

  let cardsLevel = meanLine(1, 8, CARDS);
  let sheetLevel = meanLine(0, 6, SHEET);

  await until(S(26));

  await play(
    shareTwo(3, 2),
    ...replaceLabel(2, '8 each', CARDS, 18),
    ...replaceLabel(3, '8 each', CARDS, 18),
    new M.Create(cardsLevel),

    ...fbox([
      ['Cards group', CARDS],
      'Total = 16',
      'Students = 2',
      ['16 ÷ 2 = 8', CARDS]
    ], CARDS),

    ...say('SHARE 16 BETWEEN 2: AVERAGE = 8', CARDS)
  );

  await until(S(27));

  await play(
    new M.Indicate(scoreLabels[0], {
      color: SHEET,
      runTime: 0.65
    }),
    new M.Indicate(scoreLabels[1], {
      color: SHEET,
      runTime: 0.65
    }),

    ...fbox([
      ['Sheet group', SHEET],
      '4 + 8',
      ['Total = 12 points', C.amber]
    ], SHEET),

    ...say('SHEET: 4 + 8 = 12', SHEET)
  );

  await until(S(28));

  await play(
    shareTwo(1, 0),
    ...replaceLabel(0, '6 each', SHEET, 18),
    ...replaceLabel(1, '6 each', SHEET, 18),
    new M.Create(sheetLevel),

    ...fbox([
      ['Sheet group', SHEET],
      'Total = 12',
      'Students = 2',
      ['12 ÷ 2 = 6', SHEET]
    ], SHEET),

    ...say('SHARE 12 BETWEEN 2: AVERAGE = 6', SHEET)
  );

  // ------------------------------------------------------------
  // 29-30: compare the two group means.
  // ------------------------------------------------------------

  function meanHeading(g, n) {
    return tag(
      `${g === 0 ? 'SHEET' : 'CARDS'} MEAN = ${n}`,
      g === 0 ? SHEET : CARDS,
      groupX[g],
      GROUP_Y,
      17,
      3.15
    );
  }

  function setHeadings(next) {
    const a = [
      ...hide(...headings),
      ...next.map(t => fi(t))
    ];

    headings = next;

    return a;
  }

  const gapNote = txt(
    'Equal sharing is a picture of the average',
    P ? 17 : 16,
    C.muted,
    CX,
    P ? -3.12 : -2.79,
    false,
    6.4
  );

  await until(S(29));

  await play(
    ...setHeadings([
      meanHeading(0, 6),
      meanHeading(1, 8)
    ]),
    fo(laterNote),
    fi(gapNote),

    ...fbox([
      ['Score gap', C.ink],
      ['  = cards average', CARDS],
      ['  − sheet average', SHEET]
    ], C.cyan),

    ...say('SCORE GAP = CARDS MEAN MINUS SHEET MEAN')
  );

  const gapOutline = rect(
    groupX[1],
    BASE + 7 * PITCH,
    SP * 2 - 0.20,
    2 * PITCH + 0.05,
    C.amber,
    0,
    2
  );

  const gapTag = tag(
    '+2 POINTS',
    C.amber,
    CX,
    P ? -3.15 : -2.79,
    18,
    3.2
  );

  await until(S(30));

  await play(
    new M.Create(gapOutline),
    fo(gapNote),
    fi(gapTag),

    ...fbox([
      ['Blocked comparison', C.green],
      ['  = 8 − 6', C.ink],
      ['  = 2 points', C.amber]
    ], C.green),

    ...say('8 − 6 = 2 POINTS', C.green)
  );

  // ------------------------------------------------------------
  // 31-33: what could happen without blocking?
  // Both higher scorers receive cards; both lower scorers sheet.
  // ------------------------------------------------------------

  function clearStacks() {
    const a = hide(...stacks.flat(), ...scoreLabels);

    stacks = [[], [], [], []];
    scoreLabels = [null, null, null, null];

    return a;
  }

  function showScores(values, runTime = 0.95) {
    stacks = values.map((n, k) =>
      stack(n, k, colColor(k))
    );

    scoreLabels = values.map((n, k) =>
      scoreText(k, n)
    );

    return [
      new M.LaggedStart(
        stacks.map(st => reveal(st, 0.7)),
        { lagRatio: 0.12, runTime }
      ),
      ...scoreLabels.map(t => fi(t))
    ];
  }

  const unevenNote = tag(
    'UNEVEN START',
    C.amber,
    CX,
    P ? 0.0 : -0.15,
    18,
    3.6
  );

  await until(S(31));

  await play(
    ...clearStacks(),
    ...hide(
      cardsLevel,
      sheetLevel,
      gapOutline,
      gapTag,
      ...averageFrames
    ),

    ...setHeadings([
      activityHeading(0),
      activityHeading(1)
    ]),

    ...arrange(UNBLOCKED),
    fi(unevenNote),

    ...fbox([
      ['Without blocking', C.amber],
      ['Sheet starts: 4, 4', SHEET],
      ['Cards starts: 8, 8', CARDS],
      'An uneven random draw'
    ], C.amber),

    ...say('WITHOUT BOXES, BOTH 8s COULD GET CARDS', C.amber)
  );

  await until(S(32));

  await play(
    fo(unevenNote),
    ...showScores([4, 4, 10, 10], 1.25),

    ...fbox([
      ['Same imagined score rule', C.violet],
      ['Sheet: 4 and 4', SHEET],
      ['Cards: 10 and 10', CARDS]
    ], C.amber),

    ...say('CARDS SCORE 10 EACH; SHEET SCORES 4 EACH', C.amber)
  );

  const badGap = tag(
    '+6 POINTS',
    C.amber,
    CX,
    P ? -3.15 : -2.79,
    18
  );

  const badOutline = rect(
    groupX[1],
    BASE + 7 * PITCH,
    SP * 2 - 0.18,
    6 * PITCH + 0.06,
    C.amber,
    0,
    2
  );

  await until(S(33));

  await play(
    ...setHeadings([
      meanHeading(0, 4),
      meanHeading(1, 10)
    ]),
    fi(badGap),
    new M.Create(badOutline),

    ...fbox([
      ['Unblocked comparison', C.amber],
      'Cards mean = 10',
      'Sheet mean = 4',
      ['10 − 4 = 6 points', C.amber]
    ], C.amber),

    ...say('10 − 4 = 6: THE HEAD START AFFECTS THE GAP', C.amber)
  );

  // ------------------------------------------------------------
  // 34-35: restore blocking and demonstrate a different draw.
  // Each activity always gets one student from each pair.
  // ------------------------------------------------------------

  const balancedGap = tag(
    '+2 POINTS',
    C.green,
    CX,
    P ? -3.15 : -2.79,
    18
  );

  await until(S(34));

  await play(
    ...clearStacks(),
    ...hide(badGap, badOutline),
    ...arrange(BLOCKED),

    ...setHeadings([
      activityHeading(0),
      activityHeading(1)
    ]),

    ...fbox([
      ['With blocking', C.violet],
      ['Sheet starts: 4, 8', SHEET],
      ['Cards starts: 4, 8', CARDS],
      'One student from each pair'
    ], C.violet),

    ...say('BLOCKING GUARANTEES ONE FROM EACH PAIR', C.green)
  );

  await play(
    ...showScores([4, 8, 6, 10]),
    fi(balancedGap)
  );

  // Swap the identities within both pairs.
  // The score distributions remain the same in this fixed example.
  const secondDraw = txt(
    'Different students, same score mix',
    P ? 17 : 16,
    C.violet,
    CX,
    P ? 3.16 : 1.30,
    true,
    6.4
  );

  await until(S(35));

  await play(
    ...arrange(SWAPPED, 1.1),
    fi(secondDraw),

    ...fbox([
      ['A different blocked draw', C.violet],
      ['Cards mean: (6 + 10) ÷ 2 = 8', CARDS],
      ['Sheet mean: (4 + 8) ÷ 2 = 6', SHEET],
      ['Gap = 2 points', C.green]
    ], C.green),

    ...say('DIFFERENT COIN RESULTS, SAME 2-POINT GAP', C.green)
  );

  // ------------------------------------------------------------
  // 36-37: why a useful starting-score clue makes estimates steadier.
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    fo(secondDraw),

    new M.LaggedStart(
      priors.map(t =>
        new M.Indicate(t, {
          color: C.amber,
          runTime: 0.5
        })
      ),
      { lagRatio: 0.25, runTime: 1.6 }
    ),

    ...fbox([
      ['Earlier quiz', C.amber],
      'A clue about how',
      'someone might score',
      'on the later quiz'
    ], C.amber),

    ...say('USE A STARTING SCORE AS A CLUE', C.amber)
  );

  await until(S(37));

  await play(
    new M.Indicate(balancedGap, {
      color: C.green,
      runTime: 0.9
    }),

    ...fbox([
      ['In this fixed example', C.ink],
      ['Blocked gap: 2', C.green],
      ['Uneven unblocked gaps:', C.amber],
      '6 or −2',
      ['Blocking is steadier here', C.violet]
    ], C.violet),

    ...say('BLOCKING CAN MAKE COMPARISONS STEADIER', C.green)
  );

  // ------------------------------------------------------------
  // 38-39: the trap — assigning entire blocks to activities.
  // That is NOT random assignment within blocks.
  // ------------------------------------------------------------

  pairFrames = [pairBox(0), pairBox(1)];

  const trapCoins = [
    coin(CX, coinY(0)),
    coin(CX, coinY(1))
  ];

  await until(S(38));

  await play(
    ...clearStacks(),
    ...hide(
      floor,
      separator,
      ...headings,
      balancedGap
    ),

    ...moveToPair(0, 0, -1),
    ...moveToPair(1, 0, 1),
    ...moveToPair(2, 1, -1),
    ...moveToPair(3, 1, 1),

    ...pairFrames.map(r => fi(r)),
    ...trapCoins.map(c => fi(c)),

    ...fbox([
      ['Tempting mistake', C.amber],
      'Give both students',
      'in a starting-score box',
      'the same activity'
    ], C.amber),

    ...say('THE TRAP: ASSIGNING THE WHOLE BOX', C.amber)
  );

  const trapHeadings = [
    tag(
      'REVIEW SHEET',
      SHEET,
      groupX[0],
      P ? 2.65 : 1.35,
      17,
      3.15
    ),
    tag(
      'QUIZ CARDS',
      CARDS,
      groupX[1],
      P ? 2.65 : 1.35,
      17,
      3.15
    )
  ];

  const trapY = P ? 0.35 : -0.35;

  const trapFrames = [0, 1].map(g =>
    rect(
      groupX[g],
      trapY,
      SP * 2 - 0.14,
      1.65,
      g === 0 ? SHEET : CARDS,
      0.04,
      2
    )
  );

  const warningTag = tag(
    'NOT BLOCKING',
    C.amber,
    CX,
    P ? -1.3 : -1.85,
    20
  );

  await until(S(39));

  await play(
    ...hide(...pairFrames, ...trapCoins),

    ...trapHeadings.map(t => fi(t)),
    ...trapFrames.map(r => fi(r)),

    ...NAMES.flatMap((_, k) =>
      moveStudent(
        k,
        colx(k),
        trapY - 0.15,
        trapY + 0.38,
        false,
        0.85
      )
    ),

    fi(warningTag),

    ...fbox([
      ['Wrong assignment rule', C.amber],
      ['Sheet: both 4s', SHEET],
      ['Cards: both 8s', CARDS],
      'Starting scores are uneven'
    ], C.amber),

    ...say('THE SAME STARTING SCORES LAND ON ONE SIDE', C.amber)
  );

  // ------------------------------------------------------------
  // 40: final picture — group similar students, then split each
  // pair with its own independent fair coin flip.
  // ------------------------------------------------------------

  pairFrames = [
    pairBox(0, C.violet),
    pairBox(1, C.violet)
  ];

  const finalCoins = [
    coin(CX, coinY(0), 'T'),
    coin(CX, coinY(1), 'H')
  ];

  const finalHeadingY = P ? 2.65 : 1.45;

  const finalHeadings = [
    tag(
      'REVIEW SHEET',
      SHEET,
      CX - PAIR_DX,
      finalHeadingY,
      17,
      2.8
    ),
    tag(
      'QUIZ CARDS',
      CARDS,
      CX + PAIR_DX,
      finalHeadingY,
      17,
      2.8
    )
  ];

  const finalMeans = [
    tag(
      'EARLIER MEAN = 6',
      SHEET,
      CX - PAIR_DX,
      P ? -2.03 : -2.18,
      15,
      3.0
    ),
    tag(
      'EARLIER MEAN = 6',
      CARDS,
      CX + PAIR_DX,
      P ? -2.03 : -2.18,
      15,
      3.0
    )
  ];

  await until(S(40));

  await play(
    ...hide(
      ...trapFrames,
      ...trapHeadings,
      warningTag
    ),

    ...pairFrames.map(r => fi(r)),
    ...finalHeadings.map(t => fi(t)),

    ...moveToPair(0, 0, -1),
    ...moveToPair(1, 0, 1),
    ...moveToPair(2, 1, 1),
    ...moveToPair(3, 1, -1),

    ...finalCoins.map(c => fi(c)),
    ...finalMeans.map(t => fi(t)),

    ...fbox([
      ['BLOCKING', C.violet],
      '1. Group similar students',
      '2. Randomise inside each block',
      '3. Compare the activities',
      ['Example: 8 − 6 = 2 points', C.green]
    ], C.violet),

    ...say('GROUP SIMILAR STUDENTS. RANDOMISE INSIDE EACH BLOCK.', C.green)
  );

  await play(
    new M.LaggedStart(
      finalCoins.map(c =>
        new M.Indicate(c, {
          color: C.amber,
          runTime: 0.65
        })
      ),
      { lagRatio: 0.65, runTime: 1.5 }
    )
  );
}
