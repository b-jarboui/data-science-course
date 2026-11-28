export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;

  const purposes = [
    { name: 'Borrow', color: C.cyan },
    { name: 'Computer', color: C.violet },
    { name: 'Study', color: C.amber },
    { name: 'Event', color: C.pink },
  ];

  // [Purpose index, duration in minutes], in placement order.
  const visits = [
    [0, 5], [0, 8], [0, 10], [0, 10], [0, 12], [0, 15], [0, 15],
    [1, 20], [1, 25], [1, 30], [1, 30], [1, 35],
    [2, 40], [2, 45], [2, 50], [2, 55], [2, 60], [2, 60],
    [2, 75], [2, 90], [2, 160],
    [3, 85], [3, 95], [3, 90],
  ];

  const pillPoint = P ? [0, 3.54, 0] : [-2.2, 1.92, 0];
  const width = P ? FW - 0.72 : 12.2;
  const left = -width / 2;
  const right = width / 2;
  const axisY = P ? -0.52 : -1.60;
  const firstY = axisY + (P ? 0.33 : 0.30);
  const stackStep = P ? 0.28 : 0.34;
  const xAt = minutes => left + minutes / 160 * width;

  const nearest = xAt(10) - xAt(8);
  const timeColumns = [...new Set(visits.map(([, minutes]) => minutes))].sort((a, b) => a - b);
  const plotSizes = new Map(timeColumns.map((minutes, index) => {
    const leftGap = index > 0 ? xAt(minutes) - xAt(timeColumns[index - 1]) : Infinity;
    const rightGap = index + 1 < timeColumns.length
      ? xAt(timeColumns[index + 1]) - xAt(minutes)
      : Infinity;
    const gap = Math.min(leftGap, rightGap);
    return [minutes, {
      // Limit each phone halo to its local spacing, including the 8–10–12 cluster.
      halo: P ? Math.min(0.109, gap * 0.49) : nearest * 0.40,
      core: P ? Math.min(0.092, gap * 0.45) : nearest * 0.31,
    }];
  }));

  const say = (text, color = C.cyan) => showA(text, color, pillPoint);
  const fade = object => new M.FadeIn(object, { runTime: 0.4 });
  const out = (...objects) => new M.FadeOut(
    objects.length === 1 ? objects[0] : new M.VGroup(...objects),
    { runTime: 0.35 },
  );
  const reveal = (objects, runTime = 1.1, lagRatio = 0.12) =>
    new M.LaggedStart(objects.map(fade), { runTime, lagRatio });
  const line = (x0, y0, x1, y1, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start: [x0, y0, 0], end: [x1, y1, 0], color, strokeWidth });

  let currentCard = null;
  function card(rows, color = C.cyan, low = false) {
    const point = P ? [0, low ? -4.73 : -3.80, 0] : [4.45, 1.25, 0];
    const rowHeight = P ? 0.49 : 0.38;
    const labels = rows.map(row => {
      const [text, ink] = Array.isArray(row) ? row : [row, C.ink];
      return T(text, P ? 23 : 20, ink, true);
    });
    const textWidth = Math.max(...labels.map(label => label.getWidth()));
    const cardWidth = Math.max(P ? 4.34 : 0, textWidth + 0.65);
    const background = new M.RoundedRectangle({
      width: cardWidth,
      height: labels.length * rowHeight + 0.36,
      cornerRadius: 0.18,
      color,
      strokeWidth: 2,
    });
    background.setFill(C.card, 0.95);
    background.moveTo(point);
    labels.forEach((label, index) => {
      label.moveTo([
        point[0] - cardWidth / 2 + 0.325 + label.getWidth() / 2,
        point[1] + (labels.length - 1) * rowHeight / 2 - index * rowHeight,
        0,
      ]);
    });
    const next = new M.VGroup(background, ...labels);
    if (!P && cardWidth > 4.2) next.scale(4.2 / cardWidth);
    const animations = currentCard ? [out(currentCard), fade(next)] : [fade(next)];
    currentCard = next;
    return animations;
  }

  function disk(point, radius, color, opacity) {
    const dot = new M.Dot({ point, radius, color, strokeWidth: 0 });
    dot.setStrokeOpacity(0);
    dot.setFill(color, opacity);
    return dot;
  }

  function glow(point, color, halo, core, opacity = 0.28) {
    return new M.VGroup(disk(point, halo, color, opacity), disk(point, core, color, 1));
  }

  function outline(boxWidth, height, x, y, color) {
    const box = new M.RoundedRectangle({
      width: boxWidth,
      height,
      cornerRadius: Math.min(0.12, boxWidth / 4),
      color,
      strokeWidth: P ? 2.2 : 1.8,
    });
    box.setFill(C.bg, 0);
    box.moveTo([x, y, 0]);
    return box;
  }

  function ring(point, radius, color) {
    const circle = new M.Circle({ radius, color, strokeWidth: 2 });
    circle.setFill(C.bg, 0);
    circle.moveTo(point);
    return circle;
  }

  function makeLegend() {
    return new M.VGroup(...purposes.map(({ name, color }, index) => {
      const x = P ? (index % 2 === 0 ? -2.36 : 0.58) : -4.25 + index * 2.65;
      const y = P ? (index < 2 ? -5.67 : -6.27) : -2.83;
      const dot = glow([x, y, 0], color, P ? 0.15 : 0.13, P ? 0.09 : 0.075);
      const label = T(name, P ? 21 : 18, color);
      label.moveTo([x + 0.26 + label.getWidth() / 2, y, 0]);
      return new M.VGroup(dot, label);
    }));
  }

  function makeRuler(max = 160, seconds = false) {
    const inset = P && seconds ? 0.38 : 0;
    const rulerLeft = left + inset;
    const rulerRight = right - inset;
    const x = value => rulerLeft + value / max * (rulerRight - rulerLeft);
    const baseline = line(rulerLeft, axisY, rulerRight, axisY, C.muted, 3);
    const ticks = [];
    const step = seconds ? 1 : 10;
    for (let value = 0; value <= max; value += step) {
      const firstTen = !seconds && value === 10;
      const major = value % (step * 2) === 0;
      const marked = major || (P && firstTen);
      const length = marked ? 0.09 : 0.06;
      const tick = line(x(value), axisY - length, x(value), axisY + length,
        marked ? C.ink : C.muted, marked ? 2 : 1.5);
      if (P && !marked) {
        ticks.push(tick);
        continue;
      }
      const text = seconds ? `10:${String(value).padStart(2, '0')}` : String(value);
      const size = value === 0 || value === max || (P && (firstTen || seconds)) ? 18 : P ? 16 : 15;
      const label = T(text, size, marked ? C.ink : C.muted, true);
      label.moveTo([x(value), axisY - (P ? 0.38 : 0.30), 0]);
      ticks.push(new M.VGroup(tick, label));
    }
    const unit = T(seconds ? 'minutes and seconds' : 'minutes', P ? 19 : 17, C.muted);
    unit.moveTo([rulerRight - unit.getWidth() / 2, axisY - (P ? 0.88 : 0.69), 0]);
    return { x, baseline, ticks, unit };
  }

  function showRuler({ baseline, ticks, unit }) {
    return [new M.Create(baseline, { runTime: 0.8 }), reveal(ticks, 0.85, 0.04), fade(unit)];
  }

  const rulerParts = ({ baseline, ticks, unit }) => [baseline, ...ticks, unit];
  const mixOrder = [
    12, 0, 7, 13, 21, 1,
    8, 14, 2, 15, 3, 9,
    4, 23, 16, 10, 17, 5,
    18, 6, 19, 22, 11, 20,
  ];

  const makeGridDot = (point, color) =>
    glow(point, color, P ? 0.24 : 0.21, P ? 0.135 : 0.11);

  const gridVisitors = mixOrder.map((visitIndex, index) => {
    const [purpose, minutes] = visits[visitIndex];
    const { color } = purposes[purpose];
    const row = Math.floor(index / 6);
    const x = (P ? 0 : -1.75) + (index % 6 - 2.5) * 1.12;
    const point = [x, (P ? 1.75 : 0.88) - row * (P ? 1.23 : 0.82), 0];
    const openingPoint = P ? [x, 1.75 - row * 1.80, 0] : point;
    const openingDot = makeGridDot(openingPoint, color);
    const timedDot = P && row > 0 ? makeGridDot(point, color) : openingDot;
    const label = T(String(minutes), P ? 20 : 16, color, true);
    const labelDrop = minutes === 160 ? (P ? 0.56 : 0.49) : P ? 0.46 : 0.30;
    label.moveTo([x, point[1] - labelDrop, 0]);
    return { minutes, point, openingDot, timedDot, label };
  });
  const legend = makeLegend();

  await until(S(0));
  await play(reveal(gridVisitors.map(visitor => visitor.openingDot), 1.5, 0.04),
    fade(legend), ...say('24 LIBRARY VISITORS'));

  await until(S(1));
  await play(...say('HOW LONG DO PEOPLE STAY?', C.amber));

  // Crossfade the lower phone rows into their labelled positions.
  const gridChange = gridVisitors
    .filter(({ openingDot, timedDot }) => openingDot !== timedDot)
    .flatMap(({ openingDot, timedDot }) => [out(openingDot), fade(timedDot)]);

  await until(S(2));
  await play(...gridChange, reveal(gridVisitors.map(visitor => visitor.label), 1.35, 0.04),
    ...say('TIMED IN MINUTES'));

  const shortest = gridVisitors.find(visitor => visitor.minutes === 5);
  const longest = gridVisitors.find(visitor => visitor.minutes === 160);
  const shortestRing = ring(shortest.point, P ? 0.29 : 0.26, C.cyan);
  const longestRing = ring(longest.point, P ? 0.29 : 0.26, C.amber);

  await until(S(3));
  await play(new M.Create(shortestRing, { runTime: 0.65 }),
    ...card([['Shortest visit', C.cyan], '5 minutes']), ...say('SHORTEST: 5 MINUTES'));

  await until(S(4));
  await play(out(shortestRing), new M.Create(longestRing, { runTime: 0.65 }),
    ...card([['Shortest   5 min', C.cyan], ['Longest  160 min', C.amber], '2 h 40 min'], C.amber),
    ...say('LONGEST: 160 MIN', C.amber));

  const barLeft = P ? -1.68 : -4.35;
  const barTop = P ? 1.51 : 0.75;
  const barPitch = P ? 1.04 : 0.69;
  const bars = [2, 0, 1, 3].map((purpose, index) => {
    const count = visits.filter(([category]) => category === purpose).length;
    const barWidth = count * (P ? 0.47 : 0.55);
    const y = barTop - index * barPitch;
    const { name, color } = purposes[purpose];
    const bar = new M.Rectangle({ width: barWidth, height: P ? 0.50 : 0.44, color, strokeWidth: 1 });
    bar.setFill(color, 0.84);
    bar.moveTo([barLeft + barWidth / 2, y, 0]);
    const nameLabel = T(name, 18, color);
    nameLabel.moveTo([barLeft - 0.22 - nameLabel.getWidth() / 2, y, 0]);
    const countLabel = T(String(count), 19, color, true);
    countLabel.moveTo([barLeft + barWidth + 0.29, y, 0]);
    return new M.VGroup(bar, nameLabel, countLabel);
  });
  const reasonAxis = line(barLeft, barTop - 3 * barPitch - 0.34, barLeft, barTop + 0.37);
  const reasonUnit = T('number of visitors', P ? 19 : 17, C.muted);
  reasonUnit.moveTo([barLeft + 1.55, barTop - 3 * barPitch - 0.65, 0]);
  const reasonBars = new M.VGroup(reasonAxis, reasonUnit, ...bars);

  await until(S(5));
  await play(out(longestRing, ...gridVisitors.flatMap(visitor => [visitor.timedDot, visitor.label])),
    fade(reasonBars), ...card([['Last time', C.cyan], '4 bars by reason']),
    ...say('LAST TIME: BARS BY REASON'));

  const gapY = P ? axisY : -1.5;
  const gapLeft = P ? -3.18 : -5.10;
  const gapRight = P ? 3.18 : 1.75;
  const gapX = minutes => gapLeft + (minutes - 80) / 86 * (gapRight - gapLeft);
  const gapAxis = line(gapLeft, gapY, gapRight, gapY);
  const gapUnit = T('minutes', P ? 19 : 17, C.muted);
  gapUnit.moveTo([gapRight - gapUnit.getWidth() / 2, gapY - 0.84, 0]);

  function lateBar(x, minutes, color) {
    const bar = new M.Rectangle({ width: 0.48, height: 0.64, color, strokeWidth: 1.5 });
    bar.setFill(color, 0.84);
    bar.moveTo([x, gapY + 0.32, 0]);
    const label = T(String(minutes), 18, color, true).moveTo([x, gapY - 0.33, 0]);
    return new M.VGroup(bar, label);
  }

  const bar95 = lateBar(gapX(95), 95, C.pink);
  const bar160 = lateBar(gapX(160), 160, C.amber);
  const gapGuide = line(gapX(95) + 0.32, gapY + 0.46, gapX(160) - 0.32, gapY + 0.46, C.pink);
  const gapText = T('No visits in between', P ? 20 : 18, C.pink, true)
    .moveTo([(gapX(95) + gapX(160)) / 2, gapY + 0.86, 0]);

  await until(S(6));
  await play(out(reasonBars), new M.Create(gapAxis), fade(gapUnit),
    fade(bar95), fade(bar160), new M.Create(gapGuide), fade(gapText),
    ...card([['95 to 160 minutes', C.pink], 'A 65-minute gap'], C.pink),
    ...say('SOME STRETCHES HAVE NO VISITORS', C.pink));

  const adjacentX = gapX(95) + 0.87;
  const croppedBaseline = line(gapX(95) - 0.4, gapY, adjacentX + 0.4, gapY);
  const compressedNote = T('Gap hidden', 18, C.pink, true)
    .moveTo([(gapX(95) + adjacentX) / 2, gapY + 1.0, 0]);

  await until(S(7));
  await play(out(gapAxis, gapGuide, gapText), new M.Create(croppedBaseline),
    new M.Transform(bar160, lateBar(adjacentX, 160, C.amber), { runTime: 0.9 }),
    fade(compressedNote), ...card([['95 next to 160?', C.pink], 'The gap disappears'], C.pink),
    ...say('SIDE-BY-SIDE BARS HIDE GAPS', C.pink));

  const ruler = makeRuler();

  await until(S(8));
  await play(out(croppedBaseline, bar95, bar160, compressedNote, gapUnit), ...showRuler(ruler),
    ...card([['Number line', C.cyan], '0 to 160 minutes']),
    ...say('RULER LINE: 0 TO 160 MINUTES'));

  const stepY = axisY + 0.28;
  const stepMarks = new M.VGroup(
    line(xAt(0), stepY, xAt(10) - 0.025, stepY, C.amber, 3),
    line(xAt(10) + 0.025, stepY, xAt(20), stepY, C.cyan, 3),
    T('10 min', P ? 20 : 18, C.amber, true).moveTo([xAt(10) + (P ? 0.12 : 0), axisY + 0.70, 0]),
    T('← short stays', P ? 19 : 17, C.cyan).moveTo([left + 0.92, axisY + 1.23, 0]),
    T('long stays →', P ? 19 : 17, C.amber).moveTo([right - 0.92, axisY + 1.23, 0]),
  );

  await until(S(9));
  await play(fade(stepMarks), ...card([['Equal spacing', C.amber], 'Same gap every 10 min'], C.amber),
    ...say('← SHORT STAYS · LONG STAYS →', C.amber));

  await until(S(10));
  await play(out(stepMarks),
    ...card([['Borrow', C.cyan], ['Computer', C.violet], ['Study', C.amber], ['Event', C.pink]]),
    ...say('SAME GLOWING DOT & COLOUR'));

  const levels = new Map();
  const plot = visits.map(([purpose, minutes]) => {
    const level = levels.get(minutes) ?? 0;
    levels.set(minutes, level + 1);
    return {
      minutes, level, color: purposes[purpose].color,
      point: [xAt(minutes), firstY + level * stackStep, 0],
    };
  });
  const makePlotDot = ({ minutes, point, color }) => {
    const { halo, core } = plotSizes.get(minutes);
    return glow(point, color, halo, core, P ? 0.36 : 0.22);
  };
  const plotDots = plot.map(makePlotDot);
  const staged = plot.slice(0, 4).map(({ minutes, color }, index) => {
    const point = [(P ? -2.25 : -4.8) + index * (P ? 1.5 : 1.3), P ? 2.42 : axisY + 1.65, 0];
    const label = T(String(minutes), P ? 21 : 19, color, true)
      .moveTo([point[0], point[1] + 0.37, 0]);
    return { label, dot: glow(point, color, 0.18, 0.095) };
  });

  // The phone inset keeps the overview's scale and enlarges only the first 20 minutes.
  const insetY = 1.27;
  const insetFirstY = insetY + 0.34;
  const insetStep = 0.49;
  const insetX = minutes => -2.95 + minutes * 0.295;
  const insetPoint = ({ minutes, level }) => [insetX(minutes), insetFirstY + level * insetStep, 0];
  const insetDots = P ? plot.slice(0, 7).map(visitor =>
    glow(insetPoint(visitor), visitor.color, 0.147, 0.106, 0.34)) : [];
  const insetRuler = P ? new M.VGroup(
    line(insetX(0), insetY, insetX(20), insetY, C.muted, 2.5),
    ...[0, 5, 10, 15, 20].map(minutes => line(
      insetX(minutes), insetY - 0.09, insetX(minutes), insetY + 0.09,
      minutes === 10 ? C.cyan : C.muted,
    )),
    ...[0, 10, 20].map(minutes => T(String(minutes), minutes === 10 ? 22 : 18,
      minutes === 10 ? C.cyan : C.ink, true).moveTo([insetX(minutes), insetY - 0.32, 0])),
    T('minutes', 17, C.muted).moveTo([insetX(20) - 0.46, insetY - 0.68, 0]),
    T('First 20 minutes', 18, C.cyan, true).moveTo([insetX(4.2), 2.39, 0]),
  ) : null;

  function stackOutline(minutes, color) {
    const { halo } = plotSizes.get(minutes);
    const boxWidth = P ? 2 * halo + 0.055 : nearest * 1.12;
    const height = stackStep + (P ? 2 * halo + 0.09 : 0.23);
    return outline(boxWidth, height, xAt(minutes), firstY + stackStep / 2, color);
  }

  await until(S(11));
  await play(reveal(staged.flatMap(({ dot, label }) => [dot, label]), 0.95, 0.08),
    ...card([['First 4 borrowers', C.cyan], '5, 8, 10, 10 min']),
    ...say('4 BORROWERS: 5, 8, 10, 10'));

  const guides = plot.slice(0, 3).map(({ point: [x] }) =>
    line(x, axisY + 0.10, x, firstY - 0.08, C.cyan, 1));

  await until(S(12));
  await play(out(...staged.slice(0, 3).flatMap(({ dot, label }) => [dot, label])),
    reveal(plotDots.slice(0, 3), 1.05, 0.25), reveal(guides, 1.05, 0.25),
    ...(P ? [fade(insetRuler), reveal(insetDots.slice(0, 3), 1.05, 0.25)] : []),
    ...say('DOTS ABOVE 5, 8, AND 10'));

  const stack10Box = P
    ? outline(0.39, insetStep + 0.35, insetX(10), insetFirstY + insetStep / 2, C.amber)
    : stackOutline(10, C.amber);

  await until(S(13));
  await play(out(staged[3].dot, staged[3].label, ...guides), fade(plotDots[3]),
    ...(P ? [fade(insetDots[3])] : []),
    new M.Create(stack10Box, { runTime: 0.7 }),
    ...card([['Two visits at 10 min', C.amber], ['Stack = 2 dots high', C.cyan]], C.amber),
    ...say('EQUAL TIME → STACK ABOVE', C.amber));

  const across = new M.Arrow({
    start: [left, axisY - 0.73, 0], end: [xAt(45), axisY - 0.73, 0],
    color: C.cyan, strokeWidth: 2.5,
  });
  const acrossLabel = T('minutes', P ? 19 : 17, C.cyan)
    .moveTo([xAt(22), axisY - 1.12, 0]);
  const down10 = line(xAt(10), axisY + 0.09, xAt(10), firstY - 0.07, C.cyan, 1.5);

  await until(S(14));
  await play(out(stack10Box), new M.Create(across), new M.Create(down10), fade(acrossLabel),
    ...card([['Read across', C.cyan], 'This stack is at 10 min']),
    ...say('ACROSS THE LINE = MINUTES'));

  const upX = xAt(10) + (P ? 0.42 : 0.35);
  const up = new M.Arrow({
    start: [upX, firstY, 0], end: [upX, firstY + stackStep + 0.24, 0],
    color: C.amber, strokeWidth: 2.5,
  });
  const upLabel = T('2 visitors', 18, C.amber, true);
  upLabel.moveTo([upX + 0.21 + upLabel.getWidth() / 2, firstY + stackStep + 0.13, 0]);

  await until(S(15));
  await play(out(across, acrossLabel), new M.Create(up), fade(upLabel),
    ...card([['Across → 10 minutes', C.cyan], ['Up → 2 visitors', C.amber]], C.amber),
    ...say('STACK HEIGHT = HOW MANY', C.amber));

  await until(S(16));
  await play(out(down10, up, upLabel),
    ...card([['Dot plot', C.green], '1 dot = 1 visitor', ['Equal times stack up', C.amber]], C.green),
    ...say('THIS IS A DOT PLOT', C.green));

  await until(S(17));
  await play(...card([['4 of 24 dots placed', C.cyan], 'Add the rest']),
    ...say('NOW ADD THE REST'));

  const arrival12 = P ? insetPoint(plot[4]) : plot[4].point;
  const arrival15 = P ? insetPoint(plot[6]) : plot[6].point;
  const arrivalRing = P ? 0.174 : nearest * 0.49;
  const arrivalMarks = new M.VGroup(
    ring(arrival12, arrivalRing, C.ink),
    ring(P ? insetPoint(plot[5]) : plot[5].point, arrivalRing, C.ink),
    ring(arrival15, arrivalRing, C.ink),
  );
  const arrivalLabelY = P ? 2.88 : firstY + stackStep + 1.03;
  const callouts = [
    { minutes: 12, point: arrival12, x: arrival12[0] - (P ? 0.15 : 0) },
    { minutes: 15, point: arrival15, x: arrival15[0] + (P ? 0.17 : 0.76) },
  ].map(({ minutes, point, x }) => new M.VGroup(
    line(point[0], point[1] + arrivalRing + 0.04, x, arrivalLabelY - 0.21, C.cyan, 1.8),
    T(P ? String(minutes) : `${minutes} min`, P ? 22 : 18, C.cyan, true)
      .moveTo([x, arrivalLabelY, 0]),
  ));

  await until(S(18));
  await play(reveal(plotDots.slice(4, 7), 1.05, 0.22),
    ...(P ? [reveal(insetDots.slice(4, 7), 1.05, 0.22)] : []),
    fade(arrivalMarks), ...callouts.map(fade),
    ...card([['Borrow (7)', C.cyan], '12, 15, 15 added', ['Dots placed: 7 / 24', C.muted]]),
    ...say('+3 BORROWERS: 12, 15, 15'));

  await until(S(19));
  await play(out(arrivalMarks, ...callouts, ...(P ? [insetRuler, ...insetDots] : [])),
    reveal(plotDots.slice(7, 12), 1.55, 0.18),
    ...card([['Computer (5)', C.violet], '20, 25, 30, 30, 35', ['Dots placed: 12 / 24', C.muted]], C.violet),
    ...say('+5 COMPUTER: 20 TO 35', C.violet));

  await until(S(20));
  await play(reveal(plotDots.slice(12, 20), 1.8, 0.12),
    ...card([['Study (8 of 9)', C.amber], '40 to 90, two at 60', ['Dots placed: 20 / 24', C.muted]], C.amber),
    ...say('+8 STUDY: 40 TO 90', C.amber));

  const call160 = T('160 min', P ? 21 : 18, C.amber, true)
    .moveTo([right - 0.52, firstY + 0.56, 0]);

  await until(S(21));
  await play(fade(plotDots[20]), fade(call160),
    ...card([['Study (9 of 9)', C.amber], '9th visitor: 160 min', ['Dots placed: 21 / 24', C.muted]], C.amber),
    ...say('9TH STUDY: WAY OUT AT 160', C.amber));

  const hoverPoint = [xAt(90), axisY + (P ? 1.70 : 1.40), 0];
  const event90Preview = glow(hoverPoint, C.pink, P ? 0.14 : 0.16, P ? 0.092 : 0.085);
  const event90Label = T('90 min · to place', P ? 21 : 18, C.pink, true)
    .moveTo([hoverPoint[0], hoverPoint[1] + 0.42, 0]);

  await until(S(22));
  await play(out(call160), reveal(plotDots.slice(21, 23), 0.9),
    fade(event90Preview), fade(event90Label),
    ...card([['Event (3)', C.pink], '85, 90, 95 min'], C.pink),
    ...say('3 EVENT VISITORS', C.pink));

  const ring90 = ring(plot[19].point, P ? plotSizes.get(90).halo + 0.02 : nearest * 0.82, C.amber);

  await until(S(23));
  await play(new M.Create(ring90, { runTime: 0.65 }), ...say('STUDY DOT ALREADY AT 90', C.amber));

  const drop90 = new M.Arrow({
    start: [xAt(90), hoverPoint[1] - 0.24, 0],
    end: [xAt(90), plot[23].point[1] + 0.14, 0],
    color: C.pink, strokeWidth: 2,
  });

  await until(S(24));
  await play(new M.Create(drop90, { runTime: 0.65 }), ...say('WHERE DOES EVENT 90 GO?', C.pink));

  await until(S(25));
  await play(out(ring90, drop90, event90Preview, event90Label), fade(plotDots[23]),
    ...say('RIGHT ON TOP AT 90!', C.pink));

  const stack90Box = stackOutline(90, C.green);

  await until(S(26));
  await play(new M.Create(stack90Box, { runTime: 0.7 }),
    ...card([['At 90 minutes', C.green], ['1 Study', C.amber], ['1 Event', C.pink]], C.green),
    ...say('SAME TIME → SHARE A STACK', C.green));

  await until(S(27));
  await play(out(stack90Box), ...card([['24 dots in all', C.cyan], '1 dot = 1 visitor']),
    ...say('24 DOTS = 24 VISITORS'));

  await until(S(28));
  await play(...card([['Duration', C.cyan], 'How long a visit lasts']),
    ...say('DURATION = LENGTH OF VISIT'));

  const varyingTimes = [0, 9, 16, 20].map(index => {
    const { minutes, point, color } = plot[index];
    return new M.Flash({ getCenter: () => point }, {
      color, flashRadius: plotSizes.get(minutes).halo + 0.04,
      lineLength: 0.09, numLines: 6, runTime: 0.55,
    });
  });

  await until(S(29));
  await play(new M.LaggedStart(varyingTimes, { lagRatio: 0.24, runTime: 1.4 }),
    ...card([['Variable', C.amber], 'Changes from person to person', ['5 to 160 minutes', C.muted]], C.amber),
    ...say('VARIES BY PERSON → VARIABLE', C.amber));

  await until(S(30));
  await play(...card([['Last time: Reason', C.violet], ['Borrow', C.cyan], ['Study', C.amber]], C.violet),
    ...say('LAST TIME: REASON (WORDS)', C.violet));

  await until(S(31));
  await play(...card([['Numerical variable', C.green], 'Measured as a number', ['5, 8, 10, …, 160', C.cyan]], C.green),
    ...say('DURATION = NUMERICAL VARIABLE', C.green));

  await until(S(32));
  await play(...card([['Numerical variables', C.green], ['Duration', C.cyan], 'Age, height, and price'], C.green),
    ...say('AGE · HEIGHT · PRICE', C.green));

  await until(S(33));
  await play(...card([['Look at the pattern', C.cyan], 'Across the number line']),
    ...say('LOOK AT THE PATTERN'));

  const patternY = firstY + stackStep + (P ? 0.66 : 0.57);
  const lowBox = outline(xAt(18) - xAt(2), stackStep + (P ? 0.32 : 0.27),
    xAt(10), firstY + stackStep / 2, C.cyan);
  const lowLabel = T('7', P ? 24 : 19, C.cyan, true).moveTo([xAt(10), patternY, 0]);

  await until(S(34));
  await play(new M.Create(lowBox, { runTime: 0.75 }), fade(lowLabel),
    ...card([['Under 20 min', C.cyan], '7 quick borrows']),
    ...say('7 DOTS CROWD UNDER 20 MIN'));

  const midY = firstY + stackStep + (P ? 0.28 : 0.23);
  const midBrace = new M.VGroup(
    line(xAt(20), midY, xAt(75), midY, C.violet, 2.5),
    line(xAt(20), midY - 0.13, xAt(20), midY, C.violet),
    line(xAt(75), midY - 0.13, xAt(75), midY, C.violet),
    T('spread', P ? 21 : 17, C.violet, true).moveTo([xAt(47.5), patternY, 0]),
  );

  await until(S(35));
  await play(fade(midBrace), ...card([['20 to 75 minutes', C.violet], '12 dots spread out'], C.violet),
    ...say('20 TO 75: SPREAD IN MIDDLE', C.violet));

  const highBox = outline(xAt(98) - xAt(82), stackStep + (P ? 0.32 : 0.27),
    xAt(90), firstY + stackStep / 2, C.pink);
  const highLabel = T('4', P ? 24 : 19, C.pink, true).moveTo([xAt(90), patternY, 0]);

  await until(S(36));
  await play(new M.Create(highBox, { runTime: 0.75 }), fade(highLabel),
    ...card([['85 to 95 minutes', C.pink], '4 dots gather here'], C.pink),
    ...say('4 GATHER AT 85 TO 95 MIN', C.pink));

  const gapLine = new M.DashedLine({
    start: [xAt(100), firstY, 0], end: [xAt(P ? 153 : 154), firstY, 0], color: C.muted,
  });
  const gapLabel = T('wide gap', P ? 19 : 16, C.muted, true)
    .moveTo([xAt(125), firstY + (P ? 0.43 : 0.36), 0]);
  const outlierRing = ring(plot[20].point, P ? 0.19 : 0.20, C.amber);

  await until(S(37));
  await play(new M.Create(gapLine, { runTime: 0.85 }), fade(gapLabel),
    new M.Create(outlierRing, { runTime: 0.75 }),
    ...card([['95 to 160: wide gap', C.muted], ['1 lonely dot at 160', C.amber]], C.amber),
    ...say('WIDE GAP → 1 DOT AT 160', C.amber));

  const outlierLabel = T('outlier', P ? 21 : 17, C.amber, true);
  outlierLabel.moveTo([right - outlierLabel.getWidth() / 2 + 0.1, patternY, 0]);

  await until(S(38));
  await play(fade(outlierLabel),
    ...card([['Outlier', C.amber], 'Far from the rest', ['160 minutes here', C.muted]], C.amber),
    ...say('OUTLIER = FAR FROM THE REST', C.amber));

  await until(S(39));
  await play(...card([['What a dot plot shows', C.green], 'The shape of the data'], C.green),
    ...say('WHAT A DOT PLOT IS FOR', C.green));

  await until(S(40));
  await play(...card([['Where numbers bunch', C.cyan], ['How they spread', C.violet],
    ['Any outlier far away', C.amber]], C.green), ...say('BUNCH · SPREAD · OUTLIERS', C.green));

  await until(S(41));
  await play(out(lowBox, lowLabel, midBrace, highBox, highLabel, gapLine, gapLabel, outlierRing, outlierLabel),
    ...card([['Best for small groups', C.cyan], 'Like our 24 visitors']),
    ...say('BEST FOR A SMALL GROUP (24)'));

  await until(S(42));
  await play(...card([['Common trap', C.pink], 'Too many exact times'], C.pink),
    ...say('WATCH OUT: A COMMON TRAP', C.pink));

  const zoomRuler = makeRuler(10, true);

  await until(S(43));
  await play(out(...rulerParts(ruler), legend, ...plotDots), ...showRuler(zoomRuler),
    ...card([['2,000 visitors', C.pink], 'Timed to the second'], C.pink, true),
    ...say('2,000 VISITORS · BY SECOND', C.pink));

  function zoomVisitor(second, color) {
    const x = zoomRuler.x(second);
    const y = axisY + (P ? 0.46 : 0.37);
    const dot = glow([x, y, 0], color, P ? 0.21 : 0.16, P ? 0.125 : 0.095);
    const label = T(`10:${String(second).padStart(2, '0')}`, P ? 23 : 18, color, true)
      .moveTo([x, y + 0.52, 0]);
    return new M.VGroup(dot, label);
  }

  const zoomA = zoomVisitor(2, C.cyan);
  const zoomB = zoomVisitor(5, C.amber);

  await until(S(44));
  await play(fade(zoomA), ...card([['Visitor A', C.cyan], '10 min 02 sec'], C.cyan, true),
    ...say('10 MIN 02 SEC'));

  await until(S(45));
  await play(fade(zoomB),
    ...card([['Visitor A: 10m 02s', C.cyan], ['Visitor B: 10m 05s', C.amber]], C.amber, true),
    ...say('10 MIN 05 SEC', C.amber));

  const sideY = axisY + (P ? 1.35 : 1.18);
  const sideGuide = line(zoomRuler.x(2), sideY, zoomRuler.x(5), sideY, C.pink);
  const sideLabel = T('side by side', P ? 21 : 17, C.pink, true)
    .moveTo([(zoomRuler.x(2) + zoomRuler.x(5)) / 2, sideY + 0.34, 0]);

  await until(S(46));
  await play(new M.Create(sideGuide), fade(sideLabel),
    ...card([['Different times', C.pink], 'Different spots on the line'], C.pink, true),
    ...say('DIFFERENT TIMES · SIDE BY SIDE', C.pink));

  const crowdRuler = makeRuler();
  const blur = new M.Rectangle({ width: width * 0.98, height: 0.22, color: C.cyan, strokeWidth: 0 });
  blur.setStrokeOpacity(0);
  blur.setFill(C.cyan, 0.38);
  blur.moveTo([0, firstY, 0]);
  const crowdMarks = Array.from({ length: 96 }, (_, i) => {
    const x = left + (i + 1) * width / 97;
    return disk([x, firstY + (i % 5 - 2) * 0.026, 0], P ? 0.07 : 0.09, C.cyan, 0.66);
  });
  const crowd = new M.VGroup(blur, ...crowdMarks);
  const blurLabel = T('2,000 dots blur together', P ? 22 : 18, C.pink, true)
    .moveTo([0, firstY + 0.57, 0]);

  await until(S(47));
  await play(out(...rulerParts(zoomRuler), zoomA, zoomB, sideGuide, sideLabel),
    ...showRuler(crowdRuler), fade(crowd), fade(blurLabel),
    ...card([['2,000 visitors', C.pink], 'The pattern is hard to see'], C.pink, true),
    ...say('BLURRED DOTS HIDE THE PATTERN', C.pink));

  const groupedRuler = makeRuler(180);
  const groupedBars = [];
  for (let start = 0; start < 180; start += 20) {
    const count = visits.filter(([, minutes]) => minutes >= start && minutes < start + 20).length;
    if (!count) continue;
    const barWidth = groupedRuler.x(20) - groupedRuler.x(0);
    const height = count * 0.20;
    const bar = new M.Rectangle({ width: barWidth, height, color: C.green, strokeWidth: 1.5 });
    bar.setFill(C.cyan, 0.66);
    bar.moveTo([groupedRuler.x(start + 10), axisY + height / 2, 0]);
    groupedBars.push(bar);
  }
  const groupedLabel = T('24 visits in 20-minute groups', P ? 21 : 17, C.green, true)
    .moveTo([P ? 0 : -1.5, axisY + 1.98, 0]);

  await until(S(48));
  await play(out(...rulerParts(crowdRuler), crowd, blurLabel), ...showRuler(groupedRuler),
    reveal(groupedBars, 1.0), fade(groupedLabel),
    ...card([['20-minute groups', C.green], 'Bar height = visits'], C.green, true),
    ...say('NEXT: GROUP NEARBY TIMES', C.green));

  const recapRuler = makeRuler();
  const recapDots = plot.map(makePlotDot);
  const recapLegend = makeLegend();

  await until(S(49));
  await play(out(...rulerParts(groupedRuler), ...groupedBars, groupedLabel),
    ...showRuler(recapRuler), reveal(recapDots, 1.35, 0.04), fade(recapLegend),
    ...card([['Dot plot', C.cyan], '1 dot = 1 visitor', 'Above a number line', ['Equal times stack up', C.amber]]),
    ...say('1 DOT PER VISITOR · STACK EQUAL'));
}
