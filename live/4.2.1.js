// lesson 4.2.1
// Conditioning: probability given new information.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the approved engine API; browser playback has not been tested here.

export default async function (L) {
  const {
    M, sc, P, FW, FH, C, S, E,
    T, pill, show, showA, until, play
  } = L;

  // ------------------------------------------------------------
  // Responsive layout
  // ------------------------------------------------------------

  const CX = P ? 0 : -2.6;
  const CY = P ? -2.0 : -0.65;
  const FS = P ? 1.5 : 1;          // phone: bigger factory picture
  const ROWOFF = P ? 0.8 : 0.46;   // half-gap between the two compact rows

  const PITCH = P ? 0.66 : 0.43;
  const SIZE = P ? 0.46 : 0.30;
  const RADIUS = P ? 0.30 : 0.198;

  const PILL = P ? [0, 2.15, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.40, 0] : [4.15, -0.30, 0];

  const ORANGE = '#FF9D45';
  const TEAL = '#29D6C5';
  const WHITE = '#FFFFFF';

  const say = (s, c = C.cyan) => showA(s, c, PILL);

  const txt = (s, size, color, pos, mono = false) => {
    const t = T(s, size, color, mono);
    t.moveTo(pos);
    return t;
  };

  const rect = (w, h, pos, color, opacity = 0.85) => {
    const r = new M.Rectangle({
      width: w,
      height: h,
      color,
      strokeWidth: 1.8
    });
    r.setFill(color, opacity);
    r.moveTo(pos);
    return r;
  };

  const outline = (w, h, pos, color = C.cyan) => {
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
  };

  const line = (a, b, color = C.muted, strokeWidth = 2) =>
    new M.Line({
      start: a,
      end: b,
      color,
      strokeWidth
    });

  const appear = (objects, runTime = 1.1, lagRatio = 0.025) =>
    new M.LaggedStart(
      objects.map(o => new M.FadeIn(o)),
      { lagRatio, runTime }
    );

  const vanish = (objects, runTime = 1.0, lagRatio = 0.015) =>
    new M.LaggedStart(
      objects.map(o => new M.FadeOut(o)),
      { lagRatio, runTime }
    );

  const pulse = (objects, color, runTime = 1.2) =>
    new M.LaggedStart(
      objects.map(o => new M.Indicate(o, { color })),
      { lagRatio: 0.08, runTime }
    );

  // ------------------------------------------------------------
  // Formula box, following the approved reference lesson.
  // Each line is either text or [text, color].
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
    const maxw = P ? FW - 1.2 : 4.6;

    if (wd > maxw) g.scale(maxw / wd);
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
  // Coordinate-based focus outlines.
  // Never group objects already on screen.
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

  const GRID_W = 9 * PITCH + SIZE + 0.26;
  const GRID_H = 9 * PITCH + SIZE + 0.26;

  const ROW_W = 9 * PITCH + SIZE + 0.26;
  const ROW_H = SIZE + 0.25;

  const COMPACT_PITCH = P ? 0.80 : 0.48;
  const COMPACT_W = 8 * COMPACT_PITCH + 2 * RADIUS + 0.25;

  // ------------------------------------------------------------
  // Shared chapter data.
  //
  //                 Beep    No beep    Total
  // Faulty            9        1         10
  // Sound             9       81         90
  // Total            18       82        100
  //
  // The grid is sorted by fault status for visual clarity.
  // Top row: ten faulty parts, first nine beep.
  // Remaining nine rows: sound parts, one beep in each row.
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

  const compactPos = (k, faulty) => [
    CX + (k - 4) * COMPACT_PITCH,
    CY + (faulty ? ROWOFF : -ROWOFF),
    0
  ];

  function square(pos, color = C.muted) {
    const r = new M.Rectangle({
      width: SIZE,
      height: SIZE,
      color,
      strokeWidth: 2
    });

    r.setFill(color, 0.82);
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

  function makeCompact() {
    let nf = 0;
    let ns = 0;

    return DATA.filter(d => d.beep).map(d => {
      const k = d.faulty ? nf++ : ns++;
      const pos = compactPos(k, d.faulty);

      return {
        ...d,
        pos,
        sq: square(pos, truthColor(d)),
        ring: ring(pos)
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
        lagRatio: 0.025,
        runTime: 1.45
      }
    );
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
          square(target, truthColor(d)),
          { pathArc: d.faulty ? -0.2 : 0.2 }
        )
      );

      moves.push(
        new M.Transform(
          d.ring,
          ring(target),
          { pathArc: d.faulty ? -0.2 : 0.2 }
        )
      );

      d.pos = target;
    });

    return new M.LaggedStart(moves, {
      lagRatio: 0.012,
      runTime: 1.7
    });
  }

  // ------------------------------------------------------------
  // 0–3: factory, hidden fault, scanner, beep.
  // ------------------------------------------------------------

  const BELT_Y = CY - 0.70;

  const belt = new M.RoundedRectangle({
    width: P ? 7.2 : 4.7,
    height: 0.48 * FS,
    cornerRadius: 0.19,
    color: C.muted,
    strokeWidth: 2
  });

  belt.setFill(C.card, 0.9);
  belt.moveTo([CX, BELT_Y, 0]);

  const rollers = Array.from({ length: 7 }, (_, k) => {
    const d = new M.Circle({
      radius: 0.105 * FS,
      color: C.muted,
      strokeWidth: 1.5
    });

    d.setFill(C.muted, 0.25);
    d.moveTo([
      CX + (k - 3) * (P ? 1.0 : 0.61),
      BELT_Y,
      0
    ]);

    return d;
  });

  const sampleX = [
    CX - 1.55 * (P ? 1.4 : 1),
    CX,
    CX + 1.55 * (P ? 1.4 : 1)
  ];

  const sampleY = BELT_Y + 0.57 * FS;

  const sampleParts = sampleX.map(x =>
    rect(
      0.58 * FS,
      0.58 * FS,
      [x, sampleY, 0],
      C.muted,
      0.82
    )
  );

  const factoryLabel = txt(
    'METAL PARTS',
    P ? 20 : 18,
    C.muted,
    [CX, BELT_Y - 0.68 * FS, 0]
  );

  const factoryObjects = [
    belt,
    ...rollers,
    ...sampleParts,
    factoryLabel
  ];

  await until(S(0));
  await play(
    appear(factoryObjects, 1.35, 0.07),
    ...say('A SMALL FACTORY')
  );

  // 1: one illustrative fault, hidden from the scanner.

  const faultNote = pill(
    'HIDDEN PROBLEM',
    ORANGE,
    17
  );

  faultNote.moveTo([
    sampleX[1],
    sampleY + 1.10 * FS,
    0
  ]);

  const faultLeader = line(
    [sampleX[1], sampleY + 0.79 * FS, 0],
    [sampleX[1], sampleY + 0.36 * FS, 0],
    ORANGE
  );

  await until(S(1));
  await play(
    new M.Transform(
      sampleParts[1],
      rect(
        0.58 * FS,
        0.58 * FS,
        [sampleX[1], sampleY, 0],
        ORANGE,
        0.85
      )
    ),
    new M.FadeIn(faultNote),
    new M.Create(faultLeader),
    ...say('FAULTY = HAS A HIDDEN PROBLEM', ORANGE)
  );

  // 2: scanner surrounds a part at the end of the line.

  const SX = sampleX[2];

  const scanner = outline(
    1.25 * FS,
    1.58 * FS,
    [SX, sampleY + 0.24 * FS, 0],
    C.cyan
  );

  const scanHead = rect(
    0.83 * FS,
    0.20 * FS,
    [SX, sampleY + 0.82 * FS, 0],
    C.cyan,
    0.85
  );

  const scanLabel = txt(
    'SCANNER',
    P ? 19 : 16,
    C.cyan,
    [SX, sampleY + 1.32 * FS, 0]
  );

  const beam = line(
    [SX, sampleY + 0.69 * FS, 0],
    [SX, sampleY + 0.30 * FS, 0],
    C.cyan,
    2.5
  );

  const scannerObjects = [
    scanner,
    scanHead,
    scanLabel,
    beam
  ];

  await until(S(2));
  await play(
    new M.FadeOut(faultNote),
    new M.FadeOut(faultLeader),
    new M.Create(scanner),
    new M.FadeIn(scanHead),
    new M.FadeIn(scanLabel),
    new M.Create(beam),
    ...say('EVERY PART IS CHECKED')
  );

  // 3: the beep is a clue, not yet proof of a fault.

  const sampleRing = ring(
    [SX, sampleY, 0],
    0.42 * FS
  );

  const beepTag = pill('BEEP!', WHITE, 18);

  beepTag.moveTo([
    CX,
    sampleY + 0.90 * FS,
    0
  ]);

  await until(S(3));
  await play(
    new M.Create(sampleRing),
    new M.Flash(scanHead, { color: WHITE }),
    new M.FadeIn(beepTag),
    ...say('A BEEP IS A WARNING', WHITE)
  );

  // ------------------------------------------------------------
  // 4–7: reveal the truth about today's hundred parts.
  // ------------------------------------------------------------

  let parts = makeGrid(false);

  let faulty = parts.filter(d => d.faulty);
  let sound = parts.filter(d => !d.faulty);
  let beeping = parts.filter(d => d.beep);
  let quiet = parts.filter(d => !d.beep);

  await until(S(4));
  await play(
    vanish([
      ...factoryObjects,
      ...scannerObjects,
      sampleRing,
      beepTag
    ], 0.8),
    appear(squares(parts), 1.8, 0.025),
    ...say('100 PARTS TODAY')
  );

  // 5: expert inspection establishes the actual fault status.

  await until(S(5));
  await play(
    ...focus(
      GRID_W,
      GRID_H,
      [CX, CY, 0],
      C.violet
    ),
    ...say('EXPERT CHECK: FIND THE TRUTH', C.violet)
  );

  // 6: ten faulty parts, orange.

  await until(S(6));
  await play(
    reveal(faulty),
    ...focus(
      ROW_W,
      ROW_H,
      [CX, CY + 4.5 * PITCH, 0],
      ORANGE
    ),
    ...say('10 FAULTY PARTS', ORANGE)
  );

  // 7: ninety sound parts, teal.

  await until(S(7));
  await play(
    reveal(sound),
    ...focus(
      ROW_W,
      8 * PITCH + SIZE + 0.25,
      [CX, CY - 0.5 * PITCH, 0],
      TEAL
    ),
    ...say('90 SOUND PARTS: NO FAULT', TEAL),
    ...fbox([
      ['10 faulty', ORANGE],
      ['90 sound', TEAL],
      ['100 parts in total', C.ink]
    ])
  );

  // ------------------------------------------------------------
  // 8–11: probability before any new information.
  // ------------------------------------------------------------

  await until(S(8));
  await play(
    ...focus(
      GRID_W,
      GRID_H,
      [CX, CY, 0],
      C.cyan
    ),
    pulse(
      [parts[4].sq, parts[37].sq, parts[72].sq],
      WHITE,
      1.6
    ),
    ...say('PICK WITHOUT LOOKING')
  );

  // 9: which part is faulty?

  await until(S(9));
  await play(
    ...focus(
      ROW_W,
      ROW_H,
      [CX, CY + 4.5 * PITCH, 0],
      ORANGE
    ),
    ...say('WHAT IS THE CHANCE OF A FAULT?', ORANGE)
  );

  // 10: counting rule, after seeing the picture.

  await until(S(10));
  await play(
    ...focus(
      GRID_W,
      GRID_H,
      [CX, CY, 0],
      C.cyan
    ),
    ...fbox([
      'probability =',
      ['parts we want', ORANGE],
      ['÷ all possible parts', C.cyan]
    ]),
    ...say('PROBABILITY = CHANCE')
  );

  // 11: 10 / 100 = 10%.

  await until(S(11));
  await play(
    pulse(squares(faulty), ORANGE, 1.3),
    ...fbox([
      ['10 faulty parts', ORANGE],
      ['÷ 100 total parts', C.cyan],
      ['= 10%', C.amber]
    ], C.amber),
    ...say('BEFORE THE BEEP: 10%', C.amber)
  );

  // ------------------------------------------------------------
  // 12–18: new information arrives.
  // ------------------------------------------------------------

  await until(S(12));
  await play(
    ...clearFocus(),
    ...fbox([
      ['New information', C.violet],
      ['Our part beeped.', WHITE]
    ], C.violet),
    ...say('WE KNOW OUR PART BEEPED', WHITE)
  );

  await until(S(13));
  await play(
    ...say('DOES THE CHANCE CHANGE?', C.amber),
    ...fbox([
      ['Before: 10%', C.amber],
      ['After a beep: ?', WHITE]
    ], C.amber)
  );

  // 14: white rings mark the eighteen beeping parts.

  await until(S(14));
  await play(
    new M.LaggedStart(
      rings(beeping).map(r => new M.Create(r)),
      {
        lagRatio: 0.06,
        runTime: 1.6
      }
    ),
    ...say('WHITE RING = BEEP', WHITE)
  );

  // 15: count the rings.

  await until(S(15));
  await play(
    ...fbox([
      ['18 parts beeped', WHITE],
      ['82 stayed quiet', C.muted]
    ], WHITE),
    ...say('18 BEEPS', WHITE)
  );

  // 16: nine orange rings and nine teal rings.

  const faultyBeeps = beeping.filter(d => d.faulty);
  const soundBeeps = beeping.filter(d => !d.faulty);

  await until(S(16));
  await play(
    pulse(rings(beeping), WHITE, 1.6),
    ...fbox([
      ['9 faulty + beep', ORANGE],
      ['9 sound + beep', TEAL],
      ['18 beeps altogether', WHITE]
    ], WHITE),
    ...say('9 ORANGE + 9 TEAL', WHITE)
  );

  // 17: the scanner can make mistakes.

  await until(S(17));
  await play(
    pulse(squares(soundBeeps), TEAL, 1.7),
    ...fbox([
      ['9 of 10 faulty beep', ORANGE],
      ['9 sound parts beep', TEAL],
      ['Sound beeps = mistakes', C.muted]
    ], C.violet),
    ...say('A BEEP DOES NOT PROVE A FAULT', C.violet)
  );

  // 18: restate the known fact.

  await until(S(18));
  await play(
    pulse(rings(beeping), WHITE, 1.3),
    ...fbox([
      ['Known fact:', C.violet],
      ['Our part beeped.', WHITE]
    ], C.violet),
    ...say('THE KEY STEP: USE WHAT WE KNOW', C.violet)
  );

  // ------------------------------------------------------------
  // 19–24: conditioning, shown by shrinking the possible group.
  // ------------------------------------------------------------

  // 19: remove exactly eighty-two non-beeping parts.

  await until(S(19));
  await play(
    vanish(squares(quiet), 2.3, 0.035),
    ...fbox([
      ['100 original parts', C.muted],
      ['− 82 without a beep', C.muted],
      ['= 18 possible parts', WHITE]
    ], WHITE),
    ...say('NO BEEP? NO LONGER POSSIBLE', C.violet)
  );

  // 20: gather the surviving eighteen ringed squares.
  // The squares and their rings move together.

  await until(S(20));
  await play(
    gatherBeeps(beeping),
    ...fbox([
      ['18 possible parts', WHITE],
      ['Our part is one of these.', C.ink]
    ], WHITE),
    ...say('ONLY THE 18 BEEPS REMAIN', WHITE)
  );

  // 21: explicitly outline the new counting group.

  await until(S(21));
  await play(
    ...focus(
      COMPACT_W,
      2 * ROWOFF + 0.63,
      [CX, CY, 0],
      WHITE
    ),
    ...fbox([
      ['New counting group', C.violet],
      ['All 18 beeping parts', WHITE]
    ], C.violet),
    ...say('COUNT INSIDE THIS SMALLER GROUP', C.violet)
  );

  // 22: count the nine orange squares.

  await until(S(22));
  await play(
    ...focus(
      COMPACT_W,
      2 * RADIUS + 0.23,
      [CX, CY + ROWOFF, 0],
      ORANGE
    ),
    ...fbox([
      ['9 faulty beeps', ORANGE],
      ['÷ 18 total beeps', WHITE]
    ], ORANGE),
    ...say('9 FAULTY OUT OF 18', ORANGE)
  );

  // 23: two equal rows make one half visually obvious.

  const equalMark = txt(
    '9',
    20,
    ORANGE,
    [
      CX,
      CY + ROWOFF + RADIUS + 0.30,
      0
    ],
    true
  );

  const equalMark2 = txt(
    '9',
    20,
    TEAL,
    [
      CX,
      CY - ROWOFF - RADIUS - 0.30,
      0
    ],
    true
  );

  await until(S(23));
  await play(
    ...clearFocus(),
    new M.FadeIn(equalMark),
    new M.FadeIn(equalMark2),
    ...fbox([
      ['9 ÷ 18', ORANGE],
      ['= one half', C.ink],
      ['= 50%', C.amber]
    ], C.amber),
    ...say('HALF THE BEEPS ARE FAULTY', C.amber)
  );

  // 24: compare before and after.

  await until(S(24));
  await play(
    ...fbox([
      ['Before: 10%', C.muted],
      ['          ↓ beep', WHITE],
      ['After:  50%', C.amber]
    ], C.amber),
    ...say('10% → 50%', C.amber)
  );

  // ------------------------------------------------------------
  // 25–28: name the idea.
  // ------------------------------------------------------------

  await until(S(25));
  await play(
    ...focus(
      COMPACT_W,
      2 * ROWOFF + 0.63,
      [CX, CY, 0],
      C.violet
    ),
    ...fbox([
      ['Conditioning', C.violet],
      ['100 possible parts', C.muted],
      ['→ 18 possible parts', WHITE]
    ], C.violet),
    ...say('CONDITIONING = SHRINK THE GROUP', C.violet)
  );

  await until(S(26));
  await play(
    ...fbox([
      ['Conditional probability', C.green],
      'A chance, given',
      'something already known'
    ], C.green),
    ...say('A CHANCE WITH NEW INFORMATION', C.green)
  );

  await until(S(27));
  await play(
    ...fbox([
      ['Probability of faulty', ORANGE],
      ['given a beep', WHITE],
      ['= 50%', C.amber]
    ], C.amber),
    ...say('FAULTY, GIVEN A BEEP', C.amber)
  );

  await until(S(28));
  await play(
    pulse(rings(beeping), WHITE, 1.3),
    ...fbox([
      ['“Given a beep”', WHITE],
      'We already know',
      'the part beeped.'
    ], WHITE),
    ...say('GIVEN = ALREADY KNOWN', WHITE)
  );

  // ------------------------------------------------------------
  // 29–31: everyday comparison, height and basketball.
  //
  // Illustrative people, not measured population data.
  // ------------------------------------------------------------

  const HEIGHTS = [
    1.45, 1.65, 1.52, 1.85, 1.72,
    1.58, 1.90, 1.93, 2.18, 2.12
  ];

  const PERSON_SP = P ? 0.70 : 0.44;
  const H_SCALE = P ? 1.9 : 1.15;

  const FEET_Y = P ? -5.0 : -2.45;
  const HEAD_R = P ? 0.17 : 0.105;

  function person(k, h, color = C.muted) {
    const x = CX + (k - 4.5) * PERSON_SP;
    const ht = h * H_SCALE;

    const headY = FEET_Y + ht - HEAD_R;
    const shoulderY = headY - HEAD_R - 0.08;
    const hipY = FEET_Y + ht * 0.43;

    const head = new M.Circle({
      radius: HEAD_R,
      color,
      strokeWidth: 1.5
    });

    head.setFill(color, 1);
    head.moveTo([x, headY, 0]);

    const body = line(
      [x, shoulderY, 0],
      [x, hipY, 0],
      color,
      P ? 6 : 5
    );

    const arm1 = line(
      [x, shoulderY - 0.12, 0],
      [x - 0.17, hipY + 0.17, 0],
      color,
      2.8
    );

    const arm2 = line(
      [x, shoulderY - 0.12, 0],
      [x + 0.17, hipY + 0.17, 0],
      color,
      2.8
    );

    const leg1 = line(
      [x, hipY, 0],
      [x - 0.11, FEET_Y, 0],
      color,
      3.0
    );

    const leg2 = line(
      [x, hipY, 0],
      [x + 0.11, FEET_Y, 0],
      color,
      3.0
    );

    return new M.VGroup(
      head,
      body,
      arm1,
      arm2,
      leg1,
      leg2
    );
  }

  const people = HEIGHTS.map((h, k) => person(k, h));

  const ground = line(
    [CX - 5 * PERSON_SP, FEET_Y - 0.08, 0],
    [CX + 5 * PERSON_SP, FEET_Y - 0.08, 0],
    C.muted
  );

  const heightY = FEET_Y + 2 * H_SCALE;

  const heightLine = new M.DashedLine({
    start: [CX - 5 * PERSON_SP, heightY, 0],
    end: [CX + 5 * PERSON_SP, heightY, 0],
    color: C.amber
  });

  const heightLabel = txt(
    '2 metres',
    P ? 18 : 16,
    C.amber,
    [
      CX - 3.5 * PERSON_SP,
      heightY + 0.25,
      0
    ]
  );

  const illustrationNote = txt(
    'Illustration, not measured data',
    15,
    C.muted,
    [CX, FEET_Y - 0.40, 0]
  );

  await until(S(29));
  await play(
    vanish([
      ...objects(beeping),
      equalMark,
      equalMark2
    ], 0.75),
    ...clearFocus(),
    new M.Create(ground),
    new M.Create(heightLine),
    new M.FadeIn(heightLabel),
    new M.FadeIn(illustrationNote),
    appear(people, 1.4, 0.08),
    ...fbox([
      'A random stranger',
      ['Taller than 2 metres?', C.amber],
      ['Small chance', C.muted]
    ]),
    ...say('HOW TALL IS A STRANGER?')
  );

  // 30: the new fact identifies a smaller group.
  // The final three silhouettes represent basketball players.

  const PRO = [7, 8, 9];

  const proX = CX + (8 - 4.5) * PERSON_SP;

  const proTop = FEET_Y + 2.18 * H_SCALE + 0.18;
  const proBottom = FEET_Y - 0.15;

  const proBox = outline(
    PERSON_SP * 3 + 0.15,
    proTop - proBottom,
    [
      proX,
      (proTop + proBottom) / 2,
      0
    ],
    C.violet
  );

  const proTag = pill(
    'BASKETBALL PLAYERS',
    C.violet,
    15
  );

  proTag.moveTo([
    proX - 0.25,
    FEET_Y + 2.18 * H_SCALE + 0.55,
    0
  ]);

  await until(S(30));
  await play(
    new M.Create(proBox),
    new M.FadeIn(proTag),
    ...fbox([
      ['New information', C.violet],
      'Professional',
      'basketball player'
    ], C.violet),
    ...say('NOW WE KNOW THEIR PROFESSION', C.violet)
  );

  // 31: remove people outside the known group.

  const otherPeople = people.filter(
    (_, k) => !PRO.includes(k)
  );

  const proPeople = PRO.map(k => people[k]);

  await until(S(31));
  await play(
    vanish(otherPeople, 1.35, 0.07),
    pulse(proPeople, C.violet, 1.4),
    ...fbox([
      ['Basketball players only', C.violet],
      ['Taller than 2 metres?', C.amber],
      ['Much bigger chance', C.green]
    ], C.green),
    ...say('NEW GROUP, NEW CHANCE', C.green)
  );

  // ------------------------------------------------------------
  // 32–36: return to the factory and introduce the rule.
  // ------------------------------------------------------------

  let compact = makeCompact();

  const compactFaulty = compact.filter(d => d.faulty);
  const compactSound = compact.filter(d => !d.faulty);

  const compactTopLabel = txt(
    '9 faulty beeps',
    18,
    ORANGE,
    [
      CX,
      CY + ROWOFF + RADIUS + 0.34,
      0
    ]
  );

  const compactBottomLabel = txt(
    '9 sound beeps',
    18,
    TEAL,
    [
      CX,
      CY - ROWOFF - RADIUS - 0.34,
      0
    ]
  );

  await until(S(32));
  await play(
    vanish([
      ...proPeople,
      proBox,
      proTag,
      ground,
      heightLine,
      heightLabel,
      illustrationNote
    ], 0.7),
    appear(objects(compact), 1.0, 0.02),
    new M.FadeIn(compactTopLabel),
    new M.FadeIn(compactBottomLabel),
    ...clearBox(),
    ...say('THE RULE IN ONE LINE', C.cyan)
  );

  // 33: the conditional probability formula.

  await until(S(33));
  await play(
    ...fbox([
      ['Chance of faulty given beep', C.ink],
      ['= faulty parts that beeped', ORANGE],
      ['  ÷ all parts that beeped', WHITE]
    ], C.cyan),
    ...say('FAULTY GIVEN BEEP', C.cyan)
  );

  // 34: the everyday meaning of the formula.

  await until(S(34));
  await play(
    ...focus(
      COMPACT_W,
      2 * ROWOFF + 0.63,
      [CX, CY, 0],
      WHITE
    ),
    ...fbox([
      ['Keep the known group', WHITE],
      ['Count what you want', ORANGE],
      ['Divide by that group', C.cyan]
    ]),
    ...say('KEEP THE GROUP, THEN COUNT')
  );

  // 35: the denominator is the number divided by.

  await until(S(35));
  await play(
    ...fbox([
      ['9 ÷ 18 = 50%', C.ink],
      ['    18', C.amber],
      ['Denominator', C.amber]
    ], C.amber),
    ...say('DENOMINATOR = THE NUMBER BELOW', C.amber)
  );

  // 36: the denominator changes from one hundred to eighteen.

  await until(S(36));
  await play(
    ...fbox([
      ['Old denominator = 100', C.muted],
      ['New denominator = 18', WHITE],
      ['100 → 18', C.amber]
    ], C.amber),
    ...say('CONDITIONING CHANGES THE DENOMINATOR', C.amber)
  );

  // ------------------------------------------------------------
  // 37–38: what conditional probability is for.
  // ------------------------------------------------------------

  await until(S(37));
  await play(
    ...clearFocus(),
    ...fbox([
      ['Before the clue: 10%', C.muted],
      ['New clue: beep', WHITE],
      ['Updated chance: 50%', C.green]
    ], C.green),
    ...say('UPDATE A CHANCE WHEN YOU LEARN', C.green)
  );

  await until(S(38));
  await play(
    ...fbox([
      ['Doctor: given this test', C.cyan],
      ['Bank: given this payment', C.violet],
      ['Factory: given this beep', WHITE]
    ], C.green),
    ...say('GIVEN THIS CLUE, WHAT IS THE CHANCE?', C.green)
  );

  // ------------------------------------------------------------
  // 39–42: common trap — keeping the old denominator.
  // ------------------------------------------------------------

  const trapGrid = makeGrid(true);

  const trapBeeps = trapGrid.filter(d => d.beep);

  const trapFaultyBeeps = trapGrid.filter(
    d => d.faulty && d.beep
  );

  const trapQuiet = trapGrid.filter(d => !d.beep);

  // 39: restore all hundred parts to expose the mistake.

  await until(S(39));
  await play(
    vanish([
      ...objects(compact),
      compactTopLabel,
      compactBottomLabel
    ], 0.8),
    appear(objects(trapGrid), 1.5, 0.015),
    ...focus(
      GRID_W,
      GRID_H,
      [CX, CY, 0],
      C.amber
    ),
    ...fbox([
      ['Common trap', C.amber],
      'Keeping the old',
      'denominator: 100'
    ], C.amber),
    ...say('WATCH THE DENOMINATOR', C.amber)
  );

  // 40: nine faulty-and-beeping parts out of all hundred.

  await until(S(40));
  await play(
    pulse(
      squares(trapFaultyBeeps),
      ORANGE,
      1.5
    ),
    ...fbox([
      ['9 faulty + beep', ORANGE],
      ['÷ 100 total parts', C.muted],
      ['= 9%', C.amber]
    ], C.amber),
    ...say('9 OUT OF 100 = 9%', C.amber)
  );

  // 41: both calculations are valid, but answer different questions.

  await until(S(41));
  await play(
    vanish(squares(trapQuiet), 1.65, 0.025),
    ...clearFocus(),
    ...fbox([
      ['Faulty AND beep: 9/100 = 9%', C.amber],
      ['Faulty GIVEN beep:', C.green],
      ['9/18 = 50%', C.green]
    ], C.violet),
    ...say('TWO DIFFERENT QUESTIONS', C.violet)
  );

  // 42: return attention to the correct denominator.

  await until(S(42));
  await play(
    gatherBeeps(trapBeeps),
    ...fbox([
      ['Out of all parts? 100', C.muted],
      ['Out of the beeps? 18', WHITE],
      ['Choose the known group.', C.green]
    ], C.green),
    ...say('OUT OF WHICH GROUP?', C.amber)
  );

  // ------------------------------------------------------------
  // 43: preview the next lesson's probability tree.
  // No branch calculations are introduced before that lesson.
  // ------------------------------------------------------------

  const root = P
    ? [CX, CY + 1.60, 0]
    : [CX - 1.85, CY + 0.10, 0];

  const faultyNode = P
    ? [CX - 1.75, CY - 1.60, 0]
    : [CX + 1.15, CY + 1.08, 0];

  const soundNode = P
    ? [CX + 1.75, CY - 1.60, 0]
    : [CX + 1.15, CY - 1.12, 0];

  const rootTag = pill('100 PARTS', C.cyan, 18);
  rootTag.moveTo(root);

  const faultyTag = pill('FAULTY', ORANGE, 18);
  faultyTag.moveTo(faultyNode);

  const soundTag = pill('SOUND', TEAL, 18);
  soundTag.moveTo(soundNode);

  const faultyBranch = P
    ? line(
        [root[0], root[1] - 0.30, 0],
        [faultyNode[0], faultyNode[1] + 0.30, 0],
        ORANGE,
        4
      )
    : line(
        [root[0] + 0.75, root[1], 0],
        [faultyNode[0] - 0.65, faultyNode[1], 0],
        ORANGE,
        4
      );

  const soundBranch = P
    ? line(
        [root[0], root[1] - 0.30, 0],
        [soundNode[0], soundNode[1] + 0.30, 0],
        TEAL,
        4
      )
    : line(
        [root[0] + 0.75, root[1], 0],
        [soundNode[0] - 0.65, soundNode[1], 0],
        TEAL,
        4
      );

  const treeObjects = [
    rootTag,
    faultyTag,
    soundTag,
    faultyBranch,
    soundBranch
  ];

  await until(S(43));
  await play(
    vanish(objects(trapBeeps), 0.8),
    new M.Create(faultyBranch),
    new M.Create(soundBranch),
    new M.FadeIn(rootTag),
    new M.FadeIn(faultyTag),
    new M.FadeIn(soundTag),
    ...fbox([
      ['Next lesson', C.violet],
      'Build chances',
      'one step at a time'
    ], C.violet),
    ...say('NEXT: A PROBABILITY TREE', C.violet)
  );

  // ------------------------------------------------------------
  // 44: final takeaway.
  // Show the shrinking group once more, then the answer.
  // ------------------------------------------------------------

  const finalGrid = makeGrid(true);

  const finalBeeps = finalGrid.filter(d => d.beep);

  const finalQuiet = finalGrid.filter(d => !d.beep);

  const finalOrange = finalBeeps.filter(d => d.faulty);
  const finalTeal = finalBeeps.filter(d => !d.faulty);

  await until(S(44));

  await play(
    vanish(treeObjects, 0.65),
    appear(objects(finalGrid), 0.95, 0.012),
    ...fbox([
      ['Start with all 100 parts', C.muted],
      ['Keep only the 18 beeps', WHITE],
      ['Count the 9 faulty beeps', ORANGE]
    ], C.violet),
    ...say('CONDITIONING = SHRINK, THEN COUNT', C.violet)
  );

  await play(
    vanish(squares(finalQuiet), 1.15, 0.012),
    ...fbox([
      ['Known group: 18 beeps', WHITE],
      ['Wanted parts: 9 faulty', ORANGE],
      ['9 ÷ 18 = 50%', C.amber]
    ], C.amber)
  );

  await play(
    gatherBeeps(finalBeeps)
  );

  const lastTop = txt(
    '9 faulty',
    19,
    ORANGE,
    [
      CX,
      CY + ROWOFF + RADIUS + 0.35,
      0
    ]
  );

  const lastBottom = txt(
    '9 sound',
    19,
    TEAL,
    [
      CX,
      CY - ROWOFF - RADIUS - 0.35,
      0
    ]
  );

  const lastTotal = pill(
    '18 POSSIBLE PARTS',
    WHITE,
    17
  );

  lastTotal.moveTo([
    CX,
    CY - ROWOFF - RADIUS - (P ? 1.0 : 0.89),
    0
  ]);

  await play(
    new M.FadeIn(lastTop),
    new M.FadeIn(lastBottom),
    new M.FadeIn(lastTotal),
    ...focus(
      COMPACT_W,
      2 * ROWOFF + 0.63,
      [CX, CY, 0],
      WHITE
    ),
    ...say('KEEP WHAT YOU KNOW. COUNT INSIDE.', C.green)
  );

  await until(E(44));
}
