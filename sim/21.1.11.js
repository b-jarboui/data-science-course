// 21.1.11 Try it: a bounded tool loop.
// The learner sets the step budget, steps or plays the loop on a question, and watches the facts still missing
// drop (or not) step by step. New question makes a fresh random series; the challenges check themselves.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges, pill } = kit;
  const BOOK2 = { ex: 'book2', series: 'Moon Garden', n: 4, ask: 2, title: 'The Silver Gate', copies: 2, shelf: 0, due: '3 December', typo: false };
  const BOOK9 = { ...BOOK2, ex: 'book9', ask: 9 };
  const SERIES = ['Moon Garden', 'Star Harbour', 'Red Fox Club', 'Ocean Clock', 'Paper Dragons'];
  const TITLES = ['The Silver Gate', 'The Hidden Map', 'A Door in the Hill', 'The Glass River', 'Night of Lanterns', 'The Last Bridge', 'The Copper Key', 'Winter Owls'];
  const DUES = ['3 December', '5 December', '9 December', '12 December'];
  const pick = a => a[rnd(0, a.length - 1)];
  let q = BOOK2, budget = 5, steps = [], status = 'ready', timer = 0, playing = false, randomDone = 0, counted = false;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const head = h('div', { class: 'sim-row', style: { marginTop: 0, marginBottom: '.6rem' } });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const playBtn = btn('Play', () => toggle());
  const budgetVal = h('span', { class: 'sim-pill', style: { color: C.amber, borderColor: C.amber } }, '5');
  const speedVal = h('span', { class: 'sim-note', style: { margin: 0 } }, '1 step / s');
  const budgetIn = h('input', { type: 'range', min: 1, max: 10, step: 1, value: 5, 'aria-label': 'Step budget',
    oninput: () => { budget = +budgetIn.value; reset(); } });
  const speedIn = h('input', { type: 'range', min: 0.5, max: 4, step: 0.5, value: 1, 'aria-label': 'Speed',
    oninput: () => { speedVal.textContent = `${speedIn.value} step${+speedIn.value === 1 ? '' : 's'} / s`; } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: a bounded tool loop'),
    h('p', { class: 'sub' }, 'The assistant calls one tool per step. Set the step budget, then press Step or Play. The loop stops when every fact is backed by a tool result, or when the budget runs out.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, head, svg,
        h('div', { class: 'sim-row' },
          btn('Step', () => { stop(); if (status === 'verified' || status === 'budget') reset(); doStep(); }, 'go'),
          playBtn, btn('Reset', () => reset())),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Step budget'), budgetIn, budgetVal),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Speed'), speedIn, speedVal),
        h('div', { class: 'sim-row' },
          btn('Book 2 (lesson)', () => { q = BOOK2; reset(); }),
          btn('Book 9 (lesson)', () => { q = BOOK9; reset(); }),
          btn('New question (random)', () => { q = randomQuestion(); reset(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Book 2: pick a budget that is too small, then press Play.',
      check: st => st.ex === 'book2' && st.status === 'budget',
      why: 'Book 2 needs 3 steps. With fewer, the loop stops before every fact is backed: the answer is cut off.' },
    { text: 'Book 2: find the smallest budget that still ends verified.',
      check: st => st.ex === 'book2' && st.status === 'verified' && st.budget === 3,
      why: 'Three steps: no match, the series list, then the catalog. Any budget of 3 or more answers it.' },
    { text: 'Book 9 with a budget of 8: predict how many steps it uses, then press Play.',
      check: st => st.ex === 'book9' && st.status === 'budget' && st.budget === 8,
      why: 'All 8. An impossible question is never verified, so it always uses the whole budget.' },
    { text: 'Press “New question” and run it to the end, 3 times. Does an answerable question ever need more than 4 steps?',
      check: st => st.randomDone >= 3,
      why: 'No: here real questions need 3 or 4 steps. So a budget of 5 answers them and still stops impossible ones early.' },
  ]);

  function randomQuestion() {
    const n = rnd(3, 6), copies = rnd(1, 3);
    return { ex: 'random', series: pick(SERIES), n, ask: Math.random() < 0.25 ? n + rnd(1, 5) : rnd(1, n),
      title: pick(TITLES), copies, shelf: rnd(0, copies), due: pick(DUES), typo: Math.random() < 0.4 };
  }

  // the tool call the model makes at step i (0-based), with its result and how many of the 2 facts are backed
  function stepAt(i) {
    const S = q.series, word = `book ${q.ask}`;
    if (q.ask > q.n) {
      if (i === 0) return { tool: 'check_catalog', arg: `${S} ${word}`, res: 'no match', bad: true, facts: 0 };
      if (i === 1) return { tool: 'check_series', arg: S, res: `only ${q.n} books`, bad: true, facts: 0 };
      const tries = [`${S.replace(' ', '')} ${q.ask}`, `${S} number ${q.ask}`, `${S}s`, `${word} ${S}`, `${S} part ${q.ask}`];
      return { tool: i % 2 ? 'check_series' : 'check_catalog', arg: tries[(i - 2) % tries.length], res: 'no match', bad: true, facts: 0 };
    }
    const plan = [{ tool: 'check_catalog', arg: `${S} ${word}`, res: 'no match', bad: true, facts: 0 }];
    if (q.typo) plan.push({ tool: 'check_series', arg: S.replace(' ', ''), res: 'no match', bad: true, facts: 0 });
    plan.push({ tool: 'check_series', arg: S, res: `book ${q.ask} = "${q.title}"`, facts: 1 });
    plan.push({ tool: 'check_catalog', arg: q.title,
      res: `${q.copies} cop${q.copies > 1 ? 'ies' : 'y'}, ${q.shelf} on shelf${q.shelf ? '' : ', first due ' + q.due}`, facts: 2 });
    return plan[i];
  }

  function doStep() {
    if (status === 'verified' || status === 'budget') return false;
    const st = stepAt(steps.length);
    steps.push(st);
    status = st.facts === 2 ? 'verified' : steps.length >= budget ? 'budget' : 'running';
    if (status !== 'running' && q.ex === 'random' && !counted) { counted = true; randomDone++; }
    draw();
    return status === 'running';
  }
  function tick() {
    if (!doStep()) { stop(); return; }
    timer = setTimeout(tick, 1000 / +speedIn.value);
  }
  function toggle() {
    if (playing) { stop(); return; }
    if (status === 'verified' || status === 'budget') reset();
    playing = true; playBtn.textContent = 'Pause';
    timer = setTimeout(tick, 150);
  }
  function stop() { playing = false; clearTimeout(timer); playBtn.textContent = 'Play'; }
  function reset() { stop(); steps = []; status = 'ready'; counted = false; budgetVal.textContent = String(budget); draw(); }

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps the text readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = 14, X1 = VW - 14;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);
  const mono = 'Consolas, monospace', sans = 'Segoe UI, Arial, sans-serif';

  function draw() {
    const k = [], used = steps.length;
    // the step budget: one slot per allowed step, filled when used
    k.push(s('text', { x: X0, y: 38, fill: C.muted, 'font-size': 13 * F, 'font-family': sans }, 'step budget'));
    const sx0 = X0 + 82 * F, gap = 6, sw = Math.min(40, (X1 - sx0) / budget - gap);
    for (let b = 0; b < budget; b++) {
      const x = sx0 + b * (sw + gap);
      k.push(s('rect', { x, y: 16, width: sw, height: 30, rx: 6, fill: b < used ? C.amber : C.card, 'fill-opacity': b < used ? 0.45 : 1, stroke: C.amber }),
        s('text', { x: x + sw / 2, y: 36, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, b + 1));
    }
    if (status === 'verified' || status === 'budget') {
      const x = sx0 + used * (sw + gap) - gap / 2;
      k.push(s('line', { x1: x, x2: x, y1: 10, y2: 52, stroke: status === 'verified' ? C.green : C.pink, 'stroke-width': 4 }));
    }

    // the step log: the last 6 calls, each with its result underneath
    const first = Math.max(0, used - 6);
    if (!used) k.push(s('text', { x: X0, y: 96, fill: C.muted, 'font-size': 14 * F, 'font-family': sans }, 'Press Step to make the first tool call.'));
    steps.slice(first).forEach((st, r) => {
      const y = 88 + r * 36, i = first + r;
      k.push(s('circle', { cx: X0 + 10, cy: y - 4, r: 10, fill: C.card, stroke: C.amber }),
        s('text', { x: X0 + 10, y: y, fill: C.amber, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, i + 1),
        s('text', { x: X0 + 28, y, fill: st.tool === 'check_series' ? C.violet : C.cyan, 'font-size': 12 * F, 'font-family': mono }, `${st.tool}("${st.arg}")`),
        s('text', { x: X0 + 28, y: y + 15, fill: st.bad ? C.pink : C.green, 'font-size': 11.5 * F, 'font-family': mono }, '→ ' + st.res));
    });

    // facts still missing versus step: the loss curve of the loop
    const CT = 318, CB = 412, CL = X0 + 34, CR = X1 - 8, xs = j => CL + j / budget * (CR - CL), ys = m => CB - m / 2 * (CB - CT);
    k.push(s('text', { x: X0, y: CT - 14, fill: C.muted, 'font-size': 12 * F, 'font-family': sans }, 'facts still missing (of 2)'),
      s('text', { x: CR, y: CB + 22, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': sans }, 'step'));
    for (const m of [0, 1, 2]) k.push(s('line', { x1: CL, x2: CR, y1: ys(m), y2: ys(m), stroke: C.line }),
      s('text', { x: CL - 8, y: ys(m) + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': mono }, m));
    for (let j = 0; j <= budget; j++) k.push(s('text', { x: xs(j), y: CB + 16, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': mono }, j));
    const pts = [[0, 2], ...steps.map((st, j) => [j + 1, 2 - st.facts])];
    k.push(s('polyline', { points: pts.map(([j, m]) => `${xs(j)},${ys(m)}`).join(' '), fill: 'none', stroke: C.amber, 'stroke-width': 3 }));
    pts.forEach(([j, m]) => k.push(s('circle', { cx: xs(j), cy: ys(m), r: 5, fill: m === 0 ? C.green : C.amber })));
    svg.replaceChildren(...k);

    // header: iteration counter and status
    const tag = { ready: ['READY', C.muted], running: ['RUNNING', C.cyan], verified: ['VERIFIED → STOP', C.green], budget: ['BUDGET USED UP → STOP', C.pink] }[status];
    head.replaceChildren(pill(`STEP ${used} / ${budget}`, C.amber), pill(tag[0], tag[1]), pill(`BOOK ${q.ask} OF ${q.series.toUpperCase()}`, C.violet));

    // formula box: this step's numbers
    const last = steps[used - 1];
    if (!last) fbox(box, [`question: is book ${q.ask} of ${q.series} on the shelf?`, `budget = ${budget} steps`, ['press Step or Play', C.muted]]);
    else fbox(box, [`step ${used} of ${budget}`, `call:   ${last.tool}("${last.arg}")`, [`result: ${last.res}`, last.bad ? C.pink : C.green],
      `facts backed: ${last.facts} of 2`,
      status === 'verified' ? ['every fact backed: VERIFIED → stop', C.green]
        : status === 'budget' ? ['budget used up → stop', C.pink]
        : [`steps left: ${budget - used} → keep going`, C.cyan]]);
    note.textContent = status === 'ready' ? 'Two facts are needed: the title of the book, and whether a copy is on the shelf.'
      : status === 'running' ? 'The loop goes on: not every fact is backed yet, and steps are left.'
      : status === 'verified' ? 'Answer: ' + (q.shelf ? `Yes, ${q.shelf} of the ${q.copies} cop${q.copies > 1 ? 'ies are' : 'y is'} on the shelf.`
        : q.copies > 1 ? `No, all ${q.copies} copies are out. The first is due back on ${q.due}.` : `No, the only copy is out. It is due back on ${q.due}.`)
      : q.ask > q.n ? 'Answer: I could not find it. Please ask at the desk. (The loop stopped at the budget, without guessing.)'
      : 'Answer: I could not find it. Please ask at the desk. (Cut off: the budget was too small for this question.)';
    chal.update({ ex: q.ex, budget, status, steps: used, randomDone });
  }
  draw();
  return () => clearTimeout(timer);
}
