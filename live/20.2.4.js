// 20.2.4 Preference data. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net, LINE_Y } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 3.85, 0] : [CX, 1.85, 0];
  const BASE = P ? -4.2 : -2.35;
  const BLUE = '#a9bfff';
  const RUN = { runTime: 0.38 };
  const CARD_W = P ? 3.42 : 5.15;
  const CARD_H = P ? 3.2 : 2.15;
  const CARD_Y = P ? -2.0 : -1.6;
  const TOPY = P ? 1.3 : 0.55;
  const SIDE = CARD_W / 2 + (P ? 0.15 : 0.24);
  const A = { name: 'Reply A', color: C.cyan, lines: ['At six.'] };
  const B = {
    name: 'Reply B',
    color: BLUE,
    lines: ['Thanks for asking!', 'The newsletter says the', 'library will close at six', 'this Friday for cleaning.'],
  };
  const cafeA = { name: 'Reply A', color: C.cyan, lines: ['It opens at eight', 'on Saturday.'] };
  const cafeB = { name: 'Reply B', color: BLUE, lines: ['On Saturday, it', 'opens at eight.'] };
  const gymA = { name: 'Reply A', color: C.cyan, lines: ['Closed on Monday.'] };
  const gymB = { name: 'Reply B', color: BLUE, lines: ['Open on Monday.'] };
  const libraryAnnouncement = ['The library closes at six', 'on Friday for cleaning.'];
  const libraryQuestion = ['When does the library', 'close on Friday?'];
  const scores = [[6, 4], [9, 8]];

  const say = (text, color = C.cyan) => showA(text, color, PILL, P ? 18 : 19);
  const enter = object => new M.FadeIn(object, RUN);
  const leave = object => new M.FadeOut(object, RUN);
  const lag = objects => new M.LaggedStart(objects.map(enter), { lagRatio: 0.18, runTime: 0.65 });
  let picture = [];
  let marks = [];

  function clearMarks() {
    const animations = marks.map(leave);
    marks = [];
    return animations;
  }

  function highlight(...objects) {
    const animations = clearMarks();
    marks = objects;
    return [...animations, ...objects.map(enter)];
  }

  function replace(...objects) {
    const animations = [...clearMarks(), ...picture.map(leave)];
    picture = objects;
    return [...animations, ...(objects.length ? [lag(objects)] : [])];
  }

  function add(...objects) {
    picture.push(...objects);
    return objects.map(enter);
  }

  function remove(...objects) {
    picture = picture.filter(object => !objects.includes(object));
    return objects.map(leave);
  }

  function label(text, x, y, width, color = C.ink, size = P ? 21 : 22, bold = false) {
    const t = T(text, size, color, false, bold);
    if (t.getWidth() > width) t.scale(width / t.getWidth());
    t.moveTo([x, y, 0]);
    return t;
  }

  function rect(x, y, width, height, color, fill = 0) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.13, color, strokeWidth: 2 });
    r.setFill(C.card, fill);
    r.moveTo([x, y, 0]);
    return r;
  }

  function panel({ x = 0, y, width, height, title, lines = [], color = C.cyan,
    pitch = P ? 0.43 : 0.36, size = P ? 21 : 22 }) {
    const top = y + height / 2;
    const parts = [
      rect(x, y, width, height, color, 0.94),
      label(title, x, lines.length ? top - 0.32 : y, width - 0.32, color, P ? 18 : 19, true),
      ...lines.map((line, i) => label(line, x, top - 0.76 - i * pitch, width - 0.34, C.ink, size)),
    ];
    return new M.VGroup(...parts);
  }

  const prompt = (title, lines, y = P ? -0.35 : -0.50) =>
    panel({ y, width: P ? 6.80 : 9.60, height: 1.60, title, lines, color: C.violet });

  function reply(r, side, lines = r.lines) {
    return panel({
      x: side * SIDE, y: CARD_Y, width: CARD_W, height: CARD_H,
      title: r.name, lines, color: r.color,
    });
  }

  function pair(a, b) {
    return [reply(a, -1), reply(b, 1)];
  }

  function choice(side, color = C.green) {
    return rect(side * SIDE, CARD_Y, CARD_W + 0.12, CARD_H + 0.12, color);
  }

  function swap(cards) {
    const targets = [SIDE, -SIDE];
    return cards.map((card, i) => new M.Transform(
      card, card.copy().moveTo([targets[i], CARD_Y, 0]), { runTime: 0.72, pathArc: 0.34 },
    ));
  }

  function student(x, y, k = P ? 1.8 : 1.2) {
    const head = new M.Circle({ radius: 0.14 * k, color: C.ink });
    head.setFill(C.ink, 1);
    head.moveTo([x, y + 0.31 * k, 0]);
    const body = new M.Arc({ radius: 0.26 * k, startAngle: 0, angle: Math.PI, color: C.ink });
    body.setFill(C.ink, 1);
    body.moveTo([x, y - 0.03 * k, 0]);
    return new M.VGroup(head, body);
  }

  function strip(x, y, width, color) {
    const r = new M.Rectangle({ width, height: 0.12, color, strokeWidth: 1 });
    r.setFill(color, 0.85);
    r.moveTo([x, y, 0]);
    return r;
  }

  const MEAL_Y = P ? -1.8 : -0.75;
  const MEAL_R = P ? 1.15 : 0.9;
  function meal(x, color, count) {
    const y = MEAL_Y;
    const plate = new M.Circle({ radius: MEAL_R, color: C.muted, strokeWidth: 2 });
    plate.setFill(C.card, 0.94);
    plate.moveTo([x, y, 0]);
    const pieces = Array.from({ length: count }, (_, i) => {
      const theta = 2 * Math.PI * i / count;
      return new M.Dot({ point: [x + MEAL_R * 0.5 * Math.cos(theta), y + MEAL_R * 0.5 * Math.sin(theta), 0],
        radius: 0.14, color });
    });
    return new M.VGroup(plate, ...pieces, label('Meal ' + (x < 0 ? 'A' : 'B'), x, y - MEAL_R - 0.35, 2));
  }

  const scoreWidths = P ? [2.14, 1.94, 1.94] : [2.52, 2.28, 2.28];
  const scoreX = [-scoreWidths[1] / 2 - scoreWidths[0] / 2, 0, scoreWidths[1] / 2 + scoreWidths[2] / 2];
  const scoreY = P ? [1.0, -0.6, -2.2] : [0.68, -0.08, -0.84];
  const scoreH = P ? 1.4 : 0.73;
  function scoreCell(text, row, col, color = C.muted) {
    const x = scoreX[col], y = scoreY[row], width = scoreWidths[col] - 0.05;
    return new M.VGroup(rect(x, y, width, scoreH, C.line, 0.94),
      ...(text ? [label(text, x, y, width - 0.18, color, P ? 21 : 22, row === 0)] : []));
  }

  function scoreOutline(row, col, color) {
    return rect(scoreX[col], scoreY[row], scoreWidths[col] - 0.10, scoreH - 0.05, color);
  }

  function scoreRow(rater, values) {
    return [scoreCell(`Rater ${rater}`, rater, 0, C.ink),
      scoreCell(values ? `${values[0]} / 10` : '', rater, 1, C.cyan),
      scoreCell(values ? `${values[1]} / 10` : '', rater, 2, BLUE)];
  }

  function scoreSummary(text, color) {
    const y = P ? -3.8 : BASE + 0.20;
    return new M.VGroup(rect(0, y, P ? 6.8 : 6.8, P ? 0.8 : 0.56, color, 0.94),
      label(text, 0, y, P ? 6.4 : 6.45, color, P ? 21 : 20, true));
  }

  const tableWidths = P ? [2.7, 1.9, 2.7] : [4.30, 2.48, 4.55];
  const tableLeft = -tableWidths.reduce((sum, width) => sum + width, 0) / 2;
  const tableX = tableWidths.map((width, i) =>
    tableLeft + tableWidths.slice(0, i).reduce((sum, w) => sum + w, 0) + width / 2);
  const headY = P ? 1.4 : 0.94;
  const headH = P ? 0.7 : 0.59;
  const rowH = P ? 2.7 : 1.61;
  const rowY = row => headY - headH / 2 - (row + 0.5) * rowH;
  const headerColors = [C.violet, C.green, BLUE];
  const libraryRow = [
    P ? ['The library closes', 'at six on Friday', 'for cleaning.', 'When does the', 'library close', 'on Friday?']
      : [...libraryAnnouncement, ...libraryQuestion],
    ['At six.'],
    P ? ['Thanks for asking!', 'The newsletter', 'says the library', 'will close at six', 'this Friday for', 'cleaning.'] : B.lines,
  ];
  const gymRow = [
    ['The gym closes', 'on Monday.', 'Is it open on Monday?'],
    P ? ['Closed on', 'Monday.'] : ['Closed on Monday.'],
    ['Open on Monday.'],
  ];

  function tableHeader() {
    return new M.VGroup(...(P ? ['Prompt', 'Chosen', 'Rejected'] : ['Prompt', 'Chosen reply', 'Rejected reply']).map((title, col) =>
      new M.VGroup(rect(tableX[col], headY, tableWidths[col] - 0.04, headH, headerColors[col], 0.96),
        label(title, tableX[col], headY, tableWidths[col] - 0.15, headerColors[col], 19, true))));
  }

  function tableCell(row, col, lines) {
    const x = tableX[col], y = rowY(row), width = tableWidths[col] - 0.04;
    const pitch = P ? 0.36 : 0.32;
    return new M.VGroup(rect(x, y, width, rowH - 0.04, C.line, 0.96),
      ...lines.map((line, i) => label(line, x, y + ((lines.length - 1) / 2 - i) * pitch,
        width - 0.17, col === 0 ? C.ink : headerColors[col], P ? 19 : 20)));
  }

  function tableContents() {
    return [tableHeader(), ...[libraryRow, gymRow].flatMap((row, i) =>
      row.map((lines, col) => tableCell(i, col, lines)))];
  }

  function tableColumn(col, rows = 1) {
    const bottom = headY - headH / 2 - rows * rowH;
    const top = headY + headH / 2;
    return rect(tableX[col], (top + bottom) / 2, tableWidths[col] - 0.09, top - bottom - 0.05, headerColors[col]);
  }

  // 0–9: students, the prompt, and the two replies from the writing assistant.
  const studentY = P ? -0.2 : 0.2;
  const SX = P ? 1.75 : SIDE;
  const SD = P ? 1.4 : 0.9;
  const short = [
    strip(-SX, studentY - SD, P ? 0.7 : 0.54, C.cyan),
  ];
  const long = [0, 1, 2, 3].map(i => strip(SX, studentY - SD - i * (P ? 0.36 : 0.24), P ? 2.6 : 1.84, BLUE));
  const shortTag = label('short answer', -SX, studentY - SD - (P ? 1.7 : 1.15), 3, C.cyan, 19);
  const longTag = label('long answer', SX, studentY - SD - (P ? 1.7 : 1.15), 3, BLUE, 19);
  await until(S(0));
  await play(...replace(student(-SX, studentY), student(SX, studentY), ...short, ...long, shortTag, longTag),
    ...say('CAMPUS WRITING ASSISTANT'));
  await until(S(1));
  await play(...say('BOTH CORRECT • DIFFERENT LENGTHS'));
  await until(S(2));
  await play(...say('WHICH REPLY DO PEOPLE PREFER?', C.amber));

  const questionPairY = P ? -1.6 : -1.49;
  await until(S(3));
  await play(...replace(prompt('Announcement', libraryAnnouncement, P ? 1.0 : 0.35)), ...say('LIBRARY'));
  await until(S(4));
  await play(...add(prompt('Question', libraryQuestion, questionPairY)), ...say('THE STUDENT ASKS', C.violet));

  const N = net({ layers: [2, 2, 2], center: [0, P ? 0.5 : 0.62, 0],
    width: P ? 4.8 : 5.50, height: P ? 2.4 : 0.83, r: P ? 0.34 : 0.28 });
  // Illustrative units in a toy network. These are activations, not rater scores.
  const weights = [[[0.8, -0.4], [0.3, 0.7]], [[0.6, -0.3], [0.5, 0.8]]];
  weights.forEach((layer, l) => layer.forEach((row, i) => row.forEach((w, j) => {
    const edge = N.edges[l][i][j];
    edge.setColor(w < 0 ? C.pink : C.cyan);
    edge.setStrokeWidth(1.5 + 4 * Math.abs(w));
    edge.setStrokeOpacity(0.35 + 0.6 * Math.abs(w));
  })));
  const nodeValues = [[1, 1], [1, 0], [1, 1]];
  const values = nodeValues.flatMap((row, l) => row.flatMap((value, i) => N.value(l, i, value)));
  const placeholders = [
    panel({ x: -SIDE, y: P ? -2.6 : -1.02, width: CARD_W, height: P ? 1.1 : 0.65, title: A.name, color: A.color }),
    panel({ x: SIDE, y: P ? -2.6 : -1.02, width: CARD_W, height: P ? 1.1 : 0.65, title: B.name, color: B.color }),
  ];
  await until(S(5));
  await play(...replace(N.group, ...placeholders), ...values, ...say('TWO POSSIBLE REPLIES'));
  await play(new M.LaggedStart([...N.flow(0), ...N.flow(1)], { lagRatio: 0.65, runTime: 1.03 }));

  const shownA = reply(A, -1);
  const blankB = reply(B, 1, []);
  const firstB = reply(B, 1, B.lines.slice(0, 1));
  const shownB = reply(B, 1);
  await until(S(6));
  await play(...values.map(animation => leave(animation.mobject)), ...replace(shownA, blankB), ...say('REPLY A'));
  await until(S(7));
  await play(...remove(blankB), ...add(firstB), ...say('REPLY B', BLUE));
  await until(S(8));
  await play(...remove(firstB), ...add(shownB));
  await until(S(9));
  await play(...highlight(choice(-1)), ...say('SAME TIME • A IS SHORTER', C.green));

  // 10–19: build the score table and compare the rater scales with their choices.
  await until(S(10));
  const raterY = TOPY - (P ? 0.1 : 0.15);
  await play(...replace(student(-SIDE, raterY), student(SIDE, raterY), ...pair(A, B)), ...say('TWO PEOPLE JUDGE THE REPLIES'));
  await until(S(11));
  await play(...add(label('Rater 1', -SIDE - (P ? 0 : 1.1), raterY + (P ? 1.15 : 0.25), 2.4, C.violet, 21, true),
    label('Rater 2', SIDE - (P ? 0 : 1.1), raterY + (P ? 1.15 : 0.25), 2.4, C.violet, 21, true)),
  ...say('EACH PERSON IS A RATER', C.violet));
  const emptyRows = [scoreRow(1), scoreRow(2)];
  await until(S(12));
  await play(...replace(
    scoreCell('Rater', 0, 0, C.ink), scoreCell('Reply A', 0, 1, C.cyan), scoreCell('Reply B', 0, 2, BLUE),
    ...emptyRows.flat(),
  ), ...say('SCORE EACH REPLY OUT OF 10', C.amber));
  await until(S(13));
  await play(...remove(...emptyRows[0].slice(1)), ...add(...scoreRow(1, scores[0]).slice(1)),
    ...say('RATER 1', C.amber));
  await until(S(14));
  await play(...remove(...emptyRows[1].slice(1)), ...add(...scoreRow(2, scores[1]).slice(1)),
    ...say('RATER 2', C.amber));
  await until(S(15));
  await play(...highlight(scoreOutline(1, 1, C.cyan), scoreOutline(2, 1, C.cyan)), ...say('LOOK AT REPLY A'));
  await until(S(16));
  await play(...highlight(scoreOutline(1, 1, C.amber), scoreOutline(2, 1, C.amber),
    scoreSummary(`A: ${scores[0][0]} from Rater 1 • ${scores[1][0]} from Rater 2`, C.amber)));
  await until(S(17));
  await play(...say('SAME REPLY • DIFFERENT SCORES', C.amber));
  await until(S(18));
  await play(...clearMarks(), ...say('WHERE DO THEY AGREE?', C.violet));
  await until(S(19));
  await play(...highlight(scoreOutline(1, 1, C.green), scoreOutline(2, 1, C.green),
    scoreSummary(`${scores[0][0]} > ${scores[0][1]}     and     ${scores[1][0]} > ${scores[1][1]}`, C.green)),
    ...say('BOTH RATERS PREFER A', C.green));

  // 20–30: choose without scores, then write one row.
  await until(S(20));
  await play(...replace(meal(-1.53 * (P ? 1.1 : 1.3), C.amber, 3), meal(1.53 * (P ? 1.1 : 1.3), C.green, 4)), ...say('WHICH MEAL WOULD YOU CHOOSE?'));
  await until(S(21));
  await play(...highlight(rect(-1.53 * (P ? 1.1 : 1.3), MEAL_Y, 2 * MEAL_R + 0.2, 2 * MEAL_R + 0.2, C.green)), ...say('ONE CHOICE', C.green));
  await until(S(22));
  await play(...replace(...pair(A, B)), ...say('TRY THE SAME THING WITH REPLIES'));
  await until(S(23));
  await play(...say('WHICH REPLY DO YOU PREFER?', C.amber));
  await until(S(24));
  await play(...highlight(choice(-1)), ...say('PREFERENCE DATA', C.green));
  await until(S(25));
  await play(...say('THE RATER PREFERS REPLY A', C.green));
  await until(S(26));
  await play(...replace(tableHeader()), ...say('RECORD ONE COMPARISON'));
  await until(S(27));
  await play(...add(tableCell(0, 0, libraryRow[0])), ...highlight(tableColumn(0)), ...say('ANNOUNCEMENT + QUESTION', C.violet));
  await until(S(28));
  await play(...add(tableCell(0, 1, libraryRow[1])), ...highlight(tableColumn(1)), ...say('CHOSEN: REPLY A', C.green));
  await until(S(29));
  await play(...add(tableCell(0, 2, libraryRow[2])), ...highlight(tableColumn(2)), ...say('REJECTED: REPLY B', BLUE));
  await until(S(30));
  await play(...say('B IS CORRECT • THE RATER PREFERS A', C.green));

  // 31–44: repeat each comparison with the replies on opposite sides.
  await until(S(31));
  await play(...clearMarks(), ...say('CHECK THE CHOICE BEFORE TRAINING', C.amber));
  const libraryCards = pair(A, B);
  await until(S(32));
  await play(...replace(prompt('Question', libraryQuestion, TOPY), ...libraryCards), ...say('LEFT: A    RIGHT: B'));
  await until(S(33));
  await play(...highlight(choice(-1)), ...say('CHOSEN: A ON THE LEFT', C.green));
  await until(S(34));
  await play(...clearMarks(), ...swap(libraryCards), ...say('SWAP THE SIDES', C.amber));
  await until(S(35));
  await play(...highlight(choice(1)), ...say('CHOSEN: A ON THE RIGHT', C.green));
  await until(S(36));
  await play(...say('SAME REPLY BOTH TIMES • KEEP', C.green));

  const cafeTitle = label('Campus café', 0, TOPY, FW - 1.2, C.violet, 26, true);
  const cafeAnnouncement = prompt('Café announcement', ['The café opens at eight', 'on Saturday.'], TOPY);
  const cafeCards = pair(cafeA, cafeB);
  const cafeEmpty = [reply(cafeA, -1, []), reply(cafeB, 1, [])];
  await until(S(37));
  await play(...replace(cafeTitle, ...cafeEmpty), ...say('TRY THE SWAP CHECK AGAIN'));
  await until(S(38));
  await play(...remove(cafeTitle), ...add(cafeAnnouncement), ...say('CAMPUS CAFÉ', C.violet));
  await until(S(39));
  await play(...remove(...cafeEmpty), ...add(...cafeCards), ...say('TWO EQUALLY GOOD REPLIES'));
  await until(S(40));
  await play(...highlight(choice(-1, C.amber)), ...say('CHOSEN: A ON THE LEFT', C.amber));
  await until(S(41));
  await play(...clearMarks(), ...swap(cafeCards), ...say('SWAP AND CHOOSE AGAIN', C.amber));
  await until(S(42));
  await play(...highlight(choice(-1, C.amber)), ...say('CHOSEN: B ON THE LEFT', C.amber));
  await until(S(43));
  await play(...say('SAME SIDE BOTH TIMES • POSITION BIAS', C.pink));
  await until(S(44));
  await play(...replace(), ...say('NO CLEAR PREFERENCE • DROP', C.pink));

  // 45–53: the second kept comparison, the data set, and its purpose.
  await until(S(45));
  const gymPrompt = prompt('Gym announcement', ['The gym closes on Monday.'], TOPY);
  const gymEmpty = [reply(gymA, -1, []), reply(gymB, 1, [])];
  await play(...replace(gymPrompt, ...gymEmpty), ...say('GYM'));
  await until(S(46));
  await play(...remove(...gymEmpty), ...add(...pair(gymA, gymB)), ...highlight(choice(-1)), ...say('CHOSEN: CLOSED ON MONDAY', C.green));
  await until(S(47));
  await play(...replace(...tableContents()), ...say('TWO COMPARISONS WE KEEP', C.green));
  await until(S(48));
  await play(...highlight(...tableWidths.map((_, col) => tableColumn(col, 2))),
    ...say('PROMPT • CHOSEN • REJECTED'));
  await until(S(49));
  await play(...highlight(tableColumn(1, 2)), ...say('ONE PREFERRED REPLY PER ROW', C.green));
  await until(S(50));
  await play(...say('EXAMPLES OF REPLIES TO FAVOUR', C.green));
  await until(S(51));
  await play(...replace(panel({
    y: P ? -1.8 : -0.6, width: P ? 6.60 : 8.30, height: P ? 2.4 : 1.80, title: 'Café swap check',
    lines: ['First choice: A on the left', 'Second choice: B on the left'], color: C.pink,
  })), ...say('UNFAIR CHOICES CAN MISLEAD', C.pink));
  await until(S(52));
  await play(...replace(...tableContents()), ...say('NEXT: TEACH A MODEL TO SCORE REPLIES', C.violet));
  await until(S(53));
  await play(...highlight(tableColumn(1, 2), tableColumn(2, 2)), ...say('PREFERENCE DATA RECORDS A CHOICE', C.green));
}
