// 1.2.1 — Each customer contributes one tally to one minute row.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const morning = [3, 1, 4, 2, 3, 6, 2, 3];
  const minutes = [1, 2, 3, 4, 5, 6];
  let waits = morning.slice();
  let selected = 0;

  const formula = h('div', { 'aria-live': 'polite' });
  const challengePanel = h('div');
  const challenge = challenges(challengePanel, [
    {
      text: 'Make exactly two customers wait five minutes.',
      check: counts => counts[4] === 2,
      why: 'Two five-minute waits put two marks in the five-minute row.'
    },
    {
      text: 'Make four minutes the only wait that happens most often.',
      check: counts => counts.every((count, i) => i === 3 || count < counts[3]),
      why: 'The four-minute row has more marks than every other row.'
    },
    {
      text: 'Give four different wait times two customers each.',
      check: counts => counts.filter(count => count === 2).length === 4,
      why: 'Four rows of two account for all eight customers, leaving the other two rows empty.'
    }
  ]);

  const countWaits = () => minutes.map(minute => waits.filter(wait => wait === minute).length);
  // Recheck the current table when the kit moves to another challenge.
  challengePanel.addEventListener('click', () => challenge.update(countWaits()));

  const customerButtons = morning.map((_, i) => {
    const button = btn('', () => {
      selected = i;
      draw();
    });
    Object.assign(button.style, {
      display: 'grid', justifyItems: 'center', gap: '2px', padding: '7px 2px', minWidth: '0'
    });
    return button;
  });

  const prompt = h('div', { style: { fontWeight: '650', marginTop: '12px' } });
  // Tapping a minute changes just the selected entry. Keep keyboard focus on that button.
  const minuteButtons = minutes.map(minute => {
    const button = btn(String(minute), () => {
      waits[selected] = minute;
      draw();
    });
    button.setAttribute('aria-label', 'Set wait to ' + minute + (minute === 1 ? ' minute' : ' minutes'));
    Object.assign(button.style, { padding: '4px', minWidth: '0' });
    return button;
  });

  function newData() {
    const next = waits.map(() => rnd(1, 6));
    if (next.every((v, i) => v === waits[i])) {
      next[0] = next[0] % 6 + 1;
    }
    waits = next;
    selected = 0;
    draw();
  }

  // A diagonal fifth tally crosses four upright marks. The sixth starts a new group.
  function tallyPicture(count) {
    const svg = s('svg', {
      viewBox: '0 0 106 25', 'aria-hidden': 'true', focusable: 'false',
      style: 'max-width:112px;height:25px;margin:auto;touch-action:auto'
    });
    for (let i = 0; i < count; i++) {
      const within = i % 5;
      const x = 9 + 57 * Math.floor(i / 5);
      const common = { stroke: C.cyan, 'stroke-width': 3, 'stroke-linecap': 'round' };
      svg.append(within === 4
        ? s('line', { ...common, x1: x - 4, y1: 19, x2: x + 35, y2: 5 })
        : s('line', { ...common, x1: x + 10 * within, y1: 21, x2: x + 10 * within + 2, y2: 4 }));
    }
    return svg;
  }

  const cellStyle = { textAlign: 'center', padding: '5px 0', borderBottom: '1px solid ' + C.line };
  const rows = minutes.map(minute => {
    const marks = h('td', { style: cellStyle });
    const frequency = h('td', { style: { ...cellStyle, color: C.amber, fontWeight: '700' } });
    const row = h('tr', {}, h('th', { scope: 'row', style: cellStyle }, minute), marks, frequency);
    return { row, marks, frequency };
  });
  const table = h('table', {
    'aria-label': 'Frequency table for the eight customers',
    style: { width: '100%', borderCollapse: 'collapse', fontVariantNumeric: 'tabular-nums' }
  }, h('thead', {}, h('tr', {}, ...['Minutes', 'Tallies', 'Frequency'].map(label =>
    h('th', { scope: 'col', style: { ...cellStyle, color: C.muted, fontSize: '0.95em' } }, label)))),
  h('tbody', {}, ...rows.map(({ row }) => row)));

  function buttonGrid(buttons, columns, label) {
    return h('div', {
      role: 'group', 'aria-label': label,
      style: { display: 'grid', gridTemplateColumns: columns === 6
        ? 'repeat(auto-fit, minmax(min(44px, 100%), 1fr))'
        : 'repeat(4, minmax(0, 1fr))',
        gap: '5px', marginTop: '6px' }
    }, ...buttons);
  }

  const sim = h('div', { class: 'sim' },
    h('h2', {}, 'Try it: count the café waits'),
    h('p', { class: 'sub' }, 'Pick a customer in arrival order, then tap a minute to change their wait. Watch where their tally goes.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        buttonGrid(customerButtons, 4, 'Customers in arrival order'),
        prompt, buttonGrid(minuteButtons, 6, 'Wait in whole minutes'),
        h('div', { style: { marginTop: '16px' } }, table),
        h('div', { class: 'sim-row' }, btn('New data', newData, 'go'),
          btn('Morning shift', () => { waits = morning.slice(); selected = 0; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, formula),
        h('div', { class: 'sim-card' }, challengePanel))));
  root.append(sim);

  function setPressed(button, pressed) {
    button.setAttribute('aria-pressed', String(pressed));
    button.style.borderColor = pressed ? C.cyan : C.line;
    button.style.backgroundColor = pressed ? '#173044' : '';
  }

  function draw() {
    const counts = countWaits();
    customerButtons.forEach((button, i) => {
      button.replaceChildren(h('small', { style: { color: C.muted } }, 'No. ' + (i + 1)),
        h('span', {}, waits[i] + ' min'));
      button.setAttribute('aria-label', 'Customer ' + (i + 1) + ', ' + waits[i] + ' min');
      setPressed(button, i === selected);
    });
    const chosen = waits[selected];
    prompt.textContent = 'Wait for customer ' + (selected + 1) + ' (minutes)';
    minuteButtons.forEach((button, i) => setPressed(button, minutes[i] === chosen));
    rows.forEach(({ row, marks, frequency }, i) => {
      marks.replaceChildren(tallyPicture(counts[i]));
      frequency.textContent = String(counts[i]);
      row.style.backgroundColor = minutes[i] === chosen ? '#173044' : '';
    });
    const count = counts[chosen - 1];
    const total = counts.reduce((sum, value) => sum + value, 0);
    fbox(formula, [
      [chosen + ' min → ' + count + (count === 1 ? ' customer' : ' customers'), C.cyan],
      'Sum of frequencies',
      [counts.join(' + ') + ' = ' + total, C.amber]
    ]);
    challenge.update(counts);
  }

  draw();
  return () => sim.remove();
}
