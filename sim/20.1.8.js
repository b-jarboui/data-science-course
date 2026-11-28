// 20.1.8 Try it: run a series of compute experiments and compare the gains.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, fmt, rnd, challenges } = kit;
  const CAMPUS = { floor: 2, gap: 4, measured: new Map([[1, 6], [4, 4], [16, 3], [64, 2.5]]) };
  const LAST = 6;
  let data = CAMPUS;
  let history = [];
  let timer = null;
  let prediction = '';
  let halfTest = false;
  let quarterTest = false;
  let newDataTest = false;

  const svg = s('svg', {
    viewBox: '0 0 400 276',
    role: 'img',
    'aria-label': 'Average loss in bits per token at each experiment step'
  });
  const box = h('div', { 'aria-live': 'polite' });
  const note = h('div', { class: 'sim-note' });
  const count = h('span', { class: 'sim-note', style: { margin: 0 } });
  const challengePanel = h('div');

  const multiplier = h('select', {
    onchange: reset,
    class: 'sim-btn'
  }, [2, 4, 8, 16].map(value => h('option', { value, selected: value === 4 }, `×${value}`)));
  const speed = h('input', {
    type: 'range', min: 1, max: 5, value: 2,
    oninput: () => {
      if (timer !== null) schedule();
    }
  });
  const guess = h('select', {
    class: 'sim-btn',
    onchange: () => { prediction = guess.value; }
  },
  h('option', { value: '' }, 'Choose a prediction'),
  h('option', { value: 'half' }, 'Half as large'),
  h('option', { value: 'quarter' }, 'One quarter as large'),
  h('option', { value: 'same' }, 'The same size'));

  const stepButton = btn('Step', step, 'go');
  const playButton = btn('Play', toggle);
  const resetButton = btn('Reset', reset);
  const newData = btn('New data', randomize);
  const campus = btn('Campus data', () => { data = CAMPUS; multiplier.value = '4'; reset(); });
  const panel = h('div', { class: 'sim' },
    h('h2', {}, 'Try it: how much does more compute buy?'),
    h('p', { class: 'sub' }, 'Each step tests a larger compute budget. Choose how many times as much compute to use and watch the average loss change.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, count, svg,
        h('div', { class: 'sim-row' }, stepButton, playButton, resetButton),
        h('div', { class: 'sim-row' },
          h('label', {}, 'Compute per step ', multiplier),
          h('label', {}, 'Play speed ', speed)),
        h('div', { class: 'sim-row' }, newData, campus)),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengePanel,
          h('div', { class: 'sim-row' }, h('label', {}, 'Prediction for the first step ', guess))))));
  root.append(panel);

  const tasks = challenges(challengePanel, [
    {
      text: 'With ×4 and step 0 showing, predict the next distance above the lower limit, then press Step.',
      check: state => state.halfTest,
      why: 'Four times as much compute makes the square root twice as large, so the distance is half as large.'
    },
    {
      text: 'Use Campus data and ×4, then step from 64 to 256 compute units.',
      check: state => state.quarterTest,
      why: 'The fitted loss goes from 2.5 to 2.25 bits, a gain of 0.25 bits for four times as much compute.'
    },
    {
      text: 'Press New data, choose ×4, and run two steps to compare the two drops in loss.',
      check: state => state.newDataTest,
      why: 'The two drops use the same compute multiplier, and the second drop is half as large as the first.'
    }
  ]);
  const number = value => Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  const budget = value => value.toLocaleString('en-US');

  function result(compute) {
    const gap = data.gap / Math.sqrt(compute);
    const measured = data.measured.has(compute);
    return { compute, gap, measured, loss: measured ? data.measured.get(compute) : data.floor + gap };
  }

  function stop() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  function schedule() {
    stop();
    timer = setTimeout(step, 1550 - Number(speed.value) * 250);
  }

  function toggle() {
    if (timer === null && history.length <= LAST) schedule();
    else stop();
    render();
  }

  function reset() {
    stop();
    history = [result(1)];
    prediction = '';
    guess.value = '';
    render();
  }

  function randomize() {
    const floor = rnd(4, 12) / 4;
    let gap = rnd(4, 12) / 2;
    if (data.floor === floor && data.gap === gap) gap = gap === 6 ? 2 : gap + 0.5;
    data = { floor, gap, measured: new Map() };
    reset();
  }

  function step() {
    if (history.length > LAST) return;
    const index = history.length;
    const factor = Number(multiplier.value);
    const previous = history[index - 1];
    const current = result(previous.compute * factor);
    history.push(current);

    if (index === 1 && factor === 4 && prediction === 'half') halfTest = true;
    if (data === CAMPUS && previous.compute === 64 && current.compute === 256) quarterTest = true;
    if (data !== CAMPUS && factor === 4 && index === 2) newDataTest = true;

    if (history.length > LAST) stop();
    else if (timer !== null) schedule();
    render();
  }

  function drawChart() {
    const left = 48;
    const right = 378;
    const top = 32;
    const base = 223;
    const end = Math.max(4, history.length - 1);
    const x = i => left + 10 + (right - left - 20) * i / end;
    const ceiling = Math.ceil(history[0].loss);
    const bottom = Math.floor(data.floor);
    const y = value => base - (base - top) * (value - bottom) / (ceiling - bottom);

    const text = (px, py, words, fill = C.muted, anchor = 'middle') =>
      s('text', { x: px, y: py, fill, 'font-size': 14, 'text-anchor': anchor }, words);
    const line = (x1, y1, x2, y2, stroke, width = 1, dash) =>
      s('line', { x1, y1, x2, y2, stroke, 'stroke-width': width, 'stroke-dasharray': dash });

    const elements = [
      text(left, 18, 'Average loss · bits per token', C.ink, 'start'),
      line(left, top, left, base, C.muted),
      line(left, base, right, base, C.muted)
    ];
    for (let value = bottom; value <= ceiling; value++) {
      elements.push(line(left, y(value), right, y(value), C.line),
        text(left - 8, y(value) + 5, value, C.muted, 'end'));
    }
    elements.push(line(left, y(data.floor), right, y(data.floor), C.amber, 2, '6 4'));
    for (let i = 0; i <= end; i++) elements.push(text(x(i), base + 20, i));
    elements.push(text((left + right) / 2, 268, 'Experiment step', C.ink));

    history.slice(1).forEach((current, i) => {
      const previous = history[i];
      const measured = previous.measured && current.measured;
      elements.push(line(x(i), y(previous.loss), x(i + 1), y(current.loss),
        measured ? C.cyan : C.violet, 2.5, measured ? undefined : '6 4'));
    });
    history.forEach((current, i) => {
      const col = current.measured ? C.cyan : C.violet;
      elements.push(s('circle', { cx: x(i), cy: y(current.loss), r: 9, fill: col, 'fill-opacity': 0.15 }),
        s('circle', { cx: x(i), cy: y(current.loss), r: 4.5, fill: col }));
    });
    svg.replaceChildren(...elements);
  }

  function render() {
    const index = history.length - 1;
    const current = history[index];
    const previous = history[index - 1];
    const status = data !== CAMPUS ? 'Simulated' : current.measured ? 'Measured' : 'Predicted';
    const factor = Number(multiplier.value);
    const color = current.measured ? C.cyan : C.violet;
    count.textContent = `Step ${index} of ${LAST} · ${status}`;
    playButton.textContent = timer === null ? 'Play' : 'Pause';
    playButton.disabled = index === LAST;
    stepButton.disabled = index === LAST;

    const rows = previous ? [
      `Compute: ${budget(previous.compute)} × ${factor} = ${budget(current.compute)}`,
      `Old loss: ${number(previous.loss)} bits`,
      `Distance: ${number(previous.gap)} ÷ √${factor} ≈ ${number(current.gap)}`,
      [`New loss: ${fmt(data.floor)} + ${number(current.gap)} ≈ ${number(current.loss)} bits`, color],
      [`Drop: ${number(previous.loss - current.loss)} bits`, C.amber]
    ] : [
      'Compute: 1 unit',
      `Distance above the lower limit: ${number(current.gap)} bits`,
      [`Start loss: ${fmt(data.floor)} + ${number(current.gap)} = ${number(current.loss)} bits`, color]
    ];
    fbox(box, rows);

    let key = `The amber line is the fitted lower limit of ${fmt(data.floor)} bits.`;
    if (data === CAMPUS) key += ' Cyan dots are measured. Violet dots are predictions.';
    else key += ' Violet dots follow the curve for this simulated data.';
    if (index === 1 && prediction && tasks.index === 0) {
      key += factor !== 4 ? ' Choose ×4 to test this prediction.'
        : prediction === 'half' ? ' Your prediction matches the first step.'
          : ' The first distance was halved. Reset and try again.';
    }
    note.textContent = key;
    drawChart();
    tasks.update({ halfTest, quarterTest, newDataTest });
  }

  reset();
  return () => {
    stop();
    panel.remove();
  };
}
