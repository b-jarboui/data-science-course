// 16.2.8 Try it: Versioned data — save named snapshots, change live records, and recover the exact training sample.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;

  const BASE_LIVE = [
    { id: 'A', shop: 'North', amt: 4 },
    { id: 'C', shop: 'South', amt: 6 },
    { id: 'D', shop: 'South', amt: 10 },
    { id: 'E', shop: 'South', amt: 14 },
  ];
  const LATE_B = { id: 'B', shop: 'North', amt: 8 };
  const EXTRA_IDS = ['F', 'G', 'H'];
  const SNAP_NAMES = ['Dawn', 'Updated', 'Copy 3', 'Copy 4'];

  let live = BASE_LIVE.map(t => ({ ...t }));
  let snapshots = [];          // { name, time, tickets: [{id,shop,amt}] }
  let openView = 'live';       // 'live' or snapshot index (0..3)
  let selLive = 0;
  let forecast = null;         // { snapName, total, ids, ticketCount }
  let isRandom = false;
  let randomLiveEditedAfterSnap = false;
  let sawMismatch = false;
  let reproducedDawn = false;
  let randomVerified = false;
  let extraIdx = 0;

  const totalOf = list => list.reduce((acc, t) => acc + t.amt, 0);
  const idsOf = list => list.map(t => t.id).join(', ');
  const shopCol = shop => shop === 'North' ? C.cyan : C.amber;

  const svg = s('svg', { viewBox: '0 0 700 440' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });
  const lateBtn = btn('Late ticket B arrives ($8)', () => addLate());

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: save and reopen snapshots'),
    h('p', { class: 'sub' }, 'Save named snapshots of Monday’s tickets, change the live table, and reopen an earlier snapshot to recover the exact training sample. Tap any live ticket to adjust it, or tap a snapshot card to open it.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('−$2', () => bumpLive(-2)), btn('+$2', () => bumpLive(2)), selLabel),
        h('div', { class: 'sim-row' },
          btn('Save snapshot', () => saveSnap(), 'go'),
          lateBtn,
          btn('Record 7:00 forecast', () => recordForecast()),
          btn('Open Live', () => { openView = 'live'; checkStates(); draw(); }),
          btn('New bakery day (random)', () => makeRandom()),
          btn('Start again', () => resetAll()))),
      h('div', {}, h('div', { class: 'sim-card' }, box, note), h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Save snapshot Dawn at $34, then press “Late ticket B arrives” and save Updated at $42.',
      check: st => st.hasDawn34 && st.hasUpdated42,
      why: 'Yes! Both Dawn ($34) and Updated ($42) stay saved. Adding ticket B never changes Dawn.'
    },
    {
      text: 'Tap Dawn to open it, press “Record 7:00 forecast”, then open Updated (or Live) to see the mismatch.',
      check: st => st.sawMismatch,
      why: 'Right: Updated has 5 tickets ($42), while the 7:00 forecast used Dawn’s 4 tickets ($34). Both describe Monday, so the snapshot name matters.'
    },
    {
      text: 'Now reopen Dawn to recover the exact 4-ticket training sample and reproduce the $34 forecast.',
      check: st => st.reproducedDawn,
      why: 'Exact match! Reopening Dawn returns tickets A, C, D and E ($34), giving reproducibility.'
    },
    {
      text: 'Press “New bakery day (random)”, save a snapshot, change the live tickets, and tap your snapshot to confirm it stayed unchanged.',
      check: st => st.randomVerified,
      why: 'Always! On any day with any numbers, a saved snapshot freezes its training sample so later changes never alter it.'
    },
  ]);

  function resetAll() {
    live = BASE_LIVE.map(t => ({ ...t }));
    snapshots = [];
    openView = 'live';
    selLive = 0;
    forecast = null;
    isRandom = false;
    randomLiveEditedAfterSnap = false;
    extraIdx = 0;
    draw();
  }

  function makeRandom() {
    const startIds = ['A', 'C', 'D', 'E'];
    live = startIds.map((id, idx) => ({
      id,
      shop: idx === 0 ? 'North' : (rnd(0, 1) ? 'North' : 'South'),
      amt: rnd(2, 9) * 2
    }));
    snapshots = [];
    openView = 'live';
    selLive = 0;
    forecast = null;
    isRandom = true;
    randomLiveEditedAfterSnap = false;
    extraIdx = 0;
    draw();
  }

  function saveSnap() {
    if (snapshots.length >= 4) return;
    const name = SNAP_NAMES[snapshots.length];
    const time = snapshots.length === 0 ? 'Tue 6:00' : (snapshots.length === 1 ? 'Tue 8:30' : `Tue ${9 + snapshots.length}:00`);
    snapshots.push({ name, time, tickets: live.map(t => ({ ...t })) });
    openView = snapshots.length - 1;
    checkStates();
    draw();
  }

  function addLate() {
    if (live.length >= 6) return;
    const hasB = live.some(t => t.id === 'B');
    if (!hasB) {
      const amt = isRandom ? rnd(2, 8) * 2 : LATE_B.amt;
      live.splice(1, 0, { id: 'B', shop: 'North', amt });
      selLive = 1;
    } else {
      const id = EXTRA_IDS[extraIdx % EXTRA_IDS.length];
      extraIdx++;
      live.push({ id, shop: rnd(0, 1) ? 'North' : 'South', amt: rnd(2, 8) * 2 });
      selLive = live.length - 1;
    }
    if (isRandom && snapshots.length > 0) randomLiveEditedAfterSnap = true;
    openView = 'live';
    checkStates();
    draw();
  }

  function bumpLive(delta) {
    if (!live[selLive]) return;
    live[selLive].amt = Math.max(2, Math.min(30, live[selLive].amt + delta));
    if (isRandom && snapshots.length > 0) randomLiveEditedAfterSnap = true;
    openView = 'live';
    checkStates();
    draw();
  }

  function recordForecast() {
    const active = getActive();
    forecast = {
      snapName: openView === 'live' ? 'Live (no snapshot)' : snapshots[openView].name,
      total: totalOf(active.tickets),
      ids: idsOf(active.tickets),
      ticketCount: active.tickets.length,
    };
    checkStates();
    draw();
  }

  function getActive() {
    if (openView === 'live' || !snapshots[openView]) {
      return { name: 'Live Monday sales', time: 'current', tickets: live, isSnap: false };
    }
    const sn = snapshots[openView];
    return { name: `Snapshot ${sn.name}`, time: sn.time, tickets: sn.tickets, isSnap: true, snapName: sn.name };
  }

  function checkStates() {
    const active = getActive();
    const curTotal = totalOf(active.tickets);
    const curIds = idsOf(active.tickets);
    if (forecast && forecast.snapName === 'Dawn') {
      if (curTotal !== forecast.total || curIds !== forecast.ids) sawMismatch = true;
      if (sawMismatch && active.isSnap && active.snapName === 'Dawn' && curTotal === forecast.total && curIds === forecast.ids) {
        reproducedDawn = true;
      }
    }
    if (isRandom && randomLiveEditedAfterSnap && active.isSnap) {
      const liveTot = totalOf(live), snapTot = totalOf(active.tickets);
      if (liveTot !== snapTot || live.length !== active.tickets.length) randomVerified = true;
    }
  }

  // Geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = NARROW ? 520 : 440, F = NARROW ? 1.1 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  function draw() {
    const k = [];
    const active = getActive();
    const hasB = live.some(t => t.id === 'B');
    lateBtn.textContent = !hasB ? (isRandom ? 'Add late ticket B' : 'Late ticket B arrives ($8)') : (live.length < 6 ? 'Add another late ticket' : 'Max 6 tickets');

    // --- Section 1: Live Monday sales table ---
    const lx = 14, ly = 14, lw = VW - 28, lh = NARROW ? 176 : 158;
    const liveSelected = openView === 'live';
    const liveBg = s('rect', {
      x: lx, y: ly, width: lw, height: lh, rx: 14,
      fill: C.bg, stroke: liveSelected ? C.cyan : C.line, 'stroke-width': liveSelected ? 2.5 : 1.5,
      style: 'cursor:pointer'
    });
    liveBg.addEventListener('click', () => { openView = 'live'; checkStates(); draw(); });
    k.push(liveBg);

    k.push(
      s('text', { x: lx + 16, y: ly + 26, fill: liveSelected ? C.cyan : C.ink, 'font-size': 15 * F, 'font-weight': 700, 'font-family': 'Consolas' },
        `LIVE MONDAY SALES  (${live.length} tickets · $${totalOf(live)})`),
      s('text', { x: lx + lw - 14, y: ly + 26, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas' },
        liveSelected ? 'OPEN NOW' : 'tap to open')
    );

    // Draw live glowing ticket slips
    const n = live.length;
    const cols = NARROW ? Math.min(3, n) : n;
    const padX = 14, gap = 8;
    const cardW = Math.min(114, (lw - padX * 2 - gap * (cols - 1)) / cols);
    const cardH = NARROW ? (n > 3 ? 58 : 76) : 84;
    live.forEach((tk, idx) => {
      const col = shopCol(tk.shop);
      const row = NARROW ? Math.floor(idx / 3) : 0;
      const cIdx = NARROW ? idx % 3 : idx;
      const inRow = NARROW ? (row === 0 ? Math.min(3, n) : n - 3) : n;
      const rowW = inRow * cardW + (inRow - 1) * gap;
      const x = lx + (lw - rowW) / 2 + cIdx * (cardW + gap);
      const y = ly + (NARROW ? (n > 3 ? 42 + row * 64 : 58) : 50);
      const isSel = idx === selLive;
      const g = s('g', { style: 'cursor:pointer' });
      g.addEventListener('click', e => { e.stopPropagation(); selLive = idx; openView = 'live'; checkStates(); draw(); });
      g.append(
        s('rect', { x: x - 3, y: y - 3, width: cardW + 6, height: cardH + 6, rx: 11, fill: col, 'fill-opacity': isSel ? 0.24 : 0.10 }),
        s('rect', { x, y, width: cardW, height: cardH, rx: 9, fill: C.card, stroke: isSel ? C.ink : col, 'stroke-width': isSel ? 2.5 : 1.8 }),
        s('text', { x: x + cardW / 2, y: y + cardH * 0.44, fill: col, 'font-size': (NARROW && n > 3 ? 15 : 18) * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${tk.id}  $${tk.amt}`),
        s('text', { x: x + cardW / 2, y: y + cardH * 0.78, fill: C.muted, 'font-size': (NARROW && n > 3 ? 11 : 13) * F, 'text-anchor': 'middle', 'font-family': 'Segoe UI, sans-serif' }, tk.shop)
      );
      k.push(g);
    });

    // --- Section 2: Saved Snapshots shelf ---
    const sy = ly + lh + 16, sh = VH - sy - 14;
    k.push(
      s('rect', { x: lx, y: sy, width: lw, height: sh, rx: 14, fill: C.bg, stroke: C.line, 'stroke-width': 1.5 }),
      s('text', { x: lx + 16, y: sy + 26, fill: C.ink, 'font-size': 15 * F, 'font-weight': 700, 'font-family': 'Consolas' },
        `SAVED SNAPSHOTS  (${snapshots.length} of 4 · earlier copies never change)`)
    );

    if (snapshots.length === 0) {
      k.push(
        s('text', { x: VW / 2, y: sy + sh / 2 + 8, fill: C.muted, 'font-size': 15 * F, 'text-anchor': 'middle', 'font-family': 'Segoe UI, sans-serif' },
          'No snapshots saved yet. Press “Save snapshot” to freeze a named copy.')
      );
    } else {
      const sCols = NARROW ? 2 : 2;
      const sGap = 12, sPad = 14;
      const sw = (lw - sPad * 2 - sGap) / sCols;
      const sRows = snapshots.length > 2 ? 2 : 1;
      const shCard = Math.min(182, (sh - 44 - (sRows - 1) * sGap) / sRows);

      snapshots.forEach((sn, idx) => {
        const colIdx = idx % 2, rowIdx = Math.floor(idx / 2);
        const sx = lx + sPad + colIdx * (sw + sGap);
        const cy = sy + 38 + rowIdx * (shCard + sGap);
        const isOpen = openView === idx;
        const accent = idx === 0 ? C.cyan : (idx === 1 ? C.amber : C.violet);
        const isFc = forecast && forecast.snapName === sn.name;
        const g = s('g', { style: 'cursor:pointer' });
        g.addEventListener('click', () => { openView = idx; checkStates(); draw(); });

        g.append(
          s('rect', { x: sx, y: cy, width: sw, height: shCard, rx: 11, fill: C.card, stroke: isOpen ? C.green : accent, 'stroke-width': isOpen ? 3 : 1.8 }),
          s('text', { x: sx + 12, y: cy + 22, fill: accent, 'font-size': 15 * F, 'font-weight': 700, 'font-family': 'Consolas' }, `${sn.name} · ${sn.time}`),
          s('text', { x: sx + sw - 10, y: cy + 22, fill: isOpen ? C.green : C.muted, 'font-size': 11 * F, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' },
            isOpen ? 'OPEN' : 'tap')
        );

        // Mini glowing ticket pills inside snapshot card
        const chipW = NARROW ? 50 : 54, chipH = 22, chipGap = 5;
        const perRow = Math.max(2, Math.floor((sw - 20) / (chipW + chipGap)));
        sn.tickets.forEach((tk, ti) => {
          const r = Math.floor(ti / perRow), c = ti % perRow;
          const cx = sx + 12 + c * (chipW + chipGap);
          const py = cy + 32 + r * (chipH + 5);
          if (py + chipH < cy + shCard - 22) {
            const tc = shopCol(tk.shop);
            g.append(
              s('rect', { x: cx, y: py, width: chipW, height: chipH, rx: 5, fill: C.bg, stroke: tc, 'stroke-width': 1.2 }),
              s('text', { x: cx + chipW / 2, y: py + 15, fill: tc, 'font-size': 11.5 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `${tk.id} $${tk.amt}`)
            );
          }
        });

        const tot = totalOf(sn.tickets);
        g.append(
          s('text', { x: sx + 12, y: cy + shCard - 10, fill: C.ink, 'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas' },
            `${sn.tickets.length} tickets · $${tot}` + (isFc ? '  ★ 7:00' : ''))
        );
        k.push(g);
      });
    }

    svg.replaceChildren(...k);

    // Formula box & live status
    const curTot = totalOf(active.tickets);
    const expr = active.tickets.map(t => `$${t.amt}`).join(' + ');
    const lines = [
      [`open:    ${active.name}`, active.isSnap ? C.green : C.cyan],
      `tickets: ${idsOf(active.tickets)} (${active.tickets.length})`,
      expr.length <= 30 ? `total:   ${expr} = $${curTot}` : `total:   $${curTot}`,
    ];
    if (forecast) {
      const same = curTot === forecast.total && idsOf(active.tickets) === forecast.ids;
      lines.push([
        `7:00 forecast (${forecast.snapName}): $${forecast.total}`,
        C.amber
      ]);
      lines.push([
        same ? 'repeat check: EXACT MATCH ✓' : `repeat check: MISMATCH ($${curTot} ≠ $${forecast.total})`,
        same ? C.green : C.pink
      ]);
    } else {
      lines.push(['7:00 forecast: not recorded yet', C.muted]);
    }
    fbox(box, lines);

    note.textContent = active.isSnap
      ? `Viewing frozen snapshot “${active.snapName}”. Every ticket here is the training sample preserved at ${active.time}. Changing the live table will never alter it.`
      : 'Viewing the live Monday table. Tap a ticket to select it and change its dollars, or save a named snapshot before new tickets arrive.';

    const selTk = live[selLive];
    selLabel.textContent = selTk ? `Selected live ticket: ${selTk.id} (${selTk.shop}, $${selTk.amt})` : '';

    const hasDawn34 = snapshots.some(sn => sn.name === 'Dawn' && sn.tickets.length === 4 && totalOf(sn.tickets) === 34);
    const hasUpdated42 = snapshots.some(sn => sn.name === 'Updated' && sn.tickets.length === 5 && totalOf(sn.tickets) === 42);
    chal.update({ hasDawn34, hasUpdated42, sawMismatch, reproducedDawn, randomVerified });
  }

  draw();
  return () => {};
}
