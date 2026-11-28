// 16.3.12 Try it. Change parcel scores and arrivals to see what goes on a model card.
export default function mount(root, kit) {
  const { h, C, btn, fbox, rnd, challenges } = kit;
  const CUTOFF = 50;
  const MONDAY = [
    { name: 'Sage', score: 60, late: true },
    { name: 'Teal', score: 60, late: true },
    { name: 'Vale', score: 40, late: true },
    { name: 'Wren', score: 20, late: false }
  ];
  const isFlagged = parcel => parcel.score >= CUTOFF;
  function tally(group) {
    const late = group.filter(parcel => parcel.late);
    const misses = late.filter(parcel => !isFlagged(parcel));
    return { late: late.length, misses: misses.length };
  }

  const saved = tally(MONDAY);
  const practice = MONDAY.map(parcel => ({ ...parcel }));
  let isMonday = true;

  const picture = h('div', { style: {
    display: 'grid', gap: '.6rem',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 13rem), 1fr))',
    backgroundColor: C.bg,
    backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
    backgroundSize: '18px 18px', padding: '.5rem', borderRadius: '.65rem'
  } });
  const box = h('div', { 'aria-live': 'polite' });
  const feedback = h('div', { class: 'sim-note', 'aria-live': 'polite' });
  const challengePanel = h('div');
  const groupName = h('p', { class: 'sim-note', style: { marginTop: 0 } });

  const controls = practice.map((parcel, i) => {
    const scoreText = h('span');
    const flag = h('span', { style: { fontWeight: 700 } });
    const outcome = btn('', () => {
      parcel.late = !parcel.late;
      isMonday = false;
      draw({ kind: 'arrival' });
    });
    const slider = h('input', {
      type: 'range', min: 0, max: 100, step: 1, value: parcel.score,
      'aria-label': `${parcel.name} score, percent`,
      style: { display: 'block', width: '100%', height: '44px', margin: 0, accentColor: C.cyan },
      oninput: event => {
        const score = Number(event.currentTarget.value);
        if (score === parcel.score) return;
        const before = tally(practice);
        parcel.score = score;
        isMonday = false;
        draw({ kind: 'score', i, before });
      }
    });
    const row = h('div', {
      style: { background: C.card, border: `1px solid ${C.line}`, borderRadius: '.65rem', padding: '.65rem' }
    },
    h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '.5rem' } },
      h('strong', {}, parcel.name), h('span', { style: { color: C.pink } }, 'South')),
    h('label', { style: { display: 'block', marginTop: '.35rem' } }, 'Score ', scoreText, slider),
    h('div', { class: 'sim-row', style: { marginTop: 0 } }, outcome, flag));
    picture.append(row);
    return { slider, scoreText, flag, outcome };
  });

  function newData() {
    const changed = rnd(0, practice.length - 1);
    practice.forEach((parcel, i) => {
      // Ensure at least one score changes, even if the other draws match.
      const offset = i === changed ? rnd(1, 100) : rnd(0, 100);
      parcel.score = (parcel.score + offset) % 101;
      parcel.late = rnd(0, 1) === 1;
    });
    isMonday = false;
    draw({ kind: 'new' });
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: Birch’s model card'),
    h('p', { class: 'sub' },
      'Move a score slider or tap an arrival to change it. See who gets a flag and how many late parcels Birch misses.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, groupName, picture,
        h('div', { class: 'sim-row' }, btn('New data', newData, 'go'))),
      h('div', {},
        h('div', { class: 'sim-card' }, box),
        h('div', { class: 'sim-card' }, challengePanel, feedback)))));

  const checks = challenges(challengePanel, [
    {
      text: 'Set a parcel’s score to 50% to flag it.',
      check: state => state.edit.kind === 'score' &&
        practice[state.edit.i].score === CUTOFF && isFlagged(practice[state.edit.i]),
      why: 'A score of exactly 50% calls for a flag.'
    },
    {
      text: 'Make one miss out of three late parcels.',
      check: state => state.edit.kind !== 'start' && state.late === 3 && state.misses === 1,
      why: 'Exactly one of the three late parcels scored below 50%.'
    },
    {
      text: 'Change an on-time parcel’s score and keep the same count.',
      check: state => state.edit.kind === 'score' && !practice[state.edit.i].late &&
        state.edit.before.late === state.late && state.edit.before.misses === state.misses,
      why: 'Changing an on-time parcel’s score leaves both counts unchanged because the count uses only late parcels.'
    }
  ]);

  function draw(edit = { kind: 'start' }) {
    const counts = tally(practice);
    practice.forEach((parcel, i) => {
      const { slider, scoreText, flag, outcome } = controls[i];
      if (Number(slider.value) !== parcel.score) slider.value = parcel.score;
      slider.setAttribute('aria-valuetext', `${parcel.score}%`);
      scoreText.textContent = `${parcel.score}%`;
      const flagged = isFlagged(parcel);
      flag.textContent = flagged ? '✓ Flag' : 'No flag';
      flag.style.color = flagged ? C.amber : '#b2bdd9';
      const arrival = parcel.late ? 'Late' : 'On time';
      outcome.textContent = arrival;
      outcome.style.color = parcel.late ? C.pink : C.green;
      outcome.setAttribute('aria-label', `${parcel.name} arrived ${arrival.toLowerCase()}. Change arrival.`);
    });

    groupName.textContent = isMonday ? 'Monday dispatch · 4 South parcels' : 'Practice group · 4 South parcels';
    const result = counts.late
      ? `${counts.misses} ${counts.misses === 1 ? 'miss' : 'misses'} out of ${counts.late} late ${counts.late === 1 ? 'parcel' : 'parcels'}`
      : 'No late parcels to count.';
    fbox(box, [
      ['Birch · Model card', C.cyan],
      `Decision: flag scores of ${CUTOFF}% or higher for a person to check at dispatch.`,
      'Monday dispatch · 4 South parcels',
      [`${saved.misses} miss out of ${saved.late} late South parcels (Vale).`, C.pink],
      '',
      ['Practice result', C.cyan],
      [result, C.amber]
    ]);

    const state = { ...counts, edit };
    const active = checks.index;
    checks.update(state);
    const done = challengePanel.querySelector('.sim-ch-why').textContent;
    if (edit.kind === 'start' || done) {
      feedback.textContent = '';
    } else if (active === 0) {
      feedback.textContent = 'Move a score slider until it reads exactly 50%.';
    } else if (active === 1) {
      feedback.textContent = `You have ${counts.late} late and ${counts.misses} missed. A late parcel is missed when its score is below 50%.`;
    } else {
      feedback.textContent = 'Find a parcel marked On time and move its score slider.';
    }
  }

  challengePanel.addEventListener('click', event => {
    if (event.target.closest('.sim-ch-nav')) feedback.textContent = '';
  });
  draw();
  return () => {};
}
