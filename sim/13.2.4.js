// 13.2.4 Try it: compare questions and grow a tree one split at a time.
const QUESTIONS = ['Steady income', 'Savings', 'Previous loan repaid', 'Requested reminders'];
const LETTERS = ['A', 'B', 'C', 'D'];
// Steady income, savings, previous loan repaid, requested reminders, full repayment.
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

export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const fmt = value => String(Number(value.toFixed(4)));
  const fullCount = ids => ids.reduce((n, id) => n + data[id][4], 0);
  function gini(ids) {
    if (!ids.length) return 0;
    const p = fullCount(ids) / ids.length;
    return 2 * p * (1 - p);
  }
  const weighted = groups => groups.reduce((sum, g) => sum + g.ids.length / data.length * gini(g.ids), 0);

  let data = START.map(row => row.slice());
  let leaves = [], history = [], last = null, depth = 3, preview = -1;
  let timer = null, playing = false, draws = 0, different = 0;
  let runLength = 0, forecast = null;

  const cards = h('div');
  const plot = s('svg', { viewBox: '0 0 380 198', role: 'img', 'aria-label': 'Weighted impurity by tree split' });
  const box = h('div');
  const note = h('p', { class: 'sim-note' });
  const iteration = h('div', { class: 'sim-note', 'aria-live': 'polite' });
  const drawNote = h('div', { class: 'sim-note', 'aria-live': 'polite' });
  const challengeRoot = h('div');
  const question = h('select', { class: 'sim-btn', 'aria-label': 'Question to compare', onchange: event => {
    preview = Number(event.target.value);
    draw();
  } },
    h('option', { value: '-1' }, 'Choose a question'),
    LETTERS.map((letter, i) => h('option', { value: i }, `${letter} · ${QUESTIONS[i]}`)));
  const speed = h('input', { type: 'range', min: 1, max: 6, value: 3, 'aria-label': 'Play speed', oninput: () => {
    speedValue.textContent = speed.value;
    if (playing) schedule();
  } });
  const speedValue = h('output', {}, '3');
  const depthInput = h('select', { class: 'sim-btn', 'aria-label': 'Maximum tree depth', onchange: event => {
    depth = Number(event.target.value);
    reset();
  } }, [0, 1, 2, 3, 4].map(i => h('option', { value: i, selected: i === depth }, String(i))));

  const stepButton = btn('Step', () => advance(), 'go');
  const playButton = btn('Play', () => {
    if (playing) {
      pause();
      draw();
    } else if (nextLeaf() !== -1) {
      playing = true;
      advance();
      if (playing) schedule();
    }
  });
  const drawButton = btn('Draw 200 pairs', drawPairs);
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: split impurity'),
    h('p', { class: 'sub' },
      'Compare a question for the outlined group. Step uses the question with the greatest reduction. Tap a card to change its repayment outcome and start the tree again.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        cards,
        h('div', { class: 'sim-note' }, 'F = Full repayment · P = Partial repayment'),
        h('div', { class: 'sim-row' }, question, drawButton),
        drawNote,
        h('div', { class: 'sim-row' }, stepButton, playButton, btn('Reset', reset)),
        h('div', { class: 'sim-row' },
          h('label', { class: 'sim-row' }, 'Speed', speed, speedValue),
          h('label', { class: 'sim-row' }, 'Maximum depth', depthInput)),
        h('div', { class: 'sim-row' }, btn('New data', newData), btn('Original data', restore)),
        iteration,
        plot),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengeRoot)))));

  function compare(leaf, k) {
    const yes = leaf.ids.filter(id => data[id][k]);
    const no = leaf.ids.filter(id => !data[id][k]);
    if (!yes.length || !no.length) return null;
    const children = [[yes, 'yes'], [no, 'no']].map(([ids, answer]) => ({
      ids, path: [...leaf.path, `${LETTERS[k]} ${answer}`], used: [...leaf.used, k],
    }));
    const old = gini(leaf.ids);
    const after = children.reduce((sum, child) => sum + child.ids.length / leaf.ids.length * gini(child.ids), 0);
    return { k, children, old, after, gain: old - after };
  }
  function bestSplit(leaf) {
    return QUESTIONS.reduce((best, _, k) => {
      if (leaf.used.includes(k)) return best;
      const candidate = compare(leaf, k);
      return candidate && (!best || candidate.gain > best.gain + 1e-10) ? candidate : best;
    }, null);
  }
  function nextLeaf() {
    return leaves.findIndex(leaf => leaf.path.length < depth && gini(leaf.ids) > 0 && bestSplit(leaf));
  }
  function pause() {
    clearTimeout(timer);
    timer = null;
    playing = false;
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!root.isConnected) {
        pause();
        return;
      }
      advance();
      if (playing) schedule();
    }, 1900 - 270 * Number(speed.value));
  }

  function reset() {
    pause();
    leaves = [{ ids: data.map((_, i) => i), path: [], used: [] }];
    history = [weighted(leaves)];
    last = null;
    forecast = null;
    runLength = 0;
    preview = -1;
    question.value = '-1';
    draws = 0;
    different = 0;
    draw();
  }
  function restore() {
    data = START.map(row => row.slice());
    reset();
  }
  function shuffled(items) {
    const list = items.slice();
    for (let i = list.length - 1; i > 0; i--) {
      const j = rnd(0, i);
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }
  function newData() {
    const patterns = shuffled(Array.from({ length: 16 }, (_, i) => i)).slice(0, START.length);
    const count = rnd(2, 6);
    const outcomes = shuffled(patterns.map((_, i) => Number(i < count)));
    data = patterns.map((bits, i) => [...QUESTIONS.map((_, k) => (bits >> k) & 1), outcomes[i]]);
    reset();
  }
  function advance() {
    const index = nextLeaf();
    if (index === -1) {
      pause();
      draw();
      return;
    }
    const leaf = leaves[index];
    const split = bestSplit(leaf);
    if (history.length === 1) {
      forecast = preview;
      runLength = depth;
    }
    const before = history.at(-1);
    leaves.splice(index, 1, ...split.children);
    const after = weighted(leaves);
    last = { ...split, leaf, before, after };
    history.push(after);
    preview = -1;
    question.value = '-1';
    draws = 0;
    different = 0;
    if (nextLeaf() === -1) pause();
    draw();
  }
  function drawPairs() {
    const leaf = leaves[nextLeaf()] ?? leaves[0];
    const lastIndex = leaf.ids.length - 1;
    for (let i = 0; i < 200; i++) {
      const a = leaf.ids[rnd(0, lastIndex)];
      const b = leaf.ids[rnd(0, lastIndex)];
      different += Number(data[a][4] !== data[b][4]);
    }
    draws += 200;
    draw();
  }

  const chal = challenges(challengeRoot, [
    {
      text: 'On the original data, compare D. What reduction do you see?',
      check: st => st.original && st.iteration === 0 && st.preview === 3 && st.previewGain === 0,
      why: 'Both groups are still evenly mixed, so D leaves impurity at 0.5.',
    },
    {
      text: 'On the original data, select the question you think wins the first split. Then press Step.',
      check: st => st.original && st.iteration === 1 && st.forecast === 0 && st.lastQuestion === 0,
      why: 'A, B and C give the same reduction, so A wins because it comes first.',
    },
    {
      text: 'On the original data, use maximum depth 1 and run the tree. Does the impurity reach zero?',
      check: st => st.original && st.runLength === 1 && st.finished && st.loss === 0.375,
      why: 'With one question on each path, both groups still have a mix of outcomes.',
    },
    {
      text: 'On the original data, find the smallest maximum depth that reaches zero impurity.',
      check: st => st.original && st.runLength === 3 && st.loss === 0 && st.iteration === 5,
      why: 'Depth 3 allows the five splits that leave every final group with matching outcomes.',
    },
  ]);

  function drawCards(active) {
    cards.replaceChildren(...leaves.map((leaf, i) => {
      const selected = i === active;
      return h('div', { style: {
        border: `1px solid ${selected ? C.amber : C.line}`, borderRadius: '.65rem',
        padding: '.5rem', marginBottom: '.5rem',
      } },
      h('div', {}, `${leaf.path.join(' · ') || 'All applications'} · Gini ${fmt(gini(leaf.ids))}`),
      h('div', { class: 'sim-row', style: { marginTop: '.35rem' } }, leaf.ids.map(id => {
        const full = data[id][4] === 1;
        const change = btn(`${id + 1} · ${full ? 'F' : 'P'}`, () => {
          data[id][4] = Number(!full);
          reset();
          cards.querySelector(`button[data-id="${id}"]`)?.focus();
        });
        change.style.borderColor = full ? C.cyan : C.pink;
        change.style.color = full ? C.cyan : C.pink;
        change.setAttribute('data-id', String(id));
        change.setAttribute('aria-label', `Application ${id + 1}, ${full ? 'full' : 'partial'} repayment. Change outcome`);
        return change;
      })));
    }));
  }

  function drawPlot() {
    const left = 46, right = 357, top = 35, bottom = 151;
    const slots = Math.max(5, history.length - 1);
    const x = i => left + (right - left) * i / slots;
    const y = v => bottom - (bottom - top) * v / 0.5;
    const text = (value, x, y, anchor = 'middle', color = C.ink) => s('text', {
      x, y, fill: color, 'text-anchor': anchor, 'font-size': 14, 'font-family': 'Consolas, monospace',
    }, value);
    const grid = [0, 0.125, 0.25, 0.375, 0.5].flatMap(v => [
      s('line', { x1: left, x2: right, y1: y(v), y2: y(v), stroke: C.line }),
      text(fmt(v), left - 5, y(v) + 4, 'end'),
    ]);
    plot.replaceChildren(
      text('Weighted impurity', left, 19, 'start'),
      ...grid,
      s('polyline', { points: history.map((v, i) => `${x(i)},${y(v)}`).join(' '),
        fill: 'none', stroke: C.green, 'stroke-width': 2.5 }),
      ...history.flatMap((v, i) => [
        s('circle', { cx: x(i), cy: y(v), r: 4, fill: i === history.length - 1 ? C.amber : C.green }),
        text(String(i), x(i), bottom + 18),
      ]),
      text('Tree split', (left + right) / 2, 191),
    );
    plot.setAttribute('aria-label', `Weighted impurity by tree split. ${history.map(fmt).join(', ')}`);
  }

  function draw() {
    const active = nextLeaf();
    const leaf = leaves[active] ?? leaves[0];
    const loss = history.at(-1);
    const iterationCount = history.length - 1;
    const allowed = preview >= 0 && !leaf.used.includes(preview);
    const candidate = allowed ? compare(leaf, preview) : null;
    stepButton.disabled = active === -1;
    playButton.disabled = active === -1;
    playButton.textContent = playing ? 'Pause' : 'Play';
    question.disabled = active === -1;
    [...question.options].slice(1).forEach((option, k) => { option.disabled = leaf.used.includes(k); });
    drawButton.textContent = draws ? 'Draw 200 more pairs' : 'Draw 200 pairs';
    iteration.textContent = `Iteration ${iterationCount} · Weighted impurity ${fmt(loss)}`;
    drawNote.textContent = draws
      ? `${different} of ${draws} pairs differ (${fmt(different / draws)}). Expected chance: ${fmt(gini(leaf.ids))}.`
      : 'Each pair comes from the outlined group, or the first group when the tree stops. Each card goes back before the next pick.';
    drawCards(active);
    drawPlot();

    const lines = [];
    if (last) {
      const [yes, no] = last.children;
      lines.push(
        `Split ${iterationCount} · ${LETTERS[last.k]} ${QUESTIONS[last.k]}`,
        `Group before: ${fmt(last.old)}`,
        `Yes: ${yes.ids.length} cards · Gini ${fmt(gini(yes.ids))}`,
        `No: ${no.ids.length} cards · Gini ${fmt(gini(no.ids))}`,
        `Group after: ${fmt(last.after)}`,
        `Tree before: ${fmt(last.before)}`,
        `Tree reduction: ${fmt(last.before - last.after)}`,
        [`Tree after: ${fmt(last.after)}`, C.green],
      );
    } else {
      const n = leaf.ids.length;
      const full = fullCount(leaf.ids);
      lines.push('Starting group', `Full: ${full}/${n} · Partial: ${n - full}/${n}`,
        [`1 − (${full}/${n})² − (${n - full}/${n})² = ${fmt(loss)}`, C.cyan]);
    }

    if (active !== -1 && preview !== -1) {
      lines.push('', [`Compare ${LETTERS[preview]} · ${QUESTIONS[preview]}`, C.amber]);
      if (candidate) {
        const [yes, no] = candidate.children;
        lines.push(
          `Yes: ${yes.ids.length}/${leaf.ids.length} × ${fmt(gini(yes.ids))}`,
          `No: ${no.ids.length}/${leaf.ids.length} × ${fmt(gini(no.ids))}`,
          `Group before: ${fmt(candidate.old)}`,
          `Weighted result: ${fmt(candidate.after)}`,
          [`Reduction in this group: ${fmt(candidate.gain)}`, C.amber],
        );
      } else {
        lines.push('Everyone in this group gives the same answer.');
      }
    }
    fbox(box, lines);
    note.textContent = active !== -1
      ? 'Step splits the outlined group. When reductions tie, the earlier letter wins.'
      : loss === 0
        ? 'Every final group has matching repayment outcomes.'
        : 'The tree stopped with mixed groups. Increase the maximum depth to try more questions.';
    chal.update({
      original: data.every((row, i) => row.every((value, k) => value === START[i][k])),
      iteration: iterationCount, preview, previewGain: candidate?.gain, forecast,
      lastQuestion: last?.k, runLength, finished: active === -1, loss,
    });
  }

  reset();
  return pause;
}
