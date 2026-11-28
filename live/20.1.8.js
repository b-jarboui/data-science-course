// 20.1.8 Scaling laws: learning with more compute.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const compute = [1, 4, 16, 64];
  const loss = [6, 4, 3, 2.5];
  const floor = 2;
  const nextCompute = 256;
  const nextLoss = 2.25;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const point = (x, y) => [x, y, 0];
  const label = (text, size, color, x, y, mono = false, bold = false) =>
    T(String(text), size, color, mono, bold).moveTo(point(x, y));
  const fade = object => new M.FadeIn(object, { runTime: 0.5 });
  const out = object => new M.FadeOut(object, { runTime: 0.4 });
  const draw = object => new M.Create(object, { runTime: 0.65 });
  const mark = (object, color = C.amber) => new M.Indicate(object, { color, runTime: 0.65 });
  const lag = (animations, runTime = 0.95) => new M.LaggedStart(animations, { lagRatio: 0.15, runTime });
  const line = (a, b, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start: a, end: b, color, strokeWidth });
  function dot(x, y, radius, color, opacity = 1) {
    const d = new M.Dot({ point: point(x, y), radius, color });
    d.setFill(color, opacity);
    return d;
  }
  function card(width, height, x, y, color = C.cyan) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.15, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    return r.moveTo(point(x, y));
  }

  let boxNow = null;
  function fbox(rows, accent = C.cyan) {
    const size = P ? 21 : 20;
    const spacing = P ? 0.4 : 0.43;
    const texts = rows.map(row => {
      const [text, color] = Array.isArray(row) ? row : [row, C.ink];
      return T(text, size, color, true);
    });
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.6;
    const height = texts.length * spacing + 0.38;
    const [x, y] = BOXP;
    const border = card(width, height, x, y, accent);
    texts.forEach((t, i) => t.moveTo(point(
      x - width / 2 + 0.3 + t.getWidth() / 2,
      y + ((texts.length - 1) / 2 - i) * spacing
    )));
    const group = new M.VGroup(border, ...texts);
    const limit = P ? FW - 1.2 : 4;
    if (width > limit) group.scale(limit / width);
    group.moveTo(BOXP);
    const animations = boxNow ? [out(boxNow), fade(group)] : [fade(group)];
    boxNow = group;
    return animations;
  }
  function clearBox() {
    const previous = boxNow;
    boxNow = null;
    return previous ? [out(previous)] : [];
  }

  // Laptop: three newsletters side by side in the middle. Phone: stacked, big, down the frame.
  function newsletter(x, y, heading, text, color = C.cyan) {
    const border = card(P ? 6.4 : 3.6, P ? 1.55 : 1.35, x, y, color);
    return new M.VGroup(
      border,
      label(heading, P ? 20 : 19, color, x, y + (P ? 0.32 : 0.27), false, true),
      label(text, P ? 22 : 18, C.ink, x, y - (P ? 0.3 : 0.25))
    );
  }

  const paperAt = i => P ? [0, 0.3 - i * 2.1] : [(i - 1) * 3.9, -0.4];
  const papers = [
    newsletter(...paperAt(0), 'Newsletter A', 'Library opens at nine'),
    newsletter(...paperAt(1), 'Newsletter B', 'Pool closed today'),
    newsletter(...paperAt(2), 'Newsletter C', 'Exams start')
  ];
  await until(S(0)); await play(lag(papers.map(fade)), ...say('CAMPUS NEWSLETTERS'));
  await until(S(1)); await play(...say('MORE TIME AND MONEY', C.amber));
  await until(S(2)); await play(...say('HOW MUCH BETTER?', C.amber));
  await until(S(3)); await play(...say('FOUR MODELS · SAME TRAINING COLLECTION'));

  // These small networks are schematic. Their shapes are separate from the measured compute.
  const shapes = [[2, 2, 1], [2, 3, 1], [3, 3, 1], [3, 4, 1]];
  const MX = 0;   // the four models sit in the middle on both layouts
  const columns = P ? 1.85 : 2.0;
  const centers = shapes.map((_, i) => [
    MX + (i % 2 ? columns : -columns),
    i < 2 ? (P ? 0.3 : 0.4) : (P ? -2.9 : -1.85),
    0
  ]);
  const FHt = P ? 2.9 : 2.2;
  const frames = centers.map(([x, y], i) => {
    const border = card(P ? 3.5 : 3.7, FHt, x, y - 0.05, C.line);
    const name = label(`Model ${i + 1}`, P ? 19 : 17, C.ink, x, y + FHt / 2 - 0.32, false, true);
    return new M.VGroup(border, name);
  });
  const nets = centers.map(([x, y], i) => L.net({
    layers: shapes[i], center: point(x, y + (P ? 0.05 : 0.0)), width: P ? 2.5 : 2.6,
    height: P ? 1.35 : 0.85, r: P ? 0.15 : 0.12
  }));
  await until(S(4));
  await play(...papers.map(out), lag(frames.map(fade)), lag(nets.map(n => fade(n.group))), ...say('NEURONS IN LAYERS, JOINED BY WEIGHTS'));

  await until(S(5));
  await play(...nets[0].weight(0, 0, 0, 0.8), ...nets[0].weight(0, 1, 0, -0.5),
    ...say('NUMBERS TRAVEL ALONG THE LINES'));
  await play(...nets.flatMap(n => n.flow(0)));
  await play(...nets.flatMap(n => n.flow(1)));

  await until(S(6));
  await play(mark(nets[3].group), ...say('MORE CONNECTIONS · MORE WORK PER TOKEN', C.amber));

  const tokens = ['Library', 'opens', 'at', 'nine'].map((word, i) => {
    const x = MX + (i - 1.5) * (P ? 1.75 : 1.5);
    const y = P ? -5.25 : -3.45;
    return new M.VGroup(card(P ? 1.6 : 1.35, P ? 0.7 : 0.5, x, y), label(word, P ? 19 : 17, C.cyan, x, y));
  });
  await until(S(7));
  await play(lag(tokens.map(fade)), ...say('MORE TOKENS · MORE CALCULATIONS', C.amber));
  await until(S(8));
  await play(...tokens.map(out), ...say('COMPUTE = ALL THE TRAINING ARITHMETIC'));

  const budgets = centers.map(([x, y], i) =>
    label(`${compute[i]} ${i === 0 ? 'unit' : 'units'}`, P ? 19 : 17, C.cyan, x, y - FHt / 2 + 0.3, true));
  for (let i = 0; i < compute.length; i++) {
    await until(S(9 + i));
    await play(fade(budgets[i]));
  }

  const validationY = P ? -5.25 : -3.45;
  const validation = new M.VGroup(
    card(P ? 7.2 : 7.0, P ? 0.75 : 0.55, MX, validationY, C.violet),
    label(P ? 'Same unread newsletters for all 4' : 'Same unread newsletters for all four models', P ? 19 : 18, C.violet, MX, validationY)
  );
  await until(S(13)); await play(fade(validation), ...say('TEST ON THE SAME UNREAD TEXT', C.violet));
  await until(S(14)); await play(mark(validation, C.violet), ...say('VALIDATION DATA', C.violet));
  await until(S(15)); await play(...say('CROSS-ENTROPY LOSS · BITS PER TOKEN', C.pink));

  const results = centers.map(([x, y], i) =>
    label(`${compute[i]} → ${loss[i]} bits`, P ? 18 : 17, C.amber, x, y - FHt / 2 + 0.3, true));
  for (let i = 0; i < loss.length; i++) {
    await until(S(16 + i));
    await play(out(budgets[i]), fade(results[i]));
  }

  // The dots are equally spaced in log compute. The vertical distances use a linear scale.
  const X0 = P ? -2.75 : -5.45;
  const DX = P ? 1.39 : 1.75;
  const BASE = P ? -5.3 : -2.12;
  const DY = P ? 1.3 : 0.62;
  const X = tick => X0 + DX * tick;
  const Y = bits => BASE + DY * (bits - 1.5);
  const right = X(4) + 0.42;

  function plot() {
    const axisX = X0 - 0.44;
    const axes = new M.VGroup(
      line(point(axisX, BASE), point(right, BASE)),
      line(point(axisX, BASE), point(axisX, Y(6) + 0.25)),
      ...[2, 3, 4, 5, 6].flatMap(bits => [
        line(point(axisX, Y(bits)), point(right, Y(bits)), C.grid, 1),
        label(bits, 15, C.muted, axisX - 0.23, Y(bits), true)
      ]),
      label('Average loss · bits per token', 16, C.ink, CX, Y(6) + (P ? 0.5 : 0.42)),
      label('Compute · units', 17, C.ink, CX, BASE - 0.63)
    );
    const ticks = [...compute, nextCompute].map((v, i) => new M.VGroup(
      line(point(X(i), BASE - 0.07), point(X(i), BASE + 0.07), i === 4 ? C.violet : C.muted),
      label(v, 16, i === 4 ? C.violet : C.ink, X(i), BASE - 0.28, true)
    ));
    const dots = loss.map((bits, i) => new M.VGroup(
      dot(X(i), Y(bits), 0.17, C.cyan, 0.2),
      dot(X(i), Y(bits), 0.082, C.cyan),
      label(bits, 17, C.cyan, X(i) + 0.22, Y(bits) + 0.23, true, true)
    ));
    return { axes, ticks, dots };
  }

  let graph = plot();
  await until(S(20));
  await play(...frames.map(out), ...nets.map(n => out(n.group)), ...results.map(out), out(validation),
    lag(graph.dots.map(fade)), ...say('FOUR RESULTS'));
  await until(S(21));
  await play(fade(graph.axes), ...graph.ticks.slice(0, 4).map(fade), ...say('COMPUTE ACROSS · LOSS UP'));
  const multipliers = compute.slice(1).map((_, i) =>
    label('×4', 15, C.amber, (X(i) + X(i + 1)) / 2, BASE - 0.28, true));
  await until(S(22)); await play(lag(multipliers.map(fade)), ...say('EACH STEP USES FOUR TIMES AS MUCH', C.amber));
  await until(S(23)); await play(...say('LOGARITHMIC COMPUTE AXIS'));

  function changes() {
    return loss.slice(1).map((bits, j) => {
      const x = (X(j) + X(j + 1)) / 2;
      const high = Y(loss[j]);
      const low = Y(bits);
      return new M.VGroup(
        line(point(x, high), point(x, low), C.amber, 3),
        line(point(x - 0.08, high), point(x + 0.08, high), C.amber),
        line(point(x - 0.08, low), point(x + 0.08, low), C.amber),
        label(`−${loss[j] - bits}`, 15, C.amber, x + 0.29, (high + low) / 2, true)
      );
    });
  }

  const drops = changes();
  await until(S(24)); await play(lag(graph.dots.map(d => mark(d, C.cyan)), 1.45), ...say('MORE COMPUTE · LOWER LOSS'));
  await until(S(25)); await play(lag(drops.map(fade)), ...say('EACH DROP IS SMALLER', C.amber));

  function windowPane(count, heading) {
    const y = P ? -0.1 : -0.35;
    const border = card(3.85, 2.33, CX, y, C.muted);
    const panes = [
      line(point(CX, y - 1.15), point(CX, y + 1.15), C.muted),
      line(point(CX - 1.9, y), point(CX + 1.9, y), C.muted)
    ];
    const dust = Array.from({ length: count }, (_, i) =>
      dot(CX - 1.6 + ((i * 11) % 23) * 0.145,
        y - 0.95 + ((i * 7) % 19) * 0.102, 0.048, C.amber, 0.73));
    return new M.VGroup(border, ...panes, ...dust, label(heading, 18, C.ink, CX, y - 1.45));
  }
  let windowView = windowPane(40, 'Before cleaning');
  await until(S(26));
  await play(out(graph.axes), ...graph.ticks.slice(0, 4).map(out), ...graph.dots.map(out),
    ...multipliers.map(out), ...drops.map(out), fade(windowView), ...say('A DUSTY WINDOW', C.amber));
  await until(S(27));
  const firstClean = windowPane(13, 'After the first cleaning');
  await play(out(windowView), fade(firstClean), ...say('THE FIRST CLEANING REMOVES MUCH MORE', C.amber));
  windowView = windowPane(7, 'After another cleaning');
  await play(out(firstClean), fade(windowView));

  await until(S(28));
  graph = plot();
  const newDrops = changes();
  await play(out(windowView), fade(graph.axes), ...graph.ticks.slice(0, 4).map(fade),
    ...graph.dots.map(fade), ...newDrops.map(fade), ...say('SMALLER GAINS AS COMPUTE GROWS', C.amber));

  const fitted = tick => floor + 4 / 2 ** tick;
  function curve(from, to, steps, color, dashed = false) {
    const parts = Array.from({ length: steps }, (_, i) => {
      const a = from + (to - from) * i / steps;
      const b = from + (to - from) * (i + (dashed ? 0.62 : 1)) / steps;
      return line(point(X(a), Y(fitted(a))), point(X(b), Y(fitted(b))), color, 3);
    });
    return new M.VGroup(...parts);
  }
  const fit = curve(0, 3, 64, C.cyan);
  const tail = curve(3, 4.22, 9, C.violet, true);
  await until(S(29)); await play(...newDrops.map(out), fade(fit), ...say('A SMOOTH CURVE THROUGH THE RESULTS'));
  await until(S(30)); await play(...say('A SCALING LAW DESCRIBES THE CURVE'));
  const floorTick = label('2', 17, C.amber, X0 - 0.67, Y(floor), true, true);
  await until(S(31)); await play(fade(tail), fade(floorTick), ...say('THE CURVE APPROACHES TWO BITS', C.amber));
  await until(S(32)); await play(...say('UNCERTAINTY THAT THIS FIT LEAVES', C.amber));
  const floorLine = new M.DashedLine({
    start: point(X0 - 0.44, Y(floor)), end: point(right, Y(floor)), color: C.amber, strokeWidth: 2
  });
  await until(S(33)); await play(draw(floorLine), ...say('FITTED LOWER LIMIT · 2 BITS', C.amber));

  function gap(tick, bits, color) {
    const x = X(tick) - 0.13;
    return new M.VGroup(
      line(point(x, Y(floor)), point(x, Y(bits)), color, 2),
      line(point(x - 0.07, Y(floor)), point(x + 0.05, Y(floor)), color),
      line(point(x - 0.07, Y(bits)), point(x + 0.05, Y(bits)), color)
    );
  }
  const gaps = loss.map((bits, i) => gap(i, bits, C.amber));
  await until(S(34)); await play(lag(gaps.map(fade)), ...say('DISTANCE ABOVE THE TWO-BIT LINE', C.amber));
  for (let i = 0; i < loss.length; i++) {
    const distance = loss[i] - floor;
    await until(S(35 + i));
    await play(mark(gaps[i]), ...fbox([
      `Compute ${compute[i]}`,
      [`${loss[i]} − 2 = ${distance} bits`, C.amber]
    ], C.amber));
  }
  await until(S(39)); await play(
    ...say('×4 COMPUTE · HALF THE DISTANCE', C.amber),
    ...fbox(['Distance above 2 bits', ['4 → 2 → 1 → 0.5', C.amber]], C.amber)
  );
  await until(S(40)); await play(...clearBox(), ...say('WHAT WILL THE NEXT TRIAL SHOW?', C.violet));
  await until(S(41)); await play(fade(graph.ticks[4]), ...fbox(['Next compute', ['64 × 4 = 256', C.violet]], C.violet));
  const nextGap = gap(4, nextLoss, C.violet);
  await until(S(42)); await play(fade(nextGap), ...fbox(['Distance above 2 bits', ['0.5 ÷ 2 = 0.25', C.violet]], C.violet));
  await until(S(43)); await play(...fbox(['Lower limit + distance', ['2 + 0.25', C.violet]], C.violet));

  const prediction = new M.VGroup(
    dot(X(4), Y(nextLoss), 0.15, C.violet, 0.2),
    dot(X(4), Y(nextLoss), 0.08, C.violet),
    label('2.25', 16, C.violet, X(4), Y(nextLoss) + 0.27, true, true)
  );
  await until(S(44));
  await play(fade(prediction), ...say('PREDICTED LOSS AT 256', C.violet),
    ...fbox([['2.25 bits per token', C.violet]], C.violet));

  await until(S(45)); await play(...clearBox(), ...say('DESCRIBE THE CURVE WITH A FORMULA'));
  await until(S(46)); await play(...fbox(['Average loss', ['= 2 + 4 ÷ √compute', C.cyan]]));
  await until(S(47)); await play(...fbox(['Square root', ['√compute × √compute', C.cyan], '= compute']));
  await until(S(48)); await play(...fbox(['16 × 16 = 256', ['√256 = 16', C.cyan]]));
  await until(S(49)); await play(...fbox(['4 ÷ 16 = 0.25', ['2 + 0.25 = 2.25 bits', C.violet]], C.violet));

  await until(S(50)); await play(mark(prediction, C.violet), ...say('ESTIMATE COMPUTE FOR A TARGET LOSS', C.violet));
  await until(S(51)); await play(
    mark(graph.dots[3]), mark(prediction, C.violet), ...say('FOUR TIMES THE COMPUTE', C.amber),
    ...fbox(['64 → 256 units', ['2.5 − 2.25 = 0.25 bits', C.amber]], C.amber)
  );
  await until(S(52)); await play(
    ...say('REAL CURVES FALL MORE SLOWLY', C.amber),
    ...fbox(['Our numbers are chosen', ['to be easy', C.amber]], C.amber)
  );
  await until(S(53)); await play(
    mark(tail, C.violet), ...say('THE SAME PATTERN MAY NOT HOLD', C.amber),
    ...fbox([['Measured: 1 to 64 units', C.cyan], ['Beyond that: not sure', C.amber]], C.amber)
  );
  await until(S(54)); await play(...clearBox(), ...say('ESTIMATE THE GAIN · EXPECT SMALLER GAINS', C.green));
}
