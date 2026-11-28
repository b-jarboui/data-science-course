// 3.3.3 Try it: simple random sampling vs a biased draw.
// The learner drags 5 students' trips (A-E), draws single pairs or 50 at once,
// compares a fair draw against the 8:00 gate trap, generates random trips,
// and solves 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const NAMES = ['A', 'B', 'C', 'D', 'E'];
  const START = [10, 20, 30, 40, 50];

  let trips = START.slice();
  let sel = 0;
  let biased = false;
  let draws = [];            // array of drawn pair means
  let lastPair = null;       // [i, j]
  let lastMean = null;
  let lastMiss = 0;
  let biasedDraws = 0;
  let randomUsed = false;
  let drawsAfterRandom = 0;
  let burstTimer = null;

  const svg = s('svg', { viewBox: '0 0 700 480' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const fairBtn = btn('Fair draw (simple random)', () => setMode(false), 'go');
  const gateBtn = btn('8:00 gate (biased)', () => setMode(true), '');

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: simple random sampling'),
    h('p', { class: 'sub' }, 'Drag any student A–E up or down (or tap and use −5 / +5). Draw pairs of 2 students and watch where the sample means pile up.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−5', () => bump(-5)),
          btn('+5', () => bump(5)),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('Draw 1 sample', () => { stopBurst(); drawOne(); draw(); }, 'go'),
          btn('Draw 50 samples', () => drawBurst(50), 'go'),
          btn('Clear draws', () => { stopBurst(); resetDraws(); draw(); })),
        h('div', { class: 'sim-row' },
          fairBtn,
          gateBtn,
          btn('New data (random)', () => {
            stopBurst();
            trips = NAMES.map(() => rnd(2, 12) * 5);
            randomUsed = true;
            drawsAfterRandom = 0;
            resetDraws();
            draw();
          }),
          btn('Start again', () => {
            stopBurst();
            trips = START.slice();
            sel = 0;
            biased = false;
            randomUsed = false;
            drawsAfterRandom = 0;
            biasedDraws = 0;
            resetDraws();
            syncModeButtons();
            draw();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const trueMean = () => trips.reduce((a, b) => a + b, 0) / trips.length;
  const r2 = x => Math.round(x * 100) / 100;

  // Indices of the 3 shortest-trip students (the ones caught at the 8:00 gate)
  function gatePool() {
    return trips.map((v, i) => ({ v, i }))
      .sort((a, b) => a.v - b.v || a.i - b.i)
      .slice(0, 3)
      .map(x => x.i);
  }

  function stopBurst() {
    if (burstTimer !== null) { clearInterval(burstTimer); burstTimer = null; }
  }

  function resetDraws() {
    draws = [];
    lastPair = null;
    lastMean = null;
    lastMiss = 0;
  }

  function syncModeButtons() {
    fairBtn.className = 'sim-btn ' + (biased ? '' : 'go');
    gateBtn.className = 'sim-btn ' + (biased ? 'go' : '');
  }

  function setMode(isBiased) {
    if (biased === isBiased) return;
    stopBurst();
    biased = isBiased;
    resetDraws();
    syncModeButtons();
    draw();
  }

  function drawOne() {
    const pool = biased ? gatePool() : [0, 1, 2, 3, 4];
    const i1 = rnd(0, pool.length - 1);
    let i2 = rnd(0, pool.length - 2);
    if (i2 >= i1) i2++;
    const a = pool[i1], b = pool[i2];
    const pair = a < b ? [a, b] : [b, a];
    const m = (trips[pair[0]] + trips[pair[1]]) / 2;
    lastPair = pair;
    lastMean = m;
    lastMiss = Math.abs(m - trueMean());
    draws.push(m);
    if (biased) biasedDraws++;
    if (!biased && randomUsed) drawsAfterRandom++;
  }

  function drawBurst(count) {
    stopBurst();
    let left = count;
    burstTimer = setInterval(() => {
      const step = Math.min(5, left);
      for (let k = 0; k < step; k++) drawOne();
      left -= step;
      draw();
      if (left <= 0) stopBurst();
    }, 35);
  }

  function bump(d) {
    stopBurst();
    trips[sel] = Math.max(5, Math.min(60, trips[sel] + d));
    resetDraws();
    draw();
  }

  const chal = challenges(ch, [
    {
      text: 'Press “Draw 1 sample” until you get a pair whose mean misses the true mean by at least 5 minutes.',
      check: st => !st.biased && st.draws >= 1 && st.lastMiss >= 5,
      why: 'Yes! Even with a fair draw, one single sample can land well above or below the true mean.'
    },
    {
      text: 'Keep Fair draw on and press “Draw 50 samples” until you have at least 100 draws. Watch where the average settles.',
      check: st => !st.biased && st.draws >= 100,
      why: 'Spot on! Single pairs bounce low and high, but their average settles right on the true mean. No bias.'
    },
    {
      text: 'Switch to “8:00 gate (biased)” and draw at least 100 samples. Which way does the average lean?',
      check: st => st.biased && st.draws >= 100,
      why: 'Because the 8:00 gate only catches shorter trips, the draws pile up too low—even 100 draws cannot fix bias.'
    },
    {
      text: 'Switch back to “Fair draw”, press “New data (random)”, and draw at least 50 samples.',
      check: st => !st.biased && st.randomUsed && st.drawsAfterRandom >= 50,
      why: 'Always unbiased! For any set of trips, giving every pair the same chance keeps the method centered on the true mean.'
    },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 480, F = NARROW ? 1.18 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X0 = NARROW ? 36 : 52, X1 = VW - 16;
  const TOP_Y0 = 32, TOP_BASE = 200, MAXV = 60;
  const unitY = (TOP_BASE - TOP_Y0) / MAXV;
  const slotW = (X1 - X0) / NAMES.length;

  const BOT_TOP = 285, BOT_BASE = 424;
  const xVal = v => X0 + (v / MAXV) * (X1 - X0);

  // Pointer drag on top bars
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y > 235) return;
    const i = Math.floor((p.x - X0) / slotW);
    if (i < 0 || i >= NAMES.length) return;
    stopBurst();
    sel = i; dragging = i;
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const val = Math.max(5, Math.min(MAXV, Math.round((TOP_BASE - p.y) / unitY)));
    if (trips[dragging] !== val) {
      trips[dragging] = val;
      resetDraws();
      draw();
    }
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const tm = trueMean();
    const gPool = biased ? new Set(gatePool()) : null;
    const k = [];

    // --- TOP PANEL: 5 students A-E ---
    k.push(s('text', { x: X0, y: 18, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Consolas' },
      biased ? 'POPULATION (5 STUDENTS) · 8:00 GATE CATCHES ONLY SHORTEST 3' : 'POPULATION (5 STUDENTS) · DRAG BARS TO CHANGE TRIPS'));

    for (let g = 0; g <= MAXV; g += 20) {
      const y = TOP_BASE - g * unitY;
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g)
      );
    }

    const bw = Math.min(62, slotW * 0.56);
    trips.forEach((val, i) => {
      const cx = X0 + slotW * (i + 0.5);
      const hgt = val * unitY;
      const inPair = lastPair && (lastPair[0] === i || lastPair[1] === i);
      const missed = biased && !gPool.has(i);
      const col = inPair ? (biased ? C.pink : C.amber) : missed ? C.muted : C.cyan;
      const op = missed ? 0.30 : inPair ? 0.95 : 0.78;

      if (i === sel) {
        k.push(s('rect', { x: cx - slotW / 2 + 4, y: TOP_Y0 - 6, width: slotW - 8, height: TOP_BASE - TOP_Y0 + 8, fill: '#ffffff', 'fill-opacity': 0.04, rx: 8 }));
      }
      k.push(s('rect', {
        x: cx - bw / 2, y: TOP_BASE - hgt, width: bw, height: hgt,
        fill: col, 'fill-opacity': op, stroke: inPair ? '#ffffff' : col, 'stroke-width': inPair ? 2 : 1, rx: 6
      }));
      k.push(s('text', {
        x: cx, y: TOP_BASE - hgt - 7, fill: col, 'font-size': 13 * F, 'font-weight': 700,
        'text-anchor': 'middle', 'font-family': 'Consolas'
      }, `${val}`));
      k.push(s('text', {
        x: cx, y: TOP_BASE + 20, fill: inPair ? col : C.ink, 'font-size': 14 * F, 'font-weight': 700,
        'text-anchor': 'middle', 'font-family': 'Consolas'
      }, NAMES[i]));
      if (missed) {
        k.push(s('text', {
          x: cx, y: TOP_BASE - hgt / 2 + 4, fill: C.muted, 'font-size': 10 * F, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, 'missed'));
      }
    });

    // True mean dashed line on top panel
    const ytm = TOP_BASE - tm * unitY;
    k.push(
      s('line', { x1: X0, x2: X1, y1: ytm, y2: ytm, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '8 6' }),
      s('rect', { x: X1 - 122 * F, y: Math.max(TOP_Y0, ytm - 26 * F), width: 122 * F, height: 22 * F, rx: 11 * F, fill: C.bg, stroke: C.amber }),
      s('text', { x: X1 - 61 * F, y: Math.max(TOP_Y0, ytm - 26 * F) + 15 * F, fill: C.amber, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `TRUE MEAN ${fmt(r2(tm))}`)
    );

    // Divider
    k.push(s('line', { x1: X0 - 10, x2: X1, y1: 244, y2: 244, stroke: C.line, 'stroke-dasharray': '4 4' }));

    // --- BOTTOM PANEL: Histogram of drawn sample means ---
    const avgDraws = draws.length ? draws.reduce((a, b) => a + b, 0) / draws.length : null;
    k.push(s('text', { x: X0, y: 266, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Consolas' },
      draws.length ? `SAMPLE MEANS DRAWN SO FAR (${draws.length} DRAWS)` : 'SAMPLE MEANS DRAWN SO FAR (PRESS DRAW TO BEGIN)'));

    k.push(s('line', { x1: X0, x2: X1, y1: BOT_BASE, y2: BOT_BASE, stroke: C.muted, 'stroke-width': 2 }));
    for (let g = 0; g <= MAXV; g += 10) {
      const x = xVal(g);
      k.push(
        s('line', { x1: x, x2: x, y1: BOT_BASE - 4, y2: BOT_BASE + 5, stroke: C.muted }),
        s('text', { x, y: BOT_BASE + 20, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, g)
      );
    }
    k.push(s('text', { x: X1, y: BOT_BASE + 36, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'minutes'));

    // Bin drawn means into 2.5-minute bins
    const BIN = 2.5;
    const bins = new Map();
    for (const m of draws) {
      const b = Math.round(m / BIN) * BIN;
      bins.set(b, (bins.get(b) || 0) + 1);
    }
    const maxCount = Math.max(4, ...bins.values());
    const binW = Math.max(8, (xVal(BIN) - xVal(0)) * 0.78);
    const barCol = biased ? C.pink : C.cyan;
    for (const [b, cnt] of bins.entries()) {
      const bh = (cnt / maxCount) * (BOT_BASE - BOT_TOP - 16);
      k.push(s('rect', {
        x: xVal(b) - binW / 2, y: BOT_BASE - bh, width: binW, height: bh,
        fill: barCol, 'fill-opacity': 0.72, rx: 3
      }));
    }

    // True mean vertical dashed line on bottom panel
    const xtm = xVal(tm);
    k.push(
      s('line', { x1: xtm, x2: xtm, y1: BOT_TOP - 8, y2: BOT_BASE + 4, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }),
      s('text', { x: xtm, y: BOT_TOP - 13, fill: C.amber, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `TRUE ${fmt(r2(tm))}`)
    );

    // Average of all draws marker
    if (avgDraws !== null) {
      const xavg = xVal(avgDraws);
      const acol = biased ? C.pink : C.green;
      k.push(
        s('line', { x1: xavg, x2: xavg, y1: BOT_TOP + 6, y2: BOT_BASE + 4, stroke: acol, 'stroke-width': 3 }),
        s('rect', { x: Math.max(X0, Math.min(X1 - 104 * F, xavg - 52 * F)), y: BOT_BASE + 28, width: 104 * F, height: 22 * F, rx: 11 * F, fill: C.bg, stroke: acol }),
        s('text', { x: Math.max(X0 + 52 * F, Math.min(X1 - 52 * F, xavg)), y: BOT_BASE + 28 + 15 * F, fill: acol, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `AVG ${fmt(r2(avgDraws))}`)
      );
    }

    // Last drawn pair mean dot on the axis
    if (lastMean !== null) {
      const xl = xVal(lastMean);
      k.push(
        s('circle', { cx: xl, cy: BOT_BASE, r: 7, fill: C.amber, stroke: C.bg, 'stroke-width': 2 })
      );
    }

    svg.replaceChildren(...k);

    // Formula box
    const lines = [
      `trips     = ${trips.join(', ')}`,
      [`true mean = ${fmt(r2(tm))} min`, C.amber],
    ];
    if (lastPair) {
      const a = lastPair[0], b = lastPair[1];
      lines.push(`last pair = ${NAMES[a]}, ${NAMES[b]} → (${trips[a]}+${trips[b]})÷2 = ${fmt(r2(lastMean))}`);
    } else {
      lines.push('last pair = — (press Draw)');
    }
    if (avgDraws !== null) {
      const diff = r2(avgDraws - tm);
      const sign = diff > 0 ? `+${fmt(diff)}` : fmt(diff);
      lines.push([`avg (${draws.length} draws) = ${fmt(r2(avgDraws))} (${sign})`, biased ? C.pink : C.green]);
    } else {
      lines.push('avg of draws = —');
    }
    fbox(box, lines);

    note.textContent = biased
      ? '8:00 gate mode: only the 3 shortest-trip students can be picked. Notice how the average stays stuck below the true mean.'
      : 'Fair draw: every one of the 10 pairs has a 1 in 10 chance. Single pairs can miss, but their average settles on the true mean.';
    selLabel.textContent = `Selected: ${NAMES[sel]} (${trips[sel]} min)`;

    chal.update({
      biased,
      draws: draws.length,
      lastMiss,
      biasedDraws,
      randomUsed,
      drawsAfterRandom,
    });
  }

  draw();
  return () => stopBurst();
}
