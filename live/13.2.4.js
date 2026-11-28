// 13.2.4 Split impurity. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, E, T, pill, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const CARD_W = 0.70, CARD_H = 0.60, SP = 0.78;
  const ALL = [1, 2, 3, 4, 5, 6, 7, 8];

  // A = steady income, B = savings, C = previous loan repaid, D = reminders.
  const yes = {
    A: [2, 3, 4, 5],
    B: [1, 3, 4, 6],
    C: [1, 2, 4, 7],
    D: [3, 4, 5, 7],
  };
  const group = (name, ids) => ({ name, ids });
  function divide(ids, question, yesLabel, noLabel) {
    return [
      group(yesLabel, ids.filter(id => yes[question].includes(id))),
      group(noLabel, ids.filter(id => !yes[question].includes(id))),
    ];
  }

  const original = [group('All eight applications', ALL)];
  const [aYes, aNo] = divide(ALL, 'A', 'A yes', 'A no');
  const [abYes, abNo] = divide(aYes.ids, 'B', 'A yes · B yes', 'A yes · B no');
  const [abcYes, abcNo] = divide(abNo.ids, 'C', 'A yes · B no · C yes', 'A yes · B no · C no');
  const [nbYes, nbNo] = divide(aNo.ids, 'B', 'A no · B yes', 'A no · B no');
  const [nbcYes, nbcNo] = divide(nbYes.ids, 'C', 'A no · B yes · C yes', 'A no · B yes · C no');
  const stages = [
    original, [aYes, aNo], [abYes, abNo, aNo], [abYes, abcYes, abcNo, aNo],
    [abYes, abcYes, abcNo, nbYes, nbNo], [abYes, abcYes, abcNo, nbcYes, nbcNo, nbNo],
  ];
  const losses = [0.5, 0.375, 0.3125, 0.1875, 0.125, 0];

  function rect(w, h, x, y, stroke = C.line, fill = C.card, opacity = 0.92) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.12, color: stroke, strokeWidth: 2 });
    r.setFill(fill, opacity);
    return r.moveTo([x, y, 0]);
  }
  function label(s, x, y, size = 19, color = C.ink, limit = 6.25, mono = false) {
    const t = T(s, size, color, mono);
    if (t.getWidth() > limit) t.scale(limit / t.getWidth());
    return t.moveTo([x, y, 0]);
  }
  function line(x0, y0, x1, y1, color = C.muted) {
    return new M.Line({ start: [x0, y0, 0], end: [x1, y1, 0], color, strokeWidth: 2 });
  }
  function dot(x, y, color, radius = 0.1) {
    const d = new M.Dot({ point: [x, y, 0], radius, color });
    d.setFill(color, 1);
    return d;
  }
  const outcome = id => id <= 4 ? 'F' : 'P';
  const colorOf = value => value === 'F' ? C.cyan : value === 'P' ? C.pink : C.muted;

  function card(id, x, y, hidden, focus) {
    const value = hidden ? '·' : outcome(id);
    const color = colorOf(value);
    return new M.VGroup(
      rect(CARD_W, CARD_H, x, y, focus ? C.amber : color),
      label(String(id), x, y + 0.12, P ? 18 : 17, C.ink, CARD_W - 0.08, true),
      label(value, x, y - 0.14, 16, color, CARD_W - 0.08, true),
    );
  }

  function board(groups, hidden, focus, legend) {
    const positions = new Map();
    // A group with more than four cards gets its own full-width row, so no card leaves its panel.
    const wide = groups.length === 1 || groups.some(g => g.ids.length > 4);
    const panels = groups.map(({ name, ids }, i) => {
      const x = wide ? CX : CX + (i % 2 ? 1.74 : -1.74);
      const y = 0.68 - 1.13 * (wide ? i : Math.floor(i / 2));
      const w = wide ? Math.max(2.5, ids.length * SP + 0.25) : 3.4;
      ids.forEach((id, j) => positions.set(id, [x + (j - (ids.length - 1) / 2) * SP, y - 0.16]));
      return new M.VGroup(
        // No fill: a new panel is drawn above cards that stay, and a fill would dim them.
        rect(w, 0.98, x, y, C.grid, C.card, 0),
        label(name, x, y + 0.30, 15, C.ink, w - 0.18),
      );
    });
    if (!hidden && legend) panels.push(new M.VGroup(
      label('F = Full repayment', CX - 1.55, -2.48, 17, C.cyan, 2.95),
      label('P = Partial repayment', CX + 1.55, -2.48, 17, C.pink, 2.95),
    ));
    return {
      panels,
      cards: new Map([...positions].map(([id, [x, y]]) => [
        id, { x, y, hidden, focus: focus.includes(id), object: card(id, x, y, hidden, focus.includes(id)) },
      ])),
    };
  }

  function formula(lines, color) {
    const size = P ? 22 : 21;
    const gap = P ? 0.35 : 0.36;
    const width = P ? FW - 1.2 : 4;
    const height = gap * lines.length + 0.24;
    const [x, y] = BOXP;
    return new M.VGroup(
      rect(width, height, x, y, color),
      ...lines.map((row, i) => {
        const [s, c] = Array.isArray(row) ? row : [row, C.ink];
        return label(s, x, y + ((lines.length - 1) / 2 - i) * gap, size, c, width - 0.36, true);
      }),
    );
  }

  function draws(first, second, caption) {
    const y = -0.92;
    return new M.VGroup(
      label('Pick 1', CX - 1.1, y + 0.53, 17),
      label('Pick 2', CX + 1.1, y + 0.53, 17),
      first ? card(first, CX - 1.1, y, false, false) : rect(CARD_W, CARD_H, CX - 1.1, y),
      second ? card(second, CX + 1.1, y, false, false) : rect(CARD_W, CARD_H, CX + 1.1, y),
      label(caption, CX, y - 0.65, 20, C.amber),
    );
  }

  function pairs({ marked = false, probability = false, matchOnly = false } = {}) {
    const combinations = matchOnly ? [['F', 'F']] : [['F', 'F'], ['F', 'P'], ['P', 'F'], ['P', 'P']];
    return new M.VGroup(
      label('Pick 1      Pick 2', CX, 1.09, 18, C.muted, 5.8, true),
      ...combinations.map(([first, second], i) => {
        const x = matchOnly ? CX : CX + (i % 2 ? 1.42 : -1.42);
        const y = 0.29 - 1.21 * Math.floor(i / 2);
        const same = first === second;
        const color = same ? C.green : C.amber;
        return new M.VGroup(
          rect(2.63, 1.04, x, y, marked ? color : C.grid),
          dot(x - 0.65, y + 0.16, colorOf(first)),
          label(first, x - 0.35, y + 0.16, 18, colorOf(first)),
          dot(x + 0.32, y + 0.16, colorOf(second)),
          label(second, x + 0.62, y + 0.16, 18, colorOf(second)),
          label(
            marked ? `${same ? 'Match' : 'Different'}${probability ? (matchOnly ? ' · 1' : ' · 1/4') : ''}` : '',
            x, y - 0.24, 17, color, 2.41,
          ),
        );
      }),
    );
  }

  function comparisons(includeAll) {
    const values = includeAll
      ? [['A · Steady income', '0.125'], ['B · Savings', '0.125'],
        ['C · Previous repayment', '0.125'], ['D · Requested reminders', '0']]
      : [['D · Requested reminders', '0']];
    return new M.VGroup(...values.flatMap(([name, gain], i) => {
      const y = 0.9 - i * 0.66;
      return [
        rect(6.4, 0.55, CX, y),
        label(name, CX - 0.67, y, 18, C.ink, 4.65),
        label(gain, CX + 2.43, y, 18, gain === '0' ? C.muted : C.green, 1.05, true),
      ];
    }));
  }

  function curve(last) {
    const left = P ? -2.95 : 2.75;
    const right = P ? 3.0 : 6.55;
    const base = P ? -5.0 : -3.25;
    const top = P ? -3.2 : -1.75;
    const x = i => left + (right - left) * i / 5;
    const y = v => base + (top - base) * v / 0.5;
    return new M.VGroup(
      label('Weighted impurity', (left + right) / 2, top + 0.30, 17, C.ink, right - left),
      line(left, base, right, base),
      line(left, base, left, top),
      label('0.5', left - 0.32, top, 15, C.muted, 0.60, true),
      label('0', left - 0.27, base, 15, C.muted, 0.46, true),
      ...losses.slice(0, last + 1).flatMap((v, i) => [
        ...(i ? [line(x(i - 1), y(losses[i - 1]), x(i), y(v), C.green)] : []),
        dot(x(i), y(v), i === last ? C.amber : C.green, 0.08),
        label(String(i), x(i), base - 0.26, 15, C.ink, 0.4, true),
        ...(i === last ? [label(String(v), x(i) + (i === 5 ? -0.05 : 0.1), y(v) + 0.27, 16, C.amber, 1.2, true)] : []),
      ]),
      label('Number of splits', (left + right) / 2, base - 0.56, 15, C.muted, 3),
    );
  }

  let headline = null, box = null, graphic = null, trace = null;
  let panels = [], cards = new Map();
  let boardKey = null, boxKey = null, graphicKey = null, traceKey = null;
  let headlineKey = null;

  async function show(text, {
    groups = null, hidden = false, focus = [], legend = true, picture = null, pictureId = null,
    lines = null, step = null, tone = C.cyan,
  } = {}) {
    const remove = [], enter = [], moves = [];
    const fadeIn = object => new M.FadeIn(object, { runTime: 0.36 });
    const fadeOut = object => new M.FadeOut(object, { runTime: 0.22 });
    const nextHeadlineKey = JSON.stringify([text, tone]);
    if (nextHeadlineKey !== headlineKey) {
      if (headline) remove.push(fadeOut(headline));
      headline = pill(text, tone, 19).moveTo(PILL);
      enter.push(fadeIn(headline));
      headlineKey = nextHeadlineKey;
    }
    const nextBoxKey = lines && JSON.stringify([lines, tone]);
    if (nextBoxKey !== boxKey) {
      if (box) remove.push(fadeOut(box));
      box = lines && formula(lines, tone);
      if (box) enter.push(fadeIn(box));
      boxKey = nextBoxKey;
    }
    if (pictureId !== graphicKey) {
      if (graphic) remove.push(fadeOut(graphic));
      graphic = picture && picture();
      if (graphic) enter.push(fadeIn(graphic));
      graphicKey = pictureId;
    }
    if (step !== traceKey) {
      if (trace) remove.push(fadeOut(trace));
      trace = step == null ? null : curve(step);
      if (trace) enter.push(fadeIn(trace));
      traceKey = step;
    }
    const nextBoardKey = groups && JSON.stringify([groups, hidden, focus, legend]);
    if (nextBoardKey !== boardKey) {
      const next = groups ? board(groups, hidden, focus, legend) : { panels: [], cards: new Map() };
      remove.push(...panels.map(fadeOut));
      enter.push(...next.panels.map(fadeIn));
      for (const [id, old] of cards) {
        if (!next.cards.has(id)) remove.push(fadeOut(old.object));
      }
      for (const [id, target] of next.cards) {
        const old = cards.get(id);
        if (!old) {
          moves.push(fadeIn(target.object));
          continue;
        }
        // Cross-fade (a Transform left the moved cards dim): the old card goes, the new one appears in its place.
        if (old.x !== target.x || old.y !== target.y || old.hidden !== target.hidden || old.focus !== target.focus) {
          remove.push(fadeOut(old.object));
          moves.push(fadeIn(target.object));
        } else {
          target.object = old.object;
        }
      }
      panels = next.panels;
      cards = next.cards;
      boardKey = nextBoardKey;
    }
    if (remove.length) await play(...remove);
    if (moves.length) enter.push(new M.LaggedStart(moves, { lagRatio: 0.06, runTime: 0.7 }));
    if (enter.length) await play(...enter);
  }

  // 0–10. Use the original cards to make the two picks with replacement.
  await until(S(0));
  await show('8 PAST LOAN APPLICATIONS', { groups: original, hidden: true });
  await until(S(1));
  await show('4 FULL · 4 PARTIAL', { groups: original });
  await until(S(2));
  await show('ONE GROUP OF EIGHT', { groups: original, focus: ALL });
  await until(S(3));
  await show('WHICH QUESTION SEPARATES THEM?', { groups: original, tone: C.amber });
  await until(S(4));
  await show('ENTROPY MEASURES UNCERTAINTY', { groups: original, tone: C.violet });
  await until(S(5));
  await show('HOW MIXED ARE THE OUTCOMES?', { groups: original, tone: C.violet });
  await until(S(6));
  await show('PICK ONE CARD', { groups: [group('Seven cards on the table', [2, 3, 4, 5, 6, 7, 8])],
    picture: () => draws(1, null, ''), pictureId: 'first' });
  await until(S(7));
  await show('FULL REPAYMENT · RETURN CARD 1', { groups: original, focus: [1],
    picture: () => draws(null, null, 'Pick 1 showed full repayment'), pictureId: 'returned' });
  await until(S(8));
  await show('MIX AGAIN · PICK A SECOND CARD', { groups: [group('Seven cards on the table', [3, 8, 1, 6, 2, 7, 4])],
    picture: () => draws(1, 5, ''), pictureId: 'second' });
  await until(S(9));
  await show('WILL THE PICKS DIFFER?', { groups: [group('Seven cards on the table', [3, 8, 1, 6, 2, 7, 4])],
    picture: () => draws(1, 5, 'Full and partial are different'), pictureId: 'different', tone: C.amber });
  await until(S(10));
  await show('SAME CHANCES ON EITHER PICK', { groups: original, lines: ['Full: 4/8', 'Partial: 4/8'] });

  // 11–20. Four equally likely pairs, then a group with only full repayments.
  await until(S(11));
  await show('FOUR POSSIBLE OUTCOME PAIRS', { picture: () => pairs(), pictureId: 'pairs' });
  await until(S(12));
  await show('TWO MATCH · TWO DIFFER', { picture: () => pairs({ marked: true }), pictureId: 'marked' });
  await until(S(13));
  await show('CHANCE OF DIFFERENT OUTCOMES', { picture: () => pairs({ marked: true, probability: true }),
    pictureId: 'quarters', lines: ['1/4 + 1/4 = 1/2'], tone: C.amber });
  const pure = [group('Applications 3 and 4', [3, 4])];
  await until(S(14));
  await show('BOTH REPAID IN FULL', { groups: pure, focus: [3, 4] });
  await until(S(15));
  await show('EVERY PAIR MATCHES', { picture: () => pairs({ marked: true, matchOnly: true }), pictureId: 'match' });
  await until(S(16));
  await show('CHANCE OF DIFFERENT OUTCOMES', { picture: () => pairs({ marked: true, matchOnly: true, probability: true }),
    pictureId: 'certain', lines: ['Chance of different outcomes = 0'], tone: C.green });
  await until(S(17));
  await show('GINI IMPURITY', { groups: pure, lines: ['Chance of different outcomes'] });
  await until(S(18));
  await show('IMPURITY MEASURES THE MIX', { groups: original, lines: ['Full and partial repayments'] });
  await until(S(19));
  await show('THE OUTCOMES WE RECORDED', { groups: original, lines: ['Impurity = mixed outcomes', 'Not a judgement of people'], tone: C.muted });
  await until(S(20));
  await show('GINI IMPURITY FOR ALL EIGHT', { groups: original });

  // 21–26. Count matching pairs first and take the complement.
  await until(S(21));
  await show('PICK ONE FULL REPAYMENT', { groups: original, focus: [1, 2, 3, 4], lines: ['Full: 4/8 = 1/2'] });
  await until(S(22));
  await show('TWO FULL REPAYMENTS', { picture: () => pairs({ marked: true, probability: true }), pictureId: 'quarters',
    lines: ['Full × full', '1/2 × 1/2 = 1/4'] });
  await until(S(23));
  await show('TWO PARTIAL REPAYMENTS', { picture: () => pairs({ marked: true, probability: true }), pictureId: 'quarters',
    lines: ['Partial × partial', '1/2 × 1/2 = 1/4'] });
  await until(S(24));
  await show('ADD THE TWO MATCHES', { picture: () => pairs({ marked: true, probability: true }), pictureId: 'quarters',
    lines: ['Both outcomes match', '1/4 + 1/4 = 1/2'], tone: C.green });
  await until(S(25));
  await show('SUBTRACT THE MATCHES FROM ONE', { picture: () => pairs({ marked: true, probability: true }), pictureId: 'quarters',
    lines: ['Outcomes differ', '1 − 1/2 = 1/2'], tone: C.amber });
  await until(S(26));
  await show('ORIGINAL GINI IMPURITY', { groups: original, lines: ['1/2 = 0.5'], tone: C.amber });

  // 27–39. Sort on A and compute the weighted result.
  await until(S(27));
  await show('A · STEADY INCOME?', { groups: stages[1], tone: C.amber });
  await until(S(28));
  await show('A YES · 3 FULL, 1 PARTIAL', { groups: stages[1], focus: aYes.ids });
  await until(S(29));
  await show('PROBABILITIES IN A YES', { groups: stages[1], focus: aYes.ids, lines: ['Full: 3/4', 'Partial: 1/4'] });
  await until(S(30));
  await show('A YES · TWO FULL', { groups: stages[1], focus: [2, 3, 4], lines: ['3/4 × 3/4 = 9/16'] });
  await until(S(31));
  await show('A YES · TWO PARTIAL', { groups: stages[1], focus: [5], lines: ['1/4 × 1/4 = 1/16'] });
  await until(S(32));
  await show('A YES · TWO MATCHES ADDED', { groups: stages[1], focus: aYes.ids,
    lines: ['9/16 + 1/16 = 10/16'], tone: C.green });
  await until(S(33));
  await show('A YES · CHANCE OF DIFFERENT', { groups: stages[1], focus: aYes.ids,
    lines: ['1 − 10/16 = 6/16'], tone: C.amber });
  await until(S(34));
  await show('A YES · GINI IMPURITY', { groups: stages[1], focus: aYes.ids,
    lines: ['6/16 = 0.375'], tone: C.amber });
  await until(S(35));
  await show('A NO · 1 FULL, 3 PARTIAL', { groups: stages[1], focus: aNo.ids,
    lines: ['Full: 1/4   Partial: 3/4', 'Gini impurity = 0.375'] });
  await until(S(36));
  await show('EACH GROUP HAS HALF THE CARDS', { groups: stages[1], lines: ['A yes: 4/8 = 1/2', ' A no: 4/8 = 1/2'] });
  await until(S(37));
  await show('WEIGHTED IMPURITY AFTER A', { groups: stages[1],
    lines: ['1/2 × 0.375 + 1/2 × 0.375', '= 0.375'], tone: C.green });
  await until(S(38));
  await show('IMPURITY FALLS AFTER THE SPLIT', { groups: stages[1], step: 1, lines: ['0.5 → 0.375'], tone: C.green });
  await until(S(39));
  await show('IMPURITY REDUCTION', { groups: stages[1], step: 1, lines: ['0.5 − 0.375 = 0.125'], tone: C.amber });

  // 40–47. Compare questions and grow the tree in the chapter's order.
  await until(S(40));
  await show('D · REQUESTED REMINDERS?', { groups: divide(ALL, 'D', 'D yes · 2 full, 2 partial', 'D no · 2 full, 2 partial'),
    lines: ['Both groups: 0.5', 'Reduction: 0.5 − 0.5 = 0'] });
  await until(S(41));
  await show('IMPURITY REDUCTION BY QUESTION', { picture: () => comparisons(true), pictureId: 'gains',
    lines: ['A, B and C each reduce by 0.125'] });
  await until(S(42));
  await show('A COMES FIRST IN A TIE', { groups: stages[1], step: 1, lines: ['Order: A, B, C, D', 'Choose A · Steady income'], tone: C.green });
  await until(S(43));
  await show('A YES · ASK B ABOUT SAVINGS', { groups: stages[2], focus: [2, 3, 4, 5], step: 2,
    lines: ['3, 4: both full', '2, 5: full and partial', 'Reduction = 0.0625'], tone: C.amber });
  await until(S(44));
  await show('WEIGHTED IMPURITY AFTER SPLIT 2', { groups: stages[2], step: 2,
    lines: ['0.375 − 0.0625 = 0.3125'], tone: C.green });
  await until(S(45));
  await show('ASK C · PREVIOUS LOAN REPAID?', { groups: stages[3], focus: [2, 5], step: 3,
    lines: ['2: yes · full', '5: no · partial', 'Reduction = 0.125'], tone: C.amber });
  await until(S(46));
  await show('WEIGHTED IMPURITY AFTER SPLIT 3', { groups: stages[3], step: 3,
    lines: ['0.3125 − 0.125 = 0.1875'], tone: C.green });
  await until(S(47));
  await show('A NO · ASK B ABOUT SAVINGS', { groups: stages[4], focus: [1, 6, 7, 8], step: 4,
    lines: ['0.1875 − 0.0625 = 0.125'], tone: C.green });
  await until(S(47) + (E(47) - S(47)) / 2);
  await show('A NO, B YES · ASK C', { groups: stages[5], focus: [1, 6], step: 5,
    lines: ['0.125 − 0.125 = 0'], tone: C.green });

  // 48–54. Name the two calculations, then show the limits.
  await until(S(48));
  await show('TWO SHORT FORMULAS', { groups: stages[1], lines: ['Gini impurity', 'Impurity reduction'] });
  await until(S(49));
  await show('GINI IMPURITY WITHIN A GROUP', { groups: stages[1], focus: aYes.ids,
    lines: ['1 − (p(full)² + p(partial)²)', '1 − ((3/4)² + (1/4)²)', '= 0.375'] });
  await until(S(50));
  await show('IMPURITY REDUCTION FROM A SPLIT', { groups: stages[1],
    lines: ['Original − weighted impurity', '0.5 − 0.375 = 0.125'], tone: C.amber });
  await until(S(51));
  await show('CHOOSE THE GREATEST REDUCTION', { picture: () => comparisons(true), pictureId: 'gains',
    lines: ['Compare the available questions', 'Repeat for each mixed group'], tone: C.green });
  await until(S(52));
  await show('THE SIZE OF EACH GROUP MATTERS', { groups: [
    group('1 card · all full', [1]), group('7 cards · still mixed', [2, 3, 4, 5, 6, 7, 8]),
  ].map(g => g.ids.length === 7 ? group('4 partial, 3 full', g.ids) : g),
    lines: ['1/8 of cards: Gini = 0', '7/8 of cards: Gini ≈ 0.49', 'Weighted impurity ≈ 0.43'], tone: C.amber });
  await until(S(53));
  await show('PAST OUTCOMES AND A NEW LOAN', { groups: stages[5], step: 5,
    lines: ['Past applications: Gini = 0', 'New application: outcome ?'], tone: C.amber });
  await until(S(54));
  await show('MEASURE THE MIX · THEN REDUCE IT', { groups: stages[5], step: 5,
    lines: ['Gini impurity measures the mix', 'A good split makes it smaller'], tone: C.green });
}
