// 17.2.7 Vanishing gradients. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const CX = P ? 0 : -2.6;
  const OR = '#fb923c';
  const PILL = P ? [0, 4.05, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -4.9, 0] : [4.3, -0.3, 0];
  const STRIP_Y = P ? -2.75 : -3.0;
  const SLOPE_Y = P ? -1.2 : -2.2;
  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const fade = (object, runTime = 0.4) => new M.FadeIn(object, { runTime });
  const out = object => new M.FadeOut(object, { runTime: 0.35 });
  const lag = (animations, runTime) => new M.LaggedStart(animations, { lagRatio: 0.16, runTime });
  const point = (x, y) => [x, y, 0];

  function text(value, x, y, color = C.ink, size = 19) {
    const label = T(value, size, color, true);
    label.moveTo(point(x, y));
    return label;
  }

  function block(width, height, x, y, color, opacity = 0.82) {
    const rect = new M.Rectangle({ width, height, color, strokeWidth: 1 });
    rect.setFill(color, opacity);
    rect.moveTo(point(x, y));
    return rect;
  }

  let boxNow = null;
  function box(lines, color = C.cyan) {
    const lh = P ? 0.41 : 0.39;
    const labels = lines.map((row, i) => {
      const [value, ink] = Array.isArray(row) ? row : [row, C.ink];
      return text(value, 0, ((lines.length - 1) / 2 - i) * lh, ink, P ? 22 : 21);
    });
    const width = Math.max(...labels.map(label => label.getWidth())) + 0.5;
    const height = lines.length * lh + 0.24;
    const panel = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    panel.setFill(C.card, 0.95);
    panel.moveTo(point(0, 0));
    const group = new M.VGroup(panel, ...labels);
    const maxWidth = P ? FW - 1.2 : 4.6;
    if (width > maxWidth) group.scale(maxWidth / width);
    group.moveTo(BOXP);
    const animations = [fade(group)];
    if (boxNow) animations.push(out(boxNow));
    boxNow = group;
    return animations;
  }

  function frame(width, height, x, y, color) {
    const outline = new M.RoundedRectangle({ width, height, cornerRadius: 0.14, color, strokeWidth: 2 });
    outline.setFill(C.card, 0);
    outline.moveTo(point(x, y));
    return outline;
  }

  function card(x, y, scale, back = false) {
    const border = new M.RoundedRectangle({
      width: 2.25, height: 2.28, cornerRadius: 0.16, color: back ? C.green : C.cyan, strokeWidth: 2,
    });
    border.setFill(C.card, 0.96);
    border.moveTo(point(0, 0));
    const parts = [border];
    if (back) {
      parts.push(text('ANSWER', 0, 0.63, C.green, 17), text('3', 0, -0.21, C.ink, 52));
    } else {
      const pixels = ['1110', '0001', '0110', '0001', '0001', '1110'];
      pixels.forEach((row, r) => [...row].forEach((cell, c) => {
        parts.push(block(0.235, 0.235, (c - 1.5) * 0.25, (2.5 - r) * 0.25 - 0.16,
          cell === '1' ? C.ink : C.grid, cell === '1' ? 0.92 : 0.35));
      }));
      parts.push(text('PARCEL LABEL', 0, 0.83, C.cyan, 15));
    }
    const group = new M.VGroup(...parts);
    group.scale(scale);
    group.moveTo(point(x, y));
    return group;
  }

  const N = net({
    layers: [2, 2, 2, 2, 1],
    center: point(CX, P ? 0.55 : -0.5),
    width: P ? 6.3 : 6.4,
    height: P ? 2.2 : 2.1,
    r: P ? 0.32 : 0.3,
  });
  const xs = N.nodes.map((_, i) => N.pos(i, 0)[0]);
  const mid = i => (xs[i] + xs[i + 1]) / 2;
  const path = N.edges.map((layer, i) => {
    const edge = layer[0][0].copy();
    edge.setStroke(OR, 5, 0.94);
    return edge;
  });
  const slopes = path.map((_, i) => text('1/2', mid(i), SLOPE_Y, C.cyan, P ? 20 : 19));
  const grad = ['1/16', '1/8', '1/4', '1/2', '1'];
  const decimal = ['0.0625', '0.125', '0.25', '0.5', '1'];
  const gradLabels = grad.map((number, i) => text(number, xs[i], P ? 2.85 : 1.3, OR, P ? 22 : 21));
  const gradBars = grad.map((_, i) => block(0.86 * Number(decimal[i]), 0.13, xs[i], P ? 2.45 : 0.95, OR));
  const layerFrames = N.nodes.map((nodes, i) => frame(0.82, nodes.length === 2 ? (P ? 3.0 : 2.85) : 0.86,
    xs[i], N.pos(4, 0)[1], C.cyan));
  const layerNames = xs.map((x, i) => text(i === 0 ? 'First' : i === 4 ? 'Last' : String(i + 1),
    x, SLOPE_Y, C.muted, P ? 17 : 16));

  function reveal(i) {
    return [fade(gradLabels[i]), fade(gradBars[i])];
  }

  function highlightNode(i, color, runTime = 0.65) {
    const [x, y] = N.pos(i, 0);
    const ring = new M.Circle({ radius: P ? 0.36 : 0.38, color, strokeWidth: 3 });
    ring.setFill(color, 0);
    ring.moveTo(point(x, y));
    return new M.Flash(ring, { color, runTime, flashRadius: 0.34, lineLength: 0.1 });
  }

  async function backward(link, ...animations) {
    const from = N.pos(link + 1, 0), to = N.pos(link, 0);
    const pulse = new M.Dot({ point: from, radius: 0.085, color: OR });
    pulse.setFill(OR, 1);
    const target = new M.Dot({ point: to, radius: 0.085, color: OR });
    target.setFill(OR, 1);
    await play(fade(pulse, 0.14), ...animations);
    await play(new M.Transform(pulse, target, { runTime: 0.52 }));
    await play(out(pulse), ...reveal(link));
  }

  const CY = P ? 0.6 : -0.25, CS = P ? 1.5 : 1;
  const front = card(CX, CY, CS);
  const back = card(CX, CY, CS, true);
  const guess = text('Predicts 8', CX + (P ? 1.3 : 1.25), CY, C.amber, 27);

  await until(S(0)); await play(fade(front), ...say('A PARCEL LABEL'), ...box(['a picture of one digit', ['what digit is it?', C.amber]]));
  await until(S(1)); await play(out(front), fade(back), ...say('CORRECT DIGIT  3', C.green), ...box([['answer = 3', C.green]], C.green));
  await until(S(2));
  const smallBack = card(CX - (P ? 1.6 : 1.3), CY, P ? 0.9 : 0.72, true);
  await play(out(back), fade(smallBack), fade(guess), ...say('THE NETWORK PREDICTS 8', C.amber), ...box([['answer = 3', C.green], ['prediction = 8', C.amber]], C.amber));
  await until(S(3)); await play(...say('WHAT REACHES THE FIRST LAYER?', OR));

  const inputCard = card(xs[0] + (P ? 0.25 : 0), P ? 2.95 : 1.4, P ? 0.42 : 0.3);
  const entry = new M.Arrow({
    start: point(xs[0], P ? 2.45 : 1.05),
    end: point(xs[0], N.pos(0, 0)[1] + 0.33), color: C.cyan,
  });
  await until(S(4));
  await play(out(smallBack), out(guess), fade(N.group), fade(inputCard),
    new M.Create(entry, { runTime: 0.55 }), ...say('PICTURE IN ON THE LEFT'));

  await until(S(5));
  await play(out(inputCard), out(entry), highlightNode(0, C.cyan),
    ...N.value(0, 0, '1'), ...N.value(0, 1, '0'), ...say('EACH NEURON HOLDS ITS ACTIVATION'));
  await until(S(6));
  await play(lag(layerFrames.map(object => new M.Create(object)), 1.1),
    ...layerNames.map(label => fade(label)), ...say('ONE COLUMN IS ONE LAYER'));

  await until(S(7));
  await play(out(new M.VGroup(...layerFrames, ...layerNames)), ...say('ACTIVATIONS MOVE RIGHT', C.amber));
  for (let i = 0; i < path.length; i++) {
    const values = i === 3 ? N.value(4, 0, '8', C.amber)
      : [...N.value(i + 1, 0, '1'), ...N.value(i + 1, 1, '0')];
    await play(...N.flow(i, C.amber), ...values);
  }

  await until(S(8)); await play(...say('COMPARE PREDICTION AND ANSWER'),
    ...box([['Prediction  8', C.amber], ['Answer      3', C.green], 'Measure the loss']));
  await until(S(9)); await play(...say('HIGHER LOSS, WORSE PREDICTION', C.amber),
    ...box([['Prediction 8 · Answer 3', C.amber], 'Higher loss → worse prediction'], C.amber));

  // clear the activations so only gradients are shown from here on
  const clearVals = [];
  N.nodes.forEach((nodes, l) => nodes.forEach((_, i) => clearVals.push(...N.value(l, i, ' '))));
  await until(S(10)); await play(...clearVals, highlightNode(4, OR), ...say('BACKWARD PASS FROM THE RIGHT', OR));
  await until(S(11)); await play(highlightNode(4, OR), ...say('WHAT IF THE RESULT CHANGES?', OR),
    ...box(['Small change in activation', 'How much does loss change?'], OR));
  await until(S(12)); await play(...say('REMEMBER: THE GRADIENT', OR),
    ...box(['Gradient', 'Effect of a small change'], OR));
  await until(S(13)); await play(...reveal(4), ...say('GRADIENT AT THE OUTPUT = 1', OR),
    ...box([['Starting gradient = 1', OR]], OR));
  await until(S(14)); await play(new M.Indicate(gradLabels[4], { color: OR }),
    ...box(['Small change at last neuron', 'Same size change in loss'], OR));

  await until(S(15)); await play(lag(path.slice().reverse().map(edge => new M.Create(edge)), 1),
    ...say('FOLLOW FOUR CONNECTIONS BACK', OR));
  await until(S(16)); await play(...N.flow(3, C.amber), ...say('WATCH ONE CONNECTION GO FORWARD', C.amber));

  const changeLeft = block(1.36, 0.2, CX - 1.42, STRIP_Y, C.amber);
  const changeRight = block(0.68, 0.2, CX + 1.42, STRIP_Y, C.amber);
  const changeNote = text('Change at left  →  Half at right', CX, STRIP_Y - 0.45, C.amber, P ? 18 : 17);
  await until(S(17)); await play(fade(changeLeft), fade(changeRight), fade(changeNote), ...fadeSlope(3),
    ...say('HALF THE CHANGE REACHES THE RIGHT', C.amber));
  await until(S(18)); await play(...box(['Only half reaches the right', 'Half the effect on the loss'], OR));
  await until(S(19)); await play(new M.Indicate(path[3], { color: OR }),
    ...say('TRACE IT BACK ACROSS THE CONNECTION', OR));
  await until(S(20)); await play(out(new M.VGroup(changeLeft, changeRight, changeNote)),
    lag(slopes.slice(0, 3).reverse().map(label => fade(label)), 0.85), ...say('ALL FOUR CONNECTIONS HALVE IT'));

  function fadeSlope(i) {
    return [fade(slopes[i])];
  }

  const paperLeft = CX - 1.7;
  const paperAt = (width, height = 0.23) => block(width, height, paperLeft + width / 2, STRIP_Y, C.green);
  const strip = paperAt(3.4);
  const crease = new M.DashedLine({
    start: point(CX, STRIP_Y - 0.15), end: point(CX, STRIP_Y + 0.15), color: C.ink,
  });
  await until(S(21)); await play(fade(strip), new M.Create(crease, { runTime: 0.4 }),
    ...say('FOLD A STRIP IN HALF', C.green));
  await until(S(22));
  await play(out(crease), new M.Transform(strip, paperAt(1.7, 0.29), { runTime: 0.56 }));
  await play(new M.Transform(strip, paperAt(0.85, 0.35), { runTime: 0.56 }),
    ...say('EACH FOLD HALVES THE LENGTH LEFT', C.green));

  await until(S(23)); await play(out(strip), ...say('NOW WATCH THE GRADIENT SHRINK', OR),
    ...box([['Gradient at the right = 1', OR]], OR));
  await until(S(24)); await backward(3, ...box([['1 → 1/2', OR], 'One half = 0.5'], OR));
  await until(S(25)); await backward(2, ...box([['1/2 → 1/4', OR], 'One quarter = 0.25'], OR));
  await until(S(26)); await backward(1, ...box([['1/4 → 1/8', OR], 'One eighth = 0.125'], OR));
  await until(S(27)); await backward(0, ...box([['1/8 → 1/16', OR], 'One sixteenth = 0.0625'], OR));

  const span = new M.Arrow({
    start: point(xs[4], STRIP_Y), end: point(xs[0], STRIP_Y), color: OR, strokeWidth: 3,
  });
  await until(S(28)); await play(new M.Create(span, { runTime: 0.75 }),
    ...say('ONE BACKWARD PASS', OR));
  await until(S(29)); await play(new M.Indicate(gradLabels[4], { color: C.amber }),
    new M.Indicate(gradLabels[0], { color: C.amber }), ...say('COMPARE THE TWO ENDS', C.amber));
  await until(S(30)); await play(highlightNode(0, OR),
    ...say('ONE SIXTEENTH REACHES THE FIRST LAYER', OR));
  await until(S(31)); await play(out(span), lag(gradLabels.map(label => new M.Indicate(label, { color: OR })), 1.12),
    ...say('THESE NUMBERS ARE GRADIENTS', OR),
    ...box(['Gradient', 'How fast the loss changes'], OR));
  await until(S(32)); await play(lag(gradBars.slice().reverse().map(bar => new M.Indicate(bar, { color: C.amber })), 1.18),
    ...say('VANISHING GRADIENTS', OR));

  await until(S(33)); await play(new M.Indicate(slopes[3], { color: C.cyan }),
    ...say('LOCAL GRADIENT OF A CONNECTION'),
    ...box(['Local gradient', 'Change passed forward']));
  await until(S(34)); await play(lag(slopes.map(label => new M.Indicate(label, { color: C.cyan })), 1.05),
    ...say('LOCAL GRADIENT  ½  AT EACH CONNECTION'));
  await until(S(35)); await play(...say('THE GRADIENT ON THE LEFT', OR),
    ...box(['Left = right × local gradient', ['1/16 = 1/8 × 1/2', OR]], OR));

  const weightNote = text('One weight on each connection', CX, STRIP_Y, C.cyan, P ? 18 : 17);
  await until(S(36)); await play(out(new M.VGroup(...path)), fade(weightNote),
    ...N.weight(0, 0, 0, 0.38), ...N.weight(1, 0, 0, 0.55),
    ...N.weight(2, 0, 0, 0.7), ...N.weight(3, 0, 0, 0.85),
    ...say('THE NETWORK CHANGES ITS WEIGHTS'));
  await until(S(37)); await play(...N.flow(3, C.cyan), ...say('A WEIGHT CHANGES THE EFFECT'),
    ...box(['Weight', 'How much one activation', 'affects the next neuron']));
  await until(S(38)); await play(new M.Indicate(gradLabels[4], { color: OR }), out(weightNote),
    ...say('USE THE GRADIENT TO LOWER THE LOSS', C.green),
    ...box(['Gradient guides a weight change', ['Goal: lower loss', C.green]], C.green));

  const early = text('First layer  ·  tiny gradient', CX, STRIP_Y, OR, P ? 18 : 17);
  await until(S(39)); await play(fade(early), highlightNode(0, OR),
    ...say('EARLY WEIGHTS MAY CHANGE VERY LITTLE', OR));
  await until(S(40)); await play(out(early), new M.Indicate(gradBars[0], { color: OR }),
    new M.Indicate(gradBars[4], { color: C.amber }), ...say('COMPARE EARLY AND LATE LAYERS', OR),
    ...box([['First layer can learn slowly', OR], ['Later layers may improve', C.amber]], OR));

  await until(S(41)); await play(...say('LOSS VS GRADIENT'),
    ...box([['Loss: how wrong', C.amber], ['Gradient: how fast', OR], ['the loss changes', OR]]));
  await until(S(42)); await play(highlightNode(0, OR), ...say('HIGH LOSS, STILL A TINY EARLY GRADIENT', C.amber),
    ...box([['Loss can be high', C.amber], ['First-layer gradient = 1/16', OR]], OR));

  await until(S(43)); await play(new M.Indicate(slopes[0], { color: C.cyan }), ...say('TRY IT'),
    ...box(['Add connections', 'Drag a local gradient', ['Watch the gradients change', OR]]));
  await until(S(44)); await play(...say('TWO CHALLENGES', C.green),
    ...box(['Try both challenges', ['New data gives a fresh path', C.green]], C.green));
  await until(S(45)); await play(new M.Indicate(gradLabels[0], { color: OR }),
    ...say('VANISHING GRADIENTS', OR),
    ...box([['Gradients shrink going back', OR], 'Early layers: very slow'], OR));
}
