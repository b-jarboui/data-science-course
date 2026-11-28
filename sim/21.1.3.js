// 21.1.3 Try it: rank the six library pages with BM25.
// The learner builds the query (type it, or tap words on the pages), moves the repeat ceiling (k1)
// and the length setting (b), draws random queries, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;
  const PAGES = [
    ['Opening hours', 'The library opens at nine and closes at eight on weekdays. On Saturday it opens at ten and closes at four. It is closed on Sunday.'],
    ['Borrowing', 'With a library card you can borrow up to five books. A loan lasts three weeks. Bring your card to the desk or use the self-service machine.'],
    ['Renewals', 'You can renew a loan twice, online or at the desk. A reserved book cannot be renewed. Return it by its due date.'],
    ['Late fees', 'A late book costs twenty cents a day. This late fee stops at five euros per book. Children\u2019s books have no late fee.'],
    ['Rooms and printing', 'Group study rooms R12 and R14 hold six people. Book a room online for up to two hours. Printing has a fee of ten cents a page.'],
    ['Holidays', 'On public holidays the library is closed. Returns can go in the drop box at the front door.'],
  ];
  const PCOL = [C.ink, C.ink, C.ink, C.amber, C.cyan, C.ink];
  const WCOL = [C.amber, C.cyan, C.violet, C.green, C.pink];
  const tok = t => t.toLowerCase().match(/[a-z0-9]+/g) || [];
  const DOCS = PAGES.map(p => tok(p[1]));
  const AVG = DOCS.reduce((a, d) => a + d.length, 0) / DOCS.length;   // 146 ÷ 6 ≈ 24.3
  const VOCAB = [...new Set(DOCS.flat())];
  const START = 'late fee', TRAP = 'What happens if I bring a novel back after the deadline?';
  let query = START, k1 = 1.2, b = 0.75, sel = 3, randoms = 0;

  const words = () => [...new Set(tok(query))];
  const df = w => DOCS.filter(d => d.includes(w)).length;
  const idf = w => { const n = df(w); return Math.log((6 - n + 0.5) / (n + 0.5) + 1); };
  const capped = (f, d) => f ? f * (k1 + 1) / (f + k1 * (1 - b + b * d.length / AVG)) : 0;
  const r2 = x => Math.round(x * 100) / 100;
  function parts(i) {
    const d = DOCS[i];
    return words().map((w, j) => {
      const f = d.filter(x => x === w).length, weight = idf(w), c = capped(f, d);
      return { w, j, f, n: df(w), weight, c, part: weight * c };
    });
  }
  const total = i => parts(i).reduce((a, p) => a + p.part, 0);

  const svg = s('svg', { viewBox: '0 0 700 320' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div'), legend = h('div', { class: 'sim-row' });
  const input = h('input', { type: 'text', value: query, 'aria-label': 'Query words', oninput: () => { query = input.value; draw(); },
    style: { flex: '1 1 14rem', minWidth: 0, minHeight: '44px', boxSizing: 'border-box', font: '1rem Consolas, monospace', color: C.ink,
      background: C.bg, border: `1px solid ${C.amber}`, borderRadius: '.65rem', padding: '.45rem .7rem' } });
  const k1Lab = h('span', { class: 'sim-note', style: { margin: 0 } }), bLab = h('span', { class: 'sim-note', style: { margin: 0 } });
  const k1In = h('input', { type: 'range', min: 0, max: 4, step: 0.1, value: k1, 'aria-label': 'Repeat ceiling k1', style: { flex: '1 1 10rem' },
    oninput: () => { k1 = +k1In.value; draw(); } });
  const bIn = h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: b, 'aria-label': 'Length setting b', style: { flex: '1 1 10rem' },
    oninput: () => { b = +bIn.value; draw(); } });

  // the pages: tap a word to add it to the query or take it out
  const spans = [];
  const pagesEl = h('div', {}, PAGES.map(([topic, text], i) => h('div', { style: { margin: '.55rem 0', lineHeight: 1.6 } },
    h('b', { style: { color: PCOL[i] } }, `Page ${i + 1} · ${topic}: `),
    text.split(' ').flatMap(piece => {
      const t = tok(piece);
      const sp = h('span', { style: { cursor: 'pointer', borderRadius: '4px', padding: '0 2px' }, onclick: () => toggle(t[0]) }, piece);
      spans.push({ sp, t });
      return [sp, ' '];
    }))));

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: rank the pages with BM25'),
    h('p', { class: 'sub' }, 'Type a query, or tap any word on the pages below to add or remove it. Each bar is one page’s score; each coloured piece is one query word: its weight × its capped count. Tap a bar to see its numbers.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', style: { alignItems: 'center', marginTop: 0 } }, input),
        legend, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, k1In, k1Lab),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, bIn, bLab),
        h('div', { class: 'sim-row' },
          btn('New data: random query', randomQuery, 'go'),
          btn('Trap question', () => setQuery(TRAP)),
          btn('Start again', () => { k1 = 1.2; b = 0.75; k1In.value = k1; bIn.value = b; sel = 3; setQuery(START); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch))),
    h('div', { class: 'sim-card', style: { marginTop: '1rem' } },
      h('div', { class: 'sim-note', style: { marginTop: 0 } }, 'The six pages of the library guide (tap a word):'), pagesEl)));

  const chal = challenges(ch, [
    { text: 'Change the query so that page 5 comes first.',
      check: st => st.top === 5, why: 'Yes! A word that only page 5 has, like rooms or printing, gives it the top score.' },
    { text: 'Add a word to the query whose weight is below 0.5.',
      check: st => st.minWeight < 0.5, why: 'Right: a word on four or more of the six pages is a weak clue, so it gets a small weight.' },
    { text: 'Make the query just “late”. Then move the repeat ceiling until page 4’s three mentions count more than 2.',
      check: st => st.q === 'late' && st.late3 > 2,
      why: 'A higher ceiling lets repeats count more. With the usual setting, three mentions count only about 1.6.' },
    { text: 'Press “Trap question”: page 4 is not first. Add ONE word so that page 4 wins.',
      check: st => st.trap && st.top === 4,
      why: 'BM25 needs the same words: add “late” and page 4 jumps to the top. Same meaning alone was not enough.' },
  ]);

  function setQuery(q) { query = q; input.value = q; draw(); }
  function toggle(w) {
    if (!w) return;
    const ws = words();
    setQuery((ws.includes(w) ? ws.filter(x => x !== w) : [...ws, w]).join(' '));
  }
  function randomQuery() {
    const n = rnd(1, 3), ws = [];
    while (ws.length < n) { const w = VOCAB[rnd(0, VOCAB.length - 1)]; if (!ws.includes(w)) ws.push(w); }
    randoms++;
    setQuery(ws.join(' '));
  }

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.2 : 1;
  const LX = 8, BX = NARROW ? 118 : 190, ROW = 50, TOP = 8;
  svg.setAttribute('viewBox', `0 0 ${VW} ${TOP + 6 * ROW + 8}`);

  function draw() {
    const ws = words();
    const tot = DOCS.map((_, i) => total(i));
    const order = tot.map((_, i) => i).sort((a, c) => tot[c] - tot[a] || a - c);
    const top = tot[order[0]] > 0 && tot[order[0]] - tot[order[1]] > 1e-9 ? order[0] + 1 : 0;
    const sc = (VW - BX - 62) / Math.max(4, tot[order[0]]);

    const k = [];
    order.forEach((i, r) => {
      const y = TOP + r * ROW;
      const g = s('g', { style: 'cursor:pointer' });
      g.addEventListener('click', () => { sel = i; draw(); });
      g.append(s('rect', { x: 0, y, width: VW, height: ROW - 4, rx: 8, fill: '#ffffff', 'fill-opacity': i === sel ? 0.06 : 0 }),
        s('text', { x: LX, y: y + 20, fill: PCOL[i], 'font-size': 15 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `${r + 1}. Page ${i + 1}`),
        s('text', { x: LX, y: y + 38, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Segoe UI, Arial' }, PAGES[i][0]));
      let x = BX;
      parts(i).forEach(p => {
        if (p.part <= 0) return;
        const w = p.part * sc;
        g.append(s('rect', { x, y: y + 11, width: Math.max(1, w - 1), height: 24, rx: 3, fill: WCOL[p.j % 5], 'fill-opacity': 0.82 }));
        x += w;
      });
      g.append(s('line', { x1: BX, x2: BX, y1: y + 6, y2: y + 40, stroke: C.line, 'stroke-width': 2 }),
        s('text', { x: x + 8, y: y + 28, fill: tot[i] > 0 ? C.ink : C.muted, 'font-size': 15 * F, 'font-weight': 700, 'font-family': 'Consolas' }, fmt(r2(tot[i]))));
      k.push(g);
    });
    svg.replaceChildren(...k);

    legend.replaceChildren(...(ws.length ? ws.map((w, j) => { const n = df(w);
      return pill(`${w} · weight ${fmt(r2(idf(w)))} · on ${n} page${n === 1 ? '' : 's'}`, n ? WCOL[j % 5] : C.muted); })
      : [pill('type or tap a word', C.muted)]));

    spans.forEach(({ sp, t }) => {
      const j = t.findIndex(x => ws.includes(x));
      const c = j < 0 ? null : WCOL[ws.indexOf(t[j]) % 5];
      sp.style.color = c || '';
      sp.style.background = c ? 'rgba(255,255,255,.08)' : '';
      sp.style.fontWeight = c ? '700' : '';
    });

    const ps = parts(sel), hit = ps.filter(p => p.f > 0), d = DOCS[sel];
    const lines = [`Page ${sel + 1}: ${d.length} words (average ${fmt(r2(AVG))})`];
    hit.forEach(p => lines.push([`${p.w}: weight ${fmt(r2(p.weight))} (on ${p.n} of 6 pages)`, WCOL[p.j % 5]],
      `   ${p.f}× here → counts ${fmt(r2(p.c))} → ${fmt(r2(p.weight))} × ${fmt(r2(p.c))} = ${fmt(r2(p.part))}`));
    if (!hit.length) lines.push('no query word on this page');
    lines.push([`score = ${hit.length > 1 ? hit.map(p => fmt(r2(p.part))).join(' + ') + ' = ' : ''}${fmt(r2(tot[sel]))}`, C.amber]);
    fbox(box, lines);

    note.textContent = !ws.length ? 'The query is empty: every page scores 0.'
      : top ? `Page ${top} (${PAGES[top - 1][0]}) comes first. A word on fewer pages weighs more; each repeat adds less.`
      : tot[order[0]] > 0 ? 'Two pages tie for first place.' : 'No page shares a word with the query, so every score is 0.';
    k1Lab.textContent = `Repeat ceiling k1 = ${fmt(r2(k1))}: a word never counts more than ${fmt(r2(k1 + 1))}`;
    bLab.textContent = `Length setting b = ${fmt(r2(b))}: ${b === 0 ? 'page length is ignored' : 'long pages get a discount, short pages a bonus'}`;
    chal.update({ top, q: ws.join(' '), minWeight: ws.length ? Math.min(...ws.map(idf)) : 9,
      late3: capped(3, DOCS[3]), trap: ws.includes('novel') && ws.includes('deadline'), randoms });
  }
  draw();
  return () => {};
}
