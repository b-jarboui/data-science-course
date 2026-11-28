// 17.4.5 Sequence-to-sequence models: encoder reads, decoder predicts (script.v4.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const times = ['9:00', '9:10', '9:20'];
  const temperatures = [21, 22, 21];
  const readings = [1, 2, 1];
  const CX = P ? 0 : -2.6;
  const SIDE = 4.35;                                   // laptop: right-hand panel
  const PILL = [CX, P ? 3.55 : 1.85, 0];
  const BOXP = P ? [0, -5.3, 0] : [SIDE, 0.55, 0];
  const NOTEP = P ? [0, -3.8, 0] : [SIDE, -1.35, 0];
  const CARD_Y = P ? 2.35 : 0.93;
  const colx = i => CX + (i - 1) * (P ? 2.19 : 2.25);
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

  // reading cards
  const cardFrames = times.map((_, i) => panel(colx(i), CARD_Y, 1.84, 0.92, C.cyan, C.cyan, 0.16));
  const cards = times.map((t, i) => new M.VGroup(cardFrames[i], label(t, 16, C.cyan, colx(i), CARD_Y + 0.22, true)));
  const cardValue = (s, i) => label(s, 24, C.ink, colx(i), CARD_Y - 0.19, true);
  const raw = temperatures.map((v, i) => cardValue(`${v}°C`, i));
  const inputs = readings.map((v, i) => cardValue(`+${v}°C`, i));
  let activeCard = null;
  function selectCard(i) {
    const o = panel(colx(i), CARD_Y, 1.97, 1.05, C.amber, C.card, 0);
    const a = activeCard ? [out(activeCard)] : [];
    a.push(fade(o)); activeCard = o; return a;
  }
  const lineY = P ? -0.5 : -1.0;
  const sensor = new M.VGroup(
    panel(CX, lineY, P ? 3.6 : 3.4, 0.92, C.cyan, C.cyan, 0.12),
    label('Sensor at Central', 20, C.cyan, CX, lineY));

  const arrow = new M.Arrow({ start: [colx(0) - 0.9, lineY, 0], end: [colx(2) + 0.9, lineY, 0], color: C.muted, strokeWidth: 3 });
  const arrowTag = label('order they arrive', 17, C.muted, CX, lineY - 0.38);

  await until(S(0));
  await play(cascade(cards.map(fade)), ...say('PREDICT PLATFORM TEMPERATURES'),
    ...note('Predict platform temperatures', C.cyan));

  await until(S(1));
  await play(...say('CENTRAL  ·  NEXT 20 MINUTES', C.amber), ...note('How warm in the next 20 minutes?', C.amber));

  await until(S(2));
  await play(fade(sensor), ...note('A reading every 10 minutes'));

  await until(S(3));
  await play(out(sensor), fade(raw[0]), ...selectCard(0), ...note('9:00 → 21°C', C.cyan));

  await until(S(4));
  await play(fade(raw[1]), ...selectCard(1), ...note('9:10 → 22°C', C.cyan));

  await until(S(5));
  await play(fade(raw[2]), ...selectCard(2), ...note('9:20 → 21°C', C.cyan));

  await until(S(6));
  await play(out(activeCard), new M.Create(arrow, { runTime: 0.4 }), fade(arrowTag), ...say('IN ORDER ON A LINE'),
    ...note('In the order they arrive'));
  activeCard = null;

  await until(S(7));
  await play(cascade(cards.map(c => mark(c, C.cyan))), ...say('SEQUENCE = NUMBERS IN ORDER', C.violet),
    ...note('Numbers in order = a sequence', C.violet));

  await until(S(8));
  await play(...note('Next: 9:30 and 9:40 ?', C.amber), ...say('PREDICT THE NEXT TWO', C.amber));

  await until(S(9));
  await play(...note('21 − 20 = 1   ·   22 − 20 = 2', C.amber), ...say('SUBTRACT 20 FROM EACH', C.amber));

  await until(S(10));
  await play(...raw.map(out), ...inputs.map(fade), ...note('Sequence: 1, 2, 1', C.cyan), ...say('SEQUENCE: 1,  2,  1'));

  // story reader
  const bx = P ? 1.45 : 1.6;
  const book = new M.VGroup(
    panel(CX - bx, lineY, 1.6, 1.1, C.violet, C.violet, 0.15),
    label('story', 19, C.violet, CX - bx, lineY));
  const guess = new M.VGroup(
    panel(CX + bx, lineY, 1.6, 1.1, C.amber, C.amber, 0.15),
    label('what next?', 17, C.amber, CX + bx, lineY));
  const bookArrow = new M.Arrow({ start: [CX - 0.6, lineY, 0], end: [CX + 0.6, lineY, 0], color: C.ink, strokeWidth: 3 });

  await until(S(11));
  await play(out(arrow), out(arrowTag), fade(book), ...note('Read and remember the key facts', C.violet), ...say('READ A SHORT STORY', C.violet));

  await until(S(12));
  await play(new M.Create(bookArrow, { runTime: 0.35 }), fade(guess), ...note('Then say what happens next', C.amber));

  await until(S(13));
  await play(...note('Our network works the same way'), ...say('OUR NETWORK DOES THE SAME'));

  // network: 3 reading circles -> encoder state -> 2 prediction circles
  const NET_Y = P ? -0.75 : -1.3;
  const r = P ? 0.5 : 0.42;
  const H = P ? 2.6 : 1.9;
  const N = net({ layers: [3, 1, 2], center: [CX, NET_Y, 0], width: P ? 5.2 : 5.4, height: H, r });
  const node = (l, i) => N.nodes[l][i];
  const baseY = NET_Y - H / 2 - r - 0.32;
  const colName = (l, text, color) => label(text, 17, color, N.pos(l, 0)[0], baseY);
  const hRead = colName(0, 'readings', C.cyan);
  const hEnc = colName(1, 'encoder', C.violet);
  const hDec = colName(2, 'decoder', C.amber);
  const outTags = [
    label('9:30', 17, C.amber, N.pos(2, 0)[0], N.pos(2, 0)[1] + r + 0.22, true),
    label('9:40', 17, C.amber, N.pos(2, 1)[0], N.pos(2, 1)[1] - r - 0.22, true)
  ];
  const pulse = (l, i, j, col = C.amber) => {
    // flash the real line: ShowPassingFlash removes its own pulse (a copy would stay on screen)
    return new M.ShowPassingFlash(N.edges[l][i][j], { color: col, strokeWidth: 5, timeWidth: 0.5 });
  };

  await until(S(14));
  await play(out(book), out(guess), out(bookArrow), cascade(N.nodes.flat().map(fade)),
    cascade(N.edges.flat(2).map(e => new M.Create(e, { runTime: 0.3 }))), ...say('TWO GROUPS OF CIRCLES', C.violet),
    ...note('One group reads, one group predicts', C.violet));

  await until(S(15));
  await play(fade(hRead), ...N.value(0, 0, '1', C.cyan), ...N.value(0, 1, '2', C.cyan), ...N.value(0, 2, '1', C.cyan),
    ...N.flow(0), ...say('FIRST GROUP READS THE NUMBERS'), ...note('It carries information forward', C.cyan));

  await until(S(16));
  await play(fade(hEnc), mark(node(1, 0), C.violet), ...say('ENCODER', C.violet), ...note('This part = the encoder', C.violet));

  await until(S(17));
  await play(...note('Carried number = hidden state', C.amber), ...say('HIDDEN STATE', C.amber));

  await until(S(18));
  await play(...N.value(1, 0, '0', C.amber), ...note('Start: hidden state 0', C.amber));

  await until(S(19));
  await play(...note('Keep half the old state, add the new number', C.amber), ...say('THE ENCODER RULE', C.violet));

  // step 1
  await until(S(20));
  await play(...selectCard(0), mark(node(0, 0), C.cyan), pulse(0, 0, 0, C.cyan), ...say('READING 1 BRINGS 1'),
    ...note('First reading: 1', C.cyan));

  await until(S(21));
  await play(...note('0 × 0.5 = 0', C.amber));

  await until(S(22));
  await play(...N.value(1, 0, '1', C.amber), ...note('0 + 1 = 1', C.amber), ...say('STATE = 1', C.amber));

  // step 2
  await until(S(23));
  await play(...selectCard(1), mark(node(0, 1), C.cyan), pulse(0, 1, 0, C.cyan), ...note('Second reading: 2', C.cyan),
    ...say('READING 2 BRINGS 2'));

  await until(S(24));
  await play(...note('1 × 0.5 = 0.5', C.amber));

  await until(S(25));
  await play(...N.value(1, 0, '2.5', C.amber), ...note('0.5 + 2 = 2.5', C.amber), ...say('STATE = 2.5', C.amber));

  // step 3
  await until(S(26));
  await play(...selectCard(2), mark(node(0, 2), C.cyan), pulse(0, 2, 0, C.cyan), ...note('Third reading: 1', C.cyan),
    ...say('READING 3 BRINGS 1'));

  await until(S(27));
  await play(...note('2.5 × 0.5 = 1.25', C.amber));

  await until(S(28));
  await play(...N.value(1, 0, '2.25', C.amber), ...note('1.25 + 1 = 2.25', C.amber), ...say('STATE = 2.25', C.amber));

  await until(S(29));
  await play(out(activeCard), mark(node(1, 0)), ...note('Summary of the past: 2.25', C.amber), ...say('THE ENCODER’S SUMMARY', C.amber));
  activeCard = null;

  await until(S(30));
  await play(...N.flow(1), ...note('2.25 goes along the lines'), ...say('PASS IT ALONG THE LINES'));

  await until(S(31));
  await play(cascade([mark(node(2, 0)), mark(node(2, 1))]), ...say('MAKE A NEW SEQUENCE', C.amber),
    ...note('A new sequence comes out', C.amber));

  await until(S(32));
  await play(fade(hDec), cascade(outTags.map(fade)), ...say('DECODER', C.amber), ...note('This part = the decoder', C.amber));

  await until(S(33));
  await play(...note('Its own rule: add 1 each step', C.amber));

  await until(S(34));
  await play(pulse(1, 0, 0), ...note('Start from 2.25', C.amber), ...say('START WITH THE SUMMARY', C.amber));

  await until(S(35));
  await play(...N.value(2, 0, '3.25', C.amber), ...note('2.25 + 1 = 3.25', C.amber));

  await until(S(36));
  await play(mark(node(2, 0)), ...say('A PREDICTION ABOUT THE FUTURE', C.amber), ...note('First prediction: 3.25', C.amber));

  await until(S(37));
  await play(...note('3.25 + 20', C.amber), ...say('ADD 20 BACK'));

  await until(S(38));
  await play(...note('9:30 prediction: 23.25°C', C.amber), ...say('9:30  →  23.25°C', C.amber));

  // feedback arrow from prediction 1 to prediction 2
  const p0 = N.pos(2, 0), p1 = N.pos(2, 1);
  const loop = new M.Arrow({ start: [p0[0], p0[1] - r, 0], end: [p1[0], p1[1] + r, 0], color: C.amber, strokeWidth: 3, buff: 0 });

  await until(S(39));
  await play(new M.Create(loop, { runTime: 0.45 }), ...note('Its own prediction, 3.25, is the next start', C.amber), ...say('USE ITS OWN PREDICTION', C.amber));

  await until(S(40));
  await play(...N.value(2, 1, '4.25', C.amber), ...note('3.25 + 1 = 4.25', C.amber));

  await until(S(41));
  await play(...note('9:40 prediction: 24.25°C', C.amber), ...say('9:40  →  24.25°C', C.amber));

  await until(S(42));
  await play(cascade([mark(node(2, 0)), mark(node(2, 1))]), ...note('3 readings in  ·  2 predictions out'), ...say('TWO PREDICTIONS'));

  await until(S(43));
  await play(...note('Compare with the real temperatures', C.green), ...say('COMPARE WITH THE REAL READINGS', C.green),
    ...fbox(['       predicted   real'], C.green));

  await until(S(44));
  await play(...note('9:30: real 23°C', C.green), mark(node(2, 0), C.green),
    ...fbox(['       predicted   real', ['9:30   23.25°C     23°C', C.green]], C.green));

  await until(S(45));
  await play(...note('9:40: real 24°C', C.green), mark(node(2, 1), C.green),
    ...fbox(['       predicted   real', ['9:30   23.25°C     23°C', C.green], ['9:40   24.25°C     24°C', C.green]], C.green));

  await until(S(46));
  await play(...note('Both predictions 0.25 too high', C.pink), ...say('SLIGHTLY TOO HIGH', C.pink));

  await until(S(47));
  await play(...note(''), ...fbox([['Two short formulas', C.violet]], C.violet), ...say('TWO SHORT FORMULAS'));

  await until(S(48));
  await play(...fbox([['encoder state =', C.violet], '  old × 0.5 + new reading']));

  await until(S(49));
  await play(...fbox([['encoder state =', C.violet], '  old × 0.5 + new reading', ['next prediction =', C.amber], '  previous number + 1']));

  await until(S(50));
  await play(mark(node(1, 0), C.violet), ...say(P ? 'SEQUENCE-TO-SEQUENCE' : 'SEQUENCE-TO-SEQUENCE MODEL', C.violet),
    ...note('One sequence in, another sequence out', C.violet));

  await until(S(51));
  await play(...note('Past readings → several future readings'), ...say('PREDICT SEVERAL STEPS'));

  await until(S(52));
  await play(mark(loop, C.pink), ...note('An error at 9:30 flows into 9:40', C.pink), ...say('ERRORS CAN CARRY FORWARD', C.pink));

  await until(S(53));
  await play(...note('Training learns better rules than “add 1”'), ...say('REAL MODELS LEARN THEIR RULES', C.violet));

  await until(S(54));
  await play(...note('Encoder reads the past · decoder predicts', C.violet), mark(node(1, 0), C.violet), mark(node(2, 1)),
    ...say('ENCODER: PAST  ·  DECODER: FUTURE', C.violet));
}
