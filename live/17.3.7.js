// 17.3.7 Residual connections. Beat i = sentence i, starting at zero.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const MAIN = [CX, P ? -1.2 : -0.65, 0];
  const SIDE = P ? [0, -5.5, 0] : BOXP;
  const NH = P ? 4.0 : 2.25;
  const INPUT = [0, 0, 0, 3];
  const CORRECTION = [0, 0, 1, 0];
  const OUTPUT = INPUT.map((value, i) => value + CORRECTION[i]);
  const ZERO = [0, 0, 0, 0];
  const BRIGHTNESS = [4, 4, 4, 4, 4, 4, 1, 1, 4, 4, 1, 1, 4, 4, 4, 4];
  const at = (x, y) => [x, y, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const label = (text, point, color = C.ink, size = 19) =>
    T(String(text), size, color, true, true).moveTo(point);
  const enter = object => new M.FadeIn(object, { runTime: 0.38 });
  const leave = object => new M.FadeOut(object, { runTime: 0.29 });
  const line = (start, end, color, strokeWidth = 2) =>
    new M.Line({ start, end, color, strokeWidth });
  const arrow = (start, end, color) => new M.Arrow({ start, end, color, strokeWidth: 3 });
  const rectangle = (width, height, point, color, fill = C.card, opacity = 0.9) => {
    const shape = new M.RoundedRectangle({ width, height, cornerRadius: 0.09, color, strokeWidth: 2 });
    shape.setFill(fill, opacity);
    return shape.moveTo(point);
  };

  const visible = new Map();
  function replace(key, ...objects) {
    const out = (visible.get(key) || []).map(leave);
    visible.set(key, objects);
    return [...out, ...objects.map(enter)];
  }

  function formula(lines = [], color = C.cyan) {
    if (!lines.length) return replace('formula');
    const size = P ? 21 : 20;
    const lh = 0.34;
    const rows = lines.map(entry => Array.isArray(entry) ? entry : [entry, C.ink]);
    const texts = rows.map(([text, ink]) => T(text, size, ink, true));
    const width = Math.max(...texts.map(text => text.getWidth())) + 0.54;
    const height = rows.length * lh + 0.24;
    const card = new M.RoundedRectangle({ width, height, cornerRadius: 0.15, color, strokeWidth: 2 });
    card.setFill(C.card, 0.96);
    texts.forEach((text, i) => {
      text.moveTo(at(-width / 2 + 0.27 + text.getWidth() / 2, ((texts.length - 1) / 2 - i) * lh));
    });
    const group = new M.VGroup(card, ...texts);
    const maxWidth = P ? FW - 1.2 : 4;
    if (width > maxWidth) group.scale(maxWidth / width);
    return replace('formula', group.moveTo(BOXP));
  }

  function patch(values, center, { rows = 2, cols = 2, pitch = 0.76, color = C.cyan, title = '', fills } = {}) {
    const cells = values.map((_, i) => at(
      center[0] + (i % cols - (cols - 1) / 2) * pitch,
      center[1] + ((rows - 1) / 2 - Math.floor(i / cols)) * pitch
    ));
    const parts = cells.map((point, i) =>
      rectangle(pitch * 0.91, pitch * 0.91, point, color, fills?.[i] || C.card));
    values.forEach((value, i) => {
      if (value != null) parts.push(label(value, cells[i], color, pitch >= 0.7 ? 24 : 20));
    });
    if (title) parts.push(label(title, at(center[0], center[1] + rows * pitch / 2 + 0.25), color, 17));
    return { group: new M.VGroup(...parts), cells, pitch };
  }

  function outline(width, height, point, color = C.amber) {
    return rectangle(width, height, point, color, C.card, 0);
  }

  function mark(picture, indexes, color = C.amber) {
    return indexes.map(i => outline(picture.pitch * 0.99, picture.pitch * 0.99, picture.cells[i], color));
  }

  function pulse(start, end, color = C.amber, duration = 0.48) {
    const dot = point => new M.Dot({ point, radius: 0.13, color });
    return new M.Transform(dot(start), dot(end), { runTime: duration });
  }

  async function trace(points, color = C.amber) {
    const dot = new M.Dot({ point: points[0], radius: 0.13, color });
    for (const point of points.slice(1)) {
      await play(new M.Transform(dot, new M.Dot({ point, radius: 0.13, color }), { runTime: 0.42 }));
    }
    await play(leave(dot));
  }

  const tile = patch(BRIGHTNESS.map(() => null), MAIN, {
    rows: 4, cols: 4, pitch: 0.83, color: C.muted, title: 'CAMERA VIEW',
    fills: BRIGHTNESS.map(value => value === 4 ? '#cbbda8' : '#30354a')
  });
  const edgeGrid = patch(Array(12).fill(null), MAIN, { rows: 4, cols: 3, pitch: 0.72, title: 'EDGE SCORES' });
  const incoming = patch(INPUT, MAIN, { pitch: 0.96, title: 'INCOMING PATCH' });

  await until(S(0));
  await play(...replace('picture', tile.group), ...say('GLAZED TILE'));
  await until(S(1));
  await play(...replace('focus', ...mark(tile, [5, 6])),
    ...formula(['bright glaze   4', 'dark chip      1', ['brightness drop  3', C.amber]]),
    ...say('BRIGHT GLAZE → DARK CHIP', C.amber));
  await until(S(2));
  await play(...formula(), ...say('CAN WE KEEP THE EDGE SCORE?', C.amber));

  await until(S(3));
  await play(...replace('picture', edgeGrid.group),
    ...replace('focus', outline(1.45, 1.45, at(MAIN[0] - 0.36, MAIN[1] + 0.72))),
    ...say('TOP-LEFT PATCH'));
  await until(S(4));
  await play(...replace('picture', incoming.group), ...replace('focus', ...mark(incoming, [3])));
  await until(S(5));
  await play(...say('3 MARKS THE CHIP EDGE', C.amber));

  const N = net({ layers: [4, 1, 4], center: MAIN, width: P ? 5.5 : 5.7, height: NH, r: 0.28 });
  const inEdges = N.edges[0].map(row => row[0]);
  const outEdges = N.edges[1][0];
  const edgeWeights = [-0.5, 0.25, 0.5, 1];
  const numbers = (layer, values, color) =>
    values.map((value, i) => label(value, N.pos(layer, i), color, 21));
  const names = ['INPUT', 'HIDDEN', 'OUTPUT'].map((name, i) =>
    label(name, at(N.pos(i, 0)[0], MAIN[1] - (NH / 2 + 0.6)), [C.violet, C.cyan, C.amber][i], 17));
  const flash = (nodes, color) => nodes.map(node =>
    new M.Flash(node, { color, flashRadius: 0.29, lineLength: 0.13, runTime: 0.52 }));

  await until(S(6));
  await play(...replace('picture'), ...replace('focus'),
    ...replace('inputs', ...N.nodes[0]), ...say('ONE SCORE PER CIRCLE', C.violet));
  const inputNumbers = numbers(0, INPUT, C.violet);
  visible.set('input numbers', inputNumbers);
  await play(new M.LaggedStart(inputNumbers.map(enter), { lagRatio: 0.35, runTime: 0.96 }));
  await until(S(7));
  await play(...replace('other nodes', ...N.nodes[1], ...N.nodes[2]), ...say('THREE COLUMNS'));
  await until(S(8));
  await play(...replace('edges', ...inEdges, ...outEdges), ...say('EACH CIRCLE ADDS WHAT ARRIVES'));
  await play(...N.flow(0, C.cyan));
  await until(S(9));
  await play(...edgeWeights.flatMap((weight, i) => N.weight(0, i, 0, Math.sign(weight) * 0.5)),
    ...[0, 1, 2, 3].flatMap(i => N.weight(1, 0, i, 0.5)), ...say('BLUE ADDS · PINK SUBTRACTS'));
  await until(S(10));
  await play(...edgeWeights.flatMap((weight, i) => N.weight(0, i, 0, weight)),
    ...[0, 1, 2, 3].flatMap(i => N.weight(1, 0, i, i === 2 ? 1 / 3 : 0.15)), ...say('THICKER LINE, STRONGER WEIGHT'));
  await until(S(11));
  await play(...flash(N.nodes[0], C.violet), ...say('NEURONS IN LAYERS'));
  await until(S(12));
  await play(...replace('end names', names[0], names[2]), ...flash(N.nodes[2], C.amber), ...say('INPUT → OUTPUT'));
  await until(S(13));
  await play(...replace('hidden name', names[1]), ...flash(N.nodes[1], C.cyan), ...say('HIDDEN LAYER'));

  const routeY = MAIN[1] + NH / 2 + 0.45;
  const left = N.pos(0, 0);
  const right = N.pos(2, 0);
  const routeStart = at(left[0], routeY);
  const routeEnd = at(right[0], routeY);
  const shortcut = new M.VGroup(...[0, 1, 2, 3].map(i =>
    arrow(at(N.pos(0, i)[0] + 0.3, N.pos(0, i)[1], 0), at(N.pos(2, i)[0] - 0.3, N.pos(2, i)[1], 0), C.violet)));
  const packet = label('0   0   0   3', at(routeStart[0] + 1.1, routeY + 0.31), C.violet, 17);
  const packetEnd = label('0   0   0   3', at(routeEnd[0] - 1.1, routeY + 0.31), C.violet, 17);

  await until(S(14));
  await play(...replace('shortcut', shortcut), ...say('SPLIT INTO TWO PATHS', C.violet));
  await until(S(15));
  visible.set('packet', [packet]);
  await play(new M.Transform(packet, packetEnd, { runTime: 0.95 }), ...say('TOP PATH CARRIES SCORES UNCHANGED', C.violet));
  await until(S(16));
  await play(...N.flow(0, C.cyan), ...say('LOWER PATH MAKES CORRECTIONS'));
  await play(...N.flow(1, C.cyan));

  const map = patch(INPUT, SIDE, { color: C.violet, title: 'BASE MAP' });
  const sheet = outline(1.65, 1.65, at(SIDE[0] + 0.27, SIDE[1] + 0.18), C.cyan);
  sheet.setFill(C.cyan, 0.08);
  const sheetCells = patch([null, null, null, null], SIDE, { color: C.cyan }).cells;
  const annotation = label('1', at(sheetCells[2][0] + 0.27, sheetCells[2][1] + 0.18), C.cyan, 20);
  await until(S(17));
  await play(...replace('side', map.group, sheet, annotation), ...say('BASE MAP + CLEAR SHEET', C.violet));
  await until(S(18));
  await play(...replace('side'), ...replace('output numbers', ...numbers(2, ['+', '+', '+', '+'], C.amber)),
    ...say('ADD THE TWO MATCHING SCORES', C.amber));
  await until(S(19));
  await play(...replace('packet'), ...say('TOP PATH = SHORTCUT', C.violet));

  // Fit the bottom-left correction to the workshop example, starting at zero.
  const chartY = P ? -5.6 : -2.45;
  const chartLeft = BOXP[0] - 1.24;
  const chartPoint = (i, loss) => at(chartLeft + i * 0.77, chartY + loss * 0.65);
  const chartParts = [
    line(at(chartLeft, chartY), at(chartLeft + 2.6, chartY), C.muted),
    line(at(chartLeft, chartY), at(chartLeft, chartY + 0.74), C.muted),
    label('LOSS', at(chartLeft - 0.39, chartY + 0.66), C.amber, 12)
  ];
  const stepLabel = (old, error, change, next, loss) => [
    `error  1 − ${old} = ${error}`,
    `${old} + ${change} → ${next}`,
    [`loss  ${loss}`, C.amber]
  ];

  await until(S(20));
  await play(...replace('loss chart', ...chartParts),
    ...formula(['target correction  1', 'start correction   0', ['loss  1', C.amber]], C.amber),
    ...say('TRAINING REDUCES THE MISTAKE', C.amber));
  const examples = [
    ['0', '1', '0.5', '0.5', '0.25'],
    ['0.5', '0.5', '0.25', '0.75', '0.0625'],
    ['0.75', '0.25', '0.125', '0.875', '0.015625']
  ];
  const losses = [1, 0.25, 0.0625, 0.015625];
  for (let i = 0; i < examples.length; i++) {
    await until(S(20) + 0.85 + i * 1.27);
    const segment = line(chartPoint(i, losses[i]), chartPoint(i + 1, losses[i + 1]), C.amber, 3);
    chartParts.push(segment);
    visible.set('loss chart', chartParts);
    await play(new M.Create(segment, { runTime: 0.45 }), ...formula(stepLabel(...examples[i]), C.amber));
  }

  await until(S(21));
  await play(...replace('loss chart'), ...formula(), ...say('LOWER PATH = LEARNED BRANCH'));
  await until(S(22));
  await play(...say('CORRECTION = RESIDUAL'));
  await until(S(23));
  await play(...flash(N.nodes[2], C.amber), ...say('SHORTCUT PLUS RESIDUAL', C.amber));

  const shortcutPatch = patch(INPUT, SIDE, { color: C.violet, title: 'SHORTCUT' });
  const correctionPatch = patch(CORRECTION, SIDE, { title: 'CORRECTIONS' });
  const empty = patch(Array(4).fill(null), SIDE, { color: C.green, title: 'NEW PATCH' });

  await until(S(24));
  await play(...replace('side', shortcutPatch.group), ...replace('focus', ...mark(shortcutPatch, [3])),
    ...say('SHORTCUT KEEPS THE 3', C.violet));
  await until(S(25));
  await play(...replace('side'), ...replace('focus'), ...N.flow(0, C.cyan), ...say('THE HIDDEN LAYER COMBINES SCORES'));
  await play(...N.flow(1, C.cyan));
  await until(S(26));
  await play(...replace('side', correctionPatch.group), ...replace('focus', ...mark(correctionPatch, [2])),
    ...say('ONE CORRECTION OF 1'));
  await until(S(27));
  await play(...say('A WEAK EXTRA EDGE NEAR THE CHIP', C.cyan));
  await until(S(28));
  const transfers = empty.cells.map((cell, i) => pulse(N.pos(2, i), cell, C.green));
  const movingDots = transfers.map(animation => animation.mobject);
  await play(...replace('side', empty.group), ...replace('focus'), ...say('ONE NEURON PER SQUARE', C.green));
  await play(...replace('output numbers', ...numbers(2, OUTPUT, C.green)));
  await play(new M.LaggedStart(transfers, { lagRatio: 0.44, runTime: 1.15 }));
  await play(...movingDots.map(leave), ...replace('side', patch(OUTPUT, SIDE, { color: C.green, title: 'NEW PATCH' }).group));

  const spacing = P ? 2.6 : 2.25;
  const centers = [-1, 0, 1].map(i => at(MAIN[0] + i * spacing, MAIN[1]));
  const TP = P ? 0.9 : 0.72;
  function triptych(base, correction, result) {
    return [
      patch(base, centers[0], { color: C.violet, title: 'SHORTCUT', pitch: TP }),
      patch(correction, centers[1], { color: C.cyan, title: 'CORRECTION', pitch: TP }),
      patch(result, centers[2], { color: C.green, title: 'NEW PATCH', pitch: TP })
    ];
  }
  const signs = [
    label('+', at(MAIN[0] - spacing / 2, MAIN[1]), C.muted, 24),
    label('=', at(MAIN[0] + spacing / 2, MAIN[1]), C.muted, 24)
  ];
  const showPatches = patches => replace('picture', ...patches.map(p => p.group));
  const focus = (patches, indexes) => replace('focus', ...patches.flatMap(p => mark(p, indexes)));
  const top = triptych(INPUT, CORRECTION, [0, 0, null, null]);
  const lowerLeft = triptych(INPUT, CORRECTION, [0, 0, 1, null]);
  const complete = triptych(INPUT, CORRECTION, OUTPUT);

  await until(S(29));
  await play(...replace('inputs'), ...replace('input numbers'), ...replace('other nodes'), ...replace('edges'),
    ...replace('end names'), ...replace('hidden name'), ...replace('hidden number'), ...replace('output numbers'),
    ...replace('shortcut'), ...replace('side'), ...showPatches(top), ...replace('signs', ...signs), ...focus(top, [0, 1]),
    ...formula([['0 + 0 = 0', C.amber]]), ...say('TOP ROW'));
  await until(S(30));
  await play(...showPatches(lowerLeft), ...focus(lowerLeft, [2]), ...formula([['0 + 1 = 1', C.amber]]), ...say('BOTTOM LEFT'));
  await until(S(31));
  await play(...showPatches(complete), ...focus(complete, [3]), ...formula([['3 + 0 = 3', C.amber]]), ...say('BOTTOM RIGHT'));
  await until(S(32));
  await play(...replace('focus'), ...formula(), ...say('THE NEW PATCH', C.green));
  await until(S(33));
  await play(...showPatches(triptych(INPUT, ZERO, INPUT)), ...say('ALL ZERO CORRECTIONS KEEP THE PATCH', C.green));
  await until(S(34));
  const signed = triptych(INPUT, [1, 0, 0, -1], [1, 0, 0, 2]);
  await play(...showPatches(signed),
    ...formula(['0 + 1 = 1   rises', '0 + 0 = 0   stays', ['3 − 1 = 2   drops', C.pink]]),
    ...say('RAISE, KEEP OR LOWER A SCORE'));
  await until(S(35));
  await play(...showPatches(complete), ...formula(['new score', '= incoming score', ['  + correction', C.cyan]]),
    ...say('ADD CELL BY CELL', C.amber));

  const deep = net({ layers: [1, 1, 1, 1], center: MAIN, width: P ? 5.5 : 5.7, r: 0.3 });
  const deepPoints = deep.nodes.map((_, i) => deep.pos(i, 0));
  const [first, second, third, last] = deepPoints;
  const skipY = MAIN[1] + 0.9;
  const skipStart = at(first[0], skipY);
  const skipEnd = at(last[0], skipY);
  const bypass = new M.VGroup(
    line(at(first[0], first[1] + 0.31), skipStart, C.violet),
    arrow(skipStart, skipEnd, C.violet),
    line(skipEnd, at(last[0], last[1] + 0.31), C.violet)
  );
  const gold = (value, i) => label(value, at(deepPoints[i][0], MAIN[1] - 0.64), C.amber, 19);
  const smallWeights = deepPoints.slice(1).map((point, i) =>
    label('× 0.5', at((point[0] + deepPoints[i][0]) / 2, MAIN[1] - 0.33), C.cyan, 16));

  await until(S(36));
  await play(...replace('picture', deep.group), ...replace('signs'), ...formula(),
    ...say('MANY LAYERS PICK OUT SHAPES'));
  await until(S(37));
  await play(...replace('bypass', bypass), ...replace('deep scores', ...deepPoints.map(pt => label('3', pt, C.violet, 19))),
    ...say('CARRY THE SCORE THROUGH', C.violet));
  await until(S(38));
  const nearZero = patch(ZERO, SIDE, { pitch: 0.62, title: 'CORRECTIONS NEAR ZERO' });
  await play(...replace('side', nearZero.group), ...say('SMALL CORRECTIONS KEEP SCORES'));
  await until(S(39));
  await play(...replace('side'), ...flash(deep.nodes[3], C.amber),
    ...formula(['example target  1', 'output score    0', ['mistake        1', C.amber]], C.amber),
    ...say('CHECK THE OUTPUT MISTAKE', C.amber));
  await until(S(40));
  await play(...formula(), ...replace('signals', gold('1', 3)), ...say('ERROR SIGNAL FLOWS BACK', C.amber));
  await trace([last, third]);
  await until(S(41));
  await play(...replace('deep weights', ...smallWeights), ...replace('signals', gold('1', 3), gold('0.5', 2)),
    ...formula([['1 × 0.5 = 0.5', C.amber]], C.amber), ...say('MULTIPLY BY THE WEIGHT', C.amber));
  await until(S(42));
  const further = [gold('0.25', 1), gold('0.125', 0)];
  await play(...formula(['0.5 × 0.5 = 0.25', ['0.25 × 0.5 = 0.125', C.amber]], C.amber),
    ...say('SMALL WEIGHTS WEAKEN THE SIGNAL', C.amber));
  await trace([third, second]);
  await play(...replace('further signals', further[0]));
  await trace([second, first]);
  visible.set('further signals', further);
  await play(enter(further[1]));
  await until(S(43));
  await play(...replace('further signals'), ...replace('signals', gold('1', 3)), ...formula(),
    ...say('SHORTCUT SENDS THE SIGNAL STRAIGHT BACK', C.violet));
  await trace([at(last[0], last[1] + 0.31), skipEnd, skipStart, at(first[0], first[1] + 0.31)]);
  await until(S(44));
  await play(...replace('further signals', gold('1', 0)), ...flash(deep.nodes[0], C.amber),
    ...say('EARLY LAYERS GET A STRONG SIGNAL', C.amber));

  const pairCenters = [-1, 1].map(i => at(MAIN[0] + i * 1.25, MAIN[1]));
  const basePair = patch(INPUT, pairCenters[0], { color: C.violet, title: 'SHORTCUT' });
  const correctionPair = patch(CORRECTION, pairCenters[1], { color: C.cyan, title: 'LEARNED BRANCH' });
  const smallCorrection = patch([1], pairCenters[1], { rows: 1, cols: 1, title: 'LEARNED BRANCH' });
  const smallBase = patch([3], pairCenters[0], { rows: 1, cols: 1, color: C.violet, title: 'SHORTCUT' });
  const plus = label('+', MAIN, C.muted, 25);

  await until(S(45));
  await play(...replace('bypass'), ...replace('signals'), ...replace('deep weights'), ...replace('further signals'), ...replace('deep scores'),
    ...replace('picture', basePair.group, correctionPair.group), ...replace('signs', plus),
    ...say('ADD PATCHES OF THE SAME SIZE', C.amber));
  await until(S(46));
  await play(...focus([basePair, correctionPair], [2]), ...say('MATCH ROW AND COLUMN'));
  await until(S(47));
  await play(...replace('focus'), ...replace('picture', basePair.group.copy(), smallCorrection.group), ...replace('signs'),
    ...formula(['shortcut      2 × 2', ['learned branch  1 × 1', C.amber]], C.amber),
    ...say('THE LEARNED PATCH CAN SHRINK', C.amber));
  await until(S(48));
  await play(...replace('picture', smallBase.group, smallCorrection.group.copy()), ...replace('signs', plus),
    ...formula(['shortcut      1 × 1', ['learned branch  1 × 1', C.green]], C.green),
    ...say('RESIZE THE SHORTCUT TOO', C.green));

  await until(S(49));
  await play(...showPatches(triptych(INPUT, CORRECTION, OUTPUT)), ...replace('signs', ...signs), ...formula(),
    ...say('SHORTCUT + RESIDUAL = NEW PATCH', C.green));
  await until(S(50));
  const identity = triptych(INPUT, ZERO, INPUT);
  await play(...showPatches(identity), ...say('TRY IT · SET ALL CORRECTIONS TO ZERO', C.green));
  await until(S(51));
  const lowered = triptych(INPUT, [0, 0, 0, -1], [0, 0, 0, 2]);
  await play(...showPatches(lowered), ...focus(lowered, [3]), ...formula([['3 − 1 = 2', C.pink]], C.pink),
    ...say('TRY IT · LOWER THE BOTTOM RIGHT', C.pink));
}
