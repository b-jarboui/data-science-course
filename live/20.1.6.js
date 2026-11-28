// 20.1.6 Token cross-entropy: measuring how wrong a prediction is.
// Beat i = sentence i (0-based, 0..54). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, showA, until, play, net } = L;

  const PILL = P ? [0, 2.15, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, -5.6, 0] : [4.3, -0.3, 0];
  const BOXP_TR = P ? [0, 3.45, 0] : [4.1, 0.72, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL, P ? 18 : 19);

  // Formula box: one box at a time; lines = ['text' | ['text', color]]
  let boxNow = null;
  function fbox(lines, color = C.cyan, where = BOXP) {
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const size = P ? (rows.length > 3 ? 18 : 20) : 20;
    const lh = rows.length > 3 ? (P ? 0.34 : 0.38) : (P ? 0.40 : 0.42);
    const texts = rows.map(([s, c]) => T(s.trimStart(), size, c, true));
    const cw = T('0000000000', size, C.ink, true).getWidth() / 10;
    const widths = texts.map((t, i) => t.getWidth() + cw * (rows[i][0].length - rows[i][0].trimStart().length));
    const wd = Math.max(...widths) + 0.64, ht = rows.length * lh + 0.34;
    const r = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(where);
    const left = where[0] - wd / 2 + 0.32, top = where[1] + ht / 2 - 0.17 - lh / 2;
    texts.forEach((t, i) => {
      const ind = cw * (rows[i][0].length - rows[i][0].trimStart().length);
      t.moveTo([left + ind + t.getWidth() / 2, top - i * lh, 0]);
    });
    const g = new M.VGroup(r, ...texts);
    const maxw = P ? FW - 0.9 : 5.0;
    if (wd > maxw) g.scale(maxw / wd);
    const a = [new M.FadeIn(g, { runTime: 0.55 })];
    if (boxNow) a.push(new M.FadeOut(boxNow, { runTime: 0.4 }));
    boxNow = g;
    return a;
  }
  function clearBox() {
    if (!boxNow) return [];
    const old = boxNow; boxNow = null;
    return [new M.FadeOut(old, { runTime: 0.45 })];
  }

  // Token card helper: builds a rounded card centered at pos
  function tokCard(text, pos, color = C.cyan, w = 1.55, h = 0.68, size = P ? 20 : 22) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: 2.2 });
    r.setFill(C.card, 0.94); r.moveTo(pos);
    const t = T(text, size, color, true, true); t.moveTo(pos);
    if (t.getWidth() > w - 0.24) t.scale((w - 0.24) / t.getWidth());
    return new M.VGroup(r, t);
  }

  // Helper to set values inside L.net neurons while keeping text fitted and tracked for clean removal
  function setVal(N, store, l, i, s, col = C.ink, maxW = 0.56) {
    const a = N.value(l, i, s, col);
    const t = a[0].mobject;
    if (t.getWidth() > maxW) t.scale(maxW / t.getWidth());
    t.moveTo(N.pos(l, i));
    store[l + ':' + i] = t;
    return a;
  }

  // ===========================================================================
  // ACT 1 (0-5): Campus newsletter & next-word prediction
  // ===========================================================================
  const cardCenter = P ? [0, -1.0, 0] : [0, -0.25, 0];
  const cardW = P ? 7.1 : 9.4, cardH = P ? 3.4 : 2.35;
  const paper = new M.RoundedRectangle({ width: cardW, height: cardH, cornerRadius: 0.22, color: C.cyan, strokeWidth: 2 });
  paper.setFill(C.card, 0.92); paper.moveTo(cardCenter);
  const mast = T('CAMPUS NEWSLETTER', P ? 17 : 17, C.muted, true, true);
  mast.moveTo([cardCenter[0], cardCenter[1] + cardH / 2 - 0.34, 0]);
  const rule = new M.Line({
    start: [cardCenter[0] - cardW / 2 + 0.35, cardCenter[1] + cardH / 2 - 0.62, 0],
    end: [cardCenter[0] + cardW / 2 - 0.35, cardCenter[1] + cardH / 2 - 0.62, 0],
    color: C.line, strokeWidth: 2
  });
  const newsCard = new M.VGroup(paper, mast, rule);

  await until(S(0));

  // 1: "The newsletter says: Library opens at."
  const tokY = cardCenter[1] - 0.18;
  const tokW = P ? 1.50 : 1.95, tokH = P ? 0.68 : 0.72, tokGap = P ? 0.16 : 0.24;
  const tokX = k => cardCenter[0] + (k - 1.5) * (tokW + tokGap);
  const tLib = tokCard('Library', [tokX(0), tokY, 0], C.cyan, tokW, tokH, P ? 18 : 22);
  const tOpn = tokCard('opens', [tokX(1), tokY, 0], C.cyan, tokW, tokH, P ? 18 : 22);
  const tAt = tokCard('at', [tokX(2), tokY, 0], C.cyan, tokW, tokH, P ? 18 : 22);

  await play(new M.FadeIn(newsCard, { runTime: 0.9 }), new M.LaggedStart([new M.FadeIn(tLib), new M.FadeIn(tOpn), new M.FadeIn(tAt)], { lagRatio: 0.25, runTime: 1.1 }),
    ...say('CAMPUS NEWSLETTER'));
  await until(S(1));
  await play(new M.LaggedStart([tLib, tOpn, tAt].map(t => new M.Indicate(t, { color: C.cyan })), { lagRatio: 0.2, runTime: 1.1 }),
    ...say('LIBRARY OPENS AT ...'));

  // 2: "The model must predict the next word."
  const tQ = tokCard('?', [tokX(3), tokY, 0], C.amber, tokW, tokH, P ? 24 : 26);
  await until(S(2));
  await play(new M.FadeIn(tQ, { runTime: 0.7 }), ...say('PREDICT THE NEXT WORD', C.amber));

  // 3: "Perhaps the next word is nine, ten or noon."
  const candY = cardCenter[1] - cardH / 2 - (P ? 1.2 : 0.85);
  const candGap = P ? 2.15 : 2.55, candW = P ? 1.65 : 1.9;
  const cNine = tokCard('nine', [-candGap, candY, 0], C.violet, candW, P ? 0.8 : 0.64, P ? 21 : 21);
  const cTen = tokCard('ten', [0, candY, 0], C.violet, candW, P ? 0.8 : 0.64, P ? 21 : 21);
  const cNoon = tokCard('noon', [candGap, candY, 0], C.violet, candW, P ? 0.8 : 0.64, P ? 21 : 21);

  await until(S(3));
  await play(new M.LaggedStart([new M.FadeIn(cNine), new M.FadeIn(cTen), new M.FadeIn(cNoon)], { lagRatio: 0.25, runTime: 1.2 }),
    ...say('CANDIDATES: NINE, TEN, NOON', C.violet));

  // 4: "Now reveal the next word from the original newsletter: nine."
  const tNine = tokCard('nine', [tokX(3), tokY, 0], C.green, tokW, tokH, P ? 19 : 22);
  await until(S(4));
  await play(new M.FadeOut(tQ, { runTime: 0.4 }), new M.FadeIn(tNine, { runTime: 0.65 }),
    new M.Flash(tNine, { color: C.green, flashRadius: 0.45 }), new M.Indicate(cNine, { color: C.green }),
    ...say('TRUE NEXT WORD: NINE', C.green));

  // 5: "How can we measure how well the model predicts this word?"
  await until(S(5));
  await play(new M.Indicate(tNine, { color: C.amber, runTime: 0.9 }), ...say('HOW WELL DOES THE MODEL PREDICT?', C.amber));

  // ===========================================================================
  // ACT 2 (6-12): Neural network predicts probabilities (L.net)
  // ===========================================================================
  const net1Center = P ? [-0.3, -1.2, 0] : [-2.5, -0.45, 0];
  const net1W = P ? 3.6 : 5.2, net1H = P ? 3.6 : 2.85, net1R = P ? 0.32 : 0.34;
  const N1 = net({
    layers: [3, 4, 3], center: net1Center, width: net1W, height: net1H, r: net1R,
    names: ['Library', 'opens', 'at'], color: C.cyan
  });
  const n1Vals = {};
  // label beside an output neuron: word, then its probability once the network has run
  function outLab(N, r, j, txt, col) {
    const p = N.pos(2, j);
    const t = T(txt, P ? 18 : 18, col, true, j === 0);
    t.moveTo([p[0] + r + 0.2 + t.getWidth() / 2, p[1], 0]);
    return t;
  }
  function swapOuts(N, r, arr, specs) {
    const next = specs.map(([txt, col], j) => outLab(N, r, j, txt, col));
    const a = [...arr.map(t => new M.FadeOut(t, { runTime: 0.35 })), ...next.map(t => new M.FadeIn(t, { runTime: 0.45 }))];
    arr.splice(0, arr.length, ...next);
    return a;
  }
  const outNames1 = [['nine', C.amber], ['ten', C.muted], ['noon', C.muted]].map(([w, c], j) => outLab(N1, net1R, j, w, c));
  const colHdrY1 = N1.pos(1, 3)[1] - net1R - 0.38;
  const colHdrs1 = [['INPUT', 0, C.violet], ['HIDDEN', 1, C.cyan], ['OUTPUT', 2, C.amber]].map(([txt, l, col]) => {
    const t = T(txt, P ? 15 : 15, col, true, true);
    t.moveTo([N1.pos(l, 0)[0], colHdrY1, 0]);
    return t;
  });

  await until(S(6));
  await play(new M.FadeOut(new M.VGroup(newsCard, tLib, tOpn, tAt, tNine, cNine, cTen, cNoon), { runTime: 0.6 }),
    ...say('NEURONS IN LAYERS, JOINED BY WEIGHTS'));
  await play(new M.FadeIn(N1.group, { runTime: 1.0 }), new M.FadeIn(new M.VGroup(...outNames1, ...colHdrs1), { runTime: 0.9 }));

  // 7: "Send the three visible words into the network as numbers."
  await until(S(7));
  await play(
    new M.LaggedStart(N1.nodes[0].map(n => new M.Indicate(n, { color: C.violet })), { lagRatio: 0.15, runTime: 1.1 }),
    ...say('WORDS ENTER AS NUMBERS', C.violet)
  );

  // 8: "Watch the numerical signals travel through the connected circles."
  await until(S(8));
  await play(...N1.flow(0, C.amber), ...say('NUMBERS FLOW THROUGH THE LAYERS', C.amber));
  await play(...N1.flow(1, C.amber));

  // 9: "The network gives each possible next token a chance."
  await until(S(9));
  await play(
    ...swapOuts(N1, net1R, outNames1, [['nine 12.5%', C.amber], ['ten  37.5%', C.muted], ['noon 50%', C.muted]]),
    ...say('PROBABILITY FOR EACH NEXT TOKEN', C.cyan)
  );

  // 10: "Remember that a token is a small piece of text, such as a word."
  await until(S(10));
  await play(new M.LaggedStart(outNames1.map(t => new M.Indicate(t, { color: C.cyan })), { lagRatio: 0.18, runTime: 1.2 }),
    ...say('TOKEN = A SMALL PIECE OF TEXT', C.muted));

  // 11: "Our model gives nine a probability of twelve point five percent."
  await until(S(11));
  await play(new M.Flash(N1.nodes[2][0], { color: C.amber, flashRadius: net1R + 0.08 }),
    new M.Indicate(outNames1[0], { color: C.amber }),
    ...fbox([['correct token: nine', C.cyan], ['probability:   12.5%', C.amber]], C.amber),
    ...say('NINE GETS 12.5% PROBABILITY', C.amber));

  // 12: "We want a number that measures how poorly the model predicts the correct token."
  await until(S(12));
  await play(
    ...fbox([['correct token: nine', C.cyan], ['probability:   12.5%', C.amber], ['loss = ?', C.pink]], C.pink),
    ...say('HOW POORLY DID IT PREDICT?', C.pink));

  // ===========================================================================
  // ACT 3 (13-26): The glowing halving bar and bits
  // ===========================================================================
  const BAR_W = P ? 6.6 : 7.4, BAR_H = P ? 1.3 : 1.05;
  const barCX = P ? 0 : -2.1, barY = P ? -0.6 : -0.25;
  const barLeft = barCX - BAR_W / 2;

  const barFrame = new M.RoundedRectangle({ width: BAR_W, height: BAR_H, cornerRadius: 0.10, color: C.muted, strokeWidth: 2 });
  barFrame.setFill(C.card, 0.55); barFrame.moveTo([barCX, barY, 0]);

  function makeBar(frac, col = C.cyan) {
    const w = Math.max(0.06, BAR_W * frac);
    const r = new M.Rectangle({ width: w, height: BAR_H - 0.08, color: col, strokeWidth: 2 });
    r.setFill(col, 0.78); r.moveTo([barLeft + w / 2, barY, 0]);
    return r;
  }
  const barFill = makeBar(1.0, C.cyan);
  const fullTag = T('100%', P ? 18 : 20, C.muted, true);
  fullTag.moveTo([barLeft + BAR_W, barY - BAR_H / 2 - 0.34, 0]);
  const zeroTag = T('0%', P ? 18 : 20, C.muted, true);
  zeroTag.moveTo([barLeft, barY - BAR_H / 2 - 0.34, 0]);
  let barValTag = T('100%', P ? 22 : 24, C.ink, true, true);
  barValTag.moveTo([barCX, barY, 0]);

  function moveBarTag(text, frac, col = C.ink) {
    const t = T(text, P ? 20 : 22, col, true, true);
    const x = frac >= 0.25 ? barLeft + BAR_W * frac / 2 : barLeft + BAR_W * frac + 0.58;
    t.moveTo([x, barY, 0]);
    const a = [new M.FadeOut(barValTag, { runTime: 0.35 }), new M.FadeIn(t, { runTime: 0.45 })];
    barValTag = t;
    return a;
  }

  await until(S(13));
  await play(
    new M.FadeOut(new M.VGroup(N1.group, ...Object.values(n1Vals), ...outNames1, ...colHdrs1), { runTime: 0.55 }),
    ...clearBox(), ...say('100% = COMPLETE CERTAINTY', C.cyan)
  );
  await play(new M.FadeIn(barFrame, { runTime: 0.6 }), new M.FadeIn(barFill, { runTime: 0.7 }),
    new M.FadeIn(new M.VGroup(zeroTag, fullTag, barValTag), { runTime: 0.6 }));

  // 14-15: First halving -> 50%
  const cut1X = barLeft + BAR_W * 0.5;
  const cut1 = new M.DashedLine({ start: [cut1X, barY - BAR_H / 2 - 0.18, 0], end: [cut1X, barY + BAR_H / 2 + 0.18, 0], color: C.amber, strokeWidth: 3 });
  const div1 = T('÷2', P ? 16 : 18, C.amber, true, true); div1.moveTo([cut1X, barY + BAR_H / 2 + 0.38, 0]);
  await until(S(14));
  await play(new M.Create(cut1, { runTime: 0.7 }), new M.FadeIn(div1, { runTime: 0.5 }), ...say('DIVIDE IN TWO EQUAL PARTS', C.amber));

  await until(S(15));
  await play(new M.Transform(barFill, makeBar(0.5, C.cyan), { runTime: 0.8 }),
    ...moveBarTag('50%', 0.5), ...fbox([['halvings    = 1', C.amber], ['probability = 50%', C.cyan]], C.cyan),
    ...say('ONE PART = 50%', C.cyan));

  // 16-17: Second halving -> 25%
  const cut2X = barLeft + BAR_W * 0.25;
  const cut2 = new M.DashedLine({ start: [cut2X, barY - BAR_H / 2 - 0.18, 0], end: [cut2X, barY + BAR_H / 2 + 0.18, 0], color: C.amber, strokeWidth: 3 });
  const div2 = T('÷2', P ? 16 : 18, C.amber, true, true); div2.moveTo([cut2X, barY + BAR_H / 2 + 0.38, 0]);
  await until(S(16));
  await play(new M.Create(cut2, { runTime: 0.7 }), new M.FadeIn(div2, { runTime: 0.5 }), ...say('DIVIDE IN TWO AGAIN', C.amber));

  await until(S(17));
  await play(new M.Transform(barFill, makeBar(0.25, C.cyan), { runTime: 0.7 }),
    ...moveBarTag('25%', 0.25), ...fbox([['halvings    = 2', C.amber], ['probability = 25%', C.cyan]], C.cyan),
    ...say('NOW WE HAVE 25%', C.cyan));

  // 18-19: Third halving -> 12.5%
  const cut3X = barLeft + BAR_W * 0.125;
  const cut3 = new M.DashedLine({ start: [cut3X, barY - BAR_H / 2 - 0.18, 0], end: [cut3X, barY + BAR_H / 2 + 0.18, 0], color: C.amber, strokeWidth: 3 });
  const div3 = T('÷2', P ? 16 : 18, C.amber, true, true); div3.moveTo([cut3X, barY + BAR_H / 2 + 0.38, 0]);
  await until(S(18));
  await play(new M.Create(cut3, { runTime: 0.7 }), new M.FadeIn(div3, { runTime: 0.5 }), ...say('DIVIDE IN TWO ONCE MORE', C.amber));

  await until(S(19));
  await play(new M.Transform(barFill, makeBar(0.125, C.amber), { runTime: 0.75 }),
    ...moveBarTag('12.5%', 0.125, C.amber), ...fbox([['halvings    = 3', C.amber], ['probability = 12.5%', C.amber]], C.amber),
    ...say('NOW WE HAVE 12.5%', C.amber));

  // 20-22: Count 3 halvings -> error = 3 bits
  const badges = [cut1X, cut2X, cut3X].map((x, idx) => {
    const c = new M.Circle({ radius: 0.21, color: C.amber, strokeWidth: 2 });
    c.setFill(C.bg, 0.95); c.moveTo([x, barY - BAR_H / 2 - 0.75, 0]);
    const t = T(String(idx + 1), 17, C.amber, true, true); t.moveTo([x, barY - BAR_H / 2 - 0.75, 0]);
    return new M.VGroup(c, t);
  });
  await until(S(20));
  await play(new M.LaggedStart(badges.map(b => new M.FadeIn(b)), { lagRatio: 0.25, runTime: 1.0 }),
    ...say('COUNT THE HALVINGS', C.amber));

  await until(S(21));
  await play(new M.LaggedStart(badges.map(b => new M.Indicate(b, { color: C.amber })), { lagRatio: 0.18, runTime: 1.0 }),
    ...fbox([['probability = 12.5%', C.cyan], ['halvings    = 3', C.amber], ['loss        = 3', C.pink]], C.amber),
    ...say('3 HALVINGS → LOSS = 3', C.amber));

  const bitNote = T('1 halving = 1 bit of loss', P ? 19 : 19, C.green, true, true);
  bitNote.moveTo([barCX, barY - BAR_H / 2 - (P ? 1.5 : 1.38), 0]);
  await until(S(22));
  await play(new M.FadeIn(bitNote, { runTime: 0.6 }),
    ...fbox([['1 halving = 1 bit', C.green], ['3 halvings    = 3 bits', C.amber]], C.green),
    ...say('UNIT OF LOSS = 1 BIT', C.green));

  // 23: 50% -> 1 bit
  await until(S(23));
  await play(new M.Transform(barFill, makeBar(0.5, C.cyan), { runTime: 0.85 }),
    ...moveBarTag('50%', 0.5, C.ink),
    new M.Indicate(badges[0], { color: C.green }),
    ...fbox([['probability = 50%', C.cyan], ['halvings    = 1', C.amber], ['loss        = 1 bit', C.green]], C.cyan),
    ...say('50% PROBABILITY → 1 BIT', C.cyan));

  // 24: 100% -> 0 bits
  await until(S(24));
  await play(new M.Transform(barFill, makeBar(1.0, C.green), { runTime: 0.85 }),
    ...moveBarTag('100%', 1.0, C.bg),
    ...fbox([['probability = 100%', C.green], ['halvings    = 0', C.amber], ['loss        = 0 bits', C.green]], C.green),
    ...say('100% PROBABILITY → 0 BITS', C.green));

  // 25: Name it: token cross-entropy loss
  const refRows = P
    ? [['100% → 0 bits', '50% → 1 bit'], ['25% → 2 bits', '12.5% → 3 bits']]
    : [['100% → 0 bits', '50% → 1 bit', '25% → 2 bits', '12.5% → 3 bits']];
  const refItems = [];
  refRows.forEach((row, r) => {
    const sp = P ? 3.2 : 1.95;
    const y = barY - BAR_H / 2 - (P ? 2.35 + r * 0.65 : 1.95);
    row.forEach((txt, c) => {
      const t = T(txt, P ? 18 : 16, c === 0 && r === 0 ? C.green : C.cyan, true);
      t.moveTo([barCX + (c - (row.length - 1) / 2) * sp, y, 0]);
      refItems.push(t);
    });
  });
  await until(S(25));
  await play(new M.LaggedStart(refItems.map(t => new M.FadeIn(t)), { lagRatio: 0.12, runTime: 0.9 }),
    ...say('CROSS-ENTROPY LOSS', C.violet));

  // 26: Higher probability -> smaller loss
  await until(S(26));
  await play(new M.LaggedStart(refItems.map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.1, runTime: 1.0 }),
    ...fbox([['higher probability', C.green], ['→ smaller loss', C.cyan]], C.green),
    ...say('HIGHER PROBABILITY → SMALLER LOSS', C.green));

  // ===========================================================================
  // ACT 4 (27-41): Step-by-step training on the network + growing loss curve
  // ===========================================================================
  const n2Center = P ? [-0.5, -0.1, 0] : [-3.0, -0.55, 0];
  const n2W = P ? 3.6 : 4.4, n2H = P ? 2.5 : 2.75, n2R = P ? 0.28 : 0.31;
  const N2 = net({
    layers: [3, 4, 3], center: n2Center, width: n2W, height: n2H, r: n2R,
    names: ['Library', 'opens', 'at'], color: C.cyan
  });
  const n2Vals = {};
  const outNames2 = [['nine', C.amber], ['ten', C.muted], ['noon', C.muted]].map(([w, c], j) => outLab(N2, n2R, j, w, c));

  // Loss-vs-step axes
  const GX0 = P ? -2.65 : 2.15, GX1 = P ? 3.15 : 6.35;
  const GY0 = P ? -5.2 : -2.60, GY1 = P ? -2.2 : -0.50;
  const gx = step => GX0 + (step / 6) * (GX1 - GX0);
  const gy = loss => GY0 + (loss / 3.5) * (GY1 - GY0);

  const gAxisX = new M.Line({ start: [GX0, GY0, 0], end: [GX1 + 0.15, GY0, 0], color: C.muted, strokeWidth: 2 });
  const gAxisY = new M.Line({ start: [GX0, GY0, 0], end: [GX0, GY1 + 0.15, 0], color: C.muted, strokeWidth: 2 });
  const gTicks = [];
  for (let s = 0; s <= 6; s++) {
    gTicks.push(new M.Line({ start: [gx(s), GY0 - 0.06, 0], end: [gx(s), GY0 + 0.06, 0], color: C.muted, strokeWidth: 1.5 }));
    const lt = T(String(s), P ? 16 : 15, C.muted, true); lt.moveTo([gx(s), GY0 - 0.27, 0]); gTicks.push(lt);
  }
  for (let lv = 0; lv <= 3; lv++) {
    gTicks.push(new M.Line({ start: [GX0 - 0.06, gy(lv), 0], end: [GX0 + 0.06, gy(lv), 0], color: C.muted, strokeWidth: 1.5 }));
    const lt = T(String(lv), P ? 16 : 15, C.muted, true); lt.moveTo([GX0 - 0.3, gy(lv), 0]); gTicks.push(lt);
  }
  const gLabX = T('training step', P ? 16 : 15, C.muted, true); gLabX.moveTo([(GX0 + GX1) / 2, GY0 - 0.6, 0]);
  const gLabY = T('loss (bits)', P ? 16 : 15, C.amber, true); gLabY.moveTo([GX0 + 0.7, GY1 + 0.32, 0]);
  const graphAxes = new M.VGroup(gAxisX, gAxisY, ...gTicks, gLabX, gLabY);

  await until(S(27));
  await play(
    new M.FadeOut(new M.VGroup(barFrame, barFill, zeroTag, fullTag, barValTag, cut1, cut2, cut3, div1, div2, div3, ...badges, bitNote, ...refItems), { runTime: 0.55 }),
    ...clearBox(), ...say('TRAINING THE NETWORK', C.cyan)
  );
  await play(new M.FadeIn(N2.group, { runTime: 0.8 }), new M.FadeIn(new M.VGroup(...outNames2), { runTime: 0.7 }),
    new M.FadeIn(graphAxes, { runTime: 0.8 }));

  // Curve data: exact values from chapters/20.1.md
  const curvePts = [
    [0, 3.00], [1, 2.00], [2, 1.32], [3, 1.15], [4, 1.06], [5, 1.01], [6, 1.00]
  ];
  const curveObjs = [];
  function addPoint(idx, labelText = '', col = C.amber) {
    const [st, ls] = curvePts[idx];
    const pt = [gx(st), gy(ls), 0];
    const dot = new M.Dot({ point: pt, radius: 0.09, color: col });
    curveObjs.push(dot);
    const anims = [new M.FadeIn(dot, { runTime: 0.45 })];
    if (idx > 0) {
      const [ps, pl] = curvePts[idx - 1];
      const seg = new M.Line({ start: [gx(ps), gy(pl), 0], end: pt, color: C.cyan, strokeWidth: 3 });
      curveObjs.push(seg);
      anims.unshift(new M.Create(seg, { runTime: 0.55 }));
    }
    if (labelText) {
      const lb = T(labelText, P ? 16 : 15, col, true, true);
      lb.moveTo([pt[0] + (idx === 0 ? 0.36 : 0.08), pt[1] + 0.24, 0]);
      curveObjs.push(lb);
      anims.push(new M.FadeIn(lb, { runTime: 0.4 }));
    }
    return { dot, anims };
  }

  // 28: Start at 12.5%, loss 3 bits
  const pt0 = addPoint(0, '3.0', C.pink);
  await until(S(28));
  await play(
    ...swapOuts(N2, n2R, outNames2, [['nine 12.5%', C.amber], ['ten  37.5%', C.muted], ['noon 50%', C.muted]]),
    ...pt0.anims, new M.Flash(pt0.dot, { color: C.pink, flashRadius: 0.18 }),
    ...fbox([['step 0 (start)', C.muted], ['p(nine) = 12.5%', C.amber], ['loss = 3.00 bits', C.pink]], C.amber, BOXP_TR),
    ...say('START: 12.5% → 3 BITS', C.amber)
  );

  // 29: Computer calculates how changes reduce loss
  await until(S(29));
  await play(new M.Indicate(pt0.dot, { color: C.pink, runTime: 0.9 }),
    ...say('COMPUTE THE GRADIENTS', C.amber));

  // 30: Backward pass through the network in pink (right to left)
  const back1 = [], back0 = [];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {
    const a = N2.pos(2, j), b = N2.pos(1, i);
    const ln = new M.Line({ start: [a[0] - n2R, a[1], 0.01], end: [b[0] + n2R, b[1], 0.01], color: '#fb923c', strokeWidth: 3.5 });
    back1.push(ln);
  }
  for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) {
    const a = N2.pos(1, j), b = N2.pos(0, i);
    const ln = new M.Line({ start: [a[0] - n2R, a[1], 0.01], end: [b[0] + n2R, b[1], 0.01], color: '#fb923c', strokeWidth: 3.5 });
    back0.push(ln);
  }
  await until(S(30));
  await play(new M.LaggedStart(back1.map(ln => new M.Create(ln, { runTime: 0.65 })), { lagRatio: 0.04, runTime: 1.05 }),
    ...say('GRADIENTS FLOW BACKWARD (ORANGE)', C.amber));
  await play(new M.LaggedStart(back0.map(ln => new M.Create(ln, { runTime: 0.65 })), { lagRatio: 0.04, runTime: 1.05 }));
  await play(new M.FadeOut(new M.VGroup(...back1, ...back0), { runTime: 0.45 }));

  // 31: Update weights (cyan stronger toward nine, pink negative toward ten/noon)
  await until(S(31));
  await play(
    ...N2.weight(1, 0, 0, 0.75), ...N2.weight(1, 1, 0, 0.65), ...N2.weight(1, 2, 0, 0.8), ...N2.weight(1, 3, 0, 0.55),
    ...N2.weight(1, 0, 2, -0.45), ...N2.weight(1, 2, 2, -0.5), ...N2.weight(0, 0, 0, 0.7), ...N2.weight(0, 1, 2, 0.75),
    ...say('UPDATE THE WEIGHTS', C.violet)
  );

  // 32: Step 1 -> probability rises to 25%
  await until(S(32));
  await play(
    ...N2.flow(1, C.amber),
    ...swapOuts(N2, n2R, outNames2, [['nine 25%', C.green], ['ten  35%', C.muted], ['noon 40%', C.muted]]),
    new M.Flash(N2.nodes[2][0], { color: C.green, flashRadius: n2R + 0.08 }),
    ...fbox([['step 1', C.cyan], ['p(nine): 12.5% → 25%', C.green], ['loss:   3.00 → ...', C.muted]], C.cyan, BOXP_TR),
    ...say('STEP 1: NINE RISES TO 25%', C.green)
  );

  // 33: Loss falls from 3 to 2 bits
  const pt1 = addPoint(1, '2.0', C.amber);
  await until(S(33));
  await play(...pt1.anims,
    ...fbox([['step 1', C.cyan], ['p(nine) = 25%', C.green], ['loss: 3 → 2 bits', C.amber]], C.cyan, BOXP_TR));

  // 34: Step 2 -> +15 points -> 40%
  await until(S(34));
  await play(
    ...N2.weight(1, 0, 0, 0.92), ...N2.weight(1, 2, 0, 0.95), ...N2.weight(1, 1, 1, -0.4),
    ...swapOuts(N2, n2R, outNames2, [['nine 40%', C.green], ['ten  30%', C.muted], ['noon 30%', C.muted]]),
    new M.Flash(N2.nodes[2][0], { color: C.green, flashRadius: n2R + 0.08 }),
    ...fbox([['step 2 (+15 pts)', C.cyan], ['p(nine): 25% → 40%', C.green], ['loss:   2.00 → ...', C.muted]], C.cyan, BOXP_TR),
    ...say('STEP 2: 25% + 15 = 40%', C.green)
  );

  // 35: Loss falls to ~1.32 bits
  const pt2 = addPoint(2, '1.32', C.amber);
  await until(S(35));
  await play(...pt2.anims,
    ...fbox([['step 2', C.cyan], ['p(nine) = 40%', C.green], ['loss ≈ 1.32 bits', C.amber]], C.cyan, BOXP_TR));

  // 36: Step 3 -> +5 points -> 45%
  await until(S(36));
  await play(
    ...N2.weight(1, 1, 0, 0.85), ...N2.weight(1, 3, 0, 0.78),
    ...swapOuts(N2, n2R, outNames2, [['nine 45%', C.green], ['ten  28%', C.muted], ['noon 27%', C.muted]]),
    ...fbox([['step 3 (+5 pts)', C.cyan], ['p(nine): 40% → 45%', C.green], ['loss:   1.32 → ...', C.muted]], C.cyan, BOXP_TR),
    ...say('STEP 3: 40% + 5 = 45%', C.green)
  );

  // 37: Loss falls to ~1.15 bits
  const pt3 = addPoint(3, '1.15', C.amber);
  await until(S(37));
  await play(...pt3.anims,
    ...fbox([['step 3', C.cyan], ['p(nine) = 45%', C.green], ['loss ≈ 1.15 bits', C.amber]], C.cyan, BOXP_TR));

  // 38: Step 4 -> 48%
  await until(S(38));
  await play(
    ...swapOuts(N2, n2R, outNames2, [['nine 48%', C.green], ['ten  26%', C.muted], ['noon 26%', C.muted]]),
    ...fbox([['step 4', C.cyan], ['p(nine) = 48%', C.green], ['loss:   1.15 → ...', C.muted]], C.cyan, BOXP_TR),
    ...say('STEP 4: PROBABILITY REACHES 48%', C.green)
  );

  // 39: Loss falls to ~1.06 bits
  const pt4 = addPoint(4, '1.06', C.amber);
  await until(S(39));
  await play(...pt4.anims,
    ...fbox([['step 4', C.cyan], ['p(nine) = 48%', C.green], ['loss ≈ 1.06 bits', C.amber]], C.cyan, BOXP_TR));

  // 40: Continue training, loss curve flattens
  const pt5 = addPoint(5, '', C.green);
  const pt6 = addPoint(6, '1.0', C.green);
  const floorLn = new M.DashedLine({ start: [GX0, gy(1.0), 0], end: [GX1, gy(1.0), 0], color: C.green, strokeWidth: 2 });
  curveObjs.push(floorLn);
  await until(S(40));
  await play(...pt5.anims, ...say('LOSS CURVE FLATTENS OUT', C.amber));
  await play(...pt6.anims, new M.Create(floorLn, { runTime: 0.6 }));

  // 41: Chance approaches 50%, loss = 1 bit
  await until(S(41));
  await play(
    ...swapOuts(N2, n2R, outNames2, [['nine 50%', C.green], ['ten  25%', C.cyan], ['noon 25%', C.cyan]]),
    new M.Flash(pt6.dot, { color: C.green, flashRadius: 0.2 }),
    ...fbox([['settled', C.green], ['p(nine) → 50%', C.cyan], ['loss → 1.00 bit', C.amber]], C.green, BOXP_TR),
    ...say('SETTLES AT 50% (1 BIT)', C.green)
  );

  // ===========================================================================
  // ACT 5 (42-46): Why 50% and not 100%? (The 4 campus newsletters)
  // ===========================================================================
  const whyPill = pill('NINE → 50%   (NOT 100%?)', C.amber, P ? 20 : 24);
  whyPill.moveTo([0, P ? -1.8 : -0.35, 0]);

  await until(S(42));
  await play(
    new M.FadeOut(new M.VGroup(N2.group, ...Object.values(n2Vals), ...outNames2, graphAxes, ...curveObjs), { runTime: 0.55 }),
    ...clearBox(), new M.FadeIn(whyPill, { runTime: 0.6 }),
    ...say('WHY NOT 100% FOR NINE?', C.amber)
  );

  // 43: Four campus newsletters starting with "Library opens at ..."
  const gridCX = P ? 0 : -2.1;
  const nCardW = P ? 3.4 : 3.55, nCardH = P ? 1.5 : 1.05;
  const dx = P ? 1.82 : 2.0, dy = P ? 0.95 : 0.72, gridCY = P ? -1.7 : -0.45;
  const nPos = [
    [gridCX - dx, gridCY + dy, 0],
    [gridCX + dx, gridCY + dy, 0],
    [gridCX - dx, gridCY - dy, 0],
    [gridCX + dx, gridCY - dy, 0],
  ];
  const endings = [
    ['nine', C.cyan], ['nine', C.cyan], ['ten', C.violet], ['noon', C.amber]
  ];
  const nFrames = [], nPrefixes = [], nEndTags = [];
  nPos.forEach((p, idx) => {
    const r = new M.RoundedRectangle({ width: nCardW, height: nCardH, cornerRadius: 0.14, color: C.muted, strokeWidth: 2 });
    r.setFill(C.card, 0.94); r.moveTo(p);
    const pre = T('Library opens at ...', P ? 17 : 16, C.muted, false);
    pre.moveTo([p[0], p[1] + 0.22, 0]);
    const [word, col] = endings[idx];
    const endT = T(word, P ? 20 : 22, col, true, true);
    endT.moveTo([p[0], p[1] - 0.20, 0]);
    nFrames.push(r); nPrefixes.push(pre); nEndTags.push(endT);
  });

  await until(S(43));
  await play(
    new M.FadeOut(whyPill, { runTime: 0.4 }),
    new M.LaggedStart(nFrames.map((r, i) => new M.FadeIn(new M.VGroup(r, nPrefixes[i]))), { lagRatio: 0.14, runTime: 1.0 }),
    ...say('ALL NEWSLETTERS: "LIBRARY OPENS AT"', C.cyan)
  );

  // 44: Half nine, quarter ten, quarter noon
  await until(S(44));
  await play(
    new M.LaggedStart(nEndTags.map(t => new M.FadeIn(t)), { lagRatio: 0.18, runTime: 1.1 }),
    ...fbox([['nine: 2 of 4 = 50%', C.cyan], ['ten:  1 of 4 = 25%', C.violet], ['noon: 1 of 4 = 25%', C.amber]], C.cyan),
    ...say('HALF NINE · QUARTER TEN · QUARTER NOON', C.cyan)
  );

  // 45: Giving nine 100% hurts ten & noon
  const warn2 = new M.RoundedRectangle({ width: nCardW + 0.1, height: nCardH + 0.1, cornerRadius: 0.16, color: C.pink, strokeWidth: 3 });
  warn2.moveTo(nPos[2]);
  const warn3 = new M.RoundedRectangle({ width: nCardW + 0.1, height: nCardH + 0.1, cornerRadius: 0.16, color: C.pink, strokeWidth: 3 });
  warn3.moveTo(nPos[3]);
  await until(S(45));
  await play(
    new M.Create(warn2, { runTime: 0.6 }), new M.Create(warn3, { runTime: 0.6 }),
    new M.Indicate(nEndTags[2], { color: C.pink }), new M.Indicate(nEndTags[3], { color: C.pink }),
    ...fbox([['if nine = 100%:', C.pink], ['ten = 0%, noon = 0%', C.pink], ['huge loss on both!', C.pink]], C.pink),
    ...say('100% ON NINE HURTS TEN & NOON', C.pink)
  );

  // 46: Matching observed probabilities gives smallest average loss
  await until(S(46));
  await play(
    new M.FadeOut(new M.VGroup(warn2, warn3), { runTime: 0.45 }),
    new M.LaggedStart(nEndTags.map(t => new M.Indicate(t, { color: C.green })), { lagRatio: 0.12, runTime: 1.0 }),
    ...fbox([['nine 50% · ten 25% · noon 25%', C.cyan], ['0.5×1 + 0.25×2 + 0.25×2', C.ink], ['= 1.5 bits: smallest average', C.green]], C.green),
    ...say('MATCH THE SHARES = LOWEST AVERAGE LOSS', C.green)
  );

  // ===========================================================================
  // ACT 6 (47-54): The −log₂(p) formula & the confident-wrong trap
  // ===========================================================================
  const tblCX = P ? 0 : -2.1;
  const tblRows = [
    ['100%  (1.000)', '0 halvings', '0 bits', C.green],
    [' 50%  (0.500)', '1 halving ', '1 bit ', C.cyan],
    [' 25%  (0.250)', '2 halvings', '2 bits', C.cyan],
    ['12.5% (0.125)', '3 halvings', '3 bits', C.amber],
  ];
  const tblObjs = [];
  tblRows.forEach(([ch, hv, bt, col], idx) => {
    const y = (P ? 0.2 : 0.72) - idx * (P ? 1.0 : 0.74);
    const bg = new M.RoundedRectangle({ width: P ? 7.2 : 7.0, height: P ? 0.78 : 0.58, cornerRadius: 0.12, color: C.line, strokeWidth: 1.5 });
    bg.setFill(C.card, 0.9); bg.moveTo([tblCX, y, 0]);
    const t1 = T(ch, P ? 17 : 18, C.ink, true); t1.moveTo([tblCX - (P ? 2.15 : 2.0), y, 0]);
    const t2 = T(hv, P ? 16 : 17, C.muted, true); t2.moveTo([tblCX + (P ? 0.55 : 0.15), y, 0]);
    const t3 = T(bt, P ? 18 : 19, col, true, true); t3.moveTo([tblCX + (P ? 2.7 : 2.35), y, 0]);
    tblObjs.push(new M.VGroup(bg, t1, t2, t3));
  });

  await until(S(47));
  await play(
    new M.FadeOut(new M.VGroup(...nFrames, ...nPrefixes, ...nEndTags), { runTime: 0.5 }),
    ...clearBox(), ...say('CALCULATE WITHOUT HALVING BY HAND', C.cyan)
  );
  await play(new M.LaggedStart(tblObjs.map(r => new M.FadeIn(r)), { lagRatio: 0.14, runTime: 1.0 }));

  // 48: Base-two logarithm tells how many halvings when sign reversed
  await until(S(48));
  await play(
    new M.Indicate(tblObjs[3], { color: C.amber }),
    ...fbox([['log₂(0.125) = −3', C.muted], ['−log₂(0.125) = 3 bits', C.amber]], C.amber),
    ...say('−log₂(SHARE) = NUMBER OF HALVINGS', C.amber)
  );

  // 49: Full formula
  await until(S(49));
  await play(
    ...fbox([['loss = −log₂(p)', C.amber], ['p: probability of', C.cyan], ['the correct token', C.cyan], ['measured in bits', C.green]], C.amber),
    ...say('LOSS = −log₂(PROBABILITY OF CORRECT TOKEN)', C.amber)
  );

  // 50: Plot the smooth loss = −log₂(p) curve
  const CX0 = P ? -2.65 : -5.5, CX1 = P ? 3.15 : 1.45;
  const CY0 = P ? -3.9 : -2.45, CY1 = P ? 1.2 : 1.05;
  const px = p => CX0 + p * (CX1 - CX0);
  const py = l => CY0 + (Math.min(l, 8) / 8) * (CY1 - CY0);

  const cAxisX = new M.Line({ start: [CX0, CY0, 0], end: [CX1 + 0.15, CY0, 0], color: C.muted, strokeWidth: 2 });
  const cAxisY = new M.Line({ start: [CX0, CY0, 0], end: [CX0, CY1 + 0.18, 0], color: C.muted, strokeWidth: 2 });
  const cTicks = [];
  for (const pv of [0, 0.25, 0.5, 0.75, 1.0]) {
    cTicks.push(new M.Line({ start: [px(pv), CY0 - 0.07, 0], end: [px(pv), CY0 + 0.07, 0], color: C.muted, strokeWidth: 1.5 }));
    const lb = T(`${Math.round(pv * 100)}%`, P ? 16 : 15, C.muted, true); lb.moveTo([px(pv), CY0 - 0.3, 0]); cTicks.push(lb);
  }
  for (const lv of [0, 2, 4, 6, 8]) {
    cTicks.push(new M.Line({ start: [CX0 - 0.07, py(lv), 0], end: [CX0 + 0.07, py(lv), 0], color: C.muted, strokeWidth: 1.5 }));
    const lb = T(String(lv), P ? 16 : 15, C.muted, true); lb.moveTo([CX0 - 0.32, py(lv), 0]); cTicks.push(lb);
  }
  const cLabX = T('probability of correct token (p)', P ? 16 : 15, C.muted, true); cLabX.moveTo([(CX0 + CX1) / 2, CY0 - 0.65, 0]);
  const cLabY = T('loss (bits)', P ? 16 : 15, C.amber, true); cLabY.moveTo([CX0 + 0.7, CY1 + 0.32, 0]);

  const samples = [0.005, 0.007, 0.01, 0.015, 0.02, 0.03, 0.045, 0.065, 0.09, 0.125, 0.17, 0.22, 0.28, 0.36, 0.45, 0.55, 0.65, 0.76, 0.88, 1.0];
  const logSegs = [];
  for (let i = 0; i < samples.length - 1; i++) {
    const p1 = samples[i], p2 = samples[i + 1];
    const col = p2 <= 0.05 ? C.pink : (p2 <= 0.2 ? C.amber : C.cyan);
    logSegs.push(new M.Line({
      start: [px(p1), py(-Math.log2(p1)), 0],
      end: [px(p2), py(-Math.log2(p2)), 0],
      color: col, strokeWidth: 3.5
    }));
  }
  const goodDots = [[1.0, 0, C.green], [0.5, 1, C.cyan], [0.25, 2, C.cyan], [0.125, 3, C.amber]].map(([p, l, col]) =>
    new M.Dot({ point: [px(p), py(l), 0], radius: 0.09, color: col }));

  await until(S(50));
  await play(new M.FadeOut(new M.VGroup(...tblObjs), { runTime: 0.5 }), ...say('GUIDES LANGUAGE MODEL TRAINING', C.green));
  await play(
    new M.FadeIn(new M.VGroup(cAxisX, cAxisY, ...cTicks, cLabX, cLabY), { runTime: 0.6 }),
    new M.LaggedStart(logSegs.map(ln => new M.Create(ln, { runTime: 0.25 })), { lagRatio: 0.08, runTime: 1.0 }),
    new M.FadeIn(new M.VGroup(...goodDots), { runTime: 0.5 })
  );

  // 51: Only 1% probability on the correct token
  const p01 = [px(0.01), py(-Math.log2(0.01)), 0];
  const dot01 = new M.Dot({ point: p01, radius: 0.11, color: C.pink });
  const vDrop01 = new M.DashedLine({ start: [px(0.01), CY0, 0], end: p01, color: C.pink, strokeWidth: 2 });
  await until(S(51));
  await play(
    new M.Create(vDrop01, { runTime: 0.6 }), new M.FadeIn(dot01, { runTime: 0.45 }),
    new M.Flash(dot01, { color: C.pink, flashRadius: 0.24 }),
    ...fbox([['probability = 1% (0.01)', C.pink], ['confident & wrong!', C.pink]], C.pink),
    ...say('TRAP: ONLY 1% ON CORRECT TOKEN', C.pink)
  );

  // 52: Loss rises sharply to ~6.6 bits
  const hDrop01 = new M.DashedLine({ start: [CX0, p01[1], 0], end: p01, color: C.pink, strokeWidth: 2 });
  const lab66 = T('6.6 bits', 16, C.pink, true, true);
  lab66.moveTo([p01[0] + 0.95, p01[1], 0]);
  await until(S(52));
  await play(
    new M.Create(hDrop01, { runTime: 0.45 }), new M.FadeIn(lab66, { runTime: 0.45 }),
    ...fbox([['probability = 1%', C.pink], ['loss = −log₂(0.01)', C.muted], ['     ≈ 6.6 bits', C.pink]], C.pink),
    ...say('1% PROBABILITY → ~6.6 BITS LOSS!', C.pink)
  );

  // 53: 0% probability -> no upper limit
  const asym = new M.Arrow({ start: [CX0 + 0.03, CY0 + 0.5, 0], end: [CX0 + 0.03, CY1 + 0.22, 0], color: C.pink, strokeWidth: 3 });
  const infLab = T('0% → ∞ (no limit)', 16, C.pink, true, true);
  infLab.moveTo([CX0 + 1.65, CY1 - 0.12, 0]);
  await until(S(53));
  await play(
    new M.FadeIn(asym, { runTime: 0.6 }), new M.FadeIn(infLab, { runTime: 0.5 }),
    ...fbox([['probability = 0%', C.pink], ['loss → ∞ (no limit)', C.pink], ['extreme penalty!', C.amber]], C.pink),
    ...say('0% PROBABILITY → NO UPPER LIMIT', C.pink)
  );

  // 54: Final recap
  await until(S(54));
  await play(
    new M.Indicate(goodDots[0], { color: C.green }), new M.Indicate(goodDots[1], { color: C.green }),
    new M.Indicate(dot01, { color: C.pink }),
    ...fbox([['good prediction → small loss', C.green], ['sure but wrong → huge loss', C.pink], ['loss = −log₂(p)', C.amber]], C.cyan),
    ...say('SMALL LOSS FOR GOOD · HUGE FOR WRONG', C.amber)
  );
}
