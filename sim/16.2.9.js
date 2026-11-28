// 16.2.9 Try it: experiment tracking with run cards.
// The learner picks code, data snapshot (Dawn or Updated), software environment and settings,
// edits ticket amounts or creates a random bakery day, saves run cards, compares what changed,
// and taps any saved run card to repeat earlier work.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const START_TICKETS = () => [
    { id: 'A', shop: 'North', time: 'Mon 9a', amt: 4, late: false },
    { id: 'B', shop: 'North', time: 'Mon 11a', amt: 8, late: true },
    { id: 'C', shop: 'South', time: 'Mon 10a', amt: 6, late: false },
    { id: 'D', shop: 'South', time: 'Mon 12p', amt: 10, late: false },
    { id: 'E', shop: 'South', time: 'Mon 2p', amt: 14, late: false }
  ];

  let tickets = START_TICKETS();
  let sundayTotal = 26;
  let code = 'Baseline One';      // 'Baseline One' | 'Baseline Two'
  let dataName = 'Dawn';          // 'Dawn' | 'Updated'
  let env = 'Bakery Setup';       // 'Bakery Setup' | 'Bakery Setup 2'
  let days = 1;                   // 1 | 2
  let selTicket = 0;
  let dayId = 1;
  let isRandom = false;
  let runs = [];
  let replayedRandom = false;
  let statusMsg = '';

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700;
  const VH = NARROW ? 610 : 465;

  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const selLabel = h('span', { class: 'sim-note', style: { margin: 0 } });

  const bCode = btn('', () => { code = code === 'Baseline One' ? 'Baseline Two' : 'Baseline One'; statusMsg = ''; draw(); });
  const bData = btn('', () => { dataName = dataName === 'Dawn' ? 'Updated' : 'Dawn'; statusMsg = ''; draw(); });
  const bEnv = btn('', () => { env = env === 'Bakery Setup' ? 'Bakery Setup 2' : 'Bakery Setup'; statusMsg = ''; draw(); });
  const bDays = btn('', () => { days = days === 1 ? 2 : 1; statusMsg = ''; draw(); });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: build and compare run cards'),
    h('p', { class: 'sub' }, 'Choose the four details of a run, save run cards to compare why forecasts differ, and tap any saved card to repeat it. Tap a ticket to adjust its amount.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' }, bCode, bData, bEnv, bDays),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          btn('Save run', saveRun, 'go'),
          btn('New bakery day (random)', newRandomDay),
          btn('−$1', () => bumpTicket(-1)),
          btn('+$1', () => bumpTicket(1)),
          btn('Start again', resetAll),
          selLabel)),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const activeTickets = (snap = dataName) => tickets.filter(t => snap === 'Updated' || !t.late);
  const mondaySum = (snap = dataName) => activeTickets(snap).reduce((a, t) => a + t.amt, 0);
  const r2 = x => Math.round(x * 100) / 100;

  function computeForecast(c = code, snap = dataName, d = days) {
    const mon = mondaySum(snap);
    const base = d === 1 ? mon : (sundayTotal + mon) / 2;
    return r2(c === 'Baseline One' ? base : base + 5);
  }

  function saveRun() {
    const run = {
      num: runs.length + 1,
      dayId,
      isRandom,
      code,
      data: dataName,
      env,
      days,
      monTotal: mondaySum(dataName),
      sunTotal: sundayTotal,
      forecast: computeForecast(code, dataName, days),
      time: dataName === 'Dawn' ? 'Tue 7:00 a.m.' : 'Tue 8:30 a.m.'
    };
    runs.push(run);
    statusMsg = `Saved Run #${run.num}: forecast $${fmt(run.forecast)}.`;
    draw();
  }

  function newRandomDay() {
    dayId++;
    isRandom = true;
    replayedRandom = false;
    tickets = [
      { id: 'A', shop: 'North', time: 'Mon 9a', amt: rnd(2, 16), late: false },
      { id: 'B', shop: 'North', time: 'Mon 11a', amt: rnd(4, 14), late: true },
      { id: 'C', shop: 'South', time: 'Mon 10a', amt: rnd(4, 18), late: false },
      { id: 'D', shop: 'South', time: 'Mon 12p', amt: rnd(4, 20), late: false },
      { id: 'E', shop: 'South', time: 'Mon 2p', amt: rnd(6, 22), late: false }
    ];
    sundayTotal = rnd(10, 30) * 2;
    dataName = 'Dawn';
    code = 'Baseline One';
    env = 'Bakery Setup';
    days = 1;
    selTicket = 0;
    statusMsg = 'New random Monday sales created. Save runs with Dawn and Updated to compare!';
    draw();
  }

  function bumpTicket(delta) {
    const t = tickets[selTicket];
    if (!t) return;
    if (t.late && dataName === 'Dawn') {
      dataName = 'Updated';
    }
    t.amt = Math.max(1, Math.min(40, t.amt + delta));
    statusMsg = `Ticket ${t.id} updated to $${t.amt}.`;
    draw();
  }

  function resetAll() {
    tickets = START_TICKETS();
    sundayTotal = 26;
    code = 'Baseline One';
    dataName = 'Dawn';
    env = 'Bakery Setup';
    days = 1;
    selTicket = 0;
    dayId = 1;
    isRandom = false;
    runs = [];
    replayedRandom = false;
    statusMsg = '';
    draw();
  }

  function replayRun(num) {
    const r = runs.find(x => x.num === num);
    if (!r) return;
    code = r.code;
    dataName = r.data;
    env = r.env;
    days = r.days;
    if (r.isRandom && r.dayId === dayId && r.data === 'Dawn') {
      const sameDay = runs.filter(x => x.dayId === dayId && x.isRandom);
      if (sameDay.some(x => x.data === 'Dawn') && sameDay.some(x => x.data === 'Updated')) {
        replayedRandom = true;
      }
    }
    statusMsg = `Repeated Run #${r.num}: restored ${r.code}, ${r.data}, ${r.env}, ${r.days} prev day${r.days > 1 ? 's' : ''}.`;
    draw();
  }

  const onSvgClick = e => {
    const tEl = e.target.closest('[data-ticket]');
    if (tEl) {
      const idx = Number(tEl.getAttribute('data-ticket'));
      if (!Number.isNaN(idx) && tickets[idx]) {
        selTicket = idx;
        if (tickets[idx].late && dataName === 'Dawn') {
          statusMsg = 'Ticket B is late and only appears in Updated. Switch Data to Updated to include it.';
        } else {
          statusMsg = '';
        }
        draw();
      }
      return;
    }
    const rEl = e.target.closest('[data-run]');
    if (rEl) {
      replayRun(Number(rEl.getAttribute('data-run')));
    }
  };
  svg.addEventListener('click', onSvgClick);

  const chal = challenges(ch, [
    {
      text: 'Save the Tuesday 7:00 a.m. baseline: Baseline One, Dawn, Bakery Setup, 1 prev day, then press “Save run”.',
      check: st => st.hasBaseline,
      why: 'Saved! Your run card connects the forecast to the exact code, data, software environment and setting.'
    },
    {
      text: 'Keep the same code, environment and settings, switch Data to “Updated”, and press “Save run” to compare.',
      check: st => st.hasDataCompare,
      why: 'The forecast changed because the data changed (late ticket B arrived), not because the instructions changed.'
    },
    {
      text: 'Switch Data back to “Dawn”, change either Code or Settings, and press “Save run” to see the difference tracked.',
      check: st => st.hasRuleOrSettingCompare,
      why: 'Right! Changing the code or setting also changes the forecast, and the run card highlights exactly what moved.'
    },
    {
      text: 'Press “New bakery day (random)”, save one run with Dawn and one with Updated, then tap your Dawn card to repeat it.',
      check: st => st.replayedRandom,
      why: 'With any new numbers, saved run cards let you repeat earlier work and prove why two results differ.'
    }
  ]);

  function compareState() {
    const sameDay = runs.filter(r => r.dayId === dayId);
    const hasBaseline = runs.some(r => r.code === 'Baseline One' && r.data === 'Dawn' && r.env === 'Bakery Setup' && r.days === 1);
    let hasDataCompare = false;
    let hasRuleOrSettingCompare = false;
    for (let i = 0; i < runs.length; i++) {
      for (let j = i + 1; j < runs.length; j++) {
        const a = runs[i], b = runs[j];
        if (a.dayId !== b.dayId) continue;
        if (a.code === b.code && a.env === b.env && a.days === b.days && a.data !== b.data) hasDataCompare = true;
        if (a.data === 'Dawn' && b.data === 'Dawn' && (a.code !== b.code || a.days !== b.days)) hasRuleOrSettingCompare = true;
      }
    }
    return { hasBaseline, hasDataCompare, hasRuleOrSettingCompare, replayedRandom, count: sameDay.length };
  }

  function diffSummary(a, b) {
    const diffs = [];
    if (a.code !== b.code) diffs.push(`Code (${a.code} → ${b.code})`);
    if (a.data !== b.data) diffs.push(`Data (${a.data} → ${b.data})`);
    if (a.env !== b.env) diffs.push(`Env (${a.env} → ${b.env})`);
    if (a.days !== b.days) diffs.push(`Settings (${a.days}d → ${b.days}d)`);
    if (!diffs.length) return `Run #${a.num} and Run #${b.num} used the exact same four details and gave the same forecast ($${fmt(b.forecast)}).`;
    return `Run #${a.num} ($${fmt(a.forecast)}) vs Run #${b.num} ($${fmt(b.forecast)}): changed ${diffs.join(', ')}.`;
  }

  function draw() {
    bCode.textContent = `Code: ${code}`;
    bData.textContent = `Data: ${dataName}`;
    bEnv.textContent = `Env: ${env}`;
    bDays.textContent = `Settings: ${days} prev day${days > 1 ? 's' : ''}`;

    const k = [];
    const mon = mondaySum(dataName);
    const fc = computeForecast(code, dataName, days);

    // 1) Top snapshot box with glowing tickets
    const snapH = NARROW ? 186 : 138;
    const snapCol = dataName === 'Dawn' ? C.cyan : C.amber;
    k.push(
      s('rect', { x: 8, y: 8, width: VW - 16, height: snapH, rx: 14, fill: C.bg, stroke: snapCol, 'stroke-width': 1.8 }),
      s('text', { x: 22, y: 31, fill: snapCol, 'font-size': NARROW ? 13 : 14, 'font-weight': 700, 'font-family': 'Consolas' },
        dataName === 'Dawn'
          ? `SNAPSHOT: DAWN · 4 MONDAY TICKETS ($${mon})`
          : `SNAPSHOT: UPDATED · 5 MONDAY TICKETS ($${mon})`)
    );

    tickets.forEach((t, i) => {
      const included = dataName === 'Updated' || !t.late;
      const col = t.shop === 'North' ? C.cyan : C.amber;
      let tx, ty, tw, th;
      if (NARROW) {
        if (i < 3) { tw = 114; th = 64; tx = 20 + i * 123; ty = 44; }
        else { tw = 148; th = 64; tx = 44 + (i - 3) * 164; ty = 118; }
      } else {
        tw = 122; th = 82; tx = 22 + i * 133; ty = 48;
      }
      const g = s('g', { 'data-ticket': i, style: 'cursor: pointer' });
      const isSel = i === selTicket;
      g.append(s('rect', {
        x: tx, y: ty, width: tw, height: th, rx: 10,
        fill: included ? C.card : '#0d1328',
        stroke: isSel ? C.ink : (included ? (t.late ? C.pink : col) : C.line),
        'stroke-width': isSel ? 2.5 : 1.8,
        'stroke-dasharray': included ? null : '6 5',
        opacity: included ? 1 : 0.65
      }));
      if (included) {
        g.append(
          s('rect', { x: tx + 6, y: ty + 8, width: 5, height: th - 16, rx: 2.5, fill: col }),
          s('text', { x: tx + 18, y: ty + 22, fill: C.ink, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas' }, `Ticket ${t.id}`),
          s('text', { x: tx + 18, y: ty + 40, fill: col, 'font-size': 12, 'font-weight': 700, 'font-family': 'Segoe UI, Arial, sans-serif' }, t.shop),
          s('text', { x: tx + tw - 12, y: ty + (NARROW ? 45 : 64), fill: t.late ? C.pink : col, 'font-size': NARROW ? 19 : 22, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, `$${t.amt}`)
        );
        if (t.late) {
          g.append(
            s('rect', { x: tx + tw - 48, y: ty + 6, width: 42, height: 17, rx: 6, fill: C.bg, stroke: C.pink }),
            s('text', { x: tx + tw - 27, y: ty + 18, fill: C.pink, 'font-size': 10, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'LATE')
          );
        }
      } else {
        g.append(
          s('text', { x: tx + tw / 2, y: ty + th / 2 - 4, fill: C.muted, 'font-size': 12, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'Ticket B'),
          s('text', { x: tx + tw / 2, y: ty + th / 2 + 14, fill: C.muted, 'font-size': 11, 'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial, sans-serif' }, 'late · not in Dawn')
        );
      }
      k.push(g);
    });

    // 2) Current Run Card (live)
    const rcX = 8, rcY = NARROW ? 206 : 160, rcW = NARROW ? VW - 16 : 308, rcH = NARROW ? 176 : 295;
    k.push(
      s('rect', { x: rcX, y: rcY, width: rcW, height: rcH, rx: 14, fill: C.bg, stroke: C.cyan, 'stroke-width': 1.8 }),
      s('text', { x: rcX + 16, y: rcY + 26, fill: C.cyan, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas' }, 'CURRENT RUN CARD (LIVE)')
    );

    const fields = [
      ['1. CODE', code, C.cyan],
      ['2. DATA', dataName, C.amber],
      ['3. ENV', env, C.violet],
      ['4. SETTINGS', `${days} prev day${days > 1 ? 's' : ''}`, C.green]
    ];
    const rowStep = NARROW ? 26 : 46;
    const rowStart = rcY + (NARROW ? 40 : 44);
    fields.forEach(([label, val, col], i) => {
      const y = rowStart + i * rowStep;
      const rh = NARROW ? 22 : 38;
      k.push(
        s('rect', { x: rcX + 12, y, width: rcW - 24, height: rh, rx: 7, fill: C.card, stroke: col, 'stroke-width': 1.2 }),
        s('text', { x: rcX + 22, y: y + (NARROW ? 15 : 24), fill: col, 'font-size': NARROW ? 12 : 13, 'font-weight': 700, 'font-family': 'Consolas' }, label),
        s('text', { x: rcX + rcW - 22, y: y + (NARROW ? 15 : 24), fill: C.ink, 'font-size': NARROW ? 12 : 14, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, val)
      );
    });
    const resY = rcY + rcH - (NARROW ? 30 : 54);
    k.push(
      s('rect', { x: rcX + 12, y: resY, width: rcW - 24, height: NARROW ? 24 : 42, rx: 8, fill: C.card, stroke: C.amber, 'stroke-width': 2 }),
      s('text', { x: rcX + 22, y: resY + (NARROW ? 16 : 26), fill: C.amber, 'font-size': NARROW ? 12 : 14, 'font-weight': 700, 'font-family': 'Consolas' }, 'FORECAST'),
      s('text', { x: rcX + rcW - 22, y: resY + (NARROW ? 17 : 28), fill: C.amber, 'font-size': NARROW ? 16 : 21, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, `$${fmt(fc)}`)
    );

    // 3) Saved Runs Log (compare + tap to repeat)
    const logX = NARROW ? 8 : 330, logY = NARROW ? 394 : 160;
    const logW = NARROW ? VW - 16 : VW - 338, logH = NARROW ? 208 : 295;
    k.push(
      s('rect', { x: logX, y: logY, width: logW, height: logH, rx: 14, fill: C.bg, stroke: C.line, 'stroke-width': 1.8 }),
      s('text', { x: logX + 16, y: logY + 26, fill: C.green, 'font-size': 13, 'font-weight': 700, 'font-family': 'Consolas' }, 'SAVED RUNS (TAP CARD TO REPEAT)')
    );

    const visibleRuns = runs.filter(r => r.dayId === dayId).slice(-4);
    if (!visibleRuns.length) {
      k.push(
        s('text', { x: logX + logW / 2, y: logY + logH / 2 - 6, fill: C.muted, 'font-size': 14, 'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial, sans-serif' }, 'No runs saved for this bakery day yet.'),
        s('text', { x: logX + logW / 2, y: logY + logH / 2 + 16, fill: C.cyan, 'font-size': 13, 'text-anchor': 'middle', 'font-family': 'Segoe UI, Arial, sans-serif' }, 'Press “Save run” to record your first run card.')
      );
    } else {
      const ref = visibleRuns[0];
      const cardH = NARROW ? 38 : 55;
      const gap = NARROW ? 6 : 8;
      visibleRuns.forEach((r, idx) => {
        const y = logY + 38 + idx * (cardH + gap);
        const isFirst = idx === 0;
        const diffCode = !isFirst && r.code !== ref.code;
        const diffData = !isFirst && r.data !== ref.data;
        const diffEnv = !isFirst && r.env !== ref.env;
        const diffDays = !isFirst && r.days !== ref.days;
        const g = s('g', { 'data-run': r.num, style: 'cursor: pointer' });
        g.append(
          s('rect', { x: logX + 10, y, width: logW - 20, height: cardH, rx: 9, fill: C.card, stroke: isFirst ? C.cyan : C.green, 'stroke-width': 1.5 }),
          s('text', { x: logX + 20, y: y + (NARROW ? 16 : 21), fill: C.ink, 'font-size': NARROW ? 12 : 13, 'font-weight': 700, 'font-family': 'Consolas' }, `Run #${r.num}`),
          s('text', { x: logX + logW - 20, y: y + (NARROW ? 24 : 33), fill: C.amber, 'font-size': NARROW ? 16 : 19, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Consolas' }, `$${fmt(r.forecast)}`)
        );
        const chips = [
          [r.code === 'Baseline One' ? 'Base1' : 'Base2', diffCode, C.cyan],
          [r.data, diffData, C.amber],
          [r.env === 'Bakery Setup' ? 'Setup1' : 'Setup2', diffEnv, C.violet],
          [`${r.days}d`, diffDays, C.green]
        ];
        let cx = logX + (NARROW ? 74 : 20);
        const cy = y + (NARROW ? 22 : 38);
        chips.forEach(([txt, changed, baseCol]) => {
          const cw = txt.length * 7.2 + 12;
          const col = changed ? C.pink : baseCol;
          g.append(
            s('rect', { x: cx, y: cy - 13, width: cw, height: 18, rx: 6, fill: C.bg, stroke: col, 'stroke-width': changed ? 1.8 : 1 }),
            s('text', { x: cx + cw / 2, y: cy, fill: col, 'font-size': 11, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, txt)
          );
          cx += cw + 5;
        });
        k.push(g);
      });
    }

    svg.replaceChildren(...k);

    // Formula box
    const tList = activeTickets(dataName).map(t => t.amt).join(' + ');
    const lines = [
      `Data (${dataName}): ${tList} = $${mon}`,
      days === 1
        ? `Settings (1 prev day): $${mon}`
        : `Settings (2 prev days): (${sundayTotal} + ${mon}) ÷ 2 = $${fmt((sundayTotal + mon) / 2)}`,
      code === 'Baseline One'
        ? `Code (Baseline One): carry total`
        : `Code (Baseline Two): carry total + $5`,
      [`Forecast = $${fmt(fc)}  (${env})`, C.amber]
    ];
    fbox(box, lines);

    const sameDayRuns = runs.filter(r => r.dayId === dayId);
    if (statusMsg) {
      note.textContent = statusMsg;
    } else if (sameDayRuns.length >= 2) {
      note.textContent = diffSummary(sameDayRuns[sameDayRuns.length - 2], sameDayRuns[sameDayRuns.length - 1]);
    } else {
      note.textContent = 'Pink tags on saved run cards show which details changed from your first saved run.';
    }

    const st = tickets[selTicket];
    selLabel.textContent = `Selected: Ticket ${st.id} (${st.shop}, $${st.amt})`;
    chal.update(compareState());
  }

  draw();
  return () => svg.removeEventListener('click', onSvgClick);
}
