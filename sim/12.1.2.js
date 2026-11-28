// 12.1.2 Try it: answers, patterns and rewards.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const START = [
    ['Ali', 0, 20, 0, false], ['Ali', 1, 18, 0, false], ['Ali', 2, 22, 1, false],
    ['Ali', 3, 19, 0, false], ['Ali', 4, 21, 0, false], ['Ali', 5, 20, 0, false],
    ['Bea', 0, 12, 0, false], ['Bea', 1, 6, 1, false], ['Bea', 2, 2, 1, true],
    ['Chen', 0, 15, 0, false], ['Chen', 1, 10, 0, false], ['Chen', 2, 7, 1, false],
    ['Chen', 3, 3, 2, true], ['Farah', 1, 1, 0, true],
    ['Dina', 2, 3, 0, false], ['Dina', 3, 9, 0, false], ['Dina', 4, 14, 0, false],
    ['Dina', 5, 16, 0, false], ['Eli', 4, 11, 0, false], ['Eli', 5, 6, 1, true],
  ];
  const MODES = ['Answers', 'Patterns', 'Rewards'];
  const ACTIONS = ['Nothing', 'Discount'];
  const MAX_TRIALS = 24;
  const DEFAULT_REWARDS = [0, 1, 1, 1];
  const nameOf = r => `${r[0]} · ${MONTHS[r[1]]}`;
  const resultOf = cancelled => cancelled ? 'Cancel' : 'Stay';

  let mode = 'Answers', rows = START, selected = 0, cutoff = 5, showLabels = false;
  let hidden = false, guess = 20, revealed = false, randomRows = false;
  let rewards = DEFAULT_REWARDS, estimates, history, previous, prediction, predictedBefore, rate = 0.5;
  let speed = 1, timer = null;

  const box = h('div'), note = h('p', { class: 'sim-note' }), challengePanel = h('div');
  const controls = h('div'), secondary = h('div');
  const picture = h('div', { style: { marginTop: '.85rem' } });
  const modeButtons = MODES.map(label => btn(label, () => selectMode(label)));
  const cutoffInput = h('input', { type: 'range', min: 1, max: 24, value: cutoff, oninput: e => {
    cutoff = Number(e.target.value);
    drawRecords();
  } });
  const cutoffText = h('span');
  const labelsButton = btn('Show outcomes', () => {
    showLabels = !showLabels;
    drawRecords();
  });
  const hideButton = btn('Hide selected hours', () => {
    hidden = true;
    revealed = false;
    drawRecords();
  });
  const revealButton = btn('Reveal hours', () => {
    revealed = true;
    drawRecords();
  });
  const guessInput = h('input', { type: 'range', min: 0, max: 24, value: guess, oninput: e => {
    guess = Number(e.target.value);
    drawRecords();
  } });
  const guessText = h('span');
  const guessRow = h('label', { class: 'sim-row' }, guessText, guessInput);
  const cutoffRow = h('label', { class: 'sim-row' }, cutoffText, cutoffInput);
  const patternControls = h('div', {}, h('div', { class: 'sim-row' }, labelsButton, hideButton, revealButton), guessRow);

  const rateInput = h('input', { type: 'range', min: 0, max: 1, step: 0.25, value: rate, oninput: e => {
    rate = Number(e.target.value);
    drawRewards();
  } });
  const speedInput = h('input', { type: 'range', min: 0.5, max: 4, step: 0.5, value: speed, oninput: e => {
    speed = Number(e.target.value);
    if (timer !== null) startPlaying();
    drawRewards();
  } });
  const rateText = h('span'), speedText = h('span');
  const stepButton = btn('Step', advance, 'go');
  const playButton = btn('Play', togglePlay);
  const predict = h('select', { onchange: e => {
    prediction = e.target.value;
    drawRewards();
  } }, h('option', { value: '' }, 'Choose an action'),
  ...ACTIONS.map(action => h('option', { value: action }, action)));
  const rewardControls = h('div', {},
    h('div', { class: 'sim-row' }, stepButton, playButton, btn('Reset', resetRewards)),
    h('label', { class: 'sim-row' }, speedText, speedInput),
    h('label', { class: 'sim-row' }, rateText, rateInput),
    h('label', { class: 'sim-row' }, 'Which action will earn more for light listeners?', predict));
  const svg = s('svg', { viewBox: '0 0 370 237', role: 'img', 'aria-label': 'Reward estimate error by trial' });
  const count = h('p', { class: 'sim-note', 'aria-live': 'polite' });
  const rewardPicture = h('div', {}, svg, count);

  const chal = challenges(challengePanel, [
    {
      text: 'In Answers, use a 5-hour cutoff and select Dina’s March card to find a wrong guess.',
      check: st => st.mode === 'Answers' && !st.random && st.cutoff === 5 &&
        st.row === START[14] && st.guessCancel !== st.row[4],
      why: 'Dina played 3 hours, so the rule guesses cancel, but her card says she stayed.',
    },
    {
      text: 'In Patterns, show outcomes and select a light listener who stayed.',
      check: st => st.mode === 'Patterns' && st.showLabels && st.row[2] < 5 && !st.row[4],
      why: 'This listener played under 5 hours and stayed, so the listening group alone cannot tell you the outcome.',
    },
    {
      text: 'In Rewards, predict the better action for light listeners before the first step, then get the error to 0.125 or less by trial 8.',
      check: st => st.mode === 'Rewards' && st.n >= 4 && st.n <= 8 && st.loss <= 0.125 &&
        st.predictedBefore === st.best,
      why: 'The better action earned more in both light-listener comparisons, and your updates brought the estimates closer.',
    },
    {
      text: 'In Rewards, reset, move the learning rate to 0 and run four trials to see why the estimates get stuck.',
      check: st => st.mode === 'Rewards' && st.rate === 0 && st.n >= 4 && st.loss === 0.5 &&
        st.history.every(value => value === 0.5),
      why: 'At a learning rate of 0, every update is zero, so the estimates stay where they started.',
    },
  ]);
  // The kit stores completed challenges. Recheck after the learner navigates.
  challengePanel.addEventListener('click', () => updateChallenges());

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: three ways to learn'),
    h('p', { class: 'sub' }, 'Check a rule against renewal outcomes, look for patterns in the same cards, or learn from rewards in imagined trials.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Ways to learn' }, ...modeButtons),
        controls, picture, secondary,
        h('div', { class: 'sim-row' }, btn('New data', newData), btn('Restore lesson data', restoreData))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengePanel)))));

  function updateChallenges() {
    const row = rows[selected];
    chal.update({
      mode, row, cutoff, random: randomRows, showLabels, guessCancel: row[2] < cutoff,
      n: history.length - 1, loss: history.at(-1), predictedBefore, rate, history,
      best: rewards[0] > rewards[1] ? ACTIONS[0] : ACTIONS[1],
    });
  }

  function selectMode(next) {
    stopPlaying();
    mode = next;
    modeButtons.forEach((button, i) => {
      const active = MODES[i] === mode;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('go', active);
    });
    controls.replaceChildren(...(mode === 'Answers' ? [cutoffRow] : []));
    secondary.replaceChildren(...(mode === 'Rewards' ? [rewardControls] : mode === 'Patterns' ? [patternControls] : []));
    draw();
  }

  function clearMask() {
    hidden = false;
    revealed = false;
    guess = 20;
    guessInput.value = guess;
  }

  function selectRecord(i) {
    selected = i;
    clearMask();
    drawRecords();
    picture.querySelector('[aria-pressed="true"]')?.focus();
  }

  function newData() {
    if (mode === 'Rewards') {
      const lightNothing = rnd(0, 1);
      rewards = [lightNothing, 1 - lightNothing, rnd(0, 1), rnd(0, 1)];
      resetRewards();
      return;
    }
    rows = START.map(([name, month]) => {
      const hours = rnd(0, 2) === 0 ? rnd(1, 4) : rnd(6, 24);
      return [name, month, hours, rnd(0, 2), rnd(1, 10) <= (hours < 5 ? 6 : 2)];
    });
    randomRows = true;
    clearMask();
    drawRecords();
  }

  function restoreData() {
    rows = START;
    selected = 0;
    cutoff = 5;
    cutoffInput.value = cutoff;
    showLabels = false;
    randomRows = false;
    clearMask();
    rewards = DEFAULT_REWARDS;
    resetRewards();
  }

  function recordCard(r, i, labels) {
    const isSelected = i === selected;
    const covered = mode === 'Patterns' && isSelected && hidden && !revealed;
    const color = labels ? (r[4] ? C.pink : C.cyan) : C.ink;
    const detail = `${covered ? '?' : r[2]} h · ${r[3]} help`;
    const button = btn(nameOf(r), () => selectRecord(i));
    button.append(h('span', { style: { display: 'block', fontWeight: 'normal' } }, detail));
    if (labels) button.append(h('span', { style: { display: 'block' } }, resultOf(r[4])));
    button.setAttribute('aria-pressed', String(isSelected));
    Object.assign(button.style, {
      color, textAlign: 'left', borderColor: isSelected ? C.amber : labels ? color : C.line,
      background: isSelected ? '#2a2434' : C.bg,
    });
    return button;
  }

  function cardGrid(title, indices, labels) {
    return h('div', { style: { marginBottom: '.8rem' } },
      h('h3', { style: { fontSize: '1rem', margin: '0 0 .3rem' } }, title),
      h('div', { style: { display: 'grid', gap: '.4rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 8rem), 1fr))' } },
      ...indices.map(i => recordCard(rows[i], i, labels))));
  }

  function drawRecords() {
    const row = rows[selected], [, , hours, help, cancelled] = row;
    const hourMasked = mode === 'Patterns' && hidden && !revealed;
    const indices = rows.map((_, i) => i);
    const groups = mode === 'Answers'
      ? MONTHS.map((month, m) => [month, indices.filter(i => rows[i][1] === m)])
      : [
        ['Under 5 hours', indices.filter(i => (i !== selected || !hourMasked) && rows[i][2] < 5)],
        ['5 to 17 hours', indices.filter(i => (i !== selected || !hourMasked) && rows[i][2] >= 5 && rows[i][2] < 18)],
        ['18 hours or more', indices.filter(i => (i !== selected || !hourMasked) && rows[i][2] >= 18)],
        ['Hours hidden', hourMasked ? [selected] : []],
      ];
    if (mode === 'Patterns') {
      groups.forEach(([, members]) => members.sort((a, b) => rows[a][2] - rows[b][2] || rows[a][3] - rows[b][3]));
    }
    const labels = mode === 'Answers' || showLabels;
    picture.replaceChildren(...groups.filter(([, members]) => members.length)
      .map(([title, members]) => cardGrid(title, members, labels)));

    if (mode === 'Answers') {
      const guessCancel = hours < cutoff;
      const correct = rows.filter(r => (r[2] < cutoff) === r[4]).length;
      cutoffText.textContent = `Cancel below ${cutoff} hours`;
      fbox(box, [
        nameOf(row), `${hours} h · ${help} help`,
        `Rule says ${resultOf(guessCancel).toLowerCase()}`,
        `Card says ${resultOf(cancelled).toLowerCase()}`,
        [`${correct} of ${rows.length} guesses match`, guessCancel === cancelled ? C.green : C.amber],
      ]);
      note.textContent = 'Move the cutoff to change the rule. Select a card to compare its prediction and recorded outcome.';
    } else {
      labelsButton.textContent = showLabels ? 'Cover outcomes' : 'Show outcomes';
      labelsButton.setAttribute('aria-pressed', String(showLabels));
      hideButton.disabled = hourMasked;
      revealButton.hidden = !hourMasked;
      guessRow.hidden = !hourMasked;
      guessRow.style.display = hourMasked ? '' : 'none';
      guessText.textContent = `Guess the hidden hours: ${guess}`;
      const sameCustomer = rows.filter(r => r !== row && r[0] === row[0]).map(r => r[2]);
      const clue = sameCustomer.length ? `Other months: ${sameCustomer.join(', ')} h` : 'No other months for this listener';
      const lines = [nameOf(row), `${hourMasked ? '?' : hours} h · ${help} help`];
      if (hidden) {
        lines.push(clue, `Your guess: ${guess} h`);
        if (revealed) lines.push([`Actual: ${hours} h · off by ${Math.abs(guess - hours)} h`, C.amber]);
      } else if (showLabels) {
        lines.push([`Outcome: ${resultOf(cancelled).toLowerCase()}`, cancelled ? C.pink : C.cyan]);
      }
      fbox(box, lines);
      note.textContent = hourMasked
        ? 'Use the visible records to guess the hidden value, then reveal it.'
        : 'These groups use hours. Select a card to hide its hours or show the recorded outcomes.';
    }
    updateChallenges();
  }

  function averageError() {
    return estimates.reduce((sum, value, i) => sum + Math.abs(value - rewards[i]), 0) / rewards.length;
  }

  function resetRun() {
    stopPlaying();
    estimates = rewards.map(() => 0.5);
    history = [averageError()];
    previous = null;
    prediction = '';
    predictedBefore = '';
    predict.value = '';
  }

  function resetRewards() {
    resetRun();
    draw();
  }

  function stopPlaying() {
    if (timer !== null) clearInterval(timer);
    timer = null;
  }

  function startPlaying() {
    stopPlaying();
    timer = setInterval(advance, 1100 / speed);
  }

  function togglePlay() {
    if (timer === null) startPlaying();
    else stopPlaying();
    drawRewards();
  }

  function advance() {
    const trial = history.length - 1;
    if (trial >= MAX_TRIALS) return;
    if (trial === 0) predictedBefore = prediction;
    const index = trial % rewards.length;
    const old = estimates[index], reward = rewards[index], error = reward - old;
    const change = rate * error;
    estimates[index] = old + change;
    previous = { index, old, reward, error, change, next: estimates[index] };
    history.push(averageError());
    if (history.length - 1 === MAX_TRIALS) stopPlaying();
    drawRewards();
  }

  function fixed(n) {
    // Expose enough precision for the challenge threshold and small updates.
    return Number(n.toFixed(4)).toString();
  }

  function drawRewards() {
    if (picture.firstChild !== rewardPicture) picture.replaceChildren(rewardPicture);
    const n = history.length - 1;
    const x = i => 43 + i / MAX_TRIALS * 308;
    const y = loss => 178 - loss / 0.5 * 131;
    const label = (value, xx, yy, color = C.ink, anchor = 'middle') =>
      s('text', { x: xx, y: yy, fill: color, 'text-anchor': anchor, 'font-size': 14,
        'font-family': 'Consolas, monospace' }, value);
    const chart = [label('Average estimate error', 197, 23)];
    [0, 0.125, 0.25, 0.375, 0.5].forEach(v => {
      chart.push(s('line', { x1: x(0), y1: y(v), x2: x(MAX_TRIALS), y2: y(v),
        stroke: v === 0.125 ? C.muted : C.line, 'stroke-dasharray': v === 0.125 ? '4 4' : null }),
      label(v, x(0) - 5, y(v) + 4, C.ink, 'end'));
    });
    [0, 4, 8, 12, 16, 20, 24].forEach(i => chart.push(label(i, x(i), 197, C.ink)));
    chart.push(label('Trials', 197, 221));
    if (n) {
      chart.push(s('polyline', { points: history.map((v, i) => `${x(i)},${y(v)}`).join(' '),
        fill: 'none', stroke: C.amber, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    }
    chart.push(s('circle', { cx: x(n), cy: y(history[n]), r: 4, fill: C.amber }));
    svg.replaceChildren(...chart);

    playButton.textContent = timer === null ? 'Play' : 'Pause';
    playButton.disabled = n >= MAX_TRIALS;
    stepButton.disabled = n >= MAX_TRIALS || timer !== null;
    predict.disabled = n > 0;
    rateText.textContent = `Learning rate: ${fmt(rate)}`;
    speedText.textContent = `Speed: ${fmt(speed)}×`;
    count.textContent = `Trial ${n} of ${MAX_TRIALS} · Error ${fixed(history[n])}`;

    const values = [
      `Light: ${fixed(estimates[0])} / ${fixed(estimates[1])}`,
      `Frequent: ${fixed(estimates[2])} / ${fixed(estimates[3])}`,
    ];
    if (previous) {
      const { index, old, reward, error, change, next } = previous;
      fbox(box, [
        `${index < 2 ? 'Light' : 'Frequent'} · ${ACTIONS[index % 2]}`,
        `Reward: ${reward} · old: ${fixed(old)}`,
        `Error: ${fixed(error)}`,
        `Change: ${fixed(change)}`,
        [`New estimate: ${fixed(next)}`, C.amber],
        'Nothing / Discount', ...values,
      ]);
    } else {
      fbox(box, ['Starting estimates', 'Nothing / Discount', ...values]);
    }
    note.textContent = 'In these imagined trials, each action has a fixed reward for each listener type. The chart averages how far the four estimates are from those rewards.';
    updateChallenges();
  }

  function draw() {
    if (mode === 'Rewards') drawRewards();
    else drawRecords();
  }

  resetRun();
  selectMode('Answers');
  return stopPlaying;
}
