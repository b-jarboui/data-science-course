// 20.2.4 Try it: choose a reply, swap the two sides, and compare the choices.
export default function mount(root, kit) {
  const { h, C, btn, fbox, rnd, challenges } = kit;
  const blue = '#a9bfff';
  const library = {
    key: 'library',
    announcement: 'The library closes at six on Friday for cleaning.',
    question: 'When does the library close on Friday?',
    replies: ['At six.', 'Thanks for asking! The newsletter says the library will close at six this Friday for cleaning.'],
    best: 'A',
  };
  const cafe = {
    key: 'cafe',
    announcement: 'The café opens at eight on Saturday.',
    question: 'When does the café open on Saturday?',
    replies: ['It opens at eight on Saturday.', 'On Saturday, it opens at eight.'],
  };
  const gym = {
    key: 'gym',
    announcement: 'The gym closes on Monday.',
    question: 'Is the gym open on Monday?',
    replies: ['Closed on Monday.', 'Open on Monday.'],
    best: 'A',
  };
  let example = library;
  let order = ['A', 'B'];
  let first = null;
  let second = null;
  let swapped = false;

  const announcement = h('p');
  const question = h('p');
  const box = h('div');
  const challengeHost = h('div');
  const round = h('p', { class: 'sim-note', 'aria-live': 'polite' });
  const result = h('div', { 'aria-live': 'polite' }, box);
  const pair = h('div', { style: {
    display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '.5rem',
  } });
  const picks = ['Left', 'Right'].map((side, position) => {
    const name = h('strong');
    const reply = h('span', { style: { display: 'block', marginTop: '.35rem', overflowWrap: 'anywhere' } });
    const button = h('button', {
      type: 'button',
      class: 'sim-btn',
      style: { textAlign: 'start', minHeight: '7rem' },
      onclick: () => choose(position),
    }, h('span', { style: { display: 'block', fontSize: '.85rem' } }, side), name, reply);
    pair.append(button);
    return { button, name, reply };
  });

  const swapButton = btn('Swap sides', swap, 'go');
  const app = h('div', { class: 'sim' },
    h('h2', {}, 'Try it with two replies'),
    h('p', { class: 'sub' }, 'Choose a reply. Swap the sides, then choose again. See what the two choices tell you.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, announcement, question, round, pair,
        h('div', { class: 'sim-row' }, swapButton, btn('Clear choices', () => load(example, order.join() === 'B,A' ? !swapped : swapped))),
        h('div', { class: 'sim-row' },
          btn('Library', () => load(library)),
          btn('Café', () => load(cafe)),
          btn('Gym', () => load(gym)),
          btn('New data', newData))),
      h('div', {}, h('div', { class: 'sim-card' }, result), h('div', { class: 'sim-card' }, challengeHost))));
  root.append(app);

  const chal = challenges(challengeHost, [
    {
      text: 'Choose the short library reply before and after the swap.',
      check: state => state.key === 'library' && state.kept && state.chosen === 'A',
      why: 'You chose reply A on both sides, so the comparison records A as the chosen reply.',
    },
    {
      text: 'Open Café and choose the left reply both times.',
      check: state => state.key === 'cafe' && state.sameSide && state.side === 0,
      why: 'The left side held a different reply after the swap, so this comparison is dropped.',
    },
    {
      text: 'Press New data and choose the brief, correct reply both times.',
      check: state => state.key === 'random' && state.kept && state.chosen === state.best,
      why: 'The brief, correct reply stayed your choice when its side changed.',
    },
  ]);

  function load(next, reverse = false) {
    example = next;
    order = reverse ? ['B', 'A'] : ['A', 'B'];
    first = null;
    second = null;
    swapped = false;
    announcement.textContent = next.announcement;
    question.textContent = next.question;
    draw();
  }

  function choose(position) {
    const pick = { id: order[position], position };
    if (swapped) second = pick;
    else first = pick;
    draw();
  }

  function swap() {
    if (!first || swapped) return;
    order.reverse();
    swapped = true;
    draw();
    picks[0].button.focus();
  }

  function newData() {
    const places = [
      { place: 'pool', action: 'opens', reason: 'for morning swim' },
      { place: 'library', action: 'closes', reason: 'for cleaning' },
      { place: 'gym', action: 'closes', reason: 'for maintenance' },
      { place: 'café', action: 'opens', reason: 'for breakfast' },
    ];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const hours = ['six', 'seven', 'eight', 'nine', 'ten'];
    const { place, action, reason } = places[rnd(0, places.length - 1)];
    const day = days[rnd(0, days.length - 1)];
    const hour = hours[rnd(0, hours.length - 1)];
    const text = `The ${place} ${action} at ${hour} on ${day} ${reason}.`;
    const replies = [`At ${hour}.`, `Thanks for asking! ${text}`];
    const best = rnd(0, 1) ? 'A' : 'B';
    if (best === 'B') replies.reverse();
    load({
      key: 'random', announcement: text,
      question: `What time does the ${place} ${action === 'opens' ? 'open' : 'close'} on ${day}?`,
      replies, best,
    }, rnd(0, 1) === 1);
  }

  const side = pos => pos === 0 ? 'left' : 'right';
  const describe = pick => `Reply ${pick.id} on the ${side(pick.position)}`;
  const replyText = id => example.replies[id === 'A' ? 0 : 1];

  function draw() {
    const current = swapped ? second : first;
    const kept = Boolean(second && first.id === second.id);
    const sameSide = Boolean(second && first.position === second.position);
    const rejected = kept ? second.id === 'A' ? 'B' : 'A' : null;

    round.textContent = swapped ? 'Second choice · after the swap' : 'First choice';
    swapButton.disabled = !first || swapped;
    picks.forEach(({ button, name, reply }, position) => {
      const id = order[position];
      const selected = current?.position === position;
      const title = `Reply ${id}`;
      name.textContent = title;
      name.style.color = id === 'A' ? C.cyan : blue;
      reply.textContent = replyText(id);
      button.setAttribute('aria-pressed', String(selected));
      button.style.borderColor = selected ? C.green : '#536485';
      button.style.backgroundColor = selected ? '#17382e' : '#18213a';
    });

    const lines = [
      first ? `First: ${describe(first)}` : 'Choose one of the replies.',
      ...(second ? [`After swap: ${describe(second)}`] :
        first ? [swapped ? 'Choose again.' : 'Swap the sides to check your choice.'] : []),
    ];
    if (kept) {
      lines.push(['Keep: same reply on both sides.', C.green],
        `Prompt: ${example.announcement} ${example.question}`,
        [`Chosen (${second.id}): ${replyText(second.id)}`, C.green],
        [`Rejected (${rejected}): ${replyText(rejected)}`, blue]);
    } else if (sameSide) {
      lines.push(['Drop: the same side held different replies.', C.pink]);
    }
    fbox(box, lines);
    chal.update({ key: example.key, best: example.best, kept, sameSide, chosen: second?.id, side: second?.position });
  }

  // Check the visible challenge when the learner changes challenges.
  challengeHost.addEventListener('click', draw);
  load(library);

  return () => {
    challengeHost.removeEventListener('click', draw);
    app.remove();
  };
}
