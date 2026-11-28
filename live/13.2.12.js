// 13.2.12 Boosting shrinkage. Beat i = sentence i, starting at zero.
export default async function (L) {
  const { M, P, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 3.6, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -3.75, 0] : [4.3, -0.3, 0];
  const actual = [10, 10, 10, 10, 2, 2, 2, 2];
  const start = actual.map(() => 6);
  const apps = actual.map((_, i) => i + 1);
  const features = [
    { name: 'Steady income?', yes: [2, 3, 4, 5] },
    { name: 'Has savings?', yes: [1, 3, 4, 6] },
    { name: 'Repaid a previous loan?', yes: [1, 2, 4, 7] },
  ];
  const half = [
    { prediction: start, loss: 16 },
    { prediction: [5, 7, 7, 7, 7, 5, 5, 5], loss: 13 },
    { prediction: [6, 6, 8, 8, 6, 6, 4, 4], loss: 10 },
    { prediction: [7, 7, 7, 9, 5, 5, 5, 3], loss: 7 },
    { loss: 6.25 },
    { loss: 5.5 },
  ];
  const large = [
    start,
    [0, 12, 12, 12, 12, 0, 0, 0],
    [12, 0, 0, 0, 0, 12, 12, 12],
  ];

  const layers = new Map();
  const point = (x, y) => [x, y, 0];
  const say = (label, color = C.cyan) => showA(label, color, PILL, P ? 18 : 19);
  const txt = (label, x, y, color = C.ink, size = 19, mono = true) =>
    T(String(label), size, color, mono).moveTo(point(x, y));
  const line = (x1, y1, x2, y2, color = C.muted, width = 2) =>
    new M.Line({ start: point(x1, y1), end: point(x2, y2), color, strokeWidth: width });
  const dot = (x, y, color, radius = 0.075) => new M.Dot({ point: point(x, y), radius, color });
  const group = parts => new M.VGroup(...parts);
  const signed = value => value < 0 ? `−${-value}` : value > 0 ? `+${value}` : '0';
  const residual = prediction => actual.map((value, i) => value - prediction[i]);

  function change(key, next) {
    const previous = layers.get(key);
    if (next) layers.set(key, next);
    else layers.delete(key);
    const out = previous && new M.FadeOut(previous, { runTime: 0.22 });
    const incoming = next && new M.FadeIn(next, { runTime: 0.35 });
    if (out && incoming) {
      return [new M.LaggedStart([out, incoming], { lagRatio: 1, runTime: 0.56 })];
    }
    return [out || incoming].filter(Boolean);
  }

  function box(lines, accent = C.cyan) {
    const size = P ? 20 : 18;
    const rows = lines.map(row => Array.isArray(row) ? row : [row, C.ink]);
    const labels = rows.map(([value, color]) => T(value, size, color, true));
    const width = Math.max(...labels.map(label => label.getWidth())) + 0.56;
    const pitch = P ? 0.44 : 0.38;
    const height = rows.length * pitch + 0.32;
    const bg = new M.RoundedRectangle({
      width, height, cornerRadius: 0.16, color: accent, strokeWidth: 2,
    });
    bg.setFill(C.card, 0.95);
    bg.moveTo(BOXP);
    labels.forEach((label, i) => label.moveTo(point(
      BOXP[0] - width / 2 + 0.28 + label.getWidth() / 2,
      BOXP[1] + ((rows.length - 1) / 2 - i) * pitch,
    )));
    const panel = group([bg, ...labels]);
    const maxWidth = P ? 6.8 : 4;
    if (width > maxWidth) panel.scale(maxWidth / width);
    return change('box', panel);
  }

  const row = (name, values, color = C.ink, marks = []) => ({ name, values, color, marks });
  const actualRow = row('Repaid', actual, C.cyan);
  const predictionRow = values => row('Predict', values, C.amber);
  const residualRow = (values, marks) => row('Residual', residual(values).map(signed), C.violet, marks);
  const correctionRow = (feature, yes, no, name = 'Tree') =>
    row(name, apps.map(n => signed(feature.yes.includes(n) ? yes : no)), C.green, feature.yes);
  const questionRow = feature =>
    row('Answer', apps.map(n => feature.yes.includes(n) ? 'Y' : 'N'), C.muted, feature.yes);

  function table(rows = []) {
    const left = CX - (P ? 3.62 : 3.82);
    const step = P ? 0.67 : 0.72;
    const x = i => left + 1.92 + i * step;
    // Taller rows: the table fills the space between the pill and the formula box.
    const top = P ? 2.55 : 1.05;
    const pitch = P ? 0.82 : 0.64;
    const parts = [
      txt('Loan', left + 0.67, top, C.muted),
      ...apps.map((n, i) => txt(n, x(i), top, C.muted)),
      line(left, top - 0.24, x(7) + 0.31, top - 0.24, C.line, 3),
    ];
    rows.forEach(({ name, values, color, marks }, k) => {
      const y = top - (k + 1) * pitch;
      parts.push(txt(name, left + 0.67, y, color, 17));
      values.forEach((value, i) => {
        if (value == null) return;
        if (marks.includes(i + 1)) {
          const cell = new M.RoundedRectangle({
            width: step * 0.93, height: pitch * 0.75,
            cornerRadius: 0.08, color, strokeWidth: 1,
          });
          cell.setFill(color, 0.12);
          cell.moveTo(point(x(i), y));
          parts.push(cell);
        }
        parts.push(txt(value, x(i), y, color, P ? 20 : 20));
      });
    });
    return change('main', group(parts));
  }

  function loan() {
    const card = new M.RoundedRectangle({
      width: 4.4, height: 2.2, cornerRadius: 0.18, color: C.cyan, strokeWidth: 2,
    });
    card.setFill(C.card, 0.9);
    card.moveTo(point(CX, -0.45));
    return change('main', group([
      card, txt('New loan application', CX, 0.2, C.cyan, 23, false),
      line(CX - 1.7, -0.18, CX + 1.7, -0.18, C.line),
      txt('Amount repaid', CX - 0.35, -0.73, C.ink, 22, false),
      txt('?', CX + 1.5, -0.73, C.amber, 25),
    ]));
  }

  function arrow(x1, y, x2, color) {
    const back = x2 - Math.sign(x2 - x1) * 0.16;
    return [
      line(x1, y, x2, y, color, 4),
      line(back, y + 0.12, x2, y, color, 4),
      line(back, y - 0.12, x2, y, color, 4),
    ];
  }

  function correction(full, applied) {
    const x = value => CX + (value - 7) * 1.34;
    const axis = P ? -0.75 : -0.8;
    const parts = [line(x(5.7), axis, x(8.3), axis)];
    for (const value of [6, 7, 8]) {
      parts.push(line(x(value), axis - 0.09, x(value), axis + 0.09),
        txt(value, x(value), axis - 0.32, C.muted));
    }
    parts.push(txt('Current prediction', x(6) - 0.28, axis - 0.78, C.ink, 17, false),
      dot(x(6), axis, C.amber));
    if (full) {
      parts.push(...arrow(x(6), axis + 0.53, x(8), C.cyan),
        txt('Tree suggests +2', CX, axis + 0.86, C.cyan, 20, false));
    }
    if (applied !== null) {
      const y = full ? axis + 1.25 : axis + 0.53;
      parts.push(...arrow(x(6), y, x(6 + applied), C.green),
        txt(`Apply ${signed(applied)}`, (x(6) + x(6 + applied)) / 2, y + 0.32, C.green, 20, false),
        dot(x(6 + applied), axis, C.green));
    }
    return change('main', group(parts));
  }

  function firstTree() {
    const y = 0.75;
    const q = features[0];
    return change('main', group([
      txt(q.name, CX, y, C.cyan, 24, false),
      line(CX - 0.32, y - 0.24, CX - 1.42, -0.18),
      line(CX + 0.32, y - 0.24, CX + 1.42, -0.18),
      txt('Yes', CX - 1.52, -0.47, C.green),
      txt('No', CX + 1.52, -0.47, C.violet),
      txt('+2', CX - 1.52, -0.94, C.green, 26),
      txt('−2', CX + 1.52, -0.94, C.violet, 26),
      txt('Suggested correction', CX, -1.55, C.muted, 18, false),
    ]));
  }

  function room(stage) {
    const y = -0.55;
    const x = temp => CX + (temp - 18) * 0.9;
    const parts = [
      txt('Room temperature', CX, 1.02, C.ink, 24, false),
      line(x(15.5), y, x(20.5), y),
      line(x(20), y + 0.12, x(20), y + 0.54, C.green),
      txt('Target', x(20), y + 0.78, C.green, 17),
    ];
    for (const value of [16, 17, 18, 19, 20]) {
      parts.push(line(x(value), y - 0.08, x(value), y + 0.08),
        txt(`${value}°`, x(value), y - 0.37, C.muted, 18));
    }
    if (stage === 0) {
      parts.push(dot(x(16), y, C.cyan, 0.12),
        txt('Too cold', x(16), y - 0.89, C.cyan, 19, false));
    } else {
      for (const value of [16, 18]) {
        parts.push(...arrow(x(value), y + 0.25, x(value + 2) - 0.12, C.amber));
      }
      const checks = stage === 1 ? [16] : stage === 2 ? [16, 18] : [16, 18, 20];
      checks.forEach(value => parts.push(dot(x(value), y, C.cyan, 0.11)));
      parts.push(txt(stage === 1 ? 'Warm in smaller steps' : 'Check after each step',
        CX, y - 0.95, C.cyan, 19, false));
    }
    return change('main', group(parts));
  }

  function chart(maxTree, maxLoss, ticks) {
    const left = CX - 2.61, right = CX + 3.0;
    const floor = P ? -1.8 : -2.05, top = 0.83;
    const x = i => left + (right - left) * i / maxTree;
    const y = loss => floor + (top - floor) * loss / maxLoss;
    const axes = [txt('Mean squared error', CX, 1.22, C.ink, 19, false)];
    ticks.forEach(tick => axes.push(line(left, y(tick), right, y(tick), C.line),
      txt(tick, left - 0.48, y(tick), C.muted, 17)));
    axes.push(line(left, floor, left, top), line(left, floor, right, floor));
    for (let i = 0; i <= maxTree; i++) {
      axes.push(txt(i, x(i), floor - 0.26, C.muted, 17));
    }
    axes.push(txt('Trees added', CX + 0.2, floor - 0.62, C.muted, 18, false));
    return {
      axes: group(axes),
      trace(values, color, startAt = 0) {
        const parts = [];
        for (let i = startAt; i < values.length; i++) {
          const loss = values[i];
          if (i > 0) parts.push(line(x(i - 1), y(values[i - 1]), x(i), y(loss), color, 3));
          parts.push(dot(x(i), y(loss), color, 0.088));
        }
        return group(parts);
      },
      target(loss) {
        return new M.DashedLine({
          start: point(left, y(loss)), end: point(right, y(loss)), color: C.green,
        });
      },
    };
  }

  const slowChart = chart(5, 16, [0, 4, 8, 12, 16]);
  const fastChart = chart(3, 300, [0, 100, 200, 300]);
  const slowLoss = half.map(round => round.loss);
  const question = (round, feature) => box([`Tree ${round}`, feature.name, 'Y = yes   N = no']);
  const treeValues = (round, yes, no) => box([
    `Tree ${round} suggests`,
    [`Yes ${signed(yes)}   No ${signed(no)}`, C.green],
  ], C.green);
  const scaledValues = (rate, yes, no) => box([
    `Learning rate = ${rate}`,
    [`${signed(yes)} × ${rate} = ${signed(yes * rate)}`, C.green],
    [`${signed(no)} × ${rate} = ${signed(no * rate)}`, C.green],
  ], C.green);
  const lossBox = (before, after, round) => box([
    `After tree ${round}`,
    'Mean squared error',
    [`${before} → ${after}`, after > before ? C.pink : C.amber],
  ], after > before ? C.pink : C.amber);
  const predFrom = round => half[round].prediction;

  await until(S(0)); await play(...say('HOW MUCH WILL THIS BORROWER REPAY?'), ...loan());
  await until(S(1)); await play(...say('EIGHT PAST LOANS'), ...table());
  await until(S(2)); await play(...say('LOANS 1–4 REPAID 10'), ...table([row('Repaid', [10, 10, 10, 10], C.cyan)]));
  await until(S(3)); await play(...say('LOANS 5–8 REPAID 2'), ...table([actualRow]));
  await until(S(4)); await play(...say('START WITH THE MEAN', C.amber), ...table([actualRow, predictionRow(start)]),
    ...box(['Total repaid = 48', '48 ÷ 8 = 6', ['Start at 6 for each loan', C.amber]], C.amber));
  await until(S(5)); await play(...say('A TREE SUGGESTS A CORRECTION'), ...firstTree(), ...change('box'));
  await until(S(6)); await play(...say('BEFORE: APPLY THE WHOLE CORRECTION'), ...correction(false, 2),
    ...box(['Current prediction = 6', 'Apply +2', ['New prediction = 8', C.amber]]));
  await until(S(7)); await play(...say('WHAT IF WE APPLY ONLY PART?', C.amber), ...correction(true, null), ...change('box'));
  await until(S(8)); await play(...say('A COLD ROOM'), ...room(0));
  await until(S(9)); await play(...say('TRY SMALLER ADJUSTMENTS', C.amber), ...room(1));
  await until(S(10)); await play(...say('CHECK AGAIN AFTER EACH CHANGE'), ...room(2));
  await until(S(10) + 1.5); await play(...room(3));
  await until(S(11)); await play(...say('MAKE SMALLER CHANGES TO PREDICTIONS'), ...correction(true, null));
  await until(S(12)); await play(...say('THE TREE SUGGESTS ADDING TWO'), ...correction(true, null));
  await until(S(13)); await play(...say('HALF AS LONG: APPLY +1', C.green), ...correction(true, 1));
  await until(S(14)); await play(...say('SHRINKAGE', C.green),
    ...box(['Tree suggests +2', ['Apply only +1', C.green]], C.green));
  await until(S(15)); await play(...say('LEARNING RATE', C.green), ...box(['Fraction of the tree', 'correction we apply'], C.green));
  await until(S(16)); await play(...say('WHOLE CORRECTION OR HALF?'),
    ...box([['Rate 1:   apply +2', C.cyan], ['Rate 0.5: apply +1', C.green]]));
  await until(S(17)); await play(...say('LEARNING RATE = 0.5', C.green),
    ...table([actualRow, predictionRow(start)]), ...change('box'));
  await until(S(18)); await play(...say('SQUARE EACH ERROR, THEN TAKE THE MEAN', C.amber),
    ...table([actualRow, predictionRow(start), row('Squared', actual.map(() => 16), C.violet)]),
    ...box(['(10 − 6)² = 16', '(2 − 6)²  = 16', ['Mean of eight 16s = 16', C.amber]], C.amber));
  await until(S(19)); await play(...say('RESIDUAL = REPAID MINUS PREDICTED', C.violet),
    ...table([actualRow, predictionRow(start), residualRow(start)]),
    ...box(['10 − 6 = +4', ' 2 − 6 = −4'], C.violet));

  const [income, savings, previous] = features;
  await until(S(20)); await play(...say('TREE 1: STEADY INCOME?'),
    ...table([actualRow, predictionRow(start), residualRow(start, income.yes), questionRow(income)]),
    ...question(1, income));
  await until(S(21)); await play(...say('SUGGESTED CORRECTIONS', C.green),
    ...table([predictionRow(start), questionRow(income), residualRow(start), correctionRow(income, 2, -2)]),
    ...box(['Tree 1: mean residual', '(4 + 4 + 4 − 4) ÷ 4',
      ['Yes +2   No −2', C.green]], C.green));
  await until(S(22)); await play(...say('APPLY HALF OF EACH CORRECTION', C.green),
    ...table([predictionRow(start), correctionRow(income, 2, -2), correctionRow(income, 1, -1, 'Apply')]),
    ...scaledValues(0.5, 2, -2));
  await until(S(23)); await play(...say('ADD THE APPLIED CORRECTIONS', C.amber),
    ...table([row('Before', start, C.muted), correctionRow(income, 1, -1, 'Apply'), predictionRow(predFrom(1))]),
    ...box(['Loan 1: 6 − 1 = 5', 'Loan 2: 6 + 1 = 7'], C.amber));
  await until(S(24)); await play(...say('ERROR FALLS TO 13', C.amber),
    ...table([actualRow, predictionRow(predFrom(1)), row('Squared', residual(predFrom(1)).map(r => r ** 2), C.violet)]),
    ...lossBox(16, 13, 1));
  await until(S(25)); await play(...say('MAKE FRESH RESIDUALS', C.violet),
    ...table([actualRow, predictionRow(predFrom(1)), residualRow(predFrom(1))]),
    ...box(['Use the new predictions', 'Loan 1: 10 − 5 = +5'], C.violet));

  await until(S(26)); await play(...say('TREE 2: HAS SAVINGS?'),
    ...table([actualRow, predictionRow(predFrom(1)), residualRow(predFrom(1)), questionRow(savings)]),
    ...question(2, savings));
  await until(S(27)); await play(...say('RESIDUALS FOR LOANS WITH SAVINGS', C.violet),
    ...table([predictionRow(predFrom(1)), questionRow(savings), residualRow(predFrom(1), savings.yes)]),
    ...box(['Loans 1, 3, 4 and 6', ['+5   +3   +3   −3', C.violet]], C.violet));
  await until(S(28)); await play(...say('TAKE THE MEAN FOR EACH GROUP', C.green),
    ...table([questionRow(savings), residualRow(predFrom(1)), correctionRow(savings, 2, -2)]),
    ...box(['Tree 2 suggests', ['Yes: (5 + 3 + 3 − 3) ÷ 4 = +2', C.green],
      ['No:  (3 − 5 − 3 − 3) ÷ 4 = −2', C.green]], C.green));
  await until(S(29)); await play(...say('APPLY HALF AGAIN', C.green),
    ...table([predictionRow(predFrom(1)), correctionRow(savings, 2, -2), correctionRow(savings, 1, -1, 'Apply')]),
    ...scaledValues(0.5, 2, -2));
  await until(S(30)); await play(...say('UPDATE ALL EIGHT PREDICTIONS', C.amber),
    ...table([row('Before', predFrom(1), C.muted), correctionRow(savings, 1, -1, 'Apply'), predictionRow(predFrom(2))]),
    ...box(['Loan 1: 5 + 1 = 6', 'Loan 2: 7 − 1 = 6'], C.amber));
  await until(S(31)); await play(...say('ERROR FALLS TO 10', C.amber),
    ...table([actualRow, predictionRow(predFrom(2)), row('Squared', residual(predFrom(2)).map(r => r ** 2), C.violet)]),
    ...lossBox(13, 10, 2));
  await until(S(32)); await play(...say('MAKE FRESH RESIDUALS AGAIN', C.violet),
    ...table([actualRow, predictionRow(predFrom(2)), residualRow(predFrom(2))]),
    ...box(['Use the new predictions', 'Loan 1: 10 − 6 = +4'], C.violet));

  await until(S(33)); await play(...say('TREE 3: REPAID A PREVIOUS LOAN?'),
    ...table([predictionRow(predFrom(2)), questionRow(previous), residualRow(predFrom(2), previous.yes)]),
    ...question(3, previous));
  await until(S(34)); await play(...say('SUGGESTED CORRECTIONS', C.green),
    ...table([questionRow(previous), residualRow(predFrom(2)), correctionRow(previous, 2, -2)]),
    ...treeValues(3, 2, -2));
  await until(S(35)); await play(...say('APPLY HALF, THEN UPDATE', C.green),
    ...table([row('Before', predFrom(2), C.muted), correctionRow(previous, 1, -1, 'Apply'), predictionRow(predFrom(3))]),
    ...box(['0.5 × (+2) = +1', '0.5 × (−2) = −1', ['Loan 1: 6 + 1 = 7', C.amber]], C.green));
  await until(S(36)); await play(...say('ERROR FALLS TO 7', C.amber),
    ...table([actualRow, predictionRow(predFrom(3)), row('Squared', residual(predFrom(3)).map(r => r ** 2), C.violet)]),
    ...lossBox(10, 7, 3));

  await until(S(37)); await play(...say('ERROR AS WE ADD TREES'),
    ...change('main', slowChart.axes), ...change('slow', slowChart.trace(slowLoss.slice(0, 4), C.cyan)),
    ...box([['Rate 0.5', C.cyan], '16 → 13 → 10 → 7']));
  await until(S(38)); await play(...say('ADD TWO MORE TREES'),
    ...change('fourth', slowChart.trace(slowLoss.slice(0, 5), C.cyan, 4)),
    ...box([['Rate 0.5', C.cyan], 'Tree 4: 6.25']));
  await until(S(38) + 2.4); await play(...change('fifth', slowChart.trace(slowLoss, C.cyan, 5)),
    ...box([['Rate 0.5', C.cyan], 'Tree 4: 6.25', 'Tree 5: 5.5']));
  await until(S(39)); await play(...say('COMPARE WITH LEARNING RATE 1', C.amber),
    ...change('full', slowChart.trace([16, 12, 8, 4], C.amber, 1)),
    ...box([['Rate 0.5: tree 3 → 7', C.cyan], ['Rate 1:   tree 3 → 4', C.amber]]));
  await until(S(40)); await play(...say('SMALLER STEPS USUALLY NEED MORE TREES', C.green),
    ...change('target', slowChart.target(4)),
    ...box(['Target error: 4', ['Rate 1: there in 3 trees', C.amber],
      ['Rate 0.5: above 4 after 5', C.cyan]], C.green));

  await until(S(41)); await play(...say('TRY LEARNING RATE 3', C.pink),
    ...change('slow'), ...change('fourth'), ...change('fifth'), ...change('full'), ...change('target'),
    ...table([actualRow, predictionRow(start)]), ...box(['Apply 3 × the suggested', 'correction'], C.pink));
  await until(S(42)); await play(...say('TRIPLE THE FIRST CORRECTIONS', C.pink),
    ...table([predictionRow(start), correctionRow(income, 2, -2), correctionRow(income, 6, -6, 'Apply')]),
    ...scaledValues(3, 2, -2));
  await until(S(43)); await play(...say('PREDICTIONS JUMP. ERROR RISES.', C.pink),
    ...table([actualRow, row('Before', start), correctionRow(income, 6, -6, 'Apply'), predictionRow(large[1])]),
    ...lossBox(16, 28, 1));
  await until(S(44)); await play(...say('TREE 2 TRIES TO REPAIR THE JUMP'),
    ...table([predictionRow(large[1]), questionRow(income), residualRow(large[1]), correctionRow(income, -4, 4)]),
    ...treeValues(2, -4, 4));
  await until(S(45)); await play(...say('ANOTHER SWING. ERROR RISES AGAIN.', C.pink),
    ...table([row('Before', large[1]), correctionRow(income, -4, 4), correctionRow(income, -12, 12, 'Apply'),
      predictionRow(large[2])]),
    ...box(['3 × (−4) = −12', '3 × (+4) = +12', ['Error: 28 → 76', C.pink]], C.pink));
  await until(S(46)); await play(...say('TREE 3 OVERSHOOTS AGAIN', C.pink),
    ...change('main', fastChart.axes), ...change('fast', fastChart.trace([16, 28, 76, 268], C.pink)),
    ...box([['Rate 3', C.pink], 'Tree 3 applies +24 or −24', ['Error: 76 → 268', C.pink]], C.pink));
  await until(S(47)); await play(...say('ERROR MOVES FURTHER FROM ZERO', C.pink),
    ...box([['Rate 3', C.pink], ['16 → 28 → 76 → 268', C.pink]], C.pink));

  await until(S(48)); await play(...say('THE PREDICTION UPDATE'), ...change('fast'), ...correction(true, 1),
    ...box(['Start at 6', 'Tree suggests +2', ['Apply +1 and reach 7', C.green]]));
  await until(S(49)); await play(...say('ADD ONLY THE CHOSEN FRACTION', C.green),
    ...box(['New = current', '      + rate × tree correction', ['7 = 6 + 0.5 × 2', C.green]], C.green));
  await until(S(50)); await play(...say('SHRINKAGE MAKES EACH CHANGE SMALLER', C.green),
    ...box(['Tree suggests +2', ['Rate 0.5: apply +1', C.green]], C.green));
  await until(S(51)); await play(...say('STEP SIZE CHANGES HOW LEARNING GOES'),
    ...box([['Very small rate', C.cyan], 'More trees to lower error',
      ['Very large rate', C.pink], 'Error can keep rising']));
  await until(S(52)); await play(...say('HOW WELL WILL IT PREDICT NEW LOANS?'),
    ...loan(), ...box(['Error on past loans', ['Error on a new loan: ?', C.amber]]));
  await until(S(53)); await play(...say('CHECK ON LOANS KEPT SEPARATE', C.green),
    ...loanSets(), ...box(['Compare learning rates', 'and numbers of trees', ['on the separate loans', C.green]], C.green));
  await until(S(54)); await play(...say('THE LEARNING RATE SETS THE STEP SIZE', C.green),
    ...correction(true, 1), ...box(['Apply rate × correction', ['Then learn the next tree', C.green]], C.green));

  function loanSets() {
    const parts = [];
    const columns = [
      { x: CX - 1.8, label: 'Fit the trees', count: 8, color: C.cyan },
      { x: CX + 1.8, label: 'Check the choices', count: 4, color: C.green },
    ];
    columns.forEach(({ x, label, count, color }) => {
      const frame = new M.RoundedRectangle({
        width: 3.15, height: 1.85, cornerRadius: 0.14, color, strokeWidth: 2,
      });
      frame.setFill(C.card, 0.9);
      frame.moveTo(point(x, -0.55));
      parts.push(frame, txt(label, x, 0.03, color, 19, false));
      for (let i = 0; i < count; i++) {
        parts.push(dot(x + (i % 4 - 1.5) * 0.42, -0.55 - Math.floor(i / 4) * 0.38, color, 0.115));
      }
    });
    return change('main', group(parts));
  }
}
