// 21.1.7 Try it: fuse two rankings by position.
// The learner reorders the word-search and meaning-search lists by tapping, picks how many top places count
// and the fixed number added to each position, and watches the fused points update live.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  // Top 3 of each list are the lesson's numbers; below 3rd place the order is only for play
  // (the novel question's word list is the full BM25 order).
  const PRESETS = {
    r12: { q: '“Can I book R12 for my study group?”', word: [5, 3, 4, 1, 2, 6], mean: [2, 5, 1, 3, 4, 6] },
    novel: { q: '“What happens if I bring a novel back after the deadline?”', word: [2, 3, 6, 5, 4, 1], mean: [4, 1, 2, 3, 5, 6] },
  };
  let lists, preset, topk = 3, kc = 0;
  const load = name => { preset = name; lists = [PRESETS[name].word.slice(), PRESETS[name].mean.slice()]; };
  load('r12');

  const svg = s('svg', {});
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const qLabel = h('div', { class: 'sim-note', style: { marginTop: 0, marginBottom: '.5rem' } });
  const kOut = h('b'), cOut = h('b');
  const kIn = h('input', { type: 'range', min: 1, max: 6, step: 1, value: topk, oninput: e => { topk = +e.target.value; draw(); } });
  const cIn = h('input', { type: 'range', min: 0, max: 100, step: 1, value: kc, oninput: e => { kc = +e.target.value; draw(); } });
  const setK = v => { kc = v; cIn.value = v; draw(); };
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: fuse two rankings'),
    h('p', { class: 'sub' }, 'Each list ranks the six pages. Tap a page to move it up one place (the top page drops to the bottom). Only the top places count, and each place gives 1 ÷ (fixed number + position) points. Below 3rd place the starting order is only for play.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, qLabel, svg,
        h('div', { class: 'sim-row' }, h('span', {}, 'Top places that count: ', kOut), kIn),
        h('div', { class: 'sim-row' }, h('span', {}, 'Fixed number added to each position: ', cOut), cIn,
          btn('0', () => setK(0)), btn('60', () => setK(60))),
        h('div', { class: 'sim-row' },
          btn('R12 question', () => { load('r12'); draw(); }, 'go'),
          btn('Novel question', () => { load('novel'); draw(); }),
          btn('New data (random)', () => { lists = [shuffle([1, 2, 3, 4, 5, 6]), shuffle([1, 2, 3, 4, 5, 6])]; preset = null; draw(); }),
          btn('Start again', () => { load('r12'); topk = 3; kIn.value = 3; setK(0); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Tap pages in the lists to make page 1 win the fused ranking.',
      check: st => st.winner === 1, why: 'Yes! Page 1 now sits high enough in the lists to collect the most points.' },
    { text: 'Make two pages tie for first place.',
      check: st => st.tie, why: 'Right: fusion only counts positions, so two pages with matching places get exactly the same points.' },
    { text: 'Load the novel question. Can a fixed number of 60 or more make the right page 4 beat page 2?',
      check: st => st.preset === 'novel' && st.kc >= 60 && st.winner === 2,
      why: 'No. Page 2 has a first place just like page 4, plus extra points from the other list, at any fixed number. Fusion never reads the question.' },
    { text: 'Make a page win outright that is first in neither list. (Hint: try the fixed number.)',
      check: st => st.winner && st.winner !== st.w0 && st.winner !== st.m0,
      why: 'With a big fixed number the gaps between places are gentle, so being in both lists counts for more than one first place.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const F = NARROW ? 1.25 : 1, VW = NARROW ? 400 : 700, VH = NARROW ? 720 : 400;
  const LX = [100, 300], LY0 = 60, RH = NARROW ? 46 : 52, HY = 28;
  const FX = NARROW ? 20 : 430, FY0 = NARROW ? 420 : 60, BMAX = NARROW ? 200 : 110;
  const FHX = NARROW ? 200 : 535, FHY = NARROW ? 390 : 28;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const pc = p => p === 4 ? C.amber : p === 5 ? C.cyan : C.ink;
  const ord = r => ['1st', '2nd', '3rd', '4th', '5th', '6th'][r - 1];
  const term = r => kc ? `1/${kc + r}` : r === 1 ? '1' : `1/${r}`;
  const num = x => x.toFixed(kc ? 4 : 2).replace(/0+$/, '').replace(/\.$/, '');
  const txt = (x, y, t, fill, size, anchor = 'middle', bold = true) =>
    s('text', { x, y, fill, 'font-size': size * F, 'font-weight': bold ? 700 : 400, 'text-anchor': anchor, 'font-family': 'Consolas' }, t);

  function fuse() {
    return [1, 2, 3, 4, 5, 6].map(p => {
      const parts = lists.map(l => l.indexOf(p) + 1).filter(r => r >= 1 && r <= topk);
      return { p, parts, score: parts.reduce((a, r) => a + 1 / (kc + r), 0) };
    }).sort((a, b) => b.score - a.score || a.p - b.p);
  }
  function moveUp(li, i) {
    const l = lists[li];
    if (i === 0) l.push(l.shift()); else [l[i - 1], l[i]] = [l[i], l[i - 1]];
    preset = null; draw();
  }

  function draw() {
    const f = fuse(), max = f[0].score || 1;
    const tie = f[0].score > 0 && Math.abs(f[0].score - f[1].score) < 1e-12;
    const winner = f[0].score > 0 && !tie ? f[0].p : null;
    const k = [txt(LX[0], HY, 'WORD SEARCH', C.cyan, 14), txt(LX[1], HY, 'MEANING SEARCH', C.violet, 14), txt(FHX, FHY, 'FUSED POINTS', C.green, 14)];
    lists.forEach((l, li) => l.forEach((p, i) => {
      const y = LY0 + i * RH, x = LX[li], on = i < topk, col = pc(p);
      k.push(txt(x - 80, y + 5, ord(i + 1), C.muted, 13, 'middle', false));
      const g = s('g', { opacity: on ? 1 : 0.35, style: 'cursor:pointer' },
        s('rect', { x: x - 62, y: y - 17, width: 140, height: 34, rx: 8, fill: col, 'fill-opacity': 0.14, stroke: col, 'stroke-width': 1.5 }),
        txt(x - 52, y + 5, `PAGE ${p}`, col, 14, 'start'),
        txt(x + 70, y + 5, on ? '+' + term(i + 1) : '0', on ? C.green : C.muted, 13, 'end'));
      g.addEventListener('pointerdown', e => { e.preventDefault(); moveUp(li, i); });
      k.push(g);
    }));
    if (topk < 6) {
      const y = LY0 + (topk - 0.5) * RH;
      k.push(s('line', { x1: 8, x2: LX[1] + 82, y1: y, y2: y, stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '8 6' }));
    }
    f.forEach((r, i) => {
      const y = FY0 + i * RH, col = pc(r.p), w = r.score / max * BMAX;
      k.push(s('rect', { x: FX, y: y - 17, width: 90, height: 34, rx: 8, fill: col, 'fill-opacity': 0.14, stroke: col,
          'stroke-width': r.p === winner ? 3.5 : 1.5, opacity: r.score ? 1 : 0.35 }),
        txt(FX + 45, y + 5, `PAGE ${r.p}`, col, 14),
        s('rect', { x: FX + 100, y: y - 9, width: Math.max(0, w), height: 18, rx: 4, fill: col, 'fill-opacity': 0.82 }),
        txt(FX + 106 + w, y + 5, num(r.score), col, 14, 'start'));
    });
    svg.replaceChildren(...k);

    const lines = [kc ? `points = 1 ÷ (${kc} + position)` : 'points = 1 ÷ position'];
    f.filter(r => r.score > 0).forEach(r => {
      const sign = Math.abs(Number(num(r.score)) - r.score) > 1e-9 ? '≈' : '=';
      const s1 = `page ${r.p} = ${r.parts.map(term).join(' + ')}`;
      const s2 = r.parts.length > 1 || sign === '≈' || kc ? `${s1} ${sign} ${num(r.score)}` : s1;
      lines.push(r.p === winner ? [s2, C.amber] : s2);
    });
    const none = f.filter(r => r.score === 0).map(r => r.p).sort();
    if (none.length) lines.push([`page ${none.join(', ')}: 0 (in no top list)`, C.muted]);
    fbox(box, lines);
    note.textContent = winner ? `Page ${winner} wins the fused ranking with ${num(f[0].score)} points.`
      : `Tie for first place: pages ${f[0].p} and ${f[1].p} have the same points.`;
    qLabel.textContent = preset ? 'Question: ' + PRESETS[preset].q : 'Your own lists (no question loaded).';
    kOut.textContent = topk; cOut.textContent = kc;
    chal.update({ winner, tie, w0: lists[0][0], m0: lists[1][0], preset, kc });
  }
  draw();
  return () => {};
}
