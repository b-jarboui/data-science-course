// 20.2.1 Supervised fine-tuning: teaching a model with good answers.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 3.85, 0] : [0, 1.85, 0];
  const BOXP = P ? [0, 2.3, 0] : [4.3, 0.65, 0];
  const BLUE = '#a5baff';
  const REPLIES = ['C', 'B', 'A'];
  const COLORS = [C.pink, BLUE, C.cyan];
  const ANNOUNCEMENT = ['The library closes at six', 'on Friday for cleaning.'];
  const QUESTION = ['When does the library', 'close on Friday?'];
  const ANSWERS = [
    ['At nine.  (wrong time)'],
    ['Thanks for asking! The newsletter', 'says the library will close at six', 'this Friday for cleaning.'],
    ['At six.'],
  ];

  const start = [0.5, 0.3, 0.2];
  const chances = [[50, 30, 20], [31, 23, 46], [19, 15, 66], [13, 11, 76], [9.68, 8.2, 82], [8, 7, 86]];
  const losses = [1.61, 0.78, 0.42, 0.27, 0.20, 0.15];
  const changes = [
    ['−0.50', '−0.30', '+0.80'],
    ['−0.31', '−0.23', '+0.54'],
    ['−0.19', '−0.15', '+0.34'],
  ];
  let exact = start;
  for (let step = 1; step <= 16; step++) {
    const shares = exact.map((p, i) => p * Math.exp(Number(i === 2) - p));
    const total = shares.reduce((sum, share) => sum + share, 0);
    exact = shares.map(share => share / total);
    if (step >= chances.length) {
      chances.push(exact.map(p => Math.round(p * 1000) / 10));
      losses.push(-Math.log(exact[2]));
    }
  }

  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const fadeIn = (obj, runTime = 0.38) => new M.FadeIn(obj, { runTime });
  const fadeOut = (obj, runTime = 0.38) => new M.FadeOut(obj, { runTime });
  const point = (x, y) => [x, y, 0];

  function label(s, x, y, { size = 19, color = C.ink, mono = false, width = FW - 0.9, align = 'center' } = {}) {
    const t = T(s, size, color, mono);
    if (t.getWidth() > width) t.scale(width / t.getWidth());
    const w = Math.min(t.getWidth(), width);
    t.moveTo(point(align === 'left' ? x + w / 2 : x, y));
    return t;
  }

  function panel(x, y, w, h, color, opacity = 0.92) {
    const r = new M.RoundedRectangle({ width: w, height: h, cornerRadius: 0.14, color, strokeWidth: 2 });
    r.setFill(C.card, opacity);
    r.moveTo(point(x, y));
    return r;
  }

  // card height grows with its lines, so the last line never touches the border
  const LH = P ? 0.3 : 0.28;
  const cardH = n => Math.max(P ? 1.15 : 1.0, 0.62 + n * LH + (P ? 0.12 : 0.08));
  function card(x, y, w, h, title, lines, color = C.cyan, size = P ? 19 : 19) {
    const hh = Math.max(h, cardH(lines.length));
    const left = x - w / 2 + 0.22;
    const titleY = y + hh / 2 - 0.24;
    return new M.VGroup(
      panel(x, y, w, hh, color),
      label(title, left, titleY, { width: w - 0.44, align: 'left', mono: true, color, size: P ? 16 : 17 }),
      ...lines.map((line, i) => label(line, left, titleY - 0.34 - i * LH, {
        width: w - 0.44, align: 'left', size,
      })),
    );
  }

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const lh = P ? 0.4 : 0.41;
    const maxWidth = P ? FW - 0.8 : 4.55;
    const rows = lines.map(line => Array.isArray(line) ? line : [line, C.ink]);
    const texts = rows.map(([s, c]) => T(s, P ? 21 : 20, c, true));
    const sc = texts.map(t => (t.getWidth() > maxWidth - 0.58 ? (maxWidth - 0.58) / t.getWidth() : 1));
    texts.forEach((t, i) => { if (sc[i] < 1) t.scale(sc[i]); });
    const w = Math.max(...texts.map((t, i) => t.getWidth() * sc[i])) + 0.58;
    const h = rows.length * lh + 0.30;
    const left = BOXP[0] - w / 2 + 0.29;
    const top = BOXP[1] + (rows.length - 1) * lh / 2;
    texts.forEach((t, i) => t.moveTo(point(left + t.getWidth() * sc[i] / 2, top - i * lh)));
    const next = new M.VGroup(panel(BOXP[0], BOXP[1], w, h, color), ...texts);
    const animations = boxNow ? [fadeOut(boxNow), fadeIn(next)] : [fadeIn(next)];
    boxNow = next;
    return animations;
  }

  function clearBox() {
    const animations = boxNow ? [fadeOut(boxNow)] : [];
    boxNow = null;
    return animations;
  }

  function line(a, b, color = C.line, strokeWidth = 2) {
    return new M.Line({ start: a, end: b, color, strokeWidth });
  }

  function bar(left, y, width, fraction, color) {
    const fillWidth = Math.max(0.02, width * fraction);
    const track = panel(left + width / 2, y, width, 0.24, C.line, 0.85);
    const halo = new M.Rectangle({ width: fillWidth, height: 0.34, color, strokeWidth: 0 });
    halo.setFill(color, 0.14);
    halo.moveTo(point(left + fillWidth / 2, y));
    const fill = new M.Rectangle({ width: fillWidth, height: 0.21, color, strokeWidth: 0 });
    fill.setFill(color, 0.92);
    fill.moveTo(point(left + fillWidth / 2, y));
    return new M.VGroup(track, halo, fill);
  }

  // 0–4 Campus assistant, announcement and question.
  const campusX = P ? 0 : -3.05;
  const campusY = P ? 1.0 : 0;
  const cs = P ? 1.4 : 1;
  const roof = new M.Polygon({
    vertices: [point(campusX - 1.12 * cs, campusY + 0.28 * cs), point(campusX, campusY + 1.02 * cs),
      point(campusX + 1.12 * cs, campusY + 0.28 * cs)],
    color: BLUE, strokeWidth: 2,
  });
  roof.setFill(BLUE, 0.18);
  const columns = [-0.75, -0.25, 0.25, 0.75].map(dx => {
    const p = new M.Rectangle({ width: 0.20 * cs, height: 1.02 * cs, color: BLUE, strokeWidth: 2 });
    p.setFill(BLUE, 0.32);
    return p.moveTo(point(campusX + dx * cs, campusY - 0.30 * cs));
  });
  const campus = new M.VGroup(roof, ...columns,
    line(point(campusX - 1.16 * cs, campusY - 0.85 * cs), point(campusX + 1.16 * cs, campusY - 0.85 * cs), BLUE),
    label('UNIVERSITY', campusX, campusY - 1.18 * cs, { mono: true, color: BLUE }));
  const assistantX = P ? 0 : 2.75;
  const assistantY = P ? -2.3 : -0.10;
  const assistantW = P ? 6.6 : 4.45;
  let assistant = card(assistantX, assistantY, assistantW, 1.15, 'CAMPUS ASSISTANT',
    ['Helps students find information']);
  await until(S(0)); await play(fadeIn(campus), fadeIn(assistant), ...say('A UNIVERSITY ASSISTANT'));
  await until(S(1));
  const newsletters = card(assistantX, P ? -4.0 : -1.55, assistantW, 1.05, 'UNIVERSITY NEWSLETTERS',
    ['Learned to continue text'], BLUE);
  await play(fadeIn(newsletters), ...say('LEARNED TO CONTINUE TEXT', BLUE));
  await until(S(2));
  const shortReply = card(assistantX, assistantY, assistantW, 1.15, 'CAMPUS ASSISTANT',
    ['Short, correct replies?'], C.amber);
  await play(fadeOut(assistant), fadeIn(shortReply), ...say('CAN IT ANSWER QUESTIONS?', C.amber));
  assistant = shortReply;

  const promptW = P ? 6.6 : 6.7;
  const announcement = card(0, P ? -1.6 : 0.68, promptW, 1.24, 'ANNOUNCEMENT', ANNOUNCEMENT, BLUE);
  const question = card(0, P ? -3.5 : -0.79, promptW, 1.24, 'STUDENT QUESTION', QUESTION, C.amber);
  await until(S(3));
  // phone: the university stays on top, the two cards fill the lower half
  await play(...(P ? [] : [fadeOut(campus)]), fadeOut(assistant), fadeOut(newsletters), fadeIn(announcement),
    ...say('THE LIBRARY ANNOUNCEMENT', BLUE));
  await until(S(4)); await play(fadeIn(question), ...say('A STUDENT ASKS', C.amber));

  // 5–12 The three replies and their starting probabilities.
  const replyY = i => (P ? 2.4 - i * 3.1 : 1.05 - i * 1.36);
  function replyCard(i, withBars = false, revealed = true) {
    const x = withBars && !P ? -2.55 : 0;
    const w = withBars && !P ? 6.65 : promptW;
    return card(x, replyY(i), w, i === 1 ? 1.3 : 1.0, `REPLY ${REPLIES[i]}`,
      revealed ? ANSWERS[i] : (i === 1 ? [' ', ' ', ' '] : [' ']), COLORS[i]);
  }

  const replyCards = REPLIES.map((_, i) => replyCard(i, false, false));
  await until(S(5));
  await play(fadeOut(announcement), fadeOut(question), ...(P ? [fadeOut(campus)] : []),
    new M.LaggedStart(replyCards.map(obj => fadeIn(obj)), { lagRatio: 0.25, runTime: 0.80 }),
    ...say('THREE POSSIBLE REPLIES'));
  for (let i = 0; i < REPLIES.length; i++) {
    await until(S(6 + i));
    const next = replyCard(i);
    await play(fadeOut(replyCards[i]), fadeIn(next), ...say(`REPLY ${REPLIES[i]}`, COLORS[i]));
    replyCards[i] = next;
  }

  const introLeft = P ? -2.75 : 1.30;
  const introWidth = P ? 4.6 : 3.80;
  const introLabelX = introLeft + introWidth + (P ? 0.6 : 0.6);
  const barY = i => (P ? replyY(i) - (i === 1 ? 1.22 : 0.98) : replyY(i));
  const introTracks = REPLIES.map((_, i) => panel(introLeft + introWidth / 2, barY(i), introWidth, 0.24, C.line));
  const introBars = [];
  await until(S(9));
  if (P) {
    await play(...introTracks.map(obj => fadeIn(obj)), ...say('A BAR FOR EACH PROBABILITY'));
  } else {
    const compactReplies = REPLIES.map((_, i) => replyCard(i, true));
    await play(...replyCards.map(obj => fadeOut(obj)), ...compactReplies.map(obj => fadeIn(obj)),
      ...introTracks.map(obj => fadeIn(obj)), ...say('A BAR FOR EACH PROBABILITY'));
    compactReplies.forEach((obj, i) => { replyCards[i] = obj; });
  }
  for (let i = 0; i < REPLIES.length; i++) {
    await until(S(10 + i));
    const p = chances[0][i];
    const obj = new M.VGroup(
      bar(introLeft, barY(i), introWidth, p / 100, COLORS[i]),
      label(`${p}%`, introLabelX, barY(i), { color: COLORS[i], mono: true, size: 21 }),
    );
    introBars.push(obj);
    await play(fadeOut(introTracks[i]), fadeIn(obj), ...say(i === 2 ? 'THE ANSWER WE WANT' : `REPLY ${REPLIES[i]}`, COLORS[i]));
  }

  // 13–17 Put the prompt and the demonstrated answer together.
  const demoX = P ? 0 : -2.5;
  const demoW = P ? 6.6 : 6.3;
  const answerX = P ? 0 : 3.55;
  const answerY = P ? -2.4 : -0.08;
  const answerW = P ? 6.6 : 4.35;
  function demonstrationPrompt() {
    return card(demoX, P ? 0.3 : -0.08, demoW, 1.84, 'PROMPT',
      [...ANNOUNCEMENT, ...QUESTION], BLUE);
  }
  function demonstrationAnswer(text, color = C.cyan) {
    return card(answerX, answerY, answerW, 1.12, 'DEMONSTRATED ANSWER', [text], color);
  }

  const demoIntro = card(0, P ? -0.6 : -0.14, promptW, 1.12, 'CAMPUS ASSISTANT',
    ['Learn from examples of good answers'], C.green);
  await until(S(13));
  await play(...replyCards.map(obj => fadeOut(obj)), ...introBars.map(obj => fadeOut(obj)),
    fadeIn(demoIntro), ...say('TEACH WITH EXAMPLES', C.green));
  const prompt = demonstrationPrompt();
  const goodAnswer = demonstrationAnswer('At six.');
  await until(S(14)); await play(fadeOut(demoIntro), fadeIn(prompt), ...say('ANNOUNCEMENT + QUESTION = PROMPT', BLUE));
  await until(S(15)); await play(fadeIn(goodAnswer), ...say('THE ANSWER WE WANT'));
  const pairLeft = P ? -3.75 : -5.85;
  const pairRight = P ? 3.75 : 5.95;
  const pairBottom = P ? -3.35 : -1.30;
  const pairTop = P ? 1.75 : 1.06;
  const pairOutline = new M.RoundedRectangle({
    width: pairRight - pairLeft, height: pairTop - pairBottom, cornerRadius: 0.18, color: C.green, strokeWidth: 2,
  });
  pairOutline.moveTo(point((pairLeft + pairRight) / 2, (pairTop + pairBottom) / 2));
  const termY = P ? -4.1 : -1.85;
  const term1 = label('prompt + good answer = DEMONSTRATION', 0, termY, { color: C.green, mono: true, size: P ? 17 : 20 });
  const term2 = label('training a trained model on them = SUPERVISED FINE-TUNING', 0, termY - (P ? 0.75 : 0.55),
    { color: C.green, mono: true, size: P ? 17 : 20, width: FW - 0.7 });
  await until(S(16)); await play(new M.Create(pairOutline, { runTime: 0.6 }), fadeIn(term1), ...say('ONE DEMONSTRATION', C.green));
  await until(S(17)); await play(fadeIn(term2), ...say('SUPERVISED FINE-TUNING', C.green));

  // 18–24 Look inside the model, then show the gradients flowing back.
  const R = P ? 0.38 : 0.32;
  const N = L.net({
    layers: [2, 2, 3],
    center: P ? [-0.75, -1.5, 0] : [-0.65, -0.48, 0],
    width: P ? 4.3 : 7.0,
    height: P ? 6.0 : 2.72,
    r: R,
  });
  const networkValues = [];
  function values(layer, list) {
    return list.flatMap((val, i) => {
      const animations = N.value(layer, i, val);
      networkValues.push(animations[0].mobject);
      return animations;
    });
  }

  const promptLabel = label('Prompt', N.pos(0, 0)[0], N.pos(0, 0)[1] + R + 0.32, { color: C.violet });
  const scoreValues = start.map(Math.log);
  const weights = [
    [[0.7, -0.2], [0.3, 1.2]],
    [[0.5, -0.6, 0.3], scoreValues.map((v, i) => v - [0.5, -0.6, 0.3][i])],
  ];
  const weightTags = [];
  const [firstX, firstY] = N.pos(0, 0);
  const [secondX] = N.pos(1, 0);
  weightTags.push(label('weight 0.7', (firstX + secondX) / 2, firstY + 0.36, { color: C.cyan, mono: true, size: 16 }));
  const outX = N.pos(2, 0)[0] + R + 0.2;
  const scoreLabels = REPLIES.map((reply, i) => {
    const [, y] = N.pos(2, i);
    return label(`Reply ${reply}`, outX, y, { color: COLORS[i], align: 'left', size: 18 });
  });
  const chanceLabels = REPLIES.map((reply, i) => {
    const [, y] = N.pos(2, i);
    return label(`${reply} · ${chances[0][i]}%`, outX, y, { color: COLORS[i], align: 'left', mono: true, size: 19 });
  });
  const logitTag = label('logits', N.pos(2, 0)[0], N.pos(2, 0)[1] + R + 0.3, { color: C.amber, mono: true, size: 17 });

  await until(S(18)); await play(fadeOut(prompt), fadeOut(goodAnswer), fadeOut(pairOutline), fadeOut(term1), fadeOut(term2),
    ...say('INSIDE THE MODEL', C.violet));
  await until(S(19));
  await play(fadeIn(N.group), ...say('NEURONS IN LAYERS', C.violet));
  await until(S(20));
  await play(fadeIn(promptLabel), ...values(0, ['1', '1']), ...say('THE PROMPT ENTERS ON THE LEFT'));
  await play(...N.flow(0), ...values(1, ['1', '1']));
  await play(...N.flow(1));
  await until(S(21));
  await play(...weights.flatMap((layer, l) => layer.flatMap((row, i) => row.flatMap((w, j) =>
    N.weight(l, i, j, w)))), ...weightTags.map(obj => fadeIn(obj)), ...say('A WEIGHT ON EACH LINE', C.cyan));
  await until(S(22));
  await play(...values(2, scoreValues.map(v => v.toFixed(1))), ...scoreLabels.map(obj => fadeIn(obj)), fadeIn(logitTag),
    ...say('ONE LOGIT FOR EACH REPLY', C.amber));
  await until(S(23));
  await play(...scoreLabels.map(obj => fadeOut(obj)), ...chanceLabels.map(obj => fadeIn(obj)),
    ...say('HIGHER LOGIT, HIGHER PROBABILITY', C.amber));

  function reverseLayer(layer) {
    const pulses = N.edges[layer].flatMap((row, i) => row.map((_, j) => {
      const [x0, y0] = N.pos(layer, i);
      const [x1, y1] = N.pos(layer + 1, j);
      return {
        from: new M.Dot({ point: point(x1 - R, y1), radius: 0.07, color: C.amber }),
        to: new M.Dot({ point: point(x0 + R, y0), radius: 0.07, color: C.amber }),
      };
    }));
    return new M.LaggedStart(
      pulses.map(({ from, to }) => new M.Transform(from, to, { runTime: 0.56 })),
      { lagRatio: 0.08, runTime: 0.92 },
    );
  }

  await until(S(24)); await play(...say('GRADIENTS FLOW BACK', C.amber));
  const fromOutput = reverseLayer(1);
  await play(fromOutput);
  const fromHidden = reverseLayer(0);
  await play(fromHidden, ...fromOutput.animations.map(animation => fadeOut(animation.mobject)));
  await play(...fromHidden.animations.map(animation => fadeOut(animation.mobject)));

  // 25–47 Work through the reply logits and grow the loss curve.
  const BX = CX - (P ? 2.45 : 2.20);
  const BW = P ? 4.6 : 4.72;
  const BY = i => (P ? 0.35 - i * 1.0 : 0.91 - i * 0.92);
  const GX0 = P ? -2.85 : 2.78;
  const GX1 = P ? 3.3 : 6.46;
  const GY0 = P ? -5.9 : -2.52;
  const GY1 = P ? -3.25 : -1.00;

  function scoreBoard(step, mode = 'percent', focus = -1, delta = null) {
    const title = label(`STEP ${step}`, CX, P ? 1.05 : 1.46, { color: C.muted, mono: true, size: 17 });
    const rows = REPLIES.flatMap((reply, i) => {
      const p = chances[step][i];
      const y = BY(i);
      const c = COLORS[i];
      const number = mode === 'fraction' ? (p / 100).toFixed(2) : `${Math.round(p)}%`;
      const text = focus === i ? C.amber : c;
      return [
        label(reply, BX - 0.36, y, { color: text, mono: true, size: 22 }),
        bar(BX, y, BW, p / 100, c),
        label(number, BX + BW + 0.55, y, { color: text, mono: true, size: 20 }),
        ...(delta?.[i] ? [label(`logit ${delta[i]}`, BX, y - 0.36, {
          color: i === 2 ? C.cyan : C.pink, mono: true, align: 'left', size: 16,
        })] : []),
      ];
    });
    return new M.VGroup(title, ...rows);
  }

  function lossCurve(step) {
    const maxStep = step <= 5 ? 5 : step <= 10 ? 10 : 20;
    const x = i => GX0 + (GX1 - GX0) * i / maxStep;
    const y = v => GY0 + (GY1 - GY0) * v / 2;
    const points = losses.slice(0, step + 1).map((loss, i) => point(x(i), y(loss)));
    const marks = [0, 1, 2].flatMap(v => [
      line(point(GX0, y(v)), point(GX1, y(v))),
      label(String(v), GX0 - 0.26, y(v), { color: C.muted, mono: true, size: 16 }),
    ]);
    const ticks = [0, ...Array.from({ length: maxStep / 5 }, (_, i) => (i + 1) * 5)];
    return new M.VGroup(
      label('LOSS BY STEP', (GX0 + GX1) / 2, GY1 + 0.36, { color: C.amber, mono: true, size: 17 }),
      line(point(GX0, GY0), point(GX0, GY1), C.muted),
      ...marks,
      ...ticks.map(i => label(String(i), x(i), GY0 - 0.26, { color: C.muted, mono: true, size: 16 })),
      ...points.slice(1).map((p, i) => line(points[i], p, C.amber, 3)),
      ...points.map((p, i) => new M.Dot({ point: p, radius: i === step ? 0.07 : 0.04, color: C.amber })),
    );
  }

  let boardNow = null;
  let plotNow = null;
  function swapBoard(step, mode, focus, delta) {
    const next = scoreBoard(step, mode, focus, delta);
    const animations = boardNow ? [fadeOut(boardNow, 0.25), fadeIn(next, 0.25)] : [fadeIn(next)];
    boardNow = next;
    return animations;
  }

  function swapPlot(step) {
    const next = lossCurve(step);
    const animations = plotNow ? [fadeOut(plotNow, 0.25), fadeIn(next, 0.25)] : [fadeIn(next)];
    plotNow = next;
    return animations;
  }

  await until(S(25));
  await play(fadeOut(N.group), ...networkValues.map(obj => fadeOut(obj)), fadeOut(promptLabel), fadeOut(logitTag),
    ...weightTags.map(obj => fadeOut(obj)), ...chanceLabels.map(obj => fadeOut(obj)),
    ...swapBoard(0), ...swapPlot(-1), ...say('CHANGE THE LOGITS DIRECTLY'));
  await until(S(26)); await play(...swapBoard(0, 'percent', 2), ...say('HOW WRONG ABOUT REPLY A?', C.amber));
  await until(S(27)); await play(...fbox(['loss = −ln(probability of A)', ['natural log, not bits', C.muted]], C.amber),
    ...say('NATURAL LOGARITHM', C.amber));
  await until(S(28));
  await play(...fbox(['probability of A = 20%', 'loss = −ln(0.20)', ['≈ 1.61', C.amber]], C.amber));
  await until(S(29));
  await play(...swapPlot(0), ...fbox(['loss = −ln(0.20)', ['≈ 1.61', C.amber]], C.amber),
    ...say('THE LOSS', C.amber));
  await until(S(30)); await play(...say('MAKE A MORE LIKELY', C.green));
  await until(S(31));
  await play(...swapBoard(0, 'fraction'), ...fbox([['50% → 0.50', C.pink], ['30% → 0.30', BLUE], ['20% → 0.20', C.cyan]]),
    ...say('PROBABILITIES AS FRACTIONS OF ONE'));
  await until(S(32));
  await play(...swapBoard(0, 'fraction', 2), ...fbox(['probability of A = 0.20', ['A increase = 1 − 0.20', C.cyan]]),
    ...say('INCREASE THE LOGIT OF A'));
  await until(S(33));
  await play(...swapBoard(0, 'fraction', 2, [null, null, changes[0][2]]),
    ...fbox(['A increase = 1 − 0.20', ['= +0.80', C.cyan]]));
  await until(S(34));
  await play(...swapBoard(0, 'fraction', -1, changes[0]),
    ...fbox([['C change = −0.50', C.pink], ['B change = −0.30', C.pink], ['A change = +0.80', C.cyan]]),
    ...say('LOWER THE OTHER LOGITS', C.pink));
  await until(S(35));
  await play(...fbox(['new logits', '↓ softmax', ['new probabilities add to 100%', C.cyan]]), ...say('SOFTMAX'));
  await until(S(36)); await play(...swapBoard(1), ...say('STEP 1 · NEW PROBABILITIES'));
  await until(S(37));
  await play(...swapPlot(1), ...fbox(['loss = −ln(probability of A)', ['1.61 → 0.78', C.amber]], C.amber),
    ...say('STEP 1 · LOSS FALLS', C.amber));

  for (let step = 2; step <= 3; step++) {
    const beat = 38 + (step - 2) * 4;
    const prev = step - 1;
    const delta = changes[prev];
    const [e, b, a] = chances[prev].map(p => (p / 100).toFixed(2));
    const [de, db, da] = delta;
    await until(S(beat));
    await play(...swapBoard(prev, 'fraction', 2, [null, null, da]),
      ...fbox([`probability of A ≈ ${a}`, [`A: 1 − ${a} ≈ ${da}`, C.cyan]]),
      ...say(`STEP ${step} · INCREASE A`));
    await until(S(beat + 1));
    await play(...swapBoard(prev, 'fraction', -1, delta),
      ...fbox([[`C: −${e} ≈ ${de}`, C.pink], [`B: −${b} ≈ ${db}`, C.pink], [`A: ≈ ${da}`, C.cyan]]),
      ...say(`STEP ${step} · LOWER C AND B`, C.pink));
    await until(S(beat + 2));
    await play(...swapBoard(step), ...fbox(['softmax gives new probabilities', 'total = 100%']),
      ...say(`STEP ${step} · NEW PROBABILITIES`));
    await until(S(beat + 3));
    await play(...swapPlot(step),
      ...fbox(['loss = −ln(probability of A)', [`${losses[prev].toFixed(2)} → ${losses[step].toFixed(2)}`, C.amber]], C.amber),
      ...say(`STEP ${step} · LOSS FALLS`, C.amber));
  }

  await until(S(46));
  await play(...clearBox(), ...say('REPEAT THE LEARNING STEP'));
  for (let step = 4; step <= 16; step++) {
    await play(...swapBoard(step), ...swapPlot(step));
  }
  await until(S(47));
  await play(...fbox(['as the probability of A rises,', ['1 − probability of A shrinks', C.amber]], C.amber),
    ...say('THE LOSS FALLS MORE SLOWLY', C.amber));

  // 48–50 Summarize the two logit changes.
  await until(S(48)); await play(...clearBox(), ...say('THE LEARNING RULE'));
  await until(S(49));
  await play(...fbox(['demonstrated reply:', ['logit + (1 − its probability)', C.cyan]]),
    ...say('RAISE THE DEMONSTRATED LOGIT'));
  await until(S(50));
  await play(...fbox(['demonstrated reply:', ['logit + (1 − its probability)', C.cyan], 'every other reply:',
    ['logit − its probability', C.pink]]),
    ...say('LOWER THE OTHER LOGITS', C.pink));

  // 51–54 Many demonstrations, a wrong answer and the recap.
  const exY = i => (P ? 2.0 - i * 2.6 : 1.05 - i * 1.36);
  const examples = [
    ['When does the library close on Friday?', 'At six.'],
    ['Which day is the gym closed?', 'On Monday.'],
    ['When does the café open on Saturday?', 'At eight.'],
  ].map(([q, a], i) => card(0, exY(i), P ? 6.6 : 7.8, 1.12, 'QUESTION → BRIEF ANSWER', [q, a], BLUE));
  await until(S(51));
  await play(fadeOut(boardNow), fadeOut(plotNow), ...clearBox(),
    new M.LaggedStart(examples.map(obj => fadeIn(obj)), { lagRatio: 0.20, runTime: 0.85 }),
    ...say('TRAIN ON MANY DEMONSTRATIONS', C.green));
  const trapPrompt = demonstrationPrompt();
  const wrongAnswer = demonstrationAnswer('At seven.  (a mistake)', C.pink);
  await until(S(52));
  await play(...examples.map(obj => fadeOut(obj)), fadeIn(trapPrompt), fadeIn(wrongAnswer),
    ...say('A WRONG DEMONSTRATION', C.pink));
  const trapY = P ? -3.75 : -1.55;
  const trapLeft = P ? -2.6 : 1.90;
  const trapBar = bar(trapLeft, trapY, P ? 4.6 : 2.36, 0.25, C.pink);
  const widerTrapBar = bar(trapLeft, trapY, P ? 4.6 : 2.36, 0.64, C.pink);
  const trapLabel = label('“At seven.” becomes more likely', P ? 0 : trapLeft, trapY - 0.42,
    { color: C.pink, align: P ? 'center' : 'left', width: P ? 6.6 : 4.45 });
  await until(S(53));
  await play(fadeIn(trapBar), fadeIn(trapLabel), ...say('THE MODEL LEARNS THE MISTAKE', C.pink));
  await play(fadeOut(trapBar), fadeIn(widerTrapBar));
  await until(S(54));
  const recapY = P ? -4.0 : -1.85;
  const recap = card(0, recapY, P ? 6.6 : 7.0, 1.12, 'PROBABILITY OF THE DEMONSTRATED ANSWER',
    ['20%  →  46%  →  66%  →  76%'], C.green, P ? 21 : 21);
  await play(fadeOut(wrongAnswer), fadeOut(widerTrapBar), fadeOut(trapLabel),
    fadeIn(demonstrationAnswer('At six.')), fadeIn(recap), ...say('SUPERVISED FINE-TUNING', C.green));
}
