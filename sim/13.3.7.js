// 13.3.7 Try it: edit two workers' answers and compare their matches with chance.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const BLUE = '#60a5fa', ORANGE = '#fb923c';
  const SP = [...'ABCDEFGHIJKL'];
  const N = SP.length;
  const START_A = SP.map((_, i) => i >= 9);
  const START_B = SP.map((id, i) => id === 'H' || id === 'K' ? !START_A[i] : START_A[i]);
  const TRIALS = 4000, BATCH = 200;

  let labels = [START_A.slice(), START_B.slice()];
  let frame = null, trials = 0, trialMatches = 0;

  const pairs = h('div', { style: {
    display: 'grid', gap: '0.45rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 7.6rem), 1fr))'
  } });
  const chart = s('svg', { viewBox: '0 0 340 130', role: 'img', 'aria-label': 'Agreement comparison' });
  const numbers = h('div');
  const trialStatus = h('p', { class: 'sim-note', role: 'status', style: { minHeight: '2.8em' } });
  const challengeRoot = h('div');

  const buttons = SP.map((id, i) => {
    const controls = ['A', 'B'].map((worker, j) => {
      const button = btn('', () => {
        labels[j][i] = !labels[j][i];
        resetTrials();
        draw();
      });
      button.type = 'button';
      button.style.padding = '0.35rem 0.2rem';
      return button;
    });
    const tile = h('div', { style: {
      display: 'grid', gap: '0.25rem', padding: '0.27rem',
      border: `1px solid ${C.line}`, borderRadius: '0.55rem', background: C.bg
    } },
    h('strong', { style: { textAlign: 'center', fontSize: '0.9rem' } }, id),
    ...controls);
    pairs.append(tile);
    return { controls, tile };
  });

  const run = btn('Run chance draws', runTrials, 'go');
  run.type = 'button';
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: agreement beyond chance'),
    h('p', { class: 'sub' }, 'Tap a worker’s answer to switch between Plastic and Metal. Each tile shows both answers for one photo.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, pairs,
        h('div', { class: 'sim-row' },
          btn('New data', newData),
          btn('Use the lesson data', () => {
            labels = [START_A.slice(), START_B.slice()];
            resetTrials();
            draw();
          })),
        h('div', { class: 'sim-row' }, run),
        trialStatus, chart),
      h('div', {}, h('div', { class: 'sim-card' }, numbers),
        h('div', { class: 'sim-card' }, challengeRoot)))));

  const chal = challenges(challengeRoot, [
    { text: 'Make the workers agree on every photo, using both labels.',
      check: st => st.matches === N && st.kappa === 1,
      why: 'Every answer matches and both labels are used, so kappa is 1.' },
    { text: 'Give both workers 3 Metal labels and make them match on fewer than 10 photos.',
      check: st => st.metals.every(n => n === 3) && st.matches < 10,
      why: 'Both workers still use the same mix, so expected agreement stays at 62.5% while observed agreement falls.' },
    { text: 'Make both workers say Plastic for every photo.',
      check: st => st.metals.every(n => n === 0),
      why: 'Chance already gives 100% agreement, so there is no possible gain and kappa is undefined.' }
  ]);
  challengeRoot.addEventListener('click', () => chal.update(stats()));

  function stats() {
    const metals = labels.map(row => row.filter(Boolean).length);
    const plastics = metals.map(n => N - n);
    const matches = labels[0].filter((v, i) => v === labels[1][i]).length;
    const chancePairs = plastics[0] * plastics[1] + metals[0] * metals[1];
    const totalPairs = N * N;
    const room = totalPairs - chancePairs;
    return {
      metals, plastics, matches, chancePairs, totalPairs,
      observed: matches / N,
      expected: chancePairs / totalPairs,
      kappa: room === 0 ? null : (matches * N - chancePairs) / room
    };
  }

  function resetTrials() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    trials = 0;
    trialMatches = 0;
    run.disabled = false;
  }

  function newData() {
    // Sample two label mixes, then shuffle their positions independently.
    labels = Array.from({ length: 2 }, () => {
      const metalCount = rnd(1, N - 1);
      const row = SP.map((_, i) => i < metalCount);
      for (let i = N - 1; i > 0; i--) {
        const j = rnd(0, i);
        [row[i], row[j]] = [row[j], row[i]];
      }
      return row;
    });
    resetTrials();
    draw();
  }

  function runTrials() {
    resetTrials();
    const { metals } = stats();
    run.disabled = true;
    function sample() {
      const end = Math.min(trials + BATCH, TRIALS);
      for (; trials < end; trials++) {
        const a = rnd(1, N) <= metals[0];
        const b = rnd(1, N) <= metals[1];
        if (a === b) trialMatches++;
      }
      frame = trials < TRIALS ? requestAnimationFrame(sample) : null;
      run.disabled = frame !== null;
      drawChance(stats());
    }
    frame = requestAnimationFrame(sample);
    trialStatus.textContent = 'Drawing one label from each worker’s mix each time.';
  }

  const pct = n => `${fmt(100 * n)}%`;

  function drawChance(st) {
    const series = [
      ['Observed', st.observed, C.cyan],
      ['Expected by chance', st.expected, C.amber],
      ['Chance draws', trials ? trialMatches / trials : null, C.violet]
    ];
    const bars = series.flatMap(([label, value, color], i) => {
      const y = 16 + 35 * i;
      return [
        s('text', { x: 6, y: y + 2, fill: C.ink, 'font-size': 13 }, label),
        s('rect', { x: 137, y: y - 9, width: 142, height: 12, rx: 4, fill: C.line }),
        value > 0 ? s('rect', { x: 137, y: y - 9, width: 142 * value, height: 12, rx: 4, fill: color }) : null,
        s('text', { x: 333, y: y + 2, fill: color, 'font-size': 13, 'text-anchor': 'end' }, value === null ? '—' : pct(value))
      ].filter(Boolean);
    });
    chart.replaceChildren(...bars,
      s('text', { x: 137, y: 119, fill: C.muted, 'font-size': 11 }, '0%'),
      s('text', { x: 279, y: 119, fill: C.muted, 'font-size': 11, 'text-anchor': 'end' }, '100%'));
    chart.setAttribute('aria-label', series.map(([label, value]) =>
      `${label}: ${value === null ? 'ready to run' : pct(value)}`).join('. '));
    if (trials === 0) {
      trialStatus.textContent = 'Run chance draws to sample labels from both workers’ mixes.';
    } else if (trials === TRIALS) {
      trialStatus.textContent = `${trialMatches} matches in ${trials} draws (${pct(trialMatches / trials)}).`;
    }
  }

  function draw() {
    const st = stats();
    buttons.forEach(({ controls, tile }, i) => {
      const match = labels[0][i] === labels[1][i];
      tile.style.borderColor = match ? C.line : C.pink;
      controls.forEach((button, j) => {
        const metal = labels[j][i];
        const worker = j === 0 ? 'A' : 'B';
        const name = metal ? 'Metal' : 'Plastic';
        button.textContent = `${worker} ${metal ? '■' : '●'} ${name}`;
        button.style.color = metal ? ORANGE : BLUE;
        button.setAttribute('aria-label', `Photo ${SP[i]}. Worker ${worker} says ${name}. Switch to ${metal ? 'Plastic' : 'Metal'}.`);
      });
    });

    const [ap, bp] = st.plastics;
    const [am, bm] = st.metals;
    fbox(numbers, [
      `A: ${ap} Plastic, ${am} Metal`,
      `B: ${bp} Plastic, ${bm} Metal`,
      [`Observed: ${st.matches}/${N} = ${pct(st.observed)}`, C.cyan],
      'Expected by chance',
      `(${ap} × ${bp} + ${am} × ${bm}) ÷ ${st.totalPairs}`,
      [`= ${st.chancePairs}/${st.totalPairs} = ${pct(st.expected)}`, C.amber],
      'Kappa = (observed − expected)',
      '        ÷ (1 − expected)',
      st.kappa === null
        ? ['Undefined: 1 − expected = 0', C.pink]
        : [`= (${st.matches}/${N} − ${st.chancePairs}/${st.totalPairs})`,
          C.ink],
      ...(st.kappa === null ? [] : [
        `  ÷ (1 − ${st.chancePairs}/${st.totalPairs})`,
        [`= ${fmt(st.kappa)}`, C.green]
      ])
    ]);
    drawChance(st);
    chal.update(st);
  }

  draw();
  return resetTrials;
}
