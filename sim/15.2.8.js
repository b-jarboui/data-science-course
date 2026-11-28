// 15.2.8 Try it: Q-learning on the 4-cell warehouse.
// Learners step through updates one by one, tap any arrow to force that move,
// press Play with adjustable speed, explore learning rate / discount / exploration,
// watch the absolute error curve grow, try fresh random rewards/starts, and solve 4 challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;
  const ORANGE = '#fb923c';
  const r2 = x => Math.round(x * 100) / 100;

  // All 6 allowed moves in the fixed 4-cell warehouse (order gives clean tie-breaking when eps = 0)
  const MOVES = {
    AB: { id: 'AB', from: 'A', to: 'B', dir: 'right', dock: false },
    AC: { id: 'AC', from: 'A', to: 'C', dir: 'down',  dock: false },
    BD: { id: 'BD', from: 'B', to: 'D', dir: 'down',  dock: true  },
    BA: { id: 'BA', from: 'B', to: 'A', dir: 'left',  dock: false },
    CD: { id: 'CD', from: 'C', to: 'D', dir: 'right', dock: true  },
    CA: { id: 'CA', from: 'C', to: 'A', dir: 'up',    dock: false },
  };
  const KEYS = ['AB', 'AC', 'BD', 'BA', 'CD', 'CA'];
  const FROM = { A: ['AB', 'AC'], B: ['BD', 'BA'], C: ['CD', 'CA'], D: [] };
  const DEMO_SEQ = ['BD', 'AB', 'BD']; // Exact lesson steps 1-3 on Reset

  // State (full floating-point precision internally; rounded only for display)
  let q = { AB: 0, AC: 0, BD: 0, BA: 0, CD: 0, CA: 0 };
  let tried = { AB: 0, AC: 0, BD: 0, BA: 0, CD: 0, CA: 0 };
  let cart = 'B';
  let steps = 0;
  let deliveries = 0;
  let dockReward = 10;
  let alpha = 0.5;
  let gamma = 0.5;
  let eps = 50; // exploration percent (0..100)
  let speed = 4; // steps per second
  let isDefaultRun = true;
  let lastStep = null;
  let errors = []; // [{ step, absErr }]
  let timer = null;

  // DOM structure
  const gridSvg = s('svg', { viewBox: '0 0 640 310' });
  const chartSvg = s('svg', { viewBox: '0 0 640 165' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const stepPill = pill('STEP 0', C.cyan);
  const delivPill = pill('DELIVERIES 0', C.green);
  const rewardPill = pill('DOCK +10', C.amber);

  function sliderRow(label, min, max, step, value, fmtVal, onInput) {
    const out = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.cyan, minWidth: '3.6rem', textAlign: 'right' } }, fmtVal(value));
    const input = h('input', {
      type: 'range', min, max, step, value,
      style: { flex: '1 1 8rem', accentColor: C.cyan },
      oninput: e => { const v = +e.target.value; out.textContent = fmtVal(v); onInput(v); }
    });
    const row = h('label', { class: 'sim-row', style: { marginTop: '.45rem', justifyContent: 'space-between', fontSize: '.92rem' } },
      h('span', { style: { minWidth: '7.6rem', color: '#cfd7f2' } }, label), input, out);
    return { row, set(v) { input.value = v; out.textContent = fmtVal(v); } };
  }

  const alphaCtrl = sliderRow('Learning rate', 0.1, 2.2, 0.1, alpha, v => v.toFixed(1), v => { alpha = v; isDefaultRun = false; draw(); });
  const gammaCtrl = sliderRow('Discount factor', 0, 0.9, 0.1, gamma, v => v.toFixed(1), v => { gamma = v; isDefaultRun = false; draw(); });
  const epsCtrl   = sliderRow('Exploration', 0, 100, 5, eps, v => v + '%', v => { eps = v; isDefaultRun = false; draw(); });
  const speedCtrl = sliderRow('Speed', 1, 20, 1, speed, v => v + '/s', v => { speed = v; if (timer) { stop(); start(); } });

  const playBtn = btn('Play', () => (timer ? stop() : start()), 'go');
  const stepBtn = btn('Step', () => { stop(); takeStep(); }, 'go');

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: Q-learning in the warehouse'),
    h('p', { class: 'sub' }, 'Press Step or Play to watch the cart learn an action value for every move, or tap any arrow to force that move right now.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', style: { marginTop: 0, marginBottom: '.55rem' } }, stepPill, delivPill, rewardPill),
        gridSvg,
        h('div', { style: { marginTop: '.55rem' } }, chartSvg),
        h('div', { class: 'sim-row' },
          stepBtn,
          playBtn,
          btn('Reset', () => reset(false)),
          btn('New data', () => reset(true))),
        alphaCtrl.row,
        gammaCtrl.row,
        epsCtrl.row,
        speedCtrl.row),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  // True optimal Q-values for the current dockReward and gamma
  function trueQ() {
    const R = dockReward, g = gamma;
    return { BD: R, CD: R, AB: g * R, AC: g * R, BA: g * g * R, CA: g * g * R };
  }
  function maxTrueGap() {
    const opt = trueQ();
    return Math.max(...KEYS.map(k => Math.abs(q[k] - opt[k])));
  }

  // Self-checking challenges (4, easy to deeper)
  const chal = challenges(ch, [
    {
      text: 'Press Step 3 times (from Reset) to replay the lesson’s first 3 updates: Q(B, down) = 7.5 and Q(A, right) = 1.25.',
      check: st => Math.abs(st.q.BD - 7.5) < 0.01 && Math.abs(st.q.AB - 1.25) < 0.01 && st.steps >= 3,
      why: 'Exact match! B → down learned 5 from the dock, A → right learned 1.25 from that 5, and B → down improved to 7.5.'
    },
    {
      text: 'Press Play and let the cart explore until all 6 action values settle close to their true values (max gap under 0.25).',
      check: st => st.steps >= 10 && st.gap < 0.25,
      why: 'All 6 action values settled! Because every move was tried many times, the errors shrank toward zero.'
    },
    {
      text: 'Press Reset, set Exploration to 0%, then press Play for at least 15 steps. Watch which moves stay stuck at 0.',
      check: st => st.eps === 0 && st.steps >= 15 && st.untried >= 2,
      why: 'With 0% exploration, the cart never tries the other moves, so their action values stay stuck at 0 forever.'
    },
    {
      text: 'Will it settle with a huge learning rate? Press Reset, raise Learning rate to 2.0 or more, and press Play for at least 12 steps.',
      check: st => st.alpha >= 2.0 && st.steps >= 12 && st.gap > 5,
      why: 'It fails to settle! A learning rate of 2.0 or more over-corrects past the target on every update, making values bounce.'
    },
  ]);

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    playBtn.textContent = 'Play';
  }
  function start() {
    stop();
    playBtn.textContent = 'Pause';
    timer = setInterval(() => takeStep(), Math.max(40, Math.round(1000 / speed)));
  }

  function reset(isNewData) {
    stop();
    steps = 0;
    deliveries = 0;
    lastStep = null;
    errors = [];
    for (const k of KEYS) tried[k] = 0;
    if (isNewData) {
      dockReward = rnd(3, 10) * 2; // random even reward 6..20
      for (const k of KEYS) q[k] = rnd(0, 4);
      cart = 'A';
      isDefaultRun = false;
    } else {
      dockReward = 10;
      alpha = 0.5; gamma = 0.5; eps = 50;
      alphaCtrl.set(alpha); gammaCtrl.set(gamma); epsCtrl.set(eps);
      for (const k of KEYS) q[k] = 0;
      cart = 'B';
      isDefaultRun = true;
    }
    draw();
  }

  function applyMove(moveId) {
    const m = MOVES[moveId];
    const r = m.dock ? dockReward : 0;
    const nextMoves = FROM[m.to];
    const maxNext = nextMoves.length ? Math.max(...nextMoves.map(k => q[k])) : 0;
    const target = r + gamma * maxNext;
    const oldQ = q[moveId];
    const err = target - oldQ;
    const change = alpha * err;
    const newQ = oldQ + change;
    q[moveId] = newQ;
    tried[moveId]++;
    steps++;
    if (m.dock) deliveries++;
    cart = m.to;
    errors.push({ step: steps, absErr: Math.abs(err) });
    if (errors.length > 160) errors.shift();
    lastStep = { step: steps, moveId, from: m.from, to: m.to, dir: m.dir, r, maxNext, target, oldQ, err, change, newQ };
    draw();
  }

  function chooseAutoMove() {
    // Follow exact lesson steps 1-3 when starting from default Reset
    if (isDefaultRun && steps < DEMO_SEQ.length) {
      const id = DEMO_SEQ[steps];
      cart = MOVES[id].from;
      return id;
    }
    if (cart === 'D') cart = 'A';
    const opts = FROM[cart];
    if (Math.random() * 100 < eps) {
      return opts[Math.floor(Math.random() * opts.length)];
    }
    // Greedy: pick highest Q (ties broken cleanly by first move in opts)
    return q[opts[0]] >= q[opts[1]] ? opts[0] : opts[1];
  }

  function takeStep() {
    const id = chooseAutoMove();
    applyMove(id);
  }

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const GW = NARROW ? 420 : 640, GH = NARROW ? 310 : 310;
  const F = NARROW ? 1.15 : 1;
  gridSvg.setAttribute('viewBox', `0 0 ${GW} ${GH}`);
  chartSvg.setAttribute('viewBox', `0 0 ${GW} 165`);

  const PADX = NARROW ? 16 : 44, PADY = 14;
  const CW = (GW - 2 * PADX) / 2, CH = (GH - 2 * PADY) / 2;
  const BOX = {
    A: { x: PADX,      y: PADY },
    B: { x: PADX + CW, y: PADY },
    C: { x: PADX,      y: PADY + CH },
    D: { x: PADX + CW, y: PADY + CH },
  };
  const CC = k => ({ x: BOX[k].x + CW / 2, y: BOX[k].y + CH / 2 });
  const CART_XY = {
    A: { x: BOX.A.x + CW * 0.44, y: BOX.A.y + CH * 0.44 },
    B: { x: BOX.B.x + CW * 0.56, y: BOX.B.y + CH * 0.36 },
    C: { x: BOX.C.x + CW * 0.38, y: BOX.C.y + CH * 0.58 },
    D: { x: BOX.D.x + CW * 0.52, y: BOX.D.y + CH * 0.38 },
  };
  const A_GEOM = {
    AB: { x1: BOX.A.x + CW - 44, y1: BOX.A.y + CH * 0.34, x2: BOX.B.x + 44, y2: BOX.A.y + CH * 0.34, lx: BOX.A.x + CW - 42, ly: BOX.A.y + CH * 0.18 },
    BA: { x1: BOX.B.x + 44, y1: BOX.B.y + CH * 0.68, x2: BOX.A.x + CW - 44, y2: BOX.B.y + CH * 0.68, lx: BOX.B.x + 42, ly: BOX.B.y + CH * 0.87 },
    AC: { x1: BOX.A.x + CW * 0.34, y1: BOX.A.y + CH - 28, x2: BOX.A.x + CW * 0.34, y2: BOX.C.y + 28, lx: BOX.A.x + CW * 0.15, ly: BOX.A.y + CH - 22 },
    CA: { x1: BOX.C.x + CW * 0.66, y1: BOX.C.y + 28, x2: BOX.C.x + CW * 0.66, y2: BOX.A.y + CH - 28, lx: BOX.C.x + CW * 0.84, ly: BOX.C.y + 30 },
    BD: { x1: BOX.B.x + CW * 0.60, y1: BOX.B.y + CH - 28, x2: BOX.B.x + CW * 0.60, y2: BOX.D.y + 28, lx: BOX.B.x + CW * 0.81, ly: BOX.B.y + CH - 22 },
    CD: { x1: BOX.C.x + CW - 44, y1: BOX.C.y + CH * 0.64, x2: BOX.D.x + 44, y2: BOX.C.y + CH * 0.64, lx: BOX.C.x + CW - 42, ly: BOX.C.y + CH * 0.85 },
  };

  function arrowElems(k, col, sw, glowOp) {
    const g = A_GEOM[k];
    const dx = g.x2 - g.x1, dy = g.y2 - g.y1, len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len, hl = 12, a = 0.52;
    const cs = Math.cos(a), sn = Math.sin(a);
    const p1x = g.x2 - hl * (ux * cs - uy * sn), p1y = g.y2 - hl * (uy * cs + ux * sn);
    const p2x = g.x2 - hl * (ux * cs + uy * sn), p2y = g.y2 - hl * (uy * cs - ux * sn);
    const grp = s('g', { style: 'cursor:pointer' });
    grp.addEventListener('click', () => { stop(); isDefaultRun = false; applyMove(k); });
    grp.append(
      s('line', { x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2, stroke: col, 'stroke-width': sw + 8, 'stroke-opacity': glowOp, 'stroke-linecap': 'round' }),
      s('line', { x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2, stroke: col, 'stroke-width': sw, 'stroke-linecap': 'round' }),
      s('path', { d: `M ${p1x} ${p1y} L ${g.x2} ${g.y2} L ${p2x} ${p2y}`, fill: 'none', stroke: col, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      s('line', { x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2, stroke: 'transparent', 'stroke-width': 28 })
    );
    return grp;
  }

  function drawGrid() {
    const kids = [];
    for (const name of ['A', 'B', 'C', 'D']) {
      const b = BOX[name], isDock = name === 'D';
      kids.push(s('rect', {
        x: b.x, y: b.y, width: CW, height: CH, rx: 8,
        fill: isDock ? C.green : C.bg, 'fill-opacity': isDock ? 0.14 : 0.72,
        stroke: isDock ? C.green : '#394870', 'stroke-width': isDock ? 2.5 : 1.8
      }));
      kids.push(s('text', {
        x: b.x + 14, y: b.y + 24, fill: isDock ? C.green : C.ink,
        'font-size': 16 * F, 'font-weight': 700, 'font-family': 'Consolas, monospace'
      }, name));
    }
    const dc = CC('D');
    kids.push(
      s('text', { x: dc.x, y: dc.y + 32, fill: C.green, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace' }, 'DOCK'),
      s('text', { x: dc.x, y: dc.y + 52, fill: C.amber, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace' }, `+${dockReward} pts`)
    );

    // Determine best moves per cell (only when Q-values differ)
    const best = new Set();
    for (const c of ['A', 'B', 'C']) {
      const [m1, m2] = FROM[c];
      if (Math.abs(q[m1] - q[m2]) > 0.05) best.add(q[m1] > q[m2] ? m1 : m2);
      else if (q[m1] > 0.05) { best.add(m1); best.add(m2); }
    }

    // Draw all 6 arrows (highlight ONLY the updated move in bright orange)
    for (const k of KEYS) {
      const active = lastStep && lastStep.moveId === k;
      const isBest = best.has(k);
      const col = active ? ORANGE : (isBest ? C.green : '#7c8bb5');
      const sw = active ? 4.5 : (isBest ? 3.2 : 2.3);
      const gop = active ? 0.42 : (isBest ? 0.22 : 0.08);
      kids.push(arrowElems(k, col, sw, gop));

      const g = A_GEOM[k];
      const valStr = fmt(r2(q[k]));
      if (active) {
        kids.push(s('rect', {
          x: g.lx - 26 * F, y: g.ly - 13 * F, width: 52 * F, height: 22 * F, rx: 11 * F,
          fill: C.bg, stroke: ORANGE, 'stroke-width': 1.8
        }));
      }
      kids.push(s('text', {
        x: g.lx, y: g.ly + 4, fill: active ? ORANGE : (tried[k] > 0 ? ORANGE : C.muted),
        'font-size': (active ? 15 : 14) * F, 'font-weight': 700, 'text-anchor': 'middle',
        'font-family': 'Consolas, monospace', style: 'pointer-events:none'
      }, valStr));
    }

    // White delivery cart
    const cp = CART_XY[cart];
    kids.push(
      s('rect', { x: cp.x - 19, y: cp.y - 11, width: 38, height: 19, rx: 5, fill: C.ink, stroke: C.ink }),
      s('line', { x1: cp.x - 19, y1: cp.y - 8, x2: cp.x - 27, y2: cp.y - 16, stroke: C.ink, 'stroke-width': 2.8, 'stroke-linecap': 'round' }),
      s('circle', { cx: cp.x - 11, cy: cp.y + 11, r: 5, fill: C.bg, stroke: C.ink, 'stroke-width': 2 }),
      s('circle', { cx: cp.x + 11, cy: cp.y + 11, r: 5, fill: C.bg, stroke: C.ink, 'stroke-width': 2 })
    );

    gridSvg.replaceChildren(...kids);
  }

  function drawChart() {
    const X0 = 42, X1 = GW - 14, Y0 = 26, Y1 = 136;
    const maxErr = Math.max(10, dockReward, ...errors.map(e => e.absErr));
    const kids = [
      s('rect', { x: 0, y: 0, width: GW, height: 165, rx: 10, fill: C.bg, stroke: '#273459' }),
      s('text', { x: X0, y: 17, fill: C.pink, 'font-size': 12.5 * F, 'font-weight': 700, 'font-family': 'Consolas, monospace' }, 'Absolute error |target − old Q| over steps'),
      s('line', { x1: X0, x2: X1, y1: Y1, y2: Y1, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: X0, x2: X0, y1: Y0, y2: Y1, stroke: C.muted, 'stroke-width': 1.5 }),
      s('text', { x: X0 - 6, y: Y0 + 4, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas, monospace' }, fmt(r2(maxErr))),
      s('text', { x: X0 - 6, y: Y1 + 4, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas, monospace' }, '0'),
      s('text', { x: X1, y: Y1 + 18, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas, monospace' }, `step ${steps}`),
    ];

    if (errors.length === 1) {
      const y = Y1 - (Math.min(maxErr, errors[0].absErr) / maxErr) * (Y1 - Y0);
      kids.push(s('circle', { cx: X0 + 6, cy: y, r: 4, fill: C.pink }));
    } else if (errors.length > 1) {
      const pts = errors.map((e, i) => {
        const x = X0 + (i / (errors.length - 1)) * (X1 - X0);
        const y = Y1 - (Math.min(maxErr, e.absErr) / maxErr) * (Y1 - Y0);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      kids.push(s('polyline', { points: pts, fill: 'none', stroke: C.pink, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }));
      const last = errors[errors.length - 1];
      const ly = Y1 - (Math.min(maxErr, last.absErr) / maxErr) * (Y1 - Y0);
      kids.push(s('circle', { cx: X1, cy: ly, r: 4, fill: C.amber }));
    } else {
      kids.push(s('text', { x: (X0 + X1) / 2, y: (Y0 + Y1) / 2 + 4, fill: C.muted, 'font-size': 12.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace' }, 'Press Step, Play, or tap an arrow to plot errors'));
    }
    chartSvg.replaceChildren(...kids);
  }

  function draw() {
    stepPill.textContent = `STEP ${steps}`;
    delivPill.textContent = `DELIVERIES ${deliveries}`;
    rewardPill.textContent = `DOCK +${dockReward}`;
    drawGrid();
    drawChart();

    const opt = trueQ(), gap = maxTrueGap();
    const untried = KEYS.filter(k => tried[k] === 0).length;

    if (!lastStep) {
      fbox(box, [
        [`discount = ${gamma.toFixed(1)} · rate = ${alpha.toFixed(1)}`, C.cyan],
        [`exploration = ${eps}% · dock = +${dockReward}`, C.amber],
        ['Press Step or tap any arrow', ORANGE],
      ]);
      note.textContent = 'Each orange number beside an arrow is that move’s action value (Q-value). Tap an arrow to run that exact move, or press Step / Play.';
    } else {
      const st = lastStep;
      fbox(box, [
        [`Step ${st.step}: ${st.from} → ${st.dir} (${st.to})`, ORANGE],
        [`target = ${st.r} + ${gamma.toFixed(1)} × ${fmt(r2(st.maxNext))} = ${fmt(r2(st.target))}`, C.amber],
        [`error  = ${fmt(r2(st.target))} − ${fmt(r2(st.oldQ))} = ${fmt(r2(st.err))}`, C.pink],
        [`new Q  = ${fmt(r2(st.oldQ))} + ${alpha.toFixed(1)} × ${fmt(r2(st.err))} = ${fmt(r2(st.newQ))}`, C.green],
      ]);
      note.textContent = `Max gap from true optimal Q-values: ${fmt(r2(gap))} (true A: ${fmt(r2(opt.AB))}, B↓/C→: ${fmt(r2(opt.BD))}, B←/C↑: ${fmt(r2(opt.BA))}). Untried moves: ${untried}.`;
    }

    chal.update({ q, steps, eps, alpha, gap, untried });
  }

  draw();
  return () => stop();
}
