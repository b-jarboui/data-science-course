// 16.3.10 Try it: compare exact chances and sample public answers on neighboring lists.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const nell = { name: 'Nell', late: true };
  const sage = { name: 'Sage', late: true };
  const oak = { name: 'Oak', late: false };
  const pool = [
    nell, { name: 'Pine', late: false }, { name: 'Reed', late: false },
    { name: 'Teal', late: true }, { name: 'Vale', late: true }, { name: 'Wren', late: false }
  ];

  let base = [nell], added = sage, mode = 'bag';
  let trials = 0, yes = [0, 0], last = [], batch = 0;

  const svg = s('svg', {
    viewBox: '0 0 400 292',
    role: 'img',
    'aria-label': 'Private lists and their chances of releasing yes or no'
  });
  const box = h('div');
  const trialNote = h('div', { class: 'sim-note', role: 'status' });
  const challengeRoot = h('div');

  const sageButton = btn('Add Sage (late)', () => change(base, sage, mode));
  const oakButton = btn('Add Oak (on time)', () => change(base, oak, mode));
  const bagButton = btn('Four-slip bag', () => change(base, added, 'bag'));
  const coinButton = btn('Fair coin', () => change(base, added, 'coin'));
  const runButton = btn('Run 400 draws', run, 'go');

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: one parcel and one public answer'),
    h('p', { class: 'sub' },
      'The depot asks if at least two parcels were late. Add one parcel to the second list, then compare the chances of each public answer.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Parcel to add' }, sageButton, oakButton),
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'How to choose the public answer' }, bagButton, coinButton),
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Draw public answers' },
          btn('Draw once', () => { drawTrials(1); render(); }), runButton,
          btn('Reset draws', () => change(base, added, mode))),
        h('div', { class: 'sim-row' },
          btn('New data', newData), btn('Restore Nell’s list', () => change([nell], sage, 'bag'))),
        trialNote),
      h('div', {},
        h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' }, challengeRoot)))));

  const challenge = challenges(challengeRoot, [
    {
      text: 'Use the bag and add Sage to make YES three times as likely.',
      check: state => state.mode === 'bag' && state.added === sage && state.factor === 3,
      why: 'Sage changes the true answer, so the YES chance grows from one in four to three in four.'
    },
    {
      text: 'Use the bag and add Oak to make both public chances stay the same.',
      check: state => state.mode === 'bag' && state.added === oak && state.factor === 1,
      why: 'Oak is on time, so the late count and the chances of both answers stay the same.'
    },
    {
      text: 'Give the two lists different true answers, then use the fair coin and run 400 draws.',
      check: state => state.mode === 'coin' && state.changedTruth && state.trials >= 400,
      why: 'Both lists have the same exact chances because the coin gives its answer without checking either list.'
    }
  ]);

  function newData() {
    const available = pool.slice();
    const size = rnd(0, 3);
    const next = Array.from({ length: size }, () => available.splice(rnd(0, available.length - 1), 1)[0]);
    change(next, added, mode);
  }

  function change(nextBase, nextAdded, nextMode) {
    cancelAnimationFrame(batch);
    batch = 0;
    base = nextBase;
    added = nextAdded;
    mode = nextMode;
    trials = 0;
    yes = [0, 0];
    last = [];
    render();
  }

  function comparison() {
    const lists = [base, [...base, added]];
    const late = lists.map(list => list.filter(parcel => parcel.late).length);
    const truth = late.map(count => count >= 2);
    const total = mode === 'bag' ? 4 : 2;
    const yesWays = truth.map(answer => mode === 'coin' ? 1 : answer ? 3 : 1);
    const noWays = yesWays.map(count => total - count);
    const ratio = counts => Math.max(...counts) / Math.min(...counts);
    const factor = Math.max(ratio(yesWays), ratio(noWays));
    return { lists, late, truth, total, yesWays, noWays, factor };
  }

  function drawTrials(count) {
    const { total, yesWays } = comparison();
    for (let i = 0; i < count; i++) {
      last = yesWays.map(ways => rnd(1, total) <= ways);
      last.forEach((answer, list) => { yes[list] += Number(answer); });
    }
    trials += count;
  }

  function run() {
    runButton.disabled = true;
    let remaining = 400;
    const step = () => {
      const count = Math.min(10, remaining);
      drawTrials(count);
      remaining -= count;
      batch = remaining ? requestAnimationFrame(step) : 0;
      render();
    };
    batch = requestAnimationFrame(step);
  }

  function text(x, y, value, color = C.ink, size = 17) {
    return s('text', { x, y, fill: color, 'font-size': size, 'font-family': 'Segoe UI, sans-serif' }, value);
  }

  function bar(x, y, share, title) {
    const width = 166;
    return s('g', {},
      s('title', {}, title),
      s('rect', { x, y, width, height: 14, rx: 3, fill: C.bg, stroke: C.muted }),
      share == null ? null : s('g', {},
        s('rect', { x, y, width: width * share, height: 14, fill: C.green }),
        s('rect', { x: x + width * share, y, width: width * (1 - share), height: 14, fill: C.violet })
      )
    );
  }

  function names(list, late) {
    return list.filter(parcel => parcel.late === late).map(parcel => parcel.name).join(', ') || '—';
  }

  function render() {
    const { lists, late, truth, total, yesWays, noWays, factor } = comparison();
    const worst = mode === 'bag' ? 3 : 1;
    svg.replaceChildren(...lists.flatMap((list, i) => {
      const x = 12 + i * 194;
      const exactYes = yesWays[i] / total;
      const sampleYes = trials ? yes[i] / trials : null;
      return [
        s('rect', { x: x - 6, y: 4, width: 182, height: 268, rx: 9, fill: C.bg, stroke: C.line }),
        text(x, 27, i === 0 ? `Without ${added.name}` : `With ${added.name}`, C.cyan, 20),
        text(x, 52, `Late: ${names(list, true)}`, C.amber),
        text(x, 75, `On time: ${names(list, false)}`),
        text(x, 106, `${late[i]} late · True ${truth[i] ? 'YES' : 'NO'}`, C.ink, 18),
        text(x, 140, 'Exact chance', C.ink, 18),
        bar(x, 149, exactYes, `Exact: YES ${yesWays[i]} of ${total}, NO ${noWays[i]} of ${total}`),
        text(x, 183, `YES ${yesWays[i]}/${total}`, C.green),
        text(x + 87, 183, `NO ${noWays[i]}/${total}`, C.violet),
        text(x, 216, 'After draws', C.ink, 18),
        bar(x, 225, sampleYes, trials ? `YES ${yes[i]}, NO ${trials - yes[i]} in ${trials} draws` : 'No draws yet'),
        text(x, 259, `YES ${yes[i]}`, C.green),
        text(x + 87, 259, `NO ${trials - yes[i]}`, C.violet)
      ];
    }));
    const calculation = (counts) =>
      `(${Math.max(...counts)}/${total}) ÷ (${Math.min(...counts)}/${total}) = ${Math.max(...counts) / Math.min(...counts)}`;
    fbox(box, [
      `YES   ${calculation(yesWays)}`,
      `NO    ${calculation(noWays)}`,
      [`Factor for these lists = ${factor}`, C.amber],
      `Largest for any pair = ${worst}`,
      [`ε = ln(${worst}) ${worst === 1 ? '=' : '≈'} ${fmt(Math.log(worst))}`, C.cyan]
    ]);
    if (!batch) {
      trialNote.textContent = trials
        ? `${trials} draws per list. Last pair: ${last.map(answer => answer ? 'YES' : 'NO').join(' and ')}.`
        : 'Draw from each list to compare the results with the exact chances.';
    }
    sageButton.setAttribute('aria-pressed', String(added === sage));
    oakButton.setAttribute('aria-pressed', String(added === oak));
    bagButton.setAttribute('aria-pressed', String(mode === 'bag'));
    coinButton.setAttribute('aria-pressed', String(mode === 'coin'));
    runButton.disabled = Boolean(batch);
    challenge.update({ mode, added, factor, changedTruth: truth[0] !== truth[1], trials });
  }

  // Check the newly selected challenge against the current state as well.
  challengeRoot.addEventListener('click', render);
  render();
  return () => cancelAnimationFrame(batch);
}
