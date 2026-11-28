// lesson 7.3.6
// McNemar's test.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C,
    S, E, T, pill, show, showA, until, play
  } = L;

  // ------------------------------------------------------------
  // SHARED CHAPTER DATA
  // ------------------------------------------------------------

  const OLD = C.amber;
  const NEW = C.cyan;
  const YES = C.green;
  const NO = C.muted;

  const BOTH = 20;
  const NEITHER = 15;
  const OLD_ONLY = 3;
  const NEW_ONLY = 12;

  const TOTAL =
    BOTH + NEITHER + OLD_ONLY + NEW_ONLY;

  const OLD_RESOLVED = BOTH + OLD_ONLY;
  const NEW_RESOLVED = BOTH + NEW_ONLY;

  const CONCORDANT = BOTH + NEITHER;
  const DISCORDANT = OLD_ONLY + NEW_ONLY;

  const EXPECTED = DISCORDANT / 2;

  const B = OLD_ONLY;
  const CC = NEW_ONLY;

  const DIFF = CC - B;
  const SQUARED = DIFF * DIFF;

  const CHI = SQUARED / DISCORDANT;

  const DF = 1;
  const CUTOFF = 3.841458820694124;

  // Uncorrected McNemar chi-square approximation.
  // For df = 1:
  // P(ChiSquare >= x) = erfc(sqrt(x / 2)).

  function erf(x) {
    const sign = x < 0 ? -1 : 1;

    x = Math.abs(x);

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1 / (1 + p * x);

    const y = 1 -
      (((((a5 * t + a4) * t) + a3) * t + a2)
        * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  const PV = 1 - erf(Math.sqrt(CHI / 2));

  // TOTAL = 50
  // OLD_RESOLVED = 23
  // NEW_RESOLVED = 32
  // DISCORDANT = 15
  // EXPECTED = 7.5 each way
  // CHI = 81 / 15 = 5.4
  // DF = 1
  // PV ≈ 0.02014

  // ------------------------------------------------------------
  // RESPONSIVE LAYOUT
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 3.85, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 2.55, 0]
    : [4.3, -0.3, 0];

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  // ------------------------------------------------------------
  // DRAWING HELPERS
  // ------------------------------------------------------------

  function text(
    s, x, y,
    size = 20,
    color = C.ink,
    mono = false,
    maxw = null
  ) {
    const t = T(String(s), size, color, mono);

    if (maxw && t.getWidth() > maxw) {
      t.scale(maxw / t.getWidth());
    }

    t.moveTo([x, y, 0]);

    return t;
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
    opacity = 0,
    sw = 2,
    radius = 0.08
  ) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: Math.min(
        radius,
        w * 0.25,
        h * 0.25
      ),
      color,
      strokeWidth: sw
    });

    r.setFill(color, opacity);
    r.moveTo([x, y, 0]);

    return r;
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

  function dot(x, y, color, radius = 0.09) {
    return new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });
  }

  const G = (...items) =>
    new M.VGroup(
      ...items.flat(Infinity).filter(Boolean)
    );

  // ------------------------------------------------------------
  // SCENE MANAGEMENT
  // Only newly created objects are grouped together.
  // Existing objects are grouped only for removal.
  // ------------------------------------------------------------

  let picture = null;
  let boxNow = null;

  function scene(next, runTime = 0.55) {
    const a = [];

    if (picture) {
      a.push(
        new M.FadeOut(
          picture,
          { runTime }
        )
      );
    }

    if (next) {
      a.push(
        new M.FadeIn(
          next,
          { runTime }
        )
      );
    }

    picture = next;

    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [
      new M.FadeOut(
        old,
        { runTime: 0.35 }
      )
    ];
  }

  // ------------------------------------------------------------
  // FORMULA BOX
  // lines = ['text' | ['text', color]]
  // Leading spaces indent.
  // ------------------------------------------------------------

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.40 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true)
        .getWidth() / 10;

    const indents = rows.map(([s]) =>
      cw * (s.length - s.trimStart().length)
    );

    const widths = texts.map((t, i) =>
      t.getWidth() + indents[i]
    );

    const wd = Math.max(...widths) + 0.70;
    const ht = rows.length * lh + 0.36;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.16,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left =
      BOXP[0] - wd / 2 + 0.35;

    const top =
      BOXP[1] + ht / 2 - 0.18 - lh / 2;

    texts.forEach((t, i) => {
      t.moveTo([
        left + indents[i] + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = G(r, texts);

    const maxw = P ? FW - 1.0 : 4.9;
    const maxh = P ? 1.9 : 3.4;

    const factor = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (factor < 1) {
      g.scale(factor);
    }

    g.moveTo(BOXP);

    const a = [
      new M.FadeIn(
        g,
        { runTime: 0.40 }
      )
    ];

    if (boxNow) {
      a.push(
        new M.FadeOut(
          boxNow,
          { runTime: 0.35 }
        )
      );
    }

    boxNow = g;

    return a;
  }

  // ------------------------------------------------------------
  // RESOLUTION MARKS
  // Green tick = resolved.
  // Grey cross = not resolved.
  // A short dash = outcome not yet shown.
  // ------------------------------------------------------------

  function mark(
    x, y,
    resolved,
    size = 0.15,
    neutralColor = C.muted
  ) {
    if (resolved === true) {
      return G(
        line(
          x - size,
          y,
          x - size * 0.32,
          y - size * 0.72,
          YES,
          2.4
        ),

        line(
          x - size * 0.32,
          y - size * 0.72,
          x + size,
          y + size * 0.82,
          YES,
          2.4
        )
      );
    }

    if (resolved === false) {
      return G(
        line(
          x - size * 0.80,
          y - size * 0.80,
          x + size * 0.80,
          y + size * 0.80,
          NO,
          2
        ),

        line(
          x - size * 0.80,
          y + size * 0.80,
          x + size * 0.80,
          y - size * 0.80,
          NO,
          2
        )
      );
    }

    return G(
      line(
        x - size * 0.80,
        y,
        x,
        y,
        neutralColor,
        1.4
      ),

      line(
        x,
        y,
        x + size * 0.80,
        y,
        neutralColor,
        1.4
      )
    );
  }

  // ------------------------------------------------------------
  // SINGLE-SCRIPT TICKET
  // Used to recall the previous independent-group design.
  // ------------------------------------------------------------

  function singleTicket(
    x, y,
    script,
    resolved = null,
    w = 0.76,
    h = 0.54
  ) {
    const color =
      script === 'old' ? OLD : NEW;

    return G(
      rounded(
        x,
        y,
        w + 0.10,
        h + 0.10,
        color,
        0.08,
        0
      ),

      rounded(
        x,
        y,
        w,
        h,
        color,
        0.14,
        1.8
      ),

      mark(
        x,
        y,
        resolved,
        Math.min(w, h) * 0.25,
        color
      )
    );
  }

  // ------------------------------------------------------------
  // MATCHED TICKET CARD
  // One outer card = one practice ticket.
  // Left half = old script.
  // Right half = new script.
  //
  // The two outcomes remain attached to the same ticket.
  // ------------------------------------------------------------

  function pairedTicket(
    x, y,
    oldResolved = null,
    newResolved = null,
    w = 1.02,
    h = 0.58,
    active = true,
    id = null
  ) {
    const leftX = x - w * 0.25;
    const rightX = x + w * 0.25;

    const discordant =
      oldResolved !== null &&
      newResolved !== null &&
      oldResolved !== newResolved;

    const edge =
      !active
        ? C.muted
        : discordant
          ? oldResolved ? OLD : NEW
          : C.violet;

    const a = [];

    a.push(
      rounded(
        x,
        y,
        w + 0.075,
        h + 0.075,
        edge,
        active ? 0.07 : 0.01,
        0
      ),

      rounded(
        x,
        y,
        w,
        h,
        edge,
        active ? 0.035 : 0.015,
        active ? 1.5 : 0.7
      ),

      rect(
        leftX,
        y,
        w / 2 - 0.045,
        h - 0.045,
        OLD,
        active ? 0.17 : 0.045,
        0.8
      ),

      rect(
        rightX,
        y,
        w / 2 - 0.045,
        h - 0.045,
        NEW,
        active ? 0.17 : 0.045,
        0.8
      ),

      line(
        x,
        y - h * 0.43,
        x,
        y + h * 0.43,
        C.muted,
        0.8
      ),

      mark(
        leftX,
        y,
        oldResolved,
        Math.min(w * 0.15, h * 0.23),
        OLD
      ),

      mark(
        rightX,
        y,
        newResolved,
        Math.min(w * 0.15, h * 0.23),
        NEW
      )
    );

    if (id !== null) {
      a.push(
        text(
          id,
          x,
          y - h / 2 - 0.13,
          12,
          C.muted,
          true,
          w
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // FIXED TICKET RECORDS
  // Every ticket has its own identity and two binary outcomes.
  // ------------------------------------------------------------

  const TYPES = [
    {
      key: 'both',
      label: 'Both resolved',
      n: BOTH,
      old: true,
      new: true,
      color: YES
    },

    {
      key: 'neither',
      label: 'Neither resolved',
      n: NEITHER,
      old: false,
      new: false,
      color: NO
    },

    {
      key: 'old',
      label: 'Only old resolved',
      n: OLD_ONLY,
      old: true,
      new: false,
      color: OLD
    },

    {
      key: 'new',
      label: 'Only new resolved',
      n: NEW_ONLY,
      old: false,
      new: true,
      color: NEW
    }
  ];

  const DATA = [];

  TYPES.forEach((type, typeIndex) => {
    for (let j = 0; j < type.n; j++) {
      DATA.push({
        id: DATA.length + 1,
        type: type.key,
        typeIndex,
        within: j,
        old: type.old,
        new: type.new
      });
    }
  });

  // ------------------------------------------------------------
  // PREVIOUS DESIGN: SEPARATE GROUPS
  // Illustrative ticket cards, not additional trial observations.
  // ------------------------------------------------------------

  function separateGroups() {
    const a = [];

    const ys = [
      P ? 0.25 : 0.40,
      P ? -1.75 : -1.30
    ];

    ['old', 'new'].forEach((script, r) => {
      const color =
        script === 'old' ? OLD : NEW;

      const y = ys[r];

      a.push(
        rounded(
          CX,
          y,
          5.95,
          1.0,
          color,
          0.035
        ),

        text(
          script === 'old'
            ? 'Old-script tickets'
            : 'New-script tickets',
          CX,
          y + 0.79,
          21,
          color
        )
      );

      for (let j = 0; j < 5; j++) {
        a.push(
          singleTicket(
            CX + (j - 2) * 1.03,
            y,
            script,
            null,
            0.77,
            0.52
          )
        );
      }
    });

    a.push(
      text(
        'Different tickets in each group',
        CX,
        P ? -3.0 : -2.30,
        20,
        C.muted
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // FIFTY PRACTICE TICKETS
  // Five columns of ten matched records on phone.
  // Ten columns of five matched records on laptop.
  // ------------------------------------------------------------

  const GRID_COLS = P ? 5 : 10;
  const GRID_ROWS = TOTAL / GRID_COLS;

  const GRID_DX = P ? 1.28 : 0.63;
  const GRID_DY = P ? 0.48 : 0.46;

  const GRID_TOP = P ? 0.7 : 0.80;

  const GRID_W = P ? 1.10 : 0.53;
  const GRID_H = P ? 0.36 : 0.34;

  function gridSlot(i) {
    return [
      CX +
        (i % GRID_COLS -
          (GRID_COLS - 1) / 2) * GRID_DX,

      GRID_TOP -
        Math.floor(i / GRID_COLS) * GRID_DY,

      0
    ];
  }

  function gridCard(
    record,
    index,
    reveal = false
  ) {
    const p = gridSlot(index);

    return pairedTicket(
      p[0],
      p[1],
      reveal ? record.old : null,
      reveal ? record.new : null,
      GRID_W,
      GRID_H
    );
  }

  function gridHeading() {
    const a = [];

    a.push(
      text(
        '50 practice tickets',
        CX,
        GRID_TOP + 0.60,
        21,
        C.ink
      ),

      text(
        'OLD  |  NEW',
        CX,
        GRID_TOP -
          (GRID_ROWS - 1) * GRID_DY - 0.49,
        17,
        C.muted,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // ONE TICKET, TWO ANSWERS
  // A large explanatory card before returning to the full grid.
  // ------------------------------------------------------------

  function matchedExample() {
    const a = [];

    const y = P ? -0.25 : -0.20;

    const w = P ? 4.80 : 4.60;
    const h = P ? 1.75 : 1.50;

    a.push(
      text(
        'Same practice ticket',
        CX,
        y + h / 2 + 0.75,
        23,
        C.violet
      ),

      pairedTicket(
        CX,
        y,
        false,
        true,
        w,
        h
      ),

      text(
        'Old script',
        CX - w / 4,
        y + h / 2 + 0.25,
        20,
        OLD
      ),

      text(
        'New script',
        CX + w / 4,
        y + h / 2 + 0.25,
        20,
        NEW
      ),

      text(
        'Not resolved',
        CX - w / 4,
        y - h / 2 - 0.38,
        19,
        NO
      ),

      text(
        'Resolved',
        CX + w / 4,
        y - h / 2 - 0.38,
        19,
        YES
      ),

      line(
        CX - w / 2,
        y - h / 2 - 0.79,
        CX + w / 2,
        y - h / 2 - 0.79,
        C.violet,
        2
      ),

      text(
        'One matched pair',
        CX,
        y - h / 2 - 1.10,
        21,
        C.violet
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // FOUR OUTCOME GROUPS
  //
  // Top left:     both resolved
  // Top right:    neither resolved
  // Bottom left:  old only
  // Bottom right: new only
  // ------------------------------------------------------------

  const PANEL_W = P ? 3.10 : 3.18;
  const PANEL_H = P ? 2.48 : 1.9;

  const PANEL_DX = P ? 1.65 : 1.70;

  const PANEL_TOP_Y = P ? -0.15 : 0.35;
  const PANEL_BOTTOM_Y = P ? -3.12 : -1.75;

  function panelCenter(typeIndex) {
    return [
      CX + (typeIndex % 2 === 0
        ? -PANEL_DX
        : PANEL_DX),

      typeIndex < 2
        ? PANEL_TOP_Y
        : PANEL_BOTTOM_Y,

      0
    ];
  }

  function panelCardSlot(typeIndex, j) {
    const p = panelCenter(typeIndex);

    const cols = 5;

    const dx = P ? 0.53 : 0.55;
    const dy = P ? 0.33 : 0.215;

    return [
      p[0] + (j % cols - 2) * dx,

      p[1] +
        (P ? 0.42 : 0.33) -
        Math.floor(j / cols) * dy,

      0
    ];
  }

  function panelTicket(
    record,
    active = true
  ) {
    const p = panelCardSlot(
      record.typeIndex,
      record.within
    );

    return pairedTicket(
      p[0],
      p[1],
      record.old,
      record.new,
      P ? 0.45 : 0.46,
      P ? 0.28 : 0.19,
      active
    );
  }

  function outcomePanel(
    typeIndex,
    {
      countVisible = true,
      active = true,
      focus = false
    } = {}
  ) {
    const type = TYPES[typeIndex];
    const p = panelCenter(typeIndex);

    const color =
      active ? type.color : C.muted;

    const a = [];

    a.push(
      rounded(
        p[0],
        p[1],
        PANEL_W,
        PANEL_H,
        color,
        focus ? 0.095 : 0.025,
        focus ? 2.8 : 1.4
      ),

      text(
        type.label,
        p[0],
        p[1] + PANEL_H / 2 - 0.24,
        P ? 18 : 16,
        color,
        false,
        PANEL_W - 0.22
      )
    );

    if (countVisible) {
      a.push(
        text(
          type.n,
          p[0],
          p[1] - PANEL_H / 2 + 0.20,
          P ? 25 : 20,
          color,
          true
        )
      );
    }

    return G(a);
  }

  function groupFrames(
    countVisible = false
  ) {
    return G(
      TYPES.map((type, i) =>
        outcomePanel(i, {
          countVisible
        })
      )
    );
  }

  function groupedPicture({
    focus = null,
    discordantOnly = false
  } = {}) {
    const a = [];

    TYPES.forEach((type, i) => {
      const active =
        !discordantOnly || i >= 2;

      a.push(
        outcomePanel(i, {
          countVisible: true,
          active,
          focus:
            focus === i ||
            (discordantOnly && i >= 2)
        })
      );

      DATA.filter(
        d => d.typeIndex === i
      ).forEach(d => {
        a.push(
          panelTicket(d, active)
        );
      });
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // ONE GROUP AT A TIME
  // Large cards make the paired outcomes easy to see.
  // ------------------------------------------------------------

  function singleOutcomePicture(typeIndex) {
    const type = TYPES[typeIndex];
    const a = [];

    const cols = type.n <= 5
      ? type.n
      : 5;

    const rows =
      Math.ceil(type.n / cols);

    const dx = P ? 1.16 : 1.18;
    const dy = P ? 0.83 : 0.62;

    const top = P ? 0.50 : 0.56;

    a.push(
      text(
        type.label,
        CX,
        top + 0.75,
        23,
        type.color
      )
    );

    for (let j = 0; j < type.n; j++) {
      const x =
        CX +
        (j % cols -
          (cols - 1) / 2) * dx;

      const y =
        top -
        Math.floor(j / cols) * dy;

      a.push(
        pairedTicket(
          x,
          y,
          type.old,
          type.new,
          0.98,
          P ? 0.57 : 0.46
        )
      );
    }

    const bottom =
      top - (rows - 1) * dy;

    a.push(
      text(
        `${type.n} matched tickets`,
        CX,
        bottom - 0.76,
        25,
        type.color,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // CONCORDANT PAIRS DO NOT DISTINGUISH THE SCRIPTS
  // ------------------------------------------------------------

  function concordantPicture(
    resolved = true
  ) {
    const a = [];

    const n = resolved
      ? BOTH
      : NEITHER;

    const color = resolved
      ? YES
      : NO;

    const y = P ? 0.12 : 0.15;

    a.push(
      pairedTicket(
        CX,
        y,
        resolved,
        resolved,
        4.5,
        P ? 1.35 : 1.20
      ),

      text(
        'Old',
        CX - 1.125,
        y + 0.98,
        21,
        OLD
      ),

      text(
        'New',
        CX + 1.125,
        y + 0.98,
        21,
        NEW
      ),

      text(
        resolved
          ? 'Both succeeded'
          : 'Both failed',
        CX,
        y - 1.0,
        25,
        color
      ),

      text(
        `${n} tickets`,
        CX,
        y - 1.50,
        23,
        color,
        true
      ),

      text(
        'Neither script wins this comparison',
        CX,
        y - 2.05,
        19,
        C.muted,
        false,
        6.4
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // DISCORDANT PAIRS
  // Retain only the 3 old-only and 12 new-only outcomes.
  // ------------------------------------------------------------

  function discordantPicture(
    showTotal = true
  ) {
    const a = [];

    const left = CX - 1.65;
    const right = CX + 1.65;

    const cy = P ? -0.65 : -0.22;

    const h = P ? 3.70 : 2.80;
    const w = 3.05;

    a.push(
      rounded(
        left,
        cy,
        w,
        h,
        OLD,
        0.05,
        2
      ),

      rounded(
        right,
        cy,
        w,
        h,
        NEW,
        0.05,
        2
      ),

      text(
        'Old wins',
        left,
        cy + h / 2 - 0.30,
        22,
        OLD
      ),

      text(
        'New wins',
        right,
        cy + h / 2 - 0.30,
        22,
        NEW
      )
    );

    const ncols = 3;
    const dy = P ? 0.57 : 0.38;
    const top = cy + h / 2 - 0.87;

    [OLD_ONLY, NEW_ONLY].forEach(
      (n, group) => {
        const center =
          group === 0 ? left : right;

        for (let j = 0; j < n; j++) {
          const x =
            center +
            (j % ncols - 1) * 0.86;

          const y =
            top -
            Math.floor(j / ncols) * dy;

          a.push(
            pairedTicket(
              x,
              y,
              group === 0,
              group === 1,
              0.74,
              P ? 0.42 : 0.32
            )
          );
        }

        a.push(
          text(
            n,
            center,
            cy - h / 2 + 0.30,
            30,
            group === 0 ? OLD : NEW,
            true
          )
        );
      }
    );

    if (showTotal) {
      a.push(
        text(
          '3 + 12 = 15 disagreements',
          CX,
          cy - h / 2 - 0.46,
          23,
          C.violet,
          true,
          6.4
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // TWO POSSIBLE DIRECTIONS OF DISAGREEMENT
  // ------------------------------------------------------------

  function disagreementDirections(
    labels = true
  ) {
    const a = [];

    const x1 = CX - 1.65;
    const x2 = CX + 1.65;

    const y = P ? -0.45 : -0.25;

    a.push(
      pairedTicket(
        x1,
        y,
        true,
        false,
        2.75,
        1.12
      ),

      pairedTicket(
        x2,
        y,
        false,
        true,
        2.75,
        1.12
      ),

      text(
        'Old only',
        x1,
        y + 0.92,
        22,
        OLD
      ),

      text(
        'New only',
        x2,
        y + 0.92,
        22,
        NEW
      ),

      text(
        'Disagree',
        x1,
        y - 0.91,
        21,
        OLD
      ),

      text(
        'Disagree',
        x2,
        y - 0.91,
        21,
        NEW
      )
    );

    if (labels) {
      a.push(
        text(
          'b = 3',
          x1,
          y - 1.55,
          27,
          OLD,
          true
        ),

        text(
          'c = 12',
          x2,
          y - 1.55,
          27,
          NEW,
          true
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // MATCHED 2 × 2 TABLE
  //
  //                       New
  //                   Yes      No
  // Old     Yes       20        3
  //         No        12       15
  // ------------------------------------------------------------

  function matchedTable({
    margins = false,
    symbols = false,
    focus = 'none'
  } = {}) {
    const a = [];

    const top = P ? 0.9 : 0.85;

    const rh = P ? 1.20 : 0.92;

    const rowX = CX - 2.62;

    const xs = [
      CX - 0.92,
      CX + 0.87,
      CX + 2.65
    ];

    const cw = 1.58;
    const ch = rh - 0.10;

    const ys = [
      top - rh,
      top - rh * 2
    ];

    const data = [
      [BOTH, OLD_ONLY],
      [NEW_ONLY, NEITHER]
    ];

    a.push(
      text(
        'OLD SCRIPT',
        rowX,
        top + 0.45,
        16,
        OLD,
        false,
        1.60
      ),

      text(
        'NEW SCRIPT',
        (xs[0] + xs[1]) / 2,
        top + 0.45,
        18,
        NEW
      ),

      text(
        'Resolved',
        xs[0],
        top,
        17,
        YES,
        false,
        cw
      ),

      text(
        'Not resolved',
        xs[1],
        top,
        17,
        NO,
        false,
        cw
      ),

      text(
        'Resolved',
        rowX,
        ys[0],
        17,
        YES,
        false,
        1.55
      ),

      text(
        'Not resolved',
        rowX,
        ys[1],
        17,
        NO,
        false,
        1.55
      )
    );

    data.forEach((row, r) => {
      row.forEach((n, c) => {
        const disagreement = r !== c;

        let color = disagreement
          ? r === 0 ? OLD : NEW
          : C.muted;

        const active =
          focus === 'none' ||
          (
            focus === 'discordant' &&
            disagreement
          ) ||
          (
            focus === 'concordant' &&
            !disagreement
          );

        if (!active) {
          color = C.muted;
        }

        a.push(
          rounded(
            xs[c],
            ys[r],
            cw,
            ch,
            color,
            active
              ? disagreement ? 0.15 : 0.06
              : 0.015,
            active && disagreement
              ? 2.6
              : 1.2
          ),

          text(
            symbols && disagreement
              ? r === 0
                ? `b = ${n}`
                : `c = ${n}`
              : n,
            xs[c],
            ys[r],
            symbols && disagreement
              ? 23
              : 29,
            active ? color : C.muted,
            true
          )
        );
      });
    });

    if (margins) {
      a.push(
        text(
          'Total',
          xs[2],
          top,
          18,
          OLD
        ),

        text(
          OLD_RESOLVED,
          xs[2],
          ys[0],
          25,
          OLD,
          true
        ),

        text(
          TOTAL - OLD_RESOLVED,
          xs[2],
          ys[1],
          25,
          OLD,
          true
        )
      );

      const bottom = top - rh * 3;

      a.push(
        text(
          'Total',
          rowX,
          bottom,
          18,
          NEW
        ),

        text(
          NEW_RESOLVED,
          xs[0],
          bottom,
          25,
          NEW,
          true
        ),

        text(
          TOTAL - NEW_RESOLVED,
          xs[1],
          bottom,
          25,
          NEW,
          true
        ),

        text(
          TOTAL,
          xs[2],
          bottom,
          25,
          C.ink,
          true
        )
      );

      a.push(
        line(
          CX - 3.25,
          bottom + rh / 2,
          CX + 3.43,
          bottom + rh / 2,
          C.muted,
          1
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // FAIR COIN PICTURE
  // Each discordant pair can favour old or new.
  // Under the null these outcomes have equal probability.
  // ------------------------------------------------------------

  function coin(
    x, y,
    side = null,
    radius = 0.36
  ) {
    const color =
      side === 'old'
        ? OLD
        : side === 'new'
          ? NEW
          : C.violet;

    const halo = new M.Circle({
      radius: radius + 0.08,
      color
    });

    halo.setFill(color, 0.08);
    halo.moveTo([x, y, 0]);

    const body = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    body.setFill(color, 0.20);
    body.moveTo([x, y, 0]);

    const label = text(
      side === 'old'
        ? 'O'
        : side === 'new'
          ? 'N'
          : '?',
      x,
      y,
      22,
      color,
      true
    );

    return G(halo, body, label);
  }

  function fairCoinPicture() {
    const a = [];

    const y = P ? 0.60 : 0.64;

    a.push(
      coin(
        CX,
        y,
        null,
        0.46
      ),

      line(
        CX - 0.17,
        y - 0.45,
        CX - 1.65,
        y - 1.10,
        OLD,
        2
      ),

      line(
        CX + 0.17,
        y - 0.45,
        CX + 1.65,
        y - 1.10,
        NEW,
        2
      ),

      coin(
        CX - 1.65,
        y - 1.48,
        'old',
        0.43
      ),

      coin(
        CX + 1.65,
        y - 1.48,
        'new',
        0.43
      ),

      text(
        'Old wins',
        CX - 1.65,
        y - 2.12,
        21,
        OLD
      ),

      text(
        'New wins',
        CX + 1.65,
        y - 2.12,
        21,
        NEW
      ),

      text(
        '50%',
        CX - 1.65,
        y - 2.60,
        27,
        OLD,
        true
      ),

      text(
        '50%',
        CX + 1.65,
        y - 2.60,
        27,
        NEW,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // FIFTEEN COIN FLIPS
  // Illustrative null allocations.
  // Every coin represents one of the fifteen disagreements.
  // ------------------------------------------------------------

  function coinAllocation(
    oldWins = null,
    seed = 0
  ) {
    const a = [];

    const order = Array.from(
      { length: DISCORDANT },
      (_, j) => j
    );

    // Deterministic rearrangement for visual examples.

    let state = seed + 1234567;

    function rand() {
      state =
        (Math.imul(1664525, state) +
          1013904223) >>> 0;

      return state / 4294967296;
    }

    for (let j = order.length - 1; j > 0; j--) {
      const k = Math.floor(
        rand() * (j + 1)
      );

      [order[j], order[k]] =
        [order[k], order[j]];
    }

    const oldSet = new Set(
      oldWins === null
        ? []
        : order.slice(0, oldWins)
    );

    const cols = 5;
    const dx = P ? 1.12 : 1.12;
    const dy = P ? 0.95 : 0.79;

    const top = P ? 0.75 : 0.84;

    for (let j = 0; j < DISCORDANT; j++) {
      const x =
        CX +
        (j % cols - 2) * dx;

      const y =
        top -
        Math.floor(j / cols) * dy;

      const side =
        oldWins === null
          ? null
          : oldSet.has(j)
            ? 'old'
            : 'new';

      a.push(
        coin(
          x,
          y,
          side,
          P ? 0.32 : 0.29
        )
      );
    }

    a.push(
      text(
        oldWins === null
          ? '15 independent fair flips under the null'
          : `${oldWins} old wins; ${
            DISCORDANT - oldWins
          } new wins`,
        CX,
        top - 2 * dy - 0.72,
        20,
        C.violet,
        oldWins !== null,
        6.4
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // EXPECTED VS OBSERVED DISAGREEMENTS
  //
  // Hollow bars = expected under the null.
  // Glowing bars = observed.
  // ------------------------------------------------------------

  const WIN_BASE = P ? -3.45 : -1.86;
  const WIN_SCALE = P ? 0.34 : 0.235;

  const WIN_XS = [
    CX - 1.55,
    CX + 1.55
  ];

  function winsChart({
    expected = true,
    observed = true,
    gap = false
  } = {}) {
    const a = [];

    a.push(
      line(
        CX - 3.15,
        WIN_BASE,
        CX + 3.15,
        WIN_BASE,
        C.muted,
        2
      )
    );

    [3, 6, 9, 12].forEach(n => {
      const y = WIN_BASE + n * WIN_SCALE;

      a.push(
        line(
          CX - 3.12,
          y,
          CX + 3.12,
          y,
          C.muted,
          0.55
        )
      );
    });

    const vals = [
      OLD_ONLY,
      NEW_ONLY
    ];

    vals.forEach((n, k) => {
      const center = WIN_XS[k];
      const color = k === 0 ? OLD : NEW;

      const barW = 0.80;

      if (expected) {
        const x = center - 0.48;
        const h = EXPECTED * WIN_SCALE;

        a.push(
          rect(
            x,
            WIN_BASE + h / 2,
            barW,
            h,
            color,
            0,
            2.5
          ),

          text(
            '7.5',
            x,
            WIN_BASE + h + 0.24,
            20,
            color,
            true
          )
        );
      }

      if (observed) {
        const x =
          expected
            ? center + 0.48
            : center;

        const h = n * WIN_SCALE;

        a.push(
          rect(
            x,
            WIN_BASE + h / 2,
            barW + 0.14,
            h + 0.07,
            color,
            0.10,
            0
          ),

          rect(
            x,
            WIN_BASE + h / 2,
            barW,
            h,
            color,
            0.83,
            1.5
          ),

          text(
            n,
            x,
            WIN_BASE + h + 0.25,
            24,
            color,
            true
          )
        );
      }

      a.push(
        text(
          k === 0 ? 'Old wins' : 'New wins',
          center,
          WIN_BASE - 0.35,
          19,
          color
        )
      );
    });

    if (expected && observed) {
      const y = WIN_BASE - 0.82;

      a.push(
        rect(
          CX - 2.40,
          y,
          0.22,
          0.22,
          C.muted,
          0
        ),

        text(
          'Expected',
          CX - 1.40,
          y,
          16,
          C.muted
        ),

        rect(
          CX + 0.32,
          y,
          0.22,
          0.22,
          NEW,
          0.8,
          1
        ),

        text(
          'Observed',
          CX + 1.42,
          y,
          16,
          C.ink
        )
      );
    }

    if (gap) {
      const low =
        WIN_BASE + OLD_ONLY * WIN_SCALE;

      const high =
        WIN_BASE + NEW_ONLY * WIN_SCALE;

      a.push(
        line(
          CX,
          low,
          CX,
          high,
          C.violet,
          3
        ),

        line(
          CX - 0.12,
          low,
          CX + 0.12,
          low,
          C.violet,
          2
        ),

        line(
          CX - 0.12,
          high,
          CX + 0.12,
          high,
          C.violet,
          2
        ),

        text(
          '9',
          CX,
          (low + high) / 2,
          27,
          C.violet,
          true
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // EXPECTED 7.5 EACH WAY
  // Fractional blocks depict expected counts, not half tickets
  // that physically existed.
  // ------------------------------------------------------------

  function equalExpectation() {
    const a = [];

    const dx = P ? 0.62 : 0.63;

    const ys = [
      P ? 0.34 : 0.45,
      P ? -1.54 : -1.20
    ];

    [OLD, NEW].forEach((color, r) => {
      const y = ys[r];

      a.push(
        text(
          r === 0
            ? 'Expected old wins'
            : 'Expected new wins',
          CX,
          y + 0.68,
          20,
          color
        )
      );

      for (let j = 0; j < 8; j++) {
        const x =
          CX + (j - 3.75) * dx;

        if (j < 7) {
          a.push(
            rect(
              x,
              y,
              0.49,
              0.49,
              color,
              0.78,
              1
            )
          );
        } else {
          a.push(
            rect(
              x,
              y,
              0.49,
              0.49,
              color,
              0,
              1.5
            ),

            rect(
              x - 0.49 / 4,
              y,
              0.49 / 2,
              0.49,
              color,
              0.78,
              0
            )
          );
        }
      }

      a.push(
        text(
          '7.5 expected',
          CX,
          y - 0.63,
          24,
          color,
          true
        )
      );
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // DIFFERENCE OF NINE
  // Cancel three old wins against three new wins.
  // Nine unmatched new wins remain.
  // ------------------------------------------------------------

  function differencePicture(
    highlight = true
  ) {
    const a = [];

    const pitch = P ? 0.49 : 0.49;
    const w = 0.40;

    const left = CX - 2.75;

    const oldY = P ? 0.30 : 0.40;
    const newY = P ? -1.20 : -1.05;

    a.push(
      text(
        'Old wins: 3',
        CX,
        oldY + 0.63,
        21,
        OLD
      ),

      text(
        'New wins: 12',
        CX,
        newY + 0.63,
        21,
        NEW
      )
    );

    for (let j = 0; j < OLD_ONLY; j++) {
      const x = left + j * pitch;

      a.push(
        rounded(
          x,
          oldY,
          w,
          w,
          OLD,
          highlight ? 0.22 : 0.80,
          1.3
        )
      );

      if (highlight) {
        a.push(
          dashed(
            x,
            oldY - 0.22,
            x,
            newY + 0.22,
            C.muted
          )
        );
      }
    }

    for (let j = 0; j < NEW_ONLY; j++) {
      const x = left + j * pitch;

      const remaining = j >= OLD_ONLY;

      a.push(
        rounded(
          x,
          newY,
          w,
          w,
          NEW,
          highlight && !remaining
            ? 0.20
            : 0.84,
          1.3
        )
      );
    }

    if (highlight) {
      const x1 =
        left + OLD_ONLY * pitch - w / 2;

      const x2 =
        left +
        (NEW_ONLY - 1) * pitch + w / 2;

      const y = newY - 0.49;

      a.push(
        line(
          x1,
          y,
          x2,
          y,
          C.violet,
          2.5
        ),

        line(
          x1,
          y,
          x1,
          y + 0.14,
          C.violet,
          2
        ),

        line(
          x2,
          y,
          x2,
          y + 0.14,
          C.violet,
          2
        ),

        text(
          '9 extra new wins',
          (x1 + x2) / 2,
          y - 0.36,
          22,
          C.violet,
          true
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // SQUARE THE DIFFERENCE
  // 9 × 9 = 81 small squares.
  // ------------------------------------------------------------

  function squarePicture() {
    const a = [];

    const pitch = P ? 0.36 : 0.29;
    const cell = pitch * 0.85;

    const centerX = CX;
    const centerY = P ? -0.85 : -0.35;

    for (let r = 0; r < DIFF; r++) {
      for (let c = 0; c < DIFF; c++) {
        a.push(
          rect(
            centerX +
              (c - (DIFF - 1) / 2) * pitch,

            centerY +
              (r - (DIFF - 1) / 2) * pitch,

            cell,
            cell,
            C.violet,
            0.80,
            0
          )
        );
      }
    }

    const side = DIFF * pitch;

    a.push(
      rect(
        centerX,
        centerY,
        side + 0.05,
        side + 0.05,
        C.violet,
        0,
        2
      ),

      text(
        '9',
        centerX,
        centerY + side / 2 + 0.29,
        23,
        C.violet,
        true
      ),

      text(
        '9',
        centerX - side / 2 - 0.35,
        centerY,
        23,
        C.violet,
        true
      ),

      text(
        '9 × 9 = 81',
        CX,
        centerY - side / 2 - 0.47,
        28,
        C.violet,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // DIVIDE BY THE NUMBER OF DISAGREEMENTS
  // Show 81 units shared into fifteen equal parts.
  // Each part is worth 5.4 units.
  // ------------------------------------------------------------

  function dividePicture() {
    const a = [];

    const cols = 5;
    const rows = 3;

    const dx = P ? 1.22 : 1.18;
    const dy = P ? 1.18 : 0.82;

    const top = P ? 0.70 : 0.75;

    const cellW = 0.135;
    const cellH = 0.23;

    for (let i = 0; i < DISCORDANT; i++) {
      const x =
        CX +
        (i % cols - 2) * dx;

      const y =
        top -
        Math.floor(i / cols) * dy;

      a.push(
        rounded(
          x,
          y,
          1.07,
          P ? 0.94 : 0.68,
          C.violet,
          0.045,
          1.3
        )
      );

      const left = x - 0.44;

      for (let j = 0; j < 6; j++) {
        const xx =
          left + j * 0.145 + cellW / 2;

        a.push(
          rect(
            xx,
            y + 0.11,
            cellW,
            cellH,
            C.violet,
            0,
            0.7
          )
        );

        const fraction =
          j < 5 ? 1 : 0.4;

        a.push(
          rect(
            xx -
              cellW / 2 +
              cellW * fraction / 2,

            y + 0.11,

            cellW * fraction,
            cellH,
            C.violet,
            0.78,
            0
          )
        );
      }

      a.push(
        text(
          '5.4',
          x,
          y - 0.19,
          17,
          C.violet,
          true
        )
      );
    }

    a.push(
      text(
        '81 ÷ 15 = 5.4',
        CX,
        top - (rows - 1) * dy - 0.76,
        28,
        YES,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // MCNEMAR STATISTIC SUMMARY
  // ------------------------------------------------------------

  function statisticPicture() {
    const a = [];

    const ys = [
      P ? 0.85 : 1.0,
      P ? -0.52 : -0.24,
      P ? -1.90 : -1.48
    ];

    const rows = [
      {
        label: 'Difference',
        value: '12 − 3 = 9',
        color: C.amber
      },

      {
        label: 'Squared difference',
        value: '9² = 81',
        color: C.violet
      },

      {
        label: 'Divide by disagreements',
        value: '81 ÷ 15 = 5.4',
        color: YES
      }
    ];

    rows.forEach((r, i) => {
      a.push(
        rounded(
          CX,
          ys[i],
          5.85,
          P ? 1.0 : 0.91,
          r.color,
          0.07,
          1.6
        ),

        text(
          r.label,
          CX,
          ys[i] + 0.22,
          17,
          r.color
        ),

        text(
          r.value,
          CX,
          ys[i] - 0.18,
          25,
          r.color,
          true
        )
      );

      if (i < rows.length - 1) {
        a.push(
          text(
            '↓',
            CX,
            (ys[i] + ys[i + 1]) / 2,
            20,
            C.muted
          )
        );
      }
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // CHI-SQUARE NULL DISTRIBUTION WITH ONE DEGREE OF FREEDOM
  //
  // f(x) = exp(-x/2) / sqrt(2*pi*x), x > 0.
  //
  // The density is unbounded at zero.
  // The near-zero portion is clipped at the top of the plot.
  // The upper-tail shading is based on the actual density.
  // ------------------------------------------------------------

  function luckCurve({
    showCutoff = false,
    showObserved = false,
    showTail = false
  } = {}) {
    const a = [];

    const w = P ? 6.20 : 6.55;
    const h = P ? 4.05 : 2.72;

    const x0 = CX - w / 2;
    const y0 = P ? -3.45 : -1.88;

    const xmax = 10;
    const segments = 200;

    const density = x =>
      Math.exp(-x / 2) /
      Math.sqrt(2 * Math.PI * x);

    const topDensity = density(0.14);

    const X = v =>
      x0 + w * v / xmax;

    const H = v =>
      h * Math.min(
        1,
        density(Math.max(v, 0.0001)) /
          topDensity
      );

    const Y = v =>
      y0 + H(v);

    a.push(
      line(
        X(0),
        y0,
        X(xmax),
        y0,
        C.muted,
        2
      ),

      line(
        X(0),
        y0,
        X(0),
        y0 + h + 0.09,
        C.muted,
        2
      )
    );

    // Shade the upper tail.

    for (let j = 0; j < segments; j++) {
      const v =
        xmax * (j + 0.5) / segments;

      if (!showTail || v < CHI) continue;

      const hh = H(v);

      a.push(
        rect(
          X(v),
          y0 + hh / 2,
          w / segments + 0.006,
          hh,
          NEW,
          0.80,
          0
        )
      );
    }

    // Draw the actual chi-square density.
    // Begin where the density enters the visible plot.

    const minVisible = 0.14;

    for (let j = 0; j < segments; j++) {
      const u =
        minVisible +
        (xmax - minVisible) *
          j / segments;

      const v =
        minVisible +
        (xmax - minVisible) *
          (j + 1) / segments;

      a.push(
        line(
          X(u),
          Y(u),
          X(v),
          Y(v),
          C.violet,
          2.8
        )
      );
    }

    a.push(
      line(
        X(minVisible) + 0.08,
        Y(minVisible) - 0.10,
        X(minVisible),
        Y(minVisible),
        C.violet,
        2
      ),

      line(
        X(minVisible) - 0.05,
        Y(minVisible) - 0.14,
        X(minVisible),
        Y(minVisible),
        C.violet,
        2
      )
    );

    for (let v = 0; v <= xmax; v += 2) {
      a.push(
        line(
          X(v),
          y0,
          X(v),
          y0 - 0.075,
          C.muted,
          1
        ),

        text(
          v,
          X(v),
          y0 - 0.27,
          15,
          C.muted,
          true
        )
      );
    }

    a.push(
      text(
        'Chi-square statistic',
        CX,
        y0 - 0.75,
        17,
        C.muted
      ),

      text(
        'df = 1',
        CX + 2.10,
        y0 + h - 0.12,
        22,
        C.violet,
        true
      ),

      text(
        'Null distribution',
        CX + 1.45,
        y0 + h - 0.57,
        18,
        C.violet
      )
    );

    if (showCutoff) {
      const yy =
        y0 + h * 0.58;

      a.push(
        dashed(
          X(CUTOFF),
          y0,
          X(CUTOFF),
          yy,
          C.amber
        ),

        text(
          '3.84',
          X(CUTOFF) - 0.17,
          yy + 0.24,
          20,
          C.amber,
          true
        ),

        text(
          '5% cutoff',
          X(CUTOFF) - 0.52,
          yy + 0.55,
          16,
          C.amber
        )
      );
    }

    if (showObserved) {
      const yy =
        y0 + h * 0.32;

      a.push(
        dashed(
          X(CHI),
          y0,
          X(CHI),
          yy,
          NEW
        ),

        dot(
          X(CHI),
          y0,
          NEW,
          0.085
        ),

        text(
          '5.4',
          X(CHI) + 0.25,
          yy + 0.23,
          24,
          NEW,
          true
        ),

        text(
          'Our result',
          X(CHI) + 0.58,
          yy + 0.57,
          17,
          NEW
        )
      );
    }

    if (showTail) {
      const xx = X(7.1);
      const yy = y0 + h * 0.17;

      a.push(
        line(
          xx,
          yy,
          X(6.1),
          Y(6.1) + 0.02,
          NEW,
          1.5
        ),

        text(
          'Upper tail ≈ 2%',
          xx + 0.12,
          yy + 0.24,
          17,
          NEW,
          false,
          2.70
        ),

        text(
          'Tail continues →',
          X(8.55),
          y0 + 0.45,
          13,
          C.muted,
          false,
          2.0
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // ABOUT TWO IN A HUNDRED
  // Illustrative probability picture, not a new simulation.
  // ------------------------------------------------------------

  function hundredWorlds(n = 2) {
    const a = [];

    const dx = 0.46;
    const dy = P ? 0.36 : 0.245;

    const top = P ? 0.95 : 0.95;

    for (let i = 0; i < 100; i++) {
      const x =
        CX + (i % 10 - 4.5) * dx;

      const y =
        top - Math.floor(i / 10) * dy;

      const active = i >= 100 - n;

      a.push(
        rounded(
          x,
          y,
          0.36,
          P ? 0.26 : 0.18,
          active ? NEW : C.muted,
          active ? 0.95 : 0.20,
          active ? 1.5 : 0,
          0.035
        )
      );
    }

    a.push(
      text(
        `About ${n} in 100`,
        CX,
        top - 9 * dy - 0.53,
        25,
        NEW,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // REJECTION DECISION
  // p ≈ 0.020 is below the 5% significance level.
  // ------------------------------------------------------------

  function decisionPicture() {
    const a = [];

    const maxP = 0.10;

    const w = P ? 6.10 : 6.40;
    const x0 = CX - w / 2;

    const y = P ? -0.42 : -0.30;

    const X = v =>
      x0 + v / maxP * w;

    a.push(
      rect(
        X(0.025),
        y,
        w / 2,
        0.48,
        YES,
        0.23,
        0
      ),

      rect(
        X(0.075),
        y,
        w / 2,
        0.48,
        C.muted,
        0.10,
        0
      ),

      line(
        X(0),
        y,
        X(maxP),
        y,
        C.muted,
        2
      )
    );

    for (let j = 0; j <= 10; j++) {
      const v = j / 100;

      a.push(
        line(
          X(v),
          y - 0.10,
          X(v),
          y + 0.10,
          C.muted,
          1
        )
      );

      if (
        j === 0 ||
        j === 2 ||
        j === 5 ||
        j === 8 ||
        j === 10
      ) {
        a.push(
          text(
            `${j}%`,
            X(v),
            y - 0.36,
            16,
            C.muted,
            true
          )
        );
      }
    }

    a.push(
      dashed(
        X(0.05),
        y - 0.23,
        X(0.05),
        y + 1.02,
        C.amber
      ),

      text(
        '5% cutoff',
        X(0.05) + 0.57,
        y + 1.18,
        20,
        C.amber
      ),

      line(
        X(PV),
        y - 0.23,
        X(PV),
        y + 0.72,
        NEW,
        3
      ),

      dot(
        X(PV),
        y,
        NEW,
        0.11
      ),

      text(
        'p ≈ 2.0%',
        X(PV),
        y + 0.96,
        24,
        NEW,
        true
      ),

      text(
        'Reject',
        X(0.025),
        y - 0.96,
        21,
        YES
      ),

      text(
        'Do not reject',
        X(0.075),
        y - 0.96,
        19,
        C.muted
      ),

      text(
        'Evidence of a difference',
        CX,
        y - 1.55,
        23,
        YES
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // GENERAL MCNEMAR FORMULA
  // The disagreement counts are b and c.
  // ------------------------------------------------------------

  function formulaPicture() {
    const a = [];

    const x1 = CX - 1.65;
    const x2 = CX + 1.65;

    const y = P ? 0.35 : 0.45;

    a.push(
      pairedTicket(
        x1,
        y,
        true,
        false,
        2.75,
        1.0
      ),

      pairedTicket(
        x2,
        y,
        false,
        true,
        2.75,
        1.0
      ),

      text(
        'b = 3',
        x1,
        y + 0.84,
        27,
        OLD,
        true
      ),

      text(
        'c = 12',
        x2,
        y + 0.84,
        27,
        NEW,
        true
      ),

      text(
        '(b − c)²',
        CX,
        y - 0.94,
        31,
        C.violet,
        true
      ),

      line(
        CX - 1.33,
        y - 1.29,
        CX + 1.33,
        y - 1.29,
        C.ink,
        2
      ),

      text(
        'b + c',
        CX,
        y - 1.65,
        29,
        C.ink,
        true
      ),

      text(
        '= 5.4',
        CX,
        y - 2.24,
        30,
        YES,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // OVERALL RESOLUTION RESULTS
  // Two bars, each representing all fifty matched tickets.
  // ------------------------------------------------------------

  function overallResults({
    emphasizeDiscordance = false
  } = {}) {
    const a = [];

    const w = P ? 5.9 : 6.1;

    const left = CX - w / 2;

    const ys = [
      P ? 0.35 : 0.48,
      P ? -1.55 : -1.12
    ];

    const values = [
      OLD_RESOLVED,
      NEW_RESOLVED
    ];

    values.forEach((n, r) => {
      const y = ys[r];

      const color =
        r === 0 ? OLD : NEW;

      const rw =
        w * n / TOTAL;

      const nw =
        w * (TOTAL - n) / TOTAL;

      a.push(
        text(
          r === 0
            ? 'Old script'
            : 'New script',
          CX,
          y + 0.68,
          22,
          color
        ),

        rounded(
          CX,
          y,
          w,
          0.58,
          color,
          0.035,
          2
        ),

        rect(
          left + rw / 2,
          y,
          rw,
          0.54,
          YES,
          0.77,
          0
        ),

        rect(
          left + rw + nw / 2,
          y,
          nw,
          0.54,
          NO,
          0.23,
          0
        ),

        text(
          `${n} / 50 = ${
            Math.round(n / TOTAL * 100)
          }%`,
          CX,
          y - 0.58,
          24,
          color,
          true
        )
      );

      // Mark the part resolved by both scripts.

      const commonW = w * BOTH / TOTAL;

      a.push(
        line(
          left + commonW,
          y - 0.29,
          left + commonW,
          y + 0.29,
          C.card,
          2
        )
      );

      if (emphasizeDiscordance) {
        const unique = r === 0
          ? OLD_ONLY
          : NEW_ONLY;

        const uw = w * unique / TOTAL;

        a.push(
          rect(
            left + commonW + uw / 2,
            y,
            uw,
            0.65,
            color,
            0.10,
            2.8
          )
        );
      }
    });

    if (emphasizeDiscordance) {
      a.push(
        text(
          'The test uses only the disagreements',
          CX,
          P ? -3.0 : -2.25,
          19,
          C.violet,
          false,
          6.5
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // APPLICATIONS
  // Two binary observations on the same people or items.
  // ------------------------------------------------------------

  function person(x, y, color = C.ink) {
    const head = new M.Circle({
      radius: 0.14,
      color
    });

    head.setFill(color, 0.90);
    head.moveTo([x, y + 0.28, 0]);

    const body = new M.Arc({
      radius: 0.25,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(color, 0.80);
    body.moveTo([x, y - 0.03, 0]);

    return G(head, body);
  }

  function applicationPicture(
    example = 'training'
  ) {
    const a = [];

    const left = CX - 1.55;
    const right = CX + 1.55;

    const y = P ? -0.18 : -0.10;

    const before =
      example === 'training'
        ? 'Before training'
        : 'Rater A';

    const after =
      example === 'training'
        ? 'After training'
        : 'Rater B';

    const subject =
      example === 'training'
        ? 'Same person'
        : 'Same case';

    a.push(
      text(
        subject,
        CX,
        y + 1.40,
        23,
        C.violet
      )
    );

    if (example === 'training') {
      a.push(
        person(
          CX,
          y + 0.78,
          C.violet
        )
      );
    } else {
      a.push(
        rounded(
          CX,
          y + 0.82,
          0.72,
          0.54,
          C.violet,
          0.12
        ),

        line(
          CX - 0.22,
          y + 0.89,
          CX + 0.22,
          y + 0.89,
          C.violet
        ),

        line(
          CX - 0.22,
          y + 0.73,
          CX + 0.14,
          y + 0.73,
          C.violet
        )
      );
    }

    a.push(
      line(
        CX - 0.20,
        y + 0.43,
        left,
        y + 0.12,
        OLD,
        2
      ),

      line(
        CX + 0.20,
        y + 0.43,
        right,
        y + 0.12,
        NEW,
        2
      ),

      rounded(
        left,
        y - 0.30,
        2.70,
        0.84,
        OLD,
        0.08
      ),

      rounded(
        right,
        y - 0.30,
        2.70,
        0.84,
        NEW,
        0.08
      ),

      text(
        before,
        left,
        y - 0.30,
        19,
        OLD,
        false,
        2.40
      ),

      text(
        after,
        right,
        y - 0.30,
        19,
        NEW,
        false,
        2.40
      ),

      mark(
        left,
        y - 1.02,
        false,
        0.19
      ),

      mark(
        right,
        y - 1.02,
        true,
        0.19
      ),

      text(
        'Illustrative matched yes/no results',
        CX,
        y - 1.75,
        19,
        C.muted,
        false,
        6.4
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // COMMON TRAP: DISCARDING THE MATCHING
  // Each pair has a unique ID.
  // Keeping the IDs makes the dependency visible.
  // ------------------------------------------------------------

  function pairingTrap(
    broken = false
  ) {
    const a = [];

    // Illustrative selection of six actual records:
    // two both, two neither, one old-only, one new-only.

    const records = [
      DATA[0],
      DATA[1],
      DATA[BOTH],
      DATA[BOTH + 1],
      DATA[BOTH + NEITHER],
      DATA[BOTH + NEITHER + OLD_ONLY]
    ];

    const left = CX - 1.60;
    const right = CX + 1.60;

    const top = P ? 0.92 : 0.92;
    const dy = P ? 0.73 : 0.51;

    const rightOrder = broken
      ? [3, 5, 1, 4, 0, 2]
      : [0, 1, 2, 3, 4, 5];

    a.push(
      text(
        'Old answers',
        left,
        top + 0.52,
        20,
        OLD
      ),

      text(
        'New answers',
        right,
        top + 0.52,
        20,
        NEW
      )
    );

    records.forEach((d, i) => {
      const y = top - i * dy;

      a.push(
        singleTicket(
          left,
          y,
          'old',
          d.old,
          1.04,
          P ? 0.49 : 0.37
        ),

        text(
          d.id,
          left - 0.83,
          y,
          15,
          OLD,
          true
        )
      );

      if (!broken) {
        a.push(
          line(
            left + 0.56,
            y,
            right - 0.56,
            y,
            C.violet,
            1.6
          )
        );
      }
    });

    rightOrder.forEach((recordIndex, i) => {
      const d = records[recordIndex];

      const y = top - i * dy;

      a.push(
        singleTicket(
          right,
          y,
          'new',
          d.new,
          1.04,
          P ? 0.49 : 0.37
        ),

        text(
          d.id,
          right + 0.83,
          y,
          15,
          NEW,
          true
        )
      );
    });

    a.push(
      text(
        broken
          ? 'Pairing information lost'
          : 'Connect answers from the same ticket',
        CX,
        top - 5 * dy - 0.52,
        20,
        broken ? C.amber : C.violet,
        false,
        6.4
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // EXACT BINOMIAL ALTERNATIVE
  // Illustrative small-disagreement case, separate from the
  // fifty-ticket worked example.
  // ------------------------------------------------------------

  function smallDiscordancePicture() {
    const a = [];

    const n = 6;

    const y = P ? 0.32 : 0.46;

    a.push(
      text(
        'Illustrative case: 6 disagreements',
        CX,
        y + 0.85,
        20,
        C.amber,
        false,
        6.4
      )
    );

    for (let j = 0; j < n; j++) {
      a.push(
        pairedTicket(
          CX + (j - 2.5) * 1.04,
          y,
          j === 0,
          j !== 0,
          0.89,
          0.56
        )
      );
    }

    a.push(
      text(
        '↓',
        CX,
        y - 0.70,
        27,
        C.violet
      )
    );

    for (let j = 0; j < n; j++) {
      a.push(
        coin(
          CX + (j - 2.5) * 1.04,
          y - 1.40,
          null,
          0.31
        )
      );
    }

    a.push(
      text(
        'Count the exact fair-coin probabilities',
        CX,
        y - 2.13,
        20,
        C.violet,
        false,
        6.4
      )
    );

    return G(a);
  }

  function choose(n, k) {
    if (k < 0 || k > n) return 0;

    k = Math.min(k, n - k);

    let result = 1;

    for (let i = 1; i <= k; i++) {
      result =
        result * (n - k + i) / i;
    }

    return Math.round(result);
  }

  function exactBinomialPicture() {
    const a = [];

    // Six disagreements in the illustrative case.
    // The 2^6 possible directions are equally likely
    // under the independent fair-coin null.

    const n = 6;

    const ways = Array.from(
      { length: n + 1 },
      (_, k) => choose(n, k)
    );

    const base = P ? -3.20 : -1.82;
    const maxH = P ? 3.90 : 2.70;

    const sp = P ? 0.92 : 0.93;

    const maxWays = Math.max(...ways);

    a.push(
      line(
        CX - sp * 3.5,
        base,
        CX + sp * 3.5,
        base,
        C.muted,
        2
      )
    );

    ways.forEach((v, k) => {
      const x = CX + (k - 3) * sp;

      const h =
        v / maxWays * maxH;

      const extreme = k <= 1 || k >= 5;

      const color =
        extreme
          ? k <= 1 ? NEW : OLD
          : C.violet;

      a.push(
        rect(
          x,
          base + h / 2,
          0.66,
          h,
          color,
          extreme ? 0.87 : 0.65,
          1.2
        ),

        text(
          v,
          x,
          base + h + 0.22,
          18,
          color,
          true
        ),

        text(
          k,
          x,
          base - 0.28,
          18,
          OLD,
          true
        )
      );
    });

    a.push(
      text(
        'Number of old wins',
        CX,
        base - 0.73,
        18,
        OLD
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // FINAL SUMMARY PICTURE
  // ------------------------------------------------------------

  function summaryPicture() {
    const a = [];

    const x1 = CX - 1.65;
    const x2 = CX + 1.65;

    const y = P ? 0.30 : 0.45;

    a.push(
      pairedTicket(
        x1,
        y,
        true,
        false,
        2.70,
        1.0
      ),

      pairedTicket(
        x2,
        y,
        false,
        true,
        2.70,
        1.0
      ),

      text(
        'Old only',
        x1,
        y + 0.85,
        21,
        OLD
      ),

      text(
        'New only',
        x2,
        y + 0.85,
        21,
        NEW
      ),

      text(
        '3',
        x1,
        y - 0.88,
        34,
        OLD,
        true
      ),

      text(
        '12',
        x2,
        y - 0.88,
        34,
        NEW,
        true
      ),

      text(
        '15 disagreements',
        CX,
        y - 1.49,
        25,
        C.violet,
        true
      ),

      rounded(
        CX,
        y - 2.15,
        5.65,
        0.64,
        YES,
        0.10,
        2
      ),

      text(
        'Disagreements favour the new script',
        CX,
        y - 2.15,
        19,
        YES,
        false,
        5.35
      )
    );

    return G(a);
  }

  // ============================================================
  // NARRATION BEATS
  // ============================================================

  // ------------------------------------------------------------
  // 0. So far, each ticket was answered with one script only.
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...scene(separateGroups()),

    ...say(
      'BEFORE: ONE SCRIPT PER TICKET'
    )
  );

  // ------------------------------------------------------------
  // 1. Fifty practice tickets are each answered twice.
  // ------------------------------------------------------------

  const cards = DATA.map((d, i) =>
    gridCard(d, i, false)
  );

  const initialHeading = gridHeading();

  await until(S(1));

  await play(
    ...scene(initialHeading),

    new M.LaggedStart(
      cards.map(t =>
        new M.FadeIn(t)
      ),
      {
        lagRatio: 0.035,
        runTime: 2.0
      }
    ),

    ...fbox([
      ['50 practice tickets', C.cyan],
      'Each answered twice',
      '100 answers, 50 pairs'
    ]),

    ...say(
      'NOW: ANSWER EACH TICKET TWICE'
    )
  );

  // ------------------------------------------------------------
  // 2. Old script, new script; grader marks both outcomes.
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    new M.LaggedStart(
      cards.map((t, i) =>
        new M.Transform(
          t,
          gridCard(DATA[i], i, true)
        )
      ),
      {
        lagRatio: 0.025,
        runTime: 2.1
      }
    ),

    ...fbox([
      ['Left = old script', OLD],
      ['Right = new script', NEW],
      ['✓ resolved', YES],
      ['× not resolved', NO]
    ]),

    ...say(
      'TWO OUTCOMES ON THE SAME TICKET'
    )
  );

  // ------------------------------------------------------------
  // 3. Does the new script resolve more of the same tickets?
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...fbox([
      'Same fifty tickets',
      'Compare old with new',
      ['Does the new script do better?', NEW]
    ], C.amber),

    ...say(
      'DOES NEW RESOLVE MORE OF THE SAME TICKETS?',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 4. Line up the fifty tickets, each with two marks.
  // Arrange the existing ticket objects into four panels.
  // ------------------------------------------------------------

  const panels = groupFrames(false);

  await until(S(4));

  await play(
    ...scene(panels),

    new M.LaggedStart(
      cards.map((t, i) =>
        new M.Transform(
          t,
          panelTicket(DATA[i]),
          {
            pathArc:
              DATA[i].typeIndex % 2 === 0
                ? -0.20
                : 0.20
          }
        )
      ),
      {
        lagRatio: 0.018,
        runTime: 2.8
      }
    ),

    ...fbox([
      'One pair per ticket',
      ['Old outcome first', OLD],
      ['New outcome second', NEW]
    ]),

    ...say(
      'SORT THE FIFTY MATCHED PAIRS'
    )
  );

  // ------------------------------------------------------------
  // 5. Twenty resolved both times.
  // ------------------------------------------------------------

  const groupCountLabels = [];

  const bothCenter = panelCenter(0);

  const bothLabel = text(
    BOTH,
    bothCenter[0],
    bothCenter[1] - PANEL_H / 2 + 0.20,
    P ? 25 : 20,
    YES,
    true
  );

  groupCountLabels.push(bothLabel);

  await until(S(5));

  await play(
    new M.FadeIn(
      bothLabel,
      { runTime: 0.35 }
    ),

    new M.LaggedStart(
      cards.slice(0, BOTH).map(t =>
        new M.Indicate(
          t,
          {
            color: YES,
            runTime: 0.35
          }
        )
      ),
      {
        lagRatio: 0.015,
        runTime: 0.80
      }
    ),

    ...fbox([
      'Both scripts resolved',
      ['20 tickets', YES],
      'Old ✓   New ✓'
    ]),

    ...say(
      '20 RESOLVED BOTH TIMES',
      YES
    )
  );

  // ------------------------------------------------------------
  // 6. Fifteen resolved neither time.
  // ------------------------------------------------------------

  const neitherCenter = panelCenter(1);

  const neitherLabel = text(
    NEITHER,
    neitherCenter[0],
    neitherCenter[1] - PANEL_H / 2 + 0.20,
    P ? 25 : 20,
    NO,
    true
  );

  groupCountLabels.push(neitherLabel);

  await until(S(6));

  await play(
    new M.FadeIn(
      neitherLabel,
      { runTime: 0.35 }
    ),

    new M.LaggedStart(
      cards.slice(
        BOTH,
        BOTH + NEITHER
      ).map(t =>
        new M.Indicate(
          t,
          {
            color: NO,
            runTime: 0.35
          }
        )
      ),
      {
        lagRatio: 0.015,
        runTime: 0.80
      }
    ),

    ...fbox([
      'Neither script resolved',
      ['15 tickets', NO],
      'Old ×   New ×'
    ]),

    ...say(
      '15 RESOLVED NEITHER TIME',
      NO
    )
  );

  // ------------------------------------------------------------
  // 7. Three resolved only by the old script.
  // ------------------------------------------------------------

  const oldCenter = panelCenter(2);

  const oldLabel = text(
    OLD_ONLY,
    oldCenter[0],
    oldCenter[1] - PANEL_H / 2 + 0.20,
    P ? 25 : 20,
    OLD,
    true
  );

  groupCountLabels.push(oldLabel);

  await until(S(7));

  await play(
    new M.FadeIn(
      oldLabel,
      { runTime: 0.35 }
    ),

    new M.LaggedStart(
      cards.slice(
        BOTH + NEITHER,
        BOTH + NEITHER + OLD_ONLY
      ).map(t =>
        new M.Indicate(
          t,
          {
            color: OLD,
            runTime: 0.45
          }
        )
      ),
      {
        lagRatio: 0.12,
        runTime: 0.80
      }
    ),

    ...fbox([
      'Only old resolved',
      ['3 tickets', OLD],
      'Old ✓   New ×'
    ]),

    ...say(
      '3 RESOLVED ONLY BY OLD',
      OLD
    )
  );

  // ------------------------------------------------------------
  // 8. Twelve resolved only by the new script.
  // ------------------------------------------------------------

  const newCenter = panelCenter(3);

  const newLabel = text(
    NEW_ONLY,
    newCenter[0],
    newCenter[1] - PANEL_H / 2 + 0.20,
    P ? 25 : 20,
    NEW,
    true
  );

  groupCountLabels.push(newLabel);

  await until(S(8));

  await play(
    new M.FadeIn(
      newLabel,
      { runTime: 0.35 }
    ),

    new M.LaggedStart(
      cards.slice(
        BOTH + NEITHER + OLD_ONLY
      ).map(t =>
        new M.Indicate(
          t,
          {
            color: NEW,
            runTime: 0.40
          }
        )
      ),
      {
        lagRatio: 0.035,
        runTime: 1.0
      }
    ),

    ...fbox([
      'Only new resolved',
      ['12 tickets', NEW],
      'Old ×   New ✓'
    ]),

    ...say(
      '12 RESOLVED ONLY BY NEW',
      NEW
    )
  );

  // ------------------------------------------------------------
  // 9. Check that all four groups add up to fifty.
  // ------------------------------------------------------------

  await until(S(9));

  await play(
    ...fbox([
      ['Both:       20', YES],
      ['Neither:    15', NO],
      ['Old only:    3', OLD],
      ['New only:   12', NEW],
      'Total = 50'
    ]),

    ...say(
      '20 + 15 + 3 + 12 = 50'
    )
  );

  // ------------------------------------------------------------
  // 10. Matched means two answers belong to the same ticket.
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    new M.FadeOut(
      new M.VGroup(
        ...cards,
        ...groupCountLabels
      )
    ),

    ...scene(matchedExample()),

    ...fbox([
      ['Matched data', C.violet],
      'Two answers',
      'One underlying ticket'
    ], C.violet),

    ...say(
      'MATCHED = SAME TICKET, TWO ANSWERS',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 11. Previous two-group tests need separate groups.
  // ------------------------------------------------------------

  await until(S(11));

  await play(
    ...scene(pairingTrap(false)),

    ...fbox([
      'The observations are paired',
      'Not two independent groups',
      ['Keep the matching', C.violet]
    ], C.amber),

    ...say(
      'INDEPENDENT-GROUP TESTS DO NOT FIT',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 12. Do the twenty both-resolved tickets distinguish scripts?
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...scene(singleOutcomePicture(0)),

    ...fbox([
      ['20 both resolved', YES],
      'Old ✓   New ✓',
      'Which script is better?'
    ]),

    ...say(
      'DO BOTH-RESOLVED PAIRS TELL US WHO WINS?',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 13. No. Both scripts did fine on these tickets.
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...scene(concordantPicture(true)),

    ...fbox([
      ['Both succeeded', YES],
      'No difference within the pair',
      'Neither script wins'
    ]),

    ...say(
      'BOTH SUCCEEDED: NO WINNER',
      YES
    )
  );

  // ------------------------------------------------------------
  // 14. The fifteen neither-resolved pairs are equally silent.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...scene(singleOutcomePicture(1)),

    ...fbox([
      ['15 neither resolved', NO],
      'Old ×   New ×',
      'Neither script wins'
    ]),

    ...say(
      'BOTH FAILED: NO WINNER',
      NO
    )
  );

  await until(S(14) + 3.0);

  await play(
    ...scene(concordantPicture(false))
  );

  // ------------------------------------------------------------
  // 15. Only pairs where the two marks disagree are informative.
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    ...scene(groupedPicture({
      discordantOnly: true
    })),

    ...fbox([
      ['35 agreements', C.muted],
      ['15 disagreements', C.violet],
      'Compare the disagreements'
    ], C.violet),

    ...say(
      'KEEP ONLY THE DISAGREEMENTS',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 16. These are discordant pairs.
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    ...scene(disagreementDirections(false)),

    ...fbox([
      ['Discordant pairs', C.violet],
      'One resolved',
      'One not resolved'
    ], C.violet),

    ...say(
      'DISCORDANT MEANS THE TWO MARKS DISAGREE',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 17. Three plus twelve = fifteen discordant tickets.
  // ------------------------------------------------------------

  await until(S(17));

  await play(
    ...scene(discordantPicture()),

    ...fbox([
      ['Old only = 3', OLD],
      ['New only = 12', NEW],
      ['3 + 12 = 15', C.violet]
    ]),

    ...say(
      '15 DISCORDANT TICKETS',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 18. Null hypothesis: scripts equally good.
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...scene(disagreementDirections(false)),

    ...fbox([
      'Null hypothesis',
      ['Scripts equally good', C.violet],
      'Neither direction favoured'
    ], C.violet),

    ...say(
      'NULL: BOTH DIRECTIONS EQUALLY LIKELY',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 19. Each disagreement is like a fair coin flip.
  // ------------------------------------------------------------

  await until(S(19));

  await play(
    ...scene(fairCoinPicture()),

    ...fbox([
      ['Old wins: chance ½', OLD],
      ['New wins: chance ½', NEW],
      'A fair coin under the null'
    ], C.violet),

    ...say(
      'ONE DISAGREEMENT = ONE FAIR COIN FLIP',
      C.violet
    )
  );

  await until(S(19) + 2.5);

  await play(
    ...scene(coinAllocation(null))
  );

  await until(S(19) + 4.1);

  await play(
    ...scene(coinAllocation(8, 17))
  );

  // ------------------------------------------------------------
  // 20. Expect seven and a half each way.
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...scene(equalExpectation()),

    ...fbox([
      '15 disagreements',
      '15 × ½ = 7.5',
      ['Expected: 7.5 each way', C.violet]
    ], C.violet),

    ...say(
      'EXPECTED: 7.5 OLD WINS, 7.5 NEW WINS'
    )
  );

  // ------------------------------------------------------------
  // 21. Observed three old wins and twelve new wins.
  // ------------------------------------------------------------

  await until(S(21));

  await play(
    ...scene(winsChart({
      expected: true,
      observed: true
    })),

    ...fbox([
      'Expected: 7.5 and 7.5',
      ['Observed old: 3', OLD],
      ['Observed new: 12', NEW]
    ]),

    ...say(
      'OBSERVED: A LOPSIDED SPLIT',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 22. Difference = twelve minus three = nine.
  // ------------------------------------------------------------

  await until(S(22));

  await play(
    ...scene(differencePicture(true)),

    ...fbox([
      'Step 1: find the difference',
      ['12 − 3 = 9', C.amber]
    ]),

    ...say(
      'STEP 1: FIND THE DIFFERENCE',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 23. Square it: eighty-one.
  // Short narration beat.
  // ------------------------------------------------------------

  await until(S(23));

  await play(
    ...scene(squarePicture(), 0.35),

    ...fbox([
      'Step 2: square it',
      ['9² = 81', C.violet]
    ], C.violet),

    ...say(
      'STEP 2: SQUARE THE DIFFERENCE',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 24. Divide by fifteen disagreements: five point four.
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...scene(dividePicture()),

    ...fbox([
      'Step 3: divide',
      'Number disagreeing = 15',
      ['81 ÷ 15 = 5.4', YES]
    ], YES),

    ...say(
      'STEP 3: DIVIDE BY THE DISAGREEMENTS',
      YES
    )
  );

  // ------------------------------------------------------------
  // 25. This is McNemar's statistic.
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...scene(statisticPicture()),

    ...fbox([
      ['McNemar’s statistic', C.violet],
      '(12 − 3)² / (12 + 3)',
      '= 81 / 15',
      ['= 5.4', YES]
    ], C.violet),

    ...say(
      'MCNEMAR’S STATISTIC = 5.4',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 26. Compare with chi-square, one degree of freedom.
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...scene(luckCurve()),

    ...fbox([
      'Chi-square approximation',
      ['df = 1', C.violet],
      'One free disagreement count'
    ], C.violet),

    ...say(
      'CHI-SQUARE WITH ONE DEGREE OF FREEDOM',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 27. Five point four or more happens by luck about 2%.
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...scene(luckCurve({
      showCutoff: true,
      showObserved: true,
      showTail: true
    })),

    ...fbox([
      'χ² = 5.4',
      'df = 1',
      ['p ≈ ' + PV.toFixed(3), NEW],
      'About 2 in 100'
    ]),

    ...say(
      'ABOUT TWO IN A HUNDRED UNDER THE NULL',
      NEW
    )
  );

  await until(S(27) + 2.8);

  await play(
    ...scene(hundredWorlds(2))
  );

  // ------------------------------------------------------------
  // 28. Reject the null. New resolves more of the same tickets.
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    ...scene(decisionPicture()),

    ...fbox([
      'p ≈ 0.020',
      ['0.020 < 0.05', YES],
      'Reject the null',
      ['Disagreements favour new', NEW]
    ], YES),

    ...say(
      'EVIDENCE THAT THE NEW SCRIPT RESOLVES MORE',
      YES
    )
  );

  // ------------------------------------------------------------
  // 29. Name the disagreement counts b and c.
  // b = only old resolved = 3.
  // c = only new resolved = 12.
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    ...scene(disagreementDirections(true)),

    ...fbox([
      ['b = old only = 3', OLD],
      ['c = new only = 12', NEW]
    ]),

    ...say(
      'NAME THE TWO DISAGREEMENT COUNTS',
      C.violet
    )
  );

  await until(S(29) + 4.2);

  await play(
    ...scene(matchedTable({
      symbols: true,
      focus: 'discordant'
    })),

    ...fbox([
      ['b = 3', OLD],
      ['c = 12', NEW],
      'Use the off-diagonal cells'
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 30. Formula: (b − c)² / (b + c).
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...scene(formulaPicture()),

    ...fbox([
      ['χ² = (b − c)² / (b + c)', C.violet],
      '= (3 − 12)² / (3 + 12)',
      '= 81 / 15',
      ['= 5.4', YES]
    ], C.violet),

    ...say(
      'THE MCNEMAR FORMULA',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 31. How lopsided, relative to how many disagreements.
  // ------------------------------------------------------------

  await until(S(31));

  await play(
    ...scene(winsChart({
      expected: false,
      observed: true,
      gap: true
    })),

    ...fbox([
      ['Numerator: squared gap', C.violet],
      'Denominator: total disagreements',
      ['Lopsidedness relative to size', YES]
    ]),

    ...say(
      'HOW LOPSIDED ARE THE DISAGREEMENTS?',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 32. Overall old resolved 23/50, new resolved 32/50.
  // But the test uses only the fifteen disagreements.
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    ...scene(overallResults()),

    ...fbox([
      ['Old: 20 + 3 = 23', OLD],
      ['New: 20 + 12 = 32', NEW],
      'Each out of 50 tickets'
    ]),

    ...say(
      'OVERALL: 23 OLD RESOLVED, 32 NEW RESOLVED'
    )
  );

  await until(S(32) + 4.5);

  await play(
    ...scene(matchedTable({
      margins: true,
      symbols: true,
      focus: 'discordant'
    })),

    ...fbox([
      'Overall counts: 23 and 32',
      ['Test uses b + c = 15', C.violet],
      'Agreements do not enter χ²'
    ], C.violet),

    ...say(
      'BUT THE TEST USES ONLY THE 15 DISAGREEMENTS',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 33. Applications: same people/items measured twice.
  // Before and after training; two raters on the same cases.
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    ...scene(applicationPicture('training')),

    ...fbox([
      'Matched binary outcomes',
      'Before and after training',
      ['Same people', C.violet]
    ]),

    ...say(
      'WHEN TO USE IT: TWO MATCHED YES/NO RESULTS'
    )
  );

  await until(S(33) + 4.8);

  await play(
    ...scene(applicationPicture('raters')),

    ...fbox([
      'Two raters',
      'Each gives a yes/no answer',
      ['Same cases', C.violet]
    ]),

    ...say(
      'TWO RATERS ON THE SAME CASES'
    )
  );

  // ------------------------------------------------------------
  // 34. Common trap: treat matched observations as separate groups.
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...scene(pairingTrap(false)),

    ...fbox([
      ['Common trap', C.amber],
      'Treat paired results',
      'as independent samples'
    ], C.amber),

    ...say(
      'TRAP 1: IGNORING THE MATCHING',
      C.amber
    )
  );

  await until(S(34) + 2.0);

  await play(
    ...scene(pairingTrap(true))
  );

  // ------------------------------------------------------------
  // 35. Losing the pairing mixes easy and hard tickets into noise.
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    ...scene(groupedPicture({
      discordantOnly: false
    })),

    ...fbox([
      ['20 both succeeded', YES],
      ['15 both failed', NO],
      'Matching separates these',
      ['from the disagreements', C.violet]
    ]),

    ...say(
      'KEEP EASY AND HARD TICKETS MATCHED',
      C.violet
    )
  );

  await until(S(35) + 2.3);

  await play(
    ...scene(groupedPicture({
      discordantOnly: true
    })),

    ...fbox([
      'Keep the paired comparison',
      ['Focus on 3 versus 12', C.violet]
    ])
  );

  // ------------------------------------------------------------
  // 36. Very few disagreements: use the exact binomial test.
  // Below about ten is the caution given in the narration.
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    ...scene(smallDiscordancePicture()),

    ...fbox([
      ['Common trap', C.amber],
      'Very few disagreements?',
      'For example, fewer than 10',
      'Chi-square may be rough'
    ], C.amber),

    ...say(
      'TRAP 2: TOO FEW DISAGREEMENTS',
      C.amber
    )
  );

  await until(S(36) + 4.3);

  await play(
    ...scene(exactBinomialPicture()),

    ...fbox([
      'Use the exact binomial test',
      'n = number disagreeing',
      'Null chance = ½',
      ['Count exact tail probabilities', YES]
    ], YES),

    ...say(
      'USE EXACT FAIR-COIN COUNTING INSTEAD',
      YES
    )
  );

  await until(S(36) + 7.2);

  await play(
    ...fbox([
      'Count disagreements only',
      'Not the full sample size',
      ['Exact McNemar test', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 37. Closing summary.
  // McNemar checks whether matched binary disagreements
  // lean one way.
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    ...scene(summaryPicture()),

    ...fbox([
      ['McNemar’s test', C.violet],
      'χ² = (b − c)² / (b + c)',
      'χ² = 5.4; df = 1',
      ['p ≈ 0.020', YES]
    ], YES),

    ...say(
      'MCNEMAR: DO MATCHED DISAGREEMENTS LEAN ONE WAY?',
      YES
    )
  );

  await until(S(37) + 3.4);

  await play(
    ...scene(matchedTable({
      margins: true,
      symbols: true,
      focus: 'discordant'
    })),

    ...fbox([
      ['Same 50 tickets', C.ink],
      ['Old only = 3', OLD],
      ['New only = 12', NEW],
      ['Evidence favouring new', YES]
    ], YES)
  );

  await until(E(37));

  // ------------------------------------------------------------
  // IMPLEMENTATION NOTES
  // ------------------------------------------------------------
  //
  // All 38 narration beats, S(0) through S(37), are included.
  //
  // Shared chapter data:
  //   Both resolved = 20
  //   Neither resolved = 15
  //   Only old resolved = 3
  //   Only new resolved = 12
  //   Total matched tickets = 50
  //
  //   Old resolved = 23/50
  //   New resolved = 32/50
  //   Discordant pairs = 15
  //   Expected discordant counts = 7.5 and 7.5
  //
  //   McNemar statistic = (3 - 12)^2 / (3 + 12)
  //                     = 81 / 15
  //                     = 5.4
  //
  //   df = 1
  //   Approximate p-value = 0.02014
  //
  // This lesson deliberately uses the uncorrected chi-square
  // McNemar statistic, matching the supplied narration.
  //
  // The six-disagreement binomial example is illustrative,
  // not additional data from the fifty-ticket trial.
  //
  // Uses the supplied live-engine interface, approved reference
  // conventions, shared chapter data, and phone/laptop layouts.
  //
  // Browser execution, animation timing, and responsive rendering
  // have not been tested against the complete engine.js.
}
