// 5.1.4 Try it: Negative binomial counts.
// Adjust target yeses (r) and urgent chance (p), tap/drag bars to inspect any ticket k,
// simulate fresh ticket streams to watch empirical counts match the formula, and solve 4 challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const URG = '#ff6b4a';

  // State (defaults match the lesson: r = 3, p = 1/5 = 0.20, inspect k = 5)
  let r = 3, p = 0.20, kSel = 5;
  let simCounts = {}, simTotal = 0, simSum = 0;
  let lastStream = ['U', 'U', 'N', 'N', 'U']; // starts on a valid ticket-5 row
  let isSimStream = false;
  let anim = 0;

  // Math helpers
  function comb(n, k) {
    if (k < 0 || k > n) return 0;
    let res = 1;
    for (let i = 1; i <= Math.min(k, n - k); i++) res = res * (n - i + 1) / i;
    return Math.round(res);
  }
  const nbProb = (k, rv = r, pv = p) => {
    if (k < rv) return 0;
    return comb(k - 1, rv - 1) * Math.pow(pv, rv) * Math.pow(1 - pv, k - rv);
  };
  const meanWait = () => r / p;
  const sdWait = () => Math.sqrt(r * (1 - p)) / p;
  const kMax = () => Math.max(r + 14, Math.min(46, Math.ceil(meanWait() + 2.3 * sdWait())));

  function oneTrial() {
    const seq = [];
    let hits = 0;
    while (hits < r) {
      const u = Math.random() < p;
      seq.push(u ? 'U' : 'N');
      if (u) hits++;
    }
    return seq;
  }

  function clearSim() {
    cancelAnimationFrame(anim);
    simCounts = {}; simTotal = 0; simSum = 0;
    isSimStream = false;
    lastStream = defaultExample(r, kSel);
  }

  function defaultExample(rv, kv) {
    const len = Math.max(rv, kv);
    const seq = Array(len).fill('N');
    for (let i = 0; i < rv - 1; i++) seq[i] = 'U';
    seq[len - 1] = 'U';
    return seq;
  }

  // Controls & layout
  const svg = s('svg', { viewBox: '0 0 700 450' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const rLabel = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', fontWeight: 700, color: URG } });
  const pLabel = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', fontWeight: 700, color: C.cyan } });
  const pSlider = h('input', {
    type: 'range', min: 10, max: 60, step: 5, value: 20,
    style: { width: '130px', accentColor: C.cyan },
    oninput: e => { p = Number(e.target.value) / 100; clearSim(); draw(); }
  });

  function setR(next) {
    r = Math.max(1, Math.min(6, next));
    if (kSel < r) kSel = r;
    if (kSel > kMax()) kSel = kMax();
    clearSim();
    draw();
  }

  function runSingle() {
    cancelAnimationFrame(anim);
    const seq = oneTrial();
    const k = seq.length;
    lastStream = seq;
    isSimStream = true;
    simCounts[k] = (simCounts[k] || 0) + 1;
    simTotal++;
    simSum += k;
    kSel = Math.min(kMax(), k);
    draw();
  }

  function runMany(totalAdd) {
    cancelAnimationFrame(anim);
    let left = totalAdd;
    const perFrame = Math.max(1, Math.ceil(totalAdd / 28));
    const step = () => {
      const batch = Math.min(left, perFrame);
      let seq = null;
      for (let i = 0; i < batch; i++) {
        seq = oneTrial();
        const k = seq.length;
        simCounts[k] = (simCounts[k] || 0) + 1;
        simTotal++;
        simSum += k;
      }
      if (seq) { lastStream = seq; isSimStream = true; }
      left -= batch;
      draw();
      if (left > 0) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  function newRandomData() {
    const pChoices = [0.15, 0.20, 0.25, 0.30, 0.40, 0.50];
    r = rnd(1, 5);
    p = pChoices[rnd(0, pChoices.length - 1)];
    pSlider.value = Math.round(p * 100);
    kSel = Math.max(r, Math.round(meanWait()));
    clearSim();
    runSingle();
  }

  function resetAll() {
    r = 3; p = 0.20; kSel = 5;
    pSlider.value = 20;
    clearSim();
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: waiting for the r-th urgent ticket'),
    h('p', { class: 'sub' }, 'Change the target r or the urgent chance p, tap or drag across the bars to inspect any ticket k, and run fresh streams to watch the simulated counts match the formula.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('r −', () => setR(r - 1)),
          rLabel,
          btn('r +', () => setR(r + 1)),
          pSlider,
          pLabel),
        h('div', { class: 'sim-row' },
          btn('New stream (1)', runSingle, 'go'),
          btn('Run 25', () => runMany(25)),
          btn('Run 200', () => runMany(200)),
          btn('New data (random r & p)', newRandomData),
          btn('Start again', resetAll))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'With r = 3 and p = 0.20, tap the bars to find a most likely ticket number.',
      check: st => st.r === 3 && Math.abs(st.p - 0.20) < 1e-6 && (st.kSel === 10 || st.kSel === 11),
      why: 'Yes! Tickets 10 and 11 tie for the tallest bar at about 6%, even though the average wait is 15.'
    },
    {
      text: 'Lower the target to r = 1 urgent ticket. Watch how the bar chart changes shape.',
      check: st => st.r === 1,
      why: 'With r = 1, ticket 1 is tallest and every bar shrinks by (1 − p). That is the geometric count.'
    },
    {
      text: 'Set r and p (with r ≥ 2) so the mean wait r ÷ p is exactly 10 tickets.',
      check: st => st.r >= 2 && Math.abs(st.mean - 10) < 1e-6,
      why: 'Right! Whenever r ÷ p = 10 (such as r = 2, p = 0.20 or r = 4, p = 0.40), the average wait is 10 tickets.'
    },
    {
      text: 'Press “Run 200” (or run at least 200 streams) and compare the green bars to the formula.',
      check: st => st.simTotal >= 200,
      why: 'After many random streams, the simulated bars settle onto the formula bars and the average lands close to r ÷ p.'
    }
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 450, F = NARROW ? 1.18 : 1;
  const X0 = NARROW ? 42 : 52, X1 = VW - 14;
  const STREAM_Y = 46;
  const CHART_TOP = 132, BASE = 398;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  // Pointer interaction on the bar chart
  let dragging = false;
  const toSvg = e => {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  function pickBar(e) {
    const pt = toSvg(e);
    if (pt.y < CHART_TOP - 16 || pt.y > BASE + 30) return;
    const km = kMax(), count = km - r + 1;
    const step = (X1 - X0) / count;
    const idx = Math.floor((pt.x - X0) / step);
    const nextK = Math.max(r, Math.min(km, r + idx));
    if (nextK !== kSel) {
      kSel = nextK;
      if (!isSimStream) lastStream = defaultExample(r, kSel);
      draw();
    }
  }
  svg.addEventListener('pointerdown', e => {
    dragging = true;
    svg.setPointerCapture(e.pointerId);
    pickBar(e);
  });
  svg.addEventListener('pointermove', e => { if (dragging) pickBar(e); });
  svg.addEventListener('pointerup', () => { dragging = false; });

  function draw() {
    const km = kMax();
    if (kSel < r) kSel = r;
    if (kSel > km) kSel = km;
    const count = km - r + 1;
    const step = (X1 - X0) / count;
    const bw = Math.max(4, step * 0.72);
    const els = [];

    // --- Top band: ticket stream (latest simulated stream or sample valid row) ---
    const streamHeader = isSimStream
      ? `Latest stream: #${r} urgent landed on ticket ${lastStream.length}`
      : `Example row ending on ticket ${kSel}: ${r - 1} urgent earlier, last is urgent`;
    els.push(s('text', {
      x: X0, y: 22, fill: isSimStream ? C.green : C.muted,
      'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas, monospace'
    }, streamHeader));

    const maxShow = NARROW ? 14 : 24;
    const showTrunc = lastStream.length > maxShow;
    const visible = showTrunc
      ? [...lastStream.slice(0, maxShow - 3), '…', ...lastStream.slice(-2)]
      : lastStream;
    const cPitch = Math.min(27, (X1 - X0) / Math.max(visible.length, 6));
    const cW = Math.max(12, cPitch - 4), cH = 30;
    visible.forEach((ch, idx) => {
      const cx = X0 + idx * cPitch + cW / 2;
      if (ch === '…') {
        els.push(s('text', { x: cx, y: STREAM_Y + 6, fill: C.muted, 'font-size': 16, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '…'));
        return;
      }
      const isU = ch === 'U';
      const isLast = idx === visible.length - 1;
      const col = isU ? URG : C.cyan;
      els.push(s('rect', {
        x: cx - cW / 2, y: STREAM_Y - cH / 2, width: cW, height: cH, rx: 5,
        fill: col, 'fill-opacity': isU ? 0.30 : 0.14,
        stroke: isLast ? C.amber : col, 'stroke-width': isLast ? 2.4 : 1.4
      }));
      if (cW >= 15) {
        els.push(s('text', {
          x: cx, y: STREAM_Y + 5, fill: col, 'font-size': Math.min(14, cW * 0.65),
          'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, isU ? 'U' : 'C'));
      }
    });

    // Divider between stream and chart
    els.push(s('line', { x1: X0, x2: X1, y1: 84, y2: 84, stroke: C.line, 'stroke-width': 1 }));

    // Legend above chart
    els.push(
      s('rect', { x: X0, y: 95, width: 12, height: 12, rx: 2, fill: C.cyan, 'fill-opacity': 0.5, stroke: C.cyan }),
      s('text', { x: X0 + 18, y: 105, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Consolas' }, 'Formula'),
      s('rect', { x: X0 + (NARROW ? 90 : 102), y: 95, width: 12, height: 12, rx: 2, fill: C.green, 'fill-opacity': 0.85 }),
      s('text', { x: X0 + (NARROW ? 108 : 120), y: 105, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Consolas' },
        simTotal ? `Simulated (${simTotal})` : 'Simulated (press Run)')
    );

    // --- Main band: Negative binomial bar chart ---
    let maxP = 0.05;
    for (let k = r; k <= km; k++) {
      maxP = Math.max(maxP, nbProb(k));
      if (simTotal > 0) maxP = Math.max(maxP, (simCounts[k] || 0) / simTotal);
    }
    const yCeiling = Math.ceil(maxP * 100 / 2) * 2 / 100 || 0.06;
    const hScale = (BASE - CHART_TOP) / yCeiling;

    // Horizontal grid lines
    const gridSteps = 3;
    for (let g = 0; g <= gridSteps; g++) {
      const pv = (yCeiling * g) / gridSteps;
      const yy = BASE - pv * hScale;
      els.push(
        s('line', { x1: X0, x2: X1, y1: yy, y2: yy, stroke: C.line }),
        s('text', {
          x: X0 - 6, y: yy + 4, fill: C.muted, 'font-size': 11.5 * F,
          'text-anchor': 'end', 'font-family': 'Consolas'
        }, `${Math.round(pv * 100)}%`)
      );
    }

    // Bars (formula + simulated overlay)
    const tickEvery = count > 24 ? 5 : count > 14 ? 2 : 1;
    for (let k = r; k <= km; k++) {
      const cx = X0 + (k - r + 0.5) * step;
      const pv = nbProb(k);
      const bh = pv * hScale;
      const isSel = k === kSel;
      const col = isSel ? C.amber : C.cyan;
      els.push(s('rect', {
        x: cx - bw / 2, y: BASE - bh, width: bw, height: Math.max(1, bh), rx: 2,
        fill: col, 'fill-opacity': isSel ? 0.72 : 0.34,
        stroke: col, 'stroke-width': isSel ? 2 : 1
      }));

      if (simTotal > 0 && simCounts[k]) {
        const spv = simCounts[k] / simTotal;
        const sbh = spv * hScale;
        const sw = Math.max(2, bw * 0.46);
        els.push(s('rect', {
          x: cx - sw / 2, y: BASE - sbh, width: sw, height: Math.max(1, sbh), rx: 1.5,
          fill: C.green, 'fill-opacity': 0.88
        }));
      }

      if (k === r || k === kSel || k % tickEvery === 0) {
        els.push(s('text', {
          x: cx, y: BASE + 19, fill: isSel ? C.amber : C.muted,
          'font-size': (isSel ? 13 : 11.5) * F, 'font-weight': isSel ? 700 : 400,
          'text-anchor': 'middle', 'font-family': 'Consolas'
        }, String(k)));
      }
    }

    // X-axis caption
    els.push(s('text', {
      x: (X0 + X1) / 2, y: BASE + 41, fill: C.muted,
      'font-size': 12.5 * F, 'text-anchor': 'middle', 'font-family': 'Segoe UI, sans-serif'
    }, `Ticket number k where urgent #${r} arrives (tap or drag any bar)`));

    // Theoretical mean dashed vertical line
    const m = meanWait();
    if (m >= r && m <= km + 0.5) {
      const xm = X0 + (m - r + 0.5) * step;
      const pillW = 92 * F, pillH = 22 * F;
      const px = Math.max(X0, Math.min(X1 - pillW, xm - pillW / 2));
      els.push(
        s('line', { x1: xm, x2: xm, y1: CHART_TOP - 8, y2: BASE, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }),
        s('rect', { x: px, y: CHART_TOP - 28 * F, width: pillW, height: pillH, rx: pillH / 2, fill: C.bg, stroke: C.amber }),
        s('text', {
          x: px + pillW / 2, y: CHART_TOP - 13 * F, fill: C.amber,
          'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, `MEAN ${fmt(m)}`)
      );
    }

    // Simulated average diamond marker on x-axis
    if (simTotal > 0) {
      const sm = simSum / simTotal;
      if (sm >= r && sm <= km + 0.5) {
        const xs = X0 + (sm - r + 0.5) * step;
        els.push(s('polygon', {
          points: `${xs},${BASE - 7} ${xs + 6},${BASE} ${xs},${BASE + 7} ${xs - 6},${BASE}`,
          fill: C.green, stroke: C.bg, 'stroke-width': 1.5
        }));
      }
    }

    svg.replaceChildren(...els);

    // Update labels & formula box
    rLabel.textContent = `r = ${r}`;
    pLabel.textContent = `p = ${p.toFixed(2)}`;
    const ways = comb(kSel - 1, r - 1);
    const pk = nbProb(kSel);
    const pct = (pk * 100).toFixed(pk * 100 >= 10 ? 1 : 2);
    const lines = [
      [`r = ${r} urgent,  p = ${p.toFixed(2)}`, C.ink],
      [`k = ${kSel}:  C(${kSel - 1}, ${r - 1}) = ${ways} ways`, C.cyan],
      [`P(W=${kSel}) = ${ways} × ${p.toFixed(2)}^${r} × ${(1 - p).toFixed(2)}^${kSel - r}`, C.muted],
      [`        = ${pct}%`, C.amber],
      [`mean wait = ${r} ÷ ${p.toFixed(2)} = ${fmt(m)}`, C.amber]
    ];
    if (simTotal > 0) {
      const simAvg = simSum / simTotal;
      const simAtK = ((simCounts[kSel] || 0) / simTotal * 100).toFixed(1);
      lines.push([`sim (${simTotal} runs): avg ${simAvg.toFixed(2)}, at ${kSel}: ${simAtK}%`, C.green]);
    }
    fbox(box, lines);

    note.textContent = `Every valid row for ticket ${kSel} ends on an urgent ticket, with ${r - 1} urgent and ${kSel - r} calm among the first ${kSel - 1} tickets.`;
    chal.update({ r, p, kSel, mean: m, simTotal });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}
