// 13.3.6 Try it: change clues, combine votes, and check the labels.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const rules = [
    { clue: 'Magnet', vote: 'Metal' },
    { clue: 'Bends', vote: 'Plastic' },
    { clue: 'Shine', vote: 'Metal' },
  ];
  const start = [
    { clues: [false, true, false], actual: 'Plastic' },
    { clues: [true, false, false], actual: 'Metal' },
    { clues: [false, true, true], actual: 'Plastic' },
    { clues: [true, false, true], actual: 'Metal' },
    { clues: [false, false, true], actual: 'Plastic' },
  ];
  const copyStart = () => start.map(item => ({ ...item, clues: item.clues.slice() }));
  let items = copyStart();
  let enabled = rules.map(() => true);
  let processed = 0;
  let selected = 0;
  let checked = false;
  let originalPhotos = true;
  let timer = null;

  const box = h('div');
  const challengeCard = h('div');
  const progress = h('p', { class: 'sim-note', role: 'status' });
  const table = h('table', {
    style: { width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.875rem' },
    'aria-label': 'Photo observations and temporary labels',
  });
  const chartTitle = h('div', { class: 'sim-note' });
  const chart = s('svg', {
    viewBox: '0 0 340 140', role: 'img',
    'aria-label': 'Label error rate by step',
  });
  const chartCard = h('div', {}, chartTitle, chart);

  function decide(item) {
    const votes = rules.map((rule, j) => enabled[j] && item.clues[j] ? rule.vote : null);
    const metal = votes.filter(vote => vote === 'Metal').length;
    const plastic = votes.filter(vote => vote === 'Plastic').length;
    const label = metal === plastic ? null : metal > plastic ? 'Metal' : 'Plastic';
    return { votes, metal, plastic, label, actual: item.actual };
  }

  const color = label => label === 'Metal' ? C.cyan : label === 'Plastic' ? C.violet : C.muted;
  const pct = (count, total) => `${fmt(100 * count / total)}%`;
  const speed = h('input', { type: 'range', min: '0.5', max: '2', step: '0.5', value: '1' });
  const speedValue = h('span', {}, '1×');
  const stepButton = btn('Step', step, 'go');
  const playButton = btn('Play', () => {
    if (timer !== null) {
      pause();
      draw();
    } else {
      step();
      if (processed < items.length) schedule();
    }
  });
  const checkButton = btn('Check labels', () => {
    checked = !checked;
    draw();
  });

  const ruleButtons = rules.map(({ clue, vote }, j) => btn(`${clue} → ${vote}`, () => {
    enabled[j] = !enabled[j];
    draw();
  }));

  function makeRow(i) {
    const id = `U${i + 1}`;
    const photo = btn(id, () => {
      selected = i;
      draw();
    });
    photo.style.padding = '0 0.3rem';
    const clueButtons = rules.map((_, j) => {
      const button = btn('', () => {
        items[i].clues[j] = !items[i].clues[j];
        selected = i;
        draw();
      });
      button.style.width = '100%';
      button.style.padding = '0 0.15rem';
      return button;
    });
    const result = h('td', { style: { lineHeight: '1.15' } });
    const truth = h('span', { style: { display: 'block', marginTop: '0.25rem' } });
    const label = h('span', {
      style: { display: 'inline-block', borderRadius: '0.25rem', padding: '0.15rem 0.2rem' },
    });
    result.append(label, truth);
    const row = h('tr', { style: { borderBottom: `1px solid ${C.line}` } },
      h('th', { scope: 'row' }, photo),
      clueButtons.map(button => h('td', { style: { padding: '0.22rem 0.12rem' } }, button)),
      result);
    return { id, row, photo, clueButtons, label, truth };
  }

  const rows = items.map((_, i) => makeRow(i));
  table.append(
    h('thead', {}, h('tr', {},
      ...['Photo', 'Magnet', 'Bends', 'Shine', 'Label'].map((name, j) => h('th', {
        scope: 'col', style: { width: ['14%', '20%', '18%', '18%', '30%'][j], paddingBottom: '0.35rem' },
      }, name)))),
    h('tbody', {}, rows.map(row => row.row)),
  );

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: vote on the material'),
    h('p', { class: 'sub' }, 'Tap Yes or No to change a clue. Turn rules on or off, then use Step or Play to label the photos.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, table, progress,
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Labelling controls' },
          stepButton, playButton, btn('Reset', reset), btn('New data', newData), checkButton),
        h('label', { class: 'sim-row' }, 'Speed', speed, speedValue),
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Voting rules' }, ruleButtons),
        chartCard),
      h('div', {},
        h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' }, challengeCard)))));

  const challenge = challenges(challengeCard, [
    {
      text: 'With the original photos, turn off Shine and label all five to leave U5 unlabelled.',
      check: st => st.originalPhotos && st.processed === 5 && !st.enabled[2] && !st.results[4].label,
      why: 'Without the Shine rule, U5 has no votes and stays unlabelled.',
    },
    {
      text: 'Give one photo a Metal vote and a Plastic vote so it stays unlabelled.',
      check: st => st.results.slice(0, st.processed).some(r => r.metal === 1 && r.plastic === 1),
      why: 'One vote for each material is a tie, so the photo receives no label.',
    },
    {
      text: 'With the original photos, label all five and check them to get 100% coverage but less than 75% accuracy.',
      check: st => st.originalPhotos && st.checked && st.assigned === 5 && st.correct / st.assigned < 0.75,
      why: 'Coverage counts every assigned label, while accuracy counts only the labels the worker confirms.',
    },
  ]);

  // The toolkit updates the active challenge on changes. Also check the
  // current state when the learner moves to a different challenge.
  function checkOnNavigation(event) {
    if (event.target.closest('.sim-ch-nav button')) checkChallenge();
  }
  challengeCard.addEventListener('click', checkOnNavigation);

  function pause() {
    clearTimeout(timer);
    timer = null;
  }

  function schedule() {
    timer = setTimeout(() => {
      step();
      if (processed < items.length) schedule();
    }, 1100 / Number(speed.value));
    draw();
  }

  function step() {
    if (processed >= items.length) return;
    selected = processed;
    processed++;
    if (processed === items.length) pause();
    draw();
  }

  speed.addEventListener('input', () => {
    speedValue.textContent = `${speed.value}×`;
    if (timer !== null) {
      pause();
      schedule();
    }
  });

  function restart() {
    pause();
    processed = 0;
    selected = 0;
    checked = false;
    enabled = rules.map(() => true);
    draw();
  }

  function reset() {
    items = copyStart();
    originalPhotos = true;
    restart();
  }

  function newData() {
    const previous = items.map(item => item.clues.map(Number).join('')).join('/');
    let next;
    do {
      next = start.map(() => {
        const metal = rnd(0, 2) === 0;
        return {
          actual: metal ? 'Metal' : 'Plastic',
          clues: [rnd(1, 6) <= (metal ? 4 : 1), rnd(1, 6) <= (metal ? 2 : 4), rnd(1, 6) <= (metal ? 4 : 2)],
        };
      });
    } while (next.map(item => item.clues.map(Number).join('')).join('/') === previous);
    items = next;
    originalPhotos = false;
    restart();
  }

  function state() {
    const results = items.map(decide);
    const assigned = results.slice(0, processed).filter(result => result.label);
    const correct = assigned.filter(result => result.label === result.actual).length;
    return { results, assigned: assigned.length, correct, originalPhotos, processed, enabled, checked };
  }

  function checkChallenge(st = state()) {
    challenge.update(st);
  }

  function drawChart(results) {
    chartCard.hidden = !checked;
    if (!checked) return;

    // Step k means k photos have had their votes counted. A tie adds
    // no label to the denominator. The curve starts at the first label.
    const left = 47, right = 326, top = 14, bottom = 104;
    const px = i => left + i * (right - left) / items.length;
    const py = rate => bottom - rate * (bottom - top);
    const caption = (x, y, value, anchor = 'middle') => s('text', {
      x, y, fill: C.ink, 'font-size': 12, 'text-anchor': anchor, 'font-family': 'Consolas, monospace',
    }, value);
    const marks = [];
    for (const rate of [0, 0.5, 1]) {
      marks.push(
        s('line', { x1: left, x2: right, y1: py(rate), y2: py(rate), stroke: C.line }),
        caption(left - 5, py(rate) + 4, pct(rate, 1), 'end'),
      );
    }
    for (let i = 0; i <= items.length; i++) marks.push(caption(px(i), bottom + 18, String(i)));
    marks.push(caption((left + right) / 2, bottom + 34, 'Labelling step'));

    let assigned = 0;
    let errors = 0;
    const points = [];
    results.slice(0, processed).forEach((result, i) => {
      if (result.label) {
        assigned++;
        if (result.label !== result.actual) errors++;
      }
      if (assigned) points.push([px(i + 1), py(errors / assigned)]);
    });
    if (points.length > 1) marks.push(s('polyline', {
      points: points.map(point => point.join(',')).join(' '),
      fill: 'none', stroke: C.pink, 'stroke-width': 2.5,
    }));
    for (const [cx, cy] of points) marks.push(s('circle', { cx, cy, r: 3.5, fill: C.pink }));
    chartTitle.textContent = assigned
      ? `Label error by step · ${errors} wrong ÷ ${assigned} assigned = ${pct(errors, assigned)}`
      : 'Label error appears after a photo receives a label.';
    chart.setAttribute('aria-label', chartTitle.textContent);
    chart.replaceChildren(...marks);
  }

  function draw() {
    const st = state();
    rows.forEach(({ id, row, photo, clueButtons, label, truth }, i) => {
      const result = st.results[i];
      const isSelected = selected === i;
      const hasRun = i < processed;
      row.style.background = isSelected ? C.bg : '';
      photo.setAttribute('aria-pressed', String(isSelected));
      clueButtons.forEach((button, j) => {
        const yes = items[i].clues[j];
        button.textContent = yes ? 'Yes' : 'No';
        button.style.color = yes ? C.cyan : C.ink;
        button.setAttribute('aria-pressed', String(yes));
        button.setAttribute('aria-label', `${id} ${rules[j].clue}: ${yes ? 'Yes' : 'No'}`);
      });
      label.textContent = hasRun ? result.label || 'Unlabelled' : 'Pending';
      label.style.color = color(result.label && hasRun ? result.label : null);
      label.style.border = result.label && hasRun ? `1px dashed ${color(result.label)}` : '1px solid transparent';
      truth.textContent = checked && hasRun && result.label ? `Worker: ${result.actual}` : '';
      truth.style.color = result.actual === result.label ? C.green : C.pink;
    });

    ruleButtons.forEach((button, j) => {
      const { clue, vote } = rules[j];
      button.textContent = `${clue} → ${vote} · ${enabled[j] ? 'On' : 'Off'}`;
      button.setAttribute('aria-pressed', String(enabled[j]));
      button.style.borderColor = enabled[j] ? color(vote) : C.muted;
    });
    playButton.textContent = timer === null ? 'Play' : 'Pause';
    playButton.disabled = processed === items.length;
    stepButton.disabled = processed === items.length || timer !== null;
    checkButton.disabled = st.assigned === 0 && !checked;
    checkButton.textContent = checked ? 'Hide checks' : 'Check labels';
    checkButton.setAttribute('aria-pressed', String(checked));
    progress.textContent = `Step ${processed} of ${items.length} · Photo U${selected + 1} selected`;

    const result = st.results[selected];
    const lines = [
      selected < processed ? `U${selected + 1} votes` : `U${selected + 1} vote preview`,
      ...rules.map(({ clue }, j) => [
        `${clue} → ${enabled[j] ? result.votes[j] || 'no vote' : 'rule off'}`, color(result.votes[j]),
      ]),
      [`Metal ${result.metal} · Plastic ${result.plastic}`, C.amber],
      [result.label ? `Temporary label → ${result.label}` : 'Equal votes → unlabelled', color(result.label)],
      [`Coverage = ${st.assigned} ÷ ${items.length} = ${pct(st.assigned, items.length)}`, C.cyan],
    ];
    if (checked) lines.push(st.assigned
      ? [`Accuracy = ${st.correct} ÷ ${st.assigned} = ${pct(st.correct, st.assigned)}`, C.green]
      : 'Accuracy needs an assigned label.');
    fbox(box, lines);
    drawChart(st.results);
    checkChallenge(st);
  }

  draw();
  return () => {
    pause();
    challengeCard.removeEventListener('click', checkOnNavigation);
  };
}
