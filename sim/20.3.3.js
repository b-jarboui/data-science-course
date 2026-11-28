// 20.3.3 Try it: beam search on the library tree.
// The learner sets the beam width, runs the search step by step (or plays it), taps a token to change its chance,
// makes random trees, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const PREFIX = 'The library will open', D = 2;
  const r1 = x => Math.round(x * 10) / 10, r2 = x => Math.round(x * 100) / 100;

  // the tree: every node has a token, its step chance p (%) and its whole-path chance pc (%)
  function node(tok, p, kids = []) { const n = { tok, p, kids, parent: null }; kids.forEach(c => { c.parent = n; }); return n; }
  const EXAMPLE = () => node('open', 100, [
    node('at', 45, [node('nine', 40), node('ten', 30), node('noon', 30)]),
    node('on', 30, [node('Monday', 80), node('time', 20)]),
    node('soon', 15), node('late', 6), node('purple', 4)]);
  const WORDS = [['at', 'on', 'soon', 'late', 'early', 'today'], ['nine', 'ten', 'noon', 'Monday', 'eight', 'Friday', 'time', 'once']];
  function shares(n) {
    const w = Array.from({ length: n }, () => rnd(1, 10)), sum = w.reduce((a, b) => a + b, 0);
    const p = w.map(x => Math.max(1, Math.round(x / sum * 100)));
    const top = p.indexOf(Math.max(...p));
    p[top] += 100 - p.reduce((a, b) => a + b, 0);
    return p.sort((a, b) => b - a);
  }
  function grow(d) {
    if (d === D) return [];
    const n = d === 0 ? rnd(4, 5) : rnd(2, 3), p = shares(n);
    return WORDS[d].slice().sort(() => Math.random() - 0.5).slice(0, n).map((w, i) => node(w, p[i], grow(d + 1)));
  }
  const randomTree = () => node('open', 100, grow(0));
  function calc(n, base) { n.pc = base * n.p / 100; n.kids.forEach(c => calc(c, n.pc)); }
  const name = n => { const t = []; for (let x = n; x.parent; x = x.parent) t.unshift(x.tok); return t.join(' '); };
  const leaves = n => n.kids.length ? n.kids.flatMap(leaves) : [n];
  const bestPossible = () => Math.max(...leaves(tree).filter(n => n.parent && n.parent.parent).map(n => n.pc));

  let tree, example = true, edited = false, W = 2, k = 0, hist = [], beams = [], work = 0, sel = null;
  let playing = false, speed = 1, timer = 0;

  // one iteration: extend every kept path by one token, score each, keep the best W
  function step() {
    if (k >= D) return;
    const cands = beams.flatMap(b => b.kids).sort((a, b) => b.pc - a.pc);
    hist.push({ cands, kept: cands.slice(0, W) });
    beams = cands.slice(0, W); work += cands.length; k++;
    if (k >= D) stop();
    draw();
  }
  function stop() { playing = false; clearTimeout(timer); if (playBtn) playBtn.textContent = '▶ Play'; }
  function run() { if (!playing) return; step(); if (playing && k < D) timer = setTimeout(run, 1000 / speed); else stop(); }
  function toggle() {
    if (playing) { stop(); return; }
    if (k >= D) reset();
    playing = true; playBtn.textContent = '❚❚ Pause';
    run();
  }
  function reset() { stop(); k = 0; hist = []; beams = [tree]; work = 0; draw(); }
  function load(t, ex) { tree = t; example = ex; edited = false; sel = null; chanceIn.disabled = true; calc(tree, 100); reset(); }
  function setChance(n, v) {
    const sibs = n.parent.kids.filter(x => x !== n), rest = sibs.reduce((a, x) => a + x.p, 0);
    sibs.forEach(x => { x.p = rest > 0 ? x.p * (100 - v) / rest : (100 - v) / sibs.length; });
    n.p = v; calc(tree, 100);
  }

  // page
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, FS = NARROW ? 13 : 15, RH = NARROW ? 24 : 26, TOP = 34;
  const XS = NARROW ? [16, 64, 222] : [20, 110, 380], PORT = NARROW ? 26 : 40;
  const svg = s('svg', { viewBox: `0 0 ${VW} 300` }), curve = s('svg', { viewBox: '0 0 320 170' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const counter = h('span', { class: 'sim-note', style: { margin: 0 } });
  const widthLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const speedLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const widthIn = h('input', { type: 'range', min: 1, max: 5, step: 1, value: W, oninput: e => { W = +e.target.value; reset(); } });
  const speedIn = h('input', { type: 'range', min: 0.5, max: 4, step: 0.5, value: speed, oninput: e => { speed = +e.target.value; draw(); } });
  const chanceIn = h('input', { type: 'range', min: 1, max: 98, step: 1, value: 50, disabled: true,
    oninput: e => { if (!sel) return; setChance(sel, +e.target.value); edited = true; reset(); } });
  const playBtn = btn('▶ Play', toggle);
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: beam search'),
    h('p', { class: 'sub' }, 'The tree shows each next token and its chance. At every step the beam extends the kept paths, scores them, and keeps only the best few. Set the beam width, then press Step. Tap a token to change its chance.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, btn('Step', () => { stop(); step(); }, 'go'), playBtn, btn('Reset', reset), counter),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, h('span', {}, 'Beam width'), widthIn, widthLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, h('span', {}, 'Speed'), speedIn, speedLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, selLabel, chanceIn),
        h('div', { class: 'sim-row' },
          btn('New data (random tree)', () => load(randomTree(), false)),
          btn('Back to the lesson tree', () => load(EXAMPLE(), true)))),
      h('div', {}, h('div', { class: 'sim-card' }, curve, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Set the beam width to 1 and run the search to the end. Which answer does it find?',
      check: st => st.example && !st.edited && st.W === 1 && st.done,
      why: 'Width 1 keeps a single path: that is greedy decoding. It ends at “at nine”, 18%, and misses “on Monday”.' },
    { text: 'Predict first: what is the smallest beam width that finds “on Monday” (24%)? Then run it.',
      check: st => st.example && !st.edited && st.W === 2 && st.done && st.ans === 'on Monday',
      why: 'Width 2 keeps “on” at step 1, so “on Monday” gets scored at step 2. Width 1 dropped it too early.' },
    { text: 'With width 1, make greedy find “on Monday”: tap “on”, raise its chance above “at”, then run.',
      check: st => st.example && st.W === 1 && st.done && st.ans === 'on Monday',
      why: 'Greedy looks only one step ahead: once “on” wins step 1, the strong “Monday” follows.' },
    { text: 'Press New data until the beam misses the best possible answer. Then widen the beam and run again.',
      check: st => !st.example && st.done && st.missed,
      why: 'A path dropped early never comes back. A wider beam would catch it, at the cost of more work.' },
  ]);

  // tap a token to select it
  function pick(n) { sel = n; chanceIn.disabled = n.parent.kids.length < 2; chanceIn.value = Math.round(n.p); draw(); }

  function draw() {
    const st = new Map([[tree, 'kept']]);
    hist.forEach(hs => { hs.cands.forEach(n => st.set(n, 'dropped')); hs.kept.forEach(n => st.set(n, 'kept')); });
    const done = k >= D, best = done ? beams[0] : null, bp = bestPossible();
    if (best) for (let x = best; x; x = x.parent) st.set(x, 'answer');
    const col = n => ({ kept: C.cyan, dropped: C.pink, answer: C.green }[st.get(n)] || C.muted);

    // layout: one row per leaf, each parent centred on its children; the tree grows to the right
    let row = 0;
    const place = (n, d) => {
      n.x = XS[d]; n.d = d;
      if (n.kids.length) { n.kids.forEach(c => place(c, d + 1)); n.y = (n.kids[0].y + n.kids[n.kids.length - 1].y) / 2; }
      else n.y = TOP + (row++ + 0.5) * RH;
    };
    place(tree, 0);
    svg.setAttribute('viewBox', `0 0 ${VW} ${TOP + row * RH + 10}`);
    const g = [s('text', { x: 8, y: 18, fill: C.muted, 'font-size': FS, 'font-family': 'Consolas' }, `“${PREFIX} …”`)];
    const nodes = [];
    (function walk(n) { nodes.push(n); n.kids.forEach(walk); })(tree);
    nodes.forEach(n => {
      if (!n.parent) return;
      const px = n.parent.parent ? XS[2] - PORT : n.parent.x + 6;
      g.push(s('line', { x1: px, y1: n.parent.y, x2: n.x - 6, y2: n.y, stroke: st.has(n) ? col(n) : C.line, 'stroke-width': st.get(n) === 'dropped' ? 1.5 : 2.5 }));
    });
    nodes.forEach(n => {
      const c = col(n);
      g.push(s('circle', { cx: n.x, cy: n.y, r: 5, fill: c }));
      if (!n.parent) { g.push(s('text', { x: n.x - 8, y: n.y - 10, fill: C.muted, 'font-size': FS - 2, 'font-family': 'Consolas' }, 'open')); return; }
      const w = n.d === 1 ? XS[2] - PORT - n.x - 4 : VW - n.x - 4;
      if (n === sel) g.push(s('rect', { x: n.x - 9, y: n.y - RH / 2 + 2, width: w, height: RH - 4, rx: 6, fill: '#ffffff', 'fill-opacity': .07, stroke: C.amber }));
      const t = s('text', { x: n.x + 9, y: n.y + FS / 3, fill: st.has(n) ? c : C.ink, 'font-size': FS, 'font-family': 'Consolas', 'font-weight': 700 }, `${n.tok} ${fmt(r1(n.p))}%`);
      if (n.d === 2 && st.has(n)) t.append(s('tspan', { fill: C.amber }, ` → ${fmt(r2(n.pc))}%`));
      g.push(t);
      const hit = s('rect', { x: n.x - 9, y: n.y - RH / 2, width: w, height: RH, fill: 'transparent', style: 'cursor:pointer' });
      hit.addEventListener('pointerdown', () => pick(n));
      g.push(hit);
    });
    svg.replaceChildren(...g);

    // curve: chance of the best kept path after each step, against the best possible answer
    const cx = i => 44 + i * (256 / D), cy = v => 140 - v * 1.15;
    const pts = [[0, 100]];
    hist.forEach((hs, i) => { if (hs.kept.length) pts.push([i + 1, hs.kept[0].pc]); });
    const k2 = [s('text', { x: 160, y: 14, fill: C.muted, 'font-size': 12, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'chance of the best kept path (%)'),
      s('line', { x1: 44, x2: 44, y1: 20, y2: 140, stroke: C.line }), s('line', { x1: 44, x2: 304, y1: 140, y2: 140, stroke: C.line })];
    [0, 50, 100].forEach(v => k2.push(s('text', { x: 38, y: cy(v) + 4, fill: C.muted, 'font-size': 11, 'text-anchor': 'end', 'font-family': 'Consolas' }, v)));
    for (let i = 0; i <= D; i++) k2.push(s('text', { x: cx(i), y: 158, fill: C.muted, 'font-size': 11, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `step ${i}`));
    k2.push(s('line', { x1: 44, x2: 304, y1: cy(bp), y2: cy(bp), stroke: C.amber, 'stroke-width': 1.5, 'stroke-dasharray': '6 5' }),
      s('text', { x: 300, y: cy(bp) - 5, fill: C.amber, 'font-size': 11, 'text-anchor': 'end', 'font-family': 'Consolas' }, `best possible ${fmt(r2(bp))}%`));
    k2.push(s('polyline', { points: pts.map(([i, v]) => `${cx(i)},${cy(v)}`).join(' '), fill: 'none', stroke: C.cyan, 'stroke-width': 2.5 }));
    pts.forEach(([i, v]) => k2.push(s('circle', { cx: cx(i), cy: cy(v), r: 4, fill: best && i === D ? C.green : C.cyan }),
      s('text', { x: cx(i) + 6, y: cy(v) - 7, fill: C.ink, 'font-size': 11, 'font-family': 'Consolas' }, `${fmt(r2(v))}%`)));
    curve.replaceChildren(...k2);

    // formula box: this step's numbers
    const calcLine = n => n.parent.parent ? `${name(n)} = ${fmt(r1(n.parent.p))}% × ${fmt(r1(n.p))}% = ${fmt(r2(n.pc))}%` : `${name(n)} = ${fmt(r1(n.p))}%`;
    let lines;
    if (!hist.length) lines = [`beam width = ${W}`, 'press Step: extend each kept path,', `score it, keep the best ${W}`];
    else {
      const hs = hist[hist.length - 1], kept = new Set(hs.kept);
      lines = [`step ${k}: ${hs.cands.length} candidates scored`,
        ...hs.cands.slice(0, 6).map(n => [`${kept.has(n) ? '✓' : '✕'} ${calcLine(n)}`, kept.has(n) ? C.cyan : C.pink]),
        hs.cands.length > 6 ? `  … ${hs.cands.length - 6} more dropped` : null,
        `work so far: ${work} scored`];
      if (done) lines.push(best ? [`answer: ${name(best)} ${fmt(r2(best.pc))}%`, C.green] : ['the kept paths have no next token here', C.pink],
        `best possible: ${fmt(r2(bp))}%`);
      lines = lines.filter(Boolean);
    }
    fbox(box, lines);
    const missed = done && (!best || best.pc < bp - 1e-9);
    note.textContent = !done ? 'Cyan = kept, pink = dropped, grey = not scored yet. The amber number is the whole-path chance.'
      : missed ? 'The beam missed the best path: it was dropped at an earlier step and never came back. Try a wider beam.'
      : 'The beam found the best possible path.';
    counter.textContent = `Step ${k} of ${D} · ${work} scored`;
    widthLabel.textContent = String(W);
    speedLabel.textContent = `${speed} steps/s`;
    selLabel.textContent = sel ? `Chance of “${sel.tok}”: ${fmt(r1(sel.p))}%` : 'Tap a token to change its chance';
    chal.update({ W, done, example, edited, ans: best ? name(best) : '', missed });
  }

  load(EXAMPLE(), true);
  return () => { playing = false; clearTimeout(timer); };
}
