// 13.2.5 Regression trees: predicting an amount.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const amounts = [10, 10, 10, 10, 2, 2, 2, 2];
  const ids = amounts.map((_, i) => i + 1);
  const yes = [2, 3, 4, 5], no = [1, 6, 7, 8];
  const CX = P ? 0 : -2.6, SP = 0.88, BW = P ? 0.48 : 0.44;
  const BASE = P ? -2.68 : -1.81, PITCH = P ? 0.25 : 0.17;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.48, 0] : [4.3, -0.3, 0];
  const label = (s, size, color, x, y, bold = false) =>
    T(String(s), size, color, true, bold).moveTo([x, y, 0]);
  const say = (s, color = C.cyan) => showA(s, color, PILL);
  const fadeIn = object => new M.FadeIn(object, { runTime: 0.55 });
  const fadeOut = object => new M.FadeOut(object, { runTime: 0.4 });
  const create = object => new M.Create(object, { runTime: 0.6 });
  const indicate = (object, color = C.amber) => new M.Indicate(object, { color, runTime: 0.65 });
  const line = (x1, y1, x2, y2, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth });

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const old = boxNow ? [fadeOut(boxNow)] : [];
    boxNow = null;
    if (!lines.length) return old;
    const size = P ? 21 : 20, lh = 0.4;
    const texts = lines.map(row => Array.isArray(row) ? T(row[0], size, row[1], true) : T(row, size, C.ink, true));
    const wd = Math.max(...texts.map(t => t.getWidth())) + 0.58;
    const ht = texts.length * lh + 0.3;
    const rect = new M.RoundedRectangle({ width: wd, height: ht, cornerRadius: 0.16, color, strokeWidth: 2 });
    rect.setFill(C.card, 0.95);
    texts.forEach((t, i) => t.moveTo([-wd / 2 + 0.29 + t.getWidth() / 2, ht / 2 - 0.15 - (i + 0.5) * lh, 0]));
    boxNow = new M.VGroup(rect, ...texts);
    const maxw = P ? FW - 1.1 : 4.0;
    if (wd > maxw) boxNow.scale(maxw / wd);
    boxNow.moveTo(BOXP);
    return [...old, fadeIn(boxNow)];
  }

  let order = ids.slice();
  const slotX = i => CX + (i - 3.5) * SP;
  const xOf = id => slotX(order.indexOf(id));
  const cardY = BASE - 0.32, rowY = BASE - (P ? 1.03 : 0.91);
  const resultColor = id => amounts[id - 1] === 10 ? C.cyan : C.amber;
  function tag(id, x, y, small = false) {
    const color = resultColor(id);
    const rect = new M.RoundedRectangle({
      width: small ? 0.24 : 0.58, height: small ? 0.25 : 0.45,
      cornerRadius: small ? 0.05 : 0.09, color, strokeWidth: small ? 1 : 2
    });
    rect.setFill(C.card, 0.94);
    rect.moveTo([x, y, 0]);
    return new M.VGroup(rect, label(id, small ? 13 : 19, color, x, y, true));
  }
  function block(id, x, j) {
    const color = resultColor(id);
    const rect = new M.Rectangle({ width: BW, height: 0.8 * PITCH, color, strokeWidth: 1 });
    rect.setFill(color, 0.82);
    rect.moveTo([x, BASE + (j + 0.5) * PITCH, 0]);
    return rect;
  }
  const tags = ids.map(id => tag(id, xOf(id), cardY));
  const stacks = ids.map(id => Array.from({ length: amounts[id - 1] }, (_, j) => block(id, xOf(id), j)));
  const amountLabels = ids.map(id => label(amounts[id - 1], 17, resultColor(id), xOf(id), BASE + 0.34, true));
  const floor = line(slotX(0) - SP / 2, BASE, slotX(7) + SP / 2, BASE);

  function moveBlocks(moves, runTime) {
    return new M.LaggedStart(moves, { lagRatio: 0.018, runTime });
  }
  function share(group, each) {
    const blocks = group.flatMap(id => stacks[id - 1].map(object => ({ id, object })));
    const moves = blocks.map(({ id, object }, i) => {
      const x = xOf(group[Math.floor(i / each)]), j = i % each;
      return new M.Transform(object, block(id, x, j), { runTime: 0.65 });
    });
    return moveBlocks(moves, 1.6);
  }
  function restore(group) {
    return moveBlocks(group.flatMap(id => stacks[id - 1].map((object, j) =>
      new M.Transform(object, block(id, xOf(id), j), { runTime: 0.55 }))), 1.05);
  }
  function rearrange(nextOrder) {
    order = nextOrder;
    return new M.LaggedStart(ids.flatMap(id => [
      new M.Transform(tags[id - 1], tag(id, xOf(id), cardY), { runTime: 0.65 }),
      ...stacks[id - 1].map((object, j) =>
        new M.Transform(object, block(id, xOf(id), j), { runTime: 0.65 }))
    ]), { lagRatio: 0.012, runTime: 1.25 });
  }
  function predictions(group, value) {
    const y = BASE + PITCH * value;
    return new M.VGroup(...group.map(id => {
      const x = xOf(id);
      return new M.DashedLine({
        start: [x - BW / 2 - 0.06, y, 0], end: [x + BW / 2 + 0.13, y, 0],
        color: C.ink, strokeWidth: 2, dashLength: 0.09
      });
    }));
  }
  let numbers = null;
  function row(values, color = C.ink) {
    const anim = numbers ? [fadeOut(numbers)] : [];
    numbers = null;
    const entries = order.filter(id => values[id - 1] != null);
    if (entries.length) {
      numbers = new M.VGroup(...entries.map(id => label(values[id - 1], 17, color, xOf(id), rowY, true)));
      anim.push(fadeIn(numbers));
    }
    return anim;
  }
  const signed = v => v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0';
  const splitPredictions = ids.map(id => yes.includes(id) ? 8 : 4);
  const splitErrors = ids.map((id, i) => amounts[i] - splitPredictions[i]);
  function splitBranch(group, answer, color) {
    const x = group.reduce((sum, id) => sum + xOf(id), 0) / group.length;
    const y = P ? 0.43 : 0.28;
    return new M.VGroup(
      line(CX, P ? 1.42 : 1.25, x, y + 0.22, color),
      label(answer, 17, color, x, y, true)
    );
  }

  const losses = [16, 12, 10, 6, 4, 0];
  const GX = P ? -2.9 : 2.65, GY = P ? -5.95 : -3.15;
  const GW = P ? 5.9 : 4.0, GH = P ? 1.35 : 1.45;
  const curveX = i => GX + GW * i / 5;
  const curveY = loss => GY + GH * loss / 16;
  function lossPoint(i) {
    const x = curveX(i), y = curveY(losses[i]);
    const mark = new M.Dot({ point: [x, y, 0], radius: 0.07, color: C.green });
    const value = label(losses[i], P ? 18 : 17, C.green, x + 0.12, y + 0.24, true);
    const count = label(i, 15, C.muted, x, GY - 0.24);
    const anim = [fadeIn(new M.VGroup(mark, value, count))];
    if (i) {
      anim.push(create(line(curveX(i - 1), curveY(losses[i - 1]), x, y, C.green, 2.5)));
    } else {
      anim.push(create(line(GX - 0.08, GY, GX + GW + 0.13, GY)),
        create(line(GX - 0.08, GY, GX - 0.08, GY + GH + 0.1)),
        fadeIn(label('Mean squared error', 15, C.green, GX + GW - 1.0, GY + GH + 0.2)),
        fadeIn(label('Number of splits', 15, C.muted, GX + GW / 2, GY - 0.55)));
    }
    return anim;
  }

  // 0–10: show the amounts, then share the same 48 blocks.
  const lenderCard = new M.RoundedRectangle({ width: P ? 6.4 : 6.6, height: 3.0, cornerRadius: 0.2, color: C.amber, strokeWidth: 2 });
  lenderCard.setFill(C.card, 0.95);
  lenderCard.moveTo([CX, -0.2, 0]);
  const loanBlocks = Array.from({ length: 10 }, (_, j) => {
    const b = new M.Rectangle({ width: 0.42, height: 0.42, color: C.cyan, strokeWidth: 1 });
    b.setFill(C.cyan, 0.8);
    return b.moveTo([CX + (j - 4.5) * 0.55, -0.95, 0]);
  });
  const lender = new M.VGroup(lenderCard,
    label('New loan application', P ? 27 : 30, C.ink, CX, 0.75, true),
    label('Loan amount: 10 units', 20, C.muted, CX, 0.12),
    ...loanBlocks,
    label('Repaid: ? units', 20, C.amber, CX, -1.4, true)
  );
  await until(S(0));
  await play(fadeIn(lender), ...say('A NEW BORROWER'));
  await until(S(1));
  await play(...say('HOW MUCH WILL THEY REPAY?', C.amber));
  await until(S(2));
  await play(fadeOut(lender), new M.LaggedStart(tags.map(fadeIn), { lagRatio: 0.09, runTime: 1.15 }),
    ...say('8 PAST APPLICATIONS'));
  await until(S(3));
  await play(...say('10 UNITS LENT TO EACH'), ...fbox(['Loan per borrower', ['10 units', C.amber]]));
  await until(S(4));
  await play(new M.LaggedStart(amountLabels.slice(0, 4).map(fadeIn), { lagRatio: 0.16, runTime: 1.35 }),
    ...say('APPLICATIONS 1–4 REPAID 10'));
  await until(S(5));
  await play(new M.LaggedStart(amountLabels.slice(4).map(fadeIn), { lagRatio: 0.16, runTime: 1.35 }),
    ...say('APPLICATIONS 5–8 REPAID 2', C.amber));
  await until(S(6));
  await play(...amountLabels.map(fadeOut), create(floor),
    new M.LaggedStart(stacks.flat().map(fadeIn), { lagRatio: 0.026, runTime: 1.7 }),
    ...say('ONE BLOCK = ONE UNIT'), ...fbox([]));
  await until(S(7));
  await play(...say('ONE PREDICTION FOR ALL EIGHT', C.amber));
  await until(S(8));
  await play(share(ids, 6), ...say('SHARE ALL THE BLOCKS EQUALLY', C.amber));
  await until(S(9));
  await play(...row(ids.map(() => 6), C.amber), ...fbox(['48 blocks ÷ 8', ['= 6 per stack', C.amber]]));
  await until(S(10));
  await play(...say('THE MEAN IS OUR PREDICTION'), ...fbox(['Mean = 48 ÷ 8', ['Predict 6 units', C.amber]]));

  // 11–17: return to actual amounts and compare each with 6.
  const allSix = predictions(ids, 6);
  await until(S(11));
  await play(restore(ids), fadeIn(allSix), ...row([]), ...say('DASHES SHOW THE PREDICTION'),
    ...fbox(['Compare actual with 6']));
  await until(S(12));
  await play(...row(['+4', '+4', '+4', '+4'], C.cyan),
    ...say('PREDICTION IS 4 TOO LOW'), ...fbox(['Actual − prediction', ['10 − 6 = +4', C.cyan]]));
  await until(S(13));
  await play(...row(['+4', '+4', '+4', '+4', '−4', '−4', '−4', '−4']),
    ...say('PREDICTION IS 4 TOO HIGH', C.amber), ...fbox(['10 − 6 = +4', ['2 − 6 = −4', C.amber]]));
  await until(S(14));
  await play(...say('EACH DIFFERENCE IS AN ERROR'), ...fbox(['Prediction error', ['= actual − prediction', C.cyan]]));
  await until(S(15));
  await play(...row(ids.map(() => 16), C.violet), ...say('SQUARE EACH ERROR', C.violet),
    ...fbox(['(+4) × (+4) = 16', ['(−4) × (−4) = 16', C.violet]]));
  await until(S(16));
  await play(...say('AVERAGE THE EIGHT SQUARED ERRORS'), ...fbox(['8 × 16 = 128', ['128 ÷ 8 = 16', C.amber]]));
  await until(S(17));
  await play(...lossPoint(0), ...say('MEAN SQUARED ERROR', C.green),
    ...fbox(['MSE = 16', ['Smaller is closer', C.green]], C.green));

  // 18–33: split on income, share within each branch, then check all eight errors.
  await until(S(18));
  await play(...row([]), fadeOut(allSix), ...say('CAN TWO GROUPS PREDICT BETTER?', C.amber));
  await until(S(19));
  await play(...say('STEADY INCOME?'), ...fbox([]));
  await until(S(20));
  const moveToIncome = rearrange([...yes, ...no]);
  const yesBranch = splitBranch(yes, 'Yes', C.cyan);
  const noBranch = splitBranch(no, 'No', C.violet);
  await play(moveToIncome, fadeIn(yesBranch), ...say('STEADY INCOME: YES'),
    ...fbox(['Applications 2, 3, 4, 5']));
  await until(S(21));
  await play(...row([null, 10, 10, 10, 2], C.cyan), ...fbox(['10 + 10 + 10 + 2', ['= 32 units', C.cyan]]));
  await until(S(22));
  await play(share(yes, 8), ...row([null, 8, 8, 8, 8], C.cyan), ...say('SHARE WITHIN YES'),
    ...fbox(['32 blocks ÷ 4', ['= 8 per stack', C.cyan]]));
  const yesMarks = predictions(yes, 8), noMarks = predictions(no, 4);
  await until(S(23));
  await play(restore(yes), fadeIn(yesMarks), ...row([]), ...say('YES GROUP PREDICTS 8'));
  await until(S(24));
  await play(fadeIn(noBranch), ...say('STEADY INCOME: NO', C.violet), ...fbox(['Applications 1, 6, 7, 8'], C.violet));
  await until(S(25));
  await play(...row([10, null, null, null, null, 2, 2, 2], C.violet),
    ...fbox(['10 + 2 + 2 + 2', ['= 16 units', C.violet]], C.violet));
  await until(S(26));
  await play(share(no, 4), ...row([4, null, null, null, null, 4, 4, 4], C.violet), ...say('SHARE WITHIN NO', C.violet),
    ...fbox(['16 blocks ÷ 4', ['= 4 per stack', C.violet]], C.violet));
  await until(S(27));
  await play(restore(no), fadeIn(noMarks), ...row([]), ...say('NO GROUP PREDICTS 4', C.violet));
  await until(S(28));
  await play(...row(splitErrors.map(e => Math.abs(e) === 2 ? signed(e) : null)),
    ...say('THREE IN EACH GROUP ARE 2 AWAY'), ...fbox(['10 − 8 = +2', '2 − 4 = −2']));
  await until(S(29));
  await play(...row(splitErrors.map(signed)), ...say('ONE IN EACH GROUP IS 6 AWAY', C.amber),
    ...fbox(['App 5: 2 − 8 = −6', 'App 1: 10 − 4 = +6'], C.amber));
  await until(S(30));
  await play(...row(splitErrors.map(e => e ** 2), C.violet), ...say('SQUARE THE ERRORS', C.violet),
    ...fbox(['2 × 2 = 4', ['6 × 6 = 36', C.violet]]));
  await until(S(31));
  await play(...say('SIX 4s AND TWO 36s'), ...fbox(['6 × 4 = 24', '2 × 36 = 72']));
  await until(S(32));
  await play(...fbox(['24 + 72 = 96', ['96 ÷ 8 = 12', C.amber]]));
  await until(S(33));
  await play(...lossPoint(1), ...say('ONE SPLIT: MSE 16 → 12', C.green),
    ...fbox([['Mean squared error = 12', C.green]], C.green));

  // Draw the same groups as a tree. Keep application tags separate so they
  // can travel to their new leaves when a question is added.
  const LY = P ? -3.45 : -2.32;
  const RY = P ? 1.22 : 1.16, MID = P ? 0.04 : 0.30, LOW = P ? -1.22 : -0.65;
  const nodes = {
    root: { x: CX, y: RY, title: ['Steady income?'] },
    Y: { x: CX - 1.8, y: MID, title: ['Savings?'] },
    N: { x: CX + 1.8, y: MID, title: ['Savings?'] },
    YN: { x: CX - 1.2, y: LOW, title: ['Previous loan', 'repaid?'] },
    NY: { x: CX + 1.2, y: LOW, title: ['Previous loan', 'repaid?'] }
  };
  const leafAt = {
    Y: -1.8, N: 1.8, YY: -3, YN: -1.2, NY: 1.2, NN: 3,
    YNY: -1.8, YNN: -0.6, NYY: 0.6, NYN: 1.8
  };
  const groups = [
    { Y: [yes, 8], N: [no, 4] },
    { YY: [[3, 4], 10], YN: [[2, 5], 6], N: [no, 4] },
    { YY: [[3, 4], 10], YNY: [[2], 10], YNN: [[5], 2], N: [no, 4] },
    { YY: [[3, 4], 10], YNY: [[2], 10], YNN: [[5], 2], NY: [[1, 6], 6], NN: [[7, 8], 2] },
    { YY: [[3, 4], 10], YNY: [[2], 10], YNN: [[5], 2], NYY: [[1], 10], NYN: [[6], 2], NN: [[7, 8], 2] }
  ];
  let tree = null, edges, leaves, questions;
  function drawTree(stage, waiting = []) {
    const children = groups[stage];
    const internal = ['root', ...Object.keys(nodes).filter(key => key !== 'root' &&
      Object.keys(children).some(path => path.startsWith(key) && path.length > key.length))];
    const items = [], moves = [];
    edges = {};
    leaves = {};
    questions = {};
    function point(key) {
      return internal.includes(key) ? nodes[key] : { x: CX + leafAt[key], y: LY };
    }
    function edge(path) {
      const parent = path.length === 1 ? 'root' : path.slice(0, -1);
      const a = point(parent), b = point(path), isYes = path.endsWith('Y');
      const color = isYes ? C.cyan : C.violet;
      const from = a.y - 0.22, to = b.y + (internal.includes(path) ? 0.23 : 0.34);
      edges[path] = [a.x, from, b.x, to];
      const t = internal.includes(path) ? 0.49 : 0.76;
      const x = a.x + (b.x - a.x) * t + (b.x < a.x ? -0.19 : 0.19);
      items.push(line(...edges[path], color),
        label(isYes ? 'Yes' : 'No', 15, color, x, from + (to - from) * t + 0.08, true));
    }
    for (const key of [...internal.slice(1), ...Object.keys(children)]) edge(key);
    for (const key of internal) {
      const { x, y, title } = nodes[key];
      questions[key] = new M.VGroup(...title.map((s, i) =>
        label(s, 16, C.ink, x, y + ((title.length - 1) / 2 - i) * 0.24, true)));
      items.push(questions[key]);
    }
    for (const [key, [apps, guess]] of Object.entries(children)) {
      const { x, y } = point(key), color = key.startsWith('Y') ? C.cyan : C.violet;
      const card = new M.RoundedRectangle({ width: 1.13, height: 0.66, cornerRadius: 0.09, color, strokeWidth: 2 });
      card.setFill(C.card, 0.94);
      card.moveTo([x, y, 0]);
      // The leaf names its applications inside the card (no loose tags left on screen).
      leaves[key] = new M.VGroup(card,
        label(waiting.includes(key) ? '?' : guess, 20, color, x, y + 0.13, true),
        label((apps.length > 2 ? '' : 'App ') + apps.join(','), 15, C.ink, x, y - 0.17));
      items.push(leaves[key]);
    }
    const anim = tree ? [fadeOut(tree)] : [];
    tree = new M.VGroup(...items);
    return [...anim, fadeIn(tree), ...moves];
  }

  await until(S(34));
  await play(fadeOut(floor), fadeOut(yesBranch), fadeOut(noBranch), fadeOut(yesMarks), fadeOut(noMarks),
    ...stacks.flat().map(fadeOut), ...tags.map(fadeOut), ...drawTree(0), ...row([]),
    ...say('ASK ABOUT SAVINGS ON THE YES SIDE'), ...fbox(['Steady income = Yes', ['Next question: savings?', C.cyan]]));
  await until(S(35));
  await play(...drawTree(1, ['YN']), ...say('SAVINGS: YES → 10'),
    ...fbox(['Apps 3 and 4', ['(10 + 10) ÷ 2 = 10', C.cyan]]));
  await until(S(36));
  await play(...drawTree(1), ...say('SAVINGS: NO → 6'),
    ...fbox(['Apps 2 and 5', ['(10 + 2) ÷ 2 = 6', C.cyan]]));
  await until(S(37));
  await play(...lossPoint(2), ...say('TWO SPLITS: MSE 12 → 10', C.green),
    ...fbox(['Squared errors total 80', ['80 ÷ 8 = 10', C.green]], C.green));
  await until(S(38));
  await play(...drawTree(2, ['YNY', 'YNN']), ...say('PREVIOUS LOAN REPAID?'),
    ...fbox(['App 2: Yes', 'App 5: No']));
  await until(S(39));
  await play(...drawTree(2), ...say('PREDICT 10 AND 2'),
    ...fbox(['App 2: 10 − 10 = 0', ['App 5: 2 − 2 = 0', C.cyan]]));
  await until(S(40));
  await play(...lossPoint(3), ...say('THREE SPLITS: MSE 10 → 6', C.green),
    ...fbox(['Squared errors total 48', ['48 ÷ 8 = 6', C.green]], C.green));
  await until(S(41));
  await play(...drawTree(3), ...lossPoint(4), ...say('OTHER SIDE: ASK ABOUT SAVINGS', C.violet),
    ...fbox(['Squared errors total 32', ['32 ÷ 8 = 4', C.green]], C.green));
  await play(...drawTree(4), ...lossPoint(5), ...say('OTHER SIDE: ASK ABOUT THE PREVIOUS LOAN', C.violet),
    ...fbox(['Squared errors total 0', ['0 ÷ 8 = 0', C.green]], C.green));

  await until(S(42));
  await play(...say('A TREE THAT PREDICTS AN AMOUNT'), ...fbox(['Regression tree', ['Predicts a number', C.cyan]]));
  await until(S(43));
  await play(new M.LaggedStart(Object.values(leaves).map(leaf => indicate(leaf, C.cyan)),
    { lagRatio: 0.11, runTime: 1.38 }), ...say('EACH FINAL GROUP IS A LEAF'),
    ...fbox(['Each leaf predicts', ['its own mean', C.cyan]]));
  await until(S(44));
  await play(...say('THE PREDICTION RULE'));
  await until(S(45));
  await play(...fbox(['Prediction = leaf total', ['÷ applications in leaf', C.amber]], C.amber));
  await until(S(46));
  await play(...say('A NEW BORROWER', C.amber),
    ...fbox(['Steady income: Yes', 'Savings: No', ['Previous loan: repaid', C.amber]], C.amber));
  await until(S(47));
  const route = ['Y', 'YN', 'YNY'].map(path => line(...edges[path], C.amber, 4));
  await play(create(route[0]), ...say('FOLLOW THE ANSWERS', C.amber));
  await play(create(route[1]));
  await play(create(route[2]));
  await until(S(48));
  await play(indicate(leaves.YNY), ...say('THIS LEAF PREDICTS 10', C.amber),
    ...fbox(['App 2 repaid 10', ['10 ÷ 1 = 10 units', C.amber]], C.amber));
  await until(S(49));
  await play(...say('PREDICT A NUMERICAL AMOUNT'),
    ...fbox(['Repayments', 'Prices', 'Waiting times']));
  await until(S(50));
  await play(...say('THE FIRST YES GROUP PREDICTED 8'),
    ...fbox(['Actual: 10, 10, 10, 2', ['Prediction: 32 ÷ 4 = 8', C.cyan]]));
  await until(S(51));
  await play(...say('A MEAN CAN BE A NEW AMOUNT'),
    ...fbox(['No one repaid 8', ['The group mean was 8', C.cyan]]));
  await until(S(52));
  await play(...route.map(fadeOut), indicate(questions.YN), indicate(questions.NY),
    ...say('PERFECT ON THESE EIGHT APPLICATIONS', C.amber),
    ...fbox(['Historical MSE = 0', ['How will it do on new loans?', C.amber]], C.amber));
  await until(S(53));
  await play(...say('NEXT: REMOVING SOME BRANCHES', C.violet),
    ...fbox(['Can a smaller tree', ['predict new amounts better?', C.violet]], C.violet));
  await until(S(54));
  await play(...say('FOLLOW THE BRANCHES TO A LEAF'),
    ...fbox(['Split into groups', ['Predict the leaf mean', C.cyan]]));
}
