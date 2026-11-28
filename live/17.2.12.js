// Learning-rate schedules. Beat i follows sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 4.05, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.4, 0] : [4.3, -0.3, 0];
  const orange = '#fb923c';
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const point = (x, y) => [x, y, 0];
  const text = (s, x, y, color = C.ink, size = 19) =>
    T(String(s), size, color, true).moveTo(point(x, y));
  const rect = (x, y, width, height, color, fill = C.card) => {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.12, color, strokeWidth: 2 });
    r.setFill(fill, 0.96);
    r.moveTo(point(x, y));
    return r;
  };
  const line = (x1, y1, x2, y2, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start: point(x1, y1), end: point(x2, y2), color, strokeWidth });
  const arrow = (x1, y1, x2, y2, color = C.amber) =>
    new M.Arrow({ start: point(x1, y1), end: point(x2, y2), color, strokeWidth: 4, buff: 0 });
  const dot = (x, y, color, radius = 0.07) =>
    new M.Dot({ radius, color }).moveTo(point(x, y));
  const appear = (...objects) => objects.map(o => new M.FadeIn(o));
  const leave = (...objects) => objects.map(o => new M.FadeOut(o));
  const create = (...objects) => objects.map(o => new M.Create(o));

  let boxNow;
  function fbox(lines, color = C.cyan) {
    const lh = P ? 0.41 : 0.42;
    const rows = lines.map(row => Array.isArray(row) ? row : [row, C.ink]);
    const labels = rows.map(([s, col]) => T(s, P ? 21 : 20, col, true));
    const width = Math.max(...labels.map(label => label.getWidth())) + 0.65;
    const height = rows.length * lh + 0.32;
    const [x, y] = BOXP;
    labels.forEach((label, i) => label.moveTo(point(
      x - width / 2 + 0.325 + label.getWidth() / 2, y + ((rows.length - 1) / 2 - i) * lh
    )));
    const box = new M.VGroup(rect(x, y, width, height, color), ...labels);
    const maxWidth = P ? FW - 1.0 : 4.5;
    if (width > maxWidth) box.scale(maxWidth / width);
    const animations = boxNow ? [...leave(boxNow), ...appear(box)] : appear(box);
    boxNow = box;
    return animations;
  }

  const cy = P ? -0.1 : -0.35;
  function card(x, y, back = false) {
    const panel = rect(x, y, 1.24, 1.44, back ? C.green : C.cyan, '#18233e');
    if (back) return new M.VGroup(panel, text('ANSWER', x, y + 0.4, C.green, 14),
      text('7', x, y - 0.13, C.ink, 34));
    const ink = [
      line(x - 0.28, y + 0.12, x + 0.24, y + 0.18, C.ink, 5),
      line(x + 0.24, y + 0.18, x - 0.11, y - 0.36, C.ink, 5),
      line(x - 0.17, y - 0.09, x + 0.14, y - 0.07, C.ink, 4),
    ];
    return new M.VGroup(panel, text('LABEL', x, y + 0.46, C.cyan, 14), ...ink);
  }

  const parcel = new M.VGroup(
    rect(CX, cy, 2.85, 1.9, C.amber, '#3a2d28'),
    rect(CX - 0.75, cy, 0.34, 1.86, C.amber, '#654832'),
    card(CX + 0.33, cy)
  );
  const guess = text('Prediction  1  →  7', CX, cy - 1.25, C.green, 23);
  const question = new M.VGroup(
    arrow(CX - 2.7, cy - 0.16, CX - 1.48, cy - 0.16, C.cyan),
    arrow(CX + 1.16, cy - 0.16, CX + 1.77, cy - 0.16),
    text('Same size?', CX - 2.1, cy - 0.68, C.cyan, 17),
    text('Smaller?', CX + 1.49, cy - 0.68, C.amber, 17)
  );
  const leftCard = card(CX - 0.83, cy);
  const backCard = card(CX + 0.83, cy, true);
  const digits = text('0 1 2 3 4 5 6 7 8 9', CX, cy - 1.12, C.muted);

  await until(S(0)); await play(...appear(parcel), ...say('READING PARCEL LABELS'), ...fbox(['goal: read each digit', ['0 to 9', C.amber]]));
  await until(S(1)); await play(...appear(guess), ...say('PREDICTIONS IMPROVE STEP BY STEP', C.green));
  await until(S(2)); await play(...create(question), ...say('HOW BIG SHOULD A STEP BE?', C.amber));
  await until(S(3)); await play(...leave(parcel, guess, question), ...appear(leftCard, backCard, digits),
    ...say('PICTURE ON FRONT • ANSWER ON BACK'));

  const parkX = CX + 2.35;
  const park = new M.VGroup(
    line(parkX - 0.85, cy + 0.58, parkX + 0.83, cy + 0.58, C.ink),
    line(parkX - 0.85, cy - 0.58, parkX + 0.83, cy - 0.58, C.ink),
    line(parkX + 0.83, cy - 0.58, parkX + 0.83, cy + 0.58, C.ink),
    text('P', parkX + 0.2, cy, C.muted, 26)
  );
  const carAt = x => new M.VGroup(
    rect(x, cy, 1.25, 0.76, C.cyan, '#16546b'),
    rect(x + 0.2, cy, 0.31, 0.51, C.cyan, '#294564'),
    ...[-0.35, 0.35].flatMap(dx => [-0.39, 0.39].map(dy =>
      line(x + dx - 0.11, cy + dy, x + dx + 0.11, cy + dy, C.ink, 4)))
  );
  const car = carAt(CX - 2.4);
  const longDrive = arrow(CX - 2.4, cy - 0.94, CX + 1.37, cy - 0.94, C.cyan);
  const shortDrive = arrow(CX + 1.37, cy - 0.94, parkX, cy - 0.94);
  const farNear = new M.VGroup(text('FAR', CX - 0.5, cy - 1.31, C.cyan),
    text('CLOSE', CX + 1.85, cy - 1.31, C.amber));

  await until(S(4)); await play(...leave(leftCard, backCard, digits), ...create(park), ...appear(car),
    ...say('PARK INSIDE THE LINES'), ...fbox(['far away: drive faster', ['close by: move slowly', C.amber]], C.amber));
  await until(S(5));
  await play(new M.Transform(car, carAt(CX + 1.37), { runTime: 0.8 }), ...create(longDrive),
    ...say('FAR AWAY: MOVE FAST'));
  await play(new M.Transform(car, carAt(parkX), { runTime: 1.75 }), ...create(shortDrive),
    ...say('CLOSE BY: MOVE SLOWLY', C.amber));
  await until(S(6)); await play(...appear(farNear), ...say('BIG STEPS EARLY • SMALL STEPS LATER', C.green));

  const nx = P ? 0.95 : -1.9;
  const ny = P ? 1.35 : -0.45;
  const N = net({ layers: [2, 2, 10], center: point(nx, ny), width: P ? 4.6 : 4.7,
    height: P ? 3.9 : 2.88, r: P ? 0.18 : 0.14 });
  const trainingCard = card(P ? -2.85 : -5.25, ny);
  const headings = ['Input', 'Hidden', 'Outputs'].map((name, l) =>
    text(name, N.pos(l, 0)[0], P ? -0.95 : 1.29, C.ink, 16));
  const digitLabels = Array.from({ length: 10 }, (_, i) =>
    text(i, N.pos(2, i)[0] + 0.45, N.pos(2, i)[1], C.amber, 16));
  const values = new Map();
  function value(l, i, v, color = C.ink) {
    const animations = N.value(l, i, v, color);
    values.set(`${l}:${i}`, animations[0].mobject);
    return animations;
  }
  // Display weights on a scale of two so the helper's stroke cap does not hide the worked changes.
  const weight = (l, i, j, w) => N.weight(l, i, j, w / 2);
  const positive = [[0, 0, 0, 2], [0, 1, 1, 0.7], [1, 0, 1, 1.1], [1, 1, 7, 1.5]];
  const negative = [[0, 0, 1, -0.6], [0, 1, 0, -1.1], [1, 1, 1, -1.35], [1, 0, 7, -0.5]];
  const aTag = text('A', (N.pos(0, 0)[0] + N.pos(1, 0)[0]) / 2, (N.pos(0, 0)[1] + N.pos(1, 0)[1]) / 2 + 0.3, C.cyan, 18);
  const [ax, ay] = N.pos(0, 0);
  const [hx, hy] = N.pos(1, 0);

  await until(S(7)); await play(...leave(park, car, longDrive, shortDrive, farNear),
    ...appear(trainingCard, N.group), ...say('OUR NETWORK AGAIN'), ...fbox(['the same network', ['as before', C.cyan]]));
  await until(S(8)); await play(...appear(...headings, ...digitLabels),
    ...value(0, 0, 1), ...value(0, 1, 0), ...value(1, 0, 2), ...value(1, 1, 1),
    ...[1, 6, 0, 1, 0, 1, 0, 2, 0, 1].flatMap((v, i) => value(2, i, v)),
    ...say('INPUT • HIDDEN • TEN OUTPUTS'));
  await until(S(9)); await play(...positive.flatMap(w => weight(...w)),
    ...say('EACH CONNECTION HAS A WEIGHT'));
  await until(S(10)); await play(...negative.flatMap(w => weight(...w)),
    ...say('CYAN +   •   PINK −'), ...fbox([['cyan = positive weight', C.cyan], ['pink = negative weight', C.pink]]));
  await until(S(11));
  await play(...N.flow(0, C.cyan), ...say('NUMBERS FLOW LEFT TO RIGHT'));
  await play(...N.flow(1, C.cyan), ...fbox(['Prediction 1', 'Answer     7', ['Loss is high', C.pink]]));

  // Move orange dots from the output toward the input along existing connections.
  const [ox, oy] = N.pos(2, 7);
  const reverseDot = dot(ox - 0.16, oy, orange, 0.105);
  const reverseToHidden = dot(hx + 0.16, hy, orange, 0.105);
  const reverseFromHidden = dot(hx - 0.16, hy, orange, 0.105);
  await until(S(12));
  await play(...appear(reverseDot), ...say('GRADIENTS FLOW BACK', orange));
  await play(new M.Transform(reverseDot, reverseToHidden, { runTime: 0.65 }));
  await play(...leave(reverseDot), ...appear(reverseFromHidden));
  await play(new M.Transform(reverseFromHidden, dot(ax + 0.16, ay, orange, 0.105), { runTime: 0.65 }),
    ...fbox([['Gradients', orange], 'one per weight'], orange));
  await play(...leave(reverseFromHidden));

  const slopeX = P ? 0 : -2.63;
  const slopeY = P ? -2.6 : -2.13;
  const rising = new M.VGroup(
    line(slopeX - 1.67, slopeY - 0.13, slopeX + 1.67, slopeY - 0.13),
    line(slopeX - 1.46, slopeY + 0.05, slopeX + 1.44, slopeY + 0.79, orange, 4),
    text('weight', slopeX + 1.29, slopeY - 0.4, C.muted, 16),
    text('loss', slopeX + 1.52, slopeY + 0.98, orange, 16)
  );
  const downhill = arrow(slopeX + 0.48, slopeY + 0.55, slopeX - 0.83, slopeY + 0.21, C.green);
  const scaledArrows = new M.VGroup(
    arrow(slopeX - 1.48, slopeY + 0.43, slopeX - 0.89, slopeY + 0.43, C.cyan),
    arrow(slopeX + 0.27, slopeY + 0.43, slopeX + 1.46, slopeY + 0.43, C.amber),
    text('small gradient', slopeX - 1.19, slopeY + 0.08, C.cyan, 16),
    text('big gradient', slopeX + 0.87, slopeY + 0.08, C.amber, 16)
  );
  await until(S(13)); await play(...appear(rising), ...create(downhill),
    ...say('GRADIENT + → LOWER THE WEIGHT', orange),
    ...fbox(['More weight → more loss', ['Subtract to go downhill', C.green]], orange));
  await until(S(14)); await play(...leave(rising, downhill), ...appear(scaledArrows),
    ...say('CHANGE = RATE × GRADIENT', C.amber), ...fbox(['change = learning rate', ['× gradient', C.amber]], C.amber));
  await until(S(15)); await play(...say('LEARNING-RATE SCHEDULE'),
    ...fbox(['a plan that changes', ['the learning rate', C.cyan]]));
  await until(S(16)); await play(...leave(scaledArrows), ...appear(aTag),
    new M.Indicate(N.edges[0][0][0], { color: C.cyan }), ...say('FOLLOW WEIGHT A'),
    ...fbox([['Weight A = 2', C.cyan], ['Loss is high', C.pink]]));

  const workY = P ? -2.25 : -2.8;
  const workX = i => CX + (i - 1.5) * (P ? 1.72 : 1.65);
  const cells = Array.from({ length: 4 }, (_, i) => new M.VGroup(
    rect(workX(i), workY, P ? 1.6 : 1.57, 1.22, C.muted),
    text(`Step ${i + 1}`, workX(i), workY + 0.38, C.ink, 16)
  ));
  const worked = [
    { old: '2', size: '0.4', next: '1.6', weight: 1.6, rate: '0.2' },
    { old: '1.6', size: '0.4', next: '1.2', weight: 1.2, rate: '0.2' },
    { old: '1.2', size: '0.2', next: '1.0', weight: 1, rate: '0.1' },
    { old: '1.0', size: '0.2', next: '0.8', weight: 0.8, rate: '0.1' },
  ];
  const stepArrows = worked.map(({ size }, i) => {
    const length = size === '0.4' ? 1.11 : 0.555;
    return arrow(workX(i) + length / 2, workY - 0.04, workX(i) - length / 2, workY - 0.04,
      i < 2 ? C.cyan : C.green);
  });
  const results = worked.map(({ next }, i) => text(next, workX(i), workY - 0.37,
    i < 2 ? C.cyan : C.green, 17));
  const stepMath = i => {
    const { old, size, next, rate } = worked[i];
    return [`${rate} × 2 = ${size}`, [`${old} − ${size} = ${next}`, i < 2 ? C.cyan : C.green]];
  };
  function markStep(i, loss, scores) {
    const col = i < 2 ? C.cyan : C.green;
    return [...create(stepArrows[i]), ...appear(results[i]), ...weight(0, 0, 0, worked[i].weight),
      ...value(2, 1, scores[0]), ...value(2, 7, scores[1], C.green),
      ...fbox([...stepMath(i), [loss, col]], col)];
  }
  await until(S(17)); await play(new M.LaggedStart(cells.map(cell => new M.FadeIn(cell)),
    { lagRatio: 0.16, runTime: 1.2 }), ...say('HOLD THE GRADIENT AT 2', orange),
    ...fbox(['Weight A = 2', ['Fixed gradient = 2', orange]], orange));
  await until(S(18)); await play(...say('START WITH RATE 0.2'),
    ...fbox(['Weight A = 2', 'Fixed gradient = 2', ['Learning rate = 0.2', C.cyan]]));
  await until(S(19)); await play(new M.Indicate(cells[0], { color: C.cyan }), ...say('STEP 1: RATE × GRADIENT'),
    ...fbox(['Rate × gradient', ['0.2 × 2 = 0.4', C.cyan]]));
  await until(S(20)); await play(...say('STEP 1: SUBTRACT 0.4'), ...fbox(stepMath(0)));
  await until(S(21)); await play(...markStep(0, 'Loss falls', [5, 3]), ...say('STEP 1: LONG ARROW'));
  await until(S(22)); await play(new M.Indicate(cells[1], { color: C.cyan }), ...say('STEP 2: SAME RATE'),
    ...fbox(stepMath(1)));
  await until(S(23)); await play(...markStep(1, 'Prediction improves', [4, 5]), ...say('STEP 2: ANOTHER LONG ARROW'));
  await until(S(24)); await play(...say('CUT THE RATE IN HALF', C.green),
    ...fbox(['Early rate  0.2', ['Late rate   0.1', C.green]], C.green));

  const sx = P ? 0 : 4.3;
  const sy = P ? -3.65 : -1.91;
  const stairs = new M.VGroup(
    line(sx - 1.35, sy + 0.36, sx, sy + 0.36, C.cyan, 4),
    line(sx, sy + 0.36, sx, sy - 0.08, C.green, 4),
    line(sx, sy - 0.08, sx + 1.35, sy - 0.08, C.green, 4),
    text('0.2', sx - 0.73, sy + 0.59, C.cyan, 16),
    text('0.1', sx + 0.78, sy + 0.17, C.green, 16),
    text('1        2       3        4', sx, sy - 0.44, C.muted, 15)
  );
  await until(S(25)); await play(...appear(stairs), ...say('STEP SCHEDULE: ONE RATE DROP', C.green));
  await until(S(26)); await play(new M.Indicate(cells[2], { color: C.green }), ...say('STEP 3: FIND THE SMALLER SIZE', C.green),
    ...fbox(['Rate × gradient', ['0.1 × 2 = 0.2', C.green]], C.green));
  await until(S(27)); await play(...markStep(2, 'Smaller loss drop', [3, 6]), ...say('STEP 3: SHORTER ARROW', C.green));
  await until(S(28)); await play(...markStep(3, 'Weight A is now 0.8', [2, 7]), ...say('STEP 4: ANOTHER SHORT ARROW', C.green));
  await until(S(29)); await play(...say('LATE STEPS ARE HALF AS LONG', C.green),
    ...fbox([['Two steps of 0.4', C.cyan], ['Two steps of 0.2', C.green]], C.green),
    new M.LaggedStart(stepArrows.map(a => new M.Indicate(a, { color: C.ink })),
      { lagRatio: 0.17, runTime: 1.5 }));

  // A separate, illustrative loss curve has a steep rounded bottom and gentler sides.
  // Its slope changes sign across the best weight and is capped on the outer sides.
  const best = -0.25, curvature = 11.5, cap = 4, limit = cap / curvature, count = 12;
  const slope = w => Math.max(-cap, Math.min(cap, curvature * (w - best)));
  const loss = w => {
    const d = Math.abs(w - best);
    return d <= limit ? curvature * d * d / 2 : cap * (d - limit / 2);
  };
  function trace(dropAfter) {
    const points = [{ w: 2, loss: loss(2) }];
    for (let i = 0; i < count; i++) {
      const old = points[i].w;
      const w = old - (i < dropAfter ? 0.2 : 0.1) * slope(old);
      points.push({ w, loss: loss(w) });
    }
    return points;
  }
  const scheduled = trace(5);
  const x0 = CX - 2.72, x1 = CX + 3.06;
  const y0 = P ? -2.0 : -1.49, y1 = P ? 2.6 : 0.94;
  const gx = i => x0 + (x1 - x0) * i / count;
  const gy = v => y0 + (y1 - y0) * Math.sqrt(Math.max(0, v) / 9);  // square-root scale so the small bounce near the bottom is visible
  const axes = new M.VGroup(
    line(x0, y0, x1, y0), line(x0, y0, x0, y1),
    text('Loss', x0, y1 + 0.33, C.ink, 18),
    text('training step', x1 - 0.8, y0 - 0.55, C.muted, 16),
    ...[0, 3, 6, 9, 12].flatMap(i => [
      line(gx(i), y0, gx(i), y0 - 0.08),
      text(i, gx(i), y0 - 0.25, C.muted, 16)
    ]),
    ...[0, 1, 4, 9].flatMap(v => [
      line(x0 - 0.07, gy(v), v === 0 ? x0 : x1, gy(v), C.line),
      text(v, x0 - 0.25, gy(v), C.muted, 16)
    ])
  );
  const trackY = P ? -3.45 : -3.3;
  const tx = residual => CX + residual * 6.1;
  const track = new M.VGroup(
    line(tx(-0.36), trackY, tx(0.36), trackY),
    line(tx(0), trackY - 0.1, tx(0), trackY + 0.13, C.green),
    text('best weight', tx(0), trackY - 0.32, C.green, P ? 18 : 17),
    text('weight A near the best weight', tx(0), trackY + 0.33, C.ink, P ? 18 : 17)
  );
  function tracePoint(data, i, color) {
    const y = gy(data[i].loss);
    const marker = dot(gx(i), y, color, 0.052);
    return i === 0 ? marker : new M.VGroup(
      line(gx(i - 1), gy(data[i - 1].loss), gx(i), y, color, 3), marker
    );
  }
  const drawn = scheduled.map((_, i) => tracePoint(scheduled, i, i > 5 ? C.green : C.cyan));
  const start = i => new M.FadeIn(drawn[i]);
  const walk = (a, b, runTime) => new M.LaggedStart(
    drawn.slice(a, b + 1).map(obj => new M.FadeIn(obj)), { lagRatio: 0.64, runTime }
  );

  await until(S(30)); await play(...leave(N.group, trainingCard, ...headings, ...digitLabels, ...values.values(),
    aTag, ...cells, ...stepArrows, ...results, stairs), ...appear(axes, drawn[0]),
    ...say('LET THE GRADIENT CHANGE'), ...fbox(['Gradient changes each step', ['Loss starts high', C.pink]]));
  await play(start(1));
  await until(S(31)); await play(start(2), ...say('BIG EARLY STEPS LOWER LOSS FAST'),
    ...fbox([['Early rate = 0.2', C.cyan], 'Loss drops quickly']));
  const a3 = arrow(tx(0.36), trackY, tx(scheduled[3].w - best), trackY, C.amber);
  const a4 = arrow(tx(scheduled[3].w - best), trackY, tx(scheduled[4].w - best), trackY, orange);
  const a5 = arrow(tx(scheduled[4].w - best), trackY, tx(scheduled[5].w - best), trackY, orange);
  await until(S(32)); await play(start(3), ...appear(track), ...create(a3),
    ...say('A BIG STEP JUMPS PAST THE BEST WEIGHT', C.amber),
    ...fbox(['A crosses the best weight', ['Loss is near its low', C.amber]], C.amber));
  await until(S(33)); await play(start(4), ...leave(a3), ...create(a4), ...say('THE GRADIENT CHANGES SIGN', orange),
    ...fbox([['The update goes back', orange], 'Loss bounces upward'], orange));
  await play(start(5), ...leave(a4), ...create(a5));
  const a6 = arrow(tx(scheduled[5].w - best), trackY, tx(scheduled[6].w - best), trackY, C.green);
  const settled = dot(tx(0), trackY, C.green, 0.09);
  await until(S(34)); await play(start(6), ...leave(a5), ...create(a6),
    ...say('SMALLER STEPS SETTLE SMOOTHLY', C.green),
    ...fbox([['Late rate = 0.1', C.green], 'Loss settles near zero'], C.green));
  await play(walk(7, count, 1.55), ...leave(a6), ...appear(settled));

  await until(S(35)); await play(...say('FIRST, MULTIPLY', C.amber),
    ...fbox(['Current rate × gradient', ['= the change', C.amber]], C.amber));
  await until(S(36)); await play(...say('THEN, SUBTRACT', C.green),
    ...fbox([['New weight = old weight', C.green], '  − (current rate × gradient)'], C.green));
  await until(S(37)); await play(...say('CURRENT = AT THIS STEP'),
    ...fbox(['New weight = old weight', '  − (current rate × gradient)', ['0.2 early • 0.1 later', C.cyan]]));
  await until(S(38)); await play(...leave(track, settled), ...say('USE A SCHEDULE OVER MANY STEPS'),
    ...fbox(['Take larger steps first', 'Take smaller steps later']));

  const early = trace(1).map((_, i, data) => tracePoint(data, i, C.amber));
  const late = trace(count).map((_, i, data) => tracePoint(data, i, C.pink));
  const reveal = objects => new M.LaggedStart(
    objects.slice(1).map(obj => new M.FadeIn(obj)), { lagRatio: 0.16, runTime: 1.45 }
  );
  await until(S(39)); await play(...say('TWO TRAPS', C.amber),
    ...fbox([['Drop too early', C.amber], ['Drop too late', C.pink]], C.amber));
  await until(S(40)); await play(reveal(early), ...say('TOO EARLY: SMALL STEPS FAR AWAY', C.amber),
    ...fbox([['Rate drops after step 1', C.amber], 'Loss falls more slowly'], C.amber));
  await until(S(41)); await play(...leave(...early.slice(1)), reveal(late),
    ...say('TOO LATE: BIG STEPS KEEP BOUNCING', C.pink),
    ...fbox([['Rate stays at 0.2', C.pink], 'Loss rises near the bottom'], C.pink));
  const cutoff = new M.DashedLine({
    start: point(gx(5), y0 + 0.07), end: point(gx(5), y1),
    color: C.green, strokeWidth: 2
  });
  const dropLabel = text('Rate drops', gx(5), y1 + 0.32, C.green, 17);
  await until(S(42)); await play(...leave(...late.slice(1)), ...create(cutoff), ...appear(dropLabel),
    ...say('DROP THE RATE WHEN LOSS STOPS FALLING FAST', C.green),
    ...fbox(['Watch the loss curve', ['Start fast, then slow down', C.green]], C.green));
  await until(S(43)); await play(...say('BIG STEPS EARLY • SMALL STEPS LATER', C.green),
    ...fbox([['0.2 early: loss falls fast', C.cyan], ['0.1 later: loss settles', C.green]], C.green));
}
