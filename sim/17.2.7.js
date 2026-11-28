// 17.2.7 Try it. Trace a backward signal, then train with the same path.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, challenges } = kit;
  const START = [0.5, 0.5, 0.5, 0.5];
  const MAX_LINKS = 7;
  const MAX_STEPS = 40;
  const ANSWER = 3;
  const START_GUESS = 8;
  const showNumber = value => String(Number(value.toPrecision(5))).replace(/^-/, '−');

  let slopes = START.slice();
  let selected = slopes.length - 1;
  let offsets, results, losses, lastStep;
  let timer = null;

  const svg = s('svg', { viewBox: '0 0 420 152', role: 'img', 'aria-label': 'Network path' });
  const chart = s('svg', { viewBox: '0 0 420 160', role: 'img', 'aria-label': 'Loss by iteration' });
  const formula = h('div');
  const challengeHost = h('div');
  const counter = pill('Iteration 0', C.green);
  const selector = h('select', { 'aria-label': 'Link to edit', onchange: () => {
    selected = Number(selector.value);
    draw();
  } });
  const slope = h('input', { type: 'range', min: 0, max: 1, step: 0.05, 'aria-label': 'Local slope',
    oninput: () => {
      slopes[selected] = Number(slope.value);
      reset();
    },
  });
  const slopeValue = h('output');
  const rate = h('input', { type: 'range', min: 0.05, max: 2, step: 0.05, value: 0.2,
    'aria-label': 'Learning rate', oninput: () => { rateValue.textContent = rate.value; } });
  const rateValue = h('output', {}, '0.2');
  const speed = h('input', { type: 'range', min: 1, max: 8, step: 1, value: 2,
    'aria-label': 'Iterations per second', oninput: () => {
      speedValue.textContent = `${speed.value} steps/s`;
      if (timer !== null) {
        stop();
        toggle();
      }
    },
  });
  const speedValue = h('output', {}, '2 steps/s');

  const add = btn('Add a link', () => {
    slopes.push(0.5);
    selected = slopes.length - 1;
    configure();
  });
  const remove = btn('Remove a link', () => {
    slopes.pop();
    selected = Math.min(selected, slopes.length - 1);
    configure();
  });
  const step = btn('Step', advance, 'go');
  const play = btn('Play', toggle);
  const newData = btn('New data', () => {
    let fresh;
    do {
      fresh = Array.from({ length: rnd(2, MAX_LINKS) }, () => rnd(2, 10) / 10);
    } while (fresh.join() === slopes.join());
    slopes = fresh;
    selected = slopes.length - 1;
    configure();
  });
  const example = btn('Four half links', () => {
    slopes = START.slice();
    selected = slopes.length - 1;
    configure();
  });

  // The fixed probe starts at 1. In the training example the starting
  // gradient is the signed error for the current guess.
  function signals(start) {
    const values = Array(slopes.length + 1);
    values[slopes.length] = start;
    for (let i = slopes.length - 1; i >= 0; i--) values[i] = values[i + 1] * slopes[i];
    return values;
  }

  function forward() {
    const values = [offsets[0]];
    slopes.forEach((factor, i) => values.push(values[i] * factor + offsets[i + 1]));
    return values;
  }

  function loss(guess) {
    return (guess - ANSWER) ** 2 / 2;
  }

  function stop() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    play.textContent = 'Play';
  }

  function toggle() {
    if (timer !== null) {
      stop();
      return;
    }
    if (losses.length > MAX_STEPS) return;
    play.textContent = 'Pause';
    timer = setInterval(advance, 1000 / Number(speed.value));
  }

  function advance() {
    if (losses.length > MAX_STEPS) return;
    const end = slopes.length;
    const oldGuess = results[end];
    const error = oldGuess - ANSWER;
    const oldLoss = losses.at(-1);
    const gradient = signals(error);
    const learningRate = Number(rate.value);
    const changes = gradient.map(signal => -learningRate * signal);
    const oldFirst = offsets[0];
    const oldLast = offsets[end];

    offsets = offsets.map((value, i) => value + changes[i]);
    results = forward();
    const newGuess = results[end];
    losses.push(loss(newGuess));
    lastStep = {
      oldGuess, error, oldLoss, newGuess, learningRate,
      oldFirst, oldLast, firstChange: changes[0], lastChange: changes[end],
    };
    if (losses.length > MAX_STEPS) stop();
    draw();
  }

  function reset() {
    stop();
    offsets = Array(slopes.length + 1).fill(0);
    offsets[slopes.length] = START_GUESS;
    results = forward();
    losses = [loss(START_GUESS)];
    lastStep = null;
    draw();
  }

  function configure() {
    selector.replaceChildren(...slopes.map((_, i) => h('option', { value: i }, `Link ${i + 1}`)));
    reset();
  }

  const prediction = h('select', {
    'aria-label': 'Predicted signal after four half links',
    onchange: () => { predictionFeedback.textContent = ''; },
  },
  h('option', { value: '' }, 'Choose a signal'),
  h('option', { value: '0.5' }, 'One half'),
  h('option', { value: '0.25' }, 'One quarter'),
  h('option', { value: '0.125' }, 'One eighth'),
  h('option', { value: '0.0625' }, 'One sixteenth'));
  const predictionFeedback = h('div', { class: 'sim-note', role: 'status' });
  const predictionExtra = h('div', {},
    h('div', { class: 'sim-row' }, prediction, btn('Check prediction', () => {
      if (prediction.value === '0.0625') {
        predictionFeedback.textContent = '';
        chal.update({ slopes, prediction: Number(prediction.value) });
      } else {
        predictionFeedback.textContent = prediction.value
          ? 'Halve the signal once for each of the four links.'
          : 'Choose a signal before you check.';
      }
    })),
    predictionFeedback);
  const chal = challenges(challengeHost, [
    {
      text: 'Make the signal reach one quarter using only half-strength links.',
      check: state => state.slopes.length === 2 && state.slopes.every(factor => factor === 0.5),
      why: 'Two half-strength links take the signal from one to one half and then to one quarter.',
    },
    {
      text: 'Predict the signal that reaches the first layer after four half-strength links.',
      check: state => state.prediction === 0.0625,
      why: 'Four halves in a row take the starting signal of one to one sixteenth.',
    },
  ]);
  challengeHost.querySelector('.sim-ch-why').setAttribute('role', 'status');
  challengeHost.append(predictionExtra);
  challengeHost.addEventListener('click', () => {
    predictionExtra.hidden = chal.index !== 1;
    if (chal.index === 0) {
      predictionFeedback.textContent = '';
      chal.update({ slopes });
    }
  });
  predictionExtra.hidden = true;

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it · Vanishing gradients'),
    h('p', { class: 'sub' }, 'Start the backward signal at 1 on the right. Add links or drag a local slope to change the signal at each layer.'),
    h('div', { class: 'sim-grid' },
      h('div', {},
        h('div', { class: 'sim-card' },
          svg,
          h('div', { class: 'sim-row' }, selector,
            h('label', {}, 'Local slope ', slope, ' ', slopeValue)),
          h('div', { class: 'sim-row' }, add, remove, example, newData)),
        h('div', { class: 'sim-card' },
          h('h3', {}, 'Train on the parcel label'),
          h('p', { class: 'sim-note' }, 'The toy reader starts at 8 and aims for 3. Training adjusts one number added at each circle while the local slopes stay fixed.'),
          counter,
          chart,
          h('div', { class: 'sim-row' }, step, play, btn('Reset', reset)),
          h('div', { class: 'sim-row' },
            h('label', {}, 'Learning rate ', rate, ' ', rateValue),
            h('label', {}, 'Speed ', speed, ' ', speedValue)))),
      h('div', {},
        h('div', { class: 'sim-card' }, formula),
        h('div', { class: 'sim-card' }, challengeHost)))));

  function label(value, x, y, color, size = 13, anchor = 'middle') {
    return s('text', {
      x, y, fill: color, 'font-size': size, 'text-anchor': anchor, 'font-family': 'Consolas, monospace',
    }, value);
  }

  function line(x1, y1, x2, y2, color, width = 1) {
    return s('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': width, 'stroke-linecap': 'round' });
  }

  function drawPath(probe) {
    const pitch = 360 / slopes.length;
    const x = i => 30 + i * pitch;
    const y = 70;
    const children = [
      label('← Backward signal starts at 1', 210, 15, C.violet, 14),
      label('First layer', x(0) - 14, 144, C.muted, 13, 'start'),
      label('Last layer', x(slopes.length) + 14, 144, C.muted, 13, 'end'),
    ];

    slopes.forEach((factor, i) => {
      const left = x(i), right = x(i + 1);
      const center = (left + right) / 2;
      if (i === selected) children.push(line(left + 14, y, right - 14, y, C.violet, 8));
      children.push(line(left + 14, y, right - 14, y, C.cyan, 1.5 + 4 * factor));
      children.push(label(showNumber(factor), center, y + 31, i === selected ? C.cyan : C.muted, 13));
      const hit = s('rect', {
        x: left + 14, y: y - 14, width: right - left - 28, height: 52, fill: 'transparent', cursor: 'pointer',
      });
      hit.addEventListener('click', () => {
        selected = i;
        draw();
      });
      children.push(hit);
    });

    probe.forEach((value, i) => {
      const cx = x(i);
      const barWidth = 34 * value;
      children.push(
        label(Number(value.toPrecision(2)).toString(), cx, 35, C.violet, 12),
        s('rect', { x: cx - barWidth / 2, y: 42, width: barWidth, height: 4, rx: 2, fill: C.violet }),
        s('circle', { cx, cy: y, r: 14, fill: C.card, stroke: i === slopes.length ? C.amber : C.cyan, 'stroke-width': 2 }),
        label(showNumber(Number(results[i].toPrecision(2))), cx, y + 4, C.ink, 10),
      );
    });

    svg.setAttribute('aria-label', `Backward signal from first to last layer: ${probe.map(showNumber).join(', ')}`);
    svg.replaceChildren(...children);
  }

  function drawLoss() {
    const maxLoss = Math.max(1, ...losses);
    const last = losses.length - 1;
    const stepMax = Math.max(5, last);
    const left = 70, right = 402, top = 25, bottom = 119;
    const x = i => left + (right - left) * i / stepMax;
    const y = value => bottom - (bottom - top) * value / maxLoss;
    const children = [
      label('Loss', left, 14, C.ink, 14, 'start'),
      line(left, top, left, bottom, C.muted),
      line(left, bottom, right, bottom, C.muted),
      line(left, top, right, top, C.line),
      label(showNumber(maxLoss), left - 7, top + 4, C.muted, 12, 'end'),
      label('0', left - 7, bottom + 4, C.muted, 12, 'end'),
      label('0', left, bottom + 16, C.muted, 12),
      label(String(stepMax), right, bottom + 16, C.muted, 12),
      label('Iteration', (left + right) / 2, 154, C.muted, 13),
    ];
    if (last > 0) {
      children.push(s('polyline', {
        points: losses.map((value, i) => `${x(i)},${y(value)}`).join(' '),
        fill: 'none', stroke: C.green, 'stroke-width': 2.5, 'stroke-linejoin': 'round',
      }));
    }
    children.push(s('circle', { cx: x(last), cy: y(losses[last]), r: 4, fill: C.green }));
    chart.setAttribute('aria-label', `Loss after iteration ${last}: ${showNumber(losses[last])}`);
    chart.replaceChildren(...children);
  }

  function draw() {
    const probe = signals(1);
    selector.value = selected;
    slope.value = slopes[selected];
    slopeValue.textContent = showNumber(slopes[selected]);
    add.disabled = slopes.length === MAX_LINKS;
    remove.disabled = slopes.length === 1;
    counter.textContent = `Iteration ${losses.length - 1}`;
    step.disabled = play.disabled = losses.length > MAX_STEPS;

    drawPath(probe);
    drawLoss();
    const lines = [
      `Left = right × local slope`,
      [`Link ${selected + 1}  ${showNumber(probe[selected + 1])} × ${showNumber(slopes[selected])} = ${showNumber(probe[selected])}`, C.violet],
      [`Signal at first layer = ${showNumber(probe[0])}`, C.violet],
    ];
    if (lastStep) {
      const { oldGuess, error, oldLoss, newGuess, learningRate, oldFirst, oldLast, firstChange, lastChange } = lastStep;
      lines.push(
        '',
        `Guess  ${showNumber(oldGuess)} → ${showNumber(newGuess)}`,
        `Error before step  ${showNumber(error)}`,
        `Rate used  ${showNumber(learningRate)}`,
        `First setting  ${showNumber(oldFirst)} → ${showNumber(offsets[0])}`,
        `First change   ${showNumber(firstChange)}`,
        `Last setting   ${showNumber(oldLast)} → ${showNumber(offsets.at(-1))}`,
        `Last change    ${showNumber(lastChange)}`,
        [`Loss  ${showNumber(oldLoss)} → ${showNumber(losses.at(-1))}`, C.green],
      );
    } else {
      lines.push('', `Guess ${START_GUESS} · Answer ${ANSWER}`, [`Loss = ${showNumber(losses[0])}`, C.green]);
    }
    fbox(formula, lines);
    chal.update({ slopes });
  }

  configure();
  return stop;
}
