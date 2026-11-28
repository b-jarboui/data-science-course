// 7.4.4 Try it: many tests, false alarms add up.
// The learner sets how many tests run each day and each test's false-alarm chance, runs many pure-luck
// days (nothing is really different), watches the share of days with at least one alarm settle on
// 1 − (1 − chance)^tests, links tests in pairs, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, fmt, challenges } = kit;
  const MAXN = 40, KEEP = 100;
  let n = 20, pct = 5, linked = false, recent = [], last = null, total = 0, alarms = 0, anim = 0;

  const svg = s('svg', { viewBox: '0 0 700 530' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const nIn = h('input', { type: 'range', min: 1, max: MAXN, step: 1, value: n, 'aria-label': 'Tests per day', oninput: settings });
  const aIn = h('input', { type: 'range', min: 1, max: 10, step: 1, value: pct, 'aria-label': 'False-alarm chance of each test', oninput: settings });
  const nLab = h('span', { class: 'sim-note', style: { margin: 0 } }), aLab = h('span', { class: 'sim-note', style: { margin: 0 } });
  const pairBtn = btn('Tests move in pairs: off', () => { linked = !linked; settings(); });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: many tests, false alarms add up'),
    h('p', { class: 'sub' }, 'Every day the team tests cookies that are truly the same, so every flash is luck. Each light is one test; it flashes on a false alarm. Move the sliders, or tap the chart to pick the number of tests.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, h('span', {}, 'Tests per day'), nIn, nLab),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, h('span', {}, 'False-alarm chance per test'), aIn, aLab),
        h('div', { class: 'sim-row' },
          btn('Run 1 day', () => { cancelAnimationFrame(anim); addDays(1); }),
          btn('New 100 days (random)', fresh, 'go'),
          btn('Run 500 more days', () => animate(500)),
          pairBtn,
          btn('Start again', reset))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const p1 = () => pct / 100;
  const groupsOf = k => linked ? Math.ceil(k / 2) : k;        // pairs flash together: each pair acts like one test
  const chance = k => 1 - Math.pow(1 - p1(), groupsOf(k));
  const pc = x => Math.round(x * 100) + '%';
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', sup = k => String(k).split('').map(d => SUP[d]).join('');

  const chal = challenges(ch, [
    { text: 'Set 1 test a day at 5%, then press “Run 500 more days”. Is the share of alarm days close to 5%?',
      check: st => st.n === 1 && st.pct === 5 && st.total >= 500,
      why: 'Yes: with one test, about 5 days in 100 bring a false alarm, just as promised.' },
    { text: 'Now set 20 tests a day at 5% (pairs off) and run 500 more days. Where does the share settle?',
      check: st => st.n === 20 && st.pct === 5 && !st.linked && st.total >= 500,
      why: 'Near 64%: 1 − 0.95²⁰ ≈ 0.64. Twenty chances for luck give a false alarm on most days.' },
    { text: 'At 5% per test, find the smallest number of tests where a false alarm is more likely than not (above 50%).',
      check: st => st.pct === 5 && !st.linked && st.n === 14,
      why: '14 tests: 1 − 0.95¹⁴ ≈ 0.51, while 13 tests give 0.49. Only 14 tests make a false alarm more likely than not.' },
    { text: 'Set 20 tests at 5% and turn on “Tests move in pairs”. Is the chance below 64%? Is it still above 5%?',
      check: st => st.linked && st.n === 20 && st.pct === 5,
      why: 'Pairs flash on the same days, so 20 tests act like 10: 1 − 0.95¹⁰ ≈ 40%. Smaller than 64%, but still far above 5%.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, FS = NARROW ? 1.25 : 1;
  const X0 = 20, X1 = VW - 20, GT = 140, SQ = NARROW ? 19 : 20, GAP = 2;
  const CT = 395, CB = 490, CX0 = X0 + 34, CX1 = X1 - 6;
  svg.setAttribute('viewBox', `0 0 ${VW} 530`);
  const cxN = k => CX0 + (k - 1) / (MAXN - 1) * (CX1 - CX0), cyP = p => CB - p * (CB - CT);
  const mono = 'Consolas, monospace', sans = 'Segoe UI, Arial, sans-serif';

  // one pure-luck day: each test flashes with the chosen chance; in pairs, the second copies the first
  function oneDay() {
    const f = [];
    for (let j = 0; j < n; j++) f.push(linked && j % 2 ? f[j - 1] : Math.random() < p1());
    return f;
  }
  function addDays(k) {
    for (let i = 0; i < k; i++) {
      last = oneDay();
      const any = last.some(Boolean);
      recent.push(any); if (recent.length > KEEP) recent.shift();
      total++; if (any) alarms++;
    }
    draw();
  }
  function animate(k) {
    cancelAnimationFrame(anim);
    let left = k;
    const per = Math.max(1, Math.ceil(k / 60));
    const step = () => { const m = Math.min(per, left); addDays(m); left -= m; if (left > 0) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  }
  function clear() { cancelAnimationFrame(anim); recent = []; last = null; total = 0; alarms = 0; }
  function fresh() { clear(); animate(KEEP); }
  function settings() {
    n = +nIn.value; pct = +aIn.value;
    pairBtn.textContent = `Tests move in pairs: ${linked ? 'on' : 'off'}`;
    clear(); addDays(KEEP);
  }
  function reset() { linked = false; nIn.value = 20; aIn.value = 5; settings(); }

  // tap or drag on the chart: pick the number of tests
  let dragging = false;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const pick = e => {
    const p = toSvg(e), k = Math.max(1, Math.min(MAXN, Math.round(1 + (p.x - CX0) / (CX1 - CX0) * (MAXN - 1))));
    if (k !== n) { nIn.value = k; settings(); }
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y < CT - 20 || p.y > CB + 20) return;
    dragging = true; svg.setPointerCapture(e.pointerId); pick(e);
  });
  svg.addEventListener('pointermove', e => { if (dragging) pick(e); });
  svg.addEventListener('pointerup', () => { dragging = false; });
  svg.addEventListener('pointercancel', () => { dragging = false; });

  function draw() {
    const k = [], th = chance(n), obs = total ? alarms / total : null;

    // the lights of the latest day
    const sp = (X1 - X0) / 20, r = Math.min(10, sp * 0.36);
    const lx = j => X0 + sp * (j % 20 + 0.5), ly = j => j < 20 ? 36 : 36 + 4 * r + 8;
    for (let j = 0; j < n; j++) {
      if (linked && j % 2 === 0 && j + 1 < n)
        k.push(s('line', { x1: lx(j), x2: lx(j + 1), y1: ly(j) + r + 5, y2: ly(j) + r + 5, stroke: C.violet, 'stroke-width': 3, 'stroke-linecap': 'round' }));
      const on = last && last[j];
      k.push(s('circle', { cx: lx(j), cy: ly(j), r, fill: on ? C.pink : C.card, stroke: on ? C.pink : C.muted, 'stroke-width': 2 }));
    }
    const lit = last ? last.filter(Boolean).length : 0;
    k.push(s('text', { x: X0, y: 116, fill: last ? (lit ? C.pink : C.cyan) : C.muted, 'font-size': 13 * FS, 'font-family': sans },
      last ? `Latest day: ${lit} of ${n} lights flashed → ${lit ? 'a false-alarm day' : 'a quiet day'}` : 'No days yet.'));

    // the last 100 days
    k.push(s('text', { x: X0, y: GT - 6, fill: C.muted, 'font-size': 12 * FS, 'font-family': sans }, 'Last 100 days · pink = at least one false alarm'));
    for (let i = 0; i < KEEP; i++) {
      const x = X0 + (i % 10) * (SQ + GAP), y = GT + Math.floor(i / 10) * (SQ + GAP);
      if (i < recent.length) k.push(s('rect', { x, y, width: SQ, height: SQ, rx: 2, fill: recent[i] ? C.pink : C.cyan, 'fill-opacity': .8 }));
      else k.push(s('rect', { x, y, width: SQ, height: SQ, rx: 2, fill: 'none', stroke: C.line }));
    }
    const TX = X0 + 10 * (SQ + GAP) + 18;
    [['days run', String(total), C.ink], ['alarm days', String(alarms), C.pink],
     ['your share', obs == null ? '—' : pc(obs), C.cyan], ['formula', pc(th), C.amber]].forEach(([lab, val, col], i) => {
      const y = GT + 14 + i * 54;
      k.push(s('text', { x: TX, y, fill: C.muted, 'font-size': 12 * FS, 'font-family': sans }, lab),
        s('text', { x: TX, y: y + 26, fill: col, 'font-size': 22 * FS, 'font-weight': 700, 'font-family': mono }, val));
    });

    // chance of at least one false alarm against the number of tests
    k.push(s('text', { x: X0, y: CT - 14, fill: C.ink, 'font-size': 13 * FS, 'font-family': sans }, 'Chance of at least one false alarm'));
    [0, 0.5, 1].forEach(p => k.push(
      s('line', { x1: CX0, x2: CX1, y1: cyP(p), y2: cyP(p), stroke: C.line }),
      s('text', { x: CX0 - 4, y: cyP(p) + 4, fill: C.muted, 'font-size': 11 * FS, 'text-anchor': 'end', 'font-family': mono }, pc(p))));
    [1, 10, 20, 30, 40].forEach(t => k.push(s('text', { x: cxN(t), y: CB + 16, fill: C.muted, 'font-size': 11 * FS, 'text-anchor': 'middle', 'font-family': mono }, t)));
    k.push(s('text', { x: X1, y: CB + 34, fill: C.muted, 'font-size': 12 * FS, 'text-anchor': 'end', 'font-family': sans }, 'tests per day'));
    k.push(s('line', { x1: CX0, x2: CX1, y1: cyP(p1()), y2: cyP(p1()), stroke: C.muted, 'stroke-dasharray': '5 5' }),
      s('text', { x: CX1, y: cyP(p1()) - 5, fill: C.muted, 'font-size': 11 * FS, 'text-anchor': 'end', 'font-family': sans }, `one test: ${pct}%`));
    const curve = f => Array.from({ length: MAXN }, (_, i) => `${cxN(i + 1)},${cyP(f(i + 1))}`).join(' ');
    if (linked) k.push(s('polyline', { points: curve(t => 1 - Math.pow(1 - p1(), t)), fill: 'none', stroke: C.muted, 'stroke-width': 2, 'stroke-dasharray': '3 4' }));
    k.push(s('polyline', { points: curve(chance), fill: 'none', stroke: C.amber, 'stroke-width': 3 }),
      s('line', { x1: cxN(n), x2: cxN(n), y1: CT, y2: CB, stroke: C.pink, 'stroke-width': 2, 'stroke-dasharray': '6 5' }),
      s('circle', { cx: cxN(n), cy: cyP(th), r: 6, fill: C.amber }));
    if (obs != null) k.push(s('circle', { cx: cxN(n), cy: cyP(obs), r: 6, fill: 'none', stroke: C.cyan, 'stroke-width': 3 }));
    svg.replaceChildren(...k);

    const g = groupsOf(n), q = Math.pow(1 - p1(), g);
    fbox(box, [
      `${n} test${n > 1 ? 's' : ''} a day · each: ${pct}% false alarms`,
      linked ? [`in pairs: acts like ${g} independent tests`, C.violet] : 'tests independent',
      `all quiet  = ${fmt(Math.round((1 - p1()) * 100) / 100)}${sup(g)} = ${q.toFixed(3)}`,
      [`≥ 1 alarm  = 1 − ${q.toFixed(3)} = ${(1 - q).toFixed(3)} (${pc(1 - q)})`, C.pink],
      [`adding ${n} × ${pct}% would say ${n * pct}%`, C.muted],
      [total ? `your days: ${alarms} of ${total} (${pc(alarms / total)})` : 'your days: none yet', C.cyan]]);
    note.textContent = !total ? 'Press a Run button.'
      : 'Nothing is really different on any day: every flash is luck. '
        + (Math.abs(obs - th) < 0.04 ? 'Your share is close to the formula (amber dot).' : 'Run more days: your share (cyan ring) settles near the formula (amber dot).')
        + (linked ? ' Pairs flash on the same days, so fewer days have an alarm.' : '');
    nLab.textContent = `${n} tests`;
    aLab.textContent = `${pct}%`;
    chal.update({ n, pct, linked, total, alarms });
  }
  settings();
  return () => cancelAnimationFrame(anim);
}
