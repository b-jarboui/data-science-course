// lesson 4.2.3
// Independence: when new information changes nothing.
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
  const CY = P ? -1.50 : -0.72;

  const PITCH = P ? 0.55 : 0.39;
  const SIZE = P ? 0.34 : 0.24;
  const RADIUS = P ? 0.25 : 0.18;

  const SHIFT_GAP = P ? 0.50 : 0.46;

  const PILL = P ? [0, 2.05, 0] : [CX, 1.95, 0];
  const BOXP = P ? [0, 3.45, 0] : [4.20, -0.30, 0];

  const ORANGE = '#FF9D45';
  const TEAL = '#29D6C5';
  const WHITE = '#FFFFFF';

  const ORANGE_GLOW = '#624025';
  const TEAL_GLOW = '#20534F';

  const MORNING = C.violet;
  const AFTERNOON = C.cyan;

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
  // Formula box, following the approved reference lesson.
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

    const maxw = P ? FW - 1.2 : 4.5;
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
  // Coordinate-based focus boxes.
  // Never wrap already-visible objects in a new VGroup.
  // ------------------------------------------------------------

  let focusNow = null;

  function focus(w, h, pos, color = C.cyan) {
    const r = outline(w, h, pos, color);

    const a = [new M.Create(r)];

    if (focusNow) {
      a.push(new M.FadeOut(focusNow));
    }

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
  // Picture management.
  //
  // Keep track of exactly which picture objects are visible.
  // Retained objects stay attached to the scene.
  // Only objects entering or leaving receive fade animations.
  // ------------------------------------------------------------

  let pictureNow = [];

  function picture(next, runTime = 1.1) {
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
  // Fixed chapter data.
  //
  //                 Beep    No beep    Total
  // Faulty            9        1         10
  // Sound             9       81         90
  // Total            18       82        100
  //
  // Shift data for this lesson:
  //
  //                 Faulty    Sound    Total
  // Morning            5       45        50
  // Afternoon          5       45        50
  //
  // Preserve the same fault and beep arrangement as lessons
  // 4.2.1 and 4.2.2.
  //
  // Columns 0–4 belong to the morning shift.
  // Columns 5–9 belong to the afternoon shift.
  // ------------------------------------------------------------

  const DATA = Array.from({ length: 100 }, (_, i) => {
    const r = Math.floor(i / 10);
    const c = i % 10;

    const faulty = r === 0;

    const beep = faulty
      ? c < 9
      : c === (3 * r + 1) % 10;

    const morning = c < 5;

    return {
      i,
      r,
      c,
      faulty,
      beep,
      morning
    };
  });

  const truthColor = d => d.faulty ? ORANGE : TEAL;

  function gridPos(d, split = false) {
    const offset = split
      ? (d.morning ? -SHIFT_GAP / 2 : SHIFT_GAP / 2)
      : 0;

    return [
      CX + (d.c - 4.5) * PITCH + offset,
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

  function makeGrid(split = false, revealTruth = true) {
    return DATA.map(d => {
      const pos = gridPos(d, split);

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

  const SPLIT_W =
    GRID_W + SHIFT_GAP;

  const HALF_W =
    4 * PITCH + 2 * RADIUS + 0.16;

  const ROW_H =
    2 * RADIUS + 0.16;

  const TOP_Y =
    CY + 4.5 * PITCH;

  const LEFT_X =
    CX - 2.5 * PITCH - SHIFT_GAP / 2;

  const RIGHT_X =
    CX + 2.5 * PITCH + SHIFT_GAP / 2;

  const LABEL_Y =
    TOP_Y + RADIUS + 0.32;

  const JOINT_W =
    8 * PITCH + 2 * RADIUS + 0.18;

  const JOINT_CENTER = [
    CX - 0.5 * PITCH,
    TOP_Y,
    0
  ];

  // ------------------------------------------------------------
  // Shift labels and movement.
  //
  // The grid is divided into two 5-by-10 blocks.
  // The underlying 100 parts do not change.
  // ------------------------------------------------------------

  function shiftLabels() {
    const left = txt(
      'MORNING: 50',
      P ? 18 : 16,
      MORNING,
      [LEFT_X, LABEL_Y, 0],
      true,
      HALF_W + 0.10
    );

    const right = txt(
      'AFTERNOON: 50',
      P ? 18 : 16,
      AFTERNOON,
      [RIGHT_X, LABEL_Y, 0],
      true,
      HALF_W + 0.10
    );

    const divider = new M.DashedLine({
      start: [
        CX,
        CY + GRID_H / 2,
        0
      ],
      end: [
        CX,
        CY - GRID_H / 2,
        0
      ],
      color: C.muted
    });

    return {
      left,
      right,
      divider,
      all: [left, right, divider]
    };
  }

  function splitGrid(parts) {
    const moves = parts.map(d => {
      const target = gridPos(d, true);

      const a = new M.Transform(
        d.sq,
        square(target, truthColor(d))
      );

      d.pos = target;

      return a;
    });

    return new M.LaggedStart(
      moves,
      {
        lagRatio: 0.008,
        runTime: 1.7
      }
    );
  }

  function makeShiftPicture() {
    const parts = makeGrid(true, true);
    const labels = shiftLabels();

    const morning = parts.filter(d => d.morning);

    const afternoon = parts.filter(d => !d.morning);

    const morningFaulty = morning.filter(d => d.faulty);

    const afternoonFaulty = afternoon.filter(d => d.faulty);

    return {
      parts,
      labels,
      morning,
      afternoon,
      morningFaulty,
      afternoonFaulty,

      all: [
        ...squares(parts),
        ...labels.all
      ],

      leftOnly: [
        ...squares(morning),
        labels.left,
        labels.divider
      ],

      rightOnly: [
        ...squares(afternoon),
        labels.right,
        labels.divider
      ]
    };
  }

  // ------------------------------------------------------------
  // Compact arrangement of the eighteen beeping parts.
  //
  // Nine orange squares in the top row.
  // Nine teal squares in the bottom row.
  // Every retained square keeps its white ring.
  // ------------------------------------------------------------

  const COMPACT_PITCH = P ? 0.60 : 0.44;

  const COMPACT_DY = P ? 0.52 : 0.40;

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
  // 0–4: recall conditioning and introduce today's question.
  // ------------------------------------------------------------

  let parts = makeGrid(false, false);

  let faulty = parts.filter(d => d.faulty);
  let sound = parts.filter(d => !d.faulty);
  let beeping = parts.filter(d => d.beep);

  await until(S(0));
  await play(
    ...picture(squares(parts), 1.6),
    ...say('BACK TO OUR 100 PARTS')
  );

  // 1: reveal the ten faulty and ninety sound parts.

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

  // 2: the starting chance of a fault.

  await until(S(2));
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
    ...say('STARTING CHANCE: 10%', C.amber)
  );

  // 3: recall that a beep changes the counting group.

  await until(S(3));
  await play(
    ...clearFocus(),
    ...picture(objects(parts), 1.05),
    ...fbox([
      ['Before a beep: 10%', C.muted],
      ['Given a beep: 9 ÷ 18', WHITE],
      ['= 50%', C.amber]
    ], C.amber),
    ...say('A BEEP CHANGED 10% TO 50%', C.amber)
  );

  // 4: does every new piece of information matter?

  await until(S(4));
  await play(
    ...picture(squares(parts), 0.85),
    ...fbox([
      ['New information', C.violet],
      'Does the chance change?',
      ['Or stay the same?', C.green]
    ], C.violet),
    ...say('DOES EVERY NEW FACT MATTER?', C.violet)
  );

  // ------------------------------------------------------------
  // 5–10: introduce the two shifts and split the grid.
  // ------------------------------------------------------------

  // 5: a shift is a team working at set hours.

  await until(S(5));
  await play(
    ...fbox([
      ['Two teams, two shifts', C.violet],
      ['Morning team', MORNING],
      ['Afternoon team', AFTERNOON]
    ], C.violet),
    ...say('SHIFT = TEAM WORKING AT SET HOURS', C.violet)
  );

  // 6: fifty parts came from each shift.

  await until(S(6));
  await play(
    ...fbox([
      ['Morning: 50 parts', MORNING],
      ['Afternoon: 50 parts', AFTERNOON],
      ['50 + 50 = 100', C.ink]
    ]),
    ...say('50 PARTS FROM EACH SHIFT')
  );

  // 7: move the left half left and the right half right.

  const firstShiftLabels = shiftLabels();

  await until(S(7));
  await play(
    splitGrid(parts),
    ...picture([
      ...squares(parts),
      ...firstShiftLabels.all
    ], 1.1),
    ...say('MORNING LEFT. AFTERNOON RIGHT.')
  );

  let morning = parts.filter(d => d.morning);

  let afternoon = parts.filter(d => !d.morning);

  let morningFaulty = morning.filter(d => d.faulty);

  let afternoonFaulty = afternoon.filter(d => d.faulty);

  const firstShiftAll = [
    ...squares(parts),
    ...firstShiftLabels.all
  ];

  const firstMorningOnly = [
    ...squares(morning),
    firstShiftLabels.left,
    firstShiftLabels.divider
  ];

  const firstAfternoonOnly = [
    ...squares(afternoon),
    firstShiftLabels.right,
    firstShiftLabels.divider
  ];

  // 8: draw attention to the orange squares.

  await until(S(8));
  await play(
    pulse(squares(faulty), ORANGE, 1.0),
    ...say('LOOK AT THE ORANGE SQUARES', ORANGE)
  );

  // 9: five faulty parts in the morning group.

  await until(S(9));
  await play(
    ...focus(
      HALF_W,
      ROW_H,
      [LEFT_X, TOP_Y, 0],
      ORANGE
    ),
    ...fbox([
      ['Morning shift', MORNING],
      ['5 faulty parts', ORANGE],
      ['45 sound parts', TEAL]
    ], MORNING),
    ...say('MORNING: 5 FAULTY', ORANGE)
  );

  // 10: five faulty parts in the afternoon group.

  await until(S(10));
  await play(
    ...focus(
      HALF_W,
      ROW_H,
      [RIGHT_X, TOP_Y, 0],
      ORANGE
    ),
    ...fbox([
      ['Afternoon shift', AFTERNOON],
      ['5 faulty parts', ORANGE],
      ['45 sound parts', TEAL]
    ], AFTERNOON),
    ...say('AFTERNOON: 5 FAULTY', ORANGE)
  );

  // ------------------------------------------------------------
  // 11–16: condition on the shift.
  //
  // The denominator shrinks from 100 to 50.
  // The numerator shrinks from 10 to 5.
  // The resulting share remains 10%.
  // ------------------------------------------------------------

  // 11: we learn that our part came from the morning shift.

  await until(S(11));
  await play(
    ...picture(firstMorningOnly, 1.45),
    ...focus(
      HALF_W,
      GRID_H,
      [LEFT_X, CY, 0],
      MORNING
    ),
    ...fbox([
      ['Known fact:', C.violet],
      ['Our part is from morning.', MORNING],
      ['Only 50 possible parts', C.ink]
    ], MORNING),
    ...say('KEEP ONLY THE MORNING SHIFT', MORNING)
  );

  // 12: count within the fifty morning parts.

  await until(S(12));
  await play(
    pulse(
      squares(morningFaulty),
      ORANGE,
      1.2
    ),
    ...fbox([
      ['5 faulty parts', ORANGE],
      ['÷ 50 morning parts', MORNING]
    ], MORNING),
    ...say('5 FAULTY OUT OF 50', ORANGE)
  );

  // 13: calculate the conditional probability.

  await until(S(13));
  await play(
    ...fbox([
      ['5 ÷ 50', C.ink],
      ['= 10%', C.amber]
    ], C.amber),
    ...say('5 OUT OF 50 = 10%', C.amber)
  );

  // 14: compare the starting chance with the new chance.

  await until(S(14));
  await play(
    ...fbox([
      ['Before: 10/100 = 10%', C.muted],
      ['Morning: 5/50 = 10%', MORNING],
      ['Same chance', C.green]
    ], C.green),
    ...say('THE CHANCE DID NOT CHANGE', C.green)
  );

  // 15: try conditioning on the afternoon shift instead.

  await until(S(15));
  await play(
    ...picture(firstAfternoonOnly, 1.25),
    ...focus(
      HALF_W,
      GRID_H,
      [RIGHT_X, CY, 0],
      AFTERNOON
    ),
    ...fbox([
      ['Afternoon shift', AFTERNOON],
      ['5 faulty ÷ 50 parts', ORANGE],
      ['= 10%', C.green]
    ], C.green),
    ...say('AFTERNOON: 10% AGAIN', C.green)
  );

  // 16: restore both shifts and compare.

  await until(S(16));
  await play(
    ...picture(firstShiftAll, 1.15),
    ...focus(
      SPLIT_W,
      ROW_H,
      [CX, TOP_Y, 0],
      ORANGE
    ),
    ...fbox([
      ['Overall:   10%', C.muted],
      ['Morning:   10%', MORNING],
      ['Afternoon: 10%', AFTERNOON],
      ['Nothing changed', C.green]
    ], C.green),
    ...say('THE SHIFT TELLS US NOTHING NEW', C.green)
  );

  // ------------------------------------------------------------
  // 17–18: name the concept of independence.
  // ------------------------------------------------------------

  await until(S(17));
  await play(
    ...clearFocus(),
    ...fbox([
      ['Independent', C.green],
      'Learning one thing',
      'does not change the',
      'chance of the other.'
    ], C.green),
    ...say('INDEPENDENT = CHANCE UNCHANGED', C.green)
  );

  await until(S(18));
  await play(
    pulse(
      [
        firstShiftLabels.left,
        firstShiftLabels.right
      ],
      C.green,
      1.3
    ),
    ...fbox([
      ['Fault and shift', C.ink],
      ['10% → 10%', C.green],
      ['Independent', C.green]
    ], C.green),
    ...say('FAULT AND SHIFT ARE INDEPENDENT', C.green)
  );

  // ------------------------------------------------------------
  // 19–22: compare with the scanner's beep.
  //
  // Unlike the shift, the beep changes the chance of a fault.
  // ------------------------------------------------------------

  const beepGrid = makeGrid(false, true);

  const beepParts = beepGrid.filter(d => d.beep);

  const beepFaulty = beepParts.filter(d => d.faulty);

  const beepSound = beepParts.filter(d => !d.faulty);

  // 19: return to the original grid with scanner results.

  await until(S(19));
  await play(
    ...picture(objects(beepGrid), 0.85),
    ...fbox([
      ['Another known fact', C.violet],
      ['Our part beeped.', WHITE]
    ], C.violet),
    ...say('NOW COMPARE WITH THE BEEP', WHITE)
  );

  // 20: keep only the eighteen ringed parts.

  await until(S(20));
  await play(
    ...picture(objects(beepParts), 1.15),
    ...fbox([
      ['Before: 10/100 = 10%', C.muted],
      ['Given beep: 9/18', WHITE],
      ['= 50%', C.amber]
    ], C.amber),
    ...say('THE BEEP CHANGES 10% TO 50%', C.amber)
  );

  await play(
    gatherBeeps(beepParts)
  );

  // 21: the chance changed, so the two events are dependent.

  await until(S(21));
  await play(
    ...focus(
      COMPACT_W,
      COMPACT_H,
      [CX, CY, 0],
      WHITE
    ),
    ...fbox([
      ['Fault and beep', C.ink],
      ['10% → 50%', C.amber],
      ['Dependent', C.violet]
    ], C.violet),
    ...say('FAULT AND BEEP ARE DEPENDENT', C.violet)
  );

  // 22: this dependence is why the scanner is informative.

  await until(S(22));
  await play(
    pulse(
      rings(beepParts),
      WHITE,
      1.5
    ),
    ...fbox([
      ['A useful scanner', C.green],
      ['A beep carries information.', WHITE],
      ['It changes our chance.', C.amber]
    ], C.green),
    ...say('THE BEEP TELLS US SOMETHING', C.green)
  );

  // ------------------------------------------------------------
  // 23–24: everyday comparison.
  //
  // Weather in a far-away country does not affect this bus.
  // Heavy rain on the bus's own street might affect it.
  //
  // The pictures represent the narrated examples, not measured
  // weather or transport probabilities.
  // ------------------------------------------------------------

  const WEATHER_X = CX - (P ? 1.65 : 1.45);

  const BUS_X = CX + (P ? 1.65 : 1.45);

  const ICON_Y = CY + 0.15;

  function cloud(pos, color = C.muted, rainy = true) {
    const x = pos[0];
    const y = pos[1];

    const clouds = [
      [-0.36, 0.02, 0.30],
      [0.00, 0.20, 0.40],
      [0.38, 0.02, 0.31]
    ].map(([dx, dy, r]) => {
      const c = new M.Circle({
        radius: r,
        color,
        strokeWidth: 1.8
      });

      c.setFill(color, 0.90);
      c.moveTo([x + dx, y + dy, 0]);

      return c;
    });

    const base = rect(
      1.10,
      0.28,
      [x, y - 0.12, 0],
      color,
      0.90,
      1
    );

    const items = [...clouds, base];

    if (rainy) {
      for (let k = 0; k < 4; k++) {
        const dx = (k - 1.5) * 0.25;

        items.push(
          line(
            [x + dx + 0.08, y - 0.39, 0],
            [x + dx - 0.08, y - 0.76, 0],
            C.cyan,
            3
          )
        );
      }
    }

    return new M.VGroup(...items);
  }

  function bus(pos) {
    const x = pos[0];
    const y = pos[1];

    const shell = new M.RoundedRectangle({
      width: 1.55,
      height: 0.82,
      cornerRadius: 0.15,
      color: C.amber,
      strokeWidth: 2.5
    });

    shell.setFill(C.amber, 0.22);
    shell.moveTo([x, y, 0]);

    const windows = Array.from(
      { length: 3 },
      (_, k) => rect(
        0.32,
        0.30,
        [
          x - 0.46 + k * 0.46,
          y + 0.15,
          0
        ],
        C.cyan,
        0.62,
        1.5
      )
    );

    const wheels = [-0.48, 0.48].map(dx => {
      const c = new M.Circle({
        radius: 0.17,
        color: C.muted,
        strokeWidth: 2
      });

      c.setFill(C.card, 1);
      c.moveTo([
        x + dx,
        y - 0.43,
        0
      ]);

      return c;
    });

    const headlight = rect(
      0.15,
      0.12,
      [x + 0.68, y - 0.14, 0],
      WHITE,
      0.95,
      1
    );

    const road = line(
      [x - 0.95, y - 0.65, 0],
      [x + 0.95, y - 0.65, 0],
      C.muted,
      2
    );

    return new M.VGroup(
      shell,
      ...windows,
      ...wheels,
      headlight,
      road
    );
  }

  function weatherPicture(local) {
    const weather = cloud(
      [WEATHER_X, ICON_Y + 0.25, 0],
      local ? C.cyan : C.muted,
      true
    );

    const vehicle = bus(
      [BUS_X, ICON_Y, 0]
    );

    const weatherLabel = txt(
      local ? 'HEAVY RAIN HERE' : 'FAR-AWAY WEATHER',
      P ? 17 : 15,
      local ? C.cyan : C.muted,
      [WEATHER_X, ICON_Y + 1.10, 0],
      false,
      P ? 2.8 : 2.5
    );

    const busLabel = txt(
      'YOUR BUS',
      P ? 17 : 15,
      C.amber,
      [BUS_X, ICON_Y + 1.10, 0]
    );

    const linkStart = [
      WEATHER_X + 0.77,
      ICON_Y + 0.10,
      0
    ];

    const linkEnd = [
      BUS_X - 0.85,
      ICON_Y + 0.10,
      0
    ];

    const connection = new M.DashedLine({
      start: linkStart,
      end: linkEnd,
      color: local ? C.amber : C.muted
    });

    const items = [
      weather,
      vehicle,
      weatherLabel,
      busLabel,
      connection
    ];

    if (local) {
      const tip1 = line(
        [
          linkEnd[0] - 0.18,
          linkEnd[1] + 0.13,
          0
        ],
        linkEnd,
        C.amber,
        2.5
      );

      const tip2 = line(
        [
          linkEnd[0] - 0.18,
          linkEnd[1] - 0.13,
          0
        ],
        linkEnd,
        C.amber,
        2.5
      );

      items.push(tip1, tip2);
    } else {
      const mx = (linkStart[0] + linkEnd[0]) / 2;
      const my = linkStart[1];

      items.push(
        line(
          [mx - 0.12, my - 0.15, 0],
          [mx + 0.12, my + 0.15, 0],
          C.muted,
          3
        ),
        line(
          [mx - 0.12, my + 0.15, 0],
          [mx + 0.12, my - 0.15, 0],
          C.muted,
          3
        )
      );
    }

    const tag = pill(
      local
        ? 'MIGHT CHANGE THE CHANCE'
        : 'DOES NOT CHANGE THE CHANCE',
      local ? C.violet : C.green,
      P ? 16 : 15
    );

    tag.moveTo([
      CX,
      CY - 1.35,
      0
    ]);

    items.push(tag);

    return items;
  }

  const farWeather = weatherPicture(false);

  await until(S(23));
  await play(
    ...clearFocus(),
    ...picture(farWeather, 1.2),
    ...fbox([
      ['Far-away weather', C.muted],
      ['Chance your bus is late:', C.amber],
      ['Unchanged', C.green]
    ], C.green),
    ...say('FAR-AWAY WEATHER: NO EFFECT', C.green)
  );

  // 24: local heavy rain might change the bus's chance of delay.

  const localWeather = weatherPicture(true);

  await until(S(24));
  await play(
    ...picture(localWeather, 1.2),
    ...fbox([
      ['Far-away weather:', C.muted],
      ['Independent', C.green],
      ['Heavy rain on your street:', C.cyan],
      ['Can be dependent', C.violet]
    ], C.violet),
    ...say('LOCAL RAIN MIGHT CHANGE THE CHANCE', C.violet)
  );

  // ------------------------------------------------------------
  // 25–27: the first independence rule.
  //
  // Chance of A given B = chance of A.
  //
  // The shift example makes the equality concrete.
  // ------------------------------------------------------------

  const formulaShift = makeShiftPicture();

  await until(S(25));
  await play(
    ...picture(formulaShift.all, 1.15),
    ...clearBox(),
    ...say('THE RULE IN ONE LINE')
  );

  // 26: independence means the conditional chance is unchanged.

  await until(S(26));
  await play(
    ...focus(
      HALF_W,
      GRID_H,
      [LEFT_X, CY, 0],
      MORNING
    ),
    ...fbox([
      ['A and B are independent', C.green],
      ['when'],
      ['chance of A given B', C.violet],
      ['= chance of A', C.green]
    ], C.green),
    ...say('CONDITIONAL CHANCE = ORIGINAL CHANCE', C.green)
  );

  // 27: interpret the letters using the factory.

  await until(S(27));
  await play(
    ...picture(formulaShift.leftOnly, 1.1),
    ...fbox([
      ['A = faulty', ORANGE],
      ['B = morning shift', MORNING],
      ['Chance of A given B: 10%', C.green],
      ['Chance of A:         10%', C.green]
    ], C.green),
    ...say('LEARNING B LEAVES A UNCHANGED', C.green)
  );

  // ------------------------------------------------------------
  // 28–30: the second check, using the product rule.
  // ------------------------------------------------------------

  await until(S(28));
  await play(
    ...clearFocus(),
    ...picture(formulaShift.all, 1.0),
    ...fbox([
      ['A second way to check', C.violet],
      ['Use the product rule', C.ink]
    ], C.violet),
    ...say('CHECK WITH THE PRODUCT RULE', C.violet)
  );

  // 29: recall the general product rule.

  await until(S(29));
  await play(
    ...fbox([
      ['Chance of A and B', C.ink],
      ['= chance of A', ORANGE],
      ['  × chance of B given A', C.violet]
    ], C.cyan),
    ...say('CHANCE OF BOTH = MULTIPLY')
  );

  // 30: independent events use their two plain chances.

  await until(S(30));
  await play(
    ...fbox([
      ['If A and B are independent:', C.green],
      ['chance of B given A', C.violet],
      ['= chance of B', C.green]
    ], C.green),
    ...say('THE SECOND CHANCE STAYS THE SAME', C.green)
  );

  await until(S(30) + 4.0);

  await play(
    ...fbox([
      ['For independent events:', C.green],
      ['chance of A and B', C.ink],
      ['= chance of A', ORANGE],
      ['  × chance of B', C.violet]
    ], C.green),
    ...say('MULTIPLY THE TWO PLAIN CHANCES', C.green)
  );

  // ------------------------------------------------------------
  // 31–32: multiplication check for morning and faulty.
  //
  // Predicted if independent:
  // 50% × 10% = 5%.
  //
  // Actual count:
  // 5 morning faulty parts / 100 total parts = 5%.
  // ------------------------------------------------------------

  // 31: multiply the two marginal probabilities.

  await until(S(31));
  await play(
    ...focus(
      HALF_W,
      GRID_H,
      [LEFT_X, CY, 0],
      MORNING
    ),
    ...fbox([
      ['Morning: 50%', MORNING],
      ['Faulty:  10%', ORANGE],
      ['50% × 10%', C.ink],
      ['= 5%', C.amber]
    ], C.amber),
    ...say('IF INDEPENDENT: 50% × 10% = 5%', C.amber)
  );

  // 32: verify the predicted five percent on the actual grid.

  await until(S(32));
  await play(
    ...focus(
      HALF_W,
      ROW_H,
      [LEFT_X, TOP_Y, 0],
      ORANGE
    ),
    pulse(
      squares(formulaShift.morningFaulty),
      ORANGE,
      1.3
    ),
    ...fbox([
      ['Predicted: 5%', C.amber],
      ['Actual: 5 ÷ 100 = 5%', ORANGE],
      ['They match', C.green]
    ], C.green),
    ...say('5 MORNING FAULTY PARTS: IT MATCHES', C.green)
  );

  // ------------------------------------------------------------
  // 33–36: multiplication check for beep and faulty.
  //
  // If independent:
  // 18% × 10% = 1.8%.
  //
  // Actual count:
  // 9 faulty beeping parts / 100 total parts = 9%.
  //
  // The mismatch shows that fault and beep are dependent.
  // ------------------------------------------------------------

  const checkGrid = makeGrid(false, true);

  const checkBeeps = checkGrid.filter(d => d.beep);

  const checkFaulty = checkGrid.filter(d => d.faulty);

  const checkJoint = checkGrid.filter(
    d => d.faulty && d.beep
  );

  await until(S(33));
  await play(
    ...clearFocus(),
    ...picture(objects(checkGrid), 0.95),
    ...fbox([
      ['Same check, new pair:', C.violet],
      ['beep and faulty', WHITE]
    ], C.violet),
    ...say('TRY THE SAME CHECK WITH THE BEEP', WHITE)
  );

  // 34: calculate what independence would predict.

  await until(S(34));
  await play(
    pulse(
      rings(checkBeeps),
      WHITE,
      1.4
    ),
    ...fbox([
      ['18 beeps out of 100', WHITE],
      ['Chance of beep = 18%', WHITE],
      ['Chance of faulty = 10%', ORANGE]
    ], C.violet),
    ...say('BEEP: 18%. FAULTY: 10%.')
  );

  await until(S(34) + 4.0);

  await play(
    ...fbox([
      ['If they were independent:', C.violet],
      ['10% × 18%', C.ink],
      ['= 1.8%', C.amber]
    ], C.amber),
    ...say('INDEPENDENCE WOULD PREDICT 1.8%', C.amber)
  );

  // 35: highlight the nine orange ringed squares.

  await until(S(35));
  await play(
    ...focus(
      JOINT_W,
      ROW_H,
      JOINT_CENTER,
      ORANGE
    ),
    pulse(
      squares(checkJoint),
      ORANGE,
      1.4
    ),
    ...fbox([
      ['Real count:', C.ink],
      ['9 faulty + beep', ORANGE],
      ['9 ÷ 100 = 9%', C.amber]
    ], ORANGE),
    ...say('ACTUAL CHANCE: 9%', ORANGE)
  );

  // 36: the two answers do not match.

  await until(S(36));
  await play(
    ...fbox([
      ['If independent: 1.8%', C.muted],
      ['Actual chance:  9%', ORANGE],
      ['1.8% ≠ 9%', C.amber],
      ['Dependent', C.violet]
    ], C.violet),
    ...say('THE NUMBERS DO NOT MATCH', C.violet)
  );

  // ------------------------------------------------------------
  // 37–39: use independence to decide which facts matter.
  // ------------------------------------------------------------

  await until(S(37));
  await play(
    ...clearFocus(),
    ...fbox([
      ['Which facts matter?', C.violet],
      ['Independent: no change', C.green],
      ['Dependent: change', C.amber]
    ], C.violet),
    ...say('WHICH FACTS CARRY INFORMATION?', C.violet)
  );

  // 38: the shift is independent of fault status here.

  const usefulShift = makeShiftPicture();

  await until(S(38));
  await play(
    ...picture(usefulShift.all, 1.1),
    ...fbox([
      ['Fact: which shift?', MORNING],
      ['Fault chance: 10% → 10%', C.green],
      ['No new information', C.green]
    ], C.green),
    ...say('INDEPENDENT FACT: NO CHANGE', C.green)
  );

  // 39: the beep carries information about fault status.

  const usefulBeepGrid = makeGrid(false, true);

  const usefulBeeps = usefulBeepGrid.filter(d => d.beep);

  await until(S(39));
  await play(
    ...picture(objects(usefulBeepGrid), 1.05),
    ...fbox([
      ['Fact: the part beeped', WHITE],
      ['Fault chance: 10% → 50%', C.amber],
      ['Useful information', C.violet]
    ], C.violet),
    ...say('DEPENDENT FACT: USE THE INFORMATION', C.violet)
  );

  // ------------------------------------------------------------
  // 40–42: common trap.
  //
  // Independent does not mean mutually exclusive.
  // Morning and faulty can happen together.
  // Five morning parts are faulty in this example.
  // ------------------------------------------------------------

  const trapShift = makeShiftPicture();

  await until(S(40));
  await play(
    ...picture(trapShift.all, 1.1),
    ...focus(
      HALF_W,
      ROW_H,
      [LEFT_X, TOP_Y, 0],
      ORANGE
    ),
    ...fbox([
      ['Common trap', C.amber],
      'Independent does NOT',
      'mean they cannot',
      'happen together.'
    ], C.amber),
    ...say('INDEPENDENT DOES NOT MEAN NEVER TOGETHER', C.amber)
  );

  // 41: the five morning faulty squares are a counterexample.

  await until(S(41));
  await play(
    pulse(
      squares(trapShift.morningFaulty),
      ORANGE,
      1.2
    ),
    ...fbox([
      ['Morning AND faulty', MORNING],
      ['5 parts', ORANGE],
      ['They can happen together.', C.green]
    ], C.green),
    ...say('5 PARTS ARE BOTH MORNING AND FAULTY', ORANGE)
  );

  // 42: return to the actual definition.

  await until(S(42));
  await play(
    ...clearFocus(),
    ...fbox([
      ['Knowing the shift:', MORNING],
      ['Fault chance before: 10%', C.muted],
      ['Fault chance after:  10%', C.green],
      ['That is independence.', C.green]
    ], C.green),
    ...say('INDEPENDENCE MEANS NO CHANGE IN CHANCE', C.green)
  );

  // ------------------------------------------------------------
  // 43: real data rarely gives exactly equal observed shares.
  //
  // Do not introduce an arbitrary threshold for declaring
  // independence. The later course will address sampling
  // variation and how close is close enough.
  // ------------------------------------------------------------

  const REAL_Y = CY + 0.15;

  const REAL_W = P ? 5.5 : 4.6;

  function comparisonBar(
    y,
    fraction,
    label,
    color,
    result
  ) {
    const x = CX;

    const track = new M.RoundedRectangle({
      width: REAL_W,
      height: 0.36,
      cornerRadius: 0.08,
      color: C.muted,
      strokeWidth: 1.5
    });

    track.setFill(C.card, 0.92);
    track.moveTo([x, y, 0]);

    const fillW = REAL_W * fraction;

    const fill = rect(
      fillW,
      0.30,
      [
        x - REAL_W / 2 + fillW / 2,
        y,
        0
      ],
      color,
      0.9,
      1
    );

    const lab = txt(
      label,
      P ? 18 : 16,
      color,
      [x, y + 0.43, 0]
    );

    const val = txt(
      result,
      P ? 20 : 18,
      color,
      [
        x + REAL_W / 2 - 0.68,
        y,
        0
      ],
      true,
      1.15
    );

    return new M.VGroup(
      track,
      fill,
      lab,
      val
    );
  }

  // Illustrative observed shares only.
  // These are not additional factory data and do not establish
  // whether any real pair of events is independent.

  const sampleBar1 = comparisonBar(
    REAL_Y + 0.62,
    0.10,
    'ONE OBSERVED GROUP',
    MORNING,
    '10.0%'
  );

  const sampleBar2 = comparisonBar(
    REAL_Y - 0.62,
    0.102,
    'ANOTHER OBSERVED GROUP',
    AFTERNOON,
    '10.2%'
  );

  const realNote = txt(
    'Illustration only',
    P ? 16 : 15,
    C.muted,
    [
      CX,
      REAL_Y - 1.30,
      0
    ]
  );

  const realTag = pill(
    'HOW CLOSE IS CLOSE ENOUGH?',
    C.amber,
    P ? 17 : 16
  );

  realTag.moveTo([
    CX,
    REAL_Y - 2.00,
    0
  ]);

  await until(S(43));
  await play(
    ...picture([
      sampleBar1,
      sampleBar2,
      realNote,
      realTag
    ], 1.2),
    ...fbox([
      ['In real data', C.violet],
      'Observed chances are',
      'rarely exactly equal.',
      ['Close enough? Learn later.', C.amber]
    ], C.violet),
    ...say('REAL DATA IS RARELY EXACTLY EQUAL', C.violet)
  );

  // ------------------------------------------------------------
  // 44: preview the next lesson, total probability.
  //
  // Show the familiar probability tree.
  // Both the faulty and sound groups can lead to a beep.
  // Leave the calculation of the overall beep probability
  // to the next lesson.
  // ------------------------------------------------------------

  const ROOT = P
    ? [CX, 0.90, 0]
    : [-5.85, CY, 0];

  const F = P
    ? [CX - 1.80, -0.80, 0]
    : [-3.60, 0.65, 0];

  const G = P
    ? [CX + 1.80, -0.80, 0]
    : [-3.60, -1.70, 0];

  const FB = P
    ? [CX - 2.65, -2.85, 0]
    : [-0.75, 1.25, 0];

  const FQ = P
    ? [CX - 0.90, -2.85, 0]
    : [-0.75, 0.05, 0];

  const GB = P
    ? [CX + 0.90, -2.85, 0]
    : [-0.75, -1.10, 0];

  const GQ = P
    ? [CX + 2.65, -2.85, 0]
    : [-0.75, -2.30, 0];

  const ROOT_W = P ? 1.75 : 1.40;
  const GROUP_W = P ? 1.65 : 1.40;
  const LEAF_W = P ? 1.52 : 1.40;

  const NODE_H = P ? 0.62 : 0.55;

  function treeNode(pos, label, color, width) {
    const r = new M.RoundedRectangle({
      width,
      height: NODE_H,
      cornerRadius: 0.12,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.96);
    r.moveTo(pos);

    const t = txt(
      label,
      P ? 17 : 15,
      color,
      pos,
      false,
      width - 0.15
    );

    return new M.VGroup(r, t);
  }

  function edgePoints(a, b, aw, bw) {
    if (P) {
      return [
        [
          a[0],
          a[1] - NODE_H / 2,
          0
        ],
        [
          b[0],
          b[1] + NODE_H / 2,
          0
        ]
      ];
    }

    return [
      [
        a[0] + aw / 2,
        a[1],
        0
      ],
      [
        b[0] - bw / 2,
        b[1],
        0
      ]
    ];
  }

  function treeBranch(
    a,
    b,
    aw,
    bw,
    value,
    color,
    glow
  ) {
    const [start, end] = edgePoints(
      a, b, aw, bw
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

    const pos = [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2 + 0.09,
      0
    ];

    const t = T(
      value,
      P ? 18 : 16,
      color,
      true
    );

    const bg = new M.RoundedRectangle({
      width: t.getWidth() + 0.18,
      height: P ? 0.34 : 0.30,
      cornerRadius: 0.08,
      color,
      strokeWidth: 1
    });

    bg.setFill(C.card, 1);
    bg.moveTo(pos);

    t.moveTo(pos);

    return new M.VGroup(
      halo,
      core,
      bg,
      t
    );
  }

  const previewRoot = treeNode(
    ROOT,
    '100 PARTS',
    C.cyan,
    ROOT_W
  );

  const previewFaulty = treeNode(
    F,
    'FAULTY',
    ORANGE,
    GROUP_W
  );

  const previewSound = treeNode(
    G,
    'SOUND',
    TEAL,
    GROUP_W
  );

  const previewFB = treeNode(
    FB,
    'BEEP',
    WHITE,
    LEAF_W
  );

  const previewFQ = treeNode(
    FQ,
    'NO BEEP',
    C.muted,
    LEAF_W
  );

  const previewGB = treeNode(
    GB,
    'BEEP',
    WHITE,
    LEAF_W
  );

  const previewGQ = treeNode(
    GQ,
    'NO BEEP',
    C.muted,
    LEAF_W
  );

  const previewRF = treeBranch(
    ROOT,
    F,
    ROOT_W,
    GROUP_W,
    '10%',
    ORANGE,
    ORANGE_GLOW
  );

  const previewRG = treeBranch(
    ROOT,
    G,
    ROOT_W,
    GROUP_W,
    '90%',
    TEAL,
    TEAL_GLOW
  );

  const previewFBE = treeBranch(
    F,
    FB,
    GROUP_W,
    LEAF_W,
    '90%',
    ORANGE,
    ORANGE_GLOW
  );

  const previewFQE = treeBranch(
    F,
    FQ,
    GROUP_W,
    LEAF_W,
    '10%',
    C.muted,
    ORANGE_GLOW
  );

  const previewGBE = treeBranch(
    G,
    GB,
    GROUP_W,
    LEAF_W,
    '10%',
    TEAL,
    TEAL_GLOW
  );

  const previewGQE = treeBranch(
    G,
    GQ,
    GROUP_W,
    LEAF_W,
    '90%',
    C.muted,
    TEAL_GLOW
  );

  const previewTree = [
    previewRF,
    previewRG,
    previewFBE,
    previewFQE,
    previewGBE,
    previewGQE,
    previewRoot,
    previewFaulty,
    previewSound,
    previewFB,
    previewFQ,
    previewGB,
    previewGQ
  ];

  await until(S(44));
  await play(
    ...picture(previewTree, 1.15),
    ...fbox([
      ['Next lesson', C.violet],
      ['Two ways to a beep', WHITE],
      ['Overall chance of beep = ?']
    ], C.violet),
    ...say('NEXT: THE OVERALL CHANCE OF A BEEP', C.violet)
  );

  // ------------------------------------------------------------
  // 45: final takeaway.
  //
  // Revisit the two equal-sized shifts.
  // Both groups contain the same share of faulty parts.
  // Learning the shift leaves the fault chance unchanged.
  // ------------------------------------------------------------

  const finalShift = makeShiftPicture();

  const finalMorningRate = pill(
    '10%',
    C.green,
    P ? 21 : 19
  );

  // Below the grid, not on top of the squares.
  finalMorningRate.moveTo([
    LEFT_X,
    CY - GRID_H / 2 - 0.32,
    0
  ]);

  const finalAfternoonRate = pill(
    '10%',
    C.green,
    P ? 21 : 19
  );

  finalAfternoonRate.moveTo([
    RIGHT_X,
    CY - GRID_H / 2 - 0.32,
    0
  ]);

  await until(S(45));
  await play(
    ...picture(finalShift.all, 1.15),
    ...focus(
      SPLIT_W,
      ROW_H,
      [CX, TOP_Y, 0],
      ORANGE
    ),
    ...fbox([
      ['Overall:   10/100 = 10%', C.muted],
      ['Morning:    5/50 = 10%', MORNING],
      ['Afternoon:  5/50 = 10%', AFTERNOON],
      ['Independent', C.green]
    ], C.green),
    ...say('INDEPENDENT = CHANCE UNCHANGED', C.green)
  );

  // Put the equal rates in the same positions on both halves.
  // The rate tags summarize the groups without changing the
  // underlying counts.

  await play(
    new M.FadeIn(finalMorningRate),
    new M.FadeIn(finalAfternoonRate),
    ...fbox([
      ['Chance of A given B', C.violet],
      ['= chance of A', C.green],
      ['10% = 10%', C.amber]
    ], C.green),
    ...say('LEARN SOMETHING. SAME CHANCE.', C.green)
  );

  await until(E(45));
}
