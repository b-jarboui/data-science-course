// 13.2.7 Try it: build one tree per bootstrap sample and compare the votes.
const START = [
  [0, 1, 1, 0, 1], [1, 0, 1, 0, 1], [1, 1, 0, 1, 1], [1, 1, 1, 1, 1],
  [1, 0, 0, 1, 0], [0, 1, 0, 0, 0], [0, 0, 1, 1, 0], [0, 0, 0, 0, 0],
];
const FIXED = [
  [6, 4, 3, 5, 8, 4, 3, 6],
  [1, 7, 1, 2, 3, 3, 7, 3],
  [4, 5, 5, 1, 1, 2, 5, 4],
];
const QUESTIONS = ['Steady income', 'Savings', 'Previous loan repaid', 'Requested reminders'];
const MAX_TREES = 40;

function fitTree(data, draw) {
  const rows = draw.map(id => data[id - 1]);
  let best = null;
  QUESTIONS.forEach((_, q) => {
    const counts = [[0, 0], [0, 0]];
    rows.forEach(row => { counts[row[q]][row[4]]++; });

    // Each branch contributes its own Gini impurity times its share of the sample.
    const impurity = counts.reduce((sum, [partial, full]) => {
      const size = partial + full;
      return sum + (size ? 2 * partial * full / size / rows.length : 0);
    }, 0);
    if (!best || impurity < best.impurity - 1e-12) {
      const leaves = counts.map(([partial, full]) => Number(full > partial));
      best = { q, impurity, votes: data.map(row => leaves[row[q]]) };
    }
  });
  return best;
}

export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const view = h('div', { class: 'sim' });
  const svg = s('svg', { viewBox: '0 0 380 392', role: 'img', 'aria-label': 'Sample cards, votes and mistakes' });
  const formula = h('div');
  const note = h('p', { class: 'sim-note', 'aria-live': 'polite' });
  const status = h('p', { class: 'sim-note' });
  const challengeHost = h('div');
  const limitLabel = h('span');
  const speedLabel = h('span');
  const limitInput = h('input', { type: 'range', min: 1, max: MAX_TREES, value: 12, oninput: changeLimit });
  const speedInput = h('input', { type: 'range', min: 1, max: 8, value: 2, oninput: changeSpeed });
  const answerInput = h('select', { class: 'sim-btn' },
    h('option', { value: '' }, 'Choose a prediction'),
    h('option', { value: '1' }, 'Full repayment'),
    h('option', { value: '0' }, 'Partial repayment'));
  const repeatInput = h('input', { type: 'checkbox', onchange: changeMode });
  const stepButton = btn('Step', step, 'go');
  const playButton = btn('Play', togglePlay);
  const flipButton = btn('Switch actual repayment', flipOutcome);
  const appButtons = START.map((_, i) => btn(String(i + 1), () => {
    selected = i;
    render();
  }));

  let data = START.map(row => row.slice());
  let lessonDraws = true;
  let draws = makeDraws(true);
  let history = [];
  let count = 0;
  let selected = 0;
  let limit = Number(limitInput.value);
  let speed = Number(speedInput.value);
  let timer = null;

  root.append(view);
  view.append(
    h('h2', {}, 'Try it: combine tree votes'),
    h('p', { class: 'sub' }, 'Each step draws eight cards with replacement and builds a tree with one question. Pick an application to follow its votes.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg, status,
        h('div', { class: 'sim-row' }, stepButton, playButton, btn('Reset', reset)),
        h('div', { class: 'sim-row' },
          h('label', {}, limitLabel, ' ', limitInput),
          h('label', {}, speedLabel, ' ', speedInput)),
        h('div', { class: 'sim-row' },
          btn('Fresh draws', freshDraws),
          btn('New data', newData),
          btn('Lesson data', restoreLesson)),
        h('div', { class: 'sim-row' },
          h('label', { style: { minHeight: '44px', display: 'inline-flex', alignItems: 'center', gap: '.4rem' } },
            repeatInput, 'Repeat the first sample'))),
      h('div', {},
        h('div', { class: 'sim-card' },
          h('div', {}, 'Follow application'),
          h('div', { class: 'sim-row' }, appButtons), note, flipButton,
          h('div', { class: 'sim-row' }, h('label', {}, 'Predict before running ', answerInput)),
          h('div', { style: { marginTop: '.8rem' } }, formula)),
        h('div', { class: 'sim-card' }, challengeHost))));
  
  const challenge = challenges(challengeHost, [
    {
      text: 'On lesson data, follow application 1. Predict what three trees will vote for, then run three steps.',
      check: st => st.example && !st.repeat && st.selected === 0 && st.count >= 3 &&
        st.guess === String(Number(2 * st.third.totals[0] > 3)),
      why: 'Two of the first three trees vote for full repayment, so the combined prediction is full.',
    },
    {
      text: 'On lesson data, stop at the first step with zero mistakes on the eight past applications.',
      check: st => st.example && !st.repeat && st.count === 3 && st.third.errors === 0,
      why: 'The third tree supplies the votes that fix the two mistakes still present after two trees.',
    },
    {
      text: 'Follow application 1 on lesson data. Repeat the first sample and build at least three trees.',
      check: st => st.example && st.repeat && st.selected === 0 && st.count >= 3 && st.current.totals[0] === 0,
      why: 'All the trees use the same cards and make the same mistake, so adding votes leaves the prediction unchanged.',
    },
  ]);

  function makeDraws(useLesson) {
    return Array.from({ length: MAX_TREES }, (_, i) =>
      useLesson && i < FIXED.length ? FIXED[i] : START.map(() => rnd(1, START.length)));
  }

  function runTo(target) {
    while (history.length < target) {
      const i = history.length;
      const draw = draws[repeatInput.checked ? 0 : i];
      const tree = fitTree(data, draw);
      const previous = history[i - 1]?.totals ?? data.map(() => 0);
      const totals = tree.votes.map((vote, j) => previous[j] + vote);
      const errors = data.filter((row, j) => Number(2 * totals[j] > i + 1) !== row[4]).length;
      history.push({ ...tree, draw, totals, errors });
    }
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  function step() {
    if (count < limit) {
      count++;
      runTo(count);
    }
    if (count === limit) stop();
    render();
  }

  function togglePlay() {
    if (timer !== null) stop();
    else if (count < limit) timer = setInterval(step, 1000 / speed);
    render();
  }

  function changeSpeed() {
    speed = Number(speedInput.value);
    if (timer !== null) {
      stop();
      timer = setInterval(step, 1000 / speed);
    }
    render();
  }

  function changeLimit() {
    limit = Number(limitInput.value);
    count = Math.min(count, limit);
    if (count === limit) stop();
    render();
  }

  function reset() {
    stop();
    count = 0;
    answerInput.value = '';
    render();
  }

  function restartWithDraws(useLesson) {
    lessonDraws = useLesson;
    draws = makeDraws(useLesson);
    history = [];
    reset();
  }

  function freshDraws() {
    restartWithDraws(false);
  }

  function restoreLesson() {
    data = START.map(row => row.slice());
    selected = 0;
    repeatInput.checked = false;
    restartWithDraws(true);
  }

  function newData() {
    // Keep four of each outcome and vary which application answers go with each.
    const repayment = START.map(row => row[4]);
    for (let i = repayment.length - 1; i > 0; i--) {
      const j = rnd(0, i);
      [repayment[i], repayment[j]] = [repayment[j], repayment[i]];
    }
    data = repayment.map(full => [
      ...QUESTIONS.map(() => rnd(1, 4) === 1 ? 1 - full : full), full,
    ]);
    restartWithDraws(false);
  }

  function rebuildVotes() {
    stop();
    history = [];
    runTo(count);
    render();
  }

  function changeMode() {
    rebuildVotes();
  }

  function flipOutcome() {
    data[selected][4] = 1 - data[selected][4];
    rebuildVotes();
  }

  function svgText(x, y, value, color = C.ink, size = 14, anchor = 'middle') {
    return s('text', {
      x, y, fill: color, 'font-size': size, 'text-anchor': anchor,
      'font-family': 'Segoe UI, sans-serif',
    }, String(value));
  }

  function rule(x1, y1, x2, y2, color = C.line) {
    return s('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': 1.5 });
  }

  function drawPicture(current) {
    const parts = [];
    if (current) {
      parts.push(svgText(14, 20, `Sample for tree ${count}`, C.ink, 16, 'start'));
      current.draw.forEach((id, i) => {
        const x = 14 + i * 44, color = data[id - 1][4] ? C.cyan : C.pink;
        parts.push(s('rect', { x, y: 31, width: 38, height: 30, rx: 5, fill: C.bg, stroke: color,
          'stroke-width': id === selected + 1 ? 3 : 1 }),
        svgText(x + 19, 52, id, color, 17));
      });
    } else {
      parts.push(svgText(14, 28, 'Step draws the first eight cards.', C.muted, 16, 'start'));
    }

    const x = i => 40 + (i - 1) * 319 / Math.max(1, limit - 1);
    const vy = v => 196 - 87 * v;
    const ey = v => 343 - 11 * v;
    parts.push(
      svgText(14, 85, `Votes for application ${selected + 1}`, C.ink, 16, 'start'),
      svgText(14, 223, 'Dots: each tree', C.violet, 14, 'start'),
      svgText(365, 223, 'Line: mean vote', C.green, 14, 'end'),
      svgText(14, 247, 'Mistakes on the past applications', C.ink, 16, 'start'));
    [0, 0.5, 1].forEach(v => {
      parts.push(rule(40, vy(v), 364, vy(v)), svgText(30, vy(v) + 5, v, C.muted, 13, 'end'));
    });
    [0, 2, 4, 6, 8].forEach(v => {
      parts.push(rule(40, ey(v), 364, ey(v)), svgText(30, ey(v) + 5, v, C.muted, 13, 'end'));
    });

    const steps = history.slice(0, count);
    if (steps.length) {
      const traces = steps.map((st, i) => {
        const n = i + 1;
        return { x: x(n), meanY: vy(st.totals[selected] / n), errorY: ey(st.errors), voteY: vy(st.votes[selected]) };
      });
      const radius = limit > 25 ? 2.4 : 3.7;
      for (const [coord, color] of [['meanY', C.green], ['errorY', C.amber]]) {
        parts.push(s('polyline', {
          points: traces.map(p => `${p.x},${p[coord]}`).join(' '),
          fill: 'none', stroke: color, 'stroke-width': 2.5,
        }));
      }
      traces.forEach(p => {
        parts.push(s('circle', { cx: p.x, cy: p.voteY, r: radius + 1, fill: C.violet }),
          s('circle', { cx: p.x, cy: p.meanY, r: radius, fill: C.green }),
          s('circle', { cx: p.x, cy: p.errorY, r: radius, fill: C.amber }));
      });
    }
    const ticks = limit <= 5 ? Array.from({ length: limit }, (_, i) => i + 1) : [1, Math.ceil(limit / 2), limit];
    ticks.forEach(n => parts.push(svgText(x(n), 361, n, C.muted, 13)));
    parts.push(svgText(202, 382, 'Trees built', C.muted, 14));
    svg.replaceChildren(...parts);
    svg.setAttribute('aria-label', current
      ? `Tree ${count}: sample ${current.draw.join(', ')}. ${current.errors} past mistakes after combining votes.`
      : 'No trees built yet.');
  }

  function render() {
    const current = history[count - 1];
    drawPicture(current);
    limitLabel.textContent = `Tree limit ${limit}`;
    speedLabel.textContent = `${speed} ${speed === 1 ? 'step' : 'steps'} per second`;
    status.textContent = `Trees built ${count} of ${limit}`;
    playButton.textContent = timer === null ? 'Play' : 'Pause';
    playButton.disabled = count === limit;
    stepButton.disabled = count === limit;
    answerInput.disabled = count > 0;

    const actual = data[selected][4] ? 'full' : 'partial';
    note.textContent = `Application ${selected + 1} repaid ${actual === 'full' ? 'in full' : 'part of the loan'}.`;
    appButtons.forEach((button, i) => {
      button.setAttribute('aria-pressed', String(i === selected));
      button.setAttribute('aria-label', `Application ${i + 1}, ${data[i][4] ? 'full' : 'partial'} repayment`);
      button.classList.toggle('go', i === selected);
    });

    if (current) {
      const vote = current.votes[selected];
      const full = current.totals[selected];
      const oldFull = full - vote;
      const mean = full / count;
      const predicted = 2 * full > count ? 'full' : 'partial';
      fbox(formula, [
        `Tree ${count} asks about ${QUESTIONS[current.q].toLowerCase()}.`,
        `Weighted impurity ${fmt(current.impurity)}`,
        count > 1 ? `Old mean: ${oldFull} ÷ ${count - 1} = ${fmt(oldFull / (count - 1))}` : 'Old mean: no votes yet',
        `Add ${vote} to ${oldFull} full votes`,
        [`New mean: ${full} ÷ ${count} = ${fmt(mean)}`, C.green],
        [`Predict ${predicted} · actual ${actual}`, predicted === actual ? C.green : C.pink],
        [`Past mistakes: ${current.errors} of ${data.length}`, C.amber],
      ]);
    } else {
      fbox(formula, ['Mean vote = full votes ÷ trees', 'More than half votes full → predict full']);
    }

    challenge.update({
      count, selected, current, third: history[2], guess: answerInput.value,
      example: lessonDraws && data.every((row, i) => row.every((v, j) => v === START[i][j])),
      repeat: repeatInput.checked,
    });
  }

  render();
  return () => {
    stop();
    view.remove();
  };
}
