// 3.2.1 Try it: a validation rule flags values that cannot be true.
// The learner drags readings (or taps one and uses -1 / +1), moves the band of the rule with sliders,
// converts a °F row, makes random days with one row slipped in °F, and solves small challenges that the sim checks itself.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;
  const HOURS = [8, 9, 10, 11, 12, 13], START = [18, 21, 24, 27, 86, 31], TRUE0 = [18, 21, 24, 27, 30, 31];
  const VMIN = -20, VMAX = 100;
  let v = START.slice(), truth = TRUE0.slice(), slip = 4, lo = -10, hi = 60;
  let sel = 4, random = false, tapped = false, fixed = 0, last = '';
  const N = x => fmt(x).replace('-', '−');
  const out = x => x < lo || x > hi;
  const clamp = x => Math.max(VMIN, Math.min(VMAX, x));

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const loLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const hiLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const loIn = h('input', { type: 'range', min: -30, max: 20, step: 1, value: lo, oninput: e => { lo = +e.target.value; draw(); } });
  const hiIn = h('input', { type: 'range', min: 20, max: 100, step: 1, value: hi, oninput: e => { hi = +e.target.value; draw(); } });
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: the validation rule'),
    h('p', { class: 'sub' }, 'Each dot is one row of the greenhouse log. The green band is the rule: a reading must be inside it. Drag a dot up or down, or tap it and use −1 / +1. Move the band with the sliders.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−1', () => bump(-1)), btn('+1', () => bump(1)), btn('Convert °F → °C', convert), selLabel),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, loLabel, loIn),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } }, hiLabel, hiIn),
        h('div', { class: 'sim-row' },
          btn('New data (random day)', newDay, 'go'),
          btn('Rule back to −10 … 60', () => setRule(-10, 60)),
          btn('Start again', startAgain))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'The 86 at 12:00 is flagged. Fix it without deleting it: tap it, then press “Convert °F → °C”.',
      check: st => st.fixed > 0, why: 'Yes: (86 − 32) × 5 ÷ 9 = 30, which fits between 27 and 31. The row is kept and corrected.' },
    { text: 'Move the band so that a real, correct reading gets flagged.',
      check: st => st.flaggedReal > 0, why: 'A rule that is too tight flags true values. That is why a flag means “check”, and a person decides.' },
    { text: 'Press “New data” until no row is flagged, but one row is still in °F. Tap the row you suspect.',
      check: st => st.spotted, why: 'Right: it is inside the band, so it passes, but it does not fit its neighbours. A rule only catches values that look impossible.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;   // phone: a narrower drawing keeps numbers readable
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = NARROW ? 44 : 60, X1 = VW - 12, BASE = 392, TOP = 60;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);
  const Y = x => BASE - (x - VMIN) * (BASE - TOP) / (VMAX - VMIN);
  const slot = (X1 - X0) / HOURS.length, cx = i => X0 + slot * (i + 0.5);

  function setRule(a, b) { lo = a; hi = b; loIn.value = a; hiIn.value = b; draw(); }
  function bump(d) { v[sel] = clamp(Math.round((v[sel] + d) * 10) / 10); last = ''; draw(); }
  function convert() {
    const f = v[sel], c = clamp(Math.round((f - 32) * 5 / 9 * 10) / 10);
    last = `${HOURS[sel]}:00  (${N(f)} − 32) × 5 ÷ 9 = ${N(c)} °C`;
    if (out(f) && !out(c)) fixed++;
    v[sel] = c; draw();
  }
  function newDay() {
    let t = rnd(6, 18);
    truth = HOURS.map((_, i) => i ? (t += rnd(1, 4)) : t);
    slip = rnd(0, 5); v = truth.slice(); v[slip] = Math.round(truth[slip] * 9 / 5 + 32);
    random = true; tapped = false; sel = 0; last = ''; draw();
  }
  function startAgain() {
    v = START.slice(); truth = TRUE0.slice(); slip = 4;
    random = false; tapped = false; sel = 4; last = ''; setRule(-10, 60);
  }

  // drag a dot: pointer height sets the reading (a plain tap only selects)
  let dragging = -1, startY = 0, moved = false;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e), i = Math.floor((p.x - X0) / slot);
    if (i < 0 || i >= v.length) return;
    sel = i; tapped = true; dragging = i; startY = p.y; moved = false;
    svg.setPointerCapture(e.pointerId); draw();
  });
  svg.addEventListener('pointermove', e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    if (!moved && Math.abs(p.y - startY) < 6) return;
    moved = true;
    v[dragging] = clamp(Math.round(VMIN + (BASE - p.y) * (VMAX - VMIN) / (BASE - TOP)));
    last = ''; draw();
  });
  svg.addEventListener('pointerup', () => { dragging = -1; });

  function draw() {
    const k = [];
    k.push(s('rect', { x: cx(sel) - slot / 2 + 3, y: TOP - 50, width: slot - 6, height: BASE - TOP + 50, fill: '#ffffff', 'fill-opacity': .05, rx: 8 }));
    for (let g = VMIN; g <= VMAX; g += 20) {
      const y = Y(g);
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, N(g)));
    }
    k.push(s('rect', { x: X0, y: Y(hi), width: X1 - X0, height: Math.max(0, Y(lo) - Y(hi)), fill: C.green, 'fill-opacity': .12, stroke: C.green, 'stroke-dasharray': '6 5' }),
      s('text', { x: X0 + 8, y: Y(hi) + 16 * F, fill: C.green, 'font-size': 13 * F, 'font-family': 'Consolas' }, `allowed ${N(lo)} … ${N(hi)}`),
      s('polyline', { points: v.map((x, i) => `${cx(i)},${Y(x)}`).join(' '), fill: 'none', stroke: C.cyan, 'stroke-opacity': .5, 'stroke-width': 2 }));
    v.forEach((val, i) => {
      const x = cx(i), y = Y(val), bad = out(val), col = bad ? C.pink : C.cyan;
      k.push(s('circle', { cx: x, cy: y, r: 13, fill: col, 'fill-opacity': .2 }),
        s('circle', { cx: x, cy: y, r: 6.5, fill: col }),
        s('text', { x, y: y - 18, fill: col, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, N(val)),
        s('text', { x, y: Math.max(14, y - 38 * F), fill: bad ? C.pink : C.green, 'font-size': 16 * F, 'font-weight': 700, 'text-anchor': 'middle' }, bad ? '⚑' : '✓'),
        s('text', { x, y: BASE + 26, fill: C.muted, 'font-size': 13 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${HOURS[i]}:00`));
    });
    svg.replaceChildren(...k);

    const flagged = v.map((x, i) => out(x) ? `${HOURS[i]}:00 → ${N(x)}` : null).filter(Boolean);
    fbox(box, [`rule: ${N(lo)} ≤ reading ≤ ${N(hi)}`,
      `checked ${v.length}   pass ${v.length - flagged.length}   flagged ${flagged.length}`,
      flagged.length ? [`flag: ${flagged.join(', ')}`, C.pink] : ['flag: none', C.muted],
      last ? [last, C.amber] : null].filter(Boolean));
    note.textContent = flagged.length
      ? 'Pink rows break the rule and get a flag ⚑. A flag means: check this row (its neighbours, its sensor), not delete it.'
      : 'No flags. That does not prove every value is right: a wrong value that looks possible still passes.';
    selLabel.textContent = `Selected: ${HOURS[sel]}:00 (${N(v[sel])})`;
    loLabel.textContent = `Lowest allowed: ${N(lo)}`;
    hiLabel.textContent = `Highest allowed: ${N(hi)}`;
    const flaggedReal = v.filter((x, i) => Math.abs(x - truth[i]) < 0.5 && out(x)).length;
    const spotted = random && tapped && !flagged.length && sel === slip && Math.abs(v[slip] - truth[slip]) > 0.5;
    chal.update({ fixed, flaggedReal, spotted });
  }
  draw();
  return () => {};
}
