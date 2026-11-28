// 13.2.10 AdaBoost: learning from earlier mistakes.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  // Phone: pill on top, picture in the middle, formula box underneath.
  const PILL = P ? [0, 3.6, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -4.3, 0] : [4.5, -0.3, 0];
  const pitch = P ? 1.68 : 1.88;
  const cellWidth = pitch - 0.14;
  const questions = ['Steady income', 'Savings', 'Previous repayment', 'Reminders'];
  const actual = [1, 1, 1, 1, -1, -1, -1, -1];
  const predictions = [
    [-1, 1, 1, 1, 1, -1, -1, -1],
    [1, -1, 1, 1, -1, 1, -1, -1],
    [1, 1, -1, 1, -1, -1, 1, -1],
  ];
  const misses = [[0, 4], [1, 5], [2, 6]];
  const weights = [
    Array(8).fill('1/8'),
    ['1/4', '1/12', '1/12', '1/12', '1/4', '1/12', '1/12', '1/12'],
    ['3/20', '1/4', '1/20', '1/20', '3/20', '1/4', '1/20', '1/20'],
    ['1/12', '5/36', '1/4', '1/36', '1/12', '5/36', '1/4', '1/36'],
  ];
  const strength = [1 / 4, 1 / 6, 1 / 10].map(e => Math.log((1 - e) / e) / 2);
  const votes = predictions.map((row, i) => row[0] * strength[i]);
  const score = votes.reduce((sum, vote) => sum + vote, 0);

  const visible = new Map();
  let exit = [], enter = [];
  function remove(key) {
    const old = visible.get(key);
    if (!old) return;
    exit.push(new M.FadeOut(old.object, { runTime: 0.24 }));
    visible.delete(key);
  }

  function place(key, signature, make, transform = false) {
    const old = visible.get(key);
    if (old?.signature === signature) return;
    const object = make();
    if (old && transform) {
      enter.push(new M.Transform(old.object, object, { runTime: 0.55 }));
      old.signature = signature;
      return;
    }
    remove(key);
    visible.set(key, { object, signature });
    enter.push(new M.FadeIn(object, { runTime: 0.4 }));
  }

  function clearPicture() {
    for (const key of visible.keys()) if (key !== 'box') remove(key);
  }

  async function reveal(caption, color = C.cyan) {
    if (exit.length) await play(...exit);
    const tag = caption ? showA(caption, color, PILL, P ? 17 : 18) : [];
    if (enter.length || tag.length) await play(...enter, ...tag);
    exit = [];
    enter = [];
  }

  function label(text, x, y, size, color = C.ink, maxWidth = FW - 1) {
    const item = T(text, size, color, true);
    const width = item.getWidth();
    if (width > maxWidth) item.scale(maxWidth / width);
    item.moveTo([x, y, 0]);
    return item;
  }

  function rect(x, y, width, height, border, fill = C.card, opacity = 0.92) {
    const item = new M.RoundedRectangle({ width, height, cornerRadius: Math.min(0.16, height / 2),
      color: border, strokeWidth: 2 });
    item.setFill(fill, opacity);
    item.moveTo([x, y, 0]);
    return item;
  }

  function line(x1, y1, x2, y2, color = C.muted, strokeWidth = 2) {
    return new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth });
  }

  function fbox(lines, color = C.cyan) {
    place('box', JSON.stringify([lines, color]), () => {
      const size = P ? 19 : 20;
      const lh = P ? 0.32 : 0.43;
      const max = P ? FW - 0.8 : 4.7;
      // One shared scale for all lines; widths are tracked here because getWidth() ignores a later scale().
      const texts = lines.map(row => {
        const [text, ink] = Array.isArray(row) ? row : [row, C.ink];
        return label(text, 0, 0, size, ink, Infinity);
      });
      const raw = texts.map(t => t.getWidth());
      const k = Math.min(1, (max - 0.56) / Math.max(...raw));
      if (k < 1) texts.forEach(t => t.scale(k));
      const width = Math.max(...raw) * k + 0.56;
      const height = lines.length * lh + 0.30;
      const [x, y] = BOXP;
      const border = rect(x, y, width, height, color);
      texts.forEach((t, i) => t.moveTo([x - width / 2 + 0.28 + raw[i] * k / 2,
        y + (texts.length - 1) * lh / 2 - i * lh, 0]));
      return new M.VGroup(border, ...texts);
    });
  }

  const outcome = value => value === 1 ? 'Full' : 'Partial';
  const outcomeColor = value => value === 1 ? C.cyan : C.violet;

  function board({ outcomes = true, fractions = [], numbers = true, round = -1,
    shown = actual.map((_, i) => i), marked = [], accent = C.amber, hide = [] } = {}) {
    actual.forEach((truth, i) => {
      const x = CX + (i % 4 - 1.5) * pitch;
      const y = i < 4 ? (P ? 1.75 : 0.57) : P ? -0.2 : -1.34;
      const prediction = round >= 0 && shown.includes(i) ? predictions[round][i] : null;
      const fraction = fractions[i];
      const selected = marked.includes(i);
      const edge = selected ? accent : C.line;
      const markColor = selected ? accent : C.cyan;
      const background = `card-${i}`;
      const outcomeKey = `outcome-${i}`;
      const predictionKey = `prediction-${i}`;
      const weightKey = `weight-${i}`;
      const barKey = `bar-${i}`;
      // No fill: a replaced card frame is drawn above the outcome and marker, and a fill would hide them.
      place(background, edge, () => new M.VGroup(
        rect(x, y, cellWidth, 1.66, edge, C.card, 0),
        label(`App ${i + 1}`, x, y + 0.54, 18, C.ink, cellWidth - 0.12)));
      if (outcomes) {
        place(outcomeKey, truth, () => label(outcome(truth), x, y + 0.19, 17, outcomeColor(truth), cellWidth - 0.12));
      }
      if (prediction !== null) {
        const right = truth === prediction;
        place(predictionKey, `${prediction}-${right}`, () => label(
          `${outcome(prediction)} ${right ? '✓' : '×'}`, x, y - 0.16, 16, right ? C.green : C.pink, cellWidth - 0.12));
      } else {
        remove(predictionKey);
      }
      if (fraction) {
        const [a, b] = fraction.split('/').map(Number);
        const width = (a / b) * 2.75;
        const left = x - cellWidth / 2 + 0.16;
        place(barKey, `${fraction}-${markColor}`, () => rect(
          left + width / 2, y - 0.50, width, 0.13, markColor, markColor, 0.88), true);
        if (numbers && !hide.includes(i)) {
          place(weightKey, fraction, () => label(fraction, x + 0.42, y - 0.50, P ? 17 : 16, C.ink, 0.66));
        } else {
          remove(weightKey);
        }
      }
    });
  }

  function oneQuestion() {
    place('tree', 'one-question', () => new M.VGroup(
      line(CX - 0.18, -0.32, CX - 1.27, -1.07),
      line(CX + 0.18, -0.32, CX + 1.27, -1.07),
      rect(CX, 0.06, 2.55, 0.65, C.amber),
      label('One question', CX, 0.06, 23, C.amber, 2.33),
      rect(CX - 1.35, -1.40, 1.6, 0.62, C.cyan),
      rect(CX + 1.35, -1.40, 1.6, 0.62, C.violet),
      label('Yes', CX - 1.35, -1.40, 20, C.cyan),
      label('No', CX + 1.35, -1.40, 20, C.violet)));
  }

  function compare(round) {
    const errors = [
      ['1/4', '1/4', '1/4', '1/2'],
      ['1/2', '1/6', '1/6', '1/3'],
      ['3/10', '1/2', '1/10', '2/5'],
    ][round];
    fbox(['Weight of wrong guesses', ...errors.map((e, i) => [
      `${'ABCD'[i]}  ${questions[i]}   ${e}`, e === errors[round] ? C.amber : C.ink,
    ])], C.amber);
  }

  function votePicture(count) {
    place('vote-axis', 'axis', () => new M.VGroup(
      label('App 1', CX, 1.03, 24, C.ink),
      label('Partial ←', CX - 1.28, 0.54, 17, C.violet),
      label('→ Full', CX + 1.28, 0.54, 17, C.cyan),
      line(CX, 0.30, CX, -2.33, C.muted)));
    votes.slice(0, count).forEach((vote, i) => {
      const y = -0.05 - i * 0.60;
      const w = Math.abs(vote) * 1.38;
      const color = vote > 0 ? C.cyan : C.violet;
      // The narration uses 0.81 for tree 2 after the chapter's 0.805 rounding.
      const name = ['−0.55', '+0.81', '+1.10'][i];
      place(`vote-${i}`, name, () => new M.VGroup(
        rect(CX + Math.sign(vote) * w / 2, y, w, 0.24, color, color, 0.88),
        label(`Tree ${i + 1}`, CX - 2.55, y, 16, C.ink, 1.25),
        label(name, CX + 2.55, y, 17, color, 1.25)));
    });
  }

  function combinedBar(correct = false) {
    place('combined', correct, () => new M.VGroup(
      rect(CX + score * 0.69, -1.94, score * 1.38, 0.24, C.green, C.green, 0.88),
      label('Together', CX - 2.55, -1.94, 16, C.ink, 1.25),
      label(correct ? 'Full ✓' : '+1.35', CX + 2.55, -1.94, 17, C.green, 1.25)));
  }

  function chart(values, name, color, count, decimal = false) {
    const x0 = CX - 2.48, x1 = CX + 2.48;
    const y0 = P ? -2.6 : -2.22;
    const y1 = P ? 1.5 : 0.39;
    const ymax = decimal ? 1 : 2;
    const x = i => x0 + (i + (decimal ? 0 : 1)) * (x1 - x0) / 3;
    const y = value => y0 + value / ymax * (y1 - y0);
    place('chart-axis', name, () => new M.VGroup(
      label(name, CX, P ? 2.45 : 1.16, 21, color),
      line(x0, y0, x1 + 0.27, y0), line(x0, y0, x0, y1 + 0.3),
      label('Tree count', CX + 0.4, y0 - 0.51, 15, C.muted),
      ...values.map((_, i) => label(String(i + (decimal ? 0 : 1)), x(i), y0 - 0.24, 15, C.muted))));
    values.slice(0, count).forEach((value, i) => {
      place(`chart-${i}`, value, () => {
        const point = new M.Dot({ point: [x(i), y(value), 0], radius: 0.085, color });
        point.setFill(color, 1);
        const caption = decimal && i > 0 ? value.toFixed(2) : String(value);
        const text = label(caption, x(i), y(value) + 0.31, 18, color);
        return new M.VGroup(...(i ? [line(x(i - 1), y(values[i - 1]), x(i), y(value), color, 3)] : []),
          point, text);
      });
    });
  }

  // The loan records, a one-question tree, and the idea of each application's weight.
  await until(S(0));
  place('opening', 'lender', () => new M.VGroup(
    rect(CX, 0.15, 4.8, 1.45, C.cyan),
    label('Small lender', CX, 0.47, 26, C.cyan, 4.3),
    label('Earlier mistakes → next prediction', CX, -0.18, 19, C.ink, 4.3)));
  await reveal('LEARN FROM EARLIER MISTAKES');

  await until(S(1));
  clearPicture();
  board({ outcomes: false });
  await reveal('8 PAST APPLICATIONS');

  await until(S(2));
  board();
  fbox([['Full repayment   4', C.cyan], ['Partial repayment   4', C.violet]]);
  await reveal('WHAT THE BORROWERS REPAID');

  await until(S(3));
  clearPicture();
  remove('box');
  oneQuestion();
  await reveal('A TREE WITH ONE QUESTION');

  await until(S(4));
  clearPicture();
  board({ round: 0 });
  fbox([['✓ Correct', C.green], ['× Wrong', C.pink]]);
  await reveal('CHECK THE PREDICTIONS');

  await until(S(5));
  board({ round: 0, marked: misses[0], accent: C.pink });
  fbox([['Missed by tree 1', C.pink], 'Give these more attention?']);
  await reveal('TELL THE NEXT TREE WHAT WAS MISSED', C.pink);

  await until(S(6));
  board({ fractions: weights[0], numbers: false });
  fbox(['One marker per application']);
  await reveal('THE MARKER SHOWS ATTENTION');

  await until(S(7));
  board({ fractions: weights[1], numbers: false, marked: misses[0] });
  fbox([['Larger marker', C.amber], 'More influence on the next tree']);
  await reveal('LARGER MARKER, MORE INFLUENCE', C.amber);

  await until(S(8));
  fbox([['Weight', C.amber], 'How much influence an app has']);
  await reveal('THIS INFLUENCE IS ITS WEIGHT', C.amber);

  await until(S(9));
  clearPicture();
  place('sequence', 'build', () => {
    const nodes = [0, 1, 2].map(i => {
      const x = CX + (i - 1) * 2.03;
      return new M.VGroup(rect(x, 0.20, 1.52, 0.62, C.cyan),
        label(`Tree ${i + 1}`, x, 0.20, 20, C.cyan, 1.35),
        label('↑ Missed weights', x, -0.68, 16, C.amber, 1.83));
    });
    return new M.VGroup(...nodes,
      label('→', CX - 1.02, 0.20, 18, C.muted), label('→', CX + 1.02, 0.20, 18, C.muted));
  });
  fbox(['Build a tree', ['Raise missed weights', C.amber], 'Build the next tree']);
  await reveal('REPEAT FOR EACH NEW TREE');

  await until(S(10));
  fbox([['Adaptive boosting', C.cyan], 'AdaBoost']);
  await reveal('ADABOOST');

  await until(S(11));
  fbox([['Adaptive', C.amber], 'Change after each tree', ['Boosting', C.cyan], 'Combine small trees']);
  await reveal('CHANGE THE WEIGHTS, COMBINE THE TREES');

  // Round 1: A ties B and C, then applications 1 and 5 gain weight.
  await until(S(12));
  clearPicture();
  board({ fractions: weights[0] });
  fbox(['8 applications', ['Weight of each = 1/8', C.cyan]]);
  await reveal('START WITH EQUAL WEIGHTS');

  await until(S(13));
  fbox(['8 equal weights', ['8 × 1/8 = 1', C.amber]]);
  await reveal('TOTAL WEIGHT = 1', C.amber);

  await until(S(14));
  compare(0);
  await reveal('TREE 1 LOOKS FOR THE SMALLEST ERROR');

  await until(S(15));
  fbox([['A  Steady income', C.amber], 'A, B and C tie at 1/4', 'Question order  A → B → C → D']);
  await reveal('TREE 1 ASKS ABOUT STEADY INCOME', C.amber);

  await until(S(16));
  board({ fractions: weights[0], round: 0, marked: misses[0], accent: C.pink });
  fbox([['Missed   1 and 5', C.pink], 'Full → Partial', 'Partial → Full']);
  await reveal('TREE 1 MISSES APPS 1 AND 5', C.pink);

  await until(S(17));
  fbox(['App 1      App 5', ['1/8   +    1/8 = 1/4', C.amber]]);
  await reveal('ADD THE TWO WEIGHTS', C.amber);

  await until(S(18));
  fbox([['Weighted error', C.amber], 'Total weight of the mistakes', 'Tree 1 error = 1/4']);
  await reveal('WEIGHTED ERROR', C.amber);

  await until(S(19));
  fbox(['Tree 1 weighted error = 1/4', ['Voting strength ≈ 0.55', C.cyan]]);
  await reveal('TREE 1 GETS ITS VOTING STRENGTH');

  await until(S(20));
  const grow = weights[0].map((w, i) => misses[0].includes(i) ? weights[1][i] : w);
  // Grow the markers before the narration reveals their new values.
  board({ fractions: grow, round: 0, marked: misses[0], hide: misses[0] });
  remove('box');
  await reveal('ENLARGE THE TWO MISSED MARKERS', C.amber);

  await until(S(21));
  board({ fractions: grow, round: 0, marked: misses[0] });
  fbox(['Apps 1 and 5', ['Each  1/8 → 1/4', C.amber]]);
  await reveal('TWO NEW WEIGHTS OF 1/4', C.amber);

  await until(S(22));
  board({ fractions: weights[1], round: 0, marked: misses[0] });
  fbox(['Other six applications', ['Each  1/8 → 1/12', C.cyan]]);
  await reveal('SIX NEW WEIGHTS OF 1/12');

  await until(S(23));
  fbox([['Apps 1 and 5   2 × 1/4 = 1/2', C.amber], 'Other six     6 × 1/12 = 1/2', '1/2 + 1/2 = 1']);
  await reveal('HALF THE WEIGHT ON TWO APPLICATIONS', C.amber);

  // Round 2: B ties C under the new weights.
  await until(S(24));
  board({ fractions: weights[1] });
  compare(1);
  await reveal('TREE 2 COMPARES WITH THE NEW WEIGHTS');

  await until(S(25));
  board({ fractions: weights[1], round: 1, shown: misses[0], marked: misses[0], accent: C.green });
  fbox([['B  Savings', C.cyan], 'B and C tie at 1/6', ['Apps 1 and 5 are now correct', C.green]]);
  await reveal('TREE 2 ASKS ABOUT SAVINGS');

  await until(S(26));
  board({ fractions: weights[1], round: 1, marked: misses[1], accent: C.pink });
  fbox([['Missed   2 and 6', C.pink], 'Full → Partial', 'Partial → Full']);
  await reveal('TREE 2 MISSES APPS 2 AND 6', C.pink);

  await until(S(27));
  fbox(['App 2      App 6', ['1/12  +    1/12 = 1/6', C.amber]]);
  await reveal('ADD THEIR WEIGHTS', C.amber);

  await until(S(28));
  fbox(['Weighted error   1/4 → 1/6', ['Voting strength   0.55 → 0.81', C.cyan]]);
  await reveal('SMALLER ERROR, STRONGER VOTE');

  await until(S(29));
  const grow2 = weights[1].map((w, i) => misses[1].includes(i) ? weights[2][i] : w);
  board({ fractions: grow2, round: 1, marked: misses[1] });
  fbox(['Apps 2 and 6', ['Each  1/12 → 1/4', C.amber]]);
  await reveal('RAISE BOTH MISSED WEIGHTS', C.amber);

  await until(S(30));
  board({ fractions: weights[2], round: 1, marked: misses[1] });
  fbox(['Apps 1 and 5  →  3/20 each', 'Other four   →  1/20 each']);
  await reveal('UPDATE THE SIX CORRECT WEIGHTS');

  // Round 3: C has the smallest error.
  await until(S(31));
  board({ fractions: weights[2] });
  compare(2);
  await reveal('TREE 3 COMPARES THE QUESTIONS AGAIN');

  await until(S(32));
  board({ fractions: weights[2], round: 2, marked: misses[2], accent: C.pink });
  fbox([['C  Previous repayment', C.cyan], ['Missed   3 and 7', C.pink]]);
  await reveal('TREE 3 ASKS ABOUT PREVIOUS REPAYMENT');

  await until(S(33));
  fbox(['App 3      App 7', ['1/20  +    1/20 = 1/10', C.amber]]);
  await reveal('ADD THEIR WEIGHTS', C.amber);

  await until(S(34));
  fbox(['Tree 3 weighted error = 1/10', ['Voting strength ≈ 1.10', C.cyan]]);
  await reveal('TREE 3 HAS THE STRONGEST VOTE');

  await until(S(35));
  board({ fractions: weights[3], round: 2, marked: misses[2] });
  fbox(['Apps 3 and 7', ['Each  1/20 → 1/4', C.amber]]);
  await reveal('RAISE BOTH MISSED WEIGHTS', C.amber);

  // Add the signed votes for application 1, then check all eight applications.
  await until(S(36));
  clearPicture();
  votePicture(0);
  fbox(['Application 1', 'Combine the votes of trees 1, 2 and 3']);
  await reveal('PREDICT REPAYMENT FOR APP 1');

  await until(S(37));
  fbox([['Full      +1', C.cyan], ['Partial   −1', C.violet]]);
  await reveal('GIVE EACH VOTE A SIGN');

  await until(S(38));
  votePicture(1);
  fbox(['Tree 1 votes Partial', ['−1 × strength ≈ −0.55', C.violet]]);
  await reveal('TREE 1 VOTES PARTIAL', C.violet);

  await until(S(39));
  votePicture(2);
  fbox(['Tree 2 votes Full', ['+1 × strength ≈ +0.81', C.cyan]]);
  await reveal('TREE 2 VOTES FULL');

  await until(S(40));
  votePicture(3);
  fbox(['Tree 3 votes Full', ['+1 × strength ≈ +1.10', C.cyan]]);
  await reveal('TREE 3 VOTES FULL');

  await until(S(41));
  const digits = n => `${n < 0 ? '−' : '+'}${Math.abs(n).toFixed(8).slice(0, -1)}…`;
  combinedBar();
  fbox(['Add before rounding', `${digits(votes[0])}  ${digits(votes[1])}`,
    `${digits(votes[2])}  ≈ +1.35`, ['Combined score ≈ +1.35', C.green]]);
  await reveal('ADD THE UNROUNDED VOTES', C.green);

  await until(S(42));
  combinedBar(true);
  fbox([['+1.35 → Full', C.green], 'Recorded outcome   Full', ['Correct prediction ✓', C.green]]);
  await reveal('A POSITIVE SCORE PREDICTS FULL REPAYMENT', C.green);

  await until(S(43));
  clearPicture();
  remove('box');
  const mistakeCounts = [2, 2, 0];
  chart(mistakeCounts, 'Wrong predictions out of 8', C.amber, 1);
  await reveal('CHECK THE COMBINED PREDICTIONS', C.amber);
  for (let count = 2; count <= mistakeCounts.length; count++) {
    await until(S(43) + 1.15 * (count - 1));
    chart(mistakeCounts, 'Wrong predictions out of 8', C.amber, count);
    await reveal();
  }

  await until(S(44));
  clearPicture();
  place('penalty', 'wrong-votes', () => new M.VGroup(
    label('Two wrong predictions', CX, 0.98, 21, C.ink),
    label('Weaker vote', CX - 1.50, 0.34, 16, C.muted),
    label('Stronger vote', CX - 1.50, -0.64, 16, C.muted),
    rect(CX + 0.59, 0.34, 1.18, 0.27, C.pink, C.pink, 0.84),
    rect(CX + 1.19, -0.64, 2.38, 0.27, C.pink, C.pink, 0.84),
    label('Penalty for each mistake', CX + 0.38, -1.45, 16, C.pink)));
  fbox(['Loss = how wrong the votes are', ['Strong wrong vote → big penalty', C.pink]]);
  await reveal('LOSS COUNTS HOW STRONG A WRONG VOTE IS', C.pink);

  await until(S(45));
  clearPicture();
  remove('box');
  const losses = [1, 0.87, 0.65, 0.39];
  chart(losses, 'Exponential loss', C.cyan, 1, true);
  await reveal('WATCH THE LOSS FALL');
  for (let count = 2; count <= losses.length; count++) {
    await until(S(45) + 1.2 * (count - 1));
    chart(losses, 'Exponential loss', C.cyan, count, true);
    await reveal();
  }

  // Put the short formulas beside the pictures.
  await until(S(46));
  fbox(['Update application weights', 'Find each tree’s strength', 'Combine its votes']);
  await reveal('THE RULES AS SHORT FORMULAS');

  await until(S(47));
  clearPicture();
  board({ fractions: weights[1], round: 0, marked: misses[0] });
  fbox([['New missed weight', C.amber], '= old weight ÷ (2 × error)', ['1/8 ÷ (2 × 1/4) = 1/4', C.amber]]);
  await reveal('UPDATE AN APPLICATION THE TREE MISSED', C.amber);

  await until(S(48));
  board({ fractions: weights[1], round: 0, marked: [1, 2, 3, 5, 6, 7], accent: C.green });
  fbox([['New correct weight', C.green], '= old weight ÷ (2 × correct share)', ['1/8 ÷ (2 × 3/4) = 1/12', C.green]]);
  await reveal('UPDATE A CORRECT PREDICTION', C.green);

  await until(S(49));
  clearPicture();
  // A worked picture: multiplying 3 × 3 becomes adding 1.10 + 1.10 after taking ln.
  place('log', 'log', () => {
    const row = (items, y, color) => items.map((s, k) => {
      const x = CX + (k - 2) * (P ? 1.4 : 1.25);
      const isSign = k % 2 === 1;
      return isSign ? label(s, x, y, 26, C.muted)
        : new M.VGroup(rect(x, y, 1.05, 0.7, color), label(s, x, y, 24, color, 0.95));
    });
    return new M.VGroup(
      label('Multiply', CX, 1.15, 20, C.ink),
      ...row(['3', '×', '3', '=', '9'], 0.5, C.ink),
      ...[0, 2, 4].map(k => label('↓ ln', CX + (k - 2) * (P ? 1.4 : 1.25), -0.3, 17, C.violet)),
      ...row(['1.10', '+', '1.10', '=', '2.20'], -1.1, C.violet),
      label('Add', CX, -1.8, 20, C.violet));
  });
  fbox([['Natural logarithm  ln', C.violet], 'ln(a × b) = ln(a) + ln(b)']);
  await reveal('THE NATURAL LOGARITHM', C.violet);

  await until(S(50));
  fbox([['Voting strength', C.cyan], '= ½ × ln(correct share ÷ error)', 'Tree 1  ½ × ln((3/4) ÷ (1/4))', ['≈ 0.55', C.cyan]]);
  await reveal('FIND EACH TREE’S VOTING STRENGTH');

  await until(S(51));
  clearPicture();
  votePicture(3);
  combinedBar();
  fbox([['Combined score', C.green], '= sum of (vote × strength)', 'App 1 score ≈ +1.35']);
  await reveal('ADD THE VOTES WITH THEIR STRENGTHS', C.green);

  await until(S(52));
  clearPicture();
  place('comparison', 'mistake-counts', () => new M.VGroup(
    ...[0, 1, 2].map(i => new M.VGroup(
      label(`Tree ${i + 1}`, CX + (i - 1) * 1.75, 0.66, 19, C.cyan),
      label('2 misses', CX + (i - 1) * 1.75, 0.16, 17, C.pink))),
    rect(CX, -1.04, 3.6, 0.70, C.green),
    label('Together   0 misses', CX, -1.04, 22, C.green, 3.39)));
  remove('box');
  await reveal('SMALL TREES CAN MAKE A STRONGER PREDICTION', C.green);

  await until(S(53));
  clearPicture();
  place('label-error', 'label-error', () => new M.VGroup(
    label('Imagine a wrong record', CX, 0.97, 22, C.ink),
    label('Real: Full   Recorded: Partial ×', CX, 0.49, 20, C.pink),
    ...['Start', 'Missed once', 'Missed again'].map((text, i) => {
      const x = CX + (i - 1) * 1.86;
      const width = [0.40, 0.74, 1.29][i];
      return new M.VGroup(
        rect(x, -0.49, width, 0.24, C.pink, C.pink, 0.85),
        label(text, x, -0.94, 16, C.ink, 1.75));
    })));
  fbox(['If trees keep missing this label,', ['the wrong label gains weight.', C.pink]]);
  await reveal('A WRONG RECORD CAN GAIN WEIGHT', C.pink);

  await until(S(54));
  clearPicture();
  votePicture(3);
  combinedBar(true);
  fbox(['Build the trees in order', ['Raise the weights of missed apps', C.amber], ['Give stronger trees more say', C.green]]);
  await reveal('ADABOOST');
}
