// lesson 8.1.8
// A/B test design: assign whole tutorial sections and compare their averages.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Fixed chapter data: four sections, two students per section.
// Cards section averages: 8 and 6. Sheet section averages: 6 and 4.
// The section names and shuffle order are illustrative.
// Individual numerical scores are not invented: only section totals
// and equal-share averages are shown.
// Uses the supplied engine conventions; browser playback has not been tested.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const CARDS = C.cyan;
  const SHEET = C.pink || '#F472B6';
  const SHARE = C.violet;

  // Row-major classroom layout:
  // Section 1     Section 2
  // Section 3     Section 4
  //
  // Illustrative shuffled order: 1, 3, 4, 2.
  // First two sections receive cards; remaining two receive sheets.
  //
  // Final section means:
  //       A / cards       B / sheet
  //          8                6
  //          6                4

  const NAMES = ['1', '2', '3', '4'];
  const SHUFFLED = [0, 2, 3, 1];
  const MEANS = [8, 6, 6, 4];
  const COUNTS = [2, 2, 2, 2];
  const TOTALS = MEANS.map((n, k) => n * COUNTS[k]);

  const ACTIVITIES = ['cards', 'sheet', 'cards', 'sheet'];
  const COLORS = [CARDS, SHEET, CARDS, SHEET];

  const CX = P ? 0 : -2.6;
  const DX = P ? 1.78 : 1.72;

  const ROW_Y = P ? [1.28, -1.30] : [0.36, -1.49];

  const CW = P ? 3.28 : 3.10;
  const CH = P ? 2.10 : 1.57;

  const HEADER_Y = P ? 2.91 : 1.44;
  const NOTE_Y = P ? -2.97 : -2.70;

  const PILL = P ? [0, 3.75, 0] : [CX, 1.98, 0];
  const BOXP = P ? [0, -4.80, 0] : [4.3, -0.3, 0];

  const cellX = k => CX + (k % 2 === 0 ? -DX : DX);
  const cellY = k => ROW_Y[Math.floor(k / 2)];

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
    const lh = P ? 0.39 : 0.41;

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
    const maxh = P ? 2.75 : 4.6;

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

  // Replaceable explanatory note beneath the classroom diagram.
  let noteNow = null;

  function note(s, color = C.muted) {
    const next = txt(
      s,
      P ? 18 : 16,
      color,
      CX,
      NOTE_Y,
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

  function student(x, y, color = C.ink) {
    const halo = new M.Circle({
      radius: 0.24,
      color,
      strokeWidth: 1
    });

    halo.setFill(color, 0.11);
    halo.moveTo([x, y, 0]);

    const dot = new M.Dot({
      point: [x, y, 0],
      radius: 0.14,
      color
    });

    return new M.VGroup(halo, dot);
  }

  function cards(x, y, scale = 1) {
    const w = 0.90 * scale;
    const h = 0.59 * scale;

    const back = rect(
      x - 0.11 * scale,
      y + 0.09 * scale,
      w,
      h,
      CARDS,
      0.13,
      1.4
    );

    const front = rect(
      x + 0.07 * scale,
      y - 0.035 * scale,
      w,
      h,
      CARDS,
      0.24,
      2
    );

    const q = txt(
      '?',
      Math.max(12, Math.round(24 * scale)),
      CARDS,
      x + 0.07 * scale,
      y - 0.035 * scale,
      true
    );

    return new M.VGroup(back, front, q);
  }

  function sheet(x, y, scale = 1) {
    const w = 1.02 * scale;
    const h = 0.70 * scale;

    const paper = rect(
      x,
      y,
      w,
      h,
      SHEET,
      0.18,
      2
    );

    const lines = Array.from({ length: 3 }, (_, j) =>
      new M.Line({
        start: [
          x - w * 0.32,
          y + h * 0.24 - j * h * 0.24,
          0
        ],
        end: [
          x + w * 0.32,
          y + h * 0.24 - j * h * 0.24,
          0
        ],
        color: SHEET,
        strokeWidth: 1.8
      })
    );

    return new M.VGroup(paper, ...lines);
  }

  function material(activity, x, y, scale = 1) {
    return activity === 'cards'
      ? cards(x, y, scale)
      : sheet(x, y, scale);
  }

  function quizPaper(x, y, marked = false) {
    const w = 0.62;
    const h = 0.51;

    const bg = rect(
      x, y,
      w, h,
      C.muted, 0.12, 1.5
    );

    const lines = Array.from({ length: 3 }, (_, j) =>
      new M.Line({
        start: [x - 0.19, y + 0.13 - j * 0.13, 0],
        end: [x + 0.10, y + 0.13 - j * 0.13, 0],
        color: C.ink,
        strokeWidth: 1.4
      })
    );

    const mark = txt(
      marked ? '✓' : '',
      15,
      C.green,
      x + 0.17,
      y - 0.08,
      true
    );

    return new M.VGroup(bg, ...lines, mark);
  }

  function arrow(x1, y1, x2, y2, color = SHARE) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len;
    const uy = dy / len;

    const h = Math.min(0.17, len * 0.32);
    const w = h * 0.60;

    const shaft = new M.Line({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: 3
    });

    const h1 = new M.Line({
      start: [x2, y2, 0],
      end: [
        x2 - h * ux + w * uy,
        y2 - h * uy - w * ux,
        0
      ],
      color,
      strokeWidth: 3
    });

    const h2 = new M.Line({
      start: [x2, y2, 0],
      end: [
        x2 - h * ux - w * uy,
        y2 - h * uy + w * ux,
        0
      ],
      color,
      strokeWidth: 3
    });

    return new M.VGroup(shaft, h1, h2);
  }

  // Every glowing block represents one later quiz point.
  function block(p, color, w = 0.22, h = 0.16) {
    const glow = new M.Rectangle({
      width: w + 0.05,
      height: h + 0.05,
      color,
      strokeWidth: 1
    });

    glow.setFill(color, 0.13);
    glow.moveTo(p);

    const core = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: 1
    });

    core.setFill(color, 0.86);
    core.moveTo(p);

    return new M.VGroup(glow, core);
  }

  function reveal(objects, runTime = 0.9) {
    return new M.LaggedStart(
      objects.map(o => fi(o, 0.25)),
      { lagRatio: 0.10, runTime }
    );
  }

  // ------------------------------------------------------------
  // Classroom section helpers.
  // Each section has a persistent, independently drawn outline.
  // Already-visible objects are never wrapped in a new VGroup.
  // ------------------------------------------------------------

  function sectionFrame(k, color = C.muted) {
    const frame = new M.RoundedRectangle({
      width: CW,
      height: CH,
      cornerRadius: 0.16,
      color,
      strokeWidth: 2.2
    });

    frame.setFill(C.card, 0.40);
    frame.moveTo([cellX(k), cellY(k), 0]);

    return frame;
  }

  function sectionTitle(k, color = C.ink) {
    return txt(
      `SECTION ${NAMES[k]}`,
      P ? 19 : 16,
      color,
      cellX(k),
      cellY(k) + CH / 2 - 0.20,
      true,
      CW - 0.25
    );
  }

  const personX = (k, j) =>
    cellX(k) + (j === 0 ? -0.70 : 0.70);

  const personY = k =>
    cellY(k) + (P ? 0.10 : 0.03);

  const materialY = k =>
    cellY(k) - (P ? 0.52 : 0.39);

  function sharingLine(k) {
    return new M.Line({
      start: [personX(k, 0) + 0.23, personY(k), 0],
      end: [personX(k, 1) - 0.23, personY(k), 0],
      color: SHARE,
      strokeWidth: 2.7
    });
  }

  function sectionOutline(k, color = C.amber) {
    return rect(
      cellX(k),
      cellY(k),
      CW + 0.09,
      CH + 0.09,
      color,
      0,
      2.5
    );
  }

  function columnOutline(col, color = C.amber) {
    return rect(
      CX + (col === 0 ? -DX : DX),
      (ROW_Y[0] + ROW_Y[1]) / 2,
      CW + 0.10,
      ROW_Y[0] - ROW_Y[1] + CH + 0.12,
      color,
      0,
      2.5
    );
  }

  let focusNow = null;

  function focus(next) {
    const a = [];

    if (focusNow) a.push(fo(focusNow));

    if (next) {
      a.push(new M.Create(next, { runTime: 0.45 }));
    }

    focusNow = next;

    return a;
  }

  function clearFocus() {
    return focus(null);
  }

  const frames = NAMES.map((_, k) => sectionFrame(k));

  const titles = NAMES.map((_, k) => sectionTitle(k));

  let people = NAMES.map((_, k) =>
    [0, 1].map(j =>
      student(personX(k, j), personY(k))
    )
  );

  let links = NAMES.map((_, k) => sharingLine(k));

  let materials = NAMES.map(() => []);
  let headings = [null, null];

  function showMaterials(k, activity) {
    materials[k] = [0, 1].map(j =>
      material(
        activity,
        personX(k, j),
        materialY(k),
        0.65
      )
    );

    return materials[k].map(o => fi(o));
  }

  function clearMaterials() {
    const a = hide(...materials.flat());

    materials = NAMES.map(() => []);

    return a;
  }

  function setSectionColor(k, color) {
    return new M.Transform(
      frames[k],
      sectionFrame(k, color),
      { runTime: 0.55 }
    );
  }

  function activityHeading(col, version = false) {
    const name = col === 0
      ? (version ? 'A · QUIZ CARDS' : 'QUIZ CARDS')
      : (version ? 'B · REVIEW SHEET' : 'REVIEW SHEET');

    return tag(
      name,
      col === 0 ? CARDS : SHEET,
      CX + (col === 0 ? -DX : DX),
      HEADER_Y,
      P ? 18 : 16,
      CW
    );
  }

  // ------------------------------------------------------------
  // 0–2: the teacher wants to compare activities across small
  // classes whose students share practice materials.
  // ------------------------------------------------------------

  const introY = P ? 1.25 : 0.45;

  const introCards = cards(CX - DX, introY, 1.25);
  const introSheet = sheet(CX + DX, introY, 1.25);

  const introLabels = [
    txt(
      'Quiz cards',
      21,
      CARDS,
      CX - DX,
      introY - 0.78,
      true
    ),
    txt(
      'Review sheet',
      21,
      SHEET,
      CX + DX,
      introY - 0.78,
      true
    )
  ];

  const miniY = P ? -0.85 : -1.40;

  const miniClassrooms = Array.from({ length: 4 }, (_, k) => {
    const x = CX + (k - 1.5) * 1.53;

    const r = rect(
      x, miniY,
      1.34, 0.92,
      C.muted, 0.08, 1.7
    );

    const a = student(x - 0.30, miniY);
    const b = student(x + 0.30, miniY);

    return new M.VGroup(r, a, b);
  });

  await until(S(0));

  await play(
    fi(introCards),
    fi(introSheet),
    ...introLabels.map(t => fi(t)),
    ...say('WHICH ACTIVITY SHOULD EACH SMALL CLASS GET?')
  );

  const introSectionLabel = txt(
    'Tutorial sections',
    P ? 20 : 18,
    C.ink,
    CX,
    miniY - 0.72,
    true
  );

  await until(S(1));

  await play(
    reveal(miniClassrooms, 0.85),
    fi(introSectionLabel),
    ...say('SMALL CLASSES = TUTORIAL SECTIONS', C.ink)
  );

  await until(S(2));

  await play(
    ...fbox([
      ['A design question', C.amber],
      'Students share materials',
      'inside their small classes',
      ['How should we assign activities?', C.violet]
    ], C.amber),
    ...say('HOW CAN WE COMPARE ACTIVITIES WHEN STUDENTS SHARE?', C.amber)
  );

  // ------------------------------------------------------------
  // 3–6: four tutorial sections with two students each.
  // Sharing happens inside each section, not between sections.
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...hide(
      introCards,
      introSheet,
      ...introLabels,
      ...miniClassrooms,
      introSectionLabel
    ),

    ...clearBox(),

    new M.LaggedStart(
      frames.map(r => fi(r)),
      { lagRatio: 0.12, runTime: 1.05 }
    ),

    ...titles.map(t => fi(t)),

    ...say('DRAW FOUR TUTORIAL SECTION BOXES', C.ink)
  );

  await until(S(4));

  await play(
    reveal(people.flat(), 1.05),
    ...note('4 sections × 2 students = 8 students', C.ink),
    ...say('TWO STUDENT DOTS IN EACH BOX', C.ink)
  );

  await until(S(5));

  await play(
    new M.LaggedStart(
      links.map(l =>
        new M.Create(l, { runTime: 0.45 })
      ),
      { lagRatio: 0.25, runTime: 1.3 }
    ),

    ...note('Each line shows who shares practice materials', SHARE),

    ...say('STUDENTS SHARE INSIDE THEIR SECTION', SHARE)
  );

  await until(S(6));

  await play(
    new M.LaggedStart(
      frames.map(r =>
        new M.Indicate(r, {
          color: SHARE,
          runTime: 0.55
        })
      ),
      { lagRatio: 0.20, runTime: 1.5 }
    ),

    ...note('No sharing between sections in this example', SHARE),

    ...fbox([
      ['Sharing rule', SHARE],
      'Inside a section: yes',
      'Between sections: no',
      ['Four separate sharing groups', C.ink]
    ], SHARE),

    ...say('MATERIALS STAY INSIDE EACH BOX', SHARE)
  );

  // ------------------------------------------------------------
  // 7–9: demonstrate interference under mixed assignment.
  // Then give students within a section the same activity.
  // ------------------------------------------------------------

  const mixedCards = cards(
    personX(0, 0),
    materialY(0),
    0.65
  );

  const mixedSheet = sheet(
    personX(0, 1),
    materialY(0),
    0.65
  );

  await until(S(7));

  await play(
    ...focus(sectionOutline(0)),

    fi(mixedCards),
    fi(mixedSheet),

    ...fbox([
      ['Mixed assignment', C.amber],
      'Two students in one section',
      ['One gets cards', CARDS],
      ['One gets the sheet', SHEET]
    ], C.amber),

    ...say('WHAT IF ONE BOX CONTAINS BOTH ACTIVITIES?', C.amber)
  );

  const mixedArrow = arrow(
    personX(0, 0) + 0.26,
    personY(0) + 0.17,
    personX(0, 1) - 0.26,
    personY(0) + 0.17,
    SHARE
  );

  await until(S(8));

  await play(
    fi(mixedArrow),

    new M.Indicate(people[0][1], {
      color: SHARE,
      runTime: 0.75
    }),

    ...note('Cards practice could reach the sheet student', SHARE),

    ...fbox([
      ['Interference', SHARE],
      'The cards student could',
      'quiz the sheet student',
      ['Practice crosses assignment labels', SHARE]
    ], SHARE),

    ...say('CARDS PRACTICE COULD REACH THE SHEET STUDENT', SHARE)
  );

  // An illustrative arrangement demonstrating the rule.
  // It is cleared before the actual section shuffle.
  const previewActivities = [
    'cards', 'cards', 'sheet', 'sheet'
  ];

  await until(S(9));

  await play(
    ...hide(mixedCards, mixedSheet, mixedArrow),
    ...clearFocus(),

    ...previewActivities.flatMap((a, k) =>
      showMaterials(k, a)
    ),

    ...previewActivities.map((a, k) =>
      setSectionColor(
        k,
        a === 'cards' ? CARDS : SHEET
      )
    ),

    ...note('One activity for everyone inside a section', C.green),

    ...fbox([
      ['A different assignment rule', C.green],
      'Give each whole section',
      'one practice activity',
      'Sharing inside it is allowed'
    ], C.green),

    ...say('GIVE BOTH STUDENTS IN EACH BOX THE SAME ACTIVITY', C.green)
  );

  // ------------------------------------------------------------
  // 10–13: shuffle the four section slips.
  //
  // One possible random order is:
  // Section 1, Section 3, Section 4, Section 2.
  //
  // Exactly two sections receive cards.
  // Exactly two sections receive the review sheet.
  // ------------------------------------------------------------

  const SLIP_CX = P ? 0 : 4.3;
  const SLIP_Y = P ? -3.88 : -0.15;
  const SLIP_SP = P ? 1.37 : 0.92;

  const slipX = j =>
    SLIP_CX + (j - 1.5) * SLIP_SP;

  function sectionSlip(k, j, color = C.muted) {
    const x = slipX(j);

    const w = P ? 1.20 : 0.81;
    const h = P ? 0.76 : 0.69;

    const paper = rect(
      x,
      SLIP_Y,
      w,
      h,
      color,
      0.12,
      2
    );

    const label = txt(
      'Section',
      P ? 15 : 12,
      C.ink,
      x,
      SLIP_Y + 0.15,
      true,
      w - 0.10
    );

    const n = txt(
      NAMES[k],
      P ? 23 : 20,
      color === C.muted ? C.ink : color,
      x,
      SLIP_Y - 0.13,
      true
    );

    return new M.VGroup(paper, label, n);
  }

  const slips = NAMES.map((_, k) =>
    sectionSlip(k, k)
  );

  const slipTitle = txt(
    'ONE SLIP PER SECTION',
    P ? 18 : 17,
    C.violet,
    SLIP_CX,
    SLIP_Y + 0.78,
    true,
    P ? 6.3 : 3.9
  );

  await until(S(10));

  await play(
    ...clearMaterials(),
    ...clearBox(),
    ...clearNote(),

    ...NAMES.map((_, k) =>
      setSectionColor(k, C.muted)
    ),

    fi(slipTitle),

    reveal(slips, 0.95),

    ...say('WRITE FOUR SECTION NAMES ON FOUR SLIPS', C.violet)
  );

  const shuffledTag = tag(
    'ONE POSSIBLE SHUFFLE',
    C.amber,
    SLIP_CX,
    SLIP_Y - 0.82,
    P ? 17 : 15,
    P ? 6.2 : 3.9
  );

  await until(S(11));

  await play(
    new M.LaggedStart(
      SHUFFLED.map((k, j) =>
        new M.Transform(
          slips[k],
          sectionSlip(k, j),
          {
            pathArc: j % 2 === 0 ? 0.75 : -0.75,
            runTime: 0.9
          }
        )
      ),
      { lagRatio: 0.15, runTime: 1.85 }
    ),

    fi(shuffledTag),

    ...say('SHUFFLE THE SECTION SLIPS AT RANDOM', C.amber)
  );

  headings[0] = activityHeading(0);

  await until(S(12));

  await play(
    fi(headings[0]),

    ...SHUFFLED.slice(0, 2).map((k, j) =>
      new M.Transform(
        slips[k],
        sectionSlip(k, j, CARDS),
        { runTime: 0.45 }
      )
    ),

    ...[0, 2].map(k =>
      setSectionColor(k, CARDS)
    ),

    ...[0, 2].flatMap(k =>
      showMaterials(k, 'cards')
    ),

    ...say('FIRST TWO SECTIONS RECEIVE QUIZ CARDS', CARDS)
  );

  headings[1] = activityHeading(1);

  await until(S(13));

  await play(
    fi(headings[1]),

    ...SHUFFLED.slice(2).map((k, j) =>
      new M.Transform(
        slips[k],
        sectionSlip(k, j + 2, SHEET),
        { runTime: 0.45 }
      )
    ),

    ...[1, 3].map(k =>
      setSectionColor(k, SHEET)
    ),

    ...[1, 3].flatMap(k =>
      showMaterials(k, 'sheet')
    ),

    ...say('THE OTHER TWO SECTIONS RECEIVE THE SHEET', SHEET)
  );

  // ------------------------------------------------------------
  // 14–17: define the unit of assignment and the A/B test.
  // There are four assignment units, not eight.
  // The random draw is constrained to two sections per activity.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...hide(...slips, slipTitle, shuffledTag),

    new M.LaggedStart(
      frames.map((r, k) =>
        new M.Indicate(r, {
          color: COLORS[k],
          runTime: 0.55
        })
      ),
      { lagRatio: 0.20, runTime: 1.5 }
    ),

    ...fbox([
      ['Unit of assignment', C.violet],
      'The thing that receives',
      'an activity as a whole',
      ['Here: an entire section', C.green]
    ], C.violet),

    ...say('THE WHOLE THING ASSIGNED = UNIT OF ASSIGNMENT', C.violet)
  );

  await until(S(15));

  await play(
    ...note('4 tutorial sections = 4 units of assignment', C.green),

    ...fbox([
      ['Count the assignment units', C.ink],
      '4 tutorial sections',
      '2 sections receive cards',
      '2 sections receive sheets',
      ['8 students in total', C.muted]
    ], C.green),

    ...say('OUR ASSIGNMENT UNITS ARE TUTORIAL SECTIONS', C.green)
  );

  const versionHeadings = [
    activityHeading(0, true),
    activityHeading(1, true)
  ];

  await until(S(16));

  await play(
    ...hide(...headings),
    ...versionHeadings.map(t => fi(t)),

    ...fbox([
      ['Two versions', C.violet],
      ['A = quiz cards', CARDS],
      ['B = review sheet', SHEET]
    ], C.violet),

    ...say('VERSION A: CARDS · VERSION B: SHEET', C.violet)
  );

  headings = versionHeadings;

  await until(S(17));

  await play(
    ...fbox([
      ['A/B test', C.violet],
      'Use chance to assign units',
      'to two different versions',
      'Then compare their results',
      ['Here: 2 sections per version', C.green]
    ], C.violet),

    ...say('A RANDOM COMPARISON OF TWO VERSIONS = A/B TEST', C.violet)
  );

  // ------------------------------------------------------------
  // 18–19: everyone takes the same later quiz.
  // Every paper is marked using the same guide.
  // ------------------------------------------------------------

  let papers = NAMES.map((_, k) =>
    [0, 1].map(j =>
      quizPaper(
        personX(k, j),
        materialY(k)
      )
    )
  );

  await until(S(18));

  await play(
    ...clearMaterials(),

    reveal(papers.flat(), 1.15),

    ...note('Later quiz: same questions, out of 10 points', C.ink),

    ...fbox([
      ['Measure the outcome', C.ink],
      'Same later quiz',
      'Same possible 10 points',
      ['All 8 students take it', C.green]
    ], C.green),

    ...say('AFTER PRACTICE, EVERYONE TAKES THE SAME QUIZ', C.ink)
  );

  await until(S(19));

  await play(
    new M.LaggedStart(
      papers.flatMap((pp, k) =>
        pp.map((p, j) =>
          new M.Transform(
            p,
            quizPaper(
              personX(k, j),
              materialY(k),
              true
            ),
            { runTime: 0.45 }
          )
        )
      ),
      { lagRatio: 0.08, runTime: 1.25 }
    ),

    ...fbox([
      ['Fair marking', C.green],
      'Use the same marking guide',
      'for every quiz paper',
      'Regardless of activity'
    ], C.green),

    ...say('MARK EVERY PAPER USING THE SAME GUIDE', C.green)
  );

  // ------------------------------------------------------------
  // 20–21: calculate each section's average.
  //
  // Section totals follow directly from the fixed means and the
  // fixed count of two students:
  //
  // Section 1: 16 points
  // Section 2: 12 points
  // Section 3: 12 points
  // Section 4:  8 points
  //
  // Individual recorded scores are unspecified.
  // The equal rows show fair shares, not individual observations.
  // ------------------------------------------------------------

  const BP = P ? 0.31 : 0.29;
  const BH = P ? 0.16 : 0.13;
  const BW = BP * 0.72;

  function poolSlot(k, j) {
    const n = TOTALS[k];
    const cols = 8;

    const row = Math.floor(j / cols);
    const col = j % cols;

    const count = Math.min(cols, n - row * cols);

    return [
      cellX(k) + (col - (count - 1) / 2) * BP,
      cellY(k) + 0.09 - row * (BH + 0.07),
      0
    ];
  }

  function shareSlot(k, j) {
    const n = MEANS[k];

    const row = Math.floor(j / n);
    const col = j % n;

    return [
      cellX(k) + (col - (n - 1) / 2) * BP,
      cellY(k) + 0.14 - row * (BH + 0.18),
      0
    ];
  }

  const pools = TOTALS.map((n, k) =>
    Array.from({ length: n }, (_, j) =>
      block(
        poolSlot(k, j),
        COLORS[k],
        BW,
        BH
      )
    )
  );

  const totalLabels = TOTALS.map((n, k) =>
    txt(
      `${n} total points`,
      P ? 17 : 15,
      COLORS[k],
      cellX(k),
      cellY(k) - CH / 2 + 0.19,
      true,
      CW - 0.22
    )
  );

  await until(S(20));

  await play(
    ...hide(
      ...people.flat(),
      ...links,
      ...papers.flat()
    ),

    new M.LaggedStart(
      pools.map(st => reveal(st, 0.75)),
      { lagRatio: 0.10, runTime: 1.25 }
    ),

    ...totalLabels.map(t => fi(t)),

    ...note('One glowing block = one later quiz point', C.ink),

    ...fbox([
      ['Find each section average', C.green],
      'Add its students’ points',
      'Keep that total unchanged',
      'Share equally between 2'
    ], C.green),

    ...say('ADD POINTS INSIDE EACH SECTION, THEN SHARE', C.green)
  );

  await play(
    new M.LaggedStart(
      pools.flatMap((st, k) =>
        st.map((b, j) =>
          new M.Transform(
            b,
            block(
              shareSlot(k, j),
              COLORS[k],
              BW,
              BH
            ),
            {
              pathArc: 0.45,
              runTime: 0.6
            }
          )
        )
      ),
      { lagRatio: 0.025, runTime: 1.75 }
    ),

    ...note('Two equal shares of the same section total', C.green)
  );

  const averageLabels = MEANS.map((_, k) =>
    txt(
      'Average per student',
      P ? 16 : 14,
      C.green,
      cellX(k),
      cellY(k) - CH / 2 + 0.19,
      true,
      CW - 0.25
    )
  );

  await until(S(21));

  await play(
    ...hide(...totalLabels),
    ...averageLabels.map(t => fi(t)),

    ...fbox([
      ['Section average', C.green],
      'Total quiz points',
      '÷ number of students',
      ['The fair share inside one box', C.green]
    ], C.green),

    ...say('WRITE THE FAIR SHARE ON EACH SECTION BOX', C.green)
  );

  // ------------------------------------------------------------
  // 22–23: reveal the four fixed section averages.
  // ------------------------------------------------------------

  function meanPicture(k) {
    const n = MEANS[k];
    const x = cellX(k);
    const y = cellY(k);

    const num = txt(
      String(n),
      P ? 37 : 30,
      COLORS[k],
      x,
      y + 0.04,
      true
    );

    const points = Array.from({ length: n }, (_, j) =>
      block(
        [
          x + (j - (n - 1) / 2) * BP,
          y - (P ? 0.48 : 0.34),
          0
        ],
        COLORS[k],
        BW,
        BH
      )
    );

    return new M.VGroup(num, ...points);
  }

  let meanPictures = NAMES.map((_, k) =>
    meanPicture(k)
  );

  function showSectionMean(k) {
    return [
      ...hide(...pools[k], averageLabels[k]),
      fi(meanPictures[k], 0.55)
    ];
  }

  await until(S(22));

  await play(
    ...showSectionMean(0),
    ...showSectionMean(2),

    ...focus(columnOutline(0, CARDS)),

    ...fbox([
      ['Cards section averages', CARDS],
      'Section 1: 16 ÷ 2 = 8',
      'Section 3: 12 ÷ 2 = 6'
    ], CARDS),

    ...say('CARDS SECTIONS: AVERAGES OF 8 AND 6', CARDS)
  );

  await until(S(23));

  await play(
    ...showSectionMean(1),
    ...showSectionMean(3),

    ...focus(columnOutline(1, SHEET)),

    ...note('Each number is one section’s later quiz average', C.muted),

    ...fbox([
      ['Sheet section averages', SHEET],
      'Section 2: 12 ÷ 2 = 6',
      'Section 4: 8 ÷ 2 = 4'
    ], SHEET),

    ...say('SHEET SECTIONS: AVERAGES OF 6 AND 4', SHEET)
  );

  // ------------------------------------------------------------
  // 24–27: average the two cards section averages.
  //
  // 8 + 6 = 14
  // 14 ÷ 2 sections = 7
  //
  // For this calculation, each small block represents one point
  // of a section average, not one individual student's score.
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...focus(columnOutline(0, CARDS)),

    new M.Indicate(meanPictures[0], {
      color: CARDS,
      runTime: 0.75
    }),

    new M.Indicate(meanPictures[2], {
      color: CARDS,
      runTime: 0.75
    }),

    ...note('Now average the section averages', C.green),

    ...fbox([
      ['Cards version A', CARDS],
      'Section averages: 8 and 6',
      'Count the sections',
      ['There are 2 sections', C.ink]
    ], CARDS),

    ...say('START WITH THE TWO CARDS SECTION AVERAGES', CARDS)
  );

  await until(S(25));

  await play(
    ...fbox([
      ['Cards section averages', CARDS],
      '8 + 6',
      ['Sum = 14', C.amber]
    ], CARDS),

    ...say('8 + 6 = 14', CARDS)
  );

  // The two section-average pictures are replaced by a separate
  // equal-sharing picture inside the same section boxes.
  // Every sharing block is a new object, not a regrouped child.

  const ABP = P ? 0.31 : 0.29;
  const ABW = ABP * 0.72;
  const ABH = P ? 0.22 : 0.18;

  const AVG_POINT_Y = k =>
    cellY(k) - (P ? 0.10 : 0.08);

  function averageSlot(k, j) {
    return [
      cellX(k) + (j - 3.5) * ABP,
      AVG_POINT_Y(k),
      0
    ];
  }

  function averageBlocks(k, n) {
    return Array.from({ length: n }, (_, j) =>
      block(
        averageSlot(k, j),
        COLORS[k],
        ABW,
        ABH
      )
    );
  }

  let fairBlocks = NAMES.map(() => []);
  let fairLabels = NAMES.map(() => null);

  function fairLabel(k, n) {
    return txt(
      `${n} each`,
      P ? 19 : 17,
      COLORS[k],
      cellX(k),
      cellY(k) - (P ? 0.57 : 0.43),
      true
    );
  }

  function transferAveragePoint(from, to, color) {
    const b = fairBlocks[from].pop();

    const target = averageSlot(
      to,
      fairBlocks[to].length
    );

    fairBlocks[to].push(b);

    return new M.Transform(
      b,
      block(target, color, ABW, ABH),
      {
        pathArc: 0.75,
        runTime: 0.85
      }
    );
  }

  fairBlocks[0] = averageBlocks(0, 8);
  fairBlocks[2] = averageBlocks(2, 6);

  await until(S(26));

  await play(
    ...hide(meanPictures[0], meanPictures[2]),

    reveal(fairBlocks[0], 0.55),
    reveal(fairBlocks[2], 0.55),

    ...note('Share the sum of averages between two sections', C.green),

    ...fbox([
      ['Equal weight for each section', CARDS],
      'Sum of averages = 14',
      'Number of sections = 2',
      'Share 14 between 2'
    ], CARDS),

    ...say('SHARE THE 14 EQUALLY BETWEEN TWO CARDS BOXES', CARDS)
  );

  await play(
    transferAveragePoint(0, 2, CARDS)
  );

  fairLabels[0] = fairLabel(0, 7);
  fairLabels[2] = fairLabel(2, 7);

  const cardsMeanHeading = tag(
    'A · MEAN = 7',
    CARDS,
    cellX(0),
    HEADER_Y,
    P ? 18 : 16,
    CW
  );

  await until(S(27));

  await play(
    fi(fairLabels[0]),
    fi(fairLabels[2]),

    fo(headings[0]),
    fi(cardsMeanHeading),

    ...fbox([
      ['Cards section mean', CARDS],
      'Sum = 14',
      'Section count = 2',
      ['14 ÷ 2 = 7', CARDS]
    ], CARDS),

    ...say('CARDS SECTION AVERAGE = 7', CARDS)
  );

  headings[0] = cardsMeanHeading;

  // ------------------------------------------------------------
  // 28–30: average the two sheet section averages.
  //
  // 6 + 4 = 10
  // 10 ÷ 2 sections = 5
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    ...focus(columnOutline(1, SHEET)),

    new M.Indicate(meanPictures[1], {
      color: SHEET,
      runTime: 0.65
    }),

    new M.Indicate(meanPictures[3], {
      color: SHEET,
      runTime: 0.65
    }),

    ...fbox([
      ['Sheet section averages', SHEET],
      '6 + 4',
      ['Sum = 10', C.amber]
    ], SHEET),

    ...say('6 + 4 = 10', SHEET)
  );

  fairBlocks[1] = averageBlocks(1, 6);
  fairBlocks[3] = averageBlocks(3, 4);

  await until(S(29));

  await play(
    ...hide(meanPictures[1], meanPictures[3]),

    reveal(fairBlocks[1], 0.55),
    reveal(fairBlocks[3], 0.55),

    ...fbox([
      ['Equal weight for each section', SHEET],
      'Sum of averages = 10',
      'Number of sections = 2',
      'Share 10 between 2'
    ], SHEET),

    ...say('SHARE THE 10 EQUALLY BETWEEN TWO SHEET BOXES', SHEET)
  );

  await play(
    transferAveragePoint(1, 3, SHEET)
  );

  fairLabels[1] = fairLabel(1, 5);
  fairLabels[3] = fairLabel(3, 5);

  const sheetMeanHeading = tag(
    'B · MEAN = 5',
    SHEET,
    cellX(1),
    HEADER_Y,
    P ? 18 : 16,
    CW
  );

  await until(S(30));

  await play(
    fi(fairLabels[1]),
    fi(fairLabels[3]),

    fo(headings[1]),
    fi(sheetMeanHeading),

    ...fbox([
      ['Sheet section mean', SHEET],
      'Sum = 10',
      'Section count = 2',
      ['10 ÷ 2 = 5', SHEET]
    ], SHEET),

    ...say('SHEET SECTION AVERAGE = 5', SHEET)
  );

  headings[1] = sheetMeanHeading;

  // ------------------------------------------------------------
  // 31: all four sections contain the same number of students.
  // This example gives equal weight to each section average.
  // ------------------------------------------------------------

  const countLabels = NAMES.map((_, k) =>
    txt(
      '2 students',
      P ? 18 : 16,
      C.ink,
      cellX(k),
      cellY(k) + (P ? 0.40 : 0.29),
      true
    )
  );

  await until(S(31));

  await play(
    ...clearFocus(),
    ...countLabels.map(t => fi(t)),

    ...note('All four sections have the same size', C.green),

    ...fbox([
      ['Equal-sized sections', C.green],
      '2 students in each section',
      '2 sections per activity',
      ['Equal weight for each section', C.ink]
    ], C.green),

    ...say('EVERY SECTION CONTAINS TWO STUDENTS', C.green)
  );

  // ------------------------------------------------------------
  // 32–34: calculate and interpret the A/B score gap.
  //
  // Cards section mean − sheet section mean
  // = 7 − 5
  // = 2 points.
  // ------------------------------------------------------------

  const matchedX = [
    CX - (P ? 0.91 : 0.88),
    CX + (P ? 0.91 : 0.88)
  ];

  const COMP_BASE = P ? -1.65 : -1.90;
  const COMP_PITCH = P ? 0.42 : 0.32;
  const COMP_BW = P ? 0.80 : 0.74;

  const compSlot = (g, j) => [
    matchedX[g],
    COMP_BASE + (j + 0.5) * COMP_PITCH,
    0
  ];

  const compValues = [7, 5];

  const compStacks = compValues.map((n, g) =>
    Array.from({ length: n }, (_, j) =>
      block(
        compSlot(g, j),
        g === 0 ? CARDS : SHEET,
        COMP_BW,
        COMP_PITCH * 0.73
      )
    )
  );

  const compLabels = [
    tag(
      'A · CARDS',
      CARDS,
      matchedX[0],
      P ? 1.89 : 0.98,
      P ? 18 : 16,
      1.80
    ),

    tag(
      'B · SHEET',
      SHEET,
      matchedX[1],
      P ? 1.89 : 0.98,
      P ? 18 : 16,
      1.80
    )
  ];

  const compScores = compValues.map((n, g) =>
    txt(
      String(n),
      P ? 25 : 23,
      g === 0 ? CARDS : SHEET,
      matchedX[g],
      COMP_BASE - 0.32,
      true
    )
  );

  const compFloor = new M.Line({
    start: [matchedX[0] - 0.58, COMP_BASE, 0],
    end: [matchedX[1] + 0.58, COMP_BASE, 0],
    color: C.muted,
    strokeWidth: 2
  });

  const compTitle = txt(
    'Average of section averages',
    P ? 20 : 18,
    C.ink,
    CX,
    P ? 2.70 : 1.43,
    true,
    6.2
  );

  await until(S(32));

  await play(
    ...hide(
      ...frames,
      ...titles,
      ...headings,
      ...fairBlocks.flat(),
      ...fairLabels,
      ...countLabels
    ),

    fi(compTitle),
    ...compLabels.map(t => fi(t)),
    ...compScores.map(t => fi(t)),

    new M.Create(compFloor, { runTime: 0.65 }),

    reveal(compStacks[0], 0.85),
    reveal(compStacks[1], 0.85),

    ...note('Compare the two activity-level section means', C.ink),

    ...fbox([
      ['A/B score gap', C.ink],
      ['  = cards section average', CARDS],
      ['  − sheet section average', SHEET]
    ], C.cyan),

    ...say('CARDS SECTION MEAN MINUS SHEET SECTION MEAN')
  );

  const matches = Array.from({ length: 5 }, (_, j) => {
    const y = COMP_BASE + (j + 0.5) * COMP_PITCH;

    return new M.Line({
      start: [matchedX[0] + COMP_BW / 2 + 0.05, y, 0],
      end: [matchedX[1] - COMP_BW / 2 - 0.05, y, 0],
      color: C.muted,
      strokeWidth: 2
    });
  });

  const extraOutline = rect(
    matchedX[0],
    COMP_BASE + 6 * COMP_PITCH,
    COMP_BW + 0.20,
    2 * COMP_PITCH + 0.07,
    C.amber,
    0,
    2.5
  );

  const gapTag = tag(
    '+2',
    C.amber,
    matchedX[0] - 1.05,
    COMP_BASE + 6 * COMP_PITCH,
    23,
    1.10
  );

  await until(S(33));

  await play(
    new M.LaggedStart(
      matches.map(l =>
        new M.Create(l, { runTime: 0.25 })
      ),
      { lagRatio: 0.22, runTime: 0.95 }
    ),

    new M.Create(extraOutline, { runTime: 0.65 }),

    fi(gapTag),

    ...fbox([
      ['A/B test result', C.green],
      ['  = 7 − 5', C.ink],
      ['  = 2 points', C.amber]
    ], C.green),

    ...say('7 − 5 = A 2-POINT GAP', C.green)
  );

  await until(S(34));

  await play(
    new M.Indicate(gapTag, {
      color: C.amber,
      runTime: 0.85
    }),

    ...note('Estimate the effect of assigning whole sections', C.green),

    ...fbox([
      ['What does the gap estimate?', C.green],
      'The change in quiz scores',
      'when sections receive cards',
      'instead of review sheets',
      ['Estimated gap here: +2', C.amber]
    ], C.green),

    ...say('ESTIMATE THE EFFECT OF ASSIGNING CARDS TO SECTIONS', C.green)
  );

  // ------------------------------------------------------------
  // 35–37: the trap — confusing observed scores with the
  // units that received random assignments.
  //
  // Eight individual quiz scores are observed.
  // Four tutorial sections receive assignments.
  //
  // The students in a section receive their activity from
  // the same section slip.
  // ------------------------------------------------------------

  const finalFrames = NAMES.map((_, k) =>
    sectionFrame(k, COLORS[k])
  );

  const finalTitles = NAMES.map((_, k) =>
    sectionTitle(k)
  );

  const finalHeadings = [
    activityHeading(0, true),
    activityHeading(1, true)
  ];

  people = NAMES.map((_, k) =>
    [0, 1].map(j =>
      student(
        personX(k, j),
        personY(k)
      )
    )
  );

  links = NAMES.map((_, k) =>
    sharingLine(k)
  );

  papers = NAMES.map((_, k) =>
    [0, 1].map(j =>
      quizPaper(
        personX(k, j),
        materialY(k),
        true
      )
    )
  );

  const observedCount = tag(
    '8 INDIVIDUAL QUIZ SCORES',
    C.amber,
    CX,
    NOTE_Y,
    P ? 18 : 16,
    6.6
  );

  await until(S(35));

  await play(
    ...hide(
      compTitle,
      ...compLabels,
      ...compScores,
      ...compStacks.flat(),
      compFloor,
      ...matches,
      extraOutline,
      gapTag
    ),

    ...clearNote(),

    ...finalFrames.map(r => fi(r)),
    ...finalTitles.map(t => fi(t)),
    ...finalHeadings.map(t => fi(t)),

    reveal(people.flat(), 0.95),
    reveal(papers.flat(), 0.95),

    fi(observedCount),

    ...fbox([
      ['Common mistake', C.amber],
      'There are 8 quiz scores',
      'But did chance make',
      '8 separate activity choices?',
      ['No', C.amber]
    ], C.amber),

    ...say('8 QUIZ SCORES DOES NOT MEAN 8 RANDOM ASSIGNMENTS', C.amber)
  );

  const unitOutlines = NAMES.map((_, k) =>
    sectionOutline(k, C.green)
  );

  const unitCount = tag(
    '4 UNITS OF ASSIGNMENT',
    C.green,
    CX,
    NOTE_Y,
    P ? 18 : 16,
    6.6
  );

  await until(S(36));

  await play(
    fo(observedCount),
    fi(unitCount),

    new M.LaggedStart(
      unitOutlines.map(r =>
        new M.Create(r, { runTime: 0.35 })
      ),
      { lagRatio: 0.28, runTime: 1.35 }
    ),

    ...fbox([
      ['Count what was assigned', C.green],
      '4 tutorial section slips',
      '4 units of assignment',
      ['Not 8 separate student flips', C.amber]
    ], C.green),

    ...say('THE SHUFFLE ASSIGNED FOUR SECTIONS', C.green)
  );

  // One slip in each section sends the same activity to both
  // students. These slips are schematic representations of the
  // already-completed random draw.

  function sectionAssignmentSlip(k) {
    const x = cellX(k);
    const y = cellY(k) + (P ? 0.42 : 0.28);

    const color = COLORS[k];
    const version = ACTIVITIES[k] === 'cards' ? 'A' : 'B';

    const paper = rect(
      x,
      y,
      0.76,
      0.35,
      color,
      0.20,
      1.7
    );

    const text = txt(
      `${NAMES[k]} → ${version}`,
      P ? 15 : 13,
      color,
      x,
      y,
      true
    );

    return new M.VGroup(paper, text);
  }

  function assignmentBranches(k) {
    const x = cellX(k);
    const y = cellY(k) + (P ? 0.25 : 0.12);

    return [0, 1].map(j =>
      arrow(
        x + (j === 0 ? -0.26 : 0.26),
        y,
        personX(k, j) + (j === 0 ? 0.20 : -0.20),
        personY(k) + 0.03,
        COLORS[k]
      )
    );
  }

  const sectionSlips = NAMES.map((_, k) =>
    sectionAssignmentSlip(k)
  );

  const branches = NAMES.map((_, k) =>
    assignmentBranches(k)
  );

  await until(S(37));

  await play(
    ...hide(...papers.flat(), ...unitOutlines),

    ...sectionSlips.map(o => fi(o)),

    ...branches.flat().map(a => fi(a)),

    ...NAMES.flatMap((_, k) =>
      showMaterials(k, ACTIVITIES[k])
    ),

    ...fbox([
      ['One slip, two students', C.violet],
      'Each section gets one activity',
      'Both students receive it',
      ['Their assignments are shared', C.green]
    ], C.violet),

    ...say('BOTH STUDENTS GET THEIR ACTIVITY FROM THE SAME SLIP', C.violet)
  );

  // ------------------------------------------------------------
  // 38: final picture.
  //
  // Keep whole tutorial sections together when assigning
  // activities in this classroom sharing setup.
  //
  // Compare section averages, with the random allocation
  // constrained to two sections per activity.
  // ------------------------------------------------------------

  const finalMeans = NAMES.map((_, k) =>
    meanPicture(k)
  );

  const resultHeadings = [
    tag(
      'A · CARDS MEAN 7',
      CARDS,
      cellX(0),
      HEADER_Y,
      P ? 17 : 15,
      CW
    ),

    tag(
      'B · SHEET MEAN 5',
      SHEET,
      cellX(1),
      HEADER_Y,
      P ? 17 : 15,
      CW
    )
  ];

  const finalResult = tag(
    'A/B SCORE GAP = +2 POINTS',
    C.green,
    CX,
    NOTE_Y,
    P ? 18 : 16,
    6.5
  );

  await until(S(38));

  await play(
    ...hide(
      ...people.flat(),
      ...sectionSlips,
      ...branches.flat(),
      ...finalHeadings,
      unitCount
    ),

    ...clearMaterials(),

    ...finalMeans.map(o => fi(o)),
    ...resultHeadings.map(t => fi(t)),

    fi(finalResult),

    ...fbox([
      ['SECTION-LEVEL A/B TEST', C.violet],
      '4 units of assignment',
      '8 individual quiz scores',
      ['Cards: (8 + 6) ÷ 2 = 7', CARDS],
      ['Sheet: (6 + 4) ÷ 2 = 5', SHEET],
      ['Estimated gap: 7 − 5 = 2', C.green]
    ], C.green),

    ...say('ASSIGN WHOLE SECTIONS. COMPARE SECTION SCORES.', C.green)
  );

  await play(
    new M.LaggedStart(
      finalFrames.map((r, k) =>
        new M.Indicate(r, {
          color: COLORS[k],
          runTime: 0.55
        })
      ),
      {
        lagRatio: 0.20,
        runTime: 1.45
      }
    ),

    new M.Indicate(finalResult, {
      color: C.green,
      runTime: 0.85
    })
  );
}
