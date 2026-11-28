// 17.4.8 Graph neural networks: stations share messages with their neighbors (script.v3.md).
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play, net } = L;
  // order down the track: Lake – Oak – Central – Hill
  const names = ['Lake', 'Oak', 'Central', 'Hill'];
  const cols = [C.green, C.amber, C.cyan, C.violet];
  const nums = [6, 1, 3, 3];
  const after = ['3.5', '2.75', '2.5', '3'];        // round 1: 0.5 × own + 0.5 × neighbors' mean
  const LAKE = 0, OAK = 1, CEN = 2, HILL = 3;
  const CX = P ? 0 : -2.6;
  const SIDE = 4.35;                                   // laptop: right-hand panel
  const PILL = [CX, P ? 3.65 : 1.85, 0];
  const BOXP = P ? [0, -5.35, 0] : [SIDE, 0.55, 0];
  const NOTEP = P ? [0, -3.85, 0] : [SIDE, -1.35, 0];
  const say = (text, color = C.cyan) => showA(text, color, PILL, P ? 17 : 19);

  const label = (text, size, color, x, y, mono = false) => T(text, size, color, mono).moveTo([x, y, 0]);
  const panel = (x, y, width, height, color, fill = C.card, opacity = 0.95) => {
    const shape = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    shape.setFill(fill, opacity);
    return shape.moveTo([x, y, 0]);
  };
  const fade = o => new M.FadeIn(o, { runTime: 0.28 });
  const out = o => new M.FadeOut(o, { runTime: 0.28 });
  const mark = (o, color = C.amber) => new M.Indicate(o, { color, runTime: 0.42 });
  const cascade = a => new M.LaggedStart(a, { lagRatio: 0.12, runTime: 0.65 });

  let detail = null;
  function note(text, color = C.ink) {
    const next = text ? label(text, 24, color, NOTEP[0], NOTEP[1]) : null;
    const max = P ? FW - 0.8 : 4.9;
    if (next && next.getWidth() > max) next.scale(max / next.getWidth());
    const a = detail ? [out(detail)] : [];
    if (next) a.push(fade(next));
    detail = next;
    return a;
  }

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const a = boxNow ? [out(boxNow)] : [];
    boxNow = null;
    if (!lines.length) return a;
    const rows = lines.map(l => Array.isArray(l) ? l : [l, C.ink]);
    const texts = rows.map(([s, ink]) => T(s, P ? 24 : 23, ink, true));
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.56;
    const lh = 0.44, height = rows.length * lh + 0.3;
    const [x, y] = BOXP;
    const frame = panel(x, y, width, height, color);
    texts.forEach((t, i) => t.moveTo([x - width / 2 + 0.28 + t.getWidth() / 2, y + (rows.length - 1) * lh / 2 - i * lh, 0]));
    boxNow = new M.VGroup(frame, ...texts);
    const maxW = P ? FW - 0.9 : 4.9;
    if (width > maxW) boxNow.scale(maxW / width);
    boxNow.moveTo(BOXP);
    a.push(fade(boxNow));
    return a;
  }

  // network: column 0 = stations on the track map, column 1 = updated station numbers
  const r = P ? 0.45 : 0.4;
  const N = net({ layers: [4, 4], center: P ? [0, 0.0, 0] : [CX, -0.75, 0], width: P ? 4.2 : 4.4, height: P ? 4.6 : 2.85, r });
  // coloured ring, dark fill: the numbers inside stay readable
  N.nodes.forEach(col => col.forEach((c, i) => { c.setColor(cols[i]); c.setFill(C.card, 0.95); }));
  const node = (l, i) => N.nodes[l][i];
  const nameTags = names.map((s, i) => { const p = N.pos(0, i); const t = T(s, 17, cols[i]); return t.moveTo([p[0] - r - 0.2 - t.getWidth() / 2, p[1], 0]); });
  const newTags = names.map((s, i) => { const p = N.pos(1, i); const t = T(s, 16, cols[i]); return t.moveTo([p[0] + r + 0.2 + t.getWidth() / 2, p[1], 0]); });
  const roundHead = [label('start', 17, C.muted, N.pos(0, 0)[0], N.pos(0, 0)[1] + r + 0.28),
    label('after round 1', 17, C.muted, N.pos(1, 0)[0], N.pos(1, 0)[1] + r + 0.28)];
  const tracks = [[LAKE, OAK], [OAK, CEN], [CEN, HILL]].map(([a, b]) => {
    const pa = N.pos(0, a), pb = N.pos(0, b);
    return new M.Line({ start: [pa[0], pa[1] - r, 0], end: [pb[0], pb[1] + r, 0], color: C.ink, strokeWidth: 4 });
  });
  // flash the real line: ShowPassingFlash removes its own pulse (a copy would stay on screen)
  const flashTrack = (k, col = C.amber) => new M.ShowPassingFlash(tracks[k], { color: col, strokeWidth: 7, timeWidth: 0.5 });
  const pulse = (i, j, col = C.amber) => new M.ShowPassingFlash(N.edges[0][i][j], { color: col, strokeWidth: 6, timeWidth: 0.5 });
  const travel = (from, to, s, col) => {
    const a = N.pos(0, from), b = N.pos(1, to);
    const m = label(s, 20, col, a[0] + r + 0.25, a[1] + 0.25, true);
    const end = label(s, 20, col, b[0] - r - 0.35, b[1] + (from < to ? 0.32 : -0.32), true);
    return { m, end };
  };
  // round-1 connections: each station to itself and to its neighbors
  const links = [[LAKE, LAKE], [LAKE, OAK], [OAK, LAKE], [OAK, OAK], [OAK, CEN], [CEN, OAK], [CEN, CEN], [CEN, HILL], [HILL, CEN], [HILL, HILL]];

  await until(S(0));
  await play(fade(node(0, CEN)), fade(nameTags[CEN]), ...say('THE TEMPERATURE AROUND CENTRAL'),
    ...note('The temperature around Central', C.cyan));

  await until(S(1));
  await play(mark(node(0, CEN), C.cyan), ...note('Other stations know useful things too'));

  await until(S(2));
  await play(cascade([LAKE, OAK, HILL].map(i => fade(node(0, i)))), ...note('Four stations as circles'), ...say('FOUR STATIONS ON A MAP'));

  await until(S(3));
  await play(cascade([LAKE, OAK, HILL].map(i => fade(nameTags[i]))), ...say('CENTRAL · OAK · HILL · LAKE'),
    ...note('Central, Oak, Hill and Lake'));

  await until(S(4));
  await play(...N.value(0, CEN, '23°', C.cyan), ...note('9:30 readings  ·  Central 23°C', C.cyan));
  await until(S(5));
  await play(...N.value(0, OAK, '21°', C.amber), ...note('Oak 21°C', C.amber));
  await until(S(6));
  await play(...N.value(0, HILL, '23°', C.violet), ...note('Hill 23°C', C.violet));
  await until(S(7));
  await play(...N.value(0, LAKE, '26°', C.green), ...note('Lake 26°C', C.green));

  await until(S(8));
  await play(...note('23 − 20 = 3   ·   26 − 20 = 6', C.amber), ...say('SUBTRACT 20 FROM EACH', C.amber));

  await until(S(9));
  await play(...nums.map((v, i) => N.value(0, i, String(v), cols[i])).flat(), ...note('Central 3 · Oak 1 · Hill 3 · Lake 6'));

  await until(S(10));
  await play(...note('Tracks join the stations'), ...say('DRAW THE TRACKS'));
  await until(S(11));
  await play(new M.Create(tracks[0], { runTime: 0.4 }), ...note('Lake – Oak'));
  await until(S(12));
  await play(new M.Create(tracks[1], { runTime: 0.4 }), ...note('Oak – Central'));
  await until(S(13));
  await play(new M.Create(tracks[2], { runTime: 0.4 }), ...note('Central – Hill'));

  await until(S(14));
  await play(...note('Objects + lines = a graph', C.violet), ...say('OBJECTS + LINES = A GRAPH', C.violet));

  await until(S(15));
  await play(cascade(N.nodes[0].map(n => mark(n, C.violet))), ...say('EACH OBJECT = A NODE', C.violet),
    ...note('Each station = a node', C.violet));

  await until(S(16));
  await play(cascade(tracks.map(t => mark(t, C.violet))), ...say('EACH CONNECTION = AN EDGE', C.violet),
    ...note('Each track = an edge', C.violet));

  await until(S(17));
  await play(mark(tracks[1]), ...say('DIRECT LINK = NEIGHBORS', C.violet), ...note('Joined by one edge = neighbors', C.violet));

  await until(S(18));
  await play(mark(node(0, OAK)), mark(node(0, HILL), C.violet), mark(node(0, LAKE), C.pink),
    ...note('Central’s neighbors: Oak and Hill, not Lake', C.cyan));

  await until(S(19));
  await play(...tracks.map((_, k) => flashTrack(k)), ...note('Share with neighbors, then update'), ...say('STATIONS SHARE INFORMATION'));

  const pO = N.pos(0, OAK), pC = N.pos(0, CEN);
  const msgTag = label('message: 1', 17, C.amber, pO[0] + r + 0.85, (pO[1] + pC[1]) / 2);
  await until(S(20));
  await play(flashTrack(1), fade(msgTag), ...say('MESSAGE = NUMBER SENT ALONG AN EDGE', C.amber),
    ...note('A number sent along an edge = a message', C.amber));

  await until(S(21));
  await play(...say('GRAPH NEURAL NETWORK', C.violet), ...note('Learns using these connections', C.violet));

  await until(S(22));
  await play(out(msgTag), mark(node(0, CEN), C.cyan), ...say('FOLLOW CENTRAL'), ...note('Follow what Central receives', C.cyan));

  await until(S(23));
  await play(cascade(N.nodes[0].map(n => mark(n, C.cyan))), ...note('Start: each station holds its own number'));

  await until(S(24));
  await play(...note('Number describing a node = representation', C.violet), ...say('REPRESENTATION', C.violet));

  await until(S(25));
  await play(...note('Several numbers = an embedding', C.violet), ...say('ALSO CALLED AN EMBEDDING', C.violet));

  await until(S(26));
  await play(cascade(N.nodes[1].map(fade)), fade(roundHead[0]), fade(roundHead[1]), cascade(newTags.map(fade)),
    ...note('Second group: the updated numbers'), ...say('SECOND GROUP: UPDATED NUMBERS'));

  await until(S(27));
  await play(cascade(links.map(([i, j]) => new M.Create(N.edges[0][i][j], { runTime: 0.3 }))),
    ...note('Round 1: send your number to your neighbors', C.amber));

  const fromOak = travel(OAK, CEN, '1', C.amber);
  const fromHill = travel(HILL, CEN, '3', C.violet);
  await until(S(28));
  await play(fade(fromOak.m), pulse(OAK, CEN), ...say('OAK SENDS 1', C.amber), ...note('Oak → Central: 1', C.amber));
  await play(new M.Transform(fromOak.m, fromOak.end));

  await until(S(29));
  await play(fade(fromHill.m), pulse(HILL, CEN, C.violet), ...say('HILL SENDS 3', C.violet), ...note('Hill → Central: 3', C.violet));
  await play(new M.Transform(fromHill.m, fromHill.end));

  await until(S(30));
  await play(mark(fromOak.m), mark(fromHill.m, C.violet), ...note('Messages to Central: 1 and 3', C.cyan));

  await until(S(31));
  await play(...say('ONE NUMBER FOR BOTH NEIGHBORS'), ...note('One number for both neighbors?'));

  await until(S(32));
  await play(...note('Mean = add them, divide by how many', C.green), ...say('TAKE THE MEAN', C.green));

  await until(S(33));
  await play(...note('1 + 3 = 4', C.green));

  await until(S(34));
  await play(...note('4 ÷ 2 = 2', C.green));

  await until(S(35));
  await play(...note('Neighbors’ mean = 2', C.green), ...say('NEIGHBORS’ MEAN = 2', C.green));

  await until(S(36));
  await play(pulse(CEN, CEN, C.cyan), mark(node(0, CEN), C.cyan), ...note('Central’s own number = 3', C.cyan));

  await until(S(37));
  await play(...note('Own number: 0.5  ·  neighbors’ mean: 0.5', C.amber), ...say('EQUAL SHARES', C.amber));

  await until(S(38));
  await play(...note('3 × 0.5 = 1.5', C.cyan));

  await until(S(39));
  await play(...note('2 × 0.5 = 1', C.green));

  await until(S(40));
  await play(out(fromOak.m), out(fromHill.m), ...N.value(1, CEN, '2.5', C.cyan), ...note('1.5 + 1 = 2.5', C.amber));

  await until(S(41));
  await play(mark(node(1, CEN), C.cyan), ...say('CENTRAL’S NEW REPRESENTATION: 2.5'), ...note('Central’s new representation: 2.5', C.cyan));

  await until(S(42));
  await play(...note('Central + its neighbors in one number'));

  await until(S(43));
  await play(mark(node(0, CEN), C.cyan), ...note('Real temperature still 23°C', C.muted));

  await until(S(44));
  await play(...note(''), ...say('A SHORT FORMULA'), ...fbox([['new representation =', C.cyan]]));

  await until(S(45));
  await play(...fbox([['new representation =', C.cyan], '  0.5 × own number', '+ 0.5 × neighbors’ mean', '= 0.5 × 3 + 0.5 × 2 = 2.5']));

  await until(S(46));
  await play(...[LAKE, OAK, HILL].map(i => N.value(1, i, after[i], cols[i])).flat(),
    ...note('Training learns the mix · same rule for all', C.violet), ...say('REAL GNNs LEARN THE MIX', C.violet));

  await until(S(47));
  await play(...fbox([]), mark(node(0, LAKE), C.green), ...note('What about Lake’s 6?', C.green));

  await until(S(48));
  await play(pulse(LAKE, OAK, C.green), mark(node(1, OAK), C.green), ...note('Round 1: Lake reaches Oak, not Central', C.green));

  await until(S(49));
  await play(new M.LaggedStart([pulse(LAKE, OAK, C.green), pulse(OAK, CEN, C.green)], { lagRatio: 0.9, runTime: 1.4 }),
    ...note('Round 2: Oak carries it on to Central', C.green), ...say('ROUND 2', C.green));

  await until(S(50));
  await play(...tracks.map((_, k) => flashTrack(k, C.green)), ...note('More rounds, further travel', C.green),
    ...say('MORE ROUNDS, FURTHER TRAVEL', C.green));

  await until(S(51));
  await play(...note('Predict with links between objects'), ...say('GNNs USE CONNECTIONS'));

  await until(S(52));
  await play(...note('A link is not always useful', C.pink), ...say('NOT EVERY NEIGHBOR HELPS', C.pink));

  await until(S(53));
  await play(...note('Too many rounds: nodes look alike', C.pink), ...say('TOO MANY ROUNDS', C.pink));

  await until(S(54));
  await play(...note('Own number + neighbors’ messages', C.violet), mark(node(1, CEN), C.cyan),
    ...say('OWN + NEIGHBORS’ MESSAGES', C.violet));
}
