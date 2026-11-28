// 11.2.2 Try it: seasonal naive forecasts.
// Drag last year's pink dots or this year's cyan/white dots (or tap one and use -1 / +1),
// shift this year up or down to test the growth trap, reveal real holidays, and try random hotels.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const START_THIS = [20, 24, 20, 23, 24, 29, 35, 33];
  const START_LAST = [18, 21, 19, 21, 22, 26, 32, 30];
  const WHITE = '#ffffff';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  let baseThis = START_THIS.slice();
  let lastY = START_LAST.slice();
  let shift = 0;
  let revealed = true;
  let showNaive = false;
  let sel = { series: 'last', i: 6 };
  let movedLastXmas = false;
  let isRandom = false, countedThisRandom = false, randomReveals = 0;

  const thisVal = i => clamp(baseThis[i] + shift, 0, 40);
  const signed = v => v > 0 ? `+${fmt(v)}` : v < 0 ? `−${fmt(Math.abs(v))}` : '0';

  const svg = s('svg', { viewBox: '0 0 700 420' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const shiftVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.cyan } });
  const shiftSlider = h('input', {
    type: 'range', min: '-6', max: '8', step: '1', value: '0',
    style: { flex: '1 1 140px', accentColor: C.cyan },
    oninput: e => { shift = Number(e.target.value); draw(); }
  });
  const revealBtn = btn('Hide real holidays', () => {
    revealed = !revealed;
    if (revealed && isRandom && !countedThisRandom) {
      randomReveals++;
      countedThisRandom = true;
    }
    if (!revealed && sel.series === 'this' && sel.i >= 6) sel = { series: 'last', i: sel.i };
    draw();
  });
  const naiveBtn = btn('Compare naive (W6)', () => { showNaive = !showNaive; draw(); });

  function newHotel() {
    const base = rnd(14, 24);
    const jump7 = rnd(5, 11);
    const jump8 = rnd(3, 9);
    const growth = rnd(-3, 5);
    const l = [
      clamp(base + rnd(-2, 2), 4, 30),
      clamp(base + rnd(-1, 3), 4, 30),
      clamp(base + rnd(-3, 1), 4, 30),
      clamp(base + rnd(-1, 3), 4, 30),
      clamp(base + rnd(0, 4), 4, 32),
      clamp(base + rnd(1, 5), 4, 32),
      0, 0
    ];
    l[6] = clamp(l[5] + jump7, 10, 36);
    l[7] = clamp(l[5] + jump8, 10, 36);
    const t = l.map(v => clamp(v + growth + rnd(-1, 1), 2, 40));
    lastY = l;
    baseThis = t;
    shift = 0;
    shiftSlider.value = '0';
    revealed = false;
    isRandom = true;
    countedThisRandom = false;
    sel = { series: 'last', i: 6 };
    draw();
  }

  function reset() {
    baseThis = START_THIS.slice();
    lastY = START_LAST.slice();
    shift = 0;
    shiftSlider.value = '0';
    revealed = true;
    showNaive = false;
    isRandom = false;
    countedThisRandom = false;
    sel = { series: 'last', i: 6 };
    draw();
  }

  function bump(d) {
    if (sel.series === 'last') {
      lastY[sel.i] = clamp(lastY[sel.i] + d, 0, 40);
      if (sel.i === 6) movedLastXmas = true;
    } else {
      const nv = clamp(thisVal(sel.i) + d, 0, 40);
      baseThis[sel.i] = nv - shift;
    }
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: seasonal naive forecasts'),
    h('p', { class: 'sub' }, 'Drag any dot up or down (or tap it and use −1 / +1). Copy the same week from last year to forecast Christmas and New Year, then test what happens when this year gets busier.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1', () => bump(-1)), btn('+1', () => bump(1)), selLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'This year shift:'),
          shiftSlider, shiftVal),
        h('div', { class: 'sim-row' },
          revealBtn,
          naiveBtn,
          btn('New hotel (random)', newHotel),
          btn('Start again', reset))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Move last Christmas (pink week 7) so the Christmas forecast matches the real count (error 0).',
      check: st => st.revealed && st.xmasErr === 0 && st.movedLastXmas,
      why: 'Right! The seasonal naive forecast copies last Christmas directly, so changing last Christmas moves the forecast to match.'
    },
    {
      text: 'Turn on “Compare naive (W6)” so you can see seasonal naive beat naive on Christmas week.',
      check: st => st.showNaive && st.revealed && Math.abs(st.xmasErr) < Math.abs(st.naiveErr),
      why: 'Yes! Copying week 6 misses the holiday jump, while copying last Christmas catches the repeating seasonal spike.'
    },
    {
      text: 'Use “This year shift” to make this year busier until both holiday errors are at least +5 rooms.',
      check: st => st.revealed && st.xmasErr >= 5 && st.nyErr >= 5,
      why: 'That is the trap: when the hotel keeps getting busier each year, copying last year leaves every forecast too low.'
    },
    {
      text: 'Press “New hotel (random)” and then “Reveal real holidays”, twice, to test the rule on fresh data.',
      check: st => st.randomReveals >= 2,
      why: 'Every time, copying last year catches the holiday shape — and misses by roughly how much busier or quieter the new year is.'
    }
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 420, F = NARROW ? 1.18 : 1;
  const X0 = NARROW ? 42 : 54, X1 = VW - 18, BASE = 354, TOP = 46;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const wx = i => X0 + (i + 0.5) * (X1 - X0) / 8;
  const ry = v => BASE - (v / 40) * (BASE - TOP);
  const nowX = (wx(5) + wx(6)) / 2;

  // Pointer dragging for any visible dot
  let dragging = null;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    const candidates = [];
    for (let i = 0; i < 8; i++) {
      candidates.push({ series: 'last', i, x: wx(i), y: ry(lastY[i]) });
      if (i < 6 || revealed) candidates.push({ series: 'this', i, x: wx(i), y: ry(thisVal(i)) });
    }
    let best = null, bestD = Infinity;
    for (const c of candidates) {
      const d = Math.hypot(p.x - c.x, p.y - c.y);
      if (d < bestD) { bestD = d; best = c; }
    }
    if (!best || bestD > 56 * F) return;
    sel = { series: best.series, i: best.i };
    dragging = sel;
    svg.setPointerCapture(e.pointerId);
    move(e);
  });

  const move = e => {
    if (!dragging) return;
    const p = toSvg(e);
    const val = clamp(Math.round(((BASE - p.y) / (BASE - TOP)) * 40), 0, 40);
    if (dragging.series === 'last') {
      lastY[dragging.i] = val;
      if (dragging.i === 6) movedLastXmas = true;
    } else {
      baseThis[dragging.i] = val - shift;
    }
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = null; });
  svg.addEventListener('pointercancel', () => { dragging = null; });

  function draw() {
    const t = Array.from({ length: 8 }, (_, i) => thisVal(i));
    const fc7 = lastY[6], fc8 = lastY[7];
    const xmasErr = t[6] - fc7, nyErr = t[7] - fc8;
    const naiveFc = t[5], naiveErr = t[6] - naiveFc;
    const gaps = Array.from({ length: 6 }, (_, i) => t[i] - lastY[i]);
    const avgGap = Math.round((gaps.reduce((a, b) => a + b, 0) / 6) * 10) / 10;

    const k = [];
    // Holiday shaded zone
    k.push(s('rect', { x: nowX, y: TOP, width: X1 - nowX, height: BASE - TOP, fill: C.amber, 'fill-opacity': 0.06, rx: 4 }));

    // Horizontal gridlines & y-axis labels
    for (let g = 0; g <= 40; g += 10) {
      const y = ry(g);
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: g === 0 ? C.muted : C.line, 'stroke-width': g === 0 ? 1.8 : 1 }),
        s('text', { x: X0 - 8, y: y + 4 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g)
      );
    }
    k.push(s('line', { x1: X0, x2: X0, y1: TOP, y2: BASE, stroke: C.muted, 'stroke-width': 1.8 }));

    // "now" divider
    k.push(
      s('line', { x1: nowX, x2: nowX, y1: TOP, y2: BASE, stroke: C.muted, 'stroke-dasharray': '5 5', 'stroke-width': 1.5 }),
      s('text', { x: nowX, y: TOP - 8, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'now')
    );

    // Week axis labels
    for (let i = 0; i < 8; i++) {
      const x = wx(i), hol = i >= 6;
      k.push(
        s('line', { x1: x, x2: x, y1: BASE - 4, y2: BASE + 4, stroke: C.muted }),
        s('text', { x, y: BASE + 20 * F, fill: hol ? C.amber : C.muted, 'font-size': 13 * F, 'font-weight': hol ? 700 : 400, 'text-anchor': 'middle', 'font-family': 'Consolas' }, i + 1)
      );
      if (i === 6) k.push(s('text', { x, y: BASE + 36 * F, fill: C.amber, 'font-size': 11 * F, 'text-anchor': 'middle' }, 'Xmas'));
      if (i === 7) k.push(s('text', { x, y: BASE + 36 * F, fill: C.amber, 'font-size': 11 * F, 'text-anchor': 'middle' }, 'NY'));
    }

    // Top legend
    const legY = 18;
    const lx1 = X0 + 6, lx2 = X0 + (NARROW ? 95 : 130), lx3 = X0 + (NARROW ? 185 : 255);
    k.push(
      s('circle', { cx: lx1, cy: legY, r: 5, fill: C.cyan }),
      s('text', { x: lx1 + 10, y: legY + 4, fill: C.cyan, 'font-size': 11.5 * F }, NARROW ? 'This yr' : 'This year'),
      s('circle', { cx: lx2, cy: legY, r: 5, fill: C.pink }),
      s('text', { x: lx2 + 10, y: legY + 4, fill: C.pink, 'font-size': 11.5 * F }, NARROW ? 'Last yr' : 'Last year'),
      s('line', { x1: lx3 - 8, x2: lx3 + 12, y1: legY, y2: legY, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }),
      s('text', { x: lx3 + 18, y: legY + 4, fill: C.amber, 'font-size': 11.5 * F }, NARROW ? 'Seas. naive' : 'Seasonal naive')
    );

    // Last year polyline (pink)
    const lastPts = lastY.map((v, i) => `${wx(i)},${ry(v)}`).join(' ');
    k.push(s('polyline', { points: lastPts, fill: 'none', stroke: C.pink, 'stroke-width': 2.2, 'stroke-opacity': 0.72 }));

    // This year polyline (cyan, W1-W6 plus W7-W8 if revealed)
    const visCount = revealed ? 8 : 6;
    const thisPts = t.slice(0, visCount).map((v, i) => `${wx(i)},${ry(v)}`).join(' ');
    k.push(s('polyline', { points: thisPts, fill: 'none', stroke: C.cyan, 'stroke-width': 2.8 }));

    // Optional naive comparison (copy week 6)
    if (showNaive) {
      k.push(
        s('line', { x1: wx(5), y1: ry(naiveFc), x2: wx(6), y2: ry(naiveFc), stroke: C.pink, 'stroke-width': 2, 'stroke-dasharray': '4 4', 'stroke-opacity': 0.85 }),
        s('circle', { cx: wx(6), cy: ry(naiveFc), r: 5.5, fill: C.bg, stroke: C.pink, 'stroke-width': 2 })
      );
      if (revealed) {
        k.push(
          s('line', { x1: wx(6) - 10, y1: ry(naiveFc), x2: wx(6) - 10, y2: ry(t[6]), stroke: C.pink, 'stroke-width': 2.5, 'stroke-opacity': 0.75 }),
          s('text', { x: wx(6) - 15, y: (ry(naiveFc) + ry(t[6])) / 2 + 4, fill: C.pink, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, `N:${signed(naiveErr)}`)
        );
      }
    }

    // Seasonal naive dashed amber forecast line
    k.push(s('polyline', {
      points: `${wx(5)},${ry(t[5])} ${wx(6)},${ry(fc7)} ${wx(7)},${ry(fc8)}`,
      fill: 'none', stroke: C.amber, 'stroke-width': 2.8, 'stroke-dasharray': '7 5'
    }));

    // Error bars when revealed
    if (revealed) {
      for (const [idx, fc, err] of [[6, fc7, xmasErr], [7, fc8, nyErr]]) {
        if (err !== 0) {
          k.push(
            s('line', { x1: wx(idx), y1: ry(fc), x2: wx(idx), y2: ry(t[idx]), stroke: C.violet, 'stroke-width': 4 }),
            s('text', { x: wx(idx) + 12, y: (ry(fc) + ry(t[idx])) / 2 + 4, fill: C.violet, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, signed(err))
          );
        }
      }
    } else {
      // Hidden ? markers for weeks 7 and 8
      for (const idx of [6, 7]) {
        const yq = TOP + 22;
        k.push(
          s('circle', { cx: wx(idx), cy: yq, r: 12, fill: C.card, stroke: C.cyan, 'stroke-width': 1.8, 'stroke-dasharray': '3 3' }),
          s('text', { x: wx(idx), y: yq + 5, fill: C.cyan, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '?')
        );
      }
    }

    // Last year pink dots & forecast rings on W7/W8
    lastY.forEach((v, i) => {
      const cx = wx(i), cy = ry(v);
      const isSel = sel.series === 'last' && sel.i === i;
      if (i >= 6) {
        k.push(s('circle', { cx, cy, r: 10.5, fill: C.amber, 'fill-opacity': 0.16, stroke: C.amber, 'stroke-width': 2.5 }));
      }
      if (isSel) {
        k.push(s('circle', { cx, cy, r: 13.5, fill: 'none', stroke: WHITE, 'stroke-width': 2, 'stroke-dasharray': '3 2' }));
      }
      k.push(
        s('circle', { cx, cy, r: 5.5, fill: C.pink, 'fill-opacity': 0.9, style: 'cursor:ns-resize' }),
        s('text', { x: cx, y: cy + (v <= 4 ? -12 : 20), fill: i >= 6 ? C.amber : C.pink, 'font-size': 11.5 * F, 'font-weight': i >= 6 ? 700 : 500, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v)
      );
    });

    // This year dots (cyan W1-W6, white W7-W8 when revealed)
    for (let i = 0; i < visCount; i++) {
      const v = t[i], cx = wx(i), cy = ry(v), col = i >= 6 ? WHITE : C.cyan;
      const isSel = sel.series === 'this' && sel.i === i;
      if (isSel) {
        k.push(s('circle', { cx, cy, r: 13.5, fill: 'none', stroke: WHITE, 'stroke-width': 2, 'stroke-dasharray': '3 2' }));
      }
      k.push(
        s('circle', { cx, cy, r: 10, fill: col, 'fill-opacity': 0.16 }),
        s('circle', { cx, cy, r: 6, fill: col, style: 'cursor:ns-resize' }),
        s('text', { x: cx, y: cy - (v >= 37 ? -20 : 12), fill: col, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v)
      );
    }

    svg.replaceChildren(...k);

    // Update buttons & readouts
    revealBtn.textContent = revealed ? 'Hide real holidays' : 'Reveal real holidays';
    revealBtn.className = 'sim-btn ' + (revealed ? '' : 'go');
    naiveBtn.textContent = showNaive ? 'Hide naive (W6)' : 'Compare naive (W6)';
    naiveBtn.className = 'sim-btn ' + (showNaive ? 'go' : '');

    const wkName = sel.i === 6 ? 'W7 Xmas' : sel.i === 7 ? 'W8 NY' : `W${sel.i + 1}`;
    const who = sel.series === 'last' ? 'Last year' : 'This year';
    const curVal = sel.series === 'last' ? lastY[sel.i] : t[sel.i];
    selLabel.textContent = `Selected: ${who} ${wkName} (${curVal} rooms)`;
    shiftVal.textContent = `${signed(shift)} rooms`;

    // Formula box
    const lines = [
      ['Seasonal naive (copy last year)', C.amber],
      revealed
        ? [`W7 Xmas: fc ${fc7}, real ${t[6]} → err ${signed(xmasErr)}`, xmasErr === 0 ? C.green : C.violet]
        : [`W7 Xmas: forecast = ${fc7} (real hidden)`, C.amber],
      revealed
        ? [`W8 NY:   fc ${fc8}, real ${t[7]} → err ${signed(nyErr)}`, nyErr === 0 ? C.green : C.violet]
        : [`W8 NY:   forecast = ${fc8} (real hidden)`, C.amber],
      [`W1–W6 avg gap (this − last): ${signed(avgGap)}`, C.cyan]
    ];
    if (showNaive) {
      lines.push(revealed
        ? [`Naive W7 (copy W6): ${naiveFc} → err ${signed(naiveErr)}`, C.pink]
        : [`Naive W7 (copy W6): forecast = ${naiveFc}`, C.pink]);
    }
    fbox(box, lines);

    note.textContent = !revealed
      ? 'Real holiday counts are hidden. Check the amber seasonal naive forecast, then press “Reveal real holidays” to see the errors.'
      : avgGap >= 1
        ? `Before Christmas, this year runs ${signed(avgGap)} rooms higher on average — copying last year ignores that growth.`
        : avgGap <= -1
          ? `Before Christmas, this year runs ${signed(avgGap)} rooms lower on average — copying last year tends to aim too high.`
          : 'This year and last year sit at nearly the same level, so copying last year’s holiday weeks works well.';

    chal.update({ revealed, xmasErr, nyErr, naiveErr, showNaive, movedLastXmas, randomReveals, lastY, t });
  }

  draw();
  return () => {};
}
