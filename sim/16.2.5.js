// 16.2.5 Try it: open the blocks needed for a sales question.
export default function mount(root, kit) {
  const { h, C, btn, fbox, rnd, challenges } = kit;
  const fields = ['Ticket ID', 'Shop', 'Time of sale', 'Amount'];
  const start = [
    ['A', 'North', '9 a.m.', 4],
    ['B', 'North', '11 a.m.', 8],
    ['C', 'South', '10 a.m.', 6],
    ['D', 'South', 'Noon', 10],
    ['E', 'South', '2 p.m.', 14],
  ];
  let tickets = start.map(ticket => [...ticket]);
  let layout = 'rows';
  const selected = new Set([3]);

  const picture = h('div', { 'aria-label': 'Monday sales blocks' });
  const box = h('div', { 'aria-live': 'polite', 'aria-atomic': 'true' });
  const ch = h('div');
  const picker = h('select', { class: 'sim-btn', 'aria-label': 'Ticket to edit' },
    start.map(([id], i) => h('option', { value: i }, `Ticket ${id}`)));
  const minus = btn('−$1', () => adjust(-1));
  const plus = btn('+$1', () => adjust(1));
  minus.setAttribute('aria-label', 'Decrease the selected amount by one dollar');
  plus.setAttribute('aria-label', 'Increase the selected amount by one dollar');
  picker.addEventListener('change', draw);

  const layoutButtons = [
    ['rows', btn('Row storage', () => { layout = 'rows'; draw(); })],
    ['columns', btn('Columnar storage', () => { layout = 'columns'; draw(); })],
  ];
  const fieldButtons = fields.map((field, i) => btn(field, () => {
    if (selected.has(i)) selected.delete(i);
    else selected.add(i);
    draw();
  }));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: which blocks open?'),
    h('p', { class: 'sub' },
      'Choose the fields you want from Monday’s sales, then switch storage layouts to see what each one reads.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Storage layout', style: { marginTop: '0' } },
          layoutButtons.map(([, button]) => button)),
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Fields to read' }, fieldButtons),
        h('p', { class: 'sim-note' }, 'Green values answer your question. Closed blocks stay unread.'),
        picture,
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Edit a sale' },
          picker, minus, plus),
        h('div', { class: 'sim-row' },
          btn('New data', newData),
          btn('Restore Monday’s example', () => {
            tickets = start.map(ticket => [...ticket]);
            draw();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' }, ch)))));

  const challenge = challenges(ch, [
    {
      text: 'Read only Amount by opening one block.',
      check: st => st.layout === 'columns' && st.amountOnly && st.open === 1,
      why: 'All five amounts are together in the Amount block.',
    },
    {
      text: 'Open exactly two blocks to read Shop and Time of sale.',
      check: st => st.layout === 'columns' && st.shopAndTime && st.open === 2,
      why: 'Shop and Time of sale each have their own block.',
    },
    {
      text: 'In columnar storage, ask for every field so that both layouts read the same number of values.',
      check: st => st.layout === 'columns' && st.count === fields.length && st.rowValues === st.columnValues,
      why: 'Both layouts read every value when your question needs all four fields.',
    },
  ]);

  function adjust(delta) {
    tickets[Number(picker.value)][3] += delta;
    draw();
  }

  function newData() {
    tickets = tickets.map(([id, shop, time, oldAmount]) => {
      const amount = rnd(1, 39);
      return [id, shop, time, amount >= oldAmount ? amount + 1 : amount];
    });
    draw();
  }

  const tracks = 'minmax(0, 0.85fr) minmax(0, 0.95fr) minmax(0, 1.35fr) minmax(0, 0.85fr)';
  const grid = { display: 'grid', gridTemplateColumns: tracks, gap: '0.25rem', textAlign: 'center' };
  const smallText = 'clamp(0.75rem, 2.25vw, 0.94rem)';
  const printed = (ticket, field) => field === 3 ? `$${ticket[field]}` : ticket[field];

  function cell(ticket, field) {
    return h('div', { style: {
      color: selected.has(field) ? C.green : C.muted,
      fontWeight: selected.has(field) ? '700' : '400',
    } }, printed(ticket, field));
  }

  function card(title, open, items) {
    return h('div', { role: 'group', 'aria-label': `${title}, ${open ? 'open' : 'closed'}`, style: {
      minWidth: '0', padding: '0.38rem 0.15rem', borderRadius: '0.55rem',
      border: `1px solid ${open ? C.cyan : C.muted}`, background: C.bg,
    } }, ...items);
  }

  function rowPicture() {
    const open = selected.size > 0;
    return [
      h('div', { style: { ...grid, color: C.cyan, margin: '0 0 0.35rem', fontWeight: '700' } },
        fields.map(field => h('div', {}, field))),
      ...tickets.map(ticket => card(`Ticket ${ticket[0]}`, open, [
        open ? h('div', { style: grid }, fields.map((_, i) => cell(ticket, i)))
          : h('div', { style: { color: C.muted, textAlign: 'center' } }, `Ticket ${ticket[0]} · Closed`),
      ])),
    ];
  }

  function columnPicture() {
    return [h('div', { style: { ...grid, alignItems: 'start' } }, fields.map((field, i) => {
      const open = selected.has(i);
      return card(field, open, [
        h('div', { style: { color: open ? C.cyan : C.muted, fontWeight: '700', minHeight: '2.8em' } }, field),
        open ? h('div', { style: { display: 'grid', gap: '0.36rem' } }, tickets.map(ticket => cell(ticket, i)))
          : h('div', { style: { color: C.muted } }, 'Closed'),
      ]);
    }))];
  }

  function draw() {
    const count = selected.size;
    const rowBlocks = count ? tickets.length : 0;
    const columnBlocks = count;
    const rowValues = rowBlocks * fields.length;
    const columnValues = columnBlocks * tickets.length;
    const byColumn = layout === 'columns';
    const open = byColumn ? columnBlocks : rowBlocks;
    const total = byColumn ? fields.length : tickets.length;
    const read = byColumn ? columnValues : rowValues;
    const amount = tickets[Number(picker.value)][3];

    layoutButtons.forEach(([name, button]) => {
      button.classList.toggle('go', layout === name);
      button.setAttribute('aria-pressed', String(layout === name));
    });
    fieldButtons.forEach((button, i) => {
      button.classList.toggle('go', selected.has(i));
      button.setAttribute('aria-pressed', String(selected.has(i)));
    });
    minus.disabled = amount <= 1;
    plus.disabled = amount >= 40;
    picture.replaceChildren(h('div', { style: { display: 'grid', gap: '0.38rem', fontSize: smallText } },
      byColumn ? columnPicture() : rowPicture()));

    fbox(box, [
      byColumn ? 'Columnar storage' : 'Row storage',
      [`Blocks opened: ${open} of ${total}`, C.cyan],
      `Blocks skipped: ${total - open}`,
      `Values read: ${read}`,
      [`Values you asked for: ${columnValues}`, C.green],
    ]);
    challenge.update({
      layout, count, open, rowValues, columnValues,
      amountOnly: count === 1 && selected.has(3),
      shopAndTime: count === 2 && selected.has(1) && selected.has(2),
    });
  }

  draw();
}
