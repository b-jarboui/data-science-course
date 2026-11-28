// 10.3.5 Try it: exposure offsets.
// Drag Lina's or Omar's exposure bar to change time watched, tap -1/+1 to change visits,
// stretch both bars to 1 year to compare fair rates, watch the log(time) offset shift
// expected counts on the Poisson growth curve, and test the free-slope trap.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const START = { tL: 1.0, vL: 2, tO: 0.5, vO: 2, modelRate: 2.0, slope: 1.0 };
  const TIMES = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  let tL = START.tL, vL = START.vL;
  let tO = START.tO, vO = START.vO;
  let modelRate = START.modelRate, slope = START.slope;
  let sel = 'O'; // 'L' or 'O'
  let scaleAnim = 0, anim = 0;
  let scaledOnce = false, sawTrap = false, randomMode = false, randomScales = 0;

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 500 : 465, F = NARROW ? 1.15 : 1;
  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLbl = h('span', { class: 'sim-note', style: { margin: 0 } });

  const rateSlider = h('input', { type: 'range', min: '1', max: '4', step: '0.5', value: String(modelRate),
    oninput: e => { modelRate = +e.target.value; draw(); } });
  const rateVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.green } });

  const slopeSlider = h('input', { type: 'range', min: '0', max: '1.5', step: '0.02', value: String(slope),
    oninput: e => { slope = +e.target.value; if (Math.abs(slope - 1) > 0.05) sawTrap = true; draw(); } });
  const slopeVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace' } });

  const bumpVisits = d => {
    if (sel === 'L') vL = Math.max(0, Math.min(12, vL + d));
    else vO = Math.max(0, Math.min(12, vO + d));
    changed();
  };
  const bumpTime = d => {
    if (sel === 'L') tL = Math.max(0.25, Math.min(2.0, Math.round((tL + d) * 4) / 4));
    else tO = Math.max(0.25, Math.min(2.0, Math.round((tO + d) * 4) / 4));
    changed();
  };

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: exposure offsets'),
    h('p', { class: 'sub' }, 'Drag the end of Lina’s or Omar’s bar to change time watched (exposure), or tap a patient and change their visits. Watch how the log(time) offset shifts expected counts on the growth curve.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Lina', () => { sel = 'L'; draw(); }),
          btn('Omar', () => { sel = 'O'; draw(); }),
          btn('−1 visit', () => bumpVisits(-1)),
          btn('+1 visit', () => bumpVisits(1)),
          btn('−0.25 yr', () => bumpTime(-0.25)),
          btn('+0.25 yr', () => bumpTime(0.25)),
          selLbl),
        h('div', { class: 'sim-row' },
          btn('Scale to 1 year', () => go(1), 'go'),
          btn('Back to watched time', () => go(0)),
          btn('New patients (random)', () => {
            tL = TIMES[rnd(0, TIMES.length - 1)];
            tO = TIMES[rnd(0, TIMES.length - 1)];
            if (tL === tO) tO = TIMES[(TIMES.indexOf(tL) + 2) % TIMES.length];
            vL = rnd(1, 6); vO = rnd(1, 6);
            randomMode = true;
            changed();
          }),
          btn('Try trap (slope 0.58)', () => { slope = 0.58; slopeSlider.value = '0.58'; sawTrap = true; draw(); }),
          btn('Fix offset (slope = 1)', () => { slope = 1.0; slopeSlider.value = '1'; draw(); }),
          btn('Start again', () => {
            ({ tL, vL, tO, vO, modelRate, slope } = START);
            rateSlider.value = String(modelRate);
            slopeSlider.value = String(slope);
            sel = 'O'; randomMode = false; changed();
          })),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('label', { style: { fontSize: '.9rem', color: C.muted } }, 'Model rate:'),
          rateSlider, rateVal,
          h('label', { style: { fontSize: '.9rem', color: C.muted, marginLeft: '.5rem' } }, 'Time slope b:'),
          slopeSlider, slopeVal)),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'Press “Scale to 1 year” to compare Lina and Omar over the same stretch of time.',
      check: st => st.scaledOnce,
      why: 'Yes! Stretching Omar’s half-year bar to a full year shows 4 visits per year — twice Lina’s pace.' },
    { text: 'Set Omar’s time watched to 1.5 years and change his visits so his rate matches Lina’s (2 per year).',
      check: st => Math.abs(st.tO - 1.5) < 0.01 && Math.abs(st.rateO - 2) < 0.01 && Math.abs(st.rateL - 2) < 0.01,
      why: 'Right! 3 visits in 1.5 years is 2 visits per year — different counts, same fair rate.' },
    { text: 'Press “Try trap (slope 0.58)” to see what happens to 2× time, then press “Fix offset (slope = 1)”.',
      check: st => st.sawTrap && Math.abs(st.slope - 1) < 0.005,
      why: 'With slope 0.58, twice the time gives only 1.5× the visits, breaking the meaning of a rate. Slope 1 keeps it exact.' },
    { text: 'Press “New patients (random)” and then “Scale to 1 year”, twice. Does expected count always equal time × rate when slope is 1?',
      check: st => st.randomScales >= 2 && Math.abs(st.slope - 1) < 0.005,
      why: 'Always. Adding log(time) with slope 1 multiplies e^score by the exact time watched.' }
  ]);

  // SVG geometry
  const BX0 = NARROW ? 62 : 95, BX1 = VW - (NARROW ? 62 : 115);
  const Y_L = NARROW ? 68 : 66, Y_O = NARROW ? 142 : 136, BH = 36;
  const Y_AXIS = NARROW ? 196 : 188;
  const t2x = t => BX0 + (t / 2.0) * (BX1 - BX0);

  const GX0 = NARROW ? 46 : 72, GX1 = VW - (NARROW ? 20 : 28);
  const GY_TOP = NARROW ? 266 : 254, GY_BOT = NARROW ? 454 : 426;

  function changed() { cancelAnimationFrame(anim); scaleAnim = 0; draw(); }
  function go(target) {
    if (target === 1) {
      scaledOnce = true;
      if (randomMode && scaleAnim < 0.5) randomScales++;
    }
    cancelAnimationFrame(anim);
    const from = scaleAnim, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 850);
      scaleAnim = from + (target - from) * k * k * (3 - 2 * k);
      draw();
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  // Dragging exposure bars directly
  let dragging = null;
  const toSvg = e => {
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(ctm.inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e); if (!p) return;
    if (p.y >= Y_L - 32 && p.y <= Y_L + 32) { sel = 'L'; dragging = 'L'; }
    else if (p.y >= Y_O - 32 && p.y <= Y_O + 32) { sel = 'O'; dragging = 'O'; }
    else return;
    svg.setPointerCapture(e.pointerId);
    dragTo(p.x);
  });
  const dragTo = px => {
    const raw = ((px - BX0) / (BX1 - BX0)) * 2.0;
    const snapped = Math.max(0.25, Math.min(2.0, Math.round(raw * 4) / 4));
    if (dragging === 'L') tL = snapped;
    else if (dragging === 'O') tO = snapped;
    changed();
  };
  svg.addEventListener('pointermove', e => {
    if (!dragging) return;
    const p = toSvg(e); if (p) dragTo(p.x);
  });
  svg.addEventListener('pointerup', () => { dragging = null; });
  svg.addEventListener('pointercancel', () => { dragging = null; });

  const r2 = x => Math.round(x * 100) / 100;
  const sgn = x => (x >= 0 ? '+' : '−') + fmt(r2(Math.abs(x)));

  function draw() {
    const baseScore = Math.log(modelRate);
    const offL = slope * Math.log(tL), offO = slope * Math.log(tO);
    const scoreL = baseScore + offL, scoreO = baseScore + offO;
    const expL = Math.exp(scoreL), expO = Math.exp(scoreO);
    const rateL = vL / tL, rateO = vO / tO;
    const isFixed = Math.abs(slope - 1) < 0.005;

    const k = [];
    // Panel 1 title
    k.push(s('text', { x: BX0, y: 24, fill: C.muted, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' },
      scaleAnim > 0.5 ? 'SCALED TO 1 YEAR (FAIR RATE COMPARISON)' : 'EXPOSURE BARS (DRAG BAR END TO CHANGE TIME)'));

    // Vertical grid lines for 0, 0.5, 1, 1.5, 2 yr
    for (const tv of [0, 0.5, 1.0, 1.5, 2.0]) {
      const x = t2x(tv);
      k.push(
        s('line', { x1: x, x2: x, y1: 36, y2: Y_AXIS, stroke: tv === 1.0 ? '#3b4a78' : C.line, 'stroke-dasharray': tv === 1.0 ? '5 4' : null }),
        s('text', { x, y: Y_AXIS + 18, fill: tv === 1.0 ? C.ink : C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          tv === 0 ? '0' : `${fmt(tv)} yr`)
      );
    }
    k.push(s('line', { x1: BX0, x2: BX1, y1: Y_AXIS, y2: Y_AXIS, stroke: C.muted, 'stroke-width': 1.5 }));

    // Draw Lina and Omar bars
    const rows = [
      { id: 'L', name: 'Lina', t: tL, v: vL, rate: rateL, y: Y_L, col: C.cyan },
      { id: 'O', name: 'Omar', t: tO, v: vO, rate: rateO, y: Y_O, col: C.amber }
    ];
    for (const row of rows) {
      const tVis = row.t + (1.0 - row.t) * scaleAnim;
      const wOrig = t2x(row.t) - BX0, wVis = t2x(tVis) - BX0;
      const top = row.y - BH / 2;
      if (sel === row.id) {
        k.push(s('rect', { x: 4, y: top - 10, width: VW - 8, height: BH + 20, rx: 10, fill: '#ffffff', 'fill-opacity': 0.04 }));
      }
      k.push(s('text', { x: BX0 - 10, y: row.y + 5, fill: row.col, 'font-size': 15 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Segoe UI, sans-serif' }, row.name));

      // Ghost outline of original exposure when shrinking from > 1 yr
      if (scaleAnim > 0.02 && row.t > 1.0) {
        k.push(s('rect', { x: BX0, y: top, width: wOrig, height: BH, rx: 6, fill: row.col, 'fill-opacity': 0.06, stroke: row.col, 'stroke-opacity': 0.35, 'stroke-dasharray': '5 4' }));
      }
      // Scaled extension when stretching from < 1 yr
      if (scaleAnim > 0.02 && row.t < 1.0) {
        k.push(s('rect', { x: BX0 + wOrig, y: top, width: Math.max(0, wVis - wOrig), height: BH, rx: 6, fill: row.col, 'fill-opacity': 0.11, stroke: row.col, 'stroke-dasharray': '5 4', 'stroke-width': 1.5 }));
      }
      // Solid watched bar (clipped to wVis when shrinking)
      const wSolid = row.t > 1.0 ? wVis : wOrig;
      k.push(s('rect', { x: BX0, y: top, width: Math.max(6, wSolid), height: BH, rx: 6, fill: row.col, 'fill-opacity': 0.22, stroke: row.col, 'stroke-width': 2 }));

      // Drag handle at right end when in watched-time view
      if (scaleAnim < 0.05) {
        const hx = BX0 + wOrig;
        k.push(s('rect', { x: hx - 4, y: row.y - 11, width: 8, height: 22, rx: 4, fill: row.col }));
      }

      // Visit dots: original visits on [0, t], plus projected dots if stretched to 1 yr
      const shownCount = scaleAnim > 0.05 ? Math.round(row.v + (row.rate - row.v) * scaleAnim) : row.v;
      const cap = Math.min(shownCount, 16);
      for (let i = 0; i < cap; i++) {
        const cx = BX0 + ((i + 0.5) / Math.max(1, cap)) * wVis;
        const projected = scaleAnim > 0.05 && cx > BX0 + wOrig;
        k.push(
          s('circle', { cx, cy: row.y, r: 7, fill: row.col, 'fill-opacity': projected ? 0.18 : 0.25 }),
          s('circle', { cx, cy: row.y, r: 4.5, fill: row.col, 'fill-opacity': projected ? 0.65 : 1 })
        );
      }
      // Right-hand rate/count tag
      const tagTxt = scaleAnim > 0.5 ? `${fmt(r2(row.rate))}/yr` : `${row.v} in ${fmt(row.t)}y`;
      k.push(s('text', { x: BX1 + 10, y: row.y + 5, fill: row.col, 'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas' }, tagTxt));
    }

    // Divider
    const DIV_Y = NARROW ? 230 : 220;
    k.push(s('line', { x1: 12, x2: VW - 12, y1: DIV_Y, y2: DIV_Y, stroke: C.line, 'stroke-width': 1.5 }));

    // Panel 2: Poisson growth curve y = e^score
    k.push(s('text', { x: GX0, y: DIV_Y + 20, fill: C.muted, 'font-size': 12 * F, 'font-weight': 700, 'font-family': 'Consolas' },
      isFixed ? 'GROWTH CURVE: EXPECTED = e^(score + log time)' : `TRAP CURVE: EXPECTED = e^(score + ${fmt(r2(slope))}·log time)`));

    const S_MIN = -1.6, S_MAX = 2.4;
    const maxY = Math.max(6, Math.ceil(Math.max(expL, expO, modelRate * 2) + 1));
    const sx = v => GX0 + ((v - S_MIN) / (S_MAX - S_MIN)) * (GX1 - GX0);
    const sy = v => GY_BOT - (v / maxY) * (GY_BOT - GY_TOP);

    // Axes & grid
    const yStep = maxY <= 8 ? 2 : 4;
    for (let yv = 0; yv <= maxY; yv += yStep) {
      const y = sy(yv);
      k.push(
        s('line', { x1: GX0, x2: GX1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: GX0 - 8, y: y + 4, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, yv)
      );
    }
    k.push(
      s('line', { x1: GX0, x2: GX1, y1: GY_BOT, y2: GY_BOT, stroke: C.muted, 'stroke-width': 1.5 }),
      s('line', { x1: GX0, x2: GX0, y1: GY_TOP, y2: GY_BOT, stroke: C.muted, 'stroke-width': 1.5 })
    );
    for (const sv of [-1, 0, 1, 2]) {
      const x = sx(sv);
      k.push(
        s('line', { x1: x, x2: x, y1: GY_BOT, y2: GY_BOT + 5, stroke: C.muted }),
        s('text', { x, y: GY_BOT + 18, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, sv)
      );
    }

    // Smooth exponential curve clipped at maxY
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const xv = S_MIN + (S_MAX - S_MIN) * (i / 80);
      const yv = Math.exp(xv);
      if (yv <= maxY) pts.push(`${sx(xv).toFixed(1)},${sy(yv).toFixed(1)}`);
    }
    if (pts.length > 1) {
      k.push(s('polyline', { points: pts.join(' '), fill: 'none', stroke: isFixed ? C.cyan : C.pink, 'stroke-width': 2.8 }));
    }

    // Base score vertical line (at 1 year)
    const xBase = sx(baseScore);
    k.push(
      s('line', { x1: xBase, x2: xBase, y1: GY_TOP, y2: GY_BOT, stroke: C.green, 'stroke-dasharray': '4 4', 'stroke-opacity': 0.7 }),
      s('text', { x: xBase, y: GY_TOP - 5, fill: C.green, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `base ${fmt(r2(baseScore))}`)
    );

    // Offset shift bars & curve points for Lina and Omar
    const drawPt = (tag, scv, ev, col, arrowY, dyLbl) => {
      const x = Math.max(GX0, Math.min(GX1, sx(scv)));
      const y = Math.max(GY_TOP, Math.min(GY_BOT, sy(ev)));
      // Horizontal shift arrow from baseScore to scv
      if (Math.abs(x - xBase) > 3) {
        k.push(s('line', { x1: xBase, x2: x, y1: arrowY, y2: arrowY, stroke: col, 'stroke-width': 2.5 }));
        const dir = x > xBase ? 1 : -1;
        k.push(s('polygon', { points: `${x},${arrowY} ${x - dir * 6},${arrowY - 4} ${x - dir * 6},${arrowY + 4}`, fill: col }));
      }
      // Dashed guides + glowing point
      k.push(
        s('line', { x1: x, x2: x, y1: y, y2: GY_BOT, stroke: col, 'stroke-dasharray': '3 3', 'stroke-opacity': 0.6 }),
        s('line', { x1: GX0, x2: x, y1: y, y2: y, stroke: col, 'stroke-dasharray': '3 3', 'stroke-opacity': 0.6 }),
        s('circle', { cx: x, cy: y, r: 10, fill: col, 'fill-opacity': 0.22 }),
        s('circle', { cx: x, cy: y, r: 5.5, fill: col }),
        s('text', { x: Math.min(GX1 - 36, Math.max(GX0 + 36, x)), y: Math.max(GY_TOP + 12, y + dyLbl), fill: col, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' },
          `${tag}: ${fmt(r2(ev))}`)
      );
    };
    drawPt('L', scoreL, expL, C.cyan, GY_BOT - 24, -12);
    drawPt('O', scoreO, expO, C.amber, GY_BOT - 10, 18);

    svg.replaceChildren(...k);

    // Update readouts & formula box
    rateVal.textContent = `${fmt(modelRate)} / yr`;
    slopeVal.textContent = `${fmt(r2(slope))} ${isFixed ? '(offset)' : '(trap!)'}`;
    slopeVal.style.color = isFixed ? C.green : C.pink;
    selLbl.textContent = `Selected: ${sel === 'L' ? `Lina (${vL} visits, ${fmt(tL)} yr)` : `Omar (${vO} visits, ${fmt(tO)} yr)`}`;

    const mult2x = Math.pow(2, slope);
    const lines = [
      [`model rate = ${fmt(modelRate)} / yr  (score ${fmt(r2(baseScore))})`, C.green],
      [`Lina: ${vL} ÷ ${fmt(tL)} = ${fmt(r2(rateL))} / yr`, C.cyan],
      [`  offset ${sgn(offL)} → exp = ${fmt(r2(expL))}`, C.ink],
      [`Omar: ${vO} ÷ ${fmt(tO)} = ${fmt(r2(rateO))} / yr`, C.amber],
      [`  offset ${sgn(offO)} → exp = ${fmt(r2(expO))}`, C.ink],
      isFixed
        ? ['slope = 1: 2× time → 2× expected ✓', C.green]
        : [`TRAP (b=${fmt(r2(slope))}): 2× time → ${fmt(r2(mult2x))}× exp!`, C.pink]
    ];
    fbox(box, lines);

    note.textContent = !isFixed
      ? `With a free slope b = ${fmt(r2(slope))}, doubling time multiplies expected visits by ${fmt(r2(mult2x))} instead of 2. Fix the offset slope at 1 to compare fair rates.`
      : scaleAnim > 0.5
        ? `Both bars scaled to 1 year: Lina is at ${fmt(r2(rateL))} visits/yr and Omar is at ${fmt(r2(rateO))} visits/yr.`
        : `Omar made ${vO} visit${vO === 1 ? '' : 's'} when ${fmt(r2(expO))} ${Math.abs(expO - 1) < 0.01 ? 'was' : 'were'} expected (${fmt(r2(vO / Math.max(0.01, expO)))}× expected).`;

    chal.update({ tL, vL, tO, vO, rateL, rateO, modelRate, slope, expL, expO, scaledOnce, sawTrap, randomScales });
  }

  draw();
  return () => cancelAnimationFrame(anim);
}
