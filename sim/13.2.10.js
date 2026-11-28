// 13.2.10 Try it: build one-question trees and watch their combined loss.
const START = [
  [0, 1, 1, 0, 1], [1, 0, 1, 0, 1], [1, 1, 0, 1, 1], [1, 1, 1, 1, 1],
  [1, 0, 0, 1, -1], [0, 1, 0, 0, -1], [0, 0, 1, 1, -1], [0, 0, 0, 0, -1],
];
const QUESTIONS = ['Steady income', 'Savings', 'Previous repayment', 'Reminders'];
const EPSILON = 1e-12;

function fit(rows, weights) {
  let best = null;
  for (let question = 0; question < QUESTIONS.length; question++) {
    const totals = [0, 0];
    rows.forEach((row, i) => { totals[row[question]] += weights[i] * row[4]; });
    const branches = totals.map(total => total > EPSILON ? 1 : -1);
    const predictions = rows.map(row => branches[row[question]]);
    const missed = predictions.map((vote, i) => vote !== rows[i][4]);
    const error = weights.reduce((sum, weight, i) => sum + (missed[i] ? weight : 0), 0);
    if (!best || error < best.error - EPSILON) {
      best = { question, predictions, missed, error };
    }
  }
  return best;
}

function initial(rows) {
  return {
    weights: rows.map(() => 1 / rows.length),
    scores: rows.map(() => 0),
    mistakes: rows.filter(row => row[4] === 1).length,
    loss: 1,
  };
}

function addTree(rows, previous, tree) {
  const { error, missed, predictions } = tree;
  // A perfect tree has an infinite strength in the formula. Use a finite
  // display value for this last tree, and leave its weights in the same ratios.
  const strength = error === 0 ? Math.log(1 / EPSILON) / 2 : Math.log((1 - error) / error) / 2;
  const weights = previous.weights.map((old, i) => {
    if (error === 0) return old;
    return old / (2 * (missed[i] ? error : 1 - error));
  });
  const scores = previous.scores.map((score, i) => score + predictions[i] * strength);
  const mistakes = rows.filter((row, i) => (scores[i] > EPSILON ? 1 : -1) !== row[4]).length;
  const loss = scores.reduce((sum, score, i) => sum + Math.exp(-rows[i][4] * score), 0) / rows.length;
  return { weights, scores, mistakes, loss, tree, strength };
}

export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const copy = rows => rows.map(row => row.slice());
  let rows = copy(START);
  let selected = 0, limit = 3, history = [initial(rows)], stop = '', timer = null;
  let original = true, prediction = '', checkedPrediction = false;

  const svg = s('svg', { viewBox: '0 0 360 337', role: 'img', 'aria-label': 'Application weights and loss by tree count' });
  const box = h('div');
  const status = h('div', { class: 'sim-note', role: 'status' });
  const details = h('div', { class: 'sim-note' });
  const challengeHost = h('div');

  const stepButton = btn('Step', step, 'go');
  const playButton = btn('Play', toggle);
  const speed = h('input', { type: 'range', min: 1, max: 5, value: 3, 'aria-label': 'Play speed',
    oninput: () => { if (timer !== null) schedule(); } });

  const trees = h('select', { 'aria-label': 'Tree limit', onchange: () => {
    limit = Number(trees.value);
    if (iteration() > limit) {
      history = history.slice(0, limit + 1);
      stop = history.at(-1).tree?.error === 0 ? 'perfect' : '';
    }
    if (finished()) pause();
    draw();
  } }, Array.from({ length: 12 }, (_, i) => h('option', { value: i + 1 }, String(i + 1))));
  trees.value = String(limit);

  const application = h('select', { 'aria-label': 'Application', onchange: () => {
    selected = Number(application.value);
    draw();
  } }, START.map((_, i) => h('option', { value: i }, `App ${i + 1}`)));

  const guess = h('select', { 'aria-label': 'Predict the first question', onchange: () => {
    prediction = guess.value;
    checkedPrediction = false;
    draw();
  } }, h('option', { value: '' }, 'Choose a question'),
  QUESTIONS.map((name, i) => h('option', { value: i }, name)));
  const guessFeedback = h('div', { class: 'sim-note', role: 'status' });

  const chal = challenges(challengeHost, [
    { text: 'Use the lesson data and predict the first question, then press Step.',
      check: state => state.original && state.correctGuess,
      why: 'Steady income ties with savings and previous repayment, and it comes first in the question order.' },
    { text: 'On the lesson data, reach zero wrong predictions in three steps.',
      check: state => state.original && state.count === 3 && state.mistakes === 0,
      why: 'The third tree gives enough weight to the right votes for all eight applications.' },
    { text: 'Set the tree limit to two and run the lesson data. How many predictions are still wrong?',
      check: state => state.original && state.limit === 2 && state.count === 2 && state.mistakes === 2,
      why: 'With two trees, two applications still receive a stronger vote for the wrong outcome.' },
    { text: 'Select App 1, change its recorded outcome, and run one step.',
      check: state => state.changedApp1 && state.count > 0,
      why: 'The tree uses the recorded outcome when it decides which predictions to count as mistakes.' },
  ]);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: build an AdaBoost vote'),
    h('p', { class: 'sub' }, 'Add one tree at a time. The bars show which applications will have more influence on the next tree.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, stepButton, playButton,
          btn('Reset', reset),
          btn('New data', newData),
          btn('Lesson data', () => {
            rows = copy(START);
            original = true;
            selected = 0;
            reset();
          })),
        h('div', { class: 'sim-row' },
          h('label', {}, 'Tree limit ', trees),
          h('label', {}, 'Speed ', speed)),
        h('div', { class: 'sim-row' }, h('label', {}, 'Inspect ', application),
          btn('Change recorded outcome', () => {
            rows[selected][4] *= -1;
            reset();
          })),
        details),
      h('div', {},
        h('div', { class: 'sim-card' }, box, status,
          h('div', { class: 'sim-row' }, h('label', {}, 'First question ', guess)), guessFeedback),
        h('div', { class: 'sim-card' }, challengeHost)))));

  const iteration = () => history.length - 1;
  const finished = () => Boolean(stop) || iteration() >= limit;
  const isLessonData = () => original && rows.every((row, i) => row[4] === START[i][4]);
  const outcome = vote => vote === 1 ? 'Full' : 'Partial';
  const number = value => value.toFixed(3);
  const signed = value => `${value < 0 ? '−' : '+'}${number(Math.abs(value))}`;

  function pause() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  function schedule() {
    pause();
    timer = setTimeout(() => {
      timer = null;
      advance();
      if (!finished()) schedule();
      draw();
    }, 2200 / Number(speed.value));
  }

  function toggle() {
    if (timer !== null) pause();
    else if (!finished()) schedule();
    draw();
  }

  function advance() {
    if (finished()) return;
    const previous = history.at(-1);
    const tree = fit(rows, previous.weights);
    if (tree.error >= 0.5 - EPSILON) {
      stop = 'tie';
      return;
    }
    if (iteration() === 0) checkedPrediction = prediction !== '';
    history.push(addTree(rows, previous, tree));
    if (tree.error === 0) stop = 'perfect';
  }

  function step() {
    pause();
    advance();
    draw();
  }

  function reset() {
    pause();
    history = [initial(rows)];
    stop = '';
    prediction = '';
    checkedPrediction = false;
    guess.value = '';
    draw();
  }

  function shuffle(values) {
    for (let i = values.length - 1; i > 0; i--) {
      const j = rnd(0, i);
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  }

  function newData() {
    const outcomes = shuffle(START.map(row => row[4]));
    const useful = rnd(0, QUESTIONS.length - 1);
    const full = outcomes.flatMap((value, i) => value === 1 ? [i] : []);
    const partial = outcomes.flatMap((value, i) => value === -1 ? [i] : []);
    const exceptions = [full[rnd(0, full.length - 1)], partial[rnd(0, partial.length - 1)]];
    rows = outcomes.map((value, i) => {
      const answers = QUESTIONS.map(() => rnd(0, 1));
      answers[useful] = Number((value === 1) !== exceptions.includes(i));
      return [...answers, value];
    });
    original = false;
    selected = 0;
    reset();
  }

  function drawChart(state) {
    const axis = (x1, y1, x2, y2, options = {}) => s('line', {
      x1, y1, x2, y2, stroke: C.line, 'stroke-width': 1.5, ...options,
    });
    const text = (x, y, value, fill = C.ink, size = 14, anchor = 'middle') => s('text', {
      x, y, fill, 'font-size': size, 'text-anchor': anchor, 'font-family': 'Consolas, monospace',
    }, value);

    const base = 125;
    const weightMax = Math.max(0.25, ...state.weights);
    const art = [text(16, 19, 'Weights for the next tree', C.ink, 16, 'start'), axis(12, base, 348, base)];
    state.weights.forEach((weight, i) => {
      const x = 32 + i * 42;
      const height = 82 * weight / weightMax;
      const color = state.tree?.missed[i] ? C.pink : C.cyan;
      art.push(
        s('rect', { x: x - 18, y: 27, width: 36, height: 134, rx: 7,
          fill: i === selected ? C.line : 'transparent' }),
        s('rect', { x: x - 11, y: base - height, width: 22, height, rx: 3, fill: color }),
        text(x, Math.max(39, base - height - 6), weight.toFixed(2), color, 12),
        text(x, 144, String(i + 1), C.ink, 15),
        text(x, 159, outcome(rows[i][4]), rows[i][4] === 1 ? C.cyan : C.violet, 11));
    });

    const x0 = 44, x1 = 335, y0 = 289, y1 = 203;
    const x = i => x0 + i * (x1 - x0) / limit;
    const y = loss => y0 - loss * (y0 - y1);
    art.push(text(16, 185, 'Exponential loss', C.ink, 16, 'start'), axis(x0, y0, x1, y0));
    for (const value of [0, 0.5, 1]) {
      art.push(axis(x0, y(value), x1, y(value)), text(x0 - 8, y(value) + 4, String(value), C.muted, 12, 'end'));
    }
    for (let i = 0; i <= limit; i++) {
      art.push(axis(x(i), y0, x(i), y0 + 4), text(x(i), 306, String(i), C.muted, 12));
    }
    if (history.length > 1) {
      art.push(s('polyline', { points: history.map(({ loss }, i) => `${x(i)},${y(loss)}`).join(' '),
        fill: 'none', stroke: C.amber, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
    }
    history.forEach(({ loss }, i) => art.push(s('circle', {
      cx: x(i), cy: y(loss), r: i === iteration() ? 4.5 : 3, fill: C.amber,
    })));
    art.push(text(190, 327, 'Tree count', C.muted, 13));
    svg.replaceChildren(...art);
  }

  function draw() {
    const count = iteration();
    const state = history.at(-1);
    const tree = state.tree;
    const running = timer !== null;
    const first = history[1]?.tree?.question;
    const correctGuess = checkedPrediction && prediction !== '' && Number(prediction) === first;

    drawChart(state);
    stepButton.disabled = finished();
    playButton.disabled = finished() && !running;
    playButton.textContent = running ? 'Pause' : 'Play';
    application.value = String(selected);
    guess.disabled = count > 0 || Boolean(stop);

    const row = rows[selected];
    details.textContent = `App ${selected + 1} · Recorded ${outcome(row[4])} · ` +
      QUESTIONS.map((name, i) => `${name}: ${row[i] ? 'yes' : 'no'}`).join(' · ');

    if (tree) {
      const old = history[count - 1].weights[selected];
      const weight = state.weights[selected];
      const appResult = tree.missed[selected] ? 'missed' : 'correct';
      const denominator = tree.missed[selected] ? tree.error : 1 - tree.error;
      const update = tree.error === 0
        ? `${number(old)} → ${number(weight)}`
        : `${number(old)} ÷ (2 × ${number(denominator)}) ≈ ${number(weight)}`;
      fbox(box, [
        `Tree ${count} / ${limit} · ${QUESTIONS[tree.question]}`,
        `Weighted error = ${number(tree.error)}`,
        [`Voting strength ≈ ${number(state.strength)}`, C.cyan],
        `App ${selected + 1}: ${outcome(tree.predictions[selected])} (${appResult})`,
        [update, tree.missed[selected] ? C.pink : C.cyan],
        `Weight change ≈ ${signed(weight - old)}`,
        `Combined score ≈ ${signed(state.scores[selected])}`,
        `Combined prediction: ${outcome(state.scores[selected] > EPSILON ? 1 : -1)}`,
        `Wrong predictions: ${state.mistakes} / ${rows.length}`,
        ['Loss: ' + number(history[count - 1].loss) + ' → ' + number(state.loss), C.amber],
      ]);
    } else {
      fbox(box, [`Tree 0 / ${limit}`, ['Each weight = 1/8', C.cyan], ['Exponential loss = 1', C.amber]]);
    }

    status.textContent = {
      perfect: 'This tree got every record right. Its displayed strength is capped, and the run ends here.',
      tie: 'Every question leaves half the weight on mistakes. Another tree would have zero voting strength.',
    }[stop] || (finished() ? `Reached the limit of ${limit} ${limit === 1 ? 'tree' : 'trees'}.` : '');
    guessFeedback.textContent = checkedPrediction
      ? `${correctGuess ? 'Correct. ' : ''}The first tree chose ${QUESTIONS[first].toLowerCase()}.` : '';
    chal.update({ original: isLessonData(), correctGuess, count, mistakes: state.mistakes, limit,
      changedApp1: original && rows[0][4] !== START[0][4] });
  }

  draw();
  return pause;
}
