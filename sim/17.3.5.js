// 17.3.5 Try it: Receptive fields on the 4x4 tile photo and 2-layer filter network.
// Tap photo squares to mark reach, edit Row 2 readings, trace backward trails,
// try fresh random tiles, and test 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, challenges } = kit;

  const BASE_GRID = [
    [4, 4, 4, 4],
    [4, 4, 1, 1],
    [4, 4, 1, 1],
    [4, 4, 4, 4],
  ];
  const cloneGrid = g => g.map(r => r.slice());
  const neg = v => (v < 0 ? `−${-v}` : String(v));

  let grid = cloneGrid(BASE_GRID);
  let layers = 2;              // 1 or 2 convolution layers (filter [+1, -1], stride 1)
  let selCol = 3;              // selected column (0..3) in Row 2 for editing
  let traceIdx = null;         // final score index being traced back, or null
  let marked = new Set();      // marked photo squares as "r,c"
  let prevFinal = [-3, 3];
  let movedIdx = new Set();    // final score indices that changed on the last edit

  // Challenge tracking state
  let ch1Done = false;
  let ch2Done = false;
  let prediction = null;       // 'left' | 'right' | 'both' | 'none'
  let newDataInCh3 = false;
  let col1ChangedAfterNew = false;

  const svg = s('svg', { viewBox: '0 0 700 410' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const predWrap = h('div', { style: { marginTop: '.75rem' } });
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  const bMinus = btn('−1', () => bumpCol(-1));
  const bPlus = btn('+1', () => bumpCol(1));
  const bSet4 = btn('Set to 4 (light)', () => setCol(4));
  const bSet1 = btn('Set to 1 (dark)', () => setCol(1));
  const bL1 = btn('1 layer', () => setLayers(1));
  const bL2 = btn('2 layers', () => setLayers(2), 'go');
  const bTrace = btn('Trace right score', () => toggleTrace());
  const bClearMarks = btn('Clear marks', () => { marked.clear(); draw(); });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: receptive fields'),
    h('p', { class: 'sub' }, 'Tap photo squares to mark which ones reach a score. Tap a final score circle to trace its trails back, or edit Row 2 readings below.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          bMinus, bPlus, bSet4, bSet1, selLabel),
        h('div', { class: 'sim-row' },
          bTrace,
          bClearMarks,
          bL1,
          bL2,
          btn('New data', () => makeRandomData()),
          btn('Reset tile', () => resetTile()))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch, predWrap)))));

  const compute = () => {
    const r2 = grid[1];
    const l1 = [r2[0] - r2[1], r2[1] - r2[2], r2[2] - r2[3]];
    const l2 = [l1[0] - l1[1], l1[1] - l1[2]];
    return { r2, l1, l2, final: layers === 2 ? l2 : l1 };
  };

  // Which Row 2 columns (0-based) a final score at index idx reaches
  const reachCols = idx => {
    if (idx == null) return [];
    const w = layers + 1;
    return Array.from({ length: w }, (_, k) => idx + k);
  };

  const chal = challenges(ch, [
    {
      text: 'Tap the photo squares that can change the right-hand final score.',
      check: st => {
        if (st.layers !== 2) return false;
        const ok = st.marked.size === 3 && st.marked.has('1,1') && st.marked.has('1,2') && st.marked.has('1,3');
        if (ok) ch1Done = true;
        return ok;
      },
      why: 'Yes! Both trails from the right-hand final score reach row 2, columns 2, 3, and 4 (width 3).'
    },
    {
      text: 'Predict which final score changes if column 4 in row 2 gets brighter, then change column 4 from 1 to 4.',
      check: st => {
        const ok = st.layers === 2 && st.prediction !== null &&
          st.r2[0] === 4 && st.r2[1] === 4 && st.r2[2] === 1 && st.r2[3] === 4;
        if (ok) ch2Done = true;
        return ok;
      },
      why: 'The right-hand final score rises from 3 to 6 because its last earlier score falls from 0 to −3, while the left-hand final score stays at −3.'
    },
    {
      text: 'Press “New data”, then change column 1 in row 2. Check which final score moves.',
      check: st => st.layers === 2 && st.newDataInCh3 && st.col1ChangedAfterNew,
      why: 'Even with new brightness readings, column 1 only reaches the left-hand final score—receptive fields depend on the links, not the numbers.'
    },
    {
      text: 'Switch to 1 layer and tap any final score circle to see its reach shrink.',
      check: st => st.layers === 1 && st.traceIdx !== null,
      why: 'With 1 layer, a score only looks 1 step back, so its receptive field width drops from 3 squares to 1 + 1 = 2 squares.'
    }
  ]);

  const editLocked = () => chal.index === 1 && !ch2Done && prediction === null;

  function renderPredictionUI() {
    if (chal.index !== 1) {
      predWrap.replaceChildren();
      return;
    }
    const opts = [
      ['left', 'Left only'],
      ['right', 'Right only'],
      ['both', 'Both scores'],
      ['none', 'Neither'],
    ];
    const row = h('div', { class: 'sim-row' },
      ...opts.map(([id, label]) =>
        btn(label, () => {
          prediction = id;
          draw();
        }, prediction === id ? 'go' : 'ghost')));
    const msg = prediction == null
      ? 'Step 1: pick your prediction before changing column 4.'
      : (ch2Done
          ? (prediction === 'right'
              ? 'Your prediction (Right only) matched the test!'
              : 'Good test! You saw the right-hand final score rise from 3 to 6 while the left stayed at −3.')
          : 'Step 2: now press “Set to 4 (light)” (or +1) to test column 4.');
    predWrap.replaceChildren(
      pill('PREDICTION FOR CHALLENGE 2', C.cyan),
      row,
      h('div', { class: 'sim-note' }, msg)
    );
  }

  let lastChalIdx = 0;
  function onChallengeChange(idx) {
    if (idx === 0 && !ch1Done) {
      layers = 2;
      traceIdx = null;
    } else if (idx === 1 && !ch2Done) {
      layers = 2;
      grid = cloneGrid(BASE_GRID);
      selCol = 3;
      traceIdx = null;
      prediction = null;
      movedIdx.clear();
      prevFinal = compute().final.slice();
    } else if (idx === 2) {
      layers = 2;
      selCol = 0;
      newDataInCh3 = false;
      col1ChangedAfterNew = false;
    }
    draw();
  }

  const obs = new MutationObserver(() => {
    if (chal.index !== lastChalIdx) {
      lastChalIdx = chal.index;
      onChallengeChange(lastChalIdx);
    }
  });
  obs.observe(ch, { childList: true, subtree: true });

  function applyRow2Change(col, nextVal) {
    if (editLocked()) return;
    const clamped = Math.max(1, Math.min(4, nextVal));
    if (grid[1][col] === clamped) return;
    const before = compute().final.slice();
    grid[1][col] = clamped;
    const after = compute().final;
    movedIdx = new Set();
    after.forEach((v, i) => { if (v !== before[i]) movedIdx.add(i); });
    prevFinal = before;
    if (chal.index === 2 && newDataInCh3 && col === 0) col1ChangedAfterNew = true;
    draw();
  }

  function bumpCol(d) { applyRow2Change(selCol, grid[1][selCol] + d); }
  function setCol(val) { applyRow2Change(selCol, val); }

  function setLayers(n) {
    layers = n;
    traceIdx = null;
    movedIdx.clear();
    prevFinal = compute().final.slice();
    draw();
  }

  function toggleTrace() {
    if (layers === 2) {
      traceIdx = traceIdx === null ? 1 : (traceIdx === 1 ? 0 : null);
    } else {
      traceIdx = traceIdx === null ? 2 : (traceIdx > 0 ? traceIdx - 1 : null);
    }
    draw();
  }

  function makeRandomData() {
    if (editLocked()) return;
    const oldRow = grid[1].join(',');
    for (let tries = 0; tries < 8; tries++) {
      grid = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => rnd(1, 4)));
      if (grid[1].join(',') !== oldRow) break;
    }
    movedIdx.clear();
    prevFinal = compute().final.slice();
    if (chal.index === 2) {
      newDataInCh3 = true;
      col1ChangedAfterNew = false;
      selCol = 0;
    }
    draw();
  }

  function resetTile() {
    grid = cloneGrid(BASE_GRID);
    movedIdx.clear();
    prevFinal = compute().final.slice();
    if (chal.index === 1 && !ch2Done) selCol = 3;
    draw();
  }

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700;
  const VH = NARROW ? 565 : 405;
  const F = NARROW ? 1.05 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  function draw() {
    const { r2, l1, l2, final } = compute();
    const locked = editLocked();
    for (const b of [bMinus, bPlus, bSet4, bSet1]) {
      b.disabled = locked;
      b.style.opacity = locked ? '0.45' : '1';
      b.style.cursor = locked ? 'not-allowed' : 'pointer';
    }
    bL1.className = 'sim-btn ' + (layers === 1 ? 'go' : '');
    bL2.className = 'sim-btn ' + (layers === 2 ? 'go' : '');
    bTrace.textContent = traceIdx === null
      ? 'Show trails'
      : (layers === 2 ? (traceIdx === 1 ? 'Tracing: right' : 'Tracing: left') : `Tracing: score ${traceIdx + 1}`);

    const els = [];
    const reach = new Set(reachCols(traceIdx));

    // --- 4x4 Tile Photo ---
    const cell = NARROW ? 44 : 52;
    const gx0 = NARROW ? (VW - 4 * cell) / 2 : 38;
    const gy0 = NARROW ? 54 : 68;
    const pCx = gx0 + 2 * cell;

    els.push(s('text', {
      x: pCx, y: NARROW ? 20 : 28, fill: C.muted, 'font-size': 14 * F, 'font-weight': 700,
      'text-anchor': 'middle', 'font-family': 'Consolas'
    }, '4×4 TILE PHOTO'));

    for (let c = 0; c < 4; c++) {
      els.push(s('text', {
        x: gx0 + (c + 0.5) * cell, y: gy0 - 10, fill: C.cyan, 'font-size': 13 * F, 'font-weight': 700,
        'text-anchor': 'middle', 'font-family': 'Consolas'
      }, `C${c + 1}`));
    }
    for (let r = 0; r < 4; r++) {
      els.push(s('text', {
        x: gx0 - 10, y: gy0 + (r + 0.5) * cell + 5, fill: r === 1 ? C.amber : C.muted,
        'font-size': 13 * F, 'font-weight': r === 1 ? 700 : 400, 'text-anchor': 'end', 'font-family': 'Consolas'
      }, `R${r + 1}`));
    }

    // Subtle Row 2 guide band
    els.push(s('rect', {
      x: gx0 - 4, y: gy0 + cell - 4, width: 4 * cell + 8, height: cell + 8,
      rx: 8, fill: C.amber, 'fill-opacity': 0.06, stroke: C.amber, 'stroke-width': 2, 'stroke-opacity': 0.65
    }));

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = grid[r][c];
        const x = gx0 + c * cell + 2, y = gy0 + r * cell + 2, sz = cell - 4;
        const isDark = val <= 2;
        const key = `${r},${c}`;
        const isMarked = marked.has(key);
        const isSel = r === 1 && c === selCol;
        const inReach = r === 1 && reach.has(c);

        const g = s('g', { style: 'cursor:pointer' });
        g.append(s('rect', {
          x, y, width: sz, height: sz, rx: 6,
          fill: val === 4 ? '#26466b' : val === 3 ? '#203857' : val === 2 ? '#1c2847' : '#161a33',
          stroke: isSel ? C.amber : (isDark ? C.pink : C.cyan),
          'stroke-width': isSel ? 3 : 1.5
        }));
        if (val === 1) {
          g.append(s('line', {
            x1: x + 6, y1: y + sz - 6, x2: x + sz - 6, y2: y + 6,
            stroke: C.pink, 'stroke-width': 1.2, 'stroke-opacity': 0.3
          }));
        }
        if (inReach) {
          g.append(s('rect', {
            x: x - 1, y: y - 1, width: sz + 2, height: sz + 2, rx: 6,
            fill: C.green, 'fill-opacity': 0.2, stroke: C.green, 'stroke-width': 2.5
          }));
        }
        if (isMarked) {
          g.append(s('rect', {
            x: x + 2, y: y + 2, width: sz - 4, height: sz - 4, rx: 4,
            fill: C.cyan, 'fill-opacity': 0.22, stroke: C.cyan, 'stroke-width': 2.5, 'stroke-dasharray': '5 3'
          }));
          g.append(s('circle', { cx: x + sz - 8, cy: y + 8, r: 4.5, fill: C.green }));
        }
        g.append(s('text', {
          x: x + sz / 2, y: y + sz / 2 + 6, fill: isDark ? C.pink : C.ink,
          'font-size': 18 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, String(val)));

        g.addEventListener('click', () => {
          if (r === 1) selCol = c;
          if (marked.has(key)) marked.delete(key);
          else marked.add(key);
          draw();
        });
        els.push(g);
      }
    }

    if (traceIdx !== null && reach.size) {
      const c0 = Math.min(...reach), c1 = Math.max(...reach);
      const bx = gx0 + c0 * cell - 2, bw = (c1 - c0 + 1) * cell + 4, by = gy0 + cell - 2;
      els.push(s('rect', {
        x: bx, y: by, width: bw, height: cell + 4, rx: 8,
        fill: 'none', stroke: C.green, 'stroke-width': 3.5
      }));
    }

    els.push(s('text', {
      x: pCx, y: gy0 + 4 * cell + 22, fill: C.muted, 'font-size': 12.5 * F,
      'text-anchor': 'middle', 'font-family': 'Segoe UI, sans-serif'
    }, 'Tap any square to mark reach · Row 2 feeds the network'));

    // --- Neural Network (2 or 3 columns of circles + weight lines) ---
    const netX = layers === 2
      ? (NARROW ? [76, 200, 322] : [345, 488, 622])
      : (NARROW ? [115, 285] : [390, 565]);
    const netCy = NARROW ? 412 : 200;
    const dy = NARROW ? 56 : 68;
    const nr = NARROW ? 19 : 22;

    const layerSizes = layers === 2 ? [4, 3, 2] : [4, 3];
    const layerVals = layers === 2 ? [r2, l1, l2] : [r2, l1];
    const layerTitles = layers === 2 ? ['Row 2', 'Layer 1', 'Final'] : ['Row 2', 'Final (L1)'];
    const layerCols = layers === 2 ? [C.violet, C.cyan, C.amber] : [C.violet, C.amber];

    const pos = (l, i) => [netX[l], netCy + (i - (layerSizes[l] - 1) / 2) * dy];

    // Active backward trace sets
    const activeL1 = new Set();
    const activeL0 = new Set();
    const activeEdges = new Set();
    if (traceIdx !== null) {
      if (layers === 2) {
        for (const m of [traceIdx, traceIdx + 1]) {
          activeL1.add(m);
          activeEdges.add(`1:${m}:${traceIdx}`);
          for (const k of [m, m + 1]) {
            activeL0.add(k);
            activeEdges.add(`0:${k}:${m}`);
          }
        }
      } else {
        activeL1.add(traceIdx);
        for (const k of [traceIdx, traceIdx + 1]) {
          activeL0.add(k);
          activeEdges.add(`0:${k}:${traceIdx}`);
        }
      }
    }

    // Layer headers
    layerTitles.forEach((title, l) => {
      els.push(s('text', {
        x: netX[l], y: NARROW ? 292 : 42, fill: layerCols[l], 'font-size': 13.5 * F, 'font-weight': 700,
        'text-anchor': 'middle', 'font-family': 'Consolas'
      }, title));
    });

    // Weight edges (only true width-2 convolution links)
    for (let l = 0; l < layerSizes.length - 1; l++) {
      for (let j = 0; j < layerSizes[l + 1]; j++) {
        for (let off = 0; off < 2; off++) {
          const i = j + off;
          const [x1, y1] = pos(l, i), [x2, y2] = pos(l + 1, j);
          const ek = `${l}:${i}:${j}`;
          const isAct = activeEdges.has(ek);
          const isPos = off === 0;
          const baseCol = isPos ? C.cyan : C.pink;
          els.push(s('line', {
            x1: x1 + nr, y1, x2: x2 - nr, y2,
            stroke: isAct ? (isPos ? C.cyan : C.violet) : baseCol,
            'stroke-width': isAct ? 4.5 : (traceIdx !== null ? 1.8 : 3),
            'stroke-opacity': traceIdx !== null ? (isAct ? 0.95 : 0.22) : 0.72,
            'stroke-dasharray': isAct && !isPos ? '7 4' : null
          }));
        }
      }
    }

    // Weight legend under the network
    els.push(s('text', {
      x: (netX[0] + netX[netX.length - 1]) / 2, y: NARROW ? 550 : 374,
      fill: C.muted, 'font-size': 12.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas'
    }, 'cyan = +1 (left)   ·   pink = −1 (right)'));

    // Neurons
    for (let l = 0; l < layerSizes.length; l++) {
      const isFinalLayer = l === layerSizes.length - 1;
      for (let i = 0; i < layerSizes[l]; i++) {
        const [cx, cy] = pos(l, i);
        const val = layerVals[l][i];
        const isTraced = (isFinalLayer && traceIdx === i) || (l === 1 && layers === 2 && activeL1.has(i)) || (l === 0 && activeL0.has(i));
        const isChanged = isFinalLayer && movedIdx.has(i);
        const isSelInput = l === 0 && i === selCol;

        const g = s('g', { style: (isFinalLayer || l === 0) ? 'cursor:pointer' : null });
        if (isChanged) {
          g.append(s('circle', { cx, cy, r: nr + 7, fill: C.green, 'fill-opacity': 0.18, stroke: C.green, 'stroke-width': 2.5 }));
        }
        g.append(s('circle', {
          cx, cy, r: nr, fill: C.card,
          stroke: isTraced ? C.green : (isSelInput ? C.amber : layerCols[l]),
          'stroke-width': (isTraced || isSelInput) ? 3.5 : 2.5
        }));
        g.append(s('text', {
          x: cx, y: cy + 6,
          fill: isChanged ? C.green : (val < 0 ? C.pink : C.ink),
          'font-size': 16 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, neg(val)));

        if (l === 0) {
          g.append(s('text', {
            x: cx - nr - 8, y: cy + 5, fill: i === selCol ? C.amber : C.muted,
            'font-size': 12 * F, 'font-weight': i === selCol ? 700 : 400, 'text-anchor': 'end', 'font-family': 'Consolas'
          }, `C${i + 1}`));
          g.addEventListener('click', () => { selCol = i; draw(); });
        }
        if (isFinalLayer) {
          const tag = layers === 2 ? (i === 0 ? 'left' : 'right') : `S${i + 1}`;
          g.append(s('text', {
            x: cx + nr + 8, y: cy + 5, fill: traceIdx === i ? C.green : (isChanged ? C.green : C.amber),
            'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'start', 'font-family': 'Consolas'
          }, tag));
          g.addEventListener('click', () => {
            traceIdx = traceIdx === i ? null : i;
            draw();
          });
        }
        els.push(g);
      }
    }

    svg.replaceChildren(...els);

    // Formula box
    const lines = [
      `Row 2:   [${r2.join(', ')}]`,
      `Layer 1: [${l1.map(neg).join(', ')}]   (left − right)`,
    ];
    if (layers === 2) {
      lines.push([`Final:   left = ${neg(l2[0])},  right = ${neg(l2[1])}`, C.amber]);
    } else {
      lines.push([`Final:   [${l1.map(neg).join(', ')}]`, C.amber]);
    }
    if (traceIdx !== null) {
      const cols1 = reachCols(traceIdx).map(c => c + 1).join(', ');
      const who = layers === 2 ? (traceIdx === 0 ? 'Left' : 'Right') : `Score ${traceIdx + 1}`;
      lines.push([`${who} reach: cols ${cols1}  (width = 1 + ${layers} = ${layers + 1})`, C.green]);
    } else {
      lines.push([`Width = 1 + ${layers} = ${layers + 1} squares`, C.cyan]);
    }
    fbox(box, lines);

    selLabel.textContent = `Selected: Row 2, Col ${selCol + 1} (${r2[selCol]})`;

    if (locked) {
      note.textContent = 'Pick a prediction in Challenge 2 first, then change column 4 from 1 to 4.';
    } else if (movedIdx.size) {
      const names = [...movedIdx].map(i => (layers === 2 ? (i === 0 ? 'left' : 'right') : `score ${i + 1}`)).join(' & ');
      note.textContent = `That change moved: ${names} (highlighted in green).`;
    } else if (traceIdx !== null) {
      const cols1 = reachCols(traceIdx).map(c => c + 1).join('–').replace(/, /g, '');
      note.textContent = `Following the links back shows this score can only see Row 2 columns ${reachCols(traceIdx)[0] + 1} through ${reachCols(traceIdx)[reachCols(traceIdx).length - 1] + 1}.`;
    } else {
      note.textContent = 'Tap any final score circle to trace its receptive field, or edit Row 2 readings to see which scores move.';
    }

    chal.update({ r2, l1, l2, layers, marked, prediction, traceIdx, newDataInCh3, col1ChangedAfterNew });
    renderPredictionUI();
  }

  draw();
  return () => obs.disconnect();
}
