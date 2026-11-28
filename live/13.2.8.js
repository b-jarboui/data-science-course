// 13.2.8 Random forests: helping trees make different mistakes.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, E, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  // Phone: pill at the top, picture moved down by DY (see at()), formula box under the picture.
  const DY = P ? 1.0 : 0;
  const PILL = P ? [0, 3.7, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -5.8, 0] : [4.3, -0.3, 0];
  const WIDTH = P ? Math.min(7.05, FW - 0.8) : 7;
  const TOP = P ? 1.42 : 1.04;
  const PART = '#fb923c';
  const questions = ['Steady income', 'Savings', 'Previous loan repaid', 'Requested reminders'];
  const letters = ['A', 'B', 'C', 'D'];
  const colors = [C.cyan, C.green, C.violet, C.amber];
  const answers = [
    [0, 1, 1, 0], [1, 0, 1, 0], [1, 1, 0, 1], [1, 1, 1, 1],
    [1, 0, 0, 1], [0, 1, 0, 0], [0, 0, 1, 1], [0, 0, 0, 0],
  ];
  const ids = answers.map((_, i) => i + 1);
  const samples = [
    [6, 4, 3, 5, 8, 4, 3, 6],
    [1, 7, 1, 2, 3, 3, 7, 3],
    [4, 5, 5, 1, 1, 2, 5, 4],
  ];
  const pairs = [[0, 3], [1, 3], [2, 3]];
  const outcomes = ids.map(id => Number(id <= 4));
  const at = (x, y) => [x, y + DY, 0];
  const group = (...items) => new M.VGroup(...items);
  const say = (text, color = C.cyan) => showA(text, color, PILL, P ? 17 : 18);
  const yesNo = value => value ? 'Yes' : 'No';
  const voteColor = value => value ? C.cyan : PART;
  const miss = q => ids.filter(id => answers[id - 1][q] !== outcomes[id - 1]);

  function text(value, x, y, size = 19, color = C.ink, maxWidth = WIDTH, mono = false) {
    const label = T(String(value), size, color, mono);
    if (label.getWidth() > maxWidth) label.scale(maxWidth / label.getWidth());
    label.moveTo(at(x, y));
    return label;
  }

  function line(x1, y1, x2, y2, color = C.muted, strokeWidth = 2) {
    return new M.Line({ start: at(x1, y1), end: at(x2, y2), color, strokeWidth });
  }

  function rect(x, y, width, height, color, fill = C.card, opacity = 0.92) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.09, color, strokeWidth: 2 });
    r.setFill(fill, opacity);
    r.moveTo(at(x, y));
    return r;
  }

  function card(value, x, y, color, width = 0.54, height = 0.40, size = 17) {
    return group(rect(x, y, width, height, color), text(value, x, y, size, color, width - 0.09, true));
  }

  function mark(value, x, y) {
    const color = voteColor(value);
    const shape = value
      ? new M.Circle({ radius: 0.15, color, strokeWidth: 2 })
      : new M.Rectangle({ width: 0.29, height: 0.29, color, strokeWidth: 2 });
    shape.setFill(color, 0.16);
    shape.moveTo(at(x, y));
    return group(shape, text(value ? '✓' : '−', x, y, 15, color, 0.29));
  }

  // Each slot owns one group. A replacement only groups newly created objects.
  const visible = new Map();
  function put(key, next, runTime = 0.38) {
    const animations = [];
    if (visible.has(key)) animations.push(new M.FadeOut(visible.get(key), { runTime }));
    if (next) {
      visible.set(key, next);
      animations.push(new M.FadeIn(next, { runTime }));
    } else {
      visible.delete(key);
    }
    return animations;
  }

  function box(lines, color = C.cyan) {
    if (!lines) return put('box');
    const size = P ? 20 : 19;
    const maxWidth = P ? FW - 1.2 : 4.15;
    const labels = lines.map((value, i) =>
      text(value, BOXP[0], BOXP[1] + ((lines.length - 1) / 2 - i) * 0.39,
        size, i === lines.length - 1 ? color : C.ink, maxWidth - 0.48, true));
    const width = Math.max(...labels.map(label => label.getWidth())) + 0.46;
    return put('box', group(rect(BOXP[0], BOXP[1], width, lines.length * 0.39 + 0.25, color), ...labels));
  }

  function applications({ full = false, features = 0, highlight = false } = {}) {
    const gridY = P ? 0.8 : 0.72;
    const pitch = P ? 0.62 : 0.43;
    const column = i => CX + (i - 2.5) * (WIDTH / 6);
    const short = ['Income', 'Savings', 'Prior loan', 'Reminders'];
    const headers = ['Loan', ...letters, 'Repaid'];
    const items = headers.flatMap((header, i) => {
      if ((i === 5 && !full) || (i > 0 && i < 5 && !features)) return [];
      const ink = highlight && i > 0 && i < 5 ? C.cyan : C.muted;
      // Feature names go on a second line under the letter, at a readable size.
      if (features === 2 && i > 0 && i < 5) {
        return [text(header, column(i), gridY + 0.3, 17, ink, WIDTH / 6 - 0.06, true),
          text(short[i - 1], column(i), gridY + 0.02, 15, ink, WIDTH / 6 - 0.04)];
      }
      return [text(header, column(i), gridY + (features === 2 ? 0.16 : 0), 16, ink, WIDTH / 6 - 0.06)];
    });
    if (highlight) {
      items.unshift(rect(CX, gridY + 0.27 - 4.25 * pitch, WIDTH * 4 / 6, 0.54 + 8.5 * pitch, C.cyan, C.bg, 0.18));
    }
    ids.forEach((id, i) => {
      const y = gridY - (i + 1) * pitch;
      items.push(card(id, column(0), y, full ? voteColor(outcomes[i]) : C.cyan, 0.55, P ? 0.43 : 0.36));
      if (features) answers[i].forEach((v, j) => items.push(text(yesNo(v), column(j + 1), y, 15, v ? C.ink : C.muted)));
      if (full) items.push(mark(outcomes[i], column(5), y));
    });
    return group(...items);
  }

  const treeX = i => CX + (i - 1) * WIDTH / 3;

  function tree(i, q, { errors = false, focus = false } = {}) {
    const x = treeX(i);
    const y = P ? 0.34 : 0.20;
    const dx = WIDTH / 14;
    const parts = [text(`TREE ${i + 1}`, x, y + 0.63, 18, C.muted, 2, true)];
    if (q == null) {
      parts.push(card('?', x, y, C.muted, 0.72));
      return group(...parts);
    }
    const answer = answers[0][q];
    [0, 1].forEach(v => {
      const branchX = x + (v ? dx : -dx);
      const color = focus && v === answer ? C.amber : colors[q];
      parts.push(line(x, y - 0.22, branchX, y - 0.95, color, focus && v === answer ? 4 : 2),
        text(yesNo(v), branchX + (v ? 0.2 : -0.2), y - 0.50, 15, C.ink, 0.6),
        mark(v, branchX, y - 1.11),
        text(v ? 'Full' : 'Part', branchX, y - 1.45, 15, voteColor(v), 0.7));
    });
    parts.push(card(letters[q], x, y, colors[q], 0.72));
    if (errors) {
      parts.push(text('Misses', x, y - 1.84, 15, PART));
      miss(q).forEach((id, j) => parts.push(card(id, x + (j - 0.5) * 0.65, y - 2.22, PART)));
    }
    return group(...parts);
  }

  function trees(chosen, options = {}) {
    return [0, 1, 2].flatMap(i => put(`tree${i}`, tree(i, chosen[i], { ...options, focus: options.focus === i })));
  }

  function clearTrees() {
    return [0, 1, 2].flatMap(i => put(`tree${i}`));
  }

  function incoming(rows, labels, { tinted = false } = {}) {
    const y0 = P ? 0.85 : 0.8;
    const pitch = P ? 1.03 : 0.89;
    const step = WIDTH / 9.4;
    return group(...rows.flatMap((row, i) => {
      const y = y0 - pitch * i;
      return [
        text(labels[i], CX, y + 0.30, 17, C.muted),
        ...row.map((id, j) => card(id, CX + (j - 3.5) * step, y - 0.12,
          tinted ? voteColor(outcomes[id - 1]) : C.cyan)),
      ];
    }));
  }

  function gains(candidates = [0, 1, 2, 3], shown = candidates.length, selected = null) {
    const y0 = P ? 0.8 : 0.72;
    const pitch = P ? 0.77 : 0.65;
    const start = CX + 0.15;
    return group(text('Reduction in Gini impurity', CX, y0 + 0.52, 20, C.muted),
      ...candidates.flatMap((q, i) => {
        const y = y0 - i * pitch;
        const value = q === 3 ? 0 : 0.125;
        // Left-aligned names, so the A/B/C/D list lines up.
        const name = text(`${letters[q]}  ${questions[q]}`, 0, y, 18, selected === q ? C.amber : colors[q], WIDTH * 0.46);
        name.moveTo(at(CX - WIDTH * 0.48 + name.getWidth() / 2, y));
        const items = [name];
        if (i >= shown) return items;
        items.push(line(start, y, start + 1.7, y, C.line));
        if (value) items.push(rect(start + 0.85, y, 1.7, 0.19, colors[q], colors[q], 0.8));
        else items.push(new M.Dot({ point: at(start, y), radius: 0.055, color: colors[q] }));
        items.push(text(value, CX + WIDTH * 0.37, y, 18, colors[q], 0.82, true));
        return items;
      }));
  }

  function bag(title, x, y, width, cards) {
    const items = [
      line(x - width / 2, y + 0.43, x - width * 0.38, y - 0.52, C.muted),
      line(x + width / 2, y + 0.43, x + width * 0.38, y - 0.52, C.muted),
      line(x - width * 0.38, y - 0.52, x + width * 0.38, y - 0.52, C.muted),
      text(title, x, y - 0.84, 16, C.ink, width + 0.2),
    ];
    cards.forEach((value, i) => {
      const columns = Math.min(4, cards.length);
      items.push(card(value, x + (i % columns - (columns - 1) / 2) * 0.54,
        y + (cards.length > 4 ? 0.23 - Math.floor(i / columns) * 0.42 : 0),
        typeof value === 'number' ? C.cyan : colors[letters.indexOf(value)], 0.43, 0.35, 15));
    });
    return group(...items);
  }

  function questionDraw(state) {
    const dx = WIDTH * 0.24;
    const drawn = state === 'draw' || state === 'choose';
    const left = bag('Application cards', CX - dx, TOP - 1.66, 3.01, ids);
    const right = bag('Question cards', CX + dx, TOP - 1.66, 3.01, drawn ? ['B', 'C'] : letters);
    if (!drawn) return group(left, right);
    const x = CX + dx, y = TOP - 0.33, color = state === 'choose' ? C.amber : C.cyan;
    return group(left, right, card('A', x - 0.37, y, color), card('D', x + 0.37, y, color),
      new M.Arrow({ start: at(x, TOP - 1.19), end: at(x, y - 0.27), color }));
  }

  function alternatePairs() {
    return group(...pairs.flatMap((pair, i) => {
      const x = treeX(i);
      return [text(`TREE ${i + 1}`, x, TOP - 0.1, 17, C.muted, 1.9, true),
        ...pair.map((q, j) => card(letters[q], x + (j - 0.5) * 0.65, TOP - 0.73, colors[q])),
        line(x, TOP - 1.04, x, TOP - 1.52, colors[pair[0]]),
        card(letters[pair[0]], x, TOP - 1.81, colors[pair[0]])];
    }));
  }

  function currentPair(pair) {
    const x = CX, y = P ? -2.84 : -2.49;
    return group(...pair.map((q, j) => card(`${letters[q]}  ${questions[q]}`, x + (j - 0.5) * WIDTH / 2,
      y, colors[q], WIDTH / 2 - 0.16, 0.5, 17)));
  }

  function votes(chosen, id) {
    return chosen.map(q => answers[id - 1][q]);
  }

  function mean(chosen, id) {
    const values = votes(chosen, id);
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  function mistakes(chosen) {
    return ids.filter(id => Number(mean(chosen, id) > 0.5) !== outcomes[id - 1]);
  }

  function appOne(chosen) {
    const values = votes(chosen, 1);
    const y = P ? -3.33 : -2.46;
    return group(text('Loan 1', CX - WIDTH * 0.39, y, 17, C.muted),
      ...values.map((v, i) => card(v, CX + (i - 1) * 0.78, y, voteColor(v))),
      text('Actual: Full', CX + WIDTH * 0.35, y, 17, C.cyan, 1.75));
  }

  function appOneBox(chosen) {
    const values = votes(chosen, 1);
    const sums = ['0 ÷ 1 = 0', '(0 + 1) ÷ 2 = ½', '(0 + 1 + 1) ÷ 3 ≈ 0.67'];
    return box([`Loan 1  ·  ${values.length} ${values.length === 1 ? 'tree' : 'trees'}`, sums[values.length - 1]],
      values.length === 3 ? C.green : C.amber);
  }

  function chart(counts, { small = false } = {}) {
    const left = small ? CX + 0.35 : CX - WIDTH * 0.37;
    const right = CX + WIDTH * 0.46;
    const top = small ? TOP - 1.78 : TOP - 0.94;
    const base = P ? -4.56 : -2.32;
    const x = i => left + i * (right - left) / Math.max(2, counts.length - 1);
    const y = v => base + (top - base) * v / 2;
    const items = [text('Mistakes on the 8 past loans', (left + right) / 2, top + 0.34, small ? 15 : 19,
      C.muted, right - left + 0.55),
      line(left, base, right, base, C.muted)];
    [0, 1, 2].forEach(v => {
      if (v) items.push(line(left, y(v), right, y(v), C.line));
      items.push(text(v, left - 0.26, y(v), 15, C.muted, 0.32, true));
    });
    counts.forEach((v, i) => {
      if (i) items.push(line(x(i - 1), y(counts[i - 1]), x(i), y(v), C.cyan, 3));
      items.push(new M.Dot({ point: at(x(i), y(v)), radius: 0.075, color: C.cyan }),
        text(i + 1, x(i), base - 0.25, 15, C.muted, 0.31, true));
    });
    items.push(text('Trees added', (left + right) / 2, base - 0.49, 15, C.muted));
    return group(...items);
  }

  function combined(chosen) {
    const errors = mistakes(chosen);
    const fractions = ['0', '1/3', '2/3', '1'];
    const y = P ? -1 : -0.4;
    const step = WIDTH / 8;
    const items = [
      text('Application', CX, y + 1.08, 19, C.muted),
      text('Mean full-repayment vote', CX, y + 0.19, 17, C.muted),
    ];
    ids.forEach((id, i) => {
      const x = CX + (i - 3.5) * step;
      const m = mean(chosen, id);
      items.push(card(id, x, y + 0.65, errors.includes(id) ? PART : C.cyan),
        text(fractions[Math.round(m * 3)], x, y - 0.21, 19, C.ink, step - 0.1, true),
        mark(m > 0.5, x, y - 0.73));
    });
    return group(...items);
  }

  function samplesAndPairs() {
    const x = CX - WIDTH * 0.16, pairX = CX + WIDTH * 0.39;
    const pitch = P ? 1.02 : 0.88;
    return group(text('Application draws', x, TOP, 18, C.muted, 3.8),
      text('Questions', pairX, TOP, 18, C.muted, 1.65),
      ...samples.flatMap((row, i) => {
        const y = TOP - 0.7 - i * pitch;
        return [
          ...row.map((id, j) => card(id, x + (j - 3.5) * WIDTH * 0.082, y, voteColor(outcomes[id - 1]), 0.47, 0.4, 16)),
          ...pairs[i].map((q, j) => card(letters[q], pairX + (j - 0.5) * 0.61, y, colors[q])),
        ];
      }));
  }

  function deeper() {
    const y = TOP - 0.45;
    const d = WIDTH * 0.25;
    return group(text('Draw again at each split', CX, y + 0.4, 19, C.muted),
      line(CX, y - 0.24, CX - d, y - 1.51, C.violet),
      line(CX, y - 0.24, CX + d, y - 1.51, C.green),
      card('A  D', CX, y, C.cyan, 1.26, 0.49),
      text('No', CX - d * 0.72, y - 0.91, 17, C.ink),
      text('Yes', CX + d * 0.72, y - 0.91, 17, C.ink),
      card('B  C', CX - d, y - 1.76, C.violet, 1.26, 0.49),
      card('C  D', CX + d, y - 1.76, C.green, 1.26, 0.49));
  }

  // The second and third sampled trees each win with a different question.
  const abc = [0, 1, 2];
  const counts = abc.map((_, i) => mistakes(abc.slice(0, i + 1)).length);

  await until(S(0));
  await play(...trees([]), ...say('WILL THE BORROWER REPAY IN FULL?'));
  await until(S(1));
  await play(...clearTrees(), ...put('main', applications()), ...say('8 PAST APPLICATIONS'));
  await until(S(2));
  await play(...put('main', applications({ full: true })), ...say('4 FULL REPAYMENTS  ·  4 PARTIAL', C.amber));
  await until(S(3));
  await play(...put('main', applications({ full: true, features: 1 })), ...say('4 ANSWERS ON EACH APPLICATION'));
  await until(S(4));
  await play(...put('main', applications({ full: true, features: 2 })), ...say('THE FOUR APPLICATION QUESTIONS'));
  await until(S(5));
  await play(...put('main', applications({ full: true, features: 2, highlight: true })), ...say('EACH RECORDED DETAIL IS A FEATURE'));

  await until(S(6));
  await play(...put('main', incoming(samples, ['Draw for tree 1', 'Draw for tree 2', 'Draw for tree 3'], { tinted: true })),
    ...say('BAGGING: DRAW APPLICATION CARDS'));
  await until(S(7));
  await play(...put('main', appOne(abc)), ...appOneBox(abc), ...say('COMBINE THE TREES’ PREDICTIONS', C.green));
  await until(S(8));
  await play(...put('main'), ...box(null), ...trees([0, 0, 0]), ...say('WHAT IF ALL TREES ASK THE SAME QUESTION?', C.amber));
  await until(S(9));
  await play(...clearTrees(), ...put('main', incoming([ids, ids, ids], ['Tree 1', 'Tree 2', 'Tree 3'])),
    ...say('SAME 8 APPLICATIONS FOR EACH TREE'));
  await until(S(10));
  await play(...put('main', gains([0, 1, 2, 3], 0)), ...say('CHOOSE ONE OF FOUR QUESTIONS'));
  await until(S(11));
  await play(...put('main', gains()), ...say('A, B AND C IMPROVE THE SPLIT EQUALLY', C.amber));
  await until(S(12));
  await play(...put('main'), ...trees([0, 0, 0]), ...say('A COMES FIRST IN A, B, C, D', C.amber));
  await until(S(13));
  await play(...trees([0, 0, 0], { errors: true }), ...say('ALL THREE MISS LOANS 1 AND 5', PART));
  await until(S(14));
  await play(...box(['Three identical votes', 'Still wrong on loans 1 and 5'], PART), ...say('VOTING KEEPS BOTH MISTAKES', PART));

  await until(S(15));
  await play(...clearTrees(), ...box(null), ...put('main', alternatePairs()), ...say('GIVE TREES DIFFERENT QUESTION CARDS'));
  await until(S(16));
  await play(...put('main', questionDraw('in')), ...say('KEEP THE TWO SETS OF CARDS SEPARATE'));
  await until(S(17));
  await play(...put('main', questionDraw('draw')), ...say('DRAW TWO DIFFERENT QUESTIONS', C.amber));
  await until(S(18));
  await play(...put('main', questionDraw('choose')), ...say('THE NEXT TREE CHOOSES FROM A OR D', C.amber));
  await until(S(19));
  await play(...put('main', questionDraw('in')), ...say('RETURN BOTH QUESTION CARDS'));
  await until(S(20));
  await play(...put('main', alternatePairs()), ...say('DIFFERENT DRAWS CAN LEAD TO DIFFERENT SPLITS'));
  await until(S(21));
  await play(...put('main', samplesAndPairs()), ...say('BOTH RANDOM DRAWS BUILD A RANDOM FOREST', C.green));
  await until(S(22));
  await play(...put('main'), ...trees(abc), ...say('MANY DECISION TREES FORM A FOREST', C.green));
  await until(S(23));
  await play(...clearTrees(), ...put('main', incoming([ids], ['The same applications for all three trees'], { tinted: true })),
    ...say('KEEP THE APPLICATIONS FIXED'));

  await until(S(24));
  await play(...put('main', gains(pairs[0], 0)), ...put('pair', currentPair(pairs[0])), ...say('TREE 1 DRAWS A AND D', C.amber));
  await until(S(25));
  await play(...put('main', gains(pairs[0], 1)), ...box(['Gini measures mixed outcomes', '0.5 − 0.375 = 0.125'], C.cyan),
    ...say('STEADY INCOME REDUCES GINI'));
  await until(S(26));
  await play(...put('main', gains(pairs[0])), ...box(['Requested reminders', '0.5 − 0.5 = 0'], C.amber), ...say('REMINDERS GIVE ZERO REDUCTION', C.amber));
  await until(S(27));
  await play(...put('main'), ...put('pair'), ...box(null), ...trees([0], { errors: true }), ...say('TREE 1 CHOOSES A  ·  MISSES 1 AND 5'));
  await until(S(28));
  await play(...put('tree0', tree(0, 0, { errors: true, focus: true })),
    ...box(['Loan 1: no steady income', 'Tree 1 predicts partial'], PART), ...say('FOLLOW THE NO BRANCH', C.amber));

  await until(S(29));
  await play(...clearTrees(), ...box(null), ...put('main', gains(pairs[1], 0)), ...put('pair', currentPair(pairs[1])),
    ...say('TREE 2 DRAWS B AND D', C.amber));
  await until(S(30));
  await play(...put('main', gains(pairs[1])), ...box(['B: Gini falls by 0.125', 'D: Gini falls by 0'], C.green),
    ...say('SAVINGS GIVES THE LARGER REDUCTION', C.green));
  await until(S(31));
  await play(...put('main'), ...put('pair'), ...box(null), ...trees([0, 1], { errors: true }),
    ...say('TREE 2 CHOOSES B  ·  MISSES 2 AND 6', C.green));
  await until(S(32));
  await play(...put('tree1', tree(1, 1, { errors: true, focus: true })),
    ...box(['Loan 1: has savings', 'Tree 2 predicts full'], C.green), ...say('FOLLOW THE YES BRANCH', C.amber));

  await until(S(33));
  await play(...clearTrees(), ...box(null), ...put('main', gains(pairs[2], 0)), ...put('pair', currentPair(pairs[2])),
    ...say('TREE 3 DRAWS C AND D', C.amber));
  await until(S(34));
  await play(...put('main', gains(pairs[2])), ...box(['C: Gini falls by 0.125', 'D: Gini falls by 0'], C.violet),
    ...say('PRIOR REPAYMENT GIVES THE LARGER REDUCTION', C.violet));
  await until(S(35));
  await play(...put('main'), ...put('pair'), ...box(null), ...trees(abc, { errors: true }),
    ...say('TREE 3 CHOOSES C  ·  MISSES 3 AND 7', C.violet));
  await until(S(36));
  await play(...put('tree2', tree(2, 2, { errors: true, focus: true })),
    ...box(['Loan 1: repaid a previous loan', 'Tree 3 predicts full'], C.green), ...say('FOLLOW THE YES BRANCH', C.amber));
  await until(S(37));
  await play(...put('tree2', tree(2, 2, { errors: true })), ...box(null), ...say('TWO MISTAKES EACH, ON DIFFERENT LOANS', C.green));

  await until(S(38));
  await play(...trees(abc), ...box([['Full repayment', '1'].join('  =  '), 'Partial repayment  =  0']), ...say('WRITE THE VOTES AS ONES AND ZEROS'));
  for (let n = 1; n <= 3; n++) {
    const chosen = abc.slice(0, n);
    await until(S(38 + n));
    await play(...put('vote', appOne(chosen)), ...appOneBox(chosen),
      ...say(['ONE TREE VOTES', 'ONE OF TWO VOTES IS FULL', 'TWO OF THREE VOTES ARE FULL'][n - 1], C.amber));
  }
  await until(S(42));
  await play(...box(['Loan 1: ⅔ > ½', 'Combined prediction: full'], C.green), ...say('THE MAJORITY GETS LOAN 1 RIGHT', C.green));
  await until(S(43));
  const revealTime = Math.min(1.18, (E(43) - S(43)) / 4);
  await play(...clearTrees(), ...put('vote'), ...box(null), ...put('main', chart(counts.slice(0, 1))),
    ...say('COUNT MISTAKES ACROSS ALL 8 PAST LOANS'));
  for (let n = 2; n <= counts.length; n++) {
    await until(S(43) + (n - 1) * revealTime);
    await play(...put('main', chart(counts.slice(0, n))));
  }

  await until(S(44));
  await play(...put('main', combined(abc)), ...say('EACH LOAN HAS ONE MEAN VOTE'));
  await until(S(45));
  await play(...box(['Mean vote = sum of votes', '÷ number of trees']), ...say('ADD THE VOTES, THEN DIVIDE BY THE TREE COUNT'));
  await until(S(46));
  await play(...box(null), ...put('main', incoming(samples, ['Tree 1 draws', 'Tree 2 draws', 'Tree 3 draws'], { tinted: true })),
    ...say('EACH TREE ALSO DRAWS APPLICATION CARDS'));
  await until(S(47));
  await play(...put('main', samplesAndPairs()), ...say('USE THE BAGGING DRAWS AND TODAY’S QUESTION PAIRS'));
  await until(S(48));
  await play(...put('main', combined(abc)), ...box(['Tree 1 asks A  ·  Tree 2 asks B', 'Tree 3 asks C  ·  0 of 8 mistakes'], C.green),
    ...say('SAME SPLITS AND SAME COMBINED PREDICTIONS', C.green));
  await until(S(49));
  await play(...box(null), ...put('main', deeper()), ...say('DRAW FRESH QUESTIONS AT EVERY SPLIT'));

  // These are possible repeat draws. The three fixed training draws select A, B and C again.
  const additions = [0, 1, 2, 0, 1, 2];
  const history = [];
  await until(S(50));
  for (let i = 0; i < additions.length; i++) {
    if (i) await until(S(50) + i * 0.95);
    const chosen = additions.slice(0, i + 1);
    const q = additions[i];
    history.push(mistakes(chosen).length);
    const voteSum = votes(chosen, 1).reduce((sum, vote) => sum + vote, 0);
    await play(...put('main', chart(history, { small: true })),
      ...put('extra', group(text(`Tree ${i + 1} added`, CX - 1.95, TOP - 0.22, 20, C.muted),
        card(letters[q], CX - 1.95, TOP - 0.83, colors[q], 0.72),
        text('Loan 1', CX - 1.95, TOP - 1.46, 18, C.ink),
        text(`${voteSum} of ${i + 1} full votes`, CX - 1.95, TOP - 1.88, 18, C.cyan, 2.52))),
      ...(i === 0 ? say('UPDATE THE VOTE AFTER EVERY TREE') : []));
  }
  await until(S(51));
  await play(...put('extra'), ...put('main', chart(counts)), ...box(['Different mistakes', '2 → 2 → 0 on these loans'], C.green),
    ...say('DIFFERENT MISTAKES CAN CANCEL', C.green));
  await until(S(52));
  await play(...put('main', gains([3])), ...box(['Only one question offered', 'D: Gini falls by 0'], C.amber),
    ...say('A SMALL DRAW CAN MISS A USEFUL QUESTION', C.amber));
  await until(S(53));
  await play(...put('main', group(
    text('8 past applications', CX, TOP - 0.35, 21, C.cyan),
    ...ids.map((id, i) => card(id, CX + (i - 3.5) * WIDTH / 8, TOP - 0.87, C.cyan)),
    text('New applications', CX, TOP - 1.73, 21, C.amber),
    ...[-1, 0, 1].map(i => card('?', CX + i * 0.77, TOP - 2.24, C.amber)))),
    ...box(['Past loans: 0 mistakes', 'New loans: outcomes unknown'], C.amber),
    ...say('CHECK PREDICTIONS ON NEW APPLICATIONS', C.amber));
  await until(S(54));
  await play(...box(null), ...put('main', samplesAndPairs()), ...say('RANDOM APPLICATIONS + RANDOM QUESTIONS', C.green));
}
