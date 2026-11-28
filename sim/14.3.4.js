// 14.3.4 Try it: low-rank reconstruction of tea tasting scores.
// Drag any of the 12 original score bars (or tap + use -1 / +1), switch how many
// principal components are retained (0, 1, 2 or 3), toggle centered view, try
// different chapter teas or random teas, and solve self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const ATTRS = ['Floral', 'Jasmine', 'Rose', 'Blossom', 'Honey', 'Fruit', 'Roast', 'Toast', 'Nut', 'Cocoa', 'Caramel', 'Smoke'];
  const SHORT = ['Fl', 'Ja', 'Ro', 'Bl', 'Ho', 'Fr', 'Rs', 'To', 'Nu', 'Co', 'Ca', 'Sm'];
  const TEA_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const TEAS = {
    A: [1, 3, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3],
    B: [3, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3],
    C: [1, 3, 2, 2, 2, 2, 7, 7, 7, 7, 7, 7],
    D: [3, 1, 2, 2, 2, 2, 7, 7, 7, 7, 7, 7],
    E: [7, 9, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
    F: [9, 7, 8, 8, 8, 8, 3, 3, 3, 3, 3, 3],
    G: [7, 9, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7],
    H: [9, 7, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7],
  };

  // Unit-length loadings from chapters/14.3.md (mean = 5 for every attribute)
  const INV_S6 = 1 / Math.sqrt(6);
  const INV_S2 = 1 / Math.sqrt(2);
  const U = [
    [INV_S6, INV_S6, INV_S6, INV_S6, INV_S6, INV_S6, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, INV_S6, INV_S6, INV_S6, INV_S6, INV_S6, INV_S6],
    [INV_S2, -INV_S2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  let teaIdx = 0;
  let teaName = 'Tea A';
  let scores = TEAS.A.slice();
  let sel = 0;
  let k = 2;
  let centeredView = false;
  let custom = false;
  let isRandom = false;
  let seenK = new Set();
  let randomCounted = false;
  let randomChecks = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  const kBtns = [0, 1, 2, 3].map(m => btn(m === 0 ? '0 PCs (mean)' : `${m} PC${m > 1 ? 's' : ''}`, () => setK(m)));
  const teaBtn = btn('Next tea (A–H)', nextTea);
  const viewBtn = btn('Show changes from mean', () => { centeredView = !centeredView; draw(); });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: rebuild the twelve tasting scores'),
    h('p', { class: 'sub' }, 'Filled bars are the original scores; outlined bars are rebuilt from the kept principal components. Drag any bar up or down, or tap it and use −1 / +1.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1', () => bump(-1)), btn('+1', () => bump(1)), selLabel),
        h('div', { class: 'sim-row' }, ...kBtns),
        h('div', { class: 'sim-row' },
          teaBtn,
          viewBtn,
          btn('New tea (random)', makeRandom),
          btn('Start again', reset))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const r2 = x => Math.round(x * 100) / 100;
  const r4 = x => Math.round(x * 10000) / 10000;

  const chal = challenges(ch, [
    {
      text: 'On Tea A, keep 3 PCs so the squared reconstruction error drops to 0.',
      check: st => st.tea === 'Tea A' && !st.custom && st.k === 3 && st.err < 1e-6,
      why: 'Yes! Keeping the third component restores the Floral–Jasmine difference, so all twelve scores match exactly.',
    },
    {
      text: 'Keep 2 PCs and adjust scores until all twelve rebuilt bars match with 0 squared error.',
      check: st => st.k === 2 && st.err < 1e-6 && st.custom,
      why: 'Right! When all six first-group scores match each other and all six last-group scores match each other, two patterns rebuild them with zero error.',
    },
    {
      text: 'With 2 PCs kept, drag a bar to make the squared reconstruction error at least 12.',
      check: st => st.k === 2 && st.err >= 12,
      why: 'Exactly: when one attribute breaks away from its group pattern, two shared patterns cannot follow it and the error jumps.',
    },
    {
      text: 'Press “New tea (random)” twice and check 1 PC, 2 PCs and 3 PCs on each new tea.',
      check: st => st.randomChecks >= 2,
      why: 'Every time you keep more components, the squared error shrinks or stays the same, while details outside those patterns remain lost.',
    },
  ]);

  function setK(m) {
    k = m;
    if (isRandom) {
      seenK.add(k);
      if (!randomCounted && seenK.has(1) && seenK.has(2) && seenK.has(3)) {
        randomCounted = true;
        randomChecks++;
      }
    }
    draw();
  }

  function nextTea() {
    teaIdx = (teaIdx + 1) % TEA_KEYS.length;
    const key = TEA_KEYS[teaIdx];
    teaName = 'Tea ' + key;
    scores = TEAS[key].slice();
    custom = false;
    isRandom = false;
    draw();
  }

  function makeRandom() {
    const g1 = rnd(2, 8), g2 = rnd(2, 8);
    scores = ATTRS.map((_, j) => {
      const base = j < 6 ? g1 : g2;
      return Math.max(0, Math.min(10, base + rnd(-2, 2)));
    });
    if (scores[0] === scores[1]) scores[1] = Math.max(0, Math.min(10, scores[1] + (scores[1] < 9 ? 2 : -2)));
    teaName = 'Random tea';
    custom = true;
    isRandom = true;
    seenK = new Set([k]);
    randomCounted = false;
    draw();
  }

  function reset() {
    teaIdx = 0;
    teaName = 'Tea A';
    scores = TEAS.A.slice();
    sel = 0;
    k = 2;
    centeredView = false;
    custom = false;
    isRandom = false;
    draw();
  }

  function bump(d) {
    scores[sel] = Math.max(0, Math.min(10, scores[sel] + d));
    custom = true;
    draw();
  }

  // Geometry: responsive phone vs laptop viewBox
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700;
  const VH = 440;
  const F = NARROW ? 1.15 : 1;
  const X0 = NARROW ? 36 : 50;
  const X1 = VW - 12;
  const TOP = 46;
  const BASE = 368;
  const UNIT = (BASE - TOP) / 10;
  const MID = BASE - 5 * UNIT;
  const MID_GAP = NARROW ? 10 : 18;
  const SLOT = (X1 - X0 - MID_GAP) / 12;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const slotX = i => X0 + SLOT * (i + 0.5) + (i >= 6 ? MID_GAP : 0);

  // Drag any bar to change its original tasting score
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  function slotFromX(x) {
    let best = -1, bestD = Infinity;
    for (let i = 0; i < 12; i++) {
      const d = Math.abs(x - slotX(i));
      if (d < bestD && d <= SLOT * 0.65) { bestD = d; best = i; }
    }
    return best;
  }
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), i = slotFromX(p.x);
    if (i < 0) return;
    sel = i; dragging = i; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    scores[dragging] = Math.max(0, Math.min(10, Math.round((BASE - p.y) / UNIT)));
    custom = true;
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function compute() {
    const c = scores.map(v => v - 5);
    const zs = U.map(u => c.reduce((acc, v, j) => acc + v * u[j], 0));
    const rebC = ATTRS.map((_, j) => {
      let sum = 0;
      for (let m = 0; m < k; m++) sum += zs[m] * U[m][j];
      return sum;
    });
    const reb = rebC.map(v => 5 + v);
    const diffs = scores.map((v, j) => v - reb[j]);
    const sqErr = diffs.reduce((acc, d) => acc + d * d, 0);
    const exact = diffs.filter(d => Math.abs(d) < 1e-6).length;
    return { c, zs, rebC, reb, diffs, sqErr, exact };
  }

  function draw() {
    const { c, zs, rebC, reb, diffs, sqErr, exact } = compute();
    const els = [];
    const bw = Math.max(7, SLOT * 0.40);
    const off = bw * 0.54;

    // Legend & tea tag at top
    const titleTag = custom && !isRandom ? `${teaName} (edited)` : teaName;
    els.push(
      s('text', { x: X0, y: 24, fill: C.cyan, 'font-size': 14 * F, 'font-weight': 700, 'font-family': 'Consolas' }, titleTag),
      s('rect', { x: X1 - (NARROW ? 188 : 240), y: 12, width: 11, height: 11, rx: 2, fill: C.cyan, 'fill-opacity': 0.85 }),
      s('text', { x: X1 - (NARROW ? 173 : 224), y: 22, fill: C.ink, 'font-size': 12 * F, 'font-family': 'Consolas' }, 'orig'),
      s('rect', { x: X1 - (NARROW ? 132 : 172), y: 12, width: 11, height: 11, rx: 2, fill: C.cyan, 'fill-opacity': 0.14, stroke: C.cyan, 'stroke-width': 2 }),
      s('text', { x: X1 - (NARROW ? 117 : 156), y: 22, fill: C.ink, 'font-size': 12 * F, 'font-family': 'Consolas' }, 'rebuilt'),
      s('rect', { x: X1 - (NARROW ? 56 : 78), y: 12, width: 11, height: 11, rx: 2, fill: C.pink, 'fill-opacity': 0.2, stroke: C.pink, 'stroke-width': 2 }),
      s('text', { x: X1 - (NARROW ? 41 : 62), y: 22, fill: C.pink, 'font-size': 12 * F, 'font-family': 'Consolas' }, 'diff')
    );

    // Horizontal gridlines & y-axis labels
    const ticks = centeredView ? [-5, -3, -2, 0, 2, 3, 5] : [0, 2, 5, 8, 10];
    for (const v of ticks) {
      const y = centeredView ? MID - v * UNIT : BASE - v * UNIT;
      const isRef = centeredView ? v === 0 : v === 5;
      els.push(
        s('line', {
          x1: X0, x2: X1, y1: y, y2: y,
          stroke: isRef ? C.green : C.line,
          'stroke-width': isRef ? 1.8 : 1,
          'stroke-dasharray': isRef && !centeredView ? '7 5' : null,
        }),
        s('text', {
          x: X0 - 7, y: y + 4, fill: isRef ? C.green : C.muted,
          'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas',
        }, centeredView && v > 0 ? `+${v}` : String(v))
      );
    }

    // Group divider line
    const divX = (slotX(5) + slotX(6)) / 2;
    els.push(s('line', { x1: divX, x2: divX, y1: TOP, y2: BASE, stroke: C.line, 'stroke-dasharray': '4 4' }));

    // 12 paired bars (original filled on left, rebuilt outlined on right)
    for (let i = 0; i < 12; i++) {
      const cx = slotX(i);
      const col = i < 6 ? C.cyan : C.amber;
      const diff = diffs[i];
      const hasErr = Math.abs(diff) > 0.04;
      const rebCol = hasErr ? C.pink : col;

      if (i === sel) {
        els.push(s('rect', {
          x: cx - SLOT / 2 + 1, y: TOP - 4, width: SLOT - 2, height: BASE - TOP + 4,
          fill: '#ffffff', 'fill-opacity': 0.05, rx: 6,
        }));
      }

      const oVal = centeredView ? c[i] : scores[i];
      const rVal = centeredView ? rebC[i] : reb[i];
      const refY = centeredView ? MID : BASE;

      // Original bar (filled)
      const oTop = Math.min(refY, refY - oVal * UNIT);
      const oH = Math.max(2, Math.abs(oVal) * UNIT);
      els.push(s('rect', {
        x: cx - off - bw / 2, y: oTop, width: bw, height: oH,
        fill: col, 'fill-opacity': 0.85, stroke: col, 'stroke-width': 1, rx: 2,
      }));

      // Rebuilt bar (outlined)
      const rTop = Math.min(refY, refY - rVal * UNIT);
      const rH = Math.max(2, Math.abs(rVal) * UNIT);
      els.push(s('rect', {
        x: cx + off - bw / 2, y: rTop, width: bw, height: rH,
        fill: rebCol, 'fill-opacity': 0.15, stroke: rebCol, 'stroke-width': 2.2, rx: 2,
      }));

      // Pink mismatch bar segment & label
      if (hasErr) {
        const yA = refY - oVal * UNIT;
        const yB = refY - rVal * UNIT;
        els.push(s('line', {
          x1: cx, x2: cx, y1: yA, y2: yB,
          stroke: C.pink, 'stroke-width': 3, 'stroke-linecap': 'round',
        }));
        const topY = Math.min(yA, yB) - 6;
        els.push(s('text', {
          x: cx, y: Math.max(TOP + 10, topY), fill: C.pink,
          'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas',
        }, (diff > 0 ? '+' : '') + fmt(r2(diff))));
      }

      // Attribute label + original numeric value
      els.push(
        s('text', {
          x: cx, y: BASE + 19, fill: i === sel ? C.ink : col,
          'font-size': (NARROW ? 11 : 13) * F, 'font-weight': i === sel ? 700 : 600,
          'text-anchor': 'middle', 'font-family': 'Consolas',
        }, SHORT[i]),
        s('text', {
          x: cx, y: BASE + 37, fill: C.muted,
          'font-size': (NARROW ? 11 : 12) * F, 'text-anchor': 'middle', 'font-family': 'Consolas',
        }, centeredView ? (oVal > 0 ? `+${oVal}` : String(oVal)) : String(scores[i]))
      );
    }

    // Group labels along bottom
    els.push(
      s('text', { x: (slotX(0) + slotX(5)) / 2, y: BASE + 58, fill: C.cyan, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'first 6 · PC1 pattern'),
      s('text', { x: (slotX(6) + slotX(11)) / 2, y: BASE + 58, fill: C.amber, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'last 6 · PC2 pattern')
    );

    svg.replaceChildren(...els);

    // Update buttons
    kBtns.forEach((b, m) => { b.className = 'sim-btn' + (m === k ? ' go' : ''); });
    teaBtn.textContent = `Next tea (now ${TEA_KEYS[teaIdx]})`;
    viewBtn.textContent = centeredView ? 'Show tasting scores (0–10)' : 'Show changes from mean';

    // Formula box
    const pc1Delta = zs[0] * INV_S6;
    const pc2Delta = zs[1] * INV_S6;
    const pc3Delta = zs[2] * INV_S2;
    const selContribs = [0, 1, 2].map(m => (m < k ? zs[m] * U[m][sel] : 0));
    const selTerms = selContribs
      .map((v, m) => (m < k && Math.abs(U[m][sel]) > 0 ? (v >= 0 ? `+ ${fmt(r2(v))}` : `- ${fmt(r2(Math.abs(v)))}`) : null))
      .filter(Boolean)
      .join(' ');
    const selLine = `${ATTRS[sel]}: 5 ${selTerms || '+ 0'} = ${fmt(r2(reb[sel]))} (orig ${scores[sel]})`;

    fbox(box, [
      [`PC1 = ${zs[0].toFixed(2)}  ${k >= 1 ? `→ ${fmt(r2(pc1Delta))} (kept)` : '(dropped)'}`, k >= 1 ? C.cyan : C.muted],
      [`PC2 = ${zs[1].toFixed(2)}  ${k >= 2 ? `→ ${fmt(r2(pc2Delta))} (kept)` : '(dropped)'}`, k >= 2 ? C.amber : C.muted],
      [`PC3 = ${zs[2].toFixed(2)}  ${k >= 3 ? `→ ±${fmt(r2(Math.abs(pc3Delta)))} (kept)` : '(dropped)'}`, k >= 3 ? C.pink : C.muted],
      [selLine, C.ink],
      [`squared error = ${fmt(r2(sqErr))}  (${exact}/12 exact)`, sqErr < 1e-6 ? C.green : C.pink],
    ]);

    note.textContent = k === 0
      ? 'With 0 PCs kept, every attribute is rebuilt as the mean of 5.'
      : sqErr < 1e-6
        ? `All twelve scores match exactly with ${k} retained component${k > 1 ? 's' : ''}.`
        : `Pink gaps show what ${k} retained component${k > 1 ? 's' : ''} cannot capture. Square each gap and add to get ${fmt(r2(sqErr))}.`;

    const selDiff = diffs[sel];
    selLabel.textContent = `${ATTRS[sel]}: orig ${scores[sel]}, rebuilt ${fmt(r2(reb[sel]))} (diff ${selDiff > 0 ? '+' : ''}${fmt(r2(selDiff))})`;

    chal.update({ tea: teaName, k, err: r4(sqErr), custom, randomChecks });
  }

  draw();
  return () => {};
}
