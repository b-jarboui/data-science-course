// 17.2.9 Batch normalization. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const CX = P ? 0.4 : -2.6;
  const PILL = P ? [0, 4.05, 0] : [-2.6, 1.85, 0];
  const BOXP = P ? [0, -5.3, 0] : [4.3, -0.3, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const pt = (x, y) => [x, y, 0];
  const fade = (o, runTime = 0.4) => new M.FadeIn(o, { runTime });
  const out = o => new M.FadeOut(o, { runTime: 0.35 });
  const text = (s, x, y, c = C.ink, size = 19) => { const t = T(s, size, c, true); t.moveTo(pt(x, y)); return t; };

  let boxNow = null;
  function box(lines, color = C.cyan) {
    const lh = P ? 0.41 : 0.39;
    const labels = lines.map((row, i) => { const [v, ink] = Array.isArray(row) ? row : [row, C.ink]; return text(v, 0, ((lines.length - 1) / 2 - i) * lh, ink, P ? 22 : 21); });
    const w = Math.max(...labels.map(l => l.getWidth())) + 0.5, h = lines.length * lh + 0.24;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(pt(0, 0));
    const g = new M.VGroup(r, ...labels);
    const maxW = P ? FW - 1.2 : 4.6; if (w > maxW) g.scale(maxW / w);
    g.moveTo(BOXP);
    const a = [fade(g)]; if (boxNow) a.push(out(boxNow)); boxNow = g; return a;
  }

  function card(digit, x, y, scale, color) {
    const pix = digit === 0 ? ['0110', '1001', '1001', '1001', '0110'] : ['0010', '0110', '0010', '0010', '0111'];
    const b = new M.RoundedRectangle({ width: 1.8, height: 2.1, cornerRadius: 0.16, color, strokeWidth: 2 });
    b.setFill(C.card, 0.96); b.moveTo(pt(0, 0));
    const parts = [b];
    pix.forEach((row, r) => [...row].forEach((c, k) => {
      const q = new M.Rectangle({ width: 0.27, height: 0.27, color: c === '1' ? C.ink : C.grid, strokeWidth: 1 });
      q.setFill(c === '1' ? C.ink : C.grid, c === '1' ? 0.92 : 0.35); q.moveTo(pt((k - 1.5) * 0.3, (2 - r) * 0.3 - 0.12)); parts.push(q);
    }));
    if (scale > 0.5) parts.push(text('CARD ' + digit, 0, 0.78, color, 15));
    const g = new M.VGroup(...parts); g.scale(scale); g.moveTo(pt(x, y)); return g;
  }

  const N = net({ layers: [3, 3, 3, 2], center: pt(CX, P ? 1.4 : 0.0), width: P ? 5.4 : 6, height: P ? 3.2 : 2.4 });

  // signal pulses: dots travel along every link of layer l (leaves no marks behind)
  async function flow(l, color, ...anims) {
    const R = N.nodes[0][0].getWidth() / 2, ds = [], ts = [];
    N.edges[l].forEach((row, i) => row.forEach((_, j) => {
      const a = N.pos(l, i), b = N.pos(l + 1, j);
      const d = new M.Dot({ point: [a[0] + R, a[1], 0], radius: 0.07, color }); d.setFill(color, 1);
      const t = new M.Dot({ point: [b[0] - R, b[1], 0], radius: 0.07, color }); t.setFill(color, 1);
      ds.push(d); ts.push(t);
    }));
    await play(...ds.map(d => new M.FadeIn(d, { runTime: 0.15 })), ...anims);
    await play(...ds.map((d, k) => new M.Transform(d, ts[k], { runTime: 0.8 })));
    await play(new M.FadeOut(new M.VGroup(...ds), { runTime: 0.25 }));
  }
  const HX = N.pos(1, 1)[0], HY = N.pos(1, 1)[1], X0 = N.pos(0, 1)[0];

  // number line -4 .. 8
  const NL_Y = P ? -3.0 : -2.95, NX0 = P ? -3.5 : -5.6, NLEN = P ? 7.0 : 6.0, U = NLEN / 12;
  const nx = v => NX0 + (v + 4) * U;
  const nline = new M.Line({ start: pt(NX0, NL_Y), end: pt(NX0 + NLEN, NL_Y), color: C.muted, strokeWidth: 3 });
  const ticks = [-4, -2, 0, 2, 4, 6, 8].map(v => new M.VGroup(
    new M.Line({ start: pt(nx(v), NL_Y - 0.07), end: pt(nx(v), NL_Y + 0.07), color: C.muted }),
    text(String(v).replace('-', '−'), nx(v), NL_Y - 0.3, C.muted, 16)));
  const dots = [null, null];
  function dotTo(k, v, label) {
    const color = k === 0 ? C.cyan : C.amber;
    const d = new M.Dot({ point: pt(nx(v), NL_Y + 0.2), radius: 0.12, color }); d.setFill(color, 1);
    const g = new M.VGroup(d, text(label, nx(v), NL_Y + 0.52, color, P ? 19 : 17));
    const a = dots[k] ? [out(dots[k])] : []; dots[k] = g; a.push(fade(g)); return a;
  }
  let meanG = null;
  function meanAt(v, label) {
    const ln = new M.DashedLine({ start: pt(nx(v), NL_Y - 0.12), end: pt(nx(v), NL_Y + 0.62), color: C.violet });
    const g = new M.VGroup(ln, text(label, nx(v) + 0.5, NL_Y + 0.85, C.violet, 16));
    const a = meanG ? [out(meanG)] : []; meanG = g; a.push(fade(g)); return a;
  }

  // readings next to the chosen neuron
  let rTop = null, rBot = null;
  function readings(top, bot) {
    const a = [];
    if (rTop) a.push(out(rTop)); if (rBot) a.push(out(rBot));
    rTop = text(top, HX, HY + 0.58, C.cyan, 19); rBot = text(bot, HX, HY - 0.58, C.amber, 19);
    return [...a, fade(rTop), fade(rBot)];
  }

  // activations shown at the watched neuron (kept in step with the number line)
  function setR(top, bot) {
    const a = [];
    if (rTop) a.push(out(rTop)); if (rBot) a.push(out(rBot));
    rTop = text(top, HX, HY + 0.6, C.cyan, P ? 21 : 19); rBot = text(bot, HX, HY - 0.6, C.amber, P ? 21 : 19);
    return [...a, fade(rTop), fade(rBot)];
  }
  // 0-2
  const c0 = card(0, P ? -1.3 : 3.2, P ? -3.0 : -0.4, P ? 1.1 : 1, C.cyan), c1 = card(1, P ? 1.3 : 5.6, P ? -3.0 : -0.4, P ? 1.1 : 1, C.amber);
  await until(S(0)); await play(fade(N.group), ...say('A NETWORK LEARNS TO READ DIGITS'), ...box(['neural network:', ['read parcel digits', C.cyan]]));
  await until(S(1)); await play(fade(c0), fade(c1), ...say('TWO CARDS: 0 AND 1'), ...(P ? [] : [out(boxNow)]));
  if (!P) boxNow = null;
  const s0 = card(0, X0 - 0.95, HY + 0.56, 0.3, C.cyan), s1 = card(1, X0 - 0.95, HY - 0.56, 0.3, C.amber);
  await until(S(2)); await play(out(c0), out(c1), fade(s0), fade(s1), ...say('SEND BOTH THROUGH THE NETWORK'), ...box(['cards 0 and 1', ['→ the network', C.cyan]]));
  await flow(0, C.cyan);

  // 3-6 hidden neuron, readings 2 and 6
  const ring = new M.Circle({ radius: 0.42, color: C.green, strokeWidth: 4 }); ring.setFill(C.card, 0); ring.moveTo(pt(HX, HY));
  await until(S(3)); await play(new M.Create(ring), ...say('WATCH ONE NEURON', C.green));
  const hidFrame = new M.RoundedRectangle({ width: N.pos(2, 0)[0] - HX + 1, height: (P ? 3.2 : 2.4) + 0.9, cornerRadius: 0.16, color: C.violet, strokeWidth: 2 });
  hidFrame.setFill(C.card, 0); hidFrame.moveTo(pt((HX + N.pos(2, 0)[0]) / 2, HY));
  await until(S(4)); await play(new M.Create(hidFrame), ...say('REMEMBER: HIDDEN LAYER', C.violet), ...box(['hidden layer =', ['between input and output', C.violet]], C.violet));
  await until(S(5)); await play(out(hidFrame), fade(rTop = text('2', HX, HY + 0.6, C.cyan, P ? 21 : 19)), new M.Indicate(s0, { color: C.cyan }), ...say('CARD 0 → ACTIVATION 2'), ...box([['card 0: activation 2', C.cyan]]));
  await until(S(6)); await play(fade(rBot = text('6', HX, HY - 0.6, C.amber, P ? 21 : 19)), new M.Indicate(s1, { color: C.amber }), ...say('CARD 1 → ACTIVATION 6', C.amber), ...box([['card 0: activation 2', C.cyan], ['card 1: activation 6', C.amber]], C.amber));

  // 7-12 number line, move and stretch
  await until(S(7)); await play(new M.Create(nline), fade(new M.VGroup(...ticks)), ...dotTo(0, 2, '2'), ...dotTo(1, 6, '6'), ...say('ACTIVATIONS ON A NUMBER LINE'));
  await until(S(8)); await play(...dotTo(0, 3, '3'), ...dotTo(1, 8, '8'), ...say('WEIGHTS CHANGE → ACTIVATIONS CHANGE SIZE', C.amber));
  await play(...dotTo(0, 2, '2'), ...dotTo(1, 6, '6'));
  await until(S(9)); await play(...say('KEEP THEM A USEFUL SIZE?', C.violet));
  await until(S(10)); await play(...meanAt(4, 'center'), ...say('MOVE THE CENTER TO ZERO', C.violet));
  await play(...meanAt(0, 'center'), ...dotTo(0, -2, '−2'), ...dotTo(1, 2, '2'));
  await until(S(11)); await play(...dotTo(0, -1, '−1'), ...dotTo(1, 1, '1'), ...say('CHANGE THE SPACING', C.violet));
  await until(S(12)); await play(new M.Indicate(dots[0], { color: C.cyan }), new M.Indicate(dots[1], { color: C.amber }), ...say('SAME ORDER, NEW CENTER AND SPREAD', C.green));

  // 13-16 batch normalization
  await until(S(13)); await play(out(meanG), ...dotTo(0, 2, '2'), ...dotTo(1, 6, '6'), ...say('NOW INSIDE THE NETWORK: 2 AND 6'));
  meanG = null;
  await until(S(14)); await play(new M.Indicate(s0, { color: C.green }), new M.Indicate(s1, { color: C.green }), ...box(['batch', ['= a small group of cards', C.green]], C.green), ...say('A BATCH OF CARDS', C.green));
  await until(S(15)); await play(...box(['center → 0', 'adjust the spread'], C.violet), ...say('CENTER AND SPREAD', C.violet));
  await until(S(16)); await play(...box([['Batch normalization', C.cyan]]), ...say('BATCH NORMALIZATION'));

  // 17-21 mean (network rests, the number line works)
  await until(S(17)); await play(...say('STEP BY STEP WITH 2 AND 6'));
  await until(S(18)); await play(...box(['Step 1: the mean', ['= the fair share', C.violet]], C.violet), ...say('FIND THE MEAN', C.violet));
  await until(S(19)); await play(...box(['Step 1: the mean', ['2 + 6 = 8', C.violet]], C.violet));
  await until(S(20)); await play(...box(['Step 1: the mean', '2 + 6 = 8', ['8 ÷ 2 = 4', C.violet]], C.violet));
  await until(S(21)); await play(...meanAt(4, 'mean 4'), ...say('MEAN = 4', C.violet));

  // 22-26 subtract the mean
  await until(S(22)); await play(...box(['Step 2: subtract the mean'], C.cyan), ...say('SUBTRACT THE MEAN'));
  await until(S(23)); await play(...dotTo(0, -2, '−2'), ...setR('−2', '6'), ...box(['Step 2: subtract the mean', ['2 − 4 = −2', C.cyan]]));
  await until(S(24)); await play(...dotTo(1, 2, '2'), ...setR('−2', '2'), ...meanAt(0, 'mean 0'), ...box(['Step 2: subtract the mean', ['2 − 4 = −2', C.cyan], ['6 − 4 = 2', C.amber]]));
  const armL = new M.Line({ start: pt(nx(-2), NL_Y - 0.55), end: pt(nx(0), NL_Y - 0.55), color: C.green, strokeWidth: 5 });
  const armR = new M.Line({ start: pt(nx(0), NL_Y - 0.55), end: pt(nx(2), NL_Y - 0.55), color: C.green, strokeWidth: 5 });
  await until(S(25)); await play(new M.Create(armL), new M.Create(armR), ...say('BOTH 2 AWAY FROM ZERO', C.green));
  await until(S(26)); await play(out(new M.VGroup(armL, armR)), ...box([['centered activations', C.cyan], '−2 and 2', 'their mean = 0']), ...say('CENTERED ACTIVATIONS'));

  // 27-35 spread: squares, variance, standard deviation
  await until(S(27)); await play(...say('HOW FAR DO THEY SPREAD?', C.amber));
  const side = 2 * U;
  const sq = (from, color) => { const r = new M.Rectangle({ width: side, height: side, color, strokeWidth: 2 }); r.setFill(color, 0.18); r.moveTo(pt(nx(from) , NL_Y + 0.25 + side / 2)); return r; };
  const sqL = sq(-1, C.cyan), sqR = sq(1, C.amber);
  await until(S(28)); await play(...box(['multiply each by itself'], C.amber), ...say('SQUARE EACH CENTERED ACTIVATION', C.amber));
  await until(S(29)); await play(new M.Create(sqL), ...dotTo(0, -2, '−2'), ...box([['−2 × −2 = 4', C.cyan]], C.amber));
  await until(S(30)); await play(new M.Create(sqR), ...dotTo(1, 2, '2'), ...box([['−2 × −2 = 4', C.cyan], ['2 × 2 = 4', C.amber]], C.amber));
  await until(S(31)); await play(...box(['mean of the squares'], C.amber), ...say('MEAN OF THE SQUARES', C.amber));
  await until(S(32)); await play(...box(['4 + 4 = 8', ['8 ÷ 2 = 4', C.amber]], C.amber));
  await until(S(33)); await play(new M.Indicate(sqL, { color: C.green }), new M.Indicate(sqR, { color: C.green }), ...box([['variance = 4', C.green]], C.green), ...say('VARIANCE = MEAN SQUARE', C.green));
  const spread = new M.Line({ start: pt(nx(0), NL_Y - 0.55), end: pt(nx(2), NL_Y - 0.55), color: C.green, strokeWidth: 6 });
  const spreadT = text('2', nx(1), NL_Y - 0.8, C.green, 16);
  await until(S(34)); await play(out(new M.VGroup(sqL, sqR)), new M.Create(spread), fade(spreadT), ...box(['√4 = 2'], C.green), ...say('SQUARE ROOT OF 4 = 2', C.green));
  await until(S(35)); await play(...box([['standard deviation = 2', C.green], 'the size of the spread'], C.green), ...say('STANDARD DEVIATION', C.green));

  // 36-42 divide by the spread
  await until(S(36)); await play(...box(['Step 3: divide by 2'], C.violet), ...say('DIVIDE BY THE SPREAD', C.violet));
  await until(S(37)); await play(...dotTo(0, -1, '−1'), ...setR('−1', '2'), ...box(['Step 3: divide by 2', ['−2 ÷ 2 = −1', C.cyan]], C.violet));
  await until(S(38)); await play(...dotTo(1, 1, '1'), ...setR('−1', '1'), out(new M.VGroup(spread, spreadT)), ...box(['Step 3: divide by 2', ['−2 ÷ 2 = −1', C.cyan], ['2 ÷ 2 = 1', C.amber]], C.violet));
  await until(S(39)); await play(...box(['2 and 6', ['→ about −1 and 1', C.green]], C.green), ...say('NOW ABOUT −1 AND 1', C.green));
  await until(S(40)); await play(...box(['× learned multiplier', '+ learned number'], C.violet), ...say('THE NETWORK CAN LEARN TWO MORE NUMBERS', C.violet));
  await until(S(41)); await play(...box(['× 1', '+ 0'], C.violet), ...say('MULTIPLIER 1, ADD 0', C.violet));
  await until(S(42)); await play(...box(['−1 × 1 + 0 = −1', '1 × 1 + 0 = 1'], C.green), ...say('STILL ABOUT −1 AND 1', C.green));

  // 43 back to the network
  await until(S(43)); await play(new M.Indicate(ring, { color: C.green }), ...say('NEW ACTIVATIONS MOVE FORWARD'));
  await flow(1, C.green);
  await flow(2, C.green);

  // 44-48 formula and the tiny number
  await until(S(44)); await play(...say('ONE SHORT FORMULA'));
  await until(S(45)); await play(...box(['normalized =', ['(activation − batch mean)', C.violet], ['÷ adjusted std. deviation', C.green]]));
  await until(S(46)); await play(...box(['adjusted std. deviation', ['= √(variance + tiny number)', C.green]], C.green), ...say('ADD A TINY POSITIVE NUMBER', C.green));
  await until(S(47)); await play(...dotTo(0, 3, ' '), ...dotTo(1, 3, '3 and 3'), ...setR('3', '3'), out(meanG), ...box(['equal activations: 3 and 3', 'variance = 0', ['÷ 0  is not allowed', C.pink]], C.pink), ...say('WITHOUT IT: DIVIDE BY ZERO', C.pink));
  meanG = null;
  await until(S(48)); await play(...dotTo(0, 0, ' '), ...dotTo(1, 0, '0 and 0'), ...setR('0', '0'), ...box(['0 ÷ √(0 + tiny) = 0'], C.green), ...say('WITH IT: BOTH BECOME 0', C.green));

  // 49-53 summary
  await until(S(49)); await flow(1, C.cyan, ...dotTo(0, -1, '−1'), ...dotTo(1, 1, '1'), ...setR('−1', '1'), ...box(['activations stay', ['a stable size', C.green]], C.green), ...say('MORE STABLE ACTIVATIONS', C.green));
  await until(S(50)); await play(...say('SMOOTHER LEARNING', C.green));
  await until(S(51)); await play(...box([['tiny batch', C.pink], 'unreliable mean and spread'], C.pink), ...say('TOO SMALL A BATCH: UNRELIABLE', C.pink));
  await until(S(52)); await play(...box(['predictions use', ['mean and variance', C.violet], 'saved during training'], C.violet), ...say('PREDICTING: USE SAVED VALUES', C.violet));
  await until(S(53)); await play(...box([['Batch normalization', C.cyan], 'center the activations', 'adjust their spread']), ...say('REMEMBER: CENTER AND SCALE', C.cyan));
}
