// lesson 4.1.1
// Sample spaces: eight tiles, eight possible outcomes.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
// Uses the supplied reference engine API; browser playback has not been tested here.

export default async function (L) {
  const { M, sc, P, FW, FH, C, S, E, T, pill, show, showA, until, play, LINE_Y } = L;

  const D = [1, 2, 3, 4, 5, 6, 7, 8];
  const BLUE = C.cyan, ORANGE = '#fb923c';
  const CLOTH = '#a58d72', CORD = '#d6bea0';

  const CX = P ? 0 : -2.6;
  const SP = Math.min(P ? 0.88 : 0.9, (FW - (P ? 0.9 : 6.8)) / 8);
  const TW = SP * 0.78;
  const ROW_Y = P ? -0.3 : 0.3;
  const BAR_Y = P ? -2.3 : -1.15;
  const PILL = P ? [0, 2.3, 0] : [CX, 1.85, 0];
  // Phone: formula box under the picture, so the lower part is used.
  const BOXP = P ? [0, -4.35, 0] : [4.3, -0.3, 0];
  // Bag: vertical offset and size (bigger and lower on the phone).
  const BAG_Y = P ? -0.35 : 0;
  const BS = P ? 1.3 : 1;

  const colx = k => CX + (k - 3.5) * SP;
  const pos = k => [colx(k), ROW_Y, 0];
  const colour = n => n <= 5 ? BLUE : ORANGE;
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const fade = objs => objs.map(o => new M.FadeOut(o));
  const appear = objs => objs.map(o => new M.FadeIn(o));

  const lag = (anims, runTime = 1.2, lagRatio = 0.12) =>
    new M.LaggedStart(anims, { lagRatio, runTime });

  function txt(s, size, color, p, mono = false) {
    const t = T(s, size, color, mono);
    t.moveTo(p);
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

  function outline(x, y, w, h, color = C.cyan, sw = 2) {
    const r = new M.RoundedRectangle({
      width: w,
      height: h,
      cornerRadius: 0.14,
      color,
      strokeWidth: sw
    });
    r.setFill(color, 0);
    r.moveTo([x, y, 0]);
    return r;
  }

  // Formula box: lines = ['text' | ['text', color]].
  // Leading spaces indent, as in the approved reference lesson.

  let boxNow = null;

  function replaceBox(g) {
    const a = [new M.FadeIn(g)];
    if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g;
    return a;
  }

  function clearBox() {
    if (!boxNow) return [];
    const a = [new M.FadeOut(boxNow)];
    boxNow = null;
    return a;
  }

  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.36 : 0.42;

    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));

    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;

    const widths = texts.map((t, i) => {
      const indent = rows[i][0].length - rows[i][0].trimStart().length;
      return t.getWidth() + cw * indent;
    });

    const wd = Math.max(...widths) + 0.7;
    const ht = rows.length * lh + (P ? 0.3 : 0.4);

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
    const top = BOXP[1] + (rows.length - 1) * lh / 2;

    texts.forEach((t, i) => {
      const ind = cw * (
        rows[i][0].length - rows[i][0].trimStart().length
      );

      t.moveTo([
        left + ind + t.getWidth() / 2,
        top - i * lh,
        0
      ]);
    });

    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 1.2 : 4.0;

    if (wd > maxw) {
      g.scale(maxw / wd);
      g.moveTo(BOXP);
    }

    return replaceBox(g);
  }

  // A vertically written fraction: numerator, short line, denominator.

  function fraction(n, d, p, color = C.amber, size = 22) {
    const a = T(String(n), size, color, true);
    const b = T(String(d), size, color, true);

    const w = Math.max(a.getWidth(), b.getWidth()) + 0.16;
    const dy = 0.23 * size / 22;

    a.moveTo([p[0], p[1] + dy, 0]);
    b.moveTo([p[0], p[1] - dy, 0]);

    const rule = line(
      [p[0] - w / 2, p[1], 0],
      [p[0] + w / 2, p[1], 0],
      color,
      2
    );

    return new M.VGroup(a, rule, b);
  }

  function fracBox(n, d, label = '', color = C.amber) {
    const f = fraction(n, d, [0, 0, 0], color, 24);
    const labelObj = label ? T(label, P ? 20 : 19, C.ink) : null;

    const contentW = f.getWidth() +
      (labelObj ? labelObj.getWidth() + 0.35 : 0);

    const wd = Math.max(1.4, contentW + 0.7);
    const ht = P ? 1.22 : 1.4;

    const r = new M.RoundedRectangle({
      width: wd,
      height: ht,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2
    });

    r.setFill(C.card, 0.95);
    r.moveTo(BOXP);

    const left = BOXP[0] - contentW / 2;

    f.moveTo([
      left + f.getWidth() / 2,
      BOXP[1],
      0
    ]);

    if (labelObj) {
      labelObj.moveTo([
        left + f.getWidth() + 0.35 + labelObj.getWidth() / 2,
        BOXP[1],
        0
      ]);
    }

    const g = labelObj
      ? new M.VGroup(r, f, labelObj)
      : new M.VGroup(r, f);

    const maxw = P ? FW - 1.2 : 4.0;

    if (wd > maxw) {
      g.scale(maxw / wd);
      g.moveTo(BOXP);
    }

    return replaceBox(g);
  }

  // Glowing square tiles.
  // All eight have exactly the same dimensions.
  // The numbers and colours remain fixed throughout the chapter.

  function tile(n, p, w = TW, color = colour(n), opacity = 0.82) {
    const halo = new M.RoundedRectangle({
      width: w + 0.1,
      height: w + 0.1,
      cornerRadius: 0.13,
      color,
      strokeWidth: 1
    });

    halo.setFill(color, 0.13);
    halo.moveTo(p);

    const face = new M.RoundedRectangle({
      width: w,
      height: w,
      cornerRadius: 0.1,
      color,
      strokeWidth: 2
    });

    face.setFill(color, opacity);
    face.moveTo(p);

    // A small edge suggests a flat game tile rather than a cube.

    const edge = line(
      [p[0] - w * 0.31, p[1] - w * 0.36, 0],
      [p[0] + w * 0.31, p[1] - w * 0.36, 0],
      C.ink,
      1
    );

    const size = Math.max(13, Math.round(27 * w / 0.7));

    const lab = txt(
      n === null ? ' ' : String(n),
      size,
      C.ink,
      [p[0], p[1] + 0.025, 0],
      true
    );

    return new M.VGroup(halo, face, edge, lab);
  }

  function tileRing(k, color = C.amber) {
    return outline(
      colx(k),
      ROW_Y,
      TW + 0.22,
      TW + 0.22,
      color,
      3
    );
  }

  function rowFrame(color = C.cyan) {
    return outline(
      CX,
      ROW_Y,
      7 * SP + TW + 0.42,
      TW + 0.48,
      color,
      2
    );
  }

  // Cloth bag: soft body, gathered neck, drawstring and stitched seams.
  // Construct fresh parts and position each with moveTo.

  // A soft sack: round body, narrow tied neck, frilled top.
  const SACK_R = [
    [0, -1.15], [0.9, -1.12], [1.45, -0.95], [1.72, -0.6], [1.78, -0.2],
    [1.62, 0.2], [1.25, 0.52], [0.75, 0.74], [0.4, 0.86],
    [0.62, 1.05], [0.82, 1.32], [0.5, 1.22], [0.25, 1.38], [0, 1.26]
  ];

  function bagAt(dx = 0) {
    const x = CX + dx;
    const y = BAG_Y - 0.08;
    const q = (px, py) => [x + px * BS, y + py * BS, 0];

    const right = SACK_R.map(([px, py]) => q(px, py));
    const left = SACK_R.slice(1, -1).reverse().map(([px, py]) => q(-px, py));

    const body = new M.Polygon({
      vertices: [...right, ...left],
      color: CLOTH,
      strokeWidth: 3
    });

    body.setFill(CLOTH, 0.2);

    const cord = line(q(-0.5, 0.86), q(0.5, 0.86), CORD, 4);
    const tail1 = line(q(0.42, 0.86), q(0.7, 0.45), CORD, 2);
    const tail2 = line(q(0.42, 0.86), q(0.9, 0.62), CORD, 2);

    const knot = new M.Dot({
      point: q(0.42, 0.86),
      radius: 0.07,
      color: CORD
    });

    return new M.VGroup(body, cord, tail1, tail2, knot);
  }

  const table = line(
    [CX - 3.3 * (P ? 1.1 : 1), BAG_Y - 1.28 * BS, 0],
    [CX + 3.3 * (P ? 1.1 : 1), BAG_Y - 1.28 * BS, 0],
    C.muted,
    3
  );

  const bag = bagAt();

  const miniPos = k => [
    CX + (k % 4 - 1.5) * 0.68 * BS,
    BAG_Y + (0.0 - Math.floor(k / 4) * 0.67) * BS,
    0
  ];

  const MW = 0.51 * BS;

  // 0: a small cloth bag on a table.

  await until(S(0));
  await play(
    new M.Create(table),
    new M.FadeIn(bag),
    ...say('A BAG ON A TABLE', C.muted)
  );

  // 1: eight flat tiles inside the bag.

  const mini = D.map((_, k) =>
    tile(null, miniPos(k), MW, C.muted, 0.48)
  );

  await until(S(1));
  await play(
    lag(mini.map(t => new M.FadeIn(t)), 1.5),
    ...say('8 FLAT TILES')
  );

  // 2: each tile has a number, from one to eight.

  await until(S(2));
  await play(
    lag(
      mini.map((t, k) =>
        new M.Transform(
          t,
          tile(D[k], miniPos(k), MW, C.muted, 0.65)
        )
      ),
      1.5,
      0.1
    ),
    ...say('NUMBERED 1 TO 8')
  );

  // 3: tiles 1-5 are blue; tiles 6-8 are orange.

  await until(S(3));
  await play(
    lag(
      mini.map((t, k) =>
        new M.Transform(
          t,
          tile(D[k], miniPos(k), MW, colour(D[k]))
        )
      ),
      3.0,
      0.18
    ),
    ...say('5 BLUE  /  3 ORANGE')
  );

  // 4: shake the bag and draw one tile without looking.
  // The drawn tile remains face down.

  const sq = (px, py) => [CX + px * BS, BAG_Y + py * BS, 0];

  const shakeMarks = [
    line(sq(-2.14, 0.5), sq(-1.9, 0.7), C.amber, 2),
    line(sq(-2.2, 0.13), sq(-1.9, 0.26), C.amber, 2),
    line(sq(1.92, 0.68), sq(2.15, 0.86), C.amber, 2)
  ];

  const drawP = P ? [3.15, BAG_Y - 1.0, 0] : [CX + 2.65, -0.55, 0];

  await until(S(4));
  await play(
    new M.Transform(bag, bagAt(-0.15)),
    ...fade(mini.filter((_, k) => k !== 2)),
    ...appear(shakeMarks),
    ...say('SHAKE AND DRAW ONE', C.amber)
  );

  await play(
    new M.Transform(bag, bagAt()),
    new M.Transform(
      mini[2],
      tile('?', drawP, TW, C.muted, 0.6),
      { pathArc: -0.8 }
    ),
    ...fade(shakeMarks)
  );

  // 5: what could come out?

  const question = txt(
    'which tile?',
    P ? 18 : 19,
    C.amber,
    [P ? drawP[0] - 0.2 : drawP[0], drawP[1] + 0.68, 0]
  );

  await until(S(5));
  await play(
    new M.FadeIn(question),
    new M.Indicate(mini[2], { color: C.amber }),
    ...say('WHAT COULD COME OUT?', C.amber)
  );

  // 6: lay all eight tiles in one row.

  const tiles = D.map((n, k) => tile(n, pos(k)));

  await until(S(6));
  await play(
    new M.FadeOut(bag),
    new M.FadeOut(table),
    new M.FadeOut(question),
    new M.FadeOut(mini[2]),
    lag(tiles.map(t => new M.FadeIn(t)), 1.8, 0.15),
    ...say('LAY OUT EVERY POSSIBILITY')
  );

  // 7: read the row, blue first, then orange.

  await until(S(7));
  await play(
    lag(
      tiles.map((t, k) =>
        new M.Indicate(t, { color: colour(D[k]) })
      ),
      4.4,
      0.5
    ),
    ...say('1–5 BLUE  /  6–8 ORANGE')
  );

  // 8: each tile is one way the draw can turn out.

  const oneRing = tileRing(0, C.amber);

  await until(S(8));
  await play(
    new M.Create(oneRing),
    ...say('ONE WAY THE DRAW CAN TURN OUT', C.amber)
  );

  // 9: introduce the word outcome.

  await until(S(9));
  await play(
    new M.Indicate(tiles[0], { color: C.amber }),
    ...say('ONE POSSIBILITY = ONE OUTCOME', C.green)
  );

  // 10: tile three and tile eight are different outcomes.

  await until(S(10));
  await play(
    new M.FadeOut(oneRing),
    lag([
      new M.Indicate(tiles[2], { color: C.amber }),
      new M.Indicate(tiles[7], { color: C.amber })
    ], 3.2, 0.85),
    ...say('TILE 3 OR TILE 8', C.amber)
  );

  // 11: count all eight outcomes.

  const countDots = D.map((_, k) =>
    new M.Dot({
      point: [colx(k), ROW_Y - TW / 2 - 0.27, 0],
      radius: 0.065,
      color: C.green
    })
  );

  await until(S(11));
  await play(
    lag(
      countDots.map(d => new M.FadeIn(d)),
      1.7,
      0.16
    ),
    ...say('8 POSSIBLE OUTCOMES', C.green)
  );

  // 12: draw a frame around the entire row.
  // The frame is built from coordinates, not from on-screen objects.

  let frame = rowFrame();

  await until(S(12));
  await play(
    ...fade(countDots),
    new M.Create(frame),
    ...say('ALL THE POSSIBLE OUTCOMES')
  );

  // 13: name the sample space.

  await until(S(13));
  await play(
    new M.Indicate(frame, { color: C.cyan }),
    ...say('SAMPLE SPACE', C.green)
  );

  // 14: plain-language meaning.

  await until(S(14));
  await play(
    ...say('EVERYTHING THAT COULD HAPPEN', C.green)
  );

  // 15: write the complete list in curly brackets.

  await until(S(15));
  await play(
    ...fbox([
      ['sample space', C.green],
      ['{1,2,3,4,5,6,7,8}', C.ink]
    ], C.green),
    ...say('THE FULL LIST OF OUTCOMES')
  );

  // 16: curly brackets keep the list together.

  await until(S(16));
  await play(
    new M.Indicate(frame, { color: C.violet }),
    ...say('BRACKETS KEEP THE LIST TOGETHER', C.violet)
  );

  // 17: a new question about likelihood.

  await until(S(17));
  await play(
    ...clearBox(),
    new M.FadeOut(frame),
    ...say('HOW LIKELY IS EACH TILE?', C.amber)
  );

  // 18: all eight tiles feel the same in the hand.
  // The matching outlines make their equal sizes explicit.

  const sizeOutlines = D.map((_, k) =>
    outline(
      colx(k),
      ROW_Y,
      TW + 0.16,
      TW + 0.16,
      C.muted,
      1
    )
  );

  const sizeNote = txt(
    'Same size and feel',
    18,
    C.muted,
    [CX, ROW_Y - 0.9, 0]
  );

  await until(S(18));
  await play(
    lag(sizeOutlines.map(r => new M.Create(r)), 1.4),
    new M.FadeIn(sizeNote),
    ...say('WELL MIXED, SAME FEEL', C.muted)
  );

  // 19: no tile has an advantage.

  await until(S(19));
  await play(
    ...fade(sizeOutlines),
    new M.FadeOut(sizeNote),
    lag(
      tiles.map(t => new M.Indicate(t, { color: C.green })),
      2.2,
      0.08
    ),
    ...say('EQUALLY LIKELY', C.green)
  );

  // 20: the same chance for every tile.

  const equals = [
    ...D.slice(1).map((_, k) =>
      txt(
        '=',
        36,
        C.green,
        [(colx(k) + colx(k + 1)) / 2, ROW_Y + TW / 2 + 0.3, 0],
        true
      )
    ),
    txt(
      'same chance for every tile',
      P ? 18 : 18,
      C.green,
      [CX, ROW_Y - TW / 2 - 0.4, 0]
    )
  ];

  await until(S(20));
  await play(
    lag(equals.map(t => new M.FadeIn(t)), 1.3),
    ...say('EVERY TILE: THE SAME CHANCE', C.green)
  );

  // Chance bar helpers.
  // The total width represents one whole chance.

  const BAR_W = 8 * SP - 0.12;
  const SEG_W = BAR_W / 8;
  const BAR_H = P ? 0.48 : 0.43;

  const joinedX = k => CX + (k - 3.5) * SEG_W;

  function segment(k, joined = true, opacity = 0.82) {
    const c = colour(D[k]);

    const r = new M.Rectangle({
      width: joined ? SEG_W : SP - 0.16,
      height: BAR_H,
      color: c,
      strokeWidth: joined ? 1 : 2
    });

    r.setFill(c, opacity);
    r.moveTo([
      joined ? joinedX(k) : colx(k),
      BAR_Y,
      0
    ]);

    return r;
  }

  function wholeOutline() {
    return outline(
      CX,
      BAR_Y,
      BAR_W + 0.1,
      BAR_H + 0.13,
      C.ink,
      2
    );
  }

  function barText(s, color = C.muted) {
    return txt(s, 18, color, [CX, BAR_Y + 0.55, 0]);
  }

  function sliceLabels(color = C.ink) {
    return D.map((_, k) =>
      txt(
        '1/8',
        P ? 15 : 17,
        color,
        [colx(k), BAR_Y - 0.52, 0],
        true
      )
    );
  }

  // 21: one whole chance, shared between eight tiles.

  let slices = D.map((_, k) => segment(k));
  let whole = wholeOutline();
  let barLab = barText('1 whole chance', C.ink);

  await until(S(21));
  await play(
    ...fade(equals),
    lag(slices.map(s => new M.FadeIn(s)), 1.6),
    new M.Create(whole),
    new M.FadeIn(barLab),
    ...say('SHARE ONE WHOLE CHANCE', C.green)
  );

  // 22: separate the whole into eight equal slices.

  const equalSlicesNote = barText('8 equal slices', C.green);

  await until(S(22));
  await play(
    new M.FadeOut(whole),
    new M.FadeOut(barLab),
    new M.FadeIn(equalSlicesNote),
    ...slices.map((s, k) =>
      new M.Transform(s, segment(k, false))
    ),
    ...say('ONE SLICE FOR EACH TILE', C.amber)
  );

  barLab = equalSlicesNote;

  // 23: one above the line, eight below it.

  let eighths = sliceLabels(C.ink);

  await until(S(23));
  await play(
    lag(eighths.map(t => new M.FadeIn(t)), 1.7),
    new M.Indicate(slices[2], { color: C.amber }),
    ...fracBox(1, 8, 'one tile'),
    ...say('1 ABOVE, 8 BELOW', C.amber)
  );

  // 24: one in eight, or one eighth.

  await until(S(24));
  await play(
    ...fracBox(1, 8, 'one eighth'),
    ...say('ONE IN EIGHT = ONE EIGHTH', C.amber)
  );

  // 25: introduce the term fraction.

  await until(S(25));
  await play(
    ...fracBox(1, 8, 'fraction', C.violet),
    ...say('FRACTION = A SHARE OF A WHOLE', C.violet)
  );

  // 26: 100 percent shared equally between eight tiles.

  const percents = D.map((_, k) =>
    txt(
      '12.5%',
      P ? 15 : 15,
      C.amber,
      [colx(k), BAR_Y - 0.52, 0],
      true
    )
  );

  await until(S(26));
  await play(
    ...eighths.map((t, k) =>
      new M.Transform(t, percents[k])
    ),
    ...fbox([
      ['100% ÷ 8', C.ink],
      ['= 12.5% each', C.amber]
    ], C.amber),
    ...say('12.5% FOR EACH TILE', C.amber)
  );

  // 27: the share of the chance is called a probability.

  await until(S(27));
  await play(
    ...fbox([
      ['probability', C.green],
      ['1/8 = 12.5%', C.amber]
    ], C.green),
    ...say('THIS SHARE IS A PROBABILITY', C.green)
  );

  // 28: probability lives on a number line from zero to one.

  const AX_W = BAR_W - 0.35;
  const AX_L = CX - AX_W / 2;
  const AX_R = CX + AX_W / 2;
  const AX_Y = BAR_Y;
  const probX = v => AX_L + v * AX_W;

  const axis = line(
    [AX_L, AX_Y, 0],
    [AX_R, AX_Y, 0],
    C.muted,
    3
  );

  const axisTicks = Array.from({ length: 9 }, (_, k) =>
    line(
      [probX(k / 8), AX_Y - 0.08, 0],
      [probX(k / 8), AX_Y + 0.08, 0],
      C.muted,
      k === 0 || k === 8 ? 3 : 1
    )
  );

  const zeroLab = txt(
    '0',
    22,
    C.ink,
    [AX_L, AX_Y - 0.35, 0],
    true
  );

  const oneLab = txt(
    '1',
    22,
    C.ink,
    [AX_R, AX_Y - 0.35, 0],
    true
  );

  await until(S(28));
  await play(
    ...fade(slices),
    ...fade(eighths),
    new M.FadeOut(barLab),
    new M.Create(axis),
    ...axisTicks.map(t => new M.Create(t)),
    new M.FadeIn(zeroLab),
    new M.FadeIn(oneLab),
    ...fbox([
      ['probability', C.green],
      ['0 to 1', C.ink]
    ], C.green),
    ...say('PROBABILITY: FROM 0 TO 1', C.green)
  );

  // 29: zero means never; one means sure.

  const never = txt(
    'never',
    17,
    C.muted,
    [AX_L + 0.12, AX_Y - 0.76, 0]
  );

  const sure = txt(
    'sure',
    17,
    C.green,
    [AX_R - 0.12, AX_Y - 0.76, 0]
  );

  await until(S(29));
  await play(
    new M.FadeIn(never),
    new M.FadeIn(sure),
    new M.Indicate(zeroLab, { color: C.muted }),
    new M.Indicate(oneLab, { color: C.green }),
    ...say('0 = NEVER  /  1 = SURE', C.green)
  );

  // 30: one eighth is close to zero, but is not zero.

  const probP = [probX(1 / 8), AX_Y, 0];

  const probHalo = new M.Dot({
    point: probP,
    radius: 0.23,
    color: C.amber
  });

  probHalo.setFill(C.amber, 0.17);

  const probDot = new M.Dot({
    point: probP,
    radius: 0.105,
    color: C.amber
  });

  const probLab = txt(
    '1/8',
    21,
    C.amber,
    [probP[0], AX_Y + 0.46, 0],
    true
  );

  const probMark = new M.VGroup(probHalo, probDot, probLab);

  const smallShare = line(
    [AX_L, AX_Y, 0],
    probP,
    C.amber,
    5
  );

  await until(S(30));
  await play(
    new M.Create(smallShare),
    new M.FadeIn(probMark),
    new M.Flash(probDot, { color: C.amber }),
    ...fbox([
      ['1/8 = 0.125', C.amber],
      ['a small share of 1', C.muted]
    ], C.amber),
    ...say('ONE EIGHTH IS CLOSE TO ZERO', C.amber)
  );

  // 31: return to the eight slices and put them together.

  slices = D.map((_, k) => segment(k, false));
  eighths = sliceLabels();
  barLab = barText('8 equal slices', C.green);
  whole = wholeOutline();

  await until(S(31));
  await play(
    new M.FadeOut(axis),
    ...fade(axisTicks),
    new M.FadeOut(zeroLab),
    new M.FadeOut(oneLab),
    new M.FadeOut(never),
    new M.FadeOut(sure),
    new M.FadeOut(smallShare),
    new M.FadeOut(probMark),
    ...clearBox(),
    ...appear(slices),
    ...appear(eighths),
    new M.FadeIn(barLab),
    ...say('PUT THE SLICES TOGETHER', C.green)
  );

  await play(
    ...slices.map((s, k) =>
      new M.Transform(s, segment(k, true))
    ),
    new M.Create(whole)
  );

  // 32: add one eighth eight times.

  await until(S(32));
  await play(
    lag(
      slices.map(s => new M.Indicate(s, { color: C.amber })),
      3.2,
      0.28
    ),
    ...fbox([
      ['1/8 + 1/8 + ...', C.ink],
      ['8 equal shares', C.muted],
      ['= 8/8', C.amber]
    ], C.amber),
    ...say('8 LOTS OF ONE EIGHTH', C.amber)
  );

  // 33: eight eighths is one whole.
  // Something must come out.

  const wholeNote = barText('1 whole = 100%', C.green);

  await until(S(33));
  await play(
    new M.FadeOut(barLab),
    new M.FadeIn(wholeNote),
    ...fade(eighths),
    new M.Indicate(whole, { color: C.green }),
    ...fbox([
      ['8/8 = 1', C.green],
      ['all chances together', C.muted],
      ['= 100%', C.green]
    ], C.green),
    ...say('ALL CHANCES ADD UP TO 1', C.green)
  );

  barLab = wholeNote;

  // 34: the shortcut works for equally likely outcomes.

  await until(S(34));
  await play(
    ...clearBox(),
    lag(
      slices.map(s => new M.Indicate(s, { color: C.green })),
      2.6,
      0.12
    ),
    ...say('ONLY WHEN EQUALLY LIKELY', C.amber)
  );

  // 35: probability of one outcome = 1 divided by count.

  await until(S(35));
  await play(
    ...fbox([
      ['probability of', C.ink],
      ['one outcome =', C.ink],
      ['1 ÷ outcome count', C.amber]
    ], C.cyan),
    ...say('1 DIVIDED BY HOW MANY OUTCOMES')
  );

  // 36: in this example, 1 divided by 8.

  const exampleRing = tileRing(2, C.amber);

  await until(S(36));
  await play(
    new M.Create(exampleRing),
    new M.Indicate(slices[2], { color: C.amber }),
    ...fbox([
      ['1 ÷ 8', C.ink],
      ['= 1/8', C.amber],
      ['= 12.5%', C.amber]
    ], C.amber),
    ...say('ONE TILE: 1 ÷ 8', C.amber)
  );

  // 37: the sample space is the first step.

  frame = rowFrame();

  await until(S(37));
  await play(
    new M.FadeOut(exampleRing),
    new M.Create(frame),
    new M.FadeOut(whole),
    new M.FadeOut(barLab),
    ...fade(slices),
    ...fbox([
      ['step 1', C.green],
      ['list the outcomes', C.ink]
    ], C.green),
    ...say('START WITH THE SAMPLE SPACE', C.green)
  );

  // 38: list everything first, then ask how likely.

  await until(S(38));
  await play(
    lag(
      tiles.map(t => new M.Indicate(t, { color: C.green })),
      2.8,
      0.18
    ),
    ...fbox([
      ['step 1: list', C.green],
      ['step 2: find chances', C.ink]
    ], C.green),
    ...say('LEAVE NOTHING OUT', C.green)
  );

  // 39: common trap: using just colour as the outcome list.
  // The colour list is valid, but its two outcomes are unequal.

  const BLUE_CX = (colx(0) + colx(4)) / 2;
  const ORANGE_CX = (colx(5) + colx(7)) / 2;
  const CHOICE_Y = P ? -1.5 : -0.85;

  function choiceCard(s, x, color, w) {
    const r = new M.RoundedRectangle({
      width: w,
      height: 0.62,
      cornerRadius: 0.15,
      color,
      strokeWidth: 2
    });

    r.setFill(color, 0.14);
    r.moveTo([x, CHOICE_Y, 0]);

    const t = txt(
      s,
      P ? 18 : 20,
      color,
      [x, CHOICE_Y, 0],
      true
    );

    return new M.VGroup(r, t);
  }

  const blueChoice = choiceCard('BLUE', BLUE_CX, BLUE, 2.15);
  const orangeChoice = choiceCard('ORANGE', ORANGE_CX, ORANGE, 2.15);

  await until(S(39));
  await play(
    new M.FadeOut(frame),
    new M.FadeIn(blueChoice),
    new M.FadeIn(orangeChoice),
    ...fbox([
      ['another outcome list', C.muted],
      ['{blue, orange}', C.ink]
    ]),
    ...say('COMMON TRAP: JUST TWO COLOURS', C.amber)
  );

  // 40: two valid outcomes, but they are not equally likely.

  await until(S(40));
  await play(
    ...fbox([
      ['2 possible colours', C.ink],
      ['not equally likely', C.amber]
    ], C.amber),
    ...say('VALID LIST, UNEQUAL CHANCES', C.amber)
  );

  // 41: demonstrate the incorrect equal split.
  // Clearly label it as an incorrect assumption.

  const TRAP_Y = P ? -2.55 : -2.08;
  const TRAP_W = BAR_W;
  const TRAP_H = 0.48;

  function colourPart(x, w, color) {
    const r = new M.Rectangle({
      width: w,
      height: TRAP_H,
      color,
      strokeWidth: 2
    });

    r.setFill(color, 0.82);
    r.moveTo([x, TRAP_Y, 0]);
    return r;
  }

  const leftHalfX = CX - TRAP_W / 4;
  const rightHalfX = CX + TRAP_W / 4;

  const wrongBlue = colourPart(
    leftHalfX,
    TRAP_W / 2,
    BLUE
  );

  const wrongOrange = colourPart(
    rightHalfX,
    TRAP_W / 2,
    ORANGE
  );

  const wrongBlueLab = txt(
    '1/2',
    18,
    C.ink,
    [leftHalfX, TRAP_Y, 0],
    true
  );

  const wrongOrangeLab = txt(
    '1/2',
    18,
    C.ink,
    [rightHalfX, TRAP_Y, 0],
    true
  );

  let trapNote = txt(
    'Wrong assumption: equal chances',
    P ? 17 : 16,
    C.amber,
    [CX, TRAP_Y - 0.55, 0]
  );

  await until(S(41));
  await play(
    new M.FadeIn(wrongBlue),
    new M.FadeIn(wrongOrange),
    new M.FadeIn(wrongBlueLab),
    new M.FadeIn(wrongOrangeLab),
    new M.FadeIn(trapNote),
    ...fbox([
      ['incorrect:', C.amber],
      ['1 ÷ 2 = 1/2', C.ink],
      ['assumes equal chances', C.muted]
    ], C.amber),
    ...say('WRONG: GIVING EACH COLOUR HALF', C.amber)
  );

  // 42: reveal why the two colours have different chances.
  // Five equal tile-shares belong to blue, three to orange.

  const blueW = TRAP_W * 5 / 8;
  const orangeW = TRAP_W * 3 / 8;

  const trueBlueX = CX - TRAP_W / 2 + blueW / 2;
  const trueOrangeX = CX + TRAP_W / 2 - orangeW / 2;

  const blueRing = outline(
    BLUE_CX,
    ROW_Y,
    4 * SP + TW + 0.22,
    TW + 0.28,
    BLUE,
    3
  );

  const orangeRing = outline(
    ORANGE_CX,
    ROW_Y,
    2 * SP + TW + 0.22,
    TW + 0.28,
    ORANGE,
    3
  );

  const trueBlueLab = txt(
    '5/8',
    18,
    C.ink,
    [trueBlueX, TRAP_Y, 0],
    true
  );

  const trueOrangeLab = txt(
    '3/8',
    18,
    C.ink,
    [trueOrangeX, TRAP_Y, 0],
    true
  );

  const trueNote = txt(
    'Blue is more likely than orange',
    P ? 17 : 16,
    C.green,
    [CX, TRAP_Y - 0.55, 0]
  );

  await until(S(42));
  await play(
    new M.Create(blueRing),
    new M.Create(orangeRing),
    new M.Transform(
      wrongBlue,
      colourPart(trueBlueX, blueW, BLUE)
    ),
    new M.Transform(
      wrongOrange,
      colourPart(trueOrangeX, orangeW, ORANGE)
    ),
    new M.Transform(wrongBlueLab, trueBlueLab),
    new M.Transform(wrongOrangeLab, trueOrangeLab),
    new M.FadeOut(trapNote),
    new M.FadeIn(trueNote),
    ...fbox([
      ['blue:   5 tiles', BLUE],
      ['orange: 3 tiles', ORANGE],
      ['5 is more than 3', C.green]
    ], C.green),
    ...say('5 BLUE IS MORE THAN 3 ORANGE', C.green)
  );

  trapNote = trueNote;

  // 43: return to equally likely individual outcomes.
  // The colour groups disappear; each individual tile gets one share.

  frame = rowFrame(C.green);
  slices = D.map((_, k) => segment(k, false));
  eighths = sliceLabels(C.ink);
  barLab = barText('8 equal chances', C.green);

  await until(S(43));
  await play(
    new M.FadeOut(blueRing),
    new M.FadeOut(orangeRing),
    new M.FadeOut(blueChoice),
    new M.FadeOut(orangeChoice),
    new M.FadeOut(wrongBlue),
    new M.FadeOut(wrongOrange),
    new M.FadeOut(wrongBlueLab),
    new M.FadeOut(wrongOrangeLab),
    new M.FadeOut(trapNote),
    new M.Create(frame),
    lag(slices.map(s => new M.FadeIn(s)), 1.5),
    ...appear(eighths),
    new M.FadeIn(barLab),
    ...fbox([
      ['8 single tiles', C.green],
      ['1/8 for each tile', C.amber]
    ], C.green),
    ...say('COUNT TRULY EQUAL OUTCOMES', C.green)
  );

  // 44: preview grouping outcomes together.
  // Highlight the even numbers without teaching the next lesson.

  const evenIndices = [1, 3, 5, 7];

  const evenRings = evenIndices.map(k =>
    tileRing(k, C.violet)
  );

  await until(S(44));
  await play(
    new M.FadeOut(frame),
    lag(
      evenRings.map(r => new M.Create(r)),
      2.0,
      0.2
    ),
    ...fbox([
      ['next: group outcomes', C.violet],
      ['{2,4,6,8}', C.ink]
    ], C.violet),
    ...say('NEXT: GROUPING OUTCOMES', C.violet)
  );

  // 45: final takeaway.
  // The complete sample space and eight equal chances remain visible.

  frame = rowFrame(C.green);

  await until(S(45));
  await play(
    ...fade(evenRings),
    new M.Create(frame),
    ...fbox([
      ['sample space', C.green],
      ['{1,2,3,4,5,6,7,8}', C.ink],
      ['equal chances: 1/8', C.amber]
    ], C.green),
    ...say('ALL OUTCOMES, EQUAL SHARES', C.green)
  );

  await until(S(45) + 3.2);
  await play(
    new M.Indicate(frame, { color: C.green }),
    lag(
      slices.map(s => new M.Indicate(s, { color: C.amber })),
      2.2,
      0.12
    ),
    ...say('EQUALLY LIKELY = EQUAL CHANCES', C.green)
  );

  await until(E(45));
}
