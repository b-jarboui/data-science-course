// 12.3.3 Learning curves. Beat i follows sentence i (zero-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const sizes = [6, 12, 24, 48];
  const prices = [10, 6, 8, 7, 3, 5];
  const predictions = [9, 8, 7, 6, 5, 4];
  const misses = [1, -2, 1, 1, -2, 1];
  const squared = [1, 4, 1, 1, 4, 1];
  const bendy = { color: C.pink, train: [0, 0.2, 0.4, 0.6], validation: [5, 3.4, 2.2, 1.4] };
  // n = 6 is our own six bikes: training 2.0 (12.3.1), validation 3.8 (cross-validation, 12.3.4).
  const stiff = { color: C.amber, train: [2, 2, 2, 2.1], validation: [3.8, 2.3, 2.2, 2.1] };

  const CX = P ? 0 : -2.6;
  const BASE = P ? -4.2 : -2.35;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const n1 = n => n.toFixed(1);
  const say = (text, color = C.cyan) => showA(text, color, PILL, P ? 17 : 18);
  const label = (text, x, y, size = 20, color = C.ink, mono = false) =>
    T(text, size, color, mono).moveTo([x, y, 0]);
  const edge = (x1, y1, x2, y2, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth });
  const dash = (x1, y1, x2, y2, color) =>
    new M.DashedLine({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth: 2 });
  const fade = object => new M.FadeIn(object, { runTime: 0.32 });
  const remove = object => new M.FadeOut(object, { runTime: 0.27 });
  const create = object => new M.Create(object, { runTime: 0.55 });
  const lag = (animations, runTime = 0.9) =>
    new M.LaggedStart(animations, { lagRatio: 0.14, runTime });

  function block(x, y, width, height, color, opacity = 0.8) {
    const rect = new M.Rectangle({ width, height, color, strokeWidth: 1.5 });
    rect.setFill(color, opacity);
    return rect.moveTo([x, y, 0]);
  }

  function bike(x, y, cargo = false, color = C.cyan, size = 0.11) {
    if (cargo) return block(x, y, size * 1.75, size * 1.75, color);
    return new M.Dot({ point: [x, y, 0], radius: size, color }).setFill(color, 0.9);
  }

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 21 : 20, pitch = P ? 0.40 : 0.42;
    const rows = lines.map(line => Array.isArray(line) ? line : [line, C.ink]);
    const texts = rows.map(([text, ink]) => T(text, size, ink, true));
    const width = Math.max(...texts.map(text => text.getWidth())) + 0.60;
    const height = texts.length * pitch + 0.35;
    const border = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    border.setFill(C.card, 0.95);
    border.moveTo([0, 0, 0]);
    texts.forEach((text, i) => text.moveTo([
      (text.getWidth() - width) / 2 + 0.30, height / 2 - 0.175 - (i + 0.5) * pitch, 0
    ]));
    const next = new M.VGroup(border, ...texts);
    const maxWidth = P ? FW - 1.1 : 4.6;
    const scale = Math.min(1, maxWidth / width, 1.34 / height);
    if (scale < 1) next.scale(scale);
    next.moveTo(BOXP);
    const animations = boxNow ? [remove(boxNow), fade(next)] : [fade(next)];
    boxNow = next;
    return animations;
  }

  // Each view owns its objects throughout its time on screen.
  let view = [];
  function switchView(...objects) {
    const animations = view.map(remove);
    view = objects;
    return [...animations, ...objects.map(fade)];
  }

  function add(...objects) {
    view.push(...objects);
    return objects.map(fade);
  }

  function forget(object) {
    view = view.filter(item => item !== object);
    return remove(object);
  }

  function bikeRow(count, x, y, color, caption) {
    const columns = Math.min(count, 8);
    const rows = Math.ceil(count / columns);
    const dots = Array.from({ length: count }, (_, i) => bike(
      x + (i % columns - (columns - 1) / 2) * 0.32,
      y - Math.floor(i / columns) * 0.27,
      i % 3 === 2, color, 0.083
    ));
    return new M.VGroup(...dots, label(caption, x, y - (rows - 1) * 0.27 - 0.38, 18, color));
  }

  const fitLeft = CX - (P ? 3.10 : 3.32);
  const fitRight = CX + (P ? 3.24 : 3.50);
  const fitBase = BASE + 0.43;
  const fitTop = P ? 1.16 : 1.20;
  const ageX = age => fitLeft + 0.44 + (age - 1) / 5 * (fitRight - fitLeft - 0.74);
  const priceY = price => fitBase + (price - 2) / 9 * (fitTop - fitBase);

  function priceAxes() {
    return new M.VGroup(
      edge(fitLeft, fitBase, fitRight, fitBase), edge(fitLeft, fitBase, fitLeft, fitTop),
      label('Price ($100s)', fitLeft + 0.92, fitTop + 0.28, 17, C.muted),
      label('Age (years)', CX, BASE - 0.28, 17, C.muted),
      ...[2, 6, 10].map(value => label(String(value), fitLeft - 0.22, priceY(value), 16, C.muted, true)),
      ...prices.map((_, i) => label(String(i + 1), ageX(i + 1), fitBase - 0.23, 16, C.muted, true))
    );
  }

  function priceDots() {
    return new M.VGroup(...prices.map((value, i) => bike(ageX(i + 1), priceY(value), i === 2 || i === 5)));
  }

  function priceLine() {
    return edge(ageX(1), priceY(9), ageX(6), priceY(4), C.amber, 3);
  }

  // Interpolate the six shared prices, with a vertex at every observed age.
  function interpolatedPrice(age) {
    return prices.reduce((total, price, i) => total + price * prices.reduce(
      (product, _, j) => i === j ? product : product * (age - j - 1) / (i - j), 1
    ), 0);
  }

  function pricePath(fn, color) {
    return new M.VGroup(...Array.from({ length: 40 }, (_, i) => {
      const a = 1 + i / 8, b = 1 + (i + 1) / 8;
      return edge(ageX(a), priceY(fn(a)), ageX(b), priceY(fn(b)), color, 3);
    }));
  }

  function errorTable() {
    const left = CX - 2.78, pitch = 0.80;
    const rows = ['Bike', 'Sale', 'Guess', 'Miss', 'Miss²'];
    const values = [
      sizes.length ? prices.map((_, i) => i + 1) : [],
      prices, predictions, misses.map(n => n > 0 ? `+${n}` : String(n)), squared
    ];
    const top = P ? 0.86 : 1.0;
    const rowPitch = P ? 0.64 : 0.59;
    return new M.VGroup(...rows.flatMap((name, row) => {
      const y = top - row * rowPitch;
      const color = row === 4 ? C.amber : row === 3 ? C.pink : C.ink;
      return [
        label(name, left, y, 20, color),
        ...values[row].map((value, i) => label(String(value), left + 1.30 + i * pitch, y, 20, color, true)),
        edge(left - 0.55, y - rowPitch / 2, left + 5.62, y - rowPitch / 2, C.line)
      ];
    }));
  }

  // The sample sizes double at each tick.
  const axisLeft = CX - (P ? 3.06 : 3.46);
  const axisRight = CX + (P ? 3.44 : 3.86);
  const bottom = BASE + 0.54;
  const top = P ? 1.25 : 1.08;
  const chartX = i => axisLeft + 0.48 + i * (axisRight - axisLeft - 1.20) / 3;
  const chartY = error => bottom + (top - bottom) * error / 5;
  const floorColor = C.green;

  function curveAxes() {
    return new M.VGroup(
      ...[0, 1, 2, 3, 4, 5].flatMap(n => [
        edge(axisLeft, chartY(n), axisRight, chartY(n), n === 0 ? C.muted : C.line),
        label(String(n), axisLeft - 0.24, chartY(n), 16, C.muted, true)
      ]),
      edge(axisLeft, bottom, axisLeft, top + 0.13),
      label('Error', axisLeft + 0.32, top + 0.34, 17, C.muted),
      ...sizes.map((n, i) => label(String(n), chartX(i), bottom - 0.23, 17, C.ink, true)),
      label('Training bikes', CX, BASE - 0.20, 18, C.muted)
    );
  }

  function floorLine() {
    return dash(axisLeft, chartY(1), axisRight, chartY(1), floorColor);
  }

  function plotKey() {
    const y = top + 0.33, x = CX - (P ? 2.4 : 2.45);
    return new M.VGroup(
      edge(x, y, x + 0.37, y, C.ink),
      label('Train', x + 0.83, y, 16, C.ink),
      dash(x + 1.40, y, x + 1.83, y, C.ink),
      label('Validate', x + 2.51, y, 16, C.ink),
      edge(x + 3.25, y, x + 3.62, y, C.pink, 4),
      label('Bendy', x + 4.07, y, 16, C.pink),
      edge(x + 4.62, y, x + 4.99, y, C.amber, 4),
      label('Stiff', x + 5.37, y, 16, C.amber)
    );
  }

  function plotPoint(rule, key, i) {
    const x = chartX(i), y = chartY(rule[key][i]);
    const radius = rule === stiff ? 0.125 : 0.077;
    if (key === 'train') return bike(x, y, false, rule.color, radius * 0.64);
    const ring = new M.Circle({ radius, color: rule.color, strokeWidth: 2.5 });
    ring.setFill(rule.color, 0);
    return ring.moveTo([x, y, 0]);
  }

  function plotStep(rule, i, keys = ['train', 'validation']) {
    return new M.VGroup(...keys.flatMap(key => {
      const point = plotPoint(rule, key, i);
      if (i === 0) return [point];
      const drawLine = key === 'train' ? edge : dash;
      return [
        drawLine(chartX(i - 1), chartY(rule[key][i - 1]), chartX(i), chartY(rule[key][i]), rule.color, 3),
        point
      ];
    }));
  }

  function gapMark(i, low, high, color = C.violet, offset = 0.36) {
    const x = chartX(i) + offset, a = chartY(low), b = chartY(high);
    return new M.VGroup(edge(x, a, x, b, color, 3),
      edge(x - 0.10, a, x + 0.10, a, color),
      edge(x - 0.10, b, x + 0.10, b, color));
  }

  function focus(i, values, color = C.ink) {
    return new M.VGroup(...values.map(n => {
      const ring = new M.Circle({ radius: 0.20, color, strokeWidth: 2 });
      ring.setFill(color, 0);
      return ring.moveTo([chartX(i), chartY(n), 0]);
    }));
  }

  function fullPlot() {
    return [curveAxes(), floorLine(), plotKey(),
      ...sizes.map((_, i) => plotStep(stiff, i)), ...sizes.map((_, i) => plotStep(bendy, i))];
  }

  function sheet(x, y, count, title, color) {
    const width = 1.74, height = 1.55;
    const paper = block(x, y, width, height, color, 0.09);
    const marks = Array.from({ length: count }, (_, i) => {
      const xx = x - 0.52 + (i % 4) * 0.35, yy = y + 0.44 - Math.floor(i / 4) * 0.31;
      return block(xx, yy, 0.22, 0.15, color, 0.75);
    });
    return new M.VGroup(paper, ...marks, label(title, x, y - 1.08, 18, color));
  }

  function drawCards(many) {
    if (!many) {
      return [
        bikeRow(6, CX - 1.65, 0.25, C.cyan, 'Training bikes'),
        bikeRow(5, CX + 1.65, 0.25, C.violet, 'One kept-aside set')
      ];
    }
    return [-2.05, 0, 2.05].map((offset, i) => new M.VGroup(
      sheet(CX + offset, 0.10, 5 + i * 3, `Draw ${i + 1}`, C.cyan),
      label('· · ·', CX + offset, -1.55, 19, C.violet)
    ));
  }

  // Sale records, the two fits, and the two kinds of error.
  await until(S(0));
  {
    const cards = prices.map((p, i) => {
      const x = CX + (i % 3 - 1) * (P ? 2.1 : 1.95), y = (P ? 0.2 : 0.45) - Math.floor(i / 3) * (P ? 1.7 : 1.45);
      return new M.VGroup(block(x, y, 1.7, 1.2, C.cyan, 0.10), bike(x, y + 0.3, i === 2 || i === 5, C.cyan, 0.12),
        label(`Bike ${i + 1}`, x, y - 0.05, 18, C.ink, true), label(`$${p * 100}`, x, y - 0.38, 18, C.cyan, true));
    });
    await play(...switchView(...cards), ...say('USED-BIKE SALES'));
  }

  await until(S(1));
  await play(...switchView(bikeRow(6, CX - 1.65, 0.44, C.cyan, 'Sales you have'),
    bikeRow(24, CX + 1.65, 0.44, C.violet, 'More sales records')),
  ...fbox(['One price guess can miss.']), ...say('MORE SALES RECORDS?', C.violet));

  await until(S(2));
  await play(...fbox(['Weeks to collect', ['Will they cut the error?', C.amber]], C.amber),
    ...say('WILL MORE DATA HELP?', C.amber));

  await until(S(3));
  await play(...say('CHECK BEFORE YOU COLLECT'));

  await until(S(4));
  await play(...switchView(priceAxes(), priceLine(), priceDots()),
    ...fbox([['Stiff rule', C.amber], 'Straight yellow line'], C.amber), ...say('THE STIFF RULE', C.amber));

  await until(S(5));
  await play(...add(pricePath(interpolatedPrice, C.pink)),
    ...fbox([['Bendy rule', C.pink], 'Through all six sale dots'], C.pink), ...say('THE BENDY RULE', C.pink));

  await until(S(6));
  {
    const groups = sizes.map((count, i) => bikeRow(count,
      CX + (i % 2 ? 1.65 : -1.65), (P ? 1.17 : 1.10) - Math.floor(i / 2) * (P ? 2.35 : 1.79),
      C.cyan, `${count} bikes`));
    const outgoing = switchView();
    view.push(...groups);
    await play(...outgoing, lag(groups.map(fade), 3.1),
      ...fbox(['Fit both rules', 'at each pile size.']), ...say('GROW THE TRAINING PILE'));
  }

  await until(S(7));
  await play(...fbox([['Training error', C.cyan], ['Validation error', C.violet]]),
    ...say('TWO ERRORS FOR EACH FIT'));

  await until(S(8));
  {
    const residuals = new M.VGroup(...prices.map((price, i) =>
      edge(ageX(i + 1), priceY(predictions[i]), ageX(i + 1), priceY(price), C.pink, 3)));
    await play(...switchView(priceAxes(), priceLine(), residuals, priceDots()),
      ...fbox(['Sale price − guess', ['Miss on a training bike', C.pink]]), ...say('CHECK THE BIKES IT LEARNED FROM'));
  }

  await until(S(9));
  await play(...switchView(errorTable()),
    ...fbox(['Square each miss', '1 + 4 + 1 + 1 + 4 + 1 = 12', ['Average = 12 ÷ 6 = 2.0', C.amber]], C.amber),
    ...say('SQUARE THE MISSES, THEN AVERAGE', C.amber));

  await until(S(10));
  await play(...switchView(...drawCards(false)), ...fbox(['Fit on training bikes.', 'Check on kept-aside bikes.'], C.violet),
    ...say('BIKES THE RULE NEVER SAW', C.violet));

  await until(S(11));
  await play(...fbox([['Validation error', C.violet], 'Average squared miss', 'on the kept-aside bikes.'], C.violet),
    ...say('VALIDATE = CHECK', C.violet));

  await until(S(12));
  await play(...say('WHAT ABOUT THE NEXT CUSTOMER?', C.violet));

  // Axes, the expected noise floor, and the practice-question analogy.
  await until(S(13));
  await play(...switchView(curveAxes()), ...fbox(['Across: number of bikes', 'Up: error', ['Lower is better', C.green]]),
    ...say('NUMBER OF BIKES AND ERROR'));

  await until(S(14));
  let floor = floorLine();
  view.push(floor);
  await play(create(floor), ...fbox([['Noise floor = 1.0', floorColor]], floorColor),
    ...say('THE DASHED LINE IS AT ONE', floorColor));

  await until(S(15));
  await play(...fbox(['Hidden wear', 'Plain luck', ['No rule can predict it', floorColor]], floorColor),
    ...say('UNPREDICTABLE PRICE CHANGES', floorColor));

  await until(S(16));
  await play(new M.Indicate(floor, { color: floorColor, runTime: 0.65 }),
    ...fbox(['On new bikes:', ['Best expected error = 1.0', floorColor]], floorColor),
    ...say('A FLOOR FOR NEW BIKES', floorColor));

  await until(S(17));
  await play(...switchView(sheet(CX, 0.0, 8, 'Practice questions', C.cyan)),
    ...fbox(['Think of a student.']), ...say('A PILE OF PRACTICE QUESTIONS'));

  await until(S(18));
  await play(...switchView(sheet(CX - 1.5, 0.10, 4, 'Practice', C.cyan), sheet(CX + 1.5, 0.10, 8, 'New exam', C.pink)),
    ...fbox([['Memorized answers', C.cyan], ['Trouble on the exam', C.pink]]),
    ...say('FEW QUESTIONS: EASY TO MEMORIZE', C.pink));

  await until(S(19));
  await play(...switchView(sheet(CX - 1.5, 0.10, 12, 'More practice', C.cyan), sheet(CX + 1.5, 0.10, 8, 'New exam', C.green)),
    ...fbox([['Learn the pattern', C.green], 'Use it on new questions.'], C.green),
    ...say('MORE PRACTICE: FIND THE PATTERN', C.green));

  await until(S(20));
  floor = floorLine();
  await play(...switchView(curveAxes(), floor),
    ...fbox(['Training + validation', 'as the pile grows.']), ...say('A LEARNING CURVE'));

  // Bendy rule: the two series grow from six to forty-eight bikes.
  await until(S(21));
  await play(...add(plotKey()), ...fbox([['Bendy rule', C.pink], 'Solid: training', 'Dashed: validation'], C.pink),
    ...say('TWO PINK LINES', C.pink));

  await until(S(22));
  await play(...add(plotStep(bendy, 0, ['train'])), ...fbox(['6 training bikes', ['Training error = 0.0', C.pink]], C.pink),
    ...say('THROUGH EVERY TRAINING DOT', C.pink));

  await until(S(23));
  await play(...add(plotStep(bendy, 0, ['validation'])),
    ...fbox(['6 training bikes', ['Validation error = 5.0', C.pink], '5 times the floor of 1.0'], C.pink),
    ...say('CHECKING ON NEW BIKES', C.pink));

  await until(S(24));
  let mark = gapMark(0, 0, 5);
  await play(...add(mark), ...fbox(['6 training bikes', ['Gap = 5.0', C.violet]], C.violet),
    ...say('GAP = DISTANCE BETWEEN THE LINES', C.violet));

  await until(S(25));
  {
    const steps = [1, 2].map(i => plotStep(bendy, i));
    view.push(...steps);
    await play(forget(mark), lag(steps.map(fade), 1.75),
      ...fbox(['12 bikes: 0.2 and 3.4', '24 bikes: 0.4 and 2.2'], C.pink),
      ...say('TRAINING UP, VALIDATION DOWN', C.pink));
  }

  await until(S(26));
  await play(...add(plotStep(bendy, 3)),
    ...fbox(['48 training bikes', ['Training   = 0.6', C.pink], ['Validation = 1.4', C.pink]], C.pink),
    ...say('48 BIKES', C.pink));

  await until(S(27));
  mark = gapMark(3, 0.6, 1.4);
  await play(...add(mark), ...fbox(['48 training bikes', ['Gap = 0.8', C.violet]], C.violet),
    ...say('THE GAP SHRANK', C.violet));

  await until(S(28));
  let marker = focus(3, [0.6], C.pink);
  await play(forget(mark), ...add(marker),
    ...fbox(['Training error rose.', 'Some training dots are missed.'], C.pink), ...say('WHY DOES TRAINING ERROR RISE?', C.pink));

  await until(S(29));
  {
    const next = focus(3, [1.4], C.pink);
    await play(forget(marker), ...add(next), ...fbox(['Validation error fell.', 'The fit follows the pattern.'], C.pink),
      ...say('WHY DOES VALIDATION ERROR FALL?', C.pink));
    marker = next;
  }

  await until(S(30));
  {
    const next = focus(3, [0.6], C.pink);
    await play(forget(marker), ...add(next),
      ...fbox([['Training = 0.6', C.pink], ['Floor    = 1.0', floorColor]], floorColor),
      ...say('TRAINING CAN GO BELOW THE FLOOR', C.pink));
    marker = next;
  }

  await until(S(31));
  await play(...fbox(['Training includes familiar luck.', ['The floor is for new bikes.', floorColor]], floorColor),
    ...say('A RULE CAN MEMORIZE ITS OWN LUCK', C.pink));

  await until(S(32));
  mark = gapMark(3, 1, 1.4, floorColor);
  await play(forget(marker), ...add(mark),
    ...fbox([['Validation = 1.4', C.pink], ['Floor      = 1.0', floorColor], 'Still coming down.'], floorColor),
    ...say('MORE BIKES CAN BRING IT CLOSER', floorColor));

  // Stiff rule: a closed gap above the floor.
  await until(S(33));
  await play(forget(mark), ...fbox([['Stiff rule', C.amber], 'Solid: training', 'Dashed: validation'], C.amber),
    ...say('TWO YELLOW LINES', C.amber));

  await until(S(34));
  await play(...add(plotStep(stiff, 0)),
    ...fbox(['Our 6 bikes', ['Training   = 2.0', C.amber], ['Validation ≈ 3.8', C.amber]], C.amber),
    ...say('THE STIFF RULE AT 6 BIKES', C.amber));

  await until(S(35));
  {
    const steps = [1, 2, 3].map(i => plotStep(stiff, i));
    view.push(...steps);
    await play(lag(steps.map(fade), 2.0),
      ...fbox(['48 training bikes', ['Both errors = 2.1', C.amber], 'Gap = 0.0'], C.amber),
      ...say('THE YELLOW LINES MEET', C.amber));
  }

  await until(S(36));
  mark = gapMark(3, 1, 2.1, C.amber, 0.46);
  await play(...add(mark), ...fbox([['Both errors = 2.1', C.amber], ['Floor       = 1.0', floorColor]], C.amber),
    ...say('THEY MEET AT ABOUT TWICE THE FLOOR', C.amber));

  await until(S(37));
  await play(forget(mark), ...fbox(['Bikes    24    48', 'Train   2.0   2.1', 'Check   2.2   2.1'], C.amber),
    ...say('THE YELLOW LINES LEVEL OFF', C.amber));

  await until(S(38));
  await play(...switchView(priceAxes(), pricePath(age => 10 - age - 0.20 * (age - 4) ** 2, C.green),
    priceLine(), priceDots()),
  ...fbox([['Green: a bending pattern', C.green], ['Yellow: a straight rule', C.amber]], C.amber),
  ...say('A STRAIGHT LINE CANNOT BEND', C.amber));

  await until(S(39));
  await play(...switchView(...fullPlot(), focus(3, [1.4, 2.1])),
    ...fbox(['Validation at 48 bikes', ['Bendy = 1.4', C.pink], ['Stiff = 2.1', C.amber]], C.pink),
    ...say('THE BENDY RULE HAS LOWER VALIDATION ERROR', C.pink));

  await until(S(40));
  mark = gapMark(3, 0.6, 1.4);
  await play(...switchView(...fullPlot(), mark),
    ...fbox(['Gap = validation error', '      − training error'], C.violet), ...say('HOW TO FIND THE GAP', C.violet));

  await until(S(41));
  await play(...fbox(['Bendy rule at 48 bikes', ['1.4 − 0.6 = 0.8', C.violet]], C.violet),
    ...say(`GAP = ${n1(bendy.validation[3] - bendy.train[3])}`, C.violet));

  // Interpret the shapes, then distinguish repeated draws from one validation set.
  await until(S(42));
  await play(forget(mark), ...fbox(['Where should the shop', 'spend its effort?']), ...say('READ THE SHAPE OF THE CURVES'));

  await until(S(43));
  {
    const firstGap = gapMark(0, 0, 5, C.pink, -0.30);
    const lastGap = gapMark(3, 0.6, 1.4, C.pink);
    marker = new M.VGroup(firstGap, lastGap);
    await play(...add(marker),
      ...fbox(['Bendy gap: 5.0 → 0.8', ['Overfitting: memorizing', C.pink]], C.pink),
      ...say('A LARGE GAP THAT SHRINKS', C.pink));
  }

  await until(S(44));
  await play(...fbox(['Validation error', ['5.0 → 3.4 → 2.2 → 1.4', C.pink]], C.pink),
    ...say('MORE DATA CAN HELP', C.pink));

  await until(S(45));
  mark = gapMark(3, 1, 2.1, C.amber, 0.47);
  await play(forget(marker), ...add(mark),
    ...fbox(['Stiff rule: flat at 2.1', ['Underfitting: too simple', C.amber]], C.amber),
    ...say('A CLOSED GAP HIGH ABOVE THE FLOOR', C.amber));

  await until(S(46));
  await play(...fbox(['Same straight rule: flat', ['Try a rule that can bend.', C.pink]], C.pink),
    ...say('CHANGE THE RULE', C.pink));

  await until(S(47));
  await play(...say('THE TRAP', C.violet));

  await until(S(48));
  await play(...fbox(['Stiff rule at 48 bikes', 'Gap = 0.0', ['Validation error = 2.1', C.amber]], C.amber),
    ...say('A CLOSED GAP CAN STILL HAVE HIGH ERROR', C.amber));

  await until(S(49));
  await play(...fbox([['Stiff endpoint = 2.1', C.amber], ['Noise floor    = 1.0', floorColor]], floorColor),
    ...say('COMPARE THE ENDPOINT WITH THE FLOOR', floorColor));

  await until(S(50));
  await play(...switchView(...drawCards(true)),
    ...fbox(['Draw bikes again and again.', 'Average errors at each size.']),
    ...say('SMOOTH CURVES AVERAGE MANY DRAWS'));

  await until(S(51));
  await play(...switchView(...drawCards(false)),
    ...fbox([['One validation set', C.violet], 'One check per fit.'], C.violet),
    ...say('THE SHOP HAS ONE KEPT-ASIDE SET', C.violet));

  await until(S(52));
  {
    // A schematic noisy curve without numerical error labels.
    const x = [CX - 2.65, CX - 0.88, CX + 0.88, CX + 2.65];
    const y = [0.55, -0.86, 0.05, -1.31];
    const base = P ? -2.5 : -1.82;
    const sketch = new M.VGroup(
      edge(x[0] - 0.38, base, x[3] + 0.38, base),
      edge(x[0] - 0.38, base, x[0] - 0.38, 0.90),
      label('Example validation error', CX, 1.20, 18, C.violet),
      ...x.slice(1).map((xx, i) => edge(x[i], y[i], xx, y[i + 1], C.violet, 3)),
      ...x.map((xx, i) => bike(xx, y[i], false, C.violet)),
      label('Training bikes', CX, base - 0.30, 17, C.muted)
    );
    await play(...switchView(sketch), ...fbox(['A small check set can', 'be lucky or unlucky.'], C.violet),
      ...say('ONE SET CAN MAKE THE CURVE JUMP', C.violet));
  }

  await until(S(53));
  await play(...switchView(...fullPlot()),
    ...fbox(['Slide the number of bikes.', ['When is pink below yellow?', C.pink]], C.pink),
    ...say('TRY IT: COMPARE VALIDATION ERRORS', C.pink));

  await until(S(54));
  await play(...fbox(['Read training and validation.', 'Compare the end with the floor.', ['Add bikes or change the rule?', C.green]], C.green),
    ...say('LEARNING CURVES GUIDE YOUR NEXT STEP', C.green));
}
