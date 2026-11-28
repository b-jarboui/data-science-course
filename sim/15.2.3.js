// 15.2.3 Try it: Policies — how the cart chooses its moves.
// Adjust move probabilities in cells A, B, and C, watch arrow widths and exact route chances update live,
// simulate 1 or 100 deliveries (or Play continuously), and complete self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;

  // Fixed starting policy from chapters/15.2.md: A (50/50), B (50/50), C (100% right / 0% up)
  const DEF = { pA: 0.5, pB: 0.5, pC: 1.0 };
  let pA = DEF.pA, pB = DEF.pB, pC = DEF.pC;

  // Simulation state
  let cartCell = 'A';
  let cartPos = null; // interpolated {x, y} while animating 1 delivery
  let lastRoute = null; // e.g. ['A', 'B', 'D']
  let lastStuck = false;
  let totalRuns = 0;
  let counts = { m2: 0, m4: 0, m6p: 0, stuck: 0 };
  let history = []; // observed 2-move % after each delivery (up to 160 points)
  let lessonRuns100 = 0;
  let playing = false;
  let speed = 5; // deliveries per second when playing
  let animFrame = 0;
  let playTimer = 0;

  const svg = s('svg', { viewBox: '0 0 700 410' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const statusRow = h('div', { class: 'sim-row', style: { marginTop: '0', marginBottom: '0.65rem' } });

  // Policy sliders
  function makeSlider(labelText, initPct, onChange) {
    const info = h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.9rem', fontFamily: 'Consolas, monospace' } });
    const inp = h('input', {
      type: 'range', min: 0, max: 100, step: 5, value: initPct,
      style: { width: '100%', accentColor: C.cyan, cursor: 'pointer', minHeight: '28px' },
    });
    inp.addEventListener('input', () => onChange(Number(inp.value) / 100));
    const wrap = h('div', { style: { flex: '1 1 11rem', minWidth: '0' } }, info, inp);
    return { wrap, info, inp };
  }

  const slA = makeSlider('A', 50, v => { pA = v; onPolicyChange(); });
  const slB = makeSlider('B', 50, v => { pB = v; onPolicyChange(); });
  const slC = makeSlider('C', 100, v => { pC = v; onPolicyChange(); });

  const playBtn = btn('Play', togglePlay);
  const speedVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } }, '5/s');
  const speedInp = h('input', {
    type: 'range', min: 1, max: 20, step: 1, value: speed,
    style: { width: '6rem', accentColor: C.amber, cursor: 'pointer' },
  });
  speedInp.addEventListener('input', () => {
    speed = Number(speedInp.value);
    speedVal.textContent = `${speed}/s`;
    if (playing) restartPlayLoop();
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: build a policy and test deliveries'),
    h('p', { class: 'sub' }, 'Change the move chances in cells A, B, and C. Each cell’s chances always add to 100%. Run deliveries to see how actual counts vary around the policy’s chance.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row', style: { gap: '0.85rem' } }, slA.wrap, slB.wrap, slC.wrap),
        h('div', { class: 'sim-row' },
          btn('Step (1 delivery)', runOneAnimated, 'go'),
          btn('Run 100', runHundred),
          playBtn,
          h('label', { class: 'sim-row', style: { marginTop: 0, gap: '0.4rem' } },
            h('span', { class: 'sim-note', style: { margin: 0 } }, 'Speed'),
            speedInp, speedVal),
          btn('New policy (random)', randomizePolicy),
          btn('Reset', resetAll))),
      h('div', {},
        h('div', { class: 'sim-card' }, statusRow, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  // Exact policy calculations (full precision internally)
  const probABD = () => pA * pB;
  const probACD = () => (1 - pA) * pC;
  const probTwo = () => probABD() + probACD();
  const isDetVal = x => x <= 1e-9 || x >= 1 - 1e-9;
  const isDeterministic = () => isDetVal(pA) && isDetVal(pB) && isDetVal(pC);
  const isLessonPolicy = () => Math.abs(pA - 0.5) < 1e-9 && Math.abs(pB - 0.5) < 1e-9 && Math.abs(pC - 1.0) < 1e-9;
  const pct = x => `${fmt(Math.round(x * 1000) / 10)}%`;

  const chal = challenges(ch, [
    {
      text: 'Make a deterministic policy: set every cell so one move is 100% and the other is 0%.',
      check: st => st.isDeterministic,
      why: 'Yes! With 100% and 0% in cells A, B, and C, the cart uses no chance and always picks the same move in every cell.',
    },
    {
      text: 'Change the policy so the cart reaches the dock in 2 moves 100% of the time.',
      check: st => st.probTwo >= 0.9999,
      why: 'Right! Whenever every cell the cart can visit sends it straight to the dock, it finishes in 2 moves every time.',
    },
    {
      text: 'Make the route A → B → D have an exact 50% chance.',
      check: st => Math.abs(st.probABD - 0.5) < 1e-6,
      why: 'Nice! Route chance = P(A → B) × P(B → D), so those two move chances multiply to 50%.',
    },
    {
      text: 'Press “Reset” for the lesson policy, then press “Run 100” twice. Does the 2-move count stay the same each time?',
      check: st => st.lessonRuns100 >= 2,
      why: 'No—it varies around 75 out of 100! A policy gives the chances of moves, not the exact count on every run.',
    },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 560 : 410, F = NARROW ? 1.08 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const CS = NARROW ? 132 : 142;
  const GAP = NARROW ? 26 : 26;
  const GX0 = NARROW ? (VW - (2 * CS + GAP)) / 2 : 24;
  const GY0 = NARROW ? 24 : 36;
  const centers = {
    A: { x: GX0 + CS / 2, y: GY0 + CS / 2 },
    B: { x: GX0 + CS + GAP + CS / 2, y: GY0 + CS / 2 },
    C: { x: GX0 + CS / 2, y: GY0 + CS + GAP + CS / 2 },
    D: { x: GX0 + CS + GAP + CS / 2, y: GY0 + CS + GAP + CS / 2 },
  };

  function clearHistory() {
    totalRuns = 0;
    counts = { m2: 0, m4: 0, m6p: 0, stuck: 0 };
    history = [];
    lastRoute = null;
    lastStuck = false;
    cartCell = 'A';
    cartPos = null;
  }

  function stopAnimations() {
    cancelAnimationFrame(animFrame);
    animFrame = 0;
    if (playTimer) { clearInterval(playTimer); playTimer = 0; }
    playing = false;
    playBtn.textContent = 'Play';
  }

  function onPolicyChange() {
    stopAnimations();
    clearHistory();
    draw();
  }

  function randomizePolicy() {
    stopAnimations();
    pA = rnd(0, 20) * 0.05;
    pB = rnd(0, 20) * 0.05;
    pC = rnd(0, 20) * 0.05;
    if (probTwo() === 0) pC = 0.5; // keep dock reachable on random policy
    clearHistory();
    draw();
  }

  function resetAll() {
    stopAnimations();
    pA = DEF.pA; pB = DEF.pB; pC = DEF.pC;
    lessonRuns100 = 0;
    clearHistory();
    draw();
  }

  // Sample one delivery from cell A
  function sampleDelivery() {
    const route = ['A'];
    let cur = 'A', steps = 0;
    const MAX = 40;
    while (cur !== 'D' && steps < MAX) {
      const u = Math.random();
      if (cur === 'A') cur = u < pA ? 'B' : 'C';
      else if (cur === 'B') cur = u < pB ? 'D' : 'A';
      else if (cur === 'C') cur = u < pC ? 'D' : 'A';
      route.push(cur);
      steps++;
    }
    return { route, moves: steps, stuck: cur !== 'D' };
  }

  function recordDelivery(res) {
    totalRuns++;
    lastRoute = res.route;
    lastStuck = res.stuck;
    if (res.stuck) counts.stuck++;
    else if (res.moves === 2) counts.m2++;
    else if (res.moves === 4) counts.m4++;
    else counts.m6p++;
    history.push(counts.m2 / totalRuns);
    if (history.length > 200) history.shift();
  }

  function runOneAnimated() {
    if (playing) togglePlay();
    cancelAnimationFrame(animFrame);
    const res = sampleDelivery();
    // Animate the white cart smoothly along the sampled route (cap animation segments at 8)
    const hops = res.route.slice(0, Math.min(res.route.length, 9));
    let seg = 0, t0 = performance.now();
    const hopMs = 240;
    const step = now => {
      const k = Math.min(1, (now - t0) / hopMs);
      const a = centers[hops[seg]], b = centers[hops[seg + 1]];
      const e = k * k * (3 - 2 * k);
      cartPos = { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e };
      draw();
      if (k < 1) {
        animFrame = requestAnimationFrame(step);
      } else {
        seg++;
        if (seg < hops.length - 1) {
          t0 = now;
          animFrame = requestAnimationFrame(step);
        } else {
          cartPos = null;
          cartCell = res.stuck ? res.route[res.route.length - 1] : 'D';
          recordDelivery(res);
          draw();
        }
      }
    };
    animFrame = requestAnimationFrame(step);
  }

  function runHundred() {
    if (playing) togglePlay();
    cancelAnimationFrame(animFrame);
    cartPos = null;
    let last = null;
    for (let i = 0; i < 100; i++) {
      last = sampleDelivery();
      recordDelivery(last);
    }
    cartCell = last && !last.stuck ? 'D' : 'A';
    if (isLessonPolicy()) lessonRuns100++;
    draw();
  }

  function restartPlayLoop() {
    if (playTimer) clearInterval(playTimer);
    playTimer = setInterval(() => {
      const res = sampleDelivery();
      recordDelivery(res);
      cartCell = res.stuck ? res.route[res.route.length - 1] : 'D';
      cartPos = null;
      draw();
    }, Math.max(40, Math.round(1000 / speed)));
  }

  function togglePlay() {
    if (playing) {
      stopAnimations();
      draw();
    } else {
      cancelAnimationFrame(animFrame);
      playing = true;
      playBtn.textContent = 'Pause';
      restartPlayLoop();
      draw();
    }
  }

  // Draw glowing arrow inside SVG
  function drawArrow(out, x1, y1, x2, y2, prob, labelX, labelY) {
    const isZero = prob <= 1e-9;
    const col = isZero ? '#5b678a' : (prob >= 1 - 1e-9 ? C.green : C.cyan);
    const sw = isZero ? 2 : 2.5 + 10.5 * prob;
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const hl = 12, hw = 8;
    const sx2 = x2 - ux * 5, sy2 = y2 - uy * 5;
    if (!isZero) {
      out.push(s('line', {
        x1, y1, x2: sx2, y2: sy2, stroke: col, 'stroke-width': sw + 8,
        'stroke-opacity': 0.16, 'stroke-linecap': 'round',
      }));
    }
    out.push(s('line', {
      x1, y1, x2: sx2, y2: sy2, stroke: col, 'stroke-width': sw,
      'stroke-opacity': isZero ? 0.55 : 0.95, 'stroke-linecap': 'round',
    }));
    const pts = `${x2},${y2} ${x2 - ux * hl + px * hw},${y2 - uy * hl + py * hw} ${x2 - ux * hl - px * hw},${y2 - uy * hl - py * hw}`;
    out.push(s('polygon', { points: pts, fill: col, 'fill-opacity': isZero ? 0.55 : 1 }));
    out.push(s('text', {
      x: labelX, y: labelY, fill: isZero ? C.muted : col,
      'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas',
    }, `${Math.round(prob * 100)}%`));
  }

  function draw() {
    // Sync slider readouts (each cell always sums to 100%)
    const aR = Math.round(pA * 100), aD = 100 - aR;
    const bD = Math.round(pB * 100), bL = 100 - bD;
    const cR = Math.round(pC * 100), cU = 100 - cR;
    slA.inp.value = aR; slB.inp.value = bD; slC.inp.value = cR;
    slA.info.replaceChildren(h('span', { style: { color: C.cyan } }, `A: →B ${aR}%`), h('span', { style: { color: C.muted } }, `↓C ${aD}%`));
    slB.info.replaceChildren(h('span', { style: { color: C.cyan } }, `B: ↓D ${bD}%`), h('span', { style: { color: C.muted } }, `←A ${bL}%`));
    slC.info.replaceChildren(h('span', { style: { color: C.green } }, `C: →D ${cR}%`), h('span', { style: { color: C.muted } }, `↑A ${cU}%`));

    const k = [];
    // 4-cell dark grid
    for (const [name, c] of Object.entries(centers)) {
      const isDock = name === 'D';
      k.push(s('rect', {
        x: c.x - CS / 2, y: c.y - CS / 2, width: CS, height: CS, rx: 14,
        fill: isDock ? '#0e2524' : '#0c1328', stroke: isDock ? C.green : '#2e3c68', 'stroke-width': isDock ? 2.5 : 2,
      }));
      if (isDock) {
        k.push(s('text', {
          x: c.x, y: c.y + CS / 2 - 14, fill: C.green, 'font-size': 14 * F, 'font-weight': 700,
          'text-anchor': 'middle', 'font-family': 'Consolas',
        }, 'D · DOCK'));
      } else {
        const lx = (name === 'A' || name === 'C') ? c.x - CS / 2 + 16 : c.x + CS / 2 - 16;
        const ly = (name === 'A' || name === 'B') ? c.y - CS / 2 + 24 : c.y + CS / 2 - 14;
        k.push(s('text', {
          x: lx, y: ly, fill: C.muted, 'font-size': 18 * F, 'font-weight': 700,
          'text-anchor': 'middle', 'font-family': 'Consolas',
        }, name));
      }
    }

    // Arrows in non-overlapping lanes
    const OFF = 32, LANE = 16;
    const A = centers.A, B = centers.B, Cc = centers.C, D = centers.D;
    const midX = (A.x + B.x) / 2, midY = (A.y + Cc.y) / 2;
    drawArrow(k, A.x + OFF, A.y - LANE, B.x - OFF, B.y - LANE, pA, midX, A.y - LANE - 12);
    drawArrow(k, B.x - OFF, B.y + LANE, A.x + OFF, A.y + LANE, 1 - pB, midX, A.y + LANE + 22);
    drawArrow(k, A.x - LANE, A.y + OFF, Cc.x - LANE, Cc.y - OFF, 1 - pA, A.x - LANE - 28, midY + 4);
    drawArrow(k, Cc.x + LANE, Cc.y - OFF, A.x + LANE, A.y + OFF, 1 - pC, A.x + LANE + 28, midY + 4);
    drawArrow(k, B.x, B.y + OFF, D.x, D.y - OFF, pB, B.x + 32, midY + 4);
    drawArrow(k, Cc.x + OFF, Cc.y, D.x - OFF, D.y, pC, midX, Cc.y - 14);

    // White delivery cart
    const cp = cartPos || centers[cartCell];
    k.push(
      s('rect', { x: cp.x - 16, y: cp.y - 11, width: 32, height: 18, rx: 4, fill: C.ink, stroke: C.bg, 'stroke-width': 1.5 }),
      s('circle', { cx: cp.x - 9, cy: cp.y + 10, r: 4.5, fill: C.bg, stroke: C.cyan, 'stroke-width': 2 }),
      s('circle', { cx: cp.x + 9, cy: cp.y + 10, r: 4.5, fill: C.bg, stroke: C.cyan, 'stroke-width': 2 })
    );

    // Charts panel: bar chart of delivery lengths + growing observed-vs-expected 2-move % curve
    const expPct = probTwo() * 100;
    const obsPct = totalRuns > 0 ? (counts.m2 / totalRuns) * 100 : null;

    const barBox = NARROW
      ? { x: 20, y: 365, w: 168, h: 165 }
      : { x: 382, y: 36, w: 298, h: 155 };
    const curveBox = NARROW
      ? { x: 206, y: 365, w: 174, h: 165 }
      : { x: 382, y: 218, w: 298, h: 156 };

    // Panel 1: Delivery lengths histogram (2 moves, 4 moves, 6+ moves)
    k.push(s('rect', { x: barBox.x, y: barBox.y, width: barBox.w, height: barBox.h, rx: 10, fill: '#0b1124', stroke: '#26305a' }));
    k.push(s('text', {
      x: barBox.x + 12, y: barBox.y + 20, fill: C.muted, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas',
    }, 'DELIVERY LENGTHS'));

    const buckets = [
      { label: '2 moves', val: counts.m2, col: C.green },
      { label: '4 moves', val: counts.m4, col: C.cyan },
      { label: '6+ / stuck', val: counts.m6p + counts.stuck, col: C.violet },
    ];
    const bTop = barBox.y + 36, bBot = barBox.y + barBox.h - 26, bH = bBot - bTop;
    const bw = (barBox.w - 32) / 3;
    // Dashed amber line for expected 2-move share
    const expY = bBot - (expPct / 100) * bH;
    k.push(s('line', {
      x1: barBox.x + 10, x2: barBox.x + barBox.w - 10, y1: expY, y2: expY,
      stroke: C.amber, 'stroke-width': 1.5, 'stroke-dasharray': '5 4',
    }));
    buckets.forEach((b, i) => {
      const share = totalRuns > 0 ? b.val / totalRuns : 0;
      const hgt = share * bH;
      const cx = barBox.x + 16 + bw * (i + 0.5);
      k.push(s('rect', {
        x: cx - bw * 0.32, y: bBot - hgt, width: bw * 0.64, height: Math.max(0, hgt),
        rx: 4, fill: b.col, 'fill-opacity': 0.85,
      }));
      k.push(s('text', {
        x: cx, y: bBot + 15, fill: C.muted, 'font-size': 10.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas',
      }, b.label));
      if (totalRuns > 0) {
        k.push(s('text', {
          x: cx, y: Math.max(bTop + 8, bBot - hgt - 5), fill: b.col,
          'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas',
        }, `${b.val}`));
      }
    });

    // Panel 2: Growing observed vs expected 2-move % curve
    k.push(s('rect', { x: curveBox.x, y: curveBox.y, width: curveBox.w, height: curveBox.h, rx: 10, fill: '#0b1124', stroke: '#26305a' }));
    k.push(s('text', {
      x: curveBox.x + 12, y: curveBox.y + 20, fill: C.muted, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas',
    }, '2-MOVE % OVER DELIVERIES'));

    const cLeft = curveBox.x + 34, cRight = curveBox.x + curveBox.w - 12;
    const cTop = curveBox.y + 34, cBot = curveBox.y + curveBox.h - 22;
    for (const g of [0, 50, 100]) {
      const gy = cBot - (g / 100) * (cBot - cTop);
      k.push(s('line', { x1: cLeft, x2: cRight, y1: gy, y2: gy, stroke: '#1d2748' }));
      k.push(s('text', { x: cLeft - 6, y: gy + 4, fill: C.muted, 'font-size': 10 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `${g}%`));
    }
    const yExp = cBot - (expPct / 100) * (cBot - cTop);
    k.push(s('line', { x1: cLeft, x2: cRight, y1: yExp, y2: yExp, stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '6 4' }));

    if (history.length > 0) {
      const n = history.length;
      const pts = history.map((v, i) => {
        const x = n === 1 ? (cLeft + cRight) / 2 : cLeft + (i / (n - 1)) * (cRight - cLeft);
        const y = cBot - v * (cBot - cTop);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      if (n > 1) k.push(s('polyline', { points: pts, fill: 'none', stroke: C.cyan, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
      const lx = n === 1 ? (cLeft + cRight) / 2 : cRight;
      const ly = cBot - history[n - 1] * (cBot - cTop);
      k.push(s('circle', { cx: lx, cy: ly, r: 4, fill: C.cyan }));
    } else {
      k.push(s('text', {
        x: (cLeft + cRight) / 2, y: (cTop + cBot) / 2 + 4, fill: C.muted,
        'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas',
      }, 'Run deliveries to grow curve'));
    }

    svg.replaceChildren(...k);

    // Status pills (policy type + delivery counter)
    const det = isDeterministic();
    statusRow.replaceChildren(
      pill(det ? 'DETERMINISTIC POLICY' : 'STOCHASTIC POLICY', det ? C.amber : C.violet),
      pill(`DELIVERIES: ${totalRuns}`, C.cyan)
    );

    // Formula box
    const lines = [
      `A → B → D : ${fmt(pA)} × ${fmt(pB)} = ${pct(probABD())}`,
      `A → C → D : ${fmt(1 - pA)} × ${fmt(pC)} = ${pct(probACD())}`,
      [`Expected in 2 moves : ${pct(probTwo())}`, C.amber],
    ];
    if (totalRuns > 0) {
      lines.push([`Observed in 2 moves : ${counts.m2}/${totalRuns} (${pct(obsPct / 100)})`, C.green]);
    }
    if (lastRoute) {
      const txt = lastStuck ? 'Last: stuck (0% into dock!)' : `Last: ${lastRoute.join('→')} (${lastRoute.length - 1} moves)`;
      lines.push([txt, lastStuck ? C.pink : C.muted]);
    }
    fbox(box, lines);

    // Plain-English note
    if (probTwo() === 0) {
      note.textContent = 'Neither route can enter cell D under this policy, so the cart loops forever and never reaches the dock.';
    } else if (totalRuns === 0) {
      note.textContent = 'Wide arrows mean higher move chances. Press Step or Run 100 to test how many deliveries finish in 2 moves.';
    } else {
      note.textContent = `Dashed gold line = policy chance (${pct(probTwo())}). Blue curve = observed 2-move share across ${totalRuns} deliveries.`;
    }

    chal.update({
      isDeterministic: det,
      probTwo: probTwo(),
      probABD: probABD(),
      lessonRuns100,
    });
  }

  draw();
  return () => stopAnimations();
}
