// 17.3.8 Data augmentation. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const CX = P ? 0 : -2.6;
  // Phone: pill high, big tile on top, second photo / chart below, formula card at the bottom.
  const PILL = P ? [0, 3.95, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -6.2, 0] : [4.3, -0.3, 0];
  const TILE = P ? [0, 0.6, 0] : [CX, -0.32, 0];
  const PREVIEW = P ? [0, -3.9, 0] : [4.3, -0.32, 0];
  const SIDE = P ? 1.1 : 0.62;
  const SECOND = P ? 0.68 : SIDE;   // size of the second (mirrored) photo
  const ORANGE = '#fb923c';
  const BRIGHT = '#347d91';
  const DARK = '#192645';
  const original = [
    [4, 4, 4, 4],
    [4, 4, 1, 1],
    [4, 4, 1, 1],
    [4, 4, 4, 4],
  ];
  const mirrored = original.map(row => row.slice().reverse());

  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const fade = (m, runTime = 0.4) => new M.FadeIn(m, { runTime });
  const out = (m, runTime = 0.4) => new M.FadeOut(m, { runTime });
  const draw = (m, runTime = 0.48) => new M.Create(m, { runTime });
  const lag = (animations, runTime = 0.9) =>
    new M.LaggedStart(animations, { lagRatio: 0.15, runTime });
  const text = (value, point, size = 19, color = C.ink) =>
    T(String(value), size, color, true).moveTo(point);
  const line = (start, end, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start, end, color, strokeWidth });

  let boxNow = null;
  function fbox(lines = [], color = C.cyan) {
    const animations = boxNow ? [out(boxNow, 0.32)] : [];
    boxNow = null;
    if (!lines.length) return animations;

    const lh = P ? 0.43 : 0.4;
    const labels = lines.map((value, i) =>
      T(value, P ? 21 : 20, i === lines.length - 1 ? color : C.ink, true));
    const width = Math.max(...labels.map(t => t.getWidth())) + 0.54;
    const height = labels.length * lh + 0.32;
    const frame = new M.RoundedRectangle({
      width, height, cornerRadius: 0.16, color, strokeWidth: 2,
    });
    frame.setFill(C.card, 0.95);
    frame.moveTo(BOXP);
    labels.forEach((label, i) => label.moveTo([
      BOXP[0], BOXP[1] + ((labels.length - 1) / 2 - i) * lh, 0,
    ]));
    boxNow = new M.VGroup(frame, ...labels);
    const maxWidth = P ? FW - 1.2 : 4;
    if (width > maxWidth) boxNow.scale(maxWidth / width);
    return [...animations, fade(boxNow, 0.32)];
  }

  function cellPoint(center, size, row, col) {
    return [center[0] + (col - 1.5) * size, center[1] + (1.5 - row) * size, 0];
  }

  function pixel(value, point, size, numbered) {
    const bright = value === 4;
    const rim = bright ? C.cyan : C.violet;
    const shape = new M.Rectangle({
      width: size * 0.92, height: size * 0.92, color: rim, strokeWidth: size < 0.3 ? 1 : 2,
    });
    shape.setFill(bright ? BRIGHT : DARK, 1);
    shape.moveTo(point);
    return numbered ? new M.VGroup(shape, text(value, point, 20)) : shape;
  }

  function photo(grid, center, size, numbered = false) {
    return new M.VGroup(...grid.flatMap((row, r) =>
      row.map((value, c) => pixel(value, cellPoint(center, size, r, c), size, numbered))));
  }

  const tilePoint = (r, c) => cellPoint(TILE, SIDE, r, c);
  const rowNumbers = (grid, r) =>
    new M.VGroup(...grid[r].map((value, c) => text(value, tilePoint(r, c), 20)));

  function outline(r0, r1, c0, c1, color = C.amber) {
    const a = tilePoint(r0, c0), b = tilePoint(r1, c1);
    const frame = new M.Rectangle({
      width: (c1 - c0 + 1) * SIDE + 0.055,
      height: (r1 - r0 + 1) * SIDE + 0.055,
      color, strokeWidth: 3,
    });
    frame.setFill(color, 0);
    frame.moveTo([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0]);
    return frame;
  }

  const cells = original.map((row, r) =>
    row.map((value, c) => pixel(value, tilePoint(r, c), SIDE, false)));
  const numbers = [];
  const coordinates = new M.VGroup(
    ...original.map((_, i) => text(i + 1, [tilePoint(0, i)[0], TILE[1] + 2 * SIDE + 0.29, 0], 17, C.muted)),
    ...original.map((_, i) => text(i + 1, [CX - 2 * SIDE - 0.3, tilePoint(i, 0)[1], 0], 17, C.muted)),
  );
  const [cameraX, cameraY] = PREVIEW;
  const cameraBody = new M.RoundedRectangle({
    width: 1.9, height: 1.12, cornerRadius: 0.15, color: C.cyan, strokeWidth: 3,
  });
  cameraBody.setFill(C.card, 1);
  cameraBody.moveTo(PREVIEW);
  const lens = new M.Circle({ radius: 0.34, color: C.cyan, strokeWidth: 3 });
  lens.setFill(C.bg, 1);
  lens.moveTo(PREVIEW);
  const cameraLight = new M.Dot({ point: [cameraX + 0.68, cameraY + 0.32, 0], radius: 0.05, color: C.amber });
  const camera = new M.VGroup(cameraBody, lens, cameraLight);
  const samples = new M.VGroup(
    photo(original, [cameraX - (P ? 1.3 : 0.88), cameraY, 0], P ? 0.5 : 0.32),
    photo(original, [cameraX + (P ? 1.3 : 0.88), cameraY, 0], P ? 0.5 : 0.32),
  );
  const rightChip = outline(1, 2, 2, 3);
  const leftChip = outline(1, 2, 0, 1);
  const labelPoint = [CX, TILE[1] - 2 * SIDE - 0.38, 0];
  const chippedTag = text('CHIPPED', labelPoint, 20, C.amber);
  const chippedLabel = text('Label = chipped', labelPoint, 20, C.amber);

  await until(S(0)); await play(fade(camera), lag(cells.flat().map(m => fade(m))), ...say('CAMERA FOR CHIPPED TILES'));
  await until(S(1)); await play(out(camera), fade(samples), draw(rightChip), ...say('FEW PHOTOS · ALL RIGHT CHIPS'));
  await until(S(2)); await play(out(rightChip), draw(leftChip), ...say('HOW CAN IT SPOT LEFT CHIPS?', C.amber));
  await until(S(3)); await play(out(samples), out(leftChip), fade(coordinates), ...say('4 ROWS × 4 COLUMNS'));
  await until(S(4)); await play(...fbox(['4 = bright glaze', '1 = dark chip']), ...say('PIXEL BRIGHTNESS'));
  await until(S(5));
  numbers[0] = rowNumbers(original, 0);
  numbers[3] = rowNumbers(original, 3);
  await play(fade(numbers[0]), fade(numbers[3]), ...say('TOP AND BOTTOM · ALL 4s'));
  await until(S(6));
  numbers[1] = rowNumbers(original, 1);
  numbers[2] = rowNumbers(original, 2);
  await play(lag([fade(numbers[1]), fade(numbers[2])]), ...fbox(['Rows 2 and 3', '4  4  1  1']));
  await until(S(7)); await play(draw(rightChip), ...say('CHIP IN COLUMNS 3 AND 4', C.amber));
  await until(S(8)); await play(fade(chippedTag), ...fbox([]), ...say('MARK THE PHOTO CHIPPED', C.amber));
  await until(S(9)); await play(out(chippedTag), fade(chippedLabel), ...say('LABEL = THE ANSWER TAG'));

  const mirrorX = CX + 2 * SIDE + 0.26;
  const mirror = new M.DashedLine({
    start: [mirrorX, TILE[1] - 2 * SIDE, 0],
    end: [mirrorX, TILE[1] + 2 * SIDE, 0],
    color: C.violet,
  });
  const mirrorPhoto = photo(mirrored, PREVIEW, P ? SECOND : SIDE * 0.8, true);
  const mirrorLabel = text('Mirror · chipped', [PREVIEW[0], PREVIEW[1] - (P ? 2 * SECOND + 0.28 : 1.43), 0], 19, C.amber);
  await until(S(10)); await play(draw(mirror), ...say('MIRROR BY THE RIGHT EDGE', C.violet));
  await until(S(11)); await play(fade(mirrorPhoto), fade(mirrorLabel), ...say('LEFT CHIP · SAME LABEL', C.amber));
  await until(S(12)); await play(...say('DATA AUGMENTATION', C.green));
  await until(S(13)); await play(...say('MIRROR FLIP = TRANSFORMATION', C.violet));
  await until(S(14));
  await play(out(mirrorPhoto), out(mirrorLabel), out(mirror), out(rightChip),
    ...say('READ EACH ROW RIGHT TO LEFT'), ...fbox(['Column order', '1  ←  2  ←  3  ←  4']));

  async function flipRow(r) {
    const oldNumbers = numbers[r];
    const nextCells = mirrored[r].map((value, c) => pixel(value, tilePoint(r, c), SIDE, false));
    const nextNumbers = rowNumbers(mirrored, r);
    await play(out(oldNumbers, 0.24), lag(cells[r].slice().reverse().map((cell, j) =>
      new M.Transform(cell, nextCells[3 - j], { runTime: 0.28 })), 0.68));
    await play(fade(nextNumbers, 0.25));
    numbers[r] = nextNumbers;
  }

  await until(S(15)); await play(...say('FLIP ROW 2'), ...fbox(['Row 2', '4 4 1 1  →  1 1 4 4']));
  await flipRow(1);
  await until(S(16)); await play(...say('FLIP ROW 3'), ...fbox(['Row 3: 1 1 4 4', 'Rows 1 and 4: 4 4 4 4']));
  await flipRow(2);
  await until(S(17)); await play(draw(leftChip), ...fbox([]), ...say('COLUMNS 1 AND 2 · STILL CHIPPED', C.amber));
  await until(S(18)); await play(...say('THE MIRROR RULE', C.violet), ...fbox(['4 columns + 1 = 5', 'New column = 5 − old column']));
  await until(S(19)); await play(...fbox(['5 − 4 = 1', '5 − 3 = 2'], C.violet));

  const NCY = P ? 0.9 : -0.15;
  const radius = P ? 0.36 : 0.33;
  const N = net({ layers: [2, 2, 1], center: [CX, NCY, 0], width: P ? 6.2 : 5.25, height: P ? 3.2 : 1.74, r: radius });
  const networkText = [];
  const nodeValues = new Map();
  function value(layer, index, number, color = C.ink) {
    const animations = N.value(layer, index, number, color);
    nodeValues.set(`${layer}:${index}`, animations[0].mobject);
    return animations;
  }
  const names = new M.VGroup(...['Input', 'Hidden', 'Output'].map((name, layer) =>
    text(name, [N.pos(layer, 0)[0], P ? -1.45 : -1.93, 0], 19, C.muted)));
  const sides = new M.VGroup(
    text('Right chip', [CX, N.pos(1, 0)[1] + 0.44, 0], 16, C.muted),
    text('Left chip', [CX, N.pos(1, 1)[1] - 0.45, 0], 16, C.muted),
  );

  function weightPoint(index) {
    const a = N.pos(1, index), b = N.pos(2, 0);
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + (index === 0 ? 0.32 : -0.32), 0];
  }
  const weightLabels = [];
  function outputWeight(index, number, display = number) {
    const old = weightLabels[index];
    const label = text(display, weightPoint(index), 18, number === 0 ? C.muted : C.cyan);
    weightLabels[index] = label;
    return [...N.weight(1, index, 0, number / 100), fade(label, 0.28), ...(old ? [out(old, 0.28)] : [])];
  }

  const miniY = P ? -2.35 : -2.5;
  function thumbnail(grid, x, caption) {
    return new M.VGroup(
      photo(grid, [x, miniY, 0], 0.17),
      text(caption, [x, miniY - 0.48, 0], 16, C.muted),
    );
  }
  const rightMini = thumbnail(original, CX, 'Original');
  const leftMini = thumbnail(mirrored, CX, 'Mirror');

  await until(S(20)); await play(...fbox([]), ...say('TEACH WITH THE MIRRORED PHOTO', C.green));
  await until(S(21));
  await play(...cells.flat().map(m => out(m)), ...numbers.map(m => out(m)),
    out(coordinates), out(leftChip), out(chippedLabel), fade(N.group),
    ...say('NEURONS IN THREE LAYERS'));
  const inNames = new M.VGroup(
    text('left side', [N.pos(0, 0)[0], N.pos(0, 0)[1] + 0.5, 0], 16, C.violet),
    text('right side', [N.pos(0, 1)[0], N.pos(0, 1)[1] - 0.5, 0], 16, C.violet),
  );
  await until(S(22));
  networkText.push(names, inNames);
  await play(fade(names), fade(inNames), ...value(0, 0, 1), ...value(0, 1, 4), ...say('INPUT → HIDDEN → OUTPUT'));
  await play(...N.flow(0, C.cyan));
  await play(...N.flow(1, C.cyan));
  await until(S(23));
  await play(...N.weight(0, 0, 0, 1), ...N.weight(0, 1, 0, -1),
    ...N.weight(0, 0, 1, -1), ...N.weight(0, 1, 1, 1),
    ...say('THICKER LINES · BIGGER WEIGHTS'));
  await until(S(24)); await play(...fbox(['Cyan = positive', 'Pink = negative'], C.pink), ...say('WEIGHTS HAVE SIGNS'));
  await until(S(25));
  await play(...N.flow(0, C.cyan), ...say('MULTIPLY, THEN ADD'),
    ...fbox(['Left-chip sum', '1 × (−1) + 4 × 1 = 3', '3 ÷ 3 = 1']));
  await until(S(26));
  await play(...say('DARK BESIDE BRIGHT'), ...fbox(['Right: max(0, left − right) ÷ 3', 'Left: max(0, right − left) ÷ 3']));
  await until(S(27));
  networkText.push(sides);
  await play(fade(sides), fade(rightMini), ...value(0, 0, 4), ...value(0, 1, 1),
    ...value(1, 0, 1), ...value(1, 1, 0), ...fbox([]), ...say('TOP RESPONDS TO RIGHT CHIPS'));
  await until(S(28));
  await play(out(rightMini), fade(leftMini), ...value(0, 0, 1), ...value(0, 1, 4),
    ...value(1, 0, 0), ...value(1, 1, 1), ...say('MIRROR · TOP 0, BOTTOM 1'));
  await until(S(29)); await play(...say('OUTPUT = CHIP SCORE'), ...fbox(['0 = clean', '100 = chipped'], C.amber));
  await until(S(30)); await play(...say('LABEL SETS THE TARGET', C.amber), ...fbox(['Chipped', 'Target = 100'], C.amber));
  await until(S(31)); await play(...outputWeight(0, 100), ...say('EARLIER RIGHT CHIPS · WEIGHT 100'));
  await until(S(32)); await play(...outputWeight(1, 0), ...say('LEFT-CHIP WEIGHT STARTS AT 0'));
  await until(S(33)); await play(...say('TWO TRAINING STEPS', C.amber));

  const x0 = P ? -2.38 : 2.65, x1 = P ? 2.7 : 6.2;
  const y0 = P ? -4.85 : -2.56, y1 = P ? -3.55 : -1.56;
  const chart = new M.VGroup(
    line([x0, y1, 0], [x0, y0, 0]), line([x0, y0, 0], [x1, y0, 0]),
    text('Error', [(x0 + x1) / 2, y1 + 0.27, 0], 17, C.amber),
    text('100', [x0 - 0.35, y1, 0], 15, C.muted),
    text('0', [x0 - 0.25, y0, 0], 15, C.muted),
    text('1', [x0, y0 - 0.25, 0], 15, C.muted),
    text('10', [x1, y0 - 0.25, 0], 15, C.muted),
    text('Training step', [(x0 + x1) / 2, y0 - 0.25, 0], 15, C.muted),
  );
  const curve = [];
  let previousPoint = null;
  function plot(step, error) {
    const point = [x0 + (x1 - x0) * (step - 1) / 9, y0 + (y1 - y0) * error / 100, 0];
    const dot = new M.Dot({ point, radius: 0.057, color: C.amber });
    const segment = previousPoint ? line(previousPoint, point, C.amber, 3) : null;
    previousPoint = point;
    curve.push(dot);
    if (!segment) return [fade(dot, 0.24)];
    curve.push(segment);
    return [draw(segment, 0.3), fade(dot, 0.24)];
  }

  async function bottomSignal(backward) {
    const a = N.pos(1, 1), b = N.pos(2, 0);
    const left = [a[0] + radius, a[1], 0];
    const right = [b[0] - radius, b[1], 0];
    const [start, end] = backward ? [right, left] : [left, right];
    const color = backward ? ORANGE : C.cyan;
    const dot = new M.Dot({ point: start, radius: 0.09, color });
    const destination = new M.Dot({ point: end, radius: 0.09, color });
    await play(fade(dot, 0.12));
    await play(new M.Transform(dot, destination, { runTime: 0.65 }));
    await play(out(dot, 0.15));
  }

  let bottom = 0;
  await until(S(34));
  await play(...value(2, 0, 0, C.amber), ...say('STEP 1 · PREDICTION', C.amber),
    ...fbox(['Top + bottom', '0 × 100 + 1 × 0 = 0'], C.amber));
  await until(S(35)); await play(...say('STEP 1 · ERROR', C.amber), ...fbox(['Target − prediction', '100 − 0 = 100'], C.amber));
  await until(S(36)); await play(fade(chart), ...plot(1, 100), ...say('PLOT THE ERROR', C.amber));
  await until(S(37)); await play(...say('CORRECTION FLOWS BACK', ORANGE), ...fbox(['Take half of the error', '100 ÷ 2 = 50'], ORANGE));
  await bottomSignal(true);
  await until(S(38)); await play(...say('HALF A STEP TOWARD 100', ORANGE), ...fbox(['Prediction 0 → 50 → target 100', 'Half the gap stays within the gap'], ORANGE));
  await until(S(39));
  bottom += 50;
  await play(...outputWeight(1, bottom), ...say('ONLY THE BOTTOM WEIGHT CHANGES', ORANGE),
    ...fbox(['Top reads 0 · no change', 'Bottom reads 1 · 0 + 50 = 50'], ORANGE));
  await until(S(40));
  await play(...say('THE CYAN LINE THICKENS'), ...fbox(['Bottom contribution', '1 × 50 = 50']));
  await bottomSignal(false);
  await play(...value(2, 0, 50, C.amber));
  await until(S(41));
  await play(...plot(2, 50), ...say('STEP 2 · ERROR', C.amber), ...fbox(['Target − prediction', '100 − 50 = 50'], C.amber));
  await until(S(42));
  await play(...say('STEP 2 · HALF THE ERROR', ORANGE), ...fbox(['50 ÷ 2 = 25', '50 + 25 = 75'], ORANGE));
  await bottomSignal(true);
  bottom += 25;
  await play(...outputWeight(1, bottom));
  await until(S(43));
  await play(...say('STEP 2 · NEW PREDICTION', C.amber), ...fbox(['Bottom contribution', '1 × 75 = 75'], C.amber));
  await bottomSignal(false);
  await play(...value(2, 0, 75, C.amber));

  let pair = new M.VGroup(thumbnail(original, CX - 0.91, 'Original'), thumbnail(mirrored, CX + 0.91, 'Mirror'));
  await until(S(44));
  await play(out(leftMini), fade(pair), ...say('TRY BOTH PHOTOS', C.green),
    ...value(0, 0, 4), ...value(0, 1, 1), ...value(1, 0, 1), ...value(1, 1, 0), ...value(2, 0, 100, C.amber),
    ...fbox(['Original · already at target', '1 × 100 + 0 × 75 = 100'], C.green));
  await play(...value(0, 0, 1), ...value(0, 1, 4), ...value(1, 0, 0), ...value(1, 1, 1), ...value(2, 0, 75, C.amber),
    ...fbox(['Mirror · more steps', '0 × 100 + 1 × 75 = 75'], C.amber));
  await until(S(45));
  await play(...say('ERROR FALLS TOWARD ZERO', C.amber), ...fbox(['Keep taking half the gap', 'Left-chip weight → 100'], C.amber));
  for (let step = 3; step <= 10; step++) {
    const error = 100 - bottom;
    bottom += error / 2;
    const rounded = Number(bottom.toFixed(2));
    const weight = step % 2 === 0 ? outputWeight(1, bottom, rounded) : [];
    await play(...plot(step, error), ...weight);
  }
  await until(S(46));
  const scoredPair = new M.VGroup(
    thumbnail(original, CX - 0.91, 'Right · 100'),
    thumbnail(mirrored, CX + 0.91, 'Left · 100'),
  );
  await play(out(pair), fade(scoredPair), ...outputWeight(1, bottom, 100), ...value(2, 0, 100, C.amber),
    ...say('BOTH SIDES SCORE 100', C.green), ...fbox(['Scores rounded to whole numbers', 'Right 100 · left 100'], C.green));
  pair = scoredPair;

  const originalPhoto = photo(original, TILE, SIDE, true);
  const reflectedPhoto = photo(mirrored, PREVIEW, SECOND, true);
  await until(S(47));
  await play(out(N.group), ...networkText.map(m => out(m)), ...[...nodeValues.values()].map(m => out(m)),
    ...weightLabels.map(m => out(m)), out(pair), out(chart), ...curve.map(m => out(m)),
    ...fbox([]), fade(originalPhoto), fade(reflectedPhoto), ...say('MORE PHOTOS FROM THE ONES YOU HAVE', C.green));
  await until(S(48)); await play(out(reflectedPhoto), fade(chippedLabel), ...say('DOES THE LABEL STILL FIT?', C.amber));

  const cropFrame = outline(0, 3, 0, 1, C.green);
  const croppedPhoto = photo(original.map(row => row.slice(0, 2)), TILE, SIDE, true);
  const cropNote = text('4 rows × 2 columns', labelPoint, 20, C.green);
  const wrongLabel = text('“Chipped” no longer fits', labelPoint, 19, C.pink);
  await until(S(49)); await play(draw(cropFrame), ...say('CROP = REMOVE PART OF THE PHOTO'));
  await until(S(50));
  await play(out(originalPhoto), fade(croppedPhoto), out(chippedLabel), fade(cropNote),
    ...say('KEEP ORIGINAL COLUMNS 1 AND 2'));
  await until(S(51));
  await play(out(cropNote), fade(wrongLabel), ...say('THE CROP REMOVES THE CHIP', C.pink),
    ...fbox(['4 bright rows', '0 chip squares'], C.pink));
  await until(S(52));
  await play(out(croppedPhoto), out(cropFrame), out(wrongLabel), fade(mirrorPhoto),
    ...say('TRY IT · MIRROR, THEN STEP', C.green), ...fbox(['First two training errors', '100 → 50'], C.amber));
  await until(S(53));
  await play(out(mirrorPhoto), fade(croppedPhoto), fade(wrongLabel),
    ...say('CROP TO TWO COLUMNS · CHECK THE LABEL', C.amber), ...fbox([]));
  await until(S(54));
  const endTags = [text('Original · chipped', labelPoint, 19, C.amber),
    text('Mirror · chipped', [PREVIEW[0], PREVIEW[1] - 2 * SECOND - (P ? 0.28 : 0.38), 0], 19, C.amber)];
  await play(out(croppedPhoto), out(wrongLabel), fade(originalPhoto), fade(reflectedPhoto), ...endTags.map(m => fade(m)),
    ...say('MAKE NEW PHOTOS · KEEP LABELS TRUE', C.green));
}
