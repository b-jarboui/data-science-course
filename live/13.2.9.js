// 13.2.9 Out-of-bag evaluation. Beat i follows sentence i (zero-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const FULL = C.cyan, PART = '#fb923c', RIGHT = C.green, WRONG = C.pink;
  const CX = P ? 0 : -2.6;
  const SP = P ? 0.76 : 0.91;
  // Phone: pill on top, table in the middle, formula box underneath (uses the full height).
  const PILL = [CX, P ? 3.6 : 1.85, 0];
  const BOXP = P ? [0, -3.95, 0] : [4.30, -0.30, 0];
  const ORIGINAL = P ? 2.4 : 0.82;
  const COMBINED = P ? -1.4 : -1.82;
  const CHECK = P ? -2.15 : -2.43;
  const LABEL_X = CX + (P ? -3.15 : -3.64);
  const APPS = [1, 2, 3, 4, 5, 6, 7, 8];
  const actual = [1, 1, 1, 1, 0, 0, 0, 0];
  const answers = [
    [0, 1, 1, 1, 1, 0, 0, 0],
    [1, 0, 1, 1, 0, 1, 0, 0],
    [1, 1, 0, 1, 0, 0, 1, 0],
  ];
  const draws = [
    [6, 4, 3, 5, 8, 4, 3, 6],
    [1, 7, 1, 2, 3, 3, 7, 3],
    [4, 5, 5, 1, 1, 2, 5, 4],
  ];
  const omitted = draws.map(draw => APPS.filter(id => !draw.includes(id)));
  const col = id => CX + 0.55 + (id - 4.5) * SP;
  const row = tree => P ? 1.0 - 0.72 * tree : -0.06 - 0.55 * tree;
  const p = (x, y) => [x, y, 0];
  const say = (s, color = C.cyan) => showA(s, color, PILL, P ? 17 : 19);

  function label(s, x, y, size = 19, color = C.ink, maxWidth = Infinity) {
    const t = T(s, size, color, true, true);
    if (t.getWidth() > maxWidth) t.scale(maxWidth / t.getWidth());
    return t.moveTo(p(x, y));
  }

  function rect(x, y, width, height, color, fill, opacity = 0.95) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.10, color, strokeWidth: 2 });
    if (fill) r.setFill(fill, opacity);
    return r.moveTo(p(x, y));
  }

  function line(x1, y1, x2, y2, color = C.muted, strokeWidth = 2) {
    return new M.Line({ start: p(x1, y1), end: p(x2, y2), color, strokeWidth });
  }

  function outcome(value, x, y) {
    const color = value ? FULL : PART;
    const shape = value
      ? new M.Circle({ radius: 0.176, color, strokeWidth: 2 })
      : new M.Rectangle({ width: 0.32, height: 0.32, color, strokeWidth: 2 });
    shape.setFill(color, 0.22);
    shape.moveTo(p(x, y));
    const mark = value
      ? [line(x - 0.086, y, x - 0.023, y - 0.060, color, 3),
         line(x - 0.023, y - 0.060, x + 0.091, y + 0.071, color, 3)]
      : [line(x - 0.080, y, x + 0.080, y, color, 3)];
    return new M.VGroup(shape, ...mark);
  }

  function card(id, x, y, color = FULL, height = 0.79) {
    return new M.VGroup(
      rect(x, y, P ? 0.59 : 0.70, height, color, C.card),
      label(String(id), x, y + (height > 0.6 ? 0.18 : 0), 18, color)
    );
  }

  const layers = new Map();
  function replace(key, objects = [], stagger = false) {
    const out = (layers.get(key) || []).map(obj => new M.FadeOut(obj, { runTime: 0.22 }));
    if (objects.length) layers.set(key, objects);
    else layers.delete(key);
    const enter = objects.map(obj => new M.FadeIn(obj, { runTime: 0.26 }));
    const incoming = stagger && enter.length > 1
      ? [new M.LaggedStart(enter, { lagRatio: 0.13, runTime: 0.95 })]
      : enter;
    return [...out, ...incoming];
  }

  function clear(...keys) {
    return keys.flatMap(key => replace(key));
  }

  function clearTable() {
    return clear(...[...layers.keys()].filter(key => key.startsWith('table-')));
  }

  function fbox(lines, color = C.cyan) {
    const [x, y] = BOXP;
    const maxWidth = P ? FW - 1.2 : 4.0;
    const pitch = 0.36;
    const texts = lines.map((entry, i) => {
      const [s, ink] = Array.isArray(entry) ? entry : [entry, C.ink];
      return label(s, x, y + ((lines.length - 1) / 2 - i) * pitch, P ? 22 : 21, ink, maxWidth - 0.56);
    });
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.54;
    return replace('box', [new M.VGroup(
      rect(x, y, width, lines.length * pitch + 0.27, color, C.card), ...texts
    )]);
  }

  function rowLabel(s, y, color = C.muted) {
    return label(s, LABEL_X, y, P ? 16 : 17, color, P ? 1.25 : 1.48);
  }

  function originals(withOutcomes = false) {
    const cards = [rowLabel('Actual', ORIGINAL), ...APPS.map(id => card(id, col(id), ORIGINAL))];
    return [...replace('cards', cards, true), ...(withOutcomes ? revealOutcomes() : [])];
  }

  function revealOutcomes() {
    return replace('truth', actual.map((value, i) => outcome(value, col(i + 1), ORIGINAL - 0.17)), true);
  }

  function outline(ids, color = C.amber) {
    return replace('outline', ids.map(id =>
      rect(col(id), ORIGINAL, P ? 0.68 : 0.79, 0.91, color)
    ));
  }

  function copies(tree) {
    const y = P ? 1.0 : -0.22;
    return replace('copies', [
      rowLabel('Copies', y, C.violet),
      ...draws[tree].map((id, i) => card(id, col(i + 1), y, C.violet, 0.46)),
    ], true);
  }

  function treePicture(x, y, name) {
    return new M.VGroup(
      line(x, y + 0.16, x - 0.58, y - 0.34, C.violet),
      line(x, y + 0.16, x + 0.58, y - 0.34, C.violet),
      label(name, x, y + 0.49, 19, C.violet, 1.8),
      outcome(0, x - 0.58, y - 0.36),
      outcome(1, x + 0.58, y - 0.36)
    );
  }

  function branches() {
    const [x, y] = BOXP;
    return replace('box', [new M.VGroup(
      rect(x, y, 3.72, 1.30, C.violet, C.card),
      line(x, y + 0.44, x - 1.12, y + 0.08, PART),
      line(x, y + 0.44, x + 1.12, y + 0.08, FULL),
      label('No', x - 1.12, y - 0.05, 18, PART),
      label('Yes', x + 1.12, y - 0.05, 18, FULL),
      label('Partial', x - 1.12, y - 0.36, 17, PART),
      label('Full', x + 1.12, y - 0.36, 17, FULL)
    )]);
  }

  function bag() {
    const x = CX - 1.69, y = P ? 0.1 : -1.15;
    return replace('bag', [new M.VGroup(
      rect(x, y - 0.09, 1.76, 1.10, C.violet, C.card),
      line(x - 0.36, y + 0.45, x - 0.58, y + 0.71, C.violet),
      line(x + 0.36, y + 0.45, x + 0.58, y + 0.71, C.violet),
      label('Bag', x, y - 0.08, 22, C.violet)
    )]);
  }

  function bagCopies(count) {
    const x = CX + 0.82, y = P ? -0.02 : -1.27;
    return replace('bag-copies', [
      label('Copied draws', x + 0.42, y + 0.54, 17, C.violet),
      ...Array.from({ length: count }, (_, i) => card(6, x + 0.85 * i, y, C.violet, 0.48)),
    ]);
  }

  function quiz(checked = false) {
    // A student's sheet: practised questions on the left, a new question on the right.
    const y = P ? 0.6 : -0.6, dx = P ? 1.85 : 1.95, w = P ? 3.4 : 3.5;
    return replace('quiz', [
      new M.VGroup(
        rect(CX - dx, y, w, 2.3, C.muted, C.card),
        label('Practised', CX - dx, y + 0.75, 22, C.muted),
        label('Question A  ✓', CX - dx, y + 0.12, 20, C.muted, w - 0.3),
        label('Question B  ✓', CX - dx, y - 0.45, 20, C.muted, w - 0.3)
      ),
      new M.VGroup(
        rect(CX + dx, y, w, 2.3, FULL, C.card),
        label('New question', CX + dx, y + 0.75, 22, FULL, w - 0.3),
        label('Question C', CX + dx, y + 0.12, 20, C.ink, w - 0.3),
        label(checked ? 'Answer: ✓' : 'Answer: ?', CX + dx, y - 0.45, 24, checked ? RIGHT : C.amber, w - 0.3)
      ),
    ]);
  }

  function tableRow(tree) {
    const y = row(tree);
    return replace(`table-tree-${tree}`, [
      rowLabel(`Tree ${tree + 1}`, y, C.violet),
      ...draws[tree].filter((id, i, draw) => draw.indexOf(id) === i)
        .map(id => line(col(id) - 0.092, y, col(id) + 0.092, y, C.muted)),
    ]);
  }

  function vote(tree, id) {
    return replace(`table-vote-${tree}-${id}`, [outcome(answers[tree][id - 1], col(id), row(tree))]);
  }

  function combined(id, through) {
    const eligible = answers.slice(0, through + 1)
      .filter((_, tree) => omitted[tree].includes(id));
    if (!eligible.length) return null;
    const full = eligible.reduce((n, entries) => n + entries[id - 1], 0);
    return Number(2 * full > eligible.length);
  }

  function checkMark(id, correct) {
    return label(correct ? '✓' : '×', col(id), CHECK, 25, correct ? RIGHT : WRONG);
  }

  function result(id, through) {
    const value = combined(id, through);
    if (value === null) return [];
    return [
      ...replace(`table-combined-${id}`, [outcome(value, col(id), COMBINED)]),
      ...replace(`table-check-${id}`, [checkMark(id, value === actual[id - 1])]),
    ];
  }

  function tableLabels() {
    return replace('table-labels', [rowLabel('Combined', COMBINED), rowLabel('Check', CHECK)]);
  }

  function restoreThrough(tree) {
    return [
      ...tableLabels(),
      ...omitted.slice(0, tree + 1).flatMap((ids, t) => [...tableRow(t), ...ids.flatMap(id => vote(t, id))]),
      ...APPS.flatMap(id => result(id, tree)),
    ];
  }

  function comparison(first, second) {
    const w = P ? 5.8 : 6.6, left = CX - w / 2;
    return replace('comparison', [first, second].map(([s, value, color], i) => {
      const y = (P ? 0.48 : 0.48) - 1.31 * i;
      return new M.VGroup(
        label(s, CX, y + 0.50, 22, color, w),
        rect(CX, y, w, 0.42, C.line, C.card),
        ...(value > 0 ? [rect(left + w * value / 2, y, w * value, 0.42, color, color, 0.34)] : [])
      );
    }), true);
  }

  const extraDraws = [
    [4, 5, 5, 6, 7, 8, 4, 6],
    [1, 2, 2, 3, 7, 8, 3, 7],
    [1, 2, 3, 4, 4, 5, 6, 6],
  ];

  function voteCounts() {
    return replace('counts', [draws, [...draws, ...extraDraws]].map((samples, i) => {
      const y = (P ? 1.0 : -0.06) - (P ? 0.8 : 0.66) * i;
      const color = i ? RIGHT : C.violet;
      return new M.VGroup(
        rowLabel(`${samples.length} trees`, y, color),
        ...APPS.map(id => {
          const n = samples.filter(sample => !sample.includes(id)).length;
          return label(String(n), col(id), y, 23, color);
        })
      );
    }), true);
  }

  // The recorded results, then the difference between a draw and an original card.
  await until(S(0)); await play(...replace('trees', [0, 1, 2].map(i =>
    treePicture(CX + (i - 1) * (P ? 2.13 : 2.35), 0.16, `Tree ${i + 1}`)
  ), true), ...say('THREE TREES FROM RANDOM DRAWS'));
  await until(S(1)); await play(...clear('trees'), ...originals(), ...say('EIGHT ORIGINAL APPLICATIONS'));
  await until(S(2)); await play(...revealOutcomes(), ...fbox([['4 full repayments', FULL], ['4 partial repayments', PART]]));
  await until(S(3)); await play(...replace('opening-result', [
    rowLabel('All trees', CHECK),
    ...actual.map((value, i) => outcome(value, col(i + 1), COMBINED)),
    ...APPS.map(id => checkMark(id, true)),
  ], true), ...fbox([['8 of 8 correct', RIGHT]]), ...say('ALL THREE TREES VOTE'));
  await until(S(4)); await play(...clear('opening-result', 'box'), ...replace('new-app', [
    rect(CX, -0.76, 2.12, 1.16, C.amber, C.card),
    label('New borrower', CX, -0.52, 17, C.amber),
    label('?', CX, -0.99, 27, C.amber),
  ]), ...say('WHAT ABOUT A NEW BORROWER?', C.amber));
  await until(S(5)); await play(...clear('new-app'), ...copies(0),
    ...outline(APPS.filter(id => draws[0].includes(id))),
    ...fbox(['Tree 1 studied', 'these applications'], C.amber),
    ...say('TESTING ON PRACTICE CAN LOOK TOO GOOD', C.amber));

  await until(S(6)); await play(...clear('copies', 'outline', 'box'), ...bag(), ...bagCopies(1),
    ...say('DRAW AN APPLICATION FROM THE BAG'));
  await until(S(7)); await play(...bagCopies(2), ...outline([6], C.violet),
    ...fbox(['Return original 6', '6 can be drawn again'], C.violet),
    ...say('RETURN THE ORIGINAL AFTER EACH DRAW', C.violet));
  await until(S(8)); await play(...clear('outline'), ...fbox(['Some originals', 'are never drawn'], C.amber),
    ...say('A DRAW CAN MISS APPLICATIONS', C.amber));
  await until(S(9)); await play(...clear('bag', 'bag-copies', 'box'), ...copies(0),
    ...say('ORIGINALS AND TREE 1 COPIES'));
  await until(S(10)); await play(...fbox([['Missing from the draw', C.amber], '1, 2 and 7'], C.amber),
    ...say('FIND THE MISSING APPLICATIONS', C.amber));
  await until(S(11)); await play(...outline(omitted[0]), ...say('HIGHLIGHT 1, 2 AND 7', C.amber));
  await until(S(12)); await play(...fbox(['Tree 1 learned from', 'the copied cards'], C.violet),
    ...say('TREE 1 HAS NEVER SEEN THESE OUTCOMES', C.amber));
  await until(S(13)); await play(...clear('cards', 'truth', 'copies', 'outline', 'box'), ...quiz(),
    ...say('GIVE A STUDENT A NEW QUESTION'));
  await until(S(14)); await play(...quiz(true), ...say('CHECK THE ANSWER TO THE NEW QUESTION', RIGHT));
  await until(S(15)); await play(...clear('quiz'), ...originals(true), ...copies(0), ...outline(omitted[0]),
    ...say('CHECK THE APPLICATIONS THE TREE MISSED'));
  await until(S(16)); await play(...say('THESE ARE OUT-OF-BAG EXAMPLES', C.amber));
  await until(S(17)); await play(...say('OUT-OF-BAG EVALUATION', C.amber),
    ...fbox(['Test each tree on', 'the cards it missed'], C.amber));

  // Collect eligible votes one tree at a time.
  await until(S(18)); await play(...clear('copies', 'box'), ...tableLabels(), ...say('ADD VOTES ONE TREE AT A TIME'));
  await until(S(19)); await play(...tableRow(0), ...branches(), ...say('TREE 1  ·  STEADY INCOME?', C.violet));
  await until(S(20)); await play(...vote(0, 1), ...fbox(['1: No steady income', ['Vote: partial', PART]], PART));
  await until(S(21)); await play(...result(1, 0), ...fbox([['1 repaid in full', FULL], ['Partial vote is wrong', WRONG]], WRONG));
  await until(S(22)); await play(...vote(0, 2), ...result(2, 0),
    ...fbox(['2: Has steady income', ['Full vote is correct', RIGHT]], RIGHT));
  await until(S(23)); await play(...vote(0, 7), ...result(7, 0),
    ...fbox(['7: No steady income', ['Partial vote is correct', RIGHT]], RIGHT));
  await until(S(24)); await play(...fbox([['2 of 3 correct', RIGHT]]), ...say('TREE 1 RESULTS'));

  await until(S(25)); await play(...clear('outline'), ...tableRow(1), ...branches(),
    ...say('TREE 2  ·  SAVINGS?', C.violet));
  await until(S(26)); await play(...outline(omitted[1]),
    ...fbox([['Tree 2 missed', C.amber], '4, 5, 6 and 8'], C.amber));
  await until(S(27)); await play(...vote(1, 4), ...result(4, 1),
    ...fbox(['4: Has savings', ['Full vote is correct', RIGHT]], RIGHT));
  await until(S(28)); await play(...vote(1, 5), ...result(5, 1),
    ...fbox(['5: No savings', ['Partial vote is correct', RIGHT]], RIGHT));
  await until(S(29)); await play(...vote(1, 6), ...result(6, 1),
    ...fbox(['6: Has savings', ['Full vote is wrong', WRONG]], WRONG));
  await until(S(30)); await play(...vote(1, 8), ...result(8, 1),
    ...fbox(['8: No savings', ['Partial vote is correct', RIGHT]], RIGHT));
  await until(S(31)); await play(...clear('outline'), ...fbox([['5 of 7 correct', RIGHT]]), ...say('RESULTS AFTER TWO TREES'));
  await until(S(32)); await play(...outline([3]),
    ...fbox(['Application 3', ['No out-of-bag votes yet', C.amber]], C.amber));
  await until(S(33)); await play(...fbox(['Leave 3 out', ['Keep the count at 7', C.amber]], C.amber),
    ...say('COUNT ONLY APPLICATIONS WITH A VOTE', C.amber));

  await until(S(34)); await play(...clear('outline'), ...tableRow(2), ...branches(),
    ...say('TREE 3  ·  PREVIOUS LOAN REPAID?', C.violet));
  await until(S(35)); await play(...outline(omitted[2]),
    ...fbox([['Tree 3 missed', C.amber], '3, 6, 7 and 8'], C.amber));
  await until(S(36)); await play(...vote(2, 3), ...result(3, 2),
    ...fbox(['3: Partial vote', ['3 repaid in full', WRONG]], WRONG));
  await until(S(37)); await play(...vote(2, 6),
    ...fbox(['6: Two votes', ['Tree 2: full', FULL], ['Tree 3: partial', PART]], C.violet));
  await until(S(38)); await play(...result(6, 2), ...say('TIE RULE  ·  PREDICT PARTIAL', PART),
    ...fbox(['6: 1 full, 1 partial', ['Partial is correct', RIGHT]], RIGHT));
  await until(S(39)); await play(...vote(2, 7), ...result(7, 2),
    ...fbox(['7: 1 full, 1 partial', ['Partial is correct', RIGHT]], RIGHT));
  await until(S(40)); await play(...vote(2, 8),
    ...fbox(['8: Two partial votes', ['Partial is correct', RIGHT]], RIGHT), ...say('BOTH VOTES AGREE', RIGHT));
  await until(S(41)); await play(...outline(APPS, RIGHT),
    ...fbox([['8 applications', RIGHT], 'with an eligible vote']), ...say('EVERY APPLICATION HAS A VOTE', RIGHT));
  await until(S(42)); await play(...outline([1, 3], WRONG),
    ...fbox([['6 correct', RIGHT], ['Mistakes on 1 and 3', WRONG]]), ...say('CHECK THE COMBINED PREDICTIONS'));
  await until(S(43)); await play(...clear('outline'), ...fbox([['6 ÷ 8 = ¾ = 75%', RIGHT]], RIGHT),
    ...say('DIVIDE CORRECT BY COUNTED'));
  await until(S(44)); await play(...say('ACCURACY  ·  SHARE CORRECT', RIGHT));
  await until(S(45)); await play(...say('75% OUT-OF-BAG ACCURACY', RIGHT));
  await until(S(46)); await play(...fbox(['Out-of-bag accuracy', ['6 ÷ 8 = 75%', RIGHT]], RIGHT),
    ...say('WRITE THE CALCULATION'));
  await until(S(47)); await play(...fbox([
    ['Correct combined predictions', RIGHT],
    '÷',
    'Applications with an eligible vote',
  ]), ...say('THE OUT-OF-BAG ACCURACY FORMULA'));

  // Compare the estimates, then return to the eligible-vote table for the recap.
  await until(S(48)); await play(...clearTable(), ...clear('cards', 'truth', 'box'),
    ...comparison(['All trees vote   100%', 1, C.violet], ['Out-of-bag votes   75%', 0.75, FULL]),
    ...say('WHICH TREES GET TO VOTE?'));
  await until(S(49)); await play(...clear('comparison'), ...originals(true), ...voteCounts(),
    ...fbox(['Out-of-bag votes', 'per application']), ...say('MORE TREES CAN ADD MORE VOTES'));
  await until(S(50)); await play(...outline(APPS, RIGHT),
    ...fbox(['Reuse the original cards', 'as unseen tests'], RIGHT),
    ...say('EACH TREE HAS ITS OWN UNSEEN EXAMPLES', RIGHT));
  await until(S(51)); await play(...clear('cards', 'truth', 'counts', 'outline'),
    ...comparison(['Our draws   6 of 8 = 75%', 6 / 8, FULL], ['Another draw   ? of 8', 0, C.amber]),
    ...fbox(['8 applications, 3 trees', ['A new draw can give', C.amber], ['a very different result', C.amber]], C.amber),
    ...say('A NEW DRAW CAN CHANGE THE ESTIMATE', C.amber));
  await until(S(52)); await play(...clear('comparison'), ...originals(true), ...restoreThrough(1), ...outline([3]),
    ...fbox(['3 has no eligible vote', ['Leave 3 out of the count', C.amber]], C.amber),
    ...say('NO VOTE  ·  LEAVE IT OUT', C.amber));
  await until(S(53)); await play(...clear('outline'), ...tableRow(2),
    ...omitted[2].flatMap(id => [...vote(2, id), ...result(id, 2)]),
    ...fbox(['Only trees that', ['missed the card can vote', RIGHT]], RIGHT),
    ...say('VOTE ONLY ON UNSEEN APPLICATIONS', RIGHT));
}
