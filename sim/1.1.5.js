// 1.1.5 Try it: discrete and continuous values.
// Two lines: the drinks tally (whole steps only) and the wait in seconds (any amount).
// The learner drags a marker on each line, zooms into the wait line, and sorts café quantities
// with the test "can another amount fit between two close values?".
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;

  const ITEMS = [
    ['Cups sold this morning', 'D', 'You count cups one by one: nothing fits between 4 and 5 cups.'],
    ['Time to make one latte', 'C', 'Time can be any amount, like 41.7 seconds.'],
    ['People waiting in the queue', 'D', 'You count people: there is no half person in a queue.'],
    ['Weight of a bag of coffee beans', 'C', 'Weight is measured: any amount fits between 250 and 251 grams.'],
    ['Orders written in the notebook', 'D', 'Orders are counted: 6, then 7, nothing in between.'],
    ['Temperature of a cup of tea', 'C', 'Temperature is measured: it can be 71.3 degrees.'],
    ['Chairs in the café', 'D', 'Chairs are counted in whole steps.'],
    ['Milk poured into a cup', 'C', 'Milk is measured: any amount can be poured.'],
    ['Sugar cubes in a cup', 'D', 'Cubes are counted: 2, then 3.'],
    ['Distance a customer walked to the café', 'C', 'Distance is measured: any amount fits in between.'],
  ];
  const TRAP = ['A wait written in the notebook as 120 seconds', 'C',
    'Still continuous. The clock shows whole seconds, but the wait itself could be 120.4 seconds.'];

  let drinks = 3, rawDrink = 3, wait = 120, lo = 0, hi = 240, dragging = '', triedHalf = false;
  let card = ITEMS[0], answer = '', streak = 0, trapDone = false, newMornings = 0;

  const svg = s('svg', { viewBox: '0 0 700 300' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const cardText = h('div', { class: 'sim-ch-text', style: { margin: '6px 0' } });
  const cardWhy = h('div', { class: 'sim-note' });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: steps or any amount?'),
    h('p', { class: 'sub' }, 'Drag the cyan dot along the drinks line, and the amber dot along the wait line. Watch which one can stop in between.'),
    h('div', { class: 'sim-grid' },
      h('div', {},
        h('div', { class: 'sim-card' }, svg,
          h('div', { class: 'sim-row' },
            btn('Zoom in on the wait', () => zoom(0.1), 'go'),
            btn('Zoom out', () => { lo = 0; hi = 240; draw(); }),
            btn('New café morning (random)', () => {
              drinks = rawDrink = rnd(1, 9); wait = Math.round((30 + Math.random() * 200) * 100) / 100;
              lo = 0; hi = 240; newMornings++; draw();
            }))),
        h('div', { class: 'sim-card', style: { marginTop: '12px' } },
          h('div', { class: 'sim-ch-head' }, kit.pill('SORT IT', C.violet)),
          cardText,
          h('div', { class: 'sim-row' },
            btn('Discrete (steps)', () => sort('D')),
            btn('Continuous (any amount)', () => sort('C')),
            btn('New quantity', () => deal()),
            btn('Trap card', () => deal(TRAP))),
          cardWhy)),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Try to put the drinks dot halfway between 2 and 3.',
      check: st => st.triedHalf, why: 'It snaps to 2 or 3. A count of drinks has nothing in between: it is discrete.' },
    { text: 'Make a wait of ninety and a half seconds (90.5). Zoom in to aim.',
      check: st => Math.abs(st.wait - 90.5) < 0.051, why: 'Yes. Any amount fits on the wait line: it is continuous.' },
    { text: 'Sort three quantities in a row correctly. Use “New quantity”.',
      check: st => st.streak >= 3, why: 'Well done. Ask each time: can another amount fit between two close values?' },
    { text: 'Press “Trap card” and sort it.',
      check: st => st.trapDone, why: 'Right. How a number is written does not change what the thing itself can be.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.3 : 1;
  const X0 = NARROW ? 26 : 40, X1 = VW - (NARROW ? 26 : 40), YD = 95, YW = 225;
  svg.setAttribute('viewBox', `0 0 ${VW} 300`);
  const dx = v => X0 + (v / 10) * (X1 - X0);
  const wx = v => X0 + ((v - lo) / (hi - lo)) * (X1 - X0);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function zoom(k) {
    const w = Math.max(1, (hi - lo) * k);
    lo = Math.max(0, wait - w / 2); hi = lo + w; if (hi > 240) { hi = 240; lo = hi - w; }
    draw();
  }
  function deal(item) {
    if (item) card = item;
    else { let c; do { c = ITEMS[rnd(0, ITEMS.length - 1)]; } while (c === card); card = c; }
    answer = ''; draw();
  }
  function sort(a) {
    if (answer) return;
    answer = a;
    const ok = a === card[1];
    if (card === TRAP) { if (ok) trapDone = true; }
    else streak = ok ? streak + 1 : 0;
    draw();
  }

  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    dragging = p.y < 160 ? 'd' : 'w';
    svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (!dragging) return;
    const p = toSvg(e);
    if (dragging === 'd') {
      rawDrink = clamp(((p.x - X0) / (X1 - X0)) * 10, 0, 10);
      drinks = Math.round(rawDrink);
      if (Math.abs(rawDrink - 2.5) < 0.2) triedHalf = true;
    } else {
      const span = hi - lo, dec = span <= 3 ? 100 : span <= 30 ? 10 : 1;
      wait = Math.round(clamp(lo + ((p.x - X0) / (X1 - X0)) * span, lo, hi) * dec) / dec;
    }
    draw();
  };
  svg.addEventListener('pointermove', move);
  const up = () => { dragging = ''; rawDrink = drinks; draw(); };
  svg.addEventListener('pointerup', up);
  svg.addEventListener('pointercancel', up);

  const T = (x, y, str, col, size, anchor = 'middle', w = 700) =>
    s('text', { x, y, fill: col, 'font-size': size * F, 'font-weight': w, 'text-anchor': anchor, 'font-family': 'Consolas' }, str);
  const dot = (x, y, col, r = 9) => [s('circle', { cx: x, cy: y, r: r * 2.3, fill: col, 'fill-opacity': .12 }),
    s('circle', { cx: x, cy: y, r: r * 1.5, fill: col, 'fill-opacity': .25 }), s('circle', { cx: x, cy: y, r, fill: col })];

  function draw() {
    const k = [];
    // drinks line: whole steps only
    k.push(T(X0, YD - 48, 'DRINKS (a tally)', C.cyan, 20, 'start'));
    k.push(s('line', { x1: X0, x2: X1, y1: YD, y2: YD, stroke: C.muted, 'stroke-width': 3 }));
    for (let v = 0; v <= 10; v++) {
      k.push(...dot(dx(v), YD, C.cyan, 3.5).slice(2), T(dx(v), YD + 30, v, v === drinks ? C.cyan : C.muted, 19));
    }
    if (dragging === 'd' && Math.abs(rawDrink - drinks) > 0.08) {
      k.push(s('circle', { cx: dx(rawDrink), cy: YD, r: 8, fill: 'none', stroke: C.ink, 'stroke-dasharray': '3 3' }),
        T(dx(rawDrink), YD - 20, `snaps to ${drinks}`, C.pink, 17));
    }
    k.push(...dot(dx(drinks), YD, C.cyan));
    // wait line: any amount
    const span = hi - lo, step = span <= 3 ? 0.5 : span <= 30 ? 2 : span <= 60 ? 10 : 30;
    k.push(T(X0, YW - 48, span < 240 ? `WAIT (seconds), zoomed: ${fmt2(lo)} to ${fmt2(hi)}` : 'WAIT (seconds)', C.amber, 20, 'start'));
    k.push(s('line', { x1: X0, x2: X1, y1: YW, y2: YW, stroke: C.muted, 'stroke-width': 3 }));
    const first = Math.ceil(lo / step) * step;
    const labelEvery = span > 60 ? 2 : 1;
    let n = 0;
    for (let v = first; v <= hi + 1e-9; v += step, n++) {
      k.push(s('line', { x1: wx(v), x2: wx(v), y1: YW - 6, y2: YW + 6, stroke: C.muted, 'stroke-width': 2 }));
      if (n % labelEvery === 0) k.push(T(wx(v), YW + 30, fmt2(v), C.muted, 17, 'middle', 400));
    }
    if (wait >= lo && wait <= hi) {
      k.push(...dot(wx(wait), YW, C.amber), T(wx(wait), YW - 20, fmt2(wait) + ' s', C.amber, 20));
    }
    svg.replaceChildren(...k);

    const between = (Math.round(wait * 100) / 100) % 1 !== 0;
    fbox(box, [
      [`drinks = ${drinks}`, C.cyan],
      `  next: ${drinks + 1}, nothing between`,
      [`wait   = ${fmt2(wait)} s`, C.amber],
      between ? '  between whole seconds: fine' : '  zoom: more amounts fit',
      ['test: room in between?', C.violet],
      '  drinks: no  → discrete',
      '  wait:   yes → continuous',
    ]);
    note.textContent = dragging === 'd' ? 'The drinks dot jumps from step to step. It cannot stop between two whole numbers.'
      : span < 240 ? 'Zoomed in: there is still room between the marks. A wait can end anywhere.'
      : 'Discrete values come in separate steps. Continuous values can be any amount along the line.';
    cardText.textContent = card[0];
    cardWhy.style.color = !answer ? C.muted : answer === card[1] ? C.green : C.pink;
    cardWhy.textContent = !answer ? 'Ask: can another amount fit between two close values?'
      : (answer === card[1] ? 'Correct. ' : 'Not quite. ') + (card[1] === 'D' ? 'Discrete. ' : 'Continuous. ') + card[2];
    chal.update({ triedHalf, wait, streak, trapDone, newMornings });
  }
  function fmt2(x) { const r = Math.round(x * 100) / 100; return Number.isInteger(r) ? String(r) : String(r); }
  draw();
  return () => {};
}
