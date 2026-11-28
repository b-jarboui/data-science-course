// lesson 4.2.5
// Bayes' rule: updating a chance after a clue.
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

  const ORANGE_GLOW = '#624025';
  const TEAL_GLOW = '#20534F';

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
  // Formula box.
  //
  // Same visual structure as the approved reference lesson.
  // Rows can be plain strings or [text, color].
  // Leading spaces indent.
  // ------------------------------------------------------------

  let boxNow = null;

  function replaceBox(g) {
    const a = [new M.FadeIn(g)];

    if (boxNow) {
      a.push(new M.FadeOut(boxNow));
    }

    boxNow = g;

    return a;
  }

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

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(BOXP);

    return replaceBox(g);
  }

  function clearBox() {
    if (!boxNow) return [];

    const old = boxNow;
    boxNow = null;

    return [new M.FadeOut(old)];
  }

  // A genuine stacked fraction for Bayes' rule.
  //
  // Numerator: orange, representing faulty beeps.
  // Denominator: white, representing all beeps.
  // Result: amber, representing the updated chance.

  function fractionBox(
    heading,
    numerator,
    denominator,
    result = '',
    color = C.cyan
  ) {
    const size = P ? 20 : 19;

    const numRows = Array.isArray(numerator)
      ? numerator
      : [numerator];

    const denRows = Array.isArray(denominator)
      ? denominator
      : [denominator];

    const head = T(
      heading,
      size,
      C.ink,
      false
    );

    const topTexts = numRows.map(s =>
      T(s, size, ORANGE, true)
    );

    const bottomTexts = denRows.map(s =>
      T(s, size, WHITE, true)
    );

    const answer = result
      ? T(result, P ? 23 : 22, C.amber, true)
      : null;

    const fracW = Math.max(
      ...topTexts.map(t => t.getWidth()),
      ...bottomTexts.map(t => t.getWidth())
    ) + 0.30;

    const wd = Math.max(
      head.getWidth(),
      fracW,
      answer ? answer.getWidth() : 0
    ) + 0.62;

    const LH = 0.37;

    const ht =
      0.85 +
      topTexts.length * LH +
      bottomTexts.length * LH +
      (answer ? 0.42 : 0);

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.96);
    r.moveTo(BOXP);

    let y = BOXP[1] + ht / 2 - 0.26;

    head.moveTo([
      BOXP[0],
      y,
      0
    ]);

    y -= 0.40;

    topTexts.forEach(t => {
      t.moveTo([
        BOXP[0],
        y,
        0
      ]);

      y -= LH;
    });

    const dividerY = y + 0.12;

    const divider = line(
      [
        BOXP[0] - fracW / 2,
        dividerY,
        0
      ],
      [
        BOXP[0] + fracW / 2,
        dividerY,
        0
      ],
      C.ink,
      2
    );

    y -= 0.12;

    bottomTexts.forEach(t => {
      t.moveTo([
        BOXP[0],
        y,
        0
      ]);

      y -= LH;
    });

    const items = [
      r,
      head,
      ...topTexts,
      divider,
      ...bottomTexts
    ];

    if (answer) {
      answer.moveTo([
        BOXP[0],
        y - 0.03,
        0
      ]);

      items.push(answer);
    }

    const g = new M.VGroup(...items);

    const maxw = P ? FW - 1.2 : 4.4;
    const maxh = P ? 2.1 : 3.2;

    const scale = Math.min(
      1,
      maxw / wd,
      maxh / ht
    );

    if (scale < 1) {
      g.scale(scale);
    }

    g.moveTo(BOXP);

    return replaceBox(g);
  }

  // ------------------------------------------------------------
  // Picture management.
  //
  // Retained objects stay attached to the scene.
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
  //                 Beep    No beep    Total
  // Faulty            9        1         10
  // Sound             9       81         90
  // Total            18       82        100
  //
  // Same arrangement as the preceding lessons:
  // Top row: ten faulty parts; first nine beep.
  // Remaining nine rows: sound parts, one beep per row.
  //
  // Prior:       10 / 100 = 10%.
  // Posterior:    9 / 18  = 50%.
  // ------------------------------------------------------------

  const DATA = Array.from({ length: 100 }, (_, i) => {
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

  const truthColor = d => d.faulty ? ORANGE : TEAL;

  function gridPos(d) {
    return [
      CX + (d.c - 4.5) * PITCH,
      CY + (4.5 - d.r) * PITCH,
      0
    ];
  }

  function square(pos, color = C.muted, size = SIZE) {
    const r = new M.Rectangle({
      width: size,
      height: size,
      color,
      strokeWidth: 2
    });

    r.setFill(color, 0.84);
    r.moveTo(pos);

    return r;
  }

  function ring(pos, radius = RADIUS) {
    const r = new M.Circle({
      radius,
      color: WHITE,
      strokeWidth: 2.4
    });

    r.setFill(WHITE, 0);
    r.moveTo(pos);

    return r;
  }

  function makeGrid(revealTruth = true) {
    return DATA.map(d => {
      const pos = gridPos(d);

      return {
        ...d,
        pos,
        sq: square(
          pos,
          revealTruth ? truthColor(d) : C.muted
        ),
        ring: d.beep ? ring(pos) : null
      };
    });
  }

  const squares = parts => parts.map(d => d.sq);

  const rings = parts =>
    parts.filter(d => d.beep).map(d => d.ring);

  const objects = parts =>
    parts.flatMap(d => d.ring ? [d.sq, d.ring] : [d.sq]);

  function reveal(parts) {
    return new M.LaggedStart(
      parts.map(d =>
        new M.Transform(
          d.sq,
          square(d.pos, truthColor(d))
        )
      ),
      {
        lagRatio: 0.02,
        runTime: 1.65
      }
    );
  }

  const GRID_W =
    9 * PITCH + 2 * RADIUS + 0.20;

  const GRID_H =
    9 * PITCH + 2 * RADIUS + 0.16;

  const TOP_Y =
    CY + 4.5 * PITCH;

  const ROW_H =
    2 * RADIUS + 0.16;

  const SOUND_Y =
    CY - 0.5 * PITCH;

  const SOUND_H =
    8 * PITCH + 2 * RADIUS + 0.16;

  // ------------------------------------------------------------
  // Compact picture of the eighteen beeping parts.
  //
  // Top row: nine faulty beeps.
  // Bottom row: nine sound beeps.
  //
  // The two rows have equal length.
  // This makes the posterior of one half visually obvious.
  // ------------------------------------------------------------

  const COMPACT_PITCH = P ? 0.61 : 0.47;
  const COMPACT_DY = P ? 1.05 : 0.47;

  const COMPACT_W =
    8 * COMPACT_PITCH + 2 * RADIUS + 0.22;

  const COMPACT_H =
    2 * COMPACT_DY + 2 * RADIUS + 0.22;

  function compactPos(k, faulty) {
    return [
      CX + (k - 4) * COMPACT_PITCH,
      CY + (faulty ? COMPACT_DY : -COMPACT_DY),
      0
    ];
  }

  function gatherBeeps(parts) {
    let nf = 0;
    let ns = 0;

    const moves = [];

    parts.forEach(d => {
      const k = d.faulty ? nf++ : ns++;

      const target = compactPos(k, d.faulty);

      moves.push(
        new M.Transform(
          d.sq,
          square(target, truthColor(d))
        )
      );

      moves.push(
        new M.Transform(
          d.ring,
          ring(target)
        )
      );

      d.pos = target;
    });

    // All squares and their corresponding rings move together.

    return new M.LaggedStart(
      moves,
      {
        lagRatio: 0,
        runTime: 1.55
      }
    );
  }

  function makeCompact() {
    let nf = 0;
    let ns = 0;

    const parts = DATA
      .filter(d => d.beep)
      .map(d => {
        const k = d.faulty ? nf++ : ns++;

        const pos = compactPos(k, d.faulty);

        return {
          ...d,
          pos,
          sq: square(pos, truthColor(d)),
          ring: ring(pos)
        };
      });

    return {
      parts,
      faulty: parts.filter(d => d.faulty),
      sound: parts.filter(d => !d.faulty),
      all: objects(parts)
    };
  }

  function compactLabels(
    top = '9 FAULTY BEEPS',
    bottom = '9 SOUND BEEPS'
  ) {
    const a = txt(
      top,
      P ? 18 : 17,
      ORANGE,
      [
        CX,
        CY + COMPACT_DY + RADIUS + 0.35,
        0
      ],
      false,
      COMPACT_W
    );

    const b = txt(
      bottom,
      P ? 18 : 17,
      TEAL,
      [
        CX,
        CY - COMPACT_DY - RADIUS - 0.35,
        0
      ],
      false,
      COMPACT_W
    );

    return {
      top: a,
      bottom: b,
      all: [a, b]
    };
  }

  function compactFaultyOutline() {
    return outline(
      COMPACT_W,
      2 * RADIUS + 0.20,
      [CX, CY + COMPACT_DY, 0],
      ORANGE
    );
  }

  function compactSoundOutline() {
    return outline(
      COMPACT_W,
      2 * RADIUS + 0.20,
      [CX, CY - COMPACT_DY, 0],
      TEAL
    );
  }

  // ------------------------------------------------------------
  // Scanner illustration.
  //
  // A neutral metal part passes through the scanner.
  // A white ring indicates a beep without revealing the truth.
  // ------------------------------------------------------------

  function makeScanner() {
    const y = CY + 0.18;

    const belt = new M.RoundedRectangle({
      width: P ? 5.4 : 4.8,
      height: 0.42,
      cornerRadius: 0.15,
      color: C.muted,
      strokeWidth: 2
    });

    belt.setFill(C.card, 0.95);
    belt.moveTo([
      CX,
      y - 0.65,
      0
    ]);

    const rollers = Array.from(
      { length: 7 },
      (_, k) => {
        const c = new M.Circle({
          radius: 0.095,
          color: C.muted,
          strokeWidth: 1.5
        });

        c.setFill(C.muted, 0.25);
        c.moveTo([
          CX + (k - 3) * (P ? 0.69 : 0.60),
          y - 0.65,
          0
        ]);

        return c;
      }
    );

    const shell = new M.RoundedRectangle({
      width: 2.00,
      height: 1.65,
      cornerRadius: 0.17,
      color: C.cyan,
      strokeWidth: 2.5
    });

    shell.setFill(C.card, 0.92);
    shell.moveTo([
      CX,
      y + 0.33,
      0
    ]);

    const scanHead = rect(
      1.43,
      0.22,
      [
        CX,
        y + 0.88,
        0
      ],
      C.cyan,
      0.85
    );

    const part = square(
      [CX, y - 0.10, 0],
      C.muted,
      0.57
    );

    const beepRing = ring(
      [CX, y - 0.10, 0],
      0.43
    );

    const beam = line(
      [CX, y + 0.76, 0],
      [CX, y + 0.22, 0],
      C.cyan,
      2.5
    );

    const label = txt(
      'SCANNER',
      P ? 19 : 17,
      C.cyan,
      [CX, y + 1.43, 0]
    );

    const beep = tag(
      'BEEP!',
      WHITE,
      [CX, y - 1.20, 0],
      P ? 20 : 18
    );

    const base = [
      belt,
      ...rollers,
      shell,
      scanHead,
      beam,
      part,
      label
    ];

    return {
      part,
      scanHead,
      beepRing,
      beep,

      base,

      all: [
        ...base,
        beepRing,
        beep
      ]
    };
  }

  // ------------------------------------------------------------
  // Scanner habits: the two conditional beep rates.
  //
  // These are NOT the probability of a fault given a beep.
  // ------------------------------------------------------------

  function makeHabitStrips() {
    const SP = P ? 0.57 : 0.43;
    const SZ = P ? 0.34 : 0.25;
    const RR = P ? 0.25 : 0.19;

    const W =
      9 * SP + 2 * RR + 0.20;

    const topY = CY + (P ? 1.10 : 0.96);
    const bottomY = CY - (P ? 1.10 : 1.00);

    function strip(faulty, y) {
      const color = faulty ? ORANGE : TEAL;

      const parts = Array.from(
        { length: 10 },
        (_, k) => {
          const pos = [
            CX + (k - 4.5) * SP,
            y,
            0
          ];

          const beep = faulty
            ? k < 9
            : k === 0;

          return {
            beep,
            sq: square(pos, color, SZ),
            ring: beep ? ring(pos, RR) : null
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

      const value = tag(
        faulty
          ? '9 OF 10 BEEP: 90%'
          : '1 OF 10 BEEPS: 10%',
        WHITE,
        [CX, y - 0.55, 0],
        P ? 17 : 15,
        W
      );

      return {
        parts,
        y,
        label,
        value,

        all: [
          ...objects(parts),
          label,
          value
        ]
      };
    }

    const faulty = strip(true, topY);
    const sound = strip(false, bottomY);

    return {
      faulty,
      sound,
      W,
      H: 2 * RR + 0.20,

      all: [
        ...faulty.all,
        ...sound.all
      ]
    };
  }

  // ------------------------------------------------------------
  // Probability tree.
  //
  // Laptop: left to right.
  // Phone: top to bottom.
  //
  // Each branch has a dark outer stroke and a bright core.
  //
  // The endpoint percentages are shares of all original parts.
  // ------------------------------------------------------------

  const ROOT = P
    ? [0, 1.25, 0]
    : [-5.95, -0.62, 0];

  const F = P
    ? [-1.80, -0.55, 0]
    : [-3.55, 0.78, 0];

  const G = P
    ? [1.80, -0.55, 0]
    : [-3.55, -1.62, 0];

  const FB = P
    ? [-2.65, -2.65, 0]
    : [-0.78, 1.36, 0];

  const FQ = P
    ? [-0.89, -2.65, 0]
    : [-0.78, 0.15, 0];

  const GB = P
    ? [0.89, -2.65, 0]
    : [-0.78, -1.05, 0];

  const GQ = P
    ? [2.65, -2.65, 0]
    : [-0.78, -2.25, 0];

  const ROOT_W = P ? 1.85 : 1.45;
  const GROUP_W = P ? 1.85 : 1.48;
  const LEAF_W = P ? 1.48 : 1.42;

  const ROOT_H = P ? 0.68 : 0.62;
  const GROUP_H = P ? 0.68 : 0.62;
  const LEAF_H = P ? 0.68 : 0.62;

  function node(pos, label, count, color, width, height) {
    const r = new M.RoundedRectangle({
      width,
      height,
      cornerRadius: 0.13,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.96);
    r.moveTo(pos);

    const a = txt(
      label,
      P ? 16 : 15,
      color,
      [pos[0], pos[1] + 0.13, 0],
      false,
      width - 0.16
    );

    const b = txt(
      String(count),
      P ? 20 : 19,
      C.ink,
      [pos[0], pos[1] - 0.15, 0],
      true,
      width - 0.16
    );

    return new M.VGroup(r, a, b);
  }

  function edgePoints(a, b, aw, ah, bw, bh) {
    if (P) {
      return [
        [a[0], a[1] - ah / 2, 0],
        [b[0], b[1] + bh / 2, 0]
      ];
    }

    return [
      [a[0] + aw / 2, a[1], 0],
      [b[0] - bw / 2, b[1], 0]
    ];
  }

  function branch(a, b, aw, ah, bw, bh, color, glow) {
    const [start, end] = edgePoints(
      a, b,
      aw, ah,
      bw, bh
    );

    const halo = line(
      start,
      end,
      glow,
      8
    );

    const core = line(
      start,
      end,
      color,
      3
    );

    return new M.VGroup(
      halo,
      core
    );
  }

  function edgeLabel(
    a, b,
    aw, ah,
    bw, bh,
    value,
    color
  ) {
    const [start, end] = edgePoints(
      a, b,
      aw, ah,
      bw, bh
    );

    const pos = [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2 + 0.10,
      0
    ];

    const t = T(
      value,
      P ? 19 : 17,
      color,
      true
    );

    const w = t.getWidth() + 0.18;
    const h = P ? 0.35 : 0.32;

    const bg = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.09,
      color,
      strokeWidth: 1
    });

    bg.setFill(C.card, 1);
    bg.moveTo(pos);

    t.moveTo(pos);

    return new M.VGroup(bg, t);
  }

  function outcomePos(pos) {
    return P
      ? [pos[0], pos[1] - 0.90, 0]
      : [pos[0] + 1.85, pos[1], 0];
  }

  function outcome(pos, value, color) {
    const target = outcomePos(pos);

    const a = P
      ? [pos[0], pos[1] - LEAF_H / 2, 0]
      : [pos[0] + LEAF_W / 2, pos[1], 0];

    const b = P
      ? [target[0], target[1] + 0.22, 0]
      : [target[0] - 0.49, target[1], 0];

    const stem = line(
      a,
      b,
      color,
      2.5
    );

    const result = tag(
      value,
      color,
      target,
      P ? 20 : 18,
      P ? 1.35 : 1.05
    );

    return new M.VGroup(stem, result);
  }

  function makeTree() {
    const t = {};

    // First split.

    t.root = node(
      ROOT,
      'ALL PARTS',
      100,
      C.cyan,
      ROOT_W,
      ROOT_H
    );

    t.f = node(
      F,
      'FAULTY',
      10,
      ORANGE,
      GROUP_W,
      GROUP_H
    );

    t.g = node(
      G,
      'SOUND',
      90,
      TEAL,
      GROUP_W,
      GROUP_H
    );

    t.rf = branch(
      ROOT, F,
      ROOT_W, ROOT_H,
      GROUP_W, GROUP_H,
      ORANGE, ORANGE_GLOW
    );

    t.rg = branch(
      ROOT, G,
      ROOT_W, ROOT_H,
      GROUP_W, GROUP_H,
      TEAL, TEAL_GLOW
    );

    t.rfLabel = edgeLabel(
      ROOT, F,
      ROOT_W, ROOT_H,
      GROUP_W, GROUP_H,
      '10%', ORANGE
    );

    t.rgLabel = edgeLabel(
      ROOT, G,
      ROOT_W, ROOT_H,
      GROUP_W, GROUP_H,
      '90%', TEAL
    );

    // Faulty side.

    t.fb = node(
      FB,
      'BEEP',
      9,
      WHITE,
      LEAF_W,
      LEAF_H
    );

    t.fq = node(
      FQ,
      'NO BEEP',
      1,
      C.muted,
      LEAF_W,
      LEAF_H
    );

    t.fbe = branch(
      F, FB,
      GROUP_W, GROUP_H,
      LEAF_W, LEAF_H,
      ORANGE, ORANGE_GLOW
    );

    t.fqe = branch(
      F, FQ,
      GROUP_W, GROUP_H,
      LEAF_W, LEAF_H,
      C.muted, ORANGE_GLOW
    );

    t.fbeLabel = edgeLabel(
      F, FB,
      GROUP_W, GROUP_H,
      LEAF_W, LEAF_H,
      '90%', WHITE
    );

    t.fqeLabel = edgeLabel(
      F, FQ,
      GROUP_W, GROUP_H,
      LEAF_W, LEAF_H,
      '10%', C.muted
    );

    // Sound side.

    t.gb = node(
      GB,
      'BEEP',
      9,
      WHITE,
      LEAF_W,
      LEAF_H
    );

    t.gq = node(
      GQ,
      'NO BEEP',
      81,
      C.muted,
      LEAF_W,
      LEAF_H
    );

    t.gbe = branch(
      G, GB,
      GROUP_W, GROUP_H,
      LEAF_W, LEAF_H,
      TEAL, TEAL_GLOW
    );

    t.gqe = branch(
      G, GQ,
      GROUP_W, GROUP_H,
      LEAF_W, LEAF_H,
      C.muted, TEAL_GLOW
    );

    t.gbeLabel = edgeLabel(
      G, GB,
      GROUP_W, GROUP_H,
      LEAF_W, LEAF_H,
      '10%', WHITE
    );

    t.gqeLabel = edgeLabel(
      G, GQ,
      GROUP_W, GROUP_H,
      LEAF_W, LEAF_H,
      '90%', C.muted
    );

    t.fbResult = outcome(
      FB,
      '9%',
      ORANGE
    );

    t.gbResult = outcome(
      GB,
      '9%',
      TEAL
    );

    t.full = [
      t.rf,
      t.rg,
      t.fbe,
      t.fqe,
      t.gbe,
      t.gqe,

      t.root,
      t.f,
      t.g,
      t.fb,
      t.fq,
      t.gb,
      t.gq,

      t.rfLabel,
      t.rgLabel,
      t.fbeLabel,
      t.fqeLabel,
      t.gbeLabel,
      t.gqeLabel
    ];

    t.beepResults = [
      ...t.full,
      t.fbResult,
      t.gbResult
    ];

    // Conditioning removes the two no-beep endpoints.
    // The remaining branch labels retain their original meanings.

    t.onlyBeeps = [
      t.rf,
      t.rg,
      t.fbe,
      t.gbe,

      t.root,
      t.f,
      t.g,
      t.fb,
      t.gb,

      t.rfLabel,
      t.rgLabel,
      t.fbeLabel,
      t.gbeLabel,

      t.fbResult,
      t.gbResult
    ];

    return t;
  }

  function leafOutline(pos, color = WHITE) {
    return outline(
      LEAF_W + 0.15,
      LEAF_H + 0.15,
      pos,
      color
    );
  }

  function groupOutline(pos, color) {
    return outline(
      GROUP_W + 0.15,
      GROUP_H + 0.15,
      pos,
      color
    );
  }

  function markFaultyPath() {
    return marks([
      groupOutline(F, ORANGE),
      leafOutline(FB, ORANGE)
    ]);
  }

  function markSoundPath() {
    return marks([
      groupOutline(G, TEAL),
      leafOutline(GB, TEAL)
    ]);
  }

  function markBothBeeps() {
    return marks([
      leafOutline(FB, ORANGE),
      leafOutline(GB, TEAL)
    ]);
  }

  const TREE_TOTAL_POS = P
    ? [0, -4.70, 0]
    : [-3.80, -2.73, 0];

  function treeTotalTag() {
    return tag(
      'ALL BEEPS: 18%',
      WHITE,
      TREE_TOTAL_POS,
      P ? 19 : 17,
      P ? 5.8 : 3.3
    );
  }

  // ------------------------------------------------------------
  // 0–1: return to the hundred parts.
  // ------------------------------------------------------------

  const parts = makeGrid(false);

  const faulty = parts.filter(
    d => d.faulty
  );

  const sound = parts.filter(
    d => !d.faulty
  );

  await until(S(0));
  await play(
    ...picture(squares(parts), 1.65),
    ...say('BACK TO OUR 100 PARTS')
  );

  await until(S(1));
  await play(
    reveal(parts),
    ...fbox([
      ['10 faulty parts', ORANGE],
      ['90 sound parts', TEAL],
      ['100 parts altogether', C.ink]
    ]),
    ...say('10 FAULTY + 90 SOUND')
  );

  // ------------------------------------------------------------
  // 2–6: a beep arrives and the worker asks a question.
  //
  // The scanner's 90% beep rate on faulty parts is not yet
  // the answer to the worker's question.
  // ------------------------------------------------------------

  const scanner = makeScanner();

  // 2: one unknown part produces a beep.

  await until(S(2));
  await play(
    ...picture(scanner.base, 0.85),
    ...clearBox(),
    ...say('ONE PART PASSES THE SCANNER')
  );

  await play(
    ...picture(scanner.all, 0.55),
    new M.Flash(
      scanner.scanHead,
      { color: WHITE }
    ),
    ...say('THE SCANNER BEEPS', WHITE)
  );

  // 3: the worker wants the chance of a fault given this beep.

  await until(S(3));
  await play(
    new M.Indicate(
      scanner.beepRing,
      { color: WHITE }
    ),
    ...fbox([
      ['We know: it beeped', WHITE],
      ['Is this part faulty?', ORANGE],
      ['How likely?', C.violet]
    ], C.violet),
    ...say('HOW SURE ARE WE THAT IT IS FAULTY?', C.violet)
  );

  // 4: inspect the scanner's known habits.

  const habits = makeHabitStrips();

  await until(S(4));
  await play(
    ...fbox([
      ['Scanner specifications', C.cyan],
      ['Beep rate on faulty parts', ORANGE],
      ['Beep rate on sound parts', TEAL]
    ]),
    ...say('READ THE SCANNER’S HABITS')
  );

  // 5: 90% of faulty parts beep; 10% of sound parts beep.

  await until(S(5));
  await play(
    ...picture(habits.all, 1.25),
    ...fbox([
      ['Given faulty: 90% beep', ORANGE],
      ['Given sound: 10% beep', TEAL]
    ], WHITE),
    ...say('90% ON FAULTY, 10% ON SOUND', WHITE)
  );

  // 6: expose the tempting answer without accepting it.

  await until(S(6));
  await play(
    ...focus(
      habits.W,
      habits.H,
      [CX, habits.faulty.y, 0],
      C.amber
    ),
    ...fbox([
      ['90% sure of a fault?', C.amber],
      'Is that the right chance?',
      ['Let’s check.', C.violet]
    ], C.amber),
    ...say('IS THE ANSWER REALLY 90%?', C.amber)
  );

  // ------------------------------------------------------------
  // 7–9: establish the prior.
  //
  // Before any clue, there are ten faulty parts out of a hundred.
  // ------------------------------------------------------------

  const priorGrid = makeGrid(true);

  const priorFaulty = priorGrid.filter(
    d => d.faulty
  );

  // 7: return to the world before the beep.

  await until(S(7));
  await play(
    ...clearMarks(),
    ...picture(squares(priorGrid), 1.0),
    ...clearBox(),
    ...say('BEFORE THE BEEP, WHAT DID WE KNOW?')
  );

  // 8: calculate the starting chance.

  await until(S(8));
  await play(
    ...focus(
      GRID_W,
      ROW_H,
      [CX, TOP_Y, 0],
      ORANGE
    ),
    ...fbox([
      ['10 faulty parts', ORANGE],
      ['÷ 100 total parts', C.cyan],
      ['= 10%', C.amber]
    ], C.amber),
    ...say('OUR STARTING CHANCE IS 10%', C.amber)
  );

  // 9: give the starting chance its name.

  await until(S(9));
  await play(
    ...fbox([
      ['Prior', C.violet],
      ['Chance before the clue', C.ink],
      ['Prior = 10%', C.amber]
    ], C.violet),
    ...say('PRIOR = BEFORE THE CLUE', C.violet)
  );

  // ------------------------------------------------------------
  // 10–13: calculate the two ways a beep can happen.
  //
  // Faulty and beep = 10% × 90% = 9%.
  // Sound and beep  = 90% × 10% = 9%.
  // All beeps       = 9% + 9% = 18%.
  // ------------------------------------------------------------

  let tree = makeTree();

  const allBeepsTag = treeTotalTag();

  // 10: move from the original grid to the familiar tree.

  await until(S(10));
  await play(
    ...clearMarks(),
    ...picture(tree.full, 1.15),
    ...fbox([
      ['Prior: 10% faulty', C.violet],
      ['New clue: beep', WHITE]
    ], C.violet),
    ...say('THE BEEP ARRIVES: USE THE TREE', WHITE)
  );

  // 11: faulty, then beep.

  await until(S(11));
  await play(
    ...markFaultyPath(),
    pulse(
      [
        tree.rfLabel,
        tree.fbeLabel
      ],
      ORANGE,
      1.25
    ),
    ...fbox([
      ['Faulty: 10%', ORANGE],
      ['Beep given faulty: 90%', WHITE],
      ['10% × 90%', C.ink]
    ], ORANGE),
    ...say('WAY 1: FAULTY, THEN BEEP', ORANGE)
  );

  await until(S(11) + 3.1);

  await play(
    ...picture([
      ...tree.full,
      tree.fbResult
    ], 0.8),
    ...fbox([
      ['Faulty AND beep', ORANGE],
      ['10% × 90%', C.ink],
      ['= 9% of all parts', C.amber]
    ], ORANGE),
    ...say('WAY 1 CONTRIBUTES 9%', ORANGE)
  );

  // 12: sound, then beep.

  await until(S(12));
  await play(
    ...markSoundPath(),
    pulse(
      [
        tree.rgLabel,
        tree.gbeLabel
      ],
      TEAL,
      1.25
    ),
    ...fbox([
      ['Sound: 90%', TEAL],
      ['Beep given sound: 10%', WHITE],
      ['90% × 10%', C.ink]
    ], TEAL),
    ...say('WAY 2: SOUND, THEN BEEP', TEAL)
  );

  await until(S(12) + 3.0);

  await play(
    ...picture(tree.beepResults, 0.8),
    ...fbox([
      ['Sound AND beep', TEAL],
      ['90% × 10%', C.ink],
      ['= 9% of all parts', C.amber]
    ], TEAL),
    ...say('WAY 2 ALSO CONTRIBUTES 9%', TEAL)
  );

  // 13: total probability gives the overall beep rate.

  await until(S(13));
  await play(
    ...markBothBeeps(),
    ...picture([
      ...tree.beepResults,
      allBeepsTag
    ], 0.85),
    pulse(
      [
        tree.fbResult,
        tree.gbResult
      ],
      C.green,
      1.25
    ),
    ...fbox([
      ['Faulty beeps: 9%', ORANGE],
      ['Sound beeps:  9%', TEAL],
      ['All beeps: 18%', WHITE]
    ], C.green),
    ...say('ALL BEEPS: 9% + 9% = 18%', C.green)
  );

  // ------------------------------------------------------------
  // 14–17: condition on the beep.
  //
  // Fade the two no-beep paths.
  // Keep only the paths consistent with the known clue.
  //
  // The new chance is 9% / 18% = 50%.
  // ------------------------------------------------------------

  // 14: remove the no-beep paths from the possibilities.

  await until(S(14));
  await play(
    ...picture([
      ...tree.onlyBeeps,
      allBeepsTag
    ], 1.4),
    ...markBothBeeps(),
    ...fbox([
      ['Known fact: beep', WHITE],
      ['No-beep paths excluded', C.muted],
      ['Keep the beeping paths', C.violet]
    ], C.violet),
    ...say('KEEP ONLY THE PATHS WITH A BEEP', C.violet)
  );

  // 15: identify the numerator and denominator.

  await until(S(15));
  await play(
    new M.Indicate(
      allBeepsTag,
      { color: WHITE }
    ),
    new M.Indicate(
      tree.fbResult,
      { color: ORANGE }
    ),
    ...fbox([
      ['All beeps: 18% of parts', WHITE],
      ['Faulty beeps: 9% of parts', ORANGE]
    ], WHITE),
    ...say('9% FAULTY BEEPS OUT OF 18% TOTAL BEEPS', WHITE)
  );

  // 16: divide within the known group.

  await until(S(16));
  await play(
    ...fractionBox(
      'Chance of faulty given beep',
      '9% faulty beeps',
      '18% all beeps',
      '= 9/18 = 1/2',
      C.violet
    ),
    ...say('9 OUT OF 18 IS ONE HALF', C.violet)
  );

  // 17: reveal the correct updated probability.

  await until(S(17));
  await play(
    ...fractionBox(
      'Chance of faulty given beep',
      '9%',
      '18%',
      '= 50%',
      C.amber
    ),
    ...say('THE ANSWER IS 50%, NOT 90%', C.amber)
  );

  // ------------------------------------------------------------
  // 18: verify the result using the actual hundred squares.
  //
  // First show all 100 parts.
  // Fade the 82 quiet parts.
  // Gather the 18 ringed parts into two equal rows.
  // ------------------------------------------------------------

  const checkGrid = makeGrid(true);

  const checkBeeps = checkGrid.filter(
    d => d.beep
  );

  const checkFaultyBeeps = checkBeeps.filter(
    d => d.faulty
  );

  const checkSoundBeeps = checkBeeps.filter(
    d => !d.faulty
  );

  const checkLabels = compactLabels();

  await until(S(18));
  await play(
    ...clearMarks(),
    ...picture(objects(checkGrid), 1.15),
    ...fbox([
      ['Check the original grid', C.ink],
      ['18 white rings', WHITE],
      ['9 orange rings', ORANGE]
    ]),
    ...say('CHECK WITH THE 100 PARTS')
  );

  await until(S(18) + 1.7);

  await play(
    ...picture(objects(checkBeeps), 1.0),
    ...fbox([
      ['18 beeping parts', WHITE],
      ['82 quiet parts excluded', C.muted]
    ], WHITE),
    ...say('ONLY THE 18 BEEPS REMAIN', WHITE)
  );

  await play(
    gatherBeeps(checkBeeps)
  );

  await play(
    ...picture([
      ...objects(checkBeeps),
      ...checkLabels.all
    ], 0.55),
    ...fbox([
      ['9 faulty + 9 sound', C.ink],
      ['9 ÷ 18 = 50%', C.amber],
      ['It matches', C.green]
    ], C.green),
    ...say('HALF ARE ORANGE: IT MATCHES', C.green)
  );

  // ------------------------------------------------------------
  // 19–20: name the posterior and compare it with the prior.
  // ------------------------------------------------------------

  // 19: posterior means after the clue.

  await until(S(19));
  await play(
    ...focus(
      COMPACT_W,
      COMPACT_H,
      [CX, CY, 0],
      WHITE
    ),
    ...fbox([
      ['Posterior', C.green],
      ['Chance after the clue', C.ink],
      ['Posterior = 50%', C.amber]
    ], C.green),
    ...say('POSTERIOR = AFTER THE CLUE', C.green)
  );

  // 20: compare before and after.

  const updatedTag = tag(
    '10% → 50%',
    C.amber,
    [
      CX,
      CY - 1.85,
      0
    ],
    P ? 24 : 22
  );

  await until(S(20));
  await play(
    ...clearMarks(),
    ...picture([
      ...objects(checkBeeps),
      ...checkLabels.all,
      updatedTag
    ], 0.8),
    ...fbox([
      ['Prior:     10%', C.violet],
      ['   ↓ new clue: beep', WHITE],
      ['Posterior: 50%', C.amber],
      ['More likely, not certain', C.green]
    ], C.green),
    ...say('10% → 50%: A BIG STEP, NOT CERTAINTY', C.amber)
  );

  // ------------------------------------------------------------
  // 21–23: why the answer is not ninety percent.
  //
  // Sound parts are much more common.
  // A small false-alarm rate applied to a large group
  // produces as many beeps as a high true-alarm rate
  // applied to a small group.
  // ------------------------------------------------------------

  const alarmGrid = makeGrid(true);

  const alarmFaulty = alarmGrid.filter(
    d => d.faulty
  );

  const alarmSound = alarmGrid.filter(
    d => !d.faulty
  );

  const alarmBeeps = alarmGrid.filter(
    d => d.beep
  );

  const trueAlarms = alarmBeeps.filter(
    d => d.faulty
  );

  const falseAlarms = alarmBeeps.filter(
    d => !d.faulty
  );

  // 21: reveal the unequal group sizes.

  await until(S(21));
  await play(
    ...picture(squares(alarmGrid), 1.1),
    ...focus(
      GRID_W,
      SOUND_H,
      [CX, SOUND_Y, 0],
      TEAL
    ),
    ...fbox([
      ['Why not 90%?', C.amber],
      ['10 faulty parts', ORANGE],
      ['90 sound parts', TEAL],
      ['Sound parts are more common', TEAL]
    ], C.violet),
    ...say('THERE ARE SO MANY SOUND PARTS', TEAL)
  );

  // 22: nine false alarms from ninety sound parts.

  await until(S(22));
  await play(
    ...picture([
      ...squares(alarmGrid),
      ...rings(falseAlarms)
    ], 1.0),
    ...fbox([
      ['90 sound parts', TEAL],
      ['10% of them beep', WHITE],
      ['90 × 10% = 9', C.amber]
    ], TEAL),
    ...say('A SMALL RATE ON A LARGE GROUP', TEAL)
  );

  await until(S(22) + 4.0);

  await play(
    pulse(
      rings(falseAlarms),
      TEAL,
      1.4
    ),
    ...fbox([
      ['9 false alarms', TEAL],
      'False alarm =',
      ['a beep on a sound part', WHITE]
    ], TEAL),
    ...say('FALSE ALARM = SOUND PART THAT BEEPS', TEAL)
  );

  // 23: compare nine true alarms with nine false alarms.

  const alarmLabels = compactLabels(
    '9 TRUE ALARMS',
    '9 FALSE ALARMS'
  );

  await until(S(23));
  await play(
    ...focus(
      GRID_W,
      ROW_H,
      [CX, TOP_Y, 0],
      ORANGE
    ),
    ...picture(objects(alarmGrid), 0.9),
    ...fbox([
      ['10 faulty parts', ORANGE],
      ['90% of them beep', WHITE],
      ['9 true alarms', ORANGE]
    ], ORANGE),
    ...say('AND THERE ARE 9 TRUE ALARMS', ORANGE)
  );

  await until(S(23) + 2.4);

  await play(
    ...clearMarks(),
    ...picture(objects(alarmBeeps), 0.85)
  );

  await play(
    gatherBeeps(alarmBeeps)
  );

  await play(
    ...picture([
      ...objects(alarmBeeps),
      ...alarmLabels.all
    ], 0.65),
    ...fbox([
      ['True alarms:  9', ORANGE],
      ['False alarms: 9', TEAL],
      ['Exactly as many', C.amber]
    ], C.amber),
    ...say('9 TRUE ALARMS = 9 FALSE ALARMS', C.amber)
  );

  // ------------------------------------------------------------
  // 24: name Bayes' rule.
  //
  // Keep the visual tied to the factory example.
  // The brief historical note accompanies the narration.
  // ------------------------------------------------------------

  const bayesTitle = tag(
    'BAYES’ RULE',
    C.green,
    [
      CX,
      CY + 1.85,
      0
    ],
    P ? 25 : 23
  );

  await until(S(24));
  await play(
    ...picture([
      ...objects(alarmBeeps),
      ...alarmLabels.all,
      bayesTitle
    ], 0.9),
    ...fbox([
      ['Bayes’ rule', C.green],
      'Update a starting chance',
      'after learning a clue.'
    ], C.green),
    ...say('THIS IS BAYES’ RULE', C.green)
  );

  await until(S(24) + 4.0);

  await play(
    ...fbox([
      ['Thomas Bayes', C.violet],
      'English church minister',
      'Studied probability',
      'in the 1700s'
    ], C.violet),
    ...say('NAMED AFTER THOMAS BAYES', C.violet)
  );

  // ------------------------------------------------------------
  // 25–30: build the Bayes formula one piece at a time.
  //
  //                            chance of faulty
  //                         × chance of beep given faulty
  // Chance of faulty given beep = -------------------------
  //                                chance of beep
  //
  //                         10% × 90%
  //                       = ----------
  //                            18%
  //
  //                       = 9% / 18%
  //                       = 50%.
  // ------------------------------------------------------------

  tree = makeTree();

  const formulaTotal = treeTotalTag();

  // 25: return to the tree that supplied the two ingredients.

  await until(S(25));
  await play(
    ...picture([
      ...tree.beepResults,
      formulaTotal
    ], 1.1),
    ...clearBox(),
    ...say('THE RULE IN ONE LINE')
  );

  // 26: establish a top number divided by a bottom number.

  await until(S(26));
  await play(
    ...markBothBeeps(),
    ...fractionBox(
      'Chance of faulty given beep',
      'Top number',
      'Bottom number',
      '',
      C.cyan
    ),
    ...say('TOP NUMBER DIVIDED BY BOTTOM NUMBER')
  );

  // 27: build the numerator using the product rule.

  await until(S(27));
  await play(
    ...markFaultyPath(),
    pulse(
      [
        tree.rfLabel,
        tree.fbeLabel
      ],
      ORANGE,
      1.25
    ),
    ...fractionBox(
      'Chance of faulty given beep',
      [
        'Chance of faulty',
        '× chance of beep given faulty'
      ],
      'Bottom number',
      '',
      ORANGE
    ),
    ...say('THE TOP: FAULTY × BEEP GIVEN FAULTY', ORANGE)
  );

  // 28: complete the denominator.

  await until(S(28));
  await play(
    ...markBothBeeps(),
    ...fractionBox(
      'Chance of faulty given beep',
      [
        'Chance of faulty',
        '× chance of beep given faulty'
      ],
      'Chance of beep',
      '',
      C.cyan
    ),
    ...say('THE BOTTOM: CHANCE OF ANY BEEP', WHITE)
  );

  // 29: substitute the factory's probabilities.

  await until(S(29));
  await play(
    ...markFaultyPath(),
    ...fractionBox(
      'Chance of faulty given beep',
      '10% × 90%',
      '18%',
      '',
      ORANGE
    ),
    ...say('PUT IN OUR FACTORY’S NUMBERS', ORANGE)
  );

  await until(S(29) + 2.2);

  await play(
    new M.Indicate(
      tree.fbResult,
      { color: ORANGE }
    ),
    ...fractionBox(
      'Chance of faulty given beep',
      '9%',
      '18%',
      '',
      ORANGE
    ),
    ...say('THE TOP IS 9%', ORANGE)
  );

  // 30: divide to obtain the posterior.

  await until(S(30));
  await play(
    ...markBothBeeps(),
    ...fractionBox(
      'Chance of faulty given beep',
      '9%',
      '18%',
      '= 1/2 = 50%',
      C.amber
    ),
    ...say('9% ÷ 18% = 50%', C.amber)
  );

  // ------------------------------------------------------------
  // 31–33: connect Bayes' rule with the preceding lessons.
  //
  // Top: product rule.
  // Bottom: total probability.
  // Division: conditioning.
  // ------------------------------------------------------------

  const formulaCompact = makeCompact();

  const formulaLabels = compactLabels();

  // 31: explain the fraction in everyday words.

  await until(S(31));
  await play(
    ...clearMarks(),
    ...picture([
      ...formulaCompact.all,
      ...formulaLabels.all
    ], 1.1),
    ...fractionBox(
      'Chance of faulty given beep',
      'Beeps from faulty parts',
      'All beeps',
      '= 9/18',
      C.cyan
    ),
    ...say('FAULTY BEEPS DIVIDED BY ALL BEEPS')
  );

  // 32: the numerator and denominator come from earlier rules.

  const topProductLabel = tag(
    'TOP: PRODUCT RULE',
    ORANGE,
    [
      CX,
      CY + 1.90,
      0
    ],
    P ? 18 : 16
  );

  const bottomTotalLabel = tag(
    'BOTTOM: TOTAL PROBABILITY',
    WHITE,
    [
      CX,
      CY - 1.85,
      0
    ],
    P ? 18 : 16,
    P ? 6.2 : 5.0
  );

  await until(S(32));
  await play(
    ...picture([
      ...formulaCompact.all,
      ...formulaLabels.all,
      topProductLabel,
      bottomTotalLabel
    ], 0.85),
    ...marks([
      compactFaultyOutline()
    ]),
    ...fbox([
      ['Top: product rule', ORANGE],
      ['10% × 90% = 9%', ORANGE],
      ['Bottom: total probability', WHITE],
      ['9% + 9% = 18%', WHITE]
    ], C.violet),
    ...say('PRODUCT RULE ON TOP, TOTAL PROBABILITY BELOW', C.violet)
  );

  await until(S(32) + 2.2);

  await play(
    ...focus(
      COMPACT_W,
      COMPACT_H,
      [CX, CY, 0],
      WHITE
    )
  );

  // 33: conditioning divides by the group consistent with the clue.

  await until(S(33));
  await play(
    ...picture([
      ...formulaCompact.all,
      ...formulaLabels.all
    ], 0.85),
    ...fractionBox(
      'Condition on the beep',
      '9 wanted parts',
      '18 possible parts',
      '= 50%',
      C.green
    ),
    ...say('DIVIDING BY ALL BEEPS IS CONDITIONING', C.green)
  );

  await until(S(33) + 3.6);

  await play(
    ...fbox([
      ['Bayes’ rule combines:', C.green],
      ['1. Product rule', ORANGE],
      ['2. Total probability', WHITE],
      ['3. Conditioning', C.violet]
    ], C.green),
    ...say('THREE IDEAS BROUGHT TOGETHER', C.green)
  );

  // ------------------------------------------------------------
  // 34–37: turn the conditional question around.
  //
  // Given faulty, chance of beep = 90%.
  //
  // Given beep, chance of faulty = 50%.
  //
  // Same factory, same parts, different known groups.
  // ------------------------------------------------------------

  // Ten faulty parts, nine with white rings.

  const REVERSE_SP = P ? 0.56 : 0.42;

  const REVERSE_SIZE = P ? 0.34 : 0.25;
  const REVERSE_RADIUS = P ? 0.25 : 0.19;

  const REVERSE_W =
    9 * REVERSE_SP + 2 * REVERSE_RADIUS + 0.22;

  function makeFaultyStrip() {
    const parts = Array.from(
      { length: 10 },
      (_, k) => {
        const pos = [
          CX + (k - 4.5) * REVERSE_SP,
          CY,
          0
        ];

        const beep = k < 9;

        return {
          beep,
          faulty: true,
          sq: square(
            pos,
            ORANGE,
            REVERSE_SIZE
          ),
          ring: beep
            ? ring(pos, REVERSE_RADIUS)
            : null
        };
      }
    );

    const heading = txt(
      'KNOWN GROUP: 10 FAULTY PARTS',
      P ? 18 : 16,
      ORANGE,
      [CX, CY + 0.82, 0],
      false,
      REVERSE_W + 0.3
    );

    const answer = tag(
      '9 OF 10 BEEP: 90%',
      WHITE,
      [CX, CY - 0.82, 0],
      P ? 19 : 17,
      REVERSE_W
    );

    return {
      parts,
      heading,
      answer,

      all: [
        ...objects(parts),
        heading,
        answer
      ]
    };
  }

  const reverseFaulty = makeFaultyStrip();

  const reverseBeeps = makeCompact();

  const reverseLabels = compactLabels();

  // 34: introduce the idea of reversing the question.

  await until(S(34));
  await play(
    ...clearMarks(),
    ...fbox([
      ['Turn the question around', C.violet],
      ['Faulty → beep', ORANGE],
      ['Beep → faulty', WHITE]
    ], C.violet),
    ...say('BAYES’ RULE TURNS THE QUESTION AROUND', C.violet)
  );

  // 35: scanner specifications answer the first question.

  await until(S(35));
  await play(
    ...picture(reverseFaulty.all, 1.15),
    ...focus(
      REVERSE_W,
      2 * REVERSE_RADIUS + 0.20,
      [CX, CY, 0],
      ORANGE
    ),
    ...fbox([
      ['Given a fault', ORANGE],
      ['How likely is a beep?', WHITE],
      ['9 ÷ 10 = 90%', C.amber]
    ], ORANGE),
    ...say('GIVEN FAULTY: 90% BEEP', ORANGE)
  );

  // 36: the worker needs the opposite question.

  await until(S(36));
  await play(
    ...picture([
      ...reverseBeeps.all,
      ...reverseLabels.all
    ], 1.15),
    ...focus(
      COMPACT_W,
      COMPACT_H,
      [CX, CY, 0],
      WHITE
    ),
    ...fbox([
      ['Given a beep', WHITE],
      ['How likely is a fault?', ORANGE],
      ['9 ÷ 18 = 50%', C.amber]
    ], WHITE),
    ...say('GIVEN BEEP: 50% FAULTY', WHITE)
  );

  // 37: Bayes' rule makes this reversal possible.

  await until(S(37));
  await play(
    ...clearMarks(),
    ...fbox([
      ['Scanner tells us:', C.muted],
      ['Beep given faulty: 90%', ORANGE],
      ['Worker needs:', C.violet],
      ['Faulty given beep: 50%', C.amber]
    ], C.green),
    ...say('FROM THE FIRST QUESTION TO THE SECOND', C.green)
  );

  // ------------------------------------------------------------
  // 38–39: common trap.
  //
  // Swapping the event and the condition generally changes
  // the probability.
  //
  // Show two successive pictures with different denominators.
  // ------------------------------------------------------------

  const trapFaulty = makeFaultyStrip();

  const trapBeeps = makeCompact();

  const trapLabels = compactLabels();

  // 38: warn against swapping the questions.

  await until(S(38));
  await play(
    ...fbox([
      ['Common trap', C.amber],
      'Swapping the question',
      'and the known fact.'
    ], C.amber),
    ...say('DO NOT SWAP THE TWO QUESTIONS', C.amber)
  );

  // 39: directly compare the two different counting groups.

  await until(S(39));
  await play(
    ...picture(trapFaulty.all, 0.9),
    ...focus(
      REVERSE_W,
      2 * REVERSE_RADIUS + 0.20,
      [CX, CY, 0],
      ORANGE
    ),
    ...fbox([
      ['Beep given faulty', WHITE],
      ['Known group: 10 faulty', ORANGE],
      ['9/10 = 90%', C.amber]
    ], ORANGE),
    ...say('BEEP GIVEN FAULTY: OUT OF 10', ORANGE)
  );

  await until(S(39) + 2.3);

  await play(
    ...picture([
      ...trapBeeps.all,
      ...trapLabels.all
    ], 0.9),
    ...focus(
      COMPACT_W,
      COMPACT_H,
      [CX, CY, 0],
      WHITE
    ),
    ...fbox([
      ['Faulty given beep', ORANGE],
      ['Known group: 18 beeps', WHITE],
      ['9/18 = 50%', C.amber]
    ], WHITE),
    ...say('FAULTY GIVEN BEEP: OUT OF 18', WHITE)
  );

  // ------------------------------------------------------------
  // 40: everyday comparison.
  //
  // Most professional basketball players are tall.
  // Most tall people are not professional basketball players.
  //
  // Illustrative schematic only, not population statistics.
  //
  // Four professional players:
  // three tall, one not tall.
  //
  // Eight other people:
  // six tall, two not tall.
  //
  // Tall people: nine.
  // Professional players among tall people: three.
  //
  // No invented percentages are displayed as real-world facts.
  // ------------------------------------------------------------

  const PEOPLE_TOP = CY + 0.85;
  const PEOPLE_BOTTOM = CY - 0.85;

  const PEOPLE_SP = P ? 0.53 : 0.42;

  const PEOPLE_X0 =
    CX - (P ? 1.00 : 0.85);

  const SHORT_X =
    CX + (P ? 2.05 : 1.65);

  function person(x, y, tall, professional) {
    const color = professional
      ? C.violet
      : C.muted;

    const h = tall
      ? 0.91
      : 0.60;

    const feet = y - 0.42;
    const headY = feet + h;

    const head = new M.Circle({
      radius: P ? 0.105 : 0.09,
      color,
      strokeWidth: 1.5
    });

    head.setFill(color, 0.98);
    head.moveTo([
      x,
      headY,
      0
    ]);

    const shoulder = headY - 0.16;
    const hip = feet + h * 0.35;

    const body = line(
      [x, shoulder, 0],
      [x, hip, 0],
      color,
      4
    );

    const arms = line(
      [x - 0.15, shoulder - 0.08, 0],
      [x + 0.15, shoulder - 0.08, 0],
      color,
      2.5
    );

    const leg1 = line(
      [x, hip, 0],
      [x - 0.10, feet, 0],
      color,
      2.5
    );

    const leg2 = line(
      [x, hip, 0],
      [x + 0.10, feet, 0],
      color,
      2.5
    );

    return new M.VGroup(
      head,
      body,
      arms,
      leg1,
      leg2
    );
  }

  const proTall = Array.from(
    { length: 3 },
    (_, k) => person(
      PEOPLE_X0 + k * PEOPLE_SP,
      PEOPLE_TOP,
      true,
      true
    )
  );

  const proShort = [
    person(
      SHORT_X,
      PEOPLE_TOP,
      false,
      true
    )
  ];

  const otherTall = Array.from(
    { length: 6 },
    (_, k) => {
      const row = Math.floor(k / 3);
      const col = k % 3;

      return person(
        PEOPLE_X0 + col * PEOPLE_SP,
        PEOPLE_BOTTOM - row * 1.03,
        true,
        false
      );
    }
  );

  const otherShort = [
    person(
      SHORT_X,
      PEOPLE_BOTTOM,
      false,
      false
    ),

    person(
      SHORT_X,
      PEOPLE_BOTTOM - 1.03,
      false,
      false
    )
  ];

  const tallCenterX =
    PEOPLE_X0 + PEOPLE_SP;

  const tallLabel = txt(
    'TALL',
    P ? 17 : 16,
    C.amber,
    [
      tallCenterX,
      PEOPLE_TOP + 0.96,
      0
    ]
  );

  const shortLabel = txt(
    'NOT TALL',
    P ? 17 : 15,
    C.muted,
    [
      SHORT_X,
      PEOPLE_TOP + 0.96,
      0
    ]
  );

  const proLabel = txt(
    'PRO PLAYERS',
    P ? 16 : 14,
    C.violet,
    [
      CX - (P ? 2.45 : 2.05),
      PEOPLE_TOP,
      0
    ],
    false,
    P ? 1.55 : 1.35
  );

  const othersLabel = txt(
    'OTHER PEOPLE',
    P ? 16 : 14,
    C.muted,
    [
      CX - (P ? 2.45 : 2.05),
      PEOPLE_BOTTOM - 0.50,
      0
    ],
    false,
    P ? 1.55 : 1.35
  );

  const analogyNote = txt(
    'Illustration, not population data',
    P ? 15 : 14,
    C.muted,
    [
      CX,
      PEOPLE_BOTTOM - 1.75,
      0
    ]
  );

  const peoplePicture = [
    ...proTall,
    ...proShort,
    ...otherTall,
    ...otherShort,
    tallLabel,
    shortLabel,
    proLabel,
    othersLabel,
    analogyNote
  ];

  const proLeft =
    PEOPLE_X0 - 0.30;

  const proRight =
    SHORT_X + 0.30;

  const proOutlinePos = [
    (proLeft + proRight) / 2,
    PEOPLE_TOP + 0.05,
    0
  ];

  const proOutlineW =
    proRight - proLeft;

  const tallTop =
    PEOPLE_TOP + 0.65;

  const tallBottom =
    PEOPLE_BOTTOM - 1.03 - 0.55;

  const tallOutlinePos = [
    tallCenterX,
    (tallTop + tallBottom) / 2,
    0
  ];

  await until(S(40));
  await play(
    ...clearMarks(),
    ...picture(peoplePicture, 1.15),
    ...focus(
      proOutlineW,
      1.20,
      proOutlinePos,
      C.violet
    ),
    ...fbox([
      ['Given: pro basketball player', C.violet],
      ['Likely to be tall', C.amber]
    ], C.violet),
    ...say('MOST PRO BASKETBALL PLAYERS ARE TALL', C.violet)
  );

  await until(S(40) + 3.1);

  await play(
    ...focus(
      2 * PEOPLE_SP + 0.55,
      tallTop - tallBottom,
      tallOutlinePos,
      C.amber
    ),
    ...fbox([
      ['Given: tall person', C.amber],
      'Usually not a professional',
      'basketball player.'
    ], C.amber),
    ...say('BUT MOST TALL PEOPLE ARE NOT PRO PLAYERS', C.amber)
  );

  // ------------------------------------------------------------
  // 41: preview the next lesson, base rates.
  //
  // The same scanner may have a different predictive value
  // in a factory with a different starting fault rate.
  // Leave factory B's calculation for the next lesson.
  // ------------------------------------------------------------

  const previewScanner = makeScanner();

  const factoryATag = tag(
    'FACTORY A',
    C.cyan,
    [
      CX - (P ? 1.70 : 1.50),
      CY - 1.95,
      0
    ],
    P ? 18 : 16
  );

  const factoryBTag = tag(
    'FACTORY B',
    C.violet,
    [
      CX + (P ? 1.70 : 1.50),
      CY - 1.95,
      0
    ],
    P ? 18 : 16
  );

  const factoryARate = txt(
    '50% given beep',
    P ? 17 : 15,
    C.amber,
    [
      CX - (P ? 1.70 : 1.50),
      CY - 2.42,
      0
    ],
    false,
    P ? 2.8 : 2.5
  );

  const factoryBRate = txt(
    '? given beep',
    P ? 17 : 15,
    C.violet,
    [
      CX + (P ? 1.70 : 1.50),
      CY - 2.42,
      0
    ],
    false,
    P ? 2.8 : 2.5
  );

  // Raise the factory labels on laptop to stay above y = -3.

  if (!P) {
    factoryATag.moveTo([
      CX - 1.50,
      CY - 1.65,
      0
    ]);

    factoryBTag.moveTo([
      CX + 1.50,
      CY - 1.65,
      0
    ]);

    factoryARate.moveTo([
      CX - 1.50,
      CY - 2.08,
      0
    ]);

    factoryBRate.moveTo([
      CX + 1.50,
      CY - 2.08,
      0
    ]);
  }

  await until(S(41));
  await play(
    ...clearMarks(),
    ...picture([
      ...previewScanner.base,
      factoryATag,
      factoryBTag,
      factoryARate,
      factoryBRate
    ], 1.15),
    ...fbox([
      ['Next lesson: base rates', C.violet],
      'Same scanner.',
      'Different factory.',
      ['Same answer?', C.amber]
    ], C.violet),
    ...say('NEXT: SAME SCANNER, DIFFERENT FACTORY', C.violet)
  );

  // ------------------------------------------------------------
  // 42: final takeaway.
  //
  // Begin with the prior.
  // A beep arrives.
  // Keep only the parts consistent with that clue.
  // Count nine faulty parts among eighteen possibilities.
  // Finish with the posterior.
  // ------------------------------------------------------------

  const finalGrid = makeGrid(true);

  const finalBeeps = finalGrid.filter(
    d => d.beep
  );

  const finalLabels = compactLabels(
    '9 FAULTY BEEPS',
    '9 SOUND BEEPS'
  );

  const finalUpdate = tag(
    'PRIOR 10% → POSTERIOR 50%',
    C.green,
    [
      CX,
      CY - (P ? 2.45 : 1.85),
      0
    ],
    P ? 20 : 18,
    P ? 6.5 : 5.6
  );

  await until(S(42));
  await play(
    ...picture(squares(finalGrid), 1.0),
    ...fbox([
      ['Prior', C.violet],
      ['10 faulty out of 100', ORANGE],
      ['Starting chance: 10%', C.amber]
    ], C.violet),
    ...say('START WITH THE PRIOR: 10%', C.violet)
  );

  await until(S(42) + 1.4);

  await play(
    ...picture(objects(finalGrid), 0.75),
    ...fbox([
      ['New clue: beep', WHITE],
      ['18 parts fit the clue', C.ink]
    ], WHITE),
    ...say('A NEW CLUE ARRIVES', WHITE)
  );

  await until(S(42) + 2.7);

  await play(
    ...picture(objects(finalBeeps), 0.85),
    ...fractionBox(
      'Chance of faulty given beep',
      '9 faulty beeps',
      '18 total beeps',
      '= 50%',
      C.amber
    ),
    ...say('KEEP ONLY THE WAYS THE CLUE CAN HAPPEN', C.violet)
  );

  await play(
    gatherBeeps(finalBeeps)
  );

  await play(
    ...picture([
      ...objects(finalBeeps),
      ...finalLabels.all,
      finalUpdate
    ], 0.70),
    ...focus(
      COMPACT_W,
      COMPACT_H,
      [CX, CY, 0],
      WHITE
    ),
    ...fbox([
      ['Bayes’ rule', C.green],
      ['Prior: 10%', C.violet],
      ['Clue: beep', WHITE],
      ['Posterior: 50%', C.amber]
    ], C.green),
    ...say('BAYES’ RULE: UPDATE YOUR CHANCE AFTER A CLUE', C.green)
  );

  await until(E(42));
}
