// 1.3.3 Try it: deviations from the mean.
// Drag parcel dots left or right along the days line (or tap a parcel and use -1 / +1),
// watch every deviation arrow and the left/right balance update live, level to the mean,
// try random or lopsided deliveries, and solve self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [3, 4, 4, 5, 6, 6, 7];
  const MIN_D = 1, MAX_D = 12;
  let v = START.slice(), sel = 0, level = 0, anim = 0, randomCount = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: deviations from the mean'),
    h('p', { class: 'sub' }, 'Each glowing dot is one coffee parcel. Drag any dot left or right, or tap it and use −1 / +1 day.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1 day', () => bump(-1)), btn('+1 day', () => bump(1)), selLabel),
        h('div', { class: 'sim-row' },
          btn('Level to the mean', () => go(1), 'go'),
          btn('Back to real times', () => go(0)),
          btn('New deliveries (random)', () => { v = v.map(() => rnd(MIN_D, MAX_D)); randomCount++; changed(); }),
          btn('Lopsided (4, 4, 7)', () => { v = [4, 4, 7]; sel = 0; changed(); }),
          btn('Add a parcel', () => { if (v.length < 9) { v.push(rnd(MIN_D, MAX_D)); sel = v.length - 1; changed(); } }),
          btn('Remove a parcel', () => { if (v.length > 2) { v.pop(); sel = Math.min(sel, v.length - 1); changed(); } }),
          btn('Start again', () => { v = START.slice(); sel = 0; changed(); }))),
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
      text: 'Drag any parcel so that at least one deviation is +4 or more.',
      check: st => st.devs.some(d => d >= 3.999),
      why: 'Yes! A parcel 4 or more days above the mean gets +4 or more — and the other arrows shift so the sum still balances to 0.'
    },
    {
      text: 'Make every parcel have a deviation of 0.',
      check: st => st.devs.every(d => Math.abs(d) < 1e-6),
      why: 'Right! Every parcel took the same number of days. Notice the sum is 0 now — just like when the parcels were spread from 3 to 7.'
    },
    {
      text: 'Make a lopsided group of 3 parcels with a mean of 5 (not evenly matched pairs). Try “Lopsided (4, 4, 7)” or build your own.',
      check: st => st.n === 3 && Math.abs(st.mean - 5) < 1e-6 && st.devs.some(d => Math.abs(d) > 0.01) && Math.abs(Math.max(...st.devs) + Math.min(...st.devs)) > 0.01,
      why: 'Nice! Even when parcels are lopsided, the extra days above 5 still match the missing days below 5.'
    },
    {
      text: 'Press “New deliveries (random)” three times. Does the sum of deviations ever leave 0?',
      check: st => st.randomCount >= 3,
      why: 'Never — even with messy or decimal means. Every extra day above the mean is matched by a missing day below it.'
    }
  ]);

  // Geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = 440, F = NARROW ? 1.18 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X0 = NARROW ? 24 : 38, X1 = VW - (NARROW ? 24 : 38);
  const TOP = 54, AXIS_Y = 304, BAL_Y = 376;
  const step = (X1 - X0) / MAX_D;
  const d2x = d => X0 + d * step;
  const trackY = i => {
    const n = v.length;
    const span = AXIS_Y - TOP - 20;
    const gap = span / n;
    return TOP + gap * (i + 0.5);
  };

  function changed() { cancelAnimationFrame(anim); level = 0; draw(); }
  function bump(delta) { v[sel] = Math.max(MIN_D, Math.min(MAX_D, v[sel] + delta)); changed(); }
  function go(target) {
    cancelAnimationFrame(anim);
    const from = level, t0 = performance.now();
    const stepAnim = now => {
      const k = Math.min(1, (now - t0) / 850);
      level = from + (target - from) * k * k * (3 - 2 * k);
      draw();
      if (k < 1) anim = requestAnimationFrame(stepAnim);
    };
    anim = requestAnimationFrame(stepAnim);
  }

  // Drag a parcel horizontally along its track
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y < TOP - 16 || p.y > AXIS_Y + 12) return;
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
    const negSum = devs.filter(d => d < -1e-9).reduce((a, b) => a + b, 0);
    const posSum = devs.filter(d => d > 1e-9).reduce((a, b) => a + b, 0);
    const k = [];

    // Vertical grid lines & days axis ticks (0..12)
    for (let d = 0; d <= MAX_D; d++) {
      const x = d2x(d);
      k.push(s('line', { x1: x, x2: x, y1: TOP - 8, y2: AXIS_Y, stroke: C.line, 'stroke-opacity': d === 0 ? 0.35 : 0.55 }));
      k.push(s('line', { x1: x, x2: x, y1: AXIS_Y - 5, y2: AXIS_Y + 5, stroke: C.muted, 'stroke-width': 1.5 }));
      if (!NARROW || d % 2 === 0 || d === MAX_D) {
        k.push(s('text', { x, y: AXIS_Y + 22, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, d));
      }
    }
    k.push(s('line', { x1: X0, x2: X1, y1: AXIS_Y, y2: AXIS_Y, stroke: C.muted, 'stroke-width': 2.5 }),
      s('text', { x: X1, y: AXIS_Y + 40, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end' }, 'days'));

    // Bright vertical mean line + pill tag
    k.push(s('line', { x1: xm, x2: xm, y1: 42, y2: AXIS_Y, stroke: C.amber, 'stroke-width': 3 }));
    const tagW = (NARROW ? 116 : 126) * F;
    const tagX = Math.max(X0, Math.min(X1 - tagW, xm - tagW / 2));
    k.push(
      s('rect', { x: tagX, y: 12, width: tagW, height: 26, rx: 13, fill: C.bg, stroke: C.amber, 'stroke-width': 2 }),
      s('text', { x: tagX + tagW / 2, y: 30, fill: C.amber, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'MEAN ' + fmt(r2(m)))
    );

    // Parcel tracks, deviation arrows, glowing dots, labels
    const rowH = (AXIS_Y - TOP - 20) / n;
    v.forEach((val, i) => {
      const y = trackY(i);
      const disp = val + (m - val) * level;
      const xd = d2x(disp);
      const dev = disp - m;
      const col = Math.abs(dev) < 1e-6 ? C.amber : (dev < 0 ? C.green : C.pink);

      if (i === sel) {
        k.push(s('rect', { x: X0 - 6, y: y - rowH / 2 + 2, width: X1 - X0 + 12, height: Math.max(18, rowH - 4), fill: '#ffffff', 'fill-opacity': 0.05, rx: 8 }));
      }

      // Horizontal deviation arrow from mean line to dot
      if (Math.abs(xd - xm) > 10) {
        const dir = xd > xm ? 1 : -1;
        const tipX = xd - dir * 10;
        const head = Math.min(9, Math.abs(tipX - xm) * 0.45);
        k.push(
          s('line', { x1: xm, x2: tipX, y1: y, y2: y, stroke: col, 'stroke-width': 3 }),
          s('line', { x1: tipX, x2: tipX - dir * head, y1: y, y2: y - head * 0.55, stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round' }),
          s('line', { x1: tipX, x2: tipX - dir * head, y1: y, y2: y + head * 0.55, stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round' })
        );
      }

      // Glowing parcel dot
      k.push(
        s('circle', { cx: xd, cy: y, r: 12, fill: C.cyan, 'fill-opacity': i === sel ? 0.30 : 0.16 }),
        s('circle', { cx: xd, cy: y, r: 6.5, fill: C.cyan, stroke: i === sel ? C.ink : 'none', 'stroke-width': 2 })
      );

      // Deviation label placed cleanly outside the dot so it never overlaps the arrow
      const labDir = Math.abs(dev) < 1e-6 ? 1 : (dev < 0 ? -1 : 1);
      const lx = Math.max(X0 + 16, Math.min(X1 - 16, xd + labDir * 24));
      const anchor = labDir < 0 ? 'end' : 'start';
      k.push(s('text', {
        x: lx, y: y + 5, fill: col, 'font-size': 13 * F, 'font-weight': 700,
        'text-anchor': anchor, 'font-family': 'Consolas'
      }, sfmt(dev)));
    });

    // Bottom balance bar: LEFT (−) vs RIGHT (+)
    const midX = VW / 2;
    const maxSpan = (VW - 80) / 2;
    const scale = Math.max(4, posSum, -negSum);
    const barW = Math.min(maxSpan, (posSum / scale) * maxSpan * (1 - level));
    k.push(s('line', { x1: midX, x2: midX, y1: BAL_Y - 16, y2: BAL_Y + 16, stroke: C.amber, 'stroke-width': 2.5 }));
    if (barW > 1) {
      k.push(
        s('rect', { x: midX - barW, y: BAL_Y - 12, width: barW, height: 24, rx: 6, fill: C.green, 'fill-opacity': 0.25, stroke: C.green, 'stroke-width': 1.8 }),
        s('rect', { x: midX, y: BAL_Y - 12, width: barW, height: 24, rx: 6, fill: C.pink, 'fill-opacity': 0.25, stroke: C.pink, 'stroke-width': 1.8 })
      );
    }
    const leftTxt = 'LEFT: ' + sfmt(negSum * (1 - level));
    const rightTxt = 'RIGHT: ' + sfmt(posSum * (1 - level));
    k.push(
      s('text', { x: midX - 10, y: BAL_Y + 5, fill: C.green, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, leftTxt),
      s('text', { x: midX + 10, y: BAL_Y + 5, fill: C.pink, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'start', 'font-family': 'Consolas' }, rightTxt),
      s('text', { x: midX, y: BAL_Y + 38, fill: C.amber, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
        `${sfmt(negSum * (1 - level))}  +  ${sfmt(posSum * (1 - level))}  =  0   (ALWAYS BALANCES)`)
    );

    svg.replaceChildren(...k);

    const devList = devs.map(sfmt).join(', ');
    fbox(box, [
      `mean  = ${total()} ÷ ${n} = ${fmt(r2(m))} days`,
      devList.length <= 34 ? `devs  = ${devList}` : `count = ${n} parcels`,
      [`left (−)  = ${sfmt(negSum)}`, C.green],
      [`right (+) = ${sfmt(posSum)}`, C.pink],
      [`sum of deviations = 0`, C.amber]
    ]);

    note.textContent = level > 0.99
      ? 'Levelled: every parcel met at the mean, so every deviation is 0.'
      : 'Every deviation is (delivery time − mean). Watch the green left bar and pink right bar stay equal as you drag.';
    selLabel.textContent = `Selected: parcel ${sel + 1} (${v[sel]} days, dev ${sfmt(v[sel] - m)})`;

    chal.update({ mean: m, n, v: v.slice(), devs, randomCount });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}
