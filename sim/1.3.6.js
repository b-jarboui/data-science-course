// 1.3.6 Try it: standard deviation back in days.
// The learner drags parcels along the days line (or taps one and uses -1 / +1),
// watches squared deviations, variance, and the square root (standard deviation) update live,
// tries random weeks and a late parcel, and solves self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [3, 4, 4, 5, 6, 6, 7];
  let v = START.slice(), sel = 0, randomCount = 0;

  const svg = s('svg', { viewBox: '0 0 700 460' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: standard deviation in days'),
    h('p', { class: 'sub' }, 'Each dot is one coffee parcel’s delivery time. Drag a dot left or right, or tap it and use −1 / +1. Watch the squares, variance, and standard deviation update live.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1 day', () => bump(-1)), btn('+1 day', () => bump(1)), selLabel),
        h('div', { class: 'sim-row' },
          btn('New week (random)', () => {
            const center = rnd(4, 7);
            v = v.map(() => Math.max(1, Math.min(12, center + rnd(-3, 3))));
            randomCount++;
            draw();
          }, 'go'),
          btn('Consistent café', () => { v = [4, 5, 5, 5, 5, 5, 6]; sel = 0; draw(); }),
          btn('Late parcel (21 days)', () => { v[v.length - 1] = 21; sel = v.length - 1; draw(); }),
          btn('Start again', () => { v = START.slice(); sel = 0; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const r2 = x => Math.round(x * 100) / 100;
  function stats() {
    const n = v.length;
    const sum = v.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const devs = v.map(x => x - mean);
    const sqs = devs.map(d => d * d);
    const sumSq = sqs.reduce((a, b) => a + b, 0);
    const variance = sumSq / (n - 1);
    const sd = Math.sqrt(variance);
    const lo = mean - sd, hi = mean + sd;
    const inside = v.filter(x => x >= lo - 1e-9 && x <= hi + 1e-9).length;
    return { n, sum, mean, devs, sqs, sumSq, variance, sd, lo, hi, inside };
  }

  const chal = challenges(ch, [
    { text: 'Make the standard deviation exactly 0 days.',
      check: st => st.sd === 0,
      why: 'Yes! When every parcel takes the same number of days, every gap from the mean is 0, so the standard deviation is 0.' },
    { text: 'Keep the mean at 5 days, and make the standard deviation smaller than 1 day (above 0).',
      check: st => Math.abs(st.mean - 5) < 1e-6 && st.sd > 0 && st.sd < 1,
      why: 'Nice! Moving parcels closer to 5 shrinks their squares, giving a smaller standard deviation and more consistent deliveries.' },
    { text: 'Keep the mean at 5 days, and push the standard deviation above 2 days.',
      check: st => Math.abs(st.mean - 5) < 1e-6 && st.sd > 2,
      why: 'Right: bigger gaps make much larger squares, so the standard deviation grows even while the average stays at 5.' },
    { text: 'Press “New week (random)” twice. Notice whether every parcel always falls inside the ±1 SD band.',
      check: st => st.randomCount >= 2,
      why: 'Each fresh week, the square root of variance turns square days back into days — and parcels can still fall outside ±1 SD because it shows typical spread, not a limit.' },
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 460, F = NARROW ? 1.15 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X0 = NARROW ? 24 : 38, X1 = VW - (NARROW ? 24 : 38);
  const LINE_Y = 172, BAND_TOP = 46;

  const maxDay = () => Math.max(10, Math.max(...v) + 1);
  const d2x = val => X0 + (val / maxDay()) * (X1 - X0);
  const x2d = x => Math.max(1, Math.min(21, Math.round(((x - X0) / (X1 - X0)) * maxDay())));

  function dotPositions() {
    const counts = new Map();
    return v.map(val => {
      const up = counts.get(val) || 0;
      counts.set(val, up + 1);
      return { x: d2x(val), y: LINE_Y - 22 - up * 25 };
    });
  }

  function bump(delta) {
    v[sel] = Math.max(1, Math.min(21, v[sel] + delta));
    draw();
  }

  // Pointer dragging on parcel dots
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y > LINE_Y + 36) return;
    const pts = dotPositions();
    let best = -1, bestD = 42;
    pts.forEach((pt, i) => {
      const dist = Math.hypot(p.x - pt.x, p.y - pt.y);
      if (dist < bestD) { bestD = dist; best = i; }
    });
    if (best < 0) return;
    sel = best; dragging = best;
    svg.setPointerCapture(e.pointerId);
    draw();
  });
  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const nv = x2d(p.x);
    if (nv !== v[dragging]) { v[dragging] = nv; draw(); }
  });
  const stopDrag = () => { dragging = -1; };
  svg.addEventListener('pointerup', stopDrag);
  svg.addEventListener('pointercancel', stopDrag);

  function draw() {
    const st = stats();
    const mx = maxDay();
    const pts = dotPositions();
    const k = [];

    // ±1 SD shaded band on days line
    const xLo = d2x(Math.max(0, st.lo)), xHi = d2x(Math.min(mx, st.hi));
    if (st.sd > 0) {
      k.push(
        s('rect', { x: xLo, y: BAND_TOP, width: Math.max(0, xHi - xLo), height: LINE_Y - BAND_TOP, fill: C.amber, 'fill-opacity': 0.14 }),
        s('line', { x1: xLo, x2: xLo, y1: BAND_TOP, y2: LINE_Y + 6, stroke: C.amber, 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }),
        s('line', { x1: xHi, x2: xHi, y1: BAND_TOP, y2: LINE_Y + 6, stroke: C.amber, 'stroke-width': 1.5, 'stroke-dasharray': '5 5' })
      );
      if (xHi - xLo > 48 * F) {
        k.push(
          s('text', { x: xLo, y: BAND_TOP - 5, fill: C.amber, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r2(st.lo))),
          s('text', { x: xHi, y: BAND_TOP - 5, fill: C.amber, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r2(st.hi)))
        );
      }
    }

    // Days axis + ticks
    k.push(s('line', { x1: X0, x2: X1, y1: LINE_Y, y2: LINE_Y, stroke: C.muted, 'stroke-width': 2.5 }));
    const step = mx > 12 ? 2 : 1;
    for (let d = 0; d <= mx; d += step) {
      const x = d2x(d);
      k.push(
        s('line', { x1: x, x2: x, y1: LINE_Y - 5, y2: LINE_Y + 5, stroke: C.muted, 'stroke-width': 1.5 }),
        s('text', { x, y: LINE_Y + 21, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, d)
      );
    }
    k.push(s('text', { x: X1, y: LINE_Y + 38, fill: C.muted, 'font-size': 11.5 * F, 'text-anchor': 'end' }, 'days'));

    // Mean line + clamped pill
    const xm = d2x(st.mean);
    const pillW = 104 * F, pillX = Math.max(X0, Math.min(X1 - pillW, xm - pillW / 2));
    k.push(
      s('line', { x1: xm, x2: xm, y1: 30, y2: LINE_Y + 4, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '7 6' }),
      s('rect', { x: pillX, y: 6, width: pillW, height: 24 * F, rx: 12 * F, fill: C.bg, stroke: C.amber }),
      s('text', { x: pillX + pillW / 2, y: 22 * F, fill: C.amber, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'MEAN ' + fmt(r2(st.mean)))
    );

    // Deviation line for selected parcel
    const sp = pts[sel];
    if (Math.abs(sp.x - xm) > 3) {
      k.push(s('line', { x1: xm, x2: sp.x, y1: sp.y, y2: sp.y, stroke: C.violet, 'stroke-width': 2.5 }));
    }

    // Parcel dots
    pts.forEach((pt, i) => {
      const inside = v[i] >= st.lo - 1e-9 && v[i] <= st.hi + 1e-9;
      const col = v[i] >= 15 ? C.pink : inside ? C.green : C.pink;
      const isSel = i === sel;
      if (isSel) {
        k.push(s('circle', { cx: pt.x, cy: pt.y, r: 17, fill: C.amber, 'fill-opacity': 0.18, stroke: C.amber, 'stroke-width': 2 }));
      }
      k.push(
        s('circle', { cx: pt.x, cy: pt.y, r: 11.5, fill: col, 'fill-opacity': 0.9, style: { cursor: 'grab' } }),
        s('text', { x: pt.x, y: pt.y + 4, fill: C.bg, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas', 'pointer-events': 'none' }, v[i])
      );
    });

    // Divider between days line and squares panel
    k.push(s('line', { x1: X0, x2: X1, y1: 226, y2: 226, stroke: C.line, 'stroke-dasharray': '4 6' }));

    // Lower-left: 7 squared deviations drawn as real squares
    const splitX = NARROW ? 236 : 430;
    const sqBase = 414, sqAreaW = splitX - X0 - 12, slotW = sqAreaW / v.length;
    const maxDev = Math.max(2, ...st.devs.map(d => Math.abs(d)));
    const maxSidePx = Math.min(slotW - 6, 118);
    k.push(s('text', { x: X0, y: 248, fill: C.muted, 'font-size': 12 * F, 'font-weight': 650 },
      `Squared gaps (sum = ${fmt(r2(st.sumSq))} sq days)`));

    st.sqs.forEach((sq, i) => {
      const cx = X0 + slotW * (i + 0.5);
      const sidePx = (Math.abs(st.devs[i]) / maxDev) * maxSidePx;
      const col = i === sel ? C.amber : v[i] >= 15 ? C.pink : C.cyan;
      if (sidePx >= 2) {
        k.push(s('rect', {
          x: cx - sidePx / 2, y: sqBase - sidePx, width: sidePx, height: sidePx,
          fill: col, 'fill-opacity': i === sel ? 0.42 : 0.28, stroke: col, 'stroke-width': i === sel ? 2.2 : 1.4, rx: 2
        }));
      } else {
        k.push(s('circle', { cx, cy: sqBase - 4, r: 3.5, fill: C.amber }));
      }
      k.push(
        s('text', { x: cx, y: sqBase - sidePx - 7, fill: col, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r2(sq))),
        s('text', { x: cx, y: sqBase + 18, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, v[i])
      );
    });
    k.push(s('line', { x1: X0, x2: splitX - 12, y1: sqBase, y2: sqBase, stroke: C.line, 'stroke-width': 1.5 }));

    // Lower-right: Variance square -> side = Standard Deviation
    const rX0 = splitX + 8, rCx = (rX0 + X1) / 2, rMax = Math.min(X1 - rX0 - 20, 116);
    k.push(s('text', { x: rCx, y: 248, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle' },
      'Variance → SD (side)'));

    const sdSide = st.sd === 0 ? 0 : Math.max(14, Math.min(rMax, (st.sd / Math.max(2.5, st.sd)) * rMax));
    const sqY = sqBase - sdSide;
    if (sdSide > 0) {
      k.push(
        s('rect', { x: rCx - sdSide / 2, y: sqY, width: sdSide, height: sdSide, fill: C.cyan, 'fill-opacity': 0.22, stroke: C.cyan, 'stroke-width': 2, rx: 3 }),
        s('line', { x1: rCx - sdSide / 2, x2: rCx + sdSide / 2, y1: sqBase, y2: sqBase, stroke: C.amber, 'stroke-width': 4.5 })
      );
    } else {
      k.push(s('circle', { cx: rCx, cy: sqBase - 5, r: 5, fill: C.amber }));
    }
    k.push(
      s('text', { x: rCx, y: Math.min(sqY - 8, sqBase - 24), fill: C.cyan, 'font-size': 11.5 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        `area = ${fmt(r2(st.variance))} sq d`),
      s('text', { x: rCx, y: sqBase + 20, fill: C.amber, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        `SD = ${fmt(r2(st.sd))} d`)
    );

    svg.replaceChildren(...k);

    // Formula box
    fbox(box, [
      `mean      = ${st.sum} ÷ ${st.n} = ${fmt(r2(st.mean))} days`,
      `sum of sq = ${fmt(r2(st.sumSq))} sq days`,
      `variance  = ${fmt(r2(st.sumSq))} ÷ ${st.n - 1} = ${fmt(r2(st.variance))} sq days`,
      [`SD = √${fmt(r2(st.variance))} = ${fmt(r2(st.sd))} days`, C.amber],
      [`±1 SD band: ${fmt(r2(st.lo))} to ${fmt(r2(st.hi))} (${st.inside}/${st.n} inside)`, C.green]
    ]);

    note.textContent = st.sd === 0
      ? 'Every parcel took the same number of days, so every squared gap is 0 and the standard deviation is 0.'
      : v.some(x => x >= 15)
        ? 'One very late parcel makes a huge squared gap, pulling both the variance and standard deviation way up.'
        : 'Green dots fall inside ±1 SD of the mean; pink dots fall outside. One standard deviation shows typical spread, not a limit.';

    const dv = st.devs[sel];
    const sign = dv > 0 ? '+' : dv < 0 ? '−' : '';
    selLabel.textContent = `Selected: parcel ${sel + 1} (${v[sel]} d, gap ${sign}${fmt(r2(Math.abs(dv)))})`;

    chal.update({ mean: st.mean, sd: r2(st.sd), n: st.n, v, randomCount });
  }

  draw();
  return () => {};
}
