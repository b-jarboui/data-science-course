// 21.1.4 Try it: dense retrieval with arrows of meaning.
// The learner turns the question's arrow (drag it, or use the slider), sees each page's
// multiply-and-add score update live, makes random guides, and solves small challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const deg = (y, x) => Math.atan2(y, x) * 180 / Math.PI;
  const START = [{ n: 1, a: 90 }, { n: 2, a: 0 }, { n: 4, a: deg(0.6, 0.8) }];
  const Q0 = deg(0.8, 0.6);
  let pages = START.map(p => ({ ...p })), q = Q0, random = false, long = false;

  const svg = s('svg', { viewBox: '0 0 700 440' }), rank = s('svg', { viewBox: '0 0 320 110' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const slider = h('input', { type: 'range', min: 0, max: 90, step: 1, value: Math.round(Q0), style: { flex: '1 1 10rem' } });
  const qLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const longBtn = btn('Page 1 twice as long', () => { long = !long; draw(); });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: arrows of meaning'),
    h('p', { class: 'sub' }, 'Each page is an arrow of length 1: across = borrowing, up = time and lateness. Drag the green question arrow (or use the slider). Each page’s score: multiply the across numbers, multiply the up numbers, add.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Question:'), slider, qLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random pages)', newData, 'go'),
          longBtn,
          btn('Back to the lesson’s example', () => { pages = START.map(p => ({ ...p })); q = Q0; random = false; long = false; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, rank, box, note), h('div', { class: 'sim-card' }, ch)))));

  const f2 = x => (Math.abs(x) < 0.005 ? 0 : x).toFixed(2);
  const chal = challenges(ch, [
    { text: 'Turn the question arrow until page 2 ranks first.',
      check: st => st.top === 2, why: 'Yes! Point the question towards borrowing and the borrowing page wins.' },
    { text: 'With the lesson’s example, make page 2 score exactly 0.',
      check: st => !st.random && Math.abs(st.s2) < 0.005,
      why: 'Straight up is a right angle to page 2: 0 × 1 + 1 × 0 = 0. A right angle means no shared meaning.' },
    { text: 'Press “Page 1 twice as long”, then point the question nearer page 4 than page 1. Who wins?',
      check: st => st.long && st.top === 1 && st.closest !== 1,
      why: 'Page 1 wins only because its arrow is longer, not because its direction is closer. That is why every arrow must have length 1.' },
    { text: 'Press “New data”, then make one page score 1.00.',
      check: st => st.random && !st.long && st.best >= 0.995,
      why: 'A score of 1 means the two arrows point the same way. With length-1 arrows, multiply-and-add never goes above 1.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = NARROW ? 40 : 90, Y0 = 400;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);
  const unit = () => (long ? 0.5 : 1) * (NARROW ? 300 : 330);
  const colOf = n => n === 4 ? C.amber : C.ink;

  function newData() {
    let a;
    do a = [rnd(0, 90), rnd(0, 90), rnd(0, 90)]; while (a.some((x, i) => a.some((y, j) => i < j && Math.abs(x - y) < 15)));
    pages = START.map((p, i) => ({ ...p, a: a[i] })); random = true; draw();
  }

  // drag the question: the pointer's direction from the origin sets the arrow
  let dragging = false;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const aim = e => { const p = toSvg(e); q = Math.max(0, Math.min(90, Math.round(deg(Y0 - p.y, p.x - X0)))); draw(); };
  svg.addEventListener('pointerdown', e => { dragging = true; svg.setPointerCapture(e.pointerId); aim(e); });
  svg.addEventListener('pointermove', e => { if (dragging) aim(e); });
  svg.addEventListener('pointerup', () => { dragging = false; });
  slider.addEventListener('input', () => { q = +slider.value; draw(); });

  function arrow(a, len, color, w) {
    const r = a * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r);
    const tx = X0 + c * len, ty = Y0 - sn * len, hl = 14, hw = 7;
    const bx = tx - c * hl, by = ty + sn * hl;
    return { tx, ty, els: [s('line', { x1: X0, y1: Y0, x2: bx, y2: by, stroke: color, 'stroke-width': w, 'stroke-linecap': 'round' }),
      s('polygon', { points: `${tx},${ty} ${bx + sn * hw},${by + c * hw} ${bx - sn * hw},${by - c * hw}`, fill: color })] };
  }
  const label = (x, y, color, text) => s('text', { x: x > VW - 130 ? x : x + 10, y: y - 12, fill: color, 'font-size': 14 * F, 'font-weight': 700,
    'text-anchor': x > VW - 130 ? 'end' : 'start', 'font-family': 'Consolas' }, text);

  function draw() {
    const U = unit(), r = q * Math.PI / 180, qx = Math.cos(r), qy = Math.sin(r);
    const rows = pages.map(p => { const len = p.n === 1 && long ? 2 : 1, pr = p.a * Math.PI / 180, x = len * Math.cos(pr), y = len * Math.sin(pr);
      return { ...p, len, x, y, s: qx * x + qy * y, gap: Math.abs(p.a - q) }; });
    const sorted = rows.slice().sort((a, b) => b.s - a.s);
    const closest = rows.slice().sort((a, b) => a.gap - b.gap)[0].n;
    const top = long ? 2 * U : U;

    const k = [
      s('line', { x1: X0, y1: Y0, x2: X0 + U + 30, y2: Y0, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: X0, y1: Y0, x2: X0, y2: Y0 - top - 20, stroke: C.muted, 'stroke-width': 1.5 }),
      s('text', { x: X0 + U / 2, y: Y0 + 28, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle' }, 'across = borrowing'),
      s('text', { x: X0 + 8, y: Y0 - top - 24, fill: C.muted, 'font-size': 13 * F }, 'up = time, lateness'),
      s('path', { d: `M ${X0 + U} ${Y0} A ${U} ${U} 0 0 0 ${X0} ${Y0 - U}`, fill: 'none', stroke: C.muted, 'stroke-dasharray': '6 6', 'stroke-opacity': 0.7 }),
      s('text', { x: X0 + U * 0.74, y: Y0 - U * 0.74, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'start' }, 'length 1'),
    ];
    rows.forEach(p => {
      const a = arrow(p.a, p.len * U, colOf(p.n), 3);
      k.push(...a.els, label(a.tx, a.ty, colOf(p.n), `page ${p.n} · ${f2(p.s)}`));
    });
    const qa = arrow(q, U, C.green, 5);
    k.push(...qa.els, s('circle', { cx: qa.tx, cy: qa.ty, r: 14, fill: C.green, 'fill-opacity': 0.22, stroke: C.green }),
      label(qa.tx, qa.ty - 10, C.green, 'question'));
    svg.replaceChildren(...k);

    // ranking bars
    const maxS = Math.max(1, ...sorted.map(p => p.s));
    rank.replaceChildren(...sorted.flatMap((p, i) => {
      const y = 10 + i * 32, w = Math.max(0, p.s) / maxS * 180, col = i === 0 ? C.amber : C.cyan;
      return [s('text', { x: 0, y: y + 16, fill: colOf(p.n), 'font-size': 15, 'font-weight': 700, 'font-family': 'Consolas' }, `page ${p.n}`),
        s('rect', { x: 78, y, width: w, height: 22, rx: 4, fill: col, 'fill-opacity': 0.8 }),
        s('text', { x: 86 + w, y: y + 16, fill: col, 'font-size': 15, 'font-weight': 700, 'font-family': 'Consolas' }, f2(p.s))];
    }));

    fbox(box, [[`question = (${f2(qx)}, ${f2(qy)})`, C.green],
      ...sorted.map((p, i) => [`page ${p.n}: ${f2(qx)}×${f2(p.x)} + ${f2(qy)}×${f2(p.y)} = ${f2(p.s)}`, i === 0 ? C.amber : C.ink])]);
    note.textContent = long ? 'Page 1 now has length 2, so its score doubles although its direction did not change.'
      : `Best match: page ${sorted[0].n}. The closer the directions, the bigger the score.`;
    qLabel.textContent = `across ${f2(qx)}, up ${f2(qy)}`;
    slider.value = Math.round(q);
    longBtn.textContent = long ? 'Page 1 back to length 1' : 'Page 1 twice as long';
    chal.update({ top: sorted[0].n, s2: rows.find(p => p.n === 2).s, random, long, closest, best: sorted[0].s });
  }
  draw();
  return () => {};
}
