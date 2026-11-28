// 16.1.9 Try it: human review and the abstention band.
// Drag the two dividing points on the risk line (or use the sliders), read notes
// for homes inside the yellow review band, decide as the dispatcher, and test on new data.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, challenges } = kit;

  const LESSON_HOMES = [
    { id: 'A', district: 'North', calls: 2, pipe: 'Older', risk: 90, urgent: true,
      note: 'Water is pooling near the main shutoff valve.' },
    { id: 'B', district: 'North', calls: 0, pipe: 'Newer', risk: 10, urgent: false,
      note: 'Resident asked for a routine pressure check next month.' },
    { id: 'C', district: 'South', calls: 2, pipe: 'Newer', risk: 50, urgent: true,
      note: 'Water is coming through the floor.' },
    { id: 'D', district: 'South', calls: 0, pipe: 'Older', risk: 30, urgent: true,
      note: 'Loud rushing sound under the kitchen floor all morning.' }
  ];

  const URGENT_NOTES = [
    'Water is coming through the floor.',
    'Basement carpet is soaked near the water pipe.',
    'Ceiling below the bathroom is dripping fast.',
    'Pressure dropped to zero and water is outside the wall.'
  ];
  const ROUTINE_NOTES = [
    'Small drip at a garden tap when turned on.',
    'Resident wants a routine meter check next week.',
    'Slightly noisy pipe only when the washer fills.',
    'Question about last month’s water bill.'
  ];

  let homes = LESSON_HOMES.map(x => ({ ...x, human: null }));
  let low = 40, high = 60, isRandom = false, sel = 2;

  const svg = s('svg', { viewBox: '0 0 700 420' });
  const desk = h('div', { class: 'sim-card', style: { marginTop: '0.8rem' } });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  const lowRange = h('input', { type: 'range', min: 0, max: 100, step: 5, value: low });
  const highRange = h('input', { type: 'range', min: 0, max: 100, step: 5, value: high });
  const lowOut = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.amber, fontWeight: 700 } });
  const highOut = h('span', { style: { fontFamily: 'Consolas, monospace', color: C.amber, fontWeight: 700 } });

  lowRange.addEventListener('input', () => {
    low = Math.min(+lowRange.value, high);
    draw();
  });
  highRange.addEventListener('input', () => {
    high = Math.max(+highRange.value, low);
    draw();
  });

  function makeRandomHomes() {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const baseRisks = [10, 25, 40, 55, 70, 90];
    homes = letters.map((id, i) => {
      const district = i < 3 ? 'North' : 'South';
      const risk = Math.max(5, Math.min(95, baseRisks[i] + rnd(-8, 8)));
      const urgent = Math.random() * 100 < Math.min(92, Math.max(12, risk + 5));
      const pool = urgent ? URGENT_NOTES : ROUTINE_NOTES;
      return { id, district, risk, urgent, note: pool[rnd(0, pool.length - 1)], human: null };
    });
    isRandom = true;
    sel = 0;
    draw();
  }

  function resetLesson() {
    homes = LESSON_HOMES.map(x => ({ ...x, human: null }));
    low = 40;
    high = 60;
    isRandom = false;
    sel = 2;
    draw();
  }

  function inBand(hm) { return hm.risk >= low && hm.risk < high; }

  function finalDecision(hm) {
    if (hm.risk < low) return 'routine';
    if (hm.risk >= high) return 'urgent';
    return hm.human; // 'urgent', 'routine', or null (pending)
  }

  function autoReviewAll() {
    homes.forEach(hm => {
      if (inBand(hm)) hm.human = hm.urgent ? 'urgent' : 'routine';
    });
    draw();
  }

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: human review & abstention band'),
    h('p', { class: 'sub' }, 'Drag the two yellow dividing points on the risk line (or use the sliders). Homes inside the yellow band go to the dispatcher: read their note and choose.'),
    h('div', { class: 'sim-grid' },
      h('div', {},
        h('div', { class: 'sim-card' },
          svg,
          h('div', { class: 'sim-row' },
            h('label', { style: { display: 'flex', alignItems: 'center', gap: '0.45rem', flex: '1 1 12rem' } },
              'Lower cut ', lowRange, lowOut),
            h('label', { style: { display: 'flex', alignItems: 'center', gap: '0.45rem', flex: '1 1 12rem' } },
              'Upper cut ', highRange, highOut)),
          h('div', { class: 'sim-row' },
            btn('Dispatcher reads all notes', autoReviewAll, 'go'),
            btn('New requests (random)', makeRandomHomes),
            btn('Lesson homes (A–D)', resetLesson))),
        desk),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'With the 4 lesson homes at 40%–60%, read Home C’s note and put Home C on today’s list.',
      check: st => !st.isRandom && st.low <= 50 && st.high > 50 && st.homeC === 'urgent',
      why: 'Yes! Home C’s note gave extra information the model did not use, so human review put it on today’s list.'
    },
    {
      text: 'Still on the 4 lesson homes, widen the yellow band so Home D (30%) goes to review, then put Home D on today’s list so 0 urgent visits are missed.',
      check: st => !st.isRandom && st.low <= 30 && st.high > 30 && st.homeD === 'urgent' && st.missedUrgent === 0 && st.pending === 0,
      why: 'Right! A wider band caught Home D and cut missed urgent visits to 0 — at the cost of more work for the dispatcher.'
    },
    {
      text: 'Narrow the yellow band so the model decides every home automatically (0 homes in review).',
      check: st => st.reviewCount === 0 && st.bandWidth <= 15,
      why: 'With a narrow band, the dispatcher spends no time reviewing — but borderline requests get no human check.'
    },
    {
      text: 'Press “New requests (random)”, move the band so at least 2 homes enter review, and finish reviewing them.',
      check: st => st.isRandom && st.reviewCount >= 2 && st.pending === 0,
      why: 'Nice! On any new batch of requests, moving the dividing points trades dispatcher time against catching uncertain cases.'
    }
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700;
  const F = NARROW ? 1.15 : 1;
  const X0 = NARROW ? 24 : 44, X1 = VW - (NARROW ? 24 : 44);
  const LINE_Y = 128, BAND_TOP = 48, BAND_H = 82;
  const r2x = v => X0 + (v / 100) * (X1 - X0);
  const x2r = x => Math.max(0, Math.min(100, Math.round(((x - X0) / (X1 - X0)) * 20) * 5));
  svg.setAttribute('viewBox', `0 0 ${VW} 420`);

  // Pointer dragging for the two dividing points
  let dragHandle = null; // 'low' | 'high'
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    if (p.y < 160) {
      const dl = Math.abs(p.x - r2x(low)), dh = Math.abs(p.x - r2x(high));
      const hit = NARROW ? 34 : 28;
      if (Math.min(dl, dh) <= hit) {
        dragHandle = dl <= dh ? 'low' : 'high';
        svg.setPointerCapture(e.pointerId);
        onMove(e);
        return;
      }
    }
    // Tap a table row to select that home
    const rowTop = 196, rowH = Math.min(48, Math.floor(208 / homes.length));
    if (p.y >= rowTop) {
      const idx = Math.floor((p.y - rowTop) / rowH);
      if (idx >= 0 && idx < homes.length) {
        sel = idx;
        draw();
      }
    }
  });

  function onMove(e) {
    if (!dragHandle) return;
    const p = toSvg(e);
    const v = x2r(p.x);
    if (dragHandle === 'low') low = Math.min(v, high);
    else high = Math.max(v, low);
    draw();
  }
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', () => { dragHandle = null; });
  svg.addEventListener('pointercancel', () => { dragHandle = null; });

  function drawDesk() {
    const inReview = homes.map((hm, i) => ({ hm, i })).filter(x => inBand(x.hm));
    if (inReview.length && !inBand(homes[sel])) sel = inReview[0].i;

    const head = h('div', { class: 'sim-row', style: { marginTop: 0, justifyContent: 'space-between' } },
      pill('DISPATCHER DESK', C.amber),
      h('span', { class: 'sim-note', style: { margin: 0 } },
        inReview.length ? `${inReview.length} in review band` : 'No homes in the yellow band'));

    if (!inReview.length) {
      desk.replaceChildren(head,
        h('p', { class: 'sim-note' }, 'Widen the yellow abstention band to send uncertain requests here for human review.'));
      return;
    }

    const tabs = h('div', { class: 'sim-row' },
      inReview.map(({ hm, i }) => btn(
        `Home ${hm.id} (${hm.risk}%)${hm.human ? (hm.human === 'urgent' ? ' · TODAY' : ' · WAIT') : ' · ?'}`,
        () => { sel = i; draw(); },
        i === sel ? 'go' : ''
      )));

    const cur = homes[sel];
    const dec = cur.human;
    const noteCard = h('div', {
      style: {
        marginTop: '0.75rem',
        padding: '0.7rem 0.85rem',
        background: C.bg,
        border: `1px solid ${C.amber}`,
        borderRadius: '0.65rem'
      }
    },
      h('div', { style: { fontSize: '0.85rem', fontFamily: 'Consolas, monospace', color: C.amber, fontWeight: 700 } },
        `NOTE FROM HOME ${cur.id} (${cur.district} · ${cur.risk}% predicted risk)`),
      h('div', { style: { marginTop: '0.3rem', fontSize: '1.05rem', color: C.ink, fontWeight: 600 } },
        `“${cur.note}”`));

    const actions = h('div', { class: 'sim-row' },
      btn('Put on today’s list (Urgent)', () => { cur.human = 'urgent'; draw(); }, dec === 'urgent' ? 'go' : ''),
      btn('Keep routine (Can wait)', () => { cur.human = 'routine'; draw(); }, dec === 'routine' ? 'go' : ''));

    desk.replaceChildren(head, tabs, noteCard, actions);
  }

  function draw() {
    lowRange.value = low;
    highRange.value = high;
    lowOut.textContent = `${low}%`;
    highOut.textContent = `${high}%`;

    const k = [];
    const xL = r2x(low), xH = r2x(high);

    // Three shaded risk zones
    k.push(
      s('rect', { x: X0, y: BAND_TOP, width: Math.max(0, xL - X0), height: BAND_H, fill: C.cyan, 'fill-opacity': 0.11 }),
      s('rect', { x: xL, y: BAND_TOP, width: Math.max(0, xH - xL), height: BAND_H, fill: C.amber, 'fill-opacity': 0.25 }),
      s('rect', { x: xH, y: BAND_TOP, width: Math.max(0, X1 - xH), height: BAND_H, fill: C.pink, 'fill-opacity': 0.12 })
    );

    if (xL - X0 > 55) {
      k.push(s('text', { x: (X0 + xL) / 2, y: BAND_TOP + 18, fill: C.cyan, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'ROUTINE'));
    }
    if (xH - xL > 52) {
      k.push(s('text', { x: (xL + xH) / 2, y: BAND_TOP + 18, fill: C.amber, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'REVIEW'));
    }
    if (X1 - xH > 55) {
      k.push(s('text', { x: (xH + X1) / 2, y: BAND_TOP + 18, fill: C.pink, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'URGENT'));
    }

    // Risk axis and ticks
    k.push(s('line', { x1: X0, x2: X1, y1: LINE_Y, y2: LINE_Y, stroke: C.muted, 'stroke-width': 2.5 }));
    for (let v = 0; v <= 100; v += 20) {
      const x = r2x(v);
      k.push(
        s('line', { x1: x, x2: x, y1: LINE_Y - 5, y2: LINE_Y + 6, stroke: C.muted, 'stroke-width': 1.5 }),
        s('text', { x, y: LINE_Y + 21, fill: C.muted, 'font-size': 11 * F, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${v}%`)
      );
    }

    // Draggable dividing lines & handles
    const handles = [
      { x: xL, label: `${low}%`, off: xH - xL < 38 ? -16 : 0 },
      { x: xH, label: `${high}%`, off: xH - xL < 38 ? 16 : 0 }
    ];
    handles.forEach(hd => {
      k.push(
        s('line', { x1: hd.x, x2: hd.x, y1: BAND_TOP - 8, y2: LINE_Y + 4, stroke: C.amber, 'stroke-width': 2.5 }),
        s('rect', { x: hd.x + hd.off - 22, y: BAND_TOP - 28, width: 44, height: 22, rx: 11, fill: C.bg, stroke: C.amber, 'stroke-width': 2, style: 'cursor:ew-resize' }),
        s('text', { x: hd.x + hd.off, y: BAND_TOP - 13, fill: C.amber, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas', style: 'cursor:ew-resize;user-select:none' }, hd.label)
      );
    });

    // Home dots on the risk line (staggered vertically if close)
    const placed = [];
    homes.forEach((hm, i) => {
      const x = r2x(hm.risk);
      const near = placed.filter(px => Math.abs(px - x) < (NARROW ? 28 : 38)).length;
      placed.push(x);
      const y = LINE_Y - 22 - near * 22;
      const col = hm.risk < low ? C.cyan : (hm.risk >= high ? C.pink : C.amber);
      k.push(
        s('circle', { cx: x, cy: y, r: i === sel ? 11 : 8, fill: col, 'fill-opacity': 0.24 }),
        s('circle', { cx: x, cy: y, r: 5.5, fill: col }),
        s('text', { x, y: y - 10, fill: col, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, hm.id)
      );
    });

    // Fixed-order audit table in lower SVG
    const hdrY = 184, rowTop = 196;
    const rowH = Math.min(48, Math.floor(208 / homes.length));
    const cHome = X0 + 8;
    const cRisk = NARROW ? X0 + 78 : X0 + 132;
    const riskW = NARROW ? 88 : 185;
    const cDec = NARROW ? X0 + 190 : X0 + 365;
    const cCrew = NARROW ? X0 + 292 : X0 + 515;

    k.push(
      s('text', { x: cHome, y: hdrY, fill: C.muted, 'font-size': 11 * F, 'font-weight': 700 }, 'Home'),
      s('text', { x: cRisk, y: hdrY, fill: C.cyan, 'font-size': 11 * F, 'font-weight': 700 }, 'Risk (0–100%)'),
      s('text', { x: cDec, y: hdrY, fill: C.amber, 'font-size': 11 * F, 'font-weight': 700 }, 'Decision'),
      s('text', { x: cCrew, y: hdrY, fill: C.green, 'font-size': 11 * F, 'font-weight': 700 }, 'Crew urgent')
    );

    let routineCount = 0, reviewCount = 0, urgentCount = 0, pending = 0, missedUrgent = 0;

    homes.forEach((hm, i) => {
      const y = rowTop + i * rowH, cy = y + rowH / 2;
      const rev = inBand(hm), dec = finalDecision(hm);
      if (rev) reviewCount++;
      else if (hm.risk < low) routineCount++;
      else urgentCount++;
      if (dec === null) pending++;
      if (hm.urgent && dec === 'routine') missedUrgent++;

      const dc = hm.district === 'North' ? C.cyan : C.violet;
      const isMissed = hm.urgent && dec === 'routine';
      k.push(
        s('rect', {
          x: X0, y: y + 2, width: X1 - X0, height: rowH - 5, rx: 7,
          fill: i === sel ? '#1b274b' : (i % 2 === 0 ? '#121b38' : '#0e152d'),
          stroke: isMissed ? C.pink : (i === sel ? C.amber : C.line),
          'stroke-width': isMissed || i === sel ? 1.8 : 1,
          style: 'cursor:pointer'
        }),
        s('rect', { x: X0 + 2, y: y + 7, width: 4, height: rowH - 15, rx: 2, fill: dc }),
        s('text', { x: cHome + 6, y: cy - 2, fill: C.ink, 'font-size': 12 * F, 'font-weight': 700 }, `Home ${hm.id}`),
        s('text', { x: cHome + 6, y: cy + 12, fill: dc, 'font-size': 10 * F, 'font-family': 'Consolas' }, hm.district)
      );

      // Mini labeled risk strip
      const rCol = hm.risk < low ? C.cyan : (hm.risk >= high ? C.pink : C.amber);
      k.push(
        s('rect', { x: cRisk, y: cy + 2, width: riskW, height: 8, rx: 3, fill: C.muted, 'fill-opacity': 0.2 }),
        s('rect', { x: cRisk + (low / 100) * riskW, y: cy + 2, width: Math.max(0, ((high - low) / 100) * riskW), height: 8, fill: C.amber, 'fill-opacity': 0.35 }),
        s('rect', { x: cRisk, y: cy + 2, width: (hm.risk / 100) * riskW, height: 8, rx: 3, fill: rCol, 'fill-opacity': 0.88 }),
        s('text', { x: cRisk, y: cy - 4, fill: rCol, 'font-size': 11 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `${hm.risk}%`)
      );

      // Separate dispatch decision mark
      const decLabel = dec === null ? 'REVIEW ?' : (dec === 'urgent' ? (rev ? 'TODAY ★' : 'TODAY') : (rev ? 'WAIT ★' : 'WAIT'));
      const decCol = dec === null ? C.amber : (dec === 'urgent' ? C.pink : C.cyan);
      k.push(
        s('rect', { x: cDec, y: cy - 12, width: NARROW ? 78 : 98, height: 24, rx: 6, fill: decCol, 'fill-opacity': 0.14, stroke: decCol, 'stroke-width': 1.2 }),
        s('text', { x: cDec + (NARROW ? 39 : 49), y: cy + 4, fill: decCol, 'font-size': 10.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, decLabel)
      );

      // Separate crew confirmed urgency & match mark
      const crewTxt = hm.urgent ? 'YES' : 'NO';
      const matchTxt = dec === null ? '·' : ((dec === 'urgent') === hm.urgent ? '✓' : '×');
      const matchCol = dec === null ? C.muted : ((dec === 'urgent') === hm.urgent ? C.green : C.pink);
      k.push(
        s('text', { x: cCrew + 12, y: cy + 4, fill: hm.urgent ? C.green : C.muted, 'font-size': 11.5 * F, 'font-weight': 700, 'font-family': 'Consolas' }, crewTxt),
        s('text', { x: cCrew + (NARROW ? 52 : 76), y: cy + 5, fill: matchCol, 'font-size': 15 * F, 'font-weight': 700 }, matchTxt)
      );
    });

    svg.replaceChildren(...k);
    drawDesk();

    fbox(box, [
      [`< ${low}%            → routine (${routineCount})`, C.cyan],
      [`${low}% to < ${high}%   → review  (${reviewCount})`, C.amber],
      [`≥ ${high}%           → urgent  (${urgentCount})`, C.pink],
      [`missed urgent: ${missedUrgent}   pending: ${pending}`, missedUrgent > 0 ? C.pink : C.green]
    ]);

    note.textContent = pending > 0
      ? `The dispatcher still has ${pending} request${pending > 1 ? 's' : ''} to examine. Read the note below the chart and choose.`
      : missedUrgent > 0
        ? `${missedUrgent} urgent visit${missedUrgent > 1 ? 's were' : ' was'} still missed automatically. Human review helps, but does not remove every mistake.`
        : 'All urgent visits are on today’s list! Check how many requests the dispatcher had to examine.';

    const homeC = !isRandom ? finalDecision(homes[2]) : null;
    const homeD = !isRandom ? finalDecision(homes[3]) : null;
    chal.update({
      isRandom,
      low,
      high,
      bandWidth: high - low,
      reviewCount,
      pending,
      missedUrgent,
      homeC,
      homeD
    });
  }

  draw();
  return () => {};
}
