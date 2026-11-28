// 21.2.2 Try it: is the test question really new?
// The learner taps words of a training example to change them and watches the overlap and the flag,
// then marks draft cards right / wrong and flagged / clean, and compares the full score with the clean score.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const PAIRS = [
    { q: 'How many books can I borrow at once?', alt: ['Which', 'few', 'DVDs', 'may', 'we', 'keep', 'in', 'total?'], same: [1, 1, 1, 0, 1, 1, 1, 1] },
    { q: 'When does the library close on Friday?', alt: ['What', 'time', 'a', 'café', 'open', 'at', 'Sunday?'] },
    { q: 'Can I renew a laptop loan online?', alt: ['May', 'we', 'keep', 'the', 'camera', 'charger', 'longer?'] },
    { q: 'Is the library open on public holidays?', alt: ['Was', 'this', 'café', 'shut', 'during', 'school', 'breaks?'] },
    { q: 'How do I book room B12 for tomorrow?', alt: ['Where', 'can', 'we', 'find', 'desk', 'A3', 'after', 'lunch?'] },
    { q: 'When does the quiet floor open on Sunday?', alt: ['Why', 'is', 'a', 'loud', 'room', 'shut', 'at', 'night?'] },
  ];
  const words = i => PAIRS[i].q.split(' ');
  let pi = 0, same = [], cards = [], sel = 1, fresh = false;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: catch the copied questions'),
    h('p', { class: 'sub' }, 'Top: a draft test question and a training example, one word per box. Tap a box in the example to change that word. Bottom: the ten draft cards. Tap a card, then mark it with the buttons.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Right ↔ wrong', () => { cards[sel].right = !cards[sel].right; draw(); }),
          btn('Flagged ↔ clean', () => { cards[sel].copy = !cards[sel].copy; draw(); }), selLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random)', () => newData(), 'go'),
          btn('Make it an exact copy', () => { same = same.map(() => 1); draw(); }),
          btn('Start again', () => start()))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Tap words in the example until the question is no longer flagged.',
      check: st => !st.flagged, why: 'Now no more than 3/4 of the words match, so the rule treats it as a new question.' },
    { text: 'Make it a near copy: flagged, but not an exact copy.',
      check: st => st.flagged && st.m < st.n, why: 'Right: the 3/4 rule catches it, but a check for exact copies only would let it through.' },
    { text: 'With an 8-word question, find the most matching words that are still NOT flagged.',
      check: st => st.n === 8 && st.m === 6, why: 'Yes: 3/4 of 8 is 6. Six is not more than 6, so it passes; seven would be flagged.' },
    { text: 'Press “New data”, then mark the cards so the score on all cards is higher than the clean score.',
      check: st => st.fresh && st.clean !== null && st.all > st.clean,
      why: 'When copied cards are easy wins, they lift the full score. The clean cards give the honest picture.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: fewer boxes per row keeps words readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1, PAD = 10, PR = NARROW ? 4 : 8, CR = NARROW ? 5 : 10;
  const pct = x => fmt(Math.round(x * 1000) / 10) + '%';

  function start() {
    pi = 0; same = PAIRS[0].same.slice();
    cards = Array.from({ length: 10 }, (_, i) => ({ copy: i === 1 || i === 5, right: i !== 4 && i !== 8 }));
    sel = 1; fresh = false; draw();
  }
  function newData() {
    pi = rnd(0, PAIRS.length - 1);
    same = words(pi).map(() => Math.random() < 0.7 ? 1 : 0);
    const nCopy = rnd(1, 3), order = Array.from({ length: 10 }, (_, i) => i).sort(() => Math.random() - 0.5);
    cards = Array.from({ length: 10 }, (_, i) => { const copy = order.indexOf(i) < nCopy; return { copy, right: Math.random() < (copy ? 0.95 : 0.7) }; });
    sel = order[0]; fresh = true; draw();
  }

  function draw() {
    const q = words(pi), n = q.length, ex = q.map((w, i) => same[i] ? w : PAIRS[pi].alt[i]);
    const m = same.reduce((a, b) => a + b, 0), ov = m / n, flagged = ov > 0.75, exact = m === n;
    const k = [], sw = (VW - 2 * PAD) / PR, BW = VW - 2 * PAD;
    const label = (t, y, c, x = PAD, anchor = 'start') => s('text', { x, y, fill: c, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': anchor, 'font-family': 'Consolas, monospace' }, t);
    function row(list, top, tap) {
      list.forEach((w, i) => {
        const r = Math.floor(i / PR), cnt = Math.min(PR, n - r * PR);
        const cx = VW / 2 + (i % PR - (cnt - 1) / 2) * sw, cy = top + r * 48 + 20, col = same[i] ? C.green : C.pink;
        const rect = s('rect', { x: cx - sw / 2 + 4, y: cy - 19, width: sw - 8, height: 38, rx: 6, fill: col, 'fill-opacity': .1, stroke: col, 'stroke-width': 2 });
        if (tap) { rect.style.cursor = 'pointer'; rect.addEventListener('click', () => { same[i] = same[i] ? 0 : 1; draw(); }); }
        k.push(rect, s('text', { x: cx, y: cy + 6, fill: C.ink, 'font-size': NARROW ? 16 : 15, 'text-anchor': 'middle', 'font-family': '"Segoe UI", Arial, sans-serif', 'pointer-events': 'none' }, w));
      });
      return top + Math.ceil(n / PR) * 48;
    }

    // the two questions, word by word
    k.push(label('DRAFT TEST QUESTION', 20, C.cyan),
      label(flagged ? '⚑ FLAGGED' : 'NOT FLAGGED', 20, flagged ? C.pink : C.green, VW - PAD, 'end'));
    let y = row(q, 30, false);
    k.push(label(NARROW ? 'TRAINING EXAMPLE (tap a word)' : 'TRAINING EXAMPLE  (tap a word to change it)', y + 18, C.violet));
    y = row(ex, y + 28, true);

    // overlap bar with the 3/4 line
    const by = y + 34;
    k.push(label(`${m} of ${n} words match`, y + 22, C.ink));
    for (let i = 0; i < n; i++) {
      const seg = BW / n;
      k.push(s('rect', { x: PAD + i * seg + 1.5, y: by, width: seg - 3, height: 20, rx: 3, fill: same[i] ? C.green : C.line, 'fill-opacity': same[i] ? .85 : 1 }));
    }
    const x34 = PAD + 0.75 * BW;
    k.push(s('line', { x1: x34, x2: x34, y1: by - 8, y2: by + 28, stroke: C.amber, 'stroke-width': 3, 'stroke-dasharray': '5 4' }),
      label('3/4', y + 22, C.amber, x34, 'middle'));

    // the draft cards
    const ct = by + 52, cs = BW / CR, cw = Math.min(56, cs - 8), chh = 66;
    k.push(label(NARROW ? 'DRAFT CARDS: tap one' : 'DRAFT CARDS: tap one, then use the buttons below', ct, C.muted));
    cards.forEach((c, i) => {
      const cx = PAD + cs * (i % CR + 0.5), top = ct + 12 + Math.floor(i / CR) * (chh + 10), col = c.copy ? C.pink : C.cyan;
      if (i === sel) k.push(s('rect', { x: cx - cw / 2 - 4, y: top - 4, width: cw + 8, height: chh + 8, rx: 10, fill: '#ffffff', 'fill-opacity': .08, stroke: C.ink, 'stroke-opacity': .5 }));
      const r = s('rect', { x: cx - cw / 2, y: top, width: cw, height: chh, rx: 7, fill: C.card, stroke: col, 'stroke-width': 2 });
      r.style.cursor = 'pointer'; r.addEventListener('click', () => { sel = i; draw(); });
      k.push(r,
        s('text', { x: cx, y: top + 16, fill: col, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas', 'pointer-events': 'none' }, i + 1),
        s('text', { x: cx, y: top + 42, fill: c.right ? C.green : C.pink, 'font-size': 22, 'font-weight': 700, 'text-anchor': 'middle', 'pointer-events': 'none' }, c.right ? '✓' : '✗'));
      if (c.copy) k.push(s('text', { x: cx, y: top + 60, fill: C.pink, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas', 'pointer-events': 'none' }, '⚑'));
    });
    const H = ct + 12 + Math.ceil(10 / CR) * (chh + 10) + 4;
    svg.setAttribute('viewBox', `0 0 ${VW} ${H}`);
    svg.replaceChildren(...k);

    // formula box and notes
    const allR = cards.filter(c => c.right).length, clean = cards.filter(c => !c.copy), cr = clean.filter(c => c.right).length;
    fbox(box, [
      `overlap = ${m} ÷ ${n} = ${pct(ov)}`,
      flagged ? [`${pct(ov)} > 75%  →  FLAGGED (${exact ? 'exact copy' : 'near copy'})`, C.pink]
        : [`${pct(ov)} is not more than 75%  →  not flagged`, C.green],
      `exact-only check: ${exact ? 'caught' : flagged ? 'MISSED' : 'passes'}`,
      `all cards:   ${allR} of 10 = ${pct(allR / 10)}`,
      [clean.length ? `clean cards: ${cr} of ${clean.length} = ${pct(cr / clean.length)}` : 'clean cards: none left', C.amber]]);
    const lift = clean.length && allR / 10 > cr / clean.length ? ' The flagged cards lift the full score above the clean score.' : '';
    note.textContent = (exact ? 'An exact copy: every word matches, so both checks catch it.'
      : flagged ? 'A near copy: the 3/4 rule catches it, but a check for exact copies only would miss it.'
      : 'Not flagged: no more than 3/4 of the words match, so it counts as a new question.') + lift;
    selLabel.textContent = `Selected: card ${sel + 1} (${cards[sel].right ? 'right' : 'wrong'}, ${cards[sel].copy ? 'flagged' : 'clean'})`;
    chal.update({ flagged, m, n, fresh, all: allR / 10, clean: clean.length ? cr / clean.length : null });
  }
  start();
  return () => {};
}
