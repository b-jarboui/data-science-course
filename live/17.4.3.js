// 17.4.3 LSTM memory (script.v20.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const times = ['9:00', '9:10', '9:20'];
  const temperatures = [21, 22, 21];
  const readings = [1, 2, 1];
  const CX = P ? 0 : -2.6;
  const PILL = [CX, P ? 3.55 : 1.85, 0];
  const SIDE = 4.35;                                   // laptop: right-hand panel
  const BOXP = P ? [0, -5.35, 0] : [SIDE, 0.55, 0];
  const NOTEP = P ? [0, -3.95, 0] : [SIDE, -1.35, 0];
  const CARD_Y = P ? 2.35 : 0.93;
  const BOARD_Y = P ? 0.35 : -0.99;
  const CLUE_Y = P ? -1.75 : -2.67;
  const colx = i => CX + (i - 1) * (P ? 2.19 : 2.25);
  const say = (text, color = C.cyan) => showA(text, color, PILL, P ? 17 : 19);

  const label = (text, size, color, x, y, mono = false) =>
    T(text, size, color, mono).moveTo([x, y, 0]);
  const panel = (x, y, width, height, color, fill = C.card, opacity = 0.95) => {
    const shape = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    shape.setFill(fill, opacity);
    return shape.moveTo([x, y, 0]);
  };
  const fade = object => new M.FadeIn(object, { runTime: 0.28 });
  const out = object => new M.FadeOut(object, { runTime: 0.28 });
  const mark = (object, color = C.amber) => new M.Indicate(object, { color, runTime: 0.42 });
  const cascade = animations => new M.LaggedStart(animations, { lagRatio: 0.12, runTime: 0.65 });

  let detail = null;
  function note(text, color = C.ink) {
    const next = text ? label(text, P ? 24 : 24, color, NOTEP[0], NOTEP[1]) : null;
    const max = P ? FW - 0.8 : 4.9;
    if (next && next.getWidth() > max) next.scale(max / next.getWidth());
    const animations = detail ? [out(detail)] : [];
    if (next) animations.push(fade(next));
    detail = next;
    return animations;
  }

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const animations = boxNow ? [out(boxNow)] : [];
    boxNow = null;
    if (!lines.length) return animations;

    const rows = lines.map(line => Array.isArray(line) ? line : [line, C.ink]);
    const texts = rows.map(([text, ink]) => T(text, P ? 24 : 23, ink, true));
    const width = Math.max(...texts.map(text => text.getWidth())) + 0.56;
    const lineHeight = 0.44;
    const height = rows.length * lineHeight + 0.3;
    const [x, y] = BOXP;
    const frame = panel(x, y, width, height, color);
    texts.forEach((text, i) => {
      text.moveTo([x - width / 2 + 0.28 + text.getWidth() / 2,
        y + (rows.length - 1) * lineHeight / 2 - i * lineHeight, 0]);
    });
    boxNow = new M.VGroup(frame, ...texts);
    const maxWidth = P ? FW - 0.9 : 4.9;
    if (width > maxWidth) boxNow.scale(maxWidth / width);
    boxNow.moveTo(BOXP);
    animations.push(fade(boxNow));
    return animations;
  }

  const tickY = P ? 0.3 : -0.65;
  const timeline = new M.Line({
    start: [colx(0), tickY, 0], end: [colx(2), tickY, 0], color: C.muted, strokeWidth: 2
  });
  const ticks = times.map((time, i) => new M.VGroup(
    new M.Dot({ point: [colx(i), tickY, 0], radius: 0.08, color: C.cyan }),
    label(time, 20, C.cyan, colx(i), tickY - 0.38, true)
  ));
  const strip = new M.VGroup(timeline, ...ticks);
  const cardFrames = times.map((_, i) => panel(colx(i), CARD_Y, 1.84, 0.92, C.cyan, C.cyan, 0.16));
  const cards = times.map((time, i) => new M.VGroup(
    cardFrames[i], label(time, 16, C.cyan, colx(i), CARD_Y + 0.22, true)
  ));
  const cardValue = (text, i) => label(text, 24, C.ink, colx(i), CARD_Y - 0.19, true);
  const raw = temperatures.map((value, i) => cardValue(`${value}°C`, i));
  const inputs = readings.map((value, i) => cardValue(`+${value}°C`, i));
  let activeCard = null;
  function selectCard(i) {
    const outline = panel(colx(i), CARD_Y, 1.97, 1.05, C.amber, C.card, 0);
    const animations = activeCard ? [out(activeCard)] : [];
    animations.push(fade(outline));
    activeCard = outline;
    return animations;
  }

  await until(S(0));
  await play(new M.Create(timeline, { runTime: 0.35 }), cascade(ticks.map(fade)),
    ...say('CENTRAL  ·  EVERY 10 MINUTES'), ...note('A new reading every 10 minutes', C.cyan));

  await until(S(1));
  await play(mark(ticks[0]), mark(ticks[1], C.cyan),
    ...note('Earlier reading → next reading?', C.amber));

  await until(S(2));
  await play(mark(ticks[0]), ...say('WHICH OLD READINGS HELP?', C.amber),
    ...note('Which old numbers to keep?', C.amber));

  await until(S(3));
  await play(out(strip), cascade(cards.map(fade)), ...say('READINGS IN TIME ORDER'),
    ...note('Readings in time order = a sequence', C.cyan));

  await until(S(4));
  await play(fade(raw[0]), ...selectCard(0), ...note('9:00 → 21°C', C.cyan));

  await until(S(5));
  await play(cascade([fade(raw[1]), fade(raw[2])]), ...selectCard(2), ...note('9:10 → 22°C   ·   9:20 → 21°C', C.cyan));

  await until(S(6));
  await play(...raw.map(out), ...inputs.map(fade), out(activeCard),
    ...say('DEGREES ABOVE 20'), ...note('21 − 20 = 1   ·   22 − 20 = 2   ·   21 − 20 = 1'));
  activeCard = null;

  const board = new M.VGroup(
    panel(CX, BOARD_Y, P ? 4.6 : 4.35, 1.22, C.amber),
    label('Running summary', 21, C.amber, CX, BOARD_Y + 0.29)
  );
  const boardNumber = label('…', 30, C.ink, CX, BOARD_Y - 0.22, true);
  const boardArrow = new M.Arrow({
    start: [CX - 1.0, BOARD_Y + 0.81, 0], end: [CX + 1.0, BOARD_Y + 0.81, 0],
    color: C.amber, strokeWidth: 3
  });

  await until(S(7));
  await play(fade(board), new M.Create(boardArrow, { runTime: 0.35 }), ...say('CARRY ONE MEMORY NUMBER', C.amber),
    ...note('One number, carried from reading to reading', C.amber));

  await until(S(8));
  await play(fade(boardNumber), ...say('A RUNNING SUMMARY', C.amber),
    ...note('A summary, not a temperature', C.amber));

  await until(S(9));
  await play(out(boardArrow), ...note('How much to keep:  0 ──── 0.5 ──── 1', C.amber),
    ...say('CHOOSE HOW MUCH TO KEEP', C.amber));

  const shares = [['0 clears', 0], ['0.5 keeps half', 2], ['1 keeps all', 4]];
  const keepDemo = new M.VGroup(...shares.flatMap(([text, count], i) => {
    const x = colx(i);
    const y = P ? -1.6 : -2.08;
    const blocks = Array.from({ length: 4 }, (_, j) => {
      const color = j < count ? C.amber : C.muted;
      const block = new M.Rectangle({ width: 0.29, height: 0.24, color, strokeWidth: 1 });
      block.setFill(color, j < count ? 1 : 0.13);
      return block.moveTo([x + (j - 1.5) * 0.34, y, 0]);
    });
    return [...blocks, label(text, 17, C.ink, x, y - 0.4)];
  }));

  await until(S(10));
  await play(fade(keepDemo), ...note('1 keeps all  ·  0.5 keeps half  ·  0 clears', C.amber));

  await until(S(11));
  await play(out(keepDemo), mark(inputs[0], C.cyan),
    ...note('+ fresh amount from the reading', C.cyan), ...say('ADD SOMETHING FRESH'));

  const early = label('Early clue', 19, C.amber, colx(0), CLUE_Y);
  const carry = new M.Arrow({
    start: [colx(0) + 0.78, CLUE_Y, 0], end: [colx(2) - 0.84, CLUE_Y, 0],
    color: C.amber, strokeWidth: 3
  });
  const later = label('Still here', 19, C.amber, colx(2), CLUE_Y);
  const clue = new M.VGroup(early, carry, later);

  await until(S(12));
  await play(cascade([fade(early), new M.Create(carry, { runTime: 0.35 }), fade(later)]),
    ...say('KEEP AN EARLY CLUE', C.amber), ...note('Short-term clues, kept for a long time', C.amber));

  await until(S(13));
  await play(mark(board, C.amber), ...say(P ? 'LONG SHORT-TERM MEMORY' : 'LONG SHORT-TERM MEMORY  ·  LSTM', C.violet),
    ...note('Long short-term memory = LSTM', C.violet), out(clue));

  const NET_Y = P ? -0.9 : -1.35;
  const R = P ? 0.5 : 0.36;
  const N = net({ layers: [2, 2, 1], center: [CX, NET_Y, 0],
    width: P ? 5.3 : 4.85, height: P ? 2.6 : 1.5, r: R });
  const pos = (l, i) => N.pos(l, i);
  const above = (l, i, text, color) => label(text, 16, color, pos(l, i)[0], pos(l, i)[1] + R + 0.22);
  const below = (l, i, text, color) => label(text, 16, color, pos(l, i)[0], pos(l, i)[1] - R - 0.22);
  const layerY = pos(0, 1)[1] - R - 0.3;
  const layerNames = ['Input layer', 'Hidden layer', 'Output layer'].map((name, i) =>
    label(name, P ? 17 : 17, C.muted, pos(i, 0)[0], layerY));
  const cellLabel = above(0, 0, 'memory cell', C.amber);
  const forgetLabel = above(1, 0, 'forget gate', C.amber);
  const readingLabel = below(0, 1, 'reading', C.cyan);
  const inputGateLabel = below(1, 1, 'input gate', C.cyan);
  const outLabel = below(2, 0, 'prediction', C.amber);
  const node = (layer, i) => N.nodes[layer][i];

  await until(S(14));
  await play(out(board), out(boardNumber), cascade(N.nodes.flat().map(fade)),
    ...say('CIRCLES ARE NEURONS', C.violet), ...note('Circles = neurons', C.violet));

  await until(S(15));
  await play(cascade(layerNames.map(fade)), ...say('THREE LAYERS', C.violet),
    ...note('Input layer → hidden layer → output layer', C.violet));

  await until(S(16));
  await play(cascade(N.edges.flat(2).map(edge => new M.Create(edge, { runTime: 0.3 }))),
    ...note('Weights multiply passing numbers'), ...say('NUMBERS MOVE LEFT TO RIGHT'));

  await until(S(17));
  await play(...N.weight(0, 0, 0, 0.6), ...N.weight(0, 1, 0, -0.6),
    ...note('Cyan: positive   ·   Pink: negative'),
    ...say('NEGATIVE WEIGHTS FLIP THE SIGN', C.pink));

  await until(S(18));
  await play(...N.weight(0, 0, 1, 0.24), ...N.weight(0, 1, 1, 1),
    ...N.weight(1, 0, 0, 0.8), ...N.weight(1, 1, 0, 0.44),
    ...note('Thicker line = bigger weight'), ...say('THICKER LINE, BIGGER WEIGHT'));

  await until(S(19));
  await play(...layerNames.map(out), fade(cellLabel), mark(node(0, 0)),
    ...note('Top input circle = memory cell', C.amber), ...say('THE MEMORY CELL', C.amber));

  await until(S(20));
  await play(mark(node(1, 0), C.violet), mark(node(1, 1), C.violet),
    ...note('A gate gives 0 to 1: how much passes', C.violet), ...say('HIDDEN NEURONS = GATES', C.violet));

  await until(S(21));
  await play(fade(forgetLabel), mark(node(1, 0)), ...note('Top hidden circle = forget gate', C.amber),
    ...say('THE FORGET GATE', C.amber));

  await until(S(22));
  await play(...N.value(1, 0, '1', C.amber), ...note('1 keeps everything', C.amber),
    ...say('1 KEEPS, 0 CLEARS', C.amber));
  await until(S(22) + 1.6);
  await play(...N.value(1, 0, '0', C.amber), ...note('0 clears old memory', C.amber));

  await until(S(23));
  await play(fade(inputGateLabel), mark(node(1, 1), C.cyan), ...note('Bottom hidden circle = input gate', C.cyan),
    ...say('THE INPUT GATE'));

  await until(S(24));
  await play(cascade(inputs.map(input => mark(input, C.cyan))),
    ...note('Fresh amounts: 1, 2, 1', C.cyan), ...say('HERE, FRESH AMOUNT = READING'));

  await until(S(25));
  await play(...N.value(0, 0, '0', C.amber), ...N.value(1, 0, '–', C.muted), mark(node(0, 0)),
    ...note('Old memory: 0', C.amber), ...say('START THE CELL AT ZERO', C.amber));

  await until(S(26));
  await play(...selectCard(0), fade(readingLabel), ...N.value(0, 1, '1', C.cyan),
    ...note('Bottom input circle = reading', C.cyan), ...say('9:00 READING ENTERS THE INPUT'));

  await until(S(27));
  await play(...N.flow(0), ...N.value(1, 0, '1', C.amber),
    ...note('0 × 1 = 0 kept', C.amber), ...say('FORGET GATE = 1', C.amber));

  await until(S(28));
  await play(...N.value(1, 1, '1', C.cyan), ...note('0 kept + 1 fresh = 1', C.amber),
    ...say('ADD THE FRESH AMOUNT'));
  await play(...N.value(0, 0, '1', C.amber), mark(node(0, 0)));

  await until(S(29));
  await play(...selectCard(1), ...N.value(0, 1, '2', C.cyan), ...N.value(1, 1, '–', C.muted), mark(node(0, 0)),
    ...note('Carry 1 forward  ·  New reading: 2', C.amber), ...say('ON TO 9:10'));

  await until(S(30));
  await play(...N.flow(0), mark(node(1, 0), C.amber),
    ...note('Learned weights give 1 here', C.amber), ...say('FORGET GATE STAYS AT 1', C.amber));

  await until(S(31));
  await play(mark(node(1, 0)), ...note('1 × 1 = 1 kept', C.amber), ...say('KEEP ALL THE OLD MEMORY', C.amber));

  await until(S(32));
  await play(...N.value(1, 1, '2', C.cyan), ...note('1 kept + 2 fresh = 3', C.amber),
    ...say('ADD THE FRESH AMOUNT'));
  await play(...N.value(0, 0, '3', C.amber), mark(node(0, 0)));

  await until(S(33));
  await play(...selectCard(2), ...N.value(0, 1, '1', C.cyan), ...N.value(1, 1, '–', C.muted), mark(node(0, 0)),
    ...note('Carry 3 forward  ·  New reading: 1', C.amber), ...say('ON TO 9:20'));

  await until(S(34));
  await play(...N.flow(0), ...N.value(1, 0, '0.5', C.amber),
    ...note('Learned weights give 0.5 here', C.amber), ...say('FORGET GATE = 0.5', C.amber));

  await until(S(35));
  await play(mark(node(1, 0)), ...note('3 × 0.5 = 1.5 kept', C.amber),
    ...say('KEEP HALF THE OLD MEMORY', C.amber));

  await until(S(36));
  await play(...N.value(1, 1, '1', C.cyan), ...note('1.5 kept + 1 fresh = 2.5', C.amber),
    ...say('ADD THE FRESH AMOUNT'));
  await play(...N.value(0, 0, '2.5', C.amber), mark(node(0, 0)));

  const hx = i => P ? colx(i) : SIDE;
  const hy = (i, base) => P ? base : base + 0.55 - i * 0.5;
  const history = new M.VGroup(
    ...[1, 3, 2.5].map((value, i) =>
      label(`${times[i]}  ${value}`, 20, C.amber, hx(i), hy(i, NOTEP[1] + (P ? 0.25 : 0.5)), true)),
    label('Last lesson: 1, 2.5, 2.25', 18, C.muted, NOTEP[0], P ? NOTEP[1] - 0.35 : NOTEP[1] - 0.55, true)
  );

  await until(S(37));
  await play(out(activeCard), ...note(''), fade(history), ...say('A DIFFERENT MEMORY RULE', C.amber));
  activeCard = null;

  await until(S(38));
  await play(out(history), mark(node(0, 0)), ...N.flow(0), fade(outLabel),
    ...note('Output gate: how much of the cell goes on', C.violet), ...say('THE OUTPUT GATE', C.violet));
  await play(...N.flow(1), ...N.value(2, 0, '?', C.amber));

  await until(S(39));
  await play(...note(''), ...fbox([['Old cell × forget gate', C.amber], '3 × 0.5 = 1.5']),
    ...say('FIRST, MULTIPLY', C.amber));

  await until(S(40));
  await play(...fbox(['Old cell × forget gate', ['+ fresh amount', C.cyan], '= new cell', '1.5 + 1 = 2.5']),
    ...say('THEN, ADD'));

  await until(S(41));
  await play(...fbox([]), fade(clue), ...say('WHEN EARLY CLUES STILL MATTER', C.violet),
    ...note('Early clues that matter many steps later', C.violet));

  await until(S(42));
  await play(out(clue), ...note('Temperatures   ·   Speech   ·   Text', C.violet),
    ...say('EARLIER EVENTS SHAPE THE NEXT STEP', C.violet));

  await until(S(43));
  await play(...note('What if the forget gate is 0?', C.amber), mark(node(1, 0)),
    ...say('CHECK WHAT ZERO CLEARS', C.amber));

  await until(S(44));
  await play(...selectCard(2), ...N.value(0, 0, '3', C.amber), ...N.value(1, 1, '–', C.muted),
    ...note('Start with old memory of 3', C.amber), ...say('TRY AGAIN AT 9:20'));

  await until(S(45));
  await play(...N.flow(0), ...N.value(1, 0, '0', C.amber), ...note('3 × 0 = 0 kept', C.amber),
    ...say('CLEAR THE OLD MEMORY', C.amber));

  await until(S(46));
  await play(...N.value(1, 1, '1', C.cyan), mark(node(1, 1), C.cyan), ...note('0 kept + 1 fresh = 1', C.amber),
    ...say('THE FRESH AMOUNT STILL GOES IN'));
  await play(...N.value(0, 0, '1', C.amber), mark(node(0, 0)));

  const fadeY = P ? NOTEP[1] + 0.15 : NOTEP[1] + 0.2;
  const fx = i => P ? colx(i) : SIDE + (i - 1) * 1.5;
  const fadingClue = new M.VGroup(...[1, 0.5, 0.25].flatMap((value, i) => {
    const length = value * 1.24;
    const bar = new M.Rectangle({ width: length, height: 0.18, color: C.amber, strokeWidth: 1 });
    bar.setFill(C.amber, 0.85);
    bar.moveTo([fx(i) - 0.62 + length / 2, fadeY, 0]);
    return [bar, label(String(value), 17, C.amber, fx(i), fadeY - 0.32, true)];
  }));

  await until(S(47));
  await play(out(activeCard), ...note(''), cascade(fadingClue.submobjects.map(fade)),
    ...say('VALUES BELOW 1 FADE EARLY CLUES', C.amber));

  await until(S(48));
  await play(out(fadingClue), mark(node(1, 0), C.amber), mark(node(1, 1), C.cyan),
    ...fbox([['Old cell × forget gate', C.amber], ['+ fresh amount', C.cyan], '= new cell']),
    ...say('KEEP OLD MEMORY, THEN ADD FRESH'));
}
