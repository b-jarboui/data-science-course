// 21.2.4 Try it: groundedness, claim by claim.
// The learner builds the assistant's answer from claims (tap to remove, pick to add), hides lines of the
// cited passage, checks the claims one at a time, makes random answers, and solves small self-checking challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const PASSAGE = ['Laptops are lent for 4 hours.', 'Laptop loans cannot be renewed.', 'Return laptops to the front desk.'];
  // src = the passage line that says the same thing, or -1 when the passage says nothing about it
  const POOL = [
    { text: 'Laptop loans cannot be renewed.', src: 1 },
    { text: 'You can keep a laptop for 4 hours.', src: 0 },
    { text: 'Late laptops cost 2 euros per hour.', src: -1 },
    { text: 'Bring the laptop back to the front desk.', src: 2 },
    { text: 'A laptop loan lasts four hours.', src: 0 },
    { text: 'You cannot extend a laptop loan.', src: 1 },
    { text: 'You can renew a laptop once online.', src: -1 },
    { text: 'Laptops come with a charger.', src: -1 },
    { text: 'You need your library card to borrow one.', src: -1 },
  ];
  const START = [0, 1, 2], MAX = 6;
  let ans = START.slice(), shown = [true, true, true], checked = START.length;
  let stepping = false, fresh = false, randomRun = false, randomDone = false;

  const svg = s('svg', { viewBox: '0 0 700 380' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const pick = h('select', { class: 'sim-btn', 'aria-label': 'Claim to add' }, POOL.map((c, i) => h('option', { value: i }, c.text)));
  const nextBtn = btn('Check next claim', step, 'go');
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: how grounded is the answer?'),
    h('p', { class: 'sub' }, 'Each claim of the answer is looked for in the cited passage. Tap a claim to remove it, add new ones, or tap a passage line to hide it.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, pick, btn('Add claim', add)),
        h('div', { class: 'sim-row' },
          btn('Check one by one', () => { if (!ans.length) return; checked = 0; stepping = true; randomRun = fresh; draw(); }),
          nextBtn,
          btn('New answer (random)', newAnswer),
          btn('Start again', () => { ans = START.slice(); shown = [true, true, true]; changed(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Make the answer 100% grounded, with at least 3 claims.',
      check: st => st.done && st.n >= 3 && st.sup === st.n,
      why: 'Yes! Every claim stands on the passage, so nothing floats in the air.' },
    { text: 'Make the groundedness exactly 50%.',
      check: st => st.done && st.n > 0 && st.sup * 2 === st.n,
      why: 'Right: half of the claims are supported, so supported ÷ claims = 1 ÷ 2.' },
    { text: 'Keep the claim “Laptop loans cannot be renewed.” but make it unsupported, without changing the answer.',
      check: st => st.done && st.ans.includes(0) && !st.shown[1],
      why: 'The claim did not change, only its passage did: groundedness checks the link to the passage, not whether a claim is true.' },
    { text: 'Press “New answer”, guess its groundedness, then press “Check one by one” and check every claim.',
      check: st => st.randomDone,
      why: 'Claim by claim, the checks over all claims always give the groundedness.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps the text readable
  const VW = NARROW ? 400 : 700, X0 = 10, X1 = VW - 10, RH = 34, PY = 28, AY = PY + 3 * RH + 34;
  const FS = NARROW ? 14 : 15, SANS = '"Segoe UI", Arial, sans-serif';
  svg.setAttribute('viewBox', `0 0 ${VW} ${AY + MAX * RH + 6}`);
  const tap = (el, fn) => { el.addEventListener('click', fn); el.style.cursor = 'pointer'; return el; };
  const supported = i => POOL[ans[i]].src >= 0 && shown[POOL[ans[i]].src];
  const r2 = x => Math.round(x * 100) / 100;

  function changed() { checked = ans.length; stepping = false; fresh = false; draw(); }
  function add() {
    const i = +pick.value;
    if (!ans.includes(i) && ans.length < MAX) { ans.push(i); changed(); }
  }
  function newAnswer() {
    const order = POOL.map((_, i) => i).sort(() => Math.random() - 0.5);
    ans = order.slice(0, rnd(2, 5)); shown = [true, true, true];
    changed(); fresh = true;
  }
  function step() {
    if (!stepping || checked >= ans.length) return;
    checked++;
    if (checked === ans.length) { stepping = false; if (randomRun) randomDone = true; }
    draw();
  }

  function draw() {
    const n = ans.length, k = [];
    // the cited passage
    k.push(s('text', { x: X0, y: 18, fill: C.muted, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas' }, NARROW ? 'CITED PASSAGE · tap to hide' : 'CITED PASSAGE · tap a line to hide it'));
    PASSAGE.forEach((p, j) => {
      const y = PY + j * RH, on = shown[j];
      const by = ans.map((a, i) => (i < checked && on && POOL[a].src === j ? i + 1 : 0)).filter(Boolean);
      const g = s('g', {},
        s('rect', { x: X0, y, width: X1 - X0, height: 28, rx: 6, fill: on ? C.card : 'none', stroke: by.length ? C.green : C.line, 'stroke-dasharray': on ? null : '5 4' }),
        s('text', { x: X0 + 10, y: y + 19, fill: on ? C.ink : C.muted, 'font-size': FS, 'font-family': SANS, 'text-decoration': on ? null : 'line-through', opacity: on ? 1 : 0.6 }, on ? p : p + ' (hidden)'),
        s('text', { x: X1 - 10, y: y + 19, fill: C.green, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, by.length ? (NARROW ? '✓' + by.join(',') : 'claim ' + by.join(', ')) : ''));
      tap(g, () => { shown[j] = !shown[j]; changed(); });
      k.push(g);
    });
    // the answer, one claim per row
    k.push(s('text', { x: X0, y: AY - 10, fill: C.muted, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas' },
      NARROW ? `ANSWER · ${n} CLAIM${n === 1 ? '' : 'S'} · tap to remove` : `ASSISTANT’S ANSWER · ${n} CLAIM${n === 1 ? '' : 'S'} · tap a claim to remove it`));
    if (!n) k.push(s('text', { x: X0 + 10, y: AY + 19, fill: C.muted, 'font-size': FS, 'font-family': SANS }, 'No claims: add one with “Add claim”.'));
    ans.forEach((a, i) => {
      const y = AY + i * RH, c = POOL[a], done = i < checked, ok = supported(i), now = stepping && i === checked - 1;
      const col = !done ? C.muted : ok ? C.green : C.pink;
      const g = s('g', {},
        s('rect', { x: X0, y, width: X1 - X0, height: 28, rx: 6, fill: C.card, stroke: now ? C.amber : done ? col : C.line, 'stroke-width': now ? 2 : 1 }),
        s('circle', { cx: X0 + 16, cy: y + 14, r: 10, fill: 'none', stroke: C.amber }),
        s('text', { x: X0 + 16, y: y + 19, fill: C.amber, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, i + 1),
        s('text', { x: X0 + 34, y: y + 19, fill: C.ink, 'font-size': FS, 'font-family': SANS }, c.text),
        s('text', { x: X1 - 12, y: y + 20, fill: col, 'font-size': 18, 'font-weight': 700, 'text-anchor': 'end' }, done ? (ok ? '✓' : '✗') : '?'),
        !NARROW && done ? s('text', { x: X1 - 34, y: y + 19, fill: col, 'font-size': 12, 'text-anchor': 'end', 'font-family': 'Consolas' }, ok ? `line ${c.src + 1}` : 'not in passage') : null);
      tap(g, () => { ans.splice(i, 1); changed(); });
      k.push(g);
    });
    svg.replaceChildren(...k);

    // formula box: only the claims checked so far count
    const sp = ans.slice(0, checked).filter((_, i) => supported(i)).length;
    if (!n) fbox(box, ['claims       = 0', ['add a claim to measure groundedness', C.muted]]);
    else if (!checked) fbox(box, [`claims checked = 0 of ${n}`, ['press “Check next claim”', C.muted]]);
    else {
      const pct = 100 * sp / checked, eq = Number.isInteger(pct) ? '=' : '≈';
      fbox(box, [`supported    = ${sp}`, `claims       = ${checked}${checked < n ? ` (checked so far, of ${n})` : ''}`,
        [`groundedness = ${sp} ÷ ${checked} ${eq} ${fmt(r2(sp / checked))} ${eq} ${Math.round(pct)}%`, C.amber]]);
    }
    note.textContent = stepping ? `Checking claim by claim: ${checked} of ${n} checked. Look for the next claim in the passage.`
      : shown.includes(false) ? 'A hidden line no longer supports its claims, even though the claims did not change.'
      : 'A claim is supported when the passage says the same thing, even in other words.';
    nextBtn.disabled = !stepping || checked >= n;
    [...pick.options].forEach((o, i) => { o.disabled = ans.includes(i); });
    const free = POOL.findIndex((_, i) => !ans.includes(i));
    if (ans.includes(+pick.value) && free >= 0) pick.value = String(free);
    chal.update({ n, sup: sp, done: checked === n, ans, shown, randomDone });
  }
  draw();
  return () => {};
}
