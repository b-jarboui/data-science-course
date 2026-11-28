// lesson 7.3.4
// Chi-square independence test.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C,
    S, E, T, pill, show, showA, until, play
  } = L;

  // ------------------------------------------------------------
  // SHARED CHAPTER DATA
  // ------------------------------------------------------------

  const Q = ['Billing', 'Technical', 'Account'];

  const QC = [
    C.blue || '#60A5FA',
    C.violet,
    C.teal || '#2DD4BF'
  ];

  const OBS = [
    [33, 12],
    [18, 22],
    [21, 14]
  ];

  const EXP = [
    [27, 18],
    [24, 16],
    [21, 14]
  ];

  const ROW = [45, 40, 35];
  const COL = [72, 48];
  const TOTAL = 120;

  const RATE = COL[0] / TOTAL;

  const GAP = OBS.map((row, r) =>
    row.map((v, c) => v - EXP[r][c])
  );

  const SQ = GAP.map(row =>
    row.map(v => v * v)
  );

  const PIECES = SQ.map((row, r) =>
    row.map((v, c) => v / EXP[r][c])
  );

  const CHI = PIECES.flat().reduce((a, b) => a + b, 0);

  const DF = (Q.length - 1) * (COL.length - 1);
  const CUTOFF = 5.991464547;
  const PV = Math.exp(-CHI / 2);

  // ------------------------------------------------------------
  // RESPONSIVE LAYOUT
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;
  const SP = P ? 2.20 : 2.40;

  const PILL = P
    ? [0, 3.85, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 2.5, 0]
    : [4.3, -0.3, 0];

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  const xq = k => CX + (k - 1) * SP;

  const signed = n =>
    n > 0 ? `+${n}` : String(n).replace('-', '−');

  const pieceLabel = n =>
    Number.isInteger(n) ? String(n) : n.toFixed(2);

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
      cornerRadius: radius,
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

  const G = (...items) =>
    new M.VGroup(...items.flat(Infinity).filter(Boolean));

  function dot(x, y, color, radius = 0.10) {
    return new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });
  }

  // ------------------------------------------------------------
  // SCENE MANAGEMENT
  // Only newly created objects are grouped together.
  // Existing on-screen objects are grouped only for removal.
  // ------------------------------------------------------------

  let picture = null;
  let boxNow = null;

  function scene(next) {
    const a = [];

    if (picture) {
      a.push(new M.FadeOut(picture));
    }

    if (next) {
      a.push(new M.FadeIn(next));
    }

    picture = next;

    return a;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [new M.FadeOut(old)];
  }

  // ------------------------------------------------------------
  // FORMULA BOX
  // ------------------------------------------------------------

  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20;
    const lh = P ? 0.35 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const indents = rows.map(([s]) =>
      cw * (s.length - s.trimStart().length)
    );

    const widths = texts.map((t, i) =>
      t.getWidth() + indents[i]
    );

    const wd = Math.max(...widths) + 0.65;
    const ht = rows.length * lh + 0.32;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.16,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.325;

    const top =
      BOXP[1] + ht / 2 - 0.16 - lh / 2;

    texts.forEach((t, i) => {
      t.moveTo([
        left + indents[i] + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = G(r, texts);

    const maxw = P ? FW - 1.2 : 4.6;
    const maxh = P ? 1.75 : 3.4;

    const factor = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (factor < 1) {
      g.scale(factor);
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
  // TICKET CARDS
  // Queue colour = card outline.
  // Green tick = resolved.
  // Grey cross = not resolved.
  // ------------------------------------------------------------

  function ticket(
    x, y, q,
    resolved = null,
    w = 0.25,
    h = 0.20
  ) {
    const card = rounded(
      x, y, w, h,
      QC[q],
      0.16,
      1,
      Math.min(w, h) * 0.12
    );

    let mark1;
    let mark2;

    if (resolved === true) {
      mark1 = line(
        x - w * 0.27,
        y,
        x - w * 0.08,
        y - h * 0.24,
        C.green,
        1.5
      );

      mark2 = line(
        x - w * 0.08,
        y - h * 0.24,
        x + w * 0.28,
        y + h * 0.28,
        C.green,
        1.5
      );
    } else if (resolved === false) {
      mark1 = line(
        x - w * 0.22,
        y - h * 0.23,
        x + w * 0.22,
        y + h * 0.23,
        C.muted,
        1.4
      );

      mark2 = line(
        x - w * 0.22,
        y + h * 0.23,
        x + w * 0.22,
        y - h * 0.23,
        C.muted,
        1.4
      );
    } else {
      mark1 = line(
        x - w * 0.25,
        y,
        x,
        y,
        QC[q],
        1
      );

      mark2 = line(
        x,
        y,
        x + w * 0.25,
        y,
        QC[q],
        1
      );
    }

    return G(card, mark1, mark2);
  }

  // Fixed ticket records from the shared trial.
  // Sorting changes their positions, never their outcomes.

  const DATA = [];

  OBS.forEach((row, r) => {
    row.forEach((n, c) => {
      for (let j = 0; j < n; j++) {
        DATA.push({
          q: r,
          c,
          resolved: c === 0,
          cellIndex: j,
          queueIndex: c === 0 ? j : OBS[r][0] + j
        });
      }
    });
  });

  // ------------------------------------------------------------
  // INITIAL QUEUE PICTURE
  // ------------------------------------------------------------

  const QY = P ? -0.95 : -0.30;
  const QH = P ? 3.7 : 2.65;

  function queueFrames() {
    return G(Q.map((q, k) => {
      const x = xq(k);

      return G(
        rounded(
          x, QY,
          SP - 0.20,
          QH,
          QC[k],
          0.035
        ),

        text(
          q,
          x,
          QY + QH / 2 + 0.30,
          P ? 19 : 21,
          QC[k],
          false,
          SP - 0.12
        ),

        text(
          ROW[k],
          x,
          QY - QH / 2 - 0.30,
          25,
          QC[k],
          true
        )
      );
    }));
  }

  function queueSlot(q, j) {
    const cols = 7;

    const dx = P ? 0.27 : 0.29;
    const dy = P ? 0.32 : 0.27;

    return [
      xq(q) + (j % cols - 3) * dx,

      QY + QH / 2 - 0.38 -
        Math.floor(j / cols) * dy,

      0
    ];
  }

  function queueTicket(d, marked = false) {
    const p = queueSlot(d.q, d.queueIndex);

    return ticket(
      p[0],
      p[1],
      d.q,
      marked ? d.resolved : null,
      P ? 0.23 : 0.25,
      P ? 0.21 : 0.19
    );
  }

  // ------------------------------------------------------------
  // CONTINGENCY TABLE LAYOUT
  // ------------------------------------------------------------

  const TABLE_TOP = P ? 1.15 : 1.12;
  const RH = P ? 1.10 : 0.82;

  const LX = CX - 2.62;

  const TX = [
    CX - 0.94,
    CX + 0.90,
    CX + 2.68
  ];

  const CW = P ? 1.65 : 1.62;
  const CH = RH - 0.09;

  const rowY = r =>
    TABLE_TOP - (r + 1) * RH;

  function tableOutline(
    margins = false,
    focus = null,
    marginFocus = false,
    title = ''
  ) {
    const a = [];

    a.push(
      text(
        'Queue',
        LX,
        TABLE_TOP,
        16,
        C.muted
      ),

      text(
        'Resolved',
        TX[0],
        TABLE_TOP,
        17,
        C.green,
        false,
        CW
      ),

      text(
        'Not resolved',
        TX[1],
        TABLE_TOP,
        17,
        C.muted,
        false,
        CW
      )
    );

    if (title) {
      a.push(text(
        title,
        CX,
        P ? 1.75 : 1.53,
        17,
        C.cyan
      ));
    }

    if (margins) {
      a.push(text(
        'Total',
        TX[2],
        TABLE_TOP,
        17,
        C.amber
      ));
    }

    Q.forEach((q, r) => {
      const y = rowY(r);

      a.push(text(
        q,
        LX,
        y,
        18,
        QC[r],
        false,
        1.5
      ));

      for (let c = 0; c < 2; c++) {
        const active = focus &&
          focus[0] === r &&
          (focus[1] == null || focus[1] === c);

        a.push(
          rounded(
            TX[c],
            y,
            CW,
            CH,
            active ? C.amber : QC[r],
            active ? 0.10 : 0.035,
            active ? 3 : 1.5
          )
        );
      }

      if (margins) {
        a.push(
          rounded(
            TX[2],
            y,
            CW,
            CH,
            C.amber,
            marginFocus ? 0.14 : 0.035,
            marginFocus ? 2.5 : 1
          ),

          text(
            ROW[r],
            TX[2],
            y,
            23,
            C.amber,
            true
          )
        );
      }
    });

    if (margins) {
      const y = rowY(3);

      a.push(text(
        'Total',
        LX,
        y,
        18,
        C.amber
      ));

      [COL[0], COL[1], TOTAL].forEach((n, c) => {
        a.push(
          rounded(
            TX[c],
            y,
            CW,
            CH,
            C.amber,
            marginFocus ? 0.16 : 0.045,
            c === 2 ? 2.5 : 1.5
          ),

          text(
            n,
            TX[c],
            y,
            23,
            C.amber,
            true
          )
        );
      });
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // SORTED TICKET SLOTS
  // Small cards inside their contingency-table cells.
  // ------------------------------------------------------------

  function cellSlot(r, c, j) {
    const cols = 8;

    const dx = 0.185;
    const dy = P ? 0.155 : 0.102;

    const x =
      TX[c] + (j % cols - 3.5) * dx;

    const y =
      rowY(r) +
      (P ? 0.36 : 0.26) -
      Math.floor(j / cols) * dy;

    return [x, y, 0];
  }

  function sortedTicket(d) {
    const p = cellSlot(
      d.q,
      d.c,
      d.cellIndex
    );

    return ticket(
      p[0],
      p[1],
      d.q,
      d.resolved,
      0.155,
      P ? 0.12 : 0.078
    );
  }

  function cellCountLabel(r, c) {
    return text(
      OBS[r][c],
      TX[c],
      rowY(r) - (P ? 0.37 : 0.28),
      P ? 17 : 15,
      c === 0 ? C.green : C.ink,
      true
    );
  }

  // ------------------------------------------------------------
  // TABLE OF NUMERICAL COUNTS
  // ------------------------------------------------------------

  function countTable(
    data,
    {
      margins = false,
      visibleRows = 3,
      focus = null,
      marginFocus = false,
      title = '',
      expected = false
    } = {}
  ) {
    const a = [
      tableOutline(
        margins,
        focus,
        marginFocus,
        title
      )
    ];

    Q.forEach((q, r) => {
      if (r >= visibleRows) return;

      for (let c = 0; c < 2; c++) {
        if (data[r][c] == null) continue;

        const active = focus &&
          focus[0] === r &&
          (focus[1] == null || focus[1] === c);

        a.push(text(
          data[r][c],
          TX[c],
          rowY(r),
          28,
          active
            ? C.amber
            : expected
              ? C.muted
              : C.ink,
          true
        ));
      }
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // MARGIN CALCULATION PICTURE
  // Highlights one row total, one column total, and grand total.
  // ------------------------------------------------------------

  function marginCalculation() {
    const a = [
      countTable(EXP, {
        margins: true,
        expected: true,
        focus: [0, 0]
      })
    ];

    const highlights = [
      [TX[2], rowY(0)],
      [TX[0], rowY(3)],
      [TX[2], rowY(3)]
    ];

    highlights.forEach(([x, y]) => {
      a.push(
        rounded(
          x, y,
          CW + 0.06,
          CH + 0.06,
          C.amber,
          0,
          3
        )
      );
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // OVERALL RESOLUTION SHARE
  // ------------------------------------------------------------

  function overallShare() {
    const w = P ? 6.2 : 6.5;
    const left = CX - w / 2;

    const y = P ? -0.25 : -0.15;

    const goodW = w * RATE;
    const badW = w * (1 - RATE);

    return G(
      text(
        'All 120 trial tickets',
        CX,
        y + 1.12,
        23,
        C.ink
      ),

      rect(
        left + goodW / 2,
        y,
        goodW - 0.03,
        1.08,
        C.green,
        0.76
      ),

      rect(
        left + goodW + badW / 2,
        y,
        badW - 0.03,
        1.08,
        C.muted,
        0.35
      ),

      text(
        '72',
        left + goodW / 2,
        y + 0.10,
        30,
        C.ink,
        true
      ),

      text(
        '48',
        left + goodW + badW / 2,
        y + 0.10,
        30,
        C.ink,
        true
      ),

      text(
        'Resolved',
        left + goodW / 2,
        y - 0.95,
        19,
        C.green
      ),

      text(
        'Not resolved',
        left + goodW + badW / 2,
        y - 0.95,
        18,
        C.muted
      ),

      text(
        '60%',
        left + goodW / 2,
        y - 1.50,
        25,
        C.green,
        true
      ),

      text(
        '40%',
        left + goodW + badW / 2,
        y - 1.50,
        25,
        C.muted,
        true
      )
    );
  }

  // ------------------------------------------------------------
  // RESOLUTION RATES BY QUEUE
  // Every full bar represents all tickets in that queue.
  // ------------------------------------------------------------

  function ratePicture(expected = false) {
    const w = P ? 4.3 : 4.5;
    const left = CX - 1.72;

    const values = expected
      ? [RATE, RATE, RATE]
      : OBS.map((row, r) => row[0] / ROW[r]);

    const a = [];

    values.forEach((v, r) => {
      const y =
        (P ? 0.65 : 0.75) -
        r * (P ? 1.22 : 1.04);

      const goodW = w * v;
      const badW = w * (1 - v);

      a.push(
        text(
          Q[r],
          CX - 2.60,
          y,
          17,
          QC[r],
          false,
          1.50
        ),

        rect(
          left + goodW / 2,
          y,
          goodW,
          0.47,
          C.green,
          0.75,
          1
        ),

        rect(
          left + goodW + badW / 2,
          y,
          badW,
          0.47,
          C.muted,
          0.25,
          1
        ),

        text(
          `${Math.round(v * 100)}%`,
          left + w / 2,
          y + 0.42,
          20,
          C.green,
          true
        )
      );

      if (!expected) {
        a.push(text(
          `${OBS[r][0]} of ${ROW[r]}`,
          left + w + (P ? 0.62 : 0.7),
          y,
          17,
          QC[r],
          true
        ));
      }
    });

    const legendY = P ? -3.15 : -2.35;

    a.push(
      rect(
        CX - 2.35,
        legendY,
        0.22,
        0.22,
        C.green,
        0.8,
        1
      ),

      text(
        'Resolved',
        CX - 1.35,
        legendY,
        17,
        C.green
      ),

      rect(
        CX + 0.35,
        legendY,
        0.22,
        0.22,
        C.muted,
        0.3,
        1
      ),

      text(
        'Not resolved',
        CX + 1.60,
        legendY,
        17,
        C.muted
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // EXPECTED ROW PICTURE
  // Split each queue into 60% resolved and 40% not resolved.
  // ------------------------------------------------------------

  function expectedRowPicture(reveal = 3) {
    const w = P ? 4.15 : 4.35;
    const left = CX - 1.70;

    const a = [];

    Q.forEach((q, r) => {
      const y =
        (P ? 0.65 : 0.75) -
        r * (P ? 1.20 : 1.03);

      a.push(text(
        q,
        CX - 2.55,
        y,
        17,
        QC[r],
        false,
        1.45
      ));

      if (r >= reveal) {
        a.push(
          rect(
            left + w / 2,
            y,
            w,
            0.56,
            QC[r],
            0.035
          ),

          text(
            ROW[r] + ' tickets',
            left + w / 2,
            y,
            18,
            QC[r],
            true
          )
        );

        return;
      }

      const goodW = w * RATE;
      const badW = w * (1 - RATE);

      a.push(
        rect(
          left + goodW / 2,
          y,
          goodW - 0.025,
          0.56,
          C.green,
          0.75,
          1
        ),

        rect(
          left + goodW + badW / 2,
          y,
          badW - 0.025,
          0.56,
          C.muted,
          0.30,
          1
        ),

        text(
          EXP[r][0],
          left + goodW / 2,
          y,
          22,
          C.ink,
          true
        ),

        text(
          EXP[r][1],
          left + goodW + badW / 2,
          y,
          22,
          C.ink,
          true
        ),

        text(
          `${ROW[r]} tickets`,
          left + w / 2,
          y + 0.43,
          15,
          QC[r],
          true
        )
      );
    });

    a.push(
      text(
        '60% resolved',
        left + w * RATE / 2,
        P ? -3.0 : -2.25,
        17,
        C.green
      ),

      text(
        '40% not',
        left + w * RATE + w * (1 - RATE) / 2,
        P ? -3.0 : -2.25,
        17,
        C.muted
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // SIDE-BY-SIDE OBSERVED AND EXPECTED TABLES
  // ------------------------------------------------------------

  function miniTable(
    data,
    center,
    title,
    expected = false,
    focus = null
  ) {
    const a = [];

    const top = P ? 0.65 : 0.69;
    const rh = P ? 0.92 : 0.75;

    const lx = center - 1.09;
    const xs = [center - 0.05, center + 0.98];

    const ww = 0.89;
    const hh = rh - 0.11;

    a.push(
      text(
        title,
        center,
        top + 0.64,
        P ? 20 : 19,
        expected ? C.amber : C.cyan
      ),

      text(
        'Yes',
        xs[0],
        top,
        17,
        C.green
      ),

      text(
        'No',
        xs[1],
        top,
        17,
        C.muted
      )
    );

    Q.forEach((q, r) => {
      const y = top - (r + 1) * rh;

      a.push(text(
        ['Bill.', 'Tech.', 'Acct.'][r],
        lx,
        y,
        17,
        QC[r],
        false,
        0.78
      ));

      for (let c = 0; c < 2; c++) {
        const active = focus &&
          focus[0] === r &&
          (focus[1] == null || focus[1] === c);

        a.push(
          rounded(
            xs[c],
            y,
            ww,
            hh,
            active ? C.amber : QC[r],
            active ? 0.12 : 0.035,
            active ? 2.5 : 1.2
          ),

          text(
            data[r][c],
            xs[c],
            y,
            P ? 23 : 22,
            active
              ? C.amber
              : expected
                ? C.muted
                : C.ink,
            true
          )
        );
      }
    });

    return G(a);
  }

  function dualTables(focus = null) {
    const offset = P ? 1.78 : 1.80;

    const a = [
      miniTable(
        OBS,
        CX - offset,
        'Observed',
        false,
        focus
      ),

      miniTable(
        EXP,
        CX + offset,
        'Expected',
        true,
        focus
      ),

      line(
        CX,
        1.25,
        CX,
        P ? -2.55 : -1.95,
        C.muted,
        1
      )
    ];

    if (focus) {
      const r = focus[0];
      const c = focus[1] == null ? 0 : focus[1];

      a.push(text(
        `${OBS[r][c]} − ${EXP[r][c]} = ${signed(GAP[r][c])}`,
        CX,
        P ? -3.1 : -2.35,
        22,
        GAP[r][c] === 0 ? C.green : C.amber,
        true
      ));
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // CELL CONTRIBUTIONS
  // Each contribution = (observed - expected)^2 / expected.
  // ------------------------------------------------------------

  function contributionTable(
    reveal = 6,
    focus = -1
  ) {
    const a = [];

    const top = P ? 0.98 : 0.98;
    const rh = P ? 0.98 : 0.83;

    const lx = CX - 2.30;

    const xs = [
      CX - 0.30,
      CX + 1.60
    ];

    a.push(
      text(
        'Queue',
        lx,
        top,
        17,
        C.muted
      ),

      text(
        'Resolved',
        xs[0],
        top,
        17,
        C.green
      ),

      text(
        'Not resolved',
        xs[1],
        top,
        17,
        C.muted
      )
    );

    Q.forEach((q, r) => {
      const y = top - (r + 1) * rh;

      a.push(text(
        q,
        lx,
        y,
        18,
        QC[r]
      ));

      for (let c = 0; c < 2; c++) {
        const i = r * 2 + c;
        const active = i === focus;

        a.push(
          rounded(
            xs[c],
            y,
            1.68,
            rh - 0.10,
            active ? C.amber : QC[r],
            active ? 0.14 : 0.045,
            active ? 3 : 1.5
          )
        );

        if (i < reveal) {
          a.push(text(
            pieceLabel(PIECES[r][c]),
            xs[c],
            y,
            27,
            PIECES[r][c] === 0
              ? C.muted
              : C.green,
            true
          ));
        }
      }
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // VISUAL CALCULATION OF ONE CELL
  // ------------------------------------------------------------

  function cellComparison(r, c) {
    const a = [];

    const expected = EXP[r][c];
    const observed = OBS[r][c];

    const base = P ? -3.25 : -1.95;
    const scale = P ? 0.115 : 0.080;

    const xs = [
      CX - 1.50,
      CX + 1.50
    ];

    const vals = [expected, observed];

    a.push(
      text(
        Q[r] + ': ' +
          (c === 0 ? 'resolved' : 'not resolved'),
        CX,
        1.35,
        20,
        QC[r]
      ),

      line(
        CX - 3.0,
        base,
        CX + 3.0,
        base
      )
    );

    vals.forEach((n, i) => {
      const h = n * scale;

      a.push(
        rect(
          xs[i],
          base + h / 2,
          1.25,
          h,
          QC[r],
          i === 0 ? 0 : 0.80,
          i === 0 ? 2.5 : 1
        ),

        text(
          n,
          xs[i],
          base + h + 0.26,
          23,
          QC[r],
          true
        ),

        text(
          i === 0 ? 'Expected' : 'Observed',
          xs[i],
          base - 0.38,
          18,
          i === 0 ? C.muted : C.cyan
        )
      );
    });

    const yy1 = base + expected * scale;
    const yy2 = base + observed * scale;

    if (expected !== observed) {
      a.push(
        line(
          CX,
          yy1,
          CX,
          yy2,
          C.amber,
          3
        ),

        line(
          CX - 0.10,
          yy1,
          CX + 0.10,
          yy1,
          C.amber
        ),

        line(
          CX - 0.10,
          yy2,
          CX + 0.10,
          yy2,
          C.amber
        ),

        text(
          signed(observed - expected),
          CX,
          Math.max(yy1, yy2) + 0.29,
          24,
          C.amber,
          true
        )
      );
    } else {
      a.push(text(
        'Gap = 0',
        CX,
        0.95,
        24,
        C.green,
        true
      ));
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // CONTRIBUTION BARS
  // Six cells, including both zero contributions.
  // ------------------------------------------------------------

  function contributionBars() {
    const base = P ? -3.15 : -1.88;
    const maxH = P ? 4.10 : 2.70;
    const sp = P ? 1.02 : 1.06;

    const a = [
      line(
        CX - sp * 3.1,
        base,
        CX + sp * 3.1,
        base
      )
    ];

    PIECES.flat().forEach((v, i) => {
      const r = Math.floor(i / 2);
      const c = i % 2;

      const x =
        CX + (i - 2.5) * sp;

      const h = v / 2.5 * maxH;

      if (v > 0) {
        a.push(
          rect(
            x,
            base + h / 2,
            0.73,
            h,
            QC[r],
            c === 0 ? 0.82 : 0.45
          ),

          rect(
            x,
            base + h / 2,
            0.85,
            h + 0.05,
            QC[r],
            0.10,
            0
          )
        );
      } else {
        a.push(
          line(
            x - 0.32,
            base,
            x + 0.32,
            base,
            QC[r],
            4
          )
        );
      }

      a.push(
        text(
          pieceLabel(v),
          x,
          base + h + 0.25,
          19,
          v === 0 ? C.muted : QC[r],
          true
        ),

        text(
          c === 0 ? 'Yes' : 'No',
          x,
          base - 0.29,
          15,
          c === 0 ? C.green : C.muted
        )
      );
    });

    Q.forEach((q, r) => {
      const x = CX + (r - 1) * sp * 2;

      a.push(
        line(
          x - sp * 0.86,
          base - 0.54,
          x + sp * 0.86,
          base - 0.54,
          QC[r],
          2
        ),

        text(
          q,
          x,
          base - 0.80,
          16,
          QC[r],
          false,
          sp * 1.85
        )
      );
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // DEGREES OF FREEDOM
  // Two free cells remain when margins are fixed.
  // ------------------------------------------------------------

  function degreesPicture() {
    const a = [
      countTable(EXP, {
        margins: true,
        expected: true
      })
    ];

    for (let r = 0; r < 2; r++) {
      a.push(
        rounded(
          TX[0],
          rowY(r),
          CW + 0.06,
          CH + 0.06,
          C.violet,
          0,
          3
        )
      );
    }

    for (let r = 0; r < 3; r++) {
      a.push(
        rounded(
          TX[1],
          rowY(r),
          CW + 0.03,
          CH + 0.03,
          C.muted,
          0,
          1
        )
      );
    }

    a.push(
      rounded(
        TX[0],
        rowY(2),
        CW + 0.03,
        CH + 0.03,
        C.muted,
        0,
        1
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // CHI-SQUARE NULL DISTRIBUTION
  // df = 2
  // Density: f(x) = 0.5 exp(-x / 2), x >= 0.
  // ------------------------------------------------------------

  function luckCurve(
    showCutoff = true,
    showObserved = true
  ) {
    const w = P ? 6.2 : 6.8;
    const h = P ? 4.0 : 2.65;

    const x0 = CX - w / 2;
    const y0 = P ? -3.40 : -1.90;

    const xmax = 14;
    const segments = 140;

    const X = v =>
      x0 + w * v / xmax;

    const Y = v =>
      y0 + h * Math.exp(-v / 2);

    const a = [
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
        Y(0) + 0.10,
        C.muted,
        2
      )
    ];

    // Shade the tail first, then draw the density curve.

    for (let i = 0; i < segments; i++) {
      const v =
        xmax * (i + 0.5) / segments;

      if (!showCutoff || v < CUTOFF) continue;

      const hh = Y(v) - y0;

      const color =
        showObserved && v >= CHI
          ? C.cyan
          : C.amber;

      a.push(
        rect(
          X(v),
          y0 + hh / 2,
          w / segments + 0.008,
          hh,
          color,
          0.62,
          0
        )
      );
    }

    for (let i = 0; i < segments; i++) {
      const u = xmax * i / segments;
      const v = xmax * (i + 1) / segments;

      a.push(
        line(
          X(u),
          Y(u),
          X(v),
          Y(v),
          C.violet,
          3
        )
      );
    }

    for (let v = 0; v <= xmax; v += 2) {
      a.push(
        line(
          X(v),
          y0,
          X(v),
          y0 - 0.07,
          C.muted,
          1
        ),

        text(
          v,
          X(v),
          y0 - 0.28,
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
        y0 - 0.73,
        17,
        C.muted
      ),

      text(
        'df = 2',
        CX + 2.05,
        y0 + h - 0.10,
        20,
        C.violet,
        true
      )
    );

    if (showCutoff) {
      const yy = y0 + h * 0.69;

      a.push(
        dashed(
          X(CUTOFF),
          y0,
          X(CUTOFF),
          yy,
          C.amber
        ),

        text(
          '5.99',
          X(CUTOFF),
          yy + 0.24,
          20,
          C.amber,
          true
        ),

        text(
          '5% cutoff',
          X(CUTOFF),
          yy + 0.57,
          16,
          C.amber
        )
      );
    }

    if (showObserved) {
      const yy = y0 + h * 0.36;

      a.push(
        dashed(
          X(CHI),
          y0,
          X(CHI),
          yy,
          C.cyan
        ),

        text(
          CHI.toFixed(2),
          X(CHI) + 0.23,
          yy + 0.24,
          20,
          C.cyan,
          true
        ),

        text(
          'Our result',
          X(CHI) + 0.65,
          yy + 0.57,
          15,
          C.cyan
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // PROBABILITY PICTURE
  // An illustrative hundred luck-only worlds.
  // ------------------------------------------------------------

  function hundredWorlds(n = 3) {
    const a = [];

    for (let i = 0; i < 100; i++) {
      const x =
        CX + (i % 10 - 4.5) * 0.46;

      const y =
        0.90 - Math.floor(i / 10) * 0.27;

      const active = i >= 100 - n;

      a.push(
        rounded(
          x,
          y,
          0.35,
          0.18,
          active ? C.cyan : C.muted,
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
        -2.10,
        25,
        C.cyan,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // APPLICATION EXAMPLE
  // Two categorical questions: region and product choice.
  // ------------------------------------------------------------

  function regionProductPicture() {
    const a = [];

    const left = CX - 1.65;
    const right = CX + 1.65;

    a.push(
      text(
        'Question 1',
        left,
        1.30,
        16,
        C.muted
      ),

      text(
        'Question 2',
        right,
        1.30,
        16,
        C.muted
      ),

      text(
        'Region',
        left,
        0.83,
        24,
        C.cyan
      ),

      text(
        'Product choice',
        right,
        0.83,
        22,
        C.violet
      )
    );

    const regions = ['North', 'South', 'West'];
    const products = ['Product A', 'Product B'];

    regions.forEach((v, i) => {
      const y = 0.08 - i * 0.70;

      a.push(
        rounded(
          left,
          y,
          2.25,
          0.55,
          QC[i],
          0.10
        ),

        text(
          v,
          left,
          y,
          19,
          QC[i]
        )
      );
    });

    products.forEach((v, i) => {
      const y = -0.20 - i * 0.90;

      a.push(
        rounded(
          right,
          y,
          2.35,
          0.64,
          C.violet,
          0.10
        ),

        text(
          v,
          right,
          y,
          19,
          C.violet
        )
      );
    });

    a.push(
      text(
        '?',
        CX,
        -0.55,
        32,
        C.amber,
        true
      ),

      text(
        'Are the two answers linked?',
        CX,
        -2.10,
        21,
        C.ink
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // ASSOCIATION IS NOT CAUSATION
  // ------------------------------------------------------------

  function causationPicture() {
    const a = [];

    const left = CX - 1.65;
    const right = CX + 1.65;

    a.push(
      rounded(
        left,
        0.22,
        2.65,
        0.95,
        QC[1],
        0.08
      ),

      text(
        'Technical queue',
        left,
        0.22,
        20,
        QC[1],
        false,
        2.40
      ),

      rounded(
        right,
        0.22,
        2.65,
        0.95,
        C.green,
        0.08
      ),

      text(
        'Resolution rate',
        right,
        0.22,
        20,
        C.green,
        false,
        2.40
      ),

      text(
        '↔',
        CX,
        0.22,
        26,
        C.amber
      ),

      rounded(
        CX,
        -1.38,
        3.25,
        0.83,
        C.amber,
        0.09
      ),

      text(
        'Problem difficulty?',
        CX,
        -1.38,
        21,
        C.amber
      ),

      dashed(
        CX - 0.80,
        -0.95,
        left,
        -0.28,
        C.amber
      ),

      dashed(
        CX + 0.80,
        -0.95,
        right,
        -0.28,
        C.amber
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // SMALL EXPECTED COUNTS
  // Illustrative 2 × 2 table from the next lesson.
  // ------------------------------------------------------------

  function tinyExpectedPicture() {
    const a = [];

    const data = [
      [3, 2],
      [3, 2]
    ];

    const xs = [
      CX - 0.40,
      CX + 1.40
    ];

    const ys = [
      0.18,
      -0.96
    ];

    a.push(
      text(
        'Illustrative expected table',
        CX,
        1.30,
        20,
        C.muted
      ),

      text(
        'Resolved',
        xs[0],
        0.90,
        18,
        C.green
      ),

      text(
        'Not resolved',
        xs[1],
        0.90,
        17,
        C.muted
      ),

      text(
        'New',
        CX - 2.15,
        ys[0],
        20,
        C.cyan
      ),

      text(
        'Old',
        CX - 2.15,
        ys[1],
        20,
        C.amber
      )
    );

    data.forEach((row, r) => {
      row.forEach((n, c) => {
        a.push(
          rounded(
            xs[c],
            ys[r],
            1.52,
            0.88,
            C.amber,
            0.10,
            2
          ),

          text(
            n,
            xs[c],
            ys[r],
            29,
            C.amber,
            true
          )
        );
      });
    });

    a.push(
      text(
        'Every expected count is below 5',
        CX,
        -2.05,
        20,
        C.amber
      )
    );

    return G(a);
  }

  // ============================================================
  // NARRATION BEATS
  // ============================================================

  // ------------------------------------------------------------
  // 0. Last lesson: 120 tickets, counted by queue.
  // ------------------------------------------------------------

  const cards = DATA.map(d =>
    queueTicket(d, false)
  );

  await until(S(0));

  await play(
    ...scene(queueFrames()),

    new M.LaggedStart(
      cards.map(t => new M.FadeIn(t)),
      {
        lagRatio: 0.012,
        runTime: 1.3
      }
    ),

    ...fbox([
      ['120 trial tickets', C.cyan],
      '45 + 40 + 35 = 120'
    ]),

    ...say('120 TICKETS, THREE QUEUES')
  );

  // ------------------------------------------------------------
  // 1. Was each ticket resolved at first contact?
  // ------------------------------------------------------------

  await until(S(1));

  await play(
    new M.LaggedStart(
      cards.map((t, i) =>
        new M.Transform(
          t,
          queueTicket(DATA[i], true)
        )
      ),
      {
        lagRatio: 0.012,
        runTime: 1.8
      }
    ),

    ...fbox([
      'Second question:',
      ['✓ = resolved', C.green],
      ['× = not resolved', C.muted]
    ]),

    ...say('WAS EACH TICKET RESOLVED?', C.green)
  );

  // ------------------------------------------------------------
  // 2. Each ticket answers two questions.
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    ...fbox([
      'Each ticket records:',
      ['1. Which queue?', C.cyan],
      ['2. Resolved? Yes or no', C.green]
    ]),

    ...say('TWO CATEGORY ANSWERS PER TICKET')
  );

  // ------------------------------------------------------------
  // 3. Does resolution depend on the queue?
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...say(
      'DOES RESOLUTION DEPEND ON THE QUEUE?',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 4. Sort into a three-row, two-column grid.
  // ------------------------------------------------------------

  await until(S(4));

  await play(
    ...scene(tableOutline()),

    new M.LaggedStart(
      cards.map((t, i) =>
        new M.Transform(
          t,
          sortedTicket(DATA[i]),
          {
            pathArc:
              DATA[i].c === 0 ? -0.20 : 0.20
          }
        )
      ),
      {
        lagRatio: 0.012,
        runTime: 3.0
      }
    ),

    ...fbox([
      '3 rows = queues',
      ['2 columns = outcomes', C.green]
    ]),

    ...say('SORT THE TICKETS INTO A 3 × 2 GRID')
  );

  // ------------------------------------------------------------
  // 5. Billing: 33 resolved, 12 not, total 45.
  // ------------------------------------------------------------

  const cellLabels = [];

  const billingLabels = [
    cellCountLabel(0, 0),
    cellCountLabel(0, 1)
  ];

  cellLabels.push(...billingLabels);

  await until(S(5));

  await play(
    ...billingLabels.map(t => new M.FadeIn(t)),

    ...fbox([
      ['Billing', QC[0]],
      ['Resolved = 33', C.green],
      'Not resolved = 12',
      ['Total = 45', C.amber]
    ]),

    ...say('BILLING: 33 YES, 12 NO', QC[0])
  );

  // ------------------------------------------------------------
  // 6. Technical: 18 resolved, 22 not, total 40.
  // ------------------------------------------------------------

  const technicalLabels = [
    cellCountLabel(1, 0),
    cellCountLabel(1, 1)
  ];

  cellLabels.push(...technicalLabels);

  await until(S(6));

  await play(
    ...technicalLabels.map(t => new M.FadeIn(t)),

    ...fbox([
      ['Technical', QC[1]],
      ['Resolved = 18', C.green],
      'Not resolved = 22',
      ['Total = 40', C.amber]
    ]),

    ...say('TECHNICAL: 18 YES, 22 NO', QC[1])
  );

  // ------------------------------------------------------------
  // 7. Account: 21 resolved, 14 not, total 35.
  // ------------------------------------------------------------

  const accountLabels = [
    cellCountLabel(2, 0),
    cellCountLabel(2, 1)
  ];

  cellLabels.push(...accountLabels);

  await until(S(7));

  await play(
    ...accountLabels.map(t => new M.FadeIn(t)),

    ...fbox([
      ['Account', QC[2]],
      ['Resolved = 21', C.green],
      'Not resolved = 14',
      ['Total = 35', C.amber]
    ]),

    ...say('ACCOUNT: 21 YES, 14 NO', QC[2])
  );

  // ------------------------------------------------------------
  // 8. Contingency table and cells.
  // Replace the individual cards with numerical counts.
  // ------------------------------------------------------------

  await until(S(8));

  await play(
    new M.FadeOut(
      new M.VGroup(...cards, ...cellLabels)
    ),

    ...scene(countTable(OBS, {
      focus: [0, 0]
    })),

    ...fbox([
      'Contingency table',
      ['Each box is a cell', C.violet]
    ]),

    ...say('A GRID OF COUNTS: A CONTINGENCY TABLE', C.violet)
  );

  // ------------------------------------------------------------
  // 9. Row and column totals are called margins.
  // ------------------------------------------------------------

  await until(S(9));

  await play(
    ...scene(countTable(OBS, {
      margins: true,
      marginFocus: true
    })),

    ...fbox([
      'Margins',
      ['Row totals', C.amber],
      ['Column totals', C.amber]
    ], C.amber),

    ...say('MARGINS = TOTALS AT THE EDGES', C.amber)
  );

  // ------------------------------------------------------------
  // 10. Column totals: 72 resolved, 48 not, total 120.
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    ...fbox([
      ['33 + 18 + 21 = 72', C.green],
      '12 + 22 + 14 = 48',
      ['72 + 48 = 120', C.amber]
    ]),

    ...say('72 RESOLVED; 48 NOT RESOLVED')
  );

  // ------------------------------------------------------------
  // 11. Overall resolution share is 60%.
  // ------------------------------------------------------------

  await until(S(11));

  await play(
    ...scene(overallShare()),

    ...fbox([
      'Overall resolved share',
      ['72 ÷ 120 = 60%', C.green]
    ]),

    ...say('60% RESOLVED OVERALL', C.green)
  );

  // ------------------------------------------------------------
  // 12. Null: queue and resolution are independent.
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...scene(ratePicture(true)),

    ...fbox([
      'Null hypothesis',
      ['Queue and resolution', C.violet],
      ['are independent', C.violet]
    ], C.violet),

    ...say('NULL: QUEUE AND RESOLUTION ARE INDEPENDENT', C.violet)
  );

  // ------------------------------------------------------------
  // 13. Knowing the queue tells us nothing about resolution.
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    new M.Indicate(
      picture,
      { color: C.green }
    ),

    ...fbox([
      'Independent means:',
      'Knowing the queue',
      ['does not change the chance', C.green]
    ]),

    ...say('THE QUEUE TELLS US NOTHING ABOUT THE CHANCE', C.violet)
  );

  // ------------------------------------------------------------
  // 14. Every queue should resolve the same 60%.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...fbox([
      ['Billing:   60%', QC[0]],
      ['Technical: 60%', QC[1]],
      ['Account:   60%', QC[2]]
    ]),

    ...say('UNDER THE NULL: 60% IN EVERY QUEUE', C.green)
  );

  // ------------------------------------------------------------
  // 15. Build expected counts from the margins.
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    ...scene(countTable(EXP, {
      margins: true,
      visibleRows: 0,
      expected: true
    })),

    ...fbox([
      'Keep the margins',
      ['Fill in expected counts', C.amber]
    ]),

    ...say('BUILD THE EXPECTED TABLE', C.amber)
  );

  // ------------------------------------------------------------
  // 16. Billing: 27 resolved, 18 not resolved.
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    ...scene(expectedRowPicture(1)),

    ...fbox([
      ['Billing: 45 tickets', QC[0]],
      ['45 × 0.60 = 27', C.green],
      '45 × 0.40 = 18'
    ]),

    ...say('BILLING EXPECTED: 27 YES, 18 NO', QC[0])
  );

  // ------------------------------------------------------------
  // 17. Technical: 24 resolved, 16 not resolved.
  // ------------------------------------------------------------

  await until(S(17));

  await play(
    ...scene(expectedRowPicture(2)),

    ...fbox([
      ['Technical: 40 tickets', QC[1]],
      ['40 × 0.60 = 24', C.green],
      '40 × 0.40 = 16'
    ]),

    ...say('TECHNICAL EXPECTED: 24 YES, 16 NO', QC[1])
  );

  // ------------------------------------------------------------
  // 18. Account: 21 resolved, 14 not resolved.
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...scene(expectedRowPicture(3)),

    ...fbox([
      ['Account: 35 tickets', QC[2]],
      ['35 × 0.60 = 21', C.green],
      '35 × 0.40 = 14'
    ]),

    ...say('ACCOUNT EXPECTED: 21 YES, 14 NO', QC[2])
  );

  // ------------------------------------------------------------
  // 19. Expected = row total × column total / grand total.
  // ------------------------------------------------------------

  await until(S(19));

  await play(
    ...scene(countTable(EXP, {
      margins: true,
      expected: true,
      marginFocus: true
    })),

    ...fbox([
      'Expected count =',
      'row total × column total',
      ['÷ grand total', C.amber],
      'Grand total = 120'
    ], C.amber),

    ...say('THE MARGINS GIVE EVERY EXPECTED COUNT', C.amber)
  );

  // ------------------------------------------------------------
  // 20. Billing resolved: 45 × 72 / 120 = 27.
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...scene(marginCalculation()),

    ...fbox([
      'Billing: resolved',
      'Row total = 45',
      'Column total = 72',
      ['45 × 72 ÷ 120 = 27', C.green]
    ]),

    ...say('THE SAME EXPECTED COUNT: 27', C.green)
  );

  // ------------------------------------------------------------
  // 21. Place observed and expected tables side by side.
  // ------------------------------------------------------------

  await until(S(21));

  await play(
    ...scene(dualTables()),

    ...fbox([
      ['Observed = actual', C.cyan],
      ['Expected = under the null', C.amber]
    ]),

    ...say('OBSERVED VS EXPECTED')
  );

  // ------------------------------------------------------------
  // 22. Billing resolved more than expected.
  // ------------------------------------------------------------

  await until(S(22));

  await play(
    ...scene(dualTables([0, 0])),

    ...fbox([
      ['Billing: resolved', QC[0]],
      'Observed = 33',
      'Expected = 27',
      ['33 − 27 = +6', C.amber]
    ]),

    ...say('BILLING: SIX MORE THAN EXPECTED', QC[0])
  );

  // ------------------------------------------------------------
  // 23. Technical resolved fewer than expected.
  // ------------------------------------------------------------

  await until(S(23));

  await play(
    ...scene(dualTables([1, 0])),

    ...fbox([
      ['Technical: resolved', QC[1]],
      'Observed = 18',
      'Expected = 24',
      ['18 − 24 = −6', C.amber]
    ]),

    ...say('TECHNICAL: SIX FEWER THAN EXPECTED', QC[1])
  );

  // ------------------------------------------------------------
  // 24. Account matches exactly.
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...scene(dualTables([2, null])),

    ...fbox([
      ['Account', QC[2]],
      '21 − 21 = 0',
      ['14 − 14 = 0', C.green]
    ]),

    ...say('ACCOUNT MATCHES EXACTLY', C.green)
  );

  // ------------------------------------------------------------
  // 25. Same chi-square recipe as before, cell by cell.
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...scene(cellComparison(0, 0)),

    ...fbox([
      'For every cell:',
      ['1. Find the gap', C.amber],
      ['2. Square the gap', C.violet],
      ['3. Divide by expected', C.green]
    ]),

    ...say('SAME RECIPE: GAP → SQUARE → DIVIDE', C.violet)
  );

  // ------------------------------------------------------------
  // 26. Billing resolved: 36 / 27 ≈ 1.33.
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...scene(contributionTable(1, 0)),

    ...fbox([
      ['Billing: resolved', QC[0]],
      '33 − 27 = 6',
      '6² = 36',
      ['36 ÷ 27 ≈ 1.33', C.green]
    ]),

    ...say('FIRST CELL CONTRIBUTION: 1.33', C.green)
  );

  // ------------------------------------------------------------
  // 27. Billing not resolved: 36 / 18 = 2.
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...scene(contributionTable(2, 1)),

    ...fbox([
      ['Billing: not resolved', QC[0]],
      '12 − 18 = −6',
      '(−6)² = 36',
      ['36 ÷ 18 = 2', C.green]
    ]),

    ...say('SECOND CELL CONTRIBUTION: 2', C.green)
  );

  // ------------------------------------------------------------
  // 28. Technical resolved: 36 / 24 = 1.5.
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    ...scene(contributionTable(3, 2)),

    ...fbox([
      ['Technical: resolved', QC[1]],
      '18 − 24 = −6',
      '(−6)² = 36',
      ['36 ÷ 24 = 1.50', C.green]
    ]),

    ...say('THIRD CELL CONTRIBUTION: 1.50', C.green)
  );

  // ------------------------------------------------------------
  // 29. Technical not resolved: 36 / 16 = 2.25.
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    ...scene(contributionTable(4, 3)),

    ...fbox([
      ['Technical: not resolved', QC[1]],
      '22 − 16 = 6',
      '6² = 36',
      ['36 ÷ 16 = 2.25', C.green]
    ]),

    ...say('FOURTH CELL CONTRIBUTION: 2.25', C.green)
  );

  // ------------------------------------------------------------
  // 30. Account: both contributions are zero.
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...scene(contributionTable(6)),

    ...fbox([
      ['Account', QC[2]],
      '21 − 21 = 0',
      '14 − 14 = 0',
      ['Both pieces = 0', C.green]
    ]),

    ...say('NO GAP MEANS NO CONTRIBUTION', C.green)
  );

  // ------------------------------------------------------------
  // 31. Add all six pieces: chi-square ≈ 7.08.
  // ------------------------------------------------------------

  await until(S(31));

  await play(
    ...scene(contributionBars()),

    ...fbox([
      '36/27 + 36/18',
      '+ 36/24 + 36/16',
      '+ 0 + 0',
      ['χ² ≈ ' + CHI.toFixed(2), C.green]
    ], C.green),

    ...say('ADD THE SIX PIECES: CHI-SQUARE ≈ 7.08', C.green)
  );

  // ------------------------------------------------------------
  // 32. Degrees of freedom: (rows - 1)(columns - 1).
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    ...scene(degreesPicture()),

    ...fbox([
      'Degrees of freedom',
      'df = (rows − 1)(cols − 1)',
      '= (3 − 1)(2 − 1)',
      ['= 2 × 1 = 2', C.violet]
    ], C.violet),

    ...say('TWO DEGREES OF FREEDOM', C.violet)
  );

  // ------------------------------------------------------------
  // 33. The 5% cutoff is 5.99; our result is 7.08.
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    ...scene(luckCurve(true, true)),

    ...fbox([
      'df = 2',
      ['5% cutoff = 5.99', C.amber],
      ['Our result = 7.08', C.cyan],
      '7.08 > 5.99'
    ]),

    ...say('OUR RESULT PASSES THE 5% LINE')
  );

  // ------------------------------------------------------------
  // 34. p ≈ 0.029. Reject independence.
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...scene(hundredWorlds(3)),

    ...fbox([
      ['p ≈ ' + PV.toFixed(3), C.cyan],
      '0.029 < 0.05',
      ['Reject independence', C.green]
    ], C.green),

    ...say('ABOUT THREE IN A HUNDRED BY LUCK', C.green)
  );

  // ------------------------------------------------------------
  // 35. Resolution depends on the queue.
  // Technical has a lower observed resolution share.
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    ...scene(ratePicture(false)),

    ...fbox([
      ['Billing: 33/45 ≈ 73%', QC[0]],
      ['Technical: 18/40 = 45%', QC[1]],
      ['Account: 21/35 = 60%', QC[2]]
    ]),

    ...say('TECHNICAL HAS THE LOWEST RESOLUTION SHARE', C.green)
  );

  // ------------------------------------------------------------
  // 36. Same chi-square formula; expected counts are new.
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    ...scene(dualTables()),

    ...fbox([
      ['χ² = Σ (O − E)² / E', C.violet],
      'O = observed count',
      'E = expected count',
      'Sum over all six cells'
    ], C.violet),

    ...say('SAME STATISTIC; NEW EXPECTED COUNTS', C.violet)
  );

  // ------------------------------------------------------------
  // 37. Expected count formula.
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    ...scene(marginCalculation()),

    ...fbox([
      'Expected count =',
      ['row total × column total', C.amber],
      '÷ grand total',
      ['45 × 72 ÷ 120 = 27', C.green]
    ], C.amber),

    ...say('EXPECTED = ROW TOTAL × COLUMN TOTAL ÷ ALL')
  );

  // ------------------------------------------------------------
  // 38. The share this row gets if the column makes no difference.
  // ------------------------------------------------------------

  await until(S(38));

  await play(
    ...scene(expectedRowPicture()),

    ...fbox([
      'Each row keeps its total',
      'Same outcome proportions',
      ['60% yes; 40% no', C.green]
    ]),

    ...say('EXPECTED IF THE TWO QUESTIONS ARE UNRELATED', C.green)
  );

  // ------------------------------------------------------------
  // 39. Applications: two categorical questions.
  // Example: region and product choice.
  // ------------------------------------------------------------

  await until(S(39));

  await play(
    ...scene(regionProductPicture()),

    ...fbox([
      'Two categorical variables',
      'Region × product choice',
      ['Are their answers linked?', C.cyan]
    ]),

    ...say('CHECK WHETHER TWO CATEGORY ANSWERS ARE LINKED')
  );

  // ------------------------------------------------------------
  // 40. Common trap: association is not causation.
  // ------------------------------------------------------------

  await until(S(40));

  await play(
    ...scene(causationPicture()),

    ...fbox([
      ['Association ≠ causation', C.amber],
      'A link does not prove why'
    ], C.amber),

    ...say('TRAP: A LINK IS NOT A CAUSE', C.amber)
  );

  // ------------------------------------------------------------
  // 41. Technical tickets may simply be harder.
  // ------------------------------------------------------------

  await until(S(41));

  await play(
    new M.Indicate(
      picture,
      { color: C.amber }
    ),

    ...fbox([
      'Possible explanation:',
      'Technical problems',
      ['may be harder to resolve', C.amber],
      'The test cannot tell us why'
    ]),

    ...say('THE TEST FINDS A LINK, NOT ITS CAUSE', C.amber)
  );

  // ------------------------------------------------------------
  // 42. Expected counts should be about five or more.
  // Tiny tables need an exact method.
  // ------------------------------------------------------------

  await until(S(42));

  await play(
    ...scene(tinyExpectedPicture()),

    ...fbox([
      'Expected counts below ~5?',
      'Chi-square may be unreliable',
      ['Next: Fisher’s exact test', C.green]
    ], C.amber),

    ...say('WATCH FOR TINY EXPECTED COUNTS', C.amber)
  );

  // ------------------------------------------------------------
  // 43. Closing summary.
  // Compare observed counts with the counts expected under
  // independence.
  // ------------------------------------------------------------

  await until(S(43));

  await play(
    ...scene(dualTables()),

    ...fbox([
      ['χ² = Σ (O − E)² / E', C.violet],
      'χ² ≈ 7.08; df = 2',
      ['p ≈ 0.029', C.green],
      'Evidence against independence'
    ], C.green),

    ...say(
      'INDEPENDENCE: COMPARE WITH THE UNRELATED TABLE',
      C.green
    )
  );

  await until(E(43));

  // Implementation note:
  // All 44 narration beats are included.
  // Shared chapter counts and statistics are preserved.
  // Uses the supplied live-engine interface and reference conventions.
  // Browser execution and responsive rendering have not been tested
  // against the complete engine.js implementation.
}
