// lesson 7.3.7
// The sign test.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C,
    S, E, T, pill, show, showA, until, play
  } = L;

  // ------------------------------------------------------------
  // SHARED CHAPTER DATA
  // Average handling minutes per ticket for nine matched agents.
  // ------------------------------------------------------------

  const AGENTS = [
    'A', 'B', 'C', 'D', 'E',
    'F', 'G', 'H', 'I'
  ];

  const OLD_TIME = [
    12, 15, 10, 14, 16,
    9, 18, 20, 11
  ];

  const NEW_TIME = [
    9, 11, 11, 9, 10,
    11, 11, 12, 11
  ];

  const DIFF = OLD_TIME.map(
    (v, i) => v - NEW_TIME[i]
  );

  const DATA = AGENTS.map((id, i) => ({
    id,
    old: OLD_TIME[i],
    new: NEW_TIME[i],
    diff: DIFF[i],
    sign: Math.sign(DIFF[i])
  }));

  const NONZERO = DATA.filter(d => d.diff !== 0);

  const PLUS = NONZERO.filter(d => d.diff > 0);
  const MINUS = NONZERO.filter(d => d.diff < 0);
  const ZERO = DATA.filter(d => d.diff === 0);

  const N = NONZERO.length;

  const NPLUS = PLUS.length;
  const NMINUS = MINUS.length;

  const EXPECTED = N / 2;

  const OLD = C.amber;
  const NEW = C.cyan;

  const POS = C.green;
  const NEG = C.amber;
  const TIE = C.muted;

  // DIFF = [+3, +4, -1, +5, +6, -2, +7, +8, 0]
  // Agent I is omitted from the sign test.
  // N = 8
  // NPLUS = 6
  // NMINUS = 2

  // ------------------------------------------------------------
  // EXACT BINOMIAL COUNTS
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

  const KS = Array.from(
    { length: N + 1 },
    (_, k) => k
  );

  const WAYS = KS.map(k =>
    choose(N, k)
  );

  const TOTAL_PATTERNS = 2 ** N;

  const LOWER_WAYS = WAYS
    .slice(0, NMINUS + 1)
    .reduce((a, b) => a + b, 0);

  const UPPER_WAYS = WAYS
    .slice(N - NMINUS)
    .reduce((a, b) => a + b, 0);

  const EXTREME_WAYS =
    LOWER_WAYS + UPPER_WAYS;

  const ONE_TAIL = LOWER_WAYS / TOTAL_PATTERNS;

  const PV = EXTREME_WAYS / TOTAL_PATTERNS;

  const ALPHA = 0.05;

  // WAYS = [1, 8, 28, 56, 70, 56, 28, 8, 1]
  // TOTAL_PATTERNS = 256
  // LOWER_WAYS = 1 + 8 + 28 = 37
  // ONE_TAIL = 37 / 256 = 0.14453125
  // EXTREME_WAYS = 74
  // PV = 74 / 256 = 0.2890625

  // ------------------------------------------------------------
  // ENUMERATE EVERY POSSIBLE SIGN PATTERN
  //
  // Bit 0 = plus.
  // Bit 1 = minus.
  //
  // Under the independent fair-sign null, all 256 patterns
  // are equally likely.
  // ------------------------------------------------------------

  const PATTERNS = [];

  for (let mask = 0; mask < TOTAL_PATTERNS; mask++) {
    const signs = [];

    for (let j = 0; j < N; j++) {
      signs.push(
        (mask & (1 << j)) !== 0 ? -1 : 1
      );
    }

    const minusCount = signs.filter(
      s => s < 0
    ).length;

    PATTERNS.push({
      mask,
      signs,
      minusCount
    });
  }

  const BUCKETS = KS.map(k =>
    PATTERNS.filter(
      p => p.minusCount === k
    )
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

  const signColor = n =>
    n > 0 ? POS : n < 0 ? NEG : TIE;

  const signed = n =>
    n > 0
      ? `+${n}`
      : String(n).replace('-', '−');

  const signSymbol = n =>
    n > 0 ? '+' : n < 0 ? '−' : '0';

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
    const t = T(
      String(s),
      size,
      color,
      mono
    );

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

  function dot(
    x, y,
    color,
    radius = 0.11
  ) {
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
  // Objects already on screen are grouped only for removal.
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
      cw * (
        s.length -
        s.trimStart().length
      )
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
  // AGENT ICON
  // ------------------------------------------------------------

  function person(
    x, y,
    color = C.ink,
    scale = 1
  ) {
    const head = new M.Circle({
      radius: 0.14 * scale,
      color
    });

    head.setFill(color, 0.95);

    head.moveTo([
      x,
      y + 0.29 * scale,
      0
    ]);

    const body = new M.Arc({
      radius: 0.25 * scale,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(color, 0.82);

    body.moveTo([
      x,
      y - 0.02 * scale,
      0
    ]);

    return G(head, body);
  }

  // ------------------------------------------------------------
  // TICKET AND CLOCK
  // ------------------------------------------------------------

  function ticket(x, y, color = C.cyan) {
    return G(
      rounded(
        x,
        y,
        1.32,
        0.92,
        color,
        0.10,
        2
      ),

      line(
        x - 0.40,
        y + 0.20,
        x + 0.40,
        y + 0.20,
        color,
        2
      ),

      line(
        x - 0.40,
        y,
        x + 0.27,
        y,
        color,
        1.5
      ),

      line(
        x - 0.40,
        y - 0.20,
        x + 0.15,
        y - 0.20,
        color,
        1.5
      )
    );
  }

  function clock(
    x, y,
    color = C.violet,
    radius = 0.64
  ) {
    const a = [];

    const face = new M.Circle({
      radius,
      color,
      strokeWidth: 2.5
    });

    face.setFill(color, 0.07);
    face.moveTo([x, y, 0]);

    a.push(face);

    for (let k = 0; k < 12; k++) {
      const angle =
        Math.PI / 2 -
        k * Math.PI / 6;

      const ca = Math.cos(angle);
      const sa = Math.sin(angle);

      a.push(
        line(
          x + radius * 0.81 * ca,
          y + radius * 0.81 * sa,
          x + radius * 0.94 * ca,
          y + radius * 0.94 * sa,
          C.muted,
          1.2
        )
      );
    }

    a.push(
      line(
        x,
        y,
        x,
        y + radius * 0.60,
        color,
        3
      ),

      line(
        x,
        y,
        x + radius * 0.41,
        y - radius * 0.24,
        color,
        3
      ),

      dot(
        x,
        y,
        color,
        0.055
      )
    );

    return G(a);
  }

  function timingPicture() {
    const y = P ? -0.25 : -0.10;

    return G(
      person(
        CX - 2.10,
        y,
        C.ink,
        1.45
      ),

      ticket(
        CX,
        y + 0.07,
        C.cyan
      ),

      clock(
        CX + 2.05,
        y + 0.08,
        C.violet
      ),

      text(
        'Agent',
        CX - 2.10,
        y - 1.02,
        19,
        C.ink
      ),

      text(
        'Ticket',
        CX,
        y - 1.02,
        19,
        C.cyan
      ),

      text(
        'Minutes',
        CX + 2.05,
        y - 1.02,
        19,
        C.violet
      ),

      text(
        'How long does each ticket take?',
        CX,
        y + 1.35,
        23,
        C.ink,
        false,
        6.5
      )
    );
  }

  // ------------------------------------------------------------
  // MATCHED AGENT TIME TABLE
  //
  // Laptop: three blocks of three agents.
  // Phone: one vertical table of nine agents.
  // ------------------------------------------------------------

  function agentTimeTable(
    reveal = 9,
    differences = false,
    focus = []
  ) {
    const a = [];

    if (P) {
      const top = 1.26;
      const rh = 0.64;

      const xs = [
        CX - 2.66,
        CX - 0.99,
        CX + 0.74,
        CX + 2.41
      ];

      [
        ['Agent', C.muted],
        ['Old', OLD],
        ['New', NEW],
        ['Saved', POS]
      ].forEach(([s, color], i) => {
        if (i === 3 && !differences) return;

        a.push(
          text(
            s,
            xs[i],
            top,
            19,
            color
          )
        );
      });

      DATA.forEach((d, i) => {
        const y = top - (i + 1) * rh;

        const active = focus.includes(i);

        a.push(
          rounded(
            CX,
            y,
            6.65,
            rh - 0.07,
            active ? C.violet : C.muted,
            active ? 0.09 : 0.025,
            active ? 2.2 : 0.7
          ),

          person(
            xs[0] - 0.36,
            y - 0.06,
            C.ink,
            0.56
          ),

          text(
            d.id,
            xs[0] + 0.16,
            y,
            21,
            C.ink,
            true
          )
        );

        if (i < reveal) {
          a.push(
            text(
              d.old,
              xs[1],
              y,
              23,
              OLD,
              true
            ),

            text(
              d.new,
              xs[2],
              y,
              23,
              NEW,
              true
            )
          );

          if (differences) {
            a.push(
              text(
                signed(d.diff),
                xs[3],
                y,
                23,
                signColor(d.diff),
                true
              )
            );
          }
        }
      });

      a.push(
        text(
          'Average minutes per ticket',
          CX,
          top - 10 * rh,
          17,
          C.muted
        )
      );
    } else {
      const centers = [
        CX - 2.22,
        CX,
        CX + 2.22
      ];

      const top = 1.12;
      const rh = 0.78;

      centers.forEach((center, block) => {
        const xs = [
          center - 0.78,
          center - 0.25,
          center + 0.30,
          center + 0.82
        ];

        [
          ['ID', C.muted],
          ['Old', OLD],
          ['New', NEW],
          ['Δ', POS]
        ].forEach(([s, color], j) => {
          if (j === 3 && !differences) return;

          a.push(
            text(
              s,
              xs[j],
              top,
              15,
              color
            )
          );
        });

        for (let j = 0; j < 3; j++) {
          const i = block * 3 + j;

          const d = DATA[i];

          const y = top - (j + 1) * rh;

          const active = focus.includes(i);

          a.push(
            rounded(
              center,
              y,
              2.08,
              rh - 0.09,
              active ? C.violet : C.muted,
              active ? 0.09 : 0.025,
              active ? 2.2 : 0.8
            ),

            text(
              d.id,
              xs[0],
              y,
              18,
              C.ink,
              true
            )
          );

          if (i < reveal) {
            a.push(
              text(
                d.old,
                xs[1],
                y,
                19,
                OLD,
                true
              ),

              text(
                d.new,
                xs[2],
                y,
                19,
                NEW,
                true
              )
            );

            if (differences) {
              a.push(
                text(
                  signed(d.diff),
                  xs[3],
                  y,
                  17,
                  signColor(d.diff),
                  true
                )
              );
            }
          }
        }
      });

      a.push(
        text(
          'Average minutes per ticket',
          CX,
          -1.88,
          18,
          C.muted
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // AGENTS A AND B
  // Old and new times represented by horizontal bars.
  // The saved part is the difference in bar lengths.
  // ------------------------------------------------------------

  function exampleAgents(
    revealDifference = false
  ) {
    const a = [];

    const ys = [
      P ? 0.55 : 0.63,
      P ? -2.25 : -1.42
    ];

    const scale = 0.235;
    const left = CX - 1.70;

    DATA.slice(0, 2).forEach((d, i) => {
      const y = ys[i];

      const ow = d.old * scale;
      const nw = d.new * scale;

      a.push(
        person(
          CX - 2.52,
          y - 0.15,
          C.ink,
          1.05
        ),

        text(
          `Agent ${d.id}`,
          CX - 2.52,
          y - 0.75,
          17,
          C.ink
        ),

        rect(
          left + ow / 2,
          y + 0.22,
          ow,
          0.38,
          OLD,
          0.76,
          1
        ),

        rect(
          left + nw / 2,
          y - 0.36,
          nw,
          0.38,
          NEW,
          0.79,
          1
        ),

        text(
          `${d.old} min`,
          left + ow + 0.48,
          y + 0.22,
          17,
          OLD,
          true
        ),

        text(
          `${d.new} min`,
          left + nw + 0.48,
          y - 0.36,
          17,
          NEW,
          true
        )
      );

      if (revealDifference) {
        const x1 = left + nw;
        const x2 = left + ow;
        const yy = y - 0.72;

        a.push(
          line(
            x1,
            yy,
            x2,
            yy,
            POS,
            2.5
          ),

          line(
            x1,
            yy,
            x1,
            yy + 0.14,
            POS,
            2
          ),

          line(
            x2,
            yy,
            x2,
            yy + 0.14,
            POS,
            2
          ),

          text(
            signed(d.diff),
            (x1 + x2) / 2,
            yy - 0.28,
            23,
            POS,
            true
          )
        );
      }
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // NUMBER LINE OF MINUTES SAVED
  // One dot per agent.
  // ------------------------------------------------------------

  const LINE_LEFT = CX - 3.10;
  const LINE_RIGHT = CX + 3.10;

  const LINE_MIN = -2.6;
  const LINE_MAX = 8.6;

  const LINE_Y = P ? -1.75 : -0.65;

  const X = v =>
    LINE_LEFT +
    (v - LINE_MIN) /
      (LINE_MAX - LINE_MIN) *
      (LINE_RIGHT - LINE_LEFT);

  function differenceAxes(
    explanations = false
  ) {
    const a = [];

    a.push(
      rect(
        (LINE_LEFT + X(0)) / 2,
        LINE_Y + 0.30,
        X(0) - LINE_LEFT,
        1.04,
        NEG,
        0.05,
        0
      ),

      rect(
        (X(0) + LINE_RIGHT) / 2,
        LINE_Y + 0.30,
        LINE_RIGHT - X(0),
        1.04,
        POS,
        0.05,
        0
      ),

      line(
        LINE_LEFT,
        LINE_Y,
        LINE_RIGHT,
        LINE_Y,
        C.muted,
        2.5
      ),

      line(
        X(0),
        LINE_Y - 0.10,
        X(0),
        LINE_Y + 1.10,
        TIE,
        1.6
      )
    );

    for (let k = -2; k <= 8; k++) {
      a.push(
        line(
          X(k),
          LINE_Y - 0.075,
          X(k),
          LINE_Y + 0.075,
          k === 0
            ? C.ink
            : C.muted,
          1.2
        ),

        text(
          signed(k),
          X(k),
          LINE_Y - 0.29,
          P ? 17 : 16,
          signColor(k),
          true
        )
      );
    }

    a.push(
      text(
        'Minutes saved: old − new',
        CX,
        LINE_Y - 0.83,
        19,
        C.muted,
        false,
        6.4
      )
    );

    if (explanations) {
      a.push(
        text(
          'Slower',
          (LINE_LEFT + X(0)) / 2,
          LINE_Y + 1.20,
          19,
          NEG
        ),

        text(
          'Faster',
          (X(0) + LINE_RIGHT) / 2,
          LINE_Y + 1.20,
          21,
          POS
        ),

        text(
          'No change',
          X(0),
          LINE_Y - 1.25,
          17,
          TIE
        )
      );
    }

    return G(a);
  }

  function differenceDot(d) {
    const x = X(d.diff);
    const y = LINE_Y + 0.32;

    const color = signColor(d.diff);

    const glow = dot(
      x,
      y,
      color,
      0.23
    );

    glow.setFill(color, 0.15);

    return G(
      glow,

      dot(
        x,
        y,
        color,
        0.115
      ),

      text(
        d.id,
        x,
        y + 0.36,
        18,
        color,
        true
      )
    );
  }

  function completeDifferencePicture(
    explanations = true
  ) {
    return G(
      differenceAxes(explanations),
      DATA.map(d => differenceDot(d))
    );
  }

  // ------------------------------------------------------------
  // ILLUSTRATIVE UNUSUAL DAY
  // Separate from the actual nine-agent data.
  // ------------------------------------------------------------

  function unusualDayPicture(
    outlier = true
  ) {
    const a = [];

    const values = [
      10, 11, 9, 10,
      outlier ? 50 : 10
    ];

    const mean =
      values.reduce((s, v) => s + v, 0) /
      values.length;

    const base = P ? -3.25 : -1.92;
    const maxH = P ? 4.10 : 2.85;

    const scale = maxH / 50;

    const sp = 1.13;

    a.push(
      line(
        CX - 3.10,
        base,
        CX + 3.10,
        base,
        C.muted,
        2
      ),

      text(
        'Illustrative daily handling times',
        CX,
        P ? 1.52 : 1.45,
        18,
        C.muted,
        false,
        6.5
      )
    );

    values.forEach((v, i) => {
      const x = CX + (i - 2) * sp;
      const h = v * scale;

      const color =
        outlier && i === 4
          ? NEG
          : NEW;

      a.push(
        rect(
          x,
          base + h / 2,
          0.75,
          h,
          color,
          0.78,
          1.2
        ),

        text(
          v,
          x,
          base + h + 0.23,
          21,
          color,
          true
        ),

        text(
          `Day ${i + 1}`,
          x,
          base - 0.31,
          15,
          C.muted
        )
      );
    });

    const meanY = base + mean * scale;

    a.push(
      dashed(
        CX - 3.02,
        meanY,
        CX + 3.02,
        meanY,
        C.violet
      ),

      text(
        `Mean = ${mean.toFixed(1)}`,
        CX - 0.72,
        meanY + 0.24,
        18,
        C.violet,
        true
      ),

      text(
        outlier
          ? 'One unusual day pulls the mean up'
          : 'Five ordinary days',
        CX,
        base - 0.83,
        18,
        outlier ? NEG : C.muted,
        false,
        6.4
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // DIFFERENCE CARDS AND SIGN CARDS
  // Same agent identity, different amount of information.
  // ------------------------------------------------------------

  const SIGN_COLS = P ? 3 : 9;

  const SIGN_DX = P ? 1.92 : 0.73;
  const SIGN_DY = P ? 1.36 : 0;

  const SIGN_TOP = P ? 0.83 : -0.05;

  const SIGN_W = P ? 1.48 : 0.62;
  const SIGN_H = P ? 0.87 : 0.88;

  function signSlot(i) {
    const cols = SIGN_COLS;

    return [
      CX +
        (i % cols -
          (cols - 1) / 2) *
          SIGN_DX,

      SIGN_TOP -
        Math.floor(i / cols) *
          SIGN_DY,

      0
    ];
  }

  function signCard(
    d,
    x,
    y,
    signsOnly = false,
    w = SIGN_W,
    h = SIGN_H
  ) {
    const color = signColor(d.diff);

    return G(
      rounded(
        x,
        y,
        w + 0.08,
        h + 0.08,
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
        0.12,
        1.8
      ),

      text(
        d.id,
        x,
        y + h * 0.27,
        P ? 17 : 15,
        C.ink,
        true
      ),

      text(
        signsOnly
          ? signSymbol(d.diff)
          : signed(d.diff),
        x,
        y - h * 0.12,
        signsOnly ? 33 : 26,
        color,
        true,
        w - 0.09
      )
    );
  }

  function initialSignCard(
    d,
    i,
    signsOnly = false
  ) {
    const p = signSlot(i);

    return signCard(
      d,
      p[0],
      p[1],
      signsOnly
    );
  }

  function allSignsPicture(
    signsOnly = true,
    includeZero = true
  ) {
    const a = [];

    const records = includeZero
      ? DATA
      : NONZERO;

    records.forEach((d, i) => {
      const p = signSlot(i);

      a.push(
        signCard(
          d,
          p[0],
          p[1],
          signsOnly
        )
      );
    });

    a.push(
      text(
        signsOnly
          ? 'Keep the direction only'
          : 'Minutes saved by each agent',
        CX,
        P ? -3.0 : -1.18,
        20,
        C.violet
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // ZERO CHANGE
  // Agent I is excluded, not counted as a plus or minus.
  // ------------------------------------------------------------

  function zeroPicture() {
    const a = [];

    const y = P ? -0.20 : -0.10;

    const d = DATA[8];

    a.push(
      person(
        CX,
        y + 0.88,
        TIE,
        1.30
      ),

      text(
        'Agent I',
        CX,
        y + 0.48,
        22,
        TIE
      ),

      rounded(
        CX - 1.45,
        y - 0.28,
        2.35,
        0.88,
        OLD,
        0.09
      ),

      rounded(
        CX + 1.45,
        y - 0.28,
        2.35,
        0.88,
        NEW,
        0.09
      ),

      text(
        `${d.old} min`,
        CX - 1.45,
        y - 0.28,
        26,
        OLD,
        true
      ),

      text(
        `${d.new} min`,
        CX + 1.45,
        y - 0.28,
        26,
        NEW,
        true
      ),

      text(
        '=',
        CX,
        y - 0.28,
        26,
        TIE
      ),

      text(
        '11 − 11 = 0',
        CX,
        y - 1.15,
        29,
        TIE,
        true
      ),

      text(
        'No sign — set aside',
        CX,
        y - 1.88,
        23,
        TIE
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // SIX PLUS AND TWO MINUS
  // Group the eight nonzero signs.
  // ------------------------------------------------------------

  function splitSignsPicture(
    expected = false
  ) {
    const a = [];

    const left = CX - 1.63;
    const right = CX + 1.63;

    const cy = P ? -0.63 : -0.25;

    const h = P ? 3.45 : 2.65;

    const records = expected
      ? [
        Array.from(
          { length: 4 },
          () => ({ id: '', diff: 1 })
        ),

        Array.from(
          { length: 4 },
          () => ({ id: '', diff: -1 })
        )
      ]
      : [PLUS, MINUS];

    const colors = [POS, NEG];

    records.forEach((group, k) => {
      const center = k === 0 ? left : right;

      const color = colors[k];

      a.push(
        rounded(
          center,
          cy,
          3.02,
          h,
          color,
          0.045,
          2
        ),

        text(
          k === 0
            ? 'Plus: faster'
            : 'Minus: slower',
          center,
          cy + h / 2 - 0.31,
          20,
          color
        )
      );

      group.forEach((d, j) => {
        const x =
          center +
          (j % 2 - 0.5) * 1.04;

        const y =
          cy +
          h / 2 -
          (P ? 1.04 : 0.87) -
          Math.floor(j / 2) *
            (P ? 0.70 : 0.49);

        a.push(
          rounded(
            x,
            y,
            0.83,
            P ? 0.56 : 0.43,
            color,
            expected ? 0.025 : 0.16,
            1.7
          ),

          text(
            signSymbol(d.diff),
            x,
            y,
            28,
            color,
            true
          )
        );

        if (!expected) {
          a.push(
            text(
              d.id,
              x - 0.25,
              y + 0.13,
              12,
              C.ink,
              true
            )
          );
        }
      });

      a.push(
        text(
          group.length,
          center,
          cy - h / 2 + 0.27,
          30,
          color,
          true
        )
      );
    });

    a.push(
      text(
        expected
          ? 'Expected: 4 and 4'
          : 'Observed: 6 and 2',
        CX,
        cy - h / 2 - 0.47,
        22,
        C.violet,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // FAIR COIN
  // One independent nonzero change under the null.
  // ------------------------------------------------------------

  function coin(
    x, y,
    sign = null,
    radius = 0.37
  ) {
    const color =
      sign === null
        ? C.violet
        : signColor(sign);

    const glow = new M.Circle({
      radius: radius + 0.07,
      color
    });

    glow.setFill(color, 0.08);
    glow.moveTo([x, y, 0]);

    const body = new M.Circle({
      radius,
      color,
      strokeWidth: 2
    });

    body.setFill(color, 0.17);
    body.moveTo([x, y, 0]);

    return G(
      glow,
      body,

      text(
        sign === null
          ? '?'
          : signSymbol(sign),
        x,
        y,
        radius >= 0.35 ? 31 : 25,
        color,
        true
      )
    );
  }

  function fairCoinPicture() {
    const a = [];

    const y = P ? 0.72 : 0.68;

    a.push(
      coin(
        CX,
        y,
        null,
        0.45
      ),

      line(
        CX - 0.22,
        y - 0.39,
        CX - 1.58,
        y - 1.08,
        POS,
        2
      ),

      line(
        CX + 0.22,
        y - 0.39,
        CX + 1.58,
        y - 1.08,
        NEG,
        2
      ),

      coin(
        CX - 1.58,
        y - 1.49,
        1,
        0.43
      ),

      coin(
        CX + 1.58,
        y - 1.49,
        -1,
        0.43
      ),

      text(
        'Faster',
        CX - 1.58,
        y - 2.08,
        22,
        POS
      ),

      text(
        'Slower',
        CX + 1.58,
        y - 2.08,
        22,
        NEG
      ),

      text(
        '50%',
        CX - 1.58,
        y - 2.55,
        28,
        POS,
        true
      ),

      text(
        '50%',
        CX + 1.58,
        y - 2.55,
        28,
        NEG,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // EIGHT COINS
  // Each coin retains its agent identity.
  // ------------------------------------------------------------

  function eightCoins(
    signs = null
  ) {
    const a = [];

    const cols = 4;
    const dx = P ? 1.38 : 1.41;
    const dy = P ? 1.43 : 1.15;

    const top = P ? 0.65 : 0.70;

    NONZERO.forEach((d, i) => {
      const x =
        CX +
        (i % cols - 1.5) * dx;

      const y =
        top -
        Math.floor(i / cols) * dy;

      a.push(
        coin(
          x,
          y,
          signs === null
            ? null
            : signs[i],
          P ? 0.40 : 0.36
        ),

        text(
          d.id,
          x,
          y - 0.57,
          18,
          C.ink,
          true
        )
      );
    });

    if (signs !== null) {
      const plusCount = signs.filter(
        s => s > 0
      ).length;

      const minusCount =
        signs.length - plusCount;

      a.push(
        text(
          `${plusCount} plus; ${minusCount} minus`,
          CX,
          top - dy - 1.13,
          22,
          C.violet,
          true
        )
      );
    } else {
      a.push(
        text(
          'Eight independent fair signs',
          CX,
          top - dy - 1.13,
          21,
          C.violet
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // EXPECTED VS OBSERVED SIGN COUNTS
  // Hollow bars = expected.
  // Filled bars = observed.
  // ------------------------------------------------------------

  function signCountChart({
    expected = true,
    observed = true
  } = {}) {
    const a = [];

    const base = P ? -3.25 : -1.83;
    const scale = P ? 0.62 : 0.43;

    const xs = [
      CX - 1.54,
      CX + 1.54
    ];

    a.push(
      line(
        CX - 3.12,
        base,
        CX + 3.12,
        base,
        C.muted,
        2
      )
    );

    [2, 4, 6].forEach(v => {
      const y = base + v * scale;

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

    [NPLUS, NMINUS].forEach((n, k) => {
      const center = xs[k];
      const color = k === 0 ? POS : NEG;

      if (expected) {
        const x =
          observed ? center - 0.44 : center;

        const h = EXPECTED * scale;

        a.push(
          rect(
            x,
            base + h / 2,
            0.77,
            h,
            color,
            0,
            2.5
          ),

          text(
            EXPECTED,
            x,
            base + h + 0.23,
            22,
            color,
            true
          )
        );
      }

      if (observed) {
        const x =
          expected ? center + 0.44 : center;

        const h = n * scale;

        a.push(
          rect(
            x,
            base + h / 2,
            0.90,
            h + 0.08,
            color,
            0.10,
            0
          ),

          rect(
            x,
            base + h / 2,
            0.77,
            h,
            color,
            0.83,
            1.4
          ),

          text(
            n,
            x,
            base + h + 0.25,
            25,
            color,
            true
          )
        );
      }

      a.push(
        text(
          k === 0 ? 'Plus signs' : 'Minus signs',
          center,
          base - 0.34,
          19,
          color
        )
      );
    });

    if (expected && observed) {
      const y = base - 0.83;

      a.push(
        rect(
          CX - 2.38,
          y,
          0.22,
          0.22,
          C.muted,
          0
        ),

        text(
          'Expected',
          CX - 1.38,
          y,
          16,
          C.muted
        ),

        rect(
          CX + 0.36,
          y,
          0.22,
          0.22,
          POS,
          0.80,
          1
        ),

        text(
          'Observed',
          CX + 1.40,
          y,
          16,
          C.ink
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // ALL 256 EQUALLY LIKELY PATTERNS
  //
  // Each tile represents one complete sequence of eight signs.
  // Every pattern is enumerated exactly.
  // ------------------------------------------------------------

  function patternGrid(
    highlight = 'none'
  ) {
    const a = [];

    const cols = 16;
    const rows = 16;

    const dx = P ? 0.40 : 0.40;
    const dy = P ? 0.29 : 0.18;

    const top = P ? 1.02 : 1.10;

    // Group by minus count so that tail allocations are visible
    // as contiguous regions.

    const ordered = BUCKETS.flat();

    ordered.forEach((p, i) => {
      const x =
        CX +
        (i % cols - 7.5) * dx;

      const y =
        top -
        Math.floor(i / cols) * dy;

      const low = p.minusCount <= NMINUS;

      const high =
        p.minusCount >= N - NMINUS;

      let active = false;

      if (highlight === 'lower') {
        active = low;
      }

      if (highlight === 'both') {
        active = low || high;
      }

      const color =
        active
          ? low ? POS : NEG
          : C.muted;

      a.push(
        rounded(
          x,
          y,
          0.33,
          P ? 0.22 : 0.135,
          color,
          active ? 0.72 : 0.17,
          active ? 0.9 : 0.4,
          0.025
        )
      );
    });

    const labelY =
      top - (rows - 1) * dy - 0.48;

    const caption =
      highlight === 'lower'
        ? '37 highlighted patterns out of 256'
        : highlight === 'both'
          ? '74 highlighted patterns out of 256'
          : '256 equally likely patterns';

    a.push(
      text(
        caption,
        CX,
        labelY,
        20,
        highlight === 'none'
          ? C.violet
          : C.ink,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // A COMPLETE SIGN PATTERN
  // Used to show exactly zero, one, or two minus signs.
  // ------------------------------------------------------------

  function patternStrip(
    signs,
    x,
    y,
    {
      pitch = 0.46,
      radius = 0.17,
      size = 17
    } = {}
  ) {
    const a = [];

    signs.forEach((s, i) => {
      const px =
        x +
        (i - (signs.length - 1) / 2) *
          pitch;

      const color = signColor(s);

      const body = new M.Circle({
        radius,
        color,
        strokeWidth: 1
      });

      body.setFill(color, 0.13);
      body.moveTo([px, y, 0]);

      a.push(
        body,

        text(
          signSymbol(s),
          px,
          y,
          size,
          color,
          true
        )
      );
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // EXACTLY ZERO OR ONE MINUS
  //
  // 0 minus: one pattern.
  // 1 minus: eight patterns.
  // ------------------------------------------------------------

  function zeroOnePatterns(
    revealOne = false
  ) {
    const a = [];

    if (!revealOne) {
      a.push(
        text(
          'No minus signs',
          CX,
          0.92,
          23,
          POS
        ),

        patternStrip(
          BUCKETS[0][0].signs,
          CX,
          -0.10,
          {
            pitch: 0.70,
            radius: 0.26,
            size: 25
          }
        ),

        text(
          'Only 1 possible pattern',
          CX,
          -1.18,
          24,
          POS,
          true
        )
      );

      return G(a);
    }

    const top = P ? 0.85 : 0.82;
    const dy = P ? 0.55 : 0.43;

    const offset = P ? 1.65 : 1.68;

    const centers = [
      CX - offset,
      CX + offset
    ];

    a.push(
      text(
        '0 minus',
        centers[0],
        top + 0.52,
        20,
        POS
      ),

      text(
        '1 minus',
        centers[1],
        top + 0.52,
        20,
        NEG
      ),

      patternStrip(
        BUCKETS[0][0].signs,
        centers[0],
        top,
        {
          pitch: 0.34,
          radius: 0.13,
          size: 14
        }
      ),

      text(
        '1 pattern',
        centers[0],
        top - 0.63,
        21,
        POS,
        true
      )
    );

    BUCKETS[1].forEach((p, i) => {
      const y = top - i * dy;

      a.push(
        patternStrip(
          p.signs,
          centers[1],
          y,
          {
            pitch: 0.34,
            radius: 0.13,
            size: 14
          }
        )
      );
    });

    a.push(
      text(
        '8 patterns',
        centers[1],
        top - 7 * dy - 0.40,
        21,
        NEG,
        true
      ),

      line(
        CX,
        top + 0.25,
        CX,
        top - 7 * dy,
        C.muted,
        1
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // EXACTLY TWO MINUS
  // Every unordered pair of distinct agents appears once.
  //
  // 8 choose 2 = 28.
  // ------------------------------------------------------------

  function twoMinusPairs() {
    const a = [];

    const step = P ? 0.8 : 0.43;

    const left =
      CX - 3.5 * step + 0.18;

    const top = P ? 0.85 : 0.94;

    NONZERO.forEach((d, i) => {
      a.push(
        text(
          d.id,
          left + i * step,
          top + step * 0.67,
          17,
          NEG,
          true
        ),

        text(
          d.id,
          left - step * 0.67,
          top - i * step,
          17,
          NEG,
          true
        )
      );
    });

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const x = left + c * step;
        const y = top - r * step;

        const active = c > r;

        a.push(
          rounded(
            x,
            y,
            step * 0.83,
            step * 0.83,
            active ? NEG : C.muted,
            active ? 0.21 : 0.025,
            active ? 1.2 : 0.5,
            0.03
          )
        );

        if (active) {
          a.push(
            text(
              `${NONZERO[r].id}${NONZERO[c].id}`,
              x,
              y,
              P ? 18 : 14,
              NEG,
              true,
              step * 0.78
            )
          );
        }
      }
    }

    a.push(
      text(
        '28 distinct pairs of agents',
        CX,
        top - 7 * step - 0.55,
        21,
        NEG
      ),

      text(
        'Each filled square = one pattern',
        CX,
        top - 7 * step - 0.95,
        17,
        C.muted,
        false,
        6.4
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // BINOMIAL DISTRIBUTION
  // n = 8, p = 0.5.
  //
  // Horizontal axis: number of minus signs.
  // Vertical heights: number of equally likely patterns.
  // ------------------------------------------------------------

  const HIST_SP = P ? 0.72 : 0.74;

  const HIST_BASE = P ? -3.40 : -1.92;
  const HIST_MAXH = P ? 4.25 : 2.95;

  const HIST_BW = P ? 0.53 : 0.54;

  const hx = k =>
    CX + (k - 4) * HIST_SP;

  function histogram({
    highlight = 'none',
    observedMarker = true,
    labelTails = false
  } = {}) {
    const a = [];

    const left = CX - HIST_SP * 4.5;
    const right = CX + HIST_SP * 4.5;

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

    [20, 40, 60].forEach(v => {
      const y =
        HIST_BASE + v / 70 * HIST_MAXH;

      a.push(
        line(
          left,
          y,
          right,
          y,
          C.muted,
          0.55
        )
      );
    });

    KS.forEach(k => {
      const low = k <= NMINUS;
      const high = k >= N - NMINUS;

      const active =
        highlight === 'lower'
          ? low
          : highlight === 'both'
            ? low || high
            : false;

      const color =
        active
          ? low ? POS : NEG
          : C.violet;

      const n = WAYS[k];

      const h =
        n / 70 * HIST_MAXH;

      const x = hx(k);

      a.push(
        rect(
          x,
          HIST_BASE + h / 2,
          HIST_BW + 0.09,
          h + 0.055,
          color,
          active ? 0.13 : 0.055,
          0
        ),

        rect(
          x,
          HIST_BASE + h / 2,
          HIST_BW,
          h,
          color,
          active ? 0.92 : 0.60,
          active ? 1.8 : 1
        ),

        text(
          n,
          x,
          HIST_BASE + h + 0.20,
          P ? 18 : 17,
          color,
          true
        ),

        text(
          k,
          x,
          HIST_BASE - 0.28,
          18,
          k === NMINUS
            ? POS
            : C.muted,
          true
        )
      );
    });

    a.push(
      text(
        'Number of minus signs',
        CX,
        HIST_BASE - 0.75,
        18,
        C.muted
      )
    );

    if (observedMarker) {
      const y =
        HIST_BASE +
        WAYS[NMINUS] / 70 * HIST_MAXH;

      a.push(
        dashed(
          hx(NMINUS),
          y + 0.43,
          hx(NMINUS),
          y + 0.87,
          POS
        ),

        text(
          'Observed',
          hx(NMINUS) - 0.36,
          y + 1.05,
          15,
          POS
        )
      );
    }

    if (labelTails) {
      a.push(
        text(
          '37 ways',
          hx(1),
          P ? 1.30 : 1.39,
          18,
          POS,
          true
        ),

        text(
          '37 ways',
          hx(7),
          P ? 1.30 : 1.39,
          18,
          NEG,
          true
        )
      );
    }

    return G(a);
  }

  // ------------------------------------------------------------
  // ADD THE THREE LOWER-TAIL COUNTS
  // 1 + 8 + 28 = 37.
  // ------------------------------------------------------------

  function lowerTailPicture() {
    const a = [];

    const counts = [1, 8, 28];

    const xs = [
      CX - 2.04,
      CX,
      CX + 2.04
    ];

    const y = P ? 0.30 : 0.35;

    counts.forEach((n, k) => {
      const x = xs[k];

      a.push(
        rounded(
          x,
          y,
          1.70,
          1.60,
          POS,
          0.06,
          1.7
        ),

        text(
          `${k} minus`,
          x,
          y + 0.50,
          18,
          POS
        ),

        text(
          n,
          x,
          y - 0.02,
          34,
          POS,
          true
        ),

        text(
          'patterns',
          x,
          y - 0.50,
          16,
          C.muted
        )
      );
    });

    a.push(
      text(
        '+',
        CX - 1.02,
        y,
        27,
        C.ink
      ),

      text(
        '+',
        CX + 1.02,
        y,
        27,
        C.ink
      ),

      text(
        '1 + 8 + 28 = 37',
        CX,
        y - 1.32,
        27,
        POS,
        true
      ),

      text(
        '37 / 256 ≈ 14.5%',
        CX,
        y - 1.93,
        24,
        C.violet,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // BOTH TAILS
  // 0, 1, 2 minus versus 6, 7, 8 minus.
  // ------------------------------------------------------------

  function bothTailsPicture() {
    const a = [];

    const centers = [
      CX - 1.63,
      CX + 1.63
    ];

    const y = P ? 0.05 : 0.18;

    const labels = [
      'Faster direction',
      'Slower direction'
    ];

    const colors = [POS, NEG];

    centers.forEach((center, k) => {
      const color = colors[k];

      a.push(
        rounded(
          center,
          y,
          3.0,
          2.15,
          color,
          0.06,
          2
        ),

        text(
          labels[k],
          center,
          y + 0.76,
          20,
          color,
          false,
          2.8
        )
      );

      const signs = k === 0
        ? [1, 1, 1, 1, 1, 1, -1, -1]
        : [1, 1, -1, -1, -1, -1, -1, -1];

      a.push(
        patternStrip(
          signs,
          center,
          y + 0.25,
          {
            pitch: 0.34,
            radius: 0.13,
            size: 14
          }
        ),

        text(
          k === 0
            ? '0, 1 or 2 minus'
            : '6, 7 or 8 minus',
          center,
          y - 0.21,
          17,
          color,
          true
        ),

        text(
          '37 patterns',
          center,
          y - 0.69,
          23,
          color,
          true
        )
      );
    });

    a.push(
      text(
        '+',
        CX,
        y,
        28,
        C.ink
      ),

      text(
        '(37 + 37) / 256',
        CX,
        y - 1.54,
        26,
        C.violet,
        true
      ),

      text(
        'p ≈ 0.29',
        CX,
        y - 2.06,
        30,
        C.violet,
        true
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // P-VALUE COMPARED WITH THE FIVE-PERCENT LINE
  // ------------------------------------------------------------

  function decisionPicture() {
    const a = [];

    const maxP = 0.40;

    const w = P ? 6.08 : 6.40;
    const x0 = CX - w / 2;

    const y = P ? -0.48 : -0.30;

    const PX = v =>
      x0 + v / maxP * w;

    a.push(
      rect(
        PX(ALPHA / 2),
        y,
        w * ALPHA / maxP,
        0.48,
        POS,
        0.21,
        0
      ),

      rect(
        PX((ALPHA + maxP) / 2),
        y,
        w * (maxP - ALPHA) / maxP,
        0.48,
        C.muted,
        0.13,
        0
      ),

      line(
        PX(0),
        y,
        PX(maxP),
        y,
        C.muted,
        2
      )
    );

    [0, 0.05, 0.10, 0.20, 0.30, 0.40]
      .forEach(v => {
        a.push(
          line(
            PX(v),
            y - 0.10,
            PX(v),
            y + 0.10,
            C.muted,
            1
          ),

          text(
            `${Math.round(v * 100)}%`,
            PX(v),
            y - 0.34,
            16,
            C.muted,
            true
          )
        );
      });

    a.push(
      dashed(
        PX(ALPHA),
        y - 0.24,
        PX(ALPHA),
        y + 1.03,
        C.amber
      ),

      text(
        '5% cutoff',
        PX(ALPHA) + 0.37,
        y + 1.20,
        19,
        C.amber
      ),

      line(
        PX(PV),
        y - 0.20,
        PX(PV),
        y + 0.75,
        C.violet,
        3
      ),

      dot(
        PX(PV),
        y,
        C.violet,
        0.115
      ),

      text(
        'p ≈ 29%',
        PX(PV),
        y + 1.00,
        25,
        C.violet,
        true
      ),

      text(
        'Do not reject',
        CX,
        y - 1.03,
        25,
        C.ink
      ),

      text(
        'Not enough evidence at the 5% level',
        CX,
        y - 1.59,
        19,
        C.amber,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // PAIRED-DATA APPLICATION
  // A person or item is measured twice.
  // ------------------------------------------------------------

  function pairedApplication(
    example = 'training'
  ) {
    const a = [];

    const y = P ? -0.15 : -0.05;

    const beforeX = CX - 1.55;
    const afterX = CX + 1.55;

    a.push(
      person(
        CX,
        y + 0.92,
        C.violet,
        1.20
      ),

      text(
        example === 'training'
          ? 'Same person'
          : 'Same customer',
        CX,
        y + 1.55,
        22,
        C.violet
      ),

      line(
        CX - 0.20,
        y + 0.56,
        beforeX,
        y + 0.11,
        OLD,
        2
      ),

      line(
        CX + 0.20,
        y + 0.56,
        afterX,
        y + 0.11,
        NEW,
        2
      ),

      rounded(
        beforeX,
        y - 0.34,
        2.65,
        0.91,
        OLD,
        0.09
      ),

      rounded(
        afterX,
        y - 0.34,
        2.65,
        0.91,
        NEW,
        0.09
      ),

      text(
        example === 'training'
          ? 'Before training'
          : 'Before rating',
        beforeX,
        y - 0.34,
        19,
        OLD,
        false,
        2.43
      ),

      text(
        example === 'training'
          ? 'After training'
          : 'After rating',
        afterX,
        y - 0.34,
        19,
        NEW,
        false,
        2.43
      ),

      text(
        '↓',
        CX,
        y - 1.03,
        24,
        C.violet
      ),

      rounded(
        CX,
        y - 1.58,
        4.7,
        0.70,
        C.violet,
        0.08,
        1.7
      ),

      text(
        'Keep the direction of change',
        CX,
        y - 1.58,
        20,
        C.violet,
        false,
        4.43
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // APPLICATIONS WITHOUT A NORMAL-DISTRIBUTION ASSUMPTION
  // Ratings, rankings, skewed times.
  // ------------------------------------------------------------

  function robustApplications() {
    const a = [];

    const ys = [
      P ? 0.95 : 0.92,
      P ? -0.53 : -0.29,
      P ? -2.03 : -1.52
    ];

    const labels = [
      'Ratings',
      'Rankings',
      'Skewed times'
    ];

    const colors = [
      NEW,
      C.violet,
      NEG
    ];

    labels.forEach((s, r) => {
      a.push(
        rounded(
          CX,
          ys[r],
          6.35,
          P ? 1.16 : 1.02,
          colors[r],
          0.035,
          1.5
        ),

        text(
          s,
          CX - 1.99,
          ys[r],
          19,
          colors[r],
          false,
          2.05
        )
      );
    });

    for (let k = 0; k < 5; k++) {
      const x =
        CX - 0.20 + k * 0.66;

      a.push(
        rounded(
          x,
          ys[0],
          0.53,
          0.52,
          NEW,
          k < 4 ? 0.30 : 0.035,
          1
        ),

        text(
          k + 1,
          x,
          ys[0],
          20,
          NEW,
          true
        )
      );
    }

    [1, 2, 3].forEach((v, k) => {
      const x =
        CX + 0.02 + k * 0.91;

      a.push(
        rounded(
          x,
          ys[1],
          0.70,
          0.58,
          C.violet,
          0.12
        ),

        text(
          v,
          x,
          ys[1],
          23,
          C.violet,
          true
        )
      );
    });

    const values = [
      9, 10, 10, 11, 12, 12, 14, 45
    ];

    const x1 = CX - 0.42;
    const ww = 3.26;

    values.forEach((v, i) => {
      const x =
        x1 +
        (v - 7) / 40 * ww;

      const stack =
        values.slice(0, i)
          .filter(u => u === v).length;

      a.push(
        dot(
          x,
          ys[2] - 0.08 + stack * 0.19,
          NEG,
          0.075
        )
      );
    });

    a.push(
      line(
        x1,
        ys[2] - 0.26,
        x1 + ww,
        ys[2] - 0.26,
        C.muted,
        1
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // ROBUSTNESS TO ONE WILD VALUE
  //
  // This is explicitly illustrative.
  // The actual observed data remain unchanged.
  // ------------------------------------------------------------

  function outlierSignPicture(
    huge = false
  ) {
    const a = [];

    const y = P ? 0.14 : 0.28;

    const xs = [
      CX - 1.65,
      CX + 1.65
    ];

    const values = [
      3,
      huge ? 300 : 8
    ];

    values.forEach((n, k) => {
      const x = xs[k];

      a.push(
        rounded(
          x,
          y,
          2.83,
          1.32,
          POS,
          0.08,
          2
        ),

        text(
          k === 0
            ? 'Ordinary change'
            : 'Imagined wild change',
          x,
          y + 0.37,
          17,
          C.muted,
          false,
          2.60
        ),

        text(
          `+${n}`,
          x,
          y - 0.14,
          33,
          POS,
          true
        ),

        text(
          '↓',
          x,
          y - 0.94,
          24,
          C.violet
        ),

        coin(
          x,
          y - 1.54,
          1,
          0.37
        ),

        text(
          'One plus sign',
          x,
          y - 2.11,
          19,
          POS
        )
      );
    });

    return G(a);
  }

  // ------------------------------------------------------------
  // MAGNITUDES OF THE EIGHT NONZERO DIFFERENCES
  //
  // Negative changes extend to the left.
  // Positive changes extend to the right.
  // ------------------------------------------------------------

  function magnitudePicture({
    focus = 'all',
    signsOnly = false
  } = {}) {
    const a = [];

    const records = NONZERO.slice().sort(
      (a, b) =>
        Math.abs(a.diff) -
        Math.abs(b.diff)
    );

    const zeroX = CX - 1.17;
    const unit = P ? 0.43 : 0.45;

    const top = P ? 1.05 : 1.06;
    const dy = P ? 0.64 : 0.41;

    const bottom =
      top - (records.length - 1) * dy;

    a.push(
      line(
        zeroX,
        top + 0.35,
        zeroX,
        bottom - 0.31,
        C.muted,
        1.5
      ),

      text(
        '0',
        zeroX,
        bottom - 0.54,
        16,
        C.muted,
        true
      ),

      text(
        'Slower',
        CX - 2.60,
        top + 0.44,
        17,
        NEG
      ),

      text(
        'Faster',
        CX + 1.65,
        top + 0.44,
        17,
        POS
      )
    );

    records.forEach((d, i) => {
      const y = top - i * dy;

      const color = signColor(d.diff);

      const active =
        focus === 'all' ||
        (
          focus === 'minus' &&
          d.diff < 0
        ) ||
        (
          focus === 'plus' &&
          d.diff > 0
        );

      const bw =
        (signsOnly ? 1 : Math.abs(d.diff)) *
        unit;

      const center =
        zeroX +
        Math.sign(d.diff) * bw / 2;

      a.push(
        text(
          d.id,
          CX - 3.02,
          y,
          17,
          active ? C.ink : C.muted,
          true
        ),

        rect(
          center,
          y,
          bw,
          P ? 0.37 : 0.27,
          active ? color : C.muted,
          active ? 0.81 : 0.20,
          active ? 1.2 : 0.7
        ),

        text(
          signsOnly
            ? signSymbol(d.diff)
            : signed(d.diff),

          zeroX +
            Math.sign(d.diff) *
              (bw + 0.25),

          y,

          signsOnly ? 23 : 19,

          active ? color : C.muted,

          true
        )
      );
    });

    a.push(
      text(
        signsOnly
          ? 'Every nonzero change now has equal weight'
          : 'Actual sizes of the changes',

        CX,
        bottom - 0.91,
        18,
        C.violet,
        false,
        6.5
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // INFORMATION LOSS
  // Compare a small negative change and a large positive one.
  // ------------------------------------------------------------

  function informationLossPicture() {
    const a = [];

    const y = P ? 0.42 : 0.53;

    const xs = [
      CX - 1.62,
      CX + 1.62
    ];

    const values = [-1, 8];

    values.forEach((v, k) => {
      const x = xs[k];

      const color = signColor(v);

      a.push(
        text(
          v < 0
            ? 'Small loss'
            : 'Large saving',
          x,
          y + 0.70,
          21,
          color
        ),

        rect(
          x,
          y,
          Math.abs(v) / 8 * 2.45,
          0.50,
          color,
          0.80,
          1.5
        ),

        text(
          `${signed(v)} min`,
          x,
          y - 0.46,
          24,
          color,
          true
        ),

        text(
          '↓',
          x,
          y - 1.00,
          24,
          C.violet
        ),

        coin(
          x,
          y - 1.58,
          Math.sign(v),
          0.40
        ),

        text(
          'One vote',
          x,
          y - 2.16,
          21,
          color
        )
      );
    });

    a.push(
      text(
        '=',
        CX,
        y - 1.58,
        28,
        C.muted
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // PREVIEW OF THE NEXT LESSON
  // Rank absolute sizes rather than using sizes as raw weights.
  // ------------------------------------------------------------

  function rankPreview() {
    const a = [];

    const records = NONZERO.slice().sort(
      (a, b) =>
        Math.abs(a.diff) -
        Math.abs(b.diff)
    );

    const sp = P ? 0.78 : 0.80;

    const base = P ? -2.50 : -1.58;
    const scale = P ? 0.36 : 0.28;

    records.forEach((d, i) => {
      const x =
        CX +
        (i - 3.5) * sp;

      const h =
        Math.abs(d.diff) * scale;

      const color = signColor(d.diff);

      a.push(
        rect(
          x,
          base + h / 2,
          0.54,
          h,
          color,
          0.78,
          1.2
        ),

        text(
          signed(d.diff),
          x,
          base + h + 0.22,
          17,
          color,
          true
        ),

        text(
          i + 1,
          x,
          base - 0.31,
          20,
          C.violet,
          true
        )
      );
    });

    a.push(
      line(
        CX - 3.18,
        base,
        CX + 3.18,
        base,
        C.muted,
        2
      ),

      text(
        'Rank the sizes: smallest to largest',
        CX,
        base - 0.81,
        19,
        C.violet,
        false,
        6.5
      ),

      text(
        'Keep each original sign',
        CX,
        base - 1.23,
        19,
        C.ink
      )
    );

    return G(a);
  }

  // ------------------------------------------------------------
  // FINAL SUMMARY
  // ------------------------------------------------------------

  function summaryPicture() {
    const a = [];

    const signs = NONZERO.map(
      d => d.sign
    );

    const y = P ? 0.72 : 0.77;

    a.push(
      text(
        'Eight nonzero paired changes',
        CX,
        y + 0.57,
        21,
        C.violet
      ),

      patternStrip(
        signs,
        CX,
        y,
        {
          pitch: 0.74,
          radius: 0.26,
          size: 25
        }
      ),

      text(
        '6 plus',
        CX - 1.45,
        y - 0.71,
        24,
        POS,
        true
      ),

      text(
        '2 minus',
        CX + 1.45,
        y - 0.71,
        24,
        NEG,
        true
      ),

      text(
        '↓',
        CX,
        y - 1.21,
        24,
        C.violet
      ),

      text(
        'Compare with eight fair coins',
        CX,
        y - 1.71,
        20,
        C.violet
      ),

      rounded(
        CX,
        y - 2.40,
        5.78,
        0.72,
        C.amber,
        0.08,
        1.8
      ),

      text(
        'p ≈ 0.29 — do not reject',
        CX,
        y - 2.40,
        23,
        C.amber,
        true,
        5.45
      )
    );

    return G(a);
  }

  // ============================================================
  // NARRATION BEATS
  // ============================================================

  // ------------------------------------------------------------
  // 0. The trial timed how long agents spend on a ticket.
  // ------------------------------------------------------------

  await until(S(0));

  await play(
    ...scene(timingPicture()),

    ...say(
      'HOW LONG DOES EACH TICKET TAKE?'
    )
  );

  // ------------------------------------------------------------
  // 1. Nine agents timed twice, old and new script.
  // ------------------------------------------------------------

  await until(S(1));

  await play(
    ...scene(agentTimeTable(9, false)),

    ...fbox([
      ['9 matched agents', C.violet],
      ['Old-script minutes', OLD],
      ['New-script minutes', NEW]
    ]),

    ...say(
      'NINE AGENTS, EACH TIMED TWICE',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 2. Agent A: 12 to 9. Agent B: 15 to 11.
  // ------------------------------------------------------------

  await until(S(2));

  await play(
    ...scene(exampleAgents(false)),

    ...fbox([
      ['A: 12 → 9 minutes', NEW],
      ['B: 15 → 11 minutes', NEW]
    ]),

    ...say(
      'COMPARE EACH AGENT WITH THEMSELVES'
    )
  );

  // ------------------------------------------------------------
  // 3. Define minutes saved: old minus new.
  // ------------------------------------------------------------

  await until(S(3));

  await play(
    ...scene(exampleAgents(true)),

    ...fbox([
      'Minutes saved',
      ['= old time − new time', POS],
      'A: 12 − 9 = +3',
      'B: 15 − 11 = +4'
    ]),

    ...say(
      'MINUTES SAVED = OLD − NEW',
      POS
    )
  );

  // ------------------------------------------------------------
  // 4. Nine changes, one dot per agent.
  // Reveal in the exact narration order.
  // ------------------------------------------------------------

  const changeDots =
    DATA.map(d => differenceDot(d));

  await until(S(4));

  await play(
    ...scene(differenceAxes(false)),

    ...fbox([
      'One dot per agent',
      ['Minutes saved', POS]
    ]),

    ...say(
      'THE NINE PAIRED CHANGES'
    )
  );

  // Timing within sentence 4 follows the narration order.
  // Values remain attached to their original agent labels.

  const offsets = [
    3.0, 3.9, 4.8,
    5.7, 6.6, 7.5,
    8.4, 9.3, 10.2
  ];

  for (let i = 0; i < DATA.length; i++) {
    await until(S(4) + offsets[i]);

    await play(
      new M.FadeIn(
        changeDots[i],
        { runTime: 0.30 }
      )
    );
  }

  // ------------------------------------------------------------
  // 5. Plus = faster; minus = slower; zero = no change.
  // ------------------------------------------------------------

  await until(S(5));

  await play(
    new M.FadeOut(
      new M.VGroup(...changeDots),
      { runTime: 0.35 }
    ),

    ...scene(completeDifferencePicture(true)),

    ...fbox([
      ['Plus: faster', POS],
      ['Minus: slower', NEG],
      ['Zero: no change', TIE]
    ]),

    ...say(
      'PLUS = FASTER; MINUS = SLOWER'
    )
  );

  // ------------------------------------------------------------
  // 6. Does the new script make agents faster?
  // ------------------------------------------------------------

  await until(S(6));

  await play(
    ...fbox([
      'Paired timing data',
      ['Does the new script save time?', C.amber]
    ], C.amber),

    ...say(
      'DOES THE NEW SCRIPT MAKE AGENTS FASTER?',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 7. One very bad day can pull an average up.
  // Illustrative example, not new chapter data.
  // ------------------------------------------------------------

  await until(S(7));

  await play(
    ...scene(unusualDayPicture(false)),

    ...fbox([
      'Illustrative example',
      'Ordinary daily times',
      'Mean = 10 minutes'
    ]),

    ...say(
      'HANDLING TIMES CAN BE STRANGE',
      C.amber
    )
  );

  await until(S(7) + 2.6);

  await play(
    ...scene(unusualDayPicture(true)),

    ...fbox([
      'One unusual 50-minute day',
      ['Mean rises to 18 minutes', NEG],
      'Averages can be sensitive'
    ], C.amber),

    ...say(
      'ONE BAD DAY CAN PULL THE AVERAGE UP',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 8. Forget the sizes; keep the signs.
  // Transform the actual nine difference cards into signs.
  // ------------------------------------------------------------

  const signCards = DATA.map(
    (d, i) =>
      initialSignCard(d, i, false)
  );

  await until(S(8));

  await play(
    ...scene(null),

    new M.LaggedStart(
      signCards.map(t =>
        new M.FadeIn(t)
      ),
      {
        lagRatio: 0.055,
        runTime: 1.05
      }
    ),

    ...fbox([
      'A careful approach',
      'Ignore the numerical sizes',
      ['Keep only the direction', C.violet]
    ], C.violet),

    ...say(
      'FORGET THE SIZES',
      C.violet
    )
  );

  await until(S(8) + 2.8);

  await play(
    new M.LaggedStart(
      signCards.map((t, i) =>
        new M.Transform(
          t,
          initialSignCard(
            DATA[i],
            i,
            true
          )
        )
      ),
      {
        lagRatio: 0.075,
        runTime: 1.35
      }
    ),

    ...fbox([
      '+3, +4, +5, ... become +',
      '−1 and −2 become −',
      ['Ignore magnitude', C.violet]
    ], C.violet),

    ...say(
      'KEEP ONLY THE SIGN',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 9. A sign is just plus or minus.
  // ------------------------------------------------------------

  await until(S(9));

  await play(
    ...fbox([
      ['Positive change → +', POS],
      ['Negative change → −', NEG]
    ]),

    ...say(
      'JUST PLUS OR MINUS',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 10. Agent I has zero change, so set it aside.
  // ------------------------------------------------------------

  await until(S(10));

  await play(
    new M.Indicate(
      signCards[8],
      {
        color: TIE,
        runTime: 0.65
      }
    ),

    ...fbox([
      'Agent I',
      '11 − 11 = 0',
      ['Zero has no sign', TIE]
    ]),

    ...say(
      'ZERO CHANGE: SET IT ASIDE',
      TIE
    )
  );

  await until(S(10) + 2.0);

  await play(
    new M.FadeOut(
      signCards[8],
      { runTime: 0.55 }
    ),

    ...fbox([
      '9 matched agents',
      '1 zero excluded',
      ['8 nonzero changes remain', C.violet]
    ])
  );

  // ------------------------------------------------------------
  // 11. Eight agents: six plus and two minus.
  // ------------------------------------------------------------

  await until(S(11));

  await play(
    new M.FadeOut(
      new M.VGroup(
        ...signCards.slice(0, 8)
      )
    ),

    ...scene(splitSignsPicture(false)),

    ...fbox([
      'n = 8',
      ['Plus signs = 6', POS],
      ['Minus signs = 2', NEG]
    ]),

    ...say(
      'SIX PLUS SIGNS AND TWO MINUS SIGNS'
    )
  );

  // ------------------------------------------------------------
  // 12. Null hypothesis: the script makes no difference.
  // ------------------------------------------------------------

  await until(S(12));

  await play(
    ...scene(eightCoins(null)),

    ...fbox([
      'Null hypothesis',
      ['No tendency to get faster', C.violet],
      'Plus and minus equally likely'
    ], C.violet),

    ...say(
      'NULL: NO PREFERRED DIRECTION',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 13. Each agent is like a coin flip: half and half.
  // ------------------------------------------------------------

  await until(S(13));

  await play(
    ...scene(fairCoinPicture()),

    ...fbox([
      ['P(plus) = ½', POS],
      ['P(minus) = ½', NEG],
      'For a nonzero change'
    ], C.violet),

    ...say(
      'ONE NONZERO CHANGE = ONE FAIR COIN FLIP',
      C.violet
    )
  );

  await until(S(13) + 2.6);

  await play(
    ...scene(eightCoins([
      1, -1, 1, -1,
      -1, 1, 1, -1
    ])),

    ...fbox([
      'Example of eight fair flips',
      ['4 plus; 4 minus', C.violet]
    ])
  );

  // ------------------------------------------------------------
  // 14. Expected four of each.
  // ------------------------------------------------------------

  await until(S(14));

  await play(
    ...scene(splitSignsPicture(true)),

    ...fbox([
      '8 × ½ = 4',
      ['Expected plus = 4', POS],
      ['Expected minus = 4', NEG]
    ]),

    ...say(
      'EXPECTED: FOUR PLUS AND FOUR MINUS'
    )
  );

  // ------------------------------------------------------------
  // 15. Only two minus signs observed.
  // How surprising is this by luck?
  // ------------------------------------------------------------

  await until(S(15));

  await play(
    ...scene(signCountChart({
      expected: true,
      observed: true
    })),

    ...fbox([
      'Expected: 4 and 4',
      ['Observed: 6 and 2', C.violet],
      'How unusual is this split?'
    ]),

    ...say(
      'HOW SURPRISING ARE ONLY TWO MINUS SIGNS?',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 16. A binomial count, like the first lesson.
  // ------------------------------------------------------------

  await until(S(16));

  await play(
    ...scene(eightCoins(
      NONZERO.map(d => d.sign)
    )),

    ...fbox([
      ['Exact binomial counting', C.violet],
      '8 independent fair signs',
      'Count the minus signs'
    ], C.violet),

    ...say(
      'BACK TO THE BINOMIAL COUNT',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 17. Eight coins give 256 possible patterns.
  // ------------------------------------------------------------

  await until(S(17));

  await play(
    ...scene(patternGrid('none')),

    ...fbox([
      '2 choices for each agent',
      '2 × 2 × ... × 2',
      ['2⁸ = 256 patterns', C.violet]
    ], C.violet),

    ...say(
      '256 EQUALLY LIKELY SIGN PATTERNS',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 18. Zero minus: one pattern.
  // Exactly one minus: eight patterns.
  // ------------------------------------------------------------

  await until(S(18));

  await play(
    ...scene(zeroOnePatterns(false)),

    ...fbox([
      'Exactly 0 minus',
      'All eight are plus',
      ['C(8,0) = 1 pattern', POS]
    ]),

    ...say(
      'NO MINUS: ONE PATTERN',
      POS
    )
  );

  await until(S(18) + 3.1);

  await play(
    ...scene(zeroOnePatterns(true)),

    ...fbox([
      'Exactly 1 minus',
      'Choose which agent',
      ['C(8,1) = 8 patterns', NEG]
    ]),

    ...say(
      'ONE MINUS: EIGHT PATTERNS',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 19. Exactly two minus: 28 patterns.
  // ------------------------------------------------------------

  await until(S(19));

  await play(
    ...scene(twoMinusPairs()),

    ...fbox([
      'Exactly 2 minus',
      'Choose 2 of the 8 agents',
      '8 × 7 ÷ 2',
      ['= 28 patterns', NEG]
    ]),

    ...say(
      'TWO MINUS: 28 DIFFERENT PAIRS',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 20. Together, 37 out of 256.
  // Approximately one in seven.
  // ------------------------------------------------------------

  await until(S(20));

  await play(
    ...scene(lowerTailPicture()),

    ...fbox([
      'P(2 or fewer minus)',
      '  = (1 + 8 + 28) / 256',
      ['  = 37 / 256', POS],
      ['  ≈ 0.145', C.violet]
    ]),

    ...say(
      '37 OF 256: ABOUT ONE IN SEVEN',
      POS
    )
  );

  await until(S(20) + 3.2);

  await play(
    ...scene(histogram({
      highlight: 'lower',
      observedMarker: true
    })),

    ...fbox([
      'Lower tail',
      ['37 / 256 ≈ 14.5%', POS]
    ])
  );

  // ------------------------------------------------------------
  // 21. No direction fixed in advance: count both sides.
  // Two-sided exact p-value = 74/256 ≈ 0.29.
  // ------------------------------------------------------------

  await until(S(21));

  await play(
    ...scene(bothTailsPicture()),

    ...fbox([
      'Two-sided test',
      ['Lower tail = 37', POS],
      ['Upper tail = 37', NEG],
      'Total extreme = 74'
    ], C.violet),

    ...say(
      'COUNT BOTH DIRECTIONS',
      C.violet
    )
  );

  await until(S(21) + 3.2);

  await play(
    ...scene(histogram({
      highlight: 'both',
      observedMarker: true,
      labelTails: true
    })),

    ...fbox([
      'p = (37 + 37) / 256',
      '  = 74 / 256',
      ['  ≈ ' + PV.toFixed(2), C.violet]
    ], C.violet),

    ...say(
      'TWO-SIDED P-VALUE ≈ 0.29',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 22. Far above 5%; cannot reject the null.
  // ------------------------------------------------------------

  await until(S(22));

  await play(
    ...scene(decisionPicture()),

    ...fbox([
      'p ≈ 0.289',
      ['0.289 > 0.05', C.amber],
      'Do not reject the null',
      'Not enough evidence'
    ], C.amber),

    ...say(
      'NOT SIGNIFICANT AT THE 5% LEVEL',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 23. Six out of eight looks good.
  // But luck produces such splits quite often.
  // ------------------------------------------------------------

  await until(S(23));

  await play(
    ...scene(patternGrid('both')),

    ...fbox([
      '74 extreme patterns',
      'Out of 256 fair patterns',
      ['About 29 in 100', C.violet]
    ]),

    ...say(
      'LUCK CAN PRODUCE A SPLIT THIS LOPSIDED'
    )
  );

  // ------------------------------------------------------------
  // 24. This is called the sign test.
  // ------------------------------------------------------------

  await until(S(24));

  await play(
    ...scene(allSignsPicture(
      true,
      false
    )),

    ...fbox([
      ['The sign test', C.violet],
      'Keep + and −',
      'Discard zero changes',
      'Ignore numerical sizes'
    ], C.violet),

    ...say(
      'THE SIGN TEST',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 25. Count plus signs among nonzero changes.
  // Under the null the count is binomial with p = 1/2.
  // ------------------------------------------------------------

  await until(S(25));

  await play(
    ...scene(splitSignsPicture(false)),

    ...fbox([
      'Let X = number of plus signs',
      'n = nonzero changes',
      ['X ~ Binomial(n, ½)', C.violet]
    ], C.violet),

    ...say(
      'COUNT THE PLUS SIGNS'
    )
  );

  await until(S(25) + 3.8);

  await play(
    ...scene(eightCoins(
      NONZERO.map(d => d.sign)
    )),

    ...fbox([
      'Our example',
      '8 changes that are not zero',
      ['plus signs = 6', POS],
      'chance of plus (null) = ½'
    ]),

    ...say(
      'UNDER THE NULL, THE CHANCE IS ONE HALF',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 26. Is the sign split more lopsided than fair coins?
  // ------------------------------------------------------------

  await until(S(26));

  await play(
    ...scene(histogram({
      highlight: 'both',
      observedMarker: true,
      labelTails: true
    })),

    ...fbox([
      'Compare the observed split',
      'With fair-coin possibilities',
      ['p ≈ 0.29', C.violet]
    ]),

    ...say(
      'IS THE SPLIT MORE LOPSIDED THAN FAIR COINS?',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 27. Use for paired data when only direction is trusted.
  // ------------------------------------------------------------

  await until(S(27));

  await play(
    ...scene(pairedApplication('training')),

    ...fbox([
      'Paired observations',
      'Same person measured twice',
      ['Trust the direction of change', C.violet]
    ]),

    ...say(
      'USE WHEN ONLY THE DIRECTION IS TRUSTED'
    )
  );

  await until(S(27) + 4.0);

  await play(
    ...scene(pairedApplication('rating')),

    ...fbox([
      'Same item or person',
      'Before and after',
      ['Better, worse or unchanged', C.violet]
    ])
  );

  // ------------------------------------------------------------
  // 28. No bell curve or trust in sizes.
  // Ratings, rankings and very skewed times.
  // ------------------------------------------------------------

  await until(S(28));

  await play(
    ...scene(robustApplications()),

    ...fbox([
      'No normal curve required',
      'Ratings and rankings',
      'Very skewed times',
      ['Only direction matters', C.violet]
    ], C.violet),

    ...say(
      'NO BELL CURVE NEEDED',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 29. A huge change still counts as one plus.
  // The +300 value is purely illustrative.
  // ------------------------------------------------------------

  await until(S(29));

  await play(
    ...scene(outlierSignPicture(false)),

    ...fbox([
      '+3 counts as one plus',
      '+8 counts as one plus',
      ['Each agent gets one sign', POS]
    ]),

    ...say(
      'EVERY NONZERO CHANGE GETS ONE VOTE',
      POS
    )
  );

  await until(S(29) + 2.5);

  await play(
    ...scene(outlierSignPicture(true)),

    ...fbox([
      'Imagine a wild value: +300',
      ['Still only one plus', POS],
      'The size does not count'
    ]),

    ...say(
      'EVEN A HUGE VALUE IS JUST ONE SIGN',
      POS
    )
  );

  // ------------------------------------------------------------
  // 30. Common trap: the sign test discards information.
  // ------------------------------------------------------------

  await until(S(30));

  await play(
    ...scene(magnitudePicture({
      focus: 'all',
      signsOnly: true
    })),

    ...fbox([
      ['Common trap', C.amber],
      'Robustness has a cost',
      'The sizes are discarded'
    ], C.amber),

    ...say(
      'TRAP: THROWING AWAY INFORMATION',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 31. The two minus changes are the smallest.
  // Minus one and minus two.
  // ------------------------------------------------------------

  await until(S(31));

  await play(
    ...scene(magnitudePicture({
      focus: 'minus',
      signsOnly: false
    })),

    ...fbox([
      ['Agent C: −1 minute', NEG],
      ['Agent F: −2 minutes', NEG],
      'The two smallest magnitudes'
    ], C.amber),

    ...say(
      'BOTH MINUS CHANGES ARE TINY',
      NEG
    )
  );

  // ------------------------------------------------------------
  // 32. All six positive changes are larger.
  // From +3 up to +8 minutes.
  // ------------------------------------------------------------

  await until(S(32));

  await play(
    ...scene(magnitudePicture({
      focus: 'plus',
      signsOnly: false
    })),

    ...fbox([
      ['+3, +4, +5', POS],
      ['+6, +7, +8', POS],
      'All larger than the losses'
    ]),

    ...say(
      'ALL SIX PLUS CHANGES ARE LARGER',
      POS
    )
  );

  // ------------------------------------------------------------
  // 33. Tiny minus counts as much as a big plus.
  // ------------------------------------------------------------

  await until(S(33));

  await play(
    ...scene(informationLossPicture()),

    ...fbox([
      '−1 minute → one minus',
      '+8 minutes → one plus',
      ['Both get equal weight', C.amber]
    ], C.amber),

    ...say(
      'A TINY MINUS COUNTS AS MUCH AS A BIG PLUS',
      C.amber
    )
  );

  // ------------------------------------------------------------
  // 34. The sign test can miss an effect.
  // Next lesson will use size ranks.
  // ------------------------------------------------------------

  await until(S(34));

  await play(
    ...scene(magnitudePicture({
      focus: 'all',
      signsOnly: false
    })),

    ...fbox([
      'The sign test may miss an effect',
      'Here, the gains are larger',
      ['But p ≈ 0.29', C.amber]
    ], C.amber),

    ...say(
      'IGNORING SIZES CAN REDUCE POWER',
      C.amber
    )
  );

  await until(S(34) + 3.0);

  await play(
    ...scene(rankPreview()),

    ...fbox([
      'Next: use the sizes',
      'But replace sizes with ranks',
      ['Wilcoxon signed-rank test', C.violet]
    ], C.violet),

    ...say(
      'NEXT: KEEP THE SIGNS AND RANK THE SIZES',
      C.violet
    )
  );

  // ------------------------------------------------------------
  // 35. Closing summary.
  // Sign test asks whether plus and minus changes are more
  // lopsided than fair coin flips would be.
  // ------------------------------------------------------------

  await until(S(35));

  await play(
    ...scene(summaryPicture()),

    ...fbox([
      ['Sign test', C.violet],
      'Drop zeros; count signs',
      'Compare with Binomial(n, ½)',
      ['p = 74/256 ≈ 0.29', C.amber]
    ], C.violet),

    ...say(
      'SIGN TEST: ARE THE DIRECTIONS MORE LOPSIDED THAN LUCK?',
      C.violet
    )
  );

  await until(S(35) + 3.4);

  await play(
    ...scene(histogram({
      highlight: 'both',
      observedMarker: true,
      labelTails: true
    })),

    ...fbox([
      ['6 plus; 2 minus', C.ink],
      '8 nonzero paired changes',
      'Two-sided p ≈ 0.29',
      ['Do not reject the null', C.amber]
    ], C.amber)
  );

  await until(E(35));

  // ------------------------------------------------------------
  // IMPLEMENTATION NOTES
  // ------------------------------------------------------------
  //
  // All 36 narration beats, S(0) through S(35), are included.
  //
  // Shared chapter data:
  //
  // Agent    Old    New    Saved
  //   A       12      9      +3
  //   B       15     11      +4
  //   C       10     11      -1
  //   D       14      9      +5
  //   E       16     10      +6
  //   F        9     11      -2
  //   G       18     11      +7
  //   H       20     12      +8
  //   I       11     11       0
  //
  // Agent I is excluded because its difference is zero.
  //
  // Nonzero changes = 8
  // Plus signs = 6
  // Minus signs = 2
  //
  // Null model:
  //   X ~ Binomial(8, 0.5)
  //
  // Exact pattern counts:
  //   [1, 8, 28, 56, 70, 56, 28, 8, 1]
  //
  // All 256 individual sign patterns are enumerated.
  //
  // Lower-tail probability:
  //   (1 + 8 + 28) / 256
  //   = 37 / 256
  //   = 0.14453125
  //
  // Two-sided exact p-value:
  //   74 / 256
  //   = 0.2890625
  //   ≈ 0.29
  //
  // Decision at alpha = 0.05:
  //   Do not reject the null.
  //
  // The unusual-day and +300-minute examples are explicitly
  // illustrative and do not change the actual chapter data.
  //
  // The within-sentence reveal offsets are chosen from the
  // supplied sentence timestamps, not word-level audio cues.
  //
  // Uses the supplied live-engine interface, approved reference
  // conventions, shared chapter data, and responsive layouts.
  //
  // Browser execution, animation timing, and responsive rendering
  // have not been tested against the complete engine.js.
}
