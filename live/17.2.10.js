// 17.2.10 Dropout. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 4.05, 0] : [-2.6, 1.85, 0];
  const BOXP = P ? [0, -5.3, 0] : [4.3, 0.4, 0];
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
    const maxW = P ? FW - 1.0 : 4.6; if (w > maxW) g.scale(maxW / w);
    g.moveTo(BOXP);
    const a = [fade(g)]; if (boxNow) a.push(out(boxNow)); boxNow = g; return a;
  }
  const clearBox = () => { const a = boxNow ? [out(boxNow)] : []; boxNow = null; return a; };

  function card(x, y, scale, thick) {
    const pix = ['0110', '1001', '0010', '0100', '1111'];
    const b = new M.RoundedRectangle({ width: 1.8, height: 2.1, cornerRadius: 0.16, color: C.cyan, strokeWidth: 2 });
    b.setFill(C.card, 0.96); b.moveTo(pt(0, 0));
    const parts = [b], s = thick ? 0.3 : 0.15;
    pix.forEach((row, r) => [...row].forEach((c, k) => {
      if (c !== '1') return;
      const q = new M.Rectangle({ width: s, height: s, color: C.ink, strokeWidth: 1 });
      q.setFill(C.ink, 0.92); q.moveTo(pt((k - 1.5) * 0.3, (2 - r) * 0.3 - 0.12)); parts.push(q);
    }));
    parts.push(text(thick ? 'THICK' : 'THIN', 0, 0.78, C.cyan, 15));
    const g = new M.VGroup(...parts); g.scale(scale); g.moveTo(pt(x, y)); return g;
  }
  function person(x, y, color) {
    const k = P ? 1.6 : 1;
    const head = new M.Circle({ radius: 0.13 * k, color }); head.setFill(color, 1); head.moveTo(pt(x, y + 0.33 * k));
    const body = new M.Arc({ radius: 0.24 * k, startAngle: 0, angle: Math.PI, color }); body.setFill(color, 1); body.moveTo(pt(x, y));
    return new M.VGroup(head, body);
  }

  const N = net({ layers: [3, 4, 3, 1], center: pt(CX, P ? 1.25 : -0.35), width: P ? 6.4 : 6, height: P ? 3.4 : 2.7, r: P ? 0.32 : 0.28 });
  const H = [0, 1, 2, 3].map(i => N.pos(1, i));

  // signal pulses along the links of layer l from the listed source neurons
  async function flow(l, color, srcs, ...anims) {
    const R = P ? 0.32 : 0.28, ds = [], ts = [];
    N.edges[l].forEach((row, i) => { if (srcs && !srcs.includes(i)) return; row.forEach((_, j) => {
      const a = N.pos(l, i), b = N.pos(l + 1, j);
      const d = new M.Dot({ point: pt(a[0] + R, a[1]), radius: 0.07, color }); d.setFill(color, 1);
      const t = new M.Dot({ point: pt(b[0] - R, b[1]), radius: 0.07, color }); t.setFill(color, 1);
      ds.push(d); ts.push(t);
    }); });
    await play(...ds.map(d => new M.FadeIn(d, { runTime: 0.15 })), ...anims);
    await play(...ds.map((d, k) => new M.Transform(d, ts[k], { runTime: 0.8 })));
    await play(new M.FadeOut(new M.VGroup(...ds), { runTime: 0.25 }));
  }

  // hidden readings, dark neurons, coins
  const vals = i => N.value(1, i, ['2', '4', '6', '8'][i]);
  function setVals(list, color = C.ink) { return list.flatMap((v, i) => N.value(1, i, v, v === '0' ? C.muted : color)); }
  const darks = {};
  function darken(i) {
    const c = new M.Circle({ radius: P ? 0.34 : 0.3, color: C.grid, strokeWidth: 3 }); c.setFill(C.bg, 0.78); c.moveTo(H[i]);
    const es = N.edges[1][i].map(e => { const k = e.copy(); k.setStroke(C.bg, 6, 0.85); return k; });
    const g = new M.VGroup(...es, c); darks[i] = g; return [fade(g)];
  }
  function lighten(i) { const g = darks[i]; delete darks[i]; return g ? [out(g)] : []; }
  const lightenAll = () => Object.keys(darks).flatMap(k => lighten(+k));
  let coins = [];
  function toss(keep) {
    const a = coins.map(out);
    coins = H.map((p, i) => { const col = keep.includes(i) ? C.green : C.pink; const c = new M.Circle({ radius: P ? 0.2 : 0.17, color: col, strokeWidth: 3 }); c.setFill(col, 0.55); c.moveTo(pt(p[0] - (P ? 0.62 : 0.55), p[1])); return c; });
    return [...a, new M.LaggedStart(coins.map(c => new M.FadeIn(c, { shift: [0, -0.45, 0] })), { lagRatio: 0.3, runTime: 1.2 })];
  }

  // 0-2 thick and thin
  const thick = card(P ? -1.4 : -4.0, P ? 1.0 : -0.4, P ? 1.3 : 1, true), thin = card(P ? 1.4 : -1.2, P ? 1.0 : -0.4, P ? 1.3 : 1, false);
  const rr = (x, y, w, h, color, fill) => { const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.1, color, strokeWidth: 2 }); r.setFill(fill, 1); r.moveTo(pt(x, y)); return r; };
  const parcel = (() => {
    const s = P ? 1.5 : 1, x = CX, y = P ? 0.8 : -0.4;
    return new M.VGroup(rr(x, y, 4.2 * s, 2.8 * s, C.amber, '#3a2a17'), rr(x, y + 1.15 * s, 4.2 * s, 0.35 * s, C.amber, '#5a4320'),
      rr(x + 0.5 * s, y - 0.2 * s, 2.4 * s, 1.3 * s, C.ink, '#e8edf7'), T('4 0 7 1', P ? 40 : 36, C.bg, true, true).moveTo(pt(x + 0.5 * s, y - 0.2 * s)));
  })();
  await until(S(0)); await play(fade(parcel), ...say('A NETWORK LEARNS TO READ DIGITS'), ...box(['goal: read each digit', ['0 to 9', C.amber]]));
  await until(S(1)); await play(out(parcel), fade(thick), fade(thin), ...say('THICK LINES, THIN LINES'), ...box(['same digit,', ['different pen', C.amber]], C.amber));
  await until(S(2)); await play(new M.Indicate(thick, { color: C.green }), new M.Indicate(thin, { color: C.green }), ...say('SAME DIGIT: 2', C.green));

  // 3-6 network and four hidden readings
  await until(S(3)); await play(out(thick), out(thin), fade(N.group), ...say('NEURONS IN LAYERS'), ...box(['circle = neuron', ['line = connection', C.amber]]));
  await until(S(4)); await flow(0, C.cyan, null, ...say('NUMBERS TRAVEL ALONG THE CONNECTIONS'));
  const hf = new M.RoundedRectangle({ width: 0.8, height: (P ? 3.4 : 2.7) + 0.85, cornerRadius: 0.16, color: C.violet, strokeWidth: 2 });
  hf.setFill(C.card, 0); hf.moveTo(pt(H[0][0], N.pos(1, 0)[1] - (N.pos(1, 0)[1] - N.pos(1, 3)[1]) / 2));
  await until(S(5)); await play(new M.Create(hf), ...say('FOUR NEURONS IN ONE HIDDEN LAYER', C.violet));
  await until(S(6)); await play(out(hf), ...vals(0), ...vals(1), ...vals(2), ...vals(3), ...say('ACTIVATIONS: 2, 4, 6, 8'), ...box(['activations', ['2, 4, 6, 8', C.amber]], C.amber));
  await until(S(7)); await play(new M.Indicate(N.nodes[1][3], { color: C.amber }), ...N.weight(1, 3, 0, 1), ...N.weight(1, 3, 1, 1), ...N.weight(1, 3, 2, 1), ...say('TOO MUCH TRUST IN A FEW NEURONS', C.amber));

  // 8-11 the team
  const TX = P ? [-2.1, -0.7, 0.7, 2.1] : [2.8, 3.8, 4.8, 5.8], TY = P ? -2.6 : -1.7;
  const team = TX.map((x, i) => person(x, TY, i === 3 ? C.amber : C.cyan));
  await until(S(8)); await play(new M.LaggedStart(team.map(p => fade(p)), { lagRatio: 0.2, runTime: 1 }), ...say('A TEAM OF FOUR'));
  await until(S(9)); await play(new M.Indicate(team[3], { color: C.amber }), ...say('ONE PERSON SOLVES EVERYTHING', C.amber));
  const gone = [1, 3].map(i => { const c = new M.DashedLine({ start: pt(TX[i] - 0.25, TY - 0.05), end: pt(TX[i] + 0.25, TY - 0.05), color: C.muted }); return c; });
  await until(S(10)); await play(out(team[1]), out(team[3]), ...gone.map(g => new M.Create(g)), ...say('SOMETIMES SOMEONE IS ABSENT', C.violet));
  await until(S(11)); await play(new M.Indicate(team[0], { color: C.green }), new M.Indicate(team[2], { color: C.green }), ...say('THE OTHERS LEARN TO DO THE WORK', C.green));

  // 12-14 dropout
  await until(S(12)); await play(out(new M.VGroup(team[0], team[2], ...gone)), ...say('THE SAME IDEA INSIDE THE NETWORK'), ...box(['same idea:', ['some neurons absent', C.violet]], C.violet));
  await until(S(13)); await play(...box(['each training step:', ['random activations → 0', C.violet]], C.violet), ...say('SET RANDOM ACTIVATIONS TO 0', C.violet));
  await until(S(14)); await play(...box([['Dropout', C.violet]], C.violet), ...say('DROPOUT', C.violet));

  // 15-22 coins
  await until(S(15)); await play(...box(['each neuron', ['probability 0.5: kept', C.green], ['probability 0.5: dropped', C.pink]], C.violet), ...say('EQUAL CHANCE: ACTIVE OR NOT'));
  await until(S(16)); await play(...say('ONE COIN FOR EACH NEURON', C.amber));
  await until(S(17)); await play(...box([['green side = keep', C.green]], C.green));
  await until(S(18)); await play(...box([['green side = keep', C.green], ['pink side = make it 0', C.pink]], C.violet));
  await until(S(19)); await play(...toss([0, 2]), ...say('THE COINS FALL', C.amber));
  await until(S(20)); await play(new M.Indicate(coins[0], { color: C.green }), new M.Indicate(coins[2], { color: C.green }), ...say('KEEP THE 1ST AND 3RD', C.green));
  await until(S(21)); await play(...darken(1), ...darken(3), ...say('2ND AND 4TH BECOME 0', C.pink));
  await play(...N.value(1, 1, '0', C.muted), ...N.value(1, 3, '0', C.muted));
  await until(S(22)); await play(...box(['activations now', ['2, 0, 6, 0', C.amber]], C.amber), ...say('2, 0, 6, 0', C.amber));
  await until(S(23)); await flow(1, C.amber, [0, 2], ...say('DARK NEURONS SEND 0', C.pink));
  const stillRings = [1, 3].map(i => { const c = new M.Circle({ radius: P ? 0.46 : 0.4, color: C.muted, strokeWidth: 3 }); c.setFill(C.card, 0); c.moveTo(H[i]); return c; });
  await until(S(24)); await play(...stillRings.map(c => new M.Create(c)), ...say('THE NEURONS ARE STILL THERE'));
  await until(S(25)); await play(out(new M.VGroup(...stillRings)), ...box(['set to 0 only', ['for this training step', C.violet]], C.violet), ...say('ONLY FOR THIS STEP', C.violet));

  // 26-32 scale up the kept readings
  await until(S(26)); await play(...box(['2 + 4 + 6 + 8 = 20', ['2 + 0 + 6 + 0 = 8', C.pink]], C.pink), ...say('ZEROS MAKE ACTIVATIONS SMALLER', C.pink));
  await until(S(27)); await play(...say('MAKE THE KEPT ACTIVATIONS BIGGER', C.green));
  await until(S(28)); await play(...box(['probability of staying', ['active = 0.5', C.green]], C.green));
  await until(S(29)); await play(...box(['kept activation ÷ 0.5'], C.green), ...say('DIVIDE BY THE PROBABILITY', C.green));
  await until(S(30)); await play(...N.value(1, 0, '4', C.green), ...box([['2 ÷ 0.5 = 4', C.green]], C.green));
  await until(S(31)); await play(...N.value(1, 2, '12', C.green), ...box([['2 ÷ 0.5 = 4', C.green], ['6 ÷ 0.5 = 12', C.green]], C.green));
  await until(S(32)); await play(...box(['activations now', ['4, 0, 12, 0', C.green]], C.green), ...say('4, 0, 12, 0', C.green));
  await until(S(33)); await flow(1, C.green, [0, 2], ...say('ON TO THE PREDICTION'));
  await play(...N.value(3, 0, '?', C.amber));
  await flow(2, C.green, null);
  await until(S(34)); await play(...box(['loss → gradients', ['→ update the weights', C.amber]], C.amber), ...N.weight(0, 0, 0, 0.8), ...N.weight(0, 2, 2, -0.6), ...N.weight(2, 0, 0, 0.7), ...say('LEARN FROM THIS STEP', C.amber));

  // 35-37 new tosses
  await until(S(35)); await play(...lightenAll(), ...toss([1, 3]), ...setVals(['0', '8', '0', '16'], C.green), ...say('NEXT STEP: TOSS AGAIN', C.amber));
  await until(S(36)); await play(...darken(0), ...darken(2), ...say('A DIFFERENT GROUP IS HIDDEN', C.pink));
  await play(...N.value(1, 0, '0', C.muted), ...N.value(1, 2, '0', C.muted));
  await until(S(37)); await flow(1, C.green, [1, 3], ...say('ACTIVE CONNECTIONS CHANGE'));
  await play(...lightenAll(), ...toss([0, 1, 3]), ...setVals(['4', '8', '0', '16'], C.green));
  await play(...darken(2));
  await play(...N.value(1, 2, '0', C.muted));
  await flow(1, C.green, [0, 1, 3]);

  // 38-43 one neuron over many tosses
  await until(S(38)); await play(...lightenAll(), ...coins.map(out), ...setVals(['2', '4', '6', '8']), ...clearBox(), ...say('FOLLOW THE 3RD NEURON: 6', C.violet));
  coins = [];
  const ring = new M.Circle({ radius: 0.4, color: C.violet, strokeWidth: 4 }); ring.setFill(C.card, 0); ring.moveTo(H[2]);
  await play(new M.Create(ring));
  await until(S(39)); await play(...N.value(1, 2, '12', C.green), ...box(['kept: 6 ÷ 0.5', ['= 12', C.green]], C.green), ...say('KEPT → 12', C.green));
  await until(S(40)); await play(...N.value(1, 2, '0', C.pink), ...box(['kept: 6 ÷ 0.5 = 12', ['dropped: 0', C.pink]], C.violet), ...say('DROPPED → 0', C.pink));
  const seq = [12, 0, 12, 12, 0, 12, 0, 0, 12, 0];
  const CHX = P ? -3.24 : 2.1, CHS = P ? 0.72 : 0.49, CHY = P ? -2.6 : -1.55;
  const chips = seq.map((v, k) => { const col = v ? C.green : C.pink; const c = new M.Circle({ radius: P ? 0.33 : 0.22, color: col, strokeWidth: 2 }); c.setFill(C.card, 0.95); c.moveTo(pt(CHX + k * CHS, CHY));
    return new M.VGroup(c, text(String(v), CHX + k * CHS, CHY, col, P ? 17 : 15)); });
  await until(S(41)); await play(new M.LaggedStart(chips.map(c => fade(c, 0.3)), { lagRatio: 0.3, runTime: 3 }), ...say('10 TOSSES: KEPT 5 TIMES', C.amber));
  await until(S(42)); await play(...N.value(1, 2, '6'), ...box(['mean of the 10 results', '(5 × 12 + 5 × 0) ÷ 10', ['= 6', C.green]], C.green), ...say('THE MEAN COMES BACK TO 6', C.green));
  await until(S(43)); await play(new M.Indicate(new M.VGroup(...chips), { color: C.green }), ...say('THAT IS WHY WE DIVIDE BY 0.5', C.green));

  // 44-46 the rule
  await until(S(44)); await play(out(new M.VGroup(...chips, ring)), ...say('ONE SHORT FORMULA'));
  await until(S(45)); await play(...box(['training, kept:', ['activation ÷ probability', C.green]], C.green));
  await until(S(46)); await play(...box(['training, kept:', ['activation ÷ probability', C.green], 'training, dropped:', ['0', C.pink]], C.violet));

  // 47-49 prediction
  await until(S(47)); await play(...clearBox(), ...N.value(3, 0, '?', C.amber), ...say('TRAINING IS FINISHED: A NEW LABEL'));
  await until(S(48)); await play(...box([['predicting: dropout OFF', C.cyan], 'use every neuron']), ...say('DROPOUT OFF, EVERY NEURON ON'));
  await until(S(49)); await flow(1, C.cyan, null, ...setVals(['2', '4', '6', '8']), ...say('UNCHANGED: 2, 4, 6, 8'));
  await flow(2, C.cyan, null);

  // 50-53 summary
  await until(S(50)); await play(...box(['less dependence on', ['any single neuron', C.green]], C.green), ...say('NO NEURON IS ALWAYS NEEDED', C.green));
  await until(S(51)); await play(...say('BETTER ON NEW PICTURES', C.green));
  await until(S(52)); await play(...darken(0), ...darken(1), ...darken(3));
  await play(...setVals(['0', '0', '6', '0']), ...box([['drop too many', C.pink], 'learning becomes hard'], C.pink), ...say('DROPPING TOO MANY HURTS', C.pink));
  await until(S(53)); await play(...lightenAll(), ...setVals(['2', '4', '6', '8']), ...box([['Dropout', C.violet], 'random activations → 0', 'only during training'], C.violet), ...say('REMEMBER: DROPOUT', C.violet));
}
