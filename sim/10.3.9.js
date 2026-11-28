// 10.3.9 Try it: right censoring.
// Eight waits on a timeline. The learner drags a row to set when that visit really comes, moves the
// "stop watching" week, sends a patient away early, makes random clinics, and compares the two
// wrong averages with the hidden real one. Challenges are checked by the sim itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const NAMES = ['Amal', 'Badr', 'Chen', 'Dina', 'Eli', 'Farah', 'Gus', 'Hana'];
  // Log 4, with one made-up hidden end for each open wait (real life never shows these)
  const START = { t: [2, 3, 10, 6, 11, 9, 15, 18], leave: [null, null, 4, null, 7, null, null, null], stop: 12 };
  const MAXW = 20;
  let t = START.t.slice(), leave = START.leave.slice(), stop = START.stop, sel = 2, reveal = false, newCount = 0;

  const lastSeen = i => Math.min(leave[i] ?? Infinity, stop);
  const seen = i => t[i] <= lastSeen(i);
  const obs = i => seen(i) ? t[i] : lastSeen(i);

  const svg = s('svg', { viewBox: '0 0 700 380' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const stopLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const slider = h('input', { type: 'range', min: 3, max: MAXW, step: 1, value: stop, 'aria-label': 'Stop watching at week',
    oninput: e => { stop = +e.target.value; draw(); } });
  const revealBtn = btn('Show the hidden ends', () => { reveal = !reveal; draw(); });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: open bars'),
    h('p', { class: 'sub' }, 'Each bar is one patient’s wait, one block per week. Drag along a row to set the week the visit really comes. Move “stop watching” and see which bars stay open.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Stop watching at'), slider, stopLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Visit −1 week', () => bump(-1)), btn('Visit +1 week', () => bump(1)), btn('Moves away early', toggleLeave), selLabel),
        h('div', { class: 'sim-row' },
          revealBtn,
          btn('New data (random)', newData, 'go'),
          btn('Start again', reset))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const r1 = x => Math.round(x * 10) / 10;
  const eq = x => Number.isInteger(r1(x)) && Math.abs(x - Math.round(x)) < 1e-9 ? `= ${Math.round(x)}` : `≈ ${fmt(r1(x))}`;
  const chal = challenges(ch, [
    { text: 'Make every bar closed: no arrows left.',
      check: st => st.open === 0,
      why: 'Yes! Watch long enough and keep every patient, and you see every visit: nothing is censored.' },
    { text: 'Make exactly 3 bars open, then press “Show the hidden ends”.',
      check: st => st.open === 3 && st.revealed,
      why: 'Right: each open bar is only “at least” its length. The dashed blocks are the part you never see.' },
    { text: 'Make “drop open bars” lower than 5 weeks while the real mean is 9 or more.',
      check: st => st.drop != null && st.drop < 5 && st.real >= 9,
      why: 'Dropping the open bars throws away the longest waits, so the wait looks much too short.' },
    { text: 'Turn on “Show the hidden ends”, then press “New data” 3 times. Is “close at last seen” ever above the real mean?',
      check: st => st.revealed && st.newCount >= 3,
      why: 'Never. An open bar always stops before the real end, so this average is too low, or equal when no bar is open.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps text readable
  const VW = NARROW ? 420 : 700, F = NARROW ? 1.3 : 1;
  const X0 = NARROW ? 62 : 70, X1 = VW - (NARROW ? 66 : 64), TOP = 34, PITCH = 38, BH = 22;
  const AXY = TOP + 8 * PITCH - 8, VH = AXY + 30 * F + 6;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const ux = (X1 - X0) / MAXW, xw = w => X0 + w * ux, yr = i => TOP + i * PITCH;

  function fixLeave(i) { if (leave[i] != null && leave[i] >= t[i]) leave[i] = null; }
  function bump(d) { t[sel] = Math.max(1, Math.min(MAXW, t[sel] + d)); fixLeave(sel); draw(); }
  function toggleLeave() {
    if (leave[sel] != null) leave[sel] = null;
    else if (t[sel] > 1) leave[sel] = Math.ceil(t[sel] / 2);
    draw();
  }
  function newData() {
    t = NAMES.map(() => rnd(1, 18));
    leave = t.map(x => x > 2 && Math.random() < 0.25 ? rnd(1, x - 1) : null);
    newCount++; draw();
  }
  function reset() {
    t = START.t.slice(); leave = START.leave.slice(); stop = START.stop; slider.value = stop;
    sel = 2; reveal = false; draw();
  }

  // drag along a row: the pointer sets the week the visit really comes
  let dragging = -1;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), i = Math.round((p.y - TOP) / PITCH);
    if (i < 0 || i >= NAMES.length) return;
    sel = i; dragging = i; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    if (p.x >= X0 - 4) { t[dragging] = Math.max(1, Math.min(MAXW, Math.ceil((p.x - X0) / ux))); fixLeave(dragging); }
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const k = [], mono = 'Consolas';
    for (let w = 0; w <= MAXW; w += 2) {
      const x = xw(w);
      k.push(s('line', { x1: x, x2: x, y1: TOP - 18, y2: AXY, stroke: C.line }),
        s('text', { x, y: AXY + 20 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': mono }, w));
    }
    k.push(s('line', { x1: X0, x2: X1, y1: AXY, y2: AXY, stroke: C.muted, 'stroke-width': 2 }),
      s('text', { x: X0 - 10, y: AXY + 20 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end' }, 'weeks'));
    const xs = xw(stop);
    k.push(s('line', { x1: xs, x2: xs, y1: TOP - 20, y2: AXY, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '7 6' }),
      s('text', { x: xs, y: TOP - 24, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, 'stop'));

    NAMES.forEach((name, i) => {
      const y = yr(i), o = obs(i), ok = seen(i), col = ok ? C.cyan : C.pink;
      if (i === sel) k.push(s('rect', { x: 2, y: y - PITCH / 2 + 2, width: VW - 4, height: PITCH - 4, rx: 8, fill: '#ffffff', 'fill-opacity': .05 }));
      k.push(s('text', { x: X0 - 8, y, fill: C.ink, 'font-size': 14 * F, 'text-anchor': 'end', 'dominant-baseline': 'central' }, name));
      for (let b = 0; b < o; b++)
        k.push(s('rect', { x: xw(b) + 1, y: y - BH / 2, width: Math.max(1, ux - 2), height: BH, rx: 2, fill: col, 'fill-opacity': .82 }));
      if (reveal && !ok) for (let b = o; b < t[i]; b++)
        k.push(s('rect', { x: xw(b) + 1.5, y: y - BH / 2 + 1, width: Math.max(1, ux - 3), height: BH - 2, rx: 2, fill: 'none', stroke: C.muted, 'stroke-dasharray': '3 3' }));
      const xe = xw(o);
      if (ok) k.push(s('line', { x1: xe, x2: xe, y1: y - BH / 2 - 4, y2: y + BH / 2 + 4, stroke: C.green, 'stroke-width': 4 }));
      else k.push(s('line', { x1: xe, x2: xe + 13, y1: y, y2: y, stroke: C.pink, 'stroke-width': 3 }),
        s('polygon', { points: `${xe + 20},${y} ${xe + 11},${y - 6} ${xe + 11},${y + 6}`, fill: C.pink }));
      k.push(s('text', { x: VW - 6, y, fill: col, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'end', 'dominant-baseline': 'central', 'font-family': mono }, ok ? o : o + '+'));
    });
    svg.replaceChildren(...k);

    const n = NAMES.length, idx = NAMES.map((_, i) => i), okIdx = idx.filter(seen);
    const sumSeen = okIdx.reduce((a, i) => a + t[i], 0), sumObs = idx.reduce((a, i) => a + obs(i), 0), sumTrue = t.reduce((a, b) => a + b, 0);
    const drop = okIdx.length ? sumSeen / okIdx.length : null, close = sumObs / n, real = sumTrue / n, open = n - okIdx.length;
    const short = idx.map(i => `${NAMES[i]} ${seen(i) ? obs(i) : obs(i) + '+'}`);
    fbox(box, [
      'saved: ' + short.slice(0, 4).join(', '),
      '       ' + short.slice(4).join(', '),
      drop == null ? 'drop open bars:     no closed bar' : `drop open bars:     ${sumSeen} ÷ ${okIdx.length} ${eq(drop)}`,
      `close at last seen: ${sumObs} ÷ ${n} ${eq(close)}`,
      [reveal ? `real mean:          ${sumTrue} ÷ ${n} ${eq(real)}` : 'real mean:          ? (hidden)', C.amber]]);
    note.textContent = (open === 0 ? 'No bar is open: every visit was seen, so nothing is censored.'
      : `${open} open bar${open > 1 ? 's' : ''} (censored): for ${open > 1 ? 'these' : 'this one'} you only know “at least”.`)
      + (reveal ? ' Dashed blocks: the hidden ends. They are made up here; in real life you never see them.' : '');
    revealBtn.textContent = reveal ? 'Hide the hidden ends' : 'Show the hidden ends';
    stopLabel.textContent = `week ${stop}`;
    selLabel.textContent = `Selected: ${NAMES[sel]}, visit at week ${t[sel]}` + (leave[sel] != null ? `, moves away at week ${leave[sel]}` : '');
    chal.update({ open, drop, real, revealed: reveal, newCount });
  }
  draw();
  return () => { dragging = -1; };
}
