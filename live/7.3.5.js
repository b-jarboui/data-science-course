// lesson 7.3.5
// Fisher's exact test.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C,
    S, E, T, pill, show, showA, until, play
  } = L;

  // ------------------------------------------------------------
  // SHARED CHAPTER DATA
  // ------------------------------------------------------------

  const NEW = C.cyan;
  const OLD = C.amber;
  const YES = C.green;
  const NO = C.muted;

  const OBS = [
    [5, 0],
    [1, 4]
  ];

  const EXP = [
    [3, 2],
    [3, 2]
  ];

  const ROW = [5, 5];
  const COL = [6, 4];

  const TOTAL = 10;
  const RESOLVED = 6;
  const NOT_RESOLVED = 4;

  const OBSERVED_K = 5;
  const ALPHA = 0.05;

  // ------------------------------------------------------------
  // EXACT COMBINATORIAL COUNTS
  // ------------------------------------------------------------

  function choose(n, k) {
    if (k < 0 || k > n) return 0;

    k = Math.min(k, n - k);

    let result = 1;

    for (let i = 1; i <= k; i++) {
      result = result * (n - k + i) / i;
    }

    return Math.round(result);
  }

  const KS = [1, 2, 3, 4, 5];

  const WAYS = KS.map(k =>
    choose(5, k) * choose(5, RESOLVED - k)
  );

  const ALL_WAYS = choose(TOTAL, RESOLVED);

  const OBSERVED_WAYS = WAYS[OBSERVED_K - 1];

  const EXTREME_K = KS.filter(k =>
    WAYS[k - 1] <= OBSERVED_WAYS
  );

  const EXTREME_WAYS = EXTREME_K.reduce(
    (sum, k) => sum + WAYS[k - 1],
    0
  );

  const ONE_PROB = OBSERVED_WAYS / ALL_WAYS;

  const PV = EXTREME_WAYS / ALL_WAYS;

  // WAYS = [5, 50, 100, 50, 5]
  // ALL_WAYS = 210
  // ONE_PROB = 5 / 210
  // PV = 10 / 210 = 0.047619...

  // ------------------------------------------------------------
  // ENUMERATE EVERY POSSIBLE ALLOCATION
  // Each allocation chooses exactly six of ten distinct cards.
  // ------------------------------------------------------------

  const ALLOCATIONS = [];

  for (let mask = 0; mask < (1 << TOTAL); mask++) {
    const marked = [];

    for (let j = 0; j < TOTAL; j++) {
      if ((mask & (1 << j)) !== 0) {
        marked.push(j);
      }
    }

    if (marked.length !== RESOLVED) continue;

    const k = marked.filter(j => j < 5).length;

    ALLOCATIONS.push({
      mask,
      marked,
      k
    });
  }

  const BUCKETS = KS.map(k =>
    ALLOCATIONS.filter(a => a.k === k)
  );

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
  // Only newly constructed objects are grouped together.
  // Existing objects are grouped only when being removed.
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

    const left = BOXP[0] - wd / 2 + 0.35;

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
  // TICKET CARDS
  // Cyan = new script.
  // Amber = old script.
  // Green tick = resolved.
  // Grey cross = not resolved.
  // ------------------------------------------------------------

  function ticket(
    x, y,
    script = null,
    resolved = null,
    w = 0.78,
    h = 0.54,
    label = null
  ) {
    const color =
      script === 'new'
        ? NEW
        : script === 'old'
          ? OLD
          : C.muted;

    const glow = rounded(
      x,
      y,
      w + 0.12,
      h + 0.12,
      color,
      0.09,
      0,
      0.08
    );

    const card = rounded(
      x,
      y,
      w,
      h,
      color,
      script === null ? 0.06 : 0.16,
      2,
      0.07
    );

    let m1;
    let m2;

    const mx = label === null
      ? x
      : x + w * 0.15;

    if (resolved === true) {
      m1 = line(
        mx - w * 0.24,
        y,
        mx - w * 0.07,
        y - h * 0.21,
        YES,
        2.5
      );

      m2 = line(
        mx - w * 0.07,
        y - h * 0.21,
        mx + w * 0.24,
        y + h * 0.24,
        YES,
        2.5
      );
    } else if (resolved === false) {
      m1 = line(
        mx - w * 0.20,
        y - h * 0.20,
        mx + w * 0.20,
        y + h * 0.20,
        NO,
        2
      );

      m2 = line(
        mx - w * 0.20,
        y + h * 0.20,
        mx + w * 0.20,
        y - h * 0.20,
        NO,
        2
      );
    } else {
      m1 = line(
        mx - w * 0.20,
        y,
        mx,
        y,
        color,
        1.5
      );

      m2 = line(
        mx,
        y,
        mx + w * 0.20,
        y,
        color,
        1.5
      );
    }

    const id = label === null
      ? null
      : text(
        label,
        x - w * 0.28,
        y,
        13,
        color,
        true,
        w * 0.25
      );

    return G(
      glow,
      card,
      m1,
      m2,
      id
    );
  }

  // ------------------------------------------------------------
  // SPECIALIST HELP DESK
  // ------------------------------------------------------------

  function person(x, y, color = C.ink) {
    const head = new M.Circle({
      radius: 0.17,
      color
    });

    head.setFill(color, 0.90);
    head.moveTo([x, y + 0.39, 0]);

    const body = new M.Arc({
      radius: 0.31,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(color, 0.85);
    body.moveTo([x, y - 0.02, 0]);

    return G(head, body);
  }

  function hardwareIcon(x, y) {
    const a = [];

    a.push(
      rounded(
        x,
        y,
        0.78,
        0.78,
        C.violet,
        0.14,
        2
      ),

      rect(
        x,
        y,
        0.38,
        0.38,
        C.violet,
        0.65,
        1
      )
    );

    for (let k = 0; k < 3; k++) {
      const d = (k - 1) * 0.22;

      a.push(
        line(
          x - 0.39,
          y + d,
          x - 0.53,
          y + d,
          C.violet
        ),

        line(
          x + 0.39,
          y + d,
          x + 0.53,
          y + d,
          C.violet
        ),

        line(
          x + d,
          y - 0.39,
          x + d,
          y - 0.53,
          C.violet
        ),

        line(
          x + d,
          y + 0.39,
          x + d,
          y + 0.53,
          C.violet
        )
      );
    }

    return G(a);
  }

  function specialistDesk() {
    const a = [];

    const y = P ? -0.6 : -0.30;

    a.push(
      rounded(
        CX,
        y,
        5.8,
        2.35,
        C.violet,
        0.035
      ),

      text(
        'Specialist help desk',
        CX,
        y + 1.50,
        23,
        C.violet
      ),

      person(
        CX - 1.50,
        y + 0.37,
        C.ink
      ),

      person(
        CX,
        y + 0.37,
        C.ink
      ),

      person(
        CX + 1.50,
        y + 0.37,
        C.ink
      ),

      line(
        CX - 2.30,
        y - 0.09,
        CX + 2.30,
        y - 0.09,
        C.muted,
        4
      ),

      hardwareIcon(
        CX,
        y - 0.67
      ),

      text(
        'Rare hardware problems',
        CX,
        y - 1.60,
        20,
        C.violet
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // TEN TRIAL TICKETS
  // ------------------------------------------------------------

  const CARD_SP = P ? 1.12 : 1.15;
  const CARD_W = P ? 0.84 : 0.83;
  const CARD_H = P ? 0.62 : 0.54;

  const NEW_Y = P ? 0.30 : 0.36;
  const OLD_Y = P ? -1.62 : -1.32;

  function cardSlot(i) {
    const row = i < 5 ? 0 : 1;
    const col = i % 5;

    return [
      CX + (col - 2) * CARD_SP,
      row === 0 ? NEW_Y : OLD_Y,
      0
    ];
  }

  function cardRows(
    marked = null,
    {
      labelled = true,
      counts = false,
      neutral = false
    } = {}
  ) {
    const a = [];

    if (labelled) {
      a.push(
        text(
          neutral ? 'First five tickets' : 'New script',
          CX,
          NEW_Y + 0.64,
          21,
          neutral ? C.muted : NEW
        ),

        text(
          neutral ? 'Other five tickets' : 'Old script',
          CX,
          OLD_Y + 0.64,
          21,
          neutral ? C.muted : OLD
        )
      );
    }

    for (let i = 0; i < TOTAL; i++) {
      const p = cardSlot(i);

      const script = neutral
        ? null
        : i < 5
          ? 'new'
          : 'old';

      const resolved = marked === null
        ? null
        : marked.includes(i);

      a.push(
        ticket(
          p[0],
          p[1],
          script,
          resolved,
          CARD_W,
          CARD_H
        )
      );
    }

    if (counts && marked !== null) {
      const k =
        marked.filter(i => i < 5).length;

      a.push(
        text(
          `${k} of 5 resolved`,
          CX,
          NEW_Y - 0.56,
          21,
          NEW,
          true
        ),

        text(
          `${RESOLVED - k} of 5 resolved`,
          CX,
          OLD_Y - 0.56,
          21,
          OLD,
          true
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // OBSERVED CARD ALLOCATION
  // ------------------------------------------------------------

  const OBSERVED_MARKS = [0, 1, 2, 3, 4, 5];

  const REVERSE_MARKS = [0, 5, 6, 7, 8, 9];

  const MIDDLE_MARKS = [0, 1, 2, 5, 6, 7];

  // ------------------------------------------------------------
  // CONTINGENCY TABLE
  // ------------------------------------------------------------

  const TABLE_TOP = P ? 0.7 : 0.75;
  const RH = P ? 1.25 : 1.00;

  const LX = CX - 2.50;

  const TX = [
    CX - 0.90,
    CX + 0.86,
    CX + 2.63
  ];

  const CW = P ? 1.59 : 1.58;
  const CH = RH - 0.10;

  const rowY = r =>
    TABLE_TOP - (r + 1) * RH;

  function tableOutline({
    margins = false,
    marginFocus = false,
    expected = false,
    tiny = false,
    title = ''
  } = {}) {
    const a = [];

    if (title) {
      a.push(
        text(
          title,
          CX,
          TABLE_TOP + 0.52,
          20,
          expected ? C.amber : C.cyan
        )
      );
    }

    a.push(
      text(
        'Script',
        LX,
        TABLE_TOP,
        17,
        C.muted
      ),

      text(
        'Resolved',
        TX[0],
        TABLE_TOP,
        18,
        YES,
        false,
        CW
      ),

      text(
        'Not resolved',
        TX[1],
        TABLE_TOP,
        18,
        NO,
        false,
        CW
      ),

      text(
        'New',
        LX,
        rowY(0),
        23,
        NEW
      ),

      text(
        'Old',
        LX,
        rowY(1),
        23,
        OLD
      )
    );

    if (margins) {
      a.push(
        text(
          'Total',
          TX[2],
          TABLE_TOP,
          18,
          C.amber
        )
      );
    }

    for (let r = 0; r < 2; r++) {
      const rowColor = r === 0 ? NEW : OLD;

      for (let c = 0; c < 2; c++) {
        const color = tiny
          ? C.amber
          : rowColor;

        a.push(
          rounded(
            TX[c],
            rowY(r),
            CW,
            CH,
            color,
            tiny ? 0.10 : 0.055,
            tiny ? 2.5 : 1.6
          )
        );
      }

      if (margins) {
        a.push(
          rounded(
            TX[2],
            rowY(r),
            CW,
            CH,
            C.amber,
            marginFocus ? 0.14 : 0.04,
            marginFocus ? 3 : 1.5
          ),

          text(
            ROW[r],
            TX[2],
            rowY(r),
            27,
            C.amber,
            true
          )
        );
      }
    }

    if (margins) {
      a.push(
        text(
          'Total',
          LX,
          rowY(2),
          20,
          C.amber
        )
      );

      [6, 4, 10].forEach((n, c) => {
        a.push(
          rounded(
            TX[c],
            rowY(2),
            CW,
            CH,
            C.amber,
            marginFocus ? 0.14 : 0.04,
            marginFocus ? 3 : 1.5
          ),

          text(
            n,
            TX[c],
            rowY(2),
            27,
            C.amber,
            true
          )
        );
      });
    }

    return G(a);
  }

  function countTable(
    data,
    {
      margins = true,
      marginFocus = false,
      expected = false,
      tiny = false,
      title = '',
      showCounts = true
    } = {}
  ) {
    const a = [
      tableOutline({
        margins,
        marginFocus,
        expected,
        tiny,
        title
      })
    ];

    if (showCounts) {
      data.forEach((row, r) => {
        row.forEach((n, c) => {
          a.push(
            text(
              n,
              TX[c],
              rowY(r),
              32,
              tiny
                ? C.amber
                : expected
                  ? C.muted
                  : C.ink,
              true
            )
          );
        });
      });
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // TICKET POSITIONS INSIDE TABLE CELLS
  // ------------------------------------------------------------

  function observedCellSlot(i) {
    let r;
    let c;
    let j;
    let n;

    if (i < 5) {
      r = 0;
      c = 0;
      j = i;
      n = 5;
    } else if (i === 5) {
      r = 1;
      c = 0;
      j = 0;
      n = 1;
    } else {
      r = 1;
      c = 1;
      j = i - 6;
      n = 4;
    }

    const dx = 0.27;

    return [
      TX[c] + (j - (n - 1) / 2) * dx,
      rowY(r) + 0.08,
      0
    ];
  }

  // ------------------------------------------------------------
  // FIXED MARGINS PICTURE
  // The ten script labels and six ticks are held fixed in number.
  // Their allocation is allowed to change.
  // ------------------------------------------------------------

  function fixedMarginsPicture() {
    const a = [];

    const scriptY = P ? 0.25 : 0.50;
    const outcomeY = P ? -1.85 : -1.15;

    a.push(
      text(
        'Fixed script totals',
        CX,
        scriptY + 0.70,
        20,
        C.amber
      ),

      text(
        'Fixed outcome totals',
        CX,
        outcomeY + 0.70,
        20,
        C.amber
      )
    );

    const sp = 0.58;

    for (let i = 0; i < TOTAL; i++) {
      const x = CX + (i - 4.5) * sp;

      a.push(
        ticket(
          x,
          scriptY,
          i < 5 ? 'new' : 'old',
          null,
          0.49,
          0.43
        )
      );

      const c = i < RESOLVED ? YES : NO;

      a.push(
        rounded(
          x,
          outcomeY,
          0.47,
          0.45,
          c,
          0.12,
          1
        ),

        text(
          i < RESOLVED ? '✓' : '×',
          x,
          outcomeY,
          24,
          c
        )
      );
    }

    a.push(
      text(
        '5 new',
        CX - 1.45,
        scriptY - 0.53,
        20,
        NEW,
        true
      ),

      text(
        '5 old',
        CX + 1.45,
        scriptY - 0.53,
        20,
        OLD,
        true
      ),

      text(
        '6 resolved',
        CX - 1.15,
        outcomeY - 0.55,
        19,
        YES,
        true
      ),

      text(
        '4 not',
        CX + 1.75,
        outcomeY - 0.55,
        19,
        NO,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // RANDOM ALLOCATION OF THE SIX TICKS
  // Example allocations only; exact enumeration follows.
  // ------------------------------------------------------------

  function allocationPicture(
    marked,
    title = 'One possible allocation'
  ) {
    const a = [];

    a.push(
      cardRows(marked, {
        labelled: true,
        counts: true
      }),

      text(
        title,
        CX,
        P ? -3.0 : -2.55,
        17,
        C.violet
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // MINIATURE ALLOCATION TILE
  // Ten distinct card positions, six marked resolved.
  // Each tile represents one equally likely allocation.
  // ------------------------------------------------------------

  function allocationTile(
    x, y,
    allocation,
    scale = 1,
    highlighted = false
  ) {
    const a = [];

    const w = 0.43 * scale;
    const h = 0.24 * scale;

    a.push(
      rounded(
        x,
        y,
        w,
        h,
        highlighted ? C.amber : C.muted,
        highlighted ? 0.14 : 0.035,
        highlighted ? 1.2 : 0.5,
        0.025 * scale
      )
    );

    const dx = 0.071 * scale;
    const dy = 0.083 * scale;
    const rr = 0.024 * scale;

    for (let i = 0; i < TOTAL; i++) {
      const px =
        x + (i % 5 - 2) * dx;

      const py =
        y + (i < 5 ? dy / 2 : -dy / 2);

      const resolved =
        (allocation.mask & (1 << i)) !== 0;

      a.push(
        dot(
          px,
          py,
          resolved ? YES : NO,
          rr
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // ALL 210 EQUALLY LIKELY ALLOCATIONS
  // One small tile = one choice of six resolved tickets.
  // ------------------------------------------------------------

  function allAllocationsPicture(
    highlight = 'none'
  ) {
    const a = [];

    const cols = 15;
    const rows = 14;

    const dx = P ? 0.43 : 0.43;
    const dy = P ? 0.31 : 0.19;

    const top = P ? 1.05 : 1.08;

    const tileScale = P ? 0.91 : 0.70;

    ALLOCATIONS.forEach((allocation, i) => {
      const x =
        CX + (i % cols - (cols - 1) / 2) * dx;

      const y =
        top - Math.floor(i / cols) * dy;

      const highlighted =
        highlight === 'observed'
          ? allocation.k === 5
          : highlight === 'both'
            ? EXTREME_K.includes(allocation.k)
            : false;

      a.push(
        allocationTile(
          x,
          y,
          allocation,
          tileScale,
          highlighted
        )
      );
    });

    const labelY =
      top - (rows - 1) * dy - 0.50;

    a.push(
      text(
        highlight === 'observed'
          ? '5 highlighted allocations'
          : highlight === 'both'
            ? '10 highlighted allocations'
            : '210 equally likely allocations',
        CX,
        labelY,
        20,
        highlight === 'none'
          ? C.cyan
          : C.amber,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // FIVE POSSIBLE TABLES
  // For k new-script ticks:
  //
  // New: k, 5-k
  // Old: 6-k, k-1
  //
  // All have identical margins.
  // ------------------------------------------------------------

  const KSP = P ? 1.30 : 1.36;

  const kx = k =>
    CX + (k - 3) * KSP;

  function miniOutcomeTable(
    k,
    x,
    y,
    color = C.violet
  ) {
    const a = [];

    const data = [
      [k, 5 - k],
      [6 - k, k - 1]
    ];

    const cw = 0.47;
    const ch = 0.34;

    a.push(
      rounded(
        x,
        y,
        1.11,
        0.92,
        color,
        0.035,
        1.4
      )
    );

    data.forEach((row, r) => {
      row.forEach((n, c) => {
        const px = x + (c - 0.5) * 0.49;
        const py = y + (0.5 - r) * 0.38;

        a.push(
          rect(
            px,
            py,
            cw,
            ch,
            r === 0 ? NEW : OLD,
            0.14,
            1
          ),

          text(
            n,
            px,
            py,
            16,
            r === 0 ? NEW : OLD,
            true
          )
        );
      });
    });

    return G(a);
  }

  function possibleTables(
    focus = null,
    impossibleZero = false
  ) {
    const a = [];

    const y = P ? -0.55 : -0.35;

    KS.forEach(k => {
      const x = kx(k);

      const color = focus === k
        ? C.amber
        : C.violet;

      a.push(
        text(
          k,
          x,
          y + 0.91,
          27,
          focus === k ? C.amber : NEW,
          true
        ),

        miniOutcomeTable(
          k,
          x,
          y,
          color
        ),

        text(
          `${6 - k} old`,
          x,
          y - 0.81,
          16,
          OLD,
          true
        )
      );
    });

    a.push(
      text(
        'Number of new-script tickets resolved',
        CX,
        y + 1.49,
        19,
        NEW,
        false,
        6.5
      )
    );

    if (impossibleZero) {
      a.push(
        rounded(
          CX,
          y - 1.65,
          5.9,
          0.63,
          C.amber,
          0.08,
          2
        ),

        text(
          '0 new would require 6 old — impossible',
          CX,
          y - 1.65,
          18,
          C.amber,
          false,
          5.6
        )
      );
    } else {
      a.push(
        text(
          'Six resolved tickets in every table',
          CX,
          y - 1.55,
          19,
          YES,
          false,
          6.4
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // DISTRIBUTION OF THE FIVE POSSIBLE TABLES
  // Heights are exact allocation counts, not estimated counts.
  // ------------------------------------------------------------

  const HIST_BASE = P ? -3.30 : -1.94;
  const HIST_MAXH = P ? 4.40 : 3.02;
  const HIST_BW = P ? 0.94 : 0.91;

  function histogramAxes() {
    const a = [];

    const left = CX - KSP * 2.50;
    const right = CX + KSP * 2.50;

    a.push(
      line(
        left,
        HIST_BASE,
        right,
        HIST_BASE,
        C.muted,
        2
      )
    );

    [25, 50, 75, 100].forEach(v => {
      const y =
        HIST_BASE + v / 100 * HIST_MAXH;

      a.push(
        line(
          left,
          y,
          right,
          y,
          C.muted,
          0.6
        )
      );
    });

    KS.forEach(k => {
      a.push(
        text(
          k,
          kx(k),
          HIST_BASE - 0.30,
          21,
          NEW,
          true
        )
      );
    });

    a.push(
      text(
        'New-script tickets resolved',
        CX,
        HIST_BASE - 0.76,
        18,
        NEW,
        false,
        6.2
      ),

      text(
        'ways',
        P ? left + 0.4 : left - 0.45,
        P ? HIST_BASE + HIST_MAXH * 0.625 : HIST_BASE + HIST_MAXH * 0.5,
        17,
        C.muted
      )
    );

    return G(a);
  }

  function histogramBar(
    k,
    color = C.violet,
    {
      selected = false,
      note = null
    } = {}
  ) {
    const n = WAYS[k - 1];

    const x = kx(k);

    const h =
      n / 100 * HIST_MAXH;

    const y =
      HIST_BASE + h / 2;

    const a = [];

    a.push(
      rect(
        x,
        y,
        HIST_BW + 0.13,
        h + 0.08,
        color,
        selected ? 0.20 : 0.08,
        0
      ),

      rect(
        x,
        y,
        HIST_BW,
        h,
        color,
        selected ? 0.96 : 0.75,
        selected ? 2.5 : 1
      ),

      text(
        n,
        x,
        HIST_BASE + h + 0.24,
        23,
        color,
        true
      )
    );

    if (note) {
      a.push(
        text(
          note,
          x,
          HIST_BASE + h + 0.67,
          14,
          color,
          false,
          KSP - 0.02
        )
      );
    }

    return G(a);
  }

  function histogram({
    revealed = 5,
    highlight = 'none',
    notes = false
  } = {}) {
    const a = [
      histogramAxes()
    ];

    KS.forEach(k => {
      if (k > revealed) return;

      const observed = k === OBSERVED_K;
      const reverse = k === 1;

      const active =
        highlight === 'observed'
          ? observed
          : highlight === 'both'
            ? observed || reverse
            : false;

      const color =
        active
          ? observed
            ? NEW
            : OLD
          : C.violet;

      let note = null;

      if (notes && active) {
        note = observed
          ? 'Observed'
          : 'Other tail';
      }

      a.push(
        histogramBar(
          k,
          color,
          {
            selected: active,
            note
          }
        )
      );
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // EXACT COUNTING PICTURE
  // Show the separate choices for each script group.
  // ------------------------------------------------------------

  function choicePicture(k = 5) {
    const a = [];

    const ys = [
      P ? 0.35 : 0.45,
      P ? -1.65 : -1.20
    ];

    const count = [
      k,
      RESOLVED - k
    ];

    const colors = [
      NEW,
      OLD
    ];

    ['new', 'old'].forEach((script, r) => {
      const y = ys[r];

      a.push(
        text(
          r === 0 ? 'New cards' : 'Old cards',
          CX,
          y + 0.68,
          21,
          colors[r]
        )
      );

      for (let j = 0; j < 5; j++) {
        const x =
          CX + (j - 2) * 1.02;

        a.push(
          ticket(
            x,
            y,
            script,
            j < count[r],
            0.77,
            0.53
          )
        );
      }

      a.push(
        text(
          `Choose ${count[r]} of 5 = ${
            choose(5, count[r])
          } ways`,
          CX,
          y - 0.58,
          20,
          colors[r],
          true,
          6.3
        )
      );
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // FIVE OLD-CARD CHOICES FOR THE OBSERVED TABLE
  // All five new cards must be resolved.
  // Only the position of the sixth tick changes.
  // ------------------------------------------------------------

  function observedFiveWays() {
    const a = [];

    const firstY = P ? 0.75 : 0.90;
    const pitchY = P ? 0.83 : 0.57;

    a.push(
      text(
        'New cards',
        CX - 1.23,
        firstY + 0.49,
        17,
        NEW
      ),

      text(
        'Old cards',
        CX + 1.23,
        firstY + 0.49,
        17,
        OLD
      )
    );

    for (let r = 0; r < 5; r++) {
      const y =
        firstY - r * pitchY;

      a.push(
        text(
          r + 1,
          CX - 3.12,
          y,
          16,
          C.muted,
          true
        )
      );

      for (let j = 0; j < 10; j++) {
        const group = j < 5 ? 0 : 1;

        const x =
          CX +
          (group === 0 ? -1.23 : 1.23) +
          (j % 5 - 2) * 0.43;

        const resolved =
          j < 5 || j === 5 + r;

        a.push(
          ticket(
            x,
            y,
            group === 0 ? 'new' : 'old',
            resolved,
            0.35,
            0.29
          )
        );
      }

      a.push(
        rounded(
          CX + 1.23 + (r - 2) * 0.43,
          y,
          0.40,
          0.34,
          YES,
          0,
          2
        )
      );
    }

    a.push(
      text(
        'Exactly 5 possible allocations',
        CX,
        firstY - 4 * pitchY - 0.59,
        19,
        NEW
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // BOTH EXTREME TABLES
  // ------------------------------------------------------------

  function twoExtremeTables() {
    const a = [];

    const centers = [
      CX - 1.68,
      CX + 1.68
    ];

    const top = P ? 0.75 : 0.85;
    const rowPitch = P ? 0.92 : 0.77;

    const tables = [
      [
        [1, 4],
        [5, 0]
      ],

      [
        [5, 0],
        [1, 4]
      ]
    ];

    centers.forEach((center, i) => {
      const color = i === 0 ? OLD : NEW;

      a.push(
        text(
          i === 0
            ? 'Other extreme'
            : 'Observed',
          center,
          top + 0.65,
          20,
          color,
          false,
          3.0
        )
      );

      const xs = [
        center - 0.18,
        center + 0.86
      ];

      a.push(
        text(
          'Yes',
          xs[0],
          top,
          15,
          YES
        ),

        text(
          'No',
          xs[1],
          top,
          15,
          NO
        )
      );

      tables[i].forEach((row, r) => {
        const y =
          top - (r + 1) * rowPitch;

        const rowColor =
          r === 0 ? NEW : OLD;

        a.push(
          text(
            r === 0 ? 'New' : 'Old',
            center - 1.13,
            y,
            15,
            rowColor
          )
        );

        row.forEach((n, c) => {
          a.push(
            rounded(
              xs[c],
              y,
              0.91,
              rowPitch - 0.10,
              rowColor,
              0.10
            ),

            text(
              n,
              xs[c],
              y,
              26,
              rowColor,
              true
            )
          );
        });
      });

      a.push(
        text(
          '5 ways',
          center,
          top - 2 * rowPitch - 0.65,
          22,
          color,
          true
        )
      );
    });

    a.push(
      text(
        '+',
        CX,
        top - 1.50 * rowPitch,
        29,
        C.ink,
        true
      ),

      text(
        'Same probability: 5 / 210 each',
        CX,
        P ? -3.2 : -2.55,
        19,
        C.violet,
        true,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // PROBABILITY SCALE
  // The exact 4.7619% result lies just below 5%.
  // ------------------------------------------------------------

  function probabilityScale() {
    const a = [];

    const maxP = 0.10;

    const w = P ? 6.1 : 6.4;
    const x0 = CX - w / 2;

    const y = P ? -0.40 : -0.35;

    const X = v =>
      x0 + v / maxP * w;

    a.push(
      rect(
        X(ALPHA / 2),
        y,
        w * ALPHA / maxP,
        0.48,
        YES,
        0.23,
        0
      ),

      rect(
        X((ALPHA + maxP) / 2),
        y,
        w * (maxP - ALPHA) / maxP,
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

    for (let i = 0; i <= 10; i++) {
      const value = i / 100;

      a.push(
        line(
          X(value),
          y - 0.10,
          X(value),
          y + 0.10,
          C.muted,
          1
        )
      );

      if (
        i === 0 ||
        i === 2 ||
        i === 5 ||
        i === 8 ||
        i === 10
      ) {
        a.push(
          text(
            `${i}%`,
            X(value),
            y - 0.35,
            16,
            C.muted,
            true
          )
        );
      }
    }

    a.push(
      dashed(
        X(ALPHA),
        y - 0.20,
        X(ALPHA),
        y + 1.12,
        C.amber
      ),

      text(
        '5% cutoff',
        X(ALPHA) + 0.83,
        y + 1.24,
        19,
        C.amber
      ),

      line(
        X(PV),
        y - 0.23,
        X(PV),
        y + 0.67,
        NEW,
        3
      ),

      dot(
        X(PV),
        y,
        NEW,
        0.11
      ),

      line(
        X(PV),
        y + 0.67,
        X(PV) - 0.75,
        y + 0.83,
        NEW,
        1.5
      ),

      text(
        'p = 4.76%',
        X(PV) - 1.15,
        y + 1.00,
        22,
        NEW,
        true
      ),

      text(
        'Reject',
        X(0.025),
        y - 0.92,
        20,
        YES
      ),

      text(
        'Do not reject',
        X(0.075),
        y - 0.92,
        19,
        C.muted
      ),

      text(
        'Only just below the cutoff',
        CX,
        y - 1.52,
        20,
        C.amber
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // DRAWING WITHOUT REPLACEMENT
  // Six tickets are selected from ten.
  // ------------------------------------------------------------

  function hypergeometricPicture(
    drawn = 6
  ) {
    const a = [];

    const selected = MIDDLE_MARKS.slice(0, drawn);

    const upperY = P ? 0.85 : 0.72;
    const lowerY = P ? -1.95 : -1.45;

    a.push(
      text(
        'Original ten cards',
        CX,
        upperY + 0.65,
        21,
        C.ink
      ),

      text(
        'Drawn without replacement',
        CX,
        lowerY + 0.66,
        20,
        C.violet
      )
    );

    for (let i = 0; i < TOTAL; i++) {
      const x =
        CX + (i - 4.5) * 0.60;

      const script =
        i < 5 ? 'new' : 'old';

      if (selected.includes(i)) {
        a.push(
          rounded(
            x,
            upperY,
            0.48,
            0.45,
            C.muted,
            0.025,
            1
          ),

          text(
            '–',
            x,
            upperY,
            16,
            C.muted
          )
        );
      } else {
        a.push(
          ticket(
            x,
            upperY,
            script,
            null,
            0.48,
            0.45
          )
        );
      }
    }

    a.push(
      line(
        CX,
        upperY - 0.55,
        CX,
        lowerY + 1.05,
        C.violet,
        2
      ),

      text(
        '↓',
        CX,
        lowerY + 1.10,
        25,
        C.violet
      )
    );

    for (let j = 0; j < RESOLVED; j++) {
      const x =
        CX + (j - 2.5) * 0.85;

      if (j < selected.length) {
        const i = selected[j];

        a.push(
          ticket(
            x,
            lowerY,
            i < 5 ? 'new' : 'old',
            true,
            0.68,
            0.53
          )
        );
      } else {
        a.push(
          rounded(
            x,
            lowerY,
            0.68,
            0.53,
            C.muted,
            0.02,
            1
          )
        );
      }
    }

    a.push(
      text(
        `${TOTAL - drawn} remaining; ${drawn} selected`,
        CX,
        lowerY - 0.55,
        18,
        C.muted,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // SMALL MEDICAL TRIAL EXAMPLE
  // No invented numerical results.
  // ------------------------------------------------------------

  function medicalExample() {
    const a = [];

    const lx = CX - 2.45;
    const xs = [
      CX - 0.40,
      CX + 1.75
    ];

    const ys = [
      0.12,
      -1.05
    ];

    a.push(
      text(
        'Small medical trial',
        CX,
        1.39,
        22,
        C.violet
      ),

      text(
        'Side effect',
        xs[0],
        0.86,
        18,
        C.amber
      ),

      text(
        'No side effect',
        xs[1],
        0.86,
        18,
        C.muted
      ),

      text(
        'Treatment',
        lx,
        ys[0],
        18,
        NEW,
        false,
        1.65
      ),

      text(
        'Control',
        lx,
        ys[1],
        18,
        OLD
      )
    );

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        a.push(
          rounded(
            xs[c],
            ys[r],
            1.83,
            0.91,
            r === 0 ? NEW : OLD,
            0.06
          ),

          text(
            '?',
            xs[c],
            ys[r],
            29,
            C.ink,
            true
          )
        );
      }
    }

    a.push(
      text(
        'Two groups × two outcomes',
        CX,
        -2.0,
        20,
        C.violet
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // SMALL SAMPLE LIMITATION
  // Exact probabilities do not create additional information.
  // ------------------------------------------------------------

  function smallSamplePicture() {
    const a = [];

    const y = P ? 0.55 : 0.64;

    a.push(
      text(
        'Only ten observations',
        CX,
        y + 0.65,
        22,
        C.amber
      )
    );

    for (let i = 0; i < TOTAL; i++) {
      const x =
        CX + (i - 4.5) * 0.59;

      a.push(
        ticket(
          x,
          y,
          i < 5 ? 'new' : 'old',
          OBSERVED_MARKS.includes(i),
          0.47,
          0.43
        )
      );
    }

    const emptyY =
      P ? -0.45 : -0.17;

    for (let r = 0; r < 3; r++) {
      for (let j = 0; j < 10; j++) {
        a.push(
          rounded(
            CX + (j - 4.5) * 0.59,
            emptyY - r * 0.40,
            0.47,
            0.29,
            C.muted,
            0.015,
            0.65
          )
        );
      }
    }

    a.push(
      text(
        'More data would give more information',
        CX,
        emptyY - 1.35,
        19,
        C.muted,
        false,
        6.4
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // OBSERVED RESOLUTION RATES
  // Five out of five versus one out of five.
  // ------------------------------------------------------------

  function observedRatePicture() {
    const a = [];

    const barW = P ? 5.65 : 5.90;
    const left = CX - barW / 2;

    const ys = [
      P ? 0.30 : 0.42,
      P ? -1.50 : -1.12
    ];

    const values = [1, 0.20];

    values.forEach((v, r) => {
      const y = ys[r];

      const color =
        r === 0 ? NEW : OLD;

      a.push(
        text(
          r === 0
            ? 'New script'
            : 'Old script',
          CX,
          y + 0.72,
          22,
          color
        ),

        rounded(
          CX,
          y,
          barW,
          0.58,
          color,
          0.04,
          2
        )
      );

      const goodW = barW * v;
      const badW = barW * (1 - v);

      a.push(
        rect(
          left + goodW / 2,
          y,
          goodW,
          0.58,
          YES,
          0.75,
          1
        )
      );

      if (badW > 0) {
        a.push(
          rect(
            left + goodW + badW / 2,
            y,
            badW,
            0.58,
            NO,
            0.23,
            1
          )
        );
      }

      for (let j = 1; j < 5; j++) {
        const xx =
          left + barW * j / 5;

        a.push(
          line(
            xx,
            y - 0.29,
            xx,
            y + 0.29,
            C.card,
            2
          )
        );
      }

      a.push(
        text(
          r === 0
            ? '5 of 5 = 100%'
            : '1 of 5 = 20%',
          CX,
          y - 0.61,
          23,
          color,
          true
        )
      );
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // COMPARISON OF EXACT P-VALUES
  // The observed margins allow only five different tables.
  // ------------------------------------------------------------

  function discreteProbabilityPicture() {
    const a = [];

    const probabilities = KS.map(k => {
      const n = WAYS[k - 1];

      const total = WAYS.reduce(
        (sum, w) =>
          sum + (w <= n ? w : 0),
        0
      );

      return total / ALL_WAYS;
    });

    const base = P ? -3.05 : -1.70;
    const h = P ? 3.9 : 2.5;

    KS.forEach((k, i) => {
      const x = kx(k);

      const color = probabilities[i] < ALPHA
        ? k === 5 ? NEW : OLD
        : C.violet;

      const hh = probabilities[i] * h;

      a.push(
        rect(
          x,
          base + hh / 2,
          0.77,
          hh,
          color,
          0.70,
          1
        ),

        text(
          probabilities[i].toFixed(3),
          x,
          base + hh + 0.24,
          16,
          color,
          true,
          KSP - 0.03
        ),

        text(
          k,
          x,
          base - 0.30,
          20,
          NEW,
          true
        )
      );
    });

    a.push(
      dashed(
        CX - 3.20,
        base + ALPHA * h,
        CX + 3.20,
        base + ALPHA * h,
        C.amber
      ),

      text(
        '5% line',
        CX + 2.02,
        base + ALPHA * h + 0.47,
        15,
        C.amber
      ),

      line(
        CX - 3.20,
        base,
        CX + 3.20,
        base,
        C.muted,
        2
      ),

      text(
        'New-script tickets resolved',
        CX,
        base - 0.75,
        17,
        NEW
      ),

      text(
        'Only the two most extreme tables reject',
        CX,
        P ? -4.40 : -2.75,
        18,
        C.amber,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ============================================================
  // NARRATION BEATS
  // ============================================================

  // ------------------------------------------------------------
  // 0. A small specialist team for rare hardware problems.
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...scene(specialistDesk()),

    ...say(
      'A SMALL SPECIALIST HELP DESK',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 1. Only ten tickets.
  // ------------------------------------------------------------

  const cards = [];

  for (let i = 0; i < TOTAL; i++) {
    const p = cardSlot(i);

    cards.push(
      ticket(
        p[0],
        p[1],
        null,
        null,
        CARD_W,
        CARD_H
      )
    );
  }

  const newHeading = text(
    'New script',
    CX,
    NEW_Y + 0.65,
    21,
    NEW
  );

  const oldHeading = text(
    'Old script',
    CX,
    OLD_Y + 0.65,
    21,
    OLD
  );

  await until(S(1));

  await play(
    ...scene(null),

    new M.LaggedStart(
      cards.map(t =>
        new M.FadeIn(t)
      ),
      {
        lagRatio: 0.07,
        runTime: 1.2
      }
    ),

    ...fbox([
      ['10 trial tickets', C.cyan]
    ]),

    ...say('ONLY TEN TICKETS')
  );

  // ------------------------------------------------------------
  // 2. Five tickets got the new script; all five resolved.
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    new M.FadeIn(newHeading),

    new M.LaggedStart(
      cards.slice(0, 5).map((t, i) => {
        const p = cardSlot(i);

        return new M.Transform(
          t,
          ticket(
            p[0],
            p[1],
            'new',
            true,
            CARD_W,
            CARD_H
          )
        );
      }),
      {
        lagRatio: 0.10,
        runTime: 1.1
      }
    ),

    ...fbox([
      ['New script', NEW],
      '5 tickets',
      ['5 resolved', YES]
    ]),

    ...say(
      'NEW SCRIPT: ALL FIVE RESOLVED',
      NEW
    )
  );

  // ------------------------------------------------------------
  // 3. Five tickets got the old script; only one resolved.
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    new M.FadeIn(oldHeading),

    new M.LaggedStart(
      cards.slice(5).map((t, j) => {
        const i = j + 5;
        const p = cardSlot(i);

        return new M.Transform(
          t,
          ticket(
            p[0],
            p[1],
            'old',
            j === 0,
            CARD_W,
            CARD_H
          )
        );
      }),
      {
        lagRatio: 0.10,
        runTime: 1.1
      }
    ),

    ...fbox([
      ['Old script', OLD],
      '5 tickets',
      ['1 resolved', YES],
      ['4 not resolved', NO]
    ]),

    ...say(
      'OLD SCRIPT: ONLY ONE RESOLVED',
      OLD
    )
  );

  // ------------------------------------------------------------
  // 4. Sort into a 2 × 2 table.
  // ------------------------------------------------------------

  const observedOutline = tableOutline({
    margins: false
  });

  await until(S(4));

  await play(
    new M.FadeOut(
      new M.VGroup(
        newHeading,
        oldHeading
      )
    ),

    ...scene(observedOutline),

    new M.LaggedStart(
      cards.map((t, i) => {
        const p =
          observedCellSlot(i);

        return new M.Transform(
          t,
          ticket(
            p[0],
            p[1],
            i < 5 ? 'new' : 'old',
            OBSERVED_MARKS.includes(i),
            0.23,
            0.23
          ),
          {
            pathArc: i < 5
              ? -0.25
              : 0.25
          }
        );
      }),
      {
        lagRatio: 0.065,
        runTime: 2.0
      }
    ),

    ...fbox([
      '2 rows: scripts',
      '2 columns: outcomes'
    ]),

    ...say('SORT INTO A 2 × 2 TABLE')
  );

  // ------------------------------------------------------------
  // 5. New: five and zero. Old: one and four.
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    new M.FadeOut(
      new M.VGroup(...cards)
    ),

    ...scene(countTable(OBS, {
      margins: false,
      title: 'Observed counts'
    })),

    ...fbox([
      ['New: 5 yes, 0 no', NEW],
      ['Old: 1 yes, 4 no', OLD]
    ]),

    ...say('THE OBSERVED TABLE')
  );

  // ------------------------------------------------------------
  // 6. Is this real, or luck?
  // ------------------------------------------------------------

  await until(S(6));

  await play(
    ...scene(observedRatePicture()),

    ...fbox([
      ['New: 100%', NEW],
      ['Old: 20%', OLD],
      'Only 5 tickets per script'
    ]),

    ...say(
      'REAL DIFFERENCE OR JUST LUCK?',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 7. Last lesson: expected counts and chi-square.
  // ------------------------------------------------------------

  await until(S(7));

  await play(
    ...scene(countTable(OBS, {
      margins: true
    })),

    ...fbox([
      'Previous method:',
      'Find expected counts',
      ['χ² = Σ (O − E)² / E', C.violet]
    ], C.violet),

    ...say(
      'COULD WE USE CHI-SQUARE?',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 8. Margins: 6 resolved, 4 not; 5 new, 5 old.
  // ------------------------------------------------------------

  await until(S(8));

  await play(
    ...scene(countTable(OBS, {
      margins: true,
      marginFocus: true
    })),

    ...fbox([
      'Fixed totals',
      ['5 new; 5 old', C.amber],
      ['6 resolved; 4 not', C.amber],
      'Grand total = 10'
    ], C.amber),

    ...say(
      'LOOK AT THE MARGINS',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 9. Expected counts: 3, 2, 3, 2. All below five.
  // ------------------------------------------------------------

  await until(S(9));

  await play(
    ...scene(countTable(EXP, {
      margins: true,
      expected: true,
      tiny: true,
      title: 'Expected counts'
    })),

    ...fbox([
      '5 × 6 / 10 = 3',
      '5 × 4 / 10 = 2',
      ['All expected cells < 5', C.amber]
    ], C.amber),

    ...say(
      'EVERY EXPECTED COUNT IS TINY',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 10. Chi-square approximation is unreliable here.
  // We need an exact count.
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    new M.Indicate(
      picture,
      {
        color: C.amber,
        runTime: 0.8
      }
    ),

    ...fbox([
      ['Chi-square approximation', C.muted],
      'Not reliable here',
      ['Count the possibilities exactly', YES]
    ], C.amber),

    ...say(
      'USE EXACT COUNTING INSTEAD',
      YES
    )
  );

  // ------------------------------------------------------------
  // 11. Keep the margins fixed.
  // Exactly six of ten tickets are resolved.
  // ------------------------------------------------------------

  await until(S(11));

  await play(
    ...scene(fixedMarginsPicture()),

    ...fbox([
      ['Keep the margins fixed', C.amber],
      '5 new and 5 old',
      ['Exactly 6 ticks', YES],
      'Exactly 4 crosses'
    ], C.amber),

    ...say(
      'KEEP THE TOTALS FIXED',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 12. Take the totals as given.
  // Ask only how the six ticks were allocated.
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...scene(allocationPicture(
      OBSERVED_MARKS,
      'The observed allocation'
    )),

    ...fbox([
      'The totals stay the same',
      ['Only the positions change', C.violet]
    ], C.violet),

    ...say(
      'WHERE DID THE SIX TICKS LAND?',
      C.violet
    )
  );

  await until(S(12) + 2.4);

  await play(
    ...scene(allocationPicture(
      MIDDLE_MARKS,
      'Another possible allocation'
    ))
  );

  await until(S(12) + 4.4);

  await play(
    ...scene(allocationPicture(
      REVERSE_MARKS,
      'Another possible allocation'
    ))
  );

  // ------------------------------------------------------------
  // 13. Ten cards: five cyan, five amber.
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...scene(cardRows(null)),

    ...fbox([
      ['5 cyan cards = new', NEW],
      ['5 amber cards = old', OLD]
    ]),

    ...say('TEN DISTINCT CARDS')
  );

  // ------------------------------------------------------------
  // 14. Under the null, the script makes no difference.
  // Randomly choose six cards for the green ticks.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...scene(allocationPicture(
      MIDDLE_MARKS,
      'Example of a luck-only allocation'
    )),

    ...fbox([
      'Null hypothesis',
      'Script does not matter',
      ['Six ticks allocated at random', YES]
    ], C.violet),

    ...say(
      'UNDER THE NULL: RANDOM TICK POSITIONS',
      C.violet
    )
  );

  await until(S(14) + 2.2);

  await play(
    ...scene(allocationPicture(
      [0, 2, 3, 4, 5, 8],
      'Another luck-only allocation'
    ))
  );

  await until(S(14) + 3.8);

  await play(
    ...scene(allocationPicture(
      [1, 4, 5, 6, 7, 9],
      'Another luck-only allocation'
    ))
  );

  // ------------------------------------------------------------
  // 15. Choose six cards out of ten: 210 ways.
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    ...scene(allAllocationsPicture()),

    ...fbox([
      'Choose 6 from 10',
      'C(10, 6)',
      ['= 210 ways', C.cyan]
    ]),

    ...say(
      '210 POSSIBLE ALLOCATIONS'
    )
  );

  // ------------------------------------------------------------
  // 16. All 210 allocations are equally likely under the null.
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    ...fbox([
      'Under the null',
      'Each allocation has probability',
      ['1 / 210', C.violet]
    ], C.violet),

    ...say(
      'EVERY ALLOCATION IS EQUALLY LIKELY',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 17. Group allocations by number of new cards with ticks.
  // ------------------------------------------------------------

  await until(S(17));

  await play(
    ...scene(possibleTables()),

    ...fbox([
      'Group by k',
      ['k = new-script ticks', NEW]
    ]),

    ...say(
      'GROUP BY THE NUMBER OF NEW TICKS'
    )
  );

  // ------------------------------------------------------------
  // 18. New ticks can be 1, 2, 3, 4 or 5.
  // Zero is impossible because six ticks must land.
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...scene(possibleTables(
      null,
      true
    )),

    ...fbox([
      'Possible new ticks:',
      ['1, 2, 3, 4, 5', NEW],
      '0 new would need 6 old',
      ['But only 5 old cards exist', C.amber]
    ]),

    ...say(
      'FIVE POSSIBLE TABLES',
      C.violet
    )
  );

  await until(S(18) + 5.6);

  // Establish the axes before the short counting beats.
  // The bars are added individually, without redrawing old bars.

  await play(
    ...scene(histogramAxes()),

    ...fbox([
      'Count allocations',
      ['For each possible k', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 19. One new tick: five ways.
  // ------------------------------------------------------------

  const bars = [];

  const bar1 = histogramBar(
    1,
    C.violet
  );

  bars.push(bar1);

  await until(S(19));

  await play(
    new M.FadeIn(
      bar1,
      { runTime: 0.35 }
    ),

    ...fbox([
      '1 new; 5 old',
      ['5 × 1 = 5 ways', C.violet]
    ]),

    ...say('1 NEW TICK: 5 WAYS')
  );

  // ------------------------------------------------------------
  // 20. Two new ticks: fifty ways.
  // Short narration beat: 1.2 seconds.
  // ------------------------------------------------------------

  const bar2 = histogramBar(
    2,
    C.violet
  );

  bars.push(bar2);

  await until(S(20));

  await play(
    new M.FadeIn(
      bar2,
      { runTime: 0.25 }
    ),

    ...fbox([
      '2 new; 4 old',
      ['10 × 5 = 50 ways', C.violet]
    ]),

    ...say('2 NEW TICKS: 50 WAYS')
  );

  // ------------------------------------------------------------
  // 21. Three new ticks: one hundred ways.
  // The most likely, because it is the even split.
  // ------------------------------------------------------------

  const bar3 = histogramBar(
    3,
    C.violet
  );

  bars.push(bar3);

  await until(S(21));

  await play(
    new M.FadeIn(
      bar3,
      { runTime: 0.45 }
    ),

    ...fbox([
      '3 new; 3 old',
      '10 × 10',
      ['= 100 ways', C.violet],
      'Most likely table'
    ], C.violet),

    ...say(
      '3 NEW TICKS: 100 WAYS',
      C.violet
    )
  );

  await until(S(21) + 2.0);

  await play(
    new M.Indicate(
      bar3,
      {
        color: C.violet,
        runTime: 0.7
      }
    )
  );

  // ------------------------------------------------------------
  // 22. Four new ticks: fifty ways.
  // Short narration beat: 1.1 seconds.
  // ------------------------------------------------------------

  const bar4 = histogramBar(
    4,
    C.violet
  );

  bars.push(bar4);

  await until(S(22));

  await play(
    new M.FadeIn(
      bar4,
      { runTime: 0.25 }
    ),

    ...fbox([
      '4 new; 2 old',
      ['5 × 10 = 50 ways', C.violet]
    ]),

    ...say('4 NEW TICKS: 50 WAYS')
  );

  // ------------------------------------------------------------
  // 23. Five new ticks: five ways.
  // This is our observed table.
  // ------------------------------------------------------------

  const bar5 = histogramBar(
    5,
    NEW,
    {
      selected: true,
      note: 'Observed'
    }
  );

  bars.push(bar5);

  await until(S(23));

  await play(
    new M.FadeIn(
      bar5,
      { runTime: 0.35 }
    ),

    ...fbox([
      '5 new; 1 old',
      ['1 × 5 = 5 ways', NEW],
      'Our observed table'
    ]),

    ...say(
      '5 NEW TICKS: 5 WAYS',
      NEW
    )
  );

  // ------------------------------------------------------------
  // 24. Check the counts add up to 210.
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    new M.LaggedStart(
      bars.map(b =>
        new M.Indicate(
          b,
          {
            color: C.violet,
            runTime: 0.45
          }
        )
      ),
      {
        lagRatio: 0.12,
        runTime: 1.8
      }
    ),

    ...fbox([
      '5 + 50 + 100 + 50 + 5',
      ['= 210 ways', C.cyan]
    ]),

    ...say(
      'ALL FIVE COUNTS ADD TO 210'
    )
  );

  // ------------------------------------------------------------
  // 25. Our observed table occurs in five of the 210 ways.
  // Show those exact five allocations.
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    new M.FadeOut(
      new M.VGroup(...bars)
    ),

    ...scene(observedFiveWays()),

    ...fbox([
      'Observed table',
      'All 5 new resolved',
      ['5 ways out of 210', NEW]
    ]),

    ...say(
      'OUR TABLE OCCURS IN ONLY FIVE WAYS',
      NEW
    )
  );

  // ------------------------------------------------------------
  // 26. About two and a half in a hundred.
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...fbox([
      '5 / 210',
      ['≈ 0.024', NEW],
      ['≈ 2.4%', NEW]
    ]),

    ...say(
      'ABOUT TWO AND A HALF IN A HUNDRED',
      NEW
    )
  );

  // ------------------------------------------------------------
  // 27. No direction fixed in advance.
  // Count the equally unlikely table in the other direction.
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...scene(twoExtremeTables()),

    ...fbox([
      'Two-sided question',
      ['Our table: 5 ways', NEW],
      ['Other extreme: 5 ways', OLD]
    ], C.violet),

    ...say(
      'COUNT BOTH EQUALLY UNLIKELY EXTREMES',
      C.violet
    )
  );

  await until(S(27) + 4.0);

  await play(
    ...scene(histogram({
      highlight: 'both',
      notes: true
    }))
  );

  // ------------------------------------------------------------
  // 28. Ten ways out of 210.
  // Exact two-sided p-value ≈ 0.048.
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    ...fbox([
      'p = (5 + 5) / 210',
      '  = 10 / 210',
      ['  ≈ ' + PV.toFixed(3), YES]
    ], YES),

    ...say(
      'EXACT TWO-SIDED P-VALUE ≈ 0.048',
      YES
    )
  );

  await until(S(28) + 3.2);

  await play(
    ...scene(allAllocationsPicture('both')),

    ...fbox([
      ['10 extreme allocations', C.amber],
      '210 total allocations',
      ['p ≈ 0.048', YES]
    ], YES)
  );

  // ------------------------------------------------------------
  // 29. Just below five percent.
  // Reject the null, though only just.
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    ...scene(probabilityScale()),

    ...fbox([
      'p ≈ 0.04762',
      ['0.04762 < 0.05', YES],
      'Reject the null',
      ['Only just', C.amber]
    ], YES),

    ...say(
      'JUST BELOW THE 5% LINE',
      YES
    )
  );

  // ------------------------------------------------------------
  // 30. Fisher's exact test.
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...scene(histogram({
      highlight: 'both',
      notes: true
    })),

    ...fbox([
      ['Fisher’s exact test', C.violet],
      'Exact counting',
      'Fixed margins',
      ['No chi-square approximation', YES]
    ], C.violet),

    ...say(
      'FISHER’S EXACT TEST',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 31. Five bars: 5, 50, 100, 50, 5.
  // Our bar is at the far right.
  // ------------------------------------------------------------

  await until(S(31));

  await play(
    ...scene(histogram({
      highlight: 'observed',
      notes: true
    })),

    ...fbox([
      'Five possible tables',
      '5, 50, 100, 50, 5',
      ['Observed = far right', NEW]
    ]),

    ...say(
      'OUR TABLE IS AT THE FAR RIGHT',
      NEW
    )
  );

  await until(S(31) + 5.0);

  await play(
    ...scene(histogram({
      highlight: 'both',
      notes: true
    })),

    ...fbox([
      ['Right tail: 5 ways', NEW],
      ['Left tail: 5 ways', OLD],
      ['Both tails: 10 ways', YES]
    ])
  );

  // ------------------------------------------------------------
  // 32. The formula is the counting we just did.
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    ...fbox([
      'Chance of one table',
      ['= its ways / all ways', C.violet]
    ], C.violet),

    ...say(
      'THE FORMULA IS JUST THE COUNTING',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 33. Ways among new × ways among old ÷ all ways.
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    ...scene(choicePicture(5)),

    ...fbox([
      'P(K = k) =',
      ['C(5,k) × C(5,6−k)', C.violet],
      '──────────────────',
      '     C(10,6)'
    ], C.violet),

    ...say(
      'CHOOSE NEW × CHOOSE OLD ÷ ALL WAYS',
      C.violet
    )
  );

  await until(S(33) + 4.4);

  await play(
    ...scene(observedFiveWays()),

    ...fbox([
      ['New: C(5,5) = 1', NEW],
      ['Old: C(5,1) = 5', OLD],
      'All: C(10,6) = 210',
      ['P(K=5) = 1×5/210', YES]
    ])
  );

  // ------------------------------------------------------------
  // 34. Hypergeometric distribution:
  // drawing without putting back.
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...scene(hypergeometricPicture(0)),

    ...fbox([
      ['Hypergeometric distribution', C.violet],
      'Draw without replacement'
    ], C.violet),

    ...say(
      'DRAWING WITHOUT PUTTING BACK',
      C.violet
    )
  );

  await until(S(34) + 1.2);

  await play(
    ...scene(hypergeometricPicture(2))
  );

  await until(S(34) + 2.4);

  await play(
    ...scene(hypergeometricPicture(4))
  );

  await until(S(34) + 3.6);

  await play(
    ...scene(hypergeometricPicture(6)),

    ...fbox([
      'Start with 10 cards',
      'Draw 6 without replacement',
      ['6 selected; 4 left', C.violet]
    ], C.violet)
  );

  // ------------------------------------------------------------
  // 35. Add probabilities of tables as extreme as ours or more.
  // Two-sided Fisher: include every table whose probability
  // is no greater than the observed table's probability.
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    ...scene(histogram({
      highlight: 'both',
      notes: true
    })),

    ...fbox([
      'Include tables at least',
      'as unlikely as observed',
      ['p = 5/210 + 5/210', C.violet],
      ['  ≈ 0.048', YES]
    ], YES),

    ...say(
      'ADD THE CHANCES OF THE EXTREME TABLES',
      YES
    )
  );

  // ------------------------------------------------------------
  // 36. Use Fisher's exact test for small 2 × 2 tables.
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    ...scene(countTable(EXP, {
      margins: true,
      expected: true,
      tiny: true,
      title: 'Small expected counts'
    })),

    ...fbox([
      '2 × 2 contingency table',
      'Small expected counts',
      ['Use exact probabilities', YES]
    ], C.violet),

    ...say(
      'FOR SMALL 2 × 2 TABLES',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 37. Rare side effect in a small medical trial.
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    ...scene(medicalExample()),

    ...fbox([
      'Example:',
      'Treatment vs control',
      'Rare side effect: yes or no'
    ]),

    ...say(
      'EXAMPLE: A RARE MEDICAL SIDE EFFECT',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 38. Common trap: exact tests cannot rescue too little data.
  // ------------------------------------------------------------

  await until(S(38));

  await play(
    ...scene(smallSamplePicture()),

    ...fbox([
      ['Common trap', C.amber],
      'Exact does not mean powerful',
      'Small samples limit information'
    ], C.amber),

    ...say(
      'EXACT COUNTING CANNOT CREATE MORE DATA',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 39. Honest p-value, but only very large differences
  // can be detected with this ten-ticket example.
  // ------------------------------------------------------------

  await until(S(39));

  await play(
    ...scene(discreteProbabilityPicture()),

    ...fbox([
      ['Exact p-values', C.violet],
      'Only five possible tables',
      ['Only the extremes reject', C.amber]
    ]),

    ...say(
      'WITH TEN TICKETS, POWER IS LIMITED',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 40. Even 5/5 against 1/5 was only just significant.
  // ------------------------------------------------------------

  await until(S(40));

  await play(
    ...scene(observedRatePicture()),

    ...fbox([
      ['New: 5/5 = 100%', NEW],
      ['Old: 1/5 = 20%', OLD],
      'Gap = 80 percentage points',
      ['Yet p ≈ 0.048', C.amber]
    ], C.amber),

    ...say(
      'A HUGE OBSERVED GAP — ONLY JUST SIGNIFICANT',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 41. Closing summary.
  // Fisher counts every allocation with the same margins
  // to determine how unusual the observed table is.
  // ------------------------------------------------------------

  await until(S(41));

  await play(
    ...scene(histogram({
      highlight: 'both',
      notes: true
    })),

    ...fbox([
      ['Fisher’s exact test', C.violet],
      'Keep margins fixed',
      'Count all 210 allocations',
      ['p = 10/210 ≈ 0.048', YES]
    ], YES),

    ...say(
      'FIX THE MARGINS → COUNT → FIND THE EXACT P-VALUE',
      YES
    )
  );

  await until(S(41) + 3.8);

  await play(
    ...scene(countTable(OBS, {
      margins: true,
      marginFocus: true,
      title: 'Observed table'
    })),

    ...fbox([
      ['Same margins', C.amber],
      '210 possible allocations',
      '10 at least as unlikely',
      ['Exact p ≈ 0.048', YES]
    ], YES),

    ...say(
      'HOW UNUSUAL IS YOUR TABLE?',
      C.violet
    )
  );

  await until(E(41));

  // ------------------------------------------------------------
  // IMPLEMENTATION NOTES
  // ------------------------------------------------------------
  //
  // All 42 narration beats, S(0) through S(41), are included.
  //
  // Exact counts are calculated rather than estimated:
  //   C(10,6) = 210
  //   WAYS = [5, 50, 100, 50, 5]
  //   P(observed table) = 5/210
  //   Two-sided p = 10/210 ≈ 0.048
  //
  // All 210 individual allocations are also enumerated.
  //
  // Uses the supplied live-engine interface, approved reference
  // conventions, shared chapter data, and responsive layouts.
  //
  // Browser execution, animation timing, and responsive rendering
  // have not been tested against the complete engine.js.
}
