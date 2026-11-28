// 17.3.9 Transfer learning. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const CLEAN = Array(16).fill(4);
  const CHIPPED = CLEAN.map((v, i) => [6, 7, 10, 11].includes(i) ? 1 : v);
  const PAINTED = CLEAN.map((v, i) => [1, 2, 5, 6].includes(i) ? 1 : v);
  const ORANGE = '#fb923c';
  const PILL = P ? [0, 2.25, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, 3.55, 0] : [4.62, -0.3, 0];
  const TX = P ? -1.3 : -4.75;
  const TY = P ? 0.05 : -0.12;
  const CELL = P ? 0.48 : 0.52;
  const NX = P ? -0.75 : -0.95;
  const NY = P ? -2.55 : -0.12;
  const NW = P ? 2.03 : 3.35;
  const DX = P ? 1.95 : 1.95;
  const R = 0.30;
  const RD = 0.44;
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const xy = (x, y) => [x, y, 0];
  const label = (text, x, y, size = 19, color = C.ink, mono = false) =>
    T(text, size, color, mono).moveTo(xy(x, y));
  const line = (x1, y1, x2, y2, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start: xy(x1, y1), end: xy(x2, y2), color, strokeWidth });
  const fade = object => new M.FadeIn(object, { runTime: 0.38 });

  const visible = new Map();
  function replace(slot, object) {
    const animations = [];
    const previous = visible.get(slot);
    if (previous) animations.push(new M.FadeOut(previous, { runTime: 0.38 }));
    if (object) {
      visible.set(slot, object);
      animations.push(fade(object));
    } else {
      visible.delete(slot);
    }
    return animations;
  }

  function rect(x, y, width, height, color, fill, opacity = 1) {
    const shape = new M.Rectangle({ width, height, color, strokeWidth: 2 });
    if (fill) shape.setFill(fill, opacity);
    return shape.moveTo(xy(x, y));
  }

  function circle(x, y, radius, color, fill) {
    const shape = new M.Circle({ radius, color, strokeWidth: 2 });
    if (fill) shape.setFill(fill, 1);
    return shape.moveTo(xy(x, y));
  }

  function fbox(rows, color = C.cyan) {
    const size = P ? 22 : 21;
    const lh = P ? 0.37 : 0.42;
    const texts = rows.map(row => {
      const [text, ink] = Array.isArray(row) ? row : [row, C.ink];
      return T(text, size, ink, true);
    });
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.56;
    const height = rows.length * lh + 0.28;
    const frame = new M.RoundedRectangle({
      width, height, cornerRadius: 0.18, color, strokeWidth: 2,
    });
    frame.setFill(C.card, 0.95);
    frame.moveTo(BOXP);
    texts.forEach((t, i) => t.moveTo(xy(
      BOXP[0] - width / 2 + 0.28 + t.getWidth() / 2,
      BOXP[1] + (rows.length - 1) * lh / 2 - i * lh,
    )));
    const box = new M.VGroup(frame, ...texts);
    const maxWidth = P ? FW - 1.2 : 3.62;
    if (width > maxWidth) box.scale(maxWidth / width).moveTo(BOXP);
    return replace('formula', box);
  }

  function tile(values, x, title, digits = false, y = TY) {
    const squares = values.map((v, i) => {
      const px = x + (i % 4 - 1.5) * CELL;
      const py = y + (1.5 - Math.floor(i / 4)) * CELL;
      return rect(px, py, CELL - 0.035, CELL - 0.035, C.grid, v === 4 ? '#6dc3ca' : '#263050');
    });
    const numbers = digits ? values.map((v, i) => label(
      String(v), x + (i % 4 - 1.5) * CELL, y + (1.5 - Math.floor(i / 4)) * CELL,
      19, v === 4 ? C.bg : C.ink, true,
    )) : [];
    return new M.VGroup(
      ...squares, ...numbers,
      label(title, x, y + 2 * CELL + 0.26, 18),
    );
  }

  function windowOutline(x, row, col, rows, cols, color = C.amber) {
    return rect(
      x + (col - 1.5 + (cols - 1) / 2) * CELL,
      TY + (1.5 - row - (rows - 1) / 2) * CELL,
      cols * CELL + 0.045, rows * CELL + 0.045, color,
    );
  }

  function vehicle(x, van) {
    const color = van ? C.violet : C.cyan;
    const width = van ? 2.5 : 1.8;
    const wheel = dx => circle(x + dx, -0.46, 0.21, C.ink, C.bg);
    const roof = van
      ? rect(x + 0.16, 0.28, 1.8, 0.76, color, C.card)
      : rect(x - 0.08, 0.26, 0.99, 0.48, color, C.card);
    return new M.VGroup(
      roof, rect(x, -0.10, width, 0.57, color, color, 0.38),
      wheel(-width * 0.31), wheel(width * 0.31),
      label(van ? 'Van' : 'Small car', x, -0.88, 20),
    );
  }

  const secondTileX = P ? 1.3 : -1.75;
  const workshop = new M.VGroup(
    tile(CLEAN, 0, 'Clay tile', false, -0.18),
    circle(1.14, 0.25, 0.38, C.amber),
    line(1.42, -0.02, 1.82, -0.43, C.amber, 4),
  );

  await until(S(0));
  await play(...replace('intro', workshop), ...say('CHECK THE GLAZE'));
  await until(S(1));
  await play(...replace('intro'), ...replace('tile', tile(CLEAN, TX, 'Clean')),
    ...replace('otherTile', tile(CHIPPED, secondTileX, 'Chipped')), ...say('TWO EXAMPLE TILES'));
  await until(S(2));
  await play(...fbox(['Earlier images', ['↓', C.amber], 'A tool we can reuse']), ...say('CAN WE BORROW A TOOL?'));
  await until(S(3));
  await play(...replace('formula'), ...replace('outline', windowOutline(TX, 0, 0, 4, 4)),
    ...say('4 ROWS × 4 COLUMNS'));
  await until(S(4));
  await play(...replace('outline'), ...fbox([['Shiny glaze = 4', C.cyan], ['Dark chip = 1', C.pink]]),
    ...say('BRIGHTNESS'));
  await until(S(5));
  await play(...replace('tile', tile(CLEAN, TX, 'Clean', true)), ...say('CLEAN: 4 IN EVERY SQUARE'));
  await until(S(6));
  await play(...replace('outline', windowOutline(secondTileX, 1, 2, 2, 2, C.pink)),
    ...say('CHIP: RIGHT SIDE, ROWS 2 AND 3', C.pink));
  await until(S(7));
  await play(...replace('outline'), ...replace('otherTile', tile(CHIPPED, secondTileX, 'Chipped', true)),
    ...say('4 DARK SQUARES SHOW 1', C.pink));

  await until(S(8));
  await play(...replace('formula'), ...replace('tile'), ...replace('otherTile'),
    ...replace('car', vehicle(P ? -1.65 : -2.2, false)), ...say('ALREADY KNOWS HOW TO DRIVE'));
  await until(S(9));
  await play(...replace('van', vehicle(P ? 1.65 : 0.9, true)),
    ...fbox([['Reuse steering', C.cyan], ['Learn the van’s size', C.violet]]),
    ...say('SAME STEERING, NEW SIZE'));
  await until(S(10));
  await play(...say('TRANSFER LEARNING', C.green),
    ...fbox(['Reuse earlier learning', 'for a new job'], C.green));

  // The encoder and the new classifier are separate so only the classifier
  // receives the backward error signal.
  const N = net({ layers: [2, 2, 1], center: xy(NX, NY), width: NW, height: 0.96, r: R });
  const D = net({ layers: [1], center: xy(DX, NY), width: 0, height: 0, r: RD });
  const scoreNodeX = N.pos(2, 0)[0];
  const join = line(scoreNodeX + R, NY, DX - RD, NY, C.cyan, 3);
  const encTitle = (text, color = C.cyan) => label(text, NX, NY + 1.13, 18, color);
  const classifierTitle = label('Classifier', DX, NY + 0.8, 17, C.amber);
  const decisionArrow = new M.Arrow({
    start: xy(DX, NY - RD - 0.7), end: xy(DX, NY - RD - 0.1), color: ORANGE, strokeWidth: 4,
  });
  const lockFrame = rect(NX, NY, NW + 0.79, 1.67, C.violet);
  const hidden = (a, b) => [...N.value(1, 0, a), ...N.value(1, 1, b)];
  const inputs = (a, b) => [...N.value(0, 0, a), ...N.value(0, 1, b)];

  await until(S(11));
  await play(...replace('car'), ...replace('van'), ...replace('formula'),
    ...replace('tile', tile(CHIPPED, TX, 'Chipped', true)), fade(N.group), ...say('A NEURAL NETWORK'));
  await until(S(12));
  await play(...inputs(4, 1), ...N.flow(0), ...say('NUMBERS FLOW LEFT TO RIGHT'));
  await until(S(13));
  await play(...N.weight(0, 0, 0, 1), ...N.weight(0, 1, 0, -1),
    ...N.weight(0, 0, 1, -1), ...N.weight(0, 1, 1, 1),
    ...fbox([['Blue adds', C.cyan], ['Pink subtracts', C.pink], 'Thicker pulls harder']),
    ...say('LINES CARRY WEIGHTS'));
  await until(S(14));
  await play(...replace('outline', windowOutline(TX, 1, 1, 1, 2)),
    ...hidden(3, '−3'), ...N.flow(0), ...fbox(['Neighboring squares', ['4 − 1 = 3', C.amber]]),
    ...say('MEASURE BRIGHTNESS JUMPS'));
  await until(S(15));
  await play(...N.flow(1), ...N.value(2, 0, 3, C.amber),
    ...fbox(['Check each row', ['Keep the biggest jump', C.amber]]), ...say('LEARNED ON EARLIER POTTERY IMAGES'));
  await until(S(16));
  await play(...fbox(['Drop: 4 − 1 = 3', 'Rise: 1 − 4 = −3', ['Both have size 3', C.amber]]),
    ...say('KEEP THE SIZE OF THE JUMP'));
  await until(S(17));
  await play(...replace('encoderTitle', encTitle('Image encoder')), ...replace('outline'),
    ...fbox([['This encoder: 1 score', C.amber], 'Real encoders: many']), ...say('IMAGE ENCODER'));
  await until(S(18));
  await play(fade(lockFrame), ...replace('encoderTitle', encTitle('Locked encoder', C.violet)),
    ...fbox(['Learned earlier', ['Weights stay fixed', C.violet]]), ...say('PRETRAINED AND LOCKED', C.violet));
  await until(S(19));
  await play(...replace('tile', tile(CLEAN, TX, 'Clean', true)), ...replace('formula'),
    ...inputs(4, 4), ...hidden('…', '…'), ...N.value(2, 0, '…'), ...N.flow(0), ...say('SEND IN THE CLEAN TILE'));
  await until(S(20));
  await play(...replace('outline', windowOutline(TX, 1, 1, 1, 2)),
    ...hidden(0, 0), ...N.flow(1), ...N.value(2, 0, 0, C.amber),
    ...fbox(['Every square is 4', ['4 − 4 = 0', C.amber]]), ...say('CLEAN SCORE: 0'));
  await until(S(21));
  await play(...replace('outline'), ...replace('formula'), ...replace('tile', tile(CHIPPED, TX, 'Chipped', true)),
    ...inputs(4, 1), ...hidden('…', '…'), ...N.value(2, 0, '…'), ...N.flow(0), ...say('SEND IN THE CHIPPED TILE'));
  await until(S(22));
  await play(...replace('outline', windowOutline(TX, 1, 1, 1, 2)),
    ...hidden(3, '−3'), ...N.flow(1), ...N.value(2, 0, 3, C.amber),
    ...fbox(['Row 2, columns 2 and 3', ['4 − 1 = 3', C.amber]]), ...say('CHIPPED SCORE: 3'));

  const AXIS_Y = P ? -4.75 : -2.15;
  const ax = value => (P ? -2.9 : -5.75) + value * (P ? 1.45 : 1.69);
  const scoreLine = () => new M.VGroup(
    line(ax(0) - 0.22, AXIS_Y, ax(4) + 0.22, AXIS_Y),
    ...[0, 1, 2, 3, 4].flatMap(v => [
      line(ax(v), AXIS_Y - 0.08, ax(v), AXIS_Y + 0.08),
      label(String(v), ax(v), AXIS_Y - 0.25, P ? 18 : 16, C.ink, true),
    ]),
    ...[[0, 'Clean tile', C.cyan], [3, 'Chipped tile', C.pink]].flatMap(([v, text, color]) => [
      new M.Dot({ point: xy(ax(v), AXIS_Y), radius: 0.105, color }),
      label(text, ax(v), AXIS_Y - 0.57, 17, color),
    ]),
  );
  const marker = (v, text = String(v)) => new M.VGroup(
    line(ax(v), AXIS_Y + 0.12, ax(v), AXIS_Y + 0.45, C.amber, 3),
    label(`Cutoff ${text}`, ax(v), AXIS_Y + 0.64, 17, C.amber, true),
  );

  await until(S(23));
  await play(...replace('outline'), ...replace('formula'), ...replace('scores', scoreLine()),
    ...say('CLEAN AT 0, CHIPPED AT 3'));
  await until(S(24));
  await play(new M.Create(join, { runTime: 0.45 }), fade(D.group), fade(classifierTitle),
    ...say('ADD ONE DECISION CIRCLE', C.amber));
  await until(S(25));
  await play(...D.value(0, 0, '?', C.amber), ...fbox(['One cutoff', 'Chooses clean or chipped']),
    ...say('CLASSIFIER', C.amber));
  await until(S(26));
  await play(...fbox([['Above → chipped', C.pink], ['At or below → clean', C.cyan]]),
    ...say('COMPARE THE SCORE WITH THE CUTOFF', C.amber));
  await until(S(27));
  await play(...replace('marker', marker(3.5)), ...D.value(0, 0, '3.5', C.amber),
    ...fbox(['Step 0', ['Start at 3.5', C.amber]]), ...say('TRAIN THE CLASSIFIER', C.amber));
  await until(S(28));
  await play(...fbox(['3 ≤ 3.5 → clean', ['Actual: chipped', C.pink], ['Wrong prediction', ORANGE]], ORANGE),
    ...say('THE CHIPPED TILE IS MISSED', ORANGE));
  await until(S(29));
  await play(new M.Create(decisionArrow, { runTime: 0.65 }),
    ...fbox([['Error → classifier', ORANGE], ['Encoder stays locked', C.violet]], ORANGE),
    ...say('SEND THE ERROR BACK TO THE CLASSIFIER', ORANGE));
  await until(S(30));
  await play(new M.FadeOut(decisionArrow, { runTime: 0.38 }),
    ...replace('marker', marker(2.5)), ...D.value(0, 0, '2.5', C.amber),
    ...fbox(['Step 1', ['3.5 − 1 = 2.5', C.amber], 'Gap to middle: 1']),
    ...say('LOWER THE CUTOFF BY 1', C.amber));
  await until(S(31));
  await play(...fbox([['0 → clean ✓', C.cyan], ['3 → chipped ✓', C.pink], '2.5 is closer to 3']),
    ...say('BOTH RIGHT. CUTOFF STILL NEAR 3.', C.green));
  await until(S(32));
  await play(...replace('marker', marker(2)), ...D.value(0, 0, 2, C.amber),
    ...fbox(['Step 2', ['2.5 − 0.5 = 2', C.amber], 'Gap to middle: 0.5']),
    ...say('LOWER THE CUTOFF BY HALF', C.amber));

  const plotLeft = P ? -2.61 : -5.12;
  const plotRight = P ? 2.79 : 0.94;
  const plotTop = P ? -4.3 : -1.46;
  const plotBottom = P ? -6.3 : -2.53;
  const px = i => plotLeft + (plotRight - plotLeft) * i / 8;
  const py = loss => plotBottom + (plotTop - plotBottom) * loss / 2;
  const axes = new M.VGroup(
    line(plotLeft, plotTop, plotLeft, plotBottom),
    line(plotLeft, plotBottom, plotRight + 0.15, plotBottom),
    label('Error: gap to the middle', (plotLeft + plotRight) / 2, plotTop + 0.19, 17, C.muted),
    label('Step', plotRight + 0.57, plotBottom - 0.22, P ? 17 : 15, C.muted),
    ...[0, 1, 2].map(v => label(String(v), plotLeft - 0.25, py(v), P ? 17 : 15, C.muted, true)),
    ...[0, 2, 4, 6, 8].map(i => label(String(i), px(i), plotBottom - 0.25, P ? 17 : 15, C.muted, true)),
  );
  const loss = i => 2 / 2 ** i;
  const dots = Array.from({ length: 9 }, (_, i) => new M.Dot({
    point: xy(px(i), py(loss(i))), radius: 0.052, color: C.amber,
  }));
  const segments = Array.from({ length: 8 }, (_, i) =>
    line(px(i), py(loss(i)), px(i + 1), py(loss(i + 1)), C.amber, 3));
  const initialTrace = new M.VGroup(...segments.slice(0, 2), ...dots.slice(0, 3));

  await until(S(33));
  await play(...replace('scores'), ...replace('marker'), fade(axes), fade(initialTrace),
    ...fbox(['Step 3', ['2 − 0.25 = 1.75', C.amber], 'Gap to middle: 0.25']),
    ...D.value(0, 0, '1.75', C.amber), ...say('THE ERROR FALLS AT EACH STEP', C.amber));
  await play(new M.Create(segments[2], { runTime: 0.45 }), fade(dots[3]));
  await play(new M.LaggedStart(segments.slice(3).flatMap((segment, i) => [
    new M.Create(segment, { runTime: 0.34 }), fade(dots[i + 4]),
  ]), { lagRatio: 0.55, runTime: 1.30 }));
  await play(...D.value(0, 0, '≈1.5', C.amber),
    ...fbox(['After step 8', ['Cutoff approaches 1.5', C.amber], 'Gap is under 0.01']));

  await until(S(34));
  await play(new M.FadeOut(new M.VGroup(axes, initialTrace, ...segments.slice(2), ...dots.slice(3)),
    { runTime: 0.38 }), ...replace('scores', scoreLine()), ...replace('marker', marker(1.5, '≈1.5')),
    ...fbox([['0 → clean ✓', C.cyan], ['3 → chipped ✓', C.pink]]), ...say('BOTH EXAMPLES PICKED CORRECTLY', C.green));
  await until(S(35));
  await play(...fbox(['Two training scores', ['(0 + 3) ÷ 2', C.amber]]), ...say('TAKE THE MIDDLE', C.amber));
  await until(S(36));
  await play(...fbox(['Add both scores', ['0 + 3 = 3', C.amber]]), ...say('ADD: 0 PLUS 3', C.amber));
  await until(S(37));
  await play(...replace('marker', marker(1.5)), ...D.value(0, 0, '1.5', C.amber),
    ...fbox(['Take half', ['3 ÷ 2 = 1.5', C.amber]]), ...say('EXACT MIDDLE: 1.5', C.amber));
  await until(S(38));
  await play(...fbox(['Two example images', 'One reused encoder']), ...say('USEFUL WITH FEW EXAMPLE IMAGES'));
  await until(S(39));
  await play(new M.Indicate(D.nodes[0][0], { color: C.amber, scaleFactor: 1.12 }),
    ...fbox([['Locked encoder', C.violet], ['Train the classifier', C.amber]]), ...say('TRAIN ONLY THE SMALL CLASSIFIER'));
  await until(S(40));
  await play(...fbox(['Training scores: 0, 3', ['Built the 1.5 cutoff', C.amber]]),
    ...say('THESE TWO TILES BUILT THE CUTOFF', C.amber));
  await until(S(41));
  await play(...replace('scores'), ...replace('marker'), ...replace('formula'),
    ...replace('tile', tile(CLEAN, TX, 'Fresh tile', true)),
    ...say('TRY AN IMAGE THE CLASSIFIER HAS NOT SEEN'));
  await until(S(42));
  await play(...replace('tile', tile(PAINTED, TX, 'Painted clean tile', true)),
    ...replace('outline', windowOutline(TX, 0, 0, 1, 2, C.pink)),
    ...inputs(4, 1), ...hidden(3, '−3'), ...N.flow(0, ORANGE),
    ...fbox(['Paint: 4 − 1 = 3', ['3 > 1.5 → chipped', C.pink], ['Actual: clean', C.cyan]], ORANGE),
    ...say('DARK PAINT FOOLS THE CLASSIFIER', ORANGE));

  function testTable() {
    const y = P ? -4.3 : -1.47;
    const pitch = P ? 0.58 : 0.42;
    const xs = P ? [-2.07, 0.08, 2.16] : [-4.55, -2.25, 0.12];
    const rows = [
      ['Fresh tile', 'Actual', 'Predicted'],
      ['Plain glaze', 'Clean', 'Clean'],
      ['Chip on left', 'Chipped', 'Chipped'],
      ['Dark paint', 'Clean', 'Chipped'],
    ];
    return new M.VGroup(
      line(xs[0] - 0.79, y - 0.23, xs[2] + 0.79, y - 0.23, C.grid),
      ...rows.flatMap((row, i) => row.map((text, j) =>
        label(text, xs[j], y - i * pitch, P ? (i === 0 ? 17 : 19) : (i === 0 ? 16 : 17),
          i === 0 ? C.muted : i === 3 && j === 2 ? ORANGE : C.ink))),
    );
  }

  await until(S(43));
  await play(...replace('outline'), ...replace('test', testTable()),
    ...fbox(['Fresh tiles', 'Compare with the', 'actual label']), ...say('ALWAYS TEST ON FRESH TILES'));
  await until(S(44));
  await play(...replace('test'), ...fbox([['Lock the pretrained encoder', C.violet],
    ['Train a new classifier', C.amber]]), ...say('TRANSFER LEARNING', C.green));
  await until(S(45));
  await play(fade(axes), fade(initialTrace), ...fbox([['Press Step', C.amber], 'Watch the cutoff move',
    'and the error fall']), ...say('TRY IT: TRAIN ONE STEP AT A TIME'));
  await until(S(46));
  await play(new M.FadeOut(new M.VGroup(axes, initialTrace), { runTime: 0.38 }),
    ...replace('test', testTable()), ...fbox(['Try a fresh tile', ['Then try dark paint', ORANGE]]),
    ...say('TRY IT: TEST ON FRESH TILES'));
}
