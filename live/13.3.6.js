// 13.3.6 Weak supervision: learning from imperfect rules.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, pill, until, play: playAnimations } = L;
  const PLASTIC = '#60a5fa', METAL = '#fb923c';
  const rules = [
    { clue: 'Magnet', condition: 'Magnet sticks', material: 'Metal' },
    { clue: 'Bends', condition: 'Bends easily', material: 'Plastic' },
    { clue: 'Shine', condition: 'Metallic shine', material: 'Metal' },
  ];
  const observations = [
    [false, true, false],
    [true, false, false],
    [false, true, true],
    [true, false, true],
    [false, false, true],
  ];
  const votes = observations.map(row => row.map((yes, j) => yes ? rules[j].material : null));
  const counts = votes.map(row => {
    const metal = row.filter(vote => vote === 'Metal').length;
    const plastic = row.filter(vote => vote === 'Plastic').length;
    const label = metal === plastic ? null : metal > plastic ? 'Metal' : 'Plastic';
    return { metal, plastic, label };
  });

  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 2.25, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.6, 0] : [4.3, -0.3, 0];
  const HEAD_Y = P ? 1.3 : 1.16;
  const FIRST_Y = P ? 0.3 : 0.5;
  const PITCH = P ? 1.3 : 0.74;
  const columns = [-2.91, -1.77, -0.72, 0.32, 1.62, 3.04];
  const x = j => CX + columns[j];
  const y = i => FIRST_Y - i * PITCH;
  const materialColor = value => value === 'Metal' ? METAL : value === 'Plastic' ? PLASTIC : C.muted;
  const enter = object => new M.FadeIn(object, { runTime: 0.28 });
  const leave = object => new M.FadeOut(object, { runTime: 0.2 });
  const reveal = objects => objects.map(enter);
  const hide = objects => objects.map(leave);
  const mark = object => new M.Indicate(object, { color: C.amber, scaleFactor: 1.03, runTime: 0.55 });

  function text(s, px, py, color = C.ink, size = 20, maxWidth = Infinity) {
    const t = T(s, size, color, true, true);
    const width = t.getWidth();
    if (width > maxWidth) t.scale(maxWidth / width);
    return t.moveTo([px, py, 0]);
  }

  function rect(px, py, width, height, color, fill = C.card, opacity = 0) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.08, color, strokeWidth: 1.6 });
    r.setFill(fill, opacity);
    return r.moveTo([px, py, 0]);
  }

  function line(x1, y1, x2, y2, color, strokeWidth = 1.6) {
    return new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth });
  }

  function circle(px, py, radius, color) {
    const c = new M.Circle({ radius, color, strokeWidth: 1.5 });
    c.setFill(color, 0.75);
    return c.moveTo([px, py, 0]);
  }

  // Finish removing the old pill or formula box before showing its replacement.
  let pillNow = null, boxNow = null;
  const outgoing = [];
  function swap(previous, next) {
    if (previous) outgoing.push(leave(previous));
    return enter(next);
  }

  async function play(...animations) {
    if (outgoing.length) await playAnimations(...outgoing.splice(0));
    await playAnimations(...animations);
  }

  function say(s, color = C.cyan) {
    const next = pill(s, color, P ? 19 : 18);
    const maxWidth = P ? FW - 1.2 : 6.7;
    const width = next.getWidth();
    if (width > maxWidth) next.scale(maxWidth / width);
    next.moveTo(PILL);
    const animation = swap(pillNow, next);
    pillNow = next;
    return animation;
  }

  function fbox(rows, color = C.cyan) {
    const [bx, by] = BOXP;
    const lh = P ? 0.36 : 0.42;
    const maxWidth = (P ? FW - 1.2 : 5.0) - 0.52;
    const texts = rows.map((row, i) => {
      const [s, ink] = Array.isArray(row) ? row : [row, C.ink];
      return text(s, bx, by + (rows.length / 2 - i - 0.5) * lh, ink, P ? 21 : 19, maxWidth);
    });
    const width = Math.max(...texts.map(t => Math.min(t.getWidth(), maxWidth))) + 0.52;
    const height = rows.length * lh + (P ? 0.3 : 0.38);
    const next = new M.VGroup(rect(bx, by, width, height, color, C.card, 0.95), ...texts);
    const animation = swap(boxNow, next);
    boxNow = next;
    return animation;
  }

  function clearBox() {
    if (boxNow) outgoing.push(leave(boxNow));
    boxNow = null;
  }

  // Neutral sketches identify the five photographed items before any labels are given.
  const outlines = [
    [[-.12, -.15], [.12, -.15], [.15, .02], [.06, .08], [.06, .17], [-.06, .17], [-.06, .08], [-.15, .02]],
    [[-.15, -.12], [.12, -.12], [.17, .09], [-.09, .13]],
    [[-.18, -.08], [-.05, -.16], [.17, -.04], [.06, .14], [-.09, .08]],
    [[-.16, -.14], [.13, -.14], [.15, .12], [-.13, .12]],
    [[-.15, -.11], [-.07, -.16], [.12, -.09], [.16, .1], [.03, .15], [-.13, .08]],
  ];

  function photo(i, px, py, large = false) {
    const scale = large ? 2 : P ? 1.0 : 0.88;
    const frame = rect(px, py, 0.55 * scale, 0.54 * scale, C.line, C.card, 1);
    const points = outlines[i];
    const edges = points.map(([ax, ay], j) => {
      const [bx, by] = points[(j + 1) % points.length];
      return line(px + ax * scale, py + ay * scale, px + bx * scale, py + by * scale, C.muted, large ? 2.4 : 1.6);
    });
    return new M.VGroup(frame, ...edges);
  }

  function person(px, py, color) {
    return new M.VGroup(
      circle(px, py + 0.17, 0.13, color),
      rect(px, py - 0.12, 0.4, 0.26, color, color, 0.65),
    );
  }

  const arrivals = observations.map((_, i) => {
    const px = P ? (i < 3 ? (i - 1) * 2.2 : (i - 3.5) * 2.2) : CX + (i - 2) * 1.27;
    const py = P ? (i < 3 ? 0.1 : -2.7) : 0.18;
    return new M.VGroup(
      photo(i, px, py, true),
      text(`U${i + 1} · ?`, px, py - 0.82, C.muted),
    );
  });
  const photoHead = text('Photo', x(0), HEAD_Y);
  const tableRows = observations.map((_, i) => new M.VGroup(
    photo(i, x(0) - 0.3, y(i)), text(`U${i + 1}`, x(0) + 0.2, y(i)),
  ));
  const tableLines = observations.map((_, i) =>
    line(CX - 3.5, y(i) - PITCH / 2, CX + 3.74, y(i) - PITCH / 2, C.line));
  const cells = rules.map(({ clue }, j) => [
    text(clue, x(j + 1), HEAD_Y, C.cyan, 19, 0.99),
    ...observations.map((row, i) =>
      text(row[j] ? 'Yes' : 'No', x(j + 1), y(i), row[j] ? C.cyan : C.muted)),
  ]);
  const labelHead = text('Temp. label', x(4), HEAD_Y, C.violet, 18, 1.5);
  const humanHead = text('Worker', x(5), HEAD_Y, C.green, 18, 1.35);

  function dashedEdge(x1, y1, x2, y2, n, color) {
    return Array.from({ length: n }, (_, i) => {
      const start = (i + 0.15) / n, end = (i + 0.85) / n;
      return line(
        x1 + (x2 - x1) * start, y1 + (y2 - y1) * start,
        x1 + (x2 - x1) * end, y1 + (y2 - y1) * end, color,
      );
    });
  }

  function square(px, py, color) {
    const s = new M.Rectangle({ width: 0.12, height: 0.12, color, strokeWidth: 1.5 });
    s.setFill(color, 0.75);
    return s.moveTo([px, py, 0]);
  }

  function labelTag(i) {
    const value = counts[i].label;
    const cx = x(4), cy = y(i), color = materialColor(value);
    if (!value) return text('—', cx, cy, color);
    const left = cx - 0.66, right = cx + 0.66, top = cy + 0.2, bottom = cy - 0.2;
    const iconX = cx - 0.48;
    const icon = value === 'Plastic'
      ? circle(iconX, cy, 0.065, color)
      : square(iconX, cy, color);
    return new M.VGroup(
      ...dashedEdge(left, top, right, top, 8, color),
      ...dashedEdge(left, bottom, right, bottom, 8, color),
      ...dashedEdge(left, bottom, left, top, 2, color),
      ...dashedEdge(right, bottom, right, top, 2, color),
      icon,
      text(value, cx + 0.08, cy, color, 18, 0.97),
    );
  }

  function checkedTag(i, material, wrong = false) {
    const cx = x(5), cy = y(i);
    return new M.VGroup(
      rect(cx, cy, 1.32, 0.4, wrong ? C.pink : C.green, C.card, 0.95),
      text(wrong ? '×' : '✓', cx - 0.47, cy, wrong ? C.pink : C.green, 15),
      text(material, cx + 0.08, cy, materialColor(material), 18, 0.97),
    );
  }

  const tags = counts.map((_, i) => labelTag(i));
  const assigned = tags.filter((_, i) => counts[i].label);
  const checked = [checkedTag(0, 'Plastic'), checkedTag(1, 'Metal'), checkedTag(3, 'Metal')];
  const corrected = checkedTag(4, 'Plastic', true);

  let focus = null;
  function focusRow(i, color = C.amber) {
    if (focus) outgoing.push(leave(focus));
    focus = i === null ? null : rect(CX + 0.12, y(i), 7.24, PITCH - 0.06, color);
    return focus ? [enter(focus)] : [];
  }

  const rowClues = (i, indices = [0, 1, 2]) => indices.map(j => mark(cells[j][i + 1]));
  function ruleBox(last) {
    return fbox(rules.slice(0, last + 1).map(({ condition, material }) =>
      [`${condition} → ${material}`, materialColor(material)]));
  }

  function voteBox(i, visible, total = false) {
    const rows = visible.map(j => {
      const vote = votes[i][j];
      return [`${rules[j].clue} → ${vote || 'No vote'}`, materialColor(vote)];
    });
    if (total) {
      const { metal, plastic } = counts[i];
      rows.push([`Metal ${metal}   Plastic ${plastic}`, C.amber]);
    }
    return fbox(rows, C.amber);
  }

  const training = text('Examples for the computer', CX, P ? -4.7 : -1.15, C.cyan);
  const worker = person(CX, P ? -5.3 : -1.75, C.amber);
  const queue = text('5 items waiting', CX, P ? -6.0 : -2.28, C.amber);

  await until(S(0));
  await play(new M.LaggedStart(reveal(arrivals), { lagRatio: 0.2, runTime: 0.95 }), say('5 UNLABELLED ITEMS'));
  await until(S(1)); await play(enter(training), say('PREPARE MORE EXAMPLES'));
  await until(S(2)); await play(leave(training), enter(worker), enter(queue), say('LIMITED WORKER TIME', C.amber));
  await until(S(3)); await play(leave(worker), leave(queue), say('CAN EVERYDAY CLUES HELP?', C.amber));
  await until(S(4));
  await play(...hide(arrivals), ...reveal(tableLines), ...reveal(tableRows), enter(photoHead), say('PHOTO OBSERVATIONS'));
  await until(S(5)); await play(...reveal(cells[0]), say('DOES A MAGNET STICK?'));
  await until(S(6)); await play(...reveal(cells[1]), say('DOES IT BEND EASILY?'));
  await until(S(7)); await play(...reveal(cells[2]), say('DOES IT LOOK METALLIC?'));

  const peopleY = P ? -6.1 : -2.3;
  const people = rules.map((_, j) => {
    const px = (P ? CX : BOXP[0]) + (j - 1) * 1.45;
    return new M.VGroup(
      person(px, peopleY, C.ink),
      text(`Person ${j + 1}`, px, peopleY - 0.41, C.muted, 16),
    );
  });
  await until(S(8)); await play(...reveal(people), say('THREE PEOPLE GUESS'));
  await until(S(9)); await play(mark(people[0]), ruleBox(0));
  await until(S(10)); await play(mark(people[1]), ruleBox(1));
  await until(S(11)); await play(mark(people[2]), ruleBox(2));
  await until(S(12)); await play(fbox(['Clue missing → no answer'], C.amber), say('A PERSON CAN SKIP A GUESS', C.amber));
  await until(S(13)); await play(...hide(people), ruleBox(2), say('THE COMPUTER FOLLOWS INSTRUCTIONS'));
  await until(S(14)); await play(fbox(['Instruction = rule', 'Answer = vote']), say('RULES GIVE VOTES'));
  await until(S(15)); await play(enter(labelHead), fbox(['Rule votes → one label']), say('COMBINE THE VOTES'));
  await until(S(16)); await play(say('WEAK SUPERVISION', C.violet));

  // Work through the five photos in narration order.
  await until(S(17));
  clearBox();
  await play(...focusRow(0), say('ONE PHOTO AT A TIME'));
  await until(S(18)); await play(...rowClues(0, [0]), voteBox(0, [0]));
  await until(S(19)); await play(...rowClues(0, [1]), voteBox(0, [0, 1]));
  await until(S(20)); await play(...rowClues(0, [2]), voteBox(0, [0, 1, 2]));
  await until(S(21)); await play(voteBox(0, [0, 1, 2], true));
  await until(S(22)); await play(enter(tags[0]), say('TEMPORARY PLASTIC LABEL', PLASTIC));
  await until(S(23));
  clearBox();
  await play(...focusRow(1), say('PHOTO U2'));
  await until(S(24)); await play(...rowClues(1));
  await until(S(25)); await play(voteBox(1, [0, 1, 2], true), enter(tags[1]), say('TEMPORARY METAL LABEL', METAL));
  await until(S(26));
  clearBox();
  await play(...focusRow(2), ...rowClues(2), say('PHOTO U3'));
  await until(S(27)); await play(voteBox(2, [0, 1, 2], true));
  await until(S(28));
  await play(enter(tags[2]), fbox(['Metal 1   Plastic 1', ['Tie → unlabelled', C.amber]], C.amber), say('TIED VOTES', C.amber));
  await until(S(29));
  clearBox();
  await play(...focusRow(3), ...rowClues(3, [0, 2]), say('PHOTO U4'));
  await until(S(30)); await play(...rowClues(3, [1]), voteBox(3, [0, 1, 2], true));
  await until(S(31)); await play(enter(tags[3]), say('TEMPORARY METAL LABEL', METAL));
  await until(S(32));
  clearBox();
  await play(...focusRow(4), ...rowClues(4), say('PHOTO U5'));
  await until(S(33)); await play(voteBox(4, [0, 1, 2], true));
  await until(S(34)); await play(enter(tags[4]), say('TEMPORARY METAL LABEL', METAL));

  // Compare the four assigned labels with the five photos and then with the worker's checks.
  await until(S(35)); await play(...focusRow(null), fbox(['More votes → chosen label']), say('MAJORITY VOTING'));
  await until(S(36)); await play(say('THE DECISION RULE'));
  await until(S(37));
  await play(fbox([['More Metal votes → Metal', METAL], ['More Plastic votes → Plastic', PLASTIC]]));
  await until(S(38));
  await play(fbox(['Equal votes → unlabelled', '0 votes each → unlabelled'], C.amber), mark(tags[2]));
  await until(S(39));
  clearBox();
  await play(...assigned.map(mark), say('4 TEMPORARY LABELS'));
  await until(S(40)); await play(fbox(['4 labelled of 5 photos']), say('COVERAGE'));
  await until(S(41)); await play(fbox(['Coverage =', 'labelled photos ÷ all photos']), mark(labelHead), mark(photoHead));
  await until(S(42)); await play(fbox([['Coverage = 4 ÷ 5 = 80%', C.cyan]]));
  await until(S(43));
  clearBox();
  await play(enter(humanHead), ...assigned.map(mark), say('A WORKER CHECKS 4 LABELS', C.green));
  await until(S(44)); await play(...reveal(checked), say('U1, U2 AND U4 ARE CORRECT', C.green));
  await until(S(45));
  await play(enter(corrected), ...focusRow(4, C.pink), mark(cells[2][5]),
    fbox([['Rule label: Metal', METAL], ['Worker: shiny Plastic', PLASTIC]], C.pink), say('U5 IS SHINY PLASTIC', C.pink));
  await until(S(46));
  await play(...checked.map(mark), fbox(['3 correct of 4 labels'], C.green), say('ACCURACY', C.green));
  await until(S(47));
  await play(fbox(['Accuracy =', 'correct labels ÷ assigned labels'], C.green), mark(humanHead), mark(labelHead));
  await until(S(48)); await play(fbox([['Accuracy = 3 ÷ 4 = 75%', C.green]], C.green));

  await until(S(49));
  await play(...assigned.map(mark), fbox(['Rules label 4 of 5 photos', 'Checking each item takes time']), say('RULES CAN SAVE TIME'));
  await until(S(50));
  await play(mark(corrected), fbox(['Plastic can shine', 'Metal can bend', 'A magnet misses some metals'], C.amber), say('CLUES CAN MISLEAD', C.amber));
  await until(S(51));
  await play(fbox([['Example: Metal + Metal', METAL], ['Both votes can be wrong', C.amber]], C.amber), say('AGREEMENT CAN STILL BE WRONG', C.amber));
  await until(S(52));
  await play(mark(labelHead), mark(humanHead), fbox(['Keep the labels separate', 'Check how the computer learns'], C.green), say('TEMPORARY AND HUMAN-CHECKED', C.green));
  await until(S(53));
  await play(...assigned.map(mark), fbox(['Imperfect clues →', ['temporary labels', C.amber], 'Temporary labels →', ['learning examples', C.green]]), say('WEAK SUPERVISION', C.violet));
}
