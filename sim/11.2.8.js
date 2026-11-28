// 11.2.8 Try it: moving-average error model (MA(1)).
// The learner drags the hotel's weekly room counts (especially weeks 5 and 6),
// changes the echo share, compares with an AR fade, makes random weeks, and solves challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [20, 24, 20, 23, 24, 29];
  const REAL_START = [35, 33];
  const USUAL = 22;

  let v = START.slice();
  let realHol = REAL_START.slice();
  let theta = 0.5;
  let sel = 5; // default selected: week 6 (0-based)
  let showAR = false;
  let showReal = false;
  let randomCount = 0;

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = 420, F = NARROW ? 1.16 : 1;
  const X0 = NARROW ? 42 : 56, X1 = VW - (NARROW ? 18 : 26);
  const TOP = 30, BASE = 358;
  const dx = (X1 - X0) / 8;
  const wx = w => X0 + (w - 0.5) * dx;
  const ry = val => BASE - (val / 40) * (BASE - TOP);

  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const thetaLabel = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.amber } });
  const slider = h('input', {
    type: 'range', min: '0', max: '1', step: '0.1', value: String(theta),
    style: { flex: '1 1 140px', accentColor: C.amber },
    oninput: e => { theta = Math.round(parseFloat(e.target.value) * 10) / 10; draw(); }
  });
  const arBtn = btn('Compare: AR fade', () => { showAR = !showAR; draw(); });
  const realBtn = btn('Show real holidays', () => { showReal = !showReal; draw(); });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: surprises and their echo'),
    h('p', { class: 'sub' }, 'Drag week 5 or week 6 up and down (or tap a week and use −1 / +1). Change the echo share and watch how the Christmas forecast reacts while New Year stays at the usual 22.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1', () => bump(-1)), btn('+1', () => bump(1)), selLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Echo share:'),
          slider, thetaLabel),
        h('div', { class: 'sim-row' },
          arBtn,
          realBtn,
          btn('New data (random)', () => {
            v = [rnd(16, 27), rnd(17, 28), rnd(15, 26), rnd(17, 28), rnd(16, 29), rnd(13, 35)];
            realHol = [rnd(24, 38), rnd(20, 36)];
            randomCount++;
            draw();
          }, 'go'),
          btn('Start again', () => {
            v = START.slice();
            realHol = REAL_START.slice();
            theta = 0.5;
            slider.value = '0.5';
            sel = 5;
            showAR = false;
            showReal = false;
            draw();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const r2 = x => Math.round(x * 100) / 100;
  const sgn = x => (x >= 0 ? '+' : '−') + fmt(Math.abs(r2(x)));
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

  function compute() {
    const f5 = USUAL;
    const e5 = r2(v[4] - f5);
    const echo6 = r2(theta * e5);
    const f6 = r2(USUAL + echo6);
    const e6 = r2(v[5] - f6);
    const echo7 = r2(theta * e6);
    const f7 = r2(USUAL + echo7);
    const f8 = USUAL;
    const d6 = v[5] - USUAL;
    const ar7 = r2(USUAL + theta * d6);
    const ar8 = r2(USUAL + theta * theta * d6);
    return { f5, e5, echo6, f6, e6, echo7, f7, f8, ar7, ar8 };
  }

  const chal = challenges(ch, [
    {
      text: 'Keep echo share at 0.5 and drag week 6 so the Christmas forecast becomes exactly 27 rooms.',
      check: st => st.theta === 0.5 && Math.abs(st.f7 - 27) < 1e-6,
      why: 'Yes! At half share, a week 6 surprise of +10 creates a +5 echo, raising Christmas to 22 + 5 = 27.'
    },
    {
      text: 'Make week 6’s surprise negative (below its forecast). See what happens to the Christmas forecast.',
      check: st => st.e6 < 0,
      why: 'Right: a negative surprise carries a negative echo into Christmas, pulling the forecast below 22.'
    },
    {
      text: 'Raise the echo share above 0.5 until Christmas is at least 26 rooms, and check New Year (week 8).',
      check: st => st.theta > 0.5 && st.f7 >= 26,
      why: 'Even with a larger echo share, New Year stays at 22. In MA(1), a surprise’s echo always ends after one week.'
    },
    {
      text: 'Press “New data” twice to test new weeks, then turn on “Compare: AR fade”.',
      check: st => st.randomCount >= 2 && st.showAR,
      why: 'In MA(1), week 8 always returns to the usual 22. An AR rule lets the shock fade gradually into week 8 instead.'
    }
  ]);

  function bump(d) {
    v[sel] = clamp(v[sel] + d, 2, 39);
    draw();
  }

  // Pointer dragging on weeks 1..6
  let dragging = -1;
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    const i = Math.floor((p.x - X0) / dx);
    if (i < 0 || i > 5) return;
    sel = i; dragging = i;
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    const val = Math.round(((BASE - p.y) / (BASE - TOP)) * 40);
    v[dragging] = clamp(val, 2, 39);
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function addBracket(k, x, yA, yB, color, label) {
    if (Math.abs(yA - yB) < 2) return;
    const top = Math.min(yA, yB), bot = Math.max(yA, yB);
    k.push(
      s('line', { x1: x, x2: x, y1: top, y2: bot, stroke: color, 'stroke-width': 3 }),
      s('line', { x1: x - 7, x2: x, y1: top, y2: top, stroke: color, 'stroke-width': 2.5 }),
      s('line', { x1: x - 7, x2: x, y1: bot, y2: bot, stroke: color, 'stroke-width': 2.5 }),
      s('text', {
        x: x + 6, y: (top + bot) / 2 + 5, fill: color,
        'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas'
      }, label)
    );
  }

  function draw() {
    const st = compute();
    const k = [];

    // Grid & y-axis ticks (0..40)
    for (let g = 0; g <= 40; g += 10) {
      const y = ry(g);
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line, 'stroke-width': g === 0 ? 2 : 1 }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g)
      );
    }
    k.push(s('line', { x1: X0, x2: X0, y1: TOP, y2: BASE, stroke: C.muted, 'stroke-width': 1.8 }));

    // Selected week highlight column
    const sx = wx(sel + 1);
    k.push(s('rect', { x: sx - dx * 0.42, y: TOP - 6, width: dx * 0.84, height: BASE - TOP + 6, fill: '#ffffff', 'fill-opacity': 0.045, rx: 8 }));

    // Vertical "now" line between week 6 and week 7
    const nowX = (wx(6) + wx(7)) / 2;
    k.push(
      s('line', { x1: nowX, x2: nowX, y1: TOP, y2: BASE, stroke: C.muted, 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }),
      s('text', { x: nowX, y: TOP - 8, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'now')
    );

    // Usual count guide at 22
    const yUsual = ry(USUAL);
    k.push(
      s('line', { x1: X0, x2: X1, y1: yUsual, y2: yUsual, stroke: C.violet, 'stroke-width': 2, 'stroke-dasharray': '7 6' }),
      s('text', { x: X1 - 2, y: yUsual + 16 * F, fill: C.violet, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'usual 22')
    );

    // Week x-axis labels
    for (let w = 1; w <= 8; w++) {
      const x = wx(w);
      k.push(
        s('line', { x1: x, x2: x, y1: BASE, y2: BASE + 5, stroke: C.muted }),
        s('text', { x, y: BASE + 21, fill: w >= 7 ? C.amber : (w - 1 === sel ? C.cyan : C.muted), 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, w)
      );
      if (w === 7) k.push(s('text', { x, y: BASE + 39, fill: C.amber, 'font-size': 11.5 * F, 'text-anchor': 'middle' }, 'Xmas'));
      if (w === 8) k.push(s('text', { x, y: BASE + 39, fill: C.amber, 'font-size': 11.5 * F, 'text-anchor': 'middle' }, 'NY'));
    }

    // Echo stacked bars at week 6 and week 7
    const barW = Math.min(24, dx * 0.34);
    for (const [w, fVal] of [[6, st.f6], [7, st.f7]]) {
      const yA = yUsual, yB = ry(clamp(fVal, 0, 40));
      if (Math.abs(yB - yA) >= 1.5) {
        k.push(s('rect', {
          x: wx(w) - barW / 2, y: Math.min(yA, yB), width: barW, height: Math.abs(yB - yA),
          fill: C.amber, 'fill-opacity': 0.45, stroke: C.amber, 'stroke-width': 1.5, rx: 2
        }));
      }
    }

    // Optional AR fade comparison curve
    if (showAR) {
      const p6 = `${wx(6)},${ry(v[5])}`, p7 = `${wx(7)},${ry(clamp(st.ar7, 0, 40))}`, p8 = `${wx(8)},${ry(clamp(st.ar8, 0, 40))}`;
      k.push(
        s('polyline', { points: `${p6} ${p7} ${p8}`, fill: 'none', stroke: C.violet, 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }),
        s('circle', { cx: wx(7), cy: ry(clamp(st.ar7, 0, 40)), r: 5, fill: C.violet }),
        s('circle', { cx: wx(8), cy: ry(clamp(st.ar8, 0, 40)), r: 5, fill: C.violet }),
        s('text', {
          x: wx(8), y: ry(clamp(st.ar8, 0, 40)) + (st.ar8 >= USUAL ? -10 : 16),
          fill: C.violet, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, `AR ${fmt(st.ar8)}`)
      );
    }

    // Observed weeks 1..6 polyline & glowing cyan dots
    const pts = v.map((val, i) => `${wx(i + 1)},${ry(val)}`).join(' ');
    k.push(s('polyline', { points: pts, fill: 'none', stroke: C.cyan, 'stroke-width': 2.8 }));
    v.forEach((val, i) => {
      const cx = wx(i + 1), cy = ry(val), active = i >= 4;
      k.push(
        s('circle', { cx, cy, r: (i === sel ? 14 : active ? 11 : 8), fill: C.cyan, 'fill-opacity': i === sel ? 0.24 : 0.14 }),
        s('circle', { cx, cy, r: active ? 6.5 : 5, fill: C.cyan, stroke: i === sel ? '#ffffff' : 'none', 'stroke-width': 1.8 }),
        s('text', {
          x: cx, y: val <= USUAL ? cy + 19 : cy - 12,
          fill: C.cyan, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, val)
      );
    });

    // Surprise brackets at weeks 5 and 6
    addBracket(k, wx(5) + 12, ry(st.f5), ry(v[4]), C.pink, sgn(st.e5));
    addBracket(k, wx(6) + 12, ry(clamp(st.f6, 0, 40)), ry(v[5]), C.pink, sgn(st.e6));

    // Forecasts (amber dashed line and dots at weeks 5, 6, 7, 8)
    const yF6 = ry(clamp(st.f6, 0, 40)), yF7 = ry(clamp(st.f7, 0, 40)), yF8 = ry(st.f8);
    k.push(
      s('polyline', {
        points: `${wx(6)},${ry(v[5])} ${wx(7)},${yF7} ${wx(8)},${yF8}`,
        fill: 'none', stroke: C.amber, 'stroke-width': 2.8, 'stroke-dasharray': '7 5'
      }),
      s('circle', { cx: wx(5), cy: yUsual, r: 4.5, fill: C.amber }),
      s('circle', { cx: wx(6), cy: yF6, r: 5, fill: C.amber }),
      s('circle', { cx: wx(7), cy: yF7, r: 6.5, fill: C.amber }),
      s('circle', { cx: wx(8), cy: yF8, r: 6.5, fill: C.amber }),
      s('text', { x: wx(7), y: yF7 + (st.f7 >= USUAL ? -13 : 20), fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(st.f7)),
      s('text', { x: wx(8), y: yF8 - 13, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(st.f8))
    );

    // Optional real holiday dots (white, matching chapter 11.2 style)
    if (showReal) {
      [[7, realHol[0]], [8, realHol[1]]].forEach(([w, rv]) => {
        const cx = wx(w), cy = ry(rv);
        k.push(
          s('circle', { cx, cy, r: 6.5, fill: '#ffffff', stroke: C.cyan, 'stroke-width': 1.5 }),
          s('text', { x: cx, y: cy - 11, fill: '#ffffff', 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `real ${rv}`)
        );
      });
    }

    svg.replaceChildren(...k);

    fbox(box, [
      [`usual = ${USUAL}  ·  echo share = ${fmt(theta)}`, C.violet],
      [`wk 5 surprise = ${v[4]} − ${st.f5} = ${sgn(st.e5)}`, C.pink],
      [`wk 6 forecast = ${USUAL} + ${fmt(theta)}×(${sgn(st.e5)}) = ${fmt(st.f6)}`, C.amber],
      [`wk 6 surprise = ${v[5]} − ${fmt(st.f6)} = ${sgn(st.e6)}`, C.pink],
      [`Christmas (7) = ${USUAL} + ${fmt(theta)}×(${sgn(st.e6)}) = ${fmt(st.f7)}`, C.amber],
      [`New Year  (8) = ${USUAL}  (echo ends)`, C.green]
    ]);

    note.textContent = showAR
      ? `Compare: MA(1) snaps back to ${USUAL} in week 8, while AR fades to ${fmt(st.ar8)} instead.`
      : `Week 6’s surprise (${sgn(st.e6)}) sends an echo of ${sgn(st.echo7)} into Christmas, then stops before New Year.`;
    selLabel.textContent = `Selected: week ${sel + 1} (${v[sel]} rooms)`;
    thetaLabel.textContent = fmt(theta);
    arBtn.className = 'sim-btn ' + (showAR ? 'go' : '');
    realBtn.className = 'sim-btn ' + (showReal ? 'go' : '');

    chal.update({ theta, f7: st.f7, e6: st.e6, randomCount, showAR });
  }

  draw();
  return () => {};
}
