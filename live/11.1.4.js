// 11.1.4 Lagged values. Beat i = sentence i (0-based).
// Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const sales = [
    37, 39, 43, 52, 54, 67, 58,
    44, 44, 52, 56, 63, 75, 65,
    51, 53, 58, 63, 71, 80, 72,
    58, 58, 65, 71, 78, 88, 79,
  ];
  const winter = [40, 40, null, 0, 55, 70, 55];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const CX = P ? 0 : -2.6;
  const BASE = P ? -4.2 : -2.35;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const left = CX - (P ? 3.3 : 3.65);
  const right = CX + (P ? 3.3 : 3.65);
  const span = right - left;
  const say = (s, color = C.cyan) => showA(s, color, PILL, P ? 17 : 19);
  const put = (text, x, y, color = C.ink, size = 19, mono = false) =>
    T(text, size, color, mono).moveTo([x, y, 0]);
  const line = (x1, y1, x2, y2, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth });
  const dot = (x, y, color = C.cyan, radius = 0.072) => {
    const d = new M.Dot({ point: [x, y, 0], radius, color });
    d.setFill(color, 1);
    return d;
  };
  const ring = (x, y, color, radius = 0.124) => {
    const c = new M.Circle({ radius, color, strokeWidth: 2 });
    c.setFill(color, 0);
    c.moveTo([x, y, 0]);
    return c;
  };

  const diagram = new Map();
  function layer(name, next = null, duration = 0.32) {
    const previous = diagram.get(name);
    diagram.set(name, next);
    return [
      ...(previous ? [new M.FadeOut(previous, { runTime: duration })] : []),
      ...(next ? [new M.FadeIn(next, { runTime: duration })] : []),
    ];
  }

  function fbox(lines, color = C.cyan) {
    const size = P ? 19 : 20;
    const texts = lines.map(l => {
      const [text, ink] = Array.isArray(l) ? l : [l, C.ink];
      return T(text, size, ink, true);
    });
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.48;
    const height = texts.length > 1 ? 0.94 : 0.55;
    const bg = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    bg.setFill(C.card, 0.95);
    bg.moveTo(BOXP);
    texts.forEach((t, i) => {
      const x = BOXP[0] - width / 2 + 0.24 + t.getWidth() / 2;
      const y = BOXP[1] + (i === 0 ? 0.2 : -0.2) * (texts.length > 1 ? 1 : 0);
      t.moveTo([x, y, 0]);
    });
    const g = new M.VGroup(bg, ...texts);
    const max = P ? FW - 1.2 : 4.0;
    if (width > max) g.scale(max / width);
    return layer('box', g);
  }

  const wx = i => left + span * (i + 0.5) / 4;
  const weeklyY = v => BASE + (v - 30) * (P ? 0.074 : 0.046);
  function weekly() {
    const averages = [50, 57, 64, 71];
    const parts = [line(left, BASE, right, BASE), put('Loaves sold', CX, weeklyY(88) + 0.54, C.muted)];
    averages.forEach((average, i) => {
      const x = wx(i);
      const saturday = sales[i * 7 + 5];
      const height = weeklyY(average) - BASE;
      const bar = new M.Rectangle({ width: 0.52, height, color: C.cyan, strokeWidth: 1 });
      bar.setFill(C.cyan, 0.64);
      bar.moveTo([x, BASE + height / 2, 0]);
      parts.push(bar, put(String(average), x, weeklyY(average) + 0.22, C.cyan, 18, true),
        dot(x, weeklyY(saturday), C.amber, 0.09),
        put(String(saturday), x, weeklyY(saturday) + 0.26, C.amber, 18, true),
        put(`Week ${i + 1}`, x, BASE - 0.32, C.muted, 17));
    });
    return new M.VGroup(...parts);
  }

  const xDay = i => left + span * (i + 0.5) / sales.length;
  const seriesFloor = BASE + (P ? 0.35 : 0.61);
  const seriesTop = P ? 0.7 : 0.76;
  const ySales = v => seriesFloor + (v - 30) / 60 * (seriesTop - seriesFloor);
  const names = i => `W${Math.floor(i / 7) + 1} ${days[i % 7]}`;
  function series() {
    const parts = [];
    for (const v of [30, 50, 70, 90]) {
      const y = ySales(v);
      parts.push(line(left, y, right, y, C.line),
        put(String(v), left + 0.04, y + 0.15, C.muted, 15, true));
    }
    for (let w = 0; w < 4; w++) {
      parts.push(put(`Week ${w + 1}`, wx(w), seriesFloor - 0.24, C.muted, 17));
      if (w > 0) {
        const x = left + span * w / 4;
        parts.push(line(x, seriesFloor, x, seriesTop, C.line, 1));
      }
    }
    sales.forEach((v, i) => {
      if (i > 0) parts.push(line(xDay(i - 1), ySales(sales[i - 1]), xDay(i), ySales(v), C.cyan, 1.7));
    });
    sales.forEach((v, i) => parts.push(dot(xDay(i), ySales(v), C.cyan, 0.055)));
    return new M.VGroup(...parts);
  }

  const seriesRing = (i, color) => ring(xDay(i), ySales(sales[i]), color);
  function seriesMarks(today, earlier) {
    const parts = [seriesRing(today, C.cyan)];
    if (earlier !== undefined) parts.push(seriesRing(earlier, C.amber));
    return layer('marks', new M.VGroup(...parts));
  }
  function pairBox(today, earlier) {
    return fbox([
      [`Today    ${names(today)}   ${sales[today]}`, C.cyan],
      [`Earlier  ${names(earlier)}   ${sales[earlier]}`, C.amber],
    ]);
  }

  const upper = P ? -1.0 : 0.08;
  const lower = P ? -3.6 : -1.27;
  const laneDot = (i, y, color) => dot(xDay(i), y, color, P ? 0.061 : 0.063);
  function lanes() {
    const parts = [
      put('Sales today', CX, upper + 0.76, C.cyan),
      put('Earlier sales', CX, lower - 0.86, C.amber),
      line(left, upper, right, upper, C.line),
      line(left, lower, right, lower, C.line),
    ];
    for (let w = 0; w < 4; w++) {
      parts.push(put(`Week ${w + 1}`, wx(w), upper + 0.36, C.muted, 17));
    }
    sales.forEach((_, i) => parts.push(laneDot(i, upper, C.cyan)));
    return new M.VGroup(...parts);
  }
  function earlierLane(lag) {
    return new M.VGroup(...sales.map((_, i) =>
      i < lag ? ring(xDay(i), lower, C.muted, 0.063) : laneDot(i, lower, C.amber)));
  }
  function links(lag, selected) {
    const indices = selected === undefined
      ? sales.map((_, i) => i).slice(lag)
      : [selected];
    const parts = indices.map(i =>
      line(xDay(i), upper - 0.12, xDay(i), lower + 0.12, selected === undefined ? C.muted : C.amber, 2));
    if (selected !== undefined) {
      parts.push(ring(xDay(selected), upper, C.cyan), ring(xDay(selected), lower, C.amber));
    }
    return new M.VGroup(...parts);
  }
  function compareCounts() {
    const rows = [1, 7, 14].map((lag, row) => {
      const y = (P ? -0.6 : 0.56) - row * (P ? 1.45 : 0.98);
      const marks = sales.map((_, i) =>
        i < lag ? ring(xDay(i), y, C.muted, 0.064) : laneDot(i, y, C.green));
      return new M.VGroup(put(`Lag ${lag}`, CX, y + 0.37, C.ink, 18), ...marks);
    });
    return new M.VGroup(...rows);
  }

  const px0 = left + 0.65, px1 = right - 0.18;
  const py0 = P ? -4.3 : -1.94, py1 = P ? 0.6 : 0.82;
  const sx = v => px0 + (v - 30) / 60 * (px1 - px0);
  const sy = v => py0 + (v - 30) / 60 * (py1 - py0);
  function scatterAxes() {
    const parts = [
      line(px0, py0, px1, py0), line(px0, py0, px0, py1),
      put('Sales a week earlier', (px0 + px1) / 2, py0 - 0.7, C.amber, 18),
      put('Sales today', (px0 + px1) / 2, py1 + 0.37, C.cyan, 18),
    ];
    for (const v of [30, 50, 70, 90]) {
      parts.push(
        line(sx(v), py0 - 0.05, sx(v), py1, C.line, 1),
        line(px0 - 0.05, sy(v), px1, sy(v), C.line, 1),
        put(String(v), sx(v), py0 - 0.28, C.muted, 15, true),
        put(String(v), px0 - 0.29, sy(v), C.muted, 15, true),
      );
    }
    return new M.VGroup(...parts);
  }
  const scatterDots = () => sales.slice(7).map((v, i) => dot(sx(sales[i]), sy(v), C.cyan, 0.076));

  const CARD_Y = P ? -2.2 : -0.65;
  function dateCards(cards, y = CARD_Y) {
    const width = Math.min(1.8, span / cards.length - 0.15);
    const parts = [];
    cards.forEach(([label, value, color = C.cyan], i) => {
      const x = left + span * (i + 0.5) / cards.length;
      const bg = new M.RoundedRectangle({ width, height: 0.9, cornerRadius: 0.12, color, strokeWidth: 1.5 });
      bg.setFill(C.card, 0.96);
      bg.moveTo([x, y, 0]);
      parts.push(bg, put(label, x, y + 0.2, C.ink, 16), put(value, x, y - 0.2, color, 20, true));
    });
    return new M.VGroup(...parts);
  }
  function winterCards(keepDates) {
    const cards = winter.flatMap((v, i) => {
      if (v === null && !keepDates) return [];
      return [[days[i], v === null ? '—' : String(v), v === null ? C.muted : i === 3 ? C.cyan : C.amber]];
    });
    return dateCards(cards);
  }
  function winterLink(keepDates, color) {
    const n = keepDates ? 7 : 6;
    const from = left + span * (keepDates ? 2.5 : 1.5) / n;
    const to = left + span * (keepDates ? 3.5 : 2.5) / n;
    const y = CARD_Y - 0.62;
    return new M.VGroup(
      line(from, y, to, y, color),
      line(from, y, from + 0.12, y + 0.1, color),
      line(from, y, from + 0.12, y - 0.1, color),
    );
  }

  await until(S(0));
  await play(...layer('main', weekly()), ...say('FOUR WEEKS AT THE BAKERY'),
    ...fbox([['Dots: Saturday sales', C.amber], ['Bars: weekly averages', C.cyan]]));

  await until(S(1));
  await play(...say('LAST SATURDAY → THIS SATURDAY?', C.amber),
    ...fbox(['Can last Saturday help us', 'guess this Saturday?'], C.amber));

  await until(S(2));
  await play(...layer('main', dateCards([['Earlier day', '…', C.amber], ['Today', '…', C.cyan]])),
    ...layer('box'), ...say('PUT TWO DAYS SIDE BY SIDE'));

  await until(S(3));
  await play(...layer('main', series()), ...say('28 DAYS OF SALES'));

  await until(S(4));
  await play(...seriesMarks(12), ...say('PICK SATURDAY OF WEEK 2'),
    ...fbox([['Week 2 Saturday: 75', C.cyan]]));

  await until(S(5));
  const backY = P ? seriesFloor - 0.6 : -2.34;
  const backward = Array.from({ length: 7 }, (_, step) => {
    const from = xDay(12 - step), to = xDay(11 - step);
    return new M.VGroup(line(from - 0.019, backY, to + 0.022, backY, C.amber),
      line(to + 0.022, backY, to + 0.09, backY + 0.058, C.amber),
      line(to + 0.022, backY, to + 0.09, backY - 0.058, C.amber));
  });
  await play(...say('BACK SEVEN DAYS', C.amber),
    ...fbox(['Week 2 Saturday', ['← 7 days to Week 1 Saturday', C.amber]], C.amber),
    new M.LaggedStart(backward.map(a => new M.FadeIn(a, { runTime: 0.3 })),
      { lagRatio: 0.65, runTime: 1.75 }));
  await play(...seriesMarks(12, 5));

  await until(S(6));
  await play(...fbox([['Week 1 Saturday: 67', C.amber]], C.amber),
    new M.Flash(diagram.get('marks').submobjects[1], { color: C.amber, flashRadius: 0.12, lineLength: 0.09, runTime: 0.45 }));

  await until(S(7));
  await play(new M.FadeOut(new M.VGroup(...backward), { runTime: 0.3 }),
    ...pairBox(12, 5), ...say('TODAY AND ONE WEEK BEFORE'));

  await until(S(8));
  await play(...seriesMarks(19), ...say('SATURDAY OF WEEK 3'),
    ...fbox([['Week 3 Saturday: 80', C.cyan]]));

  await until(S(9));
  await play(...seriesMarks(19, 12), ...pairBox(19, 12), ...say('SEVEN DAYS EARLIER', C.amber));

  await until(S(10));
  await play(...seriesMarks(21), ...say('MONDAY OF WEEK 4'),
    ...fbox([['Week 4 Monday: 58', C.cyan]]));

  await until(S(11));
  await play(...seriesMarks(21, 14), ...pairBox(21, 14), ...say('SEVEN DAYS EARLIER', C.amber));

  await until(S(12));
  const copy = sales.map((_, i) => laneDot(i, lower, C.amber));
  await play(...layer('main', lanes()), ...layer('marks'), ...layer('box'),
    ...say('COPY THE LINE AND SLIDE IT', C.amber),
    new M.LaggedStart(copy.map(d => new M.FadeIn(d, { runTime: 0.25 })),
      { lagRatio: 0.045, runTime: 0.65 }));
  await play(
    ...copy.slice(21).map(d => new M.FadeOut(d, { runTime: 0.3 })),
    ...copy.slice(0, 21).map((d, i) => new M.Transform(d, laneDot(i + 7, lower, C.amber), { runTime: 0.9 })),
  );

  await until(S(13));
  await play(...layer('marks', links(7)), ...say('SAME WEEKDAY, ONE WEEK EARLIER'));

  await until(S(14));
  await play(...say('THE LAG 7 VALUE', C.amber), ...layer('marks', links(7, 12)),
    ...fbox([['Week 2 Saturday: 75', C.cyan], ['Its lag 7 value: 67', C.amber]]));

  await until(S(15));
  await play(...say('THE NUMBER TELLS HOW FAR BACK'),
    ...fbox([['Lag 7: look back 7 days', C.amber]]));

  await until(S(16));
  await play(new M.FadeOut(new M.VGroup(...copy.slice(0, 21)), { runTime: 0.32 }),
    ...layer('earlier', earlierLane(1)), ...layer('marks', links(1, 1)),
    ...say('LAG 1 MEANS YESTERDAY', C.amber), ...fbox(['Lag 1: look back 1 day']));

  await until(S(17));
  await play(...fbox([['Week 1 Tuesday: 39', C.cyan], ['Its lag 1 value: 37 (Mon)', C.amber]]));

  await until(S(18));
  await play(...layer('earlier', earlierLane(7)), ...layer('marks', links(7, 12)),
    ...say('LAG 7 MEANS LAST WEEK', C.amber),
    ...fbox([['Week 2 Saturday: 75', C.cyan], ['Its lag 7 value: 67 (Sat)', C.amber]]));

  await until(S(19));
  await play(...layer('marks', links(7)), ...layer('box'), ...say('HOW MANY PAIRS?'));

  await until(S(20));
  const emptyWeek = new M.RoundedRectangle({
    width: xDay(6) - xDay(0) + 0.22, height: 0.45, cornerRadius: 0.12, color: C.amber, strokeWidth: 1.5,
  });
  emptyWeek.setFill(C.amber, 0);
  emptyWeek.moveTo([(xDay(0) + xDay(6)) / 2, lower, 0]);
  await play(...layer('emphasis', emptyWeek), ...say('NO PARTNERS FOR WEEK 1', C.amber),
    ...fbox([['The first 7 slots are empty', C.amber]]));

  await until(S(21));
  await play(...say('LAG 7 GIVES 21 PAIRS', C.green),
    ...fbox(['28 days − 7 without a partner', ['= 21 pairs', C.green]], C.green));

  await until(S(22));
  await play(...layer('earlier', earlierLane(1)), ...layer('marks', links(1)),
    ...layer('emphasis', ring(xDay(0), lower, C.amber)),
    ...say('LAG 1 GIVES 27 PAIRS', C.green),
    ...fbox(['28 days − 1 without a partner', ['= 27 pairs', C.green]], C.green));

  await until(S(23));
  await play(...layer('main', compareCounts()), ...layer('earlier'), ...layer('marks'), ...layer('emphasis'),
    ...say('BIGGER LAG, MORE EMPTY SLOTS'),
    ...fbox([['Open circles: no partner', C.muted], ['Filled circles: pairs', C.green]]));

  await until(S(24));
  await play(...layer('main', lanes()), ...layer('earlier', earlierLane(7)), ...layer('marks', links(7, 12)),
    ...say('LAG 7 IN ONE LINE'),
    ...fbox(['Lag 7 of today =', ['sales 7 days earlier', C.amber]]));

  await until(S(25));
  await play(...layer('main', scatterAxes()), ...layer('earlier'), ...layer('marks'), ...layer('box'),
    ...say('PUT THE PAIRS ON A SCATTERPLOT'));

  await until(S(26));
  const points = scatterDots();
  await play(new M.LaggedStart(points.map(d => new M.FadeIn(d, { runTime: 0.22 })),
    { lagRatio: 0.075, runTime: 1.15 }), ...say('ONE DOT PER PAIR'));

  await until(S(27));
  function scatterMark() {
    return new M.VGroup(
      new M.DashedLine({ start: [sx(67), py0, 0], end: [sx(67), sy(75) - 0.12, 0], color: C.amber }),
      new M.DashedLine({ start: [px0, sy(75), 0], end: [sx(67) - 0.12, sy(75), 0], color: C.cyan }),
      ring(sx(67), sy(75), C.amber, 0.15),
    );
  }
  await play(...layer('marks', scatterMark()), ...say('SATURDAY OF WEEK 2', C.amber),
    ...fbox([['Across: 67 a week earlier', C.amber], ['Up: 75 today', C.cyan]]));

  await until(S(28));
  await play(...say('THE PAST IS A CLUE', C.amber),
    ...fbox([['Earlier sales: 67', C.amber], ['Today’s sales: 75', C.cyan]]));

  await until(S(29));
  await play(new M.FadeOut(new M.VGroup(...points), { runTime: 0.32 }), ...layer('marks'),
    ...layer('main', dateCards([['W4 Sat', '88', C.amber], ['Next Sat', '?', C.violet]])),
    ...say('A FORECAST IS A GUESS', C.violet),
    ...fbox(['Use known sales to guess', ['a future day’s sales', C.violet]], C.violet));

  await until(S(30));
  await play(...layer('main', dateCards([['W3 Sat', '80', C.amber], ['W4 Fri', '78', C.amber], ['W4 Sat', '88', C.cyan]])),
    ...say('EARLIER SALES CAN HELP', C.violet),
    ...fbox([['Yesterday: 78', C.amber], ['Last week: 80', C.amber]]));

  await until(S(31));
  await play(...layer('main', winterCards(false)), ...layer('box'),
    ...say('COUNT BY DATE', C.amber));

  await until(S(32));
  await play(...say('THE WINTER NOTEBOOK'),
    ...fbox([['Wednesday has no row', C.amber]], C.amber));

  await until(S(33));
  await play(...layer('marks', winterLink(false, C.pink)),
    ...say('ONE ROW BACK LANDS ON TUESDAY', C.pink),
    ...fbox(['Thursday ← Tuesday', ['Two dates apart', C.pink]], C.pink));

  await until(S(34));
  await play(...say('THE WRONG PAIR', C.pink),
    ...fbox([['40 is Tuesday’s sales', C.pink], 'Thursday needs Wednesday'], C.pink));

  await until(S(35));
  await play(...layer('main', winterCards(true)), ...layer('marks', winterLink(true, C.amber)),
    ...say('KEEP WEDNESDAY’S SLOT'),
    ...fbox(['Time index: one slot per date', ['Wednesday: unknown', C.muted]]));

  await until(S(36));
  await play(...say('LEAVE THURSDAY’S PAIR OUT', C.amber),
    ...fbox(['Thursday’s sales: 0', ['Its lag 1 value: unknown', C.amber]], C.amber));

  await until(S(37));
  await play(...layer('main', scatterAxes()), ...layer('marks'), ...layer('box'),
    ...layer('points', new M.VGroup(...scatterDots())), ...say('HOW STRONG IS THE LINK?'));

  await until(S(38));
  await play(...layer('main', lanes()), ...layer('points'),
    ...layer('earlier', earlierLane(7)), ...layer('marks', links(7)),
    ...say('A FIXED LOOK BACK BY DATE'),
    ...fbox(['Pair today with the date', ['a fixed number of days back', C.amber]]));
}
