// 14.4.1 Try it: association rules in the bookshop baskets.
// The learner taps books in or out of 8 baskets, picks a rule (if a reader buys X, suggest Y),
// sees confidence and support as bars of equal parts, makes random baskets, and solves challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const TEAL = '#2dd4bf';
  const BOOKS = ['Trail', 'River', 'Clues', 'Castle'];
  const COL = { Trail: C.green, River: TEAL, Clues: C.amber, Castle: C.violet };
  const START = [['Trail', 'River'], ['Trail', 'River', 'Clues'], ['Trail', 'River'], ['Trail', 'Clues'],
    ['River', 'Castle'], ['Clues', 'Castle'], ['Clues'], ['Castle']];
  let bs = START.map(b => new Set(b)), A = 'Trail', B = 'River';

  const svg = s('svg', { viewBox: '0 0 700 520', style: 'touch-action: pan-y' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const pickA = h('div', { class: 'sim-row', style: { alignItems: 'center' } });
  const pickB = h('div', { class: 'sim-row', style: { alignItems: 'center' } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: which books go together?'),
    h('p', { class: 'sub' }, 'Each basket shows the books one reader buys together. Tap a book to put it in a basket or take it out. Choose a rule and watch its confidence and support change.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg, pickA, pickB,
        h('div', { class: 'sim-row' },
          btn('Swap the rule', () => { [A, B] = [B, A]; draw(); }),
          btn('New data (random baskets)', () => { bs = bs.map(randomBasket); draw(); }, 'go'),
          btn('Start again', () => { bs = START.map(b => new Set(b)); A = 'Trail'; B = 'River'; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  function randomBasket() {
    const b = new Set(BOOKS.filter(() => Math.random() < 0.4));
    if (!b.size) b.add(BOOKS[rnd(0, 3)]);
    return b;
  }
  const count = (x, y) => ({ nx: bs.filter(b => b.has(x)).length, both: bs.filter(b => b.has(x) && b.has(y)).length });
  const pct = (a, b) => b ? fmt(Math.round(a / b * 1000) / 10) + '%' : '—';

  const chal = challenges(ch, [
    { text: 'Make the confidence of “If Trail, suggest River” exactly 100%.',
      check: st => st.A === 'Trail' && st.B === 'River' && st.nA > 0 && st.both === st.nA,
      why: 'Yes! Every basket with Trail now also has River, so the rule always holds.' },
    { text: 'Keep the rule “If Trail, suggest River”. Make its support exactly 50%.',
      check: st => st.A === 'Trail' && st.B === 'River' && st.both * 2 === st.n,
      why: 'Right: 4 of all 8 baskets now hold both books. Support looks at all the baskets.' },
    { text: 'Find any rule with confidence 100% but support of 25% or less.',
      check: st => st.nA > 0 && st.both === st.nA && st.both * 4 <= st.n,
      why: 'Yes: the rule always holds in its few baskets, but the pair is rare in the whole shop. Always check both numbers.' },
    { text: 'Press “Swap the rule” to get “If River, suggest Trail”. Change the baskets so its confidence is different from “If Trail, suggest River”.',
      check: st => st.A === 'River' && st.B === 'Trail' && st.nA > 0 && st.nB > 0 && Math.abs(st.both / st.nA - st.both / st.nB) > 1e-9,
      why: 'A rule has a direction: confidence divides by the baskets with the first book. Support stays the same both ways.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: two baskets per row keep the names readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.2 : 1;
  const COLS = NARROW ? 2 : 4, CW = (VW - 20) / COLS, CHH = 150, TOP = 8;
  const BAR0 = TOP + Math.ceil(START.length / COLS) * CHH + 16, VH = BAR0 + 150;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  function drawBasket(i, k) {
    const b = bs[i], x0 = 10 + (i % COLS) * CW, y0 = TOP + Math.floor(i / COLS) * CHH, x1 = x0 + CW;
    const inA = b.has(A), both = inA && b.has(B);
    k.push(s('path', { d: `M${x0 + 6} ${y0 + 24} L${x1 - 6} ${y0 + 24} L${x1 - 16} ${y0 + CHH - 8} L${x0 + 16} ${y0 + CHH - 8} Z`,
      fill: inA ? C.green : '#ffffff', 'fill-opacity': inA ? 0.07 : 0.02, stroke: inA ? C.green : C.muted, 'stroke-width': inA ? 2.5 : 1.5, 'stroke-linejoin': 'round' }));
    k.push(s('text', { x: x0 + 10, y: y0 + 17, fill: C.muted, 'font-size': 14 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `Basket ${i + 1}`));
    if (inA) k.push(s('text', { x: x1 - 10, y: y0 + 17, fill: both ? C.green : C.pink, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'end' }, both ? `✓ ${B}` : `no ${B}`));
    BOOKS.forEach((n, j) => {
      const on = b.has(n), cy = y0 + 30 + j * 28, cx0 = x0 + 22, w = CW - 44;
      const g = s('g', { style: 'cursor: pointer' },
        s('rect', { x: cx0, y: cy, width: w, height: 24, rx: 6, fill: on ? COL[n] : '#ffffff', 'fill-opacity': on ? 0.22 : 0.015,
          stroke: on ? COL[n] : '#3a4668', 'stroke-dasharray': on ? null : '4 4' }),
        s('text', { x: cx0 + w / 2, y: cy + 17, fill: on ? COL[n] : '#56627f', 'font-size': 14 * F, 'font-weight': on ? 700 : 400, 'text-anchor': 'middle' }, on ? n : '+ ' + n));
      g.addEventListener('click', () => { if (on) b.delete(n); else b.add(n); draw(); });
      k.push(g);
    });
  }

  // a bar of equal parts, one per basket, coloured when the basket holds both books
  function drawBar(k, y, title, parts, label, color) {
    const X0 = 14, X1 = VW - (NARROW ? 110 : 150), w = (X1 - X0) / Math.max(1, parts.length);
    k.push(s('text', { x: X0, y: y - 8, fill: C.ink, 'font-size': 15 * F, 'font-weight': 700 }, title));
    if (!parts.length) k.push(s('rect', { x: X0, y, width: X1 - X0, height: 34, rx: 4, fill: 'none', stroke: '#3a4668', 'stroke-dasharray': '4 4' }));
    parts.forEach((p, i) => k.push(
      s('rect', { x: X0 + i * w + 1, y, width: w - 2, height: 34, rx: 4, fill: p.on ? color : C.bg, 'fill-opacity': p.on ? 0.8 : 1, stroke: p.on ? color : C.muted }),
      s('text', { x: X0 + (i + 0.5) * w, y: y + 23, fill: p.on ? '#06202a' : C.muted, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, p.label)));
    k.push(s('text', { x: X1 + 14, y: y + 26, fill: C.amber, 'font-size': 22 * F, 'font-weight': 700, 'font-family': 'Consolas' }, label));
  }

  function drawPickers() {
    const row = (el, label, cur, set) => el.replaceChildren(
      h('span', { class: 'sim-note', style: { margin: 0, minWidth: '8.5rem' } }, label),
      ...BOOKS.map(n => btn(n, () => set(n), n === cur ? 'go' : '')));
    row(pickA, 'If a reader buys', A, n => { if (n === B) B = A; A = n; draw(); });
    row(pickB, 'then suggest', B, n => { if (n === A) A = B; B = n; draw(); });
  }

  function draw() {
    const n = bs.length, c = count(A, B), nB = bs.filter(b => b.has(B)).length;
    const k = [];
    bs.forEach((_, i) => drawBasket(i, k));
    drawBar(k, BAR0 + 26, `Confidence: ${c.both} of ${c.nx} baskets with ${A}`,
      bs.map((b, i) => ({ b, i })).filter(o => o.b.has(A)).map(o => ({ label: o.i + 1, on: o.b.has(B) })), pct(c.both, c.nx), COL[B]);
    drawBar(k, BAR0 + 106, `Support: ${c.both} of all ${n} baskets`,
      bs.map((b, i) => ({ label: i + 1, on: b.has(A) && b.has(B) })), pct(c.both, n), COL[B]);
    svg.replaceChildren(...k);
    drawPickers();
    fbox(box, [
      [`rule: if ${A}, suggest ${B}`, C.ink],
      `confidence = both ÷ ${A} baskets`,
      [c.nx ? `           = ${c.both} ÷ ${c.nx} = ${pct(c.both, c.nx)}` : `           no basket has ${A} yet`, C.amber],
      `support    = both ÷ all baskets`,
      [`           = ${c.both} ÷ ${n} = ${pct(c.both, n)}`, C.amber]]);
    note.textContent = `Green baskets contain ${A}. ✓ marks the ones that also contain ${B}. Confidence looks only at the green baskets; support looks at all ${n} baskets.`;
    chal.update({ A, B, n, nA: c.nx, nB, both: c.both });
  }
  draw();
  return () => {};
}
