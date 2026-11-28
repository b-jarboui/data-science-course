// 21.2.12 Try it: deployment decisions.
// One hundred held-out cards sorted into four boxes. The learner moves cards between boxes, adds more cards,
// makes a fresh test, repeats the test twenty times, and watches the tug of war, the interval and the sealed rule decide.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const BLUE = '#60a5fa', ORANGE = '#fb923c';
  const START = [76, 10, 4, 10];                  // both right, only B, only A, both wrong
  const TRUTH0 = [0.76, 0.10, 0.04, 0.10];        // the hidden mix over all the questions people will ask
  let cnt = START.slice(), truth = TRUTH0.slice(), runs = [], timer = 0, repeats = 0;

  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: switch to B, or not yet?'),
    h('p', { class: 'sub' }, 'A and B answer the same held-out cards. Move cards between the boxes, add more cards, or repeat the whole test. The green line at 0 is the rule sealed before the test: switch only if the whole bar lies right of it.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Only B +1', () => move(1, 1)), btn('Only B −1', () => move(1, -1)),
          btn('Only A +1', () => move(2, 1)), btn('Only A −1', () => move(2, -1))),
        h('div', { class: 'sim-row' },
          btn('New data (random)', newData, 'go'),
          btn('Add 100 more cards', more),
          btn('Repeat the test 20 times', repeat),
          btn('Start again', () => { cnt = START.slice(); truth = TRUTH0.slice(); changed(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const r1 = x => Math.round(x * 10) / 10;
  const sg = x => x < 0 ? '−' + fmt(-x) : fmt(x);
  function stats(c = cnt) {
    const n = c[0] + c[1] + c[2] + c[3], d = (c[1] - c[2]) / n;
    const se = Math.sqrt(Math.max(0, (c[1] + c[2]) / n - d * d) / n);
    return { n, d: 100 * d, se: 100 * se, lo: 100 * (d - 2 * se), hi: 100 * (d + 2 * se) };
  }
  // k new held-out cards drawn from all the questions people ask
  function drawCards(k) {
    const c = [0, 0, 0, 0];
    for (let i = 0; i < k; i++) { let u = Math.random(), b = 0; while (b < 3 && u >= truth[b]) { u -= truth[b]; b++; } c[b]++; }
    return c;
  }

  const chal = challenges(ch, [
    { text: 'Move cards so the rule says SWITCH: the whole bar right of 0.',
      check: st => st.lo > 0, why: 'Yes! With enough more only-B cards than only-A cards, even the low end of the interval is above zero.' },
    { text: 'Press “Add 100 more cards” until the interval is less than 10 points wide.',
      check: st => st.n > 100 && st.width < 10, why: 'Right: more cards make the wobble smaller, so the range of believable values gets narrower.' },
    { text: 'Make the difference exactly 0 while “only B” still holds at least 5 cards.',
      check: st => st.b === st.a && st.b >= 5, why: 'Cards pulling toward B and toward A cancel out. Only the difference between the two boxes counts.' },
    { text: 'Predict: out of 20 new tests, how many ranges catch the true difference? Then press “Repeat the test 20 times”.',
      check: st => st.repeats >= 1, why: 'About 19 in 20: that is what a 95 percent interval means. Now and then one range misses.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.2 : 1;
  const X0 = NARROW ? 10 : 20, X1 = VW - 10, AMIN = -20, AMAX = 30;
  svg.setAttribute('viewBox', `0 0 ${VW} 470`);
  const BC = [C.green, ORANGE, BLUE, C.pink], NAMES = ['BOTH RIGHT', 'ONLY B', 'ONLY A', 'BOTH WRONG'];
  const xv = v => X0 + (Math.max(AMIN, Math.min(AMAX, v)) - AMIN) / (AMAX - AMIN) * (X1 - X0);
  const txt = (x, y, str, fill, size, anchor = 'middle', weight = 700) =>
    s('text', { x, y, fill, 'font-size': size * F, 'font-weight': weight, 'text-anchor': anchor, 'font-family': 'Consolas, monospace' }, str);

  function changed() { clearInterval(timer); runs = []; draw(); }
  function move(b, dir) {
    if (dir > 0 && cnt[0] > 0) { cnt[0]--; cnt[b]++; }
    if (dir < 0 && cnt[b] > 0) { cnt[b]--; cnt[0]++; }
    changed();
  }
  function newData() {
    const b = rnd(3, 15), a = rnd(2, 10), w = rnd(5, 15);
    truth = [(100 - b - a - w) / 100, b / 100, a / 100, w / 100];
    cnt = drawCards(100);
    changed();
  }
  function more() {
    if (stats().n >= 1000) return;
    const add = drawCards(100);
    cnt = cnt.map((c, b) => c + add[b]);
    changed();
  }
  function repeat() {
    clearInterval(timer); runs = [];
    const n = stats().n;
    timer = setInterval(() => {
      runs.push(stats(drawCards(n)));
      if (runs.length >= 20) { clearInterval(timer); repeats++; }
      draw();
    }, 110);
  }

  function draw() {
    const st = stats(), k = [];
    // four boxes
    const bw = (X1 - X0) / 4;
    cnt.forEach((c, b) => {
      const x = X0 + bw * b + 3, w = bw - 6;
      k.push(s('rect', { x, y: 8, width: w, height: 70, rx: 9, fill: C.bg, stroke: BC[b], 'stroke-width': 2 }),
        txt(x + w / 2, 26, NAMES[b], BC[b], NARROW ? 9 : 12), txt(x + w / 2, 64, c, BC[b], 26));
    });

    // tug of war: only-B cards pull right, only-A cards pull left
    const RY = 128, mid = (X0 + X1) / 2, half = (X1 - X0) / 2 - 40;
    const kx = mid + Math.max(-1, Math.min(1, st.d / 30)) * half;
    k.push(s('line', { x1: X0 + 26, x2: X1 - 26, y1: RY, y2: RY, stroke: C.muted, 'stroke-width': 4 }),
      s('line', { x1: mid, x2: mid, y1: RY - 22, y2: RY + 22, stroke: C.muted, 'stroke-dasharray': '4 4' }),
      s('circle', { cx: X0 + 13, cy: RY, r: 13, fill: BLUE, 'fill-opacity': .2, stroke: BLUE, 'stroke-width': 2 }), txt(X0 + 13, RY + 5, 'A', BLUE, 13),
      s('circle', { cx: X1 - 13, cy: RY, r: 13, fill: ORANGE, 'fill-opacity': .2, stroke: ORANGE, 'stroke-width': 2 }), txt(X1 - 13, RY + 5, 'B', ORANGE, 13),
      s('line', { x1: kx, x2: kx, y1: RY - 12, y2: RY + 12, stroke: st.d > 0 ? ORANGE : st.d < 0 ? BLUE : C.ink, 'stroke-width': 6, 'stroke-linecap': 'round' }),
      txt(X0 + 32, RY - 16, `← ${cnt[2]} pull to A`, BLUE, 12, 'start'),
      txt(X1 - 32, RY - 16, `${cnt[1]} pull to B →`, ORANGE, 12, 'end'));

    // twenty repeated tests, each with its own interval
    const R0 = 184, RP = 7.6, tv = 100 * (truth[1] - truth[2]);
    let caught = 0;
    if (runs.length) {
      runs.forEach((r, i) => {
        const ok = r.lo <= tv && tv <= r.hi; if (ok) caught++;
        k.push(s('line', { x1: xv(r.lo), x2: xv(r.hi), y1: R0 + i * RP, y2: R0 + i * RP, stroke: ok ? C.green : C.pink, 'stroke-width': 3, 'stroke-linecap': 'round' }));
      });
      k.push(s('line', { x1: xv(tv), x2: xv(tv), y1: R0 - 8, y2: R0 + 19 * RP + 6, stroke: C.ink, 'stroke-dasharray': '5 4' }),
        txt(xv(tv), R0 - 12, `true difference ${sg(r1(tv))}`, C.ink, 11, xv(tv) < VW * 0.25 ? 'start' : xv(tv) > VW * 0.75 ? 'end' : 'middle', 400));
    } else {
      k.push(txt(mid, 262, 'Repeat the test to see 20 new intervals here', C.muted, 12, 'middle', 400));
    }

    // the interval as a bar: the part below 0 in pink
    const BY = 352, BH = 22, xl = xv(st.lo), xh = xv(st.hi), x0 = xv(0);
    if (st.lo < 0) k.push(s('rect', { x: xl, y: BY, width: Math.max(0, Math.min(xh, x0) - xl), height: BH, fill: C.pink, 'fill-opacity': .8, rx: 3 }));
    if (st.hi > 0) k.push(s('rect', { x: Math.max(xl, x0), y: BY, width: Math.max(0, xh - Math.max(xl, x0)), height: BH, fill: ORANGE, 'fill-opacity': .8, rx: 3 }));
    k.push(s('circle', { cx: xv(st.d), cy: BY + BH / 2, r: 5, fill: C.ink }),
      txt(xl, BY - 6, sg(r1(st.lo)), st.lo < 0 ? C.pink : ORANGE, 13, 'end'),
      txt(xh, BY - 6, sg(r1(st.hi)), ORANGE, 13, 'start'));

    // number line and the sealed rule at 0
    const AY = 410;
    k.push(s('line', { x1: X0, x2: X1, y1: AY, y2: AY, stroke: C.muted, 'stroke-width': 2 }));
    for (let v = AMIN; v <= AMAX; v += 10)
      k.push(s('line', { x1: xv(v), x2: xv(v), y1: AY - 5, y2: AY + 5, stroke: C.muted }), txt(xv(v), AY + 22, sg(v), C.muted, 12, 'middle', 400));
    k.push(s('line', { x1: x0, x2: x0, y1: BY + BH + 3, y2: AY + 7, stroke: C.green, 'stroke-width': 5 }),
      txt(X1, AY - 8, 'points: B − A', C.muted, 11, 'end', 400),
      txt(X0, AY + 46, 'green line: sealed rule, the bar must be right of 0', C.green, 11, 'start', 400));
    svg.replaceChildren(...k);

    const verdict = st.lo > 0 ? ['→ SWITCH TO B', C.green] : st.hi < 0 ? ['→ DON’T SWITCH: B LOOKS WORSE', C.pink] : ['→ DON’T SWITCH YET', C.amber];
    const lines = [`cards ${st.n}: only B ${cnt[1]}, only A ${cnt[2]}`,
      `difference = (${cnt[1]} − ${cnt[2]}) ÷ ${st.n}`, [`           = ${sg(r1(st.d))} points`, C.amber],
      `standard error ≈ ${fmt(r1(st.se))}`,
      `interval = ${sg(r1(st.d))} ± 2 × ${fmt(r1(st.se))}`, [`         = ${sg(r1(st.lo))} to ${sg(r1(st.hi))}`, ORANGE],
      ['rule: whole interval above 0?', C.green], verdict];
    if (runs.length) lines.push([`20 new tests: ${caught} of ${runs.length} caught the truth`, C.green]);
    fbox(box, lines);
    note.textContent = (st.lo > 0 ? 'The whole bar is right of 0: by the rule written first, the library switches to B.'
      : st.hi < 0 ? 'The whole bar is left of 0: here A is clearly better, so the library keeps A.'
      : 'The bar crosses 0, so “no real gain” is still believable. The rule says: not yet, gather more cards.')
      + ' Cards in “both right” and “both wrong” never move the knot.';
    chal.update({ lo: st.lo, hi: st.hi, n: st.n, width: st.hi - st.lo, a: cnt[2], b: cnt[1], repeats });
  }
  draw();
  return () => clearInterval(timer);
}
