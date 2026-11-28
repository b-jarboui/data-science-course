// 10.2.2 Try it: the indicator switch.
// Four listing cards (A, D at 40 m²; E, H at 50 m²). The learner drags a rent (or taps it and uses −10 / +10),
// sees the rule refit with one Station gap, flips the reference, makes random cards, and solves checked challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;
  const CARDS = [{ id: 'A', st: 0, x: 0 }, { id: 'D', st: 1, x: 0 }, { id: 'E', st: 0, x: 1 }, { id: 'H', st: 1, x: 1 }];
  const START = [980, 1020, 1060, 1140];
  let r = START.slice(), sel = 1, ref = 0, dragging = -1;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const refBtn = btn('', () => { ref = 1 - ref; draw(); }, 'go');
  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: the neighborhood switch'),
    h('p', { class: 'sub' }, 'Each mark is one listing card: circles are Cedar, squares are Station. Drag a card up or down to change its rent, or tap it and use −10 / +10. The rule refits at once.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−10', () => bump(-10)), btn('+10', () => bump(10)), selLabel),
        h('div', { class: 'sim-row' },
          refBtn,
          btn('New data (random)', () => { newData(); draw(); }),
          btn('Start again', () => { r = START.slice(); ref = 0; sel = 1; draw(); }))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const money = v => (Math.round(v * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const signed = v => (v < 0 ? '− ' : '+ ') + money(Math.abs(v));
  // Least-squares fit of rent = base + slope × size step + gap × Station switch on the 2 × 2 cards.
  function fit() {
    const gap = ((r[1] - r[0]) + (r[3] - r[2])) / 2, slope = ((r[2] - r[0]) + (r[3] - r[1])) / 2;
    const mean = (r[0] + r[1] + r[2] + r[3]) / 4;
    return { gap, slope, base: mean - slope / 2 - gap / 2 };
  }
  function newData() {
    const a = rnd(88, 104) * 10, e = a + rnd(6, 14) * 10;
    r = [a, a + rnd(-3, 10) * 10, e, e + rnd(-3, 12) * 10];
  }

  const chal = challenges(ch, [
    { text: 'Drag the cards so Station’s gap is exactly 100 dollars.',
      check: st => st.gap === 100, why: 'Yes! The gap is the average of the two pair gaps, so they must add up to 200, like 80 and 120.' },
    { text: 'Make the small pair cost the same, but keep the overall gap at 60.',
      check: st => st.r[1] === st.r[0] && st.gap === 60,
      why: 'Right: the big pair now needs a 120 gap. The rule uses one gap for both pairs, the average of 0 and 120.' },
    { text: 'Switch the reference to Station. Do any predictions change?',
      check: st => st.ref === 1,
      why: 'No: the start moves to Station’s rent and the switch now takes the gap away from Cedar, but every green prediction stays put.' },
    { text: 'Make Station cheaper than Cedar. What happens to the gap?',
      check: st => st.gap < 0,
      why: 'The gap turns negative: the switch now takes dollars away from Station cards. A 0-or-1 switch can carry a gap of either sign.' },
  ]);

  // geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, F = NARROW ? 1.25 : 1;
  const X0 = NARROW ? 56 : 70, X1 = VW - 14, TOP = 22, BASE = 330, LO = 800, HI = 1400;
  svg.setAttribute('viewBox', `0 0 ${VW} 440`);
  const yOf = v => BASE - (v - LO) / (HI - LO) * (BASE - TOP);
  const rentOf = y => LO + (BASE - y) / (BASE - TOP) * (HI - LO);
  const sx = step => X0 + (X1 - X0) * (0.3 + 0.4 * step);
  const OFF = NARROW ? 24 : 34;
  const cxOf = c => sx(c.x) + (c.st ? OFF : -OFF);
  const colOf = c => c.st ? C.amber : C.cyan;

  function bump(d) { r[sel] = Math.max(LO, Math.min(HI, r[sel] + d)); draw(); }

  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    let best = -1, bd = Infinity;
    CARDS.forEach((c, i) => { const d = Math.hypot(p.x - cxOf(c), (p.y - yOf(r[i])) * 0.5); if (d < bd) { bd = d; best = i; } });
    if (best < 0 || Math.abs(p.x - cxOf(CARDS[best])) > OFF * 1.6) return;
    sel = best; dragging = best; svg.setPointerCapture(e.pointerId); move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    r[dragging] = Math.max(LO, Math.min(HI, Math.round(rentOf(p.y) / 10) * 10));
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function draw() {
    const f = fit(), k = [];
    const pred = c => f.base + f.slope * c.x + f.gap * c.st;
    for (let v = LO; v <= HI; v += 100) {
      const y = yOf(v);
      k.push(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, '$' + money(v)));
    }
    // the rule: one line per neighborhood, the same slope, apart by the gap
    for (const st of [0, 1]) {
      const p = x => f.base + f.slope * x + f.gap * st;
      k.push(s('line', { x1: sx(-0.25), y1: yOf(p(-0.25)), x2: sx(1.25), y2: yOf(p(1.25)), stroke: st ? C.amber : C.cyan,
        'stroke-width': 2.5, 'stroke-dasharray': '8 6', opacity: 0.85 }));
    }
    const gx = sx(1.25) + 10, gy0 = yOf(f.base + f.slope * 1.25), gy1 = yOf(f.base + f.slope * 1.25 + f.gap);
    k.push(s('line', { x1: gx, x2: gx, y1: gy0, y2: gy1, stroke: C.amber, 'stroke-width': 3 }),
      s('text', { x: gx + 6, y: (gy0 + gy1) / 2 + 5, fill: C.amber, 'font-size': 14 * F, 'font-weight': 700, 'font-family': 'Consolas' }, signed(f.gap)));
    CARDS.forEach((c, i) => {
      const cx = cxOf(c), y = yOf(r[i]), yp = yOf(pred(c)), col = colOf(c), sw = ref ? 1 - c.st : c.st;
      if (i === sel) k.push(s('rect', { x: cx - 26, y: TOP - 8, width: 52, height: BASE - TOP + 70, fill: '#ffffff', 'fill-opacity': .04, rx: 8 }));
      k.push(s('line', { x1: cx, x2: cx, y1: y, y2: yp, stroke: C.muted, 'stroke-dasharray': '3 4' }),
        s('line', { x1: cx - 13, x2: cx + 13, y1: yp, y2: yp, stroke: C.green, 'stroke-width': 3 }));
      k.push(c.st ? s('rect', { x: cx - 9, y: y - 9, width: 18, height: 18, fill: col, rx: 2 })
        : s('circle', { cx, cy: y, r: 10, fill: col }));
      if (i === sel) k.push(s('circle', { cx, cy: y, r: 16, fill: 'none', stroke: C.ink, 'stroke-width': 2 }));
      k.push(s('text', { x: cx, y: BASE + 22, fill: col, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, c.id),
        s('rect', { x: cx - 14, y: BASE + 30, width: 28, height: 24, rx: 12, fill: sw ? C.green : C.bg, 'fill-opacity': sw ? .35 : 1, stroke: sw ? C.green : C.muted }),
        s('text', { x: cx, y: BASE + 47, fill: sw ? C.green : C.ink, 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, sw));
    });
    for (const [x, t] of [[0, '40 m²'], [1, '50 m²']])
      k.push(s('text', { x: sx(x), y: BASE + 82, fill: C.muted, 'font-size': 14 * F, 'text-anchor': 'middle' }, t));
    k.push(s('text', { x: X0, y: BASE + 104, fill: C.muted, 'font-size': 12 * F }, ref ? 'switch: is it in Cedar?' : 'switch: is it in Station?'));
    svg.replaceChildren(...k);

    const start = ref ? f.base + f.gap : f.base, coef = ref ? -f.gap : f.gap, c = CARDS[sel], sw = ref ? 1 - c.st : c.st;
    fbox(box, [
      ref ? 'reference: Station (switch on = Cedar)' : 'reference: Cedar (switch on = Station)',
      `small pair gap ${signed(r[1] - r[0])}, big pair ${signed(r[3] - r[2])}`,
      [`one gap = average = ${signed(f.gap)}`, C.amber],
      `rent = ${money(start)} ${signed(f.slope)} × size step ${signed(coef)} × switch`,
      [`${c.id}: ${money(start)} ${signed(f.slope)} × ${c.x} ${signed(coef)} × ${sw} = ${money(pred(c))}`, C.green],
      `   card asks ${money(r[sel])}`]);
    note.textContent = ref
      ? 'Station is the reference now: the start is Station’s rent and the switch takes the gap away for Cedar. The green predictions did not move.'
      : 'Green ticks are the rule’s predictions. The two dashed lines are parallel: the switch lifts Station’s line by one fixed gap.';
    refBtn.textContent = ref ? 'Reference: Station (tap for Cedar)' : 'Reference: Cedar (tap for Station)';
    selLabel.textContent = `Selected: card ${c.id} (${c.st ? 'Station' : 'Cedar'}, $${money(r[sel])})`;
    chal.update({ gap: f.gap, r: r.slice(), ref });
  }
  draw();
  return () => { dragging = -1; };
}
