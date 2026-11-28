// 13.2.13 Try it: fit three trees across two folds, then learn a vote rule.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = [
    [0, 1, 1, 1], [1, 0, 1, 1], [1, 1, 0, 1], [1, 1, 1, 1],
    [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 0],
  ];
  const FOLD = [1, 1, 2, 2, 2, 2, 1, 1];
  const QUESTIONS = ['Steady income', 'Savings', 'Previous loan repaid'];
  const RULES = [1, 2, 3];
  const copyStart = () => START.map(row => row.slice());
  const full = value => value ? 'Full' : 'Partial';
  const yes = value => value ? 'Yes' : 'No';
  const tally = values => values.reduce((sum, value) => sum + value, 0);

  let data = copyStart(), borrower = [1, 0, 1], selected = 0;
  let samples, finalTrees, trials = [], guess = 0, playing = false, timer = null;

  const table = s('svg', {
    viewBox: '0 0 400 300', role: 'img',
    'aria-label': 'Applications, folds, out-of-fold votes and repayment outcomes',
  });
  const chart = s('svg', { viewBox: '0 0 400 181', role: 'img', 'aria-label': 'Mistakes by iteration' });
  const box = h('div', { 'aria-live': 'polite' });
  const result = h('p', { class: 'sim-note', 'aria-live': 'polite' });
  const iteration = h('p', { class: 'sim-note', 'aria-live': 'polite' });
  const challengePanel = h('div');
  const selector = h('select', { 'aria-label': 'Application to edit' },
    ...START.map((_, i) => h('option', { value: i }, `Application ${i + 1}`)));
  selector.addEventListener('change', () => {
    selected = Number(selector.value);
    draw();
  });

  const editor = [...QUESTIONS, 'Actual repayment'].map((question, j) => btn(question, () => {
    data[selected][j] = 1 - data[selected][j];
    recompute();
  }));
  const borrowerButtons = QUESTIONS.map((question, j) => btn(question, () => {
    borrower[j] = 1 - borrower[j];
    draw();
  }));

  function selectControl(label, values, initial, onChange) {
    const control = h('select', { 'aria-label': label },
      ...values.map(value => h('option', { value }, String(value))));
    control.value = initial;
    control.addEventListener('change', onChange);
    return control;
  }

  const first = selectControl('First vote rule to try', RULES, 1, reset);
  const limit = selectControl('Number of rules to try', RULES, 3, reset);
  const speed = h('input', { type: 'range', min: 1, max: 5, value: 2, 'aria-label': 'Speed' });
  const speedValue = h('span', {}, '2');
  speed.addEventListener('input', () => {
    speedValue.textContent = speed.value;
    schedule();
  });
  const guessButtons = RULES.map(k => btn(String(k), () => {
    guess = k;
    draw();
  }));
  const stepButton = btn('Step', () => {
    stop();
    advance();
  }, 'go');
  const playButton = btn('Play', () => {
    if (playing) {
      stop();
      draw();
    } else if (trials.length < Number(limit.value)) {
      playing = true;
      advance();
    }
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: learn a vote rule'),
    h('p', { class: 'sub' },
      'Trees vote on cards from the other fold. The combiner tries different rules and keeps the one with the fewest mistakes.'),
    h('div', { class: 'sim-grid' },
      h('div', {},
        h('div', { class: 'sim-card' },
          table,
          h('p', { class: 'sim-note' }, 'A = steady income, B = savings, C = previous loan repaid. A vote of 1 means full repayment.'),
          h('div', { class: 'sim-row' }, h('label', {}, 'Edit ', selector)),
          h('div', { class: 'sim-row' }, ...editor),
          h('div', { class: 'sim-row' },
            btn('New data', newData),
            btn('Lesson data', () => {
              data = copyStart();
              borrower = [1, 0, 1];
              selected = 0;
              recompute();
            }))),
        h('div', { class: 'sim-card' },
          chart, iteration,
          h('div', { class: 'sim-row' },
            h('label', {}, 'First rule ', first),
            h('label', {}, 'Rules to try ', limit)),
          h('div', { class: 'sim-row' },
            h('span', {}, 'Predict the best rule'), ...guessButtons),
          h('div', { class: 'sim-row' }, stepButton, playButton, btn('Reset', reset)),
          h('div', { class: 'sim-row' }, h('label', {}, 'Speed ', speed, ' ', speedValue)))),
      h('div', {},
        h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' },
          h('h3', {}, 'New borrower'),
          h('div', { class: 'sim-row' }, ...borrowerButtons), result),
        h('div', { class: 'sim-card' }, challengePanel)))));

  const lessonData = () => data.every((row, i) => row.every((value, j) => value === START[i][j]));
  const chal = challenges(challengePanel, [
    {
      text: 'Predict the best rule, then try all three rules.',
      check: st => st.trials.length === 3 && st.trials.some(t => t.k === st.guess && t.loss === st.best.loss),
      why: 'Your rule had the fewest mistakes among the rules you tried.',
    },
    {
      text: 'On the lesson data, find zero mistakes on your first step.',
      check: st => st.lesson && st.trials.length === 1 && st.best.loss === 0,
      why: 'Two votes correctly separate all eight repayment outcomes.',
    },
    {
      text: 'On the lesson data, try only the rule that requires three votes.',
      check: st => st.lesson && st.budget === 1 && st.best?.k === 3 && st.best.loss === 3,
      why: 'The search stops after one rule, so applications 1, 2 and 3 are wrong.',
    },
  ]);
  challengePanel.addEventListener('click', updateChallenge);

  function fit(rows) {
    // A branch predicts its more common outcome. A tied vote predicts partial.
    // An empty branch uses the majority of the training fold.
    const majority = branch => Number(2 * tally(branch.map(row => row[3])) > branch.length);
    return QUESTIONS.map((_, j) => [0, 1].map(answer => {
      const branch = rows.filter(row => row[j] === answer);
      return majority(branch.length ? branch : rows);
    }));
  }

  const predict = (trees, row) => trees.map((leaves, j) => leaves[row[j]]);

  function recompute() {
    const trees = [1, 2].map(fold => fit(data.filter((_, i) => FOLD[i] === fold)));
    samples = data.map((row, i) => {
      const votes = predict(trees[2 - FOLD[i]], row);
      return { votes, total: tally(votes) };
    });
    finalTrees = fit(data);
    reset();
  }

  function newData() {
    data = START.map(() => {
      const answers = QUESTIONS.map(() => rnd(0, 1));
      const outcome = Number(tally(answers) >= 2);
      return [...answers, rnd(1, 5) === 1 ? 1 - outcome : outcome];
    });
    selected = 0;
    recompute();
  }

  function stop() {
    clearTimeout(timer);
    timer = null;
    playing = false;
  }

  function reset() {
    stop();
    trials = [];
    guess = 0;
    draw();
  }

  function schedule() {
    clearTimeout(timer);
    timer = playing ? setTimeout(advance, 2400 / Number(speed.value)) : null;
  }

  function advance() {
    if (trials.length >= Number(limit.value)) return;
    const k = 1 + (Number(first.value) - 1 + trials.length) % RULES.length;
    const wrong = samples.flatMap(({ total }, i) => Number(total >= k) !== data[i][3] ? [i] : []);
    trials.push({ k, loss: wrong.length, wrong });
    if (trials.length >= Number(limit.value)) stop();
    draw();
    schedule();
  }

  function bestRule() {
    return trials.reduce((best, trial) => {
      if (!best || trial.loss < best.loss || (trial.loss === best.loss && trial.k < best.k)) return trial;
      return best;
    }, null);
  }

  function svgText(value, x, y, fill = C.ink, size = 15) {
    return s('text', { x, y, fill, 'font-size': size, 'text-anchor': 'middle',
      'dominant-baseline': 'middle', 'font-family': 'Consolas, monospace' }, value);
  }

  function drawTable(last) {
    const cols = [27, 72, 110, 140, 170, 217, 280, 355];
    const headings = ['App', 'Fold', 'A', 'B', 'C', 'Total', 'Actual', 'Guess'];
    const picture = headings.map((heading, j) => svgText(heading, cols[j], 17, C.cyan, 14));
    const descriptions = [];
    samples.forEach(({ votes, total }, i) => {
      const y = 46 + i * 33;
      const wrong = last?.wrong.includes(i);
      const outcome = data[i][3];
      const prediction = last ? full(total >= last.k) : '–';
      const values = [i + 1, FOLD[i], ...votes, total, full(outcome), prediction];
      const color = FOLD[i] === 1 ? C.cyan : C.violet;
      picture.push(s('rect', { x: 4, y: y - 14, width: 392, height: 28, rx: 6,
        fill: C.bg, stroke: wrong ? C.pink : i === selected ? C.amber : C.line }));
      const inks = [C.ink, color, C.ink, C.ink, C.ink, C.amber,
        outcome ? C.green : C.pink, last ? (wrong ? C.pink : C.green) : C.muted];
      values.forEach((value, j) => picture.push(svgText(value, cols[j], y, inks[j])));
      descriptions.push(`Application ${i + 1}, fold ${FOLD[i]}, votes ${votes.join(', ')}, total ${total}, ` +
        `actual ${full(outcome)}${last ? `, guess ${prediction}${wrong ? ', mistake' : ''}` : ''}`);
    });
    table.replaceChildren(s('desc', {}, descriptions.join('. ')), ...picture);
  }

  function drawChart(best) {
    const x = i => 52 + i * 103;
    const y = loss => 139 - loss * 13;
    const picture = [svgText('Mistakes out of 8', 205, 17, C.amber)];
    for (let n = 0; n <= 8; n += 2) {
      picture.push(s('line', { x1: x(0), x2: 383, y1: y(n), y2: y(n), stroke: n ? C.line : C.muted }),
        svgText(n, 32, y(n), C.ink, 13));
    }
    picture.push(s('line', { x1: x(0), x2: x(0), y1: y(8), y2: y(0), stroke: C.muted }));
    RULES.forEach(i => picture.push(svgText(`Try ${i}`, x(i), 163, C.ink, 14)));
    if (trials.length > 1) {
      const points = trials.map((trial, i) => `${x(i + 1)},${y(trial.loss)}`).join(' ');
      picture.push(s('polyline', { points, fill: 'none', stroke: C.amber, 'stroke-width': 3 }));
    }
    trials.forEach((trial, i) => {
      picture.push(s('circle', { cx: x(i + 1), cy: y(trial.loss), r: 6,
        fill: best === trial ? C.green : C.amber }));
    });
    chart.replaceChildren(s('desc', {}, trials.length
      ? trials.map((t, i) => `Try ${i + 1}, require ${t.k} votes, ${t.loss} mistakes`).join('. ')
      : 'No rules tried yet.'), ...picture);
  }

  function updateChallenge() {
    chal.update({ trials, guess, best: bestRule(), lesson: lessonData(), budget: Number(limit.value) });
  }

  function draw() {
    const last = trials[trials.length - 1];
    const previous = trials[trials.length - 2];
    const best = bestRule();
    const budget = Number(limit.value);
    const finished = trials.length >= budget;
    const selectedSample = samples[selected];
    selector.value = selected;
    editor.forEach((button, j) => {
      button.textContent = j === 3 ? `Actual repayment · ${full(data[selected][j])}`
        : `${QUESTIONS[j]} · ${yes(data[selected][j])}`;
    });
    borrowerButtons.forEach((button, j) => {
      button.textContent = `${QUESTIONS[j]} · ${yes(borrower[j])}`;
    });
    guessButtons.forEach((button, i) => {
      button.disabled = trials.length > 0;
      button.setAttribute('aria-pressed', String(guess === i + 1));
      button.classList.toggle('go', guess === i + 1);
    });
    stepButton.disabled = finished;
    playButton.disabled = finished;
    playButton.textContent = playing ? 'Pause' : 'Play';
    iteration.textContent = `Iteration ${trials.length} of ${budget}${finished ? ' · Finished' : ''}`;

    drawTable(last);
    drawChart(best);
    const details = [
      `App ${selected + 1} · trees fit on fold ${3 - FOLD[selected]}`,
      `${selectedSample.votes.join(' + ')} = ${selectedSample.total} full votes`,
    ];
    if (last) {
      const ids = last.wrong.map(i => i + 1).join(', ');
      const predicted = full(selectedSample.total >= last.k);
      details.push(previous ? `Rule: ${previous.k} → ${last.k} votes` : `First rule: ${last.k} votes needed`,
        `App ${selected + 1}: ${predicted} (${full(data[selected][3])} actual)`,
        [`${last.loss} mistakes out of 8${ids ? ` · apps ${ids}` : ''}`, last.loss ? C.pink : C.green]);
      if (previous) {
        const diff = last.loss - previous.loss;
        details.push(`Change: ${diff > 0 ? '+' : ''}${diff} mistakes`);
      }
      details.push([`${finished ? 'Learned rule' : 'Best so far'}: ${best.k} votes · ${best.loss}/8 mistakes`, C.green]);
    } else {
      details.push(`First try will require ${first.value} votes.`);
    }
    fbox(box, details);

    const newVotes = predict(finalTrees, borrower);
    const total = tally(newVotes);
    const voteText = `Trees fit on all 8: ${newVotes.join(' + ')} = ${total}.`;
    result.textContent = best
      ? `${voteText} ${total >= best.k ? 'Full' : 'Partial'} repayment with the ${best.k}-vote rule${finished ? '.' : ' so far.'}`
      : `${voteText} Try a rule to predict repayment.`;
    updateChallenge();
  }

  recompute();
  return () => {
    stop();
    challengePanel.removeEventListener('click', updateChallenge);
  };
}
