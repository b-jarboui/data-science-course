// 20.3.2 Try it: greedy decoding on the sequence tree.
// The learner sets the chances with sliders, decodes one token per Step (greedy or by chance),
// plays many answers to see that greedy always repeats itself, and compares greedy's path with the best whole path.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = { at: 45, nine: 40, mon: 80 };
  let cfg = { ...START }, mode = 'greedy', path = [], tally = { greedy: {}, chance: {} }, greedyDone = 0, playing = false, timer = 0;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const counter = h('span', { class: 'sim-note', style: { margin: 0 } });
  const range = (min, max, step, value, oninput, width = '100%') => h('input', { type: 'range', min, max, step, value, oninput, style: { width } });
  const sAt = range(10, 65, 5, cfg.at, e => { cfg.at = +e.target.value; changed(); });
  const sNine = range(20, 80, 5, cfg.nine, e => { cfg.nine = +e.target.value; changed(); });
  const sMon = range(20, 90, 5, cfg.mon, e => { cfg.mon = +e.target.value; changed(); });
  const speed = range(1, 5, 1, 2, () => {}, '9rem');
  const lAt = h('div', { class: 'sim-note' }), lNine = h('div', { class: 'sim-note' }), lMon = h('div', { class: 'sim-note' });
  const playBtn = btn('▶ Play', () => togglePlay());
  const greedyBtn = btn('Greedy', () => setMode('greedy')), chanceBtn = btn('Draw by chance', () => setMode('chance'));
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: greedy decoding'),
    h('p', { class: 'sub' }, 'The tree holds the model’s chances after “The library will open”. Press Step to add one token, Play to answer again and again, and move the sliders to change the chances.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, greedyBtn, chanceBtn),
        h('div', { class: 'sim-row' },
          btn('Step', () => { stop(); step(); }, 'go'), playBtn,
          btn('Reset', reset),
          btn('New data (random)', () => { cfg = { at: rnd(2, 13) * 5, nine: rnd(4, 16) * 5, mon: rnd(4, 18) * 5 }; sync(); changed(); }),
          btn('Start values', () => { cfg = { ...START }; sync(); changed(); })),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, h('span', { class: 'sim-note', style: { margin: 0 } }, 'Speed'), speed, counter)),
      h('div', {}, h('div', { class: 'sim-card' }, box, note, lAt, sAt, lNine, sNine, lMon, sMon), h('div', { class: 'sim-card' }, ch)))));

  // the tree: soon, late and purple keep 15, 6 and 4; "at" and "on" share the other 75
  const tree = () => {
    const rest = (100 - cfg.nine) / 2;
    return { first: [['at', cfg.at], ['on', 75 - cfg.at], ['soon', 15], ['late', 6], ['purple', 4]],
      next: { at: [['nine', cfg.nine], ['ten', rest], ['noon', rest]], on: [['Monday', cfg.mon], ['time', 100 - cfg.mon]] } };
  };
  const r2 = x => +x.toFixed(2), dec = p => String(+(p / 100).toFixed(4));
  function paths() {
    const tr = tree(), out = [];
    for (const [a, pa] of tr.first) for (const [b, pb] of tr.next[a] || []) out.push({ key: `${a} ${b}`, a, pa, pc: pa * pb / 100 });
    return out;
  }
  const best = () => paths().reduce((m, q) => q.pc > m.pc ? q : m);
  const top = list => list.reduce((m, x) => x[1] > m[1] ? x : m);
  const drawOne = list => { let r = Math.random() * list.reduce((a, x) => a + x[1], 0); for (const x of list) { r -= x[1]; if (r < 0) return x; } return list[list.length - 1]; };
  const greedyPath = () => { const tr = tree(), a = top(tr.first); return `${a[0]} ${top(tr.next[a[0]])[0]}`; };
  const isDone = () => path.length === 2 || (path.length === 1 && !tree().next[path[0][0]]);

  const chal = challenges(ch, [
    { text: 'Press Step until the answer is finished, in Greedy mode.',
      check: st => st.greedyDone >= 1, why: 'Greedy took the tallest bar at each step, and its path chance is the two step chances multiplied.' },
    { text: 'Predict first: if greedy answers 10 times, how many different answers? Then press Play and count.',
      check: st => st.greedyRuns >= 10, why: 'Just one: the same prefix and the same chances always give the same answer.' },
    { text: 'Move the sliders until greedy’s answer is also the most likely whole path.',
      check: st => st.gk === st.bk, why: 'Now the best first step also leads to the best whole path, so greedy finds it.' },
    { text: 'Harder: give “at” 50% or more, but make an “on” path the most likely whole path.',
      check: st => st.at >= 50 && st.bk.startsWith('on '), why: 'A weaker first token still wins the whole path if its next step is strong enough. Greedy misses it.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a taller drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, VH = NARROW ? 680 : 440, F = NARROW ? 1.2 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const COL = NARROW ? [4, 150, 268] : [20, 165, 320], PX = NARROW ? 370 : 432;
  const ROW = r => NARROW ? 34 + r * 38 : 44 + r * 40;
  const CUR = NARROW ? { x: 60, y: 380, w: 300, h: 90, tx: 10 } : { x: 515, y: 60, w: 160, h: 130, tx: 470 };
  const TAL = NARROW ? { x: 120, y: 556, w: 200, row: 21, tx: 10 } : { x: 560, y: 272, w: 95, row: 26, tx: 470 };

  function sync() { sAt.value = cfg.at; sNine.value = cfg.nine; sMon.value = cfg.mon; }
  function changed() { path = []; tally = { greedy: {}, chance: {} }; draw(); }
  function reset() { stop(); changed(); }
  function setMode(m) { mode = m; path = []; draw(); }
  function step() {
    if (isDone()) path = [];
    const tr = tree(), list = path.length ? tr.next[path[0][0]] : tr.first;
    path.push(mode === 'greedy' ? top(list) : drawOne(list));
    if (isDone()) {
      const key = path.length === 2 ? `${path[0][0]} ${path[1][0]}` : 'other';
      tally[mode][key] = (tally[mode][key] || 0) + 1;
      if (mode === 'greedy') greedyDone++;
    }
    draw();
  }
  function stop() { playing = false; clearTimeout(timer); playBtn.textContent = '▶ Play'; }
  function togglePlay() { if (playing) { stop(); return; } playing = true; playBtn.textContent = '❚❚ Pause'; tick(); }
  function tick() { step(); if (playing) timer = setTimeout(tick, 1600 / +speed.value); }

  function draw() {
    const tr = tree(), b = best(), gk = greedyPath(), fs = 15 * F, cw = fs * 0.56, y = ROW;
    const a1 = path[0]?.[0], a2 = path[1]?.[0], done = isDone(), k = [];
    const colOf = st => st === 'on' ? C.cyan : st === 'off' ? C.pink : C.ink;
    const tok = (x, yy, label, col) => k.push(s('circle', { cx: x, cy: yy, r: 4 * F, fill: col }),
      s('text', { x: x + 8 * F, y: yy + fs * 0.35, fill: col, 'font-size': fs, 'font-family': 'Consolas' }, label));
    const right = (x, label) => x + 10 * F + label.length * cw;
    const branch = (x1, y1, x2, y2, p, st) => {
      const col = st === 'on' ? C.cyan : st === 'off' ? C.pink : '#536485', ex = x2 - 44 * F;
      k.push(s('polyline', { points: `${x1},${y1} ${ex},${y2} ${x2 - 6 * F},${y2}`, fill: 'none', stroke: col, 'stroke-width': st === 'on' ? 3.5 : 2, 'stroke-opacity': st === 'off' ? 0.55 : 1 }),
        s('text', { x: (ex + x2) / 2, y: y2 - 6 * F, fill: st === 'on' ? C.cyan : st === 'off' ? C.pink : C.muted, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r2(p)) + '%'));
    };

    // tree: chosen branches cyan, dropped ones pink, whole-path chances in the right column
    const R0 = [COL[0], (y(1) + y(7)) / 2];
    const Y1 = { at: y(1), on: (y(3) + y(4)) / 2, soon: y(5), late: y(6), purple: y(7) };
    const Y2 = { at: [y(0), y(1), y(2)], on: [y(3), y(4)] };
    tok(R0[0], R0[1], 'open', C.ink);
    for (const [w, p] of tr.first) {
      const st = a1 ? (w === a1 ? 'on' : 'off') : '';
      branch(right(R0[0], 'open'), R0[1], COL[1], Y1[w], p, st); tok(COL[1], Y1[w], w, colOf(st));
    }
    const all = paths();
    for (const par of ['at', 'on']) tr.next[par].forEach(([w, p], i) => {
      const st = a1 && a1 !== par ? 'off' : a2 ? (w === a2 ? 'on' : 'off') : '';
      const yy = Y2[par][i], key = `${par} ${w}`, pc = all.find(q => q.key === key).pc, chosen = done && st === 'on';
      branch(right(COL[1], par), Y1[par], COL[2], yy, p, st); tok(COL[2], yy, w, colOf(st));
      k.push(s('text', { x: PX, y: yy + 5 * F, fill: key === b.key ? (chosen ? C.green : C.amber) : chosen ? C.cyan : C.muted, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r2(pc)) + '%'));
    });
    const head = (x, yy, label, anchor = 'start') => k.push(s('text', { x, y: yy, fill: C.muted, 'font-size': 12 * F, 'text-anchor': anchor, 'font-family': 'Consolas' }, label));
    head(COL[1], y(7) + 30 * F, 'step 1'); head(COL[2], y(7) + 30 * F, 'step 2'); head(PX, y(0) - 20, 'path', 'middle');

    // curve: chance of the path so far, this run (cyan) against the best whole path (amber)
    const cx = i => CUR.x + i * CUR.w / 2, cy = v => CUR.y + CUR.h - v / 100 * CUR.h;
    k.push(s('text', { x: CUR.tx, y: CUR.y - 20 * F, fill: C.ink, 'font-size': 13 * F, 'font-weight': 700 }, 'chance of the path so far'));
    for (const v of [0, 50, 100]) k.push(s('line', { x1: CUR.x, x2: CUR.x + CUR.w, y1: cy(v), y2: cy(v), stroke: C.line }),
      s('text', { x: CUR.x - 6, y: cy(v) + 4 * F, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, v + '%'));
    [0, 1, 2].forEach(i => k.push(s('text', { x: cx(i), y: CUR.y + CUR.h + 17 * F, fill: C.muted, 'font-size': 11 * F, 'text-anchor': i === 2 ? 'end' : 'middle', 'font-family': 'Consolas' }, 'step ' + i)));
    k.push(s('text', { x: CUR.tx, y: CUR.y + CUR.h + 34 * F, fill: C.muted, 'font-size': 11 * F, 'font-family': 'Consolas' }, 'cyan: this answer · amber: best path'));
    const curve = (vals, col, dash, above) => {
      k.push(s('polyline', { points: vals.map((v, i) => `${cx(i)},${cy(v)}`).join(' '), fill: 'none', stroke: col, 'stroke-width': 2.5, 'stroke-dasharray': dash }));
      vals.forEach((v, i) => {
        k.push(s('circle', { cx: cx(i), cy: cy(v), r: 4 * F, fill: col }));
        if (i) k.push(s('text', { x: cx(i), y: cy(v) + (above ? -9 : 17) * F, fill: col, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': i === 2 ? 'end' : 'middle', 'font-family': 'Consolas' }, fmt(r2(v)) + '%'));
      });
    };
    curve([100, b.pa, b.pc], C.amber, '6 5', false);
    const cur = [100];
    if (path[0]) cur.push(path[0][1]);
    if (path[1]) cur.push(path[0][1] * path[1][1] / 100);
    curve(cur, C.cyan, null, true);

    // tally: how many times each answer came out
    const tl = tally[mode], keys = all.map(q => q.key).concat(mode === 'chance' ? ['other'] : []);
    const n = Object.values(tl).reduce((a, c) => a + c, 0), mx = Math.max(1, ...Object.values(tl));
    k.push(s('text', { x: TAL.tx, y: TAL.y - 20 * F, fill: C.ink, 'font-size': 13 * F, 'font-weight': 700 }, `${n} answers (${mode === 'greedy' ? 'greedy' : 'by chance'})`));
    keys.forEach((key, i) => {
      const yy = TAL.y + i * TAL.row, c = tl[key] || 0, col = key === gk ? C.cyan : key === b.key ? C.amber : key === 'other' ? C.muted : C.violet;
      k.push(s('text', { x: TAL.x - 8, y: yy + 4 * F, fill: col, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, key),
        s('rect', { x: TAL.x, y: yy - 6 * F, width: Math.max(1, c / mx * TAL.w), height: 12 * F, fill: col, 'fill-opacity': c ? 0.82 : 0.25, rx: 2 }),
        s('text', { x: TAL.x + c / mx * TAL.w + 6, y: yy + 4 * F, fill: col, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' }, c));
    });
    svg.replaceChildren(...k);

    // formula box: the numbers of this step
    const verb = mode === 'greedy' ? 'take the tallest' : 'draw by chance';
    let lines;
    if (!path.length) lines = ['step 0 of 2: “… will open”', `next: ${verb}`, [`best path: ${b.key} = ${fmt(r2(b.pc))}%`, C.amber]];
    else if (!tree().next[path[0][0]]) lines = [`step 1: “${path[0][0]}” ${path[0][1]}%`, 'this branch is not grown here', `its path is at most ${path[0][1]}%`];
    else if (path.length === 1) lines = [`step 1: “${path[0][0]}” ${fmt(r2(path[0][1]))}%`, `path chance = ${dec(path[0][1])}`, `next: ${verb}`];
    else {
      const [a, pa] = path[0], [w, pb] = path[1], pc = pa * pb / 100, key = `${a} ${w}`;
      lines = [`step 2: “${w}” ${fmt(r2(pb))}%`, `${dec(pa)} × ${dec(pb)} = ${dec(pc)}`,
        key === b.key ? [`= ${fmt(r2(pc))}%, the best path`, C.green] : [`= ${fmt(r2(pc))}% (best: ${b.key} ${fmt(r2(b.pc))}%)`, C.amber]];
    }
    fbox(box, lines);
    const g1 = top(tr.first)[0];
    note.textContent = mode === 'chance' ? 'Drawing by chance gives different answers on different runs. Greedy always gives the same one.'
      : gk === b.key ? 'Here the best first step also leads to the best whole path, so greedy finds it.'
      : b.a !== g1 ? `Greedy answers “${gk}”, but “${b.key}” is the most likely whole path. Greedy never sees it: “${b.a}” lost step 1.`
      : `Greedy answers “${gk}”, but “${b.key}” is just as likely or more: a tie at step 2, and greedy takes the first one.`;
    lAt.textContent = `Step 1: “at” ${cfg.at}%, “on” ${75 - cfg.at}% (soon 15, late 6, purple 4 stay)`;
    lNine.textContent = `After “at”: “nine” ${cfg.nine}%, “ten” and “noon” ${fmt(r2((100 - cfg.nine) / 2))}% each`;
    lMon.textContent = `After “on”: “Monday” ${cfg.mon}%, “time” ${100 - cfg.mon}%`;
    greedyBtn.className = 'sim-btn ' + (mode === 'greedy' ? 'go' : 'ghost');
    chanceBtn.className = 'sim-btn ' + (mode === 'chance' ? 'go' : 'ghost');
    counter.textContent = `${done ? 'Answer finished' : `Step ${path.length} of 2`} · answers: ${n}`;
    const greedyRuns = Object.values(tally.greedy).reduce((a, c) => a + c, 0);
    chal.update({ greedyDone, greedyRuns, gk, bk: b.key, at: cfg.at });
  }
  draw();
  return () => clearTimeout(timer);
}
