// 12.4.11 Try it: Cost-sensitive thresholds.
// Move the alert threshold and mistake costs, tap pump cards to flip outcomes,
// compare all five piles of cost blocks with the expected-cost crossover, and solve challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;

  const BLUE = '#58A6FF';
  const RED = '#F87171';
  const GREEN = C.green;
  const AMBER = C.amber;

  const START_PUMPS = [
    { id: 'P1',  prob: 90, failed: false },
    { id: 'P2',  prob: 60, failed: true  },
    { id: 'P3',  prob: 60, failed: false },
    { id: 'P4',  prob: 30, failed: true  },
    { id: 'P5',  prob: 30, failed: false },
    { id: 'P6',  prob: 30, failed: false },
    { id: 'P7',  prob: 10, failed: false },
    { id: 'P8',  prob: 10, failed: false },
    { id: 'P9',  prob: 10, failed: false },
    { id: 'P10', prob: 10, failed: false },
    { id: 'P11', prob: 10, failed: false },
    { id: 'P12', prob: 10, failed: false },
  ];
  const PILE_CUTS = [100, 90, 60, 30, 10];

  let pumps = START_PUMPS.map(p => ({ ...p }));
  let thr = 60;
  let cFN = 4;
  let cFP = 1;
  let custom = false;
  let randomCount = 0;

  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  const thrVal = h('strong', { style: { color: C.cyan, fontFamily: 'Consolas, monospace' } }, '60%');
  const fnVal = h('strong', { style: { color: RED, fontFamily: 'Consolas, monospace' } }, '4');
  const fpVal = h('strong', { style: { color: AMBER, fontFamily: 'Consolas, monospace' } }, '1');

  const thrInput = h('input', {
    type: 'range', min: '0', max: '100', step: '1', value: String(thr),
    style: { flex: '1 1 140px', accentColor: C.cyan },
    oninput: e => { thr = +e.target.value; draw(); },
  });
  const fnInput = h('input', {
    type: 'range', min: '1', max: '10', step: '1', value: String(cFN),
    style: { flex: '1 1 110px', accentColor: RED },
    oninput: e => { cFN = +e.target.value; draw(); },
  });
  const fpInput = h('input', {
    type: 'range', min: '1', max: '6', step: '1', value: String(cFP),
    style: { flex: '1 1 110px', accentColor: AMBER },
    oninput: e => { cFP = +e.target.value; draw(); },
  });

  function setThr(v) {
    thr = Math.max(0, Math.min(100, Math.round(v)));
    thrInput.value = String(thr);
    draw();
  }

  function newData() {
    const probs = [90, 60, 60, 30, 30, 30, 10, 10, 10, 10, 10, 10];
    // Generate realistic varied probabilities and sample failures from them
    const choices = [90, 80, 60, 50, 30, 20, 10];
    const picked = Array.from({ length: 12 }, (_, i) => i < 6 ? probs[i] : choices[rnd(3, 6)])
      .map(p => Math.random() < 0.35 ? choices[rnd(0, 6)] : p)
      .sort((a, b) => b - a);
    pumps = picked.map((prob, i) => ({
      id: `P${i + 1}`,
      prob,
      failed: Math.random() * 100 < prob,
    }));
    // Ensure at least one failure and one safe pump so mistakes are visible
    if (!pumps.some(p => p.failed)) pumps[0].failed = true;
    if (pumps.every(p => p.failed)) pumps[11].failed = false;
    custom = true;
    randomCount++;
    draw();
  }

  function resetAll() {
    pumps = START_PUMPS.map(p => ({ ...p }));
    thr = 60; cFN = 4; cFP = 1; custom = false;
    thrInput.value = String(thr);
    fnInput.value = String(cFN);
    fpInput.value = String(cFP);
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: Cost-sensitive thresholds'),
    h('p', { class: 'sub' },
      'Move the alert threshold and mistake costs, or tap any pump card to flip whether it actually failed (red diamond = failed, green circle = safe, amber bell = alert).'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { style: { minWidth: '125px' } }, 'Alert threshold: ', thrVal),
          thrInput,
        ),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { style: { minWidth: '125px' } }, 'Missed fail cost: ', fnVal),
          fnInput,
          h('span', { style: { minWidth: '125px' } }, 'False alarm cost: ', fpVal),
          fpInput,
        ),
        h('div', { class: 'sim-row' },
          ...PILE_CUTS.map(v => btn(`${v}%`, () => setThr(v))),
          btn('Use formula cutoff', () => setThr(100 * cFP / (cFP + cFN)), 'go'),
        ),
        h('div', { class: 'sim-row' },
          btn('New 12 pumps (random)', newData),
          btn('Start again', resetAll),
        ),
      ),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch),
      ),
    ),
  ));

  const chal = challenges(ch, [
    {
      text: 'With the original 12 pumps (missed = 4, false alarm = 1), move the threshold to reach the lowest possible total cost (4).',
      check: st => !st.custom && st.cFN === 4 && st.cFP === 1 && st.cost === 4,
      why: 'Yes! Any threshold from 11% to 30% catches both failures with 4 false alarms, giving the smallest pile of 4 blocks.',
    },
    {
      text: 'Make missing a failure much more costly: set missed failure cost to 9 (with false alarm cost 1). Watch the formula cutoff move!',
      check: st => st.cFN === 9 && st.cFP === 1,
      why: 'Right: 1 ÷ (1 + 9) = 10%. When missing a failure costs more, you should raise alerts at lower failure chances.',
    },
    {
      text: 'Set both mistake costs equal (for example, 3 and 3). What does the formula cutoff become?',
      check: st => st.cFN === st.cFP && st.cFN > 0,
      why: 'Exactly 50%! When both mistakes carry the same cost, you alert whenever failure is at least as likely as no failure.',
    },
    {
      text: 'Press “New 12 pumps (random)” twice and look at which pile is smallest each time. Does it stay fixed?',
      check: st => st.randomCount >= 2,
      why: 'Often it moves! Twelve pumps is a small sample, so random outcomes can shift which threshold wins on one small group.',
    },
  ]);

  function evaluate(cut) {
    let tp = 0, fp = 0, fn = 0, tn = 0;
    for (const p of pumps) {
      const alerted = p.prob >= cut;
      if (alerted && p.failed) tp++;
      else if (alerted && !p.failed) fp++;
      else if (!alerted && p.failed) fn++;
      else tn++;
    }
    return { tp, fp, fn, tn, cost: fn * cFN + fp * cFP, alerts: tp + fp };
  }

  function svgPump(cx, cy, sc) {
    return s('g', { stroke: C.cyan, 'stroke-width': 1.5, fill: 'none' },
      s('rect', { x: cx - 18 * sc, y: cy - 8 * sc, width: 20 * sc, height: 14 * sc, rx: 3 * sc, fill: C.cyan, 'fill-opacity': 0.16 }),
      s('circle', { cx: cx + 9 * sc, cy: cy - 1 * sc, r: 9 * sc, fill: C.cyan, 'fill-opacity': 0.14 }),
      s('rect', { x: cx + 6 * sc, y: cy - 15 * sc, width: 6 * sc, height: 7 * sc, fill: C.cyan, 'fill-opacity': 0.2 }),
      s('rect', { x: cx + 17 * sc, y: cy - 4 * sc, width: 7 * sc, height: 6 * sc, fill: C.cyan, 'fill-opacity': 0.2 }),
      s('circle', { cx: cx + 9 * sc, cy: cy - 1 * sc, r: 2 * sc, fill: C.cyan }),
    );
  }

  function svgBell(cx, cy, sc) {
    return s('g', { stroke: AMBER, 'stroke-width': 1.8, fill: 'none' },
      s('path', { d: `M ${cx - 5 * sc} ${cy + 2 * sc} Q ${cx - 5 * sc} ${cy - 6 * sc} ${cx} ${cy - 6 * sc} Q ${cx + 5 * sc} ${cy - 6 * sc} ${cx + 5 * sc} ${cy + 2 * sc} L ${cx + 7 * sc} ${cy + 5 * sc} L ${cx - 7 * sc} ${cy + 5 * sc} Z`, fill: AMBER, 'fill-opacity': 0.25 }),
      s('circle', { cx, cy: cy + 7 * sc, r: 1.8 * sc, fill: AMBER }),
    );
  }

  function draw() {
    const NARROW = (root.clientWidth || innerWidth) < 600;
    const VW = NARROW ? 420 : 700;
    const VH = NARROW ? 650 : 470;
    svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

    thrVal.textContent = `${thr}%`;
    fnVal.textContent = String(cFN);
    fpVal.textContent = String(cFP);

    const cur = evaluate(thr);
    const theoPct = 100 * cFP / (cFP + cFN);
    const piles = PILE_CUTS.map(cut => ({ cut, ...evaluate(cut) }));
    const minPileCost = Math.min(...piles.map(p => p.cost));

    const k = [];

    // 1. Pump cards (6x2 on laptop, 4x3 on phone) — tap to flip outcome
    const cols = NARROW ? 4 : 6;
    const rows = NARROW ? 3 : 2;
    const padX = NARROW ? 10 : 14;
    const gapX = NARROW ? 8 : 10;
    const gapY = NARROW ? 8 : 10;
    const cw = (VW - padX * 2 - gapX * (cols - 1)) / cols;
    const chCard = NARROW ? 82 : 84;
    const topY = 10;

    pumps.forEach((p, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = padX + col * (cw + gapX);
      const y = topY + row * (chCard + gapY);
      const alerted = p.prob >= thr;
      const isMistake = (alerted && !p.failed) || (!alerted && p.failed);
      const g = s('g', { style: 'cursor:pointer' });
      g.addEventListener('click', () => {
        pumps[i].failed = !pumps[i].failed;
        custom = true;
        draw();
      });

      g.append(
        s('rect', {
          x, y, width: cw, height: chCard, rx: 9,
          fill: isMistake ? (p.failed ? '#2a1220' : '#241e12') : C.bg,
          stroke: alerted ? AMBER : C.line,
          'stroke-width': alerted ? 2.4 : 1.5,
        }),
        s('text', { x: x + 9, y: y + 19, fill: C.ink, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas' }, p.id),
        svgPump(x + cw * 0.36, y + 40, NARROW ? 0.72 : 0.78),
        s('line', { x1: x + 8, x2: x + cw - 8, y1: y + 57, y2: y + 57, stroke: C.line, 'stroke-width': 1 }),
        s('text', { x: x + cw / 2, y: y + 74, fill: BLUE, 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${p.prob}%`),
      );

      // Outcome mark: red filled diamond or green outlined circle
      const ox = x + cw - 18, oy = y + 41;
      if (p.failed) {
        g.append(s('polygon', {
          points: `${ox},${oy - 8} ${ox + 8},${oy} ${ox},${oy + 8} ${ox - 8},${oy}`,
          fill: RED, stroke: RED, 'stroke-width': 1.2,
        }));
      } else {
        g.append(s('circle', { cx: ox, cy: oy, r: 7, fill: 'none', stroke: GREEN, 'stroke-width': 2.2 }));
      }
      if (alerted) g.append(svgBell(x + cw - 18, y + 17, 0.92));

      k.push(g);
    });

    // 2. Five cost-block piles (tappable to jump to that cutoff)
    const pX0 = NARROW ? 28 : 34;
    const pX1 = NARROW ? VW - 16 : 395;
    const pTop = NARROW ? 305 : 228;
    const pBase = NARROW ? 452 : 422;
    const pW = pX1 - pX0;

    k.push(
      s('text', { x: pX0, y: pTop - 12, fill: C.muted, 'font-size': 13, 'font-family': 'Consolas' }, 'COST BLOCKS AT 5 THRESHOLDS (TAP A PILE)'),
      s('line', { x1: pX0, x2: pX1, y1: pBase, y2: pBase, stroke: C.muted, 'stroke-width': 2 }),
    );

    const maxCost = Math.max(10, cur.cost, ...piles.map(p => p.cost));
    const unitH = (pBase - pTop - 18) / maxCost;
    const slotW = pW / piles.length;
    const bw = Math.min(48, slotW * 0.62);

    piles.forEach((p, idx) => {
      const cx = pX0 + slotW * (idx + 0.5);
      const isSel = thr === p.cut;
      const isBest = p.cost === minPileCost;
      const pg = s('g', { style: 'cursor:pointer' });
      pg.addEventListener('click', () => setThr(p.cut));

      pg.append(s('rect', {
        x: cx - slotW / 2 + 3, y: pTop - 4, width: slotW - 6, height: pBase - pTop + 34, rx: 8,
        fill: isSel ? C.cyan : (isBest ? GREEN : '#ffffff'),
        'fill-opacity': isSel ? 0.10 : (isBest ? 0.06 : 0.01),
        stroke: isSel ? C.cyan : (isBest ? GREEN : 'none'),
        'stroke-width': isSel ? 1.8 : 1.2,
      }));

      const redBlocks = p.fn * cFN;
      const ambBlocks = p.fp * cFP;
      const totalB = redBlocks + ambBlocks;
      const drawIndividual = totalB <= 22;

      if (drawIndividual) {
        for (let b = 0; b < totalB; b++) {
          const col = b < redBlocks ? RED : AMBER;
          const bh = Math.max(2, unitH - 1.5);
          pg.append(s('rect', {
            x: cx - bw / 2, y: pBase - (b + 1) * unitH + 0.75, width: bw, height: bh, rx: 1.5,
            fill: col, 'fill-opacity': 0.86,
          }));
        }
      } else {
        if (redBlocks > 0) {
          pg.append(s('rect', {
            x: cx - bw / 2, y: pBase - redBlocks * unitH, width: bw, height: redBlocks * unitH, rx: 2,
            fill: RED, 'fill-opacity': 0.82,
          }));
        }
        if (ambBlocks > 0) {
          pg.append(s('rect', {
            x: cx - bw / 2, y: pBase - totalB * unitH, width: bw, height: ambBlocks * unitH, rx: 2,
            fill: AMBER, 'fill-opacity': 0.82,
          }));
        }
      }

      pg.append(
        s('text', {
          x: cx, y: pBase - totalB * unitH - 6, fill: isBest ? GREEN : C.ink,
          'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas',
        }, String(p.cost)),
        s('text', {
          x: cx, y: pBase + 19, fill: isSel ? C.cyan : C.muted,
          'font-size': 13, 'font-weight': isSel ? 700 : 400, 'text-anchor': 'middle', 'font-family': 'Consolas',
        }, `${p.cut}%`),
      );
      k.push(pg);
    });

    // 3. Expected-cost crossover graph (theoretical cutoff vs current slider)
    const gX0 = NARROW ? 46 : 450;
    const gX1 = NARROW ? VW - 20 : 680;
    const gY0 = NARROW ? 605 : 422;
    const gY1 = NARROW ? 505 : 228;
    const maxExp = Math.max(cFN, cFP);
    const gx = p => gX0 + (p / 100) * (gX1 - gX0);
    const gy = c => gY0 - (c / maxExp) * (gY0 - gY1);

    k.push(
      s('text', { x: gX0, y: gY1 - 12, fill: C.muted, 'font-size': 13, 'font-family': 'Consolas' }, 'EXPECTED COST PER PUMP'),
      s('line', { x1: gX0, x2: gX1, y1: gY0, y2: gY0, stroke: C.muted, 'stroke-width': 1.8 }),
      s('line', { x1: gX0, x2: gX0, y1: gY0, y2: gY1, stroke: C.muted, 'stroke-width': 1.8 }),
    );
    [0, 50, 100].forEach(v => {
      k.push(s('text', { x: gx(v), y: gY0 + 18, fill: C.muted, 'font-size': 12, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${v}%`));
    });
    [0, maxExp].forEach(v => {
      k.push(s('text', { x: gX0 - 7, y: gy(v) + 4, fill: C.muted, 'font-size': 12, 'text-anchor': 'end', 'font-family': 'Consolas' }, String(v)));
    });

    // Red line: No alert (cFN * p); Amber line: Alert (cFP * (1 - p))
    const crossCost = cFN * (theoPct / 100);
    k.push(
      s('line', { x1: gx(0), y1: gy(0), x2: gx(100), y2: gy(cFN), stroke: RED, 'stroke-width': 2.5 }),
      s('line', { x1: gx(0), y1: gy(cFP), x2: gx(100), y2: gy(0), stroke: AMBER, 'stroke-width': 2.5 }),
      s('line', { x1: gx(theoPct), y1: gY0, x2: gx(theoPct), y2: gY1, stroke: GREEN, 'stroke-width': 2, 'stroke-dasharray': '5 4' }),
      s('line', { x1: gx(thr), y1: gY0, x2: gx(thr), y2: gY1, stroke: C.cyan, 'stroke-width': 2 }),
      s('circle', { cx: gx(theoPct), cy: gy(crossCost), r: 5, fill: GREEN }),
      s('text', { x: gx(theoPct), y: gY1 + 14, fill: GREEN, 'font-size': 12, 'font-weight': 700, 'text-anchor': theoPct > 75 ? 'end' : 'start', 'font-family': 'Consolas' }, ` ${fmt(theoPct)}%`),
      s('text', { x: gX1 - 2, y: gy(cFN) + 14, fill: RED, 'font-size': 11, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'No alert'),
      s('text', { x: gX1 - 2, y: gY0 - 6, fill: AMBER, 'font-size': 11, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'Alert'),
    );

    svg.replaceChildren(...k);

    const bestOn12 = cur.cost <= minPileCost;
    fbox(box, [
      [`Threshold       = ${thr}%  (${cur.alerts} alerts)`, C.cyan],
      [`Missed failures = ${cur.fn} × ${cFN} = ${cur.fn * cFN}`, RED],
      [`False alarms    = ${cur.fp} × ${cFP} = ${cur.fp * cFP}`, AMBER],
      [`Total cost      = ${cur.fn * cFN} + ${cur.fp * cFP} = ${cur.cost}`, bestOn12 ? GREEN : C.ink],
      [`Formula cutoff  = ${cFP} ÷ (${cFP} + ${cFN}) = ${fmt(theoPct)}%`, GREEN],
    ]);

    note.textContent =
      `Red blocks show missed failures (${cFN} each); amber blocks show false alarms (${cFP} each). ` +
      `The green dashed line marks the formula cutoff (${fmt(theoPct)}%), where alerting and staying quiet have the same expected cost.`;

    chal.update({ thr, cFN, cFP, cost: cur.cost, theoPct, custom, randomCount });
  }

  draw();
  return () => {};
}
