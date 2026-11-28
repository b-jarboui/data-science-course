// 3.2.5 Try it: why values go missing.
// The learner picks the reason for the gaps (radio glitch, Wi-Fi off at night, sensor C overheating),
// changes it with a slider or by dragging on the chart, makes random days, and names the mechanism of mystery logs.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  // one day, hourly (0:00 to 23:00); 8:00 to 15:00 are the chapter's hot day
  const START = [14, 13, 13, 12, 12, 13, 14, 16, 18, 22, 28, 37, 40, 38, 32, 25, 23, 21, 20, 19, 18, 17, 16, 15];
  // the coin for each hour: a gap when it falls below the glitch chance (20% gives gaps at 2, 7, 12, 16, 21)
  const U0 = [0.62, 0.9, 0.08, 0.7, 0.45, 0.83, 0.55, 0.12, 0.66, 0.97, 0.38, 0.74, 0.15, 0.88, 0.59, 0.31, 0.17, 0.93, 0.48, 0.77, 0.69, 0.05, 0.52, 0.81];
  const NAMES = ['completely at random', 'at random', 'not at random'];
  const DECIDES = ['nothing', 'the time (recorded)', 'the missing value itself'];
  const CLUES = ['“The radio link crackles now and then, at no special time.”', '“The Wi-Fi box runs on a timer.”', '“This sensor hangs right under the hot roof.”'];
  const WHY = ['A coin decides each gap, so the gaps land anywhere. The kept readings are a fair, smaller handful, and their mean usually stays close to the true mean.',
    'The gaps sit at night, and the time is in the log. Nights are cooler, so the kept mean is too warm, but we can compare nights with nights and days with days.',
    'The gaps sit at the hottest hours. The missing value itself decides, so the kept mean is too cool, and the log cannot tell you how hot it was.'];
  let temp, u, mech, chance, offUntil, limit, mystery = null, glitchNews = 0, mysteryRight = 0, msg = '';

  const svg = s('svg', { viewBox: '0 0 700 372' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const mechBtns = ['Radio glitch', 'Wi-Fi off at night', 'Sensor C overheats'].map((t, i) => btn(t, () => setMech(i)));
  const slider = h('input', { type: 'range', min: 0, max: 60, step: 1, value: 20, style: { flex: '1 1 12rem' }, oninput: e => setParam(+e.target.value) });
  const sliderLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const guessRow = h('div', { class: 'sim-row' },
    btn('Completely at random', () => guess(0)), btn('At random', () => guess(1)), btn('Not at random', () => guess(2)));
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: why do values go missing?'),
    h('p', { class: 'sub' }, 'The white line is a thermometer we trust: the true air temperature each hour. The row below is the log: a cyan dot for each reading that arrived, a hollow dashed circle for each gap. Pink marks a true value the log lost. Pick a reason for the gaps, then change it with the slider or by dragging on the chart.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, ...mechBtns),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, slider, sliderLabel),
        h('div', { class: 'sim-row' },
          btn('New data (random day)', () => newData(), 'go'),
          btn('Mystery log', () => startMystery()),
          btn('Start again', () => reset())),
        guessRow),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Keep “Radio glitch” and press “New data” 3 times. Do the gaps ever bunch at one time of day?',
      check: st => st.glitchNews >= 3,
      why: 'No pattern: a coin decides, so the gaps land at any hour, and nothing explains them.' },
    { text: 'Pick “Sensor C overheats” and set its limit so that exactly 5 readings go missing.',
      check: st => !st.mystery && st.mech === 2 && st.gaps === 5,
      why: 'Whatever the limit, only the hottest hours vanish: the missing value itself decides the gap.' },
    { text: 'Make the mean of the kept readings at least 2 degrees too cool.',
      check: st => !st.mystery && st.nK > 0 && st.diff <= -2,
      why: 'When the hottest readings are the ones lost, the kept mean drops. That is why you ask about the mechanism before you average.' },
    { text: 'Press “Mystery log”, read the clue, look at the gaps, and name the mechanism correctly 2 times.',
      check: st => st.mysteryRight >= 2,
      why: 'You asked the right question: what decides the chance that a reading goes missing?' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps labels readable
  const VW = NARROW ? 400 : 700, VH = 372, F = NARROW ? 1.25 : 1;
  const X0 = NARROW ? 38 : 52, X1 = VW - 10, TOP = 26, BOT = 280, STRIP = 322, CW = (X1 - X0) / 24;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const hx = hh => X0 + (hh + 0.5) * CW, ty = t => BOT - t / 45 * (BOT - TOP);
  const r2 = x => Math.round(x * 100) / 100;

  function randomDay() {
    const low = rnd(8, 15), peak = rnd(28, 43), top = rnd(12, 14);
    return Array.from({ length: 24 }, (_, hh) => Math.round(low + (peak - low) * Math.exp(-(((hh - top) / 3.6) ** 2)) + Math.random() * 2 - 1));
  }
  function reset() {
    temp = START.slice(); u = U0.slice(); mech = 0; chance = 20; offUntil = 6; limit = 35; mystery = null; msg = '';
    syncSlider(); draw();
  }
  function setMech(i) { mystery = null; msg = ''; mech = i; syncSlider(); draw(); }
  function setParam(v) {
    if (mystery) return;
    if (mech === 0) chance = v; else if (mech === 1) offUntil = v; else limit = v;
    syncSlider(); draw();
  }
  function syncSlider() {
    const cfg = mystery ? [0, 1, 0] : mech === 0 ? [0, 60, chance] : mech === 1 ? [0, 12, offUntil] : [20, 45, limit];
    slider.min = cfg[0]; slider.max = cfg[1]; slider.value = cfg[2]; slider.disabled = !!mystery;
    sliderLabel.textContent = mystery ? 'Mystery log: the reason is hidden'
      : mech === 0 ? `Glitch chance: ${chance}% per reading`
      : mech === 1 ? `Wi-Fi off from 0:00 to ${offUntil}:00`
      : `Sensor C stops above ${limit} °C`;
    mechBtns.forEach((b, i) => { b.className = 'sim-btn' + (!mystery && i === mech ? ' go' : ''); });
  }
  function newData() {
    temp = randomDay(); u = temp.map(() => Math.random());
    if (mystery) { mystery = null; msg = ''; } else if (mech === 0) glitchNews++;
    syncSlider(); draw();
  }
  function startMystery() {
    temp = randomDay(); u = temp.map(() => Math.random());
    const m = rnd(0, 2), p = { mech: m, chance: rnd(15, 30), offUntil: rnd(4, 7), limit: 45, answered: false };
    if (m === 0) while (u.filter(x => x < p.chance / 100).length < 3) u = temp.map(() => Math.random());
    if (m === 2) { p.limit = temp.slice().sort((a, b) => b - a)[rnd(2, 4)]; while (!temp.some(t => t > p.limit)) p.limit--; }
    mystery = p; msg = '';
    syncSlider(); draw();
  }
  function guess(g) {
    if (!mystery || mystery.answered) return;
    const m = mystery.mech;
    mystery.answered = true;
    if (g === m) { mysteryRight++; msg = `Right! This log is missing ${NAMES[m]}. What decides the chance of a gap: ${DECIDES[m]}.`; }
    else msg = `Not quite. This log is missing ${NAMES[m]}. What decides the chance of a gap: ${DECIDES[m]}.`;
    draw();
  }

  // drag on the chart: Wi-Fi off-time (left-right) or sensor C limit (up-down)
  let dragging = false;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  function dragTo(e) {
    if (mystery) return;
    const p = toSvg(e);
    if (mech === 1) offUntil = Math.max(0, Math.min(12, Math.round((p.x - X0) / CW)));
    else if (mech === 2) limit = Math.max(20, Math.min(45, Math.round((BOT - p.y) / (BOT - TOP) * 45)));
    else return;
    syncSlider(); draw();
  }
  svg.addEventListener('pointerdown', e => { if (mystery || mech === 0) return; dragging = true; svg.setPointerCapture(e.pointerId); dragTo(e); });
  svg.addEventListener('pointermove', e => { if (dragging) dragTo(e); });
  svg.addEventListener('pointerup', () => { dragging = false; });
  svg.addEventListener('pointercancel', () => { dragging = false; });

  function draw() {
    const p = mystery || { mech, chance, offUntil, limit };
    const gap = temp.map((t, hh) => p.mech === 0 ? u[hh] < p.chance / 100 : p.mech === 1 ? hh < p.offUntil : t > p.limit);
    const k = [], fs = 13 * F, mono = 'Consolas';
    for (let g = 0; g <= 40; g += 10) {
      const y = ty(g);
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 6, y: y + 4, fill: C.muted, 'font-size': fs, 'text-anchor': 'end', 'font-family': mono }, `${g}°`));
    }
    if (!mystery && mech === 1 && offUntil > 0) k.push(
      s('rect', { x: X0, y: TOP - 12, width: offUntil * CW, height: STRIP + 16 - TOP, fill: C.violet, 'fill-opacity': .13, rx: 6 }),
      s('text', { x: X0 + 4, y: TOP + 4, fill: C.violet, 'font-size': fs, 'font-weight': 700, 'font-family': mono }, 'Wi-Fi off'));
    // the true air temperature (a thermometer we trust)
    k.push(s('polyline', { points: temp.map((t, hh) => `${hx(hh)},${ty(t)}`).join(' '), fill: 'none', stroke: C.ink, 'stroke-opacity': .5, 'stroke-width': 2 }));
    temp.forEach((t, hh) => k.push(s('circle', { cx: hx(hh), cy: ty(t), r: (gap[hh] ? 4.5 : 3.2) * F, fill: gap[hh] ? C.pink : C.ink })));
    if (!mystery && mech === 2) {
      const y = ty(limit);
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.pink, 'stroke-width': 2.5, 'stroke-dasharray': '8 6' }),
        s('text', { x: X1 - 4, y: y - 8, fill: C.pink, 'font-size': fs, 'font-weight': 700, 'text-anchor': 'end', 'font-family': mono }, `C stops above ${limit}°`));
    }
    // the log: a dot per reading that arrived, a hollow dashed circle per gap
    k.push(s('text', { x: X0 - 6, y: STRIP + 4, fill: C.muted, 'font-size': fs, 'text-anchor': 'end', 'font-family': mono }, 'log'));
    temp.forEach((t, hh) => {
      const cx = hx(hh);
      if (gap[hh]) k.push(s('circle', { cx, cy: STRIP, r: CW * 0.32, fill: 'none', stroke: C.ink, 'stroke-width': 1.8, 'stroke-dasharray': '3 2.5' }));
      else k.push(s('circle', { cx, cy: STRIP, r: CW * 0.45, fill: C.cyan, 'fill-opacity': .16 }), s('circle', { cx, cy: STRIP, r: CW * 0.22, fill: C.cyan }));
    });
    [0, 6, 12, 18].forEach(hh => k.push(s('text', { x: hx(hh), y: STRIP + 34, fill: C.muted, 'font-size': fs, 'text-anchor': 'middle', 'font-family': mono }, `${hh}:00`)));
    svg.replaceChildren(...k);

    const keep = temp.filter((_, hh) => !gap[hh]), nK = keep.length;
    const all = temp.reduce((a, b) => a + b, 0), kept = keep.reduce((a, b) => a + b, 0);
    const mAll = all / 24, mK = nK ? kept / nK : 0, diff = nK ? mK - mAll : 0;
    const hidden = mystery && !mystery.answered, ok = Math.abs(diff) < 0.5;
    const verdict = ok ? 'about right' : diff < 0 ? 'too cool' : 'too warm';
    fbox(box, [
      `gaps       = ${24 - nK} of 24`,
      [`decided by = ${hidden ? '???' : DECIDES[p.mech]}`, C.amber],
      `true mean  = ${all} ÷ 24 = ${fmt(r2(mAll))}`,
      nK ? `kept mean  = ${kept} ÷ ${nK} = ${fmt(r2(mK))}` : 'kept mean  = no readings kept',
      nK ? [`difference = ${diff > 0 ? '+' : ''}${fmt(r2(diff))} °C (${verdict})`, ok ? C.green : C.pink] : ['difference = —', C.muted]]);
    note.textContent = mystery
      ? (msg || `Mystery log. Clue from the greenhouse keeper: ${CLUES[mystery.mech]} Look where the gaps sit, then pick a name below.`)
      : WHY[mech];
    guessRow.style.display = mystery && !mystery.answered ? '' : 'none';
    chal.update({ mech, mystery: !!mystery, gaps: 24 - nK, nK, diff: r2(diff), glitchNews, mysteryRight });
  }
  reset();
  return () => { dragging = false; };
}
