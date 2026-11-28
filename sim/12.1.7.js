// 12.1.7 Try it: target leakage.
// The learner picks the one column the rule may use, sets its cutoff, taps cards to change who left,
// and compares the score on old data with the score on renewal day, when late columns are still empty.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  // name, renewal month (0 = Jan), hours, help before renewal, cancel day (0 = stayed), help requests added later
  const START = [['Ali', 0, 20, 0], ['Ali', 1, 18, 0], ['Ali', 2, 22, 1], ['Ali', 3, 19, 0], ['Ali', 4, 21, 0], ['Ali', 5, 20, 0],
    ['Bea', 0, 12, 0], ['Bea', 1, 6, 1], ['Bea', 2, 2, 1, 12, 1], ['Chen', 0, 15, 0], ['Chen', 1, 10, 0], ['Chen', 2, 7, 1],
    ['Chen', 3, 3, 2, 20], ['Farah', 1, 1, 0, 5], ['Dina', 2, 3, 0], ['Dina', 3, 9, 0], ['Dina', 4, 14, 0], ['Dina', 5, 16, 0],
    ['Eli', 4, 11, 0], ['Eli', 5, 6, 1, 25]];
  const fresh = () => START.map(([name, m, hours, help, day = 0, late = 0]) => ({ name, m, hours, help, day, late }));
  let data = fresh(), col = 'hours', cut = 5, need = 1, view = 'old', random = false;

  // each column: a label, whether it is written after the answer, the rule, what the card shows, the guess
  const COLS = {
    hours: { label: 'Hours played', leaky: false, rule: () => `fewer than ${cut} hours → cancel`,
      show: r => `${r.hours} h`, guess: r => r.hours < cut },
    help: { label: 'Help (before renewal)', leaky: false, rule: () => `${need} or more help → cancel`,
      show: r => `${r.help} help`, guess: r => r.help >= need },
    late: { label: 'Help (updated later)', leaky: true, rule: () => `${need} or more help → cancel`,
      show: (r, onDay) => `${onDay ? r.help : r.help + r.late} help`, guess: (r, onDay) => (onDay ? r.help : r.help + r.late) >= need },
    date: { label: 'Cancel date', leaky: true, rule: () => 'cancel date filled in → cancel',
      show: (r, onDay) => !onDay && r.day ? `${r.day} ${MON[r.m]}` : 'empty', guess: (r, onDay) => !onDay && r.day > 0 },
    closed: { label: 'Account closed', leaky: true, rule: () => 'account closed = yes → cancel',
      show: (r, onDay) => !onDay && r.day ? 'yes' : 'no', guess: (r, onDay) => !onDay && r.day > 0 },
  };

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const colBtns = {}, viewBtns = {};
  for (const k of Object.keys(COLS)) colBtns[k] = btn(COLS[k].label, () => { col = k; draw(); });
  viewBtns.old = btn('Old data (the table)', () => { view = 'old'; draw(); });
  viewBtns.day = btn('Renewal day (real use)', () => { view = 'day'; draw(); });
  const cutLabel = h('span', { class: 'sim-note', style: { margin: 0 } }), needLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const slider = (min, max, val, on) => h('input', { type: 'range', min, max, value: val, oninput: e => { on(+e.target.value); draw(); } });
  const cutIn = slider(1, 25, cut, x => { cut = x; }), needIn = slider(1, 3, need, x => { need = x; });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: does the clue exist yet?'),
    h('p', { class: 'sub' }, 'Each card is one renewal: pink = cancelled, cyan = stayed. Pick the one column the rule may use, then compare old data with renewal day. Tap a card to change whether that customer cancelled.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, ...Object.values(colBtns)),
        h('div', { class: 'sim-row' }, viewBtns.old, viewBtns.day),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, cutLabel, cutIn),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, needLabel, needIn),
        h('div', { class: 'sim-row' },
          btn('New data (random)', () => { data = makeRandom(); random = true; draw(); }),
          btn('Start again', () => { data = fresh(); random = false; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Pick “Cancel date”, then switch to “Renewal day”. What happens to the score?',
      check: st => st.col === 'date' && st.view === 'day',
      why: 'On renewal day every cancel date is still empty, so the rule says stay for everyone: no leaver is caught.' },
    { text: 'Find a column whose score is the same on old data and on renewal day.',
      check: st => !st.leaky && st.old === st.day,
      why: 'Yes: this column is counted before renewal day, so the model sees the same values in real use.' },
    { text: 'Using “Hours played”, move the cutoff until the rule catches every leaver on renewal day.',
      check: st => st.col === 'hours' && st.leavers > 0 && st.caught === st.leavers,
      why: 'An honest clue can catch leavers on the real day, usually with a few false alarms. The leaky column caught none.' },
    { text: 'Press “New data”, find a column that scores 100% on old data, then switch to “Renewal day”.',
      check: st => st.random && st.leaky && st.old === st.n && st.view === 'day',
      why: 'Every time, the perfect column was written after the answer. On renewal day it is empty and the score falls.' },
  ]);

  function makeRandom() {
    const names = ['Ali', 'Bea', 'Chen', 'Dina', 'Eli', 'Farah', 'Gus', 'Hana'];
    let d;
    do {
      d = Array.from({ length: 20 }, () => {
        const hours = rnd(0, 25), p = hours < 5 ? 0.6 : hours < 10 ? 0.25 : 0.05, left = Math.random() < p;
        const help = (Math.random() < 0.25 ? 1 : 0) + (left && Math.random() < 0.4 ? 1 : 0);
        return { name: names[rnd(0, names.length - 1)], m: rnd(0, 5), hours, help,
          day: left ? rnd(2, 28) : 0, late: left && Math.random() < 0.6 ? 1 : 0 };
      });
    } while (d.filter(r => r.day).length < 2);
    return d.sort((a, b) => a.m - b.m);
  }

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 520 : 440, NC = NARROW ? 4 : 5, NR = 20 / NC;
  const cw = (VW - 10) / NC, chh = (VH - 10) / NR;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  // tap a card: that customer now cancelled (or stayed)
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), c = Math.floor((p.x - 5) / cw), r = Math.floor((p.y - 5) / chh), i = r * NC + c;
    if (c < 0 || c >= NC || r < 0 || r >= NR || !data[i]) return;
    const d = data[i];
    if (d.day) { d.day = 0; d.late = 0; } else { d.day = rnd(2, 28); d.late = Math.random() < 0.6 ? 1 : 0; }
    draw();
  });

  function score(onDay) {
    let right = 0, caught = 0;
    data.forEach(r => { const g = COLS[col].guess(r, onDay), y = r.day > 0; if (g === y) right++; if (g && y) caught++; });
    return { right, caught };
  }

  function draw() {
    const onDay = view === 'day', fs = NARROW ? 13 : 14, k = [];
    data.forEach((r, i) => {
      const x = 5 + (i % NC) * cw + 4, y = 5 + Math.floor(i / NC) * chh + 4, w = cw - 8, hh = chh - 8;
      const left = r.day > 0, ink = left ? C.pink : C.cyan, g = COLS[col].guess(r, onDay), ok = g === left;
      const val = COLS[col].show(r, onDay);
      k.push(s('rect', { x, y, width: w, height: hh, rx: 8, fill: C.card, stroke: ink, 'stroke-width': 2 }),
        s('text', { x: x + 8, y: y + 20, fill: ink, 'font-size': fs, 'font-weight': 700, 'font-family': 'Segoe UI, Arial' }, `${r.name} · ${MON[r.m]}`),
        s('text', { x: x + w - 8, y: y + 20, fill: ok ? C.green : C.amber, 'font-size': fs + 3, 'font-weight': 700, 'text-anchor': 'end' }, ok ? '✓' : '✗'),
        s('rect', { x: x + 8, y: y + 28, width: w - 16, height: hh * 0.3, rx: 4, fill: C.bg, stroke: COLS[col].leaky ? C.pink : C.muted, 'stroke-dasharray': val === 'empty' ? '4 4' : null }),
        s('text', { x: x + w / 2, y: y + 28 + hh * 0.15 + fs * 0.35, fill: val === 'empty' ? C.muted : C.ink, 'font-size': fs, 'text-anchor': 'middle', 'font-family': 'Consolas' }, val),
        s('text', { x: x + w / 2, y: y + hh - 10, fill: g ? C.pink : C.cyan, 'font-size': fs - 1, 'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial' }, `guess: ${g ? 'cancel' : 'stay'}`));
    });
    svg.replaceChildren(...k);

    const o = score(false), d = score(true), n = data.length, leavers = data.filter(r => r.day).length;
    const pc = x => Math.round(100 * x / n);
    fbox(box, [`rule: ${COLS[col].rule()}`,
      [`old data:    ${o.right} of ${n} right = ${pc(o.right)}%`, view === 'old' ? C.amber : C.ink],
      [`renewal day: ${d.right} of ${n} right = ${pc(d.right)}%`, view === 'day' ? C.amber : C.ink],
      [`leavers caught on renewal day: ${d.caught} of ${leavers}`, d.caught ? C.green : C.pink],
      [`always stay: ${n - leavers} of ${n} = ${pc(n - leavers)}%`, C.muted]]);
    note.textContent = COLS[col].leaky
      ? 'This column is written after the answer. On renewal day it does not exist yet, so a perfect old score means nothing.'
      : 'This column is counted before renewal day, so the model sees the same values in real use.';
    for (const [key, b] of Object.entries(colBtns)) b.className = 'sim-btn ' + (key === col ? 'go' : '');
    for (const [key, b] of Object.entries(viewBtns)) b.className = 'sim-btn ' + (key === view ? 'go' : '');
    cutLabel.textContent = `Hours cutoff: fewer than ${cut}`;
    needLabel.textContent = `Help needed: ${need} or more`;
    chal.update({ col, view, leaky: COLS[col].leaky, old: o.right, day: d.right, n, caught: d.caught, leavers, random });
  }
  draw();
  return () => {};
}
