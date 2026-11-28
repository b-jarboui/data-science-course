// 17.4.7 Temporal convolutions: a filter that slides along time, with dilation (script.v3.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const times = ['9:00', '9:10', '9:20', '9:30', '9:40'];
  const temperatures = [21, 22, 21, 23, 24];
  const readings = [1, 2, 1, 3, 4];
  const CX = P ? 0 : -2.6;
  const SIDE = 4.35;                                   // laptop: right-hand panel
  const PILL = [CX, P ? 3.55 : 1.85, 0];
  const BOXP = P ? [0, -5.3, 0] : [SIDE, 0.55, 0];
  let NOTEP = P ? [0, -2.75, 0] : [SIDE, -1.35, 0];
  const CARD_Y = P ? 0.9 : 0.93;
  const PITCH = P ? 1.45 : 1.6, CW = P ? 1.3 : 1.4;
  const colx = i => CX + (i - 2) * PITCH;
  const say = (text, color = C.cyan) => showA(text, color, PILL, P ? 17 : 19);

  const label = (text, size, color, x, y, mono = false) => T(text, size, color, mono).moveTo([x, y, 0]);
  const panel = (x, y, width, height, color, fill = C.card, opacity = 0.95) => {
    const shape = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    shape.setFill(fill, opacity);
    return shape.moveTo([x, y, 0]);
  };
  const fade = o => new M.FadeIn(o, { runTime: 0.28 });
  const out = o => new M.FadeOut(o, { runTime: 0.28 });
  const mark = (o, color = C.amber) => new M.Indicate(o, { color, runTime: 0.42 });
  const cascade = a => new M.LaggedStart(a, { lagRatio: 0.12, runTime: 0.65 });

  let detail = null;
  function note(text, color = C.ink) {
    const next = text ? label(text, 24, color, NOTEP[0], NOTEP[1]) : null;
    const max = P ? FW - 0.8 : 4.9;
    if (next && next.getWidth() > max) next.scale(max / next.getWidth());
    const a = detail ? [out(detail)] : [];
    if (next) a.push(fade(next));
    detail = next;
    return a;
  }

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const a = boxNow ? [out(boxNow)] : [];
    boxNow = null;
    if (!lines.length) return a;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, ink]) => T(s, P ? 24 : 23, ink, true));
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.56;
    const lh = 0.44, height = rows.length * lh + 0.3;
    const [x, y] = BOXP;
    const frame = panel(x, y, width, height, color);
    texts.forEach((t, i) => t.moveTo([x - width / 2 + 0.28 + t.getWidth() / 2, y + (rows.length - 1) * lh / 2 - i * lh, 0]));
    boxNow = new M.VGroup(frame, ...texts);
    const maxW = P ? FW - 0.9 : 4.9;
    if (width > maxW) boxNow.scale(maxW / width);
    boxNow.moveTo(BOXP);
    a.push(fade(boxNow));
    return a;
  }

  // five reading cards on a time line
  const cards = times.map((t, i) => new M.VGroup(
    panel(colx(i), CARD_Y, CW, 0.92, C.cyan, C.cyan, 0.16), label(t, 15, C.cyan, colx(i), CARD_Y + 0.22, true)));
  const cardValue = (s, i) => label(s, 20, C.ink, colx(i), CARD_Y - 0.19, true);
  const raw = temperatures.map((v, i) => cardValue(`${v}°C`, i));
  const inputs = readings.map((v, i) => cardValue(`+${v}°C`, i));
  let activeCard = null;
  function selectCard(i, color = C.amber) {
    const o = panel(colx(i), CARD_Y, CW + 0.12, 1.04, color, C.card, 0);
    const a = activeCard ? [out(activeCard)] : [];
    a.push(fade(o)); activeCard = o; return a;
  }

  const timeArrow = new M.Arrow({ start: [colx(0) - 0.5, CARD_Y - 0.85, 0], end: [colx(4) + 0.5, CARD_Y - 0.85, 0], color: C.muted, strokeWidth: 3 });
  const timeTag = label('time →  10 minutes per step', 17, C.muted, CX, CARD_Y - 1.25);

  await until(S(0));
  await play(cascade(cards.map(fade)), new M.Create(timeArrow, { runTime: 0.4 }), fade(timeTag), ...say('HOW DO TEMPERATURES CHANGE?'), ...note('Temperatures at Central', C.cyan));

  await until(S(1));
  await play(fade(raw[4]), ...selectCard(4), ...note('One reading = how warm it is now'));

  await until(S(2));
  await play(...note('Earlier readings show the change', C.amber), ...say('LOOK AT EARLIER READINGS TOO', C.amber));

  await until(S(3));
  await play(...say('5 READINGS, 10 MINUTES APART'), ...note('Five readings, ten minutes apart', C.cyan));

  for (let k = 0; k < 5; k++) {
    await until(S(4 + k));
    await play(...(k < 4 ? [fade(raw[k])] : []), ...selectCard(k), ...note(`${times[k]} → ${temperatures[k]}°C`, C.cyan));
  }

  await until(S(9));
  await play(out(activeCard), ...note('21 − 20 = 1   ·   24 − 20 = 4', C.amber), ...say('SUBTRACT 20 FROM EACH', C.amber));
  activeCard = null;

  await until(S(10));
  await play(...raw.map(out), ...inputs.map(fade), ...note('1,  2,  1,  3,  4', C.cyan), ...say('1,  2,  1,  3,  4'));

  // window with two openings over the cards
  const cardWin = (i, j) => new M.VGroup(
    panel(colx(i), CARD_Y, CW + 0.16, 1.1, C.amber, C.card, 0), panel(colx(j), CARD_Y, CW + 0.16, 1.1, C.amber, C.card, 0),
    new M.Line({ start: [colx(i) + CW / 2 + 0.08, CARD_Y + 0.55, 0], end: [colx(j) - CW / 2 - 0.08, CARD_Y + 0.55, 0], color: C.amber, strokeWidth: 3 }));
  let win = cardWin(0, 1);

  await until(S(11));
  await play(fade(win), ...say('A WINDOW WITH TWO OPENINGS', C.amber), ...note('A window with two openings', C.amber));

  await until(S(12));
  await play(mark(inputs[0]), mark(inputs[1]), ...note('Each opening shows one reading', C.amber));

  await until(S(13));
  await play(new M.Transform(win, cardWin(1, 2)), ...note('Slide the window along', C.amber));
  await play(new M.Transform(win, cardWin(2, 3)));

  await until(S(14));
  await play(new M.Transform(win, cardWin(3, 4)), ...note('Two readings → one new number', C.amber), ...say('COMBINE THE TWO'));

  await until(S(15));
  await play(...note('Each reading gets an equal share: 0.5', C.amber));

  await until(S(16));
  await play(...note('Share = weight', C.violet), ...say('WEIGHT = THE SHARE', C.violet));

  // the network: 5 reading circles (first layer) and result circles (next layer), one row per time
  const r = P ? 0.42 : 0.33;
  const NETC = P ? [0, 0.15, 0] : [CX, -0.8, 0];
  const NH = P ? 4.4 : 3.2;
  const inX = NETC[0] - (P ? 1.2 : 1.6), outX = NETC[0] + (P ? 1.7 : 1.9);
  const N = net({ layers: [5], center: [inX, NETC[1], 0], height: NH, r, names: times });
  N.nodes[0].forEach(c => { c.setColor(C.violet); c.setFill(C.card, 0.95); });
  const rowY = i => N.pos(0, i)[1];
  const node = i => N.nodes[0][i];
  const headIn = label('readings', 17, C.cyan, inX, rowY(0) + r + 0.3);
  const headOut = label('next layer', 17, C.amber, outX, rowY(0) + r + 0.3);
  const resultNode = i => {
    const c = new M.Circle({ radius: r, color: C.amber, strokeWidth: 3 });
    c.setFill(C.card, 0.95);
    return c.moveTo([outX, rowY(i), 0]);
  };
  const results = { 2: resultNode(2), 3: resultNode(3), 4: resultNode(4) };
  const vals = {};
  const setVal = (i, s, col = C.amber) => {
    const t = label(s, 19, col, outX, rowY(i), true);
    const a = [fade(t)]; if (vals[i]) a.push(out(vals[i])); vals[i] = t; return a;
  };
  const tapLine = (from, to, col = C.amber, w = 5) => new M.Line({
    start: [inX + r, rowY(from), -0.01], end: [outX - r, rowY(to), -0.01], color: col, strokeWidth: w });
  let lit = [];
  function light(pairs) {               // pairs: [from, to]; old glowing lines become thin traces
    const a = lit.map(l => out(l));
    lit = pairs.map(([f, t]) => tapLine(f, t));
    a.push(...lit.map(l => new M.Create(l, { runTime: 0.35 })));
    return a;
  }
  const traces = [];
  const keepTrace = pairs => pairs.map(([f, t]) => { const l = tapLine(f, t, C.muted, 2); l.setStrokeOpacity(0.6); traces.push(l); return fade(l); });
  const netWin = (i, j) => new M.VGroup(...[i, j].map(k =>
    panel(inX, rowY(k), 2 * r + 0.22, 2 * r + 0.22, C.amber, C.card, 0)));
  // flash the real line: ShowPassingFlash removes its own pulse (a copy would stay on screen)
  const flash = () => lit.map(l => new M.ShowPassingFlash(l, { color: C.ink, strokeWidth: 7, timeWidth: 0.5 }));

  await until(S(17));
  NOTEP = P ? [0, -3.85, 0] : NOTEP;
  await play(out(win), ...cards.map(out), ...inputs.map(out), out(timeArrow), out(timeTag), ...note('Readings in the first layer', C.violet),
    cascade(N.nodes.flat().map(fade)), cascade(N.labels.map(fade)), fade(headIn), ...say('READINGS IN THE FIRST LAYER', C.violet));
  await play(...readings.map((v, i) => N.value(0, i, String(v), C.cyan)).flat());

  await until(S(18));
  win = netWin(4, 3);
  await play(fade(results[4]), fade(headOut), fade(win), ...light([[4, 4], [3, 4]]), ...say('TWO GLOWING LINES', C.amber),
    ...note('Two lines → a new circle in the next layer', C.amber));

  await until(S(19));
  await play(...flash(), ...note('Each line carries half of its reading', C.amber));

  await until(S(20));
  await play(mark(win, C.violet), ...note('Lines + weights = a filter', C.violet), ...say('FILTER', C.violet));

  await until(S(21));
  await play(mark(node(4), C.violet), mark(node(3), C.violet), ...note('Each place it reads = a tap', C.violet), ...say('TAP', C.violet));

  await until(S(22));
  await play(...note('Same filter, moved across time', C.violet), ...say('TEMPORAL CONVOLUTION', C.violet));

  // adjacent taps at 9:40
  await until(S(23));
  await play(mark(win), ...note('Filter at 9:40, taps side by side', C.amber), ...say('NEXT-DOOR TAPS AT 9:40'));

  await until(S(24));
  await play(mark(node(4)), ...note('Tap 1: 4 at 9:40', C.cyan));

  await until(S(25));
  await play(mark(node(3)), ...note('Tap 2: 3 at 9:30', C.cyan));

  await until(S(26));
  await play(...note('4 × 0.5 = 2', C.amber));

  await until(S(27));
  await play(...note('3 × 0.5 = 1.5', C.amber));

  await until(S(28));
  await play(...flash(), ...setVal(4, '3.5'), ...note('2 + 1.5 = 3.5', C.amber), ...say('RESULT 3.5', C.amber));

  await until(S(29));
  await play(...note('Reach further back with two taps?', C.amber), ...say('REACH FURTHER INTO THE PAST?', C.amber));

  await until(S(30));
  await play(new M.Transform(win, netWin(4, 2)), ...light([[4, 4], [2, 4]]), ...setVal(4, '?'),
    ...note('Move the openings apart, still two', C.amber));

  await until(S(31));
  await play(mark(node(3), C.muted), ...note('One reading skipped between taps', C.amber));

  await until(S(32));
  await play(...note('Gap between taps = dilation', C.violet), ...say('DILATION', C.violet));

  await until(S(33));
  await play(...note('Taps 2 steps apart → dilation 2', C.violet));

  // dilation 2, slide from 9:20; each result stays in the next layer
  await until(S(34));
  await play(new M.Transform(win, netWin(2, 0)), fade(results[2]), fade(results[3]), ...light([[2, 2], [0, 2]]),
    ...setVal(2, '?'), ...setVal(3, '?'), ...note('Start the filter at 9:20'), ...say('START AT 9:20'));

  await until(S(35));
  await play(mark(node(2)), mark(node(0)), ...note('Reads 1 at 9:20 and 1 at 9:00', C.cyan));

  await until(S(36));
  await play(...note('1 × 0.5 = 0.5   ·   1 × 0.5 = 0.5', C.amber));

  await until(S(37));
  await play(...flash(), ...setVal(2, '1'), ...note('0.5 + 0.5 = 1', C.amber), ...say('9:20 → 1', C.amber));

  await until(S(38));
  await play(new M.Transform(win, netWin(3, 1)), ...keepTrace([[2, 2], [0, 2]]), ...light([[3, 3], [1, 3]]),
    ...note('Move the filter to 9:30'), ...say('MOVE TO 9:30'));

  await until(S(39));
  await play(mark(node(3)), mark(node(1)), ...note('Reads 3 at 9:30 and 2 at 9:10', C.cyan));

  await until(S(40));
  await play(...flash(), ...setVal(3, '2.5'), ...note('1.5 + 1 = 2.5', C.amber), ...say('9:30 → 2.5', C.amber));

  await until(S(41));
  await play(new M.Transform(win, netWin(4, 2)), ...keepTrace([[3, 3], [1, 3]]), ...light([[4, 4], [2, 4]]),
    ...note('Finally, move to 9:40'), ...say('MOVE TO 9:40'));

  await until(S(42));
  await play(mark(node(4)), mark(node(2)), ...note('Reads 4 at 9:40 and 1 at 9:20', C.cyan));

  await until(S(43));
  await play(...note('4 × 0.5 = 2   ·   1 × 0.5 = 0.5', C.amber));

  await until(S(44));
  await play(...flash(), ...setVal(4, '2.5'), ...note('2 + 0.5 = 2.5', C.amber), ...say('9:40 → 2.5', C.amber));

  await until(S(45));
  await play(...note('Only now or earlier, never later', C.green), ...say('NO FUTURE READINGS', C.green));

  await until(S(46));
  await play(mark(win, C.green), ...note('Never uses the future = causal filter', C.green), ...say('CAUSAL FILTER', C.green));

  await until(S(47));
  await play(...note(''), ...say('A SHORT FORMULA'), ...fbox([['result =', C.amber]]));

  await until(S(48));
  await play(...fbox([['result =', C.amber], '  0.5 × current reading', '+ 0.5 × reading 2 steps back', '= 0.5 × 4 + 0.5 × 1 = 2.5']));

  await until(S(49));
  await play(...lit.map(l => mark(l, C.violet)), ...note('Training learns the weights', C.violet));

  await until(S(50));
  await play(...note('Finds patterns in readings over time'), ...say('TEMPORAL CONVOLUTIONS FIND PATTERNS'));

  await until(S(51));
  await play(...note('Reach older readings, still 2 taps', C.violet), ...say('DILATION REACHES FURTHER', C.violet));

  await until(S(52));
  await play(mark(node(3), C.pink), ...note('Big gaps can miss changes in between', C.pink), ...say('BUT GAPS CAN MISS THINGS', C.pink));

  await until(S(53));
  await play(...fbox([]), ...note('Combine across time · dilation = gap', C.violet), mark(win),
    ...say('COMBINE ACROSS TIME  ·  DILATION = GAP', C.violet));
}
