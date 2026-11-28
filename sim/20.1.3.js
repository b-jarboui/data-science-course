// 20.1.3 Try it: pack campus newsletters into training blocks.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [
    ['Library', 'opens', 'at', 'nine'],
    ['Pool', 'closed', 'today'],
    ['Exams', 'start'],
  ];
  const WORD_BANK = [
    ['The', 'gym', 'opens', 'early', 'this', 'week'],
    ['Lunch', 'moves', 'outside', 'on', 'Friday', 'afternoon'],
    ['The', 'campus', 'bus', 'stops', 'here', 'today'],
    ['Music', 'club', 'meets', 'after', 'class', 'today'],
    ['Tickets', 'are', 'free', 'for', 'all', 'students'],
    ['The', 'book', 'sale', 'ends', 'at', 'noon'],
  ];
  const END = '<end>';
  const DEFAULT_SIZE = 12;
  let docs = START, capacity = DEFAULT_SIZE, markers = true, packed = false;
  let example = true, placed = docs.length, tracing = false, playing = false, timer;

  const picture = h('div', { role: 'region', 'aria-label': 'Training blocks' });
  const box = h('div', { 'aria-live': 'polite' });
  const note = h('p', { class: 'sim-note' });
  const trace = h('div', { hidden: true });
  const curve = s('svg', { viewBox: '0 0 240 106', role: 'img' });
  trace.append(h('p', { class: 'sim-note' }, 'Unused spaces after each step'), curve);
  const challengeHost = h('div');

  const size = h('input', {
    type: 'range', min: 7, max: 16, value: DEFAULT_SIZE,
    oninput: () => { capacity = Number(size.value); draw(); },
  });
  const sizeValue = h('span');
  const speed = h('input', {
    type: 'range', min: 0.5, max: 2, step: 0.5, value: 1,
    oninput: () => { if (playing) schedule(); draw(); },
  });
  const speedValue = h('span');
  const unpackButton = btn('One per block', () => setMode(false));
  const packButton = btn('Pack newsletters', () => setMode(true), 'go');
  const markerButton = btn('Keep end markers', () => { markers = !markers; draw(); });
  const stepButton = btn('Step', () => { startTrace(); step(); });
  const playButton = btn('Play', togglePlay);

  const wrapper = h('div', { class: 'sim' },
    h('h2', {}, 'Try it: sequence packing'),
    h('p', { class: 'sub' }, 'Pack the newsletters, then change the block size or remove the end markers. Read each row from left to right.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, picture,
        h('div', { class: 'sim-row' }, unpackButton, packButton, markerButton),
        h('div', { class: 'sim-row' }, h('label', {}, 'Spaces per block ', size, ' ', sizeValue)),
        h('div', { class: 'sim-row' }, stepButton, playButton,
          h('label', {}, 'Speed ', speed, ' ', speedValue)),
        h('div', { class: 'sim-row' }, btn('New data', randomize), btn('Reset', reset))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note, trace),
        h('div', { class: 'sim-card' }, challengeHost))));
  root.append(wrapper);

  const quiz = challenges(challengeHost, [
    {
      text: 'Pack the original three newsletters into one full block with the end markers.',
      check: st => st.example && st.complete && st.packed && st.markers && st.blocks === 1 && st.unused === 0,
      why: 'Yes! The three newsletters use 5, 4 and 3 spaces, so together they fill all 12 spaces.',
    },
    {
      text: 'With the original newsletters packed into a 12-space block, turn off the end markers and find “nine Pool”.',
      check: st => st.example && st.complete && st.packed && !st.markers && st.capacity === 12,
      why: 'Without the first end marker, “nine” and “Pool” touch even though they come from different newsletters.',
    },
    {
      text: 'Keep the end markers and make A and B fill the first block exactly, with C in a second block.',
      check: st => st.example && st.complete && st.packed && st.markers && st.capacity === 9 && st.blocks === 2,
      why: 'A and B use all 9 spaces in the first block, and C uses 3 spaces in the second block.',
    },
  ]);

  // Each newsletter stays whole. In packed mode, a new block opens when the
  // next newsletter cannot fit in the current one.
  function layout(count) {
    const blocks = [];
    docs.slice(0, count).forEach((doc, index) => {
      const words = markers ? [...doc, END] : doc;
      let block = blocks.at(-1);
      if (!packed || !block || block.cards.length + words.length > capacity) {
        block = { cards: [], names: [] };
        blocks.push(block);
      }
      const name = String.fromCharCode(65 + index);
      block.names.push(name);
      words.forEach((word, i) => block.cards.push({ word, name, first: i === 0 }));
    });
    return blocks;
  }

  function totals(blocks) {
    const useful = blocks.reduce((n, block) => n + block.cards.length, 0);
    const available = blocks.length * capacity;
    return { useful, available, unused: available - useful };
  }

  function stop() {
    clearTimeout(timer);
    playing = false;
  }

  function setMode(pack) {
    stop();
    packed = pack;
    tracing = false;
    placed = docs.length;
    draw();
  }

  function startTrace() {
    if (!tracing || placed === docs.length) placed = 0;
    tracing = true;
    packed = true;
  }

  function step() {
    placed++;
    if (placed === docs.length) stop();
    draw();
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      step();
      if (playing) schedule();
    }, 1050 / Number(speed.value));
  }

  function togglePlay() {
    if (playing) {
      stop();
      draw();
      return;
    }
    startTrace();
    playing = true;
    step();
    if (playing) schedule();
  }

  function randomize() {
    const bank = WORD_BANK.slice();
    docs = Array.from({ length: START.length }, () => {
      const [words] = bank.splice(rnd(0, bank.length - 1), 1);
      return words.slice(0, rnd(2, words.length));
    });
    example = false;
    setMode(packed);
  }

  function reset() {
    docs = START;
    capacity = DEFAULT_SIZE;
    size.value = capacity;
    speed.value = 1;
    markers = true;
    example = true;
    setMode(false);
  }

  function card(item, index, i) {
    const marker = item?.word === END;
    const color = marker || !item ? C.amber : C.cyan;
    const missingBoundary = !markers && item?.first && i > 0;
    const edge = missingBoundary ? C.pink : color;
    const name = item
      ? `Space ${i + 1}, newsletter ${item.name}, ${marker ? 'end marker' : item.word}`
      : `Space ${i + 1}, padding`;
    return h('li', {
      'aria-label': name,
      style: {
        boxSizing: 'border-box', minWidth: '0', minHeight: '2.2rem', display: 'grid',
        placeItems: 'center', textAlign: 'center', borderRadius: '.35rem',
        border: `1px ${item ? 'solid' : 'dashed'} ${edge}`,
        color, background: marker ? '#382b19' : item ? '#142c42' : C.bg,
        font: '650 .77rem/1.15 "Segoe UI", sans-serif', overflowWrap: 'anywhere',
      },
    }, item?.word ?? 'pad');
  }

  function drawBlock(block, index) {
    const cells = Array.from({ length: capacity }, (_, i) => card(block.cards[i], index, i));
    return h('div', { style: { marginBottom: '.85rem' } },
      h('div', { style: { marginBottom: '.3rem', fontWeight: 650 } },
        `Block ${index + 1} · ${block.names.join(' + ')}`),
      h('ol', { role: 'list', 'aria-label': `Spaces in block ${index + 1}`, style: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 3rem), 1fr))',
        gap: '.25rem', listStyle: 'none', padding: 0, margin: 0,
      } }, ...cells));
  }

  function drawCurve() {
    trace.hidden = !tracing;
    if (!tracing) return;
    const all = docs.map((_, i) => totals(layout(i + 1)).unused);
    const shown = all.slice(0, placed);
    const max = Math.max(1, ...all);
    const x = i => 34 + (184 * i) / (docs.length - 1);
    const y = unused => 78 - (60 * unused) / max;
    const tick = (tx, ty, text) => s('text', {
      x: tx, y: ty, fill: C.ink, 'text-anchor': 'middle', 'font-size': 12,
    }, text);

    curve.setAttribute('aria-label', `Unused spaces by step: ${shown.join(', ')}`);
    curve.replaceChildren(
      s('path', { d: 'M34 15 V78 H218', fill: 'none', stroke: C.muted }),
      tick(18, 82, 0), tick(18, 21, max),
      ...docs.map((_, i) => tick(x(i), 99, i + 1)),
      s('polyline', {
        points: shown.map((unused, i) => `${x(i)},${y(unused)}`).join(' '),
        fill: 'none', stroke: C.amber, 'stroke-width': 2.5,
      }),
      ...shown.map((unused, i) => s('circle', { cx: x(i), cy: y(unused), r: 3.5, fill: C.amber }))
    );
  }

  function check(blocks = layout(placed)) {
    quiz.update({
      example, packed, markers, capacity, complete: placed === docs.length,
      blocks: blocks.length, unused: totals(blocks).unused,
    });
  }

  function onChallengeClick() { check(); }
  challengeHost.addEventListener('click', onChallengeClick);

  function draw() {
    const blocks = layout(placed);
    const { useful, available, unused } = totals(blocks);
    picture.replaceChildren(...blocks.map(drawBlock));
    unpackButton.setAttribute('aria-pressed', String(!packed));
    packButton.setAttribute('aria-pressed', String(packed));
    markerButton.setAttribute('aria-pressed', String(markers));
    markerButton.textContent = `End markers: ${markers ? 'on' : 'off'}`;
    playButton.textContent = playing ? 'Pause' : 'Play';
    stepButton.disabled = playing;
    sizeValue.textContent = capacity;
    speedValue.textContent = `${speed.value}×`;

    const lines = [];
    if (tracing) {
      const previous = totals(layout(placed - 1));
      const added = String.fromCharCode(64 + placed);
      lines.push(`Step ${placed} of ${docs.length} · Added ${added}`,
        [`Unused spaces: ${previous.unused} → ${unused}`, C.amber]);
    }
    lines.push(`Available: ${blocks.length} × ${capacity} = ${available}`,
      `Padding: ${available} − ${useful} = ${unused}`,
      [`Useful: ${useful} ÷ ${available} × 100 ≈ ${fmt((100 * useful) / available)}%`, C.cyan]);
    fbox(box, lines);

    const joined = packed && blocks.some(block => block.names.length > 1);
    note.textContent = markers
      ? 'Each orange end marker uses one space. Each “pad” card fills an unused space.'
      : joined
        ? 'The pink borders mark where two newsletters now run together.'
        : 'The end markers are off. Newsletters in separate blocks still have a break between them.';
    drawCurve();
    check(blocks);
  }

  draw();
  return () => {
    stop();
    challengeHost.removeEventListener('click', onChallengeClick);
    wrapper.remove();
  };
}
