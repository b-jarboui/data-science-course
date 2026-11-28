// 11.1.3 Try it. Change the bakery's sales and see which cycle lines up.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = [
    [37, 39, 43, 52, 54, 67, 58],
    [44, 44, 52, 56, 63, 75, 65],
    [51, 53, 58, 63, 71, 80, 72],
    [58, 58, 65, 71, 78, 88, 79],
  ];
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const COLORS = [C.cyan, C.pink, C.violet, C.green, C.amber, C.cyan, C.pink];
  const MIN = 20, MAX = 110;
  let sales = START.flat(), period = 5, stacked = false, selected = 5, randomized = false;

  const svg = s('svg', { viewBox: '0 0 400 276', role: 'img' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const challengeHost = h('div');
  const options = values => values.map(([value, name]) => h('option', { value }, name));
  const cycle = h('select', { class: 'sim-btn', onchange: () => {
    period = Number(cycle.value);
    stacked = true;
    draw();
  } }, options(Array.from({ length: 7 }, (_, i) => [i + 4, `${i + 4} days`])));
  const week = h('select', { class: 'sim-btn', onchange: selectDate },
    options(START.map((_, i) => [i, `Week ${i + 1}`])));
  const day = h('select', { class: 'sim-btn', onchange: selectDate },
    options(DAYS.map((name, i) => [i, name])));
  const slider = h('input', {
    type: 'range', min: MIN, max: MAX, step: 1, 'aria-label': 'Loaves sold on the selected day',
    oninput: () => setSale(Number(slider.value)),
    style: { width: '100%', minHeight: '44px', accentColor: C.cyan },
  });
  const view = btn('Stack cycles', () => {
    stacked = !stacked;
    draw();
  }, 'go');
  const reset = btn('Reset', () => {
    sales = START.flat();
    period = 5;
    stacked = false;
    selected = 5;
    randomized = false;
    draw();
  });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: find the repeating week'),
    h('p', { class: 'sub' }, 'Try different cycle lengths to see when the peaks line up. Tap a dot or choose a date, then move the slider to change its sales.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, h('label', {}, 'Cycle length ', cycle), view),
        h('div', { class: 'sim-row' }, h('label', {}, 'Week ', week), h('label', {}, 'Day ', day)),
        h('div', { class: 'sim-row' }, slider,
          btn('−1 loaf', () => setSale(sales[selected] - 1)),
          btn('+1 loaf', () => setSale(sales[selected] + 1))),
        h('div', { class: 'sim-row' }, btn('New data', newData), reset)),
      h('div', {}, h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengeHost)))));

  const check = challenges(challengeHost, [
    {
      text: 'Stack the sales so all the Saturday peaks line up.',
      check: state => state.aligned,
      why: 'A 7-day cut puts the same weekday in the same column in every slice.',
    },
    {
      text: 'Keep the weeks stacked and make Week 1 Saturday sell exactly 35 more loaves than its Monday.',
      check: state => state.aligned && state.firstGap === 35,
      why: 'Week 1 now has a 35-loaf gap between Saturday and Monday.',
    },
    {
      text: 'Press New data, stack 7-day cycles, and select Week 2 Sunday to compare it with the previous Sunday.',
      check: state => state.randomized && state.aligned && state.selected === 13,
      why: 'Comparing two Sundays keeps the weekday the same, so the difference measures a change across weeks.',
    },
  ]);

  const X0 = 43, X1 = 380, TOP = 34, BASE = 229;
  const y = value => BASE - (value - MIN) * (BASE - TOP) / (MAX - MIN);
  const x = index => {
    const count = stacked ? period : sales.length;
    const slot = stacked ? index % period : index;
    return X0 + 8 + slot * (X1 - X0 - 16) / (count - 1);
  };
  const color = index => COLORS[Math.floor(index / (stacked ? period : 7))];
  const signed = value => value < 0 ? `−${-value}` : `+${value}`;
  const clamp = value => Math.max(MIN, Math.min(MAX, value));

  function selectDate() {
    selected = Number(week.value) * 7 + Number(day.value);
    draw();
  }

  function setSale(value) {
    sales[selected] = clamp(value);
    draw();
  }

  function newData() {
    const base = rnd(32, 51);
    const rise = rnd(3, 8);
    const shape = [0, rnd(0, 3), rnd(4, 8), rnd(9, 13), rnd(14, 18), rnd(26, 32), rnd(18, 22)];
    sales = START.flatMap((_, w) => shape.map(extra => base + w * rise + extra + rnd(-2, 2)));
    period = 5;
    stacked = false;
    selected = 5;
    randomized = true;
    draw();
  }

  function selectDot(event) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const p = point.matrixTransform(matrix.inverse());
    let closest = 18;
    let hit = selected;
    sales.forEach((value, i) => {
      const distance = Math.hypot(x(i) - p.x, y(value) - p.y);
      if (distance < closest) {
        closest = distance;
        hit = i;
      }
    });
    if (hit !== selected) {
      selected = hit;
      draw();
    }
  }
  svg.addEventListener('click', selectDot);

  function svgText(text, px, py, attrs = {}) {
    return s('text', {
      x: px, y: py, fill: C.muted, 'font-size': 14, 'text-anchor': 'middle', ...attrs,
    }, text);
  }

  function draw() {
    const w = Math.floor(selected / 7), d = selected % 7;
    const aligned = stacked && period === 7;
    const items = [svgText('Loaves sold', X0, 20, { 'text-anchor': 'start', fill: C.ink })];
    for (const value of [20, 40, 60, 80, 100]) {
      const py = y(value);
      items.push(
        s('line', { x1: X0, x2: X1, y1: py, y2: py, stroke: C.line }),
        svgText(value, X0 - 7, py + 5, { 'text-anchor': 'end' }),
      );
    }
    if (stacked) {
      for (let i = 0; i < period; i++) {
        items.push(s('line', { x1: x(i), x2: x(i), y1: TOP, y2: BASE, stroke: C.line }));
        items.push(svgText(aligned ? DAYS[i].slice(0, 3) : i + 1, x(i), BASE + 24));
      }
      if (!aligned) items.push(svgText('Day in the cycle', (X0 + X1) / 2, BASE + 44));
    } else {
      START.forEach((_, i) => {
        items.push(svgText(`Week ${i + 1}`, x(i * 7 + 3), BASE + 24, { fill: COLORS[i] }));
      });
    }

    sales.forEach((value, i) => {
      if (i === 0 || (stacked && i % period === 0)) return;
      items.push(s('line', {
        x1: x(i - 1), x2: x(i), y1: y(sales[i - 1]), y2: y(value),
        stroke: color(i), 'stroke-width': 2.7, 'stroke-linecap': 'round',
      }));
    });
    sales.forEach((value, i) => {
      items.push(s('circle', { cx: x(i), cy: y(value), r: 3.6, fill: color(i) }));
    });
    items.push(s('circle', {
      cx: x(selected), cy: y(sales[selected]), r: 7, fill: 'none', stroke: C.amber, 'stroke-width': 2.1,
    }));
    svg.replaceChildren(...items);
    svg.setAttribute('aria-label',
      `${stacked ? `${period}-day cycles stacked` : 'Four weeks in date order'}. ` +
      `Selected Week ${w + 1}, ${DAYS[d]}, ${sales[selected]} loaves.`);

    const monday = sales[w * 7], saturday = sales[w * 7 + 5];
    const previous = w > 0 ? sales[selected - 7] : null;
    const rows = [
      [`Week ${w + 1} ${DAYS[d]}: ${sales[selected]} loaves`, C.amber],
      '',
      'Saturday minus Monday',
      `${saturday} − ${monday} = ${saturday - monday} loaves`,
    ];
    if (previous !== null) {
      rows.push('', `Change since last ${DAYS[d]}`, [
        `${sales[selected]} − ${previous} = ${signed(sales[selected] - previous)} loaves`, C.green,
      ]);
    }
    fbox(box, rows);
    note.textContent = aligned
      ? 'Each column compares the same weekday across four weeks.'
      : stacked
        ? 'Look at which columns the Saturday peaks land in. Try a different cycle length to line them up.'
        : 'The dots are in date order. Stack cycles to compare their shapes.';
    cycle.value = String(period);
    week.value = String(w);
    day.value = String(d);
    slider.value = String(sales[selected]);
    slider.setAttribute('aria-valuetext', `${sales[selected]} loaves`);
    view.textContent = stacked ? 'See timeline' : 'Stack cycles';
    check.update({ aligned, firstGap: sales[5] - sales[0], randomized, selected });
  }

  draw();
  return () => svg.removeEventListener('click', selectDot);
}
