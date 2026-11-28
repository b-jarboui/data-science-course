// 13.2.12 Try it: fit one new residual tree per step and scale its correction.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const questions = ['Steady income?', 'Has savings?', 'Repaid a previous loan?', 'Requested reminders?'];
  const example = [
    { answers: [0, 1, 1, 0], repaid: 10 },
    { answers: [1, 0, 1, 0], repaid: 10 },
    { answers: [1, 1, 0, 1], repaid: 10 },
    { answers: [1, 1, 1, 1], repaid: 10 },
    { answers: [1, 0, 0, 1], repaid: 2 },
    { answers: [0, 1, 0, 0], repaid: 2 },
    { answers: [0, 0, 1, 1], repaid: 2 },
    { answers: [0, 0, 0, 0], repaid: 2 },
  ];

  const limit = 20;
  const copyExample = () => example.map(({ answers, repaid }) => ({ answers: [...answers], repaid }));
  const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
  const mse = values => mean(values.map(value => value ** 2));
  const display = value => Math.abs(value) >= 10000 ? value.toExponential(2) : fmt(value);
  const signed = value => value > 0 ? `+${display(value)}` : display(value);
  let data = copyExample();
  let rate = 0.5;
  let selected = 0;
  let prediction = [];
  let losses = [];
  let last = null;
  let timer = null;
  let running = false;
  let originalLoans = true;

  const svg = s('svg', {
    viewBox: '0 0 400 258',
    role: 'img',
    'aria-label': 'Mean squared error by number of trees',
  });
  const box = h('div');
  const counter = h('div', { class: 'sim-note', 'aria-live': 'polite' });
  const challengeHost = h('div');
  const rateValue = h('span');
  const amountValue = h('span');
  const speedValue = h('span', {}, '1×');
  const rateSlider = h('input', {
    type: 'range', min: 0.05, max: 3, step: 0.05, value: 0.5,
    oninput: event => {
      rate = Number(event.currentTarget.value);
      reset();
    },
  });
  const speedSlider = h('input', {
    type: 'range', min: 0.5, max: 3, step: 0.5, value: 1,
    oninput: () => {
      speedValue.textContent = `${fmt(Number(speedSlider.value))}×`;
      if (running) schedule();
    },
  });
  const amountSlider = h('input', {
    type: 'range', min: 0, max: 10, step: 1, value: 10,
    oninput: event => {
      data[selected].repaid = Number(event.currentTarget.value);
      originalLoans = false;
      reset();
    },
  });
  const loanSelect = h('select', {
    onchange: event => {
      selected = Number(event.currentTarget.value);
      draw();
    },
  }, example.map((_, i) => h('option', { value: i }, `Loan ${i + 1}`)));
  const guess = h('select', { onchange: () => draw() },
    h('option', { value: '' }, 'Choose before stepping'),
    h('option', { value: 'fall' }, 'Error will fall'),
    h('option', { value: 'rise' }, 'Error will rise'));
  const stepButton = btn('Step', () => { stop(); step(); }, 'go');
  const playButton = btn('Play', togglePlay);
  const control = (name, input, value) =>
    h('label', { class: 'sim-row' }, h('span', {}, name), input, value);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: boosting shrinkage'),
    h('p', { class: 'sub' },
      'Each tree learns a correction from the latest errors. Change the learning rate to choose how much of each correction to apply.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg, counter,
        h('div', { class: 'sim-row' }, stepButton, playButton, btn('Reset', reset)),
        control('Learning rate', rateSlider, rateValue),
        control('Speed', speedSlider, speedValue),
        h('div', { class: 'sim-note' }, 'Changing the learning rate or a repayment starts the run again.'),
        h('div', { class: 'sim-row' },
          btn('New data', newData),
          btn('Lesson data', () => {
            data = copyExample();
            originalLoans = true;
            reset();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' },
          control('Show the step for', loanSelect),
          control('Amount repaid', amountSlider, amountValue),
          box),
        h('div', { class: 'sim-card' },
          control('Predict the first step', guess), challengeHost)))));

  const challenge = challenges(challengeHost, [
    {
      text: 'With the lesson data and rate 0.5, predict what the first step will do to the error, then press Step.',
      check: state => state.original && state.rate === 0.5 && state.firstGuess === 'fall'
        && state.losses.length > 1 && state.losses[1] < state.losses[0],
      why: 'The first tree applies half of its correction, and the error falls from 16 to 13.',
    },
    {
      text: 'Use the lesson data to reach an error of 4 or less in three trees or fewer.',
      check: state => state.original && state.losses.slice(1, 4).some(loss => loss <= 4),
      why: 'Your learning rate made enough progress in the first three trees to reach the target.',
    },
    {
      text: 'Make the error rise on both of the first two steps.',
      check: state => state.losses.length >= 3 && state.losses[0] < state.losses[1]
        && state.losses[1] < state.losses[2],
      why: 'The corrections overshoot, so each new tree can push the predictions further away.',
    },
  ]);
  let firstGuess = '';

  function fit(residuals) {
    let best = null;
    for (let feature = 0; feature < questions.length; feature++) {
      const yes = [];
      const no = [];
      data.forEach((loan, i) => (loan.answers[feature] ? yes : no).push(residuals[i]));
      if (!yes.length || !no.length) continue;
      const yesMean = mean(yes);
      const noMean = mean(no);
      const corrections = data.map(loan => loan.answers[feature] ? yesMean : noMean);
      const error = mse(residuals.map((residual, i) => residual - corrections[i]));
      // Keep the earlier question when the scores tie to floating-point precision.
      if (!best || best.error - error > Number.EPSILON * 8 * Math.max(best.error, error)) {
        best = { feature, yesMean, noMean, corrections, error };
      }
    }
    return best;
  }

  function step() {
    if (losses.length > limit) return;
    if (losses.length === 1) firstGuess = guess.value;
    const before = prediction;
    const residuals = data.map((loan, i) => loan.repaid - before[i]);
    const tree = fit(residuals);
    const applied = tree.corrections.map(value => rate * value);
    prediction = before.map((value, i) => value + applied[i]);
    losses.push(mse(data.map((loan, i) => loan.repaid - prediction[i])));
    last = { before, residuals, tree, applied };
    if (losses.length > limit) stop();
    draw();
  }

  function stop() {
    running = false;
    clearTimeout(timer);
    timer = null;
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      step();
      if (running) schedule();
    }, 900 / Number(speedSlider.value));
  }

  function togglePlay() {
    if (running) {
      stop();
      draw();
    } else if (losses.length <= limit) {
      running = true;
      step();
      if (running) schedule();
    }
  }

  function reset() {
    stop();
    const start = mean(data.map(loan => loan.repaid));
    prediction = data.map(() => start);
    losses = [mse(data.map(loan => loan.repaid - start))];
    firstGuess = '';
    last = null;
    draw();
  }

  function newData() {
    data = Array.from({ length: example.length }, (_, i) => {
      // Balance the first split so every dataset can fit at least one question.
      // Randomize which four loans have steady income below.
      return { answers: [Number(i < 4), rnd(0, 1), rnd(0, 1), rnd(0, 1)], repaid: rnd(0, 10) };
    });
    for (let i = data.length - 1; i > 0; i--) {
      const j = rnd(0, i);
      [data[i], data[j]] = [data[j], data[i]];
    }
    originalLoans = false;
    guess.value = '';
    reset();
  }

  function drawChart() {
    const left = 60, right = 367, top = 30, floor = 209;
    const n = losses.length - 1;
    const maxTree = n <= 5 ? 5 : n <= 10 ? 10 : limit;
    const peak = Math.max(1, ...losses);
    const magnitude = 10 ** Math.floor(Math.log10(peak));
    const tick = Math.ceil(peak / (4 * magnitude) * 10) / 10 * magnitude;
    const maxLoss = 4 * tick;
    const x = index => left + (right - left) * index / maxTree;
    const y = loss => floor - (floor - top) * loss / maxLoss;
    const text = (label, atX, atY, fill = C.muted, anchor = 'middle') =>
      s('text', { x: atX, y: atY, fill, 'text-anchor': anchor, 'font-size': 13,
        'font-family': 'Consolas, monospace' }, label);

    const marks = [text('Mean squared error', left, 16, C.ink, 'start')];
    for (let i = 0; i <= 4; i++) {
      const atY = y(i * tick);
      marks.push(s('line', { x1: left, x2: right, y1: atY, y2: atY, stroke: C.line }),
        text(display(i * tick), left - 7, atY + 4, C.ink, 'end'));
    }
    for (let i = 0; i <= maxTree; i += maxTree / 5) {
      marks.push(text(String(i), x(i), floor + 19, C.ink));
    }
    marks.push(s('line', { x1: left, x2: left, y1: top, y2: floor, stroke: C.muted }),
      s('line', { x1: left, x2: right, y1: floor, y2: floor, stroke: C.muted }),
      text('Trees added', (left + right) / 2, 250, C.ink));
    const color = losses[n] > losses[0] ? C.pink : C.cyan;
    if (n > 0) marks.push(s('polyline', {
      points: losses.map((loss, i) => `${x(i)},${y(loss)}`).join(' '),
      fill: 'none', stroke: color, 'stroke-width': 3,
    }));
    losses.forEach((loss, i) => marks.push(s('circle', {
      cx: x(i), cy: y(loss), r: i === n ? 5 : 3, fill: color,
    }, s('title', {}, `Tree ${i}: ${display(loss)}`))));
    svg.setAttribute('aria-label', `Mean squared error by tree: ${losses.map(display).join(', ')}`);
    svg.replaceChildren(...marks);
  }

  function draw() {
    const n = losses.length - 1;
    const actual = data[selected].repaid;
    drawChart();
    counter.textContent = `Trees added: ${n} / ${limit} · Mean squared error: ${display(losses[n])}`;
    rateValue.textContent = fmt(rate);
    amountValue.textContent = String(actual);
    amountSlider.value = String(actual);
    playButton.textContent = running ? 'Pause' : 'Play';
    playButton.disabled = n >= limit;
    stepButton.disabled = n >= limit;
    guess.disabled = n > 0;

    const details = [
      [`Loan ${selected + 1} repaid ${actual}`, C.cyan],
    ];
    if (last) {
      const { before, residuals, tree, applied } = last;
      const answer = data[selected].answers[tree.feature] ? 'Yes' : 'No';
      details.push(`Tree ${n}: ${questions[tree.feature]}`,
        `Yes ${signed(tree.yesMean)} · No ${signed(tree.noMean)}`,
        `Old prediction: ${display(before[selected])}`,
        `Residual: ${actual} − (${display(before[selected])}) = ${signed(residuals[selected])}`,
        `Apply: ${fmt(rate)} × (${signed(tree.corrections[selected])}) = ${signed(applied[selected])}`,
        [`New prediction: ${display(before[selected])} + (${signed(applied[selected])}) = ${display(prediction[selected])}`, C.amber],
        `Mean squared error: ${display(losses[n - 1])} → ${display(losses[n])}`);
    } else {
      details.push(`Start at the mean: ${display(prediction[selected])}`,
        `Mean squared error: ${display(losses[0])}`,
        'Press Step to fit the first correction tree.');
    }
    fbox(box, details);
    challenge.update({ original: originalLoans, rate, firstGuess, losses });
  }

  reset();
  return stop;
}
