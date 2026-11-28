// 21.3.3 Try it: check whether an answer follows the map.
// The toy guide uses fixed chances. Moving a building changes which answer
// gets those chances when the guide has the map.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const campus = ['Pond', 'Library', 'Lab building', 'Cafeteria', 'Main gate', 'Sports hall'];
  const colors = [C.violet, C.cyan, C.green, '#fb923c', C.ink, C.pink];
  const buildings = [1, 3, 5];
  const questions = [
    { label: 'Left of the gate', position: 3, words: 'Which building is just left of the main gate?' },
    { label: 'Right of the gate', position: 5, words: 'Which building is just right of the main gate?' },
    { label: 'Above the gate', position: 1, words: 'Which building is directly above the main gate?' },
  ];
  const textOnly = [0.5, 0.3, 0.2];
  const start = [0, 1, 2, 3, 4, 5];
  let order = start.slice(), question = 0, hasMap = true, showFocus = false, selected = null;
  let sawOriginalWithoutMap = false, sawOriginalWithMap = false;
  const originalLayout = () => order.every((id, i) => id === start[i]);
  const chances = () => {
    if (!hasMap) return textOnly;
    const correct = order[questions[question].position];
    const ranked = [correct, ...[3, 5, 1].filter(id => id !== correct)];
    return buildings.map(id => [0.8, 0.15, 0.05][ranked.indexOf(id)]);
  };
  const weight = i => i === questions[question].position ? 0.45 : i === 4 ? 0.35 : 0.05;
  const styleGrid = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '.4rem' };
  const map = h('div', { role: 'group', 'aria-label': 'Campus map, north is up', style: styleGrid });
  const squares = order.map((_, i) => {
    const square = btn('', () => selectPatch(i));
    const name = h('span', { style: { display: 'block', lineHeight: '1.25' } });
    const score = h('span', { style: { display: 'block', font: '700 .9rem Consolas, monospace' } });
    Object.assign(square.style, {
      minHeight: '4.4rem', padding: '.32rem', minWidth: 0, overflowWrap: 'anywhere',
    });
    square.append(name, score);
    map.append(square);
    return { square, name, score };
  });

  const questionLabel = h('p', { class: 'sim-note', style: { marginBottom: 0 } });
  const questionButtons = questions.map((q, i) => btn(q.label, () => {
    question = i;
    selected = null;
    draw();
  }));
  const mapButton = btn('', () => {
    hasMap = !hasMap;
    selected = null;
    draw();
  }, 'go');
  const focusButton = btn('', () => {
    showFocus = !showFocus;
    draw();
  });
  const chart = s('svg', { viewBox: '0 0 340 150', role: 'img', 'aria-label': 'Answer chances' });
  const box = h('div');
  const note = h('div', { class: 'sim-note', role: 'status' });
  const challengeHost = h('div');
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it with the campus guide'),
    h('p', { class: 'sub' }, 'Choose a question. Tap two buildings to swap them, or take the map away and see what the guide guesses.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        map,
        h('div', { class: 'sim-row' }, mapButton, focusButton, btn('New data', randomize),
          btn('Original map', () => {
            order = start.slice();
            question = 0;
            hasMap = true;
            selected = null;
            draw();
          })),
        h('div', { class: 'sim-row', role: 'group', 'aria-label': 'Choose a question' }, ...questionButtons),
        questionLabel, chart),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengeHost)))));

  const checks = challenges(challengeHost, [
    {
      text: 'On the original map, ask about the left of the gate with and without the map.',
      check: st => st.sawOriginalWithoutMap && st.sawOriginalWithMap,
      why: 'The guide guesses Library from the question alone and answers Cafeteria when it has the map.',
    },
    {
      text: 'Show focus on the original map while asking about the left of the gate.',
      check: st => st.original && st.question === 0 && st.focusVisible,
      why: 'The cafeteria gets 0.45 and the gate gets 0.35, for 80% of the focus together.',
    },
    {
      text: 'Keep asking about the left of the gate and move a different building there.',
      check: st => st.hasMap && st.question === 0 && st.answer !== 3,
      why: 'With the map, the guide’s answer follows the building you put to the left of the gate.',
    },
  ]);
  challengeHost.addEventListener('click', () => updateChallenges());

  function selectPatch(i) {
    if (!hasMap || !buildings.includes(order[i])) return;
    if (selected === null) {
      selected = i;
    } else {
      [order[selected], order[i]] = [order[i], order[selected]];
      selected = null;
    }
    draw();
  }

  function randomize() {
    const target = questions[question].position;
    const movable = questions.map(q => q.position);
    const alternatives = buildings.filter(id => id !== order[target]);
    const next = alternatives[rnd(0, alternatives.length - 1)];
    const rest = buildings.filter(id => id !== next);
    if (rnd(0, 1)) rest.reverse();
    for (const i of movable) order[i] = i === target ? next : rest.pop();
    hasMap = true;
    selected = null;
    draw();
  }

  function drawChart(values, winner) {
    const parts = [];
    for (const mark of [0, 0.5, 1]) {
      const x = 104 + mark * 194;
      parts.push(s('line', { x1: x, y1: 26, x2: x, y2: 143, stroke: C.line }),
        s('text', { x, y: 18, fill: C.muted, 'font-size': 13, 'text-anchor': 'middle' }, String(mark)));
    }
    buildings.forEach((id, i) => {
      const y = 47 + i * 38, width = 194 * values[i];
      parts.push(
        s('text', { x: 99, y: y + 5, fill: colors[id], 'font-size': 15, 'text-anchor': 'end' }, campus[id]),
        s('rect', { x: 104, y: y - 11, width, height: 22, rx: 4, fill: colors[id],
          'fill-opacity': i === winner ? 0.85 : 0.4, stroke: colors[id] }),
        s('text', { x: 111 + width, y: y + 5, fill: C.ink, 'font-size': 14,
          'font-family': 'Consolas, monospace', 'font-weight': i === winner ? 700 : 400 }, String(values[i])));
    });
    chart.setAttribute('aria-label', buildings.map((id, i) => `${campus[id]} ${values[i]}`).join(', '));
    chart.replaceChildren(...parts);
  }

  function updateChallenges(values = chances()) {
    const winner = values.indexOf(Math.max(...values));
    checks.update({
      sawOriginalWithoutMap,
      sawOriginalWithMap,
      original: originalLayout(),
      question,
      focusVisible: hasMap && showFocus,
      hasMap,
      answer: buildings[winner],
    });
  }

  function draw() {
    const focusVisible = hasMap && showFocus;
    map.hidden = !hasMap;
    map.style.display = hasMap ? 'grid' : 'none';
    mapButton.textContent = hasMap ? 'Hide map' : 'Show map';
    focusButton.textContent = focusVisible ? 'Hide focus' : 'Show focus';
    focusButton.disabled = !hasMap;
    focusButton.setAttribute('aria-pressed', String(focusVisible));
    questionLabel.textContent = questions[question].words;

    questionButtons.forEach((button, i) => {
      button.setAttribute('aria-pressed', String(question === i));
      button.classList.toggle('go', question === i);
    });
    squares.forEach(({ square, name, score }, i) => {
      const id = order[i], active = i === selected;
      const movable = buildings.includes(id);
      name.textContent = campus[id];
      score.textContent = focusVisible ? weight(i).toFixed(2) : '';
      score.style.color = weight(i) > 0.05 ? C.amber : C.muted;
      square.disabled = !movable;
      square.style.cursor = movable ? 'pointer' : 'default';
      square.style.color = colors[id];
      square.style.borderColor = active ? C.ink : colors[id];
      square.style.outline = active ? `2px solid ${C.ink}` : '';
      square.style.background = focusVisible
        ? `rgba(251, 191, 36, ${0.03 + 0.52 * weight(i)})`
        : C.bg;
      if (movable) square.setAttribute('aria-pressed', String(active));
      else square.removeAttribute('aria-pressed');
    });

    const values = chances();
    const winner = values.indexOf(Math.max(...values));
    const answer = buildings[winner];
    const rows = [
      hasMap ? 'Picture + question' : 'Question only',
      `${values.join(' + ')} = 1`,
      [`Answer: ${campus[answer]}`, colors[answer]],
    ];
    if (focusVisible) rows.push(['0.45 + 0.35 = 0.8 (80%)', C.amber]);
    fbox(box, rows);
    drawChart(values, winner);

    if (selected !== null) {
      note.textContent = `Tap another building to swap it with ${campus[order[selected]]}.`;
    } else if (focusVisible) {
      note.textContent = 'The brightest squares are the answer’s patch and the main gate.';
    } else {
      note.textContent = hasMap
        ? 'The guide gives the largest chance to the building at the place you asked about.'
        : 'Without the map, Library has the largest chance in this toy example.';
    }
    if (question === 0 && originalLayout()) {
      if (hasMap) sawOriginalWithMap = true;
      else sawOriginalWithoutMap = true;
    }
    updateChallenges(values);
  }

  draw();
  return () => {};
}
