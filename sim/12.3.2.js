// 12.3.2 Try it: fit the same three kinds of rules and repeat the age-four test.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, fmt, rnd, challenges } = kit;
  const ages = [1, 2, 3, 4, 5, 6];
  const startingPrices = [10, 6, 8, 7, 3, 5];
  const degrees = [1, 2, 5];
  const names = ['Yellow line', 'Green curve', 'Pink curve'];
  const colors = [C.amber, C.green, C.pink];
  const chooseAge = 4;
  const target = 6;
  const noise = 1;
  const limit = 80;
  const average = values => values.reduce((sum, value) => sum + value, 0) / values.length;
  const inner = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
  const z = age => (age - 3.5) / 2.5;

  // Build an orthogonal polynomial basis once on the six equally spaced ages.
  // Orthogonal projection gives each least-squares fit, including interpolation at degree 5.
  function evaluate(coefficients, x) {
    return coefficients.reduceRight((value, coefficient) => value * x + coefficient, 0);
  }

  const basis = [];
  for (let power = 0; power <= 5; power++) {
    const coefficients = Array.from({ length: power + 1 }, (_, i) => Number(i === power));
    for (const previous of basis) {
      const values = ages.map(age => evaluate(coefficients, z(age)));
      const projection = inner(values, previous.values) / previous.norm;
      previous.coefficients.forEach((value, i) => { coefficients[i] -= projection * value; });
    }
    const values = ages.map(age => evaluate(coefficients, z(age)));
    basis.push({ coefficients, values, norm: inner(values, values) });
  }

  function fit(prices, degree) {
    const terms = basis.slice(0, degree + 1).map(term => ({
      coefficients: term.coefficients,
      weight: inner(prices, term.values) / term.norm
    }));
    return age => terms.reduce((sum, term) =>
      sum + term.weight * evaluate(term.coefficients, z(age)), 0);
  }

  // Random prices use a curved town average and equally likely ±1 sale noise.
  // At age four the average is exactly 6 and the noise variance is exactly 1.
  function sample() {
    return ages.map(age => {
      const delta = age - chooseAge;
      return Math.round((target - 0.65 * delta + 0.27 * delta ** 2) * 100) / 100
        + (rnd(0, 1) === 0 ? -1 : 1);
    });
  }

  let initial = startingPrices.slice();
  let prices = initial.slice();
  let selected = 0;
  let last = null;
  let timer = null;
  let trial = 0;
  let history = degrees.map(() => []);
  let totals = degrees.map(() => ({ guess: 0, square: 0 }));
  let forecast = -1;

  const box = h('div');
  const challengePanel = h('div');
  const status = h('p', { class: 'sim-note', role: 'status' });
  const svg = s('svg', {
    viewBox: '0 0 420 446', role: 'img',
    'aria-label': 'Bike prices and the current fit, above running new-bike errors for the three rules'
  });
  const slider = h('input', {
    type: 'range', min: 1, max: 12, step: 0.25, value: prices[3],
    'aria-label': 'Age-four training sale price in hundreds of dollars',
    oninput: () => { prices[3] = Number(slider.value); draw(); }
  });
  const saleLabel = h('span');
  const speed = h('input', {
    type: 'range', min: 1, max: 8, step: 1, value: 3, 'aria-label': 'Trials per second',
    oninput: () => { speedLabel.textContent = `${speed.value} trials/s`; if (timer !== null) start(); }
  });
  const speedLabel = h('span', {}, '3 trials/s');
  const ruleButtons = names.map((name, i) => btn(name, () => { selected = i; draw(); }));
  ruleButtons.forEach((button, i) => { button.style.borderColor = colors[i]; });
  const stepButton = btn('Step', step, 'go');
  const playButton = btn('Play', () => { if (timer === null) start(); else stop(); });
  const predictions = h('select', {
    'aria-label': 'Predict which rule will have the smallest new-bike error',
    onchange: () => { forecast = Number(predictions.value); draw(); }
  }, h('option', { value: -1 }, 'Choose a rule'),
  ...names.map((name, i) => h('option', { value: i }, name)));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: how bendy should the rule be?'),
    h('p', { class: 'sub' }, 'Move the age-four sale to see how the fitted rule reacts. Press Step to fit all three rules on a fresh set of six bikes and compare their age-four guesses.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, ...ruleButtons),
        h('label', { class: 'sim-row' }, 'Age-four sale', slider, saleLabel),
        h('div', { class: 'sim-row' }, stepButton, playButton,
          btn('Reset', () => reset(false)), btn('New data', () => reset(true))),
        h('label', { class: 'sim-row' }, 'Speed', speed, speedLabel),
        h('label', { class: 'sim-row' }, 'Predict the best rule', predictions),
        status),
      h('div', {}, h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' }, challengePanel)))));

  const checks = challenges(challengePanel, [
    {
      text: 'Choose the rule that can get training error down to zero.',
      check: st => st.selected === 2 && st.trainingError < 1e-9,
      why: 'The pink curve goes through all six training prices, so there are no gaps to square.'
    },
    {
      text: 'Move the age-four sale by at least $200 and choose the rule whose age-four guess moves by the same amount.',
      check: st => st.selected === 2 && Math.abs(st.move) >= 2 && Math.abs(st.move - st.guessMove) < 1e-8,
      why: 'The pink curve follows the age-four dot all the way, even if that sale was unusual.'
    },
    {
      text: 'Reset, predict the lowest new-bike error, then run at least 24 trials to check your guess.',
      check: st => st.trial >= 24 && st.forecast >= 0 && st.forecast === st.winner,
      why: 'The winning rule has the smallest average squared miss on new age-four bikes in this run.'
    }
  ]);

  function stop() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    playButton.textContent = 'Play';
  }

  function start() {
    stop();
    if (trial >= limit) return;
    playButton.textContent = 'Pause';
    timer = setInterval(step, 1000 / Number(speed.value));
  }

  function reset(randomize) {
    stop();
    if (randomize) initial = sample();
    prices = initial.slice();
    slider.value = prices[3];
    history = degrees.map(() => []);
    totals = degrees.map(() => ({ guess: 0, square: 0 }));
    trial = 0;
    last = null;
    forecast = -1;
    predictions.value = '-1';
    draw();
  }

  function step() {
    if (trial >= limit) return;
    const fresh = sample();
    const previous = last;
    trial++;
    last = {
      prices: fresh,
      guesses: degrees.map(degree => fit(fresh, degree)(chooseAge)),
      previous: previous?.guesses
    };
    last.guesses.forEach((guess, i) => {
      const total = totals[i];
      total.guess += guess;
      total.square += (guess - target) ** 2;
      history[i].push(total.square / trial + noise);
    });
    if (trial === limit) stop();
    draw();
  }

  function draw() {
    const predict = fit(prices, degrees[selected]);
    const current = predict(chooseAge);
    const trainingError = average(ages.map((age, i) => (prices[i] - predict(age)) ** 2));
    const fitPoints = Array.from({ length: 101 }, (_, i) => {
      const age = 1 + i / 20;
      return [age, predict(age)];
    });
    const ys = fitPoints.map(([, y]) => y);
    const low = Math.min(0, Math.floor(Math.min(...ys)));
    const high = Math.max(12, Math.ceil(Math.max(...ys)));
    const x = age => 45 + (age - 1) * 67.4;
    const y = price => 200 - 155 * (price - low) / (high - low);
    const text = (at, top, value, color = C.muted, anchor = 'middle', size = 15) =>
      s('text', { x: at, y: top, fill: color, 'text-anchor': anchor,
        'font-size': size, 'font-family': 'Consolas, monospace' }, value);
    const line = (x1, y1, x2, y2, color = C.line, dash) =>
      s('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': 1.5, 'stroke-dasharray': dash });
    const curve = (points, color) => s('polyline', {
      points: points.map(p => p.join(',')).join(' '), fill: 'none',
      stroke: color, 'stroke-width': 2.7, 'stroke-linejoin': 'round'
    });

    const parts = [text(45, 26, 'Training price ($100s)', C.ink, 'start', 17)];
    for (const tick of [0, 3, 6, 9, 12]) {
      const color = tick === target ? C.violet : C.line;
      parts.push(line(40, y(tick), 387, y(tick), color, tick === target ? '6 5' : null),
        text(34, y(tick) + 5, tick, tick === target ? C.violet : C.muted, 'end'));
    }
    parts.push(line(x(4), 44, x(4), 200, C.muted, '4 6'));
    parts.push(curve(fitPoints.map(([age, price]) => [x(age), y(price)]), colors[selected]));
    prices.forEach((price, i) => {
      const cx = x(ages[i]), cy = y(price);
      parts.push(s('circle', { cx, cy, r: 10, fill: C.cyan, 'fill-opacity': 0.16 }));
      parts.push(i === 2 || i === 5
        ? s('rect', { x: cx - 4, y: cy - 4, width: 8, height: 8, fill: C.cyan })
        : s('circle', { cx, cy, r: i === 3 ? 6 : 4.5, fill: C.cyan }));
      parts.push(text(cx, 223, ages[i], i === 3 ? C.cyan : C.muted));
    });
    parts.push(text(214, 245, 'Age (years)'));
    parts.push(text(45, 279, 'Running error on new age-four bikes', C.ink, 'start', 16));

    const maxLoss = Math.max(3, Math.ceil(Math.max(0, ...history.flat())));
    const lossY = value => 404 - 105 * value / maxLoss;
    const span = Math.max(8, trial);
    const tx = n => 45 + 337 * (n - 1) / (span - 1);
    for (const tick of [0, maxLoss / 2, maxLoss]) {
      parts.push(line(45, lossY(tick), 382, lossY(tick)),
        text(36, lossY(tick) + 5, fmt(tick), C.muted, 'end', 14));
    }
    if (trial === 0) parts.push(text(214, 354, 'Press Step to start', C.muted));
    history.forEach((values, i) => {
      if (!values.length) return;
      const points = values.map((value, k) => [tx(k + 1), lossY(value)]);
      const [cx, cy] = points.at(-1);
      parts.push(curve(points, colors[i]), s('circle', { cx, cy, r: 4, fill: colors[i] }));
    });
    parts.push(text(45, 427, '1'), text(215, 427, 'Trial'), text(382, 427, span));
    svg.replaceChildren(...parts);

    ruleButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === selected)));
    slider.setAttribute('aria-valuetext', `$${Math.round(prices[3] * 100)}`);
    saleLabel.textContent = `$${Math.round(prices[3] * 100)}`;
    stepButton.disabled = trial >= limit;
    playButton.disabled = trial >= limit;
    status.textContent = `Trial ${trial} of ${limit}${trial === limit ? ' · Run complete' : ''}`;

    const showTraining = trainingError < 1e-9 ? '0' : fmt(trainingError);
    const rows = [
      [names[selected], colors[selected]],
      `Shown fit guesses ${fmt(current)} at age 4`,
      `Training error = ${showTraining}`
    ];
    let winner = -1;
    if (last) {
      const guess = last.guesses[selected];
      const prev = last.previous?.[selected];
      const mean = totals[selected].guess / trial;
      const bias = (mean - target) ** 2;
      const spread = Math.max(0, totals[selected].square / trial - bias);
      const errors = history.map(values => values.at(-1));
      winner = errors.indexOf(Math.min(...errors));
      rows.push(
        '',
        `Trial ${trial} prices: ${last.prices.map(fmt).join(', ')}`,
        `Age-four guess: ${prev === undefined ? '—' : fmt(prev)} → ${fmt(guess)}`,
        ...(prev === undefined ? [] : [`Change from last guess: ${fmt(guess - prev)}`]),
        `(Guess − 6)² = ${fmt((guess - target) ** 2)}`,
        `Bias² + variance + noise`,
        `${fmt(bias)} + ${fmt(spread)} + 1 ≈ ${fmt(errors[selected])}`,
        ...errors.map((error, i) => [`${names[i]}: ${fmt(error)}`, colors[i]])
      );
    }
    fbox(box, rows);
    checks.update({
      selected, trainingError, trial, forecast, winner,
      move: prices[3] - initial[3],
      guessMove: current - fit(initial, degrees[selected])(chooseAge)
    });
  }

  draw();
  return stop;
}
