// 15.2.6 Try it: value iteration on the 2x2 warehouse grid.
// Step or Play iterations, inspect each cell's calculation from the fixed old copy,
// watch the largest-change curve grow, adjust discount factor / reward / starting values,
// and solve four self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;

  const START_VALS = { A: 0, B: 0, C: 0, D: 0 };
  const ACTIONS = {
    A: [{ to: 'B', label: 'right → B', key: 'AB' }, { to: 'C', label: 'down  → C', key: 'AC' }],
    B: [{ to: 'A', label: 'left  → A', key: 'BA' }, { to: 'D', label: 'down  → D', key: 'BD' }],
    C: [{ to: 'A', label: 'up    → A', key: 'CA' }, { to: 'D', label: 'right → D', key: 'CD' }],
    D: [],
  };

  let vals = { ...START_VALS };
  let oldVals = { ...START_VALS };
  let gamma = 0.5;
  let reward = 10;
  let iter = 0;
  let history = []; // largest value change after each iteration
  let sel = 'A';
  let timer = null;
  let speedMs = 700;
  let usedRandom = false;
  let isDefault = true;

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700;
  const VH = NARROW ? 520 : 375;

  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const statusRow = h('div', { class: 'sim-row', style: { marginTop: '0', marginBottom: '.65rem' } });

  const gammaVal = h('span', { style: { fontFamily: 'Consolas', color: C.violet, fontWeight: 700 } }, '0.50');
  const gammaSlider = h('input', {
    type: 'range', min: '0', max: '1', step: '0.05', value: '0.5',
    oninput: e => {
      gamma = Number(e.target.value);
      gammaVal.textContent = gamma.toFixed(2);
      isDefault = false;
      history = [];
      iter = 0;
      oldVals = { ...vals };
      stop();
      draw();
    }
  });

  const rewVal = h('span', { style: { fontFamily: 'Consolas', color: C.amber, fontWeight: 700 } }, '10');
  const rewSlider = h('input', {
    type: 'range', min: '4', max: '20', step: '2', value: '10',
    oninput: e => {
      reward = Number(e.target.value);
      rewVal.textContent = String(reward);
      isDefault = false;
      history = [];
      iter = 0;
      oldVals = { ...vals };
      stop();
      draw();
    }
  });

  const speedVal = h('span', { style: { fontFamily: 'Consolas', color: C.cyan, fontWeight: 700 } }, '1.4/s');
  const speedSlider = h('input', {
    type: 'range', min: '120', max: '1400', step: '40', value: '700',
    oninput: e => {
      speedMs = 1520 - Number(e.target.value);
      speedVal.textContent = (1000 / speedMs).toFixed(1) + '/s';
      if (timer) { stop(); start(); }
    }
  });
  // Invert slider position so right = faster
  speedSlider.value = String(1520 - speedMs);

  const playBtn = btn('Play', () => (timer ? stop() : start()), 'go');
  const selInfo = h('span', { class: 'sim-note', style: { margin: 0 } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: value iteration'),
    h('p', { class: 'sub' }, 'Press Step to run one round using the fixed Old Copy. Tap any cell (A, B or C) to inspect its moves or change its starting value.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        statusRow,
        svg,
        h('div', { class: 'sim-row' },
          btn('Step', () => { stop(); doStep(); }, 'go'),
          playBtn,
          btn('New start (random)', () => randomStart()),
          btn('Reset', () => resetAll())),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: '.45rem' } }, 'Discount:', gammaSlider, gammaVal),
          h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: '.45rem' } }, 'Dock reward:', rewSlider, rewVal),
          h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: '.45rem' } }, 'Speed:', speedSlider, speedVal)),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−5', () => nudge(-5)), btn('−1', () => nudge(-1)),
          btn('+1', () => nudge(1)), btn('+5', () => nudge(5)),
          selInfo)),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const r2 = x => Math.round(x * 100) / 100;
  const moveReturn = (from, act, source) => (act.to === 'D' ? reward : 0) + gamma * source[act.to];
  const bestMoves = (k, source) => {
    const list = ACTIONS[k];
    if (!list.length) return { best: 0, winners: [] };
    const scores = list.map(a => ({ a, val: moveReturn(k, a, source) }));
    const best = Math.max(...scores.map(x => x.val));
    const winners = scores.filter(x => Math.abs(x.val - best) < 1e-9).map(x => x.a.key);
    return { best, winners, scores };
  };

  function isSettled() {
    return iter > 0 && history.length > 0 && history[history.length - 1] < 1e-4;
  }

  function doStep() {
    oldVals = { ...vals };
    const next = { D: 0 };
    let maxChange = 0;
    for (const k of ['A', 'B', 'C']) {
      const { best } = bestMoves(k, oldVals);
      next[k] = best;
      maxChange = Math.max(maxChange, Math.abs(next[k] - oldVals[k]));
    }
    vals = next;
    iter += 1;
    history.push(maxChange);
    draw();
    if (isSettled() && timer) stop();
  }

  function start() {
    if (timer) return;
    playBtn.textContent = 'Pause';
    doStep();
    if (!isSettled()) {
      timer = setInterval(() => {
        doStep();
        if (iter >= 60) stop();
      }, speedMs);
    }
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    playBtn.textContent = 'Play';
  }

  function nudge(delta) {
    if (sel === 'D') return;
    stop();
    vals[sel] = Math.max(0, Math.min(40, r2(vals[sel] + delta)));
    oldVals = { ...vals };
    iter = 0;
    history = [];
    isDefault = false;
    draw();
  }

  function randomStart() {
    stop();
    vals = { A: rnd(1, 16), B: rnd(1, 16), C: rnd(1, 16), D: 0 };
    oldVals = { ...vals };
    iter = 0;
    history = [];
    usedRandom = true;
    isDefault = false;
    draw();
  }

  function resetAll() {
    stop();
    vals = { ...START_VALS };
    oldVals = { ...START_VALS };
    gamma = 0.5;
    reward = 10;
    gammaSlider.value = '0.5';
    gammaVal.textContent = '0.50';
    rewSlider.value = '10';
    rewVal.textContent = '10';
    iter = 0;
    history = [];
    sel = 'A';
    usedRandom = false;
    isDefault = true;
    draw();
  }

  const chal = challenges(ch, [
    {
      text: 'Press Step three times on the original grid. Watch the largest change fall from 10, to 5, to 0.',
      check: st => st.isDefault && st.iter >= 3 && st.settled,
      why: 'Yes! Round 1 brings 10 to B and C, round 2 spreads 5 to A, and round 3 has zero change — the values have settled.'
    },
    {
      text: 'Set the discount factor to 0.8 (dock reward 10) and step or play until the values settle.',
      check: st => Math.abs(st.gamma - 0.8) < 1e-6 && st.reward === 10 && st.settled && Math.abs(st.vals.A - 8) < 1e-3,
      why: 'Right! With discount 0.8, cell A settles at 0.8 × 10 = 8. A larger discount factor gives more weight to future rewards.'
    },
    {
      text: 'Set discount to 0.5, press “New start (random)”, then press Play. Does it still settle to the same values?',
      check: st => st.usedRandom && Math.abs(st.gamma - 0.5) < 1e-6 && st.settled,
      why: 'Always! As long as the discount factor is below 1, value iteration settles to the same best values from any starting guesses.'
    },
    {
      text: 'Break it: press Reset, set cell A to 20, set discount to 1.0, and run at least 5 iterations. Does it settle to the true values?',
      check: st => Math.abs(st.gamma - 1.0) < 1e-6 && st.iter >= 5 && (!st.settled || Math.abs(st.vals.A - st.reward) > 0.5),
      why: 'No! Without discounting (discount = 1.0), high starting guesses never fade away — they keep bouncing or stay stuck above the true return.'
    },
  ]);

  function drawArrow(out, x1, y1, x2, y2, color, sw, op) {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, px = -uy, py = ux, tip = 9;
    const bx = x2 - ux * tip, by = y2 - uy * tip;
    out.push(
      s('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': sw, 'stroke-opacity': op, 'stroke-linecap': 'round' }),
      s('line', { x1: bx + px * 5.5, y1: by + py * 5.5, x2, y2, stroke: color, 'stroke-width': sw, 'stroke-opacity': op, 'stroke-linecap': 'round' }),
      s('line', { x1: bx - px * 5.5, y1: by - py * 5.5, x2, y2, stroke: color, 'stroke-width': sw, 'stroke-opacity': op, 'stroke-linecap': 'round' })
    );
  }

  function draw() {
    const k = [];
    const settled = isSettled();
    const lastChg = history.length ? history[history.length - 1] : null;

    // Status pills
    statusRow.replaceChildren(
      pill(`ITERATION ${iter}`, C.cyan),
      pill(lastChg === null ? 'CHANGE: —' : `LARGEST CHANGE: ${fmt(r2(lastChg))}`, settled ? C.green : C.amber),
      settled ? pill('SETTLED', C.green) : ''
    );

    // Main 2x2 grid geometry
    const gx = NARROW ? 16 : 20, gy = NARROW ? 16 : 20;
    const cs = NARROW ? 118 : 138, gap = NARROW ? 12 : 14, stp = cs + gap;
    const pos = {
      A: [gx, gy], B: [gx + stp, gy],
      C: [gx, gy + stp], D: [gx + stp, gy + stp]
    };
    const ctr = c => [pos[c][0] + cs / 2, pos[c][1] + cs / 2];

    // Collect currently optimal move keys (shown in green once at least 1 step has run)
    const optKeys = new Set();
    if (iter > 0) {
      for (const c of ['A', 'B', 'C']) {
        for (const key of bestMoves(c, vals).winners) optKeys.add(key);
      }
    }

    // Draw 4 cells
    for (const c of ['A', 'B', 'C', 'D']) {
      const [x, y] = pos[c], isD = c === 'D', isSel = c === sel;
      const rect = s('rect', {
        x, y, width: cs, height: cs, rx: 14,
        fill: isD ? C.green : C.bg,
        'fill-opacity': isD ? 0.14 : 0.92,
        stroke: isSel ? C.amber : (isD ? C.green : '#3a4a75'),
        'stroke-width': isSel ? 3.5 : (isD ? 2.5 : 2),
        style: isD ? '' : 'cursor:pointer'
      });
      if (!isD) rect.addEventListener('click', () => { sel = c; draw(); });
      k.push(rect);
      k.push(s('text', {
        x: x + 13, y: y + 24, fill: isD ? C.green : C.muted,
        'font-size': 16, 'font-weight': 700, 'font-family': 'Consolas', 'pointer-events': 'none'
      }, c));
      k.push(s('text', {
        x: x + cs / 2, y: y + cs / 2 + 10, fill: isD ? C.green : C.cyan,
        'font-size': NARROW ? 28 : 32, 'font-weight': 700, 'text-anchor': 'middle',
        'font-family': 'Consolas', 'pointer-events': 'none'
      }, fmt(r2(vals[c]))));
      if (isD) {
        k.push(s('text', {
          x: x + cs / 2, y: y + cs - 14, fill: C.green,
          'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle',
          'font-family': 'Consolas', 'pointer-events': 'none'
        }, 'DOCK'));
      }
    }

    // White delivery cart icon in top-right of cell A
    const cxA = pos.A[0] + cs - 30, cyA = pos.A[1] + 22;
    k.push(
      s('rect', { x: cxA - 14, y: cyA - 8, width: 28, height: 14, rx: 3, fill: C.ink, 'pointer-events': 'none' }),
      s('circle', { cx: cxA - 8, cy: cyA + 8, r: 4, fill: C.bg, stroke: C.ink, 'stroke-width': 2, 'pointer-events': 'none' }),
      s('circle', { cx: cxA + 8, cy: cyA + 8, r: 4, fill: C.bg, stroke: C.ink, 'stroke-width': 2, 'pointer-events': 'none' })
    );

    // Glowing move arrows between neighbouring cells
    const cA = ctr('A'), cB = ctr('B'), cC = ctr('C'), cD = ctr('D');
    const ins = cs * 0.34, par = 10;
    const arrowDefs = [
      { key: 'AB', x1: cA[0] + ins, y1: cA[1] - par, x2: cB[0] - ins, y2: cB[1] - par },
      { key: 'BA', x1: cB[0] - ins, y1: cB[1] + par, x2: cA[0] + ins, y2: cA[1] + par },
      { key: 'AC', x1: cA[0] - par, y1: cA[1] + ins, x2: cC[0] - par, y2: cC[1] - ins },
      { key: 'CA', x1: cC[0] + par, y1: cC[1] - ins, x2: cA[0] + par, y2: cA[1] + ins },
      { key: 'BD', x1: cB[0], y1: cB[1] + ins, x2: cD[0], y2: cD[1] - ins, dock: true },
      { key: 'CD', x1: cC[0] + ins, y1: cC[1], x2: cD[0] - ins, y2: cD[1], dock: true },
    ];
    for (const a of arrowDefs) {
      const isOpt = optKeys.has(a.key);
      const col = isOpt ? C.green : (a.dock ? C.amber : C.muted);
      const sw = isOpt ? 3.5 : (a.dock ? 2.5 : 2);
      const op = isOpt ? 0.96 : (a.dock ? 0.65 : 0.42);
      drawArrow(k, a.x1, a.y1, a.x2, a.y2, col, sw, op);
    }
    // Gold reward badges on dock moves
    k.push(
      s('text', { x: cB[0] + 24, y: (cB[1] + cD[1]) / 2 + 5, fill: C.amber, 'font-size': 14, 'font-weight': 700, 'font-family': 'Consolas' }, `+${reward}`),
      s('text', { x: (cC[0] + cD[0]) / 2, y: cC[1] + 24, fill: C.amber, 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `+${reward}`)
    );

    // Old Copy mini 2x2 grid
    const ox = NARROW ? 286 : 340, oy = NARROW ? 40 : 42;
    const ocs = NARROW ? 56 : 58, ogap = 6, ostp = ocs + ogap;
    k.push(s('text', {
      x: ox + (ocs * 2 + ogap) / 2, y: oy - 12, fill: C.violet,
      'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
    }, 'OLD COPY'));
    const opos = { A: [ox, oy], B: [ox + ostp, oy], C: [ox, oy + ostp], D: [ox + ostp, oy + ostp] };
    for (const c of ['A', 'B', 'C', 'D']) {
      const [x, y] = opos[c];
      k.push(
        s('rect', { x, y, width: ocs, height: ocs, rx: 8, fill: C.bg, stroke: c === 'D' ? C.green : C.violet, 'stroke-width': 1.5 }),
        s('text', { x: x + 7, y: y + 14, fill: C.muted, 'font-size': 11, 'font-family': 'Consolas' }, c),
        s('text', { x: x + ocs / 2, y: y + ocs / 2 + 7, fill: c === 'D' ? C.green : C.violet, 'font-size': 16, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r2(oldVals[c])))
      );
    }

    // Legend / summary next to Old Copy on laptop, or under Old Copy on phone
    const lx = NARROW ? ox + 6 : 488, ly = NARROW ? oy + ocs * 2 + ogap + 26 : 58;
    k.push(
      s('text', { x: lx, y: ly, fill: C.muted, 'font-size': 12, 'font-family': 'Consolas' }, `discount = ${gamma.toFixed(2)}`),
      s('text', { x: lx, y: ly + 22, fill: C.amber, 'font-size': 12, 'font-family': 'Consolas' }, `dock     = +${reward}`),
      s('text', { x: lx, y: ly + 44, fill: C.green, 'font-size': 12, 'font-family': 'Consolas' }, 'green = best move')
    );

    // Growing largest-change curve
    const chX = NARROW ? 20 : 340, chY = NARROW ? 295 : 196;
    const chW = NARROW ? 380 : 342, chH = NARROW ? 205 : 162;
    k.push(
      s('rect', { x: chX, y: chY, width: chW, height: chH, rx: 12, fill: C.bg, stroke: C.line }),
      s('text', { x: chX + 14, y: chY + 22, fill: C.ink, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas' }, 'Largest value change vs. iteration')
    );
    const px0 = chX + 42, px1 = chX + chW - 18, py0 = chY + chH - 28, py1 = chY + 38;
    const maxY = Math.max(10, reward, ...history);
    const maxN = Math.max(5, history.length);
    const mx = i => px0 + (i / maxN) * (px1 - px0);
    const my = v => py0 - (v / maxY) * (py0 - py1);
    k.push(
      s('line', { x1: px0, y1: py0, x2: px1, y2: py0, stroke: C.muted }),
      s('line', { x1: px0, y1: py0, x2: px0, y2: py1, stroke: C.muted })
    );
    for (const frac of [0, 0.5, 1]) {
      const v = maxY * frac, y = my(v);
      k.push(
        s('line', { x1: px0, y1: y, x2: px1, y2: y, stroke: C.line, 'stroke-opacity': 0.6 }),
        s('text', { x: px0 - 6, y: y + 4, fill: C.muted, 'font-size': 11, 'text-anchor': 'end', 'font-family': 'Consolas' }, fmt(r2(v)))
      );
    }
    const tickStep = maxN > 12 ? Math.ceil(maxN / 6) : 1;
    for (let i = 1; i <= maxN; i += tickStep) {
      k.push(s('text', { x: mx(i), y: py0 + 16, fill: C.muted, 'font-size': 11, 'text-anchor': 'middle', 'font-family': 'Consolas' }, i));
    }
    if (history.length) {
      let d = '';
      history.forEach((v, idx) => {
        const x = mx(idx + 1), y = my(v);
        d += (idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
      });
      k.push(s('path', { d, fill: 'none', stroke: settled ? C.green : C.amber, 'stroke-width': 2.5 }));
      history.forEach((v, idx) => {
        const x = mx(idx + 1), y = my(v), col = v < 1e-4 ? C.green : C.amber;
        k.push(s('circle', { cx: x, cy: y, r: 4, fill: col }));
        if (history.length <= 8 || idx === history.length - 1) {
          k.push(s('text', { x, y: Math.max(py1 + 10, y - 9), fill: col, 'font-size': 11, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r2(v))));
        }
      });
    } else {
      k.push(s('text', { x: (px0 + px1) / 2, y: (py0 + py1) / 2 + 4, fill: C.muted, 'font-size': 13, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'Press Step or Play to start'));
    }

    svg.replaceChildren(...k);

    // Formula box: show the selected cell's move-by-move calculation from oldVals (or current preview)
    const src = iter > 0 ? oldVals : vals;
    const calc = bestMoves(sel, src);
    const lines = [
      [iter > 0 ? `Iteration ${iter} — Cell ${sel} (using Old Copy):` : `Preview — Cell ${sel} (next step):`, C.cyan]
    ];
    for (const sc of calc.scores) {
      const rMove = sc.a.to === 'D' ? reward : 0;
      const isWin = calc.winners.includes(sc.a.key);
      lines.push([
        `  ${sc.a.label}: ${rMove} + ${gamma.toFixed(2)}×${fmt(r2(src[sc.a.to]))} = ${fmt(r2(sc.val))}`,
        isWin ? C.amber : C.muted
      ]);
    }
    const diff = Math.abs(calc.best - src[sel]);
    lines.push([`  old ${sel} = ${fmt(r2(src[sel]))},  new ${sel} = ${fmt(r2(calc.best))}`, C.cyan]);
    lines.push([`  cell change = ${fmt(r2(diff))}`, diff < 1e-4 ? C.green : C.violet]);
    fbox(box, lines);

    note.textContent = settled
      ? 'Settled! Every cell’s largest move return matches its value, so more iterations change nothing.'
      : (iter === 0
        ? 'Tap A, B or C to inspect its moves. Press Step to update all cells at once from the Old Copy.'
        : 'Each round reads only the fixed Old Copy and keeps the largest move return for every cell.');
    selInfo.textContent = `Selected: Cell ${sel} (value ${fmt(r2(vals[sel]))})`;

    chal.update({
      iter, gamma, reward, vals, settled, usedRandom, isDefault,
      maxChange: lastChg === null ? Infinity : lastChg
    });
  }

  draw();
  return () => stop();
}
