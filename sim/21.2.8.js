// 21.2.8 Try it: check a judge against the librarians, card by card.
// The learner taps marks to flip them, watches the agreement rate and the totals update live,
// makes random sets of cards from a judge of chosen quality, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, fmt, challenges } = kit;
  const LIB0 = [0, 1, 1, 1, 0, 1, 1, 1, 0, 1], JUD0 = [1, 1, 1, 1, 0, 1, 1, 1, 0, 0];
  let lib = LIB0.slice(), jud = JUD0.slice(), quality = 80, runs80 = 0;

  const svg = s('svg', { viewBox: '0 0 700 480' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const qLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const slider = h('input', { type: 'range', min: 50, max: 100, step: 5, value: quality, 'aria-label': 'How often the random judge really matches people',
    oninput: e => { quality = +e.target.value; draw(); } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: check the judge card by card'),
    h('p', { class: 'sub' }, 'Each row is one question card. Left: the librarians’ mark. Right: the judge’s mark. Tap any mark to flip it between ✓ right and ✗ wrong.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('New data (random)', newData, 'go'),
          btn('10 cards', () => setN(10)),
          btn('20 cards', () => setN(20)),
          btn('Start again', () => { lib = LIB0.slice(); jud = JUD0.slice(); draw(); })),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, slider, qLabel)),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Tap the judge’s marks until it agrees with the librarians on every card.',
      check: st => st.m === st.n, why: 'Yes! Every row matches, so the agreement rate is 100 percent.' },
    { text: 'Make the two totals equal while the agreement rate is 60 percent or less.',
      check: st => st.a === st.b && st.pct <= 60,
      why: 'Each wrong ✓ adds one and each wrong ✗ takes one away. In pairs they cancel, so equal totals can hide many disagreements.' },
    { text: 'Switch to 20 cards. How much does one card move the agreement rate now?',
      check: st => st.n === 20, why: 'With 20 cards, one card is worth 5 points instead of 10. More cards give a steadier rate.' },
    { text: 'Set the slider to 80, use 10 cards, and press “New data” 3 times. Is the rate always 80 percent?',
      check: st => st.runs80 >= 3,
      why: 'Not always: with only 10 cards the rate jumps around the true 80. That is why you check more cards before trusting a judge.' },
  ]);

  // a random card: librarians say right 7 times in 10; the judge matches them `quality` times in 100
  const card = () => { const l = Math.random() < 0.7 ? 1 : 0; return [l, Math.random() * 100 < quality ? l : 1 - l]; };
  function newData() {
    const cards = Array.from({ length: lib.length }, card);
    lib = cards.map(c => c[0]); jud = cards.map(c => c[1]);
    if (quality === 80 && lib.length === 10) runs80++;
    draw();
  }
  function setN(n) {
    while (lib.length < n) { const [l, j] = card(); lib.push(l); jud.push(j); }
    lib = lib.slice(0, n); jud = jud.slice(0, n);
    draw();
  }

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: blocks stack, numbers stay readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1, RH = NARROW ? 34 : 30, HEAD = 40;
  const sum = a => a.reduce((x, y) => x + y, 0);
  const mono = { 'text-anchor': 'middle', 'font-family': 'Consolas' };

  function markBtn(x, y, ok, flip) {
    const g = s('g', { style: 'cursor:pointer' },
      s('rect', { x: x - 24, y: y - RH / 2 + 3, width: 48, height: RH - 6, rx: 7, fill: '#ffffff', 'fill-opacity': .05, stroke: C.line }),
      s('text', { x, y: y + 7 * F, fill: ok ? C.green : C.pink, 'font-size': 20 * F, 'font-weight': 700, 'text-anchor': 'middle' }, ok ? '✓' : '✗'));
    g.addEventListener('click', flip);
    return g;
  }

  function draw() {
    const n = lib.length, nb = Math.ceil(n / 10), side = !NARROW && nb === 2;
    const bw = side ? (VW - 30) / 2 : Math.min(VW - 20, 460), blockH = HEAD + 10 * RH + 8;
    const tablesH = side || nb === 1 ? blockH : 2 * blockH + 14, H = tablesH + 120;
    svg.setAttribute('viewBox', `0 0 ${VW} ${H}`);
    const m = lib.filter((v, i) => v === jud[i]).length, a = sum(lib), b = sum(jud), pct = Math.round(m / n * 1000) / 10;
    const k = [];
    for (let blk = 0; blk < nb; blk++) {
      const bx = side ? 10 + blk * (bw + 10) : (VW - bw) / 2, by = side ? 0 : blk * (blockH + 14), X = f => bx + bw * f;
      k.push(s('rect', { x: bx, y: by, width: bw, height: blockH, rx: 10, fill: C.bg, stroke: C.line }));
      for (const [t, f, c] of [['CARD', .1, C.muted], ['LIBRARIANS', .37, C.amber], ['JUDGE', .63, C.violet], ['MATCH?', .88, C.muted]])
        k.push(s('text', { x: X(f), y: by + 26, fill: c, 'font-size': 13 * F, 'font-weight': 700, ...mono }, t));
      for (let r = 0; r < 10 && blk * 10 + r < n; r++) {
        const i = blk * 10 + r, y = by + HEAD + r * RH + RH / 2, same = lib[i] === jud[i];
        if (!same) k.push(s('rect', { x: bx + 4, y: y - RH / 2 + 1, width: bw - 8, height: RH - 2, rx: 6, fill: C.pink, 'fill-opacity': .12 }));
        k.push(s('text', { x: X(.1), y: y + 5 * F, fill: C.ink, 'font-size': 15 * F, ...mono }, i + 1),
          markBtn(X(.37), y, lib[i], () => { lib[i] ^= 1; draw(); }),
          markBtn(X(.63), y, jud[i], () => { jud[i] ^= 1; draw(); }),
          s('text', { x: X(.88), y: y + 7 * F, fill: same ? C.green : C.pink, 'font-size': 20 * F, 'font-weight': 700, ...mono }, same ? '=' : '≠'));
      }
    }
    // totals, then one bar segment per card: green = marks match, pink = they disagree
    const y0 = tablesH + 30, gx = 20, gw = VW - 40, gy = y0 + 36, seg = gw / n;
    k.push(s('text', { x: VW / 2, y: y0, fill: a === b ? C.amber : C.ink, 'font-size': 14 * F, 'font-weight': 700, ...mono }, `TOTAL ✓  librarians ${a} · judge ${b}`));
    if (a === b && m < n) k.push(s('text', { x: VW / 2, y: y0 + 22, fill: C.pink, 'font-size': 13 * F, ...mono }, `equal totals, yet ${n - m} rows disagree`));
    for (let i = 0; i < n; i++)
      k.push(s('rect', { x: gx + i * seg + 1, y: gy, width: Math.max(1, seg - 2), height: 22, rx: 3, fill: lib[i] === jud[i] ? C.green : C.pink, 'fill-opacity': .8 }));
    k.push(s('text', { x: VW / 2, y: gy + 46, fill: C.green, 'font-size': 15 * F, 'font-weight': 700, ...mono }, `AGREEMENT RATE ${fmt(pct)}%`));
    svg.replaceChildren(...k);

    fbox(box, [`rows that match = ${m}`, `all rows        = ${n}`,
      [`agreement rate  = ${m} ÷ ${n} = ${fmt(pct)}%`, C.green],
      [`totals: ${a} ✓ and ${b} ✓${a === b ? ' (equal)' : ''}`, C.amber]]);
    note.textContent = m === n ? 'Every row matches: the judge agrees with the librarians on every card.'
      : a === b ? `The totals are equal, but the columns disagree on ${n - m} cards. Always compare card by card.`
      : `Pink rows are disagreements. With ${n} cards, one card moves the rate by ${fmt(100 / n)} points.`;
    qLabel.textContent = `“New data” uses a judge that really matches people on ${quality} of every 100 cards.`;
    chal.update({ n, m, a, b, pct, runs80 });
  }
  draw();
  return () => {};
}
