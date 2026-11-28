// lesson 13.2.1
// Decision trees: one question at a time.
// Live manim-web scene. Beat i = narration sentence i (0-based).
// Uses the supplied site/live/engine.js interface and dark-grid background.
// Browser rendering has not been verified against the actual engine runtime.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E, T,
    pill, show, showA, until, play, LINE_Y
  } = L;

  // ================================================================
  // FIXED CHAPTER DATA
  // A = steady income
  // B = savings
  // C = previous loan repaid
  // D = requested reminders
  // ================================================================

  const DATA = [
    { id: 1, A: false, B: true,  C: true,  D: false, full: true,  amount: 10 },
    { id: 2, A: true,  B: false, C: true,  D: false, full: true,  amount: 10 },
    { id: 3, A: true,  B: true,  C: false, D: true,  full: true,  amount: 10 },
    { id: 4, A: true,  B: true,  C: true,  D: true,  full: true,  amount: 10 },
    { id: 5, A: true,  B: false, C: false, D: true,  full: false, amount: 2 },
    { id: 6, A: false, B: true,  C: false, D: false, full: false, amount: 2 },
    { id: 7, A: false, B: false, C: true,  D: true,  full: false, amount: 2 },
    { id: 8, A: false, B: false, C: false, D: false, full: false, amount: 2 }
  ];

  const NEW = { A: true, B: false, C: true };

  const byId = id => DATA.find(d => d.id === id);
  const allIds = DATA.map(d => d.id);
  const yn = value => value ? 'Yes' : 'No';
  const shortYN = value => value ? 'Y' : 'N';

  // Ties predict No, as specified for this teaching example.

  function prediction(ids) {
    const yes = ids.filter(id => byId(id).full).length;
    return yes > ids.length - yes;
  }

  function mistakes(ids) {
    const pred = prediction(ids);
    return ids.filter(id => byId(id).full !== pred);
  }

  function divide(ids, question) {
    return [
      ids.filter(id => byId(id)[question]),
      ids.filter(id => !byId(id)[question])
    ];
  }

  const [AY, AN] = divide(allIds, 'A');
  const [AYBY, AYBN] = divide(AY, 'B');
  const [ANBY, ANBN] = divide(AN, 'B');
  const [AYBNCY, AYBNCN] = divide(AYBN, 'C');
  const [ANBYCY, ANBYCN] = divide(ANBY, 'C');

  const FULL = '#2DD4BF';
  const PART = '#FB923C';

  // ================================================================
  // RESPONSIVE LAYOUT
  //
  // Phone:  8 x 14.22, content y = -5.5 to 4.3
  // Laptop: 14.22 x 8, content y = -3.0 to 2.3
  // ================================================================

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.65, 0]
    : [CX, 1.88, 0];

  const BOXP = P
    ? [0, 3.65, 0]
    : [4.3, -0.3, 0];

  const say = (s, color = C.cyan) => showA(s, color, PILL);

  const SP = P ? 1.24 : 1.34;

  const Y0 = P ? 1.55 : 1.00;
  const Y1 = P ? -0.05 : -0.12;
  const Y2 = P ? -1.65 : -1.24;
  const Y3 = P ? -3.25 : -2.36;
  // Leaves are staggered so that every prediction pill has room at full size.
  const ST = P ? 1.0 : 0.75;
  const Y2L = P ? 0.45 : 0.35;

  const CARD_W = P ? 0.60 : 0.54;
  const CARD_H = P ? 0.48 : 0.38;
  const CARD_GAP = P ? 0.66 : 0.61;
  const CARD_DY = P ? 0.62 : 0.40;

  const point = (x, y) => [x, y, 0];

  const N = {
    root: point(CX, Y0),

    ay: point(CX - 1.75 * SP, Y1),
    an: point(CX + 1.75 * SP, Y1),

    ayby: point(CX - 2.5 * SP, Y2 - Y2L),
    aybn: point(CX - 1.0 * SP, Y2),

    anby: point(CX + 1.0 * SP, Y2),
    anbn: point(CX + 2.5 * SP, Y2 - Y2L),

    aybncy: point(CX - 1.5 * SP, Y3),
    aybncn: point(CX - 0.5 * SP, Y3 - ST),

    anbycy: point(CX + 0.5 * SP, Y3),
    anbycn: point(CX + 1.5 * SP, Y3 - ST)
  };

  const LEAVES = [
    { key: 'ayby', ids: AYBY },
    { key: 'aybncy', ids: AYBNCY },
    { key: 'aybncn', ids: AYBNCN },
    { key: 'anbycy', ids: ANBYCY },
    { key: 'anbycn', ids: ANBYCN },
    { key: 'anbn', ids: ANBN }
  ];

  const introPosition = id => {
    const k = id - 1;

    return point(
      CX + (k % 4 - 1.5) * (P ? 1.70 : 1.72),
      Math.floor(k / 4) === 0
        ? (P ? 0.85 : 0.48)
        : (P ? -1.15 : -1.28)
    );
  };

  // ================================================================
  // FORMULA / EXPLANATION BOX
  // Matches the approved lesson's formula-box construction.
  // ================================================================

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 19;
    const lh = P ? 0.32 : 0.40;

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

    const wd = Math.max(...widths) + 0.58;
    const ht = rows.length * lh + 0.26;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.15,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.29;
    const top = BOXP[1] + ht / 2 - 0.13 - lh / 2;

    texts.forEach((t, i) => {
      const ind = cw * (
        rows[i][0].length -
        rows[i][0].trimStart().length
      );

      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.8 : 4.05;

    if (wd > maxw) {
      g.scale(maxw / wd);
      g.moveTo(BOXP);
    }

    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return a;
  }

  // ================================================================
  // BASIC VISUAL HELPERS
  // ================================================================

  function rectAt(p, w, h, color, opacity = 0.12) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.10,
      color,
      strokeWidth: 1.5
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  function textAt(s, p, size, color = C.ink, mono = false) {
    const t = T(s, size, color, mono);
    t.moveTo(p);
    return t;
  }

  function lineAt(start, end, color = C.muted, width = 2) {
    return new M.Line({
      start,
      end,
      color,
      strokeWidth: width
    });
  }

  function flashCards(ids, color = C.amber) {
    return new M.LaggedStart(
      ids.map(id =>
        new M.Indicate(cards[id], { color })
      ),
      { lagRatio: 0.10, runTime: 1.2 }
    );
  }

  // ================================================================
  // LOAN AND REPAYMENT BLOCKS
  // Each block represents one unit of money.
  //
  // During repayment, unfilled outlines represent the units
  // that were lent but were not repaid.
  // ================================================================

  function moneyCard(id, repaid = null) {
    const p = introPosition(id);
    const x = p[0];
    const y = p[1];

    const color = repaid === null
      ? C.cyan
      : repaid === 10 ? FULL : PART;

    const w = P ? 1.40 : 1.43;
    const h = P ? 1.45 : 1.37;

    const bg = rectAt(p, w, h, color, 0.06);
    const halo = rectAt(p, w + 0.08, h + 0.08, color, 0.025);

    const idText = textAt(
      `#${id}`,
      point(x, y + 0.47),
      19,
      C.ink,
      true
    );

    const blocks = [];

    const bw = 0.43;
    const bh = P ? 0.11 : 0.10;
    const pitch = P ? 0.145 : 0.135;

    for (let j = 0; j < 10; j++) {
      const col = Math.floor(j / 5);
      const row = j % 5;

      const filled = repaid === null || j < repaid;

      const b = new M.Rectangle({
        width: bw,
        height: bh,
        color: filled ? color : C.muted,
        strokeWidth: 1
      });

      b.setFill(
        filled ? color : C.card,
        filled ? 0.90 : 0.12
      );

      b.moveTo([
        x + (col - 0.5) * 0.49,
        y - 0.22 + row * pitch,
        0
      ]);

      blocks.push(b);
    }

    const amount = textAt(
      repaid === null ? '10 lent' : `${repaid} repaid`,
      point(x, y - 0.49),
      15,
      color,
      true
    );

    return new M.VGroup(
      halo, bg, idText, ...blocks, amount
    );
  }

  const loanCards = {};

  function revealRepayment(ids) {
    const a = [];

    ids.forEach(id => {
      const next = moneyCard(id, byId(id).amount);

      a.push(
        new M.Transform(loanCards[id], next)
      );
    });

    return a;
  }

  // ================================================================
  // GLOWING APPLICATION CARDS
  //
  // Fully repaid:
  //   teal circle with check mark
  //
  // Partial repayment:
  //   orange square with minus sign
  //
  // Every card retains its original application number.
  // ================================================================

  function makeCard(id, p, scale = 1) {
    const d = byId(id);
    const color = d.full ? FULL : PART;

    const w = CARD_W * scale;
    const h = CARD_H * scale;

    const x = p[0];
    const y = p[1];

    const glow = rectAt(
      p,
      w + 0.07 * scale,
      h + 0.07 * scale,
      color,
      0.06
    );

    const bg = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.055 * scale,
      color,
      strokeWidth: 1.2
    });

    bg.setFill(C.card, 0.96);
    bg.moveTo(p);

    const number = textAt(
      String(id),
      point(x - w * 0.23, y),
      (P ? 16 : 15) * scale,
      C.ink,
      true
    );

    const mx = x + w * 0.19;
    const mr = h * 0.28;

    const markerGlow = new M.Circle({
      radius: mr * 1.38,
      color,
      strokeWidth: 0.5
    });

    markerGlow.setFill(color, 0.13);
    markerGlow.moveTo([mx, y, 0]);

    let marker;

    if (d.full) {
      marker = new M.Circle({
        radius: mr,
        color,
        strokeWidth: 1.5
      });
    } else {
      marker = new M.Rectangle({
        width: mr * 1.90,
        height: mr * 1.90,
        color,
        strokeWidth: 1.5
      });
    }

    marker.setFill(color, 0.23);
    marker.moveTo([mx, y, 0]);

    const glyph = textAt(
      d.full ? '✓' : '−',
      point(mx, y),
      (P ? 12 : 13) * scale,
      color
    );

    return new M.VGroup(
      glow,
      bg,
      number,
      markerGlow,
      marker,
      glyph
    );
  }

  const cards = {};
  const positions = {};
  const scales = {};

  function createCard(id, p, scale = 1) {
    const g = makeCard(id, p, scale);

    cards[id] = g;
    positions[id] = p.slice();
    scales[id] = scale;

    return g;
  }

  function cardSlots(ids, key) {
    const p = N[key];

    const cols = key === 'root'
      ? Math.min(ids.length, 4)
      : ids.length;

    return ids.map((id, k) => {
      const row = Math.floor(k / cols);
      const col = k % cols;

      const countInRow = Math.min(
        cols,
        ids.length - row * cols
      );

      return point(
        p[0] + (col - (countInRow - 1) / 2) * CARD_GAP,
        p[1] - CARD_DY - row * (CARD_H + 0.12)
      );
    });
  }

  // Transform the existing card directly.
  // Never put already-visible cards inside a new VGroup to move them.

  function moveCards(ids, key, pathArc = 0) {
    const slots = cardSlots(ids, key);

    return ids.map((id, k) => {
      const target = slots[k];

      const a = new M.Transform(
        cards[id],
        makeCard(id, target),
        {
          pathArc,
          runTime: 1.0
        }
      );

      positions[id] = target.slice();
      scales[id] = 1;

      return a;
    });
  }

  // ================================================================
  // APPLICATION ANSWERS
  // Visible during the introduction to the dataset.
  // ================================================================

  const details = [];

  function applicationDetails(id) {
    const d = byId(id);
    const p = introPosition(id);

    const text1 = textAt(
      `A:${shortYN(d.A)}  B:${shortYN(d.B)}`,
      point(p[0], p[1] - (P ? 0.78 : 0.62)),
      P ? 16 : 15,
      C.muted,
      true
    );

    const text2 = textAt(
      `C:${shortYN(d.C)}  D:${shortYN(d.D)}`,
      point(p[0], p[1] - (P ? 1.06 : 0.88)),
      P ? 16 : 15,
      C.muted,
      true
    );

    return new M.VGroup(text1, text2);
  }

  // ================================================================
  // TREE NODES
  //
  // Question pills are cyan.
  // Prediction pills use the corresponding outcome colour.
  // All prediction text explicitly says Yes or No.
  // ================================================================

  const nodes = {};

  function nodeLabel(key, s, color = C.cyan, maxw = null) {
    const g = pill(s, color, P ? 15 : 15);
    const w = maxw === null ? 2.15 * SP : maxw;

    if (g.getWidth() > w) {
      g.scale(w / g.getWidth());
    }

    g.moveTo(N[key]);

    const a = [];

    if (nodes[key]) {
      a.push(new M.FadeOut(nodes[key]));
    }

    nodes[key] = g;
    a.push(new M.FadeIn(g));

    return a;
  }

  function question(key, s) {
    return nodeLabel(key, s, C.cyan);
  }

  function predictNode(key, ids, final = false) {
    const pred = prediction(ids);

    return nodeLabel(
      key,
      pred ? 'Predict YES' : 'Predict NO',
      pred ? FULL : PART,
      final ? 1.75 : SP * 2.10
    );
  }

  // ================================================================
  // TREE BRANCHES
  //
  // All branch labels explicitly state Yes or No.
  // Branch colour alone is never required to read a path.
  // ================================================================

  const edges = {};

  function branch(parent, child, answer) {
    const a = N[parent];
    const b = N[child];

    const color = answer ? FULL : PART;

    const start = point(
      a[0],
      a[1] - (P ? 0.21 : 0.17)
    );

    const end = point(
      b[0],
      b[1] + (P ? 0.22 : 0.17)
    );

    const glow = lineAt(
      start,
      end,
      color,
      P ? 6 : 5
    );

    glow.setStroke(color, P ? 6 : 5, 0.12);

    const edge = lineAt(
      start,
      end,
      color,
      P ? 2.5 : 2
    );

    const lab = pill(
      answer ? 'Yes' : 'No',
      color,
      15
    );

    const maxw = 0.9;

    if (lab.getWidth() > maxw) {
      lab.scale(maxw / lab.getWidth());
    }

    lab.moveTo([
      start[0] * 0.40 + end[0] * 0.60,
      start[1] * 0.40 + end[1] * 0.60,
      0
    ]);

    edges[`${parent}:${child}`] = {
      glow,
      edge,
      label: lab,
      start,
      end
    };

    return [
      new M.Create(glow),
      new M.Create(edge),
      new M.FadeIn(lab)
    ];
  }

  // ================================================================
  // MISTAKE OUTLINES
  //
  // An amber outline means the current prediction disagrees with
  // the recorded outcome. It does not change the recorded outcome.
  // ================================================================

  let wrongMarks = [];

  function clearMistakes() {
    const a = wrongMarks.map(m => new M.FadeOut(m));
    wrongMarks = [];
    return a;
  }

  function markMistakes(ids) {
    const a = clearMistakes();

    ids.forEach(id => {
      const p = positions[id];
      const s = scales[id];

      const r = new M.RoundedRectangle({
        width: CARD_W * s + 0.12,
        height: CARD_H * s + 0.12,
        cornerRadius: 0.08,
        color: C.amber,
        strokeWidth: 2.6
      });

      r.setFill(C.amber, 0.025);
      r.moveTo(p);

      wrongMarks.push(r);
      a.push(new M.Create(r));
    });

    return a;
  }

  // The count is derived from the current groups, not hard-coded
  // independently of the application data.

  const history = [];

  function recordMistakes(groups) {
    const wrong = groups.flatMap(ids => mistakes(ids));

    history.push(wrong.length);

    return [
      ...markMistakes(wrong),
      ...fbox([
        ['Historical mistakes', C.muted],
        [`${wrong.length} / 8`, C.amber]
      ], C.amber)
    ];
  }

  // ================================================================
  // NEW BORROWER
  // Unknown outcome: violet card with a question mark.
  // ================================================================

  const NEW_POS = P
    ? point(0, -3.55)
    : point(4.3, -1.95);

  function makeNewBorrower(p) {
    const r = rectAt(
      p,
      P ? 2.25 : 2.45,
      1.02,
      C.violet,
      0.12
    );

    const title = textAt(
      'NEW APPLICATION',
      point(p[0], p[1] + 0.23),
      17,
      C.violet
    );

    const unknown = textAt(
      'Repayment: ?',
      point(p[0], p[1] - 0.20),
      18,
      C.ink,
      true
    );

    return new M.VGroup(r, title, unknown);
  }

  const newBorrower = makeNewBorrower(NEW_POS);

  function tokenAt(key) {
    const p = N[key];

    const g = pill('NEW', C.violet, 15);

    const maxw = 0.9;

    if (g.getWidth() > maxw) {
      g.scale(maxw / g.getWidth());
    }

    // Sit just left of the node's pill, so it never covers a branch label.
    const nw = nodes[key] ? nodes[key].getWidth() : 1.5;
    g.moveTo([
      p[0] - nw / 2 - g.getWidth() / 2 - 0.08,
      p[1],
      0
    ]);

    return g;
  }

  let newToken = null;
  const activePath = [];

  function followBranch(parent, child) {
    const data = edges[`${parent}:${child}`];

    const trace = lineAt(
      data.start,
      data.end,
      C.violet,
      P ? 5 : 4
    );

    activePath.push(trace);

    const oldToken = newToken;
    newToken = tokenAt(child);

    return [
      new M.Create(trace),
      new M.Indicate(data.label, { color: C.violet }),
      new M.FadeOut(oldToken),
      new M.FadeIn(newToken),
      new M.Indicate(nodes[child], { color: C.violet })
    ];
  }

  // ================================================================
  // 0 — INTRODUCE THE SMALL LENDER
  // ================================================================

  const lenderBg = rectAt(
    point(CX, -0.15),
    P ? 4.65 : 4.55,
    P ? 2.40 : 2.20,
    C.cyan,
    0.08
  );

  const lenderTitle = textAt(
    'SMALL LENDER',
    point(CX, 0.46),
    P ? 30 : 31,
    C.ink
  );

  const lenderSub = textAt(
    'Lends money to borrowers',
    point(CX, -0.12),
    P ? 20 : 19,
    C.muted
  );

  const lenderMoney = [];

  for (let j = 0; j < 5; j++) {
    const b = new M.Rectangle({
      width: 0.72,
      height: 0.15,
      color: C.cyan,
      strokeWidth: 1
    });

    b.setFill(C.cyan, 0.78);

    b.moveTo([
      CX + (j - 2) * 0.80,
      -0.77,
      0
    ]);

    lenderMoney.push(b);
  }

  const lender = new M.VGroup(
    lenderBg,
    lenderTitle,
    lenderSub,
    ...lenderMoney
  );

  await until(S(0));
  await play(
    new M.FadeIn(lender),
    ...say('A SMALL LENDER')
  );

  // ================================================================
  // 1 — EIGHT PEOPLE BORROW TEN UNITS EACH
  // ================================================================

  await until(S(1));

  allIds.forEach(id => {
    loanCards[id] = moneyCard(id);
  });

  await play(
    new M.FadeOut(lender),

    new M.LaggedStart(
      allIds.map(id => new M.FadeIn(loanCards[id])),
      { lagRatio: 0.10, runTime: 1.5 }
    ),

    ...say('8 BORROWERS · 10 UNITS EACH'),

    ...fbox([
      ['8 people borrowed money', C.muted],
      ['10 units each', C.cyan]
    ])
  );

  // ================================================================
  // 2 — FOUR PEOPLE REPAID EVERYTHING
  // ================================================================

  await until(S(2));
  await play(
    ...revealRepayment([1, 2, 3, 4]),

    ...say('4 FULL REPAYMENTS', FULL),

    ...fbox([
      ['Applications 1, 2, 3, 4', FULL],
      ['10 out of 10 repaid', C.ink]
    ], FULL)
  );

  // ================================================================
  // 3 — THE OTHER FOUR REPAID TWO UNITS EACH
  // ================================================================

  await until(S(3));
  await play(
    ...revealRepayment([5, 6, 7, 8]),

    ...say('4 PARTIAL REPAYMENTS', PART),

    ...fbox([
      ['Applications 5, 6, 7, 8', PART],
      ['2 out of 10 repaid', C.ink]
    ], PART)
  );

  // ================================================================
  // 4 — MONEY STACKS BECOME EIGHT APPLICATION CARDS
  // ================================================================

  await until(S(4));

  const introScale = P ? 2.35 : 2.15;

  allIds.forEach(id => {
    createCard(
      id,
      introPosition(id),
      introScale
    );
  });

  await play(
    new M.FadeOut(
      new M.VGroup(...Object.values(loanCards))
    ),

    new M.LaggedStart(
      allIds.map(id => new M.FadeIn(cards[id])),
      { lagRatio: 0.10, runTime: 1.4 }
    ),

    ...say('8 APPLICATION CARDS'),

    ...fbox([
      'One card per borrower',
      ['Original application numbers', C.cyan]
    ])
  );

  // ================================================================
  // 5 — TEAL CIRCLE WITH CHECK = FULL REPAYMENT
  // ================================================================

  await until(S(5));
  await play(
    flashCards([1, 2, 3, 4], FULL),

    ...say('✓ = FULL REPAYMENT', FULL),

    ...fbox([
      ['✓  Fully repaid', FULL],
      '10 units returned'
    ], FULL)
  );

  // ================================================================
  // 6 — ORANGE SQUARE WITH MINUS = PARTIAL REPAYMENT
  // ================================================================

  await until(S(6));
  await play(
    flashCards([5, 6, 7, 8], PART),

    ...say('− = PARTIAL REPAYMENT', PART),

    ...fbox([
      ['−  Partially repaid', PART],
      '2 units returned'
    ], PART)
  );

  // ================================================================
  // 7 — THESE CARDS ARE OUR DATA
  // ================================================================

  await until(S(7));

  allIds.forEach(id => {
    details.push(applicationDetails(id));
  });

  await play(
    new M.LaggedStart(
      details.map(d => new M.FadeIn(d)),
      { lagRatio: 0.06, runTime: 1.1 }
    ),

    ...say('DATA = RECORDED PAST EXPERIENCES'),

    ...fbox([
      'A: income · B: savings',
      'C: prior loan · D: reminders'
    ])
  );

  // ================================================================
  // 8 — A NEW BORROWER APPLIES
  // ================================================================

  await until(S(8));
  await play(
    new M.FadeIn(newBorrower),

    ...say('A NEW APPLICATION', C.violet),

    ...fbox([
      ['Past outcomes: known', C.muted],
      ['New outcome: unknown', C.violet]
    ], C.violet)
  );

  // ================================================================
  // 9 — CAN PAST EXPERIENCES HELP US GUESS?
  // ================================================================

  await until(S(9));
  await play(
    new M.Indicate(newBorrower, { color: C.violet }),

    ...say('WILL THIS BORROWER FULLY REPAY?', C.amber),

    ...fbox([
      ['Past data', C.cyan],
      ['↓', C.muted],
      ['New repayment: ?', C.violet]
    ], C.violet)
  );

  // ================================================================
  // 10 — DEFINE PREDICTION
  // ================================================================

  await until(S(10));
  await play(
    ...say('A GUESS = A PREDICTION', C.violet),

    ...fbox([
      ['Prediction', C.violet],
      'A guess about an unknown outcome'
    ], C.violet)
  );

  // ================================================================
  // 11 — SORT THE CARDS INTO ONE STARTING PILE
  // ================================================================

  await until(S(11));
  await play(
    new M.FadeOut(newBorrower),

    ...details.map(d => new M.FadeOut(d)),

    new M.LaggedStart(
      moveCards(allIds, 'root', 0.08),
      { lagRatio: 0.07, runTime: 1.7 }
    ),

    ...nodeLabel('root', 'All 8 applications', C.cyan),

    ...say('ONE QUESTION AT A TIME'),

    ...fbox([
      'Begin with one group',
      ['8 applications', C.cyan]
    ])
  );

  // ================================================================
  // 12 — FOUR FULL AND FOUR PARTIAL REPAYMENTS
  // ================================================================

  await until(S(12));
  await play(
    flashCards(allIds, C.cyan),

    ...say('ONE PILE: 4 FULL, 4 PARTIAL'),

    ...fbox([
      ['4 fully repaid  ✓', FULL],
      ['4 partially repaid  −', PART]
    ])
  );

  // ================================================================
  // 13 — TIES PREDICT NO
  // ================================================================

  await until(S(13));
  await play(
    ...predictNode('root', allIds),

    ...say('WHEN TIED, PREDICT NO', C.amber),

    ...fbox([
      '4 Yes = 4 No',
      ['Tie → predict No', PART]
    ], C.amber)
  );

  // ================================================================
  // 14 — FOUR HISTORICAL MISTAKES
  // ================================================================

  await until(S(14));
  await play(
    ...recordMistakes([allIds]),

    ...say('4 WRONG PREDICTIONS OUT OF 8', C.amber)
  );

  // ================================================================
  // 15 — CAN A QUESTION REDUCE THE MISTAKES?
  // ================================================================

  await until(S(15));
  await play(
    flashCards(mistakes(allIds), C.amber),

    ...say('CAN WE MAKE FEWER MISTAKES?', C.amber),

    ...fbox([
      ['Before asking questions', C.muted],
      ['4 mistakes', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 16 — ASK QUESTION A: STEADY INCOME?
  // ================================================================

  await until(S(16));
  await play(
    ...clearMistakes(),

    ...question('root', 'A: Steady income?'),

    ...say('DOES THE BORROWER HAVE STEADY INCOME?'),

    ...fbox([
      ['Question A', C.cyan],
      'Does the borrower have steady income?'
    ])
  );

  // ================================================================
  // 17 — MOVE YES AND NO CARDS DOWN SEPARATE BRANCHES
  // ================================================================

  await until(S(17));
  await play(
    ...branch('root', 'ay', true),
    ...branch('root', 'an', false),

    ...nodeLabel('ay', '4 applications', C.muted),
    ...nodeLabel('an', '4 applications', C.muted),

    new M.LaggedStart(
      [
        ...moveCards(AY, 'ay', -0.10),
        ...moveCards(AN, 'an', 0.10)
      ],
      { lagRatio: 0.07, runTime: 1.8 }
    ),

    ...say('YES TO ONE SIDE · NO TO THE OTHER'),

    ...fbox([
      ['Yes: steady income', FULL],
      ['No: no steady income', PART]
    ])
  );

  // ================================================================
  // 18 — DEFINE A SPLIT
  // ================================================================

  await until(S(18));
  await play(
    new M.Indicate(nodes.root, { color: C.cyan }),

    ...say('DIVIDING A GROUP = A SPLIT'),

    ...fbox([
      ['Split', C.cyan],
      'One group becomes smaller groups'
    ])
  );

  // ================================================================
  // 19 — STEADY-INCOME APPLICATIONS 2, 3, 4, 5
  // ================================================================

  await until(S(19));
  await play(
    flashCards(AY, FULL),

    ...say('STEADY INCOME: 2, 3, 4, 5', FULL),

    ...fbox([
      ['A = Yes', FULL],
      'Applications 2, 3, 4, 5'
    ], FULL)
  );

  // ================================================================
  // 20 — THREE FULL REPAYMENTS, ONE PARTIAL
  // ================================================================

  await until(S(20));
  await play(
    flashCards([2, 3, 4], FULL),

    ...say('3 FULL REPAYMENTS · 1 PARTIAL', FULL),

    ...fbox([
      ['3 fully repaid  ✓', FULL],
      ['1 partially repaid  −', PART]
    ], FULL)
  );

  // ================================================================
  // 21 — PREDICT YES FOR THE STEADY-INCOME GROUP
  // ================================================================

  await until(S(21));
  await play(
    ...predictNode('ay', AY),

    ...say('MOST REPAID EVERYTHING: PREDICT YES', FULL),

    ...fbox([
      ['3 Yes > 1 No', FULL],
      ['Prediction = Yes', FULL]
    ], FULL)
  );

  // ================================================================
  // 22 — NO-STEADY-INCOME APPLICATIONS 1, 6, 7, 8
  // ================================================================

  await until(S(22));
  await play(
    flashCards(AN, PART),

    ...say('NO STEADY INCOME: 1, 6, 7, 8', PART),

    ...fbox([
      ['A = No', PART],
      'Applications 1, 6, 7, 8'
    ], PART)
  );

  // ================================================================
  // 23 — PREDICT NO FOR THE OTHER GROUP
  // ================================================================

  await until(S(23));
  await play(
    ...predictNode('an', AN),

    flashCards([6, 7, 8], PART),

    ...say('MOST REPAID ONLY PART: PREDICT NO', PART),

    ...fbox([
      ['1 fully repaid  ✓', FULL],
      ['3 partially repaid  −', PART],
      ['Prediction = No', PART]
    ], PART)
  );

  // ================================================================
  // 24 — TWO MISTAKES INSTEAD OF FOUR
  // Applications 1 and 5 are incorrect.
  // ================================================================

  await until(S(24));
  await play(
    ...recordMistakes([AY, AN]),

    ...say('MISTAKES FALL: 4 → 2', C.amber)
  );

  // ================================================================
  // 25 — DEFINE A BRANCH
  // ================================================================

  await until(S(25));
  await play(
    new M.Indicate(
      edges['root:ay'].edge,
      { color: FULL }
    ),

    new M.Indicate(
      edges['root:an'].edge,
      { color: PART }
    ),

    ...say('EACH PATH IS A BRANCH'),

    ...fbox([
      ['Branch', C.cyan],
      'A path leading away from a question'
    ])
  );

  // ================================================================
  // 26 — ASK ABOUT SAVINGS WITHIN A = YES
  // ================================================================

  await until(S(26));
  await play(
    ...clearMistakes(),

    ...question('ay', 'B: Savings?'),

    new M.Indicate(nodes.root, { color: C.cyan }),

    ...say('NEXT QUESTION: DOES THE BORROWER HAVE SAVINGS?'),

    ...fbox([
      ['Only the steady-income group', FULL],
      ['Question B: Savings?', C.cyan]
    ])
  );

  // ================================================================
  // 27 — APPLICATIONS 3 AND 4 HAVE SAVINGS
  // Both fully repaid.
  // ================================================================

  await until(S(27));
  await play(
    ...branch('ay', 'ayby', true),

    ...predictNode('ayby', AYBY, true),

    new M.LaggedStart(
      moveCards(AYBY, 'ayby', -0.12),
      { lagRatio: 0.12, runTime: 1.2 }
    ),

    ...say('3 AND 4: BOTH FULLY REPAID', FULL),

    ...fbox([
      ['Savings = Yes: 3, 4', FULL],
      ['2 Yes → predict Yes', FULL]
    ], FULL)
  );

  // ================================================================
  // 28 — APPLICATIONS 2 AND 5 HAVE NO SAVINGS
  // One full and one partial repayment.
  // ================================================================

  await until(S(28));
  await play(
    ...branch('ay', 'aybn', false),

    ...predictNode('aybn', AYBN),

    new M.LaggedStart(
      moveCards(AYBN, 'aybn', 0.12),
      { lagRatio: 0.12, runTime: 1.2 }
    ),

    ...say('2 AND 5: DIFFERENT OUTCOMES', C.amber),

    ...fbox([
      ['Savings = No: 2, 5', C.cyan],
      ['1 Yes = 1 No', C.amber],
      ['Tie → predict No', PART]
    ], C.amber)
  );

  // ================================================================
  // 29 — STILL TWO MISTAKES
  // Applications 1 and 2 are incorrect.
  // ================================================================

  await until(S(29));
  await play(
    ...recordMistakes([AYBY, AYBN, AN]),

    ...say('STILL 2 MISTAKES OUT OF 8', C.amber)
  );

  // ================================================================
  // 30 — ASK ABOUT PREVIOUS REPAYMENT
  // Only applications 2 and 5 are being divided.
  // ================================================================

  await until(S(30));
  await play(
    ...clearMistakes(),

    ...question('aybn', 'C: Repaid before?'),

    flashCards(AYBN, C.cyan),

    ...say('DID THEY REPAY A PREVIOUS LOAN?'),

    ...fbox([
      'Applications 2 and 5',
      ['Question C: Previous repayment?', C.cyan]
    ])
  );

  // ================================================================
  // 31 — APPLICATION 2 ANSWERS YES
  // ================================================================

  await until(S(31));
  await play(
    ...branch('aybn', 'aybncy', true),

    ...predictNode('aybncy', AYBNCY, true),

    ...moveCards(AYBNCY, 'aybncy', -0.12),

    ...say('APPLICATION 2 → PREDICT YES', FULL),

    ...fbox([
      ['2: previous loan repaid', FULL],
      ['Prediction = Yes', FULL]
    ], FULL)
  );

  // ================================================================
  // 32 — APPLICATION 5 ANSWERS NO
  // ================================================================

  await until(S(32));
  await play(
    ...branch('aybn', 'aybncn', false),

    ...predictNode('aybncn', AYBNCN, true),

    ...moveCards(AYBNCN, 'aybncn', 0.12),

    ...say('APPLICATION 5 → PREDICT NO', PART),

    ...fbox([
      ['5: previous loan not repaid', PART],
      ['Prediction = No', PART]
    ], PART)
  );

  // ================================================================
  // 33 — ONLY ONE MISTAKE REMAINS
  // Application 1 is incorrect.
  // ================================================================

  await until(S(33));
  await play(
    ...recordMistakes([
      AYBY,
      AYBNCY,
      AYBNCN,
      AN
    ]),

    ...say('ONLY 1 MISTAKE REMAINS', C.amber)
  );

  // ================================================================
  // 34 — RETURN TO THE NO-STEADY-INCOME GROUP
  // Ask question B: savings?
  // ================================================================

  await until(S(34));
  await play(
    ...clearMistakes(),

    ...question('an', 'B: Savings?'),

    flashCards(AN, C.cyan),

    ...say('RETURN TO THE OTHER BRANCH'),

    ...fbox([
      ['A = No', PART],
      ['Question B: Savings?', C.cyan]
    ])
  );

  // ================================================================
  // 35 — APPLICATIONS 7 AND 8 HAVE NO SAVINGS
  // Neither fully repaid.
  // ================================================================

  await until(S(35));
  await play(
    ...branch('an', 'anbn', false),

    ...predictNode('anbn', ANBN, true),

    new M.LaggedStart(
      moveCards(ANBN, 'anbn', 0.12),
      { lagRatio: 0.10, runTime: 1.2 }
    ),

    ...say('7 AND 8: BOTH PARTIALLY REPAID', PART),

    ...fbox([
      ['Savings = No: 7, 8', PART],
      ['2 No → predict No', PART]
    ], PART)
  );

  // ================================================================
  // 36 — APPLICATIONS 1 AND 6 HAVE SAVINGS
  // Their outcomes are different; the tie predicts No.
  // One historical mistake remains.
  // ================================================================

  await until(S(36));

  const rightMixedMoves = moveCards(ANBY, 'anby', -0.12);

  const remainingGroups = [
    AYBY,
    AYBNCY,
    AYBNCN,
    ANBY,
    ANBN
  ];

  const remainingWrong = remainingGroups.flatMap(
    ids => mistakes(ids)
  );

  history.push(remainingWrong.length);

  await play(
    ...branch('an', 'anby', true),

    ...predictNode('anby', ANBY),

    new M.LaggedStart(
      rightMixedMoves,
      { lagRatio: 0.12, runTime: 1.2 }
    ),

    ...markMistakes(remainingWrong),

    ...say('1 AND 6: DIFFERENT OUTCOMES', C.amber),

    ...fbox([
      ['Savings = Yes: 1, 6', C.cyan],
      ['1 Yes = 1 No → predict No', PART],
      ['Still 1 mistake', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 37 — PREVIOUS REPAYMENT SEPARATES 1 AND 6
  // Application 1 answers Yes.
  // Application 6 answers No.
  // ================================================================

  await until(S(37));
  await play(
    ...clearMistakes(),

    ...question('anby', 'C: Repaid before?'),

    ...branch('anby', 'anbycy', true),
    ...branch('anby', 'anbycn', false),

    ...predictNode('anbycy', ANBYCY, true),
    ...predictNode('anbycn', ANBYCN, true),

    new M.LaggedStart(
      [
        ...moveCards(ANBYCY, 'anbycy', -0.10),
        ...moveCards(ANBYCN, 'anbycn', 0.10)
      ],
      { lagRatio: 0.15, runTime: 1.4 }
    ),

    ...say('PREVIOUS REPAYMENT SEPARATES 1 AND 6'),

    ...fbox([
      ['1: Yes → predict Yes', FULL],
      ['6: No → predict No', PART]
    ])
  );

  // ================================================================
  // 38 — ALL FINAL GROUPS CONTAIN ONE OUTCOME
  // Zero mistakes across the eight historical applications.
  // ================================================================

  await until(S(38));
  await play(
    ...recordMistakes(LEAVES.map(leaf => leaf.ids)),

    new M.LaggedStart(
      LEAVES.map(leaf =>
        new M.Indicate(
          nodes[leaf.key],
          {
            color: prediction(leaf.ids) ? FULL : PART
          }
        )
      ),
      { lagRatio: 0.12, runTime: 1.7 }
    ),

    ...say('EVERY FINAL GROUP HAS ONE OUTCOME', C.green)
  );

  // ================================================================
  // 39 — WATCH THE MISTAKE COUNT FALL
  //
  // Expected history: 4, 2, 2, 1, 1, 0.
  // Draw a compact descending history chart in the explanation box.
  // ================================================================

  function mistakeChart(values) {
    const p = P ? point(0, -6.05) : BOXP;

    const w = P ? 6.6 : 3.90;
    const h = P ? 1.65 : 2.35;

    const bg = rectAt(p, w, h, C.amber, 0.06);
    bg.setFill(C.card, 0.96);

    const title = textAt(
      'Historical mistakes',
      point(
        p[0],
        p[1] + h / 2 - (P ? 0.22 : 0.24)
      ),
      P ? 16 : 18,
      C.muted
    );

    const left = p[0] - w / 2 + 0.42;
    const right = p[0] + w / 2 - 0.42;

    const bottom = p[1] - h / 2 + (P ? 0.22 : 0.32);
    const top = p[1] + h / 2 - (P ? 0.70 : 0.65);

    const gx = i =>
      left + i * (right - left) / (values.length - 1);

    const gy = v =>
      bottom + v / 4 * (top - bottom);

    const base = lineAt(
      point(left, bottom),
      point(right, bottom),
      C.muted,
      1
    );

    const segments = [];

    for (let i = 1; i < values.length; i++) {
      segments.push(
        lineAt(
          point(gx(i - 1), gy(values[i - 1])),
          point(gx(i), gy(values[i])),
          C.amber,
          2.5
        )
      );
    }

    const dots = [];
    const labels = [];

    values.forEach((v, i) => {
      const color =
        i === values.length - 1 ? C.green : C.amber;

      const dot = new M.Dot({
        point: point(gx(i), gy(v)),
        radius: 0.075,
        color
      });

      const lab = textAt(
        String(v),
        point(
          gx(i) + (P ? 0.2 : 0),
          gy(v) + (P ? 0.2 : 0.19)
        ),
        P ? 18 : 16,
        color,
        true
      );

      dots.push(dot);
      labels.push(lab);
    });

    const shell = new M.VGroup(bg, title, base);
    const g = new M.VGroup(
      shell,
      ...segments,
      ...dots,
      ...labels
    );

    // Return one off-screen group, animated as a single object.
    return g;
  }

  await until(S(39));

  const historyChart = mistakeChart(history);
  const oldBox39 = boxNow;

  boxNow = historyChart;

  await play(
    new M.FadeOut(oldBox39),
    new M.FadeIn(historyChart),

    ...say('4 → 2 → 2 → 1 → 1 → 0', C.green)
  );

  // ================================================================
  // 40 — NAME THE COMPLETED DECISION TREE
  // ================================================================

  await until(S(40));
  await play(
    new M.Indicate(nodes.root, { color: C.cyan }),

    new M.LaggedStart(
      Object.values(edges).map(e =>
        new M.Indicate(e.edge, { color: C.cyan })
      ),
      { lagRatio: 0.05, runTime: 1.2 }
    ),

    ...say('THIS IS A DECISION TREE'),

    ...fbox([
      ['Decision tree', C.cyan],
      'Questions divide the examples'
    ])
  );

  // ================================================================
  // 41 — DEFINE LEAVES
  //
  // Draw outlines from coordinates rather than wrapping
  // already-visible nodes and cards in a SurroundingRectangle.
  // ================================================================

  const leafBoxes = [];

  function leafOutline(key, color) {
    const p = N[key];

    const h = P ? 1.25 : 0.79;
    const w = P ? 1.60 : 1.62;

    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.09,
      color,
      strokeWidth: 1.5
    });

    r.setFill(color, 0.015);

    r.moveTo([
      p[0],
      p[1] - (P ? 0.33 : 0.22),
      0
    ]);

    return r;
  }

  await until(S(41));

  LEAVES.forEach(leaf => {
    leafBoxes.push(
      leafOutline(
        leaf.key,
        prediction(leaf.ids) ? FULL : PART
      )
    );
  });

  await play(
    new M.LaggedStart(
      leafBoxes.map(r => new M.Create(r)),
      { lagRatio: 0.12, runTime: 1.5 }
    ),

    ...say('A FINAL GROUP IS CALLED A LEAF', C.green),

    ...fbox([
      ['Leaf', C.green],
      'A group with no more questions'
    ], C.green)
  );

  // ================================================================
  // 42 — SIX LEAVES, EACH WITH A PREDICTION
  // ================================================================

  await until(S(42));
  await play(
    new M.LaggedStart(
      leafBoxes.map(r =>
        new M.Indicate(r, { color: C.green })
      ),
      { lagRatio: 0.12, runTime: 1.5 }
    ),

    ...say('6 LEAVES · 6 FINAL GROUPS', C.green),

    ...fbox([
      ['6 leaves', C.green],
      'Each holds a repayment prediction'
    ], C.green)
  );

  // ================================================================
  // 43 — INTRODUCE THE NEW BORROWER'S THREE ANSWERS
  //
  // Steady income = Yes
  // Savings = No
  // Previous loan repaid = Yes
  // ================================================================

  const applicationPanel = [
    [`Steady income: ${yn(NEW.A)}`, FULL],
    [`Savings: ${yn(NEW.B)}`, PART],
    [`Previous loan repaid: ${yn(NEW.C)}`, FULL]
  ];

  await until(S(43));
  await play(
    ...say('A NEW BORROWER ARRIVES', C.violet),

    ...fbox(applicationPanel, C.violet)
  );

  // ================================================================
  // 44 — START AT THE ROOT OF THE TREE
  // ================================================================

  await until(S(44));

  newToken = tokenAt('root');

  await play(
    new M.FadeIn(newToken),

    new M.Indicate(
      nodes.root,
      { color: C.violet }
    ),

    ...say('START AT THE TOP OF THE TREE', C.violet),

    ...fbox([
      ['Question 1 of 3', C.violet],
      'Steady income?'
    ], C.violet)
  );

  // ================================================================
  // 45 — STEADY INCOME: YES
  // Follow the Yes branch to the savings question.
  // ================================================================

  await until(S(45));
  await play(
    ...followBranch('root', 'ay'),

    ...say('STEADY INCOME? YES', FULL),

    ...fbox([
      ['A = Yes', FULL],
      ['Follow the Yes branch', C.violet]
    ], C.violet)
  );

  // ================================================================
  // 46 — SAVINGS: NO
  // Follow the No branch to previous repayment.
  // ================================================================

  await until(S(46));
  await play(
    ...followBranch('ay', 'aybn'),

    ...say('SAVINGS? NO', PART),

    ...fbox([
      ['B = No', PART],
      ['Follow the No branch', C.violet]
    ], C.violet)
  );

  // ================================================================
  // 47 — PREVIOUS LOAN REPAID: YES
  // Follow the Yes branch to the leaf containing application 2.
  // ================================================================

  await until(S(47));
  await play(
    ...followBranch('aybn', 'aybncy'),

    ...say('PREVIOUS LOAN REPAID? YES', FULL),

    ...fbox([
      ['C = Yes', FULL],
      ['Follow the Yes branch', C.violet]
    ], C.violet)
  );

  // ================================================================
  // 48 — REACH A LEAF PREDICTING FULL REPAYMENT
  // ================================================================

  await until(S(48));

  const reachedLeaf = LEAVES.findIndex(
    leaf => leaf.key === 'aybncy'
  );

  await play(
    new M.Indicate(
      leafBoxes[reachedLeaf],
      { color: C.green }
    ),

    new M.Indicate(
      nodes.aybncy,
      { color: FULL }
    ),

    ...say('PREDICTION: FULL REPAYMENT', FULL),

    ...fbox([
      ['3 questions answered', C.violet],
      ['Prediction = Yes', FULL]
    ], FULL)
  );

  // ================================================================
  // 49 — THE PREDICTION RULE IN WORDS
  // ================================================================

  await until(S(49));
  await play(
    ...say('FOLLOW THE ANSWERS, THEN USE THE LEAF'),

    ...fbox([
      ['Prediction rule', C.cyan],
      'Follow the answers',
      ['Use the most common leaf outcome', FULL]
    ])
  );

  // ================================================================
  // 50 — PREDICTIONS THROUGH SMALL QUESTIONS
  // ================================================================

  await until(S(50));
  await play(
    new M.LaggedStart(
      activePath.map(edge =>
        new M.Indicate(edge, { color: C.violet })
      ),
      { lagRatio: 0.15, runTime: 1.5 }
    ),

    ...say('SMALL QUESTIONS → ONE PREDICTION', C.green),

    ...fbox([
      'Income → Savings → Previous loan',
      ['Three answers → one prediction', C.green]
    ], C.green)
  );

  // ================================================================
  // 51 — PERFECT HISTORICAL PREDICTIONS DO NOT GUARANTEE
  // PERFECT PREDICTIONS FOR NEW BORROWERS
  // ================================================================

  const caution = pill(
    'NEW OUTCOME STILL UNKNOWN',
    C.amber,
    P ? 15 : 15
  );

  const cautionPos = P
    ? point(0, -6.10)
    : point(4.3, -2.05);

  const cautionMax = P ? FW - 1.2 : 3.95;

  if (caution.getWidth() > cautionMax) {
    caution.scale(cautionMax / caution.getWidth());
  }

  caution.moveTo(cautionPos);

  await until(S(51));
  await play(
    new M.FadeIn(caution),

    ...say('A PREDICTION IS NOT A GUARANTEE', C.amber),

    ...fbox([
      ['Past applications: 8 / 8 correct', C.green],
      ['New applications: not guaranteed', C.amber]
    ], C.amber)
  );

  // ================================================================
  // 52 — PREVIEW HOW TO CHOOSE GOOD QUESTIONS
  // ================================================================

  await until(S(52));
  await play(
    new M.FadeOut(caution),

    new M.FadeOut(newToken),

    ...activePath.map(edge => new M.FadeOut(edge)),

    new M.LaggedStart(
      [
        nodes.root,
        nodes.ay,
        nodes.aybn,
        nodes.an,
        nodes.anby
      ].map(node =>
        new M.Indicate(node, { color: C.amber })
      ),
      { lagRatio: 0.10, runTime: 1.7 }
    ),

    ...say('NEXT: HOW DO WE CHOOSE GOOD QUESTIONS?', C.amber),

    ...fbox([
      ['Good questions', C.amber],
      'Separate different outcomes well'
    ], C.amber)
  );

  // ================================================================
  // 53 — FINAL TAKEAWAY
  // Preserve the completed tree and all eight numbered cards.
  // ================================================================

  await until(S(53));
  await play(
    new M.LaggedStart(
      LEAVES.map(leaf =>
        new M.Indicate(
          nodes[leaf.key],
          {
            color: prediction(leaf.ids) ? FULL : PART
          }
        )
      ),
      { lagRatio: 0.12, runTime: 2.0 }
    ),

    ...say('DECISION TREE: DIVIDE, THEN PREDICT', C.green),

    ...fbox([
      ['1. Divide past examples', C.cyan],
      ['2. Follow the new answers', C.violet],
      ['3. Predict using the final group', C.green]
    ], C.green)
  );
}
