// 13.2.7 Bagging: making predictions more stable.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, until, play } = L;
  // K enlarges the picture and CY moves it down so it uses the frame height; phone box sits under the picture.
  const K = P ? 1.12 : 1.22, CY = P ? 0.35 : -0.45;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.6, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -4.6, 0] : [4.3, -0.3, 0];

  // Columns are A, B, C, D, and whether the loan was fully repaid.
  const data = [
    [0, 1, 1, 0, 1], [1, 0, 1, 0, 1], [1, 1, 0, 1, 1], [1, 1, 1, 1, 1],
    [1, 0, 0, 1, 0], [0, 1, 0, 0, 0], [0, 0, 1, 1, 0], [0, 0, 0, 0, 0],
  ];
  const original = data.map((_, i) => i + 1);
  const samples = [
    [6, 4, 3, 5, 8, 4, 3, 6],
    [1, 7, 1, 2, 3, 3, 7, 3],
    [4, 5, 5, 1, 1, 2, 5, 4],
  ];
  const questions = ['Steady income?', 'Savings?', 'Previous loan repaid?', 'Requested reminders?'];
  const result = id => data[id - 1][4];
  const ink = full => full ? C.cyan : C.pink;
  const outcome = full => full ? 'Full' : 'Partial';
  const point = (x, y) => [CX + x * K, CY + y * K, 0];
  const text = (s, x, y, size = 20, color = C.ink, mono = false) =>
    T(String(s), Math.max(15, size * K), color, mono).moveTo(point(x, y));
  const line = (x1, y1, x2, y2, color = C.muted) =>
    new M.Line({ start: point(x1, y1), end: point(x2, y2), color, strokeWidth: 2 });
  const dot = (x, y, color, radius = 0.085) =>
    new M.Dot({ point: point(x, y), radius: radius * K, color });
  const group = parts => new M.VGroup(...parts);

  function rect(x, y, width, height, color, fill = C.card, opacity = 0.95) {
    const r = new M.RoundedRectangle({ width: width * K, height: height * K, cornerRadius: 0.1 * K, color, strokeWidth: 2 });
    r.setFill(fill, opacity);
    r.moveTo(point(x, y));
    return r;
  }

  function card(id, x, y, { color = ink(result(id)), width = 0.64, height = 0.54, size = 19 } = {}) {
    return group([rect(x, y, width, height, color), text(id, x, y, size, color, true)]);
  }

  function row(ids, x, y, pitch = 0.84, style) {
    return ids.map((id, i) => card(id, x + (i - (ids.length - 1) / 2) * pitch, y, style?.(id, i)));
  }

  function formula(lines, color) {
    const size = P ? 21 : 20;
    const lh = P ? 0.33 : 0.4;
    const labels = lines.map(item => {
      const [s, c] = Array.isArray(item) ? item : [item, C.ink];
      return T(s, size, c, true);
    });
    const w = Math.max(...labels.map(t => t.getWidth())) + 0.62;
    const h = labels.length * lh + 0.26;
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: 2 });
    r.setFill(C.card, 0.95);
    labels.forEach((t, i) => t.moveTo([-w / 2 + 0.31 + t.getWidth() / 2, ((labels.length - 1) / 2 - i) * lh, 0]));
    const g = group([r, ...labels]);
    const maxw = P ? FW - 1.2 : 4;
    if (w > maxw) g.scale(maxw / w);
    g.moveTo(BOXP);
    return g;
  }

  let tag = null, picture = null, box = null;
  // Omit a picture or formula to keep it. Pass null to clear it.
  async function show(label, next, lines, color = C.cyan) {
    const out = [tag, next === undefined ? null : picture, lines === undefined ? null : box].filter(Boolean);
    if (out.length) await play(...out.map(m => new M.FadeOut(m, { runTime: 0.16 })));

    tag = pill(label, color, P ? 18 : 19);
    tag.moveTo(PILL);
    const incoming = [tag];
    if (next !== undefined) {
      picture = next;
      if (picture) incoming.push(picture);
    }
    if (lines !== undefined) {
      box = lines ? formula(lines, color) : null;
      if (box) incoming.push(box);
    }
    await play(...incoming.map(m => new M.FadeIn(m, { runTime: 0.29 })));
  }

  function applications(reveal = false) {
    return group([
      text('Past loan applications', 0, 0.73, 24),
      ...row(original, 0, -0.2, 0.84, reveal ? undefined : () => ({ color: C.ink })),
      ...(reveal ? [
        text('4 fully repaid', -1.55, -1.08, 21, C.cyan),
        text('4 partly repaid', 1.55, -1.08, 21, C.pink),
      ] : []),
    ]);
  }

  function bag({ order = original, drawn, copied = [], highlight, complete = false } = {}) {
    const x = -1.62;
    const slots = order.map((id, i) => {
      if (id === drawn) return null;
      return card(id, x + ((i % 4) - 1.5) * 0.72, 0.34 - Math.floor(i / 4) * 0.69,
        { color: id === highlight ? C.amber : ink(result(id)), width: 0.55, height: 0.48 });
    }).filter(Boolean);
    return group([
      rect(x, -0.02, 3.44, 1.61, C.violet),
      text('Original bag', x, 1.08, 21, C.violet),
      ...slots,
      ...(drawn ? [
        line(0.29, 0, 1.05, 0, C.amber),
        line(0.86, 0.14, 1.05, 0, C.amber),
        line(0.86, -0.14, 1.05, 0, C.amber),
        text('Drawn card', 2.14, 0.62, 20, C.amber),
        card(drawn, 2.14, -0.02, { color: C.amber, width: 0.86, height: 0.7 }),
      ] : []),
      ...(copied.length ? [
        text(complete ? `${copied.length} copied cards` : 'Copied cards', 0, -1.4, 20, C.muted),
        ...row(copied, 0, -2.05, 0.8, highlight ? id => ({ color: id === highlight ? C.amber : ink(result(id)) }) : undefined),
      ] : []),
    ]);
  }

  function sampleOnly(ids, n, markRepeats = false) {
    return group([
      text(n ? `Sample ${n}` : 'Eight draws from the bag', 0, 0.65, 23),
      ...row(ids, 0, -0.32, 0.84, markRepeats ? id => ({
        color: ids.indexOf(id) !== ids.lastIndexOf(id) ? C.amber : ink(result(id)),
      }) : undefined),
      ...(markRepeats ? [
        text('Repeated: 3, 4, 6', -1.65, -1.25, 21, C.amber),
        text('Missing: 1, 2, 7', 1.65, -1.25, 21, C.muted),
      ] : []),
    ]);
  }

  function miniTrees(sets, showQuestions = false) {
    const pitch = sets.length === 2 ? 3 : 2.18;
    return group(sets.flatMap((ids, i) => {
      const x = (i - (sets.length - 1) / 2) * pitch;
      return [
        text(showQuestions ? questions[i] : `Tree ${i + 1}`, x, 0.96, showQuestions ? 15 : 19, C.violet),
        dot(x, 0.52, C.violet),
        line(x, 0.44, x - 0.52, 0.01, C.violet),
        line(x, 0.44, x + 0.52, 0.01, C.violet),
        dot(x - 0.52, 0.01, C.cyan),
        dot(x + 0.52, 0.01, C.pink),
        ...ids.map((id, j) => card(id, x + ((j % 4) - 1.5) * 0.43,
          -0.71 - Math.floor(j / 4) * 0.48, { width: 0.39, height: 0.4, size: 14 })),
      ];
    }));
  }

  function mergePicture() {
    return group([
      ...[-1.9, 0, 1.9].flatMap((x, i) => [
        text(`Tree ${i + 1}`, x, 0.82, 19, C.violet),
        rect(x, 0.18, 1.33, 0.56, C.violet),
        text('Vote', x, 0.18, 20, C.ink),
        line(x, -0.14, 0, -1.07, C.violet),
      ]),
      rect(0, -1.45, 3, 0.68, C.green),
      text('Combined prediction', 0, -1.45, 22, C.green),
    ]);
  }

  function branches(sample, q) {
    return [0, 1].map(answer => sample.filter(id => data[id - 1][q] === answer));
  }

  function fit(sample) {
    const candidates = questions.map((_, q) => {
      const split = branches(sample, q);
      const full = split.map(ids => ids.filter(result).length);
      const gini = split.reduce((sum, ids, b) => {
        const n = ids.length;
        return sum + (n ? 2 * full[b] * (n - full[b]) / n / sample.length : 0);
      }, 0);
      const leaves = split.map((ids, b) => Number(2 * full[b] > ids.length));
      return { q, split, full, gini, leaves };
    });
    return candidates.reduce((best, candidate) => candidate.gini < best.gini - 1e-12 ? candidate : best);
  }

  function impurityChart() {
    const values = [0.2, 1 / 3, 1 / 3, 0.2];
    const names = ['Income', 'Savings', 'Previous loan', 'Reminders'];
    return group([
      text('Weighted Gini impurity', 0, 1.05, 22),
      ...values.flatMap((value, i) => {
        const y = 0.4 - i * 0.69, w = 6.4 * value;
        const col = i === 0 || i === 3 ? C.amber : C.muted;
        return [
          text(names[i], -2.35, y, 18, C.ink),
          rect(-0.98 + w / 2, y, w, 0.24, col, col, 0.72),
          text(i === 0 || i === 3 ? '0.20' : '0.333', 2.26, y, 18, col, true),
        ];
      }),
    ]);
  }

  const trees = samples.map(fit);
  function tree(n, { counts = [], predictions = false, test = false, actual = false } = {}) {
    const { q, split, full, leaves } = trees[n - 1];
    const answer = data[0][q];
    const xs = [-1.74, 1.74]; // Yes on the left, No on the right.
    return group([
      text(`Tree ${n} · ${questions[q]}`, 0, 0.96, 22, C.violet),
      dot(0, 0.48, test ? C.amber : C.violet),
      ...[1, 0].flatMap((b, i) => {
        const x = xs[i], col = test && b === answer ? C.amber : C.muted;
        return [
          line(0, 0.4, x, -0.4, col),
          text(b ? 'Yes' : 'No', x, -0.64, 20, col),
          ...row(split[b], x, -1.23, 0.57, id => ({
            width: 0.49, height: 0.49, size: 17,
            color: test && id === 1 ? C.amber : ink(result(id)),
          })),
          ...(counts.includes(b) ? [
            text(`${full[b]} full · ${split[b].length - full[b]} partial`, x, -1.8, 18),
          ] : []),
          ...(predictions && (!test || b === answer) ? [
            text(`Predict ${outcome(leaves[b]).toLowerCase()}`, x, -2.29, 21, ink(leaves[b])),
          ] : []),
        ];
      }),
      ...(test ? [
        text(`Card 1 answers ${answer ? 'yes' : 'no'}${actual ? ' · Actually repaid in full' : ''}`,
          0, -2.75, 18, actual ? C.cyan : C.amber),
      ] : []),
    ]);
  }

  function votes(n, numeric = false, combined = false) {
    return group([
      text('Predictions for application 1', 0, 0.98, 23),
      ...trees.slice(0, n).flatMap(({ q, leaves }, i) => {
        const v = leaves[data[0][q]], x = (i - (n - 1) / 2) * 1.94;
        return [
          text(`Tree ${i + 1}`, x, 0.31, 19, C.muted),
          rect(x, -0.38, 1.64, 0.82, ink(v)),
          text(numeric ? `${outcome(v)} = ${v}` : outcome(v), x, -0.38, 20, ink(v)),
        ];
      }),
      ...(combined ? [
        line(0, -0.87, 0, -1.33, C.green),
        text('Combined prediction: full', 0, -1.75, 23, C.green),
      ] : []),
    ]);
  }

  // Seed only the later draws so that seeking always plays back the same example.
  let seed = 732;
  const freshSamples = Array.from({ length: 7 }, () => original.map(() => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return 1 + (seed >>> 29);
  }));
  const sums = original.map(() => 0);
  const history = [...samples, ...freshSamples].map((ids, i) => {
    const { q, leaves } = fit(ids);
    const numbers = data.map(r => leaves[r[q]]);
    const n = i + 1;
    numbers.forEach((v, j) => { sums[j] += v; });
    const errors = original.filter(id => Number(2 * sums[id - 1] > n) !== result(id));
    return { ids, errors, vote: numbers[0], full: sums[0], mean: sums[0] / n };
  });

  function errorCurve(n, latestSample = false) {
    const step = latestSample ? 5.07 / (history.length - 1) : 2.1;
    const x = i => -2.44 + i * step;
    const y = value => -2.34 + value * 0.52;
    const points = history.slice(0, n);
    return group([
      ...(latestSample ? [
        text(`Draw for tree ${n}`, 0, 1.04, 19, C.violet),
        ...row(points[n - 1].ids, 0, 0.48, 0.76, () => ({ width: 0.57, height: 0.47, size: 16 })),
      ] : []),
      text('Mistakes on the 8 past applications', 0, latestSample ? -0.16 : 0.88, 21, C.amber),
      ...[0, 1, 2, 3].flatMap(v => [
        line(-2.76, y(v), 2.89, y(v), C.line),
        text(v, -3.08, y(v), 16, C.muted, true),
      ]),
      ...points.flatMap(({ errors }, i) => {
        const h = y(errors.length), previous = points[i - 1];
        return [
          ...(previous ? [line(x(i - 1), y(previous.errors.length), x(i), h, C.amber)] : []),
          dot(x(i), h, C.amber),
          text(i + 1, x(i), -2.63, 15, C.muted, true),
        ];
      }),
    ]);
  }

  function voteCurve() {
    const x = i => -2.6 + i * 0.58;
    const y = v => -1.98 + v * 2.35;
    return group([
      text('Application 1', 0, 1.12, 23),
      text('Dots: each tree', -1.37, 0.69, 18, C.violet),
      text('Line: mean vote', 1.35, 0.69, 18, C.green),
      ...[0, 0.5, 1].flatMap(v => [
        line(-2.85, y(v), 2.9, y(v), C.line),
        text(v, -3.12, y(v), 16, C.muted, true),
      ]),
      ...history.flatMap(({ vote, mean }, i) => [
        ...(i ? [line(x(i - 1), y(history[i - 1].mean), x(i), y(mean), C.green)] : []),
        dot(x(i), y(vote), C.violet, 0.11),
        dot(x(i), y(mean), C.green, 0.058),
        text(i + 1, x(i), -2.27, 14, C.muted, true),
      ]),
    ]);
  }

  await until(S(0)); await show('A SMALL LENDER', group([
    text('Will the next borrower repay in full?', 0, 0.54, 25),
    text('The lender learns from past loans.', 0, -0.28, 22, C.muted),
  ]));
  await until(S(1)); await show('EIGHT LOAN APPLICATIONS', applications());
  await until(S(2)); await show('FOUR FULL, FOUR PARTIAL', applications(true));
  await until(S(3)); await show('TWO LENDERS, DIFFERENT EXAMPLES', group([
    text('Lender 1', 0, 0.91, 21, C.violet),
    ...row([1, 2, 3, 5, 6], 0, 0.25),
    text('Lender 2', 0, -0.67, 21, C.violet),
    ...row([2, 3, 4, 6, 8], 0, -1.34),
  ]));
  await until(S(4)); await show('DIFFERENT QUESTIONS AND MISTAKES', group([
    ...['Steady income?', 'Savings?'].flatMap((question, i) => {
      const x = i ? 1.65 : -1.65;
      return [
        text(question, x, 0.79, 20, C.violet), dot(x, 0.29, C.violet),
        line(x, 0.2, x - 0.55, -0.29), line(x, 0.2, x + 0.55, -0.29),
        dot(x - 0.55, -0.29, C.cyan), dot(x + 0.55, -0.29, C.pink),
        text('Missed application', x, -0.91, 17, C.muted),
        card(i ? 2 : 1, x, -1.48, { color: C.amber }),
      ];
    }),
  ]));
  await until(S(5)); await show('CAN SEVERAL TREES HELP?', mergePicture(), null, C.violet);

  const firstMix = [4, 8, 6, 2, 1, 5, 7, 3];
  const nextMix = [3, 1, 8, 4, 7, 6, 2, 5];
  const againMix = [1, 5, 6, 8, 2, 4, 3, 7];
  await until(S(6)); await show('PUT THE EIGHT CARDS IN THE BAG', bag());
  await until(S(7)); await show('MIX, THEN DRAW', bag({ order: firstMix, drawn: 6 }), null, C.amber);
  await until(S(8)); await show('COPY AND RETURN THE ORIGINAL', bag({ order: firstMix, copied: [6], highlight: 6 }), null, C.amber);
  await until(S(9)); await show('MIX AND DRAW AGAIN', bag({ order: nextMix, drawn: 4, copied: [6] }), null, C.amber);
  await until(S(10));
  await show('RETURNED CARDS CAN COME UP AGAIN', bag({ order: nextMix, copied: [6, 4], highlight: 4 }), null, C.amber);
  await until(S(10) + 1.55);
  await show('RETURNED CARDS CAN COME UP AGAIN', bag({ order: againMix, drawn: 6, copied: [6, 4] }), null, C.amber);
  await until(S(11)); await show('KEEP DRAWING UNTIL THERE ARE EIGHT',
    bag({ copied: [6, 4, 6, 3, 5, 8, 4, 3], complete: true }));
  await until(S(12)); await show('SOME REPEAT, SOME ARE MISSING', sampleOnly(samples[0], null, true), null, C.amber);
  await until(S(13)); await show('BOOTSTRAP SAMPLE', sampleOnly(samples[0]), null, C.green);
  await until(S(14)); await show('ONE TREE FOR EACH SAMPLE', miniTrees(samples.map(ids => ids.slice(0, 4))), null, C.violet);
  await until(S(15)); await show('EACH TREE LEARNS FROM ITS OWN CARDS', miniTrees(samples), null, C.violet);
  await until(S(16)); await show('GATHER THE PREDICTIONS', mergePicture(), null, C.violet);
  await until(S(17)); await show('BAGGING', mergePicture(), ['Bootstrap aggregation'], C.green);
  await until(S(18)); await show('AGGREGATION MEANS COMBINING', mergePicture(), ['Separate votes', ['One combined prediction', C.green]], C.green);
  await until(S(19)); await show('THREE TREES, ONE QUESTION EACH', miniTrees(samples), null, C.violet);

  await until(S(20)); await show('DRAW FOR TREE 1', sampleOnly(samples[0], 1));
  await until(S(21)); await show('GINI IMPURITY MEASURES MIXING', group([
    text('Mixed group', -1.55, 0.75, 21),
    text('One outcome', 1.55, 0.75, 21),
    ...row([4, 5, 3, 8], -1.55, -0.11, 0.66),
    ...row([6, 5, 8, 6], 1.55, -0.11, 0.66),
    text('Impurity = 0.5', -1.55, -1.02, 19, C.amber),
    text('Impurity = 0', 1.55, -1.02, 19, C.green),
  ]));
  await until(S(22)); await show('LOOK FOR THE LOWEST WEIGHTED IMPURITY', impurityChart(), null, C.amber);
  await until(S(23)); await show('CHOOSE STEADY INCOME', impurityChart(),
    ['Income and reminders tie', ['Income comes first', C.amber]], C.amber);
  await until(S(24)); await show('WITH STEADY INCOME', tree(1, { counts: [1] }), null);
  await until(S(25)); await show('WITHOUT STEADY INCOME', tree(1, { counts: [1, 0] }), null, C.pink);
  await until(S(26)); await show('EACH GROUP PREDICTS ITS MOST COMMON OUTCOME',
    tree(1, { counts: [1, 0], predictions: true }), null, C.green);
  await until(S(27)); await show('APPLICATION 1 HAS NO STEADY INCOME', tree(1, { test: true }), null, C.amber);
  await until(S(28)); await show('TREE 1 MISSES APPLICATION 1', tree(1, { test: true, predictions: true, actual: true }),
    [['Predicted: partial', C.pink], ['Actual: full', C.cyan]], C.pink);

  await until(S(29)); await show('DRAW AGAIN FROM THE ORIGINAL BAG', bag(), null);
  await until(S(30)); await show('DRAW FOR TREE 2', sampleOnly(samples[1], 2));
  await until(S(31)); await show('CHOOSE SAVINGS', tree(2), ['Lowest weighted impurity', ['About 0.167', C.amber]], C.amber);
  await until(S(32)); await show('WITH SAVINGS', tree(2, { counts: [1] }), null);
  await until(S(33)); await show('WITHOUT SAVINGS', tree(2, { counts: [1, 0] }), null, C.pink);
  await until(S(34)); await show('APPLICATION 1 HAS SAVINGS', tree(2, { test: true, predictions: true }),
    [['Tree 2 predicts full', C.cyan]]);
  await until(S(35)); await show('TWO DIFFERENT PREDICTIONS', votes(2), null, C.violet);

  await until(S(36)); await show('DRAW ONCE MORE FROM THE ORIGINAL BAG', bag());
  await until(S(37)); await show('DRAW FOR TREE 3', sampleOnly(samples[2], 3));
  await until(S(38)); await show('CHOOSE PREVIOUS REPAYMENT', tree(3), ['Weighted impurity = 0'], C.amber);
  await until(S(39)); await show('EACH GROUP HAS ONE OUTCOME', tree(3, { counts: [1, 0] }), null, C.green);
  await until(S(40)); await show('APPLICATION 1 REPAID A PREVIOUS LOAN', tree(3, { test: true, predictions: true }),
    [['Tree 3 predicts full', C.cyan]]);

  await until(S(41)); await show('TWO FULL VOTES, ONE PARTIAL', votes(3), null, C.violet);
  await until(S(42)); await show('TURN EACH VOTE INTO A NUMBER', votes(3, true));
  await until(S(43)); await show('AFTER TREE 1', votes(1, true), [['Mean vote = 0', C.amber]], C.amber);
  await until(S(44)); await show('AFTER TREE 2', votes(2, true), [['Mean vote = 1 ÷ 2 = 0.5', C.amber]], C.amber);
  await until(S(45)); await show('AFTER TREE 3', votes(3, true), [['Mean vote = 2 ÷ 3 ≈ 0.67', C.amber]], C.amber);
  await until(S(46)); await show('MEAN VOTE', votes(3, true),
    ['Mean vote = sum of votes', '            ÷ number of trees', ['(0 + 1 + 1) ÷ 3 ≈ 0.67', C.amber]], C.amber);
  await until(S(47)); await show('MORE THAN HALF VOTE FULL', votes(3, true, true),
    [['0.67 > 0.5', C.green]]);
  await until(S(48)); await show('CHECK THE EIGHT PAST APPLICATIONS', errorCurve(1),
    ['After 1 tree', ['2 mistakes', C.amber]], C.amber);
  await until(S(48) + 1.4); await show('CHECK THE EIGHT PAST APPLICATIONS', errorCurve(2),
    ['After 2 trees', ['2 mistakes', C.amber]], C.amber);
  await until(S(48) + 2.8); await show('CHECK THE EIGHT PAST APPLICATIONS', errorCurve(3),
    ['After 3 trees', ['0 mistakes', C.green]], C.amber);

  await until(S(49));
  for (let i = 3; i < history.length; i++) {
    const { full, vote, errors } = history[i];
    const n = i + 1;
    await show('DRAW, BUILD A TREE, UPDATE THE VOTES', errorCurve(n, true), [
      `Card 1: add vote ${vote}`,
      `Mean vote = ${full} ÷ ${n}`,
      [`Past mistakes: ${errors.length} of 8`, C.amber],
    ], C.violet);
  }
  await until(S(50)); await show('INDIVIDUAL VOTES CAN DIFFER', voteCurve(), null, C.violet);
  await until(S(51)); await show('AVERAGING CAN MAKE PREDICTIONS MORE STABLE', voteCurve(), null, C.green);
  await until(S(52)); await show('A SHARED MISTAKE CAN SURVIVE VOTING', group([
    text('Application 1 · Actual: full', 0, 1.0, 22, C.cyan),
    ...[-1.95, 0, 1.95].flatMap((x, i) => [
      text(`Tree ${i + 1}`, x, 0.31, 18, C.muted),
      rect(x, -0.37, 1.64, 0.82, C.pink),
      text('Partial = 0', x, -0.37, 19, C.pink),
      line(x, -0.83, 0, -1.46, C.pink),
    ]),
    text('Combined prediction: partial', 0, -1.81, 22, C.pink),
  ]), [['(0 + 0 + 0) ÷ 3 = 0', C.pink]], C.pink);
  await until(S(53)); await show('PAST RESULTS AND NEW BORROWERS', group([
    text('Eight past applications', 0, 0.92, 22),
    ...row(original, 0, 0.26, 0.84, () => ({ color: C.green })),
    text('0 mistakes after three trees', 0, -0.43, 20, C.green),
    rect(0, -1.34, 0.72, 0.63, C.amber),
    text('?', 0, -1.34, 24, C.amber),
    text('A new borrower’s outcome is unknown', 0, -2.06, 20, C.amber),
  ]), null, C.amber);
  await until(S(54)); await show('BAGGING', group([
    text('Draw, copy, return', 0, 0.99, 23, C.violet),
    ...row(samples[0], 0, 0.38, 0.78),
    ...[-1.9, 0, 1.9].flatMap((x, i) => [
      text(`Tree ${i + 1}`, x, -0.43, 20, C.violet),
      line(x, -0.75, 0, -1.39, C.violet),
    ]),
    text('Combine their predictions', 0, -1.79, 24, C.green),
  ]), null, C.green);
}
