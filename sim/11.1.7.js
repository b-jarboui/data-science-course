// 11.1.7 Try it: compare yesterday's sales and the same weekday last week.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, fmt, rnd, challenges } = kit;
  const START = [
    37, 39, 43, 52, 54, 67, 58,
    44, 44, 52, 56, 63, 75, 65,
    51, 53, 58, 63, 71, 80, 72,
    58, 58, 65, 71, 78, 88, 79,
  ];
  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const EFFECT = [-10, -10, -5, 0, 5, 15, 5];
  const signed = value => value < 0 ? `−${fmt(-value)}` : value > 0 ? `+${fmt(value)}` : '0';
  const dayName = i => `Week ${1 + Math.floor(i / 7)}, ${WEEKDAYS[i % 7]}`;
  let sales = START.slice(), selected = 0, lag = 1, generated = false;

  const svg = s('svg', {
    viewBox: '0 0 420 345', role: 'img',
    'aria-label': 'Daily sales and differences, aligned by day',
  });
  const box = h('div', { 'aria-live': 'polite' });
  const note = h('div', { class: 'sim-note' });
  const challengeHost = h('div');
  const dayReadout = h('span', { 'aria-live': 'polite' });
  const range = h('input', {
    type: 'range', min: 1, max: START.length, step: 1, value: 1,
    'aria-label': 'Selected day', style: { width: '100%', minHeight: '44px' },
    oninput: event => select(Number(event.currentTarget.value) - 1),
  });
  const less = btn('−1 loaf', () => bump(-1));
  const more = btn('+1 loaf', () => bump(1));
  const yesterday = btn('Yesterday', () => setLag(1));
  const lastWeek = btn('Same weekday last week', () => setLag(7));

  const view = h('div', { class: 'sim' },
    h('h2', {}, 'Try it with bakery sales'),
    h('p', { class: 'sub' },
      'Tap a day on the graph or use the slider. Change that day’s sales and watch which differences move.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('label', {}, dayReadout, range),
        h('div', { class: 'sim-row' }, less, more),
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Compare with' }, yesterday, lastWeek),
        h('div', { class: 'sim-row' },
          btn('New data', newData),
          btn('Reset to bakery sales', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengeHost))));
  root.append(view);

  const check = challenges(challengeHost, [
    {
      text: 'Compare with yesterday and make Tuesday of Week 1 sell exactly 5 more loaves than Monday.',
      check: st => st.lag === 1 && st.selected === 1 && st.sales[1] - st.sales[0] === 5,
      why: 'Tuesday’s change is +5 because Tuesday sold five more loaves than Monday.',
    },
    {
      text: 'Reset, select Saturday of Week 2, then compare with the same weekday last week.',
      check: st => st.lag === 7 && st.selected === 12 && st.sales.every((value, i) => value === START[i]),
      why: 'Saturday sold 75 loaves after selling 67 the previous Saturday, so its change is +8.',
    },
    {
      text: 'Press New data, use the same weekday last week, and make Week 4 Monday match Week 3 Monday.',
      check: st => st.generated && st.lag === 7 && st.selected === 21 && st.sales[21] === st.sales[14],
      why: 'Matching sales on the two Mondays give a seven-day change of zero.',
    },
  ]);
  // The kit checks the visible challenge. Also check the current state when navigating to it.
  challengeHost.addEventListener('click', updateChallenge);

  function updateChallenge() {
    check.update({ sales, selected, lag, generated });
  }

  function select(day) {
    selected = day;
    draw();
  }

  function setLag(days) {
    lag = days;
    draw();
  }

  function bump(delta) {
    sales[selected] = Math.max(0, Math.min(160, sales[selected] + delta));
    draw();
  }

  function reset() {
    sales = START.slice();
    selected = 0;
    lag = 1;
    generated = false;
    draw();
  }

  function newData() {
    const base = rnd(44, 56), climb = rnd(1, 2);
    sales = START.map((_, i) => base + climb * i + EFFECT[i % 7] + rnd(-2, 2));
    generated = true;
    draw();
  }

  const X0 = 43, X1 = 401;
  const x = i => X0 + (X1 - X0) * i / (START.length - 1);
  svg.addEventListener('pointerdown', event => {
    const transform = svg.getScreenCTM();
    if (!transform) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(transform.inverse());
    if (local.y < 24 || local.y > 309 || local.x < X0 - 7 || local.x > X1 + 7) return;
    const day = Math.round((local.x - X0) / (X1 - X0) * (START.length - 1));
    select(Math.max(0, Math.min(START.length - 1, day)));
  });

  function gridLine(x1, y1, x2, y2, stroke = C.line, width = 1) {
    return s('line', { x1, y1, x2, y2, stroke, 'stroke-width': width });
  }

  function text(value, tx, ty, fill = C.ink, anchor = 'middle') {
    return s('text', {
      x: tx, y: ty, fill, 'text-anchor': anchor, 'font-size': 15, 'font-family': 'Segoe UI, sans-serif',
    }, value);
  }

  function plot(values, ticks, top, bottom, title, color, marked, emptyDays = 0) {
    const min = ticks[0], max = ticks[ticks.length - 1];
    const y = value => bottom - (bottom - top) * (value - min) / (max - min);
    const nodes = [text(title, X0, top - 9, color, 'start')];
    if (emptyDays) {
      nodes.push(s('rect', {
        x: X0, y: top, width: x(emptyDays - 0.5) - X0, height: bottom - top,
        fill: C.muted, 'fill-opacity': 0.12,
      }));
    }

    for (const tick of ticks) {
      nodes.push(gridLine(X0, y(tick), X1, y(tick), tick === 0 ? C.muted : C.line),
        text(String(tick), X0 - 7, y(tick) + 5, C.ink, 'end'));
    }
    for (const day of [0, 7, 14, 21, 27]) {
      nodes.push(gridLine(x(day), top, x(day), bottom));
    }
    nodes.push(s('line', {
      x1: x(selected), x2: x(selected), y1: top, y2: bottom,
      stroke: C.amber, 'stroke-width': 1, 'stroke-dasharray': '4 4',
    }));

    const points = values.flatMap((value, i) => value === null ? [] : [`${x(i)},${y(value)}`]);
    nodes.push(s('polyline', {
      points: points.join(' '), fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linejoin': 'round',
    }));
    values.forEach((value, i) => {
      if (value === null) return;
      nodes.push(s('circle', { cx: x(i), cy: y(value), r: 2.5, fill: color }));
    });
    for (const [i, stroke] of marked) {
      if (i < 0 || values[i] === null) continue;
      nodes.push(s('circle', {
        cx: x(i), cy: y(values[i]), r: 6, fill: C.bg, stroke, 'stroke-width': 2.5,
      }));
    }
    return nodes;
  }

  function draw() {
    const prior = selected - lag;
    const changes = sales.map((value, i) => i < lag ? null : value - sales[i - lag]);
    const results = changes.slice(lag);
    const maxChange = Math.max(16, Math.ceil(Math.max(...results.map(Math.abs)) / 8) * 8);
    const salesTop = Math.max(100, Math.ceil(Math.max(...sales) / 20) * 20);
    const comparison = lag === 1 ? 'yesterday' : 'the same weekday last week';
    svg.replaceChildren(
      ...plot(sales, [0, salesTop / 2, salesTop], 28, 139, 'Daily sales · loaves', C.cyan,
        [[prior, C.violet], [selected, C.amber]]),
      ...plot(changes, [-maxChange, 0, maxChange], 184, 305,
        lag === 1 ? 'Change from yesterday · loaves' : 'Change from last week · loaves',
        C.green, [[selected, C.amber]], lag),
      ...[0, 7, 14, 21, 27].map(day => text(String(day + 1), x(day), 327)),
      text('Day', (X0 + X1) / 2, 343, C.muted),
    );

    range.value = selected + 1;
    range.setAttribute('aria-valuetext', dayName(selected));
    dayReadout.textContent = `${dayName(selected)} · ${sales[selected]} loaves`;
    less.disabled = sales[selected] === 0;
    more.disabled = sales[selected] === 160;
    for (const [button, days] of [[yesterday, 1], [lastWeek, 7]]) {
      button.classList.toggle('go', lag === days);
      button.setAttribute('aria-pressed', String(lag === days));
    }

    if (prior < 0) {
      fbox(box, [dayName(selected), `Sales: ${sales[selected]} loaves`, 'No earlier day to subtract']);
    } else {
      fbox(box, [
        dayName(selected),
        `Earlier: ${dayName(prior)}`,
        'Today − earlier sales',
        [`${sales[selected]} − ${sales[prior]} = ${signed(changes[selected])} loaves`, C.amber],
      ]);
    }
    const mean = results.reduce((total, value) => total + value, 0) / results.length;
    note.textContent = `Compared with ${comparison}, there are ${results.length} changes, ` +
      `from ${signed(Math.min(...results))} to ${signed(Math.max(...results))} loaves, ` +
      `with an average of ${signed(mean)}.`;
    updateChallenge();
  }

  draw();
  return () => view.remove();
}
