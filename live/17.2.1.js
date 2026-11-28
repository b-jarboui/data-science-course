// 17.2.1 Mini-batch SGD. Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play, net } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 3.75, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.1, 0] : [4.35, -0.3, 0];
  const orange = '#fb923c';
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const pt = (x, y) => [x, y, 0];
  const text = (s, x, y, color = C.ink, size = 18, mono = true) => T(String(s), size, color, mono).moveTo(pt(x, y));
  const rect = (x, y, w, h, color, fill = C.card, op = 0.96) => {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.1, color, strokeWidth: 2 });
    r.setFill(fill, op); r.moveTo(pt(x, y)); return r;
  };
  const appear = (...o) => o.map(x => new M.FadeIn(x));
  const leave = (...o) => o.map(x => new M.FadeOut(x));

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const lh = P ? 0.42 : 0.42;
    const rows = lines.map(r => Array.isArray(r) ? r : [r, C.ink]);
    const labels = rows.map(([s, c]) => T(s, P ? 21 : 20, c, true));
    const width = Math.max(...labels.map(l => l.getWidth())) + 0.65, height = rows.length * lh + 0.32;
    const [x, y] = BOXP;
    labels.forEach((l, i) => l.moveTo(pt(x - width / 2 + 0.325 + l.getWidth() / 2, y + ((rows.length - 1) / 2 - i) * lh)));
    const g = new M.VGroup(rect(x, y, width, height, color), ...labels);
    const maxW = P ? FW - 1.0 : 4.7;
    if (width > maxW) g.scale(maxW / width);
    const a = [new M.FadeIn(g)]; if (boxNow) a.push(new M.FadeOut(boxNow));
    boxNow = g; return a;
  }

  // ten cards
  const SL = [2, 4, -2, 0, 2, -2, 0, 2, -4, -2];
  const CW = P ? 1.1 : 0.7, CH = P ? 1.2 : 0.9;
  const cpos = k => P ? [(k % 5 - 2) * 1.5, k < 5 ? 2.2 : 0.0] : [CX + (k - 4.5) * 0.84, 0.6];
  const tagY = k => cpos(k)[1] - CH / 2 - 0.25;
  const card = (k, x, y) => new M.VGroup(rect(x, y, CW, CH, C.cyan, '#18233e'),
    T(String(k), P ? 36 : 30, C.ink, false, true).moveTo(pt(x, y)));
  const cards = SL.map((_, k) => card(k, ...cpos(k)));
  const answers = SL.map((_, k) => text(`ans ${k}`, cpos(k)[0], tagY(k), C.green, P ? 16 : 14));
  const sgn = v => v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0';
  const scol = v => v > 0 ? C.cyan : v < 0 ? C.pink : C.muted;
  const grads = SL.map((v, k) => text(sgn(v), cpos(k)[0], tagY(k), scol(v), P ? 19 : 17));

  // a parcel with a hand-written label (fills the first sentence)
  const parcel = (() => {
    const s = P ? 1.65 : 1, x = P ? 0 : CX, y = P ? -1.0 : -0.4;
    const box = rect(x, y, 4.2 * s, 2.8 * s, C.amber, '#3a2a17', 0.95);
    const lab = rect(x + 0.5 * s, y - 0.2 * s, 2.4 * s, 1.3 * s, C.ink, '#e8edf7', 1);
    const tape = rect(x, y + 1.15 * s, 4.2 * s, 0.35 * s, C.amber, '#5a4320', 1);
    const dig = T('4 0 7 1', P ? 40 : 36, C.bg, true, true).moveTo(pt(x + 0.5 * s, y - 0.2 * s));
    return new M.VGroup(box, tape, lab, dig);
  })();
  await until(S(0)); await play(...appear(parcel), ...say('READ HAND-DRAWN DIGITS'), ...fbox(['goal: read each digit', ['0 to 9', C.amber]]));
  await until(S(1)); await play(...leave(parcel), new M.LaggedStart(cards.map(c => new M.FadeIn(c)), { lagRatio: 0.1, runTime: 1.5 }), ...say('TEN CARDS'));
  await until(S(2)); await play(new M.LaggedStart(answers.map(a => new M.FadeIn(a)), { lagRatio: 0.08, runTime: 1.2 }), ...say('BACK = CORRECT ANSWER', C.green));
  await until(S(3)); await play(...say('CARD = TRAINING EXAMPLE'));

  // 4-20 the network
  const nx = P ? 0.55 : CX + 0.6, ny = P ? -0.6 : -0.5;
  const N = net({ layers: [3, 3, 10], center: pt(nx, ny), width: P ? 4.3 : 5.0, height: P ? 5.4 : 3.2, r: P ? 0.2 : 0.14 });
  const outLab = Array.from({ length: 10 }, (_, i) => text(i, N.pos(2, i)[0] + (P ? 0.45 : 0.4), N.pos(2, i)[1], C.amber, P ? 16 : 16));
  const [ax, ay] = N.pos(0, 0), [hx, hy] = N.pos(1, 0);
  const aTag = text('A', (ax + hx) / 2, ay + 0.3, C.cyan, 18);
  const inX = P ? -2.85 : nx - 3.3;
  const inCard = card(0, inX, ny);
  const inArrow = new M.Arrow({ start: pt(inX + CW / 2 + 0.05, ny), end: pt(ax - 0.3, ay - 0.35), color: C.muted, strokeWidth: 3, buff: 0 });

  await until(S(4)); await play(...leave(...cards, ...answers), ...appear(N.group, ...outLab), ...say('A NEURAL NETWORK'),
    ...fbox(['neural network =', 'neurons in layers']));
  await until(S(5)); await play(new M.LaggedStart(N.nodes.flat().map(n => new M.Indicate(n, { color: C.cyan })), { lagRatio: 0.05, runTime: 1.6 }), ...say('EACH CIRCLE = A NEURON'),
    ...fbox([['circle = neuron', C.cyan]]));
  await until(S(6)); await play(...N.flow(0, C.cyan), ...say('CONNECTIONS CARRY NUMBERS'), ...fbox([['circle = neuron', C.cyan], ['line = connection', C.amber]], C.amber));
  await until(S(7)); await play(...N.weight(0, 0, 0, 0.6), ...N.weight(0, 1, 2, -0.6), ...N.weight(0, 2, 1, 0.9),
    ...say('EACH CONNECTION HAS A WEIGHT'), ...fbox(['weight multiplies the', 'number on its line']));
  await until(S(8)); await play(...appear(aTag), new M.Indicate(N.edges[0][0][0], { color: C.amber }), ...say('WATCH WEIGHT A', C.amber));
  await until(S(9)); await play(...N.weight(0, 0, 0, 1), ...fbox([['weight A = 1', C.cyan]]));
  await until(S(10)); await play(...appear(inCard, inArrow), ...say('SEND THE PICTURE OF 0 FORWARD'));
  await play(...N.flow(0, C.amber));
  await play(...N.flow(1, C.amber));
  await until(S(11)); await play(new M.Indicate(N.nodes[2][6], { color: C.pink }), new M.Indicate(N.nodes[2][0], { color: C.green }),
    ...say('PREDICTION 6  •  ANSWER 0', C.pink), ...fbox([['prediction = 6', C.pink], ['answer     = 0', C.green]], C.pink));
  await until(S(12)); await play(...say('LOSS = HOW WRONG', C.pink), ...fbox([['prediction = 6', C.pink], ['answer     = 0', C.green], ['loss is high', C.pink]], C.pink));
  await until(S(13)); await play(...say('SMALLER LOSS = BETTER PREDICTION', C.green));
  const [ox, oy] = N.pos(2, 0);
  const back = new M.Dot({ point: pt(ox - 0.2, oy), radius: 0.1, color: orange });
  await until(S(14)); await play(...appear(back), ...say('WORK BACKWARDS', orange));
  await play(new M.Transform(back, new M.Dot({ point: pt(hx + 0.2, hy), radius: 0.1, color: orange }), { runTime: 0.8 }));
  await play(new M.Transform(back, new M.Dot({ point: pt(ax + 0.2, ay), radius: 0.1, color: orange }), { runTime: 0.8 }));
  await until(S(15)); await play(...leave(back), new M.Indicate(aTag, { color: orange }), ...say('CARD 0: GRADIENT +2', orange),
    ...fbox(['weight A = 1', ['card 0 gradient = +2', orange]], orange));
  await until(S(16)); await play(...say('GRADIENT = HOW FAST LOSS CHANGES', orange),
    ...fbox(['change weight A a bit', ['→ how much does loss move?', orange]], orange));
  await until(S(17)); await play(...say('GRADIENT +  →  MAKE WEIGHT SMALLER', C.cyan),
    ...fbox([['gradient +  →  decrease ←', C.cyan]], C.cyan));
  await until(S(18)); await play(...say('GRADIENT −  →  MAKE WEIGHT BIGGER', C.pink),
    ...fbox([['gradient +  →  decrease ←', C.cyan], ['gradient −  →  increase →', C.pink]], C.pink));
  const inCard1 = card(1, inX, ny);
  await until(S(19)); await play(new M.Transform(inCard, inCard1), ...say('CARD 1: GRADIENT +4', orange),
    ...fbox([['card 0 gradient = +2', orange], ['card 1 gradient = +4', orange]], orange));
  await until(S(20)); await play(...say('DIFFERENT CARDS, DIFFERENT ADVICE', C.amber));

  // 21-29 the cards again, with grads
  await until(S(21)); await play(...leave(N.group, ...outLab, aTag, inCard, inArrow, ...N.labels),
    ...appear(...cards), new M.LaggedStart(grads.map(s => new M.FadeIn(s)), { lagRatio: 0.06, runTime: 1.2 }),
    ...say('ALL CARDS? MILLIONS = TOO SLOW', C.pink), ...fbox(['each card: a gradient', ['millions of cards!', C.pink]], C.pink));
  await until(S(22)); await play(new M.LaggedStart(cards.map(c => new M.Indicate(c, { color: C.amber })), { lagRatio: 0.06, runTime: 1.8 }), ...say('MIX, THEN PICK 2 WITHOUT LOOKING'));
  const outline = (k, col = C.amber) => { const [x, y] = cpos(k); const r = new M.RoundedRectangle({ width: CW + 0.18, height: CH + 0.62, cornerRadius: 0.14, color: col, strokeWidth: 4 }); r.moveTo(pt(x, y - 0.22)); return r; };
  let pair = [outline(0), outline(1)];
  await until(S(23)); await play(...pair.map(o => new M.Create(o)), ...say('TWO CARDS ESTIMATE THE CHANGE', C.amber));
  await until(S(24)); await play(...say('SMALL GROUP = MINI-BATCH', C.amber), ...fbox([['mini-batch = 2 cards', C.amber]], C.amber));
  await until(S(25)); await play(new M.Indicate(cards[0], { color: C.amber }), new M.Indicate(cards[1], { color: C.amber }), ...say('PAIR: CARDS 0 AND 1', C.amber));
  await until(S(26)); await play(new M.Indicate(grads[0], { color: C.amber }), new M.Indicate(grads[1], { color: C.amber }), ...fbox(['gradients: 2 and 4'], C.amber));
  await until(S(27)); await play(...fbox(['gradients: 2 and 4', ['2 + 4 = 6', C.amber]], C.amber), ...say('ADD', C.amber));
  await until(S(28)); await play(...fbox(['gradients: 2 and 4', '2 + 4 = 6', ['6 ÷ 2 = 3', C.amber]], C.amber), ...say('DIVIDE BY 2 CARDS', C.amber));
  await until(S(29)); await play(...fbox(['2 + 4 = 6', '6 ÷ 2 = 3', ['mean gradient = 3', C.green]], C.green), ...say('MEAN GRADIENT = 3', C.green));

  // 30-42 the weight on a line
  const LY = P ? -2.8 : -2.0, LX0 = P ? -3.2 : CX - 3.6, LX1 = P ? 3.2 : CX + 3.6;
  const wx = v => LX0 + (v - 0.5) * (LX1 - LX0);
  const axis = new M.VGroup(new M.Line({ start: pt(LX0, LY), end: pt(LX1, LY), color: C.muted, strokeWidth: 3 }),
    ...[0.5, 0.7, 1, 1.1, 1.5].flatMap(v => [new M.Line({ start: pt(wx(v), LY - 0.08), end: pt(wx(v), LY + 0.08), color: C.muted, strokeWidth: 2 }),
      text(v, wx(v), LY - 0.32, C.muted, 15)]),
    text('weight A', LX1 - 0.55, LY + 0.35, C.muted, 15));
  const wdot = new M.Dot({ point: pt(wx(1), LY), radius: 0.13, color: C.cyan });
  const mark = (v, col = C.cyan) => new M.Dot({ point: pt(wx(v), LY), radius: 0.13, color: col });
  const step = (a, b, col) => new M.Arrow({ start: pt(wx(a), LY + 0.45), end: pt(wx(b), LY + 0.45), color: col, strokeWidth: 4, buff: 0 });
  await until(S(30)); await play(...appear(axis, wdot), ...say('MOVE AGAINST THE GRADIENT, NOT TOO FAR'));
  await until(S(31)); await play(...say('LEARNING RATE = 0.1'), ...fbox(['mean gradient = 3', ['learning rate = 0.1', C.cyan]]));
  await until(S(32)); await play(...fbox(['mean gradient = 3', 'learning rate = 0.1', ['3 × 0.1 = 0.3', C.amber]], C.amber));
  let arr = step(1, 0.7, C.amber);
  await until(S(33)); await play(new M.Create(arr), ...say('GRADIENT +  →  SUBTRACT 0.3', C.amber),
    ...fbox(['3 × 0.1 = 0.3', ['1 − 0.3 = 0.7', C.amber]], C.amber));
  await until(S(34)); await play(new M.Transform(wdot, mark(0.7, C.amber)), ...say('WEIGHT A: 1 → 0.7', C.amber));
  await until(S(35)); await play(new M.Transform(wdot, mark(1)), ...leave(arr, ...pair), ...say('RESET A TO 1. NEW PAIR?'));
  pair = [outline(2, C.pink), outline(3, C.pink)];
  await until(S(36)); await play(...pair.map(o => new M.Create(o)), ...say('PAIR: CARDS 2 AND 3', C.pink));
  await until(S(37)); await play(...fbox(['gradients: −2 and 0', '−2 + 0 = −2', ['−2 ÷ 2 = −1', C.pink]], C.pink), ...say('MEAN GRADIENT = −1', C.pink));
  arr = step(1, 1.1, C.pink);
  await until(S(38)); await play(new M.Create(arr), ...fbox(['−1 × 0.1 = −0.1', ['1 + 0.1 = 1.1', C.pink]], C.pink), ...say('GRADIENT −  →  ADD 0.1', C.pink));
  await until(S(39)); await play(new M.Transform(wdot, mark(1.1, C.pink)), ...say('WEIGHT A: 1 → 1.1', C.pink));
  await until(S(40)); await play(new M.Transform(wdot, mark(1)), ...leave(arr, ...pair), ...say('RESET. PAIR: CARDS 4 AND 5'));
  pair = [outline(4, C.green), outline(5, C.green)];
  await play(...pair.map(o => new M.Create(o)));
  await until(S(41)); await play(...fbox(['gradients: +2 and −2', '2 + (−2) = 0', ['0 ÷ 2 = 0', C.green]], C.green), ...say('MEAN GRADIENT = 0', C.green));
  await until(S(42)); await play(new M.Indicate(wdot, { color: C.green }), ...say('WEIGHT A STAYS AT 1', C.green));
  await until(S(43)); await play(...leave(...pair), ...say('THREE SEPARATE TESTS, SAME START'),
    ...fbox([['0, 1  →  0.7', C.amber], ['2, 3  →  1.1', C.pink], ['4, 5  →  1', C.green]]));
  await until(S(44)); await play(new M.Transform(wdot, mark(0.7, C.green)), ...say('REAL TRAINING: KEEP EACH NEW WEIGHT', C.green),
    ...fbox(['step 1: 1 → 0.7', ['step 2 starts at 0.7', C.green], 'fresh gradients each step'], C.green));

  // 45-50 name and formula
  await until(S(45)); await play(...say('MINI-BATCH SGD', C.amber), ...fbox([['Mini-batch', C.amber], ['Stochastic', C.cyan], ['Gradient Descent', C.green]], C.amber));
  await until(S(46)); await play(new M.LaggedStart(cards.map(c => new M.Indicate(c, { color: C.cyan })), { lagRatio: 0.05, runTime: 1.4 }), ...say('STOCHASTIC = CHANCE PICKS THE CARDS'));
  await until(S(47)); await play(...say('GRADIENT DESCENT = GO AGAINST THE GRADIENT', C.green));
  await until(S(48)); await play(...say('ONE FORMULA', C.amber));
  await until(S(49)); await play(...fbox(['new weight = old weight', '  − learning rate', '    × mean batch gradient', ['1 − 0.1 × 3 = 0.7', C.amber]], C.amber));
  await until(S(50)); await play(...say('MANY STEPS, NO NEED TO READ EVERY CARD', C.green));

  // 51-54 the whole tray
  await until(S(51)); await play(...leave(axis, wdot), new M.LaggedStart(cards.map(c => new M.Indicate(c, { color: C.violet })), { lagRatio: 0.06, runTime: 1.6 }),
    ...say('ALL TEN CARDS, WEIGHT A = 1', C.violet));
  await until(S(52)); await play(new M.LaggedStart(grads.map(s => new M.Indicate(s, { color: C.violet })), { lagRatio: 0.06, runTime: 1.4 }),
    ...fbox(['2+4−2+0+2', '−2+0+2−4−2 = 0', ['0 ÷ 10 = 0', C.violet]], C.violet), ...say('THE GRADIENTS CANCEL: MEAN = 0', C.violet));
  pair = [outline(0), outline(1)];
  await until(S(53)); await play(...pair.map(o => new M.Create(o)), ...say('PAIR SAYS 3  •  ALL TEN SAY 0', C.amber),
    ...fbox([['pair 0, 1: mean 3', C.amber], ['all ten:   mean 0', C.violet]], C.amber));
  await until(S(54)); await play(...say('SMALL STEPS, SMALL RANDOM GROUPS', C.green),
    ...fbox(['new weight = old weight', '  − rate × mean batch gradient'], C.green));
}
