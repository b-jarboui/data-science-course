// 17.2.8 Gradient clipping. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const CX = P ? 0 : -2.6;
  const OR = '#fb923c';
  const PILL = P ? [0, 4.05, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.45, 0] : [4.3, -0.3, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const at = (text, x, y, size = 19, color = C.ink) =>
    T(text, size, color, true).moveTo([x, y, 0]);
  const line = (start, end, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start, end, color, strokeWidth });
  const fades = objects => objects.map(o => new M.FadeOut(o, { runTime: 0.45 }));
  const enter = objects => objects.map(o => new M.FadeIn(o, { runTime: 0.55 }));

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 22 : 21, lh = P ? 0.38 : 0.42;
    const texts = lines.map(row => {
      const [text, ink] = Array.isArray(row) ? row : [row, C.ink];
      return T(text, size, ink, true);
    });
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.64;
    const height = lines.length * lh + 0.28;
    const border = new M.RoundedRectangle({
      width, height, cornerRadius: 0.16, color, strokeWidth: 2
    });
    border.setFill(C.card, 0.95);
    border.moveTo(BOXP);
    texts.forEach((t, i) => t.moveTo([
      BOXP[0] - width / 2 + 0.32 + t.getWidth() / 2,
      BOXP[1] + ((texts.length - 1) / 2 - i) * lh, 0
    ]));
    const next = new M.VGroup(border, ...texts);
    const maxWidth = P ? FW - 1.0 : 4.6;
    if (width > maxWidth) next.scale(maxWidth / width);
    const animations = boxNow ? fades([boxNow]) : [];
    boxNow = next;
    return [...animations, ...enter([next])];
  }

  function clearBox() {
    const animations = boxNow ? fades([boxNow]) : [];
    boxNow = null;
    return animations;
  }

  function card(x, y, digit, answer = false, scale = 1) {
    const outline = new M.RoundedRectangle({
      width: 1.1 * scale, height: 1.32 * scale, cornerRadius: 0.12,
      color: answer ? C.amber : C.cyan, strokeWidth: 2
    });
    outline.setFill(C.card, 0.96);
    outline.moveTo([x, y, 0]);
    const points = digit === 0
      ? [[0.02, 0.32], [-0.17, 0.26], [-0.24, 0.04], [-0.18, -0.22],
        [-0.03, -0.30], [0.17, -0.21], [0.22, 0.04], [0.16, 0.26], [0.02, 0.32]]
      : [[-0.17, 0.12], [0.04, 0.32], [0.01, -0.27]];
    const pos = ([dx, dy]) => [x + dx * scale, y + dy * scale, 0];
    const marks = points.slice(1).map((p, i) => line(pos(points[i]), pos(p), C.cyan, 4));
    return new M.VGroup(outline, ...(answer
      ? [at('Answer', x, y + 0.30 * scale, 15, C.amber),
        at(String(digit), x, y - 0.17 * scale, 26, C.amber)]
      : marks));
  }

  const rr = (x, y, w, h, color, fill) => { const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.1, color, strokeWidth: 2 }); r.setFill(fill, 1); r.moveTo([x, y, 0]); return r; };
  const packageView = (() => {
    const s = P ? 1.5 : 1, x = CX, y = P ? 0.4 : -0.4;
    return new M.VGroup(rr(x, y, 4.2 * s, 2.8 * s, C.amber, '#3a2a17'), rr(x, y + 1.15 * s, 4.2 * s, 0.35 * s, C.amber, '#5a4320'),
      rr(x + 0.5 * s, y - 0.2 * s, 2.4 * s, 1.3 * s, C.ink, '#e8edf7'), T('4 0 7 1', P ? 40 : 36, C.bg, true, true).moveTo([x + 0.5 * s, y - 0.2 * s, 0]));
  })();
  const pictureCard = card(CX, -0.35, 0);
  const answerCard = card(CX, -0.35, 0, true);

  function reader(y, scale = 1) {
    const r = P ? 0.42 : 0.38, NW = P ? 3.4 : 2.65, cx0 = P ? CX - 2.55 : CX - 2.18;
    const N = net({
      layers: [2, 1], center: [CX + (P ? 0.85 : 0.72), y, 0], width: NW,
      height: (P ? 1.5 : 1.18) * scale, r
    });
    const cards = [
      card(cx0, y + (P ? 0.75 : 0.60) * scale, 0, false, (P ? 0.9 : 0.70) * scale),
      card(cx0, y - (P ? 0.75 : 0.60) * scale, 1, false, (P ? 0.9 : 0.70) * scale)
    ];
    const edgeLabels = (labels, color) => [0, 1].map(i => {
      const [x, ey] = N.pos(0, i);
      return at(labels[i], x + NW * 0.45, y + (ey - y) * 0.54 + (i === 0 ? 0.4 : -0.4), P ? 20 : 17, color);
    });
    const weights = values => values.flatMap((w, i) => N.weight(0, i, 0, w / 8));
    const backward = () => {
      // N.flow follows each line's point order. Reverse the copies it sees.
      const edges = N.edges[0].map(row => row[0]);
      const finish = N.pos(1, 0);
      const end = [finish[0] - r, finish[1], -0.01];
      const starts = edges.map((_, i) => {
        const p = N.pos(0, i);
        return [p[0] + r, p[1], -0.01];
      });
      edges.forEach((edge, i) => { edge.setStart(end); edge.setEnd(starts[i]); });
      const animations = N.flow(0, OR);
      edges.forEach((edge, i) => { edge.setStart(starts[i]); edge.setEnd(end); });
      return animations;
    };
    return { N, cards, edgeLabels, weights, backward };
  }

  const R = reader(P ? 0.9 : -0.55);
  const { N } = R;
  const guesses = at('Predictions  7, 7', CX, P ? -0.75 : -1.83, P ? 21 : 19, C.amber);
  const outVal = at('7', ...N.pos(1, 0).slice(0, 2), 22, C.amber);

  await until(S(0)); await play(...enter([packageView]), ...say('READ DIGITS ON PARCEL LABELS'), ...fbox(['goal: read each digit', ['0 to 9', C.amber]]));
  await until(S(1)); await play(...fbox(['front: the picture', ['back: the answer', C.amber]], C.amber), 
    ...fades([packageView]), ...enter([pictureCard]),
    new M.LaggedStart([
      new M.FadeOut(pictureCard, { runTime: 0.55 }),
      new M.FadeIn(answerCard, { runTime: 0.55 })
    ], { lagRatio: 1, runTime: 2.4 })
  );
  await until(S(2)); await play(...say('HOW MUCH CAN TWO CARDS CHANGE?', C.amber));
  await until(S(3)); await play(
    ...fades([answerCard]), ...enter([...R.cards, N.group]), ...say('TWO TRAINING CARDS'),
    ...fbox(['cards 0 and 1', ['→ the network', C.cyan]])
  );
  let edgeText = R.edgeLabels(['A', 'B'], C.amber);
  await until(S(4)); await play(...enter(edgeText), ...say('TWO WEIGHTS: A AND B', C.amber), ...fbox([['weights A and B', C.amber]], C.amber));
  await until(S(5)); await play(...R.weights([6, 8]), ...N.flow(0, C.cyan), ...say('A WEIGHT SCALES THE NUMBER ON ITS LINE'));
  await until(S(6)); await play(...say('TRAINING CHANGES THE WEIGHTS'));
  await until(S(7)); await play(
    ...enter([outVal, guesses]), ...say('PREDICTS 7 ON BOTH CARDS', C.amber), ...fbox([['predictions: 7, 7', C.amber], ['loss is high', C.pink]], C.pink)
  );
  await until(S(8)); await play(...R.backward(), ...say('GRADIENTS TRAVEL BACK', OR));
  await until(S(9)); await play(
    ...say('HOW FAST DOES THE LOSS RISE?', OR),
    ...fbox(['Increase one weight', ['Watch the loss rise', OR]], OR)
  );
  await until(S(10)); await play(...say('GRADIENT + : RAISE WEIGHT → LOSS RISES', OR));
  await until(S(11));
  const slopeText = R.edgeLabels(['6', '8'], OR);
  await play(...fades(edgeText), ...enter(slopeText), ...fbox(['Gradient A = 6', 'Gradient B = 8'], OR));
  edgeText = slopeText;

  const U = P ? 0.48 : 0.32;
  const origin = [CX - 1.5 * U, (P ? -0.85 : -0.82) - 2 * U, 0];
  const xy = (x, y) => [origin[0] + U * x, origin[1] + U * y, 0];
  const grid = new M.VGroup(
    ...Array.from({ length: 14 }, (_, i) =>
      line(xy(i - 5, -5), xy(i - 5, 9), i === 5 ? C.muted : C.line, i === 5 ? 2 : 1)),
    ...Array.from({ length: 15 }, (_, i) =>
      line(xy(-5, i - 5), xy(8, i - 5), i === 5 ? C.muted : C.line, i === 5 ? 2 : 1))
  );
  const vector = (x, y, color = C.cyan) => new M.Arrow({
    start: xy(0, 0), end: xy(x, y), color, strokeWidth: 4, buff: 0, tipLength: 0.16
  });
  const run = line(xy(0, 0), xy(6, 0), C.violet, 3);
  const rise = line(xy(6, 0), xy(6, 8), C.pink, 3);
  const runLabel = at('6', ...xy(3, -0.65).slice(0, 2), 19, C.violet);
  const riseLabel = at('8', ...xy(6.85, 4).slice(0, 2), 19, C.pink);
  const unitSquare = new M.Rectangle({ width: U, height: U, color: C.amber, strokeWidth: 3 });
  unitSquare.moveTo(xy(-0.5, -0.5));
  const capCircle = radius => new M.Circle({ radius: radius * U, color: C.amber, strokeWidth: 2 })
    .moveTo(xy(0, 0));
  const cap5 = capCircle(5);
  const ghost = new M.DashedLine({ start: xy(0, 0), end: xy(6, 8), color: C.muted });
  let arrow = vector(6, 8);

  await until(S(12)); await play(
    ...fades([N.group, ...R.cards, ...edgeText, guesses, outVal]), ...clearBox(),
    ...enter([grid, runLabel, riseLabel]),
    new M.LaggedStart([new M.Create(run), new M.Create(rise), new M.Create(arrow)],
      { lagRatio: 0.55, runTime: 2.2 }),
    ...say('6 RIGHT, 8 UP')
  );
  await until(S(13)); await play(new M.Create(unitSquare), ...say('ONE SQUARE = ONE UNIT', C.amber));
  await until(S(14)); await play(
    ...fades([unitSquare]), new M.Indicate(arrow, { color: C.pink }),
    ...say('A LONG ARROW CAN MEAN A BIG STEP', C.pink)
  );
  await until(S(15)); await play(
    new M.Create(cap5), ...fbox([['Cap = 5 units', C.amber]], C.amber), ...say('THE CAP IS A CIRCLE', C.amber)
  );
  await until(S(16)); await play(
    ...enter([ghost]), new M.Transform(arrow, vector(3, 4, C.green), { runTime: 2.0 })
  );
  await until(S(17)); await play(...say('SHORTER ARROW, SAME DIRECTION', C.green));
  await until(S(18)); await play(
    new M.Indicate(runLabel, { color: C.violet }), new M.Indicate(riseLabel, { color: C.pink }),
    ...say('TWO GRADIENTS = ONE GRADIENT ARROW')
  );
  await until(S(19)); await play(new M.Indicate(arrow, { color: C.green }), ...say('GRADIENT NORM = ARROW LENGTH'));
  await until(S(20)); await play(...say('GRADIENT CLIPPING BY NORM', C.green));

  const G = P ? 0.3 : 0.205;
  const geo = (x, y) => [CX + (x - 3) * G, (P ? -1.05 : -0.66) + (y - 4) * G, 0];
  const triangle = new M.VGroup(
    line(geo(0, 0), geo(6, 0), C.violet, 3),
    line(geo(6, 0), geo(6, 8), C.pink, 3),
    line(geo(0, 0), geo(6, 8), C.cyan, 4),
    line(geo(5, 0), geo(5, 1), C.ink),
    line(geo(5, 1), geo(6, 1), C.ink),
    at('6', ...geo(3, 0.85).slice(0, 2), 18, C.violet),
    at('8', ...geo(6.85, 4).slice(0, 2), 18, C.pink)
  );
  function areaSquare(points, center, area, color) {
    const square = new M.Polygon({ vertices: points.map(([x, y]) => geo(x, y)), color, strokeWidth: 2 });
    square.setFill(color, 0.16);
    return new M.VGroup(square, at(area, ...geo(...center).slice(0, 2), P ? 25 : 22, color));
  }
  const sq36 = areaSquare([[0, 0], [0, -6], [6, -6], [6, 0]], [3, -3], '36', C.violet);
  const sq64 = areaSquare([[6, 0], [14, 0], [14, 8], [6, 8]], [10, 4], '64', C.pink);
  const sq100 = areaSquare([[0, 0], [6, 8], [-2, 14], [-8, 6]], [-1, 7], '100', C.cyan);

  await until(S(21)); await play(
    ...fades([grid, run, rise, runLabel, riseLabel, ghost, cap5, arrow]), ...clearBox(),
    ...enter([triangle]), ...say('A SQUARE CORNER')
  );
  await until(S(22)); await play(
    new M.LaggedStart([new M.FadeIn(sq36), new M.FadeIn(sq64)], { lagRatio: 0.55, runTime: 1.7 }),
    ...fbox([['6 × 6 = 36', C.violet], ['8 × 8 = 64', C.pink]])
  );
  await until(S(23)); await play(...enter([sq100]), ...fbox([['36 + 64 = 100', C.cyan]]));
  await until(S(24)); await play(...fbox(['? × ? = 100'], C.amber), ...say('WHAT IS THE ARROW LENGTH?', C.amber));
  await until(S(25)); await play(...fbox(['10 × 10 = 100', ['Length = 10', C.cyan]]));
  arrow = vector(3, 4, C.green);
  const measure10 = new M.DashedLine({ start: xy(0, 0), end: xy(6, 8), color: C.muted });
  const halfRun = line(xy(0, 0), xy(3, 0), C.violet, 3);
  const halfRise = line(xy(3, 0), xy(3, 4), C.pink, 3);
  const halfX = at('3', ...xy(1.5, -0.7).slice(0, 2), 18, C.violet);
  const halfY = at('4', ...xy(3.7, 2).slice(0, 2), 18, C.pink);

  await until(S(26)); await play(
    ...fades([triangle, sq36, sq64, sq100]), ...enter([grid, measure10, cap5, arrow]),
    ...say('5 IS HALF OF 10', C.amber)
  );
  await until(S(27)); await play(...fbox(['Cap ÷ length', ['5 ÷ 10 = 0.5', C.amber]], C.amber));
  await until(S(28)); await play(...say('TAKE HALF OF EACH GRADIENT'), new M.Create(halfRun), new M.Create(halfRise));
  await until(S(29)); await play(
    ...enter([halfX, halfY]), ...fbox([['6 × 0.5 = 3', C.violet], ['8 × 0.5 = 4', C.pink]])
  );
  const touch = new M.Dot({ point: xy(3, 4), radius: 0.09, color: C.green });
  await until(S(30)); await play(
    ...enter([touch]), new M.Flash(touch, { color: C.green, flashRadius: 0.14, lineLength: 0.13 }),
    ...fbox(['9 + 16 = 25', ['5 × 5 = 25', C.green]])
  );
  await until(S(31)); await play(...fbox(['For length above cap', ['Factor = cap ÷ length', C.amber]], C.amber));
  await until(S(32)); await play(...fbox(['New A = factor × A', ['New B = factor × B', C.green]]));
  const inside = vector(1.8, 2.4, C.violet);
  await until(S(33)); await play(
    ...fades([halfRun, halfRise, halfX, halfY, touch]), new M.Create(inside),
    ...say('AT OR BELOW THE CAP: KEEP IT', C.green), ...fbox(['At cap    (3, 4) → (3, 4)', 'Below cap: keep both'])
  );
  await until(S(34)); await play(
    ...fades([inside]), new M.Indicate(arrow, { color: C.green }),
    ...say('THE GRADIENT POINTS UPHILL', C.pink)
  );
  const reverse = vector(-1.5, -2, C.amber);
  await until(S(35)); await play(new M.Create(reverse), ...say('STEP THE OPPOSITE WAY', C.amber));

  const trainY = P ? 1.35 : 0.25;
  const train = reader(trainY, 0.92);
  const plotX = CX - 2.65, plotW = 5.30;
  const plotBottom = P ? -3.85 : -2.68;
  const plotH = P ? 2.4 : 1.02;
  const maxStep = 8;
  const plotPoint = (step, loss) => [plotX + step * plotW / maxStep, plotBottom + loss * plotH / 50, 0];
  const plotAxes = new M.VGroup(
    line(plotPoint(0, 0), plotPoint(maxStep, 0)),
    line(plotPoint(0, 0), plotPoint(0, 50)),
    at('50', plotX - 0.27, plotBottom + plotH, 16, C.muted),
    at('0', plotX - 0.22, plotBottom, 16, C.muted),
    at('loss', plotX + 0.42, plotBottom + plotH + 0.3, 16, C.muted),
    at('training step', CX + 1.9, plotBottom - 0.27, 16, C.muted)
  );
  const chart = [];
  const initialWeights = [6, 8];
  const loss = ([a, b]) => (a * a + b * b) / 2;
  const display = n => String(Number(n.toFixed(3)));
  const pair = weights => `(${weights.map(display).join(', ')})`;
  const guess = (weight, cardIndex) => weight > 5 ? 7 : cardIndex;
  let weights = initialWeights.slice(), step = 0, stats = [], trainingLabels = [];

  function plotStep(oldLoss, newLoss) {
    const p = plotPoint(step, newLoss);
    const dot = new M.Dot({ point: p, radius: 0.055, color: C.green });
    const additions = step === 0 ? [dot] : [line(plotPoint(step - 1, oldLoss), p, C.green, 3), dot];
    chart.push(...additions);
    return additions.map(o => new M.Create(o, { runTime: 0.36 }));
  }

  function trainingState(next) {
    const oldLoss = loss(weights);
    weights = next;
    const y = P ? -0.2 : -0.98;
    const nextStats = [at(`Step ${step}  ·  Predictions ${guess(weights[0], 0)}, ${guess(weights[1], 1)}`,
      CX, y, P ? 20 : 19, C.amber)];
    const nextLabels = train.edgeLabels(weights.map(display), C.cyan);
    const animations = [
      ...fades([...stats, ...trainingLabels]),
      ...enter([...nextStats, ...nextLabels]),
      ...train.weights(weights),
      ...plotStep(oldLoss, loss(weights))
    ];
    stats = nextStats;
    trainingLabels = nextLabels;
    return animations;
  }

  await until(S(36)); await play(
    ...fades([grid, measure10, cap5, arrow, reverse]),
    ...enter([...train.cards, plotAxes]), new M.FadeIn(train.N.group),
    ...trainingState(initialWeights), ...say('THE WEIGHTS GIVE 7 ITS POINTS', C.amber),
    ...fbox(['weights = (6, 8)', ['card 0: 7 gets 6 points', C.amber], ['card 1: 7 gets 8 points', C.amber]])
  );
  await until(S(37)); await play(
    ...say('7 BEATS 5 POINTS: LOSS 50', C.amber),
    ...fbox(['correct digit: 5 points', '7 wins on both cards', ['loss = ½ × (36 + 64) = 50', C.amber]], C.amber)
  );
  await until(S(38)); await play(
    ...train.backward(), ...say('LEARNING RATE = 0.5', C.amber),
    ...fbox(['learning rate = 0.5', 'clipped arrow = (3, 4)', ['change = −0.5 × (3, 4)', OR]], OR)
  );
  await until(S(39)); await play(...fbox([['changes = (−1.5, −2)', OR]], OR), ...say('DROP BY 1.5 AND 2', OR));
  await until(S(40));
  step = 1;
  await play(
    ...trainingState([4.5, 6]), ...train.N.flow(0, C.cyan), ...say('CARD 0 IS NOW READ AS 0', C.green),
    ...fbox(['weights = (4.5, 6)', ['predictions: 0, 7', C.green], ['loss ≈ 28', C.amber]])
  );
  await until(S(41)); await play(...train.backward(), ...say('SAME CLIPPED ARROW', C.amber));
  step = 2;
  await play(
    ...trainingState([3, 4]), ...train.N.flow(0, C.cyan),
    ...fbox(['weights = (3, 4)', ['predictions: 0, 1', C.green]], C.green)
  );
  await until(S(42)); await play(...say('BOTH CORRECT, BUT 7 STILL HAS POINTS', C.amber),
    ...fbox(['both correct, but 7', 'still gets 3 and 4 points', ['loss = 12.5', C.amber]], C.amber));
  await until(S(42) + 4);
  for (step = 3; step <= maxStep; step++) {
    await play(...trainingState(weights.map(w => w * 0.5)),
      ...fbox([`weights = ${pair(weights)}`, [`loss = ${display(loss(weights))}`, C.green]]),
      ...(step === 3 ? say('LOSS FALLS TOWARD ZERO', C.green) : []));
  }

  const component = vector(5, 5, C.pink);
  const fair = vector(3, 4, C.green);
  const comparison = [
    line(xy(0, 0), xy(5, 0), C.pink),
    line(xy(5, 0), xy(5, 5), C.pink),
    at('5', ...xy(5, -0.7).slice(0, 2), 18, C.pink),
    at('5', ...xy(5.8, 5).slice(0, 2), 18, C.pink)
  ];
  await until(S(43));
  await play(
    ...fades([train.N.group, ...train.cards, ...stats, ...trainingLabels, plotAxes, ...chart]),
    ...enter([grid, cap5, measure10, ...comparison]), new M.Create(component),
    ...say('CAP EACH GRADIENT ON ITS OWN?', C.pink), ...fbox([['Separate caps → (5, 5)', C.pink]], C.pink)
  );
  await until(S(44)); await play(
    new M.Create(fair), ...say('DIFFERENT DIRECTION, PAST THE CAP', C.pink),
    ...fbox([['(5, 5) is longer than 5', C.pink], ['(3, 4) meets the cap', C.green]])
  );

  const demoCap4 = capCircle(4);
  const demoCap11 = capCircle(11);
  // Fit the larger cap and the arrow into the same camera space.
  const demoU = P ? 0.28 : 0.16;
  const demoXY = (x, y) => [CX + x * demoU, (P ? -1.05 : -0.65) + y * demoU, 0];
  const demoArrow = (x, y, color) => new M.Arrow({
    start: demoXY(0, 0), end: demoXY(x, y), color, strokeWidth: 4, buff: 0, tipLength: 0.15
  });
  const demoGrid = new M.VGroup(
    ...Array.from({ length: 23 }, (_, i) =>
      line(demoXY(i - 11, -11), demoXY(i - 11, 11), i === 11 ? C.muted : C.line, 1)),
    ...Array.from({ length: 23 }, (_, i) =>
      line(demoXY(-11, i - 11), demoXY(11, i - 11), i === 11 ? C.muted : C.line, 1))
  );
  const demoCircle = radius => new M.Circle({ radius: radius * demoU, color: C.amber, strokeWidth: 2 })
    .moveTo(demoXY(0, 0));
  const demoRing = demoCircle(4);
  const demoOriginal = new M.DashedLine({ start: demoXY(0, 0), end: demoXY(6, 8), color: C.cyan });
  const demoClipped = demoArrow(2.4, 3.2, C.green);

  await until(S(45)); await play(
    ...fades([grid, cap5, measure10, component, fair, ...comparison]),
    ...enter([demoGrid, demoOriginal, demoRing, demoClipped]),
    ...say('TRY IT: DRAG THE ARROW OR MOVE THE CAP'),
    ...fbox(['Length = 10', ['Cap 4 → length 4', C.amber]])
  );
  await until(S(46)); await play(
    new M.Transform(demoRing, demoCircle(5)), new M.Transform(demoClipped, demoArrow(3, 4, C.green)),
    ...say('MAKE THE SHORTER ARROW LENGTH 5', C.green), ...fbox(['Length = 10', ['Cap 5 → length 5', C.green]])
  );
  await until(S(47)); await play(
    new M.Transform(demoRing, demoCircle(11)), new M.Transform(demoClipped, demoArrow(6, 8, C.green)),
    ...say('KEEP THE FULL LENGTH', C.green), ...fbox(['Length = 10', ['Cap 11 → length 10', C.green]])
  );
  const prediction = new M.VGroup(
    card(CX - 1.4, -0.40, 0), card(CX + 1.4, -0.40, 1),
    at('?', CX - 1.4, -1.32, 24, C.amber), at('?', CX + 1.4, -1.32, 24, C.amber)
  );
  await until(S(48)); await play(
    ...fades([demoGrid, demoOriginal, demoRing, demoClipped]), ...enter([prediction]),
    ...say('RESET: PREDICT THE TWO DIGITS', C.amber), ...fbox(['Cap = 5', 'Digits after two steps = ?'])
  );
  const afterTwo = at('After 2 steps:   0, 1', CX, -0.75, 23, C.green);
  const fresh = demoArrow(8, 4, C.cyan);
  await until(S(49)); await play(...fades([prediction]), ...enter([afterTwo]), ...say('PRESS STEP TWICE', C.green));
  await until(S(49) + 2.15); await play(...fades([afterTwo]), ...enter([demoGrid, fresh]),
    ...say('NEW DATA: TRY A FRESH ARROW'), ...clearBox());
  await until(S(50)); await play(
    ...fades([fresh]), ...enter([demoOriginal, demoCircle(5), demoArrow(3, 4, C.green)]),
    ...say('SHORTEN ABOVE THE CAP. KEEP THE DIRECTION.', C.green),
    ...fbox(['Original (6, 8), length 10', ['Clipped  (3, 4), length 5', C.green]])
  );
}
