// 1.3.4 Try it: variance — measuring spread with squares.
// Drag parcel dots along the days line (or tap a parcel / square and use -1 / +1 day),
// see each gap become a real geometric square, share the total square area equally to find
// the variance, try random weeks, and solve self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [3, 4, 4, 5, 6, 6, 7];
  const MIN_D = 1, MAX_D = 12;
  let v = START.slice(), sel = 0, shared = 0, anim = 0, randomShares = 0, randomPending = false;

  const svg = s('svg', { viewBox: '0 0 700 460' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: measuring spread with squares'),
    h('p', { class: 'sub' }, 'Drag any parcel dot left or right, or tap a parcel and use −1 / +1 day. Watch each gap turn into a square, then share the total area equally.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1 day', () => bump(-1)), btn('+1 day', () => bump(1)), selLabel),
        h('div', { class: 'sim-row' },
          btn('Share equally', () => go(1), 'go'),
          btn('Back to each square', () => go(0)),
          btn('New week (random)', () => { v = v.map(() => rnd(MIN_D, MAX_D)); randomPending = true; changed(); }),
          btn('Add a parcel', () => { if (v.length < 8) { v.push(rnd(MIN_D, MAX_D)); sel = v.length - 1; changed(); } }),
          btn('Remove a parcel', () => { if (v.length > 2) { v.pop(); sel = Math.min(sel, v.length - 1); changed(); } }),
          btn('Start again', () => { v = START.slice(); randomPending = false; sel = 0; changed(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const total = () => v.reduce((a, b) => a + b, 0);
  const mean = () => total() / v.length;
  const r2 = x => { const y = Math.round(x * 100) / 100; return Object.is(y, -0) ? 0 : y; };
  const sfmt = x => {
    const y = r2(x);
    if (Math.abs(y) < 1e-6) return '0';
    return y > 0 ? '+' + fmt(y) : '−' + fmt(-y);
  };

  const chal = challenges(ch, [
    {
      text: 'Make the variance exactly 0 square days.',
      check: st => st.variance < 1e-6,
      why: 'Yes! When every parcel takes the same number of days, every gap is 0, so every square disappears and variance is 0.'
    },
    {
      text: 'Keep the mean at 5 days with 7 parcels, and make the variance bigger than 4 square days.',
      check: st => st.n === 7 && Math.abs(st.mean - 5) < 1e-6 && st.variance > 4,
      why: 'Right! Same average of 5 days, but pulling parcels farther apart makes the squares much bigger — so variance jumps.'
    },
    {
      text: 'Drag one parcel far out so its single square has area 16 square days or more.',
      check: st => st.squares.some(q => q >= 15.999),
      why: 'Look how huge that one square is! Squaring makes big delays stand out far more than tiny ones.'
    },
    {
      text: 'Press “New week (random)” and then “Share equally”, twice. Does variance ever turn negative?',
      check: st => st.randomShares >= 2,
      why: 'Never! A gap multiplied by itself is always 0 or positive, so the average square area can never be below 0.'
    }
  ]);

  // Geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 460, F = NARROW ? 1.15 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X0 = NARROW ? 20 : 34, X1 = VW - (NARROW ? 20 : 34);
  const TOP = 46, AXIS_Y = 202;
  const SQ_TOP = 262, SQ_BASE = 416, SQ_H = SQ_BASE - SQ_TOP;
  const step = (X1 - X0) / MAX_D;
  const d2x = d => X0 + d * step;
  const trackY = i => {
    const span = AXIS_Y - TOP - 14;
    const gap = span / v.length;
    return TOP + gap * (i + 0.5);
  };

  function changed() { cancelAnimationFrame(anim); shared = 0; draw(); }
  function bump(delta) { v[sel] = Math.max(MIN_D, Math.min(MAX_D, v[sel] + delta)); changed(); }
  function go(target) {
    if (target === 1 && randomPending && shared < 0.5) {
      randomShares++;
      randomPending = false;
    }
    cancelAnimationFrame(anim);
    const from = shared, t0 = performance.now();
    const stepAnim = now => {
      const k = Math.min(1, (now - t0) / 850);
      shared = from + (target - from) * k * k * (3 - 2 * k);
      draw();
      if (k < 1) anim = requestAnimationFrame(stepAnim);
    };
    anim = requestAnimationFrame(stepAnim);
  }

  // Pointer interaction: drag dot horizontally on top days line, or tap a square below to select it
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y >= SQ_TOP - 24 && p.y <= VH) {
      const colW = (X1 - X0) / v.length;
      const idx = Math.floor((p.x - X0) / colW);
      if (idx >= 0 && idx < v.length) { sel = idx; draw(); }
      return;
    }
    if (p.y < TOP - 14 || p.y > AXIS_Y + 12) return;
    let best = 0, bestDist = Infinity;
    for (let i = 0; i < v.length; i++) {
      const dist = Math.abs(p.y - trackY(i));
      if (dist < bestDist) { bestDist = dist; best = i; }
    }
    sel = best; dragging = best;
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    v[dragging] = Math.max(MIN_D, Math.min(MAX_D, Math.round((p.x - X0) / step)));
    changed();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const n = v.length, m = mean(), xm = d2x(m);
    const devs = v.map(x => x - m);
    const squares = devs.map(d => d * d);
    const sumSq = squares.reduce((a, b) => a + b, 0);
    const variance = sumSq / n;
    const k = [];

    // --- Top zone: days line, mean line, parcel dots & deviation arrows -----
    for (let d = 0; d <= MAX_D; d++) {
      const x = d2x(d);
      k.push(s('line', { x1: x, x2: x, y1: TOP - 6, y2: AXIS_Y, stroke: C.line, 'stroke-opacity': d === 0 ? 0.35 : 0.55 }));
      k.push(s('line', { x1: x, x2: x, y1: AXIS_Y - 4, y2: AXIS_Y + 4, stroke: C.muted, 'stroke-width': 1.5 }));
      if (!NARROW || d % 2 === 0 || d === MAX_D) {
        k.push(s('text', { x, y: AXIS_Y + 18, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, d));
      }
    }
    k.push(
      s('line', { x1: X0, x2: X1, y1: AXIS_Y, y2: AXIS_Y, stroke: C.muted, 'stroke-width': 2.2 }),
      s('text', { x: X1, y: AXIS_Y + 32, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end' }, 'days')
    );

    // Bright vertical mean line + pill tag
    k.push(s('line', { x1: xm, x2: xm, y1: 36, y2: AXIS_Y, stroke: C.amber, 'stroke-width': 2.8 }));
    const tagW = (NARROW ? 108 : 122) * F;
    const tagX = Math.max(X0, Math.min(X1 - tagW, xm - tagW / 2));
    k.push(
      s('rect', { x: tagX, y: 10, width: tagW, height: 24, rx: 12, fill: C.bg, stroke: C.amber, 'stroke-width': 2 }),
      s('text', { x: tagX + tagW / 2, y: 27, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'MEAN ' + fmt(r2(m)))
    );

    const rowH = (AXIS_Y - TOP - 14) / n;
    v.forEach((val, i) => {
      const y = trackY(i), xd = d2x(val), dev = devs[i];
      const col = Math.abs(dev) < 1e-6 ? C.amber : (dev < 0 ? C.green : C.pink);

      if (i === sel) {
        k.push(s('rect', { x: X0 - 4, y: y - rowH / 2 + 1, width: X1 - X0 + 8, height: Math.max(14, rowH - 2), fill: '#ffffff', 'fill-opacity': 0.05, rx: 6 }));
      }
      if (Math.abs(xd - xm) > 9) {
        const dir = xd > xm ? 1 : -1;
        const tipX = xd - dir * 8;
        const head = Math.min(7.5, Math.abs(tipX - xm) * 0.45);
        k.push(
          s('line', { x1: xm, x2: tipX, y1: y, y2: y, stroke: col, 'stroke-width': 2.6 }),
          s('line', { x1: tipX, x2: tipX - dir * head, y1: y, y2: y - head * 0.55, stroke: col, 'stroke-width': 2.6, 'stroke-linecap': 'round' }),
          s('line', { x1: tipX, x2: tipX - dir * head, y1: y, y2: y + head * 0.55, stroke: col, 'stroke-width': 2.6, 'stroke-linecap': 'round' })
        );
      }
      k.push(
        s('circle', { cx: xd, cy: y, r: 9.5, fill: C.cyan, 'fill-opacity': i === sel ? 0.32 : 0.16 }),
        s('circle', { cx: xd, cy: y, r: 5.5, fill: C.cyan, stroke: i === sel ? C.ink : 'none', 'stroke-width': 1.8 })
      );
      const labDir = Math.abs(dev) < 1e-6 ? 1 : (dev < 0 ? -1 : 1);
      const lx = Math.max(X0 + 14, Math.min(X1 - 14, xd + labDir * 16));
      k.push(s('text', {
        x: lx, y: y + 4, fill: col, 'font-size': 11.5 * F, 'font-weight': 700,
        'text-anchor': labDir < 0 ? 'end' : 'start', 'font-family': 'Consolas'
      }, sfmt(dev)));
    });

    // --- Bottom zone: literal geometric squares (each parcel -> shared) -----
    const heading = shared > 0.5
      ? `SHARED EQUALLY: EACH AVERAGE SQUARE = ${fmt(r2(variance))} SQ. DAYS`
      : 'EACH GAP AS A SQUARE  (AREA = GAP × GAP)';
    k.push(s('text', {
      x: VW / 2, y: 247, fill: shared > 0.5 ? C.amber : C.cyan,
      'font-size': (NARROW ? 11.5 : 13) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
    }, heading));
    k.push(s('line', { x1: X0, x2: X1, y1: SQ_BASE, y2: SQ_BASE, stroke: C.muted, 'stroke-width': 2 }));

    const colW = (X1 - X0) / n;
    const maxSide = Math.max(2, ...devs.map(Math.abs), Math.sqrt(variance));
    const u = Math.min((colW * 0.86) / maxSide, (SQ_H * 0.90) / maxSide);

    v.forEach((val, i) => {
      const cx = X0 + colW * (i + 0.5);
      const dispArea = squares[i] + (variance - squares[i]) * shared;
      const sideDays = Math.sqrt(Math.max(0, dispArea));
      const px = sideDays * u;
      const sqCol = shared > 0.5 ? C.amber : C.cyan;

      if (i === sel) {
        k.push(s('rect', { x: cx - colW / 2 + 2, y: SQ_TOP - 4, width: colW - 4, height: SQ_H + 38, fill: '#ffffff', 'fill-opacity': 0.04, rx: 7 }));
      }

      if (px > 1.5) {
        const sx = cx - px / 2, sy = SQ_BASE - px;
        k.push(s('rect', { x: sx, y: sy, width: px, height: px, fill: sqCol, 'fill-opacity': 0.24, stroke: sqCol, 'stroke-width': 2, rx: 2 }));
        // Subtle 1x1 unit grid inside each square when units are large enough to see clearly
        if (u >= 9 && sideDays > 1.05) {
          const steps = Math.floor(sideDays - 1e-6);
          for (let g = 1; g <= steps; g++) {
            const gx = sx + g * u, gy = SQ_BASE - g * u;
            k.push(
              s('line', { x1: gx, x2: gx, y1: sy, y2: SQ_BASE, stroke: sqCol, 'stroke-opacity': 0.35, 'stroke-width': 1 }),
              s('line', { x1: sx, x2: sx + px, y1: gy, y2: gy, stroke: sqCol, 'stroke-opacity': 0.35, 'stroke-width': 1 })
            );
          }
        }
        const labelInside = px >= 26;
        k.push(s('text', {
          x: cx, y: labelInside ? sy + px / 2 + 5 : sy - 6,
          fill: labelInside ? C.ink : sqCol,
          'font-size': (n > 7 ? 11 : 13) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, fmt(r2(dispArea))));
      } else {
        k.push(
          s('circle', { cx, cy: SQ_BASE, r: 3.5, fill: C.amber }),
          s('text', { x: cx, y: SQ_BASE - 9, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '0')
        );
      }

      const sub = NARROW ? `${val}d` : `${val}d (${sfmt(devs[i])})`;
      k.push(s('text', {
        x: cx, y: SQ_BASE + 19, fill: i === sel ? C.ink : C.muted,
        'font-size': (n > 7 ? 10 : 11.5) * F, 'text-anchor': 'middle', 'font-family': 'Consolas'
      }, sub));
    });

    // Dashed reference line at the average square height (sqrt(variance))
    if (variance > 1e-6) {
      const yAvg = SQ_BASE - Math.sqrt(variance) * u;
      k.push(s('line', { x1: X0, x2: X1, y1: yAvg, y2: yAvg, stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '7 6', 'stroke-opacity': shared > 0.5 ? 0.95 : 0.55 }));
    }

    svg.replaceChildren(...k);

    const sqList = squares.map(q => fmt(r2(q))).join(' + ');
    fbox(box, [
      `mean     = ${total()} ÷ ${n} = ${fmt(r2(m))} days`,
      sqList.length <= 34 ? `squares  = ${sqList}` : `count    = ${n} parcels`,
      `total    = ${fmt(r2(sumSq))} square days`,
      [`variance = ${fmt(r2(sumSq))} ÷ ${n} = ${fmt(r2(variance))} sq. days`, C.amber]
    ]);

    note.textContent = shared > 0.99
      ? `Shared equally: every parcel gets an average square of ${fmt(r2(variance))} square days. Remember: square days are not ordinary days.`
      : 'Every square has side = gap and area = gap × gap. The dashed amber line marks the side of the average square (variance).';
    selLabel.textContent = `Selected: parcel ${sel + 1} (${v[sel]}d, gap ${sfmt(devs[sel])}, square ${fmt(r2(squares[sel]))})`;

    chal.update({ mean: m, n, v: v.slice(), devs, squares, variance, randomShares });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}
