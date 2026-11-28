// 11.1.7 Differencing. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const sales = [
    37, 39, 43, 52, 54, 67, 58,
    44, 44, 52, 56, 63, 75, 65,
    51, 53, 58, 63, 71, 80, 72,
    58, 58, 65, 71, 78, 88, 79,
  ];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'];
  const difference = (values, lag) => values.map((value, i) =>
    i < lag || values[i - lag] === null ? null : value - values[i - lag]);
  const daily = difference(sales, 1);
  const weekly = difference(sales, 7);
  const twice = difference(weekly, 1);
  const signed = value => value < 0 ? `−${-value}` : value > 0 ? `+${value}` : '0';
  const changeColor = value => value < 0 ? C.pink : C.green;

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.45, -0.3, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const IN = { runTime: 0.42 };
  const OUT = { runTime: 0.28 };
  const fadeIn = object => new M.FadeIn(object, IN);
  const fadeOut = object => new M.FadeOut(object, OUT);

  function label(text, x, y, color = C.ink, size = 19, mono = false) {
    return T(text, size, color, mono).moveTo([x, y, 0]);
  }

  function line(x1, y1, x2, y2, color = C.muted, strokeWidth = 2) {
    return new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth });
  }

  function outline(x, y, width, height, color) {
    const rect = new M.RoundedRectangle({ width, height, cornerRadius: 0.1, color, strokeWidth: 2 });
    rect.setFill(C.bg, 0);
    return rect.moveTo([x, y, 0]);
  }

  let boxNow = null;
  function formula(lines = [], color = C.cyan) {
    const animations = boxNow ? [fadeOut(boxNow)] : [];
    boxNow = null;
    if (!lines.length) return animations;

    const [x, y] = BOXP;
    const size = P ? 22 : 21;
    const spacing = P ? 0.44 : 0.42;
    const rows = lines.map((text, i) => T(text, size, i ? color : C.ink, true));
    const width = Math.max(...rows.map(row => row.getWidth())) + 0.7;
    const height = rows.length * spacing + 0.4;
    const card = outline(x, y, width, height, color);
    card.setFill(C.card, 0.95);
    rows.forEach((row, i) => {
      const left = x - width / 2 + 0.35;
      row.moveTo([left + row.getWidth() / 2, y + ((rows.length - 1) / 2 - i) * spacing, 0]);
    });
    boxNow = new M.VGroup(card, ...rows);
    const maxWidth = P ? FW - 1.2 : 4.9;
    if (width > maxWidth) {
      boxNow.scale(maxWidth / width);
      boxNow.moveTo(BOXP);
    }
    return [...animations, fadeIn(boxNow)];
  }

  const X0 = CX - 2.96, X1 = CX + 3.16;
  const UPPER = P ? [-0.80, 1.15] : [-0.50, 1.02];
  const LOWER = P ? [-4.65, -2.13] : [-3.00, -1.52];
  const dayX = i => X0 + (X1 - X0) * i / 27;

  function chart(values, title, bounds, ticks, color) {
    const [bottom, top] = bounds;
    const min = ticks[0], max = ticks[ticks.length - 1];
    const y = value => bottom + (top - bottom) * (value - min) / (max - min);
    const elements = [label(title, CX, top + 0.30, color, 20)];
    for (const tick of ticks) {
      elements.push(
        line(X0, y(tick), X1, y(tick), tick === 0 ? C.muted : C.line),
        label(String(tick), X0 - 0.42, y(tick), C.ink, 18, true),
      );
    }
    for (const i of [0, 7, 14, 21, 27]) {
      elements.push(line(dayX(i), bottom, dayX(i), top, C.line, 1));
      if (bounds === LOWER) {
        elements.push(label(String(i + 1), dayX(i), bottom - 0.27, C.ink, 18, true));
      }
    }
    if (bounds === LOWER) elements.push(label('Day', CX, bottom - 0.56, C.muted, 18));

    const points = [];
    values.forEach((value, i) => {
      if (value === null) return;
      const prior = values[i - 1];
      if (prior != null) {
        points.push(line(dayX(i - 1), y(prior), dayX(i), y(value), color, 2.5));
      }
    });
    values.forEach((value, i) => {
      if (value !== null) {
        points.push(new M.Dot({ point: [dayX(i), y(value), 0], radius: 0.048, color }));
      }
    });
    return { axes: new M.VGroup(...elements), trace: new M.VGroup(...points), y };
  }

  function series(values, title, bounds, color) {
    return chart(values, title, bounds, values === sales ? [30, 60, 90] : [-16, 0, 16], color);
  }

  let upper = null, lower = null, extra = null;
  function setChart(slot, next) {
    const current = slot === 'upper' ? upper : lower;
    if (slot === 'upper') upper = next;
    else lower = next;
    const animations = current ? [fadeOut(current.axes), fadeOut(current.trace)] : [];
    if (next) {
      animations.push(fadeIn(next.axes),
        new M.LaggedStart([fadeIn(next.trace)], { runTime: 0.65 }));
    }
    return animations;
  }

  function highlight(objects = []) {
    const animations = extra ? [fadeOut(extra)] : [];
    extra = objects.length ? new M.VGroup(...objects) : null;
    if (extra) animations.push(fadeIn(extra));
    return animations;
  }

  function ring(graph, i, value, color = C.amber) {
    const mark = new M.Circle({ radius: 0.12, color, strokeWidth: 2 });
    mark.setFill(C.bg, 0);
    return mark.moveTo([dayX(i), graph.y(value), 0]);
  }

  function guide(graph, value, color = C.amber) {
    const y = graph.y(value);
    return new M.DashedLine({ start: [X0, y, 0], end: [X1, y, 0], color, strokeWidth: 2 });
  }

  // The two rows share a date axis. The change sits under the day it belongs to.
  const colX = i => CX + (i - 3.5) * (P ? 0.85 : 0.88);
  const DAY_Y = P ? 0.10 : 0.86;
  const SALES_Y = P ? -0.95 : 0.10;
  const DIFF_Y = P ? -2.85 : -1.40;
  const tableCells = [];
  const headings = new M.VGroup(
    ...days.map((day, i) => label(day, colX(i), DAY_Y, C.ink, 17, true)),
    line((colX(6) + colX(7)) / 2, DAY_Y + 0.24, (colX(6) + colX(7)) / 2, SALES_Y - 0.32, C.line),
    label('Loaves sold', CX, SALES_Y - 0.57, C.cyan, 18),
  );
  function addCell(text, i, y, color) {
    const cell = label(text, colX(i), y, color, 22, true);
    tableCells.push(cell);
    return fadeIn(cell);
  }
  function pair(i) {
    return outline((colX(i - 1) + colX(i)) / 2, SALES_Y, colX(1) - colX(0) + 0.69, 0.57, C.amber);
  }

  // 0–3. Start with the levels, then switch to the notebook.
  await until(S(0));
  await play(...setChart('upper', series(sales, 'Daily sales · loaves', UPPER, C.cyan)),
    ...say('BAKERY SALES ARE CLIMBING'));

  await until(S(1));
  await play(...say('CAN WE MAKE THE LINE CALMER?', C.amber));

  await until(S(2));
  await play(...highlight([ring(upper, 0, sales[0]), ring(upper, 1, sales[1])]),
    ...say('HOW MUCH DID SALES CHANGE?', C.amber));

  await until(S(3));
  await play(...setChart('upper', null), ...highlight(), fadeIn(headings), ...say('START WITH WEEK 1'));

  // 4–12. Show the pair and record the change under its destination day.
  await until(S(4));
  await play(addCell('37', 0, SALES_Y, C.cyan), addCell('39', 1, SALES_Y, C.cyan),
    ...highlight([pair(1)]), ...say('MONDAY TO TUESDAY'));

  const changeTitle = label('Change from yesterday', CX, DIFF_Y - 0.61, C.ink, 18);
  await until(S(5));
  await play(fadeIn(changeTitle), addCell(signed(daily[1]), 1, DIFF_Y, C.green),
    ...formula(['Tuesday − Monday', '39 − 37 = +2'], C.green));

  for (let i = 2; i <= 7; i++) {
    await until(S(i + 4));
    const from = i === 7 ? 'Sun → next Mon' : `${days[i - 1]} → ${days[i]}`;
    const color = changeColor(daily[i]);
    await play(addCell(String(sales[i]), i, SALES_Y, C.cyan),
      addCell(signed(daily[i]), i, DIFF_Y, color), ...highlight([pair(i)]),
      ...say(from, color),
      ...formula([from, `${sales[i]} − ${sales[i - 1]} = ${signed(daily[i])}`], color));
  }

  await until(S(12));
  await play(...highlight(), ...say('PLUS OR MINUS?', C.amber),
    ...formula(['Plus: more loaves', 'Minus: fewer loaves'], C.pink));

  // 13–18. Compare both lines on the same day axis.
  await until(S(13));
  await play(fadeOut(new M.VGroup(headings, changeTitle, ...tableCells)), ...formula(),
    ...setChart('upper', series(sales, 'Daily sales · loaves', UPPER, C.cyan)),
    ...setChart('lower', series(daily, 'Change from yesterday · loaves', LOWER, C.green)),
    ...say('DRAW THE CHANGES'));

  await until(S(14));
  await play(...highlight([ring(upper, 0, sales[0]),
    outline(dayX(0), lower.y(0), 0.24, 0.28, C.amber)]),
    ...formula(['28 days → 27 changes', 'Day 1 has no yesterday'], C.amber));

  await until(S(15));
  await play(...highlight([ring(upper, 0, sales[0]), ring(upper, 26, sales[26])]),
    ...formula(['Daily sales climb', '37 at the start · peak 88']));

  await until(S(16));
  await play(...highlight([guide(lower, -14), guide(lower, 13)]),
    ...formula(['Day-to-day changes', 'Between −14 and +13'], C.green));

  await until(S(17));
  await play(...say('THIS IS DIFFERENCING', C.green), ...highlight(), ...formula());

  await until(S(18));
  await play(...highlight([ring(upper, 3, sales[3]), ring(upper, 4, sales[4]), ring(lower, 4, daily[4], C.green)]),
    ...formula(['Today − yesterday', '54 − 52 = +2'], C.green));

  // 19–20. A staircase makes the difference between height and step size visible.
  const stairX = CX - 2.10;
  const stairY = P ? -3.40 : -2.25;
  const stairWidth = 0.9, stairHeight = P ? 0.63 : 0.53;
  const risers = [];
  const steps = [];
  for (let i = 0; i < 4; i++) {
    const x = stairX + i * stairWidth, y = stairY + i * stairHeight;
    steps.push(line(x, y, x, y + stairHeight, C.cyan, 4),
      line(x, y + stairHeight, x + stairWidth, y + stairHeight, C.cyan, 4));
    risers.push(line(x - 0.14, y, x - 0.14, y + stairHeight, C.amber, 4));
  }
  const staircase = new M.VGroup(...steps, label('Floor', stairX - 0.50, stairY, C.muted, 17));
  const height = new M.VGroup(
    line(stairX + 4.15, stairY, stairX + 4.15, stairY + 4 * stairHeight, C.violet, 3),
    label('Height', stairX + 4.65, stairY + 2 * stairHeight, C.violet, 18),
  );

  await until(S(19));
  await play(...setChart('upper', null), ...setChart('lower', null), ...highlight(), ...formula(),
    fadeIn(staircase), fadeIn(height), ...say('CLIMBING STAIRS'));

  await until(S(20));
  await play(fadeOut(height), ...highlight(risers), ...say('LOOK AT EACH STEP', C.amber),
    ...formula(['Height grows', 'The steps are the same size'], C.amber));

  // 21–26. Seven changes add up to the difference between two Mondays.
  const mondays = [0, 7, 14, 21];
  await until(S(21));
  await play(fadeOut(staircase), ...highlight(),
    ...setChart('upper', series(sales, 'Daily sales · loaves', UPPER, C.cyan)),
    ...setChart('lower', series(daily, 'Change from yesterday · loaves', LOWER, C.green)),
    ...say('WHERE DID THE TREND GO?', C.amber), ...formula(['The level stops climbing', 'Small upward push remains'], C.amber));

  await until(S(22));
  await play(...highlight([ring(upper, 0, sales[0]), ring(upper, 7, sales[7]),
    ...daily.slice(1, 8).map((value, i) => ring(lower, i + 1, value))]),
    ...say('MONDAY TO NEXT MONDAY'), ...formula(['Week 1 Mon → Week 2 Mon', 'Add the seven changes']));

  const weekTerms = new M.VGroup(
    ...daily.slice(1, 8).map((value, i) =>
      label(signed(value), colX(i + 1), SALES_Y, changeColor(value), 24, true)),
    line(colX(1) - 0.32, SALES_Y - 0.42, colX(7) + 0.32, SALES_Y - 0.42, C.muted),
    label('Total: +7 loaves', CX, SALES_Y - 0.83, C.amber, 23),
  );
  await until(S(23));
  await play(...setChart('upper', null), ...setChart('lower', null), ...highlight(),
    fadeIn(weekTerms), ...say('ADD ALL SEVEN CHANGES'), ...formula());

  const firstPair = new M.VGroup(
    label('Week 1 Mon', CX - 1.75, SALES_Y, C.cyan, 19),
    label('Week 2 Mon', CX + 1.75, SALES_Y, C.cyan, 19),
    label('37', CX - 1.75, SALES_Y - 0.70, C.cyan, 29, true),
    label('→', CX, SALES_Y - 0.70, C.amber, 29),
    label('44', CX + 1.75, SALES_Y - 0.70, C.cyan, 29, true),
  );
  await until(S(24));
  await play(fadeOut(weekTerms), fadeIn(firstPair), ...say('SAME AS THE JUMP BETWEEN MONDAYS'),
    ...formula(['Last day − first day', '44 − 37 = +7'], C.amber));

  const mondayJumps = new M.VGroup(...mondays.slice(1).map((day, i) => {
    const gain = sales[day] - sales[mondays[i]];
    return label(`${sales[mondays[i]]} → ${sales[day]}     ${signed(gain)}`,
      CX, SALES_Y - i * 0.65, C.amber, 23, true);
  }));
  await until(S(25));
  await play(fadeOut(firstPair), fadeIn(mondayJumps), ...say('THE TREND', C.amber),
    ...formula(['+7 loaves over 7 days', '+1 loaf a day on average'], C.amber));

  await until(S(26));
  await play(fadeOut(mondayJumps),
    ...setChart('upper', series(sales, 'Daily sales · loaves', UPPER, C.cyan)),
    ...setChart('lower', series(daily, 'Change from yesterday · loaves', LOWER, C.green)),
    ...say('THE RULE'),
    ...formula(['Change today =', 'Sales today − sales yesterday']));

  // 27–33. The same weekly drop repeats. Compare matching weekdays instead.
  await until(S(27));
  await play(...highlight(mondays.slice(1).map(i => ring(lower, i, daily[i], C.pink))),
    ...say('SUNDAY TO MONDAY', C.pink), ...formula(['Three Monday drops', '−14   −14   −14'], C.pink));

  await until(S(28));
  await play(...say('THE WEEKLY PATTERN REMAINS', C.pink),
    ...formula(['Day-to-day changes', 'Weekly drop still repeats'], C.pink));

  await until(S(29));
  await play(...highlight([ring(upper, 5, sales[5]), ring(upper, 12, sales[12])]),
    ...say('SATURDAY TO SATURDAY', C.amber), ...formula(['Same weekday last week', '75 − 67 = +8'], C.amber));

  await until(S(30));
  const sevenDayChart = series(weekly, 'Change from last week · loaves', LOWER, C.green);
  await play(...setChart('lower', sevenDayChart), ...highlight([guide(sevenDayChart, 7)]),
    ...say('LAG 7 = SEVEN DAYS BACK', C.green), ...formula(['Range: +4 to +9', 'Average: +7'], C.green));

  await until(S(31));
  await play(...say('A CALMER LINE', C.green), ...formula(['Weeks 2, 3 and 4', 'Each averages +7'], C.green));

  await until(S(32));
  await play(...say('REMOVE THE CLIMBING LEVEL', C.green),
    ...formula(['Seven-day changes', 'A steadier series to work with'], C.green));

  const rebuild = [sales[0]];
  for (let i = 1; i <= 3; i++) rebuild.push(rebuild[i - 1] + daily[i]);
  const recovery = rebuild.map((value, i) => label(String(value), CX + (i - 1.5) * 1.48,
    SALES_Y, C.cyan, 29, true));
  const additions = rebuild.slice(1).map((_, i) =>
    label(signed(daily[i + 1]), CX + (i - 1) * 1.48, SALES_Y + 0.53, C.green, 18, true));
  const arrows = rebuild.slice(1).map((_, i) =>
    label('→', CX + (i - 1) * 1.48, SALES_Y, C.green, 22));

  await until(S(33));
  const reconstruction = new M.VGroup(...recovery, ...additions, ...arrows);
  await play(...setChart('upper', null), ...setChart('lower', null), ...highlight(),
    ...say('ADD THE CHANGES TO GO BACK'), ...formula(['Start at 37 loaves', '37 → 39 → 43 → 52']),
    new M.LaggedStart([fadeIn(reconstruction)], { runTime: 0.7 }));

  // 34–37. Apply a second difference to the already calm series.
  await until(S(34));
  await play(fadeOut(reconstruction),
    ...setChart('upper', series(weekly, 'Seven-day changes · loaves', UPPER, C.green)),
    ...say('THE TRAP: DIFFERENCING TOO MUCH', C.pink), ...formula(['Already steady', 'Average change stays at +7'], C.green));

  await until(S(35));
  const secondChart = series(twice, 'Changes of those changes · loaves', LOWER, C.pink);
  await play(...setChart('lower', secondChart),
    ...highlight([ring(upper, 7, weekly[7]), ring(upper, 8, weekly[8]), ring(secondChart, 8, twice[8], C.pink)]),
    ...say('CHANGES OF CHANGES', C.pink), ...formula(['Take another difference', '+5 − (+7) = −2'], C.pink));

  await until(S(36));
  await play(...highlight([8, 9, 10, 11].map(i => ring(lower, i, twice[i], C.pink))),
    ...say('EXTRA WIGGLES', C.pink), ...formula(['First four new changes', '−2, +4, −5, +5'], C.pink));

  await until(S(37));
  await play(...setChart('upper', series(sales, 'Daily sales · loaves', UPPER, C.cyan)),
    ...setChart('lower', series(weekly, 'Change from last week · loaves', LOWER, C.green)),
    ...highlight(), ...say('CHECK THE RESULT', C.green), ...formula(['Looks steady?', 'Stop here'], C.green));

  // 38–39. Preview the next lesson, then return to the main comparison.
  const parts = new M.VGroup(
    label('Bakery sales', CX, SALES_Y + 0.46, C.cyan, 24),
    ...['Trend', 'Weekly pattern', 'What is left'].map((name, i) => {
      const x = CX + (i - 1) * 2.22;
      const color = [C.amber, C.violet, C.green][i];
      return new M.VGroup(
        outline(x, SALES_Y - 0.82, 2.05, 0.64, color),
        label(name, x, SALES_Y - 0.82, color, 17),
      );
    }),
  );
  await until(S(38));
  await play(...setChart('upper', null), ...setChart('lower', null),
    fadeIn(parts), ...formula(), ...say('NEXT: SPLIT SALES INTO THREE PARTS'));

  await until(S(39));
  await play(fadeOut(parts),
    ...setChart('upper', series(sales, 'Daily sales · loaves', UPPER, C.cyan)),
    ...setChart('lower', series(weekly, 'Change from last week · loaves', LOWER, C.green)),
    ...say('REPLACE EACH LEVEL WITH ITS CHANGE', C.green),
    ...formula(['A climbing level', 'Becomes a steadier line'], C.green));
}
