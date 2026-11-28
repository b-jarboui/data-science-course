// 17.4.2 Try it: train one shared weight on three readings.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const central = [1, 2, 1, 3];
  const defaultWeight = 0.5;
  const defaultRate = 0.04;
  let data = central.slice();
  let start = defaultWeight, rate = defaultRate, speed = 4;
  let weight = start, iteration = 0, last = null, losses = [];
  let timer = null, stopReason = '', prediction = '', firstOutcome = '';

  const svg = s('svg', { viewBox: '0 0 420 402', role: 'img' });
  const box = h('div');
  const challengeHost = h('div');
  const counter = h('div', { class: 'sim-note' });
  const status = h('div', { class: 'sim-note', role: 'status' });
  const stepButton = btn('Step', () => step(), 'go');
  const playButton = btn('Play', togglePlay);

  function slider(label, min, max, stepSize, value, change, display = fmt) {
    const input = h('input', { type: 'range', min, max, step: stepSize, value });
    const output = h('span', {}, display(value));
    const row = h('label', {
      style: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: '0.1rem 0.5rem', minWidth: 0 }
    }, h('span', {}, label), output, input);
    Object.assign(input.style, {
      gridColumn: '1 / -1', width: '100%', minWidth: 0, minHeight: '44px',
      boxSizing: 'border-box', margin: '0', accentColor: C.cyan
    });
    function set(value) {
      input.value = value;
      output.textContent = display(value);
      input.setAttribute('aria-valuetext', display(value));
    }
    set(value);
    input.addEventListener('input', () => {
      const value = Number(input.value);
      set(value);
      change(value);
    });
    return { row, set };
  }

  const times = ['9:00', '9:10', '9:20', '9:30'];
  const readingControls = data.map((value, i) =>
    slider(`${times[i]} ${i === 3 ? 'target' : 'reading'}`, 20, 28, 1, value + 20, degrees => {
      data[i] = degrees - 20;
      reset();
    }, value => `${value}°C`));
  const startControl = slider('Starting weight', -1.2, 1.2, 0.01, start, value => {
    start = value;
    reset();
  });
  const rateControl = slider('Learning rate', 0, 0.5, 0.01, rate, value => {
    rate = value;
    draw();
  }, value => value.toFixed(2));
  const speedControl = slider('Speed', 1, 10, 1, speed, value => {
    speed = value;
    if (timer !== null) {
      stopPlaying();
      startPlaying();
    }
    draw();
  }, value => `${value}/s`);

  const predict = h('select', { style: { minHeight: '44px', maxWidth: '100%' } },
    h('option', { value: '' }, 'Choose a prediction'),
    h('option', { value: 'lower' }, 'Loss will go down'),
    h('option', { value: 'same-or-higher' }, 'Loss will stay the same or go up'));
  predict.addEventListener('change', () => {
    prediction = predict.value;
    draw();
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: train a shared weight'),
    h('p', { class: 'sub' },
      'Use three Central readings to forecast 9:30. The neurons show degrees above 20°C. Follow the yellow gradients back, then update the shared weight.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg, counter, status,
        h('div', { class: 'sim-row' }, stepButton, playButton,
          btn('Reset', reset), btn('New data', newData), btn('Central data', restoreCentral)),
        h('div', { class: 'sim-row' },
          h('label', {}, 'Predict what one update will do to loss', h('br'), predict)),
        h('div', { style: {
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 9rem), 1fr))',
          gap: '0.3rem 0.8rem', marginTop: '0.8rem'
        } }, ...readingControls.map(control => control.row),
        startControl.row, rateControl.row, speedControl.row)),
      h('div', {}, h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' }, challengeHost)))));

  const checks = challenges(challengeHost, [
    {
      text: 'Predict what one update will do to loss, then press Step to check.',
      check: state => state.prediction !== '' && state.prediction === state.firstOutcome,
      why: 'Your prediction matches the change in loss after the weight update.'
    },
    {
      text: 'With the Central data and a starting weight of 0.5, get loss below 0.01 in three updates or fewer.',
      check: state => state.central && state.start === defaultWeight &&
        state.iteration >= 1 && state.iteration <= 3 && state.loss < 0.01,
      why: 'Your learning rate moved the weight close enough to make the forecast nearly match the target.'
    },
    {
      text: 'With the same Central data and starting weight, make the first update raise the loss.',
      check: state => state.central && state.start === defaultWeight &&
        state.iteration > 0 && state.firstLoss > state.initialLoss + 1e-10,
      why: 'Your first update moved the weight too far, so the forecast ended farther from the target.'
    }
  ]);

  function evaluate(w) {
    const states = [0];
    for (const reading of data.slice(0, 3)) states.push(w * states[states.length - 1] + reading);
    const error = states[3] - data[3];
    const gradients = [w * w * error, w * error, error];
    const shares = gradients.map((gradient, i) => states[i] * gradient);
    const gradient = shares.reduce((sum, share) => sum + share, 0);
    const change = -rate * gradient;
    return { w, states, error, gradients, shares, gradient, change, rate,
      loss: error * error / 2, next: w + change };
  }

  function stopPlaying() {
    if (timer !== null) clearInterval(timer);
    timer = null;
  }

  function startPlaying() {
    if (!stopReason) timer = setInterval(step, 1000 / speed);
  }

  function togglePlay() {
    if (timer === null) startPlaying();
    else stopPlaying();
    draw();
  }

  function reset() {
    stopPlaying();
    weight = start;
    iteration = 0;
    last = null;
    losses = [evaluate(weight).loss];
    stopReason = '';
    prediction = '';
    firstOutcome = '';
    predict.value = '';
    draw();
  }

  function newData() {
    const third = rnd(1, 5);
    const nextData = [rnd(1, 5), rnd(1, 5), third, third + rnd(1, 3)];
    if (nextData.every((value, i) => value === data[i])) {
      nextData[0] = nextData[0] % 5 + 1;
    }
    data = nextData;
    readingControls.forEach((control, i) => control.set(data[i] + 20));
    reset();
  }

  function restoreCentral() {
    data = central.slice();
    start = defaultWeight;
    rate = defaultRate;
    readingControls.forEach((control, i) => control.set(data[i] + 20));
    startControl.set(start);
    rateControl.set(rate);
    reset();
  }

  function step() {
    if (stopReason) return;
    last = evaluate(weight);
    weight = last.next;
    iteration++;
    const after = evaluate(weight);
    losses.push(after.loss);

    if (iteration === 1) {
      firstOutcome = after.loss < last.loss - 1e-10 ? 'lower' : 'same-or-higher';
    }
    if (after.loss > 1e6) {
      stopReason = 'Loss grew very large. Reset to try another learning rate.';
    } else if (Math.abs(after.error) < 0.00001) {
      stopReason = 'The forecast matches the target to the shown precision.';
    } else if (iteration === 120) {
      stopReason = 'Training paused at 120 updates. Reset to try again.';
    }
    if (stopReason) stopPlaying();
    draw();
  }

  function num(value, digits = 4) {
    const magnitude = Math.abs(value);
    if (magnitude >= 10000 || (magnitude > 0 && magnitude < 10 ** -digits)) {
      return value.toExponential(2).replaceAll('-', '−');
    }
    return String(Number(value.toFixed(digits))).replace('-', '−');
  }

  const xs = [53, 158, 263, 368];
  const stateY = 120, inputY = 59, radius = 23;
  const segment = (x1, y1, x2, y2, color, width = 1) =>
    s('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': width });
  function text(x, y, value, color = C.ink, size = 16, anchor = 'middle') {
    return s('text', {
      x, y, fill: color, 'font-size': size, 'text-anchor': anchor,
      'font-family': 'Consolas, monospace'
    }, value);
  }
  function neuron(x, y, value, color, r) {
    const label = num(value, 2);
    return [
      s('circle', { cx: x, cy: y, r, fill: C.card, stroke: color, 'stroke-width': 2.5 }),
      text(x, y + 5, label, C.ink, label.length > 5 ? 10 : label.length > 4 ? 13 : 16)
    ];
  }

  function drawPicture(result) {
    const network = [];
    const edgeColor = result.w < 0 ? C.pink : C.cyan;
    const edgeWidth = 1.5 + 4 * Math.min(1, Math.abs(result.w));
    for (let i = 0; i < 3; i++) {
      const x = xs[i + 1];
      network.push(segment(x, inputY + 18, x, stateY - radius, C.cyan, 3),
        segment(xs[i] + radius, stateY, x - radius, stateY, edgeColor, edgeWidth),
        text((xs[i] + x) / 2, stateY - 10, num(result.w, 2), edgeColor, 13),
        text(x, 26, times[i], C.cyan, 16),
        ...neuron(x, inputY, data[i], C.cyan, 18));
    }
    network.push(text(xs[0], inputY + 5, 'reading', C.cyan, 14),
      text(xs[0], stateY + 40, 'state', C.violet, 15));
    result.states.forEach((value, i) => {
      network.push(...neuron(xs[i], stateY, value, i === 3 ? C.amber : C.violet, radius));
    });
    result.gradients.forEach((gradient, i) => {
      network.push(text(xs[i + 1], stateY + 40, num(gradient, 3), C.amber, 15));
    });
    network.push(text(210, 186, '← state gradients', C.amber, 15));

    const left = 67, right = 393, top = 225, bottom = 355;
    const maxLoss = Math.max(0.01, ...losses);
    const span = Math.max(6, losses.length - 1);
    const x = i => left + i / span * (right - left);
    const y = loss => bottom - loss / maxLoss * (bottom - top);
    const chart = [text(230, 211, 'Loss after each update', C.ink, 17)];
    for (let i = 0; i <= 4; i++) {
      const gridY = bottom - i / 4 * (bottom - top);
      chart.push(segment(left, gridY, right, gridY, C.line));
    }
    chart.push(segment(left, top, left, bottom, C.muted),
      segment(left, bottom, right, bottom, C.muted),
      text(left - 7, bottom + 4, '0', C.muted, 13, 'end'),
      text(left - 7, top + 4, num(maxLoss, 2), C.muted, 13, 'end'),
      text(left, bottom + 22, '0', C.muted, 13),
      text(right, bottom + 22, span, C.muted, 13),
      text((left + right) / 2, bottom + 37, 'updates', C.muted, 15),
      s('polyline', {
        points: losses.map((loss, i) => `${x(i)},${y(loss)}`).join(' '),
        fill: 'none', stroke: C.green, 'stroke-width': 3,
        'stroke-linejoin': 'round', 'stroke-linecap': 'round'
      }),
      s('circle', { cx: x(iteration), cy: y(losses[iteration]), r: 4.5, fill: C.green }));
    svg.setAttribute('aria-label',
      `States ${result.states.map(value => num(value)).join(', ')}. ` +
      `State gradients from left to right: ${result.gradients.map(value => num(value)).join(', ')}. ` +
      `Loss after ${iteration} updates: ${num(losses[iteration])}.`);
    svg.replaceChildren(...network, ...chart);
  }

  function draw() {
    const current = evaluate(weight);
    const result = last || current;
    const loss = losses[iteration];
    drawPicture(result);
    const forecast = result.states[3];
    const signedChange = `${result.change < 0 ? '−' : '+'}${num(Math.abs(result.change), 6)}`;
    fbox(box, [
      [last ? `Round ${iteration} calculation` : 'Before the first update', C.cyan],
      `${num(result.w)} × ${num(result.states[2])} + ${data[2]} = ${num(forecast)}`,
      `Forecast = ${num(20 + forecast)}°C`,
      `Error = ${num(forecast)} − ${data[3]} = ${num(result.error)}`,
      `Loss = ½ × (${num(result.error)})² = ${num(result.loss, 6)}`,
      [last ? `Loss after update = ${num(loss, 6)}` : `Starting loss = ${num(loss, 6)}`, C.green],
      ['Weight gradient', C.amber],
      `= ${result.shares.map(share => `(${num(share, 6)})`).join(' + ')}`,
      `= ${num(result.gradient, 6)}`,
      `Change = −${result.rate.toFixed(2)} × (${num(result.gradient, 6)})`,
      [`Weight: ${num(result.w, 6)} ${signedChange} = ${num(result.next, 6)}`, C.green],
      ...(last && !stopReason ? [`Next change at rate ${rate.toFixed(2)}: ${num(current.change, 6)}`] : [])
    ]);
    counter.textContent = `Updates: ${iteration} · Shared weight: ${num(weight, 6)} · Loss: ${num(loss, 6)}`;
    status.textContent = stopReason || (firstOutcome && prediction
      ? `The first update ${losses[1] < losses[0] - 1e-10 ? 'lowered' :
        losses[1] > losses[0] + 1e-10 ? 'raised' : 'did not change'} the loss.`
      : '');
    predict.disabled = iteration > 0;
    stepButton.disabled = Boolean(stopReason);
    playButton.disabled = Boolean(stopReason);
    playButton.textContent = timer === null ? 'Play' : 'Pause';
    checks.update({
      prediction, firstOutcome, iteration, start, loss,
      central: data.every((value, i) => value === central[i]),
      firstLoss: losses[1], initialLoss: losses[0]
    });
  }

  // Recheck the current results when switching challenges, even while paused.
  challengeHost.addEventListener('click', event => {
    if (event.target.closest('button')) draw();
  });
  reset();
  return stopPlaying;
}
