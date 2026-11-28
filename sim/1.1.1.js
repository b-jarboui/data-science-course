// 1.1.1 Try it: what does one row describe?
// The café order table. The notebook has no names, so the learner imagines who ordered:
// tap the "Who?" box of a row to change the customer. Rows always count orders; the
// number of different customers can be smaller. A second view shows a table where one row is one customer.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const START = [
    ['8:05', 'coffee', 'small', 3], ['8:11', 'tea', 'medium', 4], ['8:20', 'coffee', 'large', 5],
    ['8:26', 'juice', 'medium', 4], ['8:40', 'coffee', 'medium', 4], ['8:52', 'tea', 'small', 3]];
  const LET = 'ABCDEFGHI';
  const PRICE = { small: 3, medium: 4, large: 5 };
  let rows = START.map((r, i) => ({ time: r[0], drink: r[1], size: r[2], price: r[3], who: LET[i] }));
  let view = 'orders', sel = -1, randomCount = 0, sawCust = false;

  const svg = s('svg', { viewBox: '0 0 700 420' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const viewBtn = btn('Show the customer table', () => { view = view === 'orders' ? 'cust' : 'orders'; if (view === 'cust') sawCust = true; sel = -1; draw(); }, 'go');
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: what is one row?'),
    h('p', { class: 'sub' }, 'The café notebook has no names. Imagine who ordered: tap the “Who?” box of a row to change the customer.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          viewBtn,
          btn('Add an order', () => { if (rows.length < 9) { rows.push(randRow(rows.length)); fixTimes(); draw(); } }),
          btn('Remove an order', () => { if (rows.length > 2) { rows.pop(); draw(); } }),
          btn('New morning (random)', () => { newMorning(); randomCount++; draw(); }),
          btn('Start again', () => { rows = START.map((r, i) => ({ time: r[0], drink: r[1], size: r[2], price: r[3], who: LET[i] })); view = 'orders'; sel = -1; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  function randRow(i) {
    const size = ['small', 'medium', 'large'][rnd(0, 2)];
    return { time: '', drink: ['coffee', 'tea', 'juice'][rnd(0, 2)], size, price: PRICE[size], who: LET[rnd(0, Math.min(5, i))] };
  }
  function fixTimes() {   // spread the orders between 8:00 and 9:00, in order
    let m = 0;
    rows.forEach((r, i) => { m = Math.max(m + 2, Math.round((i + 0.3 + Math.random() * 0.6) * 58 / rows.length)); m = Math.min(m, 58); r.time = `8:${String(m).padStart(2, '0')}`; });
  }
  function newMorning() {
    const n = rnd(4, 9);
    rows = [];
    for (let i = 0; i < n; i++) rows.push(randRow(i));
    fixTimes();
    view = 'orders'; sel = -1;
  }
  const people = () => [...new Set(rows.map(r => r.who))].sort();

  const chal = challenges(ch, [
    { text: 'Make the 8:52 tea come from the same person as the 8:05 coffee. How many customers now?',
      check: st => st.start && st.rows[0].who === st.rows[5].who,
      why: 'Six rows, but fewer people: that person has two orders, so two rows.' },
    { text: 'Make the six orders come from only three customers.',
      check: st => st.rows.length === 6 && st.people === 3,
      why: 'Still six rows: in this table, counting rows counts orders, not people.' },
    { text: 'Press “Show the customer table”. What does one row describe there?',
      check: st => st.sawCust,
      why: 'One customer per row. There, counting rows counts people.' },
    { text: 'Press “New morning” twice. Is the number of rows always the number of orders?',
      check: st => st.randomCount >= 2,
      why: 'Always: in the order table, the observational unit is one order.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.2 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} 420`);
  const X0 = 6, X1 = VW - 6, TOP = 8, RH = 40;

  let hits = [];
  svg.addEventListener('pointerdown', e => {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    const q = p.matrixTransform(svg.getScreenCTM().inverse());
    const hit = hits.find(b => q.x >= b.x && q.x <= b.x + b.w && q.y >= b.y && q.y <= b.y + b.h);
    if (!hit) return;
    sel = hit.i;
    const r = rows[hit.i], k = LET.indexOf(r.who);
    r.who = LET[(k + 1) % Math.min(LET.length, Math.max(6, rows.length))];
    draw();
  });

  function table(cols, data, colorOf) {
    const k = [], tw = X1 - X0, sum = cols.reduce((a, c) => a + c[1], 0);
    let x = X0;
    const xs = cols.map(c => { const a = x; x += c[1] / sum * tw; return [a, c[1] / sum * tw]; });
    xs.forEach(([a, w], c) => {
      k.push(s('rect', { x: a, y: TOP, width: w, height: RH, fill: '#16204a', stroke: C.line }),
        s('text', { x: a + w / 2, y: TOP + RH / 2 + 5 * F, fill: cols[c][2] || C.cyan, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle' }, cols[c][0]));
    });
    data.forEach((row, r) => {
      const y = TOP + RH * (r + 1);
      xs.forEach(([a, w], c) => {
        k.push(s('rect', { x: a, y, width: w, height: RH, fill: C.card, stroke: C.line }),
          s('text', { x: a + w / 2, y: y + RH / 2 + 5 * F, fill: colorOf(r, c), 'font-size': 15 * F, 'text-anchor': 'middle', 'font-family': c === 0 || cols[c][3] ? 'Consolas' : 'Segoe UI' }, row[c]));
      });
    });
    return { k, xs };
  }

  function draw() {
    hits = [];
    const ppl = people();
    let k;
    if (view === 'orders') {
      const cols = NARROW
        ? [['No.', 0.6, C.muted], ['Time', 1, 0, 1], ['Drink', 1.2], ['Price $', 1, 0, 1], ['Who?', 1, C.pink]]
        : [['No.', 0.6, C.muted], ['Time', 1, 0, 1], ['Drink', 1.1], ['Size', 1.1], ['Price $', 1, 0, 1], ['Who? (imagined)', 1.6, C.pink]];
      const data = rows.map((r, i) => NARROW ? [i + 1, r.time, r.drink, r.price, r.who] : [i + 1, r.time, r.drink, r.size, r.price, r.who]);
      const wc = cols.length - 1;
      const t = table(cols, data, (r, c) => c === 0 ? C.muted : c === wc ? C.pink : C.ink);
      k = t.k;
      const [wa, ww] = t.xs[wc];
      rows.forEach((r, i) => {
        const y = TOP + RH * (i + 1);
        hits.push({ i, x: wa, y, w: ww, h: RH });
        k.push(s('rect', { x: wa + 6, y: y + 5, width: ww - 12, height: RH - 10, rx: 10, fill: 'none', stroke: C.pink, 'stroke-opacity': .7 }));
      });
      if (sel >= 0 && sel < rows.length) k.push(s('rect', { x: X0, y: TOP + RH * (sel + 1), width: X1 - X0, height: RH, fill: 'none', stroke: C.amber, 'stroke-width': 3, rx: 4 }));
      fbox(box, [['1 row = 1 order', C.amber], `rows      = ${rows.length}`, `orders    = ${rows.length}`,
        [`customers = ${ppl.length}  (${ppl.join(', ')})`, C.pink]]);
      note.textContent = ppl.length < rows.length
        ? 'Some people ordered more than once, so there are more rows than customers.'
        : 'Every order has a different person right now, so rows and customers match. That is luck, not a rule.';
      viewBtn.textContent = 'Show the customer table';
    } else {
      const cols = [['Customer', 1.2, C.pink], ['Orders', 1, 0, 1], ['Spent $', 1, 0, 1]];
      const data = ppl.map(p => { const mine = rows.filter(r => r.who === p); return [p, mine.length, mine.reduce((a, r) => a + r.price, 0)]; });
      k = table(cols, data, (r, c) => c === 0 ? C.pink : C.ink).k;
      fbox(box, [['1 row = 1 customer', C.pink], `rows      = ${ppl.length}`, `customers = ${ppl.length}`,
        `orders    = ${data.map(d => d[1]).join(' + ')} = ${rows.length}`]);
      note.textContent = 'Same morning, different table. Here one row is one customer, so counting rows counts people.';
      viewBtn.textContent = 'Back to the order table';
    }
    svg.replaceChildren(...k);
    svg.setAttribute('viewBox', `0 0 ${VW} ${TOP + RH * ((view === 'orders' ? rows.length : ppl.length) + 1) + 8}`);
    const start = rows.length === 6 && rows.every((r, i) => r.time === START[i][0] && r.drink === START[i][1]);
    chal.update({ rows, people: ppl.length, sawCust, randomCount, start });
  }
  draw();
  return () => {};
}
