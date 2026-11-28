// lesson 4.2.4
// The law of total probability: adding all the ways something can happen.
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
  // Objects already visible remain attached to the scene.
  // Only entering and departing objects receive fade animations.
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
  // Same arrangement as the previous lessons:
  // Top row: ten faulty parts, first nine beep.
  // Other nine rows: sound parts, one beep in each row.
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

  const ROW_H =
    2 * RADIUS + 0.15;

  const FAULTY_ROW_Y =
    CY + 4.5 * PITCH;

  const SOUND_CENTER_Y =
    CY - 0.5 * PITCH;

  const SOUND_H =
    8 * PITCH + 2 * RADIUS + 0.15;

  // ------------------------------------------------------------
  // Compact picture of the eighteen beeping parts.
  // Nine faulty beeps and nine sound beeps.
  // ------------------------------------------------------------

  const COMPACT_PITCH = P ? 0.61 : 0.47;
  const COMPACT_DY = P ? 0.57 : 0.47;

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

    return new M.LaggedStart(
      moves,
      {
        lagRatio: 0.012,
        runTime: 1.6
      }
    );
  }

  // ------------------------------------------------------------
  // Scanner habits.
  //
  // Two normalized groups of ten symbols:
  // Faulty: nine of every ten beep.
  // Sound: one of every ten beeps.
  //
  // These strips illustrate rates, not a new batch of parts.
  // ------------------------------------------------------------

  const RATE_SP = P ? 0.57 : 0.43;

  const RATE_SIZE = P ? 0.34 : 0.25;
  const RATE_RADIUS = P ? 0.25 : 0.19;

  const RATE_TOP = CY + (P ? 0.95 : 0.82);
  const RATE_BOTTOM = CY - (P ? 0.95 : 0.88);

  const RATE_W =
    9 * RATE_SP + 2 * RATE_RADIUS + 0.22;

  function rateStrip(faulty) {
    const color = faulty ? ORANGE : TEAL;

    const y = faulty
      ? RATE_TOP
      : RATE_BOTTOM;

    const parts = Array.from(
      { length: 10 },
      (_, k) => {
        const pos = [
          CX + (k - 4.5) * RATE_SP,
          y,
          0
        ];

        const beep = faulty
          ? k < 9
          : k === 0;

        return {
          sq: square(pos, color, RATE_SIZE),
          ring: beep ? ring(pos, RATE_RADIUS) : null,
          beep
        };
      }
    );

    const label = txt(
      faulty
        ? 'OUT OF EVERY 10 FAULTY PARTS'
        : 'OUT OF EVERY 10 SOUND PARTS',
      P ? 18 : 16,
      color,
      [CX, y + 0.53, 0],
      false,
      RATE_W
    );

    const value = tag(
      faulty ? '9 BEEPS IN 10: 90%' : '1 BEEP IN 10: 10%',
      WHITE,
      [CX, y - 0.57, 0],
      P ? 18 : 16
    );

    return {
      parts,
      label,
      value,

      base: [
        ...parts.map(d => d.sq),
        label
      ],

      all: [
        ...objects(parts),
        label,
        value
      ]
    };
  }

  function makeHabits() {
    const faulty = rateStrip(true);
    const sound = rateStrip(false);

    return {
      faulty,
      sound,
      base: [
        ...faulty.base,
        ...sound.base
      ],
      all: [
        ...faulty.all,
        ...sound.all
      ]
    };
  }

  // ------------------------------------------------------------
  // Probability tree.
  //
  // Same orientation and visual language as lesson 4.2.2.
  //
  // Laptop: left to right.
  // Phone: top to bottom.
  //
  // Endpoints:
  // Faulty and beep     = 9%
  // Faulty and no beep  = 1%
  // Sound and beep      = 9%
  // Sound and no beep   = 81%
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
      : [pos[0] + 1.90, pos[1], 0];
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

    // Root and first split.

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

    // The two beep outcomes are the relevant endpoints
    // for today's overall probability question.

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

    t.fqResult = outcome(
      FQ,
      '1%',
      C.muted
    );

    t.gqResult = outcome(
      GQ,
      '81%',
      C.muted
    );

    t.firstSplit = [
      t.rf,
      t.rg,
      t.root,
      t.f,
      t.g,
      t.rfLabel,
      t.rgLabel
    ];

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

    return t;
  }

  // ------------------------------------------------------------
  // Highlight the two ways of reaching a beep.
  // Outlines are independent coordinate-based objects.
  // ------------------------------------------------------------

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

  const TOTAL_POS = P
    ? [0, -4.70, 0]
    : [-3.65, -2.73, 0];

  function totalTag() {
    return tag(
      '9% + 9% = 18%',
      C.green,
      TOTAL_POS,
      P ? 21 : 19
    );
  }

  // ------------------------------------------------------------
  // 0–3: the original hundred parts and the manager's question.
  // ------------------------------------------------------------

  const parts = makeGrid(false);

  const faulty = parts.filter(d => d.faulty);

  const sound = parts.filter(d => !d.faulty);

  const beeping = parts.filter(d => d.beep);

  const faultyBeeps = beeping.filter(d => d.faulty);

  const soundBeeps = beeping.filter(d => !d.faulty);

  await until(S(0));
  await play(
    ...picture(squares(parts), 1.6),
    ...say('BACK TO OUR 100 PARTS')
  );

  // 1: reveal the actual fault status.

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

  // 2: ask about all scanner beeps, regardless of fault status.

  await until(S(2));
  await play(
    ...fbox([
      ['Manager’s question:', C.violet],
      ['How often does', C.ink],
      ['the scanner beep?', WHITE]
    ], C.violet),
    ...say('WHAT IS THE OVERALL CHANCE OF A BEEP?', WHITE)
  );

  // 3: every beep means additional work for a human inspector.

  await until(S(3));
  await play(
    ...picture(objects(parts), 1.1),
    ...fbox([
      ['One beep', WHITE],
      ['→ one manual check', C.amber],
      'How many checks are needed?'
    ], C.amber),
    ...say('EVERY BEEP MEANS A MANUAL CHECK', C.amber)
  );

  // ------------------------------------------------------------
  // 4–7: tomorrow's parts do not yet exist.
  //
  // Instead of counting future parts, use the scanner's known
  // behavior inside each fault-status group.
  // ------------------------------------------------------------

  const tomorrowFrame = outline(
    GRID_W,
    GRID_H,
    [CX, CY, 0],
    C.muted
  );

  const tomorrowTitle = txt(
    'TOMORROW',
    P ? 26 : 24,
    C.muted,
    [CX, CY + 0.30, 0]
  );

  const tomorrowNote = txt(
    'Parts not made yet',
    P ? 20 : 18,
    C.muted,
    [CX, CY - 0.28, 0]
  );

  const tomorrowPicture = [
    tomorrowFrame,
    tomorrowTitle,
    tomorrowNote
  ];

  // 4: today's rings can be counted, tomorrow's cannot.

  await until(S(4));
  await play(
    pulse(rings(beeping), WHITE, 1.25),
    ...fbox([
      ['Today: count the rings', WHITE],
      ['Tomorrow: no parts yet', C.muted]
    ]),
    ...say('TODAY WE CAN COUNT THE BEEPS')
  );

  await until(S(4) + 3.1);

  await play(
    ...picture(tomorrowPicture, 1.0),
    ...fbox([
      ['Tomorrow’s beep count', C.ink],
      ['Cannot count it yet', C.muted],
      ['Can we predict the chance?', C.violet]
    ], C.violet),
    ...say('TOMORROW: NOTHING TO COUNT YET', C.muted)
  );

  // 5: introduce the scanner's habits.

  const habits = makeHabits();

  await until(S(5));
  await play(
    ...picture(habits.base, 1.15),
    ...fbox([
      ['What we do know:', C.violet],
      ['Beep rate on faulty parts', ORANGE],
      ['Beep rate on sound parts', TEAL]
    ], C.violet),
    ...say('USE THE SCANNER’S KNOWN HABITS', C.violet)
  );

  // 6: ninety percent of faulty parts beep.

  await until(S(6));
  await play(
    ...picture([
      ...habits.faulty.all,
      ...habits.sound.base
    ], 1.25),
    ...focus(
      RATE_W,
      2 * RATE_RADIUS + 0.20,
      [CX, RATE_TOP, 0],
      ORANGE
    ),
    ...fbox([
      ['Inside the faulty group', ORANGE],
      ['9 out of every 10 beep', WHITE],
      ['= 90%', C.amber]
    ], ORANGE),
    ...say('FAULTY PARTS: 90% BEEP', ORANGE)
  );

  // 7: ten percent of sound parts beep by mistake.

  await until(S(7));
  await play(
    ...picture(habits.all, 1.0),
    ...focus(
      RATE_W,
      2 * RATE_RADIUS + 0.20,
      [CX, RATE_BOTTOM, 0],
      TEAL
    ),
    ...fbox([
      ['Inside the sound group', TEAL],
      ['1 out of every 10 beeps', WHITE],
      ['= 10%', C.amber]
    ], TEAL),
    ...say('SOUND PARTS: 10% BEEP', TEAL)
  );

  // ------------------------------------------------------------
  // 8–10: rebuild the familiar probability tree.
  // ------------------------------------------------------------

  let tree = makeTree();

  // 8: begin with all hundred parts.

  await until(S(8));
  await play(
    ...clearMarks(),
    ...picture([tree.root], 0.9),
    ...fbox([
      ['Start with all parts', C.cyan],
      'Then split into groups.'
    ]),
    ...say('DRAW THE PROBABILITY TREE')
  );

  // 9: the first split is faulty versus sound.

  await until(S(9));
  await play(
    ...picture(tree.firstSplit, 1.35),
    ...fbox([
      ['First split:', C.ink],
      ['Faulty: 10%', ORANGE],
      ['Sound:  90%', TEAL]
    ]),
    ...say('FIRST SPLIT: FAULTY OR SOUND')
  );

  // 10: each group splits again into beep and no beep.

  await until(S(10));
  await play(
    ...picture(tree.full, 1.35),
    ...fbox([
      ['Second split:', C.ink],
      ['Beep', WHITE],
      ['No beep', C.muted]
    ], WHITE),
    ...say('SECOND SPLIT: BEEP OR NO BEEP', WHITE)
  );

  // ------------------------------------------------------------
  // 11–15: there are exactly two different ways to get a beep.
  //
  // Way one: faulty and beep.
  // Way two: sound and beep.
  //
  // The two ways are mutually exclusive.
  // ------------------------------------------------------------

  // 11: identify the two beep endpoints.

  await until(S(11));
  await play(
    ...markBothBeeps(),
    pulse(
      [tree.fb, tree.gb],
      WHITE,
      1.25
    ),
    ...fbox([
      ['Two ways to a beep', C.violet],
      ['Way 1: faulty + beep', ORANGE],
      ['Way 2: sound + beep', TEAL]
    ], C.violet),
    ...say('A BEEP CAN HAPPEN IN TWO WAYS', C.violet)
  );

  // 12: follow the first path.

  await until(S(12));
  await play(
    ...markFaultyPath(),
    pulse(
      [
        tree.rf,
        tree.fbe
      ],
      ORANGE,
      1.1
    ),
    ...fbox([
      ['Way one', ORANGE],
      ['Faulty', ORANGE],
      ['→ beep', WHITE]
    ], ORANGE),
    ...say('WAY 1: FAULTY, THEN BEEP', ORANGE)
  );

  // 13: follow the second path.

  await until(S(13));
  await play(
    ...markSoundPath(),
    pulse(
      [
        tree.rg,
        tree.gbe
      ],
      TEAL,
      1.1
    ),
    ...fbox([
      ['Way two', TEAL],
      ['Sound', TEAL],
      ['→ beep anyway', WHITE]
    ], TEAL),
    ...say('WAY 2: SOUND, THEN BEEP', TEAL)
  );

  // 14: a part cannot follow both of these paths.
  // Faulty and sound are separate, non-overlapping groups.

  await until(S(14));
  await play(
    ...marks([
      groupOutline(F, ORANGE),
      groupOutline(G, TEAL)
    ]),
    ...fbox([
      ['Faulty OR sound', C.ink],
      ['Never both at once', C.violet],
      ['No overlap', C.green]
    ], C.green),
    ...say('THE TWO WAYS NEVER OVERLAP', C.green)
  );

  // 15: because there is no overlap, add the two chances.

  await until(S(15));
  await play(
    ...markBothBeeps(),
    ...fbox([
      ['Chance of a beep', WHITE],
      ['= chance of way 1', ORANGE],
      ['  + chance of way 2', TEAL]
    ], C.green),
    ...say('ADD THE TWO WAYS TO A BEEP', C.green)
  );

  // ------------------------------------------------------------
  // 16–18: calculate way one with the product rule.
  //
  // 10% × 90% = 9%.
  // ------------------------------------------------------------

  await until(S(16));
  await play(
    ...markFaultyPath(),
    ...fbox([
      ['Way 1', ORANGE],
      ['Use the product rule', C.ink]
    ], ORANGE),
    ...say('WAY 1: MULTIPLY ALONG THE PATH', ORANGE)
  );

  // 17: take ten percent, then ninety percent of that share.

  await until(S(17));
  await play(
    pulse(
      [
        tree.rfLabel,
        tree.fbeLabel
      ],
      C.amber,
      1.3
    ),
    ...fbox([
      ['10% are faulty', ORANGE],
      ['90% of those beep', WHITE],
      ['10% × 90%', C.amber]
    ], ORANGE),
    ...say('10% OF ALL, THEN 90% OF THOSE', ORANGE)
  );

  // 18: nine percent of the original hundred parts.

  await until(S(18));
  await play(
    ...picture([
      ...tree.full,
      tree.fbResult
    ], 0.85),
    ...fbox([
      ['Faulty AND beep', ORANGE],
      ['10% × 90%', C.ink],
      ['= 9%', C.amber]
    ], ORANGE),
    ...say('WAY 1 CONTRIBUTES 9%', ORANGE)
  );

  // ------------------------------------------------------------
  // 19–21: calculate way two.
  //
  // 90% × 10% = 9%.
  // ------------------------------------------------------------

  // 19: move to the sound side.

  await until(S(19));
  await play(
    ...markSoundPath(),
    ...say('NOW WAY 2', TEAL)
  );

  // 20: take ninety percent, then ten percent of that share.

  await until(S(20));
  await play(
    pulse(
      [
        tree.rgLabel,
        tree.gbeLabel
      ],
      C.amber,
      1.25
    ),
    ...fbox([
      ['90% are sound', TEAL],
      ['10% of those beep', WHITE],
      ['90% × 10%', C.amber]
    ], TEAL),
    ...say('90% OF ALL, THEN 10% OF THOSE', TEAL)
  );

  // 21: the sound side also contributes nine percent.

  await until(S(21));
  await play(
    ...picture(tree.beepResults, 0.85),
    ...fbox([
      ['Sound AND beep', TEAL],
      ['90% × 10%', C.ink],
      ['= 9%', C.amber]
    ], TEAL),
    ...say('WAY 2 ALSO CONTRIBUTES 9%', TEAL)
  );

  // ------------------------------------------------------------
  // 22–24: add the two non-overlapping contributions.
  //
  // 9% + 9% = 18%.
  // ------------------------------------------------------------

  const treeTotal = totalTag();

  // 22: return attention to both beep outcomes.

  await until(S(22));
  await play(
    ...markBothBeeps(),
    ...say('NOW ADD THE TWO WAYS', C.green)
  );

  // 23: combine their contributions.

  await until(S(23));
  await play(
    ...picture([
      ...tree.beepResults,
      treeTotal
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
      ['9% + 9% = 18%', C.green]
    ], C.green),
    ...say('9% + 9% = 18%', C.green)
  );

  // 24: interpret eighteen percent as a count per hundred.

  await until(S(24));
  await play(
    new M.Indicate(
      treeTotal,
      { color: C.green }
    ),
    ...fbox([
      ['18 beeps', WHITE],
      ['out of every 100 parts', C.cyan],
      ['Overall chance = 18%', C.green]
    ], C.green),
    ...say('18 BEEPS PER 100 PARTS', C.green)
  );

  // ------------------------------------------------------------
  // 25: verify the result on the actual grid.
  // Count nine orange rings and nine teal rings.
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

  await until(S(25));
  await play(
    ...clearMarks(),
    ...picture(objects(checkGrid), 1.2),
    ...fbox([
      ['Check today’s 100 parts', C.ink],
      ['Count every white ring', WHITE]
    ], WHITE),
    ...say('CHECK WITH TODAY’S GRID', WHITE)
  );

  await until(S(25) + 2.1);

  await play(
    pulse(
      rings(checkFaultyBeeps),
      ORANGE,
      1.35
    ),
    ...fbox([
      ['9 orange rings', ORANGE],
      ['Faulty parts that beeped', C.ink]
    ], ORANGE),
    ...say('9 ORANGE RINGS', ORANGE)
  );

  await until(S(25) + 4.1);

  await play(
    pulse(
      rings(checkSoundBeeps),
      TEAL,
      1.35
    ),
    ...fbox([
      ['9 orange rings', ORANGE],
      ['9 teal rings', TEAL]
    ], TEAL),
    ...say('AND 9 TEAL RINGS', TEAL)
  );

  await until(S(25) + 6.1);

  await play(
    ...fbox([
      ['9 + 9 = 18 rings', WHITE],
      ['18 ÷ 100 = 18%', C.green],
      ['It matches', C.green]
    ], C.green),
    ...say('18 RINGS: IT MATCHES', C.green)
  );

  // ------------------------------------------------------------
  // 26–27: everyday comparison.
  //
  // Count everyone in a building by counting each floor
  // separately and then adding the counts.
  //
  // Illustrative building:
  // Top floor: four people.
  // Bottom floor: seven people.
  // Total: eleven people.
  // ------------------------------------------------------------

  const BUILD_W = P ? 5.6 : 5.0;
  const BUILD_H = P ? 3.5 : 3.0;

  const FLOOR_H = BUILD_H / 2;

  const FLOOR_TOP = CY + FLOOR_H / 2;
  const FLOOR_BOTTOM = CY - FLOOR_H / 2;

  const BUILD_CENTER = [CX, CY, 0];

  function person(pos, color) {
    const x = pos[0];
    const y = pos[1];

    const r = P ? 0.13 : 0.11;

    const head = new M.Circle({
      radius: r,
      color,
      strokeWidth: 1.5
    });

    head.setFill(color, 1);
    head.moveTo([
      x,
      y + 0.28,
      0
    ]);

    const body = new M.Arc({
      radius: P ? 0.21 : 0.18,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(color, 0.95);

    body.moveTo([
      x,
      y - 0.03,
      0
    ]);

    return new M.VGroup(
      head,
      body
    );
  }

  function floorPeople(n, y, color) {
    const sp = P ? 0.59 : 0.51;

    return Array.from(
      { length: n },
      (_, k) => person(
        [
          CX + (k - (n - 1) / 2) * sp,
          y - 0.14,
          0
        ],
        color
      )
    );
  }

  const building = outline(
    BUILD_W,
    BUILD_H,
    BUILD_CENTER,
    C.muted
  );

  const floorLine = line(
    [CX - BUILD_W / 2, CY, 0],
    [CX + BUILD_W / 2, CY, 0],
    C.muted,
    3
  );

  const roof = new M.VGroup(
    line(
      [
        CX - BUILD_W / 2,
        CY + BUILD_H / 2,
        0
      ],
      [
        CX,
        CY + BUILD_H / 2 + 0.45,
        0
      ],
      C.muted,
      3
    ),
    line(
      [
        CX,
        CY + BUILD_H / 2 + 0.45,
        0
      ],
      [
        CX + BUILD_W / 2,
        CY + BUILD_H / 2,
        0
      ],
      C.muted,
      3
    )
  );

  const upstairs = floorPeople(
    4,
    FLOOR_TOP,
    ORANGE
  );

  const downstairs = floorPeople(
    7,
    FLOOR_BOTTOM,
    TEAL
  );

  const floorTopLabel = txt(
    'FLOOR 2: 4 PEOPLE',
    P ? 17 : 15,
    ORANGE,
    [
      CX,
      FLOOR_TOP + FLOOR_H * 0.32,
      0
    ]
  );

  const floorBottomLabel = txt(
    'FLOOR 1: 7 PEOPLE',
    P ? 17 : 15,
    TEAL,
    [
      CX,
      FLOOR_BOTTOM + FLOOR_H * 0.32,
      0
    ]
  );

  const buildingTotal = tag(
    '4 + 7 = 11 PEOPLE',
    C.green,
    [
      CX,
      CY - BUILD_H / 2 - 0.40,
      0
    ],
    P ? 18 : 16
  );

  const buildingPicture = [
    building,
    floorLine,
    roof,
    ...upstairs,
    ...downstairs,
    floorTopLabel,
    floorBottomLabel
  ];

  // 26: count the people floor by floor, then add.

  await until(S(26));
  await play(
    ...picture(buildingPicture, 1.3),
    ...fbox([
      ['Count each floor', C.ink],
      ['Floor 2: 4 people', ORANGE],
      ['Floor 1: 7 people', TEAL]
    ]),
    ...say('COUNT A BUILDING FLOOR BY FLOOR')
  );

  await until(S(26) + 3.3);

  await play(
    ...picture([
      ...buildingPicture,
      buildingTotal
    ], 0.85),
    ...fbox([
      ['4 upstairs', ORANGE],
      ['+ 7 downstairs', TEAL],
      ['= 11 people', C.green]
    ], C.green),
    ...say('THEN ADD THE FLOORS', C.green)
  );

  // 27: connect the analogy to the two factory groups.

  await until(S(27));
  await play(
    ...marks([
      outline(
        BUILD_W + 0.13,
        FLOOR_H - 0.10,
        [CX, FLOOR_TOP, 0],
        ORANGE
      ),
      outline(
        BUILD_W + 0.13,
        FLOOR_H - 0.10,
        [CX, FLOOR_BOTTOM, 0],
        TEAL
      )
    ]),
    ...fbox([
      ['Each group is like a floor', C.ink],
      ['Faulty group', ORANGE],
      ['Sound group', TEAL],
      ['Count separately, then add', C.green]
    ], C.green),
    ...say('EACH FACTORY GROUP IS LIKE ONE FLOOR')
  );

  // ------------------------------------------------------------
  // 28–29: name the method.
  // ------------------------------------------------------------

  tree = makeTree();

  const namedTotal = totalTag();

  // 28: return to the tree and name the law.

  await until(S(28));
  await play(
    ...clearMarks(),
    ...picture([
      ...tree.beepResults,
      namedTotal
    ], 1.1),
    ...fbox([
      ['Law of total probability', C.green],
      'Find every possible way',
      'and add their chances.'
    ], C.green),
    ...say('THE LAW OF TOTAL PROBABILITY', C.green)
  );

  // 29: total means all the ways have been included.

  await until(S(29));
  await play(
    ...markBothBeeps(),
    pulse(
      [
        tree.fbResult,
        tree.gbResult
      ],
      C.green,
      1.2
    ),
    ...fbox([
      ['Total means ALL ways', C.green],
      ['Faulty beeps', ORANGE],
      ['+ sound beeps', TEAL]
    ], C.green),
    ...say('TOTAL = EVERY WAY THE BEEP CAN HAPPEN', C.green)
  );

  // ------------------------------------------------------------
  // 30–34: state the formula, one piece at a time.
  //
  // P(beep) =
  //   P(faulty) × P(beep given faulty)
  // + P(sound)  × P(beep given sound)
  //
  // Use everyday words on screen instead of introducing
  // additional mathematical notation.
  // ------------------------------------------------------------

  // 30: prepare for the short version.

  await until(S(30));
  await play(
    ...clearMarks(),
    ...clearBox(),
    ...say('THE RULE IN ONE LINE')
  );

  // 31: the overall chance consists of two contributions.

  await until(S(31));
  await play(
    ...markBothBeeps(),
    ...fbox([
      ['Chance of beep', WHITE],
      ['= faulty contribution', ORANGE],
      ['  + sound contribution', TEAL]
    ], C.cyan),
    ...say('CHANCE OF BEEP = TWO PARTS ADDED')
  );

  // 32: the first contribution is a weighted conditional chance.

  await until(S(32));
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
      ['Part 1:', ORANGE],
      ['Chance of faulty', ORANGE],
      ['× chance of beep given faulty', WHITE],
      ['10% × 90% = 9%', C.amber]
    ], ORANGE),
    ...say('FAULTY SHARE × BEEP RATE GIVEN FAULTY', ORANGE)
  );

  // 33: the second contribution is calculated the same way.

  await until(S(33));
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
      ['Part 2:', TEAL],
      ['Chance of sound', TEAL],
      ['× chance of beep given sound', WHITE],
      ['90% × 10% = 9%', C.amber]
    ], TEAL),
    ...say('SOUND SHARE × BEEP RATE GIVEN SOUND', TEAL)
  );

  // 34: combine the two terms and explain the everyday method.

  await until(S(34));
  await play(
    ...markBothBeeps(),
    ...fbox([
      ['Chance of beep =', WHITE],
      ['10% × 90%', ORANGE],
      ['+ 90% × 10%', TEAL],
      ['= 18%', C.green]
    ], C.green),
    ...say('SPLIT, MULTIPLY WITHIN EACH PATH, ADD', C.green)
  );

  await until(S(34) + 3.5);

  await play(
    ...fbox([
      '1. Split into groups.',
      '2. Find each group’s rate.',
      '3. Weight by group size.',
      ['4. Add the contributions.', C.green]
    ], C.green),
    ...say('WEIGHT EACH GROUP BY ITS SIZE', C.green)
  );

  // ------------------------------------------------------------
  // 35–36: connect weighting to actual group sizes.
  //
  // The faulty group contributes a rate of 90%, but represents
  // only 10% of all parts.
  //
  // The sound group contributes a rate of 10%, but represents
  // 90% of all parts.
  //
  // This is a weighted mean of the two conditional beep rates.
  // ------------------------------------------------------------

  const weightGrid = makeGrid(true);

  const weightFaulty = weightGrid.filter(
    d => d.faulty
  );

  const weightSound = weightGrid.filter(
    d => !d.faulty
  );

  // 35: bigger groups count for more.

  await until(S(35));
  await play(
    ...clearMarks(),
    ...picture(objects(weightGrid), 1.15),
    ...marks([
      outline(
        GRID_W,
        ROW_H,
        [CX, FAULTY_ROW_Y, 0],
        ORANGE
      ),
      outline(
        GRID_W,
        SOUND_H,
        [CX, SOUND_CENTER_Y, 0],
        TEAL
      )
    ]),
    ...fbox([
      ['Weight of faulty: 10%', ORANGE],
      ['Weight of sound:  90%', TEAL],
      ['Bigger group counts for more', C.green]
    ], C.green),
    ...say('WEIGHT = HOW BIG THE GROUP IS', C.green)
  );

  // 36: the overall rate comes from the group rates and sizes.

  await until(S(36));
  await play(
    ...fbox([
      ['Overall chance', C.green],
      'Combine the rates',
      'inside each group',
      'using their group sizes.'
    ], C.green),
    ...say('FROM GROUP CHANCES TO ONE OVERALL CHANCE', C.green)
  );

  // ------------------------------------------------------------
  // 37: school pass-rate comparison.
  //
  // Illustrative classes, not additional factory data.
  //
  // Class A: 10 students, 8 pass (80%).
  // Class B: 30 students, 15 pass (50%).
  //
  // Overall: 23 of 40 students pass.
  // Show that the larger class has greater weight.
  // ------------------------------------------------------------

  const SCHOOL_SP = P ? 0.40 : 0.32;
  const SCHOOL_SIZE = P ? 0.28 : 0.22;

  const SCHOOL_TOP = CY + (P ? 1.05 : 0.83);

  const SCHOOL_BOTTOM = CY - (P ? 0.50 : 0.57);

  function schoolClass(
    n,
    passed,
    cols,
    center,
    label,
    groupColor
  ) {
    const rows = Math.ceil(n / cols);

    const items = [];

    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;

      const pos = [
        center[0] +
          (c - (cols - 1) / 2) * SCHOOL_SP,

        center[1] +
          ((rows - 1) / 2 - r) * SCHOOL_SP,

        0
      ];

      const color = i < passed
        ? C.green
        : C.muted;

      items.push(
        square(
          pos,
          color,
          SCHOOL_SIZE
        )
      );
    }

    const w = (cols - 1) * SCHOOL_SP +
      SCHOOL_SIZE + 0.28;

    const h = (rows - 1) * SCHOOL_SP +
      SCHOOL_SIZE + 0.24;

    const frame = outline(
      w,
      h,
      center,
      groupColor
    );

    const lab = txt(
      label,
      P ? 17 : 15,
      groupColor,
      [
        center[0],
        center[1] + h / 2 + 0.31,
        0
      ],
      false,
      P ? 6.3 : 5.0
    );

    return {
      items,
      frame,
      label: lab,
      all: [
        ...items,
        frame,
        lab
      ]
    };
  }

  const classA = schoolClass(
    10,
    8,
    10,
    [CX, SCHOOL_TOP, 0],
    'CLASS A: 8 OF 10 PASS',
    C.violet
  );

  const classB = schoolClass(
    30,
    15,
    10,
    [CX, SCHOOL_BOTTOM, 0],
    'CLASS B: 15 OF 30 PASS',
    C.cyan
  );

  const schoolLegend = txt(
    'Green = passed',
    P ? 16 : 15,
    C.green,
    [
      CX,
      SCHOOL_BOTTOM - SCHOOL_SP - 0.50,
      0
    ]
  );

  const schoolPicture = [
    ...classA.all,
    ...classB.all,
    schoolLegend
  ];

  await until(S(37));
  await play(
    ...clearMarks(),
    ...picture(schoolPicture, 1.3),
    ...fbox([
      ['Class A: 80% pass', C.violet],
      ['Class B: 50% pass', C.cyan],
      'Class sizes are different.'
    ]),
    ...say('EXAMPLE: THE SCHOOL’S OVERALL PASS RATE')
  );

  await until(S(37) + 3.0);

  await play(
    ...fbox([
      ['Students who pass: 8 + 15', C.green],
      ['All students: 10 + 30', C.ink],
      ['23 out of 40 pass', C.green]
    ], C.green),
    ...say('USE BOTH THE RATE AND THE CLASS SIZE', C.green)
  );

  // ------------------------------------------------------------
  // 38–40: common trap.
  //
  // Incorrect: take the ordinary average of the beep rates.
  //
  // (90% + 10%) ÷ 2 = 50%.
  //
  // Correct: account for the unequal group sizes.
  //
  // 10% × 90% + 90% × 10% = 18%.
  // ------------------------------------------------------------

  const trapHabits = makeHabits();

  // 38: return to the two scanner habits.

  await until(S(38));
  await play(
    ...picture(trapHabits.all, 1.1),
    ...fbox([
      ['Common trap', C.amber],
      'Just average the',
      'two beep rates?'
    ], C.amber),
    ...say('DO NOT JUST AVERAGE THE TWO RATES', C.amber)
  );

  // 39: the ordinary average gives the wrong overall chance.

  await until(S(39));
  await play(
    ...fbox([
      ['90% + 10%', C.ink],
      ['÷ 2 = 50%', C.amber],
      ['But actual chance = 18%', C.green],
      ['50% is not correct here', C.amber]
    ], C.amber),
    ...say('THE PLAIN AVERAGE GIVES 50%', C.amber)
  );

  // 40: reveal the real group sizes again.
  // There are nine times as many sound parts as faulty parts.

  const trapGrid = makeGrid(true);

  const trapBeeps = trapGrid.filter(
    d => d.beep
  );

  const trapSound = trapGrid.filter(
    d => !d.faulty
  );

  const trapFaulty = trapGrid.filter(
    d => d.faulty
  );

  await until(S(40));
  await play(
    ...picture(objects(trapGrid), 1.1),
    ...marks([
      outline(
        GRID_W,
        ROW_H,
        [CX, FAULTY_ROW_Y, 0],
        ORANGE
      ),
      outline(
        GRID_W,
        SOUND_H,
        [CX, SOUND_CENTER_Y, 0],
        TEAL
      )
    ]),
    ...fbox([
      ['Faulty group: 10 parts', ORANGE],
      ['Sound group: 90 parts', TEAL],
      ['90 ÷ 10 = 9 times as many', C.amber]
    ], C.amber),
    ...say('THE SOUND GROUP IS NINE TIMES BIGGER', TEAL)
  );

  await until(S(40) + 3.1);

  await play(
    ...fbox([
      ['Use the actual weights:', C.ink],
      ['0.10 × 90% = 9%', ORANGE],
      ['0.90 × 10% = 9%', TEAL],
      ['9% + 9% = 18%', C.green]
    ], C.green),
    ...say('WEIGHT BY GROUP SIZE: THE ANSWER IS 18%', C.green)
  );

  // ------------------------------------------------------------
  // 41–42: half the beeps come from sound parts.
  //
  // Equal contributions to the beeping group:
  //
  // 9 faulty beeps
  // 9 sound beeps
  //
  // A beep does not establish that the part is faulty.
  // This prepares the next lesson on Bayes' rule.
  // ------------------------------------------------------------

  // 41: keep the beeping parts and compare the two equal rows.

  await until(S(41));
  await play(
    ...clearMarks(),
    ...picture(objects(trapBeeps), 1.1),
    ...fbox([
      ['9 faulty beeps', ORANGE],
      ['9 sound beeps', TEAL],
      ['18 total beeps', WHITE]
    ], WHITE),
    ...say('HALF THE BEEPS COME FROM SOUND PARTS', TEAL)
  );

  await play(
    gatherBeeps(trapBeeps)
  );

  const compactTopLabel = txt(
    '9 FAULTY BEEPS',
    P ? 18 : 17,
    ORANGE,
    [
      CX,
      CY + COMPACT_DY + RADIUS + 0.33,
      0
    ]
  );

  const compactBottomLabel = txt(
    '9 SOUND BEEPS',
    P ? 18 : 17,
    TEAL,
    [
      CX,
      CY - COMPACT_DY - RADIUS - 0.33,
      0
    ]
  );

  const compactPicture = [
    ...objects(trapBeeps),
    compactTopLabel,
    compactBottomLabel
  ];

  await play(
    ...picture(compactPicture, 0.65)
  );

  // 42: a scanner beep is evidence, not proof.

  await until(S(42));
  await play(
    ...focus(
      COMPACT_W,
      2 * RADIUS + 0.22,
      [
        CX,
        CY - COMPACT_DY,
        0
      ],
      TEAL
    ),
    ...fbox([
      ['A beep can be a mistake', WHITE],
      ['9 of the 18 beeps', TEAL],
      ['come from sound parts.', TEAL]
    ], C.violet),
    ...say('A BEEP DOES NOT PROVE A FAULT', C.violet)
  );

  await until(S(42) + 3.5);

  await play(
    ...clearMarks(),
    ...fbox([
      ['Next lesson', C.violet],
      ['Given a beep,', WHITE],
      ['how likely is a fault?', ORANGE]
    ], C.violet),
    ...say('NEXT: BAYES’ RULE', C.violet)
  );

  // ------------------------------------------------------------
  // 43: final takeaway.
  //
  // Return to the complete probability tree.
  // Highlight the two ways to a beep.
  // Multiply inside each path, then add the contributions.
  // ------------------------------------------------------------

  const finalTree = makeTree();

  const finalTotal = totalTag();

  await until(S(43));
  await play(
    ...picture(
      finalTree.beepResults,
      1.1
    ),
    ...markBothBeeps(),
    ...fbox([
      ['Split into groups', C.ink],
      ['Weight each group’s rate', C.violet],
      ['Add every contribution', C.green]
    ], C.green),
    ...say('TOTAL PROBABILITY: WEIGHT, THEN ADD', C.green)
  );

  await until(S(43) + 2.2);

  await play(
    pulse(
      [
        finalTree.rfLabel,
        finalTree.fbeLabel,
        finalTree.rgLabel,
        finalTree.gbeLabel
      ],
      C.amber,
      1.45
    ),
    ...fbox([
      ['Faulty: 10% × 90% = 9%', ORANGE],
      ['Sound:  90% × 10% = 9%', TEAL],
      ['Add the two contributions', C.green]
    ], C.green)
  );

  await until(S(43) + 4.1);

  await play(
    ...picture([
      ...finalTree.beepResults,
      finalTotal
    ], 0.85),
    ...fbox([
      ['Chance of a beep', WHITE],
      ['= 9% + 9%', C.ink],
      ['= 18%', C.green]
    ], C.green),
    ...say('ADD EVERY WAY, WEIGHTED BY ITS SIZE', C.green)
  );

  await until(E(43));
}
