// 11.2.9 Try it: Partial autocorrelation.
// Adjust the hotel model weights for 1, 2, and 3 weeks back, inspect how Full vs Partial
// autocorrelation responds, simulate 200 random Saturday nights, and test your intuition.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;

  // Starting model from chapters/11.2.md: rooms = 22 + 0.50*(last-22) + 0.25*(2 wks back-22)
  const START = { w1: 0.50, w2: 0.25, w3: 0.00 };
  let w1 = START.w1, w2 = START.w2, w3 = START.w3;
  let selLag = 2, randomCount = 0, sample = null;

  const f2 = x => (Math.abs(x) < 0.005 ? 0 : x).toFixed(2);
  const fSign = x => (Math.abs(x) < 0.005 ? '0.00' : (x > 0 ? '+' : '−') + Math.abs(x).toFixed(2));

  // Reverse Durbin-Levinson: exact stationarity check + exact ACF/PACF for AR(3)
  function solveAR3(a, b, c) {
    const p3 = c;
    if (Math.abs(p3) >= 0.92) return null;
    const d3 = 1 - p3 * p3;
    const u1 = (a + p3 * b) / d3;
    const u2 = (b + p3 * a) / d3;
    const p2 = u2;
    if (Math.abs(p2) >= 0.92) return null;
    const p1 = u1 / (1 - p2);
    if (Math.abs(p1) >= 0.92) return null;

    const r1 = p1;
    const r2 = u1 * r1 + u2;
    const r3 = a * r2 + b * r1 + c;
    const r4 = a * r3 + b * r2 + c * r1;
    return { acf: [r1, r2, r3, r4], pacf: [p1, p2, p3, 0] };
  }

  // Clamp a single weight toward 0 if a move leaves the stationary region
  function clampStable(next1, next2, next3, which) {
    let vals = [next1, next2, next3];
    for (let tries = 0; tries < 40; tries++) {
      if (solveAR3(vals[0], vals[1], vals[2])) return vals;
      if (Math.abs(vals[which]) < 0.01) { vals[which] = 0; break; }
      vals[which] = Math.round((vals[which] - Math.sign(vals[which]) * 0.05) * 100) / 100;
    }
    return [w1, w2, w3];
  }

  // Box-Muller normal noise & 200-week hotel simulation with sample ACF + Durbin-Levinson PACF
  function randn() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function simulateWeeks(N = 200) {
    const burn = 60, y = new Array(N + burn).fill(0);
    for (let t = 3; t < N + burn; t++) {
      y[t] = w1 * y[t - 1] + w2 * y[t - 2] + w3 * y[t - 3] + 3 * randn();
    }
    const series = y.slice(burn);
    const mean = series.reduce((a, b) => a + b, 0) / N;
    const centered = series.map(v => v - mean);
    const g0 = centered.reduce((a, b) => a + b * b, 0) / N || 1;
    const r = [1];
    for (let k = 1; k <= 4; k++) {
      let sum = 0;
      for (let t = k; t < N; t++) sum += centered[t] * centered[t - k];
      r.push(sum / N / g0);
    }
    // Forward Durbin-Levinson for sample PACF lags 1..4
    const pacf = [];
    let phi = [], v = 1;
    for (let k = 1; k <= 4; k++) {
      let num = r[k];
      for (let j = 0; j < k - 1; j++) num -= phi[j] * r[k - 1 - j];
      const pk = Math.max(-0.99, Math.min(0.99, num / (v || 1e-6)));
      const next = [];
      for (let j = 0; j < k - 1; j++) next.push(phi[j] - pk * phi[k - 2 - j]);
      next.push(pk);
      phi = next;
      v = Math.max(1e-6, v * (1 - pk * pk));
      pacf.push(pk);
    }
    return { acf: r.slice(1), pacf, N };
  }

  // UI elements
  const svg = s('svg', {});
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  function makeSlider(label, min, max, init, color, onChange) {
    const valEl = h('span', { style: { fontFamily: 'Consolas, monospace', fontWeight: 700, color, minWidth: '3.6rem', textAlign: 'right' } }, fSign(init));
    const input = h('input', {
      type: 'range', min, max, step: '0.05', value: String(init),
      style: { flex: '1 1 8rem', accentColor: color, minHeight: '32px', cursor: 'pointer' },
      oninput: e => onChange(parseFloat(e.target.value))
    });
    const row = h('div', { class: 'sim-row', style: { marginTop: '.45rem' } },
      h('span', { style: { minWidth: '8.5rem', fontSize: '.92rem', color: C.ink } }, label),
      input, valEl
    );
    return { row, input, valEl };
  }

  const sl1 = makeSlider('1 week back', -0.60, 0.75, w1, C.cyan, v => setWeights(v, w2, w3, 0));
  const sl2 = makeSlider('2 weeks back', -0.35, 0.40, w2, C.green, v => setWeights(w1, v, w3, 1));
  const sl3 = makeSlider('3 weeks back', -0.25, 0.30, w3, C.violet, v => setWeights(w1, w2, v, 2));

  function setWeights(n1, n2, n3, which, keepSample = false) {
    const [c1, c2, c3] = clampStable(n1, n2, n3, which);
    w1 = c1; w2 = c2; w3 = c3;
    if (!keepSample) sample = null;
    syncSliders();
    draw();
  }

  function syncSliders() {
    sl1.input.value = String(w1); sl1.valEl.textContent = fSign(w1);
    sl2.input.value = String(w2); sl2.valEl.textContent = fSign(w2);
    sl3.input.value = String(w3); sl3.valEl.textContent = fSign(w3);
  }

  function newRandomHotel() {
    for (let tries = 0; tries < 60; tries++) {
      const r1 = rnd(-10, 13) * 0.05;
      const r2 = rnd(-6, 7) * 0.05;
      const r3 = Math.random() < 0.5 ? 0 : rnd(-4, 5) * 0.05;
      if (Math.abs(r1) < 0.15) continue;
      if (solveAR3(r1, r2, r3)) {
        w1 = Math.round(r1 * 100) / 100;
        w2 = Math.round(r2 * 100) / 100;
        w3 = Math.round(r3 * 100) / 100;
        sample = null;
        randomCount++;
        syncSliders();
        draw();
        return;
      }
    }
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: partial autocorrelation'),
    h('p', { class: 'sub' }, 'Change how strongly each past Saturday feeds into this week. Watch how Full autocorrelation mixes direct and indirect links, while Partial autocorrelation isolates the direct link at each lag.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        sl1.row, sl2.row, sl3.row,
        h('div', { class: 'sim-row' },
          btn('New hotel (random)', newRandomHotel, 'go'),
          btn('Simulate 200 weeks', () => { sample = simulateWeeks(200); draw(); }),
          btn('Only 1 week back', () => { w1 = 0.65; w2 = 0; w3 = 0; sample = null; syncSliders(); draw(); }),
          btn('Hotel example (reset)', () => { w1 = START.w1; w2 = START.w2; w3 = START.w3; sample = null; selLag = 2; syncSliders(); draw(); })
        )),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Set 2 weeks back to 0 (with 1 week back at least 0.40 and 3 weeks back at 0). Watch Full lag 2 stay positive while Partial lag 2 drops to 0.',
      check: st => st.w1 >= 0.39 && Math.abs(st.w2) < 0.01 && Math.abs(st.w3) < 0.01,
      why: 'Yes! When only last week matters, two weeks back still has a positive full link through the middle week, so Partial lag 2 is 0.'
    },
    {
      text: 'Keep Full lag 2 positive while making Partial lag 2 negative (try a positive 1-week weight and a negative 2-week weight).',
      check: st => st.acf[1] > 0.02 && st.pacf[1] < -0.05,
      why: 'Nice find! The full link looks positive because of last week, yet allowing for last week uncovers a negative direct link.'
    },
    {
      text: 'Set 3 weeks back to at least +0.20. Watch which bar jumps up in Partial autocorrelation.',
      check: st => st.w3 >= 0.19,
      why: 'Right: now 3 weeks back adds real extra information, so Partial lag 3 rises to match the weight — while Partial lag 4 stays 0.'
    },
    {
      text: 'Press “New hotel (random)” twice and check the formula box. Does (lag 2 − lag 1²) ÷ (1 − lag 1²) always equal Partial lag 2?',
      check: st => st.randomCount >= 2,
      why: 'Always! Subtracting the through-middle product and dividing by the share left gives Partial lag 2 for every model.'
    }
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 560 : 445, F = NARROW ? 1.05 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  // Click/tap a lag column on either bar chart to inspect it
  let hitZones = [];
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    for (const z of hitZones) {
      if (p.x >= z.x0 && p.x <= z.x1 && p.y >= z.y0 && p.y <= z.y1) {
        selLag = z.lag;
        draw();
        return;
      }
    }
  });

  function drawPanel(k, { title, titleCol, x0, x1, yTop, yBot, vals, sampleVals, isPartial }) {
    const yZero = (yTop + yBot) / 2;
    const halfH = (yBot - yTop) / 2 - 14;
    const span = x1 - x0, sl = span / 4, bw = Math.min(46, sl * 0.56);

    k.push(s('text', { x: (x0 + x1) / 2, y: yTop - 12, fill: titleCol, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, title));

    for (const g of [-1, -0.5, 0, 0.5, 1]) {
      const y = yZero - g * halfH;
      k.push(s('line', { x1: x0, x2: x1, y1: y, y2: y, stroke: g === 0 ? C.muted : C.line, 'stroke-width': g === 0 ? 1.8 : 1 }));
      if (g === 1 || g === 0 || g === -1) {
        k.push(s('text', { x: x0 - 6, y: y + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g > 0 ? '+1' : String(g)));
      }
    }

    vals.forEach((v, idx) => {
      const lag = idx + 1;
      const cx = x0 + sl * (idx + 0.5);
      hitZones.push({ x0: cx - sl / 2, x1: cx + sl / 2, y0: yTop - 10, y1: yBot + 16, lag });

      if (lag === selLag) {
        k.push(s('rect', { x: cx - sl / 2 + 2, y: yTop - 4, width: sl - 4, height: yBot - yTop + 20, rx: 8, fill: '#ffffff', 'fill-opacity': 0.05 }));
      }

      const hgt = Math.abs(v) * halfH;
      const col = Math.abs(v) < 0.005 ? C.muted : (v < 0 ? C.pink : (isPartial ? (lag === 2 ? C.green : (lag === 3 ? C.violet : C.cyan)) : (lag === 2 ? C.amber : C.cyan)));
      if (hgt >= 1.5) {
        k.push(s('rect', {
          x: cx - bw / 2, y: v >= 0 ? yZero - hgt : yZero,
          width: bw, height: hgt, rx: 3, fill: col, 'fill-opacity': 0.85, stroke: col, 'stroke-width': 1
        }));
      } else {
        k.push(s('circle', { cx, cy: yZero, r: 4.5, fill: C.green }));
      }

      // Value label
      const ly = v >= 0 ? Math.min(yZero - 8, yZero - hgt - 6) : Math.max(yZero + 16, yZero + hgt + 14);
      k.push(s('text', { x: cx, y: ly, fill: Math.abs(v) < 0.005 ? C.green : col, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, f2(v)));

      // Optional simulated 200-week sample diamond
      if (sampleVals) {
        const sv = sampleVals[idx];
        const sy = yZero - Math.max(-1, Math.min(1, sv)) * halfH;
        const d = 5.5;
        k.push(s('polygon', {
          points: `${cx},${sy - d} ${cx + d},${sy} ${cx},${sy + d} ${cx - d},${sy}`,
          fill: C.ink, stroke: C.bg, 'stroke-width': 1.5
        }));
      }

      // Lag label
      k.push(s('text', {
        x: cx, y: yBot + 14, fill: lag === selLag ? C.amber : C.muted,
        'font-size': 12 * F, 'font-weight': lag === selLag ? 700 : 400,
        'text-anchor': 'middle', 'font-family': 'Consolas'
      }, 'L' + lag));
    });
  }

  function draw() {
    const res = solveAR3(w1, w2, w3);
    if (!res) return;
    const { acf, pacf } = res;
    const r1 = acf[0], r2 = acf[1], prod = r1 * r1, leftOver = r2 - prod, share = 1 - prod, pac2 = leftOver / share;

    hitZones = [];
    const k = [];

    // --- Top section: 3 room-count cards with live lag-1, full lag-2, and partial lag-2 links ---
    const cY = 74, cW = NARROW ? 104 : 146, cH = 54, cSp = NARROW ? 130 : 210;
    const midX = VW / 2, xs = [midX - cSp, midX, midX + cSp];

    // Top arch (full lag 2)
    const archY = cY - cH / 2;
    const archCol = r2 < -0.005 ? C.pink : C.amber;
    k.push(s('path', {
      d: `M ${xs[0]} ${archY} Q ${midX} ${archY - 46} ${xs[2]} ${archY}`,
      fill: 'none', stroke: archCol, 'stroke-width': 2.5, 'stroke-dasharray': '7 5'
    }));
    k.push(s('rect', { x: midX - 66, y: 8, width: 132, height: 22, rx: 11, fill: C.bg, stroke: archCol }));
    k.push(s('text', { x: midX, y: 23, fill: archCol, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `full lag 2 = ${f2(r2)}`));

    // Neighbor lines (lag 1)
    const nbCol = r1 < -0.005 ? C.pink : C.cyan;
    for (const [a, b] of [[0, 1], [1, 2]]) {
      const lx1 = xs[a] + cW / 2, lx2 = xs[b] - cW / 2;
      k.push(s('line', { x1: lx1, x2: lx2, y1: cY, y2: cY, stroke: nbCol, 'stroke-width': 3 }));
      k.push(s('text', { x: (lx1 + lx2) / 2, y: cY - 8, fill: nbCol, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, f2(r1)));
    }

    // Bottom direct arc (partial lag 2)
    const botY = cY + cH / 2;
    const p2Col = Math.abs(pac2) < 0.005 ? C.muted : (pac2 < 0 ? C.pink : C.green);
    k.push(s('path', {
      d: `M ${xs[0]} ${botY} Q ${midX} ${botY + 46} ${xs[2]} ${botY}`,
      fill: 'none', stroke: p2Col, 'stroke-width': Math.abs(pac2) < 0.005 ? 1.5 : 3
    }));
    k.push(s('rect', { x: midX - 76, y: botY + 18, width: 152, height: 22, rx: 11, fill: C.bg, stroke: p2Col }));
    k.push(s('text', { x: midX, y: botY + 33, fill: p2Col, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `partial lag 2 = ${f2(pac2)}`));

    // Three cards
    const cardLabels = ['2 weeks back', 'last week', 'this week'];
    const cardCols = [C.cyan, C.violet, C.cyan];
    xs.forEach((cx, i) => {
      k.push(s('rect', { x: cx - cW / 2, y: cY - cH / 2, width: cW, height: cH, rx: 10, fill: C.card, stroke: cardCols[i], 'stroke-width': 2 }));
      k.push(s('text', { x: cx, y: cY + 5, fill: C.ink, 'font-size': (NARROW ? 12 : 14), 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial, sans-serif' }, cardLabels[i]));
    });

    // --- Bottom section: Full ACF vs Partial PACF panels ---
    if (NARROW) {
      drawPanel(k, { title: 'FULL AUTOCORRELATION (tap a lag)', titleCol: C.amber, x0: 38, x1: VW - 14, yTop: 185, yBot: 342, vals: acf, sampleVals: sample?.acf, isPartial: false });
      drawPanel(k, { title: 'PARTIAL AUTOCORRELATION (tap a lag)', titleCol: C.green, x0: 38, x1: VW - 14, yTop: 392, yBot: 540, vals: pacf, sampleVals: sample?.pacf, isPartial: true });
    } else {
      drawPanel(k, { title: 'FULL AUTOCORRELATION', titleCol: C.amber, x0: 42, x1: 332, yTop: 196, yBot: 416, vals: acf, sampleVals: sample?.acf, isPartial: false });
      drawPanel(k, { title: 'PARTIAL AUTOCORRELATION', titleCol: C.green, x0: 396, x1: 686, yTop: 196, yBot: 416, vals: pacf, sampleVals: sample?.pacf, isPartial: true });
    }

    if (sample) {
      const lx = NARROW ? VW - 14 : 684, ly = NARROW ? 162 : 162;
      k.push(s('text', { x: lx, y: ly, fill: C.ink, 'font-size': 11.5 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, `◆ ${sample.N}-week simulated sample`));
    }

    svg.replaceChildren(...k);

    // Formula box: live lag-2 partial calculation
    const lines = [
      `lag 1 link (r₁) = ${f2(r1)}`,
      `lag 2 link (r₂) = ${f2(r2)}`,
      [`through middle  = ${f2(r1)} × ${f2(r1)} = ${f2(prod)}`, C.violet],
      [`leftover        = ${f2(r2)} − ${f2(prod)} = ${f2(leftOver)}`, C.amber],
      [`share left      = 1 − ${f2(prod)} = ${f2(share)}`, C.cyan],
      [`partial (lag 2) = ${f2(leftOver)} ÷ ${f2(share)} = ${f2(pac2)}`, p2Col === C.muted ? C.green : p2Col]
    ];
    if (sample) {
      lines.push([`sample partial (lag ${selLag}) = ${f2(sample.pacf[selLag - 1])}`, C.ink]);
    }
    fbox(box, lines);

    // Clear note explaining the selected lag
    const fv = acf[selLag - 1], pv = pacf[selLag - 1];
    const extra = Math.abs(pv) < 0.005
      ? `After allowing for the weeks in between, lag ${selLag} adds 0 extra link — you do not need it.`
      : `After allowing for the weeks in between, lag ${selLag} still has a direct link of ${f2(pv)}.`;
    note.textContent = `Lag ${selLag}: Full = ${f2(fv)}, Partial = ${f2(pv)}. ${extra}`;

    chal.update({ w1, w2, w3, acf, pacf, randomCount });
  }

  draw();
  return () => {};
}
