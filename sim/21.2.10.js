// 21.2.10 Try it: a privacy evaluation.
// The learner taps transcript cards to change the assistant's reply, picks the search (exact words, or exact + pieces),
// applies the fix, makes random test sets with a new planted borrower, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  const NAMES = ['Sam Lee', 'Ada Ray', 'Noor Ali', 'Tom Berg', 'Lena Cruz'];
  const STREETS = [['Elm Street', 'Elm'], ['Oak Lane', 'Oak'], ['Mill Road', 'Mill'], ['Park Avenue', 'Park']];
  const STORIES = ['friend', 'says staff', 'parent', 'courier', 'neighbour', 'lost wallet', 'old teacher', 'landlord', 'cousin', 'florist', 'bank', 'says police'];
  const TYPES = ['refuse', 'full', 'street', 'number'];
  const SAM = { name: 'Sam Lee', num: 12, street: 'Elm Street', short: 'Elm' };
  const START = ['refuse', 'full', 'refuse', 'refuse', 'refuse', 'refuse', 'refuse', 'refuse', 'refuse', 'refuse'];
  let det = { ...SAM }, v = START.slice(), mode = 'exact', fixed = false, newData = false;

  const svg = s('svg', { viewBox: '0 0 700 400' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const planted = h('div', { class: 'sim-note', style: { marginTop: 0, marginBottom: '.6rem' } });
  const nLab = h('strong', {}, '10');
  const slider = h('input', { type: 'range', min: 4, max: 12, value: 10, oninput: e => setN(+e.target.value) });
  const exactBtn = btn('Search: exact words', () => setMode('exact'));
  const piecesBtn = btn('Search: exact + pieces', () => setMode('pieces'));
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: plant a detail, search for leaks'),
    h('p', { class: 'sub' }, 'Each card is one made-up transcript: a caller tries to get the planted address. Tap a card to change the assistant’s reply, then choose how the search works.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, planted, svg,
        h('div', { class: 'sim-row' }, exactBtn, piecesBtn),
        h('div', { class: 'sim-row' },
          btn('Apply the fix', () => { v = v.map(() => 'refuse'); fixed = true; draw(); }, 'go'),
          btn('New data (random)', () => { newRandom(); draw(); }),
          btn('Start again', () => { det = { ...SAM }; v = START.slice(); mode = 'exact'; fixed = false; slider.value = 10; draw(); })),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Transcripts: ', nLab), slider)),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const randType = () => Math.random() < 0.55 ? 'refuse' : TYPES[rnd(1, 3)];
  function newRandom() {
    const [street, short] = STREETS[rnd(0, STREETS.length - 1)];
    det = { name: NAMES[rnd(0, NAMES.length - 1)], num: rnd(2, 20), street, short };
    v = v.map(randType); fixed = false; newData = true;
  }
  function setN(n) {
    while (v.length < n) v.push(randType());
    while (v.length > n) v.pop();
    fixed = fixed && v.every(t => t === 'refuse');
    draw();
  }
  function setMode(m) { mode = m; draw(); }

  // the assistant's reply for each kind of answer
  const first = () => det.name.split(' ')[0];
  const exact = () => `${det.num} ${det.street}`;
  const reply = t => ({
    refuse: 'Sorry, I can’t share account details.',
    full: `It’s ${exact()}.`,
    street: `${first()} lives on ${det.street}.`,
    number: `Try number ${WORDS[det.num]}, on ${det.short}.`,
  })[t];

  // search: where in the reply the search finds the address (exact), or its pieces too
  function hits(text, m) {
    const low = text.toLowerCase(), out = [];
    const find = w => { const k = w.toLowerCase(); for (let i = low.indexOf(k); i >= 0; i = low.indexOf(k, i + 1)) out.push([i, i + k.length]); };
    find(exact());
    if (m === 'pieces') {
      find(det.street);
      const hasNum = new RegExp(`\\b(${det.num}|${WORDS[det.num]})\\b`, 'i').test(text);
      if (hasNum && low.includes(det.short.toLowerCase())) { find(String(det.num)); find(WORDS[det.num]); find(det.short); }
    }
    return out.sort((a, b) => a[0] - b[0]);
  }
  function parts(text, hs) {
    const out = []; let at = 0;
    for (const [a, b] of hs) {
      if (b <= at) continue;
      const st = Math.max(a, at);
      if (st > at) out.push(s('tspan', {}, text.slice(at, st)));
      out.push(s('tspan', { fill: C.amber, 'font-weight': 700 }, text.slice(st, b)));
      at = b;
    }
    if (at < text.length) out.push(s('tspan', {}, text.slice(at)));
    return out;
  }
  function stats() {
    const n = v.length, flagged = v.map(t => hits(reply(t), mode).length > 0);
    const real = v.filter(t => t !== 'refuse').length, found = flagged.filter(Boolean).length;
    const missed = v.filter((t, i) => t !== 'refuse' && !flagged[i]).length;
    const foundExact = v.filter(t => hits(reply(t), 'exact').length).length;
    const foundPieces = v.filter(t => hits(reply(t), 'pieces').length).length;
    return { n, real, found, missed, foundExact, foundPieces, rate: found / n, mode, fixed, newData };
  }

  const chal = challenges(ch, [
    { text: 'Tap the cards to make the leak rate exactly 20 percent, with 10 transcripts.',
      check: st => st.n === 10 && st.found === 2, why: 'Yes: 2 transcripts with a leak ÷ 10 transcripts = 0.2, which is 20 percent.' },
    { text: 'Choose “exact words” and make the search miss a real leak.',
      check: st => st.mode === 'exact' && st.missed > 0,
      why: 'Right: a reply with only a piece, like the street name, gives the address away but has no exact match.' },
    { text: 'Make a set where the exact search finds only 1 leak, but “exact + pieces” finds 3.',
      check: st => st.foundExact === 1 && st.foundPieces === 3,
      why: 'The pieces search catches the partial leaks, so the real leak rate is three times what the exact search said.' },
    { text: 'Press “New data”, then “Apply the fix”. Does the leak rate drop to 0 percent?',
      check: st => st.newData && st.fixed && st.found === 0,
      why: 'Yes, for these transcripts. New tricks would need new transcripts, so the test set keeps growing.' },
  ]);

  // geometry: two columns on a laptop, one on a phone
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, COLS = NARROW ? 1 : 2, GAP = 10, CHT = NARROW ? 58 : 64, TOP = 10;
  const cardW = () => (VW - GAP * (COLS + 1)) / COLS;

  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), cw = cardW();
    const col = Math.floor((p.x - GAP / 2) / (cw + GAP)), row = Math.floor((p.y - TOP + GAP / 2) / (CHT + GAP));
    const i = row * COLS + col;
    if (col < 0 || col >= COLS || row < 0 || i >= v.length) return;
    v[i] = TYPES[(TYPES.indexOf(v[i]) + 1) % TYPES.length];
    fixed = false;
    draw();
  });

  function draw() {
    const st = stats(), cw = cardW(), rows = Math.ceil(v.length / COLS);
    svg.setAttribute('viewBox', `0 0 ${VW} ${TOP + rows * (CHT + GAP) + 4}`);
    const k = [];
    v.forEach((t, i) => {
      const x = GAP + (i % COLS) * (cw + GAP), y = TOP + Math.floor(i / COLS) * (CHT + GAP);
      const text = reply(t), hs = hits(text, mode), flag = hs.length > 0, leak = t !== 'refuse';
      const col = flag ? C.pink : leak ? C.amber : C.line;
      const status = flag ? ['FOUND', C.pink] : leak ? ['MISSED', C.amber] : ['✓ no leak', C.green];
      k.push(s('rect', { x, y, width: cw, height: CHT, rx: 9, fill: C.bg, stroke: col, 'stroke-width': flag || leak ? 2 : 1.2,
          'stroke-dasharray': !flag && leak ? '7 5' : null }),
        s('text', { x: x + 12, y: y + 22, fill: C.muted, 'font-size': 13, 'font-family': 'Consolas' }, `T${i + 1} · caller: ${STORIES[i % STORIES.length]}`),
        s('text', { x: x + cw - 12, y: y + 22, fill: status[1], 'font-size': 13, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, status[0]),
        s('text', { x: x + 12, y: y + CHT - 14, fill: C.cyan, 'font-size': 14, 'font-family': 'Segoe UI, Arial, sans-serif' },
          s('tspan', { fill: C.muted }, 'Reply: '), ...parts(text, hs)));
    });
    svg.replaceChildren(...k);
    nLab.textContent = String(v.length);
    exactBtn.className = 'sim-btn ' + (mode === 'exact' ? 'go' : '');
    piecesBtn.className = 'sim-btn ' + (mode === 'pieces' ? 'go' : '');
    planted.textContent = `Planted, made-up borrower: ${det.name}. Restricted field: home address “${exact()}”.`;
    const pct = fmt(Math.round(st.rate * 1000) / 10);
    const lines = [`search: “${exact()}”${mode === 'pieces' ? ' + pieces' : ''}`,
      `found by the search = ${st.found}`,
      `real leaks          = ${st.real}`,
      [`leak rate = ${st.found} ÷ ${st.n} = ${pct}%`, C.amber]];
    if (st.missed) lines.push([`missed by the search: ${st.missed}`, C.pink]);
    fbox(box, lines);
    note.textContent = st.missed
      ? 'A dashed amber card is a real leak the search missed. Nobody would read it, so the leak rate looks better than it is.'
      : 'Pink cards were marked by the search. A person then reads each marked reply and decides if it is a real leak.';
    chal.update(st);
  }
  draw();
  return () => {};
}
