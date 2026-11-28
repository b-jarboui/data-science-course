// 14.1.2 K-means assignments: finding the nearest centre.
// Beat i = sentence i (0-based). Runs in site/live/engine.js.
export default async function (L) {
  const { M, P, FW, C, S, T, showA, until, play } = L;
  const stations = [[1, 1], [2, 2], [3, 3], [7, 1], [8, 2], [9, 6]];
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const blue = '#60a5fa', orange = '#fb923c';
  const CX = P ? 0 : -2.6;
  const unit = P ? 0.66 : 0.62;
  const X0 = CX - 5 * unit, Y0 = P ? -5.6 : -3.05;
  const PILL = P ? [0, 0.75, 0] : [CX, 1.85, 0];
  const BOXP = P ? [0, 2.75, 0] : [4.3, -0.3, 0];
  const xy = (x, y) => [X0 + x * unit, Y0 + y * unit, 0];
  const positions = stations.map(([x, y]) => xy(x, y));
  const say = (s, c = C.cyan) => showA(s, c, PILL);
  const appear = obj => new M.FadeIn(obj, { runTime: 0.48 });
  const remove = obj => new M.FadeOut(obj, { runTime: 0.38 });
  const create = obj => new M.Create(obj, { runTime: 0.56 });
  const pointOut = (obj, color) => new M.Indicate(obj, { color, scaleFactor: 1.08, runTime: 0.68 });
  const text = (s, size, color, p, mono = false, bold = false) =>
    T(s, size, color, mono, bold).moveTo(p);

  let boxNow = null;
  function fbox(lines, color = C.cyan) {
    const size = P ? 26 : 22, lh = P ? 0.5 : 0.44;
    const labels = lines.map(row => {
      const [s, c] = Array.isArray(row) ? row : [row, C.ink];
      return T(s, size, c, true);
    });
    const width = Math.max(...labels.map(t => t.getWidth())) + 0.64;
    const height = lines.length * lh + 0.31;
    const frame = new M.RoundedRectangle({ width, height, cornerRadius: 0.16, color, strokeWidth: 2 });
    frame.setFill(C.card, 0.95);
    frame.moveTo(BOXP);
    labels.forEach((label, i) => label.moveTo([
      BOXP[0] - width / 2 + 0.32 + label.getWidth() / 2,
      BOXP[1] + ((labels.length - 1) / 2 - i) * lh,
      0,
    ]));
    const card = new M.VGroup(frame, ...labels);
    const maxWidth = P ? FW - 1.2 : 4;
    if (width > maxWidth) card.scale(maxWidth / width).moveTo(BOXP);
    const animations = boxNow ? [remove(boxNow), appear(card)] : [appear(card)];
    boxNow = card;
    return animations;
  }

  function clearBox() {
    const old = boxNow;
    boxNow = null;
    return old ? [remove(old)] : [];
  }

  function line(start, end, color, strokeWidth = 2) {
    return new M.Line({ start, end, color, strokeWidth });
  }

  function outline(p, radius, color, strokeWidth = 2) {
    const ring = new M.Circle({ radius, color, strokeWidth });
    ring.setFill(color, 0);
    return ring.moveTo(p);
  }

  function station(i, color = C.ink) {
    const [x, y] = positions[i];
    const halo = new M.Dot({ point: positions[i], radius: 0.18, color, strokeWidth: 0 });
    halo.setFill(color, 0.18);
    const dot = new M.Dot({ point: positions[i], radius: 0.077, color, strokeWidth: 0 });
    dot.setFill(color, 1);
    const label = text(letters[i], P ? 22 : 18, C.ink, [x - 0.38, y + 0.4, 0], true, true);
    return new M.VGroup(halo, dot, label);
  }

  function flag([x, y], numeral) {
    const pole = line([x, y, 0], [x, y + 0.49, 0], C.ink);
    const pennant = new M.Polygon({
      vertices: [[x, y + 0.49, 0], [x + 0.29, y + 0.4, 0], [x, y + 0.29, 0]],
      color: C.ink, strokeWidth: 1,
    });
    pennant.setFill(C.ink, 0.86);
    const label = text(numeral, 16, C.ink, [x - 0.18, y + 0.38, 0], true, true);
    return new M.VGroup(pole, pennant, label);
  }

  function diamond([x, y], color) {
    const make = (r, strokeWidth, opacity) => {
      const shape = new M.Polygon({
        vertices: [[x, y + r, 0], [x + r, y, 0], [x, y - r, 0], [x - r, y, 0]],
        color, strokeWidth,
      });
      shape.setFill(color, 0);
      shape.setStrokeOpacity(opacity);
      return shape;
    };
    return new M.VGroup(make(0.236, 6, 0.22), make(0.205, 2.6, 1));
  }

  const opening = letters.map((letter, i) => {
    // Phone: two rows of three big signs fill the middle and lower part of the frame.
    const x = P ? (i % 3 - 1) * 2.4 : (i - 2.5) * 1.08, y = P ? (i < 3 ? -1.4 : -4.4) : -0.38;
    const sign = new M.RoundedRectangle({
      width: 0.59, height: 0.52, cornerRadius: 0.09, color: C.ink, strokeWidth: 2,
    });
    sign.setFill(C.card, 0.95);
    sign.moveTo([x, y, 0]);
    const post = line([x, y - 0.26, 0], [x, y - 0.61, 0], C.muted);
    const base = line([x - 0.24, y - 0.61, 0], [x + 0.24, y - 0.61, 0], C.muted);
    return new M.VGroup(post, base, sign, text(letter, 20, C.ink, [x, y, 0], true, true)).scale(P ? 2.3 : 1.2);
  });

  await until(S(0));
  await play(new M.LaggedStart(opening.map(appear), { lagRatio: 0.12, runTime: 0.9 }), ...say('SIX BICYCLE STATIONS'));
  await until(S(1));
  await play(...say('PLAN FOR TWO GROUPS'), ...fbox(['Group 1     Group 2', '   ?           ?']));
  await until(S(2));
  await play(...say('WHICH STATIONS BELONG TOGETHER?', C.amber));

  const grid = [];
  for (let x = 0; x <= 10; x++) {
    grid.push(line(xy(x, 0), xy(x, 6.25), x ? C.line : C.muted, x ? 1 : 2));
    grid.push(text(String(x), P ? 21 : 15, C.muted, [xy(x, 0)[0], Y0 - (P ? 0.26 : 0.22), 0], true));
  }
  for (let y = 1; y <= 6; y++) {
    grid.push(line(xy(0, y), xy(10, y), C.line, 1));
    grid.push(text(String(y), P ? 21 : 15, C.muted, [X0 - (P ? 0.28 : 0.24), xy(0, y)[1], 0], true));
  }
  grid.push(line(xy(0, 0), xy(10, 0), C.muted));
  grid.push(text('Departures →', P ? 21 : 17, C.ink, [CX, Y0 - 0.58, 0]));
  grid.push(text('↑ Returns', P ? 21 : 17, C.ink, [X0 + 0.5, xy(0, 6.25)[1] + 0.28, 0]));

  await until(S(3));
  await play(...opening.map(remove), ...clearBox(), appear(new M.VGroup(...grid)), ...say('ONE MORNING HOUR'));

  const markers = stations.map((_, i) => station(i));
  const stationBeats = [S(4), S(5), S(6), S(7), S(8), S(9)];
  for (let i = 0; i < stations.length; i++) {
    await until(stationBeats[i]);
    const [x, y] = stations[i];
    await play(appear(markers[i]), ...fbox([`Station ${letters[i]}`, `${x} out   ${y} back`]));
  }
  await until(S(10));
  await play(...clearBox(), ...say('SIX DOTS, GROUPS STILL UNKNOWN'));

  const trialPoints = [xy(1, 5), xy(7, 5)];
  const flags = trialPoints.map((p, i) => flag(p, String(i + 1)));
  await until(S(11));
  await play(appear(flags[0]), appear(flags[1]), ...say('PLACE TWO FLAGS'));
  await until(S(12));
  await play(...fbox(['One flag per group', 'Flag = meeting place']));
  const examplePaths = trialPoints.map((p, i) =>
    line(positions[2], p, i === 0 ? C.amber : C.muted, i === 0 ? 3 : 2));
  await until(S(13));
  await play(...examplePaths.map(create), ...say('JOIN THE CLOSEST FLAG', C.amber), ...clearBox());

  const cluster = new M.RoundedRectangle({
    width: 2 * unit + 0.66, height: 2 * unit + 0.65,
    cornerRadius: 0.2, color: C.violet, strokeWidth: 2,
  }).moveTo([positions[1][0] + 0.05, positions[1][1] + 0.04, 0]);
  await until(S(14));
  await play(...examplePaths.map(remove), create(cluster), ...say('CLUSTER = A GROUP OF NEARBY DOTS', C.violet));
  await until(S(15));
  await play(remove(cluster), ...say('CENTROID = TEMPORARY GROUP CENTRE'));

  await until(S(16));
  await play(new M.Transform(flags[0], flag(positions[0], '1'), { runTime: 0.65 }), ...say('FIRST FLAG AT A'));
  await until(S(17));
  await play(new M.Transform(flags[1], flag(positions[1], '2'), { runTime: 0.65 }), ...say('SECOND FLAG AT B'));
  const centres = [diamond(positions[0], blue), diamond(positions[1], orange)];
  await until(S(18));
  await play(...flags.map(remove), ...centres.map(appear),
    ...fbox([['Blue centre at A', blue], ['Orange centre at B', orange]]));
  await until(S(19));
  await play(...say('TWO GROUPS'), ...fbox(['Number of groups', '2']));
  await until(S(20));
  await play(...fbox(['k = number of groups']));
  await until(S(21));
  await play(...fbox(['k = 2'], C.amber));
  await until(S(22));
  await play(...clearBox(), ...say('COMPARE THE TWO DISTANCES'));

  // Distances are in grid units. A ring marks a line of length zero.
  const distances = stations.map(([x, y]) => stations.slice(0, 2).map(([u, v]) => Math.hypot(x - u, y - v)));
  const names = ['Blue', 'Orange'], colors = [blue, orange];
  const distanceRows = (i, shown) => [`Station ${letters[i]}`, ...shown.map(j => {
    const value = distances[i][j];
    const relation = Number.isInteger(value) ? `= ${value}` : `≈ ${value.toFixed(2)}`;
    return [`${names[j]} ${relation}`, colors[j]];
  })];

  let guides = [];
  function compare(i) {
    const start = positions[i];
    const ends = positions.slice(0, 2);
    const highlight = outline(start, 0.31, C.ink, 2);
    const paths = ends.map((end, j) => {
      if (i === j) return outline(start, 0.25, colors[j], 3);
      if (j === 0) return line(start, end, blue, 3.4);
      return new M.DashedLine({ start, end, color: orange, strokeWidth: 2.6 });
    });
    guides = [highlight, ...paths];
    return guides.map(create);
  }

  function join(i) {
    const j = distances[i][0] <= distances[i][1] ? 0 : 1;
    const animations = [
      ...guides.map(remove),
      new M.Transform(markers[i], station(i, colors[j]), { runTime: 0.48 }),
      ...say(`${letters[i]} JOINS ${names[j].toUpperCase()}`, colors[j]),
    ];
    guides = [];
    return animations;
  }

  await until(S(23));
  await play(...compare(0), ...say('START WITH STATION A'));
  await until(S(24));
  await play(pointOut(guides[1], blue), ...fbox(distanceRows(0, [0])));
  await until(S(25));
  await play(pointOut(guides[2], orange), ...fbox(distanceRows(0, [0, 1])));
  await until(S(26));
  await play(...join(0));

  await until(S(27));
  await play(...compare(1), ...say('NOW STATION B'), ...clearBox());
  await until(S(28));
  await play(pointOut(guides[1], blue), ...fbox(distanceRows(1, [0])));
  await until(S(29));
  await play(pointOut(guides[2], orange), ...fbox(distanceRows(1, [0, 1])));
  await until(S(30));
  await play(...join(1));

  for (let i = 2; i < stations.length; i++) {
    const beat = 31 + 2 * (i - 2);
    await until(S(beat));
    await play(...compare(i), ...say(`COMPARE STATION ${letters[i]}`), ...fbox(distanceRows(i, [0, 1])));
    await until(S(beat + 1));
    await play(...join(i));
  }

  await until(S(39));
  await play(...say('OUR FIRST GROUPING'), ...fbox([['Blue: 1 station', blue], ['Orange: 5 stations', orange]]));
  await until(S(40));
  await play(...say('ASSIGNMENT'), ...fbox(['Give each station', 'a group']));
  await until(S(41));
  await play(...fbox(['Chosen group = group with', 'the smallest distance'], C.amber));
  await until(S(42));
  await play(...centres.map((centre, i) => pointOut(centre, colors[i])), ...say('COMPARE WITH THE SAME TWO CENTRES'));
  await until(S(43));
  await play(...say('CENTRES STAY AT A AND B'), ...fbox([['Blue at (1, 1)', blue], ['Orange at (2, 2)', orange]]));
  await until(S(44));
  await play(...say('K-MEANS · STEP 1'), ...fbox(['Assign to the nearest centre']));
  await until(S(45));
  await play(...say('K-MEANS'), ...fbox(['k = number of groups']));
  await until(S(46));
  await play(...fbox(['means = group averages', 'Find them in the next lesson']));
  await until(S(47));
  await play(...say('DISTANCES HELP US FIND GROUPS'), ...clearBox());
  await until(S(48));
  await play(new M.LaggedStart(markers.slice(1).map(obj => pointOut(obj, orange)),
    { lagRatio: 0.13, runTime: 0.9 }), ...say('LOOK AT THE ORANGE GROUP', orange));

  const longPaths = positions.slice(3).map(p =>
    new M.DashedLine({ start: positions[1], end: p, color: orange, strokeWidth: 2.6 }));
  await until(S(49));
  await play(...longPaths.map(create), ...say('SEVERAL STATIONS ARE FAR FROM B', orange));
  await until(S(50));
  await play(...say('THE FIRST CENTRES WERE GUESSES', C.amber), ...fbox(['First groups can change'], C.amber));
  await until(S(51));
  await play(...longPaths.map(remove), ...say('NEXT: USE THE STATIONS'),
    ...fbox(['Stations in each group', 'help find a better centre']));
  await until(S(52));
  await play(...say('ASSIGNMENT'), ...fbox(['Each station joins its', 'nearest current centre'], C.green));
}
