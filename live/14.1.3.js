// 14.1.3 K-means updates: how groups learn.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const data = [[1, 1], [2, 2], [3, 3], [7, 1], [8, 2], [9, 6]];
  const names = 'ABCDEF';
  const blue = '#60a5fa', orange = '#f99b56';
  const colors = [blue, orange];
  const starts = [[1, 1], [2, 2]];
  let centres = starts.slice();
  let groups = [0, 1, 1, 1, 1, 1];

  const CX = P ? 0 : -3.23;
  const PILL = P ? [0, 1.95, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 3.42, 0] : [3.65, 0.97, 0];
  const UNIT = P ? 0.72 : 0.54;
  const X0 = CX - 5 * UNIT, Y0 = P ? -5.65 : -2.08;
  const point = ([x, y], z = 0) => [X0 + x * UNIT, Y0 + y * UNIT, z];

  const say = (message, color = C.cyan) => showA(message, color, PILL, 18);
  const fadeIn = (m, runTime = 0.28) => new M.FadeIn(m, { runTime });
  const fadeOut = (m, runTime = 0.22) => new M.FadeOut(m, { runTime });
  const line = (start, end, color = C.muted, strokeWidth = 2) =>
    new M.Line({ start, end, color, strokeWidth });
  const label = (text, x, y, color = C.ink, size = 18) =>
    T(text, size, color, true).moveTo([x, y, 0]);
  const sq = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const decimal = n => String(Number(n.toFixed(2)));

  let boxNow = null;
  function fbox(lines, color = C.cyan, runTime = 0.28) {
    const rowHeight = P ? 0.45 : 0.39;
    const texts = lines.map(row => {
      const [text, ink] = Array.isArray(row) ? row : [row, C.ink];
      return T(text, P ? 24 : 21, ink, true);
    });
    const width = Math.max(...texts.map(t => t.getWidth())) + 0.6;
    const height = texts.length * rowHeight + 0.23;
    const card = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    card.setFill(C.card, 0.97);
    card.moveTo(BOXP);
    texts.forEach((t, i) => t.moveTo([
      BOXP[0] - width / 2 + 0.3 + t.getWidth() / 2,
      BOXP[1] + (texts.length - 1 - 2 * i) * rowHeight / 2,
      0,
    ]));
    const box = new M.VGroup(card, ...texts);
    const maxWidth = P ? FW - 1 : 5.65;
    if (width > maxWidth) box.scale(maxWidth / width);
    const animations = boxNow ? [fadeOut(boxNow, runTime), fadeIn(box, runTime)] : [fadeIn(box, runTime)];
    boxNow = box;
    return animations;
  }

  function station(i, color = C.ink) {
    const p = point(data[i]);
    const halo = new M.Dot({ point: p, radius: 0.16, color, strokeWidth: 0 });
    halo.setFill(color, 0.19);
    const dot = new M.Dot({ point: p, radius: 0.08, color });
    dot.setFill(color, 1);
    const off = i === 4 ? [0.4, -0.3] : [-0.42, 0.32];
    const name = label(names[i], p[0] + off[0], p[1] + off[1], color, P ? 21 : 18);
    return new M.VGroup(halo, dot, name);
  }

  function diamond(xy, color, size = 0.19, faint = false) {
    const vertices = [[0, size, 0], [size, 0, 0], [0, -size, 0], [-size, 0, 0]];
    const outline = vertices.map((v, i) => line(v, vertices[(i + 1) % 4], color, faint ? 2 : 3.5));
    const group = new M.VGroup(...outline);
    group.moveTo(point(xy));
    if (faint) outline.forEach(edge => edge.setStrokeOpacity(0.55));
    return group;
  }

  const grid = [];
  for (let x = 0; x <= 10; x++) {
    grid.push(line(point([x, 0]), point([x, 6]), x ? C.grid : C.muted, x ? 1 : 2));
    if (x % 2 === 0) grid.push(label(String(x), X0 + x * UNIT, Y0 - (P ? 0.27 : 0.24), C.muted, P ? 21 : 16));
  }
  for (let y = 0; y <= 6; y++) {
    grid.push(line(point([0, y]), point([10, y]), y ? C.grid : C.muted, y ? 1 : 2));
    if (y > 0 && y % 2 === 0) grid.push(label(String(y), X0 - (P ? 0.27 : 0.24), Y0 + y * UNIT, C.muted, P ? 21 : 16));
  }
  grid.push(label('Departures per hour', CX, Y0 - 0.66, C.ink, P ? 20 : 18));
  grid.push(label('Returns per hour', X0 + 1.2, Y0 + 6 * UNIT + 0.28, C.ink, P ? 20 : 17));
  const axes = new M.VGroup(...grid);
  const dots = data.map((_, i) => station(i));
  const markers = starts.map((p, j) => diamond(p, colors[j]));

  // Keep connectors clear of both the station dot and the centre diamond.
  function connector(from, to, color, dashed = false) {
    const a = point(from, -0.01), b = point(to, -0.01);
    const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
    if (length < 0.29) return null;
    const start = [a[0] + 0.11 * dx / length, a[1] + 0.11 * dy / length, a[2]];
    const end = [b[0] - 0.15 * dx / length, b[1] - 0.15 * dy / length, b[2]];
    const edge = dashed
      ? new M.DashedLine({ start, end, color, strokeWidth: 2 })
      : line(start, end, color, 2);
    edge.setStrokeOpacity(dashed ? 0.68 : 0.54);
    return edge;
  }

  function focus(i, color = C.amber) {
    const ring = new M.Circle({ radius: 0.25, color, strokeWidth: 2 });
    ring.moveTo(point(data[i]));
    return ring;
  }

  let routes = [];
  let guides = [];
  const clearGuides = () => {
    const removals = guides.map(m => fadeOut(m));
    guides = [];
    return removals;
  };

  function drawRoutes() {
    const next = data.map((p, i) => connector(p, centres[groups[i]], colors[groups[i]])).filter(Boolean);
    const animations = [...routes.map(m => fadeOut(m)), ...next.map(m => fadeIn(m))];
    routes = next;
    return animations;
  }

  function assign(i, group) {
    const old = dots[i];
    groups[i] = group;
    dots[i] = station(i, colors[group]);
    return [fadeOut(old), fadeIn(dots[i]), ...drawRoutes()];
  }

  function moveCentre(j, xy) {
    centres[j] = xy;
    return new M.Transform(markers[j], diamond(xy, colors[j]), { runTime: 0.72 });
  }

  async function compareStations() {
    for (let i = 0; i < data.length; i++) {
      const removals = clearGuides();
      const p = data[i];
      const other = 1 - groups[i];
      guides = [focus(i), connector(p, centres[other], colors[other], true)].filter(Boolean);
      const distances = centres.map(q => decimal(Math.sqrt(sq(p, q))));
      await play(...removals, ...guides.map(m => fadeIn(m, 0.32)),
        ...fbox([`Station ${names[i]} · line lengths`, [`To blue:   ${distances[0]}`, blue],
          [`To orange: ${distances[1]}`, orange]], C.cyan, 0.32));
      await until(S(comparisonBeat) + 1 + (i + 1) * 0.65);
    }
  }
  let comparisonBeat = 28;

  // Show one point per completed round, with round zero as the starting value.
  const GX0 = P ? -2.64 : 1.65, GX1 = P ? 2.9 : 5.85;
  const GY0 = P ? -0.15 : -2.46, GY1 = P ? 1.05 : -0.85;
  const gp = (i, loss) => [GX0 + (GX1 - GX0) * i / 4, GY0 + (GY1 - GY0) * loss / 135, 0];
  const chart = [
    line(gp(0, 0), gp(4, 0)), line(gp(0, 0), gp(0, 135)),
    label('Inertia', GX0 + 0.3, GY1 + 0.36, C.ink, P ? 20 : 18),
    label('Round', (GX0 + GX1) / 2, GY0 - (P ? 0.58 : 0.52), C.muted, P ? 20 : 15),
  ];
  for (let i = 0; i <= 4; i++) {
    chart.push(label(String(i), gp(i, 0)[0], GY0 - (P ? 0.27 : 0.23), C.muted, P ? 20 : 15));
  }
  let last = null;
  function plot(i, loss) {
    const p = gp(i, loss);
    const dot = new M.Dot({ point: p, radius: 0.075, color: C.amber });
    dot.setFill(C.amber, 1);
    const value = label(decimal(loss), p[0] + (i === 0 ? 0.42 : 0),
      p[1] + (i === 0 ? 0.07 : (P ? 0.3 : 0.27)), C.amber, P ? 21 : 16);
    const animations = [fadeIn(dot), fadeIn(value)];
    if (last) animations.unshift(new M.Create(line(last, p, C.amber, 3), { runTime: 0.48 }));
    last = p;
    return animations;
  }

  await until(S(0));
  await play(fadeIn(axes), new M.LaggedStart(dots.map(m => fadeIn(m)),
    { lagRatio: 0.23, runTime: 1.3 }), ...say('6 BICYCLE STATIONS'));

  await until(S(1));
  await play(...markers.map(m => fadeIn(m)), ...say('TWO STARTING CENTRES'));

  await until(S(2));
  await play(...fbox([['Blue at A    (1, 1)', blue], ['Orange at B  (2, 2)', orange]]),
    ...markers.map((m, i) => new M.Indicate(m, { color: colors[i], runTime: 0.7 })));

  await until(S(3));
  const neutral = dots.slice();
  data.forEach((_, i) => { dots[i] = station(i, colors[groups[i]]); });
  await play(...neutral.map(m => fadeOut(m)), ...dots.map(m => fadeIn(m)),
    ...fbox([['Blue     A', blue], ['Orange   B C D E F', orange]]));

  await until(S(4));
  guides = [3, 4, 5].map(i => connector(data[i], starts[1], orange, true));
  await play(...guides.map(m => fadeIn(m)), ...say('ORANGE IS FAR FROM D, E AND F', orange));

  await until(S(5));
  await play(...clearGuides(), ...say('WHERE COULD ORANGE MOVE?', orange));

  await until(S(6));
  await play(...fbox([['Orange stations · B C D E F', orange],
    'Departures   2  3  7  8  9', 'Returns      2  3  1  2  6'], orange),
  ...say('SHARE EACH COUNT EQUALLY', orange));

  await until(S(7));
  await play(...fbox(['Equal share of departures', 'Equal share of returns', ['Together: the average position', orange]], orange));

  await until(S(8));
  guides = [connector(starts[1], [5.8, 2.8], orange, true), diamond([5.8, 2.8], orange, 0.19, true)];
  await play(...guides.map(m => fadeIn(m)), ...say('PROPOSED POSITION', orange));

  await until(S(9));
  await play(...clearGuides(), ...say('HOW DO WE MEASURE IMPROVEMENT?'),
    ...fbox(['Start with the original centres.']));

  await until(S(10));
  await play(...drawRoutes(), ...say('JOIN EACH STATION TO ITS CENTRE'),
    ...fbox(['A and B sit on their centres.', 'Their lines have length zero.']));

  await until(S(11));
  const corner = point([7, 2], 0.01), bendStart = point([2.15, 2], 0.01), bendEnd = point([7, 1.12], 0.01);
  guides = [line(bendStart, corner, C.amber, 3), line(corner, bendEnd, C.amber, 3), focus(3)];
  await play(...guides.map(m => fadeIn(m)), ...say('FROM ORANGE TO STATION D', C.amber),
    ...fbox(['5 units across', '1 unit down'], C.amber));

  await until(S(12));
  await play(...fbox(['Across:  5 × 5 = 25', 'Down:    1 × 1 = 1'], C.amber));

  await until(S(13));
  await play(...fbox(['Station D', ['Squared distance = 25 + 1 = 26', C.amber]], C.amber));

  await until(S(14));
  await play(...clearGuides(), ...say('SQUARING GIVES LONG LINES MORE WEIGHT', C.amber),
    ...fbox(['C: squared distance  2', 'D: squared distance 26', 'F: squared distance 65'], C.amber));

  await until(S(15));
  await play(...say('ADD ALL SIX SQUARED DISTANCES', C.amber),
    ...fbox(['A: 0     B: 0     C: 2', 'D: 26    E: 36    F: 65', '0 + 0 + 2 + 26 + 36 + 65'], C.amber));

  await until(S(16));
  await play(...fbox(['0 + 0 + 2 + 26 + 36 + 65', ['Starting total = 129', C.amber]], C.amber));

  await until(S(17));
  await play(...say('SPREAD AROUND THE ASSIGNED CENTRES'),
    new M.LaggedStart(routes.map(m => new M.Indicate(m, { color: C.amber, runTime: 0.65 })),
      { lagRatio: 0.28, runTime: 1.2 }));

  await until(S(18));
  await play(...say('SMALLER INERTIA IS BETTER', C.amber),
    fadeIn(new M.VGroup(...chart)), ...plot(0, 129),
    ...fbox([['Inertia = 129', C.amber], 'Sum of squared distances'], C.amber));

  await until(S(19));
  await play(...say('ROUND 1 · UPDATE THE CENTRES'));

  await until(S(20));
  await play(new M.Indicate(markers[0], { color: blue, runTime: 0.65 }),
    ...fbox([['Blue: station A only', blue], '1 departure, 1 return', 'Blue stays at (1, 1)'], blue));

  await until(S(21));
  await play(...fbox([['Orange: B C D E F', orange], 'Departures', '2 + 3 + 7 + 8 + 9 = 29'], orange));

  await until(S(22));
  await play(...fbox([['Orange departures', orange], '29 ÷ 5 = 5.8'], orange));

  await until(S(23));
  await play(...fbox([['Orange returns', orange], '2 + 3 + 1 + 2 + 6 = 14', '14 ÷ 5 = 2.8'], orange));

  await until(S(24));
  await play(...routes.map(m => fadeOut(m)), moveCentre(1, [5.8, 2.8]),
    ...say('MOVE THE ORANGE CENTRE', orange),
    ...fbox([['Orange   (2, 2) → (5.8, 2.8)', orange]], orange));
  routes = [];

  await until(S(25));
  await play(...drawRoutes(), ...fbox(['A: 0      B: 15.08   C: 7.88',
    'D: 4.68   E: 5.48    F: 20.48'], C.amber));

  await until(S(26));
  await play(...plot(1, 53.6), ...say('ROUND 1 COMPLETE', C.amber),
    ...fbox([['Inertia: 129 → 53.6', C.amber]], C.amber));

  await until(S(27));
  await play(...say('WOULD ANY STATION CHANGE GROUP?'));

  await until(S(28));
  await play(...say('ROUND 2 · COMPARE BOTH CENTRES'));
  await compareStations();

  await until(S(29));
  await play(...clearGuides(), ...assign(1, 0), ...say('B MOVES TO BLUE', blue),
    ...fbox(['Station B · line lengths', ['To blue:   1.41', blue], ['To orange: 3.88', orange]]));

  await until(S(30));
  await play(...fbox([['Blue     A B', blue], ['Orange   C D E F', orange]]));

  await until(S(31));
  await play(...fbox(['Centres stay where they are.', ['Inertia: 53.6 → 40.52', C.amber]], C.amber));

  await until(S(32));
  await play(...say('FIND THE NEW BLUE MEAN', blue),
    ...fbox([['Blue: A B', blue], 'Departures  1 + 2 = 3', 'Returns     1 + 2 = 3', 'Share between 2 stations'], blue));

  await until(S(33));
  await play(...fbox([['Blue: A B', blue], 'Departures  3 ÷ 2 = 1.5',
    'Returns     3 ÷ 2 = 1.5', ['New centre  (1.5, 1.5)', blue]], blue));

  await until(S(34));
  await play(...say('FIND THE NEW ORANGE MEAN', orange),
    ...fbox([['Orange: C D E F', orange], 'Departures  3 + 7 + 8 + 9 = 27', 'Returns     3 + 1 + 2 + 6 = 12'], orange));

  await until(S(35));
  await play(...fbox([['Orange: C D E F', orange], 'Departures  27 ÷ 4 = 6.75',
    'Returns     12 ÷ 4 = 3', ['New centre  (6.75, 3)', orange]], orange));

  await until(S(36));
  await play(...routes.map(m => fadeOut(m)), ...say('MOVE BOTH CENTRES TO THEIR MEANS'),
    new M.LaggedStart([moveCentre(0, [1.5, 1.5]), moveCentre(1, [6.75, 3])],
      { lagRatio: 0.95, runTime: 1.45 }));
  routes = [];
  await play(...drawRoutes(), ...plot(2, 35.75),
    ...fbox([['Blue       (1.5, 1.5)', blue], ['Orange     (6.75, 3)', orange],
      ['Inertia: 40.52 → 35.75', C.amber]], C.amber));

  await until(S(37));
  comparisonBeat = 37;
  await play(...say('ROUND 3 · COMPARE BOTH CENTRES'));
  await compareStations();

  await until(S(38));
  await play(...clearGuides(), ...assign(2, 0), ...say('C MOVES TO BLUE', blue),
    ...fbox(['Station C · line lengths', ['To blue:   2.12', blue], ['To orange: 3.75', orange]]));

  await until(S(39));
  await play(...fbox([['Blue     A B C', blue], ['Orange   D E F', orange],
    ['Inertia: 35.75 → ≈26.19', C.amber]], C.amber));

  await until(S(40));
  await play(...say('SHARE AMONG THREE BLUE STATIONS', blue),
    ...fbox([['Blue: A B C', blue], 'Departures  1 + 2 + 3 = 6', 'Returns     1 + 2 + 3 = 6'], blue));

  await until(S(41));
  await play(...routes.map(m => fadeOut(m)), moveCentre(0, [2, 2]),
    ...fbox(['Departures  6 ÷ 3 = 2', 'Returns     6 ÷ 3 = 2', ['Blue moves to (2, 2)', blue]], blue));
  routes = [];
  await play(...drawRoutes());

  await until(S(42));
  await play(...say('SHARE AMONG THREE ORANGE STATIONS', orange),
    ...fbox([['Orange: D E F', orange], 'Departures  7 + 8 + 9 = 24',
      'Returns     1 + 2 + 6 = 9'], orange));

  await until(S(43));
  await play(...routes.map(m => fadeOut(m)), moveCentre(1, [8, 3]),
    ...fbox(['Departures  24 ÷ 3 = 8', 'Returns      9 ÷ 3 = 3', ['Orange moves to (8, 3)', orange]], orange));
  routes = [];
  await play(...drawRoutes());

  await until(S(44));
  await play(...plot(3, 20), ...say('ROUND 3 COMPLETE', C.amber),
    ...fbox(['2 + 0 + 2 + 5 + 1 + 10', ['Inertia = 20', C.amber]], C.amber));

  await until(S(45));
  await play(...say('ROUND 4 · THE GROUPS AND CENTRES STAY'),
    ...fbox([['A B C     (2, 2)', blue], ['D E F     (8, 3)', orange], 'Inertia stays at 20']),
    new M.LaggedStart(dots.map((m, i) => new M.Indicate(m, { color: colors[groups[i]], runTime: 0.34 })),
      { lagRatio: 0.38, runTime: 0.85 }));
  await play(...plot(4, 20));

  await until(S(46));
  await play(...say('INERTIA FELL, THEN LEVELLED OFF', C.amber),
    ...fbox(['Start     129', 'Rounds 1–4',
      ['53.6 → 35.75 → 20 → 20', C.amber]], C.amber));

  await until(S(47));
  await play(...say('ONE COMPLETE ROUND = ONE ITERATION'),
    ...fbox(['1. Assign each station.', '2. Move each centre to its mean.']));

  await until(S(48));
  await play(...say('THE CENTRE UPDATE'),
    ...fbox([['Centre position', C.cyan], '= sum of group positions', '  ÷ station count']));

  await until(S(49));
  await play(...fbox([['Orange: D E F', orange], 'Departures  24 ÷ 3 = 8', 'Returns      9 ÷ 3 = 3',
    ['Centre     (8, 3)', orange]], orange));

  await until(S(50));
  await play(...say('K-MEANS LEARNS BY REPEATING'), ...fbox(['Assign → update → repeat']));

  await until(S(51));
  await play(...say('TWO GROUPS OF BICYCLE STATIONS'),
    ...fbox([['Blue     A B C', blue], ['Orange   D E F', orange]]),
    new M.LaggedStart(dots.map((m, i) => new M.Indicate(m, { color: colors[groups[i]], runTime: 0.42 })),
      { lagRatio: 0.26, runTime: 1.15 }));

  await until(S(52));
  await play(...say('THE GROUPS HAVE SETTLED', C.amber),
    ...fbox(['The centres stopped moving.', ['Could another start give', C.amber], ['smaller inertia?', C.amber]], C.amber));

  await until(S(53));
  guides = [diamond(data[3], C.violet, 0.21, true), diamond(data[5], C.violet, 0.21, true)];
  await play(...guides.map(m => fadeIn(m)), ...say('NEXT · TRY DIFFERENT STARTS', C.violet),
    ...fbox(['This lesson: start at A and B', ['Next: try starting at D and F', C.violet]], C.violet));

  await until(S(54));
  await play(...clearGuides(), ...say('K-MEANS RECAP'),
    ...fbox(['Assign to the nearest centre.', 'Move each centre to its mean.', 'Repeat until nothing changes.']));
}
