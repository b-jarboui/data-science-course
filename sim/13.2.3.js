// 13.2.3 Try it: compare questions for the first split of a decision tree.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const PART = '#fb923c';
  const QUESTIONS = ['Steady income', 'Savings', 'Previous loan repaid', 'Requested reminders'];
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
  const EPS = 1e-10;
  const freshStart = () => START.map(row => row.slice());
  let rows = freshStart(), selected = 0, question = 0, budget = 4;
  let best = null, last = null, history = [], inspected = [];
  let timer = null;
  let predictionForRun = null;

  function entropy(full, partial) {
    const total = full + partial;
    return [full, partial].reduce((sum, count) => {
      if (!count) return sum;
      const share = count / total;
      return sum - share * Math.log2(share);
    }, 0);
  }

  function summarize(indices) {
    const full = indices.filter(i => rows[i][4]).length;
    const partial = indices.length - full;
    return { indices, full, partial, size: indices.length, entropy: entropy(full, partial) };
  }

  function parentEntropy() {
    return summarize(rows.map((_, i) => i)).entropy;
  }

  function measure(q, before) {
    const yes = [], no = [];
    rows.forEach((row, i) => (row[q] ? yes : no).push(i));
    const groups = [summarize(yes), summarize(no)];
    const after = groups.reduce((sum, group) => sum + group.size / rows.length * group.entropy, 0);
    return { q, groups, after, gain: before - after, valid: yes.length > 0 && no.length > 0 };
  }

  function bits(value) {
    if (Math.abs(value) < EPS) return '0';
    if (Math.abs(value - Math.round(value)) < EPS) return String(Math.round(value));
    return `≈ ${value.toFixed(3)}`;
  }

  const picture = h('div', { class: 'sim-row', style: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', alignItems: 'start' } });
  const questionPicker = h('select', { class: 'sim-btn', onchange: e => {
    question = Number(e.target.value);
    draw();
  } }, QUESTIONS.map((name, i) => h('option', { value: i }, name)));
  const budgetPicker = h('select', { class: 'sim-btn', onchange: e => {
    budget = Number(e.target.value);
    restart();
  } }, [1, 2, 3, 4].map(n => h('option', { value: n }, n)));
  budgetPicker.value = String(budget);
  const prediction = h('select', { class: 'sim-btn', onchange: () => draw() },
    h('option', { value: '' }, 'Choose a question'),
    QUESTIONS.map((name, i) => h('option', { value: i }, name)));
  const speed = h('input', { type: 'range', min: 1, max: 5, value: 2,
    'aria-label': 'Playback speed', oninput: () => { if (timer !== null) schedule(); } });
  const box = h('div');
  const status = h('div', { class: 'sim-note', role: 'status' });
  const counter = h('div', { class: 'sim-note' });
  const chart = s('svg', { viewBox: '0 0 340 145', role: 'img', 'aria-label': 'Best weighted entropy by iteration' });
  const challengeHost = h('div');
  const flipAnswer = btn('', () => edit(question));
  const flipOutcome = btn('', () => edit(4));
  const stepButton = btn('Step', step, 'go');
  const playButton = btn('Play', () => {
    if (timer === null) {
      capturePrediction();
      schedule();
    } else {
      stop();
    }
    draw();
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: choose the first question'),
    h('p', { class: 'sub' }, 'Tap a card to edit its answer or repayment. Each step tests one question and keeps the split with the greatest information gain.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row' }, h('label', {}, 'Show answers for ', questionPicker)),
        picture,
        h('div', { class: 'sim-row' }, flipAnswer, flipOutcome),
        h('div', { class: 'sim-row' },
          h('label', {}, 'Questions to test ', budgetPicker),
          h('label', {}, 'My prediction ', prediction)),
        h('div', { class: 'sim-row' },
          stepButton, playButton, h('label', {}, 'Speed ', speed),
          btn('Reset', () => {
            rows = freshStart();
            selected = 0;
            question = 0;
            budget = 4;
            budgetPicker.value = '4';
            prediction.value = '';
            restart();
          }),
          btn('New data', () => {
            rows = START.map(row => row.map(() => rnd(0, 1)));
            selected = 0;
            question = 0;
            prediction.value = '';
            restart();
          })),
        counter, chart),
      h('div', {},
        h('div', { class: 'sim-card' }, box, status),
        h('div', { class: 'sim-card' }, challengeHost)))));

  const chal = challenges(challengeHost, [
    {
      text: 'On the original cards, predict the winning question before testing all four.',
      check: st => st.fixed && st.finished && st.testedAll && st.best && st.predicted === st.best.q,
      why: 'Your prediction matches the result. Steady income ties with two other questions and comes first.',
    },
    {
      text: 'Change some answers so steady income makes two groups and removes zero uncertainty, then test it.',
      check: st => st.changedIncome && st.mixed && st.income?.valid && Math.abs(st.income.gain) < EPS,
      why: 'Both groups now have the same mix of repayments as all eight cards together.',
    },
    {
      text: 'Set “Questions to test” to one, then finish a run where an untested question would reduce uncertainty more.',
      check: st => st.finished && st.budget === 1 && st.missedBetter,
      why: 'Stopping after the first question can miss a split with greater information gain.',
    },
  ]);

  function edit(column) {
    rows[selected][column] = 1 - rows[selected][column];
    restart();
  }

  function stop() {
    clearTimeout(timer);
    timer = null;
  }

  function restart() {
    stop();
    best = null;
    last = null;
    inspected = [];
    history = [parentEntropy()];
    predictionForRun = null;
    draw();
  }

  function capturePrediction() {
    if (!inspected.length && predictionForRun === null && prediction.value !== '') {
      predictionForRun = Number(prediction.value);
    }
  }

  function schedule() {
    stop();
    timer = setTimeout(() => {
      timer = null;
      step();
      if (inspected.length < budget) {
        schedule();
        draw();
      }
    }, 1700 / Number(speed.value));
  }

  function step() {
    if (inspected.length >= budget) return;
    capturePrediction();
    const q = inspected.length;
    const result = measure(q, history[0]);
    const previous = best;
    if (result.valid && (!best || result.after < best.after - EPS)) best = result;
    history.push(best ? best.after : history[0]);
    last = { result, previous };
    inspected.push(result);
    question = q;
    if (inspected.length === budget) stop();
    draw();
  }

  function drawPicture() {
    const { groups } = measure(question, history[0]);
    picture.replaceChildren(...groups.map((group, side) =>
      h('section', { 'aria-label': side === 0 ? 'Yes answers' : 'No answers' },
        h('div', { style: { fontWeight: '700' } }, side === 0 ? 'Yes' : 'No'),
        h('div', { class: 'sim-note', style: { margin: '0.2rem 0 0.4rem' } },
          `${group.full} full · ${group.partial} partial`),
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.3rem' } },
          group.indices.map(i => {
            const full = Boolean(rows[i][4]);
            const color = full ? C.cyan : PART;
            return h('button', {
              type: 'button', class: 'sim-btn', 'aria-pressed': i === selected ? 'true' : 'false',
              'aria-label': `Application ${i + 1}, ${full ? 'full' : 'partial'} repayment`,
              style: { padding: '0.25rem', color, borderColor: i === selected ? C.ink : color },
              onclick: () => {
                selected = i;
                drawCardControls();
                for (const card of picture.querySelectorAll('button')) {
                  const active = card === document.activeElement || card === eventCard;
                  card.setAttribute('aria-pressed', active ? 'true' : 'false');
                  card.style.borderColor = active ? C.ink : card.style.color;
                }
              },
            }, `${i + 1} `, h('span', { 'aria-hidden': 'true' }, full ? '●✓' : '■−'));
          })))));
  }

  function drawCardControls() {
    questionPicker.value = String(question);
    flipAnswer.textContent = `Card ${selected + 1}: change to ${rows[selected][question] ? 'No' : 'Yes'}`;
    flipOutcome.textContent = `Card ${selected + 1}: change to ${rows[selected][4] ? 'partial' : 'full'} repayment`;
  }

  function drawChart() {
    const left = 33, right = 327, top = 27, base = 111;
    const x = i => left + (right - left) * i / budget;
    const y = value => base - (base - top) * Math.max(0, Math.min(1, value));
    const text = (tx, ty, value, anchor = 'start', color = C.ink) =>
      s('text', { x: tx, y: ty, fill: color, 'font-size': 12, 'text-anchor': anchor, 'font-family': 'Consolas' }, value);
    const nodes = [text(left, 15, 'Best weighted entropy (bits)')];
    for (const value of [0, 0.5, 1]) {
      nodes.push(s('line', { x1: left, x2: right, y1: y(value), y2: y(value), stroke: C.line }),
        text(left - 5, y(value) + 4, value, 'end', C.muted));
    }
    for (let i = 0; i <= budget; i++) nodes.push(text(x(i), base + 18, i, 'middle', C.muted));
    nodes.push(s('polyline', {
      points: history.map((value, i) => `${x(i)},${y(value)}`).join(' '),
      fill: 'none', stroke: C.cyan, 'stroke-width': 2.5,
    }));
    history.forEach((value, i) => nodes.push(s('circle', { cx: x(i), cy: y(value), r: 3.8, fill: C.cyan })));
    chart.replaceChildren(...nodes);
  }

  function draw() {
    drawPicture();
    drawCardControls();
    drawChart();
    const finished = inspected.length === budget;
    stepButton.disabled = finished;
    playButton.disabled = finished;
    playButton.textContent = timer === null ? 'Play' : 'Pause';
    prediction.disabled = inspected.length > 0 || timer !== null;
    counter.textContent = `Iteration ${inspected.length} of ${budget}`;

    if (!last) {
      fbox(box, ['All 8 applications', [`Original entropy: ${bits(history[0])} bits`, C.cyan]]);
      status.textContent = 'Press Step to test the first question.';
    } else {
      const { result, previous } = last;
      const [yes, no] = result.groups;
      const contribution = group => group.size
        ? `${group.size}/8 × (${bits(group.entropy)})`
        : '0 (empty group)';
      fbox(box, [
        `Step ${inspected.length}: ${QUESTIONS[result.q]}`,
        `Yes: ${contribution(yes)}`,
        `No:  ${contribution(no)}`,
        `Weighted entropy: ${bits(result.after)} bits`,
        [`Gain: ${bits(history[0])} − (${bits(result.after)}) = ${bits(result.gain)} bits`, C.amber],
        `Best entropy: ${bits(history.at(-2))} → ${bits(history.at(-1))} bits`,
      ]);
      if (!result.valid && !best) {
        status.textContent = 'All eight answers match, so the question makes no split.';
      } else if (finished && best) {
        status.textContent = `Best tested question: ${QUESTIONS[best.q]}. The first tested question wins a tie.`;
      } else if (best && best !== previous) {
        status.textContent = `${QUESTIONS[best.q]} is the best split so far.`;
      } else if (best) {
        status.textContent = `${QUESTIONS[best.q]} stays the best split so far.`;
      } else {
        status.textContent = 'No tested question has split the cards yet.';
      }
    }

    const bestGain = best ? best.gain : 0;
    const missedBetter = finished && QUESTIONS.some((_, q) => {
      if (q < budget) return false;
      const result = measure(q, history[0]);
      return result.valid && result.gain > bestGain + EPS;
    });
    chal.update({
      fixed: rows.every((row, i) => row.every((value, j) => value === START[i][j])),
      changedIncome: rows.some((row, i) => row[0] !== START[i][0]),
      mixed: history[0] > EPS,
      finished, budget, best, missedBetter,
      testedAll: inspected.length === QUESTIONS.length,
      predicted: predictionForRun,
      income: inspected[0],
    });
  }

  restart();
  return stop;
}
