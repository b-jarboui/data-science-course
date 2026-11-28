// 15.2.1 Try it: a world of moves and rewards.
// The learner drives the delivery cart (tap a move, or a neighbouring cell) and sees state, action, next state and reward.
// A wet-floor slider changes the transition law; "Try ... ×100" counts where the cart really arrives.
// "New start" gives a random start cell and floor; the challenges check themselves.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const NAMES = ['A', 'B', 'C', 'D'];
  const POS = { A: [0, 0], B: [1, 0], C: [0, 1], D: [1, 1] };
  const MOVES = { A: { right: 'B', down: 'C' }, B: { left: 'A', down: 'D' }, C: { up: 'A', right: 'D' }, D: {} };
  const DIR = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] };
  const LABEL = { right: '→ right', left: '← left', up: '↑ up', down: '↓ down' };
  let start = 'A', cell = 'A', slip = 0, path = ['A'], points = 0, done = false, last = null, msg = '';
  let deliveries = 0, twoFromA = false, slipped = false, trial = null, cartXY = null, anim = 0, tAnim = 0;

  const svg = s('svg', { viewBox: '0 0 400 510' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const slipLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const slider = h('input', { type: 'range', min: 0, max: 50, step: 10, value: 0, 'aria-label': 'Slip chance',
    oninput: e => { slip = +e.target.value; draw(); } });
  const moveBtns = Object.fromEntries(Object.keys(DIR).map(a => [a, btn(LABEL[a], () => act(a))]));
  const trialRow = h('div', { class: 'sim-row' });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: drive the delivery cart'),
    h('p', { class: 'sub' }, 'You are the cart. Tap a move, or a neighbouring cell, to choose an action. Watch your state, the transition law and your reward.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, ...Object.values(moveBtns)),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, slipLabel, slider),
        trialRow,
        h('div', { class: 'sim-row' },
          btn('New delivery', () => newDelivery(), 'go'),
          btn('New start (random)', () => { start = NAMES[rnd(0, 2)]; slip = rnd(0, 3) * 10; stopTrial(); newDelivery(); }),
          btn('Reset', () => { start = 'A'; slip = 0; stopTrial(); newDelivery(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Start at A and bring the cart to the dock. How many points do you get?',
      check: st => st.deliveries >= 1, why: 'Ten points, and the delivery ends. Every other move earned zero.' },
    { text: 'Start at A and reach the dock in exactly two moves.',
      check: st => st.twoFromA, why: 'Right then down, or down then right: two actions, two new states, one reward of ten.' },
    { text: 'Make the floor wet, then choose a move and arrive somewhere you did not choose.',
      check: st => st.slipped, why: 'Choosing a move and arriving are two different things. The transition law gives the chance of each arrival.' },
    { text: 'Set the slip chance to 20%, stand in A and press “Try right from A ×100”. Do about 80 tries reach B?',
      check: st => st.trial20, why: 'About 80 reach B and about 20 slide to C. The transition law gives the chances; single tries can differ.' },
  ]);

  // transition law: [[next cell, chance], ...] for action a in cell c
  function law(c, a, p = slip) {
    const to = MOVES[c][a], other = Object.values(MOVES[c]).find(t => t !== to);
    return [[to, 1 - p / 100], [other, p / 100]];
  }
  const sample = (c, a, p) => { const [[to], [other]] = law(c, a, p); return Math.random() < p / 100 ? other : to; };

  function newDelivery() {
    cancelAnimationFrame(anim);
    cell = start; path = [start]; points = 0; done = false; last = null; msg = ''; cartXY = null;
    draw();
  }
  function stopTrial() { cancelAnimationFrame(tAnim); trial = null; }

  function act(a) {
    if (done) { msg = 'The delivery has ended. Press “New delivery”.'; return draw(); }
    if (!MOVES[cell][a]) { msg = 'You cannot move outside the four cells.'; return draw(); }
    const from = cell, to = sample(cell, a, slip), reward = to === 'D' ? 10 : 0, slid = to !== MOVES[cell][a];
    if (slid) slipped = true;
    last = { from, a, to, reward, slid }; points += reward; path.push(to); cell = to; msg = '';
    if (to === 'D') { done = true; deliveries++; if (start === 'A' && path.length === 3) twoFromA = true; }
    moveCart(from, to);
  }
  function moveCart(from, to) {
    cancelAnimationFrame(anim);
    const a = ctr(from), b = ctr(to), t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 380), e = k * k * (3 - 2 * k);
      cartXY = [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e];
      draw();
      if (k < 1) anim = requestAnimationFrame(step); else cartXY = null;
    };
    anim = requestAnimationFrame(step);
  }
  // many tries of one action: the counts grow, then sit beside the transition law
  function runTrials(a) {
    cancelAnimationFrame(tAnim);
    const t = trial = { from: cell, action: a, slip, counts: { A: 0, B: 0, C: 0, D: 0 }, n: 0 };
    const step = () => {
      if (trial !== t) return;
      for (let i = 0; i < 3 && t.n < 100; i++) { t.counts[sample(t.from, a, t.slip)]++; t.n++; }
      draw();
      if (t.n < 100) tAnim = requestAnimationFrame(step);
    };
    tAnim = requestAnimationFrame(step);
  }
  let rowKey = '';
  function trialButtons() {
    const key = done ? 'done' : cell;
    if (key === rowKey) return;
    rowKey = key;
    trialRow.replaceChildren(...(done ? [] : Object.keys(MOVES[cell]).map(a => btn(`Try ${a} from ${cell} ×100`, () => runTrials(a)))));
  }

  // geometry
  const X0 = 50, Y0 = 14, CS = 150, mono = 'Consolas, monospace';
  const ctr = c => [X0 + (POS[c][0] + 0.5) * CS, Y0 + (POS[c][1] + 0.5) * CS];
  const pct = p => fmt(Math.round(p * 100)) + '%';

  // tap a neighbouring cell = choose the move that points there
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), i = Math.floor((p.x - X0) / CS), j = Math.floor((p.y - Y0) / CS);
    if (i < 0 || i > 1 || j < 0 || j > 1) return;
    const c = NAMES[j * 2 + i];
    if (c === cell) return;
    const a = Object.keys(MOVES[cell]).find(k => MOVES[cell][k] === c);
    if (a) act(a);
    else { msg = done ? 'The delivery has ended. Press “New delivery”.' : `From ${cell}, you cannot reach ${c} in one move.`; draw(); }
  });

  function draw() {
    const k = [];
    for (const c of NAMES) {
      const x = X0 + POS[c][0] * CS, y = Y0 + POS[c][1] * CS;
      k.push(s('rect', { x, y, width: CS, height: CS, fill: slip > 0 ? '#14325a' : C.card, stroke: '#536485', 'stroke-width': 2 }));
      if (c === 'D') k.push(
        s('rect', { x: x + 10, y: y + 10, width: CS - 20, height: CS - 20, rx: 6, fill: C.green, 'fill-opacity': .12, stroke: C.green, 'stroke-width': 2 }),
        s('text', { x: x + CS / 2, y: y + CS - 20, fill: C.green, 'font-size': 15, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, 'DOCK'));
      k.push(s('text', { x: x + 16, y: y + 30, fill: C.muted, 'font-size': 20, 'font-weight': 700, 'font-family': mono }, c));
    }
    // the state: where the cart is now
    const [sx, sy] = ctr(cell);
    k.push(s('rect', { x: sx - CS / 2 + 4, y: sy - CS / 2 + 4, width: CS - 8, height: CS - 8, rx: 4, fill: 'none', stroke: C.cyan, 'stroke-width': 4 }));
    // the actions, each with its chance of arriving where it points
    if (!done) for (const a of Object.keys(MOVES[cell])) {
      const [dx, dy] = DIR[a], x1 = sx + dx * 46, y1 = sy + dy * 46, x2 = sx + dx * 110, y2 = sy + dy * 110, px = -dy, py = dx;
      k.push(s('line', { x1, y1, x2: x2 - dx * 10, y2: y2 - dy * 10, stroke: C.amber, 'stroke-width': 5, 'stroke-linecap': 'round' }),
        s('polygon', { points: `${x2},${y2} ${x2 - dx * 16 + px * 9},${y2 - dy * 16 + py * 9} ${x2 - dx * 16 - px * 9},${y2 - dy * 16 - py * 9}`, fill: C.amber }),
        s('text', { x: (x1 + x2) / 2 + px * 26, y: (y1 + y2) / 2 + py * 26 + 5, fill: C.amber, 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, pct(1 - slip / 100)));
    }
    // the reward of the last move, in the cell it reached
    if (last) {
      const [rx, ry] = ctr(last.to);
      k.push(s('text', { x: rx + CS / 2 - 14, y: ry - CS / 2 + 30, fill: C.amber, 'font-size': 18, 'font-weight': 700, 'text-anchor': 'end', 'font-family': mono }, last.reward ? '+10' : '+0'));
    }
    // the cart
    const [cx, cy] = cartXY || ctr(cell);
    k.push(s('rect', { x: cx - 13, y: cy - 30, width: 26, height: 18, rx: 2, fill: C.amber }),
      s('rect', { x: cx - 28, y: cy - 14, width: 56, height: 28, rx: 6, fill: C.ink }),
      s('circle', { cx: cx - 17, cy: cy + 18, r: 7, fill: C.bg, stroke: C.muted, 'stroke-width': 2 }),
      s('circle', { cx: cx + 17, cy: cy + 18, r: 7, fill: C.bg, stroke: C.muted, 'stroke-width': 2 }));
    // many tries: bars = where the cart arrived, dashed = the transition law
    const HY = 480, HH = 100;
    if (trial) {
      const exp = Object.fromEntries(law(trial.from, trial.action, trial.slip));
      k.push(s('text', { x: 200, y: 338, fill: C.ink, 'font-size': 15, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, `From ${trial.from}, ${trial.action}: ${trial.n} tries`),
        s('text', { x: 200, y: 356, fill: C.muted, 'font-size': 12, 'text-anchor': 'middle', 'font-family': mono }, 'bars = arrivals   dashed = transition law'),
        s('line', { x1: 60, x2: 350, y1: HY, y2: HY, stroke: C.line }));
      NAMES.forEach((c, i) => {
        const x = 70 + i * 75, n = trial.counts[c], hh = n / 100 * HH, e = exp[c] || 0;
        k.push(s('rect', { x, y: HY - hh, width: 50, height: hh, rx: 2, fill: C.cyan, 'fill-opacity': .82 }),
          s('line', { x1: x - 6, x2: x + 56, y1: HY - e * HH, y2: HY - e * HH, stroke: C.amber, 'stroke-width': 2, 'stroke-dasharray': '6 4' }),
          s('text', { x: x + 25, y: HY - hh - 6, fill: C.cyan, 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, n),
          s('text', { x: x + 25, y: HY + 20, fill: C.muted, 'font-size': 15, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, c));
      });
    } else {
      k.push(s('text', { x: 200, y: 400, fill: C.muted, 'font-size': 14, 'text-anchor': 'middle', 'font-family': mono }, 'Press a “Try … ×100” button'),
        s('text', { x: 200, y: 420, fill: C.muted, 'font-size': 14, 'text-anchor': 'middle', 'font-family': mono }, 'to test the transition law.'));
    }
    svg.replaceChildren(...k);

    const lines = [done ? ['state = D (dock): delivery ended', C.green] : [`state = ${cell}`, C.cyan]];
    if (!done) for (const a of Object.keys(MOVES[cell]))
      lines.push(`${a.padEnd(5)} → ` + law(cell, a).filter(([, p]) => p > 0).map(([t, p]) => `${t} ${pct(p)}`).join(', '));
    lines.push(last ? [`last: ${last.from}, ${last.a} → ${last.to}, reward ${last.reward}`, C.amber] : ['last: no move yet', C.muted]);
    lines.push(`points this delivery = ${points}`);
    fbox(box, lines);
    const slid = last && last.slid ? `The floor was wet: you chose ${last.a}, but the cart slid to ${last.to}. ` : '';
    note.textContent = (msg ? msg + ' ' : '') + slid + `Path: ${path.join(' → ')}. The chances depend only on the current cell and the move, not on this path.`;
    slipLabel.textContent = `Wet floor, slip chance: ${slip}%`;
    slider.value = slip;
    for (const [a, b] of Object.entries(moveBtns)) { const off = done || !MOVES[cell][a]; b.disabled = off; b.style.opacity = off ? 0.4 : 1; }
    trialButtons();
    chal.update({ deliveries, twoFromA, slipped,
      trial20: !!trial && trial.n >= 100 && trial.from === 'A' && trial.action === 'right' && trial.slip === 20 });
  }
  draw();
  return () => { cancelAnimationFrame(anim); cancelAnimationFrame(tAnim); };
}
