// lesson 4.2.6
// Base rates: why the same scanner can mean something different.
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
  const CY = P ? -1.40 : -0.68;

  const PITCH = P ? 0.55 : 0.39;
  const SIZE = P ? 0.34 : 0.24;
  const RADIUS = P ? 0.25 : 0.18;

  const PILL = P ? [0, 2.05, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.25, -0.30, 0];

  const ORANGE = '#FF9D45';
  const TEAL = '#29D6C5';
  const WHITE = '#FFFFFF';

  const FACTORY_A = C.cyan;
  const FACTORY_B = C.violet;

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
      cornerRadius: 0.12,
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

  function square(pos, color, size = SIZE, strokeWidth = 2) {
    return rect(
      size,
      size,
      pos,
      color,
      0.84,
      strokeWidth
    );
  }

  function ring(pos, radius = RADIUS, strokeWidth = 2.4) {
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
    const maxh = P ? 2.1 : 3.2;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) g.scale(scale);

    g.moveTo(BOXP);

    const a = [new M.FadeIn(g)];

    if (boxNow) a.push(new M.FadeOut(boxNow));

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
  // Only entering or departing objects receive fades.
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
  // Factory A, 100 parts:
  //
  //                 Beep    No beep    Total
  // Faulty            9        1         10
  // Sound             9       81         90
  // Total            18       82        100
  //
  // Factory B, 1000 parts:
  //
  //                 Beep    No beep    Total
  // Faulty            9        1         10
  // Sound            99      891        990
  // Total           108      892       1000
  //
  // Scanner habits are identical in both factories:
  // 90% of faulty parts beep.
  // 10% of sound parts beep.
  //
  // Factory A:
  // Base rate = 10%.
  // Predictive value = 9/18 = 50%.
  //
  // Factory B:
  // Base rate = 1%.
  // Predictive value = 9/108 = 1/12, about 8%.
  // ------------------------------------------------------------

  const DATA_A = Array.from({ length: 100 }, (_, i) => {
    const r = Math.floor(i / 10);
    const c = i % 10;

    const faulty = r === 0;

    const beep = faulty
      ? c < 9
      : c === (3 * r + 1) % 10;

    return {
      i,
      r,
      c,
      faulty,
      beep
    };
  });

  // Factory B's 100-part illustration establishes the base rate.
  // No scanner outcomes are assigned to this smaller picture:
  // one faulty part cannot represent a 90% beep rate exactly.

  const DATA_B100 = Array.from(
    { length: 100 },
    (_, i) => ({
      i,
      r: Math.floor(i / 10),
      c: i % 10,
      faulty: i === 0,
      beep: false
    })
  );

  const truthColor = d => d.faulty ? ORANGE : TEAL;

  function makeGrid100(
    data,
    center = [CX, CY, 0],
    pitch = PITCH,
    size = SIZE,
    radius = RADIUS
  ) {
    const parts = data.map(d => {
      const pos = [
        center[0] + (d.c - 4.5) * pitch,
        center[1] + (4.5 - d.r) * pitch,
        0
      ];

      return {
        ...d,
        pos,
        sq: square(pos, truthColor(d), size),
        ring: d.beep ? ring(pos, radius) : null
      };
    });

    return {
      parts,
      center,
      pitch,
      size,
      radius,

      faulty: parts.filter(d => d.faulty),

      sound: parts.filter(d => !d.faulty),

      beeping: parts.filter(d => d.beep),

      squares: parts.map(d => d.sq),

      all: parts.flatMap(d =>
        d.ring ? [d.sq, d.ring] : [d.sq]
      )
    };
  }

  const squares = parts => parts.map(d => d.sq);

  const rings = parts =>
    parts.filter(d => d.beep).map(d => d.ring);

  const objects = parts =>
    parts.flatMap(d =>
      d.ring ? [d.sq, d.ring] : [d.sq]
    );

  const GRID_W =
    9 * PITCH + 2 * RADIUS + 0.20;

  const GRID_H =
    9 * PITCH + 2 * RADIUS + 0.16;

  const TOP_Y =
    CY + 4.5 * PITCH;

  const ROW_H =
    2 * RADIUS + 0.16;

  // ------------------------------------------------------------
  // Factory A's eighteen beeping parts.
  //
  // Two equal rows:
  // nine orange squares and nine teal squares.
  // All eighteen squares have white rings.
  // ------------------------------------------------------------

  const A_SP = P ? 0.61 : 0.47;
  const A_DY = P ? 0.58 : 0.47;

  function makeACompact() {
    const parts = [];

    for (let row = 0; row < 2; row++) {
      const faulty = row === 0;

      for (let k = 0; k < 9; k++) {
        const pos = [
          CX + (k - 4) * A_SP,
          CY + (faulty ? A_DY : -A_DY),
          0
        ];

        parts.push({
          faulty,
          beep: true,
          pos,
          sq: square(
            pos,
            faulty ? ORANGE : TEAL
          ),
          ring: ring(pos)
        });
      }
    }

    const top = txt(
      '9 TRUE ALARMS',
      P ? 18 : 16,
      ORANGE,
      [
        CX,
        CY + A_DY + RADIUS + 0.36,
        0
      ]
    );

    const bottom = txt(
      '9 FALSE ALARMS',
      P ? 18 : 16,
      TEAL,
      [
        CX,
        CY - A_DY - RADIUS - 0.36,
        0
      ]
    );

    const label = tag(
      'FACTORY A: 50%',
      FACTORY_A,
      [CX, CY - 1.85, 0],
      P ? 21 : 19
    );

    return {
      parts,
      top,
      bottom,
      label,

      all: [
        ...objects(parts),
        top,
        bottom,
        label
      ]
    };
  }

  // ------------------------------------------------------------
  // Scanner illustration.
  //
  // Identical scanners are drawn with identical geometry.
  // Their color does not encode accuracy or performance.
  // ------------------------------------------------------------

  function scanner(pos, scale = 1) {
    const x = pos[0];
    const y = pos[1];

    const p = (dx, dy) => [
      x + dx * scale,
      y + dy * scale,
      0
    ];

    const shell = new M.RoundedRectangle({
      width: 1.65 * scale,
      height: 1.80 * scale,
      cornerRadius: 0.16 * scale,
      color: C.cyan,
      strokeWidth: 2.4
    });

    shell.setFill(C.card, 0.96);
    shell.moveTo(p(0, 0.20));

    const head = rect(
      1.08 * scale,
      0.19 * scale,
      p(0, 0.79),
      C.cyan,
      0.90,
      1.5
    );

    const belt = new M.RoundedRectangle({
      width: 2.35 * scale,
      height: 0.32 * scale,
      cornerRadius: 0.11 * scale,
      color: C.muted,
      strokeWidth: 1.8
    });

    belt.setFill(C.card, 0.92);
    belt.moveTo(p(0, -0.72));

    const rollers = Array.from(
      { length: 5 },
      (_, k) => {
        const c = new M.Circle({
          radius: 0.075 * scale,
          color: C.muted,
          strokeWidth: 1.2
        });

        c.setFill(C.muted, 0.30);

        c.moveTo(
          p((k - 2) * 0.40, -0.72)
        );

        return c;
      }
    );

    const part = square(
      p(0, -0.24),
      C.muted,
      0.42 * scale
    );

    const beam = line(
      p(0, 0.67),
      p(0, 0.02),
      C.cyan,
      2.5
    );

    const beepRing = ring(
      p(0, -0.24),
      0.31 * scale
    );

    const lamp = new M.Circle({
      radius: 0.075 * scale,
      color: C.green,
      strokeWidth: 1
    });

    lamp.setFill(C.green, 0.95);
    lamp.moveTo(p(0.61, 0.94));

    return new M.VGroup(
      shell,
      belt,
      ...rollers,
      head,
      beam,
      part,
      beepRing,
      lamp
    );
  }

  function identicalScanners() {
    const dx = P ? 1.72 : 1.48;
    const scale = P ? 1.0 : 0.93;

    const left = scanner(
      [CX - dx, CY, 0],
      scale
    );

    const right = scanner(
      [CX + dx, CY, 0],
      scale
    );

    const leftLabel = tag(
      'FACTORY A',
      FACTORY_A,
      [CX - dx, CY + 1.52, 0],
      P ? 19 : 17
    );

    const rightLabel = tag(
      'FACTORY B',
      FACTORY_B,
      [CX + dx, CY + 1.52, 0],
      P ? 19 : 17
    );

    const equals = txt(
      '=',
      P ? 28 : 25,
      C.green,
      [CX, CY + 0.18, 0],
      true
    );

    const same = tag(
      'IDENTICAL SCANNERS',
      C.green,
      [CX, CY - 1.45, 0],
      P ? 19 : 17
    );

    return [
      left,
      right,
      leftLabel,
      rightLabel,
      equals,
      same
    ];
  }

  // ------------------------------------------------------------
  // The scanner's fixed habits.
  //
  // Ten orange squares: nine ringed.
  // Ten teal squares: one ringed.
  //
  // These normalized strips represent the scanner's rates,
  // not a new factory batch.
  // ------------------------------------------------------------

  function makeHabits() {
    const sp = P ? 0.57 : 0.43;
    const size = P ? 0.34 : 0.25;
    const rr = P ? 0.25 : 0.19;

    const W = 9 * sp + 2 * rr + 0.20;

    const topY = CY + (P ? 1.15 : 0.96);
    const bottomY = CY - (P ? 1.15 : 1.00);

    function strip(faulty, y) {
      const color = faulty ? ORANGE : TEAL;

      const parts = Array.from(
        { length: 10 },
        (_, k) => {
          const pos = [
            CX + (k - 4.5) * sp,
            y,
            0
          ];

          const beep = faulty
            ? k < 9
            : k === 0;

          return {
            beep,
            sq: square(pos, color, size),
            ring: beep ? ring(pos, rr) : null
          };
        }
      );

      const label = txt(
        faulty
          ? 'GIVEN FAULTY'
          : 'GIVEN SOUND',
        P ? 18 : 16,
        color,
        [CX, y + 0.52, 0]
      );

      const rate = tag(
        faulty
          ? '9 BEEPS IN 10: 90%'
          : '1 BEEP IN 10: 10%',
        WHITE,
        [CX, y - 0.55, 0],
        P ? 18 : 16,
        W
      );

      return {
        parts,
        label,
        rate,

        all: [
          ...objects(parts),
          label,
          rate
        ]
      };
    }

    const faulty = strip(true, topY);
    const sound = strip(false, bottomY);

    return {
      faulty,
      sound,

      all: [
        ...faulty.all,
        ...sound.all
      ]
    };
  }

  // ------------------------------------------------------------
  // Factory B: one thousand individual parts.
  //
  // Draw ten separate 10-by-10 grids.
  // Each small grid contains exactly 100 individual squares.
  //
  // Laptop: 5 blocks across, 2 blocks down.
  // Phone: 2 blocks across, 5 blocks down.
  //
  // To keep browser rendering manageable, quiet parts are
  // pre-grouped into batches before being added to the scene.
  // Beeping parts are pre-grouped in groups of nine, allowing
  // the later transformation to twelve equal columns.
  //
  // No already-visible objects are regrouped.
  // ------------------------------------------------------------

  const BIG_COLS = P ? 2 : 5;
  const BIG_ROWS = 10 / BIG_COLS;

  const BIG_PITCH = P ? 0.115 : 0.108;
  const BIG_SIZE = P ? 0.065 : 0.061;
  const BIG_RING = P ? 0.049 : 0.046;

  const BIG_BLOCK_W = 10 * BIG_PITCH + 0.11;

  const BIG_STEP_X = P ? 2.00 : 1.28;
  const BIG_STEP_Y = P ? 1.25 : 1.47;

  const BIG_CY = P ? -1.60 : -0.55;

  const BIG_W =
    (BIG_COLS - 1) * BIG_STEP_X +
    BIG_BLOCK_W;

  const BIG_H =
    (BIG_ROWS - 1) * BIG_STEP_Y +
    BIG_BLOCK_W;

  function tileCenter(k) {
    const row = Math.floor(k / BIG_COLS);
    const col = k % BIG_COLS;

    return [
      CX +
        (col - (BIG_COLS - 1) / 2) * BIG_STEP_X,

      BIG_CY +
        ((BIG_ROWS - 1) / 2 - row) * BIG_STEP_Y,

      0
    ];
  }

  const DATA_B = Array.from({ length: 1000 }, (_, i) => {
    const tile = Math.floor(i / 100);
    const local = i % 100;

    const r = Math.floor(local / 10);
    const c = local % 10;

    // The first tile contains all ten faulty parts.
    // Exactly nine of those faulty parts beep.

    const faulty = tile === 0 && r === 0;

    let beep;

    if (faulty) {
      beep = c < 9;
    } else {
      // First tile: nine sound beeps.
      // Remaining nine tiles: ten sound beeps each.
      //
      // Sound beeps = 9 + 9 × 10 = 99.

      beep = c === (3 * r + 1) % 10;
    }

    const center = tileCenter(tile);

    const pos = [
      center[0] + (c - 4.5) * BIG_PITCH,
      center[1] + (4.5 - r) * BIG_PITCH,
      0
    ];

    return {
      i,
      tile,
      r,
      c,
      faulty,
      beep,
      pos
    };
  });

  const B_FAULTY = DATA_B.filter(
    d => d.faulty
  );

  const B_SOUND = DATA_B.filter(
    d => !d.faulty
  );

  const B_TRUE_ALARMS = DATA_B.filter(
    d => d.faulty && d.beep
  );

  const B_FALSE_ALARMS = DATA_B.filter(
    d => !d.faulty && d.beep
  );

  const B_QUIET = DATA_B.filter(
    d => !d.beep
  );

  // Verify the fixed shared chapter counts.

  if (
    DATA_B.length !== 1000 ||
    B_FAULTY.length !== 10 ||
    B_SOUND.length !== 990 ||
    B_TRUE_ALARMS.length !== 9 ||
    B_FALSE_ALARMS.length !== 99 ||
    B_QUIET.length !== 892
  ) {
    throw new Error(
      'Lesson 4.2.6: factory B counts do not match chapter data.'
    );
  }

  function makeBigBatch(records, color = C.muted) {
    const items = records.map(d =>
      square(
        d.pos,
        color,
        BIG_SIZE,
        0.8
      )
    );

    return {
      records,
      items,
      group: new M.VGroup(...items)
    };
  }

  function paintBatch(batch, color) {
    batch.items.forEach(sq => {
      sq.setColor(color);
      sq.setFill(color, 0.88);
    });
  }

  function makeBigGrid() {
    const quietBatches = [];

    // Keep faulty quiet parts separate so their color can
    // be revealed independently of the sound parts.

    const faultyQuiet = DATA_B.filter(
      d => d.faulty && !d.beep
    );

    quietBatches.push(
      makeBigBatch(faultyQuiet)
    );

    for (let k = 0; k < 10; k++) {
      const records = DATA_B.filter(
        d =>
          d.tile === k &&
          !d.faulty &&
          !d.beep
      );

      if (records.length) {
        quietBatches.push(
          makeBigBatch(records)
        );
      }
    }

    // Twelve groups of nine beeps.
    //
    // Group 0: nine true alarms.
    // Groups 1–11: ninety-nine false alarms.

    const beepRecords = [
      B_TRUE_ALARMS
    ];

    for (let k = 0; k < 11; k++) {
      beepRecords.push(
        B_FALSE_ALARMS.slice(k * 9, (k + 1) * 9)
      );
    }

    const beepBatches = beepRecords.map(
      (records, k) => {
        const batch = makeBigBatch(records);

        const ringItems = records.map(d =>
          ring(d.pos, BIG_RING, 1.1)
        );

        return {
          ...batch,
          faulty: k === 0,
          ringItems,
          ringGroup: new M.VGroup(...ringItems)
        };
      }
    );

    const frames = Array.from(
      { length: 10 },
      (_, k) => outline(
        BIG_BLOCK_W,
        BIG_BLOCK_W,
        tileCenter(k),
        C.muted
      )
    );

    const label = txt(
      '10 GRIDS × 100 PARTS = 1,000',
      P ? 18 : 16,
      C.ink,
      [
        CX,
        BIG_CY - BIG_H / 2 - 0.33,
        0
      ],
      true,
      P ? 6.5 : 5.9
    );

    const squareGroups = [
      ...quietBatches.map(b => b.group),
      ...beepBatches.map(b => b.group)
    ];

    const ringGroups = beepBatches.map(
      b => b.ringGroup
    );

    return {
      quietBatches,
      beepBatches,
      frames,
      label,
      squareGroups,
      ringGroups,

      base: [
        ...frames,
        ...squareGroups,
        label
      ],

      all: [
        ...frames,
        ...squareGroups,
        ...ringGroups,
        label
      ],

      onlyBeeps: [
        ...beepBatches.map(b => b.group),
        ...ringGroups
      ]
    };
  }

  function revealBigFaulty(big) {
    paintBatch(
      big.quietBatches[0],
      ORANGE
    );

    paintBatch(
      big.beepBatches[0],
      ORANGE
    );
  }

  function revealBigSound(big) {
    big.quietBatches.slice(1).forEach(
      b => paintBatch(b, TEAL)
    );

    big.beepBatches.slice(1).forEach(
      b => paintBatch(b, TEAL)
    );
  }

  // ------------------------------------------------------------
  // Compact arrangement of all 108 beeping parts.
  //
  // Twelve columns, nine ringed squares per column.
  //
  // Column 0: nine orange squares.
  // Columns 1–11: ninety-nine teal squares.
  //
  // This makes 9/108 = 1/12 visible without abstract maths.
  // ------------------------------------------------------------

  const B_SP_X = P ? 0.49 : 0.40;
  const B_SP_Y = P ? 0.43 : 0.35;

  const B_COMPACT_SIZE = P ? 0.235 : 0.19;
  const B_COMPACT_RING = P ? 0.176 : 0.143;

  const B_COMPACT_CY = P ? -1.35 : -0.65;

  const B_COMPACT_W =
    11 * B_SP_X + 2 * B_COMPACT_RING + 0.20;

  const B_COMPACT_H =
    8 * B_SP_Y + 2 * B_COMPACT_RING + 0.20;

  function compactBPos(col, row) {
    return [
      CX + (col - 5.5) * B_SP_X,
      B_COMPACT_CY + (4 - row) * B_SP_Y,
      0
    ];
  }

  function makeBColumn(col) {
    const color = col === 0 ? ORANGE : TEAL;

    const squares = [];
    const rings = [];

    for (let r = 0; r < 9; r++) {
      const pos = compactBPos(col, r);

      squares.push(
        square(
          pos,
          color,
          B_COMPACT_SIZE,
          1.7
        )
      );

      rings.push(
        ring(
          pos,
          B_COMPACT_RING,
          1.8
        )
      );
    }

    return {
      squares: new M.VGroup(...squares),
      rings: new M.VGroup(...rings)
    };
  }

  function gatherBigBeeps(big) {
    const moves = [];

    big.beepBatches.forEach((batch, col) => {
      const target = makeBColumn(col);

      moves.push(
        new M.Transform(
          batch.group,
          target.squares
        )
      );

      moves.push(
        new M.Transform(
          batch.ringGroup,
          target.rings
        )
      );
    });

    // Each square batch and its white rings move together.

    return new M.LaggedStart(
      moves,
      {
        lagRatio: 0,
        runTime: 1.65
      }
    );
  }

  const B_TRUE_X =
    CX - 5.5 * B_SP_X;

  const B_FALSE_X =
    CX + 0.5 * B_SP_X;

  const B_LABEL_Y =
    B_COMPACT_CY + B_COMPACT_H / 2 + 0.36;

  const B_BOTTOM_Y =
    B_COMPACT_CY - B_COMPACT_H / 2 - 0.45;

  function compactBLabels() {
    const top = txt(
      '108 BEEPING PARTS',
      P ? 20 : 18,
      WHITE,
      [CX, B_LABEL_Y, 0]
    );

    const bottom = txt(
      '9 true alarms    +    99 false alarms',
      P ? 18 : 16,
      C.ink,
      [CX, B_BOTTOM_Y, 0],
      false,
      P ? 6.6 : 5.6
    );

    return {
      top,
      bottom,
      all: [top, bottom]
    };
  }

  function makeCompactB() {
    const columns = Array.from(
      { length: 12 },
      (_, col) => makeBColumn(col)
    );

    const labels = compactBLabels();

    return {
      columns,
      labels,

      all: [
        ...columns.flatMap(c => [
          c.squares,
          c.rings
        ]),
        ...labels.all
      ]
    };
  }

  function trueAlarmOutline() {
    return outline(
      2 * B_COMPACT_RING + 0.13,
      B_COMPACT_H,
      [
        B_TRUE_X,
        B_COMPACT_CY,
        0
      ],
      ORANGE
    );
  }

  function falseAlarmOutline() {
    return outline(
      10 * B_SP_X +
        2 * B_COMPACT_RING + 0.14,

      B_COMPACT_H,

      [
        B_FALSE_X,
        B_COMPACT_CY,
        0
      ],

      TEAL
    );
  }

  function columnOutlines() {
    return Array.from(
      { length: 12 },
      (_, col) => outline(
        2 * B_COMPACT_RING + 0.10,
        B_COMPACT_H,
        [
          compactBPos(col, 4)[0],
          B_COMPACT_CY,
          0
        ],
        col === 0 ? ORANGE : TEAL
      )
    );
  }

  // ------------------------------------------------------------
  // Predictive-value comparison.
  //
  // Both bars represent all beeping parts in their respective
  // factories, normalized to the same total width.
  //
  // Orange = true alarms.
  // Teal = false alarms.
  //
  // Factory A: 9/18 = 50%.
  // Factory B: 9/108 = 1/12, about 8%.
  // ------------------------------------------------------------

  const BAR_W = P ? 5.85 : 5.0;
  const BAR_H = P ? 0.43 : 0.37;

  function predictiveBar(
    y,
    factory,
    fraction,
    countLabel,
    value,
    color,
    baseRate = ''
  ) {
    const title = txt(
      factory,
      P ? 20 : 18,
      color,
      [
        CX - BAR_W / 2 + 0.85,
        y + 0.60,
        0
      ],
      false,
      1.75
    );

    const valueLabel = txt(
      value,
      P ? 23 : 21,
      C.amber,
      [
        CX + BAR_W / 2 - 0.65,
        y + 0.60,
        0
      ],
      true
    );

    const orangeW = BAR_W * fraction;
    const tealW = BAR_W - orangeW;

    const left = CX - BAR_W / 2;

    const orange = rect(
      orangeW,
      BAR_H,
      [
        left + orangeW / 2,
        y,
        0
      ],
      ORANGE,
      0.94,
      1
    );

    const teal = rect(
      tealW,
      BAR_H,
      [
        left + orangeW + tealW / 2,
        y,
        0
      ],
      TEAL,
      0.90,
      1
    );

    const frame = outline(
      BAR_W + 0.08,
      BAR_H + 0.08,
      [CX, y, 0],
      WHITE
    );

    const count = txt(
      countLabel,
      P ? 18 : 16,
      C.ink,
      [CX, y - 0.43, 0],
      true,
      BAR_W
    );

    const items = [
      title,
      valueLabel,
      orange,
      teal,
      frame,
      count
    ];

    if (baseRate) {
      items.push(
        txt(
          baseRate,
          P ? 19 : 14,
          C.muted,
          [CX, y - 0.79, 0]
        )
      );
    }

    return new M.VGroup(...items);
  }

  function predictiveComparison(showBaseRates = false) {
    const topY = CY + (P ? 1.10 : 1.02);
    const bottomY = CY - (P ? 1.12 : 1.05);

    const a = predictiveBar(
      topY,
      'FACTORY A',
      9 / 18,
      '9 faulty out of 18 beeps',
      '50%',
      FACTORY_A,
      showBaseRates ? 'Base rate: 10%' : ''
    );

    const b = predictiveBar(
      bottomY,
      'FACTORY B',
      9 / 108,
      '9 faulty out of 108 beeps',
      '≈ 8%',
      FACTORY_B,
      showBaseRates ? 'Base rate: 1%' : ''
    );

    const legendY = P ? -4.15 : -2.9;

    const legendOrange = square(
      [
        CX - 1.72,
        legendY,
        0
      ],
      ORANGE,
      0.20
    );

    const legendOrangeText = txt(
      'Faulty',
      P ? 19 : 16,
      ORANGE,
      [
        CX - (P ? 1.0 : 1.15),
        legendY,
        0
      ]
    );

    const legendTeal = square(
      [
        CX + 0.66,
        legendY,
        0
      ],
      TEAL,
      0.20
    );

    const legendTealText = txt(
      'Sound',
      P ? 19 : 16,
      TEAL,
      [
        CX + (P ? 1.45 : 1.25),
        legendY,
        0
      ]
    );

    return {
      a,
      b,

      all: [
        a,
        b,
        legendOrange,
        legendOrangeText,
        legendTeal,
        legendTealText
      ]
    };
  }

  // ------------------------------------------------------------
  // Base-rate comparison.
  //
  // Both factories are represented by exactly 100 squares.
  // A: ten orange squares.
  // B: one orange square.
  //
  // No white rings are shown because these pictures represent
  // the populations before any scanner result is known.
  // ------------------------------------------------------------

  function baseComparison() {
    const dx = P ? 1.62 : 1.38;
    const pitch = P ? 0.265 : 0.225;
    const size = P ? 0.175 : 0.145;

    const leftCenter = [
      CX - dx,
      CY + 0.05,
      0
    ];

    const rightCenter = [
      CX + dx,
      CY + 0.05,
      0
    ];

    const a = makeGrid100(
      DATA_A,
      leftCenter,
      pitch,
      size
    );

    const b = makeGrid100(
      DATA_B100,
      rightCenter,
      pitch,
      size
    );

    // Group only newly constructed, not-yet-visible squares.

    const aGrid = new M.VGroup(
      ...a.squares
    );

    const bGrid = new M.VGroup(
      ...b.squares
    );

    const w = 9 * pitch + size + 0.20;
    const h = w;

    const aFrame = outline(
      w,
      h,
      leftCenter,
      FACTORY_A
    );

    const bFrame = outline(
      w,
      h,
      rightCenter,
      FACTORY_B
    );

    const top = leftCenter[1] + h / 2 + 0.42;
    const bottom = leftCenter[1] - h / 2 - 0.44;

    const aTitle = txt(
      'FACTORY A',
      P ? 18 : 16,
      FACTORY_A,
      [leftCenter[0], top, 0]
    );

    const bTitle = txt(
      'FACTORY B',
      P ? 18 : 16,
      FACTORY_B,
      [rightCenter[0], top, 0]
    );

    const aRate = tag(
      '10%',
      ORANGE,
      [leftCenter[0], bottom, 0],
      P ? 23 : 20
    );

    const bRate = tag(
      '1%',
      ORANGE,
      [rightCenter[0], bottom, 0],
      P ? 23 : 20
    );

    const aCount = txt(
      '10 out of 100',
      P ? 17 : 15,
      C.ink,
      [
        leftCenter[0],
        bottom - 0.44,
        0
      ]
    );

    const bCount = txt(
      '1 out of 100',
      P ? 17 : 15,
      C.ink,
      [
        rightCenter[0],
        bottom - 0.44,
        0
      ]
    );

    return {
      a,
      b,
      aGrid,
      bGrid,
      aRate,
      bRate,

      all: [
        aGrid,
        bGrid,
        aFrame,
        bFrame,
        aTitle,
        bTitle,
        aRate,
        bRate,
        aCount,
        bCount
      ]
    };
  }

  // ------------------------------------------------------------
  // 0–1: recall factory A and its previous result.
  // ------------------------------------------------------------

  const factoryA = makeGrid100(DATA_A);

  const factoryATitle = tag(
    'FACTORY A',
    FACTORY_A,
    [
      CX,
      CY - GRID_H / 2 - 0.38,
      0
    ],
    P ? 19 : 17
  );

  await until(S(0));
  await play(
    ...picture([
      ...factoryA.squares,
      factoryATitle
    ], 1.35),
    ...focus(
      GRID_W,
      ROW_H,
      [CX, TOP_Y, 0],
      ORANGE
    ),
    ...fbox([
      ['Factory A', FACTORY_A],
      ['10 faulty out of 100', ORANGE],
      ['Starting chance: 10%', C.amber]
    ], FACTORY_A),
    ...say('FACTORY A: 10% FAULTY', FACTORY_A)
  );

  // 1: a beep means fifty percent faulty in factory A.

  const firstACompact = makeACompact();

  await until(S(1));
  await play(
    ...clearMarks(),
    ...picture(firstACompact.all, 1.25),
    ...fbox([
      ['Given a beep in factory A', FACTORY_A],
      ['9 faulty out of 18 beeps', ORANGE],
      ['= 50%', C.amber]
    ], C.amber),
    ...say('FACTORY A: 50% GIVEN A BEEP', C.amber)
  );

  // ------------------------------------------------------------
  // 2–6: introduce factory B.
  //
  // Same scanner, same conditional beep rates.
  // Different starting share of faulty parts.
  // ------------------------------------------------------------

  const scannerPair = identicalScanners();

  // 2: factory B buys the same scanner.

  await until(S(2));
  await play(
    ...picture(scannerPair, 1.2),
    ...fbox([
      ['Factory B', FACTORY_B],
      'Buys exactly the',
      ['same scanner as A.', C.green]
    ], FACTORY_B),
    ...say('FACTORY B BUYS THE SAME SCANNER', FACTORY_B)
  );

  // 3: the scanner's habits do not change.

  const habits = makeHabits();

  await until(S(3));
  await play(
    ...picture(habits.all, 1.2),
    ...fbox([
      ['Same scanner habits', C.green],
      ['Given faulty: 90% beep', ORANGE],
      ['Given sound: 10% beep', TEAL]
    ], C.green),
    ...say('SAME 90% AND 10% BEEP RATES', C.green)
  );

  // 4: factory B has fewer faulty parts.

  const smallB = makeGrid100(DATA_B100);

  const smallBTitle = tag(
    'FACTORY B',
    FACTORY_B,
    [
      CX,
      CY - GRID_H / 2 - 0.38,
      0
    ],
    P ? 19 : 17
  );

  const smallBPicture = [
    ...smallB.squares,
    smallBTitle
  ];

  await until(S(4));
  await play(
    ...picture(smallBPicture, 1.25),
    ...focus(
      PITCH + 0.10,
      PITCH + 0.10,
      smallB.faulty[0].pos,
      ORANGE
    ),
    ...fbox([
      ['Factory B', FACTORY_B],
      ['Only 1 faulty out of 100', ORANGE],
      ['Starting chance: 1%', C.amber]
    ], FACTORY_B),
    ...say('FACTORY B: ONLY 1% FAULTY', FACTORY_B)
  );

  // 5: the manager asks for the updated chance after a beep.

  await until(S(5));
  await play(
    ...clearMarks(),
    ...fbox([
      ['Manager’s question:', C.violet],
      ['Given a beep,', WHITE],
      ['how likely is a fault?', ORANGE]
    ], C.violet),
    ...say('GIVEN A BEEP, HOW LIKELY IS A FAULT?', C.violet)
  );

  // 6: expose the tempting answer without accepting it.

  await until(S(6));
  await play(
    ...fbox([
      ['Same scanner', C.ink],
      ['Same answer: 50%?', C.amber],
      ['Let’s check the counts.', C.violet]
    ], C.amber),
    ...say('SAME SCANNER, SAME ANSWER?', C.amber)
  );

  // ------------------------------------------------------------
  // 7–10: scale from one hundred to one thousand parts.
  //
  // One percent of one hundred is just one faulty part.
  // One thousand parts make the scanner's 90% and 10%
  // conditional rates easier to represent exactly.
  // ------------------------------------------------------------

  // 7: only one faulty square in a hundred-part picture.

  await until(S(7));
  await play(
    ...focus(
      PITCH + 0.12,
      PITCH + 0.12,
      smallB.faulty[0].pos,
      ORANGE
    ),
    new M.Indicate(
      smallB.faulty[0].sq,
      { color: ORANGE }
    ),
    ...fbox([
      ['100 parts', C.ink],
      ['1% faulty', ORANGE],
      ['Just 1 faulty part', C.amber]
    ], C.amber),
    ...say('ONLY ONE FAULTY PART PER 100', ORANGE)
  );

  // 8: ten grids of one hundred individual squares.
  // All squares start neutral.

  const big = makeBigGrid();

  await until(S(8));
  await play(
    ...clearMarks(),
    ...picture(big.base, 1.45),
    ...fbox([
      ['10 groups of 100 parts', C.ink],
      ['10 × 100 = 1,000', C.amber]
    ], FACTORY_B),
    ...say('PICTURE 1,000 PARTS FROM FACTORY B', FACTORY_B)
  );

  // 9: ten out of the thousand parts are faulty.

  const firstTile = tileCenter(0);

  const bigFaultyRow = [
    firstTile[0],
    firstTile[1] + 4.5 * BIG_PITCH,
    0
  ];

  await until(S(9));

  revealBigFaulty(big);

  await play(
    ...focus(
      9 * BIG_PITCH + BIG_SIZE + 0.13,
      BIG_PITCH + 0.09,
      bigFaultyRow,
      ORANGE
    ),
    pulse(
      [
        big.beepBatches[0].group,
        big.quietBatches[0].group
      ],
      ORANGE,
      1.1
    ),
    ...fbox([
      ['1% of 1,000', C.ink],
      ['= 10 faulty parts', ORANGE]
    ], ORANGE),
    ...say('10 FAULTY PARTS', ORANGE)
  );

  // 10: reveal the other nine hundred and ninety sound parts.

  await until(S(10));

  revealBigSound(big);

  await play(
    ...clearMarks(),
    ...fbox([
      ['10 faulty', ORANGE],
      ['990 sound', TEAL],
      ['1,000 parts altogether', C.ink]
    ]),
    ...say('990 SOUND PARTS', TEAL)
  );

  // ------------------------------------------------------------
  // 11–14: calculate and reveal the scanner outcomes.
  //
  // 90% of 10 faulty parts = 9 true alarms.
  // 10% of 990 sound parts = 99 false alarms.
  //
  // Total beeps = 9 + 99 = 108.
  // ------------------------------------------------------------

  // 11: calculate the nine true alarms.

  await until(S(11));
  await play(
    ...focus(
      9 * BIG_PITCH + BIG_SIZE + 0.13,
      BIG_PITCH + 0.09,
      bigFaultyRow,
      ORANGE
    ),
    ...fbox([
      ['Faulty group: 10 parts', ORANGE],
      ['90% of them beep', WHITE],
      ['10 × 90% = 9', C.amber]
    ], ORANGE),
    ...say('9 FAULTY PARTS BEEP', ORANGE)
  );

  // 12: calculate the ninety-nine false alarms.

  await until(S(12));
  await play(
    ...clearMarks(),
    ...fbox([
      ['Sound group: 990 parts', TEAL],
      ['10% of them beep', WHITE],
      ['990 × 10% = 99', C.amber]
    ], TEAL),
    ...say('99 SOUND PARTS BEEP', TEAL)
  );

  // 13: put white rings around all 108 beeping parts.
  // The ring groups were constructed before entering the scene.

  await until(S(13));
  await play(
    ...picture(big.all, 1.35),
    ...fbox([
      ['White ring = beep', WHITE],
      ['9 orange rings', ORANGE],
      ['99 teal rings', TEAL]
    ], WHITE),
    ...say('WHITE RING = BEEP', WHITE)
  );

  // 14: count all the rings.

  await until(S(14));
  await play(
    ...fbox([
      ['9 faulty beeps', ORANGE],
      ['+ 99 sound beeps', TEAL],
      ['= 108 total beeps', WHITE]
    ], WHITE),
    ...say('9 + 99 = 108 BEEPS', WHITE)
  );

  // ------------------------------------------------------------
  // 15–19: condition on the beep in factory B.
  //
  // Remove exactly 892 quiet parts:
  // 1 faulty quiet part and 891 sound quiet parts.
  //
  // Rearrange the surviving 108 ringed squares into twelve
  // columns, with exactly nine squares per column.
  // ------------------------------------------------------------

  const filteredBTag = tag(
    '108 POSSIBLE PARTS',
    WHITE,
    [
      CX,
      P ? -5.02 : -2.65,
      0
    ],
    P ? 19 : 17
  );

  // 15: exclude every part that did not beep.

  await until(S(15));
  await play(
    ...picture([
      ...big.onlyBeeps,
      filteredBTag
    ], 1.60),
    ...fbox([
      ['Known fact: beep', WHITE],
      ['1,000 original parts', C.muted],
      ['− 892 quiet parts', C.muted],
      ['= 108 possible parts', WHITE]
    ], C.violet),
    ...say('CONDITIONING: FADE THE 892 QUIET PARTS', C.violet)
  );

  // 16: gather the 108 surviving parts.
  //
  // Exactly one column of nine orange squares remains.
  // Eleven columns of nine teal squares remain.

  const gatheredLabels = compactBLabels();

  await until(S(16));
  await play(
    gatherBigBeeps(big),
    ...picture([
      ...big.onlyBeeps,
      ...gatheredLabels.all
    ], 0.85),
    ...fbox([
      ['108 ringed parts', WHITE],
      ['Only 9 are faulty', ORANGE],
      ['The other 99 are sound', TEAL]
    ], WHITE),
    ...say('108 BEEPS, ONLY 9 ORANGE', WHITE)
  );

  // 17: twelve equal groups of nine.
  // Only one of those twelve groups is orange.

  await until(S(17));
  await play(
    ...marks(columnOutlines()),
    ...fbox([
      ['9 out of 108', ORANGE],
      ['108 = 12 × 9', C.ink],
      ['9/108 = 1/12', C.amber]
    ], C.amber),
    ...say('ONE OF TWELVE EQUAL GROUPS', C.amber)
  );

  // 18: one in twelve is about eight percent.

  await until(S(18));
  await play(
    ...marks([
      trueAlarmOutline()
    ]),
    ...fbox([
      ['9 ÷ 108 = 1/12', C.ink],
      ['≈ 8%', C.amber]
    ], C.amber),
    ...say('ABOUT 8%', C.amber)
  );

  // 19: state what a beep predicts in factory B.

  await until(S(19));
  await play(
    new M.Indicate(
      big.beepBatches[0].group,
      { color: ORANGE }
    ),
    ...fbox([
      ['Factory B', FACTORY_B],
      ['Chance of faulty given beep', C.ink],
      ['9/108 ≈ 8%', C.amber]
    ], FACTORY_B),
    ...say('FACTORY B: ABOUT 8% GIVEN A BEEP', FACTORY_B)
  );

  // ------------------------------------------------------------
  // 20–23: same scanner, very different predictive value.
  //
  // Factory A: nine true alarms and nine false alarms.
  // Factory B: nine true alarms and ninety-nine false alarms.
  // ------------------------------------------------------------

  const firstComparison = predictiveComparison();

  // 20: compare the previous factory A result.

  await until(S(20));
  await play(
    ...clearMarks(),
    ...picture(firstComparison.all, 1.05),
    ...fbox([
      ['Factory A: 9/18 = 50%', FACTORY_A],
      ['Factory B: 9/108 ≈ 8%', FACTORY_B]
    ], C.amber),
    ...say('FACTORY A: 50%. FACTORY B: ABOUT 8%', C.amber)
  );

  // 21: the scanner is identical, so why are the answers different?

  await until(S(21));
  await play(
    ...fbox([
      ['Same scanner', C.green],
      ['Different answers', C.amber],
      'Why?'
    ], C.violet),
    ...say('SAME SCANNER, DIFFERENT MEANING', C.violet)
  );

  // 22: sound parts are much more common in factory B.
  // A small error rate applied to a huge group produces
  // a large number of false alarms.

  const alarmB = makeCompactB();

  await until(S(22));
  await play(
    ...picture(alarmB.all, 1.1),
    ...marks([
      falseAlarmOutline()
    ]),
    ...fbox([
      ['990 sound parts', TEAL],
      ['Only 10% beep', WHITE],
      ['But that makes 99 alarms', TEAL]
    ], TEAL),
    ...say('A SMALL ERROR RATE ON A HUGE GROUP', TEAL)
  );

  // 23: the ninety-nine false alarms overwhelm the nine true alarms.

  await until(S(23));
  await play(
    ...marks([
      trueAlarmOutline(),
      falseAlarmOutline()
    ]),
    ...fbox([
      ['True alarms: 9', ORANGE],
      ['False alarms: 99', TEAL],
      ['99 ÷ 9 = 11 times as many', C.amber]
    ], C.amber),
    ...say('99 FALSE ALARMS, ONLY 9 TRUE ALARMS', C.amber)
  );

  // ------------------------------------------------------------
  // 24–27: introduce the base rate.
  //
  // Base rate = the share with the condition before any clue.
  //
  // Factory A: 10%.
  // Factory B: 1%.
  //
  // In Bayes' rule, the base rate is the prior.
  // ------------------------------------------------------------

  const bases = baseComparison();

  // 24: name the starting fault share.

  await until(S(24));
  await play(
    ...clearMarks(),
    ...picture(bases.all, 1.15),
    ...fbox([
      ['Base rate', C.green],
      'Share of faulty parts',
      'before any scan.'
    ], C.green),
    ...say('BASE RATE = STARTING SHARE', C.green)
  );

  // 25: base means before any clue.

  await until(S(25));
  await play(
    ...fbox([
      ['Before any beep', C.muted],
      ['Before any new clue', C.muted],
      ['Our starting chance', C.green]
    ], C.green),
    ...say('BASE = WHERE WE START', C.green)
  );

  // 26: compare the base rates directly.

  await until(S(26));
  await play(
    pulse(
      [
        bases.aRate,
        bases.bRate
      ],
      C.amber,
      1.35
    ),
    ...fbox([
      ['Factory A base rate: 10%', FACTORY_A],
      ['Factory B base rate: 1%', FACTORY_B],
      ['Different starting chances', C.amber]
    ], C.amber),
    ...say('BASE RATES: 10% VERSUS 1%', C.amber)
  );

  // 27: connect base rate to Bayes' prior.

  await until(S(27));
  await play(
    ...fbox([
      ['Bayes’ rule', C.violet],
      ['Prior = base rate', C.green],
      ['Chance before the clue', C.ink]
    ], C.green),
    ...say('IN BAYES’ RULE, BASE RATE = PRIOR', C.green)
  );

  // ------------------------------------------------------------
  // 28–30: introduce predictive value.
  //
  // Predictive value of a beep:
  // chance of a fault given that the scanner beeped.
  //
  // This is not the same as the scanner's 90% beep rate
  // among faulty parts.
  // ------------------------------------------------------------

  const predictive = predictiveComparison(true);

  // 28: name the chance after the positive result.

  await until(S(28));
  await play(
    ...picture(predictive.all, 1.15),
    ...fbox([
      ['Predictive value', C.green],
      ['Chance of a fault', ORANGE],
      ['given a beep', WHITE]
    ], C.green),
    ...say('PREDICTIVE VALUE = CHANCE GIVEN A BEEP', C.green)
  );

  // 29: predictive because the clue tells us something
  // about the unknown truth.

  await until(S(29));
  await play(
    ...fbox([
      ['The beep is the clue', WHITE],
      ['Fault status is unknown', ORANGE],
      ['What does the clue predict?', C.violet]
    ], C.violet),
    ...say('WHAT DOES THE BEEP PREDICT?', C.violet)
  );

  // 30: lower base rate leads to lower predictive value
  // when the scanner's conditional rates stay fixed.

  await until(S(30));
  await play(
    pulse(
      [
        predictive.a,
        predictive.b
      ],
      C.amber,
      1.45
    ),
    ...fbox([
      ['Same scanner', C.green],
      ['Base rate: 10% → 1%', ORANGE],
      ['Predictive value:', C.ink],
      ['50% → about 8%', C.amber]
    ], C.amber),
    ...say('LOWER BASE RATE, LOWER PREDICTIVE VALUE', C.amber)
  );

  await until(S(30) + 3.3);

  await play(
    ...fbox([
      ['The scanner did not change.', C.green],
      'The starting share changed.',
      ['So the meaning of a beep changed.', C.amber]
    ], C.violet),
    ...say('EVEN WITH THE SAME SCANNER', C.violet)
  );

  // ------------------------------------------------------------
  // 31–32: everyday comparison, a kitchen smoke alarm.
  //
  // Real fires are rare.
  // Burnt toast is common in the narrated example.
  //
  // The illustration is qualitative, not measured fire
  // or smoke-alarm statistics.
  // ------------------------------------------------------------

  function smokeAlarm(pos) {
    const x = pos[0];
    const y = pos[1];

    const shell = new M.Circle({
      radius: 0.48,
      color: WHITE,
      strokeWidth: 2.4
    });

    shell.setFill(C.card, 0.96);
    shell.moveTo(pos);

    const inner = new M.Circle({
      radius: 0.31,
      color: C.muted,
      strokeWidth: 1.6
    });

    inner.setFill(C.muted, 0.14);
    inner.moveTo(pos);

    const vents = Array.from(
      { length: 5 },
      (_, k) => line(
        [
          x - 0.15,
          y + 0.15 - k * 0.075,
          0
        ],
        [
          x + 0.15,
          y + 0.15 - k * 0.075,
          0
        ],
        C.muted,
        2
      )
    );

    const light = new M.Circle({
      radius: 0.055,
      color: ORANGE,
      strokeWidth: 1
    });

    light.setFill(ORANGE, 1);
    light.moveTo([
      x,
      y - 0.35,
      0
    ]);

    const waves = [
      new M.Arc({
        radius: 0.67,
        startAngle: -Math.PI / 4,
        angle: Math.PI / 2,
        color: WHITE,
        strokeWidth: 2.4
      }),

      new M.Arc({
        radius: 0.86,
        startAngle: -Math.PI / 4,
        angle: Math.PI / 2,
        color: WHITE,
        strokeWidth: 2.1
      })
    ];

    waves[0].moveTo([
      x + 0.64,
      y,
      0
    ]);

    waves[1].moveTo([
      x + 0.85,
      y,
      0
    ]);

    return new M.VGroup(
      shell,
      inner,
      ...vents,
      light,
      ...waves
    );
  }

  function toastIcon(pos) {
    const x = pos[0];
    const y = pos[1];

    const bread = new M.RoundedRectangle({
      width: 0.85,
      height: 1.03,
      cornerRadius: 0.20,
      color: '#C99759',
      strokeWidth: 3
    });

    bread.setFill('#A36C37', 0.95);
    bread.moveTo([
      x,
      y + 0.12,
      0
    ]);

    const burnt = new M.RoundedRectangle({
      width: 0.58,
      height: 0.71,
      cornerRadius: 0.14,
      color: '#69432F',
      strokeWidth: 1.4
    });

    burnt.setFill('#69432F', 0.96);
    burnt.moveTo([
      x,
      y + 0.10,
      0
    ]);

    const toaster = new M.RoundedRectangle({
      width: 1.48,
      height: 0.64,
      cornerRadius: 0.16,
      color: C.muted,
      strokeWidth: 2
    });

    toaster.setFill(C.card, 0.95);
    toaster.moveTo([
      x,
      y - 0.43,
      0
    ]);

    const button = new M.Circle({
      radius: 0.075,
      color: C.amber
    });

    button.setFill(C.amber, 1);
    button.moveTo([
      x + 0.48,
      y - 0.44,
      0
    ]);

    const smoke = [];

    for (let k = 0; k < 3; k++) {
      const dx = (k - 1) * 0.25;

      smoke.push(
        line(
          [
            x + dx,
            y + 0.74,
            0
          ],
          [
            x + dx + 0.10,
            y + 0.92,
            0
          ],
          C.muted,
          2.4
        )
      );

      smoke.push(
        line(
          [
            x + dx + 0.10,
            y + 0.92,
            0
          ],
          [
            x + dx,
            y + 1.10,
            0
          ],
          C.muted,
          2.4
        )
      );
    }

    return new M.VGroup(
      bread,
      burnt,
      toaster,
      button,
      ...smoke
    );
  }

  function fireIcon(pos) {
    const x = pos[0];
    const y = pos[1];

    const outer = new M.VGroup(
      line(
        [x - 0.48, y - 0.45, 0],
        [x - 0.63, y + 0.12, 0],
        ORANGE,
        5
      ),
      line(
        [x - 0.63, y + 0.12, 0],
        [x - 0.26, y + 0.56, 0],
        ORANGE,
        5
      ),
      line(
        [x - 0.26, y + 0.56, 0],
        [x - 0.04, y + 0.23, 0],
        ORANGE,
        5
      ),
      line(
        [x - 0.04, y + 0.23, 0],
        [x + 0.18, y + 1.02, 0],
        ORANGE,
        5
      ),
      line(
        [x + 0.18, y + 1.02, 0],
        [x + 0.58, y + 0.28, 0],
        ORANGE,
        5
      ),
      line(
        [x + 0.58, y + 0.28, 0],
        [x + 0.48, y - 0.45, 0],
        ORANGE,
        5
      ),
      line(
        [x + 0.48, y - 0.45, 0],
        [x - 0.48, y - 0.45, 0],
        ORANGE,
        5
      )
    );

    const inner = new M.VGroup(
      line(
        [x - 0.20, y - 0.35, 0],
        [x - 0.08, y + 0.15, 0],
        C.amber,
        4
      ),
      line(
        [x - 0.08, y + 0.15, 0],
        [x + 0.15, y + 0.38, 0],
        C.amber,
        4
      ),
      line(
        [x + 0.15, y + 0.38, 0],
        [x + 0.26, y - 0.35, 0],
        C.amber,
        4
      )
    );

    return new M.VGroup(
      outer,
      inner
    );
  }

  const alarmPos = [
    CX,
    CY + 0.85,
    0
  ];

  const kitchenAlarm = smokeAlarm(alarmPos);

  const kitchenAlarmTag = tag(
    'BEEP!',
    WHITE,
    [
      CX,
      CY + 1.78,
      0
    ],
    P ? 20 : 18
  );

  const kitchenBase = [
    kitchenAlarm,
    kitchenAlarmTag
  ];

  // 31: introduce the smoke-alarm example.

  await until(S(31));
  await play(
    ...picture(kitchenBase, 1.05),
    ...fbox([
      ['Everyday example', C.violet],
      ['A smoke alarm beeps.', WHITE],
      'Does that mean a real fire?'
    ], C.violet),
    ...say('A SMOKE ALARM IN A KITCHEN', C.violet)
  );

  // 32: two ways a smoke alarm might beep.

  const kitchenDX = P ? 1.55 : 1.38;

  const firePos = [
    CX - kitchenDX,
    CY - 1.10,
    0
  ];

  const toastPos = [
    CX + kitchenDX,
    CY - 1.10,
    0
  ];

  const fire = fireIcon(firePos);
  const toast = toastIcon(toastPos);

  const firePath = line(
    [
      firePos[0],
      firePos[1] + 1.13,
      0
    ],
    [
      alarmPos[0] - 0.37,
      alarmPos[1] - 0.30,
      0
    ],
    ORANGE,
    3
  );

  const toastPath = line(
    [
      toastPos[0],
      toastPos[1] + 1.20,
      0
    ],
    [
      alarmPos[0] + 0.37,
      alarmPos[1] - 0.30,
      0
    ],
    TEAL,
    3
  );

  const fireLabel = txt(
    'REAL FIRE',
    P ? 18 : 16,
    ORANGE,
    [
      firePos[0],
      firePos[1] - 0.88,
      0
    ]
  );

  const toastLabel = txt(
    'BURNT TOAST',
    P ? 18 : 16,
    TEAL,
    [
      toastPos[0],
      toastPos[1] - 0.99,
      0
    ]
  );

  const rareTag = tag(
    'RARE',
    ORANGE,
    [
      firePos[0],
      firePos[1] - 1.32,
      0
    ],
    P ? 17 : 15
  );

  const commonTag = tag(
    'COMMON',
    TEAL,
    [
      toastPos[0],
      toastPos[1] - 1.43,
      0
    ],
    P ? 17 : 15
  );

  // Keep the lowest labels within the laptop safe area.

  if (!P) {
    fireLabel.moveTo([
      firePos[0],
      -2.28,
      0
    ]);

    toastLabel.moveTo([
      toastPos[0],
      -2.28,
      0
    ]);

    rareTag.moveTo([
      firePos[0],
      -2.72,
      0
    ]);

    commonTag.moveTo([
      toastPos[0],
      -2.72,
      0
    ]);
  }

  const kitchenPicture = [
    firePath,
    toastPath,
    ...kitchenBase,
    fire,
    toast,
    fireLabel,
    toastLabel,
    rareTag,
    commonTag
  ];

  await until(S(32));
  await play(
    ...picture(kitchenPicture, 1.25),
    ...fbox([
      ['Real fires are rare', ORANGE],
      ['Burnt toast is common', TEAL],
      ['Many beeps come from toast', WHITE]
    ], C.violet),
    ...say('RARE FIRES, COMMON BURNT TOAST', C.violet)
  );

  await until(S(32) + 3.0);

  await play(
    new M.Indicate(
      commonTag,
      { color: TEAL }
    ),
    ...fbox([
      ['An alarm is a clue.', WHITE],
      'Its meaning depends on',
      ['how common the problem is.', C.amber]
    ], C.amber),
    ...say('THE STARTING FREQUENCY MATTERS', C.amber)
  );

  // ------------------------------------------------------------
  // 33–35: applications to tests and alarms.
  // ------------------------------------------------------------

  // 33: the principle applies to any positive test result.

  const usefulComparison = predictiveComparison(true);

  await until(S(33));
  await play(
    ...picture(usefulComparison.all, 1.1),
    ...fbox([
      ['Use base rates to understand', C.green],
      ['Tests', C.ink],
      ['Scanners', C.ink],
      ['Alarms', C.ink]
    ], C.green),
    ...say('READ ANY TEST OR ALARM CORRECTLY', C.green)
  );

  // 34: ask how common the underlying problem is.

  const questionBases = baseComparison();

  await until(S(34));
  await play(
    ...picture(questionBases.all, 1.1),
    ...fbox([
      ['Before trusting a result:', C.violet],
      'How common is',
      ['the problem here?', C.amber]
    ], C.violet),
    ...say('ALWAYS ASK: HOW COMMON IS THE PROBLEM?', C.amber)
  );

  // ------------------------------------------------------------
  // 35: medical-test comparison.
  //
  // Use schematic groups with different illness prevalence.
  // These are illustrative pictures, not clinical statistics.
  // No numerical test-performance claim is introduced.
  // ------------------------------------------------------------

  function medicalGroup(
    center,
    affected,
    label,
    groupColor
  ) {
    const sp = P ? 0.34 : 0.28;
    const radius = P ? 0.105 : 0.085;

    const dots = [];

    for (let k = 0; k < 24; k++) {
      const row = Math.floor(k / 6);
      const col = k % 6;

      const color = k < affected
        ? ORANGE
        : TEAL;

      const d = new M.Circle({
        radius,
        color,
        strokeWidth: 1.5
      });

      d.setFill(color, 0.90);

      d.moveTo([
        center[0] + (col - 2.5) * sp,
        center[1] + (1.5 - row) * sp,
        0
      ]);

      dots.push(d);
    }

    const w = 5 * sp + 2 * radius + 0.25;
    const h = 3 * sp + 2 * radius + 0.25;

    const frame = outline(
      w,
      h,
      center,
      groupColor
    );

    const title = txt(
      label,
      P ? 17 : 15,
      groupColor,
      [
        center[0],
        center[1] + h / 2 + 0.35,
        0
      ],
      false,
      P ? 2.8 : 2.5
    );

    return {
      frame,
      title,

      all: [
        ...dots,
        frame,
        title
      ]
    };
  }

  const MED_DX = P ? 1.60 : 1.38;

  const medLeft = medicalGroup(
    [
      CX - MED_DX,
      CY + 0.35,
      0
    ],
    8,
    'ILLNESS MORE COMMON',
    C.violet
  );

  const medRight = medicalGroup(
    [
      CX + MED_DX,
      CY + 0.35,
      0
    ],
    1,
    'ILLNESS LESS COMMON',
    C.cyan
  );

  const medSameTest = tag(
    'SAME MEDICAL TEST',
    WHITE,
    [CX, CY - 0.80, 0],
    P ? 19 : 17
  );

  const medLegend1 = txt(
    'Orange = illness present',
    P ? 16 : 15,
    ORANGE,
    [CX, CY - 1.34, 0]
  );

  const medLegend2 = txt(
    'Teal = illness absent',
    P ? 16 : 15,
    TEAL,
    [CX, CY - 1.72, 0]
  );

  const medNote = txt(
    'Illustration, not clinical data',
    P ? 15 : 14,
    C.muted,
    [
      CX,
      P ? CY - 2.14 : -2.78,
      0
    ]
  );

  const medicalPicture = [
    ...medLeft.all,
    ...medRight.all,
    medSameTest,
    medLegend1,
    medLegend2,
    medNote
  ];

  await until(S(35));
  await play(
    ...picture(medicalPicture, 1.2),
    ...fbox([
      ['Medical tests', C.violet],
      ['Same test performance', WHITE],
      ['Different illness base rates', ORANGE],
      ['Different predictive values', C.amber]
    ], C.violet),
    ...say('MEDICAL TESTS WORK THE SAME WAY', C.violet)
  );

  // ------------------------------------------------------------
  // 36–38: common trap, base rate neglect.
  //
  // Looking only at the test's performance ignores how many
  // people or parts actually have the condition.
  // ------------------------------------------------------------

  const trapHabits = makeHabits();

  // 36: name the trap.

  await until(S(36));
  await play(
    ...picture(trapHabits.all, 1.15),
    ...fbox([
      ['Common trap', C.amber],
      ['Base rate neglect', C.violet],
      ['Neglect = ignoring', C.muted]
    ], C.amber),
    ...say('BASE RATE NEGLECT', C.amber)
  );

  // 37: people remember the scanner's good performance
  // but ignore the prevalence of faulty parts.

  await until(S(37));
  await play(
    ...fbox([
      ['Remembered:', C.ink],
      ['90% of faulty parts beep', ORANGE],
      ['Forgotten:', C.amber],
      ['Only 1% of parts are faulty', C.muted]
    ], C.amber),
    ...say('DO NOT FORGET HOW RARE THE PROBLEM IS', C.amber)
  );

  // 38: combine both necessary pieces of information.

  const trapBases = baseComparison();

  await until(S(38));
  await play(
    ...picture(trapBases.all, 1.1),
    ...fbox([
      ['You need BOTH:', C.green],
      ['1. Scanner performance', WHITE],
      ['2. The base rate', ORANGE]
    ], C.green),
    ...say('A GOOD SCANNER ALONE IS NOT ENOUGH', C.green)
  );

  // ------------------------------------------------------------
  // 39: preview the next lesson.
  //
  // Add a second identical scanner.
  // Do not introduce the conditional-independence calculation
  // before its narration in lesson 4.2.7.
  // ------------------------------------------------------------

  const NEXT_DX = P ? 1.52 : 1.38;
  const NEXT_SCALE = P ? 0.88 : 0.85;

  const nextS1 = scanner(
    [
      CX - NEXT_DX,
      CY + 0.12,
      0
    ],
    NEXT_SCALE
  );

  const nextS2 = scanner(
    [
      CX + NEXT_DX,
      CY + 0.12,
      0
    ],
    NEXT_SCALE
  );

  const nextLabel1 = tag(
    'SCANNER 1',
    C.cyan,
    [
      CX - NEXT_DX,
      CY + 1.55,
      0
    ],
    P ? 18 : 16
  );

  const nextLabel2 = tag(
    'SCANNER 2',
    C.cyan,
    [
      CX + NEXT_DX,
      CY + 1.55,
      0
    ],
    P ? 18 : 16
  );

  const nextArrow = txt(
    '→',
    P ? 27 : 25,
    C.green,
    [CX, CY + 0.12, 0]
  );

  const nextClue1 = tag(
    'FIRST CLUE',
    WHITE,
    [
      CX - NEXT_DX,
      CY - 1.15,
      0
    ],
    P ? 17 : 15
  );

  const nextClue2 = tag(
    'SECOND CLUE',
    WHITE,
    [
      CX + NEXT_DX,
      CY - 1.15,
      0
    ],
    P ? 17 : 15
  );

  const nextPicture = [
    nextS1,
    nextS2,
    nextLabel1,
    nextLabel2,
    nextArrow,
    nextClue1,
    nextClue2
  ];

  await until(S(39));
  await play(
    ...picture(nextPicture, 1.2),
    ...fbox([
      ['Next lesson', C.violet],
      ['Two identical scanners', WHITE],
      'How do two clues',
      'work together?'
    ], C.violet),
    ...say('NEXT: TWO SCANNERS, TWO CLUES', C.violet)
  );

  // ------------------------------------------------------------
  // 40: final takeaway.
  //
  // Revisit the original base rates.
  // Compare the predictive values with identical scanner habits.
  //
  // Factory A: base rate 10%, predictive value 50%.
  // Factory B: base rate 1%, predictive value about 8%.
  //
  // The meaning of a positive result depends on how common
  // the underlying condition was before the result arrived.
  // ------------------------------------------------------------

  const finalBases = baseComparison();

  const finalComparison = predictiveComparison(true);

  await until(S(40));
  await play(
    ...picture(finalBases.all, 1.05),
    ...fbox([
      ['Before any scan', C.ink],
      ['Factory A: 10% faulty', FACTORY_A],
      ['Factory B: 1% faulty', FACTORY_B]
    ], C.violet),
    ...say('START WITH HOW COMMON THE PROBLEM IS', C.violet)
  );

  await until(S(40) + 2.2);

  await play(
    ...picture(finalComparison.all, 1.15),
    ...fbox([
      ['Same scanner, different base rates', C.green],
      ['A: 9/18 = 50%', FACTORY_A],
      ['B: 9/108 ≈ 8%', FACTORY_B]
    ], C.amber),
    ...say('SAME POSITIVE RESULT, DIFFERENT MEANING', C.amber)
  );

  await until(S(40) + 4.0);

  await play(
    ...fbox([
      ['Remember the base rate.', C.green],
      'A positive result depends',
      'on how common the problem',
      ['was to begin with.', C.amber]
    ], C.green),
    ...say('THE BASE RATE CHANGES WHAT A BEEP MEANS', C.green)
  );

  await until(E(40));
}
