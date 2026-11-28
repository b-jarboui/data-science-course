// 17.2.11 Early stopping. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, pill, showA, until, play, net } = L;
  const PILL = P ? [0, 4.05, 0] : [0.2, 1.85, 0];
  const BOXP = P ? [0, -5.35, 0] : [5.0, 0.55, 0];
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const pt = (x, y) => [x, y, 0];
  const fade = (o, runTime = 0.4) => new M.FadeIn(o, { runTime });
  const out = o => new M.FadeOut(o, { runTime: 0.35 });
  const text = (s, x, y, c = C.ink, size = 19) => { const t = T(s, size, c, true); t.moveTo(pt(x, y)); return t; };

  let boxNow = null;
  function box(lines, color = C.cyan) {
    const lh = P ? 0.41 : 0.37;
    const labels = lines.map((row, i) => { const [v, ink] = Array.isArray(row) ? row : [row, C.ink]; return text(v, 0, ((lines.length - 1) / 2 - i) * lh, ink, P ? 22 : 19); });
    const w = Math.max(...labels.map(l => l.getWidth())) + 0.5, h = lines.length * lh + 0.24;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.16, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95); r.moveTo(pt(0, 0));
    const g = new M.VGroup(r, ...labels);
    const maxW = P ? FW - 1.0 : 4.0; if (w > maxW) g.scale(maxW / w);
    g.moveTo(BOXP);
    const a = [fade(g)]; if (boxNow) a.push(out(boxNow)); boxNow = g; return a;
  }

  // small network
  const NC = P ? pt(0, 2.45) : pt(-5.0, 0.35);
  const NR = P ? 0.28 : 0.26;
  const N = net({ layers: [3, 3, 1], center: NC, width: P ? 3.4 : 2.8, height: P ? 1.7 : 1.8, r: NR });
  async function flow(l, color, ...anims) {
    const R = NR, ds = [], ts = [];
    N.edges[l].forEach((row, i) => row.forEach((_, j) => {
      const a = N.pos(l, i), b = N.pos(l + 1, j);
      const d = new M.Dot({ point: pt(a[0] + R, a[1]), radius: 0.06, color }); d.setFill(color, 1);
      const t = new M.Dot({ point: pt(b[0] - R, b[1]), radius: 0.06, color }); t.setFill(color, 1);
      ds.push(d); ts.push(t);
    }));
    await play(...ds.map(d => new M.FadeIn(d, { runTime: 0.15 })), ...anims);
    await play(...ds.map((d, k) => new M.Transform(d, ts[k], { runTime: 0.7 })));
    await play(new M.FadeOut(new M.VGroup(...ds), { runTime: 0.25 }));
  }
  const learn = async (color, ...anims) => { await flow(0, color, ...anims); await flow(1, color); };

  // two trays of cards
  function tray(x, y, color, label) {
    const r = new M.RoundedRectangle({ width: 1.45, height: 1.05, cornerRadius: 0.12, color, strokeWidth: 2 }); r.setFill(C.card, 0.9); r.moveTo(pt(x, y));
    const cards = [-0.33, 0, 0.33].map(dx => { const c = new M.Rectangle({ width: 0.28, height: 0.38, color, strokeWidth: 1 }); c.setFill(color, 0.35); c.moveTo(pt(x + dx, y - 0.14)); return c; });
    return new M.VGroup(r, ...cards, text(label, x, y + 0.3, color, 15));
  }
  const TRY = P ? [[-3.1, 2.45], [3.1, 2.45]] : [[-5.85, -1.6], [-4.25, -1.6]];
  const trainT = tray(TRY[0][0], TRY[0][1], C.cyan, 'training'), validT = tray(TRY[1][0], TRY[1][1], C.amber, 'validation');

  // loss chart
  const GX0 = P ? -3.1 : -2.5, GW = P ? 6.6 : 5.3, GY0 = P ? -3.45 : -2.55, GH = P ? 3.55 : 3.4;
  const ex = e => GX0 + 0.55 + (e - 1) / 4 * (GW - 0.95), ly = v => GY0 + v / 1.0 * (GH - 0.45);
  const axes = new M.VGroup(
    new M.Line({ start: pt(GX0, GY0), end: pt(GX0 + GW, GY0), color: C.muted, strokeWidth: 2 }),
    new M.Line({ start: pt(GX0, GY0), end: pt(GX0, GY0 + GH), color: C.muted, strokeWidth: 2 }),
    ...[1, 2, 3, 4, 5].map(e => text(String(e), ex(e), GY0 - 0.25, C.muted, 16)),
    text('epoch', GX0 + GW - 0.4, GY0 - 0.55, C.muted, 16),
    ...[0, 0.5, 1].map(v => text(String(v), GX0 - 0.3, ly(v), C.muted, 16)),
    text('loss', GX0 + 0.05, GY0 + GH + 0.15, C.muted, 16));
  const TR = [0.9, 0.6, 0.4, 0.3, 0.2], VA = [1, 0.7, 0.5, 0.6, 0.8];
  const marks = { t: [], v: [] };
  function point(kind, e) {
    const v = kind === 't' ? TR[e - 1] : VA[e - 1], col = kind === 't' ? C.cyan : C.amber;
    const d = new M.Dot({ point: pt(ex(e), ly(v)), radius: 0.09, color: col }); d.setFill(col, 1);
    const lab = text(String(v), ex(e), ly(v) + (kind === 't' ? -0.3 : 0.32), col, P ? 17 : 16);
    const parts = [d, lab];
    if (e > 1) { const pv = kind === 't' ? TR[e - 2] : VA[e - 2]; parts.unshift(new M.Line({ start: pt(ex(e - 1), ly(pv)), end: pt(ex(e), ly(v)), color: col, strokeWidth: 3 })); }
    const g = new M.VGroup(...parts); marks[kind][e] = g; return [fade(g, 0.6)];
  }
  const legT = text('— training loss', P ? -1.0 : -0.9, GY0 + GH + 0.15, C.cyan, 16);
  const legV = text('— validation loss', P ? 1.95 : 1.6, GY0 + GH + 0.15, C.amber, 16);

  // saved-weights box and waiting counter
  const VP = P ? [-1.5, 1.05] : [-5.05, -2.65];
  const vault = new M.RoundedRectangle({ width: 2.5, height: 0.62, cornerRadius: 0.12, color: C.green, strokeWidth: 2 }); vault.setFill(C.card, 0.95); vault.moveTo(pt(VP[0], VP[1]));
  let vaultT = null;
  function save(e) { const a = vaultT ? [out(vaultT)] : []; vaultT = text('saved: epoch ' + e, VP[0], VP[1], C.green, P ? 18 : 16); a.push(fade(vaultT)); return a; }
  const WP = P ? [1.75, 1.05] : [5.1, -1.15];
  let waitP = null;
  function wait(s, col = C.violet) { const a = waitP ? [out(waitP)] : []; waitP = pill(s, col, P ? 17 : 16); waitP.moveTo(pt(WP[0], WP[1])); a.push(fade(waitP)); return a; }

  // 0-2
  await until(S(0)); await play(fade(N.group), ...say('A NETWORK READS PARCEL DIGITS'), ...box(['goal: read each digit', ['0 to 9', C.amber]]));
  await until(S(1)); await learn(C.cyan, ...say('AFTER SEVERAL PASSES: FEWER MISTAKES', C.green), ...box(['more passes', ['→ fewer mistakes', C.green]], C.green));
  await until(S(2)); await play(...say('AND ON NEW PICTURES?', C.violet), ...box(['pictures never used', ['in training?', C.violet]], C.violet));

  // 3-9 two trays
  await until(S(3)); await play(fade(trainT), fade(validT), ...say('TWO TRAYS OF CARDS'));
  await until(S(4)); await play(new M.Indicate(trainT, { color: C.cyan }), ...say('TRAY 1 CHANGES THE WEIGHTS'));
  await until(S(5)); await play(...box([['training data', C.cyan]]), ...say('TRAINING DATA'));
  await until(S(6)); await play(new M.Indicate(validT, { color: C.amber }), ...say('TRAY 2: KEPT SEPARATE', C.amber));
  await until(S(7)); await play(...box(['check pictures', ['outside the training data', C.amber]], C.amber), ...say('A CHECK ON NEW PICTURES', C.amber));
  await until(S(8)); await play(...box([['validation data', C.amber]], C.amber), ...say('VALIDATION DATA', C.amber));
  await until(S(9)); await learn(C.cyan, ...N.weight(0, 0, 1, 0.8), ...N.weight(1, 2, 0, -0.6), ...box(['both trays: predictions', ['only training updates weights', C.cyan]]));

  // 10-15 loss and the chart
  await until(S(10)); await play(...box(['loss', ['= how wrong the predictions are', C.pink]], C.pink), ...say('LOSS', C.pink));
  await until(S(11)); await play(...box(['smaller loss', ['= better predictions', C.green]], C.green));
  await until(S(12)); await play(new M.Create(axes), ...say('FOLLOW THE LOSS'));
  await until(S(13)); await play(fade(legT), new M.Indicate(trainT, { color: C.cyan }));
  await until(S(14)); await play(fade(legV), new M.Indicate(validT, { color: C.amber }));
  await until(S(15)); await play(...box(['epoch', ['= one full pass through', C.cyan], ['the training cards', C.cyan]]), ...say('ONE EPOCH = ONE PASS'));

  // 16-25 epochs 1-3
  await until(S(16)); await learn(C.cyan, ...point('t', 1), ...say('EPOCH 1: TRAINING 0.9'));
  await until(S(17)); await play(...point('v', 1), ...say('VALIDATION 1', C.amber));
  await until(S(18)); await play(new M.Create(vault), ...save(1), ...say('SAVE A COPY OF THE WEIGHTS', C.green));
  await until(S(19)); await learn(C.cyan, ...point('t', 2), ...say('EPOCH 2: TRAINING 0.6'));
  await until(S(20)); await play(...point('v', 2), ...say('VALIDATION 0.7', C.amber));
  await until(S(21)); await play(...say('BETTER ON BOTH TRAYS', C.green));
  await until(S(22)); await play(...save(2), new M.Indicate(vault, { color: C.green }), ...say('SAVE EPOCH 2', C.green));
  await until(S(23)); await learn(C.cyan, ...point('t', 3), ...say('EPOCH 3: TRAINING 0.4'));
  await until(S(24)); await play(...point('v', 3), ...say('VALIDATION 0.5', C.amber));
  const best = new M.Circle({ radius: 0.17, color: C.green, strokeWidth: 3 }); best.setFill(C.card, 0); best.moveTo(pt(ex(3), ly(0.5)));
  await until(S(25)); await play(new M.Create(best), ...save(3), ...say('LOWEST SO FAR: SAVE EPOCH 3', C.green));

  // 26-32 epoch 4 and overfitting
  await until(S(26)); await play(...say('EPOCH 4'));
  await until(S(27)); await learn(C.cyan, ...point('t', 4), ...say('TRAINING 0.3'));
  await until(S(28)); await play(...point('v', 4), ...say('VALIDATION UP: 0.6', C.pink));
  await until(S(29)); await play(new M.Indicate(marks.t[4], { color: C.green }), new M.Indicate(marks.v[4], { color: C.pink }), ...say('BETTER ON TRAINING, WORSE ON VALIDATION', C.pink));
  await until(S(30)); await play(...box(['a student remembers', 'practice answers', ['but fails new questions', C.pink]], C.pink));
  await until(S(31)); await play(...say('LEARNS DETAILS THAT DO NOT HELP NEW PICTURES', C.pink));
  await until(S(32)); await play(...box([['overfitting', C.pink]], C.pink), ...say('OVERFITTING', C.pink));

  // 33-41 patience
  await until(S(33)); await play(...say('STOP AT THE FIRST RISE?', C.violet));
  await until(S(34)); await play(...say('NOT ALWAYS: IT CAN FALL AGAIN', C.violet));
  await until(S(35)); await play(...box(['allow 2 epochs in a row', ['with no new lowest', C.violet], ['validation loss', C.violet]], C.violet));
  await until(S(36)); await play(...box([['patience = 2', C.violet]], C.violet), ...wait('no new low: 0 / 2'), ...say('PATIENCE', C.violet));
  await until(S(37)); await play(...wait('no new low: 1 / 2'), new M.Indicate(marks.v[4], { color: C.violet }), ...say('EPOCH 4: NO NEW LOW → 1', C.violet));
  await until(S(38)); await play(...say('ON TO EPOCH 5'));
  await until(S(39)); await learn(C.cyan, ...point('t', 5), ...say('TRAINING 0.2'));
  await until(S(40)); await play(...point('v', 5), ...say('VALIDATION UP AGAIN: 0.8', C.pink));
  await until(S(41)); await play(...wait('2 / 2 → STOP', C.pink), ...say('PATIENCE REACHED: STOP', C.pink));

  // 42-45 restore the best weights
  await until(S(42)); await play(new M.LaggedStart([1, 2, 3, 4, 5].map(e => new M.Indicate(marks.v[e], { color: C.amber })), { lagRatio: 0.25, runTime: 1.8 }), ...say('COMPARE ALL FIVE VALIDATION LOSSES', C.amber));
  await until(S(43)); await play(new M.Indicate(best, { color: C.green }), ...say('LOWEST: 0.5 AT EPOCH 3', C.green));
  const back = P ? new M.Arrow({ start: pt(-1.5, 1.4), end: pt(-0.9, 1.75), color: C.green, strokeWidth: 3 })
    : new M.Arrow({ start: pt(-6.45, -2.35), end: pt(-6.35, -0.35), color: C.green, strokeWidth: 3 });
  await until(S(44)); await play(new M.Create(back), new M.Indicate(vault, { color: C.green }), ...say('PUT THE EPOCH 3 WEIGHTS BACK', C.green));
  await flow(0, C.green, ...N.weight(0, 0, 1, 0.5), ...N.weight(1, 2, 0, -0.4));
  await until(S(45)); await play(out(back), ...box([['early stopping', C.green]], C.green), ...say('EARLY STOPPING', C.green));

  // 46-48 the rule
  await until(S(46)); await play(...say('THE RULE IN ONE LINE'));
  await until(S(47)); await play(...box(['stop when', ['epochs with no improvement', C.violet], ['= patience', C.violet]], C.violet));
  await until(S(48)); await play(...wait('new low → 0', C.green), ...box(['new lowest validation loss', ['→ reset the count to 0', C.green]], C.green));

  // 49-52 summary
  await until(S(49)); await play(...box(['not too long', ['less overfitting', C.green]], C.green), ...say('AVOID TRAINING TOO LONG', C.green));
  await until(S(50)); await play(...box([['stop too soon', C.pink], 'miss useful learning'], C.pink), ...say('BUT NOT TOO SOON', C.pink));
  await until(S(51)); await play(new M.Indicate(validT, { color: C.amber }), ...box(['enough patience', ['good validation cards', C.amber]], C.amber));
  await until(S(52)); await play(new M.Indicate(vault, { color: C.green }), ...box([['Early stopping', C.green], 'watch validation loss', 'return the best weights'], C.green), ...say('REMEMBER: EARLY STOPPING', C.green));
}
