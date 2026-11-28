// lesson 8.1.1
// Potential outcomes: two possible scores for the same student.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Layouts follow the supplied engine reference; browser playback has not been tested.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const CARDS = C.cyan;
  const SHEET = C.pink || '#F472B6';
  const MAYA = C.ink;

  const CX = P ? 0 : -2.45;
  const DX = P ? 1.8 : 1.75;
  const SX = CX - DX;
  const QX = CX + DX;

  const CY = P ? 0.75 : -0.05;
  const PW = P ? 3.35 : 3.25;
  const PH = P ? 3.25 : 2.75;

  const PILL = P ? [0, 3.65, 0] : [CX, 1.98, 0];
  const BOXP = P ? [0, -4.25, 0] : [4.25, -0.3, 0];

  const BASE = P ? -2.0 : -2.0;
  const PITCH = P ? 0.43 : 0.36;
  const BW = P ? 0.85 : 0.78;

  const SMALL_PITCH = P ? 0.27 : 0.22;
  const SMALL_BW = P ? 0.62 : 0.59;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const fadeIn = (o, runTime = 0.45) =>
    new M.FadeIn(o, { runTime });

  const fadeOut = (o, runTime = 0.4) =>
    new M.FadeOut(o, { runTime });

  const hide = (...objects) =>
    objects.filter(Boolean).map(o => fadeOut(o));

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

  // Formula box: created before it enters the scene.
  // Each replacement fades out the previous box.
  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.44 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (rows[i][0].length - rows[i][0].trimStart().length)
    );

    const wd = Math.max(...widths) + 0.65;
    const ht = rows.length * lh + 0.44;

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
    const top = BOXP[1] + ht / 2 - 0.22 - lh / 2;

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

    const a = [fadeIn(g)];

    if (boxNow) a.push(fadeOut(boxNow));

    boxNow = g;

    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [fadeOut(old)];
  }

  // Student represented by a glowing dot.
  // The same white dot and name are used in both of Maya's pictures.
  function student(x, y, name = 'Maya', color = MAYA) {
    const halo = new M.Circle({
      radius: 0.29,
      color,
      strokeWidth: 1
    });

    halo.setFill(color, 0.10);
    halo.moveTo([x, y, 0]);

    const dot = new M.Dot({
      point: [x, y, 0],
      radius: 0.16,
      color
    });

    const label = txt(name, P ? 17 : 16, color, x, y + 0.43, true);

    return new M.VGroup(halo, dot, label);
  }

  function desk(x, y) {
    const top = new M.RoundedRectangle({
      width: 1.32,
      height: 0.77,
      cornerRadius: 0.10,
      color: C.muted,
      strokeWidth: 2
    });

    top.setFill(C.card, 0.95);
    top.moveTo([x, y, 0]);

    const edge = new M.Line({
      start: [x - 0.59, y - 0.27, 0],
      end: [x + 0.59, y - 0.27, 0],
      color: C.muted,
      strokeWidth: 1
    });

    return new M.VGroup(top, edge);
  }

  // Cyan quiz cards: question first, then answer.
  function cards(x, y, face = '?') {
    const back = rect(
      x - 0.11, y + 0.09,
      0.66, 0.41,
      CARDS, 0.13, 1
    );

    const front = rect(
      x + 0.07, y - 0.025,
      0.66, 0.41,
      CARDS, 0.24, 2
    );

    const mark = txt(
      face, 19, CARDS,
      x + 0.07, y - 0.025, true
    );

    return new M.VGroup(back, front, mark);
  }

  // Pink review sheet: questions and answers are visible together.
  function sheet(x, y) {
    const paper = rect(
      x, y,
      0.91, 0.53,
      SHEET, 0.18, 2
    );

    const q1 = txt('Q', 12, SHEET, x - 0.27, y + 0.12, true);
    const a1 = txt('A', 12, SHEET, x - 0.27, y - 0.10, true);

    const l1 = new M.Line({
      start: [x - 0.12, y + 0.12, 0],
      end: [x + 0.29, y + 0.12, 0],
      color: SHEET,
      strokeWidth: 2
    });

    const l2 = new M.Line({
      start: [x - 0.12, y - 0.10, 0],
      end: [x + 0.29, y - 0.10, 0],
      color: SHEET,
      strokeWidth: 2
    });

    return new M.VGroup(paper, q1, a1, l1, l2);
  }

  // Two layers give each quiz-point block a soft glow.
  // A block is always created as a new group before being shown.
  function block(p, color, w = BW, pitch = PITCH) {
    const glow = new M.Rectangle({
      width: w + 0.10,
      height: pitch * 0.94,
      color,
      strokeWidth: 1
    });

    glow.setFill(color, 0.12);
    glow.moveTo(p);

    const core = new M.Rectangle({
      width: w,
      height: pitch * 0.76,
      color,
      strokeWidth: 1.5
    });

    core.setFill(color, 0.86);
    core.moveTo(p);

    return new M.VGroup(glow, core);
  }

  const smallBase = CY - PH / 2 + 0.49;
  const materialY = CY - 0.54;

  const smallX = x => x + 0.88;

  const smallSlot = (x, j) => [
    smallX(x),
    smallBase + (j + 0.5) * SMALL_PITCH,
    0
  ];

  const smallStack = (n, x, color) =>
    Array.from({ length: n }, (_, j) =>
      block(
        smallSlot(x, j),
        color,
        SMALL_BW,
        SMALL_PITCH
      )
    );

  function revealStack(stack, runTime = 1.1) {
    return new M.LaggedStart(
      stack.map(b => fadeIn(b, 0.3)),
      {
        lagRatio: 0.12,
        runTime
      }
    );
  }

  function picture(x, heading, color = C.muted) {
    const frame = new M.RoundedRectangle({
      width: PW,
      height: PH,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    frame.setFill(C.card, 0.46);
    frame.moveTo([x, CY, 0]);

    const title = txt(
      heading,
      P ? 17 : 16,
      color,
      x,
      CY + PH / 2 - 0.27,
      true,
      PW - 0.35
    );

    return new M.VGroup(frame, title);
  }

  function pictureStudent(x) {
    const dx = x - 0.66;

    return new M.VGroup(
      desk(dx, materialY),
      student(dx, CY + 0.22)
    );
  }

  function scoreLabel(x, value, color) {
    return txt(
      value,
      P ? 19 : 17,
      color,
      smallX(x),
      smallBase - 0.25,
      true,
      1.5
    );
  }

  // ------------------------------------------------------------
  // 0-3: introduce Maya, the two activities and the quiz.
  // ------------------------------------------------------------

  const introY = P ? 0.55 : 0.35;

  const introDesk = desk(CX, introY - 0.55);
  const introMaya = student(CX, introY + 0.22);

  const introName = txt(
    'Same student. Same material.',
    P ? 20 : 19,
    C.muted,
    CX,
    introY + 1.18,
    false,
    P ? 6.5 : 5.8
  );

  await until(S(0));

  await play(
    fadeIn(introDesk),
    fadeIn(introMaya),
    fadeIn(introName),
    ...say('WOULD QUIZ CARDS HELP MAYA?')
  );

  let introMaterial = cards(CX, introY - 0.55, '?');

  const recallNote = txt(
    'Try to remember',
    P ? 20 : 18,
    CARDS,
    CX,
    introY - 1.18,
    true
  );

  const checkNote = txt(
    'Then check the answer',
    P ? 20 : 18,
    CARDS,
    CX,
    introY - 1.18,
    true
  );

  await until(S(1));

  await play(
    fadeIn(introMaterial),
    fadeIn(recallNote),
    ...say('QUIZ CARDS: RECALL FIRST', CARDS)
  );

  await until(S(1) + 1.65);

  await play(
    new M.Transform(
      introMaterial,
      cards(CX, introY - 0.55, 'A'),
      { runTime: 0.5 }
    ),
    fadeOut(recallNote),
    fadeIn(checkNote),
    ...say('THEN CHECK', CARDS)
  );

  const introSheet = sheet(CX, introY - 0.55);

  const sheetNote = txt(
    'Questions and answers together',
    P ? 20 : 18,
    SHEET,
    CX,
    introY - 1.18,
    true,
    P ? 6.5 : 5.8
  );

  await until(S(2));

  await play(
    fadeOut(introMaterial),
    fadeOut(checkNote),
    fadeIn(introSheet),
    fadeIn(sheetNote),
    ...say('REVIEW SHEET: READ TOGETHER', SHEET)
  );

  const quizY = P ? -1.75 : -1.62;
  const quizPitch = P ? 0.43 : 0.39;

  const quizSlots = Array.from({ length: 10 }, (_, j) => {
    const x = CX + (j - 4.5) * quizPitch;

    return rect(
      x,
      quizY,
      quizPitch * 0.78,
      0.38,
      C.muted,
      0.06,
      1.5
    );
  });

  const quizLabel = txt(
    'Later quiz: 10 possible points',
    P ? 20 : 19,
    C.ink,
    CX,
    quizY - 0.50,
    true
  );

  await until(S(3));

  await play(
    fadeOut(sheetNote),
    new M.LaggedStart(
      quizSlots.map(q => fadeIn(q)),
      { lagRatio: 0.08, runTime: 0.9 }
    ),
    fadeIn(quizLabel),
    ...say('THE SAME QUIZ, OUT OF 10', C.amber)
  );

  // ------------------------------------------------------------
  // 4-9: draw the same afternoon under two possible activities.
  // ------------------------------------------------------------

  let sheetPanel = picture(SX, 'POSSIBLE AFTERNOON 1');
  let cardsPanel = picture(QX, 'POSSIBLE AFTERNOON 2');

  await until(S(4));

  await play(
    ...hide(
      introDesk,
      introMaya,
      introName,
      introSheet,
      quizLabel,
      ...quizSlots
    ),
    fadeIn(sheetPanel),
    fadeIn(cardsPanel),
    ...say('ONE AFTERNOON, TWO POSSIBILITIES', C.violet)
  );

  let sheetStudent = pictureStudent(SX);
  let cardsStudent = pictureStudent(QX);

  await until(S(5));

  await play(
    fadeIn(sheetStudent),
    fadeIn(cardsStudent),
    ...say('MAYA WORKS ALONE IN BOTH', C.violet)
  );

  let sheetMaterial = sheet(SX - 0.66, materialY);
  let cardsMaterial = cards(QX - 0.66, materialY);

  let sheetActivity = txt(
    'REVIEW SHEET',
    P ? 18 : 16,
    SHEET,
    SX - 0.6,
    materialY - 0.6,
    true,
    1.95
  );

  let cardsActivity = txt(
    'QUIZ CARDS',
    P ? 18 : 16,
    CARDS,
    QX - 0.6,
    materialY - 0.6,
    true,
    1.95
  );

  await until(S(6));

  await play(
    fadeIn(sheetMaterial),
    fadeIn(sheetActivity),
    ...say('POSSIBILITY 1: REVIEW SHEET', SHEET)
  );

  await until(S(7));

  await play(
    fadeIn(cardsMaterial),
    fadeIn(cardsActivity),
    ...say('POSSIBILITY 2: QUIZ CARDS', CARDS)
  );

  let sheetBlocks = smallStack(6, SX, SHEET);
  let cardsBlocks = smallStack(8, QX, CARDS);

  let score6 = scoreLabel(SX, '6 / 10', SHEET);
  let score8 = scoreLabel(QX, '8 / 10', CARDS);

  const pointNote = txt(
    'Later quiz: 1 block = 1 point',
    P ? 18 : 17,
    C.muted,
    CX,
    CY - PH / 2 - 0.42,
    false
  );

  await until(S(8));

  await play(
    revealStack(sheetBlocks, 1.25),
    fadeIn(score6),
    fadeIn(pointNote),
    ...say('IMAGINE: 6 POINTS WITH THE SHEET', SHEET)
  );

  await until(S(9));

  await play(
    revealStack(cardsBlocks, 1.25),
    fadeIn(score8),
    ...say('IMAGINE: 8 POINTS WITH CARDS', CARDS)
  );

  // ------------------------------------------------------------
  // 10-13: name the two potential outcomes.
  // ------------------------------------------------------------

  const imagined = txt(
    'Both scores are imagined in this example',
    P ? 18 : 17,
    C.violet,
    CX,
    CY - PH / 2 - 0.89,
    true,
    P ? 6.8 : 6.4
  );

  await until(S(10));

  await play(
    fadeIn(imagined),
    new M.Indicate(score6, {
      color: SHEET,
      runTime: 0.75
    }),
    new M.Indicate(score8, {
      color: CARDS,
      runTime: 0.75
    }),
    ...say('TWO SCORES, ONE STUDENT', C.violet)
  );

  const ifSheet = tag(
    'WITH THE SHEET',
    SHEET,
    SX,
    P ? -1.74 : -2.36,
    P ? 18 : 16,
    PW - 0.12
  );

  const ifCards = tag(
    'WITH THE CARDS',
    CARDS,
    QX,
    P ? -1.74 : -2.36,
    P ? 18 : 16,
    PW - 0.12
  );

  await until(S(11));

  await play(
    fadeOut(pointNote),
    fadeOut(imagined),
    fadeIn(ifSheet),
    fadeIn(ifCards),
    ...say('THE SCORE UNDER EACH CHOICE', C.violet)
  );

  await until(S(12));

  await play(
    ...fbox([
      ['Potential outcome', C.violet],
      'The score a person',
      'would get under',
      'one particular choice'
    ], C.violet),
    ...say('POTENTIAL OUTCOME', C.violet)
  );

  await until(S(13));

  await play(
    ...fbox([
      ["Maya's potential outcomes", C.violet],
      ['With the sheet: 6', SHEET],
      ['With the cards: 8', CARDS]
    ], C.violet),
    new M.Indicate(score6, {
      color: SHEET,
      runTime: 0.75
    }),
    new M.Indicate(score8, {
      color: CARDS,
      runTime: 0.75
    }),
    ...say('ONE OUTCOME FOR EACH CHOICE', C.violet)
  );

  // ------------------------------------------------------------
  // 14-16: introduce treatment as an activity choice.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...clearBox(),
    ...say('THE TEACHER SETS UP A TEST', C.amber)
  );

  await until(S(15));

  await play(
    ...fbox([
      ['Treatment', C.amber],
      'A choice the teacher',
      'can give a student',
      'in the test'
    ], C.amber),
    ...say('TREATMENT = A CHOICE IN THE TEST', C.amber)
  );

  await until(S(16));

  await play(
    new M.Indicate(sheetMaterial, {
      color: SHEET,
      runTime: 0.8
    }),
    new M.Indicate(cardsMaterial, {
      color: CARDS,
      runTime: 0.8
    }),
    ...fbox([
      ['Two treatment choices', C.amber],
      ['Review sheet', SHEET],
      ['Quiz cards', CARDS]
    ], C.amber),
    ...say('SHEET OR CARDS?', C.amber)
  );

  // ------------------------------------------------------------
  // 17-23: align the two stacks and match points from the bottom.
  // ------------------------------------------------------------

  await until(S(17));

  await play(
    ...clearBox(),
    ...say('HOW MANY EXTRA POINTS WOULD CARDS ADD?', C.amber)
  );

  const LX = CX - (P ? 0.90 : 0.83);
  const RX = CX + (P ? 0.90 : 0.83);

  const slot = (x, j) => [
    x,
    BASE + (j + 0.5) * PITCH,
    0
  ];

  const stackTitleY = BASE + 8 * PITCH + 0.48;

  const compareSheetTitle = txt(
    'Maya: sheet',
    P ? 18 : 17,
    SHEET,
    LX,
    stackTitleY,
    true,
    1.75
  );

  const compareCardsTitle = txt(
    'Maya: cards',
    P ? 18 : 17,
    CARDS,
    RX,
    stackTitleY,
    true,
    1.75
  );

  const compare6 = txt(
    '6',
    P ? 23 : 22,
    SHEET,
    LX,
    BASE - 0.30,
    true
  );

  const compare8 = txt(
    '8',
    P ? 23 : 22,
    CARDS,
    RX,
    BASE - 0.30,
    true
  );

  const floor = new M.Line({
    start: [LX - 0.65, BASE, 0],
    end: [RX + 0.65, BASE, 0],
    color: C.muted,
    strokeWidth: 2
  });

  await until(S(18));

  await play(
    ...hide(
      sheetPanel,
      cardsPanel,
      sheetStudent,
      cardsStudent,
      sheetMaterial,
      cardsMaterial,
      sheetActivity,
      cardsActivity,
      score6,
      score8,
      ifSheet,
      ifCards
    ),

    ...sheetBlocks.map((b, j) =>
      new M.Transform(
        b,
        block(slot(LX, j), SHEET),
        { runTime: 0.9 }
      )
    ),

    ...cardsBlocks.map((b, j) =>
      new M.Transform(
        b,
        block(slot(RX, j), CARDS),
        { runTime: 0.9 }
      )
    ),

    new M.Create(floor, { runTime: 0.7 }),
    fadeIn(compareSheetTitle),
    fadeIn(compareCardsTitle),
    fadeIn(compare6),
    fadeIn(compare8),
    ...say('LINE UP THE TWO STACKS', C.amber)
  );

  // A horizontal connector for each matched pair.
  const matches = Array.from({ length: 6 }, (_, j) => {
    const y = BASE + (j + 0.5) * PITCH;

    return new M.Line({
      start: [LX + BW / 2 + 0.06, y, 0],
      end: [RX - BW / 2 - 0.06, y, 0],
      color: C.muted,
      strokeWidth: 2.5
    });
  });

  await until(S(19));

  await play(
    new M.LaggedStart(
      matches.map((line, j) =>
        new M.LaggedStart([
          new M.Indicate(sheetBlocks[j], {
            color: SHEET,
            runTime: 0.25
          }),
          new M.Create(line, {
            runTime: 0.25
          }),
          new M.Indicate(cardsBlocks[j], {
            color: CARDS,
            runTime: 0.25
          })
        ], {
          lagRatio: 0.25
        })
      ),
      {
        lagRatio: 0.45,
        runTime: 2.6
      }
    ),
    ...say('MATCH FROM THE BOTTOM', C.muted)
  );

  // Coordinate-defined outline, not a SurroundingRectangle.
  const matchedOutline = new M.RoundedRectangle({
    width: RX - LX + BW + 0.26,
    height: 6 * PITCH + 0.06,
    cornerRadius: 0.10,
    color: C.green,
    strokeWidth: 2
  });

  matchedOutline.setFill(C.green, 0);
  matchedOutline.moveTo([
    CX,
    BASE + 3 * PITCH,
    0
  ]);

  await until(S(20));

  await play(
    new M.Create(matchedOutline, { runTime: 0.45 }),
    ...say('ALL 6 HAVE A MATCH', C.green)
  );

  const extraOutline = new M.RoundedRectangle({
    width: BW + 0.25,
    height: 2 * PITCH + 0.06,
    cornerRadius: 0.10,
    color: C.amber,
    strokeWidth: 2.5
  });

  extraOutline.setFill(C.amber, 0);
  extraOutline.moveTo([
    RX,
    BASE + 7 * PITCH,
    0
  ]);

  await until(S(21));

  await play(
    fadeOut(matchedOutline),
    new M.Create(extraOutline, { runTime: 0.45 }),
    ...say('LOOK AT THE TOP', C.amber)
  );

  const extraTag = tag(
    '+2',
    C.amber,
    RX + (P ? 1.15 : 1.08),
    BASE + 7 * PITCH,
    22,
    1.15
  );

  await until(S(22));

  await play(
    fadeIn(extraTag),
    new M.Indicate(cardsBlocks[6], {
      color: C.amber,
      runTime: 0.65
    }),
    new M.Indicate(cardsBlocks[7], {
      color: C.amber,
      runTime: 0.65
    }),
    ...say('2 BLOCKS WITHOUT A MATCH', C.amber)
  );

  await until(S(23));

  await play(
    new M.Indicate(extraTag, {
      color: C.amber,
      runTime: 0.8
    }),
    ...say('CARDS WOULD ADD 2 POINTS FOR MAYA', C.amber)
  );

  // ------------------------------------------------------------
  // 24-25: name the individual treatment effect.
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...fbox([
      ['Individual treatment', C.amber],
      ['effect', C.amber],
      'The difference between',
      "one person's two",
      'potential outcomes'
    ], C.amber),
    ...say('INDIVIDUAL TREATMENT EFFECT', C.amber)
  );

  const sameConditions = txt(
    'Same Maya · same conditions · only activity changes',
    P ? 18 : 16,
    C.violet,
    CX,
    P ? -2.93 : -2.77,
    true,
    P ? 6.8 : 6.25
  );

  await until(S(25));

  await play(
    fadeIn(sameConditions),
    new M.Indicate(compareSheetTitle, {
      color: C.violet,
      runTime: 0.75
    }),
    new M.Indicate(compareCardsTitle, {
      color: C.violet,
      runTime: 0.75
    }),
    ...say('CHANGE ONLY THE ACTIVITY', C.violet)
  );

  // ------------------------------------------------------------
  // 26-29: write the formula after showing the visual difference.
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...say('FORMULA = A SHORT RULE', C.cyan),
    ...fbox([
      ['Treatment effect', C.ink],
      'Compare the two scores',
      'Find the difference'
    ], C.cyan)
  );

  await until(S(27));

  await play(
    ...fbox([
      ["Maya's treatment effect", C.ink],
      ['  = score with cards', CARDS],
      ['  − score with sheet', SHEET]
    ], C.cyan),
    new M.Indicate(compare8, {
      color: CARDS,
      runTime: 0.75
    }),
    new M.Indicate(compare6, {
      color: SHEET,
      runTime: 0.75
    }),
    ...say('CARDS SCORE MINUS SHEET SCORE', C.cyan)
  );

  await until(S(28));

  await play(
    ...fbox([
      ["Maya's treatment effect", C.ink],
      ['  = 8 − 6', C.ink],
      ['  = 2 points', C.amber]
    ], C.amber),
    new M.Indicate(extraTag, {
      color: C.amber,
      runTime: 0.8
    }),
    ...say('8 − 6 = 2 POINTS', C.amber)
  );

  await until(S(29));

  await play(
    new M.Indicate(extraOutline, {
      color: C.amber,
      runTime: 0.9
    }),
    ...say('THE EXTRA POINTS FROM THE ACTIVITY', C.green)
  );

  // ------------------------------------------------------------
  // 30-33: the real afternoon happens.
  // Only the score under the chosen activity is observed.
  // ------------------------------------------------------------

  sheetPanel = picture(SX, 'SHEET: NOT CHOSEN', SHEET);
  cardsPanel = picture(QX, 'CARDS: CHOSEN', CARDS);

  sheetStudent = pictureStudent(SX);
  cardsStudent = pictureStudent(QX);

  sheetMaterial = sheet(SX - 0.66, materialY);
  cardsMaterial = cards(QX - 0.66, materialY);

  sheetActivity = txt(
    'REVIEW SHEET',
    P ? 18 : 16,
    SHEET,
    SX - 0.6,
    materialY - 0.6,
    true,
    1.95
  );

  cardsActivity = txt(
    'QUIZ CARDS',
    P ? 18 : 16,
    CARDS,
    QX - 0.6,
    materialY - 0.6,
    true,
    1.95
  );

  await until(S(30));

  await play(
    ...hide(
      floor,
      compareSheetTitle,
      compareCardsTitle,
      compare6,
      compare8,
      extraOutline,
      extraTag,
      sameConditions,
      ...matches,
      ...sheetBlocks,
      ...cardsBlocks
    ),
    ...clearBox(),
    fadeIn(sheetPanel),
    fadeIn(cardsPanel),
    fadeIn(sheetStudent),
    fadeIn(cardsStudent),
    fadeIn(sheetMaterial),
    fadeIn(cardsMaterial),
    fadeIn(sheetActivity),
    fadeIn(cardsActivity),
    ...say('NOW: THE REAL AFTERNOON', C.green)
  );

  cardsBlocks = smallStack(8, QX, CARDS);
  score8 = scoreLabel(QX, '8 / 10', CARDS);

  const observedTag = tag(
    'OBSERVED',
    C.green,
    QX,
    CY - PH / 2 - 0.41,
    17,
    PW - 0.2
  );

  const observedOutline = new M.RoundedRectangle({
    width: SMALL_BW + 0.20,
    height: 8 * SMALL_PITCH + 0.10,
    cornerRadius: 0.09,
    color: C.green,
    strokeWidth: 2
  });

  observedOutline.setFill(C.green, 0);
  observedOutline.moveTo([
    smallX(QX),
    smallBase + 4 * SMALL_PITCH,
    0
  ]);

  await until(S(31));

  await play(
    revealStack(cardsBlocks, 0.95),
    fadeIn(score8),
    fadeIn(observedTag),
    new M.Create(observedOutline, { runTime: 0.8 }),
    ...say('MAYA GETS CARDS AND SCORES 8', C.green)
  );

  // Briefly recall the six-point imagined outcome.
  // It is explicitly not an observed score.
  sheetBlocks = smallStack(6, SX, SHEET);

  sheetBlocks.forEach(b => {
    b.submobjects[0].setFill(SHEET, 0.05);
    b.submobjects[1].setFill(SHEET, 0.30);
  });

  score6 = scoreLabel(SX, '6 / 10', SHEET);

  const imaginedTag = tag(
    'IMAGINED ONLY',
    C.violet,
    SX,
    CY - PH / 2 - 0.41,
    16,
    PW - 0.2
  );

  await until(S(32));

  await play(
    revealStack(sheetBlocks, 0.9),
    fadeIn(score6),
    fadeIn(imaginedTag),
    ...say('6 WAS OUR IMAGINED SHEET SCORE', C.violet)
  );

  // The unobserved stack is removed entirely.
  // No six-point silhouette remains to reveal the hidden value.
  const hiddenH = 8 * SMALL_PITCH + 0.10;
  const hiddenY = smallBase + 4 * SMALL_PITCH;

  const hiddenCover = new M.RoundedRectangle({
    width: SMALL_BW + 0.28,
    height: hiddenH,
    cornerRadius: 0.12,
    color: C.muted,
    strokeWidth: 2
  });

  hiddenCover.setFill(C.card, 0.98);
  hiddenCover.moveTo([
    smallX(SX),
    hiddenY,
    0
  ]);

  const question = txt(
    '?',
    P ? 37 : 34,
    C.muted,
    smallX(SX),
    hiddenY,
    true
  );

  const hiddenScore = new M.VGroup(hiddenCover, question);

  const unknownLabel = scoreLabel(SX, '? / 10', C.muted);

  const hiddenTag = tag(
    'NOT OBSERVED',
    C.muted,
    SX,
    CY - PH / 2 - 0.41,
    16,
    PW - 0.2
  );

  await until(S(33));

  await play(
    ...hide(...sheetBlocks, score6, imaginedTag),
    fadeIn(hiddenScore),
    fadeIn(unknownLabel),
    fadeIn(hiddenTag),
    ...say('HER REAL SHEET SCORE STAYS HIDDEN', C.violet)
  );

  // ------------------------------------------------------------
  // 34-36: another student's score is not Maya's missing score.
  // No numerical classmate score is invented.
  // ------------------------------------------------------------

  const NX = P ? 0 : 4.45;
  const NY = P ? -3.12 : -0.25;

  const NW = P ? 5.8 : 4.4;
  const NH = P ? 1.48 : 2.05;

  const classmateFrame = new M.RoundedRectangle({
    width: NW,
    height: NH,
    cornerRadius: 0.16,
    color: C.muted,
    strokeWidth: 2
  });

  classmateFrame.setFill(C.card, 0.92);
  classmateFrame.moveTo([NX, NY, 0]);

  const classmateDot = new M.Dot({
    point: [
      NX - (P ? 2.22 : 1.62),
      NY + (P ? 0.12 : 0.16),
      0
    ],
    radius: 0.16,
    color: C.violet
  });

  const classmateSheet = sheet(
    NX - (P ? 1.50 : 0.93),
    NY + (P ? 0.12 : 0.16)
  );

  const classmateName = txt(
    'Classmate',
    P ? 18 : 17,
    C.violet,
    NX + (P ? 0.65 : 0.85),
    NY + 0.43,
    true,
    P ? 3.5 : 2.2
  );

  const classmateScore = txt(
    'Their sheet score',
    P ? 18 : 17,
    SHEET,
    NX + (P ? 0.65 : 0.85),
    NY,
    true,
    P ? 3.6 : 2.2
  );

  const classmateNote = txt(
    'A different student',
    P ? 15 : 16,
    C.muted,
    NX,
    NY - (P ? 0.47 : 0.65),
    false,
    NW - 0.3
  );

  const classmate = new M.VGroup(
    classmateFrame,
    classmateDot,
    classmateSheet,
    classmateName,
    classmateScore,
    classmateNote
  );

  await until(S(34));

  await play(
    fadeIn(classmate),
    ...say("A CLASSMATE'S SCORE MAY BE VISIBLE", SHEET)
  );

  // Suggested substitution, drawn as a dashed connection.
  // The question mark on Maya's missing outcome never changes.
  const proposedStart = P
    ? [NX - 1.15, NY + NH / 2, 0]
    : [NX - NW / 2, NY + NH / 2 - 0.1, 0];

  const proposedEnd = [
    smallX(SX),
    hiddenY,
    0
  ];

  const proposedLine = new M.DashedLine({
    start: proposedStart,
    end: proposedEnd,
    color: C.amber,
    strokeWidth: 2.5
  });

  const proposedTag = tag(
    'SUBSTITUTE?',
    C.amber,
    P ? -1.55 : 1.55,
    P ? -2.11 : -1.91,
    15,
    2.0
  );

  await until(S(35));

  await play(
    new M.Create(proposedLine, { runTime: 0.8 }),
    fadeIn(proposedTag),
    new M.Indicate(hiddenScore, {
      color: C.amber,
      runTime: 0.8
    }),
    ...say("CAN WE USE THE CLASSMATE'S SCORE?", C.amber)
  );

  const rejected = tag(
    'NOT THE SAME STUDENT',
    C.amber,
    NX,
    NY - NH / 2 - 0.36,
    P ? 16 : 15,
    NW
  );

  const crossX = P ? -1.47 : 1.55;
  const crossY = P ? -2.11 : -1.91;
  const crossR = 0.18;

  const cross1 = new M.Line({
    start: [crossX - crossR, crossY - crossR, 0],
    end: [crossX + crossR, crossY + crossR, 0],
    color: C.amber,
    strokeWidth: 4
  });

  const cross2 = new M.Line({
    start: [crossX - crossR, crossY + crossR, 0],
    end: [crossX + crossR, crossY - crossR, 0],
    color: C.amber,
    strokeWidth: 4
  });

  const cross = new M.VGroup(cross1, cross2);

  await until(S(36));

  await play(
    fadeOut(proposedLine),
    fadeOut(proposedTag),
    fadeIn(cross),
    fadeIn(rejected),
    new M.Indicate(classmateDot, {
      color: C.violet,
      runTime: 0.8
    }),
    ...say('THEY MAY HAVE DIFFERENT PRIOR SKILLS', C.amber)
  );

  // ------------------------------------------------------------
  // 37: final picture.
  // The individual effect requires both potential outcomes,
  // but a real test reveals only the outcome under assignment.
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    ...hide(classmate, cross, rejected),
    ...fbox([
      ['Individual treatment effect', C.amber],
      ['  = Maya with cards', CARDS],
      ['  − Maya with sheet', SHEET],
      ['  = 8 − ?', C.violet],
      ['Only one score is observed', C.green]
    ], C.violet),
    new M.Indicate(hiddenScore, {
      color: C.muted,
      runTime: 0.85
    }),
    new M.Indicate(observedOutline, {
      color: C.green,
      runTime: 0.85
    }),
    ...say('TWO POSSIBLE SCORES. ONLY ONE OBSERVED.', C.violet)
  );
}
