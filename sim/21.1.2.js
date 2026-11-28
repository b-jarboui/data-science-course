// 21.1.2 Try it: structured output, one token at a time.
// The learner steps the model through filling the form (Step, Play / Pause, speed, Reset), switches
// constrained decoding on or off, lets the model swap two card digits, taps the filled form to change
// values, and watches the app check. Challenges check themselves.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const ACTIONS = ['renew', 'reserve', 'hours'], NAMES = ['action', 'title', 'card'];
  const TITLES = ['The Hobbit', 'Matilda', 'Black Beauty', 'The Silver Gate', 'Moon Garden', 'Dune'];
  const START = { action: 'renew', title: 'The Hobbit', card: '4417' };
  const CHAT = ['Sure', '!', ' I', ' can', ' help', ' with', ' that', '.'];
  const CLOSE = 'close box', DIGITS = '0123456789'.split('');
  let req = { ...START }, constrained = true, slip = false;
  let plan = [], pos = 0, form = null, timer = 0, playing = false, edited = false, slipDone = false;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), checkEl = h('div'), ch = h('div');
  const visitor = h('div', { class: 'sim-note', style: { marginTop: 0, marginBottom: '.6rem' } });
  const counter = h('span', { class: 'sim-note', style: { margin: 0 } });
  const speed = h('input', { type: 'range', min: 1, max: 5, step: 1, value: 2, 'aria-label': 'Speed' });
  const playBtn = btn('▶ Play', () => togglePlay());
  const conBtn = btn('', () => { constrained = !constrained; reset(); });
  const slipBtn = btn('', () => { slip = !slip; reset(); });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: fill the form, one token at a time'),
    h('p', { class: 'sub' }, 'The model turns the visitor’s request into the form. At each step, tokens that would break the form are hidden. Step through it, switch the limits off, or let the model swap two digits.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, visitor, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Step', () => { stop(); step(); }, 'go'), playBtn,
          h('label', { class: 'sim-note', style: { margin: 0, display: 'flex', alignItems: 'center', gap: '.4rem' } }, 'Speed', speed),
          btn('Reset', () => reset()), counter),
        h('div', { class: 'sim-row' }, conBtn, slipBtn,
          btn('New request (random)', () => { newRequest(); reset(); }),
          btn('Start again', () => { req = { ...START }; constrained = true; slip = false; reset(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, checkEl), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Press “Step” until the form is full. Do all the app checks pass?',
      check: st => st.finished && st.constrained && !st.slip && st.shape && st.match,
      why: 'Yes: at each step only tokens that keep the form valid could be picked, so the form is full and valid.' },
    { text: 'Turn constrained decoding OFF, press Play, and watch. What happens to the form?',
      check: st => st.finished && !st.constrained,
      why: 'With nothing hidden, the model chatted instead. The form stayed empty, so the app check failed.' },
    { text: 'Turn constrained decoding back ON and “Model slip” ON. Run to the end. Do the checks catch the swapped digits?',
      check: st => st.finished && st.constrained && st.slip && st.shape && !st.match,
      why: 'No: four digits is the right shape, so every check passes. Only comparing with the visitor’s words shows the card is wrong.' },
    { text: 'Now fix it: tap the card digits until the form matches what the visitor wrote.',
      check: st => st.fixed,
      why: 'Right: for important actions, compare the value with the visitor’s own words, or ask them to confirm.' },
  ]);

  const said = r => r.action === 'hours'
    ? `When are you open? I want to pick up ${r.title}. My card number is ${r.card}.`
    : `Please ${r.action} ${r.title} for me. My card number is ${r.card}.`;
  function newRequest() {
    let card;
    do card = String(rnd(1000, 9999)); while (card[2] === card[3]);
    req = { action: ACTIONS[rnd(0, 2)], title: TITLES[rnd(0, TITLES.length - 1)], card };
  }

  // the model's plan: one token per step
  const pieces = t => t.split(' ').flatMap((w, i) => (w.length > 5 ? [w.slice(0, 3), w.slice(3)] : [w]).map((p, j) => i && !j ? ' ' + p : p));
  const uniq = a => [...new Set(a)];
  function build() {
    if (!constrained) return CHAT.map(pick => ({ box: -1, pick, cand: uniq([pick, 'renew', 'Sure', 'Hello', ' I', '4']).slice(0, 6) }));
    const digits = req.card.split('');
    if (slip) [digits[2], digits[3]] = [digits[3], digits[2]];
    const steps = [{ box: 0, pick: req.action, cand: [...ACTIONS, 'Sure', 'Hello', ' I'] }];
    for (const p of pieces(req.title)) steps.push({ box: 1, pick: p, cand: uniq([p, 'The', ' Hob', 'bit', 'Sure', '4']).slice(0, 5).concat(CLOSE) });
    steps.push({ box: 1, pick: CLOSE, cand: ['The', ' Hob', 'bit', 'Sure', '4', CLOSE] });
    digits.forEach(d => steps.push({ box: 2, pick: d, cand: [...DIGITS, 'Sure', 'a'] }));
    return steps;
  }
  const allowed = (st, t) => st.box === 0 ? ACTIONS.includes(t) : st.box === 2 ? DIGITS.includes(t) : true;
  const done = () => pos >= plan.length;

  function reset() { stop(); plan = build(); pos = 0; edited = false; form = { action: null, title: '', closed: false, card: [], chat: '' }; draw(); }
  function step() {
    if (done()) return;
    const st = plan[pos++];
    if (st.box === 0) form.action = st.pick;
    else if (st.box === 1 && st.pick === CLOSE) form.closed = true;
    else if (st.box === 1) form.title += st.pick;
    else if (st.box === 2) form.card.push(st.pick);
    else form.chat += st.pick;
    if (done() && constrained && slip) slipDone = true;
    draw();
  }
  function stop() { playing = false; clearTimeout(timer); }
  function tick() {
    step();
    if (!done()) timer = setTimeout(tick, 1600 / +speed.value);
    else { playing = false; draw(); }
  }
  function togglePlay() {
    if (playing) { stop(); draw(); return; }
    if (done()) reset();
    playing = true; tick();
  }
  function pickAction(a) { if (!done()) return; form.action = a; edited = true; draw(); }
  function tapCell(j) {
    if (!done()) return;
    if (form.card[j] == null) while (form.card.length <= j) form.card.push('0');
    else form.card[j] = String((+form.card[j] + 1) % 10);
    edited = true; draw();
  }

  function checks() {
    const there = !!form.action && form.title.length > 0 && form.card.length > 0;
    const choice = ACTIONS.includes(form.action);
    const four = form.card.length === 4 && form.card.every(d => DIGITS.includes(d));
    const match = form.action === req.action && form.title === req.title && form.card.join('') === req.card;
    return { there, choice, four, shape: there && choice && four, match };
  }
  function written() {
    if (form.chat) return `“${form.chat}”`;
    const parts = [];
    if (form.action) parts.push(`"action": "${form.action}"`);
    if (form.title) parts.push(`"title": "${form.title}${form.closed ? '"' : ''}`);
    if (form.card.length) parts.push(`"card": ${form.card.join('')}`);
    return '{' + parts.join(', ') + (done() && parts.length ? '}' : '');
  }

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: form on top, tokens below
  const VW = NARROW ? 400 : 700, VH = NARROW ? 700 : 440, F = NARROW ? 1.15 : 1;
  const FX = NARROW ? 12 : 16, FWD = NARROW ? 376 : 380, RY = NARROW ? [40, 128, 216] : [56, 152, 248];
  const PX = NARROW ? 12 : 420, PY = NARROW ? 350 : 20, PW = NARROW ? 376 : 264;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const mono = 'Consolas, monospace';
  const show = t => t === CLOSE ? t : t.trim();

  function draw() {
    const k = [], cur = pos ? plan[pos - 1] : null, fin = done(), c = checks(), n = plan.length;
    const x0 = FX + 10, w = FWD - 20;
    // the form
    k.push(s('rect', { x: FX, y: RY[0] - 30, width: FWD, height: RY[2] - RY[0] + 102, rx: 12, fill: C.bg, stroke: '#344264' }));
    NAMES.forEach((name, r) => {
      const fy = RY[r] + 10, on = cur && !fin && cur.box === r;
      k.push(s('text', { x: x0, y: RY[r], fill: on ? C.amber : C.muted, 'font-size': 14 * F, 'font-family': mono }, `${r + 1}  ${name}`));
      if (on) k.push(s('rect', { x: x0 - 5, y: fy - 5, width: w + 10, height: 54, rx: 11, fill: 'none', stroke: C.amber, 'stroke-width': 2.5 }));
      if (r === 0) ACTIONS.forEach((a, i) => {
        const cw = (w - 16) / 3, cx = x0 + i * (cw + 8), sel = form.action === a;
        const g = s('g', { style: fin ? 'cursor:pointer' : null },
          s('rect', { x: cx, y: fy, width: cw, height: 44, rx: 8, fill: sel ? C.amber : C.card, 'fill-opacity': sel ? .18 : 1, stroke: sel ? C.amber : C.cyan }),
          s('rect', { x: cx + 10, y: fy + 14, width: 16, height: 16, rx: 3, fill: 'none', stroke: sel ? C.amber : C.muted }),
          sel ? s('text', { x: cx + 18, y: fy + 28, fill: C.green, 'font-size': 16 * F, 'font-weight': 700, 'text-anchor': 'middle' }, '✓') : null,
          s('text', { x: cx + 34, y: fy + 28, fill: sel ? C.amber : C.ink, 'font-size': 15 * F, 'font-family': mono }, a));
        g.addEventListener('click', () => pickAction(a));
        k.push(g);
      });
      if (r === 1) k.push(s('rect', { x: x0, y: fy, width: w, height: 44, rx: 8, fill: C.card, stroke: C.cyan }),
        s('text', { x: x0 + 12, y: fy + 28, fill: C.amber, 'font-size': 17 * F, 'font-family': mono }, form.title + (on ? '▌' : '')));
      if (r === 2) {
        for (let j = 0; j < 4; j++) {
          const cx = x0 + j * 66, d = form.card[j], wrong = fin && d != null && d !== req.card[j];
          const g = s('g', { style: fin ? 'cursor:pointer' : null },
            s('rect', { x: cx, y: fy, width: 54, height: 44, rx: 8, fill: C.card, stroke: wrong ? C.pink : C.cyan }),
            s('text', { x: cx + 27, y: fy + 30, fill: wrong ? C.pink : C.amber, 'font-size': 22 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': mono }, d ?? ''));
          g.addEventListener('click', () => tapCell(j));
          k.push(g);
        }
        if (fin) k.push(s('text', { x: x0 + 270, y: fy + 28, fill: C.muted, 'font-size': 13 * F }, 'tap to change'));
      }
    });
    k.push(s('text', { x: FX + 4, y: RY[2] + 102, fill: form.chat ? C.pink : C.muted, 'font-size': 13 * F, 'font-family': mono },
      form.chat ? `model wrote: “${form.chat}”` : constrained ? 'the model can only write into the form' : 'no limits: the model may write anything'));

    // the next-token choices of this step
    const st = cur || plan[0], cw = (PW - 16) / 3;
    k.push(s('text', { x: PX, y: PY + 14, fill: C.ink, 'font-size': 15 * F, 'font-weight': 700 }, cur ? `Step ${pos}: the model picked “${show(cur.pick)}”` : 'Step 1: which token comes next?'));
    st.cand.forEach((t, i) => {
      const x = PX + (i % 3) * (cw + 8), y = PY + 30 + Math.floor(i / 3) * 42, ok = allowed(st, t), picked = cur && t === cur.pick;
      k.push(s('rect', { x, y, width: cw, height: 34, rx: 17, fill: picked ? C.amber : C.bg, 'fill-opacity': picked ? .22 : 1, stroke: picked ? C.amber : ok ? C.cyan : C.muted, 'stroke-opacity': ok ? 1 : .35 }),
        s('text', { x: x + cw / 2, y: y + 22, fill: picked ? C.amber : ok ? C.ink : C.muted, 'fill-opacity': ok ? 1 : .45, 'font-size': 14 * F, 'font-weight': picked ? 700 : 400, 'text-anchor': 'middle', 'font-family': mono, 'text-decoration': ok ? null : 'line-through' }, show(t)));
    });
    k.push(s('text', { x: PX, y: PY + 214, fill: C.muted, 'font-size': 12 * F }, 'crossed out = hidden: it would break the form'));

    // a bar per step: share of tokens still allowed
    const top = PY + 252, base = PY + (NARROW ? 336 : 400), hh = base - top, bw = Math.min(22, PW / n - 4);
    k.push(s('text', { x: PX, y: top - 8, fill: C.muted, 'font-size': 12 * F }, 'tokens still allowed, step by step'),
      s('text', { x: PX + PW, y: top - 8, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end' }, 'all'),
      s('line', { x1: PX, x2: PX + PW, y1: top, y2: top, stroke: C.line, 'stroke-dasharray': '4 5' }),
      s('line', { x1: PX, x2: PX + PW, y1: base, y2: base, stroke: C.line }));
    for (let i = 0; i < pos; i++) {
      const p = plan[i], frac = p.cand.filter(t => allowed(p, t)).length / p.cand.length;
      k.push(s('rect', { x: PX + i * (bw + 4), y: base - frac * hh, width: bw, height: frac * hh, rx: 3, fill: frac < 1 ? C.green : C.cyan, 'fill-opacity': .8 }));
    }
    svg.replaceChildren(...k);

    // formula box: this step's numbers
    const boxName = b => b < 0 ? 'none (free text)' : NAMES[b];
    const rule = p => p.box === 0 ? 'renew | reserve | hours' : p.box === 1 ? 'any text, until closed'
      : p.box === 2 ? `digits only (${plan.slice(0, pos).filter(q => q.box === 2).length || 1} of 4)` : 'anything (no limits)';
    const hidden = p => p.cand.filter(t => !allowed(p, t)).map(show).join(', ') || 'nothing';
    fbox(box, cur
      ? [`step ${pos} of ${n} · box: ${boxName(cur.box)}`, `allowed: ${rule(cur)}`, `hidden:  ${hidden(cur)}`, [`picked:  ${show(cur.pick)}`, C.amber], `written: ${written()}`]
      : ['step 0: nothing written yet', `next box: ${boxName(plan[0].box)}`, `allowed: ${rule(plan[0])}`, `written: ${written()}`]);
    note.textContent = !fin ? 'Amber outline = the box being filled. Crossed-out tokens are hidden: picking them would break the form.'
      : form.chat ? 'No limits: the model chatted instead of filling the form, so the app check fails.'
      : c.shape && !c.match ? 'Every check passes, but a value is wrong. The schema checks the shape, not the truth.'
      : c.shape ? 'Valid and correct: the request can go to the library system.'
      : 'The form does not fit the schema, so the app rejects it.';

    // the app check, then the comparison with the visitor's words
    const line = (ok, text) => h('div', { style: { color: ok ? C.green : C.pink } }, (ok ? '✓ ' : '✗ ') + text);
    checkEl.replaceChildren(h('div', { style: { fontWeight: 700 } }, 'The app checks the form'),
      ...(fin ? [line(c.there, 'all three boxes are there'), line(c.choice, 'action is one of the 3 choices'), line(c.four, 'card has exactly 4 digits'),
        h('div', { style: { fontWeight: 700, marginTop: '.5rem' } }, 'Compare with the visitor’s words'),
        line(c.match, 'the form says what the visitor wrote')]
        : [h('div', { class: 'sim-note' }, 'It checks once the model has finished.')]));

    visitor.textContent = `Visitor: “${said(req)}”`;
    counter.textContent = `Step ${pos} / ${n}`;
    playBtn.textContent = playing ? '❚❚ Pause' : '▶ Play';
    conBtn.textContent = `Constrained decoding: ${constrained ? 'ON' : 'OFF'}`;
    slipBtn.textContent = `Model slip (swap 2 digits): ${slip ? 'ON' : 'OFF'}`;
    chal.update({ finished: fin, constrained, slip, shape: c.shape, match: c.match, fixed: slipDone && edited && fin && c.shape && c.match });
  }
  reset();
  return () => clearTimeout(timer);
}
