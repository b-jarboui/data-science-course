// 11.1.1 Time indexing. Beat i follows narration sentence i.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const SALES = [40, 40, null, 0, 55, 70, 55];
  const recorded = DAYS.map((day, i) => ({ day, i, value: SALES[i] }))
    .filter(row => row.value !== null);
  const total = recorded.reduce((sum, row) => sum + row.value, 0);

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const BASE = P ? -4.2 : -1.91;
  const TOP = P ? 1.21 : 1.02;
  const SP = P ? 0.86 : 0.83;
  const LEFT = CX - 3 * SP - 0.43;
  const RIGHT = CX + 3 * SP + 0.43;
  const dayY = BASE - (P ? 0.53 : 0.47);
  const slotX = i => CX + (i - 3) * SP;
  const rowX = j => CX + (j - (recorded.length - 1) / 2) * SP;
  const yFor = value => BASE + value / 90 * (TOP - BASE);
  const say = (text, color = C.cyan) => showA(text, color, PILL);

  function textAt(text, size, color, x, y, mono = true) {
    const label = T(text, size, color, mono);
    label.moveTo([x, y, 0]);
    return label;
  }

  function line(x1, y1, x2, y2, color, width = 2) {
    return new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth: width });
  }

  function card(x, y, width, height, color, fill = null) {
    const rect = new M.RoundedRectangle({ width, height, cornerRadius: 0.12, color, strokeWidth: 2 });
    if (fill) rect.setFill(fill, 0.95);
    rect.moveTo([x, y, 0]);
    return rect;
  }

  const fade = object => new M.FadeIn(object, { runTime: 0.55 });
  const out = object => new M.FadeOut(object, { runTime: 0.48 });
  const draw = object => new M.Create(object, { runTime: 0.65 });
  const sequence = (objects, runTime = 1.2) =>
    new M.LaggedStart(objects.map(fade), { lagRatio: 0.14, runTime });

  function panelAt(x, y, rows, color, maxWidth) {
    const size = P ? 22 : 21;
    const lh = P ? 0.36 : 0.42;
    const labels = rows.map(row => {
      const [text, ink] = Array.isArray(row) ? row : [row, C.ink];
      return T(text, size, ink, true);
    });
    const width = Math.max(...labels.map(label => label.getWidth())) + 0.62;
    const height = labels.length * lh + 0.32;
    const border = card(x, y, width, height, color, C.card);
    labels.forEach((label, i) => {
      const labelX = x - width / 2 + 0.31 + label.getWidth() / 2;
      label.moveTo([labelX, y + ((labels.length - 1) / 2 - i) * lh, 0]);
    });
    const group = new M.VGroup(border, ...labels);
    if (width > maxWidth) group.scale(maxWidth / width);
    group.moveTo([x, y, 0]);
    return group;
  }

  let boxNow = null;
  function fbox(rows = null, color = C.cyan) {
    const previous = boxNow;
    boxNow = rows ? panelAt(BOXP[0], BOXP[1], rows, color, P ? FW - 1.2 : 4) : null;
    return [...(previous ? [out(previous)] : []), ...(boxNow ? [fade(boxNow)] : [])];
  }

  let focusNow = null;
  function focus(next = null) {
    const previous = focusNow;
    focusNow = next;
    return [...(previous ? [out(previous)] : []), ...(next ? [fade(next)] : [])];
  }

  // 0–3: the bakery notebook, then the winter page.
  const loafY = P ? 0.66 : 0.68;
  const loaf = card(CX - 1.65, loafY, 1.04, 0.54, C.amber, C.card);
  const cuts = [-0.22, 0, 0.22].map(offset =>
    line(CX - 1.65 + offset - 0.04, loafY - 0.1, CX - 1.65 + offset + 0.04, loafY + 0.1, C.amber));
  const cover = new M.VGroup(
    card(CX, loafY, 5.38, 1.08, C.cyan, C.card), loaf, ...cuts,
    textAt('Bakery sales notebook', P ? 24 : 23, C.ink, CX + 0.62, loafY, false)
  );
  const yearY = P ? -0.75 : -0.65;
  const yearCards = [-1, 1].map((direction, i) => new M.VGroup(
    card(CX + direction * 1.48, yearY, 2.55, 0.65, C.muted, C.card),
    textAt(`Year ${i + 1}`, 21, C.ink, CX + direction * 1.48, yearY)
  ));
  const dayRun = new M.VGroup(
    ...Array.from({ length: 11 }, (_, i) =>
      new M.Dot({ point: [CX + (i - 5) * 0.4, yearY - 0.65, 0], radius: 0.055, color: C.cyan })),
    textAt('Earlier days → later days', 18, C.muted, CX, yearY - 1.08, false)
  );

  await until(S(0)); await play(fade(cover), ...say('LOAVES SOLD EACH DAY'));
  await until(S(1)); await play(sequence(yearCards), ...say('TWO YEARS OF DAYS'));
  await until(S(2)); await play(fade(dayRun), ...say('TIME SERIES = DATA IN TIME ORDER'));

  const rowPitch = P ? 0.84 : 0.49;
  const tableY = j => (P ? 0.45 : 0.40) - j * rowPitch;
  const table = new M.VGroup(
    textAt('Winter week', 24, C.ink, CX, tableY(0) + rowPitch / 2 + 0.66, false),
    textAt('Day', 18, C.muted, CX - 1.46, tableY(0) + rowPitch / 2 + 0.24),
    textAt('Loaves', 18, C.muted, CX + 1.5, tableY(0) + rowPitch / 2 + 0.24)
  );
  const rows = recorded.map(({ day, value }, j) => new M.VGroup(
    textAt(day, 23, C.ink, CX - 1.46, tableY(j)),
    textAt(String(value), 24, value === 0 ? C.amber : C.cyan, CX + 1.5, tableY(j)),
    line(CX - 2.22, tableY(j) - rowPitch / 2, CX + 2.22, tableY(j) - rowPitch / 2, C.line)
  ));

  const ruled = new M.VGroup(...recorded.map((_, j) =>
    line(CX - 2.22, tableY(j) - rowPitch / 2, CX + 2.22, tableY(j) - rowPitch / 2, C.line)));
  await until(S(3));
  await play(out(cover), out(yearCards[0]), out(yearCards[1]), out(dayRun), fade(table), fade(ruled), ...say('OPEN THE NOTEBOOK'));
  for (let j = 0; j < rows.length; j++) {
    await until(S(4 + j));
    const { day, value } = recorded[j];
    await play(fade(rows[j]), ...say(`${day.toUpperCase()}  ${value}`, value === 0 ? C.amber : C.cyan));
  }

  // 10–15: keep Wednesday out of the notebook and distinguish it from Thursday.
  await until(S(10));
  await play(...focus(card(CX, (tableY(0) + tableY(5)) / 2, 4.72, rowPitch * 6 + 0.04, C.cyan)),
    ...say('6 ROWS · 7 DAYS'), ...fbox(['Notebook rows = 6', 'Days in a week = 7']));
  await until(S(11));
  await play(...focus(card(CX, (tableY(1) + tableY(2)) / 2, 4.72, rowPitch * 2, C.violet)),
    ...say('WEDNESDAY HAS NO ROW', C.violet),
    ...fbox([['Tue → Thu', C.violet], 'Cashier forgot to log Wed'], C.violet));
  await until(S(12));
  await play(...focus(card(CX, tableY(2), 4.72, rowPitch * 0.91, C.amber)),
    ...say('THURSDAY IS RECORDED', C.amber),
    ...fbox([['Thu = 0 loaves', C.amber], 'Closed for a public holiday'], C.amber));
  await until(S(13));
  await play(...focus(), ...say('TWO DIFFERENT MEANINGS'),
    ...fbox([['Wed: no row', C.violet], ['Thu: a row with 0', C.amber]]));
  await until(S(14));
  await play(...focus(card(CX + 1.5, tableY(2), 0.86, rowPitch * 0.9, C.amber)),
    ...say('THURSDAY: KNOWN ZERO', C.amber),
    ...fbox([['Thu = 0 loaves', C.amber], 'Nothing was sold'], C.amber));
  await until(S(15));
  await play(...focus(), ...say('WEDNESDAY: UNKNOWN', C.violet),
    ...fbox([['Wed: sales unknown', C.violet], 'Bakery open, loaves sold'], C.violet));

  // 16–24: compare row spacing with date spacing on the same scale.
  const axes = new M.VGroup(
    textAt('Loaves sold', 18, C.muted, CX, TOP + 0.29, false),
    ...[0, 30, 60, 90].flatMap(value => [
      line(LEFT, yFor(value), RIGHT, yFor(value), value === 0 ? C.muted : C.line),
      textAt(String(value), 16, C.muted, LEFT - 0.3, yFor(value))
    ])
  );

  function series(values, xFor, withNumbers = true) {
    const segments = [];
    const marks = [];
    values.forEach((value, i) => {
      if (value === null) return;
      const x = xFor(i);
      const y = yFor(value);
      const color = value === 0 ? C.amber : C.cyan;
      const glow = new M.Dot({ point: [x, y, 0], radius: 0.18, color });
      glow.setFill(color, 0.16);
      const dot = new M.Dot({ point: [x, y, 0], radius: withNumbers ? 0.09 : 0.055, color });
      marks.push(glow, dot);
      if (withNumbers) marks.push(textAt(String(value), 18, color, x, y + 0.28));
      if (i > 0 && values[i - 1] !== null) {
        segments.push(line(xFor(i - 1), yFor(values[i - 1]), x, y, C.cyan));
      }
    });
    return new M.VGroup(...segments, ...marks);
  }

  const packedDays = new M.VGroup(...recorded.map(({ day }, j) =>
    textAt(day, 18, C.ink, rowX(j), dayY)));
  const packed = series(recorded.map(row => row.value), rowX);
  const dates = new M.VGroup(...DAYS.map((day, i) =>
    textAt(day, 18, i === 2 ? C.violet : C.ink, slotX(i), dayY)));
  const indexed = series(SALES, slotX);
  const calendar = new M.VGroup(...DAYS.map((_, i) =>
    card(slotX(i), dayY, SP - 0.07, 0.45, i === 2 ? C.violet : C.muted)));
  const gap = () => card(slotX(2), (BASE + TOP) / 2, SP - 0.08, TOP - BASE + 0.28, C.violet);
  const zero = () => new M.Circle({ radius: 0.21, color: C.amber, strokeWidth: 2 })
    .moveTo([slotX(3), BASE, 0]);

  await until(S(16));
  await play(out(table), out(ruled), ...rows.map(out), ...fbox(), fade(axes), fade(packedDays), fade(packed),
    ...say('HIGHER DOT = MORE LOAVES'));
  await until(S(17));
  await play(...focus(card((rowX(1) + rowX(2)) / 2, dayY, 2 * SP - 0.05, 0.41, C.amber)),
    ...say('TUE AND THU LOOK ADJACENT', C.amber));
  await until(S(18));
  await play(...focus(), ...say('ROW SPACING HIDES WEDNESDAY', C.violet),
    ...fbox(['6 dots in 6 positions', ['Wednesday has no place', C.violet]], C.violet));
  await until(S(19));
  await play(out(packed), out(packedDays), fade(dates), ...fbox(), ...say('ONE SLOT FOR EVERY DATE'));
  await until(S(20));
  await play(fade(indexed), ...say('PUT EACH NUMBER ON ITS DATE'));
  await until(S(21));
  await play(...focus(gap()), ...say('WEDNESDAY: A VISIBLE GAP', C.violet));
  await until(S(22));
  await play(...focus(zero()), ...say('THURSDAY: A DOT AT ZERO', C.amber));
  await until(S(23));
  await play(...focus(), ...say('TIME INDEX = THE FULL DATE LIST'),
    ...fbox(['Mon Tue Wed Thu', 'Fri Sat Sun', 'One slot per day']));
  await until(S(24));
  await play(draw(calendar), ...say('A CALENDAR HAS EVERY DAY'));

  // 25–31: add only recorded numbers and keep the unknown date visible.
  const terms = recorded.map(row => row.value).join(' + ');
  await until(S(25));
  await play(...say('HOW MANY LOAVES THIS WEEK?', C.amber),
    ...fbox(['Add the recorded sales'], C.amber));
  await until(S(26));
  await play(...say('RECORDED TOTAL: 260 LOAVES', C.amber),
    ...fbox([terms, [`Recorded total = ${total}`, C.amber]], C.amber));
  await until(S(27));
  await play(...focus(gap()), ...say('ADD WEDNESDAY TO GET THE WEEK', C.violet),
    ...fbox(['Week total =', [`${total} + Wednesday’s sales`, C.violet]], C.violet));
  await until(S(28));
  await play(...say('THE EXACT WEEK TOTAL IS UNKNOWN', C.violet),
    ...fbox([`Recorded total = ${total}`, ['Week total = unknown', C.violet]], C.violet));
  await until(S(29));
  await play(...focus(), ...fbox(), ...say('EVEN SPACING: ONE SLOT PER DAY'),
    new M.Indicate(calendar, { color: C.cyan, runTime: 0.9 }));
  await until(S(30));
  await play(...say('READ THE SLOTS AND THE DOTS'),
    ...fbox([['Cyan dot: recorded sales', C.cyan], ['Wed gap: missing', C.violet], ['Thu dot: known zero', C.amber]]));
  await until(S(31));
  const nextY = dayY - (P ? 0.55 : 0.5);
  const weekJump = new M.VGroup(
    card(slotX(3), dayY, SP - 0.07, 0.45, C.cyan),
    line(slotX(3), dayY - 0.23, slotX(3), nextY, C.cyan, 2.5),
    line(slotX(3), nextY, RIGHT + 0.25, nextY, C.cyan, 2.5),
    line(RIGHT + 0.25, nextY, RIGHT + 0.1, nextY + 0.1, C.cyan, 2.5),
    line(RIGHT + 0.25, nextY, RIGHT + 0.1, nextY - 0.1, C.cyan, 2.5),
    textAt('+7 days: next Thu', P ? 17 : 16, C.cyan, (slotX(3) + RIGHT) / 2 + 0.1, nextY - 0.25, false)
  );
  await play(...focus(weekJump), ...say('COMPARE THE SAME DAY EACH WEEK'),
    ...fbox(['Thu this week', ['Thu 7 days later', C.cyan]]));

  // 32–36: try a false zero, see its effect, then restore the gap.
  const falseDot = new M.VGroup(
    new M.Circle({ radius: 0.11, color: C.pink, strokeWidth: 3 }).moveTo([slotX(2), BASE, 0]),
    textAt('0', 18, C.pink, slotX(2), BASE + 0.3)
  );
  const fakeLinks = new M.VGroup(
    new M.DashedLine({ start: [slotX(1), yFor(SALES[1]), 0], end: [slotX(2), BASE, 0], color: C.pink }),
    new M.DashedLine({ start: [slotX(2), BASE, 0], end: [slotX(3), BASE, 0], color: C.pink })
  );

  await until(S(32));
  await play(...focus(), fade(falseDot), ...say('WHAT IF WE FILL THE GAP WITH 0?', C.pink),
    ...fbox([['Wed = 0?', C.pink]], C.pink));
  await until(S(33));
  await play(fade(fakeLinks), ...say('THAT ZERO IS MADE UP', C.pink),
    ...fbox([['Wed: pretend zero', C.pink], 'The bakery sold loaves'], C.pink));
  await until(S(34));
  await play(...say('THE FALSE ZERO LOWERS THE TOTAL', C.pink),
    ...fbox([['False zero: 260', C.pink], 'Actual:', '260 + Wed sales'], C.pink));
  await until(S(35));
  await play(...say('THE FALSE ZERO LOWERS THE AVERAGE', C.pink),
    ...fbox([['False zero: 260 ÷ 7', C.pink], 'Actual:', '(260 + Wed) ÷ 7'], C.pink));
  await until(S(36));
  await play(out(falseDot), out(fakeLinks), ...focus(gap()), ...say('A GAP AND A ZERO MEAN DIFFERENT THINGS'),
    ...fbox([['Wed gap = unknown', C.violet], ['Thu dot = 0 loaves', C.amber]]));

  // 37–38: preview the four spring weeks, then return to the winter index.
  const spring = [
    37, 39, 43, 52, 54, 67, 58,
    44, 44, 52, 56, 63, 75, 65,
    51, 53, 58, 63, 71, 80, 72,
    58, 58, 65, 71, 78, 88, 79
  ];
  const springX = i => LEFT + 0.08 + i * (RIGHT - LEFT - 0.16) / (spring.length - 1);
  const springPlot = series(spring, springX, false);
  const weeks = new M.VGroup(...[1, 2, 3, 4].map((week, i) =>
    textAt(`Week ${week}`, 17, C.ink, springX(i * 7 + 3), dayY)));

  await until(S(37));
  await play(out(indexed), out(dates), out(calendar), ...focus(), fade(springPlot), fade(weeks),
    ...say('ARE SALES SLOWLY GOING UP OR DOWN?'), ...fbox(['Four spring weeks']));
  await until(S(38));
  await play(out(springPlot), out(weeks), fade(series(SALES, slotX)), fade(dates), fade(calendar),
    ...focus(gap()), ...say('GIVE EVERY DATE ITS OWN SLOT'),
    ...fbox([['Empty slot = unknown', C.violet], ['Dot at 0 = no sales', C.amber]]));
}
