// 1.2.3 Try it: cumulative frequency and cumulative share.
// The learner drags wait-time dot stacks (1 to 6 min), drags the amber limit line,
// generates random shifts, and solves 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const MORNING = [1, 2, 3, 1, 0, 1]; // 1..6 min (8 customers, 6 within 3 min = 75%)
  const EVENING = [0, 1, 3, 1, 1, 2]; // 1..6+ min (8 customers, 4 within 3 min = 50%)

  let counts = MORNING.slice();
  let limit = 3; // 1..6
  let sel = 2; // selected column 0..5 (default: 3 min)
  let eveningMode = false;
  let flatSeen = new Set();

  const svg = s('svg', { viewBox: '0 0 700 460' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: counting up to a limit'),
    h('p', { class: 'sub' }, 'Each dot is one customer’s wait. Drag a column up or down to change the counts, and drag the amber limit line left or right.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Limit −1', () => setLimit(limit - 1)),
          btn('Limit +1', () => setLimit(limit + 1)),
          btn('−1 customer', () => bump(-1)),
          btn('+1 customer', () => bump(1)),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('New shift (random)', () => {
            counts = Array.from({ length: 6 }, () => rnd(0, 5));
            if (counts.reduce((a, b) => a + b, 0) < 4) counts[rnd(0, 5)] += 4;
            eveningMode = false; flatSeen.clear(); draw();
          }, 'go'),
          btn('Evening shift', () => {
            counts = EVENING.slice(); limit = 3; eveningMode = true; flatSeen.clear(); draw();
          }),
          btn('Start again', () => {
            counts = MORNING.slice(); limit = 3; sel = 2; eveningMode = false; flatSeen.clear(); draw();
          }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.2 : 1;
  const X0 = NARROW ? 36 : 54, X1 = VW - 16;
  const DOT_BASE = 228, DOT_TOP = 44, MAX_COL = 8;
  const CUM_TOP = 326, CUM_BASE = 428;
  svg.setAttribute('viewBox', `0 0 ${VW} 460`);

  const sl = () => (X1 - X0) / 6;
  const colX = i => X0 + sl() * (i + 0.5);
  const limX = () => X0 + sl() * limit;
  const tickLabel = i => (eveningMode && i === 5) ? '6+' : String(i + 1);

  const chal = challenges(ch, [
    { text: 'Keep the morning shift and move the limit to 4 minutes.',
      check: st => st.isMorning && st.limit === 4,
      why: 'Yes! Up to 4 minutes adds 1 + 2 + 3 + 1 = 7 of 8 customers (87.5%).' },
    { text: 'With the limit at 3 minutes, change the counts so the cumulative share is exactly 50%.',
      check: st => st.limit === 3 && st.total >= 4 && st.cum * 2 === st.total,
      why: 'Right: half the customers are within 3 minutes, so running count divided by total is 50%.' },
    { text: 'Set 5 minutes to 0 customers, then move the limit to both 4 and 5 minutes.',
      check: st => st.flatChecked,
      why: 'The running count stayed flat at 5 minutes. Cumulative frequency rises or stays flat; it never goes down.' },
    { text: 'Build a bigger shift (12+ customers) with more than 6 on time (≤ 3 min), yet a share of 50% or less.',
      check: st => st.limit === 3 && st.total >= 12 && st.cum > 6 && st.cum * 2 <= st.total,
      why: 'Spot on! A bigger count can still be a smaller share — always compare cumulative shares across different group sizes.' },
  ]);

  function setLimit(v) {
    limit = Math.max(1, Math.min(6, v));
    draw();
  }
  function bump(d) {
    const next = Math.max(0, Math.min(MAX_COL, counts[sel] + d));
    const totalNow = counts.reduce((a, b) => a + b, 0);
    if (next === 0 && totalNow - counts[sel] === 0) return; // keep at least 1 customer
    counts[sel] = next;
    eveningMode = false;
    flatSeen.clear();
    draw();
  }

  // pointer interaction: drag limit line horizontally, or drag a dot stack vertically
  let mode = ''; // 'limit' | 'col'
  let dragCol = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y >= 285 || Math.abs(p.x - limX()) < 22) {
      mode = 'limit';
      svg.setPointerCapture(e.pointerId);
      move(e);
      return;
    }
    const i = Math.floor((p.x - X0) / sl());
    if (i < 0 || i > 5) return;
    mode = 'col'; sel = i; dragCol = i;
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (!mode) return;
    const p = toSvg(e);
    if (mode === 'limit') {
      const idx = Math.max(1, Math.min(6, Math.round((p.x - X0) / sl())));
      if (idx !== limit) { limit = idx; draw(); }
      return;
    }
    const dy = (DOT_BASE - DOT_TOP) / MAX_COL;
    const val = Math.max(0, Math.min(MAX_COL, Math.round((DOT_BASE - p.y) / dy)));
    const other = counts.reduce((a, b, i) => a + (i === dragCol ? 0 : b), 0);
    const clamped = other === 0 ? Math.max(1, val) : val;
    if (clamped !== counts[dragCol]) {
      counts[dragCol] = clamped;
      eveningMode = false;
      flatSeen.clear();
      draw();
    }
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { mode = ''; dragCol = -1; });
  svg.addEventListener('pointercancel', () => { mode = ''; dragCol = -1; });

  function draw() {
    const cum = [];
    let run = 0;
    for (let i = 0; i < 6; i++) { run += counts[i]; cum.push(run); }
    const total = run;
    const within = cum[limit - 1];
    const pct = total ? (within / total) * 100 : 0;
    const pctStr = fmt(Math.round(pct * 10) / 10) + '%';

    if (counts[4] === 0 && total > 0 && (limit === 4 || limit === 5)) flatSeen.add(limit);
    else if (counts[4] !== 0) flatSeen.clear();

    const k = [];
    const sWidth = sl();
    const dy = (DOT_BASE - DOT_TOP) / MAX_COL;
    const lx = limX();

    // shaded "within limit" zone behind dots
    k.push(s('rect', { x: X0, y: DOT_TOP - 8, width: Math.max(0, lx - X0), height: DOT_BASE - DOT_TOP + 8, fill: C.cyan, 'fill-opacity': 0.08, rx: 6 }));

    // subtle horizontal guides for dotplot
    k.push(s('line', { x1: X0, x2: X1, y1: DOT_BASE, y2: DOT_BASE, stroke: C.muted, 'stroke-width': 2 }));

    // selected column highlight + dots + labels
    const dotR = NARROW ? 7.5 : 8.8;
    for (let i = 0; i < 6; i++) {
      const cx = colX(i);
      const onTime = i < limit;
      const col = onTime ? C.cyan : C.pink;
      if (i === sel) {
        k.push(s('rect', { x: cx - sWidth / 2 + 4, y: DOT_TOP - 6, width: sWidth - 8, height: DOT_BASE - DOT_TOP + 6, fill: '#ffffff', 'fill-opacity': 0.05, rx: 8 }));
      }
      for (let j = 0; j < counts[i]; j++) {
        const cy = DOT_BASE - (j + 0.55) * dy;
        k.push(
          s('circle', { cx, cy, r: dotR * 1.65, fill: col, 'fill-opacity': 0.18 }),
          s('circle', { cx, cy, r: dotR, fill: col })
        );
      }
      if (counts[i] === 0) {
        k.push(s('text', { x: cx, y: DOT_BASE - 10, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '0'));
      }
      // minute tick + frequency count
      k.push(
        s('line', { x1: cx, x2: cx, y1: DOT_BASE - 4, y2: DOT_BASE + 5, stroke: C.muted }),
        s('text', { x: cx, y: DOT_BASE + 22, fill: C.ink, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, tickLabel(i)),
        s('text', { x: cx, y: DOT_BASE + 42, fill: col, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, counts[i])
      );
    }
    k.push(
      s('text', { x: X0 - 6, y: DOT_BASE + 22, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'min'),
      s('text', { x: X0 - 6, y: DOT_BASE + 42, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'freq')
    );

    // amber limit line + draggable top handle
    const handleW = (NARROW ? 82 : 96) * F;
    const hx = Math.max(X0 + handleW / 2, Math.min(X1 - handleW / 2, lx));
    k.push(
      s('line', { x1: lx, x2: lx, y1: DOT_TOP - 8, y2: CUM_BASE, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '8 6' }),
      s('rect', { x: hx - handleW / 2, y: 6, width: handleW, height: 26, rx: 13, fill: C.bg, stroke: C.amber, 'stroke-width': 2 }),
      s('text', { x: hx, y: 23, fill: C.amber, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `≤ ${tickLabel(limit - 1)} MIN`)
    );

    // bottom panel: cumulative frequency step-line
    const maxCum = Math.max(8, total);
    const cyOf = v => CUM_BASE - (v / maxCum) * (CUM_BASE - CUM_TOP);
    k.push(
      s('text', { x: X0, y: CUM_TOP - 16, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Consolas' }, 'CUMULATIVE FREQUENCY (RUNNING COUNT)'),
      s('line', { x1: X0, x2: X1, y1: CUM_BASE, y2: CUM_BASE, stroke: C.line, 'stroke-width': 2 }),
      s('line', { x1: X0, x2: X1, y1: CUM_TOP, y2: CUM_TOP, stroke: C.line, 'stroke-dasharray': '4 4' }),
      s('text', { x: X0 - 6, y: CUM_BASE + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, '0'),
      s('text', { x: X0 - 6, y: CUM_TOP + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, maxCum)
    );

    for (let i = 1; i < 6; i++) {
      const flat = counts[i] === 0;
      const segCol = flat ? C.violet : (i < limit ? C.amber : C.muted);
      k.push(s('line', {
        x1: colX(i - 1), y1: cyOf(cum[i - 1]), x2: colX(i), y2: cyOf(cum[i]),
        stroke: segCol, 'stroke-width': flat || i < limit ? 3.5 : 2
      }));
    }
    for (let i = 0; i < 6; i++) {
      const cx = colX(i), cy = cyOf(cum[i]);
      const active = i === limit - 1;
      const flat = i > 0 && counts[i] === 0;
      const ptCol = active ? C.amber : flat ? C.violet : (i < limit ? C.green : C.muted);
      if (active) k.push(s('circle', { cx, cy, r: 12, fill: C.amber, 'fill-opacity': 0.22 }));
      k.push(
        s('circle', { cx, cy, r: active ? 6.5 : 5, fill: ptCol }),
        s('text', { x: cx, y: cy - 11, fill: ptCol, 'font-size': (active ? 14 : 12) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, cum[i])
      );
    }

    svg.replaceChildren(...k);

    const addStr = counts.slice(0, limit).join(' + ');
    fbox(box, [
      [`limit            = ≤ ${tickLabel(limit - 1)} min`, C.amber],
      `running count    = ${addStr} = ${within}`,
      `total customers  = ${total}`,
      [`cumulative share = ${within} ÷ ${total} = ${pctStr}`, C.green]
    ]);
    note.textContent = counts[limit - 1] === 0 && limit > 1
      ? `Nobody waited ${tickLabel(limit - 1)} minutes, so the running count stayed flat at ${within}.`
      : `${within} of ${total} customers waited ${tickLabel(limit - 1)} minutes or less (${pctStr}).`;
    selLabel.textContent = `Selected: ${tickLabel(sel)} min (${counts[sel]})`;

    chal.update({
      isMorning: !eveningMode && counts.join() === MORNING.join(),
      limit,
      total,
      cum: within,
      flatChecked: flatSeen.has(4) && flatSeen.has(5)
    });
  }

  draw();
  return () => {};
}
