// 16.2.6 Try it: compare one box with drawers labeled by shop and day.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const tickets = [
    ['A', 'North', 'Monday', 4],
    ['B', 'North', 'Monday', 8],
    ['C', 'South', 'Monday', 6],
    ['D', 'South', 'Monday', 10],
    ['E', 'South', 'Monday', 14],
    ['F', 'North', 'Tuesday', 8],
    ['G', 'South', 'Tuesday', 12],
  ];
  const initial = tickets.map(ticket => ticket[3]);
  const groups = [
    ['North', 'Monday', [0, 1]],
    ['South', 'Monday', [2, 3, 4]],
    ['North', 'Tuesday', [5]],
    ['South', 'Tuesday', [6]],
  ];

  let amounts = initial.slice();
  let layout = 'drawers';
  const width = 400;
  const svg = s('svg', {
    viewBox: `0 0 ${width} 294`,
    role: 'img',
    'aria-label': 'Sales tickets grouped by shop and day',
  });
  const formula = h('div');
  const note = h('p', { class: 'sim-note', role: 'status' });
  const challengeHost = h('div');

  function select(label, choices, change) {
    const field = h('select', {
      'aria-label': label,
      onchange: change,
      style: {
        minHeight: '44px', maxWidth: '100%', padding: '0.4rem',
        font: 'inherit', color: C.ink, background: C.bg,
        border: `1px solid ${C.muted}`, borderRadius: '0.4rem',
      },
    }, choices.map(choice => h('option', { value: choice }, choice)));
    return { field, label: h('label', {}, `${label} `, field) };
  }

  const shop = select('Shop', ['Both shops', 'North', 'South'], draw);
  const day = select('Day of sale', ['Both days', 'Monday', 'Tuesday'], draw);
  const ticket = select('Ticket', tickets.map(row => row[0]), syncAmount);
  const amountText = h('span');
  const amount = h('input', {
    type: 'range', min: 1, max: 24, step: 1, value: initial[0],
    'aria-label': 'Ticket amount',
    oninput: () => {
      amounts[ticket.field.selectedIndex] = Number(amount.value);
      draw();
    },
    style: { width: '100%', minHeight: '44px', accentColor: C.cyan },
  });
  const oneBox = btn('One box', () => setLayout('box'));
  const drawers = btn('Four drawers', () => setLayout('drawers'));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: which drawers can you skip?'),
    h('p', { class: 'sub' }, 'Choose the sales you want to total. Compare how many tickets the computer reads in one box and in four drawers.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row' }, shop.label, day.label),
        h('div', { class: 'sim-row' }, oneBox, drawers),
        svg,
        h('div', { class: 'sim-row' },
          btn('New data', newData, 'go'),
          btn('Reset', reset)),
        h('div', { class: 'sim-row' }, ticket.label),
        h('label', { style: { display: 'block', marginTop: '0.7rem' } }, amountText, amount)),
      h('div', {},
        h('div', { class: 'sim-card' }, formula, note),
        h('div', { class: 'sim-card' }, challengeHost)))));

  const chal = challenges(challengeHost, [
    {
      text: 'Use four drawers to find North’s Monday sales.',
      check: state => state.layout === 'drawers' && state.shop === 'North' && state.day === 'Monday',
      why: 'Only the North Monday drawer matches both labels, so the computer reads two tickets.',
    },
    {
      text: 'Use four drawers to find Tuesday’s sales for both shops.',
      check: state => state.layout === 'drawers' && state.shop === 'Both shops' && state.day === 'Tuesday',
      why: 'Both Tuesday drawers match, so both Monday drawers stay closed.',
    },
    {
      text: 'Use four drawers and choose a question that needs all seven tickets.',
      check: state => state.layout === 'drawers' && state.opened === 4,
      why: 'Both shops and both days match every drawer, so the computer reads all seven tickets.',
    },
    {
      text: 'Use one box to find North’s Monday sales.',
      check: state => state.layout === 'box' && state.shop === 'North' && state.day === 'Monday',
      why: 'The computer reads all seven tickets to find which two match.',
    },
  ]);

  function setLayout(next) {
    layout = next;
    draw();
  }

  function newData() {
    const next = amounts.map(() => rnd(1, 24));
    if (next.every((value, i) => value === amounts[i])) next[0] = next[0] % 24 + 1;
    amounts = next;
    syncAmount();
  }

  function reset() {
    amounts = initial.slice();
    layout = 'drawers';
    shop.field.selectedIndex = 0;
    day.field.selectedIndex = 0;
    ticket.field.selectedIndex = 0;
    syncAmount();
  }

  function syncAmount() {
    amount.value = amounts[ticket.field.selectedIndex];
    draw();
  }

  function rectangle(x, y, w, height, stroke, fill = C.bg, opacity = 1) {
    return s('rect', {
      x, y, width: w, height, rx: 7, stroke, fill, 'fill-opacity': opacity, 'stroke-width': 1.5,
    });
  }

  function text(x, y, words, color = C.ink, size = 14, weight = 600) {
    return s('text', {
      x, y, fill: color, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace',
      'font-size': size, 'font-weight': weight,
    }, words);
  }

  function slip(i, x, y, w, included) {
    const [id, seller, saleDay] = tickets[i];
    const color = seller === 'North' ? C.cyan : C.amber;
    return s('g', {},
      rectangle(x, y, w, 61, included ? color : C.muted, included ? color : C.bg, included ? 0.12 : 1),
      text(x + w / 2, y + 17, `${id} $${amounts[i]}`, included ? color : C.ink, 15, 700),
      text(x + w / 2, y + 35, seller, C.ink, 12, 400),
      text(x + w / 2, y + 51, saleDay, C.ink, 12, 400));
  }

  function drawBox(matches) {
    return [
      rectangle(11, 17, 378, 246, C.muted),
      text(200, 49, 'One box · 7 tickets read', C.ink, 17, 700),
      ...tickets.map((_, i) => {
        const column = i < 4 ? i : i - 4;
        return slip(i, (i < 4 ? 36 : 78) + column * 84, i < 4 ? 78 : 161, 76, matches[i]);
      }),
    ];
  }

  function drawDrawers(open) {
    return groups.map(([seller, saleDay, ids], i) => {
      const x = 11 + (i % 2) * 193;
      const y = 17 + Math.floor(i / 2) * 127;
      const color = open[i] ? (seller === 'North' ? C.cyan : C.amber) : C.muted;
      return s('g', {},
        rectangle(x, y, 185, 118, color),
        text(x + 92.5, y + 23, `${seller} · ${saleDay}`, open[i] ? color : C.ink, 16, 700),
        open[i]
          ? ids.map((id, j) => slip(id, x + (185 - (ids.length * 56 + (ids.length - 1) * 4)) / 2 + j * 60,
            y + 40, 56, true))
          : text(x + 92.5, y + 68, 'Skipped', C.ink, 15));
    });
  }

  function draw() {
    const selectedShop = shop.field.value;
    const selectedDay = day.field.value;
    const matchesQuery = (seller, saleDay) =>
      (selectedShop === 'Both shops' || seller === selectedShop) &&
      (selectedDay === 'Both days' || saleDay === selectedDay);

    const open = groups.map(([seller, saleDay]) => matchesQuery(seller, saleDay));
    const matches = tickets.map(([, seller, saleDay]) => matchesQuery(seller, saleDay));
    const values = amounts.filter((_, i) => matches[i]);
    const total = values.reduce((sum, value) => sum + value, 0);
    const partitioned = layout === 'drawers';
    const opened = partitioned ? open.filter(Boolean).length : 1;
    const skipped = partitioned ? groups.length - opened : 0;
    const reads = partitioned ? values.length : tickets.length;

    oneBox.classList.toggle('go', !partitioned);
    drawers.classList.toggle('go', partitioned);
    oneBox.setAttribute('aria-pressed', String(!partitioned));
    drawers.setAttribute('aria-pressed', String(partitioned));
    svg.setAttribute('aria-label', `${partitioned ? 'Four drawers' : 'One box'}. ${reads} tickets read. ${skipped} drawers skipped.`);
    svg.replaceChildren(...(partitioned ? drawDrawers(open) : drawBox(matches)));

    fbox(formula, [
      `${selectedShop} · ${selectedDay}`,
      [`${values.map(value => `$${value}`).join(' + ')} = $${total}`, C.amber],
      `Tickets read: ${reads} of ${tickets.length}`,
      ...(partitioned ? [`Drawers opened: ${opened} of 4`, `Drawers skipped: ${skipped}`] : []),
    ]);
    note.textContent = partitioned
      ? skipped ? 'Only the drawers with matching labels are open.' : 'Every drawer has a matching label.'
      : 'The computer checks every ticket in the box and adds the tickets that match.';
    const selectedTicket = ticket.field.selectedIndex;
    amountText.textContent = `Ticket ${tickets[selectedTicket][0]} amount · $${amounts[selectedTicket]}`;
    amount.setAttribute('aria-valuetext', `$${amounts[selectedTicket]}`);
    chal.update({ layout, shop: selectedShop, day: selectedDay, opened });
  }

  draw();
  return () => {};
}
