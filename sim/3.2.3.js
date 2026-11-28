// 3.2.3 Try it: time alignment.
// The learner shifts the website's UTC readings onto local time (drag the row, use the slider or ±1 hour),
// sees which readings pair up and the inside − outside gaps, makes random places, and solves challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START_IN = [18, 21, 24, 27, 30];                                // sensor A, local 8:00 to 12:00
  const START_OUT = [[4, 15], [5, 17], [6, 19], [7, 21], [8, 24]];      // website, UTC
  const OMIN = -8, OMAX = 10;
  let ins, out, trueOff, off, random = false, hidden = false, fullSeen = new Set();

  function reset() {
    ins = START_IN.map((t, i) => ({ h: 8 + i, t }));
    out = START_OUT.map(([u, t]) => ({ u, t }));
    trueOff = 4; off = 0; random = false; fullSeen = new Set();
  }
  function newPlace() {
    const offs = [-5, -3, -2, 1, 2, 3, 5, 6, 7];
    trueOff = offs[rnd(0, offs.length - 1)];
    const u0 = 8 - trueOff - 1;                       // the website gives 7 hours, around the greenhouse's 5
    let t = rnd(5, 16);
    out = [];
    for (let i = 0; i < 7; i++) { out.push({ u: u0 + i, t }); t += rnd(1, 3); }
    ins = [0, 1, 2, 3, 4].map(i => ({ h: 8 + i, t: out[i + 1].t + 2 + Math.floor(i * 0.8) + rnd(0, 1) }));
    off = 0; random = true; fullSeen = new Set();
  }
  reset();

  const hh = x => `${((x % 24) + 24) % 24}:00`;
  const sgn = x => x >= 0 ? `+ ${x}` : `− ${-x}`;

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 320, F = NARROW ? 1.15 : 1;
  const X0 = NARROW ? 74 : 104, X1 = VW - 8;
  const Y_IN = 76, Y_OUT = 164, Y_DIFF = 236, Y_AX = 268, CH = 56;
  let colW = 60;

  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const slider = h('input', { type: 'range', min: OMIN, max: OMAX, step: 1, value: 0, style: { flex: '1 1 10rem' },
    oninput: e => setOff(+e.target.value) });
  const offLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const hideBtn = btn('Hide the offset', () => { hidden = !hidden; hideBtn.textContent = hidden ? 'Show the offset' : 'Hide the offset'; draw(); });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: line up the clocks'),
    h('p', { class: 'sub' }, 'The greenhouse writes local time; the website writes UTC. Drag the website row left or right (or use the slider) to add an offset, and watch which readings pair up.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1 hour', () => setOff(off - 1)), slider, btn('+1 hour', () => setOff(off + 1)), offLabel),
        h('div', { class: 'sim-row' },
          btn('New place (random)', () => { newPlace(); slider.value = off; draw(); }, 'go'),
          hideBtn,
          btn('Start again', () => { reset(); hidden = false; hideBtn.textContent = 'Hide the offset'; slider.value = off; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'The website writes UTC times. Set the offset from the place card, so the website rows move onto local time.',
      check: st => !st.random && st.off === 4,
      why: 'Yes: 4:00 UTC + 4 = 8:00 local. Now each pair was measured at the same moment, and inside is 3 to 6 degrees warmer.' },
    { text: 'Now try an offset of +3. The rows still pair up. Are the answers right?',
      check: st => !st.random && st.off === 3,
      why: 'Four pairs, all wrong: each one compares readings taken an hour apart. A wrong offset still gives numbers, just not true ones.' },
    { text: 'Press “New place (random)”, read its offset on the place card, and line up its clocks.',
      check: st => st.random && !st.hidden && st.off === st.trueOff,
      why: 'Local time = UTC time + offset works for every place; you only need the right offset.' },
    { text: 'Press “Hide the offset”, then “New place”. Find two different shifts that give every sensor A reading a partner.',
      check: st => st.hidden && st.random && st.full >= 2,
      why: 'Several shifts pair every row and all look believable. Without the stored offset, nobody can tell which readings were taken together.' },
  ]);

  function setOff(v) { off = Math.max(OMIN, Math.min(OMAX, v)); slider.value = off; draw(); }

  // drag the website row: every column width moved = one hour
  let drag = null;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => { const p = toSvg(e); drag = { x: p.x, off, cw: colW }; svg.setPointerCapture(e.pointerId); draw(); });
  svg.addEventListener('pointermove', e => { if (!drag) return; const p = toSvg(e); const v = drag.off + Math.round((p.x - drag.x) / drag.cw); if (v !== off) setOff(v); });
  const stop = () => { if (drag) { drag = null; draw(); } };
  svg.addEventListener('pointerup', stop);
  svg.addEventListener('pointercancel', stop);

  function draw() {
    const uMin = Math.min(...out.map(o => o.u)), uMax = Math.max(...out.map(o => o.u));
    const lo = Math.min(8, uMin + off), hi = Math.max(12, uMax + off), n = hi - lo + 1;
    const cw = (X1 - X0) / n, bw = Math.min(70, cw - 4);
    colW = cw;
    const cx = hr => X0 + (hr - lo + 0.5) * cw;
    const fsT = Math.max(8, Math.min(13, bw * 0.22)) * F, fsV = Math.max(9, Math.min(20, bw * 0.34)) * F;
    const ok = off === trueOff;
    const k = [];

    // place card
    k.push(s('text', { x: 8, y: 22, fill: hidden ? C.pink : C.ink, 'font-size': 15 * F, 'font-weight': 700, 'font-family': 'Consolas' },
      hidden ? 'Greenhouse clock: local = UTC + ?' : `Greenhouse clock: local = UTC ${sgn(trueOff)}`));

    // row labels
    const lab = (y, a, b, col) => k.push(
      s('text', { x: X0 - 8, y: y - 2, fill: col, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Segoe UI, Arial' }, a),
      s('text', { x: X0 - 8, y: y + 15, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Segoe UI, Arial' }, b));
    lab(Y_IN, 'Sensor A', 'local time', C.cyan);
    lab(Y_OUT, 'Website', 'UTC times', C.violet);
    lab(Y_DIFF, 'Warmer', NARROW ? 'in − out' : 'inside − outside', C.amber);

    // draggable band behind the website row
    k.push(s('rect', { x: X0, y: Y_OUT - CH / 2 - 6, width: X1 - X0, height: CH + 12, rx: 10, fill: '#ffffff', 'fill-opacity': drag ? 0.08 : 0.03 }));

    // local timeline
    k.push(s('line', { x1: X0, x2: X1, y1: Y_AX, y2: Y_AX, stroke: C.muted, 'stroke-width': 2 }));
    const every = cw < 20 ? 3 : cw < 40 ? 2 : 1;
    for (let hr = lo; hr <= hi; hr++) {
      const x = cx(hr);
      k.push(s('line', { x1: x, x2: x, y1: Y_AX - 5, y2: Y_AX + 5, stroke: C.muted, 'stroke-width': 2 }));
      if ((hr - lo) % every === 0) k.push(s('text', { x, y: Y_AX + 22, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, hh(hr)));
    }
    k.push(s('text', { x: X0 - 8, y: Y_AX + 22, fill: C.cyan, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Segoe UI, Arial' }, 'local'));

    // pairs: same local time
    const inAt = new Map(ins.map(r => [r.h, r]));
    const pairs = [];
    out.forEach(o => { const r = inAt.get(o.u + off); if (r) pairs.push({ h: r.h, a: r.t, b: o.t, d: r.t - o.t }); });
    if (hidden && random && pairs.length === ins.length) fullSeen.add(off);
    pairs.forEach(p => {
      const x = cx(p.h);
      k.push(s('line', { x1: x, x2: x, y1: Y_IN + CH / 2 + 3, y2: Y_OUT - CH / 2 - 3, stroke: ok && !hidden ? C.green : C.amber, 'stroke-width': 3 }),
        s('text', { x, y: Y_DIFF + 7, fill: p.d >= 0 ? C.amber : C.pink, 'font-size': fsV, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          `${p.d >= 0 ? '+' : '−'}${Math.abs(p.d)}`));
    });

    // reading cards
    const cardEl = (x, y, time, t, col) => k.push(
      s('rect', { x: x - bw / 2, y: y - CH / 2, width: bw, height: CH, rx: 7, fill: C.card, stroke: col, 'stroke-width': 2 }),
      s('text', { x, y: y - 8, fill: C.muted, 'font-size': fsT, 'text-anchor': 'middle', 'font-family': 'Consolas' }, time),
      s('text', { x, y: y + 16, fill: col, 'font-size': fsV, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${t}°`));
    ins.forEach(r => cardEl(cx(r.h), Y_IN, hh(r.h), r.t, C.cyan));
    out.forEach(o => cardEl(cx(o.u + off), Y_OUT, hh(o.u), o.t, C.violet));
    svg.replaceChildren(...k);

    // formula box and notes
    const o0 = out[0];
    fbox(box, [
      'local time = UTC time + offset',
      `offset used = ${sgn(off)} h`,
      `${hh(o0.u)} UTC ${sgn(off)} h = ${hh(o0.u + off)} local`,
      `pairs at the same local time: ${pairs.length}`,
      [pairs.length ? `inside − outside: ${pairs.map(p => (p.d >= 0 ? '+' : '−') + Math.abs(p.d)).join(', ')}` : 'inside − outside: no pairs', C.amber],
      hidden ? ['offset not stored: cannot check', C.pink]
        : ok ? [`✓ right offset: this place is UTC ${sgn(trueOff)}`, C.green]
          : [`✗ this place is UTC ${sgn(trueOff)}, not UTC ${sgn(off)}`, C.pink]]);
    const gap = Math.abs(off - trueOff);
    note.textContent = hidden
      ? 'The offset was not stored. Several shifts can pair the rows, and nothing tells you which readings were really taken together.'
      : ok ? 'Aligned: each pair was measured at the same moment. The gaps show how much warmer the greenhouse is.'
        : pairs.length ? `These ${pairs.length} pairs use the wrong offset: each one compares readings taken ${gap} hour${gap === 1 ? '' : 's'} apart.`
          : 'No website reading sits at the same local time as a sensor A reading. Drag the website row, or use the slider.';
    offLabel.textContent = `Offset: UTC ${sgn(off)} h`;
    chal.update({ off, trueOff, random, hidden, paired: pairs.length, full: fullSeen.size });
  }
  draw();
  return () => { drag = null; };
}
