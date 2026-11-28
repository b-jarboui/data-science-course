// 14.4.4 Try it: PageRank — share importance along connections, round by round.
// Learners tap links (or pairs of readers) to edit friendships, step or play iterations,
// tune the sharing percentage (damping factor), watch the total-change curve drop, and solve 4 challenges.
export default function mount(root, kit) {
  const { h, s, C, btn, pill, fbox, rnd, fmt, challenges } = kit;

  const NAMES = ['Ana', 'Ben', 'Cara', 'Dan'];
  const COL = [C.cyan, '#60a5fa', '#fb923c', C.violet];
  const PAIRS = [[0, 1], [1, 2], [2, 3], [0, 3], [0, 2], [1, 3]];
  const DEFAULT_EDGES = [[0, 1], [1, 2], [2, 3]];

  let edges = DEFAULT_EDGES.map(e => e.slice());
  let d = 0.8;                 // fraction sent to friends (damping factor)
  let equalStart = true;       // true = [25,25,25,25], false = [100,0,0,0]
  let scores = [25, 25, 25, 25];
  let prevScores = null;
  let lastIncoming = null;     // per node: array of { from, amount }
  let lastSharedEach = 5;
  let round = 0;
  let changes = [];            // [{ round, change }]
  let selected = -1;
  let playing = false;
  let speed = 2;               // rounds per second
  let playTimer = 0;
  let animRaf = 0;
  let packets = [];            // active travelling dots [{ from, to, color, t, pool }]

  const r2 = x => Math.round(x * 100) / 100;
  const hasEdge = (a, b) => edges.some(([u, v]) => (u === a && v === b) || (u === b && v === a));
  const neighbors = i => {
    const out = [];
    for (const [u, v] of edges) {
      if (u === i) out.push(v);
      else if (v === i) out.push(u);
    }
    return out;
  };
  const edgeKey = list => list.map(([a, b]) => (a < b ? `${a}-${b}` : `${b}-${a}`)).sort().join(',');
  const isDefaultGraph = () => edgeKey(edges) === '0-1,1-2,2-3';
  const isRingGraph = () => edgeKey(edges) === '0-1,0-3,1-2,2-3';
  const startScores = () => equalStart ? [25, 25, 25, 25] : [100, 0, 0, 0];

  // Build DOM
  const svg = s('svg');
  const box = h('div');
  const note = h('div', { class: 'sim-note' });
  const ch = h('div');
  const roundBadge = pill('ROUND 0', C.cyan);
  const dVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.ink } });
  const spdVal = h('span', { class: 'sim-note', style: { margin: 0, fontFamily: 'Consolas, monospace', color: C.ink } });
  const dSlider = h('input', {
    type: 'range', min: 0, max: 100, step: 5, value: 80,
    style: { flex: '1 1 120px', accentColor: C.cyan },
    oninput: () => {
      d = Number(dSlider.value) / 100;
      resetRun(true);
    }
  });
  const spdSlider = h('input', {
    type: 'range', min: 1, max: 8, step: 1, value: 2,
    style: { flex: '1 1 100px', accentColor: C.amber },
    oninput: () => {
      speed = Number(spdSlider.value);
      spdVal.textContent = `${speed} / s`;
    }
  });
  const playBtn = btn('Play', () => togglePlay());
  const startBtn = btn('Start: 25 each', () => {
    equalStart = !equalStart;
    startBtn.textContent = equalStart ? 'Start: 25 each' : 'Start: 100, 0, 0, 0';
    resetRun(true);
  });

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: PageRank round by round'),
    h('p', { class: 'sub' }, 'Tap any link (solid or dashed) — or tap two readers — to add or remove a friendship. Press Step or Play to watch points travel and total change settle.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' },
        h('div', { class: 'sim-row', style: { marginTop: 0, marginBottom: '.5rem', justifyContent: 'space-between' } },
          roundBadge,
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Total always stays 100 points')),
        svg,
        h('div', { class: 'sim-row' },
          btn('Step (+1 round)', () => { stopPlay(); stepOnce(true); }, 'go'),
          playBtn,
          btn('Reset', () => resetRun(true)),
          btn('New network (random)', () => newRandomGraph()),
          btn('Default line', () => { edges = DEFAULT_EDGES.map(e => e.slice()); d = 0.8; dSlider.value = 80; equalStart = true; startBtn.textContent = 'Start: 25 each'; resetRun(true); }),
          startBtn),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Share with friends:'),
          dSlider, dVal),
        h('div', { class: 'sim-row', style: { alignItems: 'center' } },
          h('span', { class: 'sim-note', style: { margin: 0 } }, 'Speed:'),
          spdSlider, spdVal)),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'On the default line (Ana — Ben — Cara — Dan) at 80% sharing, press Step 3 times and watch total change drop (40 → 16 → 6.4).',
      check: st => st.isDefault && st.d === 0.8 && st.equalStart && st.round >= 3,
      why: 'Yes! Total change falls from 40 to 16 to 6.4, and Ben and Cara rise above Ana and Dan.'
    },
    {
      text: 'Tap the dashed link between Ana and Dan to make a ring, then run until scores settle (change under 0.1).',
      check: st => st.isRing && st.round >= 1 && st.lastChange < 0.1 && st.d > 0 && st.d < 1,
      why: 'Everyone settles at 25! In a ring, every reader has the same connections, so everyone shares the same importance.'
    },
    {
      text: 'Change the friendships so Ana finishes with the highest settled score (round 5 or more, change under 0.5).',
      check: st => st.round >= 5 && st.lastChange < 0.5 &&
        st.scores[0] > st.scores[1] + 0.5 && st.scores[0] > st.scores[2] + 0.5 && st.scores[0] > st.scores[3] + 0.5,
      why: 'Nice! Making Ana a central hub with more friendships sends more incoming points to her.'
    },
    {
      text: 'Use the default line, switch Start to 100, 0, 0, 0, set sharing to 100% (no shared pool), and run at least 6 rounds. Does it settle?',
      check: st => st.isDefault && !st.equalStart && st.d === 1 && st.round >= 6,
      why: 'No! Without a shared pool, points bounce back and forth forever (change stays 200). Lower sharing to 80% and it settles to 17.86 and 32.14.'
    }
  ]);

  // Responsive SVG geometry
  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 500 : 470, F = NARROW ? 1.15 : 1;
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);

  const POS = NARROW
    ? [[64, 184], [154, 92], [246, 92], [336, 184]]
    : [[105, 184], [265, 96], [435, 96], [595, 184]];
  const POOL_POS = NARROW ? [200, 244] : [350, 236];
  const DIV_Y = NARROW ? 282 : 272;
  const CX0 = NARROW ? 48 : 64, CX1 = VW - (NARROW ? 18 : 26);
  const CY0 = NARROW ? 454 : 434, CY1 = NARROW ? 314 : 300;

  function stopPlay() {
    playing = false;
    clearTimeout(playTimer);
    playTimer = 0;
    playBtn.textContent = 'Play';
  }

  function togglePlay() {
    if (playing) { stopPlay(); return; }
    playing = true;
    playBtn.textContent = 'Pause';
    const loop = () => {
      if (!playing) return;
      stepOnce(speed <= 4);
      const delay = Math.max(110, Math.round(1000 / speed));
      playTimer = setTimeout(loop, delay);
    };
    loop();
  }

  function resetRun(keepSelection = false) {
    stopPlay();
    cancelAnimationFrame(animRaf);
    packets = [];
    round = 0;
    scores = startScores();
    prevScores = null;
    lastIncoming = null;
    lastSharedEach = (1 - d) * 100 / 4;
    changes = [];
    if (!keepSelection) selected = -1;
    draw();
  }

  function toggleEdge(a, b) {
    if (a === b) return;
    const idx = edges.findIndex(([u, v]) => (u === a && v === b) || (u === b && v === a));
    if (idx >= 0) edges.splice(idx, 1);
    else edges.push(a < b ? [a, b] : [b, a]);
    selected = -1;
    resetRun(false);
  }

  function newRandomGraph() {
    // Generate a random connected friendship network on the 4 readers, different from current
    const prevKey = edgeKey(edges);
    let candidate = [];
    for (let tries = 0; tries < 25; tries++) {
      // Start with a random spanning tree so all 4 readers connect
      const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      candidate = [];
      for (let i = 1; i < 4; i++) {
        const a = order[i], b = order[rnd(0, i - 1)];
        candidate.push(a < b ? [a, b] : [b, a]);
      }
      // Optionally add 0-2 extra links
      const extras = rnd(0, 2);
      const rest = PAIRS.filter(([a, b]) => !candidate.some(([u, v]) => u === a && v === b));
      for (let k = 0; k < extras && rest.length; k++) {
        const pick = rest.splice(rnd(0, rest.length - 1), 1)[0];
        candidate.push(pick.slice());
      }
      if (edgeKey(candidate) !== prevKey) break;
    }
    edges = candidate;
    resetRun(false);
  }

  function stepOnce(animate) {
    cancelAnimationFrame(animRaf);
    const old = scores.slice();
    const next = [0, 0, 0, 0];
    const incoming = [[], [], [], []];
    let dangling = 0;
    const animPackets = [];

    for (let i = 0; i < 4; i++) {
      const nb = neighbors(i);
      const sendTotal = d * old[i];
      if (nb.length === 0) {
        dangling += sendTotal;
      } else {
        const share = sendTotal / nb.length;
        for (const j of nb) {
          next[j] += share;
          incoming[j].push({ from: i, amount: share });
          if (animate && share > 0.001) {
            animPackets.push({ from: i, to: j, color: COL[i], pool: false, t: 0 });
          }
        }
      }
    }
    const sharedEach = ((1 - d) * 100 + dangling) / 4;
    for (let i = 0; i < 4; i++) {
      next[i] += sharedEach;
      if (animate && sharedEach > 0.001) {
        animPackets.push({ from: -1, to: i, color: C.amber, pool: true, t: 0 });
      }
    }

    const totalChange = old.reduce((acc, v, i) => acc + Math.abs(next[i] - v), 0);
    round++;
    prevScores = old;
    scores = next;
    lastIncoming = incoming;
    lastSharedEach = sharedEach;
    changes.push({ round, change: totalChange });

    if (animate && animPackets.length) {
      packets = animPackets;
      const dur = Math.max(120, Math.min(380, Math.round(700 / speed)));
      const t0 = performance.now();
      const tick = now => {
        const p = Math.min(1, (now - t0) / dur);
        packets.forEach(pk => { pk.t = p; });
        draw();
        if (p < 1) animRaf = requestAnimationFrame(tick);
        else { packets = []; draw(); }
      };
      animRaf = requestAnimationFrame(tick);
    } else {
      packets = [];
      draw();
    }
  }

  function quadPoint(p0, p1, bend, t) {
    const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
    const len = Math.hypot(dx, dy) || 1;
    const cx = mx - (dy / len) * bend, cy = my + (dx / len) * bend;
    const u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * cx + t * t * p1[0], u * u * p0[1] + 2 * u * t * cy + t * t * p1[1]];
  }

  function draw() {
    const el = [];

    // 1. Clickable friendship edges (solid = active, faint dashed = available to add)
    for (const [a, b] of PAIRS) {
      const on = hasEdge(a, b);
      const [x1, y1] = POS[a], [x2, y2] = POS[b];
      el.push(s('line', {
        x1, y1, x2, y2,
        stroke: on ? '#8da0cc' : C.line,
        'stroke-width': on ? 4 : 2,
        'stroke-dasharray': on ? null : '6 6',
        'stroke-opacity': on ? 0.9 : 0.65
      }));
      // Wide invisible hit target for easy touch tapping
      const hit = s('line', {
        x1, y1, x2, y2,
        stroke: 'transparent',
        'stroke-width': 24,
        style: 'cursor: pointer'
      });
      hit.addEventListener('click', () => toggleEdge(a, b));
      el.push(hit);
    }

    // 2. Shared pool badge
    const poolW = NARROW ? 250 : 300, poolH = 30 * F;
    el.push(
      s('rect', {
        x: POOL_POS[0] - poolW / 2, y: POOL_POS[1] - poolH / 2,
        width: poolW, height: poolH, rx: poolH / 2,
        fill: C.bg, stroke: C.amber, 'stroke-width': 1.8, 'stroke-opacity': d < 1 ? 0.9 : 0.35
      }),
      s('text', {
        x: POOL_POS[0], y: POOL_POS[1] + 5 * F,
        fill: d < 1 ? C.amber : C.muted,
        'font-size': 13 * F, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace'
      }, d < 1 ? `Shared pool: ${fmt(r2((1 - d) * 100))} pts (+${fmt(r2(lastSharedEach))} each)` : 'Shared pool: 0 pts (off)')
    );

    // 3. Travelling glowing point packets
    for (const pk of packets) {
      const p0 = pk.pool ? POOL_POS : POS[pk.from];
      const p1 = POS[pk.to];
      const bend = pk.pool ? (pk.to < 2 ? -24 : 24) : 22;
      const [px, py] = quadPoint(p0, p1, bend, pk.t);
      el.push(
        s('circle', { cx: px, cy: py, r: 9, fill: pk.color, 'fill-opacity': 0.25 }),
        s('circle', { cx: px, cy: py, r: 4.8, fill: pk.color })
      );
    }

    // 4. Reader circles with live scores and names
    NAMES.forEach((name, i) => {
      const [x, y] = POS[i];
      const rad = (NARROW ? 26 : 30) + Math.min(18, Math.max(-6, (scores[i] - 20) * 0.42));
      const g = s('g', { style: 'cursor: pointer' });
      if (selected === i) {
        g.append(s('circle', {
          cx: x, cy: y, r: rad + 7, fill: 'none',
          stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '5 4'
        }));
      }
      g.append(
        s('circle', { cx: x, cy: y, r: rad + 4, fill: COL[i], 'fill-opacity': 0.14 }),
        s('circle', { cx: x, cy: y, r: rad, fill: C.card, stroke: COL[i], 'stroke-width': 3.2 }),
        s('text', {
          x, y: y + 6 * F, fill: COL[i],
          'font-size': (NARROW ? 15 : 17) * F, 'font-weight': 700,
          'text-anchor': 'middle', 'font-family': 'Consolas, monospace'
        }, fmt(r2(scores[i]))),
        s('text', {
          x, y: y - rad - 10, fill: COL[i],
          'font-size': (NARROW ? 14 : 15) * F, 'font-weight': 700,
          'text-anchor': 'middle'
        }, `${name} (${neighbors(i).length})`)
      );
      g.addEventListener('click', () => {
        if (selected < 0) { selected = i; draw(); }
        else if (selected === i) { selected = -1; draw(); }
        else toggleEdge(selected, i);
      });
      el.push(g);
    });

    // 5. Divider & Total-change vs Round curve
    el.push(
      s('line', { x1: 18, x2: VW - 18, y1: DIV_Y, y2: DIV_Y, stroke: C.line, 'stroke-width': 1.5 }),
      s('text', {
        x: CX0, y: CY1 - 10, fill: C.amber,
        'font-size': 13 * F, 'font-weight': 700, 'font-family': 'Consolas, monospace'
      }, 'TOTAL CHANGE PER ROUND (FALLS TOWARD 0 AS SCORES SETTLE)')
    );

    const maxR = Math.max(8, round);
    const maxCh = Math.max(40, ...changes.map(c => c.change));
    const px = r => CX0 + (r / maxR) * (CX1 - CX0);
    const py = v => CY0 - (v / maxCh) * (CY0 - CY1);

    // Grid lines for chart
    const ySteps = maxCh > 100 ? [0, 100, 200] : [0, 20, 40];
    for (const v of ySteps) {
      if (v > maxCh + 1) continue;
      const y = py(v);
      el.push(
        s('line', { x1: CX0, x2: CX1, y1: y, y2: y, stroke: C.line, 'stroke-width': 1 }),
        s('text', {
          x: CX0 - 8, y: y + 4, fill: C.muted,
          'font-size': 12 * F, 'text-anchor': 'end', 'font-family': 'Consolas, monospace'
        }, v)
      );
    }
    el.push(
      s('line', { x1: CX0, x2: CX1, y1: CY0, y2: CY0, stroke: C.muted, 'stroke-width': 1.6 }),
      s('line', { x1: CX0, x2: CX0, y1: CY0, y2: CY1, stroke: C.muted, 'stroke-width': 1.6 }),
      s('text', {
        x: (CX0 + CX1) / 2, y: CY0 + 22 * F, fill: C.muted,
        'font-size': 12 * F, 'text-anchor': 'middle', 'font-family': 'Consolas, monospace'
      }, `round (0 to ${maxR})`)
    );

    if (changes.length > 0) {
      const pts = changes.map(c => `${px(c.round)},${py(c.change)}`).join(' ');
      if (changes.length > 1) {
        el.push(s('polyline', { points: pts, fill: 'none', stroke: C.amber, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
      }
      const last = changes[changes.length - 1];
      changes.forEach((c, idx) => {
        const isLast = idx === changes.length - 1;
        const col = c.change < 0.2 ? C.green : C.amber;
        el.push(s('circle', { cx: px(c.round), cy: py(c.change), r: isLast ? 5.5 : 3.8, fill: col }));
      });
      el.push(s('text', {
        x: Math.min(CX1 - 4, px(last.round) + 8),
        y: Math.max(CY1 + 14, py(last.change) - 8),
        fill: last.change < 0.2 ? C.green : C.amber,
        'font-size': 13 * F, 'font-weight': 700,
        'text-anchor': px(last.round) > CX1 - 65 ? 'end' : 'start',
        'font-family': 'Consolas, monospace'
      }, `Δ ${fmt(r2(last.change))}`));
    } else {
      el.push(s('text', {
        x: (CX0 + CX1) / 2, y: (CY0 + CY1) / 2, fill: C.muted,
        'font-size': 13 * F, 'text-anchor': 'middle'
      }, 'Press Step or Play to grow the total-change curve'));
    }

    svg.replaceChildren(...el);

    // Update controls & formula box
    roundBadge.textContent = `ROUND ${round}`;
    dVal.textContent = `${Math.round(d * 100)}% friends · ${Math.round((1 - d) * 100)}% shared`;
    spdVal.textContent = `${speed} / s`;

    const lastChange = changes.length ? changes[changes.length - 1].change : null;
    if (round === 0) {
      fbox(box, [
        [`Round 0 (start)`, C.cyan],
        `share = ${Math.round(d * 100)}% friends, +${fmt(r2(lastSharedEach))} shared`,
        ...NAMES.map((name, i) => [`${name.padEnd(4)} = ${fmt(r2(scores[i]))}  (${neighbors(i).length} ${neighbors(i).length === 1 ? 'friend' : 'friends'})`, COL[i]]),
        [`total = 100 points`, C.amber]
      ]);
      note.textContent = selected >= 0
        ? `Selected ${NAMES[selected]}. Tap another reader to add or remove a friendship.`
        : 'Press Step to walk through one round, or tap any dashed line to add a friendship.';
    } else {
      const rows = [
        [`Round ${round}  (new = incoming + shared)`, C.cyan]
      ];
      NAMES.forEach((name, i) => {
        const inc = lastIncoming[i];
        const sumIn = inc.reduce((a, b) => a + b.amount, 0);
        const terms = inc.length === 0 ? '0'
          : inc.length <= 2 ? inc.map(x => fmt(r2(x.amount))).join(' + ')
          : fmt(r2(sumIn));
        const delta = r2(scores[i] - prevScores[i]);
        const sign = delta > 0 ? `+${fmt(delta)}` : fmt(delta);
        rows.push([`${name.padEnd(4)}: ${terms} + ${fmt(r2(lastSharedEach))} = ${fmt(r2(scores[i]))} (${sign})`, COL[i]]);
      });
      rows.push([
        `total change = ${fmt(r2(lastChange))}`,
        lastChange < 0.1 ? C.green : C.amber
      ]);
      fbox(box, rows);
      note.textContent = lastChange < 0.05
        ? 'Settled! Scores have nearly stopped changing. Readers with better connections hold more points.'
        : (d === 1 && !equalStart && isDefaultGraph() && round >= 3)
          ? 'Notice total change is stuck at 200! Without a shared pool, points keep bouncing back and forth.'
          : 'Each round sends points along friendships using the previous round’s scores, then adds the shared pool.';
    }

    chal.update({
      isDefault: isDefaultGraph(),
      isRing: isRingGraph(),
      d,
      equalStart,
      round,
      scores,
      lastChange: lastChange == null ? Infinity : lastChange
    });
  }

  draw();
  return () => {
    stopPlay();
    cancelAnimationFrame(animRaf);
  };
}
