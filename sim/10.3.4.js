// 10.3.4 Try it: Poisson regression learns its slope, step by step.
// The learner drags the clinic group averages (or simulates fresh random Poisson patient counts),
// sets the learning rate and first guess, then steps or plays learning and watches the gap curve drop.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, fmt, challenges } = kit;
  const RED = '#f87171';
  const CLINIC = [
    [0, 0, 0, 0, 1, 1, 1, 2, 2, 3],
    [0, 0, 0, 1, 1, 2, 3, 3, 4, 6],
    [1, 2, 2, 3, 3, 4, 5, 6, 6, 8],
  ];
  let groups = CLINIC.map(g => g.slice());
  let random = false, lr = 0.03, w0 = 0, speed = 3;
  let w = 0, iter = 0, hist = [], info = null, rose = false, playing = false, anim = 0, last = 0, dragging = -1;

  const mean = r => groups[r].reduce((a, b) => a + b, 0) / groups[r].length;
  const intercept = () => Math.log(Math.max(0.2, mean(0)));
  const expect = (r, ww = w) => Math.exp(intercept() + ww * r);
  const gapAt = (ww = w) => Math.abs(mean(1) - expect(1, ww)) + Math.abs(mean(2) - expect(2, ww));
  const r1 = x => fmt(Math.round(x * 10) / 10);
  const r2 = x => fmt(Math.round(x * 100) / 100);
  const r3 = x => fmt(Math.round(x * 1000) / 1000);
  const num = v => String(Math.round(v * 1000) / 1000);
  const settled = () => !!info && Math.abs(info.push) < 0.001;

  // Knuth Poisson sampler for fresh random patient visit counts
  function samplePoisson(lambda) {
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > L && k < 25);
    return k - 1;
  }
  function makeRandomData() {
    const base = 0.7 + Math.random() * 0.8;
    const mult = 1.35 + Math.random() * 0.95;
    const next = [0, 1, 2].map(r => {
      const lam = Math.min(6.5, base * Math.pow(mult, r));
      return Array.from({ length: 10 }, () => samplePoisson(lam));
    });
    if (next[0].reduce((a, b) => a + b, 0) < 4) next[0][0] = 4;
    return next;
  }
  // Adjust 10 integer patient counts smoothly so their average matches a dragged target
  function setGroupMean(r, targetMean) {
    const targetSum = Math.max(r === 0 ? 4 : 2, Math.min(75, Math.round(targetMean * 10)));
    const arr = groups[r];
    let cur = arr.reduce((a, b) => a + b, 0);
    let guard = 0;
    while (cur < targetSum && guard++ < 200) {
      const i = arr.indexOf(Math.min(...arr));
      arr[i]++; cur++;
    }
    while (cur > targetSum && guard++ < 200) {
      const i = arr.indexOf(Math.max(...arr));
      if (arr[i] <= 0) break;
      arr[i]--; cur--;
    }
  }

  const svg = s('svg', { viewBox: '0 0 700 500' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const playBtn = btn('▶ Play', () => playing ? pause() : run());
  const slider = (label, min, max, step, value, show, set) => {
    const out = h('b', { style: { minWidth: '3.2em' } }, show(value));
    const input = h('input', {
      type: 'range', min, max, step, value, style: { flex: '1 1 8rem' },
      oninput: e => { const v = +e.target.value; out.textContent = show(v); set(v); }
    });
    return h('label', { class: 'sim-note', style: { display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap', margin: '.5rem 0 0' } }, label, input, out);
  };

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: watch Poisson regression learn'),
    h('p', { class: 'sub' }, 'The faint dots are the thirty patients; the big teal dots are the group averages (0, 1, 2 conditions). Drag a group average up or down, or make new random data. The intercept matches the 0-condition group; the model learns the slope step by step.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Step', step, 'go'), playBtn, btn('Reset', reset),
          btn('New data (random)', () => { groups = makeRandomData(); random = true; reset(); }),
          btn('Clinic records', () => { groups = CLINIC.map(g => g.slice()); random = false; reset(); })),
        slider('Learning rate', 0.005, 0.25, 0.005, lr, num, v => { lr = v; draw(); }),
        slider('First guess for the slope', -1, 1.5, 0.05, w0, num, v => { w0 = v; reset(); }),
        slider('Speed (steps per second)', 1, 12, 1, speed, num, v => { speed = v; })),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Predict, then press Step once: from a first guess of 0, does the slope move up or down?',
      check: st => st.iter >= 1,
      why: 'Up! The real visit averages (2 and 4) are higher than 1, so the gap pushes the slope up from 0.'
    },
    {
      text: 'With the clinic records, bring the gap under 0.2 in 4 steps or fewer. Try a bigger learning rate, then Reset.',
      check: st => !st.random && st.iter >= 1 && st.iter <= 4 && st.gap < 0.2,
      why: 'Yes! A bigger learning rate makes larger updates, so the slope reaches 0.69 (doubling) in fewer steps.'
    },
    {
      text: 'Break it on purpose: find a learning rate where a step jumps too far and the gap goes UP.',
      check: st => st.rose,
      why: 'Too big a learning rate overshoots the best slope, so the exponential curve shoots past the data and the gap grows.'
    },
    {
      text: 'Press “New data (random)”, then Play until it settles. Does the gap always reach 0?',
      check: st => st.random && st.settled,
      why: 'Not usually. Random counts wobble around the growth curve, so the model finds the closest fit and stops.'
    },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, F = NARROW ? 1.25 : 1, VH = 500;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X0 = NARROW ? 52 : 72, X1 = VW - (NARROW ? 88 : 138), TOP = 30, BOT = 258;
  const X = r => X0 + 34 + r * (X1 - X0 - 68) / 2;
  const YMAX = () => Math.max(8, Math.ceil(Math.max(...groups.flat(), mean(0), mean(1), mean(2)) + 0.5));
  const Y = (v, ym) => BOT - (v / ym) * (BOT - TOP);
  const LT = 342, LB = 468, LL = X0, LR = VW - 14;
  const tx = (x, y, str, fill, size, anchor = 'middle', weight = 400) =>
    s('text', { x, y, fill, 'font-size': size * F, 'text-anchor': anchor, 'font-family': 'Consolas, monospace', 'font-weight': weight }, str);

  function step() {
    const old = w, e1 = expect(1), e2 = expect(2);
    const s1 = mean(1) - e1, s2 = mean(2) - e2;
    const before = gapAt();
    const push = lr * (s1 + 2 * s2);
    w = Math.max(-2.5, Math.min(2.2, old + push));
    iter++;
    const g = gapAt();
    if (g > before + 1e-6) rose = true;
    hist.push(g);
    info = { old, e1, e2, s1, s2, push };
    draw();
  }
  function reset() { pause(); w = w0; iter = 0; hist = [gapAt()]; info = null; rose = false; draw(); }
  function run() { if (playing) return; playing = true; playBtn.textContent = '❚❚ Pause'; last = 0; anim = requestAnimationFrame(loop); }
  function pause() { playing = false; cancelAnimationFrame(anim); playBtn.textContent = '▶ Play'; }
  function loop(now) {
    if (!playing) return;
    if (now - last >= 1000 / speed) {
      last = now;
      step();
      if (settled() || iter >= 300) { pause(); return; }
    }
    anim = requestAnimationFrame(loop);
  }

  // drag a group average dot up or down
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y > BOT + 20) return;
    let best = -1, bd = 55;
    [0, 1, 2].forEach(r => { const d = Math.abs(p.x - X(r)); if (d < bd) { bd = d; best = r; } });
    if (best < 0) return;
    dragging = best; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e), ym = YMAX();
    const val = (BOT - p.y) / (BOT - TOP) * ym;
    setGroupMean(dragging, val);
    random = false;
    reset();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; draw(); });

  function draw() {
    const k = [], b = intercept(), ym = YMAX();
    // top panel: patient dots, group averages, exponential curve, gaps
    const gStep = ym > 10 ? 2 : 1;
    for (let v = 0; v <= ym; v += gStep) {
      const y = Y(v, ym);
      k.push(s('line', { x1: X0, x2: X1 + 18, y1: y, y2: y, stroke: v === 0 ? C.green : C.line, 'stroke-width': v === 0 ? 2 : 1 }),
        tx(X0 - 8, y + 4, String(v), v === 0 ? C.green : C.muted, 11.5, 'end'));
    }
    [0, 1, 2].forEach(r => k.push(tx(X(r), BOT + 22, String(r), C.muted, 13)));
    k.push(tx((X0 + X1) / 2, BOT + 44, 'chronic conditions', C.muted, 12.5),
      tx(X0 - 8, TOP - 10, 'visits', C.muted, 11.5, 'end'));

    // individual patient dots at integer counts
    [0, 1, 2].forEach(r => {
      const cnt = {}, seen = {};
      groups[r].forEach(v => { cnt[v] = (cnt[v] || 0) + 1; });
      groups[r].forEach(v => {
        const idx = seen[v] || 0; seen[v] = idx + 1;
        const dx = (idx - (cnt[v] - 1) / 2) * (NARROW ? 7 : 9);
        k.push(s('circle', { cx: X(r) + dx, cy: Y(v, ym), r: NARROW ? 3 : 3.5, fill: C.cyan, 'fill-opacity': 0.35 }));
      });
    });

    // exponential curve y = e^(b + w * r), clipped smoothly above TOP - 8
    const pts = [];
    for (let i = 0; i <= 50; i++) {
      const r = -0.18 + i * (2.36 / 50);
      const val = Math.exp(b + w * r);
      const cy = Math.max(TOP - 8, Y(val, ym));
      pts.push(`${X(r)},${cy}`);
    }
    k.push(s('polyline', { points: pts.join(' '), fill: 'none', stroke: C.amber, 'stroke-width': 3 }));

    [0, 1, 2].forEach(r => {
      const m = mean(r), e = expect(r), x = X(r);
      const ymDot = Y(m, ym), yeDot = Math.max(TOP - 6, Y(e, ym));
      const up = ymDot <= yeDot;
      k.push(
        s('line', { x1: x, x2: x, y1: ymDot, y2: yeDot, stroke: RED, 'stroke-width': 4, 'stroke-linecap': 'round' }),
        s('circle', { cx: x, cy: yeDot, r: 7, fill: C.bg, stroke: C.amber, 'stroke-width': 2.5 }),
        s('circle', { cx: x, cy: ymDot, r: 9, fill: C.cyan, stroke: dragging === r ? C.ink : 'none', 'stroke-width': 2, style: 'cursor: ns-resize' }),
        tx(x + 13, ymDot + (up ? -5 : 14), `avg ${r1(m)}`, C.cyan, 11.5, 'start', 700),
        tx(x + 13, yeDot + (up ? 15 : -5), `exp ${r1(e)}`, C.amber, 11.5, 'start'));
    });

    // bottom panel: gap-versus-step curve
    const xmax = Math.max(10, hist.length - 1);
    const ymaxG = Math.max(1, ...hist.map(g => Math.min(g, 25)));
    const GXp = i => LL + i / xmax * (LR - LL);
    const GYp = g => LB - Math.min(g, ymaxG) / ymaxG * (LB - LT - 10);
    const mult = Math.exp(w);
    k.push(
      tx(LR, LT - 26, `step ${iter}  slope ${r2(w)} (×${r2(mult)})  gap ${r2(gapAt())}`, C.ink, NARROW ? 10 : 12.5, 'end', 700),
      tx(LL, LT - 8, 'gap after each step', RED, 12, 'start', 700),
      s('line', { x1: LL, x2: LR, y1: LB, y2: LB, stroke: C.muted }),
      s('line', { x1: LL, x2: LL, y1: LT, y2: LB, stroke: C.muted }),
      tx(LL - 6, LT + 10, r1(ymaxG), C.muted, 11, 'end'),
      tx(LL - 6, LB + 4, '0', C.muted, 11, 'end'),
      tx(LL, LB + 20, 'step 0', C.muted, 11, 'start'),
      tx(LR, LB + 20, `step ${xmax}`, C.muted, 11, 'end'),
      s('polyline', { points: hist.map((g, i) => `${GXp(i)},${GYp(g)}`).join(' '), fill: 'none', stroke: RED, 'stroke-width': 2.5 }));
    if (hist.length <= 60) hist.forEach((g, i) => k.push(s('circle', { cx: GXp(i), cy: GYp(g), r: 3.5, fill: RED })));
    svg.replaceChildren(...k);

    const lines = [
      `score = ${r2(b)} + ${r2(w)} × conditions`,
      [`expected = e^score   (×${r2(mult)} per cond)`, C.cyan],
    ];
    if (info) {
      const sh = v => v >= 0 ? `+${r2(v)} short` : `${r2(v)} over`;
      lines.push(
        `old slope = ${r3(info.old)}`,
        `1 cond: exp ${r2(info.e1)}, avg ${r1(mean(1))} → ${sh(info.s1)}`,
        `2 cond: exp ${r2(info.e2)}, avg ${r1(mean(2))} → ${sh(info.s2)}`,
        `change = ${num(lr)} × (${r2(info.s1)} + 2×${r2(info.s2)}) = ${r3(info.push)}`,
        [`new slope = ${r3(w)}   gap = ${r2(gapAt())}`, C.amber]);
    } else {
      lines.push(`slope = ${r2(w)} (first guess)`, [`gap = ${r2(gapAt())}: press Step`, C.amber]);
    }
    fbox(box, lines);

    note.textContent = settled()
      ? `Settled after ${iter} steps: slope stays at ${r2(w)}, so each condition multiplies expected visits by ${r2(mult)}.`
      : rose
        ? 'The gap went UP: the learning rate was too big and jumped past the best slope. Try a smaller learning rate.'
        : 'Each step compares expected visits (e^score) with the group averages. Short pushes the slope up; the 2-condition gap counts twice because those patients have 2 conditions.';
    chal.update({ iter, gap: gapAt(), rose, random, settled: settled() });
  }
  reset();
  return () => pause();
}
