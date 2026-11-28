// 3.2.6 Try it: complete-case bias.
// The learner drags the true hourly readings, chooses why readings go missing (heat or coin flips),
// compares the complete-case mean with the true mean, and runs many random days to see bias build up.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [18, 22, 28, 37, 40, 38, 32, 25];
  const HOURS = ['8', '9', '10', '11', '12', '1', '2', '3'];
  const SHAPE = [0, 0.18, 0.45, 0.86, 1, 0.91, 0.64, 0.32];   // a hot day: rise to noon, then fall
  const VMIN = 10, VMAX = 45;
  let v = START.slice(), mode = 'heat', limit = 35, coin = [], errors = [], runs = 0, queue = 0, anim = 0, sel = -1;

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const r1 = x => Math.round(x * 10) / 10;
  const avg = a => a.reduce((p, q) => p + q, 0) / a.length;
  const sgn = e => (e > 0.04 ? '+' : e < -0.04 ? '−' : '') + fmt(Math.abs(r1(e)));
  function flip() {
    let g;
    do { g = [0, 1, 2, 3, 4, 5, 6, 7].filter(() => Math.random() < 0.375); } while (!g.length || g.length > 6);
    return g;
  }
  const heatGaps = day => day.map((x, k) => x > limit ? k : -1).filter(k => k >= 0);
  const gapsNow = () => mode === 'heat' ? heatGaps(v) : coin;
  function randomDay() {
    const lo = rnd(14, 22), hi = rnd(30, 44);
    return SHAPE.map(w => clamp(Math.round(lo + (hi - lo) * w) + rnd(-2, 2), VMIN, VMAX));
  }
  function trial() {
    const day = randomDay(), g = mode === 'heat' ? heatGaps(day) : flip();
    const keep = day.filter((_, k) => !g.includes(k));
    return keep.length ? avg(keep) - avg(day) : null;
  }
  coin = flip();

  const svg = s('svg', { viewBox: '0 0 700 500' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const heatBtn = btn('Gaps from heat', () => setMode('heat'));
  const coinBtn = btn('Gaps by coin flip', () => setMode('coin'));
  const limLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const slider = h('input', { type: 'range', min: 20, max: 45, step: 1, value: limit, 'aria-label': 'Sensor C stops above this temperature',
    oninput: e => { limit = +e.target.value; clearRuns(); draw(); } });
  const flipBtn = btn('Flip the coins again', () => { coin = flip(); draw(); });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: can you drop the gaps?'),
    h('p', { class: 'sub' }, 'The numbers are the true readings from the reliable thermometer. Amber dots are what sensor C sent; hollow dashed circles are gaps. Drag a reading up or down, and choose why the gaps happen.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, heatBtn, coinBtn),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, limLabel, slider, flipBtn),
        h('div', { class: 'sim-row' },
          btn('New day (random)', () => { v = randomDay(); if (mode === 'coin') coin = flip(); draw(); }),
          btn('Run 100 days', () => run(100)),
          btn('Start again', reset))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'With gaps from heat, move the slider so sensor C loses exactly one reading.',
      check: st => st.mode === 'heat' && st.gapsN === 1,
      why: 'Even one lost hot reading pulls the complete-case mean below the true mean.' },
    { text: 'Switch to coin-flip gaps. Flip the coins until the error is within half a degree of zero.',
      check: st => st.mode === 'coin' && st.gapsN >= 1 && Math.abs(st.err) <= 0.5,
      why: 'With coin-flip gaps the kept readings can be a fair handful, so the mean can land right on the truth.' },
    { text: 'Switch back to gaps from heat and press “Run 100 days”. Does the error ever land above zero?',
      check: st => st.mode === 'heat' && st.runs >= 100,
      why: 'Never: heat gaps always remove the hottest readings, so the mean misses low, again and again. That is complete-case bias.' },
    { text: 'Now run 100 coin-flip days. Where does the average error land?',
      check: st => st.mode === 'coin' && st.runs >= 100,
      why: 'Near zero: the errors wobble on both sides and do not lean one way. Dropping rows is safe when the gaps happen by chance.' },
  ]);

  function clearRuns() { errors = []; runs = 0; queue = 0; cancelAnimationFrame(anim); anim = 0; }
  function setMode(m) { if (m === mode) return; mode = m; if (m === 'coin') coin = flip(); clearRuns(); draw(); }
  function reset() { v = START.slice(); mode = 'heat'; limit = 35; slider.value = 35; sel = -1; clearRuns(); draw(); }
  function run(n) { queue += n; if (!anim) anim = requestAnimationFrame(step); }
  function step() {
    for (let i = 0; i < 4 && queue > 0; i++, queue--) { const e = trial(); runs++; if (e !== null) errors.push(e); }
    draw();
    anim = queue > 0 ? requestAnimationFrame(step) : 0;
  }

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1, VH = 500;
  const X0 = NARROW ? 40 : 56, X1 = VW - (NARROW ? 46 : 62), TOP = 34, BASE = 290, HT = 362, HB = 456;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const slot = (X1 - X0) / 8;
  const cx = k => X0 + slot * (k + 0.5);
  const vy = x => BASE - (x - VMIN) / (VMAX - VMIN) * (BASE - TOP);
  const ex = e => X0 + (clamp(e, -10, 10) + 10) / 20 * (X1 - X0);

  // drag a reading: pointer height sets the temperature
  let dragging = -1;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), k = Math.floor((p.x - X0) / slot);
    if (k < 0 || k > 7 || p.y > BASE + 30) return;
    sel = dragging = k; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    v[dragging] = clamp(Math.round(VMIN + (BASE - p.y) / (BASE - TOP) * (VMAX - VMIN)), VMIN, VMAX);
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  const txt = (x, y, str, fill, size = 13, anchor = 'middle', weight = 400) =>
    s('text', { x, y, fill, 'font-size': size * F, 'text-anchor': anchor, 'font-weight': weight, 'font-family': 'Consolas, monospace' }, str);
  const hl = (y, stroke, dash = '9 7', w = 2.5) => s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke, 'stroke-width': w, 'stroke-dasharray': dash });

  function draw() {
    const g = gapsNow(), keep = v.map((_, i) => i).filter(i => !g.includes(i));
    const tot = v.reduce((a, b) => a + b, 0), tm = tot / 8;
    const cs = keep.reduce((a, i) => a + v[i], 0), n = keep.length, cm = n ? cs / n : NaN, err = cm - tm;
    const k = [];

    // chart: hours along the bottom, °C up the side
    for (let t = 10; t <= 40; t += 10) {
      const y = vy(t);
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }), txt(X0 - 6, y + 4, t + '°', C.muted, 12, 'end'));
    }
    HOURS.forEach((hr, i) => k.push(txt(cx(i), BASE + 20 * F, hr, C.muted, 13)));
    k.push(txt(X1 + 4, BASE + 20 * F, 'hour', C.muted, 11, 'start'));
    if (mode === 'heat') {
      const y = vy(limit);
      k.push(hl(y, C.pink, '4 5', 2), txt(X0 + 4, y - 6, `sensor C stops above ${limit}°`, C.pink, 12, 'start'));
    }
    v.forEach((x, i) => {
      const X = cx(i), Y = vy(x), isGap = g.includes(i);
      if (i === sel) k.push(s('rect', { x: X - slot / 2 + 2, y: TOP - 14, width: slot - 4, height: BASE - TOP + 14, fill: '#ffffff', 'fill-opacity': .04, rx: 8 }));
      if (isGap) k.push(s('circle', { cx: X, cy: Y, r: 9, fill: 'none', stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '4 4' }));
      else k.push(s('circle', { cx: X, cy: Y, r: 14, fill: C.amber, 'fill-opacity': .18 }), s('circle', { cx: X, cy: Y, r: 6.5, fill: C.amber }));
      k.push(txt(X, Y - 18, x, isGap ? C.muted : C.ink, 14, 'middle', 700));
    });
    const yt = vy(tm);
    k.push(hl(yt, C.ink), txt(X1 + 4, yt + 4, fmt(r1(tm)), C.ink, 12, 'start', 700));
    if (n) {
      const yc = vy(cm), ytag = Math.abs(yc - yt) < 14 ? yt + (cm < tm ? 14 : -14) : yc;
      k.push(hl(yc, C.amber), txt(X1 + 4, ytag + 4, fmt(r1(cm)), C.amber, 12, 'start', 700));
    }

    // many random days: the error of each one, collected
    k.push(txt(X0, HT - 12, `error of each random day (°C) · ${runs} days`, C.muted, 12, 'start'));
    k.push(s('line', { x1: X0, x2: X1, y1: HB, y2: HB, stroke: C.muted }));
    for (const t of [-10, -5, 0, 5, 10]) k.push(txt(ex(t), HB + 16 * F, t > 0 ? '+' + t : t < 0 ? '−' + -t : '0', C.muted, 12));
    const bins = new Array(21).fill(0);
    errors.forEach(e => bins[clamp(Math.round(e), -10, 10) + 10]++);
    const mx = Math.max(5, ...bins), bw = (X1 - X0) / 21;
    bins.forEach((c, i) => {
      if (!c) return;
      const hh = c / mx * (HB - HT - 6);
      k.push(s('rect', { x: ex(i - 10) - bw * 0.4, y: HB - hh, width: bw * 0.8, height: hh, fill: i < 10 ? C.pink : i > 10 ? C.cyan : C.green, 'fill-opacity': .8, rx: 2 }));
    });
    k.push(s('line', { x1: ex(0), x2: ex(0), y1: HT, y2: HB, stroke: C.ink, 'stroke-dasharray': '3 4' }));
    if (errors.length) {
      const x = ex(avg(errors));
      k.push(s('line', { x1: x, x2: x, y1: HT - 2, y2: HB, stroke: C.amber, 'stroke-width': 3 }));
    } else k.push(txt((X0 + X1) / 2, (HT + HB) / 2, 'Press “Run 100 days”', C.muted, 13));
    svg.replaceChildren(...k);

    fbox(box, [
      `true mean     = ${tot} ÷ 8 = ${fmt(r1(tm))}`,
      [`kept readings = ${n ? keep.map(i => v[i]).join(', ') : 'none'}`, C.amber],
      [n ? `complete-case = ${cs} ÷ ${n} = ${fmt(r1(cm))}` : 'complete-case = no complete rows', C.amber],
      [n ? `error = ${fmt(r1(cm))} − ${fmt(r1(tm))} = ${sgn(err)}` : 'error = cannot be found', !n || Math.abs(err) > 0.5 ? C.pink : C.green],
      ...(errors.length ? [[`${runs} random days: average error ${sgn(avg(errors))}`, C.cyan]] : []),
    ]);
    note.textContent = (mode === 'heat'
      ? `Heat gaps: sensor C stops above ${limit}°, so it loses ${g.length} of the hottest readings. ` + (n && err < -0.04 ? 'The amber line sits below the white line: too cool. ' : '')
      : 'Coin-flip gaps: any hour can be lost, hot or cool. The amber line wobbles around the white line, sometimes above, sometimes below. ')
      + 'White dashed line = true mean. Amber dashed line = complete-case mean. A minus error means too low.';

    heatBtn.className = 'sim-btn' + (mode === 'heat' ? ' go' : '');
    coinBtn.className = 'sim-btn' + (mode === 'coin' ? ' go' : '');
    limLabel.textContent = mode === 'heat' ? `Sensor C stops above ${limit} °C` : 'Gaps chosen by coin flips';
    slider.disabled = mode !== 'heat';
    slider.style.display = mode === 'heat' ? '' : 'none';
    flipBtn.style.display = mode === 'coin' ? '' : 'none';
    chal.update({ mode, gapsN: g.length, n, err: n ? err : NaN, runs });
  }
  draw();
  return () => cancelAnimationFrame(anim);
}
