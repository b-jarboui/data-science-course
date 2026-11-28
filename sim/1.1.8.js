// 1.1.8 Try it: reading the adding-up sign (sigma).
// The learner sets where the counter starts (below the sign) and stops (above it),
// chooses what is written on the right (the price x i, or the counter i itself),
// then steps the counter down the café's order list and watches the total grow.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = [3, 4, 5, 4, 4, 3];
  let v = START.slice(), lo = 1, hi = 6, body = 'x', ctr = 0, total = 0, done = false, timer = 0;
  let random = false, randomRuns = 0, ranFull = false;

  const svg = s('svg', { viewBox: '0 0 700 420' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const bodyBtn = btn('', () => { body = body === 'x' ? 'i' : 'x'; reset(); });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: read the adding-up sign'),
    h('p', { class: 'sub' }, 'Below the sign: where the counter starts. Above: the last order to add. On the right: what to add each time. Tap a price to change it.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Start −1', () => { lo = Math.max(1, lo - 1); reset(); }), btn('Start +1', () => { lo = Math.min(hi, lo + 1); reset(); }),
          btn('Top −1', () => { hi = Math.max(lo, hi - 1); reset(); }), btn('Top +1', () => { hi = Math.min(v.length, hi + 1); reset(); })),
        h('div', { class: 'sim-row' },
          btn('Step: move the counter', () => step(), 'go'),
          btn('Run to the end', () => run()),
          bodyBtn,
          btn('New prices (random)', () => { v = v.map(() => rnd(1, 9)); random = true; reset(); }),
          btn('Add an order', () => { if (v.length < 10) { v.push(rnd(1, 9)); reset(); } }),
          btn('Remove an order', () => { if (v.length > 2) { v.pop(); hi = Math.min(hi, v.length); lo = Math.min(lo, hi); reset(); } }),
          btn('Start again', () => { v = START.slice(); lo = 1; hi = 6; body = 'x'; random = false; reset(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Press “Step” until the counter reaches the number on top. What is the revenue?',
      check: st => st.ranFull && st.total === 23,
      why: 'Twenty-three dollars: the counter went from 1 to 6, and each time we added the price on the right.' },
    { text: 'Change the small numbers so the sign adds only orders 2 to 4. Then run it.',
      check: st => st.done && st.lo === 2 && st.hi === 4 && st.body === 'x',
      why: 'Right: below says start at 2, above says stop at 4. So 4 + 5 + 4 = 13.' },
    { text: 'The trap: switch the right side to “i” and run orders 1 to 6.',
      check: st => st.done && st.body === 'i' && st.lo === 1 && st.hi === 6 && st.n === 6,
      why: 'Now the sign adds the counters, 1 + 2 + … + 6 = 21, not the prices. Always add what stands on the right.' },
    { text: 'Press “New prices”, then run the sign. Does it always give all the prices added up?',
      check: st => st.randomRuns >= 1,
      why: 'Always. The sign is only a short way to write the same plus signs, whatever the prices are.' },
  ]);

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.2 : 1.35;
  const TX = NARROW ? 60 : 40, RH = NARROW ? 36 : 46, TY = 48;
  const colO = TX + 40 * F, colN = TX + 110 * F, colP = TX + 180 * F;
  let SX = 470, SY = 200;
  function layout() {   // phone: the sign sits under the table
    const tb = TY + 18 + RH * v.length;
    if (NARROW) { SX = VW / 2 - 30; SY = tb + 110; svg.setAttribute('viewBox', `0 0 ${VW} ${tb + 260}`); }
    else { SX = 500; SY = Math.max(150, (TY + tb) / 2); svg.setAttribute('viewBox', `0 0 ${VW} ${Math.max(tb + 20, SY + 110 * F + 20)}`); }
  }

  function reset() { clearInterval(timer); ctr = 0; total = 0; done = false; draw(); }
  function term(i) { return body === 'x' ? v[i - 1] : i; }
  function step() {
    if (done) return;
    if (ctr === 0) { ctr = lo; total = term(ctr); }
    else if (ctr < hi) { ctr++; total += term(ctr); }
    if (ctr >= hi) {
      done = true;
      if (lo === 1 && hi === v.length && body === 'x') { ranFull = true; if (random) randomRuns++; }
    }
    draw();
  }
  function run() { clearInterval(timer); if (done) reset(); timer = setInterval(() => { step(); if (done) clearInterval(timer); }, 450); }

  // tap a price to raise it by one (1..9, then back to 1)
  svg.addEventListener('pointerdown', e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    const q = p.matrixTransform(svg.getScreenCTM().inverse());
    const k = Math.floor((q.y - TY - 18) / RH);
    if (q.x < colP + 40 && q.x > colN + 20 && k >= 0 && k < v.length) { v[k] = v[k] % 9 + 1; reset(); }
  });

  const T = (x, y, txt, o = {}) => s('text', Object.assign({ x, y, fill: C.ink, 'font-size': 17 * F, 'font-weight': 700,
    'text-anchor': 'middle', 'font-family': 'Consolas' }, o), txt);
  const X = (x, y, idx, col, size) => s('text', { x, y, fill: col, 'font-size': size, 'font-weight': 700, 'text-anchor': 'middle',
    'font-family': 'Segoe UI' }, 'x', s('tspan', { 'font-size': size * 0.6, dy: size * 0.22 }, idx));

  function draw() {
    layout();
    const k = [];
    k.push(T(colO, TY, 'order', { fill: C.cyan, 'font-size': 14 * F }), T(colN, TY, 'name', { fill: C.violet, 'font-size': 14 * F }),
      T(colP, TY, 'price $', { fill: C.amber, 'font-size': 14 * F }),
      s('line', { x1: TX, x2: colP + 36 * F, y1: TY + 10, y2: TY + 10, stroke: C.cyan, 'stroke-width': 2 }));
    v.forEach((p, i) => {
      const n = i + 1, y = TY + 18 + RH * i, inRange = n >= lo && n <= hi, added = ctr > 0 && n >= lo && n <= ctr;
      if (inRange) k.push(s('rect', { x: TX, y, width: colP + 36 * F - TX, height: RH - 4, rx: 8,
        fill: added ? C.green : '#ffffff', 'fill-opacity': added ? 0.16 : 0.04 }));
      k.push(T(colO, y + RH / 2 + 2, n, { fill: body === 'i' && inRange ? C.pink : C.cyan }),
        X(colN, y + RH / 2 + 2, n, C.violet, 20 * F),
        T(colP, y + RH / 2 + 2, p, { fill: body === 'x' && inRange ? C.amber : C.muted, 'font-size': 20 * F }));
      if (n === ctr) k.push(s('path', { d: `M ${TX - 14} ${y + RH / 2 - 8} l 12 8 l -12 8 z`, fill: C.green }),
        T(TX - 4, y + RH / 2 - 10, 'i', { fill: C.green, 'font-size': 14 * F }));
    });
    // the sign
    k.push(T(SX, SY - 58 * F, hi, { fill: C.amber, 'font-size': 26 * F }),
      s('text', { x: SX, y: SY + 30 * F, fill: C.cyan, 'font-size': 110 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Segoe UI' }, 'Σ'),
      T(SX, SY + 66 * F, `i = ${lo}`, { fill: C.green, 'font-size': 22 * F }),
      body === 'x' ? X(SX + 80 * F, SY + 10 * F, 'i', C.violet, 48 * F) : T(SX + 70 * F, SY + 10 * F, 'i', { fill: C.pink, 'font-size': 48 * F, 'font-family': 'Segoe UI' }),
      T(SX, SY + 110 * F, done ? `= ${total}` : (ctr ? `so far ${total}` : ''), { fill: C.amber, 'font-size': 24 * F }));
    svg.replaceChildren(...k);

    const terms = []; for (let n = lo; n <= (ctr || lo - 1); n++) terms.push(term(n));
    fbox(box, [
      `start (below) = ${lo}`, `stop  (above) = ${hi}`,
      [`right side    = ${body === 'x' ? 'x i, the price' : 'i, the counter'}`, body === 'x' ? C.violet : C.pink],
      ctr ? `counter at ${ctr}` : 'counter not started',
      [`total = ${terms.length ? terms.join(' + ') + ' = ' + total : '0'}`, C.amber]]);
    note.textContent = done ? 'The counter reached the number on top, so we stop.'
      : 'Press Step: the counter starts at the number below and moves down by one each time.';
    bodyBtn.textContent = body === 'x' ? 'Right side: x i → i' : 'Right side: i → x i';
    chal.update({ total, done, lo, hi, body, n: v.length, ranFull, randomRuns });
  }
  draw();
  return () => clearInterval(timer);
}
