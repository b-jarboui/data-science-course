// 13.2.13 Stacking: learning how to combine predictions.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  // Phone: pill on top, picture/table in the middle, formula box underneath.
  const PILL = P ? [0, 3.6, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -4.6, 0] : [4.5, -0.3, 0];
  const names = ['Steady income', 'Savings', 'Previous loan'];
  const shortNames = ['Income', 'Savings', 'Past loan'];
  const apps = [
    [0, 1, 1, 1], [1, 0, 1, 1], [1, 1, 0, 1], [1, 1, 1, 1],
    [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 0],
  ];
  const folds = [[1, 2, 7, 8], [3, 4, 5, 6]];
  const order = apps.map((_, i) => i + 1);
  const foldOrder = folds.flat();
  const foldOf = id => folds[0].includes(id) ? 1 : 2;
  const actual = id => apps[id - 1][3];
  const votes = apps.map(row => row.slice(0, 3));
  const totals = votes.map(row => row.reduce((sum, vote) => sum + vote, 0));
  const misses = k => order.filter(id => Number(totals[id - 1] >= k) !== actual(id));
  const foldColor = n => n === 1 ? C.cyan : C.violet;
  const outcomeColor = n => n ? C.green : C.pink;
  const outcome = n => n ? 'Full' : 'Partial';
  const say = (text, color = C.cyan) => showA(text, color, PILL);

  function label(text, x, y, size = 19, color = C.ink, mono = false, max = Infinity) {
    const t = T(String(text), size, color, mono);
    const width = t.getWidth();
    if (width > max) t.scale(max / width);
    t.moveTo([x, y, 0]);
    return t;
  }

  function card(x, y, width, height, color = C.line, opacity = 0.94) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.12, color, strokeWidth: 1.6 });
    r.setFill(C.card, opacity);
    r.moveTo([x, y, 0]);
    return r;
  }

  function line(x1, y1, x2, y2, color = C.muted, strokeWidth = 2, Type = M.Line) {
    return new Type({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth });
  }

  let boxNow;
  function fbox(rows, color = C.cyan, y = BOXP[1]) {
    const animations = boxNow ? [new M.FadeOut(boxNow, { runTime: 0.25 })] : [];
    boxNow = null;
    if (!rows) return animations;
    const limit = P ? FW - 0.8 : 4.6;
    const lh = P ? 0.44 : 0.42;
    // One shared scale; widths are tracked here because getWidth() ignores a later scale().
    const texts = rows.map((text, i) => label(text, BOXP[0],
      y + ((rows.length - 1) / 2 - i) * lh, P ? 22 : 21,
      i === rows.length - 1 ? color : C.ink, true));
    const raw = texts.map(t => t.getWidth());
    const k = Math.min(1, (limit - 0.58) / Math.max(...raw));
    if (k < 1) texts.forEach(t => t.scale(k));
    const width = Math.max(...raw) * k + 0.58;
    boxNow = new M.VGroup(card(BOXP[0], y, width, rows.length * lh + 0.28, color), ...texts);
    animations.push(new M.FadeIn(boxNow, { runTime: 0.32 }));
    return animations;
  }

  // Keep unchanged rows on screen when the narration reveals new information.
  const visible = new Map();
  function paint(items) {
    const next = new Map();
    const animations = [];
    const arrivals = [];
    for (const [key, version, build] of items) {
      const old = visible.get(key);
      if (old?.version === version) {
        next.set(key, old);
        continue;
      }
      const object = build();
      next.set(key, { version, object });
      arrivals.push(new M.FadeIn(object, { runTime: 0.3 }));
    }
    for (const [key, item] of visible) {
      if (next.get(key) !== item) animations.push(new M.FadeOut(item.object, { runTime: 0.23 }));
    }
    visible.clear();
    for (const [key, item] of next) visible.set(key, item);
    if (arrivals.length) animations.push(new M.LaggedStart(arrivals, { lagRatio: 0.07, runTime: 0.68 }));
    return animations;
  }

  const panel = build => paint([['panel', build, build]]);

  function applicantCards(showOutcomes) {
    return paint(order.map((id, i) => [`app-${id}`, showOutcomes, () => {
      const x = CX + (i % 4 - 1.5) * 1.63;
      const y = i < 4 ? 0.60 : -0.75;
      const color = showOutcomes ? outcomeColor(actual(id)) : C.cyan;
      return new M.VGroup(card(x, y, 1.49, 0.99, color),
        label(`App ${id}`, x, y + (showOutcomes ? 0.20 : 0), 21),
        ...(showOutcomes ? [label(actual(id) ? '10 · Full' : '2 · Partial', x, y - 0.20, 17, color)] : []));
    }]));
  }

  function stumps({ questions = false, train = [], count = false } = {}) {
    return new M.VGroup(...names.map((name, j) => {
      const x = CX + (j - 1) * 2.22;
      const parts = [
        card(x, -0.54, 2.10, 2.88, C.line),
        label(`Tree ${j + 1}`, x, 0.61, 21, C.cyan),
        label(questions ? name : 'One question', x, 0.15, 19, C.ink, false, 1.9),
      ];
      for (const answer of [0, 1]) {
        const bx = x + (answer ? 0.49 : -0.49);
        const branch = train.filter(id => apps[id - 1][j] === answer);
        const full = branch.filter(actual).length;
        const prediction = Number(full * 2 > branch.length);
        parts.push(line(x, -0.12, bx, -0.60, C.cyan));
        parts.push(card(bx, -0.88, 0.89, 0.53, count ? outcomeColor(prediction) : C.muted));
        parts.push(label(questions ? (answer ? 'Yes' : 'No') : '?', bx, -0.88, 19));
        if (count) {
          parts.push(label(`${full} full`, bx, -1.27, 15, C.green));
          parts.push(label(`${branch.length - full} part`, bx, -1.52, 15, C.pink));
          parts.push(label(`→ ${outcome(prediction)}`, bx, -1.78, 15, outcomeColor(prediction), false, 0.93));
        }
      }
      return new M.VGroup(...parts);
    }));
  }

  function stackDiagram({ people = false, replies = [], top = '', named = false,
    unequal = false, inputs = [], training = false } = {}) {
    const parts = [];
    const boxY = 0.75;
    for (let j = 0; j < 3; j++) {
      const x = CX + (j - 1) * 2.16;
      const target = CX + (j - 1) * 0.69;
      parts.push(line(x, -0.63, target, boxY - 0.42,
        unequal ? [C.violet, C.cyan, C.amber][j] : C.muted,
        unequal ? [1.5, 3.5, 6][j] : 2, M.Arrow));
      if (people) {
        const head = new M.Circle({ radius: 0.14, color: C.cyan });
        head.setFill(C.cyan, 1);
        head.moveTo([x, -0.80, 0]);
        const body = new M.Arc({ radius: 0.24, startAngle: 0, angle: Math.PI, color: C.cyan });
        body.setFill(C.cyan, 1);
        body.moveTo([x, -1.12, 0]);
        parts.push(head, body, label(`Adviser ${j + 1}`, x, -1.48, 18, C.cyan));
      } else {
        parts.push(card(x, -1.0, 1.99, 0.68, C.cyan));
        parts.push(label(named || inputs.length ? shortNames[j] : `Tree ${j + 1}`, x, -1.0, 19));
      }
      if (replies.length) parts.push(label(replies[j], x, -1.82, 22, C.amber, true));
      if (inputs.length) parts.push(label(inputs[j], x, -2.32, 18, C.cyan));
    }
    parts.push(card(CX, boxY, 3.52, 0.80, C.violet));
    parts.push(label(top, CX, boxY, 22, C.violet, false, 3.26));
    if (training) parts.push(label('Fit on applications 1–8', CX, -2.30, 19, C.cyan));
    return new M.VGroup(...parts);
  }

  function twoGroups(shown, namesShown = false) {
    return paint(folds.slice(0, shown).map((ids, i) => [`fold-${i}`, namesShown, () => {
      const y = i === 0 ? 0.48 : -1.16;
      const color = foldColor(i + 1);
      return new M.VGroup(card(CX, y, 6.55, 1.42, color),
        label(`${namesShown ? 'Fold' : 'Group'} ${i + 1}`, CX, y + 0.39, 20, color),
        ...ids.map((id, j) => {
          const x = CX + (j - 1.5) * 1.46;
          return new M.VGroup(card(x, y - 0.23, 1.26, 0.54, outcomeColor(actual(id))),
            label(`App ${id}`, x, y - 0.23, 19));
        }));
    }]));
  }

  const tableY = P ? 2.75 : 1.32;
  const pitch = P ? 0.53 : 0.45;
  // The last (Guess) column sits a little inside so 'Partial' stays within the row on phone.
  const col = [-2.87, -1.99, -1.12, -0.40, 0.32, 1.23, 2.15, P ? 2.84 : 2.98].map(x => x + CX);

  function lossChart(tested, selected) {
    const left = P ? -2.21 : 3.12;
    const right = P ? 2.71 : 5.89;
    const top = P ? -2.35 : -0.78;
    const bottom = P ? -3.55 : -2.33;
    const x = k => left + (right - left) * k / 3;
    const y = n => bottom + (top - bottom) * n / 3;
    const points = tested.map((k, i) => [x(i + 1), y(misses(k).length)]);
    const parts = [label('Mistakes per try', (left + right) / 2, top + 0.34, 19, C.amber)];
    for (let n = 0; n <= 3; n++) {
      parts.push(line(left, y(n), right + 0.15, y(n), n ? C.line : C.muted));
      parts.push(label(n, left - 0.25, y(n), 16, C.ink, true));
    }
    parts.push(line(left, bottom, left, top, C.muted));
    for (let k = 1; k <= 3; k++) parts.push(label(k, x(k), bottom - 0.24, 17, C.ink, true));
    points.forEach(([px, py], i) => {
      if (i) parts.push(line(...points[i - 1], px, py, C.amber, 3));
      parts.push(new M.Dot({ point: [px, py, 0], radius: 0.09, color: tested[i] === selected ? C.green : C.amber }));
    });
    return new M.VGroup(...parts);
  }

  function sheet({ ids = foldOrder, seen = [], revealed = [], provenance = false, active = 0,
    sums = 0, trial = 0, tested = [], selected = 0, marked = [] } = {}) {
    const columns = [
      'App', provenance ? 'Fit on' : 'Fold', 'A', 'B', 'C',
      revealed.length ? 'Actual' : '', sums ? 'Total' : '', trial ? 'Guess' : '',
    ];
    const items = [['headers', columns.join('|'), () => new M.VGroup(
      ...columns.flatMap((name, j) => name ? [label(name, col[j], tableY, 17, C.cyan, false, 0.83)] : []),
    )]];
    ids.forEach((id, i) => {
      const y = tableY - (i + 1) * pitch;
      const fold = foldOf(id);
      const color = marked.includes(id) ? C.pink : fold === active ? C.amber : foldColor(fold);
      const hasVotes = seen.includes(id);
      const hasActual = revealed.includes(id);
      const values = [id, provenance ? 3 - fold : fold,
        ...(hasVotes ? votes[id - 1] : ['', '', '']),
        hasActual ? outcome(actual(id)) : '', sums === 2 ? totals[id - 1] : '',
        trial ? outcome(Number(totals[id - 1] >= trial)) : ''];
      const key = [i, color, sums, ...values].join('|');
      items.push([`row-${id}`, key, () => {
        const parts = [card(CX, y, 6.70, pitch - 0.035, color)];
        values.forEach((v, j) => {
          if (v === '') return;
          const ink = j === 5 ? outcomeColor(actual(id)) : j === 6 ? C.amber :
            j === 7 ? (marked.includes(id) ? C.pink : C.green) : j === 1 ? foldColor(Number(v)) : C.ink;
          parts.push(label(v, col[j], y, P ? 20 : 18, ink, j !== 5 && j !== 7, j === 7 && P ? 0.74 : 0.86));
        });
        if (sums) for (const j of [2, 3]) {
          parts.push(label('+', (col[j] + col[j + 1]) / 2, y, 15, C.muted, true));
        }
        return new M.VGroup(...parts);
      }]);
    });
    if (tested.length) items.push(['loss', `${tested.join(',')}|${selected}`, () => lossChart(tested, selected)]);
    return paint(items);
  }

  // 0–13 Three one-question trees and the reason to fit a combiner.
  await until(S(0)); await play(...panel(() => stumps()), ...say('THREE TREES'));
  await until(S(1)); await play(...applicantCards(false), ...say('EIGHT PAST APPLICATIONS'));
  await until(S(2)); await play(...applicantCards(true), ...say('4 FULL · 4 PARTIAL', C.green));
  await until(S(3)); await play(...panel(() => stumps({ questions: true })), ...say('ONE QUESTION PER TREE'));
  await until(S(4)); await play(...panel(() => stackDiagram({ named: true, replies: ['Partial', 'Full', 'Full'], top: 'Application 1' })),
    ...say('SOME TREES DISAGREE'));
  await until(S(5)); await play(...say('BAGGING: EQUAL VOTES', C.amber), ...fbox(['One vote per tree', '2 full · 1 partial'], C.amber));
  await until(S(6)); await play(...say('CAN WE LEARN THE RULE?', C.violet), ...fbox());
  await until(S(7)); await play(...panel(() => stackDiagram({ people: true, top: 'Fourth person' })), ...say('THREE PEOPLE GIVE ADVICE'));
  await until(S(8)); await play(...panel(() => stackDiagram({ people: true, replies: ['Partial', 'Full', 'Full'], top: 'Learns from past answers' })),
    ...say('WHICH ADVICE WAS RIGHT?', C.violet));
  await until(S(9)); await play(...panel(() => stackDiagram({ replies: ['Partial', 'Full', 'Full'], top: 'Model learns to combine' })),
    ...say('TEACH A MODEL TO COMBINE'));
  await until(S(10)); await play(...say('STACKING', C.violet));
  await until(S(11)); await play(...panel(() => stackDiagram({ top: 'Combiner' })), ...say('THREE BASE MODELS', C.violet));
  await until(S(12)); await play(...say('WHICH PREDICTIONS CAN WE USE?', C.amber));
  await until(S(13));
  await play(...panel(() => new M.VGroup(...['Tree studied it', 'New to the tree'].map((text, i) => {
    const x = CX + (i ? 1.61 : -1.61);
    const color = i ? C.cyan : C.amber;
    return new M.VGroup(card(x, -0.27, 2.99, 1.58, color),
      label(text, x, 0.14, 21, color),
      label(i ? 'Outcome hidden' : 'Outcome seen', x, -0.62, 19));
  }))), ...say('FAMILIAR CARDS CAN LOOK EASIER', C.amber));

  // 14–26 Fit on fold 2 and predict fold 1.
  await until(S(14));
  await play(...panel(() => new M.VGroup(
    card(CX - 1.64, -0.32, 3.04, 1.42, C.cyan), card(CX + 1.64, -0.32, 3.04, 1.42, C.violet),
    label('Group 1', CX - 1.64, -0.32, 22, C.cyan), label('Group 2', CX + 1.64, -0.32, 22, C.violet),
  )), ...say('DIVIDE THE APPLICATIONS'));
  await until(S(15)); await play(...twoGroups(1), ...say('FIRST GROUP'));
  await until(S(16)); await play(...twoGroups(2), ...say('SECOND GROUP', C.violet));
  await until(S(17)); await play(...twoGroups(2, true), ...say('THE TWO GROUPS ARE FOLDS'));
  await until(S(18)); await play(...panel(() => stumps({ questions: true })),
    ...say('BUILD USING FOLD 2 ONLY', C.violet), ...fbox(['Use applications', '3 · 4 · 5 · 6'], C.violet));
  await until(S(19)); await play(...panel(() => stumps({ questions: true, train: folds[1], count: true })),
    ...say('EACH SIDE PICKS ITS MORE COMMON OUTCOME'));
  await until(S(20)); await play(...sheet({ active: 1 }), ...say('PREDICT FOLD 1'),
    ...fbox(['Fit on fold 2', 'Predict fold 1']));
  await until(S(21)); await play(...fbox(['1 = full repayment', '0 = partial repayment'], C.green));
  for (let i = 0; i < folds[0].length; i++) {
    await until(S(22 + i));
    const id = folds[0][i];
    await play(...sheet({ active: 1, seen: folds[0].slice(0, i + 1) }),
      ...say(`APPLICATION ${id}`));
  }
  await until(S(26)); await play(...sheet({ active: 1, seen: folds[0], revealed: folds[0] }),
    ...say('SAVE VOTES AND ACTUAL OUTCOMES'), ...fbox());

  // 27–38 Repeat with exchanged roles and put the joined table in application order.
  await until(S(27)); await play(...sheet({ active: 2, seen: folds[0], revealed: folds[0] }),
    ...say('EXCHANGE THE FOLDS', C.violet), ...fbox(['Fit on fold 1', 'Predict fold 2'], C.violet));
  await until(S(28)); await play(...panel(() => stumps({ questions: true, train: folds[0], count: true })),
    ...say('BUILD FRESH TREES USING FOLD 1'), ...fbox(['Use applications', '1 · 2 · 7 · 8']));
  await until(S(29)); await play(...sheet({ active: 2, seen: folds[0], revealed: folds[0] }),
    ...say('PREDICT FOLD 2', C.violet), ...fbox(['Fit on fold 1', 'Predict fold 2'], C.violet));
  for (let i = 0; i < folds[1].length; i++) {
    await until(S(30 + i));
    const id = folds[1][i];
    await play(...sheet({ active: 2, seen: [...folds[0], ...folds[1].slice(0, i + 1)], revealed: folds[0] }),
      ...say(`APPLICATION ${id}`, C.violet));
  }
  await until(S(34)); await play(...sheet({ seen: order, revealed: order }),
    ...say('EACH ROW COMES FROM THE OTHER FOLD'),
    ...fbox(['Fold 1 rows ← fold 2 trees', 'Fold 2 rows ← fold 1 trees'], C.violet));
  await until(S(35)); await play(...say('OUT-OF-FOLD PREDICTIONS', C.violet));
  await until(S(36)); await play(...sheet({ ids: order, seen: order, revealed: order }),
    ...say('GIVE THE COMBINER VOTES AND OUTCOMES', C.violet), ...fbox());
  await until(S(37)); await play(...sheet({ ids: order, seen: order, revealed: order, sums: 1 }),
    ...say('ADD THE THREE VOTES', C.amber));
  await until(S(38)); await play(...sheet({ ids: order, seen: order, revealed: order, sums: 2 }),
    ...say('TOTAL FOR EACH APPLICATION', C.amber));

  // 39–45 Try all three rules. The curve records each try's training mistakes.
  const combiner = { ids: order, seen: order, revealed: order, sums: 2 };
  const testBoxY = P ? BOXP[1] : 0.85;
  function tried(k, tested, selected = 0) {
    return sheet({ ...combiner, trial: k, tested, selected, marked: misses(k) });
  }
  await until(S(39)); await play(...say('HOW MANY VOTES SHOULD WE REQUIRE?', C.amber));
  await until(S(40)); await play(...sheet({ ...combiner, trial: 1 }),
    ...say('TRY 1 · REQUIRE ONE VOTE', C.amber), ...fbox(['First rule', 'At least 1 vote'], C.amber, testBoxY));
  await until(S(41)); await play(...tried(1, [1]), ...say('MISTAKES ON 5, 6 AND 7', C.pink),
    ...fbox(['At least 1 vote', '3 mistakes out of 8'], C.pink, testBoxY));
  await until(S(42)); await play(...tried(2, [1, 2]), ...say('TRY 2 · REQUIRE TWO VOTES', C.green),
    ...fbox(['At least 2 votes', '0 mistakes out of 8'], C.green, testBoxY));
  await until(S(43)); await play(...tried(3, [1, 2, 3]), ...say('TRY 3 · REQUIRE ALL THREE', C.amber),
    ...fbox(['Mistakes on 1, 2 and 3', '3 mistakes out of 8'], C.pink, testBoxY));
  await until(S(44)); await play(...tried(2, [1, 2, 3], 2), ...say('3, 0, 3 · CHOOSE RULE 2', C.green),
    ...fbox(['Fewest mistakes', 'Rule 2 wins'], C.green, testBoxY));
  await until(S(45)); await play(...say('THE LEARNED RULE', C.green),
    ...fbox(['Full repayment if', 'vote total ≥ 2'], C.green, testBoxY));

  // 46–54 Fit the final base trees, classify one new card, and show the evaluation split.
  await until(S(46)); await play(...panel(() => stackDiagram({ named: true, top: 'Combiner', training: true })),
    ...say('REBUILD THE TREES USING ALL 8'),
    ...fbox(['Keep the combiner rule', 'Vote total ≥ 2'], C.green));
  const borrower = ['Steady income', 'No savings', 'Past loan repaid'];
  await until(S(47)); await play(...panel(() => stackDiagram({ top: 'New application', inputs: borrower })),
    ...say('A NEW BORROWER'));
  await until(S(48)); await play(...panel(() => stackDiagram({ top: 'Combiner', inputs: borrower, replies: [1, 0, 1] })),
    ...say('THE TREES VOTE 1, 0, 1'));
  await until(S(49)); await play(...panel(() => stackDiagram({ top: 'Predict full repayment', inputs: borrower, replies: [1, 0, 1] })),
    ...say('PREDICT FULL REPAYMENT', C.green), ...fbox(['1 + 0 + 1 = 2', '2 votes meets the rule'], C.green));
  await until(S(50)); await play(...say('TREES USE DIFFERENT DETAILS', C.cyan));
  await until(S(51)); await play(...panel(() => stackDiagram({ named: true, top: 'Combiner', unequal: true })),
    ...say('MODELS CAN GET DIFFERENT INFLUENCE', C.violet),
    ...fbox(['Our rule: majority vote', 'Other rules can weigh votes'], C.violet));
  await until(S(52));
  await play(...panel(() => new M.VGroup(
    card(CX - 1.68, -0.34, 3.10, 1.65, C.cyan), card(CX + 1.68, -0.34, 3.10, 1.65, C.violet),
    label('Combiner training', CX - 1.68, 0.10, 21, C.cyan),
    label('1  2  3  4  5  6  7  8', CX - 1.68, -0.32, 17, C.ink, true, 2.76),
    label('0 training mistakes', CX - 1.68, -0.78, 18, C.green),
    label('Separate test cards', CX + 1.68, 0.10, 21, C.violet),
    ...[-0.74, 0, 0.74].map(dx => {
      const x = CX + 1.68 + dx;
      return new M.VGroup(card(x, -0.57, 0.56, 0.59, C.violet), label('?', x, -0.57, 21, C.violet));
    }),
  )), ...say('TEST THE WHOLE MODEL ON SEPARATE CARDS'), ...fbox());
  await until(S(53)); await play(...panel(() => new M.VGroup(
    card(CX - 1.66, -0.22, 3.11, 1.68, C.violet), card(CX + 1.66, -0.22, 3.11, 1.68, C.cyan),
    label('Fit trees on fold 2', CX - 1.66, 0.27, 20, C.violet),
    label('Outcomes visible', CX - 1.66, -0.65, 19),
    label('Predict fold 1', CX + 1.66, 0.27, 20, C.cyan),
    label('Outcomes hidden', CX + 1.66, -0.65, 19, C.amber),
  )), ...say('HIDE EACH PREDICTED CARD’S OUTCOME', C.amber));
  await until(S(54));
  await play(...panel(() => new M.VGroup(
    card(CX, 0.75, 6.6, 0.95, C.cyan),
    label('Fit on fold 2 → Predict fold 1', CX, 0.75, 24, C.cyan, false, 6.2),
    card(CX, -0.4, 6.6, 0.95, C.violet),
    label('Fit on fold 1 → Predict fold 2', CX, -0.4, 24, C.violet, false, 6.2),
    line(CX, -0.9, CX, -1.4, C.muted, 2, M.Arrow),
    card(CX, -1.95, 6.6, 0.95, C.green),
    label('Use both sets of votes to learn the rule', CX, -1.95, 23, C.green, false, 6.2),
  )), ...say('STACKING LEARNS FROM UNSEEN CARDS', C.green));
}
