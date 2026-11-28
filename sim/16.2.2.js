// 16.2.2 Try it: change when Ticket B arrives and compare the daily totals.
export default function mount(root, kit) {
  const { h, C, btn, fbox, rnd, challenges } = kit;
  // Hours are measured from Monday at midnight. The two checks are Tuesday at 6 and 8.
  const START = [
    { id: 'A', shop: 'North', event: 9, amount: 4 },
    { id: 'C', shop: 'South', event: 10, amount: 6 },
    { id: 'B', shop: 'North', event: 11, amount: 8 },
    { id: 'D', shop: 'South', event: 12, amount: 10 },
    { id: 'E', shop: 'South', event: 14, amount: 14 }
  ];
  const DAWN = 30;
  const LATE = 32;
  const DAYS = ['Monday', 'Tuesday'];
  const day = hour => Math.floor(hour / 24);
  const money = amount => `$${amount}`;
  let tickets = START.slice();
  let arrivalB = LATE;
  let cutoff = LATE;
  let rule = 'event';
  let fresh = false;

  function time(hour) {
    const clock = hour % 24;
    const date = DAYS[day(hour)];
    if (clock === 0) return `${date} midnight`;
    if (clock === 12) return `${date} noon`;
    return `${date} ${clock % 12} ${clock < 12 ? 'a.m.' : 'p.m.'}`;
  }

  const box = h('div', { role: 'status', 'aria-atomic': 'true' });
  const ch = h('div');
  const slipDetails = h('div', { class: 'sim-note' });
  const dayCards = h('div', {
    style: {
      display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: '.55rem', marginTop: '.85rem'
    }
  });
  const slider = h('input', {
    type: 'range', min: 11, max: LATE, step: 1, value: LATE,
    'aria-label': 'Ticket B arrival time',
    style: { display: 'block', width: '100%', margin: '0', minHeight: '44px', accentColor: C.cyan },
    oninput: () => { arrivalB = Number(slider.value); render(); }
  });

  const dawnButton = btn('Check at 6 a.m.', () => { cutoff = DAWN; render(); });
  const lateButton = btn('Check at 8 a.m.', () => { cutoff = LATE; render(); });
  const eventButton = btn('Use event time', () => { rule = 'event'; render(); });
  const arrivalButton = btn('Use arrival time', () => { rule = 'arrival'; render(); });

  function newData() {
    tickets = tickets.map(ticket => ({
      ...ticket,
      amount: 3 + (ticket.amount - 3 + rnd(1, 15)) % 16
    }));
    fresh = true;
    render();
  }

  function reset() {
    tickets = START.slice();
    arrivalB = LATE;
    cutoff = LATE;
    rule = 'event';
    fresh = false;
    render();
  }

  const panel = h('div', { class: 'sim' },
    h('h2', {}, 'Try it: which day gets the sale?'),
    h('p', { class: 'sub' },
      'Move the slider to change when Ticket B arrives. Choose when to check the totals and which time gives each sale its day.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('label', { style: { display: 'block' } }, 'Ticket B arrival time', slider),
        slipDetails,
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Check the totals on Tuesday' },
          dawnButton, lateButton),
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Choose how to count sales' },
          eventButton, arrivalButton),
        dayCards,
        h('div', { class: 'sim-row' }, btn('New data', newData), btn('Reset', reset))),
      h('div', {}, h('div', { class: 'sim-card' }, box), h('div', { class: 'sim-card' }, ch))));
  root.append(panel);

  const chal = challenges(ch, [
    {
      text: 'Set Ticket B to arrive when the sale happens, Monday at 11 a.m.',
      check: st => st.arrivalB === 11 && st.bDay === 0,
      why: 'Both times are on Monday, so either rule puts Ticket B in Monday.'
    },
    {
      text: 'Set B to arrive at 8 a.m. Tuesday and check the totals at 6 a.m.',
      check: st => st.arrivalB === LATE && st.cutoff === DAWN && st.bDay === -1,
      why: 'The computer still has four tickets at 6 a.m. because Ticket B arrives at 8 a.m.'
    },
    {
      text: 'Check at 8 a.m. and use arrival time to put the late ticket in Tuesday.',
      check: st => st.arrivalB === LATE && st.cutoff === LATE && st.rule === 'arrival' && st.bDay === 1,
      why: 'The arrival rule puts the dollars in Tuesday because the ticket reaches the computer on Tuesday.'
    },
    {
      text: 'Press New data and use event time to put the late ticket back in Monday.',
      check: st => st.fresh && st.arrivalB === LATE && st.rule === 'event' && st.bDay === 0,
      why: 'The sale amount has changed, and the event time still puts Ticket B in Monday.'
    }
  ]);

  function state() {
    const groups = [[], []];
    let bDay = -1;
    for (const ticket of tickets) {
      const arrival = ticket.id === 'B' ? arrivalB : ticket.event;
      if (arrival > cutoff) continue;
      const index = day(rule === 'event' ? ticket.event : arrival);
      groups[index].push(ticket);
      if (ticket.id === 'B') bDay = index;
    }
    return { groups, bDay, arrivalB, cutoff, rule, fresh };
  }

  function ticketCard(ticket) {
    const color = ticket.shop === 'North' ? C.cyan : C.amber;
    return h('div', {
      style: {
        background: C.card, color, border: `1px solid ${color}`, borderRadius: '.4rem',
        boxShadow: `0 0 .4rem ${color}33`, padding: '.35rem .45rem',
        lineHeight: '1.25', fontFamily: 'Consolas, monospace'
      }
    },
    h('strong', {}, `${ticket.id}  ${money(ticket.amount)}`),
    h('div', { style: { color: C.ink, fontSize: '.9rem' } }, ticket.shop));
  }

  function dayCard(ticketsForDay, index) {
    return h('div', {
      style: {
        minWidth: '0', border: `1px solid ${C.line}`, borderRadius: '.55rem',
        padding: '.5rem', background: C.bg, display: 'grid', gap: '.4rem',
        alignContent: 'start'
      }
    },
    h('strong', {}, DAYS[index]),
    ticketsForDay.length ? ticketsForDay.map(ticketCard)
      : h('div', { style: { color: C.muted, fontSize: '.9rem' } }, 'No tickets'));
  }

  function formula(ticketsForDay, index) {
    const amounts = ticketsForDay.map(ticket => ticket.amount);
    const sum = amounts.reduce((total, amount) => total + amount, 0);
    const addition = amounts.length > 1 ? `${amounts.map(money).join(' + ')} = ` : '';
    return `${DAYS[index]}: ${addition}${money(sum)}`;
  }

  function setPressed(button, active) {
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('go', active);
  }

  function render() {
    const current = state();
    const b = tickets.find(ticket => ticket.id === 'B');
    slider.value = arrivalB;
    slider.setAttribute('aria-valuetext', time(arrivalB));
    slipDetails.replaceChildren(
      h('strong', {}, `Ticket B · North · ${money(b.amount)}`),
      h('div', {}, `Event time: ${time(b.event)}`),
      h('div', {}, `Arrival time: ${time(arrivalB)}`));
    setPressed(dawnButton, cutoff === DAWN);
    setPressed(lateButton, cutoff === LATE);
    setPressed(eventButton, rule === 'event');
    setPressed(arrivalButton, rule === 'arrival');
    dayCards.replaceChildren(...current.groups.map(dayCard));
    const result = current.bDay === -1
      ? 'Ticket B has yet to arrive.'
      : `Ticket B adds ${money(b.amount)} to ${DAYS[current.bDay]} and $0 to ${DAYS[1 - current.bDay]}.`;
    const color = current.bDay === 1 ? C.amber : C.green;
    fbox(box, [
      `Checked ${time(cutoff)}`,
      ...current.groups.map(formula),
      [result, color]
    ]);
    chal.update(current);
  }

  // The kit changes the active challenge during the button's click handler.
  const checkActive = () => chal.update(state());
  ch.addEventListener('click', checkActive);
  render();

  return () => {
    ch.removeEventListener('click', checkActive);
    panel.remove();
  };
}
