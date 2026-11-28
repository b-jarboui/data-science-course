// 13.2.5 Try it: grow a regression tree one question at a time.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [10, 10, 10, 10, 2, 2, 2, 2];
  const ANSWERS = ['0110', '1010', '1101', '1111', '1001', '0100', '0011', '0000'];
  const QUESTIONS = ['Steady income?', 'Savings?', 'Previous loan repaid?', 'Requested reminders?'];
  const ids = START.map((_, i) => i);
  const share = (total, n) => total / n;
  const apps = group => group.map(i => i + 1).join(', ');
  const number = value => {
    const shown = fmt(value);
    return Number(shown) === value ? shown : `≈${shown}`;
  };
  const change = value => value < 0 ? `−${number(-value)}` : `+${number(value)}`;

  let amounts = START.slice(), selected = 0, maxDepth = 3;
  let leaves, history, last, timer = null;

  function leaf(group, depth) {
    const total = group.reduce((sum, i) => sum + amounts[i], 0);
    const mean = share(total, group.length);
    const error = group.reduce((sum, i) => sum + (amounts[i] - mean) ** 2, 0);
    return { group, depth, total, mean, error };
  }

  // Try questions in A–D order. Keep the earlier question on a tie.
  function bestSplit(parent) {
    if (parent.depth >= maxDepth || parent.error === 0) return null;
    let best = null, bestError = parent.error;
    QUESTIONS.forEach((_, question) => {
      const yes = parent.group.filter(i => ANSWERS[i][question] === '1');
      const no = parent.group.filter(i => ANSWERS[i][question] === '0');
      if (!yes.length || !no.length) return;
      const children = [leaf(yes, parent.depth + 1), leaf(no, parent.depth + 1)];
      const error = children[0].error + children[1].error;
      if (error < bestError - 1e-9) {
        best = { parent, question, children };
        bestError = error;
      }
    });
    return best;
  }

  function nextSplit() {
    // Replacing a leaf with Yes then No keeps the order of the lesson's walk.
    for (const candidate of leaves) {
      const split = bestSplit(candidate);
      if (split) return split;
    }
    return null;
  }

  function stop() {
    if (timer !== null) clearInterval(timer);
    timer = null;
  }

  function restart() {
    stop();
    leaves = [leaf(ids, 0)];
    history = [leaves[0].error / ids.length];
    last = null;
    draw();
  }

  function step() {
    const split = nextSplit();
    if (!split) return;
    const before = history.at(-1);
    leaves.splice(leaves.indexOf(split.parent), 1, ...split.children);
    const after = leaves.reduce((sum, group) => sum + group.error, 0) / ids.length;
    history.push(after);
    last = { ...split, before, after };
    if (!nextSplit()) stop();
    draw();
  }

  function schedule() {
    timer = setInterval(step, 1000 / Number(speed.value));
  }

  function togglePlay() {
    if (timer !== null) stop();
    else if (nextSplit()) schedule();
    draw();
  }

  const choice = h('select', {
    style: { minHeight: '44px', maxWidth: '100%' },
    onchange: e => { selected = Number(e.target.value); draw(); }
  }, ids.map(i => h('option', { value: i }, `Application ${i + 1}`)));
  const amount = h('input', {
    type: 'range', min: 0, max: 10, step: 1,
    oninput: e => { amounts[selected] = Number(e.target.value); restart(); }
  });
  const depth = h('input', {
    type: 'range', min: 0, max: 4, step: 1,
    oninput: e => { maxDepth = Number(e.target.value); restart(); }
  });
  const speed = h('input', {
    type: 'range', min: 0.5, max: 4, step: 0.5, value: 1,
    oninput: () => {
      if (timer !== null) {
        stop();
        schedule();
      }
      speedValue.textContent = `${speed.value}×`;
    }
  });
  const amountValue = h('output'), depthValue = h('output'), speedValue = h('output', {}, '1×');
  const control = (name, input, output) =>
    h('label', { class: 'sim-row', style: { minHeight: '44px' } }, name, input, output);
  const stepButton = btn('Step', step, 'go');
  const playButton = btn('Play', togglePlay);
  const counter = h('p', { class: 'sim-note', 'aria-live': 'polite' });
  const box = h('div'), tasks = h('div');
  const svg = s('svg', {
    viewBox: '0 0 370 414', role: 'img', style: 'touch-action: auto'
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: grow a regression tree'),
    h('p', { class: 'sub' }, 'Each block is one unit repaid. The amber mark is the tree’s prediction. Step to ask one question, or change a repayment and grow the tree again.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, counter, svg,
        h('div', { class: 'sim-row' },
          stepButton, playButton, btn('New data', () => {
            amounts = START.map(() => rnd(0, 10));
            restart();
          }),
          btn('Reset', () => {
            amounts = START.slice();
            selected = 0;
            maxDepth = 3;
            speed.value = 1;
            speedValue.textContent = '1×';
            restart();
          })),
        h('label', { class: 'sim-row' }, 'Choose an application', choice),
        control('Amount repaid', amount, amountValue),
        control('Max questions on a path', depth, depthValue),
        control('Speed', speed, speedValue)),
      h('div', {},
        h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' }, tasks)))));

  const chal = challenges(tasks, [
    {
      text: 'With the original amounts, take one step to predict 8 for application 2.',
      check: state => state.original && state.steps === 1 && state.predictions[1] === 8,
      why: 'The steady-income group repaid 32 units across four applications, so it predicts 8.'
    },
    {
      text: 'With the original amounts, limit each path to two questions and grow until the tree stops. Does the error reach zero?',
      check: state => state.original && state.depth === 2 && state.finished && state.loss === 8,
      why: 'The tree stops at a mean squared error of 8 because two groups still contain different repayments.'
    },
    {
      text: 'With the original amounts, use three questions per path to reach zero error in five splits.',
      check: state => state.original && state.depth === 3 && state.steps === 5 && state.loss === 0,
      why: 'Every final group now holds applications that all repaid the same amount.'
    }
  ]);

  const text = (x, y, value, color = C.ink, size = 14, anchor = 'start') =>
    s('text', { x, y, fill: color, 'font-size': size, 'text-anchor': anchor, 'font-family': 'Consolas, monospace' }, value);
  const segment = (x1, y1, x2, y2, color = C.line, width = 1) =>
    s('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': width });

  function draw() {
    const predictions = Array(ids.length);
    leaves.forEach(group => group.group.forEach(i => { predictions[i] = group.mean; }));
    const steps = history.length - 1, loss = history[steps], finished = nextSplit() === null;
    counter.textContent = `Splits: ${steps} · Final groups: ${leaves.length}${finished ? ' · Tree stopped' : ''}`;
    stepButton.disabled = finished;
    playButton.disabled = finished;
    playButton.textContent = timer === null ? 'Play' : 'Pause';
    choice.value = selected;
    amount.value = amounts[selected];
    amountValue.textContent = `${amounts[selected]} units`;
    depth.value = maxDepth;
    depthValue.textContent = String(maxDepth);

    const chart = [text(16, 19, 'App', C.muted), text(65, 19, 'Amount repaid', C.cyan),
      text(356, 19, 'Prediction', C.amber, 14, 'end')];
    const start = 66, unit = 18;
    ids.forEach(i => {
      const y = 43 + 28 * i;
      if (i === selected) chart.push(s('rect', { x: 6, y: y - 15, width: 357, height: 26, rx: 5, fill: C.line }));
      chart.push(text(28, y + 4, i + 1, C.ink, 14, 'middle'));
      for (let j = 0; j < 10; j++) {
        chart.push(s('rect', {
          x: start + j * unit + 1, y: y - 7, width: unit - 3, height: 13, rx: 2,
          fill: j < amounts[i] ? C.cyan : C.card, stroke: j < amounts[i] ? C.cyan : C.muted
        }));
      }
      const x = start + unit * predictions[i];
      chart.push(segment(x, y - 10, x, y + 9, C.amber, 3),
        text(274, y + 4, amounts[i], C.cyan, 14, 'end'),
        text(356, y + 4, number(predictions[i]), C.amber, 14, 'end'));
    });

    const X0 = 37, X1 = 349, Y0 = 380, HEIGHT = 85;
    const px = i => X0 + (X1 - X0) * i / 7;
    const py = value => Y0 - HEIGHT * value / 25;
    chart.push(text(X0, 284, 'Mean squared error', C.green));
    for (const tick of [0, 8, 16, 24]) {
      chart.push(segment(X0, py(tick), X1, py(tick)),
        text(X0 - 7, py(tick) + 4, tick, C.muted, 12, 'end'));
    }
    for (let i = 0; i <= 7; i++) chart.push(text(px(i), 397, i, C.muted, 12, 'middle'));
    chart.push(text((X0 + X1) / 2, 411, 'Splits', C.muted, 12, 'middle'));
    history.forEach((value, i) => {
      if (i) chart.push(segment(px(i - 1), py(history[i - 1]), px(i), py(value), C.green, 2.5));
      chart.push(s('circle', { cx: px(i), cy: py(value), r: 3.5, fill: C.green }));
    });
    svg.replaceChildren(...chart);
    const rows = ids.map(i => `Application ${i + 1} repaid ${amounts[i]}; prediction ${number(predictions[i])}.`);
    svg.setAttribute('aria-label', `${rows.join(' ')} Mean squared error by split: ${history.map(number).join(', ')}.`);

    if (last) {
      const branchLine = (group, answer, color) => [
        `${answer} · apps ${apps(group.group)}`,
        [`${number(last.parent.mean)} → ${group.total} ÷ ${group.group.length} = ${number(group.mean)}`, color],
        `Change: ${change(group.mean - last.parent.mean)}`
      ];
      fbox(box, [
        `Split ${steps} · ${QUESTIONS[last.question]}`,
        ...branchLine(last.children[0], 'Yes', C.cyan),
        ...branchLine(last.children[1], 'No', C.violet),
        [`MSE: ${number(last.before)} → ${number(last.after)}`, C.green]
      ]);
    } else {
      fbox(box, [
        'One group, all eight applications',
        `Prediction: ${leaves[0].total} ÷ 8 = ${number(leaves[0].mean)}`,
        [`Mean squared error: ${number(loss)}`, C.green]
      ]);
    }
    chal.update({ original: amounts.every((value, i) => value === START[i]),
      steps, predictions, depth: maxDepth, loss, finished });
  }

  restart();
  return stop;
}
