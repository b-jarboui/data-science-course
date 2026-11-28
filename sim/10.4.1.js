// 10.4.1 Try it: change appointment outcomes and compare the fitted rules.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const RED = '#fb646e';
  const ROW_SIZE = 10;
  const START = [1, 1, 3, 5];
  const ROWS = ['Text AM', 'Text PM', 'No text AM', 'No text PM'];
  const MODELS = [
    { name: 'A', color: C.amber, rows: [[0, 1, 2, 3]], labels: ['Everyone'] },
    { name: 'B', color: C.cyan, rows: [[0, 1], [2, 3]], labels: ['Text', 'No text'] },
    { name: 'C', color: C.pink, rows: [[0], [1], [2], [3]], labels: ROWS },
    { name: 'Saturated', color: C.green },
  ];
  const initialData = () => START.map(missed =>
    Array.from({ length: ROW_SIZE }, (_, col) => col < missed));
  let data = initialData();
  let selected = 0;
  let view = 'dots';

  const formula = h('div');
  const note = h('div', { class: 'sim-note', role: 'status' });
  const challengeHost = h('div');
  const svg = s('svg', { viewBox: '0 0 360 232', role: 'img' });
  const chart = h('div', { hidden: true }, svg);
  const dotsTab = btn('Appointments', () => { view = 'dots'; draw(); });
  const barsTab = btn('Deviance bars', () => { view = 'bars'; draw(); });
  const modelButtons = MODELS.map(({ name }, i) =>
    btn(name === 'Saturated' ? name : `Model ${name}`, () => { selected = i; draw(); }));

  // Keep the same buttons in the DOM so touch, keyboard and mouse input preserve focus.
  const cells = ROWS.map((row, r) => Array.from({ length: ROW_SIZE }, (_, c) =>
    h('button', {
      type: 'button',
      onclick: () => {
        data[r][c] = !data[r][c];
        draw();
      },
      style: {
        display: 'grid', placeItems: 'center', minWidth: '0', minHeight: '36px',
        width: '100%', padding: '0', border: `1px solid ${C.line}`,
        borderRadius: '6px', background: C.bg, cursor: 'pointer',
      },
    }, h('span', {
      'aria-hidden': 'true',
      style: { width: '58%', maxWidth: '15px', aspectRatio: '1', borderRadius: '50%' },
    }))));
  const appointmentPanel = h('div', {},
    ROWS.map((name, r) => h('div', {
      style: { marginTop: '.55rem' },
      role: 'group',
      'aria-label': name,
    }, h('div', { class: 'sim-note', style: { margin: '0 0 .2rem', color: r < 2 ? C.cyan : C.ink } }, name),
    h('div', {
      style: { display: 'grid', gridTemplateColumns: 'repeat(10, minmax(0, 1fr))', gap: '3px' },
    }, cells[r]))),
    h('div', { class: 'sim-note' },
      h('span', { style: { color: RED } }, '● Missed'),
      '  ',
      h('span', { style: { color: C.ink } }, '● Kept')));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: compare deviance'),
    h('p', { class: 'sub' }, 'Tap an appointment to switch between kept and missed. Open the bars to compare how closely the rules fit the same dots.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Picture' }, dotsTab, barsTab),
        appointmentPanel, chart,
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Model for the calculation' }, modelButtons),
        h('div', { class: 'sim-row' },
          btn('New data', randomize),
          btn('Reset', () => { data = initialData(); selected = 0; view = 'dots'; draw(); }))),
      h('div', {},
        h('div', { class: 'sim-card' }, formula, note),
        h('div', { class: 'sim-card' }, challengeHost)))));

  const spreadWithinHalves = counts => counts[0] !== counts[1] || counts[2] !== counts[3];
  const equalHalves = counts => counts[0] + counts[1] === counts[2] + counts[3];
  const task = challenges(challengeHost, [
    {
      text: 'With Model A selected, make exactly 12 appointments missed.',
      check: state => state.selected === 0 && state.total === 12,
      why: 'Model A now gives every appointment the same miss chance, 12 out of 40, or 0.30.',
    },
    {
      text: 'Make both text groups have the same number missed, then open the bars.',
      check: state => state.view === 'bars' && equalHalves(state.counts),
      why: 'The two groups have the same miss chance, so Models A and B give every dot the same score.',
    },
    {
      text: 'Keep the text groups tied, but make one morning row differ from its afternoon row.',
      check: state => equalHalves(state.counts) && spreadWithinHalves(state.counts),
      why: 'Model C can give those two rows different chances, so it fits these appointments more closely than Model B.',
    },
  ]);
  let challengeState;
  function checkCurrentChallenge(event) {
    if (event.target.closest('.sim-ch-nav') && challengeState) task.update(challengeState);
  }
  challengeHost.addEventListener('click', checkCurrentChallenge);

  function randomize() {
    const next = data.map(() => {
      const chance = rnd(1, 8) / 10;
      return Array.from({ length: ROW_SIZE }, () => Math.random() < chance);
    });
    if (next.every((row, r) => row.every((missed, c) => missed === data[r][c]))) {
      const r = rnd(0, ROWS.length - 1), c = rnd(0, ROW_SIZE - 1);
      next[r][c] = !next[r][c];
    }
    data = next;
    draw();
  }

  const sum = values => values.reduce((a, b) => a + b, 0);
  // An outcome with no observations contributes zero, even when its chance is zero.
  const term = (count, chance) => count === 0 ? 0 : count * Math.log(chance);
  function fit(model, counts) {
    if (!model.rows) return { groups: [], logScore: 0, deviance: 0 };
    const groups = model.rows.map((rows, i) => {
      const n = rows.length * ROW_SIZE, missed = sum(rows.map(r => counts[r]));
      const p = missed / n;
      return { name: model.labels[i], n, missed, p, score: term(missed, p) + term(n - missed, 1 - p) };
    });
    const logScore = sum(groups.map(group => group.score));
    return { groups, logScore, deviance: 2 * (0 - logScore) };
  }

  const number = (x, digits) => (x === 0 ? 0 : x).toFixed(digits).replace('-', '−');
  function setPressed(button, active) {
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('go', active);
  }
  function drawBars(fits) {
    const x = 55, span = 228, scale = span / 56;
    const parts = [];
    for (const tick of [0, 10, 20, 30, 40, 50]) {
      const tx = x + tick * scale;
      parts.push(
        s('line', { x1: tx, x2: tx, y1: 18, y2: 184, stroke: C.line }),
        s('text', { x: tx, y: 205, fill: C.ink, 'font-size': 12, 'text-anchor': 'middle' }, String(tick)));
    }
    MODELS.forEach(({ name, color }, i) => {
      const y = 35 + 42 * i;
      const value = fits[i].deviance;
      if (selected === i) parts.push(s('rect', {
        x: 5, y: y - 16, width: 349, height: 32, rx: 6, fill: 'none', stroke: color,
      }));
      parts.push(s('text', { x: 13, y: y + 5, fill: color, 'font-size': 14, 'font-weight': 700 },
        name === 'Saturated' ? 'Sat.' : name));
      parts.push(value === 0
        ? s('circle', { cx: x, cy: y, r: 4, fill: color })
        : s('rect', { x, y: y - 7, width: value * scale, height: 14, rx: 3, fill: color }));
      parts.push(s('text', {
        x: 342, y: y + 5, fill: color, 'font-size': 15, 'font-family': 'Consolas, monospace', 'text-anchor': 'end',
      }, number(value, 1)));
    });
    parts.push(s('text', {
      x: 180, y: 224, fill: C.ink, 'font-size': 13, 'text-anchor': 'middle',
    }, 'Deviance · shorter means closer fit'));
    svg.setAttribute('aria-label', 'Deviance. ' + fits.map((fit, i) =>
      `${MODELS[i].name} ${number(fit.deviance, 1)}`).join(', '));
    svg.replaceChildren(...parts);
  }

  function drawFormula(fit) {
    const model = MODELS[selected];
    if (!model.rows) {
      fbox(formula, [
        ['Saturated model', model.color],
        'Every dot scores 1',
        'Log score = 0',
        ['Deviance = 2 × (0 − 0) = 0', model.color],
      ]);
      note.textContent = 'Each appointment has its own chance, so this rule fits the existing dots perfectly.';
      return;
    }

    const chances = fit.groups.map(({ name, missed, n, p }) =>
      `${name}: ${missed}/${n} = ${number(p, 2)}`);
    const log = number(fit.logScore, 2);
    fbox(formula, [
      [chances.length === 1 ? 'Miss chance' : 'Miss chances', model.color],
      ...chances,
      `Log score ≈ ${log}`,
      'Deviance = 2 × gap from 0',
      ['2 × (0 − (' + log + `)) ≈ ${number(fit.deviance, 1)}`, model.color],
    ]);
    note.textContent = 'The log score adds the log of the miss chance for every red dot and the log of the kept chance for every white dot.';
  }

  function draw() {
    const counts = data.map(row => row.filter(Boolean).length);
    const fits = MODELS.map(model => fit(model, counts));
    challengeState = { counts, total: sum(counts), selected, view };

    appointmentPanel.hidden = view !== 'dots';
    chart.hidden = view !== 'bars';
    setPressed(dotsTab, view === 'dots');
    setPressed(barsTab, view === 'bars');
    modelButtons.forEach((button, i) => setPressed(button, i === selected));

    cells.forEach((row, r) => row.forEach((button, c) => {
      const missed = data[r][c], color = missed ? RED : C.ink;
      button.setAttribute('aria-label', `${ROWS[r]}, appointment ${c + 1}, ${missed ? 'missed' : 'kept'}`);
      button.setAttribute('aria-pressed', String(missed));
      button.firstElementChild.style.backgroundColor = color;
      button.firstElementChild.style.boxShadow = missed ? `0 0 5px ${RED}` : 'none';
    }));

    if (view === 'bars') drawBars(fits);
    drawFormula(fits[selected]);
    task.update(challengeState);
  }

  draw();
  return () => challengeHost.removeEventListener('click', checkCurrentChallenge);
}
