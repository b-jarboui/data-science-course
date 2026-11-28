// 20.3.1 Try it: autoregressive decoding.
// The learner runs the loop one step at a time (predict one token, add it, predict again), plays it,
// drags the chances, makes random chances, and writes many answers to see which ones come out.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, fmt, challenges } = kit;
  const PREFIX = ['The', 'library', 'will', 'open'];
  // Chances from chapter 20.3. After any other prefix this small sim simply ends with a full stop.
  const START = {
    '': [['at', 45], ['on', 30], ['soon', 15], ['late', 6], ['purple', 4]],
    'at': [['nine', 40], ['ten', 30], ['noon', 30]],
    'on': [['Monday', 80], ['time', 20]],
    'at nine': [['.', 70], ['tomorrow', 30]],
    'at ten': [['.', 90], ['tomorrow', 10]],
  };
  const copy = t => Object.fromEntries(Object.entries(t).map(([k, r]) => [k, r.map(x => x.slice())]));
  let table = copy(START), words = [], log = [], ended = null, limit = 6, speed = 3, timer = 0, playing = false;
  let tally = new Map(), answers = 0, surprise = false, sawPurple = false, limitStop = false;

  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div'), tallyEl = h('div');
  const playBtn = btn('▶ Play', () => togglePlay());
  const counter = h('span', { class: 'sim-note', style: { margin: 0 } });
  const limitVal = h('span', { class: 'sim-note', style: { margin: 0 } });
  const speedIn = h('input', { type: 'range', min: 1, max: 8, value: speed, 'aria-label': 'Speed', oninput: e => { speed = +e.target.value; } });
  const limitIn = h('input', { type: 'range', min: 1, max: 6, value: limit, 'aria-label': 'Length limit', oninput: e => { limit = +e.target.value; clear(); } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: write one token at a time'),
    h('p', { class: 'sub' }, 'Press Step: the model reads the whole prefix, draws one token by chance, and adds it to the end. Drag a bar to change a chance. (After soon, late, purple, noon, Monday, time or tomorrow, this small model just ends with a full stop.)'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Step', () => step(), 'go'), playBtn,
          btn('Reset', () => { tally = new Map(); answers = 0; clear(); })),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Speed'), speedIn, counter),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, limitVal, limitIn),
        h('div', { class: 'sim-row' },
          btn('New data (random chances)', () => { table = Object.fromEntries(Object.entries(START).map(([k, r]) => [k, randomRow(r)])); tally = new Map(); answers = 0; clear(); }),
          btn('Original chances', () => { table = copy(START); tally = new Map(); answers = 0; clear(); }),
          btn('Write 100 answers', () => writeMany(100)))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch), h('div', { class: 'sim-card' }, tallyEl)))));

  const chal = challenges(ch, [
    { text: 'Press Step until the answer ends. Count the predictions.',
      check: st => st.ended === 'end', why: 'Each Step is one prediction: one new token, added to the end, then the model reads the longer prefix.' },
    { text: 'Get an answer where a token that was NOT the most likely is drawn (an amber dot).',
      check: st => st.surprise, why: 'A draw by chance can pick a less likely token, and every later step has to build on it.' },
    { text: 'Make the model write “purple”: drag its bar up, or keep trying.',
      check: st => st.sawPurple, why: 'Once “purple” is added it stays: the model must continue from “The library will open purple”.' },
    { text: 'Set the length limit to 1 and press Step. What stops the answer?',
      check: st => st.limitStop, why: 'No full stop came in time, so the length limit stopped the loop.' },
  ]);

  const key = ws => ws.join(' ');
  const rowFor = ws => table[key(ws)] || [['.', 100]];
  const text = (ws, cut) => [...PREFIX, ...ws].join(' ').replace(/ \.$/, '.') + (cut ? ' …' : '');
  function randomRow(row) {
    const raw = row.map(() => Math.random() + 0.05), sum = raw.reduce((a, b) => a + b, 0);
    const p = raw.map(x => Math.max(1, Math.round(x / sum * 100)));
    p[p.indexOf(Math.max(...p))] += 100 - p.reduce((a, b) => a + b, 0);
    return row.map(([w], i) => [w, p[i]]);
  }
  // one ticket out of 100: each token owns as many tickets as its chance
  function drawOne(row) {
    const t = Math.random() * 100; let acc = 0;
    for (const r of row) { acc += r[1]; if (t < acc) return [r, t]; }
    return [row[row.length - 1], t];
  }
  function count(a) { tally.set(a, (tally.get(a) || 0) + 1); answers++; }
  function clear() { words = []; log = []; ended = null; draw(); }
  function step() {
    if (ended) clear();
    const row = rowFor(words), top = Math.max(...row.map(r => r[1]));
    const [[w, p], t] = drawOne(row);
    words.push(w);
    log.push({ row: row.map(r => r.slice()), w, p, top: p >= top - 1e-9, ticket: Math.min(100, Math.floor(t) + 1) });
    if (p < top - 1e-9) surprise = true;
    if (w === 'purple') sawPurple = true;
    if (w === '.') ended = 'end';
    else if (words.length >= limit) { ended = 'limit'; limitStop = true; }
    if (ended) count(text(words, ended === 'limit'));
    draw();
  }
  function writeMany(n) {
    for (let i = 0; i < n; i++) {
      const ws = [];
      for (;;) {
        const [[w]] = drawOne(rowFor(ws)); ws.push(w);
        if (w === '.') { count(text(ws)); break; }
        if (ws.length >= limit) { count(text(ws, true)); break; }
      }
      if (ws.includes('purple')) sawPurple = true;
    }
    draw();
  }
  function tick() {
    if (!playing) return;
    if (ended) clear(); else step();
    timer = setTimeout(tick, 1800 / speed);
  }
  function togglePlay() {
    playing = !playing; playBtn.textContent = playing ? '❚❚ Pause' : '▶ Play';
    clearTimeout(timer); if (playing) tick();
  }

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.2 : 1, X1 = VW - 12;
  const X0 = NARROW ? 96 : 130, BWX = X1 - X0 - 56 * F, BY0 = 124, BP = 34, BHT = 22;
  const CY0 = 346, CY1 = 446;
  svg.setAttribute('viewBox', `0 0 ${VW} 470`);

  // drag a bar: its length sets that token's chance, the others share the rest
  let dragRow = -1;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    if (ended) return;
    const p = toSvg(e), row = rowFor(words), i = Math.floor((p.y - BY0 + 6) / BP);
    if (row.length < 2 || i < 0 || i >= row.length || p.y < BY0 - 6) return;
    dragRow = i; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (dragRow < 0) return;
    const p = toSvg(e), row = rowFor(words);
    const v = Math.max(1, Math.min(99, (p.x - X0) / BWX * 100));
    const rest = row.reduce((a, r) => a + r[1], 0) - row[dragRow][1];
    row.forEach((r, k) => { if (k !== dragRow) r[1] = rest > 0 ? r[1] * (100 - v) / rest : (100 - v) / (row.length - 1); });
    row[dragRow][1] = v;
    tally = new Map(); answers = 0;
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragRow = -1; });

  function draw() {
    const k = [], mono = 'Consolas, monospace', sans = '"Segoe UI", Arial, sans-serif';
    const txt = (x, y, str, a = {}) => s('text', { x, y, fill: C.ink, 'font-size': 15 * F, 'font-family': mono, ...a }, str);

    // the row of cards: the prefix grows left to right, "?" is the next slot
    const toks = [...PREFIX, ...words];
    const cards = toks.map((w, i) => ({ w, kind: i < 4 ? 'old' : w === 'purple' ? 'bad' : 'new' }));
    if (!ended) cards.push({ w: '?', kind: 'next' });
    const cw = c => Math.max(28, c.w.length * 9.6 + 18) * F, gap = 6 * F;
    const total = cards.reduce((a, c) => a + cw(c), 0) + gap * (cards.length - 1);
    const z = Math.min(1, (VW - 16) / total), ch = 36 * F * z;
    let x = (VW - total * z) / 2, lastRight = x;
    const firstLeft = x;
    for (const c of cards) {
      const w = cw(c) * z, filled = c.kind === 'new' || c.kind === 'bad';
      const col = c.kind === 'bad' ? C.pink : c.kind === 'new' ? C.cyan : c.kind === 'next' ? C.muted : '#536485';
      k.push(s('rect', { x, y: 22, width: w, height: ch, rx: 6, fill: filled ? col : C.bg, 'fill-opacity': filled ? 0.2 : 1, stroke: col, 'stroke-width': 2, 'stroke-dasharray': c.kind === 'next' ? '5 4' : null }),
        txt(x + w / 2, 22 + ch / 2 + 5.5 * F * z, c.w, { fill: c.kind === 'old' ? C.ink : col, 'font-size': 16 * F * z, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': sans }));
      if (c.kind !== 'next') lastRight = x + w;
      x += w + gap * z;
    }
    const by = 22 + ch + 8;
    k.push(s('line', { x1: firstLeft, x2: lastRight, y1: by, y2: by, stroke: C.amber, 'stroke-width': 2 }),
      txt((firstLeft + lastRight) / 2, by + 18, `prefix = ${toks.length} tokens · predictions = ${log.length}`, { fill: C.amber, 'font-size': 13 * F, 'text-anchor': 'middle' }));

    // chances for the next token (or, once the answer ended, the last step's chances)
    const row = ended ? log[log.length - 1].row : rowFor(words), picked = ended ? log[log.length - 1].w : null;
    k.push(txt(8, BY0 - 12, ended ? `chances at the last step (drawn: “${picked}”)` : 'chances for the next token (drag a bar)', { fill: C.muted, 'font-size': 13 * F, 'font-family': sans }));
    row.forEach(([w, p], i) => {
      const y = BY0 + i * BP, bw = p / 100 * BWX, off = picked && w !== picked, col = off ? C.muted : C.cyan;
      k.push(txt(X0 - 8, y + 16, w, { 'text-anchor': 'end' }),
        s('rect', { x: X0, y, width: Math.max(1, bw), height: BHT, rx: 3, fill: col, 'fill-opacity': off ? 0.35 : 0.8 }),
        txt(X0 + bw + 6, y + 16, fmt(Math.round(p)) + '%', { fill: col, 'font-weight': 700 }));
    });

    // the curve grows one dot per prediction: the chance of the token that was drawn
    k.push(txt(8, CY0 - 22, 'chance of each drawn token, step by step', { fill: C.muted, 'font-size': 13 * F, 'font-family': sans }));
    const sx = i => X0 + (i + 0.5) * (X1 - X0) / 6, sy = p => CY1 - p / 100 * (CY1 - CY0);
    for (const g of [0, 50, 100]) k.push(s('line', { x1: X0, x2: X1, y1: sy(g), y2: sy(g), stroke: C.line }),
      txt(X0 - 8, sy(g) + 4, g + '%', { fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end' }));
    k.push(txt(X0 - 8, 466, 'step', { fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end' }));
    for (let i = 0; i < 6; i++) k.push(txt(sx(i), 466, i + 1, { fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle' }));
    if (log.length > 1) k.push(s('polyline', { points: log.map((l, i) => `${sx(i)},${sy(l.p)}`).join(' '), fill: 'none', stroke: C.cyan, 'stroke-width': 2, 'stroke-opacity': 0.6 }));
    log.forEach((l, i) => {
      const col = l.top ? C.cyan : C.amber;
      k.push(s('circle', { cx: sx(i), cy: sy(l.p), r: 6 * F, fill: col }),
        txt(sx(i), sy(l.p) - 10, fmt(Math.round(l.p)) + '%', { fill: col, 'font-size': 13 * F, 'text-anchor': 'middle' }));
    });
    svg.replaceChildren(...k);

    // formula box: the numbers of this step
    if (!log.length) fbox(box, [`prefix = ${text([])}`, 'tokens = 4', ['Step: predict one token', C.amber]]);
    else {
      const l = log[log.length - 1], n = log.length;
      fbox(box, [`step ${n}: read ${3 + n} tokens`,
        `chances = ${l.row.map(([w, p]) => `${w} ${fmt(Math.round(p))}`).join(', ')}`,
        `ticket ${l.ticket} of 100 → “${l.w}” (${fmt(Math.round(l.p))}%)${l.top ? '' : ', not the top'}`,
        `prefix  = ${4 + n} tokens`,
        [ended === 'end' ? 'full stop drawn: the answer ends'
          : ended === 'limit' ? `length limit (${limit} new) reached: stop`
          : 'next: predict again from the longer prefix', C.amber]]);
    }
    note.textContent = (ended ? 'Answer: ' : 'So far: ') + text(words, ended === 'limit')
      + '. Cyan dot: the most likely token was drawn. Amber dot: a less likely one was drawn.';
    counter.textContent = `Iteration: ${log.length}`;
    limitVal.textContent = `Length limit: ${limit} new token${limit > 1 ? 's' : ''}`;

    // finished answers, counted
    const top = [...tally].sort((a, b) => b[1] - a[1]).slice(0, 6);
    tallyEl.replaceChildren(
      h('div', { class: 'sim-note', style: { marginTop: 0 } }, answers ? `${answers} answers written. Most common:` : 'Finished answers are counted here. Try “Write 100 answers”.'),
      ...top.map(([a, c]) => h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 3.2rem', gap: '.5rem', alignItems: 'center', marginTop: '.4rem', font: '.875rem/1.3 Consolas, monospace' } },
        h('div', {}, a, h('div', { style: { height: '6px', width: `${c / answers * 100}%`, background: a.includes('purple') ? C.pink : C.cyan, borderRadius: '3px', marginTop: '3px' } })),
        h('div', { style: { textAlign: 'right', color: C.cyan } }, `${fmt(Math.round(c / answers * 100))}%`))));

    chal.update({ ended, steps: log.length, surprise, sawPurple, limitStop, limit, answers });
  }
  draw();
  return () => { playing = false; clearTimeout(timer); };
}
