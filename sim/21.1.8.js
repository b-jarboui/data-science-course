// 21.1.8 Try it: reranking.
// Stage 1 (fast search) ranks the six guide pages and keeps the top k as candidates. Stage 2 (the careful
// reader, a cross-encoder) scores each candidate with the question and puts them in a new order.
// The learner drags either kind of score, changes k, reranks, makes random questions, and solves
// small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const TOPIC = { 1: 'Opening hours', 2: 'Borrowing', 3: 'Renewals', 4: 'Late fees', 5: 'Rooms and printing', 6: 'Holidays' };
  // Shared example (chapters/21.1.md, 21.1.7 and 21.1.8): fusion scores and reader scores.
  // The chapter scores only the four candidates; pages 6 and 5 get low reader scores here so k can go up to 6.
  const START_FAST = { 2: 1.33, 4: 1, 3: 0.5, 1: 0.5, 6: 0.33, 5: 0 };
  const START_READ = { 4: 0.9, 3: 0.4, 2: 0.2, 1: 0.1, 6: 0.3, 5: 0.05 };
  const START_TIE = [2, 4, 3, 1, 6, 5];   // order for equal scores (as in the lesson: page 3 before page 1)
  let fast = { ...START_FAST }, read = { ...START_READ }, tie = START_TIE.slice();
  let random = false, k = 4, mix = 0, anim = 0, sel = 4;

  const svg = s('svg', {});
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const qText = h('div', { class: 'sim-note', style: { marginTop: 0, marginBottom: '.5rem' } });
  const kOut = h('b', {}, String(k));
  const slider = h('input', { type: 'range', min: 1, max: 6, step: 1, value: k, oninput: e => { k = +e.target.value; draw(); } });
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: rerank the candidates'),
    h('p', { class: 'sub' }, 'Stage 1, the fast search, ranks the six guide pages and keeps the top k as candidates. Stage 2, the careful reader, scores each candidate together with the question and puts them in a new order. Drag any bar to change a score. The amber page is the right page: the one the careful reader scores highest of all.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, qText, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Candidates kept: k = ', kOut), slider),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Reader −0.1', () => bump(-0.1)), btn('Reader +0.1', () => bump(0.1)), selLabel),
        h('div', { class: 'sim-row' },
          btn('Rerank', () => go(1), 'go'),
          btn('Back to stage 1 order', () => go(0)),
          btn('New question (random)', newQuestion),
          btn('Start again', startAgain))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const byFast = (a, b) => fast[b] - fast[a] || tie.indexOf(a) - tie.indexOf(b);
  const byRead = (a, b) => read[b] - read[a] || tie.indexOf(a) - tie.indexOf(b);
  const order1 = () => tie.slice().sort(byFast);
  const right = () => tie.slice().sort(byRead)[0];
  const r2 = x => Math.round(x * 100) / 100;

  const chal = challenges(ch, [
    { text: 'Press Rerank. Which page comes first now?',
      check: st => st.reranked && st.inC && st.first === st.right,
      why: 'The right page: the careful reader gives it the best score, so it moves to the top.' },
    { text: 'Make the candidate list so short that the right page is left out, then press Rerank. Can the reader fix it?',
      check: st => st.reranked && !st.inC,
      why: 'No. Reranking can only reorder what stage 1 found; a page that is not a candidate is never read.' },
    { text: 'Find the smallest k that still puts the right page first after Rerank.',
      check: st => st.reranked && st.k === st.minK && st.first === st.right,
      why: 'Right: each candidate costs one slow read, so keep enough, but no more than you need.' },
    { text: 'Press “New question (random)” and do it again: the smallest k that still puts the right page first.',
      check: st => st.random && st.reranked && st.k === st.minK && st.first === st.right,
      why: 'It works every time: the right page comes first as soon as stage 1 keeps it among the candidates.' },
  ]);

  // geometry: two columns side by side on a laptop, stacked on a phone
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 700 : 440, RH = NARROW ? 42 : 50, F = NARROW ? 1.1 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const COLS = NARROW ? [{ x: 12, y: 40, w: 376 }, { x: 12, y: 380, w: 376 }] : [{ x: 16, y: 40, w: 324 }, { x: 362, y: 40, w: 324 }];
  const LW = NARROW ? 150 : 128, FS = NARROW ? 14 : 12.5;
  const barX = c => c.x + LW + 10, barW = c => c.w - LW - 10 - 44;
  const rowTop = c => c.y + 34;
  const rowY = (c, i) => rowTop(c) + i * RH + RH / 2;

  function startAgain() { fast = { ...START_FAST }; read = { ...START_READ }; tie = START_TIE.slice(); random = false; k = 4; sel = 4; slider.value = k; jump(0); }
  function newQuestion() {
    tie = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
    for (const n of tie) { fast[n] = rnd(0, 15) / 10; read[n] = rnd(0, 8) / 10; }
    read[rnd(1, 6)] = 0.9 + rnd(0, 1) / 10;   // one right page, clearly the best for the careful reader
    random = true; jump(0);
  }
  function bump(d) { read[sel] = Math.max(0, Math.min(1, r2(read[sel] + d))); draw(); }
  function jump(v) { cancelAnimationFrame(anim); mix = v; draw(); }
  function go(target) {
    cancelAnimationFrame(anim);
    const from = mix, t0 = performance.now();
    const step = now => {
      const q = Math.min(1, (now - t0) / 900);
      mix = from + (target - from) * q * q * (3 - 2 * q);
      draw();
      if (q < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // rows on screen: stage 1 (all six pages) and stage 2 (candidates only, moving to the new order)
  function rowsAt() {
    const [c1, c2] = COLS, o1 = order1(), cs = o1.slice(0, k), o2 = cs.slice().sort(byRead);
    return [...o1.map((n, i) => ({ n, col: 0, y: rowY(c1, i) })),
      ...cs.map((n, i) => ({ n, col: 1, y: rowY(c2, i + (o2.indexOf(n) - i) * mix) }))];
  }

  // drag a bar: pointer position sets the score; tapping a page card selects it
  let drag = null;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    const hit = rowsAt().find(r => { const c = COLS[r.col]; return p.x >= c.x && p.x <= c.x + c.w && Math.abs(p.y - r.y) < RH / 2; });
    if (!hit) return;
    sel = hit.n;
    drag = p.x >= barX(COLS[hit.col]) - 12 ? hit : null;
    if (drag) { svg.setPointerCapture(e.pointerId); move(e); } else draw();
  });
  const move = e => {
    if (!drag) return;
    const c = COLS[drag.col], p = toSvg(e), max = drag.col ? 1 : 1.5;
    const v = Math.max(0, Math.min(max, Math.round((p.x - barX(c)) / barW(c) * max * 20) / 20));
    (drag.col ? read : fast)[drag.n] = v;
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { drag = null; });
  svg.addEventListener('pointercancel', () => { drag = null; });

  function draw() {
    const [c1, c2] = COLS, o1 = order1(), cs = o1.slice(0, k), o2 = cs.slice().sort(byRead), R = right(), inC = cs.includes(R);
    const done = mix > 0.99;
    kOut.textContent = String(k);
    const g = [];
    const head = (c, a, b, col) => [
      s('text', { x: c.x, y: c.y + 14, fill: col, 'font-size': 14 * F, 'font-weight': 700, 'font-family': 'Consolas' }, a),
      s('text', { x: c.x + c.w, y: c.y + 14, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, b)];
    const row = (c, n, y, val, max, barCol, dim) => {
      const pcol = n === R ? C.amber : C.ink, w = Math.max(2, val / max * barW(c));
      return s('g', { opacity: dim ? 0.38 : 1 },
        s('rect', { x: c.x, y: y - RH * 0.36, width: LW, height: RH * 0.72, rx: 8, fill: pcol, 'fill-opacity': .12, stroke: pcol, 'stroke-width': n === sel ? 2.5 : 1 }),
        s('text', { x: c.x + LW / 2, y: y + FS * 0.36, fill: pcol, 'font-size': FS, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': '"Segoe UI", Arial, sans-serif' }, `${n} · ${TOPIC[n]}`),
        s('rect', { x: barX(c), y: y - RH * 0.22, width: barW(c), height: RH * 0.44, rx: 3, fill: C.line, 'fill-opacity': .5 }),
        s('rect', { x: barX(c), y: y - RH * 0.22, width: w, height: RH * 0.44, rx: 3, fill: barCol, 'fill-opacity': .82 }),
        s('text', { x: barX(c) + w + 6, y: y + 5 * F, fill: barCol, 'font-size': 14 * F, 'font-weight': 700, 'font-family': 'Consolas' }, fmt(val)));
    };

    g.push(...head(c1, 'STAGE 1 · FAST SEARCH', C.cyan, `top ${k} = candidates`),
      ...head(c2, 'STAGE 2 · CAREFUL READER', C.green, done ? 'new order' : 'still stage 1 order'));
    g.push(s('rect', { x: c1.x - 6, y: rowTop(c1) - 4, width: c1.w + 12, height: k * RH + 8, rx: 10, fill: 'none', stroke: C.cyan, 'stroke-dasharray': '6 5' }));
    o1.forEach((n, i) => g.push(row(c1, n, rowY(c1, i), fast[n], 1.5, C.cyan, i >= k)));
    cs.forEach((n, i) => g.push(row(c2, n, rowY(c2, i + (o2.indexOf(n) - i) * mix), read[n], 1, n === R ? C.amber : C.green, false)));
    if (!inC) {
      const y = rowTop(c2) + k * RH + 22;
      g.push(s('text', { x: c2.x, y, fill: C.pink, 'font-size': 14 * F, 'font-weight': 700 }, `Page ${R}, the right page, is not a candidate.`),
        s('text', { x: c2.x, y: y + 19 * F, fill: C.pink, 'font-size': 14 * F }, 'No reader can bring it back.'));
    }
    svg.replaceChildren(...g);

    qText.textContent = random ? 'Question: a made-up question (random scores).'
      : 'Question: “What happens if I bring a novel back after the deadline?”';
    fbox(box, [
      `stage 1 keeps k = ${k} of 6 pages`,
      `slow reads = ${k}   (all 6 pages: 6, archive: 1,200)`,
      done ? [`final order = ${o2.join(', ')}`, C.green] : 'final order = press Rerank',
      [`right page ${R}: ${inC ? 'a candidate ✓' : 'not a candidate ✗'}`, inC ? C.green : C.pink]]);
    note.textContent = !inC ? 'Stage 1 left the right page out. Reranking can only reorder the candidates, so keep more of them (bigger k).'
      : done ? `The careful reader read ${k} pairs (question + page) and put the best page first.`
      : 'Top k pages of stage 1 are the candidates. Press Rerank to let the careful reader sort them by its own score.';
    selLabel.textContent = `Selected: page ${sel} (reader score ${fmt(read[sel])})`;
    chal.update({ reranked: done, inC, first: o2[0], right: R, k, minK: o1.indexOf(R) + 1, random });
  }
  draw();
  return () => cancelAnimationFrame(anim);
}
