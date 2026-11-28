// lesson 8.1.4
// Factorial designs: test every combination of two choices.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Two places per box are illustrative; the four means are fixed chapter data.
// Uses the supplied engine conventions; browser playback has not been tested.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const CARDS = C.cyan;
  const SHEET = C.pink || '#F472B6';
  const PARTNER = C.violet;

  // Row-major order:
  // 0 = sheet alone
  // 1 = cards alone
  // 2 = sheet with partner
  // 3 = cards with partner
  const MEANS = [4, 6, 5, 7];
  const COLORS = [SHEET, CARDS, SHEET, CARDS];

  const CX = P ? 0 : -2.6;
  const DX = P ? 1.77 : 1.72;

  const ROW_Y = P ? [1.32, -1.38] : [0.43, -1.55];

  const CW = P ? 2.65 : 2.52;
  const CH = P ? 2.02 : 1.48;

  const PILL = P ? [0, 3.65, 0] : [CX, 2.03, 0];
  const BOXP = P ? [0, -4.42, 0] : [4.3, -0.3, 0];

  const HEADER_Y = P ? 2.72 : 1.48;
  const NOTE_Y = P ? -2.95 : -2.72;

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

  // Formula box: lines = ['text' | ['text', color]].
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

    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;

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
    const maxh = P ? 1.85 : 4.6;

    g.scale(Math.min(1, maxw / wd, maxh / ht));
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

  // A single explanatory line beneath the main diagram.
  let noteNow = null;

  function note(s, color = C.muted) {
    const next = txt(
      s,
      P ? 18 : 16,
      color,
      CX,
      NOTE_Y,
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

  function student(x, y, name = '', color = C.ink) {
    const halo = new M.Circle({
      radius: 0.22,
      color,
      strokeWidth: 1
    });

    halo.setFill(color, 0.10);
    halo.moveTo([x, y, 0]);

    const dot = new M.Dot({
      point: [x, y, 0],
      radius: 0.12,
      color
    });

    const label = txt(
      name || ' ',
      P ? 17 : 16,
      color,
      x,
      y - 0.42,
      true
    );

    return new M.VGroup(halo, dot, label);
  }

  function cards(x, y) {
    const back = rect(
      x - 0.12, y + 0.10,
      1.10, 0.69,
      CARDS, 0.12, 1.5
    );

    const front = rect(
      x + 0.08, y - 0.04,
      1.10, 0.69,
      CARDS, 0.23, 2
    );

    const q = txt(
      '?', 26, CARDS,
      x + 0.08, y - 0.04,
      true
    );

    return new M.VGroup(back, front, q);
  }

  function sheet(x, y) {
    const paper = rect(
      x, y,
      1.18, 0.81,
      SHEET, 0.17, 2
    );

    const lines = Array.from({ length: 3 }, (_, j) =>
      new M.Line({
        start: [x - 0.37, y + 0.21 - j * 0.21, 0],
        end: [x + 0.37, y + 0.21 - j * 0.21, 0],
        color: SHEET,
        strokeWidth: 2
      })
    );

    return new M.VGroup(paper, ...lines);
  }

  function partners(x, y, linked = true) {
    const a = student(x - 0.48, y);
    const b = student(x + 0.48, y);

    const line = new M.Line({
      start: [x - 0.25, y, 0],
      end: [x + 0.25, y, 0],
      color: PARTNER,
      strokeWidth: 3
    });

    return linked
      ? new M.VGroup(line, a, b)
      : new M.VGroup(a, b);
  }

  function cellFrame(k, color = C.muted) {
    const r = new M.RoundedRectangle({
      width: CW,
      height: CH,
      cornerRadius: 0.16,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.42);
    r.moveTo([cellX(k), cellY(k), 0]);

    return r;
  }

  function cellMode(k) {
    return txt(
      k < 2 ? 'WORK ALONE' : 'WITH A PARTNER',
      P ? 18 : 16,
      k < 2 ? C.ink : PARTNER,
      cellX(k),
      cellY(k) + CH / 2 - 0.23,
      true,
      CW - 0.25
    );
  }

  function rowOutline(row, color = C.amber) {
    return rect(
      CX,
      ROW_Y[row],
      2 * DX + CW + 0.15,
      CH + 0.12,
      color,
      0,
      2.5
    );
  }

  function columnOutline(col, color = C.amber) {
    return rect(
      CX + (col === 0 ? -DX : DX),
      (ROW_Y[0] + ROW_Y[1]) / 2,
      CW + 0.14,
      ROW_Y[0] - ROW_Y[1] + CH + 0.12,
      color,
      0,
      2.5
    );
  }

  // Highlights are independent coordinate-defined objects.
  // No visible objects are regrouped.
  let focusNow = null;

  function focus(next) {
    const a = [];

    if (focusNow) a.push(fo(focusNow));
    if (next) a.push(new M.Create(next, { runTime: 0.45 }));

    focusNow = next;

    return a;
  }

  function clearFocus() {
    return focus(null);
  }

  // Arrow made from ordinary lines for engine compatibility.
  function arrow(x1, y1, x2, y2, color = C.amber, dashed = false) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);

    const ux = dx / len;
    const uy = dy / len;

    const head = Math.min(0.15, len * 0.3);
    const side = head * 0.65;

    const LineClass = dashed ? M.DashedLine : M.Line;

    const shaft = new LineClass({
      start: [x1, y1, 0],
      end: [x2, y2, 0],
      color,
      strokeWidth: 2.5
    });

    const h1 = new M.Line({
      start: [x2, y2, 0],
      end: [
        x2 - head * ux + side * uy,
        y2 - head * uy - side * ux,
        0
      ],
      color,
      strokeWidth: 2.5
    });

    const h2 = new M.Line({
      start: [x2, y2, 0],
      end: [
        x2 - head * ux - side * uy,
        y2 - head * uy + side * ux,
        0
      ],
      color,
      strokeWidth: 2.5
    });

    return new M.VGroup(shaft, h1, h2);
  }

  function across(row, color = C.amber) {
    return arrow(
      cellX(0) + CW / 2 + 0.10,
      ROW_Y[row],
      cellX(1) - CW / 2 - 0.10,
      ROW_Y[row],
      color
    );
  }

  function down(col, color = PARTNER) {
    const x = cellX(col);

    return arrow(
      x,
      ROW_Y[0] - CH / 2 - 0.08,
      x,
      ROW_Y[1] + CH / 2 + 0.08,
      color
    );
  }

  function acrossDifference(row, value) {
    return txt(
      value,
      P ? 23 : 19,
      C.amber,
      CX,
      ROW_Y[row] + 0.32,
      true,
      2 * DX - CW - 0.12
    );
  }

  function downDifference(col, value) {
    return txt(
      value,
      P ? 21 : 17,
      PARTNER,
      cellX(col) + 0.39,
      (ROW_Y[0] + ROW_Y[1]) / 2,
      true,
      0.65
    );
  }

  // One glowing block = one quiz point.
  function block(x, y, color, w = 0.24, h = 0.17) {
    const glow = new M.Rectangle({
      width: w + 0.05,
      height: h + 0.05,
      color,
      strokeWidth: 1
    });

    glow.setFill(color, 0.12);
    glow.moveTo([x, y, 0]);

    const core = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: 1
    });

    core.setFill(color, 0.86);
    core.moveTo([x, y, 0]);

    return new M.VGroup(glow, core);
  }

  // ------------------------------------------------------------
  // 0-1: introduce the two questions before drawing the design.
  // ------------------------------------------------------------

  const introY = P ? 1.2 : 0.65;

  const introCards = cards(CX + DX, introY);
  const introSheet = sheet(CX - DX, introY);

  const introLabels = [
    txt(
      'Review sheet', 20, SHEET,
      CX - DX, introY - 0.76, true
    ),
    txt(
      'Quiz cards', 20, CARDS,
      CX + DX, introY - 0.76, true
    )
  ];

  const aloneY = P ? -1.05 : -1.45;

  const introAlone = student(CX - DX, aloneY);
  const introPartner = partners(CX + DX, aloneY);

  const introModes = [
    txt(
      'Work alone', 19, C.muted,
      CX - DX, aloneY - 0.55, true
    ),
    txt(
      'Work with a partner', 19, PARTNER,
      CX + DX, aloneY - 0.55, true, 2.9
    )
  ];

  await until(S(0));

  await play(
    fi(introCards),
    fi(introSheet),
    ...introLabels.map(t => fi(t)),
    fi(introAlone),
    fi(introPartner),
    ...introModes.map(t => fi(t)),
    ...say('DO CARDS HELP? DO PARTNERS HELP?')
  );

  await until(S(1));

  await play(
    ...fbox([
      ['Two questions', C.amber],
      'Does the activity help?',
      'Does a partner help?',
      ['Can one test answer both?', C.violet]
    ], C.violet),
    ...say('ONE EXPERIMENT, TWO QUESTIONS', C.violet)
  );

  // ------------------------------------------------------------
  // 2-6: construct the four combinations.
  // ------------------------------------------------------------

  const frames = Array.from({ length: 4 }, (_, k) =>
    cellFrame(k)
  );

  const modes = Array.from({ length: 4 }, (_, k) =>
    cellMode(k)
  );

  const headings = [
    tag(
      'REVIEW SHEET',
      SHEET,
      cellX(0), HEADER_Y,
      P ? 18 : 16, CW
    ),
    tag(
      'QUIZ CARDS',
      CARDS,
      cellX(1), HEADER_Y,
      P ? 18 : 16, CW
    )
  ];

  await until(S(2));

  await play(
    ...hide(
      introCards,
      introSheet,
      introAlone,
      introPartner,
      ...introLabels,
      ...introModes
    ),
    ...clearBox(),
    new M.LaggedStart(
      frames.map(r => fi(r)),
      { lagRatio: 0.14, runTime: 1.15 }
    ),
    ...say('DRAW FOUR CLASSROOM BOXES', C.ink)
  );

  await until(S(3));

  await play(
    fi(headings[0]),
    ...[0, 2].map(k =>
      new M.Transform(
        frames[k],
        cellFrame(k, SHEET),
        { runTime: 0.55 }
      )
    ),
    ...say('LEFT COLUMN: REVIEW SHEET', SHEET)
  );

  await until(S(4));

  await play(
    fi(headings[1]),
    ...[1, 3].map(k =>
      new M.Transform(
        frames[k],
        cellFrame(k, CARDS),
        { runTime: 0.55 }
      )
    ),
    ...say('RIGHT COLUMN: QUIZ CARDS', CARDS)
  );

  const modeIcons = [
    student(cellX(0), cellY(0) - 0.14),
    student(cellX(1), cellY(1) - 0.14),
    partners(cellX(2), cellY(2) - 0.14),
    partners(cellX(3), cellY(3) - 0.14)
  ];

  await until(S(5));

  await play(
    fi(modes[0]),
    fi(modes[1]),
    fi(modeIcons[0]),
    fi(modeIcons[1]),
    ...say('TOP ROW: EVERYONE WORKS ALONE', C.muted)
  );

  await until(S(6));

  await play(
    fi(modes[2]),
    fi(modes[3]),
    fi(modeIcons[2]),
    fi(modeIcons[3]),
    ...say('BOTTOM ROW: WORK WITH A PARTNER', PARTNER)
  );

  // ------------------------------------------------------------
  // 7-9: trace the rows to see both activities at each setting.
  // ------------------------------------------------------------

  let trace = across(0, C.amber);

  await until(S(7));

  await play(
    ...focus(rowOutline(0)),
    fi(trace),
    ...say('TRACE THE TOP ROW', C.amber)
  );

  await until(S(8));

  await play(
    new M.Indicate(frames[0], {
      color: SHEET,
      runTime: 0.7
    }),
    new M.Indicate(frames[1], {
      color: CARDS,
      runTime: 0.7
    }),
    ...fbox([
      ['Top row', C.muted],
      ['Sheet alone', SHEET],
      ['Cards alone', CARDS]
    ], C.amber),
    ...say('SHEET ALONE → CARDS ALONE', C.amber)
  );

  const bottomTrace = across(1, PARTNER);

  await until(S(9));

  await play(
    ...focus(rowOutline(1, PARTNER)),
    fo(trace),
    fi(bottomTrace),
    ...fbox([
      ['Bottom row', PARTNER],
      ['Sheet with partner', SHEET],
      ['Cards with partner', CARDS]
    ], PARTNER),
    ...say('BOTH ACTIVITIES WITH PARTNERS', PARTNER)
  );

  trace = bottomTrace;

  // ------------------------------------------------------------
  // 10-12: equal places, shuffled names and sharing inside boxes.
  // Two students per cell are used as a simple illustration.
  // ------------------------------------------------------------

  const seatX = (k, j) =>
    cellX(k) + (j === 0 ? -0.55 : 0.55);

  const seatY = k =>
    cellY(k) - 0.15;

  const seats = [];

  for (let k = 0; k < 4; k++) {
    for (let j = 0; j < 2; j++) {
      const r = new M.Circle({
        radius: 0.21,
        color: C.muted,
        strokeWidth: 2
      });

      r.setFill(C.muted, 0.04);
      r.moveTo([seatX(k, j), seatY(k), 0]);

      seats.push(r);
    }
  }

  await until(S(10));

  await play(
    ...hide(...modeIcons, trace),
    ...clearFocus(),
    new M.LaggedStart(
      seats.map(r => fi(r)),
      { lagRatio: 0.08, runTime: 0.95 }
    ),
    ...note('Equal group sizes: 2 places in each box', C.green),
    ...fbox([
      ['Equal-sized groups', C.green],
      'Same number of places',
      'in every combination'
    ], C.green),
    ...say('THE SAME NUMBER OF PLACES IN EVERY BOX', C.green)
  );

  // A deterministic illustrative shuffle keeps seeking/replay stable.
  // It represents one possible random ordering, not an actual RNG draw.
  const shuffled = ['C', 'H', 'A', 'F', 'D', 'B', 'G', 'E'];

  const poolY = NOTE_Y;
  const poolPitch = P ? 0.68 : 0.66;

  const people = shuffled.map((name, j) =>
    student(
      CX + (j - 3.5) * poolPitch,
      poolY,
      name
    )
  );

  await until(S(11));

  await play(
    ...clearNote(),
    new M.LaggedStart(
      people.map(d => fi(d)),
      { lagRatio: 0.06, runTime: 0.8 }
    ),
    ...fbox([
      ['One possible shuffle', C.violet],
      'C H A F D B G E',
      'Fill the places in order'
    ], C.violet),
    ...say('SHUFFLE THE NAMES, THEN FILL THE BOXES', C.violet)
  );

  await play(
    ...hide(...seats),
    new M.LaggedStart(
      people.map((d, j) => {
        const k = Math.floor(j / 2);
        const side = j % 2;

        return new M.Transform(
          d,
          student(
            seatX(k, side),
            seatY(k),
            shuffled[j]
          ),
          { runTime: 0.65 }
        );
      }),
      { lagRatio: 0.18, runTime: 2.3 }
    )
  );

  const sharingLinks = [2, 3].map(k =>
    new M.Line({
      start: [seatX(k, 0) + 0.25, seatY(k), 0],
      end: [seatX(k, 1) - 0.25, seatY(k), 0],
      color: PARTNER,
      strokeWidth: 3
    })
  );

  await until(S(12));

  await play(
    ...sharingLinks.map(l => new M.Create(l)),
    new M.LaggedStart(
      frames.map(r =>
        new M.Indicate(r, {
          color: PARTNER,
          runTime: 0.5
        })
      ),
      { lagRatio: 0.2, runTime: 1.35 }
    ),
    ...note('Materials stay inside each assigned box', PARTNER),
    ...say('SHARE MATERIALS ONLY INSIDE YOUR BOX', PARTNER)
  );

  // ------------------------------------------------------------
  // 13-15: name the design and the two factors.
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...fbox([
      ['Factorial design', C.violet],
      'Test every combination',
      'of the choices',
      ['Here: four combinations', C.green]
    ], C.violet),
    ...say('EVERY COMBINATION: FACTORIAL DESIGN', C.violet)
  );

  await until(S(14));

  await play(
    ...fbox([
      ['Factor', C.amber],
      'A choice we change',
      'in the experiment'
    ], C.amber),
    ...say('FACTOR = A CHOICE WE CHANGE', C.amber)
  );

  await until(S(15));

  await play(
    new M.Indicate(headings[0], {
      color: SHEET,
      runTime: 0.7
    }),
    new M.Indicate(headings[1], {
      color: CARDS,
      runTime: 0.7
    }),
    new M.LaggedStart(
      modes.map(t =>
        new M.Indicate(t, {
          color: PARTNER,
          runTime: 0.55
        })
      ),
      { lagRatio: 0.2, runTime: 1.5 }
    ),
    ...fbox([
      ['Factor 1: activity', C.cyan],
      ['Sheet or cards', C.ink],
      ['Factor 2: working mode', PARTNER],
      'Alone or with partner'
    ], C.violet),
    ...say('TWO FACTORS, TWO CHOICES EACH', C.violet)
  );

  // ------------------------------------------------------------
  // 16-18: later quiz points become equal-share averages.
  // With two illustrative places per box, pooled totals are
  // 8, 12, 10 and 14. No individual observed scores are assumed.
  // ------------------------------------------------------------

  const BP = P ? 0.30 : 0.28;
  const BH = P ? 0.18 : 0.15;

  function poolSlot(k, j, n) {
    const cols = 5;
    const row = Math.floor(j / cols);
    const col = j % cols;

    const rowCount = Math.min(cols, n - row * cols);

    return [
      cellX(k) + (col - (rowCount - 1) / 2) * BP,
      cellY(k) + 0.13 - row * (BH + 0.09),
      0
    ];
  }

  function sharedSlot(k, j) {
    const n = MEANS[k];
    const row = Math.floor(j / n);
    const col = j % n;

    return [
      cellX(k) + (col - (n - 1) / 2) * BP,
      cellY(k) + 0.07 - row * (BH + 0.14),
      0
    ];
  }

  const pooled = MEANS.map((n, k) =>
    Array.from({ length: 2 * n }, (_, j) => {
      const p = poolSlot(k, j, 2 * n);

      return block(
        p[0], p[1],
        COLORS[k],
        BP * 0.73,
        BH
      );
    })
  );

  const totalLabels = MEANS.map((n, k) =>
    txt(
      `Total: ${2 * n}`,
      P ? 16 : 14,
      COLORS[k],
      cellX(k),
      cellY(k) - CH / 2 + 0.18,
      true,
      CW - 0.2
    )
  );

  await until(S(16));

  await play(
    ...hide(...people, ...sharingLinks),
    new M.LaggedStart(
      pooled.map(st =>
        new M.LaggedStart(
          st.map(b => fi(b, 0.25)),
          { lagRatio: 0.06 }
        )
      ),
      { lagRatio: 0.12, runTime: 1.8 }
    ),
    ...totalLabels.map(t => fi(t)),
    ...note('Later quiz: each glowing block is one point', C.ink),
    ...fbox([
      ['Step 1: find the total', C.amber],
      'Add the quiz points',
      'inside each box'
    ], C.amber),
    ...say('LATER QUIZ: ADD THE POINTS IN EACH BOX', C.amber)
  );

  const shareAnimations = pooled.flatMap((st, k) =>
    st.map((b, j) => {
      const p = sharedSlot(k, j);

      return new M.Transform(
        b,
        block(
          p[0], p[1],
          COLORS[k],
          BP * 0.73,
          BH
        ),
        { runTime: 0.7, pathArc: 0.45 }
      );
    })
  );

  await until(S(17));

  await play(
    new M.LaggedStart(
      shareAnimations,
      { lagRatio: 0.025, runTime: 1.9 }
    ),
    ...note('Two equal rows: one fair share per student', C.green),
    ...fbox([
      ['Step 2: share equally', C.green],
      'Keep each box total',
      'Divide by its student count',
      ['Average = fair share', C.green]
    ], C.green),
    ...say('SHARE EACH BOX TOTAL EQUALLY', C.green)
  );

  let shareLabels = MEANS.map((_, k) =>
    txt(
      'Average per student',
      P ? 17 : 15,
      C.green,
      cellX(k),
      cellY(k) - CH / 2 + 0.18,
      true,
      CW - 0.2
    )
  );

  await until(S(18));

  await play(
    ...hide(...totalLabels),
    ...shareLabels.map(t => fi(t)),
    ...fbox([
      ['Average score', C.green],
      'Total points ÷ students',
      'One fair-share score',
      'for each combination'
    ], C.green),
    ...say('WRITE THE AVERAGE INSIDE EACH BOX', C.green)
  );

  // ------------------------------------------------------------
  // 19-20: replace the pooled pictures by average-score pictures.
  // Keep the point-block representation alongside each number.
  // ------------------------------------------------------------

  function meanPicture(k) {
    const n = MEANS[k];
    const x = cellX(k);
    const y = cellY(k);

    const number = txt(
      String(n),
      P ? 38 : 32,
      COLORS[k],
      x,
      y + 0.03,
      true
    );

    const points = Array.from({ length: n }, (_, j) =>
      block(
        x + (j - (n - 1) / 2) * BP,
        y - (P ? 0.47 : 0.32),
        COLORS[k],
        BP * 0.73,
        BH
      )
    );

    return new M.VGroup(number, ...points);
  }

  const means = MEANS.map((_, k) => meanPicture(k));

  function showMean(k) {
    return [
      ...hide(...pooled[k], shareLabels[k]),
      fi(means[k], 0.55)
    ];
  }

  await until(S(19));

  await play(
    ...showMean(0),
    ...showMean(1),
    ...focus(rowOutline(0)),
    ...note('Each number is a later quiz average', C.muted),
    ...fbox([
      ['Working alone', C.muted],
      ['Sheet: 8 ÷ 2 = 4', SHEET],
      ['Cards: 12 ÷ 2 = 6', CARDS]
    ], C.green),
    ...say('ALONE: SHEET 4, CARDS 6', C.green)
  );

  await until(S(20));

  await play(
    ...showMean(2),
    ...showMean(3),
    ...focus(rowOutline(1, PARTNER)),
    ...fbox([
      ['Working with a partner', PARTNER],
      ['Sheet: 10 ÷ 2 = 5', SHEET],
      ['Cards: 14 ÷ 2 = 7', CARDS]
    ], C.green),
    ...say('WITH PARTNER: SHEET 5, CARDS 7', C.green)
  );

  // ------------------------------------------------------------
  // 21-26: cards effect — compare horizontally within rows.
  // Hold working mode fixed while changing the activity.
  // ------------------------------------------------------------

  const rowArrows = [
    across(0, C.amber),
    across(1, C.amber)
  ];

  const rowDiffs = [
    acrossDifference(0, '+2'),
    acrossDifference(1, '+2')
  ];

  await until(S(21));

  await play(
    ...clearFocus(),
    ...clearBox(),
    ...note('Change activity; keep working mode fixed', C.amber),
    ...say('QUESTION 1: HOW MUCH DO CARDS HELP?', C.amber)
  );

  await until(S(22));

  await play(
    ...focus(rowOutline(0)),
    ...fbox([
      ['Hold this choice fixed', C.muted],
      'Everyone works alone',
      'Change only the activity'
    ], C.amber),
    ...say('TOP ROW: EVERYONE WORKS ALONE', C.muted)
  );

  await until(S(23));

  await play(
    fi(rowArrows[0]),
    new M.Indicate(means[0], {
      color: SHEET,
      runTime: 0.7
    }),
    ...fbox([
      ['Cards effect: alone', C.amber],
      ['Cards score: 6', CARDS],
      ['Sheet score: 4', SHEET],
      '6 − 4'
    ], C.amber),
    ...say('MOVE ACROSS: FROM 4 TO 6', C.amber)
  );

  await play(
    new M.Indicate(means[1], {
      color: CARDS,
      runTime: 0.65
    })
  );

  await until(S(24));

  await play(
    fi(rowDiffs[0], 0.25),
    ...fbox([
      ['Working alone', C.muted],
      ['6 − 4 = 2 points', C.amber]
    ], C.amber),
    ...say('6 − 4 = 2 MORE POINTS', C.amber)
  );

  await until(S(25));

  await play(
    ...focus(rowOutline(1, PARTNER)),
    fi(rowArrows[1]),
    ...fbox([
      ['Hold this choice fixed', PARTNER],
      'Everyone has a partner',
      'Change only the activity'
    ], C.amber),
    ...say('BOTTOM ROW: EVERYONE HAS A PARTNER', PARTNER)
  );

  await until(S(26));

  await play(
    fi(rowDiffs[1]),
    new M.Indicate(means[2], {
      color: SHEET,
      runTime: 0.65
    }),
    new M.Indicate(means[3], {
      color: CARDS,
      runTime: 0.65
    }),
    ...fbox([
      ['Cards effect: partner', C.amber],
      ['Cards score: 7', CARDS],
      ['Sheet score: 5', SHEET],
      ['7 − 5 = 2 points', C.amber]
    ], C.amber),
    ...say('7 − 5 = 2 MORE POINTS AGAIN', C.amber)
  );

  // ------------------------------------------------------------
  // 27-29: give the two row differences equal weight.
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...clearFocus(),
    new M.Indicate(rowDiffs[0], {
      color: C.amber,
      runTime: 0.8
    }),
    new M.Indicate(rowDiffs[1], {
      color: C.amber,
      runTime: 0.8
    }),
    ...note('Give each row difference equal weight', C.amber),
    ...fbox([
      ['Two row differences', C.amber],
      'Alone: +2',
      'With partner: +2',
      ['Count each equally', C.green]
    ], C.amber),
    ...say('ONE CARDS RESULT ACROSS BOTH ROWS', C.amber)
  );

  await until(S(28));

  await play(
    ...fbox([
      ['Add the differences', C.amber],
      '2 + 2',
      ['Sum = 4 points', C.amber]
    ], C.amber),
    ...say('2 + 2 = 4 POINTS', C.amber)
  );

  const cardsResult = tag(
    'CARDS EFFECT = +2',
    CARDS,
    CX,
    NOTE_Y,
    18,
    5.5
  );

  await until(S(29));

  await play(
    ...clearNote(),
    fi(cardsResult),
    ...fbox([
      ['Average cards effect', CARDS],
      'Sum = 4',
      'Row differences = 2',
      ['4 ÷ 2 = 2 points', C.amber]
    ], CARDS),
    ...say('SHARE 4 ACROSS 2 ROWS: EFFECT = 2', CARDS)
  );

  // ------------------------------------------------------------
  // 30-34: partner effect — compare vertically within columns.
  // Hold the practice activity fixed while changing working mode.
  // ------------------------------------------------------------

  const colArrows = [
    down(0, PARTNER),
    down(1, PARTNER)
  ];

  const colDiffs = [
    downDifference(0, '+1'),
    downDifference(1, '+1')
  ];

  await until(S(30));

  await play(
    ...hide(...rowArrows, ...rowDiffs, cardsResult),
    ...clearBox(),
    ...note('Change working mode; keep activity fixed', PARTNER),
    ...say('QUESTION 2: HOW MUCH DOES A PARTNER HELP?', PARTNER)
  );

  await until(S(31));

  await play(
    ...focus(columnOutline(0, PARTNER)),
    fi(colArrows[0]),
    fi(colDiffs[0]),
    ...fbox([
      ['Partner effect: sheet', SHEET],
      'With partner: 5',
      'Alone: 4',
      ['5 − 4 = 1 point', PARTNER]
    ], PARTNER),
    ...say('SHEET COLUMN: 5 − 4 = 1 POINT', PARTNER)
  );

  await until(S(32));

  await play(
    ...focus(columnOutline(1, PARTNER)),
    fi(colArrows[1]),
    fi(colDiffs[1]),
    ...fbox([
      ['Partner effect: cards', CARDS],
      'With partner: 7',
      'Alone: 6',
      ['7 − 6 = 1 point', PARTNER]
    ], PARTNER),
    ...say('CARDS COLUMN: 7 − 6 = 1 POINT', PARTNER)
  );

  await until(S(33));

  await play(
    ...clearFocus(),
    new M.Indicate(colDiffs[0], {
      color: PARTNER,
      runTime: 0.65
    }),
    new M.Indicate(colDiffs[1], {
      color: PARTNER,
      runTime: 0.65
    }),
    ...fbox([
      ['Add the column differences', PARTNER],
      '1 + 1',
      ['Sum = 2 points', C.amber]
    ], PARTNER),
    ...say('1 + 1 = 2 POINTS', PARTNER)
  );

  const partnerResult = tag(
    'PARTNER EFFECT = +1',
    PARTNER,
    CX,
    NOTE_Y,
    18,
    5.5
  );

  await until(S(34));

  await play(
    ...clearNote(),
    fi(partnerResult),
    ...fbox([
      ['Average partner effect', PARTNER],
      'Sum = 2',
      'Column differences = 2',
      ['2 ÷ 2 = 1 point', PARTNER]
    ], PARTNER),
    ...say('SHARE 2 ACROSS 2 COLUMNS: EFFECT = 1', PARTNER)
  );

  // ------------------------------------------------------------
  // 35-37: general formula after the visual comparisons.
  // ------------------------------------------------------------

  const recapRowArrows = [
    across(0, C.amber),
    across(1, C.amber)
  ];

  const recapRowDiffs = [
    acrossDifference(0, '+2'),
    acrossDifference(1, '+2')
  ];

  await until(S(35));

  await play(
    fo(partnerResult),
    ...recapRowArrows.map(a => fi(a)),
    ...recapRowDiffs.map(t => fi(t)),
    ...note('Across rows: cards · Down columns: partner', C.muted),
    ...fbox([
      ['Step 1: find differences', C.cyan],
      ['Across rows: 2, 2', C.amber],
      ['Down columns: 1, 1', PARTNER]
    ], C.cyan),
    ...say('FIND THE DIFFERENCES FOR EACH FACTOR')
  );

  await until(S(36));

  await play(
    ...fbox([
      ['Step 2: find the sum', C.amber],
      ['Cards: 2 + 2 = 4', CARDS],
      ['Partner: 1 + 1 = 2', PARTNER]
    ], C.amber),
    ...say('SUM = THE TOTAL OF THE DIFFERENCES', C.amber)
  );

  await until(S(37));

  await play(
    ...fbox([
      ['Step 3: divide', C.green],
      'Effect = sum of differences',
      '         ÷ number of differences',
      ['Cards: 4 ÷ 2 = 2', CARDS],
      ['Partner: 2 ÷ 2 = 1', PARTNER]
    ], C.green),
    ...say('EFFECT = SUM ÷ NUMBER OF DIFFERENCES', C.green)
  );

  // ------------------------------------------------------------
  // 38-39: both effects from one experiment.
  // ------------------------------------------------------------

  const results = [
    tag(
      'CARDS +2',
      CARDS,
      CX - DX,
      NOTE_Y,
      17,
      CW
    ),
    tag(
      'PARTNER +1',
      PARTNER,
      CX + DX,
      NOTE_Y,
      17,
      CW
    )
  ];

  await until(S(38));

  await play(
    ...clearNote(),
    ...results.map(t => fi(t)),
    ...fbox([
      ['One factorial experiment', C.green],
      ['Cards effect = +2 points', CARDS],
      ['Partner effect = +1 point', PARTNER]
    ], C.green),
    ...say('ONE EXPERIMENT ESTIMATES BOTH EFFECTS', C.green)
  );

  await until(S(39));

  await play(
    ...hide(...colArrows, ...colDiffs),
    new M.Indicate(recapRowDiffs[0], {
      color: C.amber,
      runTime: 0.8
    }),
    new M.Indicate(recapRowDiffs[1], {
      color: C.amber,
      runTime: 0.8
    }),
    ...fbox([
      ['Equal weight for cards', CARDS],
      'Alone difference: 2',
      'Partner difference: 2',
      ['(2 + 2) ÷ 2 = 2', C.amber]
    ], CARDS),
    ...say('EQUAL WEIGHT FOR ALONE AND WITH PARTNER', CARDS)
  );

  // ------------------------------------------------------------
  // 40-41: tempting shortcut — compare diagonal cells.
  // Sheet alone (4) against cards with partner (7).
  // This changes both factors, not just the activity.
  // ------------------------------------------------------------

  const diagStart = [
    cellX(0) + CW / 2 - 0.08,
    cellY(0) - CH / 2 + 0.08,
    0
  ];

  const diagEnd = [
    cellX(3) - CW / 2 + 0.08,
    cellY(3) + CH / 2 - 0.08,
    0
  ];

  const diagonal = arrow(
    diagStart[0],
    diagStart[1],
    diagEnd[0],
    diagEnd[1],
    C.amber,
    true
  );

  const diagonalFrames = [0, 3].map(k =>
    rect(
      cellX(k),
      cellY(k),
      CW + 0.12,
      CH + 0.12,
      C.amber,
      0,
      2.5
    )
  );

  await until(S(40));

  await play(
    ...hide(
      ...recapRowArrows,
      ...recapRowDiffs,
      ...results
    ),
    ...diagonalFrames.map(r =>
      new M.Create(r, { runTime: 0.5 })
    ),
    fi(diagonal),
    ...note('Tempting shortcut: compare diagonally', C.amber),
    ...fbox([
      ['Tempting comparison', C.amber],
      ['Cards with partner: 7', CARDS],
      ['Sheet alone: 4', SHEET]
    ], C.amber),
    ...say('THE TRAP: COMPARE OPPOSITE CORNERS', C.amber)
  );

  const diagonalDiff = tag(
    '+3?',
    C.amber,
    CX,
    (ROW_Y[0] + ROW_Y[1]) / 2 + 0.15,
    18,
    0.95
  );

  await until(S(41));

  await play(
    fi(diagonalDiff),
    ...note('Both the activity and working mode changed', C.amber),
    ...fbox([
      ['7 − 4 = 3 points', C.amber],
      'But two choices changed:',
      ['Sheet → cards', CARDS],
      ['Alone → partner', PARTNER],
      'Not the cards effect alone'
    ], C.amber),
    ...say('3 POINTS, BUT TWO FACTORS CHANGED', C.amber)
  );

  // ------------------------------------------------------------
  // 42: final picture.
  // Every combination permits comparisons that change one
  // factor at a time while holding the other factor fixed.
  // ------------------------------------------------------------

  const finalRows = [
    across(0, C.amber),
    across(1, C.amber)
  ];

  const finalRowDiffs = [
    acrossDifference(0, '+2'),
    acrossDifference(1, '+2')
  ];

  const finalCols = [
    down(0, PARTNER),
    down(1, PARTNER)
  ];

  const finalColDiffs = [
    downDifference(0, '+1'),
    downDifference(1, '+1')
  ];

  const finalResults = [
    tag(
      'CARDS EFFECT +2',
      CARDS,
      CX - DX,
      NOTE_Y,
      P ? 17 : 15,
      2 * DX - 0.20
    ),
    tag(
      'PARTNER EFFECT +1',
      PARTNER,
      CX + DX,
      NOTE_Y,
      P ? 17 : 15,
      2 * DX - 0.20
    )
  ];

  await until(S(42));

  await play(
    ...hide(
      diagonal,
      diagonalDiff,
      ...diagonalFrames
    ),
    ...clearNote(),
    ...finalRows.map(a => fi(a)),
    ...finalRowDiffs.map(t => fi(t)),
    ...finalCols.map(a => fi(a)),
    ...finalColDiffs.map(t => fi(t)),
    ...finalResults.map(t => fi(t)),
    ...fbox([
      ['FACTORIAL DESIGN', C.violet],
      'Test every combination',
      'Change one factor at a time',
      ['Cards: +2 points', CARDS],
      ['Partner: +1 point', PARTNER]
    ], C.green),
    ...say('EVERY COMBINATION. CHANGE ONE CHOICE AT A TIME.', C.green)
  );

  await play(
    new M.LaggedStart(
      finalResults.map(t =>
        new M.Indicate(t, {
          color: C.green,
          runTime: 0.75
        })
      ),
      { lagRatio: 0.5, runTime: 1.5 }
    )
  );
}
