// 12.3.3 Try it: compare learning curves as the number of training bikes grows.
const SIZES = [6, 12, 24, 48];
const FLOOR = 1;
const LESSON = {
  stiff: { train: [1.2, 1.8, 2.0, 2.1], validation: [2.6, 2.3, 2.2, 2.1] },
  bendy: { train: [0.0, 0.2, 0.4, 0.6], validation: [5.0, 3.4, 2.2, 1.4] }
};
const HOLDOUT_SIZE = 24;

function basis(x, degree) {
  const values = [1, x];
  for (let j = 2; j <= degree; j++) values.push(2 * x * values[j - 1] - values[j - 2]);
  return values;
}

function dot(a, b) {
  return a.reduce((sum, value, i) => sum + value * b[i], 0);
}

function fit(rows, degree) {
  const sample = rows.map(([x]) => basis(x, degree));
  const q = [], r = [];
  const prices = rows.map(([, price]) => price);
  // Orthogonalize the basis columns, then solve the triangular system.
  for (let j = 0; j <= degree; j++) {
    let column = sample.map(values => values[j]);
    r[j] = Array(j + 1).fill(0);
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < j; i++) {
        const projection = dot(q[i], column);
        r[j][i] += projection;
        column = column.map((value, row) => value - projection * q[i][row]);
      }
    }
    r[j][j] = Math.sqrt(dot(column, column));
    q.push(column.map(value => value / r[j][j]));
  }
  const coefficients = new Array(degree + 1);
  for (let i = degree; i >= 0; i--) {
    let value = dot(q[i], prices);
    for (let j = i + 1; j <= degree; j++) value -= r[j][i] * coefficients[j];
    coefficients[i] = value / r[i][i];
  }
  return x => dot(basis(x, degree), coefficients);
}

function error(rows, predict) {
  return rows.reduce((sum, [x, price]) => sum + (price - predict(x)) ** 2, 0) / rows.length;
}

function makeShop(rnd) {
  function bike(x) {
    // The feature is scaled age. Independent price noise is −1 or +1.
    const price = 7 - 2.4 * x - 1.5 * x ** 2 + 1.1 * x ** 3 + (rnd(0, 1) ? 1 : -1);
    return [x, price];
  }

  const training = [];
  // Cover the age range even in the first six bikes. Each larger set
  // keeps all of the earlier bikes and adds more ages and sale prices.
  for (let i = 0; i < 6; i++) {
    training.push(bike(-1 + (i + 0.25 + Math.random() * 0.5) / 3));
  }
  while (training.length < 48) training.push(bike(2 * Math.random() - 1));
  const validation = Array.from({ length: HOLDOUT_SIZE }, () => bike(2 * Math.random() - 1));
  return { training, validation };
}

function measure(shop, degree) {
  const train = [], validation = [];
  for (const size of SIZES) {
    const rows = shop.training.slice(0, size);
    const predict = fit(rows, degree);
    train.push(error(rows, predict));
    validation.push(error(shop.validation, predict));
  }
  return { train, validation };
}

export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  let index = -1, previous = -1, shop = null, curves = LESSON, timer = null;
  const fixed = () => shop === null;

  const chart = s('svg', {
    viewBox: '0 0 400 310', role: 'img', 'aria-label': 'Training and validation error by number of training bikes'
  });
  const formula = h('div');
  const details = h('p', { class: 'sim-note' });
  const status = h('span', { class: 'sim-note', role: 'status', style: { margin: 0 } });
  const challengeRoot = h('div');

  const size = h('input', { type: 'range', min: 0, max: 4, step: 1, value: 0 });
  const speed = h('input', { type: 'range', min: 0, max: 2, step: 1, value: 1 });
  const speedLabel = h('span', {}, 'Speed: 1×');
  const degree = h('select', { style: { minHeight: '44px', font: 'inherit', color: C.ink, background: C.card } },
    ...[2, 3, 4, 5].map(n => h('option', { value: n }, String(n))));
  degree.value = '5';
  const rangeLabel = (name, input) => h('label', {
    class: 'sim-row', style: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '.15rem' }
  }, name, input);

  const stepButton = btn('Step', () => {
    pause();
    go(index + 1);
  }, 'go');
  const playButton = btn('Play', toggle);
  const resetButton = btn('Reset', reset);
  const newButton = btn('New data', () => {
    shop = makeShop(rnd);
    curves = { stiff: measure(shop, 1), bendy: measure(shop, +degree.value) };
    reset();
  });
  const exampleButton = btn('Lesson example', () => {
    shop = null;
    curves = LESSON;
    degree.value = '5';
    reset();
  });

  const check = challenges(challengeRoot, [
    {
      text: 'In the lesson example, stop where both rules have the same validation error.',
      check: state => state.example && state.n > 0 && state.bendy === state.stiff,
      why: 'At 24 bikes, both rules have a validation error of 2.2.'
    },
    {
      text: 'In the lesson example, find where the bendy rule checks better than the straight rule.',
      check: state => state.example && state.n > 0 && state.bendy < state.stiff,
      why: 'At 48 bikes, 1.4 for the bendy rule is lower than 2.1 for the straight rule.'
    },
    {
      text: 'Show the lesson example where the straight rule closes its gap above the floor.',
      check: state => state.example && state.n > 0 && state.stiff === state.stiffTrain && state.stiff > FLOOR,
      why: 'At 48 bikes, both straight-rule errors are 2.1, above the floor of 1.0.'
    },
    {
      text: 'Try New data and grow one of the fresh training piles to 48 bikes.',
      check: state => !state.example && state.n === 48,
      why: 'The same kept-aside bikes checked every fit, so you can compare what changed as the training pile grew.'
    }
  ]);

  const controls = h('div', { class: 'sim-card' }, chart,
    rangeLabel('Training bikes', size),
    h('div', { class: 'sim-row' }, stepButton, playButton, resetButton, status),
    rangeLabel(speedLabel, speed),
    h('div', { class: 'sim-row' }, newButton, exampleButton),
    h('label', { class: 'sim-row' }, 'How much can the rule bend?', degree));
  const panel = h('div', { class: 'sim' },
    h('h2', {}, 'Try it: will more bikes help?'),
    h('p', { class: 'sub' }, 'Slide the training pile or step through each size. Solid lines show training error. Dashed lines check the same kept-aside bikes. Lower is better.'),
    h('div', { class: 'sim-grid' }, controls,
      h('div', {}, h('div', { class: 'sim-card' }, formula, details), h('div', { class: 'sim-card' }, challengeRoot))));
  root.append(panel);

  const events = new AbortController();
  const on = (target, event, listener) => target.addEventListener(event, listener, { signal: events.signal });
  const rates = [0.5, 1, 2];

  on(size, 'input', () => {
    pause();
    go(+size.value - 1);
  });
  on(speed, 'input', () => {
    speedLabel.textContent = `Speed: ${rates[+speed.value]}×`;
    if (timer !== null) {
      pause();
      start();
    }
  });
  on(degree, 'change', () => {
    if (fixed()) return;
    pause();
    curves.bendy = measure(shop, +degree.value);
    draw();
  });
  on(challengeRoot, 'click', () => checkCurrent());

  function pause() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    playButton.textContent = 'Play';
    playButton.setAttribute('aria-pressed', 'false');
  }

  function start() {
    playButton.textContent = 'Pause';
    playButton.setAttribute('aria-pressed', 'true');
    timer = setTimeout(tick, 1150 / rates[+speed.value]);
  }

  function tick() {
    if (!panel.isConnected) {
      pause();
      return;
    }
    go(index + 1);
    if (index === SIZES.length - 1) pause();
    else start();
  }

  function toggle() {
    if (timer !== null) {
      pause();
      return;
    }
    if (index === SIZES.length - 1) reset();
    go(index + 1);
    if (index < SIZES.length - 1) start();
    else pause();
  }

  function reset() {
    pause();
    index = previous = -1;
    draw();
  }

  function go(next) {
    if (next === index || next < -1 || next >= SIZES.length) return;
    previous = index;
    index = next;
    draw();
  }

  function checkCurrent() {
    check.update({
      example: fixed(), n: SIZES[index] || 0, bendy: curves.bendy.validation[index],
      stiff: curves.stiff.validation[index], stiffTrain: curves.stiff.train[index]
    });
  }

  const X = i => 69 + i * 95;
  const floorLabel = 'Noise floor = 1';
  const svgText = (x, y, text, color = C.ink, anchor = 'middle', font = 15) =>
    s('text', { x, y, fill: color, 'text-anchor': anchor, 'font-size': font, 'font-family': 'Consolas, monospace' }, text);

  function drawChart() {
    const seen = Object.values(curves).flatMap(rule => [
      ...rule.train.slice(0, index + 1), ...rule.validation.slice(0, index + 1)
    ]);
    const interval = Math.max(1, Math.ceil(Math.max(5, ...seen) / 5));
    const limit = 5 * interval;
    const y = value => 245 - 197 * value / limit;
    const line = (x1, y1, x2, y2, stroke, width, dashed = false) =>
      s('line', { x1, y1, x2, y2, stroke, 'stroke-width': width, 'stroke-dasharray': dashed ? '7 5' : null });
    const elements = [
      line(47, 22, 67, 22, C.amber, 3), svgText(73, 27, 'Straight', C.amber, 'start'),
      line(201, 22, 221, 22, C.pink, 3), svgText(227, 27, 'Bendy', C.pink, 'start'),
      svgText(47, 44, 'Error', C.muted, 'start', 14)
    ];

    for (let tick = 0; tick <= limit; tick += interval) {
      elements.push(line(47, y(tick), 377, y(tick), tick === 0 ? C.muted : C.line, 1));
      // Keep the green floor tick readable when the scale expands.
      if (tick !== FLOOR && (tick === 0 || Math.abs(y(tick) - y(FLOOR)) >= 17)) {
        elements.push(svgText(39, y(tick) + 5, tick, C.muted, 'end'));
      }
    }
    if (y(0) - y(FLOOR) >= 15) elements.push(svgText(39, y(FLOOR) + 5, FLOOR, C.green, 'end'));
    elements.push(line(47, y(FLOOR), 377, y(FLOOR), C.green, 1.5, true),
      line(47, y(0), 47, y(limit), C.muted, 1),
      svgText(377, 297, floorLabel, C.green, 'end', 14),
      svgText(47, 297, 'Training bikes', C.muted, 'start', 14));

    SIZES.forEach((n, i) => {
      const active = i === index;
      if (active) elements.push(line(X(i), y(0) + 1, X(i), y(0) + 12, C.ink, 2));
      elements.push(svgText(X(i), 276, n, active ? C.ink : C.muted));
    });

    const series = [
      { values: curves.stiff.train, color: C.amber, dashed: false, radius: 4 },
      { values: curves.bendy.train, color: C.pink, dashed: false, radius: 3 },
      { values: curves.stiff.validation, color: C.amber, dashed: true, radius: 7 },
      { values: curves.bendy.validation, color: C.pink, dashed: true, radius: 5 }
    ];
    for (const { values, color, dashed } of series) {
      if (index < 1) continue;
      elements.push(s('polyline', {
        points: values.slice(0, index + 1).map((value, i) => `${X(i)},${y(value)}`).join(' '),
        fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': dashed ? '8 5' : null
      }));
    }
    for (const { values, color, dashed, radius } of series) {
      values.slice(0, index + 1).forEach((value, i) => {
        elements.push(s('circle', {
          cx: X(i), cy: y(value), r: radius + (i === index ? 1 : 0),
          fill: dashed ? 'none' : color, stroke: color, 'stroke-width': dashed ? 2 : 0
        }));
      });
    }
    chart.replaceChildren(...elements);
  }

  function number(value) {
    return fixed() ? value.toFixed(1) : fmt(value);
  }

  function signed(value) {
    const rounded = Math.round(value * (fixed() ? 10 : 100)) / (fixed() ? 10 : 100);
    return `${rounded > 0 ? '+' : ''}${number(rounded)}`;
  }

  function drawFormula() {
    if (index < 0) {
      fbox(formula, ['Ready to fit both rules', 'Step or choose a pile size.']);
      return;
    }
    const prior = previous >= 0 && previous !== index;
    const lines = [`${SIZES[index]} training bikes`, 'Rule      Train   Check'];
    for (const [key, name, color] of [['stiff', 'Straight', C.amber], ['bendy', 'Bendy', C.pink]]) {
      const { train, validation } = curves[key];
      const gap = validation[index] - train[index];
      lines.push([`${name.padEnd(9)}${number(train[index]).padStart(6)}  ${number(validation[index]).padStart(6)}`, color]);
      lines.push(`  Gap: ${number(validation[index])} − ${number(train[index])} = ${number(Math.abs(gap) < 1e-10 ? 0 : gap)}`);
      if (prior) {
        const oldCheck = validation[previous], newCheck = validation[index];
        lines.push(`  Check: ${number(oldCheck)} → ${number(newCheck)} (${signed(newCheck - oldCheck)})`);
      }
    }
    fbox(formula, lines);
  }

  function draw() {
    size.value = String(index + 1);
    size.setAttribute('aria-valuetext', index < 0 ? 'Ready' : `${SIZES[index]} training bikes`);
    status.textContent = `Step ${index + 1} of ${SIZES.length}`;
    stepButton.disabled = index === SIZES.length - 1;
    degree.disabled = fixed();
    exampleButton.disabled = fixed();
    details.textContent = fixed()
      ? 'Lesson example. New data opens a random shop where you can adjust the bendy rule.'
      : `Random shop. Both rules use the same ${HOLDOUT_SIZE} kept-aside bikes. The green line is the expected noise floor, and a single check can vary.`;
    drawChart();
    drawFormula();
    checkCurrent();
  }

  draw();
  return () => {
    pause();
    events.abort();
    panel.remove();
  };
}
