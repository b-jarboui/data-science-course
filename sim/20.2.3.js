// 20.2.3 Try it. Fit changes to a frozen 4 × 4 weight table.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, challenges } = kit;
  const left = [1, 2, 0, 1], top = [0.1, 0.2, 0.1, 0];
  const maxSteps = 60, goalLoss = 0.005, largeLoss = 1e6;
  const original = 0.5;
  let rank = 1, pattern = 0, row = 1, col = 1, rate = 1, speed = 2;
  let factors, history, last, prediction = null, runPrediction = null;
  let timer = null, playing = false, random = false;

  // The lesson factors form the start. The goal has one extra, independent
  // pattern at row 3, column 4, so rank one cannot match all its cells.
  function goal(a, b, extra) {
    return a.map((value, i) => b.map((weight, j) =>
      value * weight + (i === 2 && j === 3 ? extra : 0)));
  }
  const lessonGoal = () => goal(left, [0.1, 0.3, 0.1, 0], 0.5);
  let target = lessonGoal();

  const factor = (a, b) => ({ a: a.slice(), b: b.slice() });
  const changeAt = (pairs, i, j) => pairs.reduce((sum, { a, b }) => sum + a[i] * b[j], 0);
  const residual = pairs => target.map((values, i) => values.map((wanted, j) => changeAt(pairs, i, j) - wanted));
  const meanSquare = e => e.flat().reduce((sum, v) => sum + v * v, 0) / 16;
  const loss = () => meanSquare(residual(factors));
  const stepNumber = () => history.length - 1;
  const done = () => stepNumber() >= maxSteps || history.at(-1) >= largeLoss;
  const number = x => String(Number(x.toPrecision(4)));

  const drawing = s('svg', {
    viewBox: '0 0 360 360', role: 'img',
    'aria-label': 'Current and goal changes to the weights, with loss by training step'
  });
  const formula = h('div'), status = h('div', { class: 'sim-note', role: 'status' });
  const challengeBox = h('div'), counter = pill('Step 0'), rateValue = h('span'), speedValue = h('span');
  const controlStyle = {
    font: 'inherit', minHeight: '44px', maxWidth: '100%', color: C.ink,
    background: C.bg, border: '1px solid #536485', borderRadius: '.45rem', padding: '.25rem'
  };
  const selection = (name, items, onChange) => h('label', {},
    `${name} `, h('select', { style: controlStyle, onchange: e => onChange(Number(e.target.value)) },
      items.map(([value, text]) => h('option', { value }, text))));
  const indices = [0, 1, 2, 3].map(i => [i, String(i + 1)]);
  const rowControl = selection('Row', indices, i => { row = i; draw(); });
  const colControl = selection('Column', indices, i => { col = i; draw(); });
  const rankControl = selection('Rank', [[1, '1'], [2, '2']], n => {
    rank = n;
    pattern = 0;
    reset();
  });
  const patternControl = selection('Pattern to edit', [[0, '1'], [1, '2']], k => { pattern = k; draw(); });
  rowControl.lastElementChild.value = String(row);
  colControl.lastElementChild.value = String(col);

  function editFactor(key) {
    return h('input', {
      type: 'number', step: 'any', style: { ...controlStyle, width: '7rem' },
      oninput: event => {
        const input = event.target, value = input.valueAsNumber;
        if (!Number.isFinite(value) || Math.abs(value) > 100) {
          input.setCustomValidity('Enter a number from −100 to 100.');
          return;
        }
        input.setCustomValidity('');
        stop();
        factors[pattern][key][key === 'a' ? row : col] = value;
        resetHistory();
        draw(input);
      },
      onblur: event => { event.target.setCustomValidity(''); draw(); }
    });
  }

  const leftControl = editFactor('a'), topControl = editFactor('b');
  const stepButton = btn('Step', () => { stop(); step(); }, 'go');
  const playButton = btn('Play', toggle, 'go');
  const yes = btn('Can fit', () => { prediction = true; draw(); });
  const no = btn('Cannot fit', () => { prediction = false; draw(); });
  const learningRate = h('input', {
    type: 'range', min: '0.05', max: '16', step: '0.05', value: String(rate),
    oninput: event => { rate = Number(event.target.value); draw(); }
  });
  const speedSlider = h('input', {
    type: 'range', min: '1', max: '8', step: '1', value: String(speed),
    oninput: event => {
      speed = Number(event.target.value);
      if (playing) schedule();
      draw();
    }
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: train a small weight change'),
    h('p', { class: 'sub' }, 'Edit the column and row numbers or train them one step at a time. The original weights stay frozen.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, drawing,
        h('div', { class: 'sim-row' }, rankControl, patternControl, rowControl, colControl),
        h('div', { class: 'sim-row' }, h('label', {}, 'Column number ', leftControl),
          h('label', {}, 'Row number ', topControl)),
        h('div', { class: 'sim-row' }, stepButton, playButton,
          btn('Reset', reset), btn('New data', () => {
            random = true;
            target = goal([rnd(1, 2), 2, 0, rnd(1, 2)], [rnd(1, 3) / 10, rnd(3, 5) / 10, rnd(1, 3) / 10, 0],
              rnd(4, 7) / 10);
            reset();
          }),
          btn('Lesson data', () => { random = false; target = lessonGoal(); reset(); })),
        h('div', { class: 'sim-row' }, h('label', {}, 'Learning rate ', learningRate, ' ', rateValue),
          h('label', {}, 'Speed ', speedSlider, ' ', speedValue)),
        h('div', { class: 'sim-row' }, h('span', {}, 'Predict before Play. Can this rank fit the goal?'), yes, no)),
      h('div', {}, h('div', { class: 'sim-card' }, counter, formula, status),
        h('div', { class: 'sim-card' }, challengeBox)))));

  const check = challenges(challengeBox, [
    {
      text: 'With rank one, make the change in row 2, column 2 equal 0.6.',
      check: state => state.rank === 1 && Math.abs(state.cell - 0.6) < 1e-9,
      why: 'The matching column and row numbers multiply to 0.6.'
    },
    {
      text: 'Use lesson data and rank one. Predict whether both patterns can fit, then press Play.',
      check: state => !state.random && state.rank === 1 && state.prediction === false && state.step >= 3,
      why: 'One shared pattern cannot make both the top rows and the separate change in row 3.'
    },
    {
      text: 'Use rank two with lesson data and get loss below 0.005 within 25 steps.',
      check: state => !state.random && state.rank === 2 && state.step > 0 && state.step <= 25 && state.loss < goalLoss,
      why: 'Two patterns can learn the separate change as well as the shared rows.'
    },
    {
      text: 'Reset, raise the learning rate, and make the loss go up in the first step.',
      check: state => state.step === 1 && state.rate > 1 && state.loss > state.previousLoss,
      why: 'A large learning rate can change the numbers so much that the loss rises.'
    }
  ]);

  function resetHistory() {
    history = [loss()];
    last = null;
    prediction = null;
    runPrediction = null;
  }

  function reset() {
    stop();
    factors = [factor(left, top)];
    if (rank === 2) factors.push(factor([0, 0, 0.25, 0], [0, 0, 0, 0.1]));
    resetHistory();
    draw();
  }

  function step() {
    if (done()) return;
    const before = factors, e = residual(before);
    // Loss is mean squared error over 16 cells. Compute both factor updates
    // from the same old table before changing either factor.
    const scale = rate * 2 / 16;
    factors = before.map(({ a, b }) => ({
      a: a.map((value, i) => value - scale * e[i].reduce((sum, error, j) => sum + error * b[j], 0)),
      b: b.map((value, j) => value - scale * e.reduce((sum, errors, i) => sum + errors[j] * a[i], 0))
    }));
    last = { before, after: factors, rate };
    history.push(loss());
    if (done()) stop();
    draw();
  }

  function stop() {
    clearTimeout(timer);
    timer = null;
    playing = false;
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      step();
      if (playing) schedule();
    }, 1000 / speed);
  }

  function toggle() {
    if (playing) {
      stop();
    } else if (!done()) {
      if (stepNumber() === 0) runPrediction = prediction;
      playing = true;
      schedule();
    }
    draw();
  }

  function text(x, y, value, fill = C.ink, size = 13, anchor = 'middle') {
    return s('text', { x, y, fill, 'font-size': size, 'text-anchor': anchor, 'font-family': 'Consolas, monospace' }, value);
  }

  function matrix(nodes, x, title, color, values) {
    nodes.push(text(x + 72, 22, title, color, 16));
    values.forEach((valuesRow, i) => valuesRow.forEach((value, j) => {
      const dx = x + j * 36, dy = 35 + i * 35, selected = i === row && j === col;
      const display = Math.abs(value) >= 100 ? value.toExponential(1) : String(Number(value.toFixed(2)));
      nodes.push(s('rect', { x: dx, y: dy, width: 34, height: 33, rx: 4, fill: C.bg,
        stroke: selected ? C.amber : color, 'stroke-width': selected ? 2 : 1 }),
      text(dx + 17, dy + 21, display, selected ? C.amber : color, display.length > 4 ? 9 : 13));
    }));
  }

  function plot(nodes) {
    const x0 = 62, x1 = 344, y0 = 318, y1 = 222;
    const n = stepNumber(), xmax = Math.max(5, Math.ceil(n / 5) * 5);
    const ymax = Math.max(0.025, ...history);
    const x = i => x0 + i / xmax * (x1 - x0);
    const y = v => y0 - v / ymax * (y0 - y1);
    nodes.push(text(180, 203, 'Loss by training step', C.ink, 15));
    for (const tick of [0, ymax / 2, ymax]) {
      const label = tick >= 1000 ? tick.toExponential(1) : number(tick);
      nodes.push(s('line', { x1: x0, x2: x1, y1: y(tick), y2: y(tick), stroke: C.line }),
        text(x0 - 6, y(tick) + 4, label, C.muted, 11, 'end'));
    }
    for (const tick of [0, xmax]) nodes.push(text(x(tick), 335, tick, C.muted, 12));
    if (n > 0) nodes.push(s('polyline', {
      points: history.map((v, i) => `${x(i)},${y(v)}`).join(' '), fill: 'none',
      stroke: C.green, 'stroke-width': 2.5, 'stroke-linejoin': 'round'
    }));
    nodes.push(s('circle', { cx: x(n), cy: y(history[n]), r: 4, fill: C.green }));
  }

  function draw(editing) {
    const step = stepNumber(), value = history[step], cell = changeAt(factors, row, col);
    const nodes = [];
    matrix(nodes, 14, 'Current changes', C.cyan, target.map((values, i) =>
      values.map((_, j) => changeAt(factors, i, j))));
    matrix(nodes, 202, 'Goal changes', C.violet, target);
    plot(nodes);
    drawing.replaceChildren(...nodes);

    const current = factors[pattern];
    if (editing !== leftControl) leftControl.value = number(current.a[row]);
    if (editing !== topControl) topControl.value = number(current.b[col]);
    patternControl.lastElementChild.disabled = rank === 1;
    patternControl.lastElementChild.value = String(pattern);
    counter.textContent = `Step ${step}`;
    rateValue.textContent = number(rate);
    speedValue.textContent = `${speed} steps/s`;
    playButton.textContent = playing ? 'Pause' : 'Play';
    stepButton.disabled = done();
    playButton.disabled = done();
    yes.disabled = no.disabled = step > 0 || playing;
    yes.setAttribute('aria-pressed', String(prediction === true));
    no.setAttribute('aria-pressed', String(prediction === false));

    const products = factors.map(({ a, b }) => `(${number(a[row])} × ${number(b[col])})`).join(' + ');
    const lines = [`Row ${row + 1}, column ${col + 1}`,
      `Change = ${products} = ${number(cell)}`,
      `Goal change = ${number(target[row][col])}`,
      `Trainable numbers = ${rank} × 8 = ${rank * 8}`,
      [`Loss = ${number(value)}`, C.green]];
    if (row === 1 && col === 1) {
      lines.splice(2, 0, [`Frozen ${original} + change = ${number(original + cell)}`, C.cyan]);
    }
    if (last) {
      const old = changeAt(last.before, row, col), next = changeAt(last.after, row, col);
      const previous = last.before[pattern], after = last.after[pattern];
      lines.push(`Last step at rate ${number(last.rate)}`,
        `Old change = ${number(old)}`,
        `Old error = ${number(old)} − ${number(target[row][col])} = ${number(old - target[row][col])}`,
        `Column number ${number(previous.a[row])} → ${number(after.a[row])}`,
        `Row number ${number(previous.b[col])} → ${number(after.b[col])}`,
        `Change moved by ${number(next - old)} to ${number(next)}`,
        [`Loss ${number(history[step - 1])} → ${number(value)}`, C.green]);
    }
    fbox(formula, lines);
    status.textContent = value >= largeLoss ? 'The loss grew too large to continue. Reset to try another learning rate.'
      : step >= maxSteps ? '60 steps complete. Reset to try again.'
      : 'Loss is the average of the squared errors across the 16 cells.';
    check.update({ rank, step, cell: changeAt(factors, 1, 1), loss: value, previousLoss: history[step - 1],
      rate: last?.rate ?? rate, prediction: runPrediction, random });
  }

  reset();
  return stop;
}
