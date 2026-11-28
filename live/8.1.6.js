// lesson 8.1.6
// Intention to treat: compare students under their original assignments.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Student identifiers A–D and the illustrative random draw are visual choices.
// Uses the supplied engine conventions; browser playback has not been tested.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const CARDS = C.cyan;
  const SHEET = C.pink || '#F472B6';

  // Fixed chapter data.
  // A: assigned cards, uses cards, scores 8.
  // B: assigned cards, switches to sheet, scores 6.
  // C: assigned sheet, uses sheet, scores 8.
  // D: assigned sheet, uses sheet, scores 4.
  const NAMES = ['A', 'B', 'C', 'D'];
  const ASSIGNED = ['cards', 'cards', 'sheet', 'sheet'];
  const USED = ['cards', 'sheet', 'sheet', 'sheet'];
  const SCORES = [8, 6, 8, 4];

  const CX = P ? 0 : -2.6;

  const PILL = P ? [0, 3.65, 0] : [CX, 1.98, 0];
  const BOXP = P ? [0, -4.35, 0] : [4.3, -0.3, 0];

  const ASSIGN_X = [-2.65, -1.10, 1.10, 2.65];
  const ACTUAL_X = [-2.65, 0.0, 1.40, 2.80];

  let positions = ASSIGN_X.slice();

  const INTRO_Y = P ? 0.75 : -0.20;

  const BASE = P ? -0.72 : -1.03;
  const PITCH = P ? 0.32 : 0.22;
  const BW = P ? 0.72 : 0.70;

  const PERSON_Y = BASE - 0.36;
  const USE_Y = PERSON_Y - 0.60;

  const HEADER_Y = P ? 2.87 : 1.40;
  const SCORE_Y = P ? 2.15 : 0.99;
  const MEAN_Y = P ? -2.48 : -2.82;
  const NOTE_Y = P ? -3.08 : -3.30;

  const px = k => CX + positions[k];
  const activityColor = a => a === 'cards' ? CARDS : SHEET;

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

  // Replaceable explanatory note.
  let noteNow = null;

  function note(s, color = C.muted, y = NOTE_Y) {
    const next = txt(
      s,
      P ? 18 : 16,
      color,
      CX,
      y,
      true,
      P ? 6.8 : 6.5
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

  // Student dots remain neutral so their identities do not change
  // when the assignment or actual-use grouping changes.
  function student(k, x, y) {
    // Letter sits inside its dot, centred on the student's stack.
    const halo = new M.Circle({
      radius: 0.30,
      color: C.ink,
      strokeWidth: 1
    });

    halo.setFill(C.ink, 0.10);
    halo.moveTo([x, y, 0]);

    const dot = new M.Dot({
      point: [x, y, 0],
      radius: 0.22,
      color: C.ink
    });

    const label = txt(
      NAMES[k],
      P ? 18 : 17,
      C.bg,
      x,
      y,
      true
    );

    return new M.VGroup(halo, dot, label);
  }

  function cards(x, y, scale = 1) {
    const w = 0.92 * scale;
    const h = 0.59 * scale;

    const back = rect(
      x - 0.12 * scale,
      y + 0.09 * scale,
      w,
      h,
      CARDS,
      0.13,
      1.5
    );

    const front = rect(
      x + 0.07 * scale,
      y - 0.03 * scale,
      w,
      h,
      CARDS,
      0.24,
      2
    );

    const q = txt(
      '?',
      Math.round(24 * scale),
      CARDS,
      x + 0.07 * scale,
      y - 0.03 * scale,
      true
    );

    return new M.VGroup(back, front, q);
  }

  function sheet(x, y, scale = 1) {
    const w = 1.01 * scale;
    const h = 0.69 * scale;

    const paper = rect(
      x,
      y,
      w,
      h,
      SHEET,
      0.17,
      2
    );

    const lines = Array.from({ length: 3 }, (_, j) =>
      new M.Line({
        start: [
          x - w * 0.31,
          y + h * 0.24 - j * h * 0.24,
          0
        ],
        end: [
          x + w * 0.31,
          y + h * 0.24 - j * h * 0.24,
          0
        ],
        color: SHEET,
        strokeWidth: 2
      })
    );

    return new M.VGroup(paper, ...lines);
  }

  // Actual-use icon is separate from the assigned group label.
  function useIcon(k, x, y) {
    const activity = USED[k];
    const color = activityColor(activity);

    const material = activity === 'cards'
      ? cards(x, y + 0.16, 0.48)
      : sheet(x, y + 0.16, 0.48);

    const label = txt(
      activity === 'cards' ? 'Uses cards' : 'Uses sheet',
      P ? 15 : 13,
      color,
      x,
      y - 0.27,
      true,
      1.30
    );

    return new M.VGroup(material, label);
  }

  // Each block represents one point on the later quiz.
  function block(p, color) {
    const glow = new M.Rectangle({
      width: BW + 0.09,
      height: PITCH * 0.96,
      color,
      strokeWidth: 1
    });

    glow.setFill(color, 0.12);
    glow.moveTo(p);

    const core = new M.Rectangle({
      width: BW,
      height: PITCH * 0.76,
      color,
      strokeWidth: 1.4
    });

    core.setFill(color, 0.86);
    core.moveTo(p);

    return new M.VGroup(glow, core);
  }

  const slot = (k, j) => [
    px(k),
    BASE + (j + 0.5) * PITCH,
    0
  ];

  function reveal(st, runTime = 0.9) {
    return new M.LaggedStart(
      st.map(b => fi(b, 0.25)),
      { lagRatio: 0.10, runTime }
    );
  }

  function scoreLabel(k, x = px(k)) {
    return txt(
      `Scored ${SCORES[k]}`,
      P ? 19 : 17,
      C.ink,
      x,
      SCORE_Y,
      true,
      1.36
    );
  }

  function groupBounds(ids, pos = positions) {
    const xs = ids.map(k => CX + pos[k]);

    const left = Math.min(...xs) - 0.69;
    const right = Math.max(...xs) + 0.69;

    return {
      left,
      right,
      x: (left + right) / 2,
      w: right - left
    };
  }

  // Coordinate-defined outlines.
  // Never regroup objects that are already visible.
  function groupFrame(ids, color, full = false, pos = positions) {
    const b = groupBounds(ids, pos);

    const top = full
      ? SCORE_Y + 0.26
      : INTRO_Y + 0.43;

    const bottom = full
      ? USE_Y - 0.52
      : INTRO_Y - 1.08;

    return rect(
      b.x,
      (top + bottom) / 2,
      b.w,
      top - bottom,
      color,
      0,
      2
    );
  }

  function groupHeading(ids, activity, mode = 'assigned', pos = positions) {
    const b = groupBounds(ids, pos);
    const color = activityColor(activity);

    const prefix = mode === 'assigned' ? 'ASSIGNED' : 'USED';
    const name = activity === 'cards' ? 'CARDS' : 'SHEET';

    return tag(
      `${prefix} ${name}`,
      color,
      b.x,
      HEADER_Y,
      P ? 17 : 16,
      b.w
    );
  }

  function groupMean(ids, n, color, pos = positions) {
    const b = groupBounds(ids, pos);

    return tag(
      `MEAN = ${n}`,
      color,
      b.x,
      MEAN_Y,
      P ? 19 : 17,
      b.w
    );
  }

  function groupLevel(ids, n, color, pos = positions) {
    const b = groupBounds(ids, pos);

    return new M.DashedLine({
      start: [
        b.left + 0.08,
        BASE + n * PITCH,
        0
      ],
      end: [
        b.right - 0.08,
        BASE + n * PITCH,
        0
      ],
      color,
      strokeWidth: 2
    });
  }

  // A highlight is independent of the objects it surrounds.
  function studentOutline(k, y, color = C.amber) {
    return rect(
      px(k),
      y,
      1.18,
      0.67,
      color,
      0,
      2
    );
  }

  // ------------------------------------------------------------
  // Scene state.
  // ------------------------------------------------------------

  const introPositions = [-1.8, -0.6, 0.6, 1.8];

  const students = NAMES.map((_, k) =>
    student(k, CX + introPositions[k], INTRO_Y)
  );

  let icons = [null, null, null, null];
  let scores = [null, null, null, null];

  let headings = [null, null];
  let frames = [null, null];

  let means = [null, null];
  let levels = [null, null];

  let stacks = [[], [], [], []];
  let originalBlocks = [[], [], [], []];

  let switchOutline = null;
  let switchTag = null;

  function moveStudent(k, x, y, runTime = 0.75) {
    return new M.Transform(
      students[k],
      student(k, x, y),
      { runTime }
    );
  }

  function moveIcon(k, x, y, runTime = 0.75) {
    return new M.Transform(
      icons[k],
      useIcon(k, x, y),
      { runTime }
    );
  }

  function clearMeans() {
    const a = hide(...means, ...levels);

    means = [null, null];
    levels = [null, null];

    return a;
  }

  function showMean(g, ids, value, color) {
    means[g] = groupMean(ids, value, color);
    levels[g] = groupLevel(ids, value, color);

    return [
      fi(means[g]),
      new M.Create(levels[g], { runTime: 0.45 })
    ];
  }

  // Move existing blocks to visualise equal sharing.
  // This changes the picture, never the students' recorded scores.
  function transfer(from, to, n, color, runTime = 1.1) {
    const moves = [];

    for (let j = 0; j < n; j++) {
      const b = stacks[from].pop();
      const target = slot(to, stacks[to].length);

      stacks[to].push(b);

      moves.push(
        new M.Transform(
          b,
          block(target, color),
          {
            pathArc: from < to ? -0.75 : 0.75,
            runTime: 0.65
          }
        )
      );
    }

    return new M.LaggedStart(
      moves,
      { lagRatio: 0.30, runTime }
    );
  }

  // Restore original quiz-point ownership and move the complete
  // student picture into its new grouping.
  // Every already-visible object receives a single transform.
  function regroup(nextPositions, groups, mode, runTime = 1.1) {
    const oldFrames = frames;
    const oldHeadings = headings;

    positions = nextPositions.slice();

    frames = [
      groupFrame(groups[0], CARDS, true),
      groupFrame(groups[1], SHEET, true)
    ];

    headings = [
      groupHeading(groups[0], 'cards', mode),
      groupHeading(groups[1], 'sheet', mode)
    ];

    const a = [
      ...hide(...oldFrames, ...oldHeadings),
      ...frames.map(r => fi(r)),
      ...headings.map(t => fi(t))
    ];

    for (let k = 0; k < 4; k++) {
      a.push(moveStudent(k, px(k), PERSON_Y, runTime));
      a.push(moveIcon(k, px(k), USE_Y, runTime));

      a.push(
        new M.Transform(
          scores[k],
          scoreLabel(k),
          { runTime }
        )
      );

      // The block colour reflects the grouping currently used.
      const color = activityColor(
        mode === 'assigned' ? ASSIGNED[k] : USED[k]
      );

      originalBlocks[k].forEach((b, j) => {
        a.push(
          new M.Transform(
            b,
            block(slot(k, j), color),
            { runTime }
          )
        );
      });
    }

    stacks = originalBlocks.map(st => st.slice());

    return a;
  }

  // ------------------------------------------------------------
  // 0–1: introduce random assignment and the possibility of switching.
  // ------------------------------------------------------------

  const introCards = cards(CX - 1.8, P ? 1.0 : 0.30, 1.25);
  const introSheet = sheet(CX + 1.8, P ? 1.0 : 0.30, 1.25);

  const introLabels = [
    txt(
      'Quiz cards',
      21,
      CARDS,
      CX - 1.8,
      P ? 0.10 : -0.60,
      true
    ),
    txt(
      'Review sheet',
      21,
      SHEET,
      CX + 1.8,
      P ? 0.10 : -0.60,
      true
    )
  ];

  const coinX = CX;
  const coinY = P ? 2.15 : 1.07;

  const coin = new M.Circle({
    radius: 0.29,
    color: C.amber,
    strokeWidth: 2
  });

  coin.setFill(C.amber, 0.18);
  coin.moveTo([coinX, coinY, 0]);

  const coinLetter = txt(
    'H/T',
    15,
    C.amber,
    coinX,
    coinY,
    true
  );

  const chance = new M.VGroup(coin, coinLetter);

  await until(S(0));

  await play(
    fi(introCards),
    fi(introSheet),
    ...introLabels.map(t => fi(t)),
    fi(chance),
    ...say('CHANCE ASSIGNS CARDS OR A SHEET')
  );

  const switchQuestion = tag(
    'WHAT IF SOMEONE SWITCHES?',
    C.amber,
    CX,
    P ? -1.12 : -1.65,
    19,
    6.1
  );

  await until(S(1));

  await play(
    fi(switchQuestion),
    ...fbox([
      ['A question about experiments', C.amber],
      'What the teacher gives',
      'may differ from',
      'what a student uses'
    ], C.amber),
    ...say('WHAT IF A STUDENT USES THE OTHER ACTIVITY?', C.amber)
  );

  // ------------------------------------------------------------
  // 2–5: four students and their original assignments.
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    ...hide(
      introCards,
      introSheet,
      ...introLabels,
      chance,
      switchQuestion
    ),
    ...clearBox(),
    new M.LaggedStart(
      students.map(d => fi(d)),
      { lagRatio: 0.14, runTime: 1.0 }
    ),
    ...say('FOUR DOTS, FOUR STUDENTS', C.ink)
  );

  frames[0] = groupFrame([0, 1], CARDS);
  headings[0] = groupHeading([0, 1], 'cards');

  await until(S(3));

  await play(
    fi(frames[0]),
    fi(headings[0]),
    moveStudent(0, px(0), INTRO_Y),
    moveStudent(1, px(1), INTRO_Y),
    ...say('TWO STUDENTS ASSIGNED CARDS', CARDS)
  );

  frames[1] = groupFrame([2, 3], SHEET);
  headings[1] = groupHeading([2, 3], 'sheet');

  await until(S(4));

  await play(
    fi(frames[1]),
    fi(headings[1]),
    moveStudent(2, px(2), INTRO_Y),
    moveStudent(3, px(3), INTRO_Y),
    ...say('TWO STUDENTS ASSIGNED THE SHEET', SHEET)
  );

  await until(S(5));

  await play(
    new M.Indicate(headings[0], {
      color: CARDS,
      runTime: 0.8
    }),
    new M.Indicate(headings[1], {
      color: SHEET,
      runTime: 0.8
    }),
    ...note(
      'The labels record the original random assignment',
      C.violet,
      P ? -1.20 : -1.90
    ),
    ...fbox([
      ['Assignment', C.violet],
      'The activity the teacher',
      'originally gave a student',
      ['Not necessarily what they use', C.amber]
    ], C.violet),
    ...say('ASSIGNMENT = WHAT THE TEACHER GAVE', C.violet)
  );

  // ------------------------------------------------------------
  // 6–8: Student B switches to the sheet.
  // Keep B in the original cards assignment group.
  // ------------------------------------------------------------

  switchOutline = studentOutline(1, INTRO_Y);

  switchTag = tag(
    'SWITCHES',
    C.amber,
    px(1),
    INTRO_Y + 0.66,
    15,
    1.40
  );

  await until(S(6));

  await play(
    new M.Create(switchOutline, { runTime: 0.5 }),
    fi(switchTag),
    ...fbox([
      ['Student B', C.amber],
      ['Assigned: cards', CARDS],
      ['Decides to use: sheet', SHEET]
    ], C.amber),
    ...say('ONE CARDS-ASSIGNED STUDENT SWITCHES', C.amber)
  );

  icons[1] = useIcon(1, px(1), INTRO_Y - 0.62);

  await until(S(7));

  await play(
    fi(icons[1]),
    new M.Indicate(icons[1], {
      color: SHEET,
      runTime: 0.7
    }),
    ...note(
      'Different actual use, same original assignment',
      C.amber,
      P ? -1.20 : -1.90
    ),
    ...fbox([
      ['Two different facts', C.violet],
      ['Assignment = cards', CARDS],
      ['Actual use = sheet', SHEET],
      ['Keep the dot under cards', C.amber]
    ], C.amber),
    ...say('ADD A SHEET ICON, BUT DO NOT MOVE THE DOT', C.amber)
  );

  [0, 2, 3].forEach(k => {
    icons[k] = useIcon(k, px(k), INTRO_Y - 0.62);
  });

  await until(S(8));

  await play(
    ...[0, 2, 3].map(k => fi(icons[k])),
    ...fbox([
      ['Actual use', C.ink],
      ['A uses cards', CARDS],
      ['B, C and D use the sheet', SHEET],
      'Only B switched'
    ], C.violet),
    ...say('THE OTHER THREE USE THEIR ASSIGNED ACTIVITY', C.green)
  );

  // ------------------------------------------------------------
  // 9–13: draw later quiz scores as glowing stacks.
  // Stack colour represents assignment; the small material icon
  // separately records the activity actually used.
  // ------------------------------------------------------------

  const fullFrames = [
    groupFrame([0, 1], CARDS, true),
    groupFrame([2, 3], SHEET, true)
  ];

  const floor = new M.Line({
    start: [CX - 3.38, BASE, 0],
    end: [CX + 3.48, BASE, 0],
    color: C.muted,
    strokeWidth: 1.5
  });

  originalBlocks = SCORES.map((n, k) =>
    Array.from({ length: n }, (_, j) =>
      block(
        slot(k, j),
        activityColor(ASSIGNED[k])
      )
    )
  );

  stacks = originalBlocks.map(st => st.slice());

  scores = SCORES.map((_, k) => scoreLabel(k));

  await until(S(9));

  await play(
    ...hide(...frames, switchOutline, switchTag),
    ...fullFrames.map(r => fi(r)),

    ...students.map((_, k) =>
      moveStudent(k, px(k), PERSON_Y, 0.8)
    ),

    ...icons.map((_, k) =>
      moveIcon(k, px(k), USE_Y, 0.8)
    ),

    new M.Create(floor, { runTime: 0.7 }),

    new M.LaggedStart(
      stacks.map(st => reveal(st, 0.85)),
      { lagRatio: 0.18, runTime: 2.1 }
    ),

    ...note('Later quiz: 1 glowing block = 1 point', C.ink),

    ...fbox([
      ['Later quiz', C.ink],
      'Same quiz for everyone',
      'Worth 10 points',
      ['Stack colour = assignment', C.violet]
    ], C.violet),

    ...say('DRAW ONE BLOCK FOR EACH QUIZ POINT', C.ink)
  );

  frames = fullFrames;
  switchOutline = null;
  switchTag = null;

  await until(S(10));

  await play(
    fi(scores[0]),
    new M.Flash(students[0], {
      color: CARDS,
      runTime: 0.5
    }),
    ...fbox([
      ['Student A', CARDS],
      'Assigned cards',
      'Used cards',
      ['Later score = 8', C.amber]
    ], CARDS),
    ...say('STUDENT A: USED CARDS, SCORED 8', CARDS)
  );

  await until(S(11));

  await play(
    fi(scores[1]),
    new M.Indicate(icons[1], {
      color: SHEET,
      runTime: 0.65
    }),
    ...fbox([
      ['Student B', C.amber],
      ['Assigned cards', CARDS],
      ['Used sheet', SHEET],
      ['Later score = 6', C.amber]
    ], C.amber),
    ...say('STUDENT B: SWITCHED, SCORED 6', C.amber)
  );

  await until(S(12));

  await play(
    fi(scores[2]),
    new M.Flash(students[2], {
      color: SHEET,
      runTime: 0.5
    }),
    ...fbox([
      ['Student C', SHEET],
      'Assigned sheet',
      'Used sheet',
      ['Later score = 8', C.amber]
    ], SHEET),
    ...say('STUDENT C: USED THE SHEET, SCORED 8', SHEET)
  );

  await until(S(13));

  await play(
    fi(scores[3], 0.25),
    ...fbox([
      ['Student D', SHEET],
      'Assigned sheet',
      'Used sheet',
      ['Later score = 4', C.amber]
    ], SHEET),
    ...say('STUDENT D: USED THE SHEET, SCORED 4', SHEET)
  );

  // ------------------------------------------------------------
  // 14–15: intention to treat.
  // Retain every student under the original random assignment.
  // ------------------------------------------------------------

  switchOutline = rect(
    px(1),
    (SCORE_Y + USE_Y - 0.25) / 2,
    1.35,
    SCORE_Y - USE_Y + 0.75,
    C.amber,
    0,
    2
  );

  const stayTag = tag(
    'KEEP ORIGINAL GROUP',
    C.amber,
    groupBounds([0, 1]).x,
    MEAN_Y,
    P ? 16 : 15,
    2.95
  );

  await until(S(14));

  await play(
    new M.Create(switchOutline),
    fi(stayTag),
    new M.Indicate(headings[0], {
      color: CARDS,
      runTime: 0.8
    }),
    ...note('B used the sheet but remains assigned to cards', C.amber),
    ...fbox([
      ['Compare original assignments', C.violet],
      ['Cards group: A and B', CARDS],
      ['Sheet group: C and D', SHEET],
      'Do not move B'
    ], C.violet),
    ...say('KEEP THE STUDENT WHO SWITCHED UNDER CARDS', C.amber)
  );

  await until(S(15));

  await play(
    ...fbox([
      ['Intention to treat', C.violet],
      'Include everyone',
      'in their original',
      'randomly assigned group'
    ], C.violet),
    ...say('ORIGINAL ASSIGNMENT = INTENTION TO TREAT', C.violet)
  );

  // ------------------------------------------------------------
  // 16–19: find the average for students assigned cards.
  // 8 + 6 = 14; 14 ÷ 2 = 7.
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    ...hide(switchOutline, stayTag),
    ...note('Equal sharing is only a picture of the average', C.green),
    ...fbox([
      ['Average = fair share', C.green],
      'Step 1: add the points',
      'Step 2: share equally',
      'inside the assigned group'
    ], C.green),
    ...say('ADD EACH GROUP TOTAL, THEN SHARE EQUALLY', C.green)
  );

  switchOutline = null;

  await until(S(17));

  await play(
    new M.Indicate(scores[0], {
      color: CARDS,
      runTime: 0.7
    }),
    new M.Indicate(scores[1], {
      color: CARDS,
      runTime: 0.7
    }),
    new M.Indicate(frames[0], {
      color: CARDS,
      runTime: 0.7
    }),
    ...fbox([
      ['Assigned cards', CARDS],
      'Student A: 8',
      'Student B: 6',
      ['Add: 8 + 6', C.amber]
    ], CARDS),
    ...say('ADD 8 AND 6 FOR STUDENTS ASSIGNED CARDS', CARDS)
  );

  const total14 = tag(
    'TOTAL = 14',
    C.amber,
    groupBounds([0, 1]).x,
    MEAN_Y,
    18,
    2.9
  );

  await until(S(18));

  await play(
    fi(total14, 0.3),
    ...fbox([
      ['Assigned cards', CARDS],
      '8 + 6',
      ['Total = 14 points', C.amber]
    ], CARDS),
    ...say('8 + 6 = 14 POINTS', C.amber)
  );

  await until(S(19));

  await play(
    fo(total14),

    // Move one block from A's stack to B's stack.
    transfer(0, 1, 1, CARDS, 0.95),

    ...showMean(0, [0, 1], 7, CARDS),

    ...fbox([
      ['Assigned cards', CARDS],
      'Total = 14',
      'Students = 2',
      ['14 ÷ 2 = 7', CARDS]
    ], CARDS),

    ...say('14 SHARED BY 2 = 7 EACH', CARDS)
  );

  // ------------------------------------------------------------
  // 20–22: find the average for students assigned the sheet.
  // 8 + 4 = 12; 12 ÷ 2 = 6.
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    new M.Indicate(scores[2], {
      color: SHEET,
      runTime: 0.7
    }),
    new M.Indicate(scores[3], {
      color: SHEET,
      runTime: 0.7
    }),
    new M.Indicate(frames[1], {
      color: SHEET,
      runTime: 0.7
    }),
    ...fbox([
      ['Assigned sheet', SHEET],
      'Student C: 8',
      'Student D: 4',
      ['Add: 8 + 4', C.amber]
    ], SHEET),
    ...say('ADD 8 AND 4 FOR STUDENTS ASSIGNED THE SHEET', SHEET)
  );

  const total12 = tag(
    'TOTAL = 12',
    C.amber,
    groupBounds([2, 3]).x,
    MEAN_Y,
    18,
    2.9
  );

  await until(S(21));

  await play(
    fi(total12, 0.3),
    ...fbox([
      ['Assigned sheet', SHEET],
      '8 + 4',
      ['Total = 12 points', C.amber]
    ], SHEET),
    ...say('8 + 4 = 12 POINTS', C.amber)
  );

  await until(S(22));

  await play(
    fo(total12),

    // Move two blocks from C's stack to D's stack.
    transfer(2, 3, 2, SHEET, 1.05),

    ...showMean(1, [2, 3], 6, SHEET),

    ...fbox([
      ['Assigned sheet', SHEET],
      'Total = 12',
      'Students = 2',
      ['12 ÷ 2 = 6', SHEET]
    ], SHEET),

    ...say('12 SHARED BY 2 = 6 EACH', SHEET)
  );

  // ------------------------------------------------------------
  // 23–26: the intention-to-treat estimate.
  // Assigned cards mean 7 minus assigned sheet mean 6 = 1.
  // ------------------------------------------------------------

  await until(S(23));

  await play(
    ...fbox([
      ['A short comparison rule', C.cyan],
      'Find each assigned',
      'group average',
      'Then find the difference'
    ], C.cyan),
    ...say('WRITE THE COMPARISON AS A FORMULA')
  );

  await until(S(24));

  await play(
    new M.Indicate(means[0], {
      color: CARDS,
      runTime: 0.75
    }),
    new M.Indicate(means[1], {
      color: SHEET,
      runTime: 0.75
    }),
    ...fbox([
      ['Intention-to-treat estimate', C.ink],
      ['  = assigned cards average', CARDS],
      ['  − assigned sheet average', SHEET]
    ], C.cyan),
    ...say('ASSIGNED CARDS MEAN MINUS ASSIGNED SHEET MEAN')
  );

  const assignedGapOutline = rect(
    groupBounds([0, 1]).x,
    BASE + 6.5 * PITCH,
    groupBounds([0, 1]).w - 0.14,
    PITCH + 0.07,
    C.amber,
    0,
    2
  );

  const assignedGapTag = tag(
    '+1 POINT',
    C.green,
    CX,
    P ? 0.80 : -0.04,
    P ? 19 : 16,
    P ? 1.60 : 1.55
  );

  await until(S(25));

  await play(
    new M.Create(assignedGapOutline),
    fi(assignedGapTag),
    ...note('Intention-to-treat estimate: +1 point', C.green),
    ...fbox([
      ['Intention to treat', C.violet],
      ['  = 7 − 6', C.ink],
      ['  = 1 point', C.green]
    ], C.green),
    ...say('7 − 6 = 1 POINT', C.green)
  );

  await until(S(26));

  await play(
    new M.Indicate(icons[1], {
      color: SHEET,
      runTime: 0.85
    }),
    new M.Indicate(assignedGapTag, {
      color: C.green,
      runTime: 0.85
    }),
    ...fbox([
      ['What does +1 estimate?', C.green],
      'The effect of assigning cards',
      'in a class where students',
      'may switch activities'
    ], C.green),
    ...say('ESTIMATE THE EFFECT OF ASSIGNING CARDS', C.green)
  );

  // ------------------------------------------------------------
  // 27–29: the alternative — group students by actual use.
  // Restore original quiz scores before regrouping.
  // Student B physically moves into the sheet group.
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...clearMeans(),
    ...hide(assignedGapOutline, assignedGapTag),

    ...regroup(
      ACTUAL_X,
      [[0], [1, 2, 3]],
      'used',
      1.15
    ),

    ...note('New grouping: what each student actually used', C.amber),

    ...fbox([
      ['Alternative comparison', C.amber],
      'Move Student B',
      'from the cards group',
      'to the sheet group'
    ], C.amber),

    ...say('WHAT IF WE MOVE THE STUDENT WHO SWITCHED?', C.amber)
  );

  const movedOutline = rect(
    px(1),
    (PERSON_Y + USE_Y) / 2,
    1.23,
    Math.abs(PERSON_Y - USE_Y) + 0.85,
    C.amber,
    0,
    2
  );

  const movedTag = tag(
    'SWITCHED',
    C.amber,
    px(1),
    MEAN_Y,
    15,
    1.42
  );

  await until(S(28));

  await play(
    new M.Create(movedOutline),
    fi(movedTag),
    new M.Indicate(scores[0], {
      color: CARDS,
      runTime: 0.75
    }),
    ...fbox([
      ['Actually used cards', CARDS],
      'Only Student A remains',
      ['Score = 8', C.amber],
      ['Average = 8 ÷ 1 = 8', CARDS]
    ], CARDS),
    ...say('ONLY THE STUDENT WHO SCORED 8 USED CARDS', CARDS)
  );

  await until(S(29));

  await play(
    ...hide(movedOutline, movedTag),
    new M.Indicate(frames[1], {
      color: SHEET,
      runTime: 0.8
    }),
    new M.LaggedStart(
      [1, 2, 3].map(k =>
        new M.Indicate(scores[k], {
          color: SHEET,
          runTime: 0.4
        })
      ),
      { lagRatio: 0.30, runTime: 1.2 }
    ),
    ...fbox([
      ['Actually used the sheet', SHEET],
      'Student B: 6',
      'Student C: 8',
      'Student D: 4'
    ], SHEET),
    ...say('THE SHEET GROUP NOW HAS 6, 8 AND 4', SHEET)
  );

  // ------------------------------------------------------------
  // 30–32: calculate the actual-use sheet average.
  // 6 + 8 + 4 = 18; 18 ÷ 3 = 6.
  // ------------------------------------------------------------

  const running14 = tag(
    'RUNNING TOTAL = 14',
    C.amber,
    groupBounds([1, 2, 3]).x,
    MEAN_Y,
    17,
    4.0
  );

  await until(S(30));

  await play(
    fi(running14),
    new M.Indicate(scores[1], {
      color: SHEET,
      runTime: 0.55
    }),
    new M.Indicate(scores[2], {
      color: SHEET,
      runTime: 0.55
    }),
    ...fbox([
      ['Add the sheet-use scores', SHEET],
      '6 + 8',
      ['Running total = 14', C.amber]
    ], SHEET),
    ...say('6 + 8 = 14', C.amber)
  );

  const total18 = tag(
    'TOTAL = 18',
    C.amber,
    groupBounds([1, 2, 3]).x,
    MEAN_Y,
    18,
    4.0
  );

  await until(S(31));

  await play(
    fo(running14, 0.25),
    fi(total18, 0.25),
    ...fbox([
      ['Add the final score', SHEET],
      '14 + 4',
      ['Total = 18 points', C.amber]
    ], SHEET),
    ...say('14 + 4 = 18 POINTS', C.amber)
  );

  await until(S(32));

  await play(
    fo(total18),

    // C has eight points and D has four.
    // Move two blocks to D; B already has six.
    transfer(2, 3, 2, SHEET, 1.30),

    ...showMean(0, [0], 8, CARDS),
    ...showMean(1, [1, 2, 3], 6, SHEET),

    ...note('18 points shared across 3 sheet users', C.green),

    ...fbox([
      ['Actually used the sheet', SHEET],
      'Total = 18',
      'Students = 3',
      ['18 ÷ 3 = 6', SHEET]
    ], SHEET),

    ...say('18 SHARED BY 3 = 6 EACH', SHEET)
  );

  // ------------------------------------------------------------
  // 33: actual-use comparison.
  // Cards mean 8 minus sheet mean 6 = 2.
  // This is not the same estimand as the assignment comparison.
  // ------------------------------------------------------------

  const actualGapOutline = rect(
    px(0),
    BASE + 7 * PITCH,
    BW + 0.23,
    2 * PITCH + 0.07,
    C.amber,
    0,
    2
  );

  const actualGapTag = tag(
    '+2 POINTS',
    C.amber,
    CX - 1.55,
    P ? 1.48 : 0.55,
    P ? 17 : 15,
    1.65
  );

  await until(S(33));

  await play(
    new M.Create(actualGapOutline),
    fi(actualGapTag),
    ...note('Actual-use gap: +2 points', C.amber),
    ...fbox([
      ['Grouped by actual use', C.amber],
      ['Cards average = 8', CARDS],
      ['Sheet average = 6', SHEET],
      ['8 − 6 = 2 points', C.amber]
    ], C.amber),
    ...say('ACTUAL USE: 8 − 6 = 2 POINTS', C.amber)
  );

  // ------------------------------------------------------------
  // 34–36: why regrouping by actual use can change the comparison.
  // A student's decision may be related to their preferences,
  // abilities or other characteristics.
  // Do not claim the actual-use gap is a causal effect.
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    new M.Indicate(headings[0], {
      color: CARDS,
      runTime: 0.7
    }),
    new M.Indicate(headings[1], {
      color: SHEET,
      runTime: 0.7
    }),
    ...fbox([
      ['What changed?', C.amber],
      'The original groups',
      'came from chance',
      'The new groups depend',
      ['on actual student choices', C.amber]
    ], C.amber),
    ...say('THE NEW GROUPS DEPEND ON STUDENT CHOICES', C.amber)
  );

  const preferenceTag = tag(
    '“THE SHEET FEELS EASIER”',
    C.violet,
    CX,
    P ? -3.05 : -3.30,
    P ? 18 : 15,
    6.3
  );

  const choiceOutline = rect(
    px(1),
    (PERSON_Y + USE_Y) / 2,
    1.25,
    Math.abs(PERSON_Y - USE_Y) + 0.85,
    C.amber,
    0,
    2
  );

  await until(S(35));

  await play(
    ...clearNote(),
    fi(preferenceTag),
    new M.Create(choiceOutline),
    new M.Indicate(icons[1], {
      color: SHEET,
      runTime: 0.8
    }),
    ...fbox([
      ['One possible reason', C.violet],
      'Student B may prefer',
      'the review sheet',
      'because it feels easier'
    ], C.violet),
    ...say('A STUDENT MAY SWITCH FOR A PERSONAL REASON', C.violet)
  );

  await until(S(36));

  await play(
    ...hide(preferenceTag, choiceOutline),
    ...note('The actual-use gap may partly reflect selection', C.amber),
    new M.Indicate(actualGapTag, {
      color: C.amber,
      runTime: 0.85
    }),
    ...fbox([
      ['Two different comparisons', C.violet],
      ['Original assignment: +1', C.green],
      ['Actual use: +2', C.amber],
      'The second gap may reflect',
      'who chose each activity'
    ], C.amber),
    ...say('THE GAP MAY PARTLY REFLECT WHO CHOSE WHAT', C.amber)
  );

  // ------------------------------------------------------------
  // 37: final picture.
  // Restore the original assignment groups and original scores.
  // B still uses the sheet, but remains assigned to cards.
  // Preserve the original random comparison.
  // ------------------------------------------------------------

  const finalResult = tag(
    'ASSIGNMENT EFFECT ESTIMATE: +1',
    C.green,
    CX,
    MEAN_Y,
    P ? 18 : 17,
    6.4
  );

  await until(S(37));

  await play(
    ...clearMeans(),
    ...hide(actualGapOutline, actualGapTag),

    ...regroup(
      ASSIGN_X,
      [[0, 1], [2, 3]],
      'assigned',
      1.15
    ),

    ...note('Keep everyone in the group originally assigned', C.green),

    ...fbox([
      ['INTENTION TO TREAT', C.violet],
      ['Assigned cards: (8 + 6) ÷ 2 = 7', CARDS],
      ['Assigned sheet: (8 + 4) ÷ 2 = 6', SHEET],
      ['Estimate = 7 − 6 = 1 point', C.green]
    ], C.green),

    ...say('KEEP ORIGINAL ASSIGNMENTS: ESTIMATE THEIR EFFECT', C.green)
  );

  const finalSwitchOutline = rect(
    px(1),
    (PERSON_Y + USE_Y) / 2,
    1.24,
    Math.abs(PERSON_Y - USE_Y) + 0.85,
    C.amber,
    0,
    2
  );

  await play(
    new M.Create(finalSwitchOutline, { runTime: 0.5 }),
    fi(finalResult),
    new M.Indicate(icons[1], {
      color: SHEET,
      runTime: 0.85
    }),
    new M.Indicate(headings[0], {
      color: CARDS,
      runTime: 0.85
    })
  );
}
