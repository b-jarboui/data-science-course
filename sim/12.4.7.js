// 12.4.7 Try it: the precision–recall curve.
// The learner slides the alert gate, taps pumps to change which ones fail, makes random pumps,
// and watches precision, recall and the curve update live, with challenges the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const BLUE = '#58A6FF', RED = '#F87171';
  const START_P = [90, 60, 60, 30, 30, 30, 10, 10, 10, 10, 10, 10];
  const START_F = START_P.map((_, i) => i === 1 || i === 3);
  let prob = START_P.slice(), fail = START_F.slice(), thr = 60, msg = '';

  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const slider = h('input', { type: 'range', min: 0, max: 100, step: 5, value: thr, 'aria-label': 'Alert threshold', style: { flex: '1 1 12rem' } });
  const thrLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  slider.addEventListener('input', () => setThr(+slider.value));
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: the precision–recall curve'),
    h('p', { class: 'sub' }, 'Each card is a pump with its predicted failure chance, sorted from highest to lowest. Slide the gate: every pump at or above it gets a bell. Tap a card to switch it between failed (red diamond) and did not fail (green circle).'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, slider, thrLabel),
        h('div', { class: 'sim-row' },
          btn('Lower the gate', () => setThr(nextDown()), 'go'),
          btn('Raise the gate', () => setThr(nextUp())),
          btn('New data (random)', newData),
          btn('Start again', () => { prob = START_P.slice(); fail = START_F.slice(); thr = 60; msg = ''; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  // counts for any gate position: alerts, caught failures, precision, recall
  const ev = t => {
    let n = 0, tp = 0;
    prob.forEach((p, i) => { if (p >= t) { n++; if (fail[i]) tp++; } });
    const F = fail.filter(Boolean).length;
    return { n, tp, F, prec: n ? tp / n : null, rec: tp / F };
  };
  const pc = x => fmt(Math.round(x * 1000) / 10) + '%';
  const eq = (a, b) => (a * 100) % b === 0 ? '=' : '≈';

  const chal = challenges(ch, [
    { text: 'Move the gate until you catch every failure, with as few bells as possible.',
      check: st => st.tp === st.F && st.n === st.minFull,
      why: 'Right: this is the highest gate that still catches every failure. Lowering it further only adds false alarms.' },
    { text: 'Find a gate position where there are bells, but precision is 0%.',
      check: st => st.n > 0 && st.tp === 0,
      why: 'Every bell went to a pump that did not fail, so none of the alerts are correct.' },
    { text: 'Raise the gate until no pump gets a bell. Can you still work out precision?',
      check: st => st.n === 0,
      why: 'No: with no alerts, precision would be 0 ÷ 0, which cannot be calculated, while recall is 0%.' },
    { text: 'Tap cards to change which pumps fail, until the random-alerts line sits at 25%.',
      check: st => st.F === 3,
      why: 'Three failures out of twelve pumps is 25%, so alerts chosen at random would be correct about 25% of the time.' },
  ]);

  function setThr(t) { thr = Math.max(0, Math.min(100, t)); msg = ''; draw(); }
  const nextDown = () => { const below = prob.filter(p => p < thr); return below.length ? Math.max(...below) : thr; };
  const nextUp = () => {
    const on = prob.filter(p => p >= thr); if (!on.length) return thr;
    const m = Math.min(...on), up = prob.filter(p => p > m); return up.length ? Math.min(...up) : 100;
  };
  function toggle(i) {
    if (fail[i] && fail.filter(Boolean).length === 1) { msg = 'Keep at least one failure, so recall can be worked out.'; draw(); return; }
    fail[i] = !fail[i]; msg = ''; draw();
  }
  function newData() {
    prob = prob.map(() => rnd(1, 19) * 5);
    fail = prob.map(p => Math.random() * 100 < p);
    if (!fail.some(Boolean)) fail[prob.indexOf(Math.max(...prob))] = true;
    if (fail.every(Boolean)) fail[prob.indexOf(Math.min(...prob))] = false;
    thr = 50; msg = ''; draw();
  }

  // geometry: cards on top (one row on a laptop, two rows on a phone), the curve below
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 650 : 470, PER = NARROW ? 6 : 12, F = NARROW ? 1 : 1.15;
  const CELL = (VW - 20) / PER, CWD = CELL - 6, CHT = NARROW ? 78 : 84;
  const rowY = r => 18 + r * (CHT + 14);
  const PX0 = NARROW ? 58 : 76, PX1 = VW - 24, PY0 = NARROW ? 570 : 400, PY1 = NARROW ? 250 : 160;
  const px = v => PX0 + v / 100 * (PX1 - PX0), py = v => PY0 - v / 100 * (PY0 - PY1);
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const mono = { 'font-family': 'Consolas, monospace' };

  const mark = (x, y, failed) => failed
    ? s('polygon', { points: `${x},${y - 8} ${x + 8},${y} ${x},${y + 8} ${x - 8},${y}`, fill: RED })
    : s('circle', { cx: x, cy: y, r: 7, fill: 'none', stroke: C.green, 'stroke-width': 2.5 });
  const bell = (x, y) => s('g', {},
    s('path', { d: `M ${x - 6} ${y + 4} Q ${x - 6} ${y - 7} ${x} ${y - 7} Q ${x + 6} ${y - 7} ${x + 6} ${y + 4} Z`, fill: C.amber }),
    s('circle', { cx: x, cy: y + 6.5, r: 2, fill: C.amber }));

  function draw() {
    const e = ev(thr), out = [];
    const order = prob.map((_, i) => i).sort((a, b) => prob[b] - prob[a] || a - b);

    // cards
    order.forEach((i, k) => {
      const r = Math.floor(k / PER), x = 10 + (k % PER) * CELL + 3, y = rowY(r), on = prob[i] >= thr;
      const g = s('g', { style: 'cursor:pointer' },
        s('rect', { x, y, width: CWD, height: CHT, rx: 7, fill: C.card, stroke: on ? C.amber : '#344264', 'stroke-width': on ? 3 : 1.5 }),
        s('text', { x: x + 6, y: y + 15, fill: C.muted, 'font-size': 11 * F, ...mono }, 'P' + (i + 1)),
        s('text', { x: x + CWD / 2, y: y + 44, fill: BLUE, 'font-size': 16 * F, 'font-weight': 700, 'text-anchor': 'middle', ...mono }, prob[i] + '%'),
        mark(x + CWD / 2, y + CHT - 16, fail[i]),
        on ? bell(x + CWD - 10, y + 13) : null);
      g.addEventListener('click', () => toggle(i));
      out.push(g);
    });

    // the gate sits right after the last card with a bell
    const gk = e.n, gr = gk === 0 ? 0 : Math.floor((gk - 1) / PER), gxp = gk === 0 ? 10 : 10 + ((gk - 1) % PER + 1) * CELL;
    out.push(s('line', { x1: gxp, x2: gxp, y1: rowY(gr) - 7, y2: rowY(gr) + CHT + 7, stroke: C.amber, 'stroke-width': 4, 'stroke-linecap': 'round' }));

    // the curve: grid, axes, reference line, dots for every gate position, the current position
    for (let v = 0; v <= 100; v += 25) {
      out.push(s('line', { x1: PX0, x2: PX1, y1: py(v), y2: py(v), stroke: C.line }),
        s('line', { x1: px(v), x2: px(v), y1: PY0, y2: PY1, stroke: C.line }),
        s('text', { x: PX0 - 8, y: py(v) + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', ...mono }, v + '%'),
        s('text', { x: px(v), y: PY0 + 20, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', ...mono }, v + '%'));
    }
    out.push(s('text', { x: PX0 - 6, y: PY1 - 14, fill: C.amber, 'font-size': 14 * F }, '↑ precision: alerts correct'),
      s('text', { x: (PX0 + PX1) / 2, y: PY0 + 46, fill: RED, 'font-size': 14 * F, 'text-anchor': 'middle' }, 'recall: failures caught →'));
    const base = e.F / 12;
    out.push(s('line', { x1: PX0, x2: PX1, y1: py(base * 100), y2: py(base * 100), stroke: C.violet, 'stroke-width': 2, 'stroke-dasharray': '8 6' }),
      s('text', { x: PX1 - 4, y: py(base * 100) + 16, fill: C.violet, 'font-size': 12 * F, 'text-anchor': 'end', ...mono }, 'random alerts ≈ ' + pc(base)));
    out.push(s('circle', { cx: px(100), cy: py(100), r: 9, fill: 'none', stroke: C.green, 'stroke-width': 2.5 }),
      s('text', { x: px(100) - 14, y: py(100) + 5, fill: C.green, 'font-size': 13 * F, 'text-anchor': 'end' }, 'ideal'));
    const pts = [...new Set(prob)].sort((a, b) => b - a).map(t => ev(t)).map(r => [px(r.rec * 100), py(r.prec * 100)]);
    out.push(s('polyline', { points: pts.map(p => p.join(',')).join(' '), fill: 'none', stroke: C.cyan, 'stroke-width': 3 }));
    pts.forEach(([x, y]) => out.push(s('circle', { cx: x, cy: y, r: 9, fill: C.cyan, 'fill-opacity': 0.2 }), s('circle', { cx: x, cy: y, r: 4.5, fill: C.cyan })));
    if (e.n) {
      const cx = px(e.rec * 100), cy = py(e.prec * 100);
      out.push(s('line', { x1: cx, x2: cx, y1: PY0, y2: cy, stroke: RED, 'stroke-dasharray': '5 5', 'stroke-width': 1.5 }),
        s('line', { x1: PX0, x2: cx, y1: cy, y2: cy, stroke: C.amber, 'stroke-dasharray': '5 5', 'stroke-width': 1.5 }),
        s('circle', { cx, cy, r: 12, fill: 'none', stroke: C.amber, 'stroke-width': 3 }));
    } else {
      out.push(s('text', { x: PX0 + 10, y: py(50), fill: C.amber, 'font-size': 14 * F, ...mono }, 'no bells: precision = ?'));
    }
    svg.replaceChildren(...out);

    fbox(box, [
      `gate: bell if chance ≥ ${thr}%`,
      `alerts = ${e.n}   caught = ${e.tp} of ${e.F}`,
      e.n ? [`precision = ${e.tp}/${e.n} ${eq(e.tp, e.n)} ${pc(e.tp / e.n)}`, C.amber] : ['precision = 0/0 → cannot be calculated', C.amber],
      [`recall    = ${e.tp}/${e.F} ${eq(e.tp, e.F)} ${pc(e.rec)}`, RED],
      [`random alerts = ${e.F}/12 ${eq(e.F, 12)} ${pc(base)}`, C.violet]]);
    note.textContent = msg || (e.n === 0 ? 'No bells at all: there is nothing to check, so precision cannot be calculated.'
      : e.tp === e.F ? `Every failure is caught, but ${e.n - e.tp} of the ${e.n} alerts are false alarms.`
      : 'The amber ring shows where this gate sits on the curve. Lower the gate to catch more failures, and watch precision.');
    slider.value = thr;
    thrLabel.textContent = `Gate at ${thr}%: ${e.n} bell${e.n === 1 ? '' : 's'}`;
    const minFail = Math.min(...prob.filter((_, i) => fail[i]));
    chal.update({ n: e.n, tp: e.tp, F: e.F, minFull: prob.filter(p => p >= minFail).length });
  }
  draw();
  return () => {};
}
