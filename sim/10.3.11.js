// 10.3.11 Try it: Cox regression — proportional hazards vs cumulative share seen.
// The learner drags the weekly no-call bars, adjusts the call score increase (HR = e^score),
// generates random baseline weeks, runs a 100-patient random clinic check, and solves 4 challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const START_BASE = [10, 10, 5]; // percent per week in no-call group
  const START_BETA = Math.LN2;    // ~0.69 -> HR = 2.00

  let base = START_BASE.slice();
  let beta = START_BETA;
  let sel = 0;
  let randomCount = 0;
  let simResult = null;

  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  const betaSlider = h('input', {
    type: 'range', min: '-0.70', max: '1.40', step: '0.01', value: '0.69',
    style: { flex: '1 1 160px', accentColor: C.cyan },
    oninput: e => { beta = +e.target.value; simResult = null; draw(); }
  });
  const betaRead = h('span', { class: 'sim-pill', style: { color: C.amber, borderColor: C.amber } });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: Cox hazard ratio'),
    h('p', { class: 'sub' }, 'Drag any week’s No-call bar up or down, and move the score slider. Watch the Call bar keep the same multiplier in every week, while the 2-week overall share behaves differently.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { style: { fontWeight: 650, color: C.cyan } }, 'Call score increase:'),
          betaSlider,
          betaRead
        ),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−2%', () => bump(-2)),
          btn('+2%', () => bump(2)),
          selLabel
        ),
        h('div', { class: 'sim-row' },
          btn('New baseline (random)', () => {
            base = [rnd(4, 30), rnd(4, 30), rnd(3, 25)];
            randomCount++;
            simResult = null;
            draw();
          }, 'go'),
          btn('Simulate 100 patients', () => runClinicSim()),
          btn('Start again', () => {
            base = START_BASE.slice();
            beta = START_BETA;
            betaSlider.value = '0.69';
            sel = 0;
            simResult = null;
            draw();
          })
        )
      ),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)
      )
    )
  ));

  const r2 = x => Math.round(x * 100) / 100;
  const r1 = x => Math.round(x * 10) / 10;

  function compute() {
    const hr = Math.exp(beta);
    let capped = false;
    const call = base.map(p => {
      const raw = p * hr;
      if (raw > 95) { capped = true; return 95; }
      return raw;
    });
    const waitN2 = (1 - base[0] / 100) * (1 - base[1] / 100);
    const waitC2 = (1 - call[0] / 100) * (1 - call[1] / 100);
    const seenN2 = 1 - waitN2;
    const seenC2 = 1 - waitC2;
    const cumRatio = seenN2 > 1e-6 ? seenC2 / seenN2 : 1;
    return { hr, call, capped, waitN2, waitC2, seenN2, seenC2, cumRatio };
  }

  function runClinicSim() {
    const { call } = compute();
    const N = 100;
    const simGroup = rates => {
      let waiting = N;
      for (let w = 0; w < 2; w++) {
        let got = 0;
        const p = rates[w] / 100;
        for (let i = 0; i < waiting; i++) if (Math.random() < p) got++;
        waiting -= got;
      }
      return { waiting, seen: N - waiting };
    };
    simResult = { noCall: simGroup(base), call: simGroup(call) };
    draw();
  }

  const chal = challenges(ch, [
    {
      text: 'Set the call score increase to 0. What happens to the hazard ratio and both groups?',
      check: st => Math.abs(st.beta) < 0.015,
      why: 'With score increase 0, e^0 = 1. Both groups have the exact same weekly follow-up speed.'
    },
    {
      text: 'Move the score increase until the hazard ratio is about 3 (between 2.9 and 3.1).',
      check: st => st.hr >= 2.9 && st.hr <= 3.1,
      why: 'A score increase of about 1.10 gives e^1.10 ≈ 3, so waiting patients in the call group get visits three times as fast.'
    },
    {
      text: 'Press “New baseline (random)” twice. Check the × multiplier above all three weeks.',
      check: st => st.randomCount >= 2,
      why: 'Even when the no-call curve changes shape across weeks, proportional hazards keep one multiplier throughout.'
    },
    {
      text: 'Keep the hazard ratio near 2 (1.9 to 2.1), and drag Weeks 1 and 2 up until the 2-week “seen ratio” drops below 1.7.',
      check: st => st.hr >= 1.9 && st.hr <= 2.1 && st.cumRatio < 1.7 && !st.capped,
      why: 'Because faster visits shrink the waiting row sooner, the ratio of everyone seen by week 2 is smaller than the weekly hazard ratio.'
    }
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700;
  const F = NARROW ? 1.15 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} 470`);

  const X0 = NARROW ? 42 : 58;
  const X1 = VW - 16;
  const BAR_TOP = 54;
  const BAR_BASE = 248;
  const BAR_H = BAR_BASE - BAR_TOP;
  const MAX_PCT = 80;
  const slotW = (X1 - X0) / 3;

  function bump(d) {
    base[sel] = Math.max(2, Math.min(40, base[sel] + d));
    simResult = null;
    draw();
  }

  // Pointer dragging on the 3 week columns
  let dragging = -1;
  const toSvg = e => {
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(ctm.inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (!p || p.y > BAR_BASE + 20 || p.y < BAR_TOP - 20) return;
    const i = Math.floor((p.x - X0) / slotW);
    if (i < 0 || i > 2) return;
    sel = i; dragging = i;
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  const move = e => {
    if (dragging < 0) return;
    const p = toSvg(e);
    if (!p) return;
    const pct = Math.round(((BAR_BASE - p.y) / BAR_H) * MAX_PCT);
    base[dragging] = Math.max(2, Math.min(40, pct));
    simResult = null;
    draw();
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', () => { dragging = -1; });
  svg.addEventListener('pointercancel', () => { dragging = -1; });

  function draw() {
    const st = compute();
    const k = [];

    // Section A title + legend
    k.push(s('text', { x: X0, y: 22, fill: C.ink, 'font-size': 14 * F, 'font-weight': 700 }, 'Weekly chance among people still waiting (drag bars)'));
    const legX = X1 - (NARROW ? 165 : 190);
    k.push(
      s('rect', { x: legX, y: 11, width: 11, height: 11, rx: 2, fill: C.violet }),
      s('text', { x: legX + 16, y: 21, fill: C.violet, 'font-size': 12 * F, 'font-weight': 700 }, 'No call'),
      s('rect', { x: legX + (NARROW ? 78 : 88), y: 11, width: 11, height: 11, rx: 2, fill: C.cyan }),
      s('text', { x: legX + (NARROW ? 94 : 104), y: 21, fill: C.cyan, 'font-size': 12 * F, 'font-weight': 700 }, 'Call')
    );

    // Grid lines (0%..80%)
    for (let g = 0; g <= MAX_PCT; g += 20) {
      const y = BAR_BASE - (g / MAX_PCT) * BAR_H;
      k.push(
        s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: C.line }),
        s('text', { x: X0 - 8, y: y + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' }, g + '%')
      );
    }

    // 3 week pairs
    const bw = Math.min(46, slotW * 0.28);
    const gap = Math.min(10, slotW * 0.06);
    base.forEach((pN, i) => {
      const pC = st.call[i];
      const cx = X0 + slotW * (i + 0.5);
      if (i === sel) {
        k.push(s('rect', { x: cx - slotW * 0.44, y: BAR_TOP - 8, width: slotW * 0.88, height: BAR_H + 14, fill: '#ffffff', 'fill-opacity': 0.04, rx: 8 }));
      }
      const hN = Math.min(BAR_H, (pN / MAX_PCT) * BAR_H);
      const hC = Math.min(BAR_H, (pC / MAX_PCT) * BAR_H);
      const xN = cx - gap / 2 - bw;
      const xC = cx + gap / 2;

      k.push(
        s('rect', { x: xN, y: BAR_BASE - hN, width: bw, height: hN, rx: 4, fill: C.violet, 'fill-opacity': 0.85, stroke: C.violet }),
        s('text', { x: xN + bw / 2, y: BAR_BASE - hN - 6, fill: C.violet, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r1(pN)) + '%'),
        s('rect', { x: xC, y: BAR_BASE - hC, width: bw, height: hC, rx: 4, fill: C.cyan, 'fill-opacity': 0.85, stroke: C.cyan }),
        s('text', { x: xC + bw / 2, y: BAR_BASE - hC - 6, fill: C.cyan, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, fmt(r1(pC)) + '%'),
        s('text', { x: cx, y: BAR_BASE + 20, fill: C.muted, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle' }, `Week ${i + 1}`)
      );

      // Ratio pill above each week
      const wkRatio = pC / pN;
      const topY = Math.max(BAR_TOP - 2, BAR_BASE - Math.max(hN, hC) - 34);
      const pillW = 54 * F;
      k.push(
        s('rect', { x: cx - pillW / 2, y: topY - 12, width: pillW, height: 20, rx: 10, fill: C.bg, stroke: C.amber }),
        s('text', { x: cx, y: topY + 2, fill: C.amber, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, '×' + fmt(r2(wkRatio)))
      );
    });

    // Divider
    k.push(s('line', { x1: X0, x2: X1, y1: 282, y2: 282, stroke: C.line, 'stroke-dasharray': '5 5' }));

    // Section B: Cumulative check after 2 weeks
    k.push(s('text', { x: X0, y: 306, fill: C.ink, 'font-size': 14 * F, 'font-weight': 700 }, 'Cumulative check after 2 weeks (starting group = 100%)'));
    const barW = X1 - X0;
    const rows = [
      { label: 'No call', y: 326, wait: st.waitN2, seen: st.seenN2, col: C.violet },
      { label: 'Call', y: 382, wait: st.waitC2, seen: st.seenC2, col: C.cyan }
    ];
    rows.forEach(row => {
      const wWait = barW * row.wait;
      const wSeen = barW * row.seen;
      const bh = 28;
      k.push(
        s('text', { x: X0, y: row.y - 5, fill: row.col, 'font-size': 12.5 * F, 'font-weight': 700 }, row.label),
        s('text', { x: X1, y: row.y - 5, fill: C.cyan, 'font-size': 12.5 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, `${fmt(r1(row.seen * 100))}% got visit`),
        s('rect', { x: X0, y: row.y, width: Math.max(1, wWait), height: bh, rx: 4, fill: C.pink, 'fill-opacity': 0.78 }),
        s('rect', { x: X0 + wWait, y: row.y, width: Math.max(1, wSeen), height: bh, rx: 4, fill: C.cyan, 'fill-opacity': 0.85 })
      );
      if (wWait > 82) {
        k.push(s('text', { x: X0 + wWait / 2, y: row.y + 18, fill: C.ink, 'font-size': 12 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${fmt(r1(row.wait * 100))}% waiting`));
      }
    });

    // Bottom comparison strip
    const stripY = 446;
    const diffCol = Math.abs(st.hr - st.cumRatio) > 0.18 ? C.pink : C.green;
    k.push(
      s('text', { x: X0, y: stripY, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `Weekly HR: ${fmt(r2(st.hr))}×`),
      s('text', { x: X1, y: stripY, fill: diffCol, 'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, `Seen by wk 2: ${fmt(r2(st.cumRatio))}×`)
    );

    svg.replaceChildren(...k);

    // Update labels & formula box
    const betaStr = (beta >= 0 ? '+' : '') + beta.toFixed(2);
    betaRead.textContent = `score ${betaStr} → HR ${fmt(r2(st.hr))}`;
    selLabel.textContent = `Selected: Week ${sel + 1} (no-call ${base[sel]}%)`;

    const wN1 = (1 - base[0] / 100).toFixed(2);
    const wN2 = (1 - base[1] / 100).toFixed(2);
    const wC1 = (1 - st.call[0] / 100).toFixed(2);
    const wC2 = (1 - st.call[1] / 100).toFixed(2);

    const lines = [
      `score increase = ${betaStr}`,
      [`hazard ratio   = e^(${betaStr}) = ${fmt(r2(st.hr))}`, C.amber],
      `no-call seen   = 1 − ${wN1}×${wN2} = ${fmt(r1(st.seenN2 * 100))}%`,
      `call seen      = 1 − ${wC1}×${wC2} = ${fmt(r1(st.seenC2 * 100))}%`,
      [`seen ratio     = ${fmt(r1(st.seenC2 * 100))}% ÷ ${fmt(r1(st.seenN2 * 100))}% = ${fmt(r2(st.cumRatio))}×`, diffCol]
    ];
    if (st.capped) lines.push(['(call chance capped at 95%/wk)', C.pink]);
    fbox(box, lines);

    if (simResult) {
      const sRat = simResult.noCall.seen > 0 ? fmt(r2(simResult.call.seen / simResult.noCall.seen)) + '×' : '—';
      note.textContent = `Simulated 100 patients per group over 2 weeks: ${simResult.noCall.seen} of 100 no-call patients got a visit vs ${simResult.call.seen} of 100 call patients (ratio ${sRat}).`;
    } else {
      note.textContent = 'The hazard ratio compares follow-up speed among people still waiting. Because the call row shrinks faster, the ratio of everyone seen by week 2 pulls closer to 1.';
    }

    chal.update({
      beta,
      hr: st.hr,
      cumRatio: st.cumRatio,
      randomCount,
      capped: st.capped
    });
  }

  draw();
  return () => {};
}
