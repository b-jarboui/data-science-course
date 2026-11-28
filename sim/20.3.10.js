// 20.3.10 Try it: inference batching on a timeline.
// Requests arrive over time; the machine starts a shared step when the batch is full or the longest wait runs out.
// Step / Play / Pause / speed / Reset, knobs for batch size, longest wait and arrivals, live curves, self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const N = 40;
  let B = 4, W = 60, G = 10, speed = 3, jitter = false;
  let arr = [], served = 0, free = 0, batches = [], hist = [], tokens = 0, busy = 0, waitSum = 0;
  let playing = false, raf = 0, lastT = 0;
  const stepTime = n => 20 + (n - 1) * 5 / 3;   // toy rule from the lesson: 20 ms alone, 25 ms for 4
  const r1 = x => Math.round(x * 10) / 10;

  const svg = s('svg', { viewBox: '0 0 700 480' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const counter = h('span', { class: 'sim-note', style: { margin: 0 } });
  const playBtn = btn('▶ Play', () => setPlaying(!playing), 'go');
  function slider(label, min, max, step, get, set, after) {
    const val = h('b', { style: { color: C.ink } });
    const show = () => { val.textContent = String(get()); };
    const inp = h('input', { type: 'range', min, max, step, value: get(), 'aria-label': label,
      oninput: e => { set(+e.target.value); show(); after(); } });
    show();
    return h('label', { class: 'sim-note', style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '.5rem', margin: 0 } }, label, val, inp);
  }
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: batching on a timeline'),
    h('p', { class: 'sub' }, 'Students ask questions over time (dots). The machine starts a shared step when the batch is full, or when the first student in line has waited the longest wait. Each request here needs one token. Toy rule from the lesson: a step takes 20 ms for 1 request, 25 ms for 4, and a little more for each extra request.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Step', () => { setPlaying(false); doStep(); }), playBtn,
          btn('Reset', () => restart(false)),
          btn('New data (random)', () => { jitter = true; restart(true); }),
          btn('Even arrivals', () => { jitter = false; restart(true); }), counter),
        h('div', { class: 'sim-row' },
          slider('Batch size', 1, 8, 1, () => B, v => { B = v; }, () => restart(false)),
          slider('Longest wait (ms)', 0, 100, 10, () => W, v => { W = v; }, () => restart(false)),
          slider('A new student every (ms)', 5, 40, 5, () => G, v => { G = v; }, () => restart(true)),
          slider('Speed (steps per second)', 1, 10, 1, () => speed, v => { speed = v; }, () => {}))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Set the batch size to 1 and press Step three times. How many tokens per second?',
      check: st => st.B === 1 && st.steps >= 3 && st.thr === 50,
      why: 'Alone: 1 token per 20 ms, so 1000 ÷ 20 = 50 tokens per second.' },
    { text: 'Get the throughput above 150 tokens per second (run at least 3 steps).',
      check: st => st.thr > 150 && st.steps >= 3,
      why: 'Yes! A full batch shares each step: 4 tokens in 25 ms is already 160 per second.' },
    { text: 'Few students online: set “a new student every” to 40 ms and the batch size to 8, then run 5 steps. Watch the average wait.',
      check: st => st.G >= 40 && st.B >= 8 && st.steps >= 5,
      why: 'The big batch never fills, so each step starts only when the longest wait runs out: students wait, and the batch is far from full.' },
    { text: 'With even arrivals, a new student every 20 ms: keep the throughput above 100 per second and the average wait at most 20 ms (run 5 steps).',
      check: st => st.G === 20 && !st.jitter && st.steps >= 5 && st.thr > 100 && st.wait <= 20 + 1e-9,
      why: 'A middle ground: a batch of 3 fills in 40 ms, so waits stay short while each step still serves several students.' },
  ]);

  function makeArrivals() { arr = []; let t = 0; for (let i = 0; i < N; i++) { arr.push(t); t += jitter ? rnd(0, 2 * G) : G; } }
  function restart(regen) {
    setPlaying(false);
    if (regen || !arr.length) makeArrivals();
    served = 0; free = 0; batches = []; hist = []; tokens = 0; busy = 0; waitSum = 0;
    draw();
  }

  // one iteration: form the next batch and run one shared step
  function doStep() {
    if (served >= arr.length) return false;
    const q0 = served, tFull = q0 + B - 1 < arr.length ? arr[q0 + B - 1] : Infinity, tOut = arr[q0] + W;
    const start = Math.max(free, Math.min(tFull, tOut));
    let n = 0;
    while (q0 + n < arr.length && n < B && arr[q0 + n] <= start) n++;
    const dur = stepTime(n), waits = [];
    for (let i = q0; i < q0 + n; i++) waits.push(start - arr[i]);
    batches.push({ start, n, q0, dur, waits, why: n === B ? 'full' : 'wait ran out' });
    served += n; free = start + dur; tokens += n; busy += dur; waitSum += waits.reduce((a, b) => a + b, 0);
    hist.push({ thr: tokens / busy * 1000, wait: waitSum / tokens });
    draw();
    return true;
  }

  function setPlaying(on) {
    playing = on && served < arr.length;
    cancelAnimationFrame(raf);
    playBtn.textContent = playing ? '❚❚ Pause' : '▶ Play';
    if (playing) { lastT = 0; raf = requestAnimationFrame(loop); }
  }
  function loop(now) {
    if (!playing) return;
    if (now - lastT >= 1000 / speed) {
      lastT = now;
      if (!doStep() || served >= arr.length) { setPlaying(false); return; }
    }
    raf = requestAnimationFrame(loop);
  }

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1, VH = 480;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const X0 = NARROW ? 14 : 20, X1 = VW - 14;
  const txt = (x, y, str, fill, size, anchor = 'middle', bold = false) => s('text', { x, y, fill, 'font-size': size * F,
    'text-anchor': anchor, 'font-weight': bold ? 700 : 400, 'font-family': 'Consolas, monospace' }, str);
  const ln = (x1, x2, y1, y2, stroke, w = 1, extra = {}) => s('line', { x1, x2, y1, y2, stroke, 'stroke-width': w, ...extra });

  function chart(k, xa, xb, title, vals, color, ymax) {
    const top = 290, bot = 440, px = xa + 30 * F, n = Math.max(10, vals.length);
    const X = i => px + i / n * (xb - px), Y = v => bot - v / ymax * (bot - top);
    k.push(txt(xa, 272, title, color, 13, 'start', true));
    [0, ymax / 2, ymax].forEach(g => k.push(ln(px, xb, Y(g), Y(g), C.line), txt(px - 4, Y(g) + 4, fmt(g), C.muted, 11, 'end')));
    k.push(txt((px + xb) / 2, 462, 'step', C.muted, 11));
    if (vals.length) {
      k.push(s('polyline', { points: vals.map((v, i) => `${X(i + 1)},${Y(v)}`).join(' '), fill: 'none', stroke: color, 'stroke-width': 2.5 }));
      vals.forEach((v, i) => k.push(s('circle', { cx: X(i + 1), cy: Y(v), r: 3.5, fill: color })));
      k.push(txt(xb, top + 14, fmt(r1(vals[vals.length - 1])), color, 12, 'end', true));
    }
  }

  function draw() {
    const k = [], tv = Math.max(200, Math.ceil((free + 60) / 100) * 100);
    const x = t => X0 + t / tv * (X1 - X0);
    const every = tv <= 400 ? 50 : tv <= 1000 ? 100 : 200;
    for (let t = 0; t <= tv; t += every) k.push(ln(x(t), x(t), 30, 196, C.line), txt(x(t), 216, t, C.muted, 12));
    k.push(ln(X0, X1, 196, 196, C.muted, 2), txt(X1, 234, 'time (ms)', C.muted, 12, 'end'),
      txt(X0, 18, 'requests arrive', C.muted, 12, 'start'), txt(X1, 18, 'waiting', C.amber, 12, 'end'),
      txt(X0, 152, 'machine steps (tokens)', C.muted, 12, 'start'));
    const lastB = batches[batches.length - 1];
    batches.forEach(b => {
      const cur = b === lastB;
      b.waits.forEach((w, j) => {
        if (w > 0) k.push(ln(x(arr[b.q0 + j]), x(b.start), 62 + j * 10, 62 + j * 10, C.amber, cur ? 5 : 3, { 'stroke-opacity': cur ? 1 : 0.45 }));
      });
      const bx = x(b.start), bw = Math.max(2, x(b.start + b.dur) - bx - 1);
      k.push(s('rect', { x: bx, y: 158, width: bw, height: 30, rx: 3, fill: cur ? C.amber : C.cyan, 'fill-opacity': cur ? 0.6 : 0.35, stroke: cur ? C.amber : C.cyan }));
      if (bw > 12 * F) k.push(txt(bx + bw / 2, 178, b.n, C.ink, 12, 'middle', true));
    });
    arr.forEach((a, i) => {
      if (a > tv) return;
      const inLast = lastB && i >= lastB.q0 && i < lastB.q0 + lastB.n;
      k.push(s('circle', { cx: x(a), cy: 44, r: 5, fill: i < served ? C.cyan : C.muted, stroke: inLast ? C.amber : 'none', 'stroke-width': 2 }));
    });
    const mid = VW / 2;
    chart(k, X0, mid - 12, 'tokens per second', hist.map(p => p.thr), C.cyan,
      Math.max(200, Math.ceil(Math.max(0, ...hist.map(p => p.thr)) / 50) * 50));
    chart(k, mid + 12, X1, 'average wait (ms)', hist.map(p => p.wait), C.amber,
      Math.max(40, Math.ceil(Math.max(0, ...hist.map(p => p.wait)) / 20) * 20));
    svg.replaceChildren(...k);

    if (!lastB) fbox(box, [`batch size = ${B}, longest wait = ${W} ms`, `a new student every ${jitter ? 'about ' : ''}${G} ms`,
      ['Press Step: the machine starts its first batch.', C.muted]]);
    else {
      const sumW = lastB.waits.reduce((a, b) => a + b, 0), list = lastB.waits.map(w => fmt(r1(w))).join(' + ');
      fbox(box, [`step ${batches.length}: starts at ${fmt(r1(lastB.start))} ms (${lastB.why})`,
        `batch = ${lastB.n} request${lastB.n > 1 ? 's' : ''}, step = ${fmt(r1(lastB.dur))} ms`,
        `waits = ${list} = ${fmt(r1(sumW))} ms`,
        [`throughput = ${tokens} tokens ÷ ${fmt(r1(busy))} ms = ${fmt(r1(tokens / busy * 1000))} per second`, C.cyan],
        [`average wait = ${fmt(r1(waitSum))} ÷ ${tokens} = ${fmt(r1(waitSum / tokens))} ms`, C.amber]]);
    }
    note.textContent = served >= arr.length ? `All ${arr.length} requests served. Press Reset or New data to run again.`
      : 'Amber lines are waiting: from a student’s question to the start of their step. Throughput counts tokens per second of machine work.';
    counter.textContent = `Step ${batches.length} · ${served} of ${arr.length} requests served`;
    const last = hist[hist.length - 1];
    chal.update({ B, W, G, jitter, steps: batches.length, thr: last ? r1(last.thr) : 0, wait: last ? last.wait : Infinity });
  }
  restart(true);
  return () => { playing = false; cancelAnimationFrame(raf); };
}
