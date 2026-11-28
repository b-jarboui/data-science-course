// 13.2.6 Pruning: when a smaller tree is better.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const ROOT = P ? 1.25 : 1.05;
  const SAVINGS = P ? 0.13 : 0.13;
  const PREVIOUS = P ? -1.04 : -0.79;
  const LEAF = P ? -2.29 : -1.77;
  const CARDS = P ? -3.08 : -2.38;
  const PARTIAL = '#ffab6b';
  const POINT = (x, y) => [x, y, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const enter = object => new M.FadeIn(object, { runTime: 0.48 });
  const exit = object => new M.FadeOut(object, { runTime: 0.38 });

  function label(text, x, y, size, color = C.ink, maxWidth = Infinity, bold = false) {
    const object = T(String(text), size, color, true, bold);
    const width = object.getWidth();
    if (width > maxWidth) object.scale(maxWidth / width);
    return object.moveTo(POINT(x, y));
  }

  function panel(x, y, width, height, color, fill = C.card, opacity = 0.94) {
    const object = new M.RoundedRectangle({
      width, height, cornerRadius: Math.min(0.14, height / 3), color, strokeWidth: 2
    });
    object.setFill(fill, opacity);
    return object.moveTo(POINT(x, y));
  }

  function line(x1, y1, x2, y2, color, width = 2, dashed = false) {
    const Type = dashed ? M.DashedLine : M.Line;
    return new Type({ start: POINT(x1, y1), end: POINT(x2, y2), color, strokeWidth: width });
  }

  let formula = null;
  function fbox(lines, color = C.cyan) {
    const maxWidth = P ? FW - 1.2 : 4;
    const rowHeight = P ? 0.34 : 0.38;
    const rows = lines.map((entry, index) => {
      const [text, ink] = Array.isArray(entry) ? entry : [entry, C.ink];
      return label(text, BOXP[0], BOXP[1] + ((lines.length - 1) / 2 - index) * rowHeight,
        P ? 21 : 20, ink, maxWidth - 0.42);
    });
    const width = Math.max(...rows.map(row => row.getWidth())) + 0.42;
    const next = new M.VGroup(panel(BOXP[0], BOXP[1], width, lines.length * rowHeight + 0.24, color), ...rows);
    const animations = formula ? [exit(formula), enter(next)] : [enter(next)];
    formula = next;
    return animations;
  }

  // Card colors and shapes show recorded outcomes. A pink border marks a wrong prediction.
  function card(id, x, y, wrong = false) {
    const full = id <= 4;
    const color = full ? C.cyan : PARTIAL;
    const shape = full
      ? new M.Circle({ radius: 0.082, color, strokeWidth: 1 })
      : new M.Rectangle({ width: 0.16, height: 0.16, color, strokeWidth: 1 });
    shape.setFill(color, 1);
    shape.moveTo(POINT(x, y - 0.13));
    return new M.VGroup(
      panel(x, y, 0.47, 0.54, wrong ? C.pink : color),
      label(id, x, y + 0.09, 18, C.ink, 0.39, true),
      shape,
      label(full ? '✓' : '−', x, y - 0.13, 11, C.bg, 0.16, true)
    );
  }

  const slots = P ? [-3.0, -1.8, -0.6, 0.6, 1.8, 3.0] : [-3.2, -1.92, -0.64, 0.64, 1.92, 3.2];
  function leafCards(ids, x, y, wrongIds = [], pitch = 0.53) {
    return ids.map((id, index) => card(id, x + (index - (ids.length - 1) / 2) * pitch, y, wrongIds.includes(id)));
  }

  // The savings question sends 3 and 4 left on the steady-income side and
  // 7 and 8 right on the other side. Previous repayment separates 2/5 and 1/6.
  const left = CX - 1.92;
  const right = CX + 1.92;
  const fullLeaves = [[3, 4], [2], [5], [1], [6], [7, 8]];

  function tree(pruneYes = false, pruneNo = false, pruneRoot = false, wrongIds = [], focus = []) {
    const edges = [], nodes = [], outcomes = [], data = [], highlights = [];

    function edge(x1, y1, x2, y2, answer) {
      edges.push(line(x1, y1 - 0.19, x2, y2 + 0.19, C.cyan, 2.4));
      const y = y1 + (y2 - y1) * 0.47;
      const x = x1 + (x2 - x1) * 0.47 + (x2 < x1 ? -0.24 : 0.24);
      // A solid background keeps each answer legible where it crosses its own branch.
      edges.push(panel(x, y, 0.56, 0.28, C.line, C.bg, 1), label(answer, x, y, 15, C.ink, 0.5));
    }

    function question(text, x, y, width, key) {
      const color = focus.includes(key) ? C.amber : C.cyan;
      nodes.push(panel(x, y, width, 0.38, color), label(text, x, y, 18, color, width - 0.12, true));
    }

    function terminal(ids, x, full) {
      const color = full ? C.cyan : PARTIAL;
      outcomes.push(panel(x, LEAF, P ? 1.02 : 1.10, 0.33, color), label(full ? 'Full' : 'Partial', x, LEAF, 16, color, 0.94, true));
      const pitch = ids.length === 8 ? 0.66 : 0.53;
      data.push(...leafCards(ids, x, CARDS, wrongIds, pitch));
      if (ids.length === 1 && focus.includes(ids[0])) {
        highlights.push(panel(x, (LEAF + CARDS) / 2 - 0.05, 1.18, LEAF - CARDS + 0.57, C.amber, C.bg, 0));
      }
    }

    if (pruneRoot) {
      terminal([1, 2, 3, 4, 5, 6, 7, 8], CX, false);
      nodes.push(label('One group', CX, PREVIOUS, 22, C.ink, 4));
    } else {
      question('Steady income?', CX, ROOT, 2.16, 'root');
      const side = (x, pruned, start, steady) => {
        const sideKey = steady ? 'yes' : 'no';
        edge(CX, ROOT, x, pruned ? LEAF : SAVINGS, steady ? 'Yes' : 'No');
        if (pruned) {
          terminal(steady ? [2, 3, 4, 5] : [1, 6, 7, 8], x, steady);
          return;
        }

        question('Savings?', x, SAVINGS, 1.58, sideKey);
        const pair = steady ? start : start + 2;
        const first = steady ? start + 1 : start;
        const pairX = CX + slots[pair];
        const x1 = CX + slots[first];
        const x2 = CX + slots[first + 1];
        const previousX = (x1 + x2) / 2;
        edge(x, SAVINGS, pairX, LEAF, steady ? 'Yes' : 'No');
        edge(x, SAVINGS, previousX, PREVIOUS, steady ? 'No' : 'Yes');
        question('Repaid before?', previousX, PREVIOUS, 1.76, sideKey);
        edge(previousX, PREVIOUS, x1, LEAF, 'Yes');
        edge(previousX, PREVIOUS, x2, LEAF, 'No');
        terminal(fullLeaves[pair], pairX, steady);
        terminal(fullLeaves[first], x1, true);
        terminal(fullLeaves[first + 1], x2, false);
      };
      side(left, pruneYes, 0, true);
      side(right, pruneNo, 3, false);
    }

    return new M.VGroup(...edges, ...highlights, ...nodes, ...outcomes, ...data);
  }

  let picture = null;
  function view(next) {
    const animations = picture ? [exit(picture), enter(next)] : [enter(next)];
    picture = next;
    return animations;
  }

  function applications() {
    return new M.VGroup(
      label('Past loan applications', CX, 0.35, 24, C.ink, 6.8, true),
      ...leafCards([1, 2, 3, 4, 5, 6, 7, 8], CX, -0.48, [], 0.73),
      label('✓ Full', CX - 1.46, -1.18, 19, C.cyan, 2.4),
      label('− Partial', CX + 1.46, -1.18, 19, PARTIAL, 2.4)
    );
  }

  function garden(trimmed = false) {
    const parts = [];
    const branch = (x1, y1, x2, y2, width) => parts.push(line(CX + x1, y1, CX + x2, y2, C.green, width));
    branch(0, -2.15, -0.12, -0.68, 10);
    branch(-0.12, -0.68, -1.17, 0.06, 7);
    branch(-0.12, -0.68, 0.93, 0.22, 7);
    branch(-1.17, 0.06, -2.02, 0.51, 4);
    branch(0.93, 0.22, 1.85, 0.71, 4);
    if (!trimmed) {
      branch(-1.17, 0.06, -1.35, 0.86, 4);
      branch(-2.02, 0.51, -2.67, 0.42, 3);
      branch(-2.02, 0.51, -2.34, 1.08, 3);
      branch(0.93, 0.22, 0.68, 1.04, 4);
      branch(1.85, 0.71, 2.31, 1.15, 3);
      branch(1.85, 0.71, 2.68, 0.58, 3);
    }
    return new M.VGroup(...parts);
  }

  let chart = null;
  function history(count, rejected = false) {
    const a = P ? -3.2 : 2.6;
    const b = P ? 3.3 : 6.7;
    const baseline = P ? -6.1 : -3.3;
    const top = P ? -4.0 : -1.6;
    const xp = index => a + 0.36 + index * (b - a - 0.68) / 3;
    const yp = cost => baseline + 0.13 + (cost - 3.2) * (top - baseline - 0.24) / 1.4;
    const values = [3.6, 3.4, 3.2, 4.6];
    const parts = [
      line(a, baseline, b, baseline, C.muted),
      label('Total cost after each step', (a + b) / 2, top + 0.24, 16, C.muted, 3.8)
    ];
    const visible = values.slice(0, rejected ? 4 : count);
    visible.forEach((cost, index) => {
      const rejectedPoint = index === 3;
      const color = rejectedPoint ? C.pink : C.cyan;
      if (index) parts.push(line(xp(index - 1), yp(values[index - 1]), xp(index), yp(cost), color, 2, rejectedPoint));
      parts.push(new M.Dot({ point: POINT(xp(index), yp(cost)), radius: 0.08, color }));
      parts.push(label(cost.toFixed(1), xp(index), yp(cost) + (rejectedPoint ? -0.26 : 0.26), 18, color, 0.7, true));
      parts.push(label(rejectedPoint ? 'Try' : `Step ${index + 1}`, xp(index), baseline - 0.22, 15, C.muted, 0.95));
    });
    const next = new M.VGroup(...parts);
    const animations = chart ? [exit(chart), enter(next)] : [enter(next)];
    chart = next;
    return animations;
  }

  function heldOut() {
    const parts = [];
    const groups = [
      ['Build the tree', [1, 2, 3, 4, 5, 6, 7, 8], 0.45],
      ['Check on different applications', [], -1.17]
    ];
    for (const [title, ids, y] of groups) {
      parts.push(label(title, CX, y + 0.42, 21, C.ink, 6.7, true));
      if (ids.length) {
        parts.push(...leafCards(ids, CX, y - 0.09, [], 0.64));
      } else {
        for (const x of [CX - 0.64, CX, CX + 0.64]) {
          parts.push(panel(x, y - 0.09, 0.47, 0.54, C.violet), label('?', x, y - 0.09, 21, C.violet, 0.39));
        }
      }
    }
    return new M.VGroup(...parts);
  }

  // 0–11: the historical example and the two single-borrower leaves.
  await until(S(0)); await play(...say('A SMALL LENDER'), ...view(new M.VGroup(
    panel(CX, -0.4, P ? 6.6 : 6.6, 3.0, C.violet),
    label('New loan application', CX, 0.55, 28, C.ink, 6.0, true),
    label('Use the tree to predict:', CX, -0.15, 20, C.muted, 6.0),
    label('Full repayment or partial?', CX, -0.65, 22, C.violet, 6.0, true),
    label('?', CX, -1.45, 34, C.amber, 1, true))));
  await until(S(1)); await play(...say('8 PAST APPLICATIONS'), ...view(applications()));
  await until(S(2)); await play(...say('4 FULL REPAYMENTS · 4 PARTIAL', C.amber));
  await until(S(3)); await play(...say('THREE KINDS OF QUESTIONS'), ...view(tree()));
  await until(S(4)); await play(...say('6 FINAL GROUPS = 6 LEAVES'));
  await until(S(5)); await play(...say('8 CORRECT PREDICTIONS', C.green), ...fbox([['0 mistakes', C.green]], C.green));
  await until(S(6)); await play(...say('WILL THIS WORK FOR NEW BORROWERS?', C.violet));
  await until(S(7)); await play(...say('APPLICATIONS 2 AND 5', C.amber), ...view(tree(false, false, false, [], [2, 5])));
  await until(S(8)); await play(...say('JUST ONE BORROWER IN EACH LEAF', C.amber));
  await until(S(9)); await play(...say('SAME PATH, NEW BORROWER', C.violet),
    ...fbox(['New borrower', ['Actual outcome = ?', C.violet]], C.violet));
  await until(S(10)); await play(...say('A CLOSE FIT TO THESE 8', C.amber),
    ...fbox(['Historical cases', ['8 out of 8 correct', C.green]]));
  await until(S(11)); await play(...say('TOO CLOSE A FIT = OVERFITTING', C.violet));

  // 12–21: pruning and the two parts of the cost.
  await until(S(12));
  await play(...say('LIKE A GARDEN TREE', C.green), ...view(garden()), exit(formula));
  formula = null;
  await until(S(13)); await play(...say('KEEP THE USEFUL BRANCHES', C.green), ...view(garden(true)));
  await until(S(14)); await play(...say('REMOVING BRANCHES = PRUNING', C.green), ...view(tree()));
  await until(S(15)); await play(...say('WHICH BRANCHES SHOULD STAY?', C.amber));
  await until(S(16)); await play(...say('TWO PARTS OF THE COST'), ...fbox(['Prediction mistakes', 'Number of leaves']));
  await until(S(17)); await play(...fbox([['Each mistake adds 1', C.amber], 'Number of leaves']));
  await until(S(18)); await play(...fbox(['Each mistake adds 1', ['Each leaf adds 0.6', C.violet]]));
  await until(S(19)); await play(...say('EXTRA COST FOR LEAVES', C.violet),
    ...fbox(['Complexity penalty', ['0.6 per leaf', C.violet]], C.violet));
  await until(S(20)); await play(...say('0.6 FOR THIS EXAMPLE', C.violet));
  await until(S(21)); await play(...say('LOOK FOR A LOWER TOTAL', C.green));

  // 22–31: record the starting cost and test removing the steady-income branch's questions.
  await until(S(22)); await play(...say('START WITH THE COMPLETE TREE'), ...fbox(['0 mistakes', '6 leaves']));
  await until(S(23)); await play(...fbox(['0 + 6 × 0.6', ['Total cost = 3.6', C.amber]], C.amber), ...history(1));
  await until(S(24)); await play(...say('STEADY INCOME · YES', C.amber), ...view(tree(false, false, false, [], ['yes'])));
  await until(S(25)); await play(...say('REPLACE 3 LEAVES WITH 1', C.amber), ...view(tree(true)));
  await until(S(26)); await play(...say('3 OF 4 REPAID IN FULL'), ...fbox(['3 full, 1 partial', ['Predict full', C.cyan]]));
  await until(S(27)); await play(...say('APPLICATION 5 IS INCORRECT', C.pink), ...view(tree(true, false, false, [5])));
  await until(S(28)); await play(...say('COUNT THE LEAVES AND MISTAKES'), ...fbox(['4 leaves', ['1 mistake out of 8', C.pink]]));
  await until(S(29)); await play(...fbox(['1 mistake', ['4 × 0.6 = 2.4 for leaves', C.violet]]));
  await until(S(30)); await play(...fbox(['1 + 2.4', ['Total cost = 3.4', C.amber]], C.amber));
  await until(S(31)); await play(...say('LOWER COST · KEEP THE CHANGE', C.green),
    ...fbox(['3.6 → 3.4', ['Keep 4 leaves', C.green]], C.green), ...history(2));

  // 32–37: test removing the other branch's questions.
  await until(S(32)); await play(...say('STEADY INCOME · NO', C.amber), ...view(tree(true, false, false, [5], ['no'])));
  await until(S(33)); await play(...say('REPLACE 3 LEAVES WITH 1', C.amber), ...view(tree(true, true, false, [5])),
    ...fbox(['1 full, 3 partial', ['Predict partial', PARTIAL]]));
  await until(S(34)); await play(...say('APPLICATION 1 IS INCORRECT', C.pink), ...view(tree(true, true, false, [1, 5])));
  await until(S(35)); await play(...say('COUNT THE LEAVES AND MISTAKES'), ...fbox(['2 leaves', ['2 mistakes out of 8', C.pink]]));
  await until(S(36)); await play(...fbox(['2 mistakes', ['2 × 0.6 = 1.2 for leaves', C.violet]]));
  await until(S(37)); await play(...fbox(['2 + 1.2', ['Total cost = 3.2', C.amber]], C.amber));

  // 38–43: keep the second change, then test and reject the one-leaf tree.
  await until(S(38)); await play(...say('LOWER COST · KEEP THE CHANGE', C.green),
    ...fbox(['3.4 → 3.2', ['Keep 2 leaves', C.green]], C.green), ...history(3));
  await until(S(39)); await play(...say('TRY REMOVING THE LAST QUESTION', C.amber), ...view(tree(true, true, false, [1, 5], ['root'])));
  await until(S(40)); await play(...say('ALL 8 IN ONE GROUP', C.amber), ...view(tree(true, true, true)),
    ...fbox(['4 full, 4 partial', ['The outcomes are tied', C.amber]], C.amber));
  await until(S(41)); await play(...say('TIE RULE · PREDICT PARTIAL', PARTIAL), ...view(tree(true, true, true, [1, 2, 3, 4])),
    ...fbox([['4 mistakes out of 8', C.pink], '1 leaf']));
  await until(S(42)); await play(...fbox(['4 + 0.6', ['Trial cost = 4.6', C.pink]], C.pink), ...history(3, true));
  await until(S(43)); await play(...say('HIGHER COST · KEEP 2 LEAVES', C.green), ...view(tree(true, true, false, [1, 5])),
    ...fbox(['4.6 > 3.2', ['Keep cost 3.2', C.green]], C.green));

  // 44–47: the accepted costs and the general rule.
  await until(S(44)); await play(...say('COST AT EACH KEPT STEP'), ...history(3),
    ...fbox([['3.6 → 3.4 → 3.2', C.green]], C.green));
  await until(S(45)); await play(...say('ONE SHORT FORMULA'));
  await until(S(46)); await play(...fbox([
    'Total cost = mistakes +',
    ['penalty per leaf × leaves', C.violet]
  ]));
  await until(S(47)); await play(...say('COST-COMPLEXITY PRUNING', C.violet));

  // 48–52: useful branches, the penalty choice, and the recap.
  await until(S(48)); await play(...say('KEEP QUESTIONS THAT HELP', C.green));
  await until(S(49)); await play(...say('A LARGE PENALTY CAN CUT TOO MUCH', C.amber),
    ...view(tree(true, true, true, [1, 2, 3, 4])),
    ...fbox([['Only 1 leaf', C.violet], ['4 mistakes out of 8', C.pink]], C.amber));
  await until(S(50));
  await play(...say('WITH 0.4 PER LEAF', C.violet), ...view(tree()), exit(chart),
    ...fbox(['6 leaves: 0 + 2.4 = 2.4', '2 leaves: 2 + 0.8 = 2.8', ['Keep the complete tree', C.green]], C.violet));
  chart = null;
  await until(S(51)); await play(...say('CHECK ON DIFFERENT APPLICATIONS', C.violet), ...view(heldOut()),
    ...fbox(['Compare predictions', ['on examples kept aside', C.violet]], C.violet));
  await until(S(52)); await play(...say('SIZE ALONE DOES NOT DECIDE', C.amber), ...view(tree(true, true, false, [1, 5])),
    ...fbox(['Penalty 0.6 → 2 leaves', 'Penalty 0.4 → 6 leaves']));
  await until(S(53)); await play(...say('PRUNE WHEN TOTAL COST FALLS', C.green),
    ...fbox(['Full tree: 0 + 3.6 = 3.6', 'Pruned:    2 + 1.2 = 3.2', ['At 0.6 per leaf', C.violet]], C.green));
}
