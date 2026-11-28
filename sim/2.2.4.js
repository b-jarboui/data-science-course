// 2.2.4 Try it: keep the readings and change the rulers.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;

  // Match the live scene and the heatmap lesson's daily profiles.
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const start = [
    [5, 25, 60, 35, 15, 15, 20, 18, 15, 18, 30, 55, 65, 35, 20, 10, 5],
    [6, 27, 62, 37, 17, 14, 19, 20, 17, 20, 32, 54, 63, 36, 19, 11, 6],
    [4, 23, 58, 33, 14, 16, 21, 17, 16, 19, 29, 56, 64, 33, 21, 9, 5],
    [7, 29, 63, 39, 16, 17, 22, 19, 17, 21, 34, 57, 65, 37, 22, 12, 6],
    [5, 24, 59, 34, 18, 19, 23, 21, 19, 23, 33, 52, 61, 39, 25, 15, 8],
    [3, 5, 8, 12, 18, 27, 36, 42, 45, 43, 38, 30, 22, 16, 12, 7, 4],
    [2, 4, 7, 11, 17, 25, 34, 41, 44, 45, 40, 31, 23, 17, 11, 6, 3],
  ];
  const limit = 70;
  const max = readings => Math.max(...readings);
  const resizePeak = (readings, peak) => {
    const oldPeak = max(readings);
    return readings.map(value => Math.round(value * peak / oldPeak));
  };

  let data = start.map(day => day.slice());
  let shared = false;
  let narrow = true;
  let sunPeak = max(start[6]);

  const svg = s('svg', { role: 'img' });
  const box = h('div', { 'aria-live': 'polite' });
  const ch = h('div');
  const range = h('input', { type: 'range', min: 20, max: 70, step: 1, value: sunPeak,
    style: { flex: '1 1 8rem', minHeight: '44px', accentColor: C.pink },
    oninput: () => {
      sunPeak = Number(range.value);
      draw();
    } });
  const readout = h('span', { style: { color: C.pink, fontWeight: 700 } });
  const sameButton = btn('Same limits', () => setMode(true));
  const ownButton = btn('Own limits', () => setMode(false));

  function setMode(value) {
    shared = value;
    draw();
  }

  function load(next) {
    data = next;
    sunPeak = max(data[6]);
    range.value = sunPeak;
    draw();
  }

  const sim = h('div', { class: 'sim' },
    h('h2', {}, 'Try it: small multiples'),
    h('p', { class: 'sub' }, 'Switch the rulers or move the slider to change how many bikes Sunday rents at its busiest hour.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Limits on the side rulers' },
          sameButton, ownButton,
          btn('New data', () => load(start.map((day, i) =>
            resizePeak(day, i < 5 ? rnd(55, 70) : rnd(30, 49))))),
          btn('Reset', () => {
            shared = false;
            load(start.map(day => day.slice()));
          }, 'ghost')),
        h('label', { class: 'sim-row' }, 'Sunday peak', range, readout)),
      h('div', {}, h('div', { class: 'sim-card' }, box), h('div', { class: 'sim-card' }, ch))));
  root.append(sim);

  const tasks = challenges(ch, [
    {
      text: 'Use the same limits so Sunday’s peak sits below Monday’s.',
      check: state => state.shared && state.sunPeak < state.monPeak,
      why: 'The two rulers go to 70, so the lower peak shows fewer bikes.',
    },
    {
      text: 'Set Sunday’s peak to 35 bikes, then use own limits so both peaks touch the top.',
      check: state => !state.shared && state.sunPeak === 35,
      why: 'Each peak touches the top because each ruler ends at that day’s peak.',
    },
    {
      text: 'Use the same limits and make Sunday’s peak the same height as Monday’s.',
      check: state => state.shared && state.sunPeak === state.monPeak,
      why: 'The peaks line up because both days rent the same number of bikes at their busiest hour.',
    },
  ]);

  function state() {
    return { shared, monPeak: max(data[0]), sunPeak };
  }

  // Recheck when the learner opens a challenge with settings already in place.
  ch.addEventListener('click', () => tasks.update(state()));

  const text = (x, y, content, fill = C.muted, size = 14, anchor = 'middle') => s('text', {
    x, y, fill, 'font-size': size, 'text-anchor': anchor, 'font-family': 'Consolas, monospace',
  }, content);

  function renderChart(readings, day, col, row, width, height) {
    const color = day < 5 ? C.amber : C.pink;
    const peak = max(readings), top = shared ? limit : peak;
    const pad = 27, gap = 13, rowHeight = height + 55;
    const x0 = pad + col * (width + gap), x1 = x0 + width;
    const y0 = 28 + row * rowHeight, y1 = y0 + height;
    const x = i => x0 + width * i / 16;
    const y = v => y1 - height * v / top;
    const coords = readings.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    const peakHour = readings.indexOf(peak);
    return s('g', {},
      text((x0 + x1) / 2, y0 - 10, days[day], color, 16),
      s('rect', { x: x0, y: y0, width, height, fill: C.bg, stroke: C.line, rx: 2 }),
      ...[0.25, 0.5, 0.75].map(f => s('line', {
        x1: x0, x2: x1, y1: y(top * f), y2: y(top * f), stroke: C.line,
      })),
      text(x0 - 5, y0 + 4, top, C.muted, 13, 'end'),
      text(x0 - 5, y1 + 4, '0', C.muted, 13, 'end'),
      text(x0, y1 + 18, '6'),
      text(x1, y1 + 18, '22'),
      s('polyline', {
        points: coords, fill: 'none', stroke: color, 'stroke-width': 4.5,
        'stroke-opacity': 0.16, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      }),
      s('polyline', {
        points: coords, fill: 'none', stroke: color, 'stroke-width': 1.7,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      }),
      ...readings.map((v, i) => s('circle', { cx: x(i), cy: y(v), r: 1.45, fill: color })),
      day === 0 || day === 6 ? s('circle', {
        cx: x(peakHour), cy: y(peak), r: 4, fill: 'none', stroke: color, 'stroke-width': 1.3,
      }) : null);
  }

  function draw() {
    const rows = narrow ? [[0, 1, 2], [3, 4], [5, 6]] : [[0, 1, 2, 3, 4], [5, 6]];
    const width = narrow ? 74 : 87, height = narrow ? 78 : 96;
    const viewWidth = 40 + rows[0].length * width + (rows[0].length - 1) * 13;
    const viewHeight = rows.length * (height + 55) + 1;
    const readings = [...data.slice(0, 6), resizePeak(data[6], sunPeak)];
    const monPeak = max(readings[0]);
    const monTop = shared ? limit : monPeak;
    const sunTop = shared ? limit : sunPeak;
    const mode = shared ? 'Same limits' : 'Own limits';

    svg.setAttribute('viewBox', `0 0 ${viewWidth} ${viewHeight}`);
    svg.setAttribute('aria-label',
      `${mode}. Seven daily charts span hours 6 to 22. Monday peaks at ${monPeak} of ${monTop} bikes. Sunday peaks at ${sunPeak} of ${sunTop} bikes.`);
    svg.replaceChildren(...rows.flatMap((row, rowIndex) =>
      row.map((day, col) => renderChart(readings[day], day, col, rowIndex, width, height))));

    sameButton.classList.toggle('go', shared);
    ownButton.classList.toggle('go', !shared);
    sameButton.setAttribute('aria-pressed', String(shared));
    ownButton.setAttribute('aria-pressed', String(!shared));
    readout.textContent = `${sunPeak} bikes`;
    range.setAttribute('aria-valuetext', `${sunPeak} bikes`);

    fbox(box, [
      `Monday peak: ${monPeak} bikes`,
      `Monday ruler: 0 to ${monTop}`,
      [`Sunday peak: ${sunPeak} bikes`, C.pink],
      [`Sunday ruler: 0 to ${sunTop}`, C.pink],
      'Hours on every panel: 6 to 22',
    ]);
    tasks.update(state());
  }

  narrow = (svg.clientWidth || root.clientWidth) < 480;
  draw();
  const resize = new ResizeObserver(([entry]) => {
    const next = entry.contentRect.width < 480;
    if (next !== narrow) {
      narrow = next;
      draw();
    }
  });
  resize.observe(svg);
  return () => resize.disconnect();
}
