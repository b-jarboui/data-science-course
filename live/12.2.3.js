// 12.2.3 Ordinal encoding. Beat i follows sentence i (zero-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, until, play } = L;
  const grades = ['Poor', 'Fair', 'Good', 'Excellent'];
  const colors = { Poor: C.pink, Fair: C.amber, Good: C.cyan, Excellent: C.green };
  const bikes = [
    { grade: 'Excellent', price: 700 }, { grade: 'Good', price: 400 },
    { grade: 'Good', price: 300 }, { grade: 'Good', price: 500 },
    { grade: 'Fair', price: 200 }, { grade: 'Poor', price: 200 },
    { grade: 'Good', price: 600 }, { grade: 'Fair', price: 300 },
  ];
  const byGrade = grades.map(grade => bikes.filter(bike => bike.grade === grade));
  const totals = byGrade.map(group => group.reduce((sum, bike) => sum + bike.price, 0));
  const means = totals.map((total, i) => total / byGrade[i].length);
  const alphabetical = ['Excellent', 'Fair', 'Good', 'Poor'];
  const code = grade => grades.indexOf(grade) + 1;
  const money = value => `$${value.toLocaleString('en-US')}`;

  const CX = P ? 0 : -2.6;
  const PILL = [CX, P ? 2.25 : 1.85, 0];
  const BOXP = P ? [0, 3.5, 0] : [4.3, -0.3, 0];
  const BASE = P ? -4.2 : -2.35;
  const layers = new Map();
  const point = (x, y) => [x, y, 0];
  const group = (...items) => new M.VGroup(...items);
  const fadeIn = item => new M.FadeIn(item, { runTime: 0.3 });
  const fadeOut = item => new M.FadeOut(item, { runTime: 0.3 });

  function put(key, item) {
    const previous = layers.get(key);
    layers.set(key, item);
    if (!previous) return fadeIn(item);
    return new M.LaggedStart([fadeOut(previous), fadeIn(item)], { lagRatio: 1, runTime: 0.6 });
  }

  function drop(...keys) {
    const animations = [];
    for (const key of keys) {
      if (!layers.has(key)) continue;
      animations.push(fadeOut(layers.get(key)));
      layers.delete(key);
    }
    return animations;
  }

  function showAll(entries) {
    return new M.LaggedStart(entries.map(([key, item]) => put(key, item)),
      { lagRatio: 0.18, runTime: 0.75 });
  }

  function say(text, color = C.cyan) {
    return put('pill', pill(text, color, 18).moveTo(PILL));
  }

  function label(text, x, y, { color = C.ink, size = 22, width = 7, mono = false } = {}) {
    const item = T(String(text), size, color, mono);
    if (item.getWidth() > width) item.scale(width / item.getWidth());
    return item.moveTo(point(x, y));
  }

  function rect(x, y, width, height, color, fill = C.card, opacity = 0.94) {
    const item = new M.RoundedRectangle({ width, height, cornerRadius: 0.12, color, strokeWidth: 2 });
    item.setFill(fill, opacity);
    return item.moveTo(point(x, y));
  }

  function line(x0, y0, x1, y1, color = C.muted, strokeWidth = 2) {
    return new M.Line({ start: point(x0, y0), end: point(x1, y1), color, strokeWidth });
  }

  function side(lines) {
    const pitch = P ? 0.34 : 0.54;
    return group(...lines.map((row, i) => {
      const [text, color = C.ink] = Array.isArray(row) ? row : [row];
      return label(text, BOXP[0], BOXP[1] + ((lines.length - 1) / 2 - i) * pitch,
        { color, size: P ? 20 : 22, width: P ? 7 : 4.4 });
    }));
  }

  function fbox(lines) {
    const pitch = P ? 0.37 : 0.48;
    const maxWidth = P ? FW - 1.2 : 4.6;
    const texts = lines.map((text, i) => label(text, BOXP[0],
      BOXP[1] + ((lines.length - 1) / 2 - i) * pitch,
      { color: i === 0 ? C.cyan : C.ink, size: P ? 20 : 21, width: maxWidth - 0.48, mono: true }));
    const width = Math.min(maxWidth, Math.max(...texts.map(item => item.getWidth())) + 0.48);
    return put('formula', group(rect(BOXP[0], BOXP[1], width, lines.length * pitch + 0.26, C.cyan), ...texts));
  }

  function bikePicture() {
    const x = CX;
    const y = P ? -0.5 : -0.65;
    const wheels = [-1.28, 1.28].map(dx =>
      new M.Circle({ radius: 0.72, color: C.cyan, strokeWidth: 3 }).moveTo(point(x + dx, y)));
    return group(...wheels,
      line(x - 1.28, y, x - 0.66, y + 0.86, C.ink, 4),
      line(x - 0.66, y + 0.86, x + 0.75, y + 0.86, C.ink, 4),
      line(x + 0.75, y + 0.86, x - 0.14, y, C.ink, 4),
      line(x - 0.14, y, x - 1.28, y, C.ink, 4),
      line(x - 0.14, y, x - 0.66, y + 0.86, C.ink, 4),
      line(x + 1.28, y, x + 0.61, y + 1.28, C.ink, 4),
      line(x + 0.61, y + 1.28, x + 0.26, y + 1.28, C.ink, 4),
      line(x - 0.96, y + 0.89, x - 0.57, y + 0.89, C.ink, 4));
  }

  const cardPos = i => [
    CX + (i % (P ? 2 : 4) - (P ? 0.5 : 1.5)) * (P ? 3.28 : 1.8),
    (P ? 1.1 : 0.48) - Math.floor(i / (P ? 2 : 4)) * (P ? 1.48 : 1.72),
  ];
  const cardWidth = P ? 3.05 : 1.65;
  const cardHeight = P ? 1.34 : 1.48;

  function cardShell(i) {
    const [x, y] = cardPos(i);
    return group(rect(x, y, cardWidth, cardHeight, C.line),
      label(`Bike ${i + 1}`, x, y + 0.4, { color: C.muted, size: 18 }));
  }

  function revealBikes(grade) {
    return showAll(bikes.flatMap((bike, i) => {
      if (bike.grade !== grade) return [];
      const [x, y] = cardPos(i);
      return [[`detail${i}`, group(
        rect(x, y, cardWidth, cardHeight, colors[grade], C.card, 0),
        label(grade, x, y, { color: colors[grade], width: cardWidth - 0.17, size: P ? 23 : 20 }),
        label(money(bike.price), x, y - 0.38, { size: 20, mono: true }),
      )]];
    }));
  }

  function meanWork(i) {
    const prices = byGrade[i].map(bike => bike.price);
    return side([
      [grades[i], colors[grades[i]]],
      prices.length === 1 ? '1 bike' : prices.map(money).join(' + '),
      [`${money(totals[i])} ÷ ${prices.length} = ${money(means[i])}`, C.amber],
    ]);
  }

  const plotX = i => CX + (i - 1.5) * (P ? 1.48 : 1.72);
  const plotY = price => BASE + 0.35 + price / 800 * (P ? 5.25 : 2.96);
  const plotLeft = plotX(0) - 0.54;
  const plotRight = plotX(3) + 0.49;

  function axes(order, numbered) {
    const items = [label('Mean price', CX, P ? 1.84 : 1.36, { size: 19 })];
    for (let price = 0; price <= 800; price += 200) {
      const y = plotY(price);
      items.push(line(plotLeft, y, plotRight, y, price ? C.line : C.muted),
        label(money(price), plotLeft - 0.36, y, { color: C.ink, size: P ? 17 : 18, width: 0.67, mono: true }));
    }
    items.push(line(plotLeft, plotY(0), plotLeft, plotY(800)));
    order.forEach((grade, i) => {
      items.push(label(grade, plotX(i), plotY(0) - 0.24,
        { color: colors[grade], size: P ? 19 : 20, width: P ? 1.46 : 1.7 }));
      if (numbered) items.push(label(String(i + 1), plotX(i), plotY(0) - 0.57,
        { color: C.ink, size: 18, mono: true }));
    });
    return group(...items);
  }

  function priceDot(grade, i) {
    const price = means[grades.indexOf(grade)];
    const x = plotX(i), y = plotY(price), color = colors[grade];
    const halo = new M.Dot({ point: point(x, y), radius: 0.22, color });
    halo.setFill(color, 0.17);
    return group(halo, new M.Dot({ point: point(x, y), radius: 0.10, color }),
      label(money(price), x, y + 0.27, { color, size: 19, mono: true }));
  }

  function trace(order, style) {
    return order.slice(1).flatMap((grade, k) => {
      const x0 = plotX(k), x1 = plotX(k + 1);
      const y0 = plotY(means[grades.indexOf(order[k])]), y1 = plotY(means[grades.indexOf(grade)]);
      if (style !== 'stairs') return [line(x0, y0, x1, y1, C.violet)];
      const mid = (x0 + x1) / 2;
      return [line(x0, y0, mid, y0, C.violet, 3), line(mid, y0, mid, y1, C.violet, 3),
        line(mid, y1, x1, y1, C.violet, 3)];
    });
  }

  function chart(order, { numbered = false, style, prediction = false } = {}) {
    const items = [axes(order, numbered)];
    if (style) items.push(...trace(order, style));
    if (prediction) items.push(new M.DashedLine({
      start: point(plotX(0), plotY(means[0])), end: point(plotX(3), plotY(means[3])), color: C.amber,
    }));
    items.push(...order.map(priceDot));
    return group(...items);
  }

  function priceGap(i, bracket = true) {
    const x = (plotX(i) + plotX(i + 1)) / 2;
    const low = plotY(means[i]), high = plotY(means[i + 1]);
    const caption = label(`+${money(means[i + 1] - means[i])}`, x, plotY(0) - 0.84,
      { color: C.amber, size: 18, mono: true });
    if (!bracket) return caption;
    return group(line(x, low, x, high, C.amber),
      line(x - 0.1, low, x + 0.1, low, C.amber),
      line(x - 0.1, high, x + 0.1, high, C.amber), caption);
  }

  const stepX = i => CX + (i - 1.5) * (P ? 1.64 : 1.86);
  const stepBase = P ? -3.62 : -2.02;
  const stepHeight = i => 0.56 + i * (P ? 0.86 : 0.69);

  function staircase() {
    return group(...grades.map((grade, i) => {
      const width = P ? 1.55 : 1.75;
      const height = stepHeight(i);
      const step = new M.Rectangle({ width, height, color: colors[grade], strokeWidth: 2 });
      step.setFill(colors[grade], 0.22);
      return step.moveTo(point(stepX(i), stepBase + height / 2));
    }));
  }

  function stairLabels() {
    return group(...grades.map((grade, i) => label(grade, stepX(i), stepBase - 0.33,
      { color: colors[grade], width: P ? 1.56 : 1.73 })));
  }

  function stairCodes() {
    return group(...grades.map((grade, i) => label(code(grade), stepX(i), stepBase + stepHeight(i) + 0.28,
      { color: colors[grade], size: 28, mono: true })));
  }

  function columnTable(headers, rows, offsets, { small = false } = {}) {
    const step = P ? 0.7 : 0.64;
    const headerY = P ? 1.18 : 1.13;
    const width = P ? (small ? 1.17 : 2.45) : (small ? 1.32 : 2.55);
    const texts = headers.map((name, i) => label(name, CX + offsets[i], headerY,
      { color: C.cyan, size: small ? 17 : 20, width }));
    const left = CX + offsets[0] - width / 2;
    const right = CX + offsets[offsets.length - 1] + width / 2;
    texts.push(line(left, headerY - 0.26, right, headerY - 0.26, C.line));
    rows.forEach((row, r) => row.forEach((value, i) => {
      const color = colors[value] || (typeof value === 'number' ? (value ? C.green : C.muted) : C.ink);
      texts.push(label(value, CX + offsets[i], headerY - (r + 1) * step,
        { color, width, mono: typeof value === 'number' }));
    }));
    return group(...texts);
  }

  function brandSwitches() {
    return columnTable(['Bike', 'Falcon', 'Ridge', 'Swift'],
      [['1', 1, 0, 0], ['2', 0, 1, 0], ['3', 0, 0, 1]], [-2.55, -0.85, 0.85, 2.55], { small: true });
  }

  function gradeSwitches() {
    return columnTable(['Bike', ...grades], [['1', 0, 0, 0, 1], ['6', 1, 0, 0, 0]],
      [-2.84, -1.42, 0, 1.42, 2.84], { small: true });
  }

  const tableX = [CX - 2.25, CX - 0.37, CX + 2.12];
  const rowY = i => (P ? 0.81 : 0.76) - i * (P ? 0.55 : 0.42);

  function encodingTable() {
    const y = P ? 1.47 : 1.29;
    const items = ['Bike', 'Condition', 'Code'].map((text, i) =>
      label(text, tableX[i], y, { color: C.cyan, size: 21 }));
    items.push(line(CX - 2.9, y - 0.23, CX + 2.88, y - 0.23, C.line));
    bikes.forEach((bike, i) => {
      items.push(label(i + 1, tableX[0], rowY(i), { color: C.muted, size: 20, mono: true }),
        label(bike.grade, tableX[1], rowY(i), { color: colors[bike.grade], size: 21 }));
    });
    return group(...items);
  }

  function encodeRows(indices) {
    return showAll(indices.map(i => {
      const grade = bikes[i].grade;
      return [`code${i}`, label(code(grade), tableX[2], rowY(i),
        { color: colors[grade], size: 23, mono: true })];
    }));
  }

  function gradeRow(order, numbered = false) {
    return group(...order.flatMap((grade, i) => {
      const x = stepX(i);
      const items = [rect(x, -0.42, P ? 1.54 : 1.72, 1.22, colors[grade]),
        label(grade, x, -0.19, { color: colors[grade], size: 19, width: P ? 1.43 : 1.58 })];
      if (numbered) items.push(label(i + 1, x, -0.69, { size: 25, mono: true }));
      return items;
    }));
  }

  function equalSteps() {
    const y = P ? -0.54 : -0.34;
    return group(line(stepX(0), y, stepX(3), y, C.violet),
      ...grades.flatMap((grade, i) => {
        const x = stepX(i);
        const dot = new M.Dot({ point: point(x, y), radius: 0.11, color: colors[grade] });
        const items = [dot, label(i + 1, x, y - 0.42, { size: 25, mono: true }),
          label(grade, x, y - 0.84, { color: colors[grade], size: 19, width: 1.5 })];
        if (i < 3) items.push(label('+1', (x + stepX(i + 1)) / 2, y + 0.32, { color: C.amber, mono: true }));
        return items;
      }));
  }

  // 0–8: the listing, then last year's eight sold bikes.
  await until(S(0));
  await play(put('bike', bikePicture()), say('SELLING YOUR OLD BIKE'));

  await until(S(1));
  await play(put('side', side([['Condition', C.cyan], 'Poor · Fair · Good · Excellent'])),
    say('PICK A CONDITION'));

  await until(S(2));
  await play(put('side', side([['Better condition', C.green], '↓', ['Higher price?', C.amber]])),
    say('CAN CONDITION HELP PREDICT PRICE?', C.amber));

  await until(S(3));
  await play(...drop('bike', 'side'), say('8 TRAINING BIKES'),
    showAll(bikes.map((_, i) => [`card${i}`, cardShell(i)])));

  await until(S(4));
  await play(put('side', side([['Condition', C.cyan], ['Sold price', C.amber]])), say('WHAT EACH CARD SHOWS'));

  await until(S(5));
  await play(revealBikes('Poor'), say('POOR', C.pink));

  await until(S(6));
  await play(revealBikes('Fair'), say('FAIR', C.amber));

  await until(S(7));
  await play(revealBikes('Good'), say('GOOD', C.cyan));

  await until(S(8));
  await play(revealBikes('Excellent'), say('EXCELLENT', C.green));

  // 9–14: one mean per grade, in condition order.
  await until(S(9));
  await play(...drop(...bikes.flatMap((_, i) => [`card${i}`, `detail${i}`])),
    put('axes', axes(grades, false)), put('side', side(['Add the prices', 'Share the total equally'])),
    say('MEAN = ONE FAIR SHARE', C.amber));

  for (let i = 0; i < grades.length; i++) {
    await until(S(10 + i));
    const grade = grades[i];
    await play(put(`dot${i}`, priceDot(grade, i)), put('side', meanWork(i)),
      say(`${grade.toUpperCase()} MEAN`, colors[grade]));
  }

  await until(S(14));
  await play(...drop('side'), put('trace', group(...trace(grades, 'line'))),
    say('THE TYPICAL PRICE CLIMBS', C.green));

  // 15–26: switches for brands and steps for grades.
  await until(S(15));
  await play(...drop('axes', 'trace', ...grades.map((_, i) => `dot${i}`)),
    put('main', group(
      rect(CX - 2.26, -0.45, 1.74, 0.9, C.cyan), label('Numbers', CX - 2.26, -0.45),
      line(CX - 1.36, -0.45, CX - 0.87, -0.45),
      rect(CX, -0.45, 1.74, 0.9, C.violet), label('Model', CX, -0.45),
      line(CX + 0.89, -0.45, CX + 1.35, -0.45),
      rect(CX + 2.32, -0.45, 1.88, 0.9, C.amber), label('Price guess', CX + 2.32, -0.45, { width: 1.7 }),
    )), say('A MODEL READS NUMBERS'));

  await until(S(16));
  await play(put('main', brandSwitches()), say('ONE YES-OR-NO COLUMN PER BRAND'),
    put('side', side([['One-hot encoding', C.violet], '1 = yes   ·   0 = no'])));

  await until(S(17));
  await play(put('side', side(['Falcon · Ridge · Swift', ['No brand comes first', C.amber]])),
    say('BRANDS HAVE NO ORDER', C.amber));

  await until(S(18));
  await play(...drop('side'), put('main', staircase()), say('GRADES ARE LIKE STAIRS'));

  await until(S(19));
  await play(put('stairs-labels', stairLabels()), say('WORST TO BEST', C.green));

  await until(S(20));
  await play(put('side', side([['Four separate switches', C.amber], 'Poor  □    Fair  □', 'Good  □    Excellent  □'])),
    say('SWITCHES LEAVE OUT THE ORDER', C.amber));

  await until(S(21));
  await play(put('side', side([['Each grade has a step', C.cyan], 'Step number → grade code'])),
    say('USE THE STEP NUMBER'));

  await until(S(22));
  await play(...drop('side'), put('stairs-codes', stairCodes()), say('COUNT FROM THE BOTTOM'));

  await until(S(23));
  await play(put('side', side([['Bigger code', C.cyan], ['Better condition', C.green]])),
    say('HIGHER STEP, BETTER CONDITION', C.green));

  await until(S(24));
  await play(put('side', side([['Brand or condition', C.cyan], 'A label for a group'])),
    say('CATEGORY = GROUP LABEL'));

  await until(S(25));
  await play(put('side', side([['Ordinal', C.violet], 'The groups have an order'])),
    say('ORDINAL CATEGORY', C.violet));

  await until(S(26));
  await play(put('side', side([['Ordered grades', C.violet], '↓', ['Numbers in the same order', C.green]])),
    say('ORDINAL ENCODING', C.violet));

  // 27–38: fill the code column in bike order and summarize the rule.
  await until(S(27));
  await play(...drop('side', 'stairs-labels', 'stairs-codes'), put('main', encodingTable()),
    say('ENCODE ALL 8 BIKES'));

  await until(S(28));
  await play(encodeRows([0]), say('EXCELLENT → 4', C.green));

  await until(S(29));
  await play(encodeRows([1, 2, 3]), say('GOOD → 3', C.cyan));

  await until(S(30));
  await play(encodeRows([4]), say('FAIR → 2', C.amber));

  await until(S(31));
  await play(encodeRows([5]), say('POOR → 1', C.pink));

  await until(S(32));
  await play(encodeRows([6]), say('GOOD → 3', C.cyan));

  await until(S(33));
  await play(encodeRows([7]), say('FAIR → 2', C.amber));

  await until(S(34));
  await play(put('outline', rect(tableX[2], (rowY(0) + rowY(7)) / 2, 0.83,
    rowY(0) - rowY(7) + 0.44, C.cyan, C.card, 0)), say('READ DOWN THE CODE COLUMN'));

  await until(S(35));
  await play(put('side', side(['4 switch columns → 1 code column', ['Larger code = better condition', C.green]])),
    say('ONE COLUMN KEEPS THE ORDER'));

  await until(S(36));
  await play(...drop('side'), fbox(['Grade → code']), say('THE RULE IN ONE BOX'));

  await until(S(37));
  await play(fbox(['Code = position in the order', 'Count from the worst grade']),
    say('START AT THE WORST GRADE'));

  await until(S(38));
  await play(fbox(['Code = position from the worst', 'Poor 1   Fair 2   Good 3   Excellent 4']),
    say('THE CONDITION CODES'));

  // 39–47: fix the semantic order before training, then show the dictionary-order trap.
  await until(S(39));
  await play(...drop('formula', 'outline', ...bikes.map((_, i) => `code${i}`)),
    put('main', gradeRow(grades, true)), say('USE THE MEANING OF THE GRADES', C.green));

  await until(S(40));
  await play(put('side', side([['One order, fixed before training', C.amber], 'Old bike 1: Excellent → 4',
    'New bike N2: Excellent → 4'])), say('SAME RULE FOR OLD AND NEW BIKES'));

  await until(S(41));
  await play(...drop('side'), put('main', columnTable(['Sizes', 'Grades', 'Levels'],
    [['Small', 'Poor', 'Beginner'], ['Medium', 'Fair', 'Intermediate'],
      ['Large', 'Good', 'Advanced'], ['', 'Excellent', '']].map(row => row.map(value => value || ' ')),
    [-2.43, 0, 2.43])), say('USE LABELS WITH A NATURAL ORDER'));

  await until(S(42));
  await play(put('main', group(
    rect(CX - 1.45, -0.5, 1.9, 1.02, C.amber), label('Fair · 2', CX - 1.45, -0.5, { color: C.amber }),
    rect(CX + 1.45, -0.5, 1.9, 1.02, C.cyan), label('Good · 3', CX + 1.45, -0.5, { color: C.cyan }),
    label('<', CX, -0.5, { size: 28, mono: true }),
  )), say('WHICH IS BETTER OR BIGGER?'));

  await until(S(43));
  const abc = () => label('A  →  B  →  C  →  …', CX, 0.95, { size: 30, color: C.amber, mono: true });
  await play(put('main', group(abc(), gradeRow(grades))),
    say('THE DICTIONARY-ORDER TRAP', C.amber));

  await until(S(44));
  await play(put('main', group(abc(), gradeRow(alphabetical))), say('SORTED BY THE FIRST LETTER', C.amber));

  await until(S(45));
  await play(put('main', group(abc(), gradeRow(alphabetical, true))), say('EXCELLENT 1, POOR 4', C.amber));

  await until(S(46));
  await play(put('endpoints', group(
    label('Best grade', stepX(0), -1.42, { color: C.green, width: 1.53 }),
    label('Worst grade', stepX(3), -1.42, { color: C.pink, width: 1.53 }))),
    say('BEST AND WORST SWAP PLACES', C.amber));

  await until(S(47));
  await play(...drop('endpoints'), put('main', chart(alphabetical, { numbered: true, style: 'line' })),
    say('THE PRICE DOTS STOP CLIMBING', C.pink));

  // 48–56: compare equal code steps with the actual price gaps.
  await until(S(48));
  await play(put('main', equalSteps()), say('EACH CODE STEP IS +1', C.violet));

  await until(S(49));
  await play(put('main', chart(grades, { numbered: true })), say('LOOK AT THE MEAN PRICES'));

  for (let i = 0; i < 3; i++) {
    await until(S(50 + i));
    await play(put(`gap${i}`, priceGap(i)),
      say(`${grades[i].toUpperCase()} → ${grades[i + 1].toUpperCase()}`, C.amber));
  }

  await until(S(53));
  await play(put('main', chart(grades, { numbered: true, style: 'stairs' })),
    ...[0, 1, 2].map(i => put(`gap${i}`, priceGap(i, false))),
    say('THE PRICE STEPS HAVE DIFFERENT HEIGHTS', C.amber));

  await until(S(54));
  await play(put('side', side([['Code steps  +1  +1  +1', C.cyan],
    ['Price rises  +$50  +$200  +$250', C.amber]])), say('THE CODES KEEP THE ORDER', C.green));

  await until(S(55));
  await play(put('main', chart(grades, { numbered: true, prediction: true })),
    ...drop('gap0', 'gap1', 'gap2'), put('side', side([['Dashed line', C.amber], 'Equal-step price prediction'])),
    say('A MODEL CAN ASSUME EQUAL STEPS', C.amber));

  await until(S(56));
  await play(put('main', gradeSwitches()), put('side', side(['Try switches for the grades', 'Compare the price predictions'])),
    say('ALSO TRY ONE-HOT ENCODING', C.violet));

  // 57–59: preview Try it and bring back the natural order.
  await until(S(57));
  await play(put('main', chart(grades, { numbered: true, style: 'line' })),
    put('side', side([['Drag to reorder the grades', C.cyan], 'Watch the codes and the price dots'])),
    say('TRY IT'));

  await until(S(58));
  await play(put('main', chart(alphabetical, { numbered: true, style: 'line' })),
    put('side', side([['Alphabetical order', C.amber], 'Excellent · Fair · Good · Poor'])),
    say('WATCH THE CLIMB BREAK', C.amber));

  await until(S(59));
  await play(put('main', chart(grades, { numbered: true, style: 'stairs' })),
    put('side', side([['Code steps  +1  +1  +1', C.cyan], ['Price rises  +$50  +$200  +$250', C.amber]])),
    say('ORDINAL ENCODING KEEPS THE ORDER', C.green));
}
