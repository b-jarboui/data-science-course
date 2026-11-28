// lesson 4.2.2
// The product rule: probability of two things together.
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
  const CY = P ? -2.35 : -0.65;

  const PITCH = P ? 0.70 : 0.43;
  const SIZE = P ? 0.44 : 0.27;
  const RADIUS = P ? 0.32 : 0.198;

  const PILL = P ? [0, 2.15, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.35, 0] : [4.25, -0.25, 0];

  const ORANGE = '#FF9D45';
  const TEAL = '#29D6C5';
  const WHITE = '#FFFFFF';

  const ORANGE_GLOW = '#624025';
  const TEAL_GLOW = '#20534F';
  const WHITE_GLOW = '#535B68';

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  function txt(s, size, color, pos, mono = false) {
    const t = T(s, size, color, mono);
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
      { lagRatio: 0.10, runTime }
    );
  }

  // ------------------------------------------------------------
  // Formula box: same structure as the approved reference lesson.
  // Each row is either text or [text, color].
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
      cw * (rows[i][0].length - rows[i][0].trimStart().length)
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
        cw * (rows[i][0].length - rows[i][0].trimStart().length);

      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);

    const maxw = P ? FW - 1.2 : 4.4;
    const maxh = P ? 1.70 : 2.8;

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
  // Focus outlines are drawn from coordinates.
  // No already-visible objects are wrapped in a new VGroup.
  // ------------------------------------------------------------

  let focusNow = null;

  function focus(w, h, pos, color = C.cyan) {
    const r = outline(w, h, pos, color);

    const a = [new M.Create(r)];

    if (focusNow) a.push(new M.FadeOut(focusNow));

    focusNow = r;

    return a;
  }

  function clearFocus() {
    if (!focusNow) return [];

    const old = focusNow;
    focusNow = null;

    return [new M.FadeOut(old)];
  }

  // ------------------------------------------------------------
  // Fixed chapter data: exactly the same grid as lesson 4.2.1.
  //
  //                 Beep    No beep    Total
  // Faulty            9        1         10
  // Sound             9       81         90
  // Total            18       82        100
  //
  // Top row: ten faulty parts; first nine beep.
  // Other nine rows: ninety sound parts; one beep per row.
  // ------------------------------------------------------------

  const DATA = Array.from({ length: 100 }, (_, i) => {
    const r = Math.floor(i / 10);
    const c = i % 10;

    const faulty = r === 0;

    const beep = faulty
      ? c < 9
      : c === (3 * r + 1) % 10;

    return { i, r, c, faulty, beep };
  });

  const truthColor = d => d.faulty ? ORANGE : TEAL;

  const gridPos = d => [
    CX + (d.c - 4.5) * PITCH,
    CY + (4.5 - d.r) * PITCH,
    0
  ];

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

  const GRID_W = 9 * PITCH + 2 * RADIUS + 0.20;
  const GRID_H = 9 * PITCH + 2 * RADIUS + 0.20;

  const JOINT_W = 8 * PITCH + 2 * RADIUS + 0.18;

  const JOINT_CENTER = [
    CX - 0.5 * PITCH,
    CY + 4.5 * PITCH,
    0
  ];

  // ------------------------------------------------------------
  // Probability tree.
  //
  // Laptop: branches flow from left to right.
  // Phone: branches flow from top to bottom.
  //
  // Every branch has a dark outer stroke and a bright inner
  // stroke to match the glowing course style.
  // ------------------------------------------------------------

  const ROOT = P
    ? [0, 1.05, 0]
    : [-6.05, -0.65, 0];

  const F = P
    ? [-1.90, -1.45, 0]
    : [-3.50, 0.78, 0];

  const G = P
    ? [1.90, -1.45, 0]
    : [-3.50, -1.60, 0];

  const FB = P
    ? [-2.88, -4.05, 0]
    : [-0.75, 1.38, 0];

  const FQ = P
    ? [-0.96, -4.05, 0]
    : [-0.75, 0.18, 0];

  const GB = P
    ? [0.96, -4.05, 0]
    : [-0.75, -1.02, 0];

  const GQ = P
    ? [2.88, -4.05, 0]
    : [-0.75, -2.22, 0];

  const ROOT_W = P ? 2.2 : 1.45;
  const GROUP_W = P ? 2.1 : 1.48;
  const LEAF_W = P ? 1.78 : 1.42;

  const ROOT_H = P ? 0.92 : 0.62;
  const GROUP_H = P ? 0.92 : 0.62;
  const LEAF_H = P ? 0.92 : 0.62;

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
      P ? 19 : 15,
      color,
      [pos[0], pos[1] + (P ? 0.19 : 0.13), 0]
    );

    const b = txt(
      String(count),
      P ? 24 : 19,
      C.ink,
      [pos[0], pos[1] - (P ? 0.2 : 0.15), 0],
      true
    );

    const maxTextW = width - 0.16;

    if (a.getWidth() > maxTextW) {
      a.scale(maxTextW / a.getWidth());
    }

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
      a, b, aw, ah, bw, bh
    );

    const halo = line(start, end, glow, 8);
    const core = line(start, end, color, 3);

    return new M.VGroup(halo, core);
  }

  function edgeLabel(
    a, b,
    aw, ah, bw, bh,
    value, color
  ) {
    const [start, end] = edgePoints(
      a, b, aw, ah, bw, bh
    );

    const x = (start[0] + end[0]) / 2;
    const y = (start[1] + end[1]) / 2;

    const pos = P
      ? [x, y + 0.08, 0]
      : [x, y + 0.13, 0];

    const t = T(value, P ? 20 : 17, color, true);

    const w = t.getWidth() + 0.19;
    const h = P ? 0.42 : 0.32;

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

  function outcome(pos, value, color) {
    const target = P
      ? [pos[0], pos[1] - 1.2, 0]
      : [pos[0] + 1.90, pos[1], 0];

    const a = P
      ? [pos[0], pos[1] - LEAF_H / 2, 0]
      : [pos[0] + LEAF_W / 2, pos[1], 0];

    const b = P
      ? [target[0], target[1] + 0.23, 0]
      : [target[0] - 0.54, target[1], 0];

    const stem = line(a, b, color, 2.5);

    const tag = pill(
      value,
      color,
      P ? 21 : 18
    );

    tag.moveTo(target);

    return new M.VGroup(stem, tag);
  }

  function makeTree() {
    const tree = {};

    // Root and the first split.

    tree.root = node(
      ROOT, 'ALL PARTS', 100,
      C.cyan, ROOT_W, ROOT_H
    );

    tree.f = node(
      F, 'FAULTY', 10,
      ORANGE, GROUP_W, GROUP_H
    );

    tree.g = node(
      G, 'SOUND', 90,
      TEAL, GROUP_W, GROUP_H
    );

    tree.rf = branch(
      ROOT, F,
      ROOT_W, ROOT_H,
      GROUP_W, GROUP_H,
      ORANGE, ORANGE_GLOW
    );

    tree.rg = branch(
      ROOT, G,
      ROOT_W, ROOT_H,
      GROUP_W, GROUP_H,
      TEAL, TEAL_GLOW
    );

    tree.rfLabel = edgeLabel(
      ROOT, F,
      ROOT_W, ROOT_H,
      GROUP_W, GROUP_H,
      '10%', ORANGE
    );

    tree.rgLabel = edgeLabel(
      ROOT, G,
      ROOT_W, ROOT_H,
      GROUP_W, GROUP_H,
      '90%', TEAL
    );

    // Second split: faulty group.

    tree.fb = node(
      FB, 'BEEP', 9,
      WHITE, LEAF_W, LEAF_H
    );

    tree.fq = node(
      FQ, 'NO BEEP', 1,
      C.muted, LEAF_W, LEAF_H
    );

    tree.fbe = branch(
      F, FB,
      GROUP_W, GROUP_H,
      LEAF_W, LEAF_H,
      ORANGE, ORANGE_GLOW
    );

    tree.fqe = branch(
      F, FQ,
      GROUP_W, GROUP_H,
      LEAF_W, LEAF_H,
      ORANGE, ORANGE_GLOW
    );

    tree.fbeLabel = edgeLabel(
      F, FB,
      GROUP_W, GROUP_H,
      LEAF_W, LEAF_H,
      '90%', WHITE
    );

    tree.fqeLabel = edgeLabel(
      F, FQ,
      GROUP_W, GROUP_H,
      LEAF_W, LEAF_H,
      '10%', C.muted
    );

    // Second split: sound group.

    tree.gb = node(
      GB, 'BEEP', 9,
      WHITE, LEAF_W, LEAF_H
    );

    tree.gq = node(
      GQ, 'NO BEEP', 81,
      C.muted, LEAF_W, LEAF_H
    );

    tree.gbe = branch(
      G, GB,
      GROUP_W, GROUP_H,
      LEAF_W, LEAF_H,
      TEAL, TEAL_GLOW
    );

    tree.gqe = branch(
      G, GQ,
      GROUP_W, GROUP_H,
      LEAF_W, LEAF_H,
      TEAL, TEAL_GLOW
    );

    tree.gbeLabel = edgeLabel(
      G, GB,
      GROUP_W, GROUP_H,
      LEAF_W, LEAF_H,
      '10%', WHITE
    );

    tree.gqeLabel = edgeLabel(
      G, GQ,
      GROUP_W, GROUP_H,
      LEAF_W, LEAF_H,
      '90%', C.muted
    );

    // Endpoint probabilities, always out of all 100 parts.

    tree.fbResult = outcome(FB, '9%', ORANGE);
    tree.fqResult = outcome(FQ, '1%', ORANGE);
    tree.gbResult = outcome(GB, '9%', TEAL);
    tree.gqResult = outcome(GQ, '81%', TEAL);

    return tree;
  }

  // Track only tree objects that have actually appeared.
  // This also makes scene transitions safe during replay.

  let tree = makeTree();
  let treeShown = [];

  function addTree(...items) {
    treeShown.push(...items);

    return items.map(o => new M.FadeIn(o));
  }

  function clearTree() {
    if (!treeShown.length) return [];

    const old = treeShown.slice();
    treeShown = [];

    return [vanish(old, 0.85, 0.025)];
  }

  function faultyTreeObjects(t) {
    return [
      t.root,
      t.rf,
      t.rg,
      t.f,
      t.g,
      t.rfLabel,
      t.rgLabel,
      t.fbe,
      t.fqe,
      t.fb,
      t.fq,
      t.fbeLabel,
      t.fqeLabel
    ];
  }

  // ------------------------------------------------------------
  // A persistent highlight for one path through the tree.
  // Uses independent coordinate-based lines.
  // ------------------------------------------------------------

  let pathNow = null;

  function highlightedSegment(
    a, b,
    aw, ah, bw, bh
  ) {
    const [start, end] = edgePoints(
      a, b, aw, ah, bw, bh
    );

    return line(start, end, C.amber, 4.5);
  }

  function pathHighlight(first, second) {
    const mid = first === 'faulty' ? F : G;

    const leaf = first === 'faulty'
      ? (second === 'beep' ? FB : FQ)
      : (second === 'beep' ? GB : GQ);

    const a = highlightedSegment(
      ROOT, mid,
      ROOT_W, ROOT_H,
      GROUP_W, GROUP_H
    );

    const b = highlightedSegment(
      mid, leaf,
      GROUP_W, GROUP_H,
      LEAF_W, LEAF_H
    );

    const r = outline(
      LEAF_W + 0.15,
      LEAF_H + 0.15,
      leaf,
      C.amber
    );

    const next = new M.VGroup(a, b, r);

    const animations = [];

    if (pathNow) {
      animations.push(new M.FadeOut(pathNow));
    }

    animations.push(new M.FadeIn(next));

    pathNow = next;

    return animations;
  }

  function clearPath() {
    if (!pathNow) return [];

    const old = pathNow;
    pathNow = null;

    return [new M.FadeOut(old)];
  }

  // ------------------------------------------------------------
  // 0–4: the original hundred parts and today's question.
  // ------------------------------------------------------------

  let parts = makeGrid(false);

  const faulty = parts.filter(d => d.faulty);
  const sound = parts.filter(d => !d.faulty);
  const beeping = parts.filter(d => d.beep);

  const joint = parts.filter(
    d => d.faulty && d.beep
  );

  await until(S(0));
  await play(
    appear(squares(parts), 1.7, 0.025),
    ...say('BACK TO OUR 100 PARTS')
  );

  // 1: reveal the two actual fault-status groups.

  await until(S(1));
  await play(
    new M.LaggedStart(
      parts.map(d =>
        new M.Transform(
          d.sq,
          square(d.pos, truthColor(d))
        )
      ),
      {
        lagRatio: 0.02,
        runTime: 1.8
      }
    ),
    ...fbox([
      ['10 faulty parts', ORANGE],
      ['90 sound parts', TEAL],
      ['100 parts altogether', C.ink]
    ]),
    ...say('10 FAULTY + 90 SOUND')
  );

  // 2: reveal the scanner's decisions.

  await until(S(2));
  await play(
    new M.LaggedStart(
      rings(beeping).map(r => new M.Create(r)),
      {
        lagRatio: 0.06,
        runTime: 1.5
      }
    ),
    ...fbox([
      ['White ring = beep', WHITE],
      ['No ring = no beep', C.muted]
    ], WHITE),
    ...say('WHITE RING = BEEP', WHITE)
  );

  // 3: ask about the intersection of the two facts.

  await until(S(3));
  await play(
    ...fbox([
      ['Today’s question:', C.violet],
      ['Faulty', ORANGE],
      ['AND beep?', WHITE]
    ], C.violet),
    ...say('FAULTY AND BEEP?', C.violet)
  );

  // 4: both conditions must hold for the same part.

  await until(S(4));
  await play(
    ...focus(
      JOINT_W,
      2 * RADIUS + 0.20,
      JOINT_CENTER,
      C.amber
    ),
    pulse(squares(joint), ORANGE, 1.1),
    ...fbox([
      ['Orange square', ORANGE],
      ['+ white ring', WHITE],
      ['Both on the same part', C.amber]
    ], C.amber),
    ...say('BOTH MUST BE TRUE', C.amber)
  );

  // ------------------------------------------------------------
  // 5–10: sort the parts with the first split of a tree.
  // ------------------------------------------------------------

  await until(S(5));
  await play(
    ...clearFocus(),
    ...fbox([
      ['Step 1: fault status', ORANGE],
      ['Step 2: scanner result', WHITE]
    ], C.green),
    ...say('SORT IN TWO STEPS', C.green)
  );

  // 6: replace the grid with a single starting node.

  await until(S(6));
  await play(
    vanish(objects(parts), 0.9, 0.012),
    ...addTree(tree.root),
    ...fbox([
      ['Step 1', C.amber],
      ['Faulty or sound?']
    ], C.amber),
    ...say('STEP 1: FAULTY OR SOUND?', C.amber)
  );

  // 7: draw the first two branches.

  await until(S(7));
  await play(
    ...addTree(
      tree.rf,
      tree.rg
    ),
    ...say('ONE GROUP SPLITS INTO TWO')
  );

  // 8: reveal the two groups and their sizes.

  await until(S(8));
  await play(
    ...addTree(
      tree.f,
      tree.g
    ),
    ...fbox([
      ['10 faulty', ORANGE],
      ['90 sound', TEAL],
      ['10 + 90 = 100', C.ink]
    ]),
    ...say('EVERY PART TAKES ONE BRANCH')
  );

  // 9: calculate the first branch probability.

  await until(S(9));
  await play(
    ...addTree(tree.rfLabel),
    new M.Indicate(tree.f, { color: ORANGE }),
    ...fbox([
      ['Faulty branch', ORANGE],
      ['10 ÷ 100', C.ink],
      ['= 10%', ORANGE]
    ], ORANGE),
    ...say('10 OUT OF 100 = 10%', ORANGE)
  );

  // 10: calculate the other branch probability.

  await until(S(10));
  await play(
    ...addTree(tree.rgLabel),
    new M.Indicate(tree.g, { color: TEAL }),
    ...fbox([
      ['Sound branch', TEAL],
      ['90 ÷ 100', C.ink],
      ['= 90%', TEAL]
    ], TEAL),
    ...say('90 OUT OF 100 = 90%', TEAL)
  );

  // ------------------------------------------------------------
  // 11–15: condition on the faulty group.
  //
  // A temporary row of ten squares makes the second branch
  // probabilities visible before introducing their numbers.
  // ------------------------------------------------------------

  const STRIP_X = P ? 0 : 4.25;
  const STRIP_Y = P ? -4.05 : -1.95;

  const STRIP_SP = P ? 0.70 : 0.40;
  const STRIP_SIZE = P ? 0.44 : 0.25;
  const STRIP_RING = P ? 0.32 : 0.185;

  const faultyStrip = Array.from(
    { length: 10 },
    (_, k) => {
      const pos = [
        STRIP_X + (k - 4.5) * STRIP_SP,
        STRIP_Y,
        0
      ];

      return {
        sq: square(pos, ORANGE, STRIP_SIZE),
        ring: k < 9 ? ring(pos, STRIP_RING) : null
      };
    }
  );

  const stripLabel = txt(
    'ONLY THE 10 FAULTY PARTS',
    P ? 19 : 15,
    ORANGE,
    [
      STRIP_X,
      STRIP_Y - (P ? 0.72 : 0.56),
      0
    ]
  );

  const stripObjects = [
    ...faultyStrip.map(d => d.sq),
    stripLabel
  ];

  // 11: establish the new group before asking about beeps.

  await until(S(11));
  await play(
    new M.Indicate(tree.f, { color: ORANGE }),
    appear(stripObjects, 1.15, 0.07),
    ...fbox([
      ['Step 2', C.violet],
      ['Inside the faulty group', ORANGE],
      ['Which parts beep?', WHITE]
    ], C.violet),
    ...say('STEP 2: LOOK INSIDE THE GROUP', C.violet)
  );

  // 12: nine ringed orange squares and one quiet orange square.

  const stripRings = faultyStrip
    .filter(d => d.ring)
    .map(d => d.ring);

  await until(S(12));
  await play(
    new M.LaggedStart(
      stripRings.map(r => new M.Create(r)),
      {
        lagRatio: 0.08,
        runTime: 1.2
      }
    ),
    ...fbox([
      ['9 beep', WHITE],
      ['1 stays quiet', C.muted]
    ], WHITE),
    ...say('9 BEEP, 1 DOES NOT', WHITE)
  );

  // 13: split the faulty group into its two scanner outcomes.

  await until(S(13));
  await play(
    vanish([
      ...stripObjects,
      ...stripRings
    ], 0.7),
    ...addTree(
      tree.fbe,
      tree.fqe,
      tree.fb,
      tree.fq
    ),
    ...say('THE FAULTY BRANCH SPLITS AGAIN', ORANGE)
  );

  // 14: the denominators are now ten, not one hundred.

  await until(S(14));
  await play(
    ...addTree(
      tree.fbeLabel,
      tree.fqeLabel
    ),
    ...fbox([
      ['Beep:    9 ÷ 10 = 90%', WHITE],
      ['No beep: 1 ÷ 10 = 10%', C.muted]
    ], ORANGE),
    ...say('COUNT INSIDE THE 10 FAULTY PARTS', ORANGE)
  );

  // 15: connect the second branch to conditioning.

  await until(S(15));
  await play(
    pulse(
      [
        tree.f,
        tree.fbeLabel,
        tree.fqeLabel
      ],
      C.violet,
      1.5
    ),
    ...fbox([
      ['Chance of beep', WHITE],
      ['given faulty', ORANGE],
      ['= 9 ÷ 10 = 90%', C.violet]
    ], C.violet),
    ...say('A CONDITIONAL PROBABILITY', C.violet)
  );

  // ------------------------------------------------------------
  // 16–22: follow one path to find the joint probability.
  // ------------------------------------------------------------

  // 16: give the picture its name.

  await until(S(16));
  await play(
    ...fbox([
      ['Probability tree', C.green],
      'Each split sorts',
      'a group into smaller groups.'
    ], C.green),
    ...say('THIS IS A PROBABILITY TREE', C.green)
  );

  // 17: highlight faulty, then beep.

  await until(S(17));
  await play(
    ...pathHighlight('faulty', 'beep'),
    ...fbox([
      ['Follow one path:', C.amber],
      ['Faulty → beep', ORANGE]
    ], C.amber),
    ...say('FOLLOW FAULTY, THEN BEEP', C.amber)
  );

  // 18: first share = ten percent of all parts.

  await until(S(18));
  await play(
    new M.Indicate(
      tree.rfLabel,
      { color: C.amber }
    ),
    ...fbox([
      ['First share', ORANGE],
      ['10% of all 100 parts', C.ink],
      ['= 10 faulty parts', ORANGE]
    ], ORANGE),
    ...say('FIRST SHARE: 10%', ORANGE)
  );

  // 19: second share = ninety percent of those faulty parts.

  await until(S(19));
  await play(
    new M.Indicate(
      tree.fbeLabel,
      { color: C.amber }
    ),
    ...fbox([
      ['Second share', WHITE],
      ['90% of the faulty group', ORANGE]
    ], WHITE),
    ...say('SECOND SHARE: 90% OF THOSE', WHITE)
  );

  // 20: a share of a share.

  await until(S(20));
  await play(
    ...fbox([
      ['90% of 10%', C.amber],
      'A share of a share'
    ], C.amber),
    ...say('A SHARE OF A SHARE', C.amber)
  );

  // 21: nine of the original hundred parts reach this endpoint.

  await until(S(21));
  await play(
    new M.Indicate(
      tree.fb,
      { color: C.amber }
    ),
    ...fbox([
      ['90% of 10 parts', C.ink],
      ['= 9 parts', ORANGE]
    ], ORANGE),
    ...say('90% OF 10 PARTS = 9', ORANGE)
  );

  // 22: joint probability, measured against the original group.

  await until(S(22));
  await play(
    ...addTree(tree.fbResult),
    ...fbox([
      ['9 faulty beeping parts', ORANGE],
      ['÷ 100 original parts', C.cyan],
      ['= 9%', C.amber]
    ], C.amber),
    ...say('9 OUT OF 100 = 9%', C.amber)
  );

  // ------------------------------------------------------------
  // 23–24: check the result on the original grid.
  // ------------------------------------------------------------

  const checkGrid = makeGrid(true);

  const checkJoint = checkGrid.filter(
    d => d.faulty && d.beep
  );

  const checkOther = checkGrid.filter(
    d => !(d.faulty && d.beep)
  );

  await until(S(23));
  await play(
    ...clearPath(),
    ...clearTree(),
    appear(objects(checkGrid), 1.35, 0.016),
    ...focus(
      JOINT_W,
      2 * RADIUS + 0.20,
      JOINT_CENTER,
      C.amber
    ),
    ...fbox([
      ['9 orange ringed squares', ORANGE],
      ['100 parts altogether', C.cyan],
      ['It matches: 9%', C.green]
    ], C.green),
    ...say('CHECK: COUNT THE ORANGE RINGS', C.green)
  );

  // 24: reveal the multiplication rule after seeing the count.

  await until(S(24));
  await play(
    pulse(
      squares(checkJoint),
      C.amber,
      1.4
    ),
    ...fbox([
      ['10% × 90%', C.ink],
      ['= 9%', C.amber],
      'A share of a share'
    ], C.amber),
    ...say('MULTIPLY TO TAKE A SHARE OF A SHARE', C.amber)
  );

  // ------------------------------------------------------------
  // 25–26: everyday comparison.
  //
  // Illustrative class of 16 students:
  // 8 girls, 8 other students.
  // 4 of the 8 girls wear glasses.
  //
  // 1/2 × 1/2 = 1/4 of the whole class.
  // ------------------------------------------------------------

  const CLASS_N = 16;

  const CLASS_SP_X = P ? 1.55 : 0.95;
  const CLASS_SP_Y = P ? 1.55 : 0.83;

  const CLASS_CY = P ? -2.45 : -0.50;

  const PERSON_HEAD = P ? 0.24 : 0.135;
  const PERSON_BODY = P ? 0.37 : 0.21;
  const KS = P ? 1.4 : 1;

  const GIRL_COLOR = C.violet;
  const OTHER_COLOR = C.cyan;

  function classPos(k) {
    const r = Math.floor(k / 4);
    const c = k % 4;

    return [
      CX + (c - 1.5) * CLASS_SP_X,
      CLASS_CY + (1.5 - r) * CLASS_SP_Y,
      0
    ];
  }

  function student(k) {
    const p = classPos(k);

    const color = k < 8
      ? GIRL_COLOR
      : OTHER_COLOR;

    const headY = p[1] + 0.19 * KS;

    const head = new M.Circle({
      radius: PERSON_HEAD,
      color,
      strokeWidth: 1.5
    });

    head.setFill(color, 0.95);
    head.moveTo([p[0], headY, 0]);

    const body = new M.Arc({
      radius: PERSON_BODY,
      startAngle: 0,
      angle: Math.PI,
      color
    });

    body.setFill(color, 0.90);

    body.moveTo([
      p[0],
      p[1] - 0.12 * KS,
      0
    ]);

    const items = [head, body];

    // First four girls wear glasses.

    if (k < 4) {
      const gr = P ? 0.09 : 0.052;
      const dx = P ? 0.105 : 0.061;

      const left = new M.Circle({
        radius: gr,
        color: WHITE,
        strokeWidth: 2
      });

      const right = new M.Circle({
        radius: gr,
        color: WHITE,
        strokeWidth: 2
      });

      left.setFill(WHITE, 0);
      right.setFill(WHITE, 0);

      left.moveTo([
        p[0] - dx,
        headY + 0.015,
        0
      ]);

      right.moveTo([
        p[0] + dx,
        headY + 0.015,
        0
      ]);

      const bridge = line(
        [
          p[0] - dx + gr,
          headY + 0.015,
          0
        ],
        [
          p[0] + dx - gr,
          headY + 0.015,
          0
        ],
        WHITE,
        2
      );

      items.push(left, right, bridge);
    }

    return new M.VGroup(...items);
  }

  const students = Array.from(
    { length: CLASS_N },
    (_, k) => student(k)
  );

  const CLASS_W =
    3 * CLASS_SP_X + 2 * PERSON_BODY + 0.38;

  const GIRLS_CENTER = [
    CX,
    CLASS_CY + CLASS_SP_Y,
    0
  ];

  const GIRLS_H =
    CLASS_SP_Y + 0.78 * KS;

  const GLASSES_CENTER = [
    CX,
    CLASS_CY + 1.5 * CLASS_SP_Y,
    0
  ];

  const GLASSES_H = 0.75 * KS;

  const girlsLabel = txt(
    '8 GIRLS',
    P ? 20 : 16,
    GIRL_COLOR,
    [
      CX - CLASS_W / 2 + (P ? 0.75 : 0.62),
      CLASS_CY + 1.5 * CLASS_SP_Y + 0.59 * KS,
      0
    ]
  );

  const otherLabel = txt(
    '8 OTHER STUDENTS',
    P ? 20 : 15,
    OTHER_COLOR,
    [
      CX,
      CLASS_CY - 1.5 * CLASS_SP_Y - 0.57 * KS,
      0
    ]
  );

  const classObjects = [
    ...students,
    girlsLabel,
    otherLabel
  ];

  // 25: half the class are girls.
  // Half of that group wear glasses.

  await until(S(25));
  await play(
    ...clearFocus(),
    vanish(objects(checkGrid), 0.85, 0.012),
    appear(classObjects, 1.4, 0.07),
    ...focus(
      CLASS_W,
      GIRLS_H,
      GIRLS_CENTER,
      GIRL_COLOR
    ),
    ...fbox([
      ['16 students', C.ink],
      ['8 girls: one half', GIRL_COLOR],
      ['4 of those wear glasses', WHITE]
    ], GIRL_COLOR),
    ...say('HALF THE CLASS, THEN HALF OF THAT', GIRL_COLOR)
  );

  // 26: one quarter of the original class.

  await until(S(26));
  await play(
    ...focus(
      CLASS_W,
      GLASSES_H,
      GLASSES_CENTER,
      C.amber
    ),
    pulse(
      students.slice(0, 4),
      C.amber,
      1.25
    ),
    ...fbox([
      ['1/2 × 1/2 = 1/4', C.amber],
      ['4 out of 16 students', C.ink],
      ['= 25% of the class', C.green]
    ], C.green),
    ...say('HALF OF A HALF = ONE QUARTER', C.green)
  );

  // ------------------------------------------------------------
  // 27–31: name the product rule and state it in general.
  // ------------------------------------------------------------

  await until(S(27));
  await play(
    ...fbox([
      ['Product rule', C.green],
      'Product = the result',
      'of multiplying'
    ], C.green),
    ...say('THIS IS THE PRODUCT RULE', C.green)
  );

  // 28: restore the partially completed factory tree.

  tree = makeTree();

  await until(S(28));
  await play(
    ...clearFocus(),
    vanish(classObjects, 0.75),
    ...addTree(
      ...faultyTreeObjects(tree),
      tree.fbResult
    ),
    ...clearBox(),
    ...say('THE RULE IN ONE LINE')
  );

  // 29: general product rule.

  await until(S(29));
  await play(
    ...pathHighlight('faulty', 'beep'),
    ...fbox([
      ['Chance of A and B', C.ink],
      ['= chance of A', ORANGE],
      ['  × chance of B given A', WHITE]
    ], C.cyan),
    ...say('CHANCE OF BOTH = MULTIPLY')
  );

  // 30: assign the letters to the factory events.

  await until(S(30));
  await play(
    ...fbox([
      ['A = faulty', ORANGE],
      ['B = beep', WHITE],
      ['10% × 90% = 9%', C.amber]
    ], C.amber),
    ...say('A IS FAULTY. B IS BEEP.', C.amber)
  );

  // 31: connect the symbols back to the picture.

  await until(S(31));
  await play(
    pulse(
      [
        tree.rfLabel,
        tree.fbeLabel,
        tree.fbResult
      ],
      C.amber,
      1.6
    ),
    ...fbox([
      ['Take the first share', ORANGE],
      ['Take a share of that share', WHITE],
      ['Multiply the two chances', C.green]
    ], C.green),
    ...say('FIRST SHARE × SHARE OF THAT SHARE', C.green)
  );

  // ------------------------------------------------------------
  // 32–34: complete the sound side of the probability tree.
  // ------------------------------------------------------------

  // 32: nine of the ninety sound parts beep.

  await until(S(32));
  await play(
    ...clearPath(),
    ...addTree(
      tree.gbe,
      tree.gqe,
      tree.gb,
      tree.gq
    ),
    new M.Indicate(
      tree.g,
      { color: TEAL }
    ),
    ...fbox([
      ['90 sound parts', TEAL],
      ['9 beep by mistake', WHITE],
      ['81 stay quiet', C.muted]
    ], TEAL),
    ...say('NOW FINISH THE SOUND SIDE', TEAL)
  );

  // 33: conditional probabilities within the sound group.

  await until(S(33));
  await play(
    ...addTree(
      tree.gbeLabel,
      tree.gqeLabel
    ),
    ...fbox([
      ['Beep:     9 ÷ 90 = 10%', WHITE],
      ['No beep: 81 ÷ 90 = 90%', C.muted]
    ], TEAL),
    ...say('THIS TIME, COUNT OUT OF 90', TEAL)
  );

  // 34: the product rule works for every path.

  await until(S(34));
  await play(
    pulse(
      [
        tree.rfLabel,
        tree.fbeLabel,
        tree.rgLabel,
        tree.gbeLabel
      ],
      C.green,
      1.7
    ),
    ...fbox([
      ['Every path:', C.green],
      ['First branch chance'],
      ['× second branch chance']
    ], C.green),
    ...say('MULTIPLY ALONG EACH PATH', C.green)
  );

  // ------------------------------------------------------------
  // 35–37: calculate the three remaining joint probabilities.
  // ------------------------------------------------------------

  // 35: faulty and no beep.

  await until(S(35));
  await play(
    ...pathHighlight('faulty', 'quiet'),
    ...addTree(tree.fqResult),
    ...fbox([
      ['Faulty AND no beep', ORANGE],
      ['10% × 10%', C.ink],
      ['= 1%', C.amber]
    ], ORANGE),
    ...say('FAULTY, THEN NO BEEP: 1%', ORANGE)
  );

  // 36: sound and beep.

  await until(S(36));
  await play(
    ...pathHighlight('sound', 'beep'),
    ...addTree(tree.gbResult),
    ...fbox([
      ['Sound AND beep', TEAL],
      ['90% × 10%', C.ink],
      ['= 9%', C.amber]
    ], TEAL),
    ...say('SOUND, THEN BEEP: 9%', TEAL)
  );

  // 37: sound and no beep.

  await until(S(37));
  await play(
    ...pathHighlight('sound', 'quiet'),
    ...addTree(tree.gqResult),
    ...fbox([
      ['Sound AND no beep', TEAL],
      ['90% × 90%', C.ink],
      ['= 81%', C.amber]
    ], TEAL),
    ...say('SOUND, THEN NO BEEP: 81%', TEAL)
  );

  // ------------------------------------------------------------
  // 38–39: all four outcomes exhaust the original hundred parts.
  // ------------------------------------------------------------

  const RESULT_POS = P
    ? [0, -6.35, 0]
    : [CX, -2.75, 0];

  const totalTag = pill(
    'ALL FOUR PATHS = 100%',
    C.green,
    P ? 20 : 17
  );

  totalTag.moveTo(RESULT_POS);

  await until(S(38));
  await play(
    ...clearPath(),
    pulse(
      [
        tree.fbResult,
        tree.fqResult,
        tree.gbResult,
        tree.gqResult
      ],
      C.green,
      1.9
    ),
    new M.FadeIn(totalTag),
    ...fbox([
      ['9% + 1% + 9% + 81%', C.ink],
      ['= 100%', C.green]
    ], C.green),
    ...say('THE FOUR ENDS ADD TO 100%', C.green)
  );

  // 39: no missing or double-counted parts.

  await until(S(39));
  await play(
    pulse(
      [
        tree.fb,
        tree.fq,
        tree.gb,
        tree.gq
      ],
      C.green,
      1.6
    ),
    ...fbox([
      ['9 + 1 + 9 + 81', C.ink],
      ['= 100 parts', C.green],
      'Exactly one path per part'
    ], C.green),
    ...say('EVERY PART ENDS UP ON ONE PATH', C.green)
  );

  // ------------------------------------------------------------
  // 40–41: what the product rule is useful for.
  // ------------------------------------------------------------

  await until(S(40));
  await play(
    new M.FadeOut(totalTag),
    ...pathHighlight('faulty', 'beep'),
    ...fbox([
      ['Two things together', C.violet],
      ['First event: faulty', ORANGE],
      ['Second event: beep given faulty', WHITE]
    ], C.violet),
    ...say('FIND THE CHANCE OF TWO THINGS TOGETHER', C.violet)
  );

  // 41: break the difficult question into two easier ones.

  await until(S(41));
  await play(
    ...fbox([
      ['1. How often faulty?', ORANGE],
      ['2. Of those, how often beep?', WHITE],
      ['Multiply the answers.', C.green]
    ], C.green),
    ...say('ONE HARD QUESTION → TWO EASY STEPS', C.green)
  );

  // ------------------------------------------------------------
  // 42–44: common trap.
  //
  // Wrong: 10% × overall beep probability (18%) = 1.8%.
  //
  // Right: 10% × beep probability given faulty (90%) = 9%.
  //
  // The second branch is conditional on the first.
  // ------------------------------------------------------------

  const wrongTag = pill(
    'ALL PARTS: 18% BEEP',
    C.amber,
    P ? 20 : 15
  );

  wrongTag.moveTo(
    P
      ? [0, -6.35, 0]
      : [CX, -2.75, 0]
  );

  // 42: show the tempting but incorrect multiplication.

  await until(S(42));
  await play(
    ...clearPath(),
    new M.FadeIn(wrongTag),
    ...fbox([
      ['Common trap', C.amber],
      ['10% × 18% = 1.8%', C.muted],
      ['Wrong second group', C.amber]
    ], C.amber),
    ...say('DO NOT USE THE OVERALL BEEP RATE', C.amber)
  );

  // 43: point to the correct second branch.

  await until(S(43));
  await play(
    new M.FadeOut(wrongTag),
    ...pathHighlight('faulty', 'beep'),
    pulse(
      [
        tree.f,
        tree.fbeLabel
      ],
      C.amber,
      1.5
    ),
    ...fbox([
      ['Among all parts: 18%', C.muted],
      ['Among faulty parts: 90%', WHITE],
      ['Use 10% × 90% = 9%', C.green]
    ], C.green),
    ...say('USE THE BEEP RATE INSIDE THE FAULTY GROUP', C.green)
  );

  // 44: short rule for remembering which rate belongs on a branch.

  await until(S(44));
  await play(
    ...fbox([
      ['First: A', ORANGE],
      ['Then: B given A', WHITE],
      ['Always condition on step 1', C.green]
    ], C.green),
    ...say('ALWAYS USE THE CHANCE GIVEN STEP ONE', C.green)
  );

  // ------------------------------------------------------------
  // 45: preview the next lesson, independence.
  // ------------------------------------------------------------

  await until(S(45));
  await play(
    ...clearPath(),
    ...fbox([
      ['Next lesson', C.violet],
      'What if the first step',
      'does not change the second?'
    ], C.violet),
    ...say('NEXT: WHEN THE FIRST STEP CHANGES NOTHING', C.violet)
  );

  // ------------------------------------------------------------
  // 46: final takeaway.
  //
  // Return to the highlighted path and finish with the complete
  // product-rule calculation.
  // ------------------------------------------------------------

  await until(S(46));
  await play(
    ...pathHighlight('faulty', 'beep'),
    ...fbox([
      ['Chance of A and B', C.ink],
      ['= chance of A', ORANGE],
      ['  × chance of B given A', WHITE]
    ], C.green),
    ...say('TWO THINGS TOGETHER: MULTIPLY ALONG THE PATH', C.green)
  );

  await play(
    pulse(
      [
        tree.rfLabel,
        tree.fbeLabel,
        tree.fbResult
      ],
      C.amber,
      1.7
    ),
    ...fbox([
      ['Faulty AND beep', ORANGE],
      ['10% × 90%', C.ink],
      ['= 9%', C.amber]
    ], C.amber),
    ...say('MULTIPLY ALONG THE TREE', C.amber)
  );

  await until(E(46));
}
