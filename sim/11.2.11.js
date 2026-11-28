// 11.2.11 Try it: Seasonal ARIMA.
// Drag this year's autumn dots (weeks 1–6) or last Christmas (week 7), adjust the usual gain
// and pull weight, reveal real Christmas, test random hotels, and try the moving-holiday trap.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const START_THIS = [20, 24, 20, 23, 24, 29];
  const START_LAST = [18, 21, 19, 21, 22, 26, 32, 30];
  const START_REAL7 = 35;

  let thisYr = START_THIS.slice();
  let lastYr = START_LAST.slice();
  let real7 = START_REAL7;
  let usual = 2;
  let phi = 0.5;
  let sel = 5; // 0..5 = this year week 1..6, 6 = last Christmas (week 7)
  let revealed = false;
  let shifted = false;
  let isRandom = false;
  let randomCounted = false;
  let randomReveals = 0;

  const svg = s('svg');
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const usualOut = h('span', { style: { color: C.violet, fontFamily: 'Consolas, monospace', fontWeight: 700 } });
  const phiOut = h('span', { style: { color: C.amber, fontFamily: 'Consolas, monospace', fontWeight: 700 } });

  const usualSlider = h('input', {
    type: 'range', min: -4, max: 6, step: 0.5, value: usual,
    oninput: e => { usual = +e.target.value; draw(); }
  });
  const phiSlider = h('input', {
    type: 'range', min: 0, max: 1, step: 0.1, value: phi,
    oninput: e => { phi = +e.target.value; draw(); }
  });

  const revealBtn = btn('Reveal real Christmas', () => {
    revealed = !revealed;
    if (revealed && isRandom && !randomCounted) { randomReveals++; randomCounted = true; }
    draw();
  }, 'go');

  const shiftBtn = btn('Test moving holiday', () => {
    if (!shifted) {
      // Simulate a holiday that moved one week later last year (week 8 instead of week 7)
      lastYr = [18, 21, 19, 21, 22, 26, 24, 32];
      thisYr = START_THIS.slice();
      real7 = START_REAL7;
      shifted = true;
      isRandom = false;
      revealed = false;
    } else {
      resetAll();
      return;
    }
    draw();
  });

  function resetAll() {
    thisYr = START_THIS.slice();
    lastYr = START_LAST.slice();
    real7 = START_REAL7;
    usual = 2; phi = 0.5;
    usualSlider.value = usual;
    phiSlider.value = phi;
    sel = 5; revealed = false; shifted = false; isRandom = false; randomCounted = false;
    draw();
  }

  function newHotel() {
    const base = rnd(14, 21);
    const trueGain = rnd(-1, 4);
    lastYr = [0, 1, 2, 3, 4, 5].map(i => clamp(10, 32, base + i + rnd(-2, 2)));
    lastYr.push(clamp(18, 35, lastYr[5] + rnd(4, 7))); // week 7 Christmas peak
    lastYr.push(clamp(16, 34, lastYr[6] - rnd(1, 3))); // week 8 New Year
    thisYr = [0, 1, 2, 3, 4, 5].map(i => clamp(4, 38, lastYr[i] + trueGain + rnd(-1, 2)));
    real7 = clamp(5, 40, lastYr[6] + trueGain + rnd(-1, 2));
    const avgG = Math.round((thisYr.reduce((a, v, i) => a + (v - lastYr[i]), 0) / 6) * 2) / 2;
    usual = clamp(-4, 6, avgG);
    usualSlider.value = usual;
    revealed = false; shifted = false; isRandom = true; randomCounted = false;
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: Seasonal ARIMA'),
    h('p', { class: 'sub' }, 'Drag this year’s cyan dots (weeks 1–6) or last Christmas’s pink dot (week 7) up and down, or tap a week and use −1 / +1.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1', () => bump(-1)), btn('+1', () => bump(1)), selLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.45rem' } }, 'Usual gain:', usualSlider, usualOut),
          h('label', { style: { display: 'flex', alignItems: 'center', gap: '.45rem' } }, 'Pull to wk 6:', phiSlider, phiOut)),
        h('div', { class: 'sim-row' },
          revealBtn,
          btn('New hotel (random)', newHotel),
          shiftBtn,
          btn('Start again', resetAll))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const clamp = (lo, hi, v) => Math.max(lo, Math.min(hi, v));
  const r2 = x => Math.round(x * 100) / 100;
  const sfmt = x => {
    const v = r2(x);
    return (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v));
  };

  const chal = challenges(ch, [
    {
      text: 'Drag week 6 down below last year (26) so its gain bar points downward.',
      check: st => st.gain6 < 0,
      why: 'Yes! When this year sits below last year, the yearly gain is negative and the bar points downward.'
    },
    {
      text: 'Make the Christmas (week 7) forecast exactly 36 rooms.',
      check: st => Math.abs(st.forecast - 36) < 0.01,
      why: 'Spot on! Raising week 6 raises the predicted gain, and raising last Christmas lifts the starting point directly.'
    },
    {
      text: 'Press “New hotel (random)”, check the forecast, then press “Reveal real Christmas”, twice.',
      check: st => st.randomReveals >= 2,
      why: 'Right: stepping back one season and adding the predicted yearly gain works on new hotels too, not just one example.'
    },
    {
      text: 'Press “Test moving holiday” and reveal real Christmas to see the calendar trap.',
      check: st => st.shifted && st.revealed,
      why: 'When a holiday moves to a different week, matching by date compares Christmas to an ordinary week and misses badly.'
    }
  ]);

  // SVG geometry (adapts for phone vs laptop)
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 500 : 475, F = NARROW ? 1.18 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const X0 = NARROW ? 38 : 54, X1 = VW - 16;
  const TOP = 26, MID = NARROW ? 275 : 265;
  const GTOP = NARROW ? 336 : 322, GBOT = VH - 22;
  const GZERO = (GTOP + GBOT) / 2;
  const colW = (X1 - X0) / 8;
  const wx = i => X0 + (i + 0.5) * colW;
  const ry = r => MID - (r / 40) * (MID - TOP);
  const wkNames = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'Xmas', 'NY'];

  function compute() {
    const gains = thisYr.map((v, i) => v - lastYr[i]);
    const gain6 = gains[5];
    const gap = gain6 - usual;
    const predGain = usual + phi * gap;
    const forecast = lastYr[6] + predGain;
    const err = real7 - forecast;
    const maxAbs = Math.max(5, Math.ceil(Math.max(...gains.map(Math.abs), Math.abs(predGain), Math.abs(usual)) + 1));
    return { gains, gain6, gap, predGain, forecast, err, maxAbs };
  }

  function bump(d) {
    if (sel < 6) thisYr[sel] = clamp(0, 40, thisYr[sel] + d);
    else lastYr[6] = clamp(0, 40, lastYr[6] + d);
    draw();
  }

  // Pointer drag on top chart (weeks 1..6 cyan, week 7 pink) OR gains row (weeks 1..6 bars)
  let dragCol = -1, dragZone = '';
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  function applyDrag(e) {
    if (dragCol < 0) return;
    const p = toSvg(e);
    if (dragZone === 'top') {
      const val = clamp(0, 40, Math.round(((MID - p.y) / (MID - TOP)) * 40));
      if (dragCol < 6) thisYr[dragCol] = val;
      else if (dragCol === 6) lastYr[6] = val;
    } else if (dragZone === 'gain' && dragCol < 6) {
      const { maxAbs } = compute();
      const gu = (GBOT - GTOP) / (2 * maxAbs);
      const g = Math.round((GZERO - p.y) / gu);
      thisYr[dragCol] = clamp(0, 40, lastYr[dragCol] + g);
    }
    draw();
  }

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    const col = Math.floor((p.x - X0) / colW);
    if (col < 0 || col > 6) return;
    const zone = p.y <= MID + 20 ? 'top' : (p.y >= GTOP - 10 && col < 6 ? 'gain' : '');
    if (!zone) return;
    sel = col; dragCol = col; dragZone = zone;
    svg.setPointerCapture(e.pointerId);
    applyDrag(e);
  });
  svg.addEventListener('pointermove', applyDrag);
  svg.addEventListener('pointerup', () => { dragCol = -1; dragZone = ''; });

  function draw() {
    const st = compute();
    const { gains, gain6, gap, predGain, forecast, err, maxAbs } = st;
    const gu = (GBOT - GTOP) / (2 * maxAbs);
    const gy = g => GZERO - g * gu;
    const k = [];

    // Christmas column tint
    k.push(s('rect', { x: wx(6) - colW * 0.44, y: TOP - 6, width: colW * 0.88, height: GBOT - TOP + 8, fill: C.amber, 'fill-opacity': 0.05, rx: 6 }));

    // Selected week highlight
    k.push(s('rect', { x: wx(sel) - colW * 0.44, y: TOP - 6, width: colW * 0.88, height: MID - TOP + 12, fill: '#ffffff', 'fill-opacity': 0.045, rx: 6 }));

    // Top chart gridlines & room labels (0..40)
    for (let r = 0; r <= 40; r += 10) {
      const y = ry(r);
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, r));
    }
    k.push(s('text', { x: X0, y: TOP - 10, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Consolas' }, 'Rooms (0–40)'));

    // Week labels
    wkNames.forEach((name, i) => {
      k.push(s('text', {
        x: wx(i), y: MID + 19, fill: i === 6 ? C.amber : C.muted,
        'font-size': 12 * F, 'font-weight': i === 6 ? 700 : 400,
        'text-anchor': 'middle', 'font-family': 'Consolas'
      }, name));
    });

    // Last year line + pink dots (weeks 1..8)
    const pPts = lastYr.map((v, i) => `${wx(i)},${ry(v)}`).join(' ');
    k.push(s('polyline', { points: pPts, fill: 'none', stroke: C.pink, 'stroke-width': 2, 'stroke-opacity': 0.5 }));
    lastYr.forEach((v, i) => {
      const cx = wx(i), cy = ry(v);
      k.push(s('circle', { cx, cy, r: i === 6 ? 6.5 : 5, fill: C.pink, 'fill-opacity': 0.85, stroke: i === 6 ? C.ink : 'none', 'stroke-width': 1.2 }),
        s('text', { x: cx, y: cy + 17 * F, fill: C.pink, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v));
    });

    // Upright/downward gap indicator on week 7 (from last Christmas to forecast)
    const fClamped = clamp(0, 40, forecast);
    const yL7 = ry(lastYr[6]), yF7 = ry(fClamped);
    k.push(s('rect', {
      x: wx(6) - 8, y: Math.min(yL7, yF7), width: 16, height: Math.max(2, Math.abs(yF7 - yL7)),
      fill: C.amber, 'fill-opacity': 0.45, stroke: C.amber, 'stroke-width': 1.5, rx: 2
    }));

    // This year line + cyan dots (weeks 1..6)
    const cPts = thisYr.map((v, i) => `${wx(i)},${ry(v)}`).join(' ');
    k.push(s('polyline', { points: cPts, fill: 'none', stroke: C.cyan, 'stroke-width': 2.8 }));
    thisYr.forEach((v, i) => {
      const cx = wx(i), cy = ry(v);
      k.push(s('circle', { cx, cy, r: 6.5, fill: C.cyan, stroke: i === sel ? C.ink : 'none', 'stroke-width': 1.8 }),
        s('text', { x: cx, y: cy - 11 * F, fill: C.cyan, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v));
    });

    // Forecast dashed amber line (week 6 -> week 7) + amber forecast ring
    k.push(s('line', { x1: wx(5), y1: ry(thisYr[5]), x2: wx(6), y2: yF7, stroke: C.amber, 'stroke-width': 2.6, 'stroke-dasharray': '7 5' }),
      s('circle', { cx: wx(6), cy: yF7, r: 8, fill: C.amber, 'fill-opacity': 0.25, stroke: C.amber, 'stroke-width': 2.8 }),
      s('text', { x: wx(6) - 13, y: yF7 + 4, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, fmt(r2(forecast))));

    // Real Christmas white dot (if revealed) or hidden '?' badge
    if (revealed) {
      const yR = ry(real7);
      k.push(s('circle', { cx: wx(6), cy: yR, r: 6, fill: C.ink }),
        s('text', { x: wx(6) + 12, y: yR + 4, fill: C.ink, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'start', 'font-family': 'Consolas' }, real7));
    } else {
      k.push(s('rect', { x: wx(6) + 10, y: TOP + 2, width: 56 * F, height: 22 * F, rx: 11, fill: C.bg, stroke: C.muted, 'stroke-dasharray': '4 3' }),
        s('text', { x: wx(6) + 10 + 28 * F, y: TOP + 17 * F, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'real ?'));
    }

    // Legend top-left
    k.push(
      s('circle', { cx: X0 + 96, cy: TOP - 14, r: 4, fill: C.cyan }),
      s('text', { x: X0 + 105, y: TOP - 10, fill: C.cyan, 'font-size': 11 * F, 'font-family': 'Consolas' }, 'this yr'),
      s('circle', { cx: X0 + 166, cy: TOP - 14, r: 4, fill: C.pink }),
      s('text', { x: X0 + 175, y: TOP - 10, fill: C.pink, 'font-size': 11 * F, 'font-family': 'Consolas' }, 'last yr')
    );

    // Bottom panel: Yearly gains row
    k.push(s('text', { x: X0, y: GTOP - 10, fill: C.green, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, 'Yearly gains (this year − last year)'));
    k.push(s('line', { x1: X0, x2: X1, y1: GZERO, y2: GZERO, stroke: C.muted, 'stroke-width': 1.6 }),
      s('text', { x: X0 - 8, y: GZERO + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, '0'));

    // Usual gain dashed violet line
    const yUsual = gy(usual);
    k.push(s('line', { x1: X0, x2: X1, y1: yUsual, y2: yUsual, stroke: C.violet, 'stroke-width': 2.2, 'stroke-dasharray': '7 5' }),
      s('text', { x: X0 - 8, y: yUsual + 4, fill: C.violet, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, fmt(usual)),
      s('text', { x: X1 - 2, y: yUsual - 6, fill: C.violet, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'usual ' + sfmt(usual)));

    // Gain bars (weeks 1..6)
    const bw = Math.min(42, colW * 0.56);
    gains.forEach((g, i) => {
      const cx = wx(i), y1 = gy(g), col = g >= 0 ? C.green : C.pink;
      k.push(s('rect', {
        x: cx - bw / 2, y: Math.min(GZERO, y1), width: bw, height: Math.max(2, Math.abs(y1 - GZERO)),
        fill: col, 'fill-opacity': 0.85, stroke: i === sel ? C.ink : col, 'stroke-width': i === sel ? 1.8 : 1, rx: 3
      }),
      s('text', {
        x: cx, y: g >= 0 ? y1 - 6 : y1 + 14 * F, fill: col,
        'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, sfmt(g)));
    });

    // Guide from week 6 gain to week 7 predicted gain
    k.push(s('line', { x1: wx(5), y1: gy(gain6), x2: wx(6), y2: gy(gain6), stroke: C.amber, 'stroke-width': 1.3, 'stroke-dasharray': '4 4', 'stroke-opacity': 0.6 }));

    // Week 7 predicted gain bar (amber)
    const yPred = gy(predGain);
    k.push(s('rect', {
      x: wx(6) - bw / 2, y: Math.min(GZERO, yPred), width: bw, height: Math.max(2, Math.abs(yPred - GZERO)),
      fill: C.amber, 'fill-opacity': 0.88, stroke: C.amber, 'stroke-width': 1.5, rx: 3
    }),
    s('text', {
      x: wx(6), y: predGain >= 0 ? yPred - 6 : yPred + 14 * F, fill: C.amber,
      'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
    }, sfmt(predGain)));

    svg.replaceChildren(...k);

    // Update formula box & UI text
    usualOut.textContent = sfmt(usual);
    phiOut.textContent = fmt(phi);
    revealBtn.textContent = revealed ? 'Hide real Christmas' : 'Reveal real Christmas';
    shiftBtn.textContent = shifted ? 'Restore matching holiday' : 'Test moving holiday';

    const lines = [
      `week 6 gain = ${thisYr[5]} − ${lastYr[5]} = ${sfmt(gain6)}`,
      `gap from usual = ${fmt(gain6)} − ${fmt(usual)} = ${sfmt(gap)}`,
      [`next gain = ${fmt(usual)} + ${fmt(phi)} × (${sfmt(gap)}) = ${sfmt(predGain)}`, C.amber],
      [`forecast  = ${lastYr[6]} + (${sfmt(predGain)}) = ${fmt(r2(forecast))}`, C.amber]
    ];
    if (revealed) {
      lines.push([`real = ${real7}   error = ${sfmt(err)}`, Math.abs(err) <= 2 ? C.green : C.pink]);
    }
    fbox(box, lines);

    note.textContent = shifted
      ? 'Trap active: last year’s Christmas peak was in week 8 (32), while week 7 was ordinary (24). Matching by week number misleads!'
      : revealed
        ? `Real Christmas was ${real7} rooms, so the forecast (${fmt(r2(forecast))}) was ${Math.abs(r2(err)) === 0 ? 'exact!' : `${fmt(Math.abs(r2(err)))} rooms ${err > 0 ? 'low' : 'high'}.`}`
        : 'The amber bar predicts the yearly gap for week 7, then adds it onto last Christmas’s pink dot.';

    selLabel.textContent = sel < 6
      ? `Selected: week ${sel + 1} (this yr ${thisYr[sel]}, gain ${sfmt(gains[sel])})`
      : `Selected: last Christmas (week 7 = ${lastYr[6]} rooms)`;

    chal.update({ gain6, forecast: r2(forecast), phi, randomReveals, shifted, revealed });
  }

  draw();
  return () => {};
}
