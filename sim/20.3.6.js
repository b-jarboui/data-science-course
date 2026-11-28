// 20.3.6 Try it: nucleus (top-p) sampling.
// Sorted chance bars, a p slider, and a running total built one token at a time (Step / Play),
// with the running-total curve growing toward p. Drag a bar, or tap it and use −5 / +5.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const PRESETS = {
    open: { label: 'After “open”', words: ['at', 'on', 'soon', 'late', 'purple'], pc: [45, 30, 15, 6, 4] },
    at: { label: 'After “open at”', words: ['nine', 'ten', 'noon'], pc: [40, 30, 30] },
    on: { label: 'After “open on”', words: ['Monday', 'time'], pc: [80, 20] },
  };
  const POOL = ['at', 'on', 'soon', 'late', 'purple', 'nine', 'ten', 'noon', 'Monday', 'today', 'early', 'again'];
  let words = [], pc = [], ord = [], preset = 'open', p = 75, sel = 0;
  let shown = 0, fromZero = false, walked = false, timer = 0, playing = false;

  const svg = s('svg', { viewBox: '0 0 700 330' });
  const curve = s('svg', { viewBox: '0 0 400 210' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const pIn = h('input', { type: 'range', min: 1, max: 100, step: 1, value: p, 'aria-label': 'Target p' });
  const pLab = h('span', { class: 'sim-note', style: { margin: 0, minWidth: '6.5rem', color: C.amber, fontWeight: 700 } });
  const spIn = h('input', { type: 'range', min: 1, max: 5, step: 1, value: 2, 'aria-label': 'Speed' });
  const count = h('span', { class: 'sim-note', style: { margin: 0 } });
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const playBtn = btn('▶ Play', () => playing ? stop() : start(), 'go');
  pIn.addEventListener('input', () => { p = +pIn.value; changed(); });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: keep the top tokens until they reach p'),
    h('p', { class: 'sub' }, 'Each bar is one possible next token and its chance. Move p, then add the bars from the top with Step or Play. Drag a bar, or tap it and use −5 / +5, to change the chances.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, pLab, pIn),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, btn('−5', () => bump(-5)), btn('+5', () => bump(5)), selLabel),
        h('div', { class: 'sim-row' }, btn('Step', () => { stop(); step(); }), playBtn, btn('Reset', reset)),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, h('span', { class: 'sim-note', style: { margin: 0 } }, 'Speed'), spIn, count),
        h('div', { class: 'sim-row' }, ...Object.entries(PRESETS).map(([k, d]) => btn(d.label, () => load(k))), btn('New data (random)', random))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, h('div', { class: 'sim-note', style: { marginTop: 0 } }, 'Running total after each step'), curve),
        h('div', { class: 'sim-card' }, ch)))));

  const r1 = x => Math.round(x * 10) / 10;
  const sortOrd = () => { ord = words.map((_, i) => i).sort((a, b) => pc[b] - pc[a] || a - b); };
  function walk() {
    const t = ord.map(i => ({ w: words[i], v: pc[i], i }));
    let c = 0; const cum = t.map(x => (c += x.v));
    return { t, cum, kept: cum.findIndex(x => x >= p) + 1 };
  }

  const chal = challenges(ch, [
    { text: 'On the first step (after “open”), set p so that only “at” is kept.',
      check: st => st.preset === 'open' && st.kept === 1,
      why: 'Right: any p up to 45% is reached by “at” alone, so the nucleus is one token.' },
    { text: 'Press “After “open at”” and find a p that keeps only nine and ten, as top-2 did.',
      check: st => st.preset === 'at' && st.kept === 2,
      why: 'Yes: with p from 41% to 70%, nine and ten already reach it, so noon is dropped. The choice of p matters.' },
    { text: 'Predict how many tokens p = 99% keeps on the first step. Set it, press Reset, then Play.',
      check: st => st.preset === 'open' && st.p === 99 && st.walked,
      why: 'All 5: after “late” the total is only 96, so “purple” is needed too. A high p lets the tail back in.' },
    { text: 'Press “New data (random)” and find the smallest p that keeps exactly 3 tokens.',
      check: st => st.preset === 'random' && st.kept === 3 && st.p === st.cum[1] + 1,
      why: 'Exactly: one more than the total of the top two. Any lower, and two tokens already reach p.' },
  ]);

  // whole percents that add up to total, each at least 1
  function whole(raw, total) {
    const out = raw.map(x => Math.max(1, Math.floor(x)));
    let left = total - out.reduce((a, b) => a + b, 0);
    const byFrac = raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]);
    for (let k = 0; left > 0; k = (k + 1) % out.length) { out[byFrac[k][1]]++; left--; }
    while (left < 0) { const j = out.indexOf(Math.max(...out)); out[j]--; left++; }
    return out;
  }
  // set one chance; the others share the rest in the same proportions
  function setPct(i, q) {
    const n = pc.length; q = Math.max(1, Math.min(100 - (n - 1), Math.round(q)));
    const rest = pc.filter((_, j) => j !== i), O = rest.reduce((a, b) => a + b, 0);
    const others = whole(rest.map(v => v / O * (100 - q)), 100 - q);
    pc = pc.map((_, j) => j === i ? q : others[j < i ? j : j - 1]);
    preset = 'edited';
  }
  function bump(d) { setPct(sel, pc[sel] + d); changed(); }
  function load(k) { words = PRESETS[k].words.slice(); pc = PRESETS[k].pc.slice(); preset = k; sel = 0; changed(); }
  function random() {
    const n = rnd(3, 6), w = Array.from({ length: n }, () => rnd(1, 40)), W = w.reduce((a, b) => a + b, 0);
    words = POOL.slice().sort(() => Math.random() - 0.5).slice(0, n);
    pc = whole(w.map(x => x / W * 100), 100); preset = 'random'; sel = 0; changed();
  }

  // a change shows the full answer at once; Reset + Step / Play walks it again
  function changed() { stop(); sortOrd(); shown = walk().kept; fromZero = false; walked = false; draw(); }
  function step() {
    const { kept } = walk();
    if (shown >= kept) return false;
    shown++;
    if (shown >= kept && fromZero) walked = true;
    draw();
    return shown < kept;
  }
  const delay = () => [1400, 1000, 700, 400, 200][spIn.value - 1];
  function tick() { timer = setTimeout(() => { if (step()) tick(); else stop(); }, delay()); }
  function start() {
    if (shown >= walk().kept) { shown = 0; fromZero = true; walked = false; draw(); }
    playing = true; playBtn.textContent = '❚❚ Pause'; tick();
  }
  function stop() { clearTimeout(timer); playing = false; playBtn.textContent = '▶ Play'; }
  function reset() { stop(); shown = 0; fromZero = true; walked = false; draw(); }

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps words readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1, VH = 330;
  const LX = NARROW ? 74 : 96, BX = LX + 10, BL = VW - BX - (NARROW ? 64 : 80);
  const TOP = 16, RH = 40, TY = 288;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  // drag a bar sideways to set its chance; a tap selects it
  let dragging = -1;
  const toSvg = e => { const q = svg.createSVGPoint(); q.x = e.clientX; q.y = e.clientY; return q.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const q = toSvg(e), row = Math.floor((q.y - TOP) / RH);
    if (row < 0 || row >= ord.length) return;
    sel = ord[row]; dragging = sel; svg.setPointerCapture(e.pointerId); draw();
  });
  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    setPct(dragging, (toSvg(e).x - BX) / BL * 100); changed();
  });
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const { t, cum, kept } = walk(), n = t.length, done = shown >= kept, k = [];
    for (let g = 0; g <= 100; g += 25) {
      const x = BX + g / 100 * BL;
      k.push(s('line', { x1: x, x2: x, y1: TOP, y2: TOP + n * RH, stroke: C.line }));
    }
    t.forEach((r, j) => {
      const y = TOP + RH * (j + 0.5), w = r.v / 100 * BL;
      const col = j < shown ? C.cyan : done ? C.pink : C.violet;
      if (r.i === sel) k.push(s('rect', { x: 2, y: y - RH / 2 + 2, width: VW - 4, height: RH - 4, fill: '#ffffff', 'fill-opacity': .05, rx: 8 }));
      k.push(s('text', { x: LX, y: y + 5 * F, fill: C.ink, 'font-size': 15 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, r.w),
        s('rect', { x: BX, y: y - RH * 0.31, width: Math.max(2, w), height: RH * 0.62, fill: col, 'fill-opacity': .82, rx: 3 }),
        s('text', { x: BX + w + 6, y: y + 5 * F, fill: col, 'font-size': 15 * F, 'font-weight': 700, 'font-family': 'Consolas' }, r.v + '%'));
    });
    // running-total bar and the target p
    k.push(s('text', { x: BX, y: TY - 20, fill: C.muted, 'font-size': 13 * F, 'font-family': 'Segoe UI, Arial, sans-serif' }, 'running total'),
      s('rect', { x: BX, y: TY - 13, width: BL, height: 26, fill: 'none', stroke: C.muted, rx: 3 }));
    let x = BX;
    for (let j = 0; j < shown; j++) {
      const w = t[j].v / 100 * BL;
      k.push(s('rect', { x: x + 0.5, y: TY - 11, width: Math.max(1, w - 1), height: 22, fill: C.cyan, 'fill-opacity': .82 }));
      x += w;
    }
    k.push(s('text', { x: LX, y: TY + 5 * F, fill: C.cyan, 'font-size': 16 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, shown ? cum[shown - 1] : 0));
    const xp = BX + p / 100 * BL;
    k.push(s('line', { x1: xp, x2: xp, y1: TY - 20, y2: TY + 20, stroke: C.amber, 'stroke-width': 3, 'stroke-dasharray': '5 4' }),
      s('text', { x: xp, y: TY + 36, fill: C.amber, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `p = ${p}%`));
    svg.replaceChildren(...k);

    // formula box: the numbers of this step
    const lines = [[`p = ${p}%`, C.amber]];
    if (!shown) lines.push('running total = 0', ['press Step to add the top token', C.muted]);
    else {
      const last = t[shown - 1], prev = shown > 1 ? cum[shown - 2] : 0, tot = cum[shown - 1];
      lines.push(`step ${shown}: add ${last.w} (${last.v}%)`, prev ? `running total = ${prev} + ${last.v} = ${tot}` : `running total = ${tot}`);
      if (!done) lines.push([`${tot} is below ${p}: not yet`, C.amber]);
      else lines.push([`${tot} reaches ${p}: stop, keep ${kept}`, C.green],
        `shared again: ${t.slice(0, kept).map(r => `${r.w} ${fmt(r1(r.v / tot * 100))}%`).join(', ')}`);
    }
    fbox(box, lines);
    note.textContent = done
      ? `Kept ${kept} of ${n} tokens (cyan); ${n - kept} dropped (pink). The kept set is the nucleus.`
      : 'Violet bars are not checked yet. Cyan bars are already in the running total.';
    pLab.textContent = `p = ${p}%`;
    count.textContent = `Step ${shown}`;
    selLabel.textContent = `Selected: ${words[sel]} (${pc[sel]}%)`;
    drawCurve(t, cum);
    chal.update({ preset, p, kept, walked, cum });
  }

  // running total against the step number, growing as the walk goes on
  function drawCurve(t, cum) {
    const W = 400, H = 210, x0 = 44, x1 = W - 14, y0 = H - 30, y1 = 14, n = t.length;
    const X = j => x0 + j / n * (x1 - x0), Y = v => y0 - v / 100 * (y0 - y1), k = [];
    for (let g = 0; g <= 100; g += 25) k.push(s('line', { x1: x0, x2: x1, y1: Y(g), y2: Y(g), stroke: C.line }),
      s('text', { x: x0 - 6, y: Y(g) + 4, fill: C.muted, 'font-size': 12, 'text-anchor': 'end', 'font-family': 'Consolas' }, g));
    for (let j = 0; j <= n; j++) k.push(s('text', { x: X(j), y: y0 + 18, fill: C.muted, 'font-size': 12, 'text-anchor': 'middle', 'font-family': 'Consolas' }, j));
    k.push(s('line', { x1: x0, x2: x1, y1: Y(p), y2: Y(p), stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '6 5' }),
      s('text', { x: x1, y: Y(p) - 6, fill: C.amber, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, `p = ${p}`));
    const pts = [[X(0), Y(0)], ...cum.slice(0, shown).map((c, j) => [X(j + 1), Y(c)])];
    if (pts.length > 1) k.push(s('polyline', { points: pts.map(q => q.join(',')).join(' '), fill: 'none', stroke: C.cyan, 'stroke-width': 3 }));
    pts.forEach(([cx, cy]) => k.push(s('circle', { cx, cy, r: 4.5, fill: C.cyan })));
    curve.replaceChildren(...k);
  }

  load('open');
  return () => clearTimeout(timer);
}
