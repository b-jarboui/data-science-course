// 14.4.3 Try it: Recording friendships (graph, edge list, adjacency matrix, and degree).
// Tap two readers, tap any line slot, or tap any box in the adjacency matrix to add or remove a friendship.
export default function mount(root, kit) {
  const { h, s, C, btn, fbox, rnd, challenges } = kit;

  const NAMES = ['Ana', 'Ben', 'Cara', 'Dan'];
  const RCOL = [C.cyan, '#60a5fa', '#fb923c', C.violet]; // Ana=cyan, Ben=blue, Cara=orange, Dan=purple
  const ALL_PAIRS = [[0, 1], [1, 2], [2, 3], [0, 3], [0, 2], [1, 3]];
  const START_EDGES = [[0, 1], [1, 2], [2, 3]];

  let adj = makeAdj(START_EDGES);
  let selectedNode = -1;
  let lastPair = null;
  let focusRow = 0;
  let randomCount = 0;
  let statusNote = 'Tap any box in the table, tap a line, or tap two reader circles to add or remove a friendship.';

  function makeAdj(edges) {
    const m = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
    for (const [a, b] of edges) { m[a][b] = 1; m[b][a] = 1; }
    return m;
  }

  function edgeList() {
    const list = [];
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) if (adj[i][j]) list.push([i, j]);
    }
    return list;
  }

  function degrees() {
    return adj.map(row => row.reduce((acc, v) => acc + v, 0));
  }

  function mutualFriends(a, b) {
    const shared = [];
    for (let k = 0; k < 4; k++) {
      if (k !== a && k !== b && adj[a][k] && adj[b][k]) shared.push(NAMES[k]);
    }
    return shared;
  }

  const NARROW = (root.clientWidth || innerWidth) < 600;
  const VW = NARROW ? 400 : 700, VH = NARROW ? 620 : 370;
  const svg = s('svg', { viewBox: `0 0 ${VW} ${VH}` });
  const box = h('div'), note = h('div', { class: 'sim-note' }), ch = h('div');

  root.append(h('div', { class: 'sim' },
    h('h2', {}, 'Try it: recording friendships'),
    h('p', { class: 'sub' }, 'Change the friendships in the graph or in the adjacency matrix. Both pictures, the edge list, and every reader’s degree update together.'),
    h('div', { class: 'sim-grid' },
      h('div', { class: 'sim-card' }, svg,
        h('div', { class: 'sim-row' },
          btn('New data (random)', () => randomize(), 'go'),
          btn('Clear all', () => {
            adj = makeAdj([]);
            selectedNode = -1;
            lastPair = null;
            statusNote = 'Cleared all friendships. Every cell in the matrix is now 0.';
            draw();
          }),
          btn('Reset example', () => {
            adj = makeAdj(START_EDGES);
            selectedNode = -1;
            lastPair = null;
            focusRow = 0;
            statusNote = 'Back to the bookshop example: (Ana, Ben), (Ben, Cara), and (Cara, Dan).';
            draw();
          }))),
      h('div', {},
        h('div', { class: 'sim-card' }, box, note),
        h('div', { class: 'sim-card' }, ch)))));

  const chal = challenges(ch, [
    {
      text: 'Add a direct friendship between Ana and Cara. Watch the edge list and the matrix update.',
      check: st => st.adj[0][2] === 1,
      why: 'Yes! One new friendship adds (Ana, Cara) to the edge list and sets two symmetric boxes to 1: (Ana, Cara) and (Cara, Ana).'
    },
    {
      text: 'Give Ben a degree of 3 (friends with every other reader).',
      check: st => st.deg[1] === 3,
      why: 'Right! Ben’s row now contains three 1s, so Ben’s degree is 1 + 0 + 1 + 1 = 3.'
    },
    {
      text: 'Make a graph with exactly 4 friendships. Notice how many 1s appear in the matrix.',
      check: st => st.edges === 4,
      why: 'With 4 friendships, there are 8 ones in the matrix. Each friendship appears twice because it works in both directions.'
    },
    {
      text: 'Press “New data (random)” twice. Is the number of 1s always double the number of friendships?',
      check: st => st.randomCount >= 2,
      why: 'Always. Every undirected friendship sets both (row, column) and (column, row) to 1, so the total number of 1s is always 2 × friendships.'
    },
  ]);

  function togglePair(a, b) {
    if (a === b) {
      focusRow = a;
      lastPair = [a, a];
      statusNote = `${NAMES[a]} cannot be counted as their own friend, so the diagonal box (${NAMES[a]}, ${NAMES[a]}) stays 0.`;
      draw();
      return;
    }
    const next = adj[a][b] ? 0 : 1;
    adj[a][b] = next;
    adj[b][a] = next;
    selectedNode = -1;
    lastPair = [a, b];
    focusRow = a;
    if (next === 1) {
      statusNote = `Added friendship (${NAMES[a]}, ${NAMES[b]}): both (${NAMES[a]}, ${NAMES[b]}) and (${NAMES[b]}, ${NAMES[a]}) became 1.`;
    } else {
      const shared = mutualFriends(a, b);
      statusNote = shared.length
        ? `Removed direct friendship (${NAMES[a]}, ${NAMES[b]}) → 0. They still share a friend: ${shared.join(' and ')}.`
        : `Removed friendship (${NAMES[a]}, ${NAMES[b]}): both (${NAMES[a]}, ${NAMES[b]}) and (${NAMES[b]}, ${NAMES[a]}) became 0.`;
    }
    draw();
  }

  function tapNode(i) {
    if (selectedNode === -1) {
      selectedNode = i;
      focusRow = i;
      statusNote = `Selected ${NAMES[i]}. Tap another reader to add or remove a friendship with ${NAMES[i]}.`;
      draw();
    } else if (selectedNode === i) {
      selectedNode = -1;
      statusNote = `Deselected ${NAMES[i]}.`;
      draw();
    } else {
      togglePair(selectedNode, i);
    }
  }

  function randomize() {
    const prevKey = adj.flat().join('');
    let next = makeAdj([]);
    for (let tries = 0; tries < 10; tries++) {
      const picked = ALL_PAIRS.filter(() => rnd(0, 1) === 1);
      if (picked.length === 0) picked.push(ALL_PAIRS[rnd(0, ALL_PAIRS.length - 1)]);
      next = makeAdj(picked);
      if (next.flat().join('') !== prevKey) break;
    }
    adj = next;
    selectedNode = -1;
    lastPair = null;
    randomCount++;
    const eCount = edgeList().length;
    statusNote = `New random friendships: ${eCount} friendship${eCount === 1 ? '' : 's'} and ${2 * eCount} ones in the matrix.`;
    draw();
  }

  // Geometry for graph and matrix (responsive laptop vs phone)
  const NODES = NARROW
    ? [[110, 96], [290, 96], [290, 224], [110, 224]]
    : [[86, 112], [234, 112], [234, 258], [86, 258]];
  const NR = NARROW ? 30 : 32;
  const BADGE_OFF = NARROW
    ? [[-46, -24], [46, -24], [46, 24], [-46, 24]]
    : [[-44, -26], [44, -26], [44, 26], [-44, 26]];

  const GX = NARROW ? 76 : 400;
  const GY = NARROW ? 354 : 84;
  const CW = NARROW ? 60 : 54;
  const CH = 54;
  const DEG_CX = NARROW ? 356 : 656;

  function draw() {
    const elist = edgeList();
    const deg = degrees();
    const ones = elist.length * 2;
    const kids = [];

    // Section headers and divider
    if (NARROW) {
      kids.push(
        s('text', { x: 200, y: 26, fill: C.muted, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'GRAPH (tap two readers or a line)'),
        s('line', { x1: 18, x2: 382, y1: 284, y2: 284, stroke: C.line, 'stroke-width': 1.5 }),
        s('text', { x: 200, y: 314, fill: C.muted, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'ADJACENCY MATRIX (tap any box)')
      );
    } else {
      kids.push(
        s('text', { x: 160, y: 28, fill: C.muted, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'GRAPH (tap two readers or a line)'),
        s('line', { x1: 320, x2: 320, y1: 18, y2: 352, stroke: C.line, 'stroke-width': 1.5 }),
        s('text', { x: 516, y: 28, fill: C.muted, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, 'ADJACENCY MATRIX (tap any box)')
      );
    }

    // Draw all 6 possible edges (solid if connected, faint dashed slot if not)
    for (const [a, b] of ALL_PAIRS) {
      const [x1, y1] = NODES[a], [x2, y2] = NODES[b];
      const on = adj[a][b] === 1;
      const isLast = lastPair && ((lastPair[0] === a && lastPair[1] === b) || (lastPair[0] === b && lastPair[1] === a));
      const stroke = on ? (isLast ? C.amber : C.ink) : (isLast ? C.pink : '#2d3a66');
      kids.push(s('line', {
        x1, y1, x2, y2,
        stroke,
        'stroke-width': on ? (isLast ? 5 : 3.8) : 2,
        'stroke-dasharray': on ? null : '5 6',
        'stroke-opacity': on ? 0.95 : 0.7,
      }));
      // Wide invisible hit area for tapping the line directly
      const hit = s('line', { x1, y1, x2, y2, stroke: 'transparent', 'stroke-width': 18, style: 'cursor:pointer' });
      hit.addEventListener('click', () => togglePair(a, b));
      kids.push(hit);
    }

    // Draw 4 reader circles and degree badges
    NODES.forEach(([x, y], i) => {
      const isSel = selectedNode === i;
      if (isSel) {
        kids.push(s('circle', { cx: x, cy: y, r: NR + 7, fill: 'none', stroke: C.amber, 'stroke-width': 2.5, 'stroke-dasharray': '5 4' }));
      }
      const g = s('g', { style: 'cursor:pointer' },
        s('circle', { cx: x, cy: y, r: NR, fill: C.card, stroke: RCOL[i], 'stroke-width': isSel ? 4 : 3 }),
        s('text', { x, y: y + 5, fill: RCOL[i], 'font-size': 15, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': '"Segoe UI", Arial, sans-serif' }, NAMES[i])
      );
      g.addEventListener('click', () => tapNode(i));
      kids.push(g);

      // Small live degree badge beside each reader
      const [bx, by] = [x + BADGE_OFF[i][0], y + BADGE_OFF[i][1]];
      kids.push(
        s('rect', { x: bx - 16, y: by - 11, width: 32, height: 22, rx: 11, fill: C.bg, stroke: RCOL[i], 'stroke-opacity': 0.7 }),
        s('text', { x: bx, y: by + 4, fill: RCOL[i], 'font-size': 12, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas' }, `d=${deg[i]}`)
      );
    });

    // Adjacency Matrix: column headers + Deg header
    NAMES.forEach((name, c) => {
      kids.push(s('text', {
        x: GX + (c + 0.5) * CW, y: GY - 12,
        fill: RCOL[c], 'font-size': 14, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': '"Segoe UI", Arial, sans-serif'
      }, name));
    });
    kids.push(s('text', {
      x: DEG_CX, y: GY - 12,
      fill: C.amber, 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
    }, 'Deg'));

    // Rows: row headers + 4x4 clickable cells + live degree column
    for (let r = 0; r < 4; r++) {
      const cy = GY + (r + 0.5) * CH;
      kids.push(s('text', {
        x: GX - 10, y: cy + 5,
        fill: RCOL[r], 'font-size': 14, 'font-weight': 700, 'text-anchor': 'end', 'font-family': '"Segoe UI", Arial, sans-serif'
      }, NAMES[r]));

      for (let c = 0; c < 4; c++) {
        const val = adj[r][c];
        const diag = r === c;
        const isLast = lastPair && ((lastPair[0] === r && lastPair[1] === c) || (lastPair[0] === c && lastPair[1] === r));
        const fill = val === 1 ? C.green : (diag ? '#0a0f1f' : C.bg);
        const fillOp = val === 1 ? 0.22 : 0.92;
        const stroke = isLast ? (val === 1 ? C.amber : C.pink) : (val === 1 ? C.green : C.line);
        const g = s('g', { style: 'cursor:pointer' },
          s('rect', {
            x: GX + c * CW + 2, y: GY + r * CH + 2, width: CW - 4, height: CH - 4, rx: 6,
            fill, 'fill-opacity': fillOp, stroke, 'stroke-width': isLast ? 2.6 : 1.4
          }),
          s('text', {
            x: GX + (c + 0.5) * CW, y: cy + 7,
            fill: val === 1 ? C.green : (diag ? '#4b557a' : C.muted),
            'font-size': 20, 'font-weight': val === 1 ? 700 : 500,
            'text-anchor': 'middle', 'font-family': 'Consolas'
          }, String(val))
        );
        g.addEventListener('click', () => togglePair(r, c));
        kids.push(g);
      }

      // Degree value box
      kids.push(
        s('rect', {
          x: DEG_CX - 22, y: GY + r * CH + 6, width: 44, height: CH - 12, rx: 8,
          fill: C.bg, stroke: RCOL[r], 'stroke-width': r === focusRow ? 2 : 1.2, 'stroke-opacity': r === focusRow ? 1 : 0.6
        }),
        s('text', {
          x: DEG_CX, y: cy + 7,
          fill: RCOL[r], 'font-size': 19, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Consolas'
        }, String(deg[r]))
      );
    }

    // Subtle footer hint under matrix
    kids.push(s('text', {
      x: NARROW ? 200 : 516, y: GY + 4 * CH + 26,
      fill: C.muted, 'font-size': 12, 'text-anchor': 'middle', 'font-family': '"Segoe UI", Arial, sans-serif'
    }, 'Diagonal boxes stay 0 (readers are not counted as their own friends)'));

    svg.replaceChildren(...kids);

    // Formula box: Edge list + Matrix counts + Row degree formula
    const pairText = elist.length
      ? elist.map(([a, b]) => `(${NAMES[a]}, ${NAMES[b]})`).join(', ')
      : '(none)';
    const rowStr = adj[focusRow].join(' + ');
    fbox(box, [
      ['Edge list:', C.cyan],
      `  ${pairText}`,
      [`friendships    = ${elist.length}`, C.ink],
      [`ones in matrix = ${ones}  (2 × ${elist.length})`, C.amber],
      [`${NAMES[focusRow]} degree = ${rowStr} = ${deg[focusRow]}`, RCOL[focusRow]],
    ]);

    note.textContent = statusNote;
    chal.update({ adj, deg, edges: elist.length, ones, randomCount });
  }

  draw();
  return () => {};
}
