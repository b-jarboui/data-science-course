// 7.4.2 Try it: Brown–Forsythe, a check of spread.
// The learner drags cookies along three grams lines (or taps one and uses −1 g / +1 g), sees every
// distance from the shift's median, the gap and wobble scores, F and p, runs many pure-chance tries
// with truly equal spreads, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const SH = [{ name: 'Morning', c: C.amber }, { name: 'Afternoon', c: C.green }, { name: 'Night', c: C.violet }];
  const START = [[29, 30, 31], [28, 30, 32], [26, 30, 34]];
  const G0 = 20, G1 = 40, MIN_N = 3, MAX_N = 10, TRIES = 1000;
  let v = START.map(g => g.slice()), sel = [2, 2], tries = [], anim = 0;
  let triesKey = v.map(g => g.length).join();

  const svg = s('svg', { viewBox: '0 0 700 530' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: is the spread the same in every shift?'),
    h('p', { class: 'sub' }, 'Each dot is one cookie on a line in grams. Drag a cookie left or right, or tap it and use −1 g / +1 g. Each stick is the cookie’s distance from its shift’s median (the cyan mark).'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1 g', () => bump(-1)), btn('+1 g', () => bump(1)), selLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random)', newData, 'go'),
          btn('Add a cookie to each shift', () => resize(1)),
          btn('Remove a cookie from each', () => resize(-1)),
          btn('Start again', () => { v = START.map(g => g.slice()); sel = [2, 2]; changed(); })),
        h('div', { class: 'sim-row' },
          btn(`Run ${TRIES} equal-spread tries`, runTries, 'go'),
          btn('Clear the tries', () => { cancelAnimationFrame(anim); tries = []; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  // Brown–Forsythe: distances from each shift's median, then a one-way ANOVA on them
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  const median = a => { const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
  function bf(groups) {
    const z = groups.map(g => { const md = median(g); return g.map(x => Math.abs(x - md)); });
    const N = z.reduce((t, g) => t + g.length, 0), zm = z.map(mean), all = mean(z.flat());
    const ssb = z.reduce((t, g, i) => t + g.length * (zm[i] - all) ** 2, 0);
    const ssw = z.reduce((t, g, i) => t + g.reduce((u, x) => u + (x - zm[i]) ** 2, 0), 0);
    const d2 = N - groups.length, gap = ssb / (groups.length - 1), wob = ssw / d2;
    const F = wob > 1e-12 ? gap / wob : NaN;
    // with 3 groups the chance of an F this big or bigger is (1 + 2F / d2) ^ (−d2 / 2)
    const p = Number.isFinite(F) ? Math.pow(1 + 2 * F / d2, -d2 / 2) : NaN;
    return { zm, gap, wob, F, p };
  }

  const chal = challenges(ch, [
    { text: 'Give all three shifts the same average distance. What happens to F?',
      check: st => st.gap < 1e-9 && st.wob > 0,
      why: 'Equal average distances leave no gap at all, so the gap score is 0 and F is 0: no sign of different spreads.' },
    { text: 'Move some cookies, but keep every shift’s average weight at exactly 30 and make night at least 3 times as spread as morning.',
      check: st => st.edited && st.means.every(m => Math.abs(m - 30) < 1e-9) && st.zm[0] > 0 && st.zm[2] >= 3 * st.zm[0] - 1e-9,
      why: 'Same averages, very different spreads: comparing averages alone would never see this. That is why we check spread.' },
    { text: 'Push p below 0.05 (1 in 20). Try with 3 cookies per shift first, then add cookies.',
      check: st => Number.isFinite(st.p) && st.p < 0.05,
      why: 'With 3 cookies per shift you probably got stuck above 0.05: too little information. More cookies let a real difference in spread show up.' },
    { text: `Press “Run ${TRIES} equal-spread tries”. Compare the amber share with p.`,
      check: st => st.tries >= TRIES,
      why: 'The amber share is what p is about: how often chance alone, with truly equal spreads, gives an F this big or bigger.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, FS = NARROW ? 1.25 : 1;
  const X0 = 24, X1 = VW - 24, LY = [80, 180, 280], HT = 404, HB = 496;
  svg.setAttribute('viewBox', `0 0 ${VW} 530`);
  const gx = g => X0 + (g - G0) / (G1 - G0) * (X1 - X0);
  const f2 = x => fmt(Math.round(x * 100) / 100);
  const pText = p => p < 0.001 ? 'below 0.001' : String(Math.round(p * 1000) / 1000);
  const clamp = g => Math.max(G0, Math.min(G1, g));
  const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
  const mono = 'Consolas, monospace', sans = 'Segoe UI, Arial, sans-serif';

  function changed() {
    const key = v.map(g => g.length).join();
    if (key !== triesKey) { cancelAnimationFrame(anim); tries = []; triesKey = key; }
    draw();
  }
  function bump(d) { const [i, j] = sel; v[i][j] = clamp(v[i][j] + d); changed(); }
  function resize(d) {
    if (d > 0 && v[0].length < MAX_N) v.forEach(g => g.push(clamp(median(g) + rnd(-4, 4))));
    if (d < 0 && v[0].length > MIN_N) v.forEach(g => g.pop());
    sel = [sel[0], Math.min(sel[1], v[0].length - 1)];
    changed();
  }
  function newData() {
    v = v.map(g => { const sd = [0.6, 1.2, 2.5, 4][rnd(0, 3)], c = 30 + rnd(-1, 1); return g.map(() => clamp(Math.round(c + sd * gauss()))); });
    changed();
  }
  // many pure-chance tries: same number of cookies, truly equal spreads
  function runTries() {
    cancelAnimationFrame(anim);
    let left = TRIES;
    const step = () => {
      for (let i = 0; i < 50 && left > 0; i++, left--) {
        const F = bf(v.map(g => g.map(() => 30 + 2 * gauss()))).F;
        if (Number.isFinite(F)) tries.push(F);
      }
      draw();
      if (left > 0) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // drag a cookie: pointer position sets its weight
  let drag = null, pos = [];
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    let best = null, bd = 26;
    for (const q of pos) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = q; } }
    if (!best) return;
    sel = [best.i, best.j]; drag = sel; svg.setPointerCapture(e.pointerId); draw(); move(e);
  });
  const move = e => {
    if (!drag) return;
    const p = toSvg(e), g = clamp(Math.round(G0 + (p.x - X0) / (X1 - X0) * (G1 - G0)));
    if (g !== v[drag[0]][drag[1]]) { v[drag[0]][drag[1]] = g; changed(); }
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { drag = null; });
  svg.addEventListener('pointercancel', () => { drag = null; });

  function draw() {
    const st = bf(v), k = [];
    pos = [];
    v.forEach((g, i) => {
      const y = LY[i], md = median(g), col = SH[i].c, seen = {};
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.muted, 'stroke-width': 2 }));
      for (let t = G0; t <= G1; t++) k.push(s('line', { x1: gx(t), x2: gx(t), y1: y - (t % 5 ? 3 : 6), y2: y + (t % 5 ? 3 : 6), stroke: C.muted }));
      k.push(s('text', { x: X0, y: y - 40, fill: col, 'font-size': 15 * FS, 'font-weight': 700, 'font-family': sans }, SH[i].name),
        s('text', { x: X1, y: y - 40, fill: col, 'font-size': 13 * FS, 'text-anchor': 'end', 'font-family': mono }, `average distance ${f2(st.zm[i])} g`),
        s('line', { x1: gx(md), x2: gx(md), y1: y + 9, y2: y + 24, stroke: C.cyan, 'stroke-width': 4, 'stroke-linecap': 'round' }));
      const pts = g.map((x, j) => { const up = (seen[x] = (seen[x] || 0) + 1) - 1; return { i, j, x: gx(x), y: y - up * 18, d: Math.abs(x - md) }; });
      pts.forEach(q => k.push(s('line', { x1: gx(md), x2: q.x, y1: q.y, y2: q.y, stroke: col, 'stroke-width': 5, 'stroke-opacity': .55, 'stroke-linecap': 'round' })));
      pts.forEach(q => {
        const on = q.i === sel[0] && q.j === sel[1];
        k.push(s('circle', { cx: q.x, cy: q.y, r: 9, fill: col, stroke: on ? C.ink : 'none', 'stroke-width': 3 }),
          s('text', { x: q.x, y: q.y - 14, fill: col, 'font-size': 12 * FS, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, f2(q.d)));
      });
      pos.push(...pts);
    });
    for (let t = G0; t <= G1; t += 5) k.push(s('text', { x: gx(t), y: LY[2] + 42, fill: C.muted, 'font-size': 13 * FS, 'text-anchor': 'middle', 'font-family': mono }, t));
    k.push(s('text', { x: X1, y: LY[2] + 62, fill: C.muted, 'font-size': 13 * FS, 'text-anchor': 'end', 'font-family': sans }, 'grams'));

    // the pure-chance tries: a growing histogram of F, amber where F is this big or bigger
    const Fo = st.F, B = 32, FMAX = 8, bins = new Array(B).fill(0);
    tries.forEach(f => bins[Math.min(B - 1, Math.floor(f / FMAX * B))]++);
    const hits = Number.isFinite(Fo) ? tries.filter(f => f >= Fo - 1e-12).length : 0;
    k.push(s('text', { x: X0, y: 372, fill: C.ink, 'font-size': 13 * FS, 'font-family': sans }, 'Pure-chance tries (spreads truly equal)'),
      s('text', { x: X0, y: 392, fill: C.amber, 'font-size': 13 * FS, 'font-family': mono },
        tries.length ? `F this big or bigger: ${hits} of ${tries.length} (${Math.round(hits / tries.length * 100)}%)` : 'No tries yet.'));
    const top = Math.max(1, ...bins), bw = (X1 - X0) / B;
    bins.forEach((c, b) => {
      if (!c) return;
      const hh = c / top * (HB - HT), hot = Number.isFinite(Fo) && (b + 0.5) * FMAX / B >= Fo;
      k.push(s('rect', { x: X0 + b * bw + 1, y: HB - hh, width: bw - 2, height: hh, fill: hot ? C.amber : C.muted, 'fill-opacity': .85, rx: 1.5 }));
    });
    k.push(s('line', { x1: X0, x2: X1, y1: HB, y2: HB, stroke: C.line, 'stroke-width': 2 }));
    for (let t = 0; t <= FMAX; t += 2) k.push(s('text', { x: X0 + t / FMAX * (X1 - X0), y: HB + 18, fill: C.muted, 'font-size': 12 * FS,
      'text-anchor': t === 0 ? 'start' : t === FMAX ? 'end' : 'middle', 'font-family': mono }, t === FMAX ? '8+' : t));
    if (Number.isFinite(Fo)) {
      const fx = X0 + Math.min(Fo, FMAX) / FMAX * (X1 - X0), right = fx > (X0 + X1) / 2;
      k.push(s('line', { x1: fx, x2: fx, y1: HT - 4, y2: HB, stroke: C.pink, 'stroke-width': 3, 'stroke-dasharray': '6 5' }),
        s('text', { x: right ? fx - 6 : fx + 6, y: HT + 10, fill: C.pink, 'font-size': 13 * FS, 'font-weight': 700, 'text-anchor': right ? 'end' : 'start', 'font-family': mono }, `your F = ${f2(Fo)}`));
    }
    svg.replaceChildren(...k);

    const ok = Number.isFinite(st.F);
    fbox(box, [
      `medians       ${v.map(g => f2(median(g))).join(' · ')}`,
      `avg distances ${st.zm.map(f2).join(' · ')}`,
      `gap score     = ${f2(st.gap)}`,
      [`wobble score  = ${f2(st.wob)}`, C.violet],
      [ok ? `F = ${f2(st.gap)} ÷ ${f2(st.wob)} = ${f2(st.F)}` : 'F: wobble is 0, cannot divide', C.amber],
      ok ? [`p = ${pText(st.p)}  (line: 0.05)`, st.p < 0.05 ? C.green : C.cyan] : ['p: —', C.muted]]);
    note.textContent = !ok ? 'Every distance equals its shift’s average distance, so there is no wobble and F cannot be computed. Move a cookie.'
      : st.p < 0.05 ? 'Below 1 in 20: significant. The spreads really seem to differ.'
      : 'Above 1 in 20: no clear difference in spread. With few cookies, that does not prove the spreads are equal.';
    selLabel.textContent = `Selected: ${SH[sel[0]].name} cookie ${sel[1] + 1} (${v[sel[0]][sel[1]]} g)`;
    chal.update({ ...st, means: v.map(mean), n: v[0].length, edited: JSON.stringify(v) !== JSON.stringify(START), tries: tries.length });
  }
  draw();
  return () => cancelAnimationFrame(anim);
}
