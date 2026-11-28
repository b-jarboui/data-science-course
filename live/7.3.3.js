// lesson 7.3.3
// Chi-square goodness of fit.
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

  const TOTAL = 120;
  const MIX = [0.50, 0.25, 0.25];
  const OBS = [45, 40, 35];
  const EXP = [60, 30, 30];

  const GAP = OBS.map((v, k) => v - EXP[k]);
  const SQ = GAP.map(v => v * v);
  const PIECES = SQ.map((v, k) => v / EXP[k]);

  const CHI = PIECES.reduce((a, b) => a + b, 0);
  const DF = Q.length - 1;
  const CUTOFF = 5.991464547;
  const PV = Math.exp(-CHI / 2);

  // ------------------------------------------------------------
  // RESPONSIVE LAYOUT
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;
  const SP = P ? 2.20 : 2.40;

  const BASE = P ? -3.95 : -1.80;
  const BAR_SCALE = P ? 0.079 : 0.046;
  const BW = P ? 0.62 : 0.66;

  const PILL = P
    ? [0, 3.85, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 2.5, 0]
    : [4.3, -0.3, 0];

  const xq = k => CX + (k - 1) * SP;

  const say = (s, c = C.cyan) =>
    showA(s, c, PILL);

  const signed = n =>
    n > 0 ? `+${n}` : String(n).replace('-', '−');

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
    const d = new M.Dot({
      point: [x, y, 0],
      radius,
      color
    });

    return d;
  }

  // ------------------------------------------------------------
  // SCENE MANAGEMENT
  // Only newly created objects are grouped together.
  // Existing on-screen groups are retained for removal.
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
  // ------------------------------------------------------------

  function ticket(
    x, y,
    color = C.cyan,
    w = 0.25,
    h = 0.16
  ) {
    const card = rounded(
      x, y, w, h,
      color, 0.68, 1, 0.025
    );

    const mark = line(
      x - w * 0.27,
      y,
      x + w * 0.27,
      y,
      C.ink,
      1
    );

    return G(card, mark);
  }

  // ------------------------------------------------------------
  // QUEUE PICTURE
  // ------------------------------------------------------------

  const QY = P ? -0.8 : -0.30;
  const QH = P ? 3.6 : 2.7;

  function queueFrames(subtitles = false) {
    return G(Q.map((q, k) => {
      const x = xq(k);

      const frame = rounded(
        x, QY,
        SP - 0.20,
        QH,
        QC[k],
        0.035
      );

      const heading = text(
        q,
        x,
        QY + QH / 2 + 0.30,
        P ? 19 : 21,
        QC[k],
        false,
        SP - 0.15
      );

      const team = rounded(
        x,
        QY - QH / 2 + 0.30,
        SP - 0.55,
        0.40,
        QC[k],
        0.17,
        1
      );

      const teamLabel = text(
        'Team',
        x,
        QY - QH / 2 + 0.30,
        16,
        QC[k]
      );

      const details = subtitles
        ? text(
          ['Money questions', 'Things not working', 'Logins & settings'][k],
          x,
          QY + QH / 2 - 0.25,
          15,
          C.ink,
          false,
          SP - 0.40
        )
        : null;

      return G(
        frame,
        heading,
        team,
        teamLabel,
        details
      );
    }));
  }

  function queueSlot(k, j) {
    const cols = 6;
    const dx = P ? 0.29 : 0.30;
    const dy = P ? 0.24 : 0.19;

    return [
      xq(k) + (j % cols - 2.5) * dx,
      QY + QH / 2 - 0.55 -
        Math.floor(j / cols) * dy,
      0
    ];
  }

  function queuePicture(counts, showCounts = true) {
    const cards = [];

    counts.forEach((n, k) => {
      for (let j = 0; j < n; j++) {
        const p = queueSlot(k, j);

        cards.push(ticket(
          p[0], p[1],
          QC[k],
          0.24,
          P ? 0.17 : 0.13
        ));
      }
    });

    const labels = showCounts
      ? counts.map((n, k) =>
        text(
          n,
          xq(k),
          QY - QH / 2 - 0.30,
          25,
          QC[k],
          true
        )
      )
      : [];

    return G(
      queueFrames(),
      cards,
      labels
    );
  }

  // ------------------------------------------------------------
  // OLD PLANNED MIX
  // ------------------------------------------------------------

  function plannedMix(staff = false) {
    const w = P ? 6.5 : 6.8;
    const y = P ? -0.3 : -0.25;

    let left = CX - w / 2;

    const a = [];

    MIX.forEach((v, k) => {
      const ww = w * v;
      const x = left + ww / 2;

      left += ww;

      a.push(
        rect(
          x, y,
          ww - 0.05,
          1.05,
          QC[k],
          0.75
        ),

        text(
          ['50%', '25%', '25%'][k],
          x, y,
          25,
          C.ink,
          true
        ),

        text(
          ['½', '¼', '¼'][k],
          x, y + 0.95,
          25,
          QC[k],
          true
        ),

        text(
          Q[k],
          x, y - 0.90,
          17,
          QC[k],
          false,
          ww - 0.10
        )
      );

      if (staff) {
        const n = [4, 2, 2][k];

        for (let j = 0; j < n; j++) {
          const px = x + (j - (n - 1) / 2) * 0.33;
          const py = y - 1.55;

          const head = new M.Circle({
            radius: 0.09,
            color: QC[k]
          });

          head.setFill(QC[k], 1);
          head.moveTo([px, py + 0.16, 0]);

          const body = new M.Arc({
            radius: 0.15,
            startAngle: 0,
            angle: Math.PI,
            color: QC[k]
          });

          body.setFill(QC[k], 1);
          body.moveTo([px, py - 0.03, 0]);

          a.push(G(head, body));
        }
      }
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // EXPECTED AND OBSERVED BAR CHART
  // ------------------------------------------------------------

  function bar(k, n, expected) {
    const x = xq(k) + (expected ? -0.43 : 0.43);
    const h = n * BAR_SCALE;

    const body = rect(
      x,
      BASE + h / 2,
      BW,
      h,
      QC[k],
      expected ? 0 : 0.82,
      expected ? 2.5 : 1
    );

    const glow = expected
      ? null
      : rect(
        x,
        BASE + h / 2,
        BW + 0.14,
        h + 0.08,
        QC[k],
        0.13,
        0
      );

    const label = text(
      n,
      x,
      BASE + h + 0.25,
      P ? 19 : 18,
      QC[k],
      true
    );

    return G(glow, body, label);
  }

  function barChart(
    expected = EXP,
    observed = OBS,
    gaps = []
  ) {
    const a = [];

    const left = CX - SP * 1.45;
    const right = CX + SP * 1.45;

    a.push(
      line(left, BASE, right, BASE, C.muted, 2)
    );

    [20, 40, 60].forEach(v => {
      const y = BASE + v * BAR_SCALE;

      a.push(
        line(
          left,
          y,
          right,
          y,
          C.muted,
          0.5
        )
      );
    });

    Q.forEach((q, k) => {
      const x = xq(k);

      a.push(text(
        q,
        x,
        BASE - 0.30,
        17,
        QC[k],
        false,
        SP - 0.18
      ));

      if (expected[k] != null) {
        a.push(bar(k, expected[k], true));
      }

      if (observed[k] != null) {
        a.push(bar(k, observed[k], false));
      }

      if (gaps.includes(k)) {
        const low = BASE +
          Math.min(EXP[k], OBS[k]) * BAR_SCALE;

        const high = BASE +
          Math.max(EXP[k], OBS[k]) * BAR_SCALE;

        a.push(
          line(x, low, x, high, C.amber, 3),

          line(
            x - 0.10, low,
            x + 0.10, low,
            C.amber, 2
          ),

          line(
            x - 0.10, high,
            x + 0.10, high,
            C.amber, 2
          ),

          text(
            signed(GAP[k]),
            x,
            BASE - 0.67,
            21,
            C.amber,
            true
          )
        );
      }
    });

    a.push(P
      ? text('tickets', left + 0.35, BASE + 60 * BAR_SCALE + 0.6, 16, C.muted)
      : text('tickets', left - 0.5, BASE + 40 * BAR_SCALE, 16, C.muted));

    const ly = BASE - 1.04;

    a.push(
      rect(
        CX - 2.55,
        ly,
        0.20,
        0.23,
        C.muted,
        0
      ),

      text(
        'Expected',
        CX - 1.55,
        ly,
        18,
        C.muted
      ),

      rect(
        CX + 0.45,
        ly,
        0.20,
        0.23,
        C.cyan,
        0.8,
        1
      ),

      text(
        'Observed',
        CX + 1.45,
        ly,
        18,
        C.ink
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // GAP PICTURE
  // ------------------------------------------------------------

  function gapPicture() {
    const a = [];

    GAP.forEach((v, k) => {
      const x = xq(k);
      const n = Math.abs(v);

      a.push(text(
        Q[k],
        x,
        0.95,
        18,
        QC[k],
        false,
        SP - 0.1
      ));

      for (let j = 0; j < n; j++) {
        const dx = (j % 5 - 2) * 0.26;
        const dy = -Math.floor(j / 5) * 0.26;

        a.push(rounded(
          x + dx,
          0.23 + dy,
          0.21,
          0.21,
          QC[k],
          0.75,
          1,
          0.02
        ));
      }

      a.push(text(
        signed(v),
        x,
        -1.0,
        31,
        C.amber,
        true
      ));
    });

    a.push(
      text('−15 + 10 + 5 = 0',
        CX, -1.95, 25, C.amber, true)
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // SQUARING THE GAPS
  // One small square represents one unit of squared distance.
  // ------------------------------------------------------------

  function squarePicture(reveal = 3) {
    const a = [];

    const cell = P ? 0.108 : 0.100;
    const pitch = cell * 1.16;

    GAP.forEach((v, k) => {
      if (k >= reveal) return;

      const n = Math.abs(v);
      const x = xq(k);
      const y = P ? -0.60 : -0.40;

      const w = n * pitch;

      a.push(
        text(
          Q[k],
          x,
          1.1,
          18,
          QC[k],
          false,
          SP - 0.12
        ),

        text(
          `${n} × ${n}`,
          x,
          y + w / 2 + 0.34,
          17,
          C.violet,
          true
        )
      );

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          a.push(rect(
            x + (c - (n - 1) / 2) * pitch,
            y + (r - (n - 1) / 2) * pitch,
            cell,
            cell,
            C.violet,
            0.76,
            0
          ));
        }
      }

      a.push(
        rect(
          x,
          y,
          w + 0.05,
          w + 0.05,
          C.violet,
          0,
          2
        ),

        text(
          SQ[k],
          x,
          -1.8,
          26,
          C.violet,
          true
        )
      );
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // CALCULATION TABLE
  // ------------------------------------------------------------

  function calculationTable(
    stage = 0,
    revealedPieces = 0,
    focus = -1
  ) {
    const xs = [
      CX - 2.60,
      CX - 0.85,
      CX + 0.36,
      CX + 1.55,
      CX + 2.75
    ];

    const top = P ? 1.15 : 0.90;
    const rh = P ? 0.90 : 0.79;

    const headers = [
      'Queue',
      'Gap',
      'Gap²',
      'Exp.',
      'Piece'
    ];

    const a = headers.map((v, i) =>
      text(v, xs[i], top, 16, C.muted)
    );

    Q.forEach((q, k) => {
      const y = top - (k + 1) * rh;

      a.push(
        rounded(
          CX,
          y,
          6.7,
          rh - 0.08,
          focus === k ? C.amber : QC[k],
          focus === k ? 0.10 : 0.025,
          focus === k ? 2 : 1
        ),

        text(
          q,
          xs[0],
          y,
          16,
          QC[k],
          false,
          1.45
        ),

        text(
          signed(GAP[k]),
          xs[1],
          y,
          21,
          C.amber,
          true
        )
      );

      if (stage >= 1) {
        a.push(text(
          SQ[k],
          xs[2],
          y,
          21,
          C.violet,
          true
        ));
      }

      if (stage >= 2) {
        a.push(text(
          EXP[k],
          xs[3],
          y,
          21,
          C.muted,
          true
        ));
      }

      if (k < revealedPieces) {
        a.push(text(
          PIECES[k].toFixed(2),
          xs[4],
          y,
          21,
          C.green,
          true
        ));
      }
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // RELATIVE SIZE OF A GAP
  // ------------------------------------------------------------

  function relativeGap() {
    const w = P ? 6.2 : 6.5;
    const left = CX - w / 2;

    const a = [];

    [30, 3000].forEach((n, k) => {
      const y = 0.50 - k * 1.65;
      const fraction = 10 / n;
      const gapW = w * fraction;

      a.push(
        text(
          `Expected: ${n.toLocaleString('en-US')}`,
          CX,
          y + 0.57,
          21,
          C.ink,
          true
        ),

        rect(
          CX,
          y,
          w,
          0.48,
          C.muted,
          0.16,
          1
        ),

        rect(
          left + gapW / 2,
          y,
          gapW,
          0.48,
          C.amber,
          0.90,
          0
        ),

        text(
          'Gap = 10',
          CX,
          y - 0.50,
          19,
          C.amber,
          true
        )
      );

      if (k === 1) {
        a.push(
          line(
            left + gapW / 2,
            y + 0.25,
            left + 0.35,
            y + 0.40,
            C.amber,
            2
          )
        );
      }
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // CONTRIBUTION BARS
  // ------------------------------------------------------------

  function contributionBars(reveal = 3) {
    const base = P ? -3.20 : -1.90;
    const maxH = P ? 4.0 : 2.65;

    const a = [
      line(
        CX - 3.25,
        base,
        CX + 3.25,
        base
      )
    ];

    PIECES.forEach((v, k) => {
      const x = xq(k);

      a.push(text(
        Q[k],
        x,
        base - 0.35,
        17,
        QC[k]
      ));

      if (k >= reveal) return;

      const h = v / 4 * maxH;

      a.push(
        rect(
          x,
          base + h / 2,
          1.05,
          h,
          QC[k],
          0.75
        ),

        rect(
          x,
          base + h / 2,
          1.20,
          h + 0.08,
          QC[k],
          0.10,
          0
        ),

        text(
          v.toFixed(2),
          x,
          base + h + 0.27,
          24,
          QC[k],
          true
        )
      );
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // PERFECT FIT VS MISMATCH
  // ------------------------------------------------------------

  function fitComparison() {
    const a = [];
    const base = -1.65;

    [true, false].forEach((perfect, j) => {
      const center = CX + (j - 0.5) * 3.4;

      a.push(text(
        perfect ? 'Perfect fit' : 'Our trial',
        center,
        1.15,
        20,
        perfect ? C.green : C.cyan
      ));

      EXP.forEach((n, k) => {
        const x = center + (k - 1) * 0.95;

        const expectedH = n / 60 * 1.85;

        const observedH =
          (perfect ? n : OBS[k]) / 60 * 1.85;

        a.push(
          rect(
            x - 0.19,
            base + expectedH / 2,
            0.30,
            expectedH,
            QC[k],
            0,
            2
          ),

          rect(
            x + 0.19,
            base + observedH / 2,
            0.30,
            observedH,
            QC[k],
            0.80,
            1
          )
        );
      });

      a.push(
        line(
          center - 1.45,
          base,
          center + 1.45,
          base
        ),

        text(
          perfect ? 'χ² = 0' : 'χ² ≈ 7.92',
          center,
          base - 0.48,
          20,
          perfect ? C.green : C.cyan,
          true
        )
      );
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // CHI-SQUARE NULL DISTRIBUTION
  // df = 2
  // Density: f(x) = 0.5 exp(-x / 2), x >= 0.
  // ------------------------------------------------------------

  function luckCurve(
    showCutoff = false,
    showObserved = false
  ) {
    const w = P ? 6.2 : 6.8;
    const h = P ? 4.0 : 2.65;

    const x0 = CX - w / 2;
    const y0 = P ? -3.40 : -1.90;

    const xmax = 14;
    const segments = 140;

    const X = v => x0 + w * v / xmax;

    const Y = v =>
      y0 + h * Math.exp(-v / 2);

    const a = [
      line(
        X(0), y0,
        X(xmax), y0,
        C.muted, 2
      ),

      line(
        X(0), y0,
        X(0), Y(0) + 0.1,
        C.muted, 2
      )
    ];

    // Shade the upper tail before drawing the density line.
    for (let i = 0; i < segments; i++) {
      const v = xmax * (i + 0.5) / segments;

      if (!showCutoff || v < CUTOFF) continue;

      const hh = Y(v) - y0;

      const color =
        showObserved && v >= CHI
          ? C.cyan
          : C.amber;

      a.push(rect(
        X(v),
        y0 + hh / 2,
        w / segments + 0.008,
        hh,
        color,
        0.60,
        0
      ));
    }

    // Continuous curve drawn from short line segments.
    for (let i = 0; i < segments; i++) {
      const u = xmax * i / segments;
      const v = xmax * (i + 1) / segments;

      a.push(line(
        X(u), Y(u),
        X(v), Y(v),
        C.violet,
        3
      ));
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
        y0 - 0.72,
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
      const yy = y0 + h * 0.68;

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
          yy + 0.25,
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
          X(CHI),
          yy + 0.24,
          20,
          C.cyan,
          true
        ),

        text(
          'Our result',
          X(CHI) + 0.42,
          yy + 0.55,
          15,
          C.cyan
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // 100-WORLD PROBABILITY PICTURE
  // ------------------------------------------------------------

  function hundredWorlds(n, color = C.amber) {
    const a = [];

    for (let i = 0; i < 100; i++) {
      const x = CX + (i % 10 - 4.5) * 0.45;

      const y = 0.80 -
        Math.floor(i / 10) * 0.27;

      const active = i >= 100 - n;

      a.push(rounded(
        x,
        y,
        0.34,
        0.18,
        active ? color : C.muted,
        active ? 0.95 : 0.20,
        active ? 1 : 0,
        0.035
      ));
    }

    a.push(text(
      `About ${n} in 100`,
      CX,
      -2.15,
      22,
      color,
      true
    ));

    return G(a);
  }

  // ------------------------------------------------------------
  // DEGREES OF FREEDOM
  // ------------------------------------------------------------

  function fixedTotal(reveal = false) {
    const a = [];

    Q.forEach((q, k) => {
      const x = xq(k);

      a.push(
        rounded(
          x,
          -0.05,
          SP - 0.22,
          1.65,
          QC[k],
          0.08
        ),

        text(
          q,
          x,
          0.47,
          18,
          QC[k],
          false,
          SP - 0.20
        ),

        text(
          k === 2 && !reveal ? '?' : OBS[k],
          x,
          -0.24,
          32,
          k === 2 ? C.amber : QC[k],
          true
        ),

        text(
          k === 2 ? 'Fixed' : 'Known',
          x,
          -1.10,
          17,
          k === 2 ? C.amber : C.muted
        )
      );
    });

    a.push(
      text(
        'Total = 120',
        CX,
        -1.95,
        25,
        C.amber,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // EXAMPLE APPLICATIONS
  // ------------------------------------------------------------

  function examplePictures() {
    const a = [];

    const ys = [0.80, -0.42, -1.64];

    // Fair die.
    a.push(
      rounded(
        CX, ys[0],
        6.4, 1.04,
        C.violet, 0.04
      ),

      text(
        'Fair dice?',
        CX - 2.05,
        ys[0],
        20,
        C.violet
      )
    );

    for (let k = 0; k < 6; k++) {
      const x = CX - 0.35 + k * 0.53;

      a.push(
        rounded(
          x,
          ys[0],
          0.43,
          0.43,
          C.violet,
          0.12
        ),

        text(
          k + 1,
          x,
          ys[0],
          17,
          C.ink,
          true
        )
      );
    }

    // Weekday customer demand.
    a.push(
      rounded(
        CX, ys[1],
        6.4, 1.04,
        C.cyan, 0.04
      ),

      text(
        'Weekday mix?',
        CX - 2.05,
        ys[1],
        19,
        C.cyan
      )
    );

    ['M', 'T', 'W', 'T', 'F'].forEach((v, k) => {
      const x = CX - 0.20 + k * 0.62;

      a.push(
        rounded(
          x,
          ys[1],
          0.48,
          0.50,
          C.cyan,
          0.16
        ),

        text(
          v,
          x,
          ys[1],
          18,
          C.ink
        )
      );
    });

    // Sample versus population.
    a.push(
      rounded(
        CX, ys[2],
        6.4, 1.04,
        QC[2], 0.04
      ),

      text(
        'Population mix?',
        CX - 1.95,
        ys[2],
        19,
        QC[2]
      )
    );

    [0, 1].forEach(j => {
      for (let k = 0; k < 6; k++) {
        a.push(dot(
          CX + 0.15 + (k % 3) * 0.28 + j * 1.60,
          ys[2] + 0.15 - Math.floor(k / 3) * 0.30,
          QC[k % 3],
          0.09
        ));
      }
    });

    a.push(text(
      '↔',
      CX + 1.20,
      ys[2],
      22,
      C.ink
    ));

    return G(a);
  }

  // ------------------------------------------------------------
  // COMMON TRAPS
  // ------------------------------------------------------------

  function tinyExpected() {
    const a = [];

    a.push(text(
      'Illustrative expected counts',
      CX,
      1.10,
      19,
      C.muted
    ));

    [2, 3, 4].forEach((n, k) => {
      const x = xq(k);

      a.push(
        rounded(
          x,
          -0.10,
          1.65,
          1.50,
          C.amber,
          0.06
        ),

        text(
          n,
          x,
          0.25,
          29,
          C.amber,
          true
        )
      );

      for (let j = 0; j < n; j++) {
        a.push(ticket(
          x + (j - (n - 1) / 2) * 0.28,
          -0.38,
          C.amber,
          0.22,
          0.16
        ));
      }
    });

    a.push(
      text(
        'Each expected count is below 5',
        CX,
        -1.55,
        20,
        C.amber
      )
    );

    return G(a);
  }

  function countVsPercent() {
    const a = [];

    a.push(
      text(
        'USE COUNTS',
        CX,
        1.15,
        22,
        C.green
      ),

      text(
        'DO NOT USE PERCENTAGES',
        CX,
        -0.60,
        20,
        C.amber
      ),

      line(
        CX - 3.2, -0.20,
        CX + 3.2, -0.20
      )
    );

    Q.forEach((q, k) => {
      const x = xq(k);

      a.push(
        text(
          OBS[k],
          x,
          0.55,
          27,
          QC[k],
          true
        ),

        text(
          q,
          x,
          0.10,
          16,
          QC[k]
        ),

        text(
          `${(OBS[k] / TOTAL * 100).toFixed(1)}%`,
          x,
          -1.20,
          22,
          C.muted,
          true
        )
      );
    });

    a.push(
      text(
        'Counts total 120 tickets',
        CX,
        -1.95,
        20,
        C.green
      )
    );

    return G(a);
  }

  // ============================================================
  // NARRATION BEATS
  // ============================================================

  // ------------------------------------------------------------
  // 0. The help desk has three queues.
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...scene(queueFrames()),
    ...say('THREE HELP-DESK QUEUES')
  );

  // ------------------------------------------------------------
  // 1. Billing, Technical, Account.
  // ------------------------------------------------------------

  await until(S(1));

  await play(
    ...scene(queueFrames(true)),
    ...say('EACH QUEUE HAS ITS OWN TEAM')
  );

  // ------------------------------------------------------------
  // 2. Last year's mix: half, quarter, quarter.
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    ...scene(plannedMix()),
    ...say('LAST YEAR: A STEADY MIX', C.amber)
  );

  // ------------------------------------------------------------
  // 3. The manager plans staff using the mix.
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...scene(plannedMix(true)),
    ...say('STAFFING FOLLOWS THE PLANNED MIX', C.amber)
  );

  // ------------------------------------------------------------
  // 4. 120 tickets arrive during the trial.
  // ------------------------------------------------------------

  const incoming = [];

  for (let i = 0; i < TOTAL; i++) {
    const x = CX + (i % 12 - 5.5) * 0.44;

    const y = (P ? 0.90 : 0.82) -
      Math.floor(i / 12) * 0.27;

    incoming.push(ticket(
      x, y,
      C.cyan,
      0.34,
      0.19
    ));
  }

  await until(S(4));

  await play(
    ...scene(null),

    new M.LaggedStart(
      incoming.map(t => new M.FadeIn(t)),
      {
        lagRatio: 0.015,
        runTime: 1.5
      }
    ),

    ...fbox([
      ['120 trial tickets', C.cyan]
    ]),

    ...say('THIS MONTH: 120 TICKETS')
  );

  // ------------------------------------------------------------
  // 5. Sort the tickets into the three observed counts.
  // ------------------------------------------------------------

  const frames = queueFrames();

  const destinations = [];

  OBS.forEach((n, k) => {
    for (let j = 0; j < n; j++) {
      destinations.push({ k, j });
    }
  });

  const countLabels = OBS.map((n, k) =>
    text(
      n,
      xq(k),
      QY - QH / 2 - 0.30,
      25,
      QC[k],
      true
    )
  );

  await until(S(5));

  await play(
    new M.FadeIn(frames),

    new M.LaggedStart(
      incoming.map((t, i) => {
        const { k, j } = destinations[i];
        const p = queueSlot(k, j);

        return new M.Transform(
          t,
          ticket(
            p[0],
            p[1],
            QC[k],
            0.24,
            P ? 0.17 : 0.13
          ),
          {
            pathArc: (k - 1) * 0.30
          }
        );
      }),
      {
        lagRatio: 0.01,
        runTime: 3.0
      }
    ),

    ...say('SORT THE REAL TICKETS BY QUEUE')
  );

  await play(
    new M.LaggedStart(
      countLabels.map(t => new M.FadeIn(t)),
      {
        lagRatio: 0.13,
        runTime: 0.8
      }
    ),

    ...fbox([
      ['Billing     45', QC[0]],
      ['Technical   40', QC[1]],
      ['Account     35', QC[2]]
    ])
  );

  // ------------------------------------------------------------
  // 6. Has the mix changed?
  // ------------------------------------------------------------

  await until(S(6));

  await play(
    ...fbox([
      'Observed total',
      ['45 + 40 + 35 = 120', C.cyan]
    ]),

    ...say('SAME MIX OR A CHANGED MIX?', C.amber)
  );

  // ------------------------------------------------------------
  // 7. Predict counts using the old mix.
  // ------------------------------------------------------------

  await until(S(7));

  await play(
    new M.FadeOut(
      new M.VGroup(
        frames,
        ...incoming,
        ...countLabels
      )
    ),

    ...scene(plannedMix()),

    ...fbox([
      'Old planned mix',
      ['× 120 tickets', C.amber]
    ]),

    ...say('WHAT WOULD THE OLD MIX PREDICT?', C.amber)
  );

  // ------------------------------------------------------------
  // 8. Billing: half of 120 is 60.
  // ------------------------------------------------------------

  await until(S(8));

  await play(
    ...scene(barChart(
      [60, null, null],
      [null, null, null]
    )),

    ...fbox([
      ['Billing', QC[0]],
      ['120 × ½ = 60', C.amber]
    ]),

    ...say('HALF OF 120 = 60', QC[0])
  );

  // ------------------------------------------------------------
  // 9. Technical and Account: 30 each.
  // ------------------------------------------------------------

  await until(S(9));

  await play(
    ...scene(barChart(
      EXP,
      [null, null, null]
    )),

    ...fbox([
      ['Technical: 120 × ¼ = 30', QC[1]],
      ['Account:   120 × ¼ = 30', QC[2]]
    ]),

    ...say('A QUARTER OF 120 = 30')
  );

  // ------------------------------------------------------------
  // 10. Expected counts.
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    ...fbox([
      'Expected counts',
      ['60 + 30 + 30 = 120', C.amber],
      'If the mix has not changed'
    ]),

    ...say('EXPECTED = WHAT THE PLAN PREDICTS', C.amber)
  );

  // ------------------------------------------------------------
  // 11. Observed counts.
  // ------------------------------------------------------------

  await until(S(11));

  await play(
    ...scene(barChart(
      [null, null, null],
      OBS
    )),

    ...fbox([
      'Observed counts',
      ['45 + 40 + 35 = 120', C.cyan]
    ]),

    ...say('OBSERVED = WHAT WE REALLY SAW')
  );

  // ------------------------------------------------------------
  // 12. Draw the paired bars.
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...scene(barChart()),

    ...fbox([
      ['Hollow = expected', C.muted],
      ['Glowing = observed', C.cyan]
    ]),

    ...say('EXPECTED VS OBSERVED')
  );

  // ------------------------------------------------------------
  // 13. Billing: 15 fewer.
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...scene(barChart(EXP, OBS, [0])),

    ...fbox([
      ['Billing', QC[0]],
      'Expected = 60',
      'Observed = 45',
      ['45 − 60 = −15', C.amber]
    ]),

    ...say('BILLING: 15 FEWER', QC[0])
  );

  // ------------------------------------------------------------
  // 14. Technical: 10 more.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...scene(barChart(EXP, OBS, [0, 1])),

    ...fbox([
      ['Technical', QC[1]],
      'Expected = 30',
      'Observed = 40',
      ['40 − 30 = +10', C.amber]
    ]),

    ...say('TECHNICAL: 10 MORE', QC[1])
  );

  // ------------------------------------------------------------
  // 15. Account: 5 more.
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    ...scene(barChart(EXP, OBS, [0, 1, 2])),

    ...fbox([
      ['Account', QC[2]],
      'Expected = 30',
      'Observed = 35',
      ['35 − 30 = +5', C.amber]
    ]),

    ...say('ACCOUNT: 5 MORE', QC[2])
  );

  // ------------------------------------------------------------
  // 16. The signed gaps cancel out.
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    ...scene(gapPicture()),

    ...fbox([
      'Add the gaps',
      ['−15 + 10 + 5 = 0', C.amber],
      'Total tickets unchanged'
    ]),

    ...say('THE GAPS CANCEL OUT', C.amber)
  );

  // ------------------------------------------------------------
  // 17. We need one overall measure of mismatch.
  // ------------------------------------------------------------

  await until(S(17));

  await play(
    ...scene(calculationTable()),

    ...fbox([
      'Signed gaps cancel',
      ['We need distance instead', C.violet]
    ]),

    ...say('ONE NUMBER FOR THE WHOLE MISMATCH', C.violet)
  );

  // ------------------------------------------------------------
  // 18. Step one: square each gap.
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...scene(squarePicture()),

    ...fbox([
      'Step 1',
      ['(observed − expected)²', C.violet],
      'Both signs become positive'
    ]),

    ...say('STEP 1: SQUARE EACH GAP', C.violet)
  );

  // ------------------------------------------------------------
  // 19. Squared gaps: 225, 100, 25.
  // ------------------------------------------------------------

  await until(S(19));

  await play(
    ...fbox([
      ['(−15)² = 225', QC[0]],
      ['  10²  = 100', QC[1]],
      ['   5²  = 25', QC[2]]
    ]),

    ...say('225, 100, 25: ALL POSITIVE', C.violet)
  );

  // ------------------------------------------------------------
  // 20. Compare each squared gap with expected size.
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...scene(calculationTable(2)),

    ...fbox([
      'Step 2',
      ['Allow for expected size', C.green]
    ]),

    ...say('STEP 2: COMPARE WITH EXPECTED SIZE', C.green)
  );

  // ------------------------------------------------------------
  // 21. A gap of ten matters more for 30 than 3000.
  // ------------------------------------------------------------

  await until(S(21));

  await play(
    ...scene(relativeGap()),

    ...fbox([
      'Same gap = 10',
      'Expected 30: substantial',
      ['Expected 3000: tiny', C.amber]
    ]),

    ...say('THE SAME GAP CAN MATTER MORE', C.amber)
  );

  // ------------------------------------------------------------
  // 22. Divide by the expected count.
  // ------------------------------------------------------------

  await until(S(22));

  await play(
    ...scene(calculationTable(2)),

    ...fbox([
      'For each queue',
      ['Piece = gap² ÷ expected', C.green]
    ]),

    ...say('DIVIDE BY THE EXPECTED COUNT', C.green)
  );

  // ------------------------------------------------------------
  // 23. Billing contribution.
  // ------------------------------------------------------------

  await until(S(23));

  await play(
    ...scene(calculationTable(2, 1, 0)),

    ...fbox([
      ['Billing', QC[0]],
      'Gap² = 225',
      'Expected = 60',
      ['225 ÷ 60 = 3.75', C.green]
    ]),

    ...say('BILLING CONTRIBUTION: 3.75', QC[0])
  );

  // ------------------------------------------------------------
  // 24. Technical contribution.
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...scene(calculationTable(2, 2, 1)),

    ...fbox([
      ['Technical', QC[1]],
      'Gap² = 100',
      'Expected = 30',
      ['100 ÷ 30 ≈ 3.33', C.green]
    ]),

    ...say('TECHNICAL CONTRIBUTION: 3.33', QC[1])
  );

  // ------------------------------------------------------------
  // 25. Account contribution.
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...scene(calculationTable(2, 3, 2)),

    ...fbox([
      ['Account', QC[2]],
      'Gap² = 25',
      'Expected = 30',
      ['25 ÷ 30 ≈ 0.83', C.green]
    ]),

    ...say('ACCOUNT CONTRIBUTION: 0.83', QC[2])
  );

  // ------------------------------------------------------------
  // 26. Step three: add the contributions.
  // Use unrounded pieces to obtain 7.92.
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...scene(contributionBars()),

    ...fbox([
      '225/60 + 100/30 + 25/30',
      ['≈ 7.92', C.green]
    ], C.green),

    ...say('STEP 3: ADD THE THREE PIECES', C.green)
  );

  // ------------------------------------------------------------
  // 27. The chi-square statistic.
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...fbox([
      ['χ² ≈ 7.92', C.green],
      'Chi-square statistic',
      'χ = chi (said kai)'
    ], C.violet),

    ...say('CHI-SQUARE: ONE OVERALL DISTANCE', C.violet)
  );

  // ------------------------------------------------------------
  // 28. Zero means perfect fit.
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    ...scene(fitComparison()),

    ...fbox([
      ['χ² = 0: perfect fit', C.green],
      'Larger χ²',
      ['More mismatch', C.amber]
    ]),

    ...say('BIGGER χ² MEANS A POORER FIT', C.violet)
  );

  // ------------------------------------------------------------
  // 29. The luck-only chi-square distribution.
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    ...scene(luckCurve()),

    ...fbox([
      'Null distribution',
      ['Mismatch caused by luck alone', C.violet]
    ]),

    ...say('HOW BIG IS TOO BIG?', C.amber)
  );

  // ------------------------------------------------------------
  // 30. Degrees of freedom = categories minus one.
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...fbox([
      'Degrees of freedom',
      'df = categories − 1',
      ['df = 3 − 1 = 2', C.violet]
    ], C.violet),

    ...say('USE THE CURVE WITH 2 DEGREES OF FREEDOM', C.violet)
  );

  // ------------------------------------------------------------
  // 31. Why the third count is fixed.
  // ------------------------------------------------------------

  await until(S(31));

  await play(
    ...scene(fixedTotal(false)),

    ...fbox([
      'Total = 120',
      'Known: 45 and 40',
      ['Third count = ?', C.amber]
    ]),

    ...say('TWO COUNTS FREE; ONE COUNT FIXED', C.violet)
  );

  await until(S(31) + 2.5);

  await play(
    ...scene(fixedTotal(true)),

    ...fbox([
      '120 − 45 − 40',
      ['= 35', QC[2]]
    ])
  );

  // ------------------------------------------------------------
  // 32. Five-percent cutoff = 5.99.
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    ...scene(luckCurve(true, false)),

    ...fbox([
      'df = 2',
      ['5% cutoff = 5.99', C.amber],
      'Upper tail = 0.05'
    ], C.amber),

    ...say('5 IN 100 GO PAST 5.99', C.amber)
  );

  // ------------------------------------------------------------
  // 33. Observed statistic is past the cutoff.
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    ...scene(luckCurve(true, true)),

    ...fbox([
      '7.92 > 5.99',
      ['p ≈ ' + PV.toFixed(3), C.cyan],
      'About 2 in 100'
    ]),

    ...say('OUR RESULT IS IN THE RARE TAIL')
  );

  // ------------------------------------------------------------
  // 34. Reject the null.
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...scene(barChart(EXP, OBS, [0, 1, 2])),

    ...fbox([
      ['Reject the null', C.green],
      'Evidence the mix changed',
      'p ≈ 0.019'
    ], C.green),

    ...say('BILLING DOWN; TECHNICAL UP', C.green)
  );

  // ------------------------------------------------------------
  // 35. General formula.
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    ...scene(calculationTable(2, 3)),

    ...fbox([
      ['χ² = Σ (O − E)² / E', C.violet],
      'O = observed count',
      'E = expected count'
    ], C.violet),

    ...say('THE GOODNESS-OF-FIT FORMULA', C.violet)
  );

  // ------------------------------------------------------------
  // 36. Read the formula in plain language.
  // ------------------------------------------------------------

  await until(S(36));

  await play(
    ...fbox([
      ['1. Square each gap', C.violet],
      ['2. Divide by expected', C.amber],
      ['3. Add the pieces', C.green]
    ]),

    ...say('SQUARE → DIVIDE → ADD', C.green)
  );

  // ------------------------------------------------------------
  // 37. Checking a mix stated in advance.
  // ------------------------------------------------------------

  await until(S(37));

  await play(
    ...scene(barChart()),

    ...fbox([
      'One categorical variable',
      'A mix stated in advance',
      ['Compare with actual counts', C.cyan]
    ]),

    ...say('DO THE COUNTS FOLLOW A STATED MIX?')
  );

  // ------------------------------------------------------------
  // 38. Dice, weekdays, population.
  // ------------------------------------------------------------

  await until(S(38));

  await play(
    ...scene(examplePictures()),

    ...fbox([
      'Dice outcomes',
      'Weekday customer demand',
      ['Sample vs population', C.cyan]
    ]),

    ...say('MANY WAYS TO CHECK A STATED MIX')
  );

  // ------------------------------------------------------------
  // 39. Common trap: tiny expected counts.
  // ------------------------------------------------------------

  await until(S(39));

  await play(
    ...scene(tinyExpected()),

    ...fbox([
      ['Warning', C.amber],
      'Tiny expected counts'
    ], C.amber),

    ...say('TRAP 1: TINY EXPECTED COUNTS', C.amber)
  );

  // ------------------------------------------------------------
  // 40. Below about five: approximation may be poor.
  // ------------------------------------------------------------

  await until(S(40));

  await play(
    ...fbox([
      'Expected count below ~5?',
      'Merge suitable categories',
      ['Or use an exact method', C.green]
    ], C.amber),

    ...say('THE LUCK CURVE MAY BE UNRELIABLE', C.amber)
  );

  // ------------------------------------------------------------
  // 41. Use counts, not percentages.
  // ------------------------------------------------------------

  await until(S(41));

  await play(
    ...scene(countVsPercent()),

    ...fbox([
      ['Use actual counts', C.green],
      'Sample size matters',
      'Percentages lose the total'
    ]),

    ...say('TRAP 2: COUNTS, NOT PERCENTAGES', C.amber)
  );

  // ------------------------------------------------------------
  // 42. Closing summary.
  // ------------------------------------------------------------

  await until(S(42));

  await play(
    ...scene(barChart(EXP, OBS, [0, 1, 2])),

    ...fbox([
      ['χ² = Σ (O − E)² / E', C.violet],
      'χ² ≈ 7.92; df = 2',
      ['p ≈ 0.019', C.green]
    ], C.green),

    ...say('GOODNESS OF FIT: DOES THE STATED MIX STILL FIT?', C.green)
  );

  await until(E(42));

  // Implementation note:
  // Uses the supplied live-engine interface and reference conventions.
  // Browser execution and responsive rendering have not been tested
  // against the complete engine.js implementation.
}
