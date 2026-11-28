// 20.2.8 Direct preference optimization.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const PILL = P ? [0, 3.85, 0] : [-2.6, 1.85, 0];
  const BOXP = P ? [0, 2.55, 0] : [4.85, -0.3, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL);

  const names = ['A', 'B', 'C', 'D'];
  const colors = [C.cyan, C.amber, C.pink, C.violet];
  const steps = [
    { shares: [40, 40, 15, 5], margin: 0, win: 50, loss: 0.69 },
    { shares: [60, 22, 14, 4.5], margin: 1, win: 73, loss: 0.31 },
    { shares: [69, 15, 12, 4], margin: 1.54, win: 82, loss: 0.19 },
    { shares: [74, 11, 11, 3.6], margin: 1.89, win: 87, loss: 0.14 },
  ];
  const reference = steps[0].shares;
  const fades = objects => objects.map(object => new M.FadeIn(object));
  const hide = objects => objects.map(object => new M.FadeOut(object));
  const stagger = (animations, runTime = 0.9) =>
    new M.LaggedStart(animations, { lagRatio: 0.12, runTime });

  function label(text, x, y, size = 20, color = C.ink, mono = false, maxWidth = Infinity) {
    const t = T(text, size, color, mono);
    if (t.getWidth() > maxWidth) t.scale(maxWidth / t.getWidth());
    t.moveTo([x, y, 0]);
    return t;
  }

  function left(text, x, y, size, color, maxWidth) {
    const t = label(text, x, y, size, color, false, maxWidth);
    t.moveTo([x + t.getWidth() / 2, y, 0]);
    return t;
  }

  function line(x1, y1, x2, y2, color = C.muted, strokeWidth = 2) {
    return new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth });
  }

  let boxNow;
  function fbox(rows, color = C.cyan, at = BOXP) {
    const size = P ? 20 : 21;
    const lh = P ? 0.34 : 0.42;
    const texts = rows.map(row => {
      const [text, ink] = Array.isArray(row) ? row : [row, C.ink];
      return T(text, size, ink, true);
    });
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.62;
    const height = rows.length * lh + 0.26;
    const card = new M.RoundedRectangle({
      width, height, cornerRadius: 0.14, color, strokeWidth: 2,
    });
    card.setFill(C.card, 0.95);
    card.moveTo([0, 0, 0]);
    texts.forEach((t, i) => {
      t.moveTo([(t.getWidth() - width) / 2 + 0.31, (rows.length / 2 - i - 0.5) * lh, 0]);
    });
    const next = new M.VGroup(card, ...texts);
    const maxWidth = P ? FW - 0.8 : 4.0;
    if (width > maxWidth) next.scale(maxWidth / width);
    next.moveTo(at);
    const animations = boxNow ? [new M.FadeOut(boxNow)] : [];
    boxNow = next;
    return [...animations, new M.FadeIn(next)];
  }

  function clearBox() {
    const animations = boxNow ? [new M.FadeOut(boxNow)] : [];
    boxNow = undefined;
    return animations;
  }

  // The announcement, the student question, and the four possible replies.
  const goal = new M.VGroup(
    label('Campus writing assistant', 0, P ? 0.6 : 0.65, 31, C.ink, false, FW - 1),
    label('✓  Short answers', 0, P ? -1.3 : -0.23, P ? 27 : 24, C.cyan),
    label('✓  Correct answers', 0, P ? -2.6 : -0.9, P ? 27 : 24, C.green),
  );
  const aLines = P
    ? ['The library closes at six', 'on Friday for cleaning.']
    : ['The library closes at six on Friday for cleaning.'];
  const announcement = new M.VGroup(...aLines.map((text, i) =>
    label(text, 0, P ? 1.3 - i * 0.42 : 1.17, 22, C.ink, false, FW - 1)));
  const question = label('When does the library close on Friday?', 0, P ? 0.3 : 0.68,
    21, C.amber, false, FW - 1);
  const replyText = [
    ['At six.'],
    P ? ['Thanks for asking! The newsletter says', 'the library will close at six this', 'Friday for cleaning.']
      : ['Thanks for asking! The newsletter says the library will close at six', 'this Friday for cleaning.'],
    ['At nine.'],
    ['At six! At six! At six!'],
  ];
  const rowY = P ? [-0.6, -1.35, -2.85, -3.6] : [0.12, -0.52, -1.54, -2.18];
  const rows = replyText.map((lines, i) => new M.VGroup(
    label(names[i], P ? -3.32 : -5.85, rowY[i], 23, colors[i], true),
    ...lines.map((text, j) =>
      left(text, P ? -2.87 : -5.28, rowY[i] - j * (P ? 0.4 : 0.34), 20, C.ink, P ? 5.1 : 10.1)),
  ));
  const chances = reference.map((share, i) =>
    label(`${share}%`, P ? 3.13 : 5.65, rowY[i], 20, colors[i], true));
  const check = label('✓', P ? -3.68 : -6.38, rowY[0], 21, C.green);
  const pair = label('A over B', 0, P ? -3.3 : -1.75, P ? 30 : 26, C.green);

  await until(S(0)); await play(new M.FadeIn(goal), ...say('SHORT, CORRECT ANSWERS'));
  await until(S(1)); await play(...say('CAN WE LEARN FROM HUMAN CHOICES?', C.amber));
  await until(S(2)); await play(new M.FadeOut(goal), new M.FadeIn(announcement), ...say('THE ANNOUNCEMENT'));
  await until(S(3)); await play(new M.FadeIn(question), ...say('THE STUDENT ASKS', C.amber));
  // phone: dim letters for C and D wait in the lower part until their replies are read
  const waiting = [2, 3].map(i => label(names[i], P ? -3.32 : -5.85, rowY[i], 23, C.muted, true));
  for (let i = 0; i < rows.length; i++) {
    await until(S(4 + i));
    const extra = P ? (i === 0 ? waiting.map(w => new M.FadeIn(w)) : i >= 2 ? [new M.FadeOut(waiting[i - 2])] : []) : [];
    await play(new M.FadeIn(rows[i]), ...extra, ...say(`REPLY ${names[i]}`, colors[i]));
  }
  await until(S(8)); await play(stagger(fades(chances)), ...say('REPLY PROBABILITIES'));
  await until(S(9)); await play(new M.FadeIn(check), ...say('PEOPLE PREFER A OVER B', C.green));
  await until(S(10)); await play(...hide([rows[2], rows[3], ...chances]), new M.FadeIn(pair),
    ...say('POINT TO THE BETTER ANSWER', C.green));
  await until(S(11)); await play(...say('ONLY THE CHOICE IS NEEDED', C.green));
  await until(S(12)); await play(...fbox([['A  chosen', C.green], 'B  rejected'], C.green));
  await until(S(13)); await play(...say('TEACH WITH REPLY COMPARISONS'));
  await until(S(14)); await play(...say('DIRECT PREFERENCE OPTIMIZATION'));

  // Two copies of the same illustrative network. Output neurons show percent.
  const initialWeights = [
    [[0.7, -0.35, 0.45], [-0.5, 0.55, 0.25]],
    [[0.75, 0.4, -0.5, 0.35], [-0.4, 0.7, 0.45, -0.28], [0.52, -0.3, 0.38, 0.41]],
  ];
  function paintWeight(edge, weight) {
    edge.setColor(weight < 0 ? C.pink : C.cyan);
    edge.setStrokeWidth(1.5 + 4 * Math.abs(weight));
    edge.setStrokeOpacity(0.35 + 0.6 * Math.abs(weight));
  }

  const radius = P ? 0.3 : 0.27;
  function model(x, title, color = C.ink, y = P ? (x < 0 ? 0.2 : -3.6) : -0.45) {
    const N = net({ layers: [2, 3, 4], center: [P ? 0 : x, y, 0],
      width: P ? 4.6 : 3.3, height: P ? 2.4 : 2.5, r: radius });
    x = P ? 0 : x;
    initialWeights.forEach((layer, l) => layer.forEach((from, i) =>
      from.forEach((w, j) => paintWeight(N.edges[l][i][j], w))));
    const heading = label(title, x, y + (P ? 1.6 : 1.7), 21, color);
    const values = [[1, 0], [0.7, 0.2, 0.5], reference].map((layer, l) =>
      layer.map((value, i) => N.value(l, i, value)[0]));
    const outputs = names.map((name, i) => {
      const [nx, ny] = N.pos(2, i);
      return label(name, nx + radius + 0.18, ny, 15, colors[i], true);
    });
    const unit = label('Reply probability (%)', x, y - (P ? 1.6 : 1.75), 16, C.muted);
    return { N, heading, parts: [N.group, heading, ...values.flat().map(a => a.mobject), ...outputs, unit] };
  }

  const refX = P ? -1 : -4.3;
  const learnX = P ? 1 : 0.4;
  const fixed = model(refX, 'Copy 1');
  const learning = model(learnX, 'Copy 2');
  const fixedTitle = label('Reference model (frozen)', P ? 0 : refX, P ? 1.8 : 1.25, 21, C.muted);
  const learningTitle = label('Learning model', P ? 0 : learnX, P ? -2.0 : 1.25, 21, C.cyan);
  const modelParts = [fixedTitle, learningTitle,
    ...fixed.parts.filter(p => p !== fixed.heading),
    ...learning.parts.filter(p => p !== learning.heading)];

  await until(S(15)); await play(...hide([announcement, question, rows[0], rows[1], check, pair]),
    ...clearBox(), ...say('TWO IDENTICAL MODELS'), ...fades([...fixed.parts, ...learning.parts]));
  await until(S(16)); await play(...say('KEEP ONE COPY FROZEN', C.muted),
    ...fbox(['Frozen weights', 'Frozen reply probabilities'], C.muted));
  await until(S(17)); await play(new M.ReplacementTransform(fixed.heading, fixedTitle),
    ...say('REFERENCE MODEL', C.muted));
  await until(S(18)); await play(new M.ReplacementTransform(learning.heading, learningTitle),
    ...fbox([['Human choice', C.green], 'A over B'], C.green), ...say('THE SECOND MODEL LEARNS'));
  await play(new M.LaggedStart([
    ...learning.N.flow(0, C.amber), ...learning.N.flow(1, C.amber),
  ], { lagRatio: 0.8, runTime: 1.8 }));

  // Thick muted bars show the fixed reference behind the learning model.
  const bx = P ? -2.95 : -6.0;
  const bw = P ? 5.4 : 3.6;
  const by = i => (P ? 0.75 - i * 0.75 : 0.75 - i * 0.62);
  const chanceX = share => bx + bw * share / 100;
  const barColor = (share, i, ghost = false) => {
    const width = bw * share / 100;
    const rect = new M.Rectangle({
      width: Math.max(0.03, width), height: ghost ? (P ? 0.5 : 0.36) : (P ? 0.26 : 0.18),
      color: ghost ? C.muted : colors[i], strokeWidth: ghost ? 2 : 0,
    });
    rect.setFill(ghost ? C.muted : colors[i], ghost ? 0.25 : 0.92);
    rect.moveTo([bx + width / 2, by(i), 0]);
    return rect;
  };
  function barCaption(share, i) {
    const x = chanceX(Math.max(share, reference[i])) + (P ? 0.52 : 0.4);
    return label(`${share}%`, x, by(i), P ? 19 : 17, colors[i], true);
  }

  function barFrame() {
    return [
      label('Reference outline  /  Learning fill', bx + bw / 2, P ? 1.4 : 1.25, 18, C.ink, false, bw + 0.8),
      line(bx, by(3) - 0.42, bx + bw, by(3) - 0.42),
      ...[0, 50, 100].map(p => label(`${p}%`, chanceX(p), by(3) - 0.68, 16, C.muted, true)),
      ...names.map((name, i) => label(name, bx - 0.31, by(i), 20, colors[i], true)),
      ...reference.map((share, i) => barColor(share, i, true)),
    ];
  }

  let frame = barFrame();
  let bars = reference.map((share, i) => barColor(share, i));
  let captions = reference.map(barCaption);
  function changeBars(shares, displayed = shares) {
    const newBars = shares.map((share, i) => barColor(share, i));
    const newCaptions = shares.map((share, i) => {
      const t = barCaption(share, i);
      if (displayed[i] === share) return t;
      const [x, y] = t.getCenter();
      return label(`${displayed[i]}%`, x, y, P ? 19 : 17, colors[i], true);
    });
    const animations = bars.map((bar, i) => new M.ReplacementTransform(bar, newBars[i]));
    animations.push(...hide(captions), ...fades(newCaptions));
    bars = newBars;
    captions = newCaptions;
    return animations;
  }

  await until(S(19)); await play(...hide(modelParts), ...clearBox(), ...fades([...frame, ...bars, ...captions]),
    ...say('REFERENCE AND LEARNING PROBABILITIES'));
  const LOW = P ? [0, -3.9, 0] : BOXP;
  await until(S(20)); await play(...fbox([['A gains relative to B', C.green], 'Use the frozen reference'], C.green, LOW),
    ...say('MAKE A MORE LIKELY RELATIVE TO B', C.green));
  await until(S(21)); await play(...fbox(['Learning ÷ reference', 'A   40% ÷ 40% = 1', 'B   40% ÷ 40% = 1'], C.cyan, LOW),
    ...say('DIVIDE EACH PAIR OF PROBABILITIES'));
  await until(S(22)); await play(...fbox(['Natural logarithm', 'A   ln(1) = 0', 'B   ln(1) = 0'], C.cyan, LOW),
    ...say('TAKE THE NATURAL LOGARITHM'));
  await until(S(23)); await play(...fbox(['A’s result − B’s result', ['0 − 0', C.amber]], C.amber, LOW),
    ...say('SUBTRACT B’S RESULT FROM A’S', C.amber));
  await until(S(24)); await play(...fbox(['Margin', ['ln(A ratio) − ln(B ratio)', C.amber]], C.amber, LOW),
    ...say('THE DIFFERENCE IS THE MARGIN', C.amber));
  await until(S(25)); await play(...fbox(['Same probabilities', ['Margin = 0 − 0 = 0', C.amber]], C.amber, LOW),
    ...say('STARTING MARGIN = ZERO', C.amber));

  // Reuse the same chart area for the sigmoid and the loss history.
  const gx0 = P ? -2.42 : -1.4;
  const gx1 = P ? 2.9 : 2.2;
  const gy0 = P ? -5.7 : -2.45;
  const gy1 = P ? -3.05 : 0.6;
  const gx = fraction => gx0 + (gx1 - gx0) * fraction;
  const gy = fraction => gy0 + (gy1 - gy0) * fraction;
  function axes(title, bottom, xTicks, yTicks) {
    return [
      label(title, gx(0.5), gy1 + 0.34, 18, C.ink),
      label(bottom, gx(0.5), gy0 - 0.55, 16, C.muted),
      line(gx0, gy0, gx1, gy0), line(gx0, gy0, gx0, gy1),
      ...xTicks.map(([f, text]) => label(text, gx(f), gy0 - 0.25, 16, C.muted, true)),
      ...yTicks.flatMap(([f, text]) => [
        line(gx0 - 0.08, gy(f), gx0 + 0.06, gy(f)),
        label(text, gx0 - 0.38, gy(f), P ? 15 : 14, C.muted, true),
      ]),
    ];
  }
  const sigmoid = margin => 1 / (1 + Math.exp(-margin));
  const sigmoidX = margin => gx((margin + 5) / 10);
  const sigmoidAxes = axes('Probability that A wins', 'Margin',
    [[0, '−5'], [0.5, '0'], [1, '5']], [[0, '0%'], [0.5, '50%'], [1, '100%']]);
  const sigmoidCurve = new M.VGroup(...Array.from({ length: 40 }, (_, i) => {
    const a = -5 + i / 4;
    const b = a + 0.25;
    return line(sigmoidX(a), gy(sigmoid(a)), sigmoidX(b), gy(sigmoid(b)), C.cyan, 3);
  }));
  const mid = new M.Dot({ point: [sigmoidX(0), gy(0.5), 0], radius: 0.09, color: C.amber });
  const guides = new M.VGroup(
    new M.DashedLine({ start: [gx0, gy(0.5), 0], end: [sigmoidX(0), gy(0.5), 0], color: C.amber }),
    new M.DashedLine({ start: [sigmoidX(0), gy0, 0], end: [sigmoidX(0), gy(0.5), 0], color: C.amber }),
  );

  await until(S(26)); await play(...fades(sigmoidAxes), new M.FadeIn(sigmoidCurve),
    ...say('SIGMOID: MARGIN → PROBABILITY A WINS'));
  await until(S(27)); await play(new M.FadeIn(guides), new M.FadeIn(mid),
    ...fbox(['Margin = 0', ['A wins: 50%', C.amber]], C.amber), ...say('ZERO MARGIN GIVES 50%', C.amber));
  await until(S(28)); await play(...fbox(['People chose A', ['loss = −ln(P(A wins))', C.violet]], C.violet),
    ...say('HOW SURPRISED IS THE MODEL?', C.violet));
  await until(S(29)); await play(...fbox(['P(A wins) = 0.50', ['Loss = −ln(0.50) ≈ 0.69', C.violet]], C.violet),
    ...say('STARTING LOSS ≈ 0.69', C.violet));

  const fixedAgain = model(refX, 'Reference model (frozen)', C.muted);
  const learnAgain = model(learnX, 'Learning model', C.cyan);
  function backward(layer) {
    const pulses = learnAgain.N.edges[layer].flatMap((from, i) => from.map((_, j) => {
      const [x1, y1] = learnAgain.N.pos(layer + 1, j);
      const [x2, y2] = learnAgain.N.pos(layer, i);
      const start = new M.Dot({ point: [x1 - radius, y1, 0], radius: 0.06, color: C.amber });
      const end = new M.Dot({ point: [x2 + radius, y2, 0], radius: 0.06, color: C.amber });
      return { start, end };
    }));
    return [
      stagger(pulses.map(({ start, end }) => new M.Transform(start, end, { runTime: 0.55 })), 0.9),
      pulses.map(({ start }) => new M.FadeOut(start, { runTime: 0.16 })),
    ];
  }

  await until(S(30)); await play(...hide([...frame, ...bars, ...captions, ...sigmoidAxes, sigmoidCurve, guides, mid]),
    ...fades([...fixedAgain.parts, ...learnAgain.parts]), ...say('GRADIENTS TRAVEL BACKWARD', C.amber));
  for (const layer of [1, 0]) {
    const [pulse, remove] = backward(layer);
    await play(pulse);
    const edge = layer === 1 ? learnAgain.N.edges[1][0][1] : learnAgain.N.edges[0][1][0];
    paintWeight(edge, layer === 1 ? 0.61 : -0.67);
    await play(...remove);
  }

  const lastStep = 16;
  const lossX = iteration => gx(iteration / lastStep);
  const lossY = loss => gy(loss / 0.75);
  const lossParts = axes('Loss as training continues', 'Step',
    [[0, '0'], [4 / lastStep, '4'], [8 / lastStep, '8'], [1, String(lastStep)]],
    [[0, '0'], [0.3 / 0.75, '0.3'], [0.6 / 0.75, '0.6']]);
  let previousLoss = steps[0].loss;
  function lossPoint(iteration, loss) {
    const dot = new M.Dot({ point: [lossX(iteration), lossY(loss), 0], radius: 0.053, color: C.violet });
    if (iteration === 0) return new M.FadeIn(dot);
    const segment = line(lossX(iteration - 1), lossY(previousLoss),
      lossX(iteration), lossY(loss), C.violet, 3);
    previousLoss = loss;
    return new M.LaggedStart([new M.Create(segment), new M.FadeIn(dot)], { lagRatio: 0.5, runTime: 0.54 });
  }

  frame = barFrame();
  bars = reference.map((share, i) => barColor(share, i));
  captions = reference.map(barCaption);
  await until(S(31)); await play(...hide([...fixedAgain.parts, ...learnAgain.parts]),
    ...fades([...frame, ...bars, ...captions, ...lossParts]), lossPoint(0, previousLoss),
    ...fbox(['Step 0   Loss ≈ 0.69', ['Logit changes start at 0', C.cyan]]), ...say('CHANGE THE LOGITS DIRECTLY'));

  function difference(step, oldWin, change) {
    return fbox([`Step ${step}   1 − P(A wins)`, [`1 − ${oldWin} ≈ ${change}`, C.amber]], C.amber);
  }

  function outcome(step) {
    const { margin, win } = steps[step];
    return fbox([`Step ${step}   Margin ≈ ${margin}`, [`A wins ≈ ${win}%`, C.amber]], C.amber);
  }

  function showLoss(step) {
    const { win, loss } = steps[step];
    return fbox([`Step ${step}   A wins ≈ ${win}%`, [`Loss ≈ ${loss.toFixed(2)}`, C.violet]], C.violet);
  }

  await until(S(32)); await play(...fbox(['Step 1   1 − P(A wins)', ['1 − 0.50 = 0.50', C.amber]], C.amber),
    ...say('STEP 1   FIND THE LOGIT CHANGE', C.amber));
  await until(S(33)); await play(...fbox(['Step 1   Logit changes', ['A   +0.50', C.cyan], ['B   −0.50', C.amber]]),
    ...say('RAISE A’S LOGIT   LOWER B’S LOGIT'));
  await until(S(34)); await play(...fbox(['Step 1   Logit changes', 'A  +0.50     B  −0.50', ['C   0        D   0', C.violet]], C.violet),
    ...say('C AND D KEEP THEIR LOGITS', C.violet));
  await until(S(35)); await play(...fbox(['Softmax', 'Turn logits into probabilities', ['They add up to 100%', C.green]], C.green),
    ...say('SOFTMAX GIVES PROBABILITIES'));
  await until(S(36)); await play(...changeBars(steps[1].shares),
    ...fbox(['Step 1   Approximate probabilities', 'A  60%       B  22%', 'C  14%       D   4.5%']),
    ...say('STEP 1   NEW PROBABILITIES'));
  await until(S(37)); await play(...fbox(['Step 1   Margin = 1', ['A wins ≈ 73%', C.amber]], C.amber),
    ...say('A IS MORE LIKELY TO WIN', C.amber));
  await until(S(38)); await play(lossPoint(1, steps[1].loss), ...showLoss(1), ...say('STEP 1   LOSS FALLS', C.violet));

  await until(S(39)); await play(...difference(2, '0.73', '0.27'), ...say('STEP 2   FIND THE LOGIT CHANGE', C.amber));
  await until(S(40)); await play(...fbox(['Step 2   Logit shifts from start',
    ['A   +0.50 → +0.77', C.cyan], ['B   −0.50 → −0.77', C.amber]]), ...say('RAISE A’S LOGIT   LOWER B’S LOGIT'));
  await until(S(41)); await play(...changeBars(steps[2].shares),
    ...fbox(['Step 2   Approximate probabilities', 'A  69%       B  15%', 'C  12%       D   4%']),
    ...say('STEP 2   NEW PROBABILITIES'));
  await until(S(42)); await play(...outcome(2), ...say('A WINS MORE OFTEN', C.amber));
  await until(S(43)); await play(lossPoint(2, steps[2].loss), ...showLoss(2), ...say('STEP 2   LOSS FALLS AGAIN', C.violet));

  await until(S(44)); await play(...difference(3, '0.82', '0.18'), ...say('STEP 3   A SMALLER CHANGE', C.amber));
  await until(S(45)); await play(...fbox(['Step 3   Logit shifts from start',
    ['A   +0.77 → +0.95', C.cyan], ['B   −0.77 → −0.95', C.amber]]), ...say('RAISE A’S LOGIT   LOWER B’S LOGIT'));
  await until(S(46)); await play(...changeBars(steps[3].shares),
    ...fbox(['Step 3   Approximate probabilities', 'A  74%       B  11%', 'C  11%       D   3.6%']),
    ...say('STEP 3   NEW PROBABILITIES'));
  await until(S(47)); await play(...outcome(3), ...say('A WINS: 87%', C.amber));

  await until(S(48)); await play(lossPoint(3, steps[3].loss), ...showLoss(3),
    ...say('LOSS APPROACHES ZERO WITH MORE STEPS', C.violet));
  let margin = 0;
  for (let i = 0; i < 3; i++) margin += 2 * (1 - sigmoid(margin));
  const later = [];
  for (let i = 4; i <= lastStep; i++) {
    margin += 2 * (1 - sigmoid(margin));
    later.push(lossPoint(i, Math.log1p(Math.exp(-margin))));
  }
  await play(stagger(later, 3.6));

  await until(S(49)); await play(...fbox(['Learning rate = 1', 'Logit change =', ['1 − P(A wins)', C.amber]], C.amber),
    ...say('THE LOGIT CHANGE RULE', C.amber));
  await until(S(50)); await play(...fbox(['Logit change', ['Add to the chosen reply', C.cyan], ['Subtract from the rejected reply', C.amber]]),
    ...say('ADD TO CHOSEN   SUBTRACT FROM REJECTED'));
  await until(S(51)); await play(...fbox(['Training example', ['Human choice  A over B', C.green], 'Frozen reference  40 / 40 / 15 / 5'], C.green),
    ...say('LEARN DIRECTLY FROM THE HUMAN CHOICE', C.green));
  await until(S(52)); await play(...changeBars([74, 11.2, 10.8, 3.6]),
    ...fbox(['Step 3   Reply probabilities', ['B  11.2%   Correct, long', C.amber], ['C  10.8%   Wrong', C.pink]], C.pink),
    ...say('THE WRONG REPLY IS ALMOST AS LIKELY', C.pink));
  await until(S(53)); await play(...fbox(['Add a comparison', ['B  chosen   “at six”', C.amber], ['C  rejected “at nine”', C.pink]], C.green),
    ...say('ALSO TEACH B OVER C', C.green));
  await until(S(54)); await play(...fbox(['Human choice:', 'chosen reply gains', ['vs the frozen reference', C.green]], C.green),
    ...say('DPO LEARNS FROM HUMAN CHOICES', C.green));
}
