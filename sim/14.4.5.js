// 14.4.5 Try it: community detection with modularity.
// Learners tap readers to move them between groups (or to add and remove friendships), watch the
// modularity score update live, and run the join-by-join search (Step / Play) with a growing score curve.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, challenges } = kit;

  const NAMES = ['Ana', 'Ben', 'Cara', 'Dan', 'Eli', 'Fay', 'Gus', 'Hana'];
  const COL = [C.cyan, '#60a5fa', '#fb923c', C.violet, '#34d399', '#f9a8d4', '#facc15', '#93c5fd'];
  const GCOL = [C.green, C.amber, '#38bdf8', C.violet, '#fb923c', '#f9a8d4', '#a3e635', '#fde047'];
  const DEFAULT_EDGES = [[0, 1], [1, 2], [2, 3]];

  let n = 4;
  let edges = DEFAULT_EDGES.map(e => e.slice());
  const singles = () => Array.from({ length: n }, (_, i) => i);
  let g = singles();            // group id of each reader
  let history = [];             // [{ q, ok, up }], history[0] = start
  let last = null;              // what the last step did, for the formula box
  let stopped = false, acceptAll = false, random = false, manual = false;
  let mode = 'groups';          // 'groups' = tap moves a reader, 'links' = tap two readers
  let selected = -1, playing = false, speed = 1, timer = 0;

  // --- modularity --------------------------------------------------------------
  const deg = i => edges.filter(([a, b]) => a === i || b === i).length;
  const ids = (part = g) => [...new Set(part)].sort((a, b) => a - b);
  const members = (id, part = g) => { const r = []; for (let i = 0; i < n; i++) if (part[i] === id) r.push(i); return r; };
  const groupName = (id, part = g) => members(id, part).map(i => NAMES[i]).join(' + ');
  const partText = (part = g) => ids(part).map(id => groupName(id, part)).join(' / ');
  function score(part) {
    const m = edges.length;
    if (!m) return { inside: 0, m: 0, num: 0, den: 0, real: 0, exp: 0, q: 0 };
    const inside = edges.filter(([a, b]) => part[a] === part[b]).length;
    const sums = {};
    for (let i = 0; i < n; i++) sums[part[i]] = (sums[part[i]] || 0) + deg(i);
    const num = Object.values(sums).reduce((t, d) => t + d * d, 0), den = 4 * m * m;
    return { inside, m, num, den, real: inside / m, exp: num / den, q: inside / m - num / den };
  }
  const f3 = x => { const v = Math.round(x * 1000) / 1000; return (v < 0 ? '−' : '') + Math.abs(v).toFixed(3); };
  const steps = () => history.length - 1;
  const edgeKey = list => list.map(([a, b]) => (a < b ? `${a}-${b}` : `${b}-${a}`)).sort().join(',');
  const isDefault = () => n === 4 && edgeKey(edges) === '0-1,1-2,2-3';

  // --- DOM -----------------------------------------------------------------------
  const svg = s('svg');
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');
  const stepBadge = pill('STEP 0', C.cyan);
  const scoreBadge = pill('SCORE', C.amber);
  const spdVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.ink } });
  const spdSlider = h('input', {
    type: 'range', min: 1, max: 6, step: 1, value: 1,
    style: { flex: '1 1 120px', accentColor: C.amber },
    oninput: () => { speed = Number(spdSlider.value); spdVal.textContent = `${speed} step${speed > 1 ? 's' : ''} / s`; }
  });
  const playBtn = btn('Play', () => togglePlay());
  const modeBtn = btn('Tap: move a reader to the next group', () => {
    mode = mode === 'groups' ? 'links' : 'groups';
    selected = -1;
    modeBtn.textContent = mode === 'groups' ? 'Tap: move a reader to the next group' : 'Tap two readers: add / remove a friendship';
    draw();
  });
  const ruleBtn = btn('Rule: keep a join only if the score rises', () => {
    acceptAll = !acceptAll;
    ruleBtn.textContent = acceptAll ? 'Rule: keep every join (try to break it)' : 'Rule: keep a join only if the score rises';
    restart();
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: find the reading groups'),
    h('p', { class: 'sub' }, 'Circles are readers, lines are friendships, coloured areas are groups. A friendship inside a group is coloured; one between groups is a pink dashed line. Press Step to try the best join, one at a time.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', style: { marginTop: 0, marginBottom: '.5rem', justifyContent: 'space-between' } }, stepBadge, scoreBadge),
        svg,
        h('div', { class: 'sim-row' },
          btn('Step (try 1 join)', () => { stopPlay(); stepOnce(); }, 'go'),
          playBtn,
          btn('Reset (everyone alone)', () => { g = singles(); manual = false; restart(); }),
          btn('New network (random)', () => newNetwork())),
        h('div', { class: 'sim-row' },
          modeBtn,
          btn('+ reader', () => addReader()),
          btn('− reader', () => removeReader()),
          btn('Bookshop network', () => { n = 4; edges = DEFAULT_EDGES.map(e => e.slice()); random = false; g = singles(); manual = false; restart(); })),
        h('div', { class: 'sim-row' }, ruleBtn),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Speed:'), spdSlider, spdVal)),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    { text: 'On the bookshop network, press Step until the search stops. Which groups does it keep?',
      check: st => st.isDefault && st.stopped && !st.acceptAll && st.steps >= 1 && Math.abs(st.q - 1 / 6) < 1e-6,
      why: 'Ana + Ben, then Cara + Dan: each join raises the score, to 0.167. Joining everyone would drop it to 0, so the search rejects it and stops.' },
    { text: 'On the bookshop network, tap readers to build your own groups. Can you get a score below the start of −0.278?',
      check: st => st.isDefault && st.manual && st.q < -0.2785,
      why: 'Yes: putting readers who are not friends together keeps no friendship inside, but the chance model still expects some, so the score drops.' },
    { text: 'Switch the rule to “keep every join”, then press Play. Where does the score end?',
      check: st => st.acceptAll && st.stopped && st.groups === 1 && st.steps >= 1,
      why: 'Every join is kept, so all readers end in one group with a score of 0. Rejecting joins that lower the score is what stops the search at good groups.' },
    { text: 'Press “New network”, then Play until the search stops. Does the score curve ever go down?',
      check: st => st.random && st.stopped && !st.acceptAll && st.steps >= 1,
      why: 'Never on a kept join: the search keeps a join only when the score rises, and stops as soon as no join helps.' },
  ]);

  // --- geometry ------------------------------------------------------------------
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 500 : 460, F = NARROW ? 1.15 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  const NCX = VW / 2, NCY = 135, RX = NARROW ? 130 : 210, RY = 82;
  const NR = NARROW ? 24 : 27, HR = NR + 13;
  const DIV_Y = 268;
  const CX0 = NARROW ? 52 : 70, CX1 = VW - 26, CY1 = 306, CY0 = VH - 40;
  const pos = i => {
    const th = Math.PI - (i + 0.5) * 2 * Math.PI / n;
    return [NCX + RX * Math.cos(th), NCY - RY * Math.sin(th)];
  };

  // --- actions -------------------------------------------------------------------
  function restart() {
    stopPlay();
    history = [{ q: score(g).q, ok: true, up: false }];
    last = null;
    stopped = false;
    draw();
  }

  function stepOnce() {
    if (stopped) { draw(); return; }
    const now = score(g).q, list = ids();
    if (list.length < 2) { stopped = true; draw(); return; }
    let best = null;
    for (let x = 0; x < list.length; x++) for (let y = x + 1; y < list.length; y++) {
      const part = g.map(v => v === list[y] ? list[x] : v);
      const q = score(part).q;
      if (!best || q > best.q + 1e-12) best = { q, part, a: list[x], b: list[y] };
    }
    const up = best.q > now + 1e-9, keep = acceptAll || up;
    const names = `${groupName(best.a)} + ${groupName(best.b)}`;
    history.push({ q: best.q, ok: keep, up });
    last = { names, keep, up, before: now, s: score(best.part) };
    if (keep) { g = best.part; if (ids().length < 2) stopped = true; }
    else stopped = true;
    if (stopped) stopPlay();
    draw();
  }

  function stopPlay() {
    playing = false;
    clearTimeout(timer);
    timer = 0;
    playBtn.textContent = 'Play';
  }
  function togglePlay() {
    if (playing) { stopPlay(); return; }
    if (stopped) { g = singles(); manual = false; restart(); }
    playing = true;
    playBtn.textContent = 'Pause';
    const loop = () => {
      if (!playing) return;
      stepOnce();
      if (playing) timer = setTimeout(loop, Math.round(1000 / speed));
    };
    timer = setTimeout(loop, 250);
  }

  function tapReader(i) {
    if (mode === 'groups') {
      g[i] = (g[i] + 1) % n;
      manual = true;
      restart();
      return;
    }
    if (selected < 0) { selected = i; draw(); return; }
    if (selected === i) { selected = -1; draw(); return; }
    const a = Math.min(selected, i), b = Math.max(selected, i);
    const k = edges.findIndex(([u, v]) => u === a && v === b);
    if (k >= 0) edges.splice(k, 1); else edges.push([a, b]);
    selected = -1;
    restart();
  }

  function addReader() {
    if (n >= 8) return;
    const free = Array.from({ length: n + 1 }, (_, k) => k).find(k => !g.includes(k));
    edges.push([rnd(0, n - 1), n]);
    g.push(free);
    n++;
    random = false;
    restart();
  }
  function removeReader() {
    if (n <= 3) return;
    n--;
    edges = edges.filter(([a, b]) => a < n && b < n);
    g = g.slice(0, n).map(v => v % n);
    selected = -1;
    random = false;
    restart();
  }

  function newNetwork() {
    const before = edgeKey(edges);
    let list = [];
    for (let tries = 0; tries < 60; tries++) {
      const k = rnd(2, Math.max(2, Math.min(3, Math.floor(n / 2))));
      const hidden = Array.from({ length: n }, (_, i) => i % k).sort(() => Math.random() - 0.5);
      list = [];
      for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++)
        if (Math.random() < (hidden[a] === hidden[b] ? 0.75 : 0.18)) list.push([a, b]);
      const lonely = Array.from({ length: n }, (_, i) => i).some(i => !list.some(([a, b]) => a === i || b === i));
      if (list.length >= 3 && !lonely && edgeKey(list) !== before) break;
    }
    edges = list;
    random = true;
    manual = false;
    g = singles();
    selected = -1;
    restart();
  }

  // --- drawing -------------------------------------------------------------------
  function draw() {
    const el = [];
    const P = Array.from({ length: n }, (_, i) => pos(i));

    // 1. group areas (a soft rounded hull around each group's readers)
    for (const id of ids()) {
      const mem = members(id), col = GCOL[id % GCOL.length];
      if (mem.length === 1) {
        el.push(s('circle', { cx: P[mem[0]][0], cy: P[mem[0]][1], r: HR, fill: col, 'fill-opacity': 0.16, stroke: col, 'stroke-opacity': 0.55, 'stroke-width': 1.5 }));
      } else {
        const pts = mem.map(i => P[i]);
        const mx = pts.reduce((t, p) => t + p[0], 0) / pts.length, my = pts.reduce((t, p) => t + p[1], 0) / pts.length;
        pts.sort((a, b) => Math.atan2(a[1] - my, a[0] - mx) - Math.atan2(b[1] - my, b[0] - mx));
        const d = 'M' + pts.map(p => `${p[0]} ${p[1]}`).join(' L') + ' Z';
        el.push(s('g', { opacity: 0.17 },
          s('path', { d, fill: col, stroke: col, 'stroke-width': 2 * HR, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' })));
      }
    }

    // 2. friendships: coloured inside a group, pink dashed between groups
    for (const [a, b] of edges) {
      const inside = g[a] === g[b];
      el.push(s('line', {
        x1: P[a][0], y1: P[a][1], x2: P[b][0], y2: P[b][1],
        stroke: inside ? GCOL[g[a] % GCOL.length] : C.pink,
        'stroke-width': inside ? 4.5 : 3,
        'stroke-dasharray': inside ? null : '8 6'
      }));
    }

    // 3. readers: name inside, number of friendship ends below
    for (let i = 0; i < n; i++) {
      const [x, y] = P[i];
      const grp = s('g', { style: 'cursor: pointer' });
      if (selected === i) grp.append(s('circle', { cx: x, cy: y, r: NR + 7, fill: 'none', stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }));
      grp.append(
        s('circle', { cx: x, cy: y, r: NR + 10, fill: 'transparent' }),
        s('circle', { cx: x, cy: y, r: NR, fill: C.card, stroke: COL[i], 'stroke-width': 3.2 }),
        s('text', { x, y: y + 5 * F, fill: COL[i], 'font-size': 14 * F, 'font-weight': 700, 'text-anchor': 'middle' }, NAMES[i]),
        s('text', { x, y: y + NR + 15 * F, fill: C.amber, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace' }, `${deg(i)} end${deg(i) === 1 ? '' : 's'}`));
      grp.addEventListener('click', () => tapReader(i));
      el.push(grp);
    }

    // 4. score-versus-step curve
    el.push(
      s('line', { x1: 18, x2: VW - 18, y1: DIV_Y, y2: DIV_Y, stroke: C.line, 'stroke-width': 1.5 }),
      s('text', { x: CX0, y: CY1 - 12, fill: C.amber, 'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas, monospace' },
        'MODULARITY SCORE AFTER EACH STEP'));
    const qs = history.map(e => e.q);
    const lo = Math.min(-0.5, ...qs), hi = Math.max(0.5, ...qs);
    const maxS = Math.max(4, steps());
    const px = k => CX0 + k / maxS * (CX1 - CX0);
    const py = v => CY0 - (v - lo) / (hi - lo) * (CY0 - CY1);
    for (const [v, lab] of [[hi, hi.toFixed(1)], [0, '0'], [lo, (lo < 0 ? '−' : '') + Math.abs(lo).toFixed(1)]]) {
      el.push(
        s('line', { x1: CX0, x2: CX1, y1: py(v), y2: py(v), stroke: v === 0 ? C.muted : C.line, 'stroke-width': 1, 'stroke-dasharray': v === 0 ? '6 5' : null }),
        s('text', { x: CX0 - 8, y: py(v) + 4, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas, monospace' }, lab));
    }
    el.push(
      s('line', { x1: CX0, x2: CX0, y1: CY0, y2: CY1, stroke: C.muted, 'stroke-width': 1.6 }),
      s('text', { x: (CX0 + CX1) / 2, y: CY0 + 24 * F, fill: C.muted, 'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace' }, `step (0 to ${maxS})`));
    let prev = 0;
    history.forEach((e, k) => {
      if (k > 0) {
        el.push(s('line', {
          x1: px(prev), y1: py(history[prev].q), x2: px(k), y2: py(e.q),
          stroke: e.ok ? (e.up ? C.green : C.pink) : C.pink, 'stroke-width': 3, 'stroke-dasharray': e.ok ? null : '6 5'
        }));
      }
      const col = k === 0 ? C.amber : (e.up ? C.green : C.pink);
      el.push(s('circle', { cx: px(k), cy: py(e.q), r: 5, fill: e.ok ? col : C.bg, stroke: col, 'stroke-width': 2 }));
      if (e.ok) prev = k;
    });
    const lastE = history[history.length - 1];
    el.push(s('text', {
      x: Math.min(CX1 - 4, px(steps()) + 9), y: Math.max(CY1 + 12, py(lastE.q) - 9),
      fill: lastE.ok ? (steps() === 0 || lastE.up ? C.amber : C.pink) : C.pink,
      'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas, monospace',
      'text-anchor': px(steps()) > CX1 - 80 ? 'end' : 'start'
    }, lastE.ok ? f3(lastE.q) : `${f3(lastE.q)} rejected`));

    svg.replaceChildren(...el);

    // 5. badges, formula box, note, challenges
    const now = score(g);
    stepBadge.textContent = `STEP ${steps()}`;
    scoreBadge.textContent = `SCORE ${f3(now.q)}`;
    spdVal.textContent = `${speed} step${speed > 1 ? 's' : ''} / s`;

    const shown = last ? last.s : now;
    const rows = [];
    if (!last) rows.push([`Step ${steps()}: ${manual ? 'your groups' : 'every reader alone'}`, C.cyan]);
    else if (!last.keep) rows.push([`Step ${steps()}: try ${last.names}  ✗ reject`, C.pink]);
    else rows.push([`Step ${steps()}: join ${last.names}  ${last.up ? '✓ keep' : '(kept, score fell)'}`, last.up ? C.green : C.pink]);
    if (!shown.m) rows.push(['no friendships yet: score = 0']);
    else {
      rows.push(`real inside     = ${shown.inside}/${shown.m} ≈ ${f3(shown.real)}`);
      rows.push(`expected inside = ${shown.num}/${shown.den} ≈ ${f3(shown.exp)}`);
      rows.push([`score = ${f3(shown.real)} − ${f3(shown.exp)} = ${f3(shown.q)}`, C.amber]);
    }
    if (last) {
      const d = last.s.q - last.before;
      rows.push([`before ${f3(last.before)}  →  change ${d >= 0 ? '+' : ''}${f3(d)}`, d > 1e-9 ? C.green : C.pink]);
    }
    rows.push([`groups: ${partText()}`, C.muted]);
    fbox(box, rows);

    if (stopped && last && !last.keep) note.textContent = 'Search stopped: the best remaining join would not raise the score, so it was rejected.';
    else if (stopped) note.textContent = 'Search finished: everyone is in one group. Press Reset to start again.';
    else if (mode === 'links') note.textContent = selected >= 0 ? `Selected ${NAMES[selected]}. Tap another reader to add or remove a friendship.` : 'Tap one reader, then another, to add or remove a friendship between them.';
    else note.textContent = 'Expected inside = each group’s share of friendship ends, squared, then added. Tap a reader to move it to the next group.';

    chal.update({ isDefault: isDefault(), stopped, acceptAll, random, manual, q: now.q, groups: ids().length, steps: steps() });
  }

  restart();
  return () => stopPlay();
}
