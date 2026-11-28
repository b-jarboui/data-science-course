// 21.2.1 Try it: build a fair test set.
// The learner changes last month's real questions per topic, builds a test card by card,
// compares it with the fair mix (test size × proportion), draws the cards at random and runs assistant A.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const BLUE = '#60a5fa';
  const TOP = [['Hours', C.cyan], ['Loans', C.pink], ['Rooms', C.amber]];
  const RATE = [3 / 5, 3 / 3, 1 / 2];   // assistant A on our 10 cards: hours 3 of 5, loans 3 of 3, rooms 1 of 2
  const START = [100, 60, 40];
  let log = START.slice(), N = 10, mix = [5, 3, 2], how = 'fair', run = null, random = false, trapRun = false, fairRuns = 0;

  const sum = a => a.reduce((x, y) => x + y, 0);
  const r1 = x => Math.round(x * 10) / 10, r2 = x => Math.round(x * 100) / 100;

  function slider(label, min, max, step, get, set) {
    const out = h('span', { class: 'sim-note', style: { margin: 0, minWidth: '9.5em' } });
    const inp = h('input', { type: 'range', min, max, step, value: get(), oninput: e => { set(+e.target.value); changed(); } });
    return { el: h('div', { class: 'sim-row', style: { alignItems: 'center', marginTop: '.4rem' } }, out, inp),
      sync() { inp.value = get(); out.textContent = `${label}: ${get()}`; } };
  }
  const sliders = [
    ...TOP.map(([name], t) => slider(`${name} questions`, 10, 160, 10, () => log[t], v => { log[t] = v; mix[t] = Math.min(mix[t], v); })),
    slider('Test size', 5, 20, 1, () => N, v => { N = v; })];

  const svg = s('svg', { viewBox: '0 0 700 420' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: build a fair test'),
    h('p', { class: 'sub' }, 'Each dot is one real question from last month, sorted by topic. Build a small test with the same mix, draw its cards at random, and run assistant A.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', {}, ...sliders.map(x => x.el)),
        h('div', { class: 'sim-row' }, ...TOP.flatMap(([n], t) => [btn(`${n} −1`, () => bump(t, -1)), btn(`${n} +1`, () => bump(t, 1))])),
        h('div', { class: 'sim-row' },
          btn('Use the fair mix', () => { mix = fairMix(); how = 'fair'; changed(); }, 'go'),
          btn('Trap: all hours', () => { mix = [Math.min(N, log[0]), 0, 0]; how = 'trap'; changed(); }),
          btn('Draw at random & run A', runTest, 'go'),
          btn('New data (random)', () => { log = [rnd(2, 16) * 10, rnd(1, 12) * 10, rnd(1, 10) * 10]; mix = mix.map((m, t) => Math.min(m, log[t])); random = true; changed(); }),
          btn('Start again', () => { log = START.slice(); N = 10; mix = [5, 3, 2]; how = 'fair'; random = false; changed(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Keep the test size at 10. Use −1 / +1 to build the fair mix yourself.',
      check: st => st.N === 10 && st.fair && st.how === 'manual', why: 'Yes: 5 hours, 3 loans, 2 rooms, the same 50% · 30% · 20% as the real questions.' },
    { text: 'Press “New data”, then build a fair 20-question test.',
      check: st => st.random && st.N === 20 && st.fair, why: 'Each topic gets 20 × its proportion, rounded so the cards still add up to 20.' },
    { text: 'Press “Trap: all hours”, then run the test. What does the score tell you about rooms?',
      check: st => st.trapRun, why: 'Nothing: with no rooms cards, a rooms failure like booking room B12 can never show up.' },
    { text: 'Run a fair test 3 times. Does the score stay exactly the same?',
      check: st => st.fairRuns >= 3, why: 'It moves a little each time: a small test is rough, but every topic is always checked.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1, VH = 420;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const PB = 205, pitch = 11, PCX = [VW / 6, VW / 2, 5 * VW / 6];
  const K = NARROW ? 10 : 20, CW = Math.min(30, (VW - 20) / K - 4), CHT = 46;

  function fairMix() {
    const tot = sum(log), ex = log.map(c => N * c / tot), base = ex.map(Math.floor);
    let left = N - sum(base);
    ex.map((e, t) => [e - base[t], t]).sort((a, b) => b[0] - a[0]).forEach(([, t]) => { if (left > 0) { base[t]++; left--; } });
    return base;
  }
  const isFair = () => sum(mix) === N && mix.every((m, t) => Math.abs(m - N * log[t] / sum(log)) < 1);

  function changed() { run = null; draw(); }
  function bump(t, d) {
    const nx = mix[t] + d;
    if (nx < 0 || nx > log[t] || sum(mix) + d > 20) return;
    mix[t] = nx; how = 'manual'; changed();
  }
  function runTest() {
    if (!sum(mix)) return;
    const picks = mix.map((m, t) => {
      const pool = Array.from({ length: log[t] }, (_, i) => i);
      for (let i = 0; i < m; i++) { const j = i + Math.floor(Math.random() * (pool.length - i)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      return pool.slice(0, m);
    });
    run = { picks, marks: mix.map((m, t) => Array.from({ length: m }, () => Math.random() < RATE[t])) };
    if (isFair()) fairRuns++;
    if (mix[0] > 0 && !mix[1] && !mix[2]) trapRun = true;
    draw();
  }

  function draw() {
    const tot = sum(log), fair = isFair(), n = sum(mix), k = [];
    // the three piles of real questions
    TOP.forEach(([name, col], t) => {
      const picked = new Set(run ? run.picks[t] : []);
      for (let j = 0; j < log[t]; j++) {
        const cx = PCX[t] + (j % 10 - 4.5) * pitch, cy = PB - (Math.floor(j / 10) + 0.5) * pitch;
        k.push(picked.has(j) ? s('circle', { cx, cy, r: 5.2, fill: C.ink, stroke: col, 'stroke-width': 2 })
          : s('circle', { cx, cy, r: 3.8, fill: col, 'fill-opacity': .85 }));
      }
      k.push(s('line', { x1: PCX[t] - 5.8 * pitch, x2: PCX[t] + 5.8 * pitch, y1: PB + 2, y2: PB + 2, stroke: col }),
        s('text', { x: PCX[t], y: PB + 22 * F, fill: col, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, name.toUpperCase()),
        s('text', { x: PCX[t], y: PB + 40 * F, fill: col, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${log[t]} · ${fmt(r1(100 * log[t] / tot))}%`));
    });
    // the test cards, topic by topic
    const cards = mix.flatMap((m, t) => Array.from({ length: m }, (_, i) => ({ t, ok: run ? run.marks[t][i] : null })));
    k.push(s('text', { x: VW / 2, y: 286, fill: n === N ? C.ink : C.amber, 'font-size': 14 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `TEST: ${n} CARDS · TARGET ${N}`));
    cards.forEach((c, i) => {
      const r = Math.floor(i / K), inRow = Math.min(K, cards.length - r * K), x0 = (VW - (inRow * (CW + 4) - 4)) / 2;
      const x = x0 + (i % K) * (CW + 4), y = 298 + r * 56, col = TOP[c.t][1];
      k.push(s('rect', { x, y, width: CW, height: CHT, rx: 4, fill: col, 'fill-opacity': .2, stroke: col }),
        s('text', { x: x + CW / 2, y: y + 17, fill: C.ink, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, TOP[c.t][0][0]));
      if (c.ok !== null) k.push(s('text', { x: x + CW / 2, y: y + 38, fill: c.ok ? C.green : C.pink, 'font-size': 16 * F, 'font-weight': 700, 'text-anchor': 'middle' }, c.ok ? '✓' : '✗'));
    });
    svg.replaceChildren(...k);

    const lines = [`real: ${log.join(' + ')} = ${tot}`];
    TOP.forEach(([name, col], t) => lines.push([`${name.toLowerCase()}: ${N} × ${fmt(r1(100 * log[t] / tot))}% = ${fmt(r2(N * log[t] / tot))}`, col]));
    lines.push([`your mix: ${mix.join(' + ')} = ${n}`, fair ? C.green : C.amber]);
    if (run) {
      const right = run.marks.flat().filter(Boolean).length;
      lines.push([`A right: ${right} of ${n} = ${fmt(r1(100 * right / n))}%`, BLUE]);
      TOP.forEach(([name], t) => { if (!mix[t]) lines.push([`${name.toLowerCase()}: not tested`, C.pink]); });
    }
    fbox(box, lines);
    note.textContent = run && !mix[2] ? 'No rooms cards: this score says nothing about rooms, where A fails on room B12.'
      : run ? 'The white dots are the questions drawn at random from each pile. Run again: new cards, a slightly different score.'
      : fair ? 'Same mix as the real questions: a thin slice of the cake, every layer in the same thickness.'
      : n !== N ? `Your test has ${n} cards, but the target size is ${N}.`
      : 'Not the same mix as the real questions: some topics get too many cards, some too few.';
    sliders.forEach(x => x.sync());
    chal.update({ N, fair, how, random, trapRun, fairRuns });
  }
  draw();
  return () => {};
}
