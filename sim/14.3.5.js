// 14.3.5 Try it: factor analysis learned by expectation maximization (EM).
// Drag any tea on the Floral–Jasmine map (or press New data). Step or Play: each round first estimates
// every tea's hidden trait (violet dot on the shared line), then updates the shared and noise variances.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, challenges } = kit;
  const NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const FL0 = [1, 3, 1, 3, 7, 9, 7, 9], JA0 = [3, 1, 3, 1, 9, 7, 9, 7];
  let F = FL0.slice(), J = JA0.slice();
  let s0 = 4, p0 = 4, sh = s0, ns = p0, round = 0, history = [], last = null, settled = false;
  let speed = 3, timer = null;

  const f2 = x => x.toFixed(2);
  const sg = x => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(2);
  const edited = () => F.join() !== FL0.join() || J.join() !== JA0.join();

  // data summary: means, variances and covariance (divided by the number of teas)
  function stats() {
    const n = F.length, mf = F.reduce((a, b) => a + b, 0) / n, mj = J.reduce((a, b) => a + b, 0) / n;
    const cf = F.map(v => v - mf), cj = J.map(v => v - mj);
    const vf = cf.reduce((a, x) => a + x * x, 0) / n, vj = cj.reduce((a, x) => a + x * x, 0) / n;
    const cov = cf.reduce((a, x, i) => a + x * cj[i], 0) / n, avg = (vf + vj) / 2;
    const sT = Math.max(0, cov), pT = Math.max(0.01, avg - sT);   // where EM settles for this model
    return { n, mf, mj, cf, cj, vf, vj, cov, avg, sT, pT };
  }
  // loss = negative log-likelihood per tea without its constant (2.94 at the lesson start)
  function lossOf(a, b, st) {
    const det = b * (b + 2 * a);
    return 0.5 * (Math.log(det) + ((a + b) * (st.vf + st.vj) - 2 * a * st.cov) / det);
  }
  // E step: each tea's hidden-trait estimate and the shared uncertainty
  function estep(a, b, st) {
    const v = a * b / (b + 2 * a);
    return { v, m: st.cf.map((x, i) => v * (x + st.cj[i]) / b) };
  }

  // DOM layout
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 326, F1 = NARROW ? 1.2 : 1;
  const svgMap = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const svgLoss = s('svg', { viewBox: `0 0 ${VW} 175`, style: 'margin-top:.55rem' });
  const statusRow = h('div', { class: 'sim-row', style: { marginTop: 0, marginBottom: '.65rem' } });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const playBtn = btn('Play', () => (timer ? stopPlay() : startPlay()));
  const slider = (min, max, step, val, color, oninput) =>
    h('input', { type: 'range', min, max, step, value: String(val), style: { flex: '1 1 110px', accentColor: color }, oninput });
  const valTag = color => h('span', { style: { fontFamily: 'Consolas, monospace', color, fontWeight: 700 } });
  const lab = (t, color = '#b2bdd9') => h('span', { style: { color, fontSize: '.9rem' } }, t);
  const spVal = valTag(C.cyan), s0Val = valTag(C.violet), p0Val = valTag(C.pink);
  const spSlider = slider(1, 10, 1, speed, C.cyan, e => { speed = +e.target.value; if (timer) { stopPlay(); startPlay(); } draw(); });
  const s0Slider = slider(0, 10, 0.5, s0, C.violet, e => { s0 = +e.target.value; restart(); });
  const p0Slider = slider(0.5, 10, 0.5, p0, C.pink, e => { p0 = +e.target.value; restart(); });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: find the hidden trait'),
    h('p', { class: 'sub' }, 'Each cyan dot is a tea: floral across, jasmine up. Drag a tea to change its scores. Press Step or Play: every round estimates each tea’s hidden trait (violet dot), then updates the shared and noise variances.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svgMap, svgLoss,
        h('div', { class: 'sim-row' },
          btn('Step', () => { stopPlay(); doStep(); }, 'go'), playBtn,
          btn('Reset', () => restart()), btn('New data', () => newData()), btn('Lesson teas', () => lessonTeas())),
        h('div', { class: 'sim-row' }, lab('Speed:'), spSlider, spVal),
        h('div', { class: 'sim-row' }, lab('Start shared:', C.violet), s0Slider, s0Val),
        h('div', { class: 'sim-row' }, lab('Start noise:', C.pink), p0Slider, p0Val)),
      h('div', {}, h('div', { class: 'sim-card' }, statusRow, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'With the lesson teas and a start of 4 and 4, press Step three times.',
      check: st => st.lesson && st.s0 === 4 && st.p0 === 4 && st.round === 3,
      why: 'Just like the lesson: shared 7.25, noise 2.42, and the loss fell from 2.94 to 2.80.' },
    { text: 'Predict where the shared variance will settle, then press Play until it is within 0.05 of that value.',
      check: st => st.round >= 2 && st.sT > 0.5 && Math.abs(st.sh - st.sT) < 0.05,
      why: 'It settles at the covariance: the shared trait must explain exactly how the two scores change together.' },
    { text: 'Set “Start shared” to 0 and press Play. Does learning ever get going?',
      check: st => st.s0 === 0 && st.round >= 2 && st.sh === 0,
      why: 'No. With zero shared variance every trait estimate is 0 with no uncertainty, so EM has nothing to grow from. A bad start can freeze it.' },
    { text: 'Drag the teas (or press New data) so the shared part ends below 20%, then run at least 3 rounds.',
      check: st => st.edited && st.round >= 3 && st.share < 20,
      why: 'When the two scores do not change together, the covariance is small, so most variation is attribute-specific noise.' },
  ]);

  function stopPlay() { if (timer) { clearInterval(timer); timer = null; } playBtn.textContent = 'Play'; }
  function startPlay() {
    if (timer) return;
    if (settled || round >= 60) restart();
    playBtn.textContent = 'Pause';
    timer = setInterval(() => { doStep(); if (settled || round >= 60) stopPlay(); }, Math.round(1000 / speed));
  }
  function restart() {
    stopPlay();
    sh = s0; ns = p0; round = 0; last = null; settled = false;
    history = [{ round: 0, loss: lossOf(sh, ns, stats()) }];
    draw();
  }
  function newData() {
    const mix = [0, 0.5, 1][rnd(0, 2)], clamp = v => Math.max(0, Math.min(10, v));
    for (let i = 0; i < 8; i++) {
      const t = Math.round(rnd(-4, 4) * mix);
      F[i] = clamp(5 + t + rnd(-2, 2)); J[i] = clamp(5 + t + rnd(-2, 2));
    }
    restart();
  }
  function lessonTeas() {
    F = FL0.slice(); J = JA0.slice(); s0 = 4; p0 = 4;
    s0Slider.value = '4'; p0Slider.value = '4';
    restart();
  }
  function doStep() {
    const st = stats(), { v, m } = estep(sh, ns, st);
    const oldS = sh, oldN = ns, oldL = lossOf(sh, ns, st);
    sh = m.reduce((a, x) => a + x * x, 0) / st.n + v;
    ns = Math.max(0.01, m.reduce((a, x, i) => a + ((st.cf[i] - x) ** 2 + (st.cj[i] - x) ** 2) / 2, 0) / st.n + v);
    round++;
    const L1 = lossOf(sh, ns, st);
    history.push({ round, loss: L1 });
    settled = Math.abs(sh - oldS) < 5e-4 && Math.abs(ns - oldN) < 5e-4;
    last = { mA: m[0], v, oldS, oldN, oldL, L1 };
    draw();
  }

  // map geometry & dragging a tea
  const PX0 = NARROW ? 36 : 50, PB = 286, PS = NARROW ? 22 : 25;
  const sx = v => PX0 + v * PS, sy = v => PB - v * PS;
  const BX = NARROW ? [304, 364] : [450, 590], BW = NARROW ? 44 : 84, BB = 286, BT = 50;
  let drag = -1;
  const toSvg = e => {
    const ctm = svgMap.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = svgMap.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(ctm.inverse());
  };
  svgMap.addEventListener('pointerdown', e => {
    const p = toSvg(e); let best = -1, bd = 22 * 22;
    F.forEach((f, i) => { const d = (sx(f) - p.x) ** 2 + (sy(J[i]) - p.y) ** 2; if (d < bd) { bd = d; best = i; } });
    if (best < 0) return;
    stopPlay(); drag = best; svgMap.setPointerCapture(e.pointerId);
  });
  svgMap.addEventListener('pointermove', e => {
    if (drag < 0) return;
    const p = toSvg(e), clamp = v => Math.max(0, Math.min(10, Math.round(v)));
    const nf = clamp((p.x - PX0) / PS), nj = clamp((PB - p.y) / PS);
    if (nf !== F[drag] || nj !== J[drag]) { F[drag] = nf; J[drag] = nj; restart(); }
  });
  const endDrag = () => { drag = -1; };
  svgMap.addEventListener('pointerup', endDrag);
  svgMap.addEventListener('pointercancel', endDrag);

  function drawMap(st) {
    const { m } = estep(sh, ns, st), k = [];
    for (const g of [0, 5, 10]) {
      k.push(s('line', { x1: sx(0), x2: sx(10), y1: sy(g), y2: sy(g), stroke: C.line }),
        s('line', { x1: sx(g), x2: sx(g), y1: sy(0), y2: sy(10), stroke: C.line }),
        s('text', { x: sx(g), y: PB + 17, fill: C.muted, 'font-size': 12 * F1, 'text-anchor': 'middle', 'font-family': 'Consolas' }, g),
        s('text', { x: sx(0) - 8, y: sy(g) + 4, fill: C.muted, 'font-size': 12 * F1, 'text-anchor': 'end', 'font-family': 'Consolas' }, g));
    }
    k.push(s('text', { x: sx(10), y: PB + 34, fill: C.cyan, 'font-size': 12.5 * F1, 'text-anchor': 'end', 'font-family': 'Segoe UI, sans-serif' }, 'floral →'),
      s('text', { x: sx(0), y: sy(10) - 10, fill: C.cyan, 'font-size': 12.5 * F1, 'font-family': 'Segoe UI, sans-serif' }, 'jasmine ↑'));

    // shared line through the mean point: moving along it changes both scores together
    const lo = -Math.min(st.mf, st.mj), hi = 10 - Math.max(st.mf, st.mj);
    k.push(s('line', { x1: sx(st.mf + lo), y1: sy(st.mj + lo), x2: sx(st.mf + hi), y2: sy(st.mj + hi),
      stroke: C.violet, 'stroke-width': 2, 'stroke-dasharray': '7 6', 'stroke-opacity': 0.75 }));
    // each tea = trait part (violet dot on the shared line) + own noise (pink line)
    F.forEach((f, i) => {
      const tx = sx(st.mf + m[i]), ty = sy(st.mj + m[i]);
      k.push(s('line', { x1: sx(f), y1: sy(J[i]), x2: tx, y2: ty, stroke: C.pink, 'stroke-width': 2, 'stroke-opacity': 0.8 }),
        s('circle', { cx: tx, cy: ty, r: 4.5, fill: C.violet }));
    });
    const groups = new Map();
    F.forEach((f, i) => { const key = f + ',' + J[i]; groups.set(key, [...(groups.get(key) || []), i]); });
    for (const idx of groups.values()) {
      const i = idx[0], x = sx(F[i]), y = sy(J[i]), left = F[i] >= 8;
      k.push(s('circle', { cx: x, cy: y, r: 13, fill: C.cyan, 'fill-opacity': 0.16 }),
        s('circle', { cx: x, cy: y, r: 6.5, fill: C.cyan, stroke: drag === i ? C.ink : 'none', 'stroke-width': 2 }),
        s('text', { x: left ? x - 12 : x + 12, y: y - 9, fill: C.ink, 'font-size': 12.5 * F1, 'font-weight': 700,
          'text-anchor': left ? 'end' : 'start', 'font-family': 'Consolas' }, idx.map(j => NAMES[j]).join('·')));
    }

    // variance bars with the settling targets (dashed amber)
    const vmax = Math.max(10, st.avg * 1.1, sh * 1.05, ns * 1.05), hu = (BB - BT) / vmax;
    k.push(s('text', { x: (BX[0] + BX[1]) / 2, y: 26, fill: C.ink, 'font-size': 13 * F1, 'font-weight': 700, 'text-anchor': 'middle',
      'font-family': 'Segoe UI, sans-serif' }, 'variances'));
    [[sh, st.sT, C.violet, 'shared'], [ns, st.pT, C.pink, 'noise']].forEach(([v, tg, col, name], q) => {
      const x = BX[q], hgt = v * hu;
      k.push(s('rect', { x: x - BW / 2, y: BB - hgt, width: BW, height: Math.max(0.5, hgt), fill: col, 'fill-opacity': 0.8, stroke: col, rx: 3 }),
        s('line', { x1: x - BW / 2 - 6, x2: x + BW / 2 + 6, y1: BB - tg * hu, y2: BB - tg * hu, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }),
        s('text', { x, y: BB - hgt - 8, fill: col, 'font-size': 14 * F1, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, f2(v)),
        s('text', { x, y: BB + 18, fill: col, 'font-size': 13 * F1, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Segoe UI, sans-serif' }, name));
    });
    k.push(s('line', { x1: BX[0] - BW / 2 - 10, x2: BX[1] + BW / 2 + 10, y1: BB, y2: BB, stroke: C.muted }));
    svgMap.replaceChildren(...k);
  }

  function drawLoss(st) {
    const LX0 = NARROW ? 50 : 58, LX1 = VW - 18, LB = 142, LT = 28;
    const floor = lossOf(st.sT, st.pT, st);
    const maxR = Math.max(10, history[history.length - 1].round);
    const ls = history.map(p => p.loss);
    let lo = Math.min(floor, ...ls), hi = Math.max(...ls);
    if (hi - lo < 0.02) hi = lo + 0.02;
    const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    const px = r => LX0 + r / maxR * (LX1 - LX0), py = l => LB - (l - lo) / (hi - lo) * (LB - LT);
    const k = [];
    k.push(s('text', { x: LX0, y: 15, fill: C.pink, 'font-size': 12 * F1, 'font-weight': 700, 'font-family': 'Consolas' }, 'LOSS VS ROUND'),
      s('line', { x1: LX0, x2: LX1, y1: LB, y2: LB, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: LX0, x2: LX0, y1: LT, y2: LB, stroke: C.muted, 'stroke-width': 1.5 }));
    [lo, (lo + hi) / 2, hi].forEach(v => k.push(
      s('line', { x1: LX0, x2: LX1, y1: py(v), y2: py(v), stroke: C.line, 'stroke-opacity': 0.7 }),
      s('text', { x: LX0 - 6, y: py(v) + 4, fill: C.muted, 'font-size': 10.5 * F1, 'text-anchor': 'end', 'font-family': 'Consolas' }, f2(v))));
    const xStep = maxR <= 10 ? 2 : Math.ceil(maxR / 5);
    for (let r = 0; r <= maxR; r += xStep)
      k.push(s('text', { x: px(r), y: LB + 16, fill: C.muted, 'font-size': 10.5 * F1, 'text-anchor': 'middle', 'font-family': 'Consolas' }, r));
    k.push(s('line', { x1: LX0, x2: LX1, y1: py(floor), y2: py(floor), stroke: C.amber, 'stroke-dasharray': '5 5', 'stroke-opacity': 0.75 }),
      s('text', { x: LX1, y: Math.max(LT + 10, py(floor) - 5), fill: C.amber, 'font-size': 10.5 * F1, 'text-anchor': 'end', 'font-family': 'Consolas' }, `lowest = ${f2(floor)}`));
    if (history.length > 1)
      k.push(s('polyline', { points: history.map(p => `${px(p.round).toFixed(1)},${py(p.loss).toFixed(1)}`).join(' '), fill: 'none', stroke: C.green, 'stroke-width': 2.5 }));
    history.forEach((p, i) => {
      const isLast = i === history.length - 1;
      k.push(s('circle', { cx: px(p.round), cy: py(p.loss), r: isLast ? 5 : 3.5, fill: i === 0 ? C.pink : (isLast ? C.amber : C.green) }));
    });
    svgLoss.replaceChildren(...k);
  }

  function draw() {
    const st = stats(), loss = lossOf(sh, ns, st), share = 100 * sh / (sh + ns);
    spVal.textContent = `${speed}/s`;
    s0Val.textContent = f2(s0);
    p0Val.textContent = f2(p0);
    drawMap(st);
    drawLoss(st);
    statusRow.replaceChildren(pill(`ROUND ${round}`, C.amber), pill(`LOSS ${f2(loss)}`, C.pink), pill(`SHARED ${Math.round(share)}%`, C.violet));

    if (last) {
      fbox(box, [
        `Round ${round}`,
        [`E: tea A trait ≈ ${f2(last.mA)}`, C.violet],
        [`   uncertainty ≈ ${f2(last.v)}`, C.violet],
        [`M: shared ${f2(last.oldS)} → ${f2(sh)} (${sg(sh - last.oldS)})`, C.violet],
        [`   noise  ${f2(last.oldN)} → ${f2(ns)} (${sg(ns - last.oldN)})`, C.pink],
        [`loss ${f2(last.oldL)} → ${f2(last.L1)}`, last.L1 <= last.oldL + 1e-9 ? C.green : C.pink],
      ]);
    } else {
      fbox(box, [
        'Round 0 (start)',
        [`shared = ${f2(sh)}`, C.violet],
        [`noise  = ${f2(ns)}`, C.pink],
        [`loss   = ${f2(loss)}`, C.pink],
        [`covariance = ${f2(st.cov)}`, C.amber],
        [`variances  = ${f2(st.vf)}, ${f2(st.vj)}`, C.muted],
      ]);
    }

    if (s0 === 0 && sh === 0 && round > 0) {
      note.textContent = 'Shared variance started at 0, so every trait estimate is 0 with no uncertainty: EM has nothing to grow from and stays stuck.';
    } else if (settled) {
      note.textContent = `Settled: shared ${f2(sh)} + noise ${f2(ns)}. The hidden trait explains about ${Math.round(share)}% of the variance.`;
    } else {
      note.textContent = `Dashed amber lines show where EM settles for these teas (shared ≈ covariance ${f2(st.sT)}, noise ≈ ${f2(st.pT)}). Pink lines: each tea’s own noise.`;
    }

    chal.update({ lesson: !edited(), edited: edited(), s0, p0, round, sh, ns, sT: st.sT, share });
  }

  restart();
  return () => stopPlay();
}
