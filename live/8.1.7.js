// lesson 8.1.7
// Interference: one student's assignment can affect another student's result.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Fixed chapter data: Maya is assigned the sheet in both scenarios.
// Imagined scores: 4 with a sheet neighbor, 6 with a cards neighbor.
// Later group-level diagrams are schematic, not additional numerical results.
// Uses the supplied engine conventions; browser playback has not been tested.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const CARDS = C.cyan;
  const SHEET = C.pink || '#F472B6';
  const SPILL = C.violet;

  const CX = P ? 0 : -2.6;
  const DX = P ? 1.80 : 1.75;

  const LX = CX - DX;
  const RX = CX + DX;

  const CY = P ? 0.90 : -0.12;
  const PW = P ? 3.35 : 3.25;
  const PH = P ? 3.65 : 3.10;

  const PILL = P ? [0, 3.65, 0] : [CX, 1.98, 0];
  const BOXP = P ? [0, -4.30, 0] : [4.3, -0.3, 0];

  const NOTE_Y = P ? -2.05 : -2.43;

  const BASE = P ? -1.75 : -1.85;
  const PITCH = P ? 0.48 : 0.39;
  const BW = P ? 0.91 : 0.83;

  const SMALL_PITCH = P ? 0.39 : 0.36;
  const SMALL_BW = SMALL_PITCH * 0.75;

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

  // ------------------------------------------------------------
  // Formula box.
  // Lines = ['text' | ['text', color]].
  // Leading spaces indent a line.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.40 : 0.42;

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
    const maxh = P ? 1.95 : 4.6;

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

  // Replaceable explanatory note beneath the main picture.
  let noteNow = null;

  function note(s, color = C.muted, y = NOTE_Y) {
    const next = txt(
      s,
      P ? 18 : 17,
      color,
      CX,
      y,
      true,
      P ? 6.9 : 6.6
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

  // Maya is always the same white dot.
  // The neighbor is a muted dot, independent of assigned activity.
  function student(x, y, name, color = C.ink, radius = 0.14) {
    const halo = new M.Circle({
      radius: radius + 0.12,
      color,
      strokeWidth: 1
    });

    halo.setFill(color, 0.10);
    halo.moveTo([x, y, 0]);

    const dot = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    const label = txt(
      name,
      P ? 17 : 15,
      color,
      x,
      y + 0.40,
      true,
      1.35
    );

    return new M.VGroup(halo, dot, label);
  }

  function desk(x, y) {
    const top = new M.RoundedRectangle({
      width: 1.22,
      height: 0.65,
      cornerRadius: 0.09,
      color: C.muted,
      strokeWidth: 1.8
    });

    top.setFill(C.card, 0.95);
    top.moveTo([x, y, 0]);

    const edge = new M.Line({
      start: [x - 0.49, y - 0.22, 0],
      end: [x + 0.49, y - 0.22, 0],
      color: C.muted,
      strokeWidth: 1
    });

    return new M.VGroup(top, edge);
  }

  function cards(x, y, scale = 1, face = '?') {
    const w = 0.73 * scale;
    const h = 0.45 * scale;

    const back = rect(
      x - 0.10 * scale,
      y + 0.07 * scale,
      w,
      h,
      CARDS,
      0.12,
      1.3
    );

    const front = rect(
      x + 0.06 * scale,
      y - 0.03 * scale,
      w,
      h,
      CARDS,
      0.24,
      2
    );

    const q = txt(
      face,
      Math.round(20 * scale),
      CARDS,
      x + 0.06 * scale,
      y - 0.03 * scale,
      true
    );

    return new M.VGroup(back, front, q);
  }

  function sheet(x, y, scale = 1) {
    const w = 0.88 * scale;
    const h = 0.51 * scale;

    const paper = rect(
      x,
      y,
      w,
      h,
      SHEET,
      0.18,
      1.8
    );

    const lines = Array.from({ length: 3 }, (_, j) =>
      new M.Line({
        start: [
          x - w * 0.30,
          y + h * 0.24 - j * h * 0.24,
          0
        ],
        end: [
          x + w * 0.30,
          y + h * 0.24 - j * h * 0.24,
          0
        ],
        color: SHEET,
        strokeWidth: 1.8
      })
    );

    return new M.VGroup(paper, ...lines);
  }

  // Arrow constructed from ordinary lines.
  function arrow(x1, y1, x2, y2, color = SPILL, dashed = false) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len;
    const uy = dy / len;

    const h = Math.min(0.17, len * 0.30);
    const w = h * 0.60;

    const LineClass = dashed ? M.DashedLine : M.Line;

    const shaft = new LineClass({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: 3
    });

    const head1 = new M.Line({
      start: [x2, y2, 0],
      end: [
        x2 - h * ux + w * uy,
        y2 - h * uy - w * ux,
        0
      ],
      color,
      strokeWidth: 3
    });

    const head2 = new M.Line({
      start: [x2, y2, 0],
      end: [
        x2 - h * ux - w * uy,
        y2 - h * uy + w * ux,
        0
      ],
      color,
      strokeWidth: 3
    });

    return new M.VGroup(shaft, head1, head2);
  }

  // Each glowing block represents one of Maya's later quiz points.
  // Pink remains Maya's assigned-activity colour in both scenarios.
  // Violet highlights points associated with the neighbor's spillover.
  function block(p, color, w = BW, pitch = PITCH) {
    const glow = new M.Rectangle({
      width: w + 0.09,
      height: pitch * 0.94,
      color,
      strokeWidth: 1
    });

    glow.setFill(color, 0.13);
    glow.moveTo(p);

    const core = new M.Rectangle({
      width: w,
      height: pitch * 0.75,
      color,
      strokeWidth: 1.4
    });

    core.setFill(color, 0.86);
    core.moveTo(p);

    return new M.VGroup(glow, core);
  }

  function reveal(st, runTime = 0.95) {
    return new M.LaggedStart(
      st.map(b => fi(b, 0.25)),
      { lagRatio: 0.12, runTime }
    );
  }

  // Coordinate-defined highlight.
  // No existing on-screen objects are wrapped into new groups.
  function outline(x, y, w, h, color = C.amber) {
    return rect(x, y, w, h, color, 0, 2.5);
  }

  // ------------------------------------------------------------
  // A possible-afternoon picture.
  //
  // Maya always sits on the left and receives the review sheet.
  // The neighbor always sits on the right.
  //
  // Only the neighbor's assigned activity changes.
  // ------------------------------------------------------------

  const STUDENT_DX = 0.79;
  const STUDENT_Y = CY + (P ? 0.73 : 0.51);
  const DESK_Y = CY + (P ? 0.02 : -0.12);

  const ACTION_Y = CY - (P ? 0.60 : 0.61);
  const POINTS_Y = CY - (P ? 1.10 : 1.05);
  const RESULT_Y = CY - (P ? 1.52 : 1.35);

  function sceneFrame(x, heading, color = C.muted) {
    const r = new M.RoundedRectangle({
      width: PW,
      height: PH,
      cornerRadius: 0.17,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.40);
    r.moveTo([x, CY, 0]);

    const title = txt(
      heading,
      P ? 18 : 16,
      color,
      x,
      CY + PH / 2 - 0.24,
      true,
      PW - 0.25
    );

    return new M.VGroup(r, title);
  }

  function activityLabels(x, neighborActivity) {
    return [];
    const color =
      neighborActivity === 'cards' ? CARDS : SHEET;

    return [
      txt(
        'Sheet',
        P ? 15 : 14,
        SHEET,
        x - STUDENT_DX,
        DESK_Y - 0.40,
        true,
        1.15
      ),

      txt(
        neighborActivity === 'cards' ? 'Cards' : 'Sheet',
        P ? 15 : 14,
        color,
        x + STUDENT_DX,
        DESK_Y - 0.40,
        true,
        1.15
      )
    ];
  }

  function miniPoints(x, n) {
    return Array.from({ length: n }, (_, j) =>
      block(
        [
          x + (j - (n - 1) / 2) * SMALL_PITCH,
          POINTS_Y,
          0
        ],
        SHEET,
        SMALL_BW,
        SMALL_PITCH
      )
    );
  }

  function scoreText(x, n) {
    return txt(
      `Maya: ${n}/10`,
      P ? 19 : 17,
      SHEET,
      x,
      RESULT_Y,
      true,
      PW - 0.24
    );
  }

  function practiceArrow(x) {
    return arrow(
      x + STUDENT_DX - 0.28,
      STUDENT_Y,
      x - STUDENT_DX + 0.28,
      STUDENT_Y,
      SPILL
    );
  }

  function actionText(x, s, color = SPILL) {
    return txt(
      s,
      P ? 15 : 14,
      color,
      x,
      ACTION_Y,
      true,
      PW - 0.28
    );
  }

  function makePicture(x, neighborActivity) {
    const hasCards = neighborActivity === 'cards';
    const n = hasCards ? 6 : 4;

    const frame = sceneFrame(
      x,
      hasCards ? 'CARDS NEIGHBOR' : 'SHEET NEIGHBOR',
      hasCards ? CARDS : SHEET
    );

    const desks = [
      desk(x - STUDENT_DX, DESK_Y),
      desk(x + STUDENT_DX, DESK_Y)
    ];

    const people = [
      student(
        x - STUDENT_DX,
        STUDENT_Y,
        'Maya',
        C.ink
      ),

      student(
        x + STUDENT_DX,
        STUDENT_Y,
        'Neighbor',
        C.muted
      )
    ];

    const materials = [
      sheet(x - STUDENT_DX, DESK_Y),

      hasCards
        ? cards(x + STUDENT_DX, DESK_Y)
        : sheet(x + STUDENT_DX, DESK_Y)
    ];

    const labels = activityLabels(x, neighborActivity);

    const link = hasCards ? practiceArrow(x) : null;

    const action = actionText(
      x,
      hasCards ? 'Extra recall practice' : 'Reads her own sheet',
      hasCards ? SPILL : C.muted
    );

    const points = miniPoints(x, n);
    const result = scoreText(x, n);

    return {
      x,
      n,
      frame,
      desks,
      people,
      materials,
      labels,
      link,
      action,
      points,
      result
    };
  }

  function pictureParts(p, includePoints = true) {
    return [
      p.frame,
      ...p.desks,
      ...p.people,
      ...p.materials,
      ...p.labels,
      p.link,
      p.action,
      p.result,
      ...(includePoints ? p.points : [])
    ].filter(Boolean);
  }

  function showPicture(p, includePoints = true) {
    return pictureParts(p, includePoints).map(o => fi(o));
  }

  // ------------------------------------------------------------
  // 0–1: Maya receives a review sheet and sits beside a neighbor.
  // ------------------------------------------------------------

  const introY = P ? 0.65 : -0.35;

  const introMaya = student(
    CX - 1.20,
    introY + 0.70,
    'Maya'
  );

  const introNeighbor = student(
    CX + 1.20,
    introY + 0.70,
    'Neighbor',
    C.muted
  );

  const introDesks = [
    desk(CX - 1.20, introY),
    desk(CX + 1.20, introY)
  ];

  const introSheet = sheet(CX - 1.20, introY);

  const introAssignment = tag(
    'ASSIGNED SHEET',
    SHEET,
    CX - 1.20,
    introY - 0.65,
    P ? 17 : 15,
    2.3
  );

  const unknownMaterial = tag(
    '?',
    C.amber,
    CX + 1.20,
    introY,
    20,
    0.85
  );

  await until(S(0));

  await play(
    fi(introMaya),
    fi(introNeighbor),
    ...introDesks.map(d => fi(d)),
    fi(introSheet),
    fi(introAssignment),
    fi(unknownMaterial),
    ...say('MAYA RECEIVES A REVIEW SHEET', SHEET)
  );

  await until(S(1));

  await play(
    new M.Indicate(unknownMaterial, {
      color: C.amber,
      runTime: 0.8
    }),

    ...fbox([
      ['A question about neighbors', C.amber],
      "Maya's activity stays fixed",
      "Could her neighbor's activity",
      ['change her quiz score?', SPILL]
    ], C.amber),

    ...say('COULD HER NEIGHBOR CHANGE HER SCORE?', C.amber)
  );

  // ------------------------------------------------------------
  // 2–6: first possible afternoon.
  // Both students receive the review sheet.
  // Maya's imagined later quiz score is four.
  // ------------------------------------------------------------

  let first = makePicture(CX, 'sheet');

  await until(S(2));

  await play(
    ...hide(
      introMaya,
      introNeighbor,
      ...introDesks,
      introSheet,
      introAssignment,
      unknownMaterial
    ),

    ...clearBox(),

    fi(first.frame),
    ...first.desks.map(d => fi(d)),

    ...say('FIRST PICTURE: TWO DESKS', C.ink)
  );

  await until(S(3));

  await play(
    new M.LaggedStart(
      first.people.map(d => fi(d)),
      { lagRatio: 0.18, runTime: 0.85 }
    ),

    ...say('MAYA AND HER NEIGHBOR', C.ink)
  );

  await until(S(4));

  await play(
    ...first.materials.map(o => fi(o)),
    ...first.labels.map(t => fi(t)),

    ...fbox([
      ['First possible afternoon', C.violet],
      ['Maya receives the sheet', SHEET],
      ['Neighbor receives the sheet', SHEET]
    ], SHEET),

    ...say('BOTH STUDENTS RECEIVE THE SHEET', SHEET)
  );

  await until(S(5));

  await play(
    fi(first.action),
    fi(first.result),

    ...fbox([
      ['Imagined later quiz', C.violet],
      'Maya reads her own sheet',
      ['Her score = 4 points', SHEET]
    ], SHEET),

    ...say('IMAGINE MAYA SCORES 4 POINTS', SHEET)
  );

  await until(S(6));

  await play(
    reveal(first.points, 1.15),

    ...note(
      'Later quiz: 1 glowing block = 1 point',
      C.muted
    ),

    ...say('4 POINTS = 4 GLOWING BLOCKS', SHEET)
  );

  // ------------------------------------------------------------
  // 7–13: second possible afternoon.
  // Maya keeps the sheet, but her neighbor receives cards.
  // The neighbor quizzes Maya, giving her extra recall practice.
  // ------------------------------------------------------------

  let second = makePicture(CX, 'cards');

  await until(S(7));

  await play(
    ...hide(...pictureParts(first)),
    ...clearNote(),

    fi(second.frame),
    ...second.desks.map(d => fi(d)),
    ...second.people.map(d => fi(d)),
    fi(second.materials[0]),

    ...fbox([
      ['Second possible afternoon', C.violet],
      ['Maya still receives the sheet', SHEET],
      'Same student',
      'Same assigned activity'
    ], SHEET),

    ...say('SECOND PICTURE: MAYA KEEPS HER SHEET', SHEET)
  );

  await until(S(8));

  await play(
    fi(second.materials[1]),

    ...fbox([
      ['Only the neighbor changes', SPILL],
      ['Maya: review sheet', SHEET],
      ['Neighbor: quiz cards', CARDS]
    ], SPILL),

    ...say('THE NEIGHBOR RECEIVES QUIZ CARDS', CARDS)
  );

  const questionNote = actionText(
    CX,
    'Neighbor asks a question',
    CARDS
  );

  const recallNote = actionText(
    CX,
    'Maya tries to recall',
    SPILL
  );

  const checkNote = actionText(
    CX,
    'Neighbor checks the answer',
    SPILL
  );

  const questionMark = txt(
    '?',
    P ? 23 : 21,
    CARDS,
    CX,
    STUDENT_Y,
    true
  );

  await until(S(9));

  await play(
    fi(questionNote),
    fi(questionMark),

    new M.Indicate(second.materials[1], {
      color: CARDS,
      runTime: 0.7
    }),

    ...fbox([
      ['Neighbor reads a card', CARDS],
      'Asks Maya a question',
      'Maya hears the question'
    ], CARDS),

    ...say('THE NEIGHBOR QUIZZES MAYA', CARDS)
  );

  await until(S(10));

  await play(
    fo(questionNote),
    fi(recallNote),

    new M.Indicate(second.people[0], {
      color: SPILL,
      runTime: 0.75
    }),

    ...fbox([
      ['Extra recall practice', SPILL],
      'Maya tries to remember',
      'the answer before checking'
    ], SPILL),

    ...say('MAYA TRIES TO REMEMBER THE ANSWER', SPILL)
  );

  await until(S(10) + 1.65);

  await play(
    fo(recallNote),
    fo(questionMark),
    fi(checkNote),

    new M.Transform(
      second.materials[1],
      cards(CX + STUDENT_DX, DESK_Y, 1, 'A'),
      { runTime: 0.45 }
    ),

    ...say('THEN THE NEIGHBOR CHECKS', SPILL)
  );

  await until(S(11));

  await play(
    fo(checkNote),
    fi(second.link),
    fi(second.action),

    ...fbox([
      ['Practice reaches Maya', SPILL],
      'From the neighbor',
      'Across the two desks',
      ['Without changing her assignment', SHEET]
    ], SPILL),

    ...say('EXTRA PRACTICE REACHES MAYA', SPILL)
  );

  await until(S(12));

  await play(
    fi(second.result),

    ...fbox([
      ['Imagined later quiz', C.violet],
      'Maya has extra recall practice',
      ['Her score = 6 points', SHEET]
    ], SPILL),

    ...say('IMAGINE MAYA NOW SCORES 6', SHEET)
  );

  await until(S(13));

  await play(
    reveal(second.points, 1.25),

    ...note(
      'Later quiz: 1 glowing block = 1 point',
      C.muted
    ),

    ...say('6 POINTS = 6 GLOWING BLOCKS', SHEET)
  );

  // ------------------------------------------------------------
  // 14–17: compare the two possible afternoons side by side.
  // Maya's own assignment is fixed; her neighbor's changes.
  // ------------------------------------------------------------

  const firstSide = makePicture(LX, 'sheet');
  const secondSide = makePicture(RX, 'cards');

  await until(S(14));

  await play(
    ...hide(...pictureParts(second)),
    ...clearBox(),

    ...showPicture(firstSide),
    ...showPicture(secondSide),

    ...note('Two imagined outcomes for the same Maya', C.violet),

    ...say('COMPARE THE TWO POSSIBLE AFTERNOONS', C.violet)
  );

  first = firstSide;
  second = secondSide;

  const mayaOutlines = [first, second].map(p =>
    outline(
      p.x - STUDENT_DX,
      DESK_Y,
      1.32,
      0.75,
      SHEET
    )
  );

  await until(S(15));

  await play(
    ...mayaOutlines.map(r =>
      new M.Create(r, { runTime: 0.45 })
    ),

    new M.Indicate(first.materials[0], {
      color: SHEET,
      runTime: 0.7
    }),

    new M.Indicate(second.materials[0], {
      color: SHEET,
      runTime: 0.7
    }),

    ...fbox([
      ["Maya's own activity", SHEET],
      'First picture: sheet',
      'Second picture: sheet',
      ['Nothing changes here', C.green]
    ], SHEET),

    ...say('MAYA RECEIVES THE SHEET IN BOTH PICTURES', SHEET)
  );

  await until(S(16));

  await play(
    ...note("Maya's assigned activity is fixed", SHEET),

    ...fbox([
      ['Assigned activity', C.violet],
      'What the teacher gives',
      ['Maya is assigned the sheet', SHEET]
    ], SHEET),

    ...say('SHEET = HER ASSIGNED ACTIVITY', SHEET)
  );

  const neighborOutlines = [first, second].map((p, k) =>
    outline(
      p.x + STUDENT_DX,
      DESK_Y,
      1.32,
      0.75,
      k === 0 ? SHEET : CARDS
    )
  );

  await until(S(17));

  await play(
    ...hide(...mayaOutlines),

    ...neighborOutlines.map(r =>
      new M.Create(r, { runTime: 0.45 })
    ),

    ...note("Only the neighbor's assignment changes", SPILL),

    ...fbox([
      ['Change one thing', SPILL],
      ['Neighbor in picture 1: sheet', SHEET],
      ['Neighbor in picture 2: cards', CARDS],
      ["Maya's assignment stays fixed", C.green]
    ], SPILL),

    ...say("THE NEIGHBOR'S ASSIGNED ACTIVITY CHANGES", SPILL)
  );

  // ------------------------------------------------------------
  // 18–19: name interference and spillover.
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...hide(...neighborOutlines),

    new M.Indicate(second.link, {
      color: SPILL,
      runTime: 0.9
    }),

    ...fbox([
      ['Interference', SPILL],
      "One person's assignment",
      "can change someone else's",
      'result'
    ], SPILL),

    ...say("ONE PERSON'S ASSIGNMENT AFFECTS ANOTHER", SPILL)
  );

  await until(S(19));

  await play(
    new M.Indicate(second.action, {
      color: SPILL,
      runTime: 0.75
    }),

    ...note('Extra practice passes from one student to another', SPILL),

    ...fbox([
      ['Spillover', SPILL],
      'An effect that reaches',
      'another person',
      ['Here: extra recall practice', SPILL]
    ], SPILL),

    ...say('EXTRA PRACTICE REACHING MAYA = SPILLOVER', SPILL)
  );

  // ------------------------------------------------------------
  // 20–22: move Maya's point blocks into two vertical stacks.
  // Match from the bottom; two points remain unmatched.
  // ------------------------------------------------------------

  const STACK_DX = P ? 1.02 : 1.05;

  const SX = CX - STACK_DX;
  const QX = CX + STACK_DX;

  const stackSlot = (x, j) => [
    x,
    BASE + (j + 0.5) * PITCH,
    0
  ];

  const stackTopY = BASE + 6 * PITCH;

  const stackTitles = [
    txt(
      'Sheet neighbor',
      P ? 18 : 17,
      SHEET,
      SX,
      stackTopY + 0.47,
      true,
      1.95
    ),

    txt(
      'Cards neighbor',
      P ? 18 : 17,
      CARDS,
      QX,
      stackTopY + 0.47,
      true,
      1.95
    )
  ];

  const stackScores = [
    txt(
      '4',
      P ? 27 : 24,
      SHEET,
      SX,
      BASE - 0.30,
      true
    ),

    txt(
      '6',
      P ? 27 : 24,
      SHEET,
      QX,
      BASE - 0.30,
      true
    )
  ];

  const floor = new M.Line({
    start: [SX - 0.65, BASE, 0],
    end: [QX + 0.65, BASE, 0],
    color: C.muted,
    strokeWidth: 2
  });

  const fixedAssignment = tag(
    'MAYA: SHEET IN BOTH',
    SHEET,
    CX,
    P ? 2.43 : 1.42,
    P ? 17 : 15,
    4.7
  );

  await until(S(20));

  await play(
    ...hide(
      ...pictureParts(first, false),
      ...pictureParts(second, false)
    ),

    ...clearBox(),

    ...first.points.map((b, j) =>
      new M.Transform(
        b,
        block(stackSlot(SX, j), SHEET),
        { runTime: 0.95 }
      )
    ),

    ...second.points.map((b, j) =>
      new M.Transform(
        b,
        block(stackSlot(QX, j), SHEET),
        { runTime: 0.95 }
      )
    ),

    new M.Create(floor, { runTime: 0.65 }),

    ...stackTitles.map(t => fi(t)),
    ...stackScores.map(t => fi(t)),
    fi(fixedAssignment),

    ...note(
      'These are both imagined scores for Maya',
      C.violet,
      P ? -2.70 : -2.66
    ),

    ...say("LINE UP MAYA'S TWO POSSIBLE SCORES", C.amber)
  );

  const matches = Array.from({ length: 4 }, (_, j) => {
    const y = BASE + (j + 0.5) * PITCH;

    return new M.Line({
      start: [SX + BW / 2 + 0.05, y, 0],
      end: [QX - BW / 2 - 0.05, y, 0],
      color: C.muted,
      strokeWidth: 2.5
    });
  });

  await until(S(21));

  await play(
    new M.LaggedStart(
      matches.map(l =>
        new M.Create(l, { runTime: 0.25 })
      ),
      { lagRatio: 0.35, runTime: 1.10 }
    ),

    ...say('MATCH THE BLOCKS FROM THE BOTTOM', C.muted)
  );

  const extraOutline = outline(
    QX,
    BASE + 5 * PITCH,
    BW + 0.23,
    2 * PITCH + 0.06,
    SPILL
  );

  const extraTag = tag(
    '+2',
    SPILL,
    QX + (P ? 1.12 : 1.08),
    BASE + 5 * PITCH,
    23,
    1.12
  );

  await until(S(22));

  await play(
    new M.Create(extraOutline, { runTime: 0.55 }),

    new M.Transform(
      second.points[4],
      block(stackSlot(QX, 4), SPILL),
      { runTime: 0.55 }
    ),

    new M.Transform(
      second.points[5],
      block(stackSlot(QX, 5), SPILL),
      { runTime: 0.55 }
    ),

    fi(extraTag),

    ...say('TWO POINTS REMAIN UNMATCHED', SPILL)
  );

  // ------------------------------------------------------------
  // 23–25: write the formula for this neighbor-assignment gap.
  // The comparison changes the neighbor's activity, not Maya's.
  // ------------------------------------------------------------

  await until(S(23));

  await play(
    ...fbox([
      ["Maya's score gap", C.ink],
      ['  = score with cards neighbor', CARDS],
      ['  − score with sheet neighbor', SHEET]
    ], SPILL),

    new M.Indicate(stackScores[1], {
      color: CARDS,
      runTime: 0.75
    }),

    new M.Indicate(stackScores[0], {
      color: SHEET,
      runTime: 0.75
    }),

    ...say('CARDS NEIGHBOR SCORE MINUS SHEET NEIGHBOR SCORE', SPILL)
  );

  await until(S(24));

  await play(
    ...fbox([
      ['Neighbor-assignment gap', SPILL],
      ['  = 6 − 4', C.ink],
      ['  = 2 points', SPILL]
    ], SPILL),

    new M.Indicate(extraTag, {
      color: SPILL,
      runTime: 0.8
    }),

    ...say('6 − 4 = 2 POINTS', SPILL)
  );

  await until(S(25));

  await play(
    new M.Indicate(fixedAssignment, {
      color: SHEET,
      runTime: 0.85
    }),

    ...fbox([
      ['Two potential outcomes', C.violet],
      ['Sheet neighbor: 4', SHEET],
      ['Cards neighbor: 6', CARDS],
      ["Maya's own assignment is fixed", C.green],
      ['Both scores are imagined', C.muted]
    ], C.violet),

    ...say('TWO IMAGINED SCORES FOR THE SAME MAYA', C.violet)
  );

  // ------------------------------------------------------------
  // 26–29: interference can affect a group comparison.
  //
  // Schematic group-level picture:
  // Sheet-assigned students may receive recall practice from
  // cards-assigned neighbors.
  //
  // No additional group scores or numerical effects are invented.
  // ------------------------------------------------------------

  const GROUP_Y = P ? 0.70 : -0.28;
  const GROUP_W = P ? 3.10 : 3.05;
  const GROUP_H = P ? 2.55 : 2.30;

  const GROUP_HEADER_Y =
    GROUP_Y + GROUP_H / 2 - 0.25;

  const GROUP_DOT_Y = GROUP_Y + 0.18;
  const GROUP_MATERIAL_Y = GROUP_Y - 0.43;

  const groupFrames = [
    rect(
      LX,
      GROUP_Y,
      GROUP_W,
      GROUP_H,
      SHEET,
      0.04,
      2
    ),

    rect(
      RX,
      GROUP_Y,
      GROUP_W,
      GROUP_H,
      CARDS,
      0.04,
      2
    )
  ];

  const groupTitles = [
    tag(
      'ASSIGNED SHEET',
      SHEET,
      LX,
      GROUP_HEADER_Y,
      P ? 17 : 16,
      GROUP_W - 0.22
    ),

    tag(
      'ASSIGNED CARDS',
      CARDS,
      RX,
      GROUP_HEADER_Y,
      P ? 17 : 16,
      GROUP_W - 0.22
    )
  ];

  const groupXs = [
    LX - 0.69,
    LX + 0.69,
    RX - 0.69,
    RX + 0.69
  ];

  const groupStudents = groupXs.map((x, k) =>
    student(
      x,
      GROUP_DOT_Y,
      k === 1 ? 'Maya' : 'Student',
      k === 1 ? C.ink : C.muted,
      0.13
    )
  );

  const groupMaterials = groupXs.map((x, k) =>
    k < 2
      ? sheet(x, GROUP_MATERIAL_Y, 0.85)
      : cards(x, GROUP_MATERIAL_Y, 0.85)
  );

  const groupNote = txt(
    'Grouped by assigned activity',
    P ? 18 : 17,
    C.muted,
    CX,
    GROUP_Y - GROUP_H / 2 - 0.37,
    true,
    6.7
  );

  await until(S(26));

  await play(
    ...hide(
      floor,
      ...stackTitles,
      ...stackScores,
      ...matches,
      extraOutline,
      extraTag,
      fixedAssignment,
      ...first.points,
      ...second.points
    ),

    ...clearNote(),
    ...clearBox(),

    ...groupFrames.map(r => fi(r)),
    ...groupTitles.map(t => fi(t)),
    ...groupStudents.map(d => fi(d)),
    ...groupMaterials.map(m => fi(m)),
    fi(groupNote),

    ...say('COMPARE STUDENTS BY THEIR ASSIGNED ACTIVITY')
  );

  const crossGroupArrow = arrow(
    groupXs[2] - 0.28,
    GROUP_DOT_Y,
    groupXs[1] + 0.28,
    GROUP_DOT_Y,
    SPILL
  );

  const crossGroupLabel = tag(
    'SPILLOVER',
    SPILL,
    CX,
    GROUP_Y - GROUP_H / 2 - 0.91,
    P ? 18 : 16,
    2.9
  );

  await until(S(27));

  await play(
    fi(crossGroupArrow),
    fi(crossGroupLabel),

    new M.Indicate(groupStudents[1], {
      color: SPILL,
      runTime: 0.8
    }),

    ...fbox([
      ['Inside the sheet group', SHEET],
      'Some students may also get',
      'quizzed by cards neighbors',
      ['Their assignment is still sheet', SHEET]
    ], SPILL),

    ...say('SHEET STUDENTS MAY RECEIVE CARDS PRACTICE', SPILL)
  );

  const risingX = LX;
  const risingY = P ? 2.55 : 1.42;

  const risingTag = tag(
    'SCORES COULD RISE',
    SPILL,
    risingX,
    risingY,
    P ? 17 : 15,
    GROUP_W
  );

  await until(S(28));

  await play(
    fi(risingTag),

    new M.Indicate(crossGroupArrow, {
      color: SPILL,
      runTime: 0.85
    }),

    ...fbox([
      ['Possible consequence', SPILL],
      'Extra cards practice',
      'reaches the sheet group',
      ['Its quiz scores could rise', SPILL]
    ], SPILL),

    ...say('EXTRA PRACTICE COULD RAISE SHEET SCORES', SPILL)
  );

  const narrowerGap = tag(
    'GAP COULD BE SMALLER',
    C.amber,
    CX,
    P ? -2.56 : -2.67,
    P ? 18 : 16,
    6.1
  );

  await until(S(29));

  await play(
    fo(groupNote),
    fi(narrowerGap),

    ...fbox([
      ['Effect on the comparison', C.amber],
      'If sheet scores rise because',
      'cards practice reaches them,',
      ['the group gap could shrink', C.amber]
    ], C.amber),

    ...say('THE GAP BETWEEN GROUPS CAN GET SMALLER', C.amber)
  );

  // ------------------------------------------------------------
  // 30–32: planning an experiment requires thinking about
  // who can pass practice or materials to someone else.
  // The assigned label alone may not describe every exposure.
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...hide(risingTag, narrowerGap),

    new M.Indicate(crossGroupArrow, {
      color: SPILL,
      runTime: 0.9
    }),

    ...fbox([
      ['Before running a test', C.violet],
      'Who studies near whom?',
      'Who might share materials?',
      'Who might quiz a neighbor?'
    ], C.violet),

    ...say('ASK WHO COULD PASS THE PRACTICE ALONG', C.violet)
  );

  const trapOutline = outline(
    LX,
    GROUP_HEADER_Y,
    GROUP_W - 0.10,
    0.53,
    C.amber
  );

  await until(S(31));

  await play(
    new M.Create(trapOutline, {
      runTime: 0.55
    }),

    ...fbox([
      ['Common mistake', C.amber],
      'Treat the assigned label',
      'as the whole story',
      ['Sheet does not mean no spillover', SPILL]
    ], C.amber),

    ...say('THE TRAP: THE SHEET LABEL IS NOT THE WHOLE STORY', C.amber)
  );

  // Return to the original two-desk picture so the learner
  // sees exactly where Maya's additional practice came from.
  const recallPicture = makePicture(CX, 'cards');

  await until(S(32));

  await play(
    ...hide(
      ...groupFrames,
      ...groupTitles,
      ...groupStudents,
      ...groupMaterials,
      crossGroupArrow,
      crossGroupLabel,
      trapOutline
    ),

    ...showPicture(recallPicture),

    ...note('The arrow shows practice reaching Maya', SPILL),

    ...fbox([
      ["Maya's assignment", SHEET],
      'Review sheet',
      ['Additional practice', SPILL],
      'Recall questions from neighbor',
      ['Imagined score: 6', C.ink]
    ], SPILL),

    ...say('FOLLOW THE ARROW: MAYA GOT EXTRA PRACTICE', SPILL)
  );

  // ------------------------------------------------------------
  // 33: preview section-level assignment.
  //
  // Each tutorial section receives one activity as a whole.
  // Sharing inside the section is allowed.
  // This is a schematic preview of the next lesson.
  // ------------------------------------------------------------

  const SECTION_Y = P ? 0.60 : -0.30;
  const SECTION_W = P ? 3.20 : 3.12;
  const SECTION_H = P ? 2.55 : 2.35;

  function tutorialSection(x, activity) {
    const color = activity === 'cards' ? CARDS : SHEET;

    const frame = rect(
      x,
      SECTION_Y,
      SECTION_W,
      SECTION_H,
      color,
      0.04,
      2.3
    );

    const heading = txt(
      'TUTORIAL SECTION',
      P ? 17 : 15,
      C.ink,
      x,
      SECTION_Y + SECTION_H / 2 - 0.23,
      true,
      SECTION_W - 0.22
    );

    const assigned = tag(
      activity === 'cards' ? 'ALL GET CARDS' : 'ALL GET SHEETS',
      color,
      x,
      SECTION_Y - SECTION_H / 2 + 0.31,
      P ? 16 : 15,
      SECTION_W - 0.25
    );

    const y = SECTION_Y + 0.18;

    const sharing = new M.Line({
      start: [x - 0.39, y, 0],
      end: [x + 0.39, y, 0],
      color: SPILL,
      strokeWidth: 3
    });

    const people = [
      new M.Dot({
        point: [x - 0.60, y, 0],
        radius: 0.15,
        color: C.ink
      }),

      new M.Dot({
        point: [x + 0.60, y, 0],
        radius: 0.15,
        color: C.ink
      })
    ];

    const materials = [-0.60, 0.60].map(dx =>
      activity === 'cards'
        ? cards(x + dx, y - 0.51, 0.75)
        : sheet(x + dx, y - 0.51, 0.75)
    );

    return new M.VGroup(
      frame,
      heading,
      assigned,
      sharing,
      ...people,
      ...materials
    );
  }

  const sections = [
    tutorialSection(LX, 'sheet'),
    tutorialSection(RX, 'cards')
  ];

  await until(S(33));

  await play(
    ...hide(...pictureParts(recallPicture)),

    ...sections.map(r => fi(r)),

    ...note('Make the activity choice for the whole section', C.green),

    ...fbox([
      ['Next lesson', C.violet],
      'Assign tutorial sections',
      'rather than individual students',
      ['One activity per section', C.green]
    ], C.green),

    ...say('NEXT: ASSIGN THE WHOLE TUTORIAL SECTION', C.green)
  );

  // ------------------------------------------------------------
  // 34: final picture.
  // Maya's own assigned activity is unchanged.
  // Changing her neighbor's assignment can change her result.
  // ------------------------------------------------------------

  const finalFirst = makePicture(LX, 'sheet');
  const finalSecond = makePicture(RX, 'cards');

  // Highlight only the two extra points in the final illustration.
  // These groups have not yet been added to the scene.
  finalSecond.points[4].submobjects[0].setColor(SPILL);
  finalSecond.points[4].submobjects[0].setFill(SPILL, 0.13);
  finalSecond.points[4].submobjects[1].setColor(SPILL);
  finalSecond.points[4].submobjects[1].setFill(SPILL, 0.86);

  finalSecond.points[5].submobjects[0].setColor(SPILL);
  finalSecond.points[5].submobjects[0].setFill(SPILL, 0.13);
  finalSecond.points[5].submobjects[1].setColor(SPILL);
  finalSecond.points[5].submobjects[1].setFill(SPILL, 0.86);

  const finalAssignment = tag(
    'SAME MAYA · SAME ASSIGNED SHEET',
    SHEET,
    CX,
    P ? 3.04 : -2.3,
    P ? 17 : 15,
    6.7
  );

  const finalGap = tag(
    'NEIGHBOR-ASSIGNMENT GAP = +2',
    SPILL,
    CX,
    P ? NOTE_Y : -2.85,
    P ? 18 : 16,
    6.6
  );

  await until(S(34));

  await play(
    ...hide(...sections),
    ...clearNote(),

    ...showPicture(finalFirst),
    ...showPicture(finalSecond),

    fi(finalAssignment),
    fi(finalGap),

    ...fbox([
      ['INTERFERENCE', SPILL],
      "One person's assigned activity",
      "can change someone else's result",
      ['Sheet neighbor: 4', SHEET],
      ['Cards neighbor: 6', CARDS],
      ['Imagined gap: 6 − 4 = 2', SPILL]
    ], SPILL),

    ...say("ONE PERSON'S ASSIGNMENT CAN AFFECT SOMEONE ELSE", SPILL)
  );

  await play(
    new M.Indicate(finalSecond.link, {
      color: SPILL,
      runTime: 0.85
    }),

    new M.Indicate(finalGap, {
      color: SPILL,
      runTime: 0.85
    })
  );
}
