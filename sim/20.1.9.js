// 20.1.9 Try it: update two copies of a model with shared or local gradients.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = 0.50, LIMIT = 14;
  const NEWS = [
    ['Library', 'opens', 'at', 'nine', '<end>'],
    ['Pool', 'closed', 'today', '<end>'],
    ['Exams', 'start', '<end>'],
  ];
  const ORDERS = [[0, 1, 2], [1, 2, 0], [2, 0, 1], [0, 2, 1], [2, 1, 0], [1, 0, 2]];
  const EXAMPLE = {
    targets: [[0.10, 0.70], [0.15, 0.35], [-0.05, 0.35], [0.35, -0.05]],
    blocks: [[0, 1], [2, 3], [4, 5], [1, 4]],
  };
  let data = EXAMPLE, random = false, edit = [0, 0];
  let weights = [START, START], history = [], last, timer = null;
  let played = false;

  const equal = w => Math.abs(w[0] - w[1]) < 1e-9;
  const round = n => Math.round(n * 1e10) / 1e10;
  const number = n => Math.abs(n) > 999 ? n.toExponential(2) : fmt(round(n)).replace('-', '−');
  const signed = n => `${n < -1e-9 ? '−' : '+'}${number(Math.abs(n))}`;
  const weight = n => Math.abs(n) > 999 ? n.toExponential(2) : n.toFixed(2).replace('-', '−');

  // Each block supplies a toy training loss with slope w minus its target.
  // A separate check on fixed text reproduces the lesson's illustrative
  // 3.0, 2.8 and 2.7 bits at weights 0.50, 0.45 and 0.35.
  function checkLoss(w) {
    if (w >= 0.45) return 2.8 + 4 * (w - 0.45);
    if (w >= 0.35) return 2.7 + (w - 0.35);
    return 2.62 + 2 * (w - 0.15) ** 2;
  }
  const loss = w => (checkLoss(w[0]) + checkLoss(w[1])) / 2;
  const batchIndex = step => step < 2 ? step : 2 + (step - 2) % 2;
  function nextStep() {
    const index = batchIndex(history.length - 1);
    const targets = data.targets[index];
    const gradients = weights.map((w, i) => round(w - targets[i] + (index === 0 ? edit[i] : 0)));
    const average = round((gradients[0] + gradients[1]) / 2);
    const rate = Number(rateInput.value);
    const changes = gradients.map(g => round(rate * (shareInput.checked ? average : g)));
    const next = weights.map((w, i) => round(w - changes[i]));
    return { index, old: weights.slice(), gradients, average, changes, next, rate, shared: shareInput.checked };
  }

  const diagram = s('svg', { viewBox: '0 0 440 192', role: 'img' });
  const graph = s('svg', { viewBox: '0 0 440 222', role: 'img' });
  const box = h('div'), challengeBox = h('div');
  const blockList = h('div', { class: 'sim-row' });
  const counter = h('strong', { role: 'status', 'aria-live': 'polite' });
  const note = h('div', { class: 'sim-note' });
  const playButton = btn('Play', toggle, 'go');
  const stepButton = btn('Step', step, 'go');
  const shareInput = h('input', { type: 'checkbox', checked: true, onchange: resetRun });
  const prediction = h('select', {},
    h('option', { value: '' }, 'Choose an answer'),
    h('option', { value: 'yes' }, 'Yes'),
    h('option', { value: 'no' }, 'No'));
  prediction.addEventListener('change', draw);

  function slider(label, min, max, stepSize, value, changed) {
    const output = h('span');
    const input = h('input', { type: 'range', min, max, step: stepSize, value });
    function read() {
      output.textContent = number(Number(input.value));
      input.setAttribute('aria-valuetext', output.textContent);
    }
    input.addEventListener('input', () => { read(); changed(Number(input.value)); });
    read();
    return { input, read, label: h('label', {}, label, ' ', input, ' ', output) };
  }
  const rate = slider('Learning rate', 0, 2.5, 0.05, 0.5, resetRun);
  const rateInput = rate.input;
  const speed = slider('Steps per second', 0.5, 4, 0.5, 1, () => {
    if (timer !== null) {
      pause();
      start();
    }
  });
  const gradients = [0, 1].map(i =>
    slider(`Block ${i + 1} gradient adjustment`, -0.5, 0.5, 0.05, 0, value => {
      edit[i] = value;
      resetRun();
    }));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: train two replicas'),
    h('p', { class: 'sub' },
      'Each device reads its own 12-token block. Turn gradient sharing on or off and watch what happens to the two weights.'),
    h('div', { class: 'sim-grid' },
      h('div', {},
        h('div', { class: 'sim-card' }, counter, diagram, blockList,
          h('div', { class: 'sim-row' }, stepButton, playButton, btn('Reset', resetRun),
            btn('New data', newData), btn('Lesson example', lessonExample)),
          h('div', { class: 'sim-row' }, speed.label, rate.label),
          h('div', { class: 'sim-row' }, h('label', {}, shareInput, ' Share gradients')),
          h('div', { class: 'sim-row' }, ...gradients.map(g => g.label))),
        h('div', { class: 'sim-card' }, graph)),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' },
          h('label', {}, 'With sharing on, will the weights match after a step? ', prediction),
          h('div', { style: { marginTop: '0.8rem' } }, challengeBox))))));

  const close = (a, b) => Math.abs(a - b) < 1e-8;
  const challenge = challenges(challengeBox, [
    {
      text: 'Turn sharing on, choose your prediction, then press Play.',
      check: st => st.prediction === 'yes' && st.played && st.shared && st.iteration > 0 && st.match,
      why: 'Both replicas start with the same weight and subtract the same amount.',
    },
    {
      text: 'Use the lesson data and reach 2.70 bits in two steps.',
      check: st => st.example && st.shared && st.iteration === 2 && close(st.rate, 0.5)
        && close(st.loss, 2.7) && st.match,
      why: 'The shared updates move both weights from 0.50 to 0.45 and then to 0.35.',
    },
    {
      text: 'Use the lesson data at rate 0.5 and make the weights split in one step.',
      check: st => st.example && !st.shared && st.iteration === 1 && close(st.rate, 0.5)
        && close(st.weights[0], 0.30) && close(st.weights[1], 0.60),
      why: 'The first gradient lowers its weight while the second raises its weight.',
    },
    {
      text: 'Try new data with sharing on. Find a rate above 2 that makes loss rise by step 6.',
      check: st => st.random && st.shared && st.rate > 2 && st.iteration >= 2 && st.iteration <= 6
        && st.loss > st.initialLoss && st.match,
      why: 'A large shared update can send both copies past a good weight and make their loss rise.',
    },
  ]);

  function resetRun() {
    pause();
    weights = [START, START];
    history = [loss(weights)];
    last = null;
    played = false;
    draw();
  }
  function clearEdits() {
    edit = [0, 0];
    gradients.forEach(g => { g.input.value = '0'; g.read(); });
  }
  function lessonExample() {
    data = EXAMPLE;
    random = false;
    rateInput.value = '0.5';
    rate.read();
    clearEdits();
    resetRun();
  }
  function newData() {
    const center = rnd(9, 22) / 100, spread = rnd(12, 38) / 100;
    const first = rnd(0, ORDERS.length - 1);
    const second = (first + rnd(1, ORDERS.length - 1)) % ORDERS.length;
    data = {
      targets: Array.from({ length: 4 }, (_, i) => i % 2
        ? [center + spread, center - spread]
        : [center - spread, center + spread]),
      blocks: Array.from({ length: 4 }, (_, i) =>
        [(first + i) % ORDERS.length, (second + i) % ORDERS.length]),
    };
    random = true;
    clearEdits();
    resetRun();
  }
  function step() {
    if (history.length > LIMIT) return;
    last = nextStep();
    weights = last.next;
    history.push(loss(weights));
    if (history.length > LIMIT) pause();
    draw();
  }
  function pause() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    playButton.textContent = 'Play';
  }
  function start() {
    if (history.length > LIMIT) return;
    played = true;
    playButton.textContent = 'Pause';
    timer = setInterval(step, 1000 / Number(speed.input.value));
  }
  function toggle() {
    if (timer === null) start();
    else pause();
  }

  function label(x, y, body, color = C.ink, size = 14, anchor = 'middle') {
    return s('text', { x, y, fill: color, 'font-size': size, 'text-anchor': anchor,
      'font-family': 'Consolas, monospace' }, body);
  }
  const segment = (x1, y1, x2, y2, color = C.line, width = 1) =>
    s('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': width });
  function drawNetworks(batch) {
    const elements = [];
    batch.old.forEach((old, i) => {
      const x = 6 + i * 220, w = weights[i];
      const ids = data.blocks[batch.index];
      const tokenBlock = ORDERS[ids[i]].flatMap(j => NEWS[j]);
      const g = batch.gradients[i], color = g < 0 ? C.pink : C.cyan;
      const coords = [[x + 37, 82], [x + 37, 123], [x + 102, 82], [x + 102, 123], [x + 167, 102.5]];
      const input = i === 0 ? [1, 0] : [0, 1];
      const hidden = [Math.max(0, input[0] * w + input[1] * 0.2),
        Math.max(0, input[0] * -0.3 + input[1] * 0.4)];
      const values = [...input, ...hidden, 0.3 * hidden[0] - 0.2 * hidden[1]];
      const connections = [
        [0, 2, w], [0, 3, -0.3], [1, 2, 0.2], [1, 3, 0.4], [2, 4, 0.3], [3, 4, -0.2],
      ];
      elements.push(
        s('rect', { x, y: 4, width: 208, height: 178, rx: 10, fill: C.bg, stroke: C.violet }),
        label(x + 104, 27, `Device ${i + 1}`, C.violet, 17),
        label(x + 104, 50, '12 tokens', C.muted),
        ...tokenBlock.map((word, j) => s('rect', {
          x: x + 21 + 14 * j, y: 56, width: 11, height: 5, rx: 1,
          fill: word === '<end>' ? C.amber : C.cyan,
        }, s('title', {}, word))),
        ...connections.map(([from, to, value]) => segment(...coords[from], ...coords[to],
          value < 0 ? C.pink : C.cyan, 1.2 + Math.min(1, Math.abs(value)) * 3)),
        ...coords.flatMap(([nx, ny], j) => {
          const value = Math.abs(values[j]) > 9.99 ? values[j].toExponential(0) : number(values[j]);
          return [
            s('circle', { cx: nx, cy: ny, r: 17, fill: C.card,
              stroke: j < 2 ? C.violet : j === 4 ? C.amber : C.cyan, 'stroke-width': 2 }),
            label(nx, ny + 4, value, C.ink, 11),
          ];
        }),
        label(x + 13, 164, `w ${weight(w)}`, C.ink, 15, 'start'),
        label(x + 194, 164, `${last ? 'Grad.' : 'Next grad.'} ${signed(g)}`, color, 14, 'end'),
      );
    });
    diagram.setAttribute('aria-label',
      `Device 1 weight ${weight(weights[0])}. Device 2 weight ${weight(weights[1])}.`);
    diagram.replaceChildren(...elements);
    blockList.replaceChildren(...data.blocks[batch.index].map((id, i) =>
      h('details', {}, h('summary', {}, `Device ${i + 1}’s block`),
        h('div', { class: 'sim-note' }, ORDERS[id].flatMap(j => NEWS[j]).join(' ')))));
  }

  function drawGraph() {
    const x0 = 70, x1 = 418, y0 = 180, y1 = 35;
    const low = 2.5, high = Math.max(3.1, ...history);
    const x = i => x0 + (x1 - x0) * i / LIMIT;
    const y = v => y0 - (y0 - y1) * (v - low) / (high - low);
    const ticks = [low, (low + high) / 2, high];
    const body = [
      label(x0, 20, 'Average loss (bits)', C.ink, 15, 'start'),
      ...ticks.flatMap(v => [segment(x0, y(v), x1, y(v)), label(x0 - 8, y(v) + 5, number(v), C.ink, 13, 'end')]),
      segment(x0, y0, x0, y1, C.muted),
      ...[0, 2, 4, 6, 8, 10, 12, 14].map(i => label(x(i), y0 + 17, String(i), C.ink, 13)),
      label((x0 + x1) / 2, 217, 'Training step', C.ink),
      s('polyline', { points: history.map((v, i) => `${x(i)},${y(v)}`).join(' '),
        stroke: C.amber, 'stroke-width': 3, fill: 'none' }),
      ...history.map((v, i) => s('circle', { cx: x(i), cy: y(v), r: 4, fill: C.amber },
        s('title', {}, `Step ${i} · ${v.toFixed(2)} bits`))),
    ];
    graph.setAttribute('aria-label', `Loss by step. ${history.map((v, i) => `${i}: ${number(v)} bits`).join(', ')}.`);
    graph.replaceChildren(...body);
  }

  function draw() {
    const iteration = history.length - 1, current = history[iteration], batch = last || nextStep();
    const { old, gradients: g, average, rate: lr, shared, changes, next } = batch;
    const match = equal(weights);
    counter.textContent = `Step ${iteration} of ${LIMIT} · ${current.toFixed(2)} bits`;
    stepButton.disabled = iteration >= LIMIT;
    playButton.disabled = iteration >= LIMIT;
    drawNetworks(batch);
    drawGraph();
    const lines = [
      last ? `Update at step ${iteration}` : 'Preview of step 1',
      `Loss before update = ${number(loss(old))} bits`,
      ['Gradients', C.cyan],
      `D1 ${signed(g[0])}    D2 ${signed(g[1])}`,
      ...(shared ? [[`Average = (${signed(g[0])} ${g[1] < 0 ? '−' : '+'} ${number(Math.abs(g[1]))}) ÷ 2`, C.cyan],
        [`Average = ${signed(average)}`, C.cyan]]
        : [['Each device uses its own gradient', C.pink]]),
      `Learning rate = ${number(lr)}`,
      ...changes.map((change, i) => [
        `D${i + 1}  ${weight(old[i])} ${change < 0 ? '+' : '−'} ${number(Math.abs(change))} = ${weight(next[i])}`,
        i && !equal(next) ? C.pink : C.amber,
      ]),
    ];
    if (last) lines.push(`Loss after update = ${number(current)} bits`);
    fbox(box, lines);
    note.textContent = iteration === 0
      ? 'Step applies the preview. Changing the rate, sharing, or gradient adjustments restarts the run.'
      : match ? 'Both replicas have the same weight.' : 'The replicas have different weights.';
    challenge.update({
      iteration, shared: shareInput.checked, match, weights, played, prediction: prediction.value,
      random, example: data === EXAMPLE && edit.every(v => v === 0), rate: lr,
      loss: current, initialLoss: history[0],
    });
  }

  resetRun();
  return pause;
}
