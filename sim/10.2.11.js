// 10.2.11 Try it: robust regression with Huber loss (iterative rounds).
// Drag any apartment rent (or the guess marker), change the pull limit and step size,
// step or play through rounds, watch the loss curve fall (or bounce!), and solve 4 challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;

  const START = [1320, 1400, 1400, 1480, 1800];
  const NAMES = ['I', 'J', 'K', 'L', 'M'];
  const MEAN = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const r1 = x => Math.round(x * 10) / 10;
  const fmtInt = x => Math.round(x).toLocaleString('en-US');
  const fmtNum = x => {
    const v = Math.round(x * 10) / 10;
    return Number.isInteger(v) ? v.toLocaleString('en-US') : v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };
  const fmtSigned = x => (x > 0 ? '+' : x < 0 ? '−' : '') + fmtNum(Math.abs(x));

  function huberOne(gap, d) {
    const g = Math.abs(gap);
    return g <= d ? 0.5 * g * g : d * (g - 0.5 * d);
  }
  function pullOne(gap, d) {
    if (gap > d) return d;
    if (gap < -d) return -d;
    return gap;
  }
  function totalLoss(arr, g, d) {
    return arr.reduce((a, y) => a + huberOne(y - g, d), 0);
  }
  function analyze(arr, g, d, lr) {
    const gaps = arr.map(y => y - g);
    const pulls = gaps.map(gap => pullOne(gap, d));
    const regPull = pulls.slice(0, 4).reduce((a, b) => a + b, 0);
    const highPull = pulls[4];
    const combined = regPull + highPull;
    const move = lr * combined;
    const nextGuess = g + move;
    const oldLoss = totalLoss(arr, g, d);
    const newLoss = totalLoss(arr, nextGuess, d);
    return { gaps, pulls, regPull, highPull, combined, move, nextGuess, oldLoss, newLoss };
  }

  // State
  let rents = START.slice();
  let delta = 120;
  let lr = 0.25;
  let speed = 3;
  let guess = Math.round(MEAN(rents));
  let round = 0;
  let history = [{ round: 0, guess, loss: totalLoss(rents, guess, delta) }];
  let lastStep = null;
  let sel = 4; // selected apartment (default: M, the high listing)
  let playing = false;
  let timer = null;
  let usedRandom = false;

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 500 : 490, F = NARROW ? 1.15 : 1;
  const X0 = NARROW ? 46 : 58, X1 = VW - 18;
  const LINE_Y = 124;
  const CHART_TOP = 286, CHART_BOT = VH - 42;

  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const roundPill = pill('ROUND 0', C.amber);
  const statusPill = pill('READY', C.cyan);
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const deltaVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.violet, fontWeight: 700 } }, '$120');
  const lrVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.green, fontWeight: 700 } }, '0.25');
  const spdVal = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.cyan, fontWeight: 700 } }, '3 / s');

  const deltaInput = h('input', {
    type: 'range', min: 20, max: 500, step: 10, value: 120,
    style: { flex: '1 1 110px', accentColor: C.violet },
    oninput: e => {
      delta = +e.target.value;
      deltaVal.textContent = '$' + delta;
      stop();
      resetHistoryFromCurrentGuess();
      draw();
    }
  });
  const lrInput = h('input', {
    type: 'range', min: 0.05, max: 0.65, step: 0.05, value: 0.25,
    style: { flex: '1 1 110px', accentColor: C.green },
    oninput: e => {
      lr = +e.target.value;
      lrVal.textContent = lr.toFixed(2);
      draw();
    }
  });
  const spdInput = h('input', {
    type: 'range', min: 1, max: 10, step: 1, value: 3,
    style: { flex: '1 1 90px', accentColor: C.cyan },
    oninput: e => {
      speed = +e.target.value;
      spdVal.textContent = speed + ' / s';
      if (playing) { stop(); start(); }
    }
  });

  const playBtn = btn('Play', () => (playing ? stop() : start()));

  const sliderRow = (label, input, readout) => h('div', { class: 'sim-row', style: { marginTop: '.55rem' } },
    h('span', { style: { minWidth: '5.5rem', color: '#b2bdd9', fontSize: '.92rem' } }, label),
    input, readout);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: limit the pull of a high rent'),
    h('p', { class: 'sub' }, 'Drag any apartment dot (or the amber guess marker) along the dollar line. Press Step or Play to watch the capped pulls move the guess and lower the Huber loss.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', style: { marginTop: 0, marginBottom: '.55rem' } }, roundPill, statusPill),
        svg,
        h('div', { class: 'sim-row' },
          btn('Step', () => { stop(); doStep(); }, 'go'),
          playBtn,
          btn('Reset guess', () => { stop(); resetGuessToMean(); draw(); }),
          btn('New data (random)', () => { stop(); makeRandom(); draw(); }),
          btn('Original 5 rents', () => { stop(); restoreOriginal(); draw(); })),
        sliderRow('Pull limit', deltaInput, deltaVal),
        sliderRow('Step size', lrInput, lrVal),
        sliderRow('Speed', spdInput, spdVal),
        h('div', { class: 'sim-row', style: { marginTop: '.65rem' } },
          btn('−$20', () => bumpSel(-20)),
          btn('+$20', () => bumpSel(20)),
          selLabel)),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'With the original 5 rents (limit $120, step size 0.25), press Step twice to reach $1,430 and loss 45,400.',
      check: st => st.isOriginal && st.delta === 120 && st.round >= 2 && Math.abs(st.guess - 1430) < 0.5,
      why: 'Yes! Two rounds move the marker 1,480 → 1,440 → 1,430, where the −120 regular pull balances the +120 capped high pull.'
    },
    {
      text: 'Raise the pull limit to $350 or more and run Step or Play. Where does the guess settle when no pull is capped?',
      check: st => st.isOriginal && st.delta >= 350 && st.round >= 1 && Math.abs(st.guess - st.mean) < 1,
      why: 'Right at the ordinary average ($1,480). When the limit is wider than every gap, Huber loss gives the same fit as squared gaps.'
    },
    {
      text: 'Reset with limit $120, set step size to 0.55 or higher, and run at least 4 steps. Will the loss settle, or bounce?',
      check: st => st.delta <= 200 && st.lr >= 0.55 && st.round >= 4 && st.jumpedUp,
      why: 'It bounces! Too big a step size overshoots the balance point again and again, so the loss jumps up instead of settling.'
    },
    {
      text: 'Drag the pink high listing past $2,000 (or press New data), set limit to $120 and step size to 0.25, and run until balanced.',
      check: st => (st.usedRandom || st.maxRent >= 2000) && st.delta <= 150 && st.lr <= 0.35 && st.round >= 2 && st.settled,
      why: 'Even with an extreme rent or fresh random data, capping large pulls keeps the settled fit close to the main group.'
    }
  ]);

  function resetHistoryFromCurrentGuess() {
    round = 0;
    lastStep = null;
    history = [{ round: 0, guess, loss: totalLoss(rents, guess, delta) }];
  }
  function resetGuessToMean() {
    guess = Math.round(MEAN(rents));
    resetHistoryFromCurrentGuess();
  }
  function restoreOriginal() {
    rents = START.slice();
    delta = 120; deltaInput.value = 120; deltaVal.textContent = '$120';
    lr = 0.25; lrInput.value = 0.25; lrVal.textContent = '0.25';
    sel = 4;
    resetGuessToMean();
  }
  function makeRandom() {
    const base = rnd(125, 148) * 10;
    const reg = [
      base - rnd(5, 10) * 10,
      base - rnd(0, 3) * 10,
      base + rnd(0, 3) * 10,
      base + rnd(5, 10) * 10
    ].sort((a, b) => a - b);
    const high = Math.min(2160, base + rnd(34, 56) * 10);
    rents = [...reg, high];
    usedRandom = true;
    resetGuessToMean();
  }
  function bumpSel(d) {
    stop();
    rents[sel] = Math.max(1100, Math.min(2200, rents[sel] + d));
    resetGuessToMean();
    draw();
  }

  function doStep() {
    if (round >= 60) { stop(); return; }
    const info = analyze(rents, guess, delta, lr);
    lastStep = { roundFrom: round, oldGuess: guess, ...info };
    guess = info.nextGuess;
    round += 1;
    history.push({ round, guess, loss: info.newLoss });
    draw();
    if (playing && Math.abs(info.combined) < 0.05) stop();
  }
  function start() {
    if (playing) return;
    playing = true;
    playBtn.textContent = 'Pause';
    playBtn.className = 'sim-btn go';
    timer = setInterval(doStep, Math.round(1000 / speed));
  }
  function stop() {
    playing = false;
    playBtn.textContent = 'Play';
    playBtn.className = 'sim-btn';
    if (timer) { clearInterval(timer); timer = null; }
  }

  // Axis scale for rent number line
  function domain() {
    const lo = Math.min(1200, Math.floor((Math.min(...rents, guess) - 80) / 100) * 100);
    const hi = Math.max(2100, Math.ceil((Math.max(...rents, guess) + 80) / 100) * 100);
    return [lo, hi];
  }
  function xOf(v, lo, hi) { return X0 + (v - lo) / (hi - lo) * (X1 - X0); }
  function vOf(x, lo, hi) { return lo + (x - X0) / (X1 - X0) * (hi - lo); }

  // Dragging dots or guess marker
  let dragKind = null; // 'rent' | 'guess' | null
  let dragIdx = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y > LINE_Y + 95) return;
    const [lo, hi] = domain();
    // Check guess marker handle first if near LINE_Y + 25 or directly on marker
    const gx = xOf(guess, lo, hi);
    const hitR = NARROW ? 24 : 26;
    let bestD = Infinity, bestKind = null, bestI = -1;
    // Check rent dots
    rents.forEach((v, i) => {
      const sameBefore = rents.slice(0, i).filter(x => Math.abs(x - v) < 5).length;
      const dx = p.x - xOf(v, lo, hi), dy = p.y - (LINE_Y - 26 - sameBefore * 24);
      const d = Math.hypot(dx, dy);
      if (d < hitR && d < bestD) { bestD = d; bestKind = 'rent'; bestI = i; }
    });
    const gd = Math.hypot(p.x - gx, p.y - (LINE_Y + 4));
    if (gd < hitR && gd < bestD) { bestD = gd; bestKind = 'guess'; bestI = -1; }
    if (!bestKind) return;
    stop();
    dragKind = bestKind;
    dragIdx = bestI;
    if (bestKind === 'rent') sel = bestI;
    svg.setPointerCapture(e.pointerId);
    onDrag(e);
  });
  function onDrag(e) {
    if (!dragKind) return;
    const p = toSvg(e), [lo, hi] = domain();
    const val = Math.round(vOf(Math.max(X0, Math.min(X1, p.x)), lo, hi) / 10) * 10;
    const clamped = Math.max(1100, Math.min(2200, val));
    if (dragKind === 'rent') {
      rents[dragIdx] = clamped;
      resetGuessToMean();
    } else {
      guess = clamped;
      resetHistoryFromCurrentGuess();
    }
    draw();
  }
  svg.addEventListener('pointermove', onDrag);
  const endDrag = () => { dragKind = null; dragIdx = -1; };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  function draw() {
    const [lo, hi] = domain();
    const meanVal = MEAN(rents);
    const info = analyze(rents, guess, delta, lr);
    const settled = Math.abs(info.combined) < 0.5;
    const jumpedUp = history.some((pt, i) => i > 0 && pt.loss > history[i - 1].loss + 1);
    const k = [];

    // --- Top Panel: Rent Number Line + Limit Zone + Capped Pulls ---
    const gx = xOf(guess, lo, hi);
    const glx = Math.max(X0, xOf(guess - delta, lo, hi));
    const grx = Math.min(X1, xOf(guess + delta, lo, hi));

    // Shaded ±limit window
    k.push(s('rect', { x: glx, y: 34, width: Math.max(0, grx - glx), height: LINE_Y - 34, fill: C.violet, 'fill-opacity': 0.11, rx: 4 }));
    if (guess - delta >= lo) {
      k.push(s('line', { x1: glx, x2: glx, y1: 34, y2: LINE_Y + 6, stroke: C.violet, 'stroke-width': 1.8, 'stroke-dasharray': '5 4' }),
        s('text', { x: glx, y: 26, fill: C.violet, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `−${delta}`));
    }
    if (guess + delta <= hi) {
      k.push(s('line', { x1: grx, x2: grx, y1: 34, y2: LINE_Y + 6, stroke: C.violet, 'stroke-width': 1.8, 'stroke-dasharray': '5 4' }),
        s('text', { x: grx, y: 26, fill: C.violet, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `+${delta}`));
    }

    // Number line and dollar ticks
    k.push(s('line', { x1: X0, x2: X1, y1: LINE_Y, y2: LINE_Y, stroke: C.muted, 'stroke-width': 2.5 }));
    const tickStep = (hi - lo) > 900 ? 200 : 100;
    for (let v = Math.ceil(lo / tickStep) * tickStep; v <= hi; v += tickStep) {
      const tx = xOf(v, lo, hi);
      k.push(s('line', { x1: tx, x2: tx, y1: LINE_Y - 5, y2: LINE_Y + 5, stroke: C.muted, 'stroke-width': 1.5 }),
        s('text', { x: tx, y: LINE_Y + 21, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v));
    }

    // Ordinary mean reference line
    const mx = xOf(meanVal, lo, hi);
    k.push(s('line', { x1: mx, x2: mx, y1: 42, y2: LINE_Y, stroke: C.amber, 'stroke-opacity': 0.5, 'stroke-width': 1.8, 'stroke-dasharray': '4 4' }),
      s('text', { x: Math.min(X1 - 36, Math.max(X0 + 36, mx)), y: 52, fill: C.amber, 'fill-opacity': 0.8, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `avg $${fmtInt(meanVal)}`));

    // Apartment dots
    rents.forEach((v, i) => {
      const isHigh = i === 4;
      const col = isHigh ? C.pink : C.cyan;
      const sameBefore = rents.slice(0, i).filter(x => Math.abs(x - v) < 5).length;
      const cx = xOf(v, lo, hi), cy = LINE_Y - 26 - sameBefore * 24;
      if (i === sel) k.push(s('circle', { cx, cy, r: 17, fill: 'none', stroke: C.ink, 'stroke-opacity': 0.45, 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }));
      k.push(s('circle', { cx, cy, r: 14, fill: col, 'fill-opacity': 0.18 }),
        s('circle', { cx, cy, r: 7.5, fill: col, stroke: isHigh ? C.pink : 'none', 'stroke-width': isHigh ? 2 : 0 }),
        s('text', { x: cx, y: cy + 4, fill: C.bg, 'font-size': 10, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, NAMES[i]));
      if (isHigh) k.push(s('circle', { cx, cy, r: 12, fill: 'none', stroke: C.pink, 'stroke-width': 2 }));
      // Show rent label for outermost or selected or M
      if (sameBefore === 0 && (isHigh || i === 0 || i === sel)) {
        k.push(s('text', { x: cx, y: cy - 15, fill: col, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '$' + fmtInt(v)));
      }
    });

    // Current guess marker
    const mCol = settled ? C.green : C.amber;
    k.push(s('line', { x1: gx, x2: gx, y1: 60, y2: LINE_Y + 6, stroke: mCol, 'stroke-width': 3 }),
      s('circle', { cx: gx, cy: LINE_Y, r: 9, fill: mCol, stroke: C.bg, 'stroke-width': 2 }));
    const tagW = 86 * F, tagX = Math.max(X0, Math.min(X1 - tagW, gx - tagW / 2));
    k.push(s('rect', { x: tagX, y: LINE_Y + 29, width: tagW, height: 24, rx: 8, fill: C.bg, stroke: mCol, 'stroke-width': 1.8 }),
      s('text', { x: tagX + tagW / 2, y: LINE_Y + 45, fill: mCol, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '$' + fmtNum(guess)));

    // Pull bars below marker (regular net pull vs high pull)
    const pullY = LINE_Y + 76;
    const pxScale = ((X1 - X0) / (hi - lo)) * 0.62;
    function pullBar(val, y, col, lbl) {
      if (Math.abs(val) < 0.2) return;
      const x2 = Math.max(X0 + 8, Math.min(X1 - 8, gx + val * pxScale));
      const dir = val > 0 ? 1 : -1;
      k.push(s('line', { x1: gx, x2, y1: y, y2: y, stroke: col, 'stroke-width': 4, 'stroke-linecap': 'round' }),
        s('path', { d: `M ${x2 - dir * 8} ${y - 5} L ${x2} ${y} L ${x2 - dir * 8} ${y + 5}`, fill: 'none', stroke: col, 'stroke-width': 2.8, 'stroke-linecap': 'round' }),
        s('text', { x: x2 + dir * 6, y: y + 4, fill: col, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': dir > 0 ? 'start' : 'end', 'font-family': 'Consolas' }, lbl));
    }
    pullBar(info.regPull, pullY, C.cyan, `reg ${fmtSigned(info.regPull)}`);
    pullBar(info.highPull, pullY + 22, C.pink, `M ${fmtSigned(info.highPull)}`);
    k.push(s('line', { x1: gx, x2: gx, y1: pullY - 8, y2: pullY + 30, stroke: mCol, 'stroke-opacity': 0.5, 'stroke-width': 1.5 }));

    // --- Bottom Panel: Growing Loss-vs-Round Curve ---
    k.push(s('line', { x1: X0, x2: X1, y1: CHART_TOP - 22, y2: CHART_TOP - 22, stroke: C.line, 'stroke-width': 1 }),
      s('text', { x: X0, y: CHART_TOP - 8, fill: C.ink, 'font-size': 13 * F, 'font-weight': 700 }, 'Huber loss by round'));

    const maxR = Math.max(5, round);
    const losses = history.map(p => p.loss);
    const minL = Math.min(...losses), maxL = Math.max(...losses);
    const padL = Math.max(800, (maxL - minL) * 0.22);
    const yLo = Math.max(0, Math.floor((minL - padL) / 500) * 500);
    const yHi = Math.ceil((maxL + padL) / 500) * 500 + (maxL === minL ? 2000 : 0);
    const cxR = r => X0 + 10 + (r / maxR) * (X1 - X0 - 24);
    const cyL = l => CHART_BOT - ((l - yLo) / Math.max(1, yHi - yLo)) * (CHART_BOT - CHART_TOP);

    // Chart axes & grid
    k.push(s('line', { x1: X0, x2: X1, y1: CHART_BOT, y2: CHART_BOT, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: X0, x2: X0, y1: CHART_TOP, y2: CHART_BOT, stroke: C.muted, 'stroke-width': 1.5 }));
    for (let g = 0; g <= 3; g++) {
      const lv = yLo + (g / 3) * (yHi - yLo);
      const y = cyL(lv);
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line, 'stroke-opacity': 0.55 }),
        s('text', { x: X0 - 6, y: y + 4, fill: C.muted, 'font-size': 10.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, lv >= 1000 ? `${(lv / 1000).toFixed(1)}k` : Math.round(lv)));
    }
    const rStep = maxR <= 8 ? 1 : Math.ceil(maxR / 6);
    for (let r = 0; r <= maxR; r += rStep) {
      const x = cxR(r);
      k.push(s('text', { x, y: CHART_BOT + 18, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, r));
    }
    k.push(s('text', { x: (X0 + X1) / 2, y: CHART_BOT + 34, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle' }, 'round'));

    // Loss polyline & points
    if (history.length > 1) {
      const dPath = history.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${cxR(pt.round)} ${cyL(pt.loss)}`).join(' ');
      k.push(s('path', { d: dPath, fill: 'none', stroke: jumpedUp ? C.pink : C.green, 'stroke-width': 2.8 }));
    }
    history.forEach((pt, idx) => {
      const px = cxR(pt.round), py = cyL(pt.loss);
      const isLast = idx === history.length - 1;
      const col = isLast ? (settled ? C.green : jumpedUp ? C.pink : C.amber) : C.cyan;
      k.push(s('circle', { cx: px, cy: py, r: isLast ? 5.5 : 3.5, fill: col }));
      if (isLast) {
        const lx = px > X1 - 65 ? px - 8 : px + 8;
        const anc = px > X1 - 65 ? 'end' : 'start';
        k.push(s('text', { x: lx, y: Math.max(CHART_TOP + 12, py - 8), fill: col, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': anc, 'font-family': 'Consolas' }, fmtInt(pt.loss)));
      }
    });

    svg.replaceChildren(...k);

    // Pills & Formula Box
    roundPill.textContent = `ROUND ${round}`;
    statusPill.textContent = settled ? 'BALANCED ✓' : jumpedUp ? 'BOUNCING!' : 'MOVING';
    statusPill.style.color = settled ? C.green : jumpedUp ? C.pink : C.cyan;
    statusPill.style.borderColor = statusPill.style.color;

    const lines = [
      [`guess = $${fmtNum(guess)}   (avg $${fmtInt(meanVal)})`, mCol],
      [`4 regular pulls = ${fmtSigned(info.regPull)}`, C.cyan],
      [`high M pull     = ${fmtSigned(info.highPull)}${Math.abs(rents[4] - guess) > delta ? ' (capped)' : ''}`, C.pink],
      [`combined pull   = ${fmtSigned(info.combined)}`, C.amber],
      [`next move       = ${lr.toFixed(2)} × (${fmtSigned(info.combined)}) = ${fmtSigned(info.move)}`, C.green],
      [`Huber loss      = ${fmtInt(info.oldLoss)}`, C.ink]
    ];
    if (lastStep) {
      lines.push([`last step (R${lastStep.roundFrom}→R${round}): $${fmtNum(lastStep.oldGuess)} → $${fmtNum(lastStep.nextGuess)}`, C.muted]);
    }
    fbox(box, lines);

    note.textContent = settled
      ? `Pulls balance at $${fmtNum(guess)}. The regular listings and the high listing pull with equal force, so the marker stays put.`
      : jumpedUp
        ? 'The step size is too large: each jump overshoots the balance point and pushes the loss back up. Try lowering step size to 0.25.'
        : `Press Step to move by ${lr.toFixed(2)} × (${fmtSigned(info.combined)}) = ${fmtSigned(info.move)}, or press Play to watch it run.`;

    selLabel.textContent = `Selected: ${NAMES[sel]} ($${fmtInt(rents[sel])})`;

    const isOriginal = rents.every((v, i) => v === START[i]);
    chal.update({
      isOriginal,
      delta,
      lr,
      round,
      guess,
      mean: meanVal,
      settled,
      jumpedUp,
      usedRandom,
      maxRent: Math.max(...rents)
    });
  }

  draw();
  return () => stop();
}
