// 10.2.3 Try it: a slope for each neighborhood.
// The learner drags the four rent cards up or down, sets the rule's four numbers with sliders,
// fits the rule with or without the product term, makes random cards, and solves small challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  // cards A, E, D, H of chapter 10.2 as [size steps, switch]; rents in dollars a month
  const CARDS = [[0, 0], [1, 0], [0, 1], [1, 1]];
  const START = [980, 1060, 1020, 1140], OLD = [970, 100, 60, 0];
  const LABELS = ['Cedar small  ', 'Cedar big    ', 'Station small', 'Station big  '];
  const NAMES = ['start', 'per size step', 'Station gap', 'Station extra'];
  const COLS = [C.ink, C.cyan, C.amber, C.violet];
  const LIM = [[800, 1300], [-100, 300], [-150, 250], [-200, 250]];
  let rent = START.slice(), b = OLD.slice(), mode = 'start', moved = false, random = false, additiveAfterNew = false, range = null;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const vals = b.map(() => h('span', { style: { font: '700 1rem Consolas, monospace', minWidth: '5ch' } }));
  const sliders = b.map((_, i) => h('input', { type: 'range', min: LIM[i][0], max: LIM[i][1], step: 5, value: b[i],
    style: { flex: '1 1 8rem' }, oninput: e => { b[i] = +e.target.value; mode = 'hand'; draw(); } }));
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: a slope for each neighborhood'),
    h('p', { class: 'sub' }, 'Each mark is one flat: circles are Cedar, squares are Station. Drag a mark up or down to change its rent. Move the sliders to change the rule’s four numbers.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        ...NAMES.map((n, i) => h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { style: { minWidth: '8.5rem', color: COLS[i], fontWeight: 650 } }, n), sliders[i], vals[i])),
        h('div', { class: 'sim-row' },
          btn('Fit with product term', () => fit(true), 'go'),
          btn('Fit without product term', () => fit(false)),
          btn('New data (random)', newData),
          btn('Start again', () => { rent = START.slice(); setB(OLD); mode = 'start'; moved = random = additiveAfterNew = false; range = null; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const pred = (x, sw) => b[0] + b[1] * x + b[2] * sw + b[3] * x * sw;
  const r2 = x => Math.round(x * 100) / 100;
  const money = v => (v < 0 ? '−' : '') + '$' + fmt(Math.abs(r2(v))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const term = (v, tail) => `${v < 0 ? '−' : '+'} ${fmt(Math.abs(r2(v)))}${tail}`;

  const chal = challenges(ch, [
    { text: 'Use the sliders (not the fit buttons) to make the rule hit all four cards: no pink miss lines.',
      check: st => st.maxMiss === 0 && st.mode === 'hand',
      why: 'Yes! Start 980, +80 per step, +40 gap, +40 extra: with a product term, the rule can match every card.' },
    { text: 'Drag the cards so both neighborhoods rise by the same amount, then press “Fit with product term”.',
      check: st => st.mode === 'fit' && st.moved && st.b3 === 0,
      why: 'The Station extra is 0: when both rises are equal, the product term has nothing to add.' },
    { text: 'Make Station rise by less than Cedar, then fit with the product term. What sign does the Station extra get?',
      check: st => st.mode === 'fit' && st.b3 < 0,
      why: 'Negative: the product term can also take some rise away, so Station rises less than Cedar.' },
    { text: 'Press “New data”, then “Fit without product term”. Does the rule still hit every card?',
      check: st => st.additiveAfterNew,
      why: 'Usually not: without a product term both lines must rise by the same amount, so the rule splits the difference and misses.' },
  ]);

  function setB(v) { b = v.slice(); sliders.forEach((el, i) => { el.value = b[i]; }); }
  function fit(product) {
    const [a, e, d, hh] = rent;
    if (product) setB([a, e - a, d - a, hh - d - e + a]);
    else { const rise = (e - a + hh - d) / 2, gap = (d - a + hh - e) / 2; setB([(a + e + d + hh) / 4 - rise / 2 - gap / 2, rise, gap, 0]); }
    mode = product ? 'fit' : 'additive';
    if (!product && random) additiveAfterNew = true;
    range = null; draw();
  }
  function newData() {
    const a = rnd(90, 105) * 10, gap = rnd(-4, 10) * 10, riseC = rnd(4, 16) * 10, riseS = rnd(4, 20) * 10;
    rent = [a, a + riseC, a + gap, a + gap + riseS];
    random = moved = true; additiveAfterNew = false; range = null; draw();
  }

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = NARROW ? 58 : 74, X1 = VW - (NARROW ? 72 : 110), BASE = 372, TOP = 46;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);
  const px = x => X0 + (x + 0.35) / 2.7 * (X1 - X0);
  let geo = null;
  function getRange() {
    if (dragging >= 0 && range) return range;
    const all = rent.slice();
    for (const sw of [0, 1]) for (const x of [0, 1, 2]) all.push(pred(x, sw));
    const lo = Math.floor((Math.min(...all) - 40) / 100) * 100, hi = Math.ceil((Math.max(...all) + 40) / 100) * 100;
    return range = [lo, Math.max(hi, lo + 300)];
  }

  // drag a card: pointer height sets its rent
  let dragging = -1;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    let best = -1, bd = 40 * F;
    CARDS.forEach(([x], i) => { const d = Math.hypot(p.x - px(x), p.y - geo.py(rent[i])); if (d < bd) { bd = d; best = i; } });
    if (best < 0) return;
    dragging = best; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    rent[dragging] = Math.max(700, Math.min(1700, Math.round(geo.inv(p.y) / 10) * 10));
    moved = true; draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; range = null; draw(); });

  function draw() {
    const [lo, hi] = getRange(), py = r => BASE - (r - lo) / (hi - lo) * (BASE - TOP);
    geo = { py, inv: y => lo + (BASE - y) / (BASE - TOP) * (hi - lo) };
    const k = [], gstep = hi - lo > 800 ? 200 : 100, mono = 'Consolas';
    for (let g = lo; g <= hi; g += gstep) {
      k.push(s('line', { x1: X0, x2: X1 + 40, y1: py(g), y2: py(g), stroke: C.line }),
        s('text', { x: X0 - 8, y: py(g) + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': mono }, money(g)));
    }
    [0, 1, 2].forEach(x => k.push(
      s('text', { x: px(x), y: BASE + 24, fill: x < 2 ? C.ink : C.muted, 'font-size': 14 * F, 'text-anchor': 'middle', 'font-family': mono }, `${40 + 10 * x} m²`),
      s('text', { x: px(x), y: BASE + 44 * F, fill: C.green, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': mono }, `x = ${x}`)));
    // legend
    [[0, 'Cedar (s = 0)'], [1, 'Station (s = 1)']].forEach(([sw, t], i) => {
      const lx = X0 + 8 + i * 150 * F, col = sw ? C.amber : C.cyan;
      k.push(sw ? s('rect', { x: lx - 6, y: 14, width: 12, height: 12, fill: col }) : s('circle', { cx: lx, cy: 20, r: 6.5, fill: col }),
        s('text', { x: lx + 12, y: 25, fill: col, 'font-size': 14 * F, 'font-weight': 700 }, t));
    });
    // the rule: one line per neighborhood, dashed past the cards (60 m²)
    for (const sw of [0, 1]) {
      const col = sw ? C.amber : C.cyan;
      k.push(s('line', { x1: px(0), x2: px(1), y1: py(pred(0, sw)), y2: py(pred(1, sw)), stroke: col, 'stroke-width': 3, 'stroke-opacity': .75 }),
        s('line', { x1: px(1), x2: px(2), y1: py(pred(1, sw)), y2: py(pred(2, sw)), stroke: col, 'stroke-width': 3, 'stroke-opacity': .5, 'stroke-dasharray': '7 6' }),
        s('text', { x: px(2) + 12, y: py(pred(2, sw)) + 5, fill: col, 'font-size': 13 * F, 'font-family': mono }, money(pred(2, sw))));
    }
    // cards and their misses
    const misses = CARDS.map(([x, sw], i) => rent[i] - pred(x, sw));
    CARDS.forEach(([x, sw], i) => {
      const cx = px(x), cy = py(rent[i]), col = sw ? C.amber : C.cyan, m = misses[i];
      if (Math.abs(m) >= 0.5) k.push(
        s('line', { x1: cx, x2: cx, y1: cy, y2: py(pred(x, sw)), stroke: C.pink, 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }),
        s('text', { x: cx + (x ? 14 : -14), y: (cy + py(pred(x, sw))) / 2 + 4, fill: C.pink, 'font-size': 13 * F, 'text-anchor': x ? 'start' : 'end', 'font-family': mono }, 'miss ' + money(m)));
      if (sw) k.push(s('rect', { x: cx - 15, y: cy - 15, width: 30, height: 30, fill: col, 'fill-opacity': .18, rx: 3 }), s('rect', { x: cx - 8, y: cy - 8, width: 16, height: 16, fill: col }));
      else k.push(s('circle', { cx, cy, r: 16, fill: col, 'fill-opacity': .18 }), s('circle', { cx, cy, r: 8.5, fill: col }));
      if (i === dragging) k.push(s('circle', { cx, cy, r: 22, fill: 'none', stroke: '#ffffff', 'stroke-opacity': .5 }));
      k.push(s('text', { x: cx, y: sw ? cy - 22 : cy + 32, fill: col, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, money(rent[i])));
    });
    svg.replaceChildren(...k);

    const maxMiss = Math.round(Math.max(...misses.map(Math.abs)) * 1000) / 1000;
    fbox(box, [`rent = ${fmt(r2(b[0]))} ${term(b[1], ' × x')} ${term(b[2], ' × s')}`, ['       ' + term(b[3], ' × x × s'), C.violet],
      ...CARDS.map((_, i) => {
        const m = misses[i], p = rent[i] - m;
        return [`${LABELS[i]} ${money(p)}, card ${money(rent[i])}` + (Math.abs(m) >= 0.5 ? `  miss ${money(m)}` : '  ✓'), Math.abs(m) >= 0.5 ? C.pink : C.green];
      }),
      [`Cedar rise   = ${fmt(r2(b[1]))}`, C.cyan],
      [`Station rise = ${fmt(r2(b[1]))} ${term(b[3], '')} = ${fmt(r2(b[1] + b[3]))}`, C.amber]]);
    note.textContent = maxMiss === 0
      ? (b[3] !== 0 ? 'The rule hits all four cards. The product term gives Station its own rise.'
        : 'The rule hits all four cards. Both neighborhoods rise by the same amount here, so no product term is needed.')
      : b[3] === 0 ? 'The Station extra is 0, so both lines rise by the same amount: they stay parallel.'
        : 'Pink dashed lines show how far the rule misses each card. Past 50 m², the dashed lines show what the rule predicts.';
    NAMES.forEach((_, i) => { vals[i].textContent = fmt(r2(b[i])); });
    chal.update({ maxMiss, mode, b3: r2(b[3]), moved, additiveAfterNew });
  }
  draw();
  return () => {};
}
