// 11.1.6 Try it: compare bakery sales with their seven-day changes.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const WEEKDAY = [-10, -10, -5, 0, 5, 15, 5];
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // In the chapter, day one has trend 47. Each week's remainders add to zero.
  const NOTEBOOK = [
    0, 1, -1, 2, -2, 0, 0,
    0, -1, 1, -1, 0, 1, 0,
    0, 1, 0, -1, 1, -1, 0,
    0, -1, 0, 0, 1, 0, 0
  ];
  const START = { base: 47, rise: 1, season: 1, wobble: 1, noise: NOTEBOOK };
  let data = { ...START }, mode = 'sales', day = 12, random = false;
  let lastState;

  const svg = s('svg', { role: 'img' });
  const box = h('div'), note = h('div', { class: 'sim-note' });
  const challengeHost = h('div');
  const salesButton = btn('Raw sales', () => view('sales'));
  const changeButton = btn('Seven-day changes', () => view('changes'));
  const daySelect = h('select', {
    style: { minHeight: '44px', maxWidth: '100%', font: 'inherit' },
    onchange: event => { day = Number(event.currentTarget.value); draw(); }
  });

  function slider(key, title, min, max, step) {
    const readout = h('output');
    const input = h('input', {
      type: 'range', min, max, step, value: data[key],
      'aria-label': title,
      style: { width: '100%', minHeight: '36px', margin: '0' },
      oninput: event => { data[key] = Number(event.currentTarget.value); draw(); }
    });
    const control = h('label', { style: { display: 'block', marginTop: '.65rem' } },
      h('span', {}, `${title} `), readout, input);
    return { key, control, input, readout };
  }

  const controls = [
    slider('rise', 'Trend (loaves per day)', -1, 2, 0.5),
    slider('season', 'Weekly pattern', 0, 1.5, 0.5),
    slider('wobble', 'Extra wobble', 0, 2, 1)
  ];

  const panel = h('div', { class: 'sim' },
    h('h2', {}, 'Try it: when do sales stay steady?'),
    h('p', { class: 'sub' },
      'Change the trend, the weekly pattern or the extra wobble. Switch views to compare the sales with the changes from the same weekday last week.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', style: { marginTop: '0', marginBottom: '.65rem' } }, salesButton, changeButton),
        svg,
        h('div', { class: 'sim-row' }, h('label', {}, 'Inspect day ', daySelect)),
        controls.map(control => control.control),
        h('div', { class: 'sim-row' },
          btn('New data', newData, 'go'),
          btn('Reset notebook', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengeHost))));
  root.append(panel);

  const check = challenges(challengeHost, [
    {
      text: 'With a rising trend, show seven-day changes and make the first and last full weeks average the same.',
      check: state => state.mode === 'changes' && state.rise > 0 && state.firstMean === state.lastMean,
      why: 'Each full week has the same average change because the trend adds the same amount over seven days.'
    },
    {
      text: 'In raw sales, make the halves average the same while keeping a weekly pattern.',
      check: state => state.mode === 'sales' && state.season > 0 && state.early === state.late,
      why: 'The halves have matching averages, but the repeated weekday highs and lows still change the expected sales from day to day.'
    },
    {
      text: 'Get new data, then make raw sales wobble with neither a trend nor a weekly pattern.',
      check: state => state.random && state.mode === 'sales' && state.rise === 0 &&
        state.season === 0 && state.wobble > 0 && state.early === state.late,
      why: 'Daily values still bounce around, while the two halves share the same average and no weekday gets a built-in boost.'
    }
  ]);
  // The kit updates the currently displayed question. Recheck after navigation.
  const recheck = () => check.update(lastState);
  challengeHost.addEventListener('click', recheck);

  const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
  const dayName = i => `W${Math.floor(i / 7) + 1} ${DAYS[i % 7]}`;
  const number = value => fmt(Math.abs(value) < 1e-10 ? 0 : value).replace('-', '−');

  function summarize(values) {
    const previous = values.slice(0, -1), current = values.slice(1);
    const a = mean(previous), b = mean(current);
    let xx = 0, yy = 0, xy = 0;
    previous.forEach((value, i) => {
      const x = value - a, y = current[i] - b;
      xx += x * x;
      yy += y * y;
      xy += x * y;
    });
    return {
      mean: mean(values),
      range: `${number(Math.min(...values))} to ${number(Math.max(...values))}`,
      lag: xx && yy ? number(xy / Math.sqrt(xx * yy)) : '—'
    };
  }

  function view(next) {
    mode = next;
    if (mode === 'changes') day = Math.max(7, day);
    fillDaySelect();
    draw();
  }

  function fillDaySelect() {
    const first = mode === 'sales' ? 0 : 7;
    const options = Array.from({ length: 28 - first }, (_, i) =>
      h('option', { value: first + i }, dayName(first + i)));
    daySelect.replaceChildren(...options);
    daySelect.value = String(day);
  }

  function newData() {
    const noise = [];
    for (let week = 0; week < 4; week++) {
      const group = [0];
      for (let pair = 0; pair < 3; pair++) {
        const value = rnd(1, 2);
        group.push(value, -value);
      }
      for (let i = group.length - 1; i > 0; i--) {
        const j = rnd(0, i);
        [group[i], group[j]] = [group[j], group[i]];
      }
      noise.push(...group);
    }
    data = { ...data, base: rnd(43, 54), noise };
    random = true;
    draw();
  }

  function reset() {
    data = { ...START };
    random = false;
    day = 12;
    view('sales');
  }

  function draw() {
    const isChange = mode === 'changes';
    const sales = data.noise.map((noise, i) =>
      data.base + data.rise * i + data.season * WEEKDAY[i % 7] + data.wobble * noise);
    const differences = sales.slice(7).map((value, i) => value - sales[i]);
    const plotted = isChange ? sales.map((_, i) => i < 7 ? null : differences[i - 7]) : sales;
    const early = summarize(isChange ? differences.slice(0, 10) : sales.slice(0, 14));
    const late = summarize(isChange ? differences.slice(-10) : sales.slice(14));
    const first = isChange ? 7 : 0, earlyEnd = isChange ? 17 : 14, lateStart = isChange ? 18 : 14;
    const color = i => i < earlyEnd ? C.cyan : i >= lateStart ? C.pink : C.muted;

    salesButton.classList.toggle('go', !isChange);
    changeButton.classList.toggle('go', isChange);
    salesButton.setAttribute('aria-pressed', String(!isChange));
    changeButton.setAttribute('aria-pressed', String(isChange));
    controls.forEach(({ key, input, readout }) => {
      input.value = String(data[key]);
      readout.textContent = key === 'rise' ? number(data[key]) : `×${number(data[key])}`;
    });

    // Keep week one on the time axis so its missing changes remain visible.
    const narrow = root.clientWidth < 600;
    const width = narrow ? 380 : 600, height = 268;
    const left = 40, right = width - 12, top = 34, bottom = 220;
    const pitch = (right - left) / 28;
    const x = i => left + (i + 0.5) * pitch;
    const values = isChange ? differences : sales;
    const step = isChange ? 5 : 20;
    const low = Math.min(0, Math.floor(Math.min(...values) / step) * step);
    const high = Math.max(isChange ? 10 : 100, Math.ceil(Math.max(...values) / step) * step);
    const y = value => bottom - (value - low) / (high - low) * (bottom - top);
    const elements = [];
    const text = (value, tx, ty, fill = C.muted, extra = {}) =>
      s('text', { x: tx, y: ty, fill, 'font-size': 13, 'text-anchor': 'middle',
        'font-family': 'Consolas, monospace', ...extra }, value);
    const line = (x1, y1, x2, y2, stroke, extra = {}) =>
      s('line', { x1, y1, x2, y2, stroke, ...extra });

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('aria-label', `${isChange ? 'Seven-day changes' : 'Raw sales'} by week. ` +
      `Early average ${number(early.mean)} loaves. Late average ${number(late.mean)} loaves.`);
    elements.push(text(isChange ? 'Seven-day change in loaves' : 'Loaves sold per day',
      (left + right) / 2, 18, C.ink));
    for (let tick = low; tick <= high; tick += step) {
      const ty = y(tick);
      elements.push(line(left, ty, right, ty, tick === 0 ? C.muted : C.line),
        text(number(tick), left - 7, ty + 4, C.ink, { 'text-anchor': 'end' }));
    }
    for (let week = 0; week < 4; week++) {
      const edge = left + 7 * week * pitch;
      elements.push(line(edge, top, edge, bottom, C.line),
        text(`Week ${week + 1}`, x(7 * week + 3), bottom + 22));
    }
    const meanLine = (summary, begin, end, ink) => line(left + begin * pitch, y(summary.mean),
      left + end * pitch, y(summary.mean), ink, { 'stroke-width': 2, 'stroke-dasharray': '6 5' });
    elements.push(meanLine(early, first, earlyEnd, C.cyan), meanLine(late, lateStart, 28, C.pink),
      line(left + (isChange ? 17.5 : 14) * pitch, top, left + (isChange ? 17.5 : 14) * pitch, bottom,
        C.violet, { 'stroke-dasharray': '3 5' }));
    if (isChange) elements.push(text('No prior', x(3), top + 26), text('week', x(3), top + 43));

    plotted.forEach((value, i) => {
      if (value == null || i === first) return;
      elements.push(line(x(i - 1), y(plotted[i - 1]), x(i), y(value),
        color(i - 1) === color(i) ? color(i) : C.muted, { 'stroke-width': 1.9 }));
    });
    plotted.forEach((value, i) => {
      if (value == null) return;
      elements.push(s('circle', { cx: x(i), cy: y(value), r: i === day ? 4 : 2.7, fill: color(i) }));
    });
    elements.push(s('circle', { cx: x(day), cy: y(plotted[day]), r: 7,
      fill: 'none', stroke: C.amber, 'stroke-width': 2 }));
    elements.push(text('Dashed segments show the averages', (left + right) / 2, 262, C.ink));
    svg.replaceChildren(...elements);

    const detail = isChange
      ? `${dayName(day)}: ${number(sales[day])} − ${number(sales[day - 7])} = ${number(plotted[day])}`
      : `${dayName(day)}: ${number(sales[day])} loaves sold`;
    const count = isChange ? 10 : 14;
    fbox(box, [
      [detail, C.amber],
      ʻEarlyʼ,
      [`${number(early.mean * count)} ÷ ${count} = ${number(early.mean)} loaves`, C.cyan],
      `Range ${early.range} · Lag 1 ${early.lag}`,
      'Late',
      [`${number(late.mean * count)} ÷ ${count} = ${number(late.mean)} loaves`, C.pink],
      `Range ${late.range} · Lag 1 ${late.lag}`
    ]);
    const parts = isChange
      ? 'The comparison uses the first and last 10 changes and skips the middle day.'
      : 'The comparison uses the first and last 14 sales.';
    const lagNote = early.lag === '—' || late.lag === '—'
      ? ' A dash means a part has too little variation to measure the link.'
      : '';
    note.textContent = `${parts} Lag 1 measures the link to yesterday.${lagNote}`;

    lastState = {
      mode, random, rise: data.rise, season: data.season, wobble: data.wobble,
      early: early.mean, late: late.mean,
      firstMean: mean(differences.slice(0, 7)), lastMean: mean(differences.slice(-7))
    };
    check.update(lastState);
  }

  fillDaySelect();
  draw();
  const observer = new ResizeObserver(draw);
  observer.observe(root);
  return () => {
    observer.disconnect();
    challengeHost.removeEventListener('click', recheck);
  };
}
