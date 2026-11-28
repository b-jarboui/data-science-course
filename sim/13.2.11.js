// Fit one-question regression trees to the current repayment residuals.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [10, 10, 10, 10, 2, 2, 2, 2];
  const QUESTIONS = [
    { name: 'Steady income', yes: [2, 3, 4, 5] },
    { name: 'Savings', yes: [1, 3, 4, 6] },
    { name: 'Previous loan repaid', yes: [1, 2, 4, 7] },
    { name: 'Requested reminders', yes: [3, 4, 5, 7] },
  ].map(q => ({ ...q, answers: START.map((_, i) => Number(q.yes.includes(i + 1))) }));
  const MAX_STEPS = 12;
  const average = values => values.reduce((sum, v) => sum + v, 0) / values.length;
  const mse = (actual, predicted) => average(actual.map((v, i) => (v - predicted[i]) ** 2));

  let actual = START.slice(), predicted, history, last, firstPrediction;
  let selected = 0, rate = 1, running = false, timer = null;

  const svg = s('svg', { viewBox: '0 0 400 390', role: 'img', 'aria-label': 'Repayment stacks and training error' });
  const box = h('div'), challengeBox = h('div');
  const iteration = h('strong');
  const amountLabel = h('span'), rateLabel = h('span'), speedLabel = h('span');
  const appPicker = h('select', { class: 'sim-btn', 'aria-label': 'Application' },
    START.map((_, i) => h('option', { value: i }, `Application ${i + 1}`)));
  const repayment = h('input', { type: 'range', min: 0, max: 10, step: 1, 'aria-label': 'Actual repayment' });
  const learningRate = h('input', { type: 'range', min: 0.25, max: 3, step: 0.25, value: 1, 'aria-label': 'Learning rate' });
  const speed = h('input', { type: 'range', min: 1, max: 5, step: 1, value: 2, 'aria-label': 'Playback speed' });
  const forecast = h('select', { class: 'sim-btn', 'aria-label': 'Prediction for the first step' },
    h('option', { value: '' }, 'Choose a direction'),
    h('option', { value: 'down' }, 'Error falls'),
    h('option', { value: 'same' }, 'Error stays the same'),
    h('option', { value: 'up' }, 'Error rises'));
  const stepButton = btn('Step', () => advance(), 'go');
  const playButton = btn('Play', togglePlay);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: gradient boosting'),
    h('p', { class: 'sub' }, 'Start with the mean. Each step fits a small tree to the gap between actual and predicted repayment.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg, iteration,
        h('div', { class: 'sim-row' },
          stepButton, playButton, btn('Reset', reset), btn('New data', newData)),
        h('label', { class: 'sim-row' }, speedLabel, speed),
        h('label', { class: 'sim-row' }, rateLabel, learningRate),
        h('div', { class: 'sim-row' }, appPicker, h('label', { class: 'sim-row', style: { marginTop: 0 } }, amountLabel, repayment)),
        h('p', { class: 'sim-note' }, 'Changing a repayment or the learning rate starts a new run.')),
      h('div', {},
        h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' },
          h('label', { class: 'sim-row', style: { marginTop: 0, marginBottom: '0.85rem' } }, 'Before step 1', forecast),
          challengeBox)))));

  const chal = challenges(challengeBox, [
    {
      text: 'With the original data and rate 1, predict what will happen to the error. Then press Step.',
      check: st => st.original && st.rate === 1 && st.firstPrediction === 'down' && st.firstLoss < st.initialLoss,
      why: 'The first tree corrects some of the starting gaps, so the error falls from 16 to 12.',
    },
    {
      text: 'With the original data, get the error to 4 or less in three trees. Try rate 1 or lower.',
      check: st => st.original && st.rate <= 1 && st.n > 0 && st.n <= 3 && st.loss <= 4,
      why: 'Each of the first three trees answers a different question and cuts the error by four.',
    },
    {
      text: 'Reset, then choose a learning rate that makes the first step increase the error.',
      check: st => st.original && st.n > 0 && st.firstLoss > st.initialLoss,
      why: 'A large learning rate can push predictions too far, so the first correction makes the error larger.',
    },
  ]);

  function setRunning(value) {
    clearTimeout(timer);
    timer = null;
    running = value;
    playButton.textContent = running ? 'Pause' : 'Play';
  }

  function startRun() {
    setRunning(false);
    predicted = actual.map(() => average(actual));
    history = [mse(actual, predicted)];
    last = null;
    firstPrediction = '';
    forecast.disabled = false;
    draw();
  }

  function reset() {
    actual = START.slice();
    selected = 0;
    rate = 1;
    forecast.value = '';
    startRun();
  }

  function newData() {
    actual = actual.map(() => rnd(0, 10));
    selected = 0;
    forecast.value = '';
    startRun();
  }

  function fit(residuals) {
    let best = null;
    // Iterating in question order gives A, B, C, D priority on ties.
    for (const question of QUESTIONS) {
      const means = [0, 1].map(answer => average(residuals.filter((_, i) => question.answers[i] === answer)));
      const values = question.answers.map(answer => means[answer]);
      const fitLoss = mse(residuals, values);
      const tolerance = best ? 1e-12 * Math.max(1, best.fitLoss, fitLoss) : 0;
      if (!best || fitLoss < best.fitLoss - tolerance) best = { question, means, values, fitLoss };
    }
    return best;
  }

  function advance() {
    if (history.length > MAX_STEPS) return;
    if (history.length === 1) {
      firstPrediction = forecast.value;
      forecast.disabled = true;
    }
    const before = predicted;
    const residuals = actual.map((v, i) => v - before[i]);
    const tree = fit(residuals);
    const applied = tree.values.map(v => rate * v);
    predicted = before.map((v, i) => v + applied[i]);
    last = { before, residuals, tree, applied };
    history.push(mse(actual, predicted));
    if (history.length > MAX_STEPS) setRunning(false);
    draw();
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      advance();
      if (running) schedule();
    }, 1600 / Number(speed.value));
  }

  function togglePlay() {
    setRunning(!running);
    if (running) schedule();
  }

  appPicker.addEventListener('change', () => {
    selected = Number(appPicker.value);
    draw();
  });
  repayment.addEventListener('input', () => {
    actual[selected] = Number(repayment.value);
    startRun();
  });
  learningRate.addEventListener('input', () => {
    rate = Number(learningRate.value);
    startRun();
  });
  speed.addEventListener('input', () => {
    speedLabel.textContent = `Speed ${speed.value} of 5`;
    if (running) schedule();
  });

  function svgText(text, x, y, fill = C.ink, size = 13, anchor = 'middle') {
    return s('text', { x, y, fill, 'font-size': size, 'text-anchor': anchor, 'font-family': 'Consolas, monospace' }, text);
  }

  function svgLine(x1, y1, x2, y2, stroke = C.line, width = 1) {
    return s('line', { x1, x2, y1, y2, stroke, 'stroke-width': width });
  }

  function short(v) {
    if (Math.abs(v) >= 1000) return v.toExponential(1);
    return fmt(Number(v.toFixed(2)));
  }

  function drawRepayment() {
    const left = 30, right = 391, top = 29, bottom = 173;
    const upper = Math.max(12, ...predicted), lower = Math.min(0, ...predicted);
    const unit = (bottom - top) / (upper - lower);
    const y = v => top + (upper - v) * unit;
    const zero = y(0), slot = (right - left) / actual.length;
    const items = [
      svgText('■ Actual', 101, 19, C.cyan, 15),
      svgText('■ Predicted', 274, 19, C.violet, 15),
    ];

    for (const v of [...new Set([lower, 0, 10, upper])].sort((a, b) => a - b)) {
      if (v === 10 && (Math.abs(y(v) - y(0)) < 15 || Math.abs(y(v) - y(upper)) < 15)) continue;
      items.push(svgLine(left, y(v), right, y(v), v === 0 ? C.muted : C.line));
      if (v === 0 || Math.abs(y(v) - zero) >= 15) items.push(svgText(short(v), left - 4, y(v) + 4, C.muted, 10, 'end'));
    }

    function bar(v, x, color) {
      const magnitude = Math.abs(v);
      if (magnitude === 0) return;
      const blocks = unit >= 3 && magnitude <= 18 ? Math.ceil(magnitude) : 1;
      const blockSize = blocks === 1 ? magnitude : 1;
      for (let j = 0; j < blocks; j++) {
        const from = j * blockSize, to = Math.min(magnitude, from + blockSize);
        const first = y(Math.sign(v) * from), second = y(Math.sign(v) * to);
        const height = Math.abs(first - second);
        const gap = Math.min(0.7, height * 0.12);
        items.push(s('rect', { x: x - 6.5, y: Math.min(first, second) + gap / 2, width: 13,
          height: Math.max(0.5, height - gap), rx: 1.4, fill: color, 'fill-opacity': 0.84 }));
      }
    }

    actual.forEach((value, i) => {
      const x = left + (i + 0.5) * slot;
      if (i === selected) items.push(s('rect', { x: x - slot / 2 + 2, y: top - 2, width: slot - 4,
        height: bottom - top + 24, rx: 5, fill: C.ink, 'fill-opacity': 0.045, stroke: C.muted, 'stroke-opacity': 0.45 }));
      bar(value, x - 8, C.cyan);
      bar(predicted[i], x + 8, C.violet);
      items.push(svgText(`#${i + 1}`, x, bottom + 17, i === selected ? C.ink : C.muted, 13));
    });
    return items;
  }

  function drawLoss() {
    const left = 48, right = 385, top = 233, bottom = 353;
    const maxLoss = Math.max(1, ...history);
    const magnitude = 10 ** Math.floor(Math.log10(maxLoss));
    const upper = Math.ceil(maxLoss / (magnitude / 2)) * (magnitude / 2);
    const x = step => left + step * (right - left) / MAX_STEPS;
    const y = loss => bottom - loss * (bottom - top) / upper;
    const items = [svgText('Mean squared error', 213, 218, C.amber, 16)];
    for (const v of [0, upper / 2, upper]) {
      items.push(svgLine(left, y(v), right, y(v)), svgText(short(v), left - 6, y(v) + 4, C.muted, 11, 'end'));
    }
    items.push(svgLine(left, top, left, bottom, C.muted), svgLine(left, bottom, right, bottom, C.muted));
    for (let step = 0; step <= MAX_STEPS; step += 2) {
      items.push(svgText(step, x(step), bottom + 15, C.muted, 12));
    }
    items.push(svgText('Trees', 213, 386, C.muted, 13));
    history.forEach((v, i) => {
      if (i > 0) items.push(svgLine(x(i - 1), y(history[i - 1]), x(i), y(v), C.amber, 2));
    });
    history.forEach((v, i) => {
      items.push(s('circle', { cx: x(i), cy: y(v), r: i === history.length - 1 ? 4 : 2.7, fill: C.amber },
        s('title', {}, `Tree count ${i}, mean squared error ${short(v)}`)));
    });
    return items;
  }

  function drawNumbers(n, loss) {
    const app = `Application ${selected + 1}`;
    if (!last) {
      const total = actual.reduce((sum, v) => sum + v, 0);
      fbox(box, [
        `Starting prediction = ${total} ÷ 8 = ${short(predicted[selected])}`,
        '',
        `${app} repaid ${actual[selected]}`,
        `Residual = ${actual[selected]} − (${short(predicted[selected])}) = ${short(actual[selected] - predicted[selected])}`,
        [`Mean squared error = ${short(loss)}`, C.amber],
      ]);
      return;
    }

    const { before, residuals, tree, applied } = last;
    const answer = tree.question.answers[selected] ? 'Yes' : 'No';
    fbox(box, [
      [`Tree ${n} · ${tree.question.name}?`, C.violet],
      `Mean residual: Yes ${short(tree.means[1])}, No ${short(tree.means[0])}`,
      '',
      `${app} · ${answer}`,
      `Actual repayment = ${actual[selected]}`,
      `Previous prediction = ${short(before[selected])}`,
      `Residual = ${actual[selected]} − (${short(before[selected])}) = ${short(residuals[selected])}`,
      `Change = ${fmt(rate)} × (${short(tree.values[selected])}) = ${short(applied[selected])}`,
      [`New prediction = ${short(before[selected])} + (${short(applied[selected])}) = ${short(predicted[selected])}`, C.violet],
      [`Mean squared error: ${short(history[n - 1])} → ${short(loss)}`, C.amber],
    ]);
  }

  function draw() {
    const n = history.length - 1, loss = history[n];
    const original = actual.every((v, i) => v === START[i]);
    iteration.textContent = `Trees fitted ${n} of ${MAX_STEPS}`;
    appPicker.value = String(selected);
    repayment.value = String(actual[selected]);
    amountLabel.textContent = `Actual repayment ${actual[selected]}`;
    learningRate.value = String(rate);
    rateLabel.textContent = `Learning rate ${fmt(rate)}`;
    speedLabel.textContent = `Speed ${speed.value} of 5`;
    stepButton.disabled = playButton.disabled = n >= MAX_STEPS;
    svg.setAttribute('aria-label', `Actual and predicted repayment by application. Mean squared error ${short(loss)} after ${n} trees.`);
    svg.replaceChildren(...drawRepayment(), ...drawLoss());
    drawNumbers(n, loss);
    chal.update({ n, loss, rate, original, firstPrediction, firstLoss: history[1], initialLoss: history[0] });
  }

  startRun();
  return () => setRunning(false);
}
