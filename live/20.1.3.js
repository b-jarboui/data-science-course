// 20.1.3 Sequence packing. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const DOCS = [
    ['Library', 'opens', 'at', 'nine'],
    ['Pool', 'closed', 'today'],
    ['Exams', 'start'],
  ];
  const NAMES = ['A', 'B', 'C'];
  const END = '<end>';
  const SIZE = 12;
  const COLS = 6;
  // Laptop: trays left, formula box right. Phone: trays stacked down the whole height, box above or below.
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.48, 0] : [CX, 1.87, 0];
  let BOXP = P ? [0, 3.58, 0] : [4.45, -0.3, 0];
  const Y = P ? [0.55, -1.95, -4.45] : [0.55, -1.0, -2.55];
  const DX = P ? 1.12 : 1.18;
  const DY = P ? 0.72 : 0.55;
  const W = DX - 0.08;
  const H = DY - 0.07;

  const say = (s, color = C.cyan) => showA(s, color, PILL);
  const fadeIn = items => items.map(item => new M.FadeIn(item, { runTime: 0.4 }));
  const fadeOut = items => items.map(item => new M.FadeOut(item, { runTime: 0.3 }));
  const arrive = items => new M.LaggedStart(
    items.map(item => new M.FadeIn(item, { shift: [0, 0.13, 0], runTime: 0.35 })),
    { lagRatio: 0.12, runTime: 0.8 }
  );

  function rounded(w, h, at, stroke, fill = C.card, opacity = 0.92) {
    const r = new M.RoundedRectangle({
      width: w, height: h, cornerRadius: 0.09, color: stroke, strokeWidth: 2,
    });
    r.setFill(fill, opacity);
    return r.moveTo(at);
  }

  function label(s, size, at, color = C.ink, maxWidth = FW - 1) {
    const t = T(s, size, color, false, true);
    t._k = 1;
    if (t.getWidth() > maxWidth) { t._k = maxWidth / t.getWidth(); t.scale(t._k); }
    return t.moveTo(at);
  }

  let boxNow = null;
  function clearBox() {
    const animations = boxNow ? fadeOut([boxNow]) : [];
    boxNow = null;
    return animations;
  }

  function fbox(lines, color = C.cyan) {
    const maxWidth = P ? FW - 0.8 : 4.6;
    const lh = P ? 0.48 : 0.44;
    const texts = lines.map(line => {
      const [s, ink] = Array.isArray(line) ? line : [line, C.ink];
      const t = T(s, P ? 22 : 21, ink, true);
      t._k = 1;
      if (t.getWidth() > maxWidth - 0.54) { t._k = (maxWidth - 0.54) / t.getWidth(); t.scale(t._k); }
      return t;
    });
    const tw = t => t.getWidth() * t._k;
    const w = Math.max(...texts.map(tw)) + 0.54;
    const h = lines.length * lh + 0.32;
    const [x, y] = BOXP;
    const rim = rounded(w, h, BOXP, color);
    texts.forEach((t, i) => {
      t.moveTo([x - w / 2 + 0.27 + tw(t) / 2, y + ((lines.length - 1) / 2 - i) * lh, 0]);
    });
    const g = new M.VGroup(rim, ...texts);
    const animations = [...clearBox(), ...fadeIn([g])];
    boxNow = g;
    return animations;
  }

  const line = (start, end, color, strokeWidth = 2) => new M.Line({ start, end, color, strokeWidth });
  const slot = (y, i) => [
    CX + (i % COLS - (COLS - 1) / 2) * DX,
    y + (0.5 - Math.floor(i / COLS)) * DY,
    0,
  ];

  function token(word, at, w = W) {
    const padding = word === 'pad';
    const color = padding || word === END ? C.amber : C.cyan;
    const rim = rounded(w, H, at, color, color, padding ? 0.08 : 0.20);
    if (padding) rim.setStrokeOpacity(0.6);
    return new M.VGroup(rim, label(word, P ? 19 : 17, at, color, w - 0.12));
  }

  function slots(y) {
    return Array.from({ length: SIZE }, (_, i) =>
      rounded(W, H, slot(y, i), C.line, C.bg, 0.68));
  }

  function tray(y) {
    const rim = rounded(COLS * DX + 0.14, 2 * DY + 0.10, [CX, y, 0], C.muted);
    return new M.VGroup(rim, ...slots(y));
  }

  const words = i => [...DOCS[i], END];
  const tokensAt = (list, y, start = 0) => list.map((word, i) => token(word, slot(y, start + i)));
  const padAt = (y, start) => tokensAt(Array(SIZE - start).fill('pad'), y, start);
  const caption = (s, y, c = C.ink) => label(s, P ? 19 : 17, [CX, y + DY + 0.21, 0], c);

  // The campus newsletters become word cards.
  const PK = P ? 1.35 : 1;
  function paper(x, y) {
    const rim = rounded(1.45 * PK, 1.68 * PK, [x, y, 0], C.muted);
    const lines = [0.38, 0.1, -0.18].map((dy, i) =>
      line([x - 0.47 * PK, y + dy * PK, 0], [x + (i === 2 ? 0.12 : 0.47) * PK, y + dy * PK, 0], C.cyan));
    return new M.VGroup(rim, ...lines);
  }

  const papers = (P ? [[-1.2, 0.4], [1.2, 0.2], [-1.2, -2.2], [1.2, -2.4]] : [[-2.13, -0.13], [-0.71, 0.13], [0.71, -0.13], [2.13, 0.13]])
    .map(([x, y]) => paper(CX + x, y));
  const sketchY = P ? -4.7 : -1.6;
  const sketch = [true, true, true, false, false, false].map((used, i) =>
    rounded(P ? 0.95 : 0.64, P ? 0.66 : 0.45, [CX + (i - 2.5) * (P ? 1.08 : 0.72), sketchY, 0],
      used ? C.cyan : C.muted, used ? C.cyan : C.bg, used ? 0.30 : 0.65));
  const sketchNote = label('3 words, 3 empty spaces', P ? 21 : 18, [CX, sketchY - (P ? 0.8 : 0.6), 0], C.amber);

  await until(S(0)); await play(arrive(papers), ...say('CAMPUS NEWSLETTERS'));
  await until(S(1)); await play(arrive([...sketch, sketchNote]), ...say('WORDS AND EMPTY SPACES', C.amber));
  await until(S(2)); await play(...say('HOW CAN WE FIT MORE TEXT?', C.amber));

  const sheetY = P ? [0.5, -1.95, -4.4] : [0.7, -0.75, -2.2];
  const SH = P ? 1.75 : 1.25;
  const sheetNames = NAMES.map((name, i) =>
    label(`Newsletter ${name}`, P ? 19 : 17, [CX, sheetY[i] + SH / 2 - 0.27, 0], C.muted));
  const sheetRims = sheetY.map(y => rounded(P ? 7.2 : 6.6, SH, [CX, y, 0], C.line));
  const sheetText = DOCS.map((doc, i) =>
    label(doc.join(' '), P ? 25 : 22, [CX, sheetY[i] - 0.18, 0], C.ink, 5.7));

  await until(S(3)); await play(...fadeOut([...papers, ...sketch, sketchNote]), ...fadeIn([...sheetRims, ...sheetNames]),
    ...say('THREE NEWSLETTERS'));
  await until(S(4)); await play(...fadeIn([sheetText[0]]), ...say('NEWSLETTER A'));
  await until(S(5)); await play(...fadeIn([sheetText[1]]), ...say('NEWSLETTER B'));
  await until(S(6)); await play(...fadeIn([sheetText[2]]), ...say('NEWSLETTER C'));

  const docAt = (i, j) => [CX + (j - 2) * DX, sheetY[i] - 0.18, 0];
  const docCards = DOCS.map((doc, i) => doc.map((word, j) => token(word, docAt(i, j))));
  const ends = DOCS.map((doc, i) => token(END, docAt(i, doc.length)));
  const first = docAt(0, 0);
  const tokenRim = rounded(W + 0.07, H + 0.08, first, C.cyan, C.bg, 0);

  await until(S(7)); await play(...fadeOut(sheetText), arrive(docCards.flat()), ...say('ONE WORD PER CARD'));
  await until(S(8)); await play(new M.Create(tokenRim, { runTime: 0.45 }), ...say('ONE CARD HOLDS ONE TOKEN'));
  await until(S(9)); await play(...fadeOut([tokenRim]), ...say('HERE, EACH WORD IS ONE TOKEN'));

  const splitY = P ? -6.1 : -0.22;
  const splitX = P ? CX : 4.45;
  const splitWord = label('Library', P ? 21 : 19, [splitX, splitY + (P ? 0.6 : 0.5), 0], C.ink);
  const splitCards = ['Lib', 'rary'].map((s, i) => token(s, [splitX + (i - 0.5) * DX, splitY - 0.05, 0]));
  await until(S(10)); await play(...fadeIn([splitWord, ...splitCards]), ...say('A WORD CAN SPLIT INTO TOKENS', C.violet));
  await until(S(11)); await play(...fadeOut([splitWord, ...splitCards]), arrive(ends), ...say('AN ORANGE CARD AT EACH END', C.amber));
  await until(S(12)); await play(...say('END TOKEN: THIS NEWSLETTER ENDS HERE', C.amber));
  await until(S(13)); await play(...say('EACH END TOKEN USES ONE SPACE', C.amber));

  // the count sits on the title row of each sheet, right side (never on the cards)
  const docCounts = DOCS.map((doc, i) =>
    label(`${doc.length + 1} tokens`, P ? 19 : 17, [CX + (P ? 2.5 : 2.4), sheetY[i] + SH / 2 - 0.27, 0], C.amber, 1.6));
  await until(S(14)); await play(...fadeIn([docCounts[0]]), ...say('A HAS 5 TOKENS'));
  await until(S(15)); await play(...fadeIn([docCounts[1]]), ...say('B HAS 4 TOKENS'));
  await until(S(16)); await play(...fadeIn([docCounts[2]]), ...say('C HAS 3 TOKENS'));

  // Show the space and the network before putting cards in the trays.
  const emptySlots = slots(Y[1]);
  await until(S(17)); await play(
    ...fadeOut([...sheetRims, ...sheetNames, ...docCards.flat(), ...ends, ...docCounts]),
    arrive(emptySlots), ...say('12 TOKEN SPACES'));
  await until(S(18)); await play(...say('ONE TRAINING BLOCK'));

  function network(y, x = CX, w = P ? 6.0 : 5.6, h = P ? 3.4 : 2.6) {
    const N = net({ layers: [3, 3, 2], center: [x, y, 0], width: w, height: h, r: P ? 0.36 : 0.32 });
    const sampleWeights = [0.7, -0.35, 0.2, -0.6, 0.45, 0.3];
    N.edges.flat(2).forEach((edge, i) => {
      const w = sampleWeights[i % sampleWeights.length];
      edge.setColor(w < 0 ? C.pink : C.cyan);
      edge.setStrokeWidth(1.5 + 4 * Math.abs(w));
      edge.setStrokeOpacity(0.35 + 0.6 * Math.abs(w));
    });
    return N;
  }

  const N = network(P ? -2.0 : -0.6, P ? 0 : -1.4);
  await until(S(19)); await play(...fadeOut(emptySlots), ...fadeIn([N.group]), ...say('NEURONS IN LAYERS, JOINED BY WEIGHTS'));
  await until(S(20));
  const values = [1, 2, 3].flatMap((v, i) => N.value(0, i, v));
  await play(...values, ...say('THE BLOCK ENTERS AS NUMBERS'), ...fbox(['Example token numbers', '1, 2, 3']));
  await play(...N.flow(0));
  await play(...N.flow(1));

  const trays = Y.map(tray);
  const separate = NAMES.map((_, i) => tokensAt(words(i), Y[i]));
  const pads = NAMES.map((_, i) => padAt(Y[i], words(i).length));
  const names = NAMES.map((name, i) => caption(`Newsletter ${name}`, Y[i]));
  const counts = NAMES.map((name, i) => {
    const n = words(i).length;
    return caption(`${name}  ·  ${n} useful  ·  ${SIZE - n} padding`, Y[i]);
  });
  const aEmpty = caption('A  ·  5 useful  ·  7 empty', Y[0]);

  await until(S(21)); await play(...fadeOut([N.group, ...values.map(a => a.mobject)]),
    ...clearBox(), ...fadeIn(trays), ...say('A TRAY WITH 12 SPACES'));
  await until(S(22)); await play(arrive(separate[0]), ...fadeIn([names[0]]), ...say('PLACE NEWSLETTER A'));
  await until(S(23)); await play(...fadeOut([names[0]]), ...fadeIn([aEmpty]), ...say('5 FILLED, 7 EMPTY'));
  await until(S(24)); await play(arrive(pads[0]), ...fadeOut([aEmpty]), ...say('FILL THE 7 EMPTY SPACES', C.amber));
  await until(S(25)); await play(...fadeIn([counts[0]]), ...say('FILLER CARDS = PADDING TOKENS', C.amber));
  await until(S(26)); await play(...fadeIn([names[1]]), arrive(separate[1]), ...say('PLACE NEWSLETTER B'));
  await until(S(27)); await play(arrive(pads[1]), ...fadeOut([names[1]]), ...fadeIn([counts[1]]),
    ...say('4 USEFUL, 8 PADDING', C.amber));
  await until(S(28)); await play(...fadeIn([names[2]]), arrive(separate[2]), ...say('PLACE NEWSLETTER C'));
  await until(S(29)); await play(arrive(pads[2]), ...fadeOut([names[2]]), ...fadeIn([counts[2]]),
    ...say('3 USEFUL, 9 PADDING', C.amber));

  await until(S(30)); await play(...say('COUNT THE SPACES'), ...fbox(['Available spaces', ['12 + 12 + 12 = 36', C.cyan]]));
  await until(S(31)); await play(...say('COUNT THE USEFUL TOKENS'), ...fbox(['Useful tokens', ['5 + 4 + 3 = 12', C.cyan]]));
  await until(S(32)); await play(...say('COUNT THE PADDING', C.amber),
    ...fbox(['Padding', ['7 + 8 + 9 = 24', C.amber]], C.amber));
  await until(S(33)); await play(...say('TWO THIRDS IS PADDING', C.amber),
    ...fbox(['Padding ÷ available spaces', ['24 ÷ 36 = ⅔', C.amber]], C.amber));
  await until(S(34)); await play(...say('CAN WE USE THE SPACES BETTER?', C.amber));

  // Place the three newsletters in one tray, in reading order.
  const packedY = P ? -0.9 : 0.3;
  const packed = tray(packedY);
  const allWords = NAMES.flatMap((_, i) => words(i));
  const packedCards = tokensAt(allWords, packedY);

  await until(S(35));
  if (P) BOXP = [0, -3.9, 0];
  await play(...clearBox(), ...fadeOut([...trays, ...separate.flat(), ...pads.flat(), ...counts]),
    ...fadeIn([packed]), arrive(packedCards.slice(0, 5)), ...say('A GOES IN FIRST'),
    ...fbox(['Spaces used', ['5 of 12', C.cyan]]));
  await until(S(36)); await play(arrive(packedCards.slice(5, 9)), ...say('B GOES AFTER A’S END TOKEN'));
  await until(S(37)); await play(...say('9 SPACES FILLED'), ...fbox(['Spaces used', ['5 + 4 = 9 of 12', C.cyan]]));
  await until(S(38)); await play(arrive(packedCards.slice(9)), ...say('C GOES AFTER B’S END TOKEN'));
  await until(S(39)); await play(...say('ALL 12 SPACES FILLED'),
    ...fbox([['5 + 4 + 3 = 12 of 12', C.cyan], '0 padding']));
  await until(S(40)); await play(...say('SEQUENCE PACKING'), ...fbox(['3 newsletters in 1 block']));

  const packedNet = P ? network(-4.5, 0, 6.0, 2.6) : network(-0.3, 4.3, 3.8, 2.4);
  await until(S(41));
  const packedValues = [1, 2, 3].flatMap((v, i) => packedNet.value(0, i, v));
  await play(...clearBox(), ...fadeIn([packedNet.group]), ...packedValues, ...say('SEND ONE BLOCK INTO THE NETWORK'));
  await play(...packedNet.flow(0));
  await play(...packedNet.flow(1));
  await until(S(42)); await play(...fadeOut([packedNet.group, ...packedValues.map(a => a.mobject)]),
    ...say('HOW WELL DID WE USE THE SPACES?'));
  await until(S(43)); await play(...say('PERCENTAGE OF USEFUL SPACES'),
    ...fbox(['Useful spaces (%) =', ['useful tokens', C.cyan], ['÷ available spaces', C.cyan], ['× 100', C.cyan]]));
  await until(S(44)); await play(...say('BEFORE PACKING'),
    ...fbox(['12 useful tokens in 36 spaces', ['12 ÷ 36 × 100 ≈ 33%', C.cyan]]));
  await until(S(45)); await play(...say('AFTER PACKING'),
    ...fbox(['12 useful tokens in 12 spaces', ['12 ÷ 12 × 100 = 100%', C.cyan]]));
  await until(S(46)); await play(...say('LESS PADDING, FEWER BLOCKS', C.green),
    ...fbox(['Before: 3 blocks, 24 padding', ['After:  1 block, 0 padding', C.green]], C.green));

  // Remove only A's marker, close the gap, then restore the boundary.
  const boundaryY = P ? -2.0 : 0.3;
  const boundaryTray = tray(boundaryY);
  const boundaryCards = tokensAt(allWords, boundaryY);
  const shifted = tokensAt(allWords.slice(5), boundaryY, 4);
  const [nine, pool] = [slot(boundaryY, 3), slot(boundaryY, 4)];
  const pair = rounded(2 * DX + 0.01, H + 0.10,
    [(nine[0] + pool[0]) / 2, nine[1], 0], C.pink, C.bg, 0);

  await until(S(47));
  if (P) BOXP = [0, -5.4, 0];
  await play(...fadeOut([packed, ...packedCards]), ...clearBox(),
    ...fadeIn([boundaryTray, ...boundaryCards]), ...fbox(['Each <end> card shows', ['where a newsletter ends', C.amber]], C.amber),
    ...say('ORANGE CARDS MARK THE ENDS', C.amber));
  await until(S(48)); await play(...fadeOut(boundaryCards.slice(4)), arrive(shifted),
    ...fbox(['First end token removed', ['A and B now run together', C.pink]], C.pink), ...say('REMOVE THE FIRST END TOKEN', C.pink));
  await until(S(49)); await play(new M.Create(pair, { runTime: 0.4 }), ...say('LIBRARY OPENS AT NINE POOL CLOSED TODAY', C.pink));
  await until(S(50)); await play(...say('WHAT FOLLOWS “NINE”?', C.pink),
    ...fbox([['nine → Pool', C.pink], 'The document break is missing'], C.pink));

  const restored = tokensAt(allWords.slice(4), boundaryY, 4);
  await until(S(51)); await play(...fadeOut([pair, ...shifted]), ...clearBox(), arrive(restored),
    ...say('KEEP THE END TOKENS', C.amber));

  const linkY = P ? -4.6 : -2.3;
  const zoomY = linkY + 0.66;
  const zoom = ['nine', END, 'Pool'].map((s, i) => token(s, [CX + (i - 1) * 1.55, zoomY, 0], 1.3));
  const left = CX - 1.55, right = CX + 1.55;
  const blocked = [
    new M.DashedLine({ start: [left, linkY, 0], end: [CX - 0.20, linkY, 0], color: C.pink }),
    new M.DashedLine({ start: [CX + 0.20, linkY, 0], end: [right, linkY, 0], color: C.pink }),
    line([left, linkY, 0], [left, zoomY - H / 2 - 0.06, 0], C.pink),
    line([right, linkY, 0], [right, zoomY - H / 2 - 0.06, 0], C.pink),
    label('×', 21, [CX, linkY, 0], C.pink),
    label('This link across the boundary is blocked', P ? 19 : 17, [CX, linkY - 0.43, 0], C.pink),
  ];
  await until(S(52)); await play(...fadeIn([...zoom, ...blocked]), ...say('BLOCK LINKS ACROSS DOCUMENTS', C.violet));
  await until(S(53)); await play(...fadeOut([...zoom, ...blocked]),
    ...say('FILL THE BLOCK. KEEP THE BOUNDARIES.', C.green),
    ...fbox(['12 useful tokens', ['3 newsletters kept separate', C.green]], C.green));
}
