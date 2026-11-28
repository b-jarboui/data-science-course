// 11.1.2 Trend. Beat i follows sentence i in the narration.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const weeks = [
    [37, 39, 43, 52, 54, 67, 58],
    [44, 44, 52, 56, 63, 75, 65],
    [51, 53, 58, 63, 71, 80, 72],
    [58, 58, 65, 71, 78, 88, 79],
  ];
  const daily = weeks.flat();
  const totals = weeks.map(week => week.reduce((sum, value) => sum + value, 0));
  const averages = totals.map(total => total / 7);
  const centers = weeks.map((_, i) => 4 + 7 * i);

  const CX = P ? 0 : -2.6, BASE = P ? -4.2 : -2.35;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const LEFT = CX - (P ? 3.05 : 3.45), RIGHT = CX + (P ? 3.4 : 3.8);
  const TOP = P ? 1.24 : 0.99;
  const x = day => LEFT + (day - 1) / 31 * (RIGHT - LEFT);
  const y = loaves => BASE + (loaves - 30) / 65 * (TOP - BASE);
  const point = (day, loaves) => [x(day), y(loaves), 0];
  const label = (text, size, color, px, py, mono = true) =>
    T(text, size, color, mono).moveTo([px, py, 0]);
  const say = (text, color = C.cyan) => showA(text, color, PILL, P ? 17 : 19);
  const group = (...items) => new M.VGroup(...items);
  const enter = object => new M.FadeIn(object, { runTime: 0.38 });
  const exit = object => new M.FadeOut(object, { runTime: 0.32 });
  const draw = object => new M.Create(object, { runTime: 0.55 });
  const sequence = (animations, runTime = 1.1) =>
    new M.LaggedStart(animations, { lagRatio: 0.5, runTime });
  const line = (start, end, color, strokeWidth = 2) =>
    new M.Line({ start, end, color, strokeWidth });
  const dashed = (start, end, color, strokeWidth = 2) =>
    new M.DashedLine({ start, end, color, strokeWidth });
  const connect = (points, color, width) =>
    points.slice(1).map((end, i) => line(points[i], end, color, width));

  let boxNow;
  function fbox(rows = [], color = C.cyan) {
    const animations = boxNow ? [exit(boxNow)] : [];
    boxNow = null;
    if (!rows.length) return animations;
    const size = P ? 22 : 21, lh = P ? 0.39 : 0.42;
    const texts = rows.map(row => {
      const [text, ink = C.ink] = Array.isArray(row) ? row : [row];
      return T(text, size, ink, true);
    });
    const width = Math.max(...texts.map(text => text.getWidth())) + 0.62;
    const height = lh * texts.length + 0.16;
    const card = new M.RoundedRectangle({
      width, height, cornerRadius: 0.16, color, strokeWidth: 2,
    });
    card.setFill(C.card, 0.95);
    card.moveTo(BOXP);
    texts.forEach((text, i) => text.moveTo([
      BOXP[0] - width / 2 + 0.31 + text.getWidth() / 2,
      BOXP[1] + (texts.length - 1 - 2 * i) * lh / 2,
      0,
    ]));
    boxNow = group(card, ...texts);
    const maxWidth = P ? FW - 1.2 : 4.0;
    if (width > maxWidth) boxNow.scale(maxWidth / width);
    animations.push(enter(boxNow));
    return animations;
  }

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const tableX = col => CX + (col - 3.5) * (P ? 0.76 : 0.87);
  const tableY = row => (P ? 0.63 : 0.53) - row * (P ? 0.72 : 0.59);
  function notebook() {
    const rows = weeks.map((week, i) => group(
      ...week.map((value, j) => label(String(value), 20, C.ink, tableX(j + 1), tableY(i + 1))),
    ));
    const header = group(...weekdays.map((day, i) =>
      label(day, P ? 18 : 16, C.cyan, tableX(i + 1), tableY(0))),
      ...weeks.map((_, i) => label(`W${i + 1}`, P ? 18 : 16, C.muted, tableX(0), tableY(i + 1))));
    const card = new M.RoundedRectangle({
      width: P ? 6.35 : 7.2, height: P ? 4.02 : 3.42,
      cornerRadius: 0.16, color: C.grid, strokeWidth: 2,
    });
    card.setFill(C.card, 0.9);
    card.moveTo([CX, tableY(2), 0]);
    return { card, header, rows };
  }

  function axes() {
    const marks = [30, 50, 70, 90].flatMap(value => {
      const grid = line(point(1, value), point(28, value), C.grid, 1);
      return [grid, label(String(value), P ? 18 : 15, C.muted, LEFT - (P ? 0.36 : 0.31), y(value))];
    });
    return group(
      ...marks,
      line(point(1, 30), point(28, 30), C.muted),
      line(point(1, 30), point(1, 95), C.muted),
      ...[1, 7, 14, 21, 28].map(day => label(String(day), P ? 18 : 15, C.muted, x(day), BASE - (P ? 0.26 : 0.22))),
      label('Day', P ? 18 : 16, C.muted, (x(1) + x(28)) / 2, BASE - (P ? 0.6 : 0.49), false),
      label('Loaves sold', P ? 18 : 16, C.muted, LEFT + (P ? 0.6 : 0.48), TOP + 0.27, false),
    );
  }

  function salesPlot() {
    const points = daily.map((value, i) => point(i + 1, value));
    return {
      axes: axes(),
      trace: group(...connect(points, C.cyan, 1.65)),
      dots: group(...points.map(p => new M.Dot({ point: p, radius: 0.045, color: C.cyan }))),
    };
  }

  function meanDots() {
    return averages.map((value, i) => {
      const p = point(centers[i], value);
      const glow = new M.Dot({ point: p, radius: 0.18, color: C.amber });
      glow.setFill(C.amber, 0.2);
      return group(glow, new M.Dot({ point: p, radius: 0.105, color: C.amber }));
    });
  }

  function meanLine() {
    return line(point(centers[0], averages[0]), point(centers[3], averages[3]), C.amber, 3);
  }

  function rings(days, color = C.amber) {
    return group(...days.map(day => new M.Circle({
      radius: 0.125, color, strokeWidth: 2,
    }).moveTo(point(day, daily[day - 1]))));
  }

  let plot = salesPlot();
  let marks;
  const book = notebook();

  await until(S(0));
  await play(enter(book.card), enter(book.header), ...book.rows.map(enter), ...say('THE BAKERY NOTEBOOK'));

  await until(S(1));
  await play(sequence(book.rows.map(row => new M.Indicate(row, { color: C.cyan, runTime: 0.6 })), 1.65),
    ...say('4 WEEKS · 28 DAYS'));

  await until(S(2));
  await play(...say('SELLING MORE, LESS, OR THE SAME?', C.amber));

  await until(S(3));
  await play(exit(group(book.card, book.header, ...book.rows)),
    sequence([enter(plot.axes), enter(plot.dots), enter(plot.trace)], 2.1),
    ...say('ONE DOT PER DAY'));

  await until(S(4));
  const more = label('Higher dot', 21, C.cyan, BOXP[0], BOXP[1] + 0.16, false);
  await play(...fbox([[`↑ ${'More loaves'}`, C.cyan]]), ...say('HEIGHT SHOWS LOAVES SOLD'));

  await until(S(5));
  marks = rings([1]);
  await play(enter(marks), ...say('WEEK 1 · MONDAY'),
    ...fbox([['37 loaves', C.amber]], C.amber));

  await until(S(6));
  let weekend = rings([6]);
  await play(exit(marks), enter(weekend), ...say('WEEK 1 · SATURDAY'),
    ...fbox([['67 loaves', C.amber]], C.amber));
  await until(S(6) + 2.65);
  marks = rings([7]);
  await play(exit(weekend), enter(marks), ...say('WEEK 1 · SUNDAY'),
    ...fbox([['58 loaves', C.amber]], C.amber));

  await until(S(7));
  const monday = rings([8]);
  await play(exit(marks), enter(monday), ...say('WEEK 2 · MONDAY'),
    ...fbox([['44 loaves', C.amber]], C.amber));

  await until(S(8));
  const weekends = [6, 13, 20, 27].map(day => rings([day]));
  await play(exit(monday), sequence(weekends.map(enter), 1.65),
    ...fbox(), ...say('UP AND DOWN EACH WEEK'));

  await until(S(9));
  await play(exit(group(...weekends)), ...say('IS THE BAKERY GROWING?', C.amber));

  // Set aside the daily trace while each seven-day group becomes one average.
  const averageX = i => CX + (i - 1.5) * (P ? 1.61 : 1.74);
  const cardY = P ? -1.15 : -0.94;
  const cardWidth = P ? 1.46 : 1.58;
  const cardX = i => P ? (i % 2 ? 1.5 : -1.5) : averageX(i);
  const cardYi = i => P ? (i < 2 ? -0.75 : -2.95) : cardY;
  const weekCards = weeks.map((_, i) => {
    const card = new M.RoundedRectangle({
      width: P ? 2.6 : cardWidth, height: P ? 1.9 : 1.48, cornerRadius: 0.16, color: C.grid, strokeWidth: 2,
    });
    card.setFill(C.card, 0.95);
    card.moveTo([cardX(i), cardYi(i), 0]);
    const caption = label(`Week ${i + 1}`, P ? 20 : 18, C.muted, cardX(i), cardYi(i) + (P ? 0.5 : 0.4));
    return group(card, caption);
  });
  const weekNumbers = averages.map((value, i) =>
    label(String(value), P ? 34 : 28, C.amber, cardX(i), cardYi(i) - (P ? 0.25 : 0.2)));
  const blockY = P ? 0.95 : cardY + 1.38;
  const dailyBlocks = weeks[0].map((_, i) => {
    const block = new M.Rectangle({ width: 0.37, height: 0.37, color: C.cyan, strokeWidth: 1 });
    block.setFill(C.cyan, 0.76);
    block.moveTo([CX + (i - 3) * 0.61, blockY, 0]);
    return block;
  });
  const sevenDays = group(...dailyBlocks);
  const equalShares = weeks[0].map((_, i) => {
    const block = new M.Rectangle({ width: 0.54, height: 0.49, color: C.amber, strokeWidth: 1 });
    const px = CX + (i - 3) * 0.61, py = blockY;
    block.setFill(C.card, 0.95);
    block.moveTo([px, py, 0]);
    return group(block, label('50', 16, C.amber, px, py));
  });

  await until(S(10));
  await play(exit(group(plot.axes, plot.trace, plot.dots)),
    enter(group(...weekCards)), ...say('ONE AVERAGE FOR EACH WEEK', C.amber));

  await until(S(11));
  await play(enter(sevenDays), ...say('THE AVERAGE IS THE FAIR SHARE', C.amber),
    ...fbox(['Add the daily sales', 'Divide by the day count'], C.amber));

  await until(S(12));
  await play(...say('WEEK 1 · TOTAL AND FAIR SHARE', C.amber),
    ...fbox([['350 loaves', C.amber], '7 days'], C.amber));
  await until(S(12) + 3.8);
  const shares = group(...equalShares);
  await play(exit(sevenDays), enter(shares),
    ...fbox([['350 ÷ 7 = 50', C.amber]], C.amber));

  await until(S(13));
  await play(exit(shares), enter(weekNumbers[0]), ...say('WEEK 1 AVERAGES 50', C.amber),
    ...fbox(['50 loaves per day'], C.amber));

  await until(S(14));
  await play(enter(weekNumbers[1]), ...say('WEEK 2 AVERAGES 57', C.amber),
    ...fbox(['57 loaves per day'], C.amber));

  await until(S(15));
  await play(enter(weekNumbers[2]), ...say('WEEK 3 AVERAGES 64', C.amber),
    ...fbox(['64 loaves per day'], C.amber));

  await until(S(16));
  await play(enter(weekNumbers[3]), ...say('WEEK 4 AVERAGES 71', C.amber),
    ...fbox(['71 loaves per day'], C.amber));

  await until(S(17));
  plot = salesPlot();
  let means = meanDots();
  await play(exit(group(...weekCards, ...weekNumbers)),
    enter(plot.axes), enter(plot.trace), enter(plot.dots),
    sequence(means.map(enter), 1.55), ...fbox(), ...say('BIG DOTS · WEEKLY AVERAGES', C.amber));

  const steps = group(...averages.slice(1).flatMap((value, i) => {
    const corner = point(centers[i + 1], averages[i]);
    return [
      dashed(point(centers[i], averages[i]), corner, C.amber, 1.8),
      dashed(corner, point(centers[i + 1], value), C.amber, 1.8),
    ];
  }));

  await until(S(18));
  await play(enter(steps), ...say('THE AVERAGES CLIMB', C.amber),
    ...fbox([['50 → 57 → 64 → 71', C.amber]], C.amber));

  await until(S(19));
  await play(...say('SAME RISE EACH WEEK', C.amber),
    ...fbox(['50 → 57 → 64 → 71', ['   +7   +7   +7', C.amber]], C.amber));

  await until(S(20));
  await play(...say('EACH STEP TAKES 7 DAYS', C.amber),
    ...fbox([['7 ÷ 7 = 1', C.amber], 'About 1 more per day'], C.amber));

  await until(S(21));
  const jumps = [6, 13, 20, 27].map(day => rings([day, day + 1], C.cyan));
  await play(exit(steps), sequence(jumps.map(enter), 1.6),
    ...fbox(), ...say('THE DAILY JUMPS ARE STILL THERE'));

  await until(S(22));
  await play(exit(group(...jumps)), sequence(means.map(dot =>
    new M.Indicate(dot, { color: C.amber, runTime: 0.55 })), 1.45),
    ...say('THE WHOLE LEVEL IS RISING', C.amber));

  await until(S(23));
  const levels = group(...averages.map((value, i) =>
    dashed(point(i * 7 + 1, value), point(i * 7 + 7, value), C.amber, 1.8)));
  await play(enter(levels), ...say('LEVEL · WHERE SALES ROUGHLY SIT', C.amber));

  await until(S(24));
  await play(...say('TREND · SLOW CHANGE IN LEVEL', C.amber));

  // The tide picture occupies the plot's space while the bakery chart is away.
  const tidePoint = i => [CX - 2.95 + i / 36 * 5.9, (P ? -2.55 : -1.65) + i / 36 * 1.6, 0];
  const wavePoints = Array.from({ length: 37 }, (_, i) => {
    const [px, py] = tidePoint(i);
    return [px, py + 0.48 * Math.sin(i * Math.PI / 4.5), 0];
  });
  const waves = group(...connect(wavePoints, C.cyan, 3));
  const tide = dashed(tidePoint(0), tidePoint(36), C.amber, 2.3);

  await until(S(25));
  await play(exit(group(plot.axes, plot.trace, plot.dots, ...means, levels)),
    sequence([enter(waves), draw(tide)], 2), ...say('WAVES AND A RISING TIDE'));

  await until(S(26));
  await play(...say('THE TREND IS LIKE THE TIDE', C.amber),
    ...fbox([['Waves → daily jumps', C.cyan], ['Tide → trend', C.amber]], C.amber));

  await until(S(27));
  plot = salesPlot();
  means = meanDots();
  const trend = meanLine();
  await play(exit(group(waves, tide)), enter(plot.axes), enter(plot.trace), enter(plot.dots),
    ...means.map(enter), draw(trend), ...fbox(), ...say('A LINE THROUGH THE AVERAGES', C.amber));

  await until(S(28));
  await play(...say('A SLOW, STEADY RISE', C.amber),
    ...fbox([['About 1 more loaf', C.amber], ['per day', C.amber]], C.amber));

  await until(S(29));
  const timeArrow = new M.Arrow({
    start: [x(14) + 0.38, BASE - 0.47, 0],
    end: [x(28), BASE - 0.47, 0],
    color: C.amber, strokeWidth: 2,
  });
  await play(draw(timeArrow), ...fbox(), ...say('ACROSS THE AXIS · TIME', C.amber));

  await until(S(30));
  await play(exit(timeArrow), ...say('GROWING, SHRINKING, OR FLAT?', C.amber),
    ...fbox([['The bakery is growing', C.amber]], C.amber));

  // Day 32 is the middle of the fifth week, matching the placement of the observed averages.
  const projection = group(
    dashed(point(25, 71), point(32, 78), C.amber, 2.6),
    new M.Circle({ radius: 0.108, color: C.amber, strokeWidth: 2 }).moveTo(point(32, 78)),
    dashed(point(28, 30), point(32, 30), C.muted),
    label('32', P ? 18 : 15, C.muted, x(32), BASE - (P ? 0.26 : 0.22)),
  );

  await until(S(31));
  await play(enter(projection), ...say('IF THE TREND KEEPS GOING', C.amber),
    ...fbox(['Week 5 average', ['71 + 7 = 78', C.amber], 'About 78 loaves a day'], C.amber));

  await until(S(32));
  await play(exit(projection), ...fbox(), ...say('THE TWO-DAY TRAP', C.pink));

  await until(S(33));
  const pair = [8, 6].map(day => rings([day], C.pink));
  await play(sequence(pair.map(enter), 1.25), ...say('TWO SINGLE DAYS', C.pink),
    ...fbox([['Week 2 Mon   44', C.pink], ['Week 1 Sat   67', C.pink]], C.pink));

  await until(S(34));
  const drop = dashed(point(6, 67), point(8, 44), C.pink, 2.5);
  await play(draw(drop), ...say('THOSE TWO DAYS SHOW A DROP', C.pink),
    ...fbox([['44 − 67 = −23', C.pink], '23 fewer loaves'], C.pink));

  await until(S(35));
  await play(exit(group(...pair, drop)),
    sequence(means.map(dot => new M.Indicate(dot, { color: C.amber, runTime: 0.55 })), 1.45),
    ...say('THE WEEKLY AVERAGES RISE', C.amber),
    ...fbox([['50 → 57 → 64 → 71', C.amber]], C.amber));

  await until(S(36));
  const lastDay = dashed(point(28, 30), point(28, 94), C.muted);
  await play(draw(lastDay), ...say('WE OBSERVED FOUR WEEKS', C.violet),
    ...fbox(['Future sales are unknown'], C.violet));

  await until(S(37));
  const saturdays = [6, 13, 20, 27].map(day => rings([day], C.cyan));
  await play(exit(lastDay), sequence(saturdays.map(enter), 1.7),
    ...say('WHY DO SATURDAYS PEAK?'),
    ...fbox(['Saturday sales', ['67 · 75 · 80 · 88', C.cyan]]));

  await until(S(38));
  await play(exit(group(plot.trace, plot.dots, ...saturdays)), ...fbox(),
    ...say('TREND · SLOW CHANGE IN LEVEL', C.amber));
}
