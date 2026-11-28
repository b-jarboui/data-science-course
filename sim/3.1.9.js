// 3.1.9 Try it: a running total, row by row.
// The learner drags each sale's amount bar, taps a store to switch it, taps a row to see its window,
// changes the ORDER BY (or removes it), turns PARTITION BY store on and off, makes random data,
// and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const KEYS = [[101, 1], [101, 2], [102, 1], [103, 1], [103, 2], [104, 1]];
  const START_AMT = [20, 20, 15, 20, 30, 25];
  const START_STORE = ['North', 'North', 'South', 'North', 'North', 'South'];
  let amt = START_AMT.slice(), store = START_STORE.slice(), mode = 'time', part = false, sel = 3, anim = 0;

  const svg = s('svg', { viewBox: '0 0 700 400' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const MODES = [['time', 'ORDER BY order, line'], ['big', 'Biggest first'], ['small', 'Smallest first'], ['none', 'No ORDER BY']];
  const modeBtns = MODES.map(([m, label]) => btn(label, () => { mode = m; changed(); }));
  const partBtn = btn('PARTITION BY store: off', () => { part = !part; changed(); });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: the running total'),
    h('p', { class: 'sub' }, 'Each row is one sale. Drag a bar to change its amount, tap a store name to switch the store, and tap a row to see its window (the green rows it adds up).'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−5', () => bump(-5)), btn('+5', () => bump(5)), selLabel),
        h('div', { class: 'sim-row' }, ...modeBtns),
        h('div', { class: 'sim-row' }, partBtn,
          btn('New data (random)', () => {
            amt = amt.map(() => 5 * rnd(1, 10));
            store = store.map(() => (Math.random() < 0.5 ? 'North' : 'South'));
            changed();
          }),
          btn('Start again', () => { amt = START_AMT.slice(); store = START_STORE.slice(); mode = 'time'; part = false; sel = 3; changed(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Drag the amounts so that the last running total is exactly 150.',
      check: st => st.lastRun === 150 && !st.part && st.mode !== 'none',
      why: 'Yes! The last running total always equals the sum of all the amounts.' },
    { text: 'Choose an order so that the first running value is 30.',
      check: st => st.mode !== 'none' && st.runs[0] === 30,
      why: 'Right: the same sales in another order start somewhere else, but the final total stays the same.' },
    { text: 'Remove the ORDER BY (with PARTITION BY off). What does every row show now?',
      check: st => st.mode === 'none' && !st.part,
      why: 'Every row shows the whole total: with no order, each row’s window is the whole table.' },
    { text: 'Turn on PARTITION BY store, then make North and South finish with the same total.',
      check: st => st.part && st.north > 0 && st.north === st.south,
      why: 'Well done: each store has its own running total, which starts again at zero for that store.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const HEAD = 44, RH = 58, VH = HEAD + KEYS.length * RH + 10;
  const KX = NARROW ? 34 : 60, SX = NARROW ? 92 : 165, AX0 = NARROW ? 118 : 230, AX1 = NARROW ? 290 : 500, RX = NARROW ? 352 : 610;
  const MAXA = 50, ux = (AX1 - AX0) / MAXA;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  function order() {
    const ids = KEYS.map((_, i) => i);
    if (mode === 'big') ids.sort((a, b) => amt[b] - amt[a] || a - b);
    if (mode === 'small') ids.sort((a, b) => amt[a] - amt[b] || a - b);
    return ids;
  }
  // window of the row at display position p: earlier rows (or all rows with no ORDER BY), same store if partitioned
  function windows(ord) {
    return ord.map((id, p) => ord.filter((q, j) => (mode === 'none' || j <= p) && (!part || store[q] === store[id])));
  }
  const ypos = order().map((_, p) => HEAD + p * RH);

  function changed() {
    cancelAnimationFrame(anim);
    const step = () => {
      let moving = false;
      order().forEach((id, p) => {
        const t = HEAD + p * RH, d = t - ypos[id];
        if (Math.abs(d) > 0.5) { ypos[id] += d * 0.22; moving = true; } else ypos[id] = t;
      });
      draw();
      if (moving) anim = requestAnimationFrame(step);
    };
    step();
  }
  function bump(d) { amt[sel] = Math.max(5, Math.min(MAXA, amt[sel] + d)); changed(); }

  // pointer: tap a row to select it, tap the store to switch it, drag the bar to set the amount
  let dragging = -1;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const setAmt = (id, x) => { amt[id] = Math.max(5, Math.min(MAXA, Math.round((x - AX0) / ux / 5) * 5)); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), id = KEYS.findIndex((_, i) => p.y >= ypos[i] && p.y < ypos[i] + RH);
    if (id < 0) return;
    sel = id;
    if (Math.abs(p.x - SX) < (NARROW ? 22 : 40)) store[id] = store[id] === 'North' ? 'South' : 'North';
    else if (p.x >= AX0 - 12 && p.x <= AX1 + 40) { dragging = id; svg.setPointerCapture(e.pointerId); setAmt(id, p.x); }
    changed();
  });
  svg.addEventListener('pointermove', e => { if (dragging < 0) return; setAmt(dragging, toSvg(e).x); changed(); });
  const stop = () => { dragging = -1; };
  svg.addEventListener('pointerup', stop);
  svg.addEventListener('pointercancel', stop);

  const label = (x, y, t, fill, anchor = 'middle', size = 15) =>
    s('text', { x, y: y + 5 * F, fill, 'font-size': size * F, 'font-weight': 700, 'text-anchor': anchor, 'font-family': 'Consolas' }, t);

  function draw() {
    const ord = order(), win = windows(ord), runs = win.map(w => w.reduce((a, q) => a + amt[q], 0));
    const pSel = ord.indexOf(sel), inWin = new Set(win[pSel]);
    const k = [];
    [[KX, NARROW ? 'KEY' : 'ORDER · LINE'], [SX, 'STORE'], [(AX0 + AX1) / 2, 'AMOUNT ($)'], [RX, 'RUNNING']]
      .forEach(([x, t]) => k.push(label(x, 24, t, x === RX ? C.amber : C.muted, 'middle', 12)));
    ord.forEach((id, p) => {
      const y = ypos[id], cy = y + RH / 2, col = store[id] === 'North' ? C.cyan : C.pink, w = inWin.has(id);
      k.push(s('rect', { x: 4, y: y + 3, width: VW - 8, height: RH - 6, rx: 8, fill: w ? C.green : '#ffffff', 'fill-opacity': w ? 0.1 : 0.03,
        stroke: id === sel ? C.amber : w ? C.green : 'none', 'stroke-width': id === sel ? 2.5 : 1.2 }));
      k.push(label(KX, cy, `${KEYS[id][0]}·${KEYS[id][1]}`, C.ink));
      k.push(label(SX, cy, NARROW ? store[id][0] : store[id], col));
      k.push(s('rect', { x: AX0, y: cy - 11, width: AX1 - AX0, height: 22, rx: 4, fill: '#ffffff', 'fill-opacity': 0.04 }));
      k.push(s('rect', { x: AX0, y: cy - 11, width: amt[id] * ux, height: 22, rx: 4, fill: col, 'fill-opacity': 0.82 }));
      k.push(label(AX0 + amt[id] * ux + 6, cy, amt[id], col, 'start'));
      k.push(label(RX, cy, runs[p], C.amber, 'middle', 18));
    });
    svg.replaceChildren(...k);

    const ob = { time: '  ORDER BY order, line', big: '  ORDER BY amount DESC', small: '  ORDER BY amount', none: null }[mode];
    const lines = (!ob && !part) ? ['SUM(amount) OVER ()'] : ['SUM(amount) OVER (', ...(part ? [['  PARTITION BY store', C.green]] : []), ...(ob ? [ob] : []), ')'];
    const parts = win[pSel].map(q => amt[q]);
    lines.push([`row ${KEYS[sel][0]}·${KEYS[sel][1]}: ${parts.join(' + ')} = ${runs[pSel]}`, C.amber]);
    lines.push([`rows in = ${KEYS.length}, rows out = ${KEYS.length}`, C.green]);
    fbox(box, lines);

    note.textContent = mode === 'none'
      ? 'No ORDER BY: every window is the whole table' + (part ? ' (for that store), so each row shows its store’s total.' : ', so every row shows the same total.')
      : part ? 'Each store has its own running total. It starts again for each store.'
      : 'The green rows are the window of the selected row: this row and all the rows before it.';
    modeBtns.forEach((b, i) => { b.className = 'sim-btn ' + (MODES[i][0] === mode ? 'go' : ''); });
    partBtn.textContent = `PARTITION BY store: ${part ? 'on' : 'off'}`;
    partBtn.className = 'sim-btn ' + (part ? 'go' : '');
    selLabel.textContent = `Selected: sale ${KEYS[sel][0]}·${KEYS[sel][1]} ($${amt[sel]})`;
    const sum = st => KEYS.reduce((a, _, i) => a + (store[i] === st ? amt[i] : 0), 0);
    chal.update({ runs, lastRun: runs[runs.length - 1], mode, part, north: sum('North'), south: sum('South') });
  }
  draw();
  return () => cancelAnimationFrame(anim);
}
