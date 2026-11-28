// 16.1.7 Try it: equal opportunity and the true positive rate.
// Drag any home's predicted risk, drag the amber rule line (or use the slider),
// tap District or Urgent to switch them, generate random data, and test 4 challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const START = [
    { id: 'A', dist: 'North', risk: 90, urgent: true  },
    { id: 'B', dist: 'North', risk: 10, urgent: false },
    { id: 'C', dist: 'South', risk: 50, urgent: true  },
    { id: 'D', dist: 'South', risk: 30, urgent: true  },
  ];
  const LETTERS = 'ABCDEFGHIJ';
  const clone = list => list.map(x => ({ ...x }));

  let homes = clone(START);
  let threshold = 50;
  let sel = 0;
  let randomCount = 0;

  const svg = s('svg', { viewBox: '0 0 700 420' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const thrVal = h('span', { style: { fontFamily: 'Consolas, monospace', fontWeight: 700, color: C.amber } }, '50%');
  const thrSlider = h('input', {
    type: 'range', min: 5, max: 95, step: 5, value: 50,
    style: { flex: '1 1 160px', accentColor: C.amber },
    oninput: e => { threshold = +e.target.value; draw(); },
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: equal opportunity'),
    h('p', { class: 'sub' },
      'Drag a home’s risk bar, drag the amber rule line, or tap North/South and Urgent/No. Green marks show confirmed urgent homes that join today’s list.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { style: { fontWeight: 650, color: C.amber } }, 'Today’s list rule:'),
          thrSlider, thrVal),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−5%', () => bumpRisk(-5)),
          btn('+5%', () => bumpRisk(5)),
          btn('Toggle urgent', () => { homes[sel].urgent = !homes[sel].urgent; draw(); }),
          btn('Switch district', () => { homes[sel].dist = homes[sel].dist === 'North' ? 'South' : 'North'; draw(); }),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random)', makeRandom, 'go'),
          btn('Add home', addHome),
          btn('Remove home', removeHome),
          btn('Start again', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const r1 = x => Math.round(x * 10) / 10;

  function stats() {
    const g = { North: { u: 0, tp: 0, nu: 0, fp: 0 }, South: { u: 0, tp: 0, nu: 0, fp: 0 } };
    for (const hm of homes) {
      const onList = hm.risk >= threshold;
      const d = g[hm.dist];
      if (hm.urgent) { d.u++; if (onList) d.tp++; }
      else { d.nu++; if (onList) d.fp++; }
    }
    const nTPR = g.North.u ? (g.North.tp / g.North.u) * 100 : null;
    const sTPR = g.South.u ? (g.South.tp / g.South.u) * 100 : null;
    const gap = nTPR !== null && sTPR !== null ? Math.abs(nTPR - sTPR) : null;
    return { g, nTPR, sTPR, gap };
  }

  const chal = challenges(ch, [
    {
      text: 'Lower the rule so every urgent home joins today’s list and the equal-opportunity gap becomes 0.',
      check: st => st.nTPR === 100 && st.sTPR === 100 && st.gap === 0 && st.g.North.u >= 1 && st.g.South.u >= 1,
      why: 'Yes! Lowering the rule to 30% (or below) lets Home D join today’s list too. Both districts reach 100%, so the gap is 0.',
    },
    {
      text: 'Press “Start again”. Change only Home B (the nonurgent home) so it joins today’s list. Watch the gap.',
      check: st => st.homes.length === 4 && st.threshold === 50 && st.homes[1].id === 'B' &&
        !st.homes[1].urgent && st.homes[1].risk >= st.threshold && st.gap === 50,
      why: 'The gap stays at 50 points. Equal opportunity only counts confirmed urgent homes, so it does not reflect false alarms on nonurgent homes.',
    },
    {
      text: 'Make the equal-opportunity gap 0 while both districts still miss at least one urgent home.',
      check: st => st.gap === 0 && st.nTPR !== null && st.sTPR !== null && st.nTPR < 100 && st.sTPR < 100,
      why: 'Right! A gap of 0 only means both groups have the same true positive rate — even if both miss urgent homes equally often.',
    },
    {
      text: 'Press “New data (random)” at least twice, then adjust the rule until the gap is 10 percentage points or less.',
      check: st => st.randomCount >= 2 && st.gap !== null && st.gap <= 10,
      why: 'Well done! With more homes, each change moves the rates more smoothly, and you can test whether the gap holds across datasets.',
    },
  ]);

  function bumpRisk(delta) {
    homes[sel].risk = Math.max(0, Math.min(100, homes[sel].risk + delta));
    draw();
  }

  function addHome() {
    if (homes.length >= 10) return;
    const dist = homes.filter(x => x.dist === 'North').length <= homes.filter(x => x.dist === 'South').length ? 'North' : 'South';
    homes.push({ id: LETTERS[homes.length], dist, risk: rnd(2, 18) * 5, urgent: Math.random() < 0.65 });
    sel = homes.length - 1;
    draw();
  }

  function removeHome() {
    if (homes.length <= 4) return;
    homes.pop();
    sel = Math.min(sel, homes.length - 1);
    draw();
  }

  function makeRandom() {
    randomCount++;
    let best = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const list = [];
      for (let i = 0; i < 8; i++) {
        const dist = i < 4 ? 'North' : 'South';
        const urgent = (i % 4) < 3 ? (i % 4 < 2 ? true : Math.random() < 0.6) : false;
        const risk = urgent ? rnd(4, 19) * 5 : rnd(1, 12) * 5;
        list.push({ id: LETTERS[i], dist, risk, urgent });
      }
      best = list;
      const nU = list.filter(x => x.dist === 'North' && x.urgent);
      const sU = list.filter(x => x.dist === 'South' && x.urgent);
      const nR = nU.filter(x => x.risk >= 50).length / nU.length * 100;
      const sR = sU.filter(x => x.risk >= 50).length / sU.length * 100;
      if (Math.abs(nR - sR) > 12) break;
    }
    homes = best;
    threshold = 50;
    thrSlider.value = '50';
    sel = 0;
    draw();
  }

  function reset() {
    homes = clone(START);
    threshold = 50;
    thrSlider.value = '50';
    sel = 0;
    draw();
  }

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 580;
  const VW = NARROW ? 420 : 700;
  const ROW_H = 38, TOP_Y = 34;
  const COL = NARROW
    ? { id: 14, dX: 28, dW: 48, bX: 84, bW: 148, pct: 252, lX: 274, lW: 42, uX: 322, uW: 52, mk: 398, barX: 74, barW: 322 }
    : { id: 24, dX: 46, dW: 62, bX: 126, bW: 268, pct: 424, lX: 454, lW: 56, uX: 524, uW: 86, mk: 648, barX: 126, barW: 454 };

  const riskToX = r => COL.bX + (r / 100) * COL.bW;
  const xToRisk = x => Math.max(0, Math.min(100, Math.round(((x - COL.bX) / COL.bW) * 20) * 5));

  // Pointer interactions: drag risk bars, drag rule line, or tap District / Urgent badges
  let dragMode = null; // null | 'threshold' | { row }
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    const rowsEnd = TOP_Y + homes.length * ROW_H;
    const tx = riskToX(threshold);

    // Grab the amber threshold handle or line
    if (Math.abs(p.x - tx) <= 12 && p.y >= TOP_Y - 16 && p.y <= rowsEnd + 18) {
      dragMode = 'threshold';
      svg.setPointerCapture(e.pointerId);
      onMove(e);
      return;
    }

    const row = Math.floor((p.y - TOP_Y) / ROW_H);
    if (row < 0 || row >= homes.length) return;
    sel = row;

    if (p.x >= COL.dX && p.x <= COL.dX + COL.dW) {
      homes[row].dist = homes[row].dist === 'North' ? 'South' : 'North';
      draw();
      return;
    }
    if (p.x >= COL.uX && p.x <= COL.uX + COL.uW) {
      homes[row].urgent = !homes[row].urgent;
      draw();
      return;
    }
    if (p.x >= COL.bX - 6 && p.x <= COL.bX + COL.bW + 10) {
      dragMode = { row };
      svg.setPointerCapture(e.pointerId);
      onMove(e);
      return;
    }
    draw();
  });

  function onMove(e) {
    if (!dragMode) return;
    const p = toSvg(e);
    if (dragMode === 'threshold') {
      threshold = Math.max(5, Math.min(95, xToRisk(p.x)));
      thrSlider.value = String(threshold);
      draw();
    } else {
      homes[dragMode.row].risk = xToRisk(p.x);
      draw();
    }
  }
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', () => { dragMode = null; });
  svg.addEventListener('pointercancel', () => { dragMode = null; });

  function draw() {
    const st = stats();
    const { g, nTPR, sTPR, gap } = st;
    const rowsEnd = TOP_Y + homes.length * ROW_H;
    const barsTop = rowsEnd + 46;
    const VH = barsTop + 140;
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
    thrVal.textContent = `${threshold}%`;
    thrSlider.value = String(threshold);

    const k = [];
    const fs = NARROW ? 11 : 13;

    // Column headers
    const hdr = (x, text, col = C.muted, anchor = 'middle') =>
      s('text', { x, y: 20, fill: col, 'font-size': fs, 'font-weight': 700, 'text-anchor': anchor }, text);
    k.push(
      hdr(COL.id, 'ID'),
      hdr(COL.dX + COL.dW / 2, 'District'),
      hdr(COL.bX + COL.bW / 2, 'Predicted risk (drag)'),
      hdr(COL.lX + COL.lW / 2, 'List', C.amber),
      hdr(COL.uX + COL.uW / 2, 'Urgent?', C.pink),
      hdr(COL.mk, NARROW ? '✓' : 'Mark', C.green)
    );

    // Home rows
    homes.forEach((hm, i) => {
      const y = TOP_Y + i * ROW_H, cy = y + ROW_H / 2;
      const dCol = hm.dist === 'North' ? C.cyan : C.violet;
      const onList = hm.risk >= threshold;
      const isTP = hm.urgent && onList;

      k.push(s('rect', {
        x: 4, y: y + 2, width: VW - 8, height: ROW_H - 4, rx: 8,
        fill: i === sel ? '#ffffff' : C.bg, 'fill-opacity': i === sel ? 0.08 : 0.45,
        stroke: i === sel ? dCol : C.line, 'stroke-width': i === sel ? 1.5 : 1,
      }));

      // Home ID
      k.push(s('text', { x: COL.id, y: cy + 5, fill: C.ink, 'font-size': NARROW ? 14 : 15, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, hm.id));

      // District pill (clickable)
      k.push(
        s('rect', { x: COL.dX, y: cy - 11, width: COL.dW, height: 22, rx: 11, fill: dCol, 'fill-opacity': 0.16, stroke: dCol, style: 'cursor:pointer' }),
        s('text', { x: COL.dX + COL.dW / 2, y: cy + 4, fill: dCol, 'font-size': NARROW ? 11 : 12, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas', style: 'pointer-events:none' }, hm.dist)
      );

      // Risk track + fill
      const fw = Math.max(4, (hm.risk / 100) * COL.bW);
      k.push(
        s('rect', { x: COL.bX, y: cy - 9, width: COL.bW, height: 18, rx: 5, fill: C.bg, stroke: C.line }),
        s('rect', { x: COL.bX, y: cy - 9, width: fw, height: 18, rx: 5, fill: dCol, 'fill-opacity': 0.82 }),
        s('circle', { cx: COL.bX + fw, cy, r: 5.5, fill: C.ink, stroke: dCol, 'stroke-width': 2 }),
        s('text', { x: COL.pct, y: cy + 5, fill: dCol, 'font-size': NARROW ? 12 : 13, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${hm.risk}%`)
      );

      // Dispatch decision badge
      k.push(
        s('rect', { x: COL.lX, y: cy - 11, width: COL.lW, height: 22, rx: 11, fill: onList ? C.amber : C.muted, 'fill-opacity': onList ? 0.2 : 0.08, stroke: onList ? C.amber : C.muted }),
        s('text', { x: COL.lX + COL.lW / 2, y: cy + 4, fill: onList ? C.amber : C.muted, 'font-size': NARROW ? 10.5 : 12, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, onList ? 'LIST' : 'OFF')
      );

      // Confirmed urgent pill (clickable)
      const uCol = hm.urgent ? C.pink : C.muted;
      k.push(
        s('rect', { x: COL.uX, y: cy - 11, width: COL.uW, height: 22, rx: 11, fill: uCol, 'fill-opacity': hm.urgent ? 0.2 : 0.08, stroke: uCol, style: 'cursor:pointer' }),
        s('text', { x: COL.uX + COL.uW / 2, y: cy + 4, fill: uCol, 'font-size': NARROW ? 10.5 : 12, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas', style: 'pointer-events:none' }, hm.urgent ? (NARROW ? 'URG' : 'URGENT') : 'NO')
      );

      // Green mark for confirmed urgent on list; muted dash for missed urgent
      if (isTP) {
        k.push(
          s('circle', { cx: COL.mk, cy, r: 10, fill: C.green }),
          s('path', { d: `M ${COL.mk - 4.5} ${cy} L ${COL.mk - 1} ${cy + 3.5} L ${COL.mk + 5} ${cy - 4}`, fill: 'none', stroke: C.bg, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
        );
      } else if (hm.urgent) {
        k.push(
          s('circle', { cx: COL.mk, cy, r: 10, fill: C.pink, 'fill-opacity': 0.12, stroke: C.pink, 'stroke-dasharray': '3 2' }),
          s('line', { x1: COL.mk - 4, y1: cy, x2: COL.mk + 4, y2: cy, stroke: C.pink, 'stroke-width': 2 })
        );
      } else {
        k.push(s('text', { x: COL.mk, y: cy + 4, fill: C.muted, 'font-size': 12, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '·'));
      }
    });

    // Draggable amber threshold line across all risk strips
    const tx = riskToX(threshold);
    k.push(
      s('line', { x1: tx, x2: tx, y1: TOP_Y - 6, y2: rowsEnd + 6, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '6 5' }),
      s('rect', { x: tx - 26, y: rowsEnd + 6, width: 52, height: 20, rx: 10, fill: C.bg, stroke: C.amber, style: 'cursor:ew-resize' }),
      s('text', { x: tx, y: rowsEnd + 20, fill: C.amber, 'font-size': 12, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas', style: 'pointer-events:none' }, `${threshold}%`)
    );

    // Lower section: True positive rate bars & Equal-opportunity gap
    const bx = pct => COL.barX + (pct / 100) * COL.barW;
    k.push(s('text', { x: COL.barX, y: barsTop - 6, fill: C.ink, 'font-size': NARROW ? 13 : 14, 'font-weight': 700 }, 'True positive rate (urgent homes on today’s list)'));

    for (const v of [0, 50, 100]) {
      const gx = bx(v);
      k.push(
        s('line', { x1: gx, x2: gx, y1: barsTop + 6, y2: barsTop + 94, stroke: C.line, 'stroke-dasharray': v === 0 ? null : '4 4' }),
        s('text', { x: gx, y: barsTop + 110, fill: C.muted, 'font-size': 12, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${v}%`)
      );
    }

    const drawRateBar = (label, col, y, rate, tp, u) => {
      k.push(s('text', { x: COL.barX - 10, y: y + 21, fill: col, 'font-size': NARROW ? 13 : 14, 'font-weight': 700, 'text-anchor': 'end' }, label));
      k.push(s('rect', { x: COL.barX, y, width: COL.barW, height: 30, rx: 6, fill: C.bg, stroke: C.line }));
      if (rate !== null) {
        const w = Math.max(2, (rate / 100) * COL.barW);
        k.push(s('rect', { x: COL.barX, y, width: w, height: 30, rx: 6, fill: col, 'fill-opacity': 0.85 }));
        const txt = `${tp}/${u} = ${fmt(r1(rate))}%`;
        const inside = w > (NARROW ? 84 : 102);
        k.push(s('text', {
          x: inside ? COL.barX + w - 8 : COL.barX + w + 8, y: y + 20,
          fill: inside ? C.bg : col, 'font-size': NARROW ? 12 : 13, 'font-weight': 700,
          'text-anchor': inside ? 'end' : 'start', 'font-family': 'Consolas',
        }, txt));
      } else {
        k.push(s('text', { x: COL.barX + 10, y: y + 20, fill: C.muted, 'font-size': 12, 'font-family': 'Consolas' }, 'no urgent homes'));
      }
    };

    const yN = barsTop + 10, yS = barsTop + 54;
    drawRateBar('North', C.cyan, yN, nTPR, g.North.tp, g.North.u);
    drawRateBar('South', C.violet, yS, sTPR, g.South.tp, g.South.u);

    // Gap bracket between bar ends
    if (gap !== null) {
      const lo = Math.min(nTPR, sTPR), hi = Math.max(nTPR, sTPR);
      const xLo = bx(lo), xHi = bx(hi);
      const gapCol = gap === 0 ? C.green : C.amber;
      const lowerY = nTPR >= sTPR ? yS : yN;
      if (gap > 0) {
        k.push(
          s('rect', { x: xLo, y: lowerY, width: xHi - xLo, height: 30, rx: 4, fill: C.amber, 'fill-opacity': 0.16 }),
          s('line', { x1: xHi, x2: xHi, y1: yN, y2: yS + 30, stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '5 4' }),
          s('line', { x1: xLo + 2, x2: xHi - 2, y1: lowerY + 15, y2: lowerY + 15, stroke: C.amber, 'stroke-width': 2.5 }),
          s('line', { x1: xLo + 2, x2: xLo + 2, y1: lowerY + 8, y2: lowerY + 22, stroke: C.amber, 'stroke-width': 2.5 }),
          s('line', { x1: xHi - 2, x2: xHi - 2, y1: lowerY + 8, y2: lowerY + 22, stroke: C.amber, 'stroke-width': 2.5 })
        );
      }
      const gxMid = Math.max(COL.barX + 54, Math.min(COL.barX + COL.barW - 54, (xLo + xHi) / 2));
      const gyTag = barsTop + 42;
      k.push(
        s('rect', { x: gxMid - 52, y: gyTag - 11, width: 104, height: 22, rx: 11, fill: C.bg, stroke: gapCol, 'stroke-width': 1.8 }),
        s('text', { x: gxMid, y: gyTag + 4, fill: gapCol, 'font-size': 12, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          gap === 0 ? 'GAP = 0 ✓' : `GAP ${fmt(r1(gap))} pts`)
      );
    }

    // Nonurgent footer note inside SVG
    k.push(s('text', { x: COL.barX, y: barsTop + 132, fill: C.muted, 'font-size': NARROW ? 11 : 12, 'font-family': 'Consolas' },
      `Nonurgent on list: North ${g.North.fp}/${g.North.nu} · South ${g.South.fp}/${g.South.nu}`));

    svg.replaceChildren(...k);

    // Live formula box
    const nLine = nTPR === null ? 'North TPR = — (0 urgent)' : `North TPR = ${g.North.tp} ÷ ${g.North.u} × 100 = ${fmt(r1(nTPR))}%`;
    const sLine = sTPR === null ? 'South TPR = — (0 urgent)' : `South TPR = ${g.South.tp} ÷ ${g.South.u} × 100 = ${fmt(r1(sTPR))}%`;
    const gapLine = gap === null
      ? ['Gap       = need urgent in both', C.muted]
      : [`Gap       = ${fmt(r1(Math.max(nTPR, sTPR)))}% − ${fmt(r1(Math.min(nTPR, sTPR)))}% = ${fmt(r1(gap))} pts`, gap === 0 ? C.green : C.amber];
    fbox(box, [
      [`Rule: risk ≥ ${threshold}%`, C.amber],
      [nLine, C.cyan],
      [sLine, C.violet],
      gapLine,
    ]);

    // Contextual plain-English note
    if (gap === null) {
      note.textContent = 'Each district needs at least one confirmed urgent home to compare true positive rates.';
    } else if (gap === 0 && nTPR === 100) {
      note.textContent = 'Gap is 0: every confirmed urgent home in both districts joins today’s list.';
    } else if (gap === 0) {
      note.textContent = `Gap is 0 (${fmt(r1(nTPR))}% in both districts), even though some urgent homes are missed. Equal rates alone do not mean every urgent home gets help.`;
    } else if (g.North.fp + g.South.fp > 0) {
      note.textContent = `Notice that ${g.North.fp + g.South.fp} nonurgent home(s) joined today’s list, but the equal-opportunity gap only counts confirmed urgent homes.`;
    } else {
      const lower = nTPR < sTPR ? 'North' : 'South';
      note.textContent = `${lower} has the lower true positive rate, missing more urgent homes by ${fmt(r1(gap))} percentage points.`;
    }

    const cur = homes[sel];
    selLabel.textContent = `Selected: Home ${cur.id} (${cur.dist}, ${cur.risk}%, ${cur.urgent ? 'urgent' : 'not urgent'})`;

    chal.update({ homes, threshold, g, nTPR, sTPR, gap: gap === null ? null : r1(gap), randomCount });
  }

  draw();
  return () => {};
}
