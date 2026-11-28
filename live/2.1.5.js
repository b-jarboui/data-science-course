export default async function (L) {
  const { M, P, C, S, T, showA, until, play } = L;

  const visits = [
    [5, C.cyan], [8, C.cyan], [10, C.cyan], [10, C.cyan],
    [12, C.cyan], [15, C.cyan], [15, C.cyan],
    [20, C.violet], [25, C.violet], [30, C.violet], [30, C.violet], [35, C.violet],
    [40, C.amber], [45, C.amber], [50, C.amber], [55, C.amber],
    [60, C.amber], [60, C.amber], [75, C.amber], [85, C.pink],
    [90, C.amber], [90, C.pink], [95, C.pink], [160, C.amber],
  ];
  const total = visits.length;
  const steps = [];
  for (let i = 0; i < total; ) {
    const time = visits[i][0];
    const before = i;
    while (i < total && visits[i][0] === time) i++;
    steps.push({ time, before, after: i });
  }
  const countAt = time => visits.filter(([duration]) => duration <= time).length;
  const count30 = countAt(30);
  const count60 = countAt(60);
  const count95 = countAt(95);
  const half = total / 2;
  const timeHalf = visits[half - 1][0];

  const x0 = P ? -2.68 : -5.43;
  const x1 = P ? 3.42 : 1.82;
  const cx = (x0 + x1) / 2;
  const base = P ? -3.54 : -1.99;
  const top = P ? 2.38 : 1.18;
  const fullEnd = 165;
  const zoomEnd = 18;
  const fullX = time => x0 + (time / fullEnd) * (x1 - x0);
  const zoomX = time => x0 + (time / zoomEnd) * (x1 - x0);
  const fullY = count => base + (count / total) * (top - base);
  const zoomY = count => base + (count / 8) * (top - base);
  const pillPos = P ? [0, 3.39, 0] : [cx, 1.94, 0];
  const boxPos = P ? [0, -5.88, 0] : [4.53, -0.37, 0];

  const say = (text, color = C.cyan) => showA(text, color, pillPos);
  const point = (x, y) => [x, y, 0];
  const text = (value, size, color, x, y, mono = true, bold = false) =>
    T(value, size, color, mono, bold).moveTo(point(x, y));
  const line = (x, y, toX, toY, color = C.cyan, strokeWidth = 3.4) =>
    new M.Line({ start: point(x, y), end: point(toX, toY), color, strokeWidth });
  const dash = (x, y, toX, toY, color) =>
    new M.DashedLine({ start: point(x, y), end: point(toX, toY), color, strokeWidth: 2.4 });
  const dot = (x, y, color, radius = 0.10) =>
    new M.Dot({ point: point(x, y), color, radius }).setFill(color, 1);
  const frame = (width, height, center, color, fill = C.card, opacity = 0.95) => {
    const rect = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    rect.setFill(fill, opacity);
    rect.moveTo(center);
    return rect;
  };
  const enter = object => new M.FadeIn(object, { runTime: 0.32 });
  const exit = object => new M.FadeOut(object, { runTime: 0.26 });
  const draw = object => new M.Create(object, { runTime: 0.36 });
  const sequence = (animations, runTime, lagRatio = 0.12) =>
    new M.LaggedStart(animations, { lagRatio, runTime });
  const remove = (...objects) => exit(new M.VGroup(...objects));
  const flash = (object, color) =>
    new M.Flash(object, { color, flashRadius: 0.18, lineLength: 0.12, runTime: 0.55 });

  let boxNow = null;
  function box(lines, color = C.cyan) {
    const size = P ? 20 : 19;
    const spacing = P ? 0.43 : 0.41;
    const labels = lines.map(row => {
      const [value, tint] = Array.isArray(row) ? row : [row, C.ink];
      return T(value, size, tint, true);
    });
    const width = Math.max(...labels.map(label => label.getWidth())) + 0.56;
    const height = labels.length * spacing + 0.32;
    const left = boxPos[0] - width / 2 + 0.28;
    labels.forEach((label, i) => {
      label.moveTo(point(left + label.getWidth() / 2, boxPos[1] + ((labels.length - 1) / 2 - i) * spacing));
    });
    const next = new M.VGroup(frame(width, height, boxPos, color), ...labels);
    const animations = boxNow ? [sequence([exit(boxNow), enter(next)], 0.48, 1)] : [enter(next)];
    boxNow = next;
    return animations;
  }

  function tag(value, x, y, color) {
    const label = text(value, 18, color, x, y);
    return new M.VGroup(frame(label.getWidth() + 0.30, 0.42, point(x, y), color, C.bg), label);
  }

  function axis(xMap, ticks, y, withDotRow = false) {
    const labelY = y - (withDotRow ? 0.58 : 0.31);
    return new M.VGroup(
      line(x0, y, x1, y, C.muted, 2.8),
      ...ticks.flatMap(value => {
        const x = xMap(value);
        return [
          line(x, y - 0.065, x, y + 0.065, C.muted, 2),
          text(String(value), 16, C.muted, x, labelY),
        ];
      }),
      text('Minutes', 16, C.muted, x1 - 0.52, labelY - 0.35, false),
    );
  }

  function yAxis(values, yMap, name) {
    const parts = [line(x0, base, x0, top, C.muted, 2.6)];
    for (const value of values) {
      const y = yMap(value);
      if (value !== 0) parts.push(line(x0, y, x1, y, C.line, 1.2));
      parts.push(line(x0 - 0.075, y, x0 + 0.075, y, C.muted, 2));
    }
    parts.push(text(name, 16, C.muted, x0 + 0.04, top + 0.32, false));
    return new M.VGroup(...parts);
  }

  function yLabels(values, yMap, labels, color = C.muted) {
    return new M.VGroup(...labels.map((value, i) => {
      const label = T(value, 16, color, true);
      return label.moveTo(point(x0 - 0.15 - label.getWidth() / 2, yMap(values[i])));
    }));
  }

  function glowingVisits(list, xMap, y, spacing, radius) {
    const stacks = new Map();
    return list.map(([time, color]) => {
      const level = stacks.get(time) ?? 0;
      stacks.set(time, level + 1);
      const x = xMap(time);
      const dotY = y + level * spacing;
      const halo = new M.Dot({ point: point(x, dotY), color, radius: radius * 1.9 });
      halo.setFill(color, 0.20);
      halo.setStroke(color, 0);
      return new M.VGroup(halo, dot(x, dotY, color, radius));
    });
  }

  function staircase(data, xMap, yMap, end) {
    const segments = [];
    let time = 0;
    let count = 0;
    for (const step of data) {
      segments.push(
        line(xMap(time), yMap(count), xMap(step.time), yMap(count)),
        line(xMap(step.time), yMap(step.before), xMap(step.time), yMap(step.after)),
      );
      time = step.time;
      count = step.after;
    }
    segments.push(line(xMap(time), yMap(count), xMap(end), yMap(count)));
    return segments;
  }

  const chartTicks = [0, 30, 60, 90, 120, 150];

  // 0–3. The library question and the Saturday visits.
  const introX = P ? 0 : cx;
  const introY = P ? -1.66 : -0.50;
  const clockX = introX - (P ? 1.60 : 1.76);
  const clockRadius = P ? 0.88 : 0.80;
  const clockCenter = point(clockX, introY + 0.12);
  const clockRim = new M.Circle({ radius: clockRadius, color: C.muted, strokeWidth: 2.5 });
  clockRim.setFill(C.bg, 0.95).moveTo(clockCenter);
  const clockArc = new M.Arc({
    radius: clockRadius * 0.82, startAngle: -Math.PI / 2, angle: Math.PI, color: C.amber, strokeWidth: 7,
  });
  clockArc.moveTo(point(clockX + clockRadius * 0.41, clockCenter[1]));
  const signX = introX + 1.13;
  const intro = new M.VGroup(
    frame(P ? 6.16 : 6.20, P ? 3.30 : 2.68, point(introX, introY), C.line),
    clockRim,
    clockArc,
    line(clockX, clockCenter[1], clockX, clockCenter[1] + clockRadius * 0.68, C.ink, 2.5),
    line(clockX, clockCenter[1], clockX, clockCenter[1] - clockRadius * 0.69, C.amber, 3),
    dot(clockX, clockCenter[1], C.amber, 0.07),
    text('30 min', 18, C.amber, clockX, introY - clockRadius - 0.23),
    text('Town Library', 26, C.ink, signX, introY + 0.48, false),
    text('Quick-visit tables', 20, C.muted, signX, introY, false),
    text('30-minute limit?', 21, C.amber, signX, introY - 0.54),
  );

  await until(S(0));
  await play(enter(intro), ...say('LIBRARY QUICK-VISIT TABLES', C.amber));

  await until(S(1));
  await play(...say('THE LIBRARIAN’S QUESTION'), ...box(['What percent finish', ['within 30 minutes?', C.amber]], C.amber));

  const introBase = P ? -2.42 : -1.12;
  const introAxis = axis(fullX, chartTicks, introBase);
  const introDots = glowingVisits(visits, fullX, introBase + 0.16, 0.19, P ? 0.043 : 0.049);
  const shortest = tag('5 min', x0 + 0.62, introBase + 0.92, C.cyan);
  const longest = tag('160 min', x1 - 0.54, introBase + 0.92, C.amber);

  await until(S(2));
  await play(
    exit(intro), enter(introAxis), sequence(introDots.map(enter), 1.45, 0.08),
    ...say('24 SATURDAY VISITS'),
    ...box([['Borrow', C.cyan], ['Computer', C.violet], ['Study', C.amber], ['Event', C.pink]]),
  );

  await until(S(3));
  await play(enter(shortest), enter(longest), ...say('SHORTEST → LONGEST', C.amber));

  // 4–9. Count the first visits and include both dots at ten minutes.
  const early = visits.slice(0, 7);
  const earlyTimes = [5, 8, 10, 12, 15];
  const zoomAxis = axis(zoomX, [0, ...earlyTimes], base);
  const zoomDots = glowingVisits(early, zoomX, base + 0.19, 0.28, P ? 0.087 : 0.096);
  const zoomTag = tag('CLOSE-UP  ·  0–18 MIN', cx + 0.32, top + 0.28, C.muted);
  const walkY = base + (P ? 2.28 : 1.52);
  const makeWalker = time => new M.VGroup(
    line(zoomX(time), base + 0.06, zoomX(time), walkY, C.amber, 2.8),
    dot(zoomX(time), walkY, C.amber),
  );
  const walker = makeWalker(0);
  let countTag = tag('0', zoomX(0), walkY + 0.40, C.amber);

  await until(S(4));
  await play(
    remove(introAxis, ...introDots, shortest, longest),
    enter(zoomAxis), enter(zoomTag), sequence(zoomDots.map(enter), 0.76),
    enter(walker), enter(countTag),
    ...say('WALK LEFT → RIGHT', C.amber),
    ...box(['Time = 0 min', ['Count = 0 visits', C.amber]], C.amber),
  );

  await until(S(5));
  await play(flash(zoomDots[0].submobjects[1], C.cyan), ...say('EACH DOT ADDS ONE VISIT'));

  function moveCounter(time, value, color) {
    const nextTag = tag(value, zoomX(time), walkY + 0.40, color);
    const animations = [
      new M.Transform(walker, makeWalker(time), { runTime: 0.45 }),
      new M.Transform(countTag, nextTag, { runTime: 0.45 }),
    ];
    return animations;
  }

  await until(S(6));
  await play(
    ...moveCounter(5, '1', C.amber), flash(zoomDots[0].submobjects[1], C.cyan),
    ...say('AT 5 MINUTES'),
    ...box(['Time = 5 min', ['Count = 1 visit', C.cyan]]),
  );

  await until(S(7));
  await play(
    ...moveCounter(8, '2', C.amber), flash(zoomDots[1].submobjects[1], C.cyan),
    ...say('AT 8 MINUTES'),
    ...box(['Time = 8 min', ['Count = 2 visits', C.cyan]]),
  );

  await until(S(8));
  await play(
    ...moveCounter(10, '4 (+2)', C.amber),
    ...zoomDots.slice(2, 4).map(group => flash(group.submobjects[1], C.amber)),
    ...say('TWO VISITS END AT 10 MIN', C.amber),
    ...box(['Time = 10 min', ['Count jumps 2 → 4', C.amber]], C.amber),
  );

  const included = frame(
    zoomX(10) - zoomX(5) + 0.52, 0.78,
    point((zoomX(5) + zoomX(10)) / 2, base + 0.37), C.cyan, C.bg, 0,
  );

  await until(S(9));
  await play(
    exit(walker), exit(countTag), draw(included),
    ...say('“BY 10” INCLUDES EXACTLY 10'),
    ...box(['Visits that ended by 10 min', '5, 8, 10, 10', ['Count = 4', C.cyan]]),
  );

  // 10–13. Turn the count into the height of a staircase.
  const countTicks = [0, 2, 4, 6, 8];
  const zoomYAxis = yAxis(countTicks, zoomY, 'Visits');
  const zoomLabels = yLabels(countTicks, zoomY, countTicks.map(String));
  const zoomStairs = staircase(steps.filter(step => step.time <= 15), zoomX, zoomY, zoomEnd);
  const zoomSegment = (t1, c1, t2, c2, color) =>
    line(zoomX(t1), zoomY(c1), zoomX(t2), zoomY(c2), color, 6);

  await until(S(10));
  await play(
    exit(included), enter(zoomYAxis), enter(zoomLabels),
    sequence(zoomStairs.slice(0, 7).map(draw), 1.38, 0.24),
    ...say('DRAW THE COUNT AS HEIGHT'),
  );

  const jumps = new M.VGroup(
    zoomSegment(5, 0, 5, 1, C.green),
    zoomSegment(8, 1, 8, 2, C.green),
    zoomSegment(10, 2, 10, 4, C.amber),
    text('+1', 18, C.green, zoomX(5) + 0.33, zoomY(0.58)),
    text('+1', 18, C.green, zoomX(8) + 0.33, zoomY(1.5)),
    tag('+2', zoomX(10) + 0.48, zoomY(3), C.amber),
  );

  await until(S(11));
  await play(
    enter(jumps), ...say('ONE STEP OR A DOUBLE JUMP', C.amber),
    ...box(['At 5 min: +1', 'At 8 min: +1', ['At 10 min: +2', C.amber]], C.amber),
  );

  const flats = new M.VGroup(
    zoomSegment(5, 1, 8, 1, C.green),
    zoomSegment(8, 2, 10, 2, C.green),
    tag('FLAT', zoomX(6.5), zoomY(1) + 0.37, C.green),
  );

  await until(S(12));
  await play(
    exit(jumps), enter(flats), ...say('BETWEEN DOTS, THE LINE IS FLAT', C.green),
    ...box(['No visits finish here.', ['The count stays the same.', C.green]], C.green),
  );

  await until(S(13));
  await play(
    exit(flats), sequence(zoomStairs.slice(7).map(draw), 1.24, 0.25),
    ...say('THE LINE CLIMBS OR STAYS FLAT'),
    ...box(['The count of finished', ['visits never goes down.', C.cyan]]),
  );

  // 14–20. Show the full chart and the height of one visit.
  const fullAxis = axis(fullX, chartTicks, base, true);
  const shareTicks = [0, 6, 12, 18, 24];
  const percentLabels = ['0%', '25%', '50%', '75%', '100%'];
  const shareAxis = yAxis(shareTicks, fullY, 'Share finished');
  let shares = yLabels(shareTicks, fullY, percentLabels);
  const fullDots = glowingVisits(visits, fullX, base - 0.36, 0.13, P ? 0.038 : 0.044);
  const stairs = staircase(steps, fullX, fullY, fullEnd);

  await until(S(14));
  await play(
    remove(zoomAxis, zoomTag, ...zoomDots, zoomYAxis, zoomLabels, ...zoomStairs),
    enter(fullAxis), enter(shareAxis), enter(shares),
    sequence(fullDots.map(enter), 0.95, 0.05),
    sequence(stairs.map(draw), 2.0, 0.11),
    ...say('SWITCH FROM COUNTS TO PERCENT'),
    ...box(['0 to 24 finished visits', ['0% to 100%', C.cyan]]),
  );

  const allMarker = dot(fullX(160), fullY(total), C.cyan);
  const halfMarker = dot(fullX(timeHalf), fullY(half), C.amber);
  const halfGuide = dash(x0, fullY(half), fullX(timeHalf), fullY(half), C.amber);

  await until(S(15));
  await play(
    enter(allMarker), flash(allMarker, C.cyan), ...say('ALL 24 VISITS = 100%'),
    ...box(['24 of 24 visits', ['= 100%', C.cyan]]),
  );

  await until(S(16));
  await play(
    exit(allMarker), draw(halfGuide), enter(halfMarker),
    ...say('HALF THE VISITS = 50%', C.amber),
    ...box(['24 visits = 100%', ['12 visits = 50%', C.amber]], C.amber),
  );

  // The ruler occupies its own strip to the right of the plot on both layouts.
  // Its marks use the same heights as the chart's 24 one-visit increments.
  const rulerX = x1 + 0.30;
  function stepRuler(count, majorEvery, color) {
    return new M.VGroup(
      line(rulerX, base, rulerX, top, color, 2.2),
      ...Array.from({ length: count + 1 }, (_, step) => {
        const y = base + (step / count) * (top - base);
        const major = step % majorEvery === 0;
        const halfWidth = major ? 0.12 : 0.07;
        return line(rulerX - halfWidth, y, rulerX + halfWidth, y, color, major ? 2.2 : 1.6);
      }),
    );
  }
  const ruler = stepRuler(total, 6, C.amber);
  const exampleRuler = stepRuler(25, 5, C.muted);

  await until(S(17));
  await play(
    remove(halfGuide, halfMarker), enter(ruler),
    ...say('SPLIT 100% INTO 24 STEPS', C.amber),
    ...box(['Full climb = 100%', ['24 equal steps', C.amber]], C.amber),
  );

  await until(S(18));
  await play(
    sequence([exit(ruler), enter(exampleRuler)], 0.4, 1),
    ...say('WITH 25 STEPS', C.muted),
    ...box(['If there were 25 steps:', ['100% ÷ 25 = 4% each', C.ink]]),
  );

  const oneStep = line(fullX(timeHalf), fullY(half - 1), fullX(timeHalf), fullY(half), C.amber, 6);

  await until(S(19));
  await play(
    sequence([exit(exampleRuler), enter(ruler)], 0.4, 1),
    draw(oneStep), ...say('WITH 24 STEPS', C.amber),
    ...box(['Fewer steps, same climb.', ['100% ÷ 24 ≈ 4.2% each', C.amber]], C.amber),
  );

  const origin = dot(x0, base, C.green, 0.075);
  const summit = dot(fullX(160), top, C.green, 0.085);

  await until(S(20));
  await play(
    remove(ruler, oneStep), enter(origin), enter(summit),
    ...say('STAIRCASE FROM 0% TO 100%', C.green),
    ...box(['Starts at 0%', ['Ends at 100%', C.green]], C.green),
  );

  // 21–26. Reveal the three parts of the name.
  const empirical = ['Empirical = real visits', C.cyan];
  const cumulative = ['Cumulative = adds up', C.amber];
  const distribution = ['Distribution = spread', C.green];

  await until(S(21));
  await play(
    remove(origin, summit), ...say('A THREE-PART NAME'),
    ...box([['Real visits', C.cyan], ['Adds up', C.amber], ['Spread over time', C.green]]),
  );

  await until(S(22));
  await play(
    ...say('EMPIRICAL'),
    ...box([empirical, ['Adds up', C.muted], ['Spread over time', C.muted]]),
  );

  const earlyClimb = new M.VGroup(
    ...steps.filter(step => step.time <= timeHalf).map(step =>
      line(fullX(step.time), fullY(step.before), fullX(step.time), fullY(step.after), C.amber, 5.5)),
  );

  await until(S(23));
  await play(
    enter(earlyClimb), ...say('CUMULATIVE', C.amber),
    ...box([empirical, cumulative, ['Spread over time', C.muted]], C.amber),
  );

  const spread = line(fullX(5), base - 0.06, fullX(160), base - 0.06, C.green, 4);

  await until(S(24));
  await play(
    exit(earlyClimb), draw(spread), ...say('DISTRIBUTION', C.green),
    ...box([empirical, cumulative, distribution], C.green),
  );

  await until(S(25));
  await play(
    exit(spread), ...say('EMPIRICAL CUMULATIVE DISTRIBUTION'),
    ...box([['Empirical', C.cyan], ['Cumulative', C.amber], ['Distribution', C.green]]),
  );

  await until(S(26));
  await play(
    ...say('CUMULATIVE STAIRCASE'),
    ...box([['Cumulative staircase', C.cyan], ['Share finished over time', C.ink]]),
  );

  function reading(time, count, color) {
    const x = fullX(time);
    const y = fullY(count);
    return {
      axisTime: dot(x, base, color, 0.084),
      axisShare: dot(x0, y, color, 0.084),
      hit: dot(x, y, color, 0.094),
      up: dash(x, base, x, y, color),
      left: dash(x, y, x0, y, color),
      right: dash(x0, y, x, y, color),
      down: dash(x, y, x, base, color),
    };
  }

  // 27–31. Read the share at thirty minutes.
  const read30 = reading(30, count30, C.amber);
  const ref50 = dash(x0, fullY(half), fullX(30), fullY(half), C.muted);
  const stepDown = line(x0 + 0.12, fullY(half), x0 + 0.12, fullY(count30), C.amber, 5);

  await until(S(27));
  await play(
    enter(read30.axisTime), flash(read30.axisTime, C.amber),
    ...say('CHECK 30 MINUTES', C.amber),
    ...box(['Cutoff: 30 min', ['What share finished?', C.amber]], C.amber),
  );

  await until(S(28));
  await play(
    sequence([draw(read30.up), enter(read30.hit), draw(read30.left), enter(read30.axisShare)], 1.28, 0.9),
    ...say('GO UP, THEN LEFT', C.amber),
  );

  await until(S(29));
  await play(
    draw(ref50), ...say('ONE STEP BELOW HALF', C.amber),
    ...box([['11 of 24 finished', C.amber], 'Half would be 12 of 24.'], C.amber),
  );

  await until(S(30));
  await play(
    draw(stepDown), ...say('50% − ABOUT 4% ≈ 46%', C.amber),
    ...box(['Half = 50%', ['By 30 min ≈ 46%', C.amber]], C.amber),
  );

  await until(S(31));
  await play(
    flash(read30.hit, C.amber), ...say('THE 30-MINUTE LIMIT', C.amber),
    ...box([['About 46% of visits', C.amber], 'A little under half'], C.amber),
  );

  // 32–36. Read the share at sixty minutes and split 18 into 12 plus 6.
  const read60 = reading(60, count60, C.green);
  const barX = fullX(60) + 0.32;
  const halfBar = line(barX, base, barX, fullY(half), C.cyan, 5.5);
  const quarterBar = line(barX, fullY(half), barX, fullY(count60), C.green, 5.5);

  await until(S(32));
  await play(
    remove(read30.axisTime, read30.up, read30.hit, read30.left, read30.axisShare, ref50, stepDown),
    enter(read60.axisTime), flash(read60.axisTime, C.green),
    ...say('TRY 60 MINUTES', C.green),
    ...box(['Cutoff: 1 hour', ['What share finished?', C.green]], C.green),
  );

  await until(S(33));
  await play(
    sequence([draw(read60.up), enter(read60.hit), draw(read60.left), enter(read60.axisShare)], 1.24, 0.9),
    ...say('GO UP, THEN LEFT', C.green),
    ...box(['By 60 minutes', ['18 of 24 visits finished', C.green]], C.green),
  );

  await until(S(34));
  await play(
    draw(halfBar), ...say('12 VISITS MAKE HALF'),
    ...box([['12 visits = 50%', C.cyan]]),
  );

  await until(S(35));
  await play(
    draw(quarterBar), ...say('6 MORE VISITS MAKE A QUARTER', C.green),
    ...box([['12 visits = 50%', C.cyan], ['6 more = 25%', C.green]], C.green),
  );

  await until(S(36));
  await play(
    flash(read60.hit, C.green), ...say('HALF PLUS A QUARTER', C.green),
    ...box(['50% + 25% = 75%', ['Three quarters in 1 hour', C.green]], C.green),
  );

  // 37–40. Read backwards from one half to the first time it is reached.
  const readHalf = reading(timeHalf, half, C.violet);

  await until(S(37));
  await play(
    remove(read60.axisTime, read60.up, read60.hit, read60.left, read60.axisShare, halfBar, quarterBar),
    ...say('READ THE CHART BACKWARD', C.violet),
    ...box([['When is half finished?', C.violet]], C.violet),
  );

  await until(S(38));
  await play(
    enter(readHalf.axisShare), flash(readHalf.axisShare, C.violet),
    ...say('START AT 50%', C.violet),
    ...box(['50% is', ['12 of 24 visits', C.violet]], C.violet),
  );

  await until(S(39));
  await play(
    sequence([draw(readHalf.right), enter(readHalf.hit), draw(readHalf.down)], 1.16, 0.9),
    ...say('GO RIGHT, THEN DOWN', C.violet),
  );

  const halfTimeTag = tag('35 min', fullX(timeHalf) + 0.69, base + 0.40, C.violet);

  await until(S(40));
  await play(
    enter(readHalf.axisTime), enter(halfTimeTag), flash(readHalf.axisTime, C.violet),
    ...say('HALF FINISHED BY 35 MIN', C.violet),
    ...box(['50% of visits lasted', ['35 minutes or less', C.violet]], C.violet),
  );

  // 41–43. Compare a cluster of finishes with a quiet stretch.
  const steep = new M.VGroup(...steps.filter(step => step.time <= 20).map(step =>
    line(fullX(step.time), fullY(step.before), fullX(step.time), fullY(step.after), C.amber, 5.5)));
  const flat = line(fullX(95), fullY(count95), fullX(160), fullY(count95), C.pink, 5.5);

  await until(S(41));
  await play(
    remove(readHalf.axisShare, readHalf.right, readHalf.hit, readHalf.down, readHalf.axisTime, halfTimeTag),
    ...say('NOTICE THE SHAPE'),
    ...box(['Where does it climb?', 'Where does it stay flat?']),
  );

  await until(S(42));
  await play(
    enter(steep), ...say('STEEP CLIMBS', C.amber),
    ...box([['Many visits finish', C.amber], 'close together.'], C.amber),
  );

  await until(S(43));
  await play(
    exit(steep), draw(flat), ...say('LONG FLAT STRETCHES', C.pink),
    ...box([['Nobody finishes', C.pink], 'during the gap.'], C.pink),
  );

  // 44–50. Show the rule, then relabel the same heights from zero to one.
  await until(S(44));
  await play(
    exit(flat), ...say('THE SHORT RULE'),
    ...box([['Share finished by a time', C.cyan]]),
  );

  await until(S(45));
  await play(
    ...say('DIVIDE TWO COUNTS', C.amber),
    ...box([['Visits finished so far', C.amber], '÷ total visits'], C.amber),
  );

  await until(S(46));
  await play(
    ...say('THE HEIGHT IS THE SHARE'),
    ...box([['Share finished by a time', C.cyan], 'Visits finished so far', '÷ total visits']),
  );

  const decimals = yLabels(shareTicks, fullY, ['0', '0.25', '0.5', '0.75', '1'], C.cyan);

  await until(S(47));
  await play(
    sequence([exit(shares), enter(decimals)], 0.48, 1),
    ...say('USE A SCALE FROM 0 TO 1'),
    ...box(['Same share', ['0%–100% or 0–1', C.cyan]]),
  );

  const scaleMarkers = [0, half, total].map(count => dot(x0, fullY(count), C.amber, 0.074));

  await until(S(48));
  await play(
    sequence(scaleMarkers.map(enter), 0.93, 0.68),
    ...say('NOBODY, HALF, EVERYONE', C.amber),
    ...box(['0 = nobody', ['0.5 = half', C.amber], ['1 = everyone', C.green]], C.amber),
  );

  const decimal60 = reading(60, count60, C.green);

  await until(S(49));
  await play(
    remove(...scaleMarkers), draw(decimal60.up), draw(decimal60.left), enter(decimal60.hit),
    ...say('BACK TO 60 MINUTES', C.green),
    ...box(['At 60 minutes', ['18 ÷ 24 = 3/4', C.green]], C.green),
  );

  await until(S(50));
  await play(
    enter(decimal60.axisShare), flash(decimal60.axisShare, C.green),
    ...say('SAME SHARE, TWO WAYS', C.green),
    ...box(['18 ÷ 24 = 3/4', ['75% = 0.75', C.green]], C.green),
  );

  // 51–53. Use the chart in either direction.
  shares = yLabels(shareTicks, fullY, percentLabels);

  await until(S(51));
  await play(
    remove(decimal60.up, decimal60.left, decimal60.hit, decimal60.axisShare),
    sequence([exit(decimals), enter(shares)], 0.48, 1),
    ...say('SET A TIME LIMIT OR A PROMISE'),
    ...box([['Time → share', C.amber], ['Share → time', C.violet]]),
  );

  const use30 = reading(30, count30, C.amber);

  await until(S(52));
  await play(
    enter(use30.axisTime),
    sequence([draw(use30.up), enter(use30.hit), draw(use30.left)], 1.04, 0.9),
    ...say('START WITH A TIME', C.amber),
    ...box([['30 minutes → about 46%', C.amber]], C.amber),
  );

  const useHalf = reading(timeHalf, half, C.violet);

  await until(S(53));
  await play(
    remove(use30.axisTime, use30.up, use30.hit, use30.left),
    enter(useHalf.axisShare),
    sequence([draw(useHalf.right), enter(useHalf.hit), draw(useHalf.down), enter(useHalf.axisTime)], 1.22, 0.9),
    ...say('START WITH A SHARE', C.violet),
    ...box([['50% → 35 minutes', C.violet], ['75% → 60 minutes', C.green]], C.violet),
  );

  // 54–60. Show what the long gap says about the observed Saturday.
  const at95 = reading(95, count95, C.cyan);
  const at160 = reading(160, total, C.amber);
  const gap = line(fullX(95), fullY(count95), fullX(160), fullY(count95), C.pink, 6);
  const twoHours = dot(fullX(120), base, C.pink, 0.082);
  const possible = new M.Circle({ radius: 0.14, color: C.amber, strokeWidth: 2 });
  possible.setFill(C.bg, 0).moveTo(point(fullX(120), base - 0.29));
  const question = text('?', 21, C.amber, fullX(120), base + 0.37);

  await until(S(54));
  await play(
    remove(useHalf.axisShare, useHalf.right, useHalf.hit, useHalf.down, useHalf.axisTime),
    ...say('WATCH THE LONG GAP', C.pink),
    ...box(['What can one Saturday', ['tell us?', C.pink]], C.pink),
  );

  await until(S(55));
  await play(
    draw(at95.up), enter(at95.hit), flash(at95.hit, C.cyan),
    ...say('BY 95 MINUTES'),
    ...box(['95 min = 1 h 35 min', ['23 of 24 visits finished', C.cyan]]),
  );

  await until(S(56));
  await play(
    draw(at160.up), enter(at160.hit), flash(at160.hit, C.amber),
    ...say('THE LAST VISIT', C.amber),
    ...box(['160 min = 2 h 40 min', ['24 of 24 finished', C.amber]], C.amber),
  );

  await until(S(57));
  await play(
    draw(gap), ...say('95 TO 160 MIN: FLAT', C.pink),
    ...box(['From 95 to 160 min,', ['the count stays at 23.', C.pink]], C.pink),
  );

  await until(S(58));
  await play(
    enter(twoHours), flash(twoHours, C.pink),
    ...say('AROUND TWO HOURS', C.pink),
    ...box(['That Saturday, nobody', ['finished around 2 hours.', C.pink]], C.pink),
  );

  await until(S(59));
  await play(
    exit(twoHours), enter(possible), enter(question),
    ...say('ANOTHER SATURDAY', C.amber),
    ...box(['A visit could finish', ['around 2 hours.', C.amber]], C.amber),
  );

  await until(S(60));
  await play(
    remove(possible, question), ...say('ONLY 24 VISITS', C.pink),
    ...box(['Each step is about 4.2%.', ['Gaps can happen by chance.', C.pink]], C.pink),
  );

  await until(S(61));
  await play(
    remove(at95.up, at95.hit, at160.up, at160.hit, gap),
    ...say('CUMULATIVE STAIRCASE', C.green),
    ...box([['One step per visit', C.amber], ['Height = share', C.cyan], ['finished by that time', C.green]], C.green),
  );
}
