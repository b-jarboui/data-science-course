// 11.1.6 Stationarity. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const SALES = [
    37, 39, 43, 52, 54, 67, 58,
    44, 44, 52, 56, 63, 75, 65,
    51, 53, 58, 63, 71, 80, 72,
    58, 58, 65, 71, 78, 88, 79
  ];
  const CHANGE = SALES.map((value, day) => day < 7 ? null : value - SALES[day - 7]);
  const WEEK = ['WEEK 1', 'WEEK 2', 'WEEK 3', 'WEEK 4'];
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const X0 = CX - (P ? 3.0 : 3.48), X1 = CX + (P ? 3.45 : 3.65);
  const BASE = P ? -4.2 : -2.35, TOP = P ? 0.95 : 0.77;
  const dx = (X1 - X0) / 28;
  const x = day => X0 + (day + 0.5) * dx;
  const y = (value, lo, hi) => BASE + (value - lo) / (hi - lo) * (TOP - BASE);
  const rawY = value => y(value, 30, 90);
  const changeY = value => y(value, 0, 10);
  const say = (text, color = C.cyan) => showA(text, color, PILL, P ? 17 : 19);
  const label = (text, px, py, color = C.ink, size = P ? 17 : 18) =>
    T(text, size, color, true).moveTo([px, py, 0]);
  const line = (ax, ay, bx, by, color, strokeWidth = 2) =>
    new M.Line({ start: [ax, ay, 0], end: [bx, by, 0], color, strokeWidth });
  const dash = (ax, ay, bx, by, color) =>
    new M.DashedLine({ start: [ax, ay, 0], end: [bx, by, 0], color, strokeWidth: 2 });
  const dot = (px, py, color = C.cyan, radius = P ? 0.063 : 0.072) =>
    new M.Dot({ point: [px, py, 0], color, radius });
  const ring = (px, py, color) =>
    new M.Circle({ radius: P ? 0.115 : 0.13, color, strokeWidth: 2 }).moveTo([px, py, 0]);
  const fade = (object, runTime = 0.5) => new M.FadeIn(object, { runTime });

  let boxNow = null;
  function fbox(lines = [], color = C.cyan) {
    const animations = boxNow ? [new M.FadeOut(boxNow, { runTime: 0.4 })] : [];
    boxNow = null;
    if (!lines.length) return animations;
    const rowHeight = P ? 0.34 : 0.4;
    const rows = lines.map(row => Array.isArray(row) ? row : [row, C.ink]);
    const texts = rows.map(([text, ink]) => T(text, P ? 19 : 20, ink, true));
    const width = Math.max(...texts.map(text => text.getWidth())) + 0.58;
    const height = rows.length * rowHeight + 0.28;
    const frame = new M.RoundedRectangle({ width, height, cornerRadius: 0.15, color, strokeWidth: 2 });
    frame.setFill(C.card, 0.95);
    frame.moveTo(BOXP);
    texts.forEach((text, i) => text.moveTo([
      BOXP[0] - width / 2 + 0.29 + text.getWidth() / 2,
      BOXP[1] + ((texts.length - 1) / 2 - i) * rowHeight, 0
    ]));
    boxNow = new M.VGroup(frame, ...texts);
    const maxWidth = P ? FW - 1.2 : 4.0;
    if (width > maxWidth) boxNow.scale(maxWidth / width);
    animations.push(fade(boxNow));
    return animations;
  }

  let picture = null, marks = null;
  function highlight(next = null) {
    const animations = marks ? [new M.FadeOut(marks, { runTime: 0.4 })] : [];
    marks = next;
    if (marks) animations.push(fade(marks));
    return animations;
  }

  function replace(next) {
    const animations = highlight();
    if (picture) animations.push(new M.FadeOut(picture, { runTime: 0.4 }));
    picture = next;
    animations.push(fade(picture, 0.65));
    return animations;
  }

  const level = (value, scale, first, end, color = C.amber) =>
    dash(X0 + first * dx, scale(value), X0 + end * dx, scale(value), color);
  const split = (day = 14) => dash(X0 + day * dx, BASE, X0 + day * dx, TOP, C.violet);
  const legend = (text, color = C.muted) => label(text, CX, TOP + 0.29, color);
  const partLabels = (first, second, left, right) => new M.VGroup(
    label(first, left, BASE - 0.65, C.cyan),
    label(second, right, BASE - 0.65, C.pink)
  );

  function plot(values, lo, hi, ticks, unit, overlays = [], chroma = () => C.cyan) {
    const yy = value => y(value, lo, hi);
    const axes = [line(X0, BASE, X1, BASE, C.muted), label(unit, CX, TOP + 0.29)];
    for (const tick of ticks) {
      const ty = yy(tick);
      axes.push(line(X0, ty, X1, ty, C.grid, 1),
        label(String(tick), X0 - (P ? 0.32 : 0.31), ty, C.muted, P ? 17 : 15));
    }
    for (let week = 0; week < 4; week++) {
      const edge = X0 + week * 7 * dx;
      axes.push(line(edge, BASE, edge, TOP, C.grid, 1),
        label(WEEK[week], x(week * 7 + 3), BASE - 0.28, C.muted, P ? 17 : 16));
    }
    const traces = [], dots = [];
    values.forEach((value, day) => {
      if (value == null) return;
      if (day > 0 && values[day - 1] != null) {
        traces.push(line(x(day - 1), yy(values[day - 1]), x(day), yy(value), chroma(day)));
      }
      dots.push(dot(x(day), yy(value), chroma(day)));
    });
    return new M.VGroup(...axes, ...overlays, ...traces, ...dots);
  }

  const salesPlot = (overlays, chroma) =>
    plot(SALES, 30, 90, [30, 50, 70, 90], 'LOAVES SOLD PER DAY', overlays, chroma);
  const changesPlot = (overlays, chroma) =>
    plot(CHANGE, 0, 10, [0, 4, 7, 9], 'SEVEN-DAY CHANGE IN LOAVES', overlays, chroma);
  const rawHalfColor = day => day < 14 ? C.cyan : C.pink;
  const changeHalfColor = day => day < 17 ? C.cyan : day > 17 ? C.pink : C.muted;
  const halfLevels = (left, right) => [
    split(),
    ...(left ? [level(53.5, rawY, 0, 14, C.cyan)] : []),
    ...(right ? [level(67.5, rawY, 14, 28, C.pink)] : [])
  ];
  const allWeeklyLevels = () => WEEK.slice(1).map((_, i) =>
    level(7, changeY, (i + 1) * 7, (i + 2) * 7));
  const changeSplit = () => [split(17), split(18)];
  const changeParts = () => partLabels('EARLY: 10 DAYS', 'LATE: 10 DAYS', x(11.5), x(22.5));

  const rowY = week => TOP - 0.87 - week * (P ? 0.84 : 0.65);
  const tableX = day => X0 + 0.86 + day * ((X1 - X0 - 1.12) / 6);
  function notebook(values, heading, showSaturday = false) {
    const items = [legend(heading)];
    DAYS.forEach((day, i) => items.push(label(day, tableX(i), TOP - 0.23, C.muted, 16)));
    for (let week = 0; week < 4; week++) {
      const ty = rowY(week);
      items.push(label(`W${week + 1}`, X0 + 0.12, ty, C.muted, 16));
      items.push(line(X0 - 0.12, ty - 0.3, X1 + 0.17, ty - 0.3, C.grid, 1));
      DAYS.forEach((_, day) => {
        const value = values[week * 7 + day];
        const selected = showSaturday && day === 5 && week < 2;
        items.push(label(value == null ? '—' : String(value), tableX(day), ty,
          selected ? C.amber : value == null ? C.muted : C.cyan, 19));
      });
    }
    return new M.VGroup(...items);
  }

  function water(rising, left = X0, right = X1, heading) {
    const mid = (left + right) / 2;
    const points = Array.from({ length: 40 }, (_, i) => {
      const t = i / 39;
      const base = BASE + 0.7 + (rising ? t * (TOP - BASE - 1.45) : (TOP - BASE) * 0.43);
      return [left + t * (right - left), base + 0.13 * Math.sin(t * 11 * Math.PI)];
    });
    const guideY = rising ? points[7][1] : BASE + 0.7 + (TOP - BASE) * 0.43;
    const color = rising ? C.pink : C.cyan;
    const pieces = [label(heading, mid, TOP + 0.29, color, P ? 15 : 17),
      dash(left, guideY, right, guideY, C.muted)];
    points.slice(1).forEach(([px, py], i) => {
      pieces.push(line(points[i][0], points[i][1], px, py, color, 3));
    });
    if (rising) {
      pieces.push(dot(...points[7], C.amber), dot(...points[31], C.pink));
      if (right - left > 4) {
        pieces.push(label('Yesterday', points[7][0], BASE + 0.29, C.amber),
          label('Today', points[31][0], BASE + 0.29, C.pink));
      }
    }
    return new M.VGroup(...pieces);
  }

  function linkPicture() {
    const pairs = [[1, 2], [2, 2.6], [2.8, 2.5], [3.7, 3.4], [4.3, 4.1]];
    const width = (X1 - X0 - 1.0) / 2;
    const height = Math.min(2.25, TOP - BASE - 1.1);
    return new M.VGroup(...[X0 + 0.2, X1 - width].map((left, i) => {
      const bottom = BASE + 0.48;
      const color = i ? C.pink : C.cyan;
      return new M.VGroup(
        label(i ? 'LATER DAYS' : 'EARLY DAYS', left + width / 2, TOP + 0.29, color),
        label('Yesterday →', left + width / 2, BASE + 0.08, C.muted, 15),
        label('Today ↑', left + width / 2, bottom + height + 0.23, C.muted, 15),
        line(left, bottom, left + width, bottom, C.muted),
        line(left, bottom, left, bottom + height, C.muted),
        ...pairs.map(([a, b]) => dot(left + a * width / 5, bottom + b * height / 5, color, 0.09))
      );
    }));
  }

  const WAVES = [
    null, null, null, null, null, null, null,
    1, 8, 6, 3, 9, 2, 5,
    7, 3, 1, 6, 4, 9, 5,
    8, 2, 6, 9, 1, 5, 3
  ];
  const example = (values, guide = []) => plot(values, 0, 10, [0, 5, 10], 'ILLUSTRATIVE VALUES', guide);

  // 0–8: the daily sales repeat a weekly shape, but the level rises.
  await until(S(0));
  await play(...replace(salesPlot([dash(x(0), rawY(47), x(27), rawY(74), C.violet)])),
    ...say('RISING TREND · WEEKLY PATTERN'),
    ...highlight(new M.VGroup(...[5, 12, 19, 26].map(day => ring(x(day), rawY(SALES[day]), C.amber)))));

  await until(S(1));
  await play(...replace(salesPlot(SALES.slice(24).map((value, i) =>
    ring(x(24 + i), rawY(value), C.amber)), day => day < 24 ? C.cyan : C.muted)),
    ...say('PAST DATA → FUTURE GUESS', C.amber),
    ...fbox(['Cyan: past observations', ['Outlined: days to predict', C.amber]]));

  await until(S(2));
  await play(...replace(salesPlot()), ...fbox(), ...say('WHEN IS THE SERIES STEADY ENOUGH?', C.amber));

  await until(S(3));
  await play(...replace(salesPlot(halfLevels(false, false), rawHalfColor)),
    ...say('COMPARE TWO HALVES', C.violet), ...fbox([['Weeks 1–2', C.cyan], ['Weeks 3–4', C.pink]]));

  await until(S(4));
  await play(...highlight(level(53.5, rawY, 0, 14, C.cyan)), ...say('FIRST HALF', C.cyan),
    ...fbox([['749 ÷ 14 = 53.5', C.cyan], 'loaves per day']));

  await until(S(5));
  await play(...replace(salesPlot(halfLevels(true, true), rawHalfColor)), ...say('SECOND HALF', C.pink),
    ...fbox([['First half    53.5', C.cyan], ['945 ÷ 14 =    67.5', C.pink], 'loaves per day']));

  await until(S(6));
  await play(...highlight(new M.Arrow({ start: [X0 + 14 * dx, rawY(53.5), 0],
    end: [X0 + 14 * dx, rawY(67.5), 0], color: C.amber, strokeWidth: 3 })),
    ...say('THE AVERAGE ROSE', C.amber), ...fbox([['67.5 − 53.5 = 14', C.amber], 'more loaves per day']));

  await until(S(7));
  await play(...highlight(level(53.5, rawY, 14, 28)),
    ...say('THE OLD AVERAGE IS TOO LOW', C.amber),
    ...fbox([['Old guess     53.5', C.amber], ['Later average 67.5', C.pink]]));

  await until(S(8));
  await play(...replace(salesPlot(halfLevels(true, true), rawHalfColor)), ...fbox(),
    ...say('THE LEVEL KEEPS MOVING', C.pink));

  // 9–16: same-day pairs become seven-day changes, then a time plot.
  await until(S(9));
  await play(...replace(notebook(SALES, 'BAKERY SALES NOTEBOOK')), ...say('SAME NOTEBOOK'));

  await until(S(10));
  const cell = (px, py) => new M.RoundedRectangle({ width: P ? 0.66 : 0.72, height: 0.46, cornerRadius: 0.1,
    color: C.amber, strokeWidth: 2 }).moveTo([px, py, 0]);
  await play(...highlight(new M.VGroup(cell(tableX(5), rowY(0)),
    cell(tableX(5), rowY(1)))),
    ...say('MATCH THE SAME WEEKDAY', C.amber), ...fbox(['Sales today', '− sales one week earlier']));

  await until(S(11));
  await play(...replace(notebook(SALES, 'BAKERY SALES NOTEBOOK', true)),
    ...say('SEVEN-DAY CHANGE', C.amber),
    ...fbox(['Saturday to Saturday', ['75 − 67 = 8 loaves', C.amber]]));

  await until(S(12));
  await play(...replace(notebook(CHANGE, 'SEVEN-DAY CHANGES')),
    ...say('WEEK 1 HAS NO EARLIER WEEK', C.violet), ...fbox(['3 weeks × 7 days', ['21 changes', C.amber]]));

  await until(S(13));
  await play(...replace(changesPlot()), ...fbox(), ...say('CHANGES THROUGH TIME'));

  await until(S(14));
  await play(...highlight(new M.VGroup(level(4, changeY, 7, 28), level(9, changeY, 7, 28))),
    ...say('BETWEEN 4 AND 9', C.amber));

  await until(S(15));
  const weeklyMeans = allWeeklyLevels();
  await play(...highlight(), ...say('AVERAGE CHANGE BY WEEK', C.amber),
    ...fbox([['Week 2: 7 loaves', C.amber], ['Week 3: 7 loaves', C.amber], ['Week 4: 7 loaves', C.amber]]),
    new M.LaggedStart(weeklyMeans.map(mark => fade(mark, 0.6)), { lagRatio: 0.9, runTime: 2.5 }));

  await until(S(16));
  await play(new M.FadeOut(new M.VGroup(...weeklyMeans), { runTime: 0.4 }),
    ...replace(changesPlot([level(7, changeY, 7, 28)])),
    ...say('WOBBLES AROUND THE SAME MIDDLE', C.amber), ...fbox([['Average level: 7', C.amber]]));

  // 17–24: define the properties, then picture the lake and the river.
  await until(S(17));
  await play(...say('STATIONARY', C.green), ...fbox(['Behaviour stays steady', 'through time'], C.green));

  await until(S(18));
  await play(...say('TWO THINGS STAY STEADY', C.green),
    ...fbox([['1  Average level', C.amber], ['2  Wobble and links', C.violet]]));

  await until(S(19));
  await play(...highlight(new M.VGroup(...allWeeklyLevels())),
    ...say('1 · SAME AVERAGE LEVEL', C.amber), ...fbox([['Week 2 = week 3 = week 4', C.amber], 'Average change: 7']));

  await until(S(20));
  await play(...highlight(new M.VGroup(level(4, changeY, 7, 28, C.violet),
    level(9, changeY, 7, 28, C.violet))),
    ...say('2 · SAME WOBBLE AND LINKS', C.violet),
    ...fbox(['Rule 2: the wobble', 'and links to past', 'days stay the same'], C.violet));

  await until(S(21));
  await play(...replace(linkPicture()), ...say('ILLUSTRATION · SAME DAY-TO-DAY LINK', C.violet),
    ...fbox(['One dot: yesterday and today', 'Same pattern in both parts'], C.violet));

  await until(S(22));
  await play(...replace(water(false, X0, X1, 'CALM LAKE')), ...fbox(), ...say('RIPPLES · STEADY WATER LEVEL'));

  await until(S(23));
  await play(...replace(water(true, X0, X1, 'RIVER IN FLOOD')),
    ...say('YESTERDAY’S LEVEL IS TOO LOW', C.pink));

  await until(S(24));
  await play(...replace(new M.VGroup(
    water(false, X0, CX - 0.25, '7-DAY CHANGES'),
    water(true, CX + 0.25, X1, 'RAW SALES')
  )), ...say('CALM LAKE · RISING RIVER'));

  // 25–31: a short comparison gives clues, with actual sample statistics.
  await until(S(25));
  await play(...replace(changesPlot()), ...say('HOW STEADY IS THIS SERIES?', C.amber),
    ...fbox(['1  Split into parts', '2  Compare averages', '3  Compare wobble and links']));

  await until(S(26));
  await play(...replace(changesPlot([...changeSplit(), changeParts()], changeHalfColor)),
    ...say('1 · SPLIT INTO PARTS', C.violet),
    ...fbox(['First 10 and last 10', 'Leave out the middle day']));

  await until(S(27));
  await play(...highlight(new M.VGroup(level(7.1, changeY, 7, 17, C.cyan),
    level(6.9, changeY, 18, 28, C.pink))),
    ...say('2 · COMPARE THE AVERAGES', C.amber),
    ...fbox([['Early: 7.1', C.cyan], ['Late:  6.9', C.pink], 'Both are near 7']));

  await until(S(28));
  await play(...highlight(new M.VGroup(level(4, changeY, 7, 17, C.cyan), level(9, changeY, 7, 17, C.cyan),
    level(5, changeY, 18, 28, C.pink), level(8, changeY, 18, 28, C.pink))),
    ...say('3 · COMPARE WOBBLE AND LINKS', C.violet),
    ...fbox(['Part    Range    Lag 1', ['Early   4–9      −0.62', C.cyan],
      ['Late    5–8      −0.22', C.pink], 'Lag 1: link to yesterday'], C.violet));

  await until(S(29));
  await play(...highlight(), ...say('A SHORT SERIES GIVES CLUES', C.amber),
    ...fbox(['Both match →', 'looks stationary', ['Averages: close', C.green], ['Wobble: less clear', C.pink]], C.amber));

  await until(S(30));
  await play(...replace(example(WAVES.map((v, i) => i < 21 ? v : null),
    [level(5, value => y(value, 0, 10), 7, 21), level(5, value => y(value, 0, 10), 21, 28, C.violet)])),
    ...say('STEADY BEHAVIOUR CAN GUIDE A FORECAST', C.green),
    ...fbox([['Past: level near 5', C.amber], ['Future guess: level near 5', C.violet]], C.green));

  await until(S(31));
  await play(...say('CHECK BEFORE FORECASTING', C.green),
    ...fbox(['Compare average level,', 'wobble and links first'], C.green));

  // 32–36: a steady process can still move around its middle.
  const midline = () => level(5, value => y(value, 0, 10), 7, 28);
  await until(S(32));
  await play(...replace(example(WAVES.map(value => value == null ? null : 5))),
    ...fbox(), ...say('THE TRAP · “STATIONARY MEANS FLAT”', C.pink));

  await until(S(33));
  await play(...replace(example(WAVES, [midline()])), ...say('BIG WOBBLES CAN STAY STEADY', C.green),
    ...fbox(['Big swings around one level'], C.green));

  await until(S(34));
  await play(...replace(salesPlot([dash(x(0), rawY(47), x(27), rawY(74), C.violet)])),
    ...highlight(new M.VGroup(...[5, 12, 19, 26].map(day => ring(x(day), rawY(SALES[day]), C.amber)))),
    ...say('TREND OR SEASONAL PATTERN', C.pink),
    ...fbox(['Trend moves the level', 'Season changes it by weekday'], C.pink));

  await until(S(35));
  await play(...replace(changesPlot([level(7, changeY, 7, 28)])),
    ...say('NEXT · DIFFERENCING', C.cyan), ...fbox(['Today − same weekday last week', ['Changes sit around 7', C.amber]]));

  await until(S(36));
  await play(...say('STATIONARY', C.green),
    ...fbox([['Average level stays steady', C.amber], ['Wobble and links stay steady', C.violet]], C.green));
}
