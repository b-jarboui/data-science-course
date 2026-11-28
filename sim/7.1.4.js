// 7.1.4 Try it: one- and two-sided tests.
// The learner moves the batch (slider or drag on the hill), picks the question, and sees which tail
// counts and the p-value. A perfect machine can be inspected 1,000 times to count false alarms,
// including the trap of picking the side after looking.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, challenges } = kit;
  const MODES = { two: 'Two-sided: either way?', high: 'One-sided: too much?', low: 'One-sided: too little?', peek: 'Peek, then pick a side' };
  const CUTS = { two: [-1.96, 1.96], high: [1.645], low: [-1.645], peek: [-1.645, 1.645] };
  let mode = 'two', z = 2, anim = 0, hist = null;
  const runs = { two: 0, high: 0, low: 0, peek: 0 };

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const r2 = x => Math.round(x * 100) / 100;
  const slider = h('input', { type: 'range', min: 496, max: 504, step: 0.05, value: 502, 'aria-label': 'Batch mean in grams',
    style: { flex: '1 1 12rem' }, oninput: () => setZ(+slider.value - 500) });
  const sliderLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const modeBtns = Object.entries(MODES).map(([k, label]) => {
    const b = btn(label, () => { mode = k; hist = null; cancelAnimationFrame(anim); draw(); });
    b.dataset.mode = k; return b;
  });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: which tail counts?'),
    h('p', { class: 'sub' }, 'The hill shows where z lands for a perfect machine. Move the batch, pick the question, and watch which tail becomes the p-value.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, h('span', { class: 'sim-note', style: { margin: 0 } }, 'Batch mean'), slider, sliderLabel),
        h('div', { class: 'sim-row' }, ...modeBtns),
        h('div', { class: 'sim-row' },
          btn('Run 1,000 perfect-machine inspections', run, 'go'),
          btn('New batch (random)', () => setZ(Math.round(randn() * 20) / 20)),
          btn('Start again', () => { mode = 'two'; hist = null; cancelAnimationFrame(anim); setZ(2); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  // the normal curve: chance that z lands below x (accurate to about 1 in 10 million)
  function Phi(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x)), d = 0.3989423 * Math.exp(-x * x / 2);
    const q = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - q : q;
  }
  const pval = (m, v) => ({ two: 2 * Phi(-Math.abs(v)), high: Phi(-v), low: Phi(v), peek: Phi(-Math.abs(v)) })[m];
  const alarm = (m, v) => ({ two: Math.abs(v) > 1.96, high: v > 1.645, low: v < -1.645, peek: Math.abs(v) > 1.645 })[m];
  const randn = () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); };
  const fmtp = p => p < 0.001 ? '< 0.001' : p.toFixed(3);
  const fz = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2);

  const chal = challenges(ch, [
    { text: 'Move the batch so the inspector’s one-sided test finds evidence of overfilling, but the two-sided test does not.',
      check: st => st.z > 1.645 && st.z < 1.96,
      why: 'Right: the one-sided cut-off is only 1.64, so it catches a drift that the two-sided cut-off of 1.96 misses.' },
    { text: 'Set z to +2, then pick the question whose p-value is about 0.98.',
      check: st => st.mode === 'low' && st.z === 2,
      why: 'Yes: “too little?” counts everything below +2, almost the whole hill. A batch above the target is no evidence of underfilling.' },
    { text: 'Ask “too much?” and move z below −1. What happens to the p-value?',
      check: st => st.mode === 'high' && st.z <= -1,
      why: 'It climbs above 0.5: a batch below the target can never be evidence of overfilling.' },
    { text: 'Predict first: out of 1,000 inspections of a perfect machine, how many false alarms does the two-sided rule give? Run it, then run “Peek, then pick a side”.',
      check: st => st.runs.two >= 1000 && st.runs.peek >= 1000,
      why: 'About 50 with the honest rule, about 100 when the side is picked after looking: the false alarms double, while the report still says 5 in 100.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = 20, X1 = VW - 20, CB = 190, CH = 150, HB = 420, HH = 140, NB = 80;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);
  const zx = v => X0 + (v + 4) / 8 * (X1 - X0);
  const cyz = v => CB - CH * Math.exp(-v * v / 2);
  function areaPath(lo, hi) {
    lo = Math.max(lo, -4); hi = Math.min(hi, 4);
    if (hi <= lo) return '';
    let d = `M${zx(lo)},${CB}`;
    for (let i = 0; i <= 60; i++) { const v = lo + (hi - lo) * i / 60; d += ` L${zx(v)},${cyz(v)}`; }
    return d + ` L${zx(hi)},${CB} Z`;
  }
  const pRegion = () => ({ two: [[-4, -Math.abs(z)], [Math.abs(z), 4]], high: [[z, 4]], low: [[-4, z]], peek: z >= 0 ? [[z, 4]] : [[-4, z]] })[mode];
  const zones = () => ({ two: [[-4, -1.96], [1.96, 4]], high: [[1.645, 4]], low: [[-4, -1.645]], peek: [[-4, -1.645], [1.645, 4]] })[mode];

  function setZ(v) { z = r2(Math.max(-4, Math.min(4, Math.round(v * 20) / 20))); slider.value = 500 + z; draw(); }

  function run() {
    cancelAnimationFrame(anim);
    const m = mode;
    hist = { mode: m, n: 0, alarms: 0, binsN: new Array(NB).fill(0), binsA: new Array(NB).fill(0) };
    const step = () => {
      for (let i = 0; i < 25 && hist.n < 1000; i++) {
        const v = randn(), b = Math.max(0, Math.min(NB - 1, Math.floor((v + 4) * 10)));
        hist.n++;
        if (alarm(m, v)) { hist.alarms++; hist.binsA[b]++; } else hist.binsN[b]++;
      }
      if (hist.n >= 1000) runs[m] += 1000;
      draw();
      if (hist.n < 1000) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // drag on the hill: the pointer sets z
  let dragging = false;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const move = e => { if (dragging) setZ((toSvg(e).x - X0) / (X1 - X0) * 8 - 4); };
  svg.addEventListener('pointerdown', e => { if (toSvg(e).y > CB + 25) return; dragging = true; svg.setPointerCapture(e.pointerId); move(e); });
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = false; });

  function draw() {
    modeBtns.forEach(b => { b.className = 'sim-btn ' + (b.dataset.mode === mode ? 'go' : ''); });
    const p = pval(mode, z), sig = p < 0.05, k = [];
    const mono = { 'font-family': 'Consolas', 'text-anchor': 'middle' };
    k.push(s('path', { d: areaPath(-4, 4), fill: C.cyan, 'fill-opacity': .12 }));
    zones().forEach(([a, b]) => k.push(s('path', { d: areaPath(a, b), fill: C.amber, 'fill-opacity': .3 })));
    pRegion().forEach(([a, b]) => k.push(s('path', { d: areaPath(a, b), fill: C.violet, 'fill-opacity': .75 })));
    let d = '';
    for (let i = 0; i <= 160; i++) { const v = -4 + 8 * i / 160; d += (i ? ' L' : 'M') + `${zx(v)},${cyz(v)}`; }
    k.push(s('path', { d, fill: 'none', stroke: C.cyan, 'stroke-width': 2.5 }),
      s('line', { x1: X0, x2: X1, y1: CB, y2: CB, stroke: C.muted, 'stroke-width': 2 }),
      s('line', { x1: zx(0), x2: zx(0), y1: CB, y2: CB - CH - 6, stroke: C.amber, 'stroke-width': 3 }));
    for (let v = -4; v <= 4; v++) k.push(s('text', { x: zx(v), y: CB + 18, fill: C.muted, 'font-size': 13 * F, ...mono }, v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0'));
    CUTS[mode].forEach(c => {
      const y = CB - CH * 0.55;
      k.push(s('line', { x1: zx(c), x2: zx(c), y1: CB, y2: y, stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '6 5' }),
        s('text', { x: zx(c), y: y - 6, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, ...mono }, (c > 0 ? '+' : '−') + Math.abs(c === 1.645 || c === -1.645 ? 1.64 : c)));
    });
    const my = CB - CH * 0.8;
    k.push(s('line', { x1: zx(z), x2: zx(z), y1: CB, y2: my, stroke: C.green, 'stroke-width': 3 }),
      s('circle', { cx: zx(z), cy: cyz(z), r: 6, fill: C.green }),
      s('text', { x: Math.max(X0 + 50 * F, Math.min(X1 - 50 * F, zx(z))), y: my - 8, fill: C.green, 'font-size': 15 * F, 'font-weight': 700, ...mono }, `z = ${fz(z)}`),
      s('text', { x: X0 + 4, y: 22, fill: C.violet, 'font-size': 16 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `p ≈ ${fmtp(p)}`),
      s('text', { x: (X0 + X1) / 2, y: CB + 40, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle' }, 'amber: alarm zone (the 5% budget) · violet: the p-value area'));

    // histogram of z from a perfect machine
    k.push(s('line', { x1: X0, x2: X1, y1: HB, y2: HB, stroke: C.muted }));
    if (!hist) {
      k.push(s('text', { x: (X0 + X1) / 2, y: HB - HH / 2, fill: C.muted, 'font-size': 14 * F, 'text-anchor': 'middle' }, 'Run 1,000 inspections of a perfect machine'),
        s('text', { x: (X0 + X1) / 2, y: HB - HH / 2 + 20 * F, fill: C.muted, 'font-size': 14 * F, 'text-anchor': 'middle' }, 'to see where its false alarms land.'));
    } else {
      const bw = (X1 - X0) / NB, top = Math.max(45, ...hist.binsN.map((n, i) => n + hist.binsA[i])), u = HH / top;
      hist.binsN.forEach((n, i) => {
        const a = hist.binsA[i], x = X0 + i * bw;
        if (n) k.push(s('rect', { x: x + 0.5, y: HB - n * u, width: bw - 1, height: n * u, fill: C.cyan, 'fill-opacity': .7 }));
        if (a) k.push(s('rect', { x: x + 0.5, y: HB - (n + a) * u, width: bw - 1, height: a * u, fill: C.pink, 'fill-opacity': .9 }));
      });
      k.push(s('text', { x: X0 + 4, y: HB - HH - 8, fill: C.pink, 'font-size': 14 * F, 'font-weight': 700, 'font-family': 'Consolas' },
        `false alarms: ${hist.alarms} of ${hist.n}`));
    }
    svg.replaceChildren(...k);

    const q = { two: 'question: drifted up OR down?', high: 'question: filling too much?', low: 'question: filling too little?', peek: 'side picked AFTER seeing z' }[mode];
    const area = { two: 'p = both tails beyond ±z', high: 'p = area right of z', low: 'p = area left of z', peek: 'reported p = one tail only' }[mode];
    const yes = { two: 'evidence of drift', high: 'evidence of overfilling', low: 'evidence of underfilling', peek: 'looks like evidence' }[mode];
    const rule = { two: 'alarm if z < −1.96 or z > +1.96', high: 'alarm if z > +1.64', low: 'alarm if z < −1.64', peek: 'alarm if z beyond ±1.64 (either side!)' }[mode];
    const lines = [q, `z = (${(500 + z).toFixed(2)} − 500) ÷ 1 = ${fz(z)}`, `${area} = ${fmtp(p)}`,
      [`${fmtp(p)} ${sig ? '<' : '≥'} 0.05 → ${sig ? yes : 'no evidence'}`, sig ? C.green : C.muted], rule];
    if (mode === 'peek') lines.push([`honest two-sided p = ${fmtp(pval('two', z))}`, C.pink]);
    if (hist) lines.push([`perfect machine: ${hist.alarms} alarms in ${hist.n} = ${(100 * hist.alarms / Math.max(1, hist.n)).toFixed(1)}%`, C.amber]);
    fbox(box, lines);
    note.textContent = {
      two: 'Two-sided: the 5% budget is split, 2.5% in each tail. Both directions can raise an alarm.',
      high: 'One-sided “too much?”: all 5% sits in the right tail, so the cut-off moves in to 1.64. Low results never count.',
      low: 'One-sided “too little?”: all 5% sits in the left tail. High results never count.',
      peek: 'The trap: whichever side z lands on gets the whole 5%. A perfect machine then raises alarms on both sides, about 10 in 100.'
    }[mode];
    sliderLabel.textContent = `${(500 + z).toFixed(2)} g (z = ${fz(z)})`;
    chal.update({ mode, z, runs });
  }
  draw();
  return () => cancelAnimationFrame(anim);
}
