export default async function (L) {
  const { M, P, C, S, T, pill, showA, until, play } = L;

  const visits = [
    [5, C.cyan], [8, C.cyan], [10, C.cyan], [10, C.cyan],
    [12, C.cyan], [15, C.cyan], [15, C.cyan],
    [20, C.violet], [25, C.violet], [30, C.violet], [30, C.violet], [35, C.violet],
    [40, C.amber], [45, C.amber], [50, C.amber], [55, C.amber],
    [60, C.amber], [60, C.amber], [75, C.amber], [85, C.pink],
    [90, C.amber], [90, C.pink], [95, C.pink], [160, C.amber],
  ];
  const bins = [
    { left: 0, right: 20, color: C.cyan },
    { left: 20, right: 60, color: C.amber },
    { left: 60, right: 180, color: C.pink },
  ].map(bin => {
    const width = bin.right - bin.left;
    const count = visits.filter(([v]) => v >= bin.left && v < bin.right).length;
    const share = 100 * count / visits.length;
    return { ...bin, width, count, share, density: share / width };
  });
  const visitBins = visits.map(([v]) => bins.findIndex(({ left, right }) => v >= left && v < right));
  const shares = bins.map(({ share }) => {
    const rounded = share.toFixed(1);
    return `${Number(rounded) === share ? '' : '≈'}${rounded}%`;
  });

  const x0 = P ? -2.86 : -5.85;
  const span = P ? 6.32 : 7.75;
  const cx = x0 + span / 2;
  const base = P ? -2.48 : -1.84;
  const height = P ? 4.74 : 3.02;
  const top = base + height;
  const pillPos = P ? [0, 3.55, 0] : [cx, 1.96, 0];
  const cardPos = P ? [0, -5.68, 0] : [4.48, -0.32, 0];
  const axisSize = P ? 20 : 16;
  const keySize = P ? 22 : 19;
  const x = v => x0 + v * span / 180;
  const countY = (v, max) => base + v * height / max;
  const densityY = v => base + v * height / 1.6;
  const at = (xx, yy) => [xx, yy, 0];
  const text = (s, size, color, xx, yy, mono = true, bold = false) =>
    T(s, size, color, mono, bold).moveTo(at(xx, yy));
  const line = (x1, y1, x2, y2, color, strokeWidth = 2) =>
    new M.Line({ start: at(x1, y1), end: at(x2, y2), color, strokeWidth });
  const dash = (x1, y1, x2, y2, color) =>
    new M.DashedLine({ start: at(x1, y1), end: at(x2, y2), color });
  const rect = (xx, yy, width, h, color, fill, strokeWidth = 2) => {
    const shape = new M.Rectangle({ width, height: h, color, strokeWidth });
    shape.setFill(color, fill);
    return shape.moveTo(at(xx, yy));
  };
  const bar = (left, right, y, color, fill = 0.79, stroke = 2) =>
    rect(x((left + right) / 2), (base + y) / 2, x(right) - x(left), y - base, color, fill, stroke);
  const paint = (shape, color, fill) => {
    shape.setColor(color);
    shape.setFill(color, fill);
  };
  const enter = (item, runTime = 0.45) => new M.FadeIn(item, { runTime });
  const leave = (item, runTime = 0.32) => new M.FadeOut(item, { runTime });
  const draw = (item, runTime = 0.53) => new M.Create(item, { runTime });
  const fade = (...items) => items.map(item => leave(item));
  const sequence = (animations, runTime = 1.05, lagRatio = 0.1) =>
    new M.LaggedStart(animations, { runTime, lagRatio });
  const pulse = (item, color) => new M.Indicate(item, { color, runTime: 0.75 });

  let currentPill;
  function say(label, color = C.cyan) {
    if (!P) return showA(label, color, pillPos);
    const next = pill(label, color, 20).moveTo(pillPos);
    const animation = currentPill
      ? sequence([leave(currentPill, 0.18), enter(next, 0.27)], 0.45, 1)
      : enter(next);
    currentPill = next;
    return [animation];
  }

  let currentCard;
  function card(rows, color = C.cyan) {
    const labels = rows.map(row => {
      const [s, ink] = Array.isArray(row) ? row : [row, C.ink];
      return T(s, P ? 22 : 20, ink, true);
    });
    const pitch = P ? 0.49 : 0.43;
    const width = Math.max(...labels.map(label => label.getWidth())) + 0.62;
    const h = rows.length * pitch + 0.34;
    const [xx, centerY] = cardPos;
    const yy = centerY - (P && rows.length === 3 ? 0.30 : 0);
    const frame = new M.RoundedRectangle({
      width, height: h, cornerRadius: 0.17, color, strokeWidth: 2,
    });
    frame.setFill(C.card, 0.95).moveTo(at(xx, yy));
    labels.forEach((label, i) => {
      label.moveTo(at(
        xx - width / 2 + 0.31 + label.getWidth() / 2,
        yy + ((labels.length - 1) / 2 - i) * pitch,
      ));
    });
    const next = new M.VGroup(frame, ...labels);
    const animation = currentCard
      ? sequence([leave(currentCard, 0.22), enter(next, 0.32)], 0.54, 1)
      : enter(next);
    currentCard = next;
    return animation;
  }

  function xAxis(ticks, map = x) {
    const left = map(ticks[0]);
    const right = map(ticks[ticks.length - 1]);
    const items = [line(left, base, right, base, C.muted, 2.5)];
    for (const v of ticks) {
      items.push(
        line(map(v), base - 0.07, map(v), base + 0.07, C.muted),
        text(String(v), axisSize, C.ink, map(v), base - 0.29),
      );
    }
    items.push(text('minutes', axisSize, C.ink, right - 0.36, base - 0.66, false));
    return new M.VGroup(...items);
  }

  function yAxis(ticks, yOf, format, unit, left = x(0), right = x(180)) {
    const items = [line(left, base, left, top, C.muted)];
    for (const v of ticks) {
      const y = yOf(v);
      const label = T(format(v), axisSize, C.ink, true);
      label.moveTo(at(left - 0.11 - label.getWidth() / 2, y));
      items.push(
        line(left, y, right, y, C.line, 1),
        line(left - 0.07, y, left, y, C.muted),
        label,
      );
    }
    const title = T(unit, axisSize, C.ink);
    title.moveTo(at(left + title.getWidth() / 2, top + 0.25));
    return new M.VGroup(...items, title);
  }

  function bracket(x1, x2, y, s, color, { above = false, size = keySize, labelOffset = 0.26 } = {}) {
    return new M.VGroup(
      line(x1, y, x2, y, color, 2.2),
      line(x1, y - 0.07, x1, y + 0.07, color, 2.2),
      line(x2, y - 0.07, x2, y + 0.07, color, 2.2),
      text(s, size, color, (x1 + x2) / 2, y + (above ? labelOffset : -labelOffset)),
    );
  }

  const widthY = base - (P ? 1.04 : 0.88);
  const widthMark = (left, right, label, color, options) =>
    bracket(x(left), x(right), widthY, label, color, options);

  function dotAt(xx, yy, color, { backing = false, ring } = {}) {
    const point = at(xx, yy);
    const halo = new M.Dot({ point, radius: 0.10, color, strokeWidth: 0 });
    halo.setFill(color, 0.29);
    const dot = new M.Dot({ point, radius: P ? 0.071 : 0.066, color, strokeWidth: 0 });
    dot.setFill(color, 1);
    const layers = [halo];
    if (ring) {
      const edge = new M.Dot({ point, radius: 0.111, color: ring, strokeWidth: 0 });
      edge.setFill(ring, 1);
      layers.push(edge);
    }
    if (backing) {
      const rim = new M.Dot({ point, radius: 0.089, color: C.bg, strokeWidth: 0 });
      rim.setFill(C.bg, 1);
      layers.push(rim);
    }
    return new M.VGroup(...layers, dot);
  }

  // Stack nearby marks while keeping every dot at its recorded minute.
  const rows = [];
  visits.forEach(([v], i) => {
    const used = new Set();
    for (let j = i - 1; j >= 0 && x(v) - x(visits[j][0]) < 0.20; j--) {
      used.add(rows[j]);
    }
    let row = 0;
    while (used.has(row)) row++;
    rows.push(row);
  });
  const plotDot = (k, floor, color = visits[k][1], backing = false) =>
    dotAt(x(visits[k][0]), floor + rows[k] * (P ? 0.28 : 0.23), color, { backing });

  const equalTicks = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180];
  const unequalTicks = [0, 20, 60, 120, 180];
  const x20 = xAxis(equalTicks);
  const y8 = yAxis([2, 4, 6, 8], v => countY(v, 8), String, 'visits');
  const oldBars = Array.from({ length: 9 }, (_, i) => {
    const left = 20 * i;
    const right = left + 20;
    const count = visits.filter(([v]) => v >= left && v < right).length;
    if (!count) return null;
    const y = countY(count, 8);
    return {
      shape: bar(left, right, y, C.cyan, 0.73, 1.8),
      label: text(String(count), keySize, C.cyan, x(left + 10), y + 0.23),
    };
  });
  const oldItems = oldBars.filter(Boolean).flatMap(({ shape, label }) => [shape, label]);

  await until(S(0));
  await play(
    enter(x20), enter(y8), sequence(oldItems.map(item => enter(item)), 1.2),
    card(['24 library visits', '20 minutes in each bin']), ...say('VISIT TIMES'),
  );

  const gapBox = rect(x(130), base + 0.31, x(160) - x(100) - 0.08, 0.55, C.amber, 0);
  const zeros = [110, 130, 150].map(v => text('0', keySize, C.amber, x(v), base + 0.30));
  await until(S(1));
  paint(oldBars[8].shape, C.amber, 0.85);
  oldBars[8].label.setColor(C.amber);
  await play(draw(gapBox), ...zeros.map(zero => enter(zero)), ...say('TINY BARS AND EMPTY GAPS', C.amber));

  const longMark = widthMark(60, 180, 'long visits', C.amber);
  await until(S(2));
  await play(...fade(gapBox, ...zeros), enter(longMark), ...say('CAN WE GROUP LONG VISITS?', C.amber));

  const purposeDots = visits.map((_, k) => plotDot(k, base + 0.23));
  await until(S(3));
  await play(
    ...fade(...oldItems, y8, longMark),
    sequence(purposeDots.map(dot => enter(dot)), 1.18, 0.05),
    card(['One dot is one visit', 'Position shows its time']), ...say('24 VISITS'),
  );

  const xUnequal = xAxis(unequalTicks);
  const floatY = top - (P ? 0.71 : 0.67);
  const walls = [0, 20, 60, 180].map(v => dash(x(v), base, x(v), floatY - 0.19, C.muted));
  const dots = visits.map((_, k) => plotDot(k, floatY, C.muted, true));
  function highlightBin(index) {
    dots.forEach((dot, k) => {
      if (visitBins[k] !== index) return;
      const [halo, , center] = dot.submobjects;
      paint(halo, bins[index].color, 0.29);
      paint(center, bins[index].color, 1);
    });
  }

  await until(S(4));
  await play(
    leave(x20), enter(xUnequal), ...fade(...purposeDots),
    sequence([
      sequence(walls.map(wall => draw(wall)), 0.45),
      sequence(dots.map(dot => enter(dot)), 0.62, 0.04),
    ], 1.07, 1),
    card(['A bin is a range', 'of visit times']), ...say('THREE UNEQUAL BINS', C.amber),
  );

  const trays = bins.map(({ left, right, color }) => bar(left, right, base + 0.15, color, 0.29, 1.5));
  const marks = bins.map(({ left, right, color, width }, i) =>
    widthMark(left, right, `${width} min`, color, { labelOffset: P && i === 1 ? 0.69 : 0.26 }));

  await until(S(5));
  highlightBin(0);
  await play(enter(trays[0]), enter(marks[0]),
    card([['0–20 minutes', C.cyan], '20 minutes wide']), ...say('FIRST BIN'));

  await until(S(6));
  highlightBin(1);
  await play(enter(trays[1]), enter(marks[1]),
    card([['20–60 minutes', C.amber], 'The 20-min dot goes here'], C.amber), ...say('MIDDLE BIN', C.amber));

  await until(S(7));
  highlightBin(2);
  await play(enter(trays[2]),
    card([['60–180 minutes', C.pink], 'The 60-min dots go here'], C.pink), ...say('LAST BIN', C.pink));

  await until(S(8));
  await play(enter(marks[2]), card(['60–180 minutes', ['120 minutes = 2 hours', C.pink]], C.pink),
    ...say('THE WIDEST BIN', C.pink));

  const trayCounts = bins.map(({ left, right, count, color }) =>
    text(String(count), keySize, color, x((left + right) / 2), base + (P ? 1.54 : 1.30)));
  await until(S(9));
  await play(
    sequence(dots.map((dot, k) =>
      new M.Transform(dot, plotDot(k, base + 0.32, bins[visitBins[k]].color, true))), 1.16, 0.04),
    ...trayCounts.map(label => enter(label)),
    card([['7 + 9 + 8 = 24 visits', C.green], 'A dot on a bin edge', 'goes in the bin to its right'], C.green),
    ...say('COUNT THE DOTS', C.green),
  );

  const y10 = yAxis([2, 4, 6, 8, 10], v => countY(v, 10), String, 'visits');
  const countBars = bins.map(({ left, right, count }) => bar(left, right, countY(count, 10), C.cyan));
  const countLabels = bins.map(({ left, right, count }) =>
    text(String(count), keySize, C.bg, x((left + right) / 2), countY(count, 10) - 0.29, true, true));
  await until(S(10));
  await play(
    ...fade(...dots, ...walls, ...trays, ...trayCounts), enter(y10),
    ...countBars.map(shape => enter(shape)), ...countLabels.map(label => enter(label)),
    card(['Bar height shows', 'the visit count']), ...say('COUNT HISTOGRAM'),
  );

  const lastCountY = countY(8, 10);
  const height8 = line(x(180) + 0.14, base, x(180) + 0.14, lastCountY, C.pink, 2.5);
  await until(S(11));
  paint(countBars[2], C.pink, 0.81);
  await play(draw(height8), pulse(marks[2], C.pink),
    card([['Height = 8 visits', C.pink], 'Width = 120 minutes'], C.pink), ...say('THE LAST BAR', C.pink));

  const areaOutline = (left, right, y, color) =>
    rect(x((left + right) / 2), (base + y) / 2, x(right) - x(left) - 0.08, y - base - 0.08, color, 0, 3);
  const bigArea = areaOutline(60, 180, lastCountY, C.pink);
  const countTag = s => text(s, keySize, C.bg, x(120), (base + lastCountY) / 2, false, true);
  const bigTag = countTag('Largest area');
  await until(S(12));
  countBars[0].setFill(C.cyan, 0.55);
  countBars[1].setFill(C.cyan, 0.55);
  await play(draw(bigArea), enter(bigTag),
    card(['Last bar covers more', 'than both others together'], C.pink), ...say('THE SHADED SPACE', C.pink));

  const questionTag = countTag('Most visits?');
  await until(S(13));
  await play(sequence([leave(bigTag, 0.18), enter(questionTag, 0.26)], 0.44, 1),
    card(['The wide bar makes', 'long visits look common'], C.pink), ...say('THE AREA CAN MISLEAD', C.pink));

  const thirdTag = countTag('8 of 24 = 1/3');
  await until(S(14));
  paint(countBars[2], C.amber, 0.84);
  await play(...fade(bigArea, height8), sequence([leave(questionTag, 0.18), enter(thirdTag, 0.26)], 0.44, 1),
    card(['8 + 8 + 8 = 24', ['Long visits are one third', C.amber]], C.amber), ...say('ONLY ONE THIRD', C.amber));

  const countOutlines = bins.map(({ left, right, count }) => areaOutline(left, right, countY(count, 10), C.amber));
  await until(S(15));
  countBars[0].setFill(C.cyan, 0.70);
  countBars[1].setFill(C.cyan, 0.70);
  paint(countBars[2], C.pink, 0.77);
  await play(leave(thirdTag), sequence(countOutlines.map(shape => draw(shape))),
    card(['Area is the shaded space', 'inside a bar'], C.amber), ...say('YOUR EYE JUDGES AREA', C.amber));

  await until(S(16));
  await play(sequence(countOutlines.map(shape => pulse(shape, C.green)), 1.05),
    card([['Area should match', C.green], 'the share of all visits'], C.green), ...say('THE RULE FOR FAIR BARS', C.green));

  const sandBase = P ? -2.04 : -1.62;
  const narrowWidth = P ? 1.10 : 1.20;
  const narrowHeight = P ? 3.10 : 2.16;
  const wideWidth = 3 * narrowWidth;
  const wideHeight = narrowHeight / 3;
  const sandX1 = P ? -2.35 : -4.90;
  const sandX2 = P ? 1.11 : -1.00;
  function boxWalls(xx, width) {
    const left = xx - width / 2;
    const right = xx + width / 2;
    const rim = sandBase + narrowHeight + 0.30;
    return new M.VGroup(
      line(left, rim, left, sandBase, C.muted, 2.5),
      line(left, sandBase, right, sandBase, C.muted, 2.5),
      line(right, sandBase, right, rim, C.muted, 2.5),
    );
  }
  const narrowBox = boxWalls(sandX1, narrowWidth);
  const wideBox = boxWalls(sandX2, wideWidth);
  const narrowSand = rect(sandX1, sandBase + narrowHeight / 2, narrowWidth, narrowHeight, C.amber, 0.81);
  const wideSand = rect(sandX2, sandBase + wideHeight / 2, wideWidth, wideHeight, C.amber, 0.81);
  const arrow = (x1, y1, x2, y2, color) => new M.Arrow({
    start: at(x1, y1), end: at(x2, y2), color, strokeWidth: 3,
  });
  const pourY = sandBase + narrowHeight * 0.54;
  const pour = arrow(sandX1 + narrowWidth / 2 + 0.16, pourY,
    sandX2 - wideWidth / 2 - 0.16, pourY, C.cyan);
  const sandCaptionY = sandBase - (P ? 0.56 : 0.37);
  const tallPile = text('Tall pile', P ? 22 : 17, C.amber, sandX1, sandCaptionY, false);
  const lowPile = text('Low pile', P ? 22 : 17, C.amber, sandX2, sandCaptionY, false);
  const sandItems = [narrowBox, narrowSand, tallPile, pour, wideBox, wideSand, lowPile];

  await until(S(17));
  await play(
    ...fade(...countBars, ...countLabels, ...countOutlines, y10, xUnequal, ...marks),
    sequence(sandItems.map(item => enter(item)), 1.42),
    card(['The same sand spreads', 'across a wider box'], C.amber), ...say('SAME SAND, LOWER PILE', C.amber),
  );

  const sandSlices = Array.from({ length: 11 }, (_, i) => {
    const xx = sandX2 - wideWidth / 2 + wideWidth * (i + 1) / 12;
    return line(xx, sandBase, xx, sandBase + wideHeight, C.bg, 1.4);
  });
  await until(S(18));
  await play(sequence(sandSlices.map(slice => draw(slice)), 0.98),
    card(['Spread the share evenly', 'across the bin’s minutes']), ...say('AN EQUAL SHARE PER MINUTE'));

  const xMiddle = xAxis(unequalTicks);
  const guides = [0, 20, 60, 180].map(v => dash(x(v), base, x(v), top, C.muted));
  const middleFloor = bar(20, 60, base + 0.18, C.amber, 0.34);
  const middleMark = widthMark(20, 60, '40 min', C.amber);
  await until(S(19));
  await play(
    ...fade(...sandItems, ...sandSlices), enter(xMiddle),
    ...guides.map(guide => enter(guide)), enter(middleFloor), enter(middleMark),
    card(['20–60 minutes', ['Width = 40 minutes', C.amber]], C.amber), ...say('START WITH THE MIDDLE BIN', C.amber),
  );

  const middleDots = visits.flatMap(([v], k) => visitBins[k] === 1 ? [plotDot(k, base + 0.33, visits[k][1], v === 20)] : []);
  await until(S(20));
  await play(sequence(middleDots.map(dot => enter(dot)), 0.9),
    card([['9 of the 24 visits', C.amber]], C.amber), ...say('COUNT THE MIDDLE BIN', C.amber));

  await until(S(21));
  await play(card([['Percent (%)', C.cyan], 'means out of 100']), ...say('WHAT DOES PERCENT MEAN?'));

  const blockSpan = P ? 6.68 : 7.25;
  const blockCenter = P ? 0 : cx;
  const blockY = P ? 0.05 : base + 0.57 * height;
  const blockHeight = P ? 0.82 : 0.61;
  const groupGap = P ? 0.28 : 0.17;
  const blockGap = 0.028;
  const blockWidth = (blockSpan - 3 * groupGap - 20 * blockGap) / 24;
  const blockX = i => blockCenter - blockSpan / 2 + blockWidth / 2
    + Math.floor(i / 6) * (6 * blockWidth + 5 * blockGap + groupGap)
    + (i % 6) * (blockWidth + blockGap);
  const blocks = Array.from({ length: 24 }, (_, i) =>
    rect(blockX(i), blockY, blockWidth, blockHeight,
      i < 6 ? C.cyan : C.muted, i < 6 ? 0.86 : 0.22, 1.2));
  const blockMark = (first, last, label, color, above = false) =>
    bracket(blockX(first) - blockWidth / 2, blockX(last) + blockWidth / 2,
      blockY + (above ? 1 : -1) * (blockHeight / 2 + 0.26), label, color, { above });
  const sixMark = blockMark(0, 5, '25%', C.cyan);
  await until(S(22));
  await play(
    ...fade(...middleDots, middleFloor, ...guides, xMiddle, middleMark),
    sequence(blocks.map(block => enter(block)), 1.0, 0.04), enter(sixMark),
    card(['4 groups of 6 make 24', ['6 visits = 1/4 = 25%', C.cyan]]), ...say('ONE GROUP OF SIX'),
  );

  const threeMark = blockMark(6, 8, '12.5%', C.amber);
  await until(S(23));
  blocks.slice(6, 9).forEach(block => paint(block, C.amber, 0.88));
  await play(enter(threeMark), card(['3 is half of 6', ['3 more visits = 12.5%', C.amber]], C.amber),
    ...say('THREE MORE VISITS', C.amber));

  const nineMark = blockMark(0, 8, '37.5%', C.green, true);
  await until(S(24));
  await play(enter(nineMark), card(['6 + 3 = 9 visits', ['25% + 12.5% = 37.5%', C.green]], C.green),
    ...say('THE MIDDLE BIN’S SHARE', C.green));

  // The fill spans the whole bin. Divider strokes mark the 39 interior minute boundaries.
  const { left: middleLeft, right: middleRight, width: middleWidth, density: middleDensity } = bins[1];
  const zoomX = v => x0 + (v - middleLeft) * span / middleWidth;
  const xStrips = xAxis([20, 30, 40, 50, 60], zoomX);
  const stripMark = bracket(zoomX(middleLeft), zoomX(middleRight), widthY, '40 min', C.amber);
  const middleY = densityY(middleDensity);
  const stripStartY = base + 0.27;
  const stripFill = (y, color, opacity) =>
    rect(cx, (base + y) / 2, span, y - base, color, opacity, 0);
  const stripDividers = y => Array.from({ length: middleWidth - 1 }, (_, i) => {
    const minute = i + 1;
    const xx = zoomX(middleLeft + minute);
    return line(xx, base, xx, y, C.bg, minute % 10 === 0 ? 1.5 : 0.8);
  });
  const stripBody = stripFill(stripStartY, C.cyan, 0.72);
  const dividers = new M.VGroup(...stripDividers(stripStartY));
  await until(S(25));
  await play(
    ...fade(...blocks, sixMark, threeMark, nineMark), enter(xStrips), enter(stripMark),
    enter(stripBody), enter(dividers),
    card([['40 one-minute strips', C.cyan], '10 strips between ticks']), ...say('SLICE THE MIDDLE BIN'),
  );

  const formatDensity = v => `${v.toFixed(1)}%`;
  const densityTicks = [0.5, 1, 1.5];
  const zoomDensity = yAxis(densityTicks, densityY, formatDensity, '% per minute', zoomX(middleLeft), zoomX(middleRight));
  await until(S(26));
  await play(
    enter(zoomDensity),
    new M.Transform(stripBody, stripFill(middleY, C.amber, 0.86), { runTime: 0.95 }),
    new M.Transform(dividers, new M.VGroup(...stripDividers(middleY)), { runTime: 0.95 }),
    card([['Share = 37.5%', C.amber], 'Split it across 40 minutes'], C.amber), ...say('SPREAD THE SHARE EVENLY', C.amber),
  );

  const onePercent = dash(zoomX(middleLeft), densityY(1), zoomX(middleRight), densityY(1), C.green);
  const onePercentLabel = text('1% per minute', keySize, C.green, zoomX(48), densityY(1) + 0.34, false, true);
  await until(S(27));
  await play(draw(onePercent), enter(onePercentLabel),
    card(['37.5% ÷ 40 min', ['≈ 0.94% per minute', C.amber]], C.amber),
    ...say('JUST UNDER 1% PER MINUTE', C.amber));

  const middleHeight = arrow(zoomX(20.5), base + 0.08, zoomX(20.5), middleY - 0.06, C.cyan);
  await until(S(28));
  await play(draw(middleHeight), pulse(stripMark, C.cyan),
    card([['Area = height × width', C.cyan]]), ...say('CHECK THE AREA'));

  await until(S(29));
  await play(pulse(middleHeight, C.cyan), pulse(stripMark, C.amber),
    card(['Just under 1% per min', ['× 40 min gives under 40%', C.amber]], C.amber), ...say('A QUICK AREA CHECK', C.amber));

  const xDensity = xAxis(unequalTicks);
  const yDensity = yAxis(densityTicks, densityY, formatDensity, '% per minute');
  const densityBars = bins.map(({ left, right, density, color }) => bar(left, right, densityY(density), color));
  const shareNoteY = P ? -4.46 : -3.47;
  function shareNotes(indices) {
    return new M.VGroup(...indices.map(i => {
      const { left, right, color } = bins[i];
      const xx = x0 + span * (i + 0.5) / 3;
      const heading = T(`${left}–${right} min`, P ? 17 : 15, C.ink, true);
      const value = T(`Share ${shares[i]}`, P ? 19 : 18, color, true, true);
      const w = Math.max(heading.getWidth(), value.getWidth()) + 0.28;
      const h = P ? 0.80 : 0.68;
      const frame = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.12, color, strokeWidth: 1.6 });
      frame.setFill(C.card, 0.95).moveTo(at(xx, shareNoteY));
      heading.moveTo(at(xx, shareNoteY + h * 0.22));
      value.moveTo(at(xx, shareNoteY - h * 0.20));
      return new M.VGroup(frame, heading, value);
    }));
  }

  const middleOnly = shareNotes([1]);
  const narrowAndMiddle = shareNotes([0, 1]);
  const allShares = shareNotes([0, 1, 2]);
  await until(S(30));
  await play(
    ...fade(stripBody, dividers, xStrips, zoomDensity, stripMark, onePercent, onePercentLabel, middleHeight),
    enter(xDensity), enter(yDensity), enter(densityBars[1]), enter(middleOnly),
    card(['0.9375% per min × 40 min', ['= 37.5% exactly', C.green]], C.green), ...say('JOIN THE 40 STRIPS', C.green),
  );

  const narrowMark = widthMark(0, 20, '20 min', C.cyan);
  const narrowStart = bar(0, 20, base + 0.22, C.cyan, 0.45);
  await until(S(31));
  await play(enter(narrowMark), enter(narrowStart),
    card(['0–20 min is half as wide', ['7 of 24 visits ≈ 29.2%', C.cyan]]), ...say('THE NARROW BIN'));

  await until(S(32));
  await play(
    new M.ReplacementTransform(narrowStart, densityBars[0], { duration: 0.85 }),
    sequence([leave(middleOnly, 0.20), enter(narrowAndMiddle, 0.32)], 0.52, 1),
    card(['(7 ÷ 24) × 100% ÷ 20 min', ['≈ 1.46% per minute', C.cyan]]), ...say('HALF THE WIDTH, TALLER BAR'),
  );

  const wideMark = widthMark(60, 180, '120 min', C.pink);
  const wideGuide = dash(x(60), base, x(60), top, C.pink);
  await until(S(33));
  await play(leave(narrowMark), enter(wideMark), draw(wideGuide),
    card(['60–180 min is 3× as wide', ['8 of 24 visits ≈ 33.3%', C.pink]], C.pink), ...say('THE WIDE BIN', C.pink));

  await until(S(34));
  await play(
    leave(wideGuide), enter(densityBars[2], 0.85),
    sequence([leave(narrowAndMiddle, 0.20), enter(allShares, 0.32)], 0.52, 1),
    card(['(8 ÷ 24) × 100% ÷ 120 min', ['≈ 0.28% per minute', C.pink]], C.pink),
    ...say('SPREAD WIDE, BAR SITS LOW', C.pink),
  );

  await until(S(35));
  await play(leave(wideMark), sequence(densityBars.map(shape => pulse(shape, C.green)), 1.24, 0.20),
    card(['7 + 9 + 8 = 24 of 24 visits', ['Total area = 100%', C.green]], C.green), ...say('THREE AREAS MAKE A WHOLE', C.green));

  const shortY = densityY(bins[0].density);
  const densityArrowX = x(20) - 0.17;
  const densityArrow = arrow(densityArrowX, base + 0.12, densityArrowX, shortY - 0.07, C.bg);
  const heightLabelY = densityY(1.23);
  const heightLabel = T('≈1.46% per minute', keySize, C.green, true, true);
  const heightLabelW = heightLabel.getWidth() + 0.32;
  const heightLabelX = x(20) + 0.36 + heightLabelW / 2;
  const heightLabelBg = rect(heightLabelX, heightLabelY, heightLabelW, 0.46, C.green, 0, 1.4);
  heightLabelBg.setFill(C.card, 0.97);
  heightLabel.moveTo(at(heightLabelX, heightLabelY));
  const heightNote = new M.VGroup(
    line(densityArrowX, heightLabelY, x(20) + 0.36, heightLabelY, C.green, 1.8),
    heightLabelBg, heightLabel,
  );
  await until(S(36));
  await play(draw(densityArrow), enter(heightNote),
    card([['Density is the bar height', C.green], 'It shows how crowded', 'the visits are in a bin'], C.green),
    ...say('DENSITY', C.green));

  await until(S(37));
  await play(card(['Density is the average', ['share per minute', C.cyan]]), ...say('SHARE PER MINUTE'));

  await until(S(38));
  await play(...fade(densityArrow, heightNote),
    card([['Density = share ÷ width', C.amber], ['Area = density × width', C.green]], C.amber),
    ...say('FIND THE FAIR HEIGHT', C.amber));

  const crowded = areaOutline(0, 20, shortY, C.green);
  await until(S(39));
  await play(draw(crowded), card([['0–20 min has the highest', C.green], 'density, about 1.46% per min'], C.green),
    ...say('SHORT VISITS ARE MOST CROWDED', C.green));

  await until(S(40));
  densityBars[1].setFill(C.amber, 0.29);
  await play(...fade(crowded, allShares),
    pulse(densityBars[0], C.cyan), pulse(densityBars[2], C.pink),
    card([['0–20 min is tall and thin', C.cyan], ['60–180 min is flat and wide', C.pink]]),
    ...say('COMPARE THE OUTSIDE BARS'));

  const longY = densityY(bins[2].density);
  const firstArea = areaOutline(0, 20, shortY, C.green);
  const lastArea = areaOutline(60, 180, longY, C.green);
  const shortShare = T(shares[0], keySize, C.bg, true, true);
  shortShare.rotate(Math.PI / 2);
  shortShare.moveTo(at(x(10), (base + shortY) / 2));
  const longShare = text(shares[2], keySize, C.bg, x(120), (base + longY) / 2, true, true);
  await until(S(41));
  densityBars[0].setFill(C.cyan, 0.91);
  densityBars[2].setFill(C.pink, 0.91);
  await play(draw(firstArea), draw(lastArea), enter(shortShare), enter(longShare),
    card([['7 visits in the first bin', C.cyan], ['8 visits in the last bin', C.pink]], C.green),
    ...say('SIMILAR SHARES, SIMILAR AREAS', C.green));

  const wholeMark = widthMark(60, 180, '60–180 min', C.amber);
  await until(S(42));
  densityBars[0].setFill(C.cyan, 0.79);
  densityBars[1].setFill(C.amber, 0.79);
  densityBars[2].setFill(C.pink, 0.79);
  await play(...fade(firstArea, lastArea, shortShare, longShare), enter(wholeMark),
    card(['What share of visits', 'lasted 60–180 minutes?'], C.amber), ...say('READ THE WHOLE BIN', C.amber));

  const exactArea = areaOutline(60, 180, longY, C.green);
  await until(S(43));
  await play(draw(exactArea), card(['8 of 24 visits', ['Exact share = 1/3', C.green]], C.green),
    ...say('THE WHOLE BIN GIVES ONE THIRD', C.green));

  const halfCut = line(x(120), base, x(120), longY + 0.12, C.ink, 2.6);
  const halfShade = bar(60, 120, longY, C.violet, 0.94, 1.6);
  const halfMark = widthMark(60, 120, '60–120 min', C.violet);
  const rightMark = widthMark(120, 180, '120–180 min', C.pink);
  await until(S(44));
  await play(...fade(exactArea, wholeMark), enter(halfShade), draw(halfCut), enter(halfMark), enter(rightMark),
    card(['60–120 min is half', 'of the 60–180 min bin'], C.violet), ...say('WHAT ABOUT HALF A BIN?', C.violet));

  const longDots = visits.flatMap(([v, color], k) => {
    if (v < 60) return [];
    const yy = base + (P ? 0.18 : 0.13) + rows[k] * (P ? 0.24 : 0.20);
    return [dotAt(x(v), yy, color, { backing: true, ring: v === 60 ? C.ink : undefined })];
  });

  // Place the badge between gridlines and keep its left edge clear of the middle bar.
  const estimateY = (densityY(0.5) + densityY(1)) / 2;
  const estimateLabel = T('≈16.7% estimate', P ? 19 : 18, C.violet, true, true);
  const estimateW = estimateLabel.getWidth() + 0.24;
  const estimateH = 0.40;
  const estimateX = Math.max(x(90), x(60) + 0.16 + estimateW / 2);
  const estimateBox = new M.RoundedRectangle({
    width: estimateW, height: estimateH, cornerRadius: 0.10, color: C.violet, strokeWidth: 1.5,
  });
  estimateBox.setFill(C.card, 0.98).moveTo(at(estimateX, estimateY));
  estimateLabel.moveTo(at(estimateX, estimateY));
  const estimateNote = new M.VGroup(
    line(x(90), longY, x(90), estimateY - estimateH / 2, C.violet, 1.5),
    estimateBox, estimateLabel,
  );
  const observedY = widthY - (P ? 0.68 : 0.64);
  const leftObserved = text('7 actual visits', P ? 20 : 18, C.ink, x(90), observedY, false, true);
  const rightObserved = text('1 actual visit', P ? 20 : 18, C.ink, x(150), observedY, false, true);
  await until(S(45));
  await play(
    enter(estimateNote),
    sequence(longDots.map(dot => enter(dot)), 1.04, 0.10),
    enter(leftObserved), enter(rightObserved),
    card(['Both ringed dots at 60', ['belong to the shaded half', C.violet]], C.violet),
    ...say('THE BAR HIDES THE EXACT TIMES', C.pink),
  );

  await until(S(46));
  await play(card([['Half-bar estimate ≈ 16.7%', C.violet], 'Actual share ≈ 29.2%'], C.violet),
    ...say('PART OF A BIN GIVES AN ESTIMATE', C.violet));

  const heightGuide = dash(x(0), middleY, x(20), middleY, C.amber);
  const middleArrowX = x(20) + 0.17;
  const middleHeightArrow = arrow(middleArrowX, base + 0.10, middleArrowX, middleY - 0.07, C.bg);
  await until(S(47));
  await play(
    ...fade(halfCut, halfShade, halfMark, rightMark, estimateNote, leftObserved, rightObserved, ...longDots),
    draw(middleHeightArrow), draw(heightGuide),
    card([['Height is share per minute', C.amber], 'Count is number of visits'], C.amber), ...say('READ THE UNITS', C.amber),
  );

  const middleFocus = areaOutline(20, 60, middleY, C.green);
  await until(S(48));
  await play(draw(middleFocus),
    card([['Height ≈ 0.94% per minute', C.amber], ['The bin holds 9 visits', C.green]], C.amber),
    ...say('CHECK THE MIDDLE BIN', C.amber));

  const cumulativeEdge = dash(x(60), base, x(60), top, C.green);
  const cumulativeAreas = bins.slice(0, 2).map(({ left, right, density }) =>
    areaOutline(left, right, densityY(density), C.green));
  await until(S(49));
  await play(...fade(middleHeightArrow, heightGuide, middleFocus), draw(cumulativeEdge),
    sequence(cumulativeAreas.map(shape => draw(shape)), 1.0, 0.35),
    card(['Add areas from the left', ['Here, visits under 60 min', C.green]], C.green), ...say('NEXT, ADD THE AREAS', C.green));

  const recapShares = shareNotes([0, 1, 2]);
  await until(S(50));
  await play(...fade(cumulativeEdge, ...cumulativeAreas), enter(recapShares),
    sequence(densityBars.map(shape => pulse(shape, C.green)), 1.25, 0.20),
    card([['Density = share ÷ bin width', C.amber], ['Bar area = true share', C.green]], C.green),
    ...say('DENSITY HISTOGRAM', C.green));
}
