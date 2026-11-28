// 11.1.2 Try it: change daily sales and compare the weekly averages.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [
    37, 39, 43, 52, 54, 67, 58,
    44, 44, 52, 56, 63, 75, 65,
    51, 53, 58, 63, 71, 80, 72,
    58, 58, 65, 71, 78, 88, 79,
  ];
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const MAX = 110;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const total = values => values.reduce((sum, value) => sum + value, 0);
  const weekValues = (values, week) => values.slice(week * 7, (week + 1) * 7);
  let initial = START.slice(), values = initial.slice(), selected = 0;
  let showMeans = true, drag = null, state;
  const listeners = new AbortController();
  const on = (element, event, handler) =>
    element.addEventListener(event, handler, { signal: listeners.signal });

  const svg = s('svg', {
    viewBox: '0 0 400 280', role: 'img',
    'aria-label': 'Daily loaf sales and weekly averages',
  });
  const box = h('div', { role: 'status' });
  const challengePanel = h('div');
  const dayLabel = h('span');
  const salesLabel = h('span');
  const selectDay = h('input', {
    type: 'range', min: 1, max: 28, step: 1, value: 1,
    style: { width: '100%', minHeight: '44px' },
    oninput: event => {
      selected = Number(event.currentTarget.value) - 1;
      draw();
    },
  });
  const editSales = h('input', {
    type: 'range', min: 0, max: MAX, step: 1, value: values[0],
    style: { width: '100%', minHeight: '44px' },
    oninput: event => setSales(Number(event.currentTarget.value)),
  });
  const toggle = btn('Show weekly averages', () => {
    showMeans = !showMeans;
    draw();
  });
  const rangeLabel = (caption, input) =>
    h('label', { class: 'sim-note', style: { display: 'block' } }, caption, input);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: find the trend'),
    h('p', { class: 'sub' },
      'Drag a daily dot or use the sliders. Watch how your changes affect the weekly averages.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        rangeLabel(dayLabel, selectDay),
        rangeLabel(salesLabel, editSales),
        h('div', { class: 'sim-row' },
          btn('−1 loaf', () => setSales(values[selected] - 1)),
          btn('+1 loaf', () => setSales(values[selected] + 1)),
          toggle,
          btn('New data', () => load(randomSales()), 'go'),
          btn('Start again', () => load(START)))),
      h('div', {},
        h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' }, challengePanel)))));

  const challenge = challenges(challengePanel, [
    {
      text: 'Make week 1 average exactly 51 loaves a day.',
      check: st => st.totals[0] === 51 * 7,
      why: 'The seven days now add up to 357 loaves, which gives 51 per day.',
    },
    {
      text: 'Change two days in week 2 and keep its average where it started.',
      check: st => st.weekTwoChanges === 2 && st.totals[1] === st.originalWeekTwoTotal,
      why: 'The two changes cancel out, so the total and the average stay the same.',
    },
    {
      text: 'Make the last day lower than the first while all four weekly averages rise.',
      check: st => st.last < st.first &&
        st.totals.slice(1).every((value, i) => value > st.totals[i]),
      why: 'The two days show a drop, and the weekly averages still climb.',
    },
  ]);
  on(challengePanel, 'click', event => {
    if (event.target.closest('button')) challenge.update(state);
  });

  function randomSales() {
    const start = rnd(48, 62);
    const weeklyChange = rnd(-7, 7);
    const weekdayEffect = [-10, -10, -5, 0, 5, 15, 5];
    return Array.from({ length: 28 }, (_, i) =>
      start + weeklyChange * Math.floor(i / 7) + weekdayEffect[i % 7] + rnd(-4, 4));
  }

  function load(next) {
    initial = next.slice();
    values = initial.slice();
    selected = 0;
    drag = null;
    draw();
  }

  function setSales(value) {
    values[selected] = clamp(value, 0, MAX);
    draw();
  }

  const LEFT = 47, RIGHT = 382, TOP = 28, BASE = 230;
  const slot = (RIGHT - LEFT) / 28;
  const x = index => LEFT + (index + 0.5) * slot;
  const y = value => BASE - value / MAX * (BASE - TOP);

  function pointerPosition(event) {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
  }

  on(svg, 'pointerdown', event => {
    if (drag || event.button !== 0) return;
    const point = pointerPosition(event);
    if (point.x < LEFT || point.x >= RIGHT || point.y < TOP - 8 || point.y > BASE + 8) return;
    selected = Math.floor((point.x - LEFT) / slot);
    drag = { id: event.pointerId, y: point.y, value: values[selected] };
    svg.setPointerCapture(event.pointerId);
    draw();
  });
  on(svg, 'pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    const point = pointerPosition(event);
    setSales(Math.round(drag.value + (drag.y - point.y) * MAX / (BASE - TOP)));
  });
  function endDrag(event) {
    if (drag?.id === event.pointerId) drag = null;
  }
  on(svg, 'pointerup', endDrag);
  on(svg, 'pointercancel', endDrag);
  on(svg, 'lostpointercapture', endDrag);

  const text = (value, px, py, color, anchor = 'middle') => s('text', {
    x: px, y: py, fill: color, 'text-anchor': anchor,
    'font-size': 15, 'font-family': 'Consolas, monospace',
  }, value);
  const rule = (x1, y1, x2, y2, color, width = 1) =>
    s('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': width });
  const trace = (pairs, color, width, opacity = 1) => s('polyline', {
    points: pairs.map(pair => pair.join(',')).join(' '),
    fill: 'none', stroke: color, 'stroke-width': width, 'stroke-opacity': opacity,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  });

  function draw() {
    const totals = Array.from({ length: 4 }, (_, i) => total(weekValues(values, i)));
    const means = totals.map(sum => sum / 7);
    const week = Math.floor(selected / 7);
    const dayPoints = values.map((value, i) => [x(i), y(value)]);
    const averagePoints = means.map((mean, i) => [x(i * 7 + 3), y(mean)]);
    const picture = [text('Loaves sold', LEFT, 17, C.muted, 'start')];

    for (const tick of [0, 25, 50, 75, 100]) {
      picture.push(rule(LEFT, y(tick), RIGHT, y(tick), C.line),
        text(tick, LEFT - 7, y(tick) + 5, C.muted, 'end'));
    }
    for (let i = 0; i < 4; i++) {
      const edge = LEFT + i * 7 * slot;
      picture.push(rule(edge, TOP, edge, BASE, C.line),
        text(`Week ${i + 1}`, x(i * 7 + 3), BASE + 24, C.muted));
    }
    picture.push(rule(RIGHT, TOP, RIGHT, BASE, C.line));
    picture.push(s('rect', {
      x: LEFT + selected * slot, y: TOP, width: slot, height: BASE - TOP,
      fill: C.cyan, 'fill-opacity': 0.095, rx: 3,
    }));
    picture.push(trace(dayPoints, C.cyan, 1.8, showMeans ? 0.65 : 1));
    dayPoints.forEach(([cx, cy], i) => picture.push(s('circle', {
      cx, cy, r: i === selected ? 4.5 : 2.7, fill: C.cyan,
      'fill-opacity': i === selected || !showMeans ? 1 : 0.76,
    })));

    if (showMeans) {
      picture.push(trace(averagePoints, C.amber, 2.7));
      averagePoints.forEach(([cx, cy]) => picture.push(
        s('circle', { cx, cy, r: 8, fill: C.amber, 'fill-opacity': 0.2 }),
        s('circle', { cx, cy, r: 4.8, fill: C.amber }),
      ));
    }
    picture.push(s('circle', {
      cx: x(selected), cy: y(values[selected]), r: 7.5,
      fill: 'none', stroke: C.cyan, 'stroke-width': 1.4,
    }));
    svg.replaceChildren(...picture);

    const dayName = DAYS[selected % 7];
    dayLabel.textContent = `Day ${selected + 1} · Week ${week + 1} ${dayName}`;
    salesLabel.textContent = `Daily sales · ${values[selected]} loaves`;
    selectDay.value = String(selected + 1);
    selectDay.setAttribute('aria-valuetext', dayLabel.textContent);
    editSales.value = String(values[selected]);
    editSales.setAttribute('aria-valuetext', `${values[selected]} loaves`);
    toggle.setAttribute('aria-pressed', String(showMeans));

    const lines = [
      [`Week ${week + 1} ${dayName} · ${values[selected]} loaves`, C.cyan],
    ];
    if (showMeans) {
      lines.push(
        `Week ${week + 1} average`,
        [`${totals[week]} ÷ 7 = ${fmt(means[week])} loaves/day`, C.amber],
        'Weekly averages · 1 to 4',
        [means.map(fmt).join(' → '), C.amber],
      );
    }
    fbox(box, lines);

    const weekTwo = weekValues(values, 1), originalWeekTwo = weekValues(initial, 1);
    state = {
      totals,
      originalWeekTwoTotal: total(originalWeekTwo),
      weekTwoChanges: weekTwo.filter((value, i) => value !== originalWeekTwo[i]).length,
      first: values[0],
      last: values[values.length - 1],
    };
    challenge.update(state);
  }

  draw();
  return () => listeners.abort();
}
