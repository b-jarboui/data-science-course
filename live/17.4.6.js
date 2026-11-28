// 17.4.6 Teacher forcing: feed the real previous answer during training (script.v4.md).
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
  const NOTEP = P ? [0, -3.8, 0] : [SIDE, -1.35, 0];
  const CARD_Y = P ? 2.35 : 0.93;
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

  // five reading cards
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
  const knownBox = panel((colx(3) + colx(4)) / 2, CARD_Y, PITCH + CW + 0.24, 1.2, C.green, C.green, 0.06);
  const useBox = panel(colx(1), CARD_Y, 2 * PITCH + CW + 0.24, 1.2, C.cyan, C.cyan, 0.06);

  await until(S(0));
  await play(cascade(cards.map(fade)), ...say('TRAIN A NETWORK  ·  CENTRAL'), ...note('Train a network to predict temperatures', C.cyan));

  await until(S(1));
  await play(...say('5 READINGS FROM AN EARLIER DAY'), ...note('Five readings from an earlier day', C.cyan));

  for (let k = 0; k < 5; k++) {
    await until(S(2 + k));
    await play(fade(raw[k]), ...selectCard(k), ...note(`${times[k]} → ${temperatures[k]}°C`, C.cyan));
  }

  await until(S(7));
  await play(out(activeCard), ...note('21 − 20 = 1   ·   24 − 20 = 4', C.amber), ...say('SUBTRACT 20 FROM EACH', C.amber));
  activeCard = null;

  await until(S(8));
  await play(...raw.map(out), ...inputs.map(fade), ...note('1,  2,  1,  3,  4', C.cyan), ...say('1,  2,  1,  3,  4'));

  await until(S(9));
  await play(fade(useBox), fade(knownBox), ...say('FIRST 3 → PREDICT LAST 2', C.amber), ...note('Use 3 readings to predict 2', C.amber));

  await until(S(10));
  await play(mark(knownBox, C.green), ...note('We already know 3 and 4', C.green), ...say('THE ANSWERS ARE KNOWN', C.green));

  await until(S(11));
  await play(...note('So we can check each prediction', C.green));

  // network: 3 readings -> encoder -> 2 decoder steps
  const NET_Y = P ? -0.75 : -1.3;
  const r = P ? 0.5 : 0.42;
  const H = P ? 2.6 : 1.9;
  const N = net({ layers: [3, 1, 2], center: [CX, NET_Y, 0], width: P ? 5.2 : 5.4, height: H, r });
  const node = (l, i) => N.nodes[l][i];
  const baseY = NET_Y - H / 2 - r - 0.32;
  const hRead = label('readings', 17, C.cyan, N.pos(0, 0)[0], baseY);
  const hEnc = label('encoder', 17, C.violet, N.pos(1, 0)[0], baseY);
  const hDec = label('decoder', 17, C.amber, N.pos(2, 0)[0], baseY);
  const p0 = N.pos(2, 0), p1 = N.pos(2, 1);
  const outTags = [
    label('9:30', 17, C.amber, p0[0], p0[1] + r + 0.22, true),
    label('9:40', 17, C.amber, p1[0], p1[1] - r - 0.22, true)
  ];
  const pulse = (l, i, j, col = C.amber) => {
    // flash the real line: ShowPassingFlash removes its own pulse (a copy would stay on screen)
    return new M.ShowPassingFlash(N.edges[l][i][j], { color: col, strokeWidth: 5, timeWidth: 0.5 });
  };

  await until(S(12));
  await play(out(useBox), out(knownBox), cascade(N.nodes.flat().map(fade)),
    cascade(N.edges.flat(2).map(e => new M.Create(e, { runTime: 0.3 }))), ...say('CIRCLES CONNECTED BY LINES', C.violet),
    ...note('Circles = neurons  ·  lines = weights', C.violet));

  await until(S(13));
  await play(fade(hRead), fade(hEnc), ...N.value(0, 0, '1', C.cyan), ...N.value(0, 1, '2', C.cyan), ...N.value(0, 2, '1', C.cyan),
    ...N.flow(0), ...say('ENCODER READS THE PAST', C.violet), ...note('Remember: the encoder reads the past', C.violet));

  await until(S(14));
  await play(...N.value(1, 0, '2.25', C.amber), mark(node(1, 0)), ...note('Encoder holds 2.25', C.amber));

  await until(S(15));
  await play(fade(hDec), cascade(outTags.map(fade)), pulse(1, 0, 0), ...say('DECODER RECEIVES 2.25', C.amber),
    ...note('The decoder makes the predictions', C.amber));

  await until(S(16));
  await play(...note('Decoder rule: add 1 each step', C.amber));

  // method 1: own predictions
  const own = new M.Arrow({ start: [p0[0], p0[1] - r, 0], end: [p1[0], p1[1] + r, 0], color: C.amber, strokeWidth: 3, buff: 0 });

  await until(S(17));
  await play(...note('Method 1: use its own predictions', C.amber), ...say('METHOD 1: OWN PREDICTIONS', C.amber));

  await until(S(18));
  await play(...N.value(2, 0, '3.25', C.amber), ...note('2.25 + 1 = 3.25', C.amber));

  await until(S(19));
  await play(...selectCard(3, C.green), ...note('Predicted 3.25  ·  real 3', C.green));

  await until(S(20));
  await play(mark(node(2, 0), C.pink), ...note('Too high by 0.25', C.pink), ...say('ERROR 0.25', C.pink));

  await until(S(21));
  await play(new M.Create(own, { runTime: 0.45 }), ...note('3.25 goes to the next step', C.amber));

  await until(S(22));
  await play(...N.value(2, 1, '4.25', C.amber), ...note('3.25 + 1 = 4.25', C.amber));

  await until(S(23));
  await play(...selectCard(4, C.green), ...note('Predicted 4.25  ·  real 4', C.green));

  await until(S(24));
  await play(mark(node(2, 1), C.pink), ...note('Also too high by 0.25', C.pink), ...say('ERROR 0.25 AGAIN', C.pink));

  await until(S(25));
  await play(mark(own, C.pink), ...note('The first error passes into the second', C.pink), ...say('THE ERROR IS CARRIED', C.pink));

  // student analogy in the card row
  const stepX = i => CX + (i - 1) * (P ? 2.5 : 2.6);
  const step = (i, title, body, color) => new M.VGroup(
    panel(stepX(i), CARD_Y, P ? 2.3 : 2.4, 0.92, color, C.card, 0.95),
    label(title, 16, color, stepX(i), CARD_Y + 0.22), label(body, 18, C.ink, stepX(i), CARD_Y - 0.17));
  const s1 = step(0, 'Step 1', 'wrong answer', C.pink);
  const s2 = step(1, 'Step 2', 'starts wrong', C.pink);
  const teacher = step(2, 'Teacher', 'right answer', C.green);
  const s2fixed = step(1, 'Step 2', 'starts right', C.green);

  await until(S(26));
  await play(out(activeCard), ...cards.map(out), ...inputs.map(out), fade(s1), ...say('A STUDENT, SEVERAL STEPS', C.violet),
    ...note('A student solves a problem in steps', C.violet));
  activeCard = null;

  await until(S(27));
  await play(fade(s2), ...note('Wrong number carried into step 2', C.pink));

  await until(S(28));
  await play(fade(teacher), ...note('Teacher hands over the correct answer', C.green), ...say('A TEACHER HELPS', C.green));

  await until(S(29));
  await play(out(s2), fade(s2fixed), ...note('Practise step 2 without the old error', C.green));

  await until(S(30));
  await play(out(s1), out(s2fixed), out(teacher), cascade(cards.map(fade)), ...inputs.map(fade),
    ...note('Train the network the same way', C.green), ...say('TRAIN THE NETWORK THE SAME WAY', C.green));

  // method 2: teacher forcing
  await until(S(31));
  await play(out(own), ...N.value(2, 0, '?', C.amber), ...N.value(2, 1, '?', C.amber), ...say('METHOD 2: SAME DECODER, SAME NUMBERS'),
    ...note('Start again: same decoder, same numbers'));

  await until(S(32));
  await play(pulse(1, 0, 0), ...N.value(2, 0, '3.25', C.amber), ...note('2.25 + 1 = 3.25', C.amber));

  await until(S(33));
  await play(...selectCard(3, C.green), mark(node(2, 0), C.pink), ...note('Real 3  ·  error 0.25 is still there', C.pink));

  await until(S(34));
  await play(...say('KEEP THIS ERROR TO LEARN FROM', C.pink), ...note('This error is used for learning', C.pink));

  await until(S(35));
  await play(mark(node(2, 0), C.pink), ...note('Do not send 3.25 on', C.pink), ...say('NOT THE PREDICTION', C.pink));

  // the real 9:30 reading travels from its card into decoder step 2
  const cardBottom = [colx(3), CARD_Y - 0.5, 0];
  const forced = new M.Arrow({ start: cardBottom, end: [p1[0] - r - 0.03, p1[1] + 0.12, 0],
    color: C.green, strokeWidth: 4, buff: 0.04 });
  await until(S(36));
  await play(new M.Create(forced, { runTime: 0.45 }), ...note('Send the real reading: 3', C.green),
    ...say('SEND THE REAL PREVIOUS READING', C.green));

  await until(S(37));
  await play(mark(node(2, 1), C.green), ...note('Step 2 starts with 3', C.green));

  await until(S(38));
  await play(...N.value(2, 1, '4', C.green), ...note('3 + 1 = 4', C.green));

  await until(S(39));
  await play(...selectCard(4, C.green), ...note('Real answer: 4', C.green));

  await until(S(40));
  await play(mark(node(2, 1), C.green), ...say('SECOND PREDICTION: NO ERROR', C.green), ...note('No error at 9:40', C.green));

  await until(S(41));
  await play(...note('Real previous answer, not the predicted one', C.green), ...say('TEACHER FORCING', C.green));

  await until(S(42));
  await play(out(activeCard), ...note('Two methods, side by side'), ...say('THE TWO METHODS SIDE BY SIDE'),
    ...fbox(['                  9:30   9:40']));
  activeCard = null;

  await until(S(43));
  await play(...fbox(['                  9:30   9:40', ['Own predictions:  3.25   4.25', C.amber]]));

  await until(S(44));
  await play(...fbox(['                  9:30   9:40', ['Own predictions:  3.25   4.25', C.amber], ['Teacher forcing:  3.25   4', C.green]]));

  await until(S(45));
  await play(...say('THE SECOND PREDICTION AS A FORMULA'), ...note('The second prediction as a formula'));

  await until(S(46));
  await play(...fbox([['next prediction =', C.green], '  real previous reading + 1', '  = 3 + 1 = 4']));

  await until(S(47));
  await play(mark(forced, C.green), ...note('“+ 1” is only our example’s rule', C.amber),
    ...say('TEACHER FORCING PICKS THE INPUT', C.green));

  await until(S(48));
  await play(...note('Each step learns without old errors', C.green));

  await until(S(49));
  await play(...fbox([]), out(forced), ...note('Tomorrow: no real answers yet', C.amber),
    ...say('PREDICTING THE REAL FUTURE', C.amber));

  await until(S(50));
  const own2 = new M.Arrow({ start: [p0[0], p0[1] - r, 0], end: [p1[0], p1[1] + r, 0], color: C.amber, strokeWidth: 3, buff: 0 });
  await play(new M.Create(own2, { runTime: 0.45 }), ...N.value(2, 1, '4.25', C.amber), ...note('Use its own predictions again', C.amber));

  await until(S(51));
  await play(mark(own2, C.pink), ...note('Only teacher forcing → weak with own errors', C.pink), ...say('A RISK', C.pink));

  await until(S(52));
  await play(...note('Also test without the real answers'), ...say('TEST WITHOUT HELP'));

  await until(S(53));
  const forced2 = new M.Arrow({ start: cardBottom, end: [p1[0] - r - 0.03, p1[1] + 0.12, 0],
    color: C.green, strokeWidth: 4, buff: 0.04 });
  await play(out(own2), ...N.value(2, 1, '4', C.green), new M.Create(forced2, { runTime: 0.45 }),
    ...note('Training: feed the real previous answer', C.green), ...say('TEACHER FORCING: REAL PREVIOUS ANSWER', C.green));
}
