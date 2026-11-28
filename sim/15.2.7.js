// 15.2.7 Try it: Temporal-difference learning (TD(0)) on the 4-cell warehouse grid.
// Step through updates one move at a time, Play/Pause with a speed slider, tune learning rate
// and discount factor, toggle shrinking learning rate, tap a cell to move the cart, and test challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;

  // Fixed policy transitions: A (50% B, 50% C), B (50% A, 50% D), C (100% D)
  const POLICY = {
    A: [{ to: 'B', p: 0.5 }, { to: 'C', p: 0.5 }],
    B: [{ to: 'A', p: 0.5 }, { to: 'D', p: 0.5 }],
    C: [{ to: 'D', p: 1.0 }],
  };
  const GUIDED = [
    { from: 'B', to: 'D' },
    { from: 'A', to: 'B' },
    { from: 'B', to: 'D' },
  ];

  // Exact state values under the fixed policy for any dock reward R and discount factor g
  function trueVals(R, g) {
    const vC = R;
    const vA = (0.75 * g * R) / (1 - 0.25 * g * g);
    const vB = 0.5 * R + 0.5 * g * vA;
    return { A: vA, B: vB, C: vC, D: 0 };
  }

  let V = { A: 0, B: 0, C: 0, D: 0 };
  let visits = { A: 0, B: 0, C: 0 };
  let reward = 10, gamma = 0.5, lr = 0.5, decay = false, speed = 8;
  let cart = 'B', guided = true, guidedIdx = 0, isRandom = false;
  let steps = 0, deliveries = 0, playing = false, raf = 0, lastTick = 0, accum = 0;
  let last = null; // { from, to, r, oldV, nextV, disc, target, err, effLr, change, newV }
  let history = []; // [{ step, absErr, avgGap }]
  let sawBootstrap = false, highLrSteps = 0;

  const svg = s('svg', { viewBox: '0 0 700 410' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const stepPill = pill('STEP 0 · DELIVERIES 0', C.cyan);
  const gapPill = pill('AVG GAP —', C.green);

  const lrVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.ink } }, '0.50');
  const lrIn = h('input', {
    type: 'range', min: '0.05', max: '0.95', step: '0.05', value: '0.50',
    oninput: e => { lr = +e.target.value; lrVal.textContent = lr.toFixed(2); draw(); }
  });
  const gVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.ink } }, '0.50');
  const gIn = h('input', {
    type: 'range', min: '0', max: '0.9', step: '0.1', value: '0.5',
    oninput: e => { gamma = +e.target.value; gVal.textContent = gamma.toFixed(2); draw(); }
  });
  const spVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.ink } }, '8/s');
  const spIn = h('input', {
    type: 'range', min: '1', max: '60', step: '1', value: '8',
    oninput: e => { speed = +e.target.value; spVal.textContent = `${speed}/s`; }
  });

  const playBtn = btn('Play', () => togglePlay());
  const decayBtn = btn('Shrink lr: OFF', () => {
    decay = !decay;
    decayBtn.textContent = decay ? 'Shrink lr: ON' : 'Shrink lr: OFF';
    decayBtn.className = 'sim-btn ' + (decay ? 'go' : '');
    draw();
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: temporal-difference learning'),
    h('p', { class: 'sub' }, 'Press Step to watch one move and one update, or Play to run many deliveries. Tap cell A, B, or C to place the cart there.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', style: { marginTop: 0, marginBottom: '.6rem' } }, stepPill, gapPill),
        svg,
        h('div', { class: 'sim-row' },
          btn('Step', () => { pause(); doStep(); draw(); }, 'go'),
          playBtn,
          decayBtn,
          btn('Reset', () => reset(false)),
          btn('New start (random)', () => reset(true))),
        h('div', { class: 'sim-row', style: { gap: '.85rem' } },
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.45rem' } }, 'Learning rate', lrIn, lrVal),
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.45rem' } }, 'Discount', gIn, gVal),
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.45rem' } }, 'Speed', spIn, spVal))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Press Step three times from Reset. Watch cell A learn 1.25 before the cart reaches the dock.',
      check: st => st.steps >= 3 && st.sawBootstrap,
      why: 'Yes! Cell A updated from cell B’s estimate even though the move earned 0. That is bootstrapping.'
    },
    {
      text: 'Turn “Shrink lr” ON, press Play, and get the average gap below 0.35 from the true values.',
      check: st => st.decay && st.steps >= 30 && st.avgGap < 0.35,
      why: 'Nice! With enough moves and a shrinking learning rate, the estimates settle near the true values.'
    },
    {
      text: 'Turn “Shrink lr” OFF, set learning rate to 0.80 or higher, and run at least 40 steps. Watch the estimates bounce.',
      check: st => !st.decay && st.lr >= 0.8 && st.highLrSteps >= 40,
      why: 'Right: a large fixed learning rate lets each move pull the estimate strongly, so it never settles.'
    },
    {
      text: 'Press “New start (random)”, turn “Shrink lr” ON, and press Play until the average gap drops below 0.50.',
      check: st => st.isRandom && st.decay && st.steps >= 30 && st.avgGap < 0.5,
      why: 'Even from random starting guesses and a new dock reward, TD learning discovers the true values.'
    }
  ]);

  function avgGap() {
    const tv = trueVals(reward, gamma);
    return (Math.abs(V.A - tv.A) + Math.abs(V.B - tv.B) + Math.abs(V.C - tv.C)) / 3;
  }

  function doStep() {
    let from, to;
    if (guided && guidedIdx < GUIDED.length) {
      ({ from, to } = GUIDED[guidedIdx++]);
    } else {
      guided = false;
      from = cart === 'D' ? 'A' : cart;
      const opts = POLICY[from];
      to = Math.random() < opts[0].p ? opts[0].to : (opts[1] ? opts[1].to : opts[0].to);
    }
    const r = to === 'D' ? reward : 0;
    const oldV = V[from];
    const nextV = V[to];
    const disc = gamma * nextV;
    const target = r + disc;
    const err = target - oldV;
    visits[from]++;
    const effLr = decay ? lr / (1 + 0.12 * (visits[from] - 1)) : lr;
    const change = effLr * err;
    const newV = oldV + change;
    V[from] = newV;
    cart = to;
    steps++;
    if (to === 'D') deliveries++;
    if (r === 0 && Math.abs(change) > 1e-6) sawBootstrap = true;
    if (!decay && lr >= 0.8) highLrSteps++;
    last = { from, to, r, oldV, nextV, disc, target, err, effLr, change, newV };
    history.push({ step: steps, absErr: Math.abs(err), avgGap: avgGap() });
    if (history.length > 240) history.shift();
  }

  function pause() {
    playing = false;
    cancelAnimationFrame(raf);
    playBtn.textContent = 'Play';
  }

  function togglePlay() {
    if (playing) { pause(); return; }
    playing = true;
    playBtn.textContent = 'Pause';
    lastTick = performance.now();
    accum = 0;
    const loop = now => {
      if (!playing) return;
      const dt = Math.min(0.1, (now - lastTick) / 1000);
      lastTick = now;
      accum += dt * speed;
      const n = Math.min(12, Math.floor(accum));
      if (n > 0) {
        accum -= n;
        for (let i = 0; i < n; i++) doStep();
        draw();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  }

  function reset(random) {
    pause();
    isRandom = random;
    if (random) {
      const rewards = [6, 8, 10, 12, 16, 20];
      reward = rewards[rnd(0, rewards.length - 1)];
      V = { A: rnd(0, 12), B: rnd(0, 12), C: rnd(0, 12), D: 0 };
      cart = 'A';
      guided = false;
    } else {
      reward = 10; gamma = 0.5; lr = 0.5; decay = false;
      lrIn.value = '0.50'; lrVal.textContent = '0.50';
      gIn.value = '0.5'; gVal.textContent = '0.50';
      decayBtn.textContent = 'Shrink lr: OFF'; decayBtn.className = 'sim-btn ';
      V = { A: 0, B: 0, C: 0, D: 0 };
      cart = 'B';
      guided = true;
    }
    guidedIdx = 0;
    visits = { A: 0, B: 0, C: 0 };
    steps = 0; deliveries = 0; last = null; history = [];
    sawBootstrap = false; highLrSteps = 0;
    draw();
  }

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 550 : 410;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const CS = 148, GAP = 10;
  const GX0 = NARROW ? (VW - (2 * CS + GAP)) / 2 : 18;
  const GY0 = NARROW ? 14 : 26;
  const cellRect = {
    A: { x: GX0, y: GY0 },
    B: { x: GX0 + CS + GAP, y: GY0 },
    C: { x: GX0, y: GY0 + CS + GAP },
    D: { x: GX0 + CS + GAP, y: GY0 + CS + GAP },
  };

  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    for (const id of ['A', 'B', 'C']) {
      const r = cellRect[id];
      if (p.x >= r.x && p.x <= r.x + CS && p.y >= r.y && p.y <= r.y + CS) {
        pause();
        cart = id;
        guided = false;
        draw();
        return;
      }
    }
  });

  function arrowSvg(x1, y1, x2, y2, col, sw = 2.5, op = 0.7) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, hl = 9, ca = 0.85, sa = 0.53;
    const ax = x2 - hl * (ux * ca - uy * sa), ay = y2 - hl * (ux * sa + uy * ca);
    const bx = x2 - hl * (ux * ca + uy * sa), by = y2 - hl * (-ux * sa + uy * ca);
    return [
      s('line', { x1, y1, x2, y2, stroke: col, 'stroke-width': sw, 'stroke-opacity': op, 'stroke-linecap': 'round' }),
      s('polyline', { points: `${ax},${ay} ${x2},${y2} ${bx},${by}`, fill: 'none', stroke: col, 'stroke-width': sw, 'stroke-opacity': op, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
    ];
  }

  function draw() {
    const tv = trueVals(reward, gamma), ag = avgGap();
    const els = [];

    // 1. Draw 4-cell grid
    for (const id of ['A', 'B', 'C', 'D']) {
      const { x, y } = cellRect[id];
      const isDock = id === 'D';
      const isUpdated = last && last.from === id;
      els.push(s('rect', {
        x, y, width: CS, height: CS, rx: 12,
        fill: isUpdated ? C.amber : C.bg,
        'fill-opacity': isUpdated ? 0.10 : 0.95,
        stroke: isUpdated ? C.amber : (isDock ? C.green : '#334168'),
        'stroke-width': isUpdated ? 3.5 : (isDock ? 2.5 : 1.5),
        style: isDock ? '' : 'cursor:pointer'
      }));
      els.push(s('text', {
        x: x + 12, y: y + 23, fill: isDock ? C.green : C.muted,
        'font-size': 15, 'font-weight': 700, 'font-family': 'Consolas, monospace'
      }, id));
      if (isDock) {
        els.push(s('text', {
          x: x + CS / 2, y: y + CS - 14, fill: C.green,
          'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace'
        }, `DOCK (+${reward})`));
      } else {
        els.push(s('text', {
          x: x + CS / 2, y: y + CS - 14, fill: C.muted,
          'font-size': 12, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace'
        }, `true ${fmt(tv[id])}`));
      }
      els.push(s('text', {
        x: x + CS / 2, y: y + CS / 2 + 10, fill: C.cyan,
        'font-size': 28, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace'
      }, fmt(Math.round(V[id] * 100) / 100)));
    }

    // 2. Policy arrows + probabilities
    const midX = GX0 + CS + GAP / 2, midY = GY0 + CS + GAP / 2;
    const polArrows = [
      { f: 'A', t: 'B', x1: midX - 24, y1: GY0 + 50, x2: midX + 24, y2: GY0 + 50, lx: midX, ly: GY0 + 38, lab: '50%' },
      { f: 'B', t: 'A', x1: midX + 24, y1: GY0 + 102, x2: midX - 24, y2: GY0 + 102, lx: midX, ly: GY0 + 122, lab: '50%' },
      { f: 'A', t: 'C', x1: GX0 + CS / 2, y1: midY - 22, x2: GX0 + CS / 2, y2: midY + 22, lx: GX0 + CS / 2 - 26, ly: midY + 4, lab: '50%' },
      { f: 'B', t: 'D', x1: GX0 + CS + GAP + CS / 2, y1: midY - 22, x2: GX0 + CS + GAP + CS / 2, y2: midY + 22, lx: GX0 + CS + GAP + CS / 2 + 26, ly: midY + 4, lab: '50%' },
      { f: 'C', t: 'D', x1: midX - 24, y1: GY0 + CS + GAP + CS / 2, x2: midX + 24, y2: GY0 + CS + GAP + CS / 2, lx: midX, ly: GY0 + CS + GAP + CS / 2 + 20, lab: '100%' },
    ];
    for (const a of polArrows) {
      const active = last && last.from === a.f && last.to === a.t;
      els.push(...arrowSvg(a.x1, a.y1, a.x2, a.y2, active ? C.amber : C.muted, active ? 4 : 2.2, active ? 1 : 0.65));
      els.push(s('text', {
        x: a.lx, y: a.ly, fill: active ? C.amber : C.muted,
        'font-size': 12, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace'
      }, active ? (last.r > 0 ? `+${last.r}` : '0') : a.lab));
    }

    // 3. White delivery cart inside its current cell
    const cr = cellRect[cart], cx = cr.x + CS - 28, cy = cr.y + 22;
    els.push(
      s('rect', { x: cx - 14, y: cy - 8, width: 28, height: 14, rx: 4, fill: C.ink }),
      s('circle', { cx: cx - 7, cy: cy + 10, r: 3.5, fill: C.ink }),
      s('circle', { cx: cx + 7, cy: cy + 10, r: 3.5, fill: C.ink })
    );

    // Hint below grid on desktop
    if (!NARROW) {
      els.push(s('text', {
        x: GX0 + CS + GAP / 2, y: GY0 + 2 * CS + GAP + 26, fill: C.muted,
        'font-size': 13, 'text-anchor': 'middle', 'font-family': 'Segoe UI, sans-serif'
      }, 'Tap A, B, or C to place the cart'));
    }

    // 4. Growing error & gap curve
    const PX0 = NARROW ? 46 : 388, PX1 = VW - 16;
    const PY0 = NARROW ? 378 : 54, PY1 = NARROW ? 512 : 332;
    els.push(s('text', { x: PX0, y: PY0 - 16, fill: C.pink, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas, monospace' }, '|TD error|'));
    els.push(s('text', { x: PX0 + 96, y: PY0 - 16, fill: C.green, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas, monospace' }, 'avg gap'));
    els.push(s('rect', { x: PX0, y: PY0, width: PX1 - PX0, height: PY1 - PY0, rx: 8, fill: C.bg, stroke: '#26305a' }));

    const maxY = Math.max(reward, 10, ...history.map(h0 => Math.max(h0.absErr, h0.avgGap)));
    const yMap = v => PY1 - (v / maxY) * (PY1 - PY0 - 12) - 4;
    for (const frac of [0, 0.5, 1]) {
      const val = maxY * frac, y = yMap(val);
      els.push(s('line', { x1: PX0, x2: PX1, y1: y, y2: y, stroke: C.line, 'stroke-dasharray': frac === 0 ? '' : '4 4' }));
      els.push(s('text', { x: PX0 - 6, y: y + 4, fill: C.muted, 'font-size': 12, 'text-anchor': 'end', 'font-family': 'Consolas, monospace' }, fmt(Math.round(val * 10) / 10)));
    }
    if (history.length > 0) {
      const xMap = i => PX0 + 8 + (history.length === 1 ? 0 : (i / Math.max(1, history.length - 1)) * (PX1 - PX0 - 16));
      const errPts = history.map((d, i) => `${xMap(i).toFixed(1)},${yMap(d.absErr).toFixed(1)}`).join(' ');
      const gapPts = history.map((d, i) => `${xMap(i).toFixed(1)},${yMap(d.avgGap).toFixed(1)}`).join(' ');
      if (history.length > 1) {
        els.push(s('polyline', { points: errPts, fill: 'none', stroke: C.pink, 'stroke-width': 2, 'stroke-opacity': 0.85 }));
        els.push(s('polyline', { points: gapPts, fill: 'none', stroke: C.green, 'stroke-width': 2.5 }));
      }
      if (history.length <= 20) {
        history.forEach((d, i) => {
          els.push(s('circle', { cx: xMap(i), cy: yMap(d.absErr), r: 3.5, fill: C.pink }));
          els.push(s('circle', { cx: xMap(i), cy: yMap(d.avgGap), r: 3, fill: C.green }));
        });
      }
    } else {
      els.push(s('text', { x: (PX0 + PX1) / 2, y: (PY0 + PY1) / 2 + 4, fill: C.muted, 'font-size': 13, 'text-anchor': 'middle', 'font-family': 'Segoe UI, sans-serif' }, 'Press Step or Play to watch errors grow'));
    }
    els.push(s('text', { x: PX1, y: PY1 + 18, fill: C.muted, 'font-size': 12, 'text-anchor': 'end', 'font-family': 'Consolas, monospace' }, `step ${steps}`));

    svg.replaceChildren(...els);

    // 5. Status pills & formula box
    stepPill.textContent = `STEP ${steps} · DELIVERIES ${deliveries}`;
    gapPill.textContent = `AVG GAP ${fmt(Math.round(ag * 100) / 100)}`;

    if (last) {
      const r2 = x => fmt(Math.round(x * 1000) / 1000);
      fbox(box, [
        [`move: ${last.from} → ${last.to}   reward = ${last.r}`, C.amber],
        [`next (${last.to}) = ${r2(last.nextV)}   disc = ${r2(gamma)}×${r2(last.nextV)} = ${r2(last.disc)}`, C.violet],
        [`target = ${last.r} + ${r2(last.disc)} = ${r2(last.target)}`, C.amber],
        [`error  = ${r2(last.target)} − ${r2(last.oldV)} = ${r2(last.err)}`, C.pink],
        [`change = ${r2(last.effLr)} × ${r2(last.err)} = ${r2(last.change)}`, C.green],
        [`new ${last.from}  = ${r2(last.oldV)} + ${r2(last.change)} = ${r2(last.newV)}`, C.cyan]
      ]);
      note.textContent = last.r === 0 && Math.abs(last.change) > 1e-6
        ? `Bootstrapping: cell ${last.from} updated using cell ${last.to}’s current estimate, before reaching the dock.`
        : `Updated only cell ${last.from}. True policy values for reward ${reward} and discount ${gamma.toFixed(1)}: A=${fmt(Math.round(tv.A * 100) / 100)}, B=${fmt(Math.round(tv.B * 100) / 100)}, C=${fmt(Math.round(tv.C * 100) / 100)}.`;
    } else {
      fbox(box, [
        ['target = reward + discount × next', C.amber],
        ['error  = target − old', C.pink],
        ['new    = old + lr × error', C.green]
      ]);
      note.textContent = `Ready at cell ${cart}. Press Step to see the exact numbers of the next move.`;
    }

    chal.update({ steps, sawBootstrap, decay, lr, avgGap: ag, highLrSteps, isRandom, V, reward, gamma });
  }

  draw();
  return () => pause();
}
