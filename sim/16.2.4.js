// 16.2.4 Try it: send bakery tickets and see what checking the ID changes.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = [
    { id: 'A', shop: 'North', day: 'Monday', amount: 4, saved: true },
    { id: 'B', shop: 'North', day: 'Monday', amount: 8 },
    { id: 'C', shop: 'South', day: 'Monday', amount: 6, saved: true },
    { id: 'D', shop: 'South', day: 'Monday', amount: 10, saved: true },
    { id: 'E', shop: 'South', day: 'Monday', amount: 14, saved: true },
    { id: 'F', shop: 'North', day: 'Tuesday', amount: 8 },
    { id: 'G', shop: 'South', day: 'Tuesday', amount: 12 },
  ];
  const money = amount => `$${amount}`;
  const colorOf = ticket => ticket.shop === 'North' ? C.cyan : C.amber;
  const sent = new Map();
  let tickets = START;
  let selected = 'B';
  let last = null;
  let checkIDs = true;

  const svg = s('svg', { viewBox: '0 0 360 386', 'aria-hidden': 'true' });
  const box = h('div');
  const note = h('div', { class: 'sim-note', role: 'status', 'aria-atomic': 'true' });
  const savedList = h('ul', {
    style: { position: 'absolute', clipPath: 'inset(50%)', width: '1px', height: '1px', overflow: 'hidden' },
  });
  const ch = h('div');
  const picker = h('select', {
    onchange: event => {
      selected = event.target.value;
      draw();
    },
    style: {
      minHeight: '44px', maxWidth: '100%', font: 'inherit', color: C.ink,
      background: C.bg, border: '1px solid #536485', borderRadius: '.5rem', padding: '.4rem',
    },
  });
  const mode = h('input', {
    type: 'checkbox', checked: true,
    onchange: event => {
      checkIDs = event.target.checked;
      draw();
    },
    style: { width: '1.2rem', height: '1.2rem', margin: 0, accentColor: C.cyan },
  });
  const resend = btn('Resend last ticket', () => send(last));

  const panel = h('div', { class: 'sim' },
    h('h2', {}, 'Try it: count each sale once'),
    h('p', { class: 'sub' }, 'Send a ticket, then send it again. Turn the ID check off or on to see how the same deliveries change the saved table.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg, savedList,
        h('div', { class: 'sim-row' },
          h('label', { style: { display: 'grid', gap: '.25rem', width: '100%' } }, 'Ticket to send', picker)),
        h('div', { class: 'sim-row' }, btn('Send ticket', () => send(selected), 'go'), resend),
        h('div', { class: 'sim-row' },
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.65rem', minHeight: '44px' } },
            mode, 'Check ticket IDs')),
        h('div', { class: 'sim-row' },
          btn('Reset', reset),
          btn('New data', () => {
            const samePrice = rnd(3, 20);
            tickets = START.map(ticket => ({
              ...ticket,
              amount: ticket.id === 'B' || ticket.id === 'F' ? samePrice : rnd(3, 20),
            }));
            reset();
          }),
          btn('Bakery example', () => { tickets = START; reset(); }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch))));
  root.append(panel);

  const challenge = challenges(ch, [
    {
      text: 'Send ticket B with the ID check on.',
      check: st => st.checkIDs && st.sentB >= 1 && st.copiesB === 1,
      why: 'B is a new ticket ID, so the table saves one row and adds its amount to Monday.',
    },
    {
      text: 'Resend B with the ID check on.',
      check: st => st.checkIDs && st.sentB >= 2 && st.copiesB === 1,
      why: 'The saved table already has B, so the second delivery adds zero rows and zero dollars.',
    },
    {
      text: 'Turn the ID check off after sending B twice.',
      check: st => !st.checkIDs && st.copiesB >= 2,
      why: 'Without the check, the table adds B’s amount every time the same ticket arrives.',
    },
    {
      text: 'Turn the ID check on and save both B and F, which cost the same.',
      check: st => st.checkIDs && st.copiesB === 1 && st.copiesF === 1,
      why: 'B and F have the same price and different ticket IDs, so each belongs in the table.',
    },
  ]);

  function send(id) {
    if (!id) return;
    sent.set(id, (sent.get(id) || 0) + 1);
    last = id;
    draw();
  }

  function reset() {
    sent.clear();
    last = null;
    selected = 'B';
    checkIDs = true;
    mode.checked = true;
    picker.replaceChildren(...tickets.map(ticket =>
      h('option', { value: ticket.id }, `${ticket.id} · ${ticket.shop} · ${ticket.day} · ${money(ticket.amount)}`)));
    picker.value = selected;
    draw();
  }

  function copies(ticket) {
    const deliveries = Number(Boolean(ticket.saved)) + (sent.get(ticket.id) || 0);
    return checkIDs ? Math.min(1, deliveries) : deliveries;
  }

  function svgText(value, x, y, size, color = C.ink, attrs = {}) {
    return s('text', {
      x, y, fill: color, 'font-size': size, 'font-family': 'Consolas, monospace', ...attrs,
    }, String(value));
  }

  function drawTable(rows, next) {
    const x = [25, 66, 133, 244, 330];
    const art = [
      s('rect', { x: 12, y: 9, width: 336, height: 60, rx: 10, fill: C.bg, stroke: colorOf(next) }),
      svgText('TICKET TO SEND', 25, 31, 13, C.muted),
      svgText(`${next.id} · ${next.shop} · ${next.day} · ${money(next.amount)}`, 25, 54, 16, colorOf(next)),
      svgText('SAVED TICKETS', 14, 97, 15, C.ink),
      ...['ID', 'SHOP', 'SALE DAY', 'AMOUNT', 'COPIES'].map((title, i) =>
        svgText(title, x[i], 121, 12, C.muted, i >= 3 ? { 'text-anchor': 'end' } : {})),
    ];
    rows.forEach(({ ticket, n }, i) => {
      const y = 130 + i * 36;
      const color = colorOf(ticket);
      const duplicateColor = n > 1 ? C.pink : C.muted;
      art.push(
        s('rect', { x: 12, y, width: 336, height: 30, rx: 7, fill: C.bg, stroke: n > 1 ? C.pink : color }),
        svgText(ticket.id, x[0], y + 21, 16, color),
        svgText(ticket.shop, x[1], y + 21, 15),
        svgText(ticket.day, x[2], y + 21, 15),
        svgText(money(ticket.amount), x[3], y + 21, 16, color, { 'text-anchor': 'end' }),
        svgText(n, x[4], y + 21, 16, duplicateColor, { 'text-anchor': 'end' }),
      );
    });
    svg.setAttribute('viewBox', `0 0 360 ${140 + rows.length * 36}`);
    svg.replaceChildren(...art);
    savedList.replaceChildren(...rows.map(({ ticket, n }) => h('li', {},
      `Saved ticket ${ticket.id}, ${ticket.shop}, ${ticket.day}, ${money(ticket.amount)}, ${n} ${n === 1 ? 'copy' : 'copies'}`)));
  }

  function draw() {
    const rows = tickets.map(ticket => ({ ticket, n: copies(ticket) })).filter(row => row.n > 0);
    const next = tickets.find(ticket => ticket.id === selected);
    const lastTicket = tickets.find(ticket => ticket.id === last);
    const count = rows.reduce((sum, row) => sum + row.n, 0);
    const totals = { Monday: 0, Tuesday: 0 };
    rows.forEach(({ ticket, n }) => { totals[ticket.day] += n * ticket.amount; });

    drawTable(rows, next);
    resend.disabled = last === null;
    const lines = [
      `Saved records = ${count}`,
      `Monday total = ${money(totals.Monday)}`,
      `Tuesday total = ${money(totals.Tuesday)}`,
    ];
    let message = 'Choose a ticket and send it to the saved table.';
    if (lastTicket) {
      const earlierDelivery = lastTicket.saved || sent.get(last) > 1;
      const skipped = checkIDs && earlierDelivery;
      const added = skipped ? 0 : lastTicket.amount;
      const total = totals[lastTicket.day];
      lines.push([`${lastTicket.day}: ${money(total - added)} + ${money(added)} = ${money(total)}`,
        skipped ? C.green : earlierDelivery ? C.pink : C.cyan]);
      message = skipped
        ? `Ticket ${last} already exists, so the last delivery adds no row.`
        : earlierDelivery
          ? `The ID check is off, so another copy of ${last} adds ${money(added)} again.`
          : `Ticket ${last} adds one row and ${money(added)} to ${lastTicket.day}.`;
    }
    fbox(box, lines);
    note.textContent = message;

    challenge.update({
      checkIDs,
      sentB: sent.get('B') || 0,
      copiesB: rows.find(row => row.ticket.id === 'B')?.n || 0,
      copiesF: rows.find(row => row.ticket.id === 'F')?.n || 0,
    });
  }

  reset();
  return () => panel.remove();
}
