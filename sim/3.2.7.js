// 3.2.7 Try it: simple (mean) imputation.
// Six beds, one noon reading each. The learner drags readings, taps a bed to turn its reading into a gap
// (or bring it back), makes random data, and sees live: every gap is filled with the mean of the real readings,
// the mean stays the same, and the spread (standard deviation) shrinks.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [19, null, 31, 19, null, 31];
  let v = START.slice(), keep = [19, 25, 31, 19, 25, 31], sel = 1, news = 0, warn = '';

  const svg = s('svg', { viewBox: '0 0 700 480' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const gapBtn = btn('Make it a gap', () => toggle(sel));
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: filling gaps with the mean'),
    h('p', { class: 'sub' }, 'Six plant beds, one noon reading each. Drag a dot up or down. Tap a bed to turn its reading into a gap, or bring it back. Every gap is filled with the mean of the real readings (green).'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1', () => bump(-1)), btn('+1', () => bump(1)), gapBtn, selLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random)', () => newData(), 'go'),
          btn('Start again', () => { v = START.slice(); keep = [19, 25, 31, 19, 25, 31]; sel = 1; warn = ''; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  // numbers
  const obs = () => v.filter(x => x !== null);
  const gapCount = () => v.length - obs().length;
  const mean = () => { const o = obs(); return o.reduce((a, b) => a + b, 0) / o.length; };
  const squares = () => { const m = mean(); return obs().reduce((a, x) => a + (x - m) ** 2, 0); };
  const sdBefore = () => Math.sqrt(squares() / (obs().length - 1));
  const sdAfter = () => Math.sqrt(squares() / (v.length - 1));
  const r1 = x => Math.round(x * 10) / 10, r2 = x => Math.round(x * 100) / 100;

  const chal = challenges(ch, [
    { text: 'Tap beds to make three gaps. Watch the spread after filling.',
      check: st => st.gaps >= 3,
      why: 'Each fill sits on the mean, at distance 0, so the more gaps you fill, the more the spread shrinks.' },
    { text: 'Press “New data” three times. Is the mean after filling always the mean of the real readings?',
      check: st => st.news >= 3,
      why: 'Always: every fill equals the mean, so adding it can never move the mean.' },
    { text: 'Make the spread after filling at least 2 degrees smaller than before filling.',
      check: st => st.gaps >= 1 && st.before - st.after >= 2,
      why: 'Real readings far from the mean plus many zero-distance fills make the spread look much smaller than it is.' },
    { text: 'Harder: keep at least one gap, but make filling NOT shrink the spread at all.',
      check: st => st.gaps >= 1 && st.before < 1e-9,
      why: 'Only possible when all real readings are equal (spread 0). Otherwise filling with the mean always hides some spread.' },
  ]);

  function toggle(i) {
    warn = '';
    if (v[i] === null) v[i] = keep[i] ?? Math.round(mean());
    else if (obs().length > 2) { keep[i] = v[i]; v[i] = null; }
    else warn = 'Keep at least two real readings: with fewer, there is no spread to measure.';
    draw();
  }
  function bump(d) {
    if (v[sel] === null) { warn = 'This bed is a gap. Bring the reading back to change it.'; draw(); return; }
    warn = ''; v[sel] = Math.max(10, Math.min(40, v[sel] + d)); keep[sel] = v[sel]; draw();
  }
  function newData() {
    keep = v.map(() => rnd(15, 35));
    v = keep.slice();
    const n = rnd(1, 3), idx = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, n);
    idx.forEach(i => { v[i] = null; });
    news++; warn = ''; draw();
  }

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = NARROW ? 40 : 56, X1 = VW - (NARROW ? 74 : 110), TOP = 34, BASE = 330, LO = 10, HI = 40;
  svg.setAttribute('viewBox', `0 0 ${VW} 480`);
  const y = t => BASE - (t - LO) / (HI - LO) * (BASE - TOP);
  const sl = (X1 - X0) / 6, cx = i => X0 + sl * (i + 0.5);
  const mono = 'Consolas, monospace';

  // drag a dot to change the reading; a tap without moving toggles the gap
  let dragging = -1, startY = 0, moved = false;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), i = Math.floor((p.x - X0) / sl);
    if (i < 0 || i >= 6 || p.y > BASE + 40) return;
    sel = i; dragging = i; startY = p.y; moved = false; svg.setPointerCapture(e.pointerId); draw();
  });
  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    if (Math.abs(p.y - startY) > 6) moved = true;
    if (moved && v[dragging] !== null) {
      v[dragging] = Math.max(LO, Math.min(HI, Math.round(LO + (BASE - p.y) / (BASE - TOP) * (HI - LO))));
      keep[dragging] = v[dragging]; warn = ''; draw();
    }
  });
  const release = () => { if (dragging >= 0 && !moved) toggle(dragging); dragging = -1; };
  svg.addEventListener('pointerup', release);
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function draw() {
    const m = mean(), ym = y(m), g = gapCount(), b = sdBefore(), a = sdAfter(), sq = squares(), n = obs().length;
    const k = [];
    // grid and axis
    for (let t = LO; t <= HI; t += 5) {
      k.push(s('line', { x1: X0, x2: X1, y1: y(t), y2: y(t), stroke: C.line }),
        s('text', { x: X0 - 8, y: y(t) + 4, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'end', 'font-family': mono }, t));
    }
    k.push(s('text', { x: X0 - 8, y: TOP - 14, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'end', 'font-family': mono }, '°C'));
    // mean line
    k.push(s('line', { x1: X0, x2: X1, y1: ym, y2: ym, stroke: C.amber, 'stroke-width': 3, 'stroke-dasharray': '9 7' }));
    const tw = VW - X1 - 8;
    k.push(s('text', { x: X1 + 4 + tw / 2, y: ym - 20 * F, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, 'MEAN'),
      s('rect', { x: X1 + 4, y: ym - 14 * F, width: tw, height: 26 * F, rx: 13 * F, fill: C.bg, stroke: C.amber }),
      s('text', { x: X1 + 4 + tw / 2, y: ym + 5 * F, fill: C.amber, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, fmt(r1(m))));
    // beds
    v.forEach((val, i) => {
      const x = cx(i);
      if (i === sel) k.push(s('rect', { x: x - sl / 2 + 3, y: TOP - 10, width: sl - 6, height: BASE - TOP + 46, fill: '#ffffff', 'fill-opacity': .04, rx: 8 }));
      k.push(s('rect', { x: x - sl * 0.35, y: BASE + 8, width: sl * 0.7, height: 8, fill: C.green, 'fill-opacity': .3, stroke: C.green, rx: 2 }),
        s('text', { x, y: BASE + 34, fill: C.muted, 'font-size': 14 * F, 'text-anchor': 'middle', 'font-family': mono }, NARROW ? String(i + 1) : `bed ${i + 1}`));
      if (val === null) {
        k.push(s('circle', { cx: x, cy: ym, r: 15, fill: 'none', stroke: C.muted, 'stroke-width': 2, 'stroke-dasharray': '4 4' }),
          s('circle', { cx: x, cy: ym, r: 8, fill: C.green }),
          s('text', { x, y: ym - 22, fill: C.green, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, fmt(r1(m))));
      } else {
        const yv = y(val), d = Math.abs(val - m);
        if (d > 0.05) {
          k.push(s('line', { x1: x, x2: x, y1: yv, y2: ym, stroke: C.violet, 'stroke-width': 3 }),
            s('text', { x: x - 8, y: (yv + ym) / 2 + 4, fill: C.violet, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': mono }, fmt(r1(d))));
        }
        const below = val < m;
        k.push(s('circle', { cx: x, cy: yv, r: 16, fill: C.cyan, 'fill-opacity': .18 }),
          s('circle', { cx: x, cy: yv, r: 8, fill: C.cyan }),
          s('text', { x, y: below ? yv + 32 : yv - 22, fill: C.cyan, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, val));
      }
    });
    // spread bars: before (real readings only) and after filling
    const BW = VW - X0 - 120 * F, scale = BW / Math.max(12, b, a);
    [[b, C.violet, 'spread before (real only)', 372], [a, C.green, 'spread after filling', 426]].forEach(([sd, col, label, yy]) => {
      k.push(s('text', { x: X0, y: yy, fill: col, 'font-size': 13 * F, 'text-anchor': 'start', 'font-family': mono }, label),
        s('rect', { x: X0, y: yy + 8, width: Math.max(2, sd * scale), height: 18, fill: col, 'fill-opacity': .6, stroke: col, rx: 3 }),
        s('text', { x: X0 + Math.max(2, sd * scale) + 8, y: yy + 22, fill: col, 'font-size': 14 * F, 'font-weight': 700, 'font-family': mono }, `≈ ${fmt(r1(sd))} °C`));
    });
    svg.replaceChildren(...k);

    const real = obs(), sum = real.reduce((p, q) => p + q, 0);
    fbox(box, [
      `real:  ${real.join(', ')}`,
      `mean = ${sum} ÷ ${n} = ${fmt(r2(m))}`,
      g ? [`fills: ${Array(g).fill(fmt(r2(m))).join(', ')} → mean of 6 = ${fmt(r2(m))}`, C.green] : ['no gaps: nothing filled', C.muted],
      `squares = ${fmt(r2(sq))}${g ? ' (fills add 0)' : ''}`,
      [`SD before = √(${fmt(r2(sq))} ÷ ${n - 1}) ≈ ${fmt(r1(b))}`, C.violet],
      [`SD after  = √(${fmt(r2(sq))} ÷ 5) ≈ ${fmt(r1(a))}`, C.green]]);
    note.textContent = warn
      || (g === 0 ? 'No gaps: nothing to fill, so both spreads are the same.'
        : b < 1e-9 ? 'All real readings are equal: the spread is 0 before and after, so filling hides nothing here.'
          : `${g} gap${g > 1 ? 's' : ''} filled with ${fmt(r1(m))}. The mean did not move, but the spread shrank from about ${fmt(r1(b))} to about ${fmt(r1(a))} °C.`);
    gapBtn.textContent = v[sel] === null ? 'Bring the reading back' : 'Make it a gap';
    selLabel.textContent = `Selected: bed ${sel + 1} (${v[sel] === null ? 'gap' : v[sel] + ' °C'})`;
    chal.update({ gaps: g, before: b, after: a, news });
  }
  draw();
  return () => {};
}
