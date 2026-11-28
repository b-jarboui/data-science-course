// lesson 8.1.5
// Blinding: keep activity information hidden from the grader.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Student identifiers A/B and paper codes 17/42 are illustrative.
// Uses the supplied engine conventions; browser playback has not been tested.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const CARDS = C.cyan;
  const SHEET = C.pink || '#F472B6';

  const CX = P ? 0 : -2.6;
  const DX = P ? 1.78 : 1.78;

  const LX = CX - DX;
  const RX = CX + DX;

  const CY = P ? 0.85 : -0.10;

  const PAPER_W = P ? 1.76 : 1.72;
  const PAPER_H = P ? 2.85 : 2.60;

  const PITCH = P ? 0.30 : 0.27;
  const BW = P ? 0.65 : 0.62;

  const BASE = CY - PAPER_H / 2 + 0.08;

  const PILL = P ? [0, 3.65, 0] : [CX, 1.98, 0];
  const BOXP = P ? [0, -4.62, 0] : [4.3, -1.35, 0];

  const GUIDEX = P ? 0 : 4.3;
  const GUIDEY = P ? -2.32 : 0.62;

  const LABEL_Y = CY + PAPER_H / 2 + 0.34;
  const SCORE_Y = BASE - 0.34;
  const NOTE_Y = P ? -1.18 : -2.52;

  const paperX = k => (k === 0 ? LX : RX) - 0.44;
  const stackX = k => (k === 0 ? LX : RX) + 0.96;

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
    const lh = P ? 0.39 : 0.39;

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
    const maxh = P ? 2.05 : 2.65;

    const scale = Math.min(1, maxw / wd, maxh / ht);

    if (scale < 1) g.scale(scale);

    g.moveTo(BOXP);

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

  // Replaceable explanatory note beneath the papers.
  let noteNow = null;

  function note(s, color = C.muted) {
    const next = txt(
      s,
      P ? 18 : 17,
      color,
      CX,
      NOTE_Y,
      true,
      P ? 6.9 : 6.5
    );

    const a = [fi(next)];

    if (noteNow) a.push(fo(noteNow));

    noteNow = next;

    return a;
  }

  function clearNote() {
    if (!noteNow) return [];

    const old = noteNow;
    noteNow = null;

    return [fo(old)];
  }

  // ------------------------------------------------------------
  // Visual helpers.
  // ------------------------------------------------------------

  function student(x, y, name, color = C.ink) {
    const halo = new M.Circle({
      radius: 0.28,
      color,
      strokeWidth: 1
    });

    halo.setFill(color, 0.10);
    halo.moveTo([x, y, 0]);

    const dot = new M.Dot({
      point: [x, y, 0],
      radius: 0.15,
      color
    });

    const label = txt(
      name, 17, color,
      x, y - 0.44, true
    );

    return new M.VGroup(halo, dot, label);
  }

  function cards(x, y) {
    const back = rect(
      x - 0.12, y + 0.10,
      0.91, 0.60,
      CARDS, 0.13, 1.5
    );

    const front = rect(
      x + 0.08, y - 0.04,
      0.91, 0.60,
      CARDS, 0.24, 2
    );

    const q = txt(
      '?', 23, CARDS,
      x + 0.08, y - 0.04, true
    );

    return new M.VGroup(back, front, q);
  }

  function sheet(x, y) {
    const paper = rect(
      x, y,
      1.03, 0.72,
      SHEET, 0.17, 2
    );

    const lines = Array.from({ length: 3 }, (_, j) =>
      new M.Line({
        start: [x - 0.32, y + 0.18 - j * 0.18, 0],
        end: [x + 0.32, y + 0.18 - j * 0.18, 0],
        color: SHEET,
        strokeWidth: 2
      })
    );

    return new M.VGroup(paper, ...lines);
  }

  // One glowing block = one recorded quiz point.
  function block(p, color, extra = false) {
    const glow = new M.Rectangle({
      width: BW + 0.10,
      height: PITCH * 0.95,
      color,
      strokeWidth: 1
    });

    glow.setFill(color, extra ? 0.25 : 0.12);
    glow.moveTo(p);

    const core = new M.Rectangle({
      width: BW,
      height: PITCH * 0.76,
      color,
      strokeWidth: extra ? 2 : 1.4
    });

    core.setFill(color, 0.86);
    core.moveTo(p);

    return new M.VGroup(glow, core);
  }

  const slot = (k, j) => [
    stackX(k),
    BASE + (j + 0.5) * PITCH,
    0
  ];

  function stack(n, k, color) {
    return Array.from({ length: n }, (_, j) =>
      block(slot(k, j), color)
    );
  }

  function reveal(st, runTime = 0.95) {
    return new M.LaggedStart(
      st.map(b => fi(b, 0.25)),
      { lagRatio: 0.12, runTime }
    );
  }

  // ------------------------------------------------------------
  // Identical quiz papers.
  //
  // Answers 1–6 earn one point each.
  // Answer 7 is borderline and earns zero under the guide.
  // Answers 8–10 also earn zero.
  //
  // The abstract answer marks are identical on both papers.
  // No activity-dependent marks are drawn on the answer papers.
  // ------------------------------------------------------------

  const ANSWERS = [
    'A', 'C', 'B', 'D', 'A',
    'B', 'B?', 'C', 'D', 'A'
  ];

  const ROW_PITCH = P ? 0.221 : 0.195;

  const answerY = j =>
    CY + PAPER_H / 2 - 0.59 - j * ROW_PITCH;

  function quizPaper(k) {
    const x = paperX(k);

    const paper = new M.RoundedRectangle({
      width: PAPER_W,
      height: PAPER_H,
      cornerRadius: 0.12,
      color: C.muted,
      strokeWidth: 2
    });

    paper.setFill(C.card, 0.98);
    paper.moveTo([x, CY, 0]);

    const heading = txt(
      'QUIZ / 10',
      P ? 16 : 15,
      C.ink,
      x,
      CY + PAPER_H / 2 - 0.18,
      true,
      PAPER_W - 0.22
    );

    const divider = new M.Line({
      start: [
        x - PAPER_W / 2 + 0.12,
        CY + PAPER_H / 2 - 0.35,
        0
      ],
      end: [
        x + PAPER_W / 2 - 0.12,
        CY + PAPER_H / 2 - 0.35,
        0
      ],
      color: C.muted,
      strokeWidth: 1
    });

    const answers = ANSWERS.flatMap((answer, j) => {
      const y = answerY(j);

      return [
        txt(
          `${j + 1}.`,
          P ? 15 : 13,
          C.muted,
          x - 0.59,
          y,
          true
        ),
        txt(
          answer,
          P ? 18 : 15,
          C.ink,
          x - 0.20,
          y,
          true
        ),
        new M.Line({
          start: [x + 0.13, y - 0.055, 0],
          end: [x + 0.57, y - 0.055, 0],
          color: C.muted,
          strokeWidth: 1
        })
      ];
    });

    return new M.VGroup(
      paper,
      heading,
      divider,
      ...answers
    );
  }

  function activityLabel(k) {
    return tag(
      k === 0 ? 'QUIZ CARDS' : 'REVIEW SHEET',
      k === 0 ? CARDS : SHEET,
      paperX(k) + 0.30,
      LABEL_Y,
      P ? 17 : 16,
      3.05
    );
  }

  const ID_Y = CY - PAPER_H / 2 - 0.28;

  function nameLabel(k) {
    return txt(
      k === 0 ? 'Student A' : 'Student B',
      P ? 16 : 15,
      C.ink,
      paperX(k),
      ID_Y,
      true,
      PAPER_W
    );
  }

  const CODES = ['17', '42'];

  function codeLabel(k) {
    return tag(
      `CODE ${CODES[k]}`,
      C.violet,
      paperX(k) + 0.30,
      LABEL_Y,
      P ? 18 : 17,
      2.85
    );
  }

  function maskedLabel(k) {
    return tag(
      'ACTIVITY HIDDEN',
      C.muted,
      paperX(k) + 0.30,
      LABEL_Y,
      P ? 16 : 15,
      3.05
    );
  }

  function scoreLabel(k, n, color = C.ink) {
    return txt(
      `${n}/10`,
      P ? 21 : 19,
      color,
      stackX(k),
      SCORE_Y,
      true,
      1.05
    );
  }

  function answerOutline(k, color = C.amber) {
    return rect(
      paperX(k),
      answerY(6),
      PAPER_W - 0.18,
      ROW_PITCH * 0.92,
      color,
      0,
      2
    );
  }

  function gradingMark(k, j, s, color) {
    return txt(
      s,
      P ? 16 : 13,
      color,
      paperX(k) + 0.37,
      answerY(j) + 0.045,
      true,
      0.43
    );
  }

  function guideMarks(k) {
    return ANSWERS.map((_, j) =>
      gradingMark(
        k,
        j,
        j < 6 ? '+1' : '0',
        j < 6 ? C.green : C.muted
      )
    );
  }

  // ------------------------------------------------------------
  // Marking guide: separate from the papers and their labels.
  // ------------------------------------------------------------

  function markingGuide() {
    const w = P ? 6.15 : 3.85;
    const h = P ? 1.45 : 1.78;

    const bg = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.16,
      color: C.green,
      strokeWidth: 2
    });

    bg.setFill(C.card, 0.95);
    bg.moveTo([GUIDEX, GUIDEY, 0]);

    const title = txt(
      'MARKING GUIDE',
      P ? 18 : 17,
      C.green,
      GUIDEX,
      GUIDEY + h / 2 - 0.23,
      true,
      w - 0.3
    );

    const right = txt(
      'Correct answer = 1 point',
      P ? 17 : 16,
      C.ink,
      GUIDEX,
      GUIDEY + (P ? 0.06 : 0.13),
      true,
      w - 0.4
    );

    const borderline = txt(
      'Almost right = 0 points',
      P ? 17 : 16,
      C.amber,
      GUIDEX,
      GUIDEY - (P ? 0.24 : 0.24),
      true,
      w - 0.4
    );

    const wrong = txt(
      'Incorrect answer = 0 points',
      P ? 16 : 15,
      C.muted,
      GUIDEX,
      GUIDEY - (P ? 0.51 : 0.61),
      false,
      w - 0.4
    );

    return new M.VGroup(
      bg,
      title,
      right,
      borderline,
      wrong
    );
  }

  // ------------------------------------------------------------
  // 0–1: introduce the teacher, grader and possible grading bias.
  // ------------------------------------------------------------

  const introY = P ? 1.25 : 0.65;

  const introCards = cards(LX, introY);
  const introSheet = sheet(RX, introY);

  const introNames = [
    txt(
      'Quiz cards', 20, CARDS,
      LX, introY - 0.63, true
    ),
    txt(
      'Review sheet', 20, SHEET,
      RX, introY - 0.63, true
    )
  ];

  const teacher = student(
    CX - 1.15,
    P ? -0.65 : -1.05,
    'Teacher',
    C.ink
  );

  const grader = student(
    CX + 1.15,
    P ? -0.65 : -1.05,
    'Grader',
    C.violet
  );

  const introLine = new M.Line({
    start: [CX - 0.79, P ? -0.65 : -1.05, 0],
    end: [CX + 0.79, P ? -0.65 : -1.05, 0],
    color: C.muted,
    strokeWidth: 2
  });

  const introQuiz = tag(
    'QUIZ PAPERS',
    C.muted,
    CX,
    P ? -1.75 : -2.05,
    17
  );

  await until(S(0));

  await play(
    fi(introCards),
    fi(introSheet),
    ...introNames.map(t => fi(t)),
    fi(teacher),
    fi(grader),
    new M.Create(introLine),
    fi(introQuiz),
    ...say('A COLLEAGUE MARKS THE LATER QUIZZES')
  );

  await until(S(1));

  await play(
    new M.Indicate(grader, {
      color: C.amber,
      runTime: 0.75
    }),
    ...fbox([
      ['A question about grading', C.amber],
      'Would knowing the activity',
      'change the marks given?'
    ], C.amber),
    ...say('COULD THE ACTIVITY LABEL AFFECT GRADING?', C.amber)
  );

  // ------------------------------------------------------------
  // 2–4: the same answers on two differently labelled papers.
  // ------------------------------------------------------------

  const papers = [
    quizPaper(0),
    quizPaper(1)
  ];

  let names = [
    nameLabel(0),
    nameLabel(1)
  ];

  let activities = [
    activityLabel(0),
    activityLabel(1)
  ];

  await until(S(2));

  await play(
    ...hide(
      introCards,
      introSheet,
      ...introNames,
      teacher,
      grader,
      introLine,
      introQuiz
    ),
    ...clearBox(),
    ...papers.map(p => fi(p)),
    ...names.map(t => fi(t)),
    ...note('Same answers on both papers', C.ink),
    ...say('TWO PAPERS WITH IDENTICAL ANSWERS', C.ink)
  );

  await until(S(3));

  await play(
    fi(activities[0]),
    ...say('FIRST PAPER: QUIZ CARDS', CARDS)
  );

  await until(S(4));

  await play(
    fi(activities[1]),
    ...say('SECOND PAPER: REVIEW SHEET', SHEET)
  );

  // ------------------------------------------------------------
  // 5–7: the same marking guide gives both papers six points.
  // ------------------------------------------------------------

  let guide = markingGuide();

  await until(S(5));

  await play(
    fi(guide),
    ...say('PUT THE MARKING GUIDE BESIDE THE PAPERS', C.green)
  );

  await until(S(6));

  await play(
    new M.Indicate(guide, {
      color: C.green,
      runTime: 0.85
    }),
    ...fbox([
      ['Marking guide', C.green],
      'Same rules for every paper',
      'Points depend on answers'
    ], C.green),
    ...say('THE GUIDE TELLS US WHICH ANSWERS EARN POINTS', C.green)
  );

  let marks = [
    guideMarks(0),
    guideMarks(1)
  ];

  let stacks = [
    stack(6, 0, CARDS),
    stack(6, 1, SHEET)
  ];

  let scores = [
    scoreLabel(0, 6, CARDS),
    scoreLabel(1, 6, SHEET)
  ];

  await until(S(7));

  await play(
    ...marks.flat().map(t => fi(t)),
    reveal(stacks[0], 1.05),
    reveal(stacks[1], 1.05),
    ...scores.map(t => fi(t)),
    ...fbox([
      ['According to the guide', C.green],
      ['Cards paper = 6', CARDS],
      ['Sheet paper = 6', SHEET]
    ], C.green),
    ...say('SAME GUIDE, SAME SCORE: 6 POINTS EACH', C.green)
  );

  // ------------------------------------------------------------
  // 8–9: both papers contain the same borderline answer.
  // ------------------------------------------------------------

  let borderlineOutlines = [
    answerOutline(0),
    answerOutline(1)
  ];

  await until(S(8));

  await play(
    ...borderlineOutlines.map(r =>
      new M.Create(r, { runTime: 0.5 })
    ),
    ...note('Answer 7 is almost right on both papers', C.amber),
    ...fbox([
      ['The same borderline answer', C.amber],
      'Both papers: answer 7',
      'Almost right, but incomplete'
    ], C.amber),
    ...say('THE SAME ANSWER IS ALMOST RIGHT', C.amber)
  );

  await until(S(9));

  await play(
    new M.Indicate(marks[0][6], {
      color: C.amber,
      runTime: 0.6
    }),
    new M.Indicate(marks[1][6], {
      color: C.amber,
      runTime: 0.6
    }),
    ...fbox([
      ['Rule for answer 7', C.amber],
      ['Cards paper: 0 points', CARDS],
      ['Sheet paper: 0 points', SHEET]
    ], C.amber),
    ...say('THE GUIDE AWARDS NO POINT FOR THIS ANSWER', C.amber)
  );

  // ------------------------------------------------------------
  // 10–14: visible activity labels influence the recorded score.
  // The answers themselves have not changed.
  // ------------------------------------------------------------

  const expectation = tag(
    '“CARDS SHOULD HELP”',
    C.amber,
    P ? 0 : 4.3,
    P ? -3.32 : 1.77,
    P ? 17 : 16,
    P ? 5.9 : 3.8
  );

  await until(S(10));

  await play(
    fi(expectation),
    new M.Indicate(activities[0], {
      color: CARDS,
      runTime: 0.85
    }),
    ...fbox([
      ['Suppose the grader expects', C.amber],
      'cards to improve learning',
      'They can see the label'
    ], C.amber),
    ...say('THE GRADER EXPECTS CARDS TO HELP', C.amber)
  );

  const extraBlock = block(
    slot(0, 6),
    C.amber,
    true
  );

  const biasedMark = gradingMark(
    0, 6, '+1', C.amber
  );

  const score7 = scoreLabel(
    0, 7, CARDS
  );

  await until(S(11));

  await play(
    fo(marks[0][6]),
    fi(biasedMark),
    fi(extraBlock),
    fo(scores[0]),
    fi(score7),
    ...note('Same answer, but an extra point is awarded', C.amber),
    ...fbox([
      ['Cards paper', CARDS],
      'Guide score = 6',
      ['Extra point = +1', C.amber],
      'Recorded score = 7'
    ], C.amber),
    ...say('ONE EXTRA POINT FOR THE CARDS PAPER', C.amber)
  );

  marks[0][6] = biasedMark;
  scores[0] = score7;
  stacks[0].push(extraBlock);

  await until(S(12));

  await play(
    new M.Indicate(scores[1], {
      color: SHEET,
      runTime: 0.75
    }),
    new M.Indicate(marks[1][6], {
      color: C.muted,
      runTime: 0.65
    }),
    ...fbox([
      ['Sheet paper', SHEET],
      'Guide score = 6',
      'Extra point = 0',
      ['Recorded score = 6', SHEET]
    ], SHEET),
    ...say('THE SHEET PAPER STAYS AT 6', SHEET)
  );

  const extraOutline = rect(
    stackX(0),
    slot(0, 6)[1],
    BW + 0.18,
    PITCH + 0.05,
    C.amber,
    0,
    2.5
  );

  const extraTag = tag(
    '+1',
    C.amber,
    stackX(0),
    slot(0, 6)[1] + 0.40,
    19,
    1.0
  );

  await until(S(13));

  await play(
    new M.Create(extraOutline),
    fi(extraTag),
    ...fbox([
      ['Recorded scores', C.ink],
      ['Cards = 7', CARDS],
      ['Sheet = 6', SHEET],
      ['One unmatched point', C.amber]
    ], C.amber),
    ...say('7 BLOCKS BESIDE ONE PAPER, 6 BESIDE THE OTHER', C.amber)
  );

  await until(S(14));

  await play(
    new M.Indicate(extraBlock, {
      color: C.amber,
      runTime: 0.85
    }),
    ...note('Identical answers, different recorded scores', C.amber),
    ...fbox([
      ['Grading gap', C.amber],
      '7 − 6 = 1 point',
      'The answers are identical',
      ['The extra point came from grading', C.amber]
    ], C.amber),
    ...say('THE ACTIVITY LABEL CREATED A SCORE GAP', C.amber)
  );

  // ------------------------------------------------------------
  // 15–17: rewind to the same papers before they are marked.
  // Hide the activity information and use neutral paper codes.
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    ...hide(
      expectation,
      extraOutline,
      extraTag,
      ...borderlineOutlines,
      ...marks.flat(),
      ...stacks.flat(),
      ...scores
    ),
    ...clearBox(),
    ...note('Same grader. Same papers. Before marking.', C.violet),
    ...say('IMAGINE THE SAME AFTERNOON AGAIN', C.violet)
  );

  marks = [[], []];
  stacks = [[], []];
  scores = [null, null];

  let masks = [
    maskedLabel(0),
    maskedLabel(1)
  ];

  await until(S(16));

  await play(
    ...hide(...activities, ...names),
    ...masks.map(t => fi(t)),
    ...fbox([
      ['Before grading', C.violet],
      'Remove activity information',
      'Keep all answers visible'
    ], C.violet),
    ...say('COVER THE ACTIVITY LABELS BEFORE GRADING', C.violet)
  );

  let codes = [
    codeLabel(0),
    codeLabel(1)
  ];

  await until(S(17));

  await play(
    ...hide(...masks),
    ...codes.map(t => fi(t)),
    ...note('Neutral codes identify the papers, not the activities', C.violet),
    ...fbox([
      ['Paper codes', C.violet],
      'First paper: 17',
      'Second paper: 42',
      'Neither code reveals activity'
    ], C.violet),
    ...say('GIVE EACH PAPER ITS OWN NEUTRAL CODE', C.violet)
  );

  // ------------------------------------------------------------
  // 18–21: the grader can see answers but not the activities.
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    new M.LaggedStart(
      papers.map(p =>
        new M.Indicate(p, {
          color: C.ink,
          runTime: 0.65
        })
      ),
      { lagRatio: 0.30, runTime: 1.15 }
    ),
    new M.Indicate(guide, {
      color: C.green,
      runTime: 0.75
    }),
    ...fbox([
      ['What the grader can see', C.green],
      'Every answer',
      'The marking guide',
      'A neutral paper code'
    ], C.green),
    ...say('ALL ANSWERS AND THE GUIDE ARE STILL VISIBLE', C.green)
  );

  await until(S(19));

  await play(
    new M.Indicate(codes[0], {
      color: C.violet,
      runTime: 0.65
    }),
    new M.Indicate(codes[1], {
      color: C.violet,
      runTime: 0.65
    }),
    ...fbox([
      ['What the grader cannot see', C.violet],
      'Who received quiz cards',
      'Who received review sheets',
      'No activity clue in these papers'
    ], C.violet),
    ...say('THE CODES DO NOT REVEAL THE ACTIVITY', C.violet)
  );

  await until(S(20));

  await play(
    ...fbox([
      ['Blinding', C.violet],
      'Keep information hidden',
      'when knowing it could',
      'influence the result'
    ], C.violet),
    ...say('KEEPING THAT INFORMATION HIDDEN = BLINDING', C.violet)
  );

  const blindedTag = tag(
    'GRADER BLINDED TO ACTIVITY',
    C.green,
    CX,
    NOTE_Y,
    P ? 18 : 17,
    P ? 6.8 : 6.5
  );

  await until(S(21));

  await play(
    ...clearNote(),
    fi(blindedTag),
    ...fbox([
      ['Who is blinded?', C.violet],
      ['The grader', C.green],
      'Hidden information:',
      'the practice activity'
    ], C.violet),
    ...say('HERE, THE TEACHER BLINDS THE GRADER', C.green)
  );

  // ------------------------------------------------------------
  // 22–23: grade both coded papers under the same guide.
  // Neutral blocks are used because the grader does not know
  // which activity belongs to either paper.
  // ------------------------------------------------------------

  marks = [
    guideMarks(0),
    guideMarks(1)
  ];

  stacks = [
    stack(6, 0, C.green),
    stack(6, 1, C.green)
  ];

  scores = [
    scoreLabel(0, 6, C.green),
    scoreLabel(1, 6, C.green)
  ];

  borderlineOutlines = [
    answerOutline(0, C.green),
    answerOutline(1, C.green)
  ];

  await until(S(22));

  await play(
    ...marks.flat().map(t => fi(t)),
    reveal(stacks[0], 1.05),
    reveal(stacks[1], 1.05),
    ...scores.map(t => fi(t)),
    ...fbox([
      ['Apply the same guide', C.green],
      'Code 17: 6 points',
      'Code 42: 6 points',
      ['No extra point', C.green]
    ], C.green),
    ...say('WITH THE GUIDE, BOTH PAPERS EARN 6', C.green)
  );

  const matchedLevel = new M.DashedLine({
    start: [
      stackX(0) - BW / 2 - 0.10,
      BASE + 6 * PITCH,
      0
    ],
    end: [
      stackX(1) + BW / 2 + 0.10,
      BASE + 6 * PITCH,
      0
    ],
    color: C.green,
    strokeWidth: 2
  });

  const matchFrames = [0, 1].map(k =>
    rect(
      stackX(k),
      BASE + 3 * PITCH,
      BW + 0.20,
      6 * PITCH + 0.08,
      C.green,
      0,
      2
    )
  );

  await until(S(23));

  await play(
    ...matchFrames.map(r =>
      new M.Create(r, { runTime: 0.45 })
    ),
    new M.Create(matchedLevel, { runTime: 0.7 }),
    new M.LaggedStart(
      Array.from({ length: 6 }, (_, j) =>
        new M.LaggedStart([
          new M.Indicate(stacks[0][j], {
            color: C.green,
            runTime: 0.25
          }),
          new M.Indicate(stacks[1][j], {
            color: C.green,
            runTime: 0.25
          })
        ], {
          lagRatio: 0
        })
      ),
      { lagRatio: 0.20, runTime: 1.65 }
    ),
    ...fbox([
      ['Equal recorded scores', C.green],
      '6 blocks on each side',
      ['Every point has a match', C.green]
    ], C.green),
    ...say('THE TWO STACKS MATCH EXACTLY', C.green)
  );

  // ------------------------------------------------------------
  // 24–27: compare the score gaps with and without blinding.
  // These are two versions of the same marking example.
  // ------------------------------------------------------------

  // The recap uses fresh stacks in a separate comparison picture.
  // No already-visible objects are wrapped into new groups.

  const RECAP_Y = P ? 0.45 : -0.10;
  const RECAP_BASE = P ? -1.35 : -1.85;
  const RECAP_PITCH = P ? 0.32 : 0.27;

  const RECAP_X = [
    CX - 2.60,
    CX - 1.45,
    CX + 1.45,
    CX + 2.60
  ];

  function recapBlock(k, j, color, extra = false) {
    const x = RECAP_X[k];
    const y = RECAP_BASE + (j + 0.5) * RECAP_PITCH;

    const glow = new M.Rectangle({
      width: BW + 0.10,
      height: RECAP_PITCH * 0.94,
      color,
      strokeWidth: 1
    });

    glow.setFill(color, extra ? 0.24 : 0.12);
    glow.moveTo([x, y, 0]);

    const core = new M.Rectangle({
      width: BW,
      height: RECAP_PITCH * 0.76,
      color,
      strokeWidth: extra ? 2 : 1.4
    });

    core.setFill(color, 0.86);
    core.moveTo([x, y, 0]);

    return new M.VGroup(glow, core);
  }

  const recapValues = [7, 6, 6, 6];

  const recapStacks = recapValues.map((n, k) =>
    Array.from({ length: n }, (_, j) => {
      const extra = k === 0 && j === 6;

      return recapBlock(
        k,
        j,
        extra ? C.amber : (k % 2 === 0 ? CARDS : SHEET),
        extra
      );
    })
  );

  const recapTitles = [
    tag(
      'LABELS SHOWING',
      C.amber,
      CX - 2.025,
      P ? 2.05 : 1.29,
      16,
      3.15
    ),
    tag(
      'CODED PAPERS',
      C.green,
      CX + 2.025,
      P ? 2.05 : 1.29,
      16,
      3.15
    )
  ];

  const recapFrames = [0, 1].map(g =>
    rect(
      CX + (g === 0 ? -2.025 : 2.025),
      RECAP_Y - 0.24,
      P ? 3.24 : 3.20,
      P ? 3.35 : 3.04,
      g === 0 ? C.amber : C.green,
      0,
      2
    )
  );

  const recapLabels = recapValues.map((n, k) =>
    txt(
      String(n),
      23,
      k % 2 === 0 ? CARDS : SHEET,
      RECAP_X[k],
      RECAP_BASE - 0.27,
      true
    )
  );

  const recapActivities = recapValues.map((_, k) =>
    txt(
      k % 2 === 0 ? 'Cards' : 'Sheet',
      15,
      k % 2 === 0 ? CARDS : SHEET,
      RECAP_X[k],
      RECAP_BASE - 0.63,
      true,
      1.04
    )
  );

  const recapFloor = [0, 1].map(g =>
    new M.Line({
      start: [RECAP_X[g * 2] - 0.52, RECAP_BASE, 0],
      end: [RECAP_X[g * 2 + 1] + 0.52, RECAP_BASE, 0],
      color: C.muted,
      strokeWidth: 2
    })
  );

  const recapTeacherView = txt(
    'Teacher comparison after marking',
    P ? 18 : 16,
    C.muted,
    CX,
    P ? 2.78 : -3.40,
    true,
    6.7
  );

  await until(S(24));

  await play(
    ...hide(
      ...papers,
      ...codes,
      ...marks.flat(),
      ...stacks.flat(),
      ...scores,
      ...matchFrames,
      matchedLevel,
      blindedTag,
      guide
    ),
    ...recapFrames.map(r => fi(r)),
    ...recapTitles.map(t => fi(t)),
    ...recapFloor.map(l => new M.Create(l)),
    ...recapActivities.map(t => fi(t)),
    fi(recapTeacherView),
    ...fbox([
      ['Recorded score gap', C.ink],
      ['  = cards score', CARDS],
      ['  − sheet score', SHEET]
    ], C.cyan),
    ...say('SCORE GAP = CARDS SCORE MINUS SHEET SCORE')
  );

  const biasedGap = tag(
    'GAP = 1',
    C.amber,
    CX - 2.025,
    P ? -2.55 : -2.78,
    17,
    2.7
  );

  await until(S(25));

  await play(
    reveal(recapStacks[0]),
    reveal(recapStacks[1]),
    fi(recapLabels[0]),
    fi(recapLabels[1]),
    fi(biasedGap),
    ...fbox([
      ['With activity labels showing', C.amber],
      ['  = 7 − 6', C.ink],
      ['  = 1 point', C.amber]
    ], C.amber),
    ...say('LABELS SHOWING: 7 − 6 = 1 POINT', C.amber)
  );

  const blindedGap = tag(
    'GAP = 0',
    C.green,
    CX + 2.025,
    P ? -2.55 : -2.78,
    17,
    2.7
  );

  await until(S(26));

  await play(
    reveal(recapStacks[2]),
    reveal(recapStacks[3]),
    fi(recapLabels[2]),
    fi(recapLabels[3]),
    fi(blindedGap),
    ...fbox([
      ['With neutral paper codes', C.green],
      ['  = 6 − 6', C.ink],
      ['  = 0 points', C.green]
    ], C.green),
    ...say('CODED PAPERS: 6 − 6 = 0', C.green)
  );

  await until(S(27));

  await play(
    new M.Indicate(biasedGap, {
      color: C.amber,
      runTime: 0.8
    }),
    new M.Indicate(blindedGap, {
      color: C.green,
      runTime: 0.8
    }),
    ...fbox([
      ['When to use blinding', C.violet],
      'When knowing the activity',
      'might change how someone',
      'scores the same evidence'
    ], C.violet),
    ...say('BLIND THE GRADER WHEN KNOWLEDGE COULD AFFECT MARKS', C.violet)
  );

  // ------------------------------------------------------------
  // 28–29: the trap — hiding names but not activity labels.
  // Anonymous student identities are not enough when the
  // potentially biasing information remains visible.
  // ------------------------------------------------------------

  const trapPapers = [
    quizPaper(0),
    quizPaper(1)
  ];

  activities = [
    activityLabel(0),
    activityLabel(1)
  ];

  const anonymousNames = [0, 1].map(k =>
    txt(
      'Name hidden',
      P ? 18 : 14,
      C.muted,
      paperX(k),
      ID_Y,
      true,
      PAPER_W
    )
  );

  const trapWarning = tag(
    'ACTIVITIES STILL VISIBLE',
    C.amber,
    CX,
    NOTE_Y,
    P ? 17 : 16,
    6.6
  );

  const labelOutlines = [0, 1].map(k =>
    rect(
      paperX(k) + 0.30,
      LABEL_Y,
      3.12,
      0.48,
      C.amber,
      0,
      2
    )
  );

  await until(S(28));

  await play(
    ...hide(
      ...recapFrames,
      ...recapTitles,
      ...recapFloor,
      ...recapActivities,
      ...recapStacks.flat(),
      ...recapLabels,
      recapTeacherView,
      biasedGap,
      blindedGap
    ),
    ...trapPapers.map(p => fi(p)),
    ...activities.map(t => fi(t)),
    ...anonymousNames.map(t => fi(t)),
    fi(trapWarning),
    ...fbox([
      ['Common mistake', C.amber],
      'Hide the student names',
      'Leave the activity labels on',
      ['The grader still knows', C.amber]
    ], C.amber),
    ...say('HIDING NAMES ALONE IS NOT ENOUGH', C.amber)
  );

  await until(S(29));

  await play(
    ...labelOutlines.map(r =>
      new M.Create(r, { runTime: 0.45 })
    ),
    new M.Indicate(activities[0], {
      color: C.amber,
      runTime: 0.8
    }),
    ...fbox([
      ['Activity information remains', C.amber],
      'The grader sees “quiz cards”',
      'even without a student name',
      ['Not blinded to activity', C.amber]
    ], C.amber),
    ...say('IF THE CARDS LABEL IS VISIBLE, THE GRADER KNOWS', C.amber)
  );

  // ------------------------------------------------------------
  // 30–31: a private code list allows the teacher to return
  // papers without exposing activity information to the grader.
  // ------------------------------------------------------------

  codes = [
    codeLabel(0),
    codeLabel(1)
  ];

  const LIST_X = GUIDEX;
  const LIST_Y = GUIDEY;

  const LIST_W = P ? 6.15 : 3.85;
  const LIST_H = P ? 1.50 : 1.78;

  const privateFrame = new M.RoundedRectangle({
    width: LIST_W,
    height: LIST_H,
    cornerRadius: 0.16,
    color: C.violet,
    strokeWidth: 2
  });

  privateFrame.setFill(C.card, 0.98);
  privateFrame.moveTo([LIST_X, LIST_Y, 0]);

  const privateTitle = txt(
    'TEACHER ONLY · PRIVATE LIST',
    P ? 18 : 17,
    C.violet,
    LIST_X,
    LIST_Y + LIST_H / 2 - 0.24,
    true,
    LIST_W - 0.25
  );

  const mapping17 = txt(
    '17  →  Student A',
    P ? 20 : 19,
    C.ink,
    LIST_X,
    LIST_Y + 0.06,
    true,
    LIST_W - 0.35
  );

  const mapping42 = txt(
    '42  →  Student B',
    P ? 20 : 19,
    C.ink,
    LIST_X,
    LIST_Y - 0.32,
    true,
    LIST_W - 0.35
  );

  const privateNote = txt(
    'Not available to the grader',
    P ? 15 : 14,
    C.muted,
    LIST_X,
    LIST_Y - LIST_H / 2 + 0.16,
    true,
    LIST_W - 0.3
  );

  const privateList = new M.VGroup(
    privateFrame,
    privateTitle,
    mapping17,
    mapping42,
    privateNote
  );

  await until(S(30));

  await play(
    ...hide(
      ...activities,
      ...anonymousNames,
      ...labelOutlines,
      trapWarning
    ),
    ...codes.map(t => fi(t)),
    fi(privateList),
    ...fbox([
      ['Teacher keeps the code list', C.violet],
      '17 identifies Student A',
      '42 identifies Student B',
      ['The grader does not see this list', C.green]
    ], C.violet),
    ...say('KEEP THE CODE-TO-STUDENT LIST PRIVATE', C.violet)
  );

  const returnedNames = [
    tag(
      'RETURN TO STUDENT A',
      C.green,
      LX,
      ID_Y - 0.04,
      P ? 15 : 14,
      3.05
    ),
    tag(
      'RETURN TO STUDENT B',
      C.green,
      RX,
      ID_Y - 0.04,
      P ? 15 : 14,
      3.05
    )
  ];

  await until(S(31));

  await play(
    ...returnedNames.map(t => fi(t)),
    new M.LaggedStart([
      new M.Indicate(mapping17, {
        color: C.green,
        runTime: 0.55
      }),
      new M.Indicate(mapping42, {
        color: C.green,
        runTime: 0.55
      })
    ], {
      lagRatio: 0.6,
      runTime: 1.25
    }),
    ...fbox([
      ['After grading', C.green],
      'Teacher checks the code',
      'Finds the correct student',
      'Returns the paper'
    ], C.green),
    ...say('RETURN EACH PAPER TO THE RIGHT STUDENT', C.green)
  );

  // ------------------------------------------------------------
  // 32: final comparison.
  // Blinding removes the activity-label route to grading bias.
  // It does not imply that every possible source of bias is gone.
  // ------------------------------------------------------------

  const finalFrames = [0, 1].map(g =>
    rect(
      CX + (g === 0 ? -2.025 : 2.025),
      RECAP_Y - 0.24,
      P ? 3.24 : 3.20,
      P ? 3.35 : 3.04,
      g === 0 ? C.amber : C.green,
      0,
      2
    )
  );

  const finalTitles = [
    tag(
      'LABELS SHOWING',
      C.amber,
      CX - 2.025,
      P ? 2.05 : 1.29,
      16,
      3.15
    ),
    tag(
      'BLINDED GRADER',
      C.green,
      CX + 2.025,
      P ? 2.05 : 1.29,
      16,
      3.15
    )
  ];

  const finalStacks = recapValues.map((n, k) =>
    Array.from({ length: n }, (_, j) => {
      const extra = k === 0 && j === 6;

      return recapBlock(
        k,
        j,
        extra ? C.amber : (k % 2 === 0 ? CARDS : SHEET),
        extra
      );
    })
  );

  const finalLabels = recapValues.map((n, k) =>
    txt(
      String(n),
      23,
      k % 2 === 0 ? CARDS : SHEET,
      RECAP_X[k],
      RECAP_BASE - 0.27,
      true
    )
  );

  const finalActivities = recapValues.map((_, k) =>
    txt(
      k % 2 === 0 ? 'Cards' : 'Sheet',
      15,
      k % 2 === 0 ? CARDS : SHEET,
      RECAP_X[k],
      RECAP_BASE - 0.63,
      true,
      1.04
    )
  );

  const finalFloors = [0, 1].map(g =>
    new M.Line({
      start: [RECAP_X[g * 2] - 0.52, RECAP_BASE, 0],
      end: [RECAP_X[g * 2 + 1] + 0.52, RECAP_BASE, 0],
      color: C.muted,
      strokeWidth: 2
    })
  );

  const finalGaps = [
    tag(
      'GAP = 1',
      C.amber,
      CX - 2.025,
      P ? -2.55 : -2.78,
      18,
      2.7
    ),
    tag(
      'GAP = 0',
      C.green,
      CX + 2.025,
      P ? -2.55 : -2.78,
      18,
      2.7
    )
  ];

  const finalHeading = txt(
    'Identical answers in both versions',
    P ? 19 : 17,
    C.ink,
    CX,
    P ? 2.78 : -3.40,
    true,
    6.7
  );

  const finalExtraOutline = rect(
    RECAP_X[0],
    RECAP_BASE + 6.5 * RECAP_PITCH,
    BW + 0.20,
    RECAP_PITCH + 0.05,
    C.amber,
    0,
    2.5
  );

  await until(S(32));

  await play(
    ...hide(
      ...trapPapers,
      ...codes,
      ...returnedNames,
      privateList
    ),
    ...finalFrames.map(r => fi(r)),
    ...finalTitles.map(t => fi(t)),
    ...finalFloors.map(l => new M.Create(l)),
    ...finalActivities.map(t => fi(t)),
    ...finalLabels.map(t => fi(t)),
    ...finalGaps.map(t => fi(t)),
    fi(finalHeading),

    new M.LaggedStart(
      finalStacks.map(st => reveal(st, 0.75)),
      { lagRatio: 0.12, runTime: 1.65 }
    ),

    new M.Create(finalExtraOutline),

    ...fbox([
      ['BLINDING', C.violet],
      'Hide information that could',
      'influence the assessment',
      ['Labels: 7 − 6 = 1', C.amber],
      ['Codes: 6 − 6 = 0', C.green]
    ], C.green),

    ...say('BLINDING REMOVES ONE ROUTE TO GRADING BIAS', C.green)
  );

  await play(
    new M.Indicate(finalGaps[1], {
      color: C.green,
      runTime: 0.9
    })
  );
}
