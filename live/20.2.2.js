// 20.2.2 Instruction tuning: learning to follow different requests.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 3.85, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 2.4, 0] : [4.85, -0.4, 0];
  const BLUE = '#a5b4fc';
  const ANN = P ? ['The library closes at six', 'on Friday for cleaning.'] : ['The library closes at six on Friday for cleaning.'];
  const QUE = P ? ['When does the library', 'close on Friday?'] : ['When does the library close on Friday?'];
  const pool = 'Quick one: is the pool open on Sunday?';

  let picture = null, boxNow = null;
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const at = (text, x, y, { size = 22, color = C.ink, width = FW - 0.9, mono = false } = {}) => {
    const t = T(text, size, color, mono);
    if (t.getWidth() > width) t.scale(width / t.getWidth());
    t.moveTo([x, y, 0]);
    return t;
  };
  function rect(x, y, width, height, color = C.line, fill = C.card, opacity = 0.94) {
    const r = new M.RoundedRectangle({ width, height, cornerRadius: 0.14, color, strokeWidth: 2 });
    r.setFill(fill, opacity);
    r.moveTo([x, y, 0]);
    return r;
  }
  function line(x1, y1, x2, y2, color = C.line) {
    return new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth: 2 });
  }
  // a card: title on top, rows below, height grows with the rows
  function card(x, y, width, title, rows = [], color = C.cyan, size = 21) {
    const pitch = P ? 0.42 : 0.37;
    const height = 0.7 + pitch * rows.length;
    return new M.VGroup(rect(x, y, width, height, color),
      at(title, x, y + height / 2 - 0.3, { color, size: 18, width: width - 0.35 }),
      ...rows.map((row, i) => at(row, x, y + height / 2 - 0.7 - i * pitch,
        { size, width: width - 0.39 })));
  }
  function stage(next) {
    const animations = picture ? [new M.FadeOut(picture, { runTime: 0.35 })] : [];
    if (next) animations.push(new M.FadeIn(next, { runTime: 0.45 }));
    picture = next;
    return animations;
  }
  function fbox(rows, color = C.cyan) {
    const animations = boxNow ? [new M.FadeOut(boxNow, { runTime: 0.3 })] : [];
    boxNow = null;
    if (!rows.length) return animations;
    const maxWidth = P ? FW - 1.0 : 4.1;
    const lh = P ? 0.4 : 0.36;
    const texts = rows.map(row => Array.isArray(row) ? row : [row, C.ink]);
    const labels = texts.map(([text, ink], i) => at(text, BOXP[0],
      BOXP[1] + ((rows.length - 1) / 2 - i) * lh,
      { size: P ? 20 : 19, color: ink, width: maxWidth - 0.5, mono: true }));
    const width = Math.min(maxWidth, Math.max(...labels.map(t => t.getWidth())) + 0.5);
    boxNow = new M.VGroup(rect(BOXP[0], BOXP[1], width, rows.length * lh + 0.26, color), ...labels);
    animations.push(new M.FadeIn(boxNow, { runTime: 0.36 }));
    return animations;
  }
  async function beat(i, animations) {
    await until(S(i));
    await play(...animations());
  }

  // 0–16. One announcement, three requests, and the information-desk example.
  const request = [QUE, ['Give me a short summary.'], P ? ['Which day does the library', 'close early?'] : ['Which day does the library close early?']];
  const answers = [['At six.'], ANN, ['Friday.']];
  const colors = [C.cyan, C.violet, C.green];
  const wide = P ? 7 : 8.4;
  function person(x, y, color, k = 1) {
    const head = new M.Circle({ radius: 0.18 * k, color });
    head.setFill(color, 0.85);
    head.moveTo([x, y + 0.4 * k, 0]);
    const body = new M.Arc({ radius: 0.32 * k, startAngle: 0, angle: Math.PI, color });
    body.setFill(color, 0.85);
    body.moveTo([x, y + 0.01 * k, 0]);
    return new M.VGroup(head, body);
  }
  function opening(labels) {
    const top = card(0, P ? 2.2 : 0.62, P ? 7 : 7.1, 'Campus writing assistant', ['University announcements']);
    return new M.VGroup(top, ...labels.flatMap((label, i) => {
      const x = P ? 0 : (i === 0 ? -2.65 : 2.65);
      const y = P ? -0.2 - i * 2.5 : -0.85;
      const k = P ? 1.4 : 1;
      return [person(x, y, colors[i], k),
        at(label, x, y - 0.5 * k - 0.1, { color: colors[i], width: P ? 6.5 : 4.8, size: 22 })];
    }));
  }
  function library(count, reveal, focus = -1) {
    const top = P ? 2.25 : 0.81;
    const start = P ? 0.35 : -0.48;
    const gap = P ? 1.85 : 0.94;
    return new M.VGroup(card(0, top, wide, 'Library announcement', ANN),
      ...request.slice(0, count).map((lines, i) => {
        const y = start - i * gap;
        const rows = i < reveal ? [...lines, ...answers[i]] : lines;
        const lh = P ? 0.38 : 0.34;
        const h = Math.max(P ? 1.1 : 0.84, rows.length * lh + 0.3);
        return new M.VGroup(
          rect(0, y, wide, h, focus === i ? colors[i] : C.line),
          ...rows.map((s, k) => at(s, 0, y + ((rows.length - 1) / 2 - k) * lh,
            { size: P ? 21 : 21, width: wide - 0.45, color: k >= lines.length ? colors[i] : C.ink })));
      }));
  }
  function desk(varied, heading = 'University information desk') {
    const rows = varied ? ['Question · Short summary · Find a date'] : ['Question · Question · Question'];
    const verdict = varied ? ['Unfamiliar request →', 'can respond'] : ['Unfamiliar request →', 'unsure how to respond'];
    return new M.VGroup(
      person(0, P ? 1.3 : 0.46, C.ink, P ? 1.5 : 1),
      card(0, P ? -0.9 : -0.36, wide, heading, rows, varied ? C.green : C.cyan),
      ...(P ? verdict.map((s, k) => at(s, 0, -2.6 - k * 0.5, { color: varied ? C.green : C.amber, size: 22 }))
        : [at(verdict.join(' '), 0, -1.59, { color: varied ? C.green : C.amber, width: wide })]));
  }
  function practise() {
    const kinds = ['Question', 'Short summary', 'Find a date'];
    return new M.VGroup(
      person(0, P ? 1.3 : 0.75, C.ink, P ? 1.5 : 1),
      card(0, P ? -0.6 : -0.32, wide, 'Campus writing assistant', ['Practise with examples of different requests']),
      ...kinds.flatMap((k, i) => {
        const x = P ? 0 : (i - 1) * 2.8;
        const y = P ? -2.2 - i * 0.85 : -1.6;
        return [rect(x, y, P ? 4.2 : 2.5, 0.6, C.green), at(k, x, y, { size: 20, color: C.green })];
      }));
  }
  await beat(0, () => [...stage(opening(['Student', 'Student'])), ...say('CAMPUS WRITING ASSISTANT')]);
  await beat(1, () => stage(opening(['A question', 'A short summary'])));
  await beat(2, () => say('ONE ASSISTANT, DIFFERENT REQUESTS?', C.amber));
  await beat(3, () => [...stage(library(0, 0)), ...say('ONE ANNOUNCEMENT')]);
  await beat(4, () => [...stage(library(1, 0, 0)), ...say('ASK A QUESTION')]);
  await beat(5, () => stage(library(1, 1, 0)));
  await beat(6, () => [...stage(library(2, 1, 1)), ...say('GIVE A SHORT SUMMARY', C.violet)]);
  await beat(7, () => stage(library(2, 2, 1)));
  await beat(8, () => [...stage(library(3, 2, 2)), ...say('FIND THE DAY', C.green)]);
  await beat(9, () => stage(library(3, 3, 2)));
  await beat(10, () => [...stage(library(3, 3)), ...say('SAME ANNOUNCEMENT, DIFFERENT REQUESTS')]);
  await beat(11, () => say('INSTRUCTION = A REQUEST THAT SAYS WHAT TO DO'));
  await beat(12, () => [...stage(new M.VGroup(person(0, P ? 1.3 : 0.7, C.ink, P ? 1.5 : 1),
    card(0, P ? -0.9 : -0.36, wide, 'University information desk', ['A new person learns the job']))),
  ...say('PRACTISE AT THE INFORMATION DESK')]);
  await beat(13, () => [...stage(desk(false)), ...say('PRACTISE ONE KIND OF QUESTION', C.amber)]);
  await beat(14, () => [...stage(desk(true)), ...say('PRACTISE DIFFERENT REQUESTS', C.green)]);
  await beat(15, () => [...stage(practise()), ...say('TEACH THE LANGUAGE MODEL')]);
  await beat(16, () => say('INSTRUCTION TUNING', C.green));

  // 17–27. Two collections of six demonstrations each.
  const narrow = [
    ['When does it close?', 'At six.'],
    ['Which day does it close early?', 'Friday.'],
    ['Why does it close early?', 'For cleaning.'],
    ['Which place closes early?', 'The library.'],
    ['Does it close at six?', 'Yes.'],
    ['Is the closing time nine?', 'No, at six.'],
  ];
  // [wording lines on phone, answer lines on phone, task, place]
  const varied = [
    [['Answer this:', 'when does it close?'], ['At six.'], 'Question', 'Library'],
    [['Give me a short', 'summary.'], ['Library closes at six', 'on Friday for cleaning.'], 'Summary', 'Library'],
    [['Find the date:', 'when is it closed?'], ['Monday.'], 'Find a date', 'Gym'],
    [['In a few words, what', 'changes at the gym?'], ['Closed on Monday.'], 'Summary', 'Gym'],
    [['Which day is the', 'café closed?'], ['Sunday.'], 'Question', 'Café'],
    [['Pick out the day', 'it reopens.'], ['Monday.'], 'Find a date', 'Café'],
  ];
  function collections(level, focus = -1) {
    const dx = P ? 1.95 : 3.3, width = P ? 3.8 : 6.3;
    const top = P ? 3.05 : 1.22, pitch = P ? 1.48 : 0.75;
    const lh = P ? 0.34 : 0.28;
    const rows = [];
    for (let i = 0; i < 6; i++) {
      const y = top - 0.3 - pitch / 2 - i * pitch;
      // left: the first collection
      let left = [];
      if (level === 0 || (level === 1 && i > 0)) left = [[`Demonstration ${i + 1}`, C.muted]];
      else if (level === 1) left = [[narrow[0][0], C.ink], [narrow[0][1], C.cyan]];
      else {
        left = P ? [['Answer the question:', C.amber], [narrow[i][0], C.ink]]
          : [[`Answer the question: ${narrow[i][0]}`, C.ink]];
        if (level === 3) left.push(['Library', C.cyan]);
        if (level >= 4) left.push([narrow[i][1], C.cyan]);
      }
      // right: the varied collection
      const [wording, answer, task, place] = varied[i];
      let right = [];
      if (level < 4) right = [[`Demonstration ${i + 1}`, C.muted]];
      else {
        right = (P ? wording : [wording.join(' ')]).map(s => [s, C.ink]);
        let detail = '';
        if ((level === 5 && task === 'Question') || (level === 6 && task !== 'Question')) detail = task;
        if (level === 7) detail = place;
        if (detail) right.push([detail, C.green]);
        if (level >= 10) (P ? answer : [answer.join(' ')]).forEach(s => right.push([s, C.green]));
      }
      const leftBorder = level === 3 ? C.cyan : C.line;
      const rightBorder = focus === i ? C.amber : (right.some(r => r[1] === C.green) ? C.green : C.line);
      for (const [x, lines, border] of [[-dx, left, leftBorder], [dx, right, rightBorder]]) {
        rows.push(rect(x, y, width, pitch - 0.08, border));
        // keep the words in the box: shrink the line gap only if a box holds many lines
        const g = Math.min(lh, (pitch - 0.2) / Math.max(1, lines.length));
        lines.forEach(([s, c], k) => rows.push(at(s, x, y + ((lines.length - 1) / 2 - k) * g,
          { size: P ? 16 : 17, color: c, width: width - 0.22 })));
      }
    }
    return new M.VGroup(
      at('First collection · 6', -dx, top, { color: C.cyan, width, size: 20 }),
      at('Varied collection · 6', dx, top, { color: C.green, width, size: 20 }), ...rows);
  }
  await beat(17, () => [...stage(collections(0)), ...say('SIX DEMONSTRATIONS IN EACH COLLECTION')]);
  await beat(18, () => [...stage(collections(1)), ...say('DEMONSTRATION = REQUEST + WANTED ANSWER')]);
  await beat(19, () => [...stage(collections(2)), ...say('SAME OPENING WORDS', C.amber)]);
  await beat(20, () => [...stage(collections(3)), ...say('ALL SIX ABOUT THE LIBRARY')]);
  await beat(21, () => [...stage(collections(4)), ...say('SIX DIFFERENT INSTRUCTIONS', C.green)]);
  await beat(22, () => [...stage(collections(5)), ...say('ANSWER A QUESTION', C.green)]);
  await beat(23, () => [...stage(collections(6)), ...say('GIVE A SUMMARY OR FIND A DATE', C.green)]);
  await beat(24, () => [...stage(collections(7)), ...say('LIBRARY, GYM AND CAFÉ', C.green)]);
  await beat(25, () => [...stage(collections(8, 3)), ...say('THE GYM REQUEST', C.amber)]);
  await beat(26, () => [...stage(collections(9, 4)), ...say('THE CAFÉ REQUEST', C.amber)]);
  await beat(27, () => [...stage(collections(10)), ...say('BRIEF ANSWERS, KEY FACT FIRST', C.green)]);

  // 28–35. Two copies of the same pretrained network.
  const R = P ? 0.3 : 0.27;
  const centers = P ? [[-0.3, 1.35, 0], [-0.3, -2.75, 0]] : [[-3.6, -0.55, 0], [3.3, -0.55, 0]];
  const nets = centers.map(center => net({ layers: [2, 3, 3], center,
    width: P ? 4.6 : 4.5, height: P ? 2.2 : 1.9, r: R }));
  const weightPattern = [[[0.7, -0.4, 0.3], [-0.2, 0.55, 0.35]],
    [[0.4, -0.5, 0.2], [0.3, 0.67, -0.3], [-0.6, 0.38, 0.7]]];
  const layerValues = [['1', '0'], ['0.7', '0.2', '0.3']];
  const nodeLabels = [];
  let networkLabels;
  const outLetters = new M.VGroup(...nets.flatMap(N => ['A', 'B', 'C'].map((s, i) => {
    const [x, y] = N.pos(2, i);
    return at(s, x + R + 0.3, y, { size: 20, color: [C.cyan, BLUE, C.pink][i], mono: true });
  })));
  function netLabels(trained) {
    return new M.VGroup(...centers.map(([x, y], i) => at(
      trained ? (i === 0 ? 'First collection → first model' : 'Varied collection → second model') : `Pretrained copy ${i + 1}`,
      P ? 0 : x, y + (P ? 1.55 : 1.4), { size: 20, color: i === 0 ? C.cyan : C.green, width: P ? 7 : 6 })));
  }
  const weights = (N, delta = 0) => weightPattern.flatMap((layer, l) =>
    layer.flatMap((row, i) => row.flatMap((weight, j) => N.weight(l, i, j, weight + (j === 0 ? delta : 0)))));
  function values(N, layer, entries) {
    return entries.flatMap((value, i) => {
      const animations = N.value(layer, i, value);
      nodeLabels.push(animations[0].mobject);
      return animations;
    });
  }
  function backwards(N, layer) {
    return new M.LaggedStart(N.edges[layer].flatMap((row, i) => row.map((_, j) => {
      const from = N.pos(layer + 1, j), to = N.pos(layer, i);
      const start = new M.Dot({ point: [from[0] - R, from[1], 0], radius: 0.05, color: C.amber });
      const end = new M.Dot({ point: [to[0] + R, to[1], 0], radius: 0.05, color: C.amber });
      return new M.LaggedStart([new M.Transform(start, end, { runTime: 0.56 }),
        new M.FadeOut(start, { runTime: 0.12 })], { lagRatio: 1 });
    })), { lagRatio: 0.04, runTime: 0.94 });
  }
  const compareCard = () => card(0, P ? -5.4 : -2.55, P ? 7 : 8.5, 'Compare with the demonstration',
    P ? ['Wanted answer: A · At six.', 'Model probability for A: 20%'] : ['Wanted answer: A · At six.   Model probability for A: 20%'], C.amber, 20);
  await beat(28, () => {
    networkLabels = netLabels(false);
    return [...stage(null), ...nets.map(N => new M.FadeIn(N.group)), new M.FadeIn(networkLabels),
      ...say('TWO COPIES OF THE PRETRAINED MODEL')];
  });
  await beat(29, () => {
    const a = nets[0].pos(0, 1), b = nets[0].pos(1, 2);
    const label = at('weight 0.35', (a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 0.32, { size: 16, color: C.cyan, mono: true });
    nodeLabels.push(label);
    return [...nets.flatMap(N => weights(N)), new M.FadeIn(label), ...say('EACH LINE HAS A WEIGHT')];
  });
  await beat(30, () => {
    const previous = networkLabels;
    networkLabels = netLabels(true);
    return [new M.FadeOut(previous), new M.FadeIn(networkLabels), new M.FadeOut(nodeLabels.pop()),
      ...say('ONE COLLECTION FOR EACH MODEL', C.green)];
  });
  await until(S(31));
  await play(...say('AN INSTRUCTION GOES LEFT TO RIGHT', C.amber),
    ...nets.flatMap(N => [...values(N, 0, layerValues[0]), ...N.flow(0)]));
  await play(...nets.flatMap(N => [...values(N, 1, layerValues[1]), ...N.flow(1)]));
  await beat(32, () => [...nets.flatMap(N => values(N, 2, ['20', '30', '50'])), new M.FadeIn(outLetters),
    ...say('A PROBABILITY (%) FOR EACH ANSWER')]);
  await beat(33, () => [...stage(compareCard()), ...say('COMPARE WITH THE WANTED ANSWER', C.amber)]);
  await beat(34, () => say('LOSS = HOW POORLY THE MODEL MATCHES', C.amber));
  await until(S(35));
  await play(...say('GRADIENTS GO RIGHT TO LEFT', C.amber), ...nets.map(N => backwards(N, 1)));
  await play(...nets.map(N => backwards(N, 0)));
  await play(...nets.flatMap(N => weights(N, 0.17)));
  await beat(36, () => [
    ...nets.map(N => new M.FadeOut(N.group)), new M.FadeOut(networkLabels), new M.FadeOut(outLetters),
    ...nodeLabels.map(t => new M.FadeOut(t)),
    ...stage(new M.VGroup(
      card(0, P ? 1.2 : 0.55, wide, 'Library demonstration', [...ANN, ...QUE]),
      card(0, P ? -1.9 : -1.25, wide, 'Wanted answer', ['At six.'], C.green, 24))),
    ...say('BACK TO THE LIBRARY EXAMPLE')]);

  // 37–41. Use the shared, rounded training values.
  const steps = [
    { p: [20, 30, 50], loss: 1.61 },
    { p: [46, 23, 31], loss: 0.78, changes: '+0.80 / −0.30 / −0.50' },
    { p: [66, 15, 19], loss: 0.42, changes: '+0.54 / −0.23 / −0.31' },
    { p: [76, 11, 13], loss: 0.27, changes: '+0.34 / −0.15 / −0.19' },
    { p: [82, 8, 10], loss: 0.20 },
    { p: [86, 7, 8], loss: 0.15 },
  ];
  function bars(source) {
    const cols = [C.cyan, BLUE, C.pink];
    return ['A  At six.', 'B  Long reply', 'C  At nine.'].flatMap((name, i) => {
      const y = (P ? 0.3 : 0.45) - i * (P ? 0.85 : 0.72);
      const left = P ? -1.2 : -4.75;
      const barWidth = P ? 3.6 : 2.6;
      const width = Math.max(0.03, barWidth * source[i] / 100);
      const labelX = P ? -2.75 : -5.9;
      return [
        at(name, labelX, y, { size: 18, color: cols[i], width: P ? 2.4 : 1.75 }),
        rect(left + barWidth / 2, y, barWidth, 0.26, C.line),
        rect(left + width / 2, y, width, 0.26, cols[i], cols[i], 0.85),
        at(`${source[i]}%`, left + barWidth + 0.45, y, { size: 19, color: cols[i], mono: true }),
      ];
    });
  }
  function lossPlot(step) {
    const x0 = P ? -2.7 : -0.6, x1 = P ? 3.2 : 2.4;
    const bottom = P ? -5.6 : -1.85, top = P ? -2.6 : 0.45;
    const x = i => x0 + (x1 - x0) * i / 5;
    const y = loss => bottom + (top - bottom) * loss / 1.8;
    const seen = steps.slice(0, step + 1);
    return [
      at('Loss by step', (x0 + x1) / 2, top + 0.35, { size: 19, color: C.amber }),
      line(x0, bottom, x1, bottom), line(x0, bottom, x0, top),
      at('loss', x0 - 0.38, (top + bottom) / 2, { size: 16, color: C.muted }),
      ...seen.slice(1).map(({ loss }, i) => line(x(i), y(seen[i].loss), x(i + 1), y(loss), C.amber)),
      ...seen.flatMap(({ loss }, i) => [
        new M.Dot({ point: [x(i), y(loss), 0], radius: 0.06, color: C.amber }),
        at(String(i), x(i), bottom - 0.28, { size: 16, color: C.muted, mono: true }),
      ]),
    ];
  }
  function iteration(step) {
    const { p, loss, changes } = steps[step];
    const rows = changes ? [`A: ${steps[step - 1].p[0]}% → ${p[0]}%`,
      `Loss: ${steps[step - 1].loss.toFixed(2)} → ${loss.toFixed(2)}`,
      'Logit change (A / B / C)', [changes, C.cyan]] :
      [`A: ${p[0]}%`, [`Loss: ${loss.toFixed(2)}`, C.amber]];
    return [...stage(new M.VGroup(
      at(`Step ${step} · Wanted answer A`, P ? 0 : -4.1, P ? 1.05 : 1.2, { size: 21, color: C.cyan }),
      ...bars(p), ...lossPlot(step))), ...fbox(rows, C.amber)];
  }
  for (let i = 0; i < 4; i++) {
    await beat(37 + i, () => [...iteration(i), ...say(i === 0 ? 'BEFORE TRAINING' : `LEARNING STEP ${i}`, C.amber)]);
  }
  await beat(41, () => [...iteration(4), ...say('REPEAT ACROSS MANY DEMONSTRATIONS', C.green)]);
  await until(S(41) + 1.5);
  await play(...iteration(5));

  // 42–54. Ten new requests, same style check for both models.
  const first = [true, false, false, true, false, false, false, true, false, false];
  const second = [true, true, true, true, false, true, true, true, false, true];
  function results({ visible = 0, score = 0, prompt = '', rule = false, equal = false } = {}) {
    const center = P ? 0 : CX;
    const dx = P ? 0.68 : 0.63;
    const bh = P ? 0.6 : 0.42;
    const y0 = P ? 0.2 : -0.45;
    const rows = [first, second].flatMap((flags, i) => {
      const y = y0 - i * (P ? 2.6 : 1.6);
      const color = i === 0 ? C.cyan : C.green;
      const rate = i === 0 ? '3 / 10 = 30%' : '8 / 10 = 80%';
      return [at(`${i === 0 ? 'First model' : 'Varied model'}${equal ? ' · 6 demonstrations' : ''}`,
        center, y + bh / 2 + 0.3, { size: 21, color }),
      ...flags.flatMap((ok, j) => {
        const x = center + (j - 4.5) * dx;
        const marked = i < visible;
        const ink = marked ? (ok ? C.green : C.pink) : C.line;
        return [rect(x, y, dx - 0.08, bh, ink, ok && marked ? C.green : C.card, ok && marked ? 0.2 : 0.92),
          at(marked ? (ok ? '✓' : '✗') : String(j + 1), x, y, { size: 18, color: marked ? ink : C.muted, mono: true })];
      }),
      ...(i < score ? [at(rate, center, y - bh / 2 - 0.3, { size: 21, color, mono: true })] : [])];
    });
    const top = prompt ? card(center, P ? 2.6 : 0.95, P ? 7 : 7.3, 'New request', [prompt], C.amber, 20) : null;
    const legend = rule ? at('✓  Brief answer with the key fact first', center, P ? -3.9 : -3.25,
      { size: 20, color: C.green, width: P ? 7 : 6.5 }) : null;
    return new M.VGroup(...[top, ...rows, legend].filter(Boolean));
  }
  function poolCards(mode) {
    const width = P ? 7 : 8.1;
    const asks = mode === 0 ? pool : 'When does the pool open?';
    return new M.VGroup(
      card(0, P ? 2.3 : 0.8, width, 'Pool request', [asks], C.cyan, 21),
      card(0, P ? 0.3 : -0.55, width, 'Pool announcement', ['No announcement available'], C.amber, 21),
      ...(mode ? [card(0, P ? -2.0 : -2.0, width, 'Assistant answer',
        ['At eight.', mode === 1 ? 'Made up' : 'Needs a reliable pool announcement'], C.pink, 21)] : []));
  }
  await beat(42, () => [...fbox([]), ...stage(results()), ...say('TEN NEW REQUESTS')]);
  await beat(43, () => stage(results({ prompt: pool })));
  await beat(44, () => [...stage(results({ prompt: pool, rule: true })), ...say('CHECK THE ANSWER STYLE')]);
  await beat(45, () => [...stage(results({ visible: 1, rule: true })), ...say('FIRST MODEL: 3 OF 10')]);
  await beat(46, () => [...stage(results({ visible: 2, rule: true })), ...say('VARIED MODEL: 8 OF 10', C.green)]);
  await beat(47, () => [...fbox(['success rate =', 'successful answers', '÷ total requests']),
    ...say('SUCCESS RATE')]);
  await beat(48, () => [...stage(results({ visible: 2, score: 1 })),
    ...fbox(['First model', '3 ÷ 10 = 30%']), ...say('FIRST MODEL: 30%')]);
  await beat(49, () => [...stage(results({ visible: 2, score: 2 })),
    ...fbox(['Varied model', ['8 ÷ 10 = 80%', C.green]], C.green), ...say('VARIED MODEL: 80%', C.green)]);
  await beat(50, () => [...fbox([]), ...stage(results({ visible: 2, score: 2, equal: true })),
    ...say('SAME NUMBER OF DEMONSTRATIONS', C.green)]);
  await beat(51, () => [...stage(poolCards(0)), ...say('DO WE KNOW THE POOL HOURS?', C.amber)]);
  await beat(52, () => [...stage(poolCards(1)), ...say('A BRIEF ANSWER CAN BE MADE UP', C.pink)]);
  await beat(53, () => [...stage(poolCards(2)), ...say('ANSWERS NEED RELIABLE INFORMATION', C.amber)]);
  await beat(54, () => [...stage(collections(10)), ...say('LEARN FROM VARIED DEMONSTRATIONS', C.green)]);
}
