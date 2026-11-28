// 3.3.9 Try it: Provenance and consent inspector.
// Tap any student row to inspect its 4-step provenance chain, toggle sources or the cleaning log,
// test real data requests against the students' promise, generate random datasets, and solve challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, fmt, challenges } = kit;

  const START_ROWS = [
    { id: 215, campus: 'City', source: 'Survey', raw: '"about 20 min"', clean: 'trimmed words → 20', mins: 20, week: 3 },
    { id: 216, campus: 'Hill', source: 'Survey', raw: '"forty mins"', clean: 'words → 40', mins: 40, week: 3 },
    { id: 217, campus: 'Hill', source: 'Survey', raw: '"three quarters of an hour"', clean: '"3/4 hour" → 45', mins: 45, week: 3 },
    { id: 218, campus: 'City', source: 'Survey', raw: '"15"', clean: 'already a number', mins: 15, week: 3 },
  ];

  const LESSON_REQUESTS = [
    { key: 'bus', name: 'Bus office', desc: 'Plan new bus timetables', purpose: 'bus', detail: 'averages' },
    { key: 'teacher', name: 'Teacher', desc: 'List students who live far away', purpose: 'bus', detail: 'individuals' },
    { key: 'parking', name: 'Parking company', desc: 'Buy the student commute list', purpose: 'commercial', detail: 'individuals' },
  ];

  const RANDOM_REQUESTS = [
    { key: 'shuttle', name: 'Shuttle planner', desc: 'Campus average trips for routes', purpose: 'bus', detail: 'averages' },
    { key: 'coach', name: 'Sports coach', desc: 'Check which students arrive late', purpose: 'other', detail: 'individuals' },
    { key: 'cafe', name: 'Coffee shop', desc: 'Buy list of long commuters', purpose: 'commercial', detail: 'individuals' },
    { key: 'transit', name: 'Bus timetable team', desc: 'Compare City vs Hill averages', purpose: 'bus', detail: 'averages' },
    { key: 'dorm', name: 'Housing office', desc: 'Find students over 40 minutes', purpose: 'other', detail: 'individuals' },
  ];

  const RAW_SAMPLES = [
    ['"half an hour"', 'words → 30', 30],
    ['"about 25 mins"', 'trimmed → 25', 25],
    ['"three quarters of an hour"', '"3/4 hour" → 45', 45],
    ['"twenty minutes"', 'words → 20', 20],
    ['"50 min (traffic)"', 'stripped note → 50', 50],
    ['"15m"', 'removed "m" → 15', 15],
    ['"nearly 40"', 'rounded → 40', 40],
    ['"10 mins"', 'trimmed → 10', 10],
  ];

  let rows = START_ROWS.map(r => ({ ...r }));
  let sel = 0; // start on #215 so Challenge 1 asks the learner to tap #217
  let logOn = true;
  let promisePurpose = 'bus'; // 'bus' | 'any'
  let promiseDetail = 'averages'; // 'averages' | 'individuals'
  let req = { ...LESSON_REQUESTS[0] };
  let randomCount = 0;
  const testedOriginal = new Set(['bus']);

  const svg = s('svg', { viewBox: '0 0 700 470' });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const logBtn = btn('Cleaning log: ON', toggleLog);
  const purpBtn = btn('Promise: Bus timetables only', togglePurpose);
  const detBtn = btn('Promise: Group averages only', toggleDetail);

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: provenance and consent'),
    h('p', { class: 'sub' }, 'Tap a student row to inspect where its number came from. Then test requests against the promise students agreed to.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('Switch source (Survey / GPS)', flipSource),
          logBtn),
        h('div', { class: 'sim-row' },
          btn('Use 1: Bus office', () => pickReq(LESSON_REQUESTS[0]), 'go'),
          btn('Use 2: Teacher', () => pickReq(LESSON_REQUESTS[1])),
          btn('Use 3: Parking co.', () => pickReq(LESSON_REQUESTS[2]))),
        h('div', { class: 'sim-row' },
          purpBtn,
          detBtn),
        h('div', { class: 'sim-row' },
          btn('New data (random)', makeRandom),
          btn('Start again', resetAll))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Tap student #217 in the table to trace how "three quarters of an hour" became 45.',
      check: st => st.selectedId === 217 && st.logOn,
      why: 'Yes! The provenance chain shows who asked, what #217 typed, and how cleaning turned words into 45.'
    },
    {
      text: 'Press "Switch source" on one student so the table mixes Survey and Phone GPS.',
      check: st => st.mixedSources,
      why: 'Right: survey memories and phone GPS measure different things, so never mix them without labeling.'
    },
    {
      text: 'Under the original promise (bus timetables, group averages only), test all three uses: Bus office, Teacher, and Parking co.',
      check: st => st.testedCount >= 3,
      why: 'Only the bus office fits both rules. Showing single students or using data for a new purpose breaks consent.'
    },
    {
      text: 'Press "New data (random)" twice and keep the cleaning log ON so every value stays traceable.',
      check: st => st.randomCount >= 2 && st.logOn,
      why: 'The same rules hold for every dataset: write down every cleaning change, and check every use against the promise.'
    },
  ]);

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 420 : 700, VH = NARROW ? 620 : 470;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  function isOriginalPromise() {
    return promisePurpose === 'bus' && promiseDetail === 'averages';
  }

  function evaluateConsent() {
    const purposeOk = promisePurpose === 'any' || req.purpose === 'bus';
    const detailOk = promiseDetail === 'individuals' || req.detail === 'averages';
    const allowed = purposeOk && detailOk;
    let reason = 'Matches the promise';
    if (!purposeOk && !detailOk) reason = 'New purpose & single students';
    else if (!purposeOk) reason = 'New purpose nobody agreed to';
    else if (!detailOk) reason = 'Shows single students';
    return { purposeOk, detailOk, allowed, reason };
  }

  function recordTest() {
    if (isOriginalPromise() && ['bus', 'teacher', 'parking'].includes(req.key)) {
      testedOriginal.add(req.key);
    }
  }

  function flipSource() {
    const r = rows[sel];
    if (r.source === 'Survey') {
      r.source = 'Phone GPS';
      r.raw = `${r.mins}.2 min (GPS sensor)`;
      r.clean = `rounded → ${r.mins}`;
    } else {
      r.source = 'Survey';
      const orig = START_ROWS.find(o => o.id === r.id);
      if (orig) {
        r.raw = orig.raw; r.clean = orig.clean;
      } else {
        r.raw = `"about ${r.mins} min"`; r.clean = `trimmed → ${r.mins}`;
      }
    }
    draw();
  }

  function toggleLog() {
    logOn = !logOn;
    logBtn.textContent = logOn ? 'Cleaning log: ON' : 'Cleaning log: LOST';
    draw();
  }

  function togglePurpose() {
    promisePurpose = promisePurpose === 'bus' ? 'any' : 'bus';
    purpBtn.textContent = promisePurpose === 'bus' ? 'Promise: Bus timetables only' : 'Promise: Any purpose';
    recordTest();
    draw();
  }

  function toggleDetail() {
    promiseDetail = promiseDetail === 'averages' ? 'individuals' : 'averages';
    detBtn.textContent = promiseDetail === 'averages' ? 'Promise: Group averages only' : 'Promise: Single students OK';
    recordTest();
    draw();
  }

  function pickReq(next) {
    req = { ...next };
    recordTest();
    draw();
  }

  function makeRandom() {
    randomCount++;
    const baseId = rnd(100, 880);
    const used = new Set();
    rows = Array.from({ length: 4 }, (_, i) => {
      let pick;
      do { pick = RAW_SAMPLES[rnd(0, RAW_SAMPLES.length - 1)]; } while (used.has(pick[0]) && used.size < RAW_SAMPLES.length);
      used.add(pick[0]);
      const isGps = Math.random() < 0.25;
      const mins = pick[2];
      return {
        id: baseId + i * rnd(1, 5),
        campus: mins >= 35 ? 'Hill' : 'City',
        source: isGps ? 'Phone GPS' : 'Survey',
        raw: isGps ? `${mins}.${rnd(1, 8)} min (GPS)` : pick[0],
        clean: isGps ? `rounded → ${mins}` : pick[1],
        mins,
        week: rnd(2, 6),
      };
    });
    sel = rnd(0, 3);
    req = { ...RANDOM_REQUESTS[rnd(0, RANDOM_REQUESTS.length - 1)] };
    draw();
  }

  function resetAll() {
    rows = START_ROWS.map(r => ({ ...r }));
    sel = 0;
    logOn = true;
    promisePurpose = 'bus';
    promiseDetail = 'averages';
    req = { ...LESSON_REQUESTS[0] };
    logBtn.textContent = 'Cleaning log: ON';
    purpBtn.textContent = 'Promise: Bus timetables only';
    detBtn.textContent = 'Promise: Group averages only';
    draw();
  }

  // pointer tap on table rows in SVG
  const toSvg = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };
  svg.addEventListener('pointerdown', e => {
    const p = toSvg(e);
    const top = NARROW ? 56 : 54, rh = NARROW ? 30 : 28;
    if (p.y >= top && p.y < top + rows.length * rh) {
      sel = Math.floor((p.y - top) / rh);
      draw();
    }
  });

  function boxCard(k, x, y, w, h, stroke, fill = '#0f1630') {
    k.push(s('rect', { x, y, width: w, height: h, rx: 10, fill, stroke, 'stroke-width': 2 }));
  }

  function txt(k, x, y, str, { fill = C.ink, size = 13, anchor = 'start', weight = 400, mono = false } = {}) {
    k.push(s('text', {
      x, y, fill, 'font-size': size, 'text-anchor': anchor, 'font-weight': weight,
      'font-family': mono ? 'Consolas, monospace' : 'Segoe UI, Inter, Arial, sans-serif'
    }, str));
  }

  function draw() {
    const r = rows[sel];
    const sources = new Set(rows.map(x => x.source));
    const mixedSources = sources.size > 1;
    const avg = rows.reduce((a, b) => a + b.mins, 0) / rows.length;
    const verdict = evaluateConsent();
    const k = [];

    if (!NARROW) {
      // --- LAPTOP LAYOUT (700 x 470) ---
      txt(k, 16, 18, 'SURVEY TABLE (tap any row to inspect)', { fill: C.muted, size: 12, weight: 700, mono: true });
      if (mixedSources) {
        k.push(s('rect', { x: 472, y: 4, width: 212, height: 20, rx: 10, fill: '#2a1226', stroke: C.pink }));
        txt(k, 578, 18, '⚠ MIXED SOURCES IN TABLE', { fill: C.pink, size: 11, anchor: 'middle', weight: 700, mono: true });
      }
      // header
      k.push(s('rect', { x: 16, y: 26, width: 668, height: 28, rx: 6, fill: '#182244', stroke: C.line }));
      txt(k, 28, 44, 'STUDENT', { fill: C.muted, size: 11, weight: 700, mono: true });
      txt(k, 112, 44, 'CAMPUS', { fill: C.muted, size: 11, weight: 700, mono: true });
      txt(k, 200, 44, 'SOURCE', { fill: C.muted, size: 11, weight: 700, mono: true });
      txt(k, 326, 44, 'RAW ANSWER', { fill: C.muted, size: 11, weight: 700, mono: true });
      txt(k, 672, 44, 'COMMUTE_MIN', { fill: C.muted, size: 11, anchor: 'end', weight: 700, mono: true });

      rows.forEach((row, i) => {
        const y = 54 + i * 28, isSel = i === sel;
        k.push(s('rect', {
          x: 16, y, width: 668, height: 28, rx: 4,
          fill: isSel ? '#1c2a4d' : (i % 2 ? '#0d142a' : '#0b1020'),
          stroke: isSel ? C.amber : C.line, 'stroke-width': isSel ? 2 : 1, style: 'cursor:pointer'
        }));
        txt(k, 28, y + 18, `#${row.id}`, { fill: isSel ? C.amber : C.ink, size: 13, weight: 700, mono: true });
        txt(k, 112, y + 18, row.campus, { fill: row.campus === 'City' ? C.cyan : C.amber, size: 13 });
        txt(k, 200, y + 18, row.source, { fill: row.source === 'Survey' ? C.cyan : C.violet, size: 12, weight: 700, mono: true });
        txt(k, 326, y + 18, row.raw.length > 27 ? row.raw.slice(0, 25) + '…' : row.raw, { fill: C.muted, size: 12, mono: true });
        txt(k, 668, y + 18, String(row.mins), { fill: isSel ? C.amber : C.cyan, size: 14, anchor: 'end', weight: 700, mono: true });
      });

      // provenance chain
      txt(k, 16, 192, `PROVENANCE CHAIN — STUDENT #${r.id}`, { fill: C.violet, size: 12, weight: 700, mono: true });
      const steps = [
        { x: 16, w: 152, col: r.source === 'Survey' ? C.cyan : C.violet, title: '1. WHO & SOURCE', l1: `Student office · Wk ${r.week}`, l2: r.source },
        { x: 186, w: 164, col: C.amber, title: '2. RAW ANSWER', l1: r.raw.length > 20 ? r.raw.slice(0, 18) + '…' : r.raw, l2: `student #${r.id}` },
        { x: 368, w: 156, col: logOn ? C.green : C.pink, title: '3. CLEANING LOG', l1: logOn ? r.clean : '??? LOG LOST', l2: logOn ? 'change recorded' : 'cannot verify!' },
        { x: 542, w: 142, col: C.amber, title: '4. TABLE CELL', l1: `${r.mins} min`, l2: 'commute_minutes', big: true },
      ];
      steps.forEach((st, idx) => {
        boxCard(k, st.x, 204, st.w, 84, st.col);
        txt(k, st.x + 10, 224, st.title, { fill: st.col, size: 11, weight: 700, mono: true });
        txt(k, st.x + 10, st.big ? 256 : 250, st.l1, { fill: st.big ? C.amber : C.ink, size: st.big ? 22 : 12, weight: st.big ? 700 : 600, mono: true });
        txt(k, st.x + 10, 274, st.l2, { fill: C.muted, size: 11 });
        if (idx < 3) {
          const ax = st.x + st.w + 3;
          k.push(s('line', { x1: ax, y1: 246, x2: ax + 11, y2: 246, stroke: C.muted, 'stroke-width': 2 }));
          k.push(s('polygon', { points: `${ax + 9},241 ${ax + 15},246 ${ax + 9},251`, fill: C.muted }));
        }
      });

      // consent check
      txt(k, 16, 320, 'CONSENT CHECK — REQUEST VS PROMISE', { fill: C.green, size: 12, weight: 700, mono: true });
      boxCard(k, 16, 332, 236, 122, C.green);
      txt(k, 28, 354, 'STUDENTS’ PROMISE', { fill: C.green, size: 12, weight: 700, mono: true });
      txt(k, 28, 382, `Purpose: ${promisePurpose === 'bus' ? 'Bus timetables only' : 'Any purpose'}`, { fill: C.ink, size: 13 });
      txt(k, 28, 408, `Detail:  ${promiseDetail === 'averages' ? 'Group averages only' : 'Single students OK'}`, { fill: C.ink, size: 13 });
      txt(k, 28, 436, `Group average = ${fmt(Math.round(avg * 10) / 10)} min`, { fill: C.muted, size: 12, mono: true });

      boxCard(k, 268, 332, 236, 122, C.cyan);
      txt(k, 280, 354, 'DATA REQUEST', { fill: C.cyan, size: 12, weight: 700, mono: true });
      txt(k, 280, 380, req.name, { fill: C.ink, size: 14, weight: 700 });
      txt(k, 280, 404, req.desc, { fill: C.muted, size: 12 });
      txt(k, 280, 434, `Needs: ${req.detail === 'averages' ? 'group averages' : 'single students'}`, { fill: verdict.detailOk ? C.green : C.pink, size: 12, mono: true });

      const vCol = verdict.allowed ? C.green : C.pink;
      boxCard(k, 520, 332, 164, 122, vCol, verdict.allowed ? '#0e2620' : '#2a1224');
      txt(k, 602, 362, 'VERDICT', { fill: C.muted, size: 11, anchor: 'middle', weight: 700, mono: true });
      txt(k, 602, 398, verdict.allowed ? '✓ ALLOWED' : '✕ DENIED', { fill: vCol, size: 20, anchor: 'middle', weight: 700, mono: true });
      txt(k, 602, 428, verdict.reason.length > 22 ? verdict.reason.slice(0, 20) + '…' : verdict.reason, { fill: C.ink, size: 11, anchor: 'middle' });
    } else {
      // --- PHONE LAYOUT (420 x 620) ---
      txt(k, 12, 18, 'SURVEY TABLE (tap a row)', { fill: C.muted, size: 13, weight: 700, mono: true });
      if (mixedSources) {
        k.push(s('rect', { x: 244, y: 4, width: 164, height: 22, rx: 11, fill: '#2a1226', stroke: C.pink }));
        txt(k, 326, 19, '⚠ MIXED SOURCES', { fill: C.pink, size: 11, anchor: 'middle', weight: 700, mono: true });
      }
      k.push(s('rect', { x: 12, y: 28, width: 396, height: 28, rx: 6, fill: '#182244', stroke: C.line }));
      txt(k, 22, 46, 'STUDENT', { fill: C.muted, size: 12, weight: 700, mono: true });
      txt(k, 114, 46, 'CAMPUS', { fill: C.muted, size: 12, weight: 700, mono: true });
      txt(k, 202, 46, 'SOURCE', { fill: C.muted, size: 12, weight: 700, mono: true });
      txt(k, 398, 46, 'MIN', { fill: C.muted, size: 12, anchor: 'end', weight: 700, mono: true });

      rows.forEach((row, i) => {
        const y = 56 + i * 30, isSel = i === sel;
        k.push(s('rect', {
          x: 12, y, width: 396, height: 30, rx: 4,
          fill: isSel ? '#1c2a4d' : (i % 2 ? '#0d142a' : '#0b1020'),
          stroke: isSel ? C.amber : C.line, 'stroke-width': isSel ? 2 : 1, style: 'cursor:pointer'
        }));
        txt(k, 22, y + 20, `#${row.id}`, { fill: isSel ? C.amber : C.ink, size: 14, weight: 700, mono: true });
        txt(k, 114, y + 20, row.campus, { fill: row.campus === 'City' ? C.cyan : C.amber, size: 14 });
        txt(k, 202, y + 20, row.source, { fill: row.source === 'Survey' ? C.cyan : C.violet, size: 13, weight: 700, mono: true });
        txt(k, 398, y + 20, String(row.mins), { fill: isSel ? C.amber : C.cyan, size: 15, anchor: 'end', weight: 700, mono: true });
      });

      // provenance 2x2 grid
      txt(k, 12, 202, `PROVENANCE — STUDENT #${r.id}`, { fill: C.violet, size: 13, weight: 700, mono: true });
      const pSteps = [
        { x: 12, y: 212, col: r.source === 'Survey' ? C.cyan : C.violet, title: '1. WHO & SOURCE', l1: `Office · Wk ${r.week}`, l2: r.source },
        { x: 216, y: 212, col: C.amber, title: '2. RAW ANSWER', l1: r.raw.length > 20 ? r.raw.slice(0, 18) + '…' : r.raw, l2: `student #${r.id}` },
        { x: 12, y: 302, col: logOn ? C.green : C.pink, title: '3. CLEANING LOG', l1: logOn ? r.clean : '??? LOST', l2: logOn ? 'recorded' : 'untraceable!' },
        { x: 216, y: 302, col: C.amber, title: '4. TABLE CELL', l1: `${r.mins} min`, l2: 'commute_min', big: true },
      ];
      pSteps.forEach(st => {
        boxCard(k, st.x, st.y, 192, 78, st.col);
        txt(k, st.x + 10, st.y + 20, st.title, { fill: st.col, size: 11, weight: 700, mono: true });
        txt(k, st.x + 10, st.y + (st.big ? 50 : 45), st.l1, { fill: st.big ? C.amber : C.ink, size: st.big ? 21 : 13, weight: st.big ? 700 : 600, mono: true });
        txt(k, st.x + 10, st.y + 66, st.l2, { fill: C.muted, size: 12 });
      });

      // consent check
      txt(k, 12, 404, 'CONSENT CHECK', { fill: C.green, size: 13, weight: 700, mono: true });
      boxCard(k, 12, 414, 192, 98, C.green);
      txt(k, 22, 434, 'PROMISE', { fill: C.green, size: 12, weight: 700, mono: true });
      txt(k, 22, 458, promisePurpose === 'bus' ? 'Bus timetables only' : 'Any purpose', { fill: C.ink, size: 13 });
      txt(k, 22, 480, promiseDetail === 'averages' ? 'Group averages only' : 'Single students OK', { fill: C.ink, size: 13 });
      txt(k, 22, 502, `Avg = ${fmt(Math.round(avg * 10) / 10)} min`, { fill: C.muted, size: 12, mono: true });

      boxCard(k, 216, 414, 192, 98, C.cyan);
      txt(k, 226, 434, 'REQUEST', { fill: C.cyan, size: 12, weight: 700, mono: true });
      txt(k, 226, 458, req.name, { fill: C.ink, size: 14, weight: 700 });
      txt(k, 226, 480, req.desc.length > 24 ? req.desc.slice(0, 22) + '…' : req.desc, { fill: C.muted, size: 12 });
      txt(k, 226, 502, req.detail === 'averages' ? 'Group averages' : 'Single students', { fill: verdict.detailOk ? C.green : C.pink, size: 12, mono: true });

      const vCol = verdict.allowed ? C.green : C.pink;
      boxCard(k, 12, 524, 396, 82, vCol, verdict.allowed ? '#0e2620' : '#2a1224');
      txt(k, 210, 558, verdict.allowed ? '✓ ALLOWED' : '✕ NOT ALLOWED', { fill: vCol, size: 22, anchor: 'middle', weight: 700, mono: true });
      txt(k, 210, 586, verdict.reason, { fill: C.ink, size: 14, anchor: 'middle' });
    }

    svg.replaceChildren(...k);

    fbox(box, [
      `cell      = #${r.id} -> ${r.mins} min`,
      [`source    = ${r.source}${mixedSources ? ' (MIXED!)' : ''}`, mixedSources ? C.pink : C.cyan],
      [`cleaning  = ${logOn ? r.clean : 'LOST!'}`, logOn ? C.green : C.pink],
      `request   = ${req.name}`,
      [`consent   = ${verdict.allowed ? 'ALLOWED' : 'NOT ALLOWED'}`, verdict.allowed ? C.green : C.pink],
    ]);

    note.textContent = !logOn
      ? 'The cleaning log is missing: nobody can check how the raw answer became this number.'
      : mixedSources
        ? 'Warning: this table mixes self-reported survey answers with phone GPS. Always label different sources.'
        : verdict.allowed
          ? `Allowed: ${req.name} matches the promise. Only the group average (${fmt(Math.round(avg * 10) / 10)} min) is shared.`
          : `Blocked: ${verdict.reason}. Having the table on your computer does not allow this use.`;

    chal.update({
      selectedId: r.id,
      logOn,
      mixedSources,
      testedCount: testedOriginal.size,
      randomCount,
    });
  }

  draw();
  return () => {};
}
