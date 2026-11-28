// 17.4.2 Backpropagation through time. Beat i = sentence i (0-based).
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  const CX = P ? 0 : -2.6;
  const PILL = P ? [0, 3.95, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, -3.6, 0] : [4.4, 0.3, 0];
  const times = ['9:00', '9:10', '9:20'];
  const temperatures = [21, 22, 21];
  const readings = [1, 2, 1];
  const target = 3;
  const rate = 0.04;

  const say = (text, color = C.cyan) => showA(text, color, PILL);
  const at = (text, x, y, color = C.ink, size = 19) =>
    T(String(text), size, color, true).moveTo([x, y, 0]);
  const line = (x1, y1, x2, y2, color, strokeWidth = 2) =>
    new M.Line({ start: [x1, y1, 0], end: [x2, y2, 0], color, strokeWidth });
  const fade = objects => objects.map(o => new M.FadeOut(o));
  const reveal = objects => objects.map(o => new M.FadeIn(o));
  const mark = (object, color = C.amber) => new M.Indicate(object, { color });
  const number = (value, digits = 2) =>
    String(Number(value.toFixed(digits))).replace('-', '−');

  let boxNow = null;
  function clearBox() {
    const animations = boxNow ? [new M.FadeOut(boxNow)] : [];
    boxNow = null;
    return animations;
  }
  function fbox(lines, color = C.cyan) {
    const size = P ? 24 : 24, rowHeight = P ? 0.42 : 0.44;
    const rows = lines.map(row => Array.isArray(row) ? row : [row, C.ink]);
    const labels = rows.map(([text, ink]) => T(text, size, ink, true));
    const width = Math.max(...labels.map(label => label.getWidth())) + 0.62;
    const height = rows.length * rowHeight + 0.30;
    const frame = new M.RoundedRectangle({
      width, height, cornerRadius: 0.16, color, strokeWidth: 2
    });
    frame.setFill(C.card, 0.95);
    frame.moveTo(BOXP);
    labels.forEach((label, i) => {
      label.moveTo([
        BOXP[0] - width / 2 + 0.31 + label.getWidth() / 2,
        BOXP[1] + ((rows.length - 1) / 2 - i) * rowHeight, 0
      ]);
    });
    const group = new M.VGroup(frame, ...labels);
    const maxWidth = P ? FW - 0.9 : 4.7;
    if (width > maxWidth) group.scale(maxWidth / width);
    const animations = clearBox();
    boxNow = group;
    return [...animations, new M.FadeIn(group)];
  }

  function round(weight) {
    const states = [0];
    for (const reading of readings) {
      states.push(weight * states[states.length - 1] + reading);
    }
    const error = states[3] - target;
    const gradients = [weight * weight * error, weight * error, error];
    const parts = gradients.map((gradient, i) => states[i] * gradient);
    const gradient = parts.reduce((sum, part) => sum + part, 0);
    const change = -rate * gradient;
    return { weight, states, error, gradients, parts, gradient, change,
      loss: error * error / 2, next: weight + change };
  }

  const rounds = [round(0.5)];
  for (let i = 1; i < 15; i++) rounds.push(round(rounds[i - 1].next));
  const [first, second] = rounds;
  const last = rounds[rounds.length - 1];

  const stateY = P ? -0.6 : -1.42;
  const inputY = stateY + 1.19;
  const cardY = P ? 2.35 : 0.99;
  const radius = 0.43;
  const N = net({ layers: [1, 1, 1, 1], center: [CX, stateY, 0], width: P ? 5.5 : 6.24, r: radius });
  const xs = N.nodes.map((_, i) => N.pos(i, 0)[0]);
  const inputs = readings.map((_, i) =>
    net({ layers: [1], center: [xs[i + 1], inputY, 0], r: 0.36 }));
  N.nodes.forEach(([node], i) => {
    const color = i === 3 ? C.amber : C.violet;
    node.setColor(color);
    node.setFill(C.card, 0.95);
  });
  inputs.forEach(input => {
    input.nodes[0][0].setColor(C.cyan);
    input.nodes[0][0].setFill(C.card, 0.95);
  });
  const feed = inputs.map((_, i) => {
    const x = xs[i + 1];
    return line(x, inputY - 0.36, x, stateY + radius, C.cyan, 4);
  });
  const weights = N.edges.map(layer => layer[0][0]);
  weights.forEach(edge => {
    edge.setColor(C.cyan);
    edge.setStrokeWidth(3.5);
    edge.setStrokeOpacity(0.65);
  });
  const stateLabel = at('hidden state', xs[0], stateY - 0.68, C.violet, 17);
  const inputLabel = at('reading', xs[0], inputY, C.cyan, 17);
  const central = at('Central', xs[0], cardY, C.cyan, 19);
  const clocks = times.map((time, i) => at(time, xs[i + 1], cardY + 0.15, C.cyan, 17));

  function card(i, value) {
    const x = xs[i + 1];
    const frame = new M.RoundedRectangle({
      width: 1.53, height: 0.78, cornerRadius: 0.13, color: C.cyan, strokeWidth: 2
    });
    frame.setFill(C.card, 0.96);
    frame.moveTo([x, cardY - 0.04, 0]);
    return new M.VGroup(frame,
      at(times[i], x, cardY + 0.12, C.cyan, 16),
      at(value, x, cardY - 0.19, C.ink, 20));
  }

  const rawCards = temperatures.map((value, i) => card(i, `${value}°C`));
  const smallCards = readings.map((value, i) => card(i, `+${value}`));
  const weightTags = weight => readings.map((_, i) =>
    at(number(weight), (xs[i] + xs[i + 1]) / 2, stateY + 0.26, C.cyan, 16));
  let tags = weightTags(first.weight);
  function changeWeight(weight) {
    const nextTags = weightTags(weight);
    const animations = [...fade(tags), ...reveal(nextTags),
      ...weights.flatMap((_, i) => N.weight(i, 0, 0, weight))];
    tags = nextTags;
    return animations;
  }

  // Use the engine's pulse on a directed copy of a connection. Only the pulse
  // is played. This also lets the signal travel down a reading connection.
  const pulseNet = net({ layers: [1, 1] });
  const pulseEdge = pulseNet.edges[0][0][0];
  function pulse(start, end, color) {
    pulseEdge.setStart(start);
    pulseEdge.setEnd(end);
    pulseEdge.setStrokeOpacity(1);
    return pulseNet.flow(0, color)[0];
  }
  const down = i => {
    const x = xs[i + 1];
    return pulse([x, inputY - 0.36, 0], [x, stateY + radius, 0], C.cyan);
  };
  const back = i => pulse(
    [xs[i + 1] - radius, stateY, 0], [xs[i] + radius, stateY, 0], C.amber);
  const forward = i => new M.LaggedStart([N.flow(i, C.cyan)[0], down(i)], {
    lagRatio: 0.25, runTime: 1.15
  });
  const gradientTags = first.gradients.map((value, i) =>
    at(number(value), xs[i + 1], stateY - 0.72, C.amber, 18));
  const showStates = result => result.states.slice(1).flatMap((value, i) =>
    N.value(i + 1, 0, number(value)));

  const plot = P
    ? { x: -2.85, right: 3.05, y: -6.45, top: -5.0 }
    : { x: 2.9, right: 6.4, y: -3.55, top: -1.45 };
  function axes(title, bottom, high) {
    return [
      line(plot.x, plot.y, plot.right, plot.y, C.muted),
      line(plot.x, plot.y, plot.x, plot.top, C.muted),
      at(title, (plot.x + plot.right) / 2, plot.top + 0.24, C.ink, 17),
      at(bottom, (plot.x + plot.right) / 2, plot.y - 0.30, C.muted, 16),
      at('0', plot.x - 0.24, plot.y, C.muted, 15),
      at(high, plot.x - 0.36, plot.top - 0.19, C.muted, 15)
    ];
  }

  await until(S(0));
  await play(new M.FadeIn(central), ...reveal(clocks), ...say('TEMPERATURE EVERY 10 MINUTES'),
    ...fbox(['Predict Central', ['every 10 minutes', C.cyan]]));
  await until(S(1));
  await play(...say('HOW DO WE CHANGE ONE SHARED WEIGHT?', C.amber),
    ...fbox(['One shared weight', ['carries memory forward', C.amber]], C.amber));
  await until(S(2));
  await play(...fade(clocks), new M.LaggedStart(reveal(rawCards), { lagRatio: 0.18, runTime: 1.2 }),
    ...say('CENTRAL TEMPERATURES'), ...fbox([['21°C → 22°C → 21°C', C.cyan]]));
  await until(S(3));
  await play(...fade(rawCards), ...reveal(smallCards), ...say('SUBTRACT 20 FROM EACH READING'),
    ...fbox(['21 − 20 = 1', '22 − 20 = 2', '21 − 20 = 1']));
  await until(S(4));
  await play(new M.LaggedStart(reveal(N.nodes.flat().slice(1)), { lagRatio: 0.17, runTime: 1.1 }),
    ...say('ONE COLUMN PER STEP'), ...fbox(['Circles = neurons', ['one column per time step', C.violet]], C.violet));
  await until(S(5));
  await play(...say('UNROLLING'), ...fbox(['One column per step', ['= unrolling', C.violet]], C.violet));
  await until(S(6));
  await play(...reveal(inputs.flatMap(input => input.nodes.flat())), ...reveal(feed),
    ...inputs.flatMap((input, i) => input.value(0, 0, readings[i], C.cyan)),
    ...reveal([inputLabel, stateLabel]), ...say('READING FEEDS HIDDEN STATE'),
    ...fbox([['Input neuron: reading', C.cyan], ['Hidden neuron: memory', C.violet]]));
  await until(S(7));
  await play(new M.FadeIn(N.nodes[0][0]), ...N.value(0, 0, 0), ...say('START WITH HIDDEN STATE 0'),
    ...fbox(['No earlier memory', ['Hidden state = 0', C.violet]], C.violet));
  await until(S(8));
  await play(...reveal(weights), ...reveal(tags), ...say('ONE SHARED WEIGHT = 0.5'),
    ...fbox(['Every cyan line', ['weight 0.5 (half)', C.cyan]]));
  await until(S(9));
  await play(...weights.map(edge => mark(edge, C.cyan)), ...say('BIGGER WEIGHT, THICKER LINE'),
    ...fbox(['Thicker line', ['= bigger weight', C.cyan]]));
  await until(S(10));
  await play(new M.LaggedStart(weights.map((_, i) => N.flow(i, C.cyan)[0]), {
    lagRatio: 0.65, runTime: 1.8
  }), ...say('TRAINING STEP 1  →', C.green), ...fbox([['Training step 1', C.green], 'left to right'], C.green));

  for (let i = 0; i < readings.length; i++) {
    await until(S(11 + i));
    await play(forward(i), ...N.value(i + 1, 0, number(first.states[i + 1])),
      ...fbox([`State at ${times[i]}`, [
        `0.5 × ${first.states[i]} + ${readings[i]} = ${first.states[i + 1]}`, C.cyan
      ]]));
  }

  await until(S(14));
  await play(mark(N.nodes[3][0]), ...say('PREDICTION FOR 9:30', C.amber),
    ...fbox(['Prediction = hidden state', ['2.25 above 20°C', C.amber]]));
  await until(S(15));
  await play(...fbox(['9:30 prediction  22.25°C', ['9:30 target      23°C', C.green], '23 − 20 = 3']));
  await until(S(16));
  await play(...say('PREDICTION TOO LOW', C.amber),
    ...fbox(['Prediction minus target', ['2.25 − 3 = −0.75', C.amber]], C.amber));
  await until(S(17));
  await play(...tags.map(tag => mark(tag, C.cyan)), ...say('ALL THREE LINES SHARE ONE WEIGHT'));
  await until(S(18));
  await play(new M.LaggedStart([back(2), back(1), back(0)], { lagRatio: 0.7, runTime: 1.9 }),
    ...say('BACKPROPAGATION THROUGH TIME', C.amber));
  await until(S(19));
  await play(...say('LOSS IS HALF THE SQUARED ERROR', C.amber),
    ...fbox(['½ × (−0.75)² = 0.28125', ['Loss ≈ 0.28', C.amber]], C.amber));
  await until(S(20));
  await play(...say('GRADIENT: HOW FAST LOSS CHANGES', C.amber),
    ...fbox(['State rises a little', ['How fast does loss change?', C.amber]], C.amber));
  await until(S(21));
  await play(...fbox(['Square: 2 × error', 'Take half: ½ × 2 × error', ['Gradient = error', C.amber]], C.amber));
  await until(S(22));
  await play(new M.FadeIn(gradientTags[2]), ...say('9:20 STATE GRADIENT', C.amber),
    ...fbox([['Gradient = −0.75', C.amber]], C.amber));
  await until(S(23));
  await play(back(2), ...say('← GRADIENT FLOWS BACKWARD', C.amber));
  await until(S(24));
  await play(back(2), ...fbox(['Move one step backward', ['Multiply gradient by 0.5', C.amber]], C.amber));
  await until(S(25));
  await play(new M.FadeIn(gradientTags[1]), ...say('9:10 STATE GRADIENT', C.amber),
    ...fbox(['−0.75 × 0.5 = −0.375', ['≈ −0.38', C.amber]], C.amber));
  await until(S(26));
  await play(back(1), new M.FadeIn(gradientTags[0]), ...say('9:00 STATE GRADIENT', C.amber),
    ...fbox(['−0.375 × 0.5 = −0.1875', ['≈ −0.19', C.amber]], C.amber));
  await until(S(27));
  await play(...tags.map(tag => mark(tag, C.amber)), ...fbox(['Each line has a share', ['of the weight gradient', C.amber]], C.amber),
    ...say('EACH LINE HAS A SHARE', C.amber));
  await until(S(28));
  await play(...say('PAIR EACH STATE WITH THE NEXT GRADIENT', C.amber),
    ...fbox(['Previous state', '× gradient on its right'], C.amber));

  for (let i = 2; i >= 0; i--) {
    await until(S(31 - i));
    const part = first.parts[i];
    const result = part === 0 ? '= 0' : `= ${number(part, 3)} ≈ ${number(part)}`;
    await play(mark(N.nodes[i][0], C.cyan), mark(gradientTags[i]), mark(weights[i]),
      ...say(['FIRST LINE', 'SECOND LINE', 'THIRD LINE'][i], C.amber),
      ...fbox([`${first.states[i]} × (${number(first.gradients[i], 4)})`,
        [result, C.amber]], C.amber));
  }

  await until(S(32));
  await play(...say('ADD THE THREE EXACT SHARES', C.amber),
    ...fbox(['−1.875 − 0.375 + 0', ['Weight gradient = −2.25', C.amber]], C.amber));
  await until(S(33));
  await play(...say('WEIGHT UP  ↑    LOSS DOWN  ↓', C.green), ...fbox(['Gradient below 0:', ['weight up → loss down', C.green]], C.green));
  await until(S(34));
  await play(...say('LEARNING RATE = 0.04', C.green),
    ...fbox(['Move against the gradient', ['Learning rate = 0.04', C.green]], C.green));
  await until(S(35));
  await play(...fbox(['Change = 0.04 × 2.25', ['Add 0.09', C.green]], C.green));
  await until(S(36));
  await play(...changeWeight(second.weight), ...fade(gradientTags), ...say('SHARED WEIGHT RISES', C.green),
    ...fbox([['0.50 + 0.09 = 0.59', C.green]], C.green));
  await until(S(37));
  await play(new M.LaggedStart(weights.map((_, i) => forward(i)), { lagRatio: 0.5, runTime: 1.8 }),
    ...showStates(second), ...say('TRAINING STEP 2  →', C.green),
    ...fbox(['0.59 × 2.59 + 1', ['Prediction ≈ 2.53', C.green]], C.green));
  await until(S(38));
  await play(...fbox(['2.5281 − 3', ['Error ≈ −0.47', C.amber]], C.amber));
  await until(S(39));
  await play(...fbox(['½ × (−0.4719)²', ['Loss: 0.28 → 0.11', C.green]], C.green));
  await until(S(40));
  await play(new M.LaggedStart([back(2), back(1), back(0)], { lagRatio: 0.55, runTime: 1.45 }),
    ...say('← ADD THE SHARES AGAIN', C.amber),
    ...fbox([['Weight gradient ≈ −1.50', C.amber]], C.amber));
  await until(S(41));
  await play(...fbox(['0.04 × 1.50', ['Add ≈ 0.06', C.green]], C.green));
  await until(S(42));
  await play(...changeWeight(second.next), ...showStates(rounds[2]), ...say('UPDATE THE SHARED WEIGHT', C.green),
    ...fbox([['0.59 + 0.06 ≈ 0.65', C.green]], C.green));

  const lossAxes = axes('Loss curve', 'training step 1 → 15', '0.28');
  const lossPoints = rounds.map((result, i) => [
    plot.x + 0.12 + i / (rounds.length - 1) * (plot.right - plot.x - 0.22),
    plot.y + result.loss / first.loss * (plot.top - plot.y - 0.19), 0
  ]);
  const dots = lossPoints.map(point => new M.Dot({ point, radius: 0.044, color: C.green }));
  const segments = lossPoints.slice(1).map(([x, y], i) =>
    line(lossPoints[i][0], lossPoints[i][1], x, y, C.green, 3));
  await until(S(43));
  await play(...clearBox(), ...showStates(rounds[2]), ...say('MORE TRAINING STEPS', C.green),
    ...reveal(lossAxes), ...reveal(dots.slice(0, 2)), new M.Create(segments[0]));
  await play(new M.LaggedStart(segments.slice(1).flatMap((segment, i) => [
    new M.Create(segment, { runTime: 0.19 }),
    new M.FadeIn(dots[i + 2], { runTime: 0.19 })
  ]), { lagRatio: 0.72, runTime: 3.1 }));
  await until(S(44));
  await play(...changeWeight(last.weight),
    ...showStates(last), ...say('THE PREDICTION REACHES 23°C', C.green),
    ...fbox(['Shared weight ≈ 0.73', ['20 + 3 ≈ 23°C', C.green]], C.green));
  await until(S(45));
  await play(...fade([...lossAxes, ...dots, ...segments]), ...say('THE UPDATE USES ONE SHARED GRADIENT', C.amber),
    ...fbox([['Weight gradient = sum of shares', C.amber]], C.amber));
  await until(S(46));
  await play(...fbox(['Previous state × next gradient', ['Add those shares across time', C.amber]], C.amber));
  await until(S(47));
  await play(...say('WHEN EARLIER STEPS AFFECT LATER ONES'),
    ...fbox(['Temperature: 21 → 22 → 21', 'Speech: “one” → “two” → “three”', 'Text: “see” → “you” → “soon”']));
  await until(S(48));
  await play(back(2), ...say('WEIGHT BELOW 1 SHRINKS GRADIENTS', C.amber),
    ...fbox(['One step backward', ['0.75 × 0.5 = 0.375', C.amber]], C.amber));

  const decayAxes = axes('Gradient size', 'steps backward →', '0.75');
  const decayBars = Array.from({ length: 8 }, (_, i) => {
    const slot = (plot.right - plot.x) / 8;
    const height = (plot.top - plot.y - 0.19) * 0.5 ** i;
    const bar = new M.Rectangle({ width: slot * 0.53, height, color: C.amber, strokeWidth: 0 });
    bar.setFill(C.amber, 0.86);
    bar.moveTo([plot.x + (i + 0.5) * slot, plot.y + height / 2, 0]);
    return bar;
  });
  await until(S(49));
  await play(...clearBox(), ...reveal(decayAxes), ...say('EARLY GRADIENTS FADE NEAR ZERO', C.amber),
    new M.LaggedStart(reveal(decayBars), { lagRatio: 0.25, runTime: 1.9 }));
  await until(S(50));
  await play(...fade([...decayAxes, ...decayBars]), ...say('NEXT: GATES THAT CHOOSE WHAT TO KEEP', C.violet));
  await until(S(51));
  await play(new M.LaggedStart([back(2), back(1), back(0)], { lagRatio: 0.65, runTime: 1.8 }),
    ...say('TRACE BACK, THEN UPDATE ONE WEIGHT', C.green),
    ...fbox(['Trace the gradient backward', ['Combine all three shares', C.green]], C.green));
}
