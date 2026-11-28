// 7.4.6 Try it: the Benjamini–Hochberg staircase.
// Sorted luck-score bars, each rank with its own rising cutoff. The learner drags bars, changes the target rate,
// steps through the ranks from the highest down, and repeats the whole check many times to watch the false-alarm share.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [['thickness', 0.4], ['weight', 1.1], ['width', 2], ['colour', 3], ['salt', 40]];
  const MORE = ['cracks', 'shape', 'smell'];
  let data = [], q = 5, walk = -1, playing = false, timer = 0, anim = 0, real = 0, runs = [], todo = 0, speed = 5;
  const restart = () => { data = START.map(([name, p]) => ({ name, p })); q = 5; };
  restart();

  const svg = s('svg', { viewBox: '0 0 700 360' }), curve = s('svg', { viewBox: '0 0 700 200' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div'), runNote = h('div', { class: 'sim-note' });
  const label = () => h('span', { class: 'sim-note', style: { margin: 0 } });
  const counter = label(), qLabel = label(), speedLabel = label(), realLabel = label();
  const slider = (min, max, step, value, on) => h('input', { type: 'range', min, max, step, value, oninput: e => on(+e.target.value) });
  const qSlider = slider(1, 10, 0.5, q, v => { q = v; runs = []; changed(); });
  const realSlider = slider(0, 4, 1, 0, v => { real = v; runs = []; changed(); });
  const speedSlider = slider(1, 10, 1, speed, v => { speed = v; draw(); });
  const playBtn = btn('▶ Play', () => togglePlay());

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: the rising staircase'),
    h('p', { class: 'sub' }, 'Each bar is one feature’s luck score (p-value), sorted from shortest to tallest. Each rank gets its own cutoff: (rank ÷ tests) × target rate. Drag a bar up or down, change the target rate, or step through the ranks.'),
    h('div', { class: 'sim-grid' },
      h('div', {},
        h('div', { class: 'sim-card' }, svg,
          h('div', { class: 'sim-row' }, label().appendChild(document.createTextNode('Target rate')).parentNode, qSlider, qLabel),
          h('div', { class: 'sim-row' }, btn('Step', () => { stop(); step(); }, 'go'), playBtn, btn('Reset', () => { stop(); walk = -1; draw(); }), counter),
          h('div', { class: 'sim-row' }, label().appendChild(document.createTextNode('Speed')).parentNode, speedSlider, speedLabel),
          h('div', { class: 'sim-row' },
            btn('New data (random)', () => { data.forEach(d => { d.p = Math.random() < 0.5 ? r1(100 * Math.random() ** 6) : r1(100 * Math.random()); }); changed(); }),
            btn('Add a test', () => { if (data.length < 8) { data.push({ name: MORE[data.length - 5], p: r1(rnd(1, 100) / 10) }); runs = []; changed(); } }),
            btn('Remove a test', () => { if (data.length > 3) { data.pop(); runs = []; changed(); } }),
            btn('Start again', () => { stop(); restart(); qSlider.value = q; runs = []; changed(); }))),
        h('div', { class: 'sim-card' },
          h('div', { class: 'sim-ch-text' }, 'Repeat the whole check many times'),
          h('div', { class: 'sim-note' }, 'Each check makes fresh luck scores for every feature. Features with no real difference get pure-luck scores, so any flag on them is a false alarm.'),
          curve,
          h('div', { class: 'sim-row' }, label().appendChild(document.createTextNode('Real differences')).parentNode, realSlider, realLabel),
          h('div', { class: 'sim-row' }, btn('Run 100 checks', () => runMany(100), 'go'), btn('Clear', () => { todo = 0; runs = []; draw(); })),
          runNote)),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const r1 = x => Math.max(0.1, Math.round(x * 10) / 10);
  const r2 = x => Math.round(x * 100) / 100;
  const sorted = () => data.slice().sort((a, b) => a.p - b.p);
  const cut = r => r / data.length * q;                   // cutoff for rank r (1..n), in percent
  const passes = (p, r) => p <= cut(r) + 1e-9;
  function bh(ps, n, qq) { let K = 0; ps.slice().sort((a, b) => a - b).forEach((p, i) => { if (p <= (i + 1) / n * qq + 1e-9) K = i + 1; }); return K; }

  // walking from the highest rank down: the first rank that passes decides
  function walkState() {
    const st = sorted(), n = st.length; let found = 0;
    for (let i = 0; i < walk; i++) { const r = n - i; if (passes(st[r - 1].p, r)) { found = r; break; } }
    const checked = found ? n - found + 1 : Math.min(walk, n);
    return { st, n, found, checked, done: found > 0 || walk >= n };
  }
  function step() { if (walk < 0 || walkState().done) walk = 0; walk++; draw(); }
  function stop() { playing = false; clearTimeout(timer); timer = 0; }
  function loop() {
    timer = 0;
    if (!playing) return;
    step();
    if (walkState().done) { stop(); draw(); return; }
    timer = setTimeout(loop, 1500 - speed * 130);
  }
  function togglePlay() { if (playing) { stop(); draw(); return; } playing = true; loop(); }
  function changed() { stop(); walk = -1; real = Math.min(real, data.length); draw(); }

  // many repeated checks
  function oneCheck() {
    const n = data.length, k = Math.min(real, n);
    const tests = Array.from({ length: n }, (_, i) => ({ fake: i >= k, p: i < k ? 100 * Math.random() ** 8 : 100 * Math.random() }));
    tests.sort((a, b) => a.p - b.p);
    const K = bh(tests.map(t => t.p), n, q), V = tests.slice(0, K).filter(t => t.fake).length;
    runs.push({ R: K, V, share: K ? V / K : 0 });
  }
  function runMany(count) { todo += count; if (!anim) anim = requestAnimationFrame(tickRuns); }
  function tickRuns() {
    const k = Math.min(todo, speed * 2);
    for (let i = 0; i < k; i++) oneCheck();
    todo -= k; draw();
    anim = todo > 0 ? requestAnimationFrame(tickRuns) : 0;
  }

  // drag a bar: pointer height sets its luck score
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = NARROW ? 40 : 54, X1 = VW - 10, BASE = 266, TOP = 24;
  svg.setAttribute('viewBox', `0 0 ${VW} 360`);
  curve.setAttribute('viewBox', `0 0 ${VW} 200`);
  const PM = () => Math.max(6, Math.ceil(q) + 1);
  const unit = () => (BASE - TOP) / PM();
  let drag = null;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), st = sorted(), i = Math.floor((p.x - X0) / ((X1 - X0) / st.length));
    if (i < 0 || i >= st.length) return;
    drag = st[i]; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (!drag) return;
    const p = toSvg(e);
    drag.p = Math.min(PM(), r1((BASE - p.y) / unit()));
    changed();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { drag = null; });

  const chal = challenges(ch, [
    { text: 'Change the target rate so that exactly 2 features are flagged.',
      check: st => st.flags === 2, why: 'Yes! A lower target lowers every step of the staircase, so fewer bars pass.' },
    { text: 'Make a bar fail its own cutoff but still get flagged. Tip: drag thickness up a little.',
      check: st => st.failedButFlagged,
      why: 'Right: a higher rank passes, so every bar left of it is flagged, even one above its own cutoff.' },
    { text: 'Keep real differences at 0. Predict: will the average share of false alarms stay near the target? Then run 100 checks.',
      check: st => st.real === 0 && st.runs >= 100,
      why: 'It stays near the target. With no real differences every flag is false, yet the staircase keeps the average share at the target.' },
    { text: 'Set real differences to 3 and run 200 checks. Is the false-alarm share above or below the target now?',
      check: st => st.real >= 3 && st.runs >= 200,
      why: 'Below: real differences add true flags, so false alarms are a smaller share. The target is a ceiling on the average.' },
  ]);

  function draw() {
    const st = sorted(), n = st.length, K = bh(st.map(d => d.p), n, q), W = walk >= 0 ? walkState() : null;
    const pm = PM(), u = unit(), sl = (X1 - X0) / n, bw = Math.min(56, sl * 0.55);
    const yOf = p => BASE - Math.min(p, pm) * u;
    const k = [];
    for (let g = 0; g <= pm; g += pm > 8 ? 2 : 1) {
      const y = BASE - g * u;
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g + '%'));
    }
    let failedButFlagged = false;
    const cur = W && W.checked ? n - W.checked + 1 : 0;
    st.forEach((d, i) => {
      const r = i + 1, cx = X0 + sl * (i + 0.5), c = cut(r), yc = yOf(c);
      if (r <= K && !passes(d.p, r)) failedButFlagged = true;
      let col;
      if (!W) col = r <= K ? C.green : C.pink;
      else if (W.done && W.found && r <= W.found) col = C.green;
      else if (r >= cur && cur) col = C.pink;
      else col = C.cyan;
      if (W && r === cur) k.push(s('rect', { x: cx - sl / 2 + 3, y: TOP - 10, width: sl - 6, height: BASE - TOP + 10, fill: '#ffffff', 'fill-opacity': .05, rx: 8 }));
      const top = yOf(d.p);
      k.push(s('rect', { x: cx - bw / 2, y: top, width: bw, height: Math.max(1, BASE - top), fill: col, 'fill-opacity': .82, rx: 2 }));
      if (d.p > pm) k.push(s('line', { x1: cx - bw / 2 - 4, x2: cx + bw / 2 + 4, y1: top + 22, y2: top + 14, stroke: C.bg, 'stroke-width': 6 }));
      // this rank's cutoff step and the riser to the next one
      k.push(s('line', { x1: cx - sl / 2, x2: cx + sl / 2, y1: yc, y2: yc, stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }),
        s('text', { x: cx - sl / 2 + 3, y: yc - 5, fill: C.amber, 'font-size': 11 * F, 'font-weight': 700, 'font-family': 'Consolas' }, fmt(r2(c)) + '%'));
      if (r < n) k.push(s('line', { x1: cx + sl / 2, x2: cx + sl / 2, y1: yc, y2: yOf(cut(r + 1)), stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '4 4' }));
      const fs = (n > 6 ? 12 : 14) * F, nm = sl < 64 ? d.name.slice(0, 5) : d.name;
      k.push(s('text', { x: cx, y: BASE + 20, fill: col, 'font-size': fs, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(d.p) + '%'),
        s('text', { x: cx, y: BASE + 42, fill: C.ink, 'font-size': fs, 'text-anchor': 'middle' }, nm),
        s('text', { x: cx, y: BASE + 68, fill: C.violet, 'font-size': 16 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, r));
    });
    k.push(s('text', { x: X0 - 8, y: BASE + 68, fill: C.violet, 'font-size': 12 * F, 'text-anchor': 'end' }, 'rank'));
    svg.replaceChildren(...k);

    if (!W) {
      const lines = [`cutoff = (rank ÷ ${n}) × ${fmt(q)}%`];
      st.forEach((d, i) => { const r = i + 1, ok = passes(d.p, r);
        lines.push([`${r} ${d.name.padEnd(9)} ${(fmt(d.p) + '%').padStart(5)} ${ok ? '≤' : '>'} ${fmt(r2(cut(r)))}%${r <= K ? '  flag' : ''}`, r <= K ? C.green : C.pink]); });
      lines.push([K ? `highest passing rank = ${K} → ${K} flagged` : 'no rank passes → 0 flagged', C.amber]);
      fbox(box, lines);
      note.textContent = (K ? `Rank ${K} is the highest rank that passes: flag it and every bar left of it.` : 'No rank passes its cutoff, so nothing is flagged.')
        + (failedButFlagged ? ' One flagged bar is above its own cutoff: it is still flagged, because a higher rank passes.' : '');
    } else {
      const r = cur, d = st[r - 1], c = cut(r), ok = passes(d.p, r);
      fbox(box, [`step ${walk}: rank ${r}, ${d.name}`,
        `cutoff = (${r} ÷ ${n}) × ${fmt(q)}% = ${fmt(r2(c))}%`,
        [`p = ${fmt(d.p)}% ${ok ? '≤' : '>'} ${fmt(r2(c))}% → ${ok ? 'passes' : 'fails'}`, ok ? C.green : C.pink],
        W.done ? [W.found ? `flag ranks 1 to ${W.found}: ${W.found} flags` : 'no rank passed: 0 flags', C.amber] : ['next: go down one rank', C.muted]]);
      note.textContent = 'Start at the highest rank and walk down. The first bar that passes decides: flag it and every bar left of it.';
    }
    counter.textContent = W ? `Step ${walk} of at most ${n}` : 'Full answer shown';
    playBtn.textContent = playing ? '❚❚ Pause' : '▶ Play';
    qLabel.textContent = fmt(q) + '%';
    speedLabel.textContent = speed + ' / 10';
    realSlider.max = n - 1; real = Math.min(real, n - 1); realSlider.value = real;
    realLabel.textContent = `${real} of ${n}`;

    // the running average share of false alarms
    const N = runs.length, XM = Math.max(100, Math.ceil(N / 100) * 100), YM = Math.max(10, 2 * q);
    const cx0 = X0, cx1 = VW - 10, cy0 = 172, cy1 = 14;
    const px = i => cx0 + (cx1 - cx0) * i / XM, py = v => cy0 - (cy0 - cy1) * Math.min(v, YM) / YM;
    const c2 = [];
    for (const g of [0, YM / 2, YM]) c2.push(s('line', { x1: cx0, x2: cx1, y1: py(g), y2: py(g), stroke: C.line }),
      s('text', { x: cx0 - 8, y: py(g) + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, fmt(g) + '%'));
    c2.push(s('text', { x: cx0, y: 192, fill: C.muted, 'font-size': 12 * F, 'font-family': 'Consolas' }, '0 checks'),
      s('text', { x: cx1, y: 192, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, XM + ' checks'),
      s('line', { x1: cx0, x2: cx1, y1: py(q), y2: py(q), stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '8 6' }),
      s('text', { x: cx1 - 4, y: py(q) - 6, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, 'target ' + fmt(q) + '%'));
    let sum = 0, R = 0, V = 0;
    const pts = [], every = Math.max(1, Math.floor(N / 500));
    runs.forEach((x, i) => { sum += x.share; R += x.R; V += x.V; if (i % every === 0 || i === N - 1) pts.push(`${px(i + 1)},${py(100 * sum / (i + 1))}`); });
    if (pts.length > 1) c2.push(s('polyline', { points: pts.join(' '), fill: 'none', stroke: C.cyan, 'stroke-width': 2.5 }));
    curve.replaceChildren(...c2);
    const avg = N ? 100 * sum / N : 0;
    runNote.textContent = N
      ? `${N} checks · ${R} flags · ${V} false alarms · average share of false alarms per check: ${fmt(r2(avg))}% (target ${fmt(q)}%)`
      : 'Press “Run 100 checks”. The blue line is the average share of false alarms so far.';

    chal.update({ flags: K, failedButFlagged, runs: N, real, q });
  }
  draw();
  return () => { stop(); cancelAnimationFrame(anim); };
}
