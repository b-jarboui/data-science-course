// 13.2.8 Try it: build a forest one tree at a time.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const PART = '#fb923c';
  const letters = ['A', 'B', 'C', 'D'];
  const names = ['Steady income', 'Savings', 'Previous loan repaid', 'Requested reminders'];
  const START = [
    [0, 1, 1, 0, 1], [1, 0, 1, 0, 1], [1, 1, 0, 1, 1], [1, 1, 1, 1, 1],
    [1, 0, 0, 1, 0], [0, 1, 0, 0, 0], [0, 0, 1, 1, 0], [0, 0, 0, 0, 0],
  ];
  const SAMPLES = [
    [6, 4, 3, 5, 8, 4, 3, 6],
    [1, 7, 1, 2, 3, 3, 7, 3],
    [4, 5, 5, 1, 1, 2, 5, 4],
  ];
  // The first two entries are the narrated question pair. When only one
  // question is allowed, the first teaching draw contains reminders alone.
  const QUESTION_ORDER = [[3, 0, 1, 2], [3, 1, 2, 0], [3, 2, 0, 1]];
  const MAX_TREES = 20;
  const ids = START.map((_, i) => i + 1);
  let data = START.map(row => row.slice());
  let selected = 0;
  let history = [];
  let plan = [];
  let timer = null;
  let changedData = false;
  let prediction = '';
  let predictionResult = '';

  const plot = s('svg', {
    viewBox: '0 0 400 258', role: 'img', 'aria-label': 'Mistakes by number of trees',
  });
  const formula = h('div');
  const challengeHost = h('div');
  const status = h('div', { class: 'sim-note', role: 'status' });
  const counter = h('strong', { class: 'sim-note' });
  const votesView = h('div', { class: 'sim-note' });
  const sampleView = h('div', { class: 'sim-note' });

  const questionCount = h('select', { onchange: restart },
    [1, 2, 3, 4].map(n => h('option', { value: n, selected: n === 2 }, n)));
  const treeCount = h('input', {
    type: 'range', min: 1, max: MAX_TREES, value: 9, oninput: restart,
  });
  const speed = h('input', { type: 'range', min: 1, max: 5, value: 2, oninput: reschedule });
  const sampleToggle = h('input', { type: 'checkbox', checked: true, onchange: restart });
  const application = h('select', { onchange: event => {
    selected = Number(event.target.value);
    render();
  } }, ids.map((id, i) => h('option', { value: i }, `Loan ${id}`)));
  const predictYes = btn('Yes', () => choosePrediction('yes'));
  const predictNo = btn('No', () => choosePrediction('no'));
  const stepButton = btn('Step', step, 'go');
  const playButton = btn('Play', togglePlay);
  const editors = [...names, 'Fully repaid'].map((name, i) => {
    const control = btn('', () => {
      data[selected][i] = 1 - data[selected][i];
      changedData = !data.every((row, j) => row.every((v, k) => v === START[j][k]));
      restart();
    });
    control.setAttribute('aria-label', name);
    return control;
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: build a random forest'),
    h('p', { class: 'sub' }, 'Add one tree at a time. Change how many questions each tree sees, or edit a loan and watch the votes change.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, plot, counter, votesView, sampleView,
        h('div', { class: 'sim-row' }, stepButton, playButton, btn('Reset', reset), btn('New data', newData)),
        h('div', { class: 'sim-row' },
          h('label', {}, 'Questions per tree ', questionCount),
          h('label', {}, sampleToggle, ' Draw loan cards with repeats')),
        h('div', { class: 'sim-row' },
          h('label', {}, 'Tree limit ', treeCount),
          h('label', {}, 'Speed ', speed)),
        h('div', { class: 'sim-row' }, h('label', {}, 'Choose a loan ', application)),
        h('div', { class: 'sim-row' }, editors)),
      h('div', {},
        h('div', { class: 'sim-card' }, formula,
          h('p', { class: 'sim-note' }, 'Predict before building. Will the first three trees miss none of the eight loans?'),
          h('div', { class: 'sim-row' }, predictYes, predictNo),
          status),
        h('div', { class: 'sim-card' }, challengeHost)))));

  const chal = challenges(challengeHost, [
    { text: 'Turn off loan draws, offer all four questions, and build three trees that all miss loans 1 and 5.',
      check: st => !st.changedData && !st.bootstrap && st.k === 4 && st.n >= 3
        && st.firstThree.every(tree => tree.q === 0 && tree.errors === 2),
      why: 'Each tree picks A when the gains tie, so each one misses the same two loans.' },
    { text: 'Reset, predict the result after three trees, then test your prediction with Step or Play.',
      check: st => st.predictionResult === 'correct',
      why: 'The three trees choose different questions, and their combined vote gets all eight loans right.' },
    { text: 'Reset, turn off loan draws, then offer one question and find a tree whose question gives zero improvement.',
      check: st => !st.changedData && !st.bootstrap && st.k === 1 && st.n > 0
        && st.firstThree[0].q === 3 && st.firstThree[0].gain === 0,
      why: 'When reminders are the only option, the tree misses the questions that would separate the outcomes better.' },
  ]);
  challengeHost.addEventListener('click', () => checkChallenges());

  function shuffleQuestions() {
    const order = [0, 1, 2, 3];
    for (let i = order.length - 1; i > 0; i--) {
      const j = rnd(0, i);
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }

  function makePlan(useLessonDraws) {
    return Array.from({ length: MAX_TREES }, (_, i) => {
      if (useLessonDraws && i < SAMPLES.length) {
        return { sample: SAMPLES[i], order: QUESTION_ORDER[i] };
      }
      return { sample: ids.map(() => rnd(1, ids.length)), order: shuffleQuestions() };
    });
  }

  function fullCount(rows) {
    return rows.reduce((sum, id) => sum + data[id - 1][4], 0);
  }

  function gini(rows) {
    if (rows.length === 0) return 0;
    const full = fullCount(rows) / rows.length;
    return 2 * full * (1 - full);
  }

  function fit(sample, candidates) {
    const before = gini(sample);
    const options = candidates.map(q => {
      const no = sample.filter(id => data[id - 1][q] === 0);
      const yes = sample.filter(id => data[id - 1][q] === 1);
      const after = (no.length * gini(no) + yes.length * gini(yes)) / sample.length;
      return { q, no, yes, after, gain: before - after };
    });
    // Candidates arrive in A–D order. Keep the earlier question on equal gains.
    const best = options.reduce((winner, option) => option.gain > winner.gain + 1e-10 ? option : winner);
    const majority = rows => Number(fullCount(rows) > rows.length / 2);
    const predictNoBranch = majority(best.no.length ? best.no : sample);
    const predictYesBranch = majority(best.yes.length ? best.yes : sample);
    const votes = data.map(row => row[best.q] ? predictYesBranch : predictNoBranch);
    const errors = votes.filter((vote, i) => vote !== data[i][4]).length;
    return { ...best, before, sample, options, votes, errors };
  }

  function totalsAt(n) {
    const counts = ids.map(() => 0);
    history.slice(0, n).forEach(tree => tree.votes.forEach((vote, i) => {
      counts[i] += vote;
    }));
    return counts;
  }

  function step() {
    if (history.length >= Number(treeCount.value)) {
      stop();
      render();
      return;
    }
    const next = plan[history.length];
    const sample = sampleToggle.checked ? next.sample : ids;
    const candidates = next.order.slice(0, Number(questionCount.value)).sort((a, b) => a - b);
    const tree = fit(sample, candidates);
    history.push(tree);
    const n = history.length;
    const totals = totalsAt(n);
    tree.combinedErrors = totals.filter((sum, i) => Number(sum > n / 2) !== data[i][4]).length;

    if (n === 3 && prediction) {
      const noMistakes = tree.combinedErrors === 0;
      predictionResult = (prediction === 'yes') === noMistakes ? 'correct' : 'try again';
      const result = noMistakes ? 'The combined vote missed none of the eight loans.'
        : `The combined vote missed ${tree.combinedErrors} of the eight loans.`;
      status.textContent = predictionResult === 'correct' ? `You got it. ${result}`
        : `${result} Reset to make another prediction.`;
    }
    if (n >= Number(treeCount.value)) stop();
    render();
  }

  function choosePrediction(value) {
    if (history.length) return;
    prediction = value;
    status.textContent = `Recorded: ${value === 'yes' ? 'Yes' : 'No'}. Build three trees to check.`;
    render();
  }

  function stop() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    playButton.textContent = 'Play';
  }

  function togglePlay() {
    if (timer !== null) stop();
    else if (history.length < Number(treeCount.value)) {
      timer = setInterval(step, 1500 / Number(speed.value));
      playButton.textContent = 'Pause';
      step();
    }
    render();
  }

  function reschedule() {
    speed.setAttribute('aria-valuetext', `${speed.value} of 5`);
    if (timer === null) return;
    clearInterval(timer);
    timer = setInterval(step, 1500 / Number(speed.value));
  }

  function restart() {
    stop();
    history = [];
    prediction = '';
    predictionResult = '';
    status.textContent = '';
    render();
  }

  function reset() {
    data = START.map(row => row.slice());
    selected = 0;
    application.value = '0';
    questionCount.value = '2';
    treeCount.value = '9';
    speed.value = '2';
    speed.setAttribute('aria-valuetext', '2 of 5');
    sampleToggle.checked = true;
    changedData = false;
    plan = makePlan(true);
    restart();
  }

  function newData() {
    const outcomeOrder = ids.map((_, i) => Number(i < 4));
    for (let i = outcomeOrder.length - 1; i > 0; i--) {
      const j = rnd(0, i);
      [outcomeOrder[i], outcomeOrder[j]] = [outcomeOrder[j], outcomeOrder[i]];
    }
    data = outcomeOrder.map(outcome => [
      ...names.map(() => Number(rnd(1, 4) <= (outcome ? 3 : 1))), outcome,
    ]);
    changedData = !data.every((row, i) => row.every((v, j) => v === START[i][j]));
    plan = makePlan(false);
    restart();
  }

  function svgText(x, y, value, color = C.muted, size = 15) {
    return s('text', { x, y, fill: color, 'font-size': size, 'text-anchor': 'middle',
      'font-family': 'Consolas, monospace' }, String(value));
  }

  function drawPlot() {
    const left = 38, right = 374, top = 35, bottom = 150;
    const limit = Number(treeCount.value);
    const x = n => limit === 1 ? (left + right) / 2 : left + (n - 1) * (right - left) / (limit - 1);
    const y = errors => bottom - (bottom - top) * errors / ids.length;
    const items = [svgText((left + right) / 2, 20, 'Combined mistakes on the 8 loans', C.ink)];
    for (let k = 0; k <= ids.length; k += 2) {
      items.push(s('line', { x1: left, x2: right, y1: y(k), y2: y(k), stroke: C.line }),
        svgText(left - 11, y(k) + 5, k));
    }
    const ticks = limit <= 9 ? Array.from({ length: limit }, (_, i) => i + 1)
      : [...new Set([1, ...Array.from({ length: Math.floor(limit / 4) }, (_, i) => (i + 1) * 4), limit])];
    ticks.forEach(n => {
      items.push(svgText(x(n), bottom + 18, n, C.muted, 13));
    });
    items.push(svgText((left + right) / 2, bottom + 35, 'Trees added', C.muted, 14));
    if (history.length > 1) {
      items.push(s('polyline', {
        points: history.map((tree, i) => `${x(i + 1)},${y(tree.combinedErrors)}`).join(' '),
        fill: 'none', stroke: C.cyan, 'stroke-width': 3,
      }));
    }
    history.forEach((tree, i) => {
      items.push(s('circle', { cx: x(i + 1), cy: y(tree.combinedErrors), r: 4, fill: C.cyan }));
    });

    ids.forEach((id, i) => {
      const cx = 39 + 46 * i, full = data[i][4] === 1;
      const color = full ? C.cyan : PART;
      items.push(s('rect', { x: cx - 18, y: 199, width: 36, height: 50, rx: 6, fill: C.bg,
        stroke: i === selected ? C.amber : color, 'stroke-width': i === selected ? 2.5 : 1 }),
      svgText(cx, 216, id, color));
      items.push(full
        ? s('circle', { cx, cy: 233, r: 10, fill: color, 'fill-opacity': 0.16, stroke: color })
        : s('rect', { x: cx - 10, y: 223, width: 20, height: 20, rx: 2, fill: color, 'fill-opacity': 0.16, stroke: color }));
      items.push(svgText(cx, 239, full ? '✓' : '−', color, 16));
    });
    plot.replaceChildren(...items);
    plot.setAttribute('aria-label', history.length
      ? `Combined mistakes by tree count: ${history.map(tree => tree.combinedErrors).join(', ')}.`
      : 'Mistakes by tree count. No trees have been added.');
  }

  function checkChallenges() {
    chal.update({
      changedData, bootstrap: sampleToggle.checked, k: Number(questionCount.value),
      n: history.length, firstThree: history.slice(0, 3),
      predictionResult: !changedData && sampleToggle.checked && Number(questionCount.value) === 2 ? predictionResult : '',
    });
  }

  function render() {
    const n = history.length, limit = Number(treeCount.value);
    const latest = history[n - 1];
    const finished = n >= limit;
    treeCount.setAttribute('aria-valuetext', `${limit} trees`);
    counter.textContent = `Trees added ${n} of ${limit}`;
    stepButton.disabled = finished;
    playButton.disabled = finished;
    predictYes.disabled = n > 0;
    predictNo.disabled = n > 0;
    predictYes.setAttribute('aria-pressed', String(prediction === 'yes'));
    predictNo.setAttribute('aria-pressed', String(prediction === 'no'));
    editors.forEach((control, j) => {
      const value = data[selected][j];
      control.textContent = `${[...names, 'Fully repaid'][j]} · ${value ? 'Yes' : 'No'}`;
      control.setAttribute('aria-pressed', String(Boolean(value)));
    });
    drawPlot();

    if (latest) {
      const fullVotes = totalsAt(n)[selected];
      const newVote = latest.votes[selected];
      const previous = fullVotes - newVote;
      const combined = fullVotes > n / 2;
      const actual = Boolean(data[selected][4]);
      const before = n > 1 ? `${previous} ÷ ${n - 1} = ${fmt(previous / (n - 1))}` : 'no earlier votes';
      const gains = latest.options.map(option => `${letters[option.q]} ${fmt(option.gain)}`).join('  ·  ');
      fbox(formula, [
        `Gini reductions   ${gains}`,
        [`Tree ${n} asks ${letters[latest.q]} · ${names[latest.q]}`, C.cyan],
        `This tree misses ${latest.errors} of 8 loans`,
        `Loan ${selected + 1} before   ${before}`,
        `New vote   ${newVote} (${newVote ? 'full' : 'partial'})`,
        [`Mean vote   (${previous} + ${newVote}) ÷ ${n} = ${fmt(fullVotes / n)}`, C.amber],
        [`Prediction   ${combined ? 'Full' : 'Partial'} (${combined === actual ? 'correct' : 'incorrect'})`,
          combined === actual ? C.green : PART],
      ]);
      votesView.textContent = `Loan ${selected + 1} votes: ${history.map(tree => tree.votes[selected]).join(' · ')}. `
        + `Combined mistakes: ${n > 1 ? `${history[n - 2].combinedErrors} → ` : ''}${latest.combinedErrors} of 8.`;
      sampleView.textContent = `Tree ${n} application cards: ${latest.sample.join(', ')}.`;
    } else {
      fbox(formula, ['Add a tree to see its question and vote.', ['Mean vote = full votes ÷ trees added', C.amber]]);
      votesView.textContent = 'A mean vote above one half predicts full repayment.';
      sampleView.textContent = 'Teal circles mark full repayments. Orange squares mark partial repayments.';
    }
    checkChallenges();
  }

  reset();
  return stop;
}
