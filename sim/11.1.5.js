// 11.1.5 Try it: compare today's bakery sales with its own past.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [
    37, 39, 43, 52, 54, 67, 58,
    44, 44, 52, 56, 63, 75, 65,
    51, 53, 58, 63, 71, 80, 72,
    58, 58, 65, 71, 78, 88, 79,
  ];
  const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const WEEKDAY_EFFECT = [-10, -10, -5, 0, 5, 15, 5];
  const dayName = i => `Week ${Math.floor(i / 7) + 1} ${WEEKDAYS[i % 7]}`;
  let sales = START.slice(), lag = 7, selected = 12, removeTrend = false;
  let triedLag = false, triedTrend = false;

  const svg = s('svg', {
    viewBox: '0 0 380 320', role: 'img', 'aria-label': 'Scatterplot of bakery sales at the selected lag',
    style: 'max-width: 540px; margin-inline: auto',
  });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const challengeCard = h('div');
  const lagReadout = h('span');
  const salesReadout = h('span');
  const lagInput = h('input', {
    type: 'range', min: 1, max: 14, step: 1, value: lag,
    'aria-label': 'Days back', style: { width: '100%', minHeight: '44px' },
    oninput: event => { lag = +event.target.value; triedLag = true; draw(); },
  });
  const daySelect = h('select', {
    'aria-label': 'Day to edit', style: { minHeight: '44px', maxWidth: '100%', font: 'inherit' },
    onchange: event => { selected = +event.target.value; draw(); },
  }, START.map((_, i) => h('option', { value: i }, dayName(i))));
  const salesInput = h('input', {
    type: 'range', min: 20, max: 110, step: 1, value: sales[selected],
    'aria-label': 'Loaves sold on the selected day', style: { width: '100%', minHeight: '44px' },
    oninput: event => { sales[selected] = +event.target.value; draw(); },
  });
  const trendInput = h('input', {
    type: 'checkbox', style: { width: '1.3rem', height: '1.3rem' },
    onchange: event => { removeTrend = event.target.checked; triedTrend = true; draw(); },
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it with bakery sales'),
    h('p', { class: 'sub' },
      'Move the lag slider to look further back. Edit a day’s sales and watch its pairs move.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('label', { style: { display: 'block' } }, lagReadout, lagInput),
        h('div', { class: 'sim-row' }, h('label', {}, 'Day to edit ', daySelect)),
        h('label', { style: { display: 'block', marginTop: '.65rem' } }, salesReadout, salesInput),
        h('label', { class: 'sim-row', style: { minHeight: '44px', cursor: 'pointer' } },
          trendInput, 'Remove the steady rise of 1 loaf per day'),
        h('div', { class: 'sim-row' },
          btn('New data', newData, 'go'),
          btn('Reset', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengeCard)))));

  const chal = challenges(challengeCard, [
    {
      text: 'Find a lag with a correlation between −0.10 and +0.10 in the original sales.',
      check: st => st.original && st.triedLag && !st.removeTrend && Number.isFinite(st.r) && Math.abs(st.r) <= 0.10,
      why: 'The dots at this lag barely line up, so the earlier sales give little straight-line clue about today.',
    },
    {
      text: 'At lag 7, change a day’s sales until the correlation drops below 0.90.',
      check: st => st.lag === 7 && st.edited && !st.removeTrend && Number.isFinite(st.r) && st.r < 0.90,
      why: 'Moving even one day can pull its pairs away from the rising line and weaken the link.',
    },
    {
      text: 'With the original sales at lag 3, remove the steady rise and make the correlation fall below −0.50.',
      check: st => st.original && st.lag === 3 && st.triedTrend && st.removeTrend && st.r < -0.50,
      why: 'Once the steady rise is removed, high days often pair with low days at this delay.',
    },
  ]);

  let baseline = sales.slice();

  function newData() {
    const level = rnd(42, 54);
    const offset = rnd(0, 6);
    sales = START.map((_, i) => level + i + WEEKDAY_EFFECT[(i + offset) % 7] + rnd(-5, 5));
    baseline = sales.slice();
    draw();
  }

  function reset() {
    sales = START.slice();
    baseline = sales.slice();
    lag = 7;
    selected = 12;
    removeTrend = false;
    triedLag = false;
    triedTrend = false;
    draw();
  }

  function statistics(pairs) {
    const meanX = pairs.reduce((sum, pair) => sum + pair.x, 0) / pairs.length;
    const meanY = pairs.reduce((sum, pair) => sum + pair.y, 0) / pairs.length;
    let cross = 0, xx = 0, yy = 0;
    for (const { x, y } of pairs) {
      const dx = x - meanX, dy = y - meanY;
      cross += dx * dy;
      xx += dx * dx;
      yy += dy * dy;
    }
    const divisor = Math.sqrt(xx * yy);
    const r = divisor === 0 ? NaN : Math.max(-1, Math.min(1, cross / divisor));
    return { meanX, meanY, cross, divisor, r };
  }

  function draw() {
    const values = removeTrend ? sales.map((value, i) => value - i) : sales;
    const pairs = values.slice(lag).map((y, i) => ({ x: values[i], y, earlier: i, today: i + lag }));
    const { meanX, meanY, cross, divisor, r } = statistics(pairs);
    const valid = Number.isFinite(r);
    const span = lag === 1 ? '1 day' : `${lag} days`;

    lagInput.value = lag;
    lagInput.setAttribute('aria-valuetext', `${span} back`);
    daySelect.value = selected;
    salesInput.value = sales[selected];
    salesInput.setAttribute('aria-valuetext', `${sales[selected]} loaves`);
    trendInput.checked = removeTrend;
    lagReadout.textContent = `Lag: ${span} back`;
    salesReadout.textContent = `${dayName(selected)}: ${sales[selected]} loaves`;

    const minValue = removeTrend ? -10 : 20;
    const maxValue = 110;
    const x0 = 46, x1 = 360, y0 = 258, y1 = 40;
    const scale = value => (value - minValue) / (maxValue - minValue);
    const x = value => x0 + scale(value) * (x1 - x0);
    const y = value => y0 - scale(value) * (y0 - y1);
    const text = (label, tx, ty, color, anchor = 'middle') =>
      s('text', { x: tx, y: ty, fill: color, 'font-size': 15,
        'text-anchor': anchor, 'font-family': 'Consolas, monospace' }, label);
    const grid = [
      text(removeTrend ? 'Adjusted sales today' : 'Loaves sold today', x0, 22, C.cyan, 'start'),
      text(removeTrend ? `Adjusted sales ${span} earlier` : `Loaves sold ${span} earlier`,
        (x0 + x1) / 2, 305, C.violet),
    ];
    const ticks = removeTrend ? [-10, 20, 50, 80, 110] : [20, 50, 80, 110];
    for (const v of ticks) {
      grid.push(
        s('line', { x1: x0, x2: x1, y1: y(v), y2: y(v), stroke: v === minValue ? C.muted : C.line }),
        s('line', { x1: x(v), x2: x(v), y1, y2: y0, stroke: v === minValue ? C.muted : C.line }),
        text(v, x0 - 8, y(v) + 5, C.muted, 'end'),
        text(v, x(v), y0 + 22, C.muted),
      );
    }
    const points = [], marked = [];
    for (const pair of pairs) {
      const isSelected = pair.earlier === selected || pair.today === selected;
      const point = s('circle', {
        cx: x(pair.x), cy: y(pair.y), r: isSelected ? 5.5 : 4,
        fill: isSelected ? C.amber : C.cyan,
        'fill-opacity': isSelected ? 1 : 0.78,
        stroke: isSelected ? C.bg : undefined, 'stroke-width': 1,
      }, s('title', {}, `${dayName(pair.earlier)}: ${pair.x} → ${dayName(pair.today)}: ${pair.y}`));
      (isSelected ? marked : points).push(point);
    }
    svg.replaceChildren(...grid, ...points, ...marked);

    const pair = pairs.find(p => p.today === selected) ?? pairs.find(p => p.earlier === selected);
    const rows = [
      `${pairs.length} pairs at lag ${lag}`,
      `Earlier mean: ${fmt(meanX)}`,
      `Today’s mean: ${fmt(meanY)}`,
    ];
    if (pair) rows.push([`Selected pair: ${pair.x} → ${pair.y}`, C.amber]);
    rows.push(valid
      ? [`${fmt(cross)} ÷ ${fmt(divisor)} ≈ ${fmt(r)}`, C.cyan]
      : ['Correlation is undefined', C.amber]);
    fbox(box, rows);
    if (!valid) {
      note.textContent = 'Correlation needs some variation in both the earlier and later sales.';
    } else if (removeTrend) {
      note.textContent = 'The adjusted sales subtract 0 loaves on day 1, 1 on day 2, and so on.';
    } else {
      note.textContent = 'The last line is the correlation. It compares how the two sets move together with how much each set varies.';
    }

    chal.update({
      lag, r, removeTrend, triedLag, triedTrend,
      original: sales.every((value, i) => value === START[i]),
      edited: sales.some((value, i) => value !== baseline[i]),
    });
  }

  draw();
}
