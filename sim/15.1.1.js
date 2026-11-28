// 15.1.1 Try it: bandit feedback, we only see what we choose.
// Learners arrive one at a time. The app shows prompt A or B and only the chosen prompt's result appears;
// the other stays a question mark. Step / Play / speed / Reset / New data, a learner counter,
// live return-rate estimates and a curve that grows with every learner. The sim checks the challenges itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, fmt, challenges } = kit;
  const TRUE = { A: 0.5, B: 0.7 };            // hidden return probabilities (chapters/15.1.md); the app never sees them
  const COL = { A: C.cyan, B: C.amber };
  const MAX = 400;
  const draw01 = p => Math.random() < p ? 1 : 0;
  const makePool = () => Array.from({ length: MAX }, () => ({ rA: draw01(TRUE.A), rB: draw01(TRUE.B) }));
  // the lesson's three learners: A → 1, B → 0, A → 0 (their unseen results are hidden draws)
  const lessonStart = () => [{ pick: 'A', rA: 1, rB: draw01(TRUE.B) }, { pick: 'B', rA: draw01(TRUE.A), rB: 0 }, { pick: 'A', rA: 0, rB: draw01(TRUE.B) }];
  let pool = makePool(), start = lessonStart(), hist = start.slice(), next = 0;
  let chanceA = 50, speed = 4, peek = false, playing = false, anim = 0, last = 0, acc = 0;
  let manualB = false, sinceB = 0;

  const rec = s('svg'), cur = s('svg');
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const count = h('span', { class: 'sim-pill', style: { color: C.violet, borderColor: C.violet } });
  const playBtn = btn('Play', toggle);
  const chanceLabel = h('span', { class: 'sim-note', style: { margin: 0 } }), speedLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const chanceIn = h('input', { type: 'range', min: 0, max: 100, step: 5, value: chanceA, oninput: e => { chanceA = +e.target.value; draw(); } });
  const speedIn = h('input', { type: 'range', min: 1, max: 30, step: 1, value: speed, oninput: e => { speed = +e.target.value; draw(); } });
  const peekIn = h('input', { type: 'checkbox', onchange: e => { peek = e.target.checked; draw(); } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: we only see what we choose'),
    h('p', { class: 'sub' }, 'Each learner sees one prompt. Only that prompt’s result appears; the other stays a question mark. Send one learner at a time, or press Play.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, rec,
        h('div', { class: 'sim-row' }, btn('Step', step, 'go'), playBtn, btn('Reset', reset), btn('New data', newData)),
        h('div', { class: 'sim-row' }, btn('Show A to the next learner', () => choose('A', true)), btn('Show B to the next learner', () => choose('B', true))),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, chanceLabel, chanceIn),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, speedLabel, speedIn),
        h('label', { class: 'sim-row', style: { alignItems: 'center' } }, peekIn, 'Peek at hidden results (only the simulator can)')),
      h('div', {}, h('div', { class: 'sim-card' }, h('div', { class: 'sim-row', style: { marginTop: 0 } }, count), cur, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Press “Show B to the next learner”. Look at the A cell for that learner.',
      check: st => st.manualB, why: 'It stays a question mark: we only see the result of the prompt we choose.' },
    { text: 'Tick “Peek at hidden results”. Find a learner whose hidden result differs from the one we saw.',
      check: st => st.peek && st.differ, why: 'That learner would have acted differently with the other prompt, and the real app can never see it.' },
    { text: 'Set the chance of A to 100% and let 20 learners arrive. Does B’s estimate change?',
      check: st => st.sinceB >= 20, why: 'No. B gets no new feedback, so its estimate is stuck, even though B is really better (70% against 50%).' },
    { text: 'Keep both prompts in play until each has 15 learners or more and both estimates are within 10 points of the true rates, 50% and 70%.',
      check: st => st.sA >= 15 && st.sB >= 15 && Math.abs(st.eA - TRUE.A) <= 0.1 + 1e-9 && Math.abs(st.eB - TRUE.B) <= 0.1 + 1e-9,
      why: 'More feedback for both prompts brings each estimate closer to the truth. One or two learners are not enough.' },
  ]);

  // learning loop: one learner per step
  function add(pick, manual = false) {
    if (hist.length >= MAX) return false;
    const l = pool[next++ % MAX];
    hist.push({ pick, rA: l.rA, rB: l.rB, manual });
    if (pick === 'B') { sinceB = 0; if (manual) manualB = true; } else sinceB++;
    return true;
  }
  const appPick = () => Math.random() * 100 < chanceA ? 'A' : 'B';
  function choose(pick, manual = false) { add(pick, manual); draw(); }
  function step() { choose(appPick()); }
  function stop() { playing = false; cancelAnimationFrame(anim); playBtn.textContent = 'Play'; }
  function toggle() {
    if (playing) { stop(); return; }
    playing = true; playBtn.textContent = 'Pause'; last = performance.now(); acc = 0;
    anim = requestAnimationFrame(loop);
  }
  function loop(now) {
    if (!playing) return;
    acc += Math.min(0.25, (now - last) / 1000) * speed; last = now;
    let k = 0;
    while (acc >= 1 && k < 50) { acc -= 1; k++; if (!add(appPick())) { stop(); break; } }
    if (k) draw();
    if (playing) anim = requestAnimationFrame(loop);
  }
  function reset() { stop(); hist = start.slice(); next = 0; sinceB = 0; draw(); }
  function newData() { stop(); pool = makePool(); start = lessonStart(); hist = []; next = 0; sinceB = 0; draw(); }

  function stats() {
    const st = { A: { shown: 0, ret: 0 }, B: { shown: 0, ret: 0 } };
    for (const e of hist) { st[e.pick].shown++; st[e.pick].ret += e.pick === 'A' ? e.rA : e.rB; }
    return st;
  }
  const est = o => o.shown ? o.ret / o.shown : null;
  const pct = x => x == null ? '?' : fmt(Math.round(x * 1000) / 10) + '%';

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.15 : 1;
  const ROWS = 8, RH = 32, Y0 = 64, RECH = Y0 + ROWS * RH + 78;
  const xL = VW * 0.12, xA = VW * 0.45, xB = VW * 0.8, BW = VW * 0.27;
  const CH = 230, PX0 = 52, PX1 = VW - 16, PY0 = 22, PY1 = CH - 40;
  rec.setAttribute('viewBox', `0 0 ${VW} ${RECH}`);
  cur.setAttribute('viewBox', `0 0 ${VW} ${CH}`);
  const txt = (x, y, str, fill, size = 15, bold = true, anchor = 'middle') =>
    s('text', { x, y, fill, 'font-size': size * F, 'font-weight': bold ? 700 : 400, 'text-anchor': anchor, 'font-family': 'Consolas, monospace' }, str);

  // green ✓ = returns (1), grey ✗ = does not return (0); ghost = a hidden result only the simulator knows
  function mark(x, y, r, ghost) {
    const o = ghost ? 0.4 : 1, rr = 11 * F, d = rr * 0.45;
    return [s('circle', { cx: x, cy: y, r: rr, fill: r ? C.green : C.muted, 'fill-opacity': (r ? 0.85 : 0.45) * o, stroke: r ? C.green : C.muted, 'stroke-opacity': o }),
      s('path', { d: r ? `M${x - d} ${y} L${x - d * 0.25} ${y + d * 0.8} L${x + d} ${y - d * 0.8}` : `M${x - d} ${y - d} L${x + d} ${y + d} M${x - d} ${y + d} L${x + d} ${y - d}`,
        stroke: r ? C.bg : C.ink, 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round', 'stroke-opacity': o })];
  }
  const unknown = (x, y) => [s('circle', { cx: x, cy: y, r: 11 * F, fill: C.bg, stroke: C.muted, 'stroke-width': 1.5 }), txt(x, y + 5 * F, '?', C.muted, 15)];

  function drawRecord(st) {
    const k = [], n = hist.length, from = Math.max(0, n - ROWS);
    k.push(txt(xL, 30, 'learner', C.muted, 14, false), txt(xA, 30, 'PROMPT A', C.cyan, 16), txt(xB, 30, 'PROMPT B', C.amber, 16),
      s('line', { x1: 10, x2: VW - 10, y1: 44, y2: 44, stroke: C.line }));
    if (!n) k.push(txt(VW / 2, Y0 + 3 * RH, 'No learners yet: press Step or Show A / B', C.muted, 14, false));
    for (let j = 0; j < Math.min(ROWS, n); j++) {
      const e = hist[from + j], y = Y0 + j * RH, newest = from + j === n - 1;
      k.push(txt(xL, y + 5, '#' + (from + j + 1), newest ? C.violet : C.muted, 14));
      for (const p of ['A', 'B']) {
        const x = p === 'A' ? xA : xB, r = p === 'A' ? e.rA : e.rB;
        if (p === e.pick) {
          if (newest) k.push(s('rect', { x: x - 22 * F, y: y - 14 * F, width: 66 * F, height: 28 * F, rx: 8, fill: 'none', stroke: COL[p], 'stroke-width': 2 }));
          k.push(...mark(x, y, r, false), txt(x + 26 * F, y + 5, String(r), r ? C.green : C.muted, 16));
        } else if (peek) k.push(...mark(x, y, r, true), s('circle', { cx: x, cy: y, r: 15 * F, fill: 'none', stroke: C.pink, 'stroke-dasharray': '3 3' }));
        else k.push(...unknown(x, y));
      }
    }
    const sy = Y0 + ROWS * RH + 6, by = sy + 30;
    k.push(s('line', { x1: 10, x2: VW - 10, y1: sy - 14, y2: sy - 14, stroke: C.line }),
      txt(xL, sy + 8, 'return', C.muted, 13, false), txt(xL, sy + 24, 'rate', C.muted, 13, false));
    for (const p of ['A', 'B']) {
      const x = p === 'A' ? xA : xB, o = st[p], e = est(o);
      k.push(txt(x, sy + 10, o.shown ? `${o.ret} ÷ ${o.shown} = ${pct(e)}` : '? no feedback yet', o.shown ? COL[p] : C.muted, 15),
        s('rect', { x: x - BW / 2, y: by, width: BW, height: 12, rx: 6, fill: C.line }));
      if (e) k.push(s('rect', { x: x - BW / 2, y: by, width: BW * e, height: 12, rx: 6, fill: COL[p] }));
      if (peek) {
        const tx = x - BW / 2 + BW * TRUE[p];
        k.push(s('line', { x1: tx, x2: tx, y1: by - 5, y2: by + 17, stroke: C.pink, 'stroke-width': 2 }), txt(tx, by + 32, 'true ' + pct(TRUE[p]), C.pink, 12, false));
      }
    }
    rec.replaceChildren(...k);
  }

  function drawCurve() {
    const n = hist.length, xmax = Math.max(20, n), X = i => PX0 + (PX1 - PX0) * i / xmax, Y = v => PY1 - (PY1 - PY0) * v, k = [];
    for (const g of [0, 0.5, 1]) k.push(s('line', { x1: PX0, x2: PX1, y1: Y(g), y2: Y(g), stroke: C.line }), txt(PX0 - 6, Y(g) + 4, pct(g), C.muted, 12, false, 'end'));
    k.push(txt(PX0, 12, 'estimated return rate', C.muted, 12, false, 'start'),
      txt((PX0 + PX1) / 2, CH - 10, 'learners so far', C.muted, 12, false), txt(PX1, CH - 22, String(xmax), C.muted, 12, false, 'end'));
    if (peek) for (const p of ['A', 'B']) k.push(s('line', { x1: PX0, x2: PX1, y1: Y(TRUE[p]), y2: Y(TRUE[p]), stroke: COL[p], 'stroke-dasharray': '6 5', 'stroke-opacity': 0.7 }),
      txt(PX1 - 4, Y(TRUE[p]) - 5, 'true ' + p, COL[p], 12, false, 'end'));
    const st = { A: { shown: 0, ret: 0 }, B: { shown: 0, ret: 0 } }, d = { A: '', B: '' };
    hist.forEach((e, i) => {
      st[e.pick].shown++; st[e.pick].ret += e.pick === 'A' ? e.rA : e.rB;
      for (const p of ['A', 'B']) if (st[p].shown) d[p] += `${d[p] ? 'L' : 'M'}${X(i + 1)} ${Y(st[p].ret / st[p].shown)} `;
    });
    for (const p of ['A', 'B']) if (d[p]) {
      k.push(s('path', { d: d[p], stroke: COL[p], 'stroke-width': 2.5, fill: 'none', 'stroke-linejoin': 'round' }),
        s('circle', { cx: X(n), cy: Y(st[p].ret / st[p].shown), r: 4.5, fill: COL[p] }));
    }
    cur.replaceChildren(...k);
  }

  function draw() {
    const st = stats(), n = hist.length;
    drawRecord(st);
    drawCurve();
    const line = p => st[p].shown ? [`${p}: ${st[p].ret} ÷ ${st[p].shown} = ${pct(est(st[p]))}`, COL[p]] : [`${p}: no learners shown yet → ?`, C.muted];
    if (!n) fbox(box, ['no learners yet', 'return rate = returns ÷ learners shown', line('A'), line('B')]);
    else {
      const e = hist[n - 1], o = e.pick === 'A' ? 'B' : 'A', r = e.pick === 'A' ? e.rA : e.rB;
      fbox(box, [`learner ${n}: app shows ${e.pick}${e.manual ? ' (your choice)' : ''}`,
        [`${e.pick}: ${r ? 'returns' : 'does not return'} → reward ${r}`, r ? C.green : C.muted],
        [`${o}: ? not shown, no feedback`, C.muted],
        'return rate = returns ÷ learners shown', line('A'), line('B')]);
    }
    count.textContent = `LEARNERS SO FAR: ${n}`;
    chanceLabel.textContent = `Chance the app shows A: ${chanceA}%`;
    speedLabel.textContent = `Speed: ${speed} learner${speed > 1 ? 's' : ''} per second`;
    note.textContent = peek ? 'Faded circles show what the other prompt would have given. Only the simulator knows this; the app never sees it.'
      : 'A question mark means we never saw that result. It is not a zero.';
    chal.update({ manualB, peek, differ: hist.some(e => e.rA !== e.rB), sinceB,
      sA: st.A.shown, sB: st.B.shown, eA: est(st.A) ?? -1, eB: est(st.B) ?? -1 });
  }
  draw();
  return () => { playing = false; cancelAnimationFrame(anim); };
}
