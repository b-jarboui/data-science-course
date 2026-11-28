// lesson 13.1.3
// Nearest neighbors: predicting a label by asking nearby examples.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the exact shared chapter data and unrounded distances.
// Weight and hue grid units have equal visual lengths.
// Try it beats preview the separate interactive activity.
// Written against the supplied engine interface; browser runtime not tested.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C,
    S, E, T, pill, show, showA, until, play, LINE_Y
  } = L;

  // ============================================================
  // COURSE COLOURS AND RESPONSIVE LAYOUT
  // ============================================================

  const PLUM = C.violet || '#A78BFA';
  const APPLE = C.orange || '#FB923C';
  const PEAR = C.green || '#4ADE80';
  const WHITE = '#FFFFFF';
  const GOLD = C.amber;

  const COLORS = [PLUM, APPLE, PEAR];
  const NAMES = ['plum', 'apple', 'pear'];

  const CX = P ? 0 : -2.6;

  const PILL = P
    ? [0, 2.25, 0]
    : [CX, 1.85, 0];

  const BOXP = P
    ? [0, 3.55, 0]
    : [4.3, -0.3, 0];

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  // Equal horizontal and vertical grid spacing is essential:
  // one weight unit and one hue unit must have equal lengths.

  const U = P ? 0.70 : 0.43;

  const XL = P ? -2.95 : CX - 4.25 * U;
  const YB = P ? -4.85 : -2.43;

  const XMAX = 8.5;
  const YMAX = 8.5;

  const XR = XL + XMAX * U;
  const YT = YB + YMAX * U;

  const X = x => XL + x * U;
  const Y = y => YB + y * U;

  const xy = (x, y) => [X(x), Y(y), 0];

  const FR = P ? 0.135 : 0.105;

  const HUE = [
    '#EF4444',
    '#F97316',
    '#FB923C',
    '#FBBF24',
    '#FACC15',
    '#A3E635',
    '#65A30D',
    '#22C55E'
  ];

  // Phone content bounds: y = -5.5 to 4.3.
  // Laptop content bounds: y = -3.0 to 2.3.

  // ============================================================
  // EXACT SHARED CHAPTER DATA
  // ============================================================

  const DATA = [
    { id: 'P1', label: 'plum',  weight: 50,  hue: 3, firmness: 3 },
    { id: 'P2', label: 'plum',  weight: 150, hue: 3, firmness: 4 },
    { id: 'P3', label: 'plum',  weight: 100, hue: 2, firmness: 2 },
    { id: 'P4', label: 'plum',  weight: 100, hue: 4, firmness: 3 },

    { id: 'A1', label: 'apple', weight: 200, hue: 3, firmness: 3 },
    { id: 'A2', label: 'apple', weight: 400, hue: 3, firmness: 4 },
    { id: 'A3', label: 'apple', weight: 300, hue: 1, firmness: 2 },
    { id: 'A4', label: 'apple', weight: 300, hue: 5, firmness: 2 },

    { id: 'R1', label: 'pear',  weight: 150, hue: 7, firmness: 3 },
    { id: 'R2', label: 'pear',  weight: 250, hue: 7, firmness: 2 },
    { id: 'R3', label: 'pear',  weight: 200, hue: 6, firmness: 2 },
    { id: 'R4', label: 'pear',  weight: 200, hue: 8, firmness: 1 }
  ];

  const NEW_FRUIT = {
    weight: 150,
    hue: 4,
    firmness: 3
  };

  const QX = NEW_FRUIT.weight / 50;
  const QY = NEW_FRUIT.hue;

  const DEFAULT_K = 3;

  const weightUnits = grams => grams / 50;

  const colorOf = label =>
    label === 'plum' ? PLUM :
    label === 'apple' ? APPLE :
    PEAR;

  function positionOf(d) {
    return xy(
      weightUnits(d.weight),
      d.hue
    );
  }

  function distanceSquared(d, qx = QX, qy = QY) {
    const dx = weightUnits(d.weight) - qx;
    const dy = d.hue - qy;

    return dx * dx + dy * dy;
  }

  function distance(d, qx = QX, qy = QY) {
    return Math.sqrt(
      distanceSquared(d, qx, qy)
    );
  }

  function rankNeighbors(data, qx, qy) {
    return data
      .map((d, index) => {
        const d2 = distanceSquared(d, qx, qy);

        return {
          ...d,
          index,
          d2,
          distance: Math.sqrt(d2)
        };
      })
      .sort((a, b) =>
        a.d2 - b.d2 || a.index - b.index
      );
  }

  // Equal distances use the original dataset order.
  // This makes the narrated examples deterministic.
  // Equal vote totals are reported as ties, not silently resolved.

  function countVotes(neighbors) {
    const counts = {
      plum: 0,
      apple: 0,
      pear: 0
    };

    neighbors.forEach(d => {
      counts[d.label]++;
    });

    return counts;
  }

  function winningLabel(counts) {
    const best = Math.max(
      counts.plum,
      counts.apple,
      counts.pear
    );

    const winners = NAMES.filter(
      name => counts[name] === best
    );

    return winners.length === 1
      ? winners[0]
      : null;
  }

  function classify(data, qx, qy, k) {
    const ranked = rankNeighbors(data, qx, qy);
    const selected = ranked.slice(0, k);

    const counts = countVotes(selected);
    const winner = winningLabel(counts);

    return {
      ranked,
      selected,
      counts,
      winner
    };
  }

  function fmt(n) {
    return Number(n.toFixed(2)).toString();
  }

  function fmtDistance(n) {
    return Number.isInteger(n)
      ? String(n)
      : n.toFixed(2);
  }

  const RANKED = rankNeighbors(DATA, QX, QY);

  const NEAREST = RANKED.slice(0, DEFAULT_K);

  const INITIAL_VOTES = countVotes(NEAREST);

  // Exact nearest neighbors:
  // P2: distance 1
  // P4: distance 1
  // A1: distance sqrt(2)
  //
  // Squared distances in original DATA order:
  // Plums: 5, 1, 5, 1
  // Apples: 2, 26, 18, 10
  // Pears: 9, 13, 5, 17

  // ============================================================
  // BASIC VISUAL HELPERS
  // ============================================================

  function text(s, size, color, p, mono = false) {
    const t = T(s, size, color, mono);

    t.moveTo(p);

    return t;
  }

  function line(start, end, color = C.muted, width = 2) {
    return new M.Line({
      start,
      end,
      color,
      strokeWidth: width
    });
  }

  function dashed(start, end, color = C.muted) {
    return new M.DashedLine({
      start,
      end,
      color
    });
  }

  function rect(w, h, p, color, opacity = 0, stroke = 2) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: stroke
    });

    r.setFill(color, opacity);
    r.moveTo(p);

    return r;
  }

  function rounded(w, h, p, color, opacity = 0.92) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, opacity);
    r.moveTo(p);

    return r;
  }

  function tag(s, color, p, size = 17) {
    const t = pill(s, color, size);

    t.moveTo(p);

    return t;
  }

  function reveal(objects, runTime = 1.0, lagRatio = 0.12) {
    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      { lagRatio, runTime }
    );
  }

  function remove(objects) {
    return objects
      .filter(Boolean)
      .map(o => new M.FadeOut(o));
  }

  function ring(p, color = GOLD, r = FR * 2.1) {
    const c = new M.Circle({
      radius: r,
      color,
      strokeWidth: 2
    });

    c.setFill(color, 0);
    c.moveTo(p);

    return c;
  }

  // ============================================================
  // ONE FORMULA / INFORMATION BOX
  // ============================================================

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 21;
    const lh = P ? 0.33 : 0.42;

    const rows = lines.map(l =>
      Array.isArray(l) ? l : [l, C.ink]
    );

    const texts = rows.map(([s, c]) =>
      T(s.trimStart(), size, c, true)
    );

    const cw =
      T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) => {
      const indent =
        rows[i][0].length -
        rows[i][0].trimStart().length;

      return t.getWidth() + cw * indent;
    });

    const wd = Math.max(...widths) + 0.65;
    const ht = rows.length * lh + 0.30;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.16,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.96);
    r.moveTo(BOXP);

    const left = BOXP[0] - wd / 2 + 0.325;

    const top =
      BOXP[1] + ht / 2 - 0.15 - lh / 2;

    texts.forEach((t, i) => {
      const indent =
        cw * (
          rows[i][0].length -
          rows[i][0].trimStart().length
        );

      t.moveTo([
        left + indent + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 0.9 : 4.0;
    const maxh = P ? 1.36 : 3.8;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    const animations = [];

    if (boxNow) {
      animations.push(new M.FadeOut(boxNow));
    }

    animations.push(new M.FadeIn(g));

    boxNow = g;

    return animations;
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;

    boxNow = null;

    return [new M.FadeOut(old)];
  }

  // ============================================================
  // CONSISTENT CHAPTER FRUIT SYMBOLS
  // ============================================================

  function triangle(p, r, color) {
    const [x, y] = p;

    const top = [x, y + r, 0];

    const left = [
      x - r * 0.95,
      y - r * 0.70,
      0
    ];

    const right = [
      x + r * 0.95,
      y - r * 0.70,
      0
    ];

    // Filled triangle built from supported Line primitives.

    const fill = [];

    for (let i = 1; i <= 12; i++) {
      const a = i / 12;

      const yy =
        top[1] + a * (left[1] - top[1]);

      const ww = r * 0.95 * a;

      fill.push(
        line(
          [x - ww, yy, 0],
          [x + ww, yy, 0],
          color,
          2.5
        )
      );
    }

    return new M.VGroup(
      ...fill,
      line(top, left, color, 2),
      line(left, right, color, 2),
      line(right, top, color, 2)
    );
  }

  function fruit(label, p, r = FR) {
    const color = colorOf(label);

    const halo = new M.Dot({
      point: p,
      radius: r * 1.65,
      color
    });

    halo.setFill(color, 0.14);

    let body;

    if (label === 'plum') {
      body = new M.Circle({
        radius: r,
        color,
        strokeWidth: 2
      });

      body.setFill(color, 0.95);
      body.moveTo(p);

    } else if (label === 'apple') {
      body = new M.Rectangle({
        width: r * 1.85,
        height: r * 1.85,
        color,
        strokeWidth: 2
      });

      body.setFill(color, 0.95);
      body.moveTo(p);

    } else {
      body = triangle(p, r * 1.10, color);
    }

    return new M.VGroup(halo, body);
  }

  function unknown(p, r = FR * 1.20) {
    const outer = new M.Dot({
      point: p,
      radius: r * 1.85,
      color: WHITE
    });

    outer.setFill(WHITE, 0.08);

    const inner = new M.Dot({
      point: p,
      radius: r * 1.40,
      color: WHITE
    });

    inner.setFill(WHITE, 0.15);

    const side = r * Math.sqrt(2);

    const body = new M.Rectangle({
      width: side,
      height: side,
      color: WHITE,
      strokeWidth: 2
    });

    body.setFill(WHITE, 1);
    body.rotate(Math.PI / 4);
    body.moveTo(p);

    return new M.VGroup(
      outer,
      inner,
      body
    );
  }

  function plottedFruit(d) {
    return fruit(
      d.label,
      positionOf(d)
    );
  }

  function plotPoints(data = DATA) {
    return data.map(plottedFruit);
  }

  // ============================================================
  // PACKING STATION INTRODUCTION
  // ============================================================

  function station() {
    const y = P ? -0.65 : -0.35;

    const base = rounded(
      P ? 5.85 : 5.70,
      0.48,
      [CX, y, 0],
      C.muted,
      0.90
    );

    const rollers = Array.from(
      { length: 11 },
      (_, i) => {
        const x = CX + (i - 5) * 0.47;

        const c = new M.Circle({
          radius: 0.115,
          color: C.muted,
          strokeWidth: 1.5
        });

        c.setFill(C.card, 1);
        c.moveTo([x, y, 0]);

        return c;
      }
    );

    const title = text(
      'FRUIT PACKING STATION',
      18,
      C.ink,
      [CX, y + 1.10, 0],
      true
    );

    return new M.VGroup(
      base,
      ...rollers,
      title
    );
  }

  const stationY = P ? -0.65 : -0.35;

  const packingStation = station();

  const incoming = unknown(
    [CX, stationY + 0.43, 0],
    FR * 2.0
  );

  const incomingLabel = tag(
    'UNKNOWN FRUIT',
    WHITE,
    [CX, stationY - 0.65, 0],
    17
  );

  // ============================================================
  // WEIGHT–HUE DRAWING
  // ============================================================

  function graphGrid() {
    const parts = [];

    for (let x = 1; x <= 8; x++) {
      parts.push(
        line(
          xy(x, 0),
          xy(x, YMAX),
          C.muted,
          0.65
        )
      );
    }

    for (let y = 1; y <= 8; y++) {
      parts.push(
        line(
          xy(0, y),
          xy(XMAX, y),
          C.muted,
          0.65
        )
      );
    }

    return new M.VGroup(...parts);
  }

  function horizontalAxis() {
    const parts = [
      line(
        [XL, YB, 0],
        [XR, YB, 0],
        C.muted,
        2.5
      )
    ];

    for (let x = 0; x <= 8; x++) {
      parts.push(
        line(
          [X(x), YB - 0.045, 0],
          [X(x), YB + 0.045, 0],
          C.muted,
          1.2
        )
      );

      parts.push(
        text(
          String(x * 50),
          P ? 15 : 13,
          C.muted,
          [X(x), YB - 0.18, 0],
          true
        )
      );
    }

    parts.push(
      text(
        'Weight (grams) →',
        P ? 18 : 16,
        C.ink,
        [(XL + XR) / 2, YB - 0.43, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  function verticalAxis() {
    const parts = [
      line(
        [XL, YB, 0],
        [XL, YT, 0],
        C.muted,
        2.5
      )
    ];

    for (let y = 1; y <= 8; y++) {
      parts.push(
        line(
          [XL - 0.045, Y(y), 0],
          [XL + 0.045, Y(y), 0],
          C.muted,
          1.2
        )
      );

      parts.push(
        text(
          String(y),
          P ? 15 : 13,
          C.muted,
          [XL - 0.20, Y(y), 0],
          true
        )
      );
    }

    parts.push(
      text(
        'Hue ↑',
        P ? 17 : 15,
        C.ink,
        [XL - 0.37, YT + 0.19, 0]
      )
    );

    return new M.VGroup(...parts);
  }

  function verticalStrip() {
    const sx = XL - 0.65;
    const sw = P ? 0.23 : 0.20;

    const parts = [];

    HUE.forEach((c, i) => {
      parts.push(
        rect(
          sw,
          U * 0.98,
          [sx, Y(i + 1), 0],
          c,
          1,
          0
        )
      );
    });


    return new M.VGroup(...parts);
  }

  function graphParts() {
    return [
      graphGrid(),
      horizontalAxis(),
      verticalAxis(),
      verticalStrip()
    ];
  }

  let graph = graphParts();

  let points = plotPoints();

  function horizontalMeasure(
    x1,
    x2,
    hue,
    label,
    color = C.cyan
  ) {
    const a = X(x1);
    const b = X(x2);
    const y = Y(hue);

    const parts = [
      line([a, y, 0], [b, y, 0], color, 2.5),

      line(
        [a, y - 0.07, 0],
        [a, y + 0.07, 0],
        color,
        2
      ),

      line(
        [b, y - 0.07, 0],
        [b, y + 0.07, 0],
        color,
        2
      ),

      text(
        label,
        P ? 15 : 13,
        color,
        [(a + b) / 2, y + 0.19, 0],
        true
      )
    ];

    return new M.VGroup(...parts);
  }

  function verticalMeasure(
    x,
    y1,
    y2,
    label,
    color = C.cyan
  ) {
    const xx = X(x);
    const a = Y(y1);
    const b = Y(y2);

    const parts = [
      line([xx, a, 0], [xx, b, 0], color, 2.5),

      line(
        [xx - 0.07, a, 0],
        [xx + 0.07, a, 0],
        color,
        2
      ),

      line(
        [xx - 0.07, b, 0],
        [xx + 0.07, b, 0],
        color,
        2
      ),

      text(
        label,
        P ? 15 : 13,
        color,
        [xx + 0.20, (a + b) / 2, 0],
        true
      )
    ];

    return new M.VGroup(...parts);
  }

  function connector(
    d,
    qx = QX,
    qy = QY,
    color = GOLD,
    width = 2.5
  ) {
    const a = xy(qx, qy);
    const b = positionOf(d);

    // Avoid creating a zero-length Line when a query sits
    // exactly on a known fruit.

    if (distanceSquared(d, qx, qy) < 1e-12) {
      return ring(
        b,
        color,
        FR * 2.4
      );
    }

    return line(
      a,
      b,
      color,
      width
    );
  }

  function allConnectors(
    data = DATA,
    qx = QX,
    qy = QY
  ) {
    return data.map(d =>
      connector(
        d,
        qx,
        qy,
        C.muted,
        1.15
      )
    );
  }

  function nearestRings(neighbors) {
    return neighbors.map(d =>
      ring(
        positionOf(d),
        colorOf(d.label),
        FR * 2.05
      )
    );
  }

  function distanceLabel(
    d,
    qx = QX,
    qy = QY,
    offset = [0, 0],
    color = GOLD,
    label = null
  ) {
    const a = xy(qx, qy);
    const b = positionOf(d);

    return text(
      label === null
        ? fmtDistance(distance(d, qx, qy))
        : label,
      P ? 17 : 14,
      color,
      [
        (a[0] + b[0]) / 2 + offset[0],
        (a[1] + b[1]) / 2 + offset[1],
        0
      ],
      true
    );
  }

  // ============================================================
  // DISTANCE QUEUE HELPERS
  // ============================================================

  // phone: 3 rows of 4 to use the full height
  const QUEUE_SP = P ? 1.60 : 0.98;
  const QUEUE_COLS = P ? 4 : 6;

  const QUEUE_Y = P
    ? [0.60, -1.20, -3.00]
    : [0.42, -0.90];

  function queuePosition(rank) {
    const row = Math.floor(rank / QUEUE_COLS);
    const col = rank % QUEUE_COLS;

    return [
      CX + (col - (QUEUE_COLS - 1) / 2) * QUEUE_SP,
      QUEUE_Y[row],
      0
    ];
  }

  function queueLabels(d, rank) {
    const p = queuePosition(rank);
    const c = colorOf(d.label);

    const rankLabel = text(
      `#${rank + 1}`,
      P ? 17 : 13,
      C.muted,
      [p[0], p[1] + 0.40, 0],
      true
    );

    const valueLabel = text(
      fmtDistance(d.distance),
      P ? 21 : 17,
      c,
      [p[0], p[1] - 0.36, 0],
      true
    );

    return new M.VGroup(
      rankLabel,
      valueLabel
    );
  }

  function queueTitle() {
    return text(
      'NEAREST → FARTHEST',
      P ? 20 : 18,
      C.ink,
      [CX, P ? 1.55 : 1.25, 0],
      true
    );
  }

  function queueOutline(rank, color = GOLD) {
    const p = queuePosition(rank);

    return rounded(
      QUEUE_SP * 0.89,
      P ? 1.26 : 1.14,
      [p[0], p[1] - 0.07, 0],
      color,
      0
    );
  }

  // ============================================================
  // VOTE COUNTER HELPERS
  // ============================================================

  const VOTE_SP = P ? 2.05 : 1.85;
  const VOTE_Y = P ? -5.05 : -2.32;

  const voteX = i =>
    CX + (i - 1) * VOTE_SP;

  function voteCard(i, count, selected = false) {
    const name = NAMES[i];
    const color = COLORS[i];

    const w = P ? 1.75 : 1.62;
    const h = P ? 1.32 : 1.00;

    const x = voteX(i);
    const y = VOTE_Y;

    const body = rounded(
      w,
      h,
      [x, y, 0],
      selected ? GOLD : color,
      0.94
    );

    const icon = fruit(
      name,
      [x - 0.53, y + h * 0.24, 0],
      P ? 0.11 : 0.085
    );

    const nameText = text(
      name.toUpperCase(),
      P ? 16 : 14,
      color,
      [x + 0.12, y + h * 0.24, 0],
      true
    );

    const countText = text(
      `${count} ${count === 1 ? 'vote' : 'votes'}`,
      P ? 23 : 20,
      color,
      [x, y - h * 0.18, 0],
      true
    );

    return new M.VGroup(
      body,
      icon,
      nameText,
      countText
    );
  }

  function voteCards(counts) {
    const best = winningLabel(counts);

    return NAMES.map((name, i) =>
      voteCard(
        i,
        counts[name],
        best === name
      )
    );
  }

  function voteBox(counts, k, heading = null) {
    const best = winningLabel(counts);

    const color = best
      ? colorOf(best)
      : GOLD;

    return fbox([
      [heading || `k = ${k} neighbors`, C.cyan],
      [`plum: ${counts.plum}`, PLUM],
      [
        `apple: ${counts.apple} | pear: ${counts.pear}`,
        C.ink
      ],
      [
        best
          ? `prediction: ${best}`
          : 'tie: no unique winner',
        color
      ]
    ], color);
  }

  // ============================================================
  // TRY IT PREVIEW HELPERS
  // ============================================================

  // The live lesson engine supplies narration scheduling and
  // animation playback, not a pointer-handler interface.
  // The following helpers preview the interactive exercise
  // using deterministic animated examples.

  let activeData = DATA;

  let activeQueryX = QX;
  let activeQueryY = QY;
  let activeK = DEFAULT_K;

  let tryMarks = [];

  function neighborMarks(result, qx, qy) {
    const parts = [];

    const many = result.selected.length > 4;

    result.selected.forEach(d => {
      const color = colorOf(d.label);

      parts.push(
        connector(
          d,
          qx,
          qy,
          color,
          many ? 1.25 : 2.5
        )
      );

      if (!many && d.d2 > 1e-12) {
        parts.push(
          ring(
            positionOf(d),
            color,
            FR * 2.05
          )
        );
      }
    });

    return parts;
  }

  function tryBox(result, k, heading = null) {
    const best = result.winner;

    const color = best
      ? colorOf(best)
      : GOLD;

    const nearestText = result.selected
      .slice(0, 3)
      .map(d => fmtDistance(d.distance))
      .join(', ');

    const c = result.counts;

    return fbox([
      [
        heading || `k = ${k} | nearest distances`,
        C.cyan
      ],

      ['nearest: ' + nearestText, C.ink],

      [
        `votes: plum ${c.plum}, apple ${c.apple}, pear ${c.pear}`,
        C.ink
      ],

      [
        best
          ? `prediction: ${best}`
          : 'tie: no unique winner',
        color
      ]
    ], color);
  }

  let query = null;

  function updateTry(
    qx,
    qy,
    k,
    heading = null,
    moveQuery = true
  ) {
    const result = classify(
      activeData,
      qx,
      qy,
      k
    );

    const nextMarks = neighborMarks(
      result,
      qx,
      qy
    );

    const animations = [
      ...remove(tryMarks)
    ];

    if (moveQuery) {
      animations.push(
        new M.Transform(
          query,
          unknown(xy(qx, qy)),
          { runTime: 1.0 }
        )
      );
    }

    if (nextMarks.length) {
      animations.push(
        reveal(nextMarks, 0.95, 0.06)
      );
    }

    animations.push(
      ...tryBox(result, k, heading)
    );

    tryMarks = nextMarks;

    activeQueryX = qx;
    activeQueryY = qy;
    activeK = k;

    return animations;
  }

  // ============================================================
  // BEATS 0–8: INTRODUCE THE UNKNOWN FRUIT AND DRAWING
  // ============================================================

  // 0. Another unknown fruit arrives at the packing station.

  await until(S(0));

  await play(
    new M.FadeIn(packingStation),
    new M.FadeIn(incoming),
    new M.FadeIn(incomingLabel),

    ...say('ANOTHER UNKNOWN FRUIT', WHITE)
  );

  // 1. Could similar fruits help us identify it?

  await until(S(1));

  await play(
    new M.Indicate(incoming, {
      color: WHITE
    }),

    ...fbox([
      ['unknown label', WHITE],
      ['look for similar fruits?', GOLD]
    ], GOLD),

    ...say('CAN SIMILAR FRUITS HELP?', GOLD)
  );

  // 2. Twelve known fruits on the familiar drawing.

  await until(S(2));

  await play(
    new M.FadeOut(packingStation),
    new M.FadeOut(incoming),
    new M.FadeOut(incomingLabel),

    ...clearBox(),

    reveal(graph, 1.0, 0.08),
    reveal(points, 1.8, 0.07),

    ...say('12 KNOWN FRUITS', C.green)
  );

  // 3. Four plums, four apples and four pears.

  await until(S(3));

  await play(
    new M.LaggedStart(
      points.map((p, i) =>
        new M.Indicate(p, {
          color: colorOf(DATA[i].label)
        })
      ),
      {
        lagRatio: 0.10,
        runTime: 3.0
      }
    ),

    ...fbox([
      ['4 purple circles: plums', PLUM],
      ['4 orange squares: apples', APPLE],
      ['4 green triangles: pears', PEAR]
    ]),

    ...say('THREE KNOWN FRUIT TYPES')
  );

  // 4. Weight increases right, hue increases upward.

  await until(S(4));

  await play(
    ...fbox([
      ['weight increases →', C.cyan],
      ['hue increases ↑', C.green]
    ]),

    ...say('WEIGHT →     HUE ↑')
  );

  // 5. Every horizontal grid space represents 50 grams.

  const weightUnit = horizontalMeasure(
    0,
    1,
    5.35,
    '50 g',
    C.cyan
  );

  await until(S(5));

  await play(
    new M.FadeIn(weightUnit),

    ...fbox([
      ['1 horizontal grid space', C.ink],
      ['= 50 grams', C.cyan]
    ]),

    ...say('1 HORIZONTAL SPACE = 50 g')
  );

  // 6. Every vertical grid space is one hue step.

  const hueUnit = verticalMeasure(
    0.55,
    6,
    7,
    '1',
    C.green
  );

  await until(S(6));

  await play(
    new M.FadeOut(weightUnit),
    new M.FadeIn(hueUnit),

    ...fbox([
      ['1 vertical grid space', C.ink],
      ['= 1 hue step', C.green]
    ], C.green),

    ...say('1 VERTICAL SPACE = 1 HUE STEP', C.green)
  );

  // 7. The unknown fruit weighs 150 grams and has hue 4.

  await until(S(7));

  await play(
    new M.FadeOut(hueUnit),

    ...fbox([
      ['UNKNOWN FRUIT', WHITE],
      ['weight = 150 g', C.cyan],
      ['hue    = 4', C.green],
      ['grid position = (3, 4)', GOLD]
    ]),

    ...say('150 g AND HUE 4', WHITE)
  );

  // 8. Place the white diamond at the exact position (3, 4).

  query = unknown(xy(QX, QY));

  const queryWeightGuide = dashed(
    xy(QX, 0),
    xy(QX, QY),
    WHITE
  );

  const queryHueGuide = dashed(
    xy(0, QY),
    xy(QX, QY),
    WHITE
  );

  await until(S(8));

  await play(
    new M.Create(queryWeightGuide),
    new M.Create(queryHueGuide),
    new M.FadeIn(query),

    ...say('THE WHITE DIAMOND', WHITE)
  );

  // ============================================================
  // BEATS 9–15: THE NEAREST-NEIGHBOR IDEA
  // ============================================================

  // 9. Some fruits are close, while others are far away.

  const nearExample = connector(
    DATA[1],
    QX,
    QY,
    PLUM,
    3
  );

  const farExample = connector(
    DATA[5],
    QX,
    QY,
    GOLD,
    2
  );

  await until(S(9));

  await play(
    new M.FadeOut(queryWeightGuide),
    new M.FadeOut(queryHueGuide),

    new M.Create(nearExample),
    new M.Create(farExample),

    ...fbox([
      ['some fruits are near', PLUM],
      ['others are farther away', GOLD]
    ]),

    ...say('NEAR FRUITS AND FAR FRUITS')
  );

  // 10. Nearby fruits can have different labels.

  const previewRings = nearestRings(NEAREST);

  await until(S(10));

  await play(
    new M.FadeOut(nearExample),
    new M.FadeOut(farExample),

    reveal(previewRings, 1.1),

    ...fbox([
      ['similar measurements', C.cyan],
      ['do not always mean', C.ink],
      ['the same fruit type', GOLD]
    ], GOLD),

    ...say('NEARBY DOES NOT ALWAYS MEAN SAME', GOLD)
  );

  // 11. Ask the three closest fruits to vote.

  await until(S(11));

  await play(
    new M.LaggedStart(
      NEAREST.map(d =>
        new M.Indicate(
          points[d.index],
          { color: colorOf(d.label) }
        )
      ),
      {
        lagRatio: 0.25,
        runTime: 1.8
      }
    ),

    ...fbox([
      ['choose the closest', C.ink],
      ['3 known fruits', GOLD],
      ['ask them to vote', C.cyan]
    ], GOLD),

    ...say('ASK THE 3 CLOSEST FRUITS', GOLD)
  );

  // 12. Each fruit receives one vote for its own type.

  await until(S(12));

  await play(
    ...fbox([
      ['1 selected fruit', C.ink],
      ['= 1 vote for its own label', C.cyan]
    ]),

    ...say('ONE FRUIT = ONE VOTE')
  );

  // 13. The fruit type with the most votes wins.

  await until(S(13));

  await play(
    ...fbox([
      ['count the votes', C.ink],
      ['most votes = prediction', C.green]
    ], C.green),

    ...say('THE MOST VOTES WINS', C.green)
  );

  // 14. This method is called nearest neighbors.

  await until(S(14));

  await play(
    ...fbox([
      ['NEAREST NEIGHBORS', C.cyan],
      ['identify something using', C.ink],
      ['nearby known examples', C.ink]
    ]),

    ...say('NEAREST NEIGHBORS')
  );

  // 15. How does the machine know which fruits are closest?

  await until(S(15));

  await play(
    new M.Indicate(query, {
      color: WHITE
    }),

    ...fbox([
      ['which examples', C.ink],
      ['are closest?', GOLD]
    ], GOLD),

    ...say('HOW DO WE MEASURE CLOSENESS?', GOLD)
  );

  // ============================================================
  // BEATS 16–22: TWO NEIGHBORS ONE UNIT AWAY
  // ============================================================

  let distanceLines = allConnectors();

  // 16. Measure the straight-line distance to every fruit.

  await until(S(16));

  await play(
    ...remove(previewRings),

    new M.LaggedStart(
      distanceLines.map(d =>
        new M.Create(d)
      ),
      {
        lagRatio: 0.08,
        runTime: 2.1
      }
    ),

    ...fbox([
      ['measure from the diamond', WHITE],
      ['to each known fruit', C.ink],
      ['using a straight line', GOLD]
    ], GOLD),

    ...say('MEASURE STRAIGHT-LINE DISTANCE')
  );

  // 17. Start with P2: weight 150 grams, hue 3.

  const p2 = DATA[1];

  const p2Ring = ring(
    positionOf(p2),
    PLUM
  );

  await until(S(17));

  await play(
    ...remove(distanceLines),

    new M.Create(p2Ring),

    ...fbox([
      ['FIRST PLUM: 150 g, hue 3', PLUM],
      ['weight = 150 g', C.ink],
      ['hue = 3', C.ink],
      ['grid position = (3, 3)', GOLD]
    ], PLUM),

    ...say('FIRST NEIGHBOR: A PLUM', PLUM)
  );

  // 18. P2 is directly below the diamond, one space away.

  const p2Line = connector(
    p2,
    QX,
    QY,
    PLUM,
    3
  );

  const p2Distance = distanceLabel(
    p2,
    QX,
    QY,
    [P ? -0.23 : -0.18, 0],
    PLUM,
    '1'
  );

  await until(S(18));

  await play(
    new M.Create(p2Line),
    new M.FadeIn(p2Distance),

    ...fbox([
      ['same weight', C.ink],
      ['hue: 4 → 3', C.ink],
      ['1 grid space down', PLUM]
    ], PLUM),

    ...say('ONE SPACE DIRECTLY BELOW', PLUM)
  );

  // 19. Its distance is one.

  await until(S(19));

  await play(
    ...fbox([
      ['plum distance', PLUM],
      ['= 1', GOLD]
    ], PLUM),

    ...say('DISTANCE = 1', PLUM)
  );

  // 20. P4: weight 100 grams, hue 4.

  const p4 = DATA[3];

  const p4Ring = ring(
    positionOf(p4),
    PLUM
  );

  await until(S(20));

  await play(
    new M.Create(p4Ring),

    ...fbox([
      ['SECOND PLUM: 100 g, hue 4', PLUM],
      ['weight = 100 g', C.ink],
      ['hue = 4', C.ink],
      ['grid position = (2, 4)', GOLD]
    ], PLUM),

    ...say('SECOND NEIGHBOR: A PLUM', PLUM)
  );

  // 21. P4 is directly to the left, also one space away.

  const p4Line = connector(
    p4,
    QX,
    QY,
    PLUM,
    3
  );

  const p4Distance = distanceLabel(
    p4,
    QX,
    QY,
    [0, P ? 0.24 : 0.19],
    PLUM,
    '1'
  );

  await until(S(21));

  await play(
    new M.Create(p4Line),
    new M.FadeIn(p4Distance),

    ...fbox([
      ['same hue', C.ink],
      ['weight: 150 g → 100 g', C.ink],
      ['1 grid space left', PLUM]
    ], PLUM),

    ...say('ONE SPACE DIRECTLY LEFT', PLUM)
  );

  // 22. Its distance is also one.

  await until(S(22));

  await play(
    ...fbox([
      ['first plum: distance 1', PLUM],
      ['second plum: distance 1', PLUM],
      ['equally close', GOLD]
    ], PLUM),

    ...say('BOTH DISTANCES = 1', PLUM)
  );

  // ============================================================
  // BEATS 23–30: THE DIAGONAL DISTANCE
  // ============================================================

  // 23. A1: weight 200 grams, hue 3.

  const a1 = DATA[4];

  const a1Ring = ring(
    positionOf(a1),
    APPLE
  );

  await until(S(23));

  await play(
    new M.FadeOut(p2Ring),
    new M.FadeOut(p4Ring),

    new M.FadeOut(p2Line),
    new M.FadeOut(p4Line),

    new M.FadeOut(p2Distance),
    new M.FadeOut(p4Distance),

    new M.Create(a1Ring),

    ...fbox([
      ['APPLE: 200 g, hue 3', APPLE],
      ['weight = 200 g', C.ink],
      ['hue = 3', C.ink],
      ['grid position = (4, 3)', GOLD]
    ], APPLE),

    ...say('THIRD NEIGHBOR: AN APPLE', APPLE)
  );

  // 24. Move one space right and one space down.

  const triangleHorizontal = line(
    xy(3, 4),
    xy(4, 4),
    C.cyan,
    2.5
  );

  const triangleVertical = line(
    xy(4, 4),
    xy(4, 3),
    C.green,
    2.5
  );

  const horizontalOne = text(
    '1',
    P ? 17 : 14,
    C.cyan,
    [X(3.5), Y(4) + 0.20, 0],
    true
  );

  const verticalOne = text(
    '1',
    P ? 17 : 14,
    C.green,
    [X(4) + 0.20, Y(3.5), 0],
    true
  );

  const cornerSize = U * 0.20;

  const rightAngle = new M.VGroup(
    line(
      [
        X(4) - cornerSize,
        Y(4),
        0
      ],
      [
        X(4) - cornerSize,
        Y(4) - cornerSize,
        0
      ],
      C.muted,
      1.4
    ),

    line(
      [
        X(4) - cornerSize,
        Y(4) - cornerSize,
        0
      ],
      [
        X(4),
        Y(4) - cornerSize,
        0
      ],
      C.muted,
      1.4
    )
  );

  await until(S(24));

  await play(
    new M.Create(triangleHorizontal),
    new M.Create(triangleVertical),

    new M.FadeIn(horizontalOne),
    new M.FadeIn(verticalOne),
    new M.FadeIn(rightAngle),

    ...fbox([
      ['horizontal difference = 1', C.cyan],
      ['vertical difference   = 1', C.green]
    ]),

    ...say('ONE RIGHT, ONE DOWN')
  );

  // 25. The diagonal is longer than one but shorter than two.

  const diagonal = connector(
    a1,
    QX,
    QY,
    GOLD,
    3
  );

  let diagonalLabel = text(
    '?',
    P ? 19 : 16,
    GOLD,
    [
      X(3.5) - U * 0.27,
      Y(3.5) - U * 0.25,
      0
    ],
    true
  );

  await until(S(25));

  await play(
    new M.Create(diagonal),
    new M.FadeIn(diagonalLabel),

    ...fbox([
      ['straight-line distance', GOLD],
      ['longer than 1', C.ink],
      ['shorter than 2', C.ink]
    ], GOLD),

    ...say('THE DIAGONAL IS BETWEEN 1 AND 2', GOLD)
  );

  // 26. Multiply each difference by itself.

  await until(S(26));

  await play(
    new M.Indicate(horizontalOne, {
      color: C.cyan
    }),

    new M.Indicate(verticalOne, {
      color: C.green
    }),

    ...fbox([
      ['horizontal: 1 × 1', C.cyan],
      ['vertical:   1 × 1', C.green]
    ]),

    ...say('MULTIPLY EACH DIFFERENCE BY ITSELF')
  );

  // 27. This is called squaring a number.

  await until(S(27));

  await play(
    ...fbox([
      ['SQUARING', C.cyan],
      ['1 × 1 = 1²', GOLD]
    ]),

    ...say('SQUARING = MULTIPLY BY ITSELF')
  );

  // 28. One squared plus one squared gives two.

  await until(S(28));

  await play(
    ...fbox([
      ['1² + 1²', C.ink],
      ['= 1 + 1', C.ink],
      ['= 2', GOLD]
    ], GOLD),

    ...say('1² + 1² = 2', GOLD)
  );

  // 29. Find the number that gives two when multiplied by itself.

  await until(S(29));

  await play(
    ...fbox([
      ['? × ? = 2', GOLD],
      ['what number fits?', C.ink]
    ], GOLD),

    ...say('WHICH NUMBER SQUARED GIVES 2?', GOLD)
  );

  // 30. The square root of two is approximately 1.41.

  const rootTwo = distance(a1);

  const diagonalValue = text(
    '√2',
    P ? 18 : 15,
    GOLD,
    [
      X(3.5) - U * 0.30,
      Y(3.5) - U * 0.30,
      0
    ],
    true
  );

  await until(S(30));

  await play(
    new M.Transform(
      diagonalLabel,
      diagonalValue,
      { runTime: 0.75 }
    ),

    ...fbox([
      ['SQUARE ROOT', GOLD],
      ['distance = √2', C.ink],
      [`≈ ${fmtDistance(rootTwo)}`, APPLE]
    ], GOLD),

    ...say('√2 ≈ 1.41', GOLD)
  );

  // ============================================================
  // BEATS 31–33: THE GENERAL DISTANCE FORMULA
  // ============================================================

  // 31. A formula for the distance between any two fruits.

  await until(S(31));

  await play(
    new M.Indicate(diagonal, {
      color: GOLD
    }),

    ...fbox([
      ['ANY TWO FRUITS', C.cyan],
      ['measure across', C.ink],
      ['measure up or down', C.ink],
      ['combine both differences', GOLD]
    ]),

    ...say('A GENERAL DISTANCE FORMULA')
  );

  // 32. Square both differences, add them, take the square root.

  await until(S(32));

  await play(
    ...fbox([
      ['distance = √(dx² + dy²)', GOLD],
      ['dx = horizontal difference', C.cyan],
      ['dy = vertical difference', C.green],
      ['square, add, square root', C.ink]
    ], GOLD),

    ...say('SQUARE → ADD → SQUARE ROOT', GOLD)
  );

  // 33. Repeat the calculation for all twelve known fruits.

  distanceLines = allConnectors();

  await until(S(33));

  await play(
    new M.FadeOut(a1Ring),

    new M.FadeOut(triangleHorizontal),
    new M.FadeOut(triangleVertical),
    new M.FadeOut(horizontalOne),
    new M.FadeOut(verticalOne),
    new M.FadeOut(rightAngle),

    new M.FadeOut(diagonal),
    new M.FadeOut(diagonalLabel),

    new M.LaggedStart(
      distanceLines.map(d =>
        new M.Create(d)
      ),
      {
        lagRatio: 0.08,
        runTime: 2.1
      }
    ),

    ...fbox([
      ['repeat for all 12 fruits', C.ink],
      ['12 measured distances', GOLD],
      ['now sort the results', C.cyan]
    ]),

    ...say('CALCULATE ALL 12 DISTANCES')
  );

  // ============================================================
  // BEATS 34–36: SORT THE FRUITS BY DISTANCE
  // ============================================================

  const sortedTitle = queueTitle();

  const sortedLabels = RANKED.map(
    (d, rank) => queueLabels(d, rank)
  );

  // 34. Arrange a queue from shortest distance to longest.
  // Transform the existing fruit objects individually.
  // Do not reparent objects that are already on screen.

  await until(S(34));

  await play(
    ...remove(graph),
    ...remove(distanceLines),

    new M.FadeOut(query),

    new M.FadeIn(sortedTitle),

    new M.LaggedStart(
      RANKED.map((d, rank) =>
        new M.Transform(
          points[d.index],
          fruit(
            d.label,
            queuePosition(rank),
            P ? 0.17 : 0.145
          )
        )
      ),
      {
        lagRatio: 0.06,
        runTime: 2.0
      }
    ),

    reveal(sortedLabels, 1.6, 0.05),

    ...fbox([
      ['SORT BY DISTANCE', C.cyan],
      ['shortest first', C.ink],
      ['longest last', C.ink]
    ]),

    ...say('SORT FROM NEAREST TO FARTHEST')
  );

  // 35. The two plums come first, then the apple.

  const nearestOutlines = NEAREST.map(
    (d, rank) =>
      queueOutline(
        rank,
        colorOf(d.label)
      )
  );

  await until(S(35));

  await play(
    reveal(nearestOutlines, 1.0, 0.18),

    ...fbox([
      ['1. plum: 1', PLUM],
      ['2. plum: 1', PLUM],
      ['3. apple: 1.41', APPLE]
    ], GOLD),

    ...say('TWO PLUMS, THEN ONE APPLE', GOLD)
  );

  // 36. All other fruits are farther away.

  await until(S(36));

  await play(
    new M.LaggedStart(
      RANKED.slice(3).map(d =>
        new M.Indicate(
          points[d.index],
          {
            color: C.muted,
            runTime: 0.5
          }
        )
      ),
      {
        lagRatio: 0.08,
        runTime: 1.15
      }
    ),

    ...fbox([
      ['remaining 9 fruits', C.muted],
      ['all farther away', C.ink]
    ]),

    ...say('THE OTHER 9 ARE FARTHER AWAY', C.muted)
  );

  // ============================================================
  // BEATS 37–42: LET THE THREE NEAREST FRUITS VOTE
  // ============================================================

  let counters = voteCards({
    plum: 0,
    apple: 0,
    pear: 0
  });

  const ballot1 = tag(
    '+1',
    PLUM,
    [
      voteX(0),
      VOTE_Y + (P ? 0.91 : 0.68),
      0
    ],
    17
  );

  const ballot2 = tag(
    '+1',
    PLUM,
    [
      voteX(0),
      VOTE_Y + (P ? 0.91 : 0.68),
      0
    ],
    17
  );

  const ballot3 = tag(
    '+1',
    APPLE,
    [
      voteX(1),
      VOTE_Y + (P ? 0.91 : 0.68),
      0
    ],
    17
  );

  // 37. Highlight the first three fruits and ask them to vote.

  await until(S(37));

  await play(
    reveal(counters, 1.0, 0.12),

    ...fbox([
      ['SELECT FIRST 3', GOLD],
      ['each gives one vote', C.ink]
    ], GOLD),

    ...say('LET THE FIRST THREE VOTE', GOLD)
  );

  // 38. First plum votes for plum.

  await until(S(38));

  await play(
    new M.Indicate(
      points[NEAREST[0].index],
      { color: PLUM }
    ),

    new M.FadeIn(ballot1),

    new M.Transform(
      counters[0],
      voteCard(0, 1),
      { runTime: 0.65 }
    ),

    ...fbox([
      ['first plum votes plum', PLUM],
      ['plum votes = 1', PLUM]
    ], PLUM),

    ...say('FIRST VOTE: PLUM', PLUM)
  );

  // 39. Second plum gives another plum vote.

  await until(S(39));

  await play(
    new M.FadeOut(ballot1),

    new M.Indicate(
      points[NEAREST[1].index],
      { color: PLUM }
    ),

    new M.FadeIn(ballot2),

    new M.Transform(
      counters[0],
      voteCard(0, 2),
      { runTime: 0.65 }
    ),

    ...fbox([
      ['second plum votes plum', PLUM],
      ['plum votes = 2', PLUM]
    ], PLUM),

    ...say('SECOND VOTE: PLUM', PLUM)
  );

  // 40. The apple votes for apple.

  await until(S(40));

  await play(
    new M.FadeOut(ballot2),

    new M.Indicate(
      points[NEAREST[2].index],
      { color: APPLE }
    ),

    new M.FadeIn(ballot3),

    new M.Transform(
      counters[1],
      voteCard(1, 1),
      { runTime: 0.65 }
    ),

    ...fbox([
      ['the apple votes apple', APPLE],
      ['apple votes = 1', APPLE]
    ], APPLE),

    ...say('THIRD VOTE: APPLE', APPLE)
  );

  // 41. Plum wins with two votes, apple one, pear zero.

  await until(S(41));

  await play(
    new M.FadeOut(ballot3),

    new M.Transform(
      counters[0],
      voteCard(
        0,
        INITIAL_VOTES.plum,
        true
      ),
      { runTime: 0.8 }
    ),

    ...voteBox(
      INITIAL_VOTES,
      DEFAULT_K,
      'PLUM WINS'
    ),

    ...say('2 PLUM   1 APPLE   0 PEAR', PLUM)
  );

  // 42. Predict that the unknown fruit is a plum.

  await until(S(42));

  await play(
    new M.Indicate(
      counters[0],
      { color: PLUM }
    ),

    ...fbox([
      ['most votes = 2', PLUM],
      ['PREDICTION: PLUM', PLUM]
    ], PLUM),

    ...say('PREDICTION: PLUM', PLUM)
  );

  // ============================================================
  // BEATS 43–47: THE NUMBER OF NEIGHBORS, k
  // ============================================================

  // 43. The number of neighbors is represented by k.

  await until(S(43));

  await play(
    ...fbox([
      ['k = number of neighbors', C.cyan],
      ['number allowed to vote', C.ink]
    ]),

    ...say('k = HOW MANY NEIGHBORS VOTE')
  );

  // 44. k-nearest neighbors with k equal to three.

  await until(S(44));

  await play(
    new M.LaggedStart(
      nearestOutlines.map(o =>
        new M.Indicate(o, {
          color: GOLD
        })
      ),
      {
        lagRatio: 0.20,
        runTime: 1.5
      }
    ),

    ...fbox([
      ['k-NEAREST NEIGHBORS', C.cyan],
      ['k = 3', GOLD],
      ['ask the 3 nearest fruits', C.ink]
    ]),

    ...say('k-NEAREST NEIGHBORS: k = 3', GOLD)
  );

  // 45. Useful when similar measurements imply similar labels.

  await until(S(45));

  await play(
    ...fbox([
      ['works well when', C.ink],
      ['nearby examples tend', C.ink],
      ['to share a label', C.green]
    ], C.green),

    ...say('SIMILAR MEASUREMENTS, SIMILAR LABELS', C.green)
  );

  // 46. Too many neighbors can hide local information.

  const allQueueOutline = rounded(
    QUEUE_SP * QUEUE_COLS + 0.05,
    P ? 4.85 : 2.55,
    [
      CX,
      (QUEUE_Y[0] + QUEUE_Y[QUEUE_Y.length - 1]) / 2 - 0.07,
      0
    ],
    GOLD,
    0
  );

  await until(S(46));

  await play(
    ...remove(nearestOutlines),

    new M.Create(allQueueOutline),

    ...fbox([
      ['what if we ask', C.ink],
      ['all 12 fruits?', GOLD],
      ['including distant fruits', C.muted]
    ], GOLD),

    ...say('CAN TOO MANY NEIGHBORS HIDE THE CLUE?', GOLD)
  );

  // 47. With all twelve voting, each label receives four votes.

  const ALL_VOTES = countVotes(RANKED);

  await until(S(47));

  await play(
    ...NAMES.map((name, i) =>
      new M.Transform(
        counters[i],
        voteCard(
          i,
          ALL_VOTES[name],
          false
        ),
        { runTime: 1.0 }
      )
    ),

    ...voteBox(
      ALL_VOTES,
      12,
      'ALL 12 FRUITS VOTE'
    ),

    ...say('4 PLUM   4 APPLE   4 PEAR: TIE', GOLD)
  );

  // ============================================================
  // BEAT 48: WHY MEASUREMENT UNITS MATTER
  // ============================================================

  // Use the original query and A1 to compare the two
  // measurement systems.
  //
  // Grid units:
  // dx = 1, dy = 1
  // distance = sqrt(2)
  //
  // Raw grams:
  // dx = 50, dy = 1
  // distance = sqrt(2501)
  //
  // These are distances under different measurement choices,
  // not different physical positions of the same plotted fruits.

  const gridDistance = Math.sqrt(
    (a1.weight / 50 - QX) ** 2 +
    (a1.hue - QY) ** 2
  );

  const gramDistance = Math.sqrt(
    (a1.weight - NEW_FRUIT.weight) ** 2 +
    (a1.hue - QY) ** 2
  );

  const restoredGraph = graphParts();
  const restoredPoints = plotPoints();

  const restoredQuery = unknown(
    xy(QX, QY)
  );

  const unitComparisonHorizontal = line(
    xy(3, 4),
    xy(4, 4),
    C.cyan,
    2.8
  );

  const unitComparisonVertical = line(
    xy(4, 4),
    xy(4, 3),
    C.green,
    2.8
  );

  const unitComparisonDiagonal = line(
    xy(3, 4),
    xy(4, 3),
    GOLD,
    2.5
  );

  const gridHorizontalLabel = text(
    '1',
    P ? 17 : 14,
    C.cyan,
    [X(3.5), Y(4) + 0.22, 0],
    true
  );

  const gridVerticalLabel = text(
    '1',
    P ? 17 : 14,
    C.green,
    [X(4) + 0.22, Y(3.5), 0],
    true
  );

  // 48. Raw grams can make weight dominate the distance.

  await until(S(48));

  await play(
    new M.FadeOut(allQueueOutline),
    new M.FadeOut(sortedTitle),

    ...remove(sortedLabels),
    ...remove(points),
    ...remove(counters),

    reveal(restoredGraph, 0.8, 0.06),
    reveal(restoredPoints, 0.9, 0.05),

    new M.FadeIn(restoredQuery),

    new M.Create(unitComparisonHorizontal),
    new M.Create(unitComparisonVertical),
    new M.Create(unitComparisonDiagonal),

    new M.FadeIn(gridHorizontalLabel),
    new M.FadeIn(gridVerticalLabel),

    ...fbox([
      ['USING GRID UNITS', C.cyan],
      ['dx = 1, dy = 1', C.ink],
      ['distance = √(1² + 1²)', GOLD],
      [`≈ ${fmtDistance(gridDistance)}`, GOLD]
    ]),

    ...say('MEASUREMENT UNITS MATTER', GOLD)
  );

  await play(
    new M.Transform(
      gridHorizontalLabel,
      text(
        '50 g',
        P ? 15 : 13,
        C.cyan,
        [X(3.5), Y(4) + 0.22, 0],
        true
      ),
      { runTime: 0.75 }
    ),

    ...fbox([
      ['USING RAW GRAMS', GOLD],
      ['dx = 50, dy = 1', C.ink],
      ['distance = √(50² + 1²)', C.ink],
      [`≈ ${fmtDistance(gramDistance)}`, GOLD]
    ], GOLD)
  );

  await play(
    ...fbox([
      ['raw grams can make', C.ink],
      ['weight dominate hue', GOLD],
      ['choose units carefully', C.cyan]
    ], GOLD),

    ...say('AVOID LETTING ONE MEASUREMENT DOMINATE', GOLD)
  );

  graph = restoredGraph;
  points = restoredPoints;
  query = restoredQuery;

  // ============================================================
  // BEATS 49–53: TRY IT PREVIEW
  // ============================================================

  // The exercise is previewed using animated query positions
  // and changes to k. Its real drag, slider, Reset and New data
  // handlers belong to the separate interactive implementation.

  activeData = DATA;

  activeQueryX = QX;
  activeQueryY = QY;
  activeK = DEFAULT_K;

  const initialResult = classify(
    DATA,
    QX,
    QY,
    DEFAULT_K
  );

  tryMarks = neighborMarks(
    initialResult,
    QX,
    QY
  );

  // 49. Drag the diamond or change k.
  // Distances, votes and prediction update together.

  await until(S(49));

  await play(
    new M.FadeOut(unitComparisonHorizontal),
    new M.FadeOut(unitComparisonVertical),
    new M.FadeOut(unitComparisonDiagonal),

    new M.FadeOut(gridHorizontalLabel),
    new M.FadeOut(gridVerticalLabel),

    reveal(tryMarks, 1.0, 0.10),

    ...tryBox(
      initialResult,
      DEFAULT_K,
      'k = 3 | STARTING POSITION'
    ),

    ...say('TRY IT: DRAG THE DIAMOND OR CHANGE k', C.green)
  );

  // Move the query into a neighborhood dominated by apples.
  // The original known fruits remain fixed.

  await play(
    ...updateTry(
      5,
      3.8,
      3,
      'k = 3 | NEW POSITION'
    )
  );

  // Demonstrate changing k without moving the query.

  await play(
    ...updateTry(
      5,
      3.8,
      5,
      'k = 5 | MORE NEIGHBORS',
      false
    )
  );

  // 50. Choose three neighbors and find a position where
  // all three vote for plum.

  const plumPosition = {
    x: 1.8,
    y: 3.1
  };

  // The three nearest fruits at this position are
  // P1, P4 and P3, all plums.

  await until(S(50));

  await play(
    ...updateTry(
      plumPosition.x,
      plumPosition.y,
      3,
      'k = 3 | ALL THREE ARE PLUMS'
    ),

    ...say('TRY IT: GET THREE PLUM VOTES', C.green)
  );

  // 51. Predict what happens when all twelve neighbors vote.
  // Then change k to twelve and check.

  await until(S(51));

  await play(
    ...fbox([
      ['what happens if k = 12?', GOLD],
      ['will plum still win?', C.ink],
      ['make your prediction', C.cyan]
    ], GOLD),

    ...say('TRY IT: PREDICT THE RESULT FOR k = 12', C.green)
  );

  await play(
    ...updateTry(
      plumPosition.x,
      plumPosition.y,
      12,
      'k = 12 | ALL FRUITS VOTE',
      false
    )
  );

  // 52. Choose one neighbor and move onto a known apple.
  // The query sits exactly at A1: 200 g, hue 3.
  // Its distance is exactly zero.

  await until(S(52));

  await play(
    ...updateTry(
      4,
      3,
      1,
      'k = 1 | EXACTLY ON AN APPLE'
    ),

    ...say('TRY IT: k = 1 AND MOVE ONTO AN APPLE', C.green)
  );

  await play(
    ...fbox([
      ['nearest fruit: an apple', APPLE],
      ['distance = 0', GOLD],
      ['apple votes = 1', APPLE],
      ['PREDICTION: APPLE', APPLE]
    ], APPLE)
  );

  // 53. New data: explore fresh arrangements.
  //
  // These are hypothetical exercise examples, separate from
  // the fixed chapter dataset. The DATA array is never mutated.
  // Deterministic examples make narration replayable.

  const FRESH = [
    { id: 'P1', label: 'plum',  weight: 50,  hue: 2, firmness: 3 },
    { id: 'P2', label: 'plum',  weight: 100, hue: 5, firmness: 4 },
    { id: 'P3', label: 'plum',  weight: 150, hue: 2, firmness: 2 },
    { id: 'P4', label: 'plum',  weight: 200, hue: 5, firmness: 3 },

    { id: 'A1', label: 'apple', weight: 150, hue: 3, firmness: 3 },
    { id: 'A2', label: 'apple', weight: 350, hue: 4, firmness: 4 },
    { id: 'A3', label: 'apple', weight: 250, hue: 2, firmness: 2 },
    { id: 'A4', label: 'apple', weight: 250, hue: 5, firmness: 2 },

    { id: 'R1', label: 'pear',  weight: 100, hue: 7, firmness: 3 },
    { id: 'R2', label: 'pear',  weight: 200, hue: 7, firmness: 2 },
    { id: 'R3', label: 'pear',  weight: 150, hue: 6, firmness: 2 },
    { id: 'R4', label: 'pear',  weight: 300, hue: 8, firmness: 1 }
  ];

  const freshPoints = plotPoints(FRESH);

  const freshResult = classify(
    FRESH,
    3,
    4,
    3
  );

  const freshMarks = neighborMarks(
    freshResult,
    3,
    4
  );

  await until(S(53));

  await play(
    ...remove(tryMarks),
    ...remove(points),

    reveal(freshPoints, 1.2, 0.06),

    new M.Transform(
      query,
      unknown(xy(3, 4)),
      { runTime: 1.0 }
    ),

    reveal(freshMarks, 1.0, 0.08),

    ...tryBox(
      freshResult,
      3,
      'NEW DATA | k = 3'
    ),

    ...say('TRY IT: PRESS NEW DATA', C.green)
  );

  activeData = FRESH;
  points = freshPoints;
  tryMarks = freshMarks;

  activeQueryX = 3;
  activeQueryY = 4;
  activeK = 3;

  await play(
    ...updateTry(
      3,
      6.5,
      3,
      'NEW DATA | NEAR THE PEARS'
    )
  );

  // ============================================================
  // BEAT 54: RECAP — RESTORE EXACT ORIGINAL LESSON DATA
  // ============================================================

  // Restore all twelve known fruits to their original
  // measurements and the query to (3, 4).
  // Restore k = 3 and the exact original classification.

  const recapPoints = plotPoints(DATA);

  const recapResult = classify(
    DATA,
    QX,
    QY,
    DEFAULT_K
  );

  const recapMarks = neighborMarks(
    recapResult,
    QX,
    QY
  );

  // 54. Nearest neighbors predicts a label by letting
  // the closest known examples vote.

  await until(S(54));

  await play(
    ...remove(tryMarks),
    ...remove(points),

    reveal(recapPoints, 1.2, 0.06),

    new M.Transform(
      query,
      unknown(xy(QX, QY)),
      { runTime: 1.0 }
    ),

    reveal(recapMarks, 1.3, 0.12),

    ...fbox([
      ['NEAREST NEIGHBORS', C.cyan],
      ['1. measure distances', C.ink],
      ['2. choose the k closest', GOLD],
      ['3. let them vote', C.green]
    ]),

    ...say('THE CLOSEST KNOWN EXAMPLES VOTE')
  );

  activeData = DATA;
  points = recapPoints;
  tryMarks = recapMarks;

  activeQueryX = QX;
  activeQueryY = QY;
  activeK = DEFAULT_K;

  await play(
    new M.LaggedStart(
      recapResult.selected.map(d =>
        new M.Indicate(
          recapPoints[d.index],
          {
            color: colorOf(d.label),
            runTime: 0.8
          }
        )
      ),
      {
        lagRatio: 0.22,
        runTime: 1.7
      }
    ),

    ...fbox([
      ['k = 3 nearest neighbors', C.cyan],
      ['2 votes for plum', PLUM],
      ['1 vote for apple', APPLE],
      ['PREDICTION: PLUM', PLUM]
    ], PLUM),

    ...say('NEAREST NEIGHBORS: MEASURE, SELECT, VOTE', C.green)
  );
}
