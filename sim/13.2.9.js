// 13.2.9 Try it: fit a tree to each draw and collect its out-of-bag votes.
const START = [
  [0, 1, 1, 0, 1],
  [1, 0, 1, 0, 1],
  [1, 1, 0, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 0, 0, 1, 0],
  [0, 1, 0, 0, 0],
  [0, 0, 1, 1, 0],
  [0, 0, 0, 0, 0],
];
const FIXED = [
  [6, 4, 3, 5, 8, 4, 3, 6],
  [1, 7, 1, 2, 3, 3, 7, 3],
  [4, 5, 5, 1, 1, 2, 5, 4],
];
const QUESTION = ['Steady income', 'Savings', 'Previous loan repaid', 'Requested reminders'];
const IDS = START.map((_, i) => i + 1);

function majority(full, count) {
  return Number(2 * full > count);
}

function fit(data, draw) {
  const sample = draw.map(id => data[id - 1]);
  const full = sample.reduce((n, app) => n + app[4], 0);
  let best = { question: -1, branch: [majority(full, sample.length)], score: Infinity };
  QUESTION.forEach((_, question) => {
    const count = [0, 0], yes = [0, 0];
    for (const app of sample) {
      count[app[question]]++;
      yes[app[question]] += app[4];
    }
    if (count.includes(0)) return;
    // Weighted Gini, multiplied by the same sample size for every split.
    const score = count.reduce((sum, n, i) => sum + 2 * yes[i] * (n - yes[i]) / n, 0);
    if (score < best.score - 1e-10) {
      best = { question, branch: count.map((n, i) => majority(yes[i], n)), score };
    }
  });
  return {
    question: best.question,
    predict: app => best.branch[best.question < 0 ? 0 : app[best.question]],
  };
}

function evaluate(data, draws) {
  const full = IDS.map(() => 0), total = IDS.map(() => 0), allFull = IDS.map(() => 0);
  const history = [{ count: 0, correct: 0 }];
  let latest = IDS.map(() => null), question = -1;

  for (const draw of draws) {
    const tree = fit(data, draw);
    const seen = new Set(draw);
    question = tree.question;
    latest = data.map((app, i) => {
      const prediction = tree.predict(app);
      allFull[i] += prediction;
      if (seen.has(i + 1)) return null;
      total[i]++;
      full[i] += prediction;
      return prediction;
    });
    const count = total.filter(n => n > 0).length;
    const correct = data.filter((app, i) => total[i] && majority(full[i], total[i]) === app[4]).length;
    history.push({ count, correct });
  }

  const combined = total.map((n, i) => n ? majority(full[i], n) : null);
  const allCorrect = draws.length
    ? data.filter((app, i) => majority(allFull[i], draws.length) === app[4]).length
    : null;
  return { full, total, latest, question, combined, allCorrect, history, ...history[history.length - 1] };
}

export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const FULL = C.cyan, PART = '#fb923c';
  let data = START.map(row => row.slice());
  let draws = FIXED.map(draw => draw.slice());
  let limit = 3, iteration = 0, speed = 1, position = 0, timer = 0;
  let running = false, originalData = true, guess = null, checkedGuess = null;

  const svg = s('svg', { viewBox: '0 0 400 492', role: 'img', 'aria-label': 'Application votes and out-of-bag error' });
  const box = h('div', { 'aria-live': 'polite' });
  const explanation = h('p', { class: 'sim-note' });
  const counter = h('span', { class: 'sim-note', role: 'status' });
  const challengeRoot = h('div');
  const stepButton = btn('Step', () => { stop(); step(); }, 'go');
  const playButton = btn('Play', toggle);
  const speedInput = h('input', {
    type: 'range', min: '0.5', max: '5', step: '0.5', value: '1',
    oninput: event => {
      speed = Number(event.target.value);
      speedValue.textContent = `${speed}×`;
      if (running) schedule();
    },
  });
  const speedValue = h('span', {}, '1×');
  const treeInput = h('input', {
    type: 'range', min: '1', max: '50', step: '1', value: '3',
    oninput: event => {
      stop();
      limit = Number(event.target.value);
      iteration = Math.min(iteration, limit);
      ensureDraws();
      draw();
    },
  });
  const limitValue = h('span', {}, '3');
  const options = IDS.map(id => h('option', { value: id }, String(id)));
  const slotInput = h('select', {
    onchange: event => { position = Number(event.target.value) - 1; draw(); },
  }, options);
  const appInput = h('select', { onchange: editDraw },
    IDS.map(id => h('option', { value: id }, String(id))));
  const guessInput = h('select', {
    onchange: event => { guess = event.target.value === '' ? null : Number(event.target.value); draw(); },
  },
  h('option', { value: '' }, 'Choose'),
  ...Array.from({ length: 9 }, (_, n) => h('option', { value: n }, String(n))));
  const inputStyle = { minHeight: '44px', font: 'inherit', colorScheme: 'dark' };
  for (const control of [slotInput, appInput, guessInput]) Object.assign(control.style, inputStyle);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: out-of-bag votes'),
    h('p', { class: 'sub' }, 'Each tree sees eight draws, with repeats allowed. It can give an out-of-bag vote only for an application it missed. A tie predicts partial repayment.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('p', { class: 'sim-note' }, 'Latest shows the newest tree’s eligible vote. Full / partial counts eligible votes from all trees so far. A dash marks a missing vote or result.'),
        h('div', { class: 'sim-row' }, stepButton, playButton,
          btn('Reset', reset), btn('New data', newData), counter),
        h('div', { class: 'sim-row' },
          h('label', {}, 'Speed ', speedInput, ' ', speedValue),
          h('label', {}, 'Number of trees ', treeInput, ' ', limitValue)),
        h('div', { class: 'sim-row' },
          h('label', {}, 'Draw position ', slotInput),
          h('label', {}, 'Application at that position ', appInput)),
        h('div', { class: 'sim-row' },
          h('label', {}, 'Predict how many apps tree 1 will miss ', guessInput))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, explanation),
        h('div', { class: 'sim-card' }, challengeRoot)))));

  const challenge = challenges(challengeRoot, [
    { text: 'Predict how many applications tree 1 will miss, then press Step.',
      check: state => state.checkedGuess === true,
      why: 'Every application missing from the draw gets one vote from tree 1.' },
    { text: 'Reset and stop after two trees to find the one application still waiting for a vote.',
      check: state => state.fixed && state.iteration === 2 && state.total[2] === 0 && state.count === 7,
      why: 'Both trees drew application 3, so only seven applications count.' },
    { text: 'Step to tree 3 in the original example and find the vote that changes application 6.',
      check: state => state.fixed && state.iteration === 3 && state.total[5] === 2 &&
        state.full[5] === 1 && state.combined[5] === 0,
      why: 'One vote for each outcome gives a tie, so application 6 gets the correct partial prediction.' },
    { text: 'Change a draw or press New data, then get an out-of-bag accuracy different from 75%.',
      check: state => !state.fixed && state.iteration >= 3 && state.count > 0 &&
        4 * state.correct !== 3 * state.count,
      why: 'Different draws can change which trees vote and which predictions are correct.' },
  ]);

  const randomDraw = () => IDS.map(() => rnd(1, IDS.length));
  const editingIndex = () => Math.max(0, iteration - 1);
  const pct = (n, d) => {
    const value = 100 * n / d, shown = fmt(value);
    return `${Number(shown) === value ? '' : '≈'}${shown}%`;
  };

  function ensureDraws() {
    while (draws.length < limit) draws.push(randomDraw());
  }

  function reset() {
    stop();
    data = START.map(row => row.slice());
    draws = FIXED.map(sample => sample.slice());
    limit = 3;
    treeInput.value = '3';
    originalData = true;
    restart();
  }

  function newData() {
    stop();
    data = IDS.map(() => {
      const features = QUESTION.map(() => rnd(0, 1));
      const likelyFull = majority(features[0] + features[1] + features[2], 3);
      return [...features, rnd(1, 5) === 1 ? 1 - likelyFull : likelyFull];
    });
    draws = [];
    ensureDraws();
    originalData = false;
    restart();
  }

  function restart() {
    iteration = 0;
    position = 0;
    slotInput.value = '1';
    guess = null;
    checkedGuess = null;
    guessInput.value = '';
    draw();
  }

  function editDraw(event) {
    stop();
    const index = editingIndex();
    const id = Number(event.target.value);
    if (draws[index][position] !== id) {
      draws[index][position] = id;
      if (index === 0) {
        checkedGuess = null;
        guess = null;
        guessInput.value = '';
      }
    }
    draw();
  }

  function stop() {
    running = false;
    clearTimeout(timer);
  }

  function step() {
    if (iteration >= limit) return;
    if (iteration === 0 && guess !== null) {
      checkedGuess = guess === IDS.length - new Set(draws[0]).size;
    }
    iteration++;
    if (iteration === limit) stop();
    draw();
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!root.contains(svg) || !svg.isConnected) {
        stop();
        return;
      }
      step();
      if (running) schedule();
    }, 700 / speed);
  }

  function toggle() {
    if (running) stop();
    else if (iteration < limit) {
      running = true;
      step();
      if (running) schedule();
    }
    draw();
  }

  function text(value, x, y, color = C.ink, size = 17, anchor = 'middle') {
    return s('text', {
      x, y, fill: color, 'font-size': size, 'text-anchor': anchor,
      'font-family': 'Consolas, monospace', 'font-weight': '600',
    }, value);
  }

  function mark(value, x, y) {
    if (value === null) return text('—', x, y + 5, C.muted);
    const color = value ? FULL : PART;
    const shape = value
      ? s('circle', { cx: x, cy: y, r: 10, fill: color, 'fill-opacity': 0.22, stroke: color })
      : s('rect', { x: x - 9, y: y - 9, width: 18, height: 18, fill: color, 'fill-opacity': 0.22, stroke: color });
    return s('g', {}, shape,
      text(value ? '✓' : '−', x, y + 5, color, 15),
      s('title', {}, value ? 'Full repayment' : 'Partial repayment'));
  }

  function plot(history) {
    const left = 49, right = 377, top = 354, bottom = 447;
    const x = n => left + (n - 1) * (right - left) / Math.max(1, limit - 1);
    const y = rate => bottom - (bottom - top) * rate;
    const nodes = [text('Out-of-bag error', 200, 325, FULL, 18)];
    for (const rate of [0, 0.5, 1]) {
      const py = y(rate);
      nodes.push(s('line', { x1: left, y1: py, x2: right, y2: py, stroke: C.line }),
        text(`${rate * 100}%`, left - 7, py + 5, C.muted, 14, 'end'));
    }
    const points = history.flatMap(({ count, correct }, n) =>
      count ? [[x(n), y((count - correct) / count), n, count - correct, count]] : []);
    if (points.length > 1) {
      nodes.push(s('polyline', {
        points: points.map(([px, py]) => `${px},${py}`).join(' '),
        fill: 'none', stroke: C.violet, 'stroke-width': 2.5,
      }));
    }
    nodes.push(...points.map(([px, py, n, errors, count]) =>
      s('circle', { cx: px, cy: py, r: 3.6, fill: C.violet },
        s('title', {}, `Tree ${n}: ${errors} of ${count} wrong`))));
    if (!points.length) nodes.push(text('Waiting for eligible votes', 212, 403, C.muted, 15));
    nodes.push(text('1', left, 467, C.muted, 14), text('Trees', 212, 485, C.muted, 15));
    if (limit > 1) nodes.push(text(String(limit), right, 467, C.muted, 14));
    return nodes;
  }

  function draw() {
    const state = evaluate(data, draws.slice(0, iteration));
    const { full, total, latest, combined, count, correct, allCorrect, history, question } = state;
    const headings = [
      ['App', 32], ['Repaid', 92], ['Latest', 155], ['Full / partial', 229],
      ['Combined', 321], ['✓ / ×', 373],
    ];
    const nodes = [
      s('title', {}, `Tree ${iteration} of ${limit}. ${count} applications with eligible votes. ${correct} correct.`),
      ...headings.map(([caption, x]) => text(caption, x, 25, C.muted, 14)),
    ];
    data.forEach((app, i) => {
      const y = 49 + i * 31;
      const prediction = combined[i];
      const isCorrect = prediction === app[4];
      const color = prediction === null ? C.muted : isCorrect ? C.green : C.pink;
      nodes.push(
        s('rect', { x: 9, y: y - 13, width: 382, height: 26, rx: 5,
          fill: C.bg, stroke: iteration && latest[i] !== null ? C.violet : C.line }),
        text(String(i + 1), 32, y + 5, FULL),
        mark(app[4], 92, y),
        mark(latest[i], 155, y),
        text(`${full[i]} / ${total[i] - full[i]}`, 229, y + 5, total[i] ? C.ink : C.muted),
        mark(prediction, 321, y),
        text(prediction === null ? '—' : isCorrect ? '✓' : '×', 373, y + 6, color, 19)
      );
    });
    svg.replaceChildren(...nodes, ...plot(history));

    const index = editingIndex();
    appInput.value = String(draws[index][position]);
    limitValue.textContent = String(limit);
    counter.textContent = `Tree ${iteration} of ${limit}`;
    stepButton.disabled = iteration >= limit;
    playButton.disabled = iteration >= limit && !running;
    playButton.textContent = running ? 'Pause' : 'Play';
    guessInput.disabled = iteration > 0;

    const previous = history[Math.max(0, iteration - 1)];
    const lines = [
      `Draw ${index + 1}: ${draws[index].join(' ')}`,
      iteration ? (question < 0 ? 'Tree: one prediction' : `Tree: ${QUESTION[question]}`) : 'Press Step to fit tree 1.',
      ...(iteration ? [
        `Correct: ${previous.correct} → ${correct}`,
        `Counted: ${previous.count} → ${count}`,
      ] : []),
      ...(count ? [
        [`Accuracy = ${correct} ÷ ${count} = ${pct(correct, count)}`, FULL],
        [`Error = ${count - correct} ÷ ${count} = ${pct(count - correct, count)}`, C.violet],
      ] : ['Waiting for an eligible vote']),
      ...(allCorrect === null ? [] : [`All trees vote: ${allCorrect} ÷ ${IDS.length} = ${pct(allCorrect, IDS.length)}`]),
    ];
    fbox(box, lines);
    explanation.textContent = iteration
      ? `Edit draw ${index + 1} to fit that tree again. ${IDS.length - count} applications are waiting for an out-of-bag vote.`
      : 'Change any position in draw 1. You can put the same application in more than one position.';
    if (checkedGuess !== null) {
      const missed = IDS.length - new Set(draws[0]).size;
      explanation.textContent += checkedGuess
        ? ` Your prediction was right: tree 1 missed ${missed}.`
        : ` Tree 1 missed ${missed}; count the application numbers missing from its draw.`;
    }
    const fixed = originalData && draws.slice(0, 3).every((sample, i) =>
      sample.every((id, j) => id === FIXED[i][j]));
    challenge.update({ ...state, fixed, iteration, checkedGuess });
  }

  // The kit changes the active challenge when its navigation button is clicked.
  challengeRoot.addEventListener('click', draw);
  draw();
  return stop;
}
