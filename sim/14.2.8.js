// 14.2.8 Try it: the anomaly threshold.
// The learner drags the threshold gate (or uses the slider), sets how many checks fit in the shift,
// predicts, makes fresh scores, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = [{ id: 'G', s: 0.413 }, { id: 'H', s: 0.643 }, { id: 'I', s: 0.729 }];
  let data = START.map(d => ({ ...d })), thr = 0.8, cap = 2, orig = true, fresh = false, capMoved = false, pred = null;

  const svg = s('svg', { viewBox: '0 0 700 300' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const thrLabel = h('span', { class: 'sim-note', style: { margin: 0, minWidth: '9rem' } });
  const capLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const slider = h('input', { type: 'range', min: 0, max: 1, step: 0.01, value: thr, style: { flex: '1 1 12rem' },
    oninput: e => { thr = +e.target.value; draw(); } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: where do you put the threshold?'),
    h('p', { class: 'sub' }, 'Each purple diamond is a new reading at its anomaly score. Drag on the picture or use the slider to move the threshold. Every reading at or above it is flagged for a check.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, thrLabel, slider),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('− 1 check', () => setCap(-1)), btn('+ 1 check', () => setCap(1)), capLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Predict: how many flags at 0.4?'),
          ...[1, 2, 3].map(n => btn(String(n), () => { pred = n; draw(); }))),
        h('div', { class: 'sim-row' },
          btn('New data (random)', newData, 'go'),
          btn('Start again', reset))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const flagged = t => data.filter(d => d.s >= t).sort((a, b) => b.s - a.s);
  const chal = challenges(ch, [
    { text: 'Move the threshold so that it flags exactly one reading.',
      check: st => st.n === 1, why: 'Yes! Only the highest score is at or above the threshold, so only one reading is flagged.' },
    { text: 'Flag the two highest-scoring readings without going over your time for checks.',
      check: st => st.n === 2 && st.n <= st.cap,
      why: 'Right: any threshold above the third score and at or below the second score flags exactly the top two.' },
    { text: 'Start again. Predict how many readings a threshold of 0.4 flags, pick a number, then move the threshold to 0.4.',
      check: st => st.pred != null && st.orig && Math.abs(st.thr - 0.4) < 0.005,
      why: 'All three scores, even G at 0.413, are at or above 0.4, so three readings are flagged: one more than you have time for.' },
    { text: 'Press “New data”, change your time for checks, then find a threshold that flags exactly as many readings as you can check.',
      check: st => st.fresh && st.capMoved && st.n === st.cap,
      why: 'The right threshold depends on the scores and on your time, so it changes when the data or the time changes.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = 30, X1 = VW - 30, AY = 125, SY = 245;
  svg.setAttribute('viewBox', `0 0 ${VW} 300`);
  const sx = v => X0 + v * (X1 - X0);

  function setCap(d) { cap = Math.max(1, Math.min(5, cap + d)); capMoved = true; draw(); }
  function newData() {
    const n = rnd(3, 6);
    data = Array.from({ length: n }, (_, i) => ({ id: 'GHIJKL'[i], s: rnd(250, 900) / 1000 }));
    orig = false; fresh = true; capMoved = false; draw();
  }
  function reset() { data = START.map(d => ({ ...d })); thr = 0.8; cap = 2; orig = true; fresh = false; capMoved = false; pred = null; draw(); }

  // drag anywhere on the picture: the pointer's left-right position sets the threshold
  let dragging = false;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const setFrom = e => { const p = toSvg(e); thr = Math.max(0, Math.min(1, Math.round((p.x - X0) / (X1 - X0) * 100) / 100)); draw(); };
  svg.addEventListener('pointerdown', e => { dragging = true; svg.setPointerCapture(e.pointerId); setFrom(e); });
  svg.addEventListener('pointermove', e => { if (dragging) setFrom(e); });
  svg.addEventListener('pointerup', () => { dragging = false; });

  function draw() {
    const f = flagged(thr), n = f.length, t = thr.toFixed(2), ids = new Set(f.map(d => d.id));
    const mono = { 'font-family': 'Consolas', 'text-anchor': 'middle' };
    const k = [];
    // score line 0 to 1
    k.push(s('line', { x1: X0, x2: X1, y1: AY, y2: AY, stroke: C.muted, 'stroke-width': 3 }));
    for (let i = 0; i <= 10; i++) {
      const x = sx(i / 10);
      k.push(s('line', { x1: x, x2: x, y1: AY - 5, y2: AY + 5, stroke: C.muted, 'stroke-width': 2 }));
      if (i % 5 === 0) k.push(s('text', { x, y: AY + 26, fill: C.muted, 'font-size': 13 * F, ...mono }, String(i / 10)));
    }
    // the gate: amber post and amber zone to the right
    const gx = sx(thr), lx = Math.max(X0 + 60 * F, Math.min(X1 - 60 * F, gx));
    k.push(s('line', { x1: gx, x2: X1, y1: AY + 12, y2: AY + 12, stroke: C.amber, 'stroke-width': 4, 'stroke-opacity': 0.85 }),
      s('line', { x1: gx, x2: gx, y1: AY + 12, y2: AY + 44, stroke: C.amber, 'stroke-width': 5 }),
      s('text', { x: lx, y: AY + 64, fill: C.amber, 'font-size': 15 * F, 'font-weight': 700, ...mono }, `threshold ${t}`));
    // readings: purple diamonds, labels on two levels so close scores stay readable
    data.slice().sort((a, b) => a.s - b.s).forEach((d, i) => {
      const x = sx(d.s), lvl = i % 2, r = 9;
      k.push(s('circle', { cx: x, cy: AY, r: 14, fill: C.violet, 'fill-opacity': 0.15 }),
        s('polygon', { points: `${x},${AY - r} ${x + r},${AY} ${x},${AY + r} ${x - r},${AY}`, fill: C.violet, 'fill-opacity': 0.85, stroke: C.violet }),
        s('text', { x, y: AY - 44 - lvl * 36, fill: C.violet, 'font-size': 15 * F, 'font-weight': 700, ...mono }, d.id),
        s('text', { x, y: AY - 26 - lvl * 36, fill: C.violet, 'font-size': 13 * F, ...mono }, d.s.toFixed(3)));
      if (ids.has(d.id)) k.push(s('circle', { cx: x, cy: AY, r: 18, fill: 'none', stroke: C.amber, 'stroke-width': 2.5 }));
    });
    // check slots: flagged readings fill them from the highest score; extra ones get no time
    const total = Math.max(cap, n), w = Math.min(110, (X1 - X0) / total - 10), x0 = (VW - (total * (w + 10) - 10)) / 2;
    k.push(s('text', { x: VW / 2, y: SY - 34, fill: C.muted, 'font-size': 14 * F, 'text-anchor': 'middle' }, `Time for ${cap} check${cap > 1 ? 's' : ''} this shift`));
    for (let j = 0; j < total; j++) {
      const x = x0 + j * (w + 10), d = f[j], inTime = j < cap;
      k.push(s('rect', { x, y: SY - 18, width: w, height: 36, rx: 8, fill: C.card, stroke: inTime ? (d ? C.amber : C.cyan) : C.amber,
        'stroke-width': 2, 'stroke-dasharray': inTime ? null : '6 4' }),
        s('text', { x: x + w / 2, y: SY + 6, fill: d ? C.amber : C.muted, 'font-size': (d ? 16 : 13) * F, 'font-weight': d ? 700 : 400, ...mono }, d ? d.id : 'free'));
      if (d) k.push(s('text', { x: x + w / 2, y: SY + 36, fill: inTime ? C.amber : C.pink, 'font-size': 12 * F, ...mono }, inTime ? d.s.toFixed(3) : 'no time'));
    }
    svg.replaceChildren(...k);

    // formula box: the rule applied to every reading, then the workload
    const rows = data.slice().sort((a, b) => b.s - a.s).map(d => d.s >= thr
      ? [`${d.id}  ${d.s.toFixed(3)} ≥ ${t}  flag`, C.amber] : [`${d.id}  ${d.s.toFixed(3)} < ${t}`, C.muted]);
    const verdict = n > cap ? [`${n - cap} more than you have time for`, C.amber]
      : n === cap ? ['fits your time exactly', C.green] : [`${cap - n} check${cap - n > 1 ? 's' : ''} to spare`, C.cyan];
    fbox(box, [`flag if score ≥ ${t}`, ...rows, `flagged  = ${n}`, `time for = ${cap}`, verdict]);
    const at04 = flagged(0.4).length;
    note.textContent = 'A flag means “worth a look”, not “proven fault”. A reading below the threshold could still hide a problem.'
      + (pred == null ? '' : ` Your prediction for 0.4: ${pred}.` + (Math.abs(thr - 0.4) < 0.005
        ? (pred === at04 ? ' Right!' : ` Not quite: it flags ${at04}.`) : ' Now move the threshold to 0.4 and see.'));
    thrLabel.textContent = `Threshold: ${t}`;
    capLabel.textContent = `Time for ${cap} check${cap > 1 ? 's' : ''}`;
    if (+slider.value !== thr) slider.value = thr;
    chal.update({ n, cap, thr, orig, fresh, capMoved, pred });
  }
  draw();
  return () => {};
}
