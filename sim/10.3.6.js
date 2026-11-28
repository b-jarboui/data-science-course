// 10.3.6 Try it: overdispersion and the negative binomial model.
// The learner drags patient visit dots (or taps and uses -1 / +1), tunes the extra-spread
// setting k, generates random Poisson or wide groups, and solves self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, fmt, challenges } = kit;
  const START = [0, 0, 0, 1, 1, 2, 3, 3, 4, 6];
  const MAX_V = 8;
  let v = START.slice(), sel = 9, kVal = 2.0, usedWide = false;

  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const kReadout = h('span', { class: 'sim-pill', style: { color: C.green, borderColor: C.green } }, 'k = 2');
  const kSlider = h('input', {
    type: 'range', min: '0.5', max: '20', step: '0.1', value: '2',
    style: { flex: '1 1 150px', accentColor: C.green, cursor: 'pointer' },
    oninput: () => { kVal = +kSlider.value; draw(); }
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: overdispersion & negative binomial'),
    h('p', { class: 'sub' }, 'Each dot is one patient’s visits in a year. Drag a dot left or right (or tap it and use −1 / +1), and slide k to match the wider spread.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { style: { fontWeight: 650, color: C.green } }, 'Extra-spread setting'),
          kSlider, kReadout),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1 visit', () => bump(-1)),
          btn('+1 visit', () => bump(1)),
          btn('Next patient', () => { sel = (sel + 1) % v.length; draw(); }),
          selLabel),
        h('div', { class: 'sim-row' },
          btn('New Poisson group', () => { v = Array.from({ length: 10 }, () => randPois(2)); usedWide = false; draw(); }),
          btn('New wide group', () => { v = Array.from({ length: 10 }, () => randNB(2, 1.2)); usedWide = true; draw(); }, 'go'),
          btn('Mix: light + heavy', () => {
            v = [
              ...Array.from({ length: 5 }, () => randPois(0.4)),
              ...Array.from({ length: 5 }, () => Math.min(MAX_V, 2 + randPois(1.8)))
            ];
            usedWide = true;
            draw();
          }),
          btn('Reset to lesson', () => { v = START.slice(); sel = 9; kVal = 2.0; kSlider.value = '2'; usedWide = false; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  function randPois(lam) {
    if (lam <= 0) return 0;
    const L = Math.exp(-lam);
    let p = 1, c = 0;
    do { c++; p *= Math.random(); } while (p > L && c < 30);
    return Math.min(MAX_V, c - 1);
  }
  function randNB(mu, k) {
    const u = Math.random();
    let p = Math.pow(k / (k + mu), k), acc = p, y = 0;
    while (u > acc && y < MAX_V) {
      y++;
      p *= ((y - 1 + k) / y) * (mu / (k + mu));
      acc += p;
    }
    return y;
  }

  function poisProbs(mu) {
    const out = [];
    if (mu <= 0) { for (let c = 0; c <= MAX_V; c++) out.push(c === 0 ? 1 : 0); return out; }
    let p = Math.exp(-mu);
    for (let c = 0; c <= MAX_V; c++) { out.push(p); p *= mu / (c + 1); }
    return out;
  }
  function nbProbs(mu, k) {
    const out = [];
    if (mu <= 0) { for (let c = 0; c <= MAX_V; c++) out.push(c === 0 ? 1 : 0); return out; }
    let p = Math.pow(k / (k + mu), k);
    for (let c = 0; c <= MAX_V; c++) { out.push(p); p *= ((c + k) / (c + 1)) * (mu / (k + mu)); }
    return out;
  }

  const r2 = x => Math.round(x * 100) / 100;
  function stats() {
    const n = v.length;
    const sum = v.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const ss = v.reduce((a, b) => a + (b - mean) * (b - mean), 0);
    const sampleVar = ss / (n - 1);
    const nbVar = mean + (mean * mean) / kVal;
    const zeros = v.filter(x => x === 0).length;
    const pZero = (mean <= 0 ? 1 : Math.exp(-mean)) * n;
    const nbZero = (mean <= 0 ? 1 : Math.pow(kVal / (kVal + mean), kVal)) * n;
    const seRatio = mean > 0 ? Math.sqrt(Math.max(1, sampleVar / mean)) : 1;
    return { n, sum, mean, ss, sampleVar, nbVar, zeros, pZero, nbZero, seRatio, k: kVal, usedWide };
  }

  const chal = challenges(ch, [
    { text: 'Move the k slider so the negative binomial variance grows to 6 or more.',
      check: st => st.mean > 0 && st.nbVar >= 6,
      why: 'Yes! Making k smaller makes mean² ÷ k larger, so the extra spread grows.' },
    { text: 'Move the k slider up to 15 or more. Watch the green bars and the violet Poisson bars.',
      check: st => st.k >= 15,
      why: 'Right: when k is large, mean² ÷ k becomes tiny, so negative binomial turns back into Poisson.' },
    { text: 'Move the patient dots closer together until the data variance is at most 1.2 times the average.',
      check: st => st.mean > 0 && st.sampleVar > 0 && st.sampleVar / st.mean <= 1.2,
      why: 'Nice! When patients cluster tightly around the average, Poisson fits without extra spread.' },
    { text: 'Press “New wide group” (or “Mix: light + heavy”), then tune k until negative binomial variance matches data variance (within 0.3).',
      check: st => st.usedWide && st.sampleVar > st.mean + 0.5 && Math.abs(st.nbVar - st.sampleVar) <= 0.3,
      why: 'Spot on! You tuned k so the negative binomial matches the wider spread of the new group.' },
  ]);

  // Geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.2 : 1;
  const X0 = NARROW ? 34 : 52, X1 = VW - 16;
  const TOP = 36, BASE = 310;
  const COLS = MAX_V + 1;
  const colW = (X1 - X0) / COLS;
  const colX = c => X0 + (c + 0.5) * colW;
  svg.setAttribute('viewBox', `0 0 ${VW} 470`);

  let dotCoords = [];
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  function colFromX(x) {
    return Math.max(0, Math.min(MAX_V, Math.floor((x - X0) / colW)));
  }

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y > BASE + 30) return;
    let best = -1, bestD = 28 * F;
    for (const d of dotCoords) {
      const dist = Math.hypot(p.x - d.cx, p.y - d.cy);
      if (dist < bestD) { bestD = dist; best = d.idx; }
    }
    if (best >= 0) {
      sel = best; dragging = best;
    } else {
      const c = colFromX(p.x);
      const inCol = dotCoords.filter(d => v[d.idx] === c);
      if (inCol.length) {
        sel = inCol[inCol.length - 1].idx;
        dragging = sel;
      } else {
        v[sel] = c;
        dragging = sel;
      }
    }
    svg.setPointerCapture(e.pointerId);
    draw();
  });
  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const c = colFromX(p.x);
    if (v[dragging] !== c) { v[dragging] = c; draw(); }
  });
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function bump(d) {
    v[sel] = Math.max(0, Math.min(MAX_V, v[sel] + d));
    draw();
  }

  function draw() {
    const st = stats();
    const pExp = poisProbs(st.mean).map(p => p * st.n);
    const nExp = nbProbs(st.mean, st.k).map(p => p * st.n);
    const counts = Array(COLS).fill(0);
    v.forEach(c => { counts[c]++; });
    const maxY = Math.max(5, ...counts, ...pExp, ...nExp);
    const yU = (BASE - TOP) / maxY;
    const els = [];

    // Grid lines (expected/observed patient count)
    for (let g = 0; g <= Math.ceil(maxY); g++) {
      const y = BASE - g * yU;
      els.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line, 'stroke-width': g === 0 ? 2 : 1 }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g)
      );
    }

    // Legend top-right
    const lgX = X1 - (NARROW ? 168 : 228);
    els.push(
      s('rect', { x: lgX, y: 10, width: 12, height: 12, rx: 2, fill: C.violet, 'fill-opacity': 0.7 }),
      s('text', { x: lgX + 16, y: 20, fill: C.violet, 'font-size': 12 * F, 'font-family': 'Consolas' }, 'Poisson'),
      s('rect', { x: lgX + (NARROW ? 82 : 95), y: 10, width: 12, height: 12, rx: 2, fill: C.green, 'fill-opacity': 0.78 }),
      s('text', { x: lgX + (NARROW ? 98 : 111), y: 20, fill: C.green, 'font-size': 12 * F, 'font-family': 'Consolas' }, 'Neg. bin.')
    );

    // Expected bars (Poisson violet, NegBin green) + x-axis labels
    const bw = Math.min(22, colW * 0.34);
    for (let c = 0; c <= MAX_V; c++) {
      const cx = colX(c);
      const hp = pExp[c] * yU, hn = nExp[c] * yU;
      els.push(
        s('rect', { x: cx - bw - 1, y: BASE - hp, width: bw, height: Math.max(0, hp), fill: C.violet, 'fill-opacity': 0.42, stroke: C.violet, 'stroke-width': 1.2, rx: 2 }),
        s('rect', { x: cx + 1, y: BASE - hn, width: bw, height: Math.max(0, hn), fill: C.green, 'fill-opacity': 0.48, stroke: C.green, 'stroke-width': 1.2, rx: 2 }),
        s('text', { x: cx, y: BASE + 22, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, c)
      );
    }
    els.push(s('text', { x: (X0 + X1) / 2, y: BASE + 40, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle' }, 'visits in one year (dots = 10 patients, bars = expected)'));

    // Mean vertical dashed line
    const mx = colX(st.mean);
    els.push(
      s('line', { x1: mx, x2: mx, y1: TOP - 4, y2: BASE, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }),
      s('rect', { x: Math.max(X0, Math.min(X1 - 96 * F, mx - 48 * F)), y: TOP - 26, width: 96 * F, height: 22, rx: 11, fill: C.bg, stroke: C.amber }),
      s('text', { x: Math.max(X0 + 48 * F, Math.min(X1 - 48 * F, mx)), y: TOP - 11, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'AVG ' + fmt(r2(st.mean)))
    );

    // Patient dots stacked by count
    dotCoords = [];
    const stackPos = Array(COLS).fill(0);
    const dotR = NARROW ? 10 : 12;
    v.forEach((c, i) => {
      const k = stackPos[c]++;
      const cx = colX(c);
      const cy = BASE - (k + 0.5) * yU;
      dotCoords.push({ idx: i, cx, cy });
      const isSel = i === sel;
      const col = c === 0 || c >= 6 ? C.pink : C.cyan;
      if (isSel) {
        els.push(s('circle', { cx, cy, r: dotR + 6, fill: C.amber, 'fill-opacity': 0.22, stroke: C.amber, 'stroke-width': 2 }));
      }
      els.push(
        s('circle', { cx, cy, r: dotR, fill: col, 'fill-opacity': 0.92, stroke: C.bg, 'stroke-width': 1.8 }),
        s('text', { x: cx, y: cy + 4, fill: C.bg, 'font-size': (NARROW ? 10 : 11), 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas', style: 'pointer-events:none' }, i + 1)
      );
    });

    // Bottom variance meter (Poisson vs NegBin vs Data)
    const mTop = 374, barX = X0 + (NARROW ? 102 : 128), barMaxW = X1 - barX - 46;
    const vMax = Math.max(8, st.sampleVar, st.nbVar, st.mean) * 1.1;
    const rows = [
      ['Poisson var', st.mean, C.violet],
      ['Neg. bin. var', st.nbVar, C.green],
      ['Data var', st.sampleVar, st.sampleVar > st.mean * 1.25 ? C.pink : C.cyan],
    ];
    rows.forEach(([lbl, val, col], r) => {
      const y = mTop + r * 28;
      const w = Math.max(2, (val / vMax) * barMaxW);
      els.push(
        s('text', { x: barX - 10, y: y + 14, fill: col, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, lbl),
        s('rect', { x: barX, y: y + 2, width: barMaxW, height: 15, rx: 4, fill: '#141d38' }),
        s('rect', { x: barX, y: y + 2, width: w, height: 15, rx: 4, fill: col, 'fill-opacity': 0.85 }),
        s('text', { x: barX + w + 7, y: y + 14, fill: col, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, fmt(r2(val)))
      );
    });

    svg.replaceChildren(...els);

    // Readouts and formula box
    kReadout.textContent = `k = ${fmt(r2(st.k))}`;
    selLabel.textContent = `Selected: patient ${sel + 1} (${v[sel]} visits)`;
    const ratio = st.mean > 0 ? st.sampleVar / st.mean : 0;
    const over = st.mean > 0 && ratio > 1.25;

    fbox(box, [
      `average      = ${fmt(r2(st.mean))} visits`,
      [`data var     = ${fmt(r2(st.ss))} ÷ 9 = ${fmt(r2(st.sampleVar))}`, over ? C.pink : C.cyan],
      [`Poisson var  = ${fmt(r2(st.mean))}  (0s: ~${fmt(r2(st.pZero))})`, C.violet],
      [`Neg. bin var = ${fmt(r2(st.mean))} + ${fmt(r2(st.mean * st.mean))} ÷ ${fmt(r2(st.k))} = ${fmt(r2(st.nbVar))}`, C.green],
      [`0-visit dots = ${st.zeros}  (Neg. bin: ~${fmt(r2(st.nbZero))})`, C.amber],
    ]);

    note.textContent = over
      ? `Overdispersion: data variance is ${fmt(r2(ratio))}× the average. Poisson standard errors would be about ${fmt(r2(st.seRatio))}× too small.`
      : 'Data variance is close to (or below) the average, so Poisson spread is already wide enough.';

    chal.update(st);
  }

  draw();
  return () => {};
}
