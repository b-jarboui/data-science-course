// 3.3.6 Try it: nonresponse bias.
// Drag either group's dot block up or down (or use -10% / +10%) to change reply rates,
// simulate random replies, repair with weights, generate new data, and solve 4 challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const START = { nShort: 50, mShort: 18, mLong: 42, rShort: 80, rLong: 40 };
  let st = { ...START };
  let shortMask = null, longMask = null; // null = neat bottom-up fill; array of booleans = simulated random draw
  let weightMix = 0, weightedOn = false, anim = 0;
  let isRandomData = false, randomWeighted = 0, countedRandomThisSet = false;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const rateLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const wBtn = btn('Apply weights', () => toggleWeights(), 'go');

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: nonresponse bias'),
    h('p', { class: 'sub' }, 'One hundred chosen students: cyan = short trips, pink = long trips. Drag either block up or down to change who replies, or tap the buttons.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Short −10%', () => bumpRate('rShort', -10)),
          btn('Short +10%', () => bumpRate('rShort', 10)),
          btn('Long −10%', () => bumpRate('rLong', -10)),
          btn('Long +10%', () => bumpRate('rLong', 10)),
          rateLabel),
        h('div', { class: 'sim-row' },
          wBtn,
          btn('Follow up (+10%)', () => followUp()),
          btn('Simulate 1 draw', () => simulateDraw()),
          btn('New data (random)', () => newData()),
          btn('Start again', () => reset()))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const r2 = x => Math.round(x * 100) / 100;
  const nLong = () => 100 - st.nShort;

  function activeCounts() {
    const nl = nLong();
    const cs = shortMask ? shortMask.filter(Boolean).length : Math.max(1, Math.round(st.nShort * st.rShort / 100));
    const cl = longMask ? longMask.filter(Boolean).length : Math.max(1, Math.round(nl * st.rLong / 100));
    return { cs, cl, ns: st.nShort, nl };
  }

  function stats() {
    const { cs, cl, ns, nl } = activeCounts();
    const truth = (ns * st.mShort + nl * st.mLong) / 100;
    const replies = cs + cl;
    const rawMean = (cs * st.mShort + cl * st.mLong) / replies;
    const wShort = ns / cs, wLong = nl / cl;
    const wMean = (cs * wShort * st.mShort + cl * wLong * st.mLong) / 100;
    const gap = rawMean - truth;
    const shortRate = Math.round(cs / ns * 100);
    const longRate = Math.round(cl / nl * 100);
    const respRate = replies;
    return { cs, cl, ns, nl, truth, replies, rawMean, wShort, wLong, wMean, gap, shortRate, longRate, respRate };
  }

  const chal = challenges(ch, [
    { text: 'Make both groups reply at the exact same rate (below 100%, like 40%). What happens to the gap?',
      check: x => x.shortRate === x.longRate && x.shortRate < 100,
      why: 'Zero gap! Even with many silent students, the mean does not lean when both groups reply at the same rate.' },
    { text: 'Get a high response rate (at least 70%), yet still miss the truth by 3 minutes or more.',
      check: x => x.respRate >= 70 && Math.abs(x.gap) >= 3,
      why: 'Right: a big response rate still leans when one group replies much more than the other.' },
    { text: 'Make the reply mean at least 4 minutes away from the truth, then press “Apply weights”.',
      check: x => Math.abs(x.gap) >= 4 && x.weighted,
      why: 'Yes! Weighting each reply by how many students it speaks for brings the estimate back to the truth.' },
    { text: 'Press “New data (random)” and then “Apply weights”, twice. Does weighting always return to the truth?',
      check: x => x.randomWeighted >= 2,
      why: 'Always — as long as each group has replies and you know which group every chosen student belongs to.' },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 440, F = NARROW ? 1.18 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const PAD = NARROW ? 16 : 26;
  const GRID_TOP = 54, GRID_BOT = 304;
  const SCALE_Y = 382;
  const SX0 = PAD + 14, SX1 = VW - PAD - 14;
  const minScale = () => Math.min(10, Math.floor((st.mShort - 4) / 5) * 5);
  const maxScale = () => Math.max(50, Math.ceil((st.mLong + 4) / 5) * 5);
  const m2x = v => SX0 + (v - minScale()) / (maxScale() - minScale()) * (SX1 - SX0);

  function animateWeights(target) {
    weightedOn = target === 1;
    wBtn.textContent = weightedOn ? 'Remove weights' : 'Apply weights';
    if (weightedOn && isRandomData && !countedRandomThisSet) {
      randomWeighted++;
      countedRandomThisSet = true;
    }
    cancelAnimationFrame(anim);
    const from = weightMix, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 700);
      weightMix = from + (target - from) * k * k * (3 - 2 * k);
      draw();
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  function toggleWeights() { animateWeights(weightedOn ? 0 : 1); }

  function clearWeightsImmediate() {
    cancelAnimationFrame(anim);
    weightedOn = false;
    weightMix = 0;
    wBtn.textContent = 'Apply weights';
  }

  function bumpRate(key, delta) {
    shortMask = null; longMask = null;
    st[key] = Math.max(10, Math.min(100, Math.round((st[key] + delta) / 10) * 10));
    clearWeightsImmediate();
    draw();
  }

  function followUp() {
    shortMask = null; longMask = null;
    st.rShort = Math.min(100, st.rShort + 10);
    st.rLong = Math.min(100, st.rLong + 10);
    clearWeightsImmediate();
    draw();
  }

  function simulateDraw() {
    const drawMask = (n, pct) => {
      const arr = Array.from({ length: n }, () => Math.random() * 100 < pct);
      if (!arr.some(Boolean)) arr[rnd(0, n - 1)] = true;
      return arr;
    };
    shortMask = drawMask(st.nShort, st.rShort);
    longMask = drawMask(nLong(), st.rLong);
    clearWeightsImmediate();
    draw();
  }

  function newData() {
    const splits = [40, 50, 60];
    st.nShort = splits[rnd(0, splits.length - 1)];
    st.mShort = rnd(10, 22);
    st.mLong = rnd(36, 52);
    st.rShort = rnd(5, 9) * 10;
    st.rLong = rnd(2, 5) * 10;
    if (Math.abs(st.rShort - st.rLong) < 20) st.rLong = Math.max(20, st.rShort - 30);
    shortMask = null; longMask = null;
    isRandomData = true;
    countedRandomThisSet = false;
    clearWeightsImmediate();
    draw();
  }

  function reset() {
    st = { ...START };
    shortMask = null; longMask = null;
    isRandomData = false;
    countedRandomThisSet = false;
    clearWeightsImmediate();
    draw();
  }

  // Pointer drag on either dot block sets that group's reply rate directly
  let dragging = null;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  const setFromPointer = e => {
    if (!dragging) return;
    const p = toSvg(e);
    const frac = Math.max(0.1, Math.min(1, (GRID_BOT - p.y) / (GRID_BOT - GRID_TOP)));
    const pct = Math.max(10, Math.min(100, Math.round(frac * 50) * 2));
    shortMask = null; longMask = null;
    st[dragging] = pct;
    clearWeightsImmediate();
    draw();
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y < GRID_TOP - 24 || p.y > GRID_BOT + 24) return;
    dragging = p.x < VW / 2 ? 'rShort' : 'rLong';
    svg.setPointerCapture(e.pointerId);
    setFromPointer(e);
  });
  svg.addEventListener('pointermove', setFromPointer);
  svg.addEventListener('pointerup', () => { dragging = null; });
  svg.addEventListener('pointercancel', () => { dragging = null; });

  function drawGroup(k, opts) {
    const { x0, x1, n, repliedCount, mask, color, title, meanVal, weight } = opts;
    const rows = NARROW ? 10 : 5;
    const cols = n / rows;
    const padX = NARROW ? 10 : 14, padY = 14;
    const dx = cols > 1 ? (x1 - x0 - padX * 2) / (cols - 1) : 0;
    const dy = rows > 1 ? (GRID_BOT - GRID_TOP - padY * 2) / (rows - 1) : 0;
    const rBase = Math.min(NARROW ? 7.5 : 10, Math.min(dx, dy) * 0.36);
    const wScale = 1 + (Math.min(2.1, Math.sqrt(weight)) - 1) * weightMix;

    k.push(s('rect', { x: x0, y: GRID_TOP - 8, width: x1 - x0, height: GRID_BOT - GRID_TOP + 16, rx: 12, fill: '#ffffff', 'fill-opacity': 0.03, stroke: C.line }));
    k.push(s('text', { x: (x0 + x1) / 2, y: GRID_TOP - 20, fill: color, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${title} (${n} · mean ${meanVal})`));

    for (let i = 0; i < n; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const cx = x0 + padX + col * dx;
      const cy = GRID_BOT - padY - row * dy;
      const isRep = mask ? mask[i] : i < repliedCount;
      const r = isRep ? rBase * wScale : rBase * 0.62;
      k.push(s('circle', {
        cx, cy, r,
        fill: isRep ? color : C.muted,
        'fill-opacity': isRep ? 0.94 : 0.22
      }));
    }

    const ratePct = Math.round(repliedCount / n * 100);
    const subTxt = weightMix > 0.5
      ? `${repliedCount} × ${fmt(r2(weight))} = ${n}`
      : `${repliedCount}/${n} replied (${ratePct}%)`;
    k.push(s('text', { x: (x0 + x1) / 2, y: GRID_BOT + 26, fill: color, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, subTxt));
  }

  function draw() {
    const x = stats();
    const k = [];
    const midGap = NARROW ? 16 : 26;
    const halfW = (VW - PAD * 2 - midGap) / 2;

    drawGroup(k, {
      x0: PAD, x1: PAD + halfW, n: x.ns, repliedCount: x.cs, mask: shortMask,
      color: C.cyan, title: 'SHORT', meanVal: st.mShort, weight: x.wShort
    });
    drawGroup(k, {
      x0: PAD + halfW + midGap, x1: VW - PAD, n: x.nl, repliedCount: x.cl, mask: longMask,
      color: C.pink, title: 'LONG', meanVal: st.mLong, weight: x.wLong
    });

    // Number line (minutes)
    const mn = minScale(), mx = maxScale();
    k.push(s('line', { x1: SX0, x2: SX1, y1: SCALE_Y, y2: SCALE_Y, stroke: C.muted, 'stroke-width': 2.5 }));
    for (let v = mn; v <= mx; v += 10) {
      const px = m2x(v);
      k.push(
        s('line', { x1: px, x2: px, y1: SCALE_Y - 5, y2: SCALE_Y + 5, stroke: C.muted }),
        s('text', { x: px, y: SCALE_Y + 22, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v)
      );
    }
    k.push(s('text', { x: SX1, y: SCALE_Y + 40, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Segoe UI, Arial' }, 'minutes'));

    const xt = m2x(x.truth);
    const estVal = x.rawMean + (x.wMean - x.rawMean) * weightMix;
    const xe = m2x(estVal);
    const gapNow = estVal - x.truth;

    // Gap bar between estimate and truth
    if (Math.abs(gapNow) >= 0.05) {
      k.push(s('line', { x1: xe, x2: xt, y1: SCALE_Y - 12, y2: SCALE_Y - 12, stroke: C.pink, 'stroke-width': 5, 'stroke-linecap': 'round' }));
    }

    // Truth dashed line
    k.push(
      s('line', { x1: xt, x2: xt, y1: SCALE_Y - 34, y2: SCALE_Y + 8, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '6 5' }),
      s('text', { x: xt + (xe <= xt ? 8 : -8), y: SCALE_Y - 22, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': xe <= xt ? 'start' : 'end', 'font-family': 'Consolas' }, `TRUTH ${fmt(r2(x.truth))}`)
    );

    // Estimate marker (pink when biased, green when on truth / weighted)
    const estCol = Math.abs(gapNow) < 0.05 ? C.green : C.pink;
    const estTag = weightMix > 0.5 ? `WEIGHTED ${fmt(r2(estVal))}` : `REPLIES ${fmt(r2(estVal))}`;
    k.push(
      s('line', { x1: xe, x2: xe, y1: SCALE_Y - 30, y2: SCALE_Y, stroke: estCol, 'stroke-width': 3 }),
      s('circle', { cx: xe, cy: SCALE_Y, r: 7, fill: estCol }),
      s('text', { x: xe + (xe <= xt ? -8 : 8), y: SCALE_Y - 22, fill: estCol, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': xe <= xt ? 'end' : 'start', 'font-family': 'Consolas' }, estTag)
    );

    svg.replaceChildren(...k);

    const sign = x.gap > 0.005 ? '+' : '';
    const gapText = Math.abs(x.gap) < 0.05 ? '0 min (no bias)' : `${sign}${fmt(r2(x.gap))} min`;
    const lines = [
      [`truth    = (${x.ns}×${st.mShort} + ${x.nl}×${st.mLong}) ÷ 100 = ${fmt(r2(x.truth))}`, C.amber],
      `replies  = ${x.cs} + ${x.cl} = ${x.replies}  (rate ${x.respRate}%)`,
      [`raw mean = (${x.cs}×${st.mShort} + ${x.cl}×${st.mLong}) ÷ ${x.replies} = ${fmt(r2(x.rawMean))}`, Math.abs(x.gap) < 0.05 ? C.green : C.pink],
      [`gap      = ${gapText}`, Math.abs(x.gap) < 0.05 ? C.green : C.pink],
    ];
    if (weightMix > 0.5) {
      lines.push(
        [`weights  = ${fmt(r2(x.wShort))} (short), ${fmt(r2(x.wLong))} (long)`, C.cyan],
        [`weighted = ${fmt(r2(x.wMean))} min`, C.green]
      );
    }
    fbox(box, lines);

    note.textContent = weightMix > 0.5
      ? 'Weighted: each reply speaks for its share of the group, pulling the estimate back to the true mean.'
      : Math.abs(x.gap) < 0.05
        ? 'Both groups replied at the same rate, so the replies still match the true mix.'
        : 'One group replied more often than the other, so the mean of the replies leans toward that group.';
    rateLabel.textContent = `Response rate: ${x.respRate}%`;

    chal.update({
      shortRate: x.shortRate,
      longRate: x.longRate,
      respRate: x.respRate,
      gap: r2(x.gap),
      weighted: weightedOn,
      randomWeighted
    });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}
