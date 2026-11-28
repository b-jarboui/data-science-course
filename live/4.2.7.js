// lesson 4.2.7
// Conditional independence: two clues that share a hidden cause.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved engine API; browser playback has not been tested here.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play
  } = L;

  // ------------------------------------------------------------
  // Responsive layout: laptop and phone.
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;
  const CY = P ? -1.40 : -0.65;

  const PITCH = P ? 0.55 : 0.39;
  const SIZE = P ? 0.34 : 0.24;

  const PILL = P ? [0, 2.15, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.38, 0] : [4.25, -0.30, 0];

  const ORANGE = '#FF9D45';
  const TEAL = '#29D6C5';
  const WHITE = '#FFFFFF';

  const SCAN1 = C.cyan;
  const SCAN2 = C.violet;

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  function txt(
    s,
    size,
    color,
    pos,
    mono = false,
    maxWidth = Infinity
  ) {
    const t = T(s, size, color, mono);

    if (t.getWidth() > maxWidth) {
      t.scale(maxWidth / t.getWidth());
    }

    t.moveTo(pos);

    return t;
  }

  function line(a, b, color = C.muted, strokeWidth = 2) {
    return new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth
    });
  }

  function rect(
    w,
    h,
    pos,
    color,
    opacity = 0.85,
    strokeWidth = 2
  ) {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth
    });

    r.setFill(color, opacity);
    r.moveTo(pos);

    return r;
  }

  function outline(w, h, pos, color = C.cyan) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.10,
      color,
      strokeWidth: 2
    });

    r.setFill(color, 0);
    r.moveTo(pos);

    return r;
  }

  function tag(s, color, pos, size = 17, maxWidth = Infinity) {
    const t = pill(s, color, size);

    if (t.getWidth() > maxWidth) {
      t.scale(maxWidth / t.getWidth());
    }

    t.moveTo(pos);

    return t;
  }

  function square(
    pos,
    color,
    size = SIZE,
    strokeWidth = 2
  ) {
    return rect(
      size,
      size,
      pos,
      color,
      0.84,
      strokeWidth
    );
  }

  function ring(pos, radius, strokeWidth = 2) {
    const r = new M.Circle({
      radius,
      color: WHITE,
      strokeWidth
    });

    r.setFill(WHITE, 0);
    r.moveTo(pos);

    return r;
  }

  function appear(objects, runTime = 1.1, lagRatio = 0.025) {
    return new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      { lagRatio, runTime }
    );
  }

  function vanish(objects, runTime = 0.9, lagRatio = 0.015) {
    return new M.LaggedStart(
      objects.map(o => new M.FadeOut(o)),
      { lagRatio, runTime }
    );
  }

  function pulse(objects, color = C.amber, runTime = 1.2) {
    return new M.LaggedStart(
      objects.map(o => new M.Indicate(o, { color })),
      { lagRatio: 0.08, runTime }
    );
  }

  // ------------------------------------------------------------
  // Formula box: following the approved reference lesson.
  // Each row is either text or [text, color].
  // Leading spaces indent.
  // ------------------------------------------------------------

  let boxNow = null;

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.44 : 0.42;

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

    const wd = Math.max(...widths) + 0.7;
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

    const left = BOXP[0] - wd / 2 + 0.35;
    const top = BOXP[1] + ht / 2 - 0.2 - lh / 2;

    texts.forEach((t, i) => {
      const ind =
        cw * (
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

    const maxw = P ? FW - 1.2 : 4.4;
    const maxh = P ? 1.65 : 3.2;

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

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [new M.FadeOut(old)];
  }

  // ------------------------------------------------------------
  // Picture management.
  //
  // Retained objects remain attached to the scene.
  // Only entering and departing objects receive fades.
  // ------------------------------------------------------------

  let pictureNow = [];

  function picture(next, runTime = 1.0) {
    const oldSet = new Set(pictureNow);
    const newSet = new Set(next);

    const outgoing = pictureNow.filter(
      o => !newSet.has(o)
    );

    const incoming = next.filter(
      o => !oldSet.has(o)
    );

    const a = [];

    if (outgoing.length) {
      a.push(
        vanish(outgoing, runTime, 0.015)
      );
    }

    if (incoming.length) {
      a.push(
        appear(incoming, runTime, 0.018)
      );
    }

    pictureNow = next.slice();

    return a;
  }

  // ------------------------------------------------------------
  // Coordinate-based focus outlines.
  //
  // Never wrap already-visible objects in a new VGroup or
  // SurroundingRectangle.
  // ------------------------------------------------------------

  let marksNow = [];

  function marks(next) {
    const a = marksNow.map(
      o => new M.FadeOut(o)
    );

    a.push(
      ...next.map(o => new M.Create(o))
    );

    marksNow = next.slice();

    return a;
  }

  function clearMarks() {
    return marks([]);
  }

  function focus(w, h, pos, color = C.cyan) {
    return marks([
      outline(w, h, pos, color)
    ]);
  }

  // ------------------------------------------------------------
  // Fixed chapter data.
  //
  // Ten days of work at factory A:
  //
  // 1,000 parts in total.
  // 100 faulty parts.
  // 900 sound parts.
  //
  // FAULTY PARTS:
  //
  //                      Scanner 2
  // Scanner 1          Beep   Quiet   Total
  // Beep                 81       9      90
  // Quiet                 9       1      10
  // Total                90      10     100
  //
  // SOUND PARTS:
  //
  //                      Scanner 2
  // Scanner 1          Beep   Quiet   Total
  // Beep                  9      81      90
  // Quiet                81     729     810
  // Total                90     810     900
  //
  // OVERALL:
  //
  //                      Scanner 2
  // Scanner 1          Beep   Quiet   Total
  // Beep                 90      90     180
  // Quiet                90     730     820
  // Total               180     820    1000
  //
  // Inside faulty: 90% = 90%.
  // Inside sound:  10% = 10%.
  //
  // Overall scanner 2 beep rate:
  // 180 / 1000 = 18%.
  //
  // Given scanner 1 beeped:
  // 90 / 180 = 50%.
  //
  // Therefore the scans are independent given fault status,
  // but dependent over all parts.
  // ------------------------------------------------------------

  const DATA = Array.from({ length: 1000 }, (_, i) => {
    const tile = Math.floor(i / 100);
    const local = i % 100;

    const r = Math.floor(local / 10);
    const c = local % 10;

    // Tile zero represents the 100 faulty parts.
    // Tiles one through nine contain 900 sound parts.
    //
    // These are display groups, not separate production days.

    const faulty = tile === 0;

    // Faulty parts:
    // Scanner 1 beeps on nine rows.
    // Scanner 2 beeps on nine columns.
    //
    // Their intersection is 9 × 9 = 81 parts.

    // Sound parts:
    // In each 100-part tile, scanner 1 beeps on one row.
    // Scanner 2 beeps on one column.
    //
    // Their intersection is one part per tile.
    // Nine tiles therefore give nine double beeps.

    const s1 = faulty
      ? r < 9
      : r === 0;

    const s2 = faulty
      ? c < 9
      : c === 0;

    return {
      i,
      tile,
      r,
      c,
      faulty,
      s1,
      s2
    };
  });

  const FAULTY = DATA.filter(d => d.faulty);
  const SOUND = DATA.filter(d => !d.faulty);

  const SCANNER1_BEEPS = DATA.filter(d => d.s1);
  const SCANNER2_BEEPS = DATA.filter(d => d.s2);

  const BOTH_BEEPS = DATA.filter(
    d => d.s1 && d.s2
  );

  const truthColor = d => d.faulty
    ? ORANGE
    : TEAL;

  function count(records, condition) {
    return records.filter(condition).length;
  }

  // Verify the exact shared chapter counts.

  if (
    DATA.length !== 1000 ||
    FAULTY.length !== 100 ||
    SOUND.length !== 900 ||

    count(FAULTY, d => d.s1 && d.s2) !== 81 ||
    count(FAULTY, d => d.s1 && !d.s2) !== 9 ||
    count(FAULTY, d => !d.s1 && d.s2) !== 9 ||
    count(FAULTY, d => !d.s1 && !d.s2) !== 1 ||

    count(SOUND, d => d.s1 && d.s2) !== 9 ||
    count(SOUND, d => d.s1 && !d.s2) !== 81 ||
    count(SOUND, d => !d.s1 && d.s2) !== 81 ||
    count(SOUND, d => !d.s1 && !d.s2) !== 729 ||

    SCANNER1_BEEPS.length !== 180 ||
    SCANNER2_BEEPS.length !== 180 ||
    BOTH_BEEPS.length !== 90
  ) {
    throw new Error(
      'Lesson 4.2.7: counts do not match the shared chapter data.'
    );
  }

  // ------------------------------------------------------------
  // Visual language for two scanners.
  //
  // Orange square = faulty part.
  // Teal square = sound part.
  //
  // Inner white ring = scanner 1 beep.
  // Outer white ring = scanner 2 beep.
  // Two concentric white rings = both scanners beep.
  // No ring = neither scanner beeped.
  //
  // Scanner 1 and scanner 2 retain the same ring convention
  // throughout this lesson.
  // ------------------------------------------------------------

  function scannerLegend(y, showSecond = true) {
    const dx = P ? 1.60 : 1.42;

    const x1 = showSecond
      ? CX - dx
      : CX - 0.75;

    const x2 = CX + dx;

    const p1 = [x1 - 0.90, y, 0];
    const p2 = [x2 - 0.90, y, 0];

    const first = [
      square(p1, C.muted, 0.18, 1.5),
      ring(p1, 0.15, 2.0),

      txt(
        'S1: inner ring',
        P ? 16 : 15,
        WHITE,
        [x1 + 0.16, y, 0],
        false,
        1.95
      )
    ];

    if (!showSecond) {
      return first;
    }

    return [
      ...first,

      square(p2, C.muted, 0.18, 1.5),
      ring(p2, 0.23, 2.0),

      txt(
        'S2: outer ring',
        P ? 16 : 15,
        WHITE,
        [x2 + 0.16, y, 0],
        false,
        1.95
      )
    ];
  }

  // ------------------------------------------------------------
  // Large-grid rendering.
  //
  // Pre-group records by display tile, truth and scan outcomes.
  // This keeps the number of animated top-level objects small
  // while still drawing every individual part.
  //
  // Groups are constructed before anything enters the scene.
  // No already-visible object is regrouped.
  // ------------------------------------------------------------

  function batchKey(d) {
    return [
      d.tile,
      Number(d.faulty),
      Number(d.s1),
      Number(d.s2)
    ].join(':');
  }

  function makeView(
    records,
    position,
    size,
    innerRadius,
    outerRadius,
    stroke = 1.1,
    neutral = false
  ) {
    const batches = new Map();

    records.forEach(d => {
      const key = batchKey(d);

      if (!batches.has(key)) {
        batches.set(key, []);
      }

      batches.get(key).push(d);
    });

    const result = [];

    batches.forEach((items, key) => {
      const example = items[0];

      const sqItems = items.map(d =>
        square(
          position(d),
          neutral ? C.muted : truthColor(d),
          size,
          stroke
        )
      );

      const r1Items = example.s1
        ? items.map(d =>
            ring(
              position(d),
              innerRadius,
              stroke
            )
          )
        : [];

      const r2Items = example.s2
        ? items.map(d =>
            ring(
              position(d),
              outerRadius,
              stroke
            )
          )
        : [];

      result.push({
        key,
        records: items,

        faulty: example.faulty,
        s1: example.s1,
        s2: example.s2,

        sqItems,

        sq: new M.VGroup(...sqItems),

        r1: r1Items.length
          ? new M.VGroup(...r1Items)
          : null,

        r2: r2Items.length
          ? new M.VGroup(...r2Items)
          : null
      });
    });

    return {
      batches: result,
      byKey: new Map(
        result.map(b => [b.key, b])
      )
    };
  }

  function selectView(
    view,
    keep = () => true,
    showS1 = false,
    showS2 = false
  ) {
    const items = [];

    view.batches
      .filter(keep)
      .forEach(b => {
        items.push(b.sq);

        if (showS1 && b.r1) {
          items.push(b.r1);
        }

        if (showS2 && b.r2) {
          items.push(b.r2);
        }
      });

    return items;
  }

  function selectPartialS2(
    view,
    condition,
    showS1 = true
  ) {
    const items = [];

    view.batches.forEach(b => {
      items.push(b.sq);

      if (showS1 && b.r1) {
        items.push(b.r1);
      }

      if (b.r2 && condition(b)) {
        items.push(b.r2);
      }
    });

    return items;
  }

  function squareGroups(view, condition = () => true) {
    return view.batches
      .filter(condition)
      .map(b => b.sq);
  }

  function scanner2Groups(view, condition = () => true) {
    return view.batches
      .filter(b => b.r2 && condition(b))
      .map(b => b.r2);
  }

  function paintTruth(view) {
    view.batches.forEach(batch => {
      const color = batch.faulty
        ? ORANGE
        : TEAL;

      batch.sqItems.forEach(sq => {
        sq.setColor(color);
        sq.setFill(color, 0.84);
      });
    });
  }

  // ------------------------------------------------------------
  // Original 100-part picture.
  //
  // Same arrangement as earlier lessons:
  // ten orange parts in the first row,
  // ninety teal parts below.
  // ------------------------------------------------------------

  function originalGrid() {
    const items = Array.from(
      { length: 100 },
      (_, i) => {
        const r = Math.floor(i / 10);
        const c = i % 10;

        return square(
          [
            CX + (c - 4.5) * PITCH,
            CY + (4.5 - r) * PITCH,
            0
          ],
          r === 0 ? ORANGE : TEAL
        );
      }
    );

    return {
      items,
      faulty: items.slice(0, 10),

      all: [
        new M.VGroup(...items)
      ]
    };
  }

  // ------------------------------------------------------------
  // Scanner illustration.
  //
  // Both scanners have identical geometry.
  // They inspect the same part separately.
  // No communication link is drawn between them.
  // ------------------------------------------------------------

  function scannerMachine(pos, scale = 1) {
    const x = pos[0];
    const y = pos[1];

    const p = (dx, dy) => [
      x + dx * scale,
      y + dy * scale,
      0
    ];

    const shell = new M.RoundedRectangle({
      width: 1.45 * scale,
      height: 1.80 * scale,
      cornerRadius: 0.14 * scale,
      color: C.cyan,
      strokeWidth: 2.4
    });

    shell.setFill(C.card, 0.96);
    shell.moveTo(p(0, 0.22));

    const head = rect(
      1.02 * scale,
      0.20 * scale,
      p(0, 0.82),
      C.cyan,
      0.90,
      1.5
    );

    const beam = line(
      p(0, 0.69),
      p(0, -0.20),
      C.cyan,
      2.4
    );

    const lamp = new M.Circle({
      radius: 0.075 * scale,
      color: C.green,
      strokeWidth: 1.2
    });

    lamp.setFill(C.green, 0.95);
    lamp.moveTo(p(0.49, 0.96));

    return new M.VGroup(
      shell,
      head,
      beam,
      lamp
    );
  }

  function scannerPair() {
    const dx = P ? 1.45 : 1.32;
    const y = CY + 0.10;

    const left = scannerMachine(
      [CX - dx, y, 0]
    );

    const right = scannerMachine(
      [CX + dx, y, 0]
    );

    const belt = new M.RoundedRectangle({
      width: P ? 5.90 : 5.45,
      height: 0.35,
      cornerRadius: 0.13,
      color: C.muted,
      strokeWidth: 2
    });

    belt.setFill(C.card, 0.95);
    belt.moveTo([
      CX,
      y - 0.76,
      0
    ]);

    const rollers = Array.from(
      { length: 9 },
      (_, k) => {
        const c = new M.Circle({
          radius: 0.075,
          color: C.muted,
          strokeWidth: 1.2
        });

        c.setFill(C.muted, 0.30);

        c.moveTo([
          CX + (k - 4) * 0.55,
          y - 0.76,
          0
        ]);

        return c;
      }
    );

    const leftLabel = tag(
      'SCANNER 1',
      SCAN1,
      [CX - dx, y + 1.50, 0],
      P ? 18 : 16
    );

    const rightLabel = tag(
      'SCANNER 2',
      SCAN2,
      [CX + dx, y + 1.50, 0],
      P ? 18 : 16
    );

    const firstPos = [
      CX - dx,
      y - 0.33,
      0
    ];

    const secondPos = [
      CX + dx,
      y - 0.33,
      0
    ];

    const part = square(
      firstPos,
      C.muted,
      0.44
    );

    const arrow = txt(
      '→',
      P ? 27 : 25,
      C.green,
      [CX, y - 0.33, 0]
    );

    const noSharing = tag(
      'NO SHARING OF RESULTS',
      C.muted,
      [CX, y - 1.42, 0],
      P ? 17 : 15,
      P ? 6.0 : 5.0
    );

    return {
      left,
      right,
      part,
      firstPos,
      secondPos,
      arrow,

      base: [
        left,
        right,
        belt,
        ...rollers,
        leftLabel,
        rightLabel,
        noSharing
      ],

      all: [
        left,
        right,
        belt,
        ...rollers,
        leftLabel,
        rightLabel,
        noSharing,
        part,
        arrow
      ]
    };
  }

  // ------------------------------------------------------------
  // One-thousand-part overview.
  //
  // Ten tiles of 100 parts each.
  //
  // Laptop: five tiles across, two down.
  // Phone: two tiles across, five down.
  //
  // Tile zero contains 100 faulty parts.
  // The remaining nine tiles contain 900 sound parts.
  // ------------------------------------------------------------

  const BIG_COLS = P ? 2 : 5;
  const BIG_ROWS = 10 / BIG_COLS;

  const BIG_SP = P ? 0.110 : 0.105;

  const BIG_SIZE = BIG_SP * 0.40;
  const BIG_R1 = BIG_SP * 0.32;
  const BIG_R2 = BIG_SP * 0.46;

  const BIG_TILE_W = 10 * BIG_SP + 0.10;

  const BIG_STEP_X = P ? 1.90 : 1.26;
  const BIG_STEP_Y = P ? 1.23 : 1.55;

  const BIG_CY = P ? -2.05 : -0.55;

  const BIG_H =
    (BIG_ROWS - 1) * BIG_STEP_Y +
    BIG_TILE_W;

  function bigTileCenter(k) {
    const r = Math.floor(k / BIG_COLS);
    const c = k % BIG_COLS;

    return [
      CX +
        (c - (BIG_COLS - 1) / 2) * BIG_STEP_X,

      BIG_CY +
        ((BIG_ROWS - 1) / 2 - r) * BIG_STEP_Y,

      0
    ];
  }

  function bigPos(d) {
    const center = bigTileCenter(d.tile);

    return [
      center[0] + (d.c - 4.5) * BIG_SP,
      center[1] + (4.5 - d.r) * BIG_SP,
      0
    ];
  }

  function makeBig(neutral = false) {
    const view = makeView(
      DATA,
      bigPos,
      BIG_SIZE,
      BIG_R1,
      BIG_R2,
      0.85,
      neutral
    );

    const frames = Array.from(
      { length: 10 },
      (_, k) => outline(
        BIG_TILE_W,
        BIG_TILE_W,
        bigTileCenter(k),
        C.muted
      )
    );

    const heading = txt(
      '10 DAYS: 1,000 PARTS',
      P ? 19 : 17,
      C.ink,
      [
        CX,
        BIG_CY + BIG_H / 2 + 0.30,
        0
      ],
      false,
      P ? 6.5 : 5.7
    );

    const label = txt(
      'Each small grid contains 100 parts',
      P ? 16 : 15,
      C.muted,
      [
        CX,
        BIG_CY - BIG_H / 2 - 0.29,
        0
      ],
      false,
      P ? 6.4 : 5.6
    );

    return {
      view,
      frames,
      heading,
      label,

      base: [
        ...frames,
        ...selectView(view),
        heading,
        label
      ],

      all: [
        ...frames,
        ...selectView(
          view,
          () => true,
          true,
          true
        ),
        heading,
        label
      ]
    };
  }

  // ------------------------------------------------------------
  // Detailed faulty-group picture.
  //
  // Exactly 100 orange squares.
  //
  // Scanner 1:
  // Top nine rows beep: 90 parts.
  // Bottom row stays quiet: 10 parts.
  //
  // Scanner 2:
  // First nine columns beep.
  // Final column stays quiet.
  //
  // This forms an 81-part double-beep region.
  // ------------------------------------------------------------

  const F_SP = P ? 0.49 : 0.36;

  const F_SIZE = F_SP * 0.40;
  const F_R1 = F_SP * 0.32;
  const F_R2 = F_SP * 0.45;

  const F_CY = P ? -1.35 : -0.76;

  const F_W = 10 * F_SP + 0.10;
  const F_H = 10 * F_SP + 0.10;

  function faultyPos(d) {
    return [
      CX + (d.c - 4.5) * F_SP,
      F_CY + (4.5 - d.r) * F_SP,
      0
    ];
  }

  function makeFaultyView() {
    const view = makeView(
      FAULTY,
      faultyPos,
      F_SIZE,
      F_R1,
      F_R2,
      P ? 2.0 : 1.65
    );

    const heading = txt(
      'ONLY THE 100 FAULTY PARTS',
      P ? 19 : 16,
      ORANGE,
      [
        CX,
        F_CY + F_H / 2 + 0.35,
        0
      ],
      false,
      P ? 6.4 : 5.7
    );

    const divider = new M.DashedLine({
      start: [
        CX - F_W / 2,
        F_CY - 4 * F_SP,
        0
      ],

      end: [
        CX + F_W / 2,
        F_CY - 4 * F_SP,
        0
      ],

      color: C.muted
    });

    const legendY = P ? -4.55 : -2.76;

    const legend1 = scannerLegend(
      legendY,
      false
    );

    const legend2 = scannerLegend(
      legendY,
      true
    );

    return {
      view,
      heading,
      divider,
      legend1,
      legend2,

      base: [
        ...selectView(view),
        heading
      ],

      scan1: [
        ...selectView(
          view,
          () => true,
          true,
          false
        ),
        heading,
        divider,
        ...legend1
      ],

      partial2: [
        ...selectPartialS2(
          view,
          b => b.s1
        ),
        heading,
        divider,
        ...legend2
      ],

      all: [
        ...selectView(
          view,
          () => true,
          true,
          true
        ),
        heading,
        divider,
        ...legend2
      ]
    };
  }

  function faultyBeepOutline(color = SCAN1) {
    return outline(
      F_W,
      9 * F_SP - 0.03,
      [
        CX,
        F_CY + 0.5 * F_SP,
        0
      ],
      color
    );
  }

  function faultyQuietOutline(color = C.muted) {
    return outline(
      F_W,
      F_SP - 0.015,
      [
        CX,
        F_CY - 4.5 * F_SP,
        0
      ],
      color
    );
  }

  function faultyBothOutline() {
    return outline(
      9 * F_SP - 0.02,
      9 * F_SP - 0.02,
      [
        CX - 0.5 * F_SP,
        F_CY + 0.5 * F_SP,
        0
      ],
      C.amber
    );
  }

  // ------------------------------------------------------------
  // Detailed sound-group picture.
  //
  // Exactly 900 teal squares, arranged in a 30-by-30 grid.
  //
  // The first three rows contain the 90 scanner-1 beeps.
  // The remaining 27 rows contain the 810 quiet parts.
  //
  // Each row contains three scanner-2 beeps:
  //
  // 3 rows × 3  = 9 second-scanner beeps among S1 beeps.
  // 27 rows × 3 = 81 second-scanner beeps among S1 quiet.
  //
  // Both conditional rates are 10%.
  //
  // This is a rearrangement of the same 900 sound records.
  // No new data are introduced.
  // ------------------------------------------------------------

  const G_SP = P ? 0.21 : 0.121;

  const G_SIZE = G_SP * 0.40;
  const G_R1 = G_SP * 0.32;
  const G_R2 = G_SP * 0.46;

  const G_CY = P ? -1.85 : -0.70;

  const G_W = 30 * G_SP + 0.10;
  const G_H = 30 * G_SP + 0.10;

  const SOUND_POSITION = new Map();

  function assignSoundRegion(
    records,
    startRow,
    rowCount
  ) {
    const positive = records.filter(d => d.s2);
    const negative = records.filter(d => !d.s2);

    let ip = 0;
    let iq = 0;

    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < 30; c++) {
        // Three evenly spaced second-scanner beeps per row.

        const secondBeep =
          c === 0 ||
          c === 10 ||
          c === 20;

        const d = secondBeep
          ? positive[ip++]
          : negative[iq++];

        SOUND_POSITION.set(
          d.i,
          [
            CX + (c - 14.5) * G_SP,

            G_CY +
              (14.5 - startRow - r) * G_SP,

            0
          ]
        );
      }
    }
  }

  assignSoundRegion(
    SOUND.filter(d => d.s1),
    0,
    3
  );

  assignSoundRegion(
    SOUND.filter(d => !d.s1),
    3,
    27
  );

  function soundPos(d) {
    return SOUND_POSITION.get(d.i);
  }

  function makeSoundView() {
    const view = makeView(
      SOUND,
      soundPos,
      G_SIZE,
      G_R1,
      G_R2,
      P ? 1.15 : 0.85
    );

    const heading = txt(
      'ONLY THE 900 SOUND PARTS',
      P ? 19 : 16,
      TEAL,
      [
        CX,
        G_CY + G_H / 2 + 0.30,
        0
      ],
      false,
      P ? 6.4 : 5.7
    );

    const dividerY =
      G_CY + 12 * G_SP;

    const divider = new M.DashedLine({
      start: [
        CX - G_W / 2,
        dividerY,
        0
      ],

      end: [
        CX + G_W / 2,
        dividerY,
        0
      ],

      color: C.muted
    });

    const legendY = P ? -5.65 : -2.82;

    const legend1 = scannerLegend(
      legendY,
      false
    );

    const legend2 = scannerLegend(
      legendY,
      true
    );

    return {
      view,
      heading,
      divider,

      base: [
        ...selectView(view),
        heading
      ],

      scan1: [
        ...selectView(
          view,
          () => true,
          true,
          false
        ),
        heading,
        divider,
        ...legend1
      ],

      partial2: [
        ...selectPartialS2(
          view,
          b => b.s1
        ),
        heading,
        divider,
        ...legend2
      ],

      all: [
        ...selectView(
          view,
          () => true,
          true,
          true
        ),
        heading,
        divider,
        ...legend2
      ]
    };
  }

  function soundBeepOutline(color = SCAN1) {
    return outline(
      G_W,
      3 * G_SP + 0.025,
      [
        CX,
        G_CY + 13.5 * G_SP,
        0
      ],
      color
    );
  }

  function soundQuietOutline(color = C.muted) {
    return outline(
      G_W,
      27 * G_SP - 0.025,
      [
        CX,
        G_CY - 1.5 * G_SP,
        0
      ],
      color
    );
  }

  // ------------------------------------------------------------
  // Comparison bars.
  //
  // Every bar represents 100% of its own named group.
  //
  // Filled portion = scanner 2 beep rate.
  // Muted portion = scanner 2 quiet rate.
  //
  // These normalized bars make equal probabilities visible
  // even when the original group sizes differ greatly.
  // ------------------------------------------------------------

  const BAR_W = P ? 5.65 : 5.05;
  const BAR_H = P ? 0.34 : 0.27;

  function rateBar(
    y,
    fraction,
    label,
    value,
    color
  ) {
    const track = new M.RoundedRectangle({
      width: BAR_W,
      height: BAR_H,
      cornerRadius: 0.07,
      color: C.muted,
      strokeWidth: 1.5
    });

    track.setFill(C.card, 0.95);
    track.moveTo([CX, y, 0]);

    const fillW = BAR_W * fraction;

    const fill = rect(
      fillW,
      BAR_H - 0.04,
      [
        CX - BAR_W / 2 + fillW / 2,
        y,
        0
      ],
      color,
      0.92,
      1.2
    );

    const labelText = txt(
      label,
      P ? 17 : 15,
      C.ink,
      [
        CX - BAR_W / 2 + BAR_W * 0.39,
        y + 0.30,
        0
      ],
      false,
      BAR_W * 0.74
    );

    const valueText = txt(
      value,
      P ? 20 : 18,
      color,
      [
        CX + BAR_W / 2 - 0.48,
        y + 0.30,
        0
      ],
      true,
      0.85
    );

    return new M.VGroup(
      track,
      fill,
      labelText,
      valueText
    );
  }

  function conditionalComparison() {
    const centerY = P ? -1.25 : -0.55;

    const gap = P ? 1.04 : 0.83;

    const ys = [
      centerY + 1.5 * gap,
      centerY + 0.5 * gap,
      centerY - 0.5 * gap,
      centerY - 1.5 * gap
    ];

    const f1 = rateBar(
      ys[0],
      0.90,
      'Faulty, S1 beeped',
      '90%',
      ORANGE
    );

    const f2 = rateBar(
      ys[1],
      0.90,
      'Faulty, S1 quiet',
      '90%',
      ORANGE
    );

    const g1 = rateBar(
      ys[2],
      0.10,
      'Sound, S1 beeped',
      '10%',
      TEAL
    );

    const g2 = rateBar(
      ys[3],
      0.10,
      'Sound, S1 quiet',
      '10%',
      TEAL
    );

    const title = txt(
      'CHANCE THAT SCANNER 2 BEEPS',
      P ? 18 : 16,
      WHITE,
      [
        CX,
        ys[0] + 0.83,
        0
      ],
      false,
      BAR_W + 0.25
    );

    const divider = new M.DashedLine({
      start: [
        CX - BAR_W / 2,
        centerY,
        0
      ],

      end: [
        CX + BAR_W / 2,
        centerY,
        0
      ],

      color: C.muted
    });

    const equalFaulty = txt(
      '90% = 90%',
      P ? 18 : 16,
      C.green,
      [
        CX,
        ys[0] + 0.52,
        0
      ],
      true
    );

    const summary = tag(
      'EQUAL WITHIN EACH GROUP',
      C.green,
      [
        CX,
        P ? -4.13 : -2.58,
        0
      ],
      P ? 18 : 16
    );

    return {
      f1,
      f2,
      g1,
      g2,
      title,
      divider,
      summary,

      all: [
        f1,
        f2,
        g1,
        g2,
        title,
        divider,
        summary
      ]
    };
  }

  function overallComparison() {
    const y1 = CY + 0.90;
    const y2 = CY - 0.65;

    const before = rateBar(
      y1,
      0.18,
      'All 1,000 parts',
      '18%',
      SCAN2
    );

    const after = rateBar(
      y2,
      0.50,
      'Given scanner 1 beeped',
      '50%',
      SCAN2
    );

    const title = txt(
      'CHANCE THAT SCANNER 2 BEEPS',
      P ? 19 : 17,
      WHITE,
      [CX, y1 + 0.85, 0],
      false,
      BAR_W + 0.30
    );

    const label = tag(
      '18% → 50%',
      C.amber,
      [
        CX,
        y2 - 0.85,
        0
      ],
      P ? 22 : 20
    );

    return {
      before,
      after,
      title,
      label,

      all: [
        before,
        after,
        title,
        label
      ]
    };
  }

  // ------------------------------------------------------------
  // Compact picture of the 180 scanner-1 beeps.
  //
  // Left: 90 faulty parts.
  // Right: 90 sound parts.
  //
  // Every square has an inner white ring.
  //
  // Faulty group:
  // 81 also have an outer white ring.
  //
  // Sound group:
  // 9 also have an outer white ring.
  //
  // Total double beeps = 90 out of 180.
  // ------------------------------------------------------------

  const BEEP_SP = P ? 0.29 : 0.235;

  const BEEP_SIZE = BEEP_SP * 0.40;
  const BEEP_R1 = BEEP_SP * 0.32;
  const BEEP_R2 = BEEP_SP * 0.45;

  const BEEP_DX = P ? 1.55 : 1.27;

  const BEEP_CY = P ? -1.40 : -0.65;

  const BEEP_W = 9 * BEEP_SP + 0.12;
  const BEEP_H = 10 * BEEP_SP + 0.12;

  const BEEP_POSITION = new Map();

  function arrangeBeepGroup(records, faulty) {
    // Put double-beeping parts first so their count forms
    // a visible rectangular region.

    const sorted = [
      ...records.filter(d => d.s2),
      ...records.filter(d => !d.s2)
    ];

    const x = CX + (
      faulty ? -BEEP_DX : BEEP_DX
    );

    sorted.forEach((d, k) => {
      const r = Math.floor(k / 9);
      const c = k % 9;

      BEEP_POSITION.set(
        d.i,
        [
          x + (c - 4) * BEEP_SP,
          BEEP_CY + (4.5 - r) * BEEP_SP,
          0
        ]
      );
    });
  }

  arrangeBeepGroup(
    SCANNER1_BEEPS.filter(d => d.faulty),
    true
  );

  arrangeBeepGroup(
    SCANNER1_BEEPS.filter(d => !d.faulty),
    false
  );

  function beepPos(d) {
    return BEEP_POSITION.get(d.i);
  }

  function makeCompactBeeps() {
    return makeView(
      SCANNER1_BEEPS,
      beepPos,
      BEEP_SIZE,
      BEEP_R1,
      BEEP_R2,
      P ? 1.65 : 1.3
    );
  }

  function compactBeepLabels(showCounts = false) {
    const topY =
      BEEP_CY + BEEP_H / 2 + 0.35;

    const bottomY =
      BEEP_CY - BEEP_H / 2 - 0.35;

    const left = txt(
      '90 FAULTY',
      P ? 18 : 16,
      ORANGE,
      [CX - BEEP_DX, topY, 0]
    );

    const right = txt(
      '90 SOUND',
      P ? 18 : 16,
      TEAL,
      [CX + BEEP_DX, topY, 0]
    );

    const leftFrame = outline(
      BEEP_W,
      BEEP_H,
      [CX - BEEP_DX, BEEP_CY, 0],
      ORANGE
    );

    const rightFrame = outline(
      BEEP_W,
      BEEP_H,
      [CX + BEEP_DX, BEEP_CY, 0],
      TEAL
    );

    const total = tag(
      '180 SCANNER-1 BEEPS',
      WHITE,
      [
        CX,
        P ? -4.75 : -2.74,
        0
      ],
      P ? 18 : 16
    );

    const items = [
      left,
      right,
      leftFrame,
      rightFrame,
      total
    ];

    if (showCounts) {
      items.push(
        txt(
          '81 also beep on S2',
          P ? 16 : 14,
          ORANGE,
          [
            CX - BEEP_DX,
            bottomY,
            0
          ],
          false,
          BEEP_W + 0.15
        ),

        txt(
          '9 also beep on S2',
          P ? 16 : 14,
          TEAL,
          [
            CX + BEEP_DX,
            bottomY,
            0
          ],
          false,
          BEEP_W + 0.15
        )
      );
    }

    return items;
  }

  function gatherScanner1Beeps(source, target) {
    const moves = [];

    source.batches
      .filter(b => b.s1)
      .forEach(batch => {
        const destination =
          target.byKey.get(batch.key);

        if (!destination) {
          throw new Error(
            'Missing target batch for scanner-1 beep.'
          );
        }

        moves.push(
          new M.Transform(
            batch.sq,
            destination.sq
          )
        );

        moves.push(
          new M.Transform(
            batch.r1,
            destination.r1
          )
        );

        if (batch.r2) {
          moves.push(
            new M.Transform(
              batch.r2,
              destination.r2
            )
          );
        }
      });

    // Each square and its rings move together.

    return new M.LaggedStart(
      moves,
      {
        lagRatio: 0,
        runTime: 1.65
      }
    );
  }

  function compactFaultyBothOutline() {
    return outline(
      BEEP_W,
      9 * BEEP_SP - 0.025,
      [
        CX - BEEP_DX,
        BEEP_CY + 0.5 * BEEP_SP,
        0
      ],
      C.amber
    );
  }

  function compactSoundBothOutline() {
    return outline(
      BEEP_W,
      BEEP_SP - 0.015,
      [
        CX + BEEP_DX,
        BEEP_CY + 4.5 * BEEP_SP,
        0
      ],
      C.amber
    );
  }

  // ------------------------------------------------------------
  // Hidden-cause diagram.
  //
  //          Fault status
  //             /    \
  //      Scanner 1  Scanner 2
  //
  // Both scanners respond to the same underlying truth.
  //
  // There is no direct arrow from one scanner to the other.
  // Knowing the fault status removes the extra information
  // that scanner 1 provides about scanner 2.
  // ------------------------------------------------------------

  function arrow(a, b, color, glow = true) {
    const items = [];

    if (glow) {
      items.push(
        line(a, b, '#394554', 7)
      );
    }

    items.push(
      line(a, b, color, 3)
    );

    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const length = Math.hypot(dx, dy);

    const ux = dx / length;
    const uy = dy / length;

    const back = 0.19;
    const side = 0.11;

    const p1 = [
      b[0] - back * ux - side * uy,
      b[1] - back * uy + side * ux,
      0
    ];

    const p2 = [
      b[0] - back * ux + side * uy,
      b[1] - back * uy - side * ux,
      0
    ];

    items.push(
      line(p1, b, color, 3),
      line(p2, b, color, 3)
    );

    return new M.VGroup(...items);
  }

  function diagramNode(
    pos,
    width,
    height,
    heading,
    detail,
    color
  ) {
    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.14,
      color,
      strokeWidth: 2.2
    });

    r.setFill(C.card, 0.97);
    r.moveTo(pos);

    const a = txt(
      heading,
      P ? 19 : 17,
      color,
      [pos[0], pos[1] + 0.14, 0],
      false,
      width - 0.18
    );

    const b = txt(
      detail,
      P ? 16 : 14,
      C.ink,
      [pos[0], pos[1] - 0.17, 0],
      false,
      width - 0.18
    );

    return new M.VGroup(r, a, b);
  }

  function hiddenCause(mode = 'unknown') {
    const top = [
      CX,
      CY + 1.05,
      0
    ];

    const dx = P ? 1.60 : 1.42;

    const left = [
      CX - dx,
      CY - 1.05,
      0
    ];

    const right = [
      CX + dx,
      CY - 1.05,
      0
    ];

    const causeColor =
      mode === 'faulty'
        ? ORANGE
        : mode === 'sound'
          ? TEAL
          : C.violet;

    const causeText =
      mode === 'faulty'
        ? 'KNOWN: FAULTY'
        : mode === 'sound'
          ? 'KNOWN: SOUND'
          : 'FAULT STATUS';

    const detail =
      mode === 'unknown'
        ? 'Faulty or sound?'
        : 'Truth already known';

    const cause = diagramNode(
      top,
      P ? 2.85 : 2.60,
      0.82,
      causeText,
      detail,
      causeColor
    );

    const scannerDetail =
      mode === 'faulty'
        ? '90% beep rate'
        : mode === 'sound'
          ? '10% beep rate'
          : 'Beep or quiet';

    const scan1 = diagramNode(
      left,
      P ? 2.30 : 2.10,
      0.82,
      'SCANNER 1',
      scannerDetail,
      SCAN1
    );

    const scan2 = diagramNode(
      right,
      P ? 2.30 : 2.10,
      0.82,
      'SCANNER 2',
      scannerDetail,
      SCAN2
    );

    const a1 = arrow(
      [
        top[0] - 0.55,
        top[1] - 0.43,
        0
      ],
      [
        left[0],
        left[1] + 0.43,
        0
      ],
      causeColor
    );

    const a2 = arrow(
      [
        top[0] + 0.55,
        top[1] - 0.43,
        0
      ],
      [
        right[0],
        right[1] + 0.43,
        0
      ],
      causeColor
    );

    const note = tag(
      mode === 'unknown'
        ? 'ONE HIDDEN CAUSE'
        : 'INDEPENDENT GIVEN THE TRUTH',
      mode === 'unknown'
        ? C.violet
        : C.green,
      [
        CX,
        P ? CY - 2.15 : -2.68,
        0
      ],
      P ? 18 : 16,
      P ? 6.4 : 5.6
    );

    return {
      cause,
      scan1,
      scan2,
      a1,
      a2,
      note,
      top,
      left,
      right,

      all: [
        a1,
        a2,
        cause,
        scan1,
        scan2,
        note
      ]
    };
  }

  // ------------------------------------------------------------
  // 0–3: introduce two scanners.
  // ------------------------------------------------------------

  const original = originalGrid();

  await until(S(0));
  await play(
    ...picture(original.all, 1.25),
    ...focus(
      9 * PITCH + SIZE + 0.20,
      SIZE + 0.18,
      [
        CX,
        CY + 4.5 * PITCH,
        0
      ],
      ORANGE
    ),
    ...fbox([
      ['Factory A', C.cyan],
      ['10 faulty out of 100', ORANGE],
      ['Fault rate: 10%', C.amber]
    ]),
    ...say('FACTORY A: 10% FAULTY')
  );

  // 1: two identical scanners, working separately.

  const machines = scannerPair();

  await until(S(1));
  await play(
    ...clearMarks(),
    ...picture(machines.base, 1.25),
    ...fbox([
      ['Two identical scanners', C.cyan],
      'Each works on its own.',
      'Neither sees the other result.'
    ], C.violet),
    ...say('TWO SCANNERS WORKING SEPARATELY', C.violet)
  );

  // 2: the same part passes through both scanners.

  await until(S(2));
  await play(
    ...picture(machines.all, 0.75),
    ...fbox([
      ['First: scanner 1', SCAN1],
      ['Then: scanner 2', SCAN2],
      ['Same physical part', C.ink]
    ]),
    ...say('ONE PART, TWO CHECKS')
  );

  await play(
    new M.Transform(
      machines.part,
      square(
        machines.secondPos,
        C.muted,
        0.44
      ),
      {
        runTime: 1.10
      }
    )
  );

  // 3: does the first result change our prediction of the second?

  await until(S(3));
  await play(
    ...fbox([
      ['Given scanner 1 beeped,', SCAN1],
      ['how likely is a beep', WHITE],
      ['on scanner 2?', SCAN2]
    ], C.violet),
    ...say('DOES BEEP ONE CHANGE THE CHANCE OF BEEP TWO?', C.violet)
  );

  // ------------------------------------------------------------
  // 4–5: ten days of production.
  //
  // 1000 parts:
  // 100 faulty, 900 sound.
  // ------------------------------------------------------------

  const initialBig = makeBig(true);

  await until(S(4));
  await play(
    ...picture(initialBig.base, 1.45),
    ...fbox([
      ['10 days of work', C.ink],
      ['100 parts per day', C.cyan],
      ['= 1,000 parts', C.amber]
    ]),
    ...say('TEN DAYS: 1,000 PARTS')
  );

  await until(S(5));

  paintTruth(initialBig.view);

  await play(
    ...focus(
      BIG_TILE_W + 0.04,
      BIG_TILE_W + 0.04,
      bigTileCenter(0),
      ORANGE
    ),
    ...fbox([
      ['100 faulty parts: 10%', ORANGE],
      ['900 sound parts: 90%', TEAL],
      ['1,000 parts altogether', C.ink]
    ]),
    ...say('100 FAULTY + 900 SOUND')
  );

  // ------------------------------------------------------------
  // 6–10: condition on the faulty group.
  //
  // Scanner 1 beeped:
  // 81 of 90 also beep on scanner 2 = 90%.
  //
  // Scanner 1 quiet:
  // 9 of 10 beep on scanner 2 = 90%.
  // ------------------------------------------------------------

  const faultyView = makeFaultyView();

  // 6: keep only the 100 faulty parts.

  await until(S(6));
  await play(
    ...clearMarks(),
    ...picture(faultyView.base, 1.20),
    ...fbox([
      ['Known truth: faulty', ORANGE],
      ['Keep 100 parts', C.ink],
      ['Exclude the 900 sound parts', C.muted]
    ], ORANGE),
    ...say('FIRST: LOOK ONLY AT THE FAULTY PARTS', ORANGE)
  );

  // 7: scanner one beeps on 90, stays quiet on 10.

  await until(S(7));
  await play(
    ...picture(faultyView.scan1, 1.20),
    ...marks([
      faultyBeepOutline(),
      faultyQuietOutline()
    ]),
    ...fbox([
      ['Scanner 1', SCAN1],
      ['90 beep', WHITE],
      ['10 stay quiet', C.muted]
    ], SCAN1),
    ...say('SCANNER 1: 90 BEEP, 10 QUIET', SCAN1)
  );

  // 8: among the 90 first-scanner beeps, 81 also beep on S2.

  await until(S(8));
  await play(
    ...picture(faultyView.partial2, 1.25),
    ...marks([
      faultyBeepOutline(),
      faultyBothOutline()
    ]),
    ...fbox([
      ['Given faulty and S1 beep', ORANGE],
      ['81 of 90 also beep on S2', WHITE],
      ['81 ÷ 90 = 90%', C.amber]
    ], SCAN2),
    ...say('81 OUT OF 90 ALSO BEEP ON SCANNER 2', SCAN2)
  );

  // 9: among the 10 first-scanner quiet parts, nine beep on S2.

  await until(S(9));
  await play(
    ...picture(faultyView.all, 1.10),
    ...marks([
      faultyQuietOutline(SCAN2)
    ]),
    ...fbox([
      ['Given faulty and S1 quiet', ORANGE],
      ['9 of 10 beep on S2', WHITE],
      ['9 ÷ 10 = 90%', C.amber]
    ], SCAN2),
    ...say('9 OUT OF 10 BEEP ON SCANNER 2', SCAN2)
  );

  // 10: both conditional probabilities are exactly ninety percent.

  await until(S(10));
  await play(
    ...marks([
      faultyBeepOutline(C.green),
      faultyQuietOutline(C.green)
    ]),
    ...fbox([
      ['Inside the faulty group', ORANGE],
      ['S1 beeped: 81/90 = 90%', SCAN2],
      ['S1 quiet:   9/10 = 90%', SCAN2],
      ['Same chance', C.green]
    ], C.green),
    ...say('FAULTY GROUP: 90% = 90%', C.green)
  );

  // ------------------------------------------------------------
  // 11–15: condition on the sound group.
  //
  // Scanner 1 beeped:
  // 9 of 90 also beep on scanner 2 = 10%.
  //
  // Scanner 1 quiet:
  // 81 of 810 beep on scanner 2 = 10%.
  // ------------------------------------------------------------

  const soundView = makeSoundView();

  // 11: keep only the 900 sound parts.

  await until(S(11));
  await play(
    ...clearMarks(),
    ...picture(soundView.base, 1.15),
    ...fbox([
      ['Known truth: sound', TEAL],
      ['Keep 900 parts', C.ink],
      ['Exclude the 100 faulty parts', C.muted]
    ], TEAL),
    ...say('NOW LOOK ONLY AT THE SOUND PARTS', TEAL)
  );

  // 12: scanner one beeps for 90, stays quiet for 810.

  await until(S(12));
  await play(
    ...picture(soundView.scan1, 1.20),
    ...marks([
      soundBeepOutline(),
      soundQuietOutline()
    ]),
    ...fbox([
      ['Scanner 1', SCAN1],
      ['90 beep', WHITE],
      ['810 stay quiet', C.muted]
    ], SCAN1),
    ...say('SCANNER 1: 90 BEEP, 810 QUIET', SCAN1)
  );

  // 13: nine of the ninety S1 beeps also beep on S2.

  await until(S(13));
  await play(
    ...picture(soundView.partial2, 1.15),
    ...marks([
      soundBeepOutline(SCAN2)
    ]),
    ...fbox([
      ['Given sound and S1 beep', TEAL],
      ['9 of 90 also beep on S2', WHITE],
      ['9 ÷ 90 = 10%', C.amber]
    ], SCAN2),
    ...say('9 OUT OF 90 ALSO BEEP ON SCANNER 2', SCAN2)
  );

  // 14: eighty-one of the 810 quiet parts beep on S2.

  await until(S(14));
  await play(
    ...picture(soundView.all, 1.20),
    ...marks([
      soundQuietOutline(SCAN2)
    ]),
    ...fbox([
      ['Given sound and S1 quiet', TEAL],
      ['81 of 810 beep on S2', WHITE],
      ['81 ÷ 810 = 10%', C.amber]
    ], SCAN2),
    ...say('81 OUT OF 810 BEEP ON SCANNER 2', SCAN2)
  );

  // 15: both conditional probabilities are ten percent.

  await until(S(15));
  await play(
    ...marks([
      soundBeepOutline(C.green),
      soundQuietOutline(C.green)
    ]),
    ...fbox([
      ['Inside the sound group', TEAL],
      ['S1 beeped:  9/90 = 10%', SCAN2],
      ['S1 quiet: 81/810 = 10%', SCAN2],
      ['Same chance', C.green]
    ], C.green),
    ...say('SOUND GROUP: 10% = 10%', C.green)
  );

  // ------------------------------------------------------------
  // 16–17: recall independence.
  //
  // Scanner one's result does not change scanner two's chance
  // when we already know which fault-status group we are in.
  // ------------------------------------------------------------

  const withinGroups = conditionalComparison();

  await until(S(16));
  await play(
    ...clearMarks(),
    ...picture(withinGroups.all, 1.15),
    ...fbox([
      ['Remember independence', C.green],
      'Learning one thing',
      'does not change the',
      'chance of another.'
    ], C.green),
    ...say('INDEPENDENCE = CHANCE UNCHANGED', C.green)
  );

  await until(S(17));
  await play(
    pulse(
      [
        withinGroups.f1,
        withinGroups.f2,
        withinGroups.g1,
        withinGroups.g2
      ],
      C.green,
      1.60
    ),
    ...fbox([
      ['Given faulty: 90% = 90%', ORANGE],
      ['Given sound:  10% = 10%', TEAL],
      ['S1 tells us nothing new', C.green],
      ['inside either group', C.green]
    ], C.green),
    ...say('INSIDE EACH GROUP: INDEPENDENT', C.green)
  );

  // ------------------------------------------------------------
  // 18–21: mix the groups back together.
  //
  // Overall scanner-two beep rate:
  //
  // Faulty: 81 + 9 = 90.
  // Sound:   9 + 81 = 90.
  //
  // Total: 180 of 1000 = 18%.
  // ------------------------------------------------------------

  const mixed = makeBig(false);

  // 18: return to the entire population.

  await until(S(18));
  await play(
    ...picture(mixed.all, 1.35),
    ...fbox([
      ['All 1,000 parts again', C.ink],
      ['100 faulty', ORANGE],
      ['900 sound', TEAL]
    ]),
    ...say('MIX ALL 1,000 PARTS BACK TOGETHER')
  );

  // 19: ask for scanner two's overall beep rate.

  await until(S(19));
  await play(
    ...picture([
      ...mixed.frames,
      ...selectView(
        mixed.view,
        () => true,
        false,
        true
      ),
      mixed.heading,
      mixed.label
    ], 0.85),
    ...fbox([
      ['Ignore scanner 1 for now', C.muted],
      ['Count scanner 2 beeps', SCAN2],
      ['Out of all 1,000 parts']
    ], SCAN2),
    ...say('HOW OFTEN DOES SCANNER 2 BEEP OVERALL?', SCAN2)
  );

  // 20: count the second-scanner beeps in both truth groups.

  await until(S(20));
  await play(
    ...focus(
      BIG_TILE_W + 0.04,
      BIG_TILE_W + 0.04,
      bigTileCenter(0),
      ORANGE
    ),
    pulse(
      scanner2Groups(
        mixed.view,
        b => b.faulty
      ),
      ORANGE,
      1.30
    ),
    ...fbox([
      ['Scanner 2 on faulty parts', ORANGE],
      ['81 + 9', WHITE],
      ['= 90 beeps', ORANGE]
    ], ORANGE),
    ...say('FAULTY PARTS: 81 + 9 = 90 BEEPS', ORANGE)
  );

  await until(S(20) + 4.0);

  await play(
    ...clearMarks(),
    pulse(
      scanner2Groups(
        mixed.view,
        b => !b.faulty
      ),
      TEAL,
      1.35
    ),
    ...fbox([
      ['Scanner 2 on sound parts', TEAL],
      ['9 + 81', WHITE],
      ['= 90 beeps', TEAL]
    ], TEAL),
    ...say('SOUND PARTS: 9 + 81 = 90 BEEPS', TEAL)
  );

  // 21: all 180 second-scanner beeps out of the original thousand.

  await until(S(21));
  await play(
    ...fbox([
      ['90 faulty + 90 sound', C.ink],
      ['= 180 scanner-2 beeps', SCAN2],
      ['180 ÷ 1,000 = 18%', C.amber]
    ], C.amber),
    ...say('OVERALL SCANNER-2 BEEP RATE: 18%', C.amber)
  );

  // ------------------------------------------------------------
  // 22–25: condition on scanner one's beep.
  //
  // Keep only 180 parts:
  // 90 faulty and 90 sound.
  //
  // Of those:
  // 81 faulty parts also beep on scanner 2.
  // 9 sound parts also beep on scanner 2.
  //
  // Total = 90 of 180 = 50%.
  // ------------------------------------------------------------

  const retained = selectView(
    mixed.view,
    b => b.s1,
    true,
    true
  );

  const compactTarget = makeCompactBeeps();

  const compactLabels = compactBeepLabels(false);

  const compactCountLabels = compactBeepLabels(true);

  // 22: restore scanner one's results, then remove every part
  // that did not beep on scanner one.

  await until(S(22));
  await play(
    ...picture(mixed.all, 0.85),
    ...fbox([
      ['New known fact', C.violet],
      ['Scanner 1 beeped', SCAN1],
      ['Keep only the matching parts', WHITE]
    ], C.violet),
    ...say('NOW CONDITION ON SCANNER ONE BEEPING', C.violet)
  );

  await until(S(22) + 1.65);

  await play(
    ...picture(retained, 0.95),
    ...fbox([
      ['90 faulty S1 beeps', ORANGE],
      ['90 sound S1 beeps', TEAL],
      ['= 180 possible parts', WHITE]
    ], WHITE),
    ...say('KEEP 90 FAULTY + 90 SOUND', WHITE)
  );

  await play(
    gatherScanner1Beeps(
      mixed.view,
      compactTarget
    ),
    ...picture([
      ...retained,
      ...compactLabels
    ], 0.85)
  );

  // 23: count the second-scanner beeps inside the retained group.

  await until(S(23));
  await play(
    ...marks([
      compactFaultyBothOutline()
    ]),
    ...fbox([
      ['Among faulty S1 beeps', ORANGE],
      ['81 also beep on S2', WHITE]
    ], ORANGE),
    ...say('81 FAULTY PARTS BEEP TWICE', ORANGE)
  );

  await until(S(23) + 2.4);

  await play(
    ...picture([
      ...retained,
      ...compactCountLabels
    ], 0.85),
    ...marks([
      compactFaultyBothOutline(),
      compactSoundBothOutline()
    ]),
    ...fbox([
      ['81 faulty double beeps', ORANGE],
      ['9 sound double beeps', TEAL],
      ['81 + 9 = 90', C.amber]
    ], C.amber),
    ...say('PLUS 9 SOUND PARTS: 90 DOUBLE BEEPS', C.amber)
  );

  // 24: ninety out of one hundred and eighty is fifty percent.

  await until(S(24));
  await play(
    ...fbox([
      ['90 scanner-2 beeps', SCAN2],
      ['÷ 180 scanner-1 beeps', SCAN1],
      ['= 50%', C.amber]
    ], C.amber),
    ...say('90 OUT OF 180 = 50%', C.amber)
  );

  // 25: the first beep changes the second scanner's chance
  // when we do not know the underlying fault status.

  const overall = overallComparison();

  await until(S(25));
  await play(
    ...clearMarks(),
    ...picture(overall.all, 1.15),
    ...fbox([
      ['Overall S2 chance: 18%', C.muted],
      ['Given S1 beep:      50%', SCAN2],
      ['18% → 50%', C.amber]
    ], C.amber),
    ...say('OVERALL: THE FIRST BEEP CHANGES 18% TO 50%', C.amber)
  );

  // ------------------------------------------------------------
  // 26: the apparent contradiction.
  //
  // Dependent overall.
  // Independent inside each fault-status group.
  // ------------------------------------------------------------

  const contrast = conditionalComparison();

  await until(S(26));
  await play(
    ...fbox([
      ['Across all parts:', C.violet],
      ['18% → 50%: dependent', C.amber],
      ['Within each truth group:', C.ink],
      ['Independent', C.green]
    ], C.violet),
    ...say('DEPENDENT OVERALL, INDEPENDENT INSIDE', C.violet)
  );

  await until(S(26) + 2.7);

  await play(
    ...picture(contrast.all, 1.0),
    ...fbox([
      ['Faulty: 90% = 90%', ORANGE],
      ['Sound:  10% = 10%', TEAL],
      ['Both statements are true.', C.green]
    ], C.green),
    ...say('INSIDE EACH GROUP, THE CHANCE STAYS THE SAME', C.green)
  );

  // ------------------------------------------------------------
  // 27–29: explain the shared hidden cause.
  //
  // Both scanners respond to fault status.
  // Scanner 1 can tell us something about that hidden truth.
  // The hidden truth affects scanner 2's beep probability.
  //
  // Once the truth is known, scanner one adds no information
  // about scanner two.
  // ------------------------------------------------------------

  const causeUnknown = hiddenCause('unknown');

  // 27: reveal the common hidden cause.

  await until(S(27));
  await play(
    ...picture(causeUnknown.all, 1.20),
    ...fbox([
      ['Same hidden truth', C.violet],
      ['Is the part faulty?', ORANGE],
      'Both scanners respond',
      'to that truth.'
    ], C.violet),
    ...say('BOTH SCANNERS FOLLOW ONE HIDDEN TRUTH', C.violet)
  );

  // 28: a beep on scanner one is evidence about fault status.
  // Fault status changes scanner two's chance of beeping.

  await until(S(28));
  await play(
    new M.Indicate(
      causeUnknown.scan1,
      { color: SCAN1 }
    ),
    new M.Indicate(
      causeUnknown.cause,
      { color: ORANGE }
    ),
    ...fbox([
      ['Scanner 1 beep', SCAN1],
      ['Hints that the part is faulty', ORANGE],
      ['Faulty parts often beep on S2', SCAN2]
    ], C.violet),
    ...say('THE FIRST BEEP IS A HINT ABOUT THE TRUTH', C.violet)
  );

  await until(S(28) + 2.6);

  await play(
    new M.Indicate(
      causeUnknown.a2,
      { color: C.amber }
    ),
    new M.Indicate(
      causeUnknown.scan2,
      { color: SCAN2 }
    ),
    ...fbox([
      ['Given faulty: 90% S2 beep', ORANGE],
      ['Given sound: 10% S2 beep', TEAL],
      'The hidden truth matters.'
    ], C.amber)
  );

  // 29: when the fault status is known, the hint is unnecessary.

  const causeKnownFaulty = hiddenCause('faulty');

  await until(S(29));
  await play(
    ...picture(causeKnownFaulty.all, 1.10),
    ...fbox([
      ['We already know: faulty', ORANGE],
      ['S2 chance is 90%', SCAN2],
      ['Whatever scanner 1 did', C.green]
    ], C.green),
    ...say('ONCE WE KNOW THE TRUTH, WE DO NOT NEED THE HINT', C.green)
  );

  // ------------------------------------------------------------
  // 30–32: name conditional independence.
  // ------------------------------------------------------------

  // 30: two things become independent when a third thing is known.

  await until(S(30));
  await play(
    ...fbox([
      ['Conditional independence', C.green],
      'Two things are independent',
      'once we know',
      ['a third thing.', C.violet]
    ], C.green),
    ...say('THIS IS CONDITIONAL INDEPENDENCE', C.green)
  );

  // 31: the scans are independent given the fault status.

  const causeKnownSound = hiddenCause('sound');

  await until(S(31));
  await play(
    ...picture(causeKnownSound.all, 1.10),
    ...fbox([
      ['Given the fault status', C.violet],
      ['Scanner 1 and scanner 2', WHITE],
      ['are independent.', C.green]
    ], C.green),
    ...say('THE SCANS ARE INDEPENDENT GIVEN FAULT STATUS', C.green)
  );

  // 32: clarify the meaning of fault status.

  const statusFaulty = square(
    [CX - 1.35, CY + 0.18, 0],
    ORANGE,
    0.82
  );

  const statusSound = square(
    [CX + 1.35, CY + 0.18, 0],
    TEAL,
    0.82
  );

  const statusFaultyText = txt(
    'FAULTY',
    P ? 21 : 19,
    ORANGE,
    [CX - 1.35, CY - 0.63, 0]
  );

  const statusSoundText = txt(
    'SOUND',
    P ? 21 : 19,
    TEAL,
    [CX + 1.35, CY - 0.63, 0]
  );

  const statusOr = txt(
    'OR',
    P ? 19 : 17,
    C.muted,
    [CX, CY + 0.18, 0]
  );

  const statusHeading = tag(
    'FAULT STATUS',
    C.violet,
    [CX, CY + 1.30, 0],
    P ? 19 : 17
  );

  await until(S(32));
  await play(
    ...picture([
      statusFaulty,
      statusSound,
      statusFaultyText,
      statusSoundText,
      statusOr,
      statusHeading
    ], 1.0),
    ...fbox([
      ['Fault status means:', C.violet],
      ['Faulty', ORANGE],
      ['or sound', TEAL]
    ], C.violet),
    ...say('FAULT STATUS = FAULTY OR SOUND', C.violet)
  );

  // ------------------------------------------------------------
  // 33–37: the multiplication rule inside a known group.
  //
  // Given faulty:
  //
  // Chance of both beeps =
  // chance of beep 1 given faulty
  // × chance of beep 2 given faulty.
  //
  // 90% × 90% = 81%.
  //
  // Actual count: 81 of 100 faulty parts beep twice.
  //
  // The multiplication works because the two scans are
  // independent once we condition on the fault status.
  // ------------------------------------------------------------

  const formulaFaulty = makeFaultyView();

  // 33: return to one known group.

  await until(S(33));
  await play(
    ...picture(formulaFaulty.all, 1.20),
    ...clearBox(),
    ...say('THE RULE IN ONE LINE, INSIDE ONE GROUP')
  );

  // 34: the chance of both beeps is a product.

  await until(S(34));
  await play(
    ...marks([
      faultyBothOutline()
    ]),
    ...fbox([
      ['Given faulty:', ORANGE],
      ['Chance of both beeps', WHITE],
      ['= two chances multiplied', C.green]
    ], C.green),
    ...say('INSIDE THE GROUP, MULTIPLY THE TWO CHANCES', C.green)
  );

  // 35: specify the two conditional probabilities.

  await until(S(35));
  await play(
    ...fbox([
      ['Chance of both beeps', WHITE],
      ['given faulty =', ORANGE],
      ['chance of S1 beep given faulty', SCAN1],
      ['× chance of S2 beep given faulty', SCAN2]
    ], C.cyan),
    ...say('S1 GIVEN FAULTY × S2 GIVEN FAULTY')
  );

  // 36: use the factory's numbers.

  await until(S(36));
  await play(
    ...fbox([
      ['Given faulty', ORANGE],
      ['Scanner 1: 90%', SCAN1],
      ['Scanner 2: 90%', SCAN2],
      ['90% × 90% = 81%', C.amber]
    ], C.amber),
    ...say('90% × 90% = 81%', C.amber)
  );

  await until(S(36) + 4.3);

  await play(
    ...marks([
      faultyBothOutline()
    ]),
    pulse(
      squareGroups(
        formulaFaulty.view,
        b => b.s1 && b.s2
      ),
      C.amber,
      1.30
    ),
    ...fbox([
      ['81 double-beeping parts', WHITE],
      ['100 faulty parts altogether', ORANGE],
      ['81 ÷ 100 = 81%', C.amber],
      ['It matches', C.green]
    ], C.green),
    ...say('CHECK: 81 OF 100 BEEP TWICE', C.green)
  );

  // 37: once the group is known, use the independent product.

  await until(S(37));
  await play(
    ...fbox([
      ['First: know the group', ORANGE],
      ['Then multiply the chances', C.green],
      ['90% × 90% = 81%', C.amber]
    ], C.green),
    ...say('KNOW THE GROUP, THEN MULTIPLY', C.green)
  );

  // ------------------------------------------------------------
  // 38–39: everyday comparison.
  //
  // Two friends both carry umbrellas.
  // They did not copy each other.
  // Both responded to the same rain clouds.
  //
  // A shared cause can make two outcomes move together.
  // ------------------------------------------------------------

  function umbrella(pos, color) {
    const x = pos[0];
    const y = pos[1];

    const canopy = new M.Arc({
      radius: 0.66,
      startAngle: 0,
      angle: Math.PI,
      color,
      strokeWidth: 3
    });

    canopy.setFill(color, 0.88);
    canopy.moveTo([
      x,
      y + 0.35,
      0
    ]);

    const base = line(
      [x - 0.66, y + 0.02, 0],
      [x + 0.66, y + 0.02, 0],
      color,
      2.5
    );

    const shaft = line(
      [x, y + 0.02, 0],
      [x, y - 0.65, 0],
      C.ink,
      3
    );

    const handle = new M.Arc({
      radius: 0.15,
      startAngle: Math.PI,
      angle: Math.PI,
      color: C.ink,
      strokeWidth: 3
    });

    handle.moveTo([
      x + 0.15,
      y - 0.65,
      0
    ]);

    return new M.VGroup(
      canopy,
      base,
      shaft,
      handle
    );
  }

  function rainCloud(pos) {
    const x = pos[0];
    const y = pos[1];

    const circles = [
      [-0.40, 0.00, 0.34],
      [0.00, 0.20, 0.44],
      [0.43, 0.02, 0.34]
    ].map(([dx, dy, radius]) => {
      const c = new M.Circle({
        radius,
        color: C.muted,
        strokeWidth: 1.8
      });

      c.setFill(C.muted, 0.94);

      c.moveTo([
        x + dx,
        y + dy,
        0
      ]);

      return c;
    });

    const base = rect(
      1.25,
      0.30,
      [
        x,
        y - 0.15,
        0
      ],
      C.muted,
      0.95,
      1
    );

    const rain = Array.from(
      { length: 5 },
      (_, k) => {
        const dx = (k - 2) * 0.23;

        return line(
          [
            x + dx + 0.07,
            y - 0.42,
            0
          ],
          [
            x + dx - 0.08,
            y - 0.77,
            0
          ],
          C.cyan,
          2.7
        );
      }
    );

    return new M.VGroup(
      ...circles,
      base,
      ...rain
    );
  }

  const U_DX = P ? 1.60 : 1.45;

  const U_Y = CY - 0.75;

  const uLeft = umbrella(
    [CX - U_DX, U_Y, 0],
    SCAN1
  );

  const uRight = umbrella(
    [CX + U_DX, U_Y, 0],
    SCAN2
  );

  const friend1 = txt(
    'FRIEND 1',
    P ? 18 : 16,
    SCAN1,
    [
      CX - U_DX,
      U_Y - 1.05,
      0
    ]
  );

  const friend2 = txt(
    'FRIEND 2',
    P ? 18 : 16,
    SCAN2,
    [
      CX + U_DX,
      U_Y - 1.05,
      0
    ]
  );

  const rain = rainCloud(
    [
      CX,
      CY + 1.05,
      0
    ]
  );

  const rainLabel = txt(
    'SAME RAIN CLOUDS',
    P ? 18 : 16,
    C.cyan,
    [
      CX,
      CY + 1.88,
      0
    ]
  );

  const rainArrow1 = arrow(
    [
      CX - 0.57,
      CY + 0.60,
      0
    ],
    [
      CX - U_DX,
      U_Y + 0.84,
      0
    ],
    C.cyan
  );

  const rainArrow2 = arrow(
    [
      CX + 0.57,
      CY + 0.60,
      0
    ],
    [
      CX + U_DX,
      U_Y + 0.84,
      0
    ],
    C.cyan
  );

  const umbrellas = [
    uLeft,
    uRight,
    friend1,
    friend2
  ];

  const rainPicture = [
    rainArrow1,
    rainArrow2,
    rain,
    rainLabel,
    ...umbrellas
  ];

  // 38: both friends carry umbrellas.

  await until(S(38));
  await play(
    ...clearMarks(),
    ...picture(umbrellas, 1.20),
    ...fbox([
      ['Everyday example', C.violet],
      'Two friends both carry',
      'umbrellas on the same day.'
    ], C.violet),
    ...say('TWO FRIENDS, TWO UMBRELLAS', C.violet)
  );

  // 39: both respond to the same rain clouds.

  await until(S(39));
  await play(
    ...picture(rainPicture, 1.20),
    ...fbox([
      ['They did not copy each other.', C.ink],
      ['They saw the same clouds.', C.cyan],
      ['One shared cause', C.violet]
    ], C.violet),
    ...say('SAME RAIN, NOT COPYING EACH OTHER', C.violet)
  );

  // ------------------------------------------------------------
  // 40–41: applications.
  //
  // Conditional independence simplifies combining clues.
  //
  // Example: a junk-mail filter.
  // Given the email category, a simple probabilistic filter
  // can model words as independent clues.
  //
  // This is a modeling assumption, not a claim that real
  // email words are always conditionally independent.
  // ------------------------------------------------------------

  function emailCluePicture() {
    const y = CY + 0.70;

    const width = P ? 5.65 : 5.0;

    const envelope = new M.RoundedRectangle({
      width,
      height: 1.65,
      cornerRadius: 0.16,
      color: C.cyan,
      strokeWidth: 2.2
    });

    envelope.setFill(C.card, 0.97);

    envelope.moveTo([
      CX,
      y,
      0
    ]);

    const mailHeading = txt(
      'EMAIL',
      P ? 19 : 17,
      C.cyan,
      [CX, y + 0.50, 0]
    );

    const wordLabels = [
      'offer',
      'meeting',
      'free',
      'today'
    ];

    const wordColors = [
      C.violet,
      C.cyan,
      C.violet,
      C.cyan
    ];

    const wordPositions = [
      [-1.20, 0.02],
      [1.20, 0.02],
      [-1.20, -0.46],
      [1.20, -0.46]
    ];

    const words = wordLabels.map((s, k) =>
      tag(
        s,
        wordColors[k],
        [
          CX + wordPositions[k][0],
          y + wordPositions[k][1],
          0
        ],
        P ? 16 : 15,
        1.90
      )
    );

    const left = [
      CX - 1.45,
      CY - 1.25,
      0
    ];

    const right = [
      CX + 1.45,
      CY - 1.25,
      0
    ];

    const junk = diagramNode(
      left,
      P ? 2.35 : 2.15,
      0.76,
      'JUNK',
      'Word chances',
      C.violet
    );

    const notJunk = diagramNode(
      right,
      P ? 2.35 : 2.15,
      0.76,
      'NOT JUNK',
      'Word chances',
      C.cyan
    );

    const leftArrow = arrow(
      [
        CX - 0.75,
        y - 0.85,
        0
      ],
      [
        left[0],
        left[1] + 0.41,
        0
      ],
      C.violet
    );

    const rightArrow = arrow(
      [
        CX + 0.75,
        y - 0.85,
        0
      ],
      [
        right[0],
        right[1] + 0.41,
        0
      ],
      C.cyan
    );

    const modelTag = tag(
      'MODEL WORDS AS SEPARATE CLUES',
      C.green,
      [
        CX,
        P ? CY - 2.25 : -2.72,
        0
      ],
      P ? 17 : 15,
      P ? 6.5 : 5.6
    );

    return {
      envelope,
      mailHeading,
      words,
      junk,
      notJunk,
      leftArrow,
      rightArrow,
      modelTag,

      base: [
        envelope,
        mailHeading,
        ...words
      ],

      all: [
        leftArrow,
        rightArrow,
        envelope,
        mailHeading,
        ...words,
        junk,
        notJunk,
        modelTag
      ]
    };
  }

  // 40: the method makes several-clue calculations simpler.

  await until(S(40));
  await play(
    ...fbox([
      ['Combine several clues', C.green],
      'Inside a known group,',
      'independent clue chances',
      'can be multiplied.'
    ], C.green),
    ...say('COMBINE SEVERAL CLUES MORE SIMPLY', C.green)
  );

  // 41: an example from junk-mail filtering.

  const email = emailCluePicture();

  await until(S(41));
  await play(
    ...picture(email.base, 1.20),
    ...fbox([
      ['Example: junk-mail filters', C.violet],
      ['Words are clues', C.cyan],
      'Is this email junk?'
    ], C.violet),
    ...say('AN EMAIL CONTAINS MANY WORD CLUES', C.violet)
  );

  await until(S(41) + 3.3);

  await play(
    ...picture(email.all, 1.15),
    ...fbox([
      ['Two possible groups:', C.ink],
      ['Junk mail', C.violet],
      ['Not junk mail', C.cyan],
      'Word rates differ by group.'
    ]),
    ...say('CONSIDER THE WORDS INSIDE EACH GROUP')
  );

  await until(S(41) + 6.6);

  await play(
    pulse(
      email.words,
      C.green,
      1.40
    ),
    ...fbox([
      ['A simplifying assumption:', C.green],
      'Inside each email category,',
      'treat words as',
      'independent clues.'
    ], C.green),
    ...say('ASSUME INDEPENDENT CLUES GIVEN THE GROUP', C.green)
  );

  // ------------------------------------------------------------
  // 42–43: common trap.
  //
  // Two things moving together does not establish that one
  // directly causes the other.
  //
  // They may share an underlying cause.
  // ------------------------------------------------------------

  const trapCause = hiddenCause('unknown');

  const directA = [
    CX - 0.28,
    CY - 1.05,
    0
  ];

  const directB = [
    CX + 0.28,
    CY - 1.05,
    0
  ];

  const misleadingLink = new M.DashedLine({
    start: directA,
    end: directB,
    color: C.amber
  });

  const noDirectLink = new M.VGroup(
    line(
      [
        CX - 0.15,
        CY - 1.22,
        0
      ],
      [
        CX + 0.15,
        CY - 0.88,
        0
      ],
      C.amber,
      3.5
    ),

    line(
      [
        CX - 0.15,
        CY - 0.88,
        0
      ],
      [
        CX + 0.15,
        CY - 1.22,
        0
      ],
      C.amber,
      3.5
    )
  );

  // 42: a statistical relationship need not be a direct link.

  await until(S(42));
  await play(
    ...picture([
      trapCause.scan1,
      trapCause.scan2,
      misleadingLink,
      noDirectLink
    ], 1.15),
    ...fbox([
      ['Common trap', C.amber],
      'Two things move together.',
      'That does not prove',
      ['a direct connection.', C.amber]
    ], C.amber),
    ...say('MOVING TOGETHER DOES NOT PROVE A DIRECT LINK', C.amber)
  );

  // 43: reveal the shared cause instead.

  await until(S(43));
  await play(
    ...picture(trapCause.all, 1.15),
    ...fbox([
      ['One shared cause', C.violet],
      ['Fault status → both scans', ORANGE],
      ['Rain → both umbrellas', C.cyan]
    ], C.violet),
    ...say('THEY MAY SHARE A HIDDEN CAUSE', C.violet)
  );

  // ------------------------------------------------------------
  // 44: preview the next chapter.
  //
  // Outcomes can be represented numerically.
  // For example, quiet = 0 and beep = 1.
  //
  // Do not introduce the next chapter's calculations yet.
  // ------------------------------------------------------------

  function numericOutcome(
    x,
    beep,
    value
  ) {
    const pos = [
      x,
      CY + 0.55,
      0
    ];

    const sq = square(
      pos,
      C.muted,
      0.60
    );

    const items = [sq];

    if (beep) {
      items.push(
        ring(pos, 0.44, 2.4)
      );
    }

    const outcomeText = txt(
      beep ? 'BEEP' : 'QUIET',
      P ? 18 : 16,
      beep ? WHITE : C.muted,
      [x, CY - 0.20, 0]
    );

    const downward = txt(
      '↓',
      P ? 25 : 23,
      C.cyan,
      [x, CY - 0.65, 0]
    );

    const number = tag(
      String(value),
      C.amber,
      [x, CY - 1.18, 0],
      P ? 26 : 23
    );

    items.push(
      outcomeText,
      downward,
      number
    );

    return new M.VGroup(...items);
  }

  const numericQuiet = numericOutcome(
    CX - 1.30,
    false,
    0
  );

  const numericBeep = numericOutcome(
    CX + 1.30,
    true,
    1
  );

  const numericTitle = txt(
    'OUTCOMES AS NUMBERS',
    P ? 19 : 17,
    C.cyan,
    [
      CX,
      CY + 1.52,
      0
    ]
  );

  await until(S(44));
  await play(
    ...picture([
      numericQuiet,
      numericBeep,
      numericTitle
    ], 1.15),
    ...fbox([
      ['Next chapter', C.violet],
      ['Turn outcomes into numbers', C.cyan],
      ['Then average those numbers', C.amber]
    ], C.violet),
    ...say('NEXT: OUTCOMES AS NUMBERS WE CAN AVERAGE', C.violet)
  );

  // ------------------------------------------------------------
  // 45: final takeaway.
  //
  // First show dependence across all parts.
  //
  // Then show independence within each truth group.
  //
  // Finish with the shared hidden cause.
  // ------------------------------------------------------------

  const finalOverall = overallComparison();

  const finalConditional = conditionalComparison();

  const finalCause = hiddenCause('unknown');

  await until(S(45));
  await play(
    ...picture(finalOverall.all, 1.05),
    ...fbox([
      ['Across all parts', C.violet],
      ['18% → 50%', C.amber],
      ['The scans are dependent.', C.violet]
    ], C.violet),
    ...say('DEPENDENT OVERALL', C.violet)
  );

  await until(S(45) + 2.1);

  await play(
    ...picture(finalConditional.all, 1.10),
    ...fbox([
      ['Given faulty: 90% = 90%', ORANGE],
      ['Given sound:  10% = 10%', TEAL],
      ['Independent within each group', C.green]
    ], C.green),
    ...say('INDEPENDENT ONCE THE GROUP IS KNOWN', C.green)
  );

  await until(S(45) + 4.4);

  await play(
    ...picture(finalCause.all, 1.10),
    ...fbox([
      ['Conditional independence', C.green],
      'Two clues can be dependent',
      'overall, yet independent',
      ['given their shared cause.', C.violet]
    ], C.green),
    ...say('KNOW THE SHARED CAUSE: THE CLUES BECOME INDEPENDENT HERE', C.green)
  );

  await until(E(45));
}
