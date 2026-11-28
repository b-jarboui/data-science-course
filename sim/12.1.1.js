// 12.1.1 Try it: sort facts by what you know at renewal and what you learn later.
export default function mount(root, kit) {
  const { h, C, btn, fbox, rnd, challenges } = kit;
  const start = { title: 'Bea’s 1 March renewal', hours: 2, help: 1, months: 3, cancelDay: 11 };
  const facts = [
    { id: 'hours', name: 'Hours played', kind: 'feature', why: 'The app has already counted the hours when the plan renews.' },
    { id: 'help', name: 'Help requests', kind: 'feature', why: 'These requests came in before renewal day.' },
    { id: 'months', name: 'Months as a member', kind: 'feature', why: 'The app already knows how long the customer has been a member.' },
    { id: 'label', name: 'Cancelled within 30 days?', kind: 'label', why: 'This yes-or-no answer is the one the app wants to predict.' },
    { id: 'date', name: 'Cancel date', kind: 'later', why: 'The app can learn a cancel date only after renewal day, so the date cannot be a clue on that day.' },
  ];
  let renewal = { ...start };
  let day = 0;
  let attempt = null;
  let setNumber = 0;

  const heading = h('h3', { style: { margin: '0 0 .75rem' } });
  const featureLane = h('div');
  const futureLane = h('div');
  const box = h('div');
  const challengePanel = h('div');
  const feedback = h('p', { class: 'sim-note', role: 'status', style: { minHeight: '1.5em' } });
  const choice = h('select', {
    style: {
      display: 'block', width: '100%', minHeight: '44px', marginTop: '.25rem', padding: '.35rem .5rem',
      background: C.bg, color: C.ink, border: '1px solid #536485', borderRadius: '.5rem', font: 'inherit',
    },
    onchange: changed,
  }, facts.map(fact => h('option', { value: fact.id }, fact.name)));

  function slider(name, max, onChange) {
    const value = h('span');
    const input = h('input', {
      type: 'range', min: 0, max, step: 1,
      style: { display: 'block', width: '100%', minHeight: '44px', margin: 0, accentColor: C.cyan },
      oninput: event => {
        onChange(Number(event.currentTarget.value));
        changed();
      },
    });
    return {
      element: h('label', { style: { display: 'block', marginTop: '.35rem' } }, name, ' ', value, input),
      update(number, text = String(number)) {
        input.value = number;
        input.setAttribute('aria-valuetext', text);
        value.textContent = `(${text})`;
      },
    };
  }

  const hourSlider = slider('Hours played before renewal', 24, value => {
    renewal.hours = value;
  });
  const helpSlider = slider('Help requests before renewal', 5, value => {
    renewal.help = value;
  });
  const daySlider = slider('Days since renewal', 30, value => {
    day = value;
  });

  const picture = h('div', {
    style: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '.55rem' },
  }, featureLane, futureLane);
  const wrapper = h('div', { class: 'sim' },
    h('h2', {}, 'Try it: features and labels'),
    h('p', { class: 'sub' }, 'Change a renewal and move forward in time. Choose a fact and decide how the music app can use it on renewal day.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, heading, picture,
        hourSlider.element, helpSlider.element, daySlider.element,
        h('div', { class: 'sim-row' },
          btn('New data', newData), btn('Restore Bea’s renewal', restore, 'ghost')),
      ),
      h('div', {},
        h('div', { class: 'sim-card' },
          box,
          h('label', { style: { display: 'block', marginTop: '.85rem' } }, 'Fact to sort', choice),
          h('div', { class: 'sim-row' },
            btn('Feature', () => sort('feature')),
            btn('Label', () => sort('label')),
            btn('Other future fact', () => sort('later'))),
          feedback),
        h('div', { class: 'sim-card' }, challengePanel),
      ),
    ),
  );
  root.append(wrapper);

  const practice = challenges(challengePanel, [
    {
      text: 'Set hours played to 4 and sort Hours played as a feature.',
      check: state => state.hours === 4 && state.fact === 'hours' && state.kind === 'feature',
      why: 'The four hours were played before renewal, so the app already knows them.',
    },
    {
      text: 'Go to day 30 and sort the yes-or-no cancellation answer as the label.',
      check: state => state.day === 30 && state.fact === 'label' && state.kind === 'label',
      why: 'By day 30 the app knows the answer it wanted to predict on renewal day.',
    },
    {
      text: 'Go back to renewal day and sort Cancel date as an other future fact.',
      check: state => state.day === 0 && state.fact === 'date' && state.kind === 'later',
      why: 'On renewal day the cancellation has yet to happen, so its date cannot serve as a feature.',
    },
  ]);

  function restore() {
    renewal = { ...start };
    day = 0;
    choice.value = 'hours';
    changed();
  }

  function newData() {
    const hours = rnd(0, 24);
    const help = rnd(0, 5);
    const months = rnd(1, 12);
    const cancelDay = rnd(0, hours < 5 ? 1 : 3) === 0 ? rnd(1, 30) : null;
    renewal = { title: `Practice renewal ${++setNumber}`, hours, help, months, cancelDay };
    day = 0;
    choice.value = 'hours';
    changed();
  }

  function changed() {
    attempt = null;
    draw();
  }

  function sort(kind) {
    const fact = facts.find(item => item.id === choice.value);
    attempt = { fact: fact.id, kind };
    const right = kind === fact.kind;
    feedback.style.color = right ? C.green : C.amber;
    feedback.textContent = `${right ? 'Yes.' : 'Try again.'} ${fact.why}`;
    practice.update({ hours: renewal.hours, day, ...attempt });
  }

  function factCard(name, value, color) {
    return h('div', {
      style: {
        display: 'grid', alignContent: 'center', gap: '.10rem', minHeight: '3.4rem',
        background: C.bg, border: `1px solid ${color}`, borderRadius: '.55rem', padding: '.4rem .5rem',
      },
    }, h('span', { style: { fontSize: '.87rem', color: C.ink } }, name), h('strong', { style: { color } }, value));
  }

  function draw() {
    const cancelled = renewal.cancelDay !== null && day >= renewal.cancelDay;
    const answer = cancelled ? 'Yes' : day === 30 ? 'No' : 'Unknown';
    const date = cancelled ? (renewal.title === start.title ? '12 March' : `Day ${renewal.cancelDay}`)
      : day === 30 ? 'No cancellation' : 'Unknown';

    heading.textContent = renewal.title;
    featureLane.replaceChildren(
      h('div', { style: { color: C.cyan, fontWeight: 700, marginBottom: '.35rem' } }, 'Known on renewal day'),
      h('div', { style: { display: 'grid', gap: '.35rem' } },
        factCard('Hours played', `${renewal.hours} h`, C.cyan),
        factCard('Help requests', String(renewal.help), C.cyan),
        factCard('Time as a member', `${renewal.months} ${renewal.months === 1 ? 'month' : 'months'}`, C.cyan)),
    );
    futureLane.replaceChildren(
      h('div', { style: { color: C.pink, fontWeight: 700, marginBottom: '.35rem' } }, 'Learned later'),
      h('div', { style: { display: 'grid', gap: '.35rem' } },
        factCard('Cancelled within 30 days?', answer, C.pink),
        factCard('Cancel date', date, C.amber)),
    );

    hourSlider.update(renewal.hours, `${renewal.hours} ${renewal.hours === 1 ? 'hour' : 'hours'}`);
    helpSlider.update(renewal.help, `${renewal.help} ${renewal.help === 1 ? 'request' : 'requests'}`);
    daySlider.update(day, day === 0 ? 'renewal day' : `day ${day}`);

    const timing = cancelled ? `Day ${renewal.cancelDay} is within 30 days`
      : day === 30 ? '30 days passed without cancellation' : `${30 - day} ${day === 29 ? 'day' : 'days'} left in the window`;
    fbox(box, [
      [`Features: ${renewal.hours} h, ${renewal.help} ${renewal.help === 1 ? 'request' : 'requests'}, ${renewal.months} mo`, C.cyan],
      [`Label: ${answer.toLowerCase()}`, C.pink],
      timing,
    ]);
    if (!attempt) feedback.textContent = '';
  }

  draw();
  return () => wrapper.remove();
}
