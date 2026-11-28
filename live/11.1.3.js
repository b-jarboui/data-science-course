// 11.1.3 Seasonality. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const sales = [
    [37, 39, 43, 52, 54, 67, 58],
    [44, 44, 52, 56, 63, 75, 65],
    [51, 53, 58, 63, 71, 80, 72],
    [58, 58, 65, 71, 78, 88, 79],
  ];
  const averages = [50, 57, 64, 71];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const colors = [C.cyan, C.pink, C.violet, C.green];
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const LEFT = CX - 2.9, RIGHT = CX + 3.35;
  const BASE = P ? -4.2 : -2.24, TOP = P ? 1.47 : 1.06;
  const say = (text, color = C.cyan) => showA(text, color, PILL, 18);
  const pt = (x, y) => [x, y, 0];
  const label = (text, x, y, size = 18, color = C.ink, mono = false) =>
    T(String(text), size, color, mono).moveTo(pt(x, y));
  const line = (start, end, color, strokeWidth = 2) =>
    new M.Line({ start, end, color, strokeWidth });
  const dot = (point, color, radius = 0.078) => {
    const d = new M.Dot({ point, color, radius });
    d.setFill(color, 1);
    return d;
  };
  const rect = (x, y, width, height, color, fill, opacity = 1) => {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.12, color, strokeWidth: 2 });
    if (fill) r.setFill(fill, opacity);
    return r.moveTo(pt(x, y));
  };
  const showAll = items => items.map(item => new M.FadeIn(item, { runTime: 0.42 }));
  const hideAll = items => items.map(item => new M.FadeOut(item, { runTime: 0.35 }));
  const stagger = (animations, runTime = 1.2) =>
    new M.LaggedStart(animations, { lagRatio: 0.1, runTime });

  let boxNow = null;
  function fbox(rows = [], color = C.cyan) {
    const animations = boxNow ? hideAll([boxNow]) : [];
    boxNow = null;
    if (!rows.length) return animations;
    const size = P ? 22 : 21, lh = P ? 0.44 : 0.42;
    const texts = rows.map(row => {
      const [text, ink] = Array.isArray(row) ? row : [row, C.ink];
      return T(text, size, ink, true);
    });
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.7;
    const height = rows.length * lh + 0.4;
    const panel = rect(BOXP[0], BOXP[1], width, height, color, C.card, 0.95);
    texts.forEach((t, i) => t.moveTo(pt(
      BOXP[0] - width / 2 + 0.35 + t.getWidth() / 2,
      BOXP[1] + (rows.length - 1) * lh / 2 - i * lh,
    )));
    boxNow = new M.VGroup(panel, ...texts);
    const maxWidth = P ? FW - 1.2 : 4;
    if (width > maxWidth) boxNow.scale(maxWidth / width).moveTo(BOXP);
    return [...animations, ...showAll([boxNow])];
  }

  const xDate = i => LEFT + 0.12 + i * (RIGHT - LEFT - 0.24) / 27;
  const xDay = d => LEFT + 0.24 + d * (RIGHT - LEFT - 0.48) / 6;
  const ySales = v => BASE + (v - 30) * (TOP - BASE) / 62;
  const position = (week, day, stacked) =>
    pt(stacked ? xDay(day) : xDate(week * 7 + day), ySales(sales[week][day]));
  const dateLabels = () => sales.map((_, w) =>
    label(`Week ${w + 1}`, xDate(w * 7 + 3), BASE - 0.34, P ? 18 : 16, C.muted));
  const dayLabels = () => days.map((day, d) => label(day, xDay(d), BASE - 0.34, P ? 18 : 16, C.ink));
  const trace = (points, color) => ({
    edges: points.slice(1).map((p, i) => line(points[i], p, color, 3)),
    dots: points.map(p => dot(p, color)),
  });
  const parts = ({ edges, dots }) => [...edges, ...dots];

  let plot = null, rings = [];
  function makePlot(stacked, colored) {
    const axes = [
      line(pt(LEFT, BASE), pt(LEFT, TOP), C.muted),
      label('Loaves sold', LEFT + (P ? 0.6 : 0.51), TOP + 0.27, P ? 18 : 16, C.muted),
    ];
    for (const value of [30, 50, 70, 90]) {
      const y = ySales(value);
      axes.push(line(pt(LEFT, y), pt(RIGHT, y), value === 30 ? C.muted : C.grid, 1.5));
      axes.push(label(value, LEFT - (P ? 0.42 : 0.39), y, P ? 18 : 16, C.muted, true));
    }
    const weeks = sales.map((week, w) =>
      trace(week.map((_, d) => position(w, d, stacked)), colored ? colors[w] : C.cyan));
    const joins = stacked ? [] : sales.slice(1).map((_, i) =>
      line(position(i, 6, false), position(i + 1, 0, false), C.cyan, 3));
    if (colored) axes.push(...legend());
    return { axes, weeks, joins, labels: stacked ? dayLabels() : dateLabels() };
  }

  function revealPlot(stacked, colored) {
    plot = makePlot(stacked, colored);
    return [
      ...showAll([...plot.axes, ...plot.labels]),
      stagger(showAll([...plot.joins, ...plot.weeks.flatMap(parts)])),
    ];
  }

  function clearPlot() {
    const outgoing = [
      ...marks([]),
      ...hideAll([...plot.axes, ...plot.labels, ...plot.joins, ...plot.weeks.flatMap(parts)]),
    ];
    plot = null;
    return outgoing;
  }

  function cutWeeks() {
    const outgoing = hideAll(plot.joins);
    plot.joins = [];
    return outgoing;
  }

  function stackWeeks() {
    const outgoing = [...cutWeeks(), ...hideAll(plot.labels)];
    plot.labels = [];
    const moves = plot.weeks.map((week, w) => {
      const target = trace(sales[w].map((_, d) => position(w, d, true)), C.cyan);
      return stagger(parts(week).map((item, i) => new M.Transform(item, parts(target)[i])), 0.92);
    });
    return [...outgoing, stagger(moves, 1.6)];
  }

  function addWeekdays() {
    plot.labels = dayLabels();
    return showAll(plot.labels);
  }

  function legend() {
    return colors.flatMap((color, w) => {
      const x = LEFT + 0.35 + (w % 2) * (P ? 1.75 : 1.55), y = TOP - 0.12 - Math.floor(w / 2) * (P ? 0.45 : 0.4);
      const name = label(`Week ${w + 1}`, 0, y, P ? 18 : 17, color);
      name.moveTo(pt(x + 0.42 + name.getWidth() / 2, y));
      return [line(pt(x, y), pt(x + 0.32, y), color, 3.5), name];
    });
  }

  function colorWeeks() {
    const key = legend();
    plot.axes.push(...key);
    plot.weeks.forEach((week, w) => {
      week.edges.forEach(edge => edge.setColor(colors[w]));
      week.dots.forEach(d => {
        d.setColor(colors[w]);
        d.setFill(colors[w], 1);
      });
    });
    return showAll(key);
  }

  function marks(cells, color = C.amber) {
    const outgoing = hideAll(rings);
    rings = cells.map(([w, d]) => {
      const ring = new M.Circle({ radius: 0.14, color, strokeWidth: 2.5 });
      return ring.moveTo(position(w, d, true));
    });
    return [...outgoing, ...showAll(rings)];
  }

  const allOn = d => sales.map((_, w) => [w, d]);
  const landmarks = w => [[w, 0], [w, 5], [w, 6]];
  const trendPoints = averages.map((v, w) => pt(xDate(w * 7 + 3), ySales(v)));
  const trend = trendPoints.slice(1).map((end, i) =>
    new M.DashedLine({ start: trendPoints[i], end, color: C.amber, strokeWidth: 2.5 }));
  trend.push(...trendPoints.map(p => dot(p, C.amber, 0.09)));

  // 0–8. See the trend and the daily changes, then cut and stack the weeks.
  await until(S(0));
  await play(...revealPlot(false, false), ...showAll(trend), ...say('SALES TREND UP', C.amber));
  await until(S(1));
  await play(...hideAll(trend), ...say('DAILY SALES RISE AND FALL'));
  await until(S(2));
  await play(...say('DO THE UPS AND DOWNS REPEAT?', C.amber));
  await until(S(3));
  await play(...cutWeeks(), ...say('CUT INTO FOUR WEEKS'));
  await until(S(4));
  await play(...say('A WEEK IS ONE CYCLE'), ...fbox(['Last day: Sunday', ['Next day: Monday', C.cyan]]));
  await until(S(5));
  await play(...stackWeeks(), ...fbox(), ...say('STACK THE WEEKS'));
  await until(S(6));
  await play(...addWeekdays(), ...say('MONDAY TO SUNDAY'));
  await until(S(7));
  await play(...colorWeeks(), ...say('ONE COLOUR PER WEEK'));

  await until(S(8));
  await play(...marks([[0, 0]]), ...say('WEEK 1', colors[0]), ...fbox(['Monday', ['37 loaves', colors[0]]]));

  // 9–14. Read the shape of each week and distinguish it from the rising level.
  await until(S(9));
  await play(...marks([[0, 5]]), ...fbox(['Saturday peak', ['67 loaves', colors[0]]]));
  await until(S(10));
  await play(...marks([[0, 6]]), ...fbox(['Sunday', ['58 loaves', colors[0]]]));
  await until(S(11));
  await play(...marks(landmarks(1)), ...fbox(), ...say('WEEK 2', colors[1]));
  await until(S(12));
  await play(...marks([...landmarks(2), ...landmarks(3)]), ...say('WEEKS 3 AND 4', C.violet));
  await until(S(13));
  await play(...marks(allOn(5)), ...say('FOUR COPIES OF THE SAME SHAPE'));
  await until(S(14));
  await play(...marks([]), ...say('ABOUT 7 LOAVES HIGHER EACH WEEK', C.amber),
    ...fbox(['Weekly averages', ['50 → 57 → 64 → 71', C.amber]], C.amber));

  // 15–20. Fill the comparison table one week at a time.
  const cols = [-2.48, -0.86, 0.77, 2.44].map(dx => CX + dx);
  const headerY = P ? 1.04 : 0.82, pitch = P ? 0.86 : 0.61;
  const rowY = w => headerY - (w + 1) * pitch;
  const table = [
    ...['Week', 'Saturday', 'Monday', 'More'].map((text, col) =>
      label(text, cols[col], headerY, 17, C.muted)),
    line(pt(CX - 3.16, headerY - 0.29), pt(CX + 3.16, headerY - 0.29), C.grid),
  ];

  function addRow(w) {
    const sat = sales[w][5], mon = sales[w][0], more = sat - mon;
    const row = [
      label(w + 1, cols[0], rowY(w), 20, colors[w], true),
      label(sat, cols[1], rowY(w), 21, C.ink, true),
      label(mon, cols[2], rowY(w), 21, C.ink, true),
      label(more, cols[3], rowY(w), 21, C.amber, true),
    ];
    table.push(...row);
    return [...showAll(row), ...fbox([`Week ${w + 1}`, [`${sat} − ${mon} = ${more}`, C.amber]], C.amber)];
  }

  await until(S(15));
  await play(...clearPlot(), ...showAll(table), ...fbox(), ...say('SATURDAY COMPARED WITH MONDAY'));
  await until(S(16)); await play(...addRow(0));
  await until(S(17)); await play(...addRow(1));
  await until(S(18)); await play(...addRow(2));
  await until(S(19)); await play(...addRow(3));
  await until(S(20));
  const differenceOutline = rect(cols[3], (rowY(0) + rowY(3)) / 2, 0.98, 3 * pitch + 0.47, C.amber);
  table.push(differenceOutline);
  await play(new M.Create(differenceOutline), ...fbox([['About 30 more loaves', C.amber]], C.amber),
    ...say('THE SATURDAY GAP REPEATS', C.amber));

  // 21–25. Name the recurring pattern and count its period.
  await until(S(21));
  await play(...hideAll(table), ...revealPlot(true, true), ...marks(allOn(5)), ...fbox(),
    ...say('MORE LOAVES EVERY SATURDAY'));
  await until(S(22));
  await play(...say('SEASONALITY', C.green), ...fbox(['Same points in', ['each cycle', C.green]], C.green));

  const seasons = ['Spring', 'Summer', 'Autumn', 'Winter'].map((name, i) => {
    const x = CX + (i - 1.5) * 1.58;
    return new M.VGroup(
      rect(x, -0.58, 1.48, 0.83, colors[i], C.card, 0.95),
      label(name, x, -0.58, 17, colors[i]),
    );
  });
  await until(S(23));
  await play(...clearPlot(), stagger(showAll(seasons)), ...fbox(), ...say('FOUR SEASONS IN A YEAR'));
  await until(S(24));
  await play(...hideAll(seasons), ...revealPlot(true, true), ...say('THE BAKERY CYCLE: ONE WEEK'),
    ...fbox(['Weekly cycle', ['Yearly cycle', C.violet]]));
  const counts = days.map((_, d) => label(d + 1, xDay(d), BASE - 0.74, 17, C.amber, true));
  await until(S(25));
  await play(stagger(showAll(counts), 1.4), ...say('PERIOD = LENGTH OF ONE CYCLE', C.amber),
    ...fbox([['7 days', C.amber]], C.amber));

  // 26–27. A chorus returns at the same place in the next block of lines.
  const song = Array.from({ length: 6 }, (_, i) => {
    const chorus = i % 3 === 2, x = CX + (i - 2.5) * 1.04 + (i < 3 ? -0.1 : 0.1);
    const color = chorus ? C.amber : C.muted;
    return new M.VGroup(
      rect(x, -0.54, 0.99, 0.7, color, C.card, 0.95),
      label(chorus ? 'Chorus' : 'Line', x, -0.54, 15, color),
    );
  });
  await until(S(26));
  await play(...hideAll(counts), ...clearPlot(), ...fbox(), ...say('THE CHORUS COMES BACK'),
    stagger(showAll(song), 2.6));
  await until(S(27));
  const chorus1 = CX - 0.62, chorus2 = CX + 2.7;
  const returnSpan = [
    new M.Arrow({ start: pt(chorus1, -1.48), end: pt(chorus2, -1.48), color: C.amber }),
    label('One period', (chorus1 + chorus2) / 2, -1.87, 17, C.amber),
  ];
  await play(...showAll(returnSpan), ...say('THE PERIOD TELLS YOU WHEN IT RETURNS', C.amber));

  // 28–31. Guess a cycle, cut and stack it, and check the shapes.
  await until(S(28));
  const stepCards = ['1 · Guess the cycle', '2 · Cut and stack', '3 · Check the shapes'].map((text, i) => {
    const y = (P ? 0.3 : 0.55) - i * (P ? 1.35 : 1.05);
    return new M.VGroup(
      rect(CX, y, P ? 5.6 : 5.2, P ? 0.95 : 0.8, i === 2 ? C.green : C.amber, C.card, 0.95),
      label(text, CX, y, P ? 24 : 22, C.ink),
    );
  });
  await play(...hideAll([...song, ...returnSpan]), stagger(showAll(stepCards), 1.5),
    ...say('FIND SEASONALITY IN THREE STEPS'));
  await until(S(29));
  await play(...hideAll(stepCards), ...revealPlot(false, false), ...say('STEP 1 · GUESS THE CYCLE', C.amber),
    ...fbox([['One week', C.amber]], C.amber));
  await until(S(30));
  await play(...stackWeeks(), ...say('STEP 2 · CUT AND STACK'), ...fbox());
  await play(...addWeekdays());
  await until(S(31));
  await play(...colorWeeks(), ...marks(allOn(5)), ...say('STEP 3 · CHECK IF THE SHAPES LINE UP', C.green),
    ...fbox([['Saturday peaks', C.green]], C.green));

  // 32–38. Plan by weekday, then compare the same weekday across weeks.
  await until(S(32));
  await play(...marks([...allOn(0), ...allOn(5)]), ...say('EXPECT SALES TO VARY BY DAY'),
    ...fbox(['Monday is quieter', ['Saturday is busier', C.amber]]));
  await until(S(33));
  await play(...say('PLAN BAKING BY WEEKDAY', C.green),
    ...fbox(['Monday: bake less', ['Saturday: bake more', C.green]], C.green));
  await until(S(34));
  await play(...marks([]), ...say('SEASONALITY AND TREND', C.amber),
    ...fbox(['Shape by weekday', ['Level across weeks', C.amber]], C.amber));
  await until(S(35));
  await play(...marks([[3, 5]]), ...say('SATURDAY IS USUALLY BUSY'),
    ...fbox(['Week 4 Saturday', ['88 loaves', colors[3]]]));
  await until(S(36));
  await play(...marks([[2, 5], [3, 5]]), ...say('COMPARE SATURDAY WITH SATURDAY', C.amber),
    ...fbox([['Week 3 Sat: 80', colors[2]], ['Week 4 Sat: 88', colors[3]]], C.amber));
  await until(S(37));
  await play(...say('SAME WEEKDAY, ONE WEEK EARLIER'),
    ...fbox(['Week 4 Saturday', ['↳ Week 3 Saturday', colors[2]]]));
  await until(S(38));
  await play(...marks(allOn(5)), ...say('SEASONALITY = A REPEATING PATTERN', C.green),
    ...fbox(['Period = cycle length', ['Here: 7 days', C.amber]], C.green));
}
