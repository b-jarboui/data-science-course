// 11.1.1 Try it: keep a date slot for every day in a bakery week.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const START = [40, 40, null, 0, 55, 70, 55];
  let sales = START.slice();
  let selected = 2;
  let preview = false;
  let randomWeek = false;

  const svg = s('svg', {
    viewBox: '0 0 400 270',
    role: 'img',
    'aria-label': 'Bakery sales, one slot per day'
  });
  const box = h('div');
  const challengeHost = h('div');
  const status = h('p', { class: 'sim-note', 'aria-live': 'polite' });
  const picker = h('select', { 'aria-label': 'Choose a day', style: { minHeight: '44px' } },
    DAYS.map((day, i) => h('option', { value: i }, day)));
  const amount = h('input', { type: 'range', min: 1, max: 90, value: 40, 'aria-label': 'Loaves sold' });
  const zeroButton = btn('Record 0', () => setSale(0));
  const blankButton = btn('Leave blank', () => setSale(null));
  const pretend = btn('Try filling gaps with 0', () => {
    preview = !preview;
    draw();
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: give every date a slot'),
    h('p', { class: 'sub' },
      'Tap a day on the chart or choose it below. Move the slider to record sales. Use “Record 0” for a day with no sales or “Leave blank” for a day with unknown sales.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, picker, h('label', {}, 'Loaves sold ', amount)),
        h('div', { class: 'sim-row' }, zeroButton, blankButton, pretend),
        h('div', { class: 'sim-row' },
          btn('New data', newData, 'go'),
          btn('Winter week', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, status),
        h('div', { class: 'sim-card' }, challengeHost)))));

  const chal = challenges(challengeHost, [
    {
      text: 'Give Wednesday a recorded zero and keep Thursday at zero.',
      check: st => st.sales[2] === 0 && st.sales[3] === 0,
      why: 'Both dates now have a recorded zero, so each has a dot on the zero line.'
    },
    {
      text: 'Restore the winter week’s Wednesday gap and keep Thursday at zero.',
      check: st => st.sales[2] === null && st.sales[3] === 0 && !st.preview,
      why: 'Wednesday has an empty slot because its sales are unknown, and Thursday still has a dot at zero.'
    },
    {
      text: 'Try filling an empty slot with a pretend zero.',
      check: st => st.preview && st.missing > 0,
      why: 'The pretend zero adds a dot and divides the same recorded total across more days.'
    },
    {
      text: 'Press “New data” and make sure all seven days have a real recorded number.',
      check: st => st.randomWeek && st.missing === 0,
      why: 'Every day has a number now, so the recorded total is the total for the whole week.'
    }
  ]);

  const LEFT = 43, RIGHT = 393, BASE = 221, TOP = 36;
  const slot = (RIGHT - LEFT) / DAYS.length;
  const xFor = i => LEFT + (i + 0.5) * slot;
  const yFor = value => BASE - value / 90 * (BASE - TOP);

  function setSale(value) {
    sales[selected] = value;
    draw();
  }

  function newData() {
    sales = DAYS.map(() => rnd(20, 85));
    selected = rnd(0, DAYS.length - 1);
    sales[selected] = null;
    sales[(selected + rnd(1, DAYS.length - 1)) % DAYS.length] = 0;
    randomWeek = true;
    preview = false;
    draw();
  }

  function reset() {
    sales = START.slice();
    selected = 2;
    randomWeek = false;
    preview = false;
    draw();
  }

  function selectDay(i) {
    selected = i;
    draw();
  }

  const events = new AbortController();
  const on = (target, name, handler) =>
    target.addEventListener(name, handler, { signal: events.signal });
  on(picker, 'change', () => selectDay(Number(picker.value)));
  on(amount, 'input', () => setSale(Number(amount.value)));
  on(svg, 'click', event => {
    const target = event.target.closest('[data-day]');
    if (target) selectDay(Number(target.getAttribute('data-day')));
  });

  function label(x, y, text, fill = C.ink, size = 15, anchor = 'middle') {
    return s('text', { x, y, fill, 'font-size': size, 'text-anchor': anchor,
      'font-family': 'Consolas, monospace' }, text);
  }

  function draw() {
    const values = sales.filter(value => value !== null);
    const missing = DAYS.length - values.length;
    const total = values.reduce((sum, value) => sum + value, 0);
    const shown = sales.map(value => value === null && preview ? 0 : value);
    const marks = [label(LEFT, 20, 'Loaves sold', C.ink, 15, 'start')];

    for (const value of [0, 30, 60, 90]) {
      const y = yFor(value);
      marks.push(s('line', { x1: LEFT, x2: RIGHT, y1: y, y2: y, stroke: value === 0 ? C.muted : C.line }),
        label(LEFT - 8, y + 5, String(value), C.muted, 14, 'end'));
    }

    sales.forEach((value, i) => {
      const x = xFor(i);
      const color = value === null ? C.violet : value === 0 ? C.amber : C.cyan;
      marks.push(s('rect', { x: x - slot / 2 + 3, y: TOP - 9,
        width: slot - 6, height: BASE - TOP + 38, rx: 5,
        fill: i === selected ? C.line : 'none', 'fill-opacity': 0.47,
        stroke: i === selected || value === null ? color : C.line,
        'stroke-width': i === selected ? 2 : 1,
        'stroke-dasharray': value === null ? '4 4' : null }));
    });

    shown.forEach((value, i) => {
      if (i === 0 || value === null || shown[i - 1] === null) return;
      const assumed = sales[i] === null || sales[i - 1] === null;
      marks.push(s('line', {
        x1: xFor(i - 1), x2: xFor(i), y1: yFor(shown[i - 1]), y2: yFor(value),
        stroke: assumed ? C.pink : C.cyan, 'stroke-width': 2,
        'stroke-dasharray': assumed ? '5 4' : null
      }));
    });

    shown.forEach((value, i) => {
      const x = xFor(i);
      const assumed = sales[i] === null;
      const color = assumed ? C.pink : value === 0 ? C.amber : C.cyan;
      if (value !== null) {
        const y = yFor(value);
        marks.push(s('circle', { cx: x, cy: y, r: 8,
          fill: color, 'fill-opacity': 0.19 }),
        s('circle', { cx: x, cy: y, r: 4.5, fill: assumed ? C.card : color,
          stroke: color, 'stroke-width': 2 }),
        label(x, y - 11, assumed ? '0?' : String(value), color));
      }
      marks.push(label(x, BASE + 23, SHORT[i], assumed ? C.violet : C.ink),
        s('rect', { x: x - slot / 2, y: TOP - 10, width: slot, height: BASE - TOP + 41,
          fill: 'transparent', 'data-day': i, style: 'cursor: pointer' }));
    });

    svg.replaceChildren(...marks);
    svg.setAttribute('aria-label', `Loaves sold by day. ${DAYS.map((day, i) => {
      if (sales[i] !== null) return `${day}: ${sales[i]}`;
      return preview ? `${day}: unknown, showing a pretend zero` : `${day}: unknown`;
    }).join('; ')}.`);
    picker.value = String(selected);
    const value = sales[selected];
    amount.value = String(value > 0 ? value : 1);
    pretend.setAttribute('aria-pressed', String(preview));

    const terms = values.length ? values.join(' + ') : 'No recorded numbers';
    const lines = [
      terms,
      [`Recorded total = ${total} loaves`, C.cyan],
      [`Days recorded = ${values.length} of 7`, C.ink],
      missing
        ? [`Week total = ${total} + unknown sales`, C.violet]
        : [`Week total = ${total} loaves`, C.green]
    ];
    if (preview && missing) {
      lines.push([`With pretend zeros: ${total} ÷ 7 ≈ ${fmt(total / 7)}`, C.pink]);
    }
    fbox(box, lines);
    status.textContent = value === null
      ? `${DAYS[selected]}: sales unknown.${preview ? ' The pink zero is pretend.' : ''}`
      : `${DAYS[selected]}: ${value} loaves sold.`;
    chal.update({ sales, missing, preview, randomWeek });
  }

  draw();
  return () => events.abort();
}
