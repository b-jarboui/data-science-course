// 20.2.2 Try it: instruction tuning.
// The learning view models one demonstration. The test view illustrates style
// checks on held-out requests using two collections with the same size.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [0.2, 0.3, 0.5];
  const REPLIES = ['At six.', 'Long reply', 'Gym reply'];
  const MAX_STEPS = 20;
  const BASE_TEST = ['question', 'summary', 'date', 'question', 'other',
    'date', 'summary', 'question', 'other', 'summary'];
  const WORDINGS = {
    question: ['Quick one: is the pool open on Sunday?', 'Any idea what time the library closes?',
      'Can you tell me if the gym opens early?', 'Do you know when the café closes?'],
    summary: ['What’s the main news from the gym?', 'Sum up the café notice in one line.',
      'Can I get the short version of the library notice?'],
    date: ['What day should I put in my calendar?', 'Pull out the day from the café notice.',
      'Which day matters in the gym notice?'],
    other: ['Compare the library and café hours.', 'Put these three notices in order.',
      'Rewrite the pool notice as a poem.'],
  };

  let start = START.slice(), p = START.slice(), history = [], last = null;
  let timer = null, rate = 1, prediction = '', predictionResult = null;
  let tab = 'learn', test = [], selected = 0, randomDraw = false, compared = false;
  let tested = false, previousDraw = '';

  const svg = s('svg', { viewBox: '0 0 400 286', role: 'img' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), challengeHost = h('div');
  const status = h('div', { class: 'sim-note', role: 'status' });
  const chartCaption = h('p', { class: 'sim-note' });
  const itemPicker = h('select', { 'aria-label': 'New request', onchange: e => {
    selected = Number(e.target.value);
    draw();
  }, style: { minHeight: '44px', maxWidth: '100%' } });
  const speedLabel = h('span', {}, '1 step/s');
  const rateLabel = h('span', {}, '1');
  const speedInput = h('input', { type: 'range', min: 1, max: 6, step: 1, value: 1,
    'aria-label': 'Steps per second', oninput: e => {
      speedLabel.textContent = `${e.target.value} step/s`;
      if (timer !== null) {
        stop();
        play();
      }
    } });
  const rateInput = h('input', { type: 'range', min: 0, max: 2, step: 0.25, value: 1,
    'aria-label': 'Learning rate', oninput: e => {
      rate = Number(e.target.value);
      rateLabel.textContent = fmt(rate);
      draw();
    } });
  const predictionInput = h('select', { 'aria-label': 'Prediction for the next step', onchange: e => {
    prediction = e.target.value;
    predictionResult = null;
    draw();
  }, style: { minHeight: '44px', maxWidth: '100%' } },
  h('option', { value: '' }, 'Choose a prediction'),
  h('option', { value: 'fall' }, 'Loss will go down'),
  h('option', { value: 'same' }, 'Loss will stay the same'));
  const stepButton = btn('Step', step, 'go');
  const playButton = btn('Play', () => { if (timer === null) play(); else stop(); draw(); });
  const learnButton = btn('Learning steps', () => switchTab('learn'));
  const testButton = btn('New requests', () => switchTab('test'));
  const checkButton = btn('Check both models', () => { tested = true; compared = true; draw(); }, 'go');
  const learnControls = h('div', {},
    h('div', { class: 'sim-row' }, stepButton, playButton, btn('Reset', reset)),
    h('div', { class: 'sim-row' }, h('label', {}, 'Speed ', speedInput, ' ', speedLabel)),
    h('div', { class: 'sim-row' }, h('label', {}, 'Learning rate ', rateInput, ' ', rateLabel)),
    h('div', { class: 'sim-row' }, h('label', {}, 'Predict the next step ', predictionInput)));
  const testControls = h('div', {},
    h('div', { class: 'sim-row' }, h('label', {}, 'Request ', itemPicker)),
    chartCaption, h('div', { class: 'sim-row' }, checkButton));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: teach the assistant'),
    h('p', { class: 'sub' }, 'Teach the assistant to answer “At six.”, then compare how two training collections handle new requests.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', style: { marginTop: 0 } }, learnButton, testButton, btn('New data', newData)),
        svg, status, learnControls, testControls),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, challengeHost)))));

  const loss = () => -Math.log(p[0]);
  const pct = chance => `${Math.round(chance * 100)}%`;
  const fixed = n => n.toFixed(2);
  const signed = n => `${n < 0 ? '−' : '+'}${fixed(Math.abs(n))}`;
  const chal = challenges(challengeHost, [
    { text: 'Predict what will happen to the loss, then press Step or Play.',
      check: st => st.predictionCorrect,
      why: 'A positive learning rate raises the chance of the wanted answer, so its loss goes down.' },
    { text: 'Reset and reach a loss of 0.50 or less in at most three steps.',
      check: st => st.step > 0 && st.step <= 3 && st.loss <= 0.5,
      why: 'The loss dropped as the chance of “At six.” rose.' },
    { text: 'Find a learning rate that leaves the loss unchanged after a step.',
      check: st => st.noChange,
      why: 'At a learning rate of zero, every score change is zero, so the chances stay the same.' },
    { text: 'Open New requests and check both models. Which follows the style more often?',
      check: st => st.compared && st.variedHits > st.firstHits,
      why: 'Both collections have six demonstrations, and the varied collection covers more kinds of requests in this example.' },
  ]);

  // Recheck the current state when the kit moves to another challenge.
  challengeHost.addEventListener('click', e => {
    if (e.target.closest('.sim-ch-nav button')) updateChallenges();
  });

  function roundStart() {
    stop();
    p = start.slice();
    history = [loss()];
    last = null;
    prediction = '';
    predictionResult = null;
    predictionInput.value = '';
  }
  function reset() {
    roundStart();
    rate = 1;
    rateInput.value = '1';
    rateLabel.textContent = '1';
    draw();
  }
  function newData() {
    do {
      const a = rnd(9, 36), b = rnd(18, 43);
      start = [a / 100, b / 100, (100 - a - b) / 100];
    } while (start.join() === previousDraw || start.join() === START.join());
    previousDraw = start.join();
    randomDraw = true;
    roundStart();
    makeTest(true);
    draw();
  }
  function switchTab(next) {
    stop();
    tab = next;
    draw();
  }
  function stop() {
    if (timer !== null) clearInterval(timer);
    timer = null;
  }
  function play() {
    if (history.length > MAX_STEPS) return;
    timer = setInterval(step, 1000 / Number(speedInput.value));
  }
  function step() {
    if (history.length > MAX_STEPS) return;
    const before = p.slice(), oldLoss = loss();
    const change = before.map((chance, i) => rate * ((i === 0 ? 1 : 0) - chance));
    if (rate > 0) {
      const shares = before.map((chance, i) => chance * Math.exp(change[i]));
      const total = shares.reduce((sum, share) => sum + share, 0);
      p = shares.map(share => share / total);
    }
    const newLoss = loss();
    last = { before, oldLoss, change, rate };
    history.push(newLoss);
    if (prediction && predictionResult === null) {
      const outcome = newLoss < oldLoss ? 'fall' : 'same';
      predictionResult = { correct: prediction === outcome, outcome };
    }
    if (history.length > MAX_STEPS) stop();
    draw();
  }
  function makeTest(random) {
    const kinds = BASE_TEST.slice();
    if (random) {
      kinds.splice(0, 4, 'question', 'summary', 'date', ['question', 'summary', 'date'][rnd(0, 2)]);
      for (let i = 4; i < kinds.length; i++) {
        kinds[i] = ['question', 'summary', 'date', 'other'][rnd(0, 3)];
      }
      for (let i = kinds.length - 1; i > 0; i--) {
        const j = rnd(0, i);
        [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
      }
    }
    const used = {};
    test = kinds.map((kind, i) => {
      const examples = WORDINGS[kind];
      used[kind] = (used[kind] ?? (random ? rnd(0, examples.length - 1) : 0));
      const text = examples[used[kind] % examples.length];
      used[kind]++;
      return { id: i + 1, text, first: kind === 'question', varied: kind !== 'other' };
    });
    selected = 0;
    tested = false;
    compared = false;
    itemPicker.replaceChildren(...test.map((row, i) => h('option', { value: i }, `Request ${row.id}`)));
    itemPicker.value = '0';
  }

  function text(label, x, y, color = C.ink, size = 15, anchor = 'start') {
    return s('text', { x, y, fill: color, 'font-size': size, 'text-anchor': anchor, 'font-family': 'Consolas, monospace' }, label);
  }
  function line(x1, y1, x2, y2, stroke = C.line) {
    return s('line', { x1, y1, x2, y2, stroke, 'stroke-width': 1.5 });
  }
  function drawTraining() {
    svg.setAttribute('viewBox', '0 0 400 286');
    svg.setAttribute('aria-label', `Step ${history.length - 1}. At six: ${pct(p[0])}. Loss: ${fixed(loss())}.`);
    const nodes = [text('Chances for each reply', 12, 25, C.cyan, 17)];
    const replyColors = [C.cyan, '#a5b4fc', C.muted];
    p.forEach((chance, i) => {
      const y = 42 + i * 30, color = replyColors[i];
      nodes.push(text(REPLIES[i], 12, y + 13, color),
        s('rect', { x: 118, y, width: 214, height: 15, rx: 5, fill: C.line }),
        s('rect', { x: 118, y, width: 214 * chance, height: 15, rx: 5, fill: color }),
        text(pct(chance), 386, y + 13, color, 15, 'end'));
    });
    const min = 0, max = 3;
    const x = i => 38 + 332 * i / MAX_STEPS;
    const y = value => 253 - 89 * (value - min) / (max - min);
    nodes.push(text('Loss by step', 12, 153, C.amber, 17),
      line(x(0), y(min), x(MAX_STEPS), y(min)), line(x(0), y(min), x(0), y(max)));
    for (const tick of [0, 1, 2, 3]) {
      nodes.push(line(x(0), y(tick), x(MAX_STEPS), y(tick)), text(tick, 29, y(tick) + 4, C.muted, 12, 'end'));
    }
    for (const tick of [0, 5, 10, 15, 20]) nodes.push(text(tick, x(tick), 274, C.muted, 13, 'middle'));
    if (history.length > 1) {
      nodes.push(s('polyline', { points: history.map((value, i) => `${x(i)},${y(value)}`).join(' '),
        fill: 'none', stroke: C.amber, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
    }
    nodes.push(...history.map((value, i) => s('circle', { cx: x(i), cy: y(value), r: 3.2, fill: C.amber })));
    svg.replaceChildren(...nodes);

    const rows = last ? [
      `Step ${history.length - 1}  ·  learning rate ${fmt(last.rate)}`,
      'Wanted answer  “At six.”',
      `Chance  ${pct(last.before[0])} → ${pct(p[0])}`,
      [`Loss    ${fixed(last.oldLoss)} → ${fixed(loss())}`, C.amber],
      'Score changes',
      `At six.     ${signed(last.change[0])}`,
      `Long reply  ${signed(last.change[1])}`,
      `Gym reply   ${signed(last.change[2])}`,
    ] : ['Step 0  ·  starting chances', 'Wanted answer  “At six.”',
      `Chance  ${pct(p[0])}`, [`Loss    ${fixed(loss())}`, C.amber]];
    fbox(box, rows);
    note.textContent = last
      ? 'The learning rate controls how much each score changes. The new scores change the chances of all three replies.'
      : 'Announcement: The library closes at six on Friday for cleaning. Question: When does the library close on Friday?';
    const feedback = !predictionResult ? '' : predictionResult.correct ? ' Your prediction matched.' :
      predictionResult.outcome === 'fall' ? ' The loss went down on that step.' : ' The loss stayed the same on that step.';
    status.textContent = `Step ${history.length - 1} of ${MAX_STEPS}.${feedback}`;
  }
  const hits = key => test.filter(row => row[key]).length;
  function drawTest() {
    svg.setAttribute('viewBox', '0 0 400 168');
    const nodes = [];
    for (const [i, key] of ['first', 'varied'].entries()) {
      const y = 33 + i * 76;
      const color = i === 0 ? C.cyan : C.green;
      nodes.push(text(i === 0 ? 'First model · 6 demonstrations' : 'Varied model · 6 demonstrations', 12, y - 8, color, 16));
      test.forEach((row, j) => {
        const x = 12 + j * 38;
        const active = j === selected;
        const ok = tested && row[key];
        nodes.push(s('rect', { x, y, width: 32, height: 32, rx: 5, fill: ok ? '#173a37' : C.bg,
          stroke: active ? C.amber : ok ? C.green : C.muted, 'stroke-width': active ? 2.5 : 1 }),
        text(tested ? (ok ? '✓' : '·') : row.id, x + 16, y + 22, ok ? C.green : C.ink, 15, 'middle'));
      });
    }
    svg.setAttribute('aria-label', tested ?
      `Style check. First model: ${hits('first')} of 10. Varied model: ${hits('varied')} of 10.` :
      'Two rows of ten new requests, one row per model.');
    svg.replaceChildren(...nodes);
    const row = test[selected];
    chartCaption.textContent = row.text;
    status.textContent = tested
      ? `Request ${row.id}: first model ${row.first ? 'matches' : 'misses'} the style. Varied model ${row.varied ? 'matches' : 'misses'} the style.`
      : 'A successful answer is brief and gives the key fact first.';
    fbox(box, tested ? [
      'Success rate = passes ÷ requests',
      [`First model  ${hits('first')} ÷ 10 = ${hits('first') * 10}%`, C.cyan],
      [`Varied model ${hits('varied')} ÷ 10 = ${hits('varied') * 10}%`, C.green],
    ] : ['First collection: 6 demonstrations', 'Varied collection: 6 demonstrations', 'Test: 10 new requests']);
    note.textContent = randomDraw
      ? 'This sample matches each request type against the examples each collection covers. The check measures answer style.'
      : 'In this example, the first collection practises questions. The varied collection also practises summaries and finding dates.';
  }
  function updateChallenges() {
    chal.update({
      step: history.length - 1,
      loss: loss(),
      predictionCorrect: predictionResult?.correct && predictionResult.outcome === 'fall',
      noChange: last?.rate === 0 && last.oldLoss === loss(),
      compared,
      firstHits: hits('first'),
      variedHits: hits('varied'),
    });
  }
  function draw() {
    const learning = tab === 'learn';
    learnControls.hidden = !learning;
    testControls.hidden = learning;
    learnButton.setAttribute('aria-pressed', String(learning));
    testButton.setAttribute('aria-pressed', String(!learning));
    learnButton.classList.toggle('go', learning);
    testButton.classList.toggle('go', !learning);
    playButton.textContent = timer === null ? 'Play' : 'Pause';
    stepButton.disabled = playButton.disabled = history.length > MAX_STEPS;
    if (learning) drawTraining();
    else drawTest();
    updateChallenges();
  }

  roundStart();
  makeTest(false);
  draw();
  return stop;
}
