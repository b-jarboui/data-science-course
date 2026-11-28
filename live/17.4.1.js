// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = [CX, P ? 3.75 : 1.85, 0];
  const BOXP = P ? [0, -4.25, 0] : [4.45, -0.3, 0];
  const WIDTH = P ? FW - 1.0 : 4.6;
  const CY = P ? 1.35 : -0.12;
  const CARD_Y = P ? -1.25 : -2.18;
  const SY = P ? 1.0 : 0;
  const TIMES = ['9:00', '9:10', '9:20'];
  const READINGS = [21, 22, 21];
  const INPUTS = READINGS.map(v => v - 20);
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const at = (x, y) => [x, y, 0];
  const text = (s, x, y, size = 22, color = C.ink, mono = false) =>
    T(s, size, color, mono).moveTo(at(x, y));
  const line = (x1, y1, x2, y2, color = C.cyan, strokeWidth = 2) =>
    new M.Line({ start: at(x1, y1), end: at(x2, y2), color, strokeWidth });
  const rect = (w, h, x, y, color = C.cyan, fill = C.card, opacity = 0.95) => {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: 2 });
    r.setFill(fill, opacity);
    return r.moveTo(at(x, y));
  };
  const enter = m => new M.FadeIn(m, { runTime: 0.35 });
  const leave = m => new M.FadeOut(m, { runTime: 0.25 });
  const mark = (m, color = C.amber) => new M.Indicate(m, { color, runTime: 0.65 });
  const stagger = ms => new M.LaggedStart(ms.map(enter), { lagRatio: 0.22, runTime: 0.85 });

  let workNow = null;
  function work(lines, { boxed = false, bars = [], color = C.cyan } = {}) {
    const [x, y] = BOXP;
    const lh = P ? 0.5 : 0.42;
    const visible = lines.map(row => {
      const [s, c] = Array.isArray(row) ? row : [row, C.ink];
      return T(s, P ? 27 : 24, c, true);
    });
    const barHeight = bars.length ? 0.49 : 0;
    const textHeight = visible.length * lh;
    const height = textHeight + barHeight + 0.31;
    const width = Math.min(WIDTH, Math.max(
      ...visible.map(t => Math.min(t.getWidth(), WIDTH - 0.38) + 0.38),
      bars.length ? WIDTH : 0
    ));
    visible.forEach((t, i) => {
      if (t.getWidth() > width - 0.38) t.scale((width - 0.38) / t.getWidth());
      t.moveTo(at(x, y + barHeight / 2 + (visible.length / 2 - i - 0.5) * lh));
    });
    const parts = boxed ? [rect(width, height, x, y, color)] : [];
    parts.push(...visible);
    const total = bars.reduce((sum, [v]) => sum + v, 0);
    const available = Math.min(width - 0.4, total * 0.95);
    const barY = y - textHeight / 2;
    let left = x - available / 2;
    for (const [value, c] of bars) {
      const w = available * value / total;
      const block = new M.Rectangle({ width: w, height: 0.29, color: c, strokeWidth: 2 });
      block.setFill(c, 0.72);
      block.moveTo(at(left + w / 2, barY));
      parts.push(block);
      left += w;
    }
    const next = new M.VGroup(...parts);
    const animations = workNow
      ? [new M.LaggedStart([leave(workNow), enter(next)], { lagRatio: 1, runTime: 0.6 })]
      : [enter(next)];
    workNow = next;
    return animations;
  }

  function readingCard(i, rows, color = C.cyan) {
    const x = CX + (i - 1) * (P ? 1.95 : 1.9);
    const edge = rect(1.69, 1.12, x, CARD_Y, color);
    const halo = rect(1.81, 1.24, x, CARD_Y, color, color, 0.10);
    halo.setStrokeOpacity(0.28);
    const labels = rows.map(([s, c], k) =>
      text(s, x, CARD_Y + (rows.length / 2 - k - 0.5) * 0.42, k === 0 ? 18 : 23, c, true));
    return new M.VGroup(halo, edge, ...labels);
  }
  const rawCard = i => readingCard(i, [[TIMES[i], C.muted], [`${READINGS[i]}°C`, C.cyan]]);
  const inputCard = i => readingCard(i, [[TIMES[i], C.muted], [`+${INPUTS[i]}°C`, C.cyan]]);
  const raw = TIMES.map((_, i) => rawCard(i));
  const inputs = TIMES.map((_, i) => inputCard(i));
  const placeholders = TIMES.map((t, i) => readingCard(i, [[t, C.muted], ['·', C.muted]], C.line));

  const station = new M.VGroup(
    line(CX - 2.6, SY - 0.85, CX + 2.6, SY - 0.85, C.muted, 3),
    line(CX - 2.6, SY - 1.2, CX + 2.6, SY - 1.2, C.muted, 3),
    ...Array.from({ length: 11 }, (_, i) => line(CX - 2.5 + i * 0.5, SY - 1.32, CX - 2.5 + i * 0.5, SY - 0.74, C.line)),
    rect(4.4, 0.26, CX, SY - 0.45, C.muted),
    line(CX - 2, SY - 0.31, CX - 2, SY + 0.92, C.muted),
    line(CX + 2, SY - 0.31, CX + 2, SY + 0.92, C.muted),
    line(CX - 2.3, SY + 0.92, CX + 2.3, SY + 0.92, C.cyan, 3),
    text('Central', CX - 0.35, SY + 0.31, 29)
  );
  const sx = CX + 1.43;
  const sensorDot = new M.Dot({ point: at(sx, SY + 0.31), radius: 0.10, color: C.cyan });
  const sensor = new M.VGroup(
    rect(0.42, 0.58, sx, SY + 0.31),
    sensorDot,
    text('Sensor', sx, SY - 0.1, 16, C.cyan)
  );
  const timeline = new M.Line({
    start: at(CX - 2.85, CARD_Y + 0.83), end: at(CX + 2.85, CARD_Y + 0.83),
    color: C.muted, strokeWidth: 2
  });
  const ticks = TIMES.map((_, i) => {
    const x = CX + (i - 1) * (P ? 1.95 : 1.9);
    return new M.Dot({ point: at(x, CARD_Y + 0.83), radius: 0.065, color: C.cyan });
  });

  await until(S(0)); await play(enter(station), ...say('CENTRAL TRAIN STATION'),
    ...work(['Platform temperature', ['at Central', C.cyan]]));
  await until(S(1)); await play(enter(sensor), ...say('ONE READING EVERY 10 MINUTES'),
    ...work(['Sensor → a new reading', ['every 10 minutes', C.cyan]]));
  await until(S(2)); await play(enter(raw[0]), ...say('ONE READING', C.amber),
    ...work(['One reading alone:', ['what came just before?', C.amber]]));
  await until(S(3)); await play(mark(raw[0]), ...say('HOW CAN WE REMEMBER?', C.amber),
    ...work([['Remember recent readings?', C.amber]]));
  await until(S(4)); await play(leave(station), leave(sensor), leave(raw[0]), new M.Create(timeline),
    stagger([...placeholders, ...ticks]), ...say('CENTRAL IN TIME ORDER'),
    ...work(['First three readings', ['9:00 → 9:10 → 9:20', C.cyan]]));
  const first = rawCard(0);
  await until(S(5)); await play(leave(placeholders[0]), enter(first), mark(ticks[0]), ...work([['9:00 → 21°C', C.cyan]]));
  await until(S(6)); await play(leave(placeholders[1]), leave(placeholders[2]), stagger([raw[1], raw[2]]),
    ...work([['9:10 → 22°C', C.cyan], ['9:20 → 21°C', C.cyan]]));
  await until(S(7)); await play(...say('A SEQUENCE'), new M.LaggedStart(ticks.map(t => mark(t),), { lagRatio: 0.35, runTime: 1.1 }),
    ...work(['Readings in time order', ['= a sequence', C.cyan]]));
  await until(S(8)); await play(...work([['20°C', C.muted], 'All three are above 20°C']));
  await until(S(9)); await play(leave(first), leave(raw[1]), leave(raw[2]), stagger(inputs),
    ...say('DEGREES ABOVE 20'), ...work(['21 − 20 = 1', '22 − 20 = 2', '21 − 20 = 1']));
  await until(S(10)); await play(...say('A MEMORY NOTE', C.violet),
    ...work([['Old note', C.violet], 'New reading'], { bars: [[2, C.violet], [1, C.cyan]] }));
  await until(S(11)); await play(...say('KEEP HALF, THEN ADD THE READING', C.violet),
    ...work([['Half the old note', C.violet], ['+ new reading', C.cyan]], { bars: [[1, C.violet], [1, C.cyan]] }));

  // Keep the network in place while the calculations change beside it or above it.
  const N = L.net({ layers: [1, 1, 1], center: at(CX, CY), width: P ? 5.25 : 5.55, r: 0.53 });
  N.edges.flat(2).forEach(edge => edge.setStrokeOpacity(0.16));
  const [ix, hx, ox] = [0, 1, 2].map(l => N.pos(l, 0)[0]);
  const labelY = CY - 0.83;
  const inputLabel = text('Input', ix, labelY, 20, C.cyan);
  const memoryLabel = text('Memory note', hx, labelY, 20, C.violet);
  const hiddenLabel = text('Hidden state', hx, labelY, 20, C.violet);
  const outputLabel = text('Prediction', ox, labelY, 20, C.amber);
  const loopPoints = [
    [hx - 0.37, CY + 0.38], [hx - 0.85, CY + 0.64], [hx - 0.85, CY + 1.0],
    [hx + 0.85, CY + 1.0], [hx + 0.85, CY + 0.64], [hx + 0.37, CY + 0.38]
  ];
  const loopLines = loopPoints.slice(1).map(([x, y], i) => line(...loopPoints[i], x, y, C.cyan, 3.5));
  const [tipX, tipY] = loopPoints[loopPoints.length - 1];
  const loop = new M.VGroup(...loopLines,
    line(tipX, tipY, tipX + 0.25, tipY + 0.02, C.cyan, 3.5),
    line(tipX, tipY, tipX + 0.14, tipY + 0.22, C.cyan, 3.5));
  const wIn = text('×1', (ix + hx) / 2, CY + 0.33, 19, C.cyan, true);
  const wLoop = text('×0.5', hx, CY + 1.30, 19, C.cyan, true);
  const wOut = text('×1', (hx + ox) / 2, CY + 0.33, 19, C.cyan, true);
  const input = v => N.value(0, 0, v, C.cyan);
  const state = v => N.value(1, 0, v, C.violet);
  const forecast = v => N.value(2, 0, v, C.amber);
  const highlight = l => mark(N.nodes[l][0], [C.cyan, C.violet, C.amber][l]);
  const flow = l => N.flow(l, l === 0 ? C.cyan : C.amber);

  await until(S(12));
  await play(leave(timeline), ...ticks.map(leave), enter(N.group), ...say('THREE CIRCLES'),
    ...work(['A small neural network', ['3 circles in a row', C.cyan]]));
  await until(S(13)); await play(...N.value(0, 0, '?', C.muted), ...N.value(1, 0, '?', C.muted), ...N.value(2, 0, '?', C.muted),
    ...say('ONE NUMBER IN EACH NEURON'), ...work(['Circle = neuron', ['one number inside', C.cyan]]));
  await until(S(14)); await play(enter(inputLabel), highlight(0), mark(inputs[0], C.cyan),
    ...work([['Input neuron', C.cyan], 'gets the reading']));
  await until(S(15)); await play(enter(memoryLabel), highlight(1),
    ...work([['Hidden neuron', C.violet], 'holds the memory']));
  await until(S(16)); await play(leave(memoryLabel), enter(hiddenLabel), ...say('THE HIDDEN STATE', C.violet),
    ...work(['Memory number', ['= hidden state', C.violet]]));
  await until(S(17)); await play(enter(outputLabel), highlight(2), ...say('FORECAST = FUTURE PREDICTION', C.amber),
    ...work([['Output neuron', C.amber], 'gives the prediction']));
  await until(S(18)); await play(...N.weight(0, 0, 0, 1), ...N.weight(1, 0, 0, 1), ...say('THICKER LINE, BIGGER WEIGHT'),
    ...work(['Line × weight', ['thicker = bigger weight', C.cyan]]));
  await until(S(19)); await play(enter(wIn), ...flow(0), ...work(['Weight 1:', '1 × reading = reading']));
  await until(S(20)); await play(enter(loop), enter(wLoop), ...say('KEEP HALF THE OLD STATE', C.violet),
    ...work([['Loop weight 0.5', C.violet], 'keeps half the old state']));
  await until(S(21)); await play(highlight(1), ...say('REAL NETWORKS: + ACTIVATION', C.violet),
    ...work([['Real networks:', C.violet], 'total → activation function', ['Here we skip it', C.muted]]));
  await until(S(22)); await play(enter(wOut), ...flow(1), ...say('OUTPUT WEIGHT 1', C.amber),
    ...work([['Prediction = hidden state', C.amber]]));
  await until(S(23)); await play(...input('–'), ...state(0), ...forecast('–'),
    ...say('BEFORE 9:00', C.violet), ...work(['No earlier readings', ['Hidden state = 0', C.violet]]));

  await until(S(24)); await play(...input(1), ...flow(0), mark(inputs[0]), ...say('9:00'),
    ...work([['New reading = 1', C.cyan], '1 × 1 = 1']));
  await until(S(25)); await play(mark(loop, C.violet), ...state(1),
    ...work(['Half of 0 = 0', ['0 + 1 = 1', C.violet]], { bars: [[1, C.cyan]] }));
  await until(S(26)); await play(...input(2), ...flow(0), mark(inputs[1]), ...say('9:10'),
    ...work([['New reading = 2', C.cyan], '1 × 2 = 2']));
  await until(S(27)); await play(mark(loop, C.violet), ...work([['Half of 1 = 0.5', C.violet]],
    { bars: [[0.5, C.violet]] }));
  await until(S(28)); await play(...state(2.5), highlight(1),
    ...work([['0.5 + 2 = 2.5', C.violet]], { bars: [[0.5, C.violet], [2, C.cyan]] }));
  await until(S(29)); await play(...flow(1), ...work([['Output weight 1', C.amber], '2.5 passes through']));
  await until(S(30)); await play(...work([['1 × 2.5 = 2.5', C.amber]]));
  await until(S(31)); await play(...forecast(2.5), ...work([['Prediction = 2.5', C.amber], 'degrees above 20']));
  await until(S(32)); await play(highlight(2), ...work(['20 + 2.5', ['Prediction = 22.5°C', C.amber]]));
  await until(S(33)); await play(...input(1), ...forecast('–'), ...flow(0), mark(inputs[2]), ...say('9:20'),
    ...work([['New reading = 1', C.cyan], '1 × 1 = 1']));
  await until(S(34)); await play(mark(loop, C.violet), ...work([['Half of 2.5 = 1.25', C.violet]],
    { bars: [[1.25, C.violet]] }));
  await until(S(35)); await play(...state(2.25), highlight(1),
    ...work([['1.25 + 1 = 2.25', C.violet]], { bars: [[1.25, C.violet], [1, C.cyan]] }));
  await until(S(36)); await play(...flow(1), ...forecast(2.25), ...work([['1 × 2.25 = 2.25', C.amber]]));
  await until(S(37)); await play(highlight(2), ...work(['20 + 2.25', ['Prediction for 9:30', C.amber], ['= 22.25°C', C.amber]]));

  const comparison = [
    readingCard(0, [[TIMES[0], C.muted], ['21°C', C.cyan]]),
    readingCard(2, [[TIMES[2], C.muted], ['21°C', C.cyan]])
  ];
  const states = [
    readingCard(0, [[TIMES[0] + ' state', C.muted], ['1', C.violet]], C.violet),
    readingCard(2, [[TIMES[2] + ' state', C.muted], ['2.25', C.violet]], C.violet)
  ];
  await until(S(38)); await play(leave(inputs[0]), leave(inputs[2]), ...comparison.map(enter),
    ...say('SAME TEMPERATURE'), ...work(['9:00 and 9:20', ['Both 21°C', C.cyan]]));
  await until(S(39)); await play(...comparison.map(leave), ...states.map(enter),
    ...say('DIFFERENT HIDDEN STATES', C.violet), ...work([['1 at 9:00', C.violet], ['2.25 at 9:20', C.violet]]));
  await until(S(40)); await play(mark(inputs[1]), ...work([['9:10 left 1 in the state', C.amber], '0.25 + 1 + 1 = 2.25'],
    { bars: [[0.25, C.violet], [1, C.amber], [1, C.cyan]] }));
  await until(S(41)); await play(mark(loop, C.violet),
    ...say('RECURRENT NETWORK', C.violet), ...work(['The state loops back', 'The weights stay the same']));
  await until(S(42)); await play(highlight(1), ...work([['New hidden state', C.violet]], { boxed: true, color: C.violet }));
  await until(S(43)); await play(mark(loop, C.violet), ...work([
    ['New hidden state', C.violet], '= 0.5 × old hidden state', '+ 1 × new reading'
  ], { boxed: true, color: C.violet }));
  await until(S(44)); await play(...flow(1), ...work([
    ['Prediction above 20°C', C.amber], '= 1 × hidden state'
  ], { boxed: true, color: C.amber }));

  await until(S(45)); await play(...states.map(leave), leave(inputs[1]), ...say('RECENT STEPS SHAPE THE NEXT'),
    mark(loop, C.violet), ...work(['Earlier → recent → next']));
  await until(S(46)); await play(...say('WEATHER AND SENSOR READINGS'), ...work([
    ['Central platform', C.cyan], '9:20 → 9:30 → 9:40', '21°C → 23°C → 24°C'
  ], { bars: [[1, C.cyan], [3, C.cyan], [4, C.cyan]] }));
  await until(S(47)); await play(...say('EARLIER WORDS SHAPE THE NEXT WORD'),
    ...work(['The → train → is →', ['late', C.amber]]));
  await until(S(48)); await play(mark(loop, C.violet), ...say('ONE LIMIT', C.amber),
    ...work([['The 9:10 reading: 2', C.cyan]], { bars: [[2, C.cyan]] }));
  await until(S(49)); await play(...say('THE SAME READING FADES EACH STEP', C.violet),
    ...work(['2 → 1 → 0.5 → 0.25'], { bars: [[2, C.cyan], [1, C.cyan], [0.5, C.cyan], [0.25, C.cyan]] }));
  await until(S(50)); await play(...work(['0.25 → 0.125 → …', ['Very little remains', C.violet]],
    { bars: [[0.25, C.violet], [0.125, C.violet]] }));
  await until(S(51)); await play(...say('WE CHOSE THE WEIGHTS'), ...work(['Input 1  ·  Loop 0.5', 'Output 1']));
  await until(S(52)); await play(...say('NEXT: LEARN FROM THE ERROR', C.amber),
    ...work(['9:30 prediction: 22.25°C', '9:30 reading: 23°C', ['Error: −0.75°C', C.amber]]));
  await until(S(53)); await play(mark(loop, C.violet), ...flow(1), ...say('CARRY THE STATE FORWARD', C.violet),
    ...work([['Same rule at every step', C.violet]], { boxed: true, color: C.violet }));
}
