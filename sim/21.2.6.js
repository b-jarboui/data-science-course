// 21.2.6 Try it: answer or say "not sure".
// Ten held-out cards sit in a column, most sure on top. The learner drags the threshold line (or uses the slider),
// taps a card to flip it right or wrong, makes random cards, and solves challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [['Q1', 65, false], ['Q2', 95, true], ['Q3', 90, true], ['Q4', 90, true], ['Q5', 50, false],
    ['Q6', 85, true], ['Q7', 80, true], ['Q8', 70, true], ['Q9', 40, false], ['Q10', 60, true]];
  const fresh = () => START.map(([q, conf, right]) => ({ q, conf, right }));
  let cards = fresh(), t = 0, randoms = 0, seenAll = false, seenNone = false;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const tLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const slider = h('input', { type: 'range', min: 0, max: 100, step: 1, value: 0, 'aria-label': 'Threshold line',
    style: { flex: '1 1 12rem' }, oninput: e => setT(+e.target.value) });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: answer or say “not sure”'),
    h('p', { class: 'sub' }, 'Each card is one held-out question, with the assistant’s confidence and ✓ right or ✗ wrong. Drag the dashed line (or the slider): cards above it are answered, cards below it get “I’m not sure”. Tap a card to flip it right or wrong.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, slider, tLabel),
        h('div', { class: 'sim-row' },
          btn('Line at the bottom', () => setT(0)), btn('Line at 55%', () => setT(55)),
          btn('Line at 75%', () => setT(75)), btn('Line at the top', () => setT(100))),
        h('div', { class: 'sim-row' },
          btn('New data (random cards)', () => { cards = randomCards(); randoms++; seenAll = seenNone = false; changed(); }, 'go'),
          btn('Back to the library cards', () => { cards = fresh(); t = 0; seenAll = seenNone = false; changed(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  function randomCards() {
    for (;;) {
      const c = START.map(([q]) => { const conf = rnd(30, 99); return { q, conf, right: Math.random() < (conf - 15) / 85 }; });
      const w = c.filter(x => !x.right).length;
      if (w >= 1 && w <= 6) return c;
    }
  }
  const sorted = () => cards.slice().sort((a, b) => b.conf - a.conf);
  function stats() {
    const ans = cards.filter(c => c.conf >= t);
    return { n: cards.length, a: ans.length, w: ans.filter(c => !c.right).length };
  }
  // every distinct place for the line: k cards answered, w of them wrong, t the line value
  function cuts() {
    const srt = sorted(), out = [];
    for (let k = 0; k <= srt.length; k++) {
      if (k > 0 && k < srt.length && srt[k - 1].conf === srt[k].conf) continue;
      out.push({ k, w: srt.slice(0, k).filter(c => !c.right).length, t: k === srt.length ? 0 : Math.min(100, srt[k].conf + 1) });
    }
    return out;
  }

  const chal = challenges(ch, [
    { text: 'Set the line so the assistant answers 8 of the 10 cards. What is the error now?',
      check: st => st.a === 8 && st.n === 10,
      why: 'Coverage is 8 ÷ 10 = 80%. The error counts only those 8 answers: the wrong ones divided by 8.' },
    { text: 'Find the line with 0% error that still answers as many questions as possible.',
      check: st => st.a > 0 && st.w === 0 && st.a === st.best,
      why: 'That line sits just above the most sure wrong answer. One step lower and a mistake gets in.' },
    { text: 'Move the line to the very top. No wrong answers at all: is this a good assistant?',
      check: st => st.a === 0,
      why: 'No. It never answers, so it is never wrong, but coverage is 0% and it helps nobody. Always report both.' },
    { text: 'Press “New data”, then slide the line from the bottom to the top. Does coverage ever go up as the line rises?',
      check: st => st.randoms >= 1 && st.seenAll && st.seenNone,
      why: 'Never: a higher line can only remove answers. The error usually drops too, but not always.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: chart goes under the column
  const VW = NARROW ? 400 : 700, VH = NARROW ? 780 : 440, F = NARROW ? 1.25 : 1;
  const CX0 = NARROW ? 46 : 70, CW = NARROW ? 200 : 220, TOP = 22, PITCH = 38, CH = 31;
  const GX0 = NARROW ? 64 : 460, GX1 = NARROW ? 384 : 685, GY0 = NARROW ? 720 : 380, GY1 = NARROW ? 480 : 50;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const lineY = a => TOP + a * PITCH - (PITCH - CH) / 2;
  const mono = 'Consolas';

  function setT(v) { t = Math.max(0, Math.min(100, Math.round(v))); draw(); }
  function changed() { draw(); }

  // drag the line, tap a card to flip it, tap the chart to jump to that line
  let dragging = false;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), n = cards.length;
    if (p.x >= GX0 - 10 && p.x <= GX1 + 10 && p.y >= GY1 - 20 && p.y <= GY0 + 10) {
      const pts = cuts().filter(c => c.k > 0);
      let best = pts[0];
      for (const c of pts) if (Math.abs(GX0 + c.k / n * (GX1 - GX0) - p.x) < Math.abs(GX0 + best.k / n * (GX1 - GX0) - p.x)) best = c;
      setT(best.t);
      return;
    }
    if (p.y < TOP - 24 || p.y > TOP + n * PITCH + 24 || p.x > CX0 + CW + 130) return;
    const onCard = p.x >= CX0 && p.x <= CX0 + CW && p.y >= TOP && p.y < TOP + n * PITCH;
    if (onCard && Math.abs(p.y - lineY(stats().a)) > 12) {
      const c = sorted()[Math.floor((p.y - TOP) / PITCH)];
      c.right = !c.right; changed(); return;
    }
    dragging = true; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (!dragging) return;
    const p = toSvg(e), srt = sorted(), n = srt.length;
    const k = Math.max(0, Math.min(n, Math.round((p.y - TOP + (PITCH - CH) / 2) / PITCH)));
    setT(k === n ? 0 : Math.min(100, srt[k].conf + 1));
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = false; });

  function draw() {
    const srt = sorted(), { n, a, w } = stats(), k = [], ly = lineY(a);
    if (a === n) seenAll = true;
    if (a === 0) seenNone = true;
    // the column of cards
    srt.forEach((c, r) => {
      const y = TOP + r * PITCH, on = r < a, col = c.right ? C.green : C.pink, ty = y + CH / 2 + 5 * F;
      k.push(s('rect', { x: CX0, y, width: CW, height: CH, rx: 6, fill: on ? col : C.bg, 'fill-opacity': on ? 0.16 : 0.9, stroke: on ? col : C.muted, 'stroke-width': 1.5 }),
        s('text', { x: CX0 + 12, y: ty, fill: on ? C.ink : C.muted, 'font-size': 14 * F, 'font-weight': 700, 'font-family': mono }, c.q),
        s('text', { x: CX0 + CW / 2, y: ty, fill: on ? C.amber : C.muted, 'font-size': 14 * F, 'text-anchor': 'middle', 'font-family': mono }, c.conf + '%'),
        s('text', { x: CX0 + CW - 18, y: ty, fill: col, 'font-size': 17 * F, 'font-weight': 700, 'text-anchor': 'middle' }, c.right ? '✓' : '✗'));
    });
    // the threshold line
    k.push(s('line', { x1: CX0 - 8, x2: CX0 + CW + 8, y1: ly, y2: ly, stroke: C.amber, 'stroke-width': 3, 'stroke-dasharray': '9 7' }),
      s('circle', { cx: CX0 + CW + 14, cy: ly, r: 8, fill: C.amber }),
      s('text', { x: CX0 - 12, y: ly + 5, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': mono }, t + '%'));
    if (a > 0) k.push(s('text', { x: CX0 + CW + 28, y: ly - 8, fill: C.green, 'font-size': 13 * F, 'font-weight': 700, 'font-family': mono }, 'answers ↑'));
    if (a < n) k.push(s('text', { x: CX0 + CW + 28, y: ly + 20, fill: C.muted, 'font-size': 13 * F, 'font-weight': 700, 'font-family': mono }, 'abstains ↓'));

    // the tradeoff chart: one dot per place of the line
    const cs = cuts(), pts = cs.filter(c => c.k > 0);
    const em = Math.max(40, Math.ceil(Math.max(...pts.map(c => 100 * c.w / c.k)) / 10) * 10);
    const px = cov => GX0 + cov / 100 * (GX1 - GX0), py = e => GY0 - e / em * (GY0 - GY1);
    for (let e = 0; e <= em; e += 10) {
      k.push(s('line', { x1: GX0, x2: GX1, y1: py(e), y2: py(e), stroke: C.line }),
        s('text', { x: GX0 - 8, y: py(e) + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': mono }, e));
    }
    for (const cov of [0, 50, 100]) k.push(s('text', { x: px(cov), y: GY0 + 20 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': mono }, cov));
    k.push(s('text', { x: (GX0 + GX1) / 2, y: GY0 + 38 * F, fill: C.cyan, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': mono }, 'coverage % →'),
      s('text', { x: GX0, y: GY1 - 14, fill: C.pink, 'font-size': 13 * F, 'font-family': mono }, 'error %'));
    k.push(s('polyline', { points: pts.map(c => `${px(100 * c.k / n)},${py(100 * c.w / c.k)}`).join(' '), fill: 'none', stroke: C.violet, 'stroke-width': 2 }));
    pts.forEach(c => k.push(s('circle', { cx: px(100 * c.k / n), cy: py(100 * c.w / c.k), r: 4, fill: C.violet })));
    const r2 = x => Math.round(x * 100) / 100, cov = 100 * a / n, err = a ? 100 * w / a : 0;
    if (a > 0) {
      const cx = px(cov), cy = py(err), right = cx > (GX0 + GX1) / 2;
      k.push(s('circle', { cx, cy, r: 8, fill: C.amber }),
        s('text', { x: cx + (right ? -12 : 12), y: cy - 12, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': right ? 'end' : 'start', 'font-family': mono },
          `${fmt(r2(cov))}%, ${fmt(r2(err))}%`));
    } else {
      k.push(s('text', { x: GX0 + 8, y: GY0 - 10, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'font-family': mono }, 'nothing answered'));
    }
    svg.replaceChildren(...k);

    fbox(box, [`answer if confidence ≥ ${t}%`,
      'coverage = answered ÷ questions', [`         = ${a} ÷ ${n} = ${fmt(r2(cov))}%`, C.cyan],
      'error    = wrong ÷ answered',
      a ? [`         = ${w} ÷ ${a} = ${fmt(r2(err))}%`, C.pink] : ['         = nothing answered, nothing to count', C.pink]]);
    note.textContent = a === 0 ? 'No answers means no wrong answers, but coverage is 0%: it helps nobody. Read both numbers together.'
      : a === n ? 'The line is at the bottom: every question is answered, so every wrong answer counts.'
      : `${n - a} card${n - a > 1 ? 's' : ''} below the line get “I’m not sure”. They are not counted as mistakes.`;
    tLabel.textContent = `Line at ${t}%`;
    slider.value = t;
    const best = Math.max(0, ...cs.filter(c => c.k > 0 && c.w === 0).map(c => c.k));
    chal.update({ n, a, w, best, randoms, seenAll, seenNone });
  }
  draw();
  return () => {};
}
