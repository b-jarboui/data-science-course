// 2.2.5 Try it: read a heatmap and change the counts behind a square.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 17 }, (_, i) => i + 6);
  const week = [
    [5, 25, 60, 35, 15, 15, 20, 18, 15, 18, 30, 55, 65, 35, 20, 10, 5],
    [6, 27, 62, 37, 17, 14, 19, 20, 17, 20, 32, 54, 63, 36, 19, 11, 6],
    [4, 23, 58, 33, 14, 16, 21, 17, 16, 19, 29, 56, 64, 33, 21, 9, 5],
    [7, 29, 63, 39, 16, 17, 22, 19, 17, 21, 34, 57, 65, 37, 22, 12, 6],
    [5, 24, 59, 34, 18, 19, 23, 21, 19, 23, 33, 52, 61, 39, 25, 15, 8],
    [3, 5, 8, 12, 18, 27, 36, 42, 45, 43, 38, 30, 22, 16, 12, 7, 4],
    [2, 4, 7, 11, 17, 25, 34, 41, 44, 45, 40, 31, 23, 17, 11, 6],
  ];
  const clamp = value => Math.max(0, Math.min(65, value));
  const hourName = hour => `${hour % 12 || 12} ${hour < 12 ? 'am' : 'pm'}`;

  function shade(value) {
    const low = [24, 37, 74], high = [90, 215, 232];
    const t = clamp(value) / 65;
    const rgb = low.map((v, i) => Math.round(v + (high[i] - v) * t).toString(16).padStart(2, '0'));
    return '#' + rgb.join('');
  }

  function makeData(random = false) {
    return week.map((row, i) => row.map((base, j) => {
      const mean = random ? clamp(base + rnd(-6, 6)) : base;
      const spread = !random && i === 0 && j === 2 ? 5 : Math.min(3, mean, 65 - mean);
      return { counts: [mean - spread, mean, mean + spread], blank: i === 6 && j === 16 };
    }));
  }

  const sum = cell => cell.counts.reduce((total, count) => total + count, 0);
  let grid = makeData(), day = 0, col = 0;
  const current = () => grid[day][col];

  const svg = s('svg', { viewBox: '0 0 410 251', role: 'img',
    'aria-label': 'Weekly heatmap. Use the day and hour menus to select a square with the keyboard.',
    style: 'touch-action: manipulation;' });
  const box = h('div'), challengePanel = h('div');
  const title = h('h3', { style: { marginTop: 0 } });
  const big = { minHeight: '44px', maxWidth: '100%', font: 'inherit', color: C.ink,
    background: C.bg, border: '1px solid #536485', borderRadius: '0.45rem', padding: '0.3rem' };

  function menu(name, values, pretty, onChange) {
    const select = h('select', { style: big, 'aria-label': name },
      values.map((v, i) => h('option', { value: i }, pretty(v))));
    select.addEventListener('change', () => onChange(Number(select.value)));
    return select;
  }

  const dayMenu = menu('Day', days, v => v, i => { day = i; draw(); });
  const hourMenu = menu('Hour', hours, hourName, i => { col = i; draw(); });
  const weekMenu = menu('Week to edit', [1, 2, 3], n => `Week ${n}`, draw);
  const slider = h('input', { type: 'range', min: 0, max: 65, step: 1, 'aria-label': 'Rentals in the selected week',
    style: { minHeight: '44px', width: '100%', accentColor: C.cyan } });
  const countLabel = h('span', {});
  slider.addEventListener('input', () => {
    current().counts[Number(weekMenu.value)] = Number(slider.value);
    draw();
  });
  const blank = btn('Clear record', () => { current().blank = !current().blank; draw(); });

  const app = h('div', { class: 'sim' },
    h('h2', {}, 'Try it: read the heatmap'),
    h('p', { class: 'sub' }, 'Pick a square to see the counts behind its color. Change the count for one week and watch the square.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          h('label', {}, 'Day ', dayMenu), h('label', {}, 'Hour ', hourMenu)),
        h('div', { class: 'sim-row' },
          btn('New data', () => { grid = makeData(true); draw(); }, 'go'),
          btn('Start again', () => { grid = makeData(); day = 0; col = 0; weekMenu.value = '0'; draw(); }))),
      h('div', {},
        h('div', { class: 'sim-card' }, title, box,
          h('div', { class: 'sim-row' }, weekMenu, countLabel), slider,
          h('div', { class: 'sim-row' }, blank)),
        h('div', { class: 'sim-card' }, challengePanel))));
  root.append(app);

  const chal = challenges(challengePanel, [
    { text: 'Select Monday at 8 am.',
      check: st => st.day === 0 && st.col === 2,
      why: 'The Monday row and the 8 am column meet at the selected square.' },
    { text: 'Change the Monday 8 am counts until the mean is exactly 53.',
      check: st => !st.grid[0][2].blank && sum(st.grid[0][2]) === 159,
      why: 'The three counts add to 159, which gives 53 when shared equally across three Mondays.' },
    { text: 'Clear the record for Wednesday at noon.',
      check: st => st.grid[2][6].blank,
      why: 'The blank square means the station has no record for that hour.' },
  ]);

  // The challenge toolkit checks the active challenge. Recheck when its navigation moves.
  challengePanel.addEventListener('click', updateChallenge);
  function updateChallenge() {
    chal.update({ grid, day, col });
  }

  const X = 37, Y = 27, STEP = 21, TILE = 19;
  const KEY_X = 48, KEY_Y = 199, KEY_WIDTH = 208;

  function text(value, x, y, size, fill = C.ink, anchor = 'middle') {
    return s('text', { x, y, fill, 'font-size': size, 'text-anchor': anchor,
      'font-family': 'Consolas, monospace' }, value);
  }

  const key = [
    text('Mean rentals', KEY_X, KEY_Y - 7, 13, C.ink, 'start'),
    ...Array.from({ length: 65 }, (_, i) =>
      s('rect', { x: KEY_X + i * KEY_WIDTH / 65, y: KEY_Y, width: KEY_WIDTH / 65 + 0.04,
        height: 13, fill: shade(i + 0.5) })),
    ...[0, 15, 30, 45, 65].map(v => text(v, KEY_X + v * KEY_WIDTH / 65, KEY_Y + 30, 12)),
    s('rect', { x: 276, y: KEY_Y, width: 13, height: 13, fill: C.bg, stroke: '#536485' }),
    text('No record', 295, KEY_Y + 11, 12, C.ink, 'start'),
  ];

  svg.addEventListener('click', event => {
    const square = event.target.closest('[data-cell]');
    if (!square) return;
    const index = Number(square.getAttribute('data-cell'));
    day = Math.floor(index / hours.length);
    col = index % hours.length;
    draw();
  });

  function draw() {
    const headers = [
      ...hours.map((hour, j) => text(hour, X + j * STEP + TILE / 2, 19, 12, j === col ? C.amber : C.ink)),
      ...days.map((name, i) => text(name, X - 6, Y + i * STEP + 14, 12, i === day ? C.amber : C.ink, 'end')),
    ];
    const squares = grid.flatMap((row, i) => row.map((cell, j) => {
      const selected = i === day && j === col;
      return s('rect', {
        x: X + j * STEP, y: Y + i * STEP, width: TILE, height: TILE, rx: 1,
        fill: cell.blank ? C.bg : shade(sum(cell) / 3),
        stroke: selected ? C.amber : cell.blank ? '#536485' : C.line,
        'stroke-width': selected ? 2 : 0.75, 'data-cell': i * hours.length + j, cursor: 'pointer',
      });
    }));
    svg.replaceChildren(...headers, ...squares, ...key);

    const selected = current();
    const when = `${days[day]} · ${hourName(hours[col])}`;
    const count = selected.counts[Number(weekMenu.value)];
    dayMenu.value = String(day);
    hourMenu.value = String(col);
    title.textContent = when;
    weekMenu.disabled = selected.blank;
    slider.disabled = selected.blank;
    slider.value = String(count);
    countLabel.textContent = selected.blank ? '' : `${count} rentals`;
    blank.textContent = selected.blank ? 'Restore record' : 'Clear record';
    fbox(box, selected.blank ? [['No record', C.amber]] : [
      `${selected.counts.join(' + ')} = ${sum(selected)}`,
      [`Mean = ${sum(selected)} ÷ 3 = ${fmt(sum(selected) / 3)}`, C.cyan],
    ]);
    updateChallenge();
  }

  draw();
  return () => app.remove();
}
