// 21.2.11 Try it: multilingual evaluation.
// Ten matched cards, each asked in English (top) and Spanish (below). The learner taps a card to flip
// assistant A right or wrong, watches the four boxes, the gap and the combined score update live,
// makes random results, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const EN0 = [0, 1, 1, 1, 0, 1, 1, 1, 0, 1], ES0 = [0, 1, 0, 1, 0, 1, 1, 0, 0, 1];
  let en = EN0.slice(), es = ES0.slice();

  const svg = s('svg', { viewBox: '0 0 700 410' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: same questions, two languages'),
    h('p', { class: 'sub' }, 'Each column is one test card, asked in English (top) and in Spanish (below). Tap a card to mark assistant A right or wrong on it.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('New data (random)', () => {
            const pe = rnd(5, 9) / 10, keep = rnd(5, 10) / 10;
            en = EN0.map(() => +(Math.random() < pe));
            es = en.map(r => +(Math.random() < (r ? keep : 0.15)));
            draw();
          }, 'go'),
          btn('Start again', () => { en = EN0.slice(); es = ES0.slice(); draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Tap Spanish cards until Spanish scores as well as English: a gap of 0 points.',
      check: st => st.gap === 0, why: 'Yes! Same number right in both languages, so box 2 and box 3 hold the same number of cards.' },
    { text: 'Make a gap of exactly 30 points.',
      check: st => st.gap === 30, why: 'Right: 3 more cards right only in English than right only in Spanish, out of 10 cards, is 30 points.' },
    { text: 'Make the gap 0 while box 2 (English only) still holds at least one card.',
      check: st => st.gap === 0 && st.enOnly > 0,
      why: 'Cards that change one way cancel cards that change the other way. The gap is English only minus Spanish only.' },
    { text: 'Make the combined score exactly 60% while Spanish gets only 40%.',
      check: st => st.all === 60 && st.es === 40,
      why: 'English is at 80%. A fine-looking 60% hides a 40-point gap, so always show each language on its own.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.2 : 1;
  const X0 = NARROW ? 34 : 52, X1 = VW - 8, PIT = (X1 - X0) / 10, CWD = PIT * 0.84;
  const YE = 12, YS = 80, CHT = 58, BY = 160, BHT = 92, BARY = 280, BARG = 42, BARH = 24;
  svg.setAttribute('viewBox', `0 0 ${VW} 410`);
  const BC = [C.green, C.amber, C.cyan, C.pink], NAMES = ['BOTH RIGHT', 'EN ONLY', 'ES ONLY', 'BOTH WRONG'];
  const boxOf = k => en[k] && es[k] ? 0 : en[k] ? 1 : es[k] ? 2 : 3;
  const sg = x => x < 0 ? '−' + (-x) : String(x);
  const txt = (x, y, str, fill, size, anchor = 'middle', weight = 700) =>
    s('text', { x, y, fill, 'font-size': size * F, 'font-weight': weight, 'text-anchor': anchor, 'font-family': 'Consolas, monospace' }, str);

  function mark(ok, cx, cy) {
    return ok
      ? s('path', { d: `M${cx - 8} ${cy} l6 7 l11 -13`, stroke: C.green, 'stroke-width': 3.5, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
      : s('path', { d: `M${cx - 7} ${cy - 7} l14 14 M${cx + 7} ${cy - 7} l-14 14`, stroke: C.pink, 'stroke-width': 3.5, fill: 'none', 'stroke-linecap': 'round' });
  }
  function cardEl(k, arr, y, color) {
    const cx = X0 + PIT * (k + 0.5);
    const g = s('g', { style: 'cursor:pointer' },
      s('rect', { x: cx - CWD / 2, y, width: CWD, height: CHT, rx: 7, fill: C.card, stroke: color, 'stroke-width': 2 }),
      txt(cx, y + 19, 'Q' + (k + 1), C.ink, 12),
      mark(arr[k], cx, y + 39));
    g.addEventListener('click', () => { arr[k] = 1 - arr[k]; draw(); });
    return g;
  }

  function draw() {
    const k = [], n = 10;
    const eR = en.reduce((a, b) => a + b, 0), sR = es.reduce((a, b) => a + b, 0);
    const eP = eR * 10, sP = sR * 10, all = (eR + sR) * 5, gap = eP - sP;
    const cnt = [0, 0, 0, 0];
    en.forEach((_, i) => cnt[boxOf(i)]++);

    // matched pairs: outline colored by the box the pair lands in
    k.push(txt(X0 - 8, YE + CHT / 2 + 5, 'EN', C.violet, 14, 'end'), txt(X0 - 8, YS + CHT / 2 + 5, 'ES', C.amber, 14, 'end'));
    for (let i = 0; i < n; i++) {
      const cx = X0 + PIT * (i + 0.5);
      k.push(s('rect', { x: cx - CWD / 2 - 3, y: YE - 4, width: CWD + 6, height: YS + CHT - YE + 8, rx: 9, fill: 'none', stroke: BC[boxOf(i)], 'stroke-width': 2 }));
      k.push(cardEl(i, en, YE, C.violet), cardEl(i, es, YS, C.amber));
    }

    // four boxes
    const BW = (X1 - X0) / 4;
    cnt.forEach((c, b) => {
      const x = X0 + BW * b + 3, w = BW - 6;
      k.push(s('rect', { x, y: BY, width: w, height: BHT, rx: 9, fill: C.bg, stroke: BC[b], 'stroke-width': 2 }),
        txt(x + w / 2, BY + 17, 'BOX ' + (b + 1), C.muted, 11, 'middle', 400),
        txt(x + w / 2, BY + 35, NAMES[b], BC[b], NARROW ? 9 : 12),
        txt(x + w / 2, BY + 76, c, BC[b], 30));
    });

    // scores side by side, and the combined one
    const BL = X1 - X0 - 56 * F;
    [['EN', eP, C.violet], ['ES', sP, C.amber], ['ALL', all, C.cyan]].forEach(([name, p, col], i) => {
      const y = BARY + i * BARG;
      k.push(txt(X0 - 8, y + BARH / 2 + 5, name, col, 13, 'end'),
        s('rect', { x: X0, y, width: BL, height: BARH, rx: 4, fill: C.line }),
        s('rect', { x: X0, y, width: BL * p / 100, height: BARH, rx: 4, fill: col, 'fill-opacity': .82 }),
        txt(X0 + BL * p / 100 + 6, y + BARH / 2 + 5, p + '%', col, 14, 'start'));
    });
    svg.replaceChildren(...k);

    fbox(box, [[`English ${eR}/10 = ${eP}%`, C.violet], [`Spanish ${sR}/10 = ${sP}%`, C.amber],
      `gap = ${eP} − ${sP} = ${sg(gap)} points`,
      `card by card: (${cnt[1]} − ${cnt[2]}) ÷ 10`, [`            = ${sg(gap)} points`, C.amber],
      [`together: ${eR + sR}/20 = ${all}%`, C.cyan]]);
    note.textContent = (gap > 0 ? `Spanish speakers get ${gap} points less on the same questions.`
      : gap < 0 ? `Here English speakers get ${-gap} points less on the same questions.`
      : 'No gap: box 2 and box 3 hold the same number of cards.')
      + ` Only boxes 2 and 3 move the gap. The together score (${all}%) sits between the two and can hide a gap.`;
    chal.update({ gap, enOnly: cnt[1], all, es: sP, en: eP });
  }
  draw();
  return () => {};
}
