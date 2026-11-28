// 20.3.8 Try it: KV caching.
// The learner writes tokens one step at a time (Step, or Play with a speed slider), turns the cache on or off,
// changes the prompt length and the number of layers, and watches the cards computed, the cards kept and the memory.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = ['The', 'library', 'will', 'open'], NEXT = ['at', 'ten', '.'];
  const EXTRA = ['Hi', '!', 'Please', 'say', 'when', ':'];
  const POOL = ['the', 'café', 'gym', 'lab', 'class', 'desk', 'will', 'open', 'close', 'start', 'at', 'on', 'nine', 'ten', 'six',
    'noon', 'Monday', 'today', 'soon', 'tomorrow', 'and', 'is', '.', ',', '?'];
  const CAP = 96, MAXN = 30;
  let prompt = START.slice(), more = NEXT.slice(), n = 0, layers = 1, cache = true, playing = false, raf = 0, last = 0;
  const word = k => more[k] ?? (more[k] = POOL[rnd(0, POOL.length - 1)]);

  const svg = s('svg', { viewBox: '0 0 700 565' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const counter = h('span', { class: 'sim-note', style: { margin: 0, fontWeight: 700 } });
  const promptLab = h('span'), layerLab = h('span');
  const speedIn = h('input', { type: 'range', min: 1, max: 8, value: 2, 'aria-label': 'Speed' });
  const promptIn = h('input', { type: 'range', min: 2, max: 10, value: 4, 'aria-label': 'Prompt length', oninput: () => setPrompt(+promptIn.value) });
  const layerIn = h('input', { type: 'range', min: 1, max: 8, value: 1, 'aria-label': 'Layers', oninput: () => { layers = +layerIn.value; reset(); } });
  const playBtn = btn('▶ Play', () => setPlaying(!playing));
  const cacheBtn = btn('Cache: ON', () => { cache = !cache; draw(); });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: the KV cache'),
    h('p', { class: 'sub' }, 'Each step writes one token. Amber cards are computed in this step; cyan cards are kept in the cache and reused. Each row of cards is one layer.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Step', () => { setPlaying(false); step(); }, 'go'), playBtn,
          h('label', { class: 'sim-note', style: { margin: 0 } }, 'Speed ', speedIn),
          btn('Reset', reset), btn('New prompt (random)', newData)),
        h('div', { class: 'sim-row' }, cacheBtn,
          h('label', { class: 'sim-note', style: { margin: 0 } }, promptLab, promptIn),
          h('label', { class: 'sim-note', style: { margin: 0 } }, layerLab, layerIn), counter)),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  // the counting rule of the lesson: step 1 reads the prompt, every later step adds one token
  const p = () => prompt.length;
  const ncStep = k => (p() + k - 1) * layers;               // cards computed at step k without a cache
  const cStep = k => (k === 1 ? p() : 1) * layers;          // with a cache
  const ncTotal = m => (m * p() + m * (m - 1) / 2) * layers;
  const cTotal = m => (m ? p() + m - 1 : 0) * layers;       // also the cards kept in the cache
  const isFull = () => cache && cTotal(n + 1) > CAP;

  const chal = challenges(ch, [
    { text: 'Cache on, 4-token prompt, 1 layer: press Step 3 times. How many cards were computed?',
      check: st => st.n === 3 && st.p === 4 && st.layers === 1 && st.cache,
      why: 'The cache computed 4 + 1 + 1 = 6 cards; without it, 4 + 5 + 6 = 15.' },
    { text: 'Predict first: does the saving stay the same each step, or grow? Then make it save more than 100 cards.',
      check: st => st.saved > 100,
      why: 'It grows: without a cache every step redoes the whole prefix, and the prefix gets longer every step.' },
    { text: 'With 4 layers and a 4-token prompt, how many cards does the cache hold after 3 steps? Predict, then check.',
      check: st => st.n === 3 && st.layers === 4 && st.p === 4 && st.cache,
      why: '6 tokens have cards, in each of 4 layers: 6 × 4 = 24 cards kept in memory.' },
    { text: 'Find a setting that fills the memory.',
      check: st => st.full,
      why: 'More layers and longer chats mean more cards kept: the cache trades memory for speed.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = 12, X1 = VW - 12;
  svg.setAttribute('viewBox', `0 0 ${VW} 565`);
  const nice = v => { const m = 10 ** Math.floor(Math.log10(Math.max(v, 1e-9))); return [1, 2, 5, 10].map(f => f * m).find(x => x >= v); };

  function setPrompt(k) {
    prompt = k <= 4 ? START.slice(4 - k) : [...EXTRA.slice(EXTRA.length - (k - 4)), ...START];
    more = NEXT.slice(); reset();
  }
  function newData() {
    prompt = Array.from({ length: rnd(2, 10) }, () => POOL[rnd(0, POOL.length - 1)]);
    more = []; promptIn.value = prompt.length; reset();
  }
  function reset() { setPlaying(false); n = 0; draw(); }
  function step() {
    if (n >= MAXN || isFull()) { draw(); return false; }
    n++; draw(); return true;
  }
  function setPlaying(on) {
    playing = on; playBtn.textContent = on ? '❚❚ Pause' : '▶ Play';
    cancelAnimationFrame(raf);
    if (on) { last = 0; raf = requestAnimationFrame(loop); }
  }
  function loop(now) {
    if (!playing) return;
    if (now - last >= 1000 / (+speedIn.value / 2)) { last = now; if (!step()) { setPlaying(false); return; } }
    raf = requestAnimationFrame(loop);
  }

  function draw() {
    const P0 = p(), count = P0 + n, w = (X1 - X0) / Math.max(8, count), k = [], full = isFull();
    const kept = cache ? cTotal(n) : 0, withCards = n === 0 ? 0 : P0 + n - 1;
    // tokens: prompt muted, written tokens cyan, the token just predicted amber
    for (let i = 0; i < count; i++) {
      const x = X0 + i * w, gen = i >= P0, newest = n > 0 && i === count - 1, txt = gen ? word(i - P0) : prompt[i];
      k.push(s('rect', { x: x + 2, y: 14, width: w - 4, height: 30, rx: 6, fill: C.card, stroke: newest ? C.amber : gen ? C.cyan : C.muted, 'stroke-width': newest ? 2.5 : 1.5 }));
      const fs = w >= 44 * F ? 13 * F : w >= 26 * F ? 10 * F : 0;
      if (fs) {
        const fit = txt.length * fs * 0.56 > w - 8 ? { textLength: w - 8, lengthAdjust: 'spacingAndGlyphs' } : {};
        k.push(s('text', { x: x + w / 2, y: 34, fill: newest ? C.amber : gen ? C.cyan : C.ink, 'font-size': fs, 'font-weight': 700, 'text-anchor': 'middle', ...fit }, txt));
      }
    }
    // key-value cards, one row per layer
    for (let r = 0; r < layers; r++) {
      const y = 56 + r * 25;
      for (let i = 0; i < withCards; i++) {
        const now = !cache || n === 1 || i === withCards - 1, x = X0 + i * w + 3, cw = w - 6, col = now ? C.amber : C.cyan;
        k.push(s('rect', { x, y, width: cw, height: 20, rx: 4, fill: C.card, stroke: col, 'stroke-width': 1.5 }));
        if (cw >= 14) k.push(s('rect', { x: x + 2, y: y + 3, width: cw / 2 - 3, height: 14, fill: C.violet, 'fill-opacity': .45 }),
          s('rect', { x: x + cw / 2 + 1, y: y + 3, width: cw / 2 - 3, height: 14, fill: C.green, 'fill-opacity': .45 }));
      }
    }
    if (n === 0) k.push(s('text', { x: X0, y: 74, fill: C.muted, 'font-size': 14 * F }, 'No cards yet: press Step to read the prompt.'));
    // memory meter
    const frac = Math.min(1, kept / CAP);
    k.push(s('text', { x: X0, y: 286, fill: full ? C.pink : C.muted, 'font-size': 14 * F, 'font-family': 'Consolas' },
      cache ? `memory: ${kept} of ${CAP} cards kept` : 'memory: 0 cards kept (cache off)'),
      s('rect', { x: X0, y: 296, width: X1 - X0, height: 20, rx: 5, fill: 'none', stroke: full ? C.pink : C.muted }),
      s('rect', { x: X0 + 2, y: 298, width: Math.max(0, (X1 - X0 - 4) * frac), height: 16, rx: 4, fill: full ? C.pink : C.cyan, 'fill-opacity': .8 }));
    // curve: cards computed so far, step by step
    const GX0 = NARROW ? 46 : 58, GX1 = X1 - (NARROW ? 34 : 44), GY0 = 372, GY1 = 525;
    const xmax = Math.max(10, n), top = Math.max(20, ncTotal(n)), st = nice(top / 4), ymax = Math.ceil(top / st) * st, xs = nice(xmax / 5);
    const gx = i => GX0 + i / xmax * (GX1 - GX0), gy = v => GY1 - v / ymax * (GY1 - GY0);
    k.push(s('text', { x: X0, y: 350, fill: C.ink, 'font-size': 14 * F, 'font-weight': 700 }, 'cards computed so far'),
      s('text', { x: X1 - 60 * F, y: 350, fill: C.pink, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'end' }, 'no cache'),
      s('text', { x: X1, y: 350, fill: C.cyan, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'end' }, 'cache'));
    for (let v = 0; v <= ymax; v += st) k.push(s('line', { x1: GX0, x2: GX1, y1: gy(v), y2: gy(v), stroke: C.line }),
      s('text', { x: GX0 - 6, y: gy(v) + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, v));
    for (let i = 0; i <= xmax; i += xs) k.push(s('text', { x: gx(i), y: GY1 + 18, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, i));
    k.push(s('text', { x: GX1, y: GY1 + 36, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end' }, 'step'));
    for (const [f, col] of [[ncTotal, C.pink], [cTotal, C.cyan]]) {
      const pts = Array.from({ length: n + 1 }, (_, i) => `${gx(i)},${gy(f(i))}`).join(' ');
      k.push(s('polyline', { points: pts, fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linejoin': 'round' }),
        s('circle', { cx: gx(n), cy: gy(f(n)), r: 4.5, fill: col }),
        s('text', { x: gx(n) + 7, y: gy(f(n)) + 4, fill: col, 'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas' }, f(n)));
    }
    svg.replaceChildren(...k);

    fbox(box, n === 0 ? [`prompt = ${P0} tokens, layers = ${layers}`, 'press Step to write one token'] : [
      `step ${n}: prefix = ${P0 + n - 1} tokens`,
      [`no cache: ${P0 + n - 1} × ${layers} = ${ncStep(n)} cards`, C.pink],
      [`cache:    ${n === 1 ? P0 : 1} × ${layers} = ${cStep(n)} cards`, C.cyan],
      `so far: ${ncTotal(n)} vs ${cTotal(n)}, saved ${ncTotal(n) - cTotal(n)}`,
      [cache ? `cache holds ${cTotal(n)} cards` : 'cache off: no cards kept', C.amber]]);
    note.textContent = full ? 'Memory full: the cache cannot keep another card. Turning the cache off frees the memory, but then every step redoes the whole prefix.'
      : n >= MAXN ? `That is ${MAXN} steps: press Reset to start again.`
      : !cache ? 'Cache off: every step computes the cards of the whole prefix again, and keeps nothing.'
      : 'Cache on: only the newest token’s card is computed; the others are reused.' + (n > 3 ? ' (After “.”, the sim keeps writing made-up words so you can watch a long answer.)' : '');
    promptLab.textContent = `Prompt: ${P0} tokens `;
    layerLab.textContent = `Layers: ${layers} `;
    cacheBtn.textContent = cache ? 'Cache: ON' : 'Cache: OFF';
    counter.textContent = `Step ${n} of ${MAXN}`;
    chal.update({ n, p: P0, layers, cache, saved: ncTotal(n) - cTotal(n), full });
  }
  draw();
  return () => { playing = false; cancelAnimationFrame(raf); };
}
