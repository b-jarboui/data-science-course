// 20.1.10 Model parallelism: sharing a large model across devices.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const x = [1, 2];
  const W = [[1, 0, 2, 1], [0, 1, 1, 3]];
  const products = W[0].map((_, j) => x.map((v, i) => v * W[i][j]));
  const out = products.map(([a, b]) => a + b);

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.2, -1.35, 0];
  const TX = P ? 0 : 4.3;
  const TY = P ? 0.84 : 0.78;
  const NETWORK_Y = P ? -2.9 : -1.16;
  const DEVICE = [C.cyan, C.violet];

  const say = (s, c = C.cyan) => showA(s, c, PILL, 17);
  const label = (s, px, py, color = C.ink, size = 20, max = Infinity) => {
    const t = T(String(s), size, color, true);
    t._k = 1;
    if (t.getWidth() > max) { t._k = max / t.getWidth(); t.scale(t._k); }
    return t.moveTo([px, py, 0]);
  };
  const rect = (px, py, width, height, color, fill, opacity = 0.95) => {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.12, color, strokeWidth: 2 });
    if (fill) r.setFill(fill, opacity);
    return r.moveTo([px, py, 0]);
  };
  const line = (x1, y1, x2, y2, color = C.muted) =>
    new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth: 2 });
  const reveal = (...items) => items.map(item => new M.FadeIn(item, { runTime: 0.48 }));
  const hide = (...items) => items.filter(Boolean).map(item => new M.FadeOut(item, { runTime: 0.4 }));
  const stagger = items => new M.LaggedStart(reveal(...items), { lagRatio: 0.16, runTime: 1.02 });

  let boxNow = null;
  function clearBox() {
    const animations = hide(boxNow);
    boxNow = null;
    return animations;
  }
  function fbox(lines, color = C.cyan) {
    const [bx, by] = BOXP;
    const lh = P ? 0.43 : 0.41;
    const rows = lines.map((s, i) =>
      label(s, bx, by + ((lines.length - 1) / 2 - i) * lh,
        i === lines.length - 1 ? color : C.ink, P ? 22 : 21, P ? FW - 1.0 : 4.1));
    const width = Math.max(...rows.map(t => t.getWidth() * t._k)) + 0.52;
    const panel = rect(bx, by, width, lines.length * lh + 0.34, color, C.card);
    const animations = clearBox();
    boxNow = new M.VGroup(panel, ...rows);
    return [...animations, ...reveal(boxNow)];
  }

  // Follow the word from the newsletter into the layer.
  const paper = (py, selected) => {
    const panel = rect(TX, py, P ? 5.8 : 3.7, 0.73, C.muted, C.card);
    const offsets = [-1.16, -0.22, 0.48, 1.08];
    const words = ['Library', 'opens', 'at', 'nine'].map((word, i) =>
      label(word, TX + offsets[i], py, selected && i === 3 ? C.amber : C.ink, 18));
    return new M.VGroup(panel, ...words);
  };
  const newsletter = paper(TY + 0.58, false);
  const token = paper(P ? -2.2 : TY + 0.58, true);
  const large = net({
    layers: [3, 5, 5, 4], center: [CX, NETWORK_Y, 0],
    width: P ? 5.6 : 5.3, height: P ? 3.55 : 2.55, r: 0.18,
  });
  const chipY = P ? 0.5 : -0.22;
  const chip = (px, py, name, color, width = 1.42) => {
    const pins = [-0.31, 0, 0.31].flatMap(dx => [
      line(px + dx, py + 0.34, px + dx, py + 0.47, color),
      line(px + dx, py - 0.34, px + dx, py - 0.47, color),
    ]);
    return new M.VGroup(rect(px, py, width, 0.68, color, C.card),
      label(name, px, py, color, 16), ...pins);
  };
  const aChip = chip(TX - 0.95, chipY, 'Chip A', C.cyan);
  const bChip = chip(TX + 0.95, chipY, 'Chip B', C.violet);
  const numbers = label('1     2', TX, P ? -3.9 : chipY - 0.3, C.violet, 30);
  const toNumbers = new M.Arrow({ start: [TX + 1.08, P ? -2.6 : TY + 0.2, 0], end: [TX + 0.45, P ? -3.55 : chipY + 0.05, 0], color: C.amber, strokeWidth: 2.5 });

  await until(S(0)); await play(...reveal(newsletter, large.group), ...say('MORE NEWSLETTERS, LARGER MODEL'));
  await until(S(1)); await play(...reveal(aChip), ...fbox(['Model too large for one chip'], C.amber), ...say('TOO MANY NUMBERS', C.amber));
  await until(S(2)); await play(...reveal(bChip), ...clearBox(), ...say('CAN TWO CHIPS SHARE THE MODEL?'));
  await until(S(3)); await play(...hide(newsletter, aChip, bChip, large.group), ...reveal(token), ...say('FOLLOW THE WORD “NINE”', C.amber));
  await until(S(4)); await play(...say('WORD INFORMATION TRAVELS AS NUMBERS', C.violet));
  await until(S(5)); await play(...reveal(toNumbers, numbers), ...say('TWO INPUT NUMBERS', C.violet));

  // Reveal the two layers and eight connections before naming the table.
  const radius = P ? 0.33 : 0.29;
  const N = net({
    layers: [2, 4], center: [CX, NETWORK_Y, 0],
    width: P ? 4.6 : 5.1, height: P ? 3.55 : 2.5, r: radius,
  });
  const [inputs, outputs] = N.nodes;
  const edges = N.edges[0].flat();
  const layerY = P ? -5.25 : 0.67;
  const layerNames = [
    label('Input layer', N.pos(0, 0)[0], layerY, C.violet, 17),
    label('Output layer', N.pos(1, 0)[0], layerY, C.amber, 17),
  ];
  const enterOutput = j => N.value(1, j, out[j], DEVICE[Math.floor(j / 2)]);
  const styleWeights = W.flatMap((row, i) => row.map((w, j) => [i, j, w]));

  await until(S(6)); await play(...hide(token, numbers, toNumbers), ...reveal(...inputs), ...N.value(0, 0, x[0]), ...N.value(0, 1, x[1]));
  await until(S(7)); await play(stagger(outputs), ...say('FOUR OUTPUT CIRCLES', C.amber));
  await until(S(8)); await play(stagger(edges), ...say('EACH INPUT CONNECTS TO EACH OUTPUT'));
  await until(S(9)); await play(...reveal(...layerNames), ...say('A COLUMN OF NEURONS = A LAYER'));
  await until(S(10));
  // The helper caps line thickness at one. Scale the visual thickness by the largest weight.
  await play(...styleWeights.flatMap(([i, j, w]) => N.weight(0, i, j, w / 3)), ...say('EACH CONNECTION HAS A WEIGHT'));
  await until(S(11)); await play(...fbox(['2 inputs × 4 outputs', '8 weights'], C.amber), ...say('EIGHT CONNECTIONS, EIGHT WEIGHTS'));

  const cw = P ? 1.13 : 0.83;
  const rh = 0.44;
  const col = j => TX + (j - 1.5) * cw;
  const tableRect = (start, count, color) =>
    rect((col(start) + col(start + count - 1)) / 2, TY, cw * count - 0.06, 2 * rh + 0.07, color);
  function matrix() {
    const grid = new M.VGroup(
      rect(TX, TY, 4 * cw, 2 * rh, C.muted, C.card),
      line(TX - 2 * cw, TY, TX + 2 * cw, TY),
      ...[1, 2, 3].map(j => line(TX + (j - 2) * cw, TY - rh, TX + (j - 2) * cw, TY + rh)),
    );
    const rows = W.map((row, i) => new M.VGroup(...row.map((w, j) =>
      label(w, col(j), TY + (0.5 - i) * rh, C.ink, 21))));
    return { grid, rows, all: [grid, ...rows] };
  }

  let table = matrix();
  let focus = null;
  let focusL = null;
  function select(j) {
    const animations = hide(focus, focusL);
    focus = j == null ? null : tableRect(j, 1, C.amber);
    focusL = null;
    if (focus) {
      const b = N.pos(1, j);
      focusL = new M.VGroup(...[0, 1].map(i => {
        const a = N.pos(0, i);
        return new M.Line({ start: [a[0] + radius, a[1], 0.01], end: [b[0] - radius, b[1], 0.01], color: C.amber, strokeWidth: 5 });
      }));
      animations.push(...reveal(focus, focusL));
    }
    return animations;
  }
  const lightEdges = j => N.edges[0].map(row =>
    new M.Indicate(row[j], { color: C.amber, scaleFactor: 1, runTime: 0.9 }));

  await until(S(12)); await play(...clearBox(), ...reveal(table.grid), ...say('TWO ROWS AND FOUR COLUMNS'));
  await until(S(13)); await play(...say('A TABLE OF NUMBERS IS A MATRIX'));
  await until(S(14)); await play(...reveal(table.rows[0]), ...say('FIRST ROW'));
  await until(S(15)); await play(...reveal(table.rows[1]), ...say('SECOND ROW'));
  await until(S(16)); await play(...select(0), ...lightEdges(0), ...say('ONE COLUMN FOR EACH OUTPUT', C.amber));
  await until(S(17)); await play(...select(null), ...fbox(['Device A can hold 4 weights', 'Device B can hold 4 weights'], C.amber), ...say('FOUR WEIGHTS PER DEVICE', C.amber));
  await until(S(18)); await play(...fbox(['8 weights in the layer', '4 places on either device'], C.pink), ...say('THE WHOLE LAYER WILL NOT FIT', C.pink));

  function shelf(split) {
    const span = P ? 4.65 : 3.75;
    const rooms = split
      ? [-1, 1].map(side => rect(TX + side * span / 4, TY, span / 2 - 0.10, 0.96, DEVICE[(side + 1) / 2], C.card))
      : [rect(TX, TY, span, 0.96, C.amber, C.card)];
    const books = Array.from({ length: 8 }, (_, i) => {
      const nudge = split ? (i < 4 ? -0.05 : 0.05) : 0;
      const height = [0.42, 0.56, 0.48, 0.61][i % 4];
      const color = DEVICE[Math.floor(i / 4)];
      return rect(TX + (i - 3.5) * span / 9.1 + nudge, TY - 0.34 + height / 2,
        span / 14, height, color, color, 0.75);
    });
    return new M.VGroup(...rooms, ...books);
  }
  const wholeShelf = shelf(false), splitShelf = shelf(true);

  await until(S(19)); await play(...hide(...table.all), ...clearBox(), ...reveal(wholeShelf), ...say('ONE LARGE BOOKSHELF'));
  await until(S(20)); await play(...hide(wholeShelf), ...reveal(splitShelf), ...say('SAME BOOKS IN TWO ROOMS'));
  await until(S(21));
  table = matrix();
  await play(...hide(splitShelf), ...reveal(...table.all), ...say('DIVIDE THE LAYER BY COLUMNS'));

  function deviceTable(d) {
    const start = 2 * d, color = DEVICE[d];
    return new M.VGroup(tableRect(start, 2, color),
      label(`Device ${'AB'[d]}`, (col(start) + col(start + 1)) / 2, TY - 0.72, color, 16));
  }
  function deviceBracket(d) {
    const [, top] = N.pos(1, 2 * d), [px, bottom] = N.pos(1, 2 * d + 1);
    const near = px + radius + 0.12, far = near + 0.22, pad = P ? 0.35 : 0.28;
    const color = DEVICE[d];
    return new M.VGroup(
      line(near, top + pad, far, top + pad, color),
      line(far, top + pad, far, bottom - pad, color),
      line(near, bottom - pad, far, bottom - pad, color),
      label('AB'[d], far + 0.22, (top + bottom) / 2, color, 17),
    );
  }
  let parts = [deviceTable(0), deviceTable(1)];
  const brackets = [deviceBracket(0), deviceBracket(1)];

  await until(S(22)); await play(...reveal(parts[0], brackets[0]), ...say('DEVICE A GETS COLUMNS 1 AND 2', DEVICE[0]));
  await until(S(23)); await play(...reveal(parts[1], brackets[1]), ...say('DEVICE B GETS COLUMNS 3 AND 4', DEVICE[1]));
  await until(S(24)); await play(...fbox(['4 weights on A + 4 weights on B', '8 weights in all'], C.amber), ...say('ALL EIGHT WEIGHTS ARE STILL HERE'));
  await until(S(25)); await play(...say('MODEL PARALLELISM'));
  await until(S(26)); await play(...clearBox(), ...say('DOES THE SPLIT GIVE THE SAME ANSWER?', C.amber));

  const multiply = (i, j) => `${x[i]} × ${W[i][j]}`;
  const firstProduct = j => `${multiply(0, j)} = ${products[j][0]}`;
  const secondProduct = j => `${multiply(1, j)} = ${products[j][1]}`;
  const sum = j => `${products[j].join(' + ')} = ${out[j]}`;

  await until(S(27)); await play(...N.flow(0), ...fbox(['A receives (1, 2)', 'B receives (1, 2)'], C.violet), ...say('SAME INPUT FOR BOTH DEVICES', C.violet));
  await until(S(28)); await play(...select(0), ...lightEdges(0), ...clearBox(), ...say('DEVICE A · FIRST OUTPUT', DEVICE[0]));
  await until(S(29)); await play(new M.Indicate(N.edges[0][0][0], { color: C.amber, scaleFactor: 1 }), ...fbox([firstProduct(0)], C.amber));
  await until(S(30)); await play(new M.Indicate(N.edges[0][1][0], { color: C.amber, scaleFactor: 1 }), ...fbox([firstProduct(0), secondProduct(0)], C.amber));
  await until(S(31)); await play(...fbox([sum(0)], C.amber), ...say('ADD THE TWO PRODUCTS', C.amber));
  await until(S(32)); await play(...enterOutput(0), ...say('FIRST OUTPUT IS 1', DEVICE[0]));
  await until(S(33)); await play(...select(1), ...lightEdges(1), ...fbox([firstProduct(1), secondProduct(1)], C.amber), ...say('DEVICE A · SECOND OUTPUT', DEVICE[0]));
  await until(S(34)); await play(...fbox([sum(1)], C.amber), ...enterOutput(1), ...say('SECOND OUTPUT IS 2', DEVICE[0]));
  await until(S(35)); await play(...select(null), ...fbox(['Device A gives (1, 2)'], DEVICE[0]), ...say('DEVICE A HAS TWO RESULTS', DEVICE[0]));
  await until(S(36)); await play(...reveal(), ...fbox(['A and B calculate', 'at the same time'], C.violet),
    new M.Indicate(brackets[1], { color: C.violet, scaleFactor: 1 }), ...say('DEVICE B WORKS AT THE SAME TIME', DEVICE[1]));
  await until(S(37)); await play(...select(2), ...lightEdges(2), ...fbox([firstProduct(2), secondProduct(2)], C.amber), ...say('DEVICE B · THIRD OUTPUT', DEVICE[1]));
  await until(S(38)); await play(...fbox([sum(2)], C.amber), ...enterOutput(2), ...say('THIRD OUTPUT IS 4', DEVICE[1]));
  await until(S(39)); await play(...select(3), ...lightEdges(3), ...fbox([firstProduct(3), secondProduct(3)], C.amber), ...say('DEVICE B · FOURTH OUTPUT', DEVICE[1]));
  await until(S(40)); await play(...fbox([sum(3)], C.amber), ...enterOutput(3), ...say('FOURTH OUTPUT IS 7', DEVICE[1]));
  await until(S(41)); await play(...select(null), ...fbox(['Device B gives (4, 7)'], DEVICE[1]), ...say('DEVICE B HAS TWO RESULTS', DEVICE[1]));
  await until(S(42)); await play(...fbox(['A (1, 2)  then  B (4, 7)'], C.amber), ...say('JOIN IN THE ORIGINAL ORDER'));
  await until(S(43)); await play(...fbox(['Complete output', `(${out.join(', ')})`], C.green), ...say('ALL FOUR OUTPUTS', C.green));
  await until(S(44)); await play(...fbox(['Whole layer  (1, 2, 4, 7)', 'Split layer  (1, 2, 4, 7)'], C.green), ...say('EXACTLY THE SAME ANSWER', C.green));
  await until(S(45)); await play(...clearBox(), ...select(0), ...lightEdges(0), ...say('THE SAME RULE FOR EVERY COLUMN'));
  await until(S(46)); await play(...fbox(['Output = sum of the products', 'Each product = input × weight'], C.amber), ...say('MULTIPLY, THEN ADD', C.amber));

  // Compare full model copies with the two pieces of one layer.
  function replica(d, text) {
    const px = TX + (d ? 1 : -1) * (P ? 1.65 : 1.15);
    const width = P ? 3.1 : 2.2;
    const color = DEVICE[d];
    const small = net({ layers: [2, 3, 2], center: [px, TY - 0.45, 0], width: width * 0.6, height: 0.55, r: 0.09 });
    return new M.VGroup(
      rect(px, TY - 0.05, width, 1.95, color, C.card),
      label(`Device ${'AB'[d]}`, px, TY + 0.68, color, P ? 17 : 15, width - 0.1),
      label(text, px, TY + 0.3, C.ink, P ? 16 : 15, width - 0.12),
      small.group,
    );
  }
  const copies = [replica(0, 'Library opens at nine'), replica(1, 'Pool closed today')];

  await until(S(47)); await play(...select(null), ...hide(...table.all, ...parts), ...reveal(...copies),
    ...fbox(['Different text → each device', 'Whole model on each device'], C.violet), ...say('DATA PARALLELISM', C.violet));
  await until(S(48));
  table = matrix();
  parts = [deviceTable(0), deviceTable(1)];
  await play(...hide(...copies), ...reveal(...table.all, ...parts),
    ...fbox(['Same input → both devices', 'Different weights on each device']), ...say('MODEL PARALLELISM'));
  await until(S(49)); await play(...fbox(['8 weights in the layer', '4 weights on each device'], C.amber), ...say('WHEN THE MODEL WILL NOT FIT', C.amber));

  function exchange(slow, compare = false) {
    const left = TX - (P ? 2.05 : 1.92), width = P ? 4.1 : 3.84;
    const colors = [slow ? C.pink : C.violet, C.cyan, slow ? C.pink : C.violet];
    const headings = ['Send input', 'Calculate', 'Join output'];
    const lengths = slow ? [0.39, 0.20, 0.41] : [0.20, 0.57, 0.23];
    let start = left;
    const bars = lengths.map((fraction, i) => {
      const w = fraction * width;
      const bar = rect(start + w / 2, TY - 0.07, w - 0.07, 0.24, colors[i], colors[i], 0.75);
      start += w;
      return bar;
    });
    const heading = headings.map((s, i) =>
      label(s, left + (i + 0.5) * width / 3, TY + 0.38, C.ink, P ? 16 : 15, width / 3 - 0.09));
    const caption = label(compare ? 'Link time can erase the gain' : slow ? 'More time on the link' : 'Numbers cross the link',
      TX, TY - 0.52, slow ? C.pink : C.violet, 16, width);
    return new M.VGroup(...heading, ...bars, caption);
  }
  const exchangeFast = exchange(false), exchangeSlow = exchange(true), exchangeMore = exchange(true, true);

  await until(S(50)); await play(...hide(...table.all, ...parts), ...reveal(exchangeFast),
    ...fbox(['Send (1, 2) to A and B', 'Gather (1, 2) and (4, 7)'], C.violet), ...say('THE DEVICES EXCHANGE NUMBERS', C.violet));
  await until(S(51)); await play(...hide(exchangeFast), ...reveal(exchangeSlow),
    ...fbox(['Slow link', 'More time spent waiting'], C.pink), ...say('A SLOW LINK MEANS MORE WAITING', C.pink));
  await until(S(52)); await play(...hide(exchangeSlow), ...reveal(exchangeMore),
    ...fbox(['Less calculation per device', 'More numbers to move'], C.amber), ...say('MORE DEVICES MAY TAKE LONGER', C.amber));
  await until(S(53));
  table = matrix();
  await play(...hide(exchangeMore), ...reveal(...table.all, deviceTable(0), deviceTable(1)),
    ...fbox(['A (1, 2) + B (4, 7) joined', 'Complete output (1, 2, 4, 7)'], C.green), ...say('DIVIDE, CALCULATE, JOIN', C.green));
}
