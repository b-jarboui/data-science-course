// 21.1.6 Try it: chunking.
// The learner runs a simple chunker one sentence at a time (Step, or Play with a speed slider), changes the
// word limit, the overlap and the cutting rule, makes random pages from the library guide, and sees whether
// the chunk the assistant reads still holds the exception. The sim checks small challenges itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const GUIDE = {
    1: { topic: 'Opening hours', s: ['The library opens at nine and closes at eight on weekdays.', 'On Saturday it opens at ten and closes at four.', 'It is closed on Sunday.'] },
    2: { topic: 'Borrowing', s: ['With a library card you can borrow up to five books.', 'A loan lasts three weeks.', 'Bring your card to the desk or use the self-service machine.'] },
    3: { topic: 'Renewals', s: ['You can renew a loan twice, online or at the desk.', 'A reserved book cannot be renewed.', 'Return it by its due date.'], roles: ['rule', 'exception', ''] },
    4: { topic: 'Late fees', s: ['A late book costs twenty cents a day.', 'This late fee stops at five euros per book.', 'Children’s books have no late fee.'], roles: ['rule', 'rule', 'exception'] },
    5: { topic: 'Rooms and printing', s: ['Group study rooms R12 and R14 hold six people.', 'Book a room online for up to two hours.', 'Printing has a fee of ten cents a page.'] },
    6: { topic: 'Holidays', s: ['On public holidays the library is closed.', 'Returns can go in the drop box at the front door.'] },
  };
  const ASK = {
    3: { q: 'Someone reserved my book. Can I renew my loan online?', keys: ['renew', 'loan', 'online'],
      wrong: '“Yes, you can renew it twice.”', right: '“No. A reserved book cannot be renewed.”' },
    4: { q: 'My child’s picture book is three days late. What do I pay?', keys: ['late', 'book', 'day'],
      wrong: '“Sixty cents.” (3 × 20 cents)', right: '“Nothing. Children’s books have no late fee.”' },
  };
  const makeDoc = (pages, ask) => ({ pages, ask, sent: pages.flatMap(p => GUIDE[p].s.map((t, j) =>
    ({ t, page: p, words: t.split(' ').length, role: (GUIDE[p].roles || [])[j] || '' }))) });

  let doc = makeDoc([4], 4), max = 20, mode = 'count', overlap = false, speed = 2;
  let i = 0, chunks = [], hist = [], histC = [], msg = [], result = null, playing = false, timer = 0, docId = 0;
  const topicWins = new Set();
  const isDefault = () => doc.pages.join() === '4';

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const qEl = h('div', { class: 'sim-note', style: { marginTop: 0, color: C.amber, fontWeight: 650 } });
  const counter = h('span', { class: 'sim-note', style: { margin: 0 } });
  const stepBtn = btn('Step', () => { stop(); step(); }, 'go');
  const playBtn = btn('Play', () => toggle());
  const speedIn = h('input', { type: 'range', min: 1, max: 8, value: speed, oninput: e => { speed = +e.target.value; } });
  const maxVal = h('span', { style: { fontFamily: 'Consolas, monospace', fontWeight: 700, color: C.cyan } });
  const maxIn = h('input', { type: 'range', min: 11, max: 60, value: max, oninput: e => { max = +e.target.value; restart(); } });
  const modeBtn = btn('', () => { mode = mode === 'count' ? 'topic' : 'count'; restart(); });
  const overBtn = btn('', () => { overlap = !overlap; restart(); });
  const lab = (...kids) => h('label', { class: 'sim-note', style: { margin: 0, display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' } }, ...kids);
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: where does the chunker cut?'),
    h('p', { class: 'sub' }, 'The chunker takes one sentence at a time, one block per word. Change the word limit, the overlap or the cutting rule, then check: does the chunk the assistant reads still hold the exception?'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, qEl, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, stepBtn, playBtn, btn('Reset', () => restart()), counter),
        h('div', { class: 'sim-row' }, lab('Speed', speedIn)),
        h('div', { class: 'sim-row' }, lab('Max words per chunk', maxIn, maxVal)),
        h('div', { class: 'sim-row' }, modeBtn, overBtn,
          btn('New data (random pages)', () => newData()),
          btn('Back to page 4', () => { doc = makeDoc([4], 4); restart(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Predict first: with the 20-word limit, will the assistant answer page 4 right? Press Play and see.',
      check: st => st.done && st.isDefault && st.mode === 'count' && st.max === 20 && !st.overlap && !st.correct,
      why: 'Wrong: 17 + 6 = 23 is over 20, so the exception lands alone in chunk B and the assistant reads only the rule.' },
    { text: 'Keep the 20-word limit, turn overlap on, and run page 4 again. Is the answer right now?',
      check: st => st.done && st.isDefault && st.mode === 'count' && st.max === 20 && st.overlap,
      why: 'Still wrong: chunk B now repeats sentence 2, but chunk A, the best match, still lacks the exception. Overlap lowers the risk, it does not remove it.' },
    { text: 'Overlap off: find the smallest word limit that keeps page 4’s rule and its exception together.',
      check: st => st.done && st.isDefault && st.mode === 'count' && !st.overlap && st.max === 23 && st.correct,
      why: '23 words is the whole page. One word less, and the cut falls between the rule and its exception.' },
    { text: 'Switch to “cut where the topic changes”, press “New data” and run it to the end. Do it on two different pages.',
      check: st => st.topicRuns >= 2,
      why: 'Right every time: cutting where the topic changes keeps each rule with its exception, whatever the word counts.' },
  ]);

  const words = c => c.reduce((a, j) => a + doc.sent[j].words, 0);
  const letter = c => 'ABCDEFGHIJKL'[c];
  const firstChunk = j => chunks.findIndex(c => c.includes(j));

  function restart() {
    stop();
    i = 0; chunks = []; hist = []; histC = []; result = null;
    msg = ['Press Step: the chunker takes the first sentence.'];
    draw();
  }
  function newData() {
    const ask = [3, 4][rnd(0, 1)];
    const pages = [1, 2, 3, 4, 5, 6].filter(p => p !== ask).sort(() => Math.random() - 0.5).slice(0, rnd(1, 2));
    pages.splice(rnd(0, pages.length), 0, ask);
    doc = makeDoc(pages, ask); docId++;
    restart();
  }

  // one iteration: the next sentence either joins the open chunk or starts a new one
  function step() {
    const S = doc.sent;
    if (i >= S.length) return;
    const w = S[i].words, cur = chunks[chunks.length - 1];
    if (!cur) {
      chunks.push([i]);
      msg = [`sentence ${i + 1}: ${w} words`, [`open chunk A = ${w} words`, C.cyan]];
    } else {
      const cw = words(cur), last = cur[cur.length - 1];
      const fits = mode === 'count' ? cw + w <= max : S[last].page === S[i].page;
      if (fits) {
        cur.push(i);
        msg = mode === 'count'
          ? [`sentence ${i + 1}: ${w} words`, `${cw} + ${w} = ${cw + w} ≤ ${max}`, [`fits: add it to chunk ${letter(chunks.length - 1)}`, C.green]]
          : [`sentence ${i + 1}: same topic (page ${S[i].page})`, `${cw} + ${w} = ${cw + w} words`, [`add it to chunk ${letter(chunks.length - 1)}`, C.green]];
      } else {
        const next = overlap && mode === 'count' && S[last].words + w <= max ? [last, i] : [i];
        chunks.push(next);
        const N = letter(chunks.length - 1);
        msg = [mode === 'count' ? `sentence ${i + 1}: ${cw} + ${w} = ${cw + w} > ${max}` : `topic changes: page ${S[last].page} → page ${S[i].page}`,
          [`cut: sentence ${i + 1} starts chunk ${N}`, C.pink]];
        if (next.length === 2) msg.push([`overlap: chunk ${N} repeats sentence ${last + 1}`, C.violet]);
      }
    }
    i++;
    hist.push(words(chunks[chunks.length - 1])); histC.push(chunks.length - 1);
    if (i === S.length) finish();
    draw();
  }

  // retrieval: the chunk with the most key words from the question; the assistant reads only that chunk
  function finish() {
    const ask = ASK[doc.ask], keyed = w => ask.keys.some(k => w.startsWith(k));
    const score = c => c.reduce((a, j) => a + doc.sent[j].t.toLowerCase().split(' ').map(w => w.replace(/[^a-z0-9]/g, '')).filter(keyed).length, 0);
    const scores = chunks.map(score), best = scores.indexOf(Math.max(...scores));
    const exc = doc.sent.findIndex(x => x.page === doc.ask && x.role === 'exception');
    const correct = chunks[best].includes(exc);
    result = { scores, best, correct, exc };
    if (correct && mode === 'topic' && !isDefault()) topicWins.add(docId);
    msg = [`key-word hits: ${scores.map((v, c) => `${letter(c)} ${v}`).join(', ')}`, `the assistant reads chunk ${letter(best)} only`,
      [correct ? `answer: ${ask.right}  ✓` : `answer: ${ask.wrong}  ✗`, correct ? C.green : C.pink]];
  }

  function stop() { playing = false; clearTimeout(timer); }
  function tick() {
    step();
    if (i >= doc.sent.length) { stop(); draw(); return; }
    timer = setTimeout(tick, 1800 / speed);
  }
  function toggle() {
    if (playing) { stop(); draw(); return; }
    if (i >= doc.sent.length) restart();
    playing = true; tick();
  }

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps words readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const COL = [C.cyan, C.violet, C.amber, C.green, C.pink];
  const PCOL = p => p === 4 ? C.amber : p === 5 ? C.cyan : C.ink;

  function draw() {
    const S = doc.sent, n = S.length, X0 = 30 * F, BX = VW - 64 * F, RH = 40 * F, GAP = 20 * F;
    const pitch = Math.min(30, (BX - X0 - 76 * F) / 11), bw = pitch * 0.8, bh = 12 * F;
    const k = [], rowTop = [], heads = [];
    let y = 4;
    S.forEach((x, j) => {
      if (j === 0 || S[j - 1].page !== x.page) { y += GAP; heads.push([y - 5, x.page]); }
      rowTop.push(y); y += RH;
    });
    // the chunk the assistant reads
    if (result) {
      const c = chunks[result.best];
      k.push(s('rect', { x: X0 - 26 * F, y: rowTop[c[0]] - 3, width: BX - X0 + 26 * F, height: rowTop[c[c.length - 1]] + RH - 4 * F - rowTop[c[0]],
        fill: COL[result.best % 5], 'fill-opacity': .1, rx: 8 }));
    }
    heads.forEach(([hy, p]) => k.push(s('text', { x: X0 - 24 * F, y: hy, fill: PCOL(p), 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' },
      `page ${p} · ${GUIDE[p].topic}`)));
    S.forEach((x, j) => {
      const top = rowTop[j], done = j < i, fs = 12.5 * F, avail = BX - X0 - 8;
      k.push(s('text', { x: X0 - 12 * F, y: top + 13 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, j + 1));
      const est = x.t.length * fs * 0.5;
      k.push(s('text', { x: X0, y: top + 13 * F, fill: done ? C.ink : C.muted, 'font-size': fs, 'font-family': 'Segoe UI, Arial, sans-serif',
        textLength: est > avail ? avail : null, lengthAdjust: est > avail ? 'spacingAndGlyphs' : null }, x.t));
      const col = done ? COL[firstChunk(j) % 5] : C.muted;
      for (let b = 0; b < x.words; b++)
        k.push(s('rect', { x: X0 + b * pitch, y: top + 19 * F, width: bw, height: bh, rx: 2, fill: col, 'fill-opacity': done ? .85 : .3,
          stroke: j === i - 1 ? '#ffffff' : 'none', 'stroke-width': 1 }));
      const ex = X0 + x.words * pitch + 6;
      k.push(s('text', { x: ex, y: top + 29 * F, fill: C.muted, 'font-size': 11 * F, 'font-family': 'Consolas' }, `${x.words} words`));
      if (x.role) k.push(s('text', { x: ex + 64 * F, y: top + 29 * F, fill: x.role === 'exception' ? C.pink : C.amber, 'font-size': 11 * F, 'font-weight': 700, 'font-family': 'Consolas' }, x.role));
    });
    // chunk brackets: overlapping neighbours sit in different columns
    chunks.forEach((c, ci) => {
      const bx = BX + 10 * F + (ci % 2) * 22 * F, y1 = rowTop[c[0]] + 4, y2 = rowTop[c[c.length - 1]] + RH - 10 * F, col = COL[ci % 5];
      const sw = result && result.best === ci ? 4 : 2;
      k.push(s('path', { d: `M${bx - 6} ${y1} H${bx} V${y2} H${bx - 6}`, fill: 'none', stroke: col, 'stroke-width': sw }),
        s('text', { x: bx + 9 * F, y: (y1 + y2) / 2 + 5 * F, fill: col, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, letter(ci)));
    });
    // the curve: words in the open chunk after each step
    const top = y + 30 * F, ht = 96 * F, bot = top + ht, xr = VW - 16;
    const ymax = Math.max(mode === 'count' ? max : 0, ...hist, 20) * 1.12;
    const px = st => X0 + (st - 0.5) / n * (xr - X0), py = v => bot - v / ymax * ht;
    k.push(s('text', { x: X0, y: top - 10 * F, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Segoe UI, Arial, sans-serif' }, 'words in the open chunk, after each step'),
      s('line', { x1: X0, x2: xr, y1: bot, y2: bot, stroke: C.line, 'stroke-width': 2 }));
    if (mode === 'count') {
      const ym = py(max);
      k.push(s('line', { x1: X0, x2: xr, y1: ym, y2: ym, stroke: C.pink, 'stroke-width': 2, 'stroke-dasharray': '7 6' }),
        s('text', { x: xr, y: ym - 5, fill: C.pink, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `limit ${max}`));
    }
    for (let st = 1; st <= n; st++)
      k.push(s('text', { x: px(st), y: bot + 15 * F, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, st));
    if (hist.length > 1) k.push(s('polyline', { points: hist.map((v, j) => `${px(j + 1)},${py(v)}`).join(' '), fill: 'none', stroke: C.cyan, 'stroke-width': 2, 'stroke-opacity': .6 }));
    hist.forEach((v, j) => k.push(s('circle', { cx: px(j + 1), cy: py(v), r: 5 * F, fill: COL[histC[j] % 5] }),
      s('text', { x: px(j + 1), y: py(v) - 9 * F, fill: C.ink, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v)));
    svg.setAttribute('viewBox', `0 0 ${VW} ${bot + 24 * F}`);
    svg.replaceChildren(...k);

    fbox(box, msg);
    const ask = ASK[doc.ask];
    qEl.textContent = `Visitor: “${ask.q}”`;
    note.textContent = result
      ? (result.correct ? 'Right: the chunk the assistant reads holds the exception too.'
        : `Wrong: the exception (sentence ${result.exc + 1}) is on the other side of a cut, in a chunk the assistant never reads.`)
      : `The assistant will read the chunk with the most key words from the question (${ask.keys.join(', ')}).` +
        (mode === 'topic' ? ' Rule now: cut only where the page topic changes.' : ' Rule now: cut when the next sentence would pass the limit.');
    counter.textContent = `step ${i} of ${n}`;
    playBtn.textContent = playing ? 'Pause' : 'Play';
    stepBtn.disabled = i >= n;
    maxVal.textContent = String(max);
    maxIn.disabled = mode === 'topic';
    modeBtn.textContent = mode === 'count' ? 'Rule: cut by word count' : 'Rule: cut where the topic changes';
    overBtn.textContent = `Overlap: ${overlap ? 'on' : 'off'}`;
    overBtn.disabled = mode === 'topic';
    chal.update({ done: i === n, isDefault: isDefault(), mode, overlap, max, correct: !!(result && result.correct), topicRuns: topicWins.size });
  }
  restart();
  return () => stop();
}
