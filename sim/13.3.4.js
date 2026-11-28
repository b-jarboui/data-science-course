// 13.3.4 Try it: add confident guesses as temporary labels.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const BLUE = '#7cbaff', ORANGE = '#fb923c';
  const lanes = ['Matte', 'Shiny', 'Mixed'];
  const training = [
    ...'ABCDEFG'.split('').map(id => ({ id, look: 'Matte', metal: false })),
    { id: 'H', look: 'Shiny', metal: false },
    { id: 'I', look: 'Mixed', metal: false },
    { id: 'J', look: 'Shiny', metal: true },
    { id: 'K', look: 'Shiny', metal: true },
    { id: 'L', look: 'Mixed', metal: true },
  ];
  const validation = [
    { id: 'V1', look: 'Matte', metal: false }, { id: 'V2', look: 'Matte', metal: false },
    { id: 'V3', look: 'Mixed', metal: false }, { id: 'V4', look: 'Shiny', metal: true },
  ];
  const pool = [
    { id: 'U1', look: 'Matte', metal: false }, { id: 'U2', look: 'Mixed', metal: true },
    { id: 'U3', look: 'Mixed', metal: false }, { id: 'U4', look: 'Shiny', metal: true },
    { id: 'U5', look: 'Shiny', metal: false },
  ];
  const example = { training, validation, pool };
  const cutoffs = [
    [1, 2, '50%'], [3, 5, '60%'], [2, 3, '2/3 (about 67%)'],
    [7, 10, '70%'], [3, 4, '75%'], [4, 5, '80%'], [9, 10, '90%'], [1, 1, '100%'],
  ];

  let data = example, accepted = [], lossHistory = [], last = null;
  let reviewed = false, timer = null, stopped = false;
  const material = metal => metal ? 'Metal' : 'Plastic';
  const ink = metal => metal ? ORANGE : BLUE;
  const percent = n => `${Math.round(n * 1000) / 10}%`;
  const errorText = n => (Math.round((n + Number.EPSILON) * 1000) / 1000).toFixed(3);

  const svg = s('svg', { viewBox: '0 0 420 543', role: 'img' });
  const box = h('div'), note = h('div', { class: 'sim-note', 'aria-live': 'polite' });
  const challengeArea = h('div');
  const cutoff = h('select', { onchange: reset }, cutoffs.map(([, , label], i) =>
    h('option', { value: i }, label)));
  cutoff.value = '2';
  const prediction = h('select');
  const speed = h('input', { type: 'range', min: 1, max: 5, value: 2, oninput: schedule });
  const stepButton = btn('Step', advance, 'go');
  const playButton = btn('Play', toggle);
  const checkButton = btn('Check temporary labels', () => { reviewed = true; draw(); });
  const row = (...children) => h('div', { class: 'sim-row', style: { alignItems: 'center' } }, ...children);
  const control = (label, element) => h('label', { class: 'sim-note', style: {
    display: 'inline-flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap', margin: 0,
  } }, label, element);
  [cutoff, prediction].forEach(element => Object.assign(element.style, {
    font: 'inherit', color: C.ink, background: C.bg, border: '1px solid ' + C.muted,
    borderRadius: '0.4rem', padding: '0.35rem 0.5rem', minHeight: '44px', maxWidth: '100%',
  }));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: Learn from unlabelled photos'),
    h('p', { class: 'sub' }, 'Step adds the most confident guess that meets the cutoff. Tied photos go in list order. Changing the cutoff starts a fresh run with the same photos.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        row(stepButton, playButton, btn('Reset', reset), control('Speed', speed)),
        row(control('Confidence cutoff', cutoff)),
        row(control('Predict the first photo', prediction)),
        row(checkButton, btn('New data', newData), btn('Lesson data', () => { data = example; reset(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengeArea)))));

  const chal = challenges(challengeArea, [
    {
      text: 'With lesson data and a cutoff of 2/3, predict the first photo, then press Step.',
      check: st => st.original && st.defaultCut && st.first?.id === st.first?.prediction && st.first?.id === 'U1',
      why: 'U1 goes first because all seven labelled matte photos are Plastic.',
    },
    {
      text: 'With lesson data, reach an error of about 0.078 in exactly two rounds.',
      check: st => st.original && st.round === 2 && errorText(st.loss) === '0.078',
      why: 'Adding U4 in round two moves the shiny prediction from 2/3 to 3/4, closer to the checked shiny photo.',
    },
    {
      text: 'With lesson data, set a cutoff that stops after round one with no drop in error.',
      check: st => st.original && st.stopped && st.round === 1 && st.loss === st.startLoss,
      why: 'A cutoff above 2/3 leaves only U1 eligible, and adding it keeps the chance of Metal for matte photos at zero.',
    },
    {
      text: 'With lesson data, finish three rounds and check the temporary labels to find a wrong guess.',
      check: st => st.original && st.round === 3 && st.reviewed && st.wrongIds.includes('U5'),
      why: 'U5 is shiny Plastic, so adding it as Metal strengthened a wrong guess even as the checking error fell.',
    },
  ]);

  function counts(list) {
    const result = Object.fromEntries(lanes.map(look => [look, { metal: 0, total: 0 }]));
    for (const item of data.training) {
      const group = result[item.look];
      group.total++;
      group.metal += Number(item.metal);
    }
    for (const item of list) {
      const group = result[item.look];
      group.total++;
      group.metal += Number(item.guess);
    }
    return result;
  }

  function loss(groups) {
    return data.validation.reduce((sum, item) => {
      const { metal, total } = groups[item.look];
      return sum + (metal / total - Number(item.metal)) ** 2;
    }, 0) / data.validation.length;
  }

  function candidates(groups) {
    const used = new Set(accepted.map(item => item.id));
    return data.pool.filter(item => !used.has(item.id)).map(item => {
      const { metal, total } = groups[item.look];
      // A tie between materials is resolved as Plastic at the 50% cutoff.
      const guess = metal * 2 > total;
      return { id: item.id, look: item.look, guess, winning: guess ? metal : total - metal, total };
    }).sort((a, b) => b.winning * a.total - a.winning * b.total || a.id.localeCompare(b.id));
  }

  function eligible(item) {
    const [numerator, denominator] = cutoffs[Number(cutoff.value)];
    return Boolean(item && item.winning * denominator >= item.total * numerator);
  }

  function pause() {
    clearInterval(timer);
    timer = null;
    playButton.textContent = 'Play';
  }

  function schedule() {
    if (timer === null) return;
    clearInterval(timer);
    timer = setInterval(advance, 1900 / Number(speed.value));
  }

  function toggle() {
    if (timer !== null) {
      pause();
      return;
    }
    if (stopped) return;
    timer = setInterval(advance, 1900 / Number(speed.value));
    playButton.textContent = 'Pause';
  }

  function reset() {
    pause();
    accepted = [];
    lossHistory = [loss(counts(accepted))];
    last = null;
    reviewed = false;
    stopped = false;
    prediction.replaceChildren(h('option', { value: '' }, 'Choose a photo'),
      ...data.pool.map(item => h('option', { value: item.id }, `${item.id} · ${item.look}`)));
    draw();
  }

  function newData() {
    const chance = { Matte: rnd(0, 4), Shiny: rnd(5, 9), Mixed: rnd(3, 7) };
    const randomAnswer = item => ({ ...item, metal: rnd(1, 10) <= chance[item.look] });
    const appearances = pool.map(item => item.look);
    for (let i = appearances.length - 1; i > 0; i--) {
      const j = rnd(0, i);
      [appearances[i], appearances[j]] = [appearances[j], appearances[i]];
    }
    data = {
      training: training.map(randomAnswer), validation: validation.map(randomAnswer),
      pool: pool.map((item, i) => randomAnswer({ ...item, look: appearances[i] })),
    };
    reset();
  }

  function advance() {
    if (stopped) return;
    const before = counts(accepted), [pick] = candidates(before);
    if (eligible(pick)) {
      const chosen = { ...pick, prediction: accepted.length === 0 ? prediction.value : '' };
      accepted.push(chosen);
      const after = counts(accepted);
      lossHistory.push(loss(after));
      last = { pick: chosen, before: before[pick.look], after: after[pick.look] };
      reviewed = false;
      stopped = !eligible(candidates(after)[0]);
    } else {
      stopped = true;
    }
    if (stopped) pause();
    draw();
  }

  function label(x, y, value, color = C.ink, size = 13, anchor = 'start') {
    return s('text', {
      x, y, fill: color, 'font-size': size, 'text-anchor': anchor, 'font-family': 'Consolas, monospace',
    }, value);
  }

  function line(x1, y1, x2, y2, stroke, width = 1) {
    return s('line', { x1, y1, x2, y2, stroke, 'stroke-width': width });
  }

  function tile(item, x, y, kind) {
    const temporary = kind === 'temporary';
    const pending = kind === 'pending';
    const metal = temporary ? item.guess : item.metal;
    const border = pending ? C.muted : ink(metal);
    const symbol = pending ? '?' : `${metal ? '■' : '○'}${temporary ? '' : ' ✓'}`;
    const result = [
      s('rect', { x, y, width: 39, height: 23, rx: 4, stroke: C.muted, fill: '#1a2446' }),
      s('rect', { x: x + 4, y: y + 5, width: 9, height: 13, rx: 2, fill: '#52648b' }),
    ];
    if (item.look !== 'Matte') result.push(line(x + 5, y + 17, x + 12, y + 7,
      item.look === 'Shiny' ? '#e6f8ff' : '#9ebdf4', 1.5));
    result.push(label(x + 25, y + 16, item.id, C.ink, 12, 'middle'),
      s('rect', { x, y: y + 27, width: 39, height: 18, rx: 9, fill: C.bg, stroke: border,
        'stroke-dasharray': temporary ? '3 2' : null }),
      label(x + 19.5, y + 40, symbol, border, 13, 'middle'));
    return result;
  }

  function draw() {
    const groups = counts(accepted), remaining = candidates(groups);
    const byId = new Map(remaining.map(item => [item.id, item]));
    const currentLoss = lossHistory.at(-1);
    const wrongIds = reviewed ? accepted.filter(item =>
      data.pool.find(photo => photo.id === item.id).metal !== item.guess).map(item => item.id) : [];
    const parts = [];
    lanes.forEach((look, i) => {
      const y = 21 + i * 76, { metal, total } = groups[look];
      parts.push(label(12, y, look), label(283, y, `${metal}/${total} Metal`, ORANGE, 13, 'end'),
        s('rect', { x: 295, y: y - 9, width: 111, height: 7, fill: C.line, rx: 3 }));
      if (metal) parts.push(s('rect', { x: 295, y: y - 9, width: 111 * metal / total, height: 7, fill: ORANGE, rx: 3 }));
      const human = data.training.filter(item => item.look === look);
      const temporary = accepted.filter(item => item.look === look);
      [...human, ...temporary].forEach((item, j) =>
        parts.push(...tile(item, 12 + j * 49, y + 8, j < human.length ? 'checked' : 'temporary')));
    });
    parts.push(label(12, 250, 'Waiting for a label'), label(407, 250, `Round ${accepted.length}`, C.green, 14, 'end'));

    data.pool.forEach((item, i) => {
      const x = 18 + i * 82, guess = byId.get(item.id);
      if (guess) {
        parts.push(...tile(item, x, 260, 'pending'),
          label(x + 19.5, 320, item.look, C.muted, 12, 'middle'),
          label(x + 19.5, 337, percent(guess.winning / guess.total), C.ink, 12, 'middle'));
        return;
      }
      const added = accepted.find(entry => entry.id === item.id);
      if (!reviewed) {
        parts.push(label(x + 19.5, 284, `${item.id} added`, C.muted, 12, 'middle'));
        return;
      }
      parts.push(...tile(item, x, 260, 'checked'),
        label(x + 19.5, 320, material(item.metal), ink(item.metal), 12, 'middle'),
        label(x + 19.5, 337, added.guess === item.metal ? 'Match' : 'Mismatch',
          added.guess === item.metal ? C.green : C.pink, 12, 'middle'));
    });

    parts.push(s('rect', { x: 8, y: 349, width: 404, height: 75, rx: 8, fill: C.bg, stroke: C.line }),
      label(18, 368, 'Separate checking photos', C.muted));
    data.validation.forEach((item, i) => {
      const x = 17 + 99 * i;
      parts.push(label(x, 389, `${item.id} ${item.look}`, C.ink, 12),
        label(x, 408, `${item.metal ? '■' : '○'} ${material(item.metal)} ✓`, ink(item.metal), 12));
    });

    // Anchor the error scale at zero and expand it when a random run needs more space.
    const topLoss = Math.max(0.10, Math.ceil(Math.max(...lossHistory) * 10) / 10);
    const chartX = i => 54 + i * 67, chartY = n => 516 - 54 * n / topLoss;
    parts.push(label(12, 447, 'Mean squared error'), label(407, 447, errorText(currentLoss), C.green, 14, 'end'));
    for (const value of [0, topLoss / 2, topLoss]) {
      parts.push(line(45, chartY(value), 407, chartY(value), C.line),
        label(39, chartY(value) + 4, value.toFixed(2), C.muted, 11, 'end'));
    }
    lossHistory.forEach((value, i) => {
      const x = chartX(i), y = chartY(value);
      if (i > 0) parts.push(line(chartX(i - 1), chartY(lossHistory[i - 1]), x, y, C.green, 2.5));
      parts.push(s('circle', { cx: x, cy: y, r: 4, fill: C.green }),
        label(x, 534, i === 0 ? 'Start' : `R${i}`, C.muted, 12, 'middle'));
    });
    svg.setAttribute('aria-label', `Round ${accepted.length}. ${data.training.length + accepted.length} learning photos. ` +
      `${remaining.length} waiting. Checking error ${errorText(currentLoss)}. Circle marks Plastic. Square marks Metal. Dashed tags are temporary.`);
    svg.replaceChildren(...parts);

    const formatGroup = ({ metal, total }) => `${metal}/${total} = ${percent(metal / total)}`;
    if (last) {
      const { pick, before, after } = last;
      const oldLoss = lossHistory.at(-2);
      fbox(box, [
        `Round ${accepted.length} · ${pick.id}, ${pick.look}`,
        [`Guess: ${material(pick.guess)} (${percent(pick.winning / pick.total)})`, ink(pick.guess)],
        `Chance of Metal before: ${formatGroup(before)}`,
        `Add one temporary ${material(pick.guess)} label`,
        `Chance of Metal now:    ${formatGroup(after)}`,
        [`Checking error: ${errorText(oldLoss)} → ${errorText(currentLoss)}`, C.green],
      ]);
    } else {
      fbox(box, [
        'Round 0 · Start',
        ...lanes.map(look => `${look}: ${formatGroup(groups[look])} Metal`),
        [`Checking error: ${errorText(currentLoss)}`, C.green],
      ]);
    }

    const best = remaining[0];
    const cutoffLabel = cutoffs[Number(cutoff.value)][2];
    const count = `${data.training.length + accepted.length} learning photos · ${remaining.length} waiting.`;
    const stopText = !best ? 'Every waiting photo has a temporary label.'
      : `Stopped. The highest remaining confidence, ${percent(best.winning / best.total)}, is below ${cutoffLabel}.`;
    const auditText = wrongIds.length ? ` Worker found a mismatch on ${wrongIds.join(', ')}.`
      : reviewed ? ' Every temporary label matches the worker’s check.' : '';
    note.textContent = `${count} ${stopped ? stopText : 'Dashed tags show temporary labels.'}${auditText}`;
    stepButton.disabled = stopped;
    playButton.disabled = stopped;
    prediction.disabled = stopped || accepted.length > 0;
    checkButton.disabled = accepted.length === 0 || reviewed;
    updateChallenge();
  }

  function updateChallenge() {
    chal.update({
      original: data === example, defaultCut: cutoff.value === '2', first: accepted[0],
      round: accepted.length, loss: lossHistory.at(-1), startLoss: lossHistory[0], stopped, reviewed,
      wrongIds: reviewed ? accepted.filter(entry =>
        data.pool.find(item => item.id === entry.id).metal !== entry.guess).map(entry => entry.id) : [],
    });
  }

  // Recheck the current run when the learner uses the toolkit's challenge navigation.
  const controller = new AbortController();
  challengeArea.addEventListener('click', updateChallenge, { signal: controller.signal });
  reset();
  return () => {
    pause();
    controller.abort();
  };
}
