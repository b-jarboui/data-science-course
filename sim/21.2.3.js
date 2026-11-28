// 21.2.3 Try it: retrieval recall.
// Ten held-out cards; each card's block sits at the place its source passage got in the ranking.
// The learner drags the cut line (k) or a block, makes random rankings, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = [1, 1, 2, 1, 3, 1, 2, 1, 5, 1], PLACES = 8;
  const BAG = [1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 8];   // random places: most passages land near the top
  let r = START.slice(), k = 3, sel = 8, random = false;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const kLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const slider = h('input', { type: 'range', min: 1, max: PLACES, step: 1, value: k, 'aria-label': 'k: places above the cut line',
    oninput: e => { k = +e.target.value; draw(); } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: recall at k'),
    h('p', { class: 'sub' }, 'Each column is one test card. Its block shows the place where the card’s source passage landed in the ranking. Drag the dashed cut line, or drag a block up or down.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, slider, kLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Passage up', () => bump(-1)), btn('Passage down', () => bump(1)), selLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random)', () => { r = r.map(() => BAG[rnd(0, BAG.length - 1)]); random = true; draw(); }, 'go'),
          btn('Line at the very bottom', () => { k = PLACES; draw(); }),
          btn('Start again', () => { r = START.slice(); k = 3; sel = 8; random = false; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const count = kk => r.filter(p => p <= kk).length;
  const pct = kk => Math.round(count(kk) / r.length * 100);
  const chal = challenges(ch, [
    { text: 'Move the cut line so that recall is 60 %.',
      check: st => st.count * 10 === st.n * 6, why: 'Yes: only the cards whose source passage is above the line count, here 6 of 10.' },
    { text: 'Drag card Q9’s block into the top 3, so that recall at 3 becomes 100 %.',
      check: st => st.k === 3 && st.count === st.n, why: 'Right: a better search puts the needed passage where the assistant reads it.' },
    { text: 'Put the line at the very bottom. Recall is 100 %. Is that a good search?',
      check: st => st.k === PLACES, why: 'No: the assistant would have to read every passage. That is no search at all, so always say which k.' },
    { text: 'Press “New data”, then find the smallest k that gives at least 90 % recall.',
      check: st => st.random && st.k === st.smallest90, why: 'Well found: the smaller the k that still fetches what is needed, the better the search.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = NARROW ? 52 : 74, X1 = VW - 10, TOP = 58, BASE = 426;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);
  const rowH = (BASE - TOP) / PLACES;
  const slot = () => (X1 - X0) / r.length;
  const cutY = () => TOP + k * rowH;

  function bump(d) { r[sel] = Math.max(1, Math.min(PLACES, r[sel] + d)); draw(); }

  // drag the cut line, or a card's block
  let drag = null;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (Math.abs(p.y - cutY()) < 14) drag = 'line';
    else {
      const i = Math.floor((p.x - X0) / slot());
      if (i < 0 || i >= r.length || p.y < TOP) return;
      sel = i; drag = i;
    }
    svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (drag === null) return;
    const p = toSvg(e);
    if (drag === 'line') k = Math.max(1, Math.min(PLACES, Math.round((p.y - TOP) / rowH)));
    else r[drag] = Math.max(1, Math.min(PLACES, Math.floor((p.y - TOP) / rowH) + 1));
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { drag = null; });

  function draw() {
    const n = r.length, w = slot(), bw = Math.min(40, w * 0.7), cy = cutY(), fs = 13 * F, c = count(k);
    const g = [s('rect', { x: X0, y: TOP, width: X1 - X0, height: cy - TOP, fill: C.green, 'fill-opacity': .05 })];
    for (let p = 1; p <= PLACES; p++) {
      const y = TOP + (p - 1) * rowH;
      g.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 12, y: y + rowH / 2 + 5, fill: p <= k ? C.ink : C.muted, 'font-size': fs + 2, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, p));
    }
    g.push(s('text', { x: X0 - 12, y: TOP - 22, fill: C.muted, 'font-size': fs, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'place'));
    r.forEach((p, i) => {
      const cx = X0 + w * (i + 0.5), col = i === 8 ? C.amber : C.cyan;
      if (i === sel) g.push(s('rect', { x: cx - w / 2 + 2, y: TOP - 4, width: w - 4, height: BASE - TOP + 8, fill: '#ffffff', 'fill-opacity': .05, rx: 6 }));
      g.push(s('text', { x: cx, y: TOP - 22, fill: col, 'font-size': (NARROW ? 11 : 13) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'Q' + (i + 1)),
        s('rect', { x: cx - bw / 2, y: TOP + (p - 1) * rowH + rowH * 0.22, width: bw, height: rowH * 0.56, fill: col, 'fill-opacity': p <= k ? .9 : .25, stroke: col, rx: 3 }));
    });
    g.push(s('line', { x1: X0 - 6, x2: X1, y1: cy, y2: cy, stroke: C.violet, 'stroke-width': 3, 'stroke-dasharray': '9 7' }),
      s('circle', { cx: X0 - 6, cy, r: 7 * F, fill: C.violet }));
    svg.replaceChildren(...g);

    fbox(box, [
      `k = ${k}  (the assistant reads ${k} passage${k > 1 ? 's' : ''})`,
      `source passage in the top ${k}: ${c} card${c === 1 ? '' : 's'}`,
      `number of cards: ${n}`,
      [`recall at ${k} = ${c} ÷ ${n} = ${pct(k)} %`, C.amber],
      [`recall at 1, 3, 5: ${pct(1)} %, ${pct(3)} %, ${pct(5)} %`, C.muted]]);
    note.textContent = k === PLACES ? 'The line is at the very bottom: recall is always 100 %, but the assistant must read every passage. That is no search at all.'
      : c === n ? 'Every source passage is above the line: the assistant can read all of them.'
      : `Above the line is what the assistant reads. ${n - c} card${n - c === 1 ? ' has its' : 's have their'} source passage below the line: the assistant never sees it.`;
    kLabel.textContent = `k = ${k}: cut line under place ${k}`;
    selLabel.textContent = `Selected: card Q${sel + 1} (place ${r[sel]})`;
    slider.value = k;
    let smallest90 = PLACES;
    for (let kk = PLACES; kk >= 1; kk--) if (count(kk) * 10 >= n * 9) smallest90 = kk;
    chal.update({ k, count: c, n, random, smallest90 });
  }
  draw();
  return () => {};
}
