// lesson 21.1.9
// Retrieval-augmented generation: find the passage, then answer.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved reference engine API and responsive layout.
// Browser playback has not been runtime-tested against engine.js.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ------------------------------------------------------------
  // Fixed chapter data: the town library's six-page guide.
  // All passage text is preserved exactly.
  // ------------------------------------------------------------

  const GUIDE = [
    {
      page: 1,
      topic: 'Opening hours',
      text: 'The library opens at nine and closes at eight on weekdays. On Saturday it opens at ten and closes at four. It is closed on Sunday.'
    },
    {
      page: 2,
      topic: 'Borrowing',
      text: 'With a library card you can borrow up to five books. A loan lasts three weeks. Bring your card to the desk or use the self-service machine.'
    },
    {
      page: 3,
      topic: 'Renewals',
      text: 'You can renew a loan twice, online or at the desk. A reserved book cannot be renewed. Return it by its due date.'
    },
    {
      page: 4,
      topic: 'Late fees',
      text: "A late book costs twenty cents a day. This late fee stops at five euros per book. Children's books have no late fee."
    },
    {
      page: 5,
      topic: 'Rooms and printing',
      text: 'Group study rooms R12 and R14 hold six people. Book a room online for up to two hours. Printing has a fee of ten cents a page.'
    },
    {
      page: 6,
      topic: 'Holidays',
      text: 'On public holidays the library is closed. Returns can go in the drop box at the front door.'
    }
  ];

  const PAGE4 = [
    'A late book costs twenty cents a day.',
    'This late fee stops at five euros per book.',
    "Children's books have no late fee."
  ];

  // The two chunks from the earlier chunking lesson.

  const CHUNK_A = PAGE4.slice(0, 2).join(' ');
  const CHUNK_B = PAGE4[2];

  const QUESTION = "My child's picture book is three days late. What do I pay?";

  const QUESTION_LINES = [
    "My child's picture book is three days late.",
    'What do I pay?'
  ];

  const NOVEL_QUESTION = [
    'My novel is three days late.',
    'What do I pay?'
  ];

  const INSTRUCTIONS = [
    'Answer only from the passage.',
    'Name the page.',
    "If the passage does not say, answer: I don't know."
  ];

  const ANSWER = "Nothing. Children's books have no late fee. (Page 4)";

  const DAILY_FEE = 20;
  const CAP_EUROS = 5;
  const CAP_CENTS = CAP_EUROS * 100;
  const DAYS_LATE = 3;

  const NOVEL_FEE = DAYS_LATE * DAILY_FEE;
  const CAP_DAYS = CAP_CENTS / DAILY_FEE;

  const PINK = C.pink || '#F472B6';

  // Checked chapter facts:
  //
  // Without retrieval:
  //   Illustrative invented fee = 25 cents/day.
  //   3 × 25 = 75 cents.
  //
  // With the complete page 4:
  //   Children's picture book = no late fee.
  //   Adult novel, 3 days late = 60 cents.
  //   Maximum fee per book = 5 euros.
  //   Maximum reached at 25 days.
  //
  // With chunk A only:
  //   Missing children's-book exception.
  //   Incorrect answer for the child's book = 60 cents.

  // ------------------------------------------------------------
  // Responsive layout
  //
  // Phone: 8 x 14.22
  //   Content between y = -5.5 and 4.3.
  //
  // Laptop: 14.22 x 8
  //   Content between y = -3.0 and 2.3.
  //
  // Laptop: main picture left, formula box right.
  // Phone:  formula box above, main picture below.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.60;
  const CY = P ? -0.87 : -0.48;

  const YS = P ? 1.65 : 1;

  const MAIN_W = P ? 6.78 : 7.45;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.48, 0]
    : [4.30, -0.30, 0];

  const p3 = (x, y) => [x, y, 0];

  // Coordinates within the main picture.
  // All component positions are calculated before display.

  const at = (x, y) =>
    p3(CX + x, CY + y * YS);

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // Common visual helpers
  // ------------------------------------------------------------

  function fitText(s, size, color, mono, maxw, p) {
    const t = T(s, size, color, mono);

    const w = t.getWidth();

    if (w > maxw) {
      t.scale(maxw / w);
    }

    t.moveTo(p);

    return t;
  }

  function rounded(w, h, p, color, fill, opacity = 1, sw = 2) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: Math.min(0.16, h / 4),
      color,
      strokeWidth: sw
    });

    r.setFill(fill, opacity);
    r.moveTo(p);

    return r;
  }

  function rect(w, h, p, color, opacity = 1, sw = 1) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  function lag(animations, duration = 1.20, ratio = 0.10) {
    return new M.LaggedStart(animations, {
      lagRatio: ratio,
      runTime: duration
    });
  }

  function label(s, x, y, color = C.ink, size = 19, maxw = MAIN_W) {
    return fitText(
      s,
      size,
      color,
      false,
      maxw,
      at(x, y)
    );
  }

  function tag(s, color, x, y, size = 17, maxw = MAIN_W) {
    const t = pill(s, color, size);

    if (t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo(at(x, y));

    return t;
  }

  function outline(w, h, x, y, color = C.amber) {
    return rounded(
      w,
      h * YS,
      at(x, y),
      color,
      color,
      0,
      2.8
    );
  }

  function arrowBetween(a, b, color = C.amber, sw = 2.8) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const len = Math.sqrt(dx * dx + dy * dy);

    const ux = dx / len;
    const uy = dy / len;

    const ah = 0.17;
    const aw = 0.095;

    const shaft = new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth: sw
    });

    const left = new M.Line({
      start: b,
      end: [
        b[0] - ux * ah - uy * aw,
        b[1] - uy * ah + ux * aw,
        0
      ],
      color,
      strokeWidth: sw
    });

    const right = new M.Line({
      start: b,
      end: [
        b[0] - ux * ah + uy * aw,
        b[1] - uy * ah - ux * aw,
        0
      ],
      color,
      strokeWidth: sw
    });

    return new M.VGroup(
      shaft,
      left,
      right
    );
  }

  function arrow(x1, y1, x2, y2, color = C.amber) {
    return arrowBetween(
      at(x1, y1),
      at(x2, y2),
      color
    );
  }

  // ------------------------------------------------------------
  // Scene-object management
  //
  // Objects already on screen remain independent.
  // Existing objects are never regrouped to highlight them.
  // Each beat merges all visual changes into one awaited play().
  // ------------------------------------------------------------

  let active = [];

  function view(next, duration = 0.95) {
    const old = active.filter(o => !next.includes(o));
    const incoming = next.filter(o => !active.includes(o));

    const animations = old.map(o =>
      new M.FadeOut(o)
    );

    if (incoming.length === 1) {
      animations.push(
        new M.FadeIn(incoming[0], {
          runTime: duration
        })
      );
    }

    if (incoming.length > 1) {
      animations.push(
        lag(
          incoming.map(o => new M.FadeIn(o)),
          duration,
          0.10
        )
      );
    }

    active = next.slice();

    return animations;
  }

  // ------------------------------------------------------------
  // Formula / explanation box
  // Same style as the approved reference lesson.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 21;
    const lh = P ? 0.36 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw = T(
      '0000000000',
      size,
      C.ink,
      true
    ).getWidth() / 10;

    const widths = texts.map((t, i) =>
      t.getWidth() +
      cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      )
    );

    const wd = Math.max(...widths) + 0.70;
    const ht = rows.length * lh + 0.34;

    const body = rounded(
      wd,
      ht,
      BOXP,
      color,
      C.card,
      0.96,
      2
    );

    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.17 - lh / 2;

    texts.forEach((t, i) => {
      const indent = cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      );

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(
      body,
      ...texts
    );

    const maxw = P ? FW - 1.2 : 4.05;
    const maxh = P ? 1.38 : 2.50;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(BOXP);

    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return a;
  }

  // ------------------------------------------------------------
  // General text panel.
  //
  // All lines are independently placed inside the panel.
  // Leading rows can have different highlight colours.
  // ------------------------------------------------------------

  function panel(
    x,
    y,
    w,
    h,
    title,
    lines,
    accent = C.cyan,
    options = {}
  ) {
    const {
      fontSize = P ? 20 : 20,
      titleSize = 17,
      fill = C.card,
      opacity = 0.97,
      mono = false,
      centered = false,
      glow = true
    } = options;

    const p = at(x, y);

    const parts = [];

    if (glow) {
      parts.push(
        rounded(
          w + 0.07,
          h * YS + 0.07,
          p,
          accent,
          accent,
          0.07,
          1
        )
      );
    }

    parts.push(
      rounded(
        w,
        h * YS,
        p,
        accent,
        fill,
        opacity,
        2
      )
    );

    const titleText = fitText(
      title,
      titleSize,
      accent,
      true,
      w - 0.38,
      at(x, y + h / 2 - 0.17)
    );

    parts.push(titleText);

    const rows = lines.map(line =>
      Array.isArray(line)
        ? line
        : [line, C.ink]
    );

    const upper = y + h / 2 - 0.47;
    const lower = y - h / 2 + (P ? 0.17 : 0.27);

    const rowStep = rows.length > 1
      ? (upper - lower) / (rows.length - 1)
      : 0;

    rows.forEach(([s, color], j) => {
      const yy = rows.length === 1
        ? (upper + lower) / 2
        : upper - j * rowStep;

      const t = T(
        s,
        fontSize,
        color,
        mono
      );

      const maxw = w - 0.45;

      if (t.getWidth() > maxw) {
        t.scale(maxw / t.getWidth());
      }

      const xx = centered
        ? x
        : x - w / 2 + 0.23 + t.getWidth() / 2;

      t.moveTo(at(xx, yy));

      parts.push(t);
    });

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // Library guide page cards
  //
  // Page 4 = amber.
  // Page 5 = cyan.
  // All other pages = soft white.
  // ------------------------------------------------------------

  function pageColor(n) {
    if (n === 4) return C.amber;
    if (n === 5) return C.cyan;

    return C.ink;
  }

  function pageCard(n, x, y, w, h, selected = false, dim = false) {
    const d = GUIDE[n - 1];

    const color = dim
      ? C.muted
      : pageColor(n);

    const p = at(x, y);

    const halo = rounded(
      w + 0.08,
      h * YS + 0.08,
      p,
      color,
      color,
      selected ? 0.18 : 0.045,
      selected ? 2 : 1
    );

    const body = rounded(
      w,
      h * YS,
      p,
      color,
      C.card,
      0.98,
      selected ? 3 : 1.5
    );

    const nText = fitText(
      String(n),
      P ? 31 : 28,
      color,
      true,
      w - 0.30,
      at(x, y + h * 0.15)
    );

    const topic = fitText(
      d.topic,
      15,
      color,
      false,
      w - 0.20,
      at(x, y - h * 0.29)
    );

    const parts = [
      halo,
      body,
      nText,
      topic
    ];

    return new M.VGroup(...parts);
  }

  function fullGuide(
    y = 0,
    selectedPage = null,
    dimOthers = false
  ) {
    const w = P ? 1.98 : 2.12;
    const h = 0.86;

    const sp = P ? 2.17 : 2.30;

    return GUIDE.map((d, k) => {
      const col = k % 3;
      const row = Math.floor(k / 3);

      return pageCard(
        d.page,
        (col - 1) * sp,
        y + 0.53 - row * 1.06,
        w,
        h,
        d.page === selectedPage,
        dimOthers && d.page !== selectedPage
      );
    });
  }

  function passagePanel(
    x,
    y,
    w,
    h,
    highlights = [],
    title = 'PAGE 4 · LATE FEES'
  ) {
    const lines = PAGE4.map((s, k) => [
      s,
      highlights.includes(k)
        ? (k === 2 ? C.green : C.amber)
        : C.ink
    ]);

    return panel(
      x,
      y,
      w,
      h,
      title,
      lines,
      C.amber,
      {
        fontSize: 20,
        titleSize: 17
      }
    );
  }

  // ------------------------------------------------------------
  // Small language model picture.
  //
  // The glowing cells are symbolic internal parameters,
  // not actual model weights.
  // ------------------------------------------------------------

  function modelIcon(x, y, w, h, color = C.violet, frozen = false) {
    const p = at(x, y);

    const body = rounded(
      w,
      h * YS,
      p,
      color,
      C.card,
      0.98,
      2.2
    );

    const title = fitText(
      'LANGUAGE MODEL',
      17,
      color,
      true,
      w - 0.25,
      at(x, y + h * 0.34)
    );

    const parts = [
      body,
      title
    ];

    const cols = 5;
    const rows = 3;

    const spx = Math.min(0.34, (w - 0.35) / cols);
    const spy = h * 0.13;

    const cellW = spx * 0.72;
    const cellH = spy * YS * 0.68;

    for (let r = 0; r < rows; r++) {
      for (let k = 0; k < cols; k++) {
        const opacity = 0.32 + ((r * 7 + k * 3) % 6) * 0.11;

        parts.push(
          rect(
            cellW,
            cellH,
            at(
              x + (k - 2) * spx,
              y + 0.06 - r * spy
            ),
            color,
            opacity,
            1
          )
        );
      }
    }

    const note = fitText(
      frozen ? 'Weights unchanged' : 'Writes an answer',
      15,
      frozen ? C.green : C.muted,
      false,
      w - 0.25,
      at(x, y - h * 0.36)
    );

    parts.push(note);

    return new M.VGroup(...parts);
  }

  // ------------------------------------------------------------
  // 0-4. Answering without retrieving the library guide.
  // ------------------------------------------------------------

  const openingQuestion = panel(
    0,
    1.10,
    MAIN_W,
    1.10,
    'VISITOR',
    QUESTION_LINES,
    C.cyan,
    {
      fontSize: 22
    }
  );

  const visitorHead = new M.Circle({
    radius: P ? 0.27 : 0.24,
    color: C.ink,
    strokeWidth: 2
  });

  visitorHead.setFill(C.ink, 0.95);
  visitorHead.moveTo(at(-2.55, 0.18));

  const visitorBody = new M.Arc({
    radius: P ? 0.52 : 0.47,
    startAngle: 0,
    angle: Math.PI,
    color: C.ink
  });

  visitorBody.setFill(C.ink, 0.90);
  visitorBody.moveTo(at(-2.55, -0.25));

  const visitor = new M.VGroup(
    visitorHead,
    visitorBody
  );

  function bookIcon(x, y, color = C.cyan) {
    const w = 0.83;
    const h = 1.03;

    const cover = rounded(
      w,
      h,
      at(x, y),
      color,
      C.card,
      0.98,
      2
    );

    const spine = new M.Line({
      start: [
        at(x, y)[0] - w / 2 + 0.13,
        at(x, y)[1] - h / 2 + 0.06,
        0
      ],
      end: [
        at(x, y)[0] - w / 2 + 0.13,
        at(x, y)[1] + h / 2 - 0.06,
        0
      ],
      color,
      strokeWidth: 2
    });

    const picture = rounded(
      0.43,
      0.36,
      p3(
        at(x, y)[0] + 0.04,
        at(x, y)[1] + 0.14
      ),
      color,
      color,
      0.30,
      1
    );

    const title = fitText(
      'BOOK',
      12,
      color,
      true,
      0.54,
      p3(
        at(x, y)[0] + 0.04,
        at(x, y)[1] - 0.24
      )
    );

    return new M.VGroup(
      cover,
      spine,
      picture,
      title
    );
  }

  const pictureBook = bookIcon(
    -1.52,
    -0.06,
    C.cyan
  );

  const overdue = tag(
    '3 DAYS LATE',
    C.amber,
    1.55,
    -0.08,
    20,
    3.1
  );

  // 0. A visitor asks about a late children's picture book.

  await until(S(0));

  await play(
    ...view([
      openingQuestion,
      visitor,
      pictureBook,
      overdue
    ], 1.35),

    ...fbox([
      ['Picture book', C.cyan],
      ['3 days late', C.amber],
      ['Fee = ?', C.ink]
    ], C.cyan),

    ...say('WHAT DO I PAY?')
  );

  const barePrompt = panel(
    -1.98,
    -0.40,
    3.05,
    1.62,
    'PROMPT',
    [
      'The question only',
      ['No guide passage', C.muted]
    ],
    C.cyan,
    {
      centered: true
    }
  );

  const bareModel = modelIcon(
    2.02,
    -0.40,
    2.65,
    1.62,
    C.violet
  );

  const bareArrow = arrow(
    -0.37,
    -0.40,
    0.62,
    -0.40,
    C.cyan
  );

  // 1. Ask the model without adding anything else.

  await until(S(1));

  await play(
    ...view([
      openingQuestion,
      barePrompt,
      bareArrow,
      bareModel
    ]),

    ...fbox([
      ['Prompt = question', C.cyan],
      ['No retrieved text', C.muted]
    ], C.violet),

    ...say('ASK WITHOUT THE GUIDE', C.violet)
  );

  // 2. The model knows general patterns, not this guide.

  const noGuideTag = tag(
    'OUR GUIDE IS NOT IN THE PROMPT',
    PINK,
    0,
    -1.64,
    17
  );

  await until(S(2));

  await play(
    ...view([
      openingQuestion,
      barePrompt,
      bareArrow,
      bareModel,
      noGuideTag
    ]),

    new M.Indicate(
      bareModel,
      { color: C.violet }
    ),

    ...fbox([
      ['General knowledge', C.violet],
      ['≠ this library’s rules', PINK]
    ], PINK),

    ...say('THE MODEL HAS NEVER SEEN OUR GUIDE', PINK)
  );

  // 3. It invents a plausible-looking daily fee.

  const inventedAnswer = panel(
    0,
    -0.55,
    MAIN_W,
    1.80,
    'MODEL ANSWER',
    [
      'About twenty-five cents a day.',
      'Three days would cost seventy-five cents.',
      ['75 cents', C.green]
    ],
    C.violet,
    {
      fontSize: 23
    }
  );

  const inventedNote = tag(
    'SOUNDS CONFIDENT',
    C.violet,
    0,
    -1.69,
    17
  );

  await until(S(3));

  await play(
    ...view([
      openingQuestion,
      inventedAnswer,
      inventedNote
    ], 1.25),

    ...fbox([
      ['Guessed daily fee: 25¢', C.violet],
      ['3 × 25 = 75¢', C.amber],
      ['No source checked', PINK]
    ], PINK),

    ...say('A PLAUSIBLE GUESS: 75 CENTS', C.violet)
  );

  // 4. Confidence does not make the invented answer true.

  const inventedWarning = tag(
    'INVENTED — NOT FROM OUR GUIDE',
    PINK,
    0,
    -1.69,
    19
  );

  await until(S(4));

  await play(
    ...view([
      openingQuestion,
      inventedAnswer,
      inventedWarning
    ]),

    new M.Indicate(
      inventedAnswer,
      { color: PINK }
    ),

    ...fbox([
      ['Sounds sure.', C.violet],
      ['But it is invented.', PINK]
    ], PINK),

    ...say('CONFIDENT DOES NOT MEAN CORRECT', PINK)
  );

  // ------------------------------------------------------------
  // 5-7. Retrieval: search the guide and find page four.
  // ------------------------------------------------------------

  const searchQuery = tag(
    "CHILD'S BOOK · LATE FEE",
    C.cyan,
    0,
    1.58,
    19
  );

  const guideCards = fullGuide(
    0.02
  );

  const searchHeading = label(
    'SEARCH THE LIBRARY GUIDE',
    0,
    -1.43,
    C.amber,
    20
  );

  // 5. Use the retrieval methods developed in this chapter.

  await until(S(5));

  await play(
    ...view([
      searchQuery,
      ...guideCards,
      searchHeading
    ], 1.35),

    ...fbox([
      ['Find the relevant page.', C.cyan],
      ['Then give it to the model.', C.amber]
    ], C.cyan),

    ...say('NOW USE OUR LIBRARY GUIDE')
  );

  // 6. Search retrieves the complete fourth page.

  const selectedPage = pageCard(
    4,
    -(P ? 2.17 : 2.30),
    -0.51,
    P ? 1.98 : 2.12,
    0.86,
    true
  );

  const retrievedTag = tag(
    'PAGE 4 FOUND',
    C.amber,
    0,
    -1.44,
    20
  );

  const foundGuide = guideCards.map((g, k) =>
    k === 3 ? selectedPage : g
  );

  await until(S(6));

  await play(
    ...view([
      searchQuery,
      ...foundGuide,
      retrievedTag
    ]),

    new M.Flash(
      selectedPage,
      { color: C.amber }
    ),

    ...fbox([
      ['STEP 1: RETRIEVE', C.cyan],
      ['Page 4: late fees', C.amber],
      ['Keep the whole page.', C.green]
    ], C.amber),

    ...say('STEP 1: SEARCH AND RETRIEVE', C.amber)
  );

  // 7. Reveal the exact complete passage.
  // Highlight its three rules in narration order.

  let retrievedPassage = passagePanel(
    0,
    0.02,
    MAIN_W,
    2.20,
    []
  );

  const wholePageTag = tag(
    'ONE COMPLETE PASSAGE',
    C.green,
    0,
    -1.48,
    17
  );

  await until(S(7));

  await play(
    ...view([
      searchQuery,
      retrievedPassage,
      wholePageTag
    ], 1.20),

    ...fbox([
      ['20 cents per day', C.amber],
      ['Maximum: €5 per book', C.amber],
      ['Children’s books: free', C.green]
    ], C.amber),

    ...say('READ PAGE FOUR, WORD FOR WORD', C.amber)
  );

  await until(S(7) + 2.1);

  const firstHighlighted = passagePanel(
    0,
    0.02,
    MAIN_W,
    2.20,
    [0]
  );

  await play(
    ...view([
      searchQuery,
      firstHighlighted,
      wholePageTag
    ], 0.65)
  );

  retrievedPassage = firstHighlighted;

  await until(S(7) + 4.2);

  const secondHighlighted = passagePanel(
    0,
    0.02,
    MAIN_W,
    2.20,
    [0, 1]
  );

  await play(
    ...view([
      searchQuery,
      secondHighlighted,
      wholePageTag
    ], 0.65)
  );

  retrievedPassage = secondHighlighted;

  await until(S(7) + 6.0);

  const allHighlighted = passagePanel(
    0,
    0.02,
    MAIN_W,
    2.20,
    [0, 1, 2]
  );

  await play(
    ...view([
      searchQuery,
      allHighlighted,
      wholePageTag
    ], 0.65),

    ...say('THE EXCEPTION IS IN THE SAME PASSAGE', C.green)
  );

  retrievedPassage = allHighlighted;

  // ------------------------------------------------------------
  // 8-11. Build the prompt in three parts.
  //
  // Instructions = violet.
  // Retrieved evidence = amber.
  // Visitor question = cyan.
  // ------------------------------------------------------------

  const PROMPT_W = MAIN_W - 0.12;

  const IY = 1.05;
  const PY = -0.40;
  const QY = -1.85;

  const IH = 1.30;
  const PH = 1.40;
  const QH = 1.10;

  function emptyPromptPart(y, h, title, color) {
    const body = rounded(
      PROMPT_W,
      h * YS,
      at(0, y),
      color,
      C.card,
      0.35,
      1.6
    );

    const name = fitText(
      title,
      19,
      color,
      true,
      PROMPT_W - 0.40,
      at(0, y + 0.12)
    );

    const sub = fitText(
      'Waiting for content',
      16,
      C.muted,
      false,
      PROMPT_W - 0.40,
      at(0, y - 0.18)
    );

    return new M.VGroup(
      body,
      name,
      sub
    );
  }

  const emptyInstructions = emptyPromptPart(
    IY,
    IH,
    '1. INSTRUCTIONS',
    C.violet
  );

  const emptyPassage = emptyPromptPart(
    PY,
    PH,
    '2. PASSAGE',
    C.amber
  );

  const emptyQuestion = emptyPromptPart(
    QY,
    QH,
    '3. QUESTION',
    C.cyan
  );

  // 8. Construct a three-part prompt.

  await until(S(8));

  await play(
    ...view([
      emptyInstructions,
      emptyPassage,
      emptyQuestion
    ], 1.30),

    ...fbox([
      ['STEP 2: BUILD PROMPT', C.amber],
      ['Instructions', C.violet],
      ['+ passage', C.amber],
      ['+ question', C.cyan]
    ], C.amber),

    ...say('STEP 2: BUILD THE PROMPT', C.amber)
  );

  const instructionPart = panel(
    0,
    IY,
    PROMPT_W,
    IH,
    '1. INSTRUCTIONS',
    [
      INSTRUCTIONS[0],
      INSTRUCTIONS[1],
      [INSTRUCTIONS[2], C.violet]
    ],
    C.violet,
    {
      fontSize: 19,
      titleSize: 16
    }
  );

  // 9. Add the exact instructions.

  await until(S(9));

  await play(
    ...view([
      instructionPart,
      emptyPassage,
      emptyQuestion
    ]),

    ...fbox([
      ['Answer from passage.', C.violet],
      ['Name the page.', C.amber],
      ['If missing:', C.muted],
      ["“I don't know.”", C.ink]
    ], C.violet),

    ...say('PART ONE: INSTRUCTIONS', C.violet)
  );

  const passagePart = panel(
    0,
    PY,
    PROMPT_W,
    PH,
    '2. PASSAGE · PAGE 4',
    [
      PAGE4[0],
      PAGE4[1],
      [PAGE4[2], C.green]
    ],
    C.amber,
    {
      fontSize: 18,
      titleSize: 15
    }
  );

  // 10. Insert the complete retrieved passage, word for word.

  await until(S(10));

  await play(
    ...view([
      instructionPart,
      passagePart,
      emptyQuestion
    ]),

    ...fbox([
      ['Retrieved passage', C.amber],
      ['Page 4, kept whole', C.green]
    ], C.amber),

    ...say('PART TWO: THE PASSAGE', C.amber)
  );

  const questionPart = panel(
    0,
    QY,
    PROMPT_W,
    QH,
    '3. QUESTION',
    QUESTION_LINES,
    C.cyan,
    {
      fontSize: 19,
      titleSize: 15
    }
  );

  // 11. Add the visitor's question.

  await until(S(11));

  await play(
    ...view([
      instructionPart,
      passagePart,
      questionPart
    ], 0.75),

    ...fbox([
      ['Instructions', C.violet],
      ['+ passage', C.amber],
      ['+ question', C.cyan],
      ['Prompt ready', C.green]
    ], C.green),

    ...say('PART THREE: THE QUESTION', C.cyan)
  );

  // ------------------------------------------------------------
  // 12-13. Generation: the model writes an answer grounded
  // in the supplied passage.
  // ------------------------------------------------------------

  function promptStack(x, y, w, h) {
    const colors = [
      C.violet,
      C.amber,
      C.cyan
    ];

    const names = [
      'Instructions',
      'Passage · p4',
      'Question'
    ];

    const parts = [];

    const rowH = h / 3.35;

    names.forEach((name, k) => {
      const yy = y + rowH - k * rowH;

      parts.push(
        rounded(
          w,
          rowH * YS * 0.84,
          at(x, yy),
          colors[k],
          C.card,
          0.98,
          2
        ),

        fitText(
          name,
          17,
          colors[k],
          true,
          w - 0.22,
          at(x, yy)
        )
      );
    });

    return new M.VGroup(...parts);
  }

  const generationPrompt = promptStack(
    -2.06,
    0.47,
    2.90,
    1.58
  );

  const generationModel = modelIcon(
    2.05,
    0.47,
    2.65,
    1.58,
    C.violet
  );

  const generationArrow = arrow(
    -0.52,
    0.47,
    0.64,
    0.47,
    C.amber
  );

  const writingAnswer = panel(
    0,
    -1.23,
    MAIN_W,
    1.00,
    'MODEL ANSWER',
    [
      ['Writing from the passage…', C.violet]
    ],
    C.violet,
    {
      centered: true,
      fontSize: 22
    }
  );

  // 12. Give the assembled prompt to the model.

  await until(S(12));

  await play(
    ...view([
      generationPrompt,
      generationArrow,
      generationModel,
      writingAnswer
    ], 1.15),

    ...fbox([
      ['STEP 3: GENERATE', C.green],
      ['Model reads the prompt.', C.violet],
      ['Then writes an answer.', C.ink]
    ], C.green),

    ...say('STEP 3: GENERATE THE ANSWER', C.green)
  );

  const correctAnswerPanel = panel(
    0,
    -1.25,
    MAIN_W,
    1.45,
    'MODEL ANSWER',
    [
      ['Nothing.', C.green],
      "Children's books have no late fee.",
      ['(Page 4)', C.amber]
    ],
    C.green,
    {
      fontSize: 21
    }
  );

  // 13. Correct answer, with citation.

  await until(S(13));

  await play(
    ...view([
      generationPrompt,
      generationArrow,
      generationModel,
      correctAnswerPanel
    ]),

    ...fbox([
      ['Fee = 0 cents', C.green],
      ['Children’s book', C.cyan],
      ['Source: page 4', C.amber]
    ], C.green),

    ...say('NOTHING — CHILDREN’S BOOKS ARE FREE', C.green)
  );

  // ------------------------------------------------------------
  // 14. Everyday analogy: an open-book exam.
  // ------------------------------------------------------------

  function openBook(x, y) {
    const w = P ? 1.40 : 1.55;
    const h = 1.48;

    const left = rounded(
      w,
      h * YS,
      at(x - w / 2, y),
      C.muted,
      C.card,
      0.98,
      2
    );

    const right = rounded(
      w,
      h * YS,
      at(x + w / 2, y),
      C.amber,
      C.card,
      0.98,
      2
    );

    const spine = new M.Line({
      start: at(x, y - h / 2),
      end: at(x, y + h / 2),
      color: C.muted,
      strokeWidth: 2
    });

    const parts = [
      left,
      right,
      spine
    ];

    [0, 1].forEach(side => {
      const px = x + (side ? 1 : -1) * w / 2;
      const color = side ? C.amber : C.muted;

      parts.push(
        fitText(
          side ? 'PAGE 4' : 'PAGE 3',
          15,
          color,
          true,
          w - 0.20,
          at(px, y + 0.48)
        )
      );

      for (let r = 0; r < 5; r++) {
        const yy = y + 0.15 - r * 0.16;

        parts.push(
          rect(
            w * (r === 4 ? 0.55 : 0.72),
            0.036,
            at(px, yy),
            side && r === 4 ? C.green : color,
            side && r === 4 ? 1 : 0.60,
            0
          )
        );
      }
    });

    return new M.VGroup(...parts);
  }

  const examBook = openBook(
    -1.92,
    0.07
  );

  const examAnswer = panel(
    2.02,
    0.07,
    2.65,
    1.48,
    'EXAM ANSWER',
    [
      ['Find the page', C.amber],
      ['Then answer', C.green]
    ],
    C.green,
    {
      centered: true,
      fontSize: 19
    }
  );

  const examArrow = arrow(
    -0.28,
    0.07,
    0.60,
    0.07,
    C.amber
  );

  const examTitle = label(
    'AN OPEN-BOOK EXAM',
    0,
    1.52,
    C.ink,
    23
  );

  const examNote = tag(
    'LOOK IT UP, THEN ANSWER',
    C.green,
    0,
    -1.40,
    19
  );

  await until(S(14));

  await play(
    ...view([
      examTitle,
      examBook,
      examArrow,
      examAnswer,
      examNote
    ], 1.60),

    ...fbox([
      ['Not just memory.', C.muted],
      ['Find the right page.', C.amber],
      ['Answer from it.', C.green]
    ], C.green),

    ...say('IMAGINE AN OPEN-BOOK EXAM', C.green)
  );

  // ------------------------------------------------------------
  // 15-16. Evidence and citations.
  //
  // Show the connection between the supporting sentence and
  // the answer, not merely a page number.
  // ------------------------------------------------------------

  const evidencePassage = passagePanel(
    0,
    0.76,
    MAIN_W,
    1.87,
    [2],
    'SOURCE · PAGE 4'
  );

  const evidenceAnswer = panel(
    0,
    -1.30,
    MAIN_W,
    1.40,
    'ANSWER',
    [
      ['Nothing.', C.green],
      "Children's books have no late fee.",
      ['(Page 4)', C.amber]
    ],
    C.green,
    {
      fontSize: 19
    }
  );

  const evidenceArrow = arrow(
    0,
    -0.22,
    0,
    -0.51,
    C.green
  );

  // 15. The passage is the evidence.

  await until(S(15));

  await play(
    ...view([
      evidencePassage,
      evidenceArrow,
      evidenceAnswer
    ]),

    ...fbox([
      ['EVIDENCE', C.amber],
      ['Text that supports', C.ink],
      ['the answer.', C.green]
    ], C.green),

    ...say('THE PASSAGE IS THE EVIDENCE', C.amber)
  );

  // 16. The page number is a citation.

  const citationTag = tag(
    'CITATION: PAGE 4',
    C.amber,
    0,
    -2.30,
    17
  );

  await until(S(16));

  await play(
    ...view([
      evidencePassage,
      evidenceArrow,
      evidenceAnswer,
      citationTag
    ]),

    new M.Indicate(
      evidencePassage,
      { color: C.amber }
    ),

    ...fbox([
      ['CITATION', C.amber],
      ['Names the source.', C.ink],
      ['Lets others check.', C.green]
    ], C.amber),

    ...say('A CITATION TELLS US WHERE TO CHECK', C.amber)
  );

  // ------------------------------------------------------------
  // 17-19. A second question: an adult novel three days late.
  // ------------------------------------------------------------

  const secondQuestionIntro = tag(
    'A SECOND VISITOR',
    C.cyan,
    0,
    1.55,
    20
  );

  const novelBook = bookIcon(
    0,
    0.28,
    C.cyan
  );

  const novelCaption = label(
    'An ordinary novel',
    0,
    -0.53,
    C.ink,
    23
  );

  const secondQuestionMark = label(
    '?',
    0,
    -1.30,
    C.amber,
    42
  );

  // 17. Try another question.

  await until(S(17));

  await play(
    ...view([
      secondQuestionIntro,
      novelBook,
      novelCaption,
      secondQuestionMark
    ]),

    ...fbox([
      ['Same guide.', C.amber],
      ['Different question.', C.cyan]
    ], C.cyan),

    ...say('LET’S TRY A SECOND QUESTION')
  );

  const novelQuestion = panel(
    0,
    1.30,
    MAIN_W,
    1.08,
    'VISITOR',
    NOVEL_QUESTION,
    C.cyan,
    {
      fontSize: 22
    }
  );

  const novelPassage = passagePanel(
    0,
    -0.26,
    MAIN_W,
    1.66,
    [0]
  );

  const novelQuestionTag = tag(
    'ORDINARY BOOK · 3 DAYS LATE',
    C.amber,
    0,
    -1.58,
    17
  );

  // 18. The novel is three days late.

  await until(S(18));

  await play(
    ...view([
      novelQuestion,
      novelPassage,
      novelQuestionTag
    ]),

    ...fbox([
      ['Novel: ordinary book', C.cyan],
      ['Days late = 3', C.amber],
      ['Daily fee = 20¢', C.amber]
    ], C.amber),

    ...say('MY NOVEL IS THREE DAYS LATE', C.cyan)
  );

  // ------------------------------------------------------------
  // Coin picture: three equal daily charges.
  // Picture first, multiplication afterward.
  // ------------------------------------------------------------

  function coin(x, y, amount = 20) {
    const p = at(x, y);

    const halo = new M.Circle({
      radius: 0.43,
      color: C.amber,
      strokeWidth: 1
    });

    halo.setFill(C.amber, 0.10);
    halo.moveTo(p);

    const body = new M.Circle({
      radius: 0.36,
      color: C.amber,
      strokeWidth: 2.5
    });

    body.setFill(C.amber, 0.18);
    body.moveTo(p);

    const text = fitText(
      `${amount}¢`,
      21,
      C.amber,
      true,
      0.58,
      p
    );

    return new M.VGroup(
      halo,
      body,
      text
    );
  }

  const feeRule = panel(
    0,
    1.23,
    MAIN_W,
    1.04,
    'PAGE 4 · DAILY FEE',
    [
      [PAGE4[0], C.amber]
    ],
    C.amber,
    {
      fontSize: 21
    }
  );

  const dayCoins = [];

  for (let k = 0; k < 3; k++) {
    const x = (k - 1) * 1.75;

    const d = label(
      `DAY ${k + 1}`,
      x,
      0.30,
      C.muted,
      16,
      1.30
    );

    const c = coin(
      x,
      -0.25,
      DAILY_FEE
    );

    dayCoins.push(
      new M.VGroup(d, c)
    );
  }

  const plus1 = label(
    '+',
    -0.875,
    -0.25,
    C.ink,
    25
  );

  const plus2 = label(
    '+',
    0.875,
    -0.25,
    C.ink,
    25
  );

  const totalFee = tag(
    `${NOVEL_FEE} CENTS · PAGE 4`,
    C.green,
    0,
    -1.30,
    21
  );

  // 19. Three days times twenty cents equals sixty cents.

  await until(S(19));

  await play(
    ...view([
      feeRule,
      ...dayCoins,
      plus1,
      plus2,
      totalFee
    ], 2.00),

    ...fbox([
      ['20 + 20 + 20', C.amber],
      ['= 3 × 20', C.ink],
      [`= ${NOVEL_FEE} cents`, C.green]
    ], C.green),

    ...say('THREE DAILY CHARGES OF 20 CENTS', C.amber)
  );

  // ------------------------------------------------------------
  // 20-22. The fee has a cap of five euros.
  //
  // Twenty-five cells represent twenty-five daily charges.
  // Each cell is exactly twenty cents.
  // ------------------------------------------------------------

  const capRule = panel(
    0,
    1.34,
    MAIN_W,
    0.96,
    'PAGE 4 · FEE LIMIT',
    [
      [PAGE4[1], C.amber]
    ],
    C.amber,
    {
      fontSize: 20
    }
  );

  const CAP_COLS = 5;
  const CAP_ROWS = 5;

  const CAP_SPX = P ? 0.68 : 0.67;
  const CAP_SPY = 0.33;

  const CAP_GRID_X = P ? -1.48 : -1.85;
  const CAP_GRID_Y = -0.06;

  function capCell(k, lit = true) {
    const col = k % CAP_COLS;
    const row = Math.floor(k / CAP_COLS);

    const x = CAP_GRID_X + (col - 2) * CAP_SPX;
    const y = CAP_GRID_Y + (2 - row) * CAP_SPY;

    const color = lit ? C.amber : C.muted;

    const body = rounded(
      CAP_SPX * 0.86,
      CAP_SPY * YS * 0.78,
      at(x, y),
      color,
      color,
      lit ? 0.27 : 0.055,
      1.4
    );

    const value = fitText(
      '20¢',
      16,
      color,
      true,
      CAP_SPX * 0.80,
      at(x, y)
    );

    return new M.VGroup(
      body,
      value
    );
  }

  const capEmptyCells = Array.from(
    { length: CAP_DAYS },
    (_, k) => capCell(k, false)
  );

  const capFilledCells = Array.from(
    { length: CAP_DAYS },
    (_, k) => capCell(k, true)
  );

  const capGridLabel = label(
    '20 cents per cell',
    CAP_GRID_X,
    -1.13,
    C.ink,
    18,
    3.60
  );

  function capAmount(value, note, color = C.amber) {
    return panel(
      P ? 2.05 : 2.30,
      -0.10,
      P ? 2.25 : 2.65,
      1.73,
      'MAXIMUM FEE',
      [
        [value, color],
        [note, C.ink]
      ],
      color,
      {
        centered: true,
        fontSize: 25,
        titleSize: 15
      }
    );
  }

  const euroCap = capAmount(
    '€5',
    'per book'
  );

  const centsCap = capAmount(
    `${CAP_CENTS}¢`,
    '= five euros'
  );

  const capNote = tag(
    'THE FEE CANNOT GROW FOREVER',
    C.amber,
    0,
    -1.63,
    17
  );

  // 20. The passage also gives a maximum fee.

  await until(S(20));

  await play(
    ...view([
      capRule,
      ...capEmptyCells,
      capGridLabel,
      euroCap,
      capNote
    ], 1.25),

    ...fbox([
      ['Maximum fee', C.amber],
      ['= €5 per book', C.ink]
    ], C.amber),

    ...say('THE FEE STOPS AT FIVE EUROS', C.amber)
  );

  // 21. Five euros = 500 cents. Divide by 20.

  await until(S(21));

  await play(
    ...view([
      capRule,
      ...capFilledCells,
      capGridLabel,
      centsCap,
      capNote
    ], 2.65),

    ...fbox([
      ['€5 = 500 cents', C.amber],
      ['500 ÷ 20', C.ink],
      [`= ${CAP_DAYS} days`, C.green]
    ], C.green),

    ...say('HOW MANY DAILY CHARGES FIT IN FIVE EUROS?', C.amber)
  );

  // 22. At twenty-five days the fee stops growing.

  const cappedTag = tag(
    '25 DAYS → €5 MAXIMUM',
    C.green,
    0,
    -1.64,
    19
  );

  const capOutline = outline(
    CAP_SPX * CAP_COLS + 0.09,
    CAP_SPY * CAP_ROWS + 0.09,
    CAP_GRID_X,
    CAP_GRID_Y,
    C.green
  );

  await until(S(22));

  await play(
    ...view([
      capRule,
      ...capFilledCells,
      capGridLabel,
      centsCap,
      capOutline,
      cappedTag
    ]),

    ...fbox([
      ['25 × 20¢ = €5', C.green],
      ['After day 25:', C.muted],
      ['No further charge.', C.amber]
    ], C.green),

    ...say('AFTER 25 DAYS, THE FEE STOPS GROWING', C.green)
  );

  // ------------------------------------------------------------
  // 23-26. Name the complete retrieval-and-generation process.
  //
  // Picture:
  //   question → retrieve passage → enlarged prompt → answer
  // ------------------------------------------------------------

  const FLOW_W = P ? 1.93 : 2.06;

  const FLOW_X = [
    -(P ? 2.30 : 2.50),
    0,
    P ? 2.30 : 2.50
  ];

  const FLOW_Y = 0.14;
  const FLOW_H = 1.73;

  function flowNode(k, title, lines, color) {
    return panel(
      FLOW_X[k],
      FLOW_Y,
      FLOW_W,
      FLOW_H,
      title,
      lines,
      color,
      {
        centered: true,
        fontSize: 18,
        titleSize: 15
      }
    );
  }

  const retrieveNode = flowNode(
    0,
    'RETRIEVE',
    [
      ['Guide', C.ink],
      ['Page 4', C.amber]
    ],
    C.amber
  );

  const promptNode = flowNode(
    1,
    'BUILD PROMPT',
    [
      ['Instructions', C.violet],
      ['Passage', C.amber],
      ['Question', C.cyan]
    ],
    C.cyan
  );

  const generateNode = flowNode(
    2,
    'GENERATE',
    [
      ['Model', C.violet],
      ['Answer', C.green],
      ['Citation', C.amber]
    ],
    C.green
  );

  const flowArrow1 = arrow(
    FLOW_X[0] + FLOW_W / 2 + 0.025,
    FLOW_Y,
    FLOW_X[1] - FLOW_W / 2 - 0.025,
    FLOW_Y,
    C.amber
  );

  const flowArrow2 = arrow(
    FLOW_X[1] + FLOW_W / 2 + 0.025,
    FLOW_Y,
    FLOW_X[2] - FLOW_W / 2 - 0.025,
    FLOW_Y,
    C.green
  );

  const ragLongTitle = label(
    'RETRIEVAL-AUGMENTED GENERATION',
    0,
    1.52,
    C.ink,
    23
  );

  const flowSummary = tag(
    'FIND FIRST · ANSWER SECOND',
    C.green,
    0,
    -1.42,
    19
  );

  const flowObjects = [
    retrieveNode,
    flowArrow1,
    promptNode,
    flowArrow2,
    generateNode
  ];

  // 23. Give the process its full name.

  await until(S(23));

  await play(
    ...view([
      ragLongTitle,
      ...flowObjects,
      flowSummary
    ], 1.90),

    ...fbox([
      ['Retrieval:', C.amber],
      ['Find the passage.', C.ink],
      ['Generation:', C.green],
      ['Write the answer.', C.ink]
    ], C.green),

    ...say('RETRIEVAL-AUGMENTED GENERATION', C.green)
  );

  // 24. "Augmented" means the prompt becomes bigger
  // because retrieved evidence is inserted.

  const BEFORE_X = P ? -1.76 : -1.95;
  const AFTER_X = P ? 1.76 : 1.95;

  const BEFORE_W = P ? 2.85 : 3.06;
  const AFTER_W = P ? 2.85 : 3.06;

  const beforeHeading = label(
    'BEFORE',
    BEFORE_X,
    1.55,
    C.muted,
    19,
    BEFORE_W
  );

  const afterHeading = label(
    'AUGMENTED',
    AFTER_X,
    1.55,
    C.amber,
    19,
    AFTER_W
  );

  const shortPrompt = panel(
    BEFORE_X,
    -0.46,
    BEFORE_W,
    0.93,
    'PROMPT',
    [
      ['Question', C.cyan]
    ],
    C.cyan,
    {
      centered: true,
      fontSize: 20
    }
  );

  const biggerPrompt = promptStack(
    AFTER_X,
    0.04,
    AFTER_W,
    2.16
  );

  const expansionArrow = arrow(
    BEFORE_X + BEFORE_W / 2 + 0.04,
    -0.20,
    AFTER_X - AFTER_W / 2 - 0.04,
    -0.20,
    C.amber
  );

  const addedPassageTag = tag(
    '+ RETRIEVED PASSAGE',
    C.amber,
    0,
    -1.60,
    18
  );

  await until(S(24));

  await play(
    ...view([
      beforeHeading,
      afterHeading,
      shortPrompt,
      expansionArrow,
      biggerPrompt,
      addedPassageTag
    ]),

    ...fbox([
      ['Generate = write', C.green],
      ['Augment = make bigger', C.amber],
      ['Add retrieved text.', C.cyan]
    ], C.amber),

    ...say('AUGMENT THE PROMPT WITH THE PASSAGE', C.amber)
  );

  // 25. RAG is the short name.

  const acronymLetters = [];

  const acronymData = [
    ['R', 'Retrieval', C.amber],
    ['A', 'Augmented', C.cyan],
    ['G', 'Generation', C.green]
  ];

  acronymData.forEach(([letter, word, color], k) => {
    const x = FLOW_X[k];

    const body = rounded(
      FLOW_W,
      1.88 * YS,
      at(x, 0.20),
      color,
      C.card,
      0.98,
      2.4
    );

    const large = fitText(
      letter,
      P ? 60 : 64,
      color,
      true,
      FLOW_W - 0.28,
      at(x, 0.39)
    );

    const name = fitText(
      word,
      18,
      color,
      false,
      FLOW_W - 0.18,
      at(x, -0.43)
    );

    acronymLetters.push(
      new M.VGroup(
        body,
        large,
        name
      )
    );
  });

  const acronymTitle = label(
    'R A G',
    0,
    1.58,
    C.ink,
    24
  );

  const acronymNote = tag(
    'FIND · ADD · WRITE',
    C.green,
    0,
    -1.43,
    20
  );

  await until(S(25));

  await play(
    ...view([
      acronymTitle,
      ...acronymLetters,
      acronymNote
    ], 1.65),

    ...fbox([
      ['R = Retrieval', C.amber],
      ['A = Augmented', C.cyan],
      ['G = Generation', C.green]
    ], C.green),

    ...say('RAG, FOR SHORT', C.green)
  );

  // 26. The complete operation in words.

  const formulaPrompt = promptStack(
    -2.12,
    0.12,
    2.65,
    2.30
  );

  const formulaModel = modelIcon(
    0.47,
    0.12,
    1.77,
    1.68,
    C.violet
  );

  const formulaAnswer = panel(
    2.72,
    0.12,
    1.43,
    1.68,
    'OUTPUT',
    [
      ['Answer', C.green],
      ['Page 4', C.amber]
    ],
    C.green,
    {
      centered: true,
      fontSize: 17,
      titleSize: 14
    }
  );

  const formulaArrow1 = arrow(
    -0.74,
    0.12,
    -0.46,
    0.12,
    C.amber
  );

  const formulaArrow2 = arrow(
    1.40,
    0.12,
    1.96,
    0.12,
    C.green
  );

  const formulaHeading = label(
    'WHAT THE MODEL IS GIVEN',
    0,
    1.57,
    C.ink,
    21
  );

  const formulaFooter = tag(
    'THE ANSWER COMES FROM THE AUGMENTED PROMPT',
    C.green,
    0,
    -1.58,
    17
  );

  await until(S(26));

  await play(
    ...view([
      formulaHeading,
      formulaPrompt,
      formulaArrow1,
      formulaModel,
      formulaArrow2,
      formulaAnswer,
      formulaFooter
    ], 1.65),

    ...fbox([
      ['answer = model(', C.ink],
      ['  instructions', C.violet],
      ['+ retrieved passages', C.amber],
      ['+ question )', C.cyan]
    ], C.green),

    ...say('INSTRUCTIONS + PASSAGES + QUESTION', C.green)
  );

  // ------------------------------------------------------------
  // 27-28. Updating documents without retraining the model.
  //
  // Do not invent a new library policy.
  // The updated-page image is conceptual only.
  // ------------------------------------------------------------

  const updateGuide = panel(
    -2.04,
    0.18,
    2.85,
    2.15,
    'LIBRARY GUIDE',
    [
      ['Page 1 … Page 6', C.ink],
      ['Editable documents', C.amber],
      ['Replace when updated', C.green]
    ],
    C.amber,
    {
      centered: true,
      fontSize: 18
    }
  );

  const fixedWeights = modelIcon(
    2.03,
    0.18,
    2.85,
    2.15,
    C.violet,
    true
  );

  const updateArrow = arrow(
    -0.53,
    0.18,
    0.52,
    0.18,
    C.amber
  );

  const changePagesTag = tag(
    'CHANGE THE PAGES',
    C.amber,
    -2.04,
    -1.38,
    16,
    3.20
  );

  const noRetrainTag = tag(
    'SAME MODEL WEIGHTS',
    C.green,
    2.03,
    -1.38,
    16,
    3.20
  );

  // 27. RAG changes the supplied documents, not model weights.

  await until(S(27));

  await play(
    ...view([
      updateGuide,
      updateArrow,
      fixedWeights,
      changePagesTag,
      noRetrainTag
    ]),

    ...fbox([
      ['Guide changes?', C.amber],
      ['Update the pages.', C.cyan],
      ['Model weights stay', C.violet],
      ['unchanged.', C.green]
    ], C.green),

    ...say('UPDATE THE GUIDE, NOT THE MODEL', C.green)
  );

  // 28. Purpose: use your own documents, keep information
  // current by updating them, and make answers checkable.

  const benefits = [
    panel(
      FLOW_X[0],
      0.15,
      FLOW_W,
      1.93,
      'YOUR DATA',
      [
        ['Your own', C.ink],
        ['documents', C.cyan]
      ],
      C.cyan,
      {
        centered: true
      }
    ),

    panel(
      FLOW_X[1],
      0.15,
      FLOW_W,
      1.93,
      'CURRENT',
      [
        ['Update', C.amber],
        ['the source', C.ink]
      ],
      C.amber,
      {
        centered: true
      }
    ),

    panel(
      FLOW_X[2],
      0.15,
      FLOW_W,
      1.93,
      'CHECKABLE',
      [
        ['Cite', C.green],
        ['the page', C.ink]
      ],
      C.green,
      {
        centered: true
      }
    )
  ];

  const benefitTitle = label(
    'WHAT RAG IS FOR',
    0,
    1.55,
    C.ink,
    23
  );

  const benefitNote = tag(
    'ANSWERS TIED TO YOUR DOCUMENTS',
    C.green,
    0,
    -1.42,
    18
  );

  await until(S(28));

  await play(
    ...view([
      benefitTitle,
      ...benefits,
      benefitNote
    ], 1.65),

    ...fbox([
      ['Your documents', C.cyan],
      ['Updated information', C.amber],
      ['Checkable answers', C.green]
    ], C.green),

    ...say('OWN DOCUMENTS · CURRENT · CHECKABLE', C.green)
  );

  // ------------------------------------------------------------
  // 29. Retrieved passages consume prompt space.
  // Retrieve only the best few rather than the whole guide.
  // Here, page 4 is sufficient.
  // ------------------------------------------------------------

  const compactGuide = [];

  GUIDE.forEach((d, k) => {
    const col = k % 2;
    const row = Math.floor(k / 2);

    compactGuide.push(
      pageCard(
        d.page,
        -2.05 + (col - 0.5) * 1.30,
        0.91 - row * 0.88,
        1.17,
        0.71,
        d.page === 4,
        d.page !== 4
      )
    );
  });

  const guideCompactTitle = label(
    '6 GUIDE PAGES',
    -2.05,
    1.54,
    C.muted,
    17,
    3.1
  );

  const selectedPrompt = promptStack(
    2.00,
    0.04,
    2.74,
    2.26
  );

  const selectionArrow = arrow(
    -0.69,
    -0.01,
    0.54,
    -0.01,
    C.amber
  );

  const limitedPromptTag = tag(
    'ONLY RELEVANT PASSAGES',
    C.green,
    0,
    -1.62,
    18
  );

  const promptLimit = label(
    'Prompt space is limited',
    2.00,
    1.52,
    C.violet,
    17,
    3.0
  );

  await until(S(29));

  await play(
    ...view([
      guideCompactTitle,
      ...compactGuide,
      selectionArrow,
      selectedPrompt,
      promptLimit,
      limitedPromptTag
    ], 1.55),

    ...fbox([
      ['Passages take space.', C.violet],
      ['Retrieve the best few.', C.amber],
      ['Not the whole guide.', C.ink]
    ], C.amber),

    ...say('SEND ONLY THE MOST RELEVANT PASSAGES', C.amber)
  );

  // ------------------------------------------------------------
  // 30-33. Common trap: bad retrieval can produce a bad answer.
  //
  // Reproduce the exact chunking failure from the chapter:
  //
  // Chunk A:
  //   A late book costs twenty cents a day.
  //   This late fee stops at five euros per book.
  //
  // Chunk B:
  //   Children's books have no late fee.
  // ------------------------------------------------------------

  const trapHeading = label(
    'THE ANSWER DEPENDS ON THE PASSAGE',
    0,
    1.56,
    PINK,
    21
  );

  const trapEvidence = panel(
    -2.02,
    0.12,
    2.85,
    1.97,
    'RETRIEVED TEXT',
    [
      ['Right passage?', C.amber],
      ['Wrong passage?', PINK]
    ],
    C.amber,
    {
      centered: true,
      fontSize: 20
    }
  );

  const trapModel = modelIcon(
    2.02,
    0.12,
    2.65,
    1.97,
    C.violet
  );

  const trapArrow = arrow(
    -0.50,
    0.12,
    0.61,
    0.12,
    PINK
  );

  const trapNote = tag(
    'BAD EVIDENCE CAN MEAN A BAD ANSWER',
    PINK,
    0,
    -1.42,
    17
  );

  // 30. The quality of the retrieved passage matters.

  await until(S(30));

  await play(
    ...view([
      trapHeading,
      trapEvidence,
      trapArrow,
      trapModel,
      trapNote
    ]),

    ...fbox([
      ['Good retrieval matters.', C.amber],
      ['Bad passage', PINK],
      ['→ bad answer', PINK]
    ], PINK),

    ...say('TRAP: THE WRONG PASSAGE', PINK)
  );

  const chunkA = panel(
    0,
    0.75,
    MAIN_W,
    1.66,
    'CHUNK A · RETRIEVED',
    [
      PAGE4[0],
      PAGE4[1]
    ],
    C.amber,
    {
      fontSize: 20
    }
  );

  const chunkB = panel(
    0,
    -1.01,
    MAIN_W,
    1.22,
    'CHUNK B · NOT RETRIEVED',
    [
      [CHUNK_B, PINK]
    ],
    PINK,
    {
      fontSize: 21,
      opacity: 0.72
    }
  );

  const chunkBoundary = new M.DashedLine({
    start: at(-MAIN_W / 2 + 0.13, -0.16),
    end: at(MAIN_W / 2 - 0.13, -0.16),
    color: PINK
  });

  const missingExceptionTag = tag(
    'EXCEPTION LEFT BEHIND',
    PINK,
    0,
    -1.84,
    17
  );

  // 31. Retrieve chunk A only, losing the exception.

  await until(S(31));

  await play(
    ...view([
      chunkA,
      chunkBoundary,
      chunkB,
      missingExceptionTag
    ], 1.35),

    ...fbox([
      ['Chunk A: general rule', C.amber],
      ['Chunk B: exception', PINK],
      ['Only A was retrieved.', PINK]
    ], PINK),

    ...say('THE RULE WITHOUT ITS EXCEPTION', PINK)
  );

  await until(S(31) + 3.30);

  const chunkAOnly = panel(
    0,
    0.72,
    MAIN_W,
    1.84,
    'WHAT THE MODEL ACTUALLY RECEIVES',
    [
      PAGE4[0],
      PAGE4[1]
    ],
    C.amber,
    {
      fontSize: 21
    }
  );

  const missingPlaceholder = panel(
    0,
    -1.09,
    MAIN_W,
    1.10,
    'MISSING FROM THE PROMPT',
    [
      ['The children’s-book exception', PINK]
    ],
    PINK,
    {
      centered: true,
      fontSize: 20
    }
  );

  await play(
    ...view([
      chunkAOnly,
      missingPlaceholder
    ], 0.80),

    ...say('THE MODEL CANNOT SEE CHUNK B', PINK)
  );

  // 32. The incomplete passage leads to the wrong fee.

  const badChildQuestion = panel(
    0,
    1.30,
    MAIN_W,
    1.04,
    'VISITOR',
    QUESTION_LINES,
    C.cyan,
    {
      fontSize: 20
    }
  );

  const badAnswer = panel(
    0,
    -0.37,
    MAIN_W,
    1.96,
    'MODEL ANSWER',
    [
      'Twenty cents a day.',
      'Three days × twenty cents.',
      ['60 cents. (Page 4)', PINK]
    ],
    C.violet,
    {
      fontSize: 22
    }
  );

  const badAnswerTag = tag(
    'WRONG FOR A CHILDREN’S BOOK',
    PINK,
    0,
    -1.77,
    18
  );

  await until(S(32));

  await play(
    ...view([
      badChildQuestion,
      badAnswer,
      badAnswerTag
    ]),

    ...fbox([
      ['3 × 20 = 60¢', C.amber],
      ['Arithmetic is right.', C.ink],
      ['Answer is wrong.', PINK]
    ], PINK),

    ...say('WRONG ANSWER: SIXTY CENTS', PINK)
  );

  // 33. Both correct and incorrect answers can sound confident.

  const ANSWER_PAIR_W = P ? 3.12 : 3.38;

  const rightAnswer = panel(
    -1.75,
    0.07,
    ANSWER_PAIR_W,
    2.20,
    'FULL PASSAGE',
    [
      ['Nothing.', C.green],
      'Children’s books are',
      'exempt from late fees.',
      ['(Page 4)', C.amber]
    ],
    C.green,
    {
      centered: true,
      fontSize: 19
    }
  );

  const wrongAnswer = panel(
    1.75,
    0.07,
    ANSWER_PAIR_W,
    2.20,
    'INCOMPLETE PASSAGE',
    [
      ['Sixty cents.', PINK],
      'Three days late at',
      'twenty cents per day.',
      ['(Page 4)', C.amber]
    ],
    PINK,
    {
      centered: true,
      fontSize: 19
    }
  );

  const confidenceHeading = label(
    'BOTH ANSWERS SOUND SURE',
    0,
    1.55,
    C.violet,
    21
  );

  const confidenceNote = tag(
    'CONFIDENCE IS NOT EVIDENCE',
    PINK,
    0,
    -1.45,
    18
  );

  await until(S(33));

  await play(
    ...view([
      confidenceHeading,
      rightAnswer,
      wrongAnswer,
      confidenceNote
    ]),

    ...fbox([
      ['Same confident tone.', C.violet],
      ['Different evidence.', C.amber],
      ['Different correctness.', PINK]
    ], PINK),

    ...say('A WRONG ANSWER CAN SOUND JUST AS SURE', PINK)
  );

  // ------------------------------------------------------------
  // 34. Follow the citation back to the original document.
  // ------------------------------------------------------------

  const checkedPage = passagePanel(
    0,
    0.74,
    MAIN_W,
    1.93,
    [2],
    'OPEN THE CITED PAGE · PAGE 4'
  );

  const correctedAnswer = panel(
    0,
    -1.25,
    MAIN_W,
    1.45,
    'CORRECTED ANSWER',
    [
      ['Nothing.', C.green],
      "Children's books have no late fee.",
      ['(Page 4)', C.amber]
    ],
    C.green,
    {
      fontSize: 19
    }
  );

  const checkCitationArrow = arrow(
    0,
    -0.25,
    0,
    -0.50,
    C.green
  );

  await until(S(34));

  await play(
    ...view([
      checkedPage,
      checkCitationArrow,
      correctedAnswer
    ], 1.25),

    ...fbox([
      ['Open page 4.', C.amber],
      ['Find the missing rule.', PINK],
      ['Correct the answer.', C.green]
    ], C.green),

    ...say('FOLLOW THE CITATION BACK TO THE SOURCE', C.amber)
  );

  // ------------------------------------------------------------
  // 35. The "I don't know" instruction.
  //
  // It helps when the supplied evidence does not answer the
  // question. It is not a guarantee against incomplete retrieval.
  // ------------------------------------------------------------

  const abstainRule = panel(
    0,
    1.13,
    MAIN_W,
    1.28,
    'INSTRUCTIONS',
    [
      "If the passage does not say,",
      ["answer: I don't know.", C.violet]
    ],
    C.violet,
    {
      fontSize: 23
    }
  );

  const missingFact = panel(
    -1.85,
    -0.55,
    3.05,
    1.53,
    'EVIDENCE',
    [
      ['Required fact', C.ink],
      ['Not available', PINK]
    ],
    C.amber,
    {
      centered: true,
      fontSize: 19
    }
  );

  const abstainAnswer = panel(
    1.85,
    -0.55,
    3.05,
    1.53,
    'ANSWER',
    [
      ["I don't know.", C.green],
      ['Do not invent.', C.muted]
    ],
    C.green,
    {
      centered: true,
      fontSize: 22
    }
  );

  const abstainArrow = arrow(
    -0.26,
    -0.55,
    0.26,
    -0.55,
    C.green
  );

  const abstainNote = tag(
    'MISSING EVIDENCE IS NOT A LICENCE TO GUESS',
    C.green,
    0,
    -1.73,
    16
  );

  await until(S(35));

  await play(
    ...view([
      abstainRule,
      missingFact,
      abstainArrow,
      abstainAnswer,
      abstainNote
    ], 1.10),

    ...fbox([
      ['No answer in passage?', C.amber],
      ["Say “I don't know.”", C.green],
      ['Do not invent a fact.', PINK]
    ], C.green),

    ...say('WHEN EVIDENCE IS MISSING, DO NOT GUESS', C.green)
  );

  // ------------------------------------------------------------
  // 36. Preview tool calling.
  //
  // The fixed guide can tell us policies.
  // Live availability needs the library's computer.
  // No live lookup result is invented here.
  // ------------------------------------------------------------

  const staticGuideIcon = pageCard(
    4,
    -2.03,
    0.27,
    2.48,
    1.72,
    true
  );

  const staticGuideTitle = label(
    'FIXED GUIDE',
    -2.03,
    1.55,
    C.amber,
    20,
    3.05
  );

  const staticGuideNote = label(
    'Library policies',
    -2.03,
    -0.93,
    C.amber,
    18,
    3.05
  );

  function computerIcon(x, y) {
    const w = 2.75;
    const h = 1.23;

    const screen = rounded(
      w,
      h * YS,
      at(x, y + 0.15),
      C.cyan,
      C.card,
      0.98,
      2.2
    );

    const screenHeading = fitText(
      'LIBRARY CATALOG',
      16,
      C.cyan,
      true,
      w - 0.30,
      at(x, y + 0.48)
    );

    const cursor = fitText(
      'Live lookup ?',
      19,
      C.green,
      true,
      w - 0.35,
      at(x, y + 0.04)
    );

    const stand = rect(
      0.27,
      0.33,
      at(x, y - 0.64),
      C.cyan,
      0.62,
      1
    );

    const foot = rounded(
      1.23,
      0.12,
      at(x, y - 0.81),
      C.cyan,
      C.cyan,
      0.62,
      1
    );

    return new M.VGroup(
      screen,
      screenHeading,
      cursor,
      stand,
      foot
    );
  }

  const liveComputer = computerIcon(
    2.03,
    0.25
  );

  const liveTitle = label(
    'LIVE SYSTEM',
    2.03,
    1.55,
    C.cyan,
    20,
    3.0
  );

  const liveNote = label(
    'What is true right now?',
    2.03,
    -0.93,
    C.green,
    17,
    3.15
  );

  const nextArrow = arrow(
    -0.70,
    0.27,
    0.58,
    0.27,
    C.green
  );

  const nextLessonTag = tag(
    'NEXT: ASK A TOOL FOR LIVE FACTS',
    C.green,
    0,
    -1.64,
    18
  );

  await until(S(36));

  await play(
    ...view([
      staticGuideTitle,
      staticGuideIcon,
      staticGuideNote,
      nextArrow,
      liveTitle,
      liveComputer,
      liveNote,
      nextLessonTag
    ], 1.55),

    ...fbox([
      ['So far: read documents.', C.amber],
      ['Next: ask a tool.', C.cyan],
      ['Get live information.', C.green]
    ], C.green),

    ...say('NEXT: FROM FIXED PAGES TO LIVE FACTS', C.green)
  );

  // ------------------------------------------------------------
  // 37. Final one-sentence takeaway.
  //
  // Rebuild the complete RAG procedure:
  //   1. Retrieve the relevant passage.
  //   2. Add it to the prompt.
  //   3. Generate an answer supported by that passage.
  //   4. Cite the source.
  // ------------------------------------------------------------

  const finalQuestion = tag(
    'VISITOR’S QUESTION',
    C.cyan,
    0,
    1.58,
    19
  );

  const finalRetrieve = panel(
    FLOW_X[0],
    0.25,
    FLOW_W,
    1.76,
    '1. RETRIEVE',
    [
      ['Find', C.ink],
      ['Page 4', C.amber],
      ['Keep it whole', C.green]
    ],
    C.amber,
    {
      centered: true,
      fontSize: 18,
      titleSize: 15
    }
  );

  const finalPrompt = panel(
    FLOW_X[1],
    0.25,
    FLOW_W,
    1.76,
    '2. AUGMENT',
    [
      ['Instructions', C.violet],
      ['+ passage', C.amber],
      ['+ question', C.cyan]
    ],
    C.cyan,
    {
      centered: true,
      fontSize: 18,
      titleSize: 15
    }
  );

  const finalGenerate = panel(
    FLOW_X[2],
    0.25,
    FLOW_W,
    1.76,
    '3. GENERATE',
    [
      ['Write from', C.ink],
      ['the evidence', C.green],
      ['Cite the page', C.amber]
    ],
    C.green,
    {
      centered: true,
      fontSize: 18,
      titleSize: 15
    }
  );

  const finalArrow1 = arrow(
    FLOW_X[0] + FLOW_W / 2 + 0.025,
    0.25,
    FLOW_X[1] - FLOW_W / 2 - 0.025,
    0.25,
    C.amber
  );

  const finalArrow2 = arrow(
    FLOW_X[1] + FLOW_W / 2 + 0.025,
    0.25,
    FLOW_X[2] - FLOW_W / 2 - 0.025,
    0.25,
    C.green
  );

  const finalAnswer = panel(
    0,
    -1.42,
    MAIN_W,
    1.22,
    'ANSWER WITH CITATION',
    [
      ["Nothing. Children's books have no late fee.", C.green],
      ['(Page 4)', C.amber]
    ],
    C.green,
    {
      fontSize: 19,
      titleSize: 15
    }
  );

  const finalObjects = [
    finalQuestion,
    finalRetrieve,
    finalArrow1,
    finalPrompt,
    finalArrow2,
    finalGenerate,
    finalAnswer
  ];

  await until(S(37));

  await play(
    ...view(
      finalObjects,
      2.35
    ),

    ...fbox([
      ['RAG', C.green],
      ['Find the passage.', C.amber],
      ['Answer from it.', C.green],
      ['Cite the source.', C.amber]
    ], C.green),

    ...say('FIND THE PASSAGE, THEN ANSWER FROM IT', C.green)
  );

  await until(S(37) + 3.30);

  await play(
    new M.Indicate(
      finalRetrieve,
      { color: C.amber }
    ),

    new M.Indicate(
      finalAnswer,
      { color: C.green }
    ),

    ...say('RAG = RETRIEVE · ANSWER · CITE', C.green)
  );

  await until(E(37));
}
