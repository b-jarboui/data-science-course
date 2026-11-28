// 13.3.1 Class weights: giving rare items a louder voice.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const BASE = P ? -4.2 : -2.35;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  let BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const boxTop = () => { if (P) BOXP = [0, 3.6, 0]; };
  const boxLow = () => { if (P) BOXP = [0, -5.3, 0]; };
  const BLUE = '#60a5fa', ORANGE = '#fb923c';
  const PLASTIC = 9, METAL = 3;
  const K = P ? 1.45 : 1.3, OFF = P ? 0.9 : 0.76, LOFF = P ? 0.57 : 0.51;
  const photoIds = 'ABCDEFGHIJKL'.split('');
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const at = (x, y) => [x, y, 0];

  function text(value, x, y, size = 19, color = C.ink, maxWidth = 6.8) {
    const label = T(String(value), P ? Math.max(size, 15) : size, color, true);
    if (label.getWidth() > maxWidth) label.scale(maxWidth / label.getWidth());
    label.moveTo(at(x, y));
    return label;
  }

  function rect(x, y, width, height, color, fill = 0, radius = 0.09) {
    const shape = new M.RoundedRectangle({ width, height, cornerRadius: radius, color, strokeWidth: 2 });
    shape.setFill(fill ? color : C.card, fill);
    shape.moveTo(at(x, y));
    return shape;
  }

  function line(x1, y1, x2, y2, color = C.muted, strokeWidth = 2) {
    return new M.Line({ start: at(x1, y1), end: at(x2, y2), color, strokeWidth });
  }

  function dot(x, y, radius, color) {
    const mark = new M.Dot({ point: at(x, y), radius, color });
    mark.setFill(color, 1);
    return mark;
  }

  const visible = new Map();
  const fadeIn = object => new M.FadeIn(object, { runTime: 0.48 });
  const fadeOut = object => new M.FadeOut(object, { runTime: 0.35 });
  function replace(key, object, stagger = false) {
    const old = visible.get(key) || [];
    const next = Array.isArray(object) ? object : object ? [object] : [];
    visible.delete(key);
    if (next.length) visible.set(key, next);
    const arrivals = next.map(fadeIn);
    return [
      ...old.map(fadeOut),
      ...(stagger && arrivals.length > 1
        ? [new M.LaggedStart(arrivals, { lagRatio: 0.13, runTime: 0.9 })]
        : arrivals),
    ];
  }
  const clear = (...keys) => keys.flatMap(key => replace(key, null));
  const clearData = () => clear(...Array.from(visible.keys()).filter(key => key !== 'formula'));

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 20 : 19, lh = P ? 0.30 : 0.40;
    const rows = lines.map(row => Array.isArray(row) ? row : [row, C.ink]);
    const texts = rows.map(([value, ink]) => T(value, size, ink, true));
    const maxWidth = P ? FW - 1.2 : 4.0;
    const available = maxWidth - 0.55;
    const natural = Math.max(...texts.map(label => label.getWidth()));
    const scale = Math.min(1, available / natural);
    const width = natural * scale + 0.55, height = lh * rows.length + 0.29;
    const frame = rect(BOXP[0], BOXP[1], width, height, color, 0, 0.14);
    frame.setFill(C.card, 0.96);
    texts.forEach((label, i) => {
      if (scale < 1) label.scale(scale);
      label.moveTo(at(BOXP[0] - width / 2 + 0.275 + label.getWidth() / 2,
        BOXP[1] + (rows.length - 1 - 2 * i) * lh / 2));
    });
    const box = new M.VGroup(frame, ...texts);
    const animations = boxNow ? [fadeOut(boxNow), fadeIn(box)] : [fadeIn(box)];
    boxNow = box;
    return animations;
  }

  function hideBox() {
    if (!boxNow) return [];
    const animation = fadeOut(boxNow);
    boxNow = null;
    return [animation];
  }

  const rowGap = P ? 1.55 : 1.45;
  const top = P ? 0.7 : 0.62;
  const metalY = -4.8;
  const groupX = metal => P ? CX : CX + (metal ? 2.4 : -2.4);
  const footerY = P ? -6.5 : -3.45;
  const centerY = P ? -1.05 : -0.56;

  function gridPosition(i) {
    if (P) return [CX + (i % 3 - 1) * 1.7, top - Math.floor(i / 3) * rowGap];
    return [CX + (i % 6 - 2.5) * 1.25, top - Math.floor(i / 6) * rowGap];
  }

  function sortedPosition(i) {
    const metal = i >= PLASTIC;
    const j = metal ? i - PLASTIC : i;
    if (P) return [CX + (j % 3 - 1) * 1.7, metal ? metalY : top - Math.floor(j / 3) * rowGap];
    return [groupX(metal) + (j % 3 - 1) * 1.25, top - Math.floor(j / 3) * rowGap];
  }

  function photo(id, x, y, metal, appearance) {
    const color = metal ? ORANGE : BLUE;
    const frame = rect(0, 0, 0.88, 0.58, color);
    frame.setFill(C.card, 0.94);
    const glow = new M.Circle({ radius: 0.22, color, strokeWidth: 0 });
    glow.setFill(color, 0.16);
    glow.moveTo(at(0.10, -0.02));
    const body = rect(0.10, -0.02, metal ? 0.30 : 0.21, metal ? 0.26 : 0.31, color, 0.73, 0.04);
    const cap = rect(0.10, metal ? 0.105 : 0.15, metal ? 0.26 : 0.11, 0.044, color, 0.95, 0.015);
    const detail = appearance === 'shiny'
      ? line(0.045, -0.085, 0.045, 0.075, C.ink, 2)
      : line(0.02, -0.04, 0.18, -0.04, appearance === 'mixed' ? C.ink : color, 2);
    const name = T(id, 12, C.ink, true); if (name.getWidth() > 0.29) name.scale(0.29 / name.getWidth()); name.moveTo(at(-0.26, 0));
    const card = new M.VGroup(frame, glow, body, cap, detail, name);
    card.scale(K);
    card.moveTo(at(x, y));
    return card;
  }

  function trainingPhoto(i, position = sortedPosition(i)) {
    const appearance = i === 7 || i === 9 || i === 10 ? 'shiny' : i === 8 || i === 11 ? 'mixed' : 'matte';
    return photo(photoIds[i], ...position, i >= PLASTIC, appearance);
  }

  function photoLabel(x, y, metal) {
    if (P) return text(metal ? 'Metal ✓' : 'Plastic ✓', x, y - LOFF, 16, metal ? ORANGE : BLUE, 1.66);
    return text(metal ? 'Metal ✓' : 'Plastic ✓', x, y - LOFF, 15, metal ? ORANGE : BLUE, 1.2);
  }

  function trainingLabels(position) {
    return photoIds.map((_, i) => photoLabel(...position(i), i >= PLASTIC));
  }

  function headings(plastic, metal) {
    return [
      text(plastic, groupX(false), top + (P ? 0.85 : 0.66), 17, BLUE, 3.4),
      text(metal, groupX(true), (P ? metalY : top) + (P ? 0.85 : 0.66), 17, ORANGE, 3.4),
    ];
  }

  function tokens(metal, count) {
    const items = metal ? METAL : PLASTIC;
    return Array.from({ length: items }, (_, j) => {
      const [x, y] = sortedPosition(j + (metal ? PLASTIC : 0));
      if (count > 3) return text(`×${count} tokens`, x, y - OFF, 13, C.amber, P ? 1.6 : 1.2);
      return new M.VGroup(...Array.from({ length: count }, (__, k) =>
        dot(x + (k - (count - 1) / 2) * 0.18 * K, y - OFF, 0.061 * K, C.amber)));
    });
  }

  function predictionMarks(graded) {
    return photoIds.map((_, i) => {
      const [x, y] = sortedPosition(i);
      const value = graded ? i < PLASTIC ? '✓' : '×' : 'guesses P';
      const color = graded ? i < PLASTIC ? C.green : C.pink : C.muted;
      return text(value, x, y - OFF, graded ? 17 : 13, color, P ? 1.6 : 1.2);
    });
  }

  // 0–10: facility, checked photos, and the two class sizes.
  const facility = new M.VGroup(
    rect(CX, centerY + 0.2, 4.5, 2.1, C.muted),
    text('RECYCLING FACILITY', CX, centerY + 0.83, 22),
    ...[-1.24, 0, 1.24].map(dx => {
      const x = CX + dx;
      return new M.VGroup(rect(x, centerY - 0.13, 0.62, 0.61, C.cyan, 0.18),
        line(x - 0.36, centerY + 0.20, x + 0.36, centerY + 0.20, C.cyan));
    }),
  );
  if (P) { facility.scale(1.62); facility.moveTo(at(CX, centerY - 0.6)); }
  await until(S(0)); await play(...replace('facility', facility));
  await until(S(1)); await play(...clear('facility'), ...replace('task', [
    trainingPhoto(0, [CX - (P ? 1.75 : 1.36), centerY + 0.25]),
    trainingPhoto(9, [CX + (P ? 1.75 : 1.36), centerY + 0.25]),
    text('● Plastic?', CX - (P ? 1.75 : 1.36), centerY - (P ? 0.75 : 0.36), 22, BLUE),
    text('■ Metal?', CX + (P ? 1.75 : 1.36), centerY - (P ? 0.75 : 0.36), 22, ORANGE),
  ]), ...say('CAN THE COMPUTER TELL THEM APART?'));
  const training = photoIds.map((_, i) => trainingPhoto(i, gridPosition(i)));
  await until(S(2)); await play(...clear('task'), ...replace('photos', training, true),
    ...replace('labels', trainingLabels(gridPosition), true), ...say('12 PHOTOGRAPHS CHECKED BY A WORKER'));
  await until(S(3)); await play(...say('LABELS = THE WRITTEN ANSWERS'));
  await until(S(4)); await play(
    new M.LaggedStart(training.map((card, i) => new M.Transform(card, trainingPhoto(i), { runTime: 0.6 })),
      { lagRatio: 0.08, runTime: 1.15 }),
    ...replace('labels', trainingLabels(sortedPosition)), ...say('SORT THE PHOTOGRAPHS'));
  await until(S(5)); await play(...replace('head', headings('9 Plastic', '')),
    ...say('9 PLASTIC PHOTOGRAPHS', BLUE));
  await until(S(6)); await play(...replace('head', headings('9 Plastic', '3 Metal')),
    ...say('3 METAL PHOTOGRAPHS', ORANGE));
  await until(S(7)); await play(...say('CLASS = A GROUP WITH THE SAME MATERIAL'));
  await until(S(8)); await play(...replace('footer', text('9 = 3 × 3', CX, footerY, 24, C.amber)),
    ...say('THREE TIMES AS MANY PLASTIC ITEMS', C.amber));
  await until(S(9)); await play(...say('CLASS IMBALANCE = UNEQUAL GROUP SIZES'));
  await until(S(10)); await play(...clear('footer'), ...say('WHAT COULD THE COMPUTER MISS?', C.amber));

  // 11–22: the all-plastic guess, then one token versus three per photo.
  await until(S(11)); await play(...replace('marks', predictionMarks(false), true), ...say('EVERY GUESS IS PLASTIC'));
  await until(S(12)); await play(...replace('marks', predictionMarks(true), true),
    ...replace('footer', text('9 right   ·   3 wrong', CX, footerY, 21)), ...say('CHECK EACH GUESS'));
  await until(S(13)); await play(...replace('footer', text('0 of 3 metal items found', CX, footerY, 21, C.pink)),
    ...say('EVERY METAL ITEM WAS MISSED', ORANGE));
  await until(S(14)); await play(...replace('head', headings('Plastic: 9 / 9', 'Metal: 0 / 3')),
    ...say('CHECK BOTH CLASSES', C.amber));
  await until(S(15)); await play(...clear('marks', 'footer'), ...replace('head', headings('9 Plastic', '3 Metal')),
    ...say('GIVE METAL MISTAKES MORE WEIGHT', ORANGE));
  await until(S(16)); await play(...replace('plasticTokens', tokens(false, 1), true), ...say('1 TOKEN PER PLASTIC PHOTO', BLUE));
  await until(S(17)); await play(...replace('metalTokens', tokens(true, 3), true), ...say('3 TOKENS PER METAL PHOTO', ORANGE));
  await until(S(18)); await play(...fbox([['Plastic: 9 × 1 = 9 tokens', BLUE]]), ...say('PLASTIC TOTAL'));
  await until(S(19)); await play(...fbox([['Plastic: 9 × 1 = 9 tokens', BLUE], ['Metal: 3 × 3 = 9 tokens', ORANGE]]),
    ...say('METAL TOTAL'));
  await until(S(20)); await play(...replace('footer', text('9 tokens each', CX, footerY, 22, C.amber)),
    ...say('EQUAL TOTAL WEIGHT', C.amber));
  await until(S(21)); await play(...fbox([['Plastic weight = 1', BLUE], ['Metal weight   = 3', ORANGE]]),
    ...say('TOKENS PER PHOTO = CLASS WEIGHT'));
  await until(S(22)); await play(...say('HOW DO WEIGHTS CHANGE LEARNING?'));

  // 23–29: one prediction, two correct answers, and one squared loss per photo.
  const axisY = P ? -1.8 : -0.86;
  const ax = p => CX + (p - 0.5) * 5.3;
  await until(S(23)); await play(...hideBox(), ...clear('footer', 'plasticTokens', 'metalTokens'),
    ...say('ONE PREDICTION FOR ALL 12 PHOTOS'));
  await until(S(24)); await play(...fbox([['50% chance of metal', C.amber]]), ...say('STARTING PREDICTION'));
  await until(S(25)); boxLow(); await play(...clearData(), ...replace('axis', [
    line(ax(0), axisY, ax(1), axisY),
    dot(ax(0), axisY, 0.10, BLUE), dot(ax(1), axisY, 0.10, ORANGE),
    text('Plastic = 0', ax(0), axisY - 0.44, 17, BLUE),
    text('Metal = 1', ax(1), axisY - 0.44, 17, ORANGE),
  ]), ...say('THE CORRECT ANSWERS ARE 0 AND 1'));
  await until(S(26)); await play(...replace('prediction', [
    dot(ax(0.5), axisY, 0.12, C.amber),
    text('0.5 prediction', ax(0.5), axisY - 0.44, 17, C.amber),
  ]), ...say('THE PREDICTION IS HALFWAY BETWEEN'));
  const distanceY = axisY + 0.54;
  await until(S(27)); await play(...replace('distances', [
    line(ax(0), distanceY, ax(0.5) - 0.08, distanceY, BLUE, 3),
    line(ax(0.5) + 0.08, distanceY, ax(1), distanceY, ORANGE, 3),
    text('0.5', ax(0.25), distanceY + 0.30, 20, BLUE),
    text('0.5', ax(0.75), distanceY + 0.30, 20, ORANGE),
  ]), ...fbox(['Distance = 0.5 for each photo']), ...say('HALF A UNIT TO EITHER ANSWER'));
  await until(S(28)); await play(...fbox([['0.5 × 0.5 = 0.25', C.amber]]), ...say('MULTIPLY THE DISTANCE BY ITSELF'));
  await until(S(29)); await play(...fbox([['Loss per photo = 0.25', C.amber]]), ...say('LOSS MEASURES HOW WRONG A GUESS IS'));

  // 30–38: one tile per quarter of loss. Leave space between photos' contributions.
  function contribution(metal, weight) {
    const color = metal ? ORANGE : BLUE;
    const n = metal ? METAL : PLASTIC;
    const row = metal ? (P ? -3.6 : -1.48) : (P ? -0.9 : 0.29);
    const left = CX - 3.12;
    const tiles = Array.from({ length: n }, (_, i) =>
      Array.from({ length: weight }, (__, j) =>
        rect(left + i * (weight * 0.43 + 0.079) + j * 0.43, row, 0.36, P ? 0.55 : 0.34, color, 0.8, 0.04)));
    return new M.VGroup(
      text(`${metal ? '■ Metal' : '● Plastic'} · ${n} photos`, CX - 1.9, row + 0.47, 17, color, 2.8),
      ...tiles.flat(), text((n * weight / 4).toFixed(2), CX + 2.7, row, 23, color, 1.5),
    );
  }

  await until(S(30)); await play(...clearData(), ...replace('lossPlastic', contribution(false, 1)),
    ...fbox(['Plastic: 9 × 0.25', ['       = 2.25', BLUE]]), ...say('ADD THE 9 PLASTIC LOSSES', BLUE));
  await until(S(31)); await play(...replace('lossMetal', contribution(true, 1)),
    ...fbox(['Metal: 3 × 0.25 = 0.75', ['Total: 2.25 + 0.75 = 3', C.amber]]), ...say('ADD THE 3 METAL LOSSES', ORANGE));
  await until(S(32)); await play(...fbox(['For each photo:', ['loss × class weight', C.amber]]),
    ...say('APPLY EACH PHOTO’S CLASS WEIGHT'));
  await until(S(33)); await play(...fbox([['Plastic: 0.25 × 1 = 0.25', BLUE], '9 photos contribute 2.25']),
    ...say('PLASTIC LOSS STAYS THE SAME', BLUE));
  await until(S(34)); await play(...replace('lossMetal', contribution(true, 3)),
    ...fbox([['Metal: 0.25 × 3 = 0.75', ORANGE], '3 photos contribute 2.25']),
    ...say('EACH METAL LOSS TRIPLES', ORANGE));
  await until(S(35)); await play(...fbox([['Plastic: 2.25', BLUE], ['Metal:   2.25', ORANGE]]),
    ...say('BOTH GROUPS CONTRIBUTE 2.25', C.amber));
  await until(S(36)); await play(...fbox(['Loss:   2.25 + 2.25 = 4.5', ['Tokens: 9 + 9 = 18', C.amber]]),
    ...say('ADD THE LOSSES AND ADD THE TOKENS'));
  await until(S(37)); await play(...fbox(['Weighted mean loss', ['= 4.5 ÷ 18 = 0.25', C.amber]]),
    ...say('DIVIDE THE TOTAL LOSS BY THE TOTAL WEIGHT'));
  await until(S(38)); await play(...fbox(['Weighted mean loss', 'sum of weighted losses', ['÷ sum of weights', C.amber]]),
    ...say('WEIGHTED MEAN LOSS FORMULA'));

  // 39–47: candidate losses and the loss of the prediction kept after each step.
  const graphLeft = CX - 2.74, graphRight = CX + 3.08;
  const graphBottom = P ? -3.7 : -2.03, graphTop = P ? 0.9 : 0.70;
  const gx = i => graphLeft + (graphRight - graphLeft) * i / 5;
  const gy = loss => graphBottom + (graphTop - graphBottom) * (loss - 0.20) / 0.33;
  const accepted = [[0, 0.5], [1, 0.3125], [2, 0.25]];
  function graph() {
    const levels = [0.25, 0.375, 0.50];
    return new M.VGroup(
      line(graphLeft, graphBottom, graphRight + 0.19, graphBottom),
      line(graphLeft, graphBottom, graphLeft, graphTop),
      ...levels.flatMap(value => [
        line(graphLeft, gy(value), graphRight, gy(value), C.grid, 1),
        text(value === 0.50 ? '0.50' : value, graphLeft - 0.48, gy(value), 14, C.muted, 0.88),
      ]),
      text('Weighted mean loss', CX, graphTop + 0.42, 18),
      text('Step', CX, graphBottom - 0.60, 16, C.muted),
    );
  }

  function mark(i, value, color, previous, dashed = false) {
    const x = gx(i), y = gy(value);
    const items = [dot(x, y, 0.09, color)];
    if (previous) {
      const start = at(gx(previous[0]), gy(previous[1]));
      items.unshift(dashed
        ? new M.DashedLine({ start, end: at(x, y), color, strokeWidth: 2 })
        : line(start[0], start[1], x, y, color, 3));
    }
    return new M.VGroup(...items);
  }

  const tick = i => text(i, gx(i), graphBottom - 0.25, 15, C.muted);
  await until(S(39)); await play(...clearData(), ...hideBox(), ...replace('graph', graph()),
    ...say('SEARCH FOR A LOWER LOSS'));
  await until(S(40)); await play(...replace('step0', [mark(...accepted[0], C.cyan), tick(0)]),
    ...fbox(['Start: 0% metal', ['Loss = 0.50', C.amber]]), ...say('START WITH ZERO PERCENT'));
  await until(S(41)); await play(...replace('trial1', mark(...accepted[1], C.amber, accepted[0], true)),
    ...replace('tick1', tick(1)), ...fbox(['Step 1: 0% → 25% metal', ['0.50 → 0.3125', C.amber]]),
    ...say('TRY A 25-POINT INCREASE'));
  await until(S(42)); await play(...clear('trial1'), ...replace('step1', mark(...accepted[1], C.cyan, accepted[0])),
    ...fbox([['Keep 25% metal', C.green], 'Loss = 0.3125']), ...say('KEEP THE LOWER LOSS', C.green));
  await until(S(43)); await play(...replace('step2', [mark(...accepted[2], C.cyan, accepted[1]), tick(2)]),
    ...fbox(['Step 2: 25% → 50% metal', ['0.3125 → 0.25', C.green], 'Keep 50% metal']),
    ...say('LOSS FALLS AGAIN', C.green));
  await until(S(44)); await play(...replace('trial3', mark(3, 0.3125, C.pink, accepted[2], true)),
    ...replace('tick3', tick(3)), ...fbox(['Step 3: try 75% metal', ['0.25 → 0.3125', C.pink]]),
    ...say('THIS TIME THE LOSS RISES', C.pink));
  await until(S(45)); await play(...replace('step3', mark(3, 0.25, C.cyan, accepted[2])),
    ...fbox([['Reject 75%', C.pink], ['Keep 50%, loss = 0.25', C.green]]), ...say('RETURN TO FIFTY PERCENT'));
  await until(S(46)); await play(...replace('checks', [
    mark(4, 0.265625, C.pink, [3, 0.25], true), mark(4, 0.25, C.cyan, [3, 0.25]), tick(4),
    mark(5, 0.265625, C.pink, [4, 0.25], true), mark(5, 0.25, C.cyan, [4, 0.25]), tick(5),
  ], true), ...fbox(['Tests: 62.5% and 37.5%', 'Each gives loss 0.265625', ['Keep 50%, loss = 0.25', C.green]]),
    ...say('TRY SMALLER CHANGES ON BOTH SIDES'));

  function bestBar(y, caption, prediction, color) {
    const left = CX - 2.75, width = 5.5;
    const th = P ? 0.6 : 0.23;
    const track = rect(CX, y, width, th, C.muted, 0, 0.06);
    const filled = width * prediction;
    return new M.VGroup(track, rect(left + filled / 2, y, filled, th, color, 0.84, 0.06),
      text(caption, CX, y + (P ? 0.66 : 0.40), 20, color));
  }

  await until(S(47)); await play(...clearData(), ...replace('comparison', [
    bestBar(P ? 0.3 : 0.10, 'Weights 1 and 3 → 50%', 0.50, C.cyan),
    bestBar(P ? -2.5 : -1.24, 'Weights 1 and 1 → 25%', 0.25, C.amber),
  ]), ...fbox(['Without weights: 25% metal', ['With weights:    50% metal', C.cyan]]),
    ...say('BEST SHARED CHANCE OF METAL'));

  // 48–52: same photos, too much weight, and a separate validation set.
  function originalPhotos() {
    return [
      ...replace('photos', photoIds.map((_, i) => trainingPhoto(i))),
      ...replace('labels', trainingLabels(sortedPosition)),
      ...replace('head', headings('9 Plastic', '3 Metal')),
    ];
  }

  await until(S(48)); boxTop(); await play(...clear('comparison'), ...originalPhotos(),
    ...replace('plasticTokens', tokens(false, 1)), ...replace('metalTokens', tokens(true, 3)),
    ...fbox([['Plastic: 9 photos, 9 tokens', BLUE], ['Metal: 3 photos, 9 tokens', ORANGE]]),
    ...say('CLASS WEIGHTS GIVE RARE ITEMS A VOICE'));
  await until(S(49)); await play(...replace('footer', text('Still 12 training photographs', CX, footerY, 19)),
    ...say('THE PHOTO COUNTS STAY AT 9 AND 3'));
  await until(S(50)); await play(...replace('metalTokens', tokens(true, 12)),
    ...replace('footer', text('An all-metal guess misses every plastic item', CX, footerY, 17, C.pink)),
    ...fbox(['Example: metal weight = 12', ['Best shared guess: 80% metal', C.pink]]),
    ...say('TOO MUCH WEIGHT CAN HURT PLASTIC'));
  const validationY = P ? -1.6 : -0.42;
  const validation = ['V1', 'V2', 'V3', 'V4'].map((id, i) => {
    const x = CX + (i - 1.5) * (P ? 1.75 : 1.31);
    return new M.VGroup(photo(id, x, validationY, i === 3, ['matte', 'matte', 'mixed', 'shiny'][i]),
      photoLabel(x, validationY, i === 3));
  });
  const panel = rect(CX, validationY - (P ? 0.3 : 0.13), P ? 7.4 : 6.6, P ? 3.3 : 2.5, C.violet);
  await until(S(51)); await play(...clearData(), ...replace('validation', [
    panel, text('VALIDATION PHOTOGRAPHS', CX, validationY + (P ? 1.0 : 0.74), 17, C.violet), ...validation,
    text('Check plastic and metal separately', CX, validationY - (P ? 1.55 : 0.98), 16),
  ]), ...fbox(['Training:   A–L', ['Validation: V1–V4', C.violet]]), ...say('CHECK ON PHOTOGRAPHS HELD BACK'));
  await until(S(52)); await play(...clear('validation'), ...originalPhotos(),
    ...replace('plasticTokens', tokens(false, 1)), ...replace('metalTokens', tokens(true, 3)),
    ...fbox(['Weight × loss per photo', ['Same 9 plastic and 3 metal', C.amber]]),
    ...say('CHANGE WHAT MISTAKES COUNT FOR'));
}
