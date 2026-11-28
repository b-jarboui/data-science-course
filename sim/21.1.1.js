// 21.1.1 Try it: few-shot prompting.
// The learner builds the prompt: taps demonstrations in or out, picks the question, and watches a toy
// model copy whatever all the demonstrations share. Room in the prompt is limited. Self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const DEMOS = [
    { id: 'sat', label: 'Saturday hours', q: 'When does the library open on Saturday?', a: 'At ten.', page: 1, short: true },
    { id: 'books', label: 'How many books', q: 'How many books can I borrow?', a: 'Five.', page: 2, short: true },
    { id: 'reserved', label: 'Reserved book (an exception)', q: 'Can I renew a reserved book?', a: 'No. A reserved book cannot be renewed.', page: 3, short: true, exc: true },
    { id: 'loan', label: 'Loan length (no page)', q: 'How long does a loan last?', a: 'Three weeks.', page: 2, short: true, noPage: true },
    { id: 'sunday', label: 'Sunday (long and chatty)', q: 'Is the library open on Sunday?', a: 'Thank you so much for asking! Sadly the library is closed on Sunday, but we hope to see you on another day.', page: 1, short: false },
  ];
  const QS = [
    { id: 'renew', q: 'How many times can I renew a loan?', fact: 'Twice.', page: 3 },
    { id: 'child', q: 'What do I pay for a late children’s book?', fact: 'Twenty cents a day.', exc: 'Nothing. Children’s books have no late fee.', page: 4 },
    { id: 'close', q: 'When does the library close on weekdays?', fact: 'At eight.', page: 1 },
    { id: 'room', q: 'How many people fit in room R12?', fact: 'Six.', page: 5 },
    { id: 'max', q: 'What is the most I pay for one late book?', fact: 'Five euros.', page: 4 },
    { id: 'holiday', q: 'Where can I return books on a holiday?', fact: 'In the drop box at the front door.', page: 6 },
  ];
  const LIMIT = 50;
  let qi = 0, chosen = ['sat', 'books'], warn = '';

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const bank = h('div', { class: 'sim-row' });
  const qLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: teach by example'),
    h('p', { class: 'sub' }, 'Build the prompt. Tap a demonstration to put it in or take it out, then watch what a toy model writes. It copies whatever all your examples share.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-note' }, 'Demonstrations (tap to put in or take out):'),
        bank,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('‹ Question', () => { qi = (qi + QS.length - 1) % QS.length; warn = ''; draw(); }),
          btn('Question ›', () => { qi = (qi + 1) % QS.length; warn = ''; draw(); }), qLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random)', () => newData(), 'go'),
          btn('Start again', () => { qi = 0; chosen = ['sat', 'books']; warn = ''; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const words = t => t.split(/\s+/).filter(Boolean).length;
  const demo = id => DEMOS.find(d => d.id === id);
  const demoAnswer = d => d.noPage ? d.a : `${d.a} (Page ${d.page})`;
  const used = (list = chosen) => list.reduce((a, id) => a + words(demo(id).q) + words(demoAnswer(demo(id))), 0) + words(QS[qi].q);

  // the toy model: it copies what ALL demonstrations share
  function answer() {
    const q = QS[qi], ds = chosen.map(demo);
    if (!ds.length) return { text: 'Libraries are wonderful places! Rules can differ from one library to another, so the friendly staff at the desk will always be happy to help you. Enjoy your visit!', short: false, page: false, right: false, excSeen: false };
    const short = ds.every(d => d.short), page = ds.every(d => !d.noPage), excSeen = ds.some(d => d.exc);
    const fact = q.exc && excSeen ? q.exc : q.fact;
    let text = short ? fact : `Thank you so much for asking! ${fact} We hope to see you soon.`;
    if (page) text += ` (Page ${q.page})`;
    return { text, short, page, right: !q.exc || excSeen, excSeen };
  }

  function toggle(id) {
    if (chosen.includes(id)) chosen = chosen.filter(x => x !== id);
    else if (used([...chosen, id]) > LIMIT) { warn = 'No room left in the prompt: take a demonstration out first.'; draw(); return; }
    else chosen.push(id);
    warn = ''; draw();
  }
  function newData() {
    qi = rnd(0, QS.length - 1);
    const ids = DEMOS.map(d => d.id).sort(() => Math.random() - 0.5), want = rnd(0, 3);
    chosen = [];
    for (const id of ids) if (chosen.length < want && used([...chosen, id]) <= LIMIT) chosen.push(id);
    warn = ''; draw();
  }

  const chal = challenges(ch, [
    { text: 'Take every demonstration out (zero-shot). What does the model write?',
      check: st => st.n === 0, why: 'With nothing to copy, it writes a long friendly paragraph and never names a page.' },
    { text: 'For the renewal question, get “Twice. (Page 3)” with only ONE demonstration.',
      check: st => st.q === 'renew' && st.n === 1 && st.ok,
      why: 'Yes: one short fact with its page is already a pattern the model can copy.' },
    { text: 'Make the page disappear from the answer, while keeping at least one demonstration.',
      check: st => st.n > 0 && !st.page,
      why: 'The model copies what all examples share. One example without a page breaks that, so the page goes.' },
    { text: 'Get the right answer to “What do I pay for a late children’s book?”',
      check: st => st.q === 'child' && st.ok,
      why: 'A tricky demonstration with an exception shows the model to look for one, so it answers: nothing.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = 10, X1 = VW - 10, FS = 15 * F, LH = 22 * F, W = NARROW ? 30 : 54;
  const SANS = 'Segoe UI, Arial, sans-serif';
  const txt = (x, y, t, fill, size = FS, weight = 400, family = SANS, anchor = 'start') =>
    s('text', { x, y, fill, 'font-size': size, 'font-weight': weight, 'font-family': family, 'text-anchor': anchor }, t);
  const wrap = (t, n) => {
    const out = []; let line = '';
    for (const w of t.split(' ')) { if (line && (line + ' ' + w).length > n) { out.push(line); line = w; } else line = line ? line + ' ' + w : w; }
    if (line) out.push(line);
    return out;
  };

  function draw() {
    const q = QS[qi], out = answer(), u = used(), over = u > LIMIT, n = chosen.length;
    const ok = out.short && out.page && out.right;
    const k = [];
    let y = 20;
    k.push(txt(X0, y, `ROOM IN THE PROMPT: ${u} / ${LIMIT} words`, over ? C.pink : C.muted, 13 * F, 700, 'Consolas'));
    y += 10;
    k.push(s('rect', { x: X0, y, width: X1 - X0, height: 12, rx: 6, fill: C.line }),
      s('rect', { x: X0, y, width: (X1 - X0) * Math.min(1, u / LIMIT), height: 12, rx: 6, fill: over ? C.pink : C.cyan, 'fill-opacity': 0.85 }));
    y += 32;
    const top = y, inner = [];
    inner.push(txt(X0 + 14, y + 20, 'PROMPT', C.muted, 13 * F, 700, 'Consolas'));
    y += 34;
    chosen.forEach((id, i) => {
      const d = demo(id);
      const lines = [...wrap('Q: ' + d.q, W).map(t => [t, C.ink]), ...wrap('A: ' + demoAnswer(d), W).map(t => [t, C.green])];
      const hh = lines.length * LH + 12;
      const g = s('g', { style: 'cursor:pointer' });
      g.append(s('rect', { x: X0 + 8, y: y - 4, width: X1 - X0 - 16, height: hh, rx: 8, fill: '#ffffff', 'fill-opacity': 0.03, stroke: C.cyan, 'stroke-opacity': 0.7 }));
      lines.forEach(([t, c], j) => g.append(txt(X0 + 20, y + 16 * F + j * LH, t, c)));
      g.append(txt(X1 - 18, y + 16 * F, `SHOT ${i + 1} ×`, C.cyan, 12 * F, 700, 'Consolas', 'end'));
      g.addEventListener('click', () => toggle(id));
      inner.push(g);
      y += hh + 10;
    });
    const qLines = wrap('Q: ' + q.q, W + 8), aLines = wrap('A: ' + out.text, W + 8);
    const hq = (qLines.length + aLines.length) * LH + 12;
    inner.push(s('rect', { x: X0 + 8, y: y - 4, width: X1 - X0 - 16, height: hq, rx: 8, fill: 'none', stroke: C.amber, 'stroke-opacity': 0.8 }));
    qLines.forEach((t, j) => inner.push(txt(X0 + 20, y + 16 * F + j * LH, t, C.amber)));
    const ac = n === 0 ? C.ink : ok ? C.green : C.pink;
    aLines.forEach((t, j) => inner.push(txt(X0 + 20, y + 16 * F + (qLines.length + j) * LH, t, ac, FS, j === 0 ? 700 : 400)));
    y += hq + 10;
    k.push(s('rect', { x: X0, y: top, width: X1 - X0, height: y - top, rx: 12, fill: C.card, stroke: C.muted }), ...inner);
    y += 28;
    const mark = (b, t) => [`${b ? '✓' : '✗'} ${t}`, b ? C.green : C.pink];
    [mark(out.short, 'short'), mark(out.page, 'names the page'), mark(out.right, 'right fact')].forEach(([t, c], j) =>
      k.push(txt(X0 + (X1 - X0) * [0, 0.25, 0.62][j], y, t, c, 14 * F, 700, 'Consolas')));
    y += 16;
    svg.setAttribute('viewBox', `0 0 ${VW} ${y}`);
    svg.replaceChildren(...k);

    bank.replaceChildren(...DEMOS.map(d => btn(`${chosen.includes(d.id) ? '✓' : '+'} ${d.label}`, () => toggle(d.id), chosen.includes(d.id) ? 'go' : '')));
    qLabel.textContent = `Question ${qi + 1} of ${QS.length}`;

    fbox(box, [
      `demonstrations = ${n}`,
      n ? `few-shot: ${n} shot${n > 1 ? 's' : ''}` : 'zero-shot: no example',
      [`room = ${u} / ${LIMIT} words`, over ? C.pink : C.ink],
      n ? `copied: ${out.short ? 'short' : 'long'}, ${out.page ? 'page' : 'no page'}` : 'copied: nothing to copy',
      [ok ? 'answer: right shape and fact' : 'answer: not what we wanted', ok ? C.green : C.pink]]);
    const why = n === 0 ? 'Zero-shot: with nothing to copy, the model writes a friendly paragraph and names no page.'
      : QS[qi].exc && !out.excSeen ? 'The model copied “one short fact” and dropped the exception: no demonstration showed one.'
      : !out.page ? 'One demonstration has no page, so the examples no longer all share it, and the page disappears.'
      : !out.short ? 'One demonstration is long and chatty, so the answer becomes long and chatty too.'
      : 'Every demonstration is a short fact plus the page, so the answer copies that shape.';
    note.textContent = warn ? `${warn} ${why}` : why;
    chal.update({ q: q.id, n, short: out.short, page: out.page, right: out.right, ok });
  }
  draw();
  return () => {};
}
