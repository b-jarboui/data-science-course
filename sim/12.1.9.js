// 12.1.9 Try it: temporal splits.
// The learner drags a split line along a January-to-June timeline of renewals, compares it with a
// random split, changes the rule's cutoff, makes random data, and solves challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  // the shared renewals (chapters/12.1.md): customer, month 0..5 = Jan..Jun, hours, cancelled
  const START = [
    ['Ali', 0, 20, 0], ['Bea', 0, 12, 0], ['Chen', 0, 15, 0],
    ['Ali', 1, 18, 0], ['Bea', 1, 6, 0], ['Chen', 1, 10, 0], ['Farah', 1, 1, 1],
    ['Ali', 2, 22, 0], ['Bea', 2, 2, 1], ['Chen', 2, 7, 0], ['Dina', 2, 3, 0],
    ['Ali', 3, 19, 0], ['Chen', 3, 3, 1], ['Dina', 3, 9, 0],
    ['Ali', 4, 21, 0], ['Dina', 4, 14, 0], ['Eli', 4, 11, 0],
    ['Ali', 5, 20, 0], ['Dina', 5, 16, 0], ['Eli', 5, 6, 1]].map(([name, m, hrs, c]) => ({ name, m, hrs, c: !!c }));
  let data = START.slice(), mode = 'time', cut = 4, cutoff = 5, newData = 0, rtest = new Set();

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const sliderLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const slider = h('input', { type: 'range', min: 1, max: 25, value: cutoff, oninput: e => { cutoff = +e.target.value; draw(); } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: split along the timeline'),
    h('p', { class: 'sub' }, 'Each card is one renewal: cyan stayed, pink cancelled. Drag the amber line to choose where training ends and the test begins, then compare with a random split.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Line ←', () => setCut(cut - 1)), btn('Line →', () => setCut(cut + 1))),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, slider, sliderLabel),
        h('div', { class: 'sim-row' },
          btn('Time split', () => { mode = 'time'; draw(); }, 'go'),
          btn('Random split (shuffle)', () => { mode = 'random'; shuffleTest(); draw(); }),
          btn('New data (random)', () => { data = makeData(); newData++; shuffleTest(); draw(); }),
          btn('Start again', () => { data = START.slice(); mode = 'time'; cut = 4; cutoff = 5; slider.value = 5; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Drag the line so the test set is May and June only.',
      check: st => st.mode === 'time' && st.cut === 4,
      why: 'Yes: train on January to April, then test on the months that come after, just like real use.' },
    { text: 'Press “Random split”. Are any training cards later than a test card?',
      check: st => st.mode === 'random' && st.leaks > 0,
      why: 'Yes: a random split lets the model learn from months after the ones it is tested on. That never happens in real use.' },
    { text: 'Press “New data”, then make a time split with at least 2 cancels in the test.',
      check: st => st.newData > 0 && st.mode === 'time' && st.teC >= 2,
      why: 'Well done: on any data, a time split keeps the future out of training, and enough cancels in the test let it judge the rule.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps names readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.2 : 1;
  const X0 = 10, X1 = VW - 10, BASE = 392, CHH = 46;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);
  const cw = (X1 - X0) / 6;

  function setCut(c) { cut = Math.max(1, Math.min(5, c)); mode = 'time'; draw(); }
  function shuffleTest() {
    const n = data.filter(d => d.m >= cut).length || 1, idx = data.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = rnd(0, i); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    rtest = new Set(idx.slice(0, n));
  }
  // random renewals: each customer joins some month, hours drift, few hours make a cancel likely
  function makeData() {
    const names = ['Ali', 'Bea', 'Chen', 'Dina', 'Eli', 'Farah'];
    for (;;) {
      const out = [];
      for (const name of names) {
        let hrs = rnd(3, 24);
        for (let m = rnd(0, 4); m < 6; m++) {
          hrs = Math.max(0, Math.min(25, hrs + rnd(-6, 4)));
          const c = Math.random() < (hrs < 5 ? 0.5 : 0.07);
          out.push({ name, m, hrs, c });
          if (c) break;
        }
      }
      const cancels = out.filter(d => d.c).length;
      if (out.length >= 14 && out.length <= 24 && cancels >= 2) return out.sort((a, b) => a.m - b.m);
    }
  }

  // drag (or tap) anywhere on the timeline: the split line jumps to the nearest month boundary
  let dragging = false;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const move = e => { if (dragging) setCut(Math.round((toSvg(e).x - X0) / cw)); };
  svg.addEventListener('pointerdown', e => { dragging = true; svg.setPointerCapture(e.pointerId); move(e); });
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = false; });

  function draw() {
    const k = [], row = [0, 0, 0, 0, 0, 0];
    const isTest = (d, i) => mode === 'time' ? d.m >= cut : rtest.has(i);
    const firstTest = Math.min(...data.filter(isTest).map(d => d.m));
    const xs = X0 + cut * cw;
    if (mode === 'time') {
      k.push(s('rect', { x: X0 + 2, y: 72, width: xs - X0 - 6, height: BASE - 66, rx: 10, fill: C.violet, 'fill-opacity': .07, stroke: C.violet }),
        s('rect', { x: xs + 4, y: 72, width: X1 - xs - 6, height: BASE - 66, rx: 10, fill: C.amber, 'fill-opacity': .07, stroke: C.amber }),
        s('text', { x: (X0 + xs) / 2, y: 94, fill: C.violet, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'TRAIN'),
        s('text', { x: (xs + X1) / 2, y: 94, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'TEST'));
    }
    MON.forEach((mo, i) => k.push(s('text', { x: X0 + (i + .5) * cw, y: BASE + 28, fill: C.muted, 'font-size': 15 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, mo)));
    k.push(s('line', { x1: X0, x2: X1, y1: BASE + 8, y2: BASE + 8, stroke: C.muted, 'stroke-width': 2 }));
    let trR = 0, trN = 0, teR = 0, teN = 0, teC = 0, leaks = 0;
    data.forEach((d, i) => {
      const j = row[d.m]++, cx = X0 + (d.m + .5) * cw, bw = cw - 10, top = BASE - (j + 1) * CHH + 3;
      const test = isTest(d, i), ok = (d.hrs < cutoff) === d.c, leak = !test && d.m > firstTest;
      if (test) { teN++; teR += ok ? 1 : 0; teC += d.c ? 1 : 0; } else { trN++; trR += ok ? 1 : 0; leaks += leak ? 1 : 0; }
      const col = d.c ? C.pink : C.cyan;
      k.push(s('rect', { x: cx - bw / 2, y: top, width: bw, height: CHH - 6, rx: 6, fill: col, 'fill-opacity': .2,
          stroke: leak ? C.pink : test ? C.amber : C.violet, 'stroke-width': leak ? 3 : 2, 'stroke-dasharray': leak ? '5 4' : null }),
        s('text', { x: cx, y: top + 16, fill: C.ink, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial' }, d.name),
        s('text', { x: cx, y: top + 33, fill: col, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          `${d.hrs}h `, s('tspan', { fill: ok ? C.green : C.pink }, ok ? '✓' : '✗')));
    });
    if (mode === 'time') {
      k.push(s('line', { x1: xs, x2: xs, y1: 58, y2: BASE + 14, stroke: C.amber, 'stroke-width': 3 }),
        s('circle', { cx: xs, cy: 48, r: 11, fill: C.amber }),
        s('text', { x: xs, y: 24, fill: C.amber, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `after ${MON[cut - 1]}`));
    }
    svg.replaceChildren(...k);
    fbox(box, [mode === 'time' ? `split: by time, line after ${MON[cut - 1]}` : 'split: random shuffle',
      `rule: hours < ${cutoff} → cancel`,
      `training: ${trR} of ${trN} right`,
      [`test: ${teR} of ${teN} right (${teC} cancel${teC === 1 ? '' : 's'})`, C.amber],
      [`training cards after a test card: ${leaks}`, leaks ? C.pink : C.green]]);
    note.textContent = mode === 'time'
      ? 'Every training card comes before every test card. Drag the amber line to move the split.'
      : `${leaks} training card${leaks === 1 ? '' : 's'} (dashed pink) come after a test card: the model would learn from the future.`;
    sliderLabel.textContent = `Rule: fewer than ${cutoff} hours → cancel`;
    chal.update({ mode, cut, leaks, newData, teC });
  }
  draw();
  return () => {};
}
