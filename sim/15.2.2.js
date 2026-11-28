// 15.2.2 Try it: Discounted return — why earlier rewards matter.
// Compare two cart routes on the 4-cell grid, tune the discount factor live,
// tap grid cells to draw your own Route 2, tap rewards to edit them,
// step through move-by-move with a growing return curve, or generate random data.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;

  const ADJ = { A: ['B', 'C'], B: ['A', 'D'], C: ['A', 'D'], D: [] };
  const DEF_P1 = ['A', 'B', 'D'], DEF_R1 = [0, 10];
  const DEF_P2 = ['A', 'B', 'A', 'C', 'D'], DEF_R2 = [0, 0, 0, 10];

  let p1 = DEF_P1.slice(), r1 = DEF_R1.slice();
  let p2 = DEF_P2.slice(), r2 = DEF_R2.slice();
  let gamma = 0.5;
  let stepIdx = 4; // number of moves revealed (0 .. maxMoves)
  let playing = false, timer = null, speed = 700;
  let isRandom = false, countedThisRandom = false, randomRuns = 0;

  const fmtVal = x => {
    if (Math.abs(x) < 1e-9) return '0';
    if (Number.isInteger(Math.round(x * 1e6) / 1e6)) return String(Math.round(x));
    const s4 = x.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
    return s4.length <= 6 ? s4 : x.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  };

  function calcRoute(rewards, g, upto = rewards.length) {
    const disc = [], cum = [0];
    let total = 0;
    for (let i = 0; i < rewards.length; i++) {
      const w = Math.pow(g, i);
      const dv = rewards[i] * w;
      disc.push({ r: rewards[i], w, dv });
      if (i < upto) total += dv;
      cum.push(i === 0 ? dv : cum[i] + dv);
    }
    return { disc, cum, total, fullTotal: cum[rewards.length] };
  }

  const maxMoves = () => Math.max(r1.length, r2.length, 1);

  function makeGridRoute(moves) {
    const path = ['A'];
    const detours = Math.max(0, Math.floor((moves - 2) / 2));
    for (let i = 0; i < detours; i++) path.push(Math.random() < 0.5 ? 'B' : 'C', 'A');
    path.push(Math.random() < 0.5 ? 'B' : 'C', 'D');
    return path;
  }

  function stopPlay() {
    playing = false;
    if (timer) { clearInterval(timer); timer = null; }
    playBtn.textContent = 'Play';
  }

  function checkRandomCompletion() {
    if (isRandom && !countedThisRandom && stepIdx >= maxMoves()) {
      countedThisRandom = true;
      randomRuns++;
    }
  }

  function doStep() {
    if (stepIdx >= maxMoves()) {
      stepIdx = 0;
    } else {
      stepIdx++;
    }
    checkRandomCompletion();
    draw();
    if (playing && stepIdx >= maxMoves()) stopPlay();
  }

  function togglePlay() {
    if (playing) { stopPlay(); return; }
    if (stepIdx >= maxMoves()) stepIdx = 0;
    playing = true;
    playBtn.textContent = 'Pause';
    draw();
    timer = setInterval(() => {
      if (stepIdx < maxMoves()) {
        stepIdx++;
        checkRandomCompletion();
        draw();
      }
      if (stepIdx >= maxMoves()) stopPlay();
    }, speed);
  }

  function resetAll() {
    stopPlay();
    p1 = DEF_P1.slice(); r1 = DEF_R1.slice();
    p2 = DEF_P2.slice(); r2 = DEF_R2.slice();
    gamma = 0.5;
    gammaSlider.value = '0.5';
    stepIdx = maxMoves();
    isRandom = false;
    countedThisRandom = false;
    draw();
  }

  function newRandomData() {
    stopPlay();
    const len1 = 2;
    const len2 = rnd(2, 3) * 2; // 4 or 6 moves
    p1 = makeGridRoute(len1);
    p2 = makeGridRoute(len2);
    const dock1 = rnd(6, 12);
    const dock2 = rnd(8, 16);
    r1 = p1.slice(1).map((c, i) => (c === 'D' ? dock1 : (i === 0 && Math.random() < 0.35 ? rnd(1, 3) : 0)));
    r2 = p2.slice(1).map((c, i) => (c === 'D' ? dock2 : (i === 0 && Math.random() < 0.4 ? rnd(1, 4) : 0)));
    stepIdx = 0;
    isRandom = true;
    countedThisRandom = false;
    draw();
  }

  function addDetour() {
    stopPlay();
    if (r2.length >= 8) return;
    // Insert a 2-move loop (A -> B -> A) right at the start of Route 2
    p2 = ['A', Math.random() < 0.5 ? 'B' : 'C', ...p2];
    r2 = [0, 0, ...r2];
    stepIdx = maxMoves();
    draw();
  }

  function tapGridCell(cell) {
    stopPlay();
    const last = p2[p2.length - 1];
    if (last === 'D') {
      // Start drawing a fresh custom Route 2 from A
      if (cell === 'A') {
        p2 = ['A']; r2 = [];
      } else if (ADJ.A.includes(cell)) {
        p2 = ['A', cell]; r2 = [0];
      } else {
        return;
      }
      stepIdx = maxMoves();
      draw();
      return;
    }
    if (!ADJ[last].includes(cell)) return;
    if (r2.length >= 7 && cell !== 'D') return;
    p2.push(cell);
    r2.push(cell === 'D' ? 10 : 0);
    stepIdx = maxMoves();
    draw();
  }

  function bumpReward(which, idx) {
    stopPlay();
    const arr = which === 1 ? r1 : r2;
    const next = [0, 2, 4, 6, 8, 10];
    const cur = next.indexOf(arr[idx]);
    arr[idx] = cur >= 0 ? next[(cur + 1) % next.length] : 0;
    stepIdx = maxMoves();
    draw();
  }

  // Controls & layout
  const svg = s('svg', { viewBox: '0 0 700 465' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const gammaRead = pill('factor = 0.5', C.amber);
  const iterRead = pill('Move 4 / 4', C.violet);

  const gammaSlider = h('input', {
    type: 'range', min: '0', max: '1', step: '0.05', value: '0.5',
    style: { flex: '1 1 140px', accentColor: C.amber },
    oninput: e => { gamma = parseFloat(e.target.value); draw(); }
  });
  const speedSlider = h('input', {
    type: 'range', min: '250', max: '1400', step: '50', value: '700',
    style: { width: '95px', accentColor: C.cyan },
    oninput: e => {
      speed = 1650 - parseInt(e.target.value, 10);
      if (playing) { stopPlay(); togglePlay(); }
    }
  });
  const playBtn = btn('Play', togglePlay, 'go');

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: discounted return'),
    h('p', { class: 'sub' }, 'Slide the discount factor to see how later rewards shrink. Tap cells on the grid to build Route 2, or tap any reward badge to change its points.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { style: { fontSize: '.9rem', color: '#b2bdd9' } }, 'Discount factor:'),
          gammaSlider, gammaRead, iterRead),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Step', doStep, 'go'),
          playBtn,
          h('span', { style: { fontSize: '.85rem', color: '#b2bdd9', marginLeft: '.25rem' } }, 'Speed:'),
          speedSlider,
          btn('Reset', resetAll)),
        h('div', { class: 'sim-row' },
          btn('New data (random)', newRandomData),
          btn('Add detour (+2 moves)', addDetour))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Slide the discount factor to 1. What happens to the return of both routes?',
      check: st => Math.abs(st.gamma - 1) < 1e-6 && st.r1.length !== st.r2.length && Math.abs(st.ret1 - st.ret2) < 1e-6 && st.ret1 > 0,
      why: 'At 1, every reward keeps its full value. Both routes tie at 10, so the cart cannot tell which route is faster.'
    },
    {
      text: 'Lower the discount factor to 0.1 or less so Route 2’s discounted return drops below 0.1.',
      check: st => st.gamma <= 0.101 && st.ret2 < 0.1 && st.r2.some(v => v > 0),
      why: 'A tiny discount factor shrinks a 10-point reward four moves away to almost nothing (0.01 at factor 0.1).'
    },
    {
      text: 'Set the discount factor to 0.5, then lengthen Route 2 (press “Add detour” or tap grid cells) until its return is under 0.5.',
      check: st => Math.abs(st.gamma - 0.5) < 1e-6 && st.r2.length >= 6 && st.p2[st.p2.length - 1] === 'D' && st.ret2 < 0.5,
      why: 'Every extra move cuts the reward in half again. After 6 moves, 10 points shrinks to 0.3125.'
    },
    {
      text: 'Press “New data (random)” and then use “Step” or “Play” to watch the return build move by move, twice.',
      check: st => st.randomRuns >= 2,
      why: 'Discounted return works for any route and any rewards: earlier rewards always keep a larger share of their value.'
    },
  ]);

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 585 : 465;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  function svgArrow(k, x1, y1, x2, y2, col, offX = 0, offY = 0, dashed = false) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, trim = NARROW ? 20 : 24;
    const sx = x1 + ux * trim + offX, sy = y1 + uy * trim + offY;
    const ex = x2 - ux * trim + offX, ey = y2 - uy * trim + offY;
    k.push(s('line', {
      x1: sx, y1: sy, x2: ex, y2: ey, stroke: col, 'stroke-width': 3.5,
      'stroke-dasharray': dashed ? '6 4' : null, 'stroke-opacity': 0.9, 'stroke-linecap': 'round'
    }));
    const hl = 8, ang = 0.52, base = Math.atan2(uy, ux) + Math.PI;
    k.push(s('path', {
      d: `M ${ex + hl * Math.cos(base + ang)} ${ey + hl * Math.sin(base + ang)} L ${ex} ${ey} L ${ex + hl * Math.cos(base - ang)} ${ey + hl * Math.sin(base - ang)}`,
      fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }));
  }

  function draw() {
    const MMAX = maxMoves();
    stepIdx = Math.min(stepIdx, MMAX);
    const c1 = calcRoute(r1, gamma, stepIdx);
    const c2 = calcRoute(r2, gamma, stepIdx);
    const k = [];

    // --- 1. 4-CELL GRID ------------------------------------------------------
    const GX = NARROW ? 12 : 16, GY = NARROW ? 16 : 18, CS = NARROW ? 80 : 98, GAP = 8;
    const cPos = {
      A: [GX + CS / 2, GY + CS / 2],
      B: [GX + CS + GAP + CS / 2, GY + CS / 2],
      C: [GX + CS / 2, GY + CS + GAP + CS / 2],
      D: [GX + CS + GAP + CS / 2, GY + CS + GAP + CS / 2],
    };
    const lastP2 = p2[p2.length - 1];
    const validNext = lastP2 === 'D' ? ['B', 'C'] : ADJ[lastP2];

    for (const name of ['A', 'B', 'C', 'D']) {
      const [cx, cy] = cPos[name], isDock = name === 'D';
      const canTap = validNext.includes(name) || (lastP2 === 'D' && name === 'A');
      const rect = s('rect', {
        x: cx - CS / 2, y: cy - CS / 2, width: CS, height: CS, rx: 10,
        fill: isDock ? C.green : C.bg, 'fill-opacity': isDock ? 0.16 : 0.95,
        stroke: isDock ? C.green : (lastP2 !== 'D' && canTap ? C.pink : '#2d3b66'),
        'stroke-width': isDock ? 2.5 : (lastP2 !== 'D' && canTap ? 2.2 : 1.8),
        style: canTap ? 'cursor:pointer' : ''
      });
      if (canTap) rect.addEventListener('click', () => tapGridCell(name));
      k.push(rect);
      k.push(s('text', {
        x: cx - CS / 2 + 9, y: cy - CS / 2 + 19, fill: isDock ? C.green : C.muted,
        'font-size': NARROW ? 13 : 14, 'font-weight': 700, 'font-family': 'Consolas',
        'pointer-events': 'none'
      }, name));
      if (isDock) {
        k.push(s('text', {
          x: cx, y: cy + CS / 2 - 10, fill: C.green, 'font-size': NARROW ? 11 : 12,
          'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas',
          'pointer-events': 'none'
        }, 'DOCK'));
      }
    }

    // Draw Route 1 arrows (cyan, dashed) up to stepIdx
    for (let i = 0; i < Math.min(stepIdx, p1.length - 1); i++) {
      const a = cPos[p1[i]], b = cPos[p1[i + 1]];
      svgArrow(k, a[0], a[1], b[0], b[1], C.cyan, 0, -6, true);
    }
    // Draw Route 2 arrows (pink) up to stepIdx
    for (let i = 0; i < Math.min(stepIdx, p2.length - 1); i++) {
      const a = cPos[p2[i]], b = cPos[p2[i + 1]];
      const rev = (p2[i] === 'B' && p2[i + 1] === 'A') || (p2[i] === 'C' && p2[i + 1] === 'A');
      svgArrow(k, a[0], a[1], b[0], b[1], C.pink, rev ? -5 : 5, rev ? 9 : 6, false);
    }

    // White delivery cart at current Route 2 position
    const cartCell = p2[Math.min(stepIdx, p2.length - 1)] || 'A';
    const [cartX, cartY] = cPos[cartCell];
    k.push(
      s('rect', { x: cartX - 15, y: cartY - 10, width: 30, height: 15, rx: 4, fill: C.ink, 'pointer-events': 'none' }),
      s('circle', { cx: cartX - 8, cy: cartY + 8, r: 4, fill: C.bg, stroke: C.ink, 'stroke-width': 2, 'pointer-events': 'none' }),
      s('circle', { cx: cartX + 8, cy: cartY + 8, r: 4, fill: C.bg, stroke: C.ink, 'stroke-width': 2, 'pointer-events': 'none' })
    );
    k.push(s('text', {
      x: GX + CS + GAP / 2, y: GY + 2 * CS + GAP + 16, fill: C.muted,
      'font-size': NARROW ? 11 : 12, 'text-anchor': 'middle', 'font-family': 'Segoe UI, sans-serif'
    }, lastP2 === 'D' ? 'Tap B or C to draw a new Route 2' : `Route 2 at ${lastP2}: tap a highlighted cell`));

    // --- 2. RETURN COMPARISON BARS -------------------------------------------
    const BX = NARROW ? 196 : 254, BY = NARROW ? 16 : 18;
    const BW = NARROW ? 194 : 430, BH = NARROW ? 168 : 96;
    k.push(s('rect', { x: BX, y: BY, width: BW, height: BH, rx: 10, fill: C.bg, stroke: '#26305a' }));
    const maxScale = Math.max(10, c1.fullTotal, c2.fullTotal, 1);
    const barLeft = BX + (NARROW ? 12 : 76), barMaxW = BW - (NARROW ? 24 : 156);
    const barRows = [
      { lbl: 'Route 1', val: c1.total, col: C.cyan, y: BY + (NARROW ? 46 : 32) },
      { lbl: 'Route 2', val: c2.total, col: C.pink, y: BY + (NARROW ? 104 : 68) },
    ];
    k.push(s('text', {
      x: BX + 12, y: BY + 19, fill: C.muted, 'font-size': 11, 'font-weight': 700, 'font-family': 'Consolas'
    }, 'DISCOUNTED RETURN'));
    for (const row of barRows) {
      if (NARROW) {
        k.push(s('text', { x: barLeft, y: row.y - 6, fill: row.col, 'font-size': 12, 'font-weight': 700, 'font-family': 'Consolas' },
          `${row.lbl}: ${fmtVal(row.val)}`));
      } else {
        k.push(s('text', { x: BX + 12, y: row.y + 14, fill: row.col, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas' }, row.lbl));
      }
      const w = Math.max(3, (row.val / maxScale) * barMaxW);
      k.push(s('rect', { x: barLeft, y: row.y, width: barMaxW, height: 18, rx: 5, fill: '#141c38' }));
      k.push(s('rect', { x: barLeft, y: row.y, width: w, height: 18, rx: 5, fill: row.col, 'fill-opacity': 0.85 }));
      if (!NARROW) {
        k.push(s('text', { x: barLeft + barMaxW + 10, y: row.y + 14, fill: row.col, 'font-size': 14, 'font-weight': 700, 'font-family': 'Consolas' },
          fmtVal(row.val)));
      }
    }
    const diff = c1.total - c2.total;
    const winTxt = Math.abs(diff) < 1e-6 ? 'TIE' : (diff > 0 ? 'ROUTE 1 WINS' : 'ROUTE 2 WINS');
    const winCol = Math.abs(diff) < 1e-6 ? C.amber : (diff > 0 ? C.cyan : C.pink);
    if (NARROW) {
      k.push(s('text', { x: BX + BW / 2, y: BY + BH - 14, fill: winCol, 'font-size': 12, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, winTxt));
    } else {
      k.push(s('text', { x: BX + BW - 12, y: BY + 19, fill: winCol, 'font-size': 12, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, winTxt));
    }

    // --- 3. GROWING CUMULATIVE RETURN CURVE ----------------------------------
    const CX0 = NARROW ? 12 : 254, CY0 = NARROW ? 204 : 126;
    const CW = NARROW ? 376 : 430, CH = NARROW ? 114 : 108;
    k.push(s('rect', { x: CX0, y: CY0, width: CW, height: CH, rx: 10, fill: C.bg, stroke: '#26305a' }));
    k.push(s('text', { x: CX0 + 12, y: CY0 + 18, fill: C.muted, 'font-size': 11, 'font-weight': 700, 'font-family': 'Consolas' },
      'CUMULATIVE DISCOUNTED RETURN BY MOVE'));
    const px0 = CX0 + 38, px1 = CX0 + CW - 16, py0 = CY0 + 28, py1 = CY0 + CH - 22;
    const gx = m => px0 + (m / MMAX) * (px1 - px0);
    const gy = v => py1 - (v / maxScale) * (py1 - py0);
    k.push(
      s('line', { x1: px0, x2: px1, y1: py1, y2: py1, stroke: C.line }),
      s('line', { x1: px0, x2: px1, y1: py0, y2: py0, stroke: C.line, 'stroke-dasharray': '4 4' }),
      s('text', { x: px0 - 6, y: py1 + 4, fill: C.muted, 'font-size': 10, 'text-anchor': 'end', 'font-family': 'Consolas' }, '0'),
      s('text', { x: px0 - 6, y: py0 + 4, fill: C.muted, 'font-size': 10, 'text-anchor': 'end', 'font-family': 'Consolas' }, fmtVal(maxScale))
    );
    for (let m = 0; m <= MMAX; m++) {
      k.push(s('text', { x: gx(m), y: py1 + 14, fill: C.muted, 'font-size': 10, 'text-anchor': 'middle', 'font-family': 'Consolas' }, String(m)));
    }
    const drawCurve = (cumArr, col) => {
      const lim = Math.min(stepIdx, cumArr.length - 1);
      if (lim < 0) return;
      const pts = [];
      for (let m = 0; m <= lim; m++) pts.push(`${gx(m)},${gy(cumArr[m])}`);
      if (pts.length > 1) {
        k.push(s('polyline', { points: pts.join(' '), fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
      }
      for (let m = 0; m <= lim; m++) {
        k.push(s('circle', { cx: gx(m), cy: gy(cumArr[m]), r: 4, fill: col }));
      }
    };
    drawCurve(c1.cum, C.cyan);
    drawCurve(c2.cum, C.pink);

    // --- 4. TWO REWARD TIMELINES (gold rewards + purple discounted) ----------
    const TX = NARROW ? 12 : 16, TY = NARROW ? 334 : 254;
    const TW = NARROW ? 376 : 668, TH = NARROW ? 240 : 198;
    k.push(s('rect', { x: TX, y: TY, width: TW, height: TH, rx: 10, fill: C.bg, stroke: '#26305a' }));

    const colLeft = TX + (NARROW ? 46 : 86), colRight = TX + TW - 14;
    const colW = (colRight - colLeft) / MMAX;
    const colX = i => colLeft + colW * (i + 0.5);

    for (let i = 0; i < MMAX; i++) {
      const w = Math.pow(gamma, i);
      k.push(
        s('text', { x: colX(i), y: TY + 19, fill: C.muted, 'font-size': NARROW ? 10 : 12, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `M${i + 1}`),
        s('text', { x: colX(i), y: TY + 35, fill: C.violet, 'font-size': NARROW ? 10 : 12, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `×${fmtVal(w)}`)
      );
    }

    const drawTimelineRow = (which, rewards, calc, yTop, col, label) => {
      const bw = Math.min(NARROW ? 44 : 62, colW - 8);
      k.push(s('text', { x: TX + 10, y: yTop + 18, fill: col, 'font-size': NARROW ? 12 : 13, 'font-weight': 700, 'font-family': 'Consolas' }, label));
      k.push(s('text', { x: TX + 10, y: yTop + 47, fill: C.violet, 'font-size': NARROW ? 10 : 11, 'font-family': 'Consolas' }, NARROW ? 'disc.' : 'discounted'));
      for (let i = 0; i < rewards.length; i++) {
        const active = i < stepIdx;
        const cx = colX(i), rv = rewards[i], dv = calc.disc[i].dv;
        const gTile = s('rect', {
          x: cx - bw / 2, y: yTop, width: bw, height: 26, rx: 6,
          fill: rv > 0 ? C.amber : '#151d38', 'fill-opacity': active ? (rv > 0 ? 0.2 : 0.9) : 0.3,
          stroke: rv > 0 ? C.amber : '#344264', 'stroke-width': active ? 1.8 : 1,
          style: 'cursor:pointer'
        });
        gTile.addEventListener('click', () => bumpReward(which, i));
        k.push(gTile);
        k.push(s('text', {
          x: cx, y: yTop + 18, fill: rv > 0 ? C.amber : C.muted, 'fill-opacity': active ? 1 : 0.4,
          'font-size': NARROW ? 12 : 14, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas',
          'pointer-events': 'none'
        }, String(rv)));

        k.push(s('rect', {
          x: cx - bw / 2, y: yTop + 31, width: bw, height: 24, rx: 6,
          fill: C.violet, 'fill-opacity': active ? (dv > 0 ? 0.22 : 0.08) : 0.04,
          stroke: C.violet, 'stroke-opacity': active ? 0.8 : 0.25, 'stroke-width': 1.4
        }));
        k.push(s('text', {
          x: cx, y: yTop + 47, fill: C.violet, 'fill-opacity': active ? 1 : 0.25,
          'font-size': NARROW ? 11 : 13, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, active ? fmtVal(dv) : '·'));
      }
    };

    drawTimelineRow(1, r1, c1, TY + (NARROW ? 50 : 48), C.cyan, NARROW ? 'R1' : 'Route 1');
    drawTimelineRow(2, r2, c2, TY + (NARROW ? 132 : 122), C.pink, NARROW ? 'R2' : 'Route 2');

    k.push(s('text', {
      x: TX + TW / 2, y: TY + TH - 10, fill: C.muted, 'font-size': NARROW ? 10 : 11,
      'text-anchor': 'middle', 'font-family': 'Segoe UI, sans-serif'
    }, 'Gold = real reward (tap to change)   ·   Purple = discounted value'));

    svg.replaceChildren(...k);

    // --- Formula box & readouts ----------------------------------------------
    gammaRead.textContent = `factor = ${fmtVal(gamma)}`;
    iterRead.textContent = `Move ${stepIdx} / ${MMAX}`;

    const lines = [[`discount factor = ${fmtVal(gamma)}`, C.amber]];
    if (stepIdx > 0 && stepIdx < MMAX) {
      const idx = stepIdx - 1;
      const w = Math.pow(gamma, idx);
      lines.push([`Move ${stepIdx} weight = ${fmtVal(gamma)}^${idx} = ${fmtVal(w)}`, C.violet]);
      if (idx < r1.length) {
        lines.push([`R1 move ${stepIdx}: ${r1[idx]} × ${fmtVal(w)} = ${fmtVal(c1.disc[idx].dv)}  (sum ${fmtVal(c1.total)})`, C.cyan]);
      } else {
        lines.push([`R1 finished: return = ${fmtVal(c1.total)}`, C.cyan]);
      }
      if (idx < r2.length) {
        lines.push([`R2 move ${stepIdx}: ${r2[idx]} × ${fmtVal(w)} = ${fmtVal(c2.disc[idx].dv)}  (sum ${fmtVal(c2.total)})`, C.pink]);
      }
    } else {
      const sumExpr = (arr, calc) => arr.length <= 4
        ? arr.map((v, i) => `${v}×${fmtVal(calc.disc[i].w)}`).join(' + ')
        : `${arr.length} moves discounted`;
      lines.push([`Route 1 (${p1.join('→')}):`, C.cyan]);
      lines.push(`  ${sumExpr(r1, c1)} = ${fmtVal(c1.total)}`);
      lines.push([`Route 2 (${p2.join('→')}):`, C.pink]);
      lines.push(`  ${sumExpr(r2, c2)} = ${fmtVal(c2.total)}`);
      lines.push([Math.abs(diff) < 1e-6 ? `Tie! Both = ${fmtVal(c1.total)}`
        : (diff > 0 ? `Route 1 wins (${fmtVal(c1.total)} > ${fmtVal(c2.total)})`
          : `Route 2 wins (${fmtVal(c2.total)} > ${fmtVal(c1.total)})`), winCol]);
    }
    fbox(box, lines);

    const real1 = r1.reduce((a, b) => a + b, 0), real2 = r2.reduce((a, b) => a + b, 0);
    note.textContent = `Real rewards earned: Route 1 = ${real1}, Route 2 = ${real2}. ` +
      (Math.abs(gamma - 1) < 1e-6
        ? 'At discount factor 1, waiting has no penalty at all.'
        : gamma <= 0.101
          ? 'At a very small discount factor, rewards even a few moves away shrink to almost zero.'
          : 'Discounting only changes how we value rewards when comparing routes.');

    chal.update({
      gamma, r1, r2, p1, p2,
      ret1: c1.fullTotal, ret2: c2.fullTotal,
      randomRuns
    });
  }

  draw();
  return () => stopPlay();
}
