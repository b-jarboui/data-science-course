// 13.2.6 Try it: compare the cost of keeping a tree with the cost of pruning it.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const PARTIAL = '#ffab6b';
  const START = [
    [false, true, true, true], [true, false, true, true],
    [true, true, false, true], [true, true, true, true],
    [true, false, false, false], [false, true, false, false],
    [false, false, true, false], [false, false, false, false]
  ].map(([income, savings, previous, full], index) => ({ id: index + 1, income, savings, previous, full }));
  const QUESTIONS = [
    { side: 'yes', name: 'Prune the steady-income branch' },
    { side: 'no', name: 'Prune the other income branch' },
    { side: 'all', name: 'Remove the steady-income question' }
  ];
  const fresh = () => START.map(row => ({ ...row }));
  const costText = cost => (cost / 10).toFixed(1);
  let data = fresh(), penalty = 6, fixed = true;
  let tree, history, last, timer = null, forecast = '';

  const svg = s('svg', {
    viewBox: '0 0 400 383', role: 'group',
    'aria-label': 'Decision tree and cost by step. Select an application to change its recorded outcome.'
  });
  const formula = h('div');
  const status = h('div', { class: 'sim-note', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
  const challengeHost = h('div');
  const stepButton = btn('Step', () => step(), 'go');
  const playButton = btn('Play', () => {
    if (timer === null) startPlaying();
    else { pause(); draw(); }
  });
  const speed = h('input', { type: 'range', min: 1, max: 5, step: 1, value: 3, oninput: () => {
    if (timer !== null) { pause(); startPlaying(); }
  } });
  const penaltyLabel = h('span');
  const penaltyInput = h('input', { type: 'range', min: 0, max: 30, step: 1, value: 6, oninput: () => {
    penalty = Number(penaltyInput.value);
    restart();
  } });
  const prediction = h('select', { onchange: () => {
    forecast = prediction.value;
    draw();
  } },
  h('option', { value: '' }, 'Choose…'),
  h('option', { value: '1' }, '1 leaf'),
  h('option', { value: '2' }, '2 leaves'),
  h('option', { value: '4' }, '4 leaves'),
  h('option', { value: '6' }, '6 leaves'));
  const reset = btn('Reset', () => {
    data = fresh();
    fixed = true;
    penalty = 6;
    penaltyInput.value = '6';
    restart();
  });
  const newData = btn('New data', () => {
    // Shuffle question answers between application numbers. Keep the same paths
    // occupied so every leaf can be tested, and draw fresh recorded outcomes.
    const paths = fresh();
    for (let index = paths.length - 1; index > 0; index--) {
      const other = rnd(0, index);
      [paths[index], paths[other]] = [paths[other], paths[index]];
    }
    const first = rnd(0, 7);
    const second = (first + rnd(1, 7)) % 8;
    data = paths.map((path, index) => ({
      ...path,
      id: index + 1,
      full: index === first || (index !== second && rnd(0, 1) === 1)
    }));
    fixed = false;
    restart();
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: prune a decision tree'),
    h('p', { class: 'sub' }, 'Try each cut and compare its cost with the tree you have. Tap a numbered card to change what that borrower repaid.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row' },
          h('label', {}, penaltyLabel, ' ', penaltyInput), h('label', {}, 'Speed ', speed)),
        h('div', { class: 'sim-row' }, stepButton, playButton, reset, newData),
        h('div', { class: 'sim-row' }, h('label', {}, 'Predict the final number of leaves ', prediction))),
      h('div', {}, h('div', { class: 'sim-card' }, formula, status),
        h('div', { class: 'sim-card' }, challengeHost)))));

  const chal = challenges(challengeHost, [
    {
      text: 'With the original data and a penalty of 0.6, reach a cost of 3.2 in two steps.',
      check: state => state.fixed && state.penalty === 6 && state.step === 2 && state.cost === 32,
      why: 'The two cuts save 2.4 in leaf costs and add 2 in mistakes.'
    },
    {
      text: 'Reset, set the penalty to 0.4, then press Play and keep all six leaves.',
      check: state => state.fixed && state.penalty === 4 && state.done && state.leaves === 6,
      why: 'Each two-leaf saving is worth only 0.8, and the cut adds one mistake.'
    },
    {
      text: 'Reset, set the penalty to 2.5, predict how many leaves will remain, then press Play.',
      check: state => state.fixed && state.penalty === 25 && state.done && state.forecast === String(state.leaves),
      why: 'At 2.5 per leaf, going from two leaves to one saves more than the two extra mistakes cost.'
    }
  ]);

  function evaluate(shape) {
    function leaf(rows) {
      const full = rows.filter(row => row.full).length * 2 > rows.length;
      return { rows, full };
    }
    function split(rows, question, yes, no) {
      const yesRows = rows.filter(row => row[question]);
      return { question, yes: yes(yesRows), no: no(rows.filter(row => !row[question])) };
    }
    const previous = rows => split(rows, 'previous', leaf, leaf);
    const steady = rows => shape.yes ? leaf(rows) : split(rows, 'savings', leaf, previous);
    const other = rows => shape.no ? leaf(rows) : split(rows, 'savings', previous, leaf);
    const diagram = shape.all ? leaf(data) : split(data, 'income', steady, other);
    const leaves = [];
    function collect(node) {
      if (node.rows) leaves.push(node);
      else { collect(node.yes); collect(node.no); }
    }
    collect(diagram);
    const mistakes = leaves.reduce((total, node) => total + node.rows.filter(row => row.full !== node.full).length, 0);
    return { diagram, leaves: leaves.length, mistakes, cost: mistakes * 10 + penalty * leaves.length };
  }

  function pause() {
    clearInterval(timer);
    timer = null;
  }

  function restart() {
    pause();
    tree = { yes: false, no: false, all: false };
    last = null;
    history = [{ kept: evaluate(tree).cost }];
    forecast = '';
    prediction.value = '';
    draw();
  }

  function startPlaying() {
    if (history.length > QUESTIONS.length) return;
    timer = setInterval(step, 2700 - Number(speed.value) * 350);
    draw();
  }

  function step() {
    const move = QUESTIONS[history.length - 1];
    if (!move) return;
    const next = { ...tree, [move.side]: true };
    const old = evaluate(tree);
    const trial = evaluate(next);
    const accepted = trial.cost < old.cost;
    if (accepted) tree = next;
    history.push({ kept: accepted ? trial.cost : old.cost, rejected: accepted ? null : trial.cost });
    last = { move, old, trial, accepted };
    if (history.length > QUESTIONS.length) pause();
    draw();
  }

  function toggle(id) {
    const row = data.find(item => item.id === id);
    row.full = !row.full;
    fixed = data.every((item, index) => Object.keys(START[index]).every(key => item[key] === START[index][key]));
    restart();
  }

  function text(x, y, value, color = C.ink, size = 13, anchor = 'middle') {
    return s('text', {
      x, y, fill: color, 'text-anchor': anchor, 'font-size': size, 'font-family': 'Consolas, monospace'
    }, value);
  }

  function line(x1, y1, x2, y2, stroke, width = 1.5, dash) {
    return s('line', { x1, y1, x2, y2, stroke, 'stroke-width': width, 'stroke-dasharray': dash });
  }

  function panel(x, y, width, height, color, radius = 7) {
    return s('rect', { x, y, width, height, rx: radius, fill: C.bg, stroke: color, 'stroke-width': 1.5 });
  }

  function treePicture(diagram, parts) {
    const branches = [], nodes = [];
    const slots = [38, 103, 168, 232, 297, 362];
    const names = { income: 'Steady income?', savings: 'Savings?', previous: 'Repaid before?' };

    function connect(x, y, x2, y2, answer) {
      const ey = y2 - 13;
      const mx = (x + x2) / 2;
      const my = (y + 12 + ey) / 2;
      branches.push(line(x, y + 12, x2, ey, C.cyan),
        panel(mx - 12, my - 8, 24, 16, C.line), text(mx, my + 4, answer, C.ink, 11));
    }

    function drawNode(node, first, count, depth) {
      const x = (slots[first] + slots[first + count - 1]) / 2;
      if (!node.rows) {
        const y = [27, 82, 136][depth];
        const yesCount = node.question === 'income' ? 3 : (node.yes.rows ? 1 : 2);
        const yes = drawNode(node.yes, first, yesCount, depth + 1);
        const no = drawNode(node.no, first + yesCount, count - yesCount, depth + 1);
        connect(x, y, yes.x, yes.y, 'Yes');
        connect(x, y, no.x, no.y, 'No');
        const width = node.question === 'income' ? 118 : 100;
        nodes.push(panel(x - width / 2, y - 12, width, 24, C.cyan), text(x, y + 4, names[node.question], C.cyan, 12));
        return { x, y };
      }

      const y = 192;
      const color = node.full ? C.cyan : PARTIAL;
      nodes.push(panel(x - 30, y - 12, 60, 24, color), text(x, y + 4, node.full ? 'Full' : 'Partial', color, 12));
      node.rows.forEach((row, index) => {
        const cx = x + (index - (node.rows.length - 1) / 2) * (count === 6 ? 37 : 30);
        const ink = row.full ? C.cyan : PARTIAL;
        const wrong = row.full !== node.full;
        const card = s('g', {
          role: 'button', tabindex: 0, 'data-application': row.id, style: 'cursor:pointer',
          'aria-label': `Application ${row.id}, ${row.full ? 'full' : 'partial'} repayment, ${wrong ? 'wrong' : 'correct'} prediction. Change recorded repayment.`
        },
        s('rect', { x: cx - 15, y: 207, width: 30, height: 48, fill: 'transparent' }),
        panel(cx - 13, 210, 26, 41, wrong ? C.pink : ink),
        text(cx, 225, row.id, C.ink, 15),
        row.full
          ? s('circle', { cx, cy: 239, r: 7, fill: ink })
          : s('rect', { x: cx - 7, y: 232, width: 14, height: 14, rx: 1, fill: ink }),
        text(cx, 243, row.full ? '✓' : '−', C.bg, 11));
        card.addEventListener('click', () => toggle(row.id));
        card.addEventListener('keydown', event => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          toggle(row.id);
        });
        nodes.push(card);
      });
      return { x, y };
    }

    drawNode(diagram, 0, 6, 0);
    if (diagram.rows) nodes.push(text(200, 140, 'All applications in one leaf', C.ink, 15));
    parts.push(...branches, ...nodes,
      text(118, 272, '✓ Full    − Partial', C.ink, 12),
      text(294, 272, 'Pink outline = mistake', C.pink, 12));
  }

  function costPicture(parts) {
    const all = history.flatMap(point => point.rejected == null ? [point.kept] : [point.kept, point.rejected]);
    const lo = Math.min(...all);
    const hi = Math.max(lo + 8, ...all);
    const xp = i => 63 + i * 92;
    const yp = cost => 342 - (cost - lo) / (hi - lo) * 35;
    parts.push(text(200, 292, 'Cost by step', C.ink, 13), line(30, 351, 373, 351, C.line));
    for (let i = 0; i <= QUESTIONS.length; i++) {
      parts.push(text(xp(i), 369, i, C.muted, 12));
    }
    history.forEach((point, index) => {
      const x = xp(index);
      const y = yp(point.kept);
      if (index) parts.push(line(xp(index - 1), yp(history[index - 1].kept), x, y, C.cyan, 2));
      parts.push(s('circle', { cx: x, cy: y, r: 4, fill: C.cyan }), text(x, y - 8, costText(point.kept), C.cyan, 12));
      if (point.rejected != null) {
        const rejectedY = yp(point.rejected);
        const labelY = Math.min(y, rejectedY) - 8;
        parts.push(line(x, y, x, rejectedY, C.pink, 1.5, '3 3'),
          s('circle', { cx: x, cy: rejectedY, r: 5, fill: 'none', stroke: C.pink, 'stroke-width': 1.5 }),
          text(x + 8, labelY, `${costText(point.rejected)} ×`, C.pink, 11, 'start'));
      }
    });
  }

  function draw() {
    const current = evaluate(tree);
    const iteration = history.length - 1;
    const done = iteration === QUESTIONS.length;
    const retainedFocus = svg.contains(document.activeElement) ? document.activeElement.dataset.application : null;
    const parts = [s('rect', { width: 400, height: 383, rx: 10, fill: C.bg })];
    for (let x = 20; x < 400; x += 20) parts.push(line(x, 0, x, 383, C.line, 0.45));
    for (let y = 20; y < 383; y += 20) parts.push(line(0, y, 400, y, C.line, 0.45));
    treePicture(current.diagram, parts);
    costPicture(parts);
    svg.replaceChildren(...parts);
    if (retainedFocus) svg.querySelector(`[data-application="${retainedFocus}"]`)?.focus();

    penaltyLabel.textContent = `Penalty per leaf ${fmt(penalty / 10)}`;
    penaltyInput.setAttribute('aria-valuetext', fmt(penalty / 10));
    prediction.disabled = iteration > 0;
    stepButton.disabled = done;
    playButton.disabled = done;
    playButton.textContent = timer === null ? 'Play' : 'Pause';

    const calculation = result => `${result.mistakes} + ${fmt(penalty / 10)} × ${result.leaves} = ${costText(result.cost)}`;
    if (last) {
      const delta = last.trial.cost - last.old.cost;
      const change = `${delta < 0 ? '−' : '+'}${costText(Math.abs(delta))}`;
      fbox(formula, [
        `Step ${iteration} of ${QUESTIONS.length}`,
        last.move.name,
        `Before: ${calculation(last.old)}`,
        `Trial:  ${calculation(last.trial)}`,
        `Cost change: ${change}`,
        [`${last.accepted ? 'Keep the cut' : 'Keep the old tree'} · cost ${costText(current.cost)}`,
          last.accepted ? C.green : C.amber]
      ]);
    } else {
      fbox(formula, [
        `Step 0 of ${QUESTIONS.length}`,
        'Mistakes + penalty × leaves',
        [`Starting cost: ${calculation(current)}`, C.cyan]
      ]);
    }

    const result = `${current.leaves} ${current.leaves === 1 ? 'leaf' : 'leaves'} and ${current.mistakes} ${current.mistakes === 1 ? 'mistake' : 'mistakes'}.`;
    const predicted = done && forecast ? ` Your prediction: ${forecast}.` : '';
    status.textContent = done ? `Finished with ${result}${predicted}` : `Current tree: ${result}`;
    chal.update({ fixed, penalty, step: iteration, cost: current.cost, leaves: current.leaves, done, forecast });
  }

  restart();
  return pause;
}
