// 11.1.5 Autocorrelation. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const SALES = [
    37, 39, 43, 52, 54, 67, 58,
    44, 44, 52, 56, 63, 75, 65,
    51, 53, 58, 63, 71, 80, 72,
    58, 58, 65, 71, 78, 88, 79,
  ];
  const TREND = SALES.map((_, i) => 47 + i);
  const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const LEFT = CX - 2.65, RIGHT = CX + 3.05;
  const TOP = P ? 1.38 : 1.08, BASE = P ? -4.2 : -2.12;
  const say = (text, color = C.cyan) => showA(text, color, PILL, P ? 17 : 18);
  const xy = (x, y) => [x, y, 0];
  const label = (text, x, y, size = 18, color = C.ink) =>
    T(String(text), size, color, true).moveTo(xy(x, y));
  const line = (x1, y1, x2, y2, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start: xy(x1, y1), end: xy(x2, y2), color, strokeWidth });
  const dot = (x, y, color = C.cyan, radius = 0.082) =>
    new M.Dot({ point: xy(x, y), radius, color });
  const fadeIn = obj => new M.FadeIn(obj, { runTime: 0.42 });
  const fadeOut = obj => new M.FadeOut(obj, { runTime: 0.25 });

  let pictureNow = null, boxNow = null;

  function formula(rows, color) {
    const size = P ? 22 : 21, lh = 0.35;
    const texts = rows.map(row => {
      const [text, ink] = Array.isArray(row) ? row : [row, C.ink];
      return T(text, size, ink, true);
    });
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.62;
    const height = texts.length * lh + 0.27;
    const frame = new M.RoundedRectangle({
      width, height, cornerRadius: 0.14, color, strokeWidth: 2,
    });
    frame.setFill(C.card, 0.95);
    frame.moveTo(BOXP);
    texts.forEach((t, i) => t.moveTo(xy(
      BOXP[0] - width / 2 + 0.31 + t.getWidth() / 2,
      BOXP[1] + (texts.length - 1 - 2 * i) * lh / 2,
    )));
    const group = new M.VGroup(frame, ...texts);
    const maxWidth = P ? FW - 1.2 : 4.0;
    if (width > maxWidth) group.scale(maxWidth / width);
    return group;
  }

  // Omit a field to keep it. Pass null to clear its space.
  async function beat(text, color = C.cyan, { picture, rows } = {}) {
    const remove = [], add = [];
    if (picture !== undefined) {
      if (pictureNow) remove.push(fadeOut(pictureNow));
      pictureNow = picture;
      if (pictureNow) add.push(fadeIn(pictureNow));
    }
    if (rows !== undefined) {
      if (boxNow) remove.push(fadeOut(boxNow));
      boxNow = rows ? formula(rows, color) : null;
      if (boxNow) add.push(fadeIn(boxNow));
    }
    if (remove.length) await play(...remove);
    await play(...add, ...say(text, color));
  }

  function pairs(data, lag) {
    return data.slice(lag).map((today, i) => ({
      day: i + lag + 1, past: data[i], today,
    }));
  }

  function correlation(list) {
    const n = list.length;
    const meanX = list.reduce((sum, p) => sum + p.past, 0) / n;
    const meanY = list.reduce((sum, p) => sum + p.today, 0) / n;
    let cross = 0, xx = 0, yy = 0;
    for (const { past, today } of list) {
      const dx = past - meanX, dy = today - meanY;
      cross += dx * dy;
      xx += dx * dx;
      yy += dy * dy;
    }
    return cross / Math.sqrt(xx * yy);
  }

  const lagScore = lag => correlation(pairs(SALES, lag));
  const score = lag => lagScore(lag).toFixed(2);
  const dayName = day => `W${Math.ceil(day / 7)} ${WEEKDAYS[(day - 1) % 7]}`;
  const pairText = (lag, day) => `${SALES[day - lag - 1]} → ${SALES[day - 1]}`;

  function pairTable(lag, days, question = false) {
    const y = P ? 0.7 : 0.95;
    const cx = P ? 1.65 : 1.8, pitch = P ? 1.4 : 0.82;
    const parts = [
      label(`${lag} ${lag === 1 ? 'day' : 'days'} earlier`, CX - cx, y, 23, C.violet),
      label('Today', CX + cx, y, 23, C.cyan),
      line(LEFT, y - 0.36, RIGHT, y - 0.36, C.line),
    ];
    days.forEach((day, i) => {
      const rowY = y - 0.95 - i * pitch;
      parts.push(
        label(`${dayName(day - lag)}  ${SALES[day - lag - 1]}`, CX - cx, rowY, 26, C.violet),
        label('→', CX, rowY, 24, C.muted),
        label(`${dayName(day)}  ${question && i === 0 ? '?' : SALES[day - 1]}`, CX + cx, rowY, 26, C.cyan),
      );
    });
    return new M.VGroup(...parts);
  }

  function scatter(lag, { names = true, guide = false, marks = [], data = SALES, trendOnly = false, r = false } = {}) {
    const x = v => LEFT + (v - 30) / 60 * (RIGHT - LEFT);
    const y = v => BASE + (v - 30) / 60 * (TOP - BASE);
    const parts = [];
    for (const v of [30, 50, 70, 90]) {
      parts.push(
        line(LEFT, y(v), RIGHT, y(v), v === 30 ? C.muted : C.grid, v === 30 ? 2 : 1),
        line(x(v), BASE, x(v), TOP, v === 30 ? C.muted : C.grid, v === 30 ? 2 : 1),
        label(v, x(v), BASE - 0.23, 16, C.muted),
        label(v, LEFT - 0.34, y(v), 16, C.muted),
      );
    }
    if (names) {
      parts.push(
        label(trendOnly ? 'Earlier trend level' : `Loaves ${lag} ${lag === 1 ? 'day' : 'days'} earlier`, CX, BASE - 0.63, 18, C.violet),
        label(trendOnly ? 'Trend level today' : 'Loaves today', LEFT + 1.00, TOP + 0.24, 17, C.cyan),
      );
    }
    if (guide) {
      const first = trendOnly ? 47 : 36, last = trendOnly ? 74 - lag : 81;
      parts.push(new M.DashedLine({
        start: xy(x(first), y(first + lag)), end: xy(x(last), y(last + lag)), color: C.amber,
      }));
    }
    if (r) {
      const tag = L.pill(`r ≈ ${score(lag)}`, C.amber, P ? 20 : 18);
      tag.moveTo(xy(RIGHT - 0.95, BASE + 0.45));
      parts.push(tag);
    }
    for (const p of pairs(data, lag)) {
      const mark = marks.indexOf(p.day);
      const color = mark < 0 ? C.cyan : [C.amber, C.violet, C.green][mark % 3];
      parts.push(dot(x(p.past), y(p.today), color, mark < 0 ? 0.073 : 0.104));
    }
    return new M.VGroup(...parts);
  }

  function scaleExamples() {
    const examples = [
      { title: '+1', color: C.green, points: [[0, 0], [1, 1], [2, 2], [3, 3]] },
      { title: '0', color: C.muted, points: [[0, 0], [0, 3], [3, 0], [3, 3], [1.5, 1.5]] },
    ];
    return new M.VGroup(...examples.flatMap(({ title, color, points }, i) => {
      const x = CX + (i ? 0.45 : -2.65), y = P ? -2.3 : -1.73;
      return [
        line(x, y, x + 2.24, y), line(x, y, x, y + 2.1),
        label(title, x + 1.1, y - 0.40, 23, color),
        ...points.map(([a, b]) => dot(x + 0.25 + a * 0.53, y + 0.24 + b * 0.48, color)),
      ];
    }));
  }

  function echo() {
    const y = P ? -1.2 : -0.86;
    const parts = [line(LEFT, y, RIGHT, y)];
    const x1 = CX - 1.5, x2 = CX + 1.5;
    for (const [x, height, name, color] of [[x1, 1.05, 'Clap', C.cyan], [x2, 0.66, 'Echo', C.violet]]) {
      parts.push(
        line(x - 0.22, y, x, y + height, color, 3),
        line(x, y + height, x + 0.22, y, color, 3),
        label(name, x, y - 0.38, 21, color),
      );
    }
    parts.push(line(x1, y - 0.86, x2, y - 0.86, C.amber),
      label('Delay', CX, y - 1.15, 18, C.amber));
    return new M.VGroup(...parts);
  }

  function bars(last, highlights = []) {
    const low = -0.33, high = 1.06;
    const y = v => BASE + (v - low) / (high - low) * (TOP - BASE);
    const pitch = (RIGHT - LEFT) / last;
    const parts = [];
    for (const v of [0, 0.5, 1]) {
      parts.push(line(LEFT, y(v), RIGHT, y(v), v ? C.grid : C.muted, v ? 1 : 2),
        label(v, LEFT - 0.37, y(v), 16, C.muted));
    }
    for (let lag = 1; lag <= last; lag++) {
      const val = lagScore(lag), h = Math.abs(y(val) - y(0));
      const x = LEFT + (lag - 0.5) * pitch;
      const color = highlights.includes(lag) ? C.amber : C.cyan;
      const rect = new M.Rectangle({ width: pitch * 0.62, height: Math.max(0.003, h), color, strokeWidth: 1 });
      rect.setFill(color, 0.84);
      rect.moveTo(xy(x, (y(val) + y(0)) / 2));
      parts.push(rect);
      if (last <= 7 || highlights.includes(lag)) {
        parts.push(label(val.toFixed(2), x, y(val) + (val >= 0 ? 0.22 : -0.22), P ? 16 : 15, color));
      }
      if (last <= 7 || [1, 3, 7, 14].includes(lag)) {
        parts.push(label(lag, x, BASE - 0.20, 16, color));
      }
    }
    parts.push(label('Lag in days', CX, BASE - 0.61, 18, C.violet));
    return new M.VGroup(...parts);
  }

  function stackedWeeks() {
    const colors = [C.cyan, C.violet, C.green, C.amber];
    const x = i => LEFT + (RIGHT - LEFT) * i / 6;
    const y = v => BASE + (v - 30) / 60 * (TOP - BASE);
    const parts = [];
    for (const value of [30, 50, 70, 90]) {
      parts.push(line(LEFT, y(value), RIGHT, y(value), C.grid, 1),
        label(value, LEFT - 0.34, y(value), 16, C.muted));
    }
    WEEKDAYS.forEach((name, i) => parts.push(label(name, x(i), BASE - 0.3, 16)));
    colors.forEach((color, week) => {
      const values = SALES.slice(week * 7, week * 7 + 7);
      values.forEach((value, i) => {
        if (i) parts.push(line(x(i - 1), y(values[i - 1]), x(i), y(value), color, 2));
        parts.push(dot(x(i), y(value), color, i === 5 ? 0.10 : 0.065));
      });
    });
    return new M.VGroup(...parts);
  }

  function trendThroughSales() {
    const x = i => LEFT + i * (RIGHT - LEFT) / 27;
    const y = v => BASE + (v - 30) / 60 * (TOP - BASE);
    const parts = [];
    for (const value of [30, 50, 70, 90]) {
      parts.push(line(LEFT, y(value), RIGHT, y(value), C.grid, 1),
        label(value, LEFT - 0.34, y(value), 16, C.muted));
    }
    SALES.forEach((value, i) => {
      if (i) parts.push(line(x(i - 1), y(SALES[i - 1]), x(i), y(value), C.cyan, 1.5));
      parts.push(dot(x(i), y(value), C.cyan, 0.06));
    });
    parts.push(new M.DashedLine({ start: xy(x(0), y(TREND[0])), end: xy(x(27), y(TREND[27])), color: C.amber }));
    for (const i of [0, 6, 13, 20, 27]) parts.push(label(i + 1, x(i), BASE - 0.23, 16, C.muted));
    parts.push(label('Day', CX, BASE - 0.62, 17, C.violet));
    return new M.VGroup(...parts);
  }

  function weeklyLevels() {
    const averages = [50, 57, 64, 71];
    const x = i => LEFT + 0.54 + i * 1.52;
    const y = v => BASE + (v - 45) / 34 * (TOP - BASE);
    const parts = [line(LEFT, BASE, RIGHT, BASE)];
    averages.forEach((value, i) => {
      if (i) parts.push(line(x(i - 1), y(averages[i - 1]), x(i), y(value), C.amber));
      parts.push(dot(x(i), y(value), C.amber, 0.105),
        label(value, x(i), y(value) + 0.27, 19, C.amber),
        label(`Week ${i + 1}`, x(i), BASE - 0.30, 16, C.muted));
    });
    return new M.VGroup(...parts);
  }

  await until(S(0));
  await beat('PAIR EACH DAY WITH A PAST DAY', C.cyan, { picture: pairTable(7, [13, 20, 22]) });

  await until(S(1));
  await beat('WHAT DOES LAST WEEK TELL US?', C.amber, { picture: pairTable(7, [13], true) });

  await until(S(2));
  await beat('ONE NUMBER FOR THE LINK', C.violet, { rows: ['How strong is the link?', ['?', C.violet]] });

  await until(S(3));
  await beat('LAG 7: SAME WEEKDAY', C.cyan, { picture: pairTable(7, [13, 20, 22]), rows: null });

  await until(S(4));
  await beat('21 PAIRS, 21 DOTS', C.cyan, { picture: scatter(7, { names: false }) });

  await until(S(5));
  await beat('EARLIER ACROSS, TODAY UP', C.cyan, { picture: scatter(7) });

  await until(S(6));
  await beat('ALMOST A STRAIGHT RISING LINE', C.green, { picture: scatter(7, { guide: true }) });

  await until(S(7));
  await beat('HIGH WITH HIGH, LOW WITH LOW', C.amber, {
    picture: scatter(7, { guide: true, marks: [13, 22] }),
    rows: [[`Sat   ${pairText(7, 13)}`, C.amber], [`Mon   ${pairText(7, 22)}`, C.violet]],
  });

  await until(S(8));
  await beat('LAST WEEK GIVES A GOOD GUESS', C.green, {
    picture: scatter(7, { guide: true, marks: [13] }),
    rows: ['Last Saturday: 67', 'Guess: about 74', ['This Saturday: 75', C.amber]],
  });

  await until(S(9));
  await beat('CORRELATION', C.cyan, { rows: null });

  await until(S(10));
  await beat('HOW CLOSE TO A STRAIGHT LINE?', C.cyan, { rows: ['Correlation scale', ['−1       0       +1', C.cyan]] });

  await until(S(11));
  await beat('+1 OR ZERO', C.green, {
    picture: scaleExamples(), rows: ['+1: perfect rising line', '0: no straight-line link'],
  });

  await until(S(12));
  await beat('ALMOST PERFECT AT LAG 7', C.amber, {
    picture: scatter(7, { guide: true, r: true }), rows: ['21 pairs', [`Correlation ≈ ${score(7)}`, C.amber]],
  });

  await until(S(13));
  await beat('LAG 1: TODAY AND YESTERDAY', C.cyan, {
    picture: scatter(1, { marks: [2] }), rows: ['27 pairs', [`Mon → Tue: ${pairText(1, 2)}`, C.amber]],
  });

  await until(S(14));
  await beat('MORE SCATTERED AT LAG 1', C.amber, {
    picture: scatter(1, { r: true }), rows: ['27 pairs', [`Correlation ≈ ${score(1)}`, C.amber]],
  });

  await until(S(15));
  await beat('A WEAKER LINK', C.violet, {
    picture: scatter(1, { marks: [8], r: true }),
    rows: [`Lag 7: ${score(7)}`, `Lag 1: ${score(1)}`, [`Sun → Mon: ${pairText(1, 8)}`, C.amber]],
  });

  await until(S(16));
  await beat('LAG 3: THREE DAYS EARLIER', C.cyan, {
    picture: scatter(3), rows: ['25 pairs'],
  });

  await until(S(17));
  await beat('DIFFERENT WEEKDAYS', C.violet, {
    picture: scatter(3, { marks: [6, 22] }),
    rows: [[`Wed → Sat: ${pairText(3, 6)}`, C.amber], [`Fri → Mon: ${pairText(3, 22)}`, C.violet]],
  });

  await until(S(18));
  await beat('ALMOST NO STRAIGHT-LINE LINK', C.amber, {
    picture: scatter(3, { r: true }), rows: ['25 pairs', [`Correlation ≈ ${score(3)}`, C.amber]],
  });

  await until(S(19));
  await beat('THE LINK CHANGES WITH THE LAG', C.violet, {
    rows: [`Lag 1: ${score(1)}`, `Lag 3: ${score(3)}`, `Lag 7: ${score(7)}`],
  });

  await until(S(20));
  await beat('AUTOCORRELATION', C.cyan, { rows: ['Correlation with the', 'series’ own past'] });

  await until(S(21));
  await beat('AUTO MEANS SELF', C.cyan, {
    picture: pairTable(7, [13, 20, 22]), rows: ['Same bakery sales', 'Shifted by 7 days'],
  });

  await until(S(22));
  await beat('A CLAP AND ITS ECHO', C.violet, { picture: echo(), rows: null });

  await until(S(23));
  await beat('CHECK FOR ECHOES AT EACH DELAY', C.violet, {
    picture: pairTable(1, [2, 3, 4]), rows: ['Try 1 day back…'],
  });
  await until(S(23) + 1.4);
  await beat('CHECK FOR ECHOES AT EACH DELAY', C.violet, {
    picture: pairTable(3, [4, 5, 6]), rows: ['Try 3 days back…'],
  });
  await until(S(23) + 2.9);
  await beat('CHECK FOR ECHOES AT EACH DELAY', C.violet, {
    picture: pairTable(7, [13, 20, 22]), rows: ['Try 7 days back…'],
  });

  await until(S(24));
  await beat('ONE BAR PER LAG', C.cyan, { picture: bars(7), rows: ['Bar height', '= autocorrelation'] });

  await until(S(25));
  await beat('COMPARE 1, 3, AND 7 DAYS', C.amber, {
    picture: bars(7, [1, 3, 7]), rows: [`Lag 1: ${score(1)}`, `Lag 3: ${score(3)}`, [`Lag 7: ${score(7)}`, C.amber]],
  });

  await until(S(26));
  await beat('7 DAYS: THE WEEKLY ECHO', C.amber, {
    picture: stackedWeeks(), rows: ['Four weeks stacked', ['Saturday peaks each time', C.amber]],
  });

  await until(S(27));
  await beat('WHAT THE LAG 7 BAR MEANS', C.cyan, {
    picture: scatter(7, { guide: true, r: true }),
    rows: ['Correlation between', 'today and 7 days ago', [`≈ ${score(7)}`, C.amber]],
  });

  await until(S(28));
  await beat('WHICH PAST DAYS HELP MOST?', C.green, {
    picture: bars(7, [7]), rows: ['Of lags 1 to 7,', ['7 gives the strongest link', C.amber]],
  });

  await until(S(29));
  await beat('THE PERIOD IS THE CYCLE LENGTH', C.amber, { rows: ['Tallest bar here: lag 7', ['Weekly cycle: 7 days', C.amber]] });

  await until(S(30));
  await beat('A TREND CAN CREATE ECHOES', C.violet, { picture: trendThroughSales(), rows: [['Dashed line: rising trend', C.amber]] });

  await until(S(31));
  await beat('LAG 14: TWO WEEKS BACK', C.amber, {
    picture: scatter(14, { guide: true, marks: [27] }),
    rows: ['14 pairs', `Sat → Sat: ${pairText(14, 27)}`, [`Correlation ≈ ${score(14)}`, C.amber]],
  });

  await until(S(32));
  await beat('EARLY DAYS LOW, LATE DAYS HIGH', C.amber, {
    picture: trendThroughSales(), rows: ['Weekly peaks repeat', ['The whole level rises', C.amber]],
  });

  await until(S(33));
  await beat('THE RISE ALONE LINKS DAYS', C.violet, {
    picture: scatter(3, { data: TREND, guide: true, trendOnly: true }),
    rows: ['Keep just the rising line', ['Lag 3: perfect rising link', C.amber]],
  });

  await until(S(34));
  await beat('A HIGH BAR CAN COME FROM TREND', C.amber, {
    picture: bars(14, [7, 14]), rows: [`Lag 7:  ${score(7)}`, `Lag 14: ${score(14)}`, ['Check for a rising level', C.amber]],
  });

  await until(S(35));
  await beat('SOFTWARE CAN GIVE SMALLER VALUES', C.cyan, {
    picture: bars(7, [1, 7]),
    rows: ['Pair correlation → software', `Lag 1: ${score(1)} → 0.70`, `Lag 7: ${score(7)} → 0.56`],
  });

  await until(S(36));
  await beat('WHAT WOULD STAY STEADY?', C.violet, {
    picture: weeklyLevels(), rows: ['Weekly average level', 'Links to past days'],
  });

  await until(S(37));
  await beat('AUTOCORRELATION', C.green, {
    picture: bars(7, [7]), rows: ['Correlation with', 'its own past', 'at each lag'],
  });
}
