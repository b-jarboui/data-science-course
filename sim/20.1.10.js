// 20.1.10 Try it: split one layer and join its outputs.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = [1, 2];
  const WEIGHTS = [[1, 0, 2, 1], [0, 1, 1, 3]];
  const CAPACITY = 4;
  const COLORS = [C.cyan, C.violet, C.green, C.amber];

  let inputs = START.slice();
  let weights = WEIGHTS.map(row => row.slice());
  let count = 2, link = 0, selected = 0;
  const svg = s('svg', { viewBox: '0 0 400 380', role: 'img' });
  const box = h('div', { 'aria-live': 'polite' });
  const challengePanel = h('div');
  const status = h('p', { class: 'sim-note', role: 'status' });

  function slider(name, min, max, value, onInput) {
    const readout = h('span', {}, String(value));
    const input = h('input', {
      type: 'range', min, max, step: 1, value,
      style: { width: '100%', minWidth: 0, minHeight: '36px', accentColor: C.cyan },
      oninput: () => {
        readout.textContent = input.value;
        onInput(Number(input.value));
      },
    });
    return {
      label: h('label', { style: { display: 'block', marginTop: '0.45rem' } }, name, ' ', readout, input),
      set(value) {
        input.value = value;
        readout.textContent = String(value);
      },
    };
  }

  const inputSliders = inputs.map((value, i) =>
    slider(`Input ${i + 1}`, 0, 5, value, v => { inputs[i] = v; draw(); }));
  const devices = slider('Devices', 1, 4, count, v => { count = v; draw(); });
  const linkDelay = slider('Link time per transfer', 0, 4, link, v => { link = v; draw(); });
  const outputButtons = Array.from({ length: 4 }, (_, j) =>
    btn(`Output ${j + 1}`, () => { selected = j; draw(); }));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it with a split layer'),
    h('p', { class: 'sub' }, 'Each device holds up to four weights. Change the two inputs or the number of devices. Choose an output to see how its device calculates it.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Choose an output' }, outputButtons),
        ...inputSliders.map(control => control.label),
        devices.label, linkDelay.label,
        h('div', { class: 'sim-row' },
          btn('New data', newData, 'go'),
          btn('Reset', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, status,
          h('p', { class: 'sim-note' }, 'In this example each device calculates one output per tick. On the shared link, devices take turns receiving the input and sending back their results. A single device working locally uses no link.')),
        h('div', { class: 'sim-card' }, challengePanel)))));

  const chal = challenges(challengePanel, [
    {
      text: 'Split the layer across three devices and check the joined output.',
      check: state => state.count === 3 && state.match,
      why: 'The same four columns give the same four outputs in the same order.',
    },
    {
      text: 'Press Reset, then change only the first input to 2 to make the third output 6.',
      check: state => state.originalWeights && state.inputs[0] === 2 && state.inputs[1] === 2 && state.joined[2] === 6,
      why: 'Both inputs are now 2, so the third column gives 2 × 2 + 2 × 1 = 6.',
    },
    {
      text: 'Split across four devices and slow the link until the total takes more than four ticks.',
      check: state => state.count === 4 && state.ticks > 4,
      why: 'Sending the inputs and collecting the outputs can take longer than the calculation.',
    },
  ]);

  function newData() {
    const nextInputs = inputs.map(() => rnd(0, 5));
    const nextWeights = weights.map(row => row.map(() => rnd(0, 3)));
    if (nextInputs.every((v, i) => v === inputs[i])) nextInputs[0] = (nextInputs[0] + 1) % 6;
    inputs = nextInputs;
    weights = nextWeights;
    inputSliders.forEach((control, i) => control.set(inputs[i]));
    draw();
  }

  function reset() {
    inputs = START.slice();
    weights = WEIGHTS.map(row => row.slice());
    count = 2;
    link = 0;
    selected = 0;
    inputSliders.forEach((control, i) => control.set(inputs[i]));
    devices.set(count);
    linkDelay.set(link);
    draw();
  }

  function state() {
    const full = weights[0].map((_, j) => inputs[0] * weights[0][j] + inputs[1] * weights[1][j]);
    const groups = [];
    for (let d = 0, start = 0; d < count; d++) {
      const size = Math.floor(4 / count) + (d < 4 % count ? 1 : 0);
      const columns = Array.from({ length: size }, (_, i) => start + i);
      const values = columns.map(j => {
        const column = weights.map(row => row[j]);
        return column.reduce((sum, w, i) => sum + inputs[i] * w, 0);
      });
      groups.push({ columns, values, fits: size * inputs.length <= CAPACITY });
      start += size;
    }
    const fits = groups.every(group => group.fits);
    const joined = fits ? groups.flatMap(group => group.values) : [];
    const calculate = Math.max(...groups.map(group => group.columns.length));
    const transfer = count > 1 ? count * link : 0;
    return {
      count, groups, full, joined, fits, inputs, calculate, transfer,
      ticks: fits ? calculate + 2 * transfer : Infinity,
      match: fits && joined.every((v, j) => v === full[j]),
      originalWeights: weights.every((row, i) => row.every((v, j) => v === WEIGHTS[i][j])),
    };
  }

  const text = (value, x, y, color = C.ink, size = 16, anchor = 'middle') =>
    s('text', { x, y, fill: color, 'text-anchor': anchor, 'font-size': size, 'font-family': 'Consolas, monospace' }, value);
  const inputY = [112, 194];
  const outputY = j => 57 + j * 61;
  const inputX = 57, outputX = 270, radius = 17;
  const chipName = d => 'ABCD'[d];

  function draw() {
    const model = state();
    const picture = [
      text('Inputs', inputX, 23, C.violet),
      text('Outputs', outputX, 23, C.ink),
    ];
    const owner = [];
    model.groups.forEach((group, d) => {
      group.columns.forEach(j => { owner[j] = d; });
      const top = outputY(group.columns[0]) - 24;
      const bottom = outputY(group.columns[group.columns.length - 1]) + 24;
      const color = group.fits ? COLORS[d] : C.pink;
      picture.push(
        s('rect', { x: 245, y: top, width: 148, height: bottom - top, rx: 10, fill: C.bg, stroke: color, 'stroke-width': 1.5 }),
        text(`Device ${chipName(d)}`, 338, (top + bottom) / 2 - 3, color, 15),
        text(`${group.columns.length * inputs.length} / ${CAPACITY} weights`, 338, (top + bottom) / 2 + 14, color, 12),
      );
    });

    // Draw the selected connections last so their two weight labels stay legible.
    const ordered = [0, 1, 2, 3].filter(j => j !== selected).concat(selected);
    ordered.forEach(j => {
      weights.forEach((row, i) => {
        const w = row[j], active = j === selected;
        picture.push(s('line', {
          x1: inputX + radius, y1: inputY[i], x2: outputX - radius, y2: outputY(j),
          stroke: active ? C.amber : C.cyan, 'stroke-opacity': active ? 0.95 : 0.28,
          'stroke-width': w ? 1.5 + w : 1, 'stroke-dasharray': w ? null : '4 5',
        }));
      });
    });
    weights.forEach((row, i) => {
      const fraction = 0.48, x = inputX + radius + fraction * (outputX - inputX - 2 * radius);
      const y = inputY[i] + fraction * (outputY(selected) - inputY[i]);
      picture.push(s('circle', { cx: x, cy: y, r: 10, fill: C.bg, stroke: C.amber }),
        text(row[selected], x, y + 5, C.amber, 13));
    });

    inputs.forEach((v, i) => {
      const y = inputY[i];
      picture.push(s('circle', { cx: inputX, cy: y, r: radius, fill: C.card, stroke: C.violet, 'stroke-width': 2 }),
        text(v, inputX, y + 6));
    });
    model.full.forEach((_, j) => {
      const d = owner[j], group = model.groups[d];
      const color = j === selected ? C.amber : COLORS[d], y = outputY(j);
      picture.push(s('circle', { cx: outputX, cy: y, r: radius, fill: C.card, stroke: color, 'stroke-width': j === selected ? 3 : 2 }),
        text(group.fits ? group.values[group.columns.indexOf(j)] : '–', outputX, y + 6, color));
      outputButtons[j].setAttribute('aria-pressed', String(j === selected));
      outputButtons[j].classList.toggle('go', j === selected);
    });

    picture.push(text('Time to send, calculate, and join', 200, 301, C.ink));
    if (model.fits) {
      let left = 17;
      const unit = Math.min(62, 366 / model.ticks);
      [model.transfer, model.calculate, model.transfer].forEach((ticks, phase) => {
        if (!ticks) return;
        const width = ticks * unit;
        picture.push(s('rect', { x: left, y: 313, width: width - 2, height: 15, rx: 4,
          fill: phase === 1 ? C.cyan : C.violet }));
        left += width;
      });
      picture.push(
        text(`${model.transfer} send + ${model.calculate} calculate + ${model.transfer} join`, 200, 349, C.ink, 14),
        text(`${model.ticks} ${model.ticks === 1 ? 'tick' : 'ticks'} total`, 200, 371, C.amber, 16),
      );
    } else {
      picture.push(text('The layer exceeds the device capacity.', 200, 337, C.pink));
    }

    const j = selected, d = owner[j];
    const a = inputs[0] * weights[0][j], b = inputs[1] * weights[1][j];
    if (model.fits) {
      fbox(box, [
        `Device ${chipName(d)} · output ${j + 1}`,
        `${inputs[0]} × ${weights[0][j]} + ${inputs[1]} × ${weights[1][j]}`,
        [`${a} + ${b} = ${model.joined[j]}`, C.amber],
        `Joined       (${model.joined.join(', ')})`,
        `Whole layer  (${model.full.join(', ')})`,
      ]);
      status.textContent = 'The joined output matches the whole layer.';
    } else {
      fbox(box, [
        ['8 weights needed, 4 places', C.pink],
        `Whole layer would give (${model.full.join(', ')})`,
      ]);
      status.textContent = 'Increase the number of devices to fit the layer.';
    }
    svg.setAttribute('aria-label', model.fits
      ? `Inputs ${inputs.join(' and ')}. ${count} devices produce ${model.joined.join(', ')} in ${model.ticks} ticks.`
      : 'One device has room for four of the eight weights.');
    svg.replaceChildren(...picture);
    chal.update(model);
  }

  const checkCurrent = () => chal.update(state());
  challengePanel.addEventListener('click', checkCurrent);
  draw();

  return () => challengePanel.removeEventListener('click', checkCurrent);
}
