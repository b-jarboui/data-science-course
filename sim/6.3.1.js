// 6.3.1 Try it: build a prior and test the zero trap.
// The learner drags belief bars (or taps one and uses −5 / −1 / +1 / +5), watches the prior mean
// (balance point) update live, generates random priors, tests what happens when 10 parts all fail,
// and completes 4 self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const RATES = [10, 20, 30, 40, 50];
  const SHOP = [10, 30, 30, 20, 10];
  const LIK_ALL_FAIL = RATES.map(r => Math.pow(r / 100, 10));

  let pts = SHOP.slice(), sel = 2, view = 0, anim = 0, testedAllFail = false, randomCount = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: build a prior'),
    h('p', { class: 'sub' }, 'Spread belief across the five candidate failure rates. Drag any bar up or down, or tap one and use the buttons.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−5', () => bump(-5)), btn('−1', () => bump(-1)),
          btn('+1', () => bump(1)), btn('+5', () => bump(5)), selLabel),
        h('div', { class: 'sim-row' },
          btn('Test: 10 parts all fail', () => go(1), 'go'),
          btn('Back to prior', () => go(0)),
          btn('New data (random prior)', makeRandom),
          btn('Equal shares (20 each)', () => { pts = [20, 20, 20, 20, 20]; changed(); }),
          btn('Scale total to 100', normalize),
          btn('Shop prior', () => { pts = SHOP.slice(); sel = 2; changed(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const total = () => pts.reduce((a, b) => a + b, 0);
  const shares = () => { const t = total(); return pts.map(x => x / t); };
  const priorMean = () => shares().reduce((acc, w, i) => acc + RATES[i] * w, 0);
  const afterShares = () => {
    const sh = shares();
    const raw = sh.map((w, i) => w * LIK_ALL_FAIL[i]);
    const t = raw.reduce((a, b) => a + b, 0);
    return t > 0 ? raw.map(x => x / t) : sh;
  };
  const afterMean = () => afterShares().reduce((acc, w, i) => acc + RATES[i] * w, 0);
  const r1 = x => Math.round(x * 10) / 10;

  const chal = challenges(ch, [
    { text: 'Shift belief toward higher rates so the prior mean reaches at least 35%.',
      check: st => st.mean >= 35 && st.view < 0.05,
      why: 'Yes! Putting more belief on 40% and 50% pulls the balance point to the right.' },
    { text: 'Give all five candidate rates equal shares of belief. Where does the balance point land?',
      check: st => st.pts.every(x => x === st.pts[0]) && st.pts[0] > 0 && st.view < 0.05,
      why: 'Right in the middle at 30% — every candidate pulls equally.' },
    { text: 'Set 50% to 0 points, then press “Test: 10 parts all fail”. Can 50% come back?',
      check: st => st.pts[4] === 0 && st.testedAllFail,
      why: 'Never! Because 0 times anything is 0, a zero in the prior locks 50% out forever.' },
    { text: 'Now give 50% a small share (1 to 5 points), then press “Test: 10 parts all fail” again.',
      check: st => st.pts[4] >= 1 && st.pts[4] <= 5 && st.testedAllFail,
      why: 'It grew strongly! Even a tiny non-zero share keeps the door open if the data surprise you.' },
  ]);

  // Geometry: responsive phone/laptop viewBox
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = NARROW ? 44 : 58, X1 = VW - 16, BASE = 366, TOP = 46;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);
  const slot = () => (X1 - X0) / RATES.length;
  const cxOf = i => X0 + slot() * (i + 0.5);
  const rateToX = r => cxOf(0) + ((r - 10) / 10) * slot();

  function changed() {
    cancelAnimationFrame(anim);
    view = 0;
    testedAllFail = false;
    draw();
  }

  function setPoint(i, val) {
    const next = Math.max(0, Math.min(100, val));
    const others = total() - pts[i];
    if (others === 0 && next === 0) return; // keep at least 1 point in the prior
    pts[i] = next;
    changed();
  }

  function bump(d) { setPoint(sel, pts[sel] + d); }

  function normalize() {
    const sh = shares();
    const scaled = sh.map(w => Math.round(w * 100));
    const diff = 100 - scaled.reduce((a, b) => a + b, 0);
    const maxI = scaled.indexOf(Math.max(...scaled));
    scaled[maxI] = Math.max(1, scaled[maxI] + diff);
    pts = scaled;
    changed();
  }

  function makeRandom() {
    const w = RATES.map(() => rnd(3, 35));
    const sum = w.reduce((a, b) => a + b, 0);
    const out = w.map(x => Math.max(2, Math.round(x / sum * 100)));
    const diff = 100 - out.reduce((a, b) => a + b, 0);
    const idx = out.indexOf(Math.max(...out));
    out[idx] = Math.max(2, out[idx] + diff);
    pts = out;
    randomCount++;
    changed();
  }

  function go(target) {
    if (target === 1) testedAllFail = true;
    cancelAnimationFrame(anim);
    const from = view, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 850);
      view = from + (target - from) * k * k * (3 - 2 * k);
      draw();
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // Drag any bar up or down
  let dragging = -1, dragMaxPct = 50;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), i = Math.floor((p.x - X0) / slot());
    if (i < 0 || i >= RATES.length) return;
    sel = i; dragging = i;
    dragMaxPct = Math.max(50, Math.ceil(Math.max(...shares().map(x => x * 100)) / 10) * 10);
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const pct = Math.max(0, Math.min(dragMaxPct, (BASE - p.y) / (BASE - TOP) * dragMaxPct));
    const targetPts = Math.round(pct);
    setPoint(dragging, targetPts);
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const sh = shares(), ash = afterShares();
    const pPct = sh.map(x => x * 100), aPct = ash.map(x => x * 100);
    const shown = pPct.map((v, i) => v + (aPct[i] - v) * view);
    const pMean = priorMean(), aMean = afterMean();
    const shownMean = pMean + (aMean - pMean) * view;
    const sum = total();

    const mx = Math.max(50, Math.ceil(Math.max(...shown) / 10) * 10);
    const stepG = mx > 60 ? 20 : 10;
    const u = (BASE - TOP) / mx;
    const sl = slot(), bw = Math.min(78, sl * 0.62);

    const k = [];
    for (let g = 0; g <= mx; g += stepG) {
      const y = BASE - g * u;
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `${g}%`)
      );
    }

    RATES.forEach((rate, i) => {
      const cx = cxOf(i), val = shown[i], isZero = pts[i] === 0;
      const col = isZero ? C.pink : (view > 0.5 ? C.green : C.cyan);
      if (i === sel && view < 0.05) {
        k.push(s('rect', { x: cx - sl / 2 + 4, y: TOP - 8, width: sl - 8, height: BASE - TOP + 8, fill: '#ffffff', 'fill-opacity': 0.04, rx: 8 }));
      }
      const bh = isZero ? 3 : Math.max(2, val * u);
      k.push(s('rect', { x: cx - bw / 2, y: BASE - bh, width: bw, height: bh, fill: col, 'fill-opacity': isZero ? 0.95 : 0.82, stroke: col, 'stroke-width': 1.5, rx: 4 }));
      k.push(s('text', { x: cx, y: BASE - bh - 10, fill: col, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${fmt(r1(val))}%`));
      if (isZero && view > 0.5) {
        const lw = 86 * F;
        k.push(
          s('rect', { x: cx - lw / 2, y: BASE - 58 * F, width: lw, height: 22 * F, rx: 11 * F, fill: C.bg, stroke: C.pink }),
          s('text', { x: cx, y: BASE - 43 * F, fill: C.pink, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'LOCKED AT 0')
        );
      }
      k.push(s('text', { x: cx, y: BASE + 38, fill: C.ink, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${rate}%`));
    });

    k.push(s('text', { x: (X0 + X1) / 2, y: BASE + 62, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial, sans-serif' }, 'Candidate failure rate'));

    // Balance point (mean): dashed vertical line, fulcrum triangle, and top pill
    const xm = rateToX(shownMean);
    const pillW = 114 * F, pillH = 24 * F;
    const px = Math.max(X0 + 2, Math.min(X1 - pillW - 2, xm - pillW / 2));
    k.push(
      s('line', { x1: xm, x2: xm, y1: TOP + 16, y2: BASE, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '8 6' }),
      s('polygon', { points: `${xm},${BASE + 2} ${xm - 9},${BASE + 16} ${xm + 9},${BASE + 16}`, fill: C.amber }),
      s('rect', { x: px, y: TOP - 14, width: pillW, height: pillH, rx: pillH / 2, fill: C.bg, stroke: C.amber }),
      s('text', { x: px + pillW / 2, y: TOP - 14 + pillH * 0.68, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `MEAN ${fmt(r1(shownMean))}%`)
    );

    svg.replaceChildren(...k);

    if (view >= 0.5) {
      fbox(box, [
        ['TEST: 10 PARTS INSPECTED · ALL 10 FAIL', C.pink],
        `prior : ${pPct.map(v => `${fmt(r1(v))}%`).join('  ')}`,
        [`after : ${aPct.map(v => `${fmt(r1(v))}%`).join('  ')}`, C.green],
        pts[4] === 0
          ? ['50% started at 0 → stays 0% (locked!)', C.pink]
          : [`50% grew: ${fmt(r1(pPct[4]))}% → ${fmt(r1(aPct[4]))}%`, C.green],
        [`mean  : ${fmt(r1(pMean))}% → ${fmt(r1(aMean))}%`, C.amber],
      ]);
      note.textContent = pts[4] === 0
        ? 'Every part failed, yet 50% stayed at 0%. A zero in the prior multiplies by zero forever.'
        : 'Every non-zero bar scaled with the new batch. Higher rates grew; lower rates shrank.';
    } else {
      const terms = RATES.map((r, i) => `${r}%×${sh[i].toFixed(2)}`);
      fbox(box, [
        `points: ${pts.join(', ')}  (total ${sum})`,
        `shares: ${sh.map(x => x.toFixed(2)).join(' + ')} = 1`,
        `mean  = ${terms.slice(0, 3).join(' + ')}`,
        `      + ${terms.slice(3).join(' + ')}`,
        [`      = ${fmt(r1(pMean))}%`, C.amber],
      ]);
      note.textContent = pts.includes(0)
        ? 'Careful: at least one candidate has 0 points. Try “Test: 10 parts all fail” to see the zero trap.'
        : 'The amber triangle is the prior mean — the balance point of the bars before any new data arrive.';
    }

    selLabel.textContent = `Selected: ${RATES[sel]}% (${pts[sel]} pts = ${fmt(r1(pPct[sel]))}%)`;
    chal.update({ mean: r1(pMean), pts: pts.slice(), sum, view, testedAllFail, randomCount });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}
