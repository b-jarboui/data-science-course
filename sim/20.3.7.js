// 20.3.7 Try it: the context window as one fixed token budget.
// The learner sets the window size and the reserve for the reply, adds earlier messages or makes a random chat,
// then writes the reply one token at a time (Step / Play) and sees what is dropped and where the reply stops.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const EXCH = [
    [['Is', 'the', 'café', 'open', '?'], ['Yes', ',', 'until', 'six', '.']],
    [['Where', 'is', 'room', 'B12', '?'], ['Second', 'floor', '.']],
    [['Is', 'the', 'gym', 'free', 'today', '?'], ['Yes', ',', 'for', 'students', '.']],
    [['When', 'does', 'the', 'bus', 'leave', '?'], ['Every', 'ten', 'minutes', '.']],
    [['Can', 'I', 'print', 'here', '?'], ['Yes', ',', 'in', 'the', 'library', '.']],
  ];
  const ASKS = [
    [['When', 'will', 'the', 'library', 'open', '?'], ['The', 'library', 'will', 'open', 'at', 'ten', '.']],
    [['Where', 'can', 'I', 'eat', 'lunch', '?'], ['The', 'café', 'on', 'the', 'ground', 'floor', 'serves', 'lunch', '.']],
    [['How', 'late', 'is', 'the', 'lab', 'open', '?'], ['Until', 'nine', '.']],
    [['Who', 'runs', 'the', 'chess', 'club', '?'], ['A', 'student', 'team', 'runs', 'it', '.']],
  ];
  let hist, ask, W, R, k = 0, speed = 3, playing = false, timer = 0;
  function start() { hist = [EXCH[0]]; ask = ASKS[0]; W = 20; R = 0; }
  start();

  const svg = s('svg', { viewBox: '0 0 700 300' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const counter = h('span', { class: 'sim-note', style: { margin: 0 } });
  const playBtn = btn('Play', () => togglePlay());
  const wVal = h('b'), rVal = h('b'), sVal = h('b');
  const wIn = h('input', { type: 'range', min: 10, max: 40, value: W, style: { flex: '1 1 8rem' },
    oninput: () => { W = +wIn.value; changed(); } });
  const rIn = h('input', { type: 'range', min: 0, max: 14, value: R, style: { flex: '1 1 8rem' },
    oninput: () => { R = +rIn.value; changed(); } });
  const sIn = h('input', { type: 'range', min: 1, max: 8, value: speed, style: { flex: '1 1 8rem' },
    oninput: () => { speed = +sIn.value; draw(); } });
  const lab = (text, val, input) => h('div', { class: 'sim-row', style: { alignItems: 'center' } },
    h('span', { class: 'sim-note', style: { margin: 0, minWidth: '9.5rem' } }, text, val), input);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: the context window'),
    h('p', { class: 'sub' }, 'The boxes are the window: one token per box. Set the window size and how many boxes to reserve for the reply, then write the reply one token at a time.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Write next token', () => { stop(); step(); }, 'go'), playBtn,
          btn('Reset reply', () => { stop(); k = 0; draw(); }), counter),
        lab('Speed (tokens/s): ', sVal, sIn),
        lab('Window size: ', wVal, wIn),
        lab('Reserve for reply: ', rVal, rIn),
        h('div', { class: 'sim-row' },
          btn('Add an earlier exchange', () => { if (hist.length < 5) { hist.push(EXCH[rnd(0, EXCH.length - 1)]); changed(); } }),
          btn('New data (random chat)', () => {
            hist = Array.from({ length: rnd(0, 3) }, () => EXCH[rnd(0, EXCH.length - 1)]);
            ask = ASKS[rnd(0, ASKS.length - 1)]; changed();
          }),
          btn('Start again', () => { start(); changed(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'With no reserve, press Play. Where does the reply stop?',
      check: st => st.cut && st.R === 0,
      why: 'The messages left too few boxes, so the reply stopped as soon as the window was full.' },
    { text: 'Reserve enough boxes for the whole reply, then let it finish.',
      check: st => st.complete && st.R > 0,
      why: 'The reserve kept boxes free, and the oldest messages were dropped if needed, so the reply had room to finish.' },
    { text: 'Let the whole reply finish without dropping any earlier message.',
      check: st => st.complete && st.dropped === 0 && st.oldN > 0,
      why: 'A bigger window holds everything: the budget grew, so nothing had to go.' },
    { text: 'Find the smallest reserve that still lets the whole reply finish.',
      check: st => st.complete && st.R > 0 && st.R === st.n,
      why: 'The reserve must be at least as long as the reply. Every extra box is one box fewer for messages.' },
  ]);

  // budget: drop the oldest messages until the rest fits in window − reserve
  function plan() {
    const old = hist.flatMap(([q, a]) => [q, a]), q = ask[0], reply = ask[1];
    const total = old.reduce((t, m) => t + m.length, 0) + q.length;
    let i = 0, keptN = total;
    while (keptN > W - R && i < old.length) { keptN -= old[i].length; i++; }
    const start = R > 0 ? W - R : keptN;          // the reply begins at the reserve, or right after the messages
    return { old, q, reply, total, keptN, dropped: old.slice(0, i), kept: old.slice(i), start, room: W - start };
  }

  function changed() { stop(); k = 0; draw(); }
  function step() {
    const p = plan();
    if (k < Math.min(p.reply.length, p.room)) { k++; draw(); return true; }
    draw(); return false;
  }
  function stop() { playing = false; clearTimeout(timer); }
  function tick() {
    if (!playing) return;
    if (!step()) { stop(); draw(); return; }
    timer = setTimeout(tick, 1000 / speed);
  }
  function togglePlay() {
    if (playing) { stop(); draw(); return; }
    const p = plan();
    if (k >= Math.min(p.reply.length, p.room)) k = 0;
    playing = true; draw(); timer = setTimeout(tick, 1000 / speed);
  }

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: fewer, wider boxes keep the words readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1, COLS = NARROW ? 6 : 10, PAD = 10;
  const SANS = 'Segoe UI, Arial, sans-serif';

  function draw() {
    const qMax = W - ask[0].length;
    R = Math.min(R, qMax);
    rIn.max = qMax; rIn.value = R; wIn.value = W; sIn.value = speed;
    wVal.textContent = W; rVal.textContent = R; sVal.textContent = speed;

    const p = plan(), n = p.reply.length;
    const done = k >= Math.min(n, p.room), complete = done && k === n, cut = done && k < n;
    const cells = Array(W).fill(null);
    let i = R > 0 ? W - R - p.keptN : 0;
    for (const m of p.kept) for (const w of m) cells[i++] = { w, c: C.cyan };
    for (const w of p.q) cells[i++] = { w, c: C.violet };
    for (let j = 0; j < k; j++) cells[p.start + j] = { w: p.reply[j], c: C.amber };
    const used = cells.filter(Boolean).length;

    const bw = (VW - 2 * PAD) / COLS, bh = 46 * F, gap = 10 * F, top = 40 * F, rows = Math.ceil(W / COLS);
    const fit = w => Math.min(15 * F, (bw - 12) / (0.58 * Math.max(2, w.length)));
    const el = [s('text', { x: PAD, y: 24 * F, fill: C.green, 'font-size': 15 * F, 'font-weight': 700, 'font-family': 'Consolas' },
      `CONTEXT WINDOW: ${W} TOKENS · USED ${used} / ${W}`)];
    for (let b = 0; b < W; b++) {
      const x = PAD + (b % COLS) * bw, y = top + Math.floor(b / COLS) * (bh + gap), cell = cells[b];
      el.push(s('rect', { x: x + 4, y, width: bw - 8, height: bh, rx: 6, fill: cell ? cell.c : C.bg, 'fill-opacity': cell ? 0.22 : 1,
        stroke: cell ? cell.c : C.muted, 'stroke-width': 1.5 }));
      if (R > 0 && b >= W - R) el.push(s('rect', { x: x + 1, y: y - 3, width: bw - 2, height: bh + 6, rx: 8, fill: 'none',
        stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '5 4' }));
      if (cell) el.push(s('text', { x: x + bw / 2, y: y + bh / 2 + fit(cell.w) * 0.35, fill: C.ink, 'font-size': fit(cell.w),
        'font-weight': 700, 'text-anchor': 'middle', 'font-family': SANS }, cell.w));
    }
    let y = top + rows * (bh + gap) + 8 * F;
    const chips = (label, words, color) => {
      el.push(s('text', { x: PAD, y: y + 12 * F, fill: color, 'font-size': 14 * F, 'font-family': SANS }, label));
      y += 22 * F; let x = PAD;
      for (const w of words) {
        const cw = 16 * F + 8.5 * F * w.length;
        if (x + cw > VW - PAD) { x = PAD; y += 30 * F; }
        el.push(s('rect', { x, y, width: cw, height: 24 * F, rx: 5, fill: color, 'fill-opacity': 0.12, stroke: color, 'stroke-dasharray': '4 3' }),
          s('text', { x: x + cw / 2, y: y + 17 * F, fill: color, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': SANS }, w));
        x += cw + 5;
      }
      y += 34 * F;
    };
    if (p.dropped.length) chips('Dropped (the model cannot see these):', p.dropped.flat(), C.pink);
    if (cut) chips('No box left for (never written):', p.reply.slice(k), C.muted);
    svg.setAttribute('viewBox', `0 0 ${VW} ${Math.max(y, 160 * F)}`);
    svg.replaceChildren(...el);

    const lens = [...p.kept, p.q].map(m => m.length), droppedN = p.total - p.keptN;
    const lines = [`window       = ${W} tokens`,
      R > 0 ? `reserve      = ${R} → messages ≤ ${W} − ${R} = ${W - R}` : 'reserve      = 0 (none)'];
    if (droppedN) lines.push([`dropped      = ${droppedN} (oldest first)`, C.pink]);
    lines.push(`messages     = ${lens.length <= 6 && lens.length > 1 ? lens.join(' + ') + ' = ' : ''}${p.keptN}`,
      R > 0 ? `reply room   = reserve = ${p.room}` : `reply room   = ${W} − ${p.keptN} = ${p.room}`,
      `reply needs  = ${n}`);
    if (complete) lines.push([`complete: ${n} ≤ ${p.room}`, C.green]);
    else if (cut) lines.push([`cut after ${k}: ${n} > ${p.room}`, C.pink]);
    else if (k) lines.push([`step ${k}: “${p.reply[k - 1]}” → box ${p.start + k}`, C.amber]);
    else lines.push(['press Write or Play', C.muted]);
    fbox(box, lines);

    note.textContent = complete ? 'The whole reply fit inside the window.'
      : cut ? 'The window is full: there is no box left, so the model has to stop. The student sees a cut reply.'
      : 'Cyan: earlier messages. Violet: the new question. Amber: the reply. Dashed amber boxes are reserved for the reply.';
    counter.textContent = `Step ${k} · used ${used} / ${W}`;
    playBtn.textContent = playing ? 'Pause' : 'Play';
    chal.update({ complete, cut, R, W, n, dropped: droppedN, oldN: p.old.length });
  }
  draw();
  return () => stop();
}
