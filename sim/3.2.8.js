// 3.2.8 Try it: multiple imputation.
// The learner edits the real readings (drag or -1 / +1), turns beds into gaps, chooses how many copies,
// draws new plausible fills, makes random data, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const START = [19, 25, 31, 19, 25, 31], START_GAP = [false, true, false, false, true, false];
  const START_FILLS = [[17, 27], [21, 29], [23, 33]];
  const MAXC = 10;
  let v = START.slice(), gap = START_GAP.slice(), m = 3, sel = 1, z = [], refills = 0, warn = '';

  const svg = s('svg', { viewBox: '0 0 700 500' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const mLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const slider = h('input', { type: 'range', min: 1, max: MAXC, value: m, step: 1, style: { flex: '1 1 10rem' },
    oninput: e => { m = +e.target.value; draw(); } });
  const gapBtn = btn('Make it a gap', () => toggleGap());
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: many plausible fills'),
    h('p', { class: 'sub' }, 'Six plant beds at noon. Tap a bed to select it. Drag a real reading up or down, or use −1 / +1. Each copy fills the gaps (dashed rings) with believable values drawn like the real readings.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1', () => bump(-1)), btn('+1', () => bump(1)), gapBtn, selLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, mLabel, slider),
        h('div', { class: 'sim-row' },
          btn('Fill again (random)', () => { newZ(); refills++; draw(); }, 'go'),
          btn('New data (random)', () => newData()),
          btn('Start again', () => restart()))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  // data and fills
  const r2 = x => Math.round(x * 100) / 100;
  const clamp = x => Math.max(-10, Math.min(60, x));
  const obsIdx = () => v.map((_, k) => k).filter(k => !gap[k]);
  const gapIdx = () => v.map((_, k) => k).filter(k => gap[k]);
  function stats() {
    const o = obsIdx().map(k => v[k]), n = o.length, sum = o.reduce((a, b) => a + b, 0), mean = sum / n;
    const sd = n > 1 ? Math.sqrt(o.reduce((a, x) => a + (x - mean) ** 2, 0) / (n - 1)) : 0;
    return { o, n, sum, mean, sd };
  }
  // a plausible fill = the readings' centre plus a believable random step, sized like the readings' spread
  const normal = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;
  function newZ() { z = Array.from({ length: MAXC }, () => Array.from({ length: 6 }, normal)); }
  function startZ() {
    newZ();
    const sd0 = stats().sd;
    START_FILLS.forEach((f, c) => { z[c][1] = (f[0] - 25) / sd0; z[c][4] = (f[1] - 25) / sd0; });
  }
  const fillOf = (st, c, b) => clamp(Math.round(st.mean + st.sd * z[c][b]));
  const copyMeans = (st, G) => Array.from({ length: m }, (_, c) => (st.sum + G.reduce((a, b) => a + fillOf(st, c, b), 0)) / 6);

  function bump(d) { warn = ''; if (gap[sel]) { warn = 'This bed is a gap: there is no reading to change.'; draw(); return; } v[sel] = clamp(v[sel] + d); draw(); }
  function toggleGap() {
    warn = '';
    if (gap[sel]) gap[sel] = false;
    else if (obsIdx().length <= 2) warn = 'Keep at least two real readings, or there is nothing to learn the fills from.';
    else if (gapIdx().length >= 4) warn = 'At most four gaps here.';
    else gap[sel] = true;
    draw();
  }
  function newData() {
    warn = '';
    v = v.map(() => rnd(12, 38));
    gap = v.map(() => false);
    const a = rnd(0, 5); let b = rnd(0, 5); while (b === a) b = rnd(0, 5);
    gap[a] = gap[b] = true;
    newZ(); draw();
  }
  function restart() {
    warn = ''; v = START.slice(); gap = START_GAP.slice(); m = 3; sel = 1; slider.value = 3; startZ(); draw();
  }

  const chal = challenges(ch, [
    { text: 'Press “Fill again” twice. Do the answers change? Does the estimate stay near the same centre?',
      check: st => st.refills >= 2,
      why: 'The answers wobble a little each time, around the same centre. That wobble is the doubt caused by the gaps.' },
    { text: 'Set the number of copies to 1. What happens to the range of answers?',
      check: st => st.m === 1,
      why: 'With one copy there is nothing to compare, so the doubt disappears from view: the same false certainty as mean imputation.' },
    { text: 'With 2 or more copies, make the real readings spread out: at least 20 degrees between the lowest and the highest.',
      check: st => st.m >= 2 && st.obsRange >= 20,
      why: 'Plausible fills look like the real readings, so more spread-out readings give more varied fills, and the copies disagree more.' },
    { text: 'With 2 or more copies, turn one more bed into a gap (3 gaps). Watch the range of answers.',
      check: st => st.m >= 2 && st.gaps >= 3,
      why: 'More gaps means more guessing, so the copies’ answers usually spread further apart: more doubt from the missing values.' },
  ]);

  // drag a real reading in the data row; tap any cell to select its bed
  let geo = { LW: 80, CWp: 90, Y0: 34, tb: 200 }, drag = null;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), { LW, CWp, Y0, RH, tb } = geo;
    if (p.y < Y0 - 4 || p.y > tb) return;
    const b = Math.floor((p.x - LW) / CWp);
    if (b < 0 || b > 5) return;
    sel = b; warn = '';
    if (!gap[b] && p.y < Y0 + RH) { drag = { b, y: p.y, v: v[b] }; svg.setPointerCapture(e.pointerId); }
    draw();
  });
  svg.addEventListener('pointermove', e => {
    if (!drag) return;
    const p = toSvg(e);
    v[drag.b] = clamp(drag.v + Math.round((drag.y - p.y) / 6));
    draw();
  });
  svg.addEventListener('pointerup', () => { drag = null; });
  svg.addEventListener('pointercancel', () => { drag = null; });

  function draw() {
    const st = stats(), G = gapIdx(), means = copyMeans(st, G);
    const NARROW = (root.clientWidth || innerWidth) < 600;
    const VW = NARROW ? 400 : 700, F = NARROW ? 1.2 : 1;
    const LW = NARROW ? 56 : 80, MW = NARROW ? 58 : 80, CWp = (VW - LW - MW - 8) / 6, RH = NARROW ? 36 : 32, Y0 = 34;
    const tb = Y0 + (m + 1) * RH;
    geo = { LW, CWp, Y0, RH, tb };
    const tx = (x, y, str, fill, size, anchor = 'middle', weight = 700) =>
      s('text', { x, y, fill, 'font-size': size, 'font-weight': weight, 'text-anchor': anchor, 'font-family': 'Consolas, monospace' }, str);
    const k = [];

    // the table: data row, then one row per copy, mean column on the right
    for (let b = 0; b < 6; b++) k.push(tx(LW + CWp * (b + 0.5), 20, `bed ${b + 1}`, C.muted, 12 * F, 'middle', 400));
    const mx = VW - MW / 2 - 4;
    k.push(tx(mx, 20, 'mean', C.amber, 12 * F, 'middle', 400));
    k.push(s('rect', { x: LW + CWp * sel + 1, y: Y0 - 4, width: CWp - 2, height: tb - Y0 + 8, rx: 6, fill: '#ffffff', 'fill-opacity': 0.06 }));
    for (let r = 0; r <= m; r++) {
      const cy = Y0 + RH * (r + 0.5);
      k.push(tx(LW - 8, cy + 5 * F, r ? `copy ${r}` : 'data', r ? C.muted : C.ink, 12 * F, 'end', r ? 400 : 700));
      for (let b = 0; b < 6; b++) {
        const cx = LW + CWp * (b + 0.5);
        k.push(s('rect', { x: cx - CWp / 2 + 2, y: cy - RH / 2 + 2, width: CWp - 4, height: RH - 4, rx: 4, fill: C.card, stroke: C.cyan, 'stroke-opacity': 0.35 }));
        if (!gap[b]) k.push(tx(cx, cy + 5 * F, v[b], C.cyan, 15 * F));
        else {
          k.push(s('circle', { cx, cy, r: RH * 0.36, fill: 'none', stroke: C.muted, 'stroke-dasharray': '4 3', 'stroke-width': 1.5 }));
          if (r) k.push(tx(cx, cy + 5 * F, fillOf(st, r - 1, b), C.green, 14 * F));
        }
      }
      if (r) {
        k.push(s('rect', { x: mx - MW / 2 + 4, y: cy - RH / 2 + 2, width: MW - 8, height: RH - 4, rx: 4, fill: C.card, stroke: C.amber, 'stroke-opacity': 0.5 }));
        k.push(tx(mx, cy + 5 * F, fmt(r2(means[r - 1])), C.amber, 14 * F));
      }
    }

    // the number line: one dot per copy's answer, the estimate, the range; mean imputation below
    const est = means.reduce((a, b) => a + b, 0) / m, lo0 = Math.min(...means), hi0 = Math.max(...means);
    const all = [...st.o, ...means, st.mean];
    const lo = Math.min(10, Math.floor(Math.min(...all)) - 2), hi = Math.max(40, Math.ceil(Math.max(...all)) + 2);
    const AX0 = 24, AX1 = VW - 24, xv = t => AX0 + (t - lo) / (hi - lo) * (AX1 - AX0);
    const y1 = tb + 60, y2 = y1 + 74, y3 = y2 + 56, H = y3 + 34;
    k.push(tx(8, y1 - 26, 'multiple imputation (one dot per copy)', C.green, 12 * F, 'start', 400));
    if (hi0 - lo0 > 1e-9) {
      const yb = y1 + 14;
      k.push(s('line', { x1: xv(lo0), x2: xv(hi0), y1: yb, y2: yb, stroke: C.violet, 'stroke-width': 2.5 }),
        s('line', { x1: xv(lo0), x2: xv(lo0), y1: yb - 5, y2: yb + 5, stroke: C.violet, 'stroke-width': 2.5 }),
        s('line', { x1: xv(hi0), x2: xv(hi0), y1: yb - 5, y2: yb + 5, stroke: C.violet, 'stroke-width': 2.5 }));
    }
    means.forEach(t => k.push(s('circle', { cx: xv(t), cy: y1, r: 6, fill: C.green, 'fill-opacity': 0.75 })));
    k.push(s('line', { x1: xv(est), x2: xv(est), y1: y1 - 13, y2: y1 + 13, stroke: C.amber, 'stroke-width': 3 }),
      tx(xv(est), y1 + 32 * F, fmt(r2(est)), C.amber, 13 * F));
    k.push(tx(8, y2 - 22, 'mean imputation (one fill, no range)', C.pink, 12 * F, 'start', 400),
      s('circle', { cx: xv(st.mean), cy: y2, r: 6, fill: C.pink }));
    k.push(s('line', { x1: AX0, x2: AX1, y1: y3, y2: y3, stroke: C.muted, 'stroke-width': 2 }));
    const step = hi - lo > 40 ? 10 : 5;
    for (let g = Math.ceil(lo / step) * step; g <= hi; g += step) {
      k.push(s('line', { x1: xv(g), x2: xv(g), y1: y3 - 4, y2: y3 + 4, stroke: C.muted }),
        tx(xv(g), y3 + 20, g, C.muted, 12 * F, 'middle', 400));
    }
    k.push(tx(AX1, y3 - 28, 'real readings · °C', C.cyan, 11 * F, 'end', 400));
    const seen = {};
    st.o.forEach(t => { const n = seen[t] = (seen[t] || 0) + 1; k.push(s('circle', { cx: xv(t), cy: y3 - 7 - (n - 1) * 11, r: 5, fill: C.cyan })); });
    svg.setAttribute('viewBox', `0 0 ${VW} ${H}`);
    svg.replaceChildren(...k);

    // formula box: the numbers being used
    const f1 = G.map(b => fillOf(st, 0, b));
    const shown = means.slice(0, 5).map(x => fmt(r2(x))).join(', ') + (m > 5 ? ', …' : '');
    fbox(box, [
      `real readings: ${st.o.join(' + ')} = ${st.sum}`,
      `copy 1 = (${st.sum}${f1.length ? ' + ' + f1.join(' + ') : ''}) ÷ 6 = ${fmt(r2(means[0]))}`,
      `answers: ${shown}`,
      [`estimate = ${fmt(r2(means.reduce((a, b) => a + b, 0)))} ÷ ${m} = ${fmt(r2(est))}`, C.amber],
      [m > 1 ? `range: ${fmt(r2(lo0))} to ${fmt(r2(hi0))}` : 'range: none (only one copy)', C.violet],
      [`mean imputation: ${fmt(r2(st.mean))}, no range`, C.pink]]);
    note.textContent = warn || (G.length === 0
      ? 'No gaps: every copy is the same table, so the copies cannot disagree.'
      : 'The violet range shows how much the copies disagree: extra doubt from the gaps, added on top of the usual uncertainty. Mean imputation hides it.');
    selLabel.textContent = gap[sel] ? `Selected: bed ${sel + 1} (gap)` : `Selected: bed ${sel + 1} (${v[sel]} °C)`;
    gapBtn.textContent = gap[sel] ? 'Bring the reading back' : 'Make it a gap';
    mLabel.textContent = `Copies: ${m}`;
    chal.update({ refills, m, gaps: G.length, obsRange: st.o.length ? Math.max(...st.o) - Math.min(...st.o) : 0 });
  }
  startZ();
  draw();
  return () => { drag = null; };
}
