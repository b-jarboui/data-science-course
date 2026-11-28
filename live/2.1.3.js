export default async function (L) {
  const { M, P, C, S, T, pill, until, play } = L;

  const visits = [
    [5, C.cyan], [8, C.cyan], [10, C.cyan], [10, C.cyan],
    [12, C.cyan], [15, C.cyan], [15, C.cyan],
    [20, C.violet], [25, C.violet], [30, C.violet], [30, C.violet], [35, C.violet],
    [40, C.amber], [45, C.amber], [50, C.amber], [55, C.amber],
    [60, C.amber], [60, C.amber], [75, C.amber],
    [85, C.pink], [90, C.amber], [90, C.pink], [95, C.pink], [160, C.amber],
  ];

  const left = P ? -3.03 : -6.02;
  const span = P ? 6.43 : 8.15;
  const base = P ? -4.62 : -2.14;
  const top = P ? 2.02 : 1.08;
  const floating = P ? 1.20 : 0.55;
  const dividerTop = floating - 0.25;
  const height = top - base;
  const chartCenter = P ? 0 : -2.35;
  const noteX = P ? 0 : 4.61;
  const noteY = P ? -6.38 : -0.43;

  const x = minutes => left + span * minutes / 200;
  const y = (count, max) => base + height * count / max;
  const at = (object, px, py) => {
    object.moveTo([px, py, 0]);
    return object;
  };
  const text = (s, size, color, px, py, mono = false) =>
    at(T(String(s), size, color, mono), px, py);
  const line = (x1, y1, x2, y2, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth });
  const dashed = (x1, y1, x2, y2, color = C.muted) =>
    new M.DashedLine({ start: [x1, y1, 0], end: [x2, y2, 0], color });
  const group = items => new M.VGroup(...items);
  const fadeIn = (object, runTime = 0.45) => new M.FadeIn(object, { runTime });
  const fadeOut = (object, runTime = 0.35) => new M.FadeOut(object, { runTime });
  const stagger = (animations, runTime = 1, lagRatio = 0.1) =>
    new M.LaggedStart(animations, { runTime, lagRatio });

  function rect(width, h, color, opacity, px, py, strokeWidth = 2) {
    const shape = new M.Rectangle({ width, height: h, color, strokeWidth });
    shape.setFill(color, opacity);
    return at(shape, px, py);
  }

  let activeCue = null;
  let activeNote = null;

  function cue(message, color = C.cyan) {
    const next = at(pill(message, color, P ? 19 : 18), chartCenter, P ? 3.36 : 1.91);
    const animations = activeCue ? [fadeOut(activeCue, 0.23)] : [];
    activeCue = next;
    return [...animations, fadeIn(next, 0.36)];
  }

  function note(rows = [], border = C.cyan) {
    const animations = activeNote ? [fadeOut(activeNote, 0.24)] : [];
    activeNote = null;
    if (rows.length === 0) return animations;

    const rowHeight = P ? 0.47 : 0.45;
    const cardWidth = P ? 6.64 : 4.04;
    const labels = rows.map(([message, color]) => {
      const words = message.split(' ');
      const size = P ? 20 : 18;
      const lines = [];
      let current = '';
      for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        if (current && T(next, size, color).getWidth() > cardWidth - 0.42) {
          lines.push(T(current, size, color));
          current = word;
        } else {
          current = next;
        }
      }
      lines.push(T(current, size, color));
      return lines;
    }).flat();

    const card = new M.RoundedRectangle({
      width: cardWidth,
      height: labels.length * rowHeight + 0.28,
      cornerRadius: 0.16,
      color: border,
      strokeWidth: 2,
    });
    card.setFill(C.card, 0.96);
    at(card, noteX, noteY);
    labels.forEach((label, i) =>
      at(label, noteX, noteY + ((labels.length - 1) / 2 - i) * rowHeight));
    activeNote = group([card, ...labels]);
    return [...animations, fadeIn(activeNote, 0.38)];
  }

  function minutesAxis(ticks) {
    const end = ticks[ticks.length - 1];
    const items = [line(x(0), base, x(end), base, C.muted, 2.5)];
    for (const value of ticks) {
      items.push(line(x(value), base - 0.07, x(value), base + 0.07));
      items.push(text(value, P ? 18 : 16, C.ink, x(value), base - 0.32, true));
    }
    items.push(text('minutes', P ? 17 : 16, C.muted, x(end) - 0.40, base - 0.78));
    return group(items);
  }

  function visitsAxis(max, step, end) {
    const items = [line(x(0), base, x(0), top)];
    for (let count = step; count <= max; count += step) {
      const py = y(count, max);
      items.push(line(x(0), py, x(end), py, C.line, 1));
      items.push(line(x(0) - 0.08, py, x(0), py));
      items.push(text(count, P ? 18 : 15, C.muted, x(0) - 0.34, py, true));
    }
    items.push(text('visits', P ? 17 : 16, C.muted, x(0) - 0.13, top + 0.27));
    return group(items);
  }

  const ticks20 = Array.from({ length: 10 }, (_, i) => i * 20);
  const ticks40 = Array.from({ length: 6 }, (_, i) => i * 40);
  const bin20 = value => Math.floor(value / 20);

  function chart(width) {
    const end = width === 40 ? 200 : 180;
    const max = width === 5 ? 4 : width === 40 ? 14 : 8;
    const counts = Array(end / width).fill(0);
    for (const [value] of visits) counts[Math.floor(value / width)]++;

    const bars = [], labels = [], bins = [];
    const color = width === 5 ? C.violet : C.cyan;
    counts.forEach((count, i) => {
      if (count === 0) return;
      const a = x(i * width), b = x((i + 1) * width);
      const h = y(count, max) - base;
      bars[i] = rect(b - a, h, color, 0.69, (a + b) / 2, base + h / 2, width === 5 ? 1 : 1.5);
      if (width !== 5) {
        labels[i] = text(count, P ? 20 : 18, C.ink, (a + b) / 2, base + h + 0.23, true);
      }
      bins[i] = group(labels[i] ? [bars[i], labels[i]] : [bars[i]]);
    });

    return {
      width, counts, bars, labels, bins, max,
      xAxis: minutesAxis(width === 40 ? ticks40 : ticks20),
      yAxis: visitsAxis(max, width === 5 ? 1 : 2, end),
    };
  }

  function highlight(series, indices, color = C.cyan, opacity = 0.69) {
    for (const i of indices) {
      series.bars[i].setColor(color);
      series.bars[i].setFill(color, opacity);
      series.labels[i]?.setColor(color === C.cyan ? C.ink : color);
    }
  }

  const revealBins = series => series.bins.filter(Boolean).map(bin => fadeIn(bin));
  const removeBins = series => series.bins.filter(Boolean).map(bin => fadeOut(bin));
  const revealChart = series => [fadeIn(series.xAxis), fadeIn(series.yAxis), ...revealBins(series)];
  const removeChart = series => [fadeOut(series.xAxis), fadeOut(series.yAxis), ...removeBins(series)];

  function bracket(a, b, message, color = C.amber) {
    const py = base - 0.75;
    return group([
      line(x(a), py, x(b), py, color),
      line(x(a), py - 0.08, x(a), py + 0.08, color),
      line(x(b), py - 0.08, x(b), py + 0.08, color),
      text(message, P ? 18 : 16, color, (x(a) + x(b)) / 2, py - 0.23, true),
    ]);
  }

  function emptyBins(series) {
    const items = [];
    series.counts.forEach((count, i) => {
      if (count !== 0) return;
      const a = x(i * series.width), b = x((i + 1) * series.width);
      const middle = (a + b) / 2;
      if (series.width === 5) {
        items.push(line(a + 0.02, base, b - 0.02, base, C.violet, 3));
      } else {
        items.push(rect(b - a - 0.05, 0.56, C.violet, 0.10, middle, base + 0.34, 1.4));
        items.push(text('0', P ? 19 : 17, C.violet, middle, base + 0.34, true));
      }
    });
    return group(items);
  }

  function glow(px, py, color, radius = P ? 0.072 : 0.069) {
    const point = [px, py, 0];
    const halo = new M.Dot({ point, radius: radius * 1.55, color, strokeWidth: 0 });
    const core = new M.Dot({ point, radius, color, strokeWidth: 0 });
    halo.setFill(color, 0.19);
    core.setFill(color, 1);
    return group([halo, core]);
  }

  // Give close visits different rows while keeping their exact positions in minutes.
  const laneEnds = [];
  const lanes = visits.map(([minutes]) => {
    const px = x(minutes);
    let lane = laneEnds.findIndex(last => px - last >= 0.22);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = px;
    return lane;
  });

  function lineDots(level) {
    return visits.map(([minutes, color], i) => glow(x(minutes), level + lanes[i] * 0.28, color));
  }

  const twenty = chart(20);
  const stacked = Array(twenty.counts.length).fill(0);
  // Leave clearance for the top dot's halo below the dividers.
  const firstStackPitch = Math.min(
    height / twenty.max,
    (dividerTop - base - 0.15) / (twenty.counts[0] - 0.5),
  );
  const slots = visits.map(([minutes]) => {
    const b = bin20(minutes);
    const pitch = b === 0 ? firstStackPitch : height / twenty.max;
    return [x(b * 20 + 10), base + (stacked[b]++ + 0.5) * pitch];
  });
  const dots = lineDots(base + 0.30);
  const floatingDots = lineDots(floating);

  const openingDots = visits.map(([, color], i) => {
    const columns = P ? 6 : 8;
    const px = chartCenter + (i % columns - (columns - 1) / 2) * (P ? 0.98 : 0.85);
    const py = (P ? 1.72 : 0.79) - Math.floor(i / columns) * (P ? 1.65 : 1.00);
    return glow(px, py, color, P ? 0.17 : 0.14);
  });

  const purposes = [
    ['Borrow', C.cyan], ['Computer', C.violet], ['Study', C.amber], ['Event', C.pink],
  ];
  const legend = group(purposes.flatMap(([name, color], i) => {
    const px = P ? (i % 2 === 0 ? -2.78 : 0.48) : 3.24;
    const py = P ? -4.68 - Math.floor(i / 2) * 0.75 : 0.61 - i * 0.62;
    const label = T(name, P ? 20 : 18, C.ink);
    return [glow(px, py, color, 0.10), at(label, px + 0.22 + label.getWidth() / 2, py)];
  }));

  await until(S(0));
  await play(stagger(openingDots.map(dot => fadeIn(dot)), 1.35, 0.07),
    fadeIn(legend), ...cue('24 SATURDAY VISITORS'));

  await until(S(1));
  await play(...cue('WHICH VISIT LENGTHS ARE COMMON?', C.amber));

  await until(S(2));
  await play(...openingDots.map(dot => fadeOut(dot)), fadeOut(legend),
    fadeIn(twenty.xAxis), stagger(dots.map(dot => fadeIn(dot)), 1.10, 0.05),
    ...cue('ONE DOT PER VISIT'));

  await until(S(3));
  await play(...cue('THE SHAPE IS HARD TO SEE', C.muted));

  const cuts = group(ticks20.map(v => dashed(x(v), base + 0.04, x(v), dividerTop)));
  await until(S(4));
  await play(stagger(dots.map((dot, i) => new M.Transform(dot, floatingDots[i])),
    1.18, 0.025), fadeIn(cuts), ...cue('CUT EVERY 20 MINUTES'));

  const strips = group(ticks20.slice(0, -1).map(v =>
    rect(x(v + 20) - x(v) - 0.04, 0.29, C.cyan, 0.20, x(v + 10), base + 0.16, 1.3)));
  await until(S(5));
  await play(fadeIn(strips), ...cue('0–20, 20–40, …, 160–180'));

  const trays = group([
    ...ticks20.map(v => line(x(v), base + 0.02, x(v), dividerTop, C.grid, 1.5)),
    line(x(0), base + 0.02, x(180), base + 0.02, C.cyan),
  ]);
  await until(S(6));
  await play(fadeOut(cuts), fadeOut(strips), fadeIn(trays), ...cue('EACH BOX IS A BIN', C.amber));

  const border = line(x(20), base + 0.03, x(20), dividerTop, C.amber, 3);
  const arrowY = floating - 0.44;
  const arrow = new M.Arrow({
    start: [x(20) + 0.03, arrowY, 0], end: [x(38), arrowY, 0],
    color: C.amber, strokeWidth: 2.5,
  });
  await until(S(7));
  await play(fadeIn(border), fadeIn(arrow), ...cue('ON A BORDER? GO RIGHT', C.amber));

  const boundaryVisit = visits.findIndex(([minutes]) => minutes === 20);
  const ring = new M.Circle({ radius: 0.13, color: C.amber, strokeWidth: 2 });
  ring.setFill(C.bg, 0);
  at(ring, x(20), floating + lanes[boundaryVisit] * 0.28);
  await until(S(8));
  await play(fadeIn(ring), ...note([['20 min goes into 20–40', C.amber]], C.amber),
    ...cue('THE 20-MINUTE VISIT', C.amber));

  const moveDots = indices => indices.map(i =>
    new M.Transform(dots[i], glow(...slots[i], visits[i][1])));
  const sortedCounts = twenty.counts.map((count, b) => {
    if (count === 0) return null;
    const labelY = b === 0 ? slots[count - 1][1] + 0.25 : y(count, twenty.max) + 0.23;
    return text(count, P ? 20 : 18, C.ink, x(b * 20 + 10), labelY, true);
  });
  const rest = visits.map((_, i) => i).slice(12);

  await until(S(9));
  await play(...note(), stagger(moveDots([0, 1, 2, 3, 4, 5, 6]), 1.05, 0.12),
    ...cue('FIRST, THE 0–20 MIN BIN'));

  await until(S(10));
  await play(fadeIn(sortedCounts[0]), ...cue('0–20 CATCHES 7 VISITS'),
    ...note([['All 7 lasted under 20 min', C.cyan]]));

  await until(S(11));
  const landedRing = at(ring.copy(), ...slots[boundaryVisit]);
  await play(stagger([
    stagger([
      ...moveDots([boundaryVisit]),
      new M.Transform(ring, landedRing),
    ], 0.50, 0),
    stagger([
      fadeOut(border, 0.24), fadeOut(arrow, 0.24), fadeOut(ring, 0.24),
      stagger(moveDots([8, 9, 10, 11]), 0.62, 0.12),
    ], 0.62, 0),
    fadeIn(sortedCounts[1], 0.25),
  ], 1.37, 1), ...cue('20–40 CATCHES 5 VISITS', C.violet),
    ...note([['The 20-minute visit is here', C.violet]], C.violet));

  await until(S(12));
  await play(stagger([
    stagger(moveDots(rest), 0.98, 0.06),
    stagger([2, 3, 4, 8].map(b => fadeIn(sortedCounts[b], 0.24)), 0.38, 0.1),
  ], 1.40, 1), ...note(), ...cue('ALL 24 VISITS ARE SORTED', C.green));

  await until(S(13));
  await play(...dots.map(dot => fadeOut(dot)), fadeOut(trays),
    ...sortedCounts.filter(Boolean).map(label => fadeOut(label)),
    ...revealBins(twenty), ...cue('EACH BIN BECOMES A BAR'));

  const exampleBin = 1;
  const exampleCount = twenty.counts[exampleBin];
  const exampleTop = y(exampleCount, twenty.max);
  const countGuide = group([
    line(x(0), exampleTop, x(exampleBin * twenty.width), exampleTop, C.amber, 2.5),
    line(x(0) - 0.13, exampleTop, x(0), exampleTop, C.amber, 2.5),
    text(exampleCount, P ? 20 : 18, C.amber, x(0) - 0.34, exampleTop, true),
  ]);
  await until(S(14));
  highlight(twenty, [exampleBin], C.amber, 0.88);
  await play(fadeIn(twenty.yAxis), fadeIn(countGuide), ...cue('BAR HEIGHT SHOWS COUNT', C.amber),
    ...note([['Read the count on the visits axis', C.ink]], C.amber));

  const seams = group([1, 2, 3, 4].map(b => line(
    x(b * 20), base, x(b * 20),
    y(Math.min(twenty.counts[b - 1], twenty.counts[b]), twenty.max), C.green, 3)));
  await until(S(15));
  highlight(twenty, [exampleBin]);
  await play(fadeOut(countGuide), fadeIn(seams), ...note(), ...cue('NEIGHBORING BARS TOUCH', C.green));

  const gap = emptyBins(twenty);
  await until(S(16));
  await play(fadeOut(seams), fadeIn(gap), ...cue('GAPS SHOW EMPTY BINS', C.violet));

  await until(S(17));
  await play(fadeOut(gap), ...cue('HISTOGRAM', C.green));

  await until(S(18));
  highlight(twenty, [0], C.amber, 0.88);
  await play(...cue('0–20 MIN HAS 7 VISITS', C.amber));

  await until(S(19));
  await play(...cue('SHORT VISITS ARE MOST COMMON', C.amber));

  await until(S(20));
  highlight(twenty, [0]);
  highlight(twenty, [1, 2, 3], C.green, 0.75);
  await play(...cue('COUNTS FALL FROM 5 TO 4 TO 3', C.green));

  await until(S(21));
  highlight(twenty, [1, 2, 3]);
  highlight(twenty, [4], C.pink, 0.85);
  await play(...cue('A SMALL BUMP AT 80–100', C.pink));

  const threeEmpty = emptyBins(twenty);
  await until(S(22));
  highlight(twenty, [4]);
  await play(fadeIn(threeEmpty), ...cue('100–160 HAS THREE EMPTY BINS', C.violet));

  await until(S(23));
  highlight(twenty, [8], C.amber, 0.88);
  await play(fadeOut(threeEmpty), ...cue('ONE VISIT LASTED 160 MIN', C.amber),
    ...note([['160 min falls in the 160–180 bin', C.ink]], C.amber));

  await until(S(24));
  highlight(twenty, [8]);
  await play(...note(), ...cue('SEE THE OVERALL SHAPE', C.green));

  const sparse = emptyBins(twenty);
  await until(S(25));
  highlight(twenty, [0, 1, 2, 3, 4], C.green, 0.73);
  await play(fadeIn(sparse), ...cue('WHERE VISITS CROWD TOGETHER', C.green));

  const width20 = bracket(0, 20, '20 min');
  await until(S(26));
  highlight(twenty, [0, 1, 2, 3, 4]);
  await play(fadeOut(sparse), fadeIn(width20), ...cue('WIDTH CAN CHANGE THE SHAPE', C.amber));

  await until(S(27));
  await play(...cue('BIN WIDTH', C.amber),
    ...note([['How many minutes one bin covers', C.ink]], C.amber));

  await until(S(28));
  await play(...note(), ...cue('20 MIN IS A STARTING CHOICE', C.amber));

  const forty = chart(40);
  const width40 = bracket(0, 40, '40 min');
  const wideDividers = group(ticks40.map(v => dashed(x(v), base + 0.02, x(v), base + 0.85, C.amber)));
  await until(S(29));
  await play(...removeChart(twenty), fadeOut(width20), fadeIn(forty.xAxis),
    fadeIn(forty.yAxis), fadeIn(width40), fadeIn(wideDividers),
    ...cue('DOUBLE THE WIDTH TO 40 MIN', C.amber));

  await until(S(30));
  await play(fadeOut(wideDividers), fadeIn(forty.bins[0]), fadeIn(forty.bins[1]),
    ...cue('THE FIRST TWO WIDER BINS'),
    ...note([['0–40: 7 + 5 = 12', C.cyan], ['40–80: 4 + 3 = 7', C.ink]]));

  await until(S(31));
  highlight(forty, [2], C.pink, 0.85);
  await play(fadeIn(forty.bins[2]), ...note(), ...cue('80–120 STILL HAS 4 VISITS', C.pink));

  const wideZero = text(forty.counts[3], P ? 20 : 18, C.violet, x(140), base + 0.23, true);
  await until(S(32));
  highlight(forty, [2]);
  highlight(forty, [4], C.amber, 0.88);
  await play(fadeIn(wideZero), fadeIn(forty.bins[4]),
    ...cue('ONE EMPTY BIN, THEN ONE VISIT', C.amber));

  const lastWidth = bracket(160, 200, '40 min');
  await until(S(33));
  await play(fadeOut(width40), fadeIn(lastWidth), ...cue('THE LAST BIN ENDS AT 200', C.amber),
    ...note([['160–200 is also 40 minutes wide', C.ink]], C.amber));

  await until(S(34));
  highlight(forty, [0, 1, 2], C.green, 0.75);
  highlight(forty, [4]);
  await play(fadeOut(lastWidth), fadeOut(wideZero), ...note(),
    ...cue('12, 7, 4: THE BARS STEP DOWN', C.green));

  await until(S(35));
  highlight(forty, [0, 1, 2]);
  await play(...cue('THE SMALL BUMP IS GONE', C.pink));

  const before = chart(20);
  highlight(before, [3], C.amber, 0.85);
  highlight(before, [4], C.pink, 0.85);
  await until(S(36));
  await play(...removeChart(forty), ...revealChart(before),
    ...cue('20 MIN: THE BUMP IS VISIBLE', C.pink),
    ...note([['60–80: 3 visits', C.amber], ['80–100: 4 visits', C.pink]], C.pink));

  const after = chart(40);
  highlight(after, [1], C.amber, 0.85);
  highlight(after, [2], C.pink, 0.85);
  await until(S(37));
  await play(...removeChart(before), ...revealChart(after),
    ...cue('40 MIN: THE BUMP DISAPPEARS', C.amber),
    ...note([['40–80: 4 + 3 = 7 visits', C.amber], ['80–120: 4 visits', C.pink]], C.amber));

  const sameAxis = minutesAxis(ticks40);
  const sameDots = group(lineDots(base + 0.30));
  await until(S(38));
  await play(...removeChart(after), fadeIn(sameAxis), fadeIn(sameDots),
    ...note(), ...cue('THE SAME 24 VISITS'));

  const sameDividers = group(ticks40.map(v =>
    dashed(x(v), base + 0.03, x(v), base + 1.63, C.amber)));
  await until(S(39));
  await play(fadeIn(sameDividers), ...cue('ONLY THE BIN WIDTH CHANGED', C.amber));

  const five = chart(5);
  await until(S(40));
  await play(fadeOut(sameAxis), fadeOut(sameDots), fadeOut(sameDividers),
    fadeIn(five.xAxis), fadeIn(five.yAxis),
    stagger(revealBins(five), 1.18, 0.06),
    ...cue('TRY 5-MINUTE BINS', C.violet));

  const narrowEmpty = emptyBins(five);
  await until(S(41));
  await play(fadeIn(narrowEmpty), ...cue('MOST BINS HAVE 0, 1, OR 2', C.violet),
    ...note([['5 min bins', C.violet], ['Lines at zero mark empty bins', C.ink]], C.violet));

  await until(S(42));
  highlight(five, [2, 6, 12, 18], C.pink, 0.79);
  await play(fadeOut(narrowEmpty), ...note(), ...cue('THE BARS LOOK LIKE SPIKES', C.pink));

  await until(S(43));
  highlight(five, [2, 6, 12, 18], C.violet);
  await play(...cue('THE SHAPE IS HARD TO SEE', C.muted));

  const tooWide = chart(40);
  await until(S(44));
  await play(...removeChart(five), ...revealChart(tooWide),
    ...cue('TOO WIDE CAN HIDE BUMPS', C.amber));

  const tooNarrow = chart(5);
  // Compare the tallest spike at 10–15 with the low bar at 20–25.
  highlight(tooNarrow, [2], C.pink, 0.90);
  highlight(tooNarrow, [4], C.amber, 0.90);
  await until(S(45));
  await play(...removeChart(tooWide), ...revealChart(tooNarrow),
    ...cue('5-MINUTE BINS CAN SHOW SPIKES', C.violet));

  function sharedGap() {
    const a = x(120), b = x(160), py = base + 0.28;
    return group([
      line(a, py, b, py, C.green, 2.5),
      line(a, py - 0.10, a, py + 0.10, C.green),
      line(b, py - 0.10, b, py + 0.10, C.green),
    ]);
  }

  const compare20 = chart(20);
  const gapAt20 = sharedGap();
  await until(S(46));
  await play(...removeChart(tooNarrow), ...revealChart(compare20), fadeIn(gapAt20),
    ...cue('COMPARE DIFFERENT BIN WIDTHS', C.green),
    ...note([['20-minute bins', C.cyan], ['120–160 has no visits', C.green]], C.green));

  const compare40 = chart(40);
  const gapAt40 = sharedGap();
  await until(S(47));
  await play(...removeChart(compare20), fadeOut(gapAt20), ...revealChart(compare40), fadeIn(gapAt40),
    ...cue('LOOK FOR GAPS THAT STAY', C.green),
    ...note([['40-minute bins', C.cyan], ['120–160 is still empty', C.green]], C.green));

  const recap = chart(20);
  const equalA = bracket(0, 20, '20', C.green);
  const equalB = bracket(20, 40, '20', C.green);
  await until(S(48));
  await play(...removeChart(compare40), fadeOut(gapAt40), ...revealChart(recap),
    fadeIn(equalA), fadeIn(equalB), ...cue('EQUAL WIDTHS: HEIGHT IS COUNT', C.green), ...note());

  const unequalAxis = minutesAxis([0, 20, 60, 180]);
  const unequal = group([[0, 20], [20, 60], [60, 180]].flatMap(([a, b]) => {
    const h = P ? 2.30 : 1.53;
    const middle = (x(a) + x(b)) / 2;
    return [
      rect(x(b) - x(a) - 0.04, h, C.amber, 0.12, middle, base + h / 2),
      text(b - a, P ? 20 : 18, C.amber, middle, base + h / 2, true),
    ];
  }));
  await until(S(49));
  await play(...removeChart(recap), fadeOut(equalA), fadeOut(equalB),
    fadeIn(unequalAxis), fadeIn(unequal), ...cue('NEXT: UNEQUAL BIN WIDTHS?', C.amber),
    ...note([['How should we set the bar heights?', C.ink]], C.amber));

  const finalChart = chart(20);
  highlight(finalChart, [0], C.amber, 0.88);
  await until(S(50));
  await play(fadeOut(unequalAxis), fadeOut(unequal), ...revealChart(finalChart),
    ...cue('HISTOGRAM RECAP', C.green),
    ...note([['Equal bins show the shape', C.green], ['0–20 min has the most visits', C.ink]], C.green));
}
