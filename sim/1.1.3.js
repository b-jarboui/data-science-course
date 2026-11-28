// 1.1.3 Try it: categorical or numerical?
// The learner taps a column of the café notebook, tries to add it up, and sorts it as names or amounts.
// Tapping a cell changes that value; "New orders" makes a fresh random morning.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const COLS = [
    { key: 'order', name: 'Order', kind: 'names', tag: true },
    { key: 'drink', name: 'Drink', kind: 'names', opts: ['coffee', 'tea', 'juice'] },
    { key: 'size', name: 'Size', kind: 'names', opts: ['small', 'medium', 'large'] },
    { key: 'price', name: 'Price ($)', kind: 'amounts', unit: 'dollars', lo: 2, hi: 6, step: 1 },
    { key: 'wait', name: 'Wait (s)', kind: 'amounts', unit: 'seconds', lo: 30, hi: 240, step: 30 },
    { key: 'take', name: 'Takeaway', kind: 'names', opts: ['yes', 'no'] },
  ];
  const START = [
    ['coffee', 'small', 3, 120, 'yes'], ['tea', 'medium', 4, 90, 'no'], ['coffee', 'large', 5, 150, 'yes'],
    ['juice', 'medium', 4, 60, 'no'], ['coffee', 'medium', 4, 180, 'yes'], ['tea', 'small', 3, 60, 'no'],
  ];
  const fresh = rows => rows.map((r, i) => ({ order: i + 1, drink: r[0], size: r[1], price: r[2], wait: r[3], take: r[4] }));
  let data = fresh(START), sel = 1, sorted = {}, tried = {}, news = 0, msg = '';

  const svg = s('svg', { viewBox: '0 0 700 360' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: names or amounts?'),
    h('p', { class: 'sub' }, 'Tap a column to pick it. Tap a value to change it. Then add the column up, and sort it.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Add up this column', () => { tried[COLS[sel].key] = true; msg = 'add'; draw(); }, 'go'),
          btn('Names → categorical', () => sortAs('names')),
          btn('Amounts → numerical', () => sortAs('amounts'))),
        h('div', { class: 'sim-row' },
          btn('New orders (random)', () => { data = fresh(Array.from({ length: 6 }, randRow)); news++; msg = ''; draw(); }),
          btn('Start again', () => { data = fresh(START); sorted = {}; tried = {}; news = 0; msg = ''; sel = 1; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const pick = a => a[rnd(0, a.length - 1)];
  function randRow() {
    return [pick(COLS[1].opts), pick(COLS[2].opts), rnd(2, 6), 30 * rnd(1, 8), pick(COLS[5].opts)];
  }
  function sortAs(kind) { sorted[COLS[sel].key] = kind; msg = 'sort'; draw(); }
  const allRight = () => COLS.every(c => sorted[c.key] === c.kind);

  const chal = challenges(ch, [
    { text: 'Tap the Drink column and press “Add up this column”. Then sort it.',
      check: st => st.tried.drink && st.sorted.drink === 'names',
      why: 'Coffee plus tea has no answer. Drinks are names for groups, so you count them: categorical.' },
    { text: 'Sort Price and Wait.',
      check: st => st.sorted.price === 'amounts' && st.sorted.wait === 'amounts',
      why: 'Each price measures how many dollars, each wait how many seconds. Totals and gaps make sense: numerical.' },
    { text: 'The trap: add up the Order column, then sort it.',
      check: st => st.tried.order && st.sorted.order === 'names',
      why: 'One to six adds to twenty-one, which means nothing. Order numbers are only name tags.' },
    { text: 'Sort all six columns, then press “New orders”. Do the kinds change?',
      check: st => st.all && st.news >= 1,
      why: 'No. The kind depends on what a column measures, not on the values of one morning.' },
  ]);

  // geometry
  // one compact drawing: the card is at most ~600 px wide, so a 440-wide viewBox keeps the text big on laptop and phone
  const NARROW = true, VW = 440, F = 1.0;
  svg.setAttribute('viewBox', `0 0 ${VW} 392`);
  const X0 = 6, CWD = (VW - 12) / 6, TOP = 8, RH = 40, TAGY = TOP + RH * 7 + 34;
  const cx = i => X0 + CWD * (i + 0.5);

  function cellText(c, row) { return String(row[c.key]); }
  function tapCell(r, i) {
    const c = COLS[i], row = data[r];
    if (c.tag) return;
    if (c.opts) row[c.key] = c.opts[(c.opts.indexOf(row[c.key]) + 1) % c.opts.length];
    else { row[c.key] += c.step; if (row[c.key] > c.hi) row[c.key] = c.lo; }
    msg = '';
    draw();
  }

  svg.addEventListener('pointerdown', e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    const q = p.matrixTransform(svg.getScreenCTM().inverse());
    const i = Math.floor((q.x - X0) / CWD), r = Math.floor((q.y - TOP) / RH) - 1;
    if (i < 0 || i > 5 || q.y > TOP + RH * 7) return;
    if (i !== sel) { sel = i; msg = ''; draw(); return; }
    if (r >= 0 && r < 6) tapCell(r, i);
  });

  function draw() {
    const k = [];
    k.push(s('rect', { x: X0, y: TOP, width: CWD * 6, height: RH * 7, rx: 12, fill: C.card, stroke: C.line }),
      s('rect', { x: X0, y: TOP, width: CWD * 6, height: RH, rx: 12, fill: C.cyan, 'fill-opacity': .14 }));
    COLS.forEach((c, i) => {
      const on = i === sel;
      if (on) k.push(s('rect', { x: X0 + CWD * i + 2, y: TOP + 2, width: CWD - 4, height: RH * 7 - 4, rx: 8,
        fill: C.cyan, 'fill-opacity': .08, stroke: C.cyan, 'stroke-width': 2.5 }));
      k.push(s('text', { x: cx(i), y: TOP + RH * 0.62, fill: C.cyan, 'font-size': 14 * F, 'font-weight': 700,
        'text-anchor': 'middle', 'font-family': 'Segoe UI, sans-serif' }, c.name));
      data.forEach((row, r) => k.push(s('text', { x: cx(i), y: TOP + RH * (r + 1.65), fill: C.ink,
        'font-size': 16 * F, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace' }, cellText(c, row))));
      const t = sorted[c.key];
      const label = !t ? '?' : t === 'names' ? 'CATEGORICAL' : 'NUMERICAL';
      const tc = !t ? C.muted : t === c.kind ? (t === 'names' ? C.pink : C.amber) : C.muted;
      // tags in two staggered rows, so each one can be wider than its column
      const ty = TAGY + (i % 2 ? 36 : 0), tw = CWD * 1.5, tx = Math.max(4, Math.min(VW - 4 - tw, cx(i) - tw / 2));
      k.push(s('line', { x1: cx(i), x2: cx(i), y1: TOP + RH * 7, y2: ty - 16, stroke: tc, 'stroke-width': 1.5 }),
        s('rect', { x: tx, y: ty - 16, width: tw, height: 28, rx: 14, fill: C.bg, stroke: tc }),
        s('text', { x: tx + tw / 2, y: ty + 3, fill: tc, 'font-size': (NARROW ? 13 : 15), 'font-weight': 700,
          'text-anchor': 'middle', 'font-family': 'Consolas, monospace' }, label + (t && t !== c.kind ? ' ✗' : '')));
    });
    svg.replaceChildren(...k);

    // formula box: what this column lets you work out
    const c = COLS[sel], vals = data.map(r => r[c.key]);
    const lines = [[`column: ${c.name}`, C.cyan]];
    if (msg === 'add' || tried[c.key]) {
      if (c.kind === 'amounts') {
        const tot = vals.reduce((a, b) => a + b, 0), mx = Math.max(...vals), mn = Math.min(...vals);
        lines.push(vals.join(' + '), [`total = ${tot} ${c.unit}`, C.amber], [`gap   = ${mx} − ${mn} = ${mx - mn} ${c.unit}`, C.amber]);
      } else if (c.tag) {
        lines.push(vals.join(' + '), [`= ${vals.reduce((a, b) => a + b, 0)} … of what?`, C.pink], 'only name tags: a later turn, not more');
      } else {
        lines.push([`${vals[0]} + ${vals[1]} = ?  no answer`, C.pink], 'count each group instead:');
        const n = {};
        vals.forEach(v => { n[v] = (n[v] || 0) + 1; });
        c.opts.forEach(o => lines.push([`${o.padEnd(7)} ${n[o] || 0}`, C.green]));
      }
    } else lines.push(['press “Add up this column”', C.muted]);
    fbox(box, lines);

    const t = sorted[c.key];
    note.textContent = msg === 'sort' && t
      ? (t === c.kind ? (c.kind === 'names' ? 'Right: these values only name a group, so you count them.' : 'Right: each value measures how much of something there is.')
        : (c.tag ? 'Look again: does a bigger order number mean more of anything? It is only a name tag.'
          : c.kind === 'names' ? 'Look again: can you add these values? They are names for groups.' : 'Look again: each value measures an amount, so totals and gaps make sense.'))
      : 'The test: does each value measure how much of something there is? Yes → numerical. Only names a group → categorical.';
    chal.update({ sorted, tried, news, all: allRight() });
  }
  draw();
  return () => {};
}
