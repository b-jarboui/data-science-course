// 20.1.9 Data parallelism. Beat i = sentence i in lesson.json (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  // Laptop: two devices left (token block above each), formula box and loss chart right.
  // Phone: token blocks on top, the two devices below them, box and chart in the lower part.
  const CX = P ? 0 : -2.4;
  const PILL = P ? [0, 2.6, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -3.85, 0] : [4.3, 0.6, 0];
  const X = P ? [-1.95, 1.95] : [CX - 1.95, CX + 1.95];
  const CHIP_Y = P ? -1.35 : -1.75;
  const CHIP_W = P ? 3.75 : 3.7;
  const CHIP_H = P ? 2.8 : 2.3;
  const NET_Y = CHIP_Y + 0.05;
  const GRAD = '#fb923c';
  const NEWS = [
    ['Library', 'opens', 'at', 'nine', '<end>'],
    ['Pool', 'closed', 'today', '<end>'],
    ['Exams', 'start', '<end>'],
  ];
  const pt = (x, y) => [x, y, 0];
  const text = (s, x, y, size = 18, color = C.ink, maxWidth = Infinity) => {
    const t = T(s, size, color, true);
    t._k = 1;
    if (t.getWidth() > maxWidth) { t._k = maxWidth / t.getWidth(); t.scale(t._k); }
    t.moveTo(pt(x, y));
    return t;
  };
  const card = (x, y, width, height, color, fill = C.card, opacity = 0.94) => {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.11, color, strokeWidth: 2 });
    r.setFill(fill, opacity);
    r.moveTo(pt(x, y));
    return r;
  };
  const line = (x1, y1, x2, y2, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start: pt(x1, y1), end: pt(x2, y2), color, strokeWidth });
  const dot = (point, color, radius = 0.07) => new M.Dot({ point, color, radius });
  const fade = m => new M.FadeIn(m, { runTime: 0.44 });
  const out = m => new M.FadeOut(m, { runTime: 0.4 });
  const mark = (m, color = C.amber) => new M.Indicate(m, { color, runTime: 0.85 });
  const say = (s, color = C.cyan) => showA(s, color, PILL, P ? 19 : 18);

  let boxNow;
  function fbox(rows, color = C.cyan) {
    const lh = P ? 0.38 : 0.4, maxw = P ? FW - 0.9 : 4.45;
    const labels = rows.map(row => {
      const [s, c] = Array.isArray(row) ? row : [row, C.ink];
      return text(s, 0, 0, P ? 20 : 18, c, maxw - 0.48);
    });
    const tw = t => t.getWidth() * t._k;
    const w = Math.max(...labels.map(tw)) + 0.48;
    const h = labels.length * lh + 0.26;
    const [x, y] = BOXP;
    labels.forEach((t, i) => t.moveTo(pt(x - w / 2 + 0.24 + tw(t) / 2, y + (labels.length - 1 - 2 * i) * lh / 2)));
    const next = new M.VGroup(card(x, y, w, h, color), ...labels);
    const a = boxNow ? [out(boxNow), fade(next)] : [fade(next)];
    boxNow = next;
    return a;
  }
  function clearBox() {
    const a = boxNow ? [out(boxNow)] : [];
    boxNow = null;
    return a;
  }

  function paper(x, y, color, k = 1) {
    return new M.VGroup(card(x, y, 0.66 * k, 0.79 * k, color),
      ...[0.17, 0, -0.17].map((dy, i) => line(x - 0.2 * k, y + dy * k, x + (i === 2 ? 0.07 : 0.2) * k, y + dy * k, color)));
  }
  function timeRows(y, withShare = false, x = 0) {
    const g = P ? 0.55 : 0.42;
    const labels = [
      text('1 chip', x - 2.06, y + g, 18),
      text('2 chips', x - 2.06, y - g, 18),
    ];
    const long = card(x + 0.55, y + g, 3.55, 0.36, C.cyan, C.cyan, 0.57);
    const short = card(x - 0.2, y - g, 2.05, 0.36, C.cyan, C.cyan, 0.57);
    const extra = withShare ? [
      card(x + 1.2, y - g, 0.68, 0.36, C.amber, C.amber, 0.7),
      text('sharing time', x + 1.2, y - g - 0.48, 17, C.amber),
    ] : [];
    return {
      first: new M.VGroup(labels[0], long),
      second: new M.VGroup(labels[1], short, ...extra),
    };
  }
  function parallelWork(y, xs) {
    return new M.VGroup(...xs.flatMap((x, i) => [
      text(`Device ${i + 1}`, x, y + 0.42, 18),
      card(x, y - 0.05, 1.9, 0.34, C.cyan, C.cyan, 0.58),
      text('one block', x, y - 0.52, 17, C.cyan),
    ]));
  }

  const orders = [[0, 1, 2], [1, 2, 0], [2, 0, 1], [0, 2, 1]];
  function tokens(x, order) {
    const cols = 4, dx = P ? 0.92 : 0.9, dy = P ? 0.52 : 0.42;
    const top = P ? 1.4 : 0.82;
    const cells = order.flatMap(i => NEWS[i]).flatMap((word, j) => {
      const px = x + (j % cols - (cols - 1) / 2) * dx;
      const py = top - Math.floor(j / cols) * dy;
      const color = word === '<end>' ? C.amber : C.cyan;
      const t = T(word, 15, color, false, true);
      if (t.getWidth() > dx - 0.1) t.scale((dx - 0.1) / t.getWidth());
      t.moveTo(pt(px, py));
      return [card(px, py, dx - 0.05, dy - 0.06, color, color, 0.11), t];
    });
    return new M.VGroup(...cells);
  }
  function blockLabel(x, name) {
    return text(name, x, P ? 1.95 : 1.28, P ? 17 : 17, C.ink, CHIP_W);
  }

  const nets = X.map(x => net({
    layers: [2, 2, 1], center: pt(x, NET_Y), width: P ? 2.6 : 2.6,
    height: P ? 1.1 : 0.85, r: P ? 0.25 : 0.24,
  }));
  const chips = X.map((x, i) => new M.VGroup(
    card(x, CHIP_Y, CHIP_W, CHIP_H, C.violet, C.card, 0.42),
    text(`Device ${i + 1}`, x, CHIP_Y + CHIP_H / 2 - 0.27, 18, C.violet),
    ...[-1, 1].flatMap(side => [-0.59, -0.29, 0.01, 0.31, 0.61].map(dy => {
      const start = x + side * CHIP_W / 2;
      return line(start, CHIP_Y + dy, start + side * 0.1, CHIP_Y + dy, C.violet);
    })),
  ));
  const edge = N => N.edges[0][0][0];
  const initialWeights = [[[0.5, -0.3], [0.2, 0.4]], [[0.3], [-0.2]]];
  const styleWeights = N => initialWeights.flatMap((layer, l) =>
    layer.flatMap((row, i) => row.flatMap((w, j) => N.weight(l, i, j, w))));
  const weightRows = [null, null], gradRows = [null, null];
  function replaceRow(rows, i, s, color, offset) {
    const next = text(s, X[i] + offset, CHIP_Y - CHIP_H / 2 + 0.3, P ? 17 : 18, color, CHIP_W * 0.48);
    const a = rows[i] ? [out(rows[i]), fade(next)] : [fade(next)];
    rows[i] = next;
    return a;
  }
  const setWeight = (i, w, color = C.cyan) => [
    ...nets[i].weight(0, 0, 0, w),
    ...replaceRow(weightRows, i, `w ${w.toFixed(2)}`, color, -CHIP_W * 0.23),
  ];
  const setBoth = w => X.flatMap((_, i) => setWeight(i, w));
  const showGrad = (i, s, color) => replaceRow(gradRows, i, s, color, CHIP_W * 0.23);
  function clearGrads() {
    return gradRows.flatMap((g, i) => {
      gradRows[i] = null;
      return g ? [out(g)] : [];
    });
  }
  // the followed weight: an amber line drawn over the first connection, with a small 'w' tag
  const followed = nets.map(N => {
    const a = N.pos(0, 0), b = N.pos(1, 0), r = P ? 0.25 : 0.24;
    const ln = new M.Line({ start: pt(a[0] + r, a[1]), end: pt(b[0] - r, b[1]), color: C.amber, strokeWidth: 5 });
    const tag = text('w', (a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 0.22, 17, C.amber);
    return new M.VGroup(ln, tag);
  });
  function reversePulses(layer) {
    const pulses = nets.flatMap(N => N.edges[layer].flatMap((row, i) => row.map((_, j) => {
      const from = N.pos(layer + 1, j), to = N.pos(layer, i);
      const dx = to[0] - from[0], dy = to[1] - from[1], length = Math.hypot(dx, dy);
      const r = P ? 0.25 : 0.24;
      const start = pt(from[0] + dx / length * r, from[1] + dy / length * r);
      const end = pt(to[0] - dx / length * r, to[1] - dy / length * r);
      return [dot(start, GRAD, 0.07), dot(end, GRAD, 0.07)];
    })));
    return [
      pulses.map(([d]) => new M.FadeIn(d, { runTime: 0.15 })),
      pulses.map(([d, target]) => new M.Transform(d, target, { runTime: 0.62 })),
      pulses.map(([d]) => new M.FadeOut(d, { runTime: 0.15 })),
    ];
  }

  const PK = P ? 2.0 : 1.5;
  const initialPapers = new M.VGroup(...Array.from({ length: 9 }, (_, i) =>
    paper((i % 3 - 1) * (P ? 2.4 : 1.42 * PK) + (Math.floor(i / 3) - 1) * (P ? 0.2 : 0.13 * PK),
      (P ? -1.2 : -0.5) + (Math.floor(i / 3) - 1) * (P ? 1.9 : 0.18), i < 6 ? C.muted : C.cyan, PK)));
  const intro = timeRows(P ? -1.6 : -0.5);
  let assigned = X.map((x, i) => tokens(x, orders[i]));
  const assignedCounts = X.map((x, i) => blockLabel(x, `Block ${i + 1} · 12 tokens`));
  const firstBlocks = assigned, firstCounts = assignedCounts;

  // The collection, the two blocks, and two complete replicas.
  await until(S(0)); await play(fade(initialPapers), ...say('THOUSANDS OF NEWSLETTERS'));
  await until(S(1)); await play(out(initialPapers), fade(intro.first), ...say('TRAINING ON ONE CHIP', C.amber));
  await until(S(2)); await play(fade(intro.second), ...say('CAN TWO CHIPS SHARE THE WORK?'));
  await until(S(3)); await play(out(intro.first), out(intro.second), ...firstBlocks.map(fade), ...say('TWO GROUPS OF TOKENS'));
  await until(S(4)); await play(...firstCounts.map(fade), ...say('12 TOKENS IN EACH BLOCK'));
  await until(S(5)); await play(...firstBlocks.map(b => mark(b, C.cyan)), ...say('BOTH BLOCKS TRAIN ONE MODEL'));
  await until(S(6)); await play(fade(nets[0].group), ...say('NEURONS IN LAYERS, JOINED BY WEIGHTS'));
  await until(S(7)); await play(...styleWeights(nets[0]), ...say('EACH LINE HAS A WEIGHT'));
  await until(S(8)); await play(mark(edge(nets[0])), ...say('TRAINING CHANGES THE WEIGHTS', C.amber));
  await until(S(9));
  await play(...styleWeights(nets[1]));
  await play(fade(nets[1].group), ...say('COPY THE WHOLE NETWORK'));
  await until(S(10)); await play(...chips.map(fade), ...say('ONE NETWORK ON EACH DEVICE', C.violet));
  await until(S(11)); await play(...nets.map(N => mark(N.group, C.violet)), ...say('EACH COPY IS A REPLICA', C.violet));
  await until(S(12));
  await play(...assigned.map(b => mark(b, C.cyan)), ...say('ONE TRAINING BLOCK PER DEVICE'));
  await until(S(13)); await play(...assigned.map(b => mark(b, C.cyan)), ...say('BOTH PROCESS TEXT AT ONCE'));

  const students = X.map((_, i) => {
    const x = BOXP[0] + (i === 0 ? -0.8 : 0.8), y = BOXP[1];
    const head = new M.Circle({ radius: 0.16, color: C.ink });
    head.setFill(C.ink, 1);
    head.moveTo(pt(x, y + 0.35));
    const body = new M.Arc({ radius: 0.26, startAngle: 0, angle: Math.PI, color: C.ink });
    body.setFill(C.ink, 1);
    body.moveTo(pt(x, y + 0.02));
    return new M.VGroup(head, body, paper(x, y - 0.48, i === 0 ? C.cyan : C.violet));
  });
  await until(S(14)); await play(...students.map(fade), ...say('TWO STUDENTS READ DIFFERENT NEWSLETTERS'));
  await until(S(15)); await play(...students.map(out), ...chips.map(chip => mark(chip, C.violet)), ...say('TWO DEVICES WORK TOGETHER'));
  await until(S(16)); await play(...say('DATA PARALLELISM', C.green));
  await until(S(17)); await play(...followed.map(fade), ...say('FOLLOW THE SAME WEIGHT', C.amber));
  await until(S(18)); await play(...setBoth(0.50), ...say('BOTH WEIGHTS START AT 0.50'));

  // Step 1. The pulses move forward together, then backward together.
  await until(S(19)); await play(...nets.flatMap(N => N.flow(0)), ...say('FORWARD: PREDICT TOKENS', C.amber));
  await play(...nets.flatMap(N => N.flow(1)));
  await until(S(20)); await play(...fbox(['Average prediction loss', ['3.0 bits', C.amber]]));
  await until(S(21)); await play(...nets.map(N => mark(edge(N))), ...say('HOW WOULD EACH LOSS CHANGE?'));
  await until(S(22)); await play(...say('THIS NUMBER IS A GRADIENT', C.amber));
  await until(S(23)); await play(...fbox([
    ['Positive → lower weight', C.cyan],
    ['Negative → higher weight', C.pink],
  ]));
  await until(S(24)); await play(...clearBox(), ...say('BACKWARD: GRADIENTS (ORANGE)', C.amber));
  for (const layer of [1, 0]) {
    for (const batch of reversePulses(layer)) await play(...batch);
  }
  await until(S(25)); await play(...showGrad(0, '+0.4', C.cyan), ...say('DEVICE 1 GRADIENT', C.cyan));
  await until(S(26)); await play(...showGrad(1, '−0.2', C.pink), ...say('DEVICE 2 GRADIENT', C.pink));
  await until(S(27)); await play(...fbox([
    ['Device 1: lower weight ↓', C.cyan],
    ['Device 2: higher weight ↑', C.pink],
  ]), ...say('OPPOSITE DIRECTIONS', C.amber));

  function shareGradients(a, b) {
    const [x, y] = BOXP;
    const values = [a, b].map((s, i) => {
      const source = gradRows[i].getCenter();
      const color = s.startsWith('−') ? C.pink : C.cyan;
      return [text(s, source[0], source[1], 18, color), text(s, x + (i ? 0.7 : -0.7), y, 20, color)];
    });
    return values;
  }
  await until(S(28));
  const messages = shareGradients('+0.4', '−0.2');
  await play(...clearBox(), ...say('SHARE BOTH GRADIENTS', C.violet), ...messages.map(([m]) => fade(m)));
  await play(...messages.map(([m, target], i) => new M.Transform(m, target, { pathArc: i ? -0.3 : 0.3, runTime: 0.95 })));
  await until(S(29)); await play(...messages.map(([m]) => out(m)), ...fbox(['Add the two gradients', ['+0.4 + (−0.2) = +0.2', C.amber]]));
  await until(S(30)); await play(...fbox(['Average gradient', ['+0.2 ÷ 2 = +0.1', C.amber]]));
  await until(S(31)); await play(...fbox([['Average gradient = +0.1', C.cyan], ['Learning rate = 0.5', C.amber]]));
  await until(S(32)); await play(...fbox(['Learning rate × average', ['0.5 × 0.1 = 0.05', C.amber]]));
  await until(S(33)); await play(...fbox(['Both devices subtract 0.05', ['0.50 − 0.05', C.amber]]), ...say('SAME UPDATE ON BOTH DEVICES'));
  await until(S(34)); await play(...setBoth(0.45), ...fbox(['0.50 − 0.05 = 0.45', ['Average loss = 2.8 bits', C.amber]]));

  // Step 2. Keep the replicas in view as new text and gradients arrive.
  const secondBlocks = X.map((x, i) => tokens(x, orders[i + 2]));
  const secondCounts = X.map((x, i) => blockLabel(x, `Block ${i + 3} · 12 tokens`));
  await until(S(35));
  await play(...assigned.map(out), ...assignedCounts.map(out), ...secondBlocks.map(fade), ...secondCounts.map(fade),
    ...clearGrads(), ...clearBox(), ...say('STEP 2: TWO NEW BLOCKS'));
  assigned = secondBlocks;
  await until(S(36)); await play(...showGrad(0, '+0.3', C.cyan), ...say('DEVICE 1 GRADIENT'));
  await until(S(37)); await play(...showGrad(1, '+0.1', C.cyan), ...say('DEVICE 2 GRADIENT'));
  await until(S(38)); await play(...fbox(['+0.3 + 0.1 = +0.4', ['+0.4 ÷ 2 = +0.2', C.amber]]), ...say('AVERAGE THE GRADIENTS'));
  await until(S(39)); await play(...fbox(['Learning rate × average', ['0.5 × 0.2 = 0.10', C.amber]]));
  await until(S(40)); await play(...fbox(['Both devices subtract 0.10', ['0.45 − 0.10', C.amber]]), ...say('SAME UPDATE AGAIN'));
  await until(S(41)); await play(...setBoth(0.35), ...fbox(['0.45 − 0.10 = 0.35', ['Average loss = 2.7 bits', C.amber]]));

  const chartBottom = P ? -6.45 : -3.2;
  const chartTop = P ? -4.75 : -0.85;
  const chartLeft = P ? -2.4 : 2.7;
  const chartRight = P ? 3.0 : 6.5;
  const losses = [3.0, 2.8, 2.7, 2.66, 2.64, 2.63];
  const chartX = i => chartLeft + 0.18 + i * (chartRight - chartLeft - 0.37) / 5;
  const chartY = v => chartBottom + 0.25 + (v - 2.6) / 0.4 * (chartTop - chartBottom - 0.58);
  const chart = new M.VGroup(
    line(chartLeft, chartBottom, chartRight, chartBottom),
    line(chartLeft, chartBottom, chartLeft, chartTop),
    text('Average loss (bits)', (chartLeft + chartRight) / 2, chartTop + 0.05, 16),
    text('Training step', (chartLeft + chartRight) / 2, chartBottom - 0.52, 16, C.muted),
    ...[2.6, 2.8, 3.0].map(v => text(v.toFixed(1), chartLeft - 0.4, chartY(v), 16, C.muted)),
    ...[0, 1, 2, 5].map(i => text(String(i), chartX(i), chartBottom - 0.22, 16, C.muted)),
  );
  const marks = losses.map((v, i) => {
    const d = dot(pt(chartX(i), chartY(v)), C.amber, 0.07);
    return i === 0 ? new M.VGroup(d) : new M.VGroup(
      line(chartX(i - 1), chartY(losses[i - 1]), chartX(i), chartY(v), C.amber, 3), d);
  });
  await until(S(42));
  await play(fade(chart), ...marks.slice(0, 3).map(fade), ...clearGrads(), ...say('MORE STEPS, MATCHING WEIGHTS'));
  for (const [i, w] of [0.28, 0.22, 0.17].entries()) {
    await play(...setBoth(w), fade(marks[i + 3]),
      ...fbox([`Step ${i + 3}`, ['Same weight on both devices', C.green]]));
  }

  // The rule, equal-sized groups, and the time saved.
  await until(S(43)); await play(...say('ONE RULE FOR EVERY UPDATE', C.green));
  await until(S(44)); await play(...fbox([
    'New weight = old weight',
    ['− learning rate ×', C.amber],
    ['  average gradient', C.amber],
  ], C.green));
  await until(S(45));
  await play(new M.LaggedStart(nets.map(N => mark(N.group, C.green)), { lagRatio: 0.15, runTime: 1.2 }),
    ...say('USE THE RULE FOR EVERY WEIGHT', C.green));
  await until(S(46)); await play(...assigned.map(b => mark(b, C.cyan)), ...fbox([
    '11 targets in each block',
    '24 tokens together',
    ['Same average gradient', C.green],
  ], C.green), ...say('EQUAL GROUPS, SAME GRADIENT'));
  const work = parallelWork(P ? -5.6 : -1.9, P ? X : [3.3, 5.4]);
  await until(S(47));
  await play(out(new M.VGroup(chart, ...marks)), fade(work), ...fbox([
    'Process more text at once',
    ['Two blocks in one block’s compute time', C.green],
  ], C.green), ...say('SHARE THE WORK TO SAVE TIME'));

  // Run the first step again without sharing.
  await until(S(48)); await play(out(work), ...clearBox(), ...say('WHAT IF THEY NEVER SHARE?', C.pink));
  await until(S(49));
  await play(...setBoth(0.50), ...assigned.map(out), ...secondCounts.map(out),
    ...X.map((x, i) => fade(tokens(x, orders[i]))), ...assignedCounts.map(fade), ...say('RETURN BOTH WEIGHTS TO 0.50'));
  await until(S(50));
  await play(...showGrad(0, '+0.4', C.cyan), ...setWeight(0, 0.30, C.pink),
    ...fbox(['Device 1', ['0.50 − 0.5 × 0.4 = 0.30', C.pink]], C.pink));
  await until(S(51));
  await play(...showGrad(1, '−0.2', C.pink), ...setWeight(1, 0.60, C.amber),
    ...fbox(['Device 2', ['0.50 + 0.5 × 0.2 = 0.60', C.amber]], C.pink));
  await until(S(52)); await play(...weightRows.map((r, i) => mark(r, i ? C.amber : C.pink)),
    ...fbox(['0.30 and 0.60', ['Two different models', C.pink]], C.pink), ...say('THE REPLICAS DRIFT APART', C.pink));

  const time = timeRows(P ? -5.6 : -1.9, true, P ? 0.3 : 4.5);
  await until(S(53));
  await play(fade(time.first), fade(time.second),
    ...fbox(['Sending gradients takes time', ['Speed depends on the link', C.amber]], C.amber),
    ...say('SHARING TAKES TIME', C.amber));
  await until(S(54));
  await play(out(time.first), out(time.second), ...clearGrads(), ...setBoth(0.45), ...fbox([
    'Split the training text',
    'Copy the whole model',
    ['Share and average the gradients', C.green],
  ], C.green), ...say('DATA PARALLELISM', C.green));
}
