// 1.1.2 Try it: variables are columns.
// The learner taps a column heading to follow one variable down the table, taps a box and uses − / + to
// change a value, makes a random morning, and taps an order number to see the "across a row" trap.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const DRINKS = ['coffee', 'tea', 'juice'];
  const START = [[1, 'coffee', 3, 120], [2, 'tea', 4, 90], [3, 'coffee', 5, 150],
                 [4, 'juice', 4, 60], [5, 'coffee', 4, 180], [6, 'tea', 3, 60]];
  const HEAD = ['Order', 'Drink', 'Price ($)', 'Wait time (s)'];
  const NAME = ['order number', 'drink', 'price', 'wait time'];
  let rows = START.map(r => r.slice());
  let mode = 'col', col = 3, row = 0, cellR = -1, random = false, picked = null;

  const svg = s('svg', { viewBox: '0 0 700 400' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: follow one variable'),
    h('p', { class: 'sub' }, 'Tap a heading to read that column from top to bottom. Tap a box, then use − / + to change its value. Tap an order number to read across a row instead.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−', () => bump(-1)), btn('+', () => bump(1)), selLabel),
        h('div', { class: 'sim-row' },
          btn('New morning (random)', () => { rows = rows.map((r, i) => [i + 1, DRINKS[rnd(0, 2)], rnd(2, 6), rnd(3, 30) * 10]); random = true; picked = null; draw(); }, 'go'),
          btn('Start again', () => { rows = START.map(r => r.slice()); random = false; mode = 'col'; col = 3; cellR = -1; picked = null; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const waits = () => rows.map(r => r[3]);
  const orders = (vals, x) => vals.map((v, i) => v === x ? i + 1 : 0).filter(Boolean);
  const chal = challenges(ch, [
    { text: 'Tap the column that answers: how much did each customer pay?',
      check: st => st.mode === 'col' && st.col === 2,
      why: 'Yes: price is one variable, so its answers sit in one column, from top to bottom.' },
    { text: 'Change the wait times so that order two alone has the longest wait.',
      check: st => { const w = st.w, m = Math.max(...w); return w[1] === m && w.filter(x => x === m).length === 1; },
      why: 'Right: to find the longest wait, you only had to read down the wait time column.' },
    { text: 'Tap the order number of order one, to read across its row.',
      check: st => st.mode === 'row',
      why: 'A row mixes different variables: dollars and seconds. Adding them across a row means nothing.' },
    { text: 'Press “New morning”, then tap the wait time box of the order that waited least.',
      check: st => st.random && st.picked != null && st.w[st.picked] === Math.min(...st.w),
      why: 'Found it: one variable, one column, and the smallest value is easy to spot.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.2 : 1;
  const CWr = [0.17, 0.27, 0.24, 0.32], X0 = 8, TW = VW - 16, RH = NARROW ? 50 : 52, Y0 = 8;
  svg.setAttribute('viewBox', `0 0 ${VW} ${Y0 * 2 + RH * 7}`);
  const cx = c => X0 + TW * (CWr.slice(0, c).reduce((a, b) => a + b, 0) + CWr[c] / 2);
  const cw = c => TW * CWr[c];
  const cxl = c => X0 + TW * CWr.slice(0, c).reduce((a, b) => a + b, 0);
  const ry = r => Y0 + RH * (r + 1);   // r = -1 header, 0..5 rows (top edge)

  function bump(d) {
    if (cellR < 0 || col === 0) return;
    const r = rows[cellR];
    if (col === 1) r[1] = DRINKS[(DRINKS.indexOf(r[1]) + d + 3) % 3];
    if (col === 2) r[2] = Math.max(1, Math.min(9, r[2] + d));
    if (col === 3) r[3] = Math.max(10, Math.min(300, r[3] + 10 * d));
    draw();
  }

  svg.addEventListener('pointerdown', e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    const q = p.matrixTransform(svg.getScreenCTM().inverse());
    let c = 3; while (c > 0 && q.x < cxl(c)) c--;
    const r = Math.floor((q.y - Y0) / RH) - 1;
    if (r < -1 || r > 5) return;
    if (r === -1) { mode = 'col'; col = c; cellR = -1; }
    else if (c === 0) { mode = 'row'; row = r; cellR = -1; }
    else { mode = 'col'; col = c; cellR = r; if (c === 3) picked = r; }
    draw();
  });

  function draw() {
    const k = [];
    k.push(s('rect', { x: X0, y: Y0, width: TW, height: RH, fill: C.cyan, 'fill-opacity': .14, rx: 8 }));
    if (mode === 'col') k.push(s('rect', { x: cxl(col) + 2, y: Y0 + 2, width: cw(col) - 4, height: RH * 7 - 4, fill: C.green, 'fill-opacity': .1, stroke: C.green, 'stroke-width': 2.5, rx: 8 }));
    else k.push(s('rect', { x: X0 + 2, y: ry(row) + 2, width: TW - 4, height: RH - 4, fill: C.pink, 'fill-opacity': .12, stroke: C.pink, 'stroke-width': 2.5, rx: 8 }));
    if (cellR >= 0) k.push(s('rect', { x: cxl(col) + 6, y: ry(cellR) + 5, width: cw(col) - 12, height: RH - 10, fill: C.amber, 'fill-opacity': .18, stroke: C.amber, 'stroke-width': 2.5, rx: 6 }));
    for (let r = 1; r < 7; r++) k.push(s('line', { x1: X0, x2: X0 + TW, y1: Y0 + RH * r, y2: Y0 + RH * r, stroke: C.line }));
    for (let c = 1; c < 4; c++) k.push(s('line', { x1: cxl(c), x2: cxl(c), y1: Y0, y2: Y0 + RH * 7, stroke: C.line }));
    HEAD.forEach((t, c) => k.push(s('text', { x: cx(c), y: Y0 + RH / 2 + 6 * F, fill: C.cyan, 'font-size': (NARROW && c === 3 ? 13 : 16) * F, 'font-weight': 700, 'text-anchor': 'middle' }, NARROW && c === 3 ? 'Wait (s)' : t)));
    const w = waits(), mx = Math.max(...w), mn = Math.min(...w);
    rows.forEach((rw, r) => rw.forEach((v, c) => {
      let fill = C.ink;
      if (mode === 'col' && col === 3 && c === 3) fill = v === mx ? C.amber : v === mn ? C.cyan : C.ink;
      if (mode === 'row' && r === row && (c === 2 || c === 3)) fill = C.pink;
      if (c === 0) fill = C.muted;
      k.push(s('text', { x: cx(c), y: ry(r) + RH / 2 + 6 * F, fill, 'font-size': 18 * F, 'font-weight': c === 0 ? 400 : 650, 'text-anchor': 'middle', 'font-family': c === 1 ? 'Segoe UI' : 'Consolas' }, v));
    }));
    svg.replaceChildren(...k);

    if (mode === 'row') {
      const rw = rows[row];
      fbox(box, [[`row: order ${rw[0]} (one order)`, C.pink], `drink ${rw[1]} · ${rw[2]} dollars · ${rw[3]} seconds`,
        [`${rw[2]} + ${rw[3]} = ${rw[2] + rw[3]} … what?`, C.pink]]);
      note.textContent = 'Reading across mixes different variables. Dollars and seconds are different things, so adding them means nothing.';
    } else if (col === 0) {
      fbox(box, [['order number = a name tag', C.muted], 'it names each row: 1, 2, 3, 4, 5, 6']);
      note.textContent = 'We use the order number to point to an order, not to compare orders.';
    } else {
      const vals = rows.map(r => r[col]);
      const lines = [[`variable: ${NAME[col]}`, C.green], `values: ${vals.join(', ')}`, `${vals.length} values, one per order`];
      if (col === 3) lines.push([`longest  = ${mx} s (order ${orders(w, mx).join(', ')})`, C.amber], [`shortest = ${mn} s (order ${orders(w, mn).join(', ')})`, C.cyan]);
      if (col === 2) lines.push([`dollar amounts: add dollars with dollars`, C.amber]);
      if (col === 1) lines.push([`answers are words`, C.violet]);
      fbox(box, lines);
      note.textContent = 'One variable = one thing noted for every order. Its values fill one column.';
    }
    selLabel.textContent = cellR >= 0 ? `Selected: order ${cellR + 1}, ${NAME[col]}` : 'Tap a box to change it';
    chal.update({ mode, col, w, random, picked });
  }
  draw();
  return () => {};
}
